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

console.log('\n[6] <b>만기 — 아는 만큼만 말한다</b> (1번)');
/* 사장님 말씀 (2026-09-24) — 「<b>「D-30」 이라고 쓰지 마십시오.</b> 달까지밖에
   모르는 값으로 일 단위 D-30 을 만들면 없는 정밀도를 지어내는 것입니다」. */
const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
const E = (o) => R.signalsOf(Object.assign({ today: T }, o));
/* T = 2026-09-23 */
const eNow = E({ end: { pay: { ym: '2026-09', nm: 'KB 무배당' }, src: '보장분석에서 셈' } });
const eNext = E({ end: { pay: { ym: '2026-10' }, src: '보장분석에서 셈' } });
const eFar = E({ end: { pay: { ym: '2039-04' }, cov: { y: 2059 }, src: '보장분석에서 셈' } });
is((eNow[0] || {}).id === 'payend' && eNow[0].sc === 750,
   '  납입 만기가 <b>이번 달</b>이면 선다 — ' + (eNow[0] || {}).t + ' · ' + (eNow[0] || {}).sc + '점');
is((eNext[0] || {}).id === 'payend' && eNext[0].sc === 690,
   '  <b>다음 달</b>이면 점수가 낮다 — ' + (eNext[0] || {}).t + ' · ' + (eNext[0] || {}).sc + '점 (명세서의 먼 쪽)');
is(eFar.length === 0, '  <b>열세 해 뒤는 안 세운다</b> — 오늘 걸 구실이 아니다');
is(!eNow.some(s => /D-\d/.test(s.t + s.why)),
   '  <b>「D-30」 처럼 날짜를 지어내지 않는다</b> (1번) — 「' + (eNow[0] || {}).t + '」');
is(/보장분석에서 셈/.test((eNow[0] || {}).why || ''),
   '  <b>어디서 셈한 것인지</b> 같이 적는다 — 증권 날짜가 생기면 그쪽이 이긴다');
const eCov = E({ end: { cov: { y: 2026, age: 80, nm: '삼성 실손' }, src: '보장분석에서 셈' } });
is((eCov[0] || {}).id === 'end' && eCov[0].sc === 663,
   '  보장 만기는 <b>올해</b>일 때만 · 명세서의 먼 쪽 점수 — ' + (eCov[0] || {}).t + ' · ' + (eCov[0] || {}).sc);
is(E({ end: null }).length === 0 && E({}).length === 0,
   '  <b>보장분석을 안 넣으셨으면 아무 말도 안 한다</b> — 「만기가 없다」 가 아니라 「모른다」 (1번)');
/* 만기를 세는 자리가 <b>한 곳</b>인가 — 홈이 증권을 다시 읽지 않는가 */
is(/function baEndOf\s*\(/.test(BA) && !/function baEndOf\s*\(/.test(IDX),
   '  만기를 세는 자리는 <b>app/ba.html 한 곳</b>이다 (5번) — 홈은 적어 둔 줄을 꺼내 쓴다');
is(/9999|120/.test(BA.slice(BA.indexOf('function baEndAge'), BA.indexOf('function baEndAge') + 700)),
   '  <b>9999세만기(종신)</b>를 만기로 안 읽는다 — 그대로 빼면 9,959년이 된다');
is(/CHKS\.by/.test(IDX.slice(IDX.indexOf('function hmSigEnd'), IDX.indexOf('function hmSigEnd') + 400)),
   '  홈은 <b>이미 받아 둔 요약</b>에서 꺼낸다 — 고객마다 증권을 또 받으면 요금이 샌다 (7번)');

/* ⚠ <b>브라우저를 띄우는 시험은 여기 두지 않습니다.</b> 이 판은 fast 갈래라
   몇 초 만에 빨간불이 떠야 합니다 — 문법이 깨졌을 때 제일 먼저 우는 자리입니다.
   app/ba.html 을 실제로 띄워 baEndOf() 를 재는 왕복 시험은
   <b>scripts/check-baend.js</b> (web) 에 있습니다. check-cilist 가 이 규칙을
   지킵니다 — 실제로 여기 넣었다가 그 자리에서 걸렸습니다 (8번).          */
console.log('\n[7] <b>활동량 — 「눌렀나」 가 아니라 「기록이 남았나」</b> (1번)');
/* 사장님 말씀 — 「활동량(전화·만남·기록)」. */
const A = (rows, t) => R.actOf(rows, t || T);
const a1 = A([{ at: T, how: '전화' }, { at: T, how: '만남' }, { at: T, how: '카톡' },
              { at: T, how: '문자' }, { at: '2026-09-22', how: '전화' }, { at: '', how: '전화' }]);
is(a1.call === 1 && a1.meet === 1 && a1.all === 4,
   '  <b>전화 · 만남 · 기록</b>을 갈라 센다 — 전화 ' + a1.call + ' · 만남 ' + a1.meet + ' · 기록 ' + a1.all);
/* ⚠ 「전화」 만 넣고 재면 <b>else 를 빼도 답이 같아</b> 안 울립니다 — 되돌려
   보고 알았습니다 (8번). <b>낱말이 둘 다 든 줄</b>을 넣어야 물립니다. */
const both = A([{ at: T, how: '전화로 만남 약속' }]);
is(both.call + both.meet === 1 && both.all === 1,
   '  <b>한 줄이 둘로 안 세진다</b> — 「전화로 만남 약속」 → 전화 ' + both.call +
   ' · 만남 ' + both.meet + ' · 기록 ' + both.all + ' (합이 기록을 넘으면 안 된다)');
is(a1.all === 4, '  <b>기록은 카톡·문자까지</b> 센다 — 카톡만 돌린 날이 0 이 되면 안 된다');
is(A([{ at: '', how: '전화' }, { how: '전화' }]).all === 0,
   '  <b>날짜를 모르는 줄은 안 센다</b> — 오늘 것인지 모른다 (1번)');
is(A([{ at: '2026-09-22', how: '전화' }]).call === 0, '  <b>어제 것은 안 센다</b>');
/* 세는 자가 <b>30일 약속과 같은 자</b>인가 — 갈래 둘을 합친 것이 KEEP_HOW 다 */
is(R.KEEP_HOW.length === R.CALL_HOW.length + R.MEET_HOW.length &&
   R.CALL_HOW.every(w => R.KEEP_HOW.indexOf(w) >= 0) &&
   R.MEET_HOW.every(w => R.KEEP_HOW.indexOf(w) >= 0),
   '  통화·만남을 합친 것이 <b>그대로 KEEP_HOW</b> 다 (5번) — 30일 약속 셈이 안 바뀐다');
is(R.promiseOf({ today: T, cycle: 30, since: '2026-01-01', touch: [{ at: '2026-09-20', how: '만남' }] }).k === 'ok' &&
   R.promiseOf({ today: T, cycle: 30, since: '2026-01-01', touch: [{ at: '2026-09-20', how: '카톡' }] }).k === 'never',
   '  <b>30일 약속은 한 글자도 안 바뀌었다</b> — 만남은 지킨 것 · 카톡은 아니다');
/* 홈이 그 자를 부르는가 · 여기서 또 세지 않는가 */
is(/DAYRANK\.actOf/.test(IDX) && !/['"]대면['"]/.test(IDX.slice(IDX.indexOf('function hmActOf'), IDX.indexOf('function hmActOf') + 1600)),
   '  홈은 <b>부르기만</b> 한다 — 「전화·만남」 낱말을 index.html 에 베껴 적지 않았다 (5번)');
is(/CM\.loaded/.test(IDX.slice(IDX.indexOf('function hmActOf'), IDX.indexOf('function hmActOf') + 600)),
   '  <b>아직 못 읽었으면 줄을 안 세운다</b> — 「0건」 은 「아무것도 안 하셨다」 로 읽힌다 (1번)');
is(/mcalMine/.test(IDX.slice(IDX.indexOf('function hmActOf'), IDX.indexOf('function hmActOf') + 1200)),
   '  <b>누구 것인가</b> 는 달력이 쓰는 한 곳에 묻는다 (3번·5번)');
/* ⚠ <b>1,200자로 잘라 보지 않습니다.</b> 그 창으로 보다가, 같은 칸에
   ☎️ 30일 약속 한 줄이 붙자 flex-wrap:nowrap 이 창 <b>밖으로</b> 밀려나
   빨간불이 켰습니다 — 규칙은 멀쩡히 그 자리에 있었습니다. 헛것입니다 (8번).
   이제 <b>함수 끝까지</b> 봅니다. */
const hmActCssSrc = (() => {
  const i = IDX.indexOf('function hmActCss');
  if (i < 0) return '';
  const r = IDX.slice(i), e = r.indexOf('document.head.appendChild(st);');
  return e > 0 ? r.slice(0, e) : r.slice(0, 4000);
})();
is(/flex-wrap:nowrap/.test(hmActCssSrc),
   '  칩이 <b>한 줄</b>로 선다 — 접히면 122px 이 되어 홈이 0.15화면 길어진다');

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ 오늘 큐 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
console.log('✓ 한 분은 한 번만 서고, 규칙은 한 파일에 있고, 약속은 통화·만남만 셉니다.');
