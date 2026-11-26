/* 🩺 고지체크 — CRM 메인 메뉴 한 곳 (판 X574·X582 · 사장님 말씀 2026-11-26 「CRM 메뉴 나누길 원해」 → 같은 날
   「예외질환 목록을 아예 없애고, 단숨에 고지체크가 메인메뉴가 되고 여기 안에서 예외질환에 맞는 상품까지 찾아서 연계해서 알려주라고」)

   고지체크 진료분석(jinryo.html)은 맨 위 메뉴 「📋 알릴의무 · 💰 보험금 찾아줌 · 🧾 청구 한 건」 을 가졌고,
   알릴의무 안에서 예외질환에 맞는 가입 가능한 회사 → 이번 달 소식지 상품 이름까지 바로 나온다(고지체크 v20).
   CRM 은 그 한 곳을 메인 메뉴 「🩺 고지체크」 로 연다.

   지키는 것
     1. 메뉴 「하루 시작」 홈 바로 아래에 「고지체크」 하나 — 보험금 찾아줌 · 예외질환 인수확인은 메뉴에서 숨김(화면은 그대로 열림)
     2. 화면 id 는 그대로(med_disclosure · ref_hidden · ref_underwrite) — 찾기 낱말·영업 한 바퀴·점검이 id 로 가리킨다
     3. 고지체크는 jinryo.html#goji, 보험금 찾아줌은 jinryo.html#claim 을 연다 (서로 바뀌면 안 된다)
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
const OPEN = R('app/apex-goji-open.js');

console.log('\n① 메뉴');
const tabsSrc = IDX.slice(IDX.indexOf('var TABS=['));
const groups = [];
tabsSrc.slice(0, tabsSrc.indexOf('\n];') > 0 ? tabsSrc.indexOf('\n];') : 200000).replace(/\{group:'([^']+)'[\s\S]*?items:\[([\s\S]*?)\n \]\}/g, (m, g, body) => {
  const ids = []; body.replace(/\{id:'([^']+)'[^}]*?title:'([^']+)'[^}]*\}/g, (x, id, t) => { ids.push({ id, t, hide: /hide:true/.test(x) }); }); groups.push({ g, ids });
});
const where = id => { for (const G of groups) { const k = G.ids.findIndex(x => x.id === id); if (k >= 0) return { G, k, t: G.ids[k].t, hide: G.ids[k].hide }; } return null; };
const A = where('med_disclosure'), B = where('ref_hidden'), U = where('ref_underwrite');
is(!!A && A.t === '알릴의무/보험금찾아줌', '  med_disclosure 메뉴 이름 = 「알릴의무/보험금찾아줌」 (' + (A && A.t) + ')');
is(!!A && A.G.g === '하루 시작' && A.k === 1 && A.G.ids[0].id === 'home' && !A.hide, '  <b>메인 메뉴</b> — 「하루 시작」 홈 바로 아래 (' + (A && A.G.g + ' ' + A.k) + ')');
is(!!B && B.hide, '  보험금 찾아줌은 메뉴에서 숨김(고지체크 안에 있음) · 화면 id 는 남음');
is(!!U && U.hide, '  예외질환 인수확인(목록) 메뉴는 숨김 · 화면 id 는 남음');
is(!IDX.includes("['ref_underwrite','⚠️'") && !IDX.includes("['ref_hidden','💰'"), '  안내 칩에도 숨긴 두 메뉴가 없다');
is(groups.filter(G => G.ids.some(x => x.id === 'med_disclosure')).length === 1, '  고지체크가 메뉴에 <b>한 번만</b>');

console.log('\n② 여는 곳');
is(/med_disclosure:\s*\{\s*hash:\s*'goji'/.test(JS), '  고지체크 → jinryo.html#goji');
is(/ref_hidden:\s*\{\s*hash:\s*'claim'/.test(JS), '  보험금 찾아줌 → jinryo.html#claim');
is(/https:\/\/apex-hb-goji\.netlify\.app\/jinryo\.html/.test(JS), '  고지체크 진료분석(한 곳)을 연다 — 앱에 복사본을 두지 않는다');
is(/CUSTOM\.unshift\(\{ tab: 'med_disclosure'/.test(JS) && /CUSTOM\.unshift\(\{ tab: 'ref_hidden'/.test(JS), '  두 화면 <b>맨 위</b>에 붙는다(CUSTOM.unshift)');
is(/target="_blank" rel="noopener"/.test(JS), '  「새 창으로 크게 열기」 가 있다');
is(/<iframe data-alc[^>]*hidden/.test(JS) && !/<iframe src=/.test(JS), '  화면을 열기만 해서는 진료분석을 안 부른다 — 누를 때만(check-tap44 SRV_HOSTS)');
is(/CUSTOM\.unshift\(\{ tab: 'med_disclosure', render: card \}\)/.test(OPEN), '  고객 본인인증 링크(「🩺 고지체크 열기」)도 고지체크 화면에');

console.log('\n③ 지우지 않았나 (6번)');
is(/gen\('med_disclosure','med_disclosure','📋','알릴의무 필터'/.test(IDX), '  AI 「알릴의무 필터」 그대로');
is(/\{tab:'ref_hidden',icon:'💰',title:'숨은 보험금 찾기'/.test(IDX), '  「내보험찾아줌」 링크 카드 그대로');
is(/'알릴의무':'med_disclosure'/.test(IDX) && /'고지체크':'med_disclosure'/.test(IDX), '  찾기 낱말 「알릴의무」 그대로 + 「고지체크」');

console.log('\n④ 고객 자료 (3번)');
is(/이 기기 안에서만 읽고 서버로 보내지 않습니다/.test(JS), '  PDF 는 기기 안에서만 읽는다고 말한다');
is(!/fetch\(|localStorage|sessionStorage/.test(JS), '  이 파일은 서버를 부르지도, 아무것도 저장하지도 않는다');

console.log('\n⑤ index.html 은 한 줄');
is((IDX.match(/<script src="apex-alril-claim\.js\?v=\d+[a-z]?"><\/script>/g) || []).length === 1, '  script 한 줄');

console.log(bad ? `\n✗ ${bad}건 실패` : '\n✓ 전부 통과');
process.exit(bad ? 1 : 0);
