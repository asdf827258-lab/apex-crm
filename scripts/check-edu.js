/* ══════════════════════════════════════════════════════════════════
   check-edu.js — 🎓 <b>교육</b> 을 도구 밑의 큰 갈래로 (판 X379 · X380)

   사장님 말씀 (2026-11-06) — 「큰 카테고리에서 <b>교육</b>도 하나 만들어줘
   <b>도구 밑에</b> 거기에 교육자료 쓸것들 다 정리해서 넣어주고 / 콘텐츠도
   안 복잡하게 클릭하면 한번에 분류해서 보고 들어갈 수 있게 만들어」.

   ── 재어 보고 안 것 ───────────────────────────────────────────────
   「교육 자료」 묶음은 <b>맨 아래</b>(조직 관리 뒤)에 있었고, 교재·강의·훈련
   <b>일곱</b>은 상담 도구 안에 섞여 있었습니다. 배우러 가는 사람은 서랍을
   끝까지 내려야 했고, 거기 가도 절반밖에 없었습니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] 「교육」 묶음이 <b>상담 도구 바로 밑</b>이다 — 말씀하신 「도구 밑에」.
     [2] 교재 일곱이 <b>교육</b>에 있고, 현장에서 쥐는 것은 <b>상담 도구</b>에 남았다.
     [3] ★ <b>길이 하나도 안 사라졌다</b> (6번) — 옮긴 일곱이 전부 그대로 열린다.
     [4] 🎓 교육 한 자리가 서고, 갈래마다 <b>왜 그 갈래인지</b> 한 줄이 있다.
     [5] ★ 판이 메뉴 교육 갈래를 <b>다 들고</b> 있다 — 빠짐 0 · 헛것 0 (5번).
         표가 하나라 메뉴에 칸을 넣고 표에 안 적으면 그 자리에서 웁니다.
     [6] <b>등급 문</b>이 산다 — 설계사에게는 EM 두 칸이 안 서고, 교육매니저
         에게는 선다. 못 여는 문을 그려 두면 눌러 보고 실망하십니다 (1번).
     [7] 「언제 쓰는지」 분류(NAV_WHEN)는 <b>안 건드렸다</b> — 🧰 도구 화면이
         그대로다. 서랍 자리만 옮긴 것이지 분류를 바꾼 것이 아닙니다.
     [8] 누르는 줄이 44px 이상 · 글씨 13px 이상 · 서버 0 · 콘솔 조용.

   ★ 네 자리 등록(메뉴·분류표·지도 사전·지도 그림)은 <b>check-newscr</b> 가
     봅니다 — 여기서 또 보지 않습니다 (5번).
   ★ ✍️ 콘텐츠 갈래는 <b>check-conthub</b> 가 봅니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9221;
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

/* 옮긴 교재 일곱 — 말씀하신 「교육자료 쓸것들」 */
const 옮긴것 = ['bohum', 'ta_train', 'jiin_grow', 'ta_say', 'rej_gym', 'bcd_lec', 'fp_talk'];
/* 현장에서 고객 앞에 쥐는 것 — 상담 도구에 <b>남아야</b> 합니다 */
const 남을것 = ['ta_script', 'saybook', 'silson5', 'mikki_talk', 'dz_guide', 'kijun', 'sangdam'];

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
  console.log('🎓 교육 — 도구 밑의 큰 갈래 (판 X379 · X380)');

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

  sec('[1] 「교육」 묶음이 <b>상담 도구 바로 밑</b>이다 — 「도구 밑에」');
  const 차례 = await pg.evaluate(() => TABS.map(g => g.group));
  const i도구 = 차례.indexOf('상담 도구'), i교육 = 차례.indexOf('교육');
  is(i교육 >= 0, '  「교육」 묶음이 있다' + (i교육 < 0 ? ' ← 없습니다' : ''));
  is(i도구 >= 0 && i교육 === i도구 + 1,
     '  차례가 <b>상담 도구 → 교육</b> 이다 ← ' + 차례.slice(Math.max(0, i도구 - 1), i도구 + 3).join(' → '));
  is(차례.indexOf('교육 자료') < 0, '  옛 이름 「교육 자료」 가 남아 있지 않다');

  sec('[2] 교재 일곱은 <b>교육</b>에 · 현장에서 쥐는 것은 <b>상담 도구</b>에');
  const 자리 = await pg.evaluate((o) => {
    const m = {};
    TABS.forEach(g => (g.items || []).forEach(it => { m[it.id] = g.group; }));
    return m;
  }, 옮긴것);
  const 안옮김 = 옮긴것.filter(id => 자리[id] !== '교육');
  is(안옮김.length === 0, '  교재 <b>일곱</b>이 교육 갈래에 있다' +
     (안옮김.length ? ' ← ' + 안옮김.map(x => x + '(' + (자리[x] || '없음') + ')').join(', ') : ''));
  const 끌려감 = 남을것.filter(id => 자리[id] !== '상담 도구');
  is(끌려감.length === 0, '  현장에서 쥐는 <b>일곱</b>은 상담 도구에 남았다' +
     (끌려감.length ? ' ← ' + 끌려감.map(x => x + '(' + (자리[x] || '없음') + ')').join(', ') : ''));

  sec('[3] ★ <b>길이 하나도 안 사라졌다</b> (6번) — 옮긴 일곱이 그대로 열린다');
  for (const id of 옮긴것) {
    const 열림 = await pg.evaluate((k) => new Promise(r => {
      go(k);
      setTimeout(() => r({
        제목: ((document.querySelector('#dynPane .page-title') || {}).innerText || '').trim(),
        글자: (document.querySelector('#dynPane') || { innerText: '' }).innerText.replace(/\s+/g, ' ').trim().length,
        메뉴: (typeof navItemOf === 'function' && navItemOf(k)) ? navItemOf(k).title : '' }), 900);
    }), id);
    is(열림.글자 > 40 && !!열림.메뉴,
       '  ' + id + ' — 메뉴에 「' + (열림.메뉴 || '(없음)') + '」 로 있고 열린다 (글 ' + 열림.글자 + '자)');
  }

  sec('[4] 🎓 교육 한 자리가 선다 — 갈래마다 <b>왜 그 갈래인지</b> 한 줄');
  const E = await pg.evaluate(() => new Promise(r => {
    go('edu');
    setTimeout(() => {
      const pane = document.querySelector('#dynPane .tab-pane.on');
      const hd = [].slice.call(document.querySelectorAll('#dynPane .ct-hd'));
      r({ 제목: (document.querySelector('#dynPane .page-title') || {}).innerText || '',
          갈래: hd.map(x => ({ t: (x.childNodes[0] || {}).textContent || '',
                              s: (x.querySelector('i') || { textContent: '' }).textContent })),
          줄: [].slice.call(document.querySelectorAll('#dynPane .ct-r'))
                .map(x => ({ t: x.innerText.replace(/\s+/g, ' ').trim(),
                             h: Math.round(x.getBoundingClientRect().height),
                             fs: parseFloat(getComputedStyle(x.querySelector('.ct-t b')).fontSize) })),
          글: pane ? pane.innerText.replace(/\s+/g, ' ') : '',
          img: document.querySelectorAll('#dynPane img').length });
    }, 900);
  }));
  is(/교육 한 자리/.test(E.제목), '  화면이 선다 ← ' + E.제목);
  is(E.갈래.length >= 4, '  갈래가 <b>넷 이상</b>으로 묶였다 ← ' + E.갈래.length + '개');
  const 빈말 = E.갈래.filter(g => !g.s || !g.s.trim());
  is(빈말.length === 0, '  갈래마다 <b>한 줄 설명</b>이 있다' +
     (빈말.length ? ' ← 빈 것: ' + 빈말.map(g => g.t).join(', ') : ''));
  is(!/undefined|NaN|\[object/.test(E.글), '  화면에 <b>부서진 값</b>이 없다');
  is(E.img === 0, '  <b>그림 파일을 안 받아 온다</b> — img ' + E.img + '개 (9번)');

  sec('[5] ★ 판이 메뉴 교육 갈래를 <b>다 들고</b> 있다 (5번)');
  const D = await pg.evaluate(() => {
    const g = TABS.filter(x => x.group === '교육')[0];
    const 메뉴 = (g ? g.items : []).map(x => x.id).filter(x => x !== 'edu');
    const 판 = [];
    (HUB_MAP.edu.g || []).forEach(k => (k.it || []).forEach(x => 판.push(x.id)));
    return { 메뉴: 메뉴, 판: 판,
             빠진: 메뉴.filter(x => 판.indexOf(x) < 0),
             헛것: 판.filter(x => 메뉴.indexOf(x) < 0),
             겹침: 판.filter((x, i) => 판.indexOf(x) !== i) };
  });
  is(D.빠진.length === 0, '  메뉴 교육 갈래의 ' + D.메뉴.length + '칸이 <b>전부</b> 판에 섰다' +
     (D.빠진.length ? ' ← 빠짐: ' + D.빠진.join(', ') : ''));
  is(D.헛것.length === 0, '  판에 <b>교육 갈래 밖의 화면</b>이 없다' +
     (D.헛것.length ? ' ← ' + D.헛것.join(', ') : ''));
  is(D.겹침.length === 0, '  같은 화면이 <b>두 갈래에</b> 서지 않는다' +
     (D.겹침.length ? ' ← ' + D.겹침.join(', ') : ''));

  sec('[6] <b>등급 문</b> — 못 여는 칸은 안 그린다 (1번)');
  const 문 = await pg.evaluate(() => new Promise(r => {
    const 센다 = () => [].slice.call(document.querySelectorAll('#dynPane .ct-r'))
                        .map(x => x.innerText.replace(/\s+/g, ' ').trim()).join(' | ');
    OS.profile.role = 'fp'; go('edu');
    setTimeout(() => {
      const 설계사 = 센다();
      OS.profile.role = 'education_manager'; go('edu');
      setTimeout(() => r({ 설계사: 설계사, 교육매니저: 센다() }), 700);
    }, 700);
  }));
  is(!/운영센터|교육 캘린더/.test(문.설계사),
     '  설계사에게는 <b>EM 두 칸이 안 선다</b> — 눌러도 안 열리기 때문입니다');
  is(/운영센터/.test(문.교육매니저) && /교육 캘린더/.test(문.교육매니저),
     '  교육매니저에게는 <b>선다</b> ← ' + (문.교육매니저.split('|').length) + '칸');

  sec('[7] 「언제 쓰는지」 분류는 <b>안 건드렸다</b> — 🧰 도구 화면이 그대로');
  const W = await pg.evaluate((o) => {
    const out = {};
    o.forEach(id => { out[id] = NAV_WHEN[id] || '(없음)'; });
    return { 분류: out, edu: NAV_WHEN['edu'] || '(없음)' };
  }, 옮긴것);
  const 바뀜 = 옮긴것.filter(id => W.분류[id] !== (id === 'bohum' ? 'know' : 'meet'));
  is(바뀜.length === 0, '  옮긴 일곱의 「언제 쓰는지」 가 <b>그대로</b>다 (bohum=know · 나머지=meet)' +
     (바뀜.length ? ' ← ' + 바뀜.map(x => x + '→' + W.분류[x]).join(', ') : ''));
  is(W.edu === 'know', '  🎓 교육 한 자리는 <b>찾아보고 배우기</b> 다 ← ' + W.edu);

  sec('[8] 읽히나 · 누를 수 있나 · 조용한가');
  const 낮은줄 = Math.min.apply(null, E.줄.map(x => x.h));
  const 작은글 = E.줄.filter(x => x.fs < 13);
  is(낮은줄 >= 44, '  누르는 줄이 <b>44px 이상</b> — 가장 낮은 줄 ' + 낮은줄 + 'px');
  is(작은글.length === 0, '  이름 글씨가 <b>13px 이상</b>' +
     (작은글.length ? ' ← ' + 작은글.length + '곳' : ''));
  const 조용 = ['hubRowHtml', 'renderHubBoard'].filter(n => {
    const i = SRC.indexOf('function ' + n + '(');
    if (i < 0) return true;
    const j = SRC.indexOf('\nfunction ', i + 10);
    return /osClient\(|sb\.from\(|fetch\(/.test(SRC.slice(i, j < 0 ? SRC.length : j));
  });
  is(조용.length === 0, '  판이 <b>서버를 안 부른다</b> (7번)' + (조용.length ? ' ← ' + 조용.join(', ') : ''));
  is(errs.length === 0, '  콘솔이 조용하다' + (errs.length ? ' ← ' + errs[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지가 어긋납니다'); process.exit(1); }
  console.log('✓ 교육 — 도구 바로 밑에 서고, 교재가 한 자리에 모였고, 길은 하나도 안 사라졌습니다.');
})();
