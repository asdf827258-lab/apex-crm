/* check-crmfields.js — ➕ 고객 칸 더하기 (판 X595 · crm-fields.js)

   사장님 말씀 (2026-11-27) 「고객 추가나 고객 입력칸은 어떤 칸이든 추가해서 삽입할수 있게 해」

   재는 것
     [1] db-crm.html 이 crm-fields.js 를 한 줄로 · crm-side.js 뒤에(옆창 감싸기 위에 감쌈) · defer/module 아님
     [2] ★★ 서버 표를 새로 만들거나 바꾸지 않는다 — 칸 목록 = app_config 'db_fields' · 값 = dbs.followup._fx
     [3] ★★ followup 의 다른 자리(계약 뒤 챙김 m1 …)는 그대로 두고 _fx 만 고친다
     [4] 저장은 있던 saveDb 가 성공(창 닫힘)하고 <b>바뀐 것이 있을 때만</b> 한 번 더 — 실패하면 아무것도 안 적음
     [5] 칸 고치기는 대표 · 관리자만(앱 osIsOwner · osIsAppAdmin · CRM canManage) — 서버도 app_config 는 대표 · 관리자만
     [6] 칸 종류 일곱 · 30개까지 · 이름 20자 — 깨진 설정이 와도 화면이 안 깨짐(clean)
     [7] 실제로 돌려 본다 — 칸 정의를 가짜 설정으로 넣고 clean · valsOf 가 맞게 거른다            */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);
const HTML = R('db-crm.html'), JS = R('crm-fields.js');
const code = JS.replace(/\/\*[\s\S]*?\*\//g, '');

head('[1] 싣는 줄 한 줄');
const tags = HTML.match(/<script src="crm-fields\.js[^>]*>/g) || [];
is(tags.length === 1 && !/defer|type=("|')?module/.test(tags[0]), 'crm-fields.js 를 한 번만 · defer · module 없이');
is(HTML.indexOf('<script src="crm-fields.js') > HTML.indexOf('<script src="crm-side.js') && HTML.indexOf('<script src="crm-side.js') > 0, '옆창(crm-side.js) 뒤 — 옆창이 감싼 openDb 를 다시 감쌈');

head('[2] ★★ 서버 표 그대로');
is(/var D = W\.document, KEY = 'db_fields', MAX = 30;/.test(code) && /from\('app_config'\)/.test(code) && /from\('dbs'\)\.update\(\{ followup: f \}\)/.test(code), '칸 목록 = app_config db_fields · 값 = dbs.followup');
is(!/\.insert\(|\.delete\(|\.rpc\(|create table|alter table|localStorage|sessionStorage/.test(code), '새 표 · 지우기 · 서버 함수 · 브라우저 저장 없음');
is((code.match(/\.update\(/g) || []).length === 1 && (code.match(/\.upsert\(/g) || []).length === 1, '서버에 적는 곳은 두 곳뿐 — 값(dbs update) · 칸 목록(app_config upsert, 앱 밖에서 열었을 때만)');

head('[3] ★★ followup 의 다른 자리는 그대로');
is(/var f = Object\.assign\(\{\}, \(row\.followup && typeof row\.followup === 'object'\) \? row\.followup : \{\}\);/.test(code) && /f\._fx = cur;/.test(code), 'followup 을 통째로 복사한 뒤 _fx 만 바꿈(계약 뒤 챙김 m1 · m3 … 보존)');
is(/var f=Object\.assign\(\{\},doneMap\(d\)\); f\[mid\]=/.test(R('apex-care.js')), 'apex-care.js 도 통째로 복사해 고침 — 서로 지우지 않음');

head('[4] 저장 — 성공하고 바뀌었을 때만');
is(/var r = await O\.saveDb\.apply\(this, arguments\);/.test(code) && /if \(!dirty \|\| \(el\('dbModal'\) && el\('dbModal'\)\.classList\.contains\('open'\)\)\) return r;/.test(code), '있던 saveDb 먼저 · 창이 그대로면(실패) · 안 바뀌었으면 안 적음');
is(/if \(!id && !Object\.keys\(vals\)\.length\) return r;/.test(code) && /newest\(nm, ph\)/.test(code), '새로 넣은 분 — 적은 칸이 있을 때만 · 그 이름 · 번호로 막 생긴 줄을 찾아 적음');
is(/async function saveDb\(/.test(HTML) && /closeModal\("dbModal"\);await loadAll\(\);/.test(HTML), 'saveDb 는 성공하면 창을 닫고 다시 읽는다(이 파일이 기대는 꼴)');

head('[5] 칸 고치기는 대표 · 관리자만');
is(/function admin\(\)/.test(code) && /osIsOwner/.test(code) && /osIsAppAdmin/.test(code) && /W\.canManage\(\)/.test(code) && /if \(!admin\(\)\) \{ say\('칸은 대표 · 관리자만/.test(code), '⚙ 단추 · 저장 둘 다 admin() 확인');

head('[6] 칸 종류 · 한도');
is(/\['text', '글'\], \['long', '긴 글'\], \['num', '숫자'\], \['won', '금액\(만원\)'\], \['date', '날짜'\], \['sel', '고르기'\], \['yn', '예\/아니오'\]/.test(code), '종류 일곱 — 글 · 긴 글 · 숫자 · 금액(만원) · 날짜 · 고르기 · 예/아니오');

head('[7] 실제로 돌려 본다 — 깨진 설정 거르기');
{
  const els = {}, said = [];
  const win = { document: { getElementById: id => els[id] || null, createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} } }), head: { appendChild() {} }, body: { appendChild() {} } },
    openDb: () => 'o', saveDb: async () => 's', toast: m => said.push(m), canManage: () => false };
  win.parent = { osCfgGet: (k) => k === 'db_fields' ? JSON.stringify([
    { k: 'fa1', t: '관심 상품', ty: 'sel', o: ['암', '실손', ' ', '연금'] }, { k: 'fa1', t: '겹친 키', ty: 'text' }, { k: 'BAD', t: '나쁜 키' }, { k: 'fb2', t: '  ' },
    { k: 'fc3', t: '아주아주아주아주아주아주아주긴칸이름입니다', ty: 'weird' }, { k: 'fd4', t: '운전', ty: 'yn', o: ['x'] }]) : '' };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(JS, win);
  const D = win.apexFxDefs();
  is(D.length === 3 && D[0].k === 'fa1' && D[0].ty === 'sel' && JSON.stringify(D[0].o) === '["암","실손","연금"]' && D[1].ty === 'text' && D[1].t.length === 20 && D[2].ty === 'yn' && D[2].o.length === 0,
    '겹친 키 · 나쁜 키 · 빈 이름은 빼고, 모르는 종류는 글로, 이름은 20자, 고르기 목록의 빈칸은 뺌 — ' + JSON.stringify(D.map(f => f.k + ':' + f.ty)));
  is(typeof win.openDb === 'function' && win.openDb !== undefined && typeof win.apexFxManage === 'function', 'openDb · saveDb 를 감싸고 ⚙ 칸 고치기를 내놓음');
  win.apexFxManage();
  is(said.some(m => /대표 · 관리자만/.test(m)), '관리자가 아니면 ⚙ 칸 고치기가 안 열림');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 고객 칸 더하기는 서버 표를 안 바꾸고, 있던 저장 뒤에 바뀐 칸만 적습니다');
process.exit(bad ? 1 : 0);
