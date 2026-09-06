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
 D('d4','전라남도 순천시','AP'),D('d5','여수','TA'),D('d6','여수시','미접촉'),
 D('d7','광양시','계약완료',{contracted_at:'2026-08-05'}),
 D('d8','광양','증권전달',{contracted_at:'2025-09-05',policy_sent_at:'2025-09-20'}),
 D('d9','','계약완료'),D('d10','서울특별시 강남구','TA'),
 D('d11','순천시','계약완료',{contracted_at:'2026-08-25'})];
if(MIG)DBS.forEach(function(d){ d.addr='';d.lat=null;d.lng=null;
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
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(p){
    err=miss(tbl,p?Object.keys(Array.isArray(p)?(p[0]||{}):p):[]); return b } });
  b.then=function(res,rej){ return Promise.resolve(
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

  const open = async (mig) => {
    const ctx = await br.newContext(), pg = await ctx.newPage();
    const errs = [], logs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    pg.on('console', m => { logs.push(m.text()); if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.route('**/*', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/pretendard/.test(u))   return r.fulfill({ contentType: 'text/css', body: '' });
      if (/dapi\.kakao\.com/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: '' });
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
  let { ctx, pg, errs, logs } = await open(false);

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
  ({ ctx, pg, errs, logs } = await open(true));

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

  await ctx.close(); await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ CRM 실행 점검 통과 — 원래 화면은 그대로, 얹은 것은 실제로 돕니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
