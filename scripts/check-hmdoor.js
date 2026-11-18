/* ════════════════════════════════════════════════════════════════════
   check-hmdoor.js — 🎣 <b>오늘 「이분께 꺼낼 한 줄」</b> (판 X474)

   사장님 말씀 (2026-11-17) — 「상품화법들을, 오늘에 띄워서 고객들에게 연락할 접점을 만들어줘」
   · 고르는 기준 「안내대로 해」 — ① 나이대 ② 모르면 DB 종류 ③ 둘 다 모르면 이번 달 1위.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 말이 미끼 대본 자료(MK_TALK) <b>그대로</b>다 — 홈이 말을 새로 짓지 않는다 (5번)
     [2] ★★ 고르는 차례 — 나이대가 DB 종류보다 먼저 · DB 종류는 TA 대본의 주제로
     [3] ★★ 둘 다 모르면 <b>고르지 않는다</b> — 상품전략기 이번 달 1위로 보낸다 (1번)
     [4] ★ 호칭은 「고객님」 뿐 — 「사장님 · 어머님」 을 안 붙인다 (3번)
     [5] ★ 이어지는 곳 — 상품전략기가 #talk 꼬리를 읽고 hashchange 로 따라온다
     [6] ★ 홈이 접힌 칸 안에 세우고 접힌 머리도 말한다 · 싣는 차례
     [7] ★★ 상품 이름(판 X475 「응 상품명도 띄워」) — hm-door-top.js 가 <b>지금 상품전략기</b>에서
         다시 뽑은 것과 같다(달이 바뀌었는데 안 다시 뽑으면 멈춤) · 🧭 가 여는 셋과 같은 셋이 카드에 · 설계사용
   ════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const st = {}; const doc = { getElementById: id => st[id] || null, createElement: () => ({}), head: { appendChild: e => { st.hmDoorCss = e; } } };
const w = { document: doc }; w.window = w;
vm.createContext(w);
for (const f of ['ta-open.js', 'apex-stage.js', 'app/상담자료/mikki-talk-data.js', 'app/hm-door.js']) vm.runInContext(rd(f), w);
let BAND = {};
w.hmMsAge = x => BAND[x.id] || '';
const M = w.MK_TALK, D = w.HM_DOOR;
const html = x => D.html(x).replace(/<[^>]+>/g, ' ');

console.log('\n[1] 말은 미끼 대본 자료 그대로');
const a = { id: 'a', key: 'a', src: '보장분석8DB' }, pa = D.pick(a);
is(!!pa && pa.cat && html(a).indexOf(M.CATS[pa.cat].hook) >= 0, '  던지는 한마디가 MK_TALK.CATS 글자 그대로 — 「' + (pa && pa.cat ? M.CATS[pa.cat].hook.slice(0, 30) : '') + '…」');
is(M.CATS[pa.cat].dambo.slice(0, 3).every(d => html(a).indexOf(d) >= 0), '  담보 셋도 그 자료 그대로');
const SRC = rd('app/hm-door.js').replace(/\/\*[\s\S]*?\*\//g, '');
is(!/hook\s*:/.test(SRC) && !/dambo\s*:\s*\[/.test(SRC), '  hm-door.js 가 말·담보를 <b>또 적지 않았다</b>');

console.log('\n[2] 고르는 차례');
BAND = { b: '60', c: '4050', e: '2030' };
is(D.pick({ id: 'b', src: '보장분석8DB' }).cat === 'care', '  나이대(60대 이상)가 DB 종류보다 먼저 — 간병·노후');
is(D.pick({ id: 'c', src: '' }).cat === 'cancer3', '  40·50대 — 암·뇌·심장');
is(D.pick({ id: 'e', src: '' }).cat === 'hospital' && /젊고 건강할 때/.test(D.line(D.pick({ id: 'e' }))), '  20·30대 — 병원비·비급여 + 그 나이 꼬리말(MK_TALK.TYPES.y2030)');
BAND = {};
const th = k => w.TA5.THEMES[w.TA_OPENER.db(k).theme];
is(D.pick({ id: 'x', src: '보장분석3DB' }).cat === D.THEME_CAT[w.TA_OPENER.db('보장분석3DB').theme], '  나이 모르면 DB 종류 — 보장분석3DB(' + th('보장분석3DB').name + ') → ' + D.pick({ id: 'x', src: '보장분석3DB' }).cat);
is(D.pick({ id: 'x', src: 'NS홈쇼핑 화재보험' }).cat === 'life', '  화재보험 신청 → 생활·배상');
is(Object.keys(w.TA5.THEMES).every(t => M.CATS[D.THEME_CAT[t]]), '  TA 대본 주제 ' + Object.keys(w.TA5.THEMES).length + '가지가 모두 미끼 상황으로 이어진다');

console.log('\n[3] 모르면 안 고른다 (1번)');
for (const s of ['소개', '일반', '', '알수없는종류']) {
  const p = D.pick({ id: 'n', key: 'n', src: s });
  is(p.by === 'none' && !p.cat && /이번 달 1위/.test(html({ id: 'n', key: 'n', src: s })) && /hmDoorGo\(''\)/.test(D.html({ id: 'n', key: 'n', src: s })),
     '  「' + (s || '빈칸') + '」 — 걱정을 고르지 않고 이번 달 1위로');
}

console.log('\n[4] 호칭');
BAND = { b: '60', c: '4050', e: '2030' };
const all = ['b', 'c', 'e'].map(id => D.line(D.pick({ id }))).concat(['보장분석3DB', '농협', 'NS홈쇼핑 화재보험'].map(s => D.line(D.pick({ id: 'z', src: s }))));
is(all.every(t => t && !/사장님|어머님/.test(t)), '  「사장님 · 어머님」 이 없다 — 성별·직업을 모른다');

console.log('\n[5] 이어지는 곳');
const INS = rd('app/insight/index.html');
is(/function tkHash\(\)/.test(INS) && /addEventListener\('hashchange', tkHash\)/.test(INS) && /if \(tkHash\(\)\) return;/.test(INS), '  상품전략기가 #talk 꼬리를 처음에도 · 바뀔 때도 읽는다');
is(/TK\.pid = ''/.test(INS.split('function tkHash')[1] || ''), '  걱정이 없으면 TK.pid 를 비워 이번 달 1위가 선다(tkNow)');

console.log('\n[6] 홈');
const IX = rd('app/index.html');
const blk = (IX.split('function hmMoreHtml(x,note){')[1] || '').split('\n}')[0];
is(/HM_DOOR\.html\(x\)/.test(blk) && /var inner=door\+/.test(blk), '  「이분 자세히」 맨 앞에 선다(접힌 칸 안)');
is(/🎣 상품 한 줄/.test((IX.split('function hmMoreSub(x){')[1] || '').split('\n}')[0]), '  접힌 머리도 「🎣 상품 한 줄」 이라고 말한다');
const i0 = IX.indexOf('<script src="../ta-open.js">'), i1 = IX.indexOf('<script src="상담자료/mikki-talk-data.js">'), i2 = IX.indexOf('<script src="hm-door.js">');
is(i0 > 0 && i1 > i0 && i2 > i1, '  싣는 차례 — ta-open → 미끼 대본 자료 → hm-door');

console.log('\n[7] 상품 이름 — 상품전략기에서 뽑은 그대로');
let TOPSRC = '', fresh = false;
try { TOPSRC = rd('app/hm-door-top.js').replace(/\r\n/g, '\n'); fresh = TOPSRC === require('./door-top.js').build(); } catch (e) { console.log('    ' + e.message); }
is(fresh, '  app/hm-door-top.js 가 지금 상품전략기(app/insight/index.html)에서 다시 뽑은 것과 <b>같다</b>' + (fresh ? '' : ' ← node scripts/door-top.js 로 다시 뽑으세요'));
vm.runInContext(TOPSRC, w);
const T = w.HM_DOOR_TOP || { cats: {} };
is(!!T.month && Object.keys(M.CATS).every(k => Array.isArray(T.cats[k])), '  미끼 상황 ' + Object.keys(M.CATS).length + '가지마다 목록이 있다 (' + T.month + ')');
const hp = html(a), hl = (T.cats[pa.cat] || []);
is(hl.length > 0 && hl.every(p => hp.indexOf(p.nm) >= 0 && hp.indexOf(p.co) >= 0), '  카드에 그 걱정의 이번 달 상품 ' + hl.length + '개 이름·회사가 선다 — ' + hl.map(p => p.nm).join(' / '));
is(/설계사용/.test(hp), '  「설계사용 · 소식지 기준」 이라고 붙는다 (소식지 = 고객 제시 금지)');
const hn = html({ id: 'n', key: 'n', src: '' });
is(!!T.top && hn.indexOf(T.top.nm) >= 0, '  걱정을 모르면 이번 달 1위 이름이 선다 — ' + (T.top ? T.top.nm : '(없음)'));
const keep = w.HM_DOOR_TOP; w.HM_DOOR_TOP = undefined;
is(!/hm-door-p/.test(D.html(a)), '  목록 파일이 없으면 이름 줄을 안 그린다(깨지지 않는다)'); w.HM_DOOR_TOP = keep;
const i3 = IX.indexOf('<script src="hm-door-top.js">');
is(i3 > i2, '  hm-door-top.js 를 싣는다');

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 어긋납니다') : '✓ 오늘에서 그 분께 꺼낼 상품 한 줄이 섭니다');
process.exit(bad ? 1 : 0);
