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

/* ── 그 분 사정 — 가족 묶음 · 보유계약 ────────────────────────────── */
console.log('\n[11] 아는 것이 없으면 아무 줄도 안 붙는다 (1번)');
[undefined, null, {}, { pol: false, mine: false, fam: 0 }, { fam: 1 }].forEach((w, i) => {
  is(S.whoFit(w).length === 0, '모르는 경우 ' + (i + 1) + ' → 빈 배열');
});
is(S.whoFit({ fam: 1 }).length === 0, '혼자뿐인 묶음(fam=1)은 묶음이 아닙니다');

console.log('\n[12] 있는 것만 붙는다 · 많아야 둘');
const keys = w => S.whoFit(w).map(f => f.k).join('+');
is(keys({ mine: true }) === 'mine', '계약만 → mine');
is(keys({ pol: true }) === 'pol', '증권까지 → pol');
is(keys({ pol: true, mine: true }) === 'pol', '증권이면 계약 줄은 안 겹칩니다');
is(keys({ fam: 3 }) === 'fam', '가족만 → fam');
is(keys({ pol: true, mine: true, fam: 4 }) === 'pol+fam', '둘 다여도 줄은 둘까지');
is(S.whoFit({ pol: true, mine: true, fam: 4 }).length <= 2, '한 분에게 셋은 안 붙습니다');

console.log('\n[13] 붙는 줄에 이름·인원수·숫자가 없다 (2·3번)');
S.fits.forEach(f => {
  const say = (typeof f.say === 'function') ? f.say() : f.say;
  is(!!(say && say.trim()), f.lb + ' — 말이 있습니다');
  is(!/(\d)|명|분들이 (둘|셋)/.test(say), f.lb + ' — 숫자·인원수가 없습니다');
  is(!HARD.test(say), f.lb + ' — 단정·약속이 없습니다');
  is(!LOW.test(say), f.lb + ' — 저자세 금지어가 없습니다');
});

console.log('\n[14] 증권 받으신 분께 할 말은 증권전달 차례에서 온다 (5번)');
const polSay = S.whoFit({ pol: true })[0].say;
const step2 = S.pdel.filter(x => x.n === 2)[0];
is(!!step2, '증권전달 차례 2번이 있습니다');
is(step2.say.indexOf(polSay) === 0, '같은 말을 두 곳에 안 적고 거기서 꺼내 씁니다');

console.log('\n[15] 사정이 첫 마디에 실제로 붙는다 — 나이대 줄 뒤에');
const base = S.script('TA', '보장분석', '40', null);
const withFit = S.script('TA', '보장분석', '40', { pol: true, fam: 3 });
is(withFit.say.length > base.say.length, '말이 길어집니다');
is(withFit.say.indexOf(S.ageOf('40').add) < withFit.say.indexOf(polSay),
   '나이대 줄이 사정 줄보다 앞에 옵니다');
is(withFit.fit.length === 2, 'fit 이 둘 실려 옵니다');
is(base.fit.length === 0, '모르면 fit 이 빈 배열입니다');
/* 나이를 몰라도 사정은 붙어야 한다 — 둘은 서로 다른 축이다 */
const noAge = S.script('TA', '보장분석', '', { mine: true });
is(noAge.fit.length === 1 && noAge.say.indexOf(S.whoFit({ mine: true })[0].say) >= 0,
   '나이를 몰라도 사정 줄은 붙습니다');

console.log('\n[16] 묻는 줄이 맨 마지막에 남는다');
/* 첫 마디는 「언제가 편하실까요」 로 끝납니다. 그 뒤에 말을 더 붙이면
   고객이 답할 자리를 우리가 덮습니다 — 실제로 그렇게 붙여 놓고 찾았습니다. */
const ASK = /(까요|시겠어요|세요)[.?!]?\s*$/;
const SRCS = ['보장분석', '소개', '방송', '농협', '개척', '기타'];
const CASES = [null, { mine: true }, { pol: true }, { fam: 3 }, { pol: true, fam: 3 }];
let moved = 0, kept = 0;
SRCS.forEach(src => {
  ['', '20', '40', '60', '70'].forEach(a => {
    CASES.forEach(w => {
      const r = S.script('TA', src, a, w); if (!r) return;
      const L0 = S.script('TA', src, '', null).say.split('\n');
      const L = r.say.split('\n');
      if (!ASK.test(L0[L0.length - 1])) return;      /* 원래 안 묻고 끝나는 첫 마디는 넘긴다 */
      kept++;
      if (ASK.test(L[L.length - 1])) moved++;
    });
  });
});
is(kept > 0 && moved === kept, '묻고 끝나는 첫 마디 ' + kept + '가지 모두 질문이 맨 끝 (' + moved + ')');
/* 안 묻고 끝나는 첫 마디(개척)는 그냥 뒤에 붙어야 한다 */
const gc = S.script('TA', '개척', '30', null);
is(gc.say.split('\n').pop() === S.ageOf('30').add, '안 묻고 끝나는 첫 마디는 뒤에 붙습니다');

console.log('\n[17] 같은 말을 두 번 하지 않는다 · 멀쩡한 줄은 안 지운다');
/* ⚠ 처음에는 <b>똑같은 줄</b>만 셌습니다. 그런데 겹침 판정을 일부러 없애
   보니 점검이 <b>그대로 초록</b>이었습니다 — 실제로 겹치는 말은 글자가
   똑같지 않고 <b>비슷</b>하기 때문입니다. 그래서 여기서 겹침을 <b>따로
   세어</b> 봅니다. apex-stage 의 판정을 부르지 않고 이 파일이 직접 셉니다 —
   구현을 그대로 부르면 구현이 틀려도 같이 틀립니다.                      */
const norm = x => String(x).replace(/[\s.,?!]/g, '');
function share8(a, b) {
  a = norm(a); b = norm(b);
  if (a.length < 8 || b.length < 8) return false;
  for (let i = 0; i + 8 <= a.length; i++) if (b.indexOf(a.substr(i, 8)) >= 0) return true;
  return false;
}
let dupe = 0, drop = 0, tot = 0;
SRCS.forEach(src => {
  ['20', '30', '40', '50', '60', '70'].forEach(a => {
    const r = S.script('TA', src, a, { pol: true, fam: 3 }); if (!r) return;
    tot++;
    const L = r.say.split('\n').map(x => x.trim()).filter(Boolean);
    if (new Set(L).size !== L.length) { dupe++; console.log('     같은 줄 두 번 : ' + src + ' × ' + a); }
    else for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++)
      if (share8(L[i], L[j])) { dupe++; console.log('     비슷한 줄 두 번 : ' + src + ' × ' + a + ' — 「' + L[j].slice(0, 22) + '…」'); i = j = L.length; }
    if (r.say.indexOf(S.ageOf(a).add) < 0) drop++;
  });
});
is(dupe === 0, '같은 말이 두 번 들어간 조합 없음 (' + tot + '가지 · 글자 여덟 자로 잽니다)');
/* 겹침 판정이 넓으면 멀쩡한 나이대 줄까지 지운다 (8번) — 다섯 자로 잡았을 때
   여섯 조합이 지워졌다. 진짜 겹치는 것은 개척 × 70대 하나뿐이다. */
is(drop <= 1, '겹쳐서 빠진 나이대 줄 ' + drop + '가지 (하나까지만 정상 — 개척 × 70대)');

console.log('\n──────────────────────────────');
console.log(bad ? ('나이대 화법 점검 ' + bad + '건 걸림') : '나이대 화법 점검 통과');
process.exit(bad ? 1 : 0);
