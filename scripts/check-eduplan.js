/* 교육 운영 커리큘럼 — 여기가 틀리면 신입이 틀린 것을 방법으로 배운다.

   이 화면은 사람이 읽고 그대로 따라 하는 종이다. 그래서 다른 화면보다
   더 조심해야 할 것이 셋 있다.

     1. <b>같은 것을 두 곳에 두지 않는다</b> — 12주 과정·미끼 화법·화법서는
        이미 앱 안에 있다. 여기에 옮겨 적으면 한쪽만 낡고, 신입은 낡은
        쪽을 든 채 고객 앞에 앉는다.
     2. <b>수수료·세법 숫자를 적지 않는다</b> — 회사가 표를 바꾸거나 시행령이
        바뀌면 이 종이가 그대로 틀린 종이가 된다. 「어디서 가져오는 값인가」
        만 적는다.
     3. <b>죽은 링크를 만들지 않는다</b> — 신입은 매뉴얼에 적힌 화면을 찾아
        헤맨다. 여기서 부르는 화면은 전부 실제로 있어야 한다.

   그리고 인쇄. 이 종이는 뽑아서 조회 자리에 놓는다 — tnum 을 켜고 PDF 로
   저장하면 숫자가 유니코드를 잃는다(CLAUDE.md 4-1).                     */

const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const PLAN = path.join(ROOT, 'app/교육/plan.js');
const PAGE = path.join(ROOT, 'app/교육/index.html');
const MAST = path.join(ROOT, 'app/교육/master.js');
const APP  = path.join(ROOT, 'app/index.html');

let bad = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };

if (!fs.existsSync(PLAN) || !fs.existsSync(PAGE)) {
  console.log('  ✗ app/교육/plan.js · app/교육/index.html 이 있어야 합니다');
  process.exit(1);
}
const plan = require(PLAN);
const mast = require(MAST);
const page = fs.readFileSync(PAGE, 'utf8');
const app  = fs.readFileSync(APP, 'utf8');

/* 표 안의 모든 글을 한 줄로 — 규칙 검사는 이 글 전체에 건다 */
function flat(v, out) {
  out = out || [];
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => flat(x, out));
  else if (v && typeof v === 'object') Object.keys(v).forEach(k => flat(v[k], out));
  return out;
}
const words = flat(plan);
const text = words.join('\n');

console.log('\n[1] 자료가 한 벌인가');
is(/^\s*var EDU_PLAN\s*=/m.test(fs.readFileSync(PLAN, 'utf8')), '  EDU_PLAN 표가 plan.js 에 한 벌 있다');
is(!/var EDU_PLAN\s*=/.test(page), '  화면(index.html)이 표를 다시 만들지 않는다 — 읽어서 그리기만 한다');
is(/src="plan\.js"/.test(page), '  화면이 plan.js 를 읽는다');
/* 화면 안에 커리큘럼 본문이 통째로 박혀 있으면 두 벌이 된 것이다 */
const longInPage = words.filter(w => w.length > 40 && page.indexOf(w) >= 0);
is(longInPage.length === 0,
   '  표의 긴 문장이 화면에 복사돼 있지 않다' + (longInPage.length ? ' — 겹침: ' + longInPage[0].slice(0, 30) : ''));

console.log('\n[1-1] 새로 온 사람이 여는 입구가 있는가');
/* 이 문서의 나머지는 팀을 여는 사람이 본다. 이 칸만은 <b>새로 온 사람 본인</b>이 본다 */
const W = plan.welcome || {};
is(!!W.line && !!W.pick && !!W.first, '  첫 화면에 한 문장 · 갈래 고르기 · 읽는 순서가 있다');
is((plan.creed || []).length >= 5, '  우리 팀의 약속이 다섯 이상이다');
is((plan.creed || []).every(c => c[1] && c[1].length > 30), '  약속마다 <b>왜</b>가 붙어 있다 — 구호로 끝나지 않는다');
is(/모릅니다/.test(flat(plan.creed).join(' ')), '  「모릅니다」라고 말해도 된다고 먼저 말한다');
is(/혼자 두지 않습니다/.test(flat(plan.creed).join(' ')), '  혼자 두지 않는다고 적혀 있다');
is((plan.never || []).length >= 5, '  <b>하지 않는 일</b>이 다섯 이상이다 — 팀은 안 하는 일로 드러난다');
const nv = flat(plan.never).join(' ');
is(/손해가 되는 계약/.test(nv), '  고객에게 손해가 되는 계약은 팔지 않는다');
is(/자기 돈으로 계약하지 않습니다/.test(nv), '  실적 때문에 자기 돈으로 계약하지 않는다');
is(/확정|보장|무조건/.test(nv), '  단정 표현을 쓰지 않는다');
is(/실명/.test(nv), '  고객 실명을 밖으로 내보내지 않는다');
/* 「매니저 관리 문화」는 매니저가 지키는 것, 「약속」은 팀원이 받는 것 — 같은 문장이면 가른 뜻이 없다 */
const cultTxt = flat(plan.culture).join(' ');
const creedDup = flat(plan.creed).filter(t => typeof t === 'string' && t.length > 20 && cultTxt.indexOf(t) >= 0);
is(creedDup.length === 0, '  약속이 매니저 문화를 베끼지 않았다' + (creedDup.length ? ' — ' + creedDup[0].slice(0, 24) : ''));

console.log('\n[1-2] 방향성과 목표 — 스스로 이룰 수 있게 되어 있는가');
['new', 'career'].forEach(t => {
  const a = (plan.arc || {})[t] || [];
  is(a.length >= 3, '  ' + t + ' 갈래에 「○일 뒤의 나」가 셋 이상이다');
  /* 말투를 강요하지 않는다 — 방향을 한 줄로 말해 주는가만 본다 (CLAUDE.md 8) */
  is(a.every(x => x[3] && x[3].length > 8), '  ' + t + ' 마다 <b>어떤 사람이 되는가</b>가 한 줄로 있다');
  is(a.every(x => x[2] && x[2].length > 30), '  ' + t + ' 마다 왜 그런지 설명이 있다');
  is(((plan.firstWeek || {})[t] || []).length === 3, '  ' + t + ' 첫 주에 할 일이 셋이다 — 늘리지 않는다');
});
is(/첫 계약보다/.test(flat(plan.arc['new']).join(' ')), '  신입 첫 달은 계약이 아니라 완결을 본다');
is((plan.goalFields || []).length >= 4, '  목표를 세우는 칸이 있다');
is((plan.goalFields || []).every(f => f[0] && f[1] && f[2] !== undefined), '  칸마다 이름과 단위가 있다');
/* 수수료·타율은 앱이 만들어 주지 않는다 — 어디서 가져오는지가 적혀 있어야 한다 */
const gfTxt = flat(plan.goalFields).join(' ');
is(/회사 수수료 표/.test(gfTxt), '  수수료 값은 회사 표에서 옮겨 적는다고 적혀 있다');
is(/점수판|퍼널/.test(gfTxt), '  타율은 내 CRM 에서 옮겨 적는다고 적혀 있다');
is(/한 칸이라도 비면 숫자를 만들지 않습니다/.test(flat(plan.goalRules).join(' ')),
   '  한 칸이라도 비면 숫자를 만들지 않는다 (CLAUDE.md 1)');
is(/성장판|점수판/.test(page), '  이룬 숫자는 성장판·점수판이 든다고 가리킨다 — 두 곳에서 세지 않는다');

console.log('\n[1-3] SYSTEM MASTER — 서른 장 교과과정');
const cards = mast.cards || [];
is(cards.length === 30, '  카드가 서른 장이다 (' + cards.length + ')');
is(cards.map(c => c.n).join(',') === Array.from({length:30}, (_, i) => String(i+1).padStart(2,'0')).join(','),
   '  01 부터 30 까지 번호가 빠지거나 겹치지 않는다');
/* 규격이 같아야 찾지 않고 읽는다 — 일곱 항목 */
const F = ['what','when','need','steps','check','pass'];
const bad7 = cards.filter(c => F.some(k => !c[k] || !c[k].length));
is(bad7.length === 0, '  서른 장이 <b>같은 일곱 규격</b>을 지킨다' +
   (bad7.length ? ' — 빠짐: ' + bad7.map(c => c.n).join(',') : ''));
is(cards.every(c => Array.isArray(c.go) && c.go.length), '  카드마다 여는 화면이 붙어 있다');
const cardNos = new Set(cards.map(c => c.n));
const badNext = cards.filter(c => c.next && !cardNos.has(c.next));
is(badNext.length === 0, '  ⑦ 다음 단계가 실제 카드를 가리킨다' +
   (badNext.length ? ' — ' + badNext.map(c => c.n).join(',') : ''));
is(!cards[cards.length-1].next, '  마지막 장에는 다음이 없다');
/* 사용법 교재로 만들면 아무도 안 읽는다 — 고객이 하는 말로 「언제」가 적혀야 한다 */
const quoted = cards.filter(c => c.when.some(w => /「|」/.test(w))).length;
is(quoted >= 20, '  스무 장 넘는 카드의 「언제 쓰는가」가 <b>고객이 한 말</b>이다 (' + quoted + '장)');
/* 설정·도구 카드에는 고객의 말이 없는 게 맞다 — 고객을 마주하는 카드에만 건다 */
const facing = cards.filter(c => ['04','05','07','09','11','12','16','17','19','24','28','29'].indexOf(c.n) >= 0);
is(facing.every(c => c.when.some(w => /「/.test(w))),
   '  고객을 마주하는 열두 장에는 <b>빠짐없이</b> 고객의 말이 있다' +
   ' — 빠짐: ' + (facing.filter(c => !c.when.some(w => /「/.test(w))).map(c => c.n).join(',') || '없음'));
is(/사용법 교재가 아닙니다/.test(mast.notManual || ''), '  「사용법 교재가 아니다」를 못 박았다');
is((mast.fourUse || []).length === 4, '  하나를 만들어 네 군데에 쓴다고 적혀 있다');
is((mast.fourParts || []).length === 4, '  과정마다 네 개(영상·카드·연습·실전과제)가 있다고 적혀 있다');
is((mast.ways || []).length === 3, '  세 갈래로 배운다 (순서 · 상황 · 기능)');
is((mast.steps7 || []).length === 7, '  큰 걸음이 일곱이다');
is((mast.levels || []).length === 4, '  등급이 넷이다');
is(/FINAL MISSION|매니저 앞에서/.test(mast.gradeRule || ''),
   '  마지막 등급은 <b>혼자 찍어서 못 오른다</b>');

console.log('\n[1-4] 카드 ⑤ — 우리가 깨져 본 자리가 그 단계에 붙어 있는가');
/* 칸과 칸을 빈칸으로 이으면 「next:'22'」 뒤에 「세무…」가 붙어 <b>「22 세」</b>로 읽힌다.
   헛것을 잡는 점검은 안 잡는 점검보다 나쁘다 (CLAUDE.md 8) — 이을 때 막대를 끼운다. */
const cardTxt = flat(cards).join(' | ');
[['월 보험료를 비우면', 'FF 에 월 보험료 빈칸 경고'],
 ['「모름」과 「0」', '보장분석에 모름과 0 을 가르는 말'],
 ['검수 전에는', '검수 전에는 고객에게 안 나간다'],
 ['강점을 먼저', '강점을 먼저 말한다'],
 ['새로 생기는 단점', '비포&애프터에 잃는 것도'],
 ['만원과 원을 섞지', '현금흐름에 돈 단위 경고'],
 ['제안서에 없는 표', '연금에 없는 표 금지'],
 ['평균', '평균은 평균이라 밝힌다'],
 ['요건 충족 시', '상속·자산에 세금 요건 문구'],
 ['다시 넣어 읽히는지|다시 읽혀', '보고서에 PDF 왕복'],
 ['심사 결과에 따릅니다', '제안에 심사 문구']]
  .forEach(([re, label]) => is(new RegExp(re).test(cardTxt), '  ' + label));
/* 숫자는 견본 고객에만 — 카드 본문에 금액이 있으면 표가 바뀌는 순간 틀린 종이가 된다 */
const cardMoney = (cardTxt.match(/\d[\d,]*\s*(?:만원|억|원)/g) || []);
is(cardMoney.length === 0, '  카드 본문에 금액이 없다' + (cardMoney.length ? ' — ' + cardMoney.join(' / ') : ''));
const cardTax = (cardTxt.match(/\d+\s*(?:세|개월|년까지|년 이내)/g) || []);
is(cardTax.length === 0, '  카드 본문에 세법 한도·나이가 없다' + (cardTax.length ? ' — ' + cardTax.join(' / ') : ''));

console.log('\n[1-5] PLAYBOOK — 순서가 상황마다 다른가');
const pb = mast.playbook || [];
is(pb.length >= 6, '  상황이 여섯 이상이다 (' + pb.length + ')');
const badSeq = pb.filter(x => x.seq.some(n => !cardNos.has(n)));
is(badSeq.length === 0, '  플레이북이 부르는 카드가 전부 있다');
is(pb.every(x => x.say && x.note), '  상황마다 <b>고객의 말</b>과 <b>왜 이 순서인가</b>가 있다');
/* 순서가 다 같으면 상황별로 나눈 뜻이 없다 */
const seqs = new Set(pb.map(x => x.seq.join('-')));
is(seqs.size === pb.length, '  상황마다 순서가 서로 다르다');
const cheap = pb.find(x => /보험료/.test(x.t));
is(!!cheap && /TreatPay 를 처음부터 꺼내지 않습니다/.test(cheap.note),
   '  보험료 부담 고객에게는 TreatPay 를 먼저 꺼내지 않는다');
const cancer = pb.find(x => /암/.test(x.t));
is(!!cancer && cancer.seq.indexOf('09') < cancer.seq.indexOf('07'),
   '  암 걱정 고객은 <b>TreatPay 를 보장분석보다 먼저</b> 본다');

console.log('\n[1-6] 연습 고객 · FINAL MISSION');
const pr = mast.practice || [], fin = mast.final || {};
is(pr.length >= 3, '  연습 고객이 셋 이상이다');
is(pr.every(x => cardNos.has(x.at)), '  연습 고객이 실제 카드에 붙어 있다');
is(pr.every(x => x.task && x.pass), '  연습마다 과제와 합격 기준이 있다');
is(pr.every(x => x.who[0] === '홍길동') && fin.who[0] === '홍길동',
   '  견본 이름은 전부 홍길동이다 (CLAUDE.md 3)');
is((fin.must || []).length >= 6, '  FINAL 에 반드시 들어갈 것이 여섯 이상이다');
is(/설명도 하지 않습니다|아무 설명/.test(fin.order || ''), '  FINAL 은 순서를 알려 주지 않는다');
is(/순서를 스스로 고르는 것/.test(fin.note || ''), '  순서를 고르는 것이 시험이라고 적혀 있다');
const finPass = flat(fin.pass).join(' ');
is(/사실오류 0건/.test(finPass) && /단정 0건/.test(finPass), '  합격 기준에 사실오류·단정 0건이 있다');
is(/매니저 승인/.test(finPass), '  매니저 승인이 있어야 끝난다');

console.log('\n[1-7] 옛 초안이 남아 있지 않은가');
is(!plan.master && !plan.masterHow, '  plan.js 의 「15단계」 초안이 지워졌다 — 두 벌을 두지 않는다');
is(!/MASTER 15단계/.test(page), '  화면에도 옛 이름이 안 남았다');
is(/src="master\.js"/.test(page), '  화면이 master.js 를 읽는다');
is(!/var EDU_MASTER\s*=/.test(page), '  화면이 교과과정을 다시 만들지 않는다 — 읽어서 그리기만 한다');

console.log('\n[2] 있는 자료를 다시 적지 않고 가리키는가');
/* 12주 과정·미끼 화법은 앱 안에 이미 있다. 여기서는 화면으로 보내야 한다 */
['academy', 'mikki_talk', 'bohum', 'fp_talk'].forEach(id =>
  is(!!plan.screens[id], '  이름표에 ' + id + ' 가 있다 — 가리킬 수 있다'));
is(/본인 점검란|졸업 기준/.test(text), '  졸업 판정은 앱에 넘긴다고 적혀 있다');
is(/미끼상품&접촉전략|다시 적지 않습니다/.test(text), '  미끼 화법은 그쪽을 가리킨다');
/* 12주 주차 제목을 여기 옮겨 적었으면 두 벌이다 */
const wk = (app.match(/topic:'([^']+)'/g) || []).map(s => s.slice(7, -1));
const copied = wk.filter(t => t.length > 8 && text.indexOf(t) >= 0);
is(copied.length === 0, '  앱의 12주 주차 제목을 옮겨 적지 않았다' + (copied.length ? ' — ' + copied[0] : ''));

console.log('\n[3] 부르는 화면이 실제로 있는가');
const tabIds = new Set([...app.matchAll(/\{id:'([a-z_0-9]+)',icon:/g)].map(m => m[1]));
const dead = Object.keys(plan.screens).filter(id => !tabIds.has(id));
is(dead.length === 0, '  이름표의 화면이 전부 앱에 있다' + (dead.length ? ' — 없는 것: ' + dead.join(', ') : ''));
/* 표가 부르는 id 가 이름표에 다 있어야 한다 — 없으면 화면이 링크를 조용히 뺀다 */
const called = new Set();
const walk = v => {
  if (Array.isArray(v)) {
    if (v.every(x => typeof x === 'string') && v.length && v.every(x => /^[a-z_0-9]+$/.test(x))) v.forEach(x => called.add(x));
    v.forEach(walk);
  } else if (v && typeof v === 'object') Object.keys(v).forEach(k => { if (k !== 'screens') walk(v[k]); });
};
walk({ ...plan, screens: undefined });
const unnamed = [...called].filter(id => !plan.screens[id]);
is(unnamed.length === 0, '  표가 부르는 화면이 전부 이름표에 있다' + (unnamed.length ? ' — 빠짐: ' + unnamed.join(', ') : ''));
is(/target="_top"/.test(page), '  링크가 _top 으로 나간다 — 앱 안 액자에서도 화면이 바뀐다');

console.log('\n[4] 지어낸 숫자가 없는가');
/* 수수료율·환산배수·수익률을 적어 두면 회사가 표를 바꿨을 때 그대로 틀린다.
   다만 「출근 기록 90%」 같은 실행 목표까지 잡으면 헛것을 잡는 점검이 된다
   (CLAUDE.md 8). 그래서 돈 단위는 무조건 걸고, 퍼센트는 돈을 말하는
   낱말 옆에 있을 때만 건다. */
const money = text.match(/\d[\d,]*\s*(?:만원|억|원)/g) || [];
is(money.length === 0, '  수수료·금액 숫자가 한 개도 없다' + (money.length ? ' — ' + money.join(' / ') : ''));
const rate = [...text.matchAll(/[\s\S]{0,14}\d[\d.]*\s*(?:%|퍼센트)[\s\S]{0,10}/g)]
  .map(m => m[0]).filter(t => /수익|이율|환급|수수료|배당|원금|할인/.test(t));
is(rate.length === 0, '  수익률·수수료율을 적지 않았다' + (rate.length ? ' — ' + rate.join(' / ') : ''));
/* 세법 — 한도·나이·개월 수를 적지 않는다 (CLAUDE.md 2) */
const taxNum = text.match(/\d+\s*(?:세|개월|년까지|년 이내)/g) || [];
is(taxNum.length === 0, '  세법 한도·나이·개월 수를 적지 않았다' + (taxNum.length ? ' — ' + taxNum.join(' / ') : ''));
/* 역산 카드는 「내가 채우는 칸」이어야 한다 */
const car = plan.sessions.find(s => s.key === 'car');
is(!!car && Array.isArray(car.blanks) && car.blanks.length >= 3, '  역산 카드에 빈칸이 있다 — 값을 만들어 주지 않는다');
is(!!car && /회사 수수료 표/.test(flat(car.blanks).join(' ')), '  수수료 값은 회사 표에서 가져온다고 적혀 있다');
is(!!car && /내 기록|실제 값|가정하지 않습니다/.test(flat(car).join(' ')), '  타율은 내 CRM 기록에서 가져온다');

console.log('\n[5] 준법 문구가 빠지지 않았는가');
is(/요건 충족 시/.test(text), '  세금은 「요건 충족 시」 — 결론을 말하지 않는다');
is(/심사 결과에 따릅니다/.test(text), '  보험료·보장은 「심사 결과에 따릅니다」');
is(/약관/.test(text), '  약관이 앞선다고 적혀 있다');
is(Array.isArray(plan.compliance) && plan.compliance.length >= 4, '  산출물 고정 문구가 표에 있다');
is(/홍길동/.test(text) , '  견본 이름은 홍길동이다');
/* 실제 고객 이름이 섞이지 않았나 — 견본은 홍길동만 (CLAUDE.md 3) */
const names = (text.match(/[가-힣]{3}\s*(?:고객님|님께|씨)/g) || []).filter(s => !/홍길동/.test(s));
is(names.length === 0, '  실제 고객 이름이 없다' + (names.length ? ' — ' + names.join(' / ') : ''));

console.log('\n[6] 조회 대본이 서 있는가');
const days = (plan.meetings || []).map(m => m.day);
is(days.indexOf('월요일') >= 0 && days.indexOf('목요일') >= 0, '  월요일·목요일 두 대본이 다 있다');
(plan.meetings || []).forEach(m => {
  const sum = m.steps.reduce((a, s) => a + s[0], 0);
  is(sum > 0 && sum <= 45, '  ' + m.day + ' 대본이 ' + sum + '분 — 마흔다섯 분을 넘지 않는다');
  is(!!m.ban, '  ' + m.day + ' 에 「하지 않는 것」이 적혀 있다');
  is(m.steps.every(s => s[1] && s[2] !== undefined), '  ' + m.day + ' 칸마다 무엇을 하는지 적혀 있다');
});
is((plan.cover || []).length >= 6, '  커버 처방이 여섯 줄 이상이다 — 「열심히 합시다」로 끝나지 않는다');
is((plan.cover || []).every(c => c.length >= 5 && c[4] && c[4].length),
   '  처방마다 그 자리에서 열 화면이 붙어 있다');

console.log('\n[7] 매니저·신입 루틴이 서 있는가');
is((plan.mgrDay || []).length >= 5, '  매니저 하루가 다섯 칸 이상이다');
is((plan.newDay || []).length >= 5, '  신입 하루가 다섯 칸 이상이다');
is((plan.newbie90 || []).length >= 5, '  신입 90일 달력이 서 있다');
is((plan.gates || []).length === 4, '  게이트가 넷이다 (2·4·8·12주)');
is((plan.gates || []).every(g => g[3]), '  게이트마다 「왜 이것을 보나」가 적혀 있다');
is((plan.sessions || []).length >= 4, '  세션 카드가 넷 이상이다');
const news = (plan.sessions || []).find(s => s.key === 'news');
is(!!news && /9월 3일/.test(news.when), '  9월 3일 소식지 정리 카드가 있다');
is(!!news && !!news.who, '  담당이 적혀 있다');
is(!!news && Array.isArray(news.sheet) && news.sheet.length === 6, '  소식지 한 장이 여섯 칸이다');
is(!!news && /못 찾았습니다|빈칸을 채우지 않습니다/.test(flat(news.rules).join(' ')),
   '  못 찾으면 못 찾았다고 적는다 — 빈 자리를 채우지 않는다');
is(!!news && /유리한 것만/.test(flat(news).join(' ')), '  유리한 것만 뽑지 않는다가 적혀 있다');
is(!!news && /원문/.test(flat(news).join(' ')), '  약관은 원문 그대로 뽑는다');

console.log('\n[7-1] 주간 미션 — 요일마다 다른가');
const DAYS = ['월','화','수','목','금'];
const wk2 = plan.week || [];
is(wk2.length === 5, '  월요일부터 금요일까지 다섯 칸이다');
is(DAYS.every(d => wk2.some(w => w.day === d)), '  빠진 요일이 없다');
is(wk2.every(w => (w.miss || []).length >= 3), '  요일마다 미션이 세 개 이상이다');
/* 「이날 안 하는 것」이 없으면 결국 매일 다 조금씩 하다 끝난다 */
is(wk2.every(w => !!w.no), '  요일마다 「이날 안 하는 것」이 있다');
is(wk2.every(w => !!w.see), '  요일마다 무엇으로 확인하는지 있다');
/* 요일이 서로 달라야 요일을 나눈 뜻이 있다 */
const heads = wk2.map(w => w.head);
is(new Set(heads).size === heads.length, '  요일마다 하는 일이 서로 다르다');
/* 화요일은 전화, 수요일은 상담 — 뒤바뀌면 한 주가 안 돈다 */
is(/전화/.test((wk2.find(w => w.day === '화') || {}).head || ''), '  화요일은 전화의 날이다');
is(/상담/.test((wk2.find(w => w.day === '수') || {}).head || ''), '  수요일은 상담의 날이다');

console.log('\n[7-2] 월간 미션 — 네 주의 초점이 다른가');
const mo = plan.monthly || {};
is((mo.open || []).length >= 3, '  달을 여는 날에 할 일이 있다');
is((mo.weeks || []).length === 4, '  네 주가 다 있다');
is((mo.weeks || []).every(w => w[1] && w[2]), '  주마다 초점과 까닭이 적혀 있다');
const focus = (mo.weeks || []).map(w => w[1]);
is(new Set(focus).size === focus.length, '  네 주의 초점이 서로 다르다' + (new Set(focus).size !== focus.length ? ' — ' + focus.join('/') : ''));
is((mo.close || []).length >= 2, '  달을 닫는 날에 할 일이 있다');
is(/가장 낮은 축|하나/.test(flat(mo.close).join(' ')), '  미달인 달에 축 하나만 고른다고 적혀 있다');
is((mo.team || []).length >= 2, '  팀이 한 달에 하는 일이 있다');
/* 하루 시간표와 요일 미션과 달 미션이 서로 베끼지 않았나 */
const dayTxt = flat(plan.newDay).join(' ');
const dup = flat(plan.week).filter(t => typeof t === 'string' && t.length > 25 && dayTxt.indexOf(t) >= 0);
is(dup.length === 0, '  주간 미션이 하루 시간표를 베끼지 않았다' + (dup.length ? ' — ' + dup[0].slice(0, 24) : ''));

console.log('\n[7-3] 공부 — 확인하는 방법이 붙어 있는가');
is((plan.studyRhythm || []).length >= 4, '  공부 리듬이 네 칸 이상이다');
is((plan.study || []).length >= 6, '  공부 영역이 여섯 개 이상이다');
is((plan.study || []).every(x => Array.isArray(x[2]) && x[2].length), '  영역마다 <b>어디서</b> 하는지 화면이 붙어 있다');
is((plan.study || []).every(x => x[3] && x[3].length > 4), '  영역마다 <b>어떻게 확인하는지</b>가 있다');
is(/외우지 않습니다|확인하는지를 외웁니다|어디서 확인/.test(flat(plan.study).join(' ') + flat(plan.studyRhythm).join(' ')),
   '  숫자를 외우지 않고 확인처를 외운다고 적혀 있다');

console.log('\n[7-4] 경력 교육 — 신입 과정을 다시 시키지 않는가');
is((plan.careerWhy || []).length >= 3, '  경력이 막히는 자리가 적혀 있다');
is((plan.career || []).length === 8, '  경력 과정이 여덟 주다');
is((plan.career || []).every(c => c[4] && c[4].length > 3), '  주마다 <b>남길 것</b>이 있다');
is((plan.career || []).every(c => Array.isArray(c[5]) && c[5].length), '  주마다 여는 화면이 붙어 있다');
is((plan.careerGates || []).length === 2, '  경력 게이트가 둘이다');
is((plan.careerRules || []).length >= 4, '  경력을 다루는 규칙이 있다');
is(/다시 시키지 않습니다/.test(plan.careerLead || ''), '  신입 과정을 다시 시키지 않는다고 못 박았다');
is(!!plan.careerLead && page.indexOf(plan.careerLead) < 0, '  그 문장이 화면에 복사돼 있지 않다 — 표에서 읽는다');
/* 경력 여덟 주가 신입 게이트를 베낀 것이면 두 과정을 나눈 뜻이 없다 */
const gateTxt = flat(plan.gates).join(' ');
const cdup = flat(plan.career).filter(t => typeof t === 'string' && t.length > 20 && gateTxt.indexOf(t) >= 0);
is(cdup.length === 0, '  경력 과정이 신입 게이트를 베끼지 않았다' + (cdup.length ? ' — ' + cdup[0].slice(0, 24) : ''));
/* 경력의 알맹이 — 보유 명부·청구·법인/상속·코칭이 빠지면 신입 과정과 다를 게 없다 */
const cTxt = flat(plan.career).join(' ');
[['보유|명부|식은', '보유 고객을 다시 판다'], ['청구', '청구를 자산으로 쓴다'],
 ['사업자|법인', '법인·사업자를 다룬다'], ['상속|자산이전', '상속·자산이전을 다룬다'],
 ['코칭|후배', '후배 코칭으로 닫는다']]
  .forEach(([re, label]) => is(new RegExp(re).test(cTxt), '  ' + label));
/* 상속은 결론을 말하면 안 되는 자리다 */
is(/요건 충족 시/.test(cTxt), '  상속 주차에 「요건 충족 시」가 붙어 있다');

console.log('\n[7-5] 지점장과 교육매니저가 갈려 있는가');
const who = plan.who || {};
is((who.axis || []).length >= 3, '  둘이 보는 축을 갈라 적었다');
is(/같은 것을 두 사람이 챙기지 않습니다/.test(who.rule || ''), '  같은 것을 둘이 챙기지 않는다고 못 박았다');
['week', 'month', 'quarter'].forEach(k =>
  is(((plan.lead || {})[k] || []).length >= 3, '  지점장 ' + k + ' 목록이 있다'));
['day', 'week', 'month', 'quarter'].forEach(k =>
  is(((plan.edu || {})[k] || []).length >= 2, '  교육매니저 ' + k + ' 목록이 있다'));
is((plan.leadNo || []).length >= 3, '  지점장이 <b>하지 않는 것</b>이 적혀 있다');
is(/공부를 묻지 않습니다/.test(flat(plan.leadNo).join(' ')), '  공부는 교육매니저 몫이라고 갈라 뒀다');
/* 두 목록이 같은 문장을 들고 있으면 가른 뜻이 없다 */
const leadTxt = flat({ d: plan.mgrDay, l: plan.lead }).filter(t => typeof t === 'string' && t.length > 18);
const eduTxt = flat(plan.edu).join(' ');
const both = leadTxt.filter(t => eduTxt.indexOf(t) >= 0);
is(both.length === 0, '  두 목록이 같은 일을 적지 않았다' + (both.length ? ' — ' + both[0].slice(0, 26) : ''));
/* 지점장은 숫자, 교육매니저는 사람 — 알맹이가 바뀌면 가른 뜻이 없다 */
is(/게이트/.test(eduTxt), '  교육매니저가 게이트를 본다');
is(/롤플레이/.test(eduTxt), '  교육매니저가 롤플레이 상대가 된다');
is(/커리큘럼 자체를 손봅니다/.test(eduTxt), '  분기마다 커리큘럼 자체를 손본다');
is(/마감|회수/.test(flat(plan.lead).join(' ')), '  지점장이 마감·회수를 본다');

console.log('\n[7-6] 캘린더 규칙');
is((plan.calRules || []).length >= 4, '  캘린더 규칙이 있다');
const cr = flat(plan.calRules).join(' ');
is(/자동으로 깔립니다/.test(cr), '  고정 리듬은 자동으로 깔린다');
is(/셋을 넘기지 않습니다/.test(cr), '  한 날에 셋을 넘기지 않는다');
is(/실명을 적지 않습니다/.test(cr), '  고객 실명을 적지 않는다 (CLAUDE.md 3)');
is(/이 브라우저에만/.test(cr), '  서버로 나가지 않는다고 적혀 있다');
/* 달력이 요일 이름을 다시 적어 두면 주간 미션과 두 벌이 된다 */
is(/wkOf\[P\.week\[i\]\.day\]/.test(page), '  달력이 요일 미션을 <b>표에서</b> 읽는다');
is(/P\.monthly\.weeks\[wn ?- ?1\]/.test(page), '  달력이 주차 초점을 <b>표에서</b> 읽는다');
is(!/'월','화','수','목','금'/.test(page.replace(/DOW=\[[^\]]*\]/g, '')),
   '  달력에 요일 미션을 손으로 다시 적지 않았다');

console.log('\n[8] 인쇄가 종이로 나오는가');
is(!/font-feature-settings/.test(page),
   '  tnum 을 켜지 않았다 — 켜고 PDF 로 저장하면 숫자가 유니코드를 잃는다');
is(/@media print/.test(page), '  인쇄 규칙이 있다');
is(/beforeprint/.test(page), '  인쇄할 때 모든 칸을 펼친다 — 한 칸만 뽑히지 않는다');

console.log('\n[9] 앱 메뉴에 서 있는가');
is(/\{id:'edu_plan'/.test(app), '  메뉴에 교육 운영 커리큘럼이 있다');
is(/EDUPLAN_URL='교육\/index\.html'/.test(app), '  앱이 이 화면을 가리킨다');
is(/tab==='edu_plan'/.test(app), '  go() 가 이 화면을 연다');
is(/'eduplan-mode'/.test(app) && /OS_FULL_MODES=[\s\S]{0,200}eduplan-mode/.test(app),
   '  전체화면 목록에 들어 있다 — 다른 화면 위에 겹쳐 남지 않는다');
is(/eduplan-mode'\)\)exitEduPlan\(\)/.test(app), 'Esc 로 빠져나온다');

/* ── 여기까지는 글자만 봤다. 아래는 실제로 열어 본다.
      가로로 밀리는 것은 글자만 봐서는 안 보인다 — 실제로 그렇게 새어 나갔다. ── */
const { chromium } = require('playwright');
const http = require('http');
const PORT = 8873;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.json':'application/json' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(PORT);

/* 로그인·서버는 가짜로 — 그리기만 본다 */
const STUB = `window.supabase={createClient:function(){var mk=function(){var a={select:function(){return a},eq:function(){return a},
 gte:function(){return a},lte:function(){return a},is:function(){return a},neq:function(){return a},in:function(){return a},
 not:function(){return a},order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
 insert:function(){return a},update:function(){return a},upsert:function(){return a},
 then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
 storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
 auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'s',email:'s@t'}}}})},
  getUser:function(){return Promise.resolve({data:{user:{id:'s'}}})},
  onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
  signOut:function(){return Promise.resolve({})}}};}};`;

(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('' + e));
  /* 바깥 주소를 못 부르는 것은 이 점검이 볼 일이 아니다 — 그물 밖으로 뺀다 */
  pg.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::|ERR_/.test(t)) return;
    errs.push(t);
  });

  console.log('\n[10] 좁은 화면에서 실제로 열리는가');
  await pg.goto('http://127.0.0.1:' + PORT + '/app/' + encodeURIComponent('교육') + '/index.html',
    { waitUntil: 'networkidle' });
  const tabs = await pg.$$eval('.tb', n => n.map(x => x.textContent));
  is(tabs.length >= 8, '  칸이 ' + tabs.length + '개 섰다');
  let over = [], thin = [];
  for (const t of tabs) {
    await pg.click('.tb:text-is("' + t + '")');
    await pg.waitForTimeout(90);
    const w = await pg.evaluate(() => document.documentElement.scrollWidth);
    const len = await pg.$eval('#pane', n => n.innerText.length);
    if (w > 392) over.push(t + '(' + w + ')');
    if (len < 300) thin.push(t + '(' + len + '자)');
  }
  is(over.length === 0, '  가로로 안 밀린다' + (over.length ? ' — ' + over.join(', ') : ''));
  is(thin.length === 0, '  빈 칸이 없다' + (thin.length ? ' — ' + thin.join(', ') : ''));
  /* 그리다 터진 칸은 <b>앞 칸 내용이 그대로 남아</b> 글자 수가 넉넉하다 — 위 두 줄을 통과해 버린다.
     실제로 그렇게 조용히 죽어 있었다. 그래서 칸마다 그 칸에만 있는 말이 있는지 본다. */
  const MARK = { welcome:'우리 팀의 약속', master:'FINAL MISSION', me:'이번 달 나의 목표',
    cal:'주차', week:'이날 안 하는 것', monthly:'네 주의 초점', lead:'지점장', edu:'교육매니저',
    meet:'조회', cover:'커버 처방', study:'공부 리듬', path:'어디로 가는가', gate:'게이트',
    ses:'세션 카드', news:'소식지', run:'어디에 무엇이 있나', law:'산출물' };
  const dead = [];
  for (const t of tabs) {
    await pg.click('.tb:text-is("' + t + '")');
    await pg.waitForTimeout(80);
    const v = await pg.$eval('.tb.on', n => n.getAttribute('data-v'));
    const mk = MARK[v];
    if (!mk) continue;
    const txt = await pg.$eval('#pane', n => n.innerText);
    if (txt.indexOf(mk) < 0) dead.push(t);
  }
  is(dead.length === 0, '  칸마다 <b>제 내용</b>이 그려진다 — 조용히 죽어 앞 칸이 남지 않는다' +
     (dead.length ? ' — ' + dead.join(', ') : ''));
  is(errs.length === 0, '  칸을 다 눌러 보는 동안 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n[11] 인쇄하면 전부 담기는가');
  await pg.emulateMedia({ media: 'print' });
  await pg.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await pg.waitForTimeout(200);
  const panes = await pg.$$eval('.pane', n => n.length);
  const plen = await pg.$eval('#pane', n => n.innerText.length);
  is(panes === tabs.length + 1,
     '  인쇄본에 ' + panes + '칸 — 화면 ' + tabs.length + '칸 + <b>안 고른 갈래</b> 한 칸');
  const ptxt = await pg.$eval('#pane', n => n.innerText);
  is(/한 바퀴를 돕니다/.test(ptxt) && /내 명부를 다시 봅니다/.test(ptxt),
     '  종이에는 신입·경력 <b>두 갈래가 다</b> 담긴다 — 팀이 돌려 보기 때문');
  is(plen > 25000, '  내용이 충분하다 (' + plen + '자)');
  await pg.emulateMedia({ media: 'screen' });

  console.log('\n[11-1] 캘린더가 실제로 굴러가는가');
  await pg.setViewportSize({ width: 1100, height: 900 });
  await pg.click('.tb:text-is("📅 캘린더")');
  await pg.waitForTimeout(200);
  const now = new Date(), pad = n => (n < 10 ? '0' : '') + n;
  const mk = d => now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(d);
  is((await pg.$$('.cal td')).length > 28, '  달력이 그려진다');
  is((await pg.$$('.fx')).length > 15, '  고정 리듬이 자동으로 깔린다 (' + (await pg.$$('.fx')).length + '개)');
  is((await pg.$$('.wkf')).length === 4, '  주차 초점 넷이 왼쪽에 선다');
  /* 넣기 · 남기 · 지우기 */
  const D1 = mk(3), D2 = mk(4);
  for (let i = 1; i <= 3; i++) {
    pg.once('dialog', d => d.accept('시험 ' + i));
    await pg.click('[data-add="' + D1 + '"]'); await pg.waitForTimeout(180);
  }
  is((await pg.$$('[data-del="' + D1 + '"]')).length === 3, '  넣은 것이 그 날에 붙는다');
  is((await pg.$$('[data-add="' + D1 + '"]')).length === 0, '  셋이 차면 더 못 넣는다');
  is((await pg.$$('[data-add="' + D2 + '"]')).length === 1, '  다른 날은 그대로 넣을 수 있다');
  pg.once('dialog', d => d.accept('   '));
  await pg.click('[data-add="' + D2 + '"]'); await pg.waitForTimeout(180);
  is((await pg.$$('[data-del="' + D2 + '"]')).length === 0, '  빈 글은 안 들어간다');
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.click('.tb:text-is("📅 캘린더")'); await pg.waitForTimeout(200);
  is((await pg.$$('[data-del="' + D1 + '"]')).length === 3, '  새로고침해도 남아 있다');
  await pg.click('[data-cal="next"]'); await pg.waitForTimeout(180);
  is((await pg.$$('.mine')).length === 0, '  다음 달은 비어 있다 — 달마다 따로 남는다');
  is((await pg.$$('.fx')).length > 15, '  다음 달에도 고정 리듬은 깔린다');
  await pg.click('[data-cal="today"]'); await pg.waitForTimeout(180);
  is((await pg.$$('.mine')).length === 3, '  이번 달로 돌아오면 그대로 있다');
  await pg.click('.mine'); await pg.waitForTimeout(180);
  is((await pg.$$('.mine')).length === 2, '  눌러서 지워진다');
  pg.once('dialog', d => d.accept());
  await pg.click('[data-cal="clear"]'); await pg.waitForTimeout(250);
  is((await pg.$$('.mine')).length === 0 && (await pg.$$('.fx')).length > 15,
     '  비우기는 <b>내가 넣은 것만</b> 지운다 — 고정 리듬은 남는다');

  console.log('\n[11-2] 두 리스트가 따로 남는가');
  await pg.click('.tb:text-is("지점장")'); await pg.waitForTimeout(200);
  const leadN = (await pg.$$('.ck')).length;
  is(leadN >= 15, '  지점장 칸이 ' + leadN + '개 선다');
  await pg.click('.ck'); await pg.waitForTimeout(180);
  is((await pg.$$('.ck.on')).length === 1, '  찍힌다');
  await pg.click('.tb:text-is("교육매니저")'); await pg.waitForTimeout(200);
  is((await pg.$$('.ck')).length >= 12, '  교육매니저 칸이 선다');
  is((await pg.$$('.ck.on')).length === 0, '  지점장이 찍은 것이 교육매니저에 안 섞인다');
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.click('.tb:text-is("지점장")'); await pg.waitForTimeout(200);
  is((await pg.$$('.ck.on')).length === 1, '  새로고침해도 찍힌 것이 남는다');
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.setViewportSize({ width: 390, height: 844 });

  console.log('\n[11-3] 새로 온 사람이 실제로 굴려 볼 수 있는가');
  /* 처음 여는 사람과 같은 자리에서 잰다 — 앞 시험이 남긴 주소 뒤 이름표까지 턴다 */
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/' + encodeURIComponent('교육') + '/index.html',
    { waitUntil: 'networkidle' });
  is(/환영합니다/.test(await pg.$eval('.tb.on', n => n.textContent)), '  열면 <b>환영합니다</b>부터 나온다');
  let txt = await pg.$eval('#pane', n => n.innerText);
  is(/신입으로 오신 분/.test(txt), '  안 고르면 신입 기준으로 보여 준다');
  await pg.click('[data-tk="career"]'); await pg.waitForTimeout(200);
  txt = await pg.$eval('#pane', n => n.innerText);
  is(/경력으로 오신 분/.test(txt), '  경력을 고르면 첫 주 할 일이 바뀐다');
  await pg.click('.tb:text-is("나의 과정")'); await pg.waitForTimeout(200);
  txt = await pg.$eval('#pane', n => n.innerText);
  /* 각 갈래의 속살에만 있는 말로 잰다 — 방향성 문구는 둘 다 위쪽에 나오므로 잣대가 못 된다 */
  is(/경력이 막히는 자리/.test(txt) && !/신입 90일 달력/.test(txt),
     '  내 갈래의 길만 보인다 — 남의 길까지 읽히지 않는다');
  await pg.click('.tb:text-is("나의 목표")'); await pg.waitForTimeout(200);
  is(/아직 숫자를 만들지 않습니다/.test(await pg.$eval('#pane', n => n.innerText)),
     '  칸이 비면 숫자를 만들지 않는다');
  const G = { incomeMan: 600, perMan: 12, pc: 30, ap: 20, days: 20 };
  for (const k in G) {
    await pg.fill('[data-goal="' + k + '"]', String(G[k]));
    await pg.evaluate(() => document.activeElement.blur());
    await pg.waitForTimeout(140);
  }
  const cards = await pg.$$eval('.rc', n => n.map(x => x.innerText.replace(/\n/g, ' ')));
  is(/오늘 걸 통화/.test(cards.join(' ')), '  다 채우면 <b>오늘 걸 통화</b>까지 내려온다');
  is(/42/.test(cards.join(' ')), '  역산이 맞다 (600÷12÷0.3÷0.2÷20 = 42)');
  await pg.fill('[data-goal="perMan"]', '');
  await pg.evaluate(() => document.activeElement.blur());
  await pg.waitForTimeout(200);
  is(/아직 숫자를 만들지 않습니다/.test(await pg.$eval('#pane', n => n.innerText)),
     '  한 칸을 비우면 <b>도로 안 만든다</b> — 남은 숫자를 그대로 두지 않는다');
  await pg.fill('[data-me="start"]', '2026-08-03');
  await pg.evaluate(() => document.activeElement.blur());
  await pg.waitForTimeout(200);
  is(/일째/.test(await pg.$eval('#pane', n => n.innerText)), '  시작일을 넣으면 며칠째인지 센다');
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.click('.tb:text-is("환영합니다")'); await pg.waitForTimeout(200);
  is(/경력으로 오신 분/.test(await pg.$eval('#pane', n => n.innerText)), '  새로고침해도 고른 갈래가 남는다');
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });

  console.log('\n[11-4] SYSTEM MASTER 를 실제로 굴려 보는가');
  await pg.setViewportSize({ width: 1100, height: 900 });
  await pg.click('.tb:text-is("SYSTEM MASTER")'); await pg.waitForTimeout(250);
  is((await pg.$$('.ms')).length === 30, '  카드 서른 장이 선다');
  is((await pg.$$('.wy')).length === 3, '  배우는 갈래가 셋 선다');
  is(/0 \/ 30/.test(await pg.$eval('.prog .n', n => n.textContent)), '  진행이 0 부터 시작한다');
  /* 카드를 편다 — 일곱 규격이 다 나오나 */
  await pg.click('.ms .mh .mt'); await pg.waitForTimeout(250);
  const cardTxt2 = await pg.$eval('.ms .mb', n => n.innerText).catch(() => '');
  is(['언제 쓰는가', '어떤 자료', '사용 순서', '놓치면', '합격', '다음'].every(k => cardTxt2.indexOf(k) >= 0),
     '  펴면 일곱 규격이 다 나온다');
  /* 지운다 */
  await pg.click('.ms .bx'); await pg.waitForTimeout(250);
  is((await pg.$$('.ms.on')).length === 1, '  눌러서 지워진다');
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForTimeout(300);
  is(/1 \/ 30/.test(await pg.$eval('.prog .n', n => n.textContent)), '  새로고침해도 진도가 남는다');
  /* 상황으로 배우기 */
  await pg.click('[data-way="play"]'); await pg.waitForTimeout(250);
  is((await pg.$$('.pbc')).length >= 6, '  상황이 여섯 이상 선다');
  is(/TreatPay 를 처음부터 꺼내지 않습니다/.test(await pg.$eval('#pane', n => n.innerText)),
     '  보험료 부담 고객에게 TreatPay 를 먼저 꺼내지 말라고 화면에 뜬다');
  await pg.click('.sq b'); await pg.waitForTimeout(350);
  is((await pg.$$('.ms .mb')).length >= 1, '  플레이북 번호를 누르면 그 카드가 펴진다');
  /* 기능으로 찾기 */
  await pg.fill('[data-msq]', '연금');
  await pg.waitForTimeout(600);
  const found = (await pg.$$('.ms')).length;
  is(found > 0 && found < 30, '  낱말로 걸러진다 (' + found + '장)');
  is(await pg.evaluate(() => document.activeElement.hasAttribute('data-msq')),
     '  찾는 동안 <b>커서가 칸에 남는다</b>');
  await pg.fill('[data-msq]', 'zzz없는낱말');
  await pg.waitForTimeout(600);
  is(/못 찾았습니다/.test(await pg.$eval('#pane', n => n.innerText)),
     '  못 찾으면 <b>못 찾았다고 말한다</b> — 빈 화면으로 두지 않는다');
  await pg.fill('[data-msq]', '');
  await pg.waitForTimeout(600);
  is((await pg.$$('.ms')).length === 30, '  비우면 서른 장이 돌아온다');
  /* 순서로 배우기 · FINAL */
  await pg.click('[data-way="map"]'); await pg.waitForTimeout(300);
  const mapTxt = await pg.$eval('#pane', n => n.innerText);
  is((await pg.$$('.lvh')).length === 4, '  등급 넷이 선다');
  is(/FINAL MISSION/.test(mapTxt), '  FINAL MISSION 이 마지막에 선다');
  is(!/김APEX|김철수|이철수/.test(mapTxt), '  견본 이름이 홍길동 말고는 없다');
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await pg.setViewportSize({ width: 390, height: 844 });

  console.log('\n[12] 앱 메뉴에서 열리고 빠져나오는가');
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html?go=edu_plan', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3500);
  is(/eduplan-mode/.test(await pg.evaluate(() => document.body.className)), '  메뉴로 들어가면 그 화면이 열린다');
  const fr = pg.frames().find(f => /%EA%B5%90%EC%9C%A1/.test(f.url()));
  is(!!fr, '  액자에 커리큘럼이 붙는다');
  if (fr) {
    await fr.waitForSelector('.tb', { timeout: 8000 }).catch(() => {});
    is((await fr.$$('.tb')).length >= 8, '  앱 안에서도 칸이 다 선다');
  }
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(600);
  is(!/eduplan-mode/.test(await pg.evaluate(() => document.body.className)), '  Esc 로 워크스페이스로 돌아온다');
  is(errs.length === 0, '  중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '건\n' : '\n교육 운영 커리큘럼 점검 통과\n');
  process.exit(bad ? 1 : 0);
})();
