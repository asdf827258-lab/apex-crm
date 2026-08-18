/* ════════════════════════════════════════════════════════════════════════
   APEX 투자 일간 리포트 — 매 영업일 아침 서버가 스스로 만든다
   (netlify.toml schedule: 매일 KST 07:00 = UTC 22:00 전날)

   어제 무슨 일이 있었는지 계좌별로 한 장으로 정리해 invest_reports 에 넣는다.
   설계사는 아침에 앱을 열면 이미 있다.

   ⚠️ 주문은 넣지 않는다. 읽고 계산하고 글을 쓸 뿐이다.

   월간 리포트(invest-monthly.js)와 같은 계산기(scripts/perf-core.js)를 쓴다 —
   "화면 숫자와 리포트 숫자가 다르다" 는 사고가 생기지 않게.
   월간과 다른 점은 기간뿐이다: 월간은 period='2026-07', 일간은 '2026-07-31'.
   같은 표에 들어가지만 형식이 달라 서로 덮어쓰지 않는다.

   ⚠️ 이 함수는 주소로 열 수 없다. netlify.toml 에 schedule 이 걸린 함수는
      Netlify 가 HTTP 호출을 403 으로 막는다. 아래 manual 분기는 그래서 실제로는
      타지 않는다 — 로컬(netlify dev)에서 돌려 볼 때만 쓰인다.
      손으로 한 번 돌려 봐야 하면 Netlify 대시보드 → Functions → invest-daily → Run.

   필요한 환경변수
     SUPABASE_SERVICE_ROLE_KEY (필수) · SUPABASE_URL (선택)
     ANTHROPIC_API_KEY 또는 GEMINI_API_KEY (없으면 숫자만 담긴 리포트가 만들어진다)
   ════════════════════════════════════════════════════════════════════════ */

const PERF = require('../../scripts/perf-core.js');
const GEMMODEL = require('../../scripts/gemini-model.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';

function kst() { return new Date(Date.now() + 9 * 3600 * 1000); }
function ymd(d) { return d.toISOString().slice(0, 10); }
function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }
function won(v) { return v == null ? '—' : Math.round(v).toLocaleString('ko-KR') + '원'; }
function signWon(v) {
  if (v == null) return '—';
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v)).toLocaleString('ko-KR') + '원';
}
/* perf-core 의 수익률은 소수(0.031 = 3.1%) 로 나온다 */
function pctS(v) { return v == null ? '—' : ((v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v * 1000) / 10) + '%'); }
/* 하루 등락은 소수점 한 자리로 자르면 3.95% 가 4% 로 보인다 — 두 자리로 쓴다 */
function pctD(v) { return v == null ? '—' : ((v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v * 10000) / 100).toFixed(2) + '%'); }
/* invest_prices.change_rate 는 이미 % 단위다 — 위와 헷갈리면 1000배 틀린 숫자가 나온다 */
function rateS(v) { return v == null ? '—' : ((v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v * 100) / 100) + '%'); }

async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
    }
  }, opts || {}));
  if (!r.ok) throw new Error(path.split('?')[0] + ' → ' + r.status + ' ' + (await r.text()).slice(0, 140));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function askAI(system, user, maxTokens) {
  if (AI_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: maxTokens || 900, system, messages: [{ role: 'user', content: user }] })
    });
    if (r.ok) { const j = await r.json(); return (j.content || []).map(c => c.text || '').join('').trim(); }
    if (!GM_KEY) throw new Error('Anthropic ' + r.status);
  }
  if (!GM_KEY) throw new Error('AI 키 없음');
  /* 되는 모델을 찾을 때까지 후보를 내려간다 — 목록에 있어도 부르면 404 인
     조합이 있다. 실패하면 무엇을 몇 번 시도했는지 메시지에 담긴다. */
  const gem = await GEMMODEL.callGemini(GM_KEY, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: maxTokens || 900 }
  });
  const r2 = gem.res;
  const j2 = await r2.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

const SYS =
  '너는 재무설계사가 아침에 30초 만에 읽는 투자 일간 브리핑을 쓰는 담당자다.\n' +
  '규칙: ① 주어진 숫자만 쓰고 없는 수치를 지어내지 마라. "—" 로 온 값은 "확인 안 됨" 이라고 쓰고 넘어가라.\n' +
  '② 특정 종목의 매수/매도를 권유하지 마라. 사실과 점검할 거리만 적어라.\n' +
  '③ 하루 등락으로 호들갑 떨지 마라 — 하루는 소음이다. 추세와 위험선만 짚어라.\n' +
  '④ "무조건·확정 수익" 같은 단정 표현 금지. 투자성 상품은 원금손실 가능성을 전제로 쓴다.\n' +
  '⑤ AI 티 나는 말투 금지("~인 것 같습니다","도움이 되길 바랍니다" 금지). 실무자처럼 짧고 단정하게.\n' +
  '⑥ 전체 10줄을 넘기지 마라. 아침에 읽는 글이다.\n' +
  '⑦ 뉴스는 제목만 주어진다. 기사 본문을 읽은 것처럼 내용을 지어내지 마라.\n' +
  '   제목에 없는 수치·인용·인과관계를 쓰면 안 된다. 제목을 옮길 때는 준 그대로 옮겨라.\n' +
  '⑧ 뉴스와 내 계좌를 억지로 잇지 마라. 보유 종목·자산군과 직접 닿는 헤드라인이 없으면\n' +
  '   "오늘 헤드라인 중 내 계좌와 직접 닿는 것은 없다" 고 쓰고 끝내라. 그게 맞는 답이다.\n' +
  '⑨ 앞날을 단정하지 마라. "오르겠다/빠지겠다" 대신 "무엇을 확인하면 판단이 갈리는지" 를 써라.';

/* 자산군 판정 — 앱의 분류와 같은 기준으로 묶는다 */
function assetClassOf(h) {
  if (h.asset_type === 'fund') return '펀드';
  const m = String(h.market || 'KRX').toUpperCase();
  if (m === 'KRX') return '국내주식';
  if (m === 'FUND') return '펀드';
  return '해외주식';
}

exports.handler = async function (event) {
  const started = Date.now();
  const log = [];
  const today = ymd(kst());
  const manual = !!(event && event.httpMethod);

  /* 주말엔 종가가 안 바뀐다 — 같은 리포트를 두 번 만들 이유가 없다.
     주소로 직접 열었을 때(수동 실행)는 요일과 상관없이 돌려 준다. */
  const dow = kst().getUTCDay();
  if (!manual && (dow === 0 || dow === 6)) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: '주말이라 건너뜀', today }) };
  }
  if (!SB_KEY) return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 없음' }) };

  let accounts = [];
  try {
    accounts = (await sb('invest_accounts?select=id,owner_id,name,kind,target_return,stop_loss')) || [];
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: '계좌 조회 실패(마이그레이션 33/39 미적용?): ' + e.message }) };
  }
  log.push('계좌 ' + accounts.length + '개');

  /* 시세 스냅샷은 계좌마다 다시 부르지 않는다 — 하루치 한 번이면 충분하다 */
  let priceByCode = {}, priceDate = null;
  try {
    /* 가장 최근 날짜를 먼저 한 줄로 확인한 뒤, 그 날짜만 콕 집어 받는다.
       전에는 최신 600행을 받아 그중 최신일만 걸렀는데, 여러 날이 섞여 들어오면
       최신일 종목이 잘려 나갈 수 있었다. 조용히 몇 종목이 빠지는 쪽이
       한눈에 안 보여서 더 나쁘다. */
    const head = (await sb('invest_prices?select=price_date&order=price_date.desc&limit=1')) || [];
    if (head.length) {
      priceDate = head[0].price_date;
      const rows = (await sb('invest_prices?price_date=eq.' + priceDate +
                             '&select=code,name,close,change_rate&limit=2000')) || [];
      rows.forEach(r => { priceByCode[r.code] = r; });
      log.push('시세 스냅샷 ' + priceDate + ' · ' + rows.length + '종목');
    }
  } catch (e) { log.push('시세 스냅샷 없음: ' + String(e.message || e).slice(0, 60)); }

  /* 원/달러 환율 — USD 종목을 원화로 맞춰야 자산배분 비중이 맞는다.
     환율을 모르면 USD 종목을 배분 계산에서 빼고, 뺐다고 리포트에 적는다.
     임의의 환율을 지어내면 "해외주식 0%" 같은 조용히 틀린 숫자가 나온다. */
  let fx = null;
  try {
    const r = (await sb('econ_indicators?code=eq.usdkrw&select=value,ref_date&order=ref_date.desc&limit=1')) || [];
    if (r.length) fx = n(r[0].value);
  } catch (e) { /* 마이그레이션 전이거나 아직 안 쌓였다 */ }
  if (fx == null) log.push('환율 없음 — USD 종목은 자산배분에서 제외');

  /* ── 어제 시황과 뉴스 헤드라인 ───────────────────────────────────────
     market-daily 가 어제 장 마감 뒤(KST 16:10) 만들어 둔 것을 그대로 읽는다.
     여기서 RSS 를 다시 긁지 않는다 — 같은 뉴스를 두 군데서 받아 오면 아침
     브리핑과 시황 브리핑이 서로 다른 기사를 말하게 된다.

     ⚠️ today 로 찾으면 안 된다. 이 함수는 07시에 도는데 market-daily 는
        어제 16시에 돌았으므로 ref_date 가 어제다. 가장 최근 것을 받고,
        그게 언제 것인지 리포트에 적는다. 사흘 지난 시황을 오늘 것처럼
        보여 주는 쪽이 아예 없는 것보다 나쁘다. */
  let mktBrief = null, headlines = null;
  try {
    const rows = (await sb('invest_briefs?kind=in.(market_daily,news_daily)' +
                           '&select=kind,ref_date,title,body&order=ref_date.desc&limit=6')) || [];
    mktBrief = rows.filter(r => r.kind === 'market_daily')[0] || null;
    headlines = rows.filter(r => r.kind === 'news_daily')[0] || null;
  } catch (e) { log.push('시황·뉴스 없음: ' + String(e.message || e).slice(0, 60)); }

  /* 며칠 전 것이면 그렇다고 적는다 */
  function ageDays(d) {
    if (!d) return null;
    return Math.round((Date.parse(today) - Date.parse(d)) / 86400000);
  }
  const newsLines = headlines
    ? String(headlines.body || '').split('\n').filter(s => s.startsWith('- ')).slice(0, 8)
    : [];
  const mktAge = mktBrief ? ageDays(mktBrief.ref_date) : null;
  log.push('시황 ' + (mktBrief ? mktBrief.ref_date : '없음') + ' · 헤드라인 ' + newsLines.length + '건');

  let made = 0, skipped = 0;
  for (const acc of accounts) {
    try {
      const q = 'account_id=eq.' + encodeURIComponent(acc.id);

      const navs = (await sb('invest_nav?' + q + '&select=nav_date,value,flow&order=nav_date.desc&limit=400')) || [];
      if (navs.length < 2) { skipped++; continue; }
      navs.reverse();                                   /* 오래된 것부터 */

      const last = navs[navs.length - 1], prev = navs[navs.length - 2];
      const v1 = n(last.value), v0 = n(prev.value), flow = n(last.flow) || 0;

      /* 하루 수익률은 그날 들어온 돈을 빼고 봐야 한다 — 입금을 수익으로 세면 안 된다 */
      const dayPL = (v1 == null || v0 == null) ? null : (v1 - v0 - flow);
      const dayRt = (dayPL == null || !v0) ? null : dayPL / v0;

      /* 최고점 대비 낙폭 — 정지선까지 얼마나 남았는지 */
      let peak = 0; navs.forEach(x => { const v = n(x.value); if (v != null && v > peak) peak = v; });
      const ddPct = (peak > 0 && v1 != null) ? (peak - v1) / peak * 100 : null;
      const stop = n(acc.stop_loss);
      const ddRoom = (ddPct != null && stop != null) ? stop - ddPct : null;

      /* 누적 운용 성과 */
      const twrAll = PERF.twr(navs.map(x => ({ date: x.nav_date, value: n(x.value), flow: n(x.flow) || 0 })));

      /* 보유 종목 — 어제 가장 많이 움직인 것 */
      const holds = (await sb('invest_holdings?' + q + '&select=code,market,name,qty,avg_price,currency,asset_type,last_price')) || [];
      const moved = holds.map(h => {
        const p = priceByCode[h.code];
        return { name: h.name || h.code, code: h.code, rate: p ? n(p.change_rate) : null };
      }).filter(x => x.rate != null).sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate));

      /* 목표 배분에서 벗어난 것 */
      let reb = null, fxSkipped = 0;
      try {
        const tg = (await sb('invest_targets?' + q + '&select=asset_class,target_pct,band_pct')) || [];
        if (tg.length) {
          const priced = [];
          holds.forEach(h => {
            const p = priceByCode[h.code];
            const px = p ? n(p.close) : n(h.last_price);
            const qty = n(h.qty) || 0;
            if (px == null) return;
            const usd = (h.currency || 'KRW') === 'USD';
            if (usd && fx == null) { fxSkipped++; return; }   /* 환율을 모르면 섞지 않는다 */
            priced.push({
              code: h.code, market: h.market, assetClass: assetClassOf(h),
              value: qty * px * (usd ? fx : 1)
            });
          });
          if (priced.length) {
            const alloc = PERF.allocation(priced);
            reb = PERF.rebalance(alloc, tg.map(t => ({ cls: t.asset_class, target: n(t.target_pct), band: n(t.band_pct) })));
          }
        }
      } catch (e) { /* 목표를 안 정해둔 계좌 — 리밸런싱 항목만 빠진다 */ }

      /* 봇 신호 — 모의 전용.
         ⚠️ 오늘 날짜로 찾으면 안 된다. 이 함수는 07시에 돌면서 '어제 장' 을
            보고한다. 신호는 어제 났으므로 today 로 찾으면 영원히 0건이다.
            실제로 그렇게 짜여 있었다. 자료의 기준일(nav_date)로 찾는다. */
      const dataDate = last.nav_date;
      let signals = [];
      try {
        signals = (await sb('invest_signals?' + q + '&ref_date=eq.' + dataDate +
                            '&select=code,name,side,strategy,reason,price&limit=12')) || [];
      } catch (e) { /* 마이그레이션 전이면 없다 */ }

      /* 어제 실제로 사고판 것 — 신호(계획)와 체결(사실)은 다르다 */
      let done = [];
      try {
        done = (await sb('invest_txns?' + q + '&txn_date=eq.' + dataDate +
                         '&select=kind,amount,memo&limit=20')) || [];
      } catch (e) { /* 거래내역을 안 넣는 계좌도 있다 */ }

      /* 시세 스냅샷이 평가액 기준일보다 오래됐으면 '어제 움직인 종목' 이 아니다.
         모르는 걸 아는 척하지 않는다 — 며칠 전 등락을 어제 것처럼 적으면 안 된다. */
      const priceStale = !!(priceDate && priceDate !== dataDate);

      const stats = {
        date: today, navDate: last.nav_date, priceDate: priceDate,
        endValue: v1, dayPL: dayPL, dayReturn: dayRt,
        drawdownPct: ddPct == null ? null : Math.round(ddPct * 100) / 100,
        stopLossPct: stop, roomToStopPct: ddRoom == null ? null : Math.round(ddRoom * 100) / 100,
        twrTotal: twrAll ? twrAll.total : null,
        offCount: reb ? reb.offCount : null,
        fx: fx, fxSkipped: fxSkipped, priceStale: priceStale,
        signalCount: signals.length, txnCount: done.length, holdings: holds.length,
        marketBriefDate: mktBrief ? mktBrief.ref_date : null, marketBriefAgeDays: mktAge,
        newsDate: headlines ? headlines.ref_date : null, newsCount: newsLines.length
      };

      const facts =
        '[' + today + ' 일간 · ' + (acc.name || '계좌') + ']\n' +
        '· 평가금액: ' + won(v1) + ' (기준일 ' + last.nav_date + ')\n' +
        '· 어제 대비: ' + signWon(dayPL) + ' (' + pctD(dayRt) + ')' + (flow ? ' · 그날 순유입 ' + signWon(flow) + ' 은 빼고 계산' : '') + '\n' +
        '· 누적 운용 성과(TWR): ' + pctS(stats.twrTotal) + '\n' +
        '· 최고점 대비 낙폭: ' + (ddPct == null ? '—' : Math.round(ddPct * 100) / 100 + '%') +
          (stop != null ? ' / 정지선 ' + stop + '% (여유 ' + (ddRoom == null ? '—' : Math.round(ddRoom * 100) / 100 + '%p') + ')' : '') + '\n' +
        (moved.length
          ? (priceStale
              ? '· 많이 움직인 종목(' + priceDate + ' 기준 · 어제 자료 아님): '
                + moved.slice(0, 3).map(m => m.name + ' ' + rateS(m.rate)).join(' · ') + '\n'
              : '· 어제 많이 움직인 종목: '
                + moved.slice(0, 3).map(m => m.name + ' ' + rateS(m.rate)).join(' · ') + '\n')
          : '· 종목별 등락: 확인 안 됨 (시세 스냅샷 없음)\n') +
        (done.length
          ? '· 어제 체결: ' + done.map(t => (t.kind || '') + ' ' + won(n(t.amount))).join(' · ') + '\n'
          : '· 어제 체결: 없음\n') +
        (reb
          ? (reb.offCount
              ? '· 목표 배분 이탈 ' + reb.offCount + '건: ' + reb.rows.filter(r => r.off)
                  .map(r => r.cls + ' ' + (r.diff > 0 ? '+' : '−') + Math.abs(Math.round(r.diff * 10) / 10) + '%p').join(' · ') + '\n'
              : '· 목표 배분: 밴드 안에 있음\n')
          : '· 목표 배분: 설정 안 됨\n') +
        (fxSkipped ? '· ⚠️ 환율을 몰라 USD 종목 ' + fxSkipped + '개를 배분 계산에서 뺐습니다\n' : '') +
        (signals.length
          ? '· 어제 봇 신호 ' + signals.length + '건(모의): ' +
            signals.slice(0, 4).map(s => (s.name || s.code) + ' ' + (s.side === 'buy' ? '매수' : '매도')).join(' · ') + '\n'
          : '· 봇 신호: 없음\n') +
        (mktBrief
          ? '\n[' + mktBrief.ref_date + ' 시황 브리핑' +
            (mktAge > 1 ? ' · ⚠️ ' + mktAge + '일 지난 자료다' : '') + ']\n' +
            String(mktBrief.body || '').slice(0, 1200) + '\n'
          : '\n[시황 브리핑: 없음]\n') +
        (newsLines.length
          ? '\n[' + (headlines ? headlines.ref_date : '') + ' 경제·보험 뉴스 헤드라인]\n' +
            newsLines.map(s => s.replace(/^- /, '')).join('\n') + '\n'
          : '');

      let body;
      try {
        body = await askAI(SYS,
          facts + '\n위 자료로 아침 브리핑을 써라.\n\n# 형식\n## 한 줄\n## 어제 내 계좌 (2줄)\n' +
          '## 시장·뉴스 (2줄 — 헤드라인 중 내 보유와 닿는 것만. 없으면 없다고 쓴다)\n' +
          '## 오늘 볼 것 1가지 (무엇을 확인하면 판단이 갈리는지)\n', 1200);
      } catch (e) {
        /* AI 가 없어도 숫자 리포트는 남긴다 — 빈손보다 낫다 */
        body = '## ' + today + ' 아침 브리핑\n\n' + facts +
          '\n\n※ AI 연결이 없어 숫자만 정리했습니다. 설정에서 AI를 연결하면 설명 문장까지 자동으로 만들어집니다.' +
          '\n※ 투자성 상품은 원금손실이 발생할 수 있으며 과거 수익이 미래 수익을 보장하지 않습니다.';
      }

      await sb('invest_reports?on_conflict=account_id,period', {
        method: 'POST',
        body: JSON.stringify([{
          account_id: acc.id, owner_id: acc.owner_id, period: today,
          title: today + ' · ' + (acc.name || '계좌') + ' 아침 브리핑',
          body: body, stats: stats, src: 'auto-daily'
        }])
      });
      made++;
    } catch (e) {
      log.push('계좌 ' + String(acc.name || acc.id).slice(0, 20) + ' 실패: ' + String(e.message || e).slice(0, 90));
    }
  }
  log.push('브리핑 ' + made + '건 생성, ' + skipped + '건 건너뜀(평가액 기록이 2일치 미만)');

  try {
    await sb('ai_dept_reports?on_conflict=dept,period,ref_date', {
      method: 'POST',
      body: JSON.stringify([{
        dept: 'invest_daily', dept_name: '🌅 투자 아침 브리핑', period: 'daily', ref_date: today,
        body: log.join('\n'), src: 'auto'
      }])
    });
  } catch (e) { log.push('부서기록 저장 실패: ' + String(e.message || e).slice(0, 80)); }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, today, made, skipped, ms: Date.now() - started, log })
  };
};
