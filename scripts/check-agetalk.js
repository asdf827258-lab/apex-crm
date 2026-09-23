/* ══════════════════════════════════════════════════════════════════
   check-agetalk.js — <b>나이대마다 말이 정말 달라지는가.</b>

   사장님 말씀 (2026-09-23) — 「홈에서 자동으로 고객관리 해주는 부분이 너무
   허접해서 <b>연령대와 고객에 맞는 스크립트</b>를 제대로 할 수 있도록」.

   여태는 나이대가 <b>전화 끝의 한 줄</b>만 바꿨습니다. 그래서 스무 살과
   여든 살에게 <b>같은 카톡</b>이 나갔고, 망설이실 때 꺼내는 말도 같았습니다.

   ── 여기서 보는 것 ────────────────────────────────────────────────
     [1] 띠지가 <b>여섯</b>이고 키가 안 겹친다
     [2] 띠지마다 <b>네 자리</b>가 다 있다 — add · wait · kt · ask
     [3] 그 넉 줄이 <b>띠지끼리 겹치지 않는다</b> — 겹치면 나눈 뜻이 없다
     [4] 고객에게 나가는 넉 줄에 <b>숫자·나이가 없다</b> (2·3번)
     [5] <b>모르면 빈손</b> — 출생년도가 없거나 말이 안 되면 ''
         미성년(스무 살 아래)도 빈손이다 — 걸 전화가 아니다
     [6] <b>옛 띠지 이름</b>(2030·4050)을 아직 받아 준다 — 기록에 남아 있다
     [7] 카톡 마무리가 <b>나이대로 갈린다</b>. 모르면 원래 줄 그대로다
     [8] 망설이실 때 한마디가 <b>빈 적이 없다</b> — 모르면 정형화된 ④ 가 온다
     [9] <b>단정·약속을 안 한다</b> (2번) — 「반드시」 「무조건」 「받아 드립니다」
    [10] <b>저자세 금지어</b>가 없다 — 「바쁘시겠지만」 「부담 갖지 마세요」
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), vm = require('vm');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* apex-stage.js 는 브라우저용(window)이라 상자를 하나 만들어 담는다 */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'apex-stage.js'), 'utf8'), sandbox);
const S = sandbox.window.APEX_STAGE;

if (!S || !S.taAge) { console.log('  ✗ apex-stage.js 를 못 읽었습니다'); process.exit(1); }

const L = S.taAge;
const FIELDS = ['add', 'wait', 'kt', 'ask'];

/* [1] */
console.log('\n[1] 띠지 여섯 · 키가 안 겹친다');
is(L.length === 6, '띠지 ' + L.length + '개 (여섯이어야 합니다)');
is(new Set(L.map(a => a.k)).size === L.length, '키가 안 겹칩니다');

/* [2] */
console.log('\n[2] 띠지마다 네 자리가 다 있다');
L.forEach(a => {
  const miss = FIELDS.filter(f => !a[f] || !String(a[f]).trim());
  is(miss.length === 0, a.chip + ' — ' + (miss.length ? '빈 자리 ' + miss.join('·') : 'add·wait·kt·ask 다 있음'));
  is(!!(a.tip && a.no), a.chip + ' — 코칭(tip)과 금지(no)도 있음');
});

/* [3] 넉 줄이 띠지끼리 겹치지 않는다 */
console.log('\n[3] 띠지끼리 같은 말을 쓰지 않는다');
FIELDS.forEach(f => {
  const v = L.map(a => String(a[f]).trim());
  is(new Set(v).size === v.length, f + ' — ' + new Set(v).size + '/' + v.length + '가지');
});

/* [4] 고객에게 나가는 넉 줄에 숫자·나이가 없다 */
console.log('\n[4] 고객에게 나가는 줄에 숫자·나이가 없다 (2·3번)');
const AGEWORD = /(\d)|스무|서른|마흔|쉰|예순|일흔|여든|[0-9]+대|연세|나이/;
L.forEach(a => {
  const hit = FIELDS.filter(f => AGEWORD.test(String(a[f])));
  is(hit.length === 0, a.chip + ' — ' + (hit.length ? '숫자·나이가 들어감: ' + hit.join('·') : '없음'));
});

/* [5] 모르면 빈손 */
console.log('\n[5] 모르면 빈손 (1번)');
const Y = 2026;
is(S.ageBand('', Y) === '', '빈 칸 → 빈손');
is(S.ageBand(0, Y) === '', '0 → 빈손');
is(S.ageBand('없음', Y) === '', '글자 → 빈손');
is(S.ageBand(1700, Y) === '', '말이 안 되는 연도 → 빈손');
is(S.ageBand(200315, Y) === '', '둘 다 말이 되는 여섯 자리 → 빈손');
is(S.ageBand(2015, Y) === '', '미성년 → 빈손 (걸 전화가 아닙니다)');
is(S.ageOf('') === null, '빈손이면 띠지도 없음');

/* 경계 — 띠지가 제 나이에 붙는가.
   ★ 세는 법은 <b>연나이</b>(올해 − 태어난 해)입니다. 생일이 지났는지는
     따지지 않습니다 — 말투를 고르는 값이라 한두 살이 뜻이 없고, 따지는
     척하면 정확한 것처럼 보여 더 위험합니다(apex-stage.js 주석).
     그래서 2026년에 1997년생은 <b>스물아홉</b> → 20대입니다.
   ★ 띠지가 갈리는 <b>바로 그 해</b>를 쌍으로 넣습니다 — 한 칸 밀리는 잘못은
     가운데 값으로는 안 걸립니다. */
console.log('\n[5-1] 경계에서 제 띠지가 붙는다 (연나이)');
[[2007, ''],   [2006, '20'],            /* 열아홉 → 빈손 · 스물 → 20대 */
 [1997, '20'], [1996, '30'],            /* 스물아홉 · 서른 */
 [1987, '30'], [1986, '40'],            /* 서른아홉 · 마흔 */
 [1977, '40'], [1976, '50'],            /* 마흔아홉 · 쉰 */
 [1967, '50'], [1966, '60'],            /* 쉰아홉 · 예순 */
 [1957, '60'], [1956, '70'],            /* 예순아홉 · 일흔 */
 [19860324, '40'], [850627, '40']       /* 생년월일을 적어 두신 분 */
].forEach(([v, want]) => {
  const got = S.ageBand(v, Y);
  is(got === want, v + ' → ' + (got || '빈손') + ' (기대 ' + (want || '빈손') + ')');
});

/* [6] 옛 띠지 이름 */
console.log('\n[6] 옛 띠지 이름을 아직 받아 준다');
[['2030', '30'], ['4050', '40'], ['6070', '60']].forEach(([old, want]) => {
  const a = S.ageOf(old);
  is(!!a && a.k === want, old + ' → ' + (a ? a.k : '못 찾음'));
});

/* [7] 카톡 마무리 */
console.log('\n[7] 카톡 마무리가 나이대로 갈린다');
const ends = L.map(a => S.ktEndOf(a.k));
is(new Set(ends).size === L.length, '여섯이 서로 다른 마무리를 씁니다');
is(S.ktEndOf('') === S.ktEnd, '나이를 모르면 원래 줄 그대로입니다');
is(ends.every(e => e && e.trim()), '빈 마무리가 없습니다');

/* [8] 망설이실 때 한마디 */
console.log('\n[8] 망설이실 때 한마디가 빈 적이 없다');
const anyWait = S.script('TA', '보장분석', '');
is(!!(anyWait && anyWait.wait && anyWait.wait.trim()), '나이를 몰라도 ④ 가 옵니다');
L.forEach(a => {
  const r = S.script('TA', '보장분석', a.k);
  is(!!(r && r.wait === a.wait), a.chip + ' — 그 띠지의 줄이 옵니다');
  is(!!(r && r.age && r.age.ask === a.ask), a.chip + ' — 만나서 열 질문도 같이 옵니다');
  is(!!(r && r.say.indexOf(a.add) >= 0), a.chip + ' — 첫 마디 끝에 그 띠지 줄이 붙습니다');
});
/* 화법이 없는 단계는 여전히 빈손이어야 한다 (1번) */
is(S.script('AP', '', '40') === null, 'AP 는 여전히 빈손입니다 — 없는 자리를 세우지 않습니다');

/* [9] 단정·약속 */
console.log('\n[9] 단정·약속을 안 한다 (2번)');
const HARD = /무조건|반드시|100%|절대|확실히 (더 )?받|받아 드립니다|받아드립니다|보장해 드립니다|지금 아니면/;
L.forEach(a => {
  const hit = FIELDS.filter(f => HARD.test(String(a[f])));
  is(hit.length === 0, a.chip + ' — ' + (hit.length ? '단정·약속: ' + hit.join('·') : '없음'));
});

/* [10] 저자세 금지어 */
console.log('\n[10] 저자세 금지어가 없다');
const LOW = /바쁘시겠지만|괜찮으시다면|불편하시겠지만|부담 갖지 마세요|번거롭게 해|가입하시라는 게 아니라/;
L.forEach(a => {
  const hit = FIELDS.filter(f => LOW.test(String(a[f])));
  is(hit.length === 0, a.chip + ' — ' + (hit.length ? '금지어: ' + hit.join('·') : '없음'));
});

console.log('\n──────────────────────────────');
console.log(bad ? ('나이대 화법 점검 ' + bad + '건 걸림') : '나이대 화법 점검 통과');
process.exit(bad ? 1 : 0);
