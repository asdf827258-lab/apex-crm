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
/* ⚠ 2026-09-23 · 여기서 <b>글자 모양</b>(seen[dk]!==undefined)을 봤습니다.
   접는 방식을 「먼저 온 것」 에서 「<b>점수가 높은 것</b>」 으로 고치자, 접는
   일은 그대로 잘 되는데 점검만 빨간불이 켜졌습니다. 헛것을 잡는 점검은 안
   잡는 점검보다 나쁩니다 (8번).
   그래서 <b>실제로 접히는지</b>는 브라우저를 띄우는 check-homeday 가 재고
   (「같은 분이 두 줄로 안 선다」), 여기 글자 점검은 <b>홈이 이 규칙 파일을
   쓰는지</b> 만 봅니다 — 그것이 브라우저 없이 정직하게 말할 수 있는 전부입니다. */
is(/hmQPromise\(\)/.test(IDX) && /hmQSignal\(\)/.test(IDX) && /DAYRANK\.promiseOf/.test(IDX),
   '  홈이 <b>같은 규칙 파일</b>을 쓴다 — 30일 약속도 신호도 day-rank 가 셈한다');

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

console.log('\n[5] <b>신호 — 오늘 이 분께 걸 구실</b> (명세서의 signals())');
/* 생일 — D-7 부터 D-1 까지. D-0 은 달력이 이미 세웁니다 (한 곳만 답한다 · 5번) */
const sBd = R.signalsOf({ today: T, bd: '09-27' });      /* T=2026-09-23 → D-4 */
is((sBd[0] || {}).id === 'bd' && sBd[0].sc === 700 + (8 - 4) * 8,
   '  생일 <b>D-4</b> 가 선다 — ' + (sBd[0] || {}).t + ' · ' + (sBd[0] || {}).sc + '점');
is(R.signalsOf({ today: T, bd: '09-23' }).length === 0,
   '  생일 <b>당일은 여기서 안 센다</b> — 달력의 생일 갈래가 이미 세운다 (5번)');
is(R.signalsOf({ today: T, bd: '11-30' }).length === 0,
   '  <b>여드레 뒤는 아직</b> 안 센다 — 오늘 걸 구실이 아니다');
/* 계약 주년 — 2년차부터. 1년차는 계약 마디(12개월)가 이미 셉니다 */
const sAnn = R.signalsOf({ today: T, cd: '2022-09-25' });
is((sAnn[0] || {}).id === 'ann' && /4주년/.test((sAnn[0] || {}).t || ''),
   '  계약 <b>4주년 D-2</b> 가 선다 — ' + (sAnn[0] || {}).t);
is(R.signalsOf({ today: T, cd: '2025-09-25' }).length === 0,
   '  <b>1주년은 여기서 안 센다</b> — 계약 마디(12개월)가 이미 세운다 (5번)');
/* 자녀·보험료 비중 — <b>늘 참</b>이라 줄을 안 세운다 */
const sKid = R.signalsOf({ today: T, kids: [2019, 2007] });
is(sKid.length === 2 && sKid.every(s => s.when === 'any'),
   '  자녀 7세·19세는 <b>줄을 안 세운다</b>(when:any) — 해가 바뀔 때까지 매일 서면 큐가 안 줄어든다');
is(R.signalsOf({ today: T, kids: [2018, ''] }).length === 0,
   '  <b>8세는 안 센다</b> · 태어난 해를 모르면 안 센다 (1번)');
const sHi = R.signalsOf({ today: T, finc: '400', fins: '40' });
is((sHi[0] || {}).id === 'hi' && (sHi[0] || {}).sc === 480,
   '  보험료 비중 <b>10%</b> 가 잡힌다 — ' + (sHi[0] || {}).t);
is(R.signalsOf({ today: T, finc: '400', fins: '' }).length === 0,
   '  <b>한쪽만 적혀 있으면 안 나눈다</b> — 0 으로 채우면 없는 비중이 생긴다 (1번)');
/* 홈이 그 규칙을 <b>그대로</b> 쓰는가 — 여기에 숫자를 베껴 적으면 두 벌이다 */
is(/DAYRANK\.signalsOf/.test(IDX) && !/700\s*\+\s*\(8\s*-/.test(IDX),
   '  홈은 <b>부르기만</b> 한다 — 점수를 index.html 에 베껴 적지 않았다 (5번)');
is(/when!=='day'/.test(IDX),
   '  홈이 <b>날짜 신호만</b> 줄로 세운다 — 늘 참인 것은 「왜 이분인가」 로만 쓴다');

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ 오늘 큐 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
console.log('✓ 한 분은 한 번만 서고, 규칙은 한 파일에 있고, 약속은 통화·만남만 셉니다.');
