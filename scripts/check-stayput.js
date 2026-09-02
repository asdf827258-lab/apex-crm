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

  console.log('\n[2-2] 어느 갈래로 가도 「지금 어디」가 따라온다');
  /* go() 안에는 갈래별 빠른 return 이 여럿이다 — 계산기·CRM·지도·미끼레이더…
     그 갈래들은 navMark 만 부르고 lastTab 을 안 적고 있었다. 그래서
     「지금 어느 화면인가」의 답이 두 벌이 되어 서로 어긋났다. */
  const A2 = await page.evaluate(async () => {
    const out = {};
    for (const t of ['bohum', 'clients', 'growboard', 'apexmaster']) {
      try { go(t); } catch (e) {}
      await new Promise(r => setTimeout(r, 120));
      out[t] = currentTab();
    }
    return out;
  });
  const off = Object.keys(A2).filter(k => A2[k] !== k);
  is(!off.length,
     '  갈래마다 <b>제 이름</b>을 답한다' +
     (off.length ? ' — 어긋남: ' + off.map(k => k + '→' + A2[k]).join(', ') : ''));
  /* 적는 자리가 <b>하나</b>인가 — 갈래마다 적으면 또 빠뜨린다 */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const goSrc = (SRC.match(/\nfunction go\(tab\)\{[\s\S]*?\n\}/) || [''])[0];
  const marks = (goSrc.match(/\blastTab\s*=\s*tab\b/g) || []).length;
  is(marks <= 2,
     '  <b>go() 안에서 적는 자리가 둘 이하</b>다 — 지금 ' + marks + '곳 (막힌 화면 + 본길)');

  console.log('\n[2-3] 「지금 어디」와 「그 전에 어디」는 다른 것이다');
  /* lastTab 하나로 두 가지를 시키면 둘 다 틀린다. 갈래별 빠른 길이
     lastTab 을 안 적던 시절에는 그 값이 우연히 「그 전 화면」 노릇을 해서
     나가기가 됐다 — 제대로 적기 시작하자 <b>나가기가 제자리로</b> 갔다.
     실제로 CI 가 「뒤로 나오면 닫힌다」 에서 잡았다. */
  const A3 = await page.evaluate(async () => {
    const went = [];
    const realGo = window.go;
    /* 진짜 go 로 옮긴 뒤, 나가기가 <b>어디를 부르는지</b>만 가로챈다 */
    go('home'); await new Promise(r => setTimeout(r, 80));
    go('finance'); await new Promise(r => setTimeout(r, 200));
    const nowIn = currentTab();
    window.go = function (t) { went.push(t); };
    exitFinance();
    window.go = realGo;
    return { nowIn, back: went[0] || '' };
  });
  is(A3.nowIn === 'finance', '  계산기에 들어가면 <b>계산기라고</b> 답한다 — 「' + A3.nowIn + '」');
  is(A3.back === 'home',
     '  나가기는 <b>그 전 화면</b>으로 간다 — 「' + A3.back + '」 (제자리로 돌면 안 닫힌다)');
  is(A3.back !== A3.nowIn, '  나가기가 <b>자기 자신</b>을 부르지 않는다');

  console.log('\n[2-4] 전체화면 껍데기가 빠짐없이 벗겨진다');
  /* 「한장 보험료 비교」 만 OS_FULL_MODES 에 이름이 빠져 있었다. 그래서
     「← 워크스페이스」 를 눌러도 껍데기가 안 벗겨지고 계속 덮고 있었다 —
     뒤에서는 워크스페이스가 멀쩡히 떠 있는데 눈에는 안 보인다.
     CSS 에 body.○○-mode 를 만들면 그 이름을 목록에도 적어야 한다. */
  const M = await page.evaluate(() => {
    const css = [];
    /* 이 파일이 실제로 쓰는 모드 이름을 <b>스타일에서</b> 긁어 온다 */
    return { known: OS_FULL_MODES.slice() };
  });
  const SRC2 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  /* <b>주석은 빼고 본다.</b> 주석에 「body.xxx-mode」 라고 설명을 적어 두면
     점검이 그것을 진짜 화면으로 세어 <b>없는 것이 빠졌다</b>고 울린다 —
     헛알람은 안 잡는 알람보다 나쁘다 (CLAUDE.md 8번). */
  const SRC2C = SRC2.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const inCss = Array.from(new Set(
    (SRC2C.match(/body\.[a-z_]+-mode/g) || []).map(x => x.replace('body.', ''))));
  const missing = inCss.filter(m => M.known.indexOf(m) < 0);
  is(inCss.length >= 11, '  전체화면이 <b>' + inCss.length + '가지</b> 있다');
  is(!missing.length,
     '  <b>하나도 빠짐없이</b> 목록에 있다' + (missing.length ? ' — 빠진 것: ' + missing.join(', ') : ''));
  /* 실제로 벗겨지는지 눌러 본다 */
  const X = await page.evaluate(async () => {
    OS.profile = { id: 'me', role: 'owner', name: '윤시현', plan: 'team', active: true };
    go('clients'); await new Promise(r => setTimeout(r, 150));
    go('onecmp'); await new Promise(r => setTimeout(r, 250));
    const inn = document.body.className.indexOf('onecmp-mode') >= 0;
    exitOneCmp(); await new Promise(r => setTimeout(r, 250));
    return { inn, out: document.body.className.indexOf('onecmp-mode') >= 0, landed: lastTab };
  });
  is(X.inn, '  한장 보험료 비교가 <b>열린다</b>');
  is(!X.out && X.landed === 'clients',
     '  「← 워크스페이스」 를 누르면 <b>정말 나온다</b> — 도착 「' + X.landed + '」');

  /* ── 덮개는 <b>제 차례에만</b> 덮는다 ────────────────────────────────
     2026-09-02, 앱이 통째로 <b>하얗게</b> 떴습니다. 로그인해도 흰 판만
     보이고 메뉴도 본문도 없었습니다.

     원인은 CSS 한 줄이었습니다. <code>body.finance-mode #financeScreen
     {display:block}</code> 의 <b>한가운데에</b> 다른 화면 규칙을 끼워 넣으면서
     앞의 <code>body.finance-mode</code> 가 떨어져 나가,
     <code>#financeScreen{display:block}</code> 만 남았습니다. 그러자 흰 껍데기가
     z-index 300 으로 <b>늘</b> 앱 위를 덮었습니다.

     여기서 재는 것은 <b>모양이 아니라 결과</b>입니다 — 「아무 화면도 안 열었을
     때, 화면을 덮고 있는 것이 있는가」. 이렇게 재야 CSS 를 어떻게 쓰든 잡힙니다
     (CLAUDE.md 8번). */
  console.log('\n[2-5] 아무 화면도 안 열었을 때 — 덮고 있는 것이 없다');
  const CV = await page.evaluate(async () => {
    OS.profile = { id: 'me', role: 'owner', name: '홍길동', plan: 'team', active: true };
    /* 로그인 칸은 <b>일부러</b> 내린다 — 그것이 덮는 것은 이 자리 이야기가
       아니다(로그인은 check-loginhold 가 본다). 안 내리면 무엇을 재는지
       모르는 헛알람이 된다 (8번). */
    try { osHideLoginGate(); } catch (e) {}
    osFullMode('');                       /* 어떤 전체화면도 아니다 */
    go('home');
    await new Promise(r => setTimeout(r, 400));
    const W = window.innerWidth, H = window.innerHeight;
    /* 화면 <b>한가운데</b>에서 위에 있는 것이 무엇인가 — 눈에 보이는 그대로 */
    const top = document.elementFromPoint(Math.round(W / 2), Math.round(H / 2));
    const chain = []; let e = top;
    while (e && e !== document.body) { chain.push(e.id || ('.' + (e.className || '').split(' ')[0])); e = e.parentElement; }
    /* 덮개들이 실제로 접혀 있는가 */
    const covers = [...document.querySelectorAll('body > div[id$="Screen"]')]
      .filter(x => getComputedStyle(x).display !== 'none')
      .map(x => x.id);
    const tn = document.getElementById('topnav');
    const tnTop = tn ? document.elementFromPoint(30, Math.round(tn.getBoundingClientRect().height / 2)) : null;
    return { chain, covers, bodyClass: document.body.className,
             tnReach: !!(tnTop && (tnTop.id === 'topnav' || tnTop.closest('#topnav'))) };
  });
  is(CV.covers.length === 0,
     '  전체화면 껍데기가 <b>하나도 안 펴져 있다</b>' +
     (CV.covers.length ? ' ← 덮고 있는 것: ' + CV.covers.join(', ') : ''));
  is(CV.chain.indexOf('financeScreen') < 0 && CV.chain.indexOf('crmScreen') < 0,
     '  화면 한가운데를 눌렀을 때 <b>덮개가 안 잡힌다</b> — 「' + (CV.chain[0] || '?') + '」');
  is(CV.tnReach, '  위 띠가 <b>손에 닿는다</b> — 덮개에 안 가려진다');
  is(CV.bodyClass.indexOf('-mode') < 0, '  몸에 전체화면 표시가 <b>안 남아 있다</b>');
  /* CSS 에서도 본다 — 덮개를 펴는 규칙은 <b>반드시 body.○○-mode 를 달고</b> 있어야 한다 */
  const openers = (SRC2C.match(/(^|\n)\s*(body\.[a-z_]+-mode\s+)?#[A-Za-z]+Screen\s*\{[^}]*display\s*:\s*block[^}]*\}/g) || []);
  const naked = openers.filter(r => !/body\.[a-z_]+-mode/.test(r));
  is(openers.length > 5, '  덮개를 펴는 규칙이 ' + openers.length + '가지다');
  is(naked.length === 0,
     '  <b>모두 body.○○-mode 를 달고 있다</b> — 조건 없이 펴는 규칙이 없다' +
     (naked.length ? ' ← ' + naked.map(x => x.trim().split('{')[0]).join(', ') : ''));

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
