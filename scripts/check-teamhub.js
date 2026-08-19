/* TEAM 총괄 관리 · 설정 — 한 칸에서 다 보이는가.

   네 화면을 하나로 접었다. 접었다고 없어지면 안 된다.
   그래서 여기서는 「메뉴에서 사라졌는데 여전히 열리는가」를 먼저 보고,
   그다음에 왼쪽에서 고른 것이 오른쪽에 제대로 뜨는지를 본다.
   설정은 스물여섯 장이 세로로 쌓여 있던 곳이다. 접혀 있는지 센다.        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8837;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 팀 넷 — 잘하는 사람 하나, 보통 하나, 막힌 사람 하나, 그리고 지점장 */
const STUB = `
window.__ins=[];window.__neq=[];window.__aiCalls=[];
window.__T=(function(){var d=new Date();return function(n){var x=new Date(d.getTime()-n*86400000);return x.toISOString().slice(0,10);};})();
window.__profiles=[
 {id:'p1',name:'윤시현',role:'owner',active:true,workspace:null},
 {id:'p2',name:'박서준',role:'member',active:true,workspace:null},
 {id:'p3',name:'최민아',role:'member',active:true,workspace:null},
 {id:'p4',name:'이지훈',role:'member',active:true,workspace:null}
];
window.__teams=[{id:'t1',name:'온탑1팀',leader_id:'p1'},{id:'t2',name:'온탑2팀',leader_id:'p3'}];
window.__team_members=[{team_id:'t1',member_id:'p1'},{team_id:'t1',member_id:'p2'},
 {team_id:'t2',member_id:'p3'}];
window.__attendance=(function(){var a=[],i;
 for(i=0;i<18;i++)a.push({member_id:'p2',att_date:window.__T(i)});
 for(i=0;i<9;i++)a.push({member_id:'p3',att_date:window.__T(i)});
 for(i=0;i<2;i++)a.push({member_id:'p4',att_date:window.__T(i)});
 for(i=0;i<15;i++)a.push({member_id:'p1',att_date:window.__T(i)});
 return a;})();
window.__calls=(function(){var a=[],i;
 for(i=0;i<62;i++)a.push({db_id:'d'+(i%20),created_by:'p2',call_at:window.__T(i%25)+'T10:00:00',result:i%7===0?'상담':'부재'});
 for(i=0;i<20;i++)a.push({db_id:'d'+(i%12),created_by:'p3',call_at:window.__T(i%25)+'T10:00:00',result:i%10===0?'상담':'부재'});
 for(i=0;i<34;i++)a.push({db_id:'d'+(i%9),created_by:'p1',call_at:window.__T(i%25)+'T10:00:00',result:i%8===0?'상담':'부재'});
 /* 손 놓은 지 오래된 것들 — 이게 다시 걸 사람이다 */
 a.push({db_id:'d15',created_by:'p2',call_at:window.__T(9)+'T10:00:00',result:'부재'});
 a.push({db_id:'d16',created_by:'p2',call_at:window.__T(20)+'T10:00:00',result:'거절'});
 a.push({db_id:'d17',created_by:'p2',call_at:window.__T(45)+'T10:00:00',result:'부재'});
 a.push({db_id:'d18',created_by:'p2',call_at:window.__T(2)+'T10:00:00',result:'상담',
   appointment_at:window.__T(-1)+'T14:00:00'});
 a.push({db_id:'d90',created_by:'p2',call_at:window.__T(40)+'T10:00:00',result:'부재'});
 a.push({db_id:'d92',created_by:'p2',call_at:window.__T(16)+'T10:00:00',result:'거절'});
 a.push({db_id:'d93',created_by:'p2',call_at:window.__T(8)+'T10:00:00',result:'부재'});
 return a;})();
window.__dbs=(function(){var a=[],i;
 for(i=0;i<30;i++)a.push({id:'d'+i,assigned_to:i<20?'p2':'p3',customer_name:'고객'+i,
   region:'서울',assigned_date:window.__T(40+i)});
 for(i=30;i<38;i++)a.push({id:'d'+i,assigned_to:'p4',customer_name:'고객'+i,
   region:'경기',assigned_date:window.__T(60)});
 /* 손 놓은 지 오래된 것 — 다시 걸어야 할 사람들 */
 a.push({id:'d90',assigned_to:'p2',customer_name:'고객90',region:'서울',assigned_date:window.__T(60)});
 a.push({id:'d91',assigned_to:'p2',customer_name:'고객91',region:'서울',assigned_date:window.__T(50)});
 a.push({id:'d92',assigned_to:'p2',customer_name:'고객92',region:'인천',assigned_date:window.__T(30)});
 a.push({id:'d93',assigned_to:'p2',customer_name:'고객93',region:'경기',assigned_date:window.__T(20)});
 return a;})();
window.__clients=[
 {id:'c1',advisor_id:'p2',name_masked:'김○○',created_at:window.__T(5)+'T00:00:00Z'},
 {id:'c2',advisor_id:'p2',name_masked:'박○○',created_at:window.__T(200)+'T00:00:00Z'},
 {id:'c3',advisor_id:'p3',name_masked:'이○○',created_at:window.__T(120)+'T00:00:00Z'},
 {id:'c4',advisor_id:'p4',name_masked:'최○○',created_at:window.__T(300)+'T00:00:00Z'}
];
window.__meta=[
 {id:'m1',client_id:'c1',content:{next:{what:'증권 받기',due:window.__T(3)},touch:[{d:window.__T(4),k:'만남'}]}},
 {id:'m2',client_id:'c2',content:{next:{what:'생일 연락',due:window.__T(9)},touch:[]}},
 {id:'m3',client_id:'c3',content:{next:null,touch:[]}}
];
window.__daily=(function(){var a=[],i;
 for(i=0;i<18;i++)a.push({member_id:'p2',check_date:window.__T(i),scope:'day',items:{d1:1,d2:1,d3:1,d4:1,d5:1,d6:1,d7:1}});
 for(i=0;i<8;i++)a.push({member_id:'p3',check_date:window.__T(i),scope:'day',items:{d1:1,d2:1,d3:1}});
 for(i=0;i<12;i++)a.push({member_id:'p1',check_date:window.__T(i),scope:'day',items:{d1:1,d2:1,d3:1,d4:1,d5:1}});
 return a;})();
window.__pass=[{member_id:'p2',items:{s1:1,s2:1,s3:1}},{member_id:'p3',items:{s1:1}}];
window.__notes=[{id:'n1',member_id:'p4',body:'전화를 못 걸고 있다. 시간을 정해 주기로 했다.',mood:'',share:true,created_at:window.__T(2)+'T09:00:00Z'}];
window.__saved=[];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={};
  var a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},
   neq:function(k,v){window.__neq.push(tbl+':'+k+'='+v);f['neq_'+k]=v;return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(p){window.__ins.push({t:tbl,p:p});f._ins=p;return a},
   update:function(p){f._upd=p;return a},upsert:function(){return a},
   then:function(res){
     var out=[];
     if(f._ins||f._upd)return Promise.resolve({data:null,error:null}).then(res);
     if(tbl==='profiles')out=window.__profiles;
     else if(tbl==='teams')out=window.__teams;
     else if(tbl==='team_members')out=window.__team_members;
     else if(tbl==='attendance')out=window.__attendance;
     else if(tbl==='calls')out=window.__calls;
     else if(tbl==='dbs')out=window.__dbs;
     else if(tbl==='clients')out=window.__clients;
     else if(tbl==='coach_notes')out=window.__notes;
     else if(tbl==='daily_checks')out=(f.scope==='pass')?window.__pass:window.__daily;
     else if(tbl==='saved_reports'){
       if(f.kind==='client_meta')out=window.__meta;
       else if(f.kind==='ai_report')out=window.__saved;
       else out=[];
     }
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'p1',email:'o@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'p1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;


(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1400 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('main: ' + e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);

  const seat = async (role) => {
    await page.evaluate((ro) => {
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osHelpOvl,#arBriefOvl,#osOvl').forEach(x => x.remove());
      OS.profile = { id: ro === 'member' ? 'p2' : 'p1', name: ro === 'member' ? '박서준' : '윤시현', role: ro, plan: 'vip' };
      OS.session = { user: { id: ro === 'member' ? 'p2' : 'p1', email: 'o@t' } };
      window.__toast = []; window.toast = m => window.__toast.push('' + m);
      window.callAI = () => Promise.resolve('## 활동 보고\n가\n## 활동 격려\n나\n## 공부할 부분\n다\n## 상담 컨셉\n라\n## 다음 7일\n마');
      try { localStorage.setItem('apex_ar_brief_off', '1'); localStorage.removeItem('apex_th_cat');
            localStorage.removeItem('apex_set_sec'); localStorage.removeItem('apex_fold'); } catch (e) { }
      if (typeof TH !== 'undefined') TH.cat = '';
      if (typeof GB !== 'undefined') { GB.loaded = false; GB.busy = false; GB.rows = []; }
    }, role);
  };

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
  const hub = async (cat) => {
    await page.evaluate(() => go('teamhub')); await page.waitForTimeout(2200);
    if (cat) { await page.evaluate(c => thGo(c), cat); await page.waitForTimeout(1200); }
  };

  await seat('owner');

  /* ── 메뉴 ── */
  const menu = await page.evaluate(() => {
    var t = []; TABS.forEach(g => (g.items || []).forEach(i => t.push(g.group + '|' + i.id)));
    return t;
  });
  const nav = await page.evaluate(() => {
    renderNav();
    return Array.prototype.map.call(document.querySelectorAll('#navHost .tab-btn'), e => e.getAttribute('data-tab'));
  });
  ok(menu.indexOf('조직 관리|teamhub') >= 0, '메뉴 목록에 TEAM 총괄 관리가 남아 있다 — 지우지 않았다');
  /* 같은 일이 TFA 업무관리 안에 있어 눈에서만 뺐다. 지운 게 아니라 숨긴 것이므로
     찾기로 치면 나와야 한다 — 안 나오면 그건 없앤 것이다. */
  ok(nav.indexOf('teamhub') < 0, '평소 사이드바에는 안 보인다 — 눈에서 뺀 칸이다');
  const found = await page.evaluate(() => {
    NAV_Q = 'TEAM 총괄'; renderNav();
    var ok1 = !!document.querySelector('#navHost .tab-btn[data-tab="teamhub"]');
    NAV_Q = '실행 체크판'; renderNav();
    var ok2 = !!document.querySelector('#navHost .tab-btn[data-tab="teamhub"]');
    NAV_Q = ''; renderNav();
    return { byName: ok1, byOld: ok2 };
  });
  ok(found.byName, '「TEAM 총괄」 로 찾으면 나온다');
  ok(found.byOld, '옛 이름 「실행 체크판」 으로 찾아도 나온다');
  ['ckboard', 'mycoach', 'academy', 'growboard'].forEach(t =>
    ok(nav.indexOf(t) < 0, '사이드바에서 ' + t + ' 이 사라졌다'));
  ['ckboard', 'mycoach', 'academy', 'growboard'].forEach(async t => { });
  const still = await page.evaluate(() =>
    ['ckboard', 'mycoach', 'academy', 'growboard'].map(t => t + ':' + osTabAllowed(t)));
  ok(still.every(x => /:true$/.test(x)), '사라졌어도 여전히 열 수 있다 — ' + still.join(' '));

  /* 실제로 열리는가 */
  for (const t of ['ckboard', 'mycoach', 'academy', 'growboard']) {
    const len = await page.evaluate(tt => { try { return (osTabProbe(tt) || '').length; } catch (e) { return -1; } }, t);
    ok(len > 200, t + ' 화면이 그대로 열린다 (' + len + '자)');
  }

  /* ── 허브 왼쪽 칸 ── */
  await hub();
  let cats = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#thPane .ar-cat .m b'), e => e.textContent.trim()));
  ok(cats.length === 4, '지점장에게는 네 칸 (' + cats.length + ')');
  ok(cats.join('|') === '오늘 체크|이번 주|업무 루트|지점장 · 팀 관리',
    '순서가 맞다 — ' + cats.join(' · '));
  const heads = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#thPane .ar-shd'), e => e.textContent.trim()));
  ok(heads.join('|') === '오늘 체크|팀 관리', '오늘 체크 / 팀 관리로 나뉜다 — ' + heads.join(' · '));

  /* ── 칸마다 원래 화면이 그대로 열리는가 ── */
  const paneOf = () => page.evaluate(() => ({
    ck: !!document.getElementById('ckPane'), gb: !!document.getElementById('gbPane'),
    mc: !!document.getElementById('mcPane'), ac: !!document.getElementById('acadBody'),
    tabs: document.querySelectorAll('#thPane .ck-tabs').length,
    txt: (document.getElementById('thPane') || {}).textContent || ''
  }));
  await page.evaluate(() => thGo('ck_today')); await page.waitForTimeout(900);
  let v = await paneOf();
  ok(v.ck, '오늘 체크 — 체크판이 그대로 뜬다');
  ok(v.tabs === 0, '한 칸 안에서는 체크판 위 탭 줄을 두 번 그리지 않는다');
  ok(/오늘 할 일/.test(v.txt), '오늘 할 일 카드가 보인다');

  await page.evaluate(() => thGo('ck_lead')); await page.waitForTimeout(1400);
  v = await paneOf();
  ok(/오늘 내가 할 일/.test(v.txt), '지점장 칸 — 내가 할 일이 먼저 온다');
  ok(/팀을 봅니다/.test(v.txt), '팀 보기가 그 아래 온다');

  /* ── 우리 팀 오늘 — 팀별로 ── */
  const tchip = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#thPane .gb-tsel .gb-tb'), e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(tchip.length === 4, '팀 고르개가 붙는다 (' + tchip.length + ') — ' + tchip.join(' / '));
  const own = await page.evaluate(() => ({ team: GB.team,
    grp: Array.prototype.map.call(document.querySelectorAll('#thPane .ck-tg'), e => e.textContent.replace(/\s+/g, ' ').trim()) }));
  ok(own.team === 't1', '지점장은 자기 팀이 먼저 열린다 — ' + own.team);
  ok(own.grp.length === 1 && /온탑1팀/.test(own.grp[0]), '처음엔 자기 팀만 — ' + own.grp.join(' / '));

  await page.evaluate(() => ckTeam(''));
  await page.waitForTimeout(700);
  const tgrp = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#thPane .ck-tg'), e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(tgrp.length >= 2, '「전체」로 놓으면 팀별로 묶인다 (' + tgrp.length + '묶음) — ' + tgrp.join(' / '));
  ok(/소속 없음/.test(tgrp[tgrp.length - 1]), '소속 없는 사람은 맨 아래 묶음으로');
  await page.evaluate(() => ckTeam('t2'));
  await page.waitForTimeout(700);
  const t2 = await page.evaluate(() => ({
    rows: document.querySelectorAll('#thPane .ck-tr').length,
    txt: (document.getElementById('thPane') || {}).textContent || ''
  }));
  ok(/온탑2팀/.test(t2.txt), '온탑2팀만 골라 볼 수 있다');
  ok(!/이지훈/.test(t2.txt.split('우리 팀 오늘')[1] || ''), '다른 팀 사람은 안 섞인다');
  await page.evaluate(() => ckTeam(''));
  await page.waitForTimeout(600);

  await page.evaluate(() => thGo('grow')); await page.waitForTimeout(1600);
  v = await paneOf();
  ok(v.gb, '성장판이 그대로 뜬다');

  await page.evaluate(() => thGo('coach')); await page.waitForTimeout(1200);
  v = await paneOf();
  ok(v.mc, '내 코칭이 그대로 뜬다');

  await page.evaluate(() => thGo('acad')); await page.waitForTimeout(1200);
  v = await paneOf();
  ok(v.ac, '본인 점검란이 그대로 뜬다');

  /* 체크하면 왼쪽 숫자가 따라 움직인다 */
  await page.evaluate(() => thGo('ck_today')); await page.waitForTimeout(900);
  const n0 = await page.evaluate(() => (document.querySelector('#thPane .ar-cat .n.cnt') || {}).textContent || '');
  await page.evaluate(() => { const e = document.querySelector('#ckPane .ck-it'); if (e) e.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => thGo('ck_today')); await page.waitForTimeout(600);
  const n1 = await page.evaluate(() => (document.querySelector('#thPane .ar-cat .n.cnt') || {}).textContent || '');
  ok(n0 !== n1, '체크하면 왼쪽 숫자가 따라 움직인다 (' + n0 + ' → ' + n1 + ')');

  /* ── 팀원에게는 팀 관리 칸이 없다 ── */
  await seat('member');
  await hub();
  cats = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#thPane .ar-cat .m b'), e => e.textContent.trim()));
  ok(cats.length === 3, '설계사에게는 세 칸 (' + cats.length + ')');
  ok(cats.indexOf('지점장 · 팀 관리') < 0, '설계사에게 지점장 칸은 안 보인다');

  /* ── 설정 여섯 칸 ── */
  await seat('owner');
  await page.evaluate(() => go('settings'));
  await page.waitForTimeout(1800);
  const tabs = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('.set-tb'), e => e.textContent.replace(/\s*\d+$/, '').trim()));
  ok(tabs.length === 6, '설정이 여섯 칸으로 나뉜다 (' + tabs.length + ')');
  ok(/팀 · 권한/.test(tabs[0]), '첫 칸은 팀 · 권한 — ' + tabs[0]);
  const counts = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('.set-tb .n'), e => parseInt(e.textContent, 10) || 0));
  ok(counts.reduce((a, b) => a + b, 0) >= 20, '카드 수가 칸마다 세어진다 (' + counts.join('/') + ')');

  const st = () => page.evaluate(() => ({
    on: document.querySelectorAll('.set-sec.on').length,
    vis: document.querySelectorAll('.set-sec.on .card').length,
    fold: document.querySelectorAll('.set-sec.on .card.os-folded').length,
    all: document.querySelectorAll('.set-sec .card').length,
    sec: (document.querySelector('.set-tb.on') || {}).textContent || ''
  }));
  let s1 = await st();
  ok(s1.all > s1.vis, '한 번에 한 칸만 보인다 (' + s1.vis + ' / ' + s1.all + '장)');
  ok(s1.fold >= s1.vis - 2, '처음엔 거의 다 접혀 있다 (' + s1.fold + ' / ' + s1.vis + ')');
  ok(s1.fold < s1.vis, '맨 위 한 장은 펼쳐 둔다');

  await page.evaluate(() => osSetGoSec('ai'));
  await page.waitForTimeout(500);
  let s2 = await st();
  ok(/AI 연결/.test(s2.sec), '다른 칸으로 넘어간다 — ' + s2.sec.trim());
  ok(s2.vis !== s1.vis, '보이는 카드가 바뀐다 (' + s1.vis + ' → ' + s2.vis + ')');

  /* 접힌 카드를 누르면 펼쳐진다 */
  const before = await page.evaluate(() => document.querySelectorAll('.set-sec.on .card.os-folded').length);
  await page.evaluate(() => { const c = document.querySelector('.set-sec.on .card.os-folded .card-hd'); if (c) c.click(); });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.querySelectorAll('.set-sec.on .card.os-folded').length);
  ok(after === before - 1, '제목을 누르면 펼쳐진다 (' + before + ' → ' + after + ')');

  /* 고른 칸이 기억되는가 */
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(400);
  await page.evaluate(() => go('settings'));
  await page.waitForTimeout(1400);
  const s3 = await st();
  ok(/AI 연결/.test(s3.sec), '다시 들어와도 보던 칸이 열려 있다 — ' + s3.sec.trim());

  /* ── 사용법 ── */
  await page.evaluate(() => osHelpOpen('teamhub'));
  await page.waitForTimeout(300);
  const help = await page.evaluate(() => (document.getElementById('osHelpOvl') || {}).textContent || '');
  ok(/왼쪽에서 볼 것을 고릅니다/.test(help), 'TEAM 총괄 사용법이 있다');
  ok(/여기 안에 다 있습니다/.test(help), '옛 메뉴가 어디로 갔는지 알려 준다');
  await page.evaluate(() => osHelpClose());
  await page.evaluate(() => osHelpOpen('settings'));
  await page.waitForTimeout(300);
  const help2 = await page.evaluate(() => (document.getElementById('osHelpOvl') || {}).textContent || '');
  ok(/여섯 칸/.test(help2), '설정 사용법이 있다');
  await page.evaluate(() => osHelpClose());

  /* ── 좁은 화면 ── */
  await page.setViewportSize({ width: 390, height: 900 });
  await hub('ck_today');
  const over = await page.evaluate(() => {
    const d = document.getElementById('dynPane') || document.body;
    return { sw: d.scrollWidth, cw: d.clientWidth };
  });
  ok(over.sw <= over.cw + 2, '390px 에서 가로 스크롤 없음 (' + over.sw + '/' + over.cw + ')');
  await page.setViewportSize({ width: 1240, height: 1400 });

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log('\nTEAM 총괄 · 설정 검사 통과');
})();
