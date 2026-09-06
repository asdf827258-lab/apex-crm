/* CRM 에 얹은 것이 <b>실제로 도는가</b> — 브라우저를 띄워 눌러 본다.

   `check-crmwrap.js` 는 글자만 봅니다. 이름이 그대로 있는지는 알지만,
   <b>눌렀을 때 실제로 뜨는지</b>는 모릅니다. 이름은 그대로 두고 안쪽만
   어긋나면 그 점검은 조용히 통과합니다.

   그래서 여기서는 db-crm.html 을 <b>진짜로 띄우고</b>, 통화를 저장하고,
   단계를 올리고, 알림을 그려 봅니다. 서버(supabase-js)만 견본으로
   갈아 끼웁니다 — 나머지는 저장소의 진짜 파일 그대로입니다.
   견본 고객 이름은 언제나 「홍길동」입니다 (3번).

   못 박는 것 —

     ① 마이그레이션을 <b>안 돌린 서버</b>에서도 원래 화면이 그대로 돈다.
        이게 깨지면 사장님이 아침에 CRM 을 못 엽니다. 콘솔 에러 0건.
     ② 「순천」·「순천시」·「전남 순천시」가 <b>한 지역</b>으로 묶인다.
        갈라지면 「이 지역 열 명」에 사람이 덜 뜨고, 사장님은 그걸
        <b>「원래 그 지역에 사람이 없구나」</b> 로 읽습니다. 그게 제일 나쁩니다.
        그러면서 <b>「여수」는 안 섞여야</b> 합니다 — 시험에서 여수가
        순천시로 바뀌려 했던 자리입니다.
     ③ 지도를 <b>한 번도 안 연</b> 사람에게도 창에 CSS 가 붙는다.
     ④ 이동시간은 <b>「어림」</b>이라고 화면에 적는다 — 직선거리로 셉니다.
     ⑤ 계약 후 관리는 <b>한 사람에 한 장</b>. 네 장씩 쏟아지면 안 봅니다.
     ⑥ 계약일이 빈 사람을 <b>몇 명인지 적는다</b> — 조용히 빠뜨리지 않는다.
     ⑦ 마이그레이션을 <b>돌리면</b> 스스로 켠다.
     ⑧ PC·CS 에서도 뜨고, 단계마다 <b>다른 말</b>이 나온다.

   기다림은 <b>시간이 아니라 조건</b>으로 겁니다. 「1.8초 뒤에 있겠지」로
   재면 CI 가 바쁜 날 헛것을 잡습니다 — 그런 점검은 안 잡는 것보다
   나쁩니다 (8번).                                                    */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ── 견본 서버 ─────────────────────────────────────────────────
   진짜 supabase-js 대신 이 글이 브라우저에 들어갑니다. 지역을 일부러
   섞어 두고, 마이그레이션 전/후를 ?mig= 하나로 갈아 끼웁니다. */
const STUB = `(function(){
var MIG=(new URLSearchParams(location.search)).get('mig')==='1';
function D(id,rg,st,ex){
  var d={id:id,customer_name:'홍길동',phone:'010-0000-'+id.slice(1),
    region:rg,stage:st,assigned_to:'u1',created_by:'u1',assigned_date:'2026-07-01',
    created_at:'2026-07-01T00:00:00Z',next_appt:null,memo:''};
  for(var k in (ex||{}))d[k]=ex[k]; return d;
}
var DBS=[D('d1','순천','TA'),D('d2','순천시','미접촉'),D('d3','전남 순천시','TA'),
 D('d4','전라남도 순천시','AP',{lat:34.95,lng:127.49,addr:'순천시 조례동'}),D('d5','여수','TA'),D('d6','여수시','미접촉'),
 D('d7','광양시','계약완료',{contracted_at:'2026-08-05'}),
 D('d8','광양','증권전달',{contracted_at:'2025-09-05',policy_sent_at:'2025-09-20'}),
 D('d9','','계약완료'),D('d10','서울특별시 강남구','TA'),
 D('d11','순천시','계약완료',{contracted_at:'2026-08-25'}),
 /* 지역 칸에 주소가 통째로 든 줄 — 지금은 자기 도시에 안 뜬다 */
 D('d12','여수시 조례동 343 근처(자택)','TA'),
 D('d13','학동 근처(자택)','TA'),            /* 「동구」로 바뀌려 하는 자리 — 손대면 안 된다 */
 D('d14','순천시 생목동','TA',{addr:'이미 적어 둔 동네'}),
 D('d15','동구 어딘가(자택)','TA'),        /* 한 글자 가드만 막는 자리 — 맨 앞이긴 하다 */
 D('d16','조례동 순천 시청 앞(자택)','TA')]; /* 맨 앞 가드만 막는 자리 — 이름은 두 글자다 */
if(MIG)DBS.forEach(function(d){ if(d.addr===undefined)d.addr='';
  if(d.lat===undefined){d.lat=null;d.lng=null}
  d.next_appt_place=null;d.next_appt_lat=null;d.next_appt_lng=null;
  d.region_code=null;d.sido=null;d.sigungu=null;d.dong=null;d.followup=null });
var CALLS=[{id:'c1',db_id:'d5',created_by:'u1',result:'부재',call_at:'2026-09-01T01:00:00Z',appointment_at:null,memo:''},
           {id:'c2',db_id:'d3',created_by:'u1',result:'부재',call_at:'2026-08-20T02:00:00Z',appointment_at:null,memo:''}];
if(MIG)CALLS.forEach(function(c){ c.appt_place=null;c.appt_lat=null;c.appt_lng=null });
var T={profiles:[{id:'u1',name:'홍길동',role:'admin',active:true}],dbs:DBS,calls:CALLS,
       attendance:[],teams:[],team_members:[],
       /* 키가 <b>있는</b> 서버 — 카카오가 거절했을 때 화면이 이유를 적는지 보려면 필요하다 */
       app_config:[{key:'kakao_js_key',value:'00000000000000000000000000000000'}],clients:[]};
/* 칸이 없는 서버 흉내 — 없는 칸을 고르면 에러를 돌려준다 */
var NEW={dbs:['addr','lat','lng','next_appt_place','next_appt_lat','next_appt_lng',
              'region_code','sido','sigungu','dong','followup'],
         calls:['appt_place','appt_lat','appt_lng']};
function miss(tbl,cols){ if(MIG)return null;
  var b=(NEW[tbl]||[]).filter(function(c){return cols.indexOf(c)>=0});
  return b.length?{message:'column '+tbl+'.'+b[0]+' does not exist',code:'42703'}:null }
function B(tbl){
  var rows=(T[tbl]||[]).slice(), err=null, one=false, b={};
  b.select=function(c){ err=miss(tbl,String(c||'*').split(',').map(function(x){return x.trim()})); return b };
  ['eq','neq','in','gte','lte','gt','lt','is','like','ilike','not','or','order','limit','range','contains']
   .forEach(function(k){ b[k]=function(f,v){
     if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
     if(k==='in'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return (v||[]).indexOf(r[f])>=0});
     return b } });
  b.single=b.maybeSingle=function(){ one=true; return b };
  /* <b>쓰면 실제로 바뀐다.</b> 안 그러면 「누르기 전에는 안 바뀐다」 같은
     단정을 아예 잴 수 없다 — 미리 바꿔 버려도 화면이 똑같아 알람이
     안 울린다 (8번). rows 는 원본 객체를 가리키므로 고치면 남는다. */
  var op='', pay=null;
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(p){
    err=miss(tbl,p?Object.keys(Array.isArray(p)?(p[0]||{}):p):[]);
    op=k; pay=p; return b } });
  b.then=function(res,rej){
    if(!err&&op==='update'&&pay){ rows.forEach(function(r){ for(var k in pay)r[k]=pay[k] }) }
    if(!err&&(op==='upsert'||op==='insert')&&pay&&!Array.isArray(pay)){
      var all=T[tbl]||(T[tbl]=[]), hit=null;
      all.forEach(function(r){ if(r.key!==undefined&&r.key===pay.key)hit=r });
      if(hit){ for(var k2 in pay)hit[k2]=pay[k2] } else all.push(pay);
    }
    return Promise.resolve(
      err?{data:null,error:err}:{data:one?(rows[0]||null):rows,error:null}).then(res,rej) };
  b.catch=function(f){ return b.then(function(x){return x},f) };
  return b;
}
/* 몇 건인지는 여기 한 곳만 안다 — 점검 쪽에 또 적으면 견본을 늘릴 때마다
   두 곳을 고쳐야 하고, 한 곳을 잊으면 멀쩡한데 빨간불이 켜진다 (5번) */
window.__STUB__={dbs:DBS.length,calls:CALLS.length};
var U={id:'u1',email:'hong@example.com'}, S={user:U,access_token:'stub'};
window.supabase={createClient:function(){ return {
  from:function(t){return B(t)},
  auth:{ onAuthStateChange:function(cb){ setTimeout(function(){cb('SIGNED_IN',S)},0);
           return {data:{subscription:{unsubscribe:function(){}}}} },
    getSession:function(){return Promise.resolve({data:{session:S},error:null})},
    getUser:function(){return Promise.resolve({data:{user:U},error:null})},
    signInWithPassword:function(){return Promise.resolve({error:null})},
    signUp:function(){return Promise.resolve({error:null})},
    signOut:function(){return Promise.resolve({error:null})} },
  channel:function(){return {on:function(){return this},subscribe:function(){return this},unsubscribe:function(){}}},
  removeChannel:function(){}
}}};
})();`;


/* ── 카카오 지도 견본 ─────────────────────────────────────────────
   진짜 dapi.kakao.com 은 이 통에서 못 닿습니다. 그런데 <b>가드가 실제로
   도는지</b>는 카카오가 무어라 답하는지에 달려 있어, 안 세우면 그 자리를
   못 잽니다. 그래서 답을 우리가 정하는 견본을 세웁니다.

     「여수시 …」  → 카카오도 여수시   (글 안에 이름이 있다 → 받아들임)
     「학동」      → 카카오는 광주 동구 (글 안에 없다 → 손대면 안 됨)      */
const KAKAO_STUB = `
window.kakao=window.kakao||{};kakao.maps=kakao.maps||{};
kakao.maps.load=function(cb){cb&&cb()};
kakao.maps.services={
  Status:{OK:'OK',ZERO_RESULT:'ZERO_RESULT'},
  Geocoder:function(){
    this.addressSearch=function(q,cb){
      var t=String(q||'').replace(/\\s+/g,'');
      if(t.indexOf('여수')>=0)  return cb([{y:34.760,x:127.662,address_name:q}],'OK');\n      if(t.indexOf('동구')>=0)  return cb([{y:35.146,x:126.923,address_name:q}],'OK');
      if(t.indexOf('학동')>=0)  return cb([{y:35.146,x:126.923,address_name:q}],'OK');
      if(t.indexOf('순천')>=0)  return cb([{y:34.950,x:127.487,address_name:q}],'OK');
      return cb([],'ZERO_RESULT');
    };
    this.coord2RegionCode=function(lng,lat,cb){
      var v;
      if(Math.abs(lat-34.760)<0.01) v={region_1depth_name:'전라남도',region_2depth_name:'여수시',region_3depth_name:'조례동',code:'4613010100'};
      else if(Math.abs(lat-35.146)<0.01) v={region_1depth_name:'광주광역시',region_2depth_name:'동구',region_3depth_name:'학동',code:'2911010700'};
      else v={region_1depth_name:'전라남도',region_2depth_name:'순천시',region_3depth_name:'생목동',code:'4615010600'};
      v.region_type='B'; cb([v],'OK');
    };
  },
  Places:function(){ this.keywordSearch=function(q,cb){ cb([],'ZERO_RESULT') } }
};
kakao.maps.Map=function(el,o){this.setBounds=function(){};this.relayout=function(){};
  var c=(o&&o.center)||{a:34.760,b:127.662};
  this.getCenter=function(){return {getLat:function(){return c.a},getLng:function(){return c.b}}}};
kakao.maps.LatLng=function(a,b){this.a=a;this.b=b};
kakao.maps.LatLngBounds=function(){this.extend=function(){}};
kakao.maps.CustomOverlay=function(){this.setMap=function(){}};
kakao.maps.Polyline=function(){this.setMap=function(){}};
`;

/* 우리가 낸 에러만 셉니다 — 견본이 막아 둔 바깥 주소는 에러가 아닙니다 */
const hardErr = (e) => e.filter(x => !/favicon|net::ERR|Failed to load resource|204/i.test(x));

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

  /* kakao=false 면 카카오가 거절한 것과 같은 꼴이 된다 — [9] 가 그것을 잰다.
     kakao=true 면 견본 SDK 가 붙어 지오코딩이 실제로 돈다 — [10] 이 그것을 쓴다. */
  const open = async (mig, kakao) => {
    const ctx = await br.newContext(), pg = await ctx.newPage();
    const errs = [], logs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    pg.on('console', m => { logs.push(m.text()); if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.route('**/*', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/pretendard/.test(u))   return r.fulfill({ contentType: 'text/css', body: '' });
      if (/dapi\.kakao\.com/.test(u)) return kakao ? r.fulfill({ contentType: 'text/javascript', body: KAKAO_STUB })
                                                    : r.fulfill({ status: 401, contentType: 'application/json', body: '{"errorType":"AccessDeniedError"}' });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + '/db-crm.html?mig=' + (mig ? 1 : 0), { waitUntil: 'domcontentloaded' });
    /* 자료가 들어올 때까지 — 시간이 아니라 조건으로 기다린다 */
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } },
                             { timeout: 30000 });
    /* 얹은 두 파일이 원본을 다 감쌀 때까지 */
    await pg.waitForFunction(() => !!document.getElementById('rtBtn'), { timeout: 30000 });
    return { ctx, pg, errs, logs };
  };
  const seen = (pg, sel) => pg.waitForFunction(
    s => { const e = document.querySelector(s); return !!(e && (e.offsetParent || e.classList.contains('open'))) },
    sel, { timeout: 15000 });

  /* ─── 마이그레이션을 안 돌린 서버 ─────────────────────────── */
  let { ctx, pg, errs, logs } = await open(false, false);

  head('[1] 마이그레이션을 <안 돌린> 상태에서도 원래 화면이 그대로 돈다');
  const g = await pg.evaluate(() => { const v = n => { try { return eval(n) } catch (e) { return null } };
    return { dbs: (v('dbs') || []).length, calls: (v('calls') || []).length, want: window.__STUB__,
      on: !document.getElementById('app').classList.contains('hidden'),
      gone: ['openDb','saveDb','openCall','saveCall','toggleAppointment','renderTouch','loadAll','copyText']
              .filter(n => typeof window[n] !== 'function') };
  });
  is(g.dbs === g.want.dbs && g.calls === g.want.calls,
     g.dbs === g.want.dbs && g.calls === g.want.calls
       ? ('원래 목록이 <하나도 안 빠지고> 들어왔다 — dbs ' + g.dbs + '건 · calls ' + g.calls + '건')
       : ('목록이 줄었다 — dbs ' + g.dbs + '/' + g.want.dbs + ' · calls ' + g.calls + '/' + g.want.calls));
  is(g.on, '원래 화면이 <떠 있다>');
  is(g.gone.length === 0, g.gone.length ? ('감싼 뒤 사라진 함수 — ' + g.gone.join(' · ')) : '감싼 여덟 함수를 <그대로 부를 수 있다>');
  is(logs.some(l => /apex-route.*칸이 없습니다/.test(l)) && logs.some(l => /apex-care.*칸이 없습니다/.test(l)),
     '칸이 없으면 <스스로 접고> 무엇을 돌리면 되는지 적는다');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '콘솔 에러 <0건>');

  head('[2] 「순천」·「순천시」·「전남 순천시」가 <한 지역>으로 묶인다');
  errs.length = 0;
  await pg.evaluate(() => openCall('d1'));
  await seen(pg, '#callModal.open');
  await pg.evaluate(() => {
    document.getElementById('callResult').value = '상담';
    if (typeof toggleAppointment === 'function') toggleAppointment();
    document.getElementById('appointmentAt').value = '2026-09-08T14:00';
    saveCall();
  });
  await seen(pg, '#rtNear.open');
  const near = await pg.evaluate(() => {
    const b = document.getElementById('rtNearB');
    return { ids: [...b.querySelectorAll('[data-call]')].map(e => e.getAttribute('data-call')),
             css: !!document.getElementById('rtCss') };
  });
  const got = near.ids;
  is(['d2','d3','d4'].every(x => got.includes(x)),
     '「순천」·「순천시」·「전남 순천시」·「전라남도 순천시」가 <같이> 떴다 (' + got.join(',') + ')');
  is(!got.includes('d5') && !got.includes('d6'), '<「여수」는 안 섞였다> — 시험에서 순천시로 바뀌려 했던 자리');
  is(!got.includes('d7') && !got.includes('d8') && !got.includes('d9') && !got.includes('d11'),
     '계약까지 간 사람은 <빠졌다> — 같은 순천에 사는 계약완료(d11)도 안 뜬다');
  is(!got.includes('d1'), '자기 자신은 <안 뜬다>');

  head('[3] 지도를 <한 번도 안 열어도> 창에 CSS 가 붙는다 — 밟았던 지뢰');
  is(near.css, '창을 열 때 <styles() 를 먼저> 불렀다 — rtCss 가 붙었다');

  head('[4] 이동시간은 <「어림」이라고> 화면에 적는다 — 직선거리로 셉니다');
  await pg.evaluate(() => document.getElementById('rtNearMap').click());
  await pg.waitForFunction(() => !!document.getElementById('rtWrap'), { timeout: 15000 });
  const t4 = await pg.evaluate(() => document.getElementById('rtWrap').innerText);
  is(/어림/.test(t4), '화면에 <「어림」>이라고 적혀 있다 — 길찾기 서버가 아니라 직선거리다');

  head('[5] 계약 후 관리 — <한 사람에 한 장>');
  await pg.evaluate(() => { const m = document.getElementById('rtNear'); if (m) m.classList.remove('open'); renderTouch(); });
  await pg.waitForFunction(() => !!document.getElementById('careWrap'), { timeout: 15000 });
  const care = await pg.evaluate(() => {
    const w = document.getElementById('careWrap');
    const k = [...w.querySelectorAll('[data-cr-open]')].map(e => e.getAttribute('data-cr-open'));
    return { keys: k, who: k.map(x => x.split('__')[0]), txt: w.innerText };
  });
  is(care.keys.length > 0, '원래 「오늘의 알림」 자리에 <같이> 떴다 — 새 화면을 안 만들었다');
  is(care.who.length === new Set(care.who).size,
     '사람마다 <한 장씩> — ' + care.keys.join(' · '));
  is(/지나갔습니다/.test(care.txt), '지나간 시점은 <한 줄로만> 적는다');

  head('[6] 없는 값을 <지어내지 않는다>');
  is(/이 브라우저/.test(care.txt), '칸이 없으면 <「이 브라우저에만 남는다」>고 적는다 — 실패를 성공처럼 말하지 않는다');
  is(/계약일이 비어 있는 고객이/.test(care.txt), '계약일이 <비어 있는 사람>을 세어 적는다 — 조용히 빠뜨리지 않는다');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('만지는 동안 콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '여기까지 콘솔 에러 <0건>');
  await ctx.close();

  /* ─── 마이그레이션을 돌린 서버 ────────────────────────────── */
  ({ ctx, pg, errs, logs } = await open(true, false));

  head('[7] 마이그레이션을 <돌린> 뒤에는 스스로 켠다');
  is(!logs.some(l => /칸이 없습니다/.test(l)), '「칸이 없습니다」를 <더는 안 적는다>');
  is(await pg.evaluate(() => !!document.getElementById('apptPlaceField')), '통화 기록 창에 <만날 장소> 칸이 생겼다');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '콘솔 에러 <0건>');

  head('[8] PC·CS 에서도 <그 지역 열 명> — 단계마다 말이 다르다');
  /* PC·CS 는 통화 결과가 아니라 <b>DB 창의 단계 칸</b>으로 올립니다 */
  const stageSave = async (id, st) => {
    await pg.evaluate(() => { const m = document.getElementById('rtNear'); if (m) m.classList.remove('open') });
    await pg.evaluate(x => openDb(x), id);
    await seen(pg, '#dbModal.open');
    await pg.evaluate(x => { document.getElementById('dbStage').value = x;
      if (typeof stagePick === 'function') stagePick(); saveDb() }, st);
    /* 안 뜨면 여기서 멈추지 말고 <b>안 떴다고 답한다</b> — 그래야 어느
       단계가 죽었는지 화면에 남는다 */
    const on = await seen(pg, '#rtNear.open').then(() => true, () => false);
    if (!on) return { on: false, t: '', care: false };
    return pg.evaluate(() => ({ on: true,
      t: document.getElementById('rtNearB').innerText.slice(0, 300),
      care: !document.getElementById('rtNearCare').classList.contains('hidden') }));
  };
  const PC = await stageSave('d2', 'PC'), CS = await stageSave('d3', 'CS');
  is(PC.on && CS.on, PC.on && CS.on ? 'PC·CS 로 올려 저장하니 <열 명이 떴다>'
     : ('안 떠는 단계 — ' + [!PC.on ? 'PC' : '', !CS.on ? 'CS' : ''].filter(Boolean).join(' · ')));
  is(PC.t !== CS.t, '단계마다 <다른 말>이 나온다 — 삼항 사슬이 아니라 표 하나로 갈린다');
  is(CS.care && !PC.care, 'CS 에서만 <「계약 후 관리 미리보기」>가 뜬다');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '끝까지 콘솔 에러 <0건>');

  head('[9] 카카오가 <거절하면 이유를 적는다> — 단추가 안 먹는 것처럼 보이던 자리');
  /* 견본 서버에 키는 있지만 우리 라우팅이 dapi.kakao.com 을 막아 두었으므로
     SDK 로드는 반드시 실패한다 — 실제 사장님 화면에서 난 일과 같은 꼴이다
     (401 domain mismatched). 그때 화면이 <b>왜</b> 안 되는지 말해야 한다. */
  await pg.evaluate(() => { const b = document.getElementById('rtBtn'); if (b) b.click() });
  /* <b>빨간 상자만</b> 본다. 화면 전체를 보면 아래 발급 안내문에 있는 같은
     낱말에 걸려, 상자가 비어도 통과해 버린다 — 안 울리는 알람이 된다 (8번). */
  const nokey = await pg.waitForFunction(() => {
    const e = document.getElementById('rtNokey');
    if (!e || e.classList.contains('hidden')) return null;
    const box = e.querySelector('.rt-card');
    return box && box.innerText.length > 0 ? box.innerText : null;
  }, { timeout: 20000 }).then(h => h.jsonValue(), () => '');
  is(/카카오가 거절/.test(nokey), '「키는 들어갔는데 <카카오가 거절했습니다>」라고 적는다');
  is(nokey.includes(new URL(pg.url()).origin),
     '등록해야 할 <이 주소>를 그대로 보여 준다 — 외워서 옮겨 적지 않게');
  is(/카카오맵/.test(nokey) && /사용함/.test(nokey),
     '막히는 자리 <둘>을 짚는다 — 도메인 등록 · 카카오맵 켜기');
  is(!/키를 다시 만/.test(nokey) || /다시 만들 필요는 없/.test(nokey),
     '<키를 다시 만들라고 하지 않는다> — 키는 멀쩡한데 헛수고를 시키는 자리다');

  await ctx.close();

  /* ─── 카카오가 답하는 서버 ─────────────────────────────────── */
  ({ ctx, pg, errs, logs } = await open(true, true));

  head('[10] 지역 칸에 든 <주소를 살린다> — 지우지 않고 옮긴다');
  await pg.evaluate(() => { const b = document.getElementById('rtBtn'); if (b) b.click() });
  await pg.waitForFunction(() => !!document.getElementById('rtAddr'), { timeout: 20000 });
  const before = await pg.evaluate(() => {
    const v = n => { try { return eval(n) } catch (e) { return [] } };
    const f = id => (v('dbs') || []).filter(d => d.id === id)[0] || {};
    return { d12: f('d12'), d13: f('d13'), d14: f('d14') };
  });
  await pg.evaluate(() => document.getElementById('rtAddr').click());
  const plan = await pg.waitForFunction(() => {
    const m = document.getElementById('rtTidy2');
    if (!m || !m.classList.contains('open')) return null;
    const b = document.getElementById('rtTidyB');
    return b && b.innerText.length > 0 ? b.innerText : null;
  }, { timeout: 25000 }).then(h => h.jsonValue(), () => '');

  is(/여수시 조례동/.test(plan), '지역 칸에 <주소가 든 줄>을 찾아냈다');
  is(/여수시/.test(plan.split('그대로 두는 것')[0] || ''),
     '카카오가 답한 <「여수시」로 지역을 바로잡겠다>고 미리 보여 준다');
  /* ★ 여수가 순천시로 바뀌려 했던 그 가드 — 「학동」은 전국에 여러 개다 */
  const kept = plan.split('그대로 두는 것')[1] || '';
  is(/학동/.test(kept) && /동구/.test(kept),
     '<「학동 근처」를 손대지 않는다> — 「동구」는 광역시마다 있어 한 글자로 겹치면 다 통과해 버린다');
  is(!/생목동/.test(plan),
     '<이미 동네 칸이 적힌 줄은 건드리지 않는다> — 사람이 적어 둔 것을 안 덮는다');
  /* 가드 둘을 <b>따로</b> 잰다. 한 자리만 재면 다른 가드가 대신 막아 주어,
     하나를 빼도 빨간불이 안 켜진다 — 안 울리는 알람이 된다 (8번). */
  is(/동구 어딘가/.test(kept) && /여러 시에 다 있는/.test(kept),
     '① <한 글자 이름은 안 쓴다> — 「동구」는 광역시마다 있다');
  is(/조례동 순천/.test(kept) && /시작하지 않습니다/.test(kept),
     '② <맨 앞에 있어야 이름이다> — 가운데서 겹친 글자는 도시 이름이 아니다');

  const after = await pg.evaluate(() => {
    const v = n => { try { return eval(n) } catch (e) { return [] } };
    return ((v('dbs') || []).filter(d => d.id === 'd12')[0] || {}).addr || '';
  });
  is(!after && !before.d12.addr,
     '<누르기 전에는 아무것도 안 바뀐다> — 먼저 보여 주고, 누르면 그때 씁니다');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '끝까지 콘솔 에러 <0건>');

  head('[11] 위치는 <한 글자도 안 치고> 잡힌다 — 타이핑이 병목이었다');
  await pg.evaluate(() => { const m = document.getElementById('rtNear'); if (m) m.classList.remove('open') });
  await pg.evaluate(() => openDb('d1'));
  await seen(pg, '#dbModal.open');
  await pg.evaluate(() => document.getElementById('dbAddrFind').click());
  await seen(pg, '#rtPick.open');
  /* 손을 얹는 것은 80ms 뒤다. 그 전에 재면 얹든 안 얹든 똑같이 보여
     이 자리를 아예 못 잰다 — 안 울리는 알람이 된다 (8번). */
  await pg.waitForTimeout(400);
  const ways = await pg.evaluate(() => {
    const m = document.getElementById('rtPick');
    return { here: !!document.getElementById('rtPickHere'),
             map: !!document.getElementById('rtPickMapBtn'),
             /* 폰에서 키보드가 먼저 올라오면 타이핑을 없앤 뜻이 없다 */
             focused: document.activeElement && document.activeElement.id === 'rtPickQ',
             t: m.innerText };
  });
  is(ways.here && ways.map, '<안 쳐도 되는 길 둘>이 창에 있다 — 📍 지금 여기 · 🗺️ 지도에서 찍기');
  is(!ways.focused, '<글칸에 손을 안 얹는다> — 폰에서 키보드가 화면 절반을 먹지 않게');
  is(/지금 계신 곳/.test(ways.t) || /만난 자리/.test(ways.t),
     '「지금 여기」가 <무엇을 적는 것인지> 밝힌다 — 사무실에서 누르면 사무실이 적힌다');

  /* 지도에서 찍기 — 한 글자도 안 치고 동네 이름까지 들어오는가 */
  await pg.evaluate(() => document.getElementById('rtPickMapBtn').click());
  await pg.waitForFunction(() => {
    const b = document.getElementById('rtPickMapBox');
    return b && !b.classList.contains('hidden');
  }, { timeout: 15000 });
  await pg.evaluate(() => document.getElementById('rtPickMapGo').click());
  const pick = await pg.waitForFunction(() => {
    const v = document.getElementById('dbAddr');
    return v && v.value ? { addr: v.value, region: (document.getElementById('region') || {}).value } : null;
  }, { timeout: 15000 }).then(h => h.jsonValue(), () => null);
  is(!!pick, '지도에서 찍으니 <동네 칸이 채워졌다> — 친 글자 0개');
  /* 지도는 출발지(없으면 순천)에서 열린다 — 거기서 찍으면 순천이 나오는 것이 맞다 */
  is(!!pick && /순천시/.test(pick.addr) && /생목동/.test(pick.addr),
     '카카오가 답한 <시·군·구 + 동>이 그대로 들어왔다 (' + (pick ? pick.addr : '') + ')');
  is(!!pick && pick.region === '순천시',
     '<지역 칸도 같이> 맞춰졌다 — 다시 갈라지지 않게 (' + (pick ? pick.region : '') + ')');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '끝까지 콘솔 에러 <0건>');

  head('[12] 그 목록에서 <바로 찍고 바로 내비> — 따로 정리하는 시간을 없앤다');
  await pg.evaluate(() => { const m = document.getElementById('rtPick'); if (m) m.classList.remove('open') });
  await pg.evaluate(() => { const m = document.getElementById('dbModal'); if (m) m.classList.remove('open') });
  /* 순천 사람으로 연다 — 견본 지도가 순천에서 열리므로, 찍은 자리와
     적힌 지역이 같은 시가 되어 행정구역까지 들어가는 길을 잴 수 있다.
     다른 시가 나오는 길(좌표만 넣고 행정구역은 비움)은 [10] 이 잰다. */
  const near12 = await stageSave('d2', 'AP');
  is(near12.on, '단계를 올리니 <그 지역 사람들이> 다시 떴다');
  const row = await pg.evaluate(() => {
    const b = document.getElementById('rtNearB');
    const pin = [...b.querySelectorAll('[data-pin]')].map(e => e.getAttribute('data-pin'));
    const nav = [...b.querySelectorAll('a[href*="map.kakao.com/link/to"]')].map(e => e.getAttribute('href'));
    return { pin: pin, nav: nav, t: b.innerText };
  });
  is(row.pin.length > 0, '위치를 모르는 사람 줄에 <📍 동네> 단추가 있다 (' + row.pin.join(',') + ')');
  is(/동네 모름/.test(row.t), '<「동네 모름」>이라고 적어 준다 — 왜 거리가 안 뜨는지 알 수 있게');
  is(row.nav.length > 0 && /34\.95/.test(row.nav.join(' ')),
     '좌표가 있는 사람은 <🧭 내비> 로 바로 넘어간다 — 그 사람의 실제 좌표로');
  is(!row.pin.includes('d4'), '좌표가 <이미 있는 사람에게는> 📍 를 안 띄운다');

  /* 눌러서 실제로 저장되는가 — 견본 서버가 쓰기를 반영하므로 잴 수 있다 */
  await pg.evaluate(() => document.querySelector('#rtNearB [data-pin]').click());
  await seen(pg, '#rtPick.open');
  await pg.evaluate(() => document.getElementById('rtPickMapBtn').click());
  await pg.waitForFunction(() => {
    const b = document.getElementById('rtPickMapBox');
    return b && !b.classList.contains('hidden');
  }, { timeout: 15000 });
  const who = row.pin[0];
  await pg.evaluate(() => document.getElementById('rtPickMapGo').click());
  const saved = await pg.waitForFunction(id => {
    const v = n => { try { return eval(n) } catch (e) { return [] } };
    const d = (v('dbs') || []).filter(x => x.id === id)[0];
    return d && d.lat ? { addr: d.addr, lat: d.lat, sigungu: d.sigungu, region: d.region } : null;
  }, who, { timeout: 20000 }).then(h => h.jsonValue(), () => null);
  is(!!saved, '목록에서 찍으니 <그 사람에게 좌표가 저장됐다> — 창을 옮겨 다니지 않는다');
  is(!!saved && saved.sigungu === '순천시',
     '<행정구역까지 같이> 들어갔다 — 적힌 지역과 같은 시라서 (' + (saved ? saved.sigungu : '') + ')');
  is(hardErr(errs).length === 0, hardErr(errs).length
     ? ('콘솔 에러 ' + hardErr(errs).length + '건 — ' + hardErr(errs).slice(0, 2).join(' | ')) : '끝까지 콘솔 에러 <0건>');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ CRM 실행 점검 통과 — 원래 화면은 그대로, 얹은 것은 실제로 돕니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
