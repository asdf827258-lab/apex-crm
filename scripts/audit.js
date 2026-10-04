/* ══════════════════════════════════════════════════════════════════
   audit.js — <b>세션을 시작하면 제일 먼저 도는 것.</b>
              「지금 어디까지 왔나」 를 한 장으로 말합니다.

   ── 왜 만들었나 ───────────────────────────────────────────────────
   점검 221가지가 <b>모두 초록</b>인데도, 2026-09-25 에 손으로 재어 보니
   사장님이 시키신 것 몇 가지가 안 되고 있었습니다. 점검은 저마다 <b>자기가
   지키려고 만든 것</b>만 보기 때문입니다. 「사장님이 시키신 것 전부 중
   <b>몇 개가 되고 있나</b>」 를 묻는 자리가 없었습니다.

   그 자리가 여기입니다. 세 가지를 봅니다 —
     ① <b>말씀 대장</b>(docs/말씀대장.tsv) — 시키신 것과 그 상태
     ② <b>눈금</b> — 옷 안 입은 화면 · 재는 자 없는 말씀 · 서랍
     ③ <b>다음에 볼 것</b> — 반만·안됨·보류 인 줄을 그대로 펴서 보여 줍니다

   ★ <b>점검이 아닙니다</b> — CI 에 넣지 않습니다 (lane.js 와 같습니다).
     빨간불을 켜는 것은 check-ledger·check-skinmap·check-onesay 가 하고,
     여기는 <b>읽으라고</b> 모아 놓는 자리입니다.

   쓰는 법
     node scripts/audit.js          몇 초 (브라우저 없음)
     node scripts/audit.js --full   화면까지 띄워 「한 물음에 한 답」도 본다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const LED = path.join(ROOT, 'docs', '말씀대장.tsv');
const full = process.argv.indexOf('--full') >= 0;

const line = (s) => console.log(s);
const bar = () => line('─'.repeat(62));

/* ── 지금 어느 판인가 ───────────────────────────────────────────── */
let build = '(모름)', branch = '(모름)';
try {
  const src = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  build = (src.match(/var APP_BUILD='([^']+)'/) || [])[1] || build;
} catch (e) {}
try { branch = cp.execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim(); } catch (e) {}

line('');
line('  APEX 자가 점검 — ' + new Date().toISOString().slice(0, 10));
line('  판 ' + build + '  ·  가지 ' + branch);
bar();

/* ── ① 말씀 대장 ───────────────────────────────────────────────── */
let rows = [];
try {
  fs.readFileSync(LED, 'utf8').split('\n').forEach(l => {
    if (!l.trim() || l.trim()[0] === '#') return;
    const c = l.split('\t');
    rows.push({ 번호: c[0], 날짜: c[1], 말씀: c[2], 갈래: c[3], 상태: c[4], 재는법: (c[5] || '').trim(), 메모: (c[6] || '').trim() });
  });
} catch (e) { line('  ⚠ docs/말씀대장.tsv 를 못 읽었습니다 — ' + e.message); }

const cnt = (s) => rows.filter(r => r.상태 === s).length;
line('');
line('  ① 사장님이 시키신 것 ' + rows.length + '가지');
line('       됨 ' + cnt('됨') + '   ·   반만 ' + cnt('반만') + '   ·   안됨 ' + cnt('안됨') + '   ·   보류 ' + cnt('보류'));
const 맨손 = rows.filter(r => !r.재는법);
line('       재는 자가 없는 말씀 ' + 맨손.length + '가지' +
  (맨손.length ? ('  (' + 맨손.map(r => r.번호).join(' · ') + ')') : ''));

/* ── ② 눈금 ────────────────────────────────────────────────────── */
line('');
line('  ② 눈금 — 줄어야 하는 수');
const run = (cmd) => { try { return cp.execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
                       catch (e) { return ((e.stdout || '') + (e.stderr || '')).toString(); } };
const skin = run('node scripts/check-skinmap.js');
const 안입음 = (skin.match(/안 입은 화면 <b>(\d+)개/) || [])[1] || '?';
const 모두 = (skin.match(/\/ 모두 (\d+)개/) || [])[1] || '?';
const 서랍 = /서랍 바탕이 <b>목업 색표<\/b>/.test(skin) ? '밝음' : '아직 어두움';
line('       목업 옷을 안 입은 화면   ' + 안입음 + ' / ' + 모두);
line('       서랍(메뉴) 바탕          ' + 서랍);
const led = run('node scripts/check-ledger.js');
line('       말씀 대장               ' + (/^✓/m.test(led.split('\n').slice(-3).join('\n')) ? '성합니다' : '고칠 자리가 있습니다 — node scripts/check-ledger.js'));

if (full) {
  line('');
  line('  ② -2 한 물음에 한 답 (화면을 띄웁니다 — 30초쯤)');
  const one = run('node scripts/check-onesay.js');
  one.split('\n').filter(l => /✗|기준선/.test(l)).slice(0, 8).forEach(l => line('       ' + l.trim().replace(/<\/?b>/g, '')));
}

/* ── ③ 다음에 볼 것 ────────────────────────────────────────────── */
line('');
line('  ③ 다음에 볼 것 — 반만 · 안됨 · 보류');
bar();
rows.filter(r => r.상태 !== '됨').forEach(r => {
  line('  [' + r.상태 + '] ' + r.번호 + '  ' + r.말씀);
  if (r.메모) {
    const w = r.메모.match(/.{1,52}(\s|$)/g) || [r.메모];
    w.forEach((t, i) => line('        ' + (i ? '  ' : '↳ ') + t.trim()));
  }
  if (!r.재는법) line('        ⚠ 재는 자가 없습니다 — 고치시려면 점검부터 만드십시오');
  line('');
});
bar();
line('  고치신 뒤에는 대장(docs/말씀대장.tsv)의 상태와 재는 법을 같이 고쳐 주십시오.');
line('  「됨」 으로 적으려면 재는 점검이 있어야 합니다 — check-ledger 가 봅니다.');
line('');
