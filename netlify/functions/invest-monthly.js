/* ════════════════════════════════════════════════════════════════════════
   APEX 투자 월간 리포트 — 매월 1일 새벽에 서버가 스스로 만든다
   (netlify.toml schedule: 매월 1일 KST 06:00 = UTC 21:00 전날)

   지난달 계좌별 성과를 계산해 invest_reports 에 넣어 둔다.
   설계사는 아침에 앱에서 확인하고 고객에게 보내기만 하면 된다.

   ⚠️ 주문은 넣지 않는다. 읽고 계산하고 글을 쓸 뿐이다.

   계산은 scripts/perf-core.js 하나만 쓴다 — 앱 화면과 같은 계산기라
   "화면 숫자와 리포트 숫자가 다르다" 는 사고가 생기지 않는다.

   필요한 환경변수
     SUPABASE_SERVICE_ROLE_KEY (필수) · SUPABASE_URL (선택)
     ANTHROPIC_API_KEY 또는 GEMINI_API_KEY (없으면 숫자만 담긴 리포트가 만들어진다)
   ════════════════════════════════════════════════════════════════════════ */

const PERF = require('../../scripts/perf-core.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';

function kst() { return new Date(Date.now() + 9 * 3600 * 1000); }
function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }
function won(v) { return v == null ? '—' : Math.round(v).toLocaleString('ko-KR') + '원'; }
function pctS(v) { return v == null ? '—' : ((v > 0 ? '+' : '') + (Math.round(v * 1000) / 10) + '%'); }

/* 지난달 (YYYY-MM) 과 그 시작·끝 날짜 */
function lastMonth() {
  const d = kst();
  const y = d.getUTCFullYear(), m = d.getUTCMonth();     /* 0-based, 이번 달 */
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));               /* 지난달 말일 */
  const p = start.toISOString().slice(0, 7);
  return { period: p, from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

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
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: maxTokens || 1400, system, messages: [{ role: 'user', content: user }] })
    });
    if (r.ok) { const j = await r.json(); return (j.content || []).map(c => c.text || '').join('').trim(); }
    if (!GM_KEY) throw new Error('Anthropic ' + r.status);
  }
  if (!GM_KEY) throw new Error('AI 키 없음');
  const r2 = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GM_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens || 1400 }
    })
  });
  if (!r2.ok) throw new Error('Gemini ' + r2.status);
  const j2 = await r2.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

const SYS =
  '너는 재무설계사가 고객에게 보낼 월간 투자 리포트를 쓰는 담당자다.\n' +
  '규칙: ① 주어진 숫자만 쓰고 없는 수치를 지어내지 마라. ② 특정 종목의 매수/매도를 권유하지 마라. ' +
  '③ 투자성 상품은 원금손실 가능성을 반드시 적어라. ④ "무조건·확정 수익" 같은 단정 표현 금지. ' +
  '⑤ 전문용어는 풀어서 써라 — XIRR 는 "실제로 번 돈 기준 수익률", TWR 는 "운용 성과" 정도로. ' +
  '⑥ AI 티 나는 말투 금지, 실무자처럼 담백하게.';

exports.handler = async function (event) {
  const started = Date.now();
  const log = [];
  const { period, from, to } = lastMonth();

  /* 스케줄(0 21 28-31 * *)은 KST 29일~1일 사이에 최대 네 번 뜬다.
     달마다 마지막 날이 달라 크론만으로는 "1일" 을 딱 집을 수 없기 때문이다.
     그래서 실제 작업은 KST 1일에만 하고 나머지는 곧바로 끝낸다.
     주소로 직접 열었을 때(수동 실행)는 날짜와 상관없이 돌려 준다. */
  const manual = !!(event && event.httpMethod);
  if (!manual && kst().getUTCDate() !== 1) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: 'KST 1일이 아니라 건너뜀', today: kst().toISOString().slice(0, 10) }) };
  }

  if (!SB_KEY) return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 없음' }) };

  let accounts = [];
  try {
    accounts = (await sb('invest_accounts?select=id,owner_id,name,kind,memo,target_return,stop_loss')) || [];
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: '계좌 조회 실패(마이그레이션 33/34 미적용?): ' + e.message }) };
  }
  log.push('계좌 ' + accounts.length + '개');

  let made = 0, skipped = 0;
  for (const acc of accounts) {
    try {
      const q = 'account_id=eq.' + encodeURIComponent(acc.id);

      /* 거래내역 — 계좌 개설부터 지난달 말까지 */
      const txns = (await sb('invest_txns?' + q + '&txn_date=lte.' + to + '&select=txn_date,kind,amount&order=txn_date.asc')) || [];
      /* 일별 평가액 — TWR 용 */
      const navs = (await sb('invest_nav?' + q + '&nav_date=lte.' + to + '&select=nav_date,value,flow&order=nav_date.asc')) || [];

      if (!txns.length && !navs.length) { skipped++; continue; }

      const endNav = navs.length ? n(navs[navs.length - 1].value) : null;
      const monthNavs = navs.filter(x => x.nav_date >= from && x.nav_date <= to)
        .map(x => ({ date: x.nav_date, value: n(x.value), flow: n(x.flow) || 0 }));

      /* 앱 화면과 같은 계산기를 쓴다 */
      const flows = PERF.txnsToFlows(
        txns.map(t => ({ date: t.txn_date, kind: t.kind, amount: n(t.amount) })), endNav, to);
      const xirr = PERF.xirr(flows);
      const net = PERF.netInvested(txns.map(t => ({ kind: t.kind, amount: n(t.amount) })));
      const twrAll = PERF.twr(navs.map(x => ({ date: x.nav_date, value: n(x.value), flow: n(x.flow) || 0 })));
      const twrMonth = PERF.twr(monthNavs);

      const stats = {
        period, endValue: endNav, netInvested: net,
        xirr: xirr, twrTotal: twrAll ? twrAll.total : null,
        twrMonth: twrMonth ? twrMonth.total : null,
        navPoints: navs.length, txnCount: txns.length
      };

      const facts =
        '[' + period + ' 월간 · ' + (acc.name || '계좌') + ']\n' +
        '· 월말 평가금액: ' + won(endNav) + '\n' +
        '· 지금까지 넣은 순금액(원금): ' + won(net) + '\n' +
        '· 실제 수익률(XIRR, 연환산): ' + pctS(xirr) + '\n' +
        '· 이번 달 운용 성과(TWR): ' + pctS(stats.twrMonth) + '\n' +
        '· 누적 운용 성과(TWR): ' + pctS(stats.twrTotal) + '\n' +
        (acc.memo ? '· 고객 메모: ' + acc.memo + '\n' : '') +
        (acc.target_return != null ? '· 목표 수익률: ' + acc.target_return + '%\n' : '');

      let body;
      try {
        body = await askAI(SYS,
          facts + '\n위 숫자로 월간 리포트를 써라.\n\n# 형식\n## 이번 달 한 줄\n## 숫자로 보고 (3줄)\n' +
          '## 두 수익률이 다르다면 왜 다른지 (해당될 때만 1~2줄)\n## 다음 달 점검할 것 1가지\n' +
          '## 고객에게 보낼 문장 (카톡용 4줄, 마지막 줄에 원금손실 가능 고지)', 1400);
      } catch (e) {
        /* AI 가 없어도 숫자 리포트는 남긴다 — 빈손보다 낫다 */
        body = '## ' + period + ' 성과 요약\n\n' + facts +
          '\n\n※ AI 연결이 없어 숫자만 정리했습니다. 설정에서 AI를 연결하면 설명 문장까지 자동으로 만들어집니다.' +
          '\n※ 투자성 상품은 원금손실이 발생할 수 있으며 과거 수익이 미래 수익을 보장하지 않습니다.';
      }

      await sb('invest_reports?on_conflict=account_id,period', {
        method: 'POST',
        body: JSON.stringify([{
          account_id: acc.id, owner_id: acc.owner_id, period: period,
          title: period + ' · ' + (acc.name || '계좌') + ' 월간 리포트',
          body: body, stats: stats, src: 'auto'
        }])
      });
      made++;
    } catch (e) {
      log.push('계좌 ' + (acc.name || acc.id).slice(0, 20) + ' 실패: ' + String(e.message || e).slice(0, 90));
    }
  }
  log.push('리포트 ' + made + '건 생성, ' + skipped + '건 건너뜀(자료 없음)');

  try {
    await sb('ai_dept_reports?on_conflict=dept,period,ref_date', {
      method: 'POST',
      body: JSON.stringify([{
        dept: 'invest_monthly', dept_name: '📐 투자 월간 리포트', period: 'monthly',
        ref_date: kst().toISOString().slice(0, 10),
        title: period + ' 월간 리포트 자동 생성',
        body: '- 소요 ' + Math.round((Date.now() - started) / 1000) + '초\n- ' + log.join('\n- ')
      }])
    });
  } catch (e) { /* 기록 실패는 무시 */ }

  return { statusCode: 200, body: JSON.stringify({ ok: true, period, made, skipped, log }) };
};
