/* DB 통합 CRM 화면 캡처 — 저장소를 그대로 띄우고 가짜 서버를 물려 찍는다.
   앱 파일은 읽기만 한다. 이름은 전부 견본용 가짜다(홍길동 외).            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/apex-crm', PORT = 8862;
const OUT = process.argv[2] || '.';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const day = n => { const d = new Date('2026-08-16T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const at = (n, h) => { const d = new Date('2026-08-16T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); d.setUTCHours(h, 0, 0, 0); return d.toISOString(); };

const STUB = `
var PROFILES=[
 {id:'m0',name:'윤시현',role:'admin',active:true},
 {id:'m1',name:'김설계',role:'member',active:true},
 {id:'m2',name:'이상담',role:'member',active:true}
];
var DBS=${JSON.stringify([
  ['d1', '홍길동', '010-0000-1000', 'm0', -6, '보장분석 3DB', '서울 강남', 'AP', at(-4, 3)],
  ['d2', '김철수', '010-0000-1001', 'm1', -8, '지인소개', '성남 분당', 'TA', ''],
  ['d3', '이영희', '010-0000-1002', 'm2', -10, '온라인 리드', '수원 영통', 'PC', at(-2, 1)],
  ['d4', '박민수', '010-0000-1003', 'm0', -12, '보장분석 3DB', '서울 강남', 'CS', at(-1, 3)],
  ['d5', '최지은', '010-0000-1004', 'm1', -14, '지인소개', '성남 분당', '계약완료', ''],
  ['d6', '정대호', '010-0000-1005', 'm2', -16, '온라인 리드', '수원 영통', '증권전달', ''],
  ['d7', '강수진', '010-0000-1006', 'm0', -18, '보장분석 3DB', '서울 강남', '미접촉', ''],
  ['d8', '윤태영', '010-0000-1007', 'm1', -20, '지인소개', '성남 분당', 'TA', ''],
  ['d9', '임하늘', '010-0000-1008', 'm2', -22, '온라인 리드', '수원 영통', 'AP', at(1, 2)],
  ['d10', '오세라', '010-0000-1009', 'm0', -24, '보장분석 3DB', '서울 강남', 'PC', at(2, 4)],
].map(r => ({
  id: r[0], customer_name: r[1], phone: r[2], assigned_to: r[3],
  assigned_date: day(r[4]), created_at: at(r[4], 0), source: r[5], region: r[6],
  stage: r[7], next_appt: r[8], report_name: '보장분석 3DB'
})))};
var CALLS=${JSON.stringify([
  ['k1', 'd1', -4, '상담', '자녀 교육자금 궁금하다고 하심. 증권 사진 보내 주기로 함', 'm0', at(-4, 3), true],
  ['k2', 'd1', -6, '부재', '', 'm0', '', false],
  ['k3', 'd2', -7, '부재', '두 번째 부재 — 저녁에 다시', 'm1', '', false],
  ['k4', 'd3', -2, '상담', '실손 5세대 전환 문의. 배우자분과 같이 듣고 싶다고 하심', 'm2', at(-2, 1), true],
  ['k5', 'd4', -1, '상담', '', 'm0', at(-1, 3), false],
  ['k6', 'd5', -3, '상담', '청약 완료. 증권 나오면 전달', 'm1', '', true],
  ['k7', 'd7', -18, '거절', '지금은 생각 없다고 하심. 3개월 뒤 재접촉', 'm0', '', false],
].map(c => ({
  id: c[0], db_id: c[1], call_at: at(c[2], 10), result: c[3], memo: c[4],
  created_by: c[5], appointment_at: c[6], recording_delivered: c[7], issue: false
})))};
window.__CRMSTUB=1;
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},single=false,a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},neq:function(){return a},
   limit:function(){return a},range:function(){return a},ilike:function(){return a},
   single:function(){single=true;return a},maybeSingle:function(){single=true;return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){
     var out=[];
     if(tbl==='profiles'){out=PROFILES;if(f.id)out=PROFILES.filter(function(x){return x.id===f.id});}
     else if(tbl==='dbs')out=DBS;
     else if(tbl==='calls')out=CALLS;
     else if(tbl==='teams')out=[{id:'t1',name:'온탑 1팀',color:'#3182F6'}];
     else if(tbl==='team_members')out=PROFILES.map(function(p){return {team_id:'t1',member_id:p.id}});
     else if(tbl==='app_config')out=[{key:'db_sources',value:'보장분석 3DB,지인소개,온라인 리드,방송,NS홈쇼핑 화재보험'}];
     else if(tbl==='clients')out=[{advisor_id:'m1',name_masked:'최○○'}];
     else if(tbl==='attendance')out=PROFILES.map(function(p){return {member_id:p.id,work_date:'${day(0)}',checkin_at:'${at(0, 0)}'}});
     else out=[];
     return Promise.resolve({data:single?(out[0]||null):out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  channel:function(){return {on:function(){return this},subscribe:function(){return this}}},
  removeChannel:function(){},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'m0',email:'demo@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'m0'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signInWithPassword:function(){return Promise.resolve({data:{},error:null})},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1480, height: 980 }, deviceScaleFactor: 2 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  ! ' + String(e).slice(0, 120)));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => ({
    auth: !!document.getElementById('authScreen') && !document.getElementById('authScreen').classList.contains('hidden'),
    app: !!document.getElementById('app') && !document.getElementById('app').classList.contains('hidden'),
    dbs: (typeof dbs !== 'undefined') ? dbs.length : -1,
    rows: document.querySelectorAll('#dbBody tr').length
  }));
  console.log('상태:', JSON.stringify(state));

  const shot = async (name, fn, wait) => {
    if (fn) await page.evaluate(fn);
    await page.waitForTimeout(wait || 1100);
    await page.screenshot({ path: OUT + '/crm-' + name + '.png' });
    console.log('  ✓ ' + name);
  };

  const close = () => page.evaluate(() => closeModal('callModal'));

  await shot('dash', () => goPage('dashboard'));
  await shot('db', () => goPage('db'));
  await shot('call', () => { goPage('db'); openCall('d1'); }, 1600);
  // 화법 패널 아래 — 결과·약속·메모 입력칸이 보이게 끝까지 내린다
  await shot('callform', () => {
    const d = document.getElementById('taScript');
    if (d) d.open = false;
    const t = document.querySelector('#callModal .modal-body');
    if (t) t.scrollTop = 0;
  }, 1200);
  await close();
  await shot('kpi', () => goPage('kpi'));
  await close();
  await shot('touch', () => goPage('touch'));
  await close();
  await shot('tascript', () => goPage('tascript'), 3600);


  /* ── 고객 처방전 확인 ── */
  await page.evaluate(() => goPage('touch'));
  await page.waitForTimeout(900);
  const rx0 = await page.evaluate(() => ({
    box: !!document.getElementById('rxSearch'),
    chips: document.querySelectorAll('#rxChips .rx-chip').length,
    err: window.__rxErr || null
  }));
  console.log('처방전 칸:', JSON.stringify(rx0));

  await page.fill('#rxSearch', '돈이 안 모여요');
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/rx-hit.png' });
  const rx1 = await page.evaluate(() => ({
    cards: document.querySelectorAll('#rxOut .rx-card').length,
    title: (document.querySelector('#rxOut .rx-t') || {}).textContent,
    steps: [...document.querySelectorAll('#rxOut .rx-step')].map(e => e.textContent.trim())
  }));
  console.log('검색 「돈이 안 모여요」:', JSON.stringify(rx1, null, 1));

  await page.fill('#rxSearch', '사고');
  await page.waitForTimeout(400);
  const rx2 = await page.evaluate(() => (document.querySelector('#rxOut .rx-t') || {}).textContent);
  console.log('검색 「사고」:', rx2);

  await page.fill('#rxSearch', '돈모여');           // 줄여 적어도 찾나
  await page.waitForTimeout(400);
  const rx3 = await page.evaluate(() => (document.querySelector('#rxOut .rx-t') || {}).textContent);
  console.log('검색 「돈모여」(줄임):', rx3);

  await page.fill('#rxSearch', '우주여행');          // 없는 말
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '/rx-none.png' });
  const rx4 = await page.evaluate(() => (document.querySelector('#rxOut .rx-none') || {}).textContent);
  console.log('검색 「우주여행」:', (rx4 || '').slice(0, 60));

  await page.fill('#rxSearch', '보험 많이');
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '/rx-full.png', fullPage: false });


  /* 책에 실을 그림 — 처방전 칸만 딱 잘라서 */
  const rxBox = page.locator('.rx-box').first();
  await page.fill('#rxSearch', '보험 많이 들어 있어요');
  await page.waitForTimeout(500);
  await rxBox.screenshot({ path: OUT + '/b-rx1.png' });
  await page.fill('#rxSearch', '사고 났어요');
  await page.waitForTimeout(500);
  await rxBox.screenshot({ path: OUT + '/b-rx2.png' });
  await page.fill('#rxSearch', '');
  await page.waitForTimeout(400);
  await rxBox.screenshot({ path: OUT + '/b-rx0.png' });
  await page.fill('#rxSearch', '우주여행');
  await page.waitForTimeout(400);
  await rxBox.screenshot({ path: OUT + '/b-rx3.png' });
  console.log('  ✓ 책에 실을 그림 넷');

  await browser.close(); srv.close();
})();
