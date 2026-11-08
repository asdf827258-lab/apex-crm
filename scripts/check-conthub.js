/* ══════════════════════════════════════════════════════════════════
   check-conthub.js — ✍️ <b>콘텐츠 제작</b> 한 자리 (판 X99 → X380)

   사장님 말씀 (2026-10-13) — 「정책상품뉴스 / 인스타카드만들기 / 블로그
   이걸 하나에 컨텐츠 제작 … 홈 메뉴에서는 콘텐츠 들어가면 <b>한번에 보이게</b>」.
   사장님 말씀 (2026-11-06) — 「<b>콘텐츠도 안 복잡하게 클릭하면 한번에
   분류해서 보고 들어갈 수 있게</b> 만들어」.

   ── 판 X380 에서 무엇이 달라졌나 ─────────────────────────────────
   전에는 큰 칸 <b>셋</b>과 이름만 적힌 <b>칩 다섯</b>이었습니다. 칩 다섯은
   <b>분류가 없는 자루</b>였습니다. 이제 갈래의 여덟 화면이 <b>셋으로 묶여</b>
   모두 같은 줄꼴로 섭니다. 그래서 이 자의 눈금도 바뀝니다 —
     · 큰 칸 셋      → <b>줄 여덟 · 갈래 셋</b>
     · 칩 다섯       → <b>갈래의 화면이 하나도 안 빠졌나</b> (더 센 자입니다)
   <b>한 화면(844px)</b> 은 그대로 지킵니다 — 재어 보니 797px 입니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] 아래 띠 <b>콘텐츠</b> 칸이 이 화면으로 오고, 와서 <b>그 칸이 켜진다</b>.
     [2] 갈래 <b>셋</b>으로 묶여 <b>여덟</b>이 폰 한 화면(844px) 안에 선다.
     [3] 이름·설명을 <b>옮겨 적지 않았다</b> — 이름은 메뉴 표(TABS), 설명은
         TAB_META 에서 꺼낸다 (5번). 설명이 없으면 <b>빈손</b> (1번).
     [4] 표는 <b>직접 그린 SVG</b> 다 — 그림 파일·바깥 주소 0 (9번).
         ⚠ 회사 상표를 베끼지 않습니다.
     [5] 줄이 <b>정말 그 화면을 연다</b>.
     [6] ★ <b>길이 하나도 안 사라졌다</b> (6번) — 메뉴의 「콘텐츠 제작」 갈래에
         있는 화면이 <b>전부</b> 이 판에 섰나. 칩을 세던 자리보다 셉니다:
         메뉴에 한 칸을 넣고 표(HUB_MAP)에 안 적으면 그 자리에서 웁니다.
     [7] 화면에 <b>「undefined」</b> 가 없다 · 서버를 <b>안 부른다</b> (7번).
     [8] 분류판이 <b>한 벌</b>이다 (5번) — 콘텐츠와 교육이 같은 그리개
         (renderHubBoard)·같은 표(HUB_MAP)를 쓴다.

   ★ 네 자리 등록(메뉴·분류표·지도 사전·지도 그림)은 <b>check-newscr</b> 가
     봅니다 — 여기서 또 보지 않습니다 (5번).
   ★ 🎓 교육 갈래는 <b>check-edu</b> 가 봅니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9153;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
const SRC = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
/* 「옮겨 적었나」 를 볼 때는 주석과 판 쪽지를 걷고 봅니다 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ')
                .split('\n').filter(l => !/^var APP_BUILD/.test(l)).join('\n');

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
   'osCliInfoLoad','osRepListLoad'].forEach(n => { window[n] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded=true; if(cb)cb(); };
  window.setupDone = function(){return true;}; window.setupCanRun = function(){return true;};
  window.osTabAllowed = function(){return true;}; window.toast = function(){};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.list=[]; CM.loaded=true; CM.meta={};
  try{ osHideLoginGate(); }catch(e){}
};

(async () => {
  console.log('✍️ 콘텐츠 제작 한 자리 — 분류해서 한 번에 (판 X99 · X380)');

  sec('[0] 글을 <b>옮겨 적지 않았다</b> (5번) · 표는 직접 그렸다 (9번)');
  is(/function ctName\(/.test(SRC) && /TABS/.test(SRC.slice(SRC.indexOf('function ctName('), SRC.indexOf('function ctName(') + 400)),
     '이름은 <b>메뉴 표(TABS)</b> 에 묻는다');
  is(/function ctDesc\(/.test(SRC) && /TAB_META/.test(SRC.slice(SRC.indexOf('function ctDesc('), SRC.indexOf('function ctDesc(') + 300)),
     '설명은 <b>TAB_META</b> 에서 꺼낸다');
  const 허브 = CODE.slice(CODE.indexOf('function renderHubBoard('),
                          CODE.indexOf('function renderHubBoard(') + 2600);
  is(!/피드 캡션|상위노출 키트|브랜드 톤/.test(허브),
     '화면 글에 저쪽 설명을 <b>옮겨 적지 않았다</b> — 표에서 꺼내 쓴다');
  const 표그리개 = SRC.slice(SRC.indexOf('function ctMark('), SRC.indexOf('function ctMark(') + 3600);
  is(/<svg /.test(표그리개), '표를 <b>직접 SVG 로</b> 그린다 (9번)');
  is(!/instagram|insta(gram)?\.(com|png|svg)|logo\.(png|svg)/i.test(허브 + 표그리개),
     '회사 <b>상표를 베끼거나 받아 오지 않는다</b> — 흔한 그림으로 그린다');
  /* [8] 분류판이 한 벌인가 — 콘텐츠가 제 그리개를 따로 두지 않았나 */
  is(/function renderContentHub\(\)\{\s*return renderHubBoard\('content'\);\s*\}/.test(CODE),
     '분류판이 <b>한 벌</b>이다 — 콘텐츠는 renderHubBoard 를 그대로 부른다 (5번)');

  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  const 정적 = /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|cdnjs\.cloudflare|unpkg\.com/;
  /* 바깥을 막습니다 — 안 막으면 CI 에서 진짜 자료가 그려집니다 (check-netblock) */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + PORT) >= 0 || 정적.test(u)) ? r.continue() : r.abort();
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof go === 'function', { timeout: 60000 });
  await pg.evaluate(SEED);

  sec('[1] 아래 띠 <b>콘텐츠</b> 칸 — 이 화면으로 오고, 와서 켜진다');
  const 띠 = await pg.evaluate(() => {
    const t = (typeof TB !== 'undefined') ? TB.filter(x => x.t === '콘텐츠')[0] : null;
    return { id: t ? t.id : '(없음)', pin: t ? (t.pin || []) : [] };
  });
  is(띠.id === 'content', '띠의 콘텐츠 칸이 <b>content</b> 로 간다 ← ' + 띠.id);
  const B = await pg.evaluate(() => new Promise(r => {
    tbGo('content');
    setTimeout(() => {
      const on = document.querySelector('#tabBar .tb-b.on');
      const pane = document.querySelector('#dynPane .tab-pane.on');
      r({ 켜짐: on ? on.innerText.replace(/\s+/g, ' ').trim() : '(안 켜짐)',
          제목: (document.querySelector('#dynPane .page-title') || {}).innerText || '',
          높이: pane ? Math.round(pane.getBoundingClientRect().height) : 0,
          글: pane ? pane.innerText.replace(/\s+/g, ' ') : '',
          갈래: [].slice.call(document.querySelectorAll('#dynPane .ct-hd'))
                 .map(x => x.innerText.replace(/\s+/g, ' ').trim()),
          줄: [].slice.call(document.querySelectorAll('#dynPane .ct-r'))
                .map(x => x.innerText.replace(/\s+/g, ' ').trim()),
          낮은줄: Math.min.apply(null, [].slice.call(document.querySelectorAll('#dynPane .ct-r'))
                .map(x => Math.round(x.getBoundingClientRect().height))),
          svg: document.querySelectorAll('#dynPane .ct-mk svg').length,
          img: document.querySelectorAll('#dynPane img').length });
    }, 900);
  }));
  is(/콘텐츠/.test(B.켜짐), '  띠 칸이 <b>켜진다</b> — 「지금 여기」 를 말한다 ← ' + B.켜짐);
  is(/콘텐츠 제작/.test(B.제목), '  화면이 선다 ← ' + B.제목);

  sec('[2] <b>분류해서 한 번에</b> — 갈래 셋 · 줄 여덟 · 폰 한 화면');
  is(B.갈래.length === 3, '  갈래가 <b>셋</b>이다 ← ' + B.갈래.length + '개 (' + B.갈래.join(' / ') + ')');
  is(B.줄.length === 8, '  줄이 <b>여덟</b>이다 ← ' + B.줄.length + '개');
  ['정책', '인스타', '블로그'].forEach(w =>
    is(B.줄.join(' ').indexOf(w) >= 0, '  「' + w + '」 이 있다'));
  is(B.높이 > 0 && B.높이 <= 844,
     '  폰 <b>한 화면(844px) 안</b>에 들어온다 — ' + B.높이 + 'px');
  is(B.낮은줄 >= 44, '  누르는 줄이 <b>44px 이상</b>이다 — 가장 낮은 줄 ' + B.낮은줄 + 'px');

  sec('[3] 지어내지 않는다 (1번) · 부서진 값이 없다');
  is(!/undefined|NaN|\[object/.test(B.글),
     '  화면에 <b>부서진 값</b>이 없다 — return 뒤 줄바꿈으로 undefined 가 찍힌 자리');
  const 설명 = await pg.evaluate(() => ({
    biz: (typeof ctDesc === 'function') ? ctDesc('biz_news') : 'x',
    insta: (typeof ctDesc === 'function') ? ctDesc('insta') : 'x'
  }));
  is(설명.biz === '', '  설명이 없는 화면(정책·상품 뉴스)은 <b>빈손</b>이다 — 지어내지 않는다');
  is(설명.insta.length > 0, '  설명이 있는 화면은 <b>그 표의 글</b>을 그대로 쓴다');

  sec('[4] 표는 <b>직접 그린 그림</b>이다 (9번)');
  is(B.svg === 8, '  줄 여덟이 다 <b>SVG</b> 표를 달았다 — ' + B.svg + '개');
  is(B.img === 0, '  <b>그림 파일을 안 받아 온다</b> — img ' + B.img + '개');

  sec('[5] ★ <b>길이 하나도 안 사라졌다</b> (6번) — 갈래의 화면이 전부 섰나');
  const 빠짐 = await pg.evaluate(() => {
    const g = TABS.filter(x => x.group === '콘텐츠 제작')[0];
    const 메뉴 = (g ? g.items : []).map(x => x.id).filter(x => x !== 'content');
    const 판 = [];
    (HUB_MAP.content.g || []).forEach(k => (k.it || []).forEach(x => 판.push(x.id)));
    return { 메뉴: 메뉴, 판: 판,
             빠진: 메뉴.filter(x => 판.indexOf(x) < 0),
             헛것: 판.filter(x => 메뉴.indexOf(x) < 0) };
  });
  is(빠짐.빠진.length === 0, '  메뉴 갈래의 ' + 빠짐.메뉴.length + '칸이 <b>전부</b> 판에 섰다' +
     (빠짐.빠진.length ? ' ← 빠짐: ' + 빠짐.빠진.join(', ') : ''));
  is(빠짐.헛것.length === 0, '  판에 <b>갈래 밖의 화면</b>이 없다' +
     (빠짐.헛것.length ? ' ← ' + 빠짐.헛것.join(', ') : ''));

  sec('[6] 줄이 <b>정말 그 화면을 연다</b>');
  for (const [i, want] of [[0, '뉴스'], [2, '인스타'], [3, '블로그']]) {
    const 열림 = await pg.evaluate((k) => new Promise(r => {
      go('content');
      setTimeout(() => {
        const b = document.querySelectorAll('#dynPane .ct-r')[k];
        if (!b) return r('(줄 없음)');
        b.click();
        setTimeout(() => r(((document.querySelector('#dynPane .page-title') || {}).innerText || '').trim()), 900);
      }, 500);
    }), i);
    is(열림.indexOf(want) >= 0,
       '  ' + (i + 1) + '번째 줄을 누르니 <b>' + want + '</b> 화면이 선다 ← ' + 열림);
  }

  sec('[7] 조용한가 (7번)');
  const 허브자 = ['ctName', 'ctDesc', 'ctMark', 'hubRowHtml', 'renderHubBoard', 'renderContentHub'].filter(n => {
    const i = SRC.indexOf('function ' + n + '(');
    if (i < 0) return true;
    const j = SRC.indexOf('\nfunction ', i + 10);
    return /osClient\(|sb\.from\(|fetch\(/.test(SRC.slice(i, j < 0 ? SRC.length : j));
  });
  is(허브자.length === 0, '  판이 <b>서버를 안 부른다</b>' + (허브자.length ? ' ← ' + 허브자.join(', ') : ''));
  is(errs.length === 0, '  콘솔이 조용하다' + (errs.length ? ' ← ' + errs[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지가 어긋납니다'); process.exit(1); }
  console.log('✓ 콘텐츠 제작 — 갈래 셋으로 묶인 여덟이 한 화면에 서고, 길은 하나도 안 사라졌습니다.');
})();
