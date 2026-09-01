/* <b>「내 허락 없이 내가 머무는 페이지에서 벗어나지 않게」</b>
   그리고 <b>SECURITY DEFINER 뷰</b> (Supabase 린터가 잡아 준 자리)

   ── ① 화면이 혼자 홈으로 넘어가던 자리 ───────────────────────────
   <code>currentTab()</code> 이 화면(DOM)에서 <b>다시 세어</b> 답하고
   있었다. 그런데 메뉴를 다시 그린 직후·서랍이 접힌 폰·메뉴에 안 세운
   화면에서는 켜진 단추가 없다. 그때 <b>'home' 을 돌려줬다.</b>

   그 값을 <code>osRefreshIfClients</code> 가 받아 <code>go('home')</code>
   을 불렀다 — 토큰이 갱신되거나 다시 로그인될 때마다 <b>보던 화면이
   허락 없이 홈으로</b> 넘어갔다.

   「지금 어느 화면인가」는 한 곳만 안다 (CLAUDE.md 5번). 그 한 곳은
   <code>lastTab</code> 이다 — <code>go()</code> 가 옮길 때마다 적어 둔다.

   ── ② team_overview 뷰 ──────────────────────────────────────────
   뷰에 <code>security_invoker</code> 를 안 켜면 <b>만든 사람 권한</b>으로
   돈다(SECURITY DEFINER). 아래 표에 걸어 둔 행 보안이 뷰를 지나 샌다.
   같은 뷰가 <b>네 곳</b>에 적혀 있어, 한 곳만 고치면 나머지가 샌다.   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('\n[1] team_overview 뷰 — 부르는 사람 권한으로 돈다');
  /* 뷰가 적힌 곳을 <b>전부</b> 찾아 하나씩 본다 — 한 곳만 고치면 나머지가 샌다 */
  const files = ['migration_26_team.sql', 'migration_ALL_NOW.sql', 'app/index.html'];
  let spots = 0, leaky = [];
  files.forEach(f => {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\s+/g, ' ');
    const re = /create or replace view[", ]+public\.team_overview[", ]*(.{0,80})/g;
    let m;
    while ((m = re.exec(s))) {
      spots++;
      if (!/security_invoker\s*=\s*on/.test(m[1])) leaky.push(f + ' :: …' + m[1].slice(0, 46));
    }
  });
  is(spots >= 4, '  뷰가 적힌 자리를 <b>' + spots + '곳</b> 찾았다 (넷 이상)');
  is(!leaky.length,
     '  <b>모든 자리</b>가 security_invoker 로 돈다' + (leaky.length ? ' — 새는 곳: ' + leaky.join(' | ') : ''));
  /* SQL 은 -- 주석을 쓰지 않는다 (CLAUDE.md 9번) */
  const badCmt = ['migration_26_team.sql', 'migration_ALL_NOW.sql']
    .filter(f => /(^|\n)\s*--/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  is(!badCmt.length, '  SQL 에 <b>-- 주석이 없다</b> (9번)' + (badCmt.length ? ' — ' + badCmt.join(',') : ''));

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[2] 「지금 어느 화면인가」는 한 곳만 안다 (5번)');
  const A = await page.evaluate(() => {
    const was = lastTab;
    lastTab = 'crm';
    /* 메뉴에 켜진 단추를 <b>일부러 지운다</b> — 메뉴를 다시 그린 직후의 상태 */
    document.querySelectorAll('.tab-btn.on').forEach(b => b.classList.remove('on'));
    const t1 = currentTab();
    lastTab = '';
    const t2 = currentTab();
    lastTab = was;
    return { t1, t2 };
  });
  is(A.t1 === 'crm', '  켜진 단추가 없어도 <b>보던 화면</b>을 답한다 — 「' + A.t1 + '」');
  is(A.t2 !== 'home', '  정말 모를 때도 <b>「홈」 이라고 지어내지 않는다</b> — 「' + A.t2 + '」 (1번)');

  console.log('\n[3] 다시 로그인돼도 보던 화면에서 안 벗어난다');
  const B = await page.evaluate(async () => {
    const went = [];
    const realGo = window.go;
    window.go = function (t) { went.push(t); };
    const was = lastTab;

    /* ① 고객 365일을 보고 있다 — 여기는 다시 그려야 하는 화면이다 */
    lastTab = 'clients';
    document.querySelectorAll('.tab-btn.on').forEach(b => b.classList.remove('on'));
    osRefreshIfClients();
    const onClients = went.slice();

    /* ② 계산기를 보고 있다 — 여기는 건드리면 쓰던 글이 날아간다 */
    went.length = 0;
    lastTab = 'finance';
    osRefreshIfClients();
    const onFinance = went.slice();

    /* ③ 어디 있는지 정말 모른다 — 옮기면 안 된다 */
    went.length = 0;
    lastTab = '';
    document.querySelectorAll('.tab-btn.on').forEach(b => b.classList.remove('on'));
    osRefreshIfClients();
    const onUnknown = went.slice();

    window.go = realGo; lastTab = was;
    return { onClients, onFinance, onUnknown };
  });
  is(B.onClients.join(',') === 'clients',
     '  고객 365일에 있으면 <b>고객 365일을</b> 다시 그린다 — 홈으로 안 간다 (' +
     (B.onClients.join(',') || '안 옮김') + ')');
  is(!B.onFinance.length, '  계산기에 있으면 <b>아예 안 옮긴다</b> — 쓰던 글을 지키기 위해');
  is(!B.onUnknown.length,
     '  어디 있는지 모르면 <b>안 옮긴다</b> — 예전에는 여기서 홈으로 갔다 (' +
     (B.onUnknown.join(',') || '안 옮김') + ')');

  console.log('\n[4] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 어긋납니다')
                  : '✓ 보던 화면에서 허락 없이 벗어나지 않고, 뷰가 새지 않습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
