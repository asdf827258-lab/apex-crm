/* 조직도 — 그려 놓은 조직이 앱 전체에 실제로 반영되는가, 그리고 한눈에 보이는가.

   조직도(org_members)는 그림만 그리는 표였다. 앱의 나머지 —
   성장판 · 출근 · TFA 업무관리 · 고객 365일 · 팀 코칭 — 는
   teams / team_members / profiles.role 을 읽는다.
   그래서 조직도를 아무리 잘 그려도 「전체 반영」 이 안 됐다.

   여기서 확인하는 것.
     1. 가로 조직도가 층으로 쌓여 한 화면에 보인다
     2. 무엇이 바뀌는지 먼저 보여 준다 (팀·소속·권한·리더)
     3. 반영하면 teams / team_members / profiles 로 실제로 나간다
     4. 대표·운영자 권한은 절대 낮추지 않는다 — 스스로를 잠그면 안 된다
     5. 계정이 연결 안 된 사람은 건너뛰고, 몇 명인지 말해 준다             */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8826;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 실제 온탑본부 모양에 가깝게 — 본부장 아래 지점장 둘, 그 아래 설계사들 */
const STUB = `
window.__wrote=[];
window.__db={
  org:[
    {id:'o1',name:'윤시현',rank:'사업단장',team:'온탑본부',parent:'',member_id:'u1'},
    {id:'o2',name:'김지점',rank:'지점장',team:'온탑1팀',parent:'o1',member_id:'u2'},
    {id:'o3',name:'이지점',rank:'지점장',team:'온탑2팀',parent:'o1',member_id:'u3'},
    {id:'o4',name:'박서준',rank:'설계사',team:'온탑1팀',parent:'o2',member_id:'u4'},
    {id:'o5',name:'최민아',rank:'설계사',team:'온탑1팀',parent:'o2',member_id:'u5'},
    {id:'o6',name:'정하늘',rank:'신입',team:'온탑2팀',parent:'o3',member_id:'u6'},
    {id:'o7',name:'미연결',rank:'설계사',team:'온탑2팀',parent:'o3',member_id:null}
  ],
  teams:[{id:'t1',name:'온탑1팀',leader_id:null}],   /* 온탑본부·온탑2팀은 아직 없다 */
  team_members:[],
  profiles:[
    {id:'u1',name:'윤시현',role:'owner',active:true},
    {id:'u2',name:'김지점',role:'member',active:true},
    {id:'u3',name:'이지점',role:'member',active:true},
    {id:'u4',name:'박서준',role:'member',active:true},
    {id:'u5',name:'최민아',role:'admin',active:true},   /* 운영자 — 낮추면 안 된다 */
    {id:'u6',name:'정하늘',role:'member',active:true}
  ]
};
window.supabase={createClient:function(){
 function rows(tbl){
   if(tbl==='org_members')return window.__db.org;
   if(tbl==='teams')return window.__db.teams;
   if(tbl==='team_members')return window.__db.team_members;
   if(tbl==='profiles')return window.__db.profiles;
   return [];
 }
 function mk(tbl){
   var f={},single=false;
   var a={select:function(){return a},eq:function(k,v){f[k]=v;return a},gte:function(){return a},
     lte:function(){return a},is:function(){return a},neq:function(){return a},in:function(){return a},
     not:function(){return a},order:function(){return a},limit:function(){return a},
     range:function(){return a},single:function(){single=true;return a},
     insert:function(v){window.__wrote.push({t:tbl,op:'insert',v:v});
       var L=(v&&v.push)?v:[v];
       if(tbl==='teams')L.forEach(function(x,i){window.__db.teams.push({id:'nt'+window.__db.teams.length+i,name:x.name,leader_id:null})});
       if(tbl==='team_members')L.forEach(function(x){window.__db.team_members.push({team_id:x.team_id,member_id:x.member_id})});
       return a},
     update:function(v){f._upd=v;return a},
     upsert:function(v){window.__wrote.push({t:tbl,op:'upsert',v:v});return a},
     then:function(res){
       /* 여기서야 거르개가 다 붙었다 — 이제 적용한다 */
       if(f._upd){
         window.__wrote.push({t:tbl,op:'update',v:f._upd,f:JSON.parse(JSON.stringify(f))});
         if(tbl==='profiles'&&f.id)window.__db.profiles.forEach(function(p){if(p.id===f.id)p.role=f._upd.role});
         if(tbl==='teams'&&f.id)window.__db.teams.forEach(function(t){if(t.id===f.id)t.leader_id=f._upd.leader_id});
         return Promise.resolve({data:null,error:null}).then(res);
       }
       if(f._del){
         window.__wrote.push({t:tbl,op:'delete',f:JSON.parse(JSON.stringify(f))});
         if(tbl==='team_members'&&f.member_id)
           window.__db.team_members=window.__db.team_members.filter(function(x){return x.member_id!==f.member_id});
         return Promise.resolve({data:null,error:null}).then(res);
       }
       var d=rows(tbl).filter(function(x){for(var k in f)if(k.charAt(0)!=='_'&&(''+x[k])!==(''+f[k]))return false;return true});
       return Promise.resolve({data:single?(d[0]||null):d,error:null}).then(res)}};
   a['delete']=function(){f._del=1;return a};
   return a;
 }
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'y@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem('apex_ar_auto_off', '1'); localStorage.setItem('apex_ar_brief_off', '1');
    } catch (e) { }
  });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'u1', email: 'y@t' } };
    window.__toast = []; window.toast = function (m) { window.__toast.push(m); };
    /* 조직도를 이 기기에 심는다 (서버에서 내려받은 것과 같은 모양) */
    localStorage.setItem('apex_org_chart', JSON.stringify(window.__db.org));
    go('org');
  });
  await page.waitForTimeout(800);

  /* ── ① 가로 조직도 ── */
  const v = await page.evaluate(() => ({
    wide: !!document.querySelector('.ogv'),
    cards: document.querySelectorAll('.ogv-c').length,
    levels: document.querySelectorAll('.ogv ul').length,
    names: Array.prototype.map.call(document.querySelectorAll('.ogv-c b'), e => e.textContent.trim()),
    bar: (document.querySelector('.ogv-n') || {}).textContent || '',
    css: !!document.getElementById('orgWideCss'),
    scrollX: (() => { const s = document.querySelector('.ogv-scroll'); return s ? s.scrollWidth >= s.clientWidth : false; })()
  }));
  ok(v.wide, '가로 조직도가 기본으로 열린다');
  ok(v.cards === 7, '구성원 7명이 모두 칸으로 나온다 (' + v.cards + '명)');
  ok(v.levels >= 3, '층이 쌓여 있다 — 본부 → 지점 → 팀원 (' + v.levels + '단)');
  ok(v.names[0] === '윤시현', '맨 위가 최상위다 — ' + v.names.slice(0, 3).join(' · '));
  ok(/7명/.test(v.bar) && /3층/.test(v.bar), '몇 명 · 몇 층인지 위에 적힌다 — ' + v.bar);
  ok(v.css, '조직도 모양(선·칸)이 붙는다');

  /* 크게·작게 */
  const z = await page.evaluate(() => {
    const before = orgZoom(); orgZoomSet(-10);
    const el = document.getElementById('orgWideInner');
    return { before, after: orgZoom(), zoom: el ? el.style.zoom : '', lbl: (document.getElementById('orgZoomLbl') || {}).textContent };
  });
  ok(z.after === z.before - 10 && /0\.9/.test('' + z.zoom), '작게·크게가 먹는다 (' + z.before + '% → ' + z.after + '%)');
  ok(/90%/.test(z.lbl || ''), '지금 배율이 보인다 — ' + z.lbl);

  /* 목록 보기로도 돌아간다 */
  const l = await page.evaluate(() => {
    orgViewSet('list');
    return { list: !document.querySelector('.ogv'), cards: document.querySelectorAll('.card').length };
  });
  ok(l.list, '「목록으로」 를 누르면 옛 목록으로 돌아간다');
  await page.evaluate(() => orgViewSet('wide'));
  await page.waitForTimeout(400);

  /* ── ② 무엇이 바뀌는지 먼저 보여 준다 ── */
  const plan = await page.evaluate(async () => {
    orgApplyPlan();
    await new Promise(r => setTimeout(r, 700));
    return { P: ORGA.plan, txt: (document.getElementById('orgApplyBox') || {}).textContent || '' };
  });
  ok(plan.P, '반영 계획이 나온다');
  ok(plan.P.teams.length === 2 && plan.P.teams.indexOf('온탑본부') >= 0 && plan.P.teams.indexOf('온탑2팀') >= 0,
    '없는 팀 둘을 새로 만든다고 한다 — ' + plan.P.teams.join(', '));
  ok(plan.P.assign.length === 6, '계정이 붙은 6명의 소속을 배정한다고 한다 (' + plan.P.assign.length + '명)');
  ok(plan.P.leaders.length === 2, '지점장 둘을 팀 리더로 지정한다고 한다 (' + plan.P.leaders.length + '명)');
  ok(plan.P.skip.length === 1 && /미연결/.test(plan.P.skip[0]),
    '계정이 없는 사람은 건너뛴다고 미리 말한다 — ' + plan.P.skip[0]);
  ok(/계정 연결/.test(plan.txt), '왜 건너뛰는지, 어떻게 하면 되는지 적어 준다');

  /* 대표·운영자는 계획에서부터 빠져 있어야 한다 */
  const who = plan.P.roles.map(x => x.nm);
  ok(who.indexOf('윤시현') < 0, '대표(나) 는 권한 변경 대상이 아니다');
  ok(who.indexOf('최민아') < 0, '운영자는 낮추지 않는다 — 스스로를 잠그면 안 된다');
  ok(who.indexOf('김지점') >= 0 && who.indexOf('이지점') >= 0,
    '지점장 둘은 리더 권한으로 올린다 — ' + who.join(', '));
  ok(plan.P.roles.every(x => x.to !== 'owner' && x.to !== 'admin'), '조직도가 대표·운영자를 만들어 내지는 않는다');

  /* ── ③ 실제로 반영된다 ── */
  const done = await page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    window.confirm = () => true;
    orgApplyRun();
    await new Promise(r => setTimeout(r, 1400));
    return {
      wrote: window.__wrote,
      teams: window.__db.teams.map(t => t.name + (t.leader_id ? ('/' + t.leader_id) : '')),
      members: window.__db.team_members.length,
      roles: window.__db.profiles.map(p => p.name + ':' + p.role),
      msg: window.__toast.join(' | ')
    };
  });
  const ins = done.wrote.filter(w => w.t === 'teams' && w.op === 'insert');
  ok(ins.length === 1 && ins[0].v.length === 2, '없던 팀을 서버에 만든다');
  const tj = done.teams.join(', ');
  ok(/온탑본부/.test(tj) && /온탑2팀/.test(tj), '팀이 실제로 생겼다 — ' + tj);
  ok(done.members === 6, '소속이 실제로 배정됐다 (' + done.members + '명)');
  ok(done.roles.indexOf('김지점:leader') >= 0 && done.roles.indexOf('이지점:leader') >= 0,
    '지점장 권한이 실제로 바뀌었다');
  ok(done.roles.indexOf('윤시현:owner') >= 0 && done.roles.indexOf('최민아:admin') >= 0,
    '대표·운영자 권한은 그대로다 — ' + done.roles.join(' '));
  ok(done.wrote.filter(w => w.t === 'teams' && w.op === 'update').length === 2,
    '팀마다 리더를 지정했다');
  ok(/앱 전체에 반영했습니다/.test(done.msg), '끝나면 무엇이 됐는지 말해 준다 — ' + done.msg.slice(0, 50));
  ok(/성장판/.test(done.msg) && /고객 365일/.test(done.msg),
    '어디에 반영됐는지 이름을 짚어 준다');

  /* 두 번째는 바꿀 것이 없다 */
  const again = await page.evaluate(async () => {
    orgApplyPlan();
    await new Promise(r => setTimeout(r, 700));
    return { total: ORGA.plan ? ORGA.plan.total : -1, txt: (document.getElementById('orgApplyBox') || {}).textContent || '' };
  });
  ok(again.total === 0, '두 번 눌러도 같은 일을 또 하지 않는다 (' + again.total + '건)');
  ok(/이미 조직도대로/.test(again.txt), '이미 맞다고 말해 준다');

  /* ── 서버에서 불러왔는데 화면에 안 보이던 문제 ──
     orgPull 은 ORGS.srv 에만 담고 화면은 이 기기(localStorage) 것을 그렸다.
     그래서 「다 불러왔는데 안 보인다」 가 됐다. */
  const pulled = await page.evaluate(async () => {
    localStorage.removeItem('apex_org_chart');   /* 새 컴퓨터에서 처음 여는 상황 */
    ORGS.pulled = false; ORGS.srv = null; ORGS.err = '';
    go('org');
    await new Promise(r => setTimeout(r, 300));
    const before = document.querySelectorAll('.ogv-c').length;
    orgPull(true);
    await new Promise(r => setTimeout(r, 900));
    return {
      before,
      after: document.querySelectorAll('.ogv-c').length,
      saved: JSON.parse(localStorage.getItem('apex_org_chart') || '[]').length,
      names: Array.prototype.map.call(document.querySelectorAll('.ogv-c b'), e => e.textContent.trim())
    };
  });
  /* 조직도 화면을 열면 스스로 불러온다 — 「불러오기」 를 안 눌러도 된다 */
  ok(pulled.before === 7, '조직도를 열면 서버 것을 스스로 가져와 바로 보여 준다 (' + pulled.before + '명)');
  ok(pulled.after === 7, '「↻ 새로고침」 을 눌러도 그대로 7명 (' + pulled.after + '명)');
  ok(pulled.saved === 7, '이 기기에도 저장돼 다음에 열면 그대로 있다');
  ok(pulled.names.indexOf('박서준') >= 0, '서버에 있던 사람이 실제로 보인다 — ' + pulled.names.join(' · '));

  /* ── 이 기기에 내 것이 있으면 말없이 덮어쓰지 않는다 ── */
  const keep = await page.evaluate(async () => {
    localStorage.setItem('apex_org_chart', JSON.stringify([
      { id: 'x1', name: '내가적은사람', rank: '설계사', team: '내팀', parent: '' },
      { id: 'x2', name: '둘째', rank: '설계사', team: '내팀', parent: 'x1' },
      { id: 'x3', name: '셋째', rank: '설계사', team: '내팀', parent: 'x1' }
    ]));
    ORGS.pulled = false; ORGS.srv = null;
    go('org');
    await new Promise(r => setTimeout(r, 200));
    orgPull(true);
    await new Promise(r => setTimeout(r, 900));
    return {
      saved: JSON.parse(localStorage.getItem('apex_org_chart') || '[]').length,
      names: Array.prototype.map.call(document.querySelectorAll('.ogv-c b'), e => e.textContent.trim()),
      bar: (document.getElementById('orgSyncBar') || {}).textContent || ''
    };
  });
  ok(keep.saved === 3 && keep.names.indexOf('내가적은사람') >= 0,
    '이 기기에 적어 둔 것은 말없이 안 덮어쓴다 — ' + keep.names.join(' · '));
  ok(/다릅니다/.test(keep.bar) && /가져오기/.test(keep.bar),
    '대신 다르다고 알리고 가져올 방법을 준다');

  /* ── 상하관계가 꼬여도 사람은 반드시 보인다 ── */
  const cyc = await page.evaluate(async () => {
    /* 서로가 서로의 윗사람 — 최상위가 없다. 여태 이러면 화면이 통째로 비었다 */
    localStorage.setItem('apex_org_chart', JSON.stringify([
      { id: 'c1', name: '가', rank: '설계사', team: 'T', parent: 'c2' },
      { id: 'c2', name: '나', rank: '설계사', team: 'T', parent: 'c1' },
      { id: 'c3', name: '다', rank: '설계사', team: 'T', parent: 'c1' }
    ]));
    go('org');
    await new Promise(r => setTimeout(r, 300));
    const wide = {
      cards: document.querySelectorAll('.ogv-c').length,
      names: Array.prototype.map.call(document.querySelectorAll('.ogv-c b'), e => e.textContent.trim()),
      warn: (document.querySelector('.ogv-bar') || {}).textContent || ''
    };
    orgViewSet('list');
    await new Promise(r => setTimeout(r, 300));
    const list = { txt: (document.body.textContent || '') };
    orgViewSet('wide');
    await new Promise(r => setTimeout(r, 300));
    return { wide, list };
  });
  ok(cyc.wide.cards === 3, '상하관계가 서로 물려 있어도 세 명이 다 보인다 (' + cyc.wide.cards + '명)');
  ok(cyc.wide.names.indexOf('가') >= 0 && cyc.wide.names.indexOf('나') >= 0 && cyc.wide.names.indexOf('다') >= 0,
    '한 명도 안 사라진다 — ' + cyc.wide.names.join(' · '));
  ok(/윗사람 미지정/.test(cyc.wide.warn), '자리를 못 잡은 사람이 몇 명인지 알려 준다 — ' + cyc.wide.warn);
  ok(/윗사람이 지정되지 않은/.test(cyc.list.txt), '목록 보기에서도 빠뜨리지 않고 이유를 적어 준다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n조직도 검사 실패:'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('\n조직도 검사 통과');
})();
