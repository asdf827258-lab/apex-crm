/* 🧠 보장분석 전&후 만들기 › 제안서 설명자료 (판 X553 · app/ba-pd.js)
 * 사장님 말씀 2026-11-24 「AI 보장분석 이름을 없애고 보장분석 전후 만들기 안에 넣어서 관리하자」
 *
 * 브라우저 없이 vm 으로 ba-pd.js 를 실제로 돌려 봅니다 — 글자를 세지 않습니다.
 *  ★★ 막대 합계를 <b>앱이</b> 더하나 (AI 가 적은 합계를 안 믿는다 — 11-23 1,000원 오류)
 *  ★★ 자료에 없는 숫자를 「확인할 숫자」 로 올리나 · 자료에 있는 숫자는 안 올리나(헛것 금지 · 8번)
 *  ★★ 세금 장에 한도·세율 숫자가 서면 잡나 (CLAUDE.md 2번)
 *  ★★ 고객용 덱에는 대본·귀띔이 한 글자도 없나 · 설계사용에는 있나
 *  ★  고객 이름은 AI 주문에 안 들어가고 {고객} 자리표로 가나 (3번)
 *  ★  AI 가 쓴 <script> 같은 태그는 글자로만 서나
 *  ★  index.html — AI 보장분석이 목록에서 숨고 이름이 바뀌었나 · 세 칸 띠가 붙나 · 스크립트 한 줄
 *  ⚠ 되돌림: 앱 합계를 AI 합계로 바꾸거나, 감사(audit)를 비우면 운다 — 아래 [되돌림] 이 직접 해 봅니다.
 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'app/ba-pd.js'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let fail = 0;
const is = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };

function boot(code) {
  const ctx = { window: {}, CUSTOM: [], TAB_ELSEWHERE: {}, TAB_META: {}, console,
    document: { getElementById: () => null, addEventListener() {} }, setTimeout: () => 0 };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
  return ctx;
}
const PLAN = { title: '{고객}님 시험', slides: [
  { kind: 'cover', kick: '{고객}님', h1: '운전자보험 <em>4만 9천 원</em> 하나로', say: '{고객}님 안녕하세요?', tip: '★귀띔비밀', src: '', data: { lead: '정리', chips: ['🚗 운전'] } },
  { kind: 'money', kick: '돈', h1: '운전+집', say: '보세요?', tip: '★귀띔비밀2', src: '제안서',
    data: { rows: [{ label: '지금', sub: '1건', segs: [{ t: '삼성', v: 49000, c: 'old' }] },
                   { label: '바꾸면', sub: '2건', segs: [{ t: '운전', v: 11730, c: 'blue' }, { t: '집', v: 11590, c: 'teal' }] }],
            punch: { num: '-25,680', unit: '원', text: '적게' } } },
  { kind: 'table', kick: '세금', h1: '비과세 <script>alert(1)</script>', say: '?', tip: '', src: '',
    data: { head: ['', '요건'], rows: [['월적립식', '월 150만 원 이하']] } },
  { kind: 'steps', kick: '순서', h1: '순서', say: '?', tip: '', src: '약관을 따릅니다', data: { steps: [{ title: '심사', text: '…' }], qs: ['괜찮으세요?'] } }
] };

console.log('\n[1] 막대 합계는 앱이 더한다');
let C = boot(SRC);
const T = C.bapdT;
is(!!T && typeof T.deck === 'function' && typeof T.audit === 'function', 'ba-pd.js 가 vm 에서 돈다 · 들여다보는 문(bapdT)이 있다');
T.S.nameShow = '홍길동'; T.S.who = '담당';
T.S.src = '삼성 상해보험 월 49,000원 · 메리츠 운전자 11,730원';   /* 11,590 · 23,320 은 자료에 없다 */
const deckA = T.deck(PLAN, false), deckC = T.deck(PLAN, true);
is(deckA.indexOf('23,320원') >= 0, '「바꾸면」 줄 합계 23,320원 을 앱이 계산해 적는다 (11,730 + 11,590)');
is(/width:100\.0%[^>]*>삼성/.test(deckA), '가장 큰 줄(49,000)이 막대 100% 다 — 너비도 앱이 계산');

console.log('\n[2] 자료에 없는 숫자를 올리고, 있는 숫자는 안 올린다');
const F = T.audit(PLAN), ft = F.map(f => f.t).join('\n');
is(/「11,590」/.test(ft) || /11590/.test(ft), '자료에 없는 11,590 을 「확인할 숫자」 로 올린다');
is(!/「49,000」|「11,730」/.test(ft), '자료에 있는 49,000 · 11,730 은 안 올린다 (헛것 금지 · 8번)');
is(/세금 이야기에 숫자/.test(ft), '세금 장의 「월 150만 원」 을 잡는다 (CLAUDE.md 2번)');
is(F.some(f => f.k === 'last'), '마지막 칸 「장끼리 숫자가 같은지」 를 사람이 누르게 한다');
is(!/「-?25,680」/.test(ft) && !F.some(f => /^pn/.test(f.k)), '막대 합계의 차이(25,680)는 앱이 맞춘 값이라 안 올린다');
{
  /* 11-23 의 1,000원 어긋남 — 큰 글씨 차액이 막대와 다르면 잡아야 한다 */
  const P2 = JSON.parse(JSON.stringify(PLAN)); P2.slides[1].data.punch.num = '-24,680';
  const F2 = T.audit(P2);
  is(F2.some(f => /^pn/.test(f.k) && /25,680/.test(f.t)), '큰 글씨 차액을 1,000원 틀리게 적으면 잡고, 앱이 더한 25,680 을 알려 준다');
}

console.log('\n[3] 고객용에는 대본·귀띔이 없다');
is(deckA.indexOf('id="cheat"') >= 0 && deckA.indexOf('id="drawer"') >= 0, '설계사용에는 대본 서랍·대본 요약이 있다');
is(deckC.indexOf('id="cheat"') < 0 && deckC.indexOf('id="drawer"') < 0 && deckC.indexOf('대본 (S)') < 0, '고객용에는 대본 서랍·대본 요약·대본 단추가 없다');
is(/#cheat,#drawer\{display:none!important\}/.test(deckC), '고객용은 인쇄에서도 대본을 숨긴다');

console.log('\n[4] 이름 · 태그');
is(deckA.indexOf('홍길동님') >= 0 && deckA.indexOf('{고객}') < 0, '{고객} 자리표를 이 브라우저에서 이름으로 바꾼다');
is(/\[고객 이름\] 쓰지 않는다/.test(SRC) && !/user\s*=.*nameShow/.test(SRC), 'AI 주문에는 이름 대신 {고객} 만 간다 (3번)');
is(deckA.indexOf('<script>alert(1)') < 0 && deckA.indexOf('&lt;script&gt;') >= 0, 'AI 가 쓴 <script> 는 글자로만 선다');
is(/요건 충족 시/.test(T.brain) && /한도·나이·개월·세율 숫자는 화면에 적지 않는다/.test(T.brain), '두뇌 규칙에 세금 2번(요건만 · 숫자 금지)이 들어 있다');
is(/연금은 상품부터 시작하지 않는다/.test(T.brain), '두뇌 규칙에 연금 풀어가는 순서가 들어 있다');

console.log('\n[5] 본체 — AI 보장분석이 전&후 만들기 안으로');
is(/\{id:'bojang',icon:'📑',title:'전&후 만들기 · AI 리포트',cnt:'',hide:true/.test(IDX), 'AI 보장분석은 목록에서 숨고 이름이 「전&후 만들기 · AI 리포트」 다 (지운 게 아니다 · 6번)');
is(/\{id:'bapd',[^}]*hide:true/.test(IDX), '제안서 설명자료 칸이 있다 (찾기·주소로 열린다)');
is(IDX.indexOf("title:'AI 보장분석'") < 0 && IDX.indexOf("'bojang','📑','AI 보장분석'") < 0, '메뉴·칩에 「AI 보장분석」 이름표가 안 남았다');
is(/onclick="bapdSw\('bojang'\)"/.test(IDX) && /onclick="bapdSw\('bapd'\)"/.test(IDX), '전·후 만들기 떠 있는 띠에 📑 · 🧠 두 칸이 있다');
is(/if\(typeof e\.html==='function'\)return e\.html\(\);/.test(IDX), '머리띠 표(TAB_ELSEWHERE)가 세 칸 띠를 그릴 수 있다');
is((IDX.match(/<script src="ba-pd\.js"><\/script>/g) || []).length === 1, 'ba-pd.js 는 한 줄로 한 번만 싣는다');
is(C.CUSTOM.length === 1 && C.CUSTOM[0].tab === 'bapd' && typeof C.TAB_ELSEWHERE.bojang.html === 'function', '화면 등록은 CUSTOM 한 줄 · 머리띠는 bapd·bojang 둘');
const sw = C.TAB_ELSEWHERE.bojang.html();
is(/🔀 전·후 만들기/.test(sw) && /📑 AI 리포트/.test(sw) && /🧠 제안서 설명자료/.test(sw) && /bapd-sw-b on[^>]*>📑/.test(sw), 'AI 리포트 화면 머리에 세 칸 띠가 서고 📑 가 눌려 있다');

console.log('\n[되돌림] 일부러 망가뜨리면 우나');
{
  /* ① 앱 합계를 빼고 AI 가 준 punch 만 믿게 하면 23,320 이 사라져야 한다 */
  const bad1 = SRC.replace("won(tot[i]) + '원</small>", "'</small>"); if (bad1 === SRC) is(false, '① 되돌림 자리를 못 찾았다');
  const B1 = boot(bad1).bapdT; B1.S.src = T.S.src;
  is(B1.deck(PLAN, false).indexOf('23,320원') < 0, '① 앱 합계를 지우면 [1] 이 운다');
  /* ② 감사를 비우면 11,590 을 못 잡아야 한다 */
  const bad2 = SRC.replace("if (src.indexOf(d) < 0) F.push(", "if (false) F.push(");
  const B2 = boot(bad2).bapdT; B2.S.src = T.S.src;
  is(!/11590|11,590/.test(B2.audit(PLAN).map(f => f.t).join('')), '② 숫자 대조를 끄면 [2] 가 운다');
  /* ③ 고객용 가림을 빼면 대본 서랍이 남아야 한다 */
  const bad3 = SRC.replace("(client ? '' : '<aside id=\"drawer\">", "('' + '<aside id=\"drawer\">");
  const B3 = boot(bad3).bapdT;
  is(B3.deck(PLAN, true).indexOf('id="drawer"') >= 0, '③ 고객용 가림을 빼면 [3] 이 운다');
}

console.log('\n[6] 전·후 만들기 <b>안에</b> 연다 (판 X556 · 사장님 말씀 2026-11-25 「보장분석 전후 만들기 클릭하면 그 안에 배치해줘」)');
{
  const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  is(/id="tabAiRep" onclick="baParentSub\('bojang'\)"/.test(BA) && /id="tabPd" onclick="baParentSub\('bapd'\)"/.test(BA),
     '전·후 만들기 위 띠에 📑 AI 리포트 · 🧠 제안서 설명자료 두 칸이 선다');
  is(/function baTabsPaint\(\)/.test(BA) && /baTabsPaint\(\);/.test(BA) && !/getElementById\('tabEdit'\)\.className=/.test(BA),
     '위 띠 불 켜기는 baTabsPaint 한 곳 — 두 칸이 열리면 만들기·보여주기·요청서는 꺼진다 (5번)');
  is(/if\(window\.BA_SUB\)\{window\.BA_SUB='';[\s\S]{0,120}parent\.baSubClose\(1\)/.test(BA),
     '만들기·보여주기·요청서를 누르면 열린 두 칸이 닫힌다');
  is(/<div id="baSub" class="ba-sub"/.test(IDX) && /#baScreen \.ba-sub\.on\{display:block\}/.test(IDX),
     '본체 껍데기(#baScreen) 안에 두 칸이 열릴 자리(#baSub)가 있다');
  is(/if\(typeof baSubClose==='function'\)baSubClose\(\);/.test(IDX), '← 워크스페이스 로 나가면 안에서 연 것도 닫힌다');
  const OPEN = "if (baOn()) { if (id === 'frmake') window.baSubClose(); else window.baSubOpen(id); return; }";
  is(SRC.indexOf(OPEN) >= 0 && /window\.baSubOpen = function/.test(SRC),
     '껍데기가 떠 있으면 📑·🧠 는 밖으로 안 나가고 그 안에 그린다 · 없으면 예전처럼 제 화면');
  is(/d\.querySelector\('\.bapd-sw'\)\) d\.innerHTML = ''/.test(SRC), '바깥에 같은 화면이 그려져 있으면 비운다 — id 두 벌 막기');
  const bad4 = SRC.replace(OPEN, '');
  is(bad4 !== SRC && bad4.indexOf(OPEN) < 0, '④ 안에서 여는 길을 끊으면 [6] 이 운다');
}

if (fail) { console.log('\n제안서 설명자료 점검 실패 ' + fail + '개'); process.exit(1); }
console.log('\n제안서 설명자료 점검 통과');
