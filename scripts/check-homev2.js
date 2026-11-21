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
const JS = ['app/hm-door.js', 'app/hm-tamsg.js', 'ta-open.js', 'ta-msg.js']
  .map(p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } }).join('\n');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const sc = 걷기(SRC);

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
is((ixc.match(/HOME_V2/g) || []).length <= 8, 'index.html 안 HOME_V2 는 그 네 자리뿐 — ' + (ixc.match(/HOME_V2/g) || []).length + '번');

console.log('\n[4] 칸 차례 = 시안 rHome');
const H = (sc.match(/function html\(\) \{[\s\S]*?\n  \}/) || [''])[0];
const ord = ['topHtml', 'whoHtml', 'helloHtml', 'monHtml', 'stepsHtml', 'jvHtml', 'railHtml', 'inscHtml', 'weekHtml', 'roadHtml', 'eveHtml', 'menuHtml'];
const pos = ord.map(n => H.indexOf(n + '('));
is(pos.every(p => p > 0) && pos.every((p, i) => !i || p > pos[i - 1]), '인사 → 목표 → 다섯 걸음 → 챙기는 중 → 지금 이분 → 상품전략 → 이번 주 → 영업 한 바퀴 → 돌아보기 → 메뉴');

console.log('\n[5] 칸 속을 채우는 라이브 함수가 있다');
const ALL = IX + '\n' + JS;
['hmLeft', 'hmSteps', 'hmWhy', 'hmFullNm', 'hmNmHidden', 'hmNmToggle', 'hwhoFor', 'hwhoBarHtml', 'hmTelOf', 'hmSrcOf', 'hmOrdOf', 'hmStepOf',
 'hmQfin', 'hmSkip', 'hmOpen', 'hmDoorGo', 'hmRtOpen', 'hmRtNear', 'hmRtPerson', 'arApptPast', 'hmReferRows', 'mstDueList', 'mcalItems', 'mcalDay',
 'arStageN', 'hmNightSub', 'hmNightHtml', 'pexSum', 'pfLoad', 'pfSave', 'pfYm', 'pfYmLabel', 'pfIsLead', 'arGoCat', 'hmWayNow', 'hmWayCall', 'hmWayMeet', 'hmWayTidy', 'hmWayRec', 'hmWayCare', 'copyText', 'cregOpen', 'mcalMyPut', 'mcalCusPut', 'mcalCusList', 'mcalName', 'mcalOutName', 'icsBuild', 'mcalToday']
  .forEach(f => { if (sc.indexOf(f) >= 0) is(new RegExp('function ' + f + '\\(|g\\.' + f + ' = function').test(ALL), f + ' — 앱에 있다'); });
is(/var TABS=\[/.test(IX) && /var PF=/.test(IX), 'TABS(메뉴 표) · PF(목표) 가 앱에 있다');
is(/openTa\s*:|openTa:/.test(JS) && /prods\s*[,:}]/.test(JS) && /pick\s*[,:}]/.test(JS), 'HM_TAMSG.openTa · HM_DOOR.pick/prods 가 있다');

console.log('\n[6] 서버 · 저장');
/* 판 X505 — 서버는 <b>읽기 둘</b>만: 오늘 약속인 분의 좌표(dbs · 지역 동선이 적어 둔 칸)와 지역 동선이 쓰는 길찾기(route-km).
   쓰기(insert·update·upsert·delete·rpc)는 하나도 없습니다. 목표는 기존 pfLoad. */
const 부름 = (sc.match(/\.from\('[^']+'\)\.[a-z]+\([^)]*\)/g) || []);
is(부름.length === 1 && 부름[0] === ".from('dbs').select('id,lat,lng,next_appt_lat,next_appt_lng,next_appt_place')", '서버 표는 좌표 읽기 하나뿐 — ' + 부름.join(' | '));
is(!/\.(insert|update|upsert|delete|rpc)\(/.test(sc) && !/supabase\./.test(sc), '서버에 쓰는 것이 하나도 없다');
is((sc.match(/fetch\('([^']+)'/g) || []).join() === "fetch('/.netlify/functions/route-km'", '부르는 주소는 지역 동선의 길찾기(route-km) 하나뿐');
const 담기 = (sc.match(/setItem\(([^,]+),/g) || []).map(x => x.replace(/setItem\(|,/g, ''));
is(담기.length === 2 && 담기.indexOf('KEY') >= 0 && 담기.indexOf("'apexRouteKmV1'") >= 0, '이 기기에 담는 것은 켜짐 표시와 길찾기 거리(지역 동선과 같은 칸)뿐 — ' + 담기.join(', '));

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
  is(!/\.(insert|update|upsert|delete|rpc)\(/.test(sc) && (sc.match(/pfSave\(/g) || []).length === 1, '목표 저장은 있던 pfSave 한 곳 · 서버에 직접 쓰는 것 없음');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 오늘 화면은 옛 홈을 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
