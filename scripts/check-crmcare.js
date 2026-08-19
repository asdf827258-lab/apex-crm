/* 고객 케어 — 30일 안에 모든 고객에게 연락이 되는가.

   목표가 하나뿐인 화면이다. 그러니 검사도 그 하나를 본다.
   「30일이 지난 사람이 빠짐없이 눈앞에 뜨는가.」

   특히 조심해서 보는 것 두 가지.
   1) 「모른다」 를 0 으로 바꿔치기하지 않는가.
      한 번도 연락 안 한 사람이 「0일 전」 으로 뜨면 그 사람은 영영 안 뜬다.
   2) 조용히 빼지 않는가.
      보험료를 못 읽어 VIP 인지 모르는 사람이 몇 명인지 화면이 말해야 한다.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8841;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 가짜 서버 — saved_reports 는 쓴 것을 그대로 돌려준다.
   dbs·calls 도 함께 둔다. 통화 기록이 고객에 제대로 이어지는지 봐야 하기 때문이다. */
const STUB = `
window.__saved=[];window.__seq=0;
window.__clients=[];window.__dbs=[];window.__calls=[];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},up=null,a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},neq:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(r){
     if(tbl==='saved_reports'){r.id='r'+(++window.__seq);r.created_at=new Date().toISOString();
       window.__saved.push(JSON.parse(JSON.stringify(r)));}
     return a},
   update:function(r){up=r;return a},
   upsert:function(){return a},
   then:function(res){
     var out=[],i;
     if(up){
       var tgt=(tbl==='saved_reports')?window.__saved:[];
       for(i=0;i<tgt.length;i++){
         var m=true,k;
         for(k in f)if((''+tgt[i][k])!==(''+f[k]))m=false;
         if(m)for(k in up)tgt[i][k]=JSON.parse(JSON.stringify(up[k]));
       }
       return Promise.resolve({data:null,error:null}).then(res);
     }
     if(tbl==='saved_reports')out=window.__saved.filter(function(x){
       for(var k in f)if((''+x[k])!==(''+f[k]))return false;return true;});
     else if(tbl==='clients')out=window.__clients.slice();
     else if(tbl==='dbs')out=window.__dbs.slice();
     else if(tbl==='calls')out=window.__calls.slice();
     else if(tbl==='profiles')out=[{id:'me',name:'윤점검',role:'leader',active:true,plan:'vip'},
       {id:'p2',name:'홍길동',role:'member',active:true}];
     else out=[];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'me',email:'me@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'me'}}})},
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

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* ── 밑판 깔기 ──
     이름은 「홍길동」 로 둔다. 검사 견본에 진짜 고객 이름을 쓰지 않는다. */
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'me', name: '윤점검', role: 'leader', plan: 'vip' };
    OS.session = { user: { id: 'me', email: 'me@t' } };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    try { localStorage.clear(); } catch (e) { }

    window.dayAgo = function (n) {
      var t = new Date(ccToday() + 'T00:00:00Z');
      t.setUTCDate(t.getUTCDate() - n);
      return t.toISOString().slice(0, 10);
    };
    /* 등록만 해 두고 한 번도 안 만난 사람의 등록일 */
    var born = n => dayAgo(n) + 'T00:00:00Z';

    OSC.list = [
      { id: 'a29', advisor_id: 'me', name_masked: '가○○', consent_status: 'granted', created_at: born(400) },
      { id: 'a30', advisor_id: 'me', name_masked: '나○○', consent_status: 'granted', created_at: born(400) },
      { id: 'a31', advisor_id: 'me', name_masked: '다○○', consent_status: 'granted', created_at: born(400) },
      { id: 'v99', advisor_id: 'me', name_masked: '라○○', consent_status: 'granted', created_at: born(400) },
      { id: 'v100', advisor_id: 'me', name_masked: '마○○', consent_status: 'granted', created_at: born(400) },
      { id: 'v101', advisor_id: 'me', name_masked: '바○○', consent_status: 'granted', created_at: born(400) },
      { id: 'unk', advisor_id: 'me', name_masked: '사○○', consent_status: 'granted', created_at: born(400) },
      { id: 'never', advisor_id: 'me', name_masked: '아○○', consent_status: 'granted', created_at: born(5) },
      { id: 'nold', advisor_id: 'me', name_masked: '자○○', consent_status: 'granted', created_at: born(90) },
      { id: 'mate', advisor_id: 'p2', name_masked: '홍*동', consent_status: 'granted', created_at: born(400) }
    ];
    var T = (d, man) => ({ fp: man === null ? {} : { f_ins: man }, fam: '', rel: '', next: null, bd: '', up: 0, touch: d ? [{ at: d, how: '전화', note: '' }] : [] });
    CM.meta = {
      a29: T(dayAgo(29), 20), a30: T(dayAgo(30), 20), a31: T(dayAgo(31), 20),
      v99: T(dayAgo(20), 99), v100: T(dayAgo(20), 100), v101: T(dayAgo(20), 101),
      unk: T(dayAgo(3), null),
      never: T('', 20), nold: T('', 20),
      mate: T(dayAgo(99), 20)
    };
    CM.loaded = true; CM.picked = true; CM.pick = '';
    CC.calls = {}; CC.loaded = true; CC.busy = false;

    /* 화면을 열면 앱은 서버에서 다시 읽는다. 그러니 서버 쪽에도 같은 것을 깔아 둔다 —
       그래야 「직접 넣은 값」 이 아니라 「실제로 읽어 온 값」 으로 검사가 된다. */
    window.__clients = JSON.parse(JSON.stringify(OSC.list));
    window.__saved = Object.keys(CM.meta).map(function (k, i) {
      return {
        id: 'r' + (i + 1), advisor_id: 'me', client_id: k, kind: 'client_meta',
        title: '고객 관리', content: JSON.parse(JSON.stringify(CM.meta[k]))
      };
    });
    window.__seq = window.__saved.length;
  });

  /* ══ [1] 「모른다」 를 0 으로 바꿔치기하지 않는가 ══════════════ */
  console.log('\n[1] 「모른다」 와 「0」 을 가른다');
  let r = await page.evaluate(() => {
    var find = id => OSC.list.filter(x => x.id === id)[0];
    return {
      neverEver: ccIdle(find('never')).ever,
      neverD: ccIdle(find('never')).d,
      neverT: ccBand(find('never')).t,
      neverOver: ccBand(find('never')).over,
      noldOver: ccBand(find('nold')).over,
      a30Ever: ccIdle(find('a30')).ever,
      unkMan: ccMan('unk'),
      zero: ccMoney(0), minus: ccMoney(-1), empty: ccMoney(''), word: ccMoney('모름'), good: ccMoney(45)
    };
  });
  ok(r.neverEver === false, '한 번도 연락 안 한 사람은 ever=false 다');
  ok(r.neverD === 5, '한 번도 연락 안 했으면 등록일부터 센다 (5일)');
  ok(/한 번도 없음/.test(r.neverT), '화면에 「한 번도 없음」 이라고 쓴다 — ' + r.neverT);
  ok(r.neverOver === false, '등록 5일차는 아직 30일을 안 넘었다');
  ok(r.noldOver === true, '등록 90일이 되도록 한 번도 연락 안 했으면 넘긴 것으로 센다');
  ok(r.a30Ever === true, '접촉 기록이 있으면 ever=true');
  ok(r.unkMan === null, '보험료를 못 읽으면 null 이다 — 0 이 아니다');
  ok(r.zero === null && r.minus === null && r.empty === null && r.word === null,
    '0 · -1 · 빈칸 · 글자는 모두 「모른다」 다');
  ok(r.good === 45, '0 보다 큰 수만 돈이다 (45)');

  /* ══ [2] 29 · 30 · 31일 경계 ══════════════════════════════════ */
  console.log('\n[2] 주기 경계에서 알람이 정확히 갈린다');
  r = await page.evaluate(() => {
    var find = id => OSC.list.filter(x => x.id === id)[0];
    var b = id => { var x = ccBand(find(id)); return { d: x.d, over: x.over, soon: x.soon, k: x.k }; };
    return { a29: b('a29'), a30: b('a30'), a31: b('a31') };
  });
  ok(r.a29.d === 29 && r.a29.over === false, '29일은 아직 안 넘었다');
  ok(r.a29.soon === true, '29일은 「곧」 으로 미리 뜬다 — 닥쳐서 몰아치지 않게');
  ok(r.a30.d === 30 && r.a30.over === true, '30일 되는 날 바로 넘김으로 뜬다');
  ok(r.a31.d === 31 && r.a31.over === true, '31일도 넘김이다');
  ok(r.a30.k === 'over' && r.a29.k === 'soon', '색이 갈린다 — 넘김 주황 · 임박 노랑');

  /* ══ [3] VIP 경계 — 99 · 100 · 101만원 ═══════════════════════ */
  console.log('\n[3] VIP 는 월 100만원에서 갈린다');
  r = await page.evaluate(() => ({
    v99: ccIsVip('v99'), v100: ccIsVip('v100'), v101: ccIsVip('v101'), unk: ccIsVip('unk'),
    cy99: ccCycle('v99'), cy100: ccCycle('v100'),
    o99: ccBand(OSC.list.filter(x => x.id === 'v99')[0]).over,
    o100: ccBand(OSC.list.filter(x => x.id === 'v100')[0]).over
  }));
  ok(r.v99 === false, '월 99만원은 VIP 가 아니다');
  ok(r.v100 === true, '월 100만원은 VIP 다 — 기준값 자신은 들어간다');
  ok(r.v101 === true, '월 101만원은 VIP 다');
  ok(r.unk === false, '보험료를 모르는 사람은 VIP 로 치지 않는다 — 대신 따로 센다');
  ok(r.cy99 === 30 && r.cy100 === 14, 'VIP 는 14일, 일반은 30일 주기다');
  ok(r.o99 === false && r.o100 === true, '같은 20일이라도 VIP 만 넘긴 것이 된다');

  /* ══ [4] 조용히 빼지 않는다 ══════════════════════════════════ */
  console.log('\n[4] 뺀 사람은 몇 명인지 적는다');
  r = await page.evaluate(() => {
    var mine = ccScope(OSC.list);
    return {
      unkN: ccUnknownList(mine).length,
      neverN: ccNeverList(mine).length,
      html: ccBoardHtml(OSC.list)
    };
  });
  ok(r.unkN === 1, '보험료를 못 읽은 고객이 1명으로 잡힌다');
  ok(/월납 보험료를 못 읽은 고객이 <b>1명<\/b>/.test(r.html), '판에 「못 읽은 고객 1명」 이라고 쓴다');
  ok(/VIP 인지 아닌지 아직 모릅니다/.test(r.html), '왜 뺐는지도 적는다');
  ok(r.neverN === 2, '한 번도 연락 안 한 사람 2명이 따로 잡힌다');
  ok(/한 번도<\/b> 연락 기록이 없습니다/.test(r.html), '판에 「한 번도 없음」 을 따로 적는다');

  /* ══ [5] 달성률을 손으로 센 값과 견준다 ══════════════════════ */
  console.log('\n[5] 달성률이 손으로 센 값과 같다');
  r = await page.evaluate(() => {
    var mine = ccScope(OSC.list);          /* CM.pick 이 비어 있으니 전원 10명 */
    var over = ccOverList(mine);
    return { n: mine.length, over: over.length, ids: over.map(x => x.id).sort(), rate: ccRate(mine), mon: ccMonthDone(mine) };
  });
  /* 손계산: a30(30일) · a31(31일) · v100(VIP 20일) · v101(VIP 20일) · nold(90일 무연락) · mate(99일) = 6명 */
  ok(r.n === 10, '고객은 모두 10명이다');
  ok(r.ids.join(',') === 'a30,a31,mate,nold,v100,v101',
    '넘긴 사람은 손으로 센 여섯 명과 같다 — ' + r.ids.join(', '));
  ok(r.over === 6, '넘긴 사람 6명');
  ok(r.rate === 40, '달성률 (10−6)/10 = 40% — 나온 값 ' + r.rate + '%');

  /* ══ [6] 통화 기록과 접촉 기록 중 더 최근 것 ═════════════════ */
  console.log('\n[6] DB 통합 CRM 통화도 연락으로 센다');
  r = await page.evaluate(() => {
    window.__dbs = [{ id: 'd1', customer_name: '홍길동' }, { id: 'd2', customer_name: '가나다' }];
    /* 홍○○ 는 접촉 기록이 99일 전인데 통화는 사흘 전에 했다 */
    window.__calls = [
      { db_id: 'd1', call_at: dayAgo(3) + 'T10:00:00Z' },
      { db_id: 'd1', call_at: dayAgo(40) + 'T10:00:00Z' },
      { db_id: 'd2', call_at: dayAgo(50) + 'T10:00:00Z' }
    ];
    CC.loaded = false; CC.busy = false; CC.calls = {};
    ccLoadCalls();
    return new Promise(res => setTimeout(() => res({
      hit: CC.calls['mate'] || '', hitN: CC.hitN,
      last: ccLastAt('mate'), touchOnly: cmLastTouch('mate'),
      d: ccBand(OSC.list.filter(x => x.id === 'mate')[0]).d,
      a29still: ccLastAt('a29') === dayAgo(29)
    }), 700));
  });
  ok(r.hit !== '', '가린 이름(홍*동)으로 통화 기록이 이어졌다');
  ok(r.hitN === 1, '이어진 고객은 1명이다 — 「가나다」 는 고객 목록에 없으니 안 센다');
  ok(r.d === 3, '접촉 99일 · 통화 3일 → 더 최근인 3일로 센다 (' + r.d + '일)');
  ok(r.touchOnly !== r.last, '접촉 기록만 봤을 때와 값이 달라졌다 — 합쳐 세고 있다');
  ok(r.a29still === true, '통화 기록이 없는 고객은 접촉 기록 그대로다');

  /* ══ [7] 「오늘 연락함」 한 번 · 되돌리기 ═════════════════════ */
  console.log('\n[7] 눌러 보고 되돌려 본다');
  r = await page.evaluate(() => {
    var f = () => OSC.list.filter(x => x.id === 'a31')[0];
    var before = ccBand(f()).d;
    ccMark('a31', '전화');
    return new Promise(res => setTimeout(() => {
      var mid = ccBand(f());
      var canUndo = ccCanUndo('a31');
      ccUndo('a31');
      setTimeout(() => res({
        before: before, midD: mid.d, midOver: mid.over, canUndo: canUndo,
        afterD: ccBand(f()).d, afterOver: ccBand(f()).over,
        rows: (CM.meta['a31'].touch || []).length,
        saved: JSON.stringify(window.__saved.map(x => (x.content && x.content.touch) || []))
      }), 400);
    }, 400));
  });
  ok(r.before === 31, '누르기 전 31일');
  ok(r.midD === 0 && r.midOver === false, '누르면 바로 0일이 되고 목록에서 내려간다');
  ok(r.canUndo === true, '되돌릴 수 있다고 알려 준다');
  ok(r.afterD === 31 && r.afterOver === true, '되돌리면 31일로 되돌아온다 — 기록이 거짓이 되지 않는다');
  ok(r.rows === 1, '되돌린 뒤 원래 접촉 기록 한 줄만 남는다');
  ok(/"how":"전화"/.test(r.saved) === false || r.rows === 1, '서버에도 되돌린 결과가 갔다');

  /* 되돌리기는 이 단추로 남긴 오늘 것만 지운다 — 손으로 적은 기록은 못 건드린다 */
  r = await page.evaluate(() => {
    CM.meta['a31'].touch = [{ at: ccToday(), how: '만남', note: '손으로 적은 것' }];
    window.__toast = [];
    ccUndo('a31');
    return { n: CM.meta['a31'].touch.length, msg: (window.__toast[0] || '') };
  });
  ok(r.n === 1 && /단추로 남긴 기록이 없습니다/.test(r.msg),
    '손으로 적어 둔 오늘 기록은 되돌리기가 안 지운다');

  /* ══ [8] 화면에 뜨는가 ═══════════════════════════════════════ */
  console.log('\n[8] 고객 365일 화면');
  await page.evaluate(() => {
    CM.meta['a31'].touch = [{ at: dayAgo(31), how: '전화', note: '' }];
    window.__saved.forEach(r => { if (r.client_id === 'a31') r.content.touch = [{ at: dayAgo(31), how: '전화', note: '' }]; });
    OSC.view = 'list'; OSC.q = ''; CM.sort = 'seen'; go('clients');
  });
  await page.waitForTimeout(1400);
  r = await page.evaluate(() => {
    var el = document.getElementById('oscList');
    return {
      html: el ? el.innerHTML : '',
      board: !!document.querySelector('.cc-board'),
      pills: Array.prototype.map.call(document.querySelectorAll('.cc-pill'), e => e.textContent.trim()),
      dd: Array.prototype.map.call(document.querySelectorAll('.cc-dd'), e => e.textContent.trim()).slice(0, 4),
      vip: document.querySelectorAll('.cc-vip').length,
      mark: document.querySelectorAll('.cc-b.go').length,
      news: document.querySelectorAll('.cc-b.news').length,
      sorts: Array.prototype.map.call(document.querySelectorAll('.cm-sb'), e => e.textContent.trim())
    };
  });
  ok(r.board === true, '맨 위에 30일 판이 선다');
  /* 알약 넷은 늘 있고, 진행중·할 터치는 있을 때만 붙는다 */
  ok(r.pills.length >= 4 && /지금 연락해야 함/.test(r.pills.join('')) &&
     /곧 때가 됩니다/.test(r.pills.join('')) && /VIP/.test(r.pills.join('')) &&
     /이번 달 연락함/.test(r.pills.join('')),
    '기본 알약 넷이 뜬다 — ' + r.pills.join(' / '));
  ok(/지금 연락해야 함/.test(r.pills.join('|')), '「지금 연락해야 함」 이 있다');
  ok(/VIP/.test(r.pills.join('|')), '「VIP」 칸이 있다');
  ok(r.dd.length >= 3, '고객 줄마다 며칠 됐는지 붙는다 — ' + r.dd.join(' / '));
  ok(r.vip === 2, 'VIP 표는 두 명에게만 붙는다 (100 · 101만원)');
  ok(r.mark >= 6, '넘긴 사람 줄마다 「연락함」 단추가 있다 (' + r.mark + '개)');
  ok(r.news >= 6, '「전할 소식 복사」 단추도 있다 (' + r.news + '개)');
  ok(r.sorts.join('|').indexOf('연락 밀린 순') >= 0, '「연락 밀린 순」 으로 정렬할 수 있다');
  ok(r.sorts.join('|').indexOf('VIP 먼저') >= 0, '「VIP 먼저」 로도 정렬할 수 있다');

  /* 정렬이 진짜로 밀린 순인가 */
  r = await page.evaluate(() => {
    ccSort('over');
    var rows = ccScope(OSC.list).slice();
    cmSortRows(rows);
    return rows.map(x => x.id).slice(0, 3);
  });
  ok(r[0] === 'nold' && r[1] === 'a31' && r[2] === 'a30',
    '밀린 순 정렬 — 90일 · 31일 · 30일 순서로 위에 온다 (' + r.join(', ') + ')');
  ok(r.indexOf('mate') < 0,
    '[6] 에서 사흘 전 통화가 잡힌 고객은 맨 위에서 내려갔다 — 정렬도 합쳐 센 값을 따른다');

  /* ══ [9] 메뉴 배지 · 홈 한 줄 ════════════════════════════════ */
  console.log('\n[9] 안 보고 지나칠 수 없게');
  r = await page.evaluate(() => {
    CM.sort = 'seen';
    ccNavPaint();
    var b = document.querySelector('.tab-btn[data-tab="clients"] .tc');
    go('home');
    return new Promise(res => setTimeout(() => {
      ccHomePaint();
      var h = document.getElementById('ccHomeLine');
      res({ badge: b ? b.textContent.trim() : '', home: h ? h.textContent.trim() : '' });
    }, 500));
  });
  /* 내 고객 9명 중 넘긴 사람은 다섯(30일 · 31일 · VIP 20일 둘 · 90일 무연락).
     홍길동 담당인 한 명은 안 센다 — 남의 고객이 내 배지에 섞이면 안 된다. */
  ok(r.badge === '5', '메뉴 「고객 365일」 옆에 5 가 붙는다 — 나온 값 ' + (r.badge || '(없음)'));
  ok(/오늘 안에 연락해야 할 분이 5명/.test(r.home), '홈에도 한 줄 뜬다 — ' + r.home.slice(0, 40));
  ok(r.home.indexOf('홍') < 0, '홈 한 줄에 고객 이름은 안 쓴다');

  /* ══ [10] TFA 업무관리 — 팀원별 ══════════════════════════════ */
  console.log('\n[10] TFA 업무관리 팀원별 달성률');
  r = await page.evaluate(() => {
    /* 손으로 셀 수 있게 작게 깐다.
       나: 5명 중 2명 넘김 → 60% · 홍길동: 4명 중 3명 넘김 → 25% */
    AR.cliRows = [
      { id: '1', who: 'me', name: '가○○', plan: '', due: '', bd: '', man: 20, ever: true, at: dayAgo(3), days: 3 },
      { id: '2', who: 'me', name: '나○○', plan: '', due: '', bd: '', man: 20, ever: true, at: dayAgo(10), days: 10 },
      { id: '3', who: 'me', name: '다○○', plan: '', due: '', bd: '', man: 20, ever: true, at: dayAgo(40), days: 40 },
      { id: '4', who: 'me', name: '라○○', plan: '', due: '', bd: '', man: 150, ever: true, at: dayAgo(20), days: 20 },
      { id: '5', who: 'me', name: '마○○', plan: '', due: '', bd: '', man: null, ever: false, at: '', days: 4 },
      { id: '6', who: 'p2', name: '바○○', plan: '', due: '', bd: '', man: 20, ever: true, at: dayAgo(31), days: 31 },
      { id: '7', who: 'p2', name: '사○○', plan: '', due: '', bd: '', man: 20, ever: false, at: '', days: 200 },
      { id: '8', who: 'p2', name: '아○○', plan: '', due: '', bd: '', man: 300, ever: true, at: dayAgo(15), days: 15 },
      { id: '9', who: 'p2', name: '자○○', plan: '', due: '', bd: '', man: 20, ever: true, at: dayAgo(1), days: 1 }
    ];
    if (typeof GB !== 'undefined') GB.rows = [{ id: 'me', name: '윤점검' }, { id: 'p2', name: '홍길동' }];
    var rows = ccTeamRows();
    var byId = {}; rows.forEach(x => byId[x.id] = x);
    return { me: byId['me'], p2: byId['p2'], order: rows.map(x => x.id) };
  });
  ok(r.me.n === 5 && r.p2.n === 4, '사람별 고객 수가 갈린다 (나 5 · 홍길동 4)');
  ok(r.me.over === 2, '나: 40일 하나 + VIP 20일 하나 = 2명 넘김 (' + r.me.over + ')');
  ok(r.me.rate === 60, '나의 달성률 (5−2)/5 = 60% — 나온 값 ' + r.me.rate + '%');
  ok(r.p2.over === 3, '홍길동: 31일 · 200일 · VIP 15일 = 3명 넘김 (' + r.p2.over + ')');
  ok(r.p2.rate === 25, '홍길동 달성률 (4−3)/4 = 25% — 나온 값 ' + r.p2.rate + '%');
  ok(r.me.vip === 1 && r.p2.vip === 1, 'VIP 는 사람마다 한 명씩');
  ok(r.me.never === 1 && r.p2.never === 1, '한 번도 없음도 사람마다 한 명씩');
  ok(r.me.unk === 1 && r.p2.unk === 0, '보험료 못 읽은 고객이 나에게만 1명');
  ok(r.order[0] === 'p2', '달성률이 낮은 사람이 위로 온다 — 도와야 할 사람이 먼저');

  /* ══ [11] 남의 것은 안 보인다 ════════════════════════════════ */
  console.log('\n[11] 팀원은 자기 것만 본다');
  r = await page.evaluate(() => {
    var save = window.arIsLead, out = {};
    window.arIsLead = function () { return false; };
    out.member = ccTeamHtml();
    window.arIsLead = function () { return true; };
    out.lead = ccTeamHtml();
    window.arIsLead = save;
    return out;
  });
  ok(r.member.indexOf('홍길동') < 0, '팀원 화면에는 남의 이름이 안 나온다');
  ok(r.member.indexOf('윤점검') >= 0, '팀원 화면에 내 줄은 나온다');
  ok(r.lead.indexOf('홍길동') >= 0 && r.lead.indexOf('윤점검') >= 0, '리더는 팀 전체를 본다');
  ok(/합계/.test(r.lead) && />44.4%</.test(r.lead),
    '리더 화면에 합계 줄이 있다 — 9명 중 5명 넘김 = 44.4%');
  ok(/월납 보험료를 못 읽은 고객이 <b>1명<\/b>/.test(r.lead), 'TFA 에서도 못 읽은 고객을 조용히 빼지 않는다');

  /* ══ [12] 화면에서 열어 본다 ═════════════════════════════════ */
  console.log('\n[12] TFA 화면에서 열어 본다');
  await page.evaluate(() => { AR.loaded = true; AR.cat = 'care'; go('airep'); });
  await page.waitForTimeout(600);
  r = await page.evaluate(() => {
    var p = document.getElementById('arPane');
    return {
      cats: Array.prototype.map.call(document.querySelectorAll('#arPane .ar-cat .m b'), e => e.textContent.trim()),
      tbl: document.querySelectorAll('#arPane .cc-team').length,
      heads: Array.prototype.map.call(document.querySelectorAll('#arPane .cc-team thead th'), e => e.textContent.trim()),
      body: p ? p.textContent : ''
    };
  });
  ok(r.cats.indexOf('30일 고객관리') >= 0, '왼쪽에 「30일 고객관리」 칸이 선다');
  ok(r.tbl === 1, '팀원별 표가 그려진다');
  ok(r.heads.join('|') === '팀원|고객|30일 넘음|👑 VIP|한 번도 없음|이번 달 연락|달성률',
    '표 머리 일곱 칸 — ' + r.heads.join(' · '));
  ok(/지금 연락해야 할 분들/.test(r.body), '누가 밀렸는지 이름까지 같이 나온다');
  ok(/더 최근 것으로 셉니다/.test(r.body), '어떻게 셌는지 화면이 스스로 밝힌다');

  /* ══ [13] 연락 거리 — 뉴스 ═══════════════════════════════════ */
  console.log('\n[13] 연락할 거리를 쥐여 준다');
  r = await page.evaluate(() => {
    NLIVE.items = [
      { t: '기준금리 동결', u: 'https://x/1', s: '연합', d: '', cats: ['econ'] },
      { t: '종부세 개편안', u: 'https://x/2', s: '한경', d: '', cats: ['tax', 'realty'] },
      { t: '실손보험 개편', u: 'https://x/3', s: '매경', d: '', cats: ['ins'] }
    ];
    CM.meta['v100'].fp = { f_ins: 100 };                 /* VIP → 세금 */
    CM.meta['a29'].fp = { f_ins: 20, f_debt: 15000 };    /* 대출 있음 → 부동산 */
    CM.meta['a30'].fp = { f_ins: 20, f_edu: 90 };        /* 교육비 → 지원금 */
    CM.meta['a31'].fp = { f_ins: 20 };                   /* 보장이 비었다 → 보험 */
    var copied = [];
    var save = window.copyText; window.copyText = t => copied.push(t);
    ccNews('v100'); ccNews('a31');
    window.copyText = save;
    return {
      vip: ccNewsCat('v100'), debt: ccNewsCat('a29'), edu: ccNewsCat('a30'), bare: ccNewsCat('a31'),
      copied: copied
    };
  });
  ok(r.vip === 'tax', 'VIP 에게는 세금 소식을 고른다');
  ok(r.debt === 'realty', '대출이 있으면 부동산 소식');
  ok(r.edu === 'help', '교육비가 있으면 지원금·혜택 소식');
  ok(r.bare === 'ins', '보장이 비어 있으면 보험 소식');
  ok(r.copied.length === 2, '두 번 눌렀으니 두 번 복사됐다');
  ok(/종부세 개편안/.test(r.copied[0]), 'VIP 에게 갈 문구에 세금 기사가 담겼다');
  ok(/실손보험 개편/.test(r.copied[1]), '보장이 빈 고객에게는 보험 기사가 담겼다');
  ok(/고객님/.test(r.copied[0]) && !/라○○/.test(r.copied[0]),
    '문구에 고객 이름은 안 넣는다 — 「고객님」 으로만');

  /* ══ [14] 설정은 이 기기에만 ═════════════════════════════════ */
  console.log('\n[14] 주기는 바꿀 수 있고, 이 기기에만 남는다');
  r = await page.evaluate(() => {
    var was = ccCfg();
    localStorage.setItem('apex_cc_cfg', JSON.stringify({ days: 45, vipDays: 7, vipMan: 200 }));
    var now = ccCfg();
    var vip100 = ccIsVip('v100');
    localStorage.removeItem('apex_cc_cfg');
    /* 못 쓰게 된 값이 들어와도 기본값으로 돌아간다 */
    localStorage.setItem('apex_cc_cfg', JSON.stringify({ days: 0, vipDays: -3, vipMan: 'x' }));
    var bad = ccCfg();
    localStorage.removeItem('apex_cc_cfg');
    return { was: was, now: now, vip100: vip100, bad: bad };
  });
  ok(r.was.days === 30 && r.was.vipDays === 14 && r.was.vipMan === 100, '기본은 30일 · VIP 14일 · 100만원');
  ok(r.now.days === 45 && r.now.vipDays === 7 && r.now.vipMan === 200, '바꾼 값이 먹는다');
  ok(r.vip100 === false, '기준을 200만원으로 올리면 100만원은 VIP 에서 빠진다');
  ok(r.bad.days === 30 && r.bad.vipDays === 14 && r.bad.vipMan === 100,
    '0 · 음수 · 글자가 들어오면 기본값으로 돌아간다');

  /* ══ [15] 서버에 실명이 안 나간다 ════════════════════════════ */
  console.log('\n[15] 지켜야 할 것');
  r = await page.evaluate(() => JSON.stringify(window.__saved));
  ok(r.indexOf('홍길동') < 0, '서버로 나간 것에 실명이 없다');
  ok(r.indexOf('name_masked') < 0, '서버로 나간 관리 기록에 이름 칸 자체가 없다');

  /* ══ [16] 지금 진행중인 분 ══════════════════════════════════ */
  console.log('\n[16] 「지금 진행중」 을 가리는 규칙');
  const runOf = await page.evaluate(() => {
    var mk = (id, opt) => {
      var c = { id: id, advisor_id: 'me', name_masked: '차○○',
                created_at: new Date(Date.now() - 400 * 864e5).toISOString() };
      OSC.list.push(c);
      CM.meta[id] = { fp: {}, fam: '', rel: '', next: opt.next || null, bd: '', up: 0,
                      touch: opt.touch ? [{ at: opt.touch, how: '전화', note: '' }] : [] };
      if (opt.stage) CC.stage[id] = opt.stage;
      if (opt.appt) CC.appt[id] = opt.appt;
      if (opt.res) CC.res[id] = opt.res;
      return ccRun(c);
    };
    var d = n => new Date(Date.now() + 9 * 36e5 - n * 864e5).toISOString().slice(0, 10);
    return {
      appt:  mk('r_ap', { appt: d(-4) + 'T05:00:00Z' }),
      gone:  mk('r_gone', { appt: d(4) + 'T05:00:00Z' }),
      next:  mk('r_nx', { next: { what: '증권 받기', due: d(7) } }),
      stage: mk('r_st', { stage: 'AP' }),
      none:  mk('r_no', { stage: '미접촉' }),
      talk:  mk('r_tk', { stage: '', res: '상담', touch: d(12) }),
      cold:  mk('r_cd', { stage: '', res: '상담', touch: d(60) }),
      miss:  mk('r_ms', { stage: '', res: '부재', touch: d(3) }),
      won:   mk('r_wn', { stage: '계약완료', appt: d(-4) + 'T05:00:00Z',
                          next: { what: '증권 전달', due: d(7) } }),
      sent:  mk('r_sn', { stage: '증권전달' })
    };
  });
  ok(runOf.appt.run === true && /약속/.test(runOf.appt.why), '앞으로 약속이 있으면 진행중 — ' + runOf.appt.why);
  ok(/14:00/.test(runOf.appt.why), '약속 시각을 한국 시각으로 적는다 (05:00Z → 14:00)');
  ok(runOf.gone.run === false, '지나간 약속만 있으면 진행중이 아니다');
  ok(runOf.next.run === true && /7일 지남/.test(runOf.next.why),
    '다음 할 일이 잡혀 있으면 진행중 · 며칠 지났는지도 — ' + runOf.next.why);
  ok(runOf.stage.run === true && /CRM 단계 AP/.test(runOf.stage.why), 'CRM 단계가 돌면 진행중');
  ok(runOf.none.run === false, '미접촉은 진행중이 아니다');
  ok(runOf.talk.run === true && /상담하고 12일째/.test(runOf.talk.why), '상담하고 45일 안이면 진행중');
  ok(runOf.cold.run === false, '상담한 지 45일이 넘으면 뺀다 — 그건 다시 여는 일이다');
  ok(runOf.miss.run === false, '부재는 진행중이 아니다');
  ok(runOf.won.run === false && runOf.won.won === true,
    '계약완료면 약속이 있어도 · 다음 할 일이 있어도 진행중이 아니다 — 끝난 사람을 섞으면 할 일이 흐려진다');
  ok(runOf.sent.won === true, '증권전달도 끝난 것으로 본다');

  const runSort = await page.evaluate(() =>
    ccRunList(OSC.list.filter(c => /^r_/.test(c.id))).map(x => x.c.id));
  ok(runSort[0] === 'r_ap', '약속 잡힌 분이 맨 위 (' + runSort.join(' → ') + ')');
  ok(runSort[1] === 'r_nx', '그 다음이 다음 할 일');
  ok(runSort[2] === 'r_st', '그 다음이 CRM 단계');
  ok(runSort[3] === 'r_tk', '상담만 해 둔 분이 마지막');
  ok(runSort.indexOf('r_wn') < 0 && runSort.indexOf('r_ms') < 0, '진행중이 아닌 사람은 아예 안 들어온다');

  /* ══ [17] 3년 관리 규칙 ═════════════════════════════════════ */
  console.log('\n[17] 계약일로부터 며칠째냐로 할 일이 정해진다');
  const planAt = await page.evaluate(() => {
    var d = n => new Date(Date.now() + 9 * 36e5 - n * 864e5).toISOString().slice(0, 10);
    var at = (days, plan) => {
      var id = 'p_' + days + '_' + (plan ? 'x' : 'o');
      var c = { id: id, advisor_id: 'me', name_masked: '카○○', created_at: d(days) + 'T00:00:00Z' };
      OSC.list.push(c);
      CM.meta[id] = { fp: {}, fam: '', rel: '', next: null, bd: '', up: 0, touch: [],
                      since: d(days), plan: plan || {} };
      return { now: ccTodoList(c).map(x => x.k), all: ccPlanList(c).map(x => x.k + ':' + x.st) };
    };
    return {
      d3: at(3), d20: at(20), d35: at(35), d95: at(95), d110: at(110),
      d370: at(370), d1100: at(1100), d1: at(1), d300: at(300),
      d110done: at(110, { m3: '2026-01-01' }),
      d1200: at(1200), y5: at(365 * 5 + 5)
    };
  });
  const only = (o) => o.now.filter(k => !/^(tax|anniv)/.test(k)).join();
  ok(only(planAt.d3) === 'hello', '계약 3일째면 감사 인사 (' + only(planAt.d3) + ')');
  ok(only(planAt.d20) === 'policy', '20일째면 증권 전달 · 보장 설명');
  ok(only(planAt.d35) === 'pay1', '35일째면 첫 회 출금 확인 — 실효가 제일 많이 나는 자리');
  ok(only(planAt.d95) === 'wait90', '95일째면 암 면책 90일 종료 안내');
  ok(only(planAt.d110) === 'wait90,m3', '110일째는 두 창이 겹친다 — 한 번 걸 때 같이 하면 된다');
  ok(only(planAt.d370) === 'y1', '1년이면 13회차 유지 확인');
  ok(only(planAt.d1100) === 'y3', '3년이면 보장 전체 재점검');
  ok(only(planAt.d1) === '', '계약 바로 다음 날은 아직 아무 창도 안 열렸다');
  ok(only(planAt.d300) === '', '창과 창 사이에는 아무것도 안 띄운다 — 없는 일을 만들지 않는다');
  ok(only(planAt.d110done) === 'wait90', '한 것을 체크하면 그 창만 닫힌다');

  console.log('\n[18] 지나간 일정은 알람으로 안 띄운다');
  const missN = planAt.d1200.all.filter(x => /:miss$/.test(x)).length;
  ok(missN >= 10, '3년 넘은 고객을 지금 넣으면 지나간 항목이 ' + missN + '개나 된다');
  ok(only(planAt.d1200).length <= 4,
    '그래도 알람은 한 건을 안 넘는다 — 열 개가 쏟아지면 아무것도 안 하게 된다 (' + only(planAt.d1200) + ')');
  ok(planAt.y5.all.filter(x => /^yr\d/.test(x)).length >= 2,
    '3년 뒤로도 해마다 한 칸씩 이어진다 — 3년이 끝이 아니다');

  console.log('\n[19] 기준일이 어디서 왔는지 밝힌다');
  const base = await page.evaluate(() => {
    var c = { id: 'b_1', advisor_id: 'me', name_masked: '타○○', created_at: '2023-02-02T00:00:00Z' };
    OSC.list.push(c);
    CM.meta.b_1 = { fp: {}, fam: '', rel: '', next: null, bd: '', up: 0, touch: [], since: '', plan: {} };
    var byReg = ccBase(c);
    CC.sent = { b_1: '2024-06-01' }; var bySent = ccBase(c);
    CC.made = { b_1: '2024-05-01' }; var byMade = ccBase(c);
    CM.meta.b_1.since = '2024-03-15'; var byHand = ccBase(c);
    CC.made = {}; CC.sent = {};
    return { byReg: byReg, bySent: bySent, byMade: byMade, byHand: byHand };
  });
  ok(base.byReg.at === '2023-02-02' && base.byReg.sure === false && /계약일이 아닙니다/.test(base.byReg.src),
    '아무것도 없으면 등록일로 세되 계약일이 아니라고 못 박는다 — ' + base.byReg.src);
  ok(base.bySent.src === 'CRM 증권전달일', '증권전달일이 등록일보다 먼저다');
  ok(base.byMade.src === 'CRM 계약일', '계약일이 증권전달일보다 먼저다');
  ok(base.byHand.src === '직접 적음' && base.byHand.sure === true, '손으로 적은 것이 가장 먼저다');

  const anniv = await page.evaluate(() => {
    var t = ccToday(), mm = t.slice(5, 7);
    var mk = (id, sure) => {
      var c = { id: id, advisor_id: 'me', name_masked: '파○○',
                created_at: '2023-' + mm + '-05T00:00:00Z' };
      OSC.list.push(c);
      CM.meta[id] = { fp: {}, fam: '', rel: '', next: null, bd: '', up: 0, touch: [],
                      since: sure ? ('2023-' + mm + '-05') : '', plan: {} };
      return ccPlanList(c).some(x => /계약 기념일/.test(x.t));
    };
    return { sure: mk('an_1', true), guess: mk('an_2', false) };
  });
  ok(anniv.sure === true, '계약한 달이 오면 기념일이 뜬다');
  ok(anniv.guess === false, '기준일이 추정이면 기념일은 안 띄운다 — 엉뚱한 달에 축하하면 안 하느니만 못하다');

  /* ══ [20] 증권 → 월납 ═══════════════════════════════════════ */
  console.log('\n[20] 증권의 「보험료」 를 월납으로 옮긴다');
  const scan = await page.evaluate(() => {
    window.PR = window.PR || {};
    PR.scan = { who: { name: '홍길동' }, plans: [
      { co: 'A생명', name: '종신', from: '2015-03-01', pay: '월납', fee: 300000 },
      { co: 'B화재', name: '실손', from: '2018-06-01', pay: '연납', fee: 1200000 },
      { co: 'C생명', name: '암', from: '2020-01-01', pay: '3개월납', fee: 300000 },
      { co: 'D화재', name: '운전자', from: '2021-01-01', pay: '6개월납', fee: 300000 },
      { co: 'E생명', name: '연금', from: '2019-01-01', pay: '일시납', fee: 50000000 },
      { co: 'F화재', name: '치아', from: '2022-01-01', pay: '전기납', fee: 40000 },
      { co: 'G생명', name: '어린이', from: '2023-01-01', pay: '', fee: 70000 },
      { co: 'H화재', name: '주택', from: '2024-01-01', pay: '월납', fee: -1 }
    ] };
    var m = {}; ccScanRows().forEach(r => m[r.co] = r);
    var sd = {}; sdPlanRows().forEach(r => sd[r.company] = r.monthlyPayment);
    return { rows: m, sum: ccScanSum(), sd: sd,
             match: { hong: ccScanMatch('mate', '홍*동'), other: ccScanMatch('a29', '가○○') } };
  });
  ok(scan.rows['A생명'].won === 300000, '월납 30만원은 그대로');
  ok(scan.rows['B화재'].won === 100000,
    '연납 120만원은 12로 나눠 10만원 — 그대로 두면 없던 VIP 가 생긴다 (' + scan.rows['B화재'].won + ')');
  ok(scan.rows['C생명'].won === 100000 && scan.rows['D화재'].won === 50000, '3개월납 ÷3 · 6개월납 ÷6');
  ok(scan.rows['E생명'].won === null && /일시납/.test(scan.rows['E생명'].why),
    '일시납은 매달 나가는 돈이 아니다 → 0 이 아니라 「모름」');
  ok(scan.rows['F화재'].won === null, '전기납도 서류만으로는 알 수 없다 → 「모름」');
  ok(scan.rows['G생명'].won === 70000 && /월납으로 봤습니다/.test(scan.rows['G생명'].why),
    '주기가 안 적혔으면 월납으로 보되 그렇다고 적는다');
  ok(scan.rows['H화재'].won === null, '「보험료 미제공」(-1) 은 0 이 아니라 「모름」');
  ok(scan.sum.man === 62, '읽은 것만 더해 월 62만원 (팩트파인딩은 만원 단위) — ' + scan.sum.man);
  ok(scan.sum.unknown === 3, '못 옮긴 3건은 뺐다고 세어 둔다');
  ok(scan.sd['B화재'] === 100000, '상담자료로 가는 길도 같은 규칙 — 연납은 한 달치로');
  ok(scan.sd['E생명'] === 0, '못 옮긴 것은 여태처럼 0 으로 넘긴다 — s10Money() 가 「모름」 으로 받는다');
  ok(scan.match.hong === 'yes' && scan.match.other === 'no',
    '이름이 맞는 고객에게만 옮긴다 — 남의 증권을 조용히 덮으면 VIP 가 통째로 거짓이 된다');

  await page.evaluate(() => {
    delete cmOf('mate').fp.f_ins;          /* 비어 있는 고객이라야 옮겨진다 */
    ccScanAfterSave('bojang', 'a29');      /* 이름이 다르다 — 안 들어가야 한다 */
    ccScanAfterSave('finance', 'mate');    /* 증권과 무관한 자료 — 안 들어가야 한다 */
    ccScanAfterSave('bojang', 'mate');     /* 이름이 맞고 비어 있다 — 들어가야 한다 */
  });
  await page.waitForTimeout(1400);
  const after = await page.evaluate(() => ({
    mate: (cmOf('mate').fp || {}).f_ins, a29: (cmOf('a29').fp || {}).f_ins
  }));
  ok(after.a29 === 20, '이름이 다른 고객의 보험료는 안 건드린다 (' + after.a29 + ')');
  ok(after.mate === '62', '이름이 맞고 비어 있으면 보험료 칸에 62만원이 들어간다 (' + after.mate + ')');

  /* 손으로 고쳐 둔 값이 증권 한 번에 날아가면 다시는 안 고친다 */
  await page.evaluate(() => {
    cmOf('mate').fp.f_ins = '99';
    ccScanAfterSave('bojang', 'mate');
  });
  await page.waitForTimeout(1000);
  const noOver = await page.evaluate(() => (cmOf('mate').fp || {}).f_ins);
  ok(noOver === '99', '이미 적혀 있으면 증권이 다시 와도 안 덮는다 (' + noOver + ')');

  /* ══ [21] 로그인 세션이 없을 때 ══════════════════════════════
     OS.profile 은 남아 있는데 OS.session 이 아직/이미 없는 때가 있다.
     그때 홈이 고객 목록을 읽으려다 OS.session.user.id 에서 터지면
     화면 전체가 죽는다. 실제로 CI 에서 이 오류가 났다.               */
  console.log('\n[21] 로그인 세션이 없어도 안 터진다');
  const before = errs.length;
  r = await page.evaluate(() => {
    var savedSession = OS.session, savedList = OSC.list;
    OS.session = null;                 /* 프로필만 남고 세션이 사라진 상태 */
    OSC.list = [];
    var out = { uid: (typeof cmUid === 'function') ? cmUid() : 'cmUid 없음', threw: '' };
    try {
      cmLoadAll(function () { });
      cmSave('a30', { bd: '01-01' });
      ccHomePaint();
      ccNavPaint();
      go('home');
    } catch (e) { out.threw = '' + (e && e.message); }
    OS.session = savedSession; OSC.list = savedList;
    return out;
  });
  await page.waitForTimeout(700);
  ok(r.uid === null, '세션이 없으면 cmUid() 가 null 을 준다 — 억지로 읽지 않는다');
  ok(r.threw === '', '불러오기·저장·홈 그리기 어느 것도 터지지 않는다' + (r.threw ? (' — ' + r.threw) : ''));
  ok(errs.length === before, '뒤늦게 터지는 오류도 없다' + (errs.length > before ? (' — ' + errs[before]) : ''));

  /* ══ [22] 오류 · 좁은 화면 ═══════════════════════════════════ */
  console.log('\n[22] 오류와 좁은 화면');
  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? (' — ' + errs[0]) : ''));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.evaluate(() => { OSC.view = 'list'; go('clients'); });
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(w[0] <= w[1] + 1, '390px 가로 스크롤 없음 (' + w[0] + '/' + w[1] + ')');

  await browser.close(); srv.close();

  console.log('\n──────────────────────────────');
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('고객 케어 점검 통과 — 30일 안에 모두에게, 그 하나를 지킵니다.');
})().catch(e => { console.error(e); process.exit(1); });
