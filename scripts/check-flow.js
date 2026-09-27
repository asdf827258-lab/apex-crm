/* ══════════════════════════════════════════════════════════════════
   check-flow.js — 📊 <b>상담현황 한 줄</b>이 거짓말을 안 하나.

   사장님 말씀 (2026-09-27 · 목각 사진) — 홈 맨 위에 「TA → AP → PC →
   CS → 증권전달」. 「단계·주기·업적이 <b>세 곳에 흩어져</b> 있던 것을
   한 줄로 모았습니다」.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 칸이 <b>홈에</b> 서고 다섯 단계가 다 있나
     [2] <b>세는 곳이 하나</b>인가 (5번) — arStageN 이 답하고, AI 에게
         넘기는 글(arStageText)도 그것을 부르나. 두 곳에서 각자 세면
         화면과 AI 가 다른 수를 말한다
     [3] <b>못 읽었으면 수를 안 적나</b> (1번) — 「0분」 은 「아무도
         없다」 는 뜻이라, 배정 DB 가 늦게 오는 아침마다 거짓말이 된다
     [4] <b>예상업적 금액을 안 적나</b> (1번) — 그 값은 edu-pipeline 이
         들고 있고 본체는 못 읽는다. 못 읽는 것을 채우지 않는다
     [5] <b>이름을 가리나</b> (3번) — 홈은 고객 앞에서 여는 화면이다
     [6] <b>막힌 데</b>가 이레를 넘을 때만 서나 (8번 · 날마다 뜨는
         경고는 아무도 안 본다)
     [7] <b>공지가 홈에서 빠지고</b> 어디로 갔는지 적혀 있나 (6번)
     [8] <b>새 CSS·새 class 를 안 만들었나</b> (사장님 계약)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9028;
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

/* 견본 — 이름은 「홍길동」 (3번). 단계마다 사람을 심어 수를 확인합니다. */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  const me = (typeof arMyId==='function') ? arMyId() : 'me';
  /* TA 1 · AP 2 · PC 1 · CS 2 · 증권전달 1 = 길 위 7분 (목각과 같은 수).
     PC 의 한 분은 <b>9일째</b> — 막힌 데가 그분을 집어야 합니다.        */
  const row = (id, stage, days, nm, cAt) => ({ id:id, who:me, name:nm, region:'강남구',
    src:'보장분석10DB', stage:stage, cAt:cAt||'', pAt:'', got:ago(60), n:1,
    last:ago(days), res:'상담', appt:'', memo:'', days:days });
  const thisMonth = new Date().toISOString().slice(0,7) + '-01';
  AR.db=[ row('d1','TA',2,'홍길동A'), row('d2','AP',1,'홍길동B'), row('d3','AP',3,'홍길동C'),
          row('d4','PC',9,'홍길동D'), row('d5','CS',2,'홍길동E'), row('d6','CS',4,'홍길동F'),
          row('d7','증권전달',5,'홍길동G'),
          row('d8','계약완료',6,'홍길동H', thisMonth),
          row('d9','미접촉',30,'홍길동I') ];
  try{ osHideLoginGate(); }catch(e){}
};

const CARD = () => {
  const el = document.querySelector('#dynPane #hmFlow');
  if (!el) return { 없음:true };
  return { t: el.innerText.replace(/\s+/g,' ').trim(),
           칩: [].slice.call(el.querySelectorAll('.t-chip')).map(x => x.textContent.replace(/\s+/g,' ').trim()),
           단추: [].slice.call(el.querySelectorAll('.t-btn')).map(x => x.textContent.trim()),
           h: Math.round(el.getBoundingClientRect().height) };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.evaluate(() => { go('home'); });
  await p.waitForTimeout(900);

  console.log('\n[1] 칸이 <b>홈에</b> 서고 다섯 단계가 다 있나');
  const A = await p.evaluate(CARD);
  is(!A.없음, '  📊 <b>상담현황</b> 칸이 홈에 <b>선다</b> — ' + (A.없음 ? '없습니다' : (A.h + 'px')));
  /* ★ 단계 이름을 여기 <b>글자로 안 박습니다</b> — 박으면 표를 고쳐도 이
     줄이 낡아 새 단계를 <b>재지 않고</b> 초록불을 켭니다 (8번). */
  const 표 = await p.evaluate(() => HM_FLOW.map(x => x.k));
  is(표.length === 5 && 표.every(k => (A0 => A0)(true)),
     '  단계 표가 <b>다섯</b>이다 — ' + 표.join(' → '));
  const 빠진 = 표.filter(k => !A.칩.some(c => c.indexOf(k) >= 0));
  is(빠진.length === 0, '  칩이 <b>표를 그대로</b> 세운다' + (빠진.length ? (' ← 빠짐 ' + 빠진.join(' ')) : ''));
  /* 목각과 같은 수인가 — 견본은 TA1 · AP2 · PC1 · CS2 · 증권전달1 */
  const 수 = A.칩.map(c => (c.match(/^\d+/) || [''])[0]).join(',');
  is(수 === '1,2,1,2,1', '  <b>단계마다 제 수</b>를 적는다 — ' + 수 + ' (견본 1,2,1,2,1)');
  is(/모두 <?b?>?7분|모두 7분/.test(A.t.replace(/<[^>]*>/g,'')),
     '  <b>길 위에 모두 몇 분</b>인지 적는다 — ' + (A.t.match(/모두 \d+분/) || ['(없음)'])[0]);
  is(/이번 달 계약 1건/.test(A.t), '  <b>이번 달 계약</b>을 센다 — ' +
     (A.t.match(/이번 달 계약 \d+건/) || ['(없음)'])[0]);

  console.log('\n[2] ★ <b>세는 곳이 하나</b>인가 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((SRC.match(/function arStageN\(/g) || []).length === 1, '  세는 함수가 <b>한 벌</b>이다 — arStageN');
  is(/function arStageText\(who\)\{[\s\S]{0,120}arStageN\(who\)/.test(SRC),
     '  ★ AI 에게 넘기는 글도 <b>arStageN 을 부른다</b> — 두 곳에서 각자 세지 않는다');
  is(/function hmFlowHtml\(\)\{[\s\S]{0,200}arStageN\(/.test(SRC),
     '  ★ 홈 칸도 <b>arStageN 을 부른다</b>');
  /* 진짜 같은 답인가 — 글과 화면의 수를 <b>맞대어</b> 봅니다 */
  const 맞대 = await p.evaluate(() => {
    const me = (typeof arMyId==='function') ? arMyId() : 'me';
    const N = arStageN(me), t = arStageText(me);
    const out = [];
    HM_FLOW.forEach(x => { const n = N.c[x.k] || 0;
      if (n && t.indexOf(x.k + ' ' + n + '건') < 0) out.push(x.k + ' 화면 ' + n); });
    return out;
  });
  is(맞대.length === 0, '  ★ <b>화면과 AI 가 같은 수</b>를 말한다' +
     (맞대.length ? (' ← 갈림 ' + 맞대.join(' · ')) : ''));

  console.log('\n[3] ★ <b>못 읽었으면 수를 안 적는다</b> (1번)');
  const C = await p.evaluate(async () => {
    const 담 = AR.db; AR.db = null;
    const h = hmFlowHtml(), n = arStageN('me');
    AR.db = 담;
    return { 셈: n, 글: h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim() };
  });
  is(C.셈 === null, '  못 읽었으면 <b>셈이 null</b> 이다 — 0 이 아니다');
  is(/아직 못 읽었/.test(C.글), '  <b>「아직 못 읽었습니다」</b> 라고 적는다 — ' + C.글.slice(0, 44));
  /* ★ <b>낫표 안의 「0분」 은 약속이지 수가 아닙니다.</b> 화면이 스스로
     「「0분」 이라고 적지 않습니다」 라고 적어 두었는데 그것을 세면, 약속을
     적었다고 빨간불이 켜집니다 — 헛것을 잡는 자는 안 잡는 자보다 나쁩니다 (8번). */
  const 맨글 = C.글.replace(/「[^」]*」/g, ' ');
  is(!/\d+분|\d+건/.test(맨글), '  ★ <b>수를 한 자도 안 적는다</b> — 「아무도 없다」 는 뜻이 됩니다' +
     (/\d+분|\d+건/.test(맨글) ? (' ← ' + (맨글.match(/\d+[분건]/g) || []).join(' ')) : ''));

  console.log('\n[4] ★ <b>예상업적 금액을 안 적는다</b> (1번)');
  is(/DB·업적관리/.test(A.t), '  금액이 <b>어디 있는지</b>는 말한다 — DB·업적관리');
  is(/못 읽어/.test(A.t) && /건수까지만/.test(A.t),
     '  ★ <b>못 읽는다고 밝힌다</b> — 「본체가 못 읽어 건수까지만 셉니다」');
  const 돈 = (A.t.match(/[\d,]+\s*(원|만원|억)/g) || []);
  is(돈.length === 0, '  ★ <b>돈 액수를 한 자도 안 적는다</b>' + (돈.length ? (' ← ' + 돈.join(' · ')) : ''));

  console.log('\n[5] ★ <b>이름을 가린다</b> (3번) · 막힌 데');
  is(/막힌 데/.test(A.t), '  <b>막힌 데</b>가 선다 — ' + (A.t.match(/막힌 데[^·]{0,44}/) || ['(없음)'])[0]);
  is(/9일째/.test(A.t), '  <b>가장 오래</b> 서 계신 분을 집는다 — 9일째 (견본에서 제일 오래된 PC)');
  /* 가리는 <b>모양</b>은 앱이 정합니다(cusMask) — 여기서 ○ 인지 * 인지를
     박아 두면, 마스킹을 고칠 때 이 자가 낡아 거짓 빨간불을 켭니다 (8번).
     이 자가 묻는 것은 하나입니다 — <b>실명이 그대로 찍혔나.</b>          */
  const 실명 = A.t.indexOf('홍길동D') >= 0;
  const 가림 = /[○*]/.test((A.t.match(/막힌 데[^·]{0,30}/) || [''])[0]);
  is(!실명 && 가림,
     '  ★ 이름을 <b>가린다</b> — 홈은 고객 앞에서 여는 화면입니다' +
     (실명 ? ' ← 실명이 그대로 찍혔습니다' : (가림 ? '' : ' ← 가린 자국이 없습니다')));

  console.log('\n[6] ★ <b>막힌 데는 이레를 넘을 때만</b> (8번)');
  const F = await p.evaluate(() => {
    const 담 = AR.db.map(r => r.days);
    AR.db.forEach(r => { r.days = 2; });          /* 다 이틀째로 */
    const h = hmFlowHtml();
    AR.db.forEach((r, i) => { r.days = 담[i]; });
    return h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  });
  is(F.indexOf('막힌 데') < 0,
     '  ★ 다 이틀째면 <b>줄을 안 그린다</b> — 날마다 뜨는 경고는 아무도 안 봅니다');
  const MIN = await p.evaluate(() => HM_FLOW_STUCK);
  is(MIN === 7, '  기준이 <b>이레</b>다 — ' + MIN + '일');

  console.log('\n[7] ★ <b>공지가 홈에서 빠지고</b> 어디로 갔는지 적혀 있나 (6번)');
  const G = await p.evaluate(() => ({
    홈: !!document.querySelector('#dynPane #osNoticeHome'),
    옮김: ((document.querySelector('#dynPane .hm-mv') || {}).innerText || '').replace(/\s+/g,' '),
    함수: (typeof osNoticeHomeHtml === 'function')
  }));
  is(!G.홈, '  공지 칸이 <b>홈에서 빠졌다</b>' + (G.홈 ? ' ← 아직 있습니다' : ''));
  is(/공지/.test(G.옮김), '  ★ <b>어디로 갔는지 적혀 있다</b> — ' + G.옮김.slice(0, 60));
  is(G.함수, '  ★ <b>함수는 안 지웠다</b> — 서랍이 같은 것을 부릅니다 (5번)');

  console.log('\n[8] ★ <b>새 CSS·새 class 를 안 만들었다</b> (사장님 계약)');
  const i0 = SRC.indexOf('var HM_FLOW='), i1 = SRC.indexOf('function hmTossHtml(){');
  const BLK = (i0 >= 0 && i1 > i0) ? SRC.slice(i0, i1) : '';
  is(BLK.length > 1200, '  상담현황 묶음을 찾았다 — ' + BLK.length + '자');
  is(!/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b/.test(BLK), '  ★ <b>hex 를 한 자도 안 적었다</b>');
  is(!/style="[^"]*color:/.test(BLK), '  ★ <b>style 로 색을 안 칠했다</b>');
  /* ui.css 는 <b>t-btn.g · t-btn.sm · t-chip.on</b> 처럼 <b>변형</b>을
     짧은 이름으로 답니다. 그것까지 「새 이름」 으로 세면 있는 것을 써도
     빨간불입니다 — 실제로 그랬습니다 (8번). ui.css 에 그 변형이 <b>정말
     적혀 있는지</b> 파일에서 찾아 봅니다. 없는 이름만 잡습니다. */
  const UI = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
  const 새클래스 = (BLK.match(/class="([^"]+)"/g) || []).join(' ')
    .replace(/class="|"/g,' ').split(/\s+/).filter(Boolean)
    .filter(c => c.indexOf('t-') !== 0)
    .filter(c => UI.indexOf('.t-btn.' + c) < 0 && UI.indexOf('.t-chip.' + c) < 0 &&
                 UI.indexOf('.t-note.' + c) < 0 && UI.indexOf('.t-tag.' + c) < 0);
  is(새클래스.length === 0, '  ★ <b>ui.css 이름만 썼다</b>' +
     (새클래스.length ? (' ← 새 이름 ' + [...new Set(새클래스)].join(' ')) : ''));

  console.log('\n[9] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' · ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 상담현황은 한 곳에서 세고, 모르는 것은 모른다고 적습니다.');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
