/* 보장 전·후 「보여주기」(고객 앞 발표) 장을 실제로 찍는다 — node tools/snap-ba.js <저장폴더> [폭] [높이]
   앱 스스로의 견본(doSample)을 쓰되, SNS 에 나가므로 찍을 때만
   · 고객 이름 → 홍길동
   · 보험사·상품 이름 → A사·B사… / ○○보험  (실제 회사 상품을 「해지」 하는 장면으로 읽히지 않게)
   으로 바꾼다. 앱 파일은 건드리지 않는다. 서버를 부르지 않는다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.resolve(process.argv[2] || 'ba-shots');
const W = +(process.argv[3] || 1700), H = +(process.argv[4] || 1200);   // 발표 무대는 1280×720 — 화면이 넓어야 줄지 않고 선다
const ONLY = process.argv.slice(5);   // 찍을 장 id (비우면 전부)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, rs) => {
  let p = decodeURIComponent(q.url.split('?')[0]); let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rs);
});
(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.includes('127.0.0.1:' + port) || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/(gh\/orioncactus|npm\/pretendard|gh\/projectnoonnu)/.test(u)) return r.continue();
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const pg = await ctx.newPage();
  pg.on('dialog', d => d.accept());   // 「예시로 덮어씁니다」 확인 창
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  const ids = await pg.evaluate(() => {
    localStorage.clear(); doSample();
    S.who.name = '홍길동';
    var L = 'ABCDEFGH';
    S.before.concat(S.after).forEach(function (p, i) { p.co = L[i] + '사'; p.nm = '○○보험'; });
    save(); S.deck = true; S.slide = 'sHd'; go('show');
    return deckList().map(function (s) { return s.id + '|' + ((document.querySelector('#baToc a[href="#' + s.id + '"]') || {}).textContent || '').replace(/\s+/g, ' ').trim(); });
  });
  await pg.waitForTimeout(800);
  console.log(ids.join('\n'));
  for (const id of ids.map(x => x.split('|')[0]).filter(x => !ONLY.length || ONLY.includes(x))) {
    await pg.evaluate(id => { S.slide = id; go('show'); window.scrollTo(0, 0); }, id);
    await pg.waitForTimeout(700);
    for (const f of pg.frames().slice(1)) await f.waitForLoadState('load', { timeout: 4000 }).catch(() => {});
    await pg.waitForTimeout(500);
    // 도구 막대 없이 무대(지금 선 장)만
    const el = await pg.evaluateHandle(id => document.getElementById(id), id);
    await el.asElement().screenshot({ path: path.join(OUT, id + '.png'), timeout: 20000 }).catch(e => console.log('\n찍기 실패 ' + id + ' ' + e.message.split('\n')[0]));
    process.stdout.write(id + ' ');
  }
  console.log('\n오류', errs.length ? errs : '없음');
  await b.close(); srv.close();
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
