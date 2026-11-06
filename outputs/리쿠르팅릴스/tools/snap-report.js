/* 「치료 한 바퀴」 보고서(app/ba-report.html) 장을 사진까지 받아 찍는다 — node tools/snap-report.js <저장폴더> <장 번호…>
   보고서는 장마다 위키미디어 공용(Commons)의 사진을 쓰고, 장 안에 「사진 · 지은이 · CC 라이선스 · 위키미디어 공용」 을 적어 둔다.
   그 출처 줄이 그대로 찍히도록 장 전체를 찍는다(잘라 내면 출처가 빠진다). 견본 고객(홍길동 · 예시)으로 선다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const [OUTD, ...NOS] = process.argv.slice(2);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
fs.mkdirSync(OUTD, { recursive: true });
const srv = http.createServer((q, rs) => { let p = decodeURIComponent(q.url.split('?')[0]); let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rs); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  await ctx.route('**://**', r => { const u = r.request().url();
    if (u.includes('127.0.0.1:' + port) || /cdn\.jsdelivr\.net|fonts\.g|wikimedia\.org/.test(u)) return r.continue();
    return r.fulfill({ status: 404, body: '' }); });
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:' + port + '/app/ba-report.html', { waitUntil: 'load' }); await pg.waitForTimeout(2000);
  for (const no of NOS) {
    await pg.evaluate(i => document.querySelector('#dots [data-i="' + i + '"]').click(), +no);
    // 사진이 다 올 때까지 (위키미디어가 늦거나 막으면 20초에서 끊고 그대로 찍는다 — 빈 칸이 몇 개인지 말한다)
    let left = -1;
    for (let k = 0; k < 40; k++) {
      left = await pg.evaluate(() => { const s = document.querySelector('.sl.on'); return [...s.querySelectorAll('img')].filter(i => !(i.complete && i.naturalWidth > 0)).length; });
      if (!left) break; await pg.waitForTimeout(500);
    }
    // SNS 에 나가므로 보험사 이름은 가린다 (견본 자료에 실제 회사 이름이 들어 있다)
    const hid = await pg.evaluate(() => {
      const CO = /(메트라이프|삼성화재|삼성생명|삼성|한화손보|한화생명|한화손해보험|한화|교보|신한|KB손보|KB|NH|농협|동양|ABL|흥국|DB손보|DB|현대해상|현대|미래에셋|라이나|AIA|푸본|하나|IBK|메리츠|롯데|MG|AXA|카디프|처브)[^\s·,()]*/g;
      const w = document.createTreeWalker(document.querySelector('.sl.on'), NodeFilter.SHOW_TEXT); let n, k = 0;
      while ((n = w.nextNode())) { if (n.nodeValue.search(CO) >= 0) { n.nodeValue = n.nodeValue.replace(CO, '○○'); k++; } }
      return k; });
    await pg.waitForTimeout(400);
    await (await pg.$('.sl.on')).screenshot({ path: path.join(OUTD, 'rep' + String(no).padStart(2, '0') + '.png') });
    console.log('장 ' + no + (left ? ' — 사진 ' + left + '장 못 받음' : ' — 사진 다 받음') + ' · 보험사 이름 ' + hid + '곳 가림');
  }
  await b.close(); srv.close();
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
