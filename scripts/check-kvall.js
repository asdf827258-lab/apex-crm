/* 🔑 <b>앱이 쓰는 열쇠를 하나도 빠짐없이 걸어 본다</b> (판 X465 · 2026-11-17)

   사장님 말씀 (2026-11-15 · 판 X449) —
     「현재 컴퓨터에서 저장하고, 노트북 [<b>다른 곳에서 열면 안 보이는 것들이
      있어서는 안 되</b>] 전체적으로 모든 내용이 공유 되도록 만들자.
      반대로 노트북 핸드폰에서 저장해도, 어디서든 공유되어야되 "우리 APEX-PRO" <b>모든게</b>」
   그리고 2026-11-17 — 「이거 전에 요청했는데 <b>다시 확인해봐</b>」.

   ⚠⚠ <b>이 자는 약속만 되어 있고 없었습니다.</b> apex-kv-sync.js 의 쪽지가
     「적은 수와 전체 수를 <b>check-kvall 이 찍어 낡으면 보이게</b> 합니다」 라고
     적어 두었는데, 그 파일이 <b>한 번도 만들어지지 않았습니다</b>. 그래서
     apex_ 이름 밖의 열쇠가 늘어도 아무도 몰랐고, 재어 보니 <b>일하는 값 셋</b>이
     기기에만 남고 있었습니다(🏠 출발지 · ⏱ 상담 분 · ✅ 챙긴 표시).
     <b>쪽지는 알람이 아닙니다</b> (8번).

   ── 이 자가 보는 것 ────────────────────────────────────────────
     [1] 열쇠를 <b>하나도 안 빠뜨리고</b> 긁는다 — app/ 과 <b>저장소 뿌리</b>
         (apex-route.js · apex-care.js · db-crm.html 이 거기 있습니다)
     [2] 나누는 규칙은 <b>apex-kv-sync.js 의 그 함수 그대로</b>를 떼어 씁니다 (5번)
     [3] ★★ apex_ 이름 밖인데 안 올라가는 열쇠는 <b>저마다 까닭이 적혀</b> 있나 —
         새 열쇠가 늘면 <b>까닭을 적게</b> 울립니다. 조용히 안 올라가는 자리를
         못 만들게 하는 것이 이 자의 일입니다
     [4] ★ 사장님이 정하신 값 셋이 <b>정말 올라가나</b>
     [5] ★ 비밀은 <b>여전히 막히나</b> — 주민번호 · 금고 · 열쇠 · 토큰 (3번·10번)

   ★ 서버를 한 번도 안 부릅니다 — 글만 읽습니다 (7번·8번).                */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

/* ══ 나누는 규칙 — apex-kv-sync.js 에서 <b>떼어 옵니다</b> (5번) ═══════════
   여기에 베껴 적으면 한쪽만 늙습니다. 실제로 쓰는 그 글을 그대로 실행합니다. */
const SYNC = fs.readFileSync(path.join(ROOT, 'app/apex-kv-sync.js'), 'utf8');
function 떼(머리, 끝) {
  const i = SYNC.indexOf(머리);
  if (i < 0) throw new Error('apex-kv-sync.js 에서 못 찾았습니다 — ' + 머리);
  const j = SYNC.indexOf(끝, i);
  return SYNC.slice(i, j + 1);
}
let kindOf;
try {
  const 규칙 = [
    떼('var ORG_KEYS=', ';'),
    떼('var NEVER_EXACT=', ']') + ';',
    떼('var NEVER_PRE=', ']') + ';',
    떼('var NEVER_WORD=', ';'),
    떼('var ALSO_EXACT=', ']') + ';',
    떼('var ALSO_PRE=', ']') + ';',
    SYNC.slice(SYNC.indexOf('function kindOf(k){'), SYNC.indexOf('var LS=null;'))
  ].join('\n');
  kindOf = new Function(규칙 + '\nreturn kindOf;')();
} catch (e) {
  console.log('  ✗ 규칙을 떼어 오지 못했습니다 — ' + e.message);
  process.exit(1);
}

/* ══ 열쇠 긁기 ═══════════════════════════════════════════════════════ */
const 파일 = [];
(function 걷(d) {
  for (const n of fs.readdirSync(d)) {
    if (n === 'node_modules' || n === '.git' || n[0] === '.') continue;
    const f = path.join(d, n);
    if (fs.statSync(f).isDirectory()) 걷(f);
    else if (/\.(html|js)$/.test(n)) 파일.push(f);
  }
})(path.join(ROOT, 'app'));
/* ⚠ <b>app/ 만 보면 놓칩니다</b> — apex-route.js · apex-care.js · db-crm.html 은
   저장소 <b>뿌리</b>에 있습니다. 처음에 app/ 만 긁어 열쇠 열을 못 봤습니다 (8번). */
for (const n of fs.readdirSync(ROOT)) {
  if (/\.(html|js)$/.test(n)) 파일.push(path.join(ROOT, n));
}

const 열쇠 = new Map();
const 담 = (k, f) => {
  if (!k) return;
  if (!열쇠.has(k)) 열쇠.set(k, new Set());
  열쇠.get(k).add(path.relative(ROOT, f));
};
const 글 = /(?:localStorage|LS|sessionStorage)\s*\.\s*(?:setItem|removeItem|getItem)\s*\(\s*(['"`])([^'"`]*)\1/g;
const 변 = /var\s+[A-Za-z_$][\w$]*\s*=\s*(['"])((?:apex_|apex[A-Z]|ba_|wk_|utp_|s6_|kd|mikki_|bohum_)[\w.\-]*)\1/g;
for (const f of 파일) {
  const t = fs.readFileSync(f, 'utf8');
  let m;
  글.lastIndex = 0; while ((m = 글.exec(t))) 담(m[2], f);
  변.lastIndex = 0; while ((m = 변.exec(t))) 담(m[2], f);
}

/* ══ apex_ 이름 밖인데 <b>안 올라가는</b> 열쇠 — 저마다 까닭을 적습니다 ══════
   ★ 새 열쇠가 늘면 여기 없어서 <b>울립니다</b>. 그때 사람이 「올려야 하는 값인가,
     캐시인가, 보기 취향인가, 비밀인가」 를 정해 한 줄 적습니다. 그것이 이 자의
     일 전부입니다 — 조용히 안 올라가는 자리를 못 만들게 합니다 (1번). */
const 까닭 = {
  '__apex_probe'        : '떠보기 — 저장이 되는지 넣었다 바로 지웁니다',
  '__hx'                : '떠보기 — 저장이 되는지 넣었다 바로 지웁니다',
  'jv_boot'             : '세션만 — 창을 닫으면 사라집니다',
  'gemini_api_key'      : '🔒 비밀 — API 열쇠 (10번)',
  'apexKakaoKeyV1'      : '🔒 비밀 — 지도 열쇠 (10번)',
  'apexSupabaseConfigV1': '🔒 비밀 — 서버 주소·열쇠 (10번)',
  'apexGeoCacheV1'      : '캐시 — 주소→좌표. 다시 만들어지고 커집니다 (7번)',
  'apexRegionCacheV1'   : '캐시 — 지역. 다시 만들어집니다 (7번)',
  'apexRouteKmV1'       : '캐시 — 구간 거리. 다시 만들어지고 커집니다 (7번)',
  'apexRouteMapOnV1'    : '보기 취향 — 지도를 켜 두나',
  'apexRouteViewV1'     : '보기 취향 — 어느 보기인가',
  'apexTaOpen'          : '보기 취향 — 대본 칸을 펴 두었나',
  'apex-insight-tab'    : '보기 취향 — 어느 탭이었나 (apex_last_tab 과 같은 갈래)',
  'kdTheme'             : '보기 취향 — 덱 밝기 (kdCost 등 자료는 올라갑니다)',
  'bohum_device'        : '이 기기 — 기기 번호라 기기마다 달라야 합니다',
  'bohum_tester'        : '이 기기 — 시험용 표시',
  'ba_state'            : '열쇠가 아닙니다 — 서버 표(saved_reports)의 갈래 이름입니다',
  'ta_fsz'              : '보기 취향 — TA 대본 글자 크기'
};

const 올림 = [], 막힘 = [];
[...열쇠.keys()].sort().forEach(k => {
  (kindOf(k) ? 올림 : 막힘).push(k);
});
const 밖막힘 = 막힘.filter(k => k.indexOf('apex_') !== 0);

sec('[1]·[2] 열쇠를 <b>하나도 안 빠뜨리고</b> 긁고, <b>그 규칙 그대로</b> 걸었다');
is(파일.length > 100, '  파일 ' + 파일.length + '개를 읽었다');
is(열쇠.size > 140, '  열쇠 ' + 열쇠.size + '가지를 찾았다 — 올라감 ' + 올림.length +
   ' · 안 올라감 ' + 막힘.length);
is(파일.some(f => /apex-route\.js$/.test(f)),
   '  ★ <b>저장소 뿌리</b>도 읽었다 (apex-route.js — 여기를 빠뜨려 열쇠 열을 못 봤습니다)');
is(typeof kindOf === 'function' && kindOf('apex_profile') === 'user' && kindOf('apex_vault_v1') === '',
   '  규칙이 apex-kv-sync.js 의 그 함수다 (여기 베껴 적지 않습니다 · 5번)');

sec('[3] ★★ 안 올라가는 열쇠마다 <b>까닭이 적혀</b> 있나 — 새것은 울립니다');
const 까닭없음 = 밖막힘.filter(k => !까닭[k]);
is(까닭없음.length === 0,
   '  apex_ 밖에서 안 올라가는 ' + 밖막힘.length + '가지가 <b>모두 까닭이 적혀</b> 있다' +
   (까닭없음.length ? ('\n      ← 까닭이 없는 것: ' + 까닭없음.map(k =>
      k + '(' + [...열쇠.get(k)].join(',') + ')').join(' · ') +
      '\n      ★ 올려야 하는 값이면 apex-kv-sync.js 의 ALSO_EXACT 에 넣고,' +
      ' 아니면 이 자의 「까닭」 에 한 줄 적어 주십시오') : ''));
/* 까닭만 적어 두고 열쇠가 없어진 것도 알려 줍니다 — 낡은 쪽지를 안 남깁니다 (1번) */
const 사라진 = Object.keys(까닭).filter(k => !열쇠.has(k));
is(사라진.length === 0, '  까닭만 남고 <b>없어진 열쇠</b>가 없다' +
   (사라진.length ? (' ← ' + 사라진.join(' · ')) : ''));

sec('[4] ★ 사장님이 정하신 값이 <b>정말 올라가나</b> (판 X465)');
[['apexRouteHomeV1', '🏠 출발지'],
 ['apexRouteStayV1', '⏱ 상담 한 건에 몇 분'],
 ['apexCareLocalV1', '✅ 챙긴 표시']].forEach(([k, 이름]) => {
  is(kindOf(k) === 'user', '  ' + 이름 + ' (' + k + ') 가 올라간다');
});
is(kindOf('apex_profile') === 'user' && kindOf('apex_mycal_cfg') === 'user',
   '  apex_ 이름을 쓰는 살림은 그대로 올라간다');

sec('[5] ★ 비밀은 <b>여전히 막히나</b> (3번·10번)');
[['apex_cli_rrn_c1', '⛔ 주민등록번호 — 서버 호출 0번'],
 ['apex_vault_v1',   '🔐 금고 — 주민번호를 잠근 것'],
 ['apex_key',        '🔒 열쇠'],
 ['apex_studio_apptoken', '🔒 토큰'],
 ['apexKakaoKeyV1',  '🔒 지도 열쇠'],
 ['gemini_api_key',  '🔒 API 열쇠'],
 ['apexSupabaseConfigV1', '🔒 서버 주소·열쇠']].forEach(([k, 이름]) => {
  is(kindOf(k) === '', '  ' + 이름 + ' 가 안 올라간다');
});
is(kindOf('apex_hm_hidenm') === '' && kindOf('apex_hm_short_v1') === '',
   '  ★ 사장님이 「그 폰에서」 라고 못 박으신 보기 취향도 그대로 안 올라간다 (판 X399·X456)');

console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불')
  : '✓ 🔑 열쇠 ' + 열쇠.size + '가지 — 안 올라가는 것은 모두 까닭이 적혀 있습니다'));
process.exit(bad ? 1 : 0);
