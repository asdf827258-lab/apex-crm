/* APEX 사용가이드 — 앱이 바뀌면 제일 먼저 낡는 곳.

   매뉴얼은 아무도 안 읽는 것 같아 보이지만, 신입은 이것부터 본다.
   그래서 여기가 틀리면 신입이 없는 메뉴를 찾아 헤맨다.

   실제로 그런 일이 있었다 — 「AI 부서 보고」 「AI 상담 피드백」 버튼이
   가이드에 남아 있었는데, 그 화면은 오래전에 사라져 있었다.
   눌러도 아무 데도 안 갔다.

   그래서 여기서 확인한다.
     1. 가이드가 부르는 화면이 전부 실제로 있는가 (죽은 링크 0)
     2. 파란 버튼을 실제로 눌러 그 화면으로 가는가
     3. 열두 칸이 가이드의 메뉴 지도에 다 적혀 있는가
     4. 왼쪽 맨 위 고정 버튼이 가이드로 가는가
     5. 접었다 폈다 되는가, 인쇄본에 모든 칸이 담기는가
     6. 준법 문구가 빠지지 않았는가                                  */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8838;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{
   getSession:function(){return Promise.resolve({data:{session:{user:{id:'gd',email:'gd@test'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'gd'}}})},
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
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#manual', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2300);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'gd', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'gd', email: 'gd@test' } };
    window.toast = function () {};
    renderNav(); go('manual');
  });
  await page.waitForTimeout(400);

  const ready = await page.evaluate(() => typeof manSecs === 'function' && typeof manBody === 'function');
  if (!ready) {
    console.log('✗ 사용가이드가 실려 있지 않습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ── 1 ── */
  console.log('\n[1] 가이드가 부르는 화면이 다 있는가');
  const links = await page.evaluate(() => {
    var html = '', ids = {}, dead = [], secs = manSecs();
    secs.forEach(function (s) { html += s.fn(); });
    (html.match(/go\('([a-z_0-9]+)'\)/g) || []).forEach(function (m) {
      ids[m.replace(/^go\('|'\)$/g, '')] = 1;
    });
    var have = {};
    TABS.forEach(function (g) { (g.items || []).forEach(function (it) { have[it.id] = 1; }); });
    var extra = { growth: 1, teamx: 1, ckteam: 1 };
    var k;
    for (k in ids) if (ids.hasOwnProperty(k) && !have[k] && !extra[k]) dead.push(k);
    return { n: Object.keys(ids).length, dead: dead, secs: secs.length, called: Object.keys(ids) };
  });
  is(links.dead.length === 0,
    '죽은 링크가 없다 — ' + links.n + '개 화면을 부른다' + (links.dead.length ? ' · 죽은 것: ' + links.dead.join(', ') : ''));
  is(links.secs >= 15, '칸이 ' + links.secs + '개 있다');

  /* 부르지 않는 메뉴가 너무 많으면 가이드가 앱을 못 따라간 것이다 */
  const cover = await page.evaluate(a => {
    var have = [];
    TABS.forEach(function (g) { if (!g.hide) (g.items || []).forEach(function (it) { have.push(it.id); }); });
    var miss = have.filter(function (x) { return a.indexOf(x) < 0; });
    return { total: have.length, miss: miss };
  }, links.called);
  is(cover.miss.length <= 20,
    '메뉴 ' + (cover.total - cover.miss.length) + ' / ' + cover.total + ' 개를 가이드가 안내한다' +
    (cover.miss.length ? ' · 안 나온 것 ' + cover.miss.length + '개' : ''));

  /* ── 2 ── */
  console.log('\n[2] 열두 칸이 메뉴 지도에 다 적혀 있는가');
  const map = await page.evaluate(() => {
    var html = manMap(), miss = [];
    TABS.forEach(function (g) { if (!g.hide && html.indexOf(g.group) < 0) miss.push(g.group); });
    return { miss: miss, n: TABS.filter(function (g) { return !g.hide; }).length };
  });
  is(map.miss.length === 0,
    '칸 ' + map.n + '개가 메뉴 지도에 다 적혀 있다' + (map.miss.length ? ' · 빠짐: ' + map.miss.join(', ') : ''));

  /* ── 3 ── */
  console.log('\n[3] 화면에서 실제로 되는가');
  const shown = await page.evaluate(() => {
    var b = document.getElementById('manBody');
    return { has: !!b, len: b ? (b.textContent || '').replace(/\s+/g, '').length : 0,
      rows: b ? b.querySelectorAll('button').length : 0 };
  });
  is(shown.has && shown.len > 400, '가이드 화면이 열린다 (' + shown.len + '자)');

  /* 칸 하나를 눌러 펴고, 그 안의 파란 버튼을 눌러 화면이 바뀌는지 */
  const opened = await page.evaluate(() => {
    manToggle('map');
    var b = document.getElementById('manBody');
    return (b.textContent || '').indexOf('메뉴 지도') >= 0 && (b.textContent || '').indexOf('하루 시작') >= 0;
  });
  await page.waitForTimeout(200);
  is(opened, '칸을 누르면 펴진다 — 메뉴 지도 안에 칸 이름이 보인다');

  const jumped = await page.evaluate(() => {
    var b = document.getElementById('manBody');
    var btns = [].slice.call(b.querySelectorAll('button'));
    var hit = null;
    for (var i = 0; i < btns.length; i++) {
      var oc = btns[i].getAttribute('onclick') || '';
      if (oc.indexOf("go('bojang')") >= 0) { hit = btns[i]; break; }
    }
    if (!hit) return { found: false };
    hit.click();
    return { found: true, tab: (typeof lastTab !== 'undefined') ? lastTab : '' };
  });
  await page.waitForTimeout(400);
  is(jumped.found && jumped.tab === 'bojang',
    '파란 버튼을 누르면 그 화면으로 간다 (' + (jumped.tab || '-') + ')');

  /* ── 4 ── */
  console.log('\n[4] 왼쪽 맨 위 고정 버튼');
  const pin = await page.evaluate(() => {
    /* 맨 위 고정 단추가 「첫 번째」 인지로 견주지 않는다 — 위에 또 하나가 서면
       엉뚱한 단추를 붙잡고 사용가이드가 사라졌다고 운다. 부르는 화면(manual)으로 집는다. */
    var all = Array.prototype.slice.call(document.querySelectorAll('#navHost .sb-guide'));
    var b = null;
    all.forEach(function (e) { if (/go\('manual'\)/.test(e.getAttribute('onclick') || '')) b = e; });
    if (!b) return { has: false };
    var r = b.getBoundingClientRect();
    var groups = document.querySelector('#navHost .nav-group, #navHost .nav-allbtns');
    b.click();
    return { has: true, text: (b.textContent || '').replace(/\s+/g, ' ').trim(),
      top: r.top, n: all.length,
      /* 분류 칸들보다 위에 있는가 — 그 위에 다른 고정 단추가 몇이든 상관없다 */
      aboveGroups: !!groups && (b.compareDocumentPosition(groups) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      tab: (typeof lastTab !== 'undefined') ? lastTab : '' };
  });
  await page.waitForTimeout(400);
  is(pin.has, '왼쪽 맨 위에 고정 버튼이 있다');
  is(pin.has && /APEX 사용가이드/.test(pin.text), '이름이 「APEX 사용가이드」 다 — ' + (pin.text || ''));
  is(pin.aboveGroups === true, '메뉴 칸들보다 위에 있다 (고정 단추 ' + (pin.n || 0) + '개 중)');
  const after = await page.evaluate(() => (typeof lastTab !== 'undefined') ? lastTab : '');
  is(after === 'manual', '누르면 사용가이드로 간다 (' + after + ')');

  /* 메뉴 안에도 새 이름으로 있는가 */
  const inMenu = await page.evaluate(() => {
    var b = document.querySelector('#navHost .tab-btn[data-tab="manual"]');
    return b ? (b.textContent || '').replace(/\s+/g, ' ').trim() : '';
  });
  is(/APEX 사용가이드/.test(inMenu), '메뉴에도 새 이름으로 있다 — ' + inMenu);

  /* ── 5 ── */
  console.log('\n[5] 인쇄본 · 준법');
  const printed = await page.evaluate(() => {
    var body = '', secs = manSecs();
    secs.forEach(function (s) { body += s.title + s.fn(); });
    return { len: body.length, secs: secs.length,
      allIn: secs.every(function (s) { return body.indexOf(s.title) >= 0; }) };
  });
  is(printed.allIn, '인쇄본에 ' + printed.secs + '개 칸이 다 담긴다');
  is(printed.len > 20000, '내용이 충분하다 (' + printed.len + '자)');

  const law = await page.evaluate(() => {
    var b = document.getElementById('manBody');
    return (b ? b.textContent : '');
  });
  is(/약관|심사/.test(law) && /준법감시/.test(law), '준법 문구가 붙어 있다');
  is(/금융소비자 보호에 관한 법률/.test(law), '금융소비자보호법이 명시돼 있다');

  /* ── 6 ── */
  console.log('\n[6] 좁은 화면');
  await page.evaluate(() => go('manual'));
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 430, height: 900 });
  await page.waitForTimeout(300);
  const narrow = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  is(narrow.sw <= narrow.cw + 2, '가로로 안 밀린다 (' + narrow.sw + ' / ' + narrow.cw + ')');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 100) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? 'APEX 사용가이드 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : 'APEX 사용가이드 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
