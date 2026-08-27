/* <b>보장분석이 옆 칸을 삼키지 않는가 · 번호를 금액으로 안 읽는가.</b>

   ※ 계약 건수·회사별·특약 계열은 <b>check-insread.js</b> 가 본다.
     여기는 그 위에 얹는 것만 본다 — 이름이 겹치지 않게 나눠 두었다.

   비포&애프터에서 「한 금액을 두 담보가 나눠 가짐」·「증권번호를 금액으로」
   를 잡고 나서, 보장분석도 같은 눈으로 훑었습니다. 세 자리가 나왔습니다.

   ① <b>담보진단 표에서 옆 칸 번호를 금액에 삼켰습니다.</b>
      금액 덩어리를 `(?:[\d,]+\s*[억만천]?\s*)+` 로 잡아, 숫자가 이어지는
      만큼 먹었습니다. 보장분석표는 칸이 많아 바로 옆에 번호가 붙습니다.
        … 권장 5,000만 <b>3</b> 가입 3,000만 <b>2</b> 부족 -2,000만
      → 「권장 5,000만 3」·「가입 3,000만 2」 로 읽혀 그 글자가 그대로
      화면과 AI 리포트에 실렸습니다.

   ② <b>머리글 보험료를 아무 콤마 숫자에서나 집었습니다.</b>
      앞 300자에서 <b>처음 나오는</b> 콤마 숫자를 썼습니다.
        「증권번호 2024-1,234 …」 → 보험료 <b>1,234원</b>
        「고객번호 12,345,678 …」 → 보험료 <b>12,345,678원</b>
      정작 건수는 자리로 찾느라 <b>거의 언제나 0</b> 이었습니다 —
      「문서 머리글은 N건인데 M건을 읽었습니다」 경고가 뜬 적이 없습니다.
      안 울리는 알람은 알람이 아닙니다 (CLAUDE.md 8번).

   ③ <b>콤마 없는 긴 숫자에 「원」 이 붙으면 금액으로 받았습니다.</b>
      「12683400원」 은 표에서 옆 칸이 붙어 버린 숫자입니다.

   여기서 확인합니다.
     1. 칸 사이에 번호가 껴도 <b>제 값</b>으로 읽는가
     2. 머리글을 <b>이름표를 보고</b> 찾는가 — 없으면 0(대조 건너뜀)인가
     3. 붙어 버린 숫자를 <b>금액으로 안 받는가</b> — 진짜 금액은 그대로인가
     4. 보장분석표 한 부를 <b>끝까지</b> 읽는가
     5. <b>헛알람이 없는가</b>                                       */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 언제나 홍길동 — 실제 고객 이름을 쓰지 않는다 (CLAUDE.md 3번) */
const DOC =
  '홍길동 님의 전체 계약리스트\n' +
  '증권번호 2024-1,234 계약 건수 3건 합계보험료 1,250,000원\n' +
  '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 500,000 원\n' +
  '2 정상 현대해상 무배당 안심건강보험 2019-05-10 월납 15 년 90 세 450,000 원\n' +
  '3 정상 KB손해보험 무배당 행복보장보험 2020-07-21 월납 10 년 80 세 300,000 원\n' +
  '홍길동 님의 담보별 진단현황\n' +
  '암 진단 일반암진단비 권장 5,000만 1 가입 3,000만 1 부족 -2,000만\n' +
  '뇌/심장 진단 뇌혈관질환진단비 권장 3,000만 2 가입 1억 6,000만 2 과다 +1억 3,000만\n' +
  '실손의료비 질병입원의료비 권장 5,000만 3 가입 5,000만 3 충분 -\n' +
  '홍길동 님의 상품별 가입담보상세\n' +
  '삼성화재 | 가입일자 : 2018-03-01 | 무배당 튼튼종합보험 1 정액 일반암진단비 3,000만 ' +
  '2 정액 뇌혈관질환진단비 2,000만 3 실손 질병입원의료비 5,000만\n' +
  '현대해상 | 가입일자 : 2019-05-10 | 무배당 안심건강보험 1 정액 일반암진단비 2,000만 ' +
  '2 정액 교통사고처리지원금 1억\n';

const JUNK = '오늘 회의에서 3분기 매출을 검토했습니다. 담당자는 다음 주까지 자료를 정리해 ' +
  '제출하기로 했습니다. 참석자는 여덟 명이었고 다음 회의 장소는 같은 곳입니다.';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 칸 사이에 번호가 껴도 제 값으로 읽는다');
  const d = await page.evaluate(() => {
    const one = t => insDiags(t).map(x => x.name + '|' + x.want + '|' + x.have + '|' + x.gap);
    return {
      plain: one('암 진단 일반암진단비 권장 5,000만 가입 3,000만 부족 -2,000만'),
      col: one('암 진단 일반암진단비 권장 5,000만 3 가입 3,000만 2 부족 -2,000만 1'),
      two: one('일반암진단비 권장 5,000만 가입 3,000만 2,000 부족 -2,000만'),
      uk: one('뇌/심장 진단 뇌혈관질환진단비 권장 3,000만 가입 1억 6,000만 과다 +1억 3,000만')
    };
  });
  is(d.plain[0] === '일반암진단비|5,000만|3,000만|-2,000만', '  칸이 깨끗할 때 — ' + (d.plain[0] || '(못 읽음)'));
  is(d.col[0] === '일반암진단비|5,000만|3,000만|-2,000만',
     '  번호 열이 껴도 <b>같은 값</b> — ' + (d.col[0] || '(못 읽음)'));
  is(d.two[0] === '일반암진단비|5,000만|3,000만|-2,000만',
     '  옆 칸 숫자를 <b>안 삼킨다</b> — ' + (d.two[0] || '(못 읽음)'));
  is(d.uk[0] === '뇌혈관질환진단비|3,000만|1억 6,000만|+1억 3,000만',
     '  「1억 6,000만」 은 <b>한 덩어리로</b> 읽는다 — ' + (d.uk[0] || '(못 읽음)'));

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 머리글은 이름표를 보고 찾는다');
  const h = await page.evaluate(() => ({
    good: insHead('증권번호 2024-1,234 계약 건수 3건 합계보험료 1,250,000원'),
    cust: insHead('고객번호 12,345,678 계약 3건 월 보험료 1,250,000원'),
    none: insHead('3 1,250,000 계약'),
    plain: insHead('계약 5건 합계보험료 980,000원'),
    /* 실제 보장분석표 머리글 — 이름표 없이 숫자만 늘어놓는다 */
    pos: insHead(' 6 0 1 5 0 472,797 2026-07-27 13:15:55 ※ 기준담보')
  }));
  is(h.good.n === 3 && h.good.fee === 1250000,
     '  이름표가 있으면 <b>제 값</b> — 건수 ' + h.good.n + ' · 보험료 ' + h.good.fee.toLocaleString());
  is(h.cust.fee === 1250000,
     '  <b>고객번호 12,345,678</b> 을 보험료로 안 집는다 — ' + h.cust.fee.toLocaleString());
  is(h.none.n === 0 && h.none.fee === 0,
     '  이름표가 없으면 <b>0</b> — 대조를 건너뛴다 (지어내지 않는다)');
  is(h.plain.n === 5 && h.plain.fee === 980000, '  흔한 꼴도 읽는다 — 5건 · 980,000원');
  is(h.pos.n === 6 && h.pos.fee === 472797,
     '  이름표 없이 <b>숫자만 늘어놓는</b> 실제 서식도 읽는다 — ' + h.pos.n + '건 · ' + h.pos.fee.toLocaleString());

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 붙어 버린 숫자를 금액으로 안 받는다');
  const a = await page.evaluate(() => ({
    bad7: insAmtOk('12683400원'), bad8: insAmtOk('20240827원'),
    ok1: insAmtOk('3,000만'), ok2: insAmtOk('1억 6,000만'),
    ok3: insAmtOk('12,683,400원'), ok4: insAmtOk('3000만'), ok5: insAmtOk('50,000원'),
    rows: insLooseRows('일반암진단비 12683400원 뇌혈관질환진단비 2,000만')
      .map(x => x.name + '=' + x.amount + '/원문=' + (x.raw || '') + '/bad=' + (x.bad || 0)),
    /* 「상품별 가입담보상세」 칸을 읽는 길은 <b>따로</b>다 — 거기도 같은지 본다 */
    rider: (insRiders('삼성화재 | 가입일자 : 2018-03-01 | 무배당 튼튼종합보험 ' +
      '1 정액 일반암진단비 12683400원 2 정액 뇌혈관질환진단비 2,000만 ')[0] || { rows: [] })
      .rows.map(x => x.name + '=' + x.amount + '/원문=' + (x.raw || '') + '/bad=' + (x.bad || 0))
  }));
  is(!a.bad7 && !a.bad8, '  콤마 없는 <b>일곱 자리 넘는 원</b> 은 안 받는다');
  is(a.ok1 && a.ok2 && a.ok3 && a.ok4 && a.ok5,
     '  「3,000만」·「1억 6,000만」·「12,683,400원」·「3000만」·「50,000원」 은 <b>그대로</b>');
  /* 예전에는 이런 줄을 <b>통째로 버렸다.</b> 그러면 담보 이름까지 사라져
     「비급여 암주요치료비 ✕ 없음」 같은 <b>틀린 결론</b>이 고객 앞에 선다.
     이제 금액만 비우고 원문을 남긴다 — 담보는 남고, 그 자리에서 고친다. */
  is(a.rows.length === 2 &&
     a.rows[0] === '일반암진단비=/원문=12683400원/bad=1' &&
     a.rows[1] === '뇌혈관질환진단비=2,000만/원문=2,000만/bad=0',
     '  느슨읽기 — <b>담보는 남고 금액만 빈다</b> · 원문이 남는다 — ' + (a.rows.join(' · ') || '(없음)'));
  is(a.rider.length === 2 &&
     a.rider[0] === '일반암진단비=/원문=12683400원/bad=1' &&
     a.rider[1] === '뇌혈관질환진단비=2,000만/원문=2,000만/bad=0',
     '  <b>상품별 가입담보상세</b>도 같다 — ' + (a.rider.join(' · ') || '(없음)'));

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 보장분석표 한 부를 끝까지 읽는다');
  const sc = await page.evaluate((doc) => {
    const s = insScan(doc);
    if (!s) return null;
    return { n: s.total.n, fee: s.total.fee, saidN: s.total.saidN, saidFee: s.total.saidFee,
             co: s.byCo.length, diags: s.diags.length, riderN: s.riderN,
             riders: (s.riders || []).length, drop: s.drop.n,
             have: s.diags.map(x => x.have) };
  }, DOC);
  is(sc && sc.n === 3 && sc.fee === 1250000,
     '  계약 <b>3건</b> · 월 보험료 1,250,000원 — ' + (sc ? sc.n + '건 ' + sc.fee.toLocaleString() : '(못 읽음)'));
  is(sc && sc.saidN === 3 && sc.saidFee === 1250000,
     '  머리글이 말한 값과 <b>대조가 된다</b> — ' + (sc ? sc.saidN + '건 ' + sc.saidFee.toLocaleString() : '-'));
  is(sc && sc.diags === 3 && sc.have.join(' ') === '3,000만 1억 6,000만 5,000만',
     '  담보진단 3줄을 <b>제 값으로</b> — ' + (sc ? sc.have.join(' · ') : '-'));
  is(sc && sc.riders === 2 && sc.riderN === 5,
     '  상품별 담보 <b>2상품 5개</b> — ' + (sc ? sc.riders + '상품 ' + sc.riderN + '개' : '-'));
  is(sc && sc.drop === 0, '  버린 계약 줄이 없다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 헛알람이 없다');
  const j = await page.evaluate((t) => {
    const s = insScan(t);
    return { scan: !!s, diags: insDiags(t).length, rows: insLooseRows(t).length,
             head: insHead(t) };
  }, JUNK);
  is(j.diags === 0 && j.rows === 0, '  보험 아닌 글에서 담보를 안 만든다');
  is(j.head.n === 0 && j.head.fee === 0, '  머리글도 <b>0</b> 이다 — 「여덟 명」 을 건수로 안 본다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 보장분석이 담보를 잘못 읽고 있습니다')
                  : '✓ 옆 칸을 안 삼키고, 번호를 금액으로 안 읽고, 머리글을 이름표로 찾습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
