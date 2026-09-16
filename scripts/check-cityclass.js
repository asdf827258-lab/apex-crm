#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   시(市) 분류 점검 — 「이 사람은 어느 시인가」

   지역 칸이 자유 입력이라 1,002명이 176가지 글자로 갈라져 있었습니다.
   「순천」·「순천시」·「전남순천」·「순천(하나로마트)」가 각각 다른 지역이
   되어 「이 지역 열 명」에 사람이 덜 뜨고 목록에 같은 데가 여러 번 떴습니다.

   여기서 지키는 것은 넷입니다.
     ① 갈라진 이름이 한 시로 묶이나
     ② 모르는 것을 짐작하지 않나        ← 엉뚱한 시에 넣으면 그 사람을 잃는다
     ③ 헛것을 잡지 않나                 ← 「고창군 아산면」의 아산을 시로 보면 안 된다
     ④ 「어느 시인가」를 답하는 곳이 하나인가

   견본은 <b>실제 고객 자료가 아닙니다</b> — 같은 모양으로 새로 지었습니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'apex-route.js');
const src = fs.readFileSync(SRC, 'utf8');
let bad = 0, n = 0;
const fail = (m) => { bad++; console.log('  ✗ ' + m); };
const ok   = (m) => { console.log('  ✓ ' + m); };

/* 진짜 배포되는 소스에서 그대로 떼어 낸다 — 베껴 쓰면 베낀 것을 재게 된다 */
const a = src.indexOf('var CITY_SGG=');
const b = src.indexOf('function cityStdSido(city){');
if (a < 0 || b < 0) {
  console.log('✗ apex-route.js 에서 시 분류 코드를 못 찾았습니다 (CITY_SGG / cityStdSido)');
  process.exit(1);
}
const slice = src.slice(a, src.indexOf('\n}', b) + 2);
let API;
try {
  API = new Function(slice + '\nreturn {cityGuess:cityGuess, cityOf:cityOf, cityStdSido:cityStdSido, ' +
                     'CITY_SGG:CITY_SGG, CITY_GWANG:CITY_GWANG, CITY_AMBIG:CITY_AMBIG};')();
} catch (e) {
  console.log('✗ 시 분류 코드가 혼자서는 안 돕니다: ' + e.message);
  process.exit(1);
}
const { cityGuess, cityOf, cityStdSido } = API;

/* ── [1] 갈라진 이름이 한 시로 묶이나 ───────────────────────── */
console.log('\n[1] 갈라져 적힌 이름이 한 시로 묶이나');
const SAME = [
  ['순천시', ['순천', '순천시', '전남순천', '전남 순천시', '순천(하나로마트)', '순천시 생목동',
              '순천 봉화1길 105', '전라남도 순천시']],
  ['여수시', ['여수', '여수시', '전남여수', '여수(돌산읍)', '여수시 만성로 210-30']],
  ['광양시', ['광양', '광양시', '전남광양', '광양(중마동)', '광양읍', '광양읍 우산공원길']],
  ['익산시', ['익산', '익산시', '전북익산', '전북특별자치도 익산시', '전북 익산시 모현동']],
];
SAME.forEach(([want, list]) => {
  n++;
  const got = list.map((t) => (cityGuess(t).ok ? cityGuess(t).city : '(못 정함)'));
  const uniq = Array.from(new Set(got));
  if (uniq.length === 1 && uniq[0] === want) ok(list.length + '가지 「' + list[0] + '…」 → 모두 ' + want);
  else fail('「' + want + '」로 안 묶입니다: ' + list.map((t, i) => t + '→' + got[i]).join(' · '));
});

/* ── [2] 모르는 것을 짐작하지 않나 ──────────────────────────── */
console.log('\n[2] 모르는 것을 짐작하지 않나 — 엉뚱한 시에 넣으면 그 사람을 잃는다');
const NOPE = [
  ['광주',      '두곳',     '광주광역시와 경기 광주시 둘 다 있다'],
  ['고성',      '두곳',     '경남 고성군과 강원 고성군 둘 다 있다'],
  ['순천광양',  '두곳적힘', '시가 둘 적혀 있다'],
  ['국동',      '모름',     '시가 아니라 동 이름이다'],
  ['학하동',    '모름',     '시가 아니라 동 이름이다'],
  ['승주읍 월계리', '모름', '시가 아니라 읍·리 이름이다'],
  ['금',        '모름',     '한 글자 부스러기 — 금산으로 늘려 읽으면 안 된다'],
  ['',          '빈칸',     '빈 칸'],
];
NOPE.forEach(([t, why, note]) => {
  n++;
  const r = cityGuess(t);
  if (r.ok) fail('「' + t + '」를 ' + r.city + ' 라고 정해 버렸습니다 — ' + note);
  else if (r.why !== why) fail('「' + t + '」의 이유가 「' + r.why + '」 (기대 「' + why + '」)');
  else ok('「' + (t || '(빈칸)') + '」 → 안 정합니다 [' + why + '] · ' + note);
});

/* 두 곳짜리는 <b>후보를 들고</b> 와야 사장님이 고를 수 있다 */
n++;
const gw = cityGuess('광주');
if (gw.cand && gw.cand.length === 2 && gw.cand.indexOf('광주광역시') >= 0) ok('「광주」가 고를 후보 둘을 들고 옵니다');
else fail('「광주」가 후보를 안 들고 옵니다 — 화면에서 고를 수가 없습니다');

/* ── [3] 헛것을 잡지 않나 ──────────────────────────────────── */
console.log('\n[3] 헛것을 잡지 않나 — 안 잡는 것보다 나쁘다 (8번)');
const YES = [
  ['고창군 아산면',            '고창군',      '아산「면」을 아산시로 보면 안 된다'],
  ['광양시 광영동주민센터근처', '광양시',      '「광영동」 속의 영동을 영동군으로 보면 안 된다'],
  ['서산 동문동 롯데시네마',   '서산시',      '가게 이름이 붙어도 시는 서산'],
  ['대전 중구 산성동',         '대전광역시',  '광역시는 구로 안 쪼갠다'],
  ['유성구 상대동',            '대전광역시',  '유성구는 나라에 하나뿐'],
  ['태안 태안읍',              '태안군',      '읍 이름이 같아도 한 번만'],
  ['예산읍',                   '예산군',      '읍만 적혀도 군은 안다'],
  ['경남의령',                 '의령군',      '도 접두 붙여 쓴 것'],
  ['통영시 중앙로 27 도천테마공원 근처(자택)', '통영시', '긴 주소'],
  ['세종',                     '세종특별자치시', '특별자치시'],
];
YES.forEach(([t, want, note]) => {
  n++;
  const r = cityGuess(t);
  if (!r.ok) fail('「' + t + '」를 못 정했습니다 [' + r.why + '] — ' + note);
  else if (r.city !== want) fail('「' + t + '」 → ' + r.city + ' (기대 ' + want + ') — ' + note);
  else ok('「' + t + '」 → ' + want);
});

/* ── [4] 서버에 이미 정해진 값이 언제나 이긴다 ──────────────── */
console.log('\n[4] 사장님이 고른 값을 기계가 뒤집지 않나');
n++;
if (cityOf({ region: '광양', sigungu: '순천시' }) === '순천시')
  ok('sigungu 가 있으면 적힌 글자보다 그것을 씁니다');
else fail('저장된 시를 적힌 글자가 덮어씁니다 — 고른 값이 뒤집힙니다');
n++;
if (cityOf({ region: '광주' }) === '') ok('못 정한 사람은 빈 글자 — 목록에서 「시 모름」으로 셉니다');
else fail('못 정한 사람에게 시가 붙었습니다');

/* ── [5] 시 이름 → 도 ───────────────────────────────────────── */
console.log('\n[5] 시 이름으로 도를 찾는 자리');
[['순천시', '전남'], ['대전광역시', '대전'], ['광주광역시', '광주'],
 ['경기 광주시', '경기'], ['익산시', '전북'], ['없는시', '']].forEach(([c, want]) => {
  n++;
  const got = cityStdSido(c);
  if (got === want) ok('「' + c + '」 → ' + (want || '(모름)'));
  else fail('「' + c + '」 → ' + got + ' (기대 ' + (want || '(모름)') + ')');
});

/* ── [6] 「어느 시인가」를 답하는 곳이 하나인가 (5번 규칙) ──── */
console.log('\n[6] 「어느 시인가」를 답하는 곳이 하나인가');
n++;
const oldWay = (src.match(/regionText\(d\.region\)\s*!==\s*regionText\(/g) || []).length;
if (oldWay === 0) ok('옛 방식(regionText 로 지역 거르기)이 남아 있지 않습니다');
else fail('regionText 로 지역을 거르는 자리가 ' + oldWay + '곳 남아 있습니다 — cityMatch() 를 쓰십시오');

n++;
['cityGuess', 'cityOf', 'cityMatch', 'cityStdSido'].forEach((f) => {
  const c = (src.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
  if (c !== 1) fail(f + ' 이 ' + c + '곳에 있습니다 — 한 곳이어야 합니다');
});
if (!bad) ok('cityGuess · cityOf · cityMatch · cityStdSido 가 각각 한 곳뿐입니다');

n++;
if (/var CITY_NONE=/.test(src) && (src.match(/var CITY_NONE=/g) || []).length === 1)
  ok('「시 모름」을 가리키는 값도 한 곳에만 있습니다');
else fail('CITY_NONE 이 없거나 두 곳에 있습니다');

/* ── [7] 목록에 없는 시가 조용히 지워지지 않나 ─────────────── */
console.log('\n[7] 목록에 없는 이름이 조용히 지워지지 않나');
n++;
if (/if\(sel&&!seen\[sel\]\)out\.splice/.test(src.replace(/\s/g, '')) ||
    /seen\[sel\]/.test(src))
  ok('이미 저장된 이름이 목록에 없으면 그것도 넣어 줍니다');
else fail('저장된 시가 목록에 없으면 창을 열었다 닫기만 해도 지워집니다');

/* ══ 시를 <b>검색해서</b> 고른다 — 네이버 주소 검색창처럼 ══════════
   사장님 말씀 — 「네이버 주소 검색창에서 입력하는 것처럼 비슷한 주소에
   검색해서 할 수 있도록」. 펼침 목록은 시·군이 126곳이라 폰에서 한참
   굴려야 했습니다.

   여기서 지키는 것 —
     ① 이름·초성·도 이름으로 <b>찾아진다</b>
     ② <b>헛것을 안 부른다</b> — 「여수」 를 쳤는데 고양시가 나오면
        안 찾아 주는 것보다 나쁘다 (8번)
     ③ 내 고객이 많은 시가 <b>먼저</b> 나온다
     ④ 못 찾으면 <b>못 찾았다고</b> 한다 — 짐작해서 안 넣는다 (1번)
     ⑤ 눌러서 고르는 손이 <b>붙어 있다</b> — 이 파일은 통째로 감싸여
        있어 onclick="..." 은 전역을 찾지 못한다. 눌러도 안 먹는다.     */
console.log('\n[검색] 치면 찾아 주는가');
const SEARCH = (function () {
  const a = src.indexOf('var CITY_SGG='), b = src.indexOf('function cityPickHtml(');
  if (a < 0 || b < 0) return null;
  const seed = [['순천시', 214], ['여수시', 183], ['대전광역시', 168], ['광양시', 123], ['광주광역시', 32]];
  const dbs = [];
  seed.forEach(([c, m]) => { for (let i = 0; i < m; i++) dbs.push({ sigungu: c }); });
  try {
    return new Function('var dbs=' + JSON.stringify(dbs) + ';var E=function(x){return String(x)};' +
      src.slice(a, b) + '\nreturn {citySearch:citySearch,cityAll:cityAll,cityCho:cityCho};')();
  } catch (e) { return null; }
})();
n++;
if (SEARCH) ok('검색하는 곳이 있다 — citySearch');
else fail('검색하는 곳을 못 찾았습니다 (citySearch)');

if (SEARCH) {
  const top = (q, k) => (SEARCH.citySearch(q, k || 5) || []).map(x => x.c);
  const has = (q, c) => top(q, 8).indexOf(c) >= 0;

  n++; if (top('여수')[0] === '여수시') ok('「여수」 → 여수시가 맨 앞이다');
       else fail('「여수」 를 쳤는데 여수시가 맨 앞이 아니다 — ' + top('여수').join(' · '));

  /* ↓ 실제로 났던 헛것. 초성까지 늘 견주면 「여수」(ㅇㅅ)가 「고양시」(ㄱㅇㅅ)를 부른다 */
  n++; if (top('여수').length === 1) ok('「여수」 에 <b>딴 시가 안 딸려 온다</b> — ' + top('여수').join(' · '));
       else fail('「여수」 에 딴 시가 딸려 온다 — ' + top('여수').join(' · ') +
                 ' (초성은 초성만 쳤을 때만 봐야 한다)');
  n++; if (top('대전').length === 1 && top('대전')[0] === '대전광역시')
         ok('「대전」 도 하나만 — 당진시가 안 딸려 온다');
       else fail('「대전」 에 딴 시가 딸려 온다 — ' + top('대전').join(' · '));

  n++; if (has('ㅅㅊ', '순천시')) ok('초성 「ㅅㅊ」 으로 <b>순천시</b>를 찾는다');
       else fail('초성 「ㅅㅊ」 으로 순천시를 못 찾는다 — ' + top('ㅅㅊ', 8).join(' · '));
  /* ↓ 이것도 실제로 났던 헛것. 도 이름까지 붙여 초성을 만들면
       「계룡시 충남」 의 초성에 ㅅㅊ 이 걸려 순천을 찾는데 계룡이 나온다 */
  n++; if (!has('ㅅㅊ', '계룡시')) ok('초성은 <b>시 이름에만</b> 건다 — 「계룡시 충남」 이 안 걸린다');
       else fail('「ㅅㅊ」 에 계룡시가 나온다 — 도 이름을 붙여 초성을 만들면 헛것이 걸린다');

  n++; if (top('ㅅㅊ')[0] === '순천시' && top('ㅇㅅ')[0] === '여수시')
         ok('<b>내 고객이 많은 시</b>가 먼저 나온다 — 순천 214 · 여수 183');
       else fail('내 고객이 많은 시가 먼저 안 나온다 — ' + top('ㅅㅊ').join(' · '));

  n++; const gw = top('광주', 8);
       if (gw.indexOf('광주광역시') >= 0 && gw.indexOf('경기 광주시') >= 0)
         ok('「광주」 는 <b>두 곳을 다</b> 보여 준다 — 고르시게 한다 (1번)');
       else fail('「광주」 에 두 곳이 다 안 나온다 — ' + gw.join(' · '));

  n++; if (top('전남', 8).indexOf('순천시') >= 0) ok('<b>도 이름</b>으로도 찾는다 — 「전남」');
       else fail('「전남」 으로 전남 시·군을 못 찾는다');

  n++; if (SEARCH.citySearch('없는곳', 5).length === 0)
         ok('없는 것은 <b>없다고</b> 한다 — 짐작해서 안 채운다 (1번)');
       else fail('없는 글자에도 무언가를 돌려준다');

  n++; if ((SEARCH.citySearch('', 0) || []).length === SEARCH.cityAll().length)
         ok('빈 칸이면 <b>전부</b> 보여 준다 — ' + SEARCH.cityAll().length + '곳');
       else fail('빈 칸일 때 목록이 줄어든다');
}

console.log('\n[손] 눌러서 고르는 손이 붙어 있는가');
/* apex-route.js 는 통째로 감싸여 있다(즉시실행함수). HTML 속성에 적은
   onclick="cityPick…" 은 <b>전역</b>을 찾으므로 눌러도 아무 일이 안 난다.
   실제로 그렇게 짰다가 브라우저에서 눌러 보고 알았다. */
const PICK = src.slice(src.indexOf('function cityPickHtml('), src.indexOf('function cityStdSido(city){'));
n++; if (!/onclick="/.test(PICK)) ok('HTML 속성에 <b>onclick 을 안 적는다</b> — 감싼 파일이라 안 먹는다');
     else fail('onclick="…" 을 적었다 — 이 파일에서는 눌러도 아무 일이 안 난다');
n++; if (/\.onclick\s*=/.test(PICK) && /function cityPickWire\(/.test(PICK))
       ok('그린 뒤 <b>el.onclick 으로</b> 붙인다 — 이 파일이 원래 쓰던 방식이다 (5번)');
     else fail('손을 붙이는 곳(cityPickWire)이 없다');
n++; if (/cityPickWire\(q\("rtTidyB"\)\)/.test(src))
       ok('시 정해 주기 화면이 <b>그린 뒤 손을 붙인다</b>');
     else fail('그려만 놓고 손을 안 붙인다 — 눌러도 안 먹는다');
n++; if (/querySelectorAll\("\[data-cpick\]"\)/.test(src) && !/querySelectorAll\("\[data-cfix\]"\)/.test(src))
       ok('저장할 때 <b>고른 값</b>을 읽는다 — 옛 펼침 목록을 안 본다');
     else fail('저장하는 곳이 옛 펼침 목록(data-cfix)을 본다');

console.log('\n' + '─'.repeat(30));
if (bad) { console.log('시 분류 점검 실패 — ' + bad + '곳'); process.exit(1); }
console.log('시 분류 점검 통과 — ' + n + '가지를 봤습니다.');
