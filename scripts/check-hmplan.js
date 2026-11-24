/* ═══════════════════════════════════════════════════════════════
   check-hmplan.js — 📋 <b>오늘 목록이 몇 분이었는지 남기나</b> (판 X539)

   사장님 말씀 (2026-11-24) — 「오늘 고객 관리는 CRM 에 자동으로 뜨게 했는데,
   이 부분을 잘 이행했는지 체크한다면 TA 부분은 해결될 것 같은데」.
   「이분 끝」 표시는 이미 서버로 올라가지만 <b>분모(오늘 목록 수)</b>가 없어
   EM 운영센터 스케줄 체크가 「몇 분 중 몇 분」 을 못 셌습니다.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 내 화면이면 apex_hm_plan_v1 = {d, n, done, left} 를 남긴다 — 수는 hmLeft() 한 곳 (5번)
     [2] ★★ 팀원 화면을 보는 중이면 안 남긴다 — 남의 수가 내 칸에 들어가면 안 된다 (1번)
     [3] ★  값이 같으면 다시 안 쓴다 — 쓸 때마다 apex-kv-sync 가 서버를 부른다 (7번)
     [4] ★  그날 안에 목록이 작아져도 가장 컸던 수를 둔다(배정 DB 가 늦게 실림) · 날이 바뀌면 새로 센다
     [5] ★★ 숫자 넷(d · n · done · left)만 — 이름 · 고객 id 를 안 남긴다 (3번)
     [6] ★  hmPaint 가 부른다 — 「이분 끝」 을 누르면(hmQfin → hmPaint) 바로 고쳐진다
     [7] ★  apex-kv-sync 가 막는 열쇠가 아니다 — 서버로 올라가야 운영센터가 읽는다
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

function fnSrc(name) {
  const a = IX.indexOf('function ' + name + '(');
  if (a < 0) throw new Error(name + ' 를 못 찾음');
  let i = IX.indexOf('{', a), d = 0;
  for (; i < IX.length; i++) { const c = IX[i]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return IX.slice(a, i + 1);
}

function box(st) {
  const store = st.store, sets = st.sets;
  const b = {
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); sets.push(k); } },
    hwhoIsMe: () => st.me, mcalToday: () => st.day,
    hmLeft: () => ({ all: st.all, done: st.done, n: st.all - st.done, list: [] }),
    JSON, String
  };
  vm.createContext(b);
  vm.runInContext("var HM_PLAN_KEY='apex_hm_plan_v1';\n" + fnSrc('hmPlanNote'), b);
  return b;
}
const S = { store: {}, sets: [], me: true, day: '2026-11-24', all: 7, done: 2 };
const B = box(S);
const read = () => JSON.parse(S.store.apex_hm_plan_v1 || 'null');

console.log('\n[1] 내 화면이면 남긴다');
B.hmPlanNote();
let v = read();
is(v && v.d === '2026-11-24' && v.n === 7 && v.done === 2 && v.left === 5, '{d,n,done,left} = ' + JSON.stringify(v));

console.log('\n[2] 팀원 화면이면 안 남긴다');
S.me = false; S.all = 3; S.done = 0; const n0 = S.sets.length; B.hmPlanNote();
is(S.sets.length === n0 && read().n === 7, '남의 화면에서 부른 것은 안 씀');
S.me = true; S.all = 7; S.done = 2;

console.log('\n[3] 같으면 다시 안 쓴다');
const n1 = S.sets.length; B.hmPlanNote(); B.hmPlanNote();
is(S.sets.length === n1, '같은 값이면 setItem 0번 (' + (S.sets.length - n1) + '번)');
S.done = 3; B.hmPlanNote();
is(S.sets.length === n1 + 1 && read().done === 3 && read().left === 4, '「이분 끝」 하나 → 한 번만 고침 ' + JSON.stringify(read()));

console.log('\n[4] 그날 가장 컸던 목록 · 날이 바뀌면 새로');
S.all = 4; S.done = 1; B.hmPlanNote();
is(read().n === 7 && read().done === 1, '목록이 4로 줄어도 n 은 7 그대로 ' + JSON.stringify(read()));
S.all = 9; B.hmPlanNote();
is(read().n === 9, '커지면 9');
S.day = '2026-11-25'; S.all = 2; S.done = 0; B.hmPlanNote();
is(read().d === '2026-11-25' && read().n === 2, '다음 날은 2부터 ' + JSON.stringify(read()));

console.log('\n[5] 숫자만');
is(Object.keys(read()).sort().join(',') === 'd,done,left,n', '칸은 d · done · left · n 넷뿐');
const src = fnSrc('hmPlanNote');
is(!/\.name|\.id\b|\.key\b|hmFullNm|\.list\b/.test(src), '이름 · id · 키를 읽지 않음');

console.log('\n[6] hmPaint 가 부른다');
is(/hmPlanNote\(\)/.test(fnSrc('hmPaint')), 'hmPaint 안에 hmPlanNote()');
is(/hmPaint\(\)/.test(fnSrc('hmQfin')), '「이분 끝」(hmQfin) 은 hmPaint 를 부른다 → 바로 고쳐짐');

console.log('\n[7] 서버로 올라가는 열쇠인가');
const KV = fs.readFileSync(path.join(ROOT, 'app/apex-kv-sync.js'), 'utf8');
const never = (KV.match(/NEVER_EXACT\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '';
const pre = (KV.match(/NEVER_PRE\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '';
const pres = (pre.match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
is(never.length > 50 && pres.length > 0, '막는 목록을 실제로 읽었다(헛것 통과 아님)');
is(never.indexOf("'apex_hm_plan_v1'") < 0, 'NEVER_EXACT 에 없음');
const word = (KV.match(/NEVER_WORD\s*=\s*(\/[^\n;]+\/[a-z]*)/) || [])[1];
is(word && !new Function('return ' + word)().test('apex_hm_plan_v1'), 'NEVER_WORD(비밀 낌새)에 안 걸림 ' + word);
is(!pres.some(p => 'apex_hm_plan_v1'.indexOf(p) === 0), 'NEVER_PRE 에 걸리지 않음 (' + pres.join(' · ') + ')');

console.log(bad ? `\n✗ ${bad}가지 어긋남` : '\n✓ 모두 맞음');
process.exit(bad ? 1 : 0);
