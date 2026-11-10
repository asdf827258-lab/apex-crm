/* ══ 🧱 lib-netguard — 점검이 띄우는 브라우저는 <b>사장님 Supabase 에 못 닿습니다</b> ══════
   사장님 말씀 (2026-11-10) 「병합되면 ci 진짜 서버 부르는것도 해줘」.

   ⚠ 재어 보니 (2026-11-10 서버 로그) CI 점검이 가짜 id(me · u1 · c1)를 들고 <b>진짜 서버</b>를
     하루 수천 번 불렀습니다 — saved_reports 1,735 · daily_checks 822 · calls 566 ·
     health_checks 450(모두 400). 부른 곳은 Azure(GitHub Actions) · HeadlessChrome 이었습니다.
     브라우저를 띄우는 자 가운데 <b>120가지</b>가 바깥을 막는 줄이 없었습니다(check-netblock 눈금).
     하나씩 고치면 120곳을 손대고, 새 자가 또 빠뜨립니다 (5번 — 한 곳에서).

   ★ 그래서 <b>브라우저 쪽에서 한 번에</b> 막습니다 — run-checks 가 모든 점검을
     `node --require lib-netguard.js` 로 돌리고, 이 파일은 playwright 를 부르는 순간
     chromium 이 여는 <b>모든 창(context)</b>에 「supabase.co 로 가는 것은 끊는다」 를 겁니다.
       · 자가 제 route 에서 route.continue() 로 흘려도 supabase.co 면 <b>끊습니다</b>
         (route.fetch() 도 — 그것은 node 쪽에서 진짜 서버를 부릅니다).
       · 자가 route.fulfill 로 지어 준 답(가짜 서버)은 망에 안 나가므로 <b>그대로 됩니다</b>.
       · localhost 와 CDN(jsdelivr 등)은 그대로입니다 — 막을 것은 사장님 서버뿐입니다 (8번).
       · 실시간(wss) 도 끊습니다 (routeWebSocket 이 있는 판에서).
       · 둘째 겹으로 「*.supabase.co 는 주소가 없다」(--host-resolver-rules) 도 얹습니다 —
         ⚠ 이 겹은 <b>프록시를 쓰는 곳(이 컨테이너)에서는 안 먹습니다</b>(주소를 프록시가 찾음).
         재어 보고 알았습니다 — 그래서 첫째 겹이 주인입니다.
   ⚠ 이 자는 <b>브라우저</b>만 막습니다. node 쪽에서 fetch 하는 자는 따로 봐야 합니다.
   check-ciguard 가 이것을 지킵니다 (막은 판 · 안 막은 판을 둘 다 돌려 견줍니다).
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const Module = require('module');
const path = require('path');

/* 막는 곳 — <b>한 곳</b>에만 적습니다. check-ciguard 가 이 표를 읽어 잽니다. */
const BLOCK = ['*.supabase.co', 'supabase.co'];
const RULES = BLOCK.map(h => 'MAP ' + h + ' ~NOTFOUND').join(', ');

function withRules(o) {
  const x = Object.assign({}, o || {});
  const args = (x.args || []).slice();
  const i = args.findIndex(a => /^--host-resolver-rules=/.test(a));
  if (i >= 0) args[i] = args[i] + ', ' + RULES;     /* 자가 제 규칙을 가졌으면 이어 붙입니다 */
  else args.push('--host-resolver-rules=' + RULES);
  x.args = args;
  return x;
}

/* 끊을 주소 — BLOCK 표에서 짓습니다 (두 벌 두지 않게) */
const BAD = new RegExp('^(https?|wss?)://([^/?#]*\\.)?(' +
  BLOCK.filter(h => h.indexOf('*') < 0).map(h => h.replace(/\./g, '\\.')).join('|') + ')(:\\d+)?([/?#]|$)', 'i');
const isBad = (u) => BAD.test(String(u || ''));

/* 자의 route 손잡이를 감쌉니다 — supabase.co 면 continue/fetch 가 망으로 못 나갑니다 */
function safeRoute(route) {
  return new Proxy(route, { get(t, k) {
    if (k === 'continue') return () => t.abort('blockedbyclient');
    if (k === 'fetch') return () => t.abort('blockedbyclient').then(() => { throw new Error('lib-netguard: supabase.co 는 점검에서 못 부릅니다'); });
    const v = t[k]; return typeof v === 'function' ? v.bind(t) : v;
  } });
}
function wrapRouteFn(o) {
  if (!o || o.__apexNetGuard || typeof o.route !== 'function') return;
  const R = o.route;
  o.route = function (url, h, opt) {
    if (typeof h !== 'function') return R.call(this, url, h, opt);
    const w = function (route, req) { return h.call(this, isBad(route.request().url()) ? safeRoute(route) : route, req); };
    return R.call(this, url, w, opt);
  };
  Object.defineProperty(o, '__apexNetGuard', { value: true });
}
function guardPage(p) { try { wrapRouteFn(p); } catch (e) {} return p; }
async function guardContext(c) {
  if (!c || c.__apexNetGuardCtx) return c;
  Object.defineProperty(c, '__apexNetGuardCtx', { value: true });
  /* ① 맨 먼저 거는 끊개 — 다른 손잡이가 다 흘려보낸(fallback) 것은 여기서 끊깁니다 */
  await c.route(BAD, r => r.abort('blockedbyclient'));
  if (typeof c.routeWebSocket === 'function') { try { await c.routeWebSocket(BAD, ws => ws.close()); } catch (e) {} }
  wrapRouteFn(c);
  const NP = c.newPage;
  c.newPage = async function () { return guardPage(await NP.apply(this, arguments)); };
  c.on('page', guardPage);
  c.pages().forEach(guardPage);
  return c;
}
function guardBrowser(b) {
  if (!b || b.__apexNetGuard) return b;
  Object.defineProperty(b, '__apexNetGuard', { value: true });
  const NC = b.newContext, NP = b.newPage;
  b.newContext = async function () { return guardContext(await NC.apply(this, arguments)); };
  /* newPage 는 제 창을 따로 만듭니다 — 만든 뒤 그 창에 겁니다(아직 아무 데도 안 갔을 때) */
  b.newPage = async function () { const p = await NP.apply(this, arguments); await guardContext(p.context()); return guardPage(p); };
  return b;
}
function guard(chromium) {
  if (!chromium || chromium.__apexNetGuard) return;
  const L = chromium.launch, P = chromium.launchPersistentContext;
  if (L) chromium.launch = async function (o) { return guardBrowser(await L.call(this, withRules(o))); };
  if (P) chromium.launchPersistentContext = async function (dir, o) { return guardContext(await P.call(this, dir, withRules(o))); };
  Object.defineProperty(chromium, '__apexNetGuard', { value: RULES });
}

/* playwright 를 <b>부를 때만</b> 손댑니다 — 브라우저 없는 자는 아무 값도 안 치릅니다 */
const PW = /^(playwright|playwright-core|@playwright\/test)$/;
const load = Module._load;
Module._load = function (req) {
  const m = load.apply(this, arguments);
  if (PW.test(req) && m && m.chromium) guard(m.chromium);
  return m;
};

/* run-checks 가 자식에게 넘길 NODE_OPTIONS — 있던 값은 지우지 않습니다 */
function nodeOptions(prev) {
  const me = path.resolve(__filename);
  const add = '--require=' + (/\s/.test(me) ? JSON.stringify(me) : me);
  const p = prev || '';
  return p.indexOf(me) >= 0 ? p : (p ? p + ' ' : '') + add;
}

module.exports = { BLOCK, RULES, BAD, isBad, withRules, nodeOptions };
