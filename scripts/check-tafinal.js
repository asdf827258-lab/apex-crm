/* ☎️ <b>TA 스크립트 새 판</b> (판 X104 · 사장님 말씀 2026-10-14
   「CRM 의 TA 스크립트 내용을 모두 지워버리고 이걸 첨부」 · 「반문자료를 포기가 아닌, 왜 만족했는지」)

   온탑 「TA스크립트」 PPT 를 토대로 다시 쓴 판을 CRM 에 붙였습니다. 이 자가 못 박는 것 —

     ① 거절은 <b>apex-stage.js 한 곳</b>에 있다 (5번). 스물여덟 가지가 모두
        바로 말할 멘트·다음 한마디·금지 표현·종료 기준(홈이 쓰는 넷) + 💭 속마음 · 🌟 만나 본 분들이
        좋아하신 점 · 3초 첫 마디 · 4단 대사 · 고객 재반응 셋 이상 · ⏱ 다음 타이밍을 들고 있다
     ② CRM 원래 열일곱의 <b>제목이 그대로</b>다 — 신입 TA 교육(ref)·거절 근육 훈련 기록이 제목으로 묶여 있다
     ③ <b>지어내지 않는다</b> (1번) — 홈처럼 이름·DB 를 모르고 부르면 자리가 글자 그대로 새지 않고
        두루 쓰는 말이 된다. 「무조건」「100%」 가 없고 돈·나이·개월 수·비율을 안 적는다 (2번)
     ④ 물러서는 말이 <b>포기처럼 안 들린다</b> — 「문 열어 두기」 로 끝나되, 지워 달라·연락 말라·신고·운전 중은
        권유 없이 정중히 마무리한다(close:'respect')
     ⑤ 욕설·화를 내도 <b>끊지 않고 공감부터</b> — 첫 마디가 사과·공감이고, 끊는 것은 재반응의 마지막 갈래뿐이다
     ⑥ ta-script.html 은 표를 <b>읽기만</b> 한다 — apex-stage.js · ta-trend.js 를 싣고, 거절 제목·화제 글을 또 적지 않는다.
        옛 대본 보기(「내 CRM 원본 대본」)는 없다 — 사장님 말씀대로 지웠다                                  */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const box = { window: {} }; box.window = box;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8'), box);
const A = box.APEX_STAGE, L = A.objList();

console.log('\n[1] 거절 표 — 한 곳, 다 들고 있나');
is(L.length === 28, '  거절이 <b>스물여덟</b> 가지 — ' + L.length);
const 빠짐 = L.filter(o => !(o.title && o.text && o.follow && o.avoid && o.stop && o.heart && o.sat && o.one &&
  Array.isArray(o.say) && o.say.length >= 3 && Array.isArray(o.br) && o.br.length >= 3 && o.next && o.next.when));
is(빠짐.length === 0, '  모두 넷(홈) + 속마음·만족·첫 마디·4단·재반응·다음 타이밍 — 빠진 것 ' + (빠짐.map(o => o.title).join(',') || '없음'));
const 키 = L.map(o => o.key);
is(new Set(키).size === 28, '  열쇠(key)가 겹치지 않는다');

console.log('\n[2] CRM 원래 제목이 그대로');
const 옛 = ['사은품만 신청했어요', '화재보험 이미 있어요', '가입 생각 없어요', '지금 바빠요', '보험 이미 있어요', '담당자 있어요',
  '방문이 부담돼요', '문자로 보내주세요', '생각해 볼게요', '돈 여유 없어요', '필요 없어요', '주민번호가 불안해요',
  '어디서 전화했어요?', '사기 아닌가요?', '가족과 상의할게요', '주소를 어떻게 알았어요?', '실비청구만 해주세요'];
const 제목 = L.map(o => o.title);
const 없음 = 옛.filter(t => 제목.indexOf(t) < 0);
is(없음.length === 0, '  열일곱 제목이 다 있다 — 없는 것 ' + (없음.join(',') || '없음'));
const TT = fs.readFileSync(path.join(ROOT, 'app/ta-train.html'), 'utf8');
const refs = (TT.match(/ref:'([^']+)'/g) || []).map(x => x.slice(5, -1));
is(refs.length > 0 && refs.every(r => 제목.indexOf(r) >= 0), '  신입 TA 교육이 가리키는 제목 ' + refs.length + '개가 다 표에 있다');

console.log('\n[3] 지어내지 않는다 · 숫자·단정 없음');
const RX = /\{(cnt|date|src|kw|area|office)\}|\[(고객|나|①|②|와과)\]/;
const 샘 = [];
L.forEach(o => [o.text, o.follow, o.one].concat(o.say.map(x => x[1]), o.br.map(b => b.a), [o.next.say])
  .concat((o.flow || []).map(f => f.say)).forEach(t => {
    const a = A.objFill(t, '', ''), b = A.objFill(t, '홍길동', '보장분석3DB');
    if (RX.test(a) || RX.test(b)) 샘.push(o.title + ':' + (a.match(RX) || b.match(RX))[0]);
  }));
is(샘.length === 0, '  이름·DB 를 몰라도 자리가 <b>글자 그대로 새지 않는다</b> — ' + (샘.slice(0, 4).join(' · ') || '없음'));
is(A.objFill('저는 OOO이고 “유입 경로” 건입니다', '', '') === '저는 OOO이고 “유입 경로” 건입니다',
   '  모르면 <b>적힌 그대로</b> — 예전 자리(OOO · 유입 경로)는 지어내지 않는다');
const 단정 = [], 숫자 = [];
L.forEach(o => {
  const 말 = [o.text, o.follow].concat(o.say.map(x => x[1]), o.br.map(b => b.a)).join(' ');
  (말.match(/무조건|100%|반드시 줄|확실히 더/g) || []).forEach(m => 단정.push(o.title + ':' + m));
  ([o.text, o.follow].join(' ').match(/\d+\s*(만원|원|세|개월|%|배|억)/g) || []).forEach(m => 숫자.push(o.title + ':' + m));
});
is(단정.length === 0, '  「무조건 · 100%」 같은 단정이 없다 — ' + (단정.join(',') || '없음'));
is(숫자.length === 0, '  멘트에 돈·나이·개월 수·비율이 없다 (2번) — ' + (숫자.join(',') || '없음'));

console.log('\n[4] 물러서는 말 — 포기가 아니라 문 열어 두기');
const 끝 = []; L.forEach(o => o.br.forEach(b => { if (b.stop) 끝.push({ t: o.title, c: b.close, a: b.a }); }));
is(끝.length >= 8 && 끝.every(x => x.c === 'open' || x.c === 'respect'), '  마무리 갈래 ' + 끝.length + '개가 모두 「문 열어 두기」 아니면 「정중히 마무리」');
const 열기 = 끝.filter(x => x.c === 'open');
is(열기.length >= 5 && 열기.every(x => /편하게|언제든|그때/.test(x.a)), '  「문 열어 두기」 는 다음에 연락할 길을 남긴다 — ' + 열기.length + '개');
const 정중 = 끝.filter(x => x.c === 'respect');
is(정중.length >= 4 && 정중.every(x => !/좋아하시|만족|받아 보시/.test(x.a)), '  지워 달라·연락 말라·신고는 <b>권유 없이</b> 마무리 — ' + 정중.length + '개');
is(L.every(o => /좋아하|만족|하세요|하시더라고요|경우가/.test(o.sat)), '  모든 거절에 🌟 만나 본 분들이 좋아하신 점이 있다');

console.log('\n[5] 화를 내도 끊지 않는다');
const 욕 = L.filter(o => o.key === 'abuse')[0];
is(!!욕 && /죄송|속상/.test(욕.one) && !욕.br.slice(0, -1).some(b => b.stop), '  첫 마디가 공감·사과이고, 끊는 것은 <b>마지막 갈래</b>뿐이다');

console.log('\n[6] ta-script.html 은 읽기만');
const TA = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
is(/<script src="apex-stage\.js"><\/script>/.test(TA) && /APEX_STAGE\.objList/.test(TA), '  apex-stage.js 를 싣고 거절 표를 거기서 받는다');
is(/<script src="ta-trend\.js"><\/script>/.test(TA) && /TA_TREND/.test(TA), '  ta-trend.js 를 싣는다');
/* 표를 베꼈는지는 <b>표 모양</b>(title:'…')으로만 봅니다 — 롤플레잉 카드의 고객 대사 「지금 바빠요.」 처럼
   같은 말이 글로 나오는 것은 베낀 것이 아닙니다 (8번 — 헛것을 잡는 점검은 안 잡는 점검보다 나쁘다). */
const 베낌 = 제목.filter(t => new RegExp('"?title"?\\s*:\\s*[\'"]' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(TA));
is(베낌.length === 0, '  거절 제목을 또 적지 않았다 — ' + (베낌.join(',') || '없음'));
is(TA.indexOf('내 CRM 원본 대본') < 0, '  옛 대본 보기를 지웠다 (사장님 말씀)');
is(/id="printSheet"/.test(TA) && /function buildPrint\(/.test(TA), '  인쇄하면 A4 한 장 스크립트가 나온다');

console.log('\n[7] 깔끔하게 · 글씨 크기 (판 X105 · 사장님 말씀 2026-10-14 「글씨도 단정하게 · 글씨 키우는 것도」)');
/* 단계 안 거절은 <b>제목 단추 한 줄</b>이고, 멘트 미리보기를 또 늘어놓지 않는다 — 할 말은 누르면 팝업 하나에서 */
is(/function brO\(id\)\{[^\n]*class="br" data-ob="'\+id\+'">'\+esc\(o\.title\)\+'<\/button>'/.test(TA) && TA.indexOf('멘트·평가 보기 ›') < 0,
   '  단계 안 거절은 <b>제목 단추</b>만 — 멘트 미리보기 카드를 늘어놓지 않는다');
is(/id="dock"/.test(TA) && /id="qfind"/.test(TA) && !/<aside class="side/.test(TA),
   '  거절은 <b>하단 고정 판</b>에 전부 · 찾기 칸 (판 X234 — 오른쪽 칸은 걷었다)');
is(/function printQuick\(/.test(TA) && /var PRINT_FULL = false;/.test(TA),
   '  인쇄 기본은 <b>대본 + 거절 한눈표 2장</b>, 자세한 판은 고를 때만 (판 X234)');
is(/id="fsz"/.test(TA) && /'ta_fsz'/.test(TA) && /\.app,#shB\{zoom:var\(--z,1\)\}/.test(TA), '  <b>글씨 크기</b> 단추(가- 가+)가 있고 이 기기에 기억한다');
is(/\.cols\{grid-template-columns:minmax\(0,1fr\)\}/.test(TA), '  폰에서 대본 칸이 화면 밖으로 <b>안 밀린다</b> (가로 줄이 칸을 넓히지 않게)');

console.log(bad ? '\n✗ TA 스크립트 새 판 — 고칠 자리 ' + bad + '곳' : '\n✓ TA 스크립트 새 판 — 표는 한 곳, 공감부터, 문을 열어 두고 마무리합니다');
process.exit(bad ? 1 : 0);
