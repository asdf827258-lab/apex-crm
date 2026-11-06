/* 진짜 앱 화면을 찍는다 — node tools/snap-app.js <저장폴더> [탭 ...]
   scripts/smoke.js 와 같은 방식으로 로그인·서버를 가짜로 세우고 app/index.html 을 폰 폭(430px)으로 연다.
   서버(Supabase·AI)는 부르지 않는다. 고객 데이터는 이 브라우저에 아무것도 없다 — 찍히는 것은 빈 앱 또는 견본뿐. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.resolve(process.argv[2] || 'snaps');
const want = process.argv.slice(3);
const PORT = 8798;
const STUB = fs.readFileSync(path.join(ROOT, 'scripts/smoke.js'), 'utf8').match(/const STUB = `([\s\S]*?)`;/)[1];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webmanifest': 'application/json' };
fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(PORT);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5 });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.includes('127.0.0.1:' + PORT) || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/gh\/orioncactus/.test(u)) return r.continue();
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const page = await ctx.newPage();
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'smoke', name: '홍길동', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'smoke', email: 'demo@test' } }; OS.cfg = { schema_version: '29' };
    window.toast = function () {};
  });
  // 아침 보고 창·떠 있는 안내 말풍선은 화면을 덮는다 — 찍기 전에 걷어 낸다
  const clean = () => page.evaluate(() => {
    ['arBriefOvl', 'osLoginGate', 'osGuideOvl', 'osOvl', 'osGuide'].forEach(id => { const x = document.getElementById(id); if (x) x.remove(); });
    // 떠 있는 것(마이크·? 단추·워크스페이스 알약·첫 안내 시트)은 걷는다. 위 띠와 아래 메뉴만 남긴다.
    [...document.querySelectorAll('body *')].forEach(e => {
      const cs = getComputedStyle(e);
      if (cs.position !== 'fixed' || e.dataset.snapHid) return;
      const r = e.getBoundingClientRect(), tx = (e.textContent || '').replace(/\s+/g, '');
      const isTop = r.top <= 2 && r.height < 130 && r.width > 380;
      const isNav = r.bottom >= innerHeight - 2 && r.width > 380 && r.height < 110 && /도구/.test(tx) && /고객/.test(tx);
      const isPage = r.width * r.height > 0.5 * innerWidth * innerHeight;  // 화면 전체를 차지하는 칸(상품전략기 등)은 화면 그 자체다
      if (!isTop && !isNav && !isPage && !e.querySelector('#dynPane,.tab-pane')) { e.dataset.snapHid = '1'; e.style.setProperty('visibility', 'hidden', 'important'); }  // 지우지 않고 가린다 — go() 가 찾는 칸을 잃지 않게
    });
  });
  await page.waitForTimeout(1500); await clean();
  const tabs = want.length ? want : ['keep4'];
  for (const t of tabs) {
    await page.evaluate(t => { go(t); window.scrollTo(0, 0); }, t);
    await page.waitForTimeout(900);
    // 안쪽 페이지(iframe)를 불러오는 화면은 그것이 다 그려질 때까지 기다린다
    for (const f of page.frames().slice(1)) { await f.waitForLoadState('load').catch(() => {}); }
    if (page.frames().length > 1) await page.waitForTimeout(2500);
    await clean();
    await page.screenshot({ path: path.join(OUT, t + '.png') });
    process.stdout.write(t + ' ');
  }
  // 4년 유지관리 — 48개월 차례를 펼쳐 <b>길게</b> 한 장 (영상에서 폰 안을 굴려 내려간다)
  if (tabs.includes('keep4')) {
    await page.evaluate(() => { KP4.plan = true; go('keep4'); window.scrollTo(0, 0); });
    await page.waitForTimeout(900); await clean();
    await page.screenshot({ path: path.join(OUT, 'keep4.png') });
    // 앱은 안쪽 칸이 굴러간다 — 칸 밖은 그려지지 않아 하얗게 찍힌다. 창을 아주 길게 늘려 전부 한 화면에 세운 뒤
    // 「48개월 차례」 칸만 찍는다. 길이가 커서 배율은 1.5 로 낮춘다(영상 속 폰 화면 폭 456px 에는 충분).
    const ctx2 = await b.newContext({ viewport: { width: 430, height: 9800 }, deviceScaleFactor: 1.5 });
    await ctx2.route('**://**', r => { const u = r.request().url();
      if (u.includes('127.0.0.1:' + PORT) || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/gh\/orioncactus/.test(u)) return r.continue();
      return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); });
    const p3 = await ctx2.newPage(); await p3.addInitScript(STUB);
    await p3.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p3.waitForTimeout(3000);
    await p3.evaluate(() => { document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide,#arBriefOvl').forEach(x => x.remove());
      OS.profile = { id: 'smoke', name: '홍길동', role: 'owner', plan: 'vip' }; OS.session = { user: { id: 'smoke' } }; OS.cfg = { schema_version: '29' };
      window.toast = function () {}; KP4.plan = true; go('keep4'); });
    await p3.waitForTimeout(1500);
    const hgt = await p3.evaluate(() => document.getElementById('kp4Plan').getBoundingClientRect().bottom);
    if (hgt > 9790) console.log('\n⚠ 48개월 칸이 창보다 깁니다 (' + Math.round(hgt) + 'px) — 창 높이를 늘리십시오');
    await (await p3.$('#kp4Plan')).screenshot({ path: path.join(OUT, 'keep4_long.png') });
    await ctx2.close();
    process.stdout.write('(keep4 길게) ');
  }
  // 앱 안의 따로 된 페이지(iframe 으로 붙는 것)는 그 페이지를 직접 연다 — 같은 화면, 같은 폭
  const SUB = { insight: '/app/insight/index.html' };
  for (const t of tabs.filter(t => SUB[t])) {
    const p2 = await ctx.newPage();
    await p2.goto('http://127.0.0.1:' + PORT + SUB[t], { waitUntil: 'load', timeout: 90000 });
    await p2.waitForTimeout(2500);
    await p2.screenshot({ path: path.join(OUT, t + '.png') });
    await p2.close();
    process.stdout.write('(' + t + ' 다시) ');
  }
  await b.close(); server.close(); console.log('\n→ ' + OUT);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
