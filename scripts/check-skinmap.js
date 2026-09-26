/* ══════════════════════════════════════════════════════════════════
   check-skinmap.js — <b>목업 옷을 몇 화면이나 입었나.</b> 그 수가 줄고 있나.

   사장님 말씀 — 「목업과 홈화면 <b>토시 하나 디자인 하나 색상 하나</b>
   틀리지 않게」. 홈은 그렇게 했습니다. 그런데 화면은 <b>98개</b>입니다.

   2026-09-25 에 재어 보니 옷을 입은 것은 <b>여섯</b>이었습니다
   (home · dashboard · clients · news_live · mycal · me). 나머지 92개는
   예전 색 그대로인데, <b>아무 점검도 그 수를 세지 않았습니다</b> — 그래서
   「거의 다 됐다」 로 보였습니다.

   이 점검이 하는 일은 딱 하나입니다 — <b>그 수를 눈금으로 만드는 것.</b>
     · 옷 안 입은 화면 수가 <b>늘면 빨간불</b>
     · 줄면 「기준선도 같이 내리라」 고 말한다
   점검이 고쳐 주지는 않습니다. <b>숨지 못하게</b> 할 뿐입니다 (8번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] T_SKIN 에 적힌 화면이 <b>정말 있는 화면</b>인가 (없는 이름을 적으면
         옷이 안 입혀지는데 아무도 모릅니다)
     [2] 옷 안 입은 화면 수 ≤ 기준선
     [3] <b>서랍(.sidebar) 바탕</b>이 목업 색표(--t-)에서 오는가
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const APP = path.join(ROOT, 'app', 'index.html');
const MAP = path.join(ROOT, 'docs', '화면목록.json');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ⚠ 2026-09-25 기준선. <b>줄이라고만 있는 수</b>입니다.
     안입음 92  — 화면 98개 중 여섯만 입었습니다
     서랍   1   — .sidebar 가 var(--ink-2) 로 아직 어둡습니다.
                  ★ 서랍을 밝히실 때 check-nav 의 대비 자도 같이 보십시오 —
                    그 자는 <b>어두운 서랍</b>을 전제로 글자색을 잽니다.   */
/* ★ <b>별칭</b>은 메뉴(TABS)에 없습니다 — 그래서 화면목록에도 없습니다.
   dashboard 는 go() 가 home 으로 보내는 옛 이름입니다(첫 화면의 lastTab).
   이것을 「없는 화면」 으로 세면 <b>헛것을 잡는 점검</b>이 됩니다 (8번).
   대신 <b>그 별칭이 정말 살아 있는지</b>를 코드에서 확인합니다 — 별칭이
   없어지면 그때는 T_SKIN 의 그 줄이 진짜 죽은 줄이므로 울려야 합니다.  */
const 별칭 = { dashboard: 'home' };
/* ★ <b>띠에서만 여는 화면</b> — 메뉴(TABS)에 없어 화면목록에도 없습니다.
   tools(🧰 도구)가 그렇습니다. 이 화면은 <b>메뉴에 있는 화면들을 늘어놓는
   자리</b>라, 저를 메뉴에 넣으면 <b>제가 저를 세웁니다.</b> 그래서 안 넣습니다.
   ★ 그래도 <b>정말 열리는지</b>는 별칭과 똑같이 확인합니다 — go() 에서
     보내는 곳이 없어지면 T_SKIN 의 그 줄은 죽은 줄이므로 울려야 합니다.  */
const 띠만 = { tools: '아래 띠 🧰 도구' };
/* ⚠ 2026-09-25 기준선. <b>줄이라고만 있는 수</b>입니다.
     안입음 93 — 메뉴에 선 화면 98개 중 다섯만 입었습니다
                 (dashboard 는 home 의 별칭이라 따로 안 셉니다)
     서랍   1  — .sidebar 가 var(--ink-2) 로 아직 어둡습니다.
                 ★ 서랍을 밝히실 때 check-nav 의 대비 자도 같이 보십시오 —
                   그 자는 <b>어두운 서랍</b>을 전제로 글자색을 잽니다.    */
const BASE = { 안입음: 93, 서랍: 1 };

const src = fs.readFileSync(APP, 'utf8');

console.log('\n[1] T_SKIN 에 적힌 이름이 <b>정말 있는 화면</b>인가');
const m = src.match(/var\s+T_SKIN\s*=\s*\{([^}]*)\}/);
if (!m) { is(false, '  T_SKIN 을 못 찾았습니다 — 옷을 입히는 표입니다'); console.log('\n✗ 1개'); process.exit(1); }
const skin = m[1].split(',').map(s => s.split(':')[0].trim().replace(/['"]/g, '')).filter(Boolean);
const j = JSON.parse(fs.readFileSync(MAP, 'utf8'));
const all = [];
(j['갈래'] || []).forEach(g => (g.items || []).forEach(it => { if (it && it.id) all.push(it.id); }));
const 없는이름 = skin.filter(s => all.indexOf(s) < 0 && !별칭[s] && !띠만[s]);
is(없는이름.length === 0,
  '  옷을 입히기로 한 ' + skin.length + '개가 다 있는 화면이다' +
  (없는이름.length ? (' ← ' + 없는이름.join(' · ') + ' 는 화면목록에 없습니다') : ''));
/* 별칭이 <b>정말 살아 있나</b> — 죽었으면 T_SKIN 의 그 줄이 죽은 줄이다 */
const 죽은별칭 = Object.keys(별칭).filter(a =>
  skin.indexOf(a) >= 0 && src.indexOf("tab==='" + a + "'") < 0);
is(죽은별칭.length === 0,
  '  별칭 ' + Object.keys(별칭).map(a => a + '→' + 별칭[a]).join(' · ') + ' 이 go() 에 살아 있다' +
  (죽은별칭.length ? (' ← ' + 죽은별칭.join(' · ') + ' 로 보내는 곳이 없습니다 — T_SKIN 에서 빼십시오') : ''));
/* 띠에서만 여는 화면도 <b>정말 열리는가</b> — go() 와 아래 띠(TB) 둘 다 본다.
   둘 중 하나라도 없어지면 그 화면은 <b>아무 데서도 못 엽니다</b> (1번). */
const 못여는띠 = Object.keys(띠만).filter(a =>
  skin.indexOf(a) >= 0 &&
  (src.indexOf("tab==='" + a + "'") < 0 || src.indexOf("id:'" + a + "'") < 0));
is(못여는띠.length === 0,
  '  띠에서만 여는 화면 ' + Object.keys(띠만).map(a => a + '(' + 띠만[a] + ')').join(' · ') +
  ' 을 <b>정말 열 수 있다</b>' +
  (못여는띠.length ? (' ← ' + 못여는띠.join(' · ') + ' 은 go() 나 아래 띠에 없습니다') : ''));

console.log('\n[2] <b>목업 옷을 안 입은 화면</b>이 몇 개인가');
const 안입음 = all.filter(id => skin.indexOf(id) < 0).length;
const 진짜입음 = skin.filter(s => all.indexOf(s) >= 0);
console.log('      입음 ' + 진짜입음.length + ' — ' + 진짜입음.join(' · ') +
  '  (별칭 ' + skin.filter(s => 별칭[s]).join(' · ') +
  ' · 띠만 ' + skin.filter(s => 띠만[s]).join(' · ') + ')');
is(안입음 <= BASE.안입음,
  '  안 입은 화면 <b>' + 안입음 + '개</b> / 모두 ' + all.length + '개 — 기준선 ' + BASE.안입음 +
  (안입음 > BASE.안입음 ? ' ← 늘었습니다. 화면을 새로 만드시면 T_SKIN 에도 넣어 주십시오'
   : (안입음 < BASE.안입음 ? ' (줄었습니다 — 기준선도 같이 내려 주십시오)' : '')));

console.log('\n[3] <b>서랍</b> 바탕이 목업 색표에서 오는가');
/* .sidebar 규칙 한 줄만 봅니다 — 목업의 색표는 모두 --t- 로 시작합니다 */
const sb = (src.match(/\n\.sidebar\{[^}]*\}/) || [''])[0];
const bg = (sb.match(/background\s*:\s*([^;}]+)/) || [])[1] || '';
const 밝나 = /var\(--t-/.test(bg);
console.log('      .sidebar background: ' + (bg.trim() || '(못 찾음)'));
is((밝나 ? 0 : 1) <= BASE.서랍,
  '  서랍 바탕이 ' + (밝나 ? '<b>목업 색표</b>에서 온다' : '아직 <b>--t- 색표 밖</b>이다') +
  ' — 기준선 ' + BASE.서랍 +
  (밝나 ? ' (밝아졌습니다 — 기준선을 0 으로 내리고 check-nav 의 대비 자도 같이 보십시오)' : ''));

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '개 — 옷 입은 화면이 줄었거나 이름이 어긋났습니다')
                : '✓ 화면 ' + all.length + '개 중 ' + 진짜입음.length + '개가 목업 옷입니다 (기준선 안쪽).');
process.exit(bad ? 1 : 0);
