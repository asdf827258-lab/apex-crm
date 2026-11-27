/* check-crmside.js — 🗂 DB 통합 CRM 고객 옆창 (판 X594 · crm-side.js)

   사장님 말씀 (2026-11-27) 「DB통합CRM으로 바로 하지만, 고객 누르면 현재 고객 수정하는것처럼 … 이대로 만들어 한번에 관리되도록」

   재는 것
     [1] db-crm.html 이 crm-side.js 를 <b>한 줄</b>로, 인라인 · apex-route · apex-care 뒤에 부른다(defer · module 아님 — let 전역이 보여야 함)
     [2] 있던 창 함수(openDb · openCall · cusOpen · closeModal · renderDb)를 <b>감싸기만</b> — 원본을 들고 부른다
     [3] ★★ 저장 코드 없음 — 서버 · 저장소를 안 부른다(저장은 있던 saveDb · saveCall 그대로)
     [4] 옆창 자리는 넓은 화면(1100px)에서만 · 폰은 창 자리 그대로
     [5] 이름 단추는 <b>손으로 누를 때</b>만 · 내 고객(canEditDb)만 고치기로 — 프로그램이 부르는 cusOpen 은 예전 그대로 고객 한 장
     [6] 홈 → CRM: window.apexCrmSide · 주소 ?open= · 홈은 apexCrmReady 를 기다리고 못 열면 hdbOpen
     [7] 옆창이 읽는 CRM 함수 이름이 그대로 있다(바뀌면 조용히 머리 줄만 빈다)              */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const HTML = R('db-crm.html'), JS = R('crm-side.js'), HV = R('app/home-v2.js');
const code = JS.replace(/\/\*[\s\S]*?\*\//g, '');

head('[1] 싣는 줄 한 줄');
const tags = HTML.match(/<script src="crm-side\.js[^>]*>/g) || [];
const iSide = HTML.indexOf('<script src="crm-side.js'), iCare = HTML.indexOf('<script src="apex-care.js'), iRoute = HTML.indexOf('<script src="apex-route.js');
is(tags.length === 1 && !/defer|type=("|')?module/.test(tags[0]), 'crm-side.js 를 한 번만 · defer · module 없이');
is(iSide > iCare && iCare > 0 && iSide > iRoute && iSide > HTML.indexOf('function loadAll') && iSide < HTML.lastIndexOf('</body>'), '인라인 · apex-route · apex-care 를 감싼 뒤에 온다 — 앞에 오면 감쌀 원본이 아직 없다');

head('[2] 감싸기만 — 원본을 들고 부른다');
['openDb', 'openCall', 'cusOpen', 'closeModal', 'renderDb'].forEach(n => {
  is(new RegExp('function\\s+' + n + '\\s*\\(').test(HTML) && new RegExp(n + ':\\s*W\\.' + n + '\\b').test(code) && new RegExp('W\\.' + n + '\\s*=\\s*function').test(code),
    n + ' — CRM 에 그대로 있고, 원본(O.' + n + ')을 들고 감싼다');
});
is(/O\.openDb, \[\]\.slice\.call\(arguments\)/.test(code) && /O\.openCall, \[\]\.slice\.call\(arguments\)/.test(code) && /O\.cusOpen, \[\]\.slice\.call\(arguments\)/.test(code) && /O\.closeModal\.apply\(this, arguments\)/.test(code),
  '여는 것 · 닫는 것은 원본 함수가 그대로 한다(옆창은 자리와 머리만)');
is(/if \(!id\) \{ off\(\); return fn\.apply\(W, args\); \}/.test(code), '새로 넣기(openDb 빈 id)는 예전 가운데 창 그대로 — 옆창을 끄고 원본');

head('[3] ★★ 저장 코드 없음');
is(!/\bsb\.|\.from\(|\.rpc\(|\.insert\(|\.update\(|\.upsert\(|\.delete\(|fetch\(|localStorage|sessionStorage/.test(code), '서버 · 저장소를 안 부른다 — 저장은 있던 saveDb · saveCall');

head('[4] 옆창 자리는 넓은 화면에서만');
is(/'@media\(min-width:' \+ MIN \+ 'px\)\{'/.test(code) && /var D = W\.document, MIN = 1100;/.test(code) && /body\.cside \.main\{margin-right:460px\}/.test(code), '1100px 이상에서만 오른쪽 460px 옆창 · 명단 칸은 그만큼 비킴');
is(/body\.cside #dbBody td\[data-th="배정일"\]/.test(code) && /th\.cs-hide\{display:none\}/.test(code) && !/data-th="고객"\]/.test(code) && !/data-th="단계"\]/.test(code), '옆창이 열리면 명단은 좁은 줄(고객 · 단계 · 상담 약속 · 관리만)');
is(['배정일', '담당자', '종류', '지역', '결과', '접촉', '녹음', '단톡 문구'].every(t => new RegExp('<th>' + t + '</th>').test(HTML) && HTML.indexOf('data-th="' + t + '"') > 0), '숨기는 칸 이름이 CRM 표(머리 · data-th)에 그대로 있다');

head('[5] 이름 단추 — 손으로 누를 때 · 내 고객만');
is(/closest\('#dbBody \.cus-open'\)/.test(code) && /if \(!can\(d\)\) return;/.test(code) && /W\.openDb\(mm\[1\]\)/.test(code) && /, true\);/.test(code), '명단 이름 단추 → 내 고객이면 ✏️ 고치기(옆창) · 아니면 예전처럼 고객 한 장');
is(/class="cus-open" onclick="cusOpen\('\$\{d\.id\}'\)"/.test(HTML), 'CRM 이름 단추 꼴(.cus-open · cusOpen(id))이 그대로');

head('[6] 홈 → CRM 그분 옆창');
is(/W\.apexCrmSide = function \(id, tab\)/.test(code) && /get\('open'\)/.test(code) && /W\.apexCrmReady\(\)/.test(code), 'window.apexCrmSide · 주소 ?open= (CRM 이 다 읽은 뒤 — apexCrmReady)');
is(/window\.apexCrmReady=function/.test(HTML), 'CRM 이 「다 읽었나」 를 답한다(apexCrmReady)');
const CS = HV.slice(HV.indexOf('  function crmSide(id)'), HV.indexOf('  function nmGo('));
is(CS.length > 300 && /g\.go\('crm'\)/.test(CS) && /w\.apexCrmSide\(id\)/.test(CS) && /w\.apexCrmReady\(\)/.test(CS) && /\+\+n > 48/.test(CS) && /g\.hdbOpen\(id\)/.test(CS) && /if \(crmOk\(id\)\) \{ crmSide\(id\); return; \}/.test(CS),
  '홈 이름 → DB 통합 CRM 을 열고 그분 옆창 · 12초 안에 못 열면 예전 홈 고치기 창(hdbOpen)');

head('[7] 옆창이 읽는 CRM 함수 이름');
const READ = ['stageOf', 'nextAppt', 'fmt', 'sgNextOf', 'sgUp', 'getCalls', 'srcOf', 'report', 'copyText', 'canEditDb', 'goPage'];
const gone = READ.filter(n => !new RegExp('(async\\s+)?function\\s+' + n + '\\s*\\(').test(HTML));
is(gone.length === 0, gone.length ? ('CRM 에서 사라진 이름 — ' + gone.join(' · ')) : '열한 개(' + READ.join(' · ') + ')가 그대로');
is(['dbModal', 'callModal', 'cusModal', 'customerName', 'dbBody'].every(id => HTML.indexOf('id="' + id + '"') > 0), '창 세 개 · 명단 자리 id 가 그대로');

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ CRM 고객 옆창은 있던 창을 옆으로 옮기기만 하고, 저장은 있던 그대로입니다');
process.exit(bad ? 1 : 0);
