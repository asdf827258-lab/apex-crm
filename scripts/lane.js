/* 갈래 — 세션 여럿이 같이 만들 때, 밀기 전에 한 번 보는 도구.

   왜 만들었나.
     · 이 저장소는 세션을 나눠 동시에 만듭니다. 실제로 한 세션이 계산기를
       고치는 동안 다른 세션이 지도를 새로 그렸고, 둘 다 app/index.html 을
       건드렸는데도 줄이 멀어 git 이 알아서 붙였습니다. 나눌 수 있습니다.
     · 그래도 매번 부딪히는 자리가 있습니다 — APP_BUILD 두 줄과
       check.yml 입니다. PR 마다 고치라는 규칙이 있어서 그렇습니다.
     · 더 무서운 것은 충돌이 아니라 「쌍둥이」입니다. 두 세션이 각자
       자기 매핑표를 만들어 넣으면 git 은 충돌 없이 둘 다 붙여 줍니다.
       FP_MAP · TOFIN_MAP 이 두 벌 되던 자리가 그것입니다.

   이것은 점검(check-*)이 아닙니다 — CI 에 넣지 않습니다.
   갈래를 넘는 PR 도 얼마든지 정당하기 때문입니다(계산기를 고치면서 그
   점검도 함께 넣습니다). 빨간불을 켜는 대신, 밀기 전에 눈으로 한 번
   보시라고 적어 줍니다. 헛것을 잡는 점검은 안 잡는 점검보다 나쁩니다.

   씁니다:  node scripts/lane.js            (main 과 견줍니다)
            node scripts/lane.js <견줄곳>   (다른 곳과 견줍니다)                     */

const { execSync } = require('child_process');

/* core.quotepath=false 가 없으면 git 이 한글 경로를 "app/\354\203\201…" 처럼
   8진수로 감싸 내놓는다. 그러면 갈래가 하나도 안 맞아 전부 「그 밖」 으로
   떨어지고, 화면에도 깨진 글자가 찍힌다. 이 저장소는 한글 경로가 많다. */
function git(cmd) {
  try {
    return execSync('git -c core.quotepath=false ' + cmd,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) { return ''; }
}

const BASE = process.argv[2] || 'origin/main';

/* 갈래 — 서로 다른 파일이면 git 이 알아서 붙입니다 */
const LANES = [
  { k: '가. 본체',       t: 'app/index.html',                 m: [/^app\/index\.html$/] },
  { k: '나. 계산기',     t: 'app/finance.html',               m: [/^app\/finance\.html$/] },
  { k: '다. 발표 덱',    t: 'app/상담자료/',                   m: [/^app\/상담자료\/(?!미끼레이더\/)/] },
  { k: '라. 미끼 레이더', t: 'app/상담자료/미끼레이더/',        m: [/^app\/상담자료\/미끼레이더\//] },
  { k: '마. 서버·소스',  t: 'netlify/functions/ · config/',   m: [/^netlify\//, /^config\//] },
  { k: '바. 지도',       t: 'app/apex-map*',                  m: [/^app\/apex-map/] },
  { k: '사. 재무설계 자료', t: 'app/재무설계/',                m: [/^app\/재무설계\//] },
  { k: '아. 그 밖',      t: '',                               m: [/./] }
];

/* 갈래마다 자기 점검을 하나씩 새로 만들고, 아래 「함께 쓰는 자리」는 따로
   알려 주므로, 둘 다 갈래로는 세지 않습니다 */
const OWN = [/^scripts\/check-[^/]+\.js$/, /^scripts\/lane\.js$/, /^\.github\//, /^CLAUDE\.md$/];

/* 모든 갈래가 함께 쓰는 자리 — 두 세션이 같이 건드리면 부딪힙니다 */
const SHARED = {
  '.github/workflows/check.yml': '새 점검 단계는 파일 맨 끝에만 붙이십시오 — 가운데 끼우면 부딪힙니다',
  'CLAUDE.md':                   '절을 새로 만들어 끝에 붙이십시오 — 있는 절을 고치면 부딪힙니다',
  'scripts/check-twins.js':      '모든 갈래가 함께 쓰는 점검입니다',
  'scripts/check-sane.js':       '모든 갈래가 함께 쓰는 점검입니다',
  'scripts/check-html.js':       '모든 갈래가 함께 쓰는 점검입니다',
  'scripts/smoke.js':            '모든 갈래가 함께 쓰는 점검입니다',
  'scripts/lane.js':             '모든 갈래가 함께 쓰는 도구입니다'
};

function laneOf(f) {
  if (OWN.some(function (r) { return r.test(f); })) return null;
  for (const L of LANES) if (L.m.some(function (r) { return r.test(f); })) return L.k;
  return '아. 그 밖';
}

/* ── 1. 어디를 건드렸나 ───────────────────────────────────────────── */
const mb = git('merge-base HEAD ' + BASE);
if (!mb) {
  console.log('\n  ' + BASE + ' 을 찾지 못했습니다. git fetch origin main 을 먼저 하십시오.\n');
  process.exit(0);
}
const files = git('diff --name-only ' + mb + '...HEAD').split('\n').filter(Boolean);
/* 아직 담지 않은 것은 diff 에 안 잡힌다. 밀기 전에 보는 도구인데 「아직
   바꾼 것이 없습니다」 라고 하면 헛말이 된다 — 담으라고 알려 준다. */
const dirty = git('status --porcelain').split('\n').filter(Boolean);

console.log('');
console.log('  갈래 — ' + git('rev-parse --abbrev-ref HEAD') + '  (견주는 곳: ' + BASE + ')');
console.log('  ' + '─'.repeat(64));

if (dirty.length) {
  console.log('  아직 담지 않은 것이 ' + dirty.length + '개 있습니다 — 담은 것만 견줍니다.');
  console.log('  git add -A && git commit  뒤에 다시 부르십시오.');
  console.log('');
}
if (!files.length) {
  console.log('  담아 둔 것 중에는 바꾼 것이 없습니다.\n');
  process.exit(0);
}

const byLane = new Map();
let own = 0;
for (const f of files) {
  const k = laneOf(f);
  if (k === null) { own++; continue; }
  if (!byLane.has(k)) byLane.set(k, []);
  byLane.get(k).push(f);
}

for (const L of LANES) {
  if (!byLane.has(L.k)) continue;
  const fs2 = byLane.get(L.k);
  console.log('  ' + L.k + (L.t ? '  (' + L.t + ')' : ''));
  for (const f of fs2.slice(0, 6)) console.log('      · ' + f);
  if (fs2.length > 6) console.log('      · … ' + (fs2.length - 6) + '개 더');
}
if (own) console.log('  갈래 밖  ' + own + '개  (내 점검 · 함께 쓰는 자리 — 갈래로 세지 않습니다)');

if (byLane.size > 1) {
  console.log('');
  console.log('  갈래 ' + byLane.size + '곳을 건드렸습니다. 잘못은 아니지만, 다른 세션이 같은 갈래에');
  console.log('  들어와 있으면 그쪽과 겹칩니다. 지금 도는 세션이 어디를 맡았는지 보십시오.');
}

/* ── 2. APP_BUILD 두 줄 ──────────────────────────────────────────── */
if (files.indexOf('app/index.html') >= 0) {
  const d = git('diff ' + mb + '...HEAD -- app/index.html').split('\n')
    .filter(function (l) { return /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l); });
  const b = d.filter(function (l) { return /^[+-]\s*var APP_BUILD/.test(l); }).length;
  console.log('');
  if (b && d.length === b) {
    console.log('  app/index.html 은 APP_BUILD 두 줄만 바꿨습니다 — 본체 갈래와 안 겹칩니다.');
  } else if (b) {
    console.log('  app/index.html 에서 APP_BUILD 를 건드렸습니다. 세션이 여럿이면 이 두 줄은');
    console.log('  거의 매번 부딪힙니다 — 충돌하면 잃을 것 없으니 나중 것으로 덮으십시오.');
  } else {
    console.log('  app/index.html 을 바꿨는데 APP_BUILD 를 안 고쳤습니다. PR 을 올릴 때는');
    console.log('  APP_BUILD 와 APP_BUILD_NOTE 두 줄을 줄 단위로 통째 교체하십시오.');
  }
}

/* ── 3. 함께 쓰는 자리 ───────────────────────────────────────────── */
const hit = files.filter(function (f) { return SHARED[f]; });
if (hit.length) {
  console.log('');
  console.log('  함께 쓰는 자리를 건드렸습니다');
  for (const f of hit) console.log('      · ' + f + '\n          ' + SHARED[f]);
}

/* ── 4. 미리 붙여 봅니다 ─────────────────────────────────────────── */
console.log('');
let clash = null;
try {
  execSync('git -c core.quotepath=false merge-tree --write-tree --name-only HEAD ' + BASE,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  clash = [];
} catch (e) {
  /* 나오는 꼴: <tree oid> · 부딪힌 파일들 · 빈 줄 · 안내문. 빈 줄에서 끊습니다 */
  const raw = String(e.stdout || '').replace(/\n+$/, '').split('\n').slice(1);
  const end = raw.indexOf('');
  clash = (end >= 0 ? raw.slice(0, end) : raw).filter(Boolean);
}
if (!clash.length) {
  console.log('  ' + BASE + ' 과 미리 붙여 봤습니다 — 충돌 없습니다. 밀어도 됩니다.');
} else {
  console.log('  ' + BASE + ' 과 부딪힙니다 — ' + clash.length + '곳');
  for (const f of clash) console.log('      · ' + f);
  console.log('');
  console.log('  git fetch origin main && git merge ' + BASE + '  로 먼저 받아 붙이십시오.');
}

/* ── 5. 쌍둥이 ───────────────────────────────────────────────────── */
console.log('');
console.log('  붙인 뒤에는 node scripts/check-twins.js 를 도십시오 — 두 세션이 각자 만든');
console.log('  같은 표는 충돌 없이 둘 다 들어옵니다. 그것을 잡는 점검입니다.');
console.log('');
