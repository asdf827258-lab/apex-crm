#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   판 시각이 <b>뒤로 가지 않나</b> (판 X107)

   CLAUDE.md 11번 ① 이 미리 적어 둔 자리입니다 —
     「⚠ 다만 <b>판 번호가 뒤로 가게 두지 마십시오</b> — 나중에 붙이는 쪽이
      먼저 나간 쪽보다 시각이 이를 수 있습니다(17:10 이 21:20 뒤에 들어온
      적이 있습니다).」

   ★★ 2026-10-14 에 <b>두 번째로</b> 그랬습니다. 다른 세션이 15:40 으로
   올려 둔 뒤에 제가 08:05 로 밀어, 라이브 판 시각이 <b>뒤로 갔습니다.</b>
   적어 두기만 한 규칙은 알람이 아닙니다 (8번).

   ★★ 그리고 쪽지가 <b>같이 실려 나간 다른 판</b>을 말하지 않았습니다.
   라이브에 무엇이 들어 있는지 쪽지가 거짓말하면 안 됩니다 (1번·11번 ①).

   여기서 못 박는 것은 셋입니다.

     ① 내 APP_BUILD 가 <b>origin/main 것보다 뒤</b>다 (같아도 안 됩니다 —
        고치면서 쪽지를 안 바꾼 뜻이 되니까요)
     ② 두 줄(APP_BUILD · APP_BUILD_NOTE)이 <b>짝으로</b> 바뀐다 — 시각만
        밀고 쪽지가 그대로면 사장님은 바뀐 줄 모르십니다
     ③ 꼴이 읽을 수 있다 — YYYY-MM-DD HH:MM

   ⚠ <b>main 을 못 보면 모른다고 적고 넘어갑니다</b> (1번) — 바깥이 막힌 데서
   돌 수도 있고, 거기서 거짓 빨간불을 켜면 헛것입니다 (8번).
   ⚠ main 위에서 돌 때는 견줄 상대가 저 자신이라 건너뜁니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = process.cwd();
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const 줄 = (글, 이름) => {
  const m = ('' + 글).split('\n').filter(l => l.indexOf('var ' + 이름 + '=') === 0)[0];
  return m || '';
};
const 시각 = 글 => { const m = ('' + 글).match(/^var APP_BUILD='([^']*)'/m); return m ? m[1] : ''; };
const 꼴 = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/* ⚠ maxBuffer 를 올려야 합니다 — app/index.html 이 5.4MB 라 기본 1MB 로는
   execFileSync 가 터지고, 그러면 이 자는 「main 을 못 봤습니다」 하고 <b>조용히
   통과</b>합니다. 늘 통과하는 자는 자가 아닙니다 (8번). 처음에 그랬습니다. */
const git = (...a) => {
  try { return execFileSync('git', a, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString(); }
  catch (e) { return null; }
};

const 여기 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const 내시각 = 시각(여기);

head('[1] 판 시각이 <b>읽을 수 있는 꼴</b>인가');
is(!!내시각, 'APP_BUILD 가 있다 — ' + (내시각 || '(없음)'));
is(꼴.test(내시각), '꼴이 <b>YYYY-MM-DD HH:MM</b> 이다');
is(!!줄(여기, 'APP_BUILD_NOTE'), 'APP_BUILD_NOTE 가 있다');

head('[2] <b>main 것보다 뒤</b>인가 (11번 ①)');
/* main 을 볼 수 있나 — 못 보면 모른다고 적습니다 (1번) */
let 머리 = git('rev-parse', '--abbrev-ref', 'HEAD');
머리 = 머리 ? 머리.trim() : '';
let main = git('show', 'origin/main:app/index.html');
if (!main) { git('fetch', 'origin', 'main'); main = git('show', 'origin/main:app/index.html'); }

if (머리 === 'main') {
  console.log('  — main 위에서 돌고 있습니다. 견줄 상대가 저 자신이라 건너뜁니다.');
} else if (!main) {
  console.log('  — <b>origin/main 을 못 봤습니다</b>(바깥이 막혔거나 받아 둔 것이 없음).');
  console.log('    모르는 것은 모른다고 적고 넘어갑니다 (1번). 밀기 전에 손으로 보십시오:');
  console.log('      git fetch origin main && git show origin/main:app/index.html | grep -m1 "^var APP_BUILD="');
} else {
  const 저쪽 = 시각(main);
  const 같나 = 줄(여기, 'APP_BUILD') === 줄(main, 'APP_BUILD');
  if (같나) {
    console.log('  — 내 APP_BUILD 가 main 과 <b>같습니다</b>(이 갈래가 아직 안 고쳤습니다). 건너뜁니다.');
  } else {
    is(!!저쪽 && 꼴.test(저쪽), '  main 의 판 시각을 읽었다 — ' + (저쪽 || '(못 읽음)'));
    is(내시각 > 저쪽,
       '  내 판(' + 내시각 + ')이 main(' + 저쪽 + ') <b>보다 뒤</b>다' +
       (내시각 > 저쪽 ? '' : '\n      ← 라이브 판 시각이 뒤로 갑니다. 사장님은 「새 판인데 왜 시각이 앞이지」 하십니다.' +
        '\n      ← main 을 받아 붙이고(git merge origin/main) APP_BUILD 를 지금 시각으로 미십시오 (11번 ①)'));
    /* ② 시각만 밀고 쪽지가 그대로면 사장님은 바뀐 줄 모르십니다 */
    is(줄(여기, 'APP_BUILD_NOTE') !== 줄(main, 'APP_BUILD_NOTE'),
       '  <b>쪽지도 같이</b> 바뀌었다 — 시각만 밀지 않았다 (6번)');
  }
}

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
console.log('✓ 판 시각이 뒤로 가지 않습니다 (' + n + '자리).');
