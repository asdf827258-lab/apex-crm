/* ══════════════════════════════════════════════════════════════════
   고객 화면 — <b>사람이 첫 화면 안에 있나</b>

   2026-09-26 에 설계사처럼 몰아 보다 잰 것입니다. 「고객」 을 눌렀는데
   <b>찾기 칸이 2,046px · 고객 목록이 2,106px</b> 아래에 있었습니다.
   화면 한 판이 932px 이니 <b>두 판 넘게</b> 내려야 사람이 나옵니다.
   「고객」 을 누르는 까닭은 <b>사람을 찾으려는 것</b>인데, 찾으려면
   스크롤부터 해야 했습니다.

   ★ 미션 · 계약 마디 · 이번 달 달력은 <b>지운 것이 아닙니다.</b> 목록
     아래에 그대로 섭니다 — 이 점검이 그것도 같이 봅니다. 순서를 고치다
     칸을 잃으면 「없어졌다」 가 되고, 그게 더 나쁩니다 (1번).
   ★ 픽셀 수를 박아 두지 않습니다. <b>첫 화면(viewport) 안인가</b> 로만
     봅니다 — 글씨 크기가 바뀌면 픽셀은 따라 움직이기 때문입니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8975;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type':'application/json' }); rs.end('{"key":null,"has":false}'); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안 (3번) */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user:{ id:'me' } };
  OS.profile = { id:'me', name:'윤시현', role:'owner', active:true, plan:'vip', team_id:'t1' };
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  OSC.list=[{id:'c1',name:'홍길동',advisor_id:'me',phone:'010-0000-0001'},
            {id:'c2',name:'홍길순',advisor_id:'me',phone:'010-0000-0002'}];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{ width:430, height:932 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('' + (e && e.message)));

  await p.goto('http://127.0.0.1:'+PORT+'/app/index.html', { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);
  await p.evaluate(() => go('clients'));
  await p.waitForTimeout(1800);

  console.log('\n[1] 고객 화면 — <b>사람 찾는 자리가 첫 화면 안</b>에 있다');
  const M = await p.evaluate(() => {
    const y = (sel) => { const e = document.querySelector(sel);
      return e ? Math.round(e.getBoundingClientRect().top + (document.getElementById('dynPane')||document.body).scrollTop) : -1; };
    return { bar: y('.osc-bar'), list: y('#oscList'), top: y('#cli365Top'),
             h: window.innerHeight,
             /* 아래 칸들이 <b>살아 있는가</b> — 순서만 바꾼 것이지 지운 것이 아니다 */
             미션: !!document.querySelector('#cli365Top') && /미션|30일/.test((document.getElementById('cli365Top')||{}).innerText||''),
             달력: /이번 달 고객 관리/.test((document.getElementById('dynPane')||{}).innerText||''),
             찾기칸: !!document.getElementById('oscSearch'),
             새고객: /\+ 새 고객/.test((document.getElementById('dynPane')||{}).innerText||'') };
  });
  is(M.bar >= 0 && M.bar < M.h,
     '  <b>찾기 칸</b>이 첫 화면 안에 있다 — ' + M.bar + 'px (한 판 ' + M.h + 'px)');
  is(M.list >= 0 && M.list < M.h,
     '  <b>고객 목록</b>이 첫 화면 안에 있다 — ' + M.list + 'px');
  is(M.list >= 0 && M.top >= 0 && M.list < M.top,
     '  목록이 <b>미션·달력보다 위</b>에 있다 — 목록 ' + M.list + 'px · 아래칸 ' + M.top + 'px');

  console.log('\n[2] <b>아무것도 안 없어졌다</b> — 순서만 바꾼 것이다 (1번)');
  is(M.미션,  '  <b>오늘의 미션</b>이 그대로 있다 (목록 아래)');
  is(M.달력,  '  <b>이번 달 고객 관리</b> 달력이 그대로 있다');
  is(M.찾기칸, '  <b>찾기 칸</b>이 그대로 있다');
  is(M.새고객, '  <b>+ 새 고객</b> 단추가 그대로 있다');

  console.log('\n[3] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' · ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 고객을 누르면 사람이 바로 보입니다. 미션·달력도 그대로 있습니다.');
  process.exit(bad ? 1 : 0);
})();
