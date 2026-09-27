/* ══════════════════════════════════════════════════════════════════
   check-cusglance.js — 🔎 <b>고객 한 장 「한눈에」</b> 가 거짓말을 안 하나.

   사장님 말씀 (2026-09-27 · 목각 사진 2) — 「이렇게 <b>깔끔하게</b>
   정리하게 하고, 전부 수정해」.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 칸이 서고 <b>목각의 넷</b>이 다 있나 — 큰 수 · 줄 · 8통장
         (★ 줄 수를 손으로 적지 않습니다 — <b>이름</b>으로 봅니다. 수를 적어 두면
          줄이 늘 때마다 자가 낡아 빨개집니다.)
     [2] <b>세는 곳이 하나</b>인가 (5번) — 보유 계약은 OSA.polCount,
         8통장 이름·등급은 cmWalOf·waShort. 여기서 또 세면 지도와 갈린다
     [3] <b>모르는 것은 안 세우나</b> (1번) — 못 읽었으면 0 이라 안 적고,
         아무것도 없으면 칸 자체를 안 세운다
     [4] ★ <b>만기·청구는 적힌 것만 서나</b> — 안 적으면 안 서고, 적으면 선다.
         ★ 「D-N」 은 안 쓰고 <b>날짜</b>로. ★ 무엇으로 받았는지는 한 장 카드에
         안 올린다(병력 · 3번). (2026-09-27 — 담는 자리가 생겨 이 자를 뒤집었습니다.
         앱에는 담는 자리가 없다(policies 에 만기일 칸이 없고 청구 표가
         아예 없다). 빈 칸을 그려 두면 적으신 것이 저장되지 않는다
     [5] <b>아래 칸들이 안 없어졌나</b> (6번) — 사람·가족·돈·계약·
         연락기록·문서
     [6] <b>새 CSS·새 class 를 안 만들었나</b> (사장님 계약)
     [7] <b>이름을 가리나</b> (3번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9030;
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

/* 견본 — 이름은 「홍길동」 (3번) */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.osLoadDocs=function(){}; window.osLoadAnalysis=function(){}; window.cusCrmLoad=function(){};
  window.frLoad=function(){}; window.osBindDrop=function(){};
  window.setupDone=function(){return true;}; window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[];
  OSC.list=[{id:'c1',name:'홍길동',name_masked:'홍○○',advisor_id:'me',stage:'AP',created_at:'2026-07-01'}];
  CM.loaded=true; CM.meta={ c1:(function(){ var m=cmBlank(); m._rid='r1'; return m; })() };
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  try{ osHideLoginGate(); }catch(e){}
  osOpenClient('c1');
};
/* 값을 심습니다 — 보유 계약 4건 · 월 31만원 · 강남구 · 보장분석10DB · 8통장 */
const FILL = () => {
  OSA.polCount = 4;
  CUS.db = { region:'강남구', source:'보장분석10DB', stage:'AP',
             policy_no:'P-1', contract_premium:310000, contracted_at:'2026-06-01', policy_sent_at:'' };
  cmOf('c1').touch = [{at:'2026-09-20',how:'만남',note:''},{at:'2026-09-10',how:'만남',note:''},
                      {at:'2026-09-01',how:'전화',note:''}];
  cmOf('c1').wal = { at:'2026-09-01', lv:{1:'ok',2:'low',3:'low',4:'mid',5:'ok',6:'',7:'low',8:''} };
  cusPaint();
};
const CARD = () => {
  const el = document.querySelector('#cusCard .t-card');
  if (!el) return { 없음:true };
  return { t: el.innerText.replace(/\s+/g,' ').trim(),
           큰수: [].slice.call(el.querySelectorAll('.t-num')).map(x => x.textContent.trim()),
           줄: [].slice.call(el.querySelectorAll('.t-row')).map(x => x.innerText.replace(/\s+/g,' ').trim()),
           칩: [].slice.call(el.querySelectorAll('.t-chip')).map(x => x.textContent.replace(/\s+/g,' ').trim()) };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof osOpenClient === 'function' && typeof cusPaint === 'function',
                          { timeout: 60000 });
  await p.evaluate(SEED); await p.waitForTimeout(1200);
  await p.evaluate(FILL);  await p.waitForTimeout(500);

  console.log('\n[1] 칸이 서고 <b>목각의 넷</b>이 다 있나');
  const A = await p.evaluate(CARD);
  is(!A.없음, '  🔎 <b>한눈에</b> 칸이 선다');
  is(A.큰수.length === 2 && /4건/.test(A.큰수[0]) && /31만원/.test(A.큰수[1]),
     '  <b>큰 수 둘</b> — ' + A.큰수.join(' · ') + ' (보유 계약 · 월 보험료)');
  /* ★ 처음에 「네 줄이 선다」 라고 <b>수를 손으로 적어</b> 뒀습니다. 2026-09-27
     에 청구 줄이 늘자 다섯이 되어 그 자가 <b>낡아 빨개졌습니다</b> — 코드는
     맞는데 자가 틀린 것입니다. check-cqa 에서 「열두 칸」 으로 같은 일을
     겪었습니다. 수를 세지 않고 <b>있어야 할 이름이 다 있나</b>를 봅니다 —
     줄이 늘어도 자가 안 낡습니다 (8번).                                  */
  const 있어야할줄 = ['사는 곳 강남구','어디서 왔나 보장분석10DB','지금 단계 AP',
                     '만난 횟수 2회','청구 아직'];
  is(A.줄.length >= 있어야할줄.length,
     '  줄이 <b>' + A.줄.length + '개</b> 선다 — 있어야 할 것 ' + 있어야할줄.length + '개');
  있어야할줄.forEach(w => {
    is(A.줄.some(r => r.replace(/\s+/g,' ') === w), '    ' + w);
  });
  is(A.칩.length === 8, '  8통장 칩이 <b>여덟</b>이다 — ' + A.칩.length + '개');
  is(/비어 있는 통장 <?b?>?3개|비어 있는 통장 3개/.test(A.t.replace(/<[^>]*>/g,'')),
     '  <b>비어 있는 통장</b>을 센다 — ' + (A.t.match(/비어 있는 통장 \d+개/) || ['(없음)'])[0]);

  console.log('\n[2] ★ <b>세는 곳이 하나</b>인가 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const CUSJ = fs.readFileSync(path.join(ROOT, 'app/apex-cusone.js'), 'utf8');
  is(/polN:\(typeof OSA[\s\S]{0,80}OSA\.polCount/.test(SRC),
     '  ★ 보유 계약은 <b>OSA.polCount</b> 를 그대로 쓴다 — 여기서 policies 를 또 안 읽는다');
  is(/wal:\(function\(\)\{[\s\S]{0,200}cmWalOf\(c\.id\)[\s\S]{0,200}waShort\(n\)/.test(SRC),
     '  ★ 8통장은 <b>cmWalOf · waShort</b> 를 그대로 쓴다 — 이름을 또 적으면 지도와 갈린다');
  /* ★ <b>주석은 코드가 아닙니다.</b> 「waShort 를 그대로 씁니다」 라고
     <b>적어 둔 것</b>까지 세면, 왜 그렇게 했는지 설명을 남길수록 빨간불이
     켜집니다 — 헛것을 잡는 자는 안 잡는 자보다 나쁩니다 (8번).
     check-onepal 이 APP_BUILD_NOTE 를 빼고 세는 것과 같은 까닭입니다. */
  const CUSJ_C = CUSJ.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  is(CUSJ_C.indexOf('waShort') < 0 && !/\{\s*1:\s*'생활'/.test(CUSJ_C),
     '  ★ 한 장 파일에 <b>통장 이름을 또 안 적었다</b> (주석은 빼고 셉니다)');
  /* 진짜 같은 답인가 — 화면과 표를 <b>맞대어</b> 봅니다 */
  const 맞대 = await p.evaluate(() => {
    const el = document.querySelector('#cusCard .t-card');
    const 칩 = [].slice.call(el.querySelectorAll('.t-chip')).map(x => x.textContent.trim());
    const out = [];
    for (let n = 1; n <= 8; n++) if (칩[n-1].indexOf(waShort(n)) !== 0) out.push(n + ' ' + waShort(n));
    return out;
  });
  is(맞대.length === 0, '  ★ 칩 이름이 <b>waShort 그대로</b>다' +
     (맞대.length ? (' ← 어긋남 ' + 맞대.join(' · ')) : ''));

  console.log('\n[3] ★ <b>모르는 것은 안 세운다</b> (1번)');
  const C = await p.evaluate(async () => {
    const 담D = CUS.db, 담P = OSA.polCount, 담W = cmOf('c1').wal;
    OSA.polCount = null; CUS.db = null; cmOf('c1').wal = null; cmOf('c1').touch = [];
    cusPaint(); await new Promise(r => setTimeout(r, 300));
    const el = document.querySelector('#cusCard .t-card');
    const out = { 칸: !!el, 글: el ? el.innerText.replace(/\s+/g,' ').trim() : '' };
    CUS.db = 담D; OSA.polCount = 담P; cmOf('c1').wal = 담W;
    cusPaint(); await new Promise(r => setTimeout(r, 300));
    return out;
  });
  is(!C.칸, '  ★ 아무것도 못 읽었으면 <b>칸을 안 세운다</b>' + (C.칸 ? (' ← 「' + C.글.slice(0,40) + '」') : ''));
  is(!/0건|0개|0회/.test(C.글), '  ★ <b>0 이라고 안 적는다</b> — 「계약이 없다」 는 뜻이 됩니다');

  console.log('\n[4] ★ <b>만기·청구는 적힌 것만 선다</b> (1번) — 2026-09-27 에 뒤집었습니다');
  const B = await p.evaluate(CARD);
  /* ★★ 2026-09-27 에 <b>이 두 줄을 뒤집었습니다.</b> 여태는 「만기·청구를
     아예 안 적는다」 를 지켰습니다 — 담는 자리가 없었으니 맞는 자였습니다.
     사장님이 「<b>만기! 청구 이력은 입력하게 만들고</b>」 라고 하셔서 자리를
     만들었으니, 이제 물어야 할 것은 「안 적느냐」 가 아니라
     <b>「적으면 서고, 안 적으면 안 서느냐」</b> 입니다.
     ★ 「D-N」 은 <b>여전히</b> 안 씁니다 (사장님 말씀) — 며칠 남았는지는
       보는 날마다 달라지므로 담는 것도 보여 주는 것도 <b>날짜</b>입니다.   */
  /* ★ 처음에 저는 「안 적으셨으면 <b>둘 다 안 선다</b>」 를 걸었는데, 돌려
     보니 청구가 「청구 — 아직」 으로 서 있었습니다. 코드를 보니 그것이
     <b>맞는 것</b>이었습니다: 이 카드의 줄들은 빈칸일 때 「아직」 이라고
     적습니다 — 빈칸으로 두면 <b>안 적은 것인지 없는 것인지</b> 알 수
     없기 때문입니다 (1번). <b>제 자가 틀렸습니다.</b>
     만기는 <b>큰 수</b> 자리라 「아직」 을 세울 자리가 없어 안 섭니다.     */
  is(/청구/.test(B.t) && /아직/.test(B.t),
     '  안 적으셨으면 청구는 <b>「아직」</b> 이라고 적는다 — 0 이나 빈칸으로 두지 않습니다 (1번)');
  is(!/만기/.test(B.t),
     '  안 적으셨으면 만기는 <b>안 선다</b> — 큰 수 자리에는 「아직」 을 세울 자리가 없습니다' +
     (/만기/.test(B.t) ? (' ← ' + (B.t.match(/만기[^·]{0,14}/) || [''])[0]) : ''));
  const DD = await p.evaluate(async () => {
    /* 적어 본다 — 만기는 <b>서버 칸</b>, 청구는 <b>이 기기 칸</b>.
       ★ cmSave 는 로그인 정보가 없으면 <b>조용히 돌아갑니다</b>. 이 자의
         견본에는 그것이 없어서 처음엔 값이 안 담겼습니다. 여기서 볼 것은
         <b>그려지는가</b> 이므로 화면이 읽는 자리에 바로 담습니다 —
         「적은 것이 서버로 가는가」 는 check-cqa 가 봅니다 (5번·8번).     */
    cmOf('c1').due = '2031-05-20';
    cmClmSet('c1', [{ at: '2026-03-11', won: '320000', what: '입원' },
                    { at: '2026-07-02', won: '80000',  what: '통원' }]);
    await new Promise(r => setTimeout(r, 300));
    osOpenClient('c1');
    await new Promise(r => setTimeout(r, 900));
    const el = document.getElementById('cusCard');
    return (el ? el.innerText : '').replace(/\s+/g, ' ');
  });
  is(/만기/.test(DD) && /2031/.test(DD),
     '  ★ 만기를 적으면 <b>큰 수로 선다</b> — ' + ((DD.match(/2031[^ ]*\s*만기/) || DD.match(/만기[^·]{0,12}/) || [''])[0]));
  is(/청구/.test(DD) && /2건/.test(DD),
     '  ★ 청구를 적으면 <b>몇 건인지 선다</b> — ' + ((DD.match(/청구[^·]{0,24}/) || [''])[0]));
  /* ★ 처음에 「|| /원/」 을 붙여 두었는데, 화면에 「원」 은 어디에나 있으니
     그 자는 거의 언제나 초록입니다 — 알람이 아닙니다 (8번). 320,000 +
     80,000 = 400,000원 이고, 이 앱은 <b>반올림하지 않고</b> 「40만원」 으로
     적습니다(cusWonR). 그 값을 그대로 요구합니다.                        */
  is(/40만원/.test(DD),
     '  받은 돈 합계가 <b>40만원</b> 으로 선다 (4번 · 반올림 없음) — ' +
     ((DD.match(/청구[^가-힣]*[^ ]* ?[^ ]*/) || [''])[0]));
  is(!/D-\d/.test(DD),
     '  ★ <b>「D-N」 은 안 쓴다</b> (사장님 말씀) — 날짜로 적습니다');
  is(!/입원|통원|수술/.test(DD),
     '  ★ <b>무엇으로 받았는지는 한 장 카드에 안 올린다</b> — 병력입니다 (3번)');
  /* ★★ 위 줄은 <b>화면 글자</b>만 봅니다. 되돌려 보니 넘기는 값에 병력을
     실어도 <b>안 울렸습니다</b> — 화면에 안 그리면 글자로는 안 보이니까요.
     그런데 이 값은 한 장 카드를 넘어 <b>딴 데로도</b> 갑니다. 그러니
     <b>넘기는 값 자체</b>를 봐야 합니다 (8번).                            */
  const PAY = await p.evaluate(() => {
    const c = ((typeof OSC !== 'undefined' && OSC.list) || []).filter(x => x.id === 'c1')[0] || { id: 'c1' };
    try { return JSON.stringify(cusAppView(c)); } catch (e) { return 'ERR:' + (e && e.message); }
  });
  is(PAY.indexOf('ERR:') !== 0, '  넘기는 값을 읽었다 (' + PAY.length + '자)');
  is(!/입원|통원|수술|진단|처방/.test(PAY),
     '  ★★ <b>넘기는 값 자체에 병력이 없다</b> — 몇 건·합계만 넘깁니다 (3번)' +
     (/입원|통원|수술|진단|처방/.test(PAY) ? ('\n      ✗ ' + (PAY.match(/.{0,30}(입원|통원|수술|진단|처방).{0,20}/) || [''])[0]) : ''));
  /* 같은 까닭 — 「목각에는 D-30 이 있지만 우리는 안 씁니다」 라고 적어 둔
     주석까지 세면, 왜 안 쓰는지 설명한 것이 빨간불이 됩니다 (8번). */
  is(!/D-\d/.test(CUSJ_C), '  ★ 「<b>D-30</b>」 이라고 <b>화면에</b> 안 쓴다 (사장님 말씀)');

  console.log('\n[5] ★ <b>아래 칸들이 안 없어졌다</b> (6번)');
  const D = await p.evaluate(() => (document.getElementById('cusCard') || {}).innerText || '');
  ['사람','가족','돈','계약','연락기록','문서'].forEach(k =>
    is(D.indexOf(k) >= 0, '  <b>' + k + '</b> 칸이 그대로 있다'));

  console.log('\n[6] ★ <b>새 CSS·새 class 를 안 만들었다</b> (사장님 계약)');
  const i0 = CUSJ.indexOf('function cusGlanceHtml'), i1 = CUSJ.indexOf('function cusCardHtml');
  const BLK = (i0 >= 0 && i1 > i0) ? CUSJ.slice(i0, i1) : '';
  is(BLK.length > 800, '  한눈에 묶음을 찾았다 — ' + BLK.length + '자');
  is(!/#[0-9a-fA-F]{6}\b/.test(BLK), '  ★ <b>hex 를 한 자도 안 적었다</b>');
  is(!/style="[^"]*color:/.test(BLK), '  ★ <b>style 로 색을 안 칠했다</b>');
  const UI = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
  /* ★ ui.css 는 <b>자손 이름</b>도 씁니다 — .t-row .m · .t-row .r ·
     .t-one .why 처럼. 그것까지 「새 이름」 으로 세면 있는 것을 써도
     빨간불입니다. <b>ui.css 에 정말 적혀 있는지</b> 찾아보고 없는 것만
     잡습니다 (8번). check-hmflow 에서도 g·sm 으로 같은 일이 있었습니다. */
  const 새것 = (BLK.match(/class="([^"]+)"/g) || []).join(' ').replace(/class="|"/g,' ')
    .split(/\s+/).filter(Boolean).filter(c => c.indexOf('t-') !== 0)
    .filter(c => UI.indexOf('.' + c) < 0);
  is(새것.length === 0, '  ★ <b>ui.css 이름만 썼다</b>' +
     (새것.length ? (' ← ' + [...new Set(새것)].join(' ')) : ''));
  const 없는 = [...new Set((BLK.match(/class="(t-[^"]+)"/g) || []).join(' ')
    .replace(/class="|"/g,' ').split(/\s+/).filter(c => c.indexOf('t-') === 0))]
    .filter(c => UI.indexOf('.' + c) < 0);
  is(없는.length === 0, '  ★ 쓴 이름이 <b>ui.css 에 정말 있다</b>' +
     (없는.length ? (' ← 없는 이름 ' + 없는.join(' ')) : ''));

  console.log('\n[7] ★ <b>이름을 가린다</b> (3번) · 조용히 안 터진다');
  const N = await p.evaluate(() => (document.getElementById('cusCard') || {}).innerText || '');
  is(N.indexOf('홍길동') < 0 || /홍[○*]/.test(N),
     '  실명이 <b>그대로 안 찍힌다</b> — 이 기기에 실명을 안 담았으면 가린 이름입니다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' · ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '✓ 한눈에 칸은 있는 것만 적고, 없는 것은 안 세웁니다.');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
