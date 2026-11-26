/* ═══════════════════════════════════════════════════════════════
   check-homev2.js — ✨ <b>새 「오늘」 화면(시안 9차 디자인)이 옛 홈을 안 깨나</b> (판 X502)

   사장님 말씀 (2026-11-20) — 「새 홈을 만들어서 … 부작용이나 파일이 깨지는 경우를
   예측하고 시행해줘 그리고, 언제든 빽업할수 있도록 준비해줘」 ·
   「가장 중요한건 목각 그대로 따라가서, 목각 디자인에서, 맞는 기능들을 채우는게 먼저」.

   ⚠ 이 자는 <b>안전망</b>입니다 — 「시안과 같은가」 는 이 자가 아니라 시안 사진과
     새 화면 사진을 나란히 놓고 봅니다(PR 쪽지). 여기서는 깨짐만 봅니다.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 기본은 <b>새 화면</b>(판 X505) — 「↩ 예전 화면」 고른 기기(old)·자동 점검(webdriver)만 예전 화면, 그때 apply·paint 는 아무것도 안 한다
     [2] ★★ 모두에게 끄는 한 줄(ALLOWED=false)이 있고, 그러면 단추도 새 화면도 안 선다
     [3] ★★ 옛 홈(index.html)은 <b>네 자리만</b> — 싣기 · 홈 그린 뒤 apply · hmPaint 안 paint · 인사 단추, 모두 try 안
     [4] ★★ 시안 칸 차례가 시안 rHome 그대로(인사 → 목표 → 다섯 걸음 → 챙기는 중 → 지금 이분 → 상품전략 → 이번 주 → 영업 한 바퀴 → 돌아보기 → 메뉴)
     [5] ★★ 칸 속을 채우는 라이브 함수가 <b>정말 있다</b> — 이름이 어긋나면 빈 칸
     [6] ★  서버를 직접 안 부르고(fetch·supabase 없음, 목표는 기존 pfLoad 만) 저장은 켜짐 표시 하나뿐
     [7] ★  옛 홈은 지우지 않고 숨기기만(CSS) — 「예전 오늘 칸 펼치기」 가 있다 · 그리다 터지면 예전 화면
     [8] ★  옷은 .hv2 / #hv2Sheet 아래로만 — 앱의 .card · .btn 같은 옷을 덮지 않는다
     [9] ★  가짜 데이터로 실제로 그려 본다 — 이름 가리기 · 첫 전화 카드 · 카톡 카드 · 빈 날
     [28] ★  판 X564 — 💬 자비스 말풍선: 지금 카드의 맨 앞 추천 도구(toolsOf) → 없으면 안 끝낸 미션 → 다 끝나면 완료 · ✕ 로 닫음(저장 없음)
     [29] ★  판 X568 — 🧭 카드 맨 아래 「권할 것」(고객 카드) → 있던 cusGo({cli}) → cusV2Rec · 이름 누르면 이분 자세히(hmOpen) · 배정 DB 카드는 예전 그대로
     [31] ★★ 판 X579 — ✅ 챙기는 중 갈래(약속 확인 · 약속 지남 · 증권 · 소개) · 완료는 있던 함수(hmDaySkip · hmLateSkip · hmReferSkip · hdbTo · hdbOpen · hmLateAgain · hmLateEnd · hmReferGot)
     [32] ★★ 판 X579 — 📍 오늘 칸 동선 그림 · 💬 카톡 글 전체 보기 · 말풍선 글만큼 · 칸 따라다님 · 📅 무엇 여섯 갈래 · 새 고객 · 👤 실명표를 내 설정에
     [30] ★★ 판 X572 — ☁️ 자비스 내 메뉴 · 신입 도움말을 계정에(user_prefs · 그 사람 줄만 · migration_85) — 서버 것을 내려받고, 없으면 올리고, 바꾸면 올림 · 표가 없으면 이 기기에만
     [27] ★★ 판 X558 — 📍 카드에 지금 상황(cmSave 그대로) · ⚙ 상황별 추천 메뉴 더하기 = 대표 · 관리자만(osIsAppAdmin) · 저장 osCfgSet('care_apps') → CUS_V2.appsBy 한 곳
     [25] ★★ 판 X555 — 🤝 만났어요(시안 jMeet): 오늘 약속 카드 · 이름+시각이 딱 한 분일 때만 · 단계는 있던 hdbTo(id,'PC') 하나 · 감사 카톡 복사 · 이분 끝(hmQfin)
     [26] ★★ 판 X557 — 🎯 오늘의 미션 다섯(인사 밑 한 판): 끝났나 = 실행 체크판(hmMsCk) · 오늘 약속 카드 그대로 · 이름은 CK_ITEMS 한 곳 · ✓ 했어요 = hmMsDid
     [24] ★  판 X551 — 🌱 신입 도움말(🙋 나 스위치 · 이 기기): 영업 한 바퀴 머리 · 단계 시트 「이 칸에서 할 일 / 어떻게」 = APEX_STAGE.aimText · wayText 그대로 · 기본 꺼짐
     [23] ★  판 X549 — 자비스 시트에 사장님이 고른 메뉴 더하기(＋ 메뉴 더하기 · ✕ 빼기 · ▲ 위로) — 이 기기 · 사람마다(즐겨찾기와 같은 자리) · 일곱 · 메뉴 표 · 서랍 그대로
     [22] ★  판 X532 — 오늘 카드 🧰 이분께 맞는 도구(고객 화면 권할 것과 같은 CUS_V2.appsBy · 상황 → 단계)
     [21] ★★ 판 X531 — 다른 메뉴를 시안 PLACE 묶음으로(TA 대본 → 화법 · 교육 → 공부 · 고지 → 청약 각 한 자리) · 표에 없는 화면은 예전 묶음 그대로 · 서랍 안 건드림
     [20] ★  판 X530 — 🤖 AI 7개 → 자비스 하나로: 인사 줄 🤖 · 자비스 시트(묻기 apexmap · 합친 AI) · 다른 메뉴 맨 아래 한 갈래 (TABS 안 건드림)
     [19] ★  판 X529 — 지금 이분 카드 📰 오늘 소식(ccNewsIdx · ccNews) · 🙋 물어볼 것(cqaAsk · cqaAnsHtml) · 상품전략 칸 → 🧭 상황 시트(openInsK)
     [18] ★★ 판 X526 — 💰 예상 월납 · ✓ 계약됐어요 시트(시안 openAmt · openClose): 저장은 「DB · 업적관리」 의 그 서버 문(pipeline_save) 한 곳 ·
          만원 → 원 한 곳 · 계약완료 규칙은 queueSave 그대로 · 내 고객만 · 🛰 자비스 시트(오늘 끊기기 쉬운 자리 · 미리 세워 둔 연락)
     [17] ★★ 판 X514 — 아래 세 칸이 메뉴 목록이 아니라 시안 시트: 화법(단계 칩 · 그대로 말할 문장 · 복사 — 글은 APEX_STAGE · TA_MSG 원본),
          상품전략(상황별 1위 · 오늘 볼 분 · 구실 — 오늘 화면 상품전략 줄과 같은 자), 공부(성장 로드맵 「지금 할 것 하나」) · 예전 목록은 「모든 화면」
     [16] ★★ 판 X513 — 목표 칸 · 영업 한 바퀴 칸이 다른 화면으로 안 넘어가고 시트(시안 openGoal · openStage):
          목표는 있던 pfSave(금액 · 건수 같이) 하나, 단계 분들은 칸 숫자와 같은 거름(AR.db · 지금 보는 분), 한 분 → hmRtPerson
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const JS = ['app/hm-door.js', 'app/hm-tamsg.js', 'ta-open.js', 'ta-msg.js', 'app/apex-grow.js']
  .map(p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } }).join('\n');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const sc = 걷기(SRC);
/* 판 X526 — 사장님이 고르신 「같은 서버 문 한 줄」: 「DB · 업적관리」 가 쓰는 pipeline_save 를 부르는 자리 <b>하나</b>만 빼고 본다 */
const PEX_RPC = ".rpc('pipeline_save', { p_id: id, p: patch })";
/* 판 X572 — 「기기마다 따로가 아니도록」: 내 설정 한 줄(user_prefs · 그 사람 것만)을 읽고 쓰는 덩어리 <b>하나</b>는 [30] 이 따로 재고,
   나머지 자는 그 덩어리를 뺀 글(scP)로 잰다 — 다른 자리에서 서버에 새로 쓰면 예전처럼 운다 */
const PREF_A = sc.indexOf('  var PREF = {'), PREF_B = sc.indexOf('  function apply(dyn) {');
const PREF_BLK = PREF_A >= 0 && PREF_B > PREF_A ? sc.slice(PREF_A, PREF_B) : '';
const scP = PREF_BLK ? sc.split(PREF_BLK).join('') : sc;
const scW = scP.split(PEX_RPC).join('');

/* ── 가짜 창 — 라이브 함수 자리에 손으로 셀 수 있는 값 ── */
function box(store, search, opt) {
  opt = opt || {};
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const els = {};
  function mk(tag) {
    const e = { tagName: tag, style: {}, children: [], className: '', id: '', innerHTML: '',
      classList: new Set(), appendChild(c) { this.children.push(c); if (c.id) els[c.id] = c; } };
    e.classList.toggle = function (c, v) { if (v === undefined) v = !this.has(c); if (v) this.add(c); else this.delete(c); };
    e.classList.remove = function () { for (const c of arguments) this.delete(c); };
    return e;
  }
  const pane = mk('div'); pane.firstChild = null;
  pane.insertBefore = function (c) { this.children.unshift(c); if (c.id) els[c.id] = c; };
  const doc = {
    head: { appendChild: e => { els[e.id] = e; } },
    body: mk('body'),
    getElementById: id => els[id] || (id === 'hmJobHost' && opt.job !== false ? {} : null),
    createElement: t => mk(t),
    querySelector: s => (s === '.tab-pane.hm-toss' || s === '.tab-pane.hm-toss.hm-v2' ? pane : null)
  };
  const rows = opt.rows || [
    { k: 'touch', t: '홍길동', s: '30일째 — 30일 약속을 넘겼습니다', key: 'touch:c1:' },
    { k: 'db', tk: '미접촉', t: '홍길순', s: '아직 한 번도 안 걸었습니다', src: '보장분석', key: 'db:d1:미접촉' }
  ];
  const g = {
    localStorage: ls, navigator: { webdriver: !!opt.robot }, location: { search: search || '' }, document: doc, toast: () => {}, go: () => {}, setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {},
    OS: { profile: { name: '홍판서' } },
    hmLeft: () => ({ list: rows, all: rows.length + 1 }), hmSteps: () => rows,
    hmWhy: x => '이유 — ' + x.s, hmFullNm: t => t, hmNmHidden: () => !!opt.hide, hwhoFor: () => 'me', hwhoBarHtml: () => '',
    hmTelOf: () => '', hmSrcOf: x => x.src, hmOrdOf: k => ({ t: k === 'touch' ? '연락할 분' : 'DB 고객' }), hmStepOf: k => rows.filter(r => r.key === k)[0],
    TA_OPENER: { db: s => (s ? { key: 'analysis1', src: '실손보험 변경 안내를 보시고', theme: 'silson' } : null) },
    TA5: { THEMES: { silson: { kw: '실손보험 점검', gain: ['지금 실손이 몇 세대인지', '겹치는 보장', '보장분석표'] } } },
    HM_TAMSG: { list: x => (x.k === 'touch' ? ['m1'] : ['miss']), text: (k, x, ch) => '고객님, 안녕하세요 (' + k + '·' + ch + ')', tag: () => '💬 안부 카톡', setCh: () => {}, openTa: () => {} },
    TA_MSG: { MSG: [{ k: 'ok', t: '만남 승낙' }, { k: 'miss', t: '부재' }] },
    HM_DOOR: { pick: x => (x.k === 'db' ? { cat: 'hospital', by: 'db' } : { cat: '', by: 'none' }), prods: c => [{ co: '보험사', nm: c ? '병원비 상품' : '1위 상품' }] },
    HM_DOOR_TOP: { month: '2026-11', cats: { hospital: [{ co: '보험사', nm: '병원비 상품' }] }, top: { co: '보험사', nm: '1위 상품' } },
    MK_TALK: { CATS: { hospital: { label: '병원비·비급여' } } },
    PF: { loaded: true, mine: opt.goal ? { goal_prem: 150, act_prem: 42 } : null }, pexSum: () => ({ live: { won: 900000 } }),
    hmWayNow: () => 0, hmWayCall: () => '0 / 2', hmWayMeet: () => '약속 0', hmWayTidy: () => '0 · 0', hmWayRec: () => '☎0 🤝0', hmWayCare: () => '마디 0',
    arApptPast: () => [], hmReferRows: () => [], mstDueList: () => ({ monLeft: 0 }),
    mcalItems: () => ({}), mcalDay: () => [], hmRtNear: () => [],
    hmRtAppts: () => (opt.appts || []),
    AR: { db: opt.db || [] },
    MSG_V2: opt.msg ? { open: o => { (g.__msgLog = g.__msgLog || []).push(o); } } : undefined,
    MST_TOUCH: [{ ic: '🧾', t: '청구는 사진 한 장으로', why: '받을 돈', say: '영수증 사진만' }, { ic: '💳', t: '보험료 잘 빠지는지', why: '미납', say: '이번 달도' }],
    hmRtPerson: () => {}, hmRtOpen: () => {},
    osClient: () => ({ from: () => ({ select: () => ({ in: () => ({ then: (ok) => ok({ data: opt.geo || [] }) }) }) }) }),
    navItemOf: id => { let f = null; g.TABS.forEach(gr => (gr.items || []).forEach(x => { if (x.id === id) f = x; })); return f; },
    arStageN: () => ({ c: { 미접촉: 3, TA: 1 }, tot: 4 }), hmNightSub: () => '오늘 닿은 분 0명',
    TABS: [{ group: '고객', items: [{ id: 'clients', icon: '📇', title: '고객 365일' }] },
           { group: '성장', items: [{ id: 'fp_talk', icon: '🗣️', title: '재무설계 실전화법서' }, { id: 'bohum', icon: '📕', title: '보험 마스터 아카데미' }, { id: 'rej_gym', icon: '🥊', title: '거절 근육 훈련' }] },
           { group: '상담 도구', items: [{ id: 'insight', icon: '🧭', title: '상품전략기' }, { id: 'mikki_talk', icon: '🎣', title: '미끼상품&접촉전략' }] }],
    osTabAllowed: () => true,
    hmMsCk: () => (opt.promo ? { d10: true } : {}), actStreak: () => ({ n: 3 }), hmMsDid: () => {},
    hwhoCan: () => !!opt.lead, hwhoId: () => '', hwhoIsAll: () => false, arMyId: () => 'me', HWHO_ALL: '*', hwhoName: () => '홍철호',
    hwhoList: () => [{ id: 'me', nm: '홍판서', n: 2 }, { id: 'p2', nm: '홍철호', n: 5 }, { id: 'p3', nm: '홍기동', n: 0 }],
    osEsc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  };
  g.window = g;
  let src = SRC;
  if (opt.allowed === false) src = src.replace('var ALLOWED = true;', 'var ALLOWED = false;');
  vm.createContext(g);
  vm.runInContext(src, g);
  return { g, pane, store, els };
}
const dyn = B => ({ querySelector: () => B.pane });

/* ★ 판 X505 — 사장님 말씀 「새화면을 먼저 기준으로 하고, 구화면을 누르면 전 버전으로」 —
     고른 적 없는 기기는 <b>새 화면</b>, 「↩ 예전 화면」 을 고른 기기('old')와 자동 점검 브라우저(webdriver)는 예전 화면. */
console.log('\n[1] 기본은 새 화면 · 예전 화면은 고른 기기만');
let B = box({}, '');
is(B.g.HOME_V2.on() === true && B.g.HOME_V2.apply(dyn(B)) === true && !!B.els.hv2, '고른 적 없는 기기는 새 화면이 선다');
B = box({ apex_home_v2: 'old' }, '');
is(B.g.HOME_V2.on() === false, '「↩ 예전 화면」 을 고른 기기(old)는 예전 화면');
is(B.g.HOME_V2.apply(dyn(B)) === false && !B.pane.classList.has('hm-v2') && !B.els.hv2, '예전 화면이면 apply 가 아무것도 안 한다(옛 홈 그대로)');
B.g.HOME_V2.paint();
is(!B.els.hv2, '예전 화면이면 hmPaint 가 불러도 새 화면이 안 생긴다');
is(/새 화면/.test(B.g.HOME_V2.chip()) && B.g.HOME_V2.chip().indexOf('onclick="homeV2Use(true)"') >= 0 && typeof B.g.homeV2Use === 'function', '예전 화면 인사 줄 단추는 「✨ 새 화면」(다시 돌아가는 길)');
B.g.HOME_V2.set(true);
is(B.store.apex_home_v2 === '1' && B.g.HOME_V2.on() === true, '「✨ 새 화면」 을 누르면 다시 새 화면(1)');
B.g.HOME_V2.set(false);
is(B.store.apex_home_v2 === 'old' && B.g.HOME_V2.on() === false, '「↩ 예전 화면」 을 누르면 이 기기에 old 가 남는다');
B = box({}, '', { robot: true });
is(B.g.HOME_V2.on() === false && B.g.HOME_V2.apply(dyn(B)) === false, '자동 점검 브라우저(webdriver)는 예전 화면 — 옛 홈 점검이 계속 옛 홈을 잰다');
B = box({ apex_home_v2: '1' }, '', { robot: true });
is(B.g.HOME_V2.on() === true, '자동 점검이라도 일부러 켜면(1) 새 화면');
B = box({ apex_home_v2: '1' }, '');
is(B.g.HOME_V2.apply(dyn(B)) === true && B.pane.classList.has('hm-v2') && !!B.els.hv2, '켠 기기에서는 판에 hm-v2 와 새 화면(#hv2)이 선다');
is(/예전 화면/.test(B.g.HOME_V2.chip()), '켜져 있을 때 인사 줄 단추는 「↩ 예전 화면」');

console.log('\n[2] 모두에게 끄기');
B = box({ apex_home_v2: '1' }, '', { allowed: false });
is(B.g.HOME_V2.on() === false && B.g.HOME_V2.chip() === '' && B.g.HOME_V2.apply(dyn(B)) === false, 'ALLOWED=false 면 켜 둔 기기도 예전 화면이고 단추도 안 선다');
is(/var ALLOWED = true;/.test(SRC), '끄는 한 줄(var ALLOWED = true;)이 한 곳에 있다');

console.log('\n[3] 옛 홈은 네 자리만');
const ixc = 걷기(IX);
is((IX.match(/<script src="home-v2\.js"><\/script>/g) || []).length === 1 && IX.indexOf('<script src="home-v2.js">') > IX.indexOf('<script src="hm-tamsg.js">'), 'index.html 이 home-v2.js 를 한 번, hm-tamsg.js 뒤에 싣는다');
is((ixc.match(/HOME_V2\.apply\(/g) || []).length === 1 && /try\{ if\(window\.HOME_V2\)HOME_V2\.apply\(dyn\); \}catch/.test(ixc), '홈을 그린 바로 뒤 한 곳 · try 안');
const hp = (IX.match(/function hmPaint\(\)\{[\s\S]*?\n\}/) || [''])[0];
is(/try\{ if\(window\.HOME_V2&&HOME_V2\.paint\)HOME_V2\.paint\(\); \}catch/.test(hp) && (ixc.match(/HOME_V2\.paint\(/g) || []).length === 1, 'hmPaint 안 한 곳 · try 안 (데이터가 늦게 와도 새 화면이 따라옴)');
is((ixc.match(/HOME_V2\.chip\(/g) || []).length === 1 && /try\{ v2=\(window\.HOME_V2&&HOME_V2\.chip\)\?HOME_V2\.chip\(\):''; \}catch/.test(ixc), '인사 줄 단추 한 곳 · try 안');
is((ixc.match(/HOME_V2/g) || []).length <= 11 && (ixc.match(/HOME_V2\.prefPut\(/g) || []).length === 1 && /cmLSSet\('apex_cli_real_'\+cmWho\(\),o\);\n  try\{ if\(window\.HOME_V2&&typeof HOME_V2\.prefPut==='function'\)HOME_V2\.prefPut\('real',o\); \}catch\(e\)\{\}/.test(IX.split('\r\n').join('\n').replace(/\n  \/\*[^\n]*\*\//g, '')),
  'index.html 안 HOME_V2 는 그 네 자리 + 실명 적는 한 곳(cmRealSet → prefPut · 판 X579) — ' + (ixc.match(/HOME_V2/g) || []).length + '번');

console.log('\n[4] 칸 차례 = 시안 rHome');
const H = (sc.match(/function html\(\) \{[\s\S]*?\n  \}/) || [''])[0];
const ord = ['topHtml', 'whoHtml', 'helloHtml', 'monHtml', 'stepsHtml', 'jvHtml', 'railHtml', 'inscHtml', 'weekHtml', 'roadHtml', 'eveHtml', 'menuHtml'];
const pos = ord.map(n => H.indexOf(n + '('));
is(pos.every(p => p > 0) && pos.every((p, i) => !i || p > pos[i - 1]), '인사 → 목표 → 다섯 걸음 → 챙기는 중 → 지금 이분 → 상품전략 → 이번 주 → 영업 한 바퀴 → 돌아보기 → 메뉴');

console.log('\n[5] 칸 속을 채우는 라이브 함수가 있다');
const ALL = IX + '\n' + JS;
['hmLeft', 'hmSteps', 'hmWhy', 'hmFullNm', 'hmNmHidden', 'hmNmToggle', 'hwhoFor', 'hwhoBarHtml', 'hmTelOf', 'hmSrcOf', 'hmOrdOf', 'hmStepOf',
 'hmQfin', 'hmSkip', 'hmOpen', 'hmDoorGo', 'hmRtOpen', 'hmRtNear', 'hmRtPerson', 'arApptPast', 'hmReferRows', 'mstDueList', 'mcalItems', 'mcalDay',
 'arStageN', 'hmNightSub', 'hmNightHtml', 'pexSum', 'pfLoad', 'pfSave', 'pfYm', 'pfYmLabel', 'pfIsLead', 'grState', 'grSteps', 'grIsOn', 'arGoCat', 'hmWayNow', 'hmWayCall', 'hmWayMeet', 'hmWayTidy', 'hmWayRec', 'hmWayCare', 'copyText', 'cregOpen', 'mcalMyPut', 'mcalCusPut', 'mcalCusList', 'mcalName', 'mcalOutName', 'icsBuild', 'mcalToday']
  .forEach(f => { if (sc.indexOf(f) >= 0) is(new RegExp('function ' + f + '\\(|g\\.' + f + ' = function').test(ALL), f + ' — 앱에 있다'); });
is(/var TABS=\[/.test(IX) && /var PF=/.test(IX), 'TABS(메뉴 표) · PF(목표) 가 앱에 있다');
is(/openTa\s*:|openTa:/.test(JS) && /prods\s*[,:}]/.test(JS) && /pick\s*[,:}]/.test(JS), 'HM_TAMSG.openTa · HM_DOOR.pick/prods 가 있다');

console.log('\n[6] 서버 · 저장');
/* 판 X505 — 서버는 <b>읽기 둘</b>만: 오늘 약속인 분의 좌표(dbs · 지역 동선이 적어 둔 칸)와 지역 동선이 쓰는 길찾기(route-km).
   쓰기(insert·update·upsert·delete·rpc)는 하나도 없습니다. 목표는 기존 pfLoad. */
const 부름 = (scP.match(/\.from\('[^']+'\)\.[a-z]+\([^)]*\)/g) || []);
is(부름.length === 1 && 부름[0] === ".from('dbs').select('id,lat,lng,next_appt_lat,next_appt_lng,next_appt_place')", '서버 표는 좌표 읽기 하나뿐 — ' + 부름.join(' | '));
is(scP.split(PEX_RPC).length === 2 && !/\.(insert|update|upsert|delete|rpc)\(/.test(scW) && !/supabase\./.test(sc), '서버에 쓰는 것은 「DB · 업적관리」 의 그 문(pipeline_save) 한 곳뿐 (판 X526 · 사장님이 고르신 「같은 서버 문 한 줄」)');
is((sc.match(/fetch\('([^']+)'/g) || []).join() === "fetch('/.netlify/functions/route-km'", '부르는 주소는 지역 동선의 길찾기(route-km) 하나뿐');
const 담기 = (scP.match(/setItem\(([^,]+),/g) || []).map(x => x.replace(/setItem\(|,/g, ''));
is(담기.length === 4 && 담기.indexOf('KEY') >= 0 && 담기.indexOf("'apexRouteKmV1'") >= 0 && 담기.indexOf('aiKey()') >= 0 && 담기.indexOf('newKey()') >= 0, '이 기기에 담는 것은 켜짐 표시 · 길찾기 거리(지역 동선과 같은 칸) · 자비스에 더한 메뉴(판 X549) · 신입 도움말 켜짐(판 X551 · 둘 다 즐겨찾기와 같은 자리)뿐 — ' + 담기.join(', '));

console.log('\n[7] 옛 홈은 숨기기만 · 터지면 예전 화면');
is(/hm-v2:not\(\.hm-v2-old\)>\*:not\(#hv2\)\{display:none!important\}/.test(sc), '옛 칸은 CSS 로 숨기기만(지우지 않음)');
is(/예전 오늘 칸/.test(sc) && /old: function/.test(sc), '「예전 오늘 칸 아래에 펼치기」 가 있다');
is(/function fallback\(\)[\s\S]{0,200}classList\.remove\('hm-v2', 'hm-v2-old'\)/.test(sc) && /catch \(e\) \{ fallback\(e\)/.test(sc), '그리다 터지면 새 화면을 떼고 예전 화면으로');
B = box({ apex_home_v2: '1' }, '', { job: false });
is(B.g.HOME_V2.apply(dyn(B)) === false, '「지금 할 것」 카드가 없는 판에서는 새 화면을 안 쓴다');
B = box({}, '?go=home&home=v2');
is(B.g.HOME_V2.apply(dyn(B)) === true && B.store.apex_home_v2 === '1', '?home=v2 로 켠다');
B = box({ apex_home_v2: '1' }, '?home=old');
is(B.g.HOME_V2.apply(dyn(B)) === false && B.store.apex_home_v2 === 'old', '?home=old 로 끈다(이 기기에 old)');

console.log('\n[8] 옷은 .hv2 아래로만');
const C = (sc.match(/var C = \[([\s\S]*?)\n    \];/) || ['', ''])[1];
const sels = (C.match(/'([^'{]+)\{/g) || []).map(s => s.slice(1, -1));
/* @media 줄은 속의 고르개를 따로 꺼내 봅니다 — 넓은 화면에서 아래 세 칸을 흐름에 붙이는 한 줄 */
const 미디어 = (C.match(/'@media[^{]*\{[^']*'/g) || []).map(x => x.replace(/^'@media[^{]*\{/, '').replace(/\}'$/, ''));
const 속 = [].concat.apply([], 미디어.map(m => (m.match(/([^{}]+)\{/g) || []).map(x => x.slice(0, -1))));
const 바깥 = sels.filter(s => !/^@media/.test(s)).concat(속)
  .filter(s => s.split(',').some(x => !/^\s*(\.hv2|#hv2|\.tab-pane\.hm-toss\.hm-v2)/.test(x.trim())));
is(속.length >= 2, '넓은 화면 줄(@media) 속 고르개도 셌다 — ' + 속.length + '개');
is(sels.length > 50 && !바깥.length, '옷 ' + sels.length + '줄이 모두 .hv2 · #hv2Sheet · #hv2Dim · 새 화면 판 아래 — 밖 ' + 바깥.length + (바깥.length ? ' ← ' + 바깥.slice(0, 3).join(' | ') : ''));

console.log('\n[9] 가짜 데이터로 그려 본다');
B = box({ apex_home_v2: '1' }, '', { goal: true });
B.g.HOME_V2.apply(dyn(B));
let h = B.els.hv2.innerHTML;
is(/홍판서님, 오늘 <b>2분<\/b> 남았어요/.test(h), '인사 — 남은 분 수(hmLeft)');
is(/42 \/ 150만 · <em>이대로면 18만 모자라요<\/em>/.test(h), '목표 — 실적 42 · 목표 150 · 예상 90만원 → 18만 모자라요 (만원 단위)');
is(/🙋 이분 상황 · 도와드릴 것/.test(h) && /실손보험 점검/.test(h) && /📜 TA 스크립트 바로/.test(h) && /약속 잡음/.test(h), '첫 전화(미접촉) 카드 — 상황 · 도와드릴 것 · TA 스크립트 바로 · 통화 결과 넷');
is(/💬 안부 카톡/.test(h) && /고객님, 안녕하세요 \(m1·kakao\)/.test(h) && /복사하고 보냈어요/.test(h), '연락할 분 카드 — TA 카톡 글(HM_TAMSG.text) · 복사하고 보냈어요');
is(/🧭 병원비·비급여/.test(h) && /🧭 이번 달 1위/.test(h) && /1위 상품/.test(h), '상품전략 — 걱정을 알면 그 상황, 모르면 이번 달 1위');
is(/<b>3<\/b><span>첫 전화<\/span>/.test(h) && /class="hot"/.test(h), '영업 한 바퀴 — 단계 수 · 오늘 볼 분 있는 칸은 점');
is(h.indexOf('<script') < 0, '글에 script 가 안 섞인다');
B = box({ apex_home_v2: '1' }, '', { hide: true });
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
is(/홍○○님/.test(h) && h.indexOf('홍길동님') < 0 && /👁 이름 보기/.test(h), '🙈 이름 가리기면 카드 이름이 「홍○○」');
B = box({ apex_home_v2: '1' }, '', { rows: [] });
B.g.HOME_V2.apply(dyn(B));
is(/오늘 할 일 끝/.test(B.els.hv2.innerHTML) && /오늘 볼 분을 다 챙겼어요/.test(B.els.hv2.innerHTML), '빈 날 — 「오늘 할 일 끝」 · 빈 카드 대신 다 챙겼다는 말');
B = box({ apex_home_v2: '1' }, '', { goal: false });
B.g.HOME_V2.apply(dyn(B));
is(/목표가 아직 없어요/.test(B.els.hv2.innerHTML), '목표가 없으면 지어내지 않고 「목표가 아직 없어요 — 정하기」');

console.log('\n[10] 시안과 다르던 곳 (알리기 · 아래 세 칸 · 팀원 한 줄)');
B = box({ apex_home_v2: '1' }, '', {});
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
is(/<span class="sl">알리기<\/span><span class="sn">0\/1<\/span>/.test(h) && h.indexOf('>기록<') < 0, '다섯 걸음 = 연락 · 만남 · 정리 · 관리 · 📣 알리기(0/1) — 시안 그대로, 기록 칸 없음');
is(/연속 3일/.test(h), '걸음 밑 연속 일수(actStreak)');
is(/class="dock"/.test(h) && /HOME_V2\.dock\('prod'\)/.test(h) && /HOME_V2\.dock\('talk'\)/.test(h) && /HOME_V2\.dock\('study'\)/.test(h), '아래 떠 있는 세 칸 — 상품전략 · 화법 · 공부 (누르면 그 갈래 판)');
B.g.HOME_V2.dock('talk');
let sh = (B.els.hv2Sheet || {}).innerHTML || '';
is(/재무설계 실전화법서/.test(sh) && /미끼상품&amp;접촉전략|미끼상품&접촉전략/.test(sh) && /거절 근육 훈련/.test(sh) && sh.indexOf('보험 마스터') < 0, '💬 화법 판 — 재무설계 실전화법서 · 미끼상품&접촉전략 · 거절 근육 훈련 (사장님 말씀)');
B.g.HOME_V2.dock('study');
sh = (B.els.hv2Sheet || {}).innerHTML || '';
is(/보험 마스터 아카데미/.test(sh), '📚 공부 판 — 보험 마스터 아카데미 (사장님 말씀)');

console.log('\n[11] 오늘 동선 거리');
B = box({ apex_home_v2: '1' }, '', { appts: [{ id: 'a1', hm: '10:00' }, { id: 'a2', hm: '14:00' }, { id: 'a3', hm: '16:00' }],
  geo: [{ id: 'a1', lat: 34.95, lng: 127.49 }, { id: 'a2', next_appt_lat: 34.95, next_appt_lng: 127.58, lat: 1, lng: 1 }, { id: 'a3' }] });
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
const 직선 = (function () { const R = 6371, r = Math.PI / 180, a = { lat: 34.95, lng: 127.49 }, b = { lat: 34.95, lng: 127.58 };
  const dLo = (b.lng - a.lng) * r, x = Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); })();
is(h.indexOf('동선 ' + (직선 * 1.35).toFixed(1) + 'km(어림)') >= 0, '약속 장소 좌표가 있으면 그것, 없으면 주소 좌표 — 직선 × 1.35 를 「(어림)」 으로 (' + (직선 * 1.35).toFixed(1) + 'km)');
is(/약속 3곳/.test(h) && /주소 모르는 곳 1/.test(h), '좌표 없는 곳은 지어내지 않고 「주소 모르는 곳 1」');
B = box({ apex_home_v2: '1', apexRouteKmV1: JSON.stringify({ '34.9500,127.4900,34.9500,127.5800': { km: 11.2, min: 19 } }) }, '',
  { appts: [{ id: 'a1' }, { id: 'a2' }], geo: [{ id: 'a1', lat: 34.95, lng: 127.49 }, { id: 'a2', lat: 34.95, lng: 127.58 }] });
B.g.HOME_V2.apply(dyn(B));
is(/동선 11\.2km ·/.test(B.els.hv2.innerHTML), '지역 동선이 카카오 길찾기로 재 둔 거리가 있으면 그 값(어림 딱지 없음)');
B = box({ apex_home_v2: '1' }, '', { appts: [] });
B.g.HOME_V2.apply(dyn(B));
is(/동네가 적힌 고객이 아직 없어요/.test(B.els.hv2.innerHTML) && !/km/.test(B.els.hv2.innerHTML), '약속도 동네 적힌 고객도 없으면 지어내지 않고 「지역 동선에서 동네 고르기」 안내');

console.log('\n[12] 약속이 없는 날의 추천 동선 (판 X509)');
const DB = [
  { id: 'r1', who: 'me', name: '홍길동', region: '순천시', dong: '연향동', stage: 'TA', days: 3 },
  { id: 'r2', who: 'me', name: '홍길순', region: '순천시', dong: '조례동', stage: 'AP', days: 1 },
  { id: 'r3', who: 'me', name: '홍갑돌', region: '순천 시', dong: '왕지동', stage: '미접촉', days: 9 },
  { id: 'r4', who: 'me', name: '변학도', region: '여수시', dong: '학동', stage: 'PC', days: 2 },
  { id: 'r5', who: 'me', name: '이몽룡', region: '순천시', dong: '', stage: '거절', days: 1 },
  { id: 'r6', who: 'p2', name: '성춘향', region: '순천시', dong: '', stage: 'AP', days: 1 }
];
B = box({ apex_home_v2: '1' }, '', { appts: [], db: DB, geo: [{ id: 'r2', lat: 34.95, lng: 127.49 }, { id: 'r1', lat: 34.96, lng: 127.52 }, { id: 'r3', lat: null, lng: null }] });
B.g.hwhoFor = () => 'me';
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
is(/추천 동선 순천시/.test(h), '만날 분이 가장 많은 동네(「순천시」·「순천 시」 를 한 동네로)를 고른다');
is(/추천 1<\/span><span class="x">홍길순님 · AP · 순천시 조례동/.test(h), '첫 분은 단계가 가장 앞선 분(만남 AP)');
is(h.indexOf('이몽룡') < 0 && h.indexOf('성춘향') < 0 && h.indexOf('변학도') < 0, '거절한 분 · 남의 배정 · 다른 동네는 안 넣는다');
is(/들를 분 3명/.test(h) && /주소 모르는 곳 1/.test(h) && /km\(어림\)/.test(h), '좌표 있는 두 분으로 거리(어림) · 좌표 없는 분은 「주소 모르는 곳」');
is(/오늘은 약속이 없어요 — 이 동네를 묶어 보세요/.test(h), '빈 날 줄은 「이 동네를 묶어 보세요」 로');
B = box({ apex_home_v2: '1' }, '', { appts: [{ id: 'a1' }, { id: 'a2' }], db: DB, geo: [{ id: 'a1', lat: 34.95, lng: 127.49 }, { id: 'a2', lat: 34.95, lng: 127.58 }] });
B.g.hwhoFor = () => 'me';
B.g.HOME_V2.apply(dyn(B));
is(!/추천 동선/.test(B.els.hv2.innerHTML) && /약속 2곳/.test(B.els.hv2.innerHTML), '약속이 있는 날은 추천 대신 약속 동선');
/* 판 X510 — 단계 앞쪽 분들이 좌표가 없어도, 좌표 있는 분부터 골라 거리가 선다 */
const DB2 = [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ id: 'q' + i, who: 'me', name: ['홍길동', '홍길순', '홍갑돌', '홍말순', '홍철호', '홍기동', '홍정돌', '임꺽정'][i - 1], region: '광양', stage: i <= 6 ? 'AP' : '미접촉', days: 10 - i }));
B = box({ apex_home_v2: '1' }, '', { appts: [], db: DB2, geo: DB2.map((r, i) => i < 6 ? { id: r.id } : { id: r.id, lat: 34.9 + i / 100, lng: 127.6 }) });
B.g.hwhoFor = () => 'me';
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
is(h.indexOf('추천 1</span><span class="x">홍정돌님') >= 0 && h.indexOf('km(어림)') >= 0 && h.indexOf('주소 모르는 곳 4') >= 0,'단계 앞쪽 여섯이 좌표가 없어도 좌표 있는 둘을 먼저 골라 거리가 선다 · 나머지는 「주소 모르는 곳」');
is(sc.indexOf('.qc:last-child:not(:only-child){scroll-snap-align:end}') >= 0,'마지막 카드는 끝에 맞춰 멈춘다 — 넘기면 끝까지 간다(튕겨 돌아오지 않음)');
B = box({ apex_home_v2: '1', apexRouteKmV1: JSON.stringify({ '34.9500,127.4900,34.9500,127.5800': { km: 11.2, min: 19 } }) }, '',
  { appts: [{ id: 'a1' }, { id: 'a0' }, { id: 'a2' }], geo: [{ id: 'a1', lat: 34.95, lng: 127.49 }, { id: 'a0', lat: 34.95, lng: 127.49 }, { id: 'a2', lat: 34.95, lng: 127.58 }] });
B.g.HOME_V2.apply(dyn(B));
is(/동선 11.2km ·/.test(B.els.hv2.innerHTML), '같은 주소(50m 안) 구간은 0km 로 치고 길찾기에 안 묻는다 — 그 한 구간 때문에 「(어림)」 으로 남지 않는다');
B = box({ apex_home_v2: '1' }, '', { promo: true });
B.g.HOME_V2.apply(dyn(B));
is(/class="pr done"/.test(B.els.hv2.innerHTML) && /1\/1/.test(B.els.hv2.innerHTML), 'SNS 캐러셀 미션(d10)을 했으면 알리기 1/1');
B = box({ apex_home_v2: '1' }, '', { lead: true });
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
is((h.match(/class="ring"/g) || []).length === 4 && /who-strip/.test(h) && /hwhoSet\('p2'\)/.test(h) && /hwhoSet\('\*'\)/.test(h), '팀장 — 팀원 동그라미 한 줄(나 · 팀원 둘 · 팀 전체), 누르면 hwhoSet');

console.log('\n[13] 시안과 나란히 보고 고친 것 (판 X511)');
{
  const FN = ['홍길동', '홍길순', '홍갑돌', '홍말순', '홍판서', '홍철호', '홍기동', '홍정돌', '임꺽정', '이몽룡', '성춘향', '변학도'];
  const many = Array.from({ length: 40 }, (_, i) => ({ k: 'db', tk: '미접촉', t: FN[i % FN.length], s: '아직 한 번도 안 걸었습니다', src: '보장분석', key: 'db:m' + i + ':미접촉' }));
  B = box({ apex_home_v2: '1' }, '', { rows: many });
  B.g.HOME_V2.apply(dyn(B));
  h = B.els.hv2.innerHTML;
  const dm = (h.match(/id="hv2Dots">([\s\S]*?)<\/div>/) || ['', ''])[1];
  is((h.match(/class="qc/g) || []).length === 40 && (dm.match(/<i /g) || []).length === 8,
    '카드 40장이어도 점은 시안처럼 8개 — 카드 수만큼 점을 세우면(팀원 화면 147장) 1,600px 넘는 줄이 섰음');
  is(/function dotOf\(i, n\) \{ return n <= DOT_MAX \? i : Math\.round\(i \* \(DOT_MAX - 1\) \/ \(n - 1\)\); \}/.test(SRC) && /var DOT_MAX = 8;/.test(SRC),
    '점은 고르게 나눠 맡는다 — 첫 장 = 첫 점, 끝 장 = 끝 점');
  B = box({ apex_home_v2: '1' }, '', {});
  B.g.HOME_V2.apply(dyn(B));
  h = B.els.hv2.innerHTML;
  is(!/시험\)|시안 9차 디자인|class="src"/.test(h) && /class="dock"/.test(h), '맨 아래 「새 오늘 화면 (시험) · 시안 9차 디자인」 설명 줄이 없다(시안에 없음) · 아래 세 칸은 그대로');
  B = box({ apex_home_v2: '1' }, '', { rows: many.slice(0, 3) });
  B.g.HOME_V2.apply(dyn(B));
  is(((B.els.hv2.innerHTML.match(/id="hv2Dots">([\s\S]*?)<\/div>/) || ['', ''])[1].match(/<i /g) || []).length === 3, '카드가 여덟 장 아래면 점도 그 수만큼');
}

console.log('\n[14] 오늘 동선 카드 · 카톡처럼 보내기 (판 X512 · 「오늘 어디가는지랑 지역동선 다 어디갔는데」 · 「안부 카톡이나 문자도 디자인」)');
{
  let X = box({ apex_home_v2: '1' }, '', { appts: [], db: [] });
  X.g.HOME_V2.apply(dyn(X));
  let hh = X.els.hv2.innerHTML;
  is(/class="rtc"/.test(hh) && /🗺️ 지역 동선/.test(hh) && hh.indexOf('class="rtc"') > hh.indexOf('id="hv2Week"'), '약속도 동네도 없어도 「📍 · 🗺️ 지역 동선」 카드가 늘 선다(이번 주 다음)');
  const DB3 = [1, 2, 3].map(i => ({ id: 'q' + i, who: 'me', name: ['홍길동', '홍길순', '홍갑돌'][i - 1], region: '광양', stage: 'AP', days: 3 }));
  X = box({ apex_home_v2: '1' }, '', { appts: [], db: DB3, geo: DB3.map((r, i) => ({ id: r.id, lat: 34.9 + i / 100, lng: 127.6 })) });
  X.g.hwhoFor = () => 'me';
  X.g.HOME_V2.apply(dyn(X)); hh = X.els.hv2.innerHTML;
  is(/오늘은 약속이 없어요 · 추천 동선 광양/.test(hh) && /들를 분 3명/.test(hh), '약속이 없으면 카드에 추천 동선(동네 · 들를 분)');
  X.g.HOME_V2.route(); let sh2 = (X.els.hv2Sheet || {}).innerHTML || '';
  is(/📍 추천 동선/.test(sh2) && /<svg[^>]*class="mapsvg"/.test(sh2) && /<path d="M/.test(sh2) && /<div class="tile no">1<\/div>/.test(sh2) && /홍길동님/.test(sh2) && /hmRtOpen\(\)/.test(sh2), '누르면 시트 — 실제 좌표를 줄인 그림 · 들를 분 · 지역 동선(카카오맵) 단추');
  X = box({ apex_home_v2: '1' }, '', { appts: [{ id: 'a1', nm: '홍길순', hm: '10:30', rg: '순천', st: 'AP' }, { id: 'a2', nm: '홍갑돌', hm: '14:00', rg: '순천', st: 'PC' }],
    geo: [{ id: 'a1', next_appt_lat: 34.95, next_appt_lng: 127.49, next_appt_place: '연향동 카페' }, { id: 'a2', lat: 34.96, lng: 127.52 }] });
  X.g.HOME_V2.apply(dyn(X)); hh = X.els.hv2.innerHTML;
  is(/오늘 동선 [0-9.]+km(\(어림\))? · 약속 2곳/.test(hh) && (hh.match(/동선 [0-9.]+km/g) || []).length === 1, '약속이 있으면 「오늘 동선 Nkm · 약속 N곳」 — 이번 주 칸에 같은 줄이 또 서지 않는다(한 곳)');
  X.g.HOME_V2.route(); sh2 = (X.els.hv2Sheet || {}).innerHTML || '';
  is(/10:30 · 홍길순님/.test(sh2) && /연향동 카페 · AP/.test(sh2) && /14:00 · 홍갑돌님/.test(sh2) && /장소 미정 · PC/.test(sh2), '시트 「약속」 — 시간 · 이름 · 장소(dbs.next_appt_place) · 단계, 장소 모르면 「장소 미정」(지어내지 않음)');
  X = box({ apex_home_v2: '1' }, '', { msg: true });
  X.g.HOME_V2.apply(dyn(X)); hh = X.els.hv2.innerHTML;
  is(/HOME_V2\.say\('touch:c1:'\)">💬 카톡처럼 보고 보내기/.test(hh) && /복사하고 보냈어요/.test(hh), '보내기 화면이 있으면 「💬 카톡처럼 보고 보내기」 · 빠른 「복사하고 보냈어요」 도 그대로');
  let qf = '';
  X.g.hmQfin = k => { qf = k; };
  X.g.HOME_V2.say('touch:c1:');
  const op = (X.g.__msgLog || [])[0] || { items: [] };
  is(op.who === '홍길동' && op.items.length === 1 && op.items[0].lb === '💳 보험료 잘 빠지는지' && op.items[0].note === '미납' &&
     op.items[0].text('sms') === '고객님, 안녕하세요 (m1·sms)', '보내기 화면 — 카드와 같은 글(HM_TAMSG.list · text) · 안부 제목은 MST_TOUCH 그대로 · 문자 고르면 문자 글');
  op.onSent && op.onSent(op.items[0], 'kakao');
  is(qf === 'touch:c1:', '「보냈어요」 = 이분 끝(hmQfin) — 저장 코드를 새로 안 짬');
}

console.log('\n[15] 약속 없어도 추천 · 일정 넣기(갤럭시 · 아이폰) — 판 X512 · 「약속 없어도 추천 띄우고 캘린더 입력이 편해야 하는데 갤럭시든 아이폰 이든」');
{
  const DBN = [{ id: 'n1', who: 'me', name: '홍말순', stage: 'PC', days: 2 }, { id: 'n2', who: 'me', name: '홍판서', stage: '미접촉', days: 40 }];
  let X = box({ apex_home_v2: '1' }, '', { appts: [], db: DBN });
  X.g.hwhoFor = () => 'me';
  X.g.HOME_V2.apply(dyn(X)); let hh = X.els.hv2.innerHTML;
  is(/오늘은 약속이 없어요 · 만날 분 추천 2명/.test(hh) && /추천 1<\/span><span class="x">홍말순님 · PC/.test(hh), '동네가 적힌 분이 없어도 만날 분 추천(카드 · 이번 주 칸) — 동네는 지어내지 않음');
  X.g.HOME_V2.route(); let s3 = (X.els.hv2Sheet || {}).innerHTML || '';
  is(/오늘 만날 분 추천/.test(s3) && /동네 모름/.test(s3) && !/mapsvg/.test(s3), '시트 — 그림 없이 만날 분만(만남 → 제안 → 청약 → 연락 차례)');
  /* 일정 넣기 */
  const did = [];
  X = box({ apex_home_v2: '1' }, '', {});
  Object.assign(X.g, { MCAL: { sel: '' }, mcalToday: () => '2026-11-21', CM_HOW: ['전화', '만남'],
    mcalMyPut: () => did.push(['me', X.g.MCAL.sel, X.els.mcalMyT.value, X.els.mcalMyH.value]),
    mcalCusPut: () => did.push(['cus', X.g.MCAL.sel, X.els.mcalCusId.value]),
    mcalCusList: () => [{ id: 'c1', name_masked: '홍*동' }], mcalName: () => '홍길동', mcalOutName: () => '홍*동',
    icsBuild: (n, evs) => 'ICS:' + JSON.stringify(evs) });
  X.g.HOME_V2.apply(dyn(X));
  is(/HOME_V2\.sched\(\)">＋ 일정/.test(X.els.hv2.innerHTML), '「＋ 일정」 은 달력 화면으로 넘기지 않고 일정 넣기 시트');
  X.g.HOME_V2.sched(); s3 = (X.els.hv2Sheet || {}).innerHTML || '';
  is(/📅 일정 넣기/.test(s3) && /schedSet\('ds','2026-11-22'\)">내일/.test(s3) && /schedSet\('hm','14:00'\)">14:00/.test(s3) && /type="date"/.test(s3) && /type="time"/.test(s3) && /📌 내 일정/.test(s3) && /👤 고객 일정/.test(s3),
    '날짜 · 시각은 단추 한 번(오늘 · 내일 · 모레 / 10 · 14 · 19시) + 폰 기본 고르개(date · time) · 내 일정 / 고객 일정');
  X.g.HOME_V2.schedSet('ds', '2026-11-22'); X.g.HOME_V2.schedSet('hm', '14:00');
  X.els.mcalMyT = { value: '지점 회의' }; X.els.mcalMyH = { value: '' };
  X.g.HOME_V2.schedPut(); s3 = (X.els.hv2Sheet || {}).innerHTML || '';
  is(did[0] && did[0][0] === 'me' && did[0][1] === '2026-11-22' && did[0][2] === '지점 회의' && did[0][3] === '14:00', '넣기 = 있던 mcalMyPut(내 캘린더와 같은 칸) · 고른 날은 MCAL.sel 한 곳 · 시각 그대로');
  is(/✓ 넣었어요/.test(s3) && /HOME_V2\.schedIcs\(\)">📲 폰 달력에 넣기/.test(s3) && /calendar\.google\.com\/calendar\/render\?action=TEMPLATE&amp;text=%EC%A7%80%EC%A0%90%20%ED%9A%8C%EC%9D%98&amp;dates=20261122T140000\/20261122T143000/.test(s3),
    '넣은 뒤 「📲 폰 달력에 넣기」(아이폰 · 갤럭시) · 「Google 캘린더로」(그 일정 · 그 시각)');
  X.g.HOME_V2.sched(); X.g.HOME_V2.schedSet('tab', 'cus');
  X.els.mcalCusId = { value: 'c1' }; X.els.mcalCusHow = { value: '만남' }; X.els.mcalCusNote = { value: '보장분석 설명' };
  X.g.HOME_V2.schedPut(); s3 = (X.els.hv2Sheet || {}).innerHTML || '';
  is(did[1] && did[1][0] === 'cus' && did[1][2] === 'c1' && /홍길동님 · 만남 — 보장분석 설명/.test(s3) && /text=%ED%99%8D\*%EB%8F%99/.test(s3),
    '고객 일정 = 있던 mcalCusPut(고객 365일과 같은 자리) · 폰 달력 · 구글로 나가는 이름은 가림(mcalOutName)');
  is(!/\.from\('dbs'\)\.(insert|update|upsert)|mcalMyAdd\(|cmNextSave\(|cmTouchAdd\(/.test(sc), '일정 저장 코드를 새로 안 짬 — 있던 넣기 두 가지를 부르기만');
}

console.log('\n[16] 🎯 목표 시트 · 🔁 영업 한 바퀴 단계 시트 (판 X513)');
{
  const db = [
    { id: 'd1', who: 'me', name: '홍길동', stage: '미접촉', region: '순천', dong: '연향동', days: 3 },
    { id: 'd2', who: 'me', name: '홍길순', stage: '부재', region: '', dong: '', days: 9 },
    { id: 'd3', who: 'p2', name: '홍갑돌', stage: '미접촉', days: 20 },
    { id: 'd4', who: 'me', name: '홍말순', stage: 'AP', appt: '2026-11-25T14:00', days: 1 },
    { id: 'd5', who: 'me', name: '임꺽정', stage: '', days: 9999 }
  ];
  let X = box({ apex_home_v2: '1' }, '', { goal: true, db });
  const gone = [], saved = [];
  Object.assign(X.g, { go: id => gone.push(id), arGoCat: c => gone.push('cat:' + c), hmRtPerson: id => gone.push('p:' + id),
    pfYm: () => '2026-11', pfYmLabel: () => '2026년 11월', pfIsLead: () => true,
    APEX_STAGE: { aimText: k => '<b>' + k + '</b> 목표', tools: k => (k === '미접촉' ? [{ id: 'ta_script', e: '📞', t: 'TA 스크립트' }, { id: 'nope', e: '•', t: '없는 칸' }] : []) },
    osTabAllowed: id => id !== 'nope',
    pfSave: (p, quiet) => { saved.push([JSON.stringify(p), quiet]); X.g.PF.loaded = false; return { then: f => f() }; } });
  X.g.PF.mine.goal_case = 10;
  X.g.HOME_V2.apply(dyn(X));
  const hh = X.els.hv2.innerHTML;
  is(/class="mon" onclick="HOME_V2\.goal\(\)"/.test(hh) && /HOME_V2\.stage\(0\)"><b>3<\/b><span>첫 전화/.test(hh) && /HOME_V2\.stage\(5\)/.test(hh) && hh.indexOf('class="road2"') > 0 && !/go\('crm'\)/.test(hh.slice(hh.indexOf('class="road2"'), hh.indexOf('class="eve"'))),
    '목표 칸 · 영업 한 바퀴 여섯 칸 → 시트 (DB 통합 CRM · TFA 로 안 넘어감)');
  X.g.HOME_V2.goal(); let s = (X.els.hv2Sheet || {}).innerHTML || '';
  is(/🎯 2026년 11월 내 목표/.test(s) && /id="hv2GoalP"[^>]*value="150"/.test(s) && /id="hv2GoalC"[^>]*value="10"/.test(s) && /HOME_V2\.goalQ\(200\)/.test(s) && /HOME_V2\.goalPut\(\)">저장/.test(s) && /arGoCat\('dbperf'\)/.test(s) && /HOME_V2\.goalOld\(\)/.test(s),
    '목표 시트 — 지금 목표 금액 · 건수가 칸에 · 빠른 단추 · 저장 · 리더는 「팀원 목표는 DB · 업적관리」 · 예전 「업적 자세히」');
  X.els.hv2GoalP = { value: '200' }; X.els.hv2GoalC = { value: '8' }; X.els.hv2GoalPer = { innerHTML: '' };
  X.g.HOME_V2.goalPer();
  is(/고객 한 분당 목표 <b>25만원<\/b>/.test(X.els.hv2GoalPer.innerHTML), '금액 ÷ 건수 = 고객 한 분당 목표가 저절로');
  X.g.HOME_V2.goalPut();
  is(saved.length === 1 && saved[0][0] === '{"goal_prem":200,"goal_case":8}' && saved[0][1] === true, '저장 = 있던 pfSave(금액 · 건수 같이) 한 번 — monthly_perf 그 칸');
  X.els.hv2GoalP = { value: '' }; X.g.HOME_V2.goalPut();
  is(saved.length === 1, '금액이 비면 저장 안 함');
  X.g.PF.loaded = false; X.g.HOME_V2.goal(); s = X.els.hv2Sheet.innerHTML;
  is(/목표를 읽는 중이에요/.test(s) && !/hv2GoalP/.test(s), '목표를 아직 못 읽었으면 0 을 칸에 깔지 않고 「읽는 중」');
  X.g.PF.loaded = true;
  X.g.HOME_V2.stage(0); s = X.els.hv2Sheet.innerHTML;
  is(/첫 전화/.test(s) && /미접촉 목표 · 모두 3명/.test(s) && /hmRtPerson\('d2'\)/.test(s) && /hmRtPerson\('d1'\)/.test(s) && /hmRtPerson\('d5'\)/.test(s) && !/d3/.test(s) && s.indexOf("'d2'") < s.indexOf("'d1'") && s.indexOf("'d1'") < s.indexOf("'d5'"),
    '단계 시트 — 칸 숫자와 같은 분들(지금 보는 분 것만 · 오래 연락 못 한 분 먼저 · 기록 없는 분은 끝)');
  is(/9일 전 연락/.test(s) && /순천 연향동/.test(s) && /연락 기록 없음/.test(s) && /TA 스크립트/.test(s) && !/없는 칸/.test(s) && /go\('crm'\)">📋 DB 통합 CRM 에서 전부 보기/.test(s),
    '줄마다 단계 · 동네 · 마지막 연락 · 「이 단계에서 쓰는 것」(APEX_STAGE.tools · 열 수 있는 것만) · 예전 길은 맨 아래 단추');
  X.g.HOME_V2.stage(2); s = X.els.hv2Sheet.innerHTML;
  is(/약속 11-25 14:00/.test(s) && /모두 1명/.test(s), '약속이 잡힌 분은 약속 날짜로');
  is(!/\.(insert|update|upsert|delete|rpc)\(/.test(scW) && (sc.match(/pfSave\(/g) || []).length === 1, '목표 저장은 있던 pfSave 한 곳 · 서버에 직접 쓰는 것 없음');
}

console.log('\n[17] 💬 화법 · 🧭 상품전략 · 📚 공부 시트 (판 X514 · 시안 openTalk · openProd · openStudy)');
{
  let X = box({ apex_home_v2: '1' }, '', {});
  const cp = [];
  const MAP = { TA: { aim: '<b>만날 날짜</b>를 잡는다', way: '날짜 두 개', q: ['어디서 뵙나'] }, AP: { aim: '다음 자리', way: '재촉 안 함', q: ['가입이 되는 분인가'] },
    PC: { aim: '걸리는 것', way: '어느 쪽', q: [], note: '보험료·보장은 <b>심사 결과에 따릅니다</b>' }, CS: { aim: '서류', way: '설명 안 함', q: [] }, 계약완료: { aim: '증권', way: '직접', q: [] } };
  Object.assign(X.g, {
    copyText: t => cp.push(t),
    APEX_STAGE: { of: k => MAP[k] || null, aimText: k => (MAP[k] ? MAP[k].aim.replace(/<[^>]*>/g, '') : ''), wayText: k => (MAP[k] ? MAP[k].way : ''),
      script: k => (k === 'TA' ? { t: '일반 DB', say: '고객님, 안녕하세요.\n잠깐 통화 괜찮으실까요.', tip: '' } : k === '부재' ? { t: '안 받으신 분', say: '며칠 전에 연락드렸다가', tip: '<b>안 받은 시간에</b> 또 걸지 않습니다' } : null),
      objList: () => Array.from({ length: 8 }, (_, i) => ({ title: '거절 ' + i, one: '한마디 ' + i, tone: '말투 ' + i })),
      pdel: [{ n: 1, t: '증권을 <b>같이 펴 본다</b>', say: '고객님, 증권 나왔습니다.', no: '다른 상품 이야기 안 함' }] },
    TA_MSG: { MSG: [{ k: 'eve', t: '전날 확인' }, { k: 'thanks', t: '만난 직후 감사' }, { k: 'miss', t: '부재' }], textFor: (k, f, ch) => (k === 'go' ? '' : '[' + k + '] 안녕하세요 ' + f.c + '님 · ' + f.me + ' · ' + ch) },
    HM_TAMSG: Object.assign(X.g.HM_TAMSG, { area: () => '순천' }),
    TAB_META: {},
    grState: () => ({ lv: 1, done: { 'go:manual': 1 } }),
    GR_LV: [{ t: '입사 첫 주', s: '길 익히기' }, { t: '첫 달', s: '첫 고객' }],
    grSteps: lv => [{ k: 'go:manual', ic: '📘', n: '사용 설명서', d: '훑기', open: "grOpen('go','manual')" }, { k: 'cur:c1', cur: 'c1', ic: '🔁', n: '익히기 · 실손', d: '세대별 차이', pass: '30초에 말하면', open: "fpTalkOpen('a1')" }],
    grIsOn: (x, v) => !!v.done[x.k]
  });
  X.g.TABS.push({ group: '상담', items: [{ id: 'ta_script', icon: '📜', title: 'TA 스크립트' }, { id: 'edu', icon: '🌱', title: '성장 로드맵' }, { id: 'academy', icon: '📈', title: '90일 아카데미' }] });
  X.g.HOME_V2.apply(dyn(X));
  const sh = () => (X.els.hv2Sheet || {}).innerHTML || '';
  X.g.HOME_V2.dock('talk'); let t = sh();
  is(/💬 화법/.test(t) && /HOME_V2\.talk\('rej'\)/.test(t) && /class="on" onclick="HOME_V2\.talk\('ta'\)">📞 첫 전화/.test(t) && /첫 마디 — 일반 DB/.test(t) && /고객님, 안녕하세요\.\n잠깐 통화/.test(t) && /만날 날짜를 잡는다/.test(t) && /HOME_V2\.talkCp\(0\)">📋 복사/.test(t),
    '화법 시트 — 단계 칩(첫 전화 · 부재 · 거절 · 만남 · 제안 · 청약 · 관리) · 첫 전화 = TA 대본 첫 마디(APEX_STAGE.script) · 할 일 · 복사');
  is(/재무설계 실전화법서/.test(t) && /전체 대본 · 화법서/.test(t), '맨 아래 전체 대본 · 화법서(실전화법서 포함 — 예전 메뉴 목록)');
  X.g.HOME_V2.talkCp(0);
  is(cp[0] === '고객님, 안녕하세요.\n잠깐 통화 괜찮으실까요.', '복사 = 그 문장 그대로(있던 copyText)');
  X.g.HOME_V2.talk('rej'); t = sh();
  is(/이 말이 나오면 <small>8가지/.test(t) && /「거절 5」/.test(t) && !/「거절 6」/.test(t) && /HOME_V2\.talkMore\(\)">나머지 2가지/.test(t), '거절 = TA 스크립트 거절(objList) 여섯 개 + 「나머지 더 보기」');
  X.g.HOME_V2.talkMore(); t = sh();
  is(/「거절 7」/.test(t), '더 보기 → 전부');
  X.g.HOME_V2.talk('ap'); t = sh();
  is(/다음 자리/.test(t) && /가입이 되는 분인가/.test(t) && /카톡 — 전날 확인/.test(t) && /\[eve\] 안녕하세요 고객님 · 홍판서 · kakao/.test(t) && /카톡 — 만난 직후 감사/.test(t) && !/카톡 — go/.test(t),
    '만남 = 할 일 · 가릴 것 · 카톡(전날 확인 · 만난 직후 감사 — TA_MSG 원본, 빈 글은 안 세움)');
  X.g.HOME_V2.talk('pc'); t = sh();
  is(/심사 결과에 따릅니다/.test(t), '제안 — 「심사 결과에 따릅니다」 줄을 빼지 않음');
  X.g.HOME_V2.talk('cm'); t = sh();
  is(/증권 전할 때 — 말하는 차례/.test(t) && /1\. 증권을 같이 펴 본다/.test(t) && /고객님, 증권 나왔습니다/.test(t), '관리 = 증권 전달 차례(APEX_STAGE.pdel)');
  X.g.HOME_V2.talk('miss'); t = sh();
  is(/며칠 전에 연락드렸다가/.test(t) && /안 받은 시간에 또 걸지 않습니다/.test(t) && /카톡 — 부재/.test(t), '부재 = SAY 부재 + 팁 + 부재 카톡');

  X.g.HOME_V2.dock('prod'); t = sh();
  is(/🧭 11월 상품전략/.test(t) && /class="pcard"/.test(t) && /병원비·비급여/.test(t) && /오늘 볼 분 1명/.test(t) && /이번 달 1위 · 보험사 · 병원비 상품/.test(t) && /hmOpen\('db:d1:미접촉'\)/.test(t) && /hmDoorGo\('hospital',''\)/.test(t) && /hmDoorGo\('',''\)">상품전략기 전체 열기/.test(t),
    '상품전략 시트 — 상황별 1위(HM_DOOR_TOP) · 오늘 볼 분(오늘 화면과 같은 자 doorOf) · 이분 한 장 · 그 구실로 문 열기 · 상품전략기');

  X.g.HOME_V2.dock('study'); t = sh();
  is(/📚 공부/.test(t) && /오늘의 공부 · Lv\.1 다음 걸음/.test(t) && /🔁 익히기 · 실손/.test(t) && /합격 기준<\/b> — 30초에 말하면/.test(t) && /HOME_V2\.close\(\);fpTalkOpen\(&#39;a1&#39;\)">시작하기/.test(t),
    '공부 시트 — 오늘의 공부 = 성장 로드맵 「지금 할 것 하나」(내 레벨에서 안 끝낸 첫 걸음) · 그 걸음의 문으로 시작');
  is(/go\('edu'\)/.test(t) && /성장 로드맵 · Lv\.1 첫 달/.test(t) && /1 \/ 2 걸음/.test(t) && /과정 <small>/.test(t) && /보험 마스터 아카데미/.test(t) && !/>성장 로드맵<\/div>/.test(t.slice(t.indexOf('과정 <small>'))),
    '내 길 = 성장 로드맵(레벨 · 걸음 수) · 과정 = 공부 화면들(성장 로드맵은 위에 한 번만)');
  X.g.grSteps = () => [];
  X.g.HOME_V2.dock('study'); t = sh();
  is(!/오늘의 공부/.test(t) && /과정 <small>/.test(t), '걸음이 없으면 「오늘의 공부」 를 지어내지 않음');
  X.g.HOME_V2.dockAll('talk'); t = sh();
  is(/곳<\/div>/.test(t) && /재무설계 실전화법서/.test(t), '「모든 화면」 = 예전 목록 그대로');
  is(!/\.(insert|update|upsert|delete|rpc)\(/.test(scW) && !/grTick\(|grSave\(|localStorage\.setItem\('apex_grow/.test(sc), '세 시트는 읽기만 — 성장 체크(grTick)도 안 건드림');
}

console.log('\n[18] 💰 예상 월납 · ✓ 계약됐어요 · 🛰 자비스 (판 X526 · 시안 openAmt · openClose · openJv)');
{
  const EP = fs.readFileSync(path.join(ROOT, 'edu-pipeline.html'), 'utf8');
  is(/sb\.rpc\('pipeline_save', \{ p_id: id, p: patch \}\)/.test(EP) && /const NUMF = \{ expect: 'expect_premium', contract: 'contract_premium'/.test(EP) &&
     /p\.contracted_at = \(r\.stage === '계약완료' \|\| r\.stage === '증권전달'\) \? new Date\(\)\.toISOString\(\)/.test(EP),
    '같은 문 · 같은 칸 — 「DB · 업적관리」 가 pipeline_save 로 expect_premium · contract_premium · 계약완료면 contracted_at 을 적는 그 규칙');
  const PS = SRC.slice(SRC.indexOf('  function pexSave('), SRC.indexOf('  function cusSync('));
  is(/g\.hdbCan\(r\)/.test(PS) && /typeof sb\.rpc !== 'function'/.test(PS) && /res && res\.error/.test(PS), '저장 한 곳(pexSave) — 내 고객만(hdbCan) · 서버 없으면 멈춤 · 못 했으면 그렇다고');
  is((sc.match(/\* 10000/g) || []).length === 1 && /function toWon\(man\) \{ return Math\.round\(man\) \* 10000; \}/.test(sc), '만원 → 원(칸은 원) 하는 자리는 toWon 한 곳 — 만 배 오류 자리');

  const rpc = [];
  const DB = [{ id: 'd1', name: '홍길동', stage: 'AP', who: 'me', expect: 150000 }, { id: 'd2', name: '홍말순', stage: 'CS', who: 'me', expect: 200000, appt: '2026-11-24T14:00:00' },
    { id: 'd3', name: '홍갑돌', stage: 'PC', who: 'me' }, { id: 'd4', name: '홍판서', stage: '계약완료', who: 'me' }, { id: 'd5', name: '임꺽정', stage: 'AP', who: 'p2' }];
  let X = box({ apex_home_v2: '1' }, '', { db: DB });
  const said = [];
  Object.assign(X.g, {
    mcalToday: () => '2026-11-23', toast: t => said.push(['toast', t]),
    hdbRow: id => DB.filter(r => r.id === id)[0] || null, hdbCan: r => r.who === 'me',
    osClient: () => ({ rpc: (n, a) => { rpc.push([n, a]); return { then: ok => ok({ error: null }) }; } }),
    hmPexPut: (id, w) => said.push(['pexput', id, w]), hdbLocal: (id, p) => said.push(['local', id, JSON.stringify(p)]), hmPexRow: () => said.push(['row']),
    CUS: { db: { id: 'd2', stage: 'CS', expect_premium: 200000 } }, cusV2Paint: () => said.push(['cus']),
    arApptPast: () => [{ id: 'd3', name: '홍갑돌', appt: '2026-11-20T10:00:00', stage: 'AP' }], hmReferRows: () => [{ id: 'd4', name: '홍판서' }], mstDueList: () => ({ monLeft: 2 }),
    mcalItems: () => ({ '2026-11-26': [{ k: 'next', id: 'c9', t: '홍기동' }, { k: 'touch', id: 'c8', t: '변학도' }], '2026-11-24': [{ k: 'next', id: 'c7', t: '홍정돌' }], '2026-11-30': [{ k: 'appt', t: '성춘향', s: '15:00 · 여수' }] }),
    mcalDay: (I, ds) => I[ds] || []
  });
  X.g.HOME_V2.apply(dyn(X));
  const sh = () => (X.els.hv2Sheet || {}).innerHTML || '';
  X.g.HOME_V2.amt('d1'); let t = sh();
  is(/홍길동님 예상 월납/.test(t) && /id="hv2Num"[^>]*value="15"/.test(t) && /HOME_V2\.numQ\(5\)">5<small>만원/.test(t) && /HOME_V2\.numQ\(30\)/.test(t) && /HOME_V2\.amtPut\('d1'\)">저장/.test(t),
    '예상 월납 시트 — 이름 · 지금 값(원 → 만원 15) · 5 · 10 · 20 · 30만원 단추 · 저장');
  X.els.hv2Num = { value: '20' }; X.g.HOME_V2.amtPut('d1');
  is(rpc.length === 1 && rpc[0][0] === 'pipeline_save' && rpc[0][1].p_id === 'd1' && JSON.stringify(rpc[0][1].p) === '{"expect_premium":"200000"}' && said.some(x => x[0] === 'pexput' && x[1] === 'd1' && x[2] === 200000),
    '저장 → pipeline_save(d1, {expect_premium: 「200000」원}) · 손에 든 줄 · 합계는 있던 hmPexPut');
  X.els.hv2Num = { value: '' }; X.g.HOME_V2.amtPut('d1');
  is(rpc.length === 1 && said.some(x => x[0] === 'toast' && /금액을 적어/.test(x[1])), '빈 금액이면 안 보냄');
  X.els.hv2Num = { value: '30' }; X.g.HOME_V2.amtPut('d5');
  is(rpc.length === 1 && said.some(x => x[0] === 'toast' && /내 고객이 아니면/.test(x[1])), '남의 고객이면 안 보냄(hdbCan)');
  X.g.HOME_V2.won('d2'); t = sh();
  is(/홍말순님 계약 축하해요 🎉/.test(t) && /value="20"/.test(t) && /HOME_V2\.numQ\(50\)/.test(t) && /체결일은 오늘로/.test(t), '계약 시트 — 예상 월납을 먼저 채워 둠 · 10 · 20 · 30 · 50만원');
  X.els.hv2Num = { value: '25' }; X.g.HOME_V2.wonPut('d2');
  const p2 = (rpc[1] || [])[1] || { p: {} };
  is(p2.p_id === 'd2' && p2.p.stage === '계약완료' && /^\d{4}-\d\d-\d\dT/.test(p2.p.contracted_at) && p2.p.policy_sent_at === '' && p2.p.contract_premium === '250000',
    '✓ 계약됐어요 → pipeline_save(계약완료 · 체결일 지금 · 증권 전달일 비움 · 계약 업적 250000원) — queueSave 규칙 그대로');
  is(said.some(x => x[0] === 'local' && x[1] === 'd2' && /"stage":"계약완료"/.test(x[2]) && /"contract":250000/.test(x[2])) && said.some(x => x[0] === 'row') && X.g.CUS.db.stage === '계약완료' && said.some(x => x[0] === 'cus'),
    '그 뒤 손에 든 줄(hdbLocal) · 다시 읽기(hmPexRow) · 열린 고객 화면(CUS.db · cusV2Paint)까지');
  const SC = SRC.slice(SRC.indexOf('  function cardHtml('), SRC.indexOf('  var ROAD_KEY'));
  is(/x\.k === 'db' && \/\^\(AP\|PC\|CS\)\$\/\.test\(String\(x\.tk \|\| ''\)\) && x\.id \? amtChip\(x\.id\)/.test(SC) && /String\(x\.tk \|\| ''\) === 'CS' && x\.id\) h \+= '<button type="button" class="btn ok" onclick="HOME_V2\.won/.test(SC),
    '오늘 카드 — 만남 · 제안 · 청약 분은 이름 옆 금액 칸(없으면 「금액 ?」) · 청약 분은 「✓ 계약됐어요」');
  X.g.HOME_V2.goal(); t = sh();
  is(/💰 예상 월납 안 적힌 1분 — 홍갑돌님부터 적기/.test(t) && /HOME_V2\.amt\('d3'\)/.test(t), '목표 시트 — 「예상 월납 안 적힌 n분 — 누구부터」(내 것 · 만남 · 제안 · 청약 중)');

  X.g.HOME_V2.jv(); t = sh();
  is(/🛰 자비스가 챙기는 중/.test(t) && /<h2>오늘 <small>4곳 남음/.test(t) && /jvw on">노쇼<\/span> 홍말순님 내일 14:00 약속<small>전날 확인 카톡/.test(t) && /jvw on">증권<\/span> 홍판서님 계약완료<small>증권 전달이 남았어요/.test(t) &&
     /jvw on">약속 지남<\/span> 홍갑돌님 11\/20 약속 지남<small>/.test(t) && /jvw on">소개<\/span> 홍판서님 소개 여쭐 차례/.test(t) && !/임꺽정/.test(t),
    '자비스 시트 「오늘」 — 내일 약속(노쇼) · 계약완료인데 증권 전 · 약속 지남 · 소개 차례 (남의 고객 안 섬)');
  is(/미리 세워 둔 연락 <small>2개/.test(t) && /jvw">11\/26<\/span>.*홍기동 · 할 일/.test(t) && /jvw">11\/30<\/span>.*성춘향 · 약속 15:00/.test(t) && !/홍정돌/.test(t) && !/변학도/.test(t) && /osOpenClient\(&#39;c9&#39;\)|osOpenClient\('c9'\)/.test(t) && /go\('mycal'\)/.test(t),
    '「미리 세워 둔 연락」 — 달력의 2주 안 할 일 · 약속(내일 것은 위 노쇼로 · 연락 주기 줄은 안 섞음) · 누르면 그분 / 달력 그날');
  is(/💌 이번 달 보낼 마디 2/.test(t) && /jvnote/.test(t), '마디 · 끊기기 쉬운 자리 설명');
  const jl = X.g.HOME_V2 && SRC.indexOf("'오늘 끊기기 쉬운 자리 ' + n + '곳'") > 0 && SRC.indexOf("' · 미리 세운 연락 ' + J.P.length + '개'") > 0;
  is(jl, '오늘 화면 자비스 한 줄 — 「오늘 끊기기 쉬운 자리 n곳 · 미리 세운 연락 m개」(시안 문구)');

  console.log('\n[31] ✅ 챙기는 중 — 갈래 · 완료 (판 X579 · 사장님 말씀 「30명 정리하는데 깔끔하게 · 완료 처리 · 매일 스케줄 관리」)');
  const pos = ['📌 약속 확인', '⏰ 약속 지남', '📄 증권 전달', '🙌 소개 요청', '미리 세워 둔 연락'].map(k => t.indexOf(k));
  is(pos.every((p, i) => p > 0 && (!i || p > pos[i - 1])) && /오늘 0 \/ 4 마침/.test(t), '갈래 넷(약속 확인 → 약속 지남 → 증권 → 소개) → 미리 세운 연락 · 「오늘 0 / 4 마침」');
  is(/HOME_V2\.close\(\);hdbOpen\('d4','증권전달'\)">✓ 전달했어요/.test(t) && /HOME_V2\.jvDo\('met','d3'\)">🤝 만났어요/.test(t) && /HOME_V2\.jvDo\('again','d3'\)">📅 다시 약속/.test(t) &&
     /HOME_V2\.jvDo\('end','d3'\)">✖ 거절로 정리/.test(t) && /HOME_V2\.jvDo\('ref','d4'\)">🤝 소개 받았어요/.test(t) && /HOME_V2\.jvDo\('done','노쇼:d2'\)">✓ 했어요/.test(t),
    '끝내기는 있던 길 — 증권 = 전달일 묻는 창(hdbOpen 증권전달) · 만났어요(AP→PC) · 다시 약속 · 거절로 정리 · 소개 받음 · 약속 확인 ✓');
  const SK = {}, call = [];
  Object.assign(X.g, { hmDaySkips: k => (SK[k] || []).slice(), hmDaySkip: (k, id) => { (SK[k] = SK[k] || []).push(id); }, HM_REFER_KEY: 'rk',
    hmLateSkips: () => (SK.late || []).slice(), hmLateSkip: id => { (SK.late = SK.late || []).push(id); }, hmReferSkip: id => { (SK.rk = SK.rk || []).push(id); },
    hdbTo: (id, to) => call.push('to:' + id + ':' + to), hmLateEnd: id => call.push('end:' + id), hmReferGot: id => call.push('ref:' + id),
    hmLateAgain: id => call.push('again:' + id), setTimeout: () => 0 });
  X.g.HOME_V2.jvDo('done', '노쇼:d2'); t = sh();
  is(SK.apex_hv2_jv_done_v1.join() === '노쇼:d2' && /오늘 1 \/ 4 마침/.test(t) && !/홍말순님 내일/.test(t) && /<h2>오늘 <small>3곳 남음/.test(t), '✓ 했어요 → 있던 하루 넘김 칸(hmDaySkip) · 줄에서 빠지고 「1 / 4 마침」');
  X.g.HOME_V2.jvDo('lateskip', 'd3'); X.g.HOME_V2.jvDo('refskip', 'd4'); t = sh();
  is(SK.late.join() === 'd3' && SK.rk.join() === 'd4' && /오늘 3 \/ 4 마침/.test(t) && /✓ 오늘 마치거나 넘긴 3곳/.test(t), '약속 지남 · 소개 「오늘 넘김」 = 홈 🕗 · 💬 와 같은 칸(hmLateSkip · hmReferSkip)');
  X.g.HOME_V2.jvDo('met', 'd3'); X.g.HOME_V2.jvDo('end', 'd3'); X.g.HOME_V2.jvDo('ref', 'd4'); X.g.HOME_V2.jvDo('againPut', 'd3');
  is(call.join() === 'to:d3:PC,end:d3,ref:d4,again:d3', '만났어요 = hdbTo(PC) · 거절 = hmLateEnd · 소개 = hmReferGot · 다시 약속 저장 = hmLateAgain — 새 저장 없음');
  const JVS = sc.slice(sc.indexOf('  var JV_DONE ='), sc.indexOf('  function jvHtml() {')) + sc.slice(sc.indexOf('  var JVG = ['), sc.indexOf('  function isCall('));
  is(JVS.length > 1500 && !/setItem|\.rpc\(|\.from\(|fetch\(/.test(JVS), '이 덩어리는 서버 · 이 기기 담기를 직접 안 함(있던 함수만)');

  console.log('\n[32] 📍 💬 📅 👤 오늘 칸 그림 · 카톡 전체 보기 · 말풍선 · 일정 넣기 · 실명 (판 X579)');
  is(/var mp = D\.kind === 'appt' \? T\(function \(\) \{ return mapSvg\(D\.A, D\.near\); \}, ''\)/.test(sc) && /return '<div class="rtw">' \+ btn \+ '<div class="rtmap" role="button" onclick="HOME_V2\.route\(\)">' \+ mp/.test(sc) && /if \(!mp\) return btn;/.test(sc),
    '동선 — 시트의 그 그림(mapSvg)을 오늘 칸에 바로 · 좌표 모르면 예전 한 줄 · 누르면 시트');
  is(/\(longMsg\(t\) \? '<button type="button" class="more" onclick="HOME_V2\.msgAll\(this\)">전체 보기 ▾<\/button>'/.test(sc) && /\.qmsg\.open \.tx\{display:block;-webkit-line-clamp:unset/.test(sc) && /function longMsg\(t\) \{ t = String\(t \|\| ''\); return t\.split\('\\n'\)\.length > 5 \|\| t\.length > 120; \}/.test(sc),
    '카톡 글 — 다섯 줄을 넘으면 「전체 보기 ▾」 · 누르면 다 펴짐(줄 높이도 다시)');
  is(/'\.hv2 \.jvb-b\{position:relative;flex:0 1 auto;min-width:0;max-width:300px;/.test(sc) && /pointer-events:none\}',\r?\n      '\.hv2 \.jvb>\*\{pointer-events:auto\}'/.test(sc) &&
     /var JVB_SEC = \[\['mis', '\.hv2 \.mis'\], \['card', '#hv2Rail'\], \['route', '\.hv2 \.rtc'\], \['jv', '\.hv2 \.jv'\]\];/.test(sc) && /prefLoad\(\);\r?\n      jvbWatch\(\);/.test(sc),
    '말풍선 — 글만큼(최대 300px) · 빈 자리는 누름 안 막음 · 내리면 보는 칸(미션 · 카드 · 동선 · 챙기는 중)에 맞춰 말이 바뀜');
  {
    const Y = box({ apex_home_v2: '1' }, '', {});
    const put = [];
    Object.assign(Y.g, { meV2Open: () => {}, mcalToday: () => '2026-11-26', mcalCusList: () => [{ id: 'c1', name_masked: '홍*동' }], mcalName: c => '홍길동', cregOpen: () => {},
      MCAL: {}, mcalMyPut: () => put.push(['my', Y.els.mcalMyT.value]), mcalCusPut: () => put.push(['cus', Y.els.mcalCusHow.value]) });
    Y.g.HOME_V2.apply(dyn(Y));
    Y.g.HOME_V2.sched({ cid: 'c1' }); let q = (Y.els.hv2Sheet || {}).innerHTML || '';
    const W6 = ['업무 전화', '상담', '계약', '청구', '소개요청', '증권전달'];
    is(W6.every(w => q.indexOf(">" ) >= 0 && new RegExp("schedSet\\('what','" + w + "'\\)").test(q)) && /class="on" onclick="HOME_V2\.schedSet\('what','업무 전화'\)"/.test(q) && /id="mcalCusHow" type="hidden" value="업무 전화"/.test(q) && !/<select id="mcalCusHow"/.test(q),
      '고객 일정 무엇 — 여섯 갈래 단추(업무 전화 · 상담 · 계약 · 청구 · 소개요청 · 증권전달) · 처음은 업무 전화');
    is(/onclick="HOME_V2\.close\(\);cregOpen\(\)">➕ 명단에 없으면 — 새 고객 추가/.test(q) && /<option value="c1" selected>홍길동<\/option>/.test(q), '누구 — 실명(mcalName) · 바로 밑 「➕ 새 고객 추가」 = 있던 cregOpen');
  }
  is(/if \(SCH\.what\) \{ t = t \? SCH\.what \+ ' · ' \+ t : SCH\.what; if \(el\('mcalMyT'\)\) el\('mcalMyT'\)\.value = t; \}/.test(sc), '내 일정 — 고른 갈래가 제목 앞에(「상담 · 한 줄」) · 저장은 그대로 mcalMyPut');
  is(/var mine = g\.cmReal\(\), got = kv\.real/.test(PREF_BLK) && /g\.cmLSSet\('apex_cli_real_' \+ g\.cmWho\(\), mg\)/.test(PREF_BLK) && /PREF\.more\.real = mg;/.test(PREF_BLK),
    '실명 — 계정 실명표를 이 기기 표(cmReal)와 합침(이 기기 것이 이김) · 합친 것을 내 설정 한 줄 real 에');
}

console.log('\n[19] 📰 오늘 소식 · 🙋 물어볼 것 · 🧭 상황 시트 (판 X529 · 시안 qCard qnews · qask · openInsK)');
{
  const IXs = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const need = ['ccNewsIdx', 'ccNews', 'cqaAsk', 'cqaAnsHtml', 'hmOpen'].filter(n => !new RegExp('function ' + n + '\\(').test(IXs));
  is(!need.length && /var NLIVE\s*=/.test(IXs), '부르는 라이브 함수가 있다 — 이분 소식(ccNewsIdx · ccNews) · 한 가지만 여쭙니다(cqaAsk · cqaAnsHtml)' + (need.length ? ' — 없음: ' + need.join(', ') : ''));
  const rows = [
    { k: 'touch', id: 'c1', t: '홍길동', s: '30일째', key: 'touch:c1:' },
    { k: 'next', id: 'c2', t: '홍길순', s: '할 일', key: 'next:c2:' },
    { k: 'db', tk: 'AP', id: 'd1', t: '홍갑돌', s: '만남', key: 'db:d1:AP' }
  ];
  const X = box({ apex_home_v2: '1' }, '', { rows });
  const said = [];
  Object.assign(X.g, {
    NLIVE: { items: [{ t: '실손 청구, 사진 한 장으로 바뀐다' }] }, ccNewsIdx: id => (id === 'c1' || id === 'd1' ? 0 : -1),
    cqaAsk: id => (id === 'c2' || id === 'd1' ? { k: 'bd', q: { ask: '<b>생일</b>이 언제세요?', why: '생일 축하' } } : null),
    cqaAnsHtml: (id, a) => '<div class="t-chips"><button type="button" class="t-chip" onclick="cqaFld(\'cmBd\',\'' + id + '\')">여기에 적기 →</button></div>',
    HM_DOOR: { pick: x => (x.k === 'db' || x.id === 'c2' ? { cat: 'hospital', by: 'db' } : { cat: '', by: 'none' }), prods: c => [{ co: '보험사', nm: '병원비 상품' }] },
    HM_DOOR_TOP: { month: '2026-11', cats: { hospital: [{ co: 'A생명', nm: '병원비 상품' }, { co: 'B손보', nm: '비급여 상품' }] }, top: { co: '보험사', nm: '1위 상품' } },
    MK_TALK: { CATS: { hospital: { label: '병원비·비급여', hook: '요즘 병원비 청구 많이 하세요?' } } },
    hmDoorGo: (k, b) => said.push(['door', k]), setTimeout: f => { said.push(['later']); return 0; }
  });
  X.g.HOME_V2.apply(dyn(X));
  const h = X.els.hv2.innerHTML;
  const card = i => { const a = h.indexOf('data-i="' + i + '"'); const b = h.indexOf('data-i="' + (i + 1) + '"'); return h.slice(a, b > 0 ? b : h.indexOf('class="dots"', a) > 0 ? h.indexOf('class="dots"', a) : undefined); };
  const c0 = card(0), c1 = card(1), c2 = card(2);
  is(/class="qnews" onclick="ccNews\('c1'\)"><b>📰 오늘 소식<\/b><span>실손 청구, 사진 한 장으로 바뀐다<\/span><i>복사<\/i>/.test(c0), '고객 카드 — 오늘 소식(이분께 맞는 기사 · 누르면 있던 ccNews 로 복사)');
  is(!/qnews/.test(c1), '맞는 기사가 없으면 줄을 안 세움(지어내지 않음)');
  is(/class="qask" onclick="HOME_V2\.askAfter\(\)"><div class="q">🙋 생일이 언제세요\?<\/div><div class="t-chips">/.test(c1) && /cqaFld\('cmBd','c2'\)/.test(c1), '물어볼 것 — 한 가지만 여쭙니다(cqaAsk)의 그 물음 · 답 단추는 cqaAnsHtml 그대로(태그는 걷음)');
  is(!/qask|qnews/.test(c2), '배정 DB 카드엔 안 섬(고객 365일 고객만 — 관심 · 아는 것을 모름)');
  is(!/qask/.test(c0), '여쭐 것이 없으면 안 섬');
  X.g.HOME_V2.askAfter(); is(said.some(x => x[0] === 'later'), '답 단추를 누른 뒤 — 잠깐 뒤 이 화면만 다시 그림');
  const ins = h.slice(h.indexOf('class="insc"'), h.indexOf('</div></div>', h.indexOf('class="insc"')));
  is(/onclick="HOME_V2\.insK\('hospital'\)"><b>병원비·비급여<\/b>/.test(ins) && !/hmDoorGo\('hospital'/.test(ins) && /onclick="hmDoorGo\('',''\)">상품전략기 열기 ›/.test(ins),
    '오늘 「상품전략」 칸 — 상황을 누르면 앱 안 상황 시트 먼저(HOME_V2.insK) · 「상품전략기 열기 ›」 는 그대로');
  X.g.HOME_V2.insK('hospital'); const t = (X.els.hv2Sheet || {}).innerHTML || '';
  const ORD = ['이번 달 상품전략', '🧭 병원비·비급여', '「요즘 병원비 청구 많이 하세요?」', '1. A생명 · 병원비 상품<br>2. B손보 · 비급여 상품', '상품전략기와 같은 순위', '이 이야기로 연락할 오늘 볼 분 <small>2명', '상품전략기 「🎣 문 열기」 로 이어 보기'];
  const at = ORD.map(k => t.indexOf(k));
  is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '상황 시트 — 구실 → 이번 달 상품 순위 → 이 이야기로 연락할 오늘 볼 분 → 상품전략기 (시안 openInsK 차례)' + (at.some(x => x < 0) ? ' — 없음: ' + ORD.filter((k, i) => at[i] < 0).join(' | ') : ''));
  is(/hmOpen\('next:c2:'\)/.test(t) && /hmOpen\('db:d1:AP'\)/.test(t) && !/touch:c1:/.test(t) && /class="pcard"><button type="button" class="mini"/.test(t), '오늘 볼 분 — 그 상황인 분만(doorOf · 위 상품전략 시트와 같은 자) · 누르면 이분 한 장');
  X.g.HOME_V2.insK('nope');
  is(said.some(x => x[0] === 'door' && x[1] === 'nope'), '상품이 없는 상황이면 예전처럼 상품전략기로');
  const ws = sc.slice(sc.indexOf('  function newsHtml('), sc.indexOf('  function isBoss(')) + sc.slice(sc.indexOf('  function toolsOf('), sc.indexOf('  function railHtml('));   /* 판 X558 — 그 사이 📍 지금 상황 · ⚙ 추천 고치기는 있던 cmSave · osCfgSet 을 부름([27] 이 봄) */
  is(!/setItem|cmSave|\.rpc\(|\.from\(|nlLoad|hmIgSet/.test(ws), '두 줄은 읽기만 — 저장 · 뉴스 받아 오기를 새로 안 부름(답은 cqa 단추가 있던 자리로)');
}

console.log('\n[20] 🤖 AI 7개 → 자비스 하나로 (판 X530 · 시안 openJarvis · 사장님 말씀 「AI 7개 → 자비스 하나로」)');
{
  const AI = [['apexmap', '🤖', 'APEX 자비스 모드', true], ['assistant', '🤖', '오늘의 AI 비서'], ['voiceasst', '🎙️', '음성 비서'], ['brain', '🧠', '윤시현의 두뇌', true],
    ['cs_assist', '💬', 'AI 상담 어시스턴트'], ['ins_asst', '🩺', '보험 비서'], ['helpme', '🧭', '무엇을 할지 모르겠다면', true]];
  const it = a => ({ id: a[0], icon: a[1], title: a[2], hide: !!a[3] });
  const TABS = [{ group: '하루 시작', items: [{ id: 'home', icon: '🏠', title: '오늘' }, it(AI[1]), it(AI[2]), it(AI[3])] },
    { group: '상담 도구', items: [{ id: 'insight', icon: '🧭', title: '상품전략기' }, it(AI[4]), it(AI[5])] },
    { group: '성장', items: [{ id: 'edu', icon: '🌱', title: '성장 로드맵' }, it(AI[0]), it(AI[6])] }];
  const X = box({ apex_home_v2: '1' }, '');
  const went = [];
  Object.assign(X.g, { TABS, navJvCount: () => 113, osTabAllowed: id => id !== 'ins_asst', TAB_META: { assistant: { desc: '오늘 할 일을 AI 가 정리' } }, go: id => went.push(id), meV2Open: () => {} });
  X.g.HOME_V2.apply(dyn(X));
  let h = X.els.hv2.innerHTML;
  const he = h.slice(h.indexOf('class="hello"'), h.indexOf('</div>', h.indexOf('class="hello"')));
  is(/<span class="hb"><button type="button" class="mebtn" onclick="HOME_V2\.ai\(\)" aria-label="자비스에게 묻기 · AI 도우미">🤖<\/button><button type="button" class="mebtn" onclick="meV2Open\(\)"/.test(he), '인사 줄 오른쪽 — 🤖 자비스 · 🙋 나 (시안 오른쪽 위 두 단추)');
  X.g.HOME_V2.ai(); const t = (X.els.hv2Sheet || {}).innerHTML || '';
  const ORD = ['<h1>🤖 자비스</h1>', '말로 물으면 화면을 열어 드려요', "go(\'apexmap\')\">🤖 자비스에게 묻기 · 화면 113개", '🛰 자비스가 챙기는 중 보기', '자비스로 합친 AI <small>5</small>'];
  const at = ORD.map(k => t.indexOf(k));
  is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '자비스 시트 — 묻기(APEX 자비스 모드 · 서랍 맨 위 그 길) → 챙기는 중 → 자비스로 합친 AI' + (at.some(x => x < 0) ? ' — 없음: ' + ORD.filter((k, i) => at[i] < 0).join(' | ') : ''));
  const ai = t.slice(t.indexOf('자비스로 합친 AI'));
  const ord2 = ['오늘의 AI 비서', '음성 비서', '윤시현의 두뇌', 'AI 상담 어시스턴트', '무엇을 할지 모르겠다면'].map(k => ai.indexOf(k));
  is(ord2.every(x => x >= 0) && ord2.every((x, i) => !i || x > ord2[i - 1]) && !/보험 비서/.test(ai) && /오늘 할 일을 AI 가 정리/.test(ai) && !/APEX 자비스 모드/.test(ai),
    '합친 AI — 시안 차례 · 이름 · 그림 · 설명은 메뉴 표 · 목록에서 숨긴 것(두뇌 · 길잡이)도 자비스 안엔 섬 · 막힌 것(보험 비서)은 안 섬');
  X.g.HOME_V2.mg && X.g.HOME_V2.menu(); h = X.els.hv2.innerHTML;
  const mb = h.slice(h.indexOf('class="mmb"'));
  is(/<b>🤖 자비스로 합친 AI<\/b><small>6<\/small>/.test(mb) && !/<b>하루 시작<\/b>|<b>상담 도구<\/b>|<b>성장<\/b>/.test(mb),
    '오늘 「☰ 다른 메뉴」 — 흩어져 있던 AI 를 한 갈래로(하루 시작 · 상담 도구 · 성장에서 빠짐 — 판 X531 부터는 그 묶음 자체가 시안 묶음으로 바뀜)');
  is(!/TABS\s*=|\.hide\s*=|g\.TABS\.(push|splice)/.test(sc.slice(sc.indexOf('  var AI_IDS'), sc.indexOf('  function jvSheet()'))) && /var AI_IDS = \['apexmap', 'assistant', 'voiceasst', 'brain', 'cs_assist', 'ins_asst', 'helpme'\];/.test(sc),
    '메뉴 표(TABS) · 서랍은 안 건드림 — 지우지 않고 이 화면에서 자리만 모음 · 일곱은 시안 PLACE 의 ai 그대로');
  const n0 = box({ apex_home_v2: '1' }, ''); Object.assign(n0.g, { osTabAllowed: id => id !== 'apexmap', TABS }); n0.g.HOME_V2.apply(dyn(n0));
  is(!/HOME_V2\.ai\(\)/.test(n0.els.hv2.innerHTML), '자비스 모드를 못 여는 분께는 🤖 단추가 안 섬');
}

console.log('\n[21] 🗂 다른 메뉴를 시안 묶음으로 — TA · 교육 · 고지 각 한 자리 (판 X531 · 시안 PLACE · moreMenus)');
{
  const PG = (sc.match(/var PLACE_G = \{([\s\S]*?)\n  \};/) || ['', ''])[1];
  const grp = k => ((PG.match(new RegExp('\\n    ' + k + ': \\[([^\\]]*)\\]')) || ['', ''])[1].match(/'([a-z0-9_]+)'/g) || []).map(x => x.slice(1, -1));
  is(['ta_script', 'ta_say', 'saybook', 'silson5', 'fp_talk', 'rej_gym'].every(id => grp('talk').indexOf(id) >= 0), 'TA 대본 · 전체 대본 · 문자 · 30초 첫 전화 · 화법서 · 거절 연습 = 💬 화법 한 갈래');
  is(['edu', 'manual', 'bohum', 'academy', 'ta_train', 'academy_notion'].every(id => grp('study').indexOf(id) >= 0), '성장 로드맵 · 매뉴얼 · 보험 기초 · 아카데미 · 신입 TA 연습 = 📚 공부 한 갈래');
  is(['ref_underwrite', 'med_disclosure'].every(id => grp('st_cs').indexOf(id) >= 0), '인수 가능 여부 · 알릴의무 = 영업 한 바퀴 「청약」 한 자리');
  const all = ['st_ta', 'st_ap', 'st_an', 'st_pc', 'st_cs', 'st_cm', 'prod', 'talk', 'study', 'grow', 'cust', 'find', 'money', 'team', 'me', 'ai'].map(grp);
  const flat = [].concat.apply([], all), dup = flat.filter((x, i) => flat.indexOf(x) !== i);
  is(flat.length >= 110 && !dup.length, '표 ' + flat.length + '칸 · 한 화면은 한 자리만' + (dup.length ? ' — 겹침: ' + dup.join(', ') : ''));
  const IXs = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const ta = IXs.slice(IXs.indexOf('var TABS=['), IXs.indexOf('var TABS=[') + 60000);
  const live = []; ta.replace(/\{\s*id\s*:\s*'([a-z0-9_]+)'[^}]*?title\s*:/g, (m0, id) => { if (live.indexOf(id) < 0) live.push(id); return m0; });
  const out = live.filter(id => flat.indexOf(id) < 0);
  is(live.length > 100 && out.length <= 5, '라이브 메뉴 ' + live.length + '칸 중 표에 없는 것 ' + out.length + '칸(' + out.join(', ') + ') — 그것은 예전 묶음 이름 그대로 맨 아래');

  /* 가짜 메뉴로 그려 본다 */
  const TABS = [
    { group: '하루 시작', items: [{ id: 'home', icon: '🏠', title: '오늘' }, { id: 'assistant', icon: '🤖', title: '오늘의 AI 비서' }] },
    { group: '상담 도구', items: [{ id: 'ta_script', icon: '☎️', title: 'TA 스크립트' }, { id: 'med_disclosure', icon: '🩺', title: '알릴의무' }, { id: 'insight', icon: '🧭', title: '상품전략기' }] },
    { group: '성장', items: [{ id: 'ta_train', icon: '🎓', title: '신입 TA 연습' }, { id: 'edu', icon: '🌱', title: '성장 로드맵' }, { id: 'rej_gym', icon: '🥊', title: '거절 연습' }] },
    { group: '조직 관리', items: [{ id: 'recruit', icon: '🧲', title: '채용 대기열' }, { id: 'org', icon: '🏢', title: '조직도' }] },
    { group: '시스템', items: [{ id: 'settings', icon: '⚙️', title: '설정' }, { id: 'ta_script', icon: '☎️', title: 'TA 스크립트' }] }
  ];
  const X = box({ apex_home_v2: '1' }, '');
  Object.assign(X.g, { TABS, osTabAllowed: id => id !== 'settings', meV2Open: () => {} });
  X.g.HOME_V2.apply(dyn(X)); X.g.HOME_V2.menu();
  for (let i = 0; i < 12; i++) X.g.HOME_V2.mg(i);
  const h = X.els.hv2.innerHTML, mb = h.slice(h.indexOf('class="mmb"'));
  const heads = []; mb.replace(/class="mmg[^"]*" onclick="HOME_V2\.mg\(\d+\)"><b>([^<]*)<\/b><small>(\d+)<\/small>/g, (m0, t, n) => { heads.push(t + ' ' + n); return m0; });
  is(heads.join(' | ') === '🛠 영업 한 바퀴 도구 1 | 🧭 상품전략 1 | 💬 화법 2 | 📚 공부 2 | 👥 고객 1 | 👥 팀 관리 1 | 🤖 자비스로 합친 AI 1 | 조직 관리 1',
    '시안 차례(영업 한 바퀴 → 상품전략 → 화법 → 공부 → 알리기 → 고객 → 찾아보기 → 법인 · 투자 → 팀 관리 → 나 → 자비스) · 빈 갈래는 안 섬 · 표에 없는 채용 대기열은 「조직 관리」 그대로 맨 아래 — 지금: ' + heads.join(' | '));
  is(/>📊 알릴의무<|알릴의무<\/div><div class="t2">청약<\/div>/.test(mb) && /TA 스크립트<\/div><\/div>/.test(mb) && /신입 TA 연습/.test(mb.slice(mb.indexOf('📚 공부'))),
    '고지는 「청약」 꼬리표 · TA 스크립트는 화법 · 신입 TA 연습은 공부');
  is((mb.match(/go\('ta_script'\)/g) || []).length === 1 && !/go\('settings'\)/.test(mb), '메뉴 표에 두 번 적힌 화면도 한 번만 · 막힌 화면(설정)은 안 섬');
  is(/☰ 다른 메뉴 펼쳐 보기<\/span><small>10개<\/small>/.test(h), '수 = 열 수 있는 화면 수(겹친 것 한 번)');
  is(!/TABS\s*=|\.group\s*=|g\.TABS\.(push|splice)/.test(sc.slice(sc.indexOf('  var PLACE_G'), sc.indexOf('  function menuHtml()'))), '메뉴 표(TABS) · ☰ 서랍은 안 건드림 — 이 화면 「다른 메뉴」 묶음만');
}

console.log('\n[22] 🧰 오늘 카드 「이분께 맞는 도구」 (판 X532 · 사장님 말씀 「오늘에서 고객의 상황에 맞게 어떤 도구를 추천해주는지도 띄워줘」)');
{
  const CV = fs.readFileSync(path.join(ROOT, 'app/cus-v2.js'), 'utf8');
  const rows = [
    { k: 'touch', id: 'c1', t: '홍길동', s: '30일째', key: 'touch:c1:' },
    { k: 'db', tk: 'AP', id: 'd1', t: '홍길순', s: '만남', key: 'db:d1:AP' },
    { k: 'next', id: 'c3', t: '홍갑돌', s: '할 일', key: 'next:c3:' },
    { k: 'my', my: 'm1', t: '지점 회의', s: '09:30', key: 'my:m1' }
  ];
  const X = box({ apex_home_v2: '1' }, '', { rows });
  const NAV = { wallets: ['💰', '8가지 통장 진단'], finance: ['📊', '재무설계 계산기'], fact_find: ['📝', '팩트파인딩'], fp_deck: ['📑', '상담 덱'], bojang: ['🔍', '보장분석'], med_disclosure: ['📋', '알릴의무 필터'] };
  Object.assign(X.g, {
    cmOf: id => ({ c1: { care: '결혼 준비' }, c3: {} }[id] || null), crmDbsOf: id => (id === 'c1' ? [{ stage: 'AP' }] : []),
    APEX_STAGE: { of: st => ({ know: st === 'AP' ? [{ tab: 'fact_find', g: '▶️ 처음 만나서', w: '물어볼 것' }, { tab: 'fp_deck' }, { tab: 'bojang' }] : [] }) },
    navItemOf: id => (NAV[id] ? { id, icon: NAV[id][0], title: NAV[id][1] } : null), osTabAllowed: id => id !== 'fp_deck',
    CUS: {}, OSC: {}, CM_BASE: {}
  });
  vm.runInContext(CV, X.g);
  is(typeof X.g.CUS_V2.appsBy === 'function' && /function appsFor\(c\) \{ return appsBy\(meta\(c\.id\)\.care, stageOf\(\)\); \}/.test(CV), '고르는 곳은 한 곳 — 고객 화면 권할 것(appsFor)도 오늘 카드도 CUS_V2.appsBy');
  X.g.HOME_V2.apply(dyn(X));
  const h = X.els.hv2.innerHTML;
  const card = i => { const a = h.indexOf('data-i="' + i + '"'), b = h.indexOf('data-i="' + (i + 1) + '"'); return h.slice(a, b > 0 ? b : h.length); };
  const c0 = card(0), c1 = card(1), c2 = card(2), c3 = card(3);
  is(/class="qtools"><div class="lb">🧰 이분께 맞는 도구<small>「결혼 준비」 · 첫 만남 단계<\/small>/.test(c0) && c0.indexOf('8가지 통장 진단') < c0.indexOf('재무설계 계산기') && c0.indexOf('재무설계 계산기') < c0.indexOf('팩트파인딩') && /onclick="go\('wallets'\)"/.test(c0),
    '고객 카드 — 상황(결혼 준비) 도구 먼저 → 그분 배정 줄 단계(첫 만남) 도구 · 까닭 꼬리표 · 누르면 그 화면');
  is((c0.match(/<button type="button" onclick="go\('/g) || []).length === 3 && /📋 추천 메뉴 4개 모두 보기/.test(c0) && !/상담 덱/.test(c0), '카드엔 맨 앞 셋만 바로 · 넷째부터는 「📋 추천 메뉴 n개 모두 보기」(판 X558) · 열 수 없는 화면(상담 덱)은 안 섬');
  is(/🧰 이분께 맞는 도구<small>첫 만남 단계<\/small>/.test(c1) && /팩트파인딩/.test(c1) && /보장분석/.test(c1), '배정 DB 카드 — 그 줄 단계(AP) 도구(상황은 모름)');
  is(!/qtools/.test(c2), '상황도 단계도 모르면 줄째 안 섬(지어내지 않음)');
  is(!/qtools/.test(c3), '내 일정 카드엔 안 섬');
  const ts = sc.slice(sc.indexOf('  function toolsOf('), sc.indexOf('  function askHtml('));
  is(!/setItem|cmSave|\.rpc\(|\.from\(/.test(ts), '읽기만 — 저장 없음');
}

console.log('\n[23] ➕ 자비스에 내가 고른 메뉴 더하기 (판 X549 · 사장님 말씀 「자비스로 합친 AI 에서 추천 메뉴를 내가 추가할 수 있도록」)');
{
  const TABS = [
    { group: '하루 시작', items: [{ id: 'home', icon: '🏠', title: '오늘' }, { id: 'assistant', icon: '🤖', title: '오늘의 AI 비서' }, { id: 'apexmap', icon: '🤖', title: 'APEX 자비스 모드' }] },
    { group: '상담 도구', items: [{ id: 'ta_script', icon: '☎️', title: 'TA 스크립트' }, { id: 'insight', icon: '🧭', title: '상품전략기' }, { id: 'bojang', icon: '🔍', title: '보장분석' }] },
    { group: '시스템', items: [{ id: 'settings', icon: '⚙️', title: '설정' }] }
  ];
  const X = box({ apex_home_v2: '1' }, '');
  const went = [];
  Object.assign(X.g, { TABS, navWho: () => 'u1', navJvCount: () => 0, osTabAllowed: id => id !== 'settings', TAB_META: { insight: { desc: '이번 달 무엇을 들고 갈지' } }, go: id => went.push(id), meV2Open: () => {} });
  X.g.HOME_V2.apply(dyn(X));
  X.g.HOME_V2.ai(); let t = X.els.hv2Sheet.innerHTML;
  is(/onclick="HOME_V2\.aiAdd\(\)">＋ 메뉴 더하기<\/button>/.test(t) && !/내가 더한 메뉴/.test(t), '처음엔 「＋ 메뉴 더하기」 단추만 (더한 것 없으면 묶음 안 섬)');
  X.g.HOME_V2.aiAdd(); t = X.els.hv2Sheet.innerHTML;
  is(/id="hv2AiQ"/.test(t) && /HOME_V2\.aiPut\('insight'\)/.test(t) && /HOME_V2\.aiPut\('ta_script'\)/.test(t) && !/aiPut\('assistant'\)|aiPut\('apexmap'\)/.test(t) && !/aiPut\('settings'\)/.test(t),
    '고르는 판 — 다른 메뉴 묶음 그대로 · 이미 자비스에 있는 일곱은 안 섬 · 막힌 화면(설정)은 안 섬');
  X.g.HOME_V2.aiPut('insight'); X.g.HOME_V2.aiPut('bojang'); X.g.HOME_V2.aiPut('ta_script'); X.g.HOME_V2.aiPut('ta_script');
  is(X.store.apex_ai_mine_u1 === '["insight","bojang"]', '누르면 넣고 · 다시 누르면 뺌 — 이 기기 · 사람마다(apex_ai_mine_<navWho>) — ' + X.store.apex_ai_mine_u1);
  X.els.hv2AiL = { innerHTML: '' }; X.g.HOME_V2.aiQ('보장'); const L = (X.els.hv2AiL || {}).innerHTML || '';
  is(/aiPut\('bojang'\)/.test(L) && !/aiPut\('insight'\)/.test(L) && /✓ 들어감/.test(L), '이름으로 찾기 · 넣은 것은 「✓ 들어감」');
  X.g.HOME_V2.ai(); t = X.els.hv2Sheet.innerHTML;
  const m = t.slice(t.indexOf('내가 더한 메뉴'));
  is(/내가 더한 메뉴 <small>2<\/small>/.test(t) && m.indexOf('상품전략기') < m.indexOf('보장분석') && /이번 달 무엇을 들고 갈지/.test(m) && /go\('insight'\)/.test(m) && t.indexOf('자비스로 합친 AI') < t.indexOf('내가 더한 메뉴'),
    '자비스 시트 — 합친 AI 아래 「내가 더한 메뉴」 · 고른 차례 · 설명은 메뉴 표 · 누르면 그 화면');
  X.g.HOME_V2.aiUp('bojang');
  is(X.store.apex_ai_mine_u1 === '["bojang","insight"]', '▲ 위로');
  X.g.HOME_V2.aiDel('insight');
  is(X.store.apex_ai_mine_u1 === '["bojang"]' && /내가 더한 메뉴 <small>1<\/small>/.test(X.els.hv2Sheet.innerHTML), '✕ 빼기');
  X.store.apex_ai_mine_u1 = '["settings","bojang","assistant","bojang",3]';
  X.g.HOME_V2.ai(); t = X.els.hv2Sheet.innerHTML;
  is(/내가 더한 메뉴 <small>1<\/small>/.test(t) && !/go\('settings'\)/.test(t), '막힌 화면 · 이미 있는 일곱 · 겹친 것 · 이상한 값은 안 섬');
  is(/var AI_IDS = \['apexmap', 'assistant', 'voiceasst', 'brain', 'cs_assist', 'ins_asst', 'helpme'\];/.test(sc) && !/TABS\s*=|g\.TABS\.(push|splice)|navFavToggle|\.rpc\(|\.from\(/.test(sc.slice(sc.indexOf('  var AI_KEY'), sc.indexOf('  function jvSheet()'))),
    '일곱 · 메뉴 표(TABS) · 서랍 · 즐겨찾기는 안 건드림 · 서버 안 부름');
}

console.log('\n[24] 🌱 신입 도움말 (판 X551 · 단순화 순서 ⑤ · 사장님이 고르신 「🙋 나 시트에 스위치」)');
{
  const AIM = { 미접촉: '첫 통화 — 30초 안에 약속만', TA: '만날 날짜를 잡는다' }, WAY = { 미접촉: '누구인지 먼저 밝힌다. 설명은 만나서, 전화로는 날짜만', TA: '상품 설명을 전화로 하지 않는다. 날짜 두 개를 드리고 고르시게 한다' };
  const X = box({ apex_home_v2: '1' }, '');
  Object.assign(X.g, { navWho: () => 'u1', meV2Open: () => {}, AR: { db: [{ id: 'd1', name: '홍길동', stage: '미접촉', who: 'me' }] },
    APEX_STAGE: { aimText: k => AIM[k] || '', wayText: k => WAY[k] || '', tools: () => [] } });
  X.g.HOME_V2.apply(dyn(X));
  let h = X.els.hv2.innerHTML;
  is(X.g.HOME_V2.newOn() === false && /<small>칸을 누르면 그 단계 분들<\/small>/.test(h), '기본은 꺼짐 — 영업 한 바퀴 머리 그대로');
  X.g.HOME_V2.stage(0); let t = X.els.hv2Sheet.innerHTML;
  is(!/class="nwh"/.test(t) && /첫 통화 — 30초 안에 약속만 · 모두 1명/.test(t), '꺼져 있으면 단계 시트도 예전 그대로(할 일은 머리 밑 한 줄)');
  is(X.g.HOME_V2.newHelp() === true && X.store.apex_newhelp_u1 === '1', '켜면 이 기기 · 사람마다(apex_newhelp_<navWho>)');
  h = X.els.hv2.innerHTML;
  is(/<small>🌱 칸을 누르면 할 일 · 하는 법<\/small>/.test(h), '켜면 영업 한 바퀴 머리가 「🌱 칸을 누르면 할 일 · 하는 법」');
  X.g.HOME_V2.stage(0); t = X.els.hv2Sheet.innerHTML;
  is(/class="nwh"><div><b>🌱 이 칸에서 할 일<\/b>첫 통화 — 30초 안에 약속만<\/div><div><b>어떻게<\/b>누구인지 먼저 밝힌다\. 설명은 만나서, 전화로는 날짜만<\/div><\/div>/.test(t) && /<div class="sub">모두 1명<\/div>/.test(t),
    '단계 시트 맨 위 「🌱 이 칸에서 할 일 / 어떻게」 — 글은 APEX_STAGE.aimText · wayText 그대로(할 일은 두 번 안 적음)');
  X.g.HOME_V2.stage(1); t = X.els.hv2Sheet.innerHTML;
  is(/만날 날짜를 잡는다/.test(t) && /날짜 두 개를 드리고/.test(t), '칸마다 그 단계 글(연락 = TA)');
  is(X.g.HOME_V2.newHelp() === false && !('apex_newhelp_u1' in X.store), '다시 누르면 끔(지움)');
  const nb = sc.slice(sc.indexOf('  var NEW_KEY'), sc.indexOf('  var ROAD_KEY'));
  is(nb.length > 50 && !/\.rpc\(|\.from\(|fetch\(/.test(nb) && !/첫 통화|날짜 두 개|설명은 만나서/.test(sc), '서버 안 부름 · 단계 글을 이 파일에 적지 않음(원본 한 곳)');
}

console.log('\n[25] 🤝 만났어요 (판 X555 · 시안 jMeet · 3차 점검표 ⑩ · 사장님 말씀 「10번 해」)');
{
  const mk = (appts, db, can) => {
    const rows = [{ k: 'appt', t: '홍길동', s: '14:00 · 순천', key: 'appt:a1' }, { k: 'db', tk: 'AP', id: 'd9', t: '홍길순', s: '만남', key: 'db:d9:AP' }];
    const X = box({ apex_home_v2: '1' }, '', { rows });
    const said = [];
    Object.assign(X.g, { meV2Open: () => {}, hmRtAppts: () => appts, hdbRow: id => db.filter(r => r.id === id)[0] || null, hdbCan: () => can !== false,
      hdbTo: (id, to) => said.push(['to', id, to]), hmQfin: k => said.push(['fin', k]), copyText: t => said.push(['copy', t]) });
    X.g.HOME_V2.apply(dyn(X));
    return { X, said };
  };
  const one = [{ id: 'd1', nm: '홍길동', hm: '14:00' }];
  let A = mk(one, [{ id: 'd1', stage: 'AP' }]);
  let h = A.X.els.hv2.innerHTML;
  const c0 = h.slice(h.indexOf('data-i="0"'), h.indexOf('data-i="1"')), c1 = h.slice(h.indexOf('data-i="1"'));
  is(/onclick="HOME_V2\.met\('appt:a1'\)">🤝 만났어요<\/button>/.test(c0) && !/만났어요/.test(c1), '오늘 약속 카드에만 「🤝 만났어요」 (배정 DB 카드엔 안 섬)');
  is(!/만났어요/.test(mk([{ id: 'd1', nm: '홍길동', hm: '14:00' }, { id: 'd2', nm: '홍길동', hm: '14:00' }], [{ id: 'd1', stage: 'AP' }, { id: 'd2', stage: 'AP' }]).X.els.hv2.innerHTML) &&
     !/만났어요/.test(mk([{ id: 'd1', nm: '홍길동', hm: '15:00' }], [{ id: 'd1', stage: 'AP' }]).X.els.hv2.innerHTML) &&
     !/만났어요/.test(mk([], []).X.els.hv2.innerHTML), '이름 + 시각이 딱 한 분일 때만 — 같은 이름 둘 · 시각 다름 · 없음이면 안 섬(엉뚱한 분을 안 넘김)');
  A.X.g.HOME_V2.met('appt:a1'); let t = A.X.els.hv2Sheet.innerHTML;
  is(/<h1>🤝 만났어요<\/h1>/.test(t) && /AP → PC\(제안\)/.test(t) && /\(thanks·kakao\)/.test(t) && /metGo\('appt:a1',1\)">PC로 넘기고 감사 카톡 복사/.test(t) && /metGo\('appt:a1',0\)">단계는 그대로/.test(t),
    '시트 — 단계 AP → PC(제안) · 감사 카톡(TA 스크립트 thanks) · 넘기기 / 그대로 두 단추');
  A.X.g.HOME_V2.metGo('appt:a1', 1);
  is(JSON.stringify(A.said) === JSON.stringify([['copy', '고객님, 안녕하세요 (thanks·kakao)'], ['to', 'd1', 'PC'], ['fin', 'appt:a1']]), '넘기기 = 감사 카톡 복사 → 있던 hdbTo(id, \'PC\') → 이분 끝(hmQfin) — ' + JSON.stringify(A.said));
  A = mk(one, [{ id: 'd1', stage: 'TA' }]); A.X.g.HOME_V2.metGo('appt:a1', 0);
  is(!A.said.some(x => x[0] === 'to') && A.said.some(x => x[0] === 'fin'), '「단계는 그대로」 면 단계를 안 건드림');
  A = mk(one, [{ id: 'd1', stage: 'PC' }]); A.X.g.HOME_V2.met('appt:a1'); t = A.X.els.hv2Sheet.innerHTML; A.X.g.HOME_V2.metGo('appt:a1', 1);
  is(/이미 「PC」 단계라/.test(t) && !/PC로 넘기고/.test(t) && !A.said.some(x => x[0] === 'to'), '이미 제안(PC) 뒤면 단계는 그대로 · 감사 카톡만');
  A = mk(one, [{ id: 'd1', stage: 'AP' }], false); A.X.g.HOME_V2.met('appt:a1'); t = A.X.els.hv2Sheet.innerHTML; A.X.g.HOME_V2.metGo('appt:a1', 1);
  is(/내 고객이 아니라/.test(t) && !A.said.some(x => x[0] === 'to'), '남의 고객이면 단계 단추를 안 냄(hdbCan)');
  const ms = sc.slice(sc.indexOf('  function metRow('), sc.indexOf('  function cardHtml('));
  is(ms.length > 100 && (ms.match(/g\.hdbTo\(/g) || []).length === 1 && !/\.rpc\(|\.from\(|setItem|fetch\(/.test(ms), '저장은 있던 hdbTo 한 곳 — 서버 · 이 기기에 새로 쓰지 않음');
}

console.log('\n[26] 🎯 오늘의 미션 (판 X557 · 사장님 말씀 「오늘 해야 될 미션을 딱 보여주고 그 미션을 해결해나가는게 오늘이야」 → 「제안대로 세워」)');
{
  const CKI = [['d4', '전화 10통 (하루 목표)', '안 받아도 카톡으로 이어갑니다', 'DB 통합 CRM', 'crm'], ['d5', '카톡 10건 (하루 목표)', '통화 여부와 상관없이', '', ''],
    ['d6', '통화 결과 입력', 'TA완료·부재·거절·상담', 'DB 통합 CRM', 'crm'], ['d8', '만난 사람 팩트파인딩 저장', '소득·지출', '상담카드', 'fact_find'],
    ['d9', '내일 상담 자료 준비', '증권 받았으면 판독까지', 'AI 제안서', 'ai_prop'], ['d10', 'SNS 1건', '주 4회', '', '']];
  const mk = (ck, rows, doneKeys) => {
    const X = box({ apex_home_v2: '1' }, '', rows ? { rows } : {});
    const said = [];
    Object.assign(X.g, { meV2Open: () => {}, CK_ITEMS: { day: CKI }, hmMsCk: () => ck, hmIsDone: k => (doneKeys || []).indexOf(k) >= 0, hmQdone: () => false,
      hmMsDid: c => { said.push(['did', c]); ck[c] = 1; }, hmMsUndo: c => { said.push(['undo', c]); delete ck[c]; } });
    X.g.HOME_V2.apply(dyn(X));
    return { X, said, ck };
  };
  let A = mk({}), h = A.X.els.hv2.innerHTML;
  const mi = h.indexOf('class="mis"'), he = h.indexOf('class="hello"'), mo = h.indexOf('class="steps5"');
  is(mi > he && mi < mo, '인사 바로 밑 · 다섯 걸음 위에 한 판');
  const heads = []; h.replace(/class="mis-r[^"]*" onclick="HOME_V2\.mis\((\d)\)"><span class="mis-c">[^<]*<\/span><span class="mis-t"><b>([^<]*)<\/b>/g, (m0, i, t) => { heads.push(i + t); return m0; });
  is(heads.join('|') === '0전화 · 카톡|1오늘 약속|2통화 결과 · 만난 분 기록|3내일 상담 자료 준비|4SNS 올리기' && /<b>🎯 오늘의 미션<\/b><span>1 \/ 5<\/span>/.test(h),
    '다섯 차례 — 전화 · 카톡 → 오늘 약속 → 기록 → 내일 준비 → SNS (약속 없는 날은 약속 미션이 끝난 셈이라 1/5) — ' + heads.join('|'));
  is(/<small>전화 10통 \(하루 목표\) · 카톡 10건 \(하루 목표\)<\/small>/.test(h) && /<small>오늘 약속 없음<\/small>/.test(h), '칸 이름은 체크판 표(CK_ITEMS.day) 그대로 · 약속 없으면 「오늘 약속 없음」');
  A = mk({ d4: 1, d5: 1, d9: 1 }); h = A.X.els.hv2.innerHTML;
  is(/<span>3 \/ 5<\/span>/.test(h) && /class="mis-r done" onclick="HOME_V2\.mis\(0\)"><span class="mis-c">✓/.test(h) && /class="mis-r" onclick="HOME_V2\.mis\(2\)"/.test(h), '끝났나 = 실행 체크판(hmMsCk) 그대로 — 둘 다 해야 끝(d6 만 하면 기록 미션은 아직)');
  A = mk({ d4: 1, d5: 1, d6: 1, d8: 1, d9: 1, d10: 1 }); h = A.X.els.hv2.innerHTML;
  is(/class="mis all"/.test(h) && /오늘 미션 완료 🎉/.test(h), '다섯 다 끝 → 「오늘 미션 완료 🎉」');
  const ap = [{ k: 'appt', t: '홍길동', s: '14:00', key: 'appt:a1' }, { k: 'appt', t: '홍갑돌', s: '16:00', key: 'appt:a2' }, { k: 'db', tk: 'TA', id: 'd9', t: '홍길순', s: '', key: 'db:d9:TA' }];
  A = mk({}, ap, ['appt:a1']); h = A.X.els.hv2.innerHTML;
  is(/<small>1 \/ 2곳 · 만나면 「🤝 만났어요」<\/small>/.test(h) && /class="mis-r" onclick="HOME_V2\.mis\(1\)"/.test(h), '약속 미션 = 오늘 약속 카드 그대로(끝낸 카드 hmIsDone · hmQdone) — 1 / 2곳');
  A = mk({}, ap, ['appt:a1', 'appt:a2']); h = A.X.els.hv2.innerHTML;
  is(/class="mis-r done" onclick="HOME_V2\.mis\(1\)"/.test(h), '약속 카드를 다 챙기면 약속 미션도 끝');
  A = mk({ d6: 1 }); A.X.g.HOME_V2.mis(2); let t = A.X.els.hv2Sheet.innerHTML;
  is(/<h1>✍️ 통화 결과 · 만난 분 기록<\/h1>/.test(t) && /misUndo\(2,'d6'\)">되돌리기/.test(t) && /misDid\(2,'d8'\)">✓ 했어요/.test(t) && /go\('fact_find'\)">상담카드 ›/.test(t), '미션 시트 — 칸마다 ✓ 했어요 / 되돌리기 · 체크판의 가는 곳 그대로');
  A.X.g.HOME_V2.misDid(2, 'd8'); A.X.g.HOME_V2.misUndo(2, 'd6');
  is(JSON.stringify(A.said) === '[["did","d8"],["undo","d6"]]', '✓ 했어요 = 있던 hmMsDid · 되돌리기 = hmMsUndo (실행 체크판에 그대로)');
  const ms = sc.slice(sc.indexOf('  var MIS = ['), sc.indexOf('  var WAY = ['));
  is(ms.length > 200 && !/setItem|\.rpc\(|\.from\(|fetch\(|ckToggle/.test(ms) && !/전화 10통|카톡 10건|팩트파인딩 저장/.test(ms), '새 저장 없음 · 체크판 칸 이름을 이 파일에 다시 적지 않음');
}

console.log('\n[27] 📍 지금 상황 · ⚙ 상황별 추천 메뉴 (판 X558 · 사장님 말씀 「고객의 현재 상황이 안보이고 상황에 추천하는 메뉴 두개 정도 있는데 내가 추가할수 있도록 해줘 다른 사람은 손 못대게」)');
{
  const CV = fs.readFileSync(path.join(ROOT, 'app/cus-v2.js'), 'utf8');
  const NAV = { wallets: ['💰', '8가지 통장 진단'], finance: ['📊', '재무설계 계산기'], fact_find: ['📝', '팩트파인딩'], bojang: ['🔍', '보장분석'], insight: ['🧭', '상품전략기'] };
  const rows = [{ k: 'touch', id: 'c1', t: '홍길동', s: '30일째', key: 'touch:c1:' }, { k: 'touch', id: 'c2', t: '홍갑돌', s: '안부', key: 'touch:c2:' }, { k: 'db', tk: 'TA', id: 'd9', t: '홍길순', s: '', key: 'db:d9:TA' }];
  const mk = boss => {
    const X = box({ apex_home_v2: '1' }, '', { rows });
    const said = [], cfg = {}, CM = { c1: { care: '결혼 준비' }, c2: {} };
    Object.assign(X.g, {
      meV2Open: () => {}, CM_CARE: ['', '결혼 준비', '출산 · 육아', '은퇴 준비'], cmOf: id => CM[id] || {}, crmDbsOf: () => [],
      cmSave: (id, p, cb) => { said.push(['cmSave', id, JSON.stringify(p)]); Object.assign(CM[id], p); if (cb) cb(); },
      osIsAppAdmin: () => !!boss, osCfgGet: (k, d) => (cfg[k] == null || cfg[k] === '' ? d : cfg[k]), osCfgSet: (k, v, cb) => { said.push(['cfg', k, v]); cfg[k] = v; if (cb) cb(); },
      APEX_STAGE: { of: () => ({ know: [] }) }, navItemOf: id => (NAV[id] ? { id, icon: NAV[id][0], title: NAV[id][1] } : null),
      TABS: [{ group: '상담 도구', items: Object.keys(NAV).map(id => ({ id, icon: NAV[id][0], title: NAV[id][1] })) }], CUS: {}, OSC: {}, CM_BASE: {}
    });
    vm.runInContext(CV, X.g);
    X.g.HOME_V2.apply(dyn(X));
    return { X, said, cfg, CM };
  };
  let A = mk(false), h = A.X.els.hv2.innerHTML;
  const card = (hh, i) => { const a = hh.indexOf('data-i="' + i + '"'), b = hh.indexOf('data-i="' + (i + 1) + '"'); return hh.slice(a, b > 0 ? b : hh.length); };
  is(/class="qsit"><span class="k">📍 지금 상황<\/span><b>결혼 준비<\/b><button type="button" onclick="HOME_V2\.sit\('touch:c1:'\)">바꾸기/.test(card(h, 0)) &&
     /<span class="no">몰라요<\/span><button type="button" onclick="HOME_V2\.sit\('touch:c2:'\)">고르기/.test(card(h, 1)) && !/qsit/.test(card(h, 2)), '카드에 📍 지금 상황 — 아는 분은 상황 · 모르는 분은 「몰라요 · 고르기」 · 배정 DB 카드엔 안 섬(상황 칸 없음)');
  A.X.g.HOME_V2.sit('touch:c2:'); let t = A.X.els.hv2Sheet.innerHTML;
  is(/sitPut\('touch:c2:',0\)">결혼 준비/.test(t) && /sitPut\('touch:c2:',-1\)">없음 · 모름/.test(t), '고르기 시트 — 고객 화면과 같은 목록(CM_CARE)');
  A.X.g.HOME_V2.sitPut('touch:c2:', 2);
  is(JSON.stringify(A.said[0]) === '["cmSave","c2","{\\"care\\":\\"은퇴 준비\\"}"]', '고르면 있던 cmSave(id, {care}) 하나 — ' + JSON.stringify(A.said[0]));
  is(!/추천 고치기/.test(h), '대표 · 관리자가 아니면 「⚙ 추천 고치기」 단추가 없음');
  A.X.g.HOME_V2.careEdit('결혼 준비'); A.X.g.HOME_V2.carePut('bojang');
  is(!A.said.some(x => x[0] === 'cfg'), '대표 · 관리자가 아니면 불러도 저장 안 함(서버 app_config 도 is_owner · is_admin 만 받음)');
  A = mk(true); h = A.X.els.hv2.innerHTML;
  is(/onclick="HOME_V2\.careEdit\('결혼 준비'\)">⚙ 추천 고치기/.test(card(h, 0)), '대표 · 관리자에겐 도구 줄에 「⚙ 추천 고치기」 (그 카드 상황으로 열림)');
  A.X.g.HOME_V2.careEdit('결혼 준비'); t = A.X.els.hv2Sheet.innerHTML;
  is(/⭐<\/span><div class="tx"><div class="t1">💰 8가지 통장 진단<\/div><div class="t2">기본 · 오늘 카드에 바로/.test(t) && /⭐<\/span><div class="tx"><div class="t1">📊 재무설계 계산기/.test(t) && /carePut\('bojang'\)/.test(t) && !/carePut\('wallets'\)/.test(t) && !/careDel\(0\)/.test(t),
    '편집 시트 — 기본(CARE_APP)도 차례 안에(⭐ 위 셋 · 기본은 ✕ 없음) · 더할 메뉴는 「다른 메뉴」 묶음에서(기본은 안 섬)');
  A.X.g.HOME_V2.carePut('bojang'); A.X.g.HOME_V2.carePut('insight');
  is(A.cfg.care_apps === '{"결혼 준비":["wallets","finance","bojang","insight"]}', '더하기 = 있던 osCfgSet(\'care_apps\', 차례 전체) — ' + A.cfg.care_apps);
  let ap = A.X.g.CUS_V2.appsBy('결혼 준비', '', true).map(a => a.tab).join(',');
  is(ap === 'wallets,finance,bojang,insight', '한 곳(CUS_V2.appsBy) → 오늘 카드 · 고객 화면 「권할 것」 같이 — ' + ap);
  A.X.g.HOME_V2.paint(); h = A.X.els.hv2.innerHTML;
  is((card(h, 0).match(/<button type="button" onclick="go\('/g) || []).length === 3 && /go\('bojang'\)/.test(card(h, 0)) && !/go\('insight'\)/.test(card(h, 0)) && /onclick="HOME_V2\.tools\('touch:c1:'\)">📋 추천 메뉴 4개 모두 보기/.test(card(h, 0)),
    '「맨위에 세개 … 클릭 안하고」 — 카드엔 앞 셋만 바로 · 넷째(상품전략기)는 「모두 보기」 안');
  A.X.g.HOME_V2.tools('touch:c1:'); t = A.X.els.hv2Sheet.innerHTML;
  is((t.match(/class="li" onclick="HOME_V2\.close\(\);go\('/g) || []).length === 4 && /go\('insight'\)/.test(t) && /⚙ 추천 차례 · 메뉴 고치기/.test(t), '「모두 보기」 시트 — 넷 다 · 대표에겐 고치기 단추');
  A.X.g.HOME_V2.careUp(3);
  ap = A.X.g.CUS_V2.appsBy('결혼 준비', '', true).map(a => a.tab).join(',');
  is(A.cfg.care_apps === '{"결혼 준비":["wallets","finance","insight","bojang"]}' && ap === 'wallets,finance,insight,bojang', '▲ 로 차례를 바꾸면 카드 앞 셋도 바뀜 — ' + ap);
  A.X.g.HOME_V2.careDel(0); A.X.g.HOME_V2.careDel(3);
  is(A.cfg.care_apps === '{"결혼 준비":["wallets","finance","insight"]}', '✕ 빼기 — 더한 것만 빠지고 기본(🔒)은 안 빠짐 — ' + A.cfg.care_apps);
  const cs = sc.slice(sc.indexOf('  function isBoss('), sc.indexOf('  function toolsOf('));
  is(cs.length > 200 && !/setItem|\.rpc\(|\.from\(|fetch\(/.test(cs) && /g\.osCfgSet\(/.test(cs) && /g\.cmSave\(/.test(cs) && /CARE_KEY = 'care_apps'/.test(CV) && /careMine\(care\)\.forEach\(add\)/.test(CV),
    '저장은 있던 두 문(cmSave · osCfgSet)뿐 · 새 서버 · 이 기기 저장 없음');
}

console.log('\n[28] 💬 자비스 말풍선 (판 X564 · 사장님 말씀 「추천 메뉴와 자비스는 어디있어 자비스가 알아서 말풍선을 띄워서 추천할수 있게 해줘」)');
{
  const CV = fs.readFileSync(path.join(ROOT, 'app/cus-v2.js'), 'utf8');
  const NAV = { wallets: ['💰', '8가지 통장 진단'], finance: ['📊', '재무설계 계산기'] };
  const CKI = [['d4', '전화 10통', '', '', ''], ['d5', '카톡 10건', '', '', ''], ['d6', '통화 결과 입력', '', '', ''], ['d8', '팩트파인딩', '', '', ''], ['d9', '내일 준비', '', '', ''], ['d10', 'SNS 1건', '', '', '']];
  const mk = (rows, ck) => {
    const X = box({ apex_home_v2: '1' }, '', { rows });
    Object.assign(X.g, { meV2Open: () => {}, CM_CARE: ['', '결혼 준비'], cmOf: id => (id === 'c1' ? { care: '결혼 준비' } : {}), crmDbsOf: () => [],
      APEX_STAGE: { of: () => ({ know: [] }) }, navItemOf: id => (NAV[id] ? { id, icon: NAV[id][0], title: NAV[id][1] } : null),
      CK_ITEMS: { day: CKI }, hmMsCk: () => ck || {}, hmIsDone: () => false, hmQdone: () => false, osCfgGet: (k, d) => d, CUS: {}, OSC: {}, CM_BASE: {} });
    vm.runInContext(CV, X.g);
    X.g.HOME_V2.apply(dyn(X));
    return X;
  };
  let X = mk([{ k: 'touch', id: 'c1', t: '홍길동', s: '30일째', key: 'touch:c1:' }]), h = X.els.hv2.innerHTML;
  const jb = h.slice(h.indexOf('id="hv2Jvb"'));
  is(h.indexOf('class="dock"') < h.indexOf('id="hv2Jvb"') && /onclick="HOME_V2\.ai\(\)" aria-label="자비스">🤖/.test(jb), '아래 세 칸 다음에 말풍선 · 🤖 누르면 자비스 시트');
  is(/홍길동님 · 「결혼 준비」 — 「💰 8가지 통장 진단」 부터 열어 볼까요\?/.test(jb) && /class="jvb-go" onclick="go\('wallets'\)">열기 ›/.test(jb), '지금 카드의 맨 앞 추천 도구(카드 🧰 와 같은 toolsOf) — 「열기」 = 그 화면');
  X = mk([{ k: 'touch', id: 'c9', t: '홍갑돌', s: '안부', key: 'touch:c9:' }], { d4: 1, d5: 1 }); h = X.els.hv2.innerHTML;
  is(/오늘 미션 2 \/ 5 — 다음은 「통화 결과 · 만난 분 기록」 예요/.test(h) && /onclick="HOME_V2\.mis\(2\)">보기 ›/.test(h), '추천 도구가 없으면 안 끝낸 첫 미션(약속 없는 날은 약속 미션이 끝난 셈) — 「보기」 = 그 미션 시트');
  X = mk([], { d4: 1, d5: 1, d6: 1, d8: 1, d9: 1, d10: 1 }); h = X.els.hv2.innerHTML;
  is(/오늘 미션 완료 🎉/.test(h) && !/jvb-go/.test(h), '다 끝나면 「오늘 미션 완료 🎉」 (단추 없음)');
  X.g.HOME_V2.jvbOff(); X.g.HOME_V2.paint();
  is(!/hv2Jvb/.test(X.els.hv2.innerHTML), '✕ 로 닫으면 다시 그려도 안 뜸');
  is(/'\.hv2 \.jvb\{position:fixed;left:12px;right:70px;/.test(sc), '오른쪽 70px 비움 — 🎙 · ? 단추 안 가림(아래 세 칸과 같은 폭)');
  const jv = sc.slice(sc.indexOf('  var JVB = {'), sc.indexOf('  function dockHtml('));
  is(jv.length > 200 && !/setItem|\.rpc\(|\.from\(|fetch\(/.test(jv), '저장 · 서버 없음 — 고르는 자는 있던 toolsOf · misState');
}

console.log('\n[29] 🧭 카드 맨 아래 「권할 것」 (판 X568 · 3차 점검표 ⑪ · 시안 qCard 「권할 것」 · 사장님 말씀 「그 다음거 진행해」)');
{
  const rows = [{ k: 'touch', id: 'c1', t: '홍길동', s: '30일째', key: 'touch:c1:' }, { k: 'db', tk: 'TA', id: 'd9', t: '홍길순', s: '', key: 'db:d9:TA' }];
  const X = box({ apex_home_v2: '1' }, '', { rows });
  const said = [];
  Object.assign(X.g, { meV2Open: () => {}, OSC: { current: null },
    cusGo: o => { said.push(['cusGo', JSON.stringify(o)]); X.g.OSC.current = { id: o.cli }; },
    cusV2Rec: () => said.push(['rec', X.g.OSC.current && X.g.OSC.current.id]), hmOpen: k => said.push(['open', k]) });
  X.g.HOME_V2.apply(dyn(X));
  const h = X.els.hv2.innerHTML;
  const card = i => { const a = h.indexOf('data-i="' + i + '"'), b = h.indexOf('data-i="' + (i + 1) + '"'); return h.slice(a, b > 0 ? b : h.length); };
  is(/class="rc" onclick="HOME_V2\.rec\('touch:c1:'\)">🧭 권할 것</.test(card(0)) && !/이분 자세히<\/button>/.test(card(0)), '고객 카드 맨 아래 = 「🧭 권할 것」 (시안 qins 오른쪽 칸)');
  is(/class="rc" onclick="hmOpen\('db:d9:TA'\)">이분 자세히</.test(card(1)), '배정 DB 카드는 고객 창이 없어 예전처럼 「이분 자세히」');
  is(/<span class="nm" role="button" onclick="hmOpen\('touch:c1:'\)">홍길동님<\/span>/.test(card(0)), '이름을 누르면 「이분 자세히」(시안처럼 이름에 밑줄)');
  X.g.setTimeout = fn => fn();
  X.g.HOME_V2.rec('touch:c1:');
  is(JSON.stringify(said) === '[["cusGo","{\\"cli\\":\\"c1\\"}"],["rec","c1"]]', '누르면 있던 고객 창 하나(cusGo) → 그 분이 열리면 권할 것 시트(cusV2Rec) — ' + JSON.stringify(said));
  said.length = 0; X.g.HOME_V2.rec('db:d9:TA');
  is(JSON.stringify(said) === '[["open","db:d9:TA"]]', '배정 DB 줄이면 이분 자세히로');
  const rs = sc.slice(sc.indexOf('  function recGo('), sc.indexOf('  function recGo(') + 900);
  is(/g\.cusGo\(\{ cli: id \}\)/.test(rs) && /g\.cusV2Rec\(\)/.test(rs) && !/setItem|\.rpc\(|\.from\(|cmSave/.test(rs) && /\+\+n < 20/.test(rs), '있던 두 함수만 · 저장 없음 · 기다림은 3초까지');
}

console.log('\n[30] ☁️ 내 설정을 계정에 (판 X572 · 사장님 말씀 「기기마다 따로가 아니도록 해줘야지」)');
{
  const calls = (PREF_BLK.match(/\.from\('[^']+'\)\.[a-z]+\(/g) || []);
  is(PREF_BLK.length > 300 && calls.join(' | ') === ".from('user_prefs').upsert( | .from('user_prefs').select(" && /\.eq\('owner_id', me\)/.test(PREF_BLK) && /owner_id: me/.test(PREF_BLK) && !/\.(insert|delete|rpc)\(|fetch\(/.test(PREF_BLK),
    '덩어리 안 서버 부름은 user_prefs 읽기(내 줄) · 담기(내 줄) 둘뿐 — ' + calls.join(' | '));
  const MS = fs.readFileSync(path.join(ROOT, 'migration_85_user_prefs.sql'), 'utf8');
  is(/enable row level security/.test(MS) && (MS.match(/owner_id = auth\.uid\(\)/g) || []).length >= 4 && /revoke all on public\.user_prefs from anon, authenticated/.test(MS) && !/grant[^;]*delete/.test(MS) && !/schema_version/.test(MS.replace(/\/\*[\s\S]*?\*\//g, '')),
    'migration_85 — 내 줄만 읽고 쓰기(RLS 4자리 auth.uid()) · anon 막음 · delete 안 줌 · schema_version 안 건드림');
  const mk = (srv, fail) => {
    const X = box({ apex_home_v2: '1', apex_ai_mine_u1: '["bojang"]' }, '');
    const said = [];
    const tbl = { select: () => ({ eq: (k, v) => ({ maybeSingle: () => ({ then: ok => ok(fail ? { error: { message: 'relation does not exist' } } : { data: srv ? { kv: srv } : null }) }) }) }),
                  upsert: (row, o) => { said.push(['up', JSON.stringify(row.kv), row.owner_id, o && o.onConflict]); return { then: () => {} }; } };
    Object.assign(X.g, { meV2Open: () => {}, navWho: () => 'u1', arMyId: () => 'me1',
      osClient: () => ({ from: t => (t === 'user_prefs' ? tbl : { select: () => ({ in: () => ({ then: ok => ok({ data: [] }) }) }) }) }),
      TABS: [{ group: '상담 도구', items: [{ id: 'bojang', icon: '🔍', title: '보장분석' }, { id: 'insight', icon: '🧭', title: '상품전략기' }] }] });
    X.g.HOME_V2.apply(dyn(X));
    return { X, said };
  };
  let A = mk({ ai_mine: ['insight'], newhelp: 1 });
  is(A.X.store.apex_ai_mine_u1 === '["insight"]' && A.X.store.apex_newhelp_u1 === '1' && !A.said.length, '서버에 내 줄이 있으면 그것을 이 기기에 내려받음(폰에서 바꾼 것이 PC 에 뜸) — 올리지는 않음');
  A = mk(null);
  is(A.said.length === 1 && A.said[0][1] === '{"ai_mine":["bojang"],"newhelp":0}' && A.said[0][2] === 'me1' && A.said[0][3] === 'owner_id', '처음(내 줄 없음)이면 이 기기 것을 올림 — 내 줄(owner_id)에만');
  A.X.g.HOME_V2.newHelp();
  is(A.said.length === 2 && A.said[1][1] === '{"ai_mine":["bojang"],"newhelp":1}', '바꾸면 바로 올림(신입 도움말 켜기)');
  A = mk(null, true); A.X.g.HOME_V2.newHelp();
  is(!A.said.length && A.X.store.apex_newhelp_u1 === '1', '표가 아직 없으면(서버 오류) 조용히 이 기기에만 — 화면은 그대로');
  is(/  function apply\(dyn\) \{[\s\S]{0,1000}prefLoad\(\);/.test(sc) && !/apex_home_v2/.test(PREF_BLK) && !/KEY\b/.test(PREF_BLK.replace(/aiKey|newKey|CARE_KEY/g, '')), '새 화면을 켤 때 한 번 읽음 · 「↩ 예전 화면」(apex_home_v2)은 기기마다 그대로');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 오늘 화면은 옛 홈을 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
