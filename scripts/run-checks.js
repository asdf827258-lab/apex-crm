/* <b>점검을 나눠 돌린다 — CI 를 한 줄에서 여러 줄로.</b>

   점검이 133가지가 되면서 CI 한 판이 <b>22분</b>이 됐습니다. 세션을 여럿
   돌려도 PR 마다 22분씩 서니, 사람을 늘려도 빨라지지 않았습니다.
   ("카테고리가 많은데 이 세션에서만 고치면 속도가 너무 느리고")

   그래서 <b>목록을 파일로 빼고</b>(scripts/checks.tsv) CI 가 그것을 <b>여섯
   갈래로 나눠</b> 동시에 돌립니다. 22분 → 5~6분.

   덤으로 <b>부딪히는 자리 하나가 없어집니다.</b> 새 점검을 넣을 때 여태
   .github/workflows/check.yml 을 고쳐야 했고, 세션이 여럿이면 거기서
   매번 부딪혔습니다. 이제는 checks.tsv 맨 끝에 <b>한 줄</b>만 붙입니다.

   쓰는 법
     node scripts/run-checks.js --group fast      브라우저 없는 것만
     node scripts/run-checks.js --shard 2/6       web 점검을 여섯으로 나눈 2번째
     node scripts/run-checks.js --list            무엇이 어디로 가는지만 본다
     node scripts/run-checks.js --only twins,nav  이름에 그 글자가 든 것만 (내 컴퓨터용)

   나누는 방법은 <b>번갈아(round-robin)</b>입니다. 앞에서부터 뭉텅이로
   자르면 느린 것끼리 한 갈래에 몰려 그 갈래만 오래 걸립니다.           */
const fs = require('fs'), path = require('path'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIST = path.join(__dirname, 'checks.tsv');

function readList() {
  const raw = fs.readFileSync(LIST, 'utf8').split('\n');
  const out = [];
  raw.forEach((line, i) => {
    const t = line.replace(/\r$/, '');
    if (!t.trim() || t.trim().charAt(0) === '#') return;
    const p = t.split('\t');
    if (p.length < 3) {
      console.error('✗ checks.tsv ' + (i + 1) + '줄 — 탭으로 세 칸이어야 합니다: ' + t.slice(0, 60));
      process.exit(2);
    }
    const kind = p[0].trim();
    if (kind !== 'fast' && kind !== 'web') {
      console.error('✗ checks.tsv ' + (i + 1) + '줄 — 갈래는 fast 나 web 입니다: ' + kind);
      process.exit(2);
    }
    out.push({ kind: kind, name: p[1].trim(), cmd: p.slice(2).join('\t').trim(), line: i + 1 });
  });
  return out;
}

const argv = process.argv.slice(2);
const argOf = (k) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] || '') : ''; };

const all = readList();
let pick = all, label = '전부';

if (argv.indexOf('--group') >= 0) {
  const g = argOf('--group');
  pick = all.filter(x => x.kind === g);
  label = g === 'fast' ? '브라우저 없는 점검' : '브라우저 점검';
} else if (argv.indexOf('--shard') >= 0) {
  const m = /^(\d+)\/(\d+)$/.exec(argOf('--shard'));
  if (!m) { console.error('✗ --shard 는 2/6 처럼 씁니다'); process.exit(2); }
  const i = +m[1], n = +m[2];
  if (i < 1 || i > n) { console.error('✗ --shard 번호가 범위 밖입니다'); process.exit(2); }
  /* 브라우저 점검만 나눈다 — fast 는 따로 한 판에 다 돈다 */
  const web = all.filter(x => x.kind === 'web');
  pick = web.filter((_, k) => (k % n) === (i - 1));
  label = '브라우저 점검 ' + i + '/' + n + '갈래';
} else if (argv.indexOf('--only') >= 0) {
  const words = argOf('--only').split(',').map(s => s.trim()).filter(Boolean);
  pick = all.filter(x => words.some(w => x.cmd.indexOf(w) >= 0 || x.name.indexOf(w) >= 0));
  label = '「' + words.join(' · ') + '」 가 든 점검';
}

if (argv.indexOf('--list') >= 0) {
  console.log(label + ' — ' + pick.length + '가지');
  pick.forEach((x, i) => console.log('  ' + String(i + 1).padStart(3) + '. [' + x.kind + '] ' + x.name));
  process.exit(0);
}

if (!pick.length) {
  console.log('돌릴 점검이 없습니다 (' + label + '). checks.tsv 를 확인하십시오.');
  process.exit(0);
}

console.log('══ ' + label + ' — ' + pick.length + '가지 ══\n');
const t0 = Date.now();
const failed = [];
pick.forEach((x, i) => {
  const head = '[' + (i + 1) + '/' + pick.length + '] ' + x.name;
  const s = Date.now();
  try {
    const out = cp.execSync(x.cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      env: Object.assign({}, process.env, { PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' }) });
    console.log('✓ ' + head + '  (' + Math.round((Date.now() - s) / 1000) + '초)');
    void out;
  } catch (e) {
    const body = ((e.stdout || '') + (e.stderr || '')).replace(/\n+$/, '');
    console.log('✗ ' + head + '  (' + Math.round((Date.now() - s) / 1000) + '초)');
    console.log('   └ ' + x.cmd);
    /* 왜 틀렸는지 <b>그 자리에서</b> 보여 준다 — 로그를 따로 뒤지지 않게 */
    body.split('\n').slice(-40).forEach(l => console.log('   │ ' + l));
    console.log('');
    failed.push(x);
  }
});

const mins = ((Date.now() - t0) / 60000).toFixed(1);
console.log('\n──────────────────────────────');
if (failed.length) {
  console.log('✗ ' + failed.length + '가지 빨간불 (' + mins + '분)');
  failed.forEach(x => console.log('   · ' + x.name + '  —  ' + x.cmd));
  process.exit(1);
}
console.log('✓ ' + pick.length + '가지 모두 통과 (' + mins + '분)');
