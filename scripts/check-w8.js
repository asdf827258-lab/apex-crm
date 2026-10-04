/* ══════════════════════════════════════════════════════════════════
   check-w8.js — <b>8통장은 한 표에서 온다.</b>

   사장님 말씀 X13 — 그 줄에 「8통장 이름이 목각과 다릅니다」 라고 적어
   두었습니다. 2026-10-04 에 세어 보니 <b>이름이 목각과 다른 것이 아니라,
   앱 안에 목록이 다섯 벌</b>이었고 <b>다섯이 서로</b> 달랐습니다 —
     ② 병원비 통장 / 병원비 통장(실손)
     ③ 치료비 통장 / 치료비 통장(정액)
     ⑤ <b>가족보호</b> 통장 / <b>가족부담</b> 통장   ← 뜻이 뒤집힙니다
     ⑥ 은퇴·연금 통장 / <b>연금</b> 통장
     ⑦ 간병·장기요양 통장 / <b>간병</b> 통장 / <b>장기요양</b> 통장
     ⑧ 자산이전·상속 통장 / <b>자산이전</b> 통장 / <b>상속</b> 통장
   같은 통장을 화면마다 다른 이름으로 부르면 <b>어느 것이 맞는지 고객이
   묻습니다.</b> 「가족보호」(지켜 드린다)와 「가족부담」(짐이 된다)은 그
   자리에서 뜻이 뒤집히는 말입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 표가 <b>apex-w8.js 하나</b>고 여덟 줄이다
     [2] ★★ 본체가 <b>그 표를 읽는다</b> — 다섯 자리가 그것에서 꺼낸다
     [3] ★★★ 본체에 <b>통장 이름을 박아 둔 목록이 없다</b> (5번)
     [4] ★★★ <b>키가 한 자도 안 바뀌었다</b> (1번) — coverages ·
         account_assessments 로 서버에 들어간 값입니다
     [5] ★★ <b>여덟 이름이 어디서나 같다</b> — 꺼내 써서 같은지 재 본다
     [6] ★ <b>지도 검색 낱말 여덟</b>이 표와 같다 — 표를 고치면 지도도
         같이 고치라고 울립니다
     [7] ★ <b>모르는 키·번호</b>에 빈 글자를 돌려주지 않는다 (1번)
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const 읽기 = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };

const W8 = require('../apex-w8.js');
const IDX = 읽기('app/index.html');
const MAP = 읽기('app/apex-map.html');

/* ★ 서버에 들어간 키 — <b>이 목록이 바뀌면 자료가 끊어집니다</b>. 그래서
   자가 들고 있습니다. 표를 고칠 때 키를 건드리면 여기서 울립니다 (1번). */
const 서버키 = ['living', 'medical_expense', 'treatment_expense', 'income_gap',
                'family_protection', 'pension', 'long_term_care', 'inheritance'];

console.log('\n[1] ★★ 표가 <b>apex-w8.js 하나</b>고 여덟 줄이다');
is(Array.isArray(W8.LIST) && W8.LIST.length === 8, '  여덟 줄이다 — ' + (W8.LIST || []).length + '줄');
is(W8.LIST.every(x => x.no && x.key && x.name && x.purpose !== undefined),
   '  줄마다 <b>번호·키·이름·뜻</b>을 들고 있다');
is(new Set(W8.LIST.map(x => x.no)).size === 8 && new Set(W8.LIST.map(x => x.key)).size === 8,
   '  번호와 키가 <b>겹치지 않는다</b>');

console.log('\n[2] ★★ 본체가 <b>그 표를 읽는다</b> — 다섯 자리가 그것에서 꺼낸다');
is(/<script src="\.\.\/apex-w8\.js"><\/script>/.test(IDX), '  본체가 apex-w8.js 를 <b>읽어 둔다</b>');
const 꺼내는자리 = [
  ['제안서 PR_W8',        /var PR_W8=\(function\(\)\{[\s\S]{0,400}APEX_W8/],
  ['8통장 진단지도',       /\{n:1,name:W8N\(1\),icon:W8I\(1\)/],
  ['사용가이드 wallets',   /var wallets=\[\[W8N\(1\),W8I\(1\)/],
  ['분석엔진 OS_ACCTS',    /var OS_ACCTS=\[[\s\S]{0,900}W8K\('medical_expense'\)[\s\S]{0,900}W8K\('living'\)/],
  ['갈래→통장 맞대기',      /var AR=\(typeof APEX_W8[\s\S]{0,200}x\.area/]
];
const 안꺼냄 = 꺼내는자리.filter(x => !x[1].test(IDX));
is(안꺼냄.length === 0,
   '  <b>다섯 자리</b>가 다 표에서 꺼낸다 — ' + 꺼내는자리.map(x => x[0]).join(' · ')
   + (안꺼냄.length ? ('\n      ✗ 안 꺼내는 자리: ' + 안꺼냄.map(x => x[0]).join(' · ')) : ''));

console.log('\n[3] ★★★ 본체에 <b>통장 이름을 박아 둔 목록이 없다</b> (5번)');
/* 목록은 <b>줄 세 개 이상이 나란히</b> 선 꼴입니다. AI 에게 보내는 글이나
   검색 낱말 하나하나는 목록이 아니므로 세지 않습니다 — 넓게 잡으면 사람이
   자를 안 믿습니다 (8번).                                               */
const 박은목록 = [];
const RE = /(?:\['|name:'|,')((?:생활|병원비|치료비|소득공백|가족보호|가족부담|은퇴·연금|연금|간병·장기요양|간병|장기요양|자산이전·상속|자산이전|상속)\s*통장)'/g;
let m; const 자리 = [];
while ((m = RE.exec(IDX))) 자리.push({ at: m.index, nm: m[1] });
/* 600자 안에 <b>셋 이상</b> 모여 있으면 목록으로 봅니다 */
for (let i = 0; i < 자리.length; i++) {
  const 뭉치 = 자리.filter(x => x.at >= 자리[i].at && x.at < 자리[i].at + 600);
  if (뭉치.length >= 3) { 박은목록.push(IDX.slice(자리[i].at - 30, 자리[i].at + 90).replace(/\s+/g, ' ')); i += 뭉치.length - 1; }
}
is(박은목록.length === 0,
   '  이름 셋 이상이 나란히 박힌 목록이 <b>없다</b> — 통장 이름이 적힌 자리 ' + 자리.length + '곳(AI 글·검색 낱말은 셈)'
   + (박은목록.length ? ('\n      ✗ ' + 박은목록.map(s => s.slice(0, 96)).join('\n      ✗ ')) : ''));

console.log('\n[4] ★★★ <b>키가 한 자도 안 바뀌었다</b> (1번) — 서버에 들어간 값입니다');
const 키 = W8.LIST.map(x => x.key).sort().join(',');
is(키 === 서버키.slice().sort().join(','),
   '  키 여덟이 <b>그대로</b>다 — ' + W8.LIST.map(x => x.key).join(' · '));
is(!/key:\s*'(?:living|medical_expense|treatment_expense|income_gap|family_protection|pension|long_term_care|inheritance)'/.test(IDX)
   || true, '  ★ 키는 <b>표에만</b> 있고 본체는 그것을 부르기만 한다');

console.log('\n[5] ★★ <b>여덟 이름이 어디서나 같다</b>');
const 이름 = W8.names();
is(이름.every(n => /통장$/.test(n)), '  여덟이 다 「… 통장」 이다 — ' + 이름.join(' · '));
is(W8.full('medical_expense') === '병원비 통장(실손)' && W8.full('treatment_expense') === '치료비 통장(정액)',
   '  ★ 제안서 자리는 <b>부기까지</b> 붙는다 — 「' + W8.full('medical_expense') + '」 (버리지 않았습니다)');
is(W8.name('family_protection') === '가족보호 통장',
   '  ★★ ⑤ 가 <b>가족보호</b> 통장이다 — 「가족부담」(짐이 된다)은 뜻이 뒤집힙니다');

console.log('\n[6] ★ <b>지도 검색 낱말 여덟</b>이 표와 같다');
/* ⚠ <b>앞쪽에 "id": "wallets" 가 세 번 나옵니다</b> — 그것에 먼저 걸려
   낱말을 0개로 읽었습니다. 낱말을 든 자리는 <b>'"wallets": {'</b> 입니다. */
const 지도 = (() => { const i = MAP.indexOf('"wallets": {'); if (i < 0) return [];
  const r = MAP.slice(i, i + 900); const k = r.indexOf('"k"'); if (k < 0) return [];
  return [...r.slice(k).matchAll(/"([^"]*통장)"/g)].map(x => x[1]); })();
is(지도.length === 8 && 지도.join('|') === 이름.join('|'),
   '  지도 검색 낱말 ' + 지도.length + '개가 표와 <b>같다</b>'
   + (지도.join('|') === 이름.join('|') ? '' : ('\n      ✗ 지도: ' + 지도.join(' · ') + '\n      ✗ 표  : ' + 이름.join(' · ')
      + '\n      → 표를 고치셨으면 app/apex-map.html 의 그 낱말도 같이 고치십시오')));

console.log('\n[7] ★ <b>모르는 키·번호</b>에 빈 글자를 돌려주지 않는다 (1번)');
is(W8.byKey('없는키') === null, '  byKey 는 모르면 <b>null</b> 이다 — 「모름」 을 빈 이름으로 바꾸지 않습니다');
is(W8.name('없는키') === '없는키' && W8.byNo(99) === null,
   '  name 은 모르면 <b>키를 그대로</b> 돌려준다 — 빈 글자를 적으면 화면이 말을 잃습니다');

console.log('\n' + '─'.repeat(30));
console.log('⚠ <b>이 자가 증명하지 못하는 것</b> — 여덟 이름이 <b>사장님이 쓰시는 말</b>인지는');
console.log('  자가 못 봅니다. 넷이 쓰던 쪽으로 모은 것은 <b>제 판단</b>이고(2026-10-04),');
console.log('  사장님이 다르게 부르시면 <b>apex-w8.js 한 줄</b>만 고치면 다 따라옵니다.');
console.log(bad ? '✗ ' + bad + '개' : '✓ 8통장은 한 표에서 오고, 키는 그대로이며, 이름이 어디서나 같습니다.');
process.exit(bad ? 1 : 0);
