/* ══════════════════════════════════════════════════════════════════
   check-hmjob.js (판 X150) — ✅ <b>오늘 할 일</b> 이 홈 맨 위, 두 칸 바로 밑에 서나.
   그리고 <b>그 고객 밑에</b> 보장분석 넣기가 서나.

   사장님 말씀 (2026-10-21) — 「오늘 에서 <b>db통합 crm 밑에 보장분석pdf
   넣기 자리에 오늘 할일이 올라오게</b> 만들고 <b>그 고객 밑에 보장분석
   넣기</b>를 만들어」.

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>자리.</b> ★ 2026-10-24 부터 <b>맨 위</b>입니다(판 X186 · 아래 [1] 쪽지).
      전에는 두 칸 바로 밑이었습니다 — 폰에서 안 내려도 보이는 데가
      거기뿐입니다. 고치기 전 「오늘 챙길 것」 은 y1,106 이었습니다.
   ⓑ <b>그 분 것인가.</b> 단추가 <b>이름 바로 아래</b> 서야 그 분 것으로
      읽힙니다. 그리고 go('bojang')(아무나)이 아니라 <b>hmBaGo(cid)</b> 로
      그 분에게 붙어야 합니다 (사장님 말씀 「고객 365일 → 거기에 인식」).
   ⓒ <b>두 벌.</b> 같은 줄이 아래 「오늘 챙길 것」 에도 서면 같은 분이 홈에
      두 번입니다 — 사장님이 이미 한 번 말씀한 자리입니다 (5번).
   ⓓ <b>모름을 0 으로 적는 것.</b> 배정 DB 를 못 읽었으면 수를 한 자도 안
      적습니다 — 「오늘 할 일이 없다」 가 되어 버립니다 (1번).
   ⓔ <b>있다 없다 하는 칸.</b> 할 일이 없는 날도 자리를 지켜야 합니다
      (사장님 말씀 2026-09-26).
   ⓕ <b>「아무나」 길이 끊기는 것.</b> 칸 바로 아래 📄 한 줄은 그대로 있어야
      합니다 (6번). 깊이 재는 것은 check-hmsum·check-baneed 가 하므로
      여기서는 <b>차례만</b> 봅니다 (같은 것을 두 번 세지 않게 · 5번).
   ⓖ <b>수가 갈리는 것.</b> 머리의 「N분 중 M번째」 는 아래 띠의 그것과
      같아야 합니다 — 둘 다 hmLeft() 한 곳에서 와야 합니다 (5번).
   ⓗ <b>읽히나.</b> 13px 바닥 · 손가락 44px (판 X146·X147 의 바닥).
   ⓘ <b>따라 그려지나.</b> 「이분 끝」 을 누르면 이 칸도 다음 분으로
      넘어가야 합니다 — hmPaint 는 #hmToday 만 갈아 끼웁니다.
   ⚠ 홈 높이는 <b>안 잽니다</b> — check-homeone 하나가 봅니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8904;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
let 바깥 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 씨 — 배정 DB 일곱 줄 · 고객 365일 카드 둘. 이름은 <b>홍길동</b> 집안 (3번) */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.openBa=function(){window.__BA=(window.__BA||0)+1;
   try{ BA.cid=(typeof OSC!=='undefined'&&OSC.current)?OSC.current.id:''; }catch(e){}};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.cliRows=${o && o.빔 ? '[]' : "[{id:'c1',name:'홍길동가',nm:'홍길동가'},{id:'c2',name:'홍길동나',nm:'홍길동나'}]"};
 ${o && o.못읽음 ? 'AR.db=null;' : (o && o.빔 ? 'AR.db=[];' : `AR.db=[
   {id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'},
   {id:'d2',who:'me',name:'홍길동나',stage:'PC',days:3,region:'서울',src:'일반'},
   {id:'d3',who:'me',name:'홍길동다',stage:'CS',days:1,region:'서울',src:'일반'},
   {id:'d4',who:'me',name:'홍길동라',stage:'계약완료',days:5,region:'서울',src:'일반'},
   {id:'d5',who:'me',name:'홍길동마',stage:'미접촉',days:9,region:'서울',src:'일반'},
   {id:'d6',who:'me',name:'홍길동바',stage:'부재',days:31,region:'경기',src:'일반'},
   {id:'d7',who:'me',name:'홍길동사',stage:'거절',days:40,region:'경기',src:'변액'}];`)}
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=${o && o.빔 ? '[]' : "[{id:'c1',name:'홍길동가',phone:'010'},{id:'c2',name:'홍길동나',phone:'010'}]"};
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 HWHO.id='';go('home');`;

const 본 = async (p) => await p.evaluate(() => {
  const y = e => e ? Math.round(e.getBoundingClientRect().top + (window.scrollY || 0)) : -1;
  const card = document.querySelector('.hm-nxs');
  const i1 = card ? card.querySelector('.hm-nxs-i') : null;
  const nm = i1 ? (i1.querySelector('.hm-nxs-r .m b') || {}).textContent || '' : '';
  const box = i1 ? i1.querySelector('.hm-nxs-b') : null;
  const btn = box ? (box.querySelector('.btn') || box.querySelector('.hm-nxs-w')) : null;
  return {
    섰나: !!card,
    칸수: document.querySelectorAll('.hm-nxs').length,
    아래에도: document.querySelectorAll('#hmToday .hm-nxs').length,
    두칸y: y(document.querySelector('.hm-two')),
    칸y: y(card), pdfy: y(document.querySelector('.hm-pdf')),
    흐름y: y(document.getElementById('hmFlowHost')),
    오늘y: y(document.getElementById('hmToday')),
    머리: ((card && card.querySelector('.hm-nxs-hd')) || {}).innerText || '',
    머리수: ((card && card.querySelector('[data-ask="오늘몇분"]')) || {}).textContent || '',
    띠수: ((document.querySelector('#hmToday .hm-q-n')) || {}).textContent || '',
    첫이름: nm,
    단추글: btn ? (btn.innerText || '').replace(/\s+/g, ' ').trim() : '',
    단추태: btn ? btn.tagName : '',
    단추키: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
    단추길: btn ? (btn.getAttribute('onclick') || '') : '',
    /* ★ 단추가 <b>이름보다 아래</b>인가 — 「그 고객 밑에」 */
    밑인가: !!(btn && nm && y(btn) > y(i1.querySelector('.hm-nxs-r'))),
    꼬리: ((card && card.querySelector('.hm-nxs-m')) || {}).textContent || '',
    빈말: ((card && card.querySelector('.hm-nxs-n0')) || {}).innerText || '',
    글: card ? (card.innerText || '').replace(/\s+/g, ' ').trim() : '',
    작은글자: (() => { if (!card) return -1; let n = 0;
      [card, ...card.querySelectorAll('*')].forEach(e => {
        const t = (e.textContent || '').trim(); if (!t) return;
        const px = parseFloat(getComputedStyle(e).fontSize || '0');
        if (px > 0 && px < 13) n++; }); return n; })(),
    작은단추: (() => { if (!card) return -1; let n = 0;
      card.querySelectorAll('button').forEach(e => {
        if (Math.round(e.getBoundingClientRect().height) < 44) n++; }); return n; })()
  };
});
const 수 = (s) => (String(s).match(/\d+/g) || []).map(Number);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => {
      if (r.request().url().indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
      바깥++; try{ (global.__U=global.__U||[]).push(r.request().url().slice(0,90)); }catch(e){} return r.abort();
    });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2400);
    return { ctx, p, errs };
  };

  console.log('[1] 📌 <b>자리</b> — <b>맨 위</b>, 두 칸·📄 한 줄보다 위 (판 X186)');
  const A = await open({});
  let o = await 본(A.p);
  is(o.섰나, '  ✅ <b>오늘 할 일</b> 칸이 선다');
  /* ★★ 2026-10-24 (판 X186) · <b>여기가 한 번 더 올라갔습니다.</b>
     ── 말씀 둘을 다 적습니다 ─────────────────────────────────
     ① 2026-10-21 (판 X150) — 「db통합 crm 밑에 보장분석pdf넣기 자리에
        <b>오늘 할일이 올라오게</b> 만들고」 → 넷째에서 <b>두 칸 바로 밑</b>으로.
     ② 2026-10-24 (판 X186) — 「오늘 할일이 맨 위에 있어서, <b>지금할것을
        맨위로</b> 올려주고 … 그래야 오늘 할 것들을 <b>순차적으로</b> 할 수
        있어」 → 두 칸 <b>위로</b>, 즉 홈 <b>맨 위</b>로.
     <b>어긋난 것이 아니라 같은 방향으로 한 걸음 더</b>입니다 — ① 은 「더
     위로」 였고 ② 도 「더 위로」 입니다. 그래서 잣대를 <b>뒤집지 않고
     옮깁니다</b>: 전에는 「두 칸보다 아래」, 이제는 <b>「두 칸보다 위」</b>.
     ⚠ <b>옛 말씀을 지우지 않습니다</b> — 다음 세션이 「왜 두 칸 밑이 아니지」
       하고 되돌리지 않도록 둘 다 남깁니다 (11번 ③ 과 같은 뜻).         */
  is(o.두칸y > 0 && o.칸y < o.두칸y,
     '  <b>DB통합CRM 두 칸보다 위</b>다 (맨 위) — 칸 y' + o.칸y + ' · 두 칸 y' + o.두칸y);
  is(o.pdfy > o.칸y,
     '  <b>📄 한 줄은 그 아래</b>에 그대로 있다 (6번) — 칸 y' + o.칸y + ' · 📄 y' + o.pdfy);
  is(o.흐름y > o.칸y,
     '  <b>상담현황보다 위</b>다 — 칸 y' + o.칸y + ' · 상담현황 y' + o.흐름y);
  is(o.오늘y > o.칸y,
     '  ★★ 고치기 전 자리(「오늘 챙길 것」)보다 <b>' + (o.오늘y - o.칸y) +
     'px 위</b>다 — 폰에서 안 내려도 보인다 (오늘 챙길 것 y' + o.오늘y + ')');

  console.log('\n[2] 📄 <b>그 고객 밑에</b> 보장분석 넣기 (사장님 말씀 그대로)');
  is(!!o.첫이름, '  줄에 <b>그 분 이름</b>이 선다 — 「' + (o.첫이름 || '(없음)') + '」');
  is(!!o.단추글 && /보장분석|고객 카드|확인 중/.test(o.단추글),
     '  그 분 <b>보장분석 한 줄</b>이 있다 — 「' + (o.단추글 || '(없음)') + '」');
  is(o.밑인가, '  ★★ 그 단추가 <b>이름보다 아래</b>에 선다 (「그 고객 밑에」)');
  is(o.단추태 === 'BUTTON' && /hmBaGo|hmBaAdd/.test(o.단추길),
     '  <b>진짜 눌리는 단추</b>다 — ' + o.단추태 + ' · ' + (o.단추길 || '(길 없음)'));
  is(o.단추키 >= 44, '  손가락 크기 <b>44px</b> 다 — ' + o.단추키 + 'px');
  /* ★ go('bojang') 으로 가면 <b>그 분에게 안 붙습니다</b> — 그래서 그 길은 안 됩니다 */
  is(!/go\('bojang'\)/.test(o.단추길),
     '  ★ <b>「아무나」 길이 아니다</b> — 그 분을 들고 openBa() 로 간다 (사장님 말씀 「고객 365일 → 거기에 인식」)');

  console.log('\n[3] 🤝 <b>눌러 보면</b> 그 분이 서고 그 분께 붙는다');
  const go1 = await A.p.evaluate(async () => {
    const e = document.querySelector('.hm-nxs-b .btn'); if (!e) return { no: 1 };
    e.click(); await new Promise(r => setTimeout(r, 400));
    return { no: 0, cid: (typeof OSC !== 'undefined' && OSC.current) ? OSC.current.id : '',
             열림: window.__BA || 0, ba: (typeof BA !== 'undefined') ? (BA.cid || '') : '',
             말: window.__T || '' };
  });
  is(!go1.no && !!go1.cid, '  고객 365일에 <b>그 분</b>이 선다 — ' + (go1.cid || '(안 섰습니다)'));
  is(!go1.no && go1.열림 === 1, '  전·후 만들기가 <b>한 번만</b> 열린다 — ' + go1.열림 + '번');
  is(!go1.no && go1.ba === go1.cid,
     '  ★★ <b>그 분을 들고</b> 열린다 — BA.cid ' + (go1.ba || '(빔)') + ' · 고른 분 ' + go1.cid);
  await A.ctx.close();

  console.log('\n[4] 👥 <b>아래에 두 번 안 선다</b> (5번 · 사장님 말씀 「지금 할 것이 두 번 나온다」)');
  const B = await open({});
  o = await 본(B.p);
  is(o.칸수 === 1, '  홈 안에 이 칸이 <b>하나</b>다 — ' + o.칸수 + '개');
  is(o.아래에도 === 0,
     '  「오늘 챙길 것」 안에는 <b>없다</b> — ' + o.아래에도 + '개' +
     (o.아래에도 ? ' ← 두 벌입니다. 같은 분이 홈에 두 번 섭니다 (5번)' : ''));
  const 날 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
  const src = 걷기(날);
  is((src.match(/function hmNxsHtml\(\)/g) || []).length === 1,
     '  <b>짓는 자리가 하나</b>다 (5번)');
  is((src.match(/hmNxsHtml\(\)/g) || []).length === 3,
     '  <b>부르는 자리가 둘</b>이다 — 히어로와 hmJobPaint (' +
     ((src.match(/hmNxsHtml\(\)/g) || []).length - 1) + '곳)');
  is((src.match(/function hmBaBtn\(/g) || []).length === 1 &&
     (src.match(/hmBaBtn\(/g) || []).length >= 3,
     '  <b>단추를 만드는 자도 하나</b>(hmBaBtn)이고 여럿이 그것을 부른다 (5번)');

  console.log('\n[5] 🔢 <b>수가 갈리지 않는다</b> — hmLeft 한 곳에서 (5번)');
  is(!!o.머리수 && 수(o.머리수).length >= 2,
     '  머리에 <b>「N분 중 M번째」</b> 가 적힌다 — 「' + o.머리수.replace(/\s+/g, ' ').trim() + '」');
  is(!!o.띠수 && 수(o.머리수).join(',') === 수(o.띠수).join(','),
     '  ★★ 아래 띠와 <b>같은 수</b>를 말한다 — 머리 [' + 수(o.머리수) + '] · 띠 [' + 수(o.띠수) + ']');
  is(/data-ask="오늘몇분"/.test(날),
     '  숫자 자리에 <b>이름표</b>가 달려 있다 (0-1번 · check-onesay)');

  console.log('\n[6] ✅ <b>「이분 끝」 을 누르면 이 칸도 따라간다</b> (hmJobPaint)');
  const nx = await B.p.evaluate(async () => {
    const before = ((document.querySelector('.hm-nxs-r .m b') || {}).textContent || '');
    try { hmQdoneSet(hmNext().x.key); } catch (e) { return { no: 1 }; }
    hmPaint(); await new Promise(r => setTimeout(r, 420));
    return { no: 0, before: before,
             after: ((document.querySelector('.hm-nxs-r .m b') || {}).textContent || ''),
             머리: ((document.querySelector('.hm-nxs [data-ask="오늘몇분"]') || {}).textContent || '') };
  });
  is(!nx.no && !!nx.before && !!nx.after && nx.before !== nx.after,
     '  <b>다음 분으로 넘어간다</b> — 「' + nx.before + '」 → 「' + nx.after + '」' +
     ((nx.before === nx.after) ? ' ← 안 따라갔습니다. hmPaint 는 #hmToday 만 갈아 끼웁니다' : ''));
  is(!nx.no && 수(nx.머리)[1] === 2,
     '  머리의 <b>번째</b>도 따라간다 — 「' + nx.머리.replace(/\s+/g, ' ').trim() + '」');
  is(B.errs.length === 0, '  터진 곳이 없다' + (B.errs.length ? ' ← ' + B.errs[0] : ''));
  await B.ctx.close();

  console.log('\n[7] 🙈 <b>모름을 0 으로 적지 않는다</b> (1번)');
  const C = await open({ 못읽음: true });
  o = await 본(C.p);
  is(o.섰나, '  못 읽었어도 <b>자리는 선다</b> (있다 없다 하는 칸을 안 만든다)');
  /* ★★ <b>처음에 이 자가 틀렸습니다</b> — 「수를 한 자도 안 적는다」 로 재다가
     앱을 거짓 고발했습니다. 배정 DB 를 못 읽었어도 <b>고객 365일에서 온 분</b>
     은 손에 있어서 「오늘 볼 분 2분」 이 참입니다. 게다가 아래 띠도 같은
     hmLeft() 수를 적으므로, 맨 위에서만 감추면 한 화면이 <b>두 말</b>을 합니다
     (5번). 그래서 약속을 <b>「아는 수는 적고, 모르는 것이 남았다고 덧붙인다」</b>
     로 바로잡았습니다 (1번 · 8번 — 자를 약하게 한 것이 아니라 <b>옳은 것</b>을
     재게 고쳤습니다).                                                     */
  is(!!o.빈말 && /못 읽었/.test(o.빈말),
     '  ★★ <b>아직 못 읽었다고 덧붙인다</b> — 「' + (o.빈말 || '(말 없음)').replace(/\s+/g, ' ').trim() +
     '」 (안 적으면 아는 수를 전부로 읽으십니다 · 1번)');
  is(/더 있을 수 있/.test(o.빈말 || ''),
     '  <b>더 있을 수 있다</b>고 적는다 — 아는 수를 「오늘 전부」 로 안 말한다');
  await C.ctx.close();

  console.log('\n[8] 🌤 <b>할 일이 없는 날</b> — 자리는 그대로, 없다고 적는다');
  const D = await open({ 빔: true });
  o = await 본(D.p);
  is(o.섰나, '  <b>자리는 선다</b> (사장님 말씀 2026-09-26 「있다 없다 하는 칸을 없앱니다」)');
  is(!!o.빈말 && /없습니다/.test(o.빈말) && !/못 읽었/.test(o.빈말),
     '  <b>없다고</b> 적는다 — 「' + (o.빈말 || '(말 없음)').replace(/\s+/g, ' ').trim() + '」');
  is(o.pdfy > o.칸y, '  그런 날도 <b>📄 한 줄은 그대로</b>다 (6번)');
  await D.ctx.close();

  console.log('\n[9] 👓 <b>읽히나</b> — 13px 바닥 · 44px (판 X146·X147)');
  const E = await open({});
  o = await 본(E.p);
  is(o.작은글자 === 0, '  13px <b>밑 글씨가 없다</b> — ' + o.작은글자 + '곳');
  is(o.작은단추 === 0, '  44px <b>밑 단추가 없다</b> — ' + o.작은단추 + '개');
  /* ⚠ <b>쪽을 여는 동안</b> 글꼴·Supabase 를 부르는 것은 앱이 늘 하는 일이라
     세면 헛것입니다(8번). <b>이 칸을 그리는 동안</b>만 셉니다 (check-hmsum 과
     같은 결 · 7번). */
  const 바깥전 = 바깥;
  await E.p.evaluate(() => { try { hmJobPaint(); hmJobPaint(); } catch (e) {} });
  await E.p.waitForTimeout(400);
  is(바깥 - 바깥전 === 0,
     '  이 칸을 그리는 동안 <b>바깥을 안 부른다</b> — ' + (바깥 - 바깥전) + '번 (7번)');
  await E.ctx.close();

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 오늘 할 일 칸 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 오늘 할 일이 맨 위에 서고, 그 고객 밑에 보장분석 넣기가 섭니다.');
})();
