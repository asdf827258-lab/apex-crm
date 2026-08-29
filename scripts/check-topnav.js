/* <b>메뉴를 찾는 법이 화면 크기마다 달랐다.</b>

   왼쪽 세로 메뉴는 <b>웹에서만</b> 늘 보이고, 폰에서는 ☰ 를 눌러야 나오는
   서랍이었습니다. 같은 앱인데 「메뉴가 어디 있나」의 답이 둘이었습니다.

   사장님 말씀 그대로입니다 — 「메뉴도 가로 버전으로 위에 붙여라,
   웹에서도 그대로」.

   이제 <b>어디서나 위에 가로로</b> 붙습니다. 세로 메뉴는 없애지 않고
   서랍으로 남깁니다(☰) — 즐겨찾기·최근 쓴 것·설치 안내가 거기 있습니다.

   ── 여기서 지키는 것 ───────────────────────────────────────────

   제일 무서운 것은 <b>메뉴가 두 벌이 되는 것</b>입니다(CLAUDE.md 5번).
   가로 띠에 메뉴를 다시 적어 두면, 새 화면이 생겼을 때 한쪽에만 붙고
   사장님은 <b>「어제는 여기 있었는데」</b> 하시게 됩니다. 그래서 —

     1. 가로 메뉴가 <b>어느 폭에서나</b> 맨 위에 보이는가 (폰·노트북·웹)
     2. 칸 목록이 <b>사이드바와 한 칸도 안 다른가</b> — 두 벌이 아닌가
     3. 등급·hide 로 가린 칸이 <b>양쪽에서 똑같이</b> 가려지는가
     4. 눌러서 <b>실제로 그 화면이 열리는가</b> · 고르면 저절로 닫히는가
     5. 지금 보는 화면이 <b>강조</b>되는가 (navMark 한 곳에서)
     6. <b>찾기</b>가 도는가 · 못 찾으면 그렇다고 말하는가 ·
        치는 중에 <b>커서를 안 뺏는가</b>
     7. 세로 메뉴가 화면을 <b>안 먹는가</b>(서랍) · ☰ 로 열리는가
     8. 폰에서 <b>가로로 안 밀리는가</b>

   ── 나중에 옮긴 것 ─────────────────────────────────────────────

   위 띠에 있던 <b>「메뉴 찾기」 칸을 뺐습니다</b> — 사장님이 「메뉴검색이
   계속 오류가 걸린다」 하셔서 그 자리를 <b>🎙 음성 비서</b>에 내줬습니다.
   찾기는 <b>없앤 것이 아니라</b> ☰ 서랍 맨 위에 그대로 있습니다. 그래서
   [5] 는 이제 <b>서랍의 찾기 칸</b>을 재고, [5-1] 이 그 자리에 음성 비서가
   섰는지 · 눌러서 실제로 열리는지 · <b>여는 자리가 한 곳인지</b>를 봅니다.
   여는 자리가 둘이 되면 한쪽만 vaBoot() 을 빠뜨려 「눌러도 아무 일이
   없다」가 됩니다 (CLAUDE.md 5번).                                     */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

const SIZES = [['웹 1440', 1440, 900], ['노트북 1024', 1024, 800], ['폰 390', 390, 780]];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port + '/app/';
  const browser = await chromium.launch();
  const errs = [];

  console.log('\n[1] 어느 폭에서나 위에 가로로 붙는다');
  const open = async (w, h) => {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', e => errs.push(String(e).slice(0, 150)));
    await p.goto(B, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    return p;
  };
  const pages = {};
  for (const [label, w, h] of SIZES) {
    const p = await open(w, h);
    pages[label] = p;
    /* <b>내려 보고 잰다.</b> 맨 위에서만 재면 그냥 첫 요소여도 top=0 이라,
       sticky 를 떼어도 통과한다 — 실제로 그렇게 뚫렸다 (CLAUDE.md 8번). */
    const R = await p.evaluate(async () => {
      const tn = document.getElementById('topnav');
      const sb = document.getElementById('sidebar');
      const app = document.querySelector('.app');
      const top0 = tn ? Math.round(tn.getBoundingClientRect().top) : -1;
      window.scrollTo(0, 600);
      const m = document.getElementById('main'); if (m) m.scrollTop = 600;
      await new Promise(r => setTimeout(r, 250));
      const top1 = tn ? Math.round(tn.getBoundingClientRect().top) : -1;
      return {
        on: !!tn && getComputedStyle(tn).display !== 'none',
        top0, top1,
        groups: document.querySelectorAll('#tnGroups .tn-g').length,
        /* 세로 메뉴가 <b>격자 칸을 차지하면</b> 화면을 먹는다 — 밀려나 있어도
           자리는 남는다. 실제로 그 자리로 뚫렸다. 칸 수까지 본다. */
        sbOut: sb ? Math.round(sb.getBoundingClientRect().right) <= 0 : false,
        cols: app ? getComputedStyle(app).gridTemplateColumns.trim().split(/\s+/).length : 0
      };
    });
    is(R.on && R.top0 === 0, '  ' + label + ' — 맨 위에 붙어 있다 (top=' + R.top0 + ')');
    is(R.top1 === 0, '  ' + label + ' — <b>내려도 그대로 위에 있다</b> (600px 내린 뒤 top=' + R.top1 + ')');
    is(R.groups > 0, '  ' + label + ' — 그룹 단추가 ' + R.groups + '개 보인다');
    is(R.sbOut, '  ' + label + ' — 세로 메뉴는 <b>서랍</b>이라 밀려나 있다');
    is(R.cols === 1, '  ' + label + ' — 세로 메뉴가 <b>자리를 안 차지한다</b> (본문 칸 ' + R.cols + '개)');
  }

  const page = pages['웹 1440'];

  console.log('\n[2] 칸 목록이 사이드바와 한 칸도 다르지 않다 — 메뉴가 두 벌이 아니다');
  const P = await page.evaluate(() => {
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    renderNav();
    const gs = [...document.querySelectorAll('#tnGroups .tn-g')];
    const top = new Set(), per = [];
    gs.forEach(b => {
      b.click();
      const n = document.querySelectorAll('#tnPane .tab-btn').length;
      per.push({ g: b.textContent.trim(), n });
      document.querySelectorAll('#tnPane .tab-btn')
        .forEach(x => top.add(x.getAttribute('data-tab')));
    });
    const side = new Set([...document.querySelectorAll('#navHost .tab-btn')]
      .map(b => b.getAttribute('data-tab')));
    return {
      groups: gs.length, per,
      topN: top.size, sideN: side.size,
      onlyTop: [...top].filter(x => !side.has(x)),
      onlySide: [...side].filter(x => !top.has(x)),
      stars: document.querySelectorAll('#tnPane .nav-star').length
    };
  });
  is(P.groups >= 10, '  그룹이 ' + P.groups + '개다');
  is(P.per.every(x => x.n > 0), '  <b>빈 그룹이 없다</b> — 눌렀는데 아무것도 없는 자리가 없다' +
     (P.per.filter(x => !x.n).length ? ' ← ' + P.per.filter(x => !x.n).map(x => x.g).join(',') : ''));
  is(P.topN === P.sideN && P.topN > 40,
     '  가로 ' + P.topN + '칸 = 세로 ' + P.sideN + '칸 — <b>같은 표에서 나온다</b>');
  is(P.onlySide.length === 0,
     '  세로에만 있는 칸이 <b>없다</b> — 가로로 바꾸면서 잃은 칸이 없다' +
     (P.onlySide.length ? ' ← ' + P.onlySide.slice(0, 5).join(',') : ''));
  is(P.onlyTop.length === 0,
     '  가로에만 있는 칸도 <b>없다</b> — hide 로 가린 칸이 위로 새지 않는다' +
     (P.onlyTop.length ? ' ← ' + P.onlyTop.slice(0, 5).join(',') : ''));
  is(P.stars > 0, '  ☆ 즐겨찾기 단추도 그대로 붙는다 — 사이드바가 쓰던 것을 그대로 부른다');
  /* 메뉴 내용을 가로 띠에 다시 적어 두면 그 순간 두 벌이다 */
  const SRC = fs.readFileSync('app/index.html', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  const tnSrc = (SRC.match(/function tnPaint\(\)[\s\S]*?\n\}/) || [''])[0] +
                (SRC.match(/function tnGroups\(\)[\s\S]*?\n\}/) || [''])[0];
  is(/visibleTabs\(\)/.test(tnSrc), '  그룹을 <b>visibleTabs()</b> 에서 읽는다 — 표를 다시 안 적었다');
  is(/navBtnHtml\(/.test(tnSrc), '  칸 단추를 <b>navBtnHtml</b> 로 만든다 — 사이드바와 같은 것');
  is(!/\{\s*id\s*:\s*'/.test(tnSrc), '  가로 띠 안에 메뉴 줄을 <b>새로 적어 두지 않았다</b>');

  /* ── 색도 두 벌이면 안 된다 ────────────────────────────────────────
     갈래를 색으로 나눠 놓고 위·옆이 <b>다른 색</b>이면, 같은 「내 고객」을
     위에서는 파랑 · 옆에서는 초록으로 외우시게 된다. 색을 정하는 곳은
     navRamp() 한 곳이어야 한다 (5번). 여기서는 <b>실제로 칠해진 값</b>을
     양쪽에서 읽어 갈래 이름끼리 맞춰 본다 — 함수를 부르는지가 아니라. */
  console.log('\n[2-1] 갈래 색이 위·옆에서 같다 — 같은 칸을 두 색으로 외우지 않게');
  const GC = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    renderNav();
    const key = s => (s || '').replace(/[\s\d•]/g, '').replace(/[\u{1F000}-\u{1FAFF}←-➿️]/gu, '');
    const top = {}, side = {};
    document.querySelectorAll('#tnGroups .tn-g').forEach(b => {
      top[key(b.textContent)] = b.style.getPropertyValue('--gc').trim();
    });
    document.querySelectorAll('#navHost .nav-group').forEach(g => {
      const l = g.querySelector('.ngl-t');
      side[key(l && l.textContent)] = g.style.getPropertyValue('--gc').trim();
    });
    const names = Object.keys(top);
    return {
      names, top, side,
      diff: names.filter(n => !side[n] || side[n] !== top[n]),
      blank: names.filter(n => !top[n]),
      uniq: new Set(names.map(n => top[n])).size
    };
  });
  is(GC.blank.length === 0,
     '  갈래 <b>' + GC.names.length + '개가 모두 색을 받았다</b>' +
     (GC.blank.length ? ' ← 색이 없는 갈래: ' + GC.blank.join(' · ') : ''));
  is(GC.diff.length === 0,
     '  <b>한 갈래도 색이 안 어긋난다</b> — 위에서 본 색 = 옆에서 본 색' +
     (GC.diff.length ? ' ← 어긋난 갈래: ' +
        GC.diff.slice(0, 4).map(n => n + '(위 ' + GC.top[n] + ' / 옆 ' + (GC.side[n] || '없음') + ')').join(' · ') : ''));
  is(GC.uniq === GC.names.length,
     '  갈래마다 <b>다른 색</b>이다 — ' + GC.uniq + '가지 / ' + GC.names.length + '갈래' +
     (GC.uniq === GC.names.length ? '' : ' ← 색이 겹치면 나눈 뜻이 없다'));
  /* 한 줄기로 흐르는가 — 위는 보라(파랑기 우세), 아래는 금빛(붉은기 우세) */
  const rgb = s => (s || '0 0 0').split(/\s+/).map(Number);
  const first = rgb(GC.top[GC.names[0]]), last = rgb(GC.top[GC.names[GC.names.length - 1]]);
  is(first[2] > first[0] && last[0] > last[2],
     '  <b>한 줄기로 흐른다</b> — 맨 위는 보라 계열(' + GC.top[GC.names[0]] +
     ') · 맨 아래는 금빛 계열(' + GC.top[GC.names[GC.names.length - 1]] + ')');
  const gradSrc = (SRC.match(/function tnPaint\(\)[\s\S]*?\n\}/) || [''])[0];
  is(/navRamp\(/.test(gradSrc),
     '  색을 <b>navRamp() 에서 받아 쓴다</b> — 가로 띠가 색을 새로 정하지 않는다');

  /* ── 「한눈에 안 들어온다」 를 실제로 고쳤는가 ────────────────────────
     ① 둥근 알약은 옆 칸과 경계가 흐리다 → <b>각지게</b> 하고 왼쪽에 색막대
     ② 갈래가 열넷이라 노트북에서도 넘친다. 폰은 손으로 밀면 되지만
        <b>마우스에는 가로로 미는 방법이 없다</b> → 휠·끌기·화살표
     ③ 화면을 고르면 곧바로 접혀 <b>같은 갈래의 두 번째 칸</b>을 보려면
        매번 다시 펴야 했다 → 펴 둔 채로 두고, 닫는 것은 사장님이         */
  console.log('\n[2-2] 각지게 · 마우스로 넘어가게 · 펴 둔 갈래는 그대로');
  const M = await page.evaluate(async () => {
    const O = {};
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    renderNav();
    const g0 = document.querySelector('#tnGroups .tn-g'), cs = getComputedStyle(g0);
    O.radius = parseFloat(cs.borderTopLeftRadius);
    O.leftBar = parseFloat(cs.borderLeftWidth);
    const bar = document.getElementById('tnGroups'), wrap = document.getElementById('tnGroupsWrap');
    O.over = bar.scrollWidth - bar.clientWidth;
    /* 휠 — 세로로 굴리면 가로로 가야 한다 */
    const b0 = bar.scrollLeft;
    bar.dispatchEvent(new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 140));
    O.wheel = bar.scrollLeft - b0;
    /* 「오른쪽에 더 있다」 를 보여 주는가 */
    O.edge = wrap.className;
    tnNudge(1); await new Promise(r => setTimeout(r, 400));
    O.arrow = bar.scrollLeft - b0;
    /* 펴고 → 화면을 옮겨도 그대로인가 */
    document.querySelectorAll('#tnGroups .tn-g')[2].click();
    await new Promise(r => setTimeout(r, 150));
    O.openA = document.getElementById('tnPane').classList.contains('on');
    const first = document.querySelector('#tnPane .tab-btn');
    if (first) go(first.getAttribute('data-tab'));
    await new Promise(r => setTimeout(r, 300));
    O.openB = document.getElementById('tnPane').classList.contains('on');
    O.head = ((document.querySelector('.tn-ph b') || {}).textContent || '');
    O.saved = localStorage.getItem('apex_tn_open') || '';
    O.marked = !!document.querySelector('#tnPane .tab-btn.on');
    /* 닫는 길이 있는가 · 닫으면 기억도 지우는가 */
    const x = document.querySelector('.tn-ph button');
    O.hasX = !!x; if (x) x.click();
    await new Promise(r => setTimeout(r, 150));
    O.openC = document.getElementById('tnPane').classList.contains('on');
    O.savedC = localStorage.getItem('apex_tn_open') || '';
    return O;
  });
  is(M.radius <= 6, '  갈래 단추가 <b>각지다</b> — 모서리 ' + M.radius + 'px (7px 미만)');
  is(M.leftBar >= 2, '  왼쪽에 <b>색막대</b>가 서 있다 — ' + M.leftBar + 'px · 색으로 먼저 읽힌다');
  is(M.over > 0, '  갈래가 <b>한 화면을 넘친다</b> — ' + M.over + 'px · 그래서 넘길 수 있어야 한다');
  is(M.wheel > 0, '  <b>휠을 굴리면 옆으로 간다</b> — ' + M.wheel + 'px' +
     (M.wheel > 0 ? '' : ' ← 마우스만 쓰시면 넘길 방법이 없습니다'));
  is(M.arrow > M.wheel, '  <b>화살표로도 넘어간다</b> — ' + M.arrow + 'px');
  is(/can-r|can-l/.test(M.edge), '  <b>「더 있다」 를 표시한다</b> — 「' + M.edge + '」');
  is(M.openA === true, '  갈래를 누르면 펴진다');
  is(M.openB === true,
     '  <b>화면을 골라도 그대로 펴져 있다</b>' +
     (M.openB ? ' — 같은 갈래의 두 번째 칸을 다시 펴지 않고 누른다' : ' ← 접혔습니다'));
  is(M.head.length > 0, '  펼침칸이 <b>어느 갈래인지 글로도</b> 적는다 — 「' + M.head + '」');
  is(M.marked === true, '  펼침칸 안에서 <b>지금 보는 칸이 강조</b>된다 — 어디 있는지 안다');
  is(M.saved.length > 0, '  펴 둔 갈래를 <b>기억한다</b> — 새로고침해도 그대로 (「' + M.saved + '」)');
  is(M.hasX && M.openC === false, '  <b>닫는 길이 있다</b> — 펼침칸 머리의 ✕');
  is(M.savedC === '', '  직접 닫으면 <b>기억도 지운다</b> — 다음에 안 펴진다');

  console.log('\n[3] 등급으로 가린 칸은 양쪽에서 똑같이 가려진다');
  const G = await page.evaluate(() => {
    OS.profile = null;                 /* 로그인 안 한 상태 */
    renderNav();
    const gs = [...document.querySelectorAll('#tnGroups .tn-g')];
    const top = new Set();
    gs.forEach(b => { b.click(); document.querySelectorAll('#tnPane .tab-btn')
      .forEach(x => top.add(x.getAttribute('data-tab'))); });
    const side = new Set([...document.querySelectorAll('#navHost .tab-btn')]
      .map(b => b.getAttribute('data-tab')));
    return { topN: top.size, sideN: side.size,
             diff: [...top].filter(x => !side.has(x)).concat([...side].filter(x => !top.has(x))) };
  });
  is(G.topN === G.sideN && G.diff.length === 0,
     '  로그인 안 했을 때도 <b>가로 ' + G.topN + ' = 세로 ' + G.sideN + '</b> — 한쪽만 열리지 않는다');
  is(G.topN < P.topN, '  로그인 전에는 <b>덜</b> 보인다 (' + G.topN + ' < ' + P.topN + ') — 가림이 살아 있다');

  /* 전에는 여기서 <b>「고르면 저절로 닫힌다」</b> 를 봤다. 그런데 그러면
     같은 갈래의 두 번째 칸을 보려고 <b>매번 다시 펴야</b> 했다. 사장님이
     「그대로 유지되도록」 이라 하셔서 뒤집었다 — 이제 펴 둔 채로 둔다.
     대신 <b>화면을 덮으면 안 되므로</b> 그 자리를 대신 지킨다:
     펼침칸에 높이 한도가 있고 · 닫는 단추가 있고 · 서랍은 그대로 닫힌다. */
  console.log('\n[4] 눌러서 실제로 열린다 · 펴 둔 것은 그대로 · 화면을 덮지 않는다');
  const C = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    renderNav();
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.add('open');            /* 서랍을 열어 두고 */
    const gs = [...document.querySelectorAll('#tnGroups .tn-g')];
    /* <b>제일 큰 갈래</b>로 잰다. 작은 갈래로 재면 높이 한도를 없애도
       원래 짧아서 통과한다 — 실제로 그렇게 헛돌았다 (8번). */
    let big = 0, bigN = -1;
    gs.forEach((g, i) => {
      const n = parseInt((g.querySelector('.tng-n') || {}).textContent || '0', 10);
      if (n > bigN) { bigN = n; big = i; }
    });
    gs[big].click();
    const pane = document.getElementById('tnPane');
    const paneOn = pane.classList.contains('on');
    const btn = document.querySelector('#tnPane .tab-btn');
    const want = btn.getAttribute('data-tab');
    btn.click();
    const cs = getComputedStyle(pane);
    const capPx = /px$/.test(cs.maxHeight) ? parseFloat(cs.maxHeight) : Infinity;
    return { paneOn, want, now: (typeof currentTab === 'function') ? currentTab() : '',
             stillOpen: pane.classList.contains('on'),
             cap: cs.maxHeight, capPx, bigN,
             tall: Math.round(pane.getBoundingClientRect().height),
             vh: window.innerHeight,
             hasX: !!document.querySelector('.tn-ph button'),
             drawerShut: sb ? !sb.classList.contains('open') : true,
             marked: !!document.querySelector('.tab-btn.on') };
  });
  is(C.paneOn, '  그룹을 누르면 <b>칸이 펼쳐진다</b>');
  is(C.now === C.want, '  칸을 누르면 <b>그 화면이 열린다</b> — ' + C.want + ' → ' + C.now);
  is(C.stillOpen, '  고른 뒤에도 <b>그대로 펴져 있다</b> — 두 번째 칸을 다시 펴지 않고 누른다');
  is(C.capPx <= C.vh * 0.62,
     '  펼침칸에 <b>높이 한도</b>가 걸려 있다 — ' + C.cap + ' / 화면 ' + C.vh + 'px' +
     (C.capPx <= C.vh * 0.62 ? '' : ' ← 한도가 없으면 큰 갈래가 화면을 다 덮습니다'));
  is(C.tall <= Math.round(C.vh * 0.62),
     '  <b>제일 큰 갈래(' + C.bigN + '칸)</b>를 펴도 화면을 다 안 덮는다 — ' +
     C.tall + 'px / ' + C.vh + 'px');
  is(C.hasX, '  <b>닫는 단추</b>가 그 자리에 있다 — 덮는다 싶으면 바로 닫는다');
  is(C.drawerShut, '  <b>서랍(세로 메뉴)은 닫힌다</b> — 그것은 화면을 통째로 덮는다');
  is(C.marked, '  지금 보는 화면이 <b>강조</b>된다 (navMark 한 곳에서)');

  console.log('\n[5] 찾기 — ☰ 서랍에 그대로 있는가 · 도는가 · 커서를 안 뺏는가');
  const F = await page.evaluate(() => {
    /* 위 띠에는 이제 찾기 칸이 없다. 서랍 맨 위 칸 하나가 전부다 */
    const noTop = !document.getElementById('tnFind');
    const fi = document.getElementById('navFind');
    if (!fi) return { noTop, gone: true };
    fi.focus(); fi.value = '보장분석'; fi.dispatchEvent(new Event('input', { bubbles: true }));
    const hit = document.querySelectorAll('#tnPane .tab-btn').length;
    /* 다시 그린 뒤에도 치던 칸에 커서가 남아 있어야 한 글자마다 안 튄다 */
    const kept = document.activeElement && document.activeElement.id === 'navFind';
    const val = document.getElementById('navFind').value;
    const fi2 = document.getElementById('navFind');
    fi2.value = 'zzz없는것'; fi2.dispatchEvent(new Event('input', { bubbles: true }));
    const none = /찾은 칸이 없습니다/.test(document.getElementById('tnPane').textContent);
    const fi3 = document.getElementById('navFind');
    fi3.value = ''; fi3.dispatchEvent(new Event('input', { bubbles: true }));
    const back = document.querySelectorAll('#tnGroups .tn-g').length;
    return { noTop, gone: false, hit, kept, val, none, back };
  });
  is(F.noTop, '  위 띠에는 <b>찾기 칸이 없다</b> — 그 자리는 음성 비서에게 갔다');
  is(!F.gone, '  찾기 칸이 <b>☰ 서랍 맨 위에 그대로 있다</b> — 없앤 것이 아니다');
  is(F.hit > 0, '  「보장분석」 으로 <b>' + F.hit + '칸</b>이 걸린다');
  is(F.kept, '  치는 중에 <b>커서를 안 뺏는다</b> — 한 글자마다 focus 가 안 튄다');
  is(F.val === '보장분석', '  친 글자가 <b>그대로 남는다</b> — ' + JSON.stringify(F.val));
  is(F.none, '  없는 말로 찾으면 <b>없다고 말한다</b> — 빈 화면으로 두지 않는다');
  is(F.back > 1, '  지우면 <b>그룹이 돌아온다</b> (' + F.back + '개)');

  console.log('\n[5-1] 그 자리의 🎙 음성 비서 — 서는가 · 눌러서 열리는가 · 여는 자리가 하나인가');
  const V = await page.evaluate(() => {
    const b = document.getElementById('tnVa');
    if (!b) return { there: false };
    const r = b.getBoundingClientRect(), tn = document.getElementById('topnav').getBoundingClientRect();
    const inBar = r.width > 0 && r.height > 0 && r.top >= tn.top - 1 && r.bottom <= tn.bottom + 1;
    /* 실제로 눌러 본다 — 쪽창이 뜨는가 */
    b.click();
    const opened = !!document.getElementById('osVaPanel');
    /* 상태 색은 두 단추가 <b>같은 한 곳</b>에서 받는다 */
    VA.on = true; VA.wake = false; VA.talk = false;
    vaFabPaint();
    const lit = b.classList.contains('on') && b.classList.contains('tn-va');
    VA.on = false; vaFabPaint();
    const off = !b.classList.contains('on') && b.classList.contains('tn-va');
    /* 닫아 둔다 — 뒤 단계가 이 쪽창에 가려지지 않게 */
    if (typeof vaPanel === 'function') vaPanel(false);
    return { there: true, inBar, opened, lit, off, closed: !document.getElementById('osVaPanel') };
  });
  is(V.there, '  위 띠에 <b>🎙 음성 비서</b> 단추가 있다');
  is(V.inBar, '  <b>가로 메뉴 띠 안</b>에 있다 — 떠 있는 동그란 단추와 다른 자리다');
  is(V.opened, '  눌러서 <b>실제로 쪽창이 열린다</b> — 로그인 전에도 vaBoot 을 안 빠뜨린다');
  is(V.lit, '  듣는 중이면 <b>색이 바뀐다</b> — 떠 있는 단추와 같은 한 곳에서 칠한다');
  is(V.off, '  멈추면 <b>색이 돌아온다</b> · .tn-va 를 잃지 않는다 (className 통째 대입 안 함)');
  is(V.closed, '  ✕ 로 <b>닫힌다</b>');
  /* 여는 자리가 <b>한 곳</b>인가 — 위 띠도 떠 있는 단추도 vaToggle 을 부른다 */
  const vaOpeners = (SRC.match(/vaPanel\(!VA\.open\)/g) || []).length;
  is(vaOpeners === 1,
     '  <b>여는 자리가 한 곳</b>이다 — vaPanel(!VA.open) 을 부르는 데가 ' +
     vaOpeners + '군데 (vaToggle 하나여야 한다)');
  is(/onclick="vaToggle\(\)"/.test(SRC) && /b\.onclick\s*=\s*vaToggle/.test(SRC),
     '  위 띠 단추와 떠 있는 단추가 <b>같은 vaToggle</b> 을 부른다');

  console.log('\n[6] 세로 메뉴는 ☰ 로 열린다 — 없앤 것이 아니다');
  const S = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    toggleNav();
    const opened = sb.classList.contains('open');
    const has = sb.querySelectorAll('.tab-btn').length;
    /* 화면을 고르면 서랍도 닫힌다 */
    go('home');
    return { opened, has, closed: !sb.classList.contains('open') };
  });
  is(S.opened, '  ☰ 로 <b>열린다</b>');
  is(S.has > 40, '  안에 칸이 그대로 있다 (' + S.has + '칸) — 즐겨찾기·최근도 거기 있다');
  is(S.closed, '  화면을 고르면 <b>서랍도 닫힌다</b>');

  console.log('\n[7] 폰에서 가로로 안 밀린다');
  for (const label of ['폰 390', '노트북 1024']) {
    const p = pages[label];
    const w = await p.evaluate(() => ({ d: document.documentElement.scrollWidth, w: window.innerWidth }));
    is(w.d <= w.w, '  ' + label + ' — 가로 스크롤 없음 (' + w.d + '/' + w.w + ')');
  }

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 메뉴가 화면 크기마다 다르게 보입니다')
                  : '✓ 어디서나 위에 가로로 · 세로 메뉴와 한 칸도 안 다릅니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
