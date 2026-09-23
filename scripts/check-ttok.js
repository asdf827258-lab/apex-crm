/* ══════════════════════════════════════════════════════════════════
   check-ttok.js — <b>토스판 토큰이 한 곳에만 있나.</b>

   사장님 말씀 (2026-09-23) — 「APEX YUN PRO 를 토스처럼 바꿉니다.
   이 세션은 그중 첫 조각인 <b>디자인 토큰 + 홈 화면</b>만 맡습니다」
   「토큰과 클래스는 <b>반드시 한 곳에만</b> 두십시오」
   「홈에 <b>저장 코드를 새로 짜지 마십시오</b>. 기존 화면·기존 함수를
    부르기만 하십시오. 두 벌이 되는 순간 데이터가 깨집니다」

   ── 이름을 왜 check-ttok 으로 했나 ────────────────────────────────
   지시는 <b>check-toss.js</b> 였는데 그 이름은 <b>이미 있습니다</b> —
   「폰에서 읽히나 · 손이 닿나 · 옆으로 안 새나」 를 재는 34KB 짜리 자(尺)
   입니다. 덮어쓰면 그것이 통째로 사라집니다. CLAUDE.md 8번이 적어 둔
   사고(check-tofin.js 를 덮어써 기존 점검을 지웠다) 그대로입니다.
   그래서 <b>새 이름</b>으로 두고 둘 다 돌립니다.

   ── 보는 것 <b>세 가지만</b> ──────────────────────────────────────
   (넓게 잡지 않습니다 — 헛것을 잡는 점검은 안 잡는 점검보다 나쁩니다 · 8번)
     ① --t- 토큰 블록이 파일에 <b>한 번만</b> 나오나
     ② .t- 클래스 규칙 안에 <b>하드코딩 hex</b> 가 섞였나
     ③ 홈 코드에 <b>새 저장 호출</b>(.insert/.update/.upsert/.delete)이 생겼나
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync('app/index.html', 'utf8');

/* 토큰 열둘 — 사장님이 주신 그대로. <b>여기 적어 두는 것이 자(尺)</b>입니다 */
const TOKENS = ['--t-ink', '--t-sub', '--t-sub2', '--t-line', '--t-bg', '--t-card',
                '--t-point', '--t-point-l', '--t-pos', '--t-warn', '--t-neg',
                '--t-r', '--t-r-btn', '--t-r-sm'];
const CLASSES = ['t-card', 't-btn', 't-h1', 't-sub', 't-row', 't-chip', 't-sheet', 't-pad'];

console.log('\n[1] --t- 토큰이 <b>한 곳에만</b> 있나 (5번)');
/* <b>정의</b>만 셉니다 — 「--t-ink:」 처럼 뒤에 콜론이 오는 자리.
   var(--t-ink) 처럼 <b>쓰는</b> 자리는 여러 곳이어야 정상입니다. */
const defs = {};
TOKENS.forEach(t => {
  const re = new RegExp(t.replace(/-/g, '\\-') + '\\s*:', 'g');
  defs[t] = (SRC.match(re) || []).length;
});
const missing = TOKENS.filter(t => defs[t] === 0);
const twice = TOKENS.filter(t => defs[t] > 1);
is(missing.length === 0, '  토큰 <b>' + TOKENS.length + '개</b>가 다 있다' +
   (missing.length ? (' ← 없다: ' + missing.join(' ')) : ''));
is(twice.length === 0, '  <b>두 번 적힌 토큰이 없다</b>' +
   (twice.length ? (' ← ' + twice.map(t => t + '(' + defs[t] + '번)').join(' ')) : '') +
   ' — 두 곳에 있으면 한쪽만 고쳐져 화면마다 다른 파랑이 된다');
/* 블록 자체가 하나인가 — :root 가 여럿이어도 --t- 를 담은 것은 하나여야 한다 */
const roots = (SRC.match(/:root\s*\{[^}]*--t-ink\s*:/g) || []).length;
is(roots === 1, '  --t- 를 담은 <b>:root 블록이 하나</b>다 — ' + roots + '개');

console.log('\n[2] .t- 클래스 안에 <b>하드코딩 hex</b> 가 섞였나');
/* ⚠ <b>좁게 잡습니다</b> (8번). 파일 전체에서 hex 를 세면 45,000줄에
   수백 개가 나옵니다 — 그건 이 점검이 볼 자리가 아닙니다. <b>.t- 로
   시작하는 규칙 안</b>만 봅니다. 그림자의 rgba 는 색 토큰이 아니라
   <b>그림자</b>라 셈에서 뺍니다 — 토큰에 그림자가 없습니다.         */
const rules = [];
CLASSES.forEach(c => {
  const re = new RegExp('^\\.' + c + '(?![a-z0-9-])[^{]*\\{([^}]*)\\}', 'gm');
  let m;
  while ((m = re.exec(SRC)) !== null) rules.push({ c: c, body: m[1] });
});
is(rules.length >= CLASSES.length,
   '  여덟 클래스 규칙을 <b>' + rules.length + '개</b> 찾았다');
const dirty = rules.filter(r => /#[0-9A-Fa-f]{3,8}\b/.test(r.body));
is(dirty.length === 0, '  <b>hex 를 직접 적은 자리가 없다</b>' +
   (dirty.length ? (' ← .' + dirty[0].c + ' : ' + (dirty[0].body.match(/#[0-9A-Fa-f]{3,8}/) || [''])[0]) : '') +
   ' — 적으면 토큰을 고쳐도 그 자리만 옛 색으로 남는다');
/* 토큰을 <b>실제로 쓰고는 있나</b> — 안 쓰면 [2] 가 늘 초록이라 알람이 안 운다 (8번) */
const uses = rules.filter(r => /var\(--t-/.test(r.body)).length;
is(uses >= 6, '  <b>' + uses + '개</b> 규칙이 토큰을 쓴다 — 안 쓰면 이 줄이 늘 초록이라 자가 아니다');

console.log('\n[3] 홈에 <b>새 저장 호출</b>이 생겼나');
/* 사장님 말씀 — 「홈에 저장 코드를 새로 짜지 마십시오. 기존 화면·기존
   함수를 부르기만 하십시오. <b>두 벌이 되는 순간 데이터가 깨집니다</b>」.
   ★ <b>renderHome 안</b>만 봅니다. 홈에서 부르는 기존 함수(hdbSave 등)는
     제 자리에 그대로 있어야 하고, 그것까지 잡으면 헛것입니다 (8번). */
const i0 = SRC.indexOf('function renderHome(');
is(i0 >= 0, '  renderHome 을 찾았다');
let home = '';
if (i0 >= 0) {
  /* 함수 끝 — 줄 맨 앞의 } 까지 */
  const rest = SRC.slice(i0);
  const end = rest.search(/\n\}/);
  home = end > 0 ? rest.slice(0, end) : rest;
}
const SAVE = /\.(insert|update|upsert|delete)\s*\(/g;
const hits = home.match(SAVE) || [];
is(hits.length === 0, '  홈이 <b>스스로 저장하지 않는다</b>' +
   (hits.length ? (' ← ' + hits.join(' ')) : '') +
   ' — 저장은 원래 함수에 맡긴다 (5번)');
is(!/osClient\s*\(\s*\)\s*\./.test(home),
   '  홈이 <b>서버를 직접 잡지 않는다</b> — 잡는 순간 저장 자리가 두 벌이 된다');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 토큰은 한 곳에 · 색은 토큰으로 · 홈은 스스로 저장하지 않습니다.');
process.exit(bad ? 1 : 0);
