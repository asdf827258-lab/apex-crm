/* CRM 에 얹은 것이 <b>조용히 사라지지 않게</b>

   「지역 동선」과 「계약 후 관리」는 db-crm.html 안에 코드를 넣지 않고,
   <b>원래 전역 함수를 감싸는</b> 방식으로 붙어 있습니다. 그래서 같은 파일을
   고치는 다른 작업과 부딪히지 않습니다 — 대신 <b>대가</b>가 하나 있습니다.

     원래 이름을 바꾸면 <b>에러 없이 조용히 기능만 사라집니다.</b>

   함수 이름 하나를 고치거나, 전역을 모듈 안으로 옮기거나, script 를
   defer 로 바꾸면 — 화면은 멀쩡한데 「이 지역 열 명」이 안 뜹니다.
   아무도 모르고, 사장님만 「어제는 됐는데」 하십니다.

   그래서 <b>그 이름들을 여기 적어 두고 CI 가 지킵니다.</b> 손대야 하면
   손대되, 그때 apex-route.js · apex-care.js 도 같이 고치라고 빨간불이
   알려 줍니다.

   그리고 이미 밟은 지뢰 셋을 다시 밟지 않게 못 박습니다 —
     · 카카오가 답한 시·군·구가 <b>적힌 지역과 다르면 안 씁니다</b>
       (시험에서 「여수」가 「순천시」로 바뀌려 했습니다)
     · 밀린 사후관리를 <b>전부 띄우지 않습니다</b> — 한 사람에 한 장
     · 이동시간은 <b>어림</b>이라고 화면에 적어 둡니다                  */
const fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const HTML = R('db-crm.html');
const ROUTE = R('apex-route.js');
const CARE = R('apex-care.js');

head('[1] 두 파일을 <인라인 스크립트가 끝난 뒤에> 부른다');
is(/<script src="apex-route\.js/.test(HTML) && /<script src="apex-care\.js/.test(HTML),
   'db-crm.html 이 <apex-route.js · apex-care.js> 를 부른다');
/* let 로 선언된 전역은 <b>모듈 스코프에서 안 보인다</b> — defer 도 순서가 어긋난다 */
const tags = HTML.match(/<script src="apex-(route|care)\.js[^>]*>/g) || [];
is(tags.length === 2 && !tags.some(t => /defer|type=("|')?module/.test(t)),
   '<defer 도 type=module 도 아니다> — let 로 선언된 전역(dbs·calls·sb)이 모듈 안에서는 안 보인다');
const iRoute = HTML.indexOf('apex-route.js'), iEnd = HTML.lastIndexOf('</script>');
is(iRoute > 0 && iRoute > HTML.indexOf('function loadAll'),
   '원래 화면의 <인라인 스크립트가 끝난 뒤>에 온다 — 앞에 오면 감쌀 원본이 아직 없다');

head('[2] <감싸는 함수>가 이름 그대로 있다 — 바뀌면 조용히 기능만 사라진다');
/* 이 목록은 apex-route.js · apex-care.js 가 <b>실제로 감싸는</b> 이름들이다 */
const WRAP = ['openDb', 'saveDb', 'openCall', 'saveCall', 'toggleAppointment', 'renderTouch', 'loadAll', 'copyText'];
const gone = WRAP.filter(n => !new RegExp('function\\s+' + n + '\\s*\\(').test(HTML));
is(gone.length === 0, gone.length ? ('db-crm.html 에서 사라진 함수 — ' + gone.join(' · ')) :
   '여덟 개(' + WRAP.join(' · ') + ')가 <전역 function 선언>으로 그대로 있다');
/* 감싸는 쪽도 그 이름을 잡고 있는가 — 한쪽만 고치면 반쪽이 된다.
   <b>이름 끝을 못 박는다</b> — 글자만 겹쳐 보면 window.loadAll<b>X</b> 도
   「있다」고 답해 버린다. 안 울리는 알람은 알람이 아니다 (8번). */
const unwrapped = WRAP.filter(n => !new RegExp('window\\.' + n + '\\b').test(ROUTE + CARE));
is(unwrapped.length === 0, unwrapped.length ? ('감싸는 쪽이 안 잡는 이름 — ' + unwrapped.join(' · ')) :
   '감싸는 쪽도 <같은 이름>을 잡고 있다');

head('[3] <읽기만 하는 이름>이 그대로 있다');
/* 선언 꼴이 제각각이다 — <b>function</b> 도 있고 <b>화살표 상수</b> 도 있다.
   여기서 보는 것은 「어떻게 선언했나」가 아니라 <b>그 이름이 전역에 있나</b> 다.
   꼴만 보고 잡으면 멀쩡한 코드에 빨간불이 켜진다 (8번). */
const HELP = ['$', 'esc', 'fmt', 'toast'];
const decl = (n) => new RegExp(
  '(^|[\\s;{])(function\\s+' + n + '\\s*\\(|(const|let|var)\\s+' + n.replace('$', '\\$') + '\\s*=)', 'm');
const noHelp = HELP.filter(n => !decl(n).test(HTML));
is(noHelp.length === 0, noHelp.length ? ('도우미가 사라졌다 — ' + noHelp.join(' · ')) :
   '도우미($ · esc · fmt · toast)가 그대로 있다');
const READ = ['stageOf', 'nextAppt', 'getCalls', 'result', 'pname'];
const noRead = READ.filter(n => !new RegExp('function\\s+' + n + '\\s*\\(').test(HTML));
is(noRead.length === 0, noRead.length ? ('읽는 함수가 사라졌다 — ' + noRead.join(' · ')) :
   '읽는 함수(' + READ.join(' · ') + ')가 그대로 있다');
/* 상태는 <b>한 줄에 let 으로</b> 선언돼 있다. 클로저·모듈 안으로 옮기면
   감싸는 파일에서 안 보인다 — 에러도 안 나고 그냥 빈 목록이 된다. */
const STATE = ['sb', 'profile', 'profiles', 'dbs', 'calls'];
const noState = STATE.filter(n => !new RegExp('(^|[\\s,;])(let|var)\\s+[^\\n]*\\b' + n + '\\b\\s*[=,;]', 'm').test(HTML));
is(noState.length === 0, noState.length ? ('전역 상태가 안 보인다 — ' + noState.join(' · ')) :
   '상태(' + STATE.join(' · ') + ')가 <전역>으로 선언돼 있다 — 모듈 안으로 옮기면 안 보인다');

head('[4] <DOM id> 가 그대로 있다');
const IDS = ['dbModal', 'dbId', 'customerName', 'phone', 'region', 'dbStage',
             'callModal', 'callDbId', 'callResult', 'appointmentAt', 'appointmentField',
             'touchBody', 'touchBadge'];
const noId = IDS.filter(n => !new RegExp('id=("|\')' + n + '("|\')').test(HTML));
is(noId.length === 0, noId.length ? ('사라진 id — ' + noId.join(' · ')) :
   'id ' + IDS.length + '개가 그대로 있다 (dbModal · callModal · touchBody …)');

head('[5] <단계 이름>이 양쪽에서 같은 글자다 — 문자열로 견준다');
const STAGE = ['미접촉', 'TA', 'AP', 'PC', 'CS', '계약완료', '증권전달'];
const noStage = STAGE.filter(s => !HTML.includes("'" + s + "'") && !HTML.includes('"' + s + '"'));
is(noStage.length === 0, noStage.length ? ('db-crm.html 에서 사라진 단계 — ' + noStage.join(' · ')) :
   '단계 일곱(' + STAGE.join(' · ') + ')이 db-crm.html 에 있다');
const useStage = ['AP', 'PC', 'CS', '계약완료'];
const noUse = useStage.filter(s => !(ROUTE + CARE).includes(s));
is(noUse.length === 0, noUse.length ? ('감싸는 쪽이 모르는 단계 — ' + noUse.join(' · ')) :
   '감싸는 쪽도 <같은 글자>로 견준다');

head('[6] 기능 코드를 <db-crm.html 안에 넣지 않았다>');
/* 그 파일은 여러 세션이 동시에 고친다. 기능이 거기 들어가면 부딪힌다. */
const OWN = ['__APEX_ROUTE__', '__APEX_CARE__', 'regionText', 'candidates', 'fitIn'];
const leaked = OWN.filter(n => HTML.includes(n));
is(leaked.length === 0, leaked.length ? ('db-crm.html 로 새어 들어간 것 — ' + leaked.join(' · ')) :
   'db-crm.html 은 <script 두 줄>만 늘었다 — 기능은 새 파일에 있다');

head('[7] 이미 밟은 <지뢰>를 다시 밟지 않는다');
/* ① 카카오가 답한 시·군·구가 적힌 지역과 다르면 안 쓴다 */
is(/다른 데/.test(ROUTE) && /절대 바꾸지 않습니다|손대지 않습니다/.test(ROUTE),
   '<적힌 지역과 다른 데가 나오면 안 쓴다> — 「여수」가 「순천시」로 바뀌려 했던 자리');
/* ② 밀린 사후관리를 전부 안 띄운다 */
is(/한 장만/.test(CARE) && /지나갔습니다/.test(CARE),
   '밀린 사후관리를 <전부 안 띄운다> — 한 사람에 한 장, 지나간 것은 한 줄로');
/* ③ 이동시간은 어림이라고 적는다 */
is((ROUTE.match(/어림/g) || []).length >= 2,
   '이동시간을 <「어림」이라고> 화면에 적는다 — 직선거리 기반이다');
/* ④ 새 창은 styles() 를 먼저 부른다 */
is((ROUTE.match(/styles\(\)/g) || []).length >= 3,
   '창을 열 때 <styles() 를 먼저> 부른다 — 지도를 한 번도 안 연 사용자에게 CSS 없이 뜬다');

head('[8] 칸이 없는 서버에서 <스스로 접는다>');
const FLAGS = ['HAS_DB', 'HAS_CALL', 'HAS_STD'];
const noFlag = FLAGS.filter(f => !ROUTE.includes(f));
is(noFlag.length === 0, noFlag.length ? ('없어진 스위치 — ' + noFlag.join(' · ')) :
   '마이그레이션 전에도 <그 부분만 끄는> 스위치가 있다 (' + FLAGS.join(' · ') + ')');
is(/HAS_CARE/.test(CARE), '사후관리도 <칸이 없으면> 표시만 이 브라우저에 남긴다');

head('[9] 마이그레이션 SQL 이 <여러 번 돌려도 안전>하다 · -- 주석을 안 쓴다');
['migration_46_db_geo.sql', 'migration_47_region_std.sql', 'migration_48_care.sql'].forEach(f => {
  const s = R(f);
  /* 9번 — SQL 은 -- 주석을 쓰지 않는다. /* * / 만 쓴다 */
  const dash = s.split('\n').filter(l => /(^|\s)--/.test(l)).length;
  is(dash === 0, dash ? (f + ' 에 <-- 주석>이 ' + dash + '줄 있다 (9번)') : f + ' — <-- 주석>이 없다');
  is(/if not exists|IF NOT EXISTS|or replace|OR REPLACE/.test(s),
     f + ' — <여러 번 돌려도 안전>하다 (if not exists / or replace)');
});

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
  'CRM 감싸기 점검 통과 — 이름을 바꾸면 여기서 먼저 빨간불이 켜집니다.');
process.exit(bad ? 1 : 0);
