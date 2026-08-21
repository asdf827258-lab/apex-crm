/* 은퇴 후 현금흐름 — 주택연금과 퇴직금.

   전에는 두 줄이었다.
     housingPension = (realty/10000)*23
     sevPension     = severance/240

   주택연금이 <b>가입 나이를 안 봤다.</b> 55세든 70세든 10억이면 똑같이
   월 230만원. 실제 월지급금은 나이에 따라 세 배까지 벌어진다. 55세
   고객에게 70만원을 부풀려 말하고 있었고, 그 숫자로 「연금 충분합니다」
   가 나오면 상담이 통째로 뒤집힌다.

   가입 요건도 없었다. 30억을 넣으면 월 690만원이 그냥 나왔다.

   퇴직금은 이 화면에서 혼자만 이율 0% 였다.

   여기서 확인한다.

     1. 나이가 오르면 월지급금도 오르는가 (표대로)
     2. 표에 없는 나이도 이어서 계산하는가
     3. 가입 상한을 넘으면 상한까지만 잡고 그 사실을 말하는가
     4. 만 55세 미만은 셈에 안 넣고 그 사실을 말하는가
     5. 퇴직금이 이 화면의 다른 계산과 같은 가정을 쓰는가
     6. 근거(공시 기준·시점)를 화면에 적는가                          */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8877;

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);
const near = (a, b, tol, m) => is(Math.abs(a - b) <= tol, m + ' — 나온 값 ' + a + ' / 손으로 푼 답 ' + b);

(async () => {
  const fin = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');

  console.log('\n[1] 옛 셈이 남아 있지 않은가');
  /* 주석에는 옛 셈이 「전에는 이랬다」로 남아 있다. 실제로 값을 넣는
     자리만 본다 — 주석까지 걸면 기록을 못 남긴다. */
  is(!/housingPension *= *Math\.round\(\(realty/.test(fin),
    '나이를 안 보던 1억당 23만원 고정값이 사라졌다');
  is(!/sevPension *= *Math\.round\(severance\/240\)/.test(fin),
    '퇴직금을 그냥 240으로 나누던 줄이 사라졌다');
  is(/housingPension *= *housePen\.man/.test(fin) && /sevPension *= *sevPensionOf\(/.test(fin),
    '두 자리 모두 새 함수를 부른다 — 한 곳만 고치면 화면끼리 달라진다');
  is(/var HOUSE_PEN *= *\{/.test(fin), '주택연금 기준표가 한 곳에 모였다');
  is(/asOf:/.test(fin) && /base:/.test(fin), '언제 · 무엇을 기준으로 한 표인지 적어 뒀다');
  is(/공사가 해마다 다시 고시한다/.test(fin), '해마다 다시 고시된다고 코드에 밝혀 뒀다');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + PORT + '/app/finance.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2000);

  const R = await page.evaluate(() => ({
    tbl: HOUSE_PEN.per,
    minAge: HOUSE_PEN.minAge,
    capMan: HOUSE_PEN.capMan,
    months: SEV_MONTHS,
    /* 10억 주택을 나이별로 */
    byAge: [50, 55, 57, 60, 65, 70, 75, 80, 85].map(a => {
      const h = housePension(100000, a);
      /* 칸 이름이 won 이던 시절 만원을 담고 있어 이름이 거짓말을 했다.
         이제 man 이다 — 여기서도 그 이름으로 받는다. */
      return { age: a, man: h.man, per: h.per, young: h.young, over: h.over };
    }),
    cap12: housePension(120000, 60),
    cap30: housePension(300000, 60),
    zero: housePension(0, 60),
    sev: { r0: sevPensionOf(10000, 0), r4: sevPensionOf(10000, 4), r5: sevPensionOf(10000, 5), none: sevPensionOf(0, 5) }
  }));
  const at = a => R.byAge.filter(x => x.age === a)[0];

  console.log('\n[2] 나이를 보는가 — 이게 핵심이다');
  is(at(55).man !== at(70).man, '55세와 70세가 <b>다른 금액</b>이다 (전에는 같았다)');
  is(at(55).man < at(60).man && at(60).man < at(65).man && at(65).man < at(70).man
    && at(70).man < at(75).man && at(75).man < at(80).man,
    '나이가 오르면 월지급금도 오른다 — 55→80세 ' +
    R.byAge.filter(x => x.age >= 55 && x.age <= 80).map(x => x.man).join(' → '));
  is(at(80).man >= at(55).man * 3, '80세가 55세의 세 배 넘는다 (' +
    at(55).man + ' → ' + at(80).man + '만원) — 이 차이를 뭉개면 안 된다');

  /* 표 값을 그대로 쓰는지 손으로 대조한다. 10억 = 10 × (1억당 월지급금) */
  console.log('\n[3] 표대로 계산하는가 (10억 주택)');
  R.tbl.forEach(row => {
    const a = row[0], per = row[1];
    const h = R.byAge.filter(x => x.age === a)[0];
    if (!h) return;
    near(h.man, Math.round(10 * per), 1, a + '세 — 1억당 ' + per + '만원 × 10억');
  });

  console.log('\n[4] 표에 없는 나이도 이어서 보는가');
  /* 57세는 55(16.0)과 60(21.3) 사이 = 16.0 + (21.3-16.0)*(2/5) = 18.12 → 10억이면 181만원 */
  near(at(57).man, 181, 2, '57세는 55세와 60세를 이어서 잡는다');
  is(at(57).man > at(55).man && at(57).man < at(60).man, '이은 값이 양옆 사이에 있다');
  near(at(85).man, at(80).man, 0, '표 끝을 넘는 나이는 끝 값으로 묶는다 (85세 = 80세)');

  console.log('\n[5] 가입 요건을 지키는가');
  is(R.cap30.over === true, '상한을 넘으면 넘었다고 알린다');
  near(R.cap30.man, R.cap12.man, 0, '30억이어도 상한(12억)까지만 잡는다 — 690만원이 안 나온다');
  is(R.cap30.man < 300, '30억일 때 월 ' + R.cap30.man + '만원 — 전에는 690만원이었다');
  is(R.cap12.over === false, '상한 딱 맞으면 경고하지 않는다');
  is(at(50).young === true && at(50).man === 0,
    '만 ' + R.minAge + '세 미만은 셈에 아예 안 넣는다 (50세 → ' + at(50).man + '만원)');
  is(at(55).young === false && at(55).man > 0, '만 55세부터는 셈에 넣는다');
  is(R.zero.man === 0 && R.zero.young === false && R.zero.over === false,
    '부동산이 없으면 조용히 0 이다 — 헛경고를 안 한다');

  console.log('\n[6] 화면이 사정을 말하는가');
  is(/만 \$\{HOUSE_PEN\.minAge\}세부터 가입/.test(fin), '나이가 안 되면 그 이유를 화면에 적는다');
  is(/가입 상한\(\$\{fmt\(HOUSE_PEN\.capMan\)\}만원\)/.test(fin), '상한을 넘으면 얼마가 상한인지 적는다');
  is(/공시\)/.test(fin) && /1억당 월 \$\{housePen\.per\.toFixed\(1\)\}만원/.test(fin),
    '몇 세 기준 · 1억당 얼마인지를 표에 적는다');
  is(/확정 금액으로 말씀하지 마시고/.test(fin), '상담에서 확정 금액처럼 말하지 말라고 밝힌다');
  is(/투자용을 포함한 총액이라 실제 대상 주택과 다를 수 있습니다/.test(fin),
    '여기 쓰인 부동산이 총액이라는 한계를 밝힌다');

  console.log('\n[7] 퇴직금이 같은 가정을 쓰는가');
  is(R.months === 240, '20년(240개월) 동안 나눠 받는다');
  near(R.sev.r0, 42, 1, '이율 0%면 예전처럼 단순히 나눈다 (1억 ÷ 240)');
  /* PMT = PV·r / (1-(1+r)^-n), r=0.04/12, n=240 → 60.6만원 */
  near(R.sev.r4, 61, 1, '연 4%면 남은 돈을 굴려 월 61만원 (손으로 푼 PMT)');
  near(R.sev.r5, 66, 1, '연 5%면 월 66만원');
  is(R.sev.r4 > R.sev.r0, '이자를 붙이니 예전보다 늘었다 — 다른 계산과 가정이 맞는다');
  is(R.sev.none === 0, '퇴직금이 없으면 0 이다');
  is(/연 \$\{retRate\}% 운용 가정/.test(fin), '몇 %로 굴린 값인지 화면에 적는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();

  /* ── [8] 연금 엔진 전수 검사 ─────────────────────────────────
     돈이 걸린 숫자라 화면 몇 개 눌러 보는 것으로는 부족하다. 상품 × 성별 ×
     나이 × 개시나이 × 납입기간 × 월납을 전부 돌려 음수·NaN 이 하나라도
     나오는지 본다.

     실제로 이런 게 있었다 — 납입기간이 보험기간보다 길면 거치기간(D)이
     음수가 되어 거치이자를 빼 버렸다. 40세가 55세 개시로 20년납을 넣으면
     거치이자가 -2,880만으로 찍혔고, 그 숫자가 그대로 고객 앞 화면에 갔다.
     13,440 조합 중 3,432 개(26%)가 그랬다.                              */
  console.log('\n[8] 연금 엔진 — 모든 조합에서 숫자가 성립하는가');
  {
    const src = fs.readFileSync(path.join(ROOT, 'app/pension-engine.js'), 'utf8');
    const w = {}; new Function('window', src)(w);
    const P = w.PENSION;
    is(!!(P && P.products && P.products.length), '연금 엔진을 읽었다 (' +
      ((P && P.products) ? P.products.length : 0) + '상품)');
    let n = 0, neg = 0, nan = 0, boom = 0, first = '';
    for (const p0 of P.products)
      for (const sex of ['남', '여'])
        for (const age of [25, 30, 35, 40, 45, 50, 55])
          for (const start of [55, 60, 65, 70])
            for (const pay of [5, 7, 10, 12, 15, 20])
              for (const monthly of [30, 50, 100, 200]) {
                n++;
                let r;
                try { r = P.calc(p0, { sex, age, start, pay, monthly }); }
                catch (e) { boom++; if (!first) first = '터짐 ' + [p0.name, sex, age, start, pay, monthly]; continue; }
                const j = JSON.stringify(r);
                if (/NaN|Infinity/.test(j)) { nan++; if (!first) first = 'NaN ' + [p0.name, sex, age, start, pay, monthly]; continue; }
                /* D(거치기간)는 음수가 나올 수 있는 값이라 뺀다 — 나머지 돈 항목만 본다 */
                const bad = Object.entries(r).filter(([k, v]) => typeof v === 'number' && v < 0 && k !== 'D');
                if (bad.length) { neg++; if (!first) first = '음수 ' + [p0.name, sex, age, start, pay, monthly] + ' :: ' + bad.map(x => x[0] + '=' + Math.round(x[1])).join(','); }
              }
    is(boom === 0, n + '가지 조합에서 계산이 터지지 않는다' + (boom ? ' — ' + boom + '건 · ' + first : ''));
    is(nan === 0, '값이 NaN·무한대로 새지 않는다' + (nan ? ' — ' + nan + '건 · ' + first : ''));
    is(neg === 0, '돈 항목에 음수가 없다' + (neg ? ' — ' + neg + '건 · ' + first : ''));

    /* 납입기간 > 보험기간 조합은 애초에 고를 수 없어야 한다 */
    const shown = P.eligible(40, 55, 20);
    is(shown.length === 0, '납입기간이 보험기간보다 길면 고를 수 있는 상품이 없다 (40세·55세개시·20년납 → ' + shown.length + '개)');
  }
  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '연금 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '연금 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
