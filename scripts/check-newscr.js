/* ══════════════════════════════════════════════════════════════════
   check-newscr.js — <b>새 화면 하나는 네 자리를 요구한다.</b>
                     그 넷을 <b>한 자가 한꺼번에</b> 묻는다.

   ── 왜 이것이 필요한가 ────────────────────────────────────────────
   2026-10-12 하루에 <b>같은 실수가 두 번</b> 났습니다.

     · 판 X93(🎙 TA 전체 대본) — 메뉴·옷 표에는 적고 <b>전체 지도와 간편
       분류표를 빠뜨렸습니다.</b> CI 가 <b>세 갈래</b>에서 빨간불을 켰습니다 —
       화면 점검 (2) check-guidemap · (5) check-bband · (6) check-nav.
     · 판 X94(🎓 신입 TA 교육 · 다른 세션) — <b>전체 지도</b>를 빠뜨렸습니다.
       화면 점검 (2) 가 빨간불이었습니다.

   자들은 제 일을 했습니다. 문제는 <b>자리가 셋으로 흩어져 있고</b>, 그 셋이
   <b>각각 다른 9분짜리 갈래</b>에 있어서, 빨간불 셋을 보고 거꾸로 짚어야
   했다는 것입니다. 그리고 <b>아무도 먼저</b> 「새 화면을 만들면 여기 네 곳에
   적으십시오」 라고 말해 주지 않았습니다.

   이 자는 <b>브라우저를 안 띄웁니다</b> — 몇 초면 끝나고 빠른 갈래에 있어
   30초 안에 빨간불이 뜹니다. 그리고 <b>빠진 자리에 넣을 글을 그대로
   찍어 줍니다.</b>

   ── 네 자리 ───────────────────────────────────────────────────────
     ① 메뉴            app/index.html  var TABS            (여기가 원본)
     ② 간편 분류표     app/index.html  var NAV_WHEN        (여섯 묶음 중 하나)
     ③ 전체 지도 사전  app/apex-map.html  DATA.menu        (이름·갈래·설명)
     ④ 전체 지도 나무  app/apex-map.html  DATA.left/right  (<b>그림에 실제로 서나</b>)

   ★ ④ 는 <b>여태 아무도 안 보던 자리</b>입니다. check-guidemap 은 사전만
     견주므로, 사전에만 적고 나무에 안 세우면 <b>초록인데 지도 그림에는
     없습니다.</b> 이 자를 세우며 재어 보니 넷이 그랬습니다 —
     frmake · onecmp · bohum · dz_guide (판 X95 에서 세웠습니다).

   ★ <b>옷 표(T_SKIN)는 빨간불로 잡지 않습니다.</b> 모든 화면이 목각 옷을
     입어야 하는 것이 아니고, 안 입은 수는 check-skinmap 이 기준선으로
     잽니다. 여기서는 <b>적혀 있나 없나만 알려 줍니다</b> (8번 — 헛것을
     잡는 자는 안 잡는 자보다 나쁩니다).

   ★ <b>그리는 자리(go)도 글자로 찾지 않습니다.</b> 재어 보니 화면 102개 중
     <b>31개</b>가 「tab==='id'」 꼴이 아닌 다른 길로 그려집니다. 글자로 찾으면
     31개를 거짓으로 고발합니다. 그 자리는 smoke.js 와 check-nav 가
     <b>실제로 열어 보고</b> 잽니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const SRCF = path.join(ROOT, 'app', 'index.html');
const MAPF = path.join(ROOT, 'app', 'apex-map.html');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const SRC = fs.readFileSync(SRCF, 'utf8');
const MAP = fs.readFileSync(MAPF, 'utf8');

/* 글자로 긁지 않고 <b>그 자리를 떼어 내어 실제로 읽습니다</b> — 꼴이 깨지면
   그 자리에서 빨간불입니다. 「못 읽었는데 통과」 가 가장 나쁩니다 (1번). */
function 떼기(글, 머리, 꼬리, 앞버릴수, 끝보정) {
  const i = 글.indexOf(머리); if (i < 0) return null;
  const j = 글.indexOf(꼬리, i); if (j < 0) return null;
  let 글조각 = 글.slice(i + 앞버릴수, j + 끝보정).trim().replace(/;$/, '').trim();
  try { return eval('(' + 글조각 + ')'); } catch (e) { return null; }
}

console.log('새 화면 네 자리 — 메뉴 · 간편 분류표 · 지도 사전 · 지도 그림');

sec('[1] 네 자리를 <b>읽을 수 있나</b> (못 읽으면 여기서 멈춘다 · 1번)');
const TABS  = 떼기(SRC, 'var TABS=[', '\n];', 9, 2);
const WHEN  = 떼기(SRC, 'var NAV_WHEN={', '\n};', 13, 2);
const WHENG = 떼기(SRC, 'var NAV_WHEN_G=[', '\n];', 15, 2);
const SKIN  = 떼기(SRC, 'var T_SKIN={', '};', 11, 1);
const DATA  = 떼기(MAP, 'var DATA = {', '\nvar MENU', 11, 0);
is(!!TABS,  '메뉴(var TABS)를 읽었다'            + (TABS  ? '' : ' ← 꼴이 깨졌습니다'));
is(!!WHEN,  '간편 분류표(var NAV_WHEN)를 읽었다' + (WHEN  ? '' : ' ← 꼴이 깨졌습니다'));
is(!!WHENG, '묶음표(var NAV_WHEN_G)를 읽었다'    + (WHENG ? '' : ' ← 꼴이 깨졌습니다'));
is(!!SKIN,  '옷 표(var T_SKIN)를 읽었다'         + (SKIN  ? '' : ' ← 꼴이 깨졌습니다'));
is(!!(DATA && DATA.menu), '전체 지도(DATA)를 읽었다' + (DATA ? '' : ' ← 꼴이 깨졌습니다'));
if (!TABS || !WHEN || !WHENG || !SKIN || !DATA || !DATA.menu) {
  console.log('\n──────────────────────────────');
  console.log('✗ 네 자리 중 하나를 못 읽어 <b>잴 수 없습니다</b> — 위에 적힌 자리를 보십시오.');
  process.exit(1);
}

/* 화면 하나하나 */
const 화면 = [];
TABS.forEach(g => (g.items || []).forEach(x => 화면.push({ id: x.id, t: x.title, g: g.group })));
const ids = 화면.map(s => s.id);
is(화면.length > 80, '화면을 다 모았다 — <b>' + 화면.length + '개</b>');

/* 지도 그림(나무)에 서 있는 것 */
const 잎 = [];
const 걷기 = (가지) => (가지 || []).forEach(b => (b.children || []).forEach(c => (c.leaves || []).forEach(l => { if (l.id) 잎.push(l.id); })));
걷기(DATA.left); 걷기(DATA.right);
const 묶음들 = (WHENG || []).map(w => w.k);

sec('[2] 화면마다 <b>네 자리가 다 적혀 있나</b>');
const 빠진것 = { 분류: [], 사전: [], 그림: [], 묶음: [], 이름: [] };
화면.forEach(s => {
  if (!WHEN[s.id]) 빠진것.분류.push(s);
  else if (묶음들.indexOf(WHEN[s.id]) < 0) 빠진것.묶음.push(s);
  if (!DATA.menu[s.id]) 빠진것.사전.push(s);
  else if (((DATA.menu[s.id].n || '').trim()) !== (s.t || '').trim()) 빠진것.이름.push(s);
  if (잎.indexOf(s.id) < 0) 빠진것.그림.push(s);
});
is(빠진것.분류.length === 0, '② <b>간편 분류표</b>에 다 적혀 있다 (NAV_WHEN)' +
   (빠진것.분류.length ? ' ← ' + 빠진것.분류.map(s => s.id).join(', ') : ''));
is(빠진것.묶음.length === 0, '② 분류가 <b>여섯 묶음 안</b>이다 — ' + 묶음들.join(' · ') +
   (빠진것.묶음.length ? ' ← ' + 빠진것.묶음.map(s => s.id + '(' + WHEN[s.id] + ')').join(', ') : ''));
is(빠진것.사전.length === 0, '③ <b>전체 지도 사전</b>에 다 적혀 있다 (DATA.menu)' +
   (빠진것.사전.length ? ' ← ' + 빠진것.사전.map(s => s.id).join(', ') : ''));
is(빠진것.이름.length === 0, '③ 지도가 든 이름이 <b>메뉴 이름과 같다</b> — 옛 이름을 들고 있지 않다' +
   (빠진것.이름.length ? ' ← ' + 빠진것.이름.map(s => s.id + ' 메뉴「' + s.t + '」 지도「' + DATA.menu[s.id].n + '」').join(' · ') : ''));
is(빠진것.그림.length === 0, '④ <b>전체 지도 그림</b>에 다 서 있다 (DATA.left/right 의 잎)' +
   (빠진것.그림.length ? ' ← ' + 빠진것.그림.map(s => s.id).join(', ') : ''));

sec('[3] 거꾸로 — <b>없는 화면</b>을 적어 두지 않았나');
const 헛칸 = {
  분류: Object.keys(WHEN).filter(k => ids.indexOf(k) < 0),
  사전: Object.keys(DATA.menu).filter(k => ids.indexOf(k) < 0),
  그림: [...new Set(잎)].filter(k => ids.indexOf(k) < 0)
};
is(헛칸.분류.length === 0, '간편 분류표에 <b>없는 화면</b>이 없다' + (헛칸.분류.length ? ' ← ' + 헛칸.분류.join(', ') : ''));
is(헛칸.사전.length === 0, '지도 사전에 <b>없는 화면</b>이 없다'   + (헛칸.사전.length ? ' ← ' + 헛칸.사전.join(', ') : ''));
is(헛칸.그림.length === 0, '지도 그림에 <b>없는 화면</b>이 없다'   + (헛칸.그림.length ? ' ← ' + 헛칸.그림.join(', ') : ''));

sec('[4] 옷 표(T_SKIN) — <b>알려만 줍니다</b> (빨간불은 check-skinmap 이 기준선으로)');
const 옷없음 = 화면.filter(s => !SKIN[s.id]);
console.log('  · 옷 표에 적힌 화면 ' + (화면.length - 옷없음.length) + ' / ' + 화면.length +
            (옷없음.length ? ' — 안 적힌 것: ' + 옷없음.map(s => s.id).join(', ') : ''));

/* ★ <b>빠진 자리에 넣을 글을 그대로 찍어 줍니다.</b> 「어디에 무엇을」 을
   사람이 다시 찾아다니지 않게 합니다. */
if (빠진것.분류.length || 빠진것.사전.length || 빠진것.그림.length || 빠진것.묶음.length) {
  console.log('\n────── <b>이대로 넣으십시오</b> ──────');
  빠진것.분류.concat(빠진것.묶음).forEach(s => {
    console.log('\n[' + s.id + '] ② app/index.html 의 var NAV_WHEN 에 — 여섯 묶음(' + 묶음들.join('/') + ') 중 하나로');
    console.log("   " + s.id + ":'meet',        /* 「" + s.t + "」 · " + s.g + " */");
  });
  빠진것.사전.forEach(s => {
    console.log('\n[' + s.id + '] ③ app/apex-map.html 의 DATA.menu 에');
    console.log('  "' + s.id + '": {');
    console.log('   "n": "' + s.t + '",');
    console.log('   "g": "' + s.g + '",');
    console.log('   "d": "<무엇을 하는 화면인지 한 줄 — 지어내지 마십시오(1번)>",');
    console.log('   "k": []');
    console.log('  },');
  });
  빠진것.그림.forEach(s => {
    console.log('\n[' + s.id + '] ④ app/apex-map.html 의 DATA.left — 「' + s.g + '」 묶음의 leaves 에');
    console.log('      {');
    console.log('       "t": "' + s.t + '",');
    console.log('       "id": "' + s.id + '"');
    console.log('      },');
  });
  console.log('\n(①  메뉴는 var TABS 입니다 — 거기가 원본이라 여기서 묻지 않습니다)');
}

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ ' + bad + '가지가 어긋납니다 — 새 화면이 <b>네 자리를 다 못 채웠습니다</b>.'); process.exit(1); }
console.log('✓ 화면 ' + 화면.length + '개가 네 자리(메뉴 · 간편 분류표 · 지도 사전 · 지도 그림)에 다 적혀 있습니다.');
