/* 조직도 화면이 깜빡이지 않는가.

   무슨 일이 있었나.
     조직도를 열면 go('org') 가 화면을 통째로 그린 뒤 orgPull() 로 서버를 봤다.
     그런데 orgPull 은 서버 것을 받으면 <b>다시 go('org')</b> 를 불렀다.
     그 go('org') 가 또 orgPull 을 부르고, 받으면 또 go('org') —
     끝없이 돌았다. 화면 전체가 계속 새로 그려지니 눈에는 깜빡임으로 보였다.

     고치기 전:  열기 → 전체그리기 → 당기기 → 전체그리기 → 당기기 → …
     고친 뒤:    열기 → 전체그리기 → 당기기 → <b>바뀐 칸만</b> → 끝

   그래서 여기서 확인한다.
     1. 조직도를 한 번 열면 전체 그리기는 한 번뿐인가
     2. 서버를 다시 봐도 전체 그리기가 늘지 않는가
     3. 내용이 그대로면 화면을 아예 안 건드리는가
     4. 그러면서도 서버에서 온 새 사람은 제대로 나타나는가
     5. 보기 전환(가로↔목록)에서 화면이 안 튀는가                          */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8853;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.__pulls=0;
window.__db={org:[
  {id:'o1',name:'윤시현',rank:'사업단장',team:'온탑본부',parent:'',member_id:'u1'},
  {id:'o2',name:'김지점',rank:'지점장',team:'온탑1팀',parent:'o1',member_id:'u2'},
  {id:'o3',name:'박서준',rank:'설계사',team:'온탑1팀',parent:'o2',member_id:'u3'},
  {id:'o4',name:'최민아',rank:'신입',team:'온탑1팀',parent:'o2',member_id:'u4'}
]};
window.supabase={createClient:function(){
 function mk(tbl){
   var one=false;var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},range:function(){return a},
   single:function(){one=true;return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){
     var d=[];
     if(tbl==='org_members'){window.__pulls++;d=window.__db.org.slice();}
     else if(tbl==='profiles')d=[{id:'u1',name:'점검',role:'owner',active:true}];
     return Promise.resolve({data:one?(d[0]||null):d,error:null}).then(res);}};
  a['delete']=function(){return a};return a}
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'u1', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'u1', email: 'u1@t' } };
    window.toast = function () {};
  });

  const ready = await page.evaluate(() => typeof renderOrg === 'function' && typeof orgPaintChart === 'function');
  if (!ready) {
    console.log('✗ 앱이 뜨지 않았습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ── 1 ── 조직도를 한 번 열면 전체 그리기가 몇 번인가 ── */
  console.log('\n[1] 열었을 때 화면을 몇 번 다시 그리는가');
  const open = await page.evaluate(async () => {
    /* renderOrg 가 불릴 때마다 = 화면 전체를 다시 그릴 때마다 센다 */
    var n = 0, real = window.renderOrg;
    window.renderOrg = function () { n++; return real.apply(this, arguments); };
    window.__pulls = 0;
    go('org');
    await new Promise(r => setTimeout(r, 2200));   /* 돌 시간을 충분히 준다 */
    window.renderOrg = real;
    return { paints: n, pulls: window.__pulls };
  });
  is(open.paints === 1, '조직도를 열면 전체 그리기는 딱 한 번이다 (' + open.paints + '번) — 예전엔 끝없이 돌았다');
  is(open.pulls >= 1, '그래도 서버는 제대로 본다 (' + open.pulls + '번)');
  is(open.pulls <= 2, '서버를 헛되이 반복해서 부르지 않는다 (' + open.pulls + '번)');

  /* ── 2 ── 다시 새로고침해도 전체 그리기가 안 는다 ── */
  console.log('\n[2] 새로고침해도 화면이 안 튀는가');
  const again = await page.evaluate(async () => {
    var n = 0, real = window.renderOrg;
    window.renderOrg = function () { n++; return real.apply(this, arguments); };
    window.__pulls = 0;
    orgPull(true); orgPull(true); orgPull(true);
    await new Promise(r => setTimeout(r, 1600));
    window.renderOrg = real;
    return { paints: n, pulls: window.__pulls, still: document.querySelectorAll('.ogv-c,.ogv-mate').length };
  });
  is(again.paints === 0, '서버를 다시 봐도 화면 전체를 안 그린다 (' + again.paints + '번)');
  is(again.still === 4, '그래도 사람은 그대로 다 보인다 (' + again.still + '명)');

  /* ── 3 ── 내용이 같으면 아예 안 건드린다 ── */
  console.log('\n[3] 바뀐 게 없으면 화면을 안 건드리는가');
  const untouched = await page.evaluate(async () => {
    var box = document.getElementById('orgChartBox');
    var bar = document.getElementById('orgSyncBar');
    if (!box) return { no: true };
    /* 화면 안의 진짜 요소를 붙잡아 둔다. 다시 그려지면 이 요소는 버려진다. */
    var card = box.querySelector('.ogv-c');
    var before = box.innerHTML.length;
    orgPaintChart(); orgPaintChart(); orgSyncPaint();
    await new Promise(r => setTimeout(r, 200));
    return {
      sameCard: !!(card && card.isConnected),
      sameBar: !!(bar && bar.isConnected),
      len: box.innerHTML.length, before: before
    };
  });
  is(untouched.sameCard, '내용이 같으면 칸을 갈아끼우지 않는다 — 화면이 그대로 살아 있다');
  is(untouched.sameBar, '안내 띠도 그대로 둔다');
  is(untouched.len === untouched.before, '그림도 그대로다');

  /* ── 4 ── 그래도 진짜 바뀌면 바로 반영된다 ── */
  console.log('\n[4] 진짜 바뀌면 제대로 나타나는가');
  const changed = await page.evaluate(async () => {
    var n = 0, real = window.renderOrg;
    window.renderOrg = function () { n++; return real.apply(this, arguments); };
    /* 다른 컴퓨터에서 한 명을 더 넣었다 */
    window.__db.org.push({ id: 'o5', name: '새사람', rank: '설계사', team: '온탑1팀', parent: 'o2', member_id: 'u5' });
    ORGS.pulled = false;
    orgPull(true);
    await new Promise(r => setTimeout(r, 1200));
    window.renderOrg = real;
    var names = Array.prototype.map.call(document.querySelectorAll('.ogv-c b,.ogv-mate b'), e => e.textContent.trim());
    return { paints: n, names: names, cnt: (document.getElementById('orgCount') || {}).textContent || '' };
  });
  is(changed.names.indexOf('새사람') >= 0, '다른 컴퓨터에서 넣은 사람이 바로 나타난다 — ' + changed.names.join(' · '));
  is(changed.paints === 0, '그것도 화면 전체를 다시 안 그리고 해낸다 (' + changed.paints + '번)');
  is(/5명/.test(changed.cnt), '사람 수도 같이 고쳐진다 — ' + changed.cnt);

  /* ── 5 ── 보기 전환 ── */
  console.log('\n[5] 가로 ↔ 목록 전환이 매끄러운가');
  const swap = await page.evaluate(async () => {
    var n = 0, real = window.renderOrg;
    window.renderOrg = function () { n++; return real.apply(this, arguments); };
    orgViewSet('list');
    await new Promise(r => setTimeout(r, 250));
    var isList = !document.querySelector('.ogv');
    orgViewSet('wide');
    await new Promise(r => setTimeout(r, 250));
    var isWide = !!document.querySelector('.ogv');
    window.renderOrg = real;
    return { paints: n, isList: isList, isWide: isWide };
  });
  is(swap.isList && swap.isWide, '가로 ↔ 목록이 제대로 바뀐다');
  is(swap.paints === 0, '전환할 때도 화면 전체를 안 그린다 (' + swap.paints + '번)');

  /* ── 6 ── 옛 방식이 안 남았는가 ── */
  console.log('\n[6] 깜빡임을 부르던 코드가 남아 있지 않은가');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  /* 주석에 「예전엔 go('org') 를 불렀다」 라고 적어 뒀다. 그건 설명이지 코드가 아니다 —
     주석을 걷어낸 뒤에 재야 진짜 코드를 보는 것이다. */
  const pull = src.slice(src.indexOf('function orgPull('), src.indexOf('function orgPushOne('))
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\w])\/\/[^\n]*/g, '$1 ');
  is(pull.indexOf("go('org')") < 0, '서버에서 받아온 뒤 go(\'org\') 를 부르지 않는다 — 이게 고리의 시작이었다');
  is(pull.indexOf('orgPaintChart') >= 0, '대신 바뀐 칸만 고쳐 그린다');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 110) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '조직도 깜빡임 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '조직도 깜빡임 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
