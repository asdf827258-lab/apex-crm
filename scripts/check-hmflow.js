/* ══════════════════════════════════════════════════════════════════
   check-hmflow.js — 📊 <b>홈 상담현황 한 줄</b>이 거짓말을 안 하나.

   ⚠ 이름에 <b>hm</b> 을 붙였습니다. 처음에 check-flow.js 로 만들었다가
     <b>이미 있던 점검(상담 흐름 — 상담자료에서 종합 재무설계까지)을
     덮어썼습니다.</b> CLAUDE.md 8번이 적어 둔 그 자리입니다 —
     「이미 있는 파일 이름을 확인하고 만든다」. check-cilist 가 잡았습니다.

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
const ROOT = process.cwd(), PORT = 9029;
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
  /* ⚠ 2026-10-02 · <b>「이번 달 계약 N건」 자리가 옮겨졌습니다.</b> 그 수는
     체결일만 보고 세어 <b>무산까지</b> 들어 있었습니다. 이제 업적 줄의
     「이번 달 N원(N건)」 이 그 수를 대신하고, 그 수는 <b>보류·무산을 뺀</b>
     수라 더 맞습니다 (5번). 업적 줄은 <b>check-pex</b> 가 깊이 봅니다.  */
  is(/이번 달 .*\(\d+건\)|이번 달 업적은|업적은 <b>아직 못 읽었습니다|아직 못 읽었/.test(A.t),
     '  <b>이번 달 업적</b>을 금액과 건수로 적거나, 못 읽었다고 적는다 — ' +
     (A.t.replace(/<[^>]*>/g, '').match(/이번 달 [^·]{0,24}/) || ['(없음)'])[0]);

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

  console.log('\n[4] ★★ <b>업적 금액을 적는다</b> (사장님 말씀 2026-10-02)');
  /* ⚠ ★★ <b>이 토막은 뒤집혔습니다.</b> 전에는 「금액을 안 적는다 · 못 읽는다고
     밝힌다」 를 보았습니다 — 그때는 본체가 업적 칸(expect_premium 등)을
     <b>받아 오지 않았기</b> 때문입니다. 사장님 말씀 <b>「예상업적을 셀 수
     있도록 스스로 매일 볼 수 있도록 해」</b> 로 이제 받아 와 셉니다. 그 말을
     그대로 두면 <b>화면이 거짓말</b>을 합니다.
     ★ <b>자를 없앤 것이 아닙니다</b> — 묻는 것을 바꿨습니다. 셋을 바꿔
       달았고(아래), 「<b>못 읽었으면 한 자도 안 적는가</b>」 는 그대로 봅니다.
     ★ 깊은 것(세 수가 맞나 · 단위가 원인가 · 모르는 건을 0 으로 안 적나)은
       <b>check-pex</b> 가 봅니다 (5번 — 한 자가 한 가지를 봅니다).        */
  const PX = await p.evaluate(() => {
    /* 업적 칸을 심습니다 — 지난달 1건 · 이번 달 1건 · 진행중 1건 */
    const 담 = (AR.db || []).map(r => Object.assign({}, r));
    const t = (typeof mstToday === 'function') ? mstToday() : '';
    const ym = t.slice(0, 7), y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    const pm = (m === 1) ? ((y - 1) + '-12') : (y + '-' + ('0' + (m - 1)).slice(-2));
    if (AR.db && AR.db.length >= 3) {
      AR.db[0].stage = '계약완료'; AR.db[0].closed = ''; AR.db[0].contract = 1500000;
      AR.db[0].expect = 1200000; AR.db[0].cAt = ym + '-05';
      AR.db[1].stage = '증권전달'; AR.db[1].closed = ''; AR.db[1].contract = 2500000;
      AR.db[1].expect = 2000000; AR.db[1].cAt = pm + '-08';
      AR.db[2].stage = 'AP'; AR.db[2].closed = ''; AR.db[2].contract = 0;
      AR.db[2].expect = 900000; AR.db[2].cAt = '';
    }
    AR.noPex = false;
    const h = hmFlowHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const o = (typeof pexSum === 'function') ? pexSum() : null;
    /* 칸을 못 읽은 서버 — 금액을 한 자도 안 적어야 합니다 */
    AR.noPex = true;
    const h2 = hmFlowHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    AR.noPex = false; AR.db = 담;
    return { h: h, o: o, h2: h2 };
  });
  is(!!PX.o && /이번 달 150만원/.test(PX.h),
     '  <b>이번 달 업적</b>을 금액으로 적는다 — ' + (PX.h.match(/이번 달 [^·]{0,16}/) || ['(없음)'])[0]);
  is(!!PX.o && /지난달 250만원/.test(PX.h),
     '  <b>지난달 업적</b>을 적는다 — ' + (PX.h.match(/지난달 [^·]{0,16}/) || ['(없음)'])[0]);
  is(!!PX.o && /진행중 예상 90만원/.test(PX.h),
     '  <b>진행중 예상업적</b>을 적는다 — ' + (PX.h.match(/진행중 예상 [^·.]{0,16}/) || ['(없음)'])[0]);
  is(!/DB·업적관리/.test(PX.h) && !/건수까지만/.test(PX.h),
     '  ★★ 「어디 있다 · 건수까지만」 이라는 <b>옛말이 없다</b> — 이제 거짓입니다');
  /* ★ <b>낫표 안은 약속이지 수가 아닙니다</b> — [3] 이 「0분」 에서 겪은 그
     자리입니다. 화면이 「<b>「0원」 이라고 적지 않습니다</b>」 라고 적어 두었는데
     그것을 세면 약속을 적었다고 빨간불이 켜집니다 (8번). 걷어내고 봅니다. */
  const 맨2 = PX.h2.replace(/「[^」]*」/g, ' ');
  is(!/[\d,]+\s*(원|만원|억)/.test(맨2) && /못 읽었/.test(PX.h2),
     '  ★★ 칸을 <b>못 읽은 서버</b>에서는 금액을 한 자도 안 적는다 (1번) — '
       + (PX.h2.match(/업적은[^.]{0,30}/) || ['(없음)'])[0]);

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

  /* ⚠ 2026-09-27 — 여기는 원래 <b>「공지가 홈에서 빠졌나」</b> 를 물었습니다.
     사장님 말씀 「공지사항 별도로 빼버려」 로 뺐다가 <b>도로 넣었습니다</b> —
     공지 사진(osNtcImgHtml)이 <b>홈 공지 자리에만</b> 있어서, 빼는 순간
     앱 어디에서도 공지 사진을 볼 수 없게 됐습니다. check-ntcimg 가 8가지로
     잡았습니다. 그것은 옮기는 것이 아니라 <b>지우는 것</b>입니다 (6번).
     ★ 자를 <b>지우지 않고 옮깁니다</b> — 이제 「공지를 홈에서 빼려면 그
       전에 사진 볼 자리가 있어야 한다」 를 잽니다. 공지가 제 화면을 갖는
       날 이 자가 그것을 지켜 줍니다.                                    */
  console.log('\n[7] ★ <b>공지를 홈에서 빼려면 사진 볼 자리가 먼저</b> (6번)');
  const G = await p.evaluate(() => ({
    홈: !!document.querySelector('#dynPane #osNoticeHome'),
    옮김: ((document.querySelector('#dynPane .hm-mv') || {}).innerText || '').replace(/\s+/g,' ')
  }));
  const NSRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  /* 사진 칸을 그리는 자리가 <b>몇 군데</b>인가 — 한 군데뿐이면 그 한 군데를
     빼는 순간 사진을 볼 곳이 없어집니다. */
  const 사진자리 = (NSRC.match(/osNtcImgHtml\(/g) || []).length - 1;   /* 선언 한 줄은 뺍니다 */
  is(G.홈 || 사진자리 > 0,
     '  ★ 공지 사진을 <b>볼 자리가 있다</b> — 홈 공지칸 ' + (G.홈 ? '있음' : '없음') +
     ' · 사진 칸을 그리는 곳 ' + 사진자리 + '군데' +
     (!G.홈 && 사진자리 === 0 ? ' ← 홈에서 뺐는데 사진 볼 곳이 한 군데도 없습니다' : ''));
  /* 홈에 있으면 「옮겼다」 고 적으면 <b>거짓말</b>입니다 (1번) */
  is(!(G.홈 && /공지/.test(G.옮김)),
     '  ★ 홈에 있는 것을 <b>「옮겼다」 고 안 적는다</b> (1번)' +
     (G.홈 && /공지/.test(G.옮김) ? ' ← 홈에 있는데 옮겼다고 적혀 있습니다' : ''));

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

  /* ══ [9] ★ <b>접었지 지운 것이 아니다</b> (6번) ═══════════════════
     사장님 말씀 (2026-09-27) — 「2번으로 해줘 <b>접어</b>」.
     상담현황을 넣자 홈이 3.8화면이 되어, 준비 SQL·동선·찾기·옮긴 자리·
     준법 안내를 「🧭 그 밖의 것」 한 줄로 접었습니다.
     ★ 접기는 <b>누르면 다 돌아와야</b> 접기입니다. 안 돌아오면 그것은
       지운 것이고, 지운 것을 「접었다」 고 적으면 거짓말입니다 (1번).  */
  console.log('\n[9] ★ <b>접었지 지운 것이 아니다</b> (6번)');
  const L = await p.evaluate(async () => {
    const q = s => document.querySelector('#dynPane ' + s);
    const 있나 = () => ({ sql:!!q('#osSetupHome'), rt:!!q('#hmRtHost'),
                          find:!!q('#cusFindBox'), mv:!!q('.hm-mv'), law:!!q('.notice') });
    const 높이 = () => { const e = q('#hmFold_etc');
                         return e ? Math.round(e.getBoundingClientRect().height) : 0; };
    try { hmFoldSet('etc', false); } catch (e) {}
    go('home'); await new Promise(r => setTimeout(r, 500));
    const 접힘 = { 것: 있나(), h: 높이(), 머리: (q('.hm-fold-h') || {}).textContent || '' };
    const b = q('#hmFold_etc .hm-fold-h');
    if (b) { b.click(); await new Promise(r => setTimeout(r, 500)); }
    return { 접힘: 접힘, 펴짐: { 것: 있나(), h: 높이() } };
  });
  const 접힌수 = Object.keys(L.접힘.것).filter(k => L.접힘.것[k]).length;
  const 펴진수 = Object.keys(L.펴짐.것).filter(k => L.펴짐.것[k]).length;
  is(L.접힘.h > 0 && L.접힘.h < 120,
     '  접으면 <b>한 줄</b>이다 — ' + L.접힘.h + 'px (덩어리가 되면 접은 것이 아닙니다)');
  is(펴진수 === 5,
     '  ★ 펴면 <b>다섯이 다 돌아온다</b> — ' + 펴진수 + '/5 (준비 SQL · 동선 · 찾기 · 옮긴 자리 · 준법 안내)' +
     (펴진수 < 5 ? ('\n      ✗ 없는 것 ' + Object.keys(L.펴짐.것).filter(k => !L.펴짐.것[k]).join(' ')) : ''));
  is(L.펴짐.h > L.접힘.h,
     '  펴면 <b>커진다</b> — ' + L.접힘.h + 'px → ' + L.펴짐.h + 'px');
  /* ★ 준비 SQL 이 아직 남았으면 <b>접힌 머리글이 그렇게 말해야</b> 합니다 —
     접어 두고 아무 말도 안 하면 대표가 평생 못 보십니다 (6번). */
  const 준비 = await p.evaluate(() => (typeof setupShow === 'function') ? !!setupShow() : false);
  is(!준비 || /서버 준비/.test(L.접힘.머리),
     '  ★ 준비가 남았으면 <b>접힌 머리글이 말한다</b> — 「' +
     L.접힘.머리.replace(/\s+/g,' ').trim().slice(0, 40) + '」');

  console.log('\n[10] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' · ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 상담현황은 한 곳에서 세고, 모르는 것은 모른다고 적습니다.');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
