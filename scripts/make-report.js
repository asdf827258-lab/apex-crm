/* APEX 재무 리포트 만들기 — 카톡용 HTML 1개 + A4 PDF 1개 (+ 폰 캡처 1장, 눈으로 볼 것)

     node scripts/make-report.js <data.js> [내보낼 폴더]

   data.js 는 객체를 내보내도 되고, (APEX_REPORT) => 객체 함수를 내보내도 됩니다
   (함수면 APEX_REPORT.calc 로 숫자를 셀 수 있습니다 — 견본: scripts/report/예시_data.js).

   ★ PDF 에는 Pretendard 를 넣어 뽑습니다. 이 컨테이너에는 한글 글꼴이 없어 그냥 뽑으면
     글자가 네모로 찍힙니다. 글꼴은 ~/.fonts 에서 찾고, 없으면 jsDelivr 에서 받아 옵니다.
     카톡용 HTML 에는 넣지 않습니다(몇 MB) — 폰에는 한글 글꼴이 있습니다.
   ★ tnum 없이 뽑습니다 — PDF 숫자가 유니코드를 잃지 않게 (CLAUDE.md 4-1번).          */
const fs = require('fs'), path = require('path'), os = require('os'), https = require('https');

const dataFile = process.argv[2];
if (!dataFile) { console.error('쓰는 법: node scripts/make-report.js <data.js> [폴더]'); process.exit(2); }
const outDir = path.resolve(process.argv[3] || 'outputs/재무리포트');   /* ★ PDF·PNG 는 커서 저장소에 올리지 않습니다(check-junk) — HTML 만 올립니다 */

globalThis.window = globalThis;
require(path.join(__dirname, '..', 'app', 'apex_report_icons.js'));
require(path.join(__dirname, '..', 'app', 'apex_report_engine.js'));
const R = globalThis.APEX_REPORT;

const mod = require(path.resolve(dataFile));
const data = typeof mod === 'function' ? mod(R) : mod;
const name = (data.client && data.client.name) || '고객';
const base = path.join(outDir, name + '님_리포트');

const WEIGHTS = { 400: 'Regular', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };
function get(url) {
  return new Promise((ok, no) => https.get(url, (r) => {
    if (r.statusCode !== 200) return no(new Error(url + ' → ' + r.statusCode));
    const b = []; r.on('data', (c) => b.push(c)); r.on('end', () => ok(Buffer.concat(b)));
  }).on('error', no));
}
async function fontCss() {
  const dirs = [path.join(os.homedir(), '.fonts'), path.join(os.tmpdir(), 'apex-pretendard')];
  let css = '';
  for (const [w, nm] of Object.entries(WEIGHTS)) {
    const f = 'Pretendard-' + nm + '.otf';
    let buf = null;
    for (const d of dirs) if (fs.existsSync(path.join(d, f))) { buf = fs.readFileSync(path.join(d, f)); break; }
    if (!buf) {
      buf = await get('https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/' + f);
      fs.mkdirSync(dirs[1], { recursive: true }); fs.writeFileSync(path.join(dirs[1], f), buf);
    }
    css += '@font-face{font-family:Pretendard;font-weight:' + w + ';src:url(data:font/otf;base64,' + buf.toString('base64') + ') format("opentype")}';
  }
  return '<style>' + css + '</style>';
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const html = R.html(data);
  fs.writeFileSync(base + '.html', html);

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const withFont = html.replace('</head>', (await fontCss()) + '</head>');

  const pdfPage = await browser.newPage();
  await pdfPage.setContent(withFont, { waitUntil: 'load' });
  await pdfPage.evaluate(() => document.fonts.ready);
  await pdfPage.pdf({ path: base + '.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await phone.setContent(withFont, { waitUntil: 'load' });
  await phone.evaluate(() => document.fonts.ready);
  await phone.screenshot({ path: base + '_폰.png', fullPage: true });
  await browser.close();

  for (const f of [base + '.html', base + '.pdf', base + '_폰.png'])
    console.log('  ' + path.relative(process.cwd(), f) + '  ' + Math.round(fs.statSync(f).size / 1024) + 'KB');
})().catch((e) => { console.error(e); process.exit(1); });
