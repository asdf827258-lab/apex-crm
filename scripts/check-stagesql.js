/* ══ 🚦 check-stagesql — 앱의 단계 표와 서버의 단계 규칙이 같은가 (판 X394) ═════════════
   사장님 말씀 (2026-11-10) 「오늘에서 안되는 것들 찾아서 다시 하고 다시 확인해줄래」.

   ⚠ 재어 보니 앱의 단계 표(apex-stage.js · ORDER)는 열 가지인데 서버 규칙
     (dbs_stage_chk · migration_41)은 일곱 가지만 받았습니다. 홈 「💬 소개 받음」(소개완료) ·
     「🕗 ✖ 거절로 정리」(거절) · CRM 에서 그 단계를 고를 때 서버가 통째로 거절했고,
     2026-11-09 오후에만 실제로 9번 막혔습니다(postgres 로그). 화면 점검은 가짜 서버로
     돌아 <b>이것을 볼 길이 없었습니다</b> — 그래서 글(파일)끼리 맞대어 봅니다.

   보는 것
     [1] 저장소의 migration 가운데 dbs_stage_chk 를 <b>마지막으로</b> 거는 파일(번호가 제일 큰 것)이
         앱 단계 표의 <b>모든 단계</b>를 받는가
     [2] dbs_stage_chk 를 거는 <b>모든</b> migration 이 그런가 — 옛 파일을 다시 돌리면 도로 막히지 않게
   ⚠ 되돌림 — migration_55 에서 「소개완료」 를 빼면 [1] 이 웁니다.
   ⚠ 이 자는 <b>저장소의 SQL</b> 을 봅니다. 서버에 정말 걸렸는지는 못 봅니다 — 걸린 값은
     판 X394 에서 사장님 계정 권한으로 써 보고 되돌려(ROLLBACK) 확인했습니다(대장에 적음).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const st = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
const om = st.match(/var ORDER=\[([^\]]+)\]/);
const ORDER = om ? om[1].split(',').map(x => x.trim().replace(/^'|'$/g, '')) : [];
console.log('\n앱의 단계 표 (apex-stage.js) — ' + ORDER.join(' · '));
is(ORDER.length >= 7, '  단계 표를 읽었다 — ' + ORDER.length + '가지');

/* migration 파일에서 dbs_stage_chk 의 받는 값을 꺼냅니다 */
const files = fs.readdirSync(ROOT).filter(f => /^migration_\d+.*\.sql$/.test(f));
const defs = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /add constraint dbs_stage_chk[\s\S]*?stage in\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(s))) {
    const vals = m[1].split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
    defs.push({ f, n: +(f.match(/^migration_(\d+)/) || [0, 0])[1], vals });
  }
}
defs.sort((a, b) => a.n - b.n || a.f.localeCompare(b.f));
console.log('\n[1] 마지막으로 거는 규칙이 앱의 단계를 다 받나');
is(defs.length >= 1, '  dbs_stage_chk 를 거는 migration — ' + defs.map(d => d.f).join(' · '));
const last = defs[defs.length - 1];
const miss = last ? ORDER.filter(x => last.vals.indexOf(x) < 0) : ORDER;
is(!!last && miss.length === 0, '  ★★ ' + (last ? last.f : '(없음)') + ' — 빠진 단계 ' + (miss.join(' · ') || '없음') +
   (miss.length ? ' ← 이 단계를 고르면 서버가 거절합니다' : ''));

console.log('\n[2] 그 규칙을 거는 <b>모든</b> migration 이 그런가 (옛 파일을 다시 돌려도 안 막히게)');
for (const d of defs) {
  const mm = ORDER.filter(x => d.vals.indexOf(x) < 0);
  is(mm.length === 0, '  ' + d.f + ' — 빠진 단계 ' + (mm.join(' · ') || '없음'));
}

console.log('\n' + (bad ? ('✗ ' + bad + '가지 — 앱이 쓰는 단계를 서버가 안 받습니다') : '✓ 앱의 단계 표와 서버의 단계 규칙이 같습니다'));
process.exit(bad ? 1 : 0);
