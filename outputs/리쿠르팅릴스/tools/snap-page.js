/* 앱의 따로 된 페이지를 열어 찍는다 — node tools/snap-page.js <저장폴더> <페이지> <폭> <높이> [미리 할 일 JS] [찍을 칸 CSS]
   예) node tools/snap-page.js /tmp/fin app/finance.html 900 6000 "finSample();switchTab('pension');renderPensionSim()" "#pension-sim"
       node tools/snap-page.js /tmp/tx  app/ba-3d.html   1280 720
   서버(Supabase·AI)는 부르지 않는다. 글꼴·three.js 같은 공개 CDN 만 연다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const [OUTD, PAGE, W, H, PRE, SEL, NAME] = process.argv.slice(2);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
fs.mkdirSync(OUTD, { recursive: true });
const srv = http.createServer((q, rs) => {
  let p = decodeURIComponent(q.url.split('?')[0]); let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rs);
});
(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +H > 3000 ? 1.5 : 2 });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.includes('127.0.0.1:' + port) || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com/.test(u)) return r.continue();
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  pg.on('dialog', d => d.accept());
  await pg.goto('http://127.0.0.1:' + port + '/' + PAGE, { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(3500);
  if (PRE) { const rv = await pg.evaluate(PRE).catch(e => { errs.push('PRE ' + e.message); }); if (rv !== undefined) console.log('미리 할 일 →', rv); await pg.waitForTimeout(1500); }
  const out = path.join(OUTD, (NAME || path.basename(PAGE, '.html')) + '.png');
  if (SEL) {
    const vis = await pg.evaluate(sel => { const e = document.querySelector(sel); if (!e) return 'none'; const r = e.getBoundingClientRect(); return r.width + 'x' + r.height + ' ' + getComputedStyle(e).display; }, SEL);
    console.log('칸', SEL, vis, errs);
    await (await pg.$(SEL)).screenshot({ path: out, timeout: 60000 });
  }
  else await pg.screenshot({ path: out });
  console.log('→ ' + out, errs.length ? errs : '');
  await b.close(); srv.close();
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
