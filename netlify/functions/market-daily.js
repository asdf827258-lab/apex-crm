/* ════════════════════════════════════════════════════════════════════════
   APEX 투자·경제 야간 근무 — 장 마감 뒤 서버가 스스로 도는 함수
   (netlify.toml 의 schedule 로 매 영업일 KST 16:10 = UTC 07:10 실행)

   앱을 켜두지 않아도 서버가 알아서:
     ① 고객 보유 종목·펀드의 종가를 받아 invest_prices 에 스냅샷으로 쌓고
     ② invest_holdings 의 현재가·평가금액을 갱신하고
     ③ 목표수익률 도달 / 손절선 이탈 건을 invest_alerts 에 올리고
     ④ 한국은행 지표를 econ_indicators 에 저장하고
     ⑤ 오늘 시황 + 설계사가 고객에게 그대로 보낼 문장을 AI로 만들어
        invest_briefs 에 넣어둔다 → 다음 날 아침 앱 '경제동향'에 떠 있다.

   ⚠️ 이 함수는 시세를 직접 부르지 않고 같은 사이트의 /api/market 을 호출한다.
      토큰 캐시·재시도·키 안내가 그쪽에 이미 있어 로직이 한 곳에만 있게 된다.

   필요한 환경변수:
     SUPABASE_SERVICE_ROLE_KEY (필수)  ·  SUPABASE_URL (선택)
     TOSS_CLIENT_ID/TOSS_CLIENT_SECRET (시세 1순위 · 토스증권 오픈API)
     KIS_APP_KEY/KIS_APP_SECRET, ECOS_API_KEY  (없으면 해당 단계만 건너뛴다)
     ANTHROPIC_API_KEY 또는 GEMINI_API_KEY     (없으면 브리핑만 건너뛴다)
   ════════════════════════════════════════════════════════════════════════ */

const GEMMODEL = require('../../scripts/gemini-model.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';
const SELF = process.env.MARKET_BASE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '';

function kstToday() { return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
function n2(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }
function r2(v) { return v == null ? null : Math.round(v * 100) / 100; }

async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    }
  }, opts || {}));
  if (!r.ok) throw new Error(path.split('?')[0] + ' → ' + r.status + ' ' + (await r.text()).slice(0, 160));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function market(kind, extra) {
  if (!SELF) throw new Error('사이트 URL을 알 수 없습니다 (MARKET_BASE_URL 환경변수로 지정하세요)');
  const url = SELF + '/api/market?kind=' + kind + (extra || '');
  const r = await fetch(url, {
    headers: process.env.SHARED_TOKEN ? { 'X-App-Token': process.env.SHARED_TOKEN } : {}
  });
  const j = await r.json().catch(() => ({}));
  if (!j || j.ok === false) throw new Error(kind + ': ' + (j && (j.message || (j.need || []).join(',')) || 'no data'));
  return j;
}

/* ai-daily.js 와 같은 규칙 — 비싼 Claude 우선, 없으면 저렴한 Gemini */
async function askAI(system, user, maxTokens) {
  if (AI_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: maxTokens || 1600,
        system: system,
        messages: [{ role: 'user', content: user }]
      })
    });
    if (r.ok) {
      const j = await r.json();
      return (j.content || []).map(c => c.text || '').join('').trim();
    }
    if (!GM_KEY) throw new Error('Anthropic ' + r.status);
  }
  if (!GM_KEY) throw new Error('AI 키가 없습니다 (ANTHROPIC_API_KEY 또는 GEMINI_API_KEY)');
  /* 되는 모델을 찾을 때까지 후보를 내려간다 — 목록에 있어도 부르면 404 인
     조합이 있다. 실패하면 무엇을 몇 번 시도했는지 메시지에 담긴다. */
  const gem = await GEMMODEL.callGemini(GM_KEY, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: maxTokens || 1600 }
  });
  const r2x = gem.res;
  const j2 = await r2x.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

/* 준법: 투자성 상품은 원금손실 고지가 빠지면 안 된다 (config/compliance.json 과 동일 취지) */
const TONE =
  '규칙: ① 주어진 실제 숫자만 쓰고 없는 수치를 지어내지 마라. ' +
  '② AI 티 나는 말투 금지 — 실무자처럼 짧고 단정하게. ' +
  '③ 특정 종목·펀드의 매수/매도를 권유하는 문장을 쓰지 마라(투자권유 아님). ' +
  '④ 투자성 상품은 원금손실 가능성을 반드시 함께 적어라. ' +
  '⑤ 단정적 수익 보장 표현("무조건","확정 수익") 금지.';

exports.handler = async function () {
  const started = Date.now();
  const today = kstToday();
  const log = [];

  if (!SB_KEY) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.' }) };
  }

  /* ── ① 보유 종목 모으기 ─────────────────────────────────────────────── */
  let holdings = [];
  try {
    holdings = (await sb('invest_holdings?select=id,account_id,owner_id,asset_type,code,market,name,qty,avg_price,currency')) || [];
    log.push('보유 ' + holdings.length + '건');
  } catch (e) {
    log.push('보유 조회 실패(마이그레이션 30번 미적용?): ' + e.message.slice(0, 90));
  }

  /* ── ② 시세 받아 스냅샷 저장 + 보유 현재가 갱신 ─────────────────────── */
  const priceMap = {};
  const stockCodes = [], fundCodes = [];
  holdings.forEach(h => {
    const c = String(h.code || '').trim();
    if (!c) return;
    if (h.asset_type === 'fund') { if (fundCodes.indexOf(c) < 0) fundCodes.push(c); }
    else if (stockCodes.indexOf(c) < 0) stockCodes.push(c);
  });

  for (let i = 0; i < stockCodes.length; i += 20) {
    const part = stockCodes.slice(i, i + 20);
    try {
      const j = await market('quote', '&codes=' + encodeURIComponent(part.join(',')));
      (j.quotes || []).forEach(q => { priceMap[q.code] = q; });
    } catch (e) { log.push('시세 실패: ' + e.message.slice(0, 90)); }
  }
  if (fundCodes.length) {
    try {
      const j = await market('fund', '&codes=' + encodeURIComponent(fundCodes.join(',')));
      (j.funds || []).forEach(q => { priceMap[q.code] = q; });
    } catch (e) { log.push('펀드 기준가 건너뜀: ' + e.message.slice(0, 90)); }
  }

  const snaps = Object.keys(priceMap).map(c => ({
    code: c,
    market: priceMap[c].market || 'KRX',
    price_date: today,
    close: r2(n2(priceMap[c].price)),
    change_rate: r2(n2(priceMap[c].changeRate)),
    currency: priceMap[c].currency || 'KRW',
    name: priceMap[c].name || '',
    src: priceMap[c].src || 'api'
  })).filter(x => x.close != null);

  if (snaps.length) {
    try {
      await sb('invest_prices?on_conflict=code,market,price_date', { method: 'POST', body: JSON.stringify(snaps) });
      log.push('시세 스냅샷 ' + snaps.length + '건');
    } catch (e) { log.push('스냅샷 저장 실패: ' + e.message.slice(0, 90)); }
  }

  let updated = 0;
  for (const h of holdings) {
    const q = priceMap[String(h.code || '').trim()];
    if (!q || n2(q.price) == null) continue;
    try {
      await sb('invest_holdings?id=eq.' + encodeURIComponent(h.id), {
        method: 'PATCH',
        headers: {
          apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json', Prefer: 'return=minimal'
        },
        body: JSON.stringify({ last_price: r2(n2(q.price)), last_price_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      });
      updated++;
    } catch (e) { /* 한 건 실패가 전체를 멈추지 않는다 */ }
  }
  if (updated) log.push('보유 현재가 갱신 ' + updated + '건');

  /* ── ③ 목표 도달 · 손절 이탈 알림 ───────────────────────────────────── */
  try {
    const accounts = holdings.length
      ? (await sb('invest_accounts?select=id,name,owner_id,target_return,stop_loss')) || []
      : [];
    const accMap = {};
    accounts.forEach(a => { accMap[a.id] = a; });

    const alerts = [];
    holdings.forEach(h => {
      const q = priceMap[String(h.code || '').trim()];
      const avg = n2(h.avg_price), cur = q ? n2(q.price) : null;
      if (!avg || !cur || !n2(h.qty)) return;
      const rate = ((cur - avg) / avg) * 100;
      const acc = accMap[h.account_id];
      if (!acc) return;
      const tgt = n2(acc.target_return), stop = n2(acc.stop_loss);
      if (tgt != null && rate >= tgt) {
        alerts.push({
          owner_id: h.owner_id, account_id: h.account_id, holding_id: h.id, kind: 'target', ref_date: today,
          message: (h.name || h.code) + ' 수익률 ' + r2(rate) + '% — 목표 ' + tgt + '% 도달. 리밸런싱 상담 시점.'
        });
      } else if (stop != null && rate <= -Math.abs(stop)) {
        alerts.push({
          owner_id: h.owner_id, account_id: h.account_id, holding_id: h.id, kind: 'stoploss', ref_date: today,
          message: (h.name || h.code) + ' 수익률 ' + r2(rate) + '% — 손절 기준 -' + Math.abs(stop) + '% 이탈. 고객 선제 연락 필요.'
        });
      }
    });
    if (alerts.length) {
      await sb('invest_alerts?on_conflict=holding_id,kind,ref_date', { method: 'POST', body: JSON.stringify(alerts) });
      log.push('알림 ' + alerts.length + '건');
    } else log.push('알림 없음');
  } catch (e) { log.push('알림 실패: ' + e.message.slice(0, 90)); }

  /* ── ③-2 일별 평가액(NAV) 기록 — TWR 계산의 재료 ────────────────────────
     매일 한 줄씩 쌓여야 "운용 성과(TWR)"를 낼 수 있다. 오늘 들어오고 나간 돈
     (flow)도 함께 적어 둬야 입출금 영향을 걷어낼 수 있다. */
  try {
    const byAcc = {};
    holdings.forEach(h => {
      const q = priceMap[String(h.code || '').trim()];
      const px = q ? n2(q.price) : null;
      const v = (px != null ? px : n2(h.avg_price)) * (n2(h.qty) || 0);
      if (!isFinite(v)) return;
      if (!byAcc[h.account_id]) byAcc[h.account_id] = { owner: h.owner_id, value: 0 };
      byAcc[h.account_id].value += v;
    });

    const accIds = Object.keys(byAcc);
    if (accIds.length) {
      /* 오늘 발생한 순유입 — 계좌 기준(들어오면 +) */
      let todayTxns = [];
      try {
        todayTxns = (await sb('invest_txns?txn_date=eq.' + today + '&select=account_id,kind,amount')) || [];
      } catch (e) { /* 34번 미적용이면 거래내역이 없다 — 흐름 0 으로 둔다 */ }
      const flowBy = {};
      todayTxns.forEach(t => {
        const a = Math.abs(n2(t.amount) || 0);
        if (!a) return;
        /* 계좌로 돈이 들어오는 것 = 납입. 나가는 것 = 출금.
           매수·매도는 계좌 안에서 현금↔주식이 바뀔 뿐이라 순유입이 아니다. */
        if (t.kind === 'deposit') flowBy[t.account_id] = (flowBy[t.account_id] || 0) + a;
        else if (t.kind === 'withdraw') flowBy[t.account_id] = (flowBy[t.account_id] || 0) - a;
      });

      const navRows = accIds.map(id => ({
        account_id: id, owner_id: byAcc[id].owner, nav_date: today,
        value: r2(byAcc[id].value), flow: r2(flowBy[id] || 0), src: 'auto'
      }));
      await sb('invest_nav?on_conflict=account_id,nav_date', { method: 'POST', body: JSON.stringify(navRows) });
      log.push('일별 평가액 ' + navRows.length + '계좌');
    }
  } catch (e) { log.push('평가액 기록 건너뜀(마이그레이션 39번 미적용?): ' + e.message.slice(0, 80)); }

  /* ── ④ 경제지표 저장 ────────────────────────────────────────────────── */
  let econ = [];
  try {
    const j = await market('econ');
    econ = j.econ || [];
    const rows = econ.filter(x => x.value != null).map(x => ({
      code: x.id, name: x.name, ref_date: today, ref_time: x.time || '',
      value: x.value, unit: x.unit || '', src: x.src || 'ecos'
    }));
    if (rows.length) {
      await sb('econ_indicators?on_conflict=code,ref_date', { method: 'POST', body: JSON.stringify(rows) });
      log.push('경제지표 ' + rows.length + '건');
    }
  } catch (e) { log.push('경제지표 건너뜀: ' + e.message.slice(0, 90)); }

  /* ── ⑤ 오늘의 시황 브리핑 (설계사가 고객에게 그대로 보낼 문장까지) ──── */
  try {
    let indices = [], news = [];
    try { indices = (await market('index')).indices || []; } catch (e) { /* 지수 없으면 지표·뉴스만으로 쓴다 */ }
    try { news = ((await market('news')).news || []).slice(0, 12); } catch (e) { /* 뉴스 없으면 생략 */ }

    if (indices.length || econ.length || news.length) {
      const facts =
        '[' + today + ' 장 마감 실제 데이터]\n' +
        (indices.length ? '· 지수: ' + indices.map(i => i.name + ' ' + i.price + ' (' + (i.changeRate > 0 ? '+' : '') + i.changeRate + '%)').join(' / ') + '\n' : '') +
        (econ.length ? '· 지표: ' + econ.map(e => e.name + ' ' + e.value + (e.unit || '') + (e.diff != null ? ' (직전 대비 ' + (e.diff > 0 ? '+' : '') + e.diff + ')' : '')).join(' / ') + '\n' : '') +
        (snaps.length ? '· 고객 보유 종목 ' + snaps.length + '종 종가 수집 완료\n' : '') +
        (news.length ? '\n[오늘 경제·보험 뉴스 헤드라인]\n' + news.map((x, i) => (i + 1) + '. ' + x.title).join('\n') : '');

      const sys =
        '너는 APEX YUN PRO 설계사들을 위한 시장 브리핑 담당자다. 보험·연금·펀드를 파는 설계사가 ' +
        '내일 아침 고객과 통화할 때 쓸 수 있게 쓴다.\n' + TONE +
        '\n\n# 형식\n## 오늘 시장 한 줄\n## 숫자로 본 오늘 (3줄, 반드시 주어진 수치 인용)\n' +
        '## 이게 우리 고객에게 뜻하는 것 (3줄 — 연금·변액·달러보험·ISA 중 연결되는 것만)\n' +
        '## 고객에게 보낼 문장 (카톡에 그대로 붙일 3~4줄, 상품 권유 아닌 정보 제공 톤, 마지막 줄에 원금손실 가능 고지)';
      const body = await askAI(sys, facts, 1600);

      await sb('invest_briefs?on_conflict=kind,ref_date', {
        method: 'POST',
        body: JSON.stringify([{ kind: 'market_daily', ref_date: today, title: today + ' 시황 브리핑', body: body, src: 'auto' }])
      });
      log.push('시황 브리핑 ok');
    } else log.push('브리핑 건너뜀(데이터 없음)');

    /* 헤드라인 원문도 따로 남긴다.
       위 브리핑은 AI 가 요약한 글이라 "무슨 기사를 보고 쓴 것인지" 가 사라진다.
       아침 브리핑(invest-daily)에서 제목과 링크를 그대로 보여 주려면 원문이
       필요하다. 요약만 있으면 확인할 방법이 없고, 확인할 수 없는 요약은
       투자 판단에 쓸 물건이 아니다.
       ⚠️ 제목과 링크만 저장한다. 기사 본문은 저장하지 않는다 — 남의 저작물이다. */
    if (news.length) {
      const lines = news.slice(0, 20)
        .map(x => '- [' + (x.source || '출처미상') + '] ' + String(x.title).replace(/\s+/g, ' ').trim() +
                  (x.link ? '\n  ' + x.link : ''));
      await sb('invest_briefs?on_conflict=kind,ref_date', {
        method: 'POST',
        body: JSON.stringify([{
          kind: 'news_daily', ref_date: today, title: today + ' 뉴스 헤드라인 ' + lines.length + '건',
          body: lines.join('\n'), src: 'auto'
        }])
      });
      log.push('헤드라인 ' + lines.length + '건 보관');
    }
  } catch (e) { log.push('브리핑 실패: ' + e.message.slice(0, 90)); }

  /* ── ⑥ 실행 기록 (앱 점검 화면에서 마지막 실행 시각 확인) ───────────── */
  try {
    await sb('ai_dept_reports?on_conflict=dept,period,ref_date', {
      method: 'POST',
      body: JSON.stringify([{
        dept: 'market', dept_name: '📈 투자·경제 자동수집', period: 'daily', ref_date: today,
        title: '자동 수집 ' + new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
        body: '- 소요 ' + Math.round((Date.now() - started) / 1000) + '초\n- ' + log.join('\n- ')
      }])
    });
  } catch (e) { /* 기록 실패는 무시 */ }

  return { statusCode: 200, body: JSON.stringify({ ok: true, date: today, log: log }) };
};
