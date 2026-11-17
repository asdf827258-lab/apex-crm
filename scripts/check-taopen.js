/* ════════════════════════════════════════════════════════════════════
   check-taopen.js — ☎️ <b>홈 「첫 마디」 가 TA 스크립트 대본에서 오나</b> (판 X469)

   사장님 말씀 (2026-11-17) — 「첫마디가 너무 허접해 - TA스크립트해서 가져와야만해」.
   여는 말(① 출처 · ② 자기소개 · 세 가지 · 양자택일)의 글 틀은 <b>ta-open.js 한 곳</b>입니다.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ ta-script.html 에 여는 말 문장이 <b>다시 적혀 있지 않다</b> — 틀을 부른다 (5번)
     [2] ★★ 홈 첫 마디(taSay)가 그 DB 의 <b>출처·주제</b>를 그대로 말한다 (대본과 같은 글)
     [3] ★ 첫 줄에 인사와 ① 출처가 같이 있다 — 홈은 첫 줄만 보여 줍니다
     [4] ★★ 못 알아본 DB 종류는 <b>출처를 지어내지 않는다</b> (1번)
     [5] ★ 소개·개척(대본에 없는 갈래)은 원래 말 그대로
     [6] ★ 이름이 안 들어간다 — 고객은 「고객님」(3번), 설계사 이름 줄도 없다(홈·CRM 이 같은 글 · check-touch) · 대본에 이름을 넣을 땐 받침에 맞게
     [7] ★★ 사장님이 고치신 말(✏️)이 대본보다 <b>이긴다</b>
     [8] ★ 홈·DB 통합 CRM·TA 스크립트가 ta-open.js 를 apex-stage.js <b>앞에</b> 싣는다
   ════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const win = { OS: { profile: { name: '윤시현' } } };
win.window = win;
const ctx = vm.createContext(win);
vm.runInContext(rd('ta-open.js'), ctx);
vm.runInContext(rd('apex-stage.js'), ctx);
const O = win.TA_OPENER, A = win.APEX_STAGE, D = win.TA5;

console.log('\n[1] 대본 화면은 틀을 부른다 (5번)');
const TS = rd('ta-script.html');
is(!/반갑습니다/.test(TS) && !/쉽게 말씀드리면/.test(TS) && !/편하신 때로 맞춰/.test(TS),
   '  ta-script.html 에 여는 말 문장이 <b>안 남아 있다</b>');
is((TS.match(/OP\('(hello|src|srcTm|me|office|easy|three|pick)'\)/g) || []).length >= 7, '  통화 대본이 TA_OPENER 틀로 그린다');
is((TS.match(/OQ\('(hello|src|srcTm|me|office|easy|three|pick)'\)/g) || []).length >= 7, '  인쇄판도 같은 틀로 그린다');
is(!/window\.TA5\s*=/.test(TS), '  DB 종류 표(TA5)가 화면 안에 <b>두 벌로</b> 있지 않다');

console.log('\n[2] 홈 첫 마디 = 대본 글');
const d3 = D.DBS.find(x => x.label === '보장분석3'), th3 = D.THEMES[d3.theme];
const s3 = A.taSay('보장분석3DB').say;
is(s3.indexOf(d3.src) >= 0 && s3.indexOf(th3.kw) >= 0, '  보장분석3DB → 「' + d3.src + ' ' + th3.kw + '」');
const nh = D.DBS.find(x => x.label === '농협');
is(A.taSay('농협').say.indexOf(nh.src) >= 0, '  농협 → 「' + nh.src + '」');
is(/쉽게 말씀드리면/.test(s3) && s3.split(String.fromCharCode(10)).length === 2, '  ② 쉽게 한 줄까지 — <b>두 줄</b>(아침 미션 칸이 한 화면 · check-msfive)');
is(!/[0-9]/.test(s3), '  홈 말에 <b>숫자가 없다</b> — 보험사 수·약속 시각은 빼고(2번 · check-msfive)');
const full = O.say('보장분석3DB', { full: true });
is(/세 가지/.test(full) && /중에 어느 쪽이/.test(full), '  {full:true} 면 세 가지 · 양자택일까지');
const one = s3.split('\n')[0];
console.log('\n[3] 홈이 보여 주는 첫 줄');
is(/맞으시죠/.test(one) && one.indexOf(d3.src) >= 0, '  첫 줄에 인사 + ① 출처 — 「' + one.slice(0, 60) + '…」');
is(!/[\[\]{}<>]/.test(s3), '  틀 자국([말투] · {자리} · 태그)이 안 남는다');

console.log('\n[4] 모르는 DB 는 출처를 안 지어낸다 (1번)');
const g = A.taSay('알수없는종류').say.split('\n')[0];
is(!D.DBS.some(x => g.indexOf(x.src) >= 0), '  출처 문구가 없다 — 「' + g.slice(0, 70) + '…」');

console.log('\n[5] 대본에 없는 갈래');
is(A.taSay('소개').say.indexOf('소개를 받고') >= 0 && !A.taSay('소개').ta, '  소개 — 원래 말');
is(A.taSay('개척').say.indexOf('잠깐만 시간') >= 0 && !A.taSay('개척').ta, '  개척 — 원래 말');

console.log('\n[6] 이름');
is(/고객님 맞으시죠/.test(s3) && !/홍길동/.test(s3), '  고객은 「고객님」');
is(!/윤시현|저는 담당/.test(s3), '  설계사 이름 줄이 <b>없다</b> — 앱이 이름을 알아도(홈과 CRM 이 같은 글)');
is(O.say('농협', { me: '윤시현' }).indexOf('윤시현이에요') >= 0, '  대본에 넣을 땐 받침에 맞게 — 「윤시현이에요」');
is(O.say('농협', { me: '이수지' }).indexOf('이수지예요') >= 0, '  받침 없으면 「이수지예요」');

console.log('\n[7] 고치신 말이 이긴다');
A.taSayOver({ '보장분석': { say: '고친 말 10분만' } });
const ov = A.taSay('보장분석3DB');
is(ov.say === '고친 말 10분만' && ov.edited, '  ✏️ 고치신 말 그대로 — 「' + ov.say + '」');
A.taSayOver(null);

console.log('\n[8] 싣는 차례');
const order = (p, a) => { const s = rd(p); const i = s.indexOf(a + 'ta-open.js"'), j = s.indexOf(a + 'apex-stage.js"'); return i >= 0 && j > i; };
is(order('app/index.html', '<script src="../'), '  홈(app/index.html)');
is(order('db-crm.html', '<script src="'), '  DB 통합 CRM(db-crm.html)');
is(order('ta-script.html', '<script src="'), '  TA 스크립트(ta-script.html)');
/* 이름 — TA_OPEN 은 db-crm.html 이 이미 썼고(여는 다섯 마디 표), 그쪽이 덮어 CRM 만 옛 말을 했습니다 */
const others = ['db-crm.html', 'app/index.html', 'ta-script.html'].filter(p => /\b(var|let|const|function)\s+TA_OPENER\b/.test(rd(p)));
is(!others.length, '  TA_OPENER 를 다른 화면이 <b>덮지 않는다</b>' + (others.length ? ' ← ' + others.join(',') : ''));
const crm = vm.createContext({ window: null });
crm.window = crm;
vm.runInContext(rd('ta-open.js') + '\nvar TA_OPEN = [];\n' + rd('apex-stage.js'), crm);
is(!!crm.APEX_STAGE.taSay('보장분석3DB').ta, '  db-crm 처럼 TA_OPEN 이라는 표가 따로 있어도 대본 글로 말한다');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 어긋납니다') : '✓ 홈 첫 마디가 TA 스크립트 대본에서 옵니다');
process.exit(bad ? 1 : 0);
