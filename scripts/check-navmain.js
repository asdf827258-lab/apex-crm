/* ══════════════════════════════════════════════════════════════════
   check-navmain.js — <b>기둥 맨 위에 메뉴가 보이나.</b>

   2026-09-26. 사장님 말씀 — 「목업하고 너무 다른데」. 컴퓨터로 열어
   나란히 놓고 보니, 왼쪽 기둥에 <b>메뉴가 하나도 안 보였습니다.</b>
   큰 카드 넷(내 폰에 설치 · 사용가이드 · 전체 지도 · 무엇을 할지)이
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
    const lab = el ? el.querySelector('.t-glab') : null;
    const card = document.querySelector('#navFix .sb-guide');
    const top = x => x ? Math.round(x.getBoundingClientRect().top) : null;
    return { 있나: !!el, 칸수: rows.length,
             이름: rows.map(x => x.textContent.replace(/\s+/g, ' ').trim()),
             라벨: lab ? lab.textContent.trim() : '',
             첫칸y: top(rows[0]), 막칸y: top(rows[rows.length - 1]),
             카드y: top(card), 판높이: window.innerHeight };
  });
  is(A.있나 && A.칸수 > 0, '  기둥 맨 위에 <b>메뉴 칸</b>이 있다 — ' + A.칸수 + '칸');
  is(A.라벨 === '오늘 하루', '  묶음 이름이 <b>「오늘 하루」</b> 다 — ' + (A.라벨 || '(없음)'));
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

  console.log('\n[3] ★ 큰 카드 넷이 <b>안 없어졌다</b> (1번)');
  const C = await p.evaluate(() => {
    const t = (document.getElementById('navFix') || {}).innerText || '';
    return { 설치: /내 폰에 설치/.test(t), 가이드: /사용가이드/.test(t),
             지도: /전체 지도/.test(t), 도움: /무엇을 할지 모르겠다면/.test(t),
             찾기: !!document.getElementById('navFind') };
  });
  is(C.설치,   '  「내 폰에 설치」 가 그대로 있다');
  is(C.가이드, '  「APEX 사용가이드」 가 그대로 있다');
  is(C.지도,   '  「APEX 전체 지도」 가 그대로 있다');
  is(C.도움,   '  「무엇을 할지 모르겠다면」 이 그대로 있다');
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

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 기둥 맨 위에 메뉴가 서고, 큰 카드도 그대로 있습니다.');
  process.exit(bad ? 1 : 0);
})();
