/* 📋 알릴의무 · 💰 보험금 찾아줌 — CRM 메뉴 둘로 나누기 (판 X570 · 사장님 말씀 2026-11-26 「CRM 메뉴 나누길 원해」)

   고지체크 진료분석(jinryo.html)이 맨 위 메뉴를 「📋 알릴의무 · 💰 보험금 찾아줌 · 🧾 청구 한 건」 으로
   나눴습니다(고지체크 v18). CRM 메뉴에서도 둘을 따로 엽니다.

   지키는 것
     1. 메뉴 이름이 「알릴의무」 · 「보험금 찾아줌」 이고, 둘이 <b>같은 묶음에 나란히</b> 선다
     2. 화면 id 는 그대로(med_disclosure · ref_hidden) — 찾기 낱말·영업 한 바퀴·점검이 id 로 가리킨다
     3. 알릴의무는 jinryo.html#goji, 보험금 찾아줌은 jinryo.html#claim 을 연다 (서로 바뀌면 안 된다)
     4. 원래 있던 것을 지우지 않는다 — AI 「알릴의무 필터」 · 「내보험찾아줌」 링크 그대로 (6번)
     5. 고객 PDF 는 그 기기 안에서만 읽는다고 화면이 말한다 (3번)
     6. index.html 에는 script 한 줄만
   node scripts/check-alrilclaim.js */
'use strict';
const fs = require('fs'), path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
let bad = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m.replace(/<\/?b>/g, '')); if (!c) bad++; };

const IDX = R('app/index.html');
const JS = R('app/apex-alril-claim.js');

console.log('\n① 메뉴');
const tabsSrc = IDX.slice(IDX.indexOf('var TABS=['));
const groups = [];
tabsSrc.slice(0, tabsSrc.indexOf('\n];') > 0 ? tabsSrc.indexOf('\n];') : 200000).replace(/\{group:'([^']+)'[\s\S]*?items:\[([\s\S]*?)\n \]\}/g, (m, g, body) => {
  const ids = []; body.replace(/\{id:'([^']+)'[^}]*?title:'([^']+)'/g, (x, id, t) => { ids.push({ id, t }); }); groups.push({ g, ids });
});
const where = id => { for (const G of groups) { const k = G.ids.findIndex(x => x.id === id); if (k >= 0) return { G, k, t: G.ids[k].t }; } return null; };
const A = where('med_disclosure'), B = where('ref_hidden');
is(!!A && A.t === '알릴의무', '  med_disclosure 메뉴 이름 = 「알릴의무」 (' + (A && A.t) + ')');
is(!!B && B.t === '보험금 찾아줌', '  ref_hidden 메뉴 이름 = 「보험금 찾아줌」 (' + (B && B.t) + ')');
is(!!A && !!B && A.G === B.G && B.k === A.k + 1, '  둘이 <b>같은 묶음에 나란히</b> (' + (A && A.G.g) + ')');
is(groups.filter(G => G.ids.some(x => x.id === 'ref_hidden')).length === 1, '  보험금 찾아줌이 메뉴에 <b>한 번만</b>');

console.log('\n② 여는 곳');
is(/med_disclosure:\s*\{\s*hash:\s*'goji'/.test(JS), '  알릴의무 → jinryo.html#goji');
is(/ref_hidden:\s*\{\s*hash:\s*'claim'/.test(JS), '  보험금 찾아줌 → jinryo.html#claim');
is(/https:\/\/apex-hb-goji\.netlify\.app\/jinryo\.html/.test(JS), '  고지체크 진료분석(한 곳)을 연다 — 앱에 복사본을 두지 않는다');
is(/CUSTOM\.unshift\(\{ tab: 'med_disclosure'/.test(JS) && /CUSTOM\.unshift\(\{ tab: 'ref_hidden'/.test(JS), '  두 화면 <b>맨 위</b>에 붙는다(CUSTOM.unshift)');
is(/target="_blank" rel="noopener"/.test(JS), '  「새 창으로 크게 열기」 가 있다');

console.log('\n③ 지우지 않았나 (6번)');
is(/gen\('med_disclosure','med_disclosure','📋','알릴의무 필터'/.test(IDX), '  AI 「알릴의무 필터」 그대로');
is(/\{tab:'ref_hidden',icon:'💰',title:'숨은 보험금 찾기'/.test(IDX), '  「내보험찾아줌」 링크 카드 그대로');
is(/'알릴의무':'med_disclosure'/.test(IDX), '  찾기 낱말 「알릴의무」 그대로');

console.log('\n④ 고객 자료 (3번)');
is(/이 기기 안에서만 읽고 서버로 보내지 않습니다/.test(JS), '  PDF 는 기기 안에서만 읽는다고 말한다');
is(!/fetch\(|localStorage|sessionStorage/.test(JS), '  이 파일은 서버를 부르지도, 아무것도 저장하지도 않는다');

console.log('\n⑤ index.html 은 한 줄');
is((IDX.match(/<script src="apex-alril-claim\.js\?v=\d+[a-z]?"><\/script>/g) || []).length === 1, '  script 한 줄');

console.log(bad ? `\n✗ ${bad}건 실패` : '\n✓ 전부 통과');
process.exit(bad ? 1 : 0);
