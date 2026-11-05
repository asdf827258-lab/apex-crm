/* 🧭 <b>상품전략기 · 월간 상품 인사이트</b> — 덮개로 열리나 · 쪽이 성한가 ·
   고객 제시 금지 자료가 검색에 안 걸리나 · 색을 또 적지 않나.

   판 X350 · 사장님 말씀 2026-11-05 —
   「이걸 디자인을 다시 짜서 메인세션과 넣자. 메인세션과 동일하게 테마 폰트를 짜봐」
   → 「메뉴에 따로 상품전략기 어때」

   ★ 몸(app/insight/)은 이 저장소에서 만들지 않습니다. 사장님 PC 의 apex-insight
     빌드가 달마다 crm/ 폴더로 뽑고, 그 폴더를 <b>그대로</b> 옮겨 놓습니다.
     그래서 이 자는 <b>옮겨 놓은 것이 성한가</b>만 봅니다 — 그림이 빠지지 않았나,
     noindex 가 붙었나, ui.css 를 가리키나.
   ⚠ 소식지는 판매인 교육용 · <b>고객 제시 금지</b> 자료입니다. 정적 파일이라 주소를
     알면 열리므로 적어도 검색엔진에는 안 걸리게 둡니다 — [2] 가 지킵니다.

   ── 보는 것 ─────────────────────────────────────────────────
     [1] 덮개 — 메뉴 · 덮개 이름 · go() · ESC · 주소가 다 있고 주소가 실제 파일이다
     [2] 쪽 — noindex · ../ui.css · 「고객 제시 불가」 머리글
     [3] 그림 — 쪽이 부르는 img/… 가 하나도 안 빠졌다
     [4] 글씨 — 13px 밑 글씨를 CSS 에 적지 않았다 (앱 바닥)
   브라우저를 안 띄웁니다 — 몇 초면 끝납니다.                                   */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const DIR = path.join(ROOT, 'app/insight');
const PAGE = path.join(DIR, 'index.html');

console.log('🧭 상품전략기 · 월간 상품 인사이트 (판 X350)');

sec('[1] 덮개로 열리고 다시 벗겨진다');
is(/\{group:'상담 도구',items:\[[\s\S]{0,900}?\{id:'insight',icon:'🧭',title:'상품전략기'/.test(SRC), '「상담 도구」 맨 위에 <b>「🧭 상품전략기」</b> 칸이 선다 (따로 선 묶음은 서랍 900px 를 넘어 걷었습니다)');
is(/'insight-mode'\]/.test(SRC), '덮개 이름(insight-mode)이 OS_FULL_MODES 끝에 있다 — 빠지면 「← 워크스페이스」 가 껍데기를 못 벗깁니다');
is(/if\(tab==='insight'\)\{\s*mountInsight\(\);\s*osFullMode\('insight-mode'\);/.test(SRC), 'go(\'insight\') 가 덮개를 연다');
is(/contains\('insight-mode'\)\)exitInsight\(\)/.test(SRC), 'ESC 로 닫힌다');
const um = SRC.match(/var INSIGHT_URL='([^']+)'/);
is(!!um, 'INSIGHT_URL 이 <b>한 곳</b>에 적혀 있다');
is(!!um && fs.existsSync(path.join(ROOT, 'app', um[1])), '그 주소가 실제 파일이다 — ' + (um ? 'app/' + um[1] : '(없음)'));
is((SRC.match(/var INSIGHT_URL=/g) || []).length === 1, '주소는 한 벌이다 (5번)');

sec('[2] 쪽 — 검색에 안 걸리고 · 색은 ui.css 에서 온다');
const H = fs.existsSync(PAGE) ? fs.readFileSync(PAGE, 'utf8') : '';
is(H.length > 0, 'app/insight/index.html 이 있다 (' + Math.round(H.length / 1024) + 'KB)');
is(/<meta name="robots" content="noindex,nofollow">/.test(H), '<b>noindex</b> 가 붙었다 — 고객 제시 금지 자료입니다');
const st = H.indexOf('</style>'), ln = H.indexOf('<link rel="stylesheet" href="../ui.css">');
is(ln > 0 && ln > st, '<b>../ui.css</b> 를 스타일 <b>뒤에서</b> 문다 — CRM 토큰이 이깁니다 (5번)');
is(H.indexOf('고객 제시 불가') >= 0, '머리에 「판매인 교육용 · 고객 제시 불가」 가 있다');

sec('[3] 그림이 하나도 안 빠졌다');
const refs = Array.from(new Set((H.match(/img\/\d{4}-\d{2}\/[A-Za-z0-9_.-]+\.(?:jpg|webp)/g) || [])));
const miss = refs.filter(r => !fs.existsSync(path.join(DIR, r)));
is(refs.length > 0, '쪽이 부르는 그림 <b>' + refs.length + '장</b>을 찾았다 (0장이면 이 자가 고장)');
is(miss.length === 0, '빠진 그림 0장' + (miss.length ? ' ← ' + miss.slice(0, 3).join(' · ') : ''));

sec('[4] 글씨 — 13px 밑을 적지 않았다');
const css = H.slice(0, st > 0 ? st : 0);
const small = (css.match(/font-size:\s*(?:[0-9]|1[0-2])(?:\.\d+)?px/g) || []);
is(small.length === 0, 'CSS 에 13px 밑 글씨 0곳' + (small.length ? ' ← ' + small.slice(0, 4).join(' · ') : ''));

console.log('\n──────────────────────────────');
console.log(bad ? '✗ ' + bad + '개 — 상품 인사이트가 약속을 못 지키고 있습니다.'
               : '✓ 상품 인사이트가 덮개로 열리고, 그림이 다 있고, 검색에는 안 걸립니다.');
process.exit(bad ? 1 : 0);
