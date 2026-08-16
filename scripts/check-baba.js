/* 비포 & 애프터 — 회사마다 다르게 쓴 말을 잡아내고, 사람이 고칠 수 있는가.

   여태 이 화면은 통합조회 PDF 한 형식만 읽었다. 비포&애프터에 올리는
   <b>신규 제안서</b>는 회사마다 서식이 달라 못 읽었고, 못 읽은 채로
   원문을 통째로 AI 에게 던졌다. AI 가 숫자를 잘못 보면 그대로 보고서에
   실리고, 고객 앞에서 틀린 금액을 말하게 된다.

   여기서 확인한다.

     1. 금액 표기를 손으로 아는 답과 같게 읽는가 (1억 · 3,000만원 · 원 단위)
     2. 회사마다 다른 담보 이름을 같은 담보로 묶는가
     3. 「유사암진단비」 안의 「암진단비」 를 일반암으로 잘못 집지 않는가
     4. 못 찾은 칸을 0 이 아니라 <b>빈 칸</b>으로 두는가
     5. 사람이 고친 값이 AI 에게 가는 글에 그대로 실리는가          */
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

  console.log('\n[1] 금액을 손으로 아는 답과 같게 읽는가 (만원 단위)');
  const money = await page.evaluate(() => ({
    억:      babaWon('1억원'),
    억만:    babaWon('1억 5,000만원'),
    만:      babaWon('3,000만원'),
    만짧:    babaWon('5000만'),
    천만:    babaWon('2천만원'),
    원:      babaWon('10,000,000원'),
    보험료:  babaWon('128,900원'),
    잔돈:    babaWon('900원'),
    없음:    babaWon('가입금액 —')
  }));
  [['억', 10000, '1억원'], ['억만', 15000, '1억 5,000만원'], ['만', 3000, '3,000만원'],
   ['만짧', 5000, '5000만'], ['천만', 2000, '2천만원'], ['원', 1000, '10,000,000원'],
   ['보험료', 13, '128,900원 → 12.89 → 13']].forEach(([k, want, label]) =>
    is(money[k] === want, '  ' + label + ' = ' + want + '만 · 나온 값 ' + money[k]));
  is(money.잔돈 === 0, '  몇 백원짜리는 금액으로 안 본다');
  is(money.없음 === null, '  숫자가 없으면 0 이 아니라 「모름」 이다');

  console.log('\n[2] 회사마다 다른 이름을 같은 담보로 묶는가');
  const co = await page.evaluate(() => {
    const A = babaScan('일반암진단비 3,000만원 뇌혈관질환진단비 2,000만원 ' +
                       '급성심근경색증진단비 1,500만원 질병수술비 100만원 월보험료 128,900원');
    const B = babaScan('암진단급여금 5,000만원 뇌혈관질환 진단급여금 3,000만원 ' +
                       '허혈성심장질환진단급여금 2,000만원 합계보험료 210,500원');
    const C = babaScan('악성신생물(암)진단비 1억원 뇌졸중진단비 2,000만원 ' +
                       '표적항암약물허가치료비 3,000만원 실손의료비 가입 납입보험료 95,000원');
    return { A, B, C };
  });
  is(co.A.cancer && co.A.cancer.won === 3000, '  A사 「일반암진단비 3,000만원」 → 3,000');
  is(co.A.brain && co.A.brain.won === 2000, '  A사 「뇌혈관질환진단비」 → 2,000');
  is(co.A.mi && co.A.mi.won === 1500, '  A사 「급성심근경색증진단비」 → 1,500');
  is(co.A.fee && co.A.fee.won === 13, '  A사 「월보험료 128,900원」 → 13만');
  is(co.B.cancer && co.B.cancer.won === 5000, '  B사 「암진단급여금 5,000만원」 → 5,000');
  is(co.B.brain && co.B.brain.won === 3000, '  B사 「뇌혈관질환 진단급여금」 → 3,000 (띄어쓰기 달라도)');
  is(co.B.heart && co.B.heart.won === 2000, '  B사 「허혈성심장질환진단급여금」 → 2,000');
  is(co.B.fee && co.B.fee.won === 21, '  B사 「합계보험료 210,500원」 → 21만');
  is(co.C.cancer && co.C.cancer.won === 10000, '  C사 「악성신생물(암)진단비 1억원」 → 10,000');
  is(co.C.stroke && co.C.stroke.won === 2000, '  C사 「뇌졸중진단비」 → 2,000');
  is(co.C.target && co.C.target.won === 3000, '  C사 「표적항암약물허가치료비」 → 3,000');

  console.log('\n[3] 비슷한 이름을 잘못 집지 않는가');
  const trap = await page.evaluate(() => ({
    유사만: babaScan('유사암진단비 600만원'),
    둘다:   babaScan('일반암진단비 4,000만원 유사암진단비 800만원'),
    소액:   babaScan('소액암진단비 500만원')
  }));
  is(!trap.유사만.cancer, '  「유사암진단비」 만 있으면 일반암은 <b>안 잡는다</b>');
  is(trap.유사만.cancer2 && trap.유사만.cancer2.won === 600, '  유사암으로 제대로 잡는다 — 600');
  is(trap.둘다.cancer && trap.둘다.cancer.won === 4000, '  둘 다 있으면 일반암은 4,000');
  is(trap.둘다.cancer2 && trap.둘다.cancer2.won === 800, '  유사암은 800 — 서로 안 섞인다');
  is(!trap.소액.cancer && trap.소액.cancer2, '  「소액암」 도 일반암으로 안 샌다');

  console.log('\n[4] 못 찾은 칸은 0 이 아니라 빈 칸이다');
  const grid = await page.evaluate(() => {
    const B = babaScan('일반암진단비 3,000만원 월보험료 100,000원');
    const A = babaScan('일반암진단비 5,000만원 뇌혈관질환진단비 2,000만원 월보험료 150,000원');
    BABA.rows = BABA_TERMS.map(t => {
      const b = B[t.k] || null, a = A[t.k] || null;
      return { k: t.k, n: t.n, b: b ? b.won : null, a: a ? a.won : null, raw: '' };
    });
    BABA.at = '지금';
    const cancer = BABA.rows.find(r => r.k === 'cancer');
    const brain = BABA.rows.find(r => r.k === 'brain');
    const teeth = BABA.rows.find(r => r.k === 'teeth');
    return { cancerB: cancer.b, cancerA: cancer.a, brainB: brain.b, brainA: brain.a,
             teethB: teeth.b, html: babaGridHtml() };
  });
  is(grid.cancerB === 3000 && grid.cancerA === 5000, '  일반암 기존 3,000 · 신규 5,000');
  is(grid.brainB === null && grid.brainA === 2000, '  기존에 없던 뇌혈관은 기존이 빈 칸, 신규 2,000');
  is(grid.teethB === null, '  아예 안 나온 담보는 빈 칸이다 (0 이 아니다)');
  is(/못 찾음/.test(grid.html), '  화면이 「못 찾음」 이라고 알려 준다');
  is(/보내기 전에 고치세요/.test(grid.html), '  고치라고 말해 준다');
  is(/만원/.test(grid.html), '  단위를 밝힌다');

  console.log('\n[5] 사람이 고친 값이 AI 에게 그대로 간다');
  const brief = await page.evaluate(() => {
    /* 설계사가 뇌혈관 기존값을 손으로 1,000 이라고 적는다 */
    const i = BABA.rows.findIndex(r => r.k === 'brain');
    babaSet(i, 'b', '1,000');
    const before = babaBrief();
    /* 지우면 원문 그대로 보낸다 */
    babaClear();
    return { txt: before, cleared: babaBrief() };
  });
  is(/설계사가 확인한 담보 표/.test(brief.txt), '  「사람이 확인한 표」 라고 못 박는다');
  is(/이 표의 숫자를 그대로 쓴다/.test(brief.txt), '  원문보다 이 표를 쓰라고 시킨다');
  is(/뇌혈관질환 진단비 \| 1000 \| 2000/.test(brief.txt.replace(/\s*\|\s*/g, ' | ')),
     '  손으로 고친 1,000 이 그대로 실린다');
  is(/확인 필요/.test(brief.txt), '  빈 칸은 「확인 필요」 로 나간다 — 지어내지 말라고');
  is(brief.cleared === '', '  표를 지우면 원문 그대로 보낸다');

  console.log('\n[6] 화면에 단추가 붙어 있는가');
  const btn = await page.evaluate(() => {
    const p = PDF_TOOLS.filter(x => x.id === 'baba')[0];
    return { has: !!p, scan: !!(p && p.scan) };
  });
  is(btn.has, '  비포&애프터 카드가 있다');
  const src = require('fs').readFileSync('app/index.html', 'utf8');
  is(/babaRead\(/.test(src) && /먼저 읽어 보기/.test(src), '  「먼저 읽어 보기 · 값 고치기」 단추가 있다');
  is(/babaBrief\(\)/.test(src), '  만들 때 확인한 표를 앞에 붙인다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '비포&애프터 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '비포&애프터 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
