/* ══════════════════════════════════════════════════════════════════
   check-crmpersonal.js — 👤 <b>CRM 에서 개인 고객도 관리하나.</b>

   사장님 말씀 (X56) — <b>「DB통합CRM 에서 개인 고객도 관리 — 고객 365일과
   하나로」</b>.

   ── 먼저 <b>재고</b> 지었습니다 (1번) ────────────────────────────
     · 개인 고객은 <b>이미 CRM 안에 158건</b>이었습니다 (소개 89 · 지인 63 ·
       개척 6). 넣는 길은 이미 있었고, <b>갈라 보이지가 않았습니다.</b>
     · 고객 365일 111명은 CRM 과 <b>한 명도 안 겹칩니다.</b>
     · 배정 한도를 세는 자리가 <b>앱 어디에도 없었습니다</b> — 손으로
       세다 넘긴 그 사고의 뿌리입니다.
   ★★ <b>자료를 안 옮깁니다.</b> clients 를 <b>열두 표가 가리키고</b> 있고
     clients 에만 있는 칸이 <b>열하나</b>(월소득·여력한도·은퇴나이…)입니다.
     옮기면 연결이 끊기고 재무 칸이 사라집니다. 제자리에 두고 <b>화면에서</b>
     가릅니다.
   ★★ <b>한도 수를 지어 적지 않습니다</b> (1번·2번) — 「일반 20 · 변액 +30」
     이라고 들었지만 지금도 그런지, 사람마다 같은지 모릅니다. <b>세기만</b>
     하고 판정은 안 합니다.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] <b>개인 갈래가 한 표</b>에만 있다 (5번) — 코드 여기저기 적으면
         갈래가 늘 때 한쪽만 고쳐집니다
     [2] 세는 규칙이 <b>맞다</b> — 개인은 한도에 안 들고, 끝난 단계도 안 든다
     [3] 화면에 <b>거르개 두 갈래</b>(개인만 · 회사 배정만)가 있다
     [4] <b>한도 띠</b>가 서고, <b>한도 수를 단정하지 않는다</b>
     [5] <b>고객 365일에만 있는 분</b>을 몇 분인지 적는다
     [6] ★ <b>clients 를 옮기거나 지우지 않는다</b> — 열두 표가 걸려 있다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');
/* 주석은 코드가 아닙니다 — 설명에 적은 글이 알리바이가 되면 안 됩니다 */
const CODE = SRC.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

console.log('\n[1] <b>개인 갈래가 한 표</b>에만 있다 (5번)');
const 표 = (CODE.match(/var CRM_개인출처\s*=\s*\[([^\]]*)\]/) || [])[1];
is(!!표, '  표(CRM_개인출처)가 있다 — ' + (표 || '못 찾았습니다'));
const 갈래 = (표 || '').split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean);
is(갈래.length >= 3, '  갈래가 <b>' + 갈래.length + '가지</b>다 — ' + 갈래.join(' · '));
/* 표 밖에서 같은 이름을 손으로 또 적지 않았나 */
const 밖 = 갈래.filter(g => (CODE.split("'" + g + "'").length - 1) > 1);
is(밖.length === 0, '  갈래 이름을 <b>표 밖에서 또 안 적었다</b>'
  + (밖.length ? (' ← ' + 밖.join(' · ')) : ''));
is((CODE.match(/function crm개인\(/g) || []).length === 1,
   '  <b>개인인지 묻는 곳이 하나</b>다 (crm개인)');

console.log('\n[2] 세는 규칙이 <b>맞다</b>');
const 끝 = (CODE.match(/var CRM_한도끝\s*=\s*\[([^\]]*)\]/) || [])[1] || '';
const 끝목록 = 끝.split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean);
is(끝목록.length >= 3, '  끝난 단계 표가 있다 — ' + 끝목록.join(' · '));
['계약완료', '거절'].forEach(k => is(끝목록.indexOf(k) >= 0,
  '  <b>' + k + '</b> 은 한도에서 뺀다'));
/* 규칙을 떼어 내 <b>손으로 돌려</b> 본다 — 글자만 보지 않습니다 (8번) */
const srcOf = d => d.source || '', stageOf = d => d.stage || '';
const 개인 = d => 갈래.indexOf(srcOf(d)) >= 0;
const 한도줄 = d => !개인(d) && 끝목록.indexOf(stageOf(d)) < 0;
const 씨 = [{source:'보장분석5DB',stage:'AP'},{source:'소개',stage:'TA'},
            {source:'지인',stage:'계약완료'},{source:'일반',stage:'계약완료'},
            {source:'프로모션DB',stage:'거절'},{source:'개척',stage:'AP'},
            {source:'일반',stage:'미접촉'}];
is(씨.filter(개인).length === 3, '  견본 일곱 줄에서 <b>개인이 셋</b>이다 — ' + 씨.filter(개인).length);
is(씨.filter(한도줄).length === 2,
   '  견본에서 <b>한도에 드는 것이 둘</b>이다 (표만 보고 센 것) — ' + 씨.filter(한도줄).length);
/* ⚠ 2026-10-05 · <b>위 두 줄은 제가 표에서 규칙을 다시 만들어 돌린 것</b>
   입니다 — <b>앱의 함수를 안 봅니다.</b> 그래서 앱에서 「개인을 뺀다」 를
   지워도 위는 그대로 초록이었습니다. <b>제 자가 저를 시험한 꼴</b>입니다
   (되돌려 보고 알았습니다 · 8번). 그 사고를 막는 그 한 줄은 <b>앱의 글에서
   직접</b> 봅니다.                                                   */
is(/function crm한도줄\(d\)\s*\{[\s\S]{0,200}?!crm개인\(d\)/.test(CODE),
   '  ★★ <b>앱의 한도 셈이 개인을 뺀다</b> — 이 한 줄이 그 사고를 막습니다');
is(/function crm한도줄\(d\)\s*\{[\s\S]{0,200}?CRM_한도끝/.test(CODE),
   '  ★ 앱의 한도 셈이 <b>끝난 단계도 뺀다</b> (사장님 「진행중만」)');

console.log('\n[3] 화면에 <b>거르개 두 갈래</b>가 있다');
is(/__개인__/.test(CODE) && /__배정__/.test(CODE), '  개인만 · 회사 배정만 두 갈래가 선다');
is(/sf==="__개인__"[\s\S]{0,120}crm개인/.test(CODE), '  거르개가 <b>그 표를 부른다</b> — 따로 세지 않는다 (5번)');

console.log('\n[4] <b>한도 띠</b>가 서고 한도를 단정하지 않는다');
is(/id="crmQuota"/.test(SRC), '  띠가 설 자리가 있다');
is(/function crm한도띠\(/.test(CODE), '  띠를 세우는 함수가 있다');
is(!/한도\s*(20|30|50)\b/.test(CODE),
   '  ★ <b>한도 수를 코드에 안 박았다</b> (1번·2번) — 들은 수를 사실처럼 적지 않습니다');
is(/견주지 않습니다/.test(SRC), '  <b>견주지 않는다고 화면에 적는다</b> — 모르면 모른다고 (1번)');

console.log('\n[5] <b>고객 365일에만 있는 분</b>을 적는다');
is(/function crm365띠\(/.test(CODE), '  세는 함수가 있다');
is(/고객 365일에만 있고/.test(SRC), '  <b>몇 분인지 화면에 적는다</b>');
is(/cliKeys/.test(CODE), '  CRM 이 <b>이미 읽어 둔 명단</b>에서 센다 — 서버를 더 안 부릅니다 (7번)');

console.log('\n[7] ★★ <b>한도 수는 설정에 담긴 것만 본다</b> (2026-10-05 · 사장님 말씀)');
/* 사장님이 「한도 수 설정에 담아서 띠가 견주게 해 줘」 라고 하셨습니다.
   견주는 <b>모양</b>은 check-crmband 가 브라우저로 띄워 잽니다. 이 자는
   몇 초 만에 울려야 하는 <b>세 가지</b>만 봅니다 — 수를 코드에 박았나 ·
   묻는 곳이 하나인가 · 설정에서 읽나.                                  */
is(/function crm한도수\(own\)/.test(CODE),
   '  ★ 「이 사람 한도는 몇인가」 를 <b>묻는 곳이 하나</b>다 (crm한도수 · 5번)');
/* ⚠ 처음에 「CRM_QUOTA 를 읽는 자리가 넷 이하인가」 로 셌습니다 — <b>헛것</b>
   이었습니다 (8번). 바깥의 둘은 둘 다 정당합니다: quotaDraft 는 「지금 담긴
   것이 무엇인지」 를 보여 주려고 읽고, crm한도따로 는 <b>다른 물음</b>(그 사람
   만의 수인가)에 답합니다. 셈으로 잡으면 멀쩡한 코드를 빨간불로 만듭니다.
   참뜻은 <b>「띠가 한도를 스스로 세지 않는다」</b> 입니다 — 그것을 겨눕니다. */
const 띠 = (() => { const i = CODE.indexOf('function crm한도띠'); return i < 0 ? '' : CODE.slice(i, CODE.indexOf('crm365띠(own)', i)); })();
is(/crm한도수\(own\)/.test(띠),
   '  ★ 띠는 한도를 <b>crm한도수 에게 물어서</b> 쓴다');
is(!!띠 && !/CRM_QUOTA/.test(띠),
   '  ★★ 띠가 <b>스스로 세지 않는다</b> — 설정을 직접 들여다보면 규칙이 두 벌이 됩니다 (5번)');
is(/db_quota/.test(CODE) && /app_config/.test(CODE),
   '  수를 <b>설정(app_config.db_quota)에서 읽는다</b> — 새 표를 만들지 않습니다');
is(/\.in\("key",\s*\["db_sources","db_quota"\]\)/.test(CODE),
   '  ★ 종류 목록과 <b>한 번에</b> 받는다 — 두 번 부르지 않습니다 (7번)');
/* ⚠ 처음에 「{기본:0,사람:{}} 이 있나」 로만 봤습니다 — <b>안 울렸습니다</b>.
   그 꼴이 <b>두 곳</b>에 있어(var 선언 · crm한도풀기), 한 곳에 20 을 박아도
   다른 곳이 <b>알리바이</b>가 됐습니다. 이제 <b>모든 자리</b>를 봅니다 —
   하나라도 0 이 아니면 빨간불입니다 (8번). */
const 처음값 = CODE.match(/CRM_QUOTA\s*=\s*\{\s*기본\s*:\s*(\d+)/g) || [];
is(처음값.length >= 2 && 처음값.every(x => /기본\s*:\s*0$/.test(x)),
   '  ★★ <b>안 적혔으면 0</b> — 처음값 ' + 처음값.length + '자리가 모두 0 이다 (코드에 수를 박지 않습니다 · 1번)');
is(/catch\(e\)\{\}/.test(CODE.slice(CODE.indexOf('function crm한도풀기'), CODE.indexOf('function crm한도풀기') + 700)),
   '  ★ <b>깨진 글에 터지지 않는다</b> — 터지면 띠가 아예 안 섭니다');
is(/canManage\(\)/.test(CODE.slice(CODE.indexOf('function fillQuotaAdmin'), CODE.indexOf('function fillQuotaAdmin') + 400)),
   '  ★ 적는 칸은 <b>운영자만</b> — 담당자가 제 한도를 올리면 뜻이 없습니다');

console.log('\n[6] ★ <b>clients 를 옮기거나 지우지 않는다</b>');
is(!/from\(["']clients["']\)[\s\S]{0,80}\.(delete|update)\(/.test(CODE),
   '  clients 를 <b>지우거나 고치지 않는다</b> — 열두 표가 걸려 있습니다');
is(!/insert[\s\S]{0,200}from\(["']dbs["'][\s\S]{0,200}name_masked/.test(CODE),
   '  가린 이름을 <b>CRM 으로 베껴 넣지 않는다</b> — 실명 자리에 가린 이름이 들어갑니다 (3번)');

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ ' + bad + '가지 — 개인 고객이 배정 한도에 섞이면 그 사고가 다시 납니다.'); process.exit(1); }
console.log('✓ 개인 고객이 CRM 에서 갈라 보이고, 한도에 안 섞입니다.');
