/* ══════════════════════════════════════════════════════════════════
   check-junk.js — <b>저장소에 들어가면 안 되는 것이 들어왔나.</b>

   ── 왜 세웠나 (2026-09-30) ───────────────────────────────────────
   재는 동안 찍은 화면 사진 둘이 <b>`undefined/` 라는 폴더</b>에 담겨
   저장소에 올라갔습니다. 까닭은 한 글자였습니다 —

       OUTDIR=$S   (export 를 빼먹음)  →  process.env.OUTDIR 가 없음
       →  OUT 이 undefined  →  'undefined/…png' 라는 경로가 만들어짐

   ★ <b>값이 안 잡힌 변수로 만든 경로</b>는 조용히 그럴듯한 폴더가 됩니다.
     `git add -A` 가 그것을 같이 담고, 아무도 안 봅니다.
   ★ 찍는 조각은 <b>저장소 밖</b>(scratchpad)이라 고쳐도 다음 사람은
     모릅니다. 그래서 <b>저장소 쪽에</b> 자를 세웁니다 — 어느 도구가
     같은 실수를 해도 여기서 걸립니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ <b>undefined · null · NaN</b> 이라는 이름의 자리가 없다
     [2] 큰 이진 파일(500KB 넘는 것)이 <b>늘지 않았다</b> (눈금)

   ── ⚠ [2] 를 0 으로 요구하지 않습니다 ────────────────────────────
   사장님 가이드 사진처럼 <b>커야 하는 것</b>도 있습니다. 전부 막으라
   하면 그런 것이 거짓으로 빨개집니다 (8번). <b>수를 세고 늘지만 못하게</b>
   합니다 — 줄이면 기준선도 같이 내립니다.
   ══════════════════════════════════════════════════════════════════ */
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ★ <b>2026-09-30 에 잰 값</b>입니다. 줄이면 같이 내리십시오. */
const BASE = { 큰것: 6 };

let files = [];
try {
  files = execSync('git ls-files -z', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString().split('\0').filter(Boolean);
} catch (e) { console.log('  ✗ git ls-files 를 못 읽었습니다 — ' + e.message); process.exit(1); }

console.log('\n[1] ★ <b>값이 안 잡힌 변수로 만든 자리</b>가 없다');
/* 경로의 <b>한 토막이 통째로</b> 그 글자인 것만 봅니다 — 「undefined-guard.js」
   같은 멀쩡한 이름을 잡으면 헛것입니다 (8번).                          */
const 빈값 = ['undefined', 'null', 'NaN'];
const 걸린 = files.filter(f => f.split('/').some(seg =>
  빈값.indexOf(seg) >= 0 || 빈값.some(w => seg.indexOf(w + '.') === 0)));
is(걸린.length === 0,
   '  <b>undefined · null · NaN</b> 이라는 자리가 없다' +
   (걸린.length ? ('\n      ← ' + 걸린.slice(0, 6).join('\n      ← ') +
                   '\n      (찍는 자리에서 값이 안 잡힌 변수로 경로를 만든 것입니다 — ' +
                   '지우기만 하지 말고 그 줄도 같이 고치십시오)') : ''));

console.log('\n[2] 큰 이진 파일이 <b>늘지 않았다</b> (눈금)');
const 이진 = /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|ttf|otf|mp4|mov)$/i;
const 큰것 = [];
for (const f of files) {
  if (!이진.test(f)) continue;
  let s = 0; try { s = fs.statSync(path.join(ROOT, f)).size; } catch (e) { continue; }
  if (s > 512000) 큰것.push({ f, s });
}
큰것.sort((a, b) => b.s - a.s);
console.log('     500KB 넘는 이진 파일 <b>' + 큰것.length + '개</b>' +
            (큰것.length ? (' — 제일 큰 것 ' + Math.round(큰것[0].s / 1024) + 'KB · ' + 큰것[0].f) : ''));
is(큰것.length <= BASE.큰것,
   '  큰 것이 <b>' + 큰것.length + '개</b> — 기준선 ' + BASE.큰것 + ' 이하' +
   (큰것.length > BASE.큰것
     ? ('\n      ← 늘었습니다: ' + 큰것.slice(0, BASE.큰것 + 3).map(x => Math.round(x.s / 1024) + 'KB ' + x.f).slice(-3).join(' · ') +
        '\n      (재면서 찍은 사진이면 scratchpad 에 두십시오)')
     : ''));
if (큰것.length < BASE.큰것)
  console.log('     ★ ' + (BASE.큰것 - 큰것.length) + '개를 줄이셨습니다 — 이 파일의 BASE 도 ' +
              큰것.length + ' 로 내려 주십시오');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                : '✓ 저장소에 들어가면 안 되는 것이 없습니다.');
process.exit(bad ? 1 : 0);
