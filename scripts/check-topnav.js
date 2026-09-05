/* <b>위 띠에는 이제 ⭐ 즐겨찾기만 있습니다.</b>

   ── 어디서 여기까지 왔나 ───────────────────────────────────────

   처음엔 왼쪽 세로 메뉴가 <b>웹에서만</b> 늘 보이고 폰에서는 ☰ 서랍이었습니다.
   같은 앱인데 「메뉴가 어디 있나」의 답이 둘이었습니다. 그래서 <b>어디서나
   위에 가로로</b> 붙였고, 갈래 열넷을 딱지로 늘어놓고 눌러서 펴는 방식이
   되었습니다.

   그런데 그 방식은 <b>매번 펴야</b> 했고, 편 칸이 화면의 절반을 덮었습니다.
   사장님 말씀 그대로입니다 — 「가로버전으로 만든건 삭제하고, 즐겨찾기
   메뉴들만 위에 올라올수 있도록. <b>상시 고정으로.</b>」

   이제 위 띠는 <b>내가 ☆ 로 고른 칸</b>만 늘 띄웁니다. 갈래 전부와 찾기는
   ☰ 서랍에 <b>그대로</b> 있습니다 — 없앤 것이 아닙니다.

   ── 여기서 지키는 것 ───────────────────────────────────────────

   제일 무서운 것은 <b>메뉴가 두 벌이 되는 것</b>입니다(CLAUDE.md 5번).
   위 띠에 메뉴를 다시 적어 두면, 새 화면이 생겼을 때 한쪽에만 붙고
   사장님은 <b>「어제는 여기 있었는데」</b> 하시게 됩니다. 그래서 —

     1. 위 띠가 <b>어느 폭에서나</b> 맨 위에 붙어 있는가 · 내려도 그대로인가
     2. 걷어낸 갈래 띠·펼침칸이 <b>정말 없는가</b> · 죽은 함수가 안 남았는가
     3. 띠에 뜨는 칸이 <b>서랍에 있는 그 칸</b>인가 — 두 벌이 아닌가
     4. ☆ 를 누르면 <b>그 자리에서</b> 올라오고 · 빼면 내려가는가
     5. 화면을 옮겨도 <b>늘 그대로</b>인가 (상시 고정)
     6. 등급으로 가린 칸은 띠에도 <b>안 뜨는가</b>
     7. 하나도 없을 때 <b>빈 자리로 두지 않는가</b> — 무엇을 하면 되는지 적는가
     8. 지금 보는 화면이 <b>강조</b>되는가 (navMark 한 곳에서)
     9. 색이 <b>서랍의 그 갈래 색</b>과 같은가 (navRamp 한 곳에서)
    10. 넘치면 <b>마우스로도</b> 넘어가는가 (휠·화살표)
    11. ☰ 로 갈래 전부가 열리는가 · 찾기가 거기 그대로 도는가
    12. 폰에서 <b>가로로 안 밀리는가</b>                                */

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
/* 견본 사람은 홍길동 (CLAUDE.md 3번) */
const OWNER = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port + '/app/';
  const browser = await chromium.launch();
  const errs = [];

  console.log('\n[1] 어느 폭에서나 위에 붙어 있다 — 내려도 그대로');
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
    const R = await p.evaluate(async (prof) => {
      OS.profile = prof; renderNav();
      ['finance', 'clients', 'crm'].forEach(id => { if (!navIsFav(id)) navFavToggle(id); });
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
        favs: document.querySelectorAll('#tnFav .tn-fi .tab-btn').length,
        /* 왼쪽 메뉴는 <b>넓은 화면에서 기둥으로 서고</b>, 좁은 화면에서는
           서랍으로 밀려나 있어야 한다. 좁은데 자리를 차지하면 본문이 먹히고,
           넓은데 밀려나 있으면 ☰ 를 누르기 전엔 메뉴가 아예 안 보인다. */
        vw: innerWidth,
        sbRight: sb ? Math.round(sb.getBoundingClientRect().right) : 0,
        cols: app ? getComputedStyle(app).gridTemplateColumns.trim().split(/\s+/).length : 0
      };
    }, OWNER);
    is(R.on && R.top0 === 0, '  ' + label + ' — 맨 위에 붙어 있다 (top=' + R.top0 + ')');
    is(R.top1 === 0, '  ' + label + ' — <b>내려도 그대로 위에 있다</b> (600px 내린 뒤 top=' + R.top1 + ')');
    is(R.favs === 3, '  ' + label + ' — ⭐ 즐겨찾기 ' + R.favs + '칸이 띠에 서 있다');
    if (R.vw > 1100) {
      is(R.sbRight > 200, '  ' + label + ' — 왼쪽 메뉴가 <b>기둥으로 서 있다</b> (오른쪽 끝 ' + R.sbRight + 'px)');
      is(R.cols === 2, '  ' + label + ' — 본문과 <b>나란히</b> 선다 (격자 칸 ' + R.cols + '개)');
    } else {
      is(R.sbRight <= 0, '  ' + label + ' — 좁은 화면이라 <b>서랍</b>으로 밀려나 있다 (오른쪽 끝 ' + R.sbRight + 'px)');
      is(R.cols === 1, '  ' + label + ' — 세로 메뉴가 <b>자리를 안 차지한다</b> (본문 칸 ' + R.cols + '개)');
    }
  }

  const page = pages['웹 1440'];
  const SRC = fs.readFileSync('app/index.html', 'utf8');
  const NOC = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');   /* 주석은 빼고 본다 */

  /* ── 걷어낸 것은 <b>정말로</b> 걷어냈는가 ──────────────────────────
     화면에서만 감추고 코드에 남겨 두면, 다음 사람이 그것을 보고 다시
     부릅니다. 「덮어쓴 죽은 판」과 같은 자리입니다 (CLAUDE.md 5번). */
  console.log('\n[2] 갈래 띠와 펼침칸은 정말 없어졌다 — 화면에도, 코드에도');
  const D = await page.evaluate(() => ({
    groupsBar: !!document.getElementById('tnGroups'),
    pane: !!document.getElementById('tnPane'),
    chips: document.querySelectorAll('.tn-g').length,
    strip: !!document.getElementById('tnFav'),
    fnAlive: ['tnPaint', 'tnEdges', 'tnNudge', 'tnDragWire'].filter(n => typeof window[n] === 'function'),
    fnDead: ['tnGroups', 'tnToggle', 'tnClose', 'tnOpenSave', 'tnOpenLoad']
      .filter(n => typeof window[n] !== 'undefined')
  }));
  is(!D.groupsBar && !D.pane, '  갈래 띠(#tnGroups)와 펼침칸(#tnPane)이 <b>화면에 없다</b>');
  is(D.chips === 0, '  갈래 딱지(.tn-g)가 한 개도 안 남았다 — ' + D.chips + '개');
  is(D.strip, '  그 자리에 <b>⭐ 즐겨찾기 띠(#tnFav)</b>가 섰다');
  is(D.fnDead.length === 0,
     '  걷어낸 함수가 <b>코드에도 안 남아 있다</b>' +
     (D.fnDead.length ? ' ← 아직 살아 있음: ' + D.fnDead.join(', ') : ''));
  is(D.fnAlive.length === 4, '  띠를 그리고 미는 함수는 그대로 있다 (' + D.fnAlive.join(', ') + ')');
  is(!/TN_OPEN|apex_tn_open/.test(NOC),
     '  펴 둔 갈래를 기억하던 자리(TN_OPEN·apex_tn_open)도 <b>지웠다</b>');

  /* ── 메뉴가 두 벌이 되지 않는가 ────────────────────────────────── */
  console.log('\n[3] 띠에 뜨는 칸은 서랍에 있는 그 칸이다 — 두 벌이 아니다');
  const P = await page.evaluate((prof) => {
    OS.profile = prof; renderNav();
    /* 스무 칸 담을 수 있다 — 여러 갈래에서 골고루 담아 본다 */
    const ids = [];
    (visibleTabs()).forEach(g => { if (!g.hide) (g.items || []).forEach(x => { if (!x.hide) ids.push(x.id); }); });
    const want = ids.filter((_, i) => i % 4 === 0).slice(0, 14);
    navFav().slice().forEach(id => navFavToggle(id));           /* 비우고 */
    want.slice().reverse().forEach(id => navFavToggle(id));     /* 담는다 */
    const strip = [...document.querySelectorAll('#tnFav .tn-fi .tab-btn')].map(b => b.getAttribute('data-tab'));
    const side = new Set([...document.querySelectorAll('#navHost .tab-btn')].map(b => b.getAttribute('data-tab')));
    return {
      want, strip, sideN: side.size,
      onlyStrip: strip.filter(x => !side.has(x)),
      sameOrder: JSON.stringify(strip) === JSON.stringify(want),
      more: !!document.querySelector('#tnFav .tn-more')
    };
  }, OWNER);
  is(P.strip.length === P.want.length,
     '  ☆ 로 담은 <b>' + P.want.length + '칸이 그대로</b> 띠에 섰다 (' + P.strip.length + '칸)');
  is(P.onlyStrip.length === 0,
     '  띠에만 있는 칸이 <b>없다</b> — 서랍 ' + P.sideN + '칸 안에서만 나온다' +
     (P.onlyStrip.length ? ' ← ' + P.onlyStrip.slice(0, 5).join(',') : ''));
  is(P.sameOrder, '  <b>담은 순서 그대로</b> 선다 — 자리가 안 흔들린다');
  is(P.more, '  맨 끝에 <b>「☰ 메뉴 전체」</b> 딱지가 있다 — 나머지가 어디 있는지 말해 준다');
  const tnSrc = (NOC.match(/function tnPaint\(\)[\s\S]*?\n\}/) || [''])[0] +
                (NOC.match(/function tnFavBtn\([\s\S]*?\n\}/) || [''])[0];
  is(/navFav\(\)/.test(tnSrc), '  무엇이 즐겨찾기인지 <b>navFav() 한 곳</b>에서 읽는다');
  is(/navItemOf\(/.test(tnSrc), '  칸의 이름·아이콘을 <b>navItemOf</b> 에서 받는다 — 다시 안 적었다');
  is(!/\{\s*id\s*:\s*'/.test(tnSrc), '  띠 안에 메뉴 줄을 <b>새로 적어 두지 않았다</b>');

  console.log('\n[4] ☆ 를 누르면 그 자리에서 올라오고 · 빼면 내려간다');
  const T = await page.evaluate((prof) => {
    OS.profile = prof; renderNav();
    navFav().slice().forEach(id => navFavToggle(id));
    const before = document.querySelectorAll('#tnFav .tn-fi').length;
    /* 서랍의 ☆ 를 <b>실제로 눌러</b> 본다 — 함수를 부르는 것이 아니라 */
    const star = document.querySelector('#navHost .nav-row .nav-star');
    const id = star.parentElement.querySelector('.tab-btn').getAttribute('data-tab');
    star.click();
    const up = [...document.querySelectorAll('#tnFav .tn-fi .tab-btn')].map(b => b.getAttribute('data-tab'));
    /* 띠에 붙은 ✕ 로 바로 뺄 수 있어야 한다 — 띠가 늘 떠 있으니 고르는 길도 여기 */
    const x = document.querySelector('#tnFav .tn-fi .tn-fx');
    const hadX = !!x; if (x) x.click();
    const down = [...document.querySelectorAll('#tnFav .tn-fi .tab-btn')].map(b => b.getAttribute('data-tab'));
    const none = (document.querySelector('#tnFav .tn-fnone') || {}).textContent || '';
    return { before, id, up, hadX, down, none, saved: navFav() };
  }, OWNER);
  is(T.before === 0, '  비우면 <b>0칸</b>에서 시작한다');
  is(T.up.length === 1 && T.up[0] === T.id,
     '  서랍의 ☆ 를 누르니 <b>그 자리에서</b> 「' + T.id + '」 가 위로 올라왔다');
  is(T.hadX, '  띠의 딱지마다 <b>✕</b> 가 붙어 있다 — 서랍을 안 열고도 뺀다');
  is(T.down.length === 0 && T.saved.length === 0,
     '  ✕ 를 누르니 <b>내려갔다</b> — 기억에서도 빠졌다');
  is(/☆/.test(T.none) && /메뉴/.test(T.none),
     '  하나도 없으면 <b>무엇을 하면 되는지 적는다</b> — 「' + T.none.slice(0, 40) + '」');

  console.log('\n[5] 화면을 옮겨도 늘 그대로다 — 상시 고정');
  const K = await page.evaluate(async (prof) => {
    OS.profile = prof; renderNav();
    navFav().slice().forEach(id => navFavToggle(id));
    ['home', 'clients', 'crm', 'bohum'].reverse().forEach(id => navFavToggle(id));
    const n0 = document.querySelectorAll('#tnFav .tn-fi').length;
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.add('open');            /* 서랍을 열어 두고 */
    const btn = [...document.querySelectorAll('#tnFav .tn-fi .tab-btn')].pop();
    const want = btn.getAttribute('data-tab');
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    /* <b>누른 직후</b>에 잰다 — 뒤에 또 옮기고 나서 재면 무엇을 재는지 모른다 */
    const now = (typeof currentTab === 'function') ? currentTab() : '';
    const n1 = document.querySelectorAll('#tnFav .tn-fi').length;
    const mark1 = (document.querySelector('#tnFav .tab-btn.on') || {}).dataset ?
      document.querySelector('#tnFav .tab-btn.on').getAttribute('data-tab') : '';
    const h = Math.round(document.getElementById('topnav').getBoundingClientRect().height);
    /* <b>메뉴를 다시 그려도</b> 강조가 남아야 한다 — 로그인·등급이 바뀌면
       renderNav() 만 돌고 go() 는 안 돈다. 그때 띠가 강조를 잃으면
       「내가 어디 있는지」를 화면에서 알 수 없다. */
    renderNav();
    const mark1b = document.querySelector('#tnFav .tab-btn.on')
      ? document.querySelector('#tnFav .tab-btn.on').getAttribute('data-tab') : '';
    go('home');
    await new Promise(r => setTimeout(r, 250));
    return {
      n0, n1, want, now, mark1, mark1b,
      n2: document.querySelectorAll('#tnFav .tn-fi').length,
      barH: h, vh: window.innerHeight,
      drawerShut: sb ? !sb.classList.contains('open') : true,
      mark2: (document.querySelector('#tnFav .tab-btn.on') || {}).dataset ?
        document.querySelector('#tnFav .tab-btn.on').getAttribute('data-tab') : ''
    };
  }, OWNER);
  is(K.now === K.want, '  띠의 칸을 누르면 <b>그 화면이 열린다</b> — ' + K.want + ' → ' + K.now);
  is(K.n0 === 4 && K.n1 === 4 && K.n2 === 4,
     '  화면을 옮겨도 <b>' + K.n2 + '칸 그대로</b> 있다 — 접히지도 사라지지도 않는다');
  is(K.barH <= Math.round(K.vh * 0.18),
     '  띠가 <b>화면을 안 먹는다</b> — ' + K.barH + 'px / ' + K.vh + 'px (펼침칸이 없어졌다)');
  is(K.drawerShut, '  <b>서랍(세로 메뉴)은 닫힌다</b> — 그것은 화면을 통째로 덮는다');
  is(K.mark1 === K.want && K.mark2 === 'home',
     '  지금 보는 화면이 <b>강조</b>된다 · 옮기면 <b>따라 옮긴다</b> (navMark 한 곳에서) — ' +
     '「' + K.mark1 + '」 → 「' + K.mark2 + '」');
  is(K.mark1b === K.want,
     '  <b>메뉴를 다시 그려도</b> 강조가 안 사라진다 — 「' + K.mark1b + '」' +
     (K.mark1b === K.want ? '' : ' ← 로그인·등급이 바뀔 때마다 어디 있는지 모르게 됩니다'));

  /* <b>같은 사람</b>의 등급만 낮춰 본다. 로그인을 끊어서 재면 즐겨찾기 자체가
     다른 사람 것(기기 몫)이 되어, 「가려서 안 뜬 것」인지 「원래 없던 것」인지
     구별이 안 된다 — 그러면 이 점검은 아무것도 안 잡는다 (8번). */
  console.log('\n[6] 등급으로 가린 칸은 띠에도 안 뜬다 — 대신 기억에서 지우지도 않는다');
  const G = await page.evaluate((prof) => {
    OS.profile = prof; renderNav();
    const ids = [];
    (visibleTabs()).forEach(g => { if (!g.hide) (g.items || []).forEach(x => { if (!x.hide) ids.push(x.id); }); });
    navFav().slice().forEach(id => navFavToggle(id));
    ids.slice(0, 10).reverse().forEach(id => navFavToggle(id));
    const asOwner = document.querySelectorAll('#tnFav .tn-fi').length;
    OS.profile = { id: prof.id, name: prof.name, role: 'fp', active: true };   /* 같은 사람, 낮은 등급 */
    renderNav();
    const strip = [...document.querySelectorAll('#tnFav .tn-fi .tab-btn')].map(b => b.getAttribute('data-tab'));
    const side = new Set([...document.querySelectorAll('#navHost .tab-btn')].map(b => b.getAttribute('data-tab')));
    const kept = navFav().length;
    OS.profile = prof; renderNav();                                            /* 등급이 돌아오면 */
    return { asOwner, out: strip.length, kept, leak: strip.filter(x => !side.has(x)),
             back: document.querySelectorAll('#tnFav .tn-fi').length };
  }, OWNER);
  is(G.asOwner === 10, '  대표로는 <b>10칸</b>이 뜬다');
  is(G.out < G.asOwner, '  등급이 낮으면 <b>덜</b> 뜬다 (' + G.out + ' < ' + G.asOwner + ') — 가림이 살아 있다');
  is(G.leak.length === 0,
     '  가린 칸이 띠로 <b>새지 않는다</b>' + (G.leak.length ? ' ← ' + G.leak.join(',') : ''));
  is(G.kept === G.asOwner && G.back === G.asOwner,
     '  가려도 <b>지우지는 않는다</b> — 등급이 돌아오면 ' + G.back + '칸이 그 자리에 그대로');

  /* ── 색도 두 벌이면 안 된다 ────────────────────────────────────────
     갈래를 색으로 나눠 놓고 위·옆이 <b>다른 색</b>이면, 같은 「내 고객」을
     위에서는 파랑 · 옆에서는 초록으로 외우시게 된다. 색을 정하는 곳은
     navRamp() 한 곳이어야 한다 (5번). 여기서는 <b>실제로 칠해진 값</b>을
     양쪽에서 읽어 갈래끼리 맞춰 본다 — 함수를 부르는지가 아니라. */
  console.log('\n[7] 띠의 색 = 서랍에서 그 칸이 속한 갈래 색');
  const GC = await page.evaluate((prof) => {
    OS.profile = prof; renderNav();
    const ids = [];
    (visibleTabs()).forEach(g => { if (!g.hide) (g.items || []).forEach(x => { if (!x.hide) ids.push({ id: x.id, g: g.group }); }); });
    const pick = ids.filter((_, i) => i % 6 === 0).slice(0, 8);
    navFav().slice().forEach(id => navFavToggle(id));
    pick.slice().reverse().forEach(x => navFavToggle(x.id));
    const sideColor = {};
    document.querySelectorAll('#navHost .nav-group').forEach(g => {
      const l = g.querySelector('.ngl-t');
      const nm = ((l && l.textContent) || '').replace(/[\s\d]/g, '');
      sideColor[nm] = g.style.getPropertyValue('--gc').trim();
    });
    const rows = [...document.querySelectorAll('#tnFav .tn-fi')].map(el => {
      const id = el.querySelector('.tab-btn').getAttribute('data-tab');
      const grp = (pick.find(x => x.id === id) || {}).g || '';
      return { id, grp, top: el.style.getPropertyValue('--gc').trim(),
               side: sideColor[grp.replace(/[\s\d]/g, '')] || '' };
    });
    return { rows, blank: rows.filter(r => !r.top), diff: rows.filter(r => r.side && r.top !== r.side) };
  }, OWNER);
  is(GC.rows.length > 4, '  ' + GC.rows.length + '칸으로 잰다');
  is(GC.blank.length === 0,
     '  <b>모두 색을 받았다</b>' + (GC.blank.length ? ' ← 색이 없는 칸: ' + GC.blank.map(r => r.id).join(',') : ''));
  is(GC.diff.length === 0,
     '  <b>한 칸도 색이 안 어긋난다</b> — 띠에서 본 색 = 서랍에서 본 그 갈래 색' +
     (GC.diff.length ? ' ← ' + GC.diff.slice(0, 3).map(r => r.id + '(띠 ' + r.top + ' / 옆 ' + r.side + ')').join(' · ') : ''));
  is(/navRamp\(/.test(tnSrc) || /navRamp\(/.test((NOC.match(/function tnFavGrp\([\s\S]*?\n\}/) || [''])[0]) ||
     /navRamp\(/.test((NOC.match(/function tnFavBtn\([\s\S]*?\n\}/) || [''])[0]),
     '  색을 <b>navRamp() 에서 받아 쓴다</b> — 띠가 색을 새로 정하지 않는다');

  console.log('\n[8] 넘치면 마우스로도 넘어간다 — 휠 · 화살표');
  const M = await page.evaluate(async (prof) => {
    const O = {};
    OS.profile = prof; renderNav();
    const ids = [];
    (visibleTabs()).forEach(g => { if (!g.hide) (g.items || []).forEach(x => { if (!x.hide) ids.push(x.id); }); });
    navFav().slice().forEach(id => navFavToggle(id));
    ids.slice(0, 20).reverse().forEach(id => navFavToggle(id));   /* 담을 수 있는 최대 */
    const b0 = document.querySelector('#tnFav .tn-fi .tab-btn'), cs = getComputedStyle(b0);
    O.radius = parseFloat(cs.borderTopLeftRadius);
    O.leftBar = parseFloat(cs.borderLeftWidth);
    const bar = document.getElementById('tnFav'), wrap = document.getElementById('tnFavWrap');
    O.over = bar.scrollWidth - bar.clientWidth;
    const s0 = bar.scrollLeft;
    bar.dispatchEvent(new WheelEvent('wheel', { deltaY: 240, bubbles: true, cancelable: true }));
    /* <b>부드럽게 미는 중</b>이라 바로 재면 도중 값이 잡힌다. 다 선 뒤에 잰다 —
       안 그러면 화살표가 죽어도 「휠의 남은 움직임」이 화살표 몫으로 잡혀
       알람이 안 울린다 (8번). */
    await new Promise(r => setTimeout(r, 700));
    O.wheel = bar.scrollLeft - s0;
    O.edge = wrap.className;
    const s1 = bar.scrollLeft;
    tnNudge(1); await new Promise(r => setTimeout(r, 700));
    O.arrow = bar.scrollLeft - s1;
    return O;
  }, OWNER);
  is(M.radius <= 6, '  띠의 딱지가 <b>각지다</b> — 모서리 ' + M.radius + 'px (7px 미만)');
  is(M.leftBar >= 2, '  왼쪽에 <b>색막대</b>가 서 있다 — ' + M.leftBar + 'px · 갈래가 색으로 먼저 읽힌다');
  is(M.over > 0, '  스무 칸을 담으면 <b>한 화면을 넘친다</b> — ' + M.over + 'px · 그래서 넘길 수 있어야 한다');
  is(M.wheel > 0, '  <b>휠을 굴리면 옆으로 간다</b> — ' + M.wheel + 'px' +
     (M.wheel > 0 ? '' : ' ← 마우스만 쓰시면 넘길 방법이 없습니다'));
  is(M.arrow > 0, '  <b>화살표로도 넘어간다</b> — 한 번 눌러 ' + M.arrow + 'px');
  is(/can-r|can-l/.test(M.edge), '  <b>「더 있다」 를 표시한다</b> — 「' + M.edge + '」');

  console.log('\n[9] 찾기 — ☰ 서랍에 그대로 있는가 · 도는가 · 커서를 안 뺏는가');
  const F = await page.evaluate(() => {
    /* 위 띠에는 찾기 칸이 없다. 서랍 맨 위 칸 하나가 전부다 */
    const noTop = !document.getElementById('tnFind');
    const fi = document.getElementById('navFind');
    if (!fi) return { noTop, gone: true };
    fi.focus(); fi.value = '보장분석'; fi.dispatchEvent(new Event('input', { bubbles: true }));
    const hit = document.querySelectorAll('#navHost .tab-btn').length;
    /* 다시 그린 뒤에도 치던 칸에 커서가 남아 있어야 한 글자마다 안 튄다 */
    const kept = document.activeElement && document.activeElement.id === 'navFind';
    const val = document.getElementById('navFind').value;
    const fi2 = document.getElementById('navFind');
    fi2.value = 'zzz없는것'; fi2.dispatchEvent(new Event('input', { bubbles: true }));
    const none = /찾은 메뉴가 없습니다/.test(document.getElementById('navHost').textContent);
    const fi3 = document.getElementById('navFind');
    fi3.value = ''; fi3.dispatchEvent(new Event('input', { bubbles: true }));
    const back = document.querySelectorAll('#navHost .nav-group').length;

    /* ── 한 글자 칠 때마다 <b>같은 칸</b>이어야 한다 ─────────────────────
       예전에는 한 글자마다 서랍을 통째로 다시 그렸고, 그때 찾기 칸이
       지워졌다 새로 생겼다. 영타는 버티는데 <b>한글은 무너진다</b> —
       한글은 자판을 여러 번 눌러 한 글자를 만드는 「조합」이라, 도중에
       칸이 바뀌면 그 글자가 확정 안 된 채 남고 새 칸에 또 들어간다.
       실제로 「고객」 을 치면 「고객고개곡고고객ㄱ」 이 됐다.

       그래서 <b>칸이 그대로 살아 있는지</b> 를 잰다. 살아 있으면 조합이
       안 끊긴다. 값이 맞는지만 보면 이 버그를 못 잡는다 — 값은 다시
       그린 뒤에 되돌려 놓았기 때문에 맞아 보였다 (8번). */
    const mark = document.getElementById('navFind');
    mark.__same = 1;
    mark.value = '보'; mark.dispatchEvent(new Event('input', { bubbles: true }));
    const same1 = !!(document.getElementById('navFind') || {}).__same;
    const m2 = document.getElementById('navFind');
    m2.value = '보장'; m2.dispatchEvent(new Event('input', { bubbles: true }));
    const same2 = !!(document.getElementById('navFind') || {}).__same;

    /* 조합 중(compositionstart~end)에는 <b>찾지 않는다</b> — 글자가 덜 됐다 */
    const el = document.getElementById('navFind');
    el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.value = 'ㄱ'; el.dispatchEvent(new Event('input', { bubbles: true }));
    const midQ = (typeof NAV_Q !== 'undefined') ? NAV_Q : '?';   /* 아직 '' 이어야 한다 */
    el.value = '고객';
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '고객' }));
    const endQ = (typeof NAV_Q !== 'undefined') ? NAV_Q : '?';   /* 이제 '고객' */
    const endHit = document.querySelectorAll('#navBody .nav-group .tab-btn').length;
    el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true }));

    return { noTop, gone: false, hit, kept, val, none, back,
             same1, same2, midQ, endQ, endHit,
             /* 찾기 칸이 <b>다시 그리는 칸 밖</b>에 있는가 — 구조로도 본다 */
             outside: !!(document.querySelector('#navFix #navFind')) &&
                      !document.querySelector('#navBody #navFind') };
  });
  is(F.noTop, '  위 띠에는 <b>찾기 칸이 없다</b> — 그 자리는 음성 비서에게 갔다');
  is(!F.gone, '  찾기 칸이 <b>☰ 서랍 맨 위에 그대로 있다</b> — 없앤 것이 아니다');
  is(F.hit > 0, '  「보장분석」 으로 <b>' + F.hit + '칸</b>이 걸린다');
  is(F.kept, '  치는 중에 <b>커서를 안 뺏는다</b> — 한 글자마다 focus 가 안 튄다');
  is(F.val === '보장분석', '  친 글자가 <b>그대로 남는다</b> — ' + JSON.stringify(F.val));
  is(F.none, '  없는 말로 찾으면 <b>없다고 말한다</b> — 빈 화면으로 두지 않는다');
  is(F.back > 1, '  지우면 <b>갈래가 돌아온다</b> (' + F.back + '개)');
  is(F.same1 && F.same2,
     '  한 글자 칠 때마다 <b>같은 칸</b>이다 — 지웠다 새로 만들면 한글이 깨진다' +
     (F.same1 && F.same2 ? '' : ' ← 칸이 새로 생겼습니다'));
  is(F.outside, '  찾기 칸이 <b>다시 그리는 자리 밖</b>에 있다 (#navFix)');
  is(F.midQ === '', '  <b>조합 중에는 안 찾는다</b> — 글자가 덜 됐다 (지금 「' + F.midQ + '」)');
  is(F.endQ === '고객' && F.endHit > 0,
     '  <b>조합이 끝나면</b> 그 글자로 찾는다 — 「' + F.endQ + '」 로 ' + F.endHit + '칸');

  console.log('\n[10] 그 자리의 🎙 음성 비서 — 서는가 · 눌러서 열리는가 · 여는 자리가 하나인가');
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
  is(V.inBar, '  <b>위 띠 안</b>에 있다 — 떠 있는 동그란 단추와 다른 자리다');
  is(V.opened, '  눌러서 <b>실제로 쪽창이 열린다</b> — 로그인 전에도 vaBoot 을 안 빠뜨린다');
  is(V.lit, '  듣는 중이면 <b>색이 바뀐다</b> — 떠 있는 단추와 같은 한 곳에서 칠한다');
  is(V.off, '  멈추면 <b>색이 돌아온다</b> · .tn-va 를 잃지 않는다 (className 통째 대입 안 함)');
  is(V.closed, '  ✕ 로 <b>닫힌다</b>');
  /* 여는 자리가 <b>한 곳</b>인가 — 위 띠도 떠 있는 단추도 vaToggle 을 부른다 */
  const vaOpeners = (NOC.match(/vaPanel\(!VA\.open\)/g) || []).length;
  is(vaOpeners === 1,
     '  <b>여는 자리가 한 곳</b>이다 — vaPanel(!VA.open) 을 부르는 데가 ' +
     vaOpeners + '군데 (vaToggle 하나여야 한다)');
  is(/onclick="vaToggle\(\)"/.test(SRC) && /b\.onclick\s*=\s*vaToggle/.test(SRC),
     '  위 띠 단추와 떠 있는 단추가 <b>같은 vaToggle</b> 을 부른다');

  /* ── 왼쪽 메뉴는 <b>넓은 화면에서 늘 서 있다</b> ──────────────────────
     한동안 어느 크기에서나 서랍이라, ☰ 를 누르기 전에는 메뉴가 아예 안
     보였습니다 — 「메뉴가 없어졌다」 는 말이 여기서 나왔습니다.
     이제 넓은 화면에서는 <b>기둥으로 세워</b> 둡니다. 폰에서는 서랍 그대로
     입니다 — 320px 기둥을 세우면 390px 화면에 본문이 70px 만 남습니다.

     그래서 여기서 재는 것은 <b>「지금 눈에 보이는가」</b> 입니다. 어떻게
     만들든 이 질문에 답하면 됩니다 (CLAUDE.md 8번). */
  console.log('\n[11] 왼쪽 메뉴 — 넓은 화면에서는 늘 서 있고, 폰에서는 ☰ 로 연다');
  const S = await page.evaluate((prof) => {
    OS.profile = prof; renderNav();
    /* 로그인 칸은 <b>일부러</b> 내린다 — 그것이 화면을 덮는 것은 이 자리
       이야기가 아니다(로그인은 check-loginhold 가 본다). 안 내리면
       「메뉴가 잡히나」 를 물었는데 <b>로그인 칸이 잡혀</b> 헛알람이 된다 (8번). */
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.scrollTo(0, 0);
    const sb = document.getElementById('sidebar');
    const r = sb.getBoundingClientRect();
    /* 메뉴 한가운데를 눌렀을 때 <b>메뉴가 잡히는가</b> — 눈에 보이는 그대로 */
    const hit = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                          Math.round(Math.max(r.top, 0) + Math.min(r.height, innerHeight) / 2));
    return { w: Math.round(r.width), left: Math.round(r.left), vw: innerWidth,
             mine: !!(hit && hit.closest && hit.closest('#sidebar')),
             hitWas: hit ? (hit.id || ('.' + (hit.className || '').toString().split(' ')[0])) : '없음',
             has: sb.querySelectorAll('.tab-btn').length,
             burger: (function () { const b = document.querySelector('.tn-burger');
               return !!(b && b.getBoundingClientRect().height > 0); })(),
             scrim: (function () { const s = document.getElementById('scrim');
               return !!(s && getComputedStyle(s).display !== 'none'); })(),
             /* 기둥이 <b>화면 밖으로 넘치지 않는가</b> — 넘치면 맨 밑이 잘린다 */
             bottom: Math.round(r.bottom), vh: innerHeight };
  }, OWNER);
  is(S.left >= 0 && S.w > 200,
     '  넓은 화면(' + S.vw + 'px)에서 <b>기둥으로 서 있다</b> — 왼쪽 ' + S.left + 'px · 폭 ' + S.w + 'px');
  is(S.mine, '  그 자리를 누르면 <b>메뉴가 잡힌다</b> — 숨어 있지 않다' +
     (S.mine ? '' : ' ← 잡힌 것: ' + S.hitWas));
  is(S.has > 40, '  안에 칸이 그대로 있다 (' + S.has + '칸) — 즐겨찾기·최근도 거기 있다');
  is(!S.burger, '  기둥으로 서 있으면 <b>☰ 가 없다</b> — 눌러도 아무 일이 없는 단추를 두지 않는다');
  is(!S.scrim, '  화면을 어둡게 덮는 막이 <b>안 뜬다</b>');
  is(S.bottom <= S.vh + 2,
     '  기둥이 <b>화면 밖으로 안 넘친다</b> — 밑이 ' + S.bottom + 'px (화면 ' + S.vh + 'px)');
  /* 폰에서는 <b>서랍</b>이라야 한다 — 기둥을 세우면 본문이 안 남는다 */
  const SM = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return { drawer: !!(sb && sb.className.indexOf('sidebar') >= 0) };
  });
  const ph = pages['폰 390'] || pages['폰'] || null;
  if (ph) {
    const PH = await ph.evaluate((prof) => {
      OS.profile = prof; renderNav();
      const sb = document.getElementById('sidebar');
      const before = Math.round(sb.getBoundingClientRect().left);
      const more = document.querySelector('#tnFav .tn-more');
      if (more) more.click();
      const opened = sb.classList.contains('open');
      go('home');
      return { before: before, opened: opened, hadMore: !!more,
               closed: !sb.classList.contains('open') };
    }, OWNER);
    is(PH.before < 0, '  폰에서는 <b>서랍</b>이다 — 평소엔 화면 밖(' + PH.before + 'px)');
    is(PH.hadMore && PH.opened, '  폰에서 띠의 <b>「☰ 메뉴 전체」</b> 로 열린다');
    is(PH.closed, '  폰에서 화면을 고르면 <b>서랍도 닫힌다</b>');
  } else {
    is(false, '  폰 화면을 못 찾았습니다 — SIZES 를 확인하십시오');
  }
  void SM;

  console.log('\n[12] 폰에서 가로로 안 밀린다');
  for (const label of ['폰 390', '노트북 1024']) {
    const p = pages[label];
    const w = await p.evaluate(async (prof) => {
      OS.profile = prof; renderNav();
      const ids = [];
      (visibleTabs()).forEach(g => { if (!g.hide) (g.items || []).forEach(x => { if (!x.hide) ids.push(x.id); }); });
      navFav().slice().forEach(id => navFavToggle(id));
      ids.slice(0, 20).reverse().forEach(id => navFavToggle(id));   /* 꽉 채워 놓고 잰다 */
      await new Promise(r => setTimeout(r, 200));
      return { d: document.documentElement.scrollWidth, w: window.innerWidth };
    }, OWNER);
    is(w.d <= w.w, '  ' + label + ' — 스무 칸을 담아도 <b>가로 스크롤 없음</b> (' + w.d + '/' + w.w + ')');
  }

  console.log('\n[13] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 위 띠가 제 몫을 못 합니다')
                  : '✓ 위 띠는 ⭐ 즐겨찾기만 · 어디서나 늘 그대로 · 서랍과 한 칸도 안 다릅니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
