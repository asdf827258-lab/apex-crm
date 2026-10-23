/* 지역 동선의 <b>고객 추천</b>이 팀원마다 제대로 되는가

   2026-10-23 · 판 X166 · 사장님 말씀 「지역 동선에서 고객 추천하는 부분들이
   <b>모든 팀원들이</b> 제대로 되는지 가장 중요하고」.

   <b>아무도 이것을 재지 않았습니다.</b> check-crmwrap 은 이름이 안 사라졌는지만
   보고, check-crmrun 은 실제로 눌러 보지만 <b>견본 고객이 전부 한 사람(u1)</b>
   앞으로 배정돼 있습니다. 그래서 「팀원 둘이 같은 지역에 각자 고객을 둔 상태」
   는 한 번도 서 본 적이 없습니다. 이 앱은 팀원 26명이 같이 씁니다.

   여기서 재는 것 —

     [1] 팀원 둘이 <b>같은 순천</b>에 각자 고객을 두었을 때
         · 둘 다 추천이 <b>뜬다</b>
         · 각자 <b>자기 고객만</b> 본다 — 남의 고객이 안 섞인다 (3번)
     [2] 담당자 칸이 <b>누구로 열리나</b>
         · 배정이 있는 팀원은 <b>자기</b>로
         · 배정이 0명인 사람(대표·새 팀원)은 <b>전체</b>로, 그리고
           <b>왜 그런지</b> 그 사람 이름으로 적어 준다
     [3] 빈손일 때 <b>무엇을 채우라고</b> 말하는가 (1번)
         · 지역을 모르면 아무나 추천하지 않는다
         · 그 지역에 혼자면 빈손이라고 말한다 — 남의 고객을 끌어오지 않는다

   ⚠ 만들 때 <b>제 흉내가 두 번 틀렸습니다.</b> 앱을 탓할 뻔했습니다 (8번) —
     ① eq 를 안 걸러 profiles 를 id 로 찾는 자리가 늘 첫 줄을 돌려줬습니다.
        누구로 들어가도 u1 로 로그인됐습니다.
     ② 넣은 줄을 안 돌려줘 앱의 wRows() 가 「0줄 바뀜」 으로 읽고
        <b>「권한이 없습니다」</b> 라고 했습니다.
     견본 서버가 진짜 서버처럼 굴지 않으면, 멀쩡한 앱이 고장나 보입니다. */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

const STUB = `(function(){
function D(id,who,rg,st,ex){
  var d={id:id,customer_name:'홍길동',phone:'010-0000-'+id.slice(1),
    region:rg,stage:st,assigned_to:who,created_by:who,assigned_date:'2026-07-01',
    created_at:'2026-07-01T00:00:00Z',next_appt:null,memo:'',
    addr:'',lat:null,lng:null,next_appt_place:null,next_appt_lat:null,next_appt_lng:null,
    region_code:null,sido:null,sigungu:null,dong:null,followup:null};
  for(var k in (ex||{}))d[k]=ex[k]; return d;
}
/* ★ 두 팀원이 <b>같은 순천</b>에 각자 고객을 둡니다 — 섞이면 바로 드러납니다 */
var DBS=[
  D('a1','u1','순천','TA'),      D('a2','u1','순천시','미접촉'),
  D('a3','u1','전남 순천시','TA'), D('a4','u1','순천시','미접촉'),
  D('b1','u2','순천','TA'),      D('b2','u2','순천시','미접촉'),
  D('b3','u2','전남 순천시','TA'),
  D('z1','','순천시','TA'),       /* 담당자가 비어 있는 줄 */
  /* ★ 고객은 있는데 <b>지역 칸이 빈</b> 팀원 — 실제로 제일 흔한 빈손입니다 */
  D('c1','u5','','TA'), D('c2','u5','','미접촉'), D('c3','u5','','TA'),
  /* ★ 그 지역에 <b>자기뿐인</b> 팀원 */
  D('e1','u6','목포시','TA')
];
var T={profiles:[{id:'u1',name:'홍팀원',role:'fp',active:true},
                 {id:'u2',name:'강팀원',role:'fp',active:true},
                 {id:'u3',name:'대표',role:'admin',active:true},
                 {id:'u4',name:'새팀원',role:'fp',active:true},
                 {id:'u5',name:'지역없음',role:'fp',active:true},
                 {id:'u6',name:'혼자팀원',role:'fp',active:true}],
       dbs:DBS,calls:[],attendance:[],teams:[],team_members:[],
       app_config:[{key:'kakao_js_key',value:'00000000000000000000000000000000'}],clients:[]};
function B(tbl){
  var rows=(T[tbl]||[]).slice(), one=false, b={};
  b.select=function(){ return b };
  ['eq','neq','in','gte','lte','gt','lt','is','like','ilike','not','or','order','limit','range','contains']
    .forEach(function(k){ b[k]=function(f,v){
      /* ★ eq 를 <b>실제로 걸러야</b> 합니다. 안 그러면 profiles 를 id 로 찾는
         자리가 늘 첫 줄을 돌려줘, 누구로 들어가도 u1 로 로그인됩니다 —
         제 흉내가 틀린 줄 모르고 앱을 탓할 뻔했습니다 (8번). */
      if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
      if(k==='in'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return (v||[]).indexOf(r[f])>=0});
      return b } });
  b.single=b.maybeSingle=function(){ one=true; return b };
  var op='', pay=null;
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(p){ op=k; pay=p; return b } });
  b.then=function(res,rej){
    if(op==='update'&&pay){ rows.forEach(function(r){ for(var k in pay)r[k]=pay[k] }) }
    if(op==='upsert'||op==='insert'){
      /* ★ <b>넣은 줄을 돌려줍니다</b> — 진짜 서버가 그렇게 합니다. 안 돌려주면
         앱의 wRows() 가 「0줄 바뀜」 으로 읽고 <b>「권한이 없습니다」</b> 라고
         합니다. 그걸 앱 고장으로 착각할 뻔했습니다 (8번). */
      var arr=Array.isArray(pay)?pay:(pay?[pay]:[]);
      arr.forEach(function(p){ (T[tbl]||(T[tbl]=[])).push(p) });
      rows=arr;
    }
    return Promise.resolve({data:one?(rows[0]||null):rows,error:null}).then(res,rej) };
  b.catch=function(f){ return b.then(function(x){return x},f) };
  return b;
}
var ME=(new URLSearchParams(location.search)).get('me')||'u1';
var U={id:ME,email:ME+'@example.com'}, S={user:U,access_token:'stub'};
window.supabase={createClient:function(){ return {
  auth:{ getSession:function(){return Promise.resolve({data:{session:S},error:null})},
         getUser:function(){return Promise.resolve({data:{user:U},error:null})},
         onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
         signOut:function(){return Promise.resolve({error:null})} },
  from:B, rpc:function(){ return Promise.resolve({data:[],error:null}) },
  channel:function(){ return {on:function(){return this},subscribe:function(){return this}} },
  removeChannel:function(){} } } };
})();`;

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();

  const open = async (me) => {
    const ctx = await br.newContext(CLK.ctxOpt());
    await CLK.pin(ctx, 14);
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    /* ★ 바깥을 <b>끊습니다</b> — 사장님 진짜 서버를 읽지 않습니다.
       204 로 채워 주기만 하면 「막았다」 고 할 수 없습니다 (check-netblock). */
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/pretendard/.test(u))   return r.fulfill({ contentType: 'text/css', body: '' });
      if (/route-km/.test(u)) return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' });
      if (/dapi\.kakao\.com/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{"errorType":"AccessDeniedError"}' });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.abort();
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=' + me, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
    await pg.waitForFunction(() => !!document.getElementById('rtBtn'), { timeout: 30000 });
    return { ctx, pg, errs };
  };
  const seen = (pg, sel) => pg.waitForFunction(
    s => { const e = document.querySelector(s); return !!(e && (e.offsetParent || e.classList.contains('open'))) },
    sel, { timeout: 15000 });

  const OWNER = { a: 'u1', b: 'u2', z: '' };
  /* 한 사람으로 들어가 「이 지역 열 명」 을 띄우고 누가 떴는지 본다 */
  const tenFor = async (me, anchor) => {
    const { ctx, pg, errs } = await open(me);
    await pg.evaluate(id => openCall(id), anchor);
    await seen(pg, '#callModal.open');
    await pg.evaluate(() => {
      document.getElementById('callResult').value = '상담';
      if (typeof toggleAppointment === 'function') toggleAppointment();
      document.getElementById('appointmentAt').value = '2026-09-08T14:00';
      saveCall();
    });
    let ids = [];
    const on = await seen(pg, '#rtNear.open').then(() => true, () => false);
    if (on) ids = await pg.evaluate(() => [...document.getElementById('rtNearB').querySelectorAll('[data-call]')]
      .map(e => e.getAttribute('data-call')));
    await ctx.close();
    return { on, ids, errs };
  };
  /* 지역 동선 화면을 열고 담당자 칸과 안내 글을 본다 */
  const routeFor = async (me) => {
    const { ctx, pg, errs } = await open(me);
    await pg.evaluate(() => { if (typeof apexRouteOpen === 'function') apexRouteOpen(); });
    await pg.waitForFunction(() => !!document.getElementById('rtOwner'), { timeout: 15000 });
    await pg.waitForTimeout(500);
    const R = await pg.evaluate(() => ({
      owner: document.getElementById('rtOwner').value,
      ownerTxt: (document.getElementById('rtOwner').selectedOptions[0] || {}).text || '',
      region: (document.getElementById('rtRegion').innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      body: (document.getElementById('rtWrap') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 600)
    }));
    await ctx.close();
    return { ...R, errs };
  };

  head('[1] 팀원 둘이 같은 「순천」에 각자 고객을 두었을 때');
  const A = await tenFor('u1', 'a1');
  const B2 = await tenFor('u2', 'b1');
  console.log('   홍팀원(u1) 이 본 열 명 : ' + (A.ids.join(',') || '(없음)'));
  console.log('   강팀원(u2) 가 본 열 명 : ' + (B2.ids.join(',') || '(없음)'));
  is(A.on && A.ids.length > 0, '홍팀원에게 추천이 <b>떴다</b>');
  is(B2.on && B2.ids.length > 0, '★ 강팀원에게도 추천이 <b>떴다</b>');
  is(A.ids.every(x => x[0] === 'a'), '홍팀원 목록에 <b>자기 고객만</b> 있다');
  is(B2.ids.every(x => x[0] === 'b'), '★ 강팀원 목록에 <b>자기 고객만</b> 있다 — 남의 고객이 안 섞인다 (3번)');
  is(!A.ids.some(x => x[0] === 'b'), '홍팀원에게 <b>강팀원 고객이 안 뜬다</b>');
  is(!B2.ids.some(x => x[0] === 'a'), '강팀원에게 <b>홍팀원 고객이 안 뜬다</b>');

  head('[2] 담당자 칸이 누구로 열리나');
  for (const [me, want, nm] of [['u1','u1','홍팀원'],['u2','u2','강팀원'],['u3','','대표(배정 0명)'],['u4','','새팀원(배정 0명)']]) {
    const R = await routeFor(me);
    const all = /팀 전체를 보고 있습니다/.test(R.body);
    console.log('   ' + nm.padEnd(16) + ' 담당자=「' + (R.ownerTxt || '전체') + '」  팀전체안내=' + (all ? '있음' : '없음'));
    is(R.owner === want, '   ' + nm + ' 은 담당자 칸이 ' + (want ? '<b>자기</b>' : '<b>전체</b>') + ' 로 열린다');
    if (!want) is(all, '   ' + nm + ' 에게 <b>왜 전체인지</b> 적어 준다');
    if (!want) is(new RegExp(nm.split('(')[0] + ' 님 이름으로').test(R.body),
      '   ★ 그 안내가 <b>그 사람 이름</b>으로 적힌다 — 팀원에게 「사장님 이름으로」 라고 하지 않는다');
  }

  head('[3] 빈손일 때 <b>무엇을 채우라고</b> 말하는가 (1번)');
  const txtFor = async (me, id) => {
    const { ctx, pg } = await open(me);
    await pg.evaluate(i => openCall(i), id);
    await seen(pg, '#callModal.open');
    await pg.evaluate(() => {
      document.getElementById('callResult').value = '상담';
      if (typeof toggleAppointment === 'function') toggleAppointment();
      document.getElementById('appointmentAt').value = '2026-09-08T14:00';
      saveCall();
    });
    const on = await seen(pg, '#rtNear.open').then(() => true, () => false);
    const t = on ? await pg.evaluate(() => document.getElementById('rtNearB').innerText.replace(/\s+/g,' ')) : '';
    const ids = on ? await pg.evaluate(() => [...document.getElementById('rtNearB').querySelectorAll('[data-call]')].map(e=>e.getAttribute('data-call'))) : [];
    await ctx.close();
    return { on, t, ids };
  };
  const C = await txtFor('u5', 'c1');
  console.log('   지역없음(u5) — 창 ' + (C.on ? '뜸' : '안 뜸') + ' · 목록 ' + (C.ids.join(',') || '(없음)'));
  console.log('      글: ' + C.t.slice(0, 150));
  is(C.on, '지역이 비어도 <b>창은 뜬다</b> — 아무 일도 안 일어난 것처럼 두지 않는다');
  is(!C.ids.length, '지역을 모르면 <b>아무나 추천하지 않는다</b> (1번)');
  is(/지역/.test(C.t) && /맞춰|채우|적어/.test(C.t),
     '무엇을 <b>채워야 하는지</b> 말한다 — 「지역 칸을 …」');

  const E = await txtFor('u6', 'e1');
  console.log('   혼자팀원(u6) — 목록 ' + (E.ids.join(',') || '(없음)'));
  is(E.on && !E.ids.length, '그 지역에 혼자면 <b>빈손이라고 말한다</b> — 남의 고객을 끌어오지 않는다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 팀원마다 자기 고객만 추천됩니다');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
