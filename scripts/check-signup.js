/* <b>「회원가입하니까 개인정보동의가 안 되었다고 안 되던데」</b>

   실제로 그랬습니다. 동의 칸이 <b>둘</b>인데 <b>따로</b> 눌러야 했고,
   하나만 빠져도 화면에는 늘 같은 말이 떴습니다 —

     「이용약관과 개인정보 처리에 동의해야 계정을 만들 수 있습니다.」

   <b>어느 쪽이 빠졌는지를 안 알려 줍니다.</b> 이미 하나를 눌러 둔 사람은
   무엇을 더 눌러야 하는지 모르고, 다시 눌러도 또 같은 말이 뜹니다.
   그리고 고쳐서 다시 눌러도 <b>옛 빨간 글이 그대로</b> 남아 또 막힌 줄
   압니다. 가입이 여기서 멈췄습니다.

   ── 동의 자체는 없앨 수 없습니다 ─────────────────────────────────
   개인정보 수집·이용 동의는 <b>법으로 받아야 하는 것</b>입니다. 없애면
   그때부터 받는 모든 정보가 근거가 없습니다. 그래서 없애는 대신
   <b>한 번에 되게</b> 하고, 빠지면 <b>어디가</b> 빠졌는지 짚습니다.

   여기서 지킵니다.
     1. <b>「모두 동의」 한 줄</b>이 있고, 누르면 두 칸이 같이 눌린다
     2. 낱개를 풀면 「모두 동의」도 <b>같이 풀린다</b> — 어긋나 보이지 않게
     3. 빠졌을 때 <b>이름을 대고</b> 말한다 — 「개인정보 수집·이용 동의에
        체크해 주세요」 (둘 다 빠지면 둘 다 댄다)
     4. 빠진 칸을 <b>그 자리에서 짚는다</b> (빨간 표시) · 누르면 풀린다
     5. 고치고 다시 누르면 <b>옛 빨간 글이 지워진다</b>
     6. <b>누구나 가입 신청은 된다</b>고 그 자리에서 알려 준다 —
        승인은 그다음 일이다
     7. 동의를 <b>없애지는 않았다</b> — 두 칸이 그대로 있다 (법적 요건) */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  /* 폰에서 가입하는 사람이 대부분이다 — 폰 폭으로 본다 */
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const R = await page.evaluate(() => {
    const O = {}, F = id => document.getElementById(id);
    /* 서버 모듈을 흉내 낸다 — 없으면 동의 검사 앞에서 끝나 여기까지 못 온다.
       계정 등록은 <b>영영 안 끝나는</b> 약속으로 둔다: 진짜로 만들지 않는다. */
    window.osClient = function () {
      return { auth: { signUp: function () { return new Promise(function () { }); } } };
    };
    osOpenModal();
    F('osTabSignup').click();
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    F('osName').value = '홍길동';
    F('osEmail').value = 'hong@example.com';
    F('osPw').value = 'abcd1234!';

    O.hasAll = !!F('osAgAll');
    O.hasTerms = !!F('osAgTerms');
    O.hasPriv = !!F('osAgPriv');
    O.boxShown = F('osAgreeBox') ? getComputedStyle(F('osAgreeBox')).display !== 'none' : false;

    /* ① 아무것도 안 누르고 */
    osSubmit();
    O.none = F('osErr').textContent;
    O.markNone = [F('osAgTermsL').className, F('osAgPrivL').className];

    /* ② 약관만 누르고 */
    F('osAgTerms').checked = true; osAgSync();
    osSubmit();
    O.onlyTerms = F('osErr').textContent;
    O.markOne = [F('osAgTermsL').className, F('osAgPrivL').className];

    /* ③ 「모두 동의」 한 번 */
    F('osAgTerms').checked = false; F('osAgPriv').checked = false; osAgSync();
    F('osAgAll').checked = true; osAgAllSet(true);
    O.allOne = { terms: F('osAgTerms').checked, priv: F('osAgPriv').checked };
    osSubmit();
    O.afterOk = F('osErr').textContent;
    O.markAfter = [F('osAgTermsL').className, F('osAgPrivL').className];
    O.btn = F('osSubmit') ? F('osSubmit').textContent : '';

    /* ④ 낱개를 풀면 「모두 동의」도 풀리나 */
    F('osAgPriv').checked = false; osAgSync();
    O.allUnticked = F('osAgAll').checked;
    return O;
  });

  console.log('\n[1] 「모두 동의」 한 줄로 끝난다');
  is(R.boxShown, '  계정 등록을 고르면 동의 상자가 <b>보인다</b>');
  is(R.hasAll, '  <b>「모두 동의」</b> 칸이 있다');
  is(R.allOne.terms && R.allOne.priv, '  한 번 누르면 <b>두 칸이 같이</b> 눌린다');

  console.log('\n[2] 낱개를 풀면 「모두 동의」도 같이 풀린다');
  is(R.allUnticked === false, '  어긋나 보이지 않는다');

  console.log('\n[3] 빠졌을 때 이름을 대고 말한다');
  is(/이용약관/.test(R.none) && /개인정보/.test(R.none),
     '  둘 다 빠지면 <b>둘 다</b> 댄다 — 「' + R.none.slice(0, 34) + '…」');
  is(/개인정보/.test(R.onlyTerms) && !/이용약관/.test(R.onlyTerms),
     '  하나만 빠지면 <b>그것만</b> 댄다 — 「' + R.onlyTerms.slice(0, 30) + '…」');

  console.log('\n[4] 빠진 칸을 그 자리에서 짚는다');
  is(R.markNone[0] === 'miss' && R.markNone[1] === 'miss', '  둘 다 빠지면 <b>둘 다</b> 빨갛다');
  is(R.markOne[0] === '' && R.markOne[1] === 'miss',
     '  하나만 빠지면 <b>그 칸만</b> 빨갛다 — ' + JSON.stringify(R.markOne));

  console.log('\n[5] 고치고 다시 누르면 옛 빨간 글이 지워진다');
  is(R.afterOk === '',
     '  <b>지워진다</b> — 안 지우면 체크했는데도 「동의해 주세요」 가 남아 또 막힌 줄 아신다' +
     (R.afterOk ? ' ← 남았습니다: ' + R.afterOk.slice(0, 40) : ''));
  is(R.markAfter[0] === '' && R.markAfter[1] === '', '  빨간 표시도 <b>같이</b> 지워진다');
  is(/처리 중/.test(R.btn), '  단추가 <b>「처리 중…」</b> 으로 넘어간다 — 실제로 신청이 나간다');

  console.log('\n[6] 누구나 가입 신청은 된다고 알려 준다');
  is(/누구나|승인/.test(R.none),
     '  <b>「가입 신청은 누구나 하실 수 있고, 대표 승인 뒤에 열립니다」</b> — 막힌 줄 아시지 않게');

  console.log('\n[7] 동의를 없애지는 않았다 (법적 요건)');
  is(R.hasTerms && R.hasPriv, '  이용약관 · 개인정보 두 칸이 <b>그대로 있다</b>');
  const SRC = fs.readFileSync('app/index.html', 'utf8');
  is(/function osAgMissMsg\(/.test(SRC),
     '  안 누르면 <b>여전히 못 넘어간다</b> — 검사하는 자리가 있다');
  is(/국외 이전/.test(SRC), '  <b>국외 이전</b> 동의도 그대로 받는다');

  console.log('\n[8] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 가입이 동의 칸에서 막힙니다')
                  : '✓ 한 번에 동의되고 · 빠지면 어디가 빠졌는지 짚고 · 동의는 그대로 받습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
