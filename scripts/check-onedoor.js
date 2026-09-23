/* <b>고객 문은 하나다</b> — 고객 365일 ← DB 통합 CRM

   사장님 말씀 (2026-09-23) — 「고객 365가 너무 복잡해 · DB통합CRM 도 정보가
   흩어져 있어서 하나로 합치고 싶어」.

   여기서 지키는 것
     1. 고객 365일을 열면 <b>찾기 → 내 고객 → 배정 DB</b> 차례로 서고,
        미션·달력은 <b>지우지 않고</b> 그 아래 접는 줄 안에 있다
     2. 배정 DB 분은 <b>이름을 가려</b> 세우고, 실명을 단추에 박지 않는다 (3번)
     3. 이미 고객 365일에 있는 분은 <b>한 번만</b> 선다 — 홈 찾기와 같은 셈(cusSplit)
     4. 배정 DB 를 <b>못 읽은 것과 없는 것</b>을 가른다 — 「0명」 이라 안 적는다 (1번)
     5. 메뉴·아래 탭바에 DB 통합 CRM 줄이 <b>안 선다</b> — 고객 365일을 못 여는
        분께는 <b>그대로 선다</b>(유일한 문을 없애지 않는다). 찾기로는 열린다
     6. 홈의 고객 자리는 <b>한 칸</b>이다 — 찾기 · 오늘 연락할 분 · 최근 보신 분

   견본 사람은 홍길동 (3번).                                                  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': (f.endsWith('.js') ? 'text/javascript' : 'text/html') + '; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

const SEED = () => {
  document.querySelectorAll('#osLoginGate').forEach(x => x.remove());
  window.toast = function () {};
  window.osClient = function () { return null; };           /* 서버는 안 부른다 */
  window.osLoadClients = function () {};
  try { localStorage.removeItem('apex_hm_fold_v1'); } catch (e) {}
  OS.profile = { id: 'me', role: 'member', name: '홍길동', active: true };
  OSC.view = 'list'; OSC.q = ''; OSC.loaded = true; OSC.busy = false; OSC.err = '';
  CM.pick = 'me'; CM.picked = true; CM.loaded = true; CM.who = { me: '홍길동' };
  OSC.list = [{ id: 'k1', advisor_id: 'me', name_masked: osMaskName('홍길동'), created_at: '2025-01-01T00:00:00Z' }];
  CUSF.dbs = [
    { id: 'd1', customer_name: '홍길동', region: '순천', stage: '1차 통화' },   /* 이미 365 에 있다 */
    { id: 'd2', customer_name: '홍길순', region: '여수', stage: '부재' }
  ];
  CUSF.err = ''; CUSF.busy = false; CUSF.q = '';
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const port = srv.address().port;
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2400);
  await pg.evaluate(SEED);

  console.log('\n[1] 고객 365일 — 찾기 → 내 고객 → 배정 DB, 미션·달력은 아래 접는 줄 안');
  const A = await pg.evaluate(() => {
    go('clients'); osRenderList();
    const h = document.getElementById('dynPane').innerHTML;
    const at = k => h.indexOf(k);
    const db = document.getElementById('oscDbList');
    return {
      order: at('oscSearch') >= 0 && at('oscSearch') < at('oscList') &&
             at('oscList') < at('oscDbList') && at('oscDbList') < at('hmFold_c365') &&
             at('hmFold_c365') < at('cli365Top'),
      crmBtn: !!document.querySelector('#dynPane [onclick="go(\'crm\')"]'),
      dbTxt: db ? db.innerText.replace(/\s+/g, ' ') : '',
      dbHtml: db ? db.innerHTML : ''
    };
  });
  is(A.order, '찾기 → 내 고객 → 배정 DB → (접는 줄) 미션·달력 차례로 선다');
  is(A.crmBtn, 'CRM 화면으로 가는 <b>🗄️ DB 배정·통화</b> 단추가 있다 — 지운 것이 아니다');

  console.log('\n[2] 배정 DB 분은 가려서 · 이미 365 에 있는 분은 한 번만');
  is(/1명/.test(A.dbTxt) && A.dbTxt.indexOf(await pg.evaluate(() => osMaskName('홍길순'))) >= 0,
     '아직 고객 카드가 없는 분만 선다 — ' + A.dbTxt.slice(0, 60));
  is(A.dbHtml.indexOf('홍길순') < 0 && A.dbHtml.indexOf('홍길동') < 0,
     '실명이 화면에도 단추에도 <b>안 박힌다</b> (3번)');
  is(A.dbHtml.indexOf("cusFindCrm('d2')") >= 0 && A.dbHtml.indexOf("cusFindCrm('d1')") < 0,
     '365 에 이미 있는 분(d1)은 DB 줄에 <b>또 안 선다</b>');
  const Q = await pg.evaluate(() => { osClientsFilter('여수'); return document.getElementById('oscDbList').innerText; });
  is(/1명 찾았습니다/.test(Q), '찾기 칸 하나가 <b>배정 DB 까지</b> 훑는다 (지역 「여수」)');
  await pg.evaluate(() => osClientsFilter(''));

  console.log('\n[3] 못 읽은 것과 없는 것은 다르다 (1번)');
  const N = await pg.evaluate(() => {
    const t = () => document.getElementById('oscDbList').innerText;
    CUSF.dbs = null; CUSF.busy = true; cusDbListPaint(); const wait = t();
    CUSF.dbs = []; CUSF.busy = false; CUSF.err = 'Failed to fetch'; cusDbListPaint(); const fail = t();
    CUSF.err = ''; cusDbListPaint(); const none = t();
    return { wait, fail, none };
  });
  is(/읽는 중/.test(N.wait) && !/0명/.test(N.wait), '읽는 중일 때 「0명」 이라 안 적는다');
  is(/못 읽었습니다/.test(N.fail) && /Failed to fetch/.test(N.fail) && !/0명/.test(N.fail) && /다시 읽기/.test(N.fail),
     '못 읽었으면 <b>못 읽었다</b>고 · 서버가 준 말 그대로 · 다시 읽을 단추');
  is(/0명/.test(N.none), '다 읽었는데 없으면 그때는 0명이라 적는다');

  console.log('\n[4] 메뉴·아래 탭바 — DB 통합 CRM 은 고객 365일 한 문 안으로');
  const M = await pg.evaluate(() => {
    NAV_Q = ''; renderNav();
    const nav = !!document.querySelector('#navHost .tab-btn[data-tab="crm"]');
    const tb = (typeof tbHtml === 'function') ? tbHtml('home') : '';
    NAV_Q = 'DB 통합 CRM'; renderNav();
    const found = !!document.querySelector('#navHost .tab-btn[data-tab="crm"]');
    NAV_Q = ''; renderNav();
    const allowed = osTabAllowed('crm');
    /* 고객 365일을 <b>못 여는</b> 분 — 그러면 CRM 이 유일한 문이다 */
    const real = window.osTabAllowed;
    window.osTabAllowed = function (t) { return t === 'clients' ? false : real(t); };
    renderNav();
    const back = !!document.querySelector('#navHost .tab-btn[data-tab="crm"]');
    const tb2 = tbHtml('home');
    window.osTabAllowed = real; renderNav();
    return { nav, tb: tb.indexOf("'crm'") >= 0 || tb.indexOf('"crm"') >= 0, found, allowed, back,
             tb2: tb2.indexOf('crm') >= 0 };
  });
  is(!M.nav, '서랍 메뉴에 DB 통합 CRM 줄이 <b>안 선다</b>');
  is(!M.tb, '아래 탭바에 DB 칸이 <b>안 선다</b>');
  is(M.found && M.allowed, '찾기로 치면 나오고 권한도 그대로다 — 지운 것이 아니다');
  is(M.back && M.tb2, '고객 365일을 <b>못 여는</b> 분께는 그대로 선다 — 유일한 문을 안 없앤다');

  console.log('\n[5] 홈 — 고객 자리는 한 칸');
  const H = await pg.evaluate(() => {
    go('home');
    const one = document.getElementById('hmCusOne');
    const home = document.getElementById('dynPane');
    return {
      one: !!one,
      inside: !!(one && one.querySelector('#cusFindBox') && one.querySelector('#ccHomeLine') &&
                 one.querySelector('#hmFold_cli')),
      finds: home.querySelectorAll('#cusFindBox').length,
      lines: home.querySelectorAll('#ccHomeLine').length
    };
  });
  is(H.one && H.inside, '찾기 · 오늘 연락할 분 · 최근 보신 분이 <b>한 테두리</b> 안에 있다');
  is(H.finds === 1 && H.lines === 1, '홈에 찾기 칸·연락 한 줄이 <b>두 번 안 선다</b>');

  is(errs.length === 0, '도는 동안 에러가 없다' + (errs.length ? ' — ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '가지 어긋납니다' : '\n고객 문 하나 — 전부 맞습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
