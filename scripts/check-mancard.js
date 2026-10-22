/* ══════════════════════════════════════════════════════════════════
   check-mancard.js — 📘 <b>사용가이드의 주제가 칸으로 서나</b> (판 X159)

   사장님 말씀 (2026-10-22) — 「핸드폰으로 보니 한눈에 안들어와 … <b>토스
   어플처럼 칸을 활용</b>해보자」. 홈을 고친 뒤(판 X158) 남은 자리입니다.

   ── 재어 본 것 (폰 390×844 · 사용가이드) ──────────────────────────
     손대기 전 : <b>5,107px · 6.1화면</b> · 주제 줄 스물이 <b>13.5px 글씨의
                 똑같은 회색 줄</b>로 920px 이어졌습니다. 어디에 무엇이 있는지
                 줄을 하나씩 <b>읽어야</b> 알았습니다. 게다가 화면 머리글에
                 주제 열둘이 <b>손으로 베껴</b> 적혀 있어, 토막을 하나 더
                 만들면 그 줄만 조용히 낡았습니다 (5번).
     고친 뒤   : 접힌 주제가 <b>두 칸씩 격자</b>로 서고 제목이 <b>15px</b>,
                 편 것은 <b>한 줄을 통째로</b> 씁니다. 머리글의 베낀 나열은
                 걷었습니다 — 목록의 임자는 manSecs() 하나입니다.

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>다시 줄로 풀리는 것.</b> 격자가 아니면 옛 화면입니다.
   ⓑ <b>글이 사라지는 것.</b> 제목의 꼬리말(「 — …」)은 접힌 칸에서 <b>숨긴</b>
      것이지 버린 것이 아닙니다 — 글에는 그대로 있어야 합니다 (6번).
   ⓒ <b>단추가 바뀌는 것.</b> check-guide · check-guidemap 이 이 칸을
      <b>onclick=manToggle</b> 로 찾습니다. 바뀌면 그 둘이 눈을 잃습니다.
   ⓓ <b>손가락보다 작아지는 것</b> — 44px.
   ⓔ <b>나열이 되살아나는 것.</b> 화면 머리글에 주제 이름을 다시 적으면
      목록이 두 벌이 됩니다 (5번).
   ⓕ <b>길어지는 것.</b> 접힌 채의 길이에 바닥을 둡니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8909;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ★ <b>바닥</b> — 이 자가 제 씨로 잰 수입니다. 늘면 빨간불, 줄이면 같이 내립니다 (0-1번) */
/* ⚠ 수는 <b>이 자가 제 씨로 잰 것</b>입니다 — 어림으로 적었다가 한 번
   어긋났습니다(700 이라 적었는데 723 이었습니다). 바닥은 짐작이 아니라
   <b>지금 잰 수</b>입니다 (0-1번·8번). 손대기 전은 920px 였습니다.   */
const BASE = { 접힌높이: 723, 제목px: 15 };

const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){};
 window.setupDone=function(){return true;};window.setupShow=function(){return false;};
 window.osTabAllowed=function(){return true;};window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.picked=true;
 AR.loaded=true;AR.cliRows=[];AR.calls=[];AR.rep={};AR.db=[];
 OSC.loaded=true;OSC.list=[];CHKS.busy=false;CHKS.rows=[];CHKS.by={};CHKS.fin={};
 HWHO.id='';go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED); await p.waitForTimeout(1600);
  await p.evaluate(() => go('manual')); await p.waitForTimeout(1600);

  console.log('[1] 🧱 <b>주제가 칸 격자</b>로 선다 — 접힌 채로');
  const G = await p.evaluate(async () => {
    /* 다 접은 채로 잽니다 — 하나가 펴져 있으면 길이가 그 토막만큼 늘어나
       「접힌 채의 길이」 를 못 잽니다 (8번). */
    MAN.open = '';
    const host = document.getElementById('manBody');
    if (host) host.innerHTML = manBody();
    await new Promise(r => setTimeout(r, 400));
    const g = document.querySelector('.man-secs');
    if (!g) return { 없음: true };
    const 칸 = [].slice.call(g.children);
    const t0 = 칸.length ? 칸[0].querySelector('.t') : null;
    return {
      격자: getComputedStyle(g).display,
      열수: (getComputedStyle(g).gridTemplateColumns || '').split(/\s+/).filter(Boolean).length,
      칸수: 칸.length,
      높이: Math.round(g.getBoundingClientRect().height),
      작은칸: 칸.filter(x => x.getBoundingClientRect().height < 44).length,
      제목px: t0 ? Math.round(parseFloat(getComputedStyle(t0).fontSize)) : 0,
      토막수: (typeof manSecs === 'function') ? manSecs().length : 0
    };
  });
  is(!G.없음, '주제 칸 묶음(.man-secs)이 선다');
  is(G.격자 === 'grid', '  ★★ 줄이 아니라 <b>격자</b>다 — display 「' + G.격자 + '」');
  is(G.열수 === 2, '  ★ 폰에서 <b>두 칸씩</b> 선다 — ' + G.열수 + '열');
  is(G.칸수 > 0 && G.칸수 === G.토막수,
     '  칸 수가 <b>토막 수와 같다</b> — 칸 ' + G.칸수 + ' · 토막 ' + G.토막수 + ' (목록의 임자는 manSecs 하나 · 5번)');
  is(G.제목px >= BASE.제목px, '  ★ 제목이 <b>' + G.제목px + 'px</b> 이다 — 바닥 ' + BASE.제목px);
  is(G.작은칸 === 0, '  ★ 칸이 <b>44px 이상</b>이다 — 작은 칸 ' + G.작은칸 + '개');
  is(G.높이 <= BASE.접힌높이,
     '  ★ 접힌 채의 길이 <b>' + G.높이 + 'px</b> — 바닥 ' + BASE.접힌높이 + 'px (손대기 전 920px 였습니다)');

  console.log('\n[2] 🔛 <b>누르면 그 자리에서 한 줄 통째로</b> 펴진다');
  const O = await p.evaluate(async () => {
    manToggle('map');
    await new Promise(r => setTimeout(r, 500));
    const el = document.querySelector('.man-sec.on');
    const b = document.getElementById('manBody');
    return {
      편칸: !!el,
      통째: el ? getComputedStyle(el).gridColumn : '',
      속: el ? (el.innerText || '').replace(/\s+/g, ' ') : '',
      꼬리: b ? (b.textContent || '').replace(/\s+/g, ' ').indexOf('메뉴 지도 — 어디에 있고') >= 0 : false,
      단추: b ? b.querySelectorAll('button[onclick^="manToggle"]').length : 0
    };
  });
  is(O.편칸, '  편 칸이 선다 (.man-sec.on)');
  is(/1 \/ -1|1 \/ 3/.test(O.통째), '  ★★ 편 칸은 <b>한 줄을 통째로</b> 쓴다 — grid-column 「' + O.통째 + '」');
  is(/메뉴는 두 자리에 있습니다|맨 위 띠/.test(O.속), '  그 속이 정말 열린다 — 「' + O.속.slice(0, 26) + '…」');
  is(O.꼬리, '  ★★ 제목의 <b>꼬리말이 글에 그대로</b> 있다 — 접힌 칸에서 숨긴 것이지 버린 것이 아닙니다 (6번)');
  is(O.단추 > 0, '  ★ 칸의 단추가 <b>onclick=manToggle</b> 이다 — check-guide · check-guidemap 이 이것으로 찾습니다 (' + O.단추 + '개)');

  console.log('\n[3] 📝 <b>나열이 되살아나지 않았다</b> (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const i = SRC.indexOf('function renderManual(');
  const blk = i < 0 ? '' : SRC.slice(i, i + 900).replace(/\/\*[\s\S]*?\*\//g, '');
  /* 토막 제목의 앞머리가 화면 머리글에 <b>손으로</b> 적혀 있으면 두 벌입니다 */
  const 겹침 = await p.evaluate((b) => {
    const names = manSecs().map(s => String(s.title).split(' — ')[0].split(' (')[0]);
    return names.filter(n => n.length >= 4 && b.indexOf(n) >= 0);
  }, blk);
  is(겹침.length === 0,
     '  화면 머리글에 <b>토막 이름을 베껴 적지 않았다</b>' + (겹침.length ? (' ← ' + 겹침.slice(0, 5).join(' · ')) : ''));
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' ← ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 사용가이드 칸 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 사용가이드의 주제 ' + G.칸수 + '개가 두 칸씩 격자로 섭니다 — 접힌 채 ' + G.높이 + 'px.');
})();
