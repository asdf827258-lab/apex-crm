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
     8. 폰에서 <b>가로로 안 밀리는가</b>                                 */

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

  console.log('\n[4] 눌러서 실제로 열린다 · 고르면 닫힌다');
  const C = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    renderNav();
    const gs = [...document.querySelectorAll('#tnGroups .tn-g')];
    gs[1].click();
    const paneOn = document.getElementById('tnPane').classList.contains('on');
    const btn = document.querySelector('#tnPane .tab-btn');
    const want = btn.getAttribute('data-tab');
    btn.click();
    return { paneOn, want, now: (typeof currentTab === 'function') ? currentTab() : '',
             closed: !document.getElementById('tnPane').classList.contains('on'),
             marked: !!document.querySelector('.tab-btn.on') };
  });
  is(C.paneOn, '  그룹을 누르면 <b>칸이 펼쳐진다</b>');
  is(C.now === C.want, '  칸을 누르면 <b>그 화면이 열린다</b> — ' + C.want + ' → ' + C.now);
  is(C.closed, '  고르면 <b>저절로 닫힌다</b> — 고른 화면을 안 덮는다');
  is(C.marked, '  지금 보는 화면이 <b>강조</b>된다 (navMark 한 곳에서)');

  console.log('\n[5] 찾기 — 도는가 · 못 찾으면 말하는가 · 커서를 안 뺏는가');
  const F = await page.evaluate(() => {
    const fi = document.getElementById('tnFind');
    fi.focus(); fi.value = '보장분석'; fi.dispatchEvent(new Event('input', { bubbles: true }));
    const hit = document.querySelectorAll('#tnPane .tab-btn').length;
    const kept = document.activeElement && document.activeElement.id === 'tnFind';
    const val = document.getElementById('tnFind').value;
    fi.value = 'zzz없는것'; fi.dispatchEvent(new Event('input', { bubbles: true }));
    const none = /찾은 칸이 없습니다/.test(document.getElementById('tnPane').textContent);
    fi.value = ''; fi.dispatchEvent(new Event('input', { bubbles: true }));
    const back = document.querySelectorAll('#tnGroups .tn-g').length;
    return { hit, kept, val, none, back };
  });
  is(F.hit > 0, '  「보장분석」 으로 <b>' + F.hit + '칸</b>이 걸린다');
  is(F.kept, '  치는 중에 <b>커서를 안 뺏는다</b> — 옆 칸으로 focus 가 안 튄다');
  is(F.val === '보장분석', '  친 글자가 <b>그대로 남는다</b> — ' + JSON.stringify(F.val));
  is(F.none, '  없는 말로 찾으면 <b>없다고 말한다</b> — 빈 화면으로 두지 않는다');
  is(F.back > 1, '  지우면 <b>그룹이 돌아온다</b> (' + F.back + '개)');

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
