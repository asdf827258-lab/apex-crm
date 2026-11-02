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
     [1] ★★ 생일 <b>366가지</b>(윤년) 를 다 넣어 상령일이 미끄러지지 않나
         ⚠ 판 X290 에서는 <b>365가지</b>(2026년 · 평년)만 넣었습니다 — 그래서
         <b>2월 29일생이 한 번도 안 들어갔고</b>, 판 X292 에서 라이브를 손으로
         훑다 찾았습니다. insAgeOf 는 addMonths 로 여섯 달을 더하기 <b>전에</b>
         「그 해의 생일」 을 날글로 다시 짓고 있었고(new Date(해,달,날)),
         2월 29일생의 2026년 생일이 <b>3월 1일</b> 이 되어 상령일이 나흘
         늦었습니다(2027-09-01 · 바른 것 2027-08-28). 자가 못 보던 자리입니다 (8번).
     [1-나] ★★ 2월 29일생 — 상령일 · 만나이가 평년 2월 28일에 오르나
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

  head('[1] ★★ 생일 <b>366가지</b>(윤년 2028) — 상령일이 말일에서 미끄러지지 않는다');
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
    /* ★ 판 X292 — <b>윤년(2028)</b> 으로 돌립니다. 2026 으로 돌면 2월 29일이
       아예 안 들어가, 어제 이 자는 그 생일을 한 번도 안 봤습니다. */
    const Y = 2028;
    for (let m = 1; m <= 12; m++) {
      const dim = new Date(Y, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        몇++;
        const got = addMonths(new Date(Y, m - 1, d), 6);
        const want = 바람(Y, m - 1, d, 6);
        if (ymd(got) !== ymd(want)) 어긋.push(ymd(new Date(Y, m - 1, d)) + ' → ' + ymd(got) + ' (바른 것 ' + ymd(want) + ')');
        /* 그 날이 있는 달이면 <b>날이 그대로</b>여야 합니다 */
        if (got.getDate() === d) 그대로.push(1);
      }
    }
    /* 실제 화면이 쓰는 함수로도 — 보험나이 셈 */
    const 상령 = (iso) => { const o = insAgeOf(new Date(iso + 'T00:00:00'), new Date('2026-11-02T00:00:00')); return o ? ymd(o.sang) : null; };
    /* ★ 판 X292 — 2월 29일생. 만나이가 <b>평년 2월 28일</b>에 오르나.
       바른 기준: 그 해에 그 날이 없으면 그 달 말일 (민법 제160조 ③). */
    const 나이 = (iso, refIso) => { const o = insAgeOf(new Date(iso + 'T00:00:00'), new Date(refIso + 'T00:00:00')); return o ? o.age : null; };
    /* 366가지 생일 × 기준일 넷 — 만나이를 <b>따로 센 것</b>과 견준다 */
    const 따로 = (b, ref) => { let a = ref.getFullYear() - b.getFullYear();
      const m = b.getMonth(), 끝 = new Date(ref.getFullYear(), m + 1, 0).getDate();
      const bd = new Date(ref.getFullYear(), m, Math.min(b.getDate(), 끝));
      if (ref < bd) a--; return a; };
    const 나이어긋 = [];
    ['2026-11-02', '2026-02-28', '2027-03-01', '2028-02-29'].forEach(ri => {
      const ref = new Date(ri + 'T00:00:00');
      for (let m = 1; m <= 12; m++) { const dim = new Date(2028, m, 0).getDate();
        for (let d = 1; d <= dim; d++) { const b = new Date(1988, m - 1, d);
          const o = insAgeOf(b, ref); if (!o) continue;
          if (o.age !== 따로(b, ref)) 나이어긋.push(ri + ' / ' + ymd(b) + ' → ' + o.age + ' (따로 센 것 ' + 따로(b, ref) + ')'); } }
    });
    return { 몇, 어긋, 그대로: 그대로.length, 나이어긋,
             상령831: 상령('1980-08-31'), 상령1231: 상령('1980-12-31'), 상령615: 상령('1980-06-15'),
             상령229: 상령('2000-02-29'), 상령228: 상령('2000-02-28'),
             나이227: 나이('2000-02-29', '2026-02-27'),
             나이228: 나이('2000-02-29', '2026-02-28'),
             나이301: 나이('2000-02-29', '2026-03-01') };
  });
  is(R.어긋.length === 0, '  생일 ' + R.몇 + '가지 중 어긋난 것 <b>' + R.어긋.length + '가지</b>' +
     (R.어긋.length ? ' ⚠ ' + R.어긋.slice(0, 4).join(' · ') : ' — 손대기 전에는 7가지였습니다'));
  is(R.상령831 === '2027-02-28',
     '  ★ <b>8월 31일생</b>의 상령일 — ' + R.상령831 + ' (손대기 전 2027-03-03)');
  is(R.상령1231 === '2027-06-30',
     '  ★ <b>12월 31일생</b>의 상령일 — ' + R.상령1231 + ' (손대기 전 2027-07-01)');
  is(R.몇 === 366, '  생일을 <b>366가지</b> 다 넣었다 — ' + R.몇 + '가지 (판 X290 은 365가지였고 2월 29일생이 빠졌습니다)');

  head('[1-나] ★★ <b>2월 29일생</b> — 평년에는 2월 28일이 생일입니다 (민법 제160조 ③)');
  is(R.상령229 === '2027-08-28',
     '  ★★ <b>2월 29일생</b>의 상령일 — ' + R.상령229 + ' (손대기 전 2027-09-01 · 나흘 늦었습니다)');
  is(R.상령229 === R.상령228,
     '  ★ 2월 28일생과 <b>같은 날</b>이다 — ' + R.상령229 + ' / ' + R.상령228 + ' (하루 차이로 태어나 나흘이 갈리지 않는다)');
  is(R.나이227 === 25 && R.나이228 === 26 && R.나이301 === 26,
     '  ★★ 만나이가 <b>2월 28일에 오른다</b> — 2/27 ' + R.나이227 + '세 · 2/28 ' + R.나이228 + '세 · 3/1 ' + R.나이301 + '세 (손대기 전 2/28 에도 25세)');
  is(R.나이어긋.length === 0,
     '  ★ 생일 366가지 × 기준일 넷(1,464번) 모두 <b>따로 센 만나이와 같다</b>' +
     (R.나이어긋.length ? ' ⚠ ' + R.나이어긋.slice(0, 4).join(' · ') : ''));

  head('[2] ★ 그 날이 있는 달은 <b>한 글자도 안 바뀐다</b> — 헛되이 안 건드린다');
  is(R.그대로 >= 350, '  날이 그대로인 생일 <b>' + R.그대로 + '가지</b> / ' + R.몇 + ' — 바뀌는 것은 미끄러지던 것뿐입니다');
  /* ⚠ 처음에 여기에 <b>1981-12-15</b> 라고 적어 두었습니다 — 말이 안 되는
     값입니다. 상령일은 <b>기준일의 해</b>를 보고 짓습니다(기준일 2026-11-02
     이면 2026-06-15 + 6개월 = 2026-12-15). 느슨한 「-15 로 끝나면 통과」 를
     곁들여 둬서 자가 안 울었고, 라이브 자가 그제야 잡았습니다 (8번). */
  is(R.상령615 === '2026-12-15',
     '  6월 15일생은 전과 같다 — <b>' + R.상령615 + '</b> (기준일 2026-11-02 뒤 첫 「생일+6개월」)');

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

  head('[6] ★ 판 X292 — <b>말일을 셈하는 자리가 한 곳</b>인가 (5번)');
  is(/function monDay\(/.test(APP) && /function bdayIn\(/.test(APP),
     '  monDay(그 달 말일) · bdayIn(그 해의 생일) 두 자리가 <b>있다</b>');
  const ia = (APP.split('function insAgeOf(')[1] || '').slice(0, 1200);
  is(!/new Date\(\s*ref\.getFullYear\(\)[^,]*,\s*b\.getMonth\(\)/.test(ia),
     '  ★★ insAgeOf 가 생일을 <b>날글로 다시 짓지 않는다</b> — bdayIn 에게 묻는다 (이 줄이 2월 29일생을 틀리게 했습니다)');
  is((ia.match(/bdayIn\(/g) || []).length >= 4,
     '  insAgeOf 안에서 bdayIn 을 <b>네 번</b> 부른다 — ' + (ia.match(/bdayIn\(/g) || []).length + '번');

  head('[7] ★ 설정 화면이 <b>베껴 둔 서버 코드</b>에도 같은 버그가 없나 (5번)');
  const fn = (APP.split('var TOSS_FN_CODE=[')[1] || '').split('];')[0];
  is(fn.length > 100, '  TOSS_FN_CODE 를 찾았다 — ' + fn.length + '자');
  is(!/setMonth\(/.test(fn),
     '  ★★ 베껴 둔 코드에 <b>setMonth 가 없다</b> — 사장님이 그것을 복사해 넣으면 판 X291 이 되돌아갑니다');
  is(/Math\.min\(/.test(fn) && /getDate\(\)/.test(fn),
     '  베껴 둔 코드도 <b>말일에서 멈춘다</b>');
  is(/\uc9c4\uc9dc \ud30c\uc77c\uc740|netlify\/functions\/toss-confirm\.js/.test(fn),
     '  베껴 둔 글이 <b>진짜 파일이 어디인지</b> 말한다 (1번 — 두 벌임을 숨기지 않는다)');

  head('[8] ★ 판 X292 — 다른 파일의 같은 자리 (날글로)');
  const JG = fs.readFileSync(path.join(ROOT, 'app', 'jiin-grow.html'), 'utf8');
  const s3 = (JG.split('const sb3y=')[1] || '').slice(0, 400);
  is(s3.length > 20, '  지인 — sb3y(실손 청구 소멸시효 3년)를 찾았다');
  is(!/setFullYear\(/.test(s3),
     '  ★★ sb3y 가 <b>setFullYear 로 안 넘긴다</b> — 2월 29일 진료의 마감일이 하루 늦게 찍혔습니다');
  is(/Math\.min\(/.test(s3), '  sb3y 도 <b>말일에서 멈춘다</b>');
  const MS = fs.readFileSync(path.join(ROOT, 'app', '\uc0c1\ub2f4\uc790\ub8cc', '\uba54\uc778 \uc0c1\ub2f4\uc790\ub8cc.html'), 'utf8');
  const 날글 = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const 맨 = 날글(MS);
  is(!/new Date\([^)]*getMonth\(\)\s*-\s*3\s*,\s*_now\.getDate\(\)\s*\)/.test(맨),
     '  ★★ 상담자료 — AI 에게 적어 보내는 <b>「최근 3개월」 경계</b>가 말일을 넘지 않는다 (한 해 약 닷새 한 달씩 늦었습니다)');
  is((맨.match(/Math\.min\(_now\.getDate\(\)/g) || []).length >= 4,
     '  네 자리(3개월·10년 × 두 곳)가 모두 <b>말일에서 멈춘다</b> — ' +
     ((맨.match(/Math\.min\(_now\.getDate\(\)/g) || []).length) + '곳');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 생일 366가지(2월 29일생 포함) · 말일 + N개월 · 윤년 · 지인 소멸시효 · 상담자료 AI 경계가 모두 그 달 말일에서 멈춥니다.');
})();
