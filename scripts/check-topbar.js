/* ══════════════════════════════════════════════════════════════════
   check-topbar.js — <b>컴퓨터에서 위 띠가 한 줄인가.</b>

   2026-09-26. 사장님 말씀 「목업하고 너무 다른데」. 컴퓨터로 나란히 놓고
   보니 목업은 <b>위 띠가 아예 없고</b> 왼쪽 기둥이 그 몫을 다 합니다.
   앱은 위에 두 줄이 있었습니다 — 로고·☰·날짜·음성비서 한 줄, 즐겨찾기
   한 줄. 기둥 맨 위에 메뉴가 서면서 첫 줄은 <b>같은 것을 두 번</b>
   말하게 됐습니다.

   ★ <b>지우지 않고 접습니다</b> (1번). 날짜와 음성 비서는 남은 줄로
     <b>옮겼고</b>, 폰에서는 기둥이 없으므로 <b>두 줄 그대로</b>입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 컴퓨터에서 위 띠가 <b>한 줄</b>이다
     [2] ★ <b>아무것도 안 없어졌다</b> — 날짜·음성비서·☰·즐겨찾기 (1번)
     [3] 폰에서는 <b>두 줄 그대로</b> — 기둥이 없으니
     [4] 날짜가 <b>한 곳에서</b> 온다 — 두 자리가 같다 (5번)
     [5] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9023;
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
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.list=[];
  CM.loaded=true; CM.meta={}; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};

/* 위 띠 안에서 <b>실제로 보이는 것</b>만 잽니다 */
const LOOK = () => {
  const bar = document.getElementById('topnav');
  if (!bar) return { 없음: true };
  const seen = el => !!(el && el.offsetParent !== null &&
                        el.getBoundingClientRect().height > 2);
  const r = bar.getBoundingClientRect();
  /* 줄 수 — 보이는 자식 칸의 <b>세로 가운데</b>가 몇 군데인가.
     ★ 윗변으로 세면 <b>나란히 선 둘</b>도 두 줄로 셉니다(높이가 조금만
       달라도 윗변이 갈립니다) — 그러면 헛것을 잡습니다 (8번).
       가운데가 8px 안쪽이면 <b>같은 줄</b>로 봅니다. */
  const mids = [];
  [].slice.call(bar.children).forEach(c => {
    if (!seen(c)) return;
    const r2 = c.getBoundingClientRect(), m = (r2.top + r2.bottom) / 2;
    if (!mids.some(x => Math.abs(x - m) < 8)) mids.push(m);
  });
  const tops = mids;
  /* ★ 날짜도 음성 비서도 <b>원래 그 하나뿐</b>입니다 — 짝퉁을 두면
     상태 색을 칠하는 곳이 한쪽만 칠합니다 (5번). 그래서 <b>하나인지</b>를
     함께 잽니다. */
  const day = [].slice.call(bar.querySelectorAll('.tn-d')).filter(seen)
                .map(e => e.textContent.trim());
  const va  = [].slice.call(bar.querySelectorAll('.tn-va')).filter(seen).length;
  const vaAll = bar.querySelectorAll('.tn-va').length;
  const dayAll = bar.querySelectorAll('.tn-d').length;
  const burger = [].slice.call(bar.querySelectorAll('button'))
                   .filter(e => seen(e) && /메뉴|☰/.test(e.textContent + (e.title||''))).length;
  const fav = seen(document.getElementById('tnFav'));
  const pane = document.getElementById('dynPane');
  return { 줄수: tops.length, 높이: Math.round(r.height),
           날짜: day, 음성: va, 있는음성: vaAll, 있는날짜: dayAll,
           메뉴단추: burger, 즐겨찾기: fav,
           본문y: pane ? Math.round(pane.getBoundingClientRect().top) : null };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];

  /* ── 컴퓨터 ─────────────────────────────── */
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);
  const PC = await p.evaluate(LOOK);

  console.log('\n[1] 컴퓨터에서 위 띠가 <b>한 줄</b>이다');
  is(!PC.없음, '  위 띠가 있다');
  is(PC.줄수 === 1, '  <b>한 줄</b>이다 — ' + PC.줄수 + '줄 · 높이 ' + PC.높이 + 'px');
  is(PC.높이 <= 60, '  높이가 <b>한 줄만큼</b>이다 — ' + PC.높이 + 'px (두 줄이면 80px 넘습니다)');

  console.log('\n[2] ★ <b>아무것도 안 없어졌다</b> (1번)');
  is(PC.날짜.length === 1 && !!PC.날짜[0],
     '  <b>날짜</b>가 한 자리에 보인다 — ' + (PC.날짜[0] || '(없음)'));
  is(PC.음성 === 1, '  <b>음성 비서</b>가 한 자리에 보인다 — ' + PC.음성 + '개');
  is(PC.메뉴단추 >= 1, '  <b>메뉴로 가는 단추</b>가 있다 — ' + PC.메뉴단추 + '개');
  is(PC.즐겨찾기, '  <b>즐겨찾기 띠</b>가 그대로 있다');
  is(PC.있는음성 === 1 && PC.있는날짜 === 1,
     '  ★ 음성 비서도 날짜도 <b>한 벌뿐</b>이다 (5번) — 음성 ' + PC.있는음성 +
     '개 · 날짜 ' + PC.있는날짜 + '개. 짝퉁을 두면 상태 색이 한쪽만 칠해집니다');

  console.log('\n[4] 날짜가 <b>한 곳에서</b> 온다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((SRC.match(/id="tnDay"/g) || []).length === 1,
     '  날짜 자리가 <b>소스에도 하나</b>다 — 두 벌이면 자정에 한쪽만 늙는다 (5번)');
  is((SRC.match(/id="tnVa"/g) || []).length === 1,
     '  음성 비서도 <b>소스에 하나</b>다 (5번)');
  await p.close();

  /* ── 폰 ─────────────────────────────────── */
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  q.on('pageerror', e => errs.push('' + (e && e.message)));
  await q.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await q.waitForTimeout(2400);
  await q.evaluate(SEED);
  await q.waitForTimeout(1400);
  const PH = await q.evaluate(LOOK);

  console.log('\n[3] 폰에서는 <b>두 줄 그대로</b> — 기둥이 없으니');
  is(PH.줄수 >= 2, '  폰에서는 <b>두 줄</b>이다 — ' + PH.줄수 + '줄');
  /* ⚠ 400px 아래에서는 앱이 <b>일부러</b> 날짜를 감춥니다 — 「좁으면 로고가
     먼저다」(.tn-d 의 @media). 그것을 모르고 「보여야 한다」 고 재면
     <b>헛것을 잡는 점검</b>이 됩니다 (8번). 규칙을 존중하고, 대신
     <b>날짜 자리가 둘로 늘지 않았는지</b>를 봅니다. */
  is(PH.날짜.length <= 1,
     '  폰에서 날짜가 <b>두 자리로 늘지 않았다</b> — ' +
     (PH.날짜.length ? PH.날짜[0] : '(좁아서 감춤 — 앱이 정한 규칙)'));
  is(PH.음성 === 1, '  폰에도 <b>음성 비서</b>가 한 자리 보인다 — ' + PH.음성 + '개');
  is(PH.메뉴단추 >= 1, '  폰에 <b>☰</b> 가 있다 — 기둥이 없으니 이게 유일한 길이다 (1번)');
  await q.close();

  console.log('\n[5] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 컴퓨터에서는 한 줄 · 폰에서는 두 줄, 그리고 아무것도 안 없어졌습니다.');
  process.exit(bad ? 1 : 0);
})();
