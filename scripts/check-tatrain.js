/* 🎓 <b>신입 TA 교육</b> — 건강보험 무사고 할인 전환 (2026-10-11 · 판 X94)

   사장님 말씀 — 「(온탑HB본부 카페 글) 이 내용을 읽고, 스크립트 / 질문지 /
   고객과 가까워지고 이해할 수 있는 질문들 구성해서 신입 교육 TA 로 만들어보자」

   못 박는 것 —
     ① 메뉴에 서고 go('ta_train') 이 그 한 파일(ta-train.html)을 띄운다
     ② 바탕 글과 대조한 기사를 <b>제목·언론사·날짜·주소 그대로</b> 밝힌다 (9번)
     ③ 스크립트 6단계가 <b>원문 그대로</b> 선다 — 원문 글줄이 한 글자도 안 빠진다
        · 원문의 규칙 「신입분들은 주민번호 수집하지말고 현장에가서 받을것」 이 선다
     ④ 회사표 견주기가 <b>결론을 내지 않는다</b> — 어느 답에도 「대상입니다」 가 없고
        늘 「확정은 보험사」 를 붙인다 (카드 ⑥ · 2번) · 표에 없는 회사는 짐작 안 한다
     ⑤ 질문지에 <b>고객 이름 · 주민번호 · 약 이름 칸이 없다</b> (3번) · 빈칸을 센다
     ⑥ 가까워지는 질문은 <b>바탕 글에 없다고</b> 밝힌다 (1번)
     ⑦ 거절 멘트를 옮겨 적지 않는다 — apex-stage.js 표의 글이 여기 없다 (5번)
     ⑧ 서버를 부르지 않고 localStorage 는 try 로 감쌌다 (7번) · tnum 을 안 켠다 (4-1번)
     ⑨ 전화로 약속하면 안 되는 말(할인율 약속 · 소급 · 대상 확정)을 점검이 X 로 가르친다
     ⑩ 🛡 스크립트 옆 바로 응대 (같은 날 사장님 말씀 「상담 안 받으면 손해이고,
        왜 다른지가 중요」)
        · 여섯 단계 모두에 「이 단계에서 나오는 말」 단추가 서고, 누르면 그 자리에서 뜬다
        · 거절마다 <b>왜 다른가</b> 가 있다 · <b>손해</b> 는 늘 조건부(「대상이…」)이고
          「할인됩니다·대상이십니다·무조건」 · 퍼센트가 없다 (2번·1번)
        · 받는 말이 표에 있는 거절은 <b>표의 글 그대로</b>(objFill) — 제목이 표에 없으면 빨간불 (5번)
        · 표를 못 읽으면 받는 말을 지어내지 않고 못 읽었다고 적는다 (1번)
        · 폰에서는 아래서 올라오는 판으로 뜨고 답이 고르는 단추보다 먼저 보인다
     ⑪ 🌉 신청을 기억 못 하는 고객 (같은 날 말씀 「대부분 자기가 신청한지도 모르는데,
        그 부분을 자연스럽게 넘어가면서」)
        · 1단계에 「기억 못 하시는 게 보통」 다리가 서고, 다듬은 말은 <b>원문 아님</b>이라 밝힌다
        · 「기억 안 나요」 · 「신청한 적 없어요」 두 응대가 1단계에서 바로 뜬다
        · 어느 응대도 기억을 다투지 않는다 — 「신청하셨잖아요·분명히 접수」 는 <b>피할 말</b>에만 있다
        · 「신청한 적 없어요」 는 표의 「어디서 전화했어요?」(「접수하신」 이라 말함)를 빌리지 않는다
     ⑫ 🧭 흐름은 내가 끌고 간다 (같은 날 말씀 「거절처리가 원활하게 바로 가능해야 하고, 처음에
        질문을 많이 하면 끊기기 때문에 내가 말 흐름을 끌어오는 부분도 티칭해줘야 따라할 수 있어」)
        · 단계마다 질문 수(새 질문 · 확인)와 이음말이 서고, 이음말은 <b>원문 안에 그대로</b> 있다
        · 통화 전체의 새 질문이 1개(복용약) — 질문 수 지도가 그 셈을 화면에 적는다
        · 거절마다 「한 숨 응대」 가 맨 위에 서고(170자 안), 단정·퍼센트·다투는 말이 없고,
          손해(소급·그대로 내·돌려받지)를 말하면 반드시 「대상」 조건이 붙는다 (2번)
        · 응대 뒤 「다시 끌고 오기」 가 <b>누른 단계 다음 원문</b>으로 잇는다
        · 가까워지는 질문은 「전화에서는 하나까지」 라고 밝히고, 질문지의 회사·시기·안내는 「묻지 않습니다」
     ⑬ 「스크립트가 없던데」 (2026-10-12) — 두 자리가 원문을 가렸다
        · 앱: 스크립트 탭을 누르면 <b>첫 화면 안에</b> 1단계 원문이 선다(앱 안 칸 크기 356×658).
          흐름·무기 카드는 접혀 있고, 폰에서 탭은 한 줄이다
        · 공유본(scripts/mk-tashare.js): <b>자바스크립트가 꺼진 곳</b>(파일·메신저 미리보기)에서도
          세 칸이 다 서고, 단계의 🛡 단추가 그 거절 응대로 건너뛴다. 켜진 곳에서는 탭 · 옆 칸 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9141;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.webmanifest':'application/manifest+json' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const PAGE = fs.readFileSync(path.join(ROOT, 'app/ta-train.html'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const STAGE = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
const CODE = PAGE.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n[1] 메뉴 · 띄우기');
is(/\{id:'ta_train',[^}]*title:'신입 TA 교육'/.test(IDX), "TABS 에 ta_train 이 선다");
is(/\bta_train:'meet'/.test(IDX), "NAV_WHEN 에 ta_train 이 있다(고객 만나기)");
is(/else if\(tab==='ta_train'\)dyn\.innerHTML=renderTaTrainPage\(\);/.test(IDX), "go() 가 renderTaTrainPage 로 그린다");
is(/function renderTaTrainPage\(\)[\s\S]{0,900}src="ta-train\.html"/.test(IDX), "그 화면이 ta-train.html 을 띄운다");

console.log('\n[2] 바탕 글 · 기사를 밝히나 (9번)');
is(CODE.indexOf('https://cafe.naver.com/hdga/269') >= 0 && /온탑HB본부/.test(CODE), '바탕 카페 글 주소와 이름을 적었다');
is(CODE.indexOf('https://www.dailian.co.kr/news/view/1697867/') >= 0 && /데일리안 「건강보험 무사고 할인 쉬워진다…전화 한 번으로 신청」<\/a> 2026\.10\.05/.test(CODE),
   '데일리안 기사의 제목·날짜·주소를 그대로 적었다');
is(CODE.indexOf('https://biz.sbs.co.kr/amp/article/20000338289') >= 0 && /SBS Biz 「건강보험 '무사고 할인' 더 손쉽게…전화·모바일로 신청」<\/a> 2026\.10\.05/.test(CODE),
   'SBS Biz 기사의 제목·날짜·주소를 그대로 적었다');
is(/40대 남성 가입자 한 사람의 예/.test(CODE), '할인율 예시(6.5%·45.9%)를 기사의 한 사람 예라고 밝힌다');

console.log('\n[3] 6단계가 원문 그대로 서나');
/* 원문 그림(보장분석디비 스크립트)의 줄 — 하나라도 바뀌거나 빠지면 빨간불 */
const ORIG = [
  '상담사분이랑 통화하시고 ~ 배정된 에이플러스에셋에 ○○○입니다.',
  '보험료 얼마이상씩 납부하신다고 말씀하셨는데 도움드릴내용은 ~',
  '10월5일부터 금융감독원에서 시행하는 보험료 할인제도',
  '기존 고객님들 중 <em>5세대 실비로 변경대상이신분들이 있어서,</em>',
  '현재 보험료 할인제도로인해 상담 예약이 많이 밀려있다보니 ~',
  '현재 고혈압 고지혈증 당뇨약 중에 복용하시는게 있으실까요?',
  '방문시간은 언제가편하시다고 말씀하셨는데 이때가편하신가요?',
  '전달받은 주소지는 어디시 어디구 어디동으로 맞으실까요?',
  '본인 확인을 위해서 <em>뒷 번호 7자리</em> 확인 부탁드리겠습니다.',
  '직접 입력하실수있는 kb에서 셀프인증 하나 카카오톡으로',
  '대부분의 고객님들이 종이로 되어있는 자료를 선호하십니다',
  '예약제로 상담이 진행되다 보니 당일취소가 어렵습니다',
  '그럼 ○월○일 ○요일 ○시에 ○○에서 뵙겠습니다. 감사합니다'
];
const miss = ORIG.filter(t => CODE.indexOf(t) < 0);
is(miss.length === 0, '원문 줄 ' + ORIG.length + '개가 그대로 있다' + (miss.length ? ' ← 빠짐: ' + miss.join(' / ') : ''));
is(/rule:'신입분들은 주민번호 수집하지말고 현장에가서 받을것'/.test(CODE), '원문의 신입 규칙(주민번호는 현장에서)이 규칙 칸으로 선다');

console.log('\n[4] 거절 멘트를 옮겨 적지 않았나 (5번)');
const texts = (STAGE.match(/text:'([^']{24,})/g) || []).map(s => s.slice(6, 30));
is(texts.length >= 10, '견줄 멘트를 표에서 읽었다 (' + texts.length + '개)');
const copied = texts.filter(t => PAGE.indexOf(t) >= 0);
is(copied.length === 0, '표의 멘트를 옮겨 적지 않았다' + (copied.length ? ' ← ' + copied.join(' / ') : ''));

console.log('\n[5] 서버 · 저장 · 인쇄 (7번 · 3번 · 4-1번)');
is(!/\bfetch\s*\(|XMLHttpRequest|supabase|\/\.netlify\//i.test(CODE), '서버를 부르는 줄이 없다');
const lsLines = CODE.split('\n').filter(l => /localStorage\./.test(l));
is(lsLines.length > 0 && lsLines.every(l => /try\s*\{/.test(l)), 'localStorage 를 쓰는 줄마다 try 로 감쌌다 (' + lsLines.length + '줄)');
is(!/tnum/.test(PAGE), '숫자 글꼴 tnum 을 안 켠다');
is(!/<input[^>]*(고객명|성함|주민)|placeholder="[^"]*(고객명|성함|주민|약 이름)/.test(PAGE) && !/k:'(name|jumin7|drug)'/.test(CODE),
   '질문지에 고객 이름·주민번호·약 이름을 적는 칸이 없다');
is(/바탕 글에 <b>없습니다<\/b>/.test(CODE), '가까워지는 질문이 바탕 글에 없다고 화면에 밝힌다');

const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(''); return; }
  s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:' + PORT + '/app/ta-train.html', { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.reload({ waitUntil: 'load' });

    console.log('\n[6] 스크립트 칸');
    await p.click('#ttTabs button[data-t="script"]');
    is(await p.$$eval('#ttSteps .tt-step', a => a.length) === 6, '6단계가 선다');
    is(await p.$$eval('#ttSteps .tt-orig', a => a.length) >= 6 && await p.$$eval('#ttSteps .tt-warn', a => a.length) === 6,
       '단계마다 원문 칸과 조심 칸이 갈라 선다');
    is(/신입분들은 주민번호 수집하지말고/.test(await p.textContent('#ttStep5')), '5단계에 신입 규칙이 보인다');

    console.log('\n[7] 회사표 견주기 — 결론을 내지 않나');
    await p.click('#ttTabs button[data-t="who"]');
    is(await p.$$eval('#ttCoTbl tbody tr', a => a.length) === 19, '회사 19곳(손보 10 · 생보 9)이 표에 선다');
    const J = await p.evaluate(() => {
      const db = TT_CO.filter(c => c.n === 'DB손해보험')[0];
      return [ttCoJudge(db, '2022-06'), ttCoJudge(db, '2022-07'), ttCoJudge(db, '2023-05'), ttCoJudge(db, ''), ttCoJudge(null, '2023-05')];
    });
    is(J[0].k === 'before' && J[1].k === 'edge' && J[2].k === 'after', '앞 · 같은 달 · 뒤를 가른다 (DB손보 2022.7.1 기준)');
    is(J[3] === null && J[4] === null, '달이나 회사가 없으면 아무 답도 만들지 않는다');
    is(J.slice(0, 3).every(r => /확정은 언제나 보험사/.test(r.t) && !/대상입니다|대상이십니다|할인됩니다/.test(r.t)),
       '어느 답에도 「대상입니다」 가 없고 늘 「확정은 보험사」 가 붙는다');
    await p.selectOption('#ttCo', 'x');
    is(/보험사에 직접 확인/.test(await p.textContent('#ttCoRes')), '표에 없는 회사는 짐작하지 않고 보험사로 보낸다');

    console.log('\n[8] 질문지');
    await p.click('#ttTabs button[data-t="sheet"]');
    const n = await p.evaluate(() => TT_SHEET.length);
    is(new RegExp('빈칸 ' + n + '곳').test(await p.textContent('#ttSheetOut')), '아무것도 안 고르면 빈칸 ' + n + '곳이라 적는다');
    await p.click('#ttSheet .tt-chip[data-k="jumin"]');
    const out = await p.textContent('#ttSheetOut');
    is(/주민번호 뒷자리 — 현장에서 받기로 함/.test(out) && new RegExp('빈칸 ' + (n - 1) + '곳').test(out), '고르면 정리에 들어가고 빈칸이 하나 준다');
    is(await p.$$eval('#ttSheet .tt-chip[data-k="jumin"]', a => a.length) === 1, '주민번호 칸은 「현장에서 받기로 함」 하나뿐이다 — 숫자를 받는 자리가 없다');
    is(await p.$$eval('#tt-sheet input, #tt-sheet textarea', a => a.length) === 0, '질문지에 글을 적는 칸이 없다 (이름·번호가 들어갈 자리가 없다)');

    console.log('\n[9] 가까워지는 질문 · 스스로 점검');
    await p.click('#ttTabs button[data-t="near"]');
    is(await p.$$eval('#ttNear .tt-q', a => a.length) >= 10, '질문이 10개 넘게 선다');
    is(await p.evaluate(() => TT_NEAR.every(g => g.qs.every(q => q.say && q.why && q.next))), '질문마다 「왜」 와 「답을 들으면」 이 있다');
    await p.click('#ttTabs button[data-t="quiz"]');
    const QZ = await p.evaluate(() => TT_QUIZ);
    const wrongIs = re => QZ.some(q => re.test(q.q) && q.a === false);
    is(wrongIs(/할인 대상이십니다/) && wrongIs(/돌려받으세요/) && wrongIs(/45\.9%/) && wrongIs(/주민번호/),
       '대상 확정 · 소급 · 할인율 약속 · 전화로 주민번호 — 넷 다 X 로 가르친다');
    await p.click('#ttQuiz .tt-log:nth-child(1) .tt-ox button[data-v="0"]');
    is(/맞습니다/.test(await p.textContent('#ttQuiz .tt-log:nth-child(1)')), 'X 를 누르면 바로 까닭이 나온다');
    await p.reload({ waitUntil: 'load' });
    is(await p.evaluate(() => TT.quiz[0] === false), '점검 답이 이 기기에 남는다');

    console.log('\n[11] 🛡 스크립트 옆 바로 응대');
    await p.click('#ttTabs button[data-t="script"]');
    const OB = await p.evaluate(() => TT_OBJ);
    for (let st = 1; st <= 6; st++)
      is(await p.$$eval('#ttStep' + st + ' .tt-ob', a => a.length) > 0, st + '단계에 「이 단계에서 나오는 말」 단추가 선다');
    is(OB.every(o => o.diff && o.diff.length > 10), '거절마다 「왜 이 전화는 다른가」 가 있다 (' + OB.length + '개)');
    const losses = OB.filter(o => o.loss);
    is(losses.length >= 8 && losses.every(o => /대상이|대상일/.test(o.loss)), '「손해」 줄은 늘 조건부다 — 대상이시면 (' + losses.length + '줄)');
    const BAN = /할인됩니다|대상입니다|대상이십니다|무조건 할인|\d+(\.\d+)?\s*%/;
    const banned = OB.filter(o => BAN.test([o.first, o.diff, o.loss, o.ask, o.bye].join(' ')));
    is(banned.length === 0, '응대 글에 단정(할인됩니다·대상이십니다)과 퍼센트가 없다' + (banned.length ? ' ← ' + banned.map(o => o.k).join(',') : ''));
    const refs = OB.filter(o => o.ref).map(o => o.ref);
    const known = await p.evaluate(() => APEX_STAGE.objList().map(o => o.title));
    is(refs.every(r => known.indexOf(r) >= 0), '받는 말을 빌리는 제목이 다 거절처리 표에 있다 (' + refs.length + '개)');
    const same = await p.evaluate(() => TT_OBJ.filter(o => o.ref).every(o => {
      const v = ttObjView(o), st = APEX_STAGE.objList().filter(x => x.title === o.ref)[0];
      return v.first === APEX_STAGE.objFill(st.text, '○○○') && v.stop === st.stop; }));
    is(same, '빌린 받는 말·멈출 자리가 표의 글과 한 글자도 안 다르다');
    await p.click('#ttStep1 .tt-ob[data-ob="busy"]');
    const body = await p.textContent('#ttObjBody');
    is(/먼저 받는다/.test(body) && /왜 이 전화는 다른가/.test(body) && /안 받으시면 손해/.test(body), '누르면 받는 말 · 왜 다른가 · 손해가 한 자리에 뜬다');
    is(await p.evaluate(() => document.getElementById('ttObjPane').classList.contains('open')), '폰에서는 아래서 올라오는 판이 열린다');
    is(await p.$eval('#ttObjList', e => getComputedStyle(e).display === 'none'), '답이 떠 있는 동안은 고르는 단추를 접어 답이 먼저 보인다');
    const fss = await p.evaluate(() => ttObjView(ttObjOf('fss')));
    is(/^아닙니다/.test(fss.first) && /할인은 가입하신 보험사/.test(fss.diff), '「금감원에서 전화했냐」 에는 아니라고, 할인은 보험사라고 답한다');
    await p.evaluate(() => { window.__S = window.APEX_STAGE; window.APEX_STAGE = undefined; ttObjShow('busy'); });
    is(/거절처리 표를 못 읽었습니다/.test(await p.textContent('#ttObjBody')), '표를 못 읽으면 받는 말을 지어내지 않고 못 읽었다고 적는다');
    await p.evaluate(() => { window.APEX_STAGE = window.__S; });

    console.log('\n[12] 🌉 신청을 기억 못 하는 고객');
    await p.evaluate(() => ttObjShow(''));
    const br = await p.textContent('#ttBridge1');
    is(/기억 못 하십니다/.test(br) && /원문 아님/.test(br) && /확인받지 않습니다/.test(br), '1단계에 「기억 못 하시는 게 보통」 다리가 서고 다듬은 말은 원문 아님이라 밝힌다');
    is(await p.$$eval('#ttBridge1 .tt-ob', a => a.map(x => x.getAttribute('data-ob')).join(',')) === 'forgot,never', '다리 안에서 「기억 안 나요」 · 「신청한 적 없어요」 응대로 바로 간다');
    is(await p.$$eval('#ttStep1 .tt-stepob .tt-ob[data-ob="forgot"], #ttStep1 .tt-stepob .tt-ob[data-ob="never"]', a => a.length) === 2, '1단계 「이 단계에서 나오는 말」 에도 둘이 선다');
    const ARGUE = /신청하셨잖아요|분명(히)? (신청|접수)|기록에 다 있어요/;
    const argue = OB.filter(o => ARGUE.test([o.first, o.diff, o.loss, o.ask, o.stop, o.bye].join(' ')));
    is(argue.length === 0, '어느 응대도 기억을 다투지 않는다 (그 말은 피할 말에만)' + (argue.length ? ' ← ' + argue.map(o => o.k).join(',') : ''));
    is(OB.filter(o => o.k === 'forgot' || o.k === 'never').every(o => ARGUE.test(o.avoid) && !o.ref), '두 응대는 다투는 말을 피할 말로 가르치고, 「접수하신」 이라 말하는 표 글을 빌리지 않는다');
    await p.click('#ttBridge1 .tt-ob[data-ob="forgot"]');
    is(/신청하셨는지는 중요하지 않아요/.test(await p.textContent('#ttObjBody')), '누르면 「신청 여부는 중요하지 않다 → 할인 확인」 으로 넘어가는 응대가 뜬다');

    console.log('\n[13] 🧭 흐름은 내가 끌고 간다');
    const ST = await p.evaluate(() => TT_STEPS);
    is(ST.every(s => s.lead && typeof s.lead.n === 'number' && s.lead.how), '여섯 단계 모두 질문 수와 끌고 가는 법이 있다');
    const plain = t => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    const badLink = ST.filter(s => plain(s.say).indexOf(s.lead.link) < 0);
    is(badLink.length === 0, '이음말이 원문 안에 그대로 있다' + (badLink.length ? ' ← ' + badLink.map(s => s.t).join(',') : ''));
    is(await p.evaluate(() => ttNewQ()) === 1 && ST[2].lead.n === 1, '통화 전체에서 새로 묻는 질문은 하나(3단계 복용약)다');
    is(/새로 묻는 질문은 1개/.test(await p.textContent('#ttQsum')) && await p.$$eval('#ttQmap .tt-qmap-c', a => a.length) === 6, '질문 수 지도가 여섯 칸과 그 셈을 화면에 적는다');
    is(await p.$$eval('.tt-lead', a => a.length) === 6, '단계 카드마다 🧭 흐름 줄이 선다');
    is(OB.every(o => o.quick && o.quick.length <= 170), '거절마다 「한 숨 응대」 가 있고 170자 안이다 (가장 긴 것 ' + Math.max.apply(null, OB.map(o => (o.quick || '').length)) + '자)');
    const qBad = OB.filter(o => BAN.test(o.quick) || ARGUE.test(o.quick) || (/소급|그대로 내|돌려받지/.test(o.quick) && !/대상/.test(o.quick)));
    is(qBad.length === 0, '한 숨 응대에 단정·퍼센트·다투는 말이 없고, 손해를 말하면 「대상」 조건이 붙는다' + (qBad.length ? ' ← ' + qBad.map(o => o.k).join(',') : ''));
    await p.evaluate(() => { ttObjShow(''); document.getElementById('ttObjPane').classList.remove('open'); });
    await p.click('#ttStep3 .tt-stepob .tt-ob[data-ob="later"]');
    const first = await p.$eval('#ttObjBody', e => [...e.children].map(c => c.className).slice(0, 3).join(' '));
    is(/tt-ob-t tt-ob-k tt-ob-quick/.test(first), '누르면 한 숨 응대가 맨 위에 선다');
    is(/다시 끌고 오기[\s\S]*4단계 원문으로/.test(await p.textContent('#ttObjBody')), '3단계에서 누르면 「다시 끌고 오기」 가 4단계 원문으로 잇는다');
    await p.evaluate(() => { ttObjShow(''); document.getElementById('ttObjPane').classList.remove('open'); });
    await p.click('#ttStep6 .tt-stepob .tt-ob[data-ob="later"]');
    is(/약속 복창으로 마무리/.test(await p.textContent('#ttObjBody')), '같은 거절도 6단계에서 누르면 마무리로 잇는다');
    is(await p.$$eval('#ttObjList .tt-ob.top', a => a.map(x => x.getAttribute('data-ob')).join(',')) === 'busy,forgot,ad,have,later,noneed', '옆 칸 목록 맨 앞에 자주 나오는 말 여섯');
    is(/전화에서는 하나까지/.test(await p.textContent('#tt-near')), '가까워지는 질문은 「전화에서는 하나까지」 라고 밝힌다');
    is(await p.evaluate(() => ['co', 'when', 'msg'].every(k => /묻지 않습니다/.test(TT_SHEET.filter(q => q.k === k)[0].h))), '질문지의 회사·가입 시기·안내 칸은 「묻지 않습니다 — 들리면 표시」');
    is(await p.evaluate(() => TT_QUIZ.some(q => /질문을 많이/.test(q.q) && q.a === false)), '「처음부터 질문을 많이」 를 X 로 가르친다');

    console.log('\n[14] 스크립트가 먼저 보이나 — 앱 · 공유본');
    {
      const pa = await (await b.newContext({ viewport: { width: 356, height: 658 } })).newPage();
      await pa.goto('http://127.0.0.1:' + PORT + '/app/ta-train.html', { waitUntil: 'load' });
      await pa.click('#ttTabs button[data-t="script"]');
      const m = await pa.evaluate(() => ({ s1: document.getElementById('ttStep1').getBoundingClientRect().top, vh: innerHeight,
        fold: [...document.querySelectorAll('#tt-script details.tt-fold')].map(d => d.open), tabsH: document.getElementById('ttTabs').offsetHeight }));
      is(m.s1 > 0 && m.s1 < m.vh - 120, '앱: 스크립트 탭을 누르면 첫 화면 안에 1단계 원문이 선다 (위에서 ' + Math.round(m.s1) + 'px · 화면 ' + m.vh + ')');
      is(m.fold.length === 2 && m.fold.every(o => !o), '앱: 흐름·무기 카드는 접혀 있어 원문을 밀어내지 않는다');
      is(m.tabsH < 60, '앱: 폰에서 탭이 한 줄이다 (' + m.tabsH + 'px)');
      await pa.context().close();
      const os = require('os'), cp = require('child_process');
      const out = path.join(os.tmpdir(), 'tashare-' + process.pid + '.html');
      cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts/mk-tashare.js'), out], { stdio: 'pipe' });
      const SH = fs.readFileSync(out, 'utf8');
      is(OB.every(o => SH.indexOf('id="ob-' + o.k + '"') >= 0), '공유본: 거절 ' + OB.length + '개가 저마다 건너뛸 자리(id)를 가진다');
      for (const js of [false, true]) {
        const ps = await (await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: js })).newPage();
        const er = []; ps.on('pageerror', e => er.push(e.message));
        await ps.goto('file://' + out);
        const tag = js ? '공유본(스크립트 켜짐)' : '공유본(스크립트 꺼짐)';
        await ps.click('#tabs [data-t="s"]'); await ps.waitForTimeout(200);
        const nSteps = await ps.evaluate(() => [...document.querySelectorAll('#s .step')].filter(e => e.offsetParent).length);
        is(nSteps === 6, tag + ': 스크립트 탭에서 6단계가 다 보인다');
        if (!js) {
          is(await ps.evaluate(() => ['q', 's', 'o'].every(id => getComputedStyle(document.getElementById(id)).display !== 'none')), tag + ': 질문지 · 스크립트 · 거절처리 세 칸이 다 선다');
          await ps.click('.step[data-st="3"] .stepob .ob[data-ob="later"]'); await ps.waitForTimeout(200);
          const j = await ps.evaluate(() => { const d = document.getElementById('ob-later'); return { h: location.hash, open: d.open, top: d.getBoundingClientRect().top, q: /한 숨에/.test(d.textContent) }; });
          is(j.h === '#ob-later' && j.open && j.top < 200 && j.q, tag + ': 단계의 🛡 단추가 그 거절의 한 숨 응대로 건너뛴다');
        } else {
          await ps.click('.step[data-st="3"] .stepob .ob[data-ob="later"]'); await ps.waitForTimeout(200);
          is(await ps.evaluate(() => document.getElementById('objp').classList.contains('open') && /4단계 원문으로/.test(document.getElementById('objpBody').textContent)),
            tag + ': 🛡 단추가 옆 칸(아래 판)에 응대와 다시 끌고 오기를 띄운다');
        }
        is(er.length === 0, tag + ': 오류가 없다' + (er.length ? ' ← ' + er[0] : ''));
        await ps.context().close();
      }
      try { fs.unlinkSync(out); } catch (e) {}
    }

    console.log('\n[10] 본체에서 열기');
    /* 본체 여는 법은 smoke.js · check-rejgym 과 같은 판 (로그인 막 걷기) */
    const STUB = fs.readFileSync(path.join(ROOT, 'scripts/smoke.js'), 'utf8').split('const STUB = `')[1].split('`;')[0];
    const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx3.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    const p3 = await ctx3.newPage();
    await p3.addInitScript(STUB);
    await p3.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p3.waitForTimeout(2500);
    await p3.evaluate(() => { document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      OS.profile = { id: 's', name: '점검', role: 'owner', plan: 'vip' }; OS.session = { user: { id: 's' } }; window.toast = function () {}; });
    await p3.evaluate(() => go('ta_train'));
    await p3.waitForTimeout(400);
    const fr = await p3.$('#dynPane iframe[src="ta-train.html"]');
    is(!!fr, "go('ta_train') 이 #dynPane 에 그 화면을 띄운다");
    const nv = await p3.evaluate(() => typeof navItemOf === 'function' ? !!navItemOf('ta_train') : null);
    is(nv !== false, '메뉴 서랍이 이 칸을 안다');
    if (fr) {
      const f = await fr.contentFrame(); await f.waitForSelector('#ttSteps .tt-step', { state: 'attached', timeout: 15000 });
      is(true, '띄운 화면 안이 실제로 그려진다');
    }

    is(errs.length === 0, '교육 화면에 스크립트 오류가 없다' + (errs.length ? ' ← ' + errs.join(' | ') : ''));
  } catch (e) {
    is(false, '브라우저 점검이 끝까지 못 갔다 — ' + e.message);
  } finally { await b.close(); srv.close(); }
  console.log(bad ? '\n✗ ' + bad + '곳' : '\n✓ 신입 TA 교육 — 전부 통과');
  process.exit(bad ? 1 : 0);
})();
