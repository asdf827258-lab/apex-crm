/* 달러 컨설팅 네 걸음 · 교육자금 지원금은 언제 들어오는가.

   ─ 달러
     연금은 「지금 얼마 → 얼마 빈다 → 이렇게 채운다 → 이렇게 달라진다」
     네 걸음으로 설명한다. 달러도 같은 걸음이어야 상담이 한 줄기가 된다.
     숫자는 제안서(5년납) 원문에서 옮긴 것이라 <b>손으로 아는 값</b>과
     같아야 하고, 없는 것(7년납·10년납)은 「자료 없음」으로 비어야 한다.

   ─ 교육자금
     지원금을 총액 한 줄로 적어 두면 그 돈이 지금 통장에 다 있는 것처럼
     쓰인다. 부모급여는 24개월에 나눠 들어오는데 1,800만원을 일시금으로
     잡으면 그 해 낼 수 있는 보험료가 실제보다 크게 잡힌다.
     여기서는 <b>해마다 들어오는 돈</b>을 손으로 푼 답과 맞춰 본다.     */
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
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/finance.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  console.log('\n[1] 달러 컨설팅이 종합보고서 안에 네 걸음으로 있다');
  await page.evaluate(() => switchTab('total', null));
  await page.waitForTimeout(900);
  const d = await page.evaluate(() => {
    const h = document.getElementById('dollar-sim');
    const t = h ? h.textContent.replace(/\s+/g, ' ') : '';
    return { has: !!h, len: t.length, txt: t,
             tags: Array.from((h || document).querySelectorAll('#dollar-sim .card-tag')).map(e => e.textContent.trim()) };
  });
  is(d.has, '종합 재무설계 보고서 안에 달러 칸이 있다');
  is(d.len > 1200, '비어 있지 않다 — ' + d.len + '자');
  ['STEP 1 · NOW', 'STEP 2 · GAP', 'STEP 3 · PLAN', 'STEP 4 · RESULT'].forEach(t =>
    is(d.tags.indexOf(t) >= 0, '  ' + t));

  console.log('\n[2] 제안서 숫자가 그대로 있는가 (5년납)');
  [['37.85%', '5년 납입완료'], ['98.21%', '5년 +1일 유지보너스'], ['124.80%', '10년 +1일'],
   ['154.86%', '종신 40년'], ['122.93%', '저축전환 40년 최저보증'],
   ['271.07%', '저축전환 40년 평균공시 2.5%'], ['577.15%', '저축전환 40년 현재공시 4.3%'],
   ['120.92%', '최저보증 44년 — 내려가는 값']].forEach(([v, n]) =>
    is(d.txt.indexOf(v) >= 0, '  ' + n + ' ' + v));
  is(/177\.92/.test(d.txt), '  월 보험료 $177.92');
  is(/10,675/.test(d.txt), '  5년 납입누계 $10,675');
  is(/21,350/.test(d.txt), '  추가납입 한도 $21,350 (기본의 200%)');

  console.log('\n[3] 없는 것은 없다고 적었는가');
  is(/자료 없음/.test(d.txt), '「자료 없음」 이라고 적혀 있다');
  is(/7년납/.test(d.txt) && /10년납/.test(d.txt), '7년납·10년납을 짚어 준다');
  const madeUp = /7년납[^.]{0,40}\d{2,3}\.\d{2}%|10년납[^.]{0,40}\d{2,3}\.\d{2}%/.test(d.txt);
  is(!madeUp, '7년납·10년납 환급률 숫자를 만들어 내지 않았다');
  is(/최저보증[\s\S]{0,120}내려/.test(d.txt) || /120\.92/.test(d.txt),
     '최저보증이 내려가는 것을 숨기지 않았다');
  is(/비과세/.test(d.txt), '원화환산납입 · 비과세 요건을 적어 두었다');

  console.log('\n[4] 교육자금 — 분할이 그 해에 다 들어오지 않는다');
  await page.evaluate(() => switchTab('edufund', null));
  await page.waitForTimeout(900);
  const e = await page.evaluate(() => {
    /* 손으로 푼 답과 맞추려고 기본 세 제도를 그대로 넣는다 */
    const rows = [
      { name: '첫만남이용권', amount: '200~300만원', pay: '일시금', start: '0' },
      { name: '부모급여',     amount: '1,800만원',  pay: '분할', months: '24',  start: '0' },
      { name: '아동수당',     amount: '1,080만원',  pay: '분할', months: '108', start: '0' }
    ];
    const y = rows.map(r => eduYearly(r));
    const sum = [];
    for (let i = 0; i < 9; i++) sum.push(y.reduce((a, x) => a + x.rows[i], 0));
    return {
      first: y[0].rows, parent: y[1].rows, child: y[2].rows, sum,
      grand: sum.reduce((a, b) => a + b, 0),
      badAmt: eduAmt(''), okAmt: eduAmt('1,800만원'),
      txt: (document.getElementById('tab-edufund') || {}).textContent.replace(/\s+/g, ' ')
    };
  });
  is(e.first[0] === 200 && e.first[1] === 0,
     '일시금은 0세에 한 번 — 첫만남이용권 200만 / 1세 0');
  is(Math.round(e.parent[0]) === 900 && Math.round(e.parent[1]) === 900 && e.parent[2] === 0,
     '부모급여 1,800만을 24개월로 → 0세 900만 · 1세 900만 · 2세 0 (손으로 푼 답과 같다)');
  is(Math.round(e.child[0]) === 120 && Math.round(e.child[8]) === 120,
     '아동수당 1,080만을 108개월로 → 해마다 120만');
  is(Math.round(e.sum[0]) === 1220, '0세에 들어오는 돈 1,220만 (200+900+120)');
  is(Math.round(e.sum[1]) === 1020, '1세에 들어오는 돈 1,020만 (900+120)');
  is(Math.round(e.sum[8]) === 120, '8세에 들어오는 돈 120만');
  is(Math.round(e.grand) === 3080, '만 8세까지 합계 3,080만 — 화면에 적힌 총액과 같다');
  is(e.badAmt === null, '금액을 못 읽으면 0 이 아니라 「모름」 으로 돌려준다');
  is(e.okAmt && e.okAmt.man === 1800, '"1,800만원" 을 1800 으로 읽는다');

  console.log('\n[5] 늘린 항목이 화면에 보이는가');
  [['소득요건', '소득요건'], ['거주기간', '거주기간요건'], ['확인일자', '확인일자'],
   ['출처', '출처'], ['첫째', '출산순위별 금액'], ['분할', '일시금·분할 표시'],
   ['납입재원', '분할을 일시금으로 잡으면 부풀려진다는 경고']].forEach(([v, n]) =>
    is(e.txt.indexOf(v) >= 0, '  ' + n));
  is(/자료 없음/.test(e.txt) || /소득무관/.test(e.txt), '빈 칸은 「자료 없음」 으로 나간다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '달러·교육자금 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '달러·교육자금 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
