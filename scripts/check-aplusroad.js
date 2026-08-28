/* 다른 세션이 만든 두 가지에 <b>점검이 없었습니다.</b>

     · 예외질환 인수확인 (#299) — 24개 보험사의 실제 인수기준을 원본에서
       그대로 중계해 옵니다
     · 신입 90일 로드맵 ↔ 교재 (#301) — 두 갈래로 흩어져 있던 아카데미를
       한 길로 이었습니다

   둘 다 잘 만들어져 있는데 <b>지키는 것이 없었습니다.</b> 만든 사람이
   적어 둔 「지켜야 할 선」을 그대로 점검으로 옮깁니다 — 나중에 누가
   무심코 넘어도 그 자리에서 걸리게.

   ── 예외질환에서 지키는 것 ───────────────────────────────────────

   이것은 <b>남의 자료</b>입니다(A+에셋 공개 페이지). CLAUDE.md 9번이
   그어 둔 선이 있고, 만든 사람도 파일에 같은 말을 적어 두었습니다.

     1. <b>앱에 복제해 두지 않는다</b> — 물어볼 때마다 원본을 중계한다.
        복제해 두면 원본이 갱신돼도 옛 기준을 보여 주는데, 그 화면을 보고
        고객에게 「이 회사는 안 됩니다」 라고 말하게 된다.
     2. 화면이 <b>출처</b>를 밝히고 <b>팀 내부 조회용</b>이라 적는다
     3. <b>「심사 결과가 우선」</b> 이라고 적는다 (CLAUDE.md 2번) —
        예외 목록에 없다고 인수가 보장되는 것이 아니다
     4. <b>AI 추정이 아니라 실제 기준</b>임을 밝힌다 (1번)
     5. 못 받아 오면 <b>이유를 말한다</b> · 0건이면 0건이라 말한다
     6. 서버에 <b>시간 제한</b>과 <b>가져올 상한</b>이 있다 (7번)
     7. 브라우저가 원본을 <b>직접</b> 부르지 않는다 — 중계로만 간다
     8. <code>_redirects</code> 에 창구가 있다 — 없으면 배포에서 404 다

   ── 90일 로드맵에서 지키는 것 ────────────────────────────────────

     9. 이어 붙이는 표가 <b>한 곳</b>에 있다 (5번)
    10. 교재에 없는 주제는 <b>비워 둔다</b> — 억지로 붙이지 않는다 (1번)
    11. 90일 <b>일곱 구간</b>이 다 있다 — 하나 빠지면 그 구간이 조용히 빈다
    12. 팀원이 스스로 눌러 둔 값을 <b>안 건드린다</b>
    13. 감싼 함수가 <b>원본을 부른다</b> — 안 부르면 죽은 판이다 (5번)   */

const fs = require('fs');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const DZ  = fs.readFileSync('app/apex-aplus-disease.js', 'utf8');
const FN  = fs.readFileSync('netlify/functions/aplus-disease.js', 'utf8');
const BR  = fs.readFileSync('app/apex-bohum-bridge.js', 'utf8');
const RED = fs.readFileSync('_redirects', 'utf8');
const IDX = fs.readFileSync('app/index.html', 'utf8');
/* 주석에 적어 둔 설명을 코드로 착각하면 헛알람이 된다 (CLAUDE.md 8번) */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const DZ_C = strip(DZ), FN_C = strip(FN), BR_C = strip(BR);

console.log('\n[1] 남의 자료를 앱에 복제해 두지 않는다 — 물어볼 때마다 원본을 가져온다');
/* 질환·기준을 코드에 박아 두면 원본이 갱신돼도 옛 기준을 보여 준다.
   ※ 보험사 이름·상품구분 <b>고르는 칸</b>은 자료가 아니라 화면 항목이라 봐 준다. */
is(/fetch\(/.test(DZ_C), '  화면이 <b>물어볼 때마다</b> 서버에 부른다');
is(!/DISEASE_PRD\s*:\s*['"]/.test(DZ_C) && !/TREATMENT_PRD\s*:\s*['"]/.test(DZ_C),
   '  <b>기준값(최소경과·치료기간)을 코드에 박아 두지 않았다</b>');
is(!/aplus[_-]?cache|localStorage\.setItem\(\s*['"]aplus/.test(DZ_C),
   '  받아 온 것을 <b>기기에 쌓아 두지 않는다</b> — 갱신본이 바로 보인다');
is(/원본/.test(DZ) && /그대로/.test(DZ), '  「원본 그대로」 라고 밝힌다');

console.log('\n[2] 출처를 밝히고 · 팀 내부 조회용이라 적는다 (CLAUDE.md 9번)');
is(/자료 출처/.test(DZ), '  <b>자료 출처</b>를 화면에 적는다');
is(/A\+에셋/.test(DZ), '  누가 만든 자료인지 <b>이름을 댄다</b>');
is(/팀 내부 조회용/.test(DZ), '  <b>「팀 내부 조회용」</b> 이라고 못 박는다');
is(/고객에게 전달하는 자료로 쓰지 않습니다|고객에게 전달/.test(DZ),
   '  <b>고객에게 내보내는 자료가 아니라고</b> 적는다');

console.log('\n[3] 심사가 우선이라고 적는다 (CLAUDE.md 2번)');
is(/심사/.test(DZ) && /약관/.test(DZ),
   '  <b>보험사 심사 결과와 약관이 우선</b>이라고 적는다');
is(/예외 목록에 없다고 해서 인수가 보장되는 것은 아니/.test(DZ),
   '  <b>목록에 없다고 인수되는 것이 아니라고</b> 밝힌다 — 결론을 내지 않는다');
is(/고지/.test(DZ), '  <b>사실 그대로 고지</b>해야 한다고 적는다');
/* 한도·개월 수 같은 숫자를 우리가 적어 두면 안 된다 — 원본이 바뀌면 거짓이 된다 */
is(!/최소경과\s*[0-9]+\s*(개월|년)/.test(DZ),
   '  경과 개월 수를 <b>우리가 적어 두지 않는다</b> — 원본이 답한다 (2번)');

console.log('\n[4] AI 추정이 아니라 실제 기준이라고 밝힌다 (1번)');
/* <b>화면 글</b>에서 본다. 파일 전체를 보면 맨 위 주석에도 같은 말이 있어서,
   화면에서 지워도 초록이 떴다 — 실제로 그렇게 뚫렸다 (CLAUDE.md 8번). */
is(/AI 추정이 아니라/.test(DZ_C), '  <b>「AI 추정이 아니라 보험사가 제출한 실제 기준」</b>');

console.log('\n[5] 못 받아 오면 이유를 말한다 · 0건은 0건이라 말한다');
is(/조회에 실패했습니다/.test(DZ), '  실패하면 <b>실패했다고</b> 말한다');
is(/조회된 인수예외 기준이 없습니다/.test(DZ),
   '  0건이면 <b>없다고</b> 말한다 — 빈 화면으로 두지 않는다');
is(/질환명을 더 짧게/.test(DZ), '  <b>무엇을 해 보면 되는지</b>까지 알려 준다');

console.log('\n[6] 서버를 아껴 쓴다 — 시간 제한과 상한 (7번)');
const T = Number((FN_C.match(/TIMEOUT\s*=\s*(\d+)/) || [])[1] || 0);
is(T >= 3000 && T <= 30000, '  <b>시간 제한</b>이 사람이 기다릴 길이다 — ' + (T || '없음') + 'ms');
const MAX = Number((FN_C.match(/MAX_ROWS\s*=\s*(\d+)/) || [])[1] || 0);
is(MAX > 0 && MAX <= 2000, '  한 번에 가져올 <b>상한</b>이 있다 — ' + (MAX || '없음') + '행');
is(/LIMIT_RENDER/.test(DZ_C), '  화면에 <b>한 번에 그릴 상한</b>도 있다');

console.log('\n[7] 브라우저가 원본을 직접 부르지 않는다 — 중계로만 간다');
/* 원본은 CORS 가 닫혀 있어 직접 부르면 막힌다. 「↗ 원본 페이지」 링크는
   사람이 눌러서 새 탭으로 여는 것이라 부름이 아니다 — 그것까지 잡으면 헛알람. */
is(!/fetch\(\s*['"]https:\/\/www\.aplusga\.com/.test(DZ_C),
   '  화면이 원본 주소로 <b>직접 fetch 하지 않는다</b>');
is(/'\/api\/aplus-disease/.test(DZ_C), '  <b>우리 창구</b>(/api/aplus-disease)로 간다');
is(/aplusga\.com/.test(FN_C), '  원본을 부르는 곳은 <b>서버 한 곳</b>이다');

console.log('\n[8] 창구가 배포에 실제로 열려 있다');
is(/^\/api\/aplus-disease\s+\/\.netlify\/functions\/aplus-disease\s+200/m.test(RED),
   '  <code>_redirects</code> 에 창구가 있다 — 없으면 배포에서 404 다');
is(/apex-aplus-disease\.js/.test(IDX), '  앱이 그 화면 파일을 <b>실제로 부른다</b>');

console.log('\n[9] 90일 로드맵 — 이어 붙이는 표가 한 곳에 있다 (5번)');
is(/var ROAD_MAP\s*=\s*\[/.test(BR_C), '  90일 ↔ 교재 표(ROAD_MAP)가 있다');
is(/var STUDY_MAP\s*=\s*\[/.test(BR_C), '  공부 주제 ↔ 교재 표(STUDY_MAP)가 있다');
is((IDX.match(/var ROAD_MAP\s*=/g) || []).length === 0,
   '  그 표를 <b>앱에 또 적어 두지 않았다</b> — 두 벌이면 한쪽만 늘어난다');

console.log('\n[10] 교재에 없는 주제는 비워 둔다 — 억지로 붙이지 않는다 (1번)');
const study = (BR_C.match(/var STUDY_MAP\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
const cells = (study.match(/\{[^}]*\}/g) || []);
const empty = cells.filter(c => !/lv\s*:/.test(c)).length;
is(cells.length === 18, '  공부 주제가 <b>18개</b>다 — ' + cells.length + '개');
is(empty > 0, '  교재에 없는 주제는 <b>비워 뒀다</b> — ' + empty + '개가 빈칸 (없는 것을 있다고 안 한다)');
is(cells.length - empty > 0, '  붙일 수 있는 것은 <b>붙였다</b> — ' + (cells.length - empty) + '개');

console.log('\n[11] 90일 일곱 구간이 다 있다');
const road = (BR_C.match(/var ROAD_MAP\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
const segs = (road.match(/\[[^\]]*\]/g) || []).length;
is(segs === 7, '  구간이 <b>일곱</b>이다 (DAY 1~14 … 85~90) — ' + segs + '개');

console.log('\n[12] 팀원이 스스로 눌러 둔 값을 안 건드린다');
is(/남의 저장값을 건드리지 않는다/.test(BR),
   '  <b>남의 저장값을 안 건드린다</b>고 적어 두었다');
is(!/localStorage\.setItem\(\s*['"]apex_ck|localStorage\.setItem\(\s*['"]apex_dg/.test(BR_C),
   '  본인 점검란·하루 한 장의 저장칸에 <b>쓰지 않는다</b>');
is(/읽기만 한다|서버에 아무것도 쓰지 않는다/.test(BR),
   '  <b>읽기만 한다</b>고 밝혀 두었다');

console.log('\n[13] 감싼 함수가 원본을 부른다 — 안 부르면 죽은 판이다 (5번)');
const wraps = BR_C.match(/var wrapped\s*=\s*function[\s\S]*?\};/g) || [];
is(wraps.length >= 3, '  감싸는 자리가 ' + wraps.length + '곳이다');
const through = wraps.filter(w => /orig\s*\.\s*(apply|call)\s*\(|orig\s*\(/.test(w)).length;
is(through === wraps.length,
   '  <b>모두 원본을 그대로 부른다</b> (' + through + '/' + wraps.length + ') — ' +
   '안 부르면 감싼 화면이 통째로 죽는다');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '개 — 남의 자료를 옛 기준으로 보여 주거나, 이어 붙인 길이 끊깁니다')
                : '✓ 원본을 그때그때 가져오고 · 심사가 우선이라 밝히고 · 없는 것을 붙이지 않습니다');
process.exit(bad ? 1 : 0);
