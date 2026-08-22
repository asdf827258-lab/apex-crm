/* 치료비 지급지도 — 「그래서 무엇이 달라지는가」

   4장까지는 <b>돈이 얼마 줄어드는가</b>에서 끝났다. 고객이 정작 묻는 것은
   그 다음이다 — 「그래서 내 삶이 어떻게 달라지는데요」. 5장이 그 답인데,
   여기서 <b>없는 숫자를 만들면</b> 고객 앞에서 무너진다.

   여기서 확인한다.

     1. 돈을 달(月)로 바꾼 셈이 손으로 아는 답과 같은가
     2. 대출 환산이 원리금균등 공식과 맞는가 · <b>가정</b>이라고 밝히는가
     3. 값을 안 넣으면 <b>지어내지 않는가</b> (0 이 아니라 「넣어 주세요」)
     4. 보험료 견주기는 <b>넣었을 때만</b> 뜨고, 정직한 단서가 붙는가
     5. 설계사에게 하는 말은 <b>고객 인쇄본에 안 나가는가</b>            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 현장 값 한 벌 — 고액암, 월소득 400, 6개월 소득중단 */
  const set = (cov) => page.evaluate((cov) => {
    localStorage.setItem('apex_treatpay', JSON.stringify({ dis: 'cancer_major', cov: cov }));
    TP.cov = {}; tpLoad();
    return tpBody().replace(/\s+/g, ' ');
  }, cov);

  const FULL = { diag: 5000, surg: 300, perDay: 10, days: 21, chemo: 3000, bill: 2000,
                 silbi: 80, income: 400, off: 6, rate: 6, prem: 25, years: 8 };

  console.log('\n[1] 돈을 달(月)로 바꾼 셈이 맞는가');
  const h = await set(FULL);
  /* 정액 목돈 = 5000+300+10*21+3000 = 8,510만 · 월소득 400 → 21.3개월 */
  is(/정액 목돈 <b>8,510만원<\/b>/.test(h), '  정액 목돈 8,510만원 — 진단·수술·일당·항암의 합');
  is(/21\.3개월치/.test(h), '  월 소득 400만원 기준 21.3개월치 월급');
  is(/6개월<\/b>을 메우고도 <b>15\.3개월<\/b>/.test(h), '  쉬어야 하는 6개월을 메우고 15.3개월이 남는다');
  is(/쉴 수 있는 기간/.test(h) && /21\.3<small> 개월/.test(h), '  요약에도 「쉴 수 있는 기간」 이 선다');

  console.log('\n[2] 보험이 없었다면 — 갚는 방법으로 환산');
  /* 총부담 = 병원비 2,000 + 소득손실 400*6 = 4,400만 · 월급으로 모으면 11개월 */
  is(/한 푼도 안 쓰고 모으면<\/span><b>11개월/.test(h), '  월급을 한 푼도 안 쓰고 모으면 11개월');
  /* 4,400만 · 연 6% · 60개월 원리금균등 → 월 85.07만 · 이자 704만 */
  is(/매달 85만원/.test(h), '  대출로 메우면 매달 85만원 (원리금균등 5년)');
  is(/이자만 704만원/.test(h), '  5년치 이자만 704만원');
  is(/연 6% · 5년 원리금균등 가정/.test(h), '  <b>가정</b>이라고 그 자리에 밝힌다');
  is(/대출 금리는 <b>가정<\/b>입니다/.test(h), '  고쳐 쓰라고 한 번 더 말한다');

  console.log('\n[3] 금리를 바꾸면 숫자가 따라 바뀐다');
  const h9 = await set(Object.assign({}, FULL, { rate: 9 }));
  is(/연 9% · 5년/.test(h9), '  연 9% 로 바뀐다');
  is(/매달 91만원/.test(h9), '  월 상환도 91만원으로 늘어난다 (85 → 91)');

  console.log('\n[4] 값을 안 넣으면 지어내지 않는다');
  const zero = await set({ diag: 0, surg: 0, perDay: 0, days: 0, chemo: 0, bill: 0,
                           silbi: 0, income: 0, off: 0, rate: 6, prem: 0, years: 0 });
  is(/월 소득을 넣으면/.test(zero), '  월 소득이 없으면 「넣으면 계산합니다」 라고 말한다');
  is(!/개월치 월급/.test(zero), '  0 개월 같은 거짓 숫자를 만들지 않는다');
  is(!/어디서 만듭니까/.test(zero), '  부담이 0 이면 「어디서 만듭니까」 를 아예 안 띄운다');
  is(!/지금까지 낸 보험료와 견주면/.test(zero), '  보험료를 안 넣으면 견주기도 안 뜬다');
  is(/담보 금액을 넣으면/.test(zero) || /넣으면/.test(zero), '  무엇을 넣어야 하는지 알려 준다');

  console.log('\n[5] 소득 공백을 못 메우면 못 메운다고 말한다');
  const short = await set(Object.assign({}, FULL, { diag: 500, chemo: 0, surg: 0, perDay: 0, days: 0 }));
  is(/모자랍니다/.test(short), '  목돈이 모자라면 「모자랍니다」 라고 적는다 — 부풀리지 않는다');
  is(!/남습니다/.test(short), '  모자란데 「남습니다」 라고 하지 않는다');

  console.log('\n[6] 보험료 견주기 — 정직한 단서가 붙는가');
  is(/낸 보험료 2,400만원/.test(h), '  월 25만원 × 8년 = 2,400만원');
  is(/이 사건에 쓰이지 않는 다른 담보<\/b>의 값도 들어 있고/.test(h),
     '  낸 보험료에 다른 담보 값이 섞여 있다고 밝힌다');
  is(/앞으로 낼 보험료<\/b>는 빠져 있습니다/.test(h), '  앞으로 낼 보험료가 빠졌다고 밝힌다');
  is(/사건이 없으면 지급도 없습니다/.test(h), '  사건이 없으면 지급도 없다고 못 박는다');
  is(/수익률로 견줄 수 있는 숫자가 아니라/.test(h), '  수익률이 아니라고 선을 긋는다');

  console.log('\n[7] 설계사에게 하는 말은 고객 종이에 안 나간다');
  is(/tp-say/.test(h), '  화면에는 「이 자리에서 이 한 줄」 이 있다');
  const src = fs.readFileSync('app/index.html', 'utf8');
  is(/\.tp-dis,\.rpt-fin,\.rpt-tools,\.tp-say\{display:none\}/.test(src),
     '  인쇄본 CSS 가 .tp-say 를 숨긴다 (고객이 받는 종이다)');
  is(/\.tp-chg\b/.test(src) && /\.tp-none\b/.test(src) && /\.tp-prem\b/.test(src),
     '  인쇄본에도 새 칸의 모양이 실려 있다');

  console.log('\n[8] 단서를 빼지 않았는가');
  is(/약관, 보험사 심사에 따라 달라집니다/.test(h), '  약관·심사 단서가 그대로 있다');
  is(/일반적 치료경과 예시/.test(h), '  일반적 예시라고 밝힌다');
  is(errs.length === 0, '  중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 어긋남') : '치료비 지급지도 점검 통과 — 다 맞습니다.');
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
