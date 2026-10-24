/* ══════════════════════════════════════════════════════════════════
   check-navmain.js — <b>기둥 맨 위에 메뉴가 보이나.</b>

   2026-09-26. 사장님 말씀 — 「목업하고 너무 다른데」. 컴퓨터로 열어
   나란히 놓고 보니, 왼쪽 기둥에 <b>메뉴가 하나도 안 보였습니다.</b>
   큰 카드 셋(내 폰에 설치 · 사용가이드 · APEX 자비스 모드)이 — 넷째였던
   「무엇을 할지 모르겠다면」 은 사장님 말씀으로 뺐고, 화면은 살아 있습니다
   위를 다 먹어 메뉴 칸이 <b>화면 밖으로</b> 밀려 있었습니다 — 메뉴를
   보려고 굴려야 했습니다. 목업(docs/토스판_사본.html)은 기둥 맨 위가
   「오늘 하루」 다섯 칸입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 「오늘 하루」 가 <b>첫 화면 안</b>에 · 큰 카드 넷보다 <b>위</b>에
     [2] 칸이 <b>TB 그대로</b>다 — 표를 두 벌로 안 만들었다 (5번)
     [3] ★ 큰 카드 넷이 <b>안 없어졌다</b> (1번) — 내렸을 뿐이다
     [4] 지금 화면이 <b>켜지고</b>, 옮기면 <b>따라간다</b>
     [5] 수는 <b>아는 것만</b> — 못 세면 안 적는다 (1번)
     [6] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9021;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 이름은 「홍길동」 (3번). 등급은 사장님 계정처럼 열어 둡니다. */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  CM.loaded=true; CM.meta={}; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  OSC.list=['홍길동','홍길순','홍길상'].map((n,i)=>
    ({id:'c'+i,name:n,advisor_id:'me',stage:'AP',created_at:ago(90)}));
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  /* 컴퓨터 폭 — 기둥이 서는 자리입니다 */
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);

  console.log('\n[1] 「오늘 하루」 가 <b>첫 화면 안</b>에 · 큰 카드보다 <b>위</b>에');
  const A = await p.evaluate(() => {
    const el = document.getElementById('navMain');
    const rows = el ? [].slice.call(el.querySelectorAll('.t-nav')) : [];
    const labs = el ? [].slice.call(el.querySelectorAll('.t-glab')).map(x => x.textContent.trim()) : [];
    const lab = labs[0] || '';
    const card = document.querySelector('#navFix .sb-guide');
    const top = x => x ? Math.round(x.getBoundingClientRect().top) : null;
    return { 있나: !!el, 칸수: rows.length,
             이름: rows.map(x => x.textContent.replace(/\s+/g, ' ').trim()),
             라벨: lab, 라벨들: labs,
             첫칸y: top(rows[0]), 막칸y: top(rows[rows.length - 1]),
             카드y: top(card), 판높이: window.innerHeight };
  });
  is(A.있나 && A.칸수 > 0, '  기둥 맨 위에 <b>메뉴 칸</b>이 있다 — ' + A.칸수 + '칸');
  /* ⚠⚠ 2026-10-23 (판 X173) · <b>「오늘 하루」 가 첫째여야 한다</b> 를
     <b>「있어야 한다」</b> 로 바꿉니다. 사장님 말씀 「교육매니저 em 전용
     사이트를 <b>메뉴 맨 왼쪽 위</b>에다가 넣어줄래 <b>교육시스템EM</b> 이라는
     목록으로 넣어줘」 — 그 목록이 「오늘 하루」 <b>위</b>에 섭니다.
     ★ 재는 것을 없애지 않습니다 — 「오늘 하루」 가 사라지면 그대로 울고,
       맨 위에 설 수 있는 이름은 <b>적어 둔 것뿐</b>입니다. 아무 이름이나
       올라오면 그 자리에서 빨간불입니다 (8번).
     ⚠ 이 목록은 <b>교육매니저·지점장·대표에게만</b> 보입니다 — 설계사에게는
       「오늘 하루」 가 그대로 첫째입니다(아래 둘째 줄).                   */
  const 맨위허용 = ['교육시스템EM'];
  is(A.라벨들.indexOf('오늘 하루') >= 0,
     '  기둥에 <b>「오늘 하루」</b> 묶음이 있다 — ' + (A.라벨들.join(' · ') || '(없음)'));
  is(A.라벨 === '오늘 하루' || 맨위허용.indexOf(A.라벨) >= 0,
     '  맨 위 묶음이 <b>「오늘 하루」 이거나 적어 둔 것</b>이다 — ' + (A.라벨 || '(없음)'));
  is(A.첫칸y !== null && A.첫칸y < A.판높이,
     '  <b>첫 화면 안</b>에 있다 — 첫 칸 ' + A.첫칸y + 'px / 한 판 ' + A.판높이 + 'px');
  is(A.막칸y !== null && A.막칸y < A.판높이,
     '  <b>마지막 칸까지</b> 첫 화면 안이다 — ' + A.막칸y + 'px');
  is(A.카드y !== null && A.막칸y !== null && A.카드y > A.막칸y,
     '  큰 카드(내 폰에 설치 …)가 <b>메뉴보다 아래</b>다 — 카드 ' + A.카드y + 'px');

  console.log('\n[2] 칸이 <b>TB 그대로</b>다 — 표를 두 벌로 안 만들었다 (5번)');
  const B = await p.evaluate(() => {
    const el = document.getElementById('navMain');
    const got = [].slice.call(el.querySelectorAll('.t-nav[data-go]'))
                  .map(x => x.getAttribute('data-go'));
    const want = TB.filter(x => (typeof tbCan !== 'function') || tbCan(x.id)).map(x => x.id);
    return { got: got, want: want, 넣기: got.indexOf('me') >= 0 };
  });
  const 빠짐 = B.want.filter(x => B.got.indexOf(x) < 0);
  is(빠짐.length === 0,
     '  아래 띠(TB)의 칸이 <b>다 있다</b> — ' + B.want.join(' · ') +
     (빠짐.length ? (' ← ' + 빠짐.join(' · ') + ' 이 빠졌습니다') : ''));
  is(B.넣기, '  「나」 도 있다 — TB 다섯째가 달력이라 따로 세운다');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/for\(i=0;i<TB\.length;i\+\+\)\{\s*\n\s*x=TB\[i\];/.test(SRC) ||
     /navMainHtml[\s\S]{0,700}TB\.length/.test(SRC),
     '  기둥이 <b>TB 를 그대로 읽는다</b> — 제 표를 따로 안 만들었다 (5번)');

  /* ⚠ <b>2026-10-22 (판 X161) · 넷에서 셋이 되었습니다.</b> 사장님 말씀
     「무엇을 할지모르곘다면 이건 삭제하고 전체지도 이름을 APEX 자비스 모드 로
     이름을 바꾸고 뭐든 도울수 있는 아이콘으로 강조해줘」.
     ★ <b>「그대로 있다」 는 약속은 그대로입니다</b> — 사장님이 빼라고 하신
       하나만 뺐고, 나머지는 안 사라집니다 (1번).
     ★ <b>이름을 박아 두지 않습니다</b> — 자비스 모드의 이름은 TABS 한 곳에서
       오므로 <b>앱에 물어</b> 씁니다. 박아 두면 이름을 바꿀 때 이 줄만 낡아
       「없는 글자를 없다고 확인하는 늘 초록인 줄」 이 됩니다 (5번·8번).
     ★ <b>지운 것은 단추뿐</b>입니다 — 화면(helpme)은 살아 있어야 하고,
       찾기·음성·?go=helpme 로 그대로 열려야 합니다 (6번).              */
  console.log('\n[3] ★ 큰 카드 <b>셋</b>이 안 없어졌다 · 뺀 하나는 <b>길이 남았다</b> (1번·6번)');
  const C = await p.evaluate(() => {
    const t = (document.getElementById('navFix') || {}).innerText || '';
    const 자비스 = (typeof navTitle === 'function') ? navTitle('apexmap') : '';
    return { 설치: /내 폰에 설치/.test(t), 가이드: /사용가이드/.test(t),
             자비스이름: 자비스, 자비스: !!자비스 && t.indexOf(자비스) >= 0,
             강조: !!document.querySelector('#navFix .sb-guide.map.jarv'),
             도움단추: /무엇을 할지 모르겠다면/.test(t),
             찾기: !!document.getElementById('navFind') };
  });
  is(C.설치,   '  「내 폰에 설치」 가 그대로 있다');
  is(C.가이드, '  「APEX 사용가이드」 가 그대로 있다');
  is(C.자비스, '  「' + C.자비스이름 + '」 가 그대로 있다 — 이름은 <b>앱에 물어</b> 썼습니다 (5번)');
  is(C.강조,   '  ★ 그 칸이 <b>강조</b>되어 있다 (사장님 말씀 「뭐든 도울수 있는 아이콘으로 강조해줘」)');
  is(!C.도움단추, '  ★ 「무엇을 할지 모르겠다면」 <b>단추는 뺐다</b> (사장님 말씀 「이건 삭제하고」)');
  const H = await p.evaluate(async () => {
    const was = (typeof currentTab === 'function') ? currentTab() : '';
    go('helpme'); await new Promise(r => setTimeout(r, 700));
    const now = (typeof currentTab === 'function') ? currentTab() : '';
    const 글 = ((document.getElementById('dynPane') || {}).innerText || '').replace(/\s+/g, ' ');
    go(was || 'home'); await new Promise(r => setTimeout(r, 400));
    return { 열림: now === 'helpme', 글: 글.slice(0, 40),
             함수: typeof renderHelpMe === 'function' };
  });
  is(H.열림 && H.함수,
     '  ★★ 그래도 <b>그 화면은 살아 있다</b> — ?go=helpme · 찾기로 열립니다 (6번) — 「' + H.글 + '…」');
  is(C.찾기,   '  <b>찾기 칸</b>도 그대로 있다');

  console.log('\n[4] 지금 화면이 <b>켜지고</b>, 옮기면 <b>따라간다</b>');
  const D = await p.evaluate(async () => {
    const on = () => {
      const el = document.getElementById('navMain');
      const x = el ? el.querySelector('.t-nav.on') : null;
      return x ? x.getAttribute('data-go') : '';
    };
    const out = { home: on() };
    for (const t of ['clients', 'tools', 'mycal', 'home']) {
      go(t); await new Promise(r => setTimeout(r, 500));
      out[t] = on();
    }
    return out;
  });
  is(D.home === 'home', '  홈에서 <b>「오늘」 이 켜진다</b> — ' + (D.home || '(안 켜짐)'));
  ['clients', 'tools', 'mycal'].forEach(t => {
    is(D[t] === t, '  ' + t + ' 으로 옮기면 <b>그 칸이 켜진다</b> — ' + (D[t] || '(안 켜짐)'));
  });

  console.log('\n[5] 수는 <b>아는 것만</b> — 못 세면 안 적는다 (1번)');
  const E = await p.evaluate(() => {
    const el = document.getElementById('navMain');
    const c = x => { const r = el.querySelector('.t-nav[data-go="' + x + '"] .c');
                     return r ? r.textContent.trim() : ''; };
    const 진짜 = (typeof ccMyList === 'function') ? ccMyList().length : null;
    /* 못 읽는 상태로 만들어 봅니다 — 그때 <b>0 을 적으면 안 됩니다</b> */
    const 담 = OSC.list; OSC.list = [];
    navMainPaint();
    const 빈것 = c('clients');
    OSC.list = 담; navMainPaint();
    return { 고객: c('clients'), 진짜: 진짜, 빈것: 빈것, 도구: c('tools') };
  });
  is(E.고객 !== '' && String(E.진짜) === E.고객,
     '  「고객」 수가 <b>고객 365일과 같다</b> — ' + E.고객 + ' / ' + E.진짜);
  is(E.빈것 === '', '  ★ 못 셀 때는 <b>0 을 안 적는다</b> — 그 자리를 비운다 (1번)');
  is(E.도구 === '', '  셀 것이 없는 칸(도구)은 <b>딱지를 안 붙인다</b>');

  /* ── [5-1] 빠른 안내도 <b>앱에 물어 적는가</b> ────────────────────
     2026-10-22 · 판 X164. 서랍 이름을 바꾸고 라이브를 열어 보니, <b>빠른
     안내</b>(osQuickGuideBody) 가 옛 이름 「APEX 전체 지도」 와 옛 그림
     🗺️ 를 <b>손으로 베껴</b> 들고 있었습니다. 게다가 「화면 <b>여든아홉</b>
     개」 라고 적혀 있었는데 실제로는 107개였고, 「<b>초록</b> 단추」 라고
     했는데 지금은 파랑입니다 — 한 줄에 거짓이 셋이었습니다 (1번 · 5번).
     ★ 수를 글자로 박으면 화면이 늘 때마다 그 줄이 낡아 거짓말이 됩니다 —
     CLAUDE.md 가 제 머리글에서 쓰는 바로 그 규칙입니다.               */
  console.log('\n[5-1] 빠른 안내가 앱에 물어 적는가 (손으로 베끼지 않는가)');
  {
    const G = await p.evaluate(() => {
      const body = (typeof osQuickGuideBody === 'function') ? osQuickGuideBody() : '';
      const nm = (typeof navTitle === 'function') ? navTitle('apexmap') : '';
      const ic = (typeof navItemOf === 'function' && navItemOf('apexmap')) ? navItemOf('apexmap').icon : '';
      return { body: body, nm: nm, ic: ic,
               tabs: (typeof TABS !== 'undefined') ? 1 : 0 };
    });
    is(G.body.length > 200, '  빠른 안내를 읽었다 — ' + G.body.length + '자');
    is(G.nm !== '' && G.body.indexOf(G.nm) >= 0,
       '  빠른 안내가 <b>메뉴와 같은 이름</b>을 쓴다 — 「' + G.nm + '」');
    is(!/APEX 전체 지도|전체지도 보기/.test(G.body),
       '  <b>옛 이름을 안 들고 있다</b>');
    is(G.body.indexOf('🗺️') < 0 && (G.ic === '' || G.body.indexOf(G.ic) >= 0),
       '  빠른 안내의 그림도 <b>메뉴와 같다</b> — ' + (G.ic || '?'));
    is(!/화면\s*(여든|아흔|일흔|예순|[0-9]{2,3})\s*[가-힣]*\s*개/.test(G.body),
       '  ★ <b>화면 수를 글자로 박지 않는다</b> — 화면이 늘면 그 줄이 거짓말이 된다 (1번)');
    is(!/초록 단추/.test(G.body),
       '  ★ 단추 <b>색을 글자로 박지 않는다</b> — 옷이 바뀌면 거짓말이 된다 (1번)');
  }

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 기둥 맨 위에 메뉴가 서고, 큰 카드도 그대로 있습니다.');
  process.exit(bad ? 1 : 0);
})();
