/* 재무상담은 결과지를 만들기 전 판에서 — 결과지가 슬그머니 돌아오지 않나 (판 X178)

   사장님 말씀 2026-10-24 「결과지를 만들지 말고 재무상담 처음에 했던 것들이 다 망가지고 있어
   가장 위에서 내려오면서 결과지 만들기 전으로 다시 집중해서 원복하고 그걸 중심으로 수정하고 변경해나갈거야」.

   결과지 갈래(판 X159~X187, PR 없이 main 에 안 들어감)를 통째로 걷고, 계산기 · 재무설계 상담자료를
   결과지를 만들기 전 판(main)으로 되돌렸습니다. 결과지를 만들면서 계산기 칸과 상담자료 장이 결과지와
   다시 겹쳤습니다(같은 숫자를 두 곳에서 · 같은 말을 두 번). 여기서는 <b>결과지만</b> 봅니다 —
   계산기와 상담자료를 고치는 일은 막지 않습니다(8번 · 넓게 잡지 않는다).

     가. 결과지 엔진 · 그림 · 만드는 스크립트 파일이 없다
     나. 계산기가 결과지 엔진을 부르지 않는다 (불러오기 · rptData · 「고객 결과지」 단추)

   되돌려 보기 — app/finance.html 에 <script src="apex_report_engine.js"> 한 줄을 넣거나
               app/apex_report_engine.js 를 되살리면 웁니다.
   다시 결과지를 만들기로 하시면 이 점검과 대장 X178 을 함께 고칩니다.                      */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('\n가. 결과지 파일');
['app/apex_report_engine.js', 'app/apex_report_icons.js', 'scripts/make-report.js'].forEach((f) =>
  is(!fs.existsSync(path.join(ROOT, f)), f + ' 없음'));

console.log('\n나. 계산기가 결과지를 부르지 않는다');
const fin = fs.readFileSync(path.join(ROOT, 'app', 'finance.html'), 'utf8');
is(!/apex_report_engine|apex_report_icons/.test(fin), '결과지 엔진을 불러오지 않는다');
is(!/\brptData\s*\(|function\s+rptData\b/.test(fin), 'rptData(결과지 자료 만들기) 없음');
is(!/고객 결과지/.test(fin), '「고객 결과지」 단추 · 글 없음');

console.log('\n' + (bad ? '✗ ' + bad + '개 — 결과지가 돌아왔습니다. 만들기로 하셨으면 이 점검과 대장 X178 을 같이 고치십시오'
  : '✓ 결과지 없음 — 재무상담은 결과지를 만들기 전 판에서 갑니다'));
process.exit(bad ? 1 : 0);
