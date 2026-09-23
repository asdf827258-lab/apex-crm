/* ══════════════════════════════════════════════════════════════════
   check-quest.js — <b>한 분씩 퀘스트.</b> 한 분을 끝내면 다음 분으로.

   사장님 말씀 (2026-09-23) —
     「이번주 상담 AP/PC 를 찾아내서, <b>그 지역의 10명</b>을 매일 추천해서
      약속 잡을수 있게 도와줘. <b>한명 한명당 퀘스트로</b> 만들어줘.
      <b>한명미션을 끝내면 → 다음 사람</b>으로 하는게 가장 중요해.
      <b>오늘 챙길것 + 아침 미션을 하나로</b> 합치는거야.」
     「아침미션에서 오늘의 알림 이거 <b>어떻게 접촉할지 · DB종류 · 어떻게
      관리할지 · 어떤 연락 드릴지</b>를 자세하게 찾아서 하라니까 이것도
      안하고 있고」

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 한 분마다 <b>퀘스트 띠</b> — 몇 분 중 몇 번째인지 · 왜 이분인지
     [2] <b>「✅ 이분 끝」 을 누르면 다음 분</b>이 온다 — 하루가 첫 분에서
         멈추지 않는다. 그리고 그것이 <b>기록이 아님</b>을 적는다 (1번)
     [3] 이번 주 AP·PC 가 잡힌 <b>동네</b>를 앞으로 — 다만 <b>급한 단계를
         밀어내지 않는다</b>. 약속이 없으면 없다고 적는다 (1번)
     [4] ① 오늘의 알림이 <b>네 가지를 답한다</b> — 어떻게 닿고 · 어디서 온
         분이고 · 무엇을 할지 · 어떤 소식을 드릴지. 누르면 ②③④ 가 따라온다
     [5] 아침 미션이 <b>「오늘 챙길 것」 안</b>에 있다 · <b>뽑힌 분이 없어도
         사라지지 않는다</b> — 실제로 사라졌던 자리다
     [6] 오늘 끝낸 표시는 <b>오늘만</b> — 날짜가 바뀌면 스스로 지워진다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8934;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안입니다 (3번). 실제 고객 이름은 안 씁니다.
   ── 일부러 이렇게 짰습니다 ──────────────────────────────────────
   · <b>순천</b>에 이번 주 AP 약속이 하나 잡혀 있습니다(q1). 그래서 같은
     자리끼리일 때 순천 분이 앞섭니다.
   · <b>TA 가 둘</b>(광양 q4 · 순천 q3)입니다 — 같은 단계·같은 대기일이라
     <b>동네만으로</b> 갈립니다. ★ <b>광양을 먼저 적어 둡니다.</b> 순천을
     먼저 적어 두었더니 정렬이 안정정렬이라, 동네 저울을 <b>빼도</b> 순천이
     앞서 <b>알람이 안 울렸습니다</b> — 되돌려 보고 알았습니다 (8번).
   · <b>부재</b>(q5)가 한 분 있습니다 — TDO 차례가 TA 보다 <b>뒤</b>라,
     지역이 맞아도 TA 를 밀어내면 안 됩니다. 뒤엎기를 잡는 자입니다. */
const SEED = (o) => `
 window.__T='';
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1'};
 GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return (i==='me')?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=${o.none ? '[]' : `[
  {id:'q1',who:'me',name:'홍길동A',region:'순천',src:'보장분석3DB',stage:'AP',days:3,n:2,res:'상담',
   appt:'${o.appt || 'TOMORROW'} 14:00',cAt:'',pAt:''},
  {id:'q4',who:'me',name:'홍길동D',region:'광양',src:'개척',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
  {id:'q3',who:'me',name:'홍길동C',region:'${o.far ? '광양' : '순천'}',src:'보장분석3DB',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
  {id:'q5',who:'me',name:'홍길동E',region:'${o.far ? '광양' : '순천'}',src:'개척',stage:'부재',days:9,n:1,res:'부재',cAt:'',pAt:''}]`};
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 try{ localStorage.removeItem('apex_hm_qdone_v1');
      localStorage.removeItem('apex_hm_skip_v1');
      localStorage.removeItem('apex_hm_fold_v1');
      localStorage.removeItem('apex_newslive'); }catch(e){}
 if(typeof NLIVE!=='undefined'){NLIVE.items=[];NLIVE.at='';}
 window.osClient=function(){var mk=function(t){var st={t:t,op:'',id:'',sel:false};var a={
   update:function(){st.op='update';return a;},insert:function(){st.op='insert';return a;},
   upsert:function(){st.op='upsert';return a;},'delete':function(){st.op='delete';return a;},
   select:function(){st.sel=true;return a;},order:function(){return a;},range:function(){return a;},
   limit:function(){return a;},single:function(){return a;},gte:function(){return a;},
   'in':function(){return a;},is:function(){return a;},neq:function(){return a;},not:function(){return a;},
   eq:function(k,v){st.id=v;return a;},
   then:function(o2,n2){if(st.op&&!st.sel)return Promise.resolve({error:null}).then(o2,n2);
     return Promise.resolve({data:st.op?[{id:'x'}]:[],error:null}).then(o2,n2);}};return a;};
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    /* 약속은 <b>오늘 기준</b>으로 잡아야 「이번 주」 안에 듭니다 —
       날짜를 글자로 박아 두면 내년에 이 점검이 거짓 초록이 됩니다 (8번) */
    const tom = await p.evaluate(() => mcalShift(mcalToday(), 1));
    await p.evaluate(SEED(Object.assign({ appt: tom }, o || {})));
    await p.waitForTimeout(2400);
    return { ctx, p, errs };
  };
  const now = (p) => p.evaluate(() => {
    const e = document.querySelector('.hm-now');
    return e ? e.innerText.replace(/\s+/g, ' ') : '';
  });

  const A = await open({});
  is(A.errs.length === 0, '  홈을 여는 동안 콘솔 오류가 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));

  console.log('\n[1] 한 분마다 <b>퀘스트 띠</b> — 몇 분 중 몇 번째인가');
  const q1 = await A.p.evaluate(() => {
    const q = document.querySelector('.hm-now .hm-q');
    return { has: !!q, txt: q ? q.innerText.replace(/\s+/g, ' ') : '',
             dots: q ? q.querySelectorAll('.hm-q-dots i').length : 0,
             nowDot: q ? q.querySelectorAll('.hm-q-dots i.now').length : 0,
             n: hmSteps().length };
  });
  is(q1.has, '  띠가 <b>한 분 카드 맨 위</b>에 선다');
  is(/1번째/.test(q1.txt) && q1.txt.indexOf(q1.n + '분') >= 0,
     '  <b>' + q1.n + '분 중 1번째</b> 라고 적는다 — 「' + q1.txt.slice(0, 26) + '…」');
  is(q1.dots === q1.n && q1.nowDot === 1,
     '  동그라미가 <b>사람 수만큼</b>(' + q1.dots + ') 서고 <b>지금 자리 하나</b>가 켜진다');

  console.log('\n[2] <b>「✅ 이분 끝」 을 누르면 다음 분</b>으로 (제일 중요)');
  const who = (p) => p.evaluate(() => { const r = hmNext(); return r.x ? (r.x.t + '|' + r.i) : ''; });
  const w0 = await who(A.p);
  const btn = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-now .hm-nx-f');
    return e ? e.innerText.replace(/\s+/g, ' ') : '';
  });
  is(/이분 끝/.test(btn) && /다음 분/.test(btn), '  단추가 <b>한 자리</b>에 있다 — 「' + btn + '」');
  /* 단추가 없어도 <b>다음 줄이 제대로 재지게</b> 눌러 봅니다 — 여기서
     그냥 click() 을 부르면 단추를 뺐을 때 점검이 터져, 무엇이 깨졌는지
     알려 주지 못하고 멈춥니다 (8번). */
  const tap = (p) => p.evaluate(() => {
    const e = document.querySelector('.hm-now .hm-nx-f');
    if (e) { e.click(); return true; } return false;
  });
  await tap(A.p);
  await A.p.waitForTimeout(420);
  const w1 = await who(A.p);
  is(w0 && w1 && w0 !== w1, '  누르면 <b>다음 분</b>이 온다 — ' + w0.split('|')[0] + ' → ' + w1.split('|')[0]);
  const q2 = await now(A.p);
  is(/2번째/.test(q2), '  띠도 <b>2번째</b> 로 넘어간다');
  const sayT = await A.p.evaluate(() => window.__T || '');
  is(/남았습니다|다 보셨습니다/.test(sayT), '  <b>몇 분 남았는지</b> 말해 준다 — 「' + sayT + '」');
  /* ⚠ <b>기록이 아니다.</b> 「끝」 을 눌렀다고 전화한 것이 아니다 — 앱이
     그렇게 적으면 단추 몇 번에 「오늘 열 분 관리 완성」이 됩니다 (1번).
     ★ <b>아침 미션에 뽑히는 분</b>(미접촉·TA·부재·기고객·거절)을 끝내야
       이것이 재집니다. 첫 분은 AP 라 미션에 안 뽑혀, 한 번만 누르고 재면
       무엇을 해도 0 이라 <b>알람이 안 울렸습니다</b> — 되돌려 보고 알았습니다. */
  const mine = await A.p.evaluate(() => hmMsPeople().map(x => x.nm).join(','));
  await tap(A.p); await A.p.waitForTimeout(400);
  const care = await A.p.evaluate(() => ({ c: hmMsCare(), fin: hmQdoneAll().length,
    hit: hmQdoneAll().filter(k => hmMsPeople().some(x => k.indexOf(':' + x.id + ':') >= 0)).length }));
  is(care.hit > 0, '  <b>미션에 뽑힌 분</b>을 끝낸 뒤에 잰다 — ' + mine + ' 중 ' + care.hit + '분');
  is(care.c.done === 0,
     '  그래도 <b>「관리한 분」 으로는 안 센다</b> (1번) — ' + care.c.done + '/' + care.c.all +
     ' · 전화·카톡 기록이 따로 남아야 센다');

  console.log('\n[3] 이번 주 AP·PC 가 잡힌 <b>동네</b>를 앞으로 — 다만 차례는 안 뒤엎는다');
  const H = await A.p.evaluate(() => hmHotOf());
  is(H.list.length === 1 && H.list[0].rg === '순천' && H.list[0].n === 1,
     '  이번 주 상담이 잡힌 동네를 <b>센다</b> — ' + JSON.stringify(H.list));
  /* 같은 TA 둘(순천 · 광양) 중 <b>순천</b>이 앞서는가 */
  const ord = await A.p.evaluate(() => hmSteps().map(s => (s.t || '') + ':' + (s.region || '') + ':' + (s.tk || s.k)));
  const iSun = ord.findIndex(s => /홍길동C/.test(s)), iGwa = ord.findIndex(s => /홍길동D/.test(s));
  is(iSun >= 0 && iGwa >= 0 && iSun < iGwa,
     '  같은 TA 라면 <b>순천</b> 분이 앞선다 — ' + ord.filter(s => /TA/.test(s)).join(' / '));
  /* <b>급한 단계를 밀어내지 않는다</b> — 순천 부재(q5)가 광양 TA 를 앞지르면 안 된다 */
  const iBu = ord.findIndex(s => /홍길동E/.test(s));
  is(iBu > iGwa, '  그래도 <b>TA 가 부재보다 먼저</b>다 — 동네가 차례를 뒤엎지 않는다');
  const say = await A.p.evaluate(() => hmHotSay());
  is(/순천/.test(say) && /가는 김에/.test(say), '  띠에 <b>왜 이분인지</b> 적는다 — ' + say.replace(/<[^>]*>/g, ''));
  /* 약속이 <b>없는</b> 판 — 없는 동네를 지어내지 않는다 (1번) */
  const N = await open({ appt: '2000-01-01' });
  const nsay = await N.p.evaluate(() => hmHotSay());
  is(/없어/.test(nsay) && !/가는 김에/.test(nsay),
     '  약속이 없으면 <b>없다고</b> 적는다 — ' + nsay.replace(/<[^>]*>/g, ''));

  console.log('\n[4] ① 오늘의 알림이 <b>네 가지를 답한다</b> (사장님 말씀)');
  const B = await open({});
  await B.p.evaluate(() => { if (!hmFoldOpen('ms')) hmFoldToggle('ms'); });
  await B.p.waitForTimeout(300);
  const L = await B.p.evaluate(() => {
    hmMsJump(0); hmMsPaint();
    const rows = [...document.querySelectorAll('.hm-ma')];
    return { n: rows.length, first: rows[0] ? rows[0].innerText.replace(/\s+/g, ' ') : '',
             all: rows.map(e => e.innerText.replace(/\s+/g, ' ')).join(' ~ '),
             small: rows.filter(e => e.getBoundingClientRect().height < 44).length };
  });
  is(L.n > 0, '  줄이 <b>' + L.n + '개</b> 선다 — 칩 하나가 아니라 한 분씩 한 줄');
  is(/📞 전화|💬 카톡만/.test(L.first), '  ① <b>어떻게 접촉할지</b> — ' + (L.first.match(/📞 전화|💬 카톡만/) || [''])[0]);
  is(/🗂/.test(L.first), '  ② <b>DB종류</b> — ' + (L.first.match(/🗂 \S+/) || [''])[0]);
  is(/🎯/.test(L.first), '  ③ <b>어떻게 관리할지</b> — ' + (L.first.match(/🎯 [^🗂📍⏳📰]+/) || [''])[0].trim());
  is(/📰/.test(L.all), '  ④ <b>어떤 연락 드릴지</b> — ' + (L.all.match(/📰 [^~]+/) || [''])[0].trim().slice(0, 40));
  is(L.small === 0, '  줄이 <b>손가락으로 누를 만하다</b> — 44px 아래면 폰에서 빗나간다');
  /* 사장님 말씀 — 「이번주 상담 AP/PC 를 찾아내서 <b>그 지역의 10명</b>을
     매일 추천해서 약속 잡을수 있게」. 몇 분이 그 동네인지 <b>세어</b> 준다. */
  const hot = await B.p.evaluate(() => {
    const e = document.querySelector('.hm-ms-hot');
    return { txt: e ? e.innerText.replace(/\s+/g, ' ') : '', none: !!(e && e.classList.contains('none')) };
  });
  is(/순천/.test(hot.txt) && /\d+분/.test(hot.txt) && !hot.none,
     '  그 동네 분이 <b>오늘 몇 분</b>인지 센다 — ' + hot.txt);
  /* ⚠ <b>모자라면 모자란 대로.</b> 그 동네에 뽑힌 분이 없는데 있는 척하면
     사장님이 헛걸음하십니다 (1번). 순천 약속만 두고 <b>다른 동네 분</b>만
     뽑히는 판을 따로 세워 봅니다. */
  const G = await open({ far: true });
  await G.p.evaluate(() => { if (!hmFoldOpen('ms')) hmFoldToggle('ms'); hmMsJump(0); hmMsPaint(); });
  await G.p.waitForTimeout(300);
  const g = await G.p.evaluate(() => {
    const e = document.querySelector('.hm-ms-hot');
    return { txt: e ? e.innerText.replace(/\s+/g, ' ') : '', none: !!(e && e.classList.contains('none')) };
  });
  is(g.none && /지어내/.test(g.txt),
     '  그 동네 분이 <b>없으면 없다</b>고 적는다 — ' + g.txt);
  /* <b>거절하신 분께는 전화를 안 겁니다</b> — 말하는 자리가 HM_MS_POOL 한 곳 (5번) */
  const way = await B.p.evaluate(() => {
    const P = hmMsPeople();
    return P.map(x => x.k + '=' + ((HM_MS_POOL[x.k] || {}).call === false ? '카톡' : '전화')).join(' ');
  });
  is(/TA=전화/.test(way), '  <b>수단은 표 한 곳</b>에서 온다 (5번) — ' + way);
  /* 줄을 누르면 ②③④ 가 <b>그 분</b>으로 따라오는가 */
  const jump = await B.p.evaluate(() => {
    const rows = [...document.querySelectorAll('.hm-ma')];
    if (rows.length < 2) return { ok: false, why: '사람이 둘 미만' };
    rows[1].click();
    const a = HM_MSP.i;
    hmMsJump(1);
    const x = hmMsWho();
    return { ok: a === 1, at: a, nm: x ? x.nm : '',
             body: (document.getElementById('hmMsHost') || {}).innerText || '' };
  });
  await B.p.waitForTimeout(300);
  is(jump.ok, '  줄을 누르면 <b>그 분</b>으로 옮겨간다 — ' + (jump.why || ('' + jump.at + '번째')));
  is(jump.body.indexOf(jump.nm) >= 0, '  ② 도 <b>그 분</b>을 편다 — ' + jump.nm);

  console.log('\n[5] 아침 미션이 <b>「오늘 챙길 것」 안</b>에 있다 · 없어도 안 사라진다');
  /* ★ <b>#hmToday 안인지만 보면 안 됩니다.</b> #hmToday 는 카드를 감싸는
     껍데기라, 미션을 카드 <b>밖</b>으로 도로 빼내도 그 안에는 그대로 있어
     <b>알람이 안 울렸습니다</b> — 되돌려 보고 알았습니다 (8번). 사장님
     말씀은 「오늘 챙길것 + 아침 미션을 <b>하나로</b>」 였으니, 재야 할 것은
     <b>같은 카드 안</b>인가 입니다. */
  const inside = await B.p.evaluate(() => {
    const box = document.getElementById('hmFold_ms');
    const card = document.querySelector('#hmToday .hm-card');
    return { card: !!card, in: !!(box && card && card.contains(box)) };
  });
  is(inside.card && inside.in, '  <b>같은 카드 안</b>이다 — 아침에 두 곳을 안 본다');
  /* ⚠ <b>여기가 실제로 깨졌던 자리입니다.</b> 「오늘 뽑힌 분이 없다」 에서
     그냥 return 하는 바람에 조용한 아침에는 미션이 통째로 사라졌습니다. */
  const Z = await open({ none: true });
  const zs = await Z.p.evaluate(() => {
    const box = document.getElementById('hmFold_ms');
    return { has: !!box, txt: (document.getElementById('hmToday') || {}).innerText || '' };
  });
  is(zs.has, '  <b>뽑힌 분이 없어도</b> 아침 미션은 그대로 선다 — SNS·고객 보험은 사람이 없어도 한다');
  is(!/홍길동/.test(zs.txt), '  그때 <b>사람을 지어내지 않는다</b> (1번)');

  console.log('\n[6] 오늘 끝낸 표시는 <b>오늘만</b> — 날짜가 바뀌면 스스로 지운다');
  const d = await A.p.evaluate(() => {
    const before = hmQdoneAll().length;
    /* 어제 날짜로 적어 둔 것은 <b>오늘 것이 아니다</b> */
    localStorage.setItem('apex_hm_qdone_v1', JSON.stringify({ d: mcalShift(mcalToday(), -1), k: ['x:y:z'] }));
    return { before: before, after: hmQdoneAll().length };
  });
  is(d.before > 0, '  오늘 누른 것은 <b>남아 있다</b> — ' + d.before + '건');
  is(d.after === 0, '  <b>어제 것은 안 센다</b> — 아침마다 열 분이 새로 섭니다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 한 분씩 퀘스트 — 끝내면 다음 분으로.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
