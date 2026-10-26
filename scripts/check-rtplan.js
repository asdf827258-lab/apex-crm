/* ══════════════════════════════════════════════════════════════════
   check-rtplan.js (판 X191) — 🗓️ 지역 동선이 <b>하루 스케줄표</b>를 짜나 ·
   📮 <b>주소가 없는 분</b>에게 입력을 권하나

   사장님 말씀 (2026-10-25) —
     「지역동선 <b>동선까지 짜서 스케줄표 짜줘</b> 자세한 주소가
      안되어있는건, <b>입력권유</b> 할수 있도록 하고」

   ── 손대기 전 ──────────────────────────────────────────────────────
   순서 짜기(NN+2-opt) · 구간 거리·분 · 출발 시각 한 칸 · 지각 경고까지는
   <b>이미 있었습니다</b>. 없던 것은 <b>하루를 시각으로 펼친 표</b>입니다 —
   「몇 시에 나서나 · 상담이 몇 시에 끝나나 · 다음까지 몇 분 비나 · 오늘
   몇 시에 끝나나」 를 사장님이 <b>머리로 더하고</b> 계셨습니다.
   그리고 「위치를 모르는 약속 N건」 은 <b>수만</b> 말했지 <b>누구인지</b>를
   말하지 않았고, 그 자리에서 주소를 적을 길이 없었습니다.

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ ★★ <b>모르는 것을 이어 적는 것</b> (1번). 위치를 모르는 분이 끼면 그
      뒤 시각은 알 수 없습니다. 「아마 이쯤」 으로 이어 적으면 사장님이
      그것을 믿고 하루를 짜십니다 — <b>거기서 셈을 멈추고 멈췄다고</b> 적어야
      합니다.
   ⓑ <b>두 곳에서 각자 세는 것</b> (5번). 거리·분은 legs() 가, 상담 시간은
      STAY 가 이미 압니다. 표가 제 손으로 다시 세면 위 목록과 두 답이 섭니다.
   ⓒ <b>어림을 길찾기라고 말하는 것</b> (1번). 산을 낀 구간에서 늦습니다.
   ⓓ <b>멀쩡한 분을 조르는 것</b> (8번). 주소나 좌표가 하나라도 있으면
      길을 짤 수 있습니다 — 「더 자세히」 를 조르면 그 목록을 안 보게 됩니다.
   ⓔ <b>누구인지 안 말하는 것.</b> 「N건」 만 적으면 사장님이 한 명씩 찾아야
      합니다 — 그러면 아무도 안 고칩니다.
   ⓕ <b>저장을 새로 짜는 것</b> (5번 · 사장님 규칙 「함수를 지우지 마십시오 —
      부르는 자리만」). 적는 창(pinOne)·지도(pinPick)·저장은 이미 있습니다.
   ⓖ <b>시간표에 돈 이야기가 섞이는 것.</b> 여기는 시간표입니다 — 금액·보장을
      적으면 그 자리에서 다른 화면이 됩니다 (2번).
   ⚠ 폰 폭·도구 띠는 <b>check-rtopen</b> 이 봅니다 (같은 것을 두 번 안 셉니다 · 5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

/* 날짜를 <b>못 박습니다</b> — 「며칠 뒤」 로 씨를 만들면 자가 제 날에만 웁니다 (8번) */
const DAY = '2026-10-14';

/* 견본 — 이름은 언제나 <b>홍길동</b> 집안입니다 (3번).
   ★ 넷을 일부러 다르게 둡니다 —
     ㉠ 좌표까지 있는 분 (시각을 다 셀 수 있다)
     ㉡ 좌표는 없고 주소만 있는 분 (조르면 안 된다 — 길은 짤 수 있다)
     ㉢ 아무것도 없는 분 (여기서 셈이 멈춰야 한다 · 📮 에 서야 한다)
     ㉣ 약속이 없고 아무것도 없는 분 (📮 에 「이 동네 후보」 로 선다)     */
const STUB = `(function(){
function D(id,nm,ex){
  var d={id:id,customer_name:nm,phone:'010-0000-0000',region:'순천시',stage:'AP',
    assigned_to:'u1',created_by:'u1',assigned_date:'2026-07-01',
    created_at:'2026-07-01T00:00:00Z',next_appt:null,memo:'',
    addr:'',lat:null,lng:null,next_appt_place:null,next_appt_lat:null,next_appt_lng:null,
    region_code:null,sido:null,sigungu:'순천시',dong:null,followup:null};
  for(var k in (ex||{}))d[k]=ex[k]; return d;
}
var DBS=[
  D('p1','홍길동가',{next_appt:'${DAY}T10:00:00',addr:'전남 순천시 연향동 1',lat:34.9506,lng:127.4872}),
  D('p2','홍길동나',{next_appt:'${DAY}T14:00:00',addr:'전남 순천시 조례동 2',lat:34.9700,lng:127.5100}),
  D('p3','홍길동다',{next_appt:'${DAY}T16:30:00',addr:'전남 순천시 해룡면 3'}),
  D('p4','홍길동라',{next_appt:'${DAY}T18:00:00'}),
  D('p5','홍길동마',{}),
  D('p6','홍길동바',{addr:'전남 순천시 왕지동 6'})
];
var T={profiles:[{id:'u1',name:'홍길동',role:'admin',active:true}],
       dbs:DBS,calls:[],attendance:[],teams:[],team_members:[],
       app_config:[{key:'kakao_js_key',value:'00000000000000000000000000000000'}],clients:[]};
function B(tbl){
  var rows=(T[tbl]||[]).slice(), one=false, b={};
  b.select=function(){ return b };
  ['eq','neq','in','gte','lte','gt','lt','is','like','ilike','not','or','order','limit','range','contains']
    .forEach(function(k){ b[k]=function(f,v){
      if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
      if(k==='in'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return (v||[]).indexOf(r[f])>=0});
      return b } });
  b.single=b.maybeSingle=function(){ one=true; return b };
  var op='', pay=null;
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(p){ op=k; pay=p; return b } });
  b.then=function(res,rej){
    if(op==='update'&&pay){ window.__PATCH=(window.__PATCH||[]).concat([{t:tbl,p:pay}]);
                            rows.forEach(function(r){ for(var k in pay)r[k]=pay[k] }) }
    if(op==='upsert'||op==='insert'){
      var arr=Array.isArray(pay)?pay:(pay?[pay]:[]);
      arr.forEach(function(p){ (T[tbl]||(T[tbl]=[])).push(p) }); rows=arr;
    }
    return Promise.resolve({data:one?(rows[0]||null):rows,error:null}).then(res,rej) };
  b.catch=function(f){ return b.then(function(x){return x},f) };
  return b;
}
var U={id:'u1',email:'u1@example.com'}, S={user:U,access_token:'stub'};
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
    const fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { s.writeHead(404); s.end('no'); return; }
    s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
    s.end(fs.readFileSync(fp));
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  let 바깥 = 0;

  const ctx = await br.newContext(Object.assign({}, CLK.ctxOpt(), { viewport: { width: 1280, height: 900 } }));
  await CLK.pin(ctx, 14);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 140)));
  await ctx.route('**://**', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
    /* 길찾기는 <b>키가 없다</b>고 답하게 둡니다 — 그러면 화면은 어림으로 가고,
       「어림이라고 밝히나」 를 잴 수 있습니다. 진짜 카카오는 안 부릅니다 (8번). */
    if (/route-km/.test(u)) { 바깥++; return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' }); }
    if (/dapi\.kakao\.com|kakao\.com/.test(u)) { 바깥++; return r.fulfill({ status: 401, contentType: 'application/json', body: '{"errorType":"AccessDeniedError"}' }); }
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) { 바깥++; return r.abort(); }
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=u1', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });

  /* 출발지를 정해 둡니다 — 「몇 시에 나서나」 를 재려면 있어야 합니다 */
  await pg.evaluate(() => {
    try { localStorage.setItem('apexRouteHomeV1', JSON.stringify(
      { label: '순천 사무실', lat: 34.9400, lng: 127.4800 })); } catch (e) {}
    try { localStorage.setItem('apexRouteStayV1', '60'); } catch (e) {}
  });
  await pg.reload({ waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
  await pg.evaluate(() => apexRouteOpen());
  await pg.waitForTimeout(500);
  await pg.evaluate((d) => { const e = document.getElementById('rtDate'); e.value = d; e.onchange(); }, DAY);
  await pg.waitForTimeout(900);

  const V = await pg.evaluate(() => {
    const q = s => Array.from(document.querySelectorAll(s));
    const txt = e => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
    const sc = q('#rtSide .rt-sc').map(e => ({
      cls: e.className, t: txt(e.querySelector('.rt-sc-t')), b: txt(e.querySelector('.rt-sc-b'))
    }));
    const ask = document.querySelector('#rtSide .rt-sc-ask');
    /* ★ <b>.rt-arow</b> 입니다 — .rt-row 는 「가는 김에 붙일 후보」 줄이고
       그 수를 check-crmrun 이 셉니다. 섞으면 그 자가 조용히 틀립니다 (5번). */
    const need = q('#rtSide .rt-arow')
      .map(e => ({ nm: txt(e.querySelector('.rt-who b')), sub: txt(e.querySelector('.rt-who small')),
                   btn: txt(e.querySelector('button')), on: (e.querySelector('button') || {}).getAttribute
                        ? e.querySelector('button').getAttribute('onclick') : '' }));
    return { sc: sc, 표있나: !!document.querySelector('#rtSide .rt-sc'),
             머리: q('#rtSide .rt-h').map(txt),
             권유글: ask ? txt(ask) : '', need: need,
             쪽글: txt(document.getElementById('rtSide')) };
  });

  head('[1] 🗓️ <b>하루 스케줄표</b>가 서나');
  is(V.표있나, '  표가 선다 — 줄 ' + V.sc.length + '개');
  is(V.머리.some(h => /하루 스케줄표/.test(h)), '  머리글이 <b>🗓️ 하루 스케줄표</b> 다 — ' + V.머리.join(' / '));
  const dep = V.sc.filter(x => /rt-sc-dep/.test(x.cls))[0];
  is(!!dep && /나섭니다/.test(dep.b),
     '  ★ <b>몇 시에 나서나</b>가 선다 — ' + (dep ? (dep.t + ' · ' + dep.b.slice(0, 48)) : '(없음)'));
  const meets = V.sc.filter(x => /rt-sc-m\b/.test(x.cls) || /rt-sc-m /.test(x.cls + ' '));
  is(meets.length >= 3, '  약속 줄이 <b>' + meets.length + '개</b> 선다');
  /* ★ 상담 끝 시각이 <b>약속 + STAY</b> 인가 — 표가 제 손으로 다시 세지 않는지 */
  const 첫 = meets[0];
  is(!!첫 && /10:00/.test(첫.t) && /~ 11:00/.test(첫.t),
     '  ★ <b>상담 끝 시각</b>이 약속 + 상담 60분이다 — ' + (첫 ? 첫.t : '(없음)'));
  is(!!첫 && /상담 60분/.test(첫.b), '  그 줄에 <b>상담 몇 분</b>인지 적힌다');
  const fin = V.sc.filter(x => /rt-sc-fin/.test(x.cls))[0];
  is(!!fin && /오늘 일정 끝/.test(fin.b),
     '  ★ <b>오늘 몇 시에 끝나나</b>가 선다 — ' + (fin ? fin.t : '(없음)'));

  head('[2] ⓐ★★ <b>못 재는 구간을 지어내지 않나</b> (1번)');
  const no = V.sc.filter(x => /rt-sc-no/.test(x.cls))[0];
  is(!!no, '  위치를 모르는 분 자리에 <b>멈춤 줄</b>이 선다');
  is(!!no && /위치를 몰라/.test(no.b) && /이 구간 이동 시간을 못 셉니다/.test(no.b),
     '  ★ <b>무엇을 못 세는지</b> 또렷이 적는다 (그 구간 이동 시간) — ' + (no ? no.b.slice(0, 56) : ''));
  is(!!no && /주소가 없는 분/.test(no.b), '  어디서 고치는지 <b>가리킨다</b> (6번)');
  /* ★★ <b>이 줄을 한 번 틀리게 물었습니다.</b> 처음에는 「못 재는 분이 나오면
     그 뒤로 시각을 아예 안 적어야 한다」 고 쟀습니다. 그런데 그렇게 하면
     <b>뒤 약속이 화면에서 통째로 사라집니다</b> — 약속 시각은 사장님이 적어
     두신 <b>사실</b>이고, 상담 끝은 그 시각 + STAY 라 둘 다 아는 값입니다.
     모르는 것은 <b>그 사이 이동 시간</b> 하나뿐입니다. 가리는 것은 1번을
     지키는 것이 아니라 어기는 것이었습니다 (「값이 없으면 화면을 세우지
     않는다」 는 <b>지어낸 값</b>을 두고 한 말입니다).
     ★ 그래서 묻는 것을 바꿨습니다 — <b>못 재는 구간에 대해 「빕니다」 를
       주장하지 않는가</b>. 그것이 실제로 지어내는 자리입니다.             */
  const noAt = V.sc.findIndex(x => /rt-sc-no/.test(x.cls));
  is(noAt >= 0, '  못 재는 구간에 <b>그 자리</b>가 선다');
  is(noAt >= 0 && !/빕니다|모자랍니다|바로 이어집니다/.test(V.sc[noAt].b),
     '  ★★ 그 구간에 대해 <b>비는 시간을 주장하지 않는다</b> — 거기가 지어내는 자리입니다 (1번)');
  /* ★ 끝 줄의 말이 <b>실제와 맞나</b> — 끝까지 세어 놓고 「여기까지만 셌다」 고
     적던 자리입니다. 자가 그 어긋남을 잡았습니다 (1번).                   */
  is(!!fin && /이동 시간을 못 잰 구간이/.test(fin.b) && /약속 시각 그대로/.test(fin.b),
     '  ★★ 끝 줄이 <b>무엇을 못 쟀는지</b> 사실대로 적는다 — 「' +
     (fin ? fin.b.replace(/^오늘 일정 끝\s*/, '').slice(0, 64) : '') + '…」');
  is(!!fin && !/여기까지만/.test(fin.b),
     '  ★ 끝까지 세어 놓고 <b>「여기까지만 셌다」 고 하지 않는다</b> (그 거짓말을 고친 자리)');

  head('[3] ⓒ <b>어림인지 길찾기인지</b> 밝히나 (1번)');
  const mv = V.sc.filter(x => /rt-sc-mv/.test(x.cls));
  is(mv.length >= 1, '  이동 줄이 <b>' + mv.length + '개</b> 선다');
  is(mv.every(x => /\(어림\)/.test(x.b)) && /\(어림\)/.test(dep ? dep.b : ''),
     '  ★ 길찾기 키가 없으니 <b>전부 「(어림)」</b> 이라 적는다 — 어림을 길찾기라고 말하지 않는다');
  is(mv.some(x => /빕니다|바로 이어집니다|모자랍니다/.test(x.b)),
     '  ★ 이동하고 <b>얼마나 비는지</b>를 적는다 — ' +
     (mv[0] ? mv[0].b.slice(0, 54) : ''));

  head('[4] 📮 <b>주소가 없는 분</b>에게 입력을 권하나 (사장님 말씀)');
  is(V.머리.some(h => /주소가 없는 분/.test(h)), '  머리글이 <b>📮 주소가 없는 분 N명</b> 이다');
  is(/여쭤|여쭈/.test(V.권유글) && /가는 김에/.test(V.권유글),
     '  ★ <b>왜 적어야 하는지</b>를 말한다 — 「' + V.권유글.slice(0, 60) + '…」');
  const 이름 = V.need.map(x => x.nm);
  is(V.need.length >= 2, '  ⓔ <b>누구인지</b> 이름으로 선다 — ' + 이름.join(' · '));
  /* ⓓ 멀쩡한 분을 조르지 않나 — 좌표가 있는 둘과 주소만 있는 둘은 안 서야 합니다 */
  is(이름.indexOf('홍길동가') < 0 && 이름.indexOf('홍길동나') < 0,
     '  ⓓ <b>좌표가 있는 분</b>은 안 조른다');
  is(이름.indexOf('홍길동다') < 0 && 이름.indexOf('홍길동바') < 0,
     '  ⓓ <b>주소만 있는 분</b>도 안 조른다 — 길은 짤 수 있습니다 (8번)');
  is(이름.indexOf('홍길동라') >= 0, '  ★ <b>오늘 약속인데 아무것도 없는 분</b>이 선다');
  is(이름.indexOf('홍길동마') >= 0, '  ★ <b>이 동네 후보</b> 중 아무것도 없는 분도 선다');
  is(V.need.every(x => /주소 적기/.test(x.btn)), '  줄마다 <b>주소 적기</b> 단추가 있다');
  is(V.need.every(x => /apexRoutePinOne/.test(x.on || '')),
     '  ⓕ 단추가 <b>이미 있는 창</b>(pinOne)을 부른다 — 저장을 새로 짜지 않았다 (5번)');
  is(V.need.some(x => /오늘 약속/.test(x.sub)) && V.need.some(x => /이 동네 후보/.test(x.sub)),
     '  <b>왜 이 줄에 섰는지</b>를 적는다 (오늘 약속 / 이 동네 후보)');

  head('[4-2] ⚠ <b>안 되는 길을 가리키지 않나</b> (1번 · 6번)');
  /* ★★ 2026-10-25 · 재어 보고 찾은 자리입니다. 「위치를 모르는 약속 N건」 쪽지가
     <b>「📍 좌표 채우기를 누르면 지도에 올라갑니다」</b> 라고만 적고 있었습니다.
     그 단추는 <b>적힌 주소를 카카오에 물어</b> 좌표로 바꾸는 일이라, 주소가
     아예 없는 분은 눌러도 찾을 것이 없습니다 — 「눌러도 안 되는 단추를 세우면
     고장인 줄 아십니다」. 두 경우를 <b>갈라 적어야</b> 맞습니다.           */
  const 쪽 = await pg.evaluate(() => {
    const c = Array.from(document.querySelectorAll('#rtSide .rt-card'))
      .filter(e => /위치를 모르는 약속/.test(e.innerText))[0];
    return c ? c.innerText.replace(/\s+/g, ' ').trim() : '';
  });
  is(!!쪽, '  「위치를 모르는 약속 N건」 쪽지가 선다');
  is(/주소가 아예 없어/.test(쪽),
     '  ★★ <b>주소가 아예 없는 건</b>을 갈라 말한다 — 「' + 쪽.slice(0, 80) + '…」');
  is(/📮 주소가 없는 분/.test(쪽),
     '  ★ 그 경우에는 <b>되는 길</b>(📮 주소가 없는 분)을 가리킨다');
  is(/눌러도 찾을 것이 없습니다/.test(쪽),
     '  ★ 주소가 없는 건에는 <b>「눌러도 찾을 것이 없습니다」</b> 라고 말한다 — 헛 단추를 권하지 않습니다');
  is(/주소가 적혀 있으니/.test(쪽),
     '  ★ 주소가 <b>적힌</b> 건에만 정리 단추를 권한다 — 두 경우를 섞지 않습니다');

  head('[5] ⓖ <b>시간표에 돈 이야기가 없나</b> (2번) · 조용한가');
  const 표글 = V.sc.map(x => x.t + ' ' + x.b).join(' ') + ' ' + V.권유글;
  is(!/원|만원|보험료|보장|비과세|수익률|%/.test(표글),
     '  금액·보장·비율이 <b>한 자도 없다</b> — 여기는 시간표입니다');
  is(!/주민|생년|\d{6}-\d/.test(V.쪽글), '  주민등록번호 꼴이 <b>한 곳도 없다</b> (3번)');
  is(errs.length === 0, '  터진 곳이 <b>없다</b>' + (errs.length ? ' — ' + errs[0] : ''));

  head('[6] 🤫 <b>진짜 카카오를 안 부른다</b> (8번 · 7번)');
  is(바깥 >= 1, '  길찾기 창구를 부르긴 한다 — ' + 바깥 + '번 (전부 이 자가 가로챘습니다)');
  const 전 = 바깥;
  await pg.evaluate(() => { const e = document.getElementById('rtDate'); e.onchange(); });
  await pg.waitForTimeout(700);
  is(바깥 - 전 <= 2, '  다시 그려도 바깥을 <b>더 안 부른다</b> — ' + (바깥 - 전) + '번 (받아 둔 것을 씁니다)');

  await ctx.close();
  console.log('\n──────────────────────────────');
  await br.close(); srv.close();
  if (bad) { console.log('✗ 동선 스케줄표 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 하루가 시각으로 펼쳐지고, 주소 없는 분은 그 자리에서 적으실 수 있습니다.');
})();
