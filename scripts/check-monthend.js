/* 📅 <b>말일에 날짜가 미끄러지지 않나</b> — 판 X290

   사장님 말씀 (2026-11-02) — 「그럼 <b>매달 1일에 틀리던 수가 또 있는지</b>
   찾아봐」.

   ── 찾아보니 ────────────────────────────────────────────────────────
   1일에 틀리는 수는 <b>못 찾았습니다</b>(1번 — 없으면 없다고 적습니다).
   대신 <b>말일</b>에 틀리는 수를 찾았습니다. setMonth 는 없는 날을 다음
   달로 넘깁니다 — 1월 31일 + 1개월 = 「2월 31일」 → 브라우저가 <b>3월 3일</b>
   로 바꿉니다. 그 함수를 쓰는 두 자리가 <b>고객에게 말하는 날짜</b>였습니다:
     · <b>상령일</b>(보험나이) — 8월 31일생 → 2027-03-03 (바른 것 2027-02-28)
     · <b>날짜 계산기</b> — 면책 종료 · 청약철회 만료 · 갱신일 · 부활 가능일

   ── 여기서 재는 것 ──────────────────────────────────────────────────
     [1] ★★ 생일 <b>365가지</b> 를 다 넣어 상령일이 미끄러지지 않나
     [2] ★ 그 날이 있는 달은 <b>한 글자도 안 바뀌나</b> (헛되이 안 건드리나)
     [3] ★ 날짜 계산기 — 말일 + N개월이 그 달 말일로 멈추나
     [4] ★ 윤년 2월 29일도 맞나
     [5] 「오늘」 을 한 곳에서만 묻나 — 판 X283·X290 의 그 집안 (5번)

   ★ <b>앱의 진짜 함수</b>를 불러 잽니다 — 셈을 여기 베끼면 한쪽만 늙습니다 (5번).
   ★ 바깥으로 한 글자도 안 나갑니다.                                     */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8962;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:' + PORT)) return r.continue();
    if (/^https?:/.test(u)) return r.abort();
    return r.continue();
  });
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof addMonths === 'function' && typeof insAgeOf === 'function',
    { timeout: 60000 });

  head('[1] ★★ 생일 <b>365가지</b> — 상령일이 말일에서 미끄러지지 않는다');
  const R = await pg.evaluate(() => {
    const ymd = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    /* 바라는 것 — 여섯 달 뒤 같은 날. 그 달에 그 날이 없으면 <b>그 달 말일</b>
       (민법 제160조 ③ · 보험사 상령일 관행).                              */
    const 바람 = (y, m0, d, n) => {
      const ty = y + Math.floor((m0 + n) / 12), tm = ((m0 + n) % 12 + 12) % 12;
      const 끝 = new Date(ty, tm + 1, 0).getDate();
      return new Date(ty, tm, Math.min(d, 끝));
    };
    const 어긋 = [], 그대로 = [];
    let 몇 = 0;
    for (let m = 1; m <= 12; m++) {
      const dim = new Date(2026, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        몇++;
        const got = addMonths(new Date(2026, m - 1, d), 6);
        const want = 바람(2026, m - 1, d, 6);
        if (ymd(got) !== ymd(want)) 어긋.push(ymd(new Date(2026, m - 1, d)) + ' → ' + ymd(got) + ' (바른 것 ' + ymd(want) + ')');
        /* 그 날이 있는 달이면 <b>날이 그대로</b>여야 합니다 */
        if (got.getDate() === d) 그대로.push(1);
      }
    }
    /* 실제 화면이 쓰는 함수로도 — 보험나이 셈 */
    const 상령 = (iso) => { const o = insAgeOf(new Date(iso + 'T00:00:00'), new Date('2026-11-02T00:00:00')); return o ? ymd(o.sang) : null; };
    return { 몇, 어긋, 그대로: 그대로.length,
             상령831: 상령('1980-08-31'), 상령1231: 상령('1980-12-31'), 상령615: 상령('1980-06-15') };
  });
  is(R.어긋.length === 0, '  생일 ' + R.몇 + '가지 중 어긋난 것 <b>' + R.어긋.length + '가지</b>' +
     (R.어긋.length ? ' ⚠ ' + R.어긋.slice(0, 4).join(' · ') : ' — 손대기 전에는 7가지였습니다'));
  is(R.상령831 === '2027-02-28',
     '  ★ <b>8월 31일생</b>의 상령일 — ' + R.상령831 + ' (손대기 전 2027-03-03)');
  is(R.상령1231 === '2027-06-30',
     '  ★ <b>12월 31일생</b>의 상령일 — ' + R.상령1231 + ' (손대기 전 2027-07-01)');

  head('[2] ★ 그 날이 있는 달은 <b>한 글자도 안 바뀐다</b> — 헛되이 안 건드린다');
  is(R.그대로 >= 350, '  날이 그대로인 생일 <b>' + R.그대로 + '가지</b> / ' + R.몇 + ' — 바뀌는 것은 미끄러지던 것뿐입니다');
  is(R.상령615 === '1981-12-15' || /-15$/.test(R.상령615 || ''),
     '  6월 15일생은 전과 같다 — ' + R.상령615);

  head('[3] ★ 날짜 계산기 — 말일 + N개월이 <b>그 달 말일에서 멈춘다</b>');
  const C = await pg.evaluate(() => {
    const ymd = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    const go = (iso, n) => ymd(addMonths(new Date(iso + 'T00:00:00'), n));
    return { a: go('2026-01-31', 1), b: go('2026-01-31', 3), c: go('2026-03-31', 1),
             d: go('2026-10-31', 1), e: go('2026-12-31', 6), f: go('2026-01-30', 1),
             평달: go('2026-01-15', 1) };
  });
  is(C.a === '2026-02-28', '  1월 31일 + 1개월 → <b>' + C.a + '</b> (손대기 전 2026-03-03)');
  is(C.b === '2026-04-30', '  1월 31일 + 3개월 → <b>' + C.b + '</b> (손대기 전 2026-05-01)');
  is(C.c === '2026-04-30', '  3월 31일 + 1개월 → <b>' + C.c + '</b>');
  is(C.d === '2026-11-30', '  10월 31일 + 1개월 → <b>' + C.d + '</b>');
  is(C.e === '2027-06-30', '  12월 31일 + 6개월 → <b>' + C.e + '</b>');
  is(C.f === '2026-02-28', '  1월 30일 + 1개월 → <b>' + C.f + '</b>');
  is(C.평달 === '2026-02-15', '  달 가운데는 그대로 — 1월 15일 + 1개월 → ' + C.평달);

  head('[4] ★ 윤년 2월 29일');
  const L = await pg.evaluate(() => {
    const ymd = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    return { 윤에서: ymd(addMonths(new Date(2028, 1, 29), 12)),     /* 2028-02-29 + 12개월 */
             평에서: ymd(addMonths(new Date(2027, 1, 28), 12)) };
  });
  is(L.윤에서 === '2029-02-28', '  2028년 2월 29일 + 12개월 → <b>' + L.윤에서 + '</b> (없는 날을 3월로 안 넘긴다)');
  is(L.평에서 === '2028-02-28', '  2027년 2월 28일 + 12개월 → ' + L.평에서);

  head('[5] 「오늘」 을 <b>한 곳에서만</b> 묻는다 (5번 · 판 X283·X290 의 집안)');
  const APP = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  /* ★ 고친 두 자리가 <b>되돌아오지 않았나</b> — 날글에서 봅니다 */
  const cc = (APP.split('function ccTeamRows(')[1] || '').slice(0, 900);
  const ar = (APP.split('function arCliCalc(')[1] || '').slice(0, 900);
  const 생시계 = /new Date\(\s*Date\.now\(\)\s*\+\s*9\s*\*\s*3600/;
  is(!생시계.test(cc), '  ccTeamRows 가 「이번 달」 을 <b>제 손으로 안 셈한다</b> (판 X283)');
  is(!생시계.test(ar), '  arCliCalc 가 「오늘」 을 <b>제 손으로 안 셈한다</b> (판 X290)');
  is(/addMonths\(/.test(APP) && !/function addMonths\([^)]*\)\{var x=new Date\(d\.getTime\(\)\);x\.setMonth/.test(APP),
     '  addMonths 가 <b>옛 꼴(setMonth 그대로)</b>로 돌아가지 않았다');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 생일 365가지 · 말일 + N개월 · 윤년이 모두 그 달 말일에서 멈춥니다.');
})();
