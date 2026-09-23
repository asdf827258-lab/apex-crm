#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-queue.js — <b>「오늘 연락할 사람」이 한 줄인가.</b>

   사장님 말씀 (2026-09-23) —
     「한 사람에 거리가 여럿이어도 오늘 자리에는 <b>가장 높은 하나만</b>
      세웁니다(한 분 = 한 퀘스트).」
     「★ 접촉은 <b>통화·만남만</b> 셉니다. 단계를 옮긴 것은 접촉이
      아닙니다 — 섞으면 앉아서 버튼만 눌러도 약속을 지킨 것이 됩니다.」
     「자리가 비면 밑엣것이 올라와 어제와 다른 화면이 됩니다.」

   ── 보는 것 넷 ────────────────────────────────────────────────────
     [1] 한 사람이 오늘 큐에 <b>두 번 서지 않는가</b>
     [2] 순위 규칙이 <b>day-rank.js 에만</b> 있고 index.html·day.html 에
         복사되지 않았는가 — 이 규칙이 한 번 어긋나 「오늘 걸 사람
         <b>198명</b>」 이 떴습니다 (day.html 818줄 주석)
     [3] 30일 약속 계산이 <b>통화·만남만</b> 세는가 (단계 이동·문자·카톡을
         세면 실패) — 앉아서 버튼만 눌러도 약속이 지켜지면 그 수는 거짓입니다
     [4] 약속이 <b>없는 날에도 동선 자리가 남는가</b>

   [1][3] 은 <b>앱이 쓰는 바로 그 파일</b>(app/day-rank.js)을 require 해서
   잽니다 — 점검이 제 나름의 짝퉁을 만들면 앱이 바뀌어도 옛것만 재고
   초록을 켭니다 (5번·8번). [4] 는 글자로 봅니다(브라우저 없이).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const R = require(path.join(ROOT, 'app/day-rank.js'));
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const DAY = fs.readFileSync(path.join(ROOT, 'app/day.html'), 'utf8');

console.log('\n[1] <b>한 사람이 오늘 두 번 서지 않는다</b> (한 분 = 한 퀘스트)');
const T = '2026-09-23';
/* 같은 분이 <b>세 줄</b>로 들어옵니다 — 오늘 약속 · 계약완료 · 오래 손 놓음 */
const rows = [
  { id: 'h1', stage: 'TA', days: 9, n: 1, appt: '' },
  { id: 'h1', stage: '계약완료', days: 9, n: 1, appt: '' },
  { id: 'h1', stage: 'TA', days: 9, n: 1, appt: T },
  { id: 'h2', stage: 'TA', days: 4, n: 0, appt: '' },
  { id: 'h3', stage: '증권전달', days: 1, n: 2, appt: '' }
];
const q = R.rank(rows, { today: T, next: {}, done: {} });
const ids = q.map(x => x.r.id);
is(new Set(ids).size === ids.length,
   '  같은 분이 세 줄로 와도 <b>한 번만</b> 선다 — ' + ids.join(' / '));
is((q[0] || {}).w === 100,
   '  남는 것은 <b>가장 높은 하나</b>다 — ' + ((q[0] || {}).w) + '점 (오늘 약속)');
is(ids.indexOf('h3') < 0, '  증권전달은 오늘 자리에 <b>안 선다</b> — 옮기기 전과 같다');
/* 홈도 같은 규칙을 씁니다 — 세우는 자리(hmSteps)가 id 로 접는지 글자로 봅니다 */
is(/seen\[dk\]!==undefined/.test(IDX) && /hmQPromise/.test(IDX),
   '  홈(hmSteps)도 <b>id 로 접는다</b> — 달력과 30일 약속에 같은 분이 서도 한 줄');

console.log('\n[2] <b>순위 규칙이 day-rank.js 에만 있다</b> (5번)');
const RULE = [
  ['80+Math.min', /80\s*\+\s*Math\.min\(\s*r?\.?\w*\.?days\s*,\s*15\s*\)/],
  ['60+Math.min', /60\s*\+\s*Math\.min\([^)]*days[^)]*,\s*30\s*\)/],
  ['Math.min(days,40)', /Math\.min\([^)]*days[^)]*,\s*40\s*\)/]
];
const where = (s) => RULE.filter(([, re]) => re.test(s)).map(([n]) => n);
is(where(R.toString ? fs.readFileSync(path.join(ROOT, 'app/day-rank.js'), 'utf8') : '').length === RULE.length,
   '  규칙이 <b>day-rank.js 에 있다</b> — ' + where(fs.readFileSync(path.join(ROOT, 'app/day-rank.js'), 'utf8')).join(' · '));
is(where(IDX).length === 0, '  <b>index.html 에 복사되지 않았다</b>' +
   (where(IDX).length ? (' — ' + where(IDX).join(' · ')) : ''));
is(where(DAY).length === 0, '  <b>day.html 에도 남아 있지 않다</b>' +
   (where(DAY).length ? (' — ' + where(DAY).join(' · ')) : ''));
is(/DAYRANK\.rank\(/.test(DAY) && /day-rank\.js/.test(DAY),
   '  day.html 이 <b>그 파일을 부른다</b>');
is(/day-rank\.js/.test(IDX), '  index.html 도 <b>그 파일을 부른다</b>');
const TOML = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
is(/app\/day-rank\.js/.test(TOML), '  서버도 <b>그 파일을 싣는다</b> — netlify.toml included_files');

console.log('\n[3] <b>30일 약속은 통화·만남만 센다</b>');
const near = '2026-09-22', far = '2026-06-01';
const onlyTalk = R.promiseOf({ today: T, cycle: 30, since: '2026-01-01',
  touch: [{ at: near, how: '카톡' }, { at: near, how: '문자' }, { at: near, how: '단계 이동' }] });
is(onlyTalk.k === 'never',
   '  카톡·문자·<b>단계 이동</b>만 있으면 「한 번도 없음」 이다 — ' + onlyTalk.k +
   ' (앉아서 버튼만 눌러도 약속이 지켜지면 그 수는 거짓입니다)');
const withCall = R.promiseOf({ today: T, cycle: 30, since: '2026-01-01',
  touch: [{ at: near, how: '카톡' }, { at: near, how: '전화' }] });
is(withCall.k === 'ok', '  <b>전화</b>가 있으면 지킨 것이다 — ' + withCall.k);
const withMeet = R.promiseOf({ today: T, cycle: 30, since: '2026-01-01',
  touch: [{ at: near, how: '만남' }] });
is(withMeet.k === 'ok', '  <b>만남</b>도 지킨 것이다 — ' + withMeet.k);
const over = R.promiseOf({ today: T, cycle: 30, since: '2026-01-01',
  touch: [{ at: far, how: '전화' }] });
is(over.k === 'over' && over.sc > 500,
   '  주기를 넘기면 <b>오늘 자리에 선다</b> — ' + over.d + '일째 · ' + over.sc + '점');
const callOnly = R.promiseOf({ today: T, cycle: 30, since: '2026-01-01', callAt: near, touch: [] });
is(callOnly.k === 'ok', '  CRM <b>통화 기록</b>도 통화다 — ' + callOnly.k);
is(/DAYRANK\.promiseOf/.test(IDX),
   '  홈이 <b>그 셈을 부른다</b> — 홈에서 또 세면 두 화면이 다른 수를 말한다 (5번)');

console.log('\n[4] <b>약속이 없는 날에도 동선 자리가 남는다</b>');
const rt = IDX.slice(IDX.indexOf('function hmRtHtml'), IDX.indexOf('function hmRtHtml') + 2400);
is(!/if\(!ap\.length\)return\s*''/.test(rt),
   '  빈 날에 <b>자리를 통째로 지우지 않는다</b> — 지우면 밑엣것이 올라와 어제와 다른 화면이 된다');
is(/hm-rt-none/.test(rt) && /갈 데가 없습니다/.test(rt),
   '  <b>무엇을 하면 되는지</b> 적는다 — 「지역을 묶어 하루를 잡으시면」');
is(/hm-rt-none\{/.test(IDX), '  그 줄의 <b>옷</b>도 있다 — 없으면 글자만 덩그러니 남는다');

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ 오늘 큐 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
console.log('✓ 한 분은 한 번만 서고, 규칙은 한 파일에 있고, 약속은 통화·만남만 셉니다.');
