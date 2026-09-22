/* 카톡 보내기 — <b>AP·PC 단계만</b> 보낸다.

   사장님 말씀 (2026-09-22) —
     「카톡보내기에서, <b>TEAM 진행상황 AP-PC단계만 보이게 해.</b>
      다른건 필요 없어.」

   팀장이 카톡으로 받는 것은 「지금 만나고 있는 자리」입니다. TA·미접촉·
   계약완료까지 다 들어가면 폰에서 스무 줄을 넘겨야 오늘 볼 것이 나옵니다.

   그런데 <b>줄을 좁히면서 합계까지 같이 좁히면 거짓말이 됩니다.</b>
   계약이 있는 팀에 「계약업적 0원」이 찍히면 그것은 「계약이 없다」는
   뜻입니다 (1번). 그래서 이 점검의 절반은 <b>합계가 그대로인지</b>를 봅니다.

   못 박는 것 —
     ① 처음 열면 <b>AP·PC 만</b> 줄에 선다. 다른 단계는 이름도 안 나온다
     ② 위쪽 합계 <b>계약업적</b>은 팀 전체에서 센다 (1번)
     ③ AP·PC 가 <b>한 줄도 없는 팀원</b>의 계약도 합계에 든다 —
        그 팀원이 표에서 빠지기 때문에 여기가 제일 잘 샌다
     ④ 팀원 줄은 <b>보이는 건수와 전체 건수를 같이</b> 말한다
     ⑤ 받는 사람이 <b>좁혀 보낸 줄 안다</b> — 머리글에 적힌다
     ⑥ <b>텍스트 복사</b>도 같은 줄만 나간다 (두 곳이 어긋나면 안 된다 · 5번)
     ⑦ 끄면 <b>전부 돌아온다</b> — 못 보게 막은 것이 아니다
     ⑧ 견본 이름은 <b>홍길동</b>이다 (3번)                                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const PAGE = '/edu-pipeline.html';

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

/* ── 견본 서버 ──────────────────────────────────────────────────────
   세빈TEAM 에 팀원 셋 —
     m1 홍길동   AP·PC 둘 + 계약완료 하나 + TA 하나 + 미접촉 하나
     m2 홍길순   <b>계약완료 하나뿐</b> — AP·PC 가 없어 표에서 빠진다.
                 그런데 이분 계약도 합계에는 들어야 한다 (③)
     m3 홍길중   TA 하나뿐 — 통째로 빠진다
   상빈TEAM 은 TA 하나뿐이라 <b>한 줄도 못 세우는 팀</b>이 된다.        */
const STUB = `(function(){
function D(id,mid,name,st,ex,cont){
  return {id:id,assigned_to:mid,assigned_date:'2026-09-01',source:'일반',region:'순천',
    customer_name:name,next_appt:'2026-09-25',stage:st,memo:'',
    expect_premium:ex,contract_premium:cont||null,family_intro:'미요청',intro_count:null,
    closed_reason:null,contracted_at:(st==='계약완료'||st==='증권전달')?'2026-09-10T00:00:00Z':null};
}
var T={
 profiles:[{id:'m1',name:'홍길동',role:'admin',active:true,team_id:null,workspace:'apex'},
           {id:'m2',name:'홍길순',role:'member',active:true,team_id:null,workspace:'apex'},
           {id:'m3',name:'홍길중',role:'member',active:true,team_id:null,workspace:'apex'},
           {id:'m4',name:'홍길산',role:'member',active:true,team_id:null,workspace:'apex'}],
 teams:[{id:'t1',name:'세빈TEAM',leader_id:'m1'},{id:'t2',name:'상빈TEAM',leader_id:'m4'}],
 team_members:[{team_id:'t1',member_id:'m1'},{team_id:'t1',member_id:'m2'},
               {team_id:'t1',member_id:'m3'},{team_id:'t2',member_id:'m4'}],
 org_members:[],
 dbs:[D('d1','m1','홍길동가','AP',300000),
      D('d2','m1','홍길동나','PC',800000),
      D('d3','m1','홍길동다','계약완료',400000,450000),
      D('d4','m1','홍길동라','TA',null),
      D('d5','m1','홍길동마','미접촉',null),
      D('d6','m2','홍길동바','계약완료',500000,500000),
      D('d7','m3','홍길동사','TA',null),
      D('d8','m4','홍길동아','TA',null)],
 monthly_perf:[]
};
function B(tbl){
  var rows=(T[tbl]||[]).slice(), one=false;
  var b={};
  b.select=function(){ return b };
  ['eq','neq','in','gte','lte','gt','lt','is','order','limit','range']
    .forEach(function(k){ b[k]=function(f,v){
      if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
      return b } });
  b.single=b.maybeSingle=function(){ one=true; return b };
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(){ return b } });
  b.then=function(res,rej){
    return Promise.resolve({data:one?(rows[0]||null):rows,error:null}).then(res,rej) };
  b.catch=function(f){ return b.then(function(x){return x},f) };
  return b;
}
var U={id:'m1',email:'hong@example.com'}, S={user:U,access_token:'stub'};
window.supabase={createClient:function(){ return {
  from:function(t){ return B(t) },
  rpc:function(){ return Promise.resolve({data:null,error:null}) },
  auth:{ getSession:function(){ return Promise.resolve({data:{session:S},error:null}) },
    onAuthStateChange:function(){ return {data:{subscription:{unsubscribe:function(){}}}} } }
}}};
})();`;

/* 그림은 픽셀이라 눈으로 못 읽습니다. 그래서 <b>실제로 그리는 손</b>을
   엿듣습니다 — fillText 가 적은 글을 모으면 그것이 곧 카톡에 붙는 그림의
   내용입니다. 함수를 따로 불러 보는 것이 아니라 <b>진짜 그리는 길</b>을
   그대로 지나게 합니다 (8번).                                          */
const SPY = `(function(){
  var P = CanvasRenderingContext2D.prototype, F = P.fillText;
  window.__TX__ = [];
  /* 글과 같이 <b>어디에</b> 적었는지도 둘다 — 위쪽 합계는 줄마다 같은
     높이에 서서, 이름표를 값에 맞춰 읽어야 「어느 숫자가 계약업적인가」를
     확실히 말할 수 있습니다. 「2건」이 두 군데 찍힐 때 헛짚짓 하지 않게. */
  P.fillText = function(t, x, y){ window.__TX__.push({ t: String(t), x: x, y: y }); return F.apply(this, arguments); };
  window.__CLIP__ = [];
  try {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: function(s){ window.__CLIP__.push(s); return Promise.resolve(); },
      write: function(){ return Promise.resolve(); } } });
  } catch(e) {}
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
  await pg.addInitScript(SPY);
  await pg.route('**/*', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + PAGE, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => document.querySelector('#app') &&
    document.querySelector('#app').style.display !== 'none', null, { timeout: 15000 });

  /* 탭을 <b>눌러</b> 들어갑니다 — 그려 주는 길이 실제로 이어져 있는지 봅니다 */
  const draw = async () => {
    await pg.evaluate(() => { window.__TX__ = []; });
    await pg.evaluate(async () => { await drawPreview(); });
    await pg.waitForTimeout(120);
    return pg.evaluate(() => window.__TX__.slice());
  };
  await pg.click('#tab-share');
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { SHARE.team = (TEAMS.find(t => t.name === '세빈TEAM') || {}).id; });
  let TX = await draw();

  const has = t => TX.some(a => a.t === t);
  const hit = re => TX.filter(a => re.test(a.t)).map(a => a.t);
  const NAMES = ['홍길동가', '홍길동나', '홍길동다', '홍길동라', '홍길동마', '홍길동바', '홍길동사'];
  /* 위쪽 합계 띄 — 이름표는 y=135, 값은 y=153, 가로 자리(x)가 같다 */
  const kpi = () => {
    const o = {};
    TX.filter(a => Math.abs(a.y - 135) < 1.5).forEach(a => {
      const v = TX.find(b => Math.abs(b.y - 153) < 1.5 && Math.abs(b.x - a.x) < 1.5);
      if (v) o[a.t] = v.t;
    });
    return o;
  };

  head('[1] 처음 열면 <b>AP·PC 만</b> 줄에 선다 (사장님 말씀)');
  const onBox = await pg.$('#o-appc');
  is(!!onBox && await onBox.isChecked(), 'AP·PC 단계만 — <b>처음부터 켜져</b> 있다');
  is(has('홍길동가') && has('홍길동나'), 'AP 와 PC 는 나온다');
  is(!has('홍길동다') && !has('홍길동라') && !has('홍길동마') && !has('홍길동바') && !has('홍길동사'),
    '계약완료·TA·미접촉은 <b>이름도 안 나온다</b> — ' +
    NAMES.filter(has).join(', '));
  is(!has('TA') && !has('미접촉') && !has('계약완료'),
    '단계 딱지도 AP·PC 뿐이다 — ' + ['AP', 'PC', 'CS', 'TA', '미접촉', '계약완료', '증권전달'].filter(has).join(', '));
  const fxName = await pg.evaluate(() => ROWS.map(r => r.client));
  is(fxName.length > 0 && fxName.every(n => /^홍길동/.test(n)),
    '견본 이름은 <b>홍길동</b>이다 (3번) — ' + fxName.join(', '));

  head('[2] 위쪽 합계는 <b>팀 전체</b>에서 센다 — 줄을 좁혀도 계약은 계약이다 (1번)');
  /* d3 45만 + d6 50만 = 95만. 이 둘은 <b>표에 한 줄도 안 보이는</b> 계약이다.
     보이는 줄만 세면 0 원이 찍히고, 그것은 「계약이 없다」는 뜻이 된다.  */
  let K = kpi();
  is(K['계약업적'] === '950,000원',
    '계약업적 <b>950,000원</b> — 표에 한 줄도 안 보이는 계약 둘을 다 센다 · 찍힌 값 ' +
    (K['계약업적'] || '(없음)'));
  /* 증권 미전달은 계약완료 줄을 센다 — AP·PC 만 보면 표에는 한 줄도
     없는 것들이라, 좋하는 판이면 여기가 0건으로 깔려 「증권을 다 드렸다」가
     된다. 탑장님이 챙기실 것을 지우는 자리라 제일 위험하다 (1번).        */
  is(K['증권 미전달'] === '2건',
    '증권 미전달 <b>2건</b> — 안 보이는 계약을 0 으로 깔지 않는다 · 찍힌 값 ' +
    (K['증권 미전달'] || '(없음)'));
  is(K['AP·PC'] === '2건', 'AP·PC 합계 <b>2건</b> — 찍힌 값 ' + (K['AP·PC'] || '(없음)'));

  head('[3] AP·PC 가 <b>한 줄도 없는 팀원</b>의 계약도 든다 (여기가 제일 잘 샌다)');
  const m2in = await pg.evaluate(() => {
    const o = shareOpts(), tid = SHARE.team;
    const d = teamData(tid, o), a = teamAll(tid, o);
    return { shown: d.map(g => g.m.name), allN: a.length,
      m2cont: a.filter(r => r.client === '홍길동바').length };
  });
  is(m2in.shown.indexOf('홍길순') < 0, '홍길순(계약만 있는 분)은 <b>표에서는 빠진다</b>');
  is(m2in.m2cont === 1, '그래도 <b>합계에는 들어 있다</b> — teamAll 이 팀 전체를 본다');

  head('[4] 팀원 줄은 <b>보이는 건수와 전체 건수를 같이</b> 말한다');
  is(TX.some(a => /AP·PC 2건/.test(a.t) && /진행 4건/.test(a.t)),
    '「AP·PC 2건 · 진행 4건 · 계약 1건」 — ' +
    (hit(/진행 \d+건/).join(' | ') || '(없음)'));

  head('[5] 받는 사람이 <b>좁혀 보낸 줄</b> 안다 (1번 — 없는 것처럼 보이면 안 된다)');
  is(TX.some(a => /AP·PC 단계만/.test(a.t)), '머리글에 「AP·PC 단계만」이 적힌다 — ' +
    (hit(/기준/)[0] || '(없음)'));

  head('[6] <b>텍스트 복사</b>도 같은 줄만 나간다 (두 곳이 어긋나면 안 된다 · 5번)');
  await pg.evaluate(() => { window.__CLIP__ = []; });
  await pg.click('#b-txt');
  await pg.waitForTimeout(200);
  const txt = (await pg.evaluate(() => (window.__CLIP__[0] || '')));
  is(/홍길동가/.test(txt) && /홍길동나/.test(txt), '텍스트에도 AP·PC 가 나온다');
  is(!/홍길동다/.test(txt) && !/홍길동라/.test(txt) && !/홍길동마/.test(txt) && !/홍길동사/.test(txt),
    '텍스트에 다른 단계는 <b>안 나간다</b>');
  is(/AP·PC 단계만/.test(txt), '텍스트 머리글도 좁혀 보낸 것을 밝힌다');
  is(/진행 4건/.test(txt), '건수는 <b>전체</b>로 말한다 — ' +
    ((txt.split('\n').filter(l => /^▶/.test(l))[0]) || '(없음)'));

  head('[7] 끄면 <b>전부 돌아온다</b> — 못 보게 막은 것이 아니다');
  await pg.uncheck('#o-appc');
  TX = await draw();
  is(has('홍길동다') && has('홍길동라') && has('홍길동마') && has('홍길동바'),
    '계약완료·TA·미접촉이 다시 선다');
  is(has('계약완료') && has('TA'), '단계 딱지도 다 돌아온다');
  is(!TX.some(a => /AP·PC 단계만/.test(a.t)), '머리글의 「AP·PC 단계만」은 사라진다');
  K = kpi();
  is(K['계약업적'] === '950,000원' && K['증권 미전달'] === '2건',
    '합계는 <b>켜나 끄나 같다</b> — 계약업적 ' + K['계약업적'] + ' · 증권 미전달 ' + K['증권 미전달']);
  await pg.check('#o-appc');

  head('[8] 한 줄도 못 세우는 팀은 <b>빈 표를 그리지 않는다</b> (1번)');
  await pg.evaluate(() => { SHARE.team = (TEAMS.find(t => t.name === '상빈TEAM') || {}).id; });
  TX = await draw();
  is(TX.some(a => /AP·PC 단계인 건이 없습니다/.test(a.t)),
    '「AP·PC 단계인 건이 없습니다」라고 적는다 — ' +
    (hit(/없습니다/)[0] || '(없음)'));

  head('[9] 콘솔이 조용한가');
  is(errs.length === 0, '오류 없음' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log(bad ? `\n✗ ${bad}건` : '\n✓ 카톡 보내기 — AP·PC 단계만 나갑니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
