/* ══════════════════════════════════════════════════════════════════
   check-planno.js — <b>판 번호를 내주는 자</b>(plan-no.js)가 임자를 다
                     보고, 못 본 자리를 말하나. (판 X98 · 브라우저 없음)

   ── 왜 ────────────────────────────────────────────────────────────
   이틀에 두 번 다른 세션과 같은 번호를 썼습니다 (X91 · X96 · 전에 X84).
   받아 붙이는 쪽이 번호를 밀고, 그 번호를 가리키는 자리를 손으로 따라가
   고쳤습니다. 뒷문은 이미 막혀 있습니다 — check-ledger 가 「번호가 겹치지
   않는다」 를 봅니다. 없던 것은 <b>앞문</b>이고, plan-no.js 가 그 문입니다.

   이 자가 지키는 것 —
     [1] 네 곳을 <b>다 본다</b> — 대장 줄 · checks.tsv 꼬리표 · 자들의
         머리글 · main 커밋 쪽지. 한 곳이라도 안 보면 <b>이미 쓴 번호를
         다시 내줍니다</b>.
     [2] <b>제 파일은 안 센다</b> — plan-no.js 의 쓰는 법 보기에 적힌 번호는
         임자가 아닙니다 (처음에 그것 때문에 번호가 한 칸 밀렸습니다).
     [3] <b>못 본 자리를 말한다</b> (1번) — PR 을 안 올린 갈래는 볼 길이
         없습니다. 모르는 것을 모른다고 적어야 사람이 한 번 더 봅니다.
     [4] lane.js 가 <b>그 자를 부른다</b> — 세는 셈을 두 벌로 만들지 않습니다 (5번).

   ★ 임시 저장소를 지어 <b>한 곳씩 가려</b> 봅니다 — 글자만 보면 「보는
     척」 하는 자도 통과합니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

/* 임시 저장소 — 저장소 안에 쓰지 않습니다 */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'planno-'));
function 지어(글들) {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(path.join(TMP, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(TMP, 'scripts'), { recursive: true });
  Object.keys(글들).forEach(f => fs.writeFileSync(path.join(TMP, f), 글들[f]));
}
function 물어(머리) {
  /* 자를 <b>그 저장소에서</b> 부릅니다 — cwd 를 바꿔 돌립니다 */
  const out = execFileSync(process.execPath,
    ['-e', 'const m=require(' + JSON.stringify(path.join(ROOT, 'scripts', 'plan-no.js')) +
           '); const r=m.다음(' + JSON.stringify(머리 || 'X') + ', {local:true});' +
           'process.stdout.write(JSON.stringify({다음:r.다음, 임자:Object.keys(r.임자), 눈가림:r.눈가림}));'],
    { cwd: TMP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return JSON.parse(out);
}

console.log('판 번호를 내주는 자 — 임자를 다 보나 (판 X98)');

sec('[1] 네 곳을 <b>다 본다</b> — 한 곳씩 가려 봅니다');
const 네곳 = [
  { 이름: '대장 줄',          파일: 'docs/말씀대장.tsv', 글: 'X10\t2026-10-13\t말씀\t갈래\t됨\tcheck-x\t메모\n' },
  { 이름: 'checks.tsv 꼬리표', 파일: 'scripts/checks.tsv', 글: 'fast\t어떤 자 (판 X20)\tnode scripts/check-x.js\n' },
  { 이름: '자의 머리글',       파일: 'scripts/zz.js',      글: '/* 어떤 자 (X30) */\n' }
];
네곳.forEach((c, i) => {
  const 글들 = {};
  글들[c.파일] = c.글;
  지어(글들);
  let r = null;
  try { r = 물어('X'); } catch (e) { r = null; }
  const want = [10, 20, 30][i];
  is(!!r && r.임자.indexOf('X' + want) >= 0 && r.다음 === 'X' + (want + 1),
     '  <b>' + c.이름 + '</b> 에 적힌 X' + want + ' 을 임자로 본다 → 다음 X' + (want + 1) +
     (r ? (' ← ' + r.다음 + ' · 임자 ' + r.임자.join(',')) : ' ← 못 돌았습니다'));
});

sec('[2] <b>제 파일은 안 센다</b> — 쓰는 법 보기는 임자가 아니다');
지어({ 'docs/말씀대장.tsv': 'X10\t2026-10-13\t말씀\t갈래\t됨\tcheck-x\t메모\n',
       'scripts/plan-no.js': '/* 보기 (X77) · 판 X78 */\n' });
let r2 = null; try { r2 = 물어('X'); } catch (e) {}
is(!!r2 && r2.임자.indexOf('X77') < 0 && r2.임자.indexOf('X78') < 0 && r2.다음 === 'X11',
   '  plan-no.js 안의 번호는 <b>안 센다</b> → 다음 X11' + (r2 ? (' ← ' + r2.다음) : ' ← 못 돌았습니다'));

sec('[3] <b>못 본 자리를 말한다</b> (1번)');
is(!!r2 && r2.눈가림.length > 0 && r2.눈가림.join(' ').indexOf('origin/main') >= 0,
   '  origin/main 을 못 읽으면 <b>그렇다고 적는다</b>' + (r2 ? (' ← ' + r2.눈가림.length + '가지') : ''));
let r3 = null;
try {
  r3 = JSON.parse(execFileSync(process.execPath,
    ['-e', 'const m=require(' + JSON.stringify(path.join(ROOT, 'scripts', 'plan-no.js')) +
           '); const r=m.다음("X",{local:true}); process.stdout.write(JSON.stringify({눈가림:r.눈가림}));'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
} catch (e) {}
is(!!r3 && r3.눈가림.join(' ').indexOf('--local') >= 0,
   '  원격을 안 볼 때도 <b>그렇다고 적는다</b> — 다른 세션이 쥔 번호를 모른다고');

sec('[4] <b>세는 자는 한 곳</b>이다 (5번)');
const LANE = fs.readFileSync(path.join(ROOT, 'scripts', 'lane.js'), 'utf8');
is(/require\(['"]\.\/plan-no\.js['"]\)/.test(LANE),
   '  lane.js 가 <b>plan-no.js 를 부른다</b> — 밀기 전에 번호가 눈에 든다');
is(!/판\\s\*\(\[XSH\]|대장.*split\('\\t'\)\[0\]/.test(LANE),
   '  lane.js 가 번호를 <b>따로 세지 않는다</b> — 셈이 두 벌이 되면 한쪽만 고쳐진다');
const PLAN = fs.readFileSync(path.join(ROOT, 'scripts', 'plan-no.js'), 'utf8');
is((PLAN.match(/function 모으기\(/g) || []).length === 1,
   '  임자를 모으는 자리가 <b>한 곳</b>이다');

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\n──────────────────────────────');
if (bad) { console.log('✗ ' + bad + '가지가 어긋납니다'); process.exit(1); }
console.log('✓ 번호를 내주는 자가 네 곳을 다 보고, 못 본 자리를 말합니다.');
