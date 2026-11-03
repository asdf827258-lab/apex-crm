/* ✍️ <b>내 업적 입력</b> 메뉴 · <b>기기에만 있던 기록을 서버로</b> (판 X300)

   사장님 말씀 2026-11-03 —
   「crm 메뉴에도 넣어주고, 가장중요한건 em운영센터나, 다른 crm에서 기록하는
    모든게 한군데서 입력하더라도 어디서든 기록이 공유 되도록 만들어줘」

   그날 재어 보니 교육 진도 · 4년 유지관리 · 하루 한 장 · 교육 캘린더 … 가
   <b>그 기기 localStorage 에만</b> 있어서 폰과 PC 가 따로 셌습니다.
   app/apex-kv-sync.js 가 정해 둔 열쇠만 서버(apex_user_kv · apex_org_kv)로 올립니다.

   ── 보는 것 (브라우저 없이 글자로 — 몇 초) ─────────────────────────
     [1] 메뉴 다섯 자리 — TABS · TAB_META · NAV_WHEN · T_SKIN · LINKS 에 myperf
     [2] EM 운영센터 주소는 EM_SITE <b>한 곳</b>, 내 업적은 EM_SITE+'/#mine'
     [3] 본체 · 하루 한 장이 apex-kv-sync.js 를 부른다
     [4] ★★ 실명 · 상담카드 · 지인 명단 · 비포&애프터 열쇠가 <b>올리는 목록에 없다</b> (3번)
     [5] 새 Supabase 클라이언트를 만들지 않는다 — 둘이 로그인 표를 서로 갱신하면 로그아웃됩니다
     [6] 목록 밖 열쇠는 안 올린다 — kindOf 가 목록으로만 판정한다                     */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const DAY = fs.readFileSync(path.join(ROOT, 'app/day.html'), 'utf8');
const KV = fs.readFileSync(path.join(ROOT, 'app/apex-kv-sync.js'), 'utf8');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('[1] 메뉴 다섯 자리');
is(/\{id:'myperf',icon:'✍️',title:'내 업적 입력',cnt:'',ak:'홈'\}/.test(SRC), 'TABS 「하루 시작」 에 myperf (ak 홈 — 홈과 같은 문)');
is(/\n myperf:\{tag:'MY',title:'내 업적 입력',desc:'[^']{1,80}'\}/.test(SRC), 'TAB_META.myperf');
is(/airep:'today', myperf:'today'/.test(SRC), "NAV_WHEN.myperf = 'today'");
is(/var T_SKIN=\{myperf:1,/.test(SRC), 'T_SKIN.myperf');
is(/\{tab:'myperf',[^\n]*links:\[\{t:'[^']+',u:EM_SITE\+'\/#mine'\}\]\}/.test(SRC), "LINKS — 단추가 EM_SITE+'/#mine'");

console.log('[2] 주소는 한 곳');
is((SRC.match(/apex-hb-em\.netlify\.app/g) || []).length === 1, '본체에 EM 운영센터 주소가 한 번');
is(/var EM_SITE='https:\/\/apex-hb-em\.netlify\.app';/.test(SRC) && /u:EM_SITE\}/.test(SRC), 'EM 전용 운영센터 단추도 EM_SITE');

console.log('[3] 부르는 자리');
is(/<script src="apex-kv-sync\.js\?v=[^"]+"><\/script>/.test(SRC), '본체가 apex-kv-sync.js 를 부른다');
is(/<script src="apex-kv-sync\.js\?v=[^"]+"><\/script>/.test(DAY), '하루 한 장(day.html)도 부른다');

console.log('[4] ★★ 올리지 않는 것 (3번)');
const lists = (KV.match(/var (USER_KEYS|USER_PREFIX|ORG_KEYS)=\[[^\]]*\]/g) || []).join(' ');
is(lists.length > 0, '올리는 목록 세 줄을 찾았다');
['apex_cli_real', 'apex_cli_refreal', 'apex_fact_cards', 'apex_jiin_grow', 'apex_baba', 'apex_treatpay', 'apex_wallets', 'apex_brain']
  .forEach(k => is(lists.indexOf(k) < 0, k + ' 는 목록에 없다'));

console.log('[5] 새 클라이언트를 안 만든다');
is(!/createClient\s*\(/.test(KV), 'createClient 를 부르지 않는다 — 본체 OS.sb · 하루 한 장 SB 를 빌린다');

console.log('[6] 목록으로만 판정');
const f = new Function('window', 'Storage', KV.replace('(function(){', 'return (function(){').replace(/\}\)\(\);\s*$/, '})();'));
/* 브라우저 없이 kindOf 만 꺼내 봅니다 */
const store = {}; const ls = { getItem: k => store[k] == null ? null : store[k], setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: () => null, length: 0 };
function St() {} St.prototype = ls;
const win = { localStorage: ls, Storage: St, addEventListener() {}, setTimeout() {}, parent: null };
win.parent = win; global.document = { addEventListener() {}, visibilityState: 'visible' }; global.window = win; global.Storage = St;
global.setTimeout = () => 0; global.sessionStorage = ls;
try { f(win, St); } catch (e) { /* 붙기 전 단계라 괜찮습니다 */ }
const K = win.APEX_KV;
is(!!K && K.kindOf('apex_master_done') === 'user' && K.kindOf('apex_edu_cal_v1') === 'org' && K.kindOf('apex_ck_memo_2026-11-03') === 'user', '목록 열쇠는 올림 (사람 · 조직 · 날짜 붙은 메모)');
is(!!K && K.kindOf('apex_fact_cards_kim') === '' && K.kindOf('apex_cli_real_u1') === '' && K.kindOf('apex_brain_kb') === '' && K.kindOf('apex_kv_meta') === '', '목록 밖(실명 · 상담카드 · 두뇌 · 자기 쪽지)은 안 올림');

console.log('[7] 업적 한 벌 (판 X303) — 월간보고 실적 칸');
const PL = fs.readFileSync(path.join(ROOT, 'app/apex-perf-link.js'), 'utf8');
is(/<script src="apex-perf-link\.js\?v=[^"]+"><\/script>/.test(SRC), '본체가 apex-perf-link.js 를 부른다');
is(/k!=='act_prem'&&k!=='act_case'/.test(PL), '저장할 때 실적 두 칸을 안 보낸다 — 서버가 원본에서 센 값을 덮지 않게');
is(/\['pf_act','pf_acase'\]/.test(PL) && /readOnly=true/.test(PL), '두 칸을 손으로 못 친다');
is(/finNum\('pf_act'/.test(SRC) && /act_prem:\+finV\('pf_act'/.test(SRC), '본체의 그 칸 · 저장 자리가 그대로 있다 — 이름이 바뀌면 잠금이 헛돕니다');

console.log('\n──────────────────────────────');
console.log(bad ? '✗ ' + bad + '개 — 위를 보십시오' : '✓ 내 업적 입력이 메뉴에 서고, 정해 둔 기록만 서버로 갑니다.');
process.exit(bad ? 1 : 0);
