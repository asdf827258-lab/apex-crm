#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   DB 통합 CRM — 찾기가 이름·번호 밖으로 나간다

   찾는 칸은 이름과 전화번호만 보고 있었습니다. 천 건이 넘어간 뒤로는
   「광주 사는 그분」·「박서준이 맡은 것」·「소개로 들어온 것」을 못 찾아
   눈으로 훑는 수밖에 없었습니다.

   그래서 넓힙니다. 여기서 못 박는 것은 다섯입니다.

     ① 이름 · <b>초성</b> · 번호 뒷자리로 찾힌다
     ② 지역 · <b>시(市)</b> · 담당자 · 종류 · 메모로도 찾힌다
     ③ <b>헛것을 안 잡는다</b> — 「여수」로 쳤는데 순천이 섞이면 안 됩니다.
        넓게 잡는 찾기는 안 찾아지는 것보다 나쁩니다 (8번).
     ④ 몇 건이 걸렸는지 <b>그 자리에 적는다</b> — 걸러 놓고 말을 안 하면
        사장님은 자료가 사라진 줄 압니다
     ⑤ 없으면 <b>없다고 말하고</b> 무엇으로 찾는지 알려 준다

   견본 고객 이름은 언제나 「홍길동」 계열입니다 (3번).
   서버(supabase-js)만 견본으로 갈아 끼우고 나머지는 진짜 파일입니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

/* ── 견본 서버 ─────────────────────────────────────────────────
   찾기 하나만 보려는 것이므로 줄은 적게, 대신 <b>칸마다 하나씩</b>
   걸릴 것을 심어 둡니다. 담당자는 둘이고, 이름이 겹치지 않습니다. */
const STUB = `(function(){
function D(id,name,phone,rg,sgg,who,src,memo){
  return {id:id,customer_name:name,phone:phone,region:rg,sigungu:sgg,
    assigned_to:who,created_by:who,stage:'TA',assigned_date:'2026-07-01',
    created_at:'2026-07-01T00:00:00Z',source:src,addr:'',lat:null,lng:null,
    next_appt:null,next_appt_place:null,next_appt_lat:null,next_appt_lng:null,
    region_code:null,sido:null,dong:null,followup:null,memo:'',report_name:'',
    __memo:memo};
}
var DBS=[
  D('d1','홍길동','010-1111-2345','순천시','순천시','u1','소개',''),
  D('d2','홍길순','010-2222-3456','여수시','여수시','u1','일반',''),
  D('d3','임꺽정','010-3333-7788','광양시','광양시','u2','소개',''),
  /* 시 칸이 비어 지역 글자만 있는 줄 — 지역으로도 찾혀야 한다.
     담당자는 <b>목록에 없는 사람</b>이라 화면에 「-」 로 뜬다. 그 「-」 를
     찾을 거리로 쓰면 「-」 한 글자에 온 세상이 걸린다 — [4] 가 그 자리다. */
  D('d4','장길산','010-4444-9900','전남 구례군','','u9','DB','')
];
/* 메모는 통화 기록에 붙습니다 — 마지막 통화의 메모로 찾는 자리를 잽니다 */
var CALLS=[{id:'c1',db_id:'d4',created_by:'u2',result:'부재',
            call_at:'2026-09-01T01:00:00Z',appointment_at:null,memo:'아파트 사시는 분',
            appt_place:null,appt_lat:null,appt_lng:null,
            recording_delivered:false,group_reported:false,first_call_issue:false}];
var T={profiles:[{id:'u1',name:'홍길동',role:'admin',active:true},
                 {id:'u2',name:'박서준',role:'member',active:true}],
       dbs:DBS,calls:CALLS,attendance:[],teams:[],team_members:[],
       app_config:[],clients:[]};
window.__STUB__={dbs:DBS.length};
function B(tbl){
  var rows=(T[tbl]||[]).slice(),one=false,b={};
  b.select=function(){return b};
  ['eq','neq','in','gte','lte','gt','lt','is','like','ilike','not','or','order','limit','range','contains']
   .forEach(function(k){ b[k]=function(f,v){
     if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
     return b } });
  b.single=b.maybeSingle=function(){one=true;return b};
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(){return b} });
  b.then=function(res,rej){return Promise.resolve({data:one?(rows[0]||null):rows,error:null}).then(res,rej)};
  b.catch=function(f){return b.then(function(x){return x},f)};
  return b;
}
var U={id:'u1',email:'u1@example.com'},S={user:U,access_token:'stub'};
window.supabase={createClient:function(){return {
  from:function(t){return B(t)},
  auth:{ onAuthStateChange:function(cb){setTimeout(function(){cb('SIGNED_IN',S)},0);
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
  const ctx = await br.newContext(), pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.route('**/*', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } },
                           { timeout: 30000 });
  /* 마지막 통화의 메모는 calls 가 들어와야 붙는다 — 시간이 아니라 조건으로 */
  await pg.waitForFunction(() => { try { return (eval('calls') || []).length > 0 } catch (e) { return false } },
                           { timeout: 30000 });
  await pg.evaluate(() => goPage('db'));
  await pg.waitForSelector('#dbBody tr', { timeout: 15000 });

  /* 화면에 실제로 선 줄의 고객 이름만 긁는다 */
  const rows = () => pg.evaluate(() => Array.from(document.querySelectorAll('#dbBody tr td.name'))
    .map(e => (e.textContent || '').split('\n')[0].replace(/010.*$/, '').trim()));
  const find = async (q) => {
    await pg.fill('#search', '');
    await pg.type('#search', q, { delay: 15 });
    await pg.waitForTimeout(120);
    return rows();
  };

  head('[1] 찾는 칸이 <b>무엇으로 찾는지</b> 말한다');
  const ph = await pg.getAttribute('#search', 'placeholder');
  is(/초성/.test(ph || ''), '초성으로 찾을 수 있다고 <b>칸에 적혀 있다</b>');
  is(/지역|시/.test(ph || '') && /담당/.test(ph || ''),
     '지역·담당자로도 찾는다고 적혀 있다 — 「' + ph + '」');
  is((await rows()).length === 4, '치기 전에는 <b>네 건 전부</b> 보인다');

  head('[2] 이름 · <b>초성</b> · 번호 뒷자리');
  let r = await find('홍길');
  is(r.length === 2 && r.indexOf('임꺽정') < 0, '이름 — 「홍길」 로 둘 (' + r.join(', ') + ')');
  r = await find('ㅇㄲㅈ');
  is(r.length === 1 && r[0] === '임꺽정', '초성 — 「ㅇㄲㅈ」 로 임꺽정 하나');
  r = await find('3456');
  is(r.length === 1 && r[0] === '홍길순', '번호 뒷자리 — 「3456」 으로 홍길순 하나');
  r = await find('2222-3456');
  is(r.length === 1 && r[0] === '홍길순', '하이픈을 넣어 쳐도 같은 사람이 나온다');

  head('[3] 지역 · <b>시</b> · 담당자 · 종류 · 메모');
  r = await find('여수');
  is(r.length === 1 && r[0] === '홍길순', '시 — 「여수」 로 하나 (' + r.join(', ') + ')');
  r = await find('구례');
  is(r.length === 1 && r[0] === '장길산', '시 칸이 빈 줄도 <b>지역 글자</b>로 찾힌다');
  r = await find('박서준');
  is(r.length === 1 && r[0] === '임꺽정',
     '담당자 — 「박서준」 이 맡은 하나 (' + r.join(', ') + ')');
  r = await find('소개');
  is(r.length === 2 && r.indexOf('장길산') < 0, '종류 — 「소개」 로 둘 (' + r.join(', ') + ')');
  r = await find('아파트');
  is(r.length === 1 && r[0] === '장길산', '메모 — 마지막 통화에 적어 둔 말로도 찾힌다');

  head('[4] <b>헛것을 안 잡는다</b>');
  r = await find('여수');
  is(r.indexOf('홍길동') < 0, '「여수」 에 순천 사람이 안 섞인다');
  /* 담당자를 모르는 줄은 화면에 「-」 로 뜬다. 그 「-」 까지 찾을 거리에
     넣으면 「-」 한 글자에 온 목록이 걸린다 — 그런 찾기는 안 찾아지는
     것보다 나쁩니다 (8번).                                            */
  r = await find('-');
  is(r.length === 0, '「-」 한 글자로 <b>아무것도 안 걸린다</b> — 담당자 없는 줄이 딸려 오지 않는다 (' +
     r.join(', ') + ')');
  r = await find('홍길동');
  is(r.length === 2 && r.indexOf('임꺽정') < 0,
     '「홍길동」 은 고객이자 담당자다 — 본인과 <b>본인이 맡은 줄</b>만 나온다 (' + r.join(', ') + ')');

  head('[5] 몇 건인지 <b>그 자리에 적는다</b>');
  r = await find('소개');
  let note = await pg.evaluate(() => (document.getElementById('dbFindN') || {}).textContent || '');
  is(/2/.test(note) && /소개/.test(note), '「소개」 로 2건 이라고 적는다 — 「' + note + '」');
  await pg.fill('#search', '');
  await pg.waitForTimeout(120);
  note = await pg.evaluate(() => (document.getElementById('dbFindN') || {}).textContent || '');
  is(/전체/.test(note) && /4/.test(note), '지우면 <b>전체 4건</b>으로 돌아온다 — 「' + note + '」');
  is((await rows()).length === 4, '줄도 네 건 전부 돌아왔다');

  head('[6] 없으면 <b>없다고 말한다</b>');
  await pg.fill('#search', '');
  await pg.type('#search', '없는사람', { delay: 15 });
  await pg.waitForTimeout(150);
  const empty = await pg.evaluate(() => (document.getElementById('dbBody') || {}).textContent || '');
  is(/찾은 DB 가 없습니다/.test(empty), '「찾은 DB 가 없습니다」 라고 <b>그 자리에 적는다</b>');
  is(/초성/.test(empty) && /담당자/.test(empty),
     '막힌 자리에서 <b>무엇으로 찾는지</b> 다시 알려 준다');

  head('[7] 이 화면을 그리는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|204/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ DB 찾기 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ DB 찾기 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
