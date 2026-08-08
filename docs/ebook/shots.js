/* 전자책에 넣을 화면 캡처 — 실제 앱을 띄우고, 그럴듯한 기록을 심어 찍는다.
   빈 화면을 찍으면 "이렇게 나옵니다" 가 거짓말이 된다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8851;
const OUT = process.argv[2];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const ago = n => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const later = n => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* 가짜 서버 — 팀 다섯 명, 고객 넷, 활동 기록까지 그럴듯하게 */
const STUB = `
window.__ins=[];
var TEAM=[
 {id:'m0',name:'윤시현',role:'owner',active:true,workspace:'w1',status:'active',plan:'vip'},
 {id:'m1',name:'박서준',role:'member',active:true,workspace:'w1',status:'active',plan:'pro'},
 {id:'m2',name:'이지훈',role:'member',active:true,workspace:'w1',status:'active',plan:'pro'},
 {id:'m3',name:'최민아',role:'member',active:true,workspace:'w1',status:'active',plan:'basic'},
 {id:'m4',name:'정하늘',role:'member',active:true,workspace:'w1',status:'pending',plan:'free'}
];
var CLI=[
 {id:'c1',name_masked:'김○○',consent_status:'granted',created_at:'2025-01-10T00:00:00Z',phone:'010-1234-5678'},
 {id:'c2',name_masked:'김○○',consent_status:'granted',created_at:'2025-02-11T00:00:00Z',phone:'010-2222-3333'},
 {id:'c3',name_masked:'박○○',consent_status:'none',created_at:'2025-03-12T00:00:00Z',phone:'010-7777-8888'},
 {id:'c4',name_masked:'최○○',consent_status:'none',created_at:'2024-06-05T00:00:00Z',phone:''}
];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},neq={},up=null,a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},neq:function(k,v){neq[k]=v;return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(r){window.__ins.push({t:tbl,r:r});return a},
   update:function(r){up=r;return a},upsert:function(r){window.__ins.push({t:tbl,r:r});return a},
   then:function(res){
     if(up)return Promise.resolve({data:null,error:null}).then(res);
     var out=[];
     if(tbl==='profiles')out=TEAM;
     else if(tbl==='clients'){out=CLI;if(f.id)out=CLI.filter(function(x){return x.id===f.id;});}
     else if(tbl==='teams')out=[{id:'w1',name:'1팀 · 순천지점',leader_id:'m0'}];
     else if(tbl==='team_members')out=TEAM.map(function(p){return {team_id:'w1',member_id:p.id};});
     else if(tbl==='saved_reports')out=(window.__META||[]);
     else out=[];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'m0',email:'yun@apex.kr'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'m0'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1480, height: 1000 }, deviceScaleFactor: 2 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  await page.evaluate(([a2, a9, a40, a75, l3, md]) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'm0', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'm0', email: 'yun@apex.kr' } };
    OS.cfg = {
      schema_version: '32', biz_name: '에이플러스에셋어드바이저 온탑본부', biz_ceo: '윤시현',
      svc_name: 'APEX YUN PRO', biz_tel: '061-000-0000'
    };
    window.aiReady = () => true; window.claudeReady = () => true;
    try { localStorage.clear(); } catch (e) { }

    /* 오늘 여섯 개는 해 둔 상태 — 빈 체크판은 설명이 안 된다 */
    ckSave('day', { d1: 1, d2: 1, d3: 1, d4: 1, d6: 1, d11: 1 });
    ckSave('week', { w1: 1, w2: 1 });

    /* 도와줄 것 두 건 */
    HELP.loaded = true;
    HELP.list = [
      { id: 'h1', who: '박서준', what: '김○○ 심사 걸린 것 대신 확인', due: (new Date()).toISOString().slice(0, 10), done: 0, up: 1 },
      { id: 'h2', who: '이지훈', what: '증권 못 받아 옴 — 오늘 다시 요청', due: l3, done: 0, up: 1 }
    ];

    /* 팀 성장 기록 */
    GB.loaded = true; GB.busy = false; GB.teams = [{ id: 'w1', name: '1팀 · 순천지점', leader_id: 'm0' }];
    GB.team = ''; GB.notes = []; GB.pass = { m0: { s1: 1, s2: 1, s12: 1 } };
    const mk = (id, nm, raw) => { const r = { id: id, name: nm, team: 'w1', sc: {}, raw: raw, any: 1, lastAtt: '', last: '' }; gbScore(r); return r; };
    GB.rows = [
      mk('m0', '윤시현', { att: 20, run: 9, call: 118, cli: 9, rep: 10, stu: 12 }),
      mk('m1', '박서준', { att: 19, run: 7, call: 92, cli: 6, rep: 5, stu: 8 }),
      mk('m2', '이지훈', { att: 20, run: 3, call: 34, cli: 2, rep: 1, stu: 3 }),
      mk('m3', '최민아', { att: 12, run: 5, call: 61, cli: 4, rep: 4, stu: 6 }),
      mk('m4', '정하늘', { att: 18, run: 1, call: 8, cli: 0, rep: 0, stu: 1 })
    ];
    window.gbMyId = () => 'm0';
    window.gbMiss = function (list) {
      return [
        { r: GB.rows[4], why: ['출근은 하는데 활동 기록이 한 건도 없습니다'] },
        { r: GB.rows[2], why: ['전화가 기준의 3분의 1입니다'] },
        { r: GB.rows[3], why: ['이번 달 출근이 12일입니다'] }
      ];
    };

    /* 고객 관리 기록 */
    cmRealSet('c1', '김철수'); cmRealSet('c2', '김민지'); cmRealSet('c3', '박서준님');
    CM.loaded = true;
    CM.meta = {
      c1: {
        fp: { f_age: '45', f_gender: '남성', f_job: '제조업 대표', f_ret: '60', f_income: '520', f_sincome: '240', f_house: '85', f_loan: '120', f_edu: '90', f_ins: '46', c_cancer: '3000', c_brain: '2000', c_death: '10000' },
        fam: '김철수 가족', rel: '본인', next: { what: '증권 받아서 보장분석 돌리기', due: l3 },
        touch: [{ at: a2, how: '만남', note: '치료비 통장 설명함. 아이 내년 중학교' },
        { at: a9, how: '전화', note: '증권 찾아본다고 하심' }], bd: md, up: 1
      },
      c2: { fp: {}, fam: '김철수 가족', rel: '배우자', next: null, touch: [{ at: a40, how: '전화', note: '' }], bd: '', up: 1 },
      c3: { fp: {}, fam: '', rel: '', next: { what: '증권 받기', due: a2 }, touch: [], bd: '', up: 1 },
      c4: { fp: {}, fam: '', rel: '', next: null, touch: [{ at: a75, how: '카톡', note: '' }], bd: '', up: 1 }
    };

    /* 두뇌 대화 하나 + 모범 답안 하나 */
    BRAIN.hist = [{
      q: '40대 자영업 대표에게 치료비 통장을 어떻게 설명할까?',
      a: '## 결론\n**통장을 먼저 보여 주세요.** 상품이 아니라 구조를 보여 주는 것이 순서입니다.\n\n### 왜 통장인가\n- 대표님들은 "보험료"라는 말에 방어합니다. "통장"은 자산 언어입니다.\n- 사업 통장과 생활 통장을 나누는 습관이 이미 있습니다. 그 옆에 하나 더 두는 것입니다.\n\n### 이렇게 여세요\n> "대표님, 사업 통장 따로 두시죠? 큰 병 왔을 때 쓰는 통장도 하나 있어야 합니다."\n\n### 숫자로 못 박기\n| 구분 | 지금 | 필요 |\n| --- | --- | --- |\n| 암 진단금 | 3,000만원 | 5,000만원 |\n| 뇌·심 | 2,000만원 | 3,000만원 |\n\n보장 여부는 개별 약관과 보험사 심사 결과에 따릅니다.',
      eng: '', note: ''
    }];
    try {
      localStorage.setItem('apex_brain_bx_m0', JSON.stringify([
        { q: '기존 보험 해지 안 하려는 고객 반론', a: '먼저 잘하셨다고 합니다. 그다음 지금 것을 그대로 두고 무엇이 비었는지만 봅니다.', at: (new Date()).toISOString().slice(0, 10) }
      ]));
      localStorage.setItem('apex_brain_kb', '나의 상담 철학: 상품보다 구조를 먼저 보여 준다. 치료비 통장 프레임으로 연다.');
    } catch (e) { }
  }, [ago(2), ago(9), ago(40), ago(75), later(3), (new Date()).toISOString().slice(5, 10)]);

  const shot = async (name, tab, prep, opts) => {
    opts = opts || {};
    await page.evaluate(t => { if (t) go(t); }, tab);
    await page.waitForTimeout(opts.wait || 900);
    if (prep) { await page.evaluate(prep); await page.waitForTimeout(opts.wait2 || 700); }
    const el = opts.sel ? await page.$(opts.sel) : await page.$('#main');
    if (!el) { console.log('  ✗ ' + name + ' — 못 찾음'); return; }
    await el.screenshot({ path: OUT + '/' + name + '.png' });
    console.log('  ✓ ' + name);
  };

  await shot('01-home', 'home');
  await shot('02-ready', 'ready', null, { wait: 1600 });
  await shot('03-ck-my', 'ckboard', () => ckGo('today'));
  await shot('04-ck-leader', 'ckboard', () => { ckGo('leader'); }, { wait2: 1600 });
  await shot('05-grow', 'growboard', null, { wait: 1600 });
  await shot('06-clients', 'clients', () => { OSC.view = 'list'; go('clients'); }, { wait2: 1200 });
  await shot('07-client-one', 'clients', () => { osOpenClient('c1'); }, { wait2: 1400 });
  await shot('08-brain', 'brain', () => { brainRenderThread(); bdPaint(); }, { wait2: 900 });
  await shot('09-voice', 'voiceasst');
  await shot('10-talk', 'fp_talk');
  await shot('11-settings', 'settings', () => {
    const c = document.querySelectorAll('.set-card')[1];
    if (c) c.scrollIntoView({ block: 'start' });
  }, { wait: 1400 });
  await shot('12-route', 'ckboard', () => ckGo('route'));

  await browser.close(); srv.close();
})();
