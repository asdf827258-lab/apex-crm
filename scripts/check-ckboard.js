/* 실행 체크판 — 지점장 탭을 실제로 눌러 본다.

   달력·도와줄 것·업무 루트는 화면이 그려졌다고 끝이 아니다.
   심어 둔 기록만큼 날짜가 칠해지는지, 적은 것이 서버로 올라가는지,
   버튼이 가리키는 화면이 실제로 있는지까지 봐야 안 깨진 것이다.

   서버는 가짜로 붙인다. daily_checks 만 scope 별로 다르게 답한다.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8812;
const SHOT = process.env.CK_SHOT || '';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* KST 기준 오늘 */
const kst = new Date(Date.now() + 9 * 3600 * 1000);
const today = kst.toISOString().slice(0, 10);
const ym = today.slice(0, 7);
const dnum = +today.slice(8, 10);
function ds(n) { return ym + '-' + ('0' + n).slice(-2); }

/* 지난 날짜 몇 개를 심는다 — 다 한 날 · 덜 한 날 · 안 한 날 */
const ALL = ['a3','a1','a2','b1','b2','b5','b3','c1','c2','c5','c3','c4','b4','e1','e2'];
const rows = [];
const seeded = { full: [], part: [], none: [] };
for (let d = 1; d < dnum; d++) {
  const w = new Date(ds(d) + 'T00:00:00Z').getUTCDay();
  if (w === 0 || w === 6) continue;
  const m = {};
  if (d % 3 === 0) { ALL.forEach(k => m[k] = true); seeded.full.push(d); }
  else if (d % 3 === 1) { ALL.slice(0, 5).forEach(k => m[k] = true); seeded.part.push(d); }
  else { seeded.none.push(d); }
  rows.push({ check_date: ds(d), scope: 'day', items: m });
}

const STUB = `
window.__pageErrors=[];
window.__writes=[];
window.__dayRows=${JSON.stringify(rows)};
window.__helpRow=null;
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   neq:function(){return a},in:function(){return a},not:function(){return a},order:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(){return a},update:function(){return a},
   upsert:function(r){window.__writes.push({tbl:tbl,row:JSON.parse(JSON.stringify(r))});
     if(tbl==='daily_checks'&&r.scope==='help')window.__helpRow={items:r.items};return a},
   then:function(res){
     var out=[];
     if(tbl==='daily_checks'){
       if(f.scope==='help')out=window.__helpRow?[window.__helpRow]:[];
       else out=window.__dayRows;
     }
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'ck',email:'ck@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'ck'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#ckboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'ck', name: '지점장', role: 'leader', plan: 'vip' };
    OS.session = { user: { id: 'ck', email: 'ck@t' } };
    OS.cfg = { schema_version: '32' };
    try { localStorage.clear(); } catch (e) {}
    window.toast = function (m) { (window.__toast = window.__toast || []).push(m); };
    go('ckboard');
  });
  await page.waitForTimeout(1400);

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* ── 지점장 탭 ── */
  await page.evaluate(() => ckGo('leader'));
  await page.waitForTimeout(1200);

  const cal = await page.evaluate(() => {
    const g = document.querySelector('.cal-g');
    return {
      has: !!g,
      cells: g ? g.querySelectorAll('.cal-d').length : 0,
      miss: g ? g.querySelectorAll('.cal-d.miss').length : 0,
      half: g ? g.querySelectorAll('.cal-d.half').length : 0,
      okd: g ? g.querySelectorAll('.cal-d.ok').length : 0,
      now: g ? g.querySelectorAll('.cal-d.now').length : 0,
      sum: (document.querySelector('#calPane .ct-sum') || {}).textContent || '',
      title: (document.querySelector('.cal-hd b') || {}).textContent || '',
      nowCls: (g && g.querySelector('.cal-d.now') || {}).className || ''
    };
  });
  ok(cal.has, '달력이 그려졌다');
  ok(cal.cells === new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate(),
    '날짜 칸 ' + cal.cells + '개 (이번 달 일수와 같다)');
  ok(cal.now === 1, '오늘 칸이 하나 표시된다');
  ok(cal.okd === seeded.full.length, '다 한 날 ' + cal.okd + '일 = 심은 값 ' + seeded.full.length);
  ok(cal.half === seeded.part.length, '덜 한 날 ' + cal.half + '일 = 심은 값 ' + seeded.part.length);
  ok(cal.miss === seeded.none.length, '안 한 날 ' + cal.miss + '일 = 심은 값 ' + seeded.none.length
    + ' (오늘은 세지 않는다)');
  ok(!/\bmiss\b/.test(cal.nowCls), '오늘은 아무것도 안 했어도 빨갛지 않다');
  ok(cal.title.indexOf('월') > 0, '달 제목: ' + cal.title);
  ok(cal.sum.indexOf('빠뜨린 날') >= 0, '요약에 빠뜨린 날이 있다');

  /* 안 한 날을 눌러 본다 */
  if (seeded.none.length) {
    const d = ds(seeded.none[seeded.none.length - 1]);
    await page.evaluate(x => calPick(x), d);
    await page.waitForTimeout(250);
    const p = await page.evaluate(() => {
      const e = document.querySelector('.cal-p');
      return { t: e ? e.textContent : '', li: e ? e.querySelectorAll('.cal-ul li').length : 0 };
    });
    ok(p.li === ALL.length, '안 한 날을 누르면 못 한 것 ' + p.li + '개가 나온다');
    ok(p.t.indexOf('월') >= 0, '누른 날짜가 제목에 나온다');
  }

  /* 이전 달로 이동 */
  await page.evaluate(() => calShift(-1));
  await page.waitForTimeout(700);
  const prev = await page.evaluate(() => (document.querySelector('.cal-hd b') || {}).textContent || '');
  ok(prev !== cal.title, '이전 달로 넘어간다 (' + prev + ')');
  await page.evaluate(() => calShift(1));
  await page.waitForTimeout(700);

  /* ── 오늘 도와줄 것 ── */
  const before = await page.evaluate(() => document.querySelectorAll('#hpPane .hp-r').length);
  await page.evaluate(() => {
    document.getElementById('hpWho').value = '김민수';
    document.getElementById('hpWhat').value = '심사 걸린 건 대신 확인';
    hpAdd();
  });
  await page.waitForTimeout(400);
  /* 지난 날짜로 하나 더 */
  await page.evaluate(t => {
    document.getElementById('hpWho').value = '박지현';
    document.getElementById('hpWhat').value = '증권 판독 같이 보기';
    document.getElementById('hpDue').value = t;
    hpAdd();
  }, ds(Math.max(1, dnum - 3)));
  await page.waitForTimeout(400);

  const hp = await page.evaluate(() => ({
    rows: document.querySelectorAll('#hpPane .hp-r').length,
    txt: (document.getElementById('hpPane') || {}).textContent || '',
    n: (document.getElementById('hpN') || {}).textContent || '',
    late: !!document.querySelector('.hp-late'),
    saved: !!(window.__helpRow && window.__helpRow.items && window.__helpRow.items.list),
    savedN: (window.__helpRow && window.__helpRow.items && window.__helpRow.items.list || []).length
  }));
  ok(hp.rows === before + 2, '도와줄 것 2건이 추가됐다 (' + hp.rows + '줄)');
  ok(hp.txt.indexOf('김민수') >= 0 && hp.txt.indexOf('박지현') >= 0, '적은 이름이 그대로 보인다');
  ok(hp.late, '날짜가 지난 건에 경고가 뜬다');
  ok(hp.n === '0 / 2', '숫자판 ' + hp.n);
  ok(hp.saved && hp.savedN === 2, '서버로 2건이 올라갔다');

  /* 달력에 표시되는지 */
  const dot = await page.evaluate(() => document.querySelectorAll('.cal-d .dt').length);
  ok(dot >= 1, '도와줄 것 날짜가 달력에 점으로 뜬다 (' + dot + '개)');

  /* 완료 → 취소 → 지우기 */
  const id = await page.evaluate(() => hpLive()[0].id);
  await page.evaluate(x => hpDone(x), id);
  await page.waitForTimeout(250);
  const done1 = await page.evaluate(() => ({
    n: (document.getElementById('hpN') || {}).textContent || '',
    sec: !!document.querySelector('.hp-sec')
  }));
  ok(done1.n === '1 / 2' && done1.sec, '완료로 넘기면 아래 끝낸 것으로 내려간다');
  await page.evaluate(x => hpDel(x), id);
  await page.waitForTimeout(250);
  const del1 = await page.evaluate(() => ({
    rows: document.querySelectorAll('#hpPane .hp-r').length,
    live: hpLive().length,
    savedN: (window.__helpRow.items.list || []).filter(r => !r.del).length
  }));
  ok(del1.rows === 1 && del1.live === 1, '지우면 화면에서 사라진다');
  ok(del1.savedN === 1, '지운 것은 서버에도 반영된다');

  /* 새로고침해도 남아 있는지 — 서버에 올라간 것을 다시 읽는다 */
  await page.evaluate(() => { HELP.loaded = false; HELP.list = []; CAL.loaded = false; hpPull(); });
  await page.waitForTimeout(700);
  const again = await page.evaluate(() => (document.getElementById('hpPane') || {}).textContent || '');
  ok(again.indexOf('박지현') >= 0, '다시 불러와도 남아 있다');

  /* ── 체크하면 달력 오늘 칸이 바뀐다 ── */
  const t0 = await page.evaluate(() => calScore(ckDayK()));
  await page.evaluate(() => ckToggle('day', 'a1'));
  await page.waitForTimeout(300);
  const t1 = await page.evaluate(() => ({
    s: calScore(ckDayK()),
    cls: (document.querySelector('.cal-d.now') || {}).className || ''
  }));
  ok(t1.s === t0 + 1, '체크하면 오늘 점수가 오른다 (' + t0 + ' → ' + t1.s + ')');
  ok(t1.cls.indexOf('half') >= 0, '오늘 칸이 노란색(덜 함)으로 바뀐다');

  if (SHOT) await page.screenshot({ path: SHOT + '/leader.png', fullPage: true });

  /* ── 업무 루트 ── */
  await page.evaluate(() => ckGo('route'));
  await page.waitForTimeout(500);
  const steps = await page.evaluate(() => RT_STEP.map(x => x.k));
  for (const k of steps) {
    await page.evaluate(x => rtGo(x), k);
    await page.waitForTimeout(220);
    const r = await page.evaluate(kk => ({
      rows: document.querySelectorAll('.rt-r').length,
      on: (document.querySelector('.ck-st.on .k') || {}).textContent || '',
      go: document.querySelectorAll('.rt-r .rt-go').length,
      notice: !!document.querySelector('.card .notice')
    }), k);
    ok(r.on === k && r.rows >= 4 && r.go === r.rows,
      k + ' 단계 — 상황 ' + r.rows + '개, 화면 버튼 ' + r.go + '개');
  }
  const stuck = await page.evaluate(() => ({
    q: document.querySelectorAll('.rt-q').length,
    tabs: Array.prototype.map.call(document.querySelectorAll('.rt-go'), b => (b.getAttribute('onclick') || ''))
  }));
  ok(stuck.q === 7, '막힐 때 여는 곳 ' + stuck.q + '개');

  /* 버튼이 가리키는 화면이 실제로 있는지 */
  const bad = await page.evaluate(() => {
    var ids = {}, out = [];
    TABS.forEach(function (g) { g.items.forEach(function (i) { ids[i.id] = 1; }); });
    RT_STEP.forEach(function (s) { s.rows.forEach(function (r) { if (!ids[r.tab]) out.push(r.tab); }); });
    RT_STUCK.forEach(function (r) { if (!ids[r[1]]) out.push(r[1]); });
    var g2 = ['a', 'b', 'c', 'd', 'week', 'month'];
    g2.forEach(function (k) { (CK_LDR[k] || []).forEach(function (r) { if (r[4] && !ids[r[4]]) out.push(r[4]); }); });
    return out;
  });
  ok(bad.length === 0, '연결된 화면이 모두 실제로 있다' + (bad.length ? ' — 없는 것: ' + bad.join(', ') : ''));

  /* 모든 단계를 눌러도 화면이 안 깨지는지 */
  await page.evaluate(() => { ckGo('today'); ckGo('week'); ckGo('route'); ckGo('leader'); });
  await page.waitForTimeout(800);

  /* 좁은 화면 */
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(400);
  const wide = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(wide.sw <= wide.cw + 2, '390px 에서 가로 스크롤 없음 (' + wide.sw + '/' + wide.cw + ')');
  if (SHOT) await page.screenshot({ path: SHOT + '/leader-m.png', fullPage: true });
  await page.evaluate(() => ckGo('route'));
  await page.waitForTimeout(400);
  if (SHOT) await page.screenshot({ path: SHOT + '/route-m.png', fullPage: true });

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 160))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('체크판 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
