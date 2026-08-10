/* AI 보고 — 한 칸에서 정말로 전부 나오는가.

   이 화면의 값어치는 두 가지다.
   하나, 팀원이 자기 것을 스스로 받는다. 둘, 리더가 팀원 전원 것을 같은 창에서 본다.
   그래서 여기서는 설계사로 한 번, 지점장으로 한 번 열어 보고
   AI 에게 넘어가는 글에 우리가 실제로 가진 숫자만 들어 있는지까지 본다.
   숫자를 지어내면 보고가 아니라 소설이 된다.                                   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8829;
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
   source:(i%2?'방송':'보장분석'),region:'서울',assigned_date:window.__T(40+i)});
 for(i=30;i<38;i++)a.push({id:'d'+i,assigned_to:'p4',customer_name:'고객'+i,
   source:'농협',region:'경기',assigned_date:window.__T(60)});
 /* 손 놓은 지 오래된 것 — 다시 걸어야 할 사람들 */
 a.push({id:'d90',assigned_to:'p2',customer_name:'고객90',source:'방송',region:'서울',assigned_date:window.__T(60)});
 a.push({id:'d91',assigned_to:'p2',customer_name:'고객91',source:'농협',region:'서울',assigned_date:window.__T(50)});
 a.push({id:'d92',assigned_to:'p2',customer_name:'고객92',source:'보장분석',region:'인천',assigned_date:window.__T(30)});
 /* 종류를 안 적어 둔 옛날 DB — '일반' 으로 읽혀야 한다 */
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

/* AI 는 붙이지 않는다 — 대신 다섯 제목을 지킨 답을 돌려준다 */
const AI_OK = `## 활동 보고
최근 30일 출근 18일, 체크판 하루 평균 7개입니다.
통화 62통에 상담 9건이 나왔습니다.
- 고객 카드는 2명입니다.

## 활동 격려
전화를 매일 거는 습관이 잡혔습니다. 이건 그대로 이어 가시면 됩니다.

## 공부할 부분
간병·장기요양이 아직 남아 있습니다. 이번 주에 한 장만 읽고 한 명에게 써 보세요.

## 상담 컨셉
"지금 보험료를 줄이자는 게 아니라, 나가는 돈이 제 일을 하고 있는지 보자는 겁니다."

## 다음 7일
1. 하루 3통씩 · 주 15통
2. 고객 카드 2명 추가
3. 기한 지난 할 일 1건 정리`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1400 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('main: ' + e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const seat = async (role) => {
    await page.evaluate((ro) => {
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osHelpOvl,#osOvl,#osGuide').forEach(x => x.remove());
      OS.profile = { id: ro === 'member' ? 'p2' : 'p1', name: ro === 'member' ? '박서준' : '윤시현', role: ro, plan: 'vip' };
      OS.session = { user: { id: ro === 'member' ? 'p2' : 'p1', email: 'o@t' } };
      window.__toast = []; window.toast = m => window.__toast.push('' + m);
      window.callAI = function (sys, user) {
        window.__aiCalls.push({ sys: sys, user: user });
        return Promise.resolve(window.__AI_OUT);
      };
      if (typeof GB !== 'undefined') { GB.loaded = false; GB.busy = false; GB.rows = []; }
      if (typeof AR !== 'undefined') { AR.loaded = false; AR.busy = ''; AR.rep = {}; AR.face = ''; AR.open = ''; }
    }, role);
  };
  await page.evaluate((t) => { window.__AI_OUT = t; }, AI_OK);

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
  const open = async (cat) => {
    await page.evaluate(() => go('airep')); await page.waitForTimeout(2200);
    if (cat) { await page.evaluate(c => arGoCat(c), cat); await page.waitForTimeout(400); }
  };
  const pane = () => page.evaluate(() => (document.getElementById('arPane') || {}).textContent || '');

  /* ── 메뉴 ── */
  await seat('owner');
  const menu = await page.evaluate(() => {
    var t = []; TABS.forEach(g => (g.items || []).forEach(i => t.push(g.group + '|' + i.id + '|' + i.title)));
    return t;
  });
  ok(menu.indexOf('홈|airep|TFA 업무관리') >= 0, '메뉴 「홈」 밑에 TFA 업무관리가 있다');

  /* ── 지점장으로 열기 ── */
  await open();
  let txt = await pane();
  /* ── 왼쪽 카테고리 한 줄 ── */
  const cats = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-cat .m b'), e => e.textContent.trim()));
  ok(cats.length === 10, '왼쪽에 카테고리 열 개가 선다 (' + cats.length + ')');
  ok(cats.join('|') === '피드백|스케줄 관리|본인 역량 체크|해야 할 일|본인 점수판|내 코칭|본인 점검란|오늘 터치할 사람|리더 할 일|팀원 관리',
    '순서가 요청대로다 — ' + cats.join(' · '));
  ok(cats.indexOf('내 코칭') >= 0 && cats.indexOf('본인 점검란') >= 0,
    '내 코칭·본인 점검란이 여기로 들어왔다 — 실행 체크판에서 안 찾아도 된다');
  const heads = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-shd'), e => e.textContent.trim()));
  ok(heads.join('|') === '내 관리|팀 관리', '내 관리 / 팀 관리로 나뉜다 — ' + heads.join(' · '));
  const badges = await page.evaluate(() => document.querySelectorAll('#arPane .ar-cat .n').length);
  ok(badges >= 3, '남은 건수가 붉은 숫자로 붙는다 (' + badges + '곳)');
  ok(/박서준 님의 보고|윤시현 님의 보고/.test(txt), '처음 열면 피드백 칸이 보인다');

  await page.evaluate(() => arGoCat('team'));
  await page.waitForTimeout(400);
  txt = await pane();
  ok(/팀 전체 보고/.test(txt), '팀원 관리 칸으로 넘어간다');

  /* 지점장은 자기 팀이 먼저 열린다 — 기록을 다 읽은 뒤에 본다 */
  await page.waitForFunction(() => typeof GB !== 'undefined' && GB.loaded && GB.rows.length, { timeout: 9000 });
  await page.evaluate(() => arPaint());
  await page.waitForTimeout(300);
  const mine = await page.evaluate(() => ({ team: GB.team,
    rows: Array.prototype.map.call(document.querySelectorAll('#arPane .ar-row .ar-nmx'), e => e.textContent.trim()) }));
  ok(mine.team === 't1', '지점장은 자기 팀이 먼저 열린다 — ' + mine.team);
  ok(mine.rows.length === 2, '자기 팀 두 명만 보인다 (' + mine.rows.length + ')');


  /* ── 팀별로 나뉘는가 ── */
  const chipsT = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .gb-tsel .gb-tb'), e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(chipsT.length === 4, '전체 · 온탑1팀 · 온탑2팀 · 소속 없음 네 개 (' + chipsT.length + ')');
  ok(/^전체/.test(chipsT[0]) && /온탑1팀 2/.test(chipsT[1]) && /온탑2팀 1/.test(chipsT[2])
    && /소속 없음 1/.test(chipsT[3]), '팀마다 몇 명인지 붙는다 — ' + chipsT.join(' / '));
  await page.evaluate(() => arTeam(''));
  await page.waitForTimeout(400);
  const grp = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-tg'), e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(grp.length === 3, '팀별로 묶여서 나온다 (' + grp.length + '묶음)');
  ok(/온탑1팀/.test(grp[0]) && /소속 없음/.test(grp[grp.length - 1]),
    '소속 없는 사람은 맨 아래로 — ' + grp.join(' / '));
  ok(/소속이 없는 사람이/.test(txt), '소속 없는 사람이 있으면 지정하라고 알려 준다');

  /* 팀 하나만 고르면 그 팀만 */
  await page.evaluate(() => arTeam('t1'));
  await page.waitForTimeout(400);
  const only = await page.evaluate(() => ({
    rows: document.querySelectorAll('#arPane .ar-row').length,
    grp: document.querySelectorAll('#arPane .ar-tg').length,
    txt: (document.getElementById('arPane') || {}).textContent || ''
  }));
  ok(only.rows === 2, '온탑1팀만 두 명 (' + only.rows + ')');
  ok(only.grp === 1, '묶음도 하나만 (' + only.grp + ')');
  ok(/온탑1팀/.test(only.txt) && !/최민아/.test(only.txt), '다른 팀 사람은 안 보인다');

  /* 소속 없는 사람만 따로 */
  await page.evaluate(() => arTeam('__none'));
  await page.waitForTimeout(400);
  const none = await page.evaluate(() => document.querySelectorAll('#arPane .ar-row').length);
  ok(none === 1, '소속 없는 사람만 따로 볼 수 있다 (' + none + ')');

  /* 고른 팀은 화면끼리 같이 간다 */
  const shared = await page.evaluate(() => GB.team);
  ok(shared === '__none', '고른 팀은 GB.team 한 곳에만 남는다 — ' + shared);
  await page.evaluate(() => arTeam(''));
  await page.waitForTimeout(400);

  await page.evaluate(() => arTeam(''));
  await page.waitForTimeout(400);
  const rows = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-row .ar-nmx'), e => e.textContent.trim()));
  ok(rows.length === 4, '전체를 고르면 네 명이 다 나온다 (' + rows.length + ')');
  ok(/윤시현/.test(rows[0]) && /박서준/.test(rows[1]),
    '팀 안에서 점수가 낮은 사람이 위에 온다 — ' + rows.slice(0, 2).join(' → '));

  /* ── 팀원 한 사람을 펼치면 그 사람의 모든 것이 한 화면에 ── */
  await page.evaluate(() => { arTeam(''); arOpen('p2'); });
  await page.waitForTimeout(700);
  const one2 = await page.evaluate(() => {
    const bx = document.querySelector('#arPane .ar-row.open .ar-rb');
    return bx ? { txt: bx.textContent, axes: bx.querySelectorAll('.ar-nm').length,
                  wk: bx.querySelectorAll('.ar-wk').length, tk: bx.querySelectorAll('.ar-tk').length } : null;
  });
  ok(one2 && one2.axes === 6, '여섯 축이 그 자리에 있다 (' + (one2 ? one2.axes : 0) + ')');
  ok(one2 && /DB 통합 CRM/.test(one2.txt), '보고를 만들기 전에도 CRM 전화 습관이 보인다');
  ok(one2 && /전화한 날/.test(one2.txt) && /다시 건 비율/.test(one2.txt), '습관 숫자가 실제로 찍힌다');
  ok(one2 && /진행중/.test(one2.txt) && /기고객/.test(one2.txt), '진행중·기고객 인원까지 같이');
  ok(one2 && one2.wk === 6, '주차별 막대가 그 자리에 있다 (' + (one2 ? one2.wk : 0) + ')');
  ok(one2 && one2.tk >= 3, '그 사람이 오늘 터치할 사람이 같이 나온다 (' + (one2 ? one2.tk : 0) + '명)');
  await page.evaluate(() => arOpen('p2'));
  await page.waitForTimeout(200);

  /* ── 맨 위 다섯 숫자 · 거르기 ── */
  const tiles = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-tl'), e => e.textContent.trim()));
  ok(tiles.length === 5, '맨 위에 오늘 상태 다섯 칸이 선다 (' + tiles.length + ')');
  ok(/4명팀 인원/.test(tiles[0]), '팀 인원을 먼저 보여 준다 — ' + tiles[0]);
  ok(/사흘째 멈춘 사람/.test(tiles.join('|')), '멈춘 사람 수가 맨 위에 있다');
  ok(/보고 준비/.test(tiles.join('|')), '보고가 몇 개 준비됐는지 맨 위에 있다');
  const warnTiles = await page.evaluate(() => document.querySelectorAll('#arPane .ar-tl.warn').length);
  ok(warnTiles >= 1, '손대야 할 숫자는 붉게 뜬다 (' + warnTiles + ')');

  const chips = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-main .ar-fc'), e => e.textContent.trim()));
  ok(chips.length === 4, '거르기 단추 네 개 (' + chips.length + ')');
  await page.evaluate(() => arFilterSet('stop'));
  await page.waitForTimeout(300);
  const stopped = await page.evaluate(() => document.querySelectorAll('#arPane .ar-row').length);
  ok(stopped >= 1 && stopped < 4, '「멈춘 사람」만 걸러진다 (' + stopped + '명)');
  await page.evaluate(() => arFilterSet('all'));
  await page.waitForTimeout(300);

  /* 상태 뱃지와 점 여섯 개 */
  const badge = await page.evaluate(() => (document.querySelector('#arPane .ar-row .ar-bg') || {}).textContent || '');
  ok(/멈춤|활동|기록 없음/.test(badge), '줄마다 지금 상태가 한마디로 붙는다 — ' + badge);
  const dots = await page.evaluate(() => document.querySelectorAll('#arPane .ar-row .ar-dots .d').length);
  ok(dots === 24, '네 사람 × 여섯 축 점이 모두 찍힌다 (' + dots + ')');
  ok(/보고 없음/.test(txt), '아직 보고가 없는 사람을 「보고 없음」으로 알려 준다');

  /* ── 지금 손대야 할 것 ── */
  ok(/보고가 아직 없는 사람/.test(txt), '보고 없는 사람을 먼저 짚어 준다');
  ok(/사흘 넘게 기록이 없는 사람/.test(txt), '멈춘 사람을 짚어 준다');
  ok(/기한 지난 할 일/.test(txt), '고객 365일의 밀린 할 일이 여기로 올라온다');

  /* ── AI 에게 넘기는 글 — 숫자만, 실명은 없이 ── */
  await page.evaluate(() => arOpen('p2'));
  await page.waitForTimeout(300);
  const facts = await page.evaluate(() => arFacts(arRowOf('p2')));
  ok(/출근.*18일/.test(facts), '출근 18일이 그대로 넘어간다');
  const crm = await page.evaluate(() => (AR.crm || {})['p2'] || null);
  ok(crm && crm.calls > 60 && facts.indexOf('통화 ' + crm.calls + '통') >= 0,
    'DB 통합 CRM 통화 수가 그대로 넘어간다 (' + (crm ? crm.calls : 0) + '통)');
  ok(crm && crm.appt >= 9 && facts.indexOf('상담 전환 ' + crm.appt + '건') >= 0,
    '상담 전환 수가 그대로 넘어간다 (' + (crm ? crm.appt : 0) + '건)');
  ok(/한 번도 안 돌린 DB/.test(facts), '한 번도 안 돌린 DB 를 짚어 준다');
  ok(/고객 365일. 담당 2명/.test(facts), '담당 고객 2명을 정확히 센다');
  ok(/기한 지난 할 일 2건/.test(facts), '기한 지난 할 일 2건을 정확히 센다');
  ok(/90일 넘게 못 만난 고객 1명/.test(facts), '식은 고객 1명을 정확히 센다');
  ok(/합격 3\/12/.test(facts), '공부 합격 3개를 센다');
  ok(/아직 안 한 공부/.test(facts), '안 한 공부를 이름으로 알려 준다');
  ok(/팀 평균/.test(facts), '팀 평균과 나란히 놓는다');

  /* ── DB 통합 CRM 을 깊이 읽는가 ── */
  ok(/전화 습관 — DB 통합 CRM 최근 30일/.test(facts), '전화 습관을 따로 정리해 넘긴다');
  ok(/전화한 날 \d+일/.test(facts), '며칠 걸었는지 센다');
  ok(/부재 \d+ · 거절 \d+ · 상담 \d+/.test(facts), '결과가 어떻게 갈렸는지 넘긴다');
  ok(/상담 전환 [\d.]+%/.test(facts), '상담 전환율을 계산한다');
  ok(/한 건당 평균 [\d.]+번/.test(facts), '한 사람에게 몇 번 붙는지 센다');
  ok(/다시 건 DB 비율 \d+%/.test(facts), '부재 뒤에 다시 거는지 본다');
  ok(/가장 많이 거는 시간대/.test(facts), '언제 거는지 짚어 준다');
  ok(/가장 많이 거는 요일/.test(facts), '무슨 요일에 거는지 짚어 준다');
  ok(/최근 7일 \d+통 · 그 앞 7일 \d+통/.test(facts), '늘었는지 줄었는지 비교한다');
  ok(/손 놓은 DB: 1주 넘음/.test(facts), '손 놓은 DB 를 보고에도 넣는다');
  ok(!/고객1|고객90|customer_name/.test(facts), '고객 이름은 여전히 안 넘어간다');
  const deep = await page.evaluate(() => arCrmDeep('p2'));
  ok(deep && deep.n > 60 && deep.dbN > 0, '통화·DB 수를 실제로 센다 (' + (deep ? deep.n + '통/' + deep.dbN + '건' : '없음') + ')');
  ok(deep && deep.conv > 0 && deep.conv < 100, '전환율이 0~100 사이 (' + (deep ? deep.conv : '') + '%)');
  const noCall = await page.evaluate(() => arCrmDeep('p4'));
  ok(noCall === null, '통화가 없는 사람은 없다고 한다');

  const sysT = await page.evaluate(() => arSys());
  ok(/전화 습관을 반드시 한 줄 넣습니다/.test(sysT), '보고에 습관을 꼭 넣으라고 시킨다');

  /* ── 오전 8시 자동 ── */
  const auto = await page.evaluate(() => ({
    h: AR_H, due: typeof arDue === 'function', arm: typeof arAutoArm === 'function',
    lead: arAutoNeed().length, off: arAutoOff()
  }));
  ok(auto.h === 8, '오전 8시 기준 (' + auto.h + ')');
  ok(auto.due && auto.arm, '8시가 되면 알아서 도는 장치가 있다');
  ok(auto.lead >= 1, '지점장은 팀원 것을 만들 목록을 잡는다 (' + auto.lead + '명)');
  const asMember = await page.evaluate(() => {
    const keep = OS.profile.role, mine = AR.rep[arMyId()];
    OS.profile.role = 'member'; delete AR.rep[arMyId()];
    const n = arAutoNeed().length;
    OS.profile.role = keep; if (mine) AR.rep[arMyId()] = mine;
    return n;
  });
  ok(asMember === 1, '설계사는 자기 것 하나만 만든다 (' + asMember + ')');
  await page.evaluate(() => { try { localStorage.setItem('apex_ar_auto_off', '1'); } catch (e) { } });
  const offNow = await page.evaluate(() => arAutoOff());
  ok(offNow, '끌 수 있다');
  await page.evaluate(() => { try { localStorage.removeItem('apex_ar_auto_off'); } catch (e) { } });
  ok(/없는 숫자는 만들지 않습니다/.test(facts), '지어내지 말라고 못을 박는다');

  const sys = await page.evaluate(() => arSys());
  ok(/고객 실명·전화번호·병력은 쓰지 않습니다/.test(sys), '고객 실명·전화·병력을 쓰지 말라고 못을 박는다');
  ok(/약관과 심사에 따릅니다/.test(sys), '보험 문구에 준법 안내가 들어간다');
  ok(/## 활동 보고[\s\S]*## 다음 7일/.test(sys), '다섯 제목을 순서대로 지시한다');

  /* ── 다섯 칸으로 나뉘는가 ── */
  const parsed = await page.evaluate(() => arParse(window.__AI_OUT));
  ok(/출근 18일/.test(parsed.act), '활동 보고가 제 칸에 들어간다');
  ok(/그대로 이어/.test(parsed.good), '활동 격려가 제 칸에 들어간다');
  ok(/간병/.test(parsed.stu), '공부할 부분이 제 칸에 들어간다');
  ok(/제 일을 하고 있는지/.test(parsed.con), '상담 컨셉이 제 칸에 들어간다');
  ok(/주 15통/.test(parsed.next), '다음 7일이 제 칸에 들어간다');

  /* 제목을 조금 다르게 써도 알아본다 */
  const p2 = await page.evaluate(() => arParse('**활동 보고**\n가\n\n[활동 격려]\n나\n\n### 공부할 부분\n다\n\n상담 컨셉\n라\n\n## 다음 7일\n마'));
  ok(p2.act === '가' && p2.good === '나' && p2.stu === '다' && p2.next === '마', '제목 모양이 달라도 다섯 칸으로 나눈다');

  /* 제목을 아예 안 지키면 버리지 않고 첫 칸에 담는다 */
  const p3 = await page.evaluate(() => arParse('제목 없이 그냥 쓴 답'));
  ok(/제목 없이/.test(p3.act), '제목을 안 지킨 답도 버리지 않는다');

  /* ── 한 사람 만들기 ── */
  await page.evaluate(() => { window.__ins = []; arGen('p2'); });
  await page.waitForTimeout(700);
  txt = await pane();
  const secs = await page.evaluate(() => document.querySelectorAll('#arPane .ar-secs .ar-sec').length);
  ok(secs === 5, '다섯 칸이 화면에 그려진다 (' + secs + ')');
  const wide = await page.evaluate(() => {
    const g = document.querySelector('#arPane .ar-secs');
    if (!g) return null;
    const w = e => e ? Math.round(e.getBoundingClientRect().width) : 0;
    return { act: w(g.querySelector('.s-act')), good: w(g.querySelector('.s-good')), all: w(g) };
  });
  ok(wide && wide.act > wide.good, '활동 보고는 넓게, 격려·공부는 나란히 놓인다');
  const one = await page.evaluate(() => (document.querySelector('#arPane .ar-one') || {}).textContent || '');
  ok(/출근 18일/.test(one), '펼치지 않아도 한 줄 요약이 먼저 보인다');
  const dos = await page.evaluate(() => document.querySelectorAll('#arPane .s-next .ar-do').length);
  ok(dos === 3, '다음 7일은 문장이 아니라 할 일 세 줄로 선다 (' + dos + ')');
  ok(await page.evaluate(() => typeof arPrint === 'function'), '종이로 뽑는 길이 있다');
  ok(/활동 보고/.test(txt) && /활동 격려/.test(txt) && /공부할 부분/.test(txt)
    && /상담 컨셉/.test(txt) && /다음 7일/.test(txt), '다섯 제목이 그대로 보인다');

  const ins = await page.evaluate(() => window.__ins.filter(x => x.t === 'saved_reports' && x.p && x.p.kind === 'ai_report'));
  ok(ins.length === 1, '보고가 서버에 한 줄로 저장된다');
  ok(ins[0] && ins[0].p.content && ins[0].p.content.mid === 'p2', '누구 보고인지 함께 저장된다');
  ok(ins[0] && ins[0].p.advisor_id === 'p1', '저장은 내 이름으로 남는다 — 남의 줄에 쓰지 않는다');
  ok(ins[0] && /주 15통/.test(ins[0].p.content.next || ''), '다섯 칸이 나뉜 채로 저장된다');

  /* ── 전원 한 번에 ── */
  await page.evaluate(() => { window.__ins = []; AR.rep = {}; arGenAll(); });
  await page.waitForTimeout(4200);
  const all = await page.evaluate(() => Object.keys(AR.rep).length);
  ok(all === 4, '전원 한 번에 누르면 네 명이 모두 만들어진다 (' + all + ')');
  const busy = await page.evaluate(() => AR.busy);
  ok(busy === '', '다 끝나면 버튼이 다시 살아난다');

  /* ── 설계사로 열기 ── */
  await seat('member');
  await open('feed');
  txt = await pane();
  ok(/박서준 님의 보고/.test(txt), '자기 이름으로 자기 칸이 열린다');
  ok(/AI 보고 받기/.test(txt), '스스로 받을 수 있는 단추가 있다');
  await page.evaluate(() => arGen('p2'));
  await page.waitForTimeout(700);
  const secs2 = await page.evaluate(() => document.querySelectorAll('#arPane .ar-secs .ar-sec').length);
  ok(secs2 === 5, '설계사도 혼자서 다섯 칸을 받는다 (' + secs2 + ')');

  /* ── 오늘 터치할 사람 — 한 칸으로 ── */
  await open('touch');
  txt = await pane();
  ok(/오늘 터치할 사람/.test(txt), '부재·거절과 기고객이 한 칸에 모였다');
  const tk = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-fs:not(.ar-fsrc) .ar-fc'), e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(tk.length === 7, '전체·부재·거절·진행중·미진행·기고객·생일 일곱 (' + tk.length + ')');
  const cnt = await page.evaluate(() => arTkCount('p2'));
  ok(cnt.all > 0, '터치할 사람이 잡힌다 (' + cnt.all + '명)');
  ok(cnt.no >= 1, '부재를 따로 센다 (' + cnt.no + ')');
  ok(cnt.rej >= 1, '거절을 따로 센다 (' + cnt.rej + ')');
  ok(cnt.run >= 1, '상담까지 간 사람은 「진행중」으로 따로 센다 (' + cnt.run + ')');
  ok(cnt['new'] >= 1, '한 번도 안 돌린 DB 도 잡힌다 (' + cnt['new'] + ')');
  ok(cnt.old >= 1, '식은 고객도 같은 칸에 들어온다 (' + cnt.old + ')');

  /* 무엇을 해야 하는지가 줄마다 적혀 있는가 */
  const tkDo = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-tk .do'), e => e.textContent.trim()));
  ok(tkDo.length >= 5, '줄마다 할 일이 적힌다 (' + tkDo.length + '줄)');
  ok(tkDo.every(d => d.length > 4), '빈 줄이 없다');
  const todos = await page.evaluate(() => {
    const l = arTouch('p2'), m = {};
    l.forEach(x => { m[x.k] = m[x.k] || x.todo; });
    return m;
  });
  ok(/다시 겁니다|문자 먼저|마지막으로/.test(todos.no || ''), '부재 — 며칠 됐는지에 따라 다른 말 — ' + todos.no);
  ok(/팔지 않습니다/.test(todos.rej || ''), '거절 — 다시 팔지 말라고 한다 — ' + todos.rej);
  ok(/결론을 물어봅니다|자료를 준비/.test(todos.run || ''), '진행중 — 붙으라고 한다 — ' + todos.run);
  ok(/첫 통화/.test(todos['new'] || ''), '미진행 — 오늘 첫 통화 — ' + todos['new']);
  ok(/안부|적어 둔 일/.test(todos.old || ''), '기고객 — 안부 — ' + todos.old);

  /* ── DB 종류가 CRM 에서 여기까지 그대로 따라오는가 ── */
  const src = await page.evaluate(() => {
    const l = arTouch('p2');
    const c = {}; l.forEach(x => { if (x.go === 'crm') c[x.src || '(없음)'] = (c[x.src || '(없음)'] || 0) + 1; });
    return {
      cnt: c,
      chips: Array.prototype.map.call(document.querySelectorAll('#arPane .ar-fc'), e => e.textContent.replace(/\s+/g, ' ').trim()),
      tags: Array.prototype.map.call(document.querySelectorAll('#arPane .ar-tk .src'), e => e.textContent.trim())
    };
  });
  ok(Object.keys(src.cnt).length >= 2, 'DB 종류가 여러 개 살아서 넘어온다 — ' + JSON.stringify(src.cnt));
  ok(!src.cnt['(없음)'], '종류가 빈 줄이 없다 — 안 적힌 옛 DB 는 「일반」 으로 읽는다');
  ok((src.cnt['일반'] || 0) >= 1, '종류를 안 적어 둔 옛 DB 도 「일반」 으로 세어진다');
  ok(src.tags.length >= 3, '줄마다 종류 딱지가 붙는다 (' + src.tags.length + '개)');
  ok(src.chips.filter(t => /방송|보장분석|일반|종류 전체/.test(t)).length >= 3,
    '종류로 좁혀 볼 수 있는 단추가 생긴다 — ' + src.chips.filter(t => /방송|보장분석|일반|종류 전체/.test(t)).join(' · '));

  /* 종류를 하나 고르면 그 종류만 남는가 */
  const srcPick = await page.evaluate(() => {
    const before = document.querySelectorAll('#arPane .ar-tk').length;
    arTkSrcSet('방송');
    const rows = Array.prototype.map.call(document.querySelectorAll('#arPane .ar-tk .src'), e => e.textContent.trim());
    const n = document.querySelectorAll('#arPane .ar-tk').length;
    arTkSrcSet('');
    return { before, n, rows, back: document.querySelectorAll('#arPane .ar-tk').length };
  });
  ok(srcPick.n > 0 && srcPick.n < srcPick.before,
    '「방송」 만 고르면 줄이 줄어든다 (' + srcPick.before + ' → ' + srcPick.n + ')');
  ok(srcPick.rows.every(t => t === '방송'), '남은 줄은 전부 방송이다 — ' + srcPick.rows.join(','));
  ok(srcPick.back === srcPick.before, '되돌리면 원래대로 (' + srcPick.back + ')');

  /* ── 지점장은 팀 전체를 한 화면에서 ── */
  const solo = await page.evaluate(() => document.querySelectorAll('#arPane .ar-tk').length);
  await page.evaluate(() => { OS.profile.role = 'owner'; arTkAllSet(true); });
  await page.waitForTimeout(400);
  const team = await page.evaluate(() => ({
    rows: document.querySelectorAll('#arPane .ar-tk').length,
    own: Array.prototype.map.call(document.querySelectorAll('#arPane .ar-tk .own'), e => e.textContent.trim()),
    txt: (document.getElementById('arPane') || {}).textContent || ''
  }));
  ok(team.rows > solo, '팀 전체로 놓으면 더 많이 나온다 (' + solo + ' → ' + team.rows + ')');
  ok(team.own.length === team.rows, '줄마다 담당자 이름이 앞에 붙는다 (' + team.own.length + ')');
  ok(team.own.filter((v, i, a) => a.indexOf(v) === i).length >= 2, '두 사람 이상 섞여 나온다 — ' +
    team.own.filter((v, i, a) => a.indexOf(v) === i).join(', '));
  ok(/팀 전체입니다/.test(team.txt), '팀 전체를 보고 있다고 알려 준다');
  await page.evaluate(() => arTkAllSet(false));
  await page.waitForTimeout(400);
  const backSolo = await page.evaluate(() => document.querySelectorAll('#arPane .ar-tk .own').length);
  ok(backSolo === 0, '내 것으로 돌아오면 담당자 이름은 사라진다');
  await page.evaluate(() => { OS.profile.role = 'member'; arPaint(); });
  await page.waitForTimeout(300);
  const noScope = await page.evaluate(() => /팀 전체/.test((document.getElementById('arPane')||{}).textContent||''));
  ok(!noScope, '설계사에게는 팀 전체 단추가 안 뜬다');

  /* 걸러 보기 */
  await page.evaluate(() => arTkSet('no'));
  await page.waitForTimeout(300);
  const onlyNo = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#arPane .ar-tk .ar-bg'), e => e.textContent.trim()));
  ok(onlyNo.length > 0 && onlyNo.every(t => t === '부재'), '「부재」만 걸러진다 (' + onlyNo.length + '줄)');
  await page.evaluate(() => arTkSet('all'));
  await page.waitForTimeout(300);

  /* ── 주차별 활동량 ── */
  await open('score');
  const wk = await page.evaluate(() => ({
    bars: document.querySelectorAll('#arPane .ar-wk').length,
    txt: (document.getElementById('arPane') || {}).textContent || '',
    w: arWeeks('p2', 6).map(x => x.call)
  }));
  ok(wk.bars === 6, '최근 여섯 주가 막대로 선다 (' + wk.bars + ')');
  ok(/주차별 활동량/.test(wk.txt), '주차별 활동량 칸이 있다');
  ok(wk.w.reduce((a, b) => a + b, 0) > 0, '주마다 통화 수를 실제로 센다 (' + wk.w.join('/') + ')');

  /* AI 에게 물어볼 때 이름이 안 넘어가는가 */
  await open('touch');
  await page.evaluate(() => { window.__aiCalls = []; window.__AI_OUT = '## 이렇게 여세요\n안녕하세요\n## 전할 만한 소식\n연말정산\n## 이 순서로\n세 명만'; arTalk('cold'); });
  await page.waitForTimeout(700);
  const talkCall = await page.evaluate(() => window.__aiCalls[window.__aiCalls.length - 1] || null);
  ok(talkCall && /다시 걸어야 할 DB/.test(talkCall.user), '건수만 넘어간다');
  ok(talkCall && !/고객1|고객2|고객15/.test(talkCall.user + talkCall.sys), '고객 이름은 AI 로 넘어가지 않는다');
  ok(talkCall && /약관과 심사에 따릅니다/.test(talkCall.sys), '준법 안내가 지시문에 들어간다');
  ok(talkCall && /다시 팔지 않습니다/.test(talkCall.sys), '거절한 사람에게 다시 팔지 말라고 못 박는다');
  txt = await pane();
  ok(/이렇게 여세요/.test(txt), 'AI 가 준 첫 마디가 화면에 남는다');


  /* ── 스케줄 ── */
  await open('sched');
  txt = await pane();
  ok(/오늘 · 앞으로 잡힌 약속/.test(txt), '스케줄 칸이 열린다');
  ok(/다음에 할 일 — 날짜순/.test(txt), '고객 365일의 할 일이 날짜순으로 온다');
  ok(/이번 주에 남은 것/.test(txt), '이번 주 체크판이 같이 온다');

  /* ── 해야 할 일 ── */
  await open('todo');
  txt = await pane();
  ok(/해야 할 일/.test(txt), '해야 할 일 칸이 열린다');
  const todoOrder = await page.evaluate(() => arTodoList().map(x => (x.bad ? 1 : 0)));
  ok(todoOrder.length === 0 || todoOrder[0] >= todoOrder[todoOrder.length - 1], '밀린 것이 위에 온다');

  /* ── 본인 점수판 · 역량 체크 ── */
  await open('score');
  const axes = await page.evaluate(() => document.querySelectorAll('#arPane .ar-ax').length);
  ok(axes === 6, '여섯 축이 막대로 선다 (' + axes + ')');
  txt = await pane();
  ok(/팀 평균/.test(txt), '팀 평균과 나란히 놓는다');

  await open('skill');
  const skills = await page.evaluate(() => document.querySelectorAll('#arPane .ar-sk').length);
  ok(skills === 12, '배워서 터치할 것 열두 개가 모두 나온다 (' + skills + ')');
  const before = await page.evaluate(() => document.querySelectorAll('#arPane .ar-sk.on').length);
  await page.evaluate(() => arStamp('s5'));
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => document.querySelectorAll('#arPane .ar-sk.on').length);
  ok(after === before + 1, '누르면 합격이 찍힌다 (' + before + '→' + after + ')');

  /* ── 리더 할 일 — 팀원은 보기만 ── */
  await open('lead');
  txt = await pane();
  ok(/리더 할 일/.test(txt), '팀원도 리더 할 일을 볼 수 있다');
  const ro = await page.evaluate(() => ({
    all: document.querySelectorAll('#arPane .ar-lk').length,
    ro: document.querySelectorAll('#arPane .ar-lk.ro').length
  }));
  ok(ro.all > 0 && ro.ro === ro.all, '팀원에게는 전부 잠겨 있다 (' + ro.ro + '/' + ro.all + ')');
  ok(/체크는 지점장이 합니다/.test(txt), '왜 잠겼는지 알려 준다');
  await page.evaluate(() => { window.__toast = []; arLeadTog('day', 'la1'); });
  const blocked = await page.evaluate(() => (window.__toast || []).join('|'));
  ok(/지점장만 체크할 수 있습니다/.test(blocked), '팀원이 눌러도 안 바뀐다');

  /* ── 팀원 관리 — 팀원은 만들기 없음 ── */
  await open('team');
  txt = await pane();
  ok(/보기만 됩니다/.test(txt), '팀원에게는 보고 만들기가 없다');
  const genBtns = await page.evaluate(() =>
    Array.prototype.filter.call(document.querySelectorAll('#arPane .btn-primary'),
      e => /보고 받기|한 번에/.test(e.textContent)).length);
  ok(genBtns === 0, '팀원 화면에는 보고 만드는 단추가 안 뜬다 (' + genBtns + ')');

  /* ── 아침 비서 ── */
  await page.evaluate(() => { try { localStorage.removeItem('apex_ar_brief_off'); } catch (e) { } arBriefOpen(); });
  await page.waitForTimeout(400);
  const brief = await page.evaluate(() => {
    const o = document.getElementById('arBriefOvl');
    return o ? { txt: o.textContent, tiles: o.querySelectorAll('.ar-bt').length } : null;
  });
  ok(brief && brief.tiles === 4, '아침 창에 숫자 네 칸이 뜬다 (' + (brief ? brief.tiles : 0) + ')');
  ok(brief && /오늘 약속/.test(brief.txt) && /밀린 것/.test(brief.txt)
    && /다시 걸 DB/.test(brief.txt) && /식은 고객/.test(brief.txt), '오늘 볼 네 가지가 다 있다');
  ok(brief && /오늘 이것만/.test(brief.txt), '오늘 이것만 세 줄을 골라 준다');
  ok(brief && /아침에 안 띄우기/.test(brief.txt), '끌 수 있다');
  const seenOnce = await page.evaluate(() => arBriefSeen());
  ok(seenOnce, '한 번 뜨면 그날은 다시 안 뜬다');
  await page.evaluate(() => arBriefClose());
  ok(await page.evaluate(() => !document.getElementById('arBriefOvl')), '닫으면 사라진다');

  /* 알림은 하루 세 번까지 */
  await page.evaluate(() => { try { localStorage.removeItem('apex_ar_nudge_' + arToday()); } catch (e) { } window.__toast = []; arNudge(); arNudge(); arNudge(); arNudge(); });
  const nudges = await page.evaluate(() => (window.__toast || []).filter(t => /🔔/.test(t)).length);
  ok(nudges <= 3, '알림은 하루 세 번을 넘지 않는다 (' + nudges + ')');
  ok(nudges >= 1, '손 놓은 사람이 있으면 알려 준다');

  /* ── 지점장은 리더 할 일을 체크할 수 있다 ── */
  await seat('owner');
  await open('lead');
  const roLead = await page.evaluate(() => document.querySelectorAll('#arPane .ar-lk.ro').length);
  ok(roLead === 0, '지점장에게는 잠금이 없다');
  const b4 = await page.evaluate(() => document.querySelectorAll('#arPane .ar-lk.on').length);
  await page.evaluate(() => { const e = document.querySelector('#arPane .ar-lk'); if (e) e.click(); });
  await page.waitForTimeout(400);
  const a4 = await page.evaluate(() => document.querySelectorAll('#arPane .ar-lk.on').length);
  ok(a4 !== b4, '지점장이 누르면 체크가 바뀐다 (' + b4 + '→' + a4 + ')');

  /* ── 체크판 한 칸에서 같이 보이는가 ── */
  await page.evaluate(() => { CK.tab = 'today'; go('ckboard'); });
  await page.waitForTimeout(2600);
  let ckTxt = await page.evaluate(() => (document.getElementById('ckPane') || {}).textContent || '');
  ok(/AI 보고/.test(ckTxt), '팀원 칸에서도 AI 보고가 같이 보인다');
  ok(/고객/.test(ckTxt) && /통화/.test(ckTxt), '팀원 칸에 CRM·고객 숫자가 같이 올라온다');
  ok(/사용법/.test(ckTxt), '체크판에 사용법 단추가 있다');

  await seat('owner');
  await page.evaluate(() => { CK.tab = 'leader'; go('ckboard'); });
  await page.waitForTimeout(3000);
  ckTxt = await page.evaluate(() => (document.getElementById('ckPane') || {}).textContent || '');
  ok(/AI 보고/.test(ckTxt), '지점장 칸에서도 AI 보고가 같이 보인다');
  ok(/명\s*보고가 준비돼 있습니다/.test(ckTxt), '몇 명 준비됐는지 지점장 칸에서 바로 보인다');
  const h1 = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('#ckPane .ck-h1'), e => e.textContent.trim()));
  ok(h1.join('|') === '① 오늘 내가 할 일|② 팀을 봅니다', '해야 할 일이 먼저, 팀 관리가 나중 — ' + h1.join(' · '));
  const order = await page.evaluate(() => {
    const p = document.getElementById('ckPane');
    const a = p.textContent.indexOf('아침 · 출근 시간'), b = p.textContent.indexOf('우리 팀 오늘');
    return { a: a, b: b };
  });
  ok(order.a >= 0 && order.b > order.a, '「우리 팀 오늘」이 더 이상 맨 위가 아니다');

  /* ── 사용법 ── */
  await page.evaluate(() => osHelpOpen('airep'));
  await page.waitForTimeout(300);
  const help = await page.evaluate(() => {
    const o = document.getElementById('osHelpOvl');
    return o ? { txt: o.textContent, steps: o.querySelectorAll('div > div > div').length } : null;
  });
  ok(help && /왼쪽에서 볼 것을 고릅니다/.test(help.txt), '사용법이 열리고 쓰는 순서가 보인다');
  ok(help && /리더 할 일은 누구나 볼 수 있고 체크는 지점장만/.test(help.txt), '누가 무엇을 할 수 있는지 적혀 있다');
  ok(help && /막히면 여기를 보세요/.test(help.txt), '막혔을 때 볼 것이 같이 나온다');
  await page.evaluate(() => osHelpClose());
  const gone = await page.evaluate(() => !document.getElementById('osHelpOvl'));
  ok(gone, '닫으면 사라진다');
  const hk = await page.evaluate(() => Object.keys(OS_HELP).length);
  ok(hk >= 8, '주요 화면 ' + hk + '곳에 사용법이 붙어 있다');
  const here = await page.evaluate(() => typeof osHelpHere === 'function');
  ok(here, '떠 있는 ? 는 지금 보고 있는 화면 설명을 연다');

  /* ── AI 보고가 '만든 자료' 숫자를 부풀리지 않는가 ── */
  const neq = await page.evaluate(() => window.__neq.filter(x => /saved_reports:kind=ai_report/.test(x)).length);
  ok(neq >= 1, 'AI 보고 줄은 「만든 자료」 집계에서 빠진다 (' + neq + '곳)');

  /* ── 좁은 화면 ── */
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => go('airep'));
  await page.waitForTimeout(1600);
  const over = await page.evaluate(() => {
    const d = document.getElementById('dynPane') || document.body;
    return { sw: d.scrollWidth, cw: d.clientWidth };
  });
  ok(over.sw <= over.cw + 2, '390px 에서 가로 스크롤 없음 (' + over.sw + '/' + over.cw + ')');
  await page.setViewportSize({ width: 1240, height: 1400 });

  /* ── 한 사람 칸에 코칭과 팀 평균까지 다 있는가 ──
     팀 코칭 화면을 따로 열지 않아도 여기서 다 보여야 한다. 흩어지면 아무도 안 본다. */
  await open('team');
  await page.waitForTimeout(2600);
  await page.evaluate(() => { GB.team = ''; arPaint(); arOpen('p2'); });
  await page.waitForTimeout(900);
  const merged = await page.evaluate(() => {
    const host = document.getElementById('arPane');
    if (!host) return null;
    return {
      secs: Array.prototype.map.call(host.querySelectorAll('.ar-rb .ar-sh .n'), e => e.textContent.trim()),
      vsRows: host.querySelectorAll('.ar-vr').length,
      selfOut: /본인은 평균에서 뺐습니다/.test(host.textContent),
      coach: /오늘 이 사람을 어떻게 챙길까/.test(host.textContent)
    };
  });
  ok(!!merged, '팀원 관리 칸이 그려진다');
  if (merged) {
    ok(merged.secs.indexOf('DB 통합 CRM') >= 0, '펼친 칸에 DB 통합 CRM 이 있다');
    ok(merged.coach, '펼친 칸에 코칭(어떻게 챙길까)이 있다 — 팀 코칭을 따로 안 열어도 된다');
    ok(merged.vsRows === 6, '팀 평균 비교가 여섯 축 모두 선다 (' + merged.vsRows + ')');
    ok(merged.selfOut, '팀 평균에서 본인을 뺀다고 적는다 — 안 빼면 차이가 절반으로 희석된다');
    ok(/평균과 견주면/.test(merged.secs.join('|')), '팀 평균 비교 칸이 있다 — ' + merged.secs.join(' · '));
  }

  /* ── 하나의 업무관리 툴 — 흩어진 것이 여기로 다 들어왔는가 ── */
  await open('lead');
  const ldg = await page.evaluate(() => ({
    n: document.querySelectorAll('#arPane .ar-lkg').length,
    stop: /stopPropagation/.test((document.querySelector('#arPane .ar-lkg') || {}).getAttribute
      ? (document.querySelector('#arPane .ar-lkg').getAttribute('onclick') || '') : '')
  }));
  ok(ldg.n >= 10, '리더 할 일 줄마다 그 화면으로 가는 단추가 붙는다 (' + ldg.n + '개)');
  ok(ldg.stop, '그 단추를 눌러도 체크는 안 바뀐다 (stopPropagation)');

  for (const [cat, sel, nm] of [['coach', '#mcPane', '내 코칭'], ['acad', '#acadBody', '본인 점검란']]) {
    await open(cat);
    await page.waitForTimeout(2400);
    const got = await page.evaluate(s2 => {
      const p = document.getElementById('arPane');
      return { pane: !!p.querySelector(s2), len: (p.textContent || '').trim().length };
    }, sel);
    ok(got.pane, nm + ' 이 여기서 열린다 (' + sel + ')');
    ok(got.len > 200, nm + ' 에 내용이 찬다 (' + got.len + '자)');
  }

  await open('team');
  await page.waitForTimeout(2400);
  await page.evaluate(() => { GB.team = ''; arPaint(); arOpen('p2'); });
  await page.waitForTimeout(700);
  ok(await page.evaluate(() => /코칭 메모 남기기/.test(document.getElementById('arPane').textContent)),
    '펼친 칸에 코칭 메모 단추가 있다');
  await page.evaluate(() => arMemoOpen('p2'));
  await page.waitForTimeout(400);
  const memo = await page.evaluate(() => {
    const p = document.getElementById('arPane');
    return {
      box: !!p.querySelector('.ar-memo'),
      ta: p.querySelectorAll('.ar-memo .ar-mt').length,
      date: p.querySelectorAll('.ar-memo .ar-md').length,
      stay: /평균과 견주면/.test(p.textContent)
    };
  });
  ok(memo.box && memo.ta === 3 && memo.date === 1,
    '메모 칸이 그 자리에서 열린다 — 글칸 ' + memo.ta + ' · 날짜 ' + memo.date);
  ok(memo.stay, '메모를 열어도 보던 숫자가 그대로 있다 — 화면을 안 벗어난다');

  const dup = await page.evaluate(() => {
    if (typeof TH_CAT === 'undefined') return null;
    return TH_CAT.map(c => c[0]);
  });
  if (dup) {
    ok(dup.indexOf('grow') < 0 && dup.indexOf('coach') < 0 && dup.indexOf('acad') < 0,
      '실행 체크판에서 겹치던 셋(성장판·내 코칭·본인 점검란)이 빠졌다 — ' + dup.join(' · '));
  }

  /* ── 팀원이 스스로 비밀번호를 바꿀 수 있는가 ──
     기능은 있었는데 「눌러 보라」는 말이 어디에도 없어 아무도 못 찾았다. */
  await seat('member');
  await page.evaluate(() => osRenderPill());
  await page.waitForTimeout(300);
  const pill = await page.evaluate(() => {
    const p = document.getElementById('osAuthPill');
    return p ? { pw: !!p.querySelector('.pw'), txt: (p.textContent || '').trim(), title: p.title || '' } : null;
  });
  ok(!!pill && pill.pw, '계정 칸에 「🔑 비밀번호」 가 보인다 — ' + (pill ? pill.txt : '칸 없음'));
  ok(!!pill && /비밀번호/.test(pill.title), '설명에도 비밀번호 변경이라고 적힌다');
  await page.evaluate(() => osOpenMe());
  await page.waitForTimeout(600);
  const meBox = await page.evaluate(() => ({
    pw: /비밀번호 변경/.test(document.body.textContent),
    inputs: document.querySelectorAll('input[type=password]').length
  }));
  ok(meBox.pw && meBox.inputs >= 2,
    '눌러 보면 비밀번호 변경 칸이 열린다 (비밀번호 칸 ' + meBox.inputs + '개)');
  await page.evaluate(() => { document.querySelectorAll('#osOvl,.os-ovl').forEach(x => x.remove()); });
  await seat('owner');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log('\nAI 보고 검사 통과');
})();
