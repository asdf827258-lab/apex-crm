/* 🧭🎣 <b>상품전략기 + 미끼상품&접촉전략 = 한 칸</b> — 판 X468
   사장님 말씀 2026-11-17 「미끼상품 접촉전략 + 상품전략기를 하나로 만들자 · 가독성 좋고 사용하기 편하도록」.

   ── 보는 것 ─────────────────────────────────────────────────
     [1] 대본 자료가 <b>한 곳</b>이다 — app/상담자료/mikki-talk-data.js 가 상황 10 · 호칭 7 · script() 를 내고,
         책(RP 제조기)은 그것을 읽을 뿐 표를 또 적지 않는다 (5번)
     [2] 상품전략기가 같은 파일을 싣고 「🎣 문 열기」 탭 · 상품 상세 칸 · 책 펼치기를 가진다.
         대본 글을 쪽에 또 적지 않는다(던지는 한마디가 쪽 안에 글자로 박혀 있으면 두 벌)
     [3] 서랍에는 상품전략기 한 칸 — mikki_talk 는 hide 로 <b>목록에서만</b> 숨고 길(go 분기·주소)은 산다 (6번)
     [4] 대본 함수가 실제로 돈다 — 상황마다 13줄 · 첫 줄에 호칭 · 낱말로 상황을 찾는다
   ⚠ 되돌림: 책에 var CATS={ 를 도로 넣기 · 쪽에서 script 줄 빼기 · hide 빼기 — 셋 다 웁니다.
   브라우저를 안 띄웁니다 — 몇 초면 끝납니다.                                              */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } };

console.log('🧭🎣 상품전략기 + 미끼상품&접촉전략 = 한 칸 (판 X468)');
const DATA = rd('app/상담자료/mikki-talk-data.js');
const BOOK = rd('app/상담자료/미끼상품_접촉전략.html');
const PAGE = rd('app/insight/index.html');
const SRC = rd('app/index.html');

console.log('\n[1] 대본 자료는 한 곳');
is(DATA.length > 0, 'app/상담자료/mikki-talk-data.js 가 있다');
is(/<script src="mikki-talk-data\.js"><\/script>/.test(BOOK), '책이 그 파일을 싣는다');
is(!/var CATS=\{/.test(BOOK) && !/var TYPES=\{/.test(BOOK), '책 안에 상황표·호칭표를 <b>또 적지 않았다</b>');
is(/MK\.script\(curType/.test(BOOK), '책 RP 제조기가 같은 script() 로 대본을 만든다');

console.log('\n[2] 상품전략기 「🎣 문 열기」');
is(PAGE.indexOf('<script src="../상담자료/mikki-talk-data.js"></script>') > 0, '상품전략기가 같은 파일을 싣는다');
is(/data-t="talk"/.test(PAGE) && /talk: renderTalk/.test(PAGE), '「🎣 문 열기」 탭이 서고 그려진다');
is(/이 상품으로 문 여는 법/.test(PAGE) && /tkFrom\(/.test(PAGE), '상품 상세에서 그 상품의 대본으로 간다');
is(/const BOOK_URL = '\.\.\/상담자료\/미끼상품_접촉전략\.html'/.test(PAGE) && fs.existsSync(path.join(ROOT, 'app/상담자료/미끼상품_접촉전략.html')), '책 27장을 그 자리에서 펼친다 — 주소가 실제 파일');
const ctx = { window: {} }; try { vm.runInNewContext(DATA, ctx); } catch (e) { console.log('    ' + e.message); }
const M = ctx.window.MK_TALK || null;
const hooks = M ? Object.keys(M.CATS).map(k => M.CATS[k].hook) : [];
is(hooks.length && hooks.every(h => PAGE.indexOf(h) < 0), '대본 글을 쪽에 글자로 박지 않았다 (두 벌 금지)');

console.log('\n[3] 서랍은 한 칸');
is(/\{id:'insight',icon:'🧭',title:'상품전략기'/.test(SRC), '🧭 상품전략기 칸이 선다');
is(/\{id:'mikki_talk',[^}]*hide:true/.test(SRC), '미끼상품&접촉전략은 <b>목록에서만</b> 숨는다 (hide)');
is(/var MKTALK_URL='상담자료\/미끼상품_접촉전략\.html'/.test(SRC) && /function mountMkTalk/.test(SRC), '숨겨도 책으로 가는 길(go · 주소)은 산다');

console.log('\n[4] 대본이 실제로 돈다');
is(!!M && Object.keys(M.CATS).length === 10 && Object.keys(M.TYPES).length === 7, '상황 10 · 호칭 7');
const r = M ? M.script('head40', ['hospital', 'accident']) : null;
is(!!r && r.lines.length === 13 && r.lines[0][1].indexOf('사장님,') === 0, '대본 13줄 · 첫 줄이 고른 호칭(사장님)으로 열린다');
is(!!r && r.dambo.length === 5, '담보는 다섯까지 합친다');
is(!!M && M.detect('운전자 벌금 합의금')[0] === 'driver', '글에서 상황을 찾는다(운전 → 운전·교통)');
is(!!M && M.script('general', []).keys[0] === 'cancer3', '아무것도 안 고르면 암·뇌·심장 (책과 같은 기본값)');

console.log('\n[5] 약관 직접 비교 · PC 좌우 (같은 판 추가 말씀)');
is(/function cmpBox\(/.test(PAGE) && /const CMP_MAX = 4;/.test(PAGE) && /id="cmp"/.test(PAGE), '약관 비교 탭에 「약관 원문으로 직접 비교」 가 있다 — 4개까지 나란히');
is(/const cmpPool = \(\) => P\.filter\(p => p\.terms\)/.test(PAGE), '고르는 상품은 <b>약관을 연 상품 전부</b>(편집부 다섯 주제에 갇히지 않음)');
is(/cmpOpen\(\[/.test(PAGE), '편집부 비교표에서 그 상품들의 상세 비교로 이어진다');
is(/\.pc2\{display:grid/.test(PAGE) && /\.tc2\{display:grid/.test(PAGE) && /\.tk-grid\{display:grid/.test(PAGE), 'PC 좌우 화면 — 이번 달·추천(pc2) · 약관 비교(tc2) · 문 열기(tk-grid)');

console.log('\n' + (bad ? '✗ ' + bad + '곳이 어긋났습니다' : '✓ 상품전략기 한 칸에서 「무엇을 권할까」 와 「어떻게 말을 꺼낼까」 가 같은 대본으로 이어집니다.'));
process.exit(bad ? 1 : 0);
