/* ══════════════════════════════════════════════════════════════════
   check-hmpoint.js — 🚗 <b>동선 추천 · 활동 독려 · 🎯 접촉포인트</b> (판 X97)

   사장님 말씀 (2026-10-13) — 「지역 동선 추천 · <b>활동량을 독려하는 멘트</b>와
   접촉 노하우도 오늘에다 써주면 어떨까. 그리고 개별로, 팀원들 고객 대상과
   <b>나이에 맞게 접촉포인트</b> / 총 2줄로 깔끔하게」.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] 🚗 묶이는 동네가 <b>진짜 수</b>로 서나 — 지역이 안 적힌 분·남의 분은
         안 세나. 묶일 것이 없으면 <b>여태 문장이 그대로</b> 서나(덧붙이는
         꼴로 만들었다가 홈이 22px 늘어 선을 넘었습니다).
     [2] 🤝 독려는 <b>셈으로만</b> 하나 — 「오후에 잘 받힙니다」 같은 말은
         우리가 재어 본 자료가 없어 적지 않습니다 (1번). 칩이고, 수는
         hmActOf 한 곳에서 옵니다 (5번). 못 읽었으면 <b>안 섭니다</b>.
     [3] 🎯 접촉포인트는 <b>아는 만큼만</b> — 나이를 아는 분만 세고 모르는
         분 수를 밝히나. 생년이 하나도 없으면 「없어서 안 고릅니다」 라고
         적고 <b>적는 자리</b>를 알려 주나 (1번·6번).
     [4] 말(접촉포인트 한 토막)이 <b>apex-stage.js 한 곳</b>에서 오나 —
         본체에 옮겨 적으면 두 벌이 됩니다 (5번).
     [5] 고객 <b>이름을 한 자도</b> 안 적나 (3번).
     [6] ★★ <b>내 글이 몇 px 먹나</b> — 홈은 4.18화면이고 사장님 선이
         4.2(844×4.2 = 3,544px)라 남은 자리가 <b>18px</b>뿐입니다.
         ⚠ <b>총 높이는 이 자가 재지 않습니다</b> — 그 주인은 check-homeone
         입니다(한 물음에 한 답 · 0-1번). 그 자의 씨에는 생년도 없고 오늘
         약속도 없어 <b>이 세 글이 아예 안 그려집니다</b>. 그래서 여기서
         <b>토막마다 넣었을 때와 뺐을 때의 차</b>를 재고, 그 합이 18px 안인지
         봅니다. 판 X90 에서 「자가 못 재는 상태만 재고 있었다」 로 데인
         자리입니다.
     [7] 서버를 한 번도 안 부르나 (7번) · 콘솔이 조용한가.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9147;
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
/* 「옮겨 적었나」 를 볼 때는 <b>주석과 판 쪽지를 걷고</b> 봅니다.
   ⚠ 걷지 않아 물렸습니다 — 판 쪽지(APP_BUILD_NOTE)에 「카톡 먼저」 를 적어
     사장님께 알려 드렸더니, 이 자가 <b>제 쪽지를 코드로 읽고</b> 빨간불을
     켰습니다. 쪽지는 <b>무엇이 새로 나갔는지 적는 자리</b>이고 화면 글의
     출처가 아닙니다. 코드가 그 글을 들고 있는지만 봅니다 (8번). */
const 걷기 = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ')
                      .split('\n').filter(l => !/^var APP_BUILD/.test(l)).join('\n');
const CODE = 걷기(SRC);
const STG = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');

/* 견본 — 이름은 <b>홍길동</b> (3번).
   순천시 AP3·PC2 = 5분 · 여수시 CS2·증권전달1 = 3분 ·
   지역 없는 AP2(안 세어야 한다) · 남의 것 순천시 AP4(안 세어야 한다).
   오늘 약속은 <b>없습니다</b> — 「약속 없는 날」 줄을 재려고 그렇게 둡니다. */
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
  CM.loaded=true; CM.meta={}; CM.who={me:'홍길동',u2:'홍길순'};
  AR.loaded=true; AR.busy=''; AR.calls=[];
  const me=(typeof arMyId==='function')?arMyId():'me';
  const d=(id,who,rg,st)=>({id:id,who:who,name:'홍길동'+id,region:rg,src:'일반',stage:st,
    days:3,n:1,res:'상담',cAt:'',pAt:'',appt:'',memo:''});
  AR.db=[d('a1',me,'순천시','AP'), d('a2',me,'순천시','AP'), d('a3',me,'순천시','AP'),
         d('a4',me,'순천시','PC'), d('a5',me,'순천시','PC'),
         d('b1',me,'여수시','CS'), d('b2',me,'여수시','CS'), d('b3',me,'여수시','증권전달'),
         d('c1',me,'','AP'),       d('c2',me,'','AP'),
         d('x1','u2','순천시','AP'), d('x2','u2','순천시','AP'),
         d('x3','u2','순천시','AP'), d('x4','u2','순천시','AP')];
  /* 고객 — 나이 아는 넷(20·30대 둘 · 40·50대 하나 · 60대 하나) · 모르는 둘 */
  const c=(id,who,by)=>({id:id,who:who,by:by,nm:'홍*동',name:'홍길동'+id,
    plan:'',due:'',days:3,ever:true});
  AR.cliRows=[c('p1',me,1990), c('p2',me,1992), c('p3',me,1972), c('p4',me,1958),
              c('p5',me,null), c('p6',me,null), c('q1','u2',1980)];
  try{ osHideLoginGate(); }catch(e){}
};

(async () => {
  console.log('🚗 동선 추천 · 🤝 활동 독려 · 🎯 접촉포인트 (판 X97)');

  sec('[0] 말은 <b>한 곳에만</b> 적혀 있나 (5번)');
  is(/pt:'카톡 먼저'/.test(STG) && /pt:'종이로 찾아뵙기'/.test(STG),
     '접촉포인트 한 토막이 <b>apex-stage.js</b> 에 있다');
  is(!/카톡 먼저/.test(CODE) && !/종이로 찾아뵙기/.test(CODE) && !/가족과 함께 보는 자리/.test(CODE),
     '본체에 <b>옮겨 적지 않았다</b> — 홈은 APEX_STAGE 를 부른다');
  is(/APEX_STAGE\.ageBand/.test(SRC) && /APEX_STAGE\.ageOf/.test(SRC),
     '나이대를 가르는 자·말을 꺼내는 자 모두 <b>apex-stage.js</b> 것이다');
  is((SRC.match(/function hmPtOf\(/g)||[]).length === 1 &&
     (SRC.match(/function hmRtRgTop\(/g)||[]).length === 1,
     '세는 자가 <b>한 곳씩</b>이다 — hmPtOf · hmRtRgTop');
  is(/function hmActMoreHtml\(\)\{[\s\S]{0,400}?hmActOf\(/.test(SRC),
     '독려 칩의 수는 <b>hmActOf 한 곳</b>에서 온다 — 또 세지 않는다 (5번)');
  is(/hwhoFor\(\)/.test(SRC.slice(SRC.indexOf('function hmFlowHtml('), SRC.indexOf('function hmFlowHtml(')+2600)),
     '「누구 것인가」 는 <b>hwhoFor() 한 곳</b>에 묻는다 (판 X91 과 같은 자)');

  await new Promise(r => srv.listen(PORT, r));
  const B = 'http://127.0.0.1:' + PORT + '/app/';
  const br = await chromium.launch();
  const errs = [], gets = [];
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  /* ★ <b>바깥을 막습니다</b> — 안 막으면 CI 에서 사장님의 <b>진짜 공지·진짜
     고객</b>이 그려져, 곳마다 다른 화면을 재게 됩니다 (check-netblock 이
     이것을 셉니다). 막은 것은 <b>끊습니다</b>(abort) — 기다리게 두면
     순간마다 다른 길이가 나옵니다. */
  /* ⚠ <b>글꼴은 받습니다.</b> 통째로 막아 보니 글자 폭이 달라져 같은 글이
     한 줄에서 두 줄이 되고, 늘어난 px 가 <b>22px 로 뛰었습니다</b>. 그러면
     check-homeone 의 자(3,526px)와 <b>다른 자</b>로 재는 것이 됩니다 (5번).
     막을 것은 <b>자료</b>입니다 — 진짜 공지·진짜 고객이 그려지는 길. */
  const 정적 = /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|cdnjs\.cloudflare|unpkg\.com/;
  await ctx.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + PORT) >= 0 || 정적.test(u)) ? r.continue() : r.abort();
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  /* ⚠ <b>글꼴·CDN 은 안 셉니다</b> — 앱이 늘 받는 것이라, 세면 이 자가
     판마다 울리는 헛것이 됩니다 (8번). 자료를 받아 오는 자리만 셉니다. */
  pg.on('request', q => { const u = q.url();
    if (/supabase\.co|\/rest\/v1|\/auth\/v1|\/\.netlify\/functions\//.test(u)) gets.push(u.slice(0, 90)); });
  /* ⚠ 씨는 <b>앱이 뜬 뒤에</b> 심습니다. addInitScript 로 먼저 심으면 AR 이
     아직 없어 AR.db 가 null 로 남습니다 — 그 꼴로 재면 「묶일 것이 없다」 는
     <b>엉뚱한 상태</b>를 재게 됩니다 (check-hmflow 와 같은 차례). */
  await pg.goto(B, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await pg.evaluate(SEED);
  await pg.evaluate(() => { go('home'); });
  await pg.waitForTimeout(1200);

  sec('[1] 🚗 묶이는 동네 — 진짜 수인가');
  const R = await pg.evaluate(() => {
    const t = hmRtRgTop(2), all = hmRtRgTop(99);
    /* ⚠ .hm-rt-none 은 여러 카드가 빌려 쓰는 옷 이름이라 동선 카드 안으로 좁힌다.
       판 X142 — 이 줄은 <b>접는 칸 안</b>으로 들어갔습니다(홈 4.2화면 선). 자리를
       못 박지 않고 <b>카드 안 어디든</b> 찾습니다 — 어디 있느냐가 아니라
       「그 말이 안 사라졌나」 가 이 자리의 물음입니다 (8번). */
    const el = document.querySelector('#dynPane .hm-rt .hm-rt-none');
    return { top: t, all: all, html: el ? el.innerHTML : '',
             txt: el ? (el.innerText||el.textContent||'').replace(/\s+/g, ' ').trim() : '(줄이 없다)',
             h: el ? Math.round(el.getBoundingClientRect().height) : 0 };
  });
  const t0 = R.top[0] || {}, t1 = R.top[1] || {};
  is(R.top.length === 2 && t0.rg === '순천시' && t0.n === 5,
     '많은 쪽이 먼저 — <b>순천시 5분</b> (AP 3 · PC 2)' + ' ← ' + JSON.stringify(R.top));
  is(t1.rg === '여수시' && t1.n === 3, '다음은 <b>여수시 3분</b>');
  /* ⚠ 처음에는 <b>위 둘</b>만 보고 「지역 없는 분 안 센다」 를 재다가, 되돌려
     보니 <b>안 울렸습니다</b> — 빈 지역은 수가 적어 위 둘에 안 들었기
     때문입니다. 그래서 <b>전부</b>를 보고, 센 사람 수까지 맞춰 봅니다 (8번). */
  is(R.all.every(x => x.rg && String(x.rg).replace(/\s+/g, '')) &&
     R.all.reduce((a, x) => a + x.n, 0) === 8,
     '<b>지역이 안 적힌 분</b>은 안 센다 (1번) — 둘을 심어 두었고, 센 사람은 여덟이다' +
     ' ← ' + JSON.stringify(R.all));
  is(t0.n === 5, '<b>남의 분</b>은 안 센다 — 순천시에 남의 것 넷을 심어 두었다');
  is(/순천시/.test(R.txt) && /여수시/.test(R.txt) && /8분/.test(R.txt),
     '지역 이름과 <b>합계</b>가 화면에 적힌다 — 수는 하나만(이름표 묶이는동네몇분 · 0-1번) ← ' + R.txt.slice(0, 80));
  is(/data-ask="묶이는동네몇분"/.test(R.html || ''),
     '그 수에 <b>이름표</b>가 달려 있다 — check-onesay 가 견줄 수 있다');
  is(/오가는 시간이 줄어듭니다/.test(R.txt), '여태 적던 말이 <b>안 사라졌다</b>');

  sec('[2] 🤝 독려 — 셈으로만 · 칩 하나');
  const A1 = await pg.evaluate(() => {
    const el = document.querySelector('#dynPane .hm-act');
    return { t: el ? el.innerText.replace(/\s+/g, ' ') : '(없다)',
             /*  ⚠ 2026-10-22 (판 X152) — <b>앞머리 이모지가 선 그림이 됐습니다</b>
     (사장님 말씀 「남은 이모지도 바꿔」). 글 앞의 이모지는 이제 <svg> 라
     innerText·textContent 에 안 들어옵니다. <b>약속은 그대로</b>이므로
     보는 자리만 <b>이름</b>으로 옮깁니다 (8번). 무엇이었는지는 data-emo 에
     남아 있어, 꼭 가려야 할 때는 그것으로 봅니다. */
             more: /더\s*\d/.test(el ? el.innerText : ''),
             act: (typeof hmActOf === 'function') ? hmActOf() : null };
  });
  is(!A1.act ? !A1.more : A1.more,
     !A1.act ? '오늘 기록을 <b>못 읽었으면 칩이 안 선다</b> (1번) — 0 으로 적지 않는다'
             : '칩이 선다 — ' + A1.t.slice(0, 60));
  const A2 = await pg.evaluate(() => {
    /* 수를 <b>심어</b> 칩이 그 수를 그대로 쓰는지 본다. 세는 자는 위에서
       「hmActOf 한 곳」 임을 글자로 확인했다 — 여기서는 받아쓰기만 본다. */
    window.hmActOf = function(){ return { call: 4, meet: 1, all: 5 }; };
    hmActPaint();
    const el = document.querySelector('#dynPane .hm-act');
    return { t: el ? el.innerText.replace(/\s+/g, ' ') : '', h: el ? Math.round(el.getBoundingClientRect().height) : 0 };
  });
  is(/더\s*2/.test(A2.t), '만남 1 이면 칩이 <b>2</b> 라고 적는다 — 셈으로만 독려한다 ← ' + A2.t.slice(0, 70));
  const 지어낸말 = /잘 받히|잘 받습니다|가장 잘|확률|평균적으로|이 시간에|오후가|성공률/;
  const HOME = await pg.evaluate(() => (document.querySelector('.tab-pane.on') || {}).innerText || '');
  is(!지어낸말.test(HOME), '홈에 <b>지어낸 주장</b>이 없다 (1번) — 「잘 받힙니다」·확률·시간대 주장 0');

  /* ⚠ 앞 토막이 씨를 흔들어 둡니다 — <b>다시 심고</b> 잽니다 */
  await pg.evaluate(SEED); await pg.evaluate(() => { go('home'); }); await pg.waitForTimeout(500);
  sec('[3] 🎯 접촉포인트 — 아는 만큼만');
  const P = await pg.evaluate(() => {
    const o = hmPtOf((typeof hwhoFor === 'function') ? hwhoFor() : '');
    const el = document.querySelector('#dynPane .hm-act');
    const chip = [].slice.call((el||document).querySelectorAll('.t-chip'))
      .filter(x => /접촉포인트|카톡 먼저|전화 먼저|🎯/.test(
        (x.textContent||'') + ' ' + (x.getAttribute('aria-label')||'')))[0];
    return { o: o, t: chip ? chip.textContent.replace(/\s+/g, ' ') : '(칩이 없다)',
             lab: chip ? (chip.getAttribute('aria-label')||'') : '' };
  });
  is(P.o && P.o.all === 6 && P.o.known === 4 && P.o.unknown === 2,
     '내 고객만 센다 — <b>여섯 분 중 나이 아는 넷</b> ← ' + JSON.stringify(P.o && {all:P.o.all,known:P.o.known,unknown:P.o.unknown}));
  is(P.o && P.o.top === '2030' && P.o.b['2030'] === 2, '많은 묶음이 <b>20·30대 둘</b>이다');
  is(/카톡 먼저/.test(P.t),
     '칩에 <b>접촉포인트</b>가 그대로 적힌다 — 수·묶음은 올려 보는 말에 ← ' + P.t);
  is(/나이를 아는 4분/.test(P.lab),
     '긴 말은 <b>aria-label</b> 에 그대로 있다 — 눈으로도 소리로도 읽힌다 ← ' + P.lab.slice(0, 60));
  is(/2분은 생년이 안 적혀/.test(P.lab), '<b>모르는 분 수를 밝힌다</b> (1번) — 숨기지 않는다');
  is(/카톡 먼저/.test(P.t), '접촉포인트 말이 <b>apex-stage.js 에서</b> 온다 — 「카톡 먼저」');
  is(!/홍길동/.test(P.t+P.lab), '고객 <b>이름을 한 자도</b> 안 적는다 (3번) — 칩도 긴 말도');
  const P0 = await pg.evaluate(() => {
    AR.cliRows = AR.cliRows.map(r => ({ ...r, by: null }));
    go('home');
    /* ⚠ 칩을 칠하는 자(hmActPaint)는 <b>나중에</b> 돕니다 (7번 — 눈에 들어올 때).
       그래서 go('home') 바로 뒤에 읽으면 <b>앞서 칠해진 칩</b>을 읽습니다.
       칠하는 자를 직접 불러 <b>지금 상태</b>를 읽습니다. */
    try { hmActPaint(); } catch (e) {}
    const c = [].slice.call(document.querySelectorAll('#dynPane .hm-act button, #dynPane .hm-act .t-chip'))
      .filter(x => /접촉포인트|카톡 먼저|전화 먼저|🎯/.test(
        (x.textContent||'') + ' ' + (x.getAttribute('aria-label')||'')))[0];
    return c ? (c.textContent + ' | ' + (c.getAttribute('aria-label')||'')).replace(/\s+/g, ' ') : '';
  });
  is(/생년을 적으면/.test(P0) && /출생년도/.test(P0),
     '생년이 하나도 없으면 <b>없다고 적고 적는 자리를 알려 준다</b> (1번·6번)');
  is(!/20·30대|40·50대|60대 이상/.test(P0), '그때는 <b>나이대를 안 적는다</b> — 지어내지 않는다');
  const PN = await pg.evaluate(() => {
    AR.loaded = false;
    go('home');
    /* ⚠ 칩을 칠하는 자(hmActPaint)는 <b>나중에</b> 돕니다 (7번 — 눈에 들어올 때).
       그래서 go('home') 바로 뒤에 읽으면 <b>앞서 칠해진 칩</b>을 읽습니다.
       칠하는 자를 직접 불러 <b>지금 상태</b>를 읽습니다. */
    try { hmActPaint(); } catch (e) {}
    const c = [].slice.call(document.querySelectorAll('#dynPane .hm-act button, #dynPane .hm-act .t-chip'))
      .filter(x => /접촉포인트|카톡 먼저|전화 먼저|🎯/.test(
        (x.textContent||'') + ' ' + (x.getAttribute('aria-label')||'')))[0];
    AR.loaded = true;
    return c ? c.textContent : '';
  });
  is(!/🎯/.test(PN), '아직 <b>못 읽었으면 토막이 아예 없다</b> (1번) — 「0분」 이 아니다');

  /* ⚠ 앞 토막이 씨를 흔들어 둡니다 — <b>다시 심고</b> 잽니다 */
  await pg.evaluate(SEED); await pg.evaluate(() => { go('home'); }); await pg.waitForTimeout(500);
  sec('[4] ★★ 내 글이 몇 px 먹나 — 남은 자리는 <b>18px</b> (844×4.2 − 3,526)');
  /* 총 높이의 주인은 <b>check-homeone</b> 입니다. 여기서는 <b>차</b>만 잽니다. */
  const D = await pg.evaluate(() => {
    const H = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
    const out = {};
    AR.cliRows = AR.cliRows.map(r => ({ ...r, by: (r.id === 'p1' || r.id === 'p2') ? 1990 : (r.id === 'p3' ? 1972 : (r.id === 'p4' ? 1958 : null)) }));
    /* 판 X142 — 접는 칸 안으로 들어가 <b>접힌 동안은 0px</b> 입니다. 그래도
       카드 <b>통째로</b> 잽니다 — 누가 다시 펴 두면 그 늘어난 px 가 여기서
       그대로 드러납니다 (안 울리는 알람은 알람이 아닙니다 · 8번). */
    go('home'); out.sub넣음 = H('#dynPane .hm-act'); out.rt넣음 = H('#dynPane .hm-rt'); out.act넣음 = 0;
    const 참말 = { pt: window.hmPtChip, rg: window.hmRtRgTxt, more: window.hmActMoreHtml };
    window.hmPtChip = function(){ return ''; }; window.hmActMoreHtml = function(){ return ''; };
    window.hmRtRgTxt = function(){ return '지역을 묶어 하루를 잡으시면 오가는 시간이 줄어듭니다.'; };
    
    go('home'); out.sub뺌 = H('#dynPane .hm-act'); out.rt뺌 = H('#dynPane .hm-rt'); out.act뺌 = 0;
    window.hmPtChip = 참말.pt; window.hmRtRgTxt = 참말.rg; window.hmActMoreHtml = 참말.more;
    go('home');          /* ⚠ 되돌린 뒤 <b>다시 그립니다</b> — 안 그리면 다음 자가 「빼 둔 화면」 을 재게 됩니다 */
    return out;
  });
  const 늘 = (D.sub넣음 - D.sub뺌) + (D.rt넣음 - D.rt뺌) + (D.act넣음 - D.act뺌);
  console.log('  · 🎯+🤝 칩 둘 ' + (D.sub넣음 - D.sub뺌) + 'px · 🚗 묶이는 동네 ' +
              (D.rt넣음 - D.rt뺌) + 'px · 🤝 독려 칩 ' + (D.act넣음 - D.act뺌) + 'px');
  is(늘 <= 18, '세 토막을 다 넣어도 <b>' + 늘 + 'px</b> — 남은 자리(18px) 안이다' +
     (늘 > 18 ? ' ← 넘었습니다. <b>올리지 말고 줄이십시오</b> (check-homeone 의 그 말)' : ''));

  /* ⚠ 앞 토막이 씨를 흔들어 둡니다 — <b>다시 심고</b> 잽니다 */
  await pg.evaluate(SEED); await pg.evaluate(() => { go('home'); }); await pg.waitForTimeout(500);
  sec('[4-1] 칩이 <b>눈에 보이는 자리</b>에 있나 — 칩 줄은 옆으로 미는 줄이다');
  /* ⚠ 칩 글자가 길어도 <b>높이는 안 늘어납니다</b> — .hm-act .g 가
     flex-wrap:nowrap · overflow-x:auto 이기 때문입니다. 대신 <b>오른쪽
     화면 밖으로</b> 밀려 사장님이 옆으로 밀어야 보입니다. 그래서 길이를
     px 가 아니라 <b>자리</b>로 잽니다 (8번 — 되돌려 보고 알았습니다). */
  const C = await pg.evaluate(() => {
    const row = document.querySelector('#dynPane .hm-act .g');
    if (!row) return { 없음: true };
    const r = row.getBoundingClientRect();
    const it = [].slice.call(row.children).map(e => {
      const b = e.getBoundingClientRect();
      /* 판 X152 — 앞머리 이모지가 선 그림이라 글에 안 들어옵니다.
         무엇이었는지는 data-emo 에 남으므로 그것까지 붙여 봅니다 (8번). */
      /* ⚠ 빈칸을 <b>한 칸으로 모읍니다</b> — icoLead 는 이모지 뒤 빈칸을
         남겨 두므로(줄 끊을 자리), 그냥 이으면 빈칸이 둘이 되어 「🤝 더」
         로 찾는 자가 못 찾습니다. 판 X152 에서 그렇게 울었습니다. */
      return { t: ((e.getAttribute('data-emo') || '') + ' ' +
                   e.textContent).replace(/\s+/g, ' ').trim(),
               시작: Math.round(b.left - r.left),
               보임: (b.left >= r.left - 1 && b.right <= r.right + 1) };
    });
    return { 줄폭: Math.round(r.width), 속폭: row.scrollWidth, it: it };
  });
  const 새칩 = (C.it || []).filter(x => /🤝 더|🎯/.test(x.t));
  console.log('  · 줄 폭 ' + C.줄폭 + 'px · 칩이 차지한 폭 ' + C.속폭 + 'px' +
              (C.속폭 > C.줄폭 ? ' (옆으로 밀어야 끝까지 보입니다)' : ''));
  is(새칩.length === 2, '새 칩 <b>둘이 선다</b> — 🤝 더(한 분 더) · 🎯 접촉포인트');
  /* ★★ <b>손으로 밀지 않고 보이나</b> — 사장님 고르심(2026-10-13 「새 칩 둘을
     앞으로」). 맨 뒤에 두었을 때 x=238·348 로 줄 폭(251px) 밖이었습니다.
     「만남」 바로 뒤라야 처음부터 보입니다. */
  /* ★★ <b>왼쪽 끝이 줄 안에 드나</b> — 한 줄에 보이는 자리는 93px 뿐이어서
     (전화 72 · 만남 70 · 이름표 65) 둘을 <b>온전히</b> 세울 수는 없습니다.
     그래서 「보이기 시작하는가」 를 잽니다 — 끝에 두었을 때는 x=268·380 으로
     아예 밖이었습니다. 긴 말은 눌러서·올려서(title) 봅니다. */
  is(새칩.length === 2 && 새칩.every(x => x.시작 < C.줄폭),
     '새 칩 둘이 <b>보이기 시작한다</b> — 「만남」 바로 뒤 (줄 폭 ' + C.줄폭 + 'px)' +
     ' ← ' + (C.it || []).map(x => x.t + '@' + x.시작).join(' / '));
  is(새칩.length === 2 && 새칩[0].보임,
     '앞엣것(🤝 더)은 <b>온전히 보인다</b> — 뒤엣것(🎯)은 보이기 시작한다');
  is(새칩.every(x => x.t.replace(/[^가-힣A-Za-z0-9·]/g, '').length <= 12),
     '새 칩 글자가 <b>짧다</b> — 길면 뒤엣것을 화면 밖으로 밀어냅니다' +
     ' ← ' + 새칩.map(x => x.t).join(' / '));

  sec('[5] 조용한가');
  /* ⚠ <b>홈이 원래 부르는 것</b>(공지 os_notices 등)까지 세면 이 자가 판마다
     울리는 헛것이 됩니다 (8번). 물을 것은 「<b>내 글이</b> 서버를 부르나」 이고,
     그것은 <b>글자로</b> 봅니다 — 세는 자 넷은 손에 있는 것만 셉니다 (7번). */
  const 넷 = ['hmPtOf', 'hmPtChip', 'hmRtRgTop', 'hmActMoreHtml'].map(n => {
    const i = SRC.indexOf('function ' + n + '('); if (i < 0) return n + '(없음)';
    const j = SRC.indexOf('\nfunction ', i + 10);
    return /osClient\(|sb\.from\(|fetch\(|\.netlify\/functions/.test(SRC.slice(i, j < 0 ? SRC.length : j)) ? n : '';
  }).filter(Boolean);
  is(넷.length === 0, '새로 만든 세는 자 넷이 <b>서버를 안 부른다</b> (7번) — 손에 있는 AR 만 본다' +
     (넷.length ? ' ← ' + 넷.join(', ') : ''));
  is(gets.length >= 0, '  (홈이 원래 부르는 것 ' + gets.length + '건은 이 판의 것이 아닙니다 — check-egress 가 봅니다)');
  is(errs.length === 0, '콘솔이 조용하다' + (errs.length ? ' ← ' + errs[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지가 어긋납니다'); process.exit(1); }
  console.log('✓ 동선 추천 · 활동 독려 · 접촉포인트가 아는 만큼만 적고, 홈을 안 늘립니다.');
})();
