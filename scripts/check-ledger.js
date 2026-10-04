/* ══════════════════════════════════════════════════════════════════
   check-ledger.js — <b>말씀 대장</b>(docs/말씀대장.tsv)이 살아 있나.

   ── 왜 이것이 필요한가 ────────────────────────────────────────────
   사장님이 시키신 것은 <b>대화 속</b>에 있습니다. 세션이 끝나면 그 기억은
   사라지고, 다음 세션은 <b>코드만</b> 보고 「이만하면 됐다」고 판단합니다.
   실제로 2026-09-25 에 점검 218가지가 모두 초록인데도, 손으로 재어 보니
   「오늘 누구부터」 를 두 곳이 다르게 답하고 있었습니다. <b>아무 점검도
   그것을 보고 있지 않았기 때문</b>입니다.

   그래서 말씀을 <b>파일로</b> 남깁니다. 그리고 이 점검이 그 파일을 지킵니다 —
     [1] 칸이 일곱이고 상태가 넷 중 하나인가
     [2] <b>「됨」 이라고 적으려면 재는 자가 있어야 한다</b> — 이것이 핵심입니다.
         재는 자 없이 「됐다」 고 적어 두면 그 줄은 <b>믿을 수 없는 줄</b>입니다
     [3] 「재는 법」 에 적은 점검이 <b>정말로 있나</b> — 없는 이름을 적어 두면
         거짓 안심이 됩니다
     [4] 「반만 · 안됨 · 보류」 는 <b>무엇이 막고 있는지</b> 메모가 있어야 한다
     [5] <b>재는 자가 하나도 없는 말씀</b>이 몇 개인가 — 기준선을 넘으면 빨간불

   ★ 대장에 글자를 더 적는 것으로는 초록이 안 됩니다. 「됨」 으로 바꾸려면
     <b>그것을 재는 점검을 먼저 만들어야</b> 합니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const LED = path.join(ROOT, 'docs', '말씀대장.tsv');
const TSV = path.join(ROOT, 'scripts', 'checks.tsv');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ⚠ 2026-09-25 — 아직 <b>재는 자가 없는 말씀 3개</b>입니다.
     S09 toss 이름 · X04 만기 D-30 · X05 예상업적 알람 숫자
   셋 다 「무엇이 막고 있는지」 는 메모에 적혀 있습니다. 재는 자를 만들면
   이 수를 같이 내려 주십시오 — <b>늘면 빨간불</b>입니다. */
const BASE = { 재는자없음: 3 };
const 상태들 = ['됨', '반만', '안됨', '보류'];

console.log('\n[1] 대장이 <b>읽히고</b> 칸이 일곱이다');
if (!fs.existsSync(LED)) {
  is(false, '  docs/말씀대장.tsv 가 없습니다 — 말씀을 적어 두는 자리입니다');
  console.log('\n✗ 1개'); process.exit(1);
}
const raw = fs.readFileSync(LED, 'utf8').split('\n');
const rows = [];
raw.forEach((l, i) => {
  if (!l.trim() || l.trim().indexOf('#') === 0) return;
  const c = l.split('\t');
  rows.push({ 줄: i + 1, 번호: c[0] || '', 날짜: c[1] || '', 말씀: c[2] || '',
              갈래: c[3] || '', 상태: c[4] || '', 재는법: (c[5] || '').trim(), 메모: (c[6] || '').trim(), 칸: c.length });
});
is(rows.length > 0, '  말씀 ' + rows.length + '개를 읽었다');
const 칸틀림 = rows.filter(r => r.칸 !== 7);
is(칸틀림.length === 0, '  줄마다 칸이 <b>일곱</b>이다' +
  (칸틀림.length ? (' ← ' + 칸틀림.map(r => r.줄 + '줄(' + r.칸 + '칸)').join(' · ')) : ''));

console.log('\n[2] 번호가 <b>겹치지 않는다</b>');
const 본번호 = {}, 겹침 = [];
rows.forEach(r => { if (본번호[r.번호]) 겹침.push(r.번호); 본번호[r.번호] = 1; });
is(겹침.length === 0, '  번호 ' + Object.keys(본번호).length + '개가 다 다르다' +
  (겹침.length ? (' ← ' + [...new Set(겹침)].join(' · ')) : ''));

console.log('\n[3] 상태는 <b>넷 중 하나</b>다 — ' + 상태들.join(' · '));
const 낯선상태 = rows.filter(r => 상태들.indexOf(r.상태) < 0);
is(낯선상태.length === 0, '  낯선 상태 ' + 낯선상태.length + '개' +
  (낯선상태.length ? (' ← ' + 낯선상태.map(r => r.번호 + ':' + r.상태).join(' · ')) : ''));
상태들.forEach(s => {
  const n = rows.filter(r => r.상태 === s).length;
  console.log('      ' + s + ' ' + n + '개');
});

console.log('\n[4] 「재는 법」 에 적은 점검이 <b>정말로 있다</b>');
const 있는점검 = {};
fs.readFileSync(TSV, 'utf8').split('\n').forEach(l => {
  const m = l.match(/scripts\/(check-[\w-]+)\.(?:js|py)/);
  if (m) 있는점검[m[1]] = 1;
});
const 없는이름 = [];
rows.forEach(r => {
  if (!r.재는법 || r.재는법 === '손으로') return;
  r.재는법.split(/\s+/).filter(Boolean).forEach(nm => {
    if (nm === '손으로') return;
    if (!있는점검[nm]) 없는이름.push(r.번호 + ' → ' + nm);
  });
});
is(없는이름.length === 0,
  '  checks.tsv 에 <b>없는 점검 이름</b> ' + 없는이름.length + '개' +
  (없는이름.length ? (' ← ' + 없는이름.slice(0, 6).join(' · ')) : '') +
  ' (점검 ' + Object.keys(있는점검).length + '가지 중에서 찾았다)');

console.log('\n[5] <b>「됨」 이라고 적으려면 재는 자가 있어야 한다</b> ← 여기가 이 점검의 뼈대');
const 헛됨 = rows.filter(r => r.상태 === '됨' && !r.재는법);
is(헛됨.length === 0,
  '  재는 자 없이 「됨」 이라고 적은 줄 ' + 헛됨.length + '개' +
  (헛됨.length ? (' ← ' + 헛됨.map(r => r.번호).join(' · ') + ' — 점검을 먼저 만드십시오') : ''));

console.log('\n[6] <b>안 된 것은 무엇이 막는지</b> 적혀 있다 (1번 — 「안 됩니다」 만 적으면 고장으로 보인다)');
const 까닭없음 = rows.filter(r => ['반만', '안됨', '보류'].indexOf(r.상태) >= 0 && !r.메모);
is(까닭없음.length === 0,
  '  까닭을 안 적은 줄 ' + 까닭없음.length + '개' +
  (까닭없음.length ? (' ← ' + 까닭없음.map(r => r.번호).join(' · ')) : ''));

console.log('\n[7] <b>재는 자가 하나도 없는 말씀</b>이 몇 개인가');
const 맨손 = rows.filter(r => !r.재는법);
is(맨손.length <= BASE.재는자없음,
  '  재는 자 없는 말씀 ' + 맨손.length + '개 — 기준선 ' + BASE.재는자없음 +
  (맨손.length ? (' · ' + 맨손.map(r => r.번호).join(' · ')) : '') +
  (맨손.length > BASE.재는자없음 ? ' ← 늘었습니다. 말씀을 더 적으셨으면 재는 자도 같이 만드십시오'
   : (맨손.length < BASE.재는자없음 ? ' (줄었습니다 — 기준선도 같이 내려 주십시오)' : '')));

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '개 — 말씀 대장이 제 구실을 못 합니다')
                : '✓ 말씀 ' + rows.length + '개가 저마다 재는 자를 달고 있습니다.');
process.exit(bad ? 1 : 0);
