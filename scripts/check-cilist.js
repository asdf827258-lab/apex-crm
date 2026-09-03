/* <b>점검 목록 자체가 성한가.</b>

   점검을 checks.tsv 로 빼면서 새로 생긴 위험이 있습니다 — <b>목록이
   조용히 틀리는 것</b>입니다. 없는 파일을 가리키면 그 점검은 안 도는데,
   CI 는 초록불로 보일 수 있습니다. 안 도는 점검은 점검이 아닙니다 (8번).

   그리고 세션이 여럿이면 <b>같은 점검이 두 줄</b>로 들어옵니다 — 두
   세션이 각자 맨 끝에 붙이면 git 이 충돌 없이 둘 다 붙여 줍니다 (5번).

   여기서 보는 것
     · 줄마다 갈래·이름·명령 세 칸이 다 있는가
     · 가리키는 스크립트가 <b>실제로 있는가</b>
     · <b>같은 스크립트가 두 번</b> 적혀 있지 않은가
     · scripts/check-*.js 인데 목록에 <b>빠진 것</b>이 없는가
     · fast 라고 적어 놓고 브라우저를 띄우지 않는가 (그러면 빠른 갈래가 느려진다)
     · 갈래를 나눴을 때 한쪽으로 <b>쏠리지</b> 않는가                     */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('점검 목록(scripts/checks.tsv) 이 성한가\n');

const raw = fs.readFileSync(path.join(ROOT, 'scripts/checks.tsv'), 'utf8').split('\n');
const rows = [];
const shape = [];
raw.forEach((line, i) => {
  const t = line.replace(/\r$/, '');
  if (!t.trim() || t.trim().charAt(0) === '#') return;
  const p = t.split('\t');
  if (p.length < 3 || (p[0].trim() !== 'fast' && p[0].trim() !== 'web')) { shape.push(i + 1); return; }
  rows.push({ kind: p[0].trim(), name: p[1].trim(), cmd: p.slice(2).join('\t').trim(), line: i + 1 });
});

console.log('[1] 줄 모양');
is(shape.length === 0,
   '  줄마다 <b>갈래·이름·명령</b> 세 칸이 있다' +
   (shape.length ? ' ← 어긋난 줄: ' + shape.join(', ') : ''));
is(rows.length > 100, '  점검이 ' + rows.length + '가지 적혀 있다');
is(rows.every(r => r.name.length > 3),
   '  이름이 <b>빈 줄이 없다</b> — 빨간불이 떴을 때 무엇인지 알아야 한다');

console.log('\n[2] 가리키는 파일이 실제로 있다');
const fileOf = (cmd) => { const m = /scripts\/([A-Za-z0-9_.-]+\.(?:js|py))/.exec(cmd); return m ? 'scripts/' + m[1] : ''; };
const ghost = rows.filter(r => { const f = fileOf(r.cmd); return !f || !fs.existsSync(path.join(ROOT, f)); });
is(ghost.length === 0,
   '  <b>없는 파일을 가리키는 줄이 없다</b>' +
   (ghost.length ? ' ← ' + ghost.map(g => g.line + '줄: ' + g.cmd.slice(0, 50)).join(' / ') : ''));

console.log('\n[3] 같은 점검이 두 번 적혀 있지 않다 (5번)');
const seen = {}, dup = [];
rows.forEach(r => { const f = fileOf(r.cmd); if (seen[f]) dup.push(f); else seen[f] = r.line; });
is(dup.length === 0,
   '  <b>두 번 적힌 점검이 없다</b>' + (dup.length ? ' ← ' + [...new Set(dup)].join(', ') : ''));

console.log('\n[4] 만들어 놓고 목록에 안 넣은 점검이 없다');
/* 스스로를 세지 않는다. lib-* 과 도우미(analyst-*·perf-core 등)는 점검이 아니다 */
const HELPERS = /^(lib-|analyst-|perf-core|sim-core|toss-agent|gemini-model|run-checks|lane)/;
const disk = fs.readdirSync(path.join(ROOT, 'scripts'))
  .filter(f => /^check-.*\.js$/.test(f) && !HELPERS.test(f))
  .filter(f => f !== 'check-cilist.js');
const listed = new Set(Object.keys(seen).map(f => f.replace('scripts/', '')));
const orphan = disk.filter(f => !listed.has(f));
is(disk.length > 100, '  scripts 에 점검 파일이 ' + disk.length + '개 있다');
is(orphan.length === 0,
   '  <b>목록에서 빠진 점검이 없다</b> — 안 도는 점검은 점검이 아니다' +
   (orphan.length ? ' ← ' + orphan.slice(0, 8).join(', ') : ''));

console.log('\n[5] fast 라고 적은 것이 정말 브라우저를 안 띄운다');
const liar = rows.filter(r => {
  if (r.kind !== 'fast') return false;
  const f = fileOf(r.cmd);
  if (!/\.js$/.test(f)) return false;
  return /require\(['"]playwright['"]\)/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
});
is(liar.length === 0,
   '  fast 로 적힌 것 중 브라우저를 띄우는 것이 <b>없다</b>' +
   (liar.length ? ' ← ' + liar.map(x => fileOf(x.cmd)).join(', ') : ''));

console.log('\n[6] 여섯 갈래로 나눴을 때 고르게 퍼진다');
const N = 6;
const counts = [];
for (let i = 1; i <= N; i++) {
  const out = cp.execSync('node scripts/run-checks.js --shard ' + i + '/' + N + ' --list',
    { cwd: ROOT, encoding: 'utf8' });
  counts.push(+(/— (\d+)가지/.exec(out) || [0, 0])[1]);
}
const spread = Math.max.apply(null, counts) - Math.min.apply(null, counts);
is(counts.reduce((a, b) => a + b, 0) === rows.filter(r => r.kind === 'web').length,
   '  나눈 것을 다 합치면 <b>원래 수와 같다</b> — 빠지는 점검이 없다 (' + counts.join('+') + ')');
is(spread <= 2, '  갈래끼리 <b>고르다</b> — 가장 많은 곳과 적은 곳 차이 ' + spread + '가지');

console.log('\n[7] CI 가 이 목록을 실제로 읽는다');
const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/check.yml'), 'utf8');
is(/run-checks\.js --group fast/.test(yml), '  빠른 갈래를 부른다');
is(/run-checks\.js --shard \$\{\{ matrix\.shard \}\}\/6/.test(yml), '  화면 점검을 여섯으로 나눠 부른다');
is(/matrix:\s*\n\s*shard: \[1, 2, 3, 4, 5, 6\]/.test(yml), '  갈래가 여섯이다 — 목록과 같은 수');
is(!/^      - name: .*\n        run: node scripts\/check-/m.test(yml),
   '  <b>check.yml 에 점검이 직접 안 적혀 있다</b> — 두 곳에 두지 않는다 (5번)');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '개 — 점검 목록이 어긋납니다')
                : '✓ 점검 ' + rows.length + '가지가 빠짐없이 · 겹치지 않게 · 고르게 나뉩니다.');
process.exit(bad ? 1 : 0);
