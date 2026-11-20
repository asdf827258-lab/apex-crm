/* ═══════════════════════════════════════════════════════════════
   check-homev2.js — ✨ <b>새 「오늘」 화면(시안 9차 디자인)이 옛 홈을 안 깨나</b> (판 X502)

   사장님 말씀 (2026-11-20) — 「새 홈을 만들어서 … 부작용이나 파일이 깨지는 경우를
   예측하고 시행해줘 그리고, 언제든 빽업할수 있도록 준비해줘」 ·
   「가장 중요한건 목각 그대로 따라가서, 목각 디자인에서, 맞는 기능들을 채우는게 먼저」.

   ⚠ 이 자는 <b>안전망</b>입니다 — 「시안과 같은가」 는 이 자가 아니라 시안 사진과
     새 화면 사진을 나란히 놓고 봅니다(PR 쪽지). 여기서는 깨짐만 봅니다.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 기본은 <b>꺼짐</b> — 켠 기기(localStorage)에서만, 끄면 apply·paint 가 아무것도 안 한다
     [2] ★★ 모두에게 끄는 한 줄(ALLOWED=false)이 있고, 그러면 단추도 새 화면도 안 선다
     [3] ★★ 옛 홈(index.html)은 <b>네 자리만</b> — 싣기 · 홈 그린 뒤 apply · hmPaint 안 paint · 인사 단추, 모두 try 안
     [4] ★★ 시안 칸 차례가 시안 rHome 그대로(인사 → 목표 → 다섯 걸음 → 챙기는 중 → 지금 이분 → 상품전략 → 이번 주 → 영업 한 바퀴 → 돌아보기 → 메뉴)
     [5] ★★ 칸 속을 채우는 라이브 함수가 <b>정말 있다</b> — 이름이 어긋나면 빈 칸
     [6] ★  서버를 직접 안 부르고(fetch·supabase 없음, 목표는 기존 pfLoad 만) 저장은 켜짐 표시 하나뿐
     [7] ★  옛 홈은 지우지 않고 숨기기만(CSS) — 「예전 오늘 칸 펼치기」 가 있다 · 그리다 터지면 예전 화면
     [8] ★  옷은 .hv2 / #hv2Sheet 아래로만 — 앱의 .card · .btn 같은 옷을 덮지 않는다
     [9] ★  가짜 데이터로 실제로 그려 본다 — 이름 가리기 · 첫 전화 카드 · 카톡 카드 · 빈 날
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
    localStorage: ls, location: { search: search || '' }, document: doc, toast: () => {}, go: () => {}, setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {},
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
    arStageN: () => ({ c: { 미접촉: 3, TA: 1 }, tot: 4 }), hmNightSub: () => '오늘 닿은 분 0명',
    TABS: [{ group: '고객', items: [{ id: 'clients', icon: '📇', title: '고객 365일' }] }], osTabAllowed: () => true,
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

console.log('\n[1] 기본은 꺼짐');
let B = box({}, '');
is(B.g.HOME_V2.on() === false, '처음 기기에서는 꺼져 있다');
is(B.g.HOME_V2.apply(dyn(B)) === false && !B.pane.classList.has('hm-v2') && !B.els.hv2, '꺼져 있으면 apply 가 아무것도 안 한다(옛 홈 그대로)');
B.g.HOME_V2.paint();
is(!B.els.hv2, '꺼져 있으면 hmPaint 가 불러도 새 화면이 안 생긴다');
is(/새 화면/.test(B.g.HOME_V2.chip()) && B.g.HOME_V2.chip().indexOf('onclick="homeV2Use(true)"') >= 0 && typeof B.g.homeV2Use === 'function', '꺼져 있을 때 인사 줄 단추는 「✨ 새 화면」');
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
 'arStageN', 'hmNightSub', 'hmNightHtml', 'pexSum', 'pfLoad', 'arGoCat', 'hmWayNow', 'hmWayCall', 'hmWayMeet', 'hmWayTidy', 'hmWayRec', 'hmWayCare', 'copyText', 'cregOpen']
  .forEach(f => { if (sc.indexOf(f) >= 0) is(new RegExp('function ' + f + '\\(|g\\.' + f + ' = function').test(ALL), f + ' — 앱에 있다'); });
is(/var TABS=\[/.test(IX) && /var PF=/.test(IX), 'TABS(메뉴 표) · PF(목표) 가 앱에 있다');
is(/openTa\s*:|openTa:/.test(JS) && /prods\s*[,:}]/.test(JS) && /pick\s*[,:}]/.test(JS), 'HM_TAMSG.openTa · HM_DOOR.pick/prods 가 있다');

console.log('\n[6] 서버 · 저장');
is(!/fetch\(|osClient|supabase|\.from\(/.test(sc), '서버를 직접 부르지 않는다(목표는 기존 pfLoad 만)');
is((sc.match(/setItem\(/g) || []).length === 1 && /setItem\(KEY, '1'\)/.test(sc), '저장은 이 기기 켜짐 표시(KEY) 하나뿐');

console.log('\n[7] 옛 홈은 숨기기만 · 터지면 예전 화면');
is(/hm-v2:not\(\.hm-v2-old\)>\*:not\(#hv2\)\{display:none!important\}/.test(sc), '옛 칸은 CSS 로 숨기기만(지우지 않음)');
is(/예전 오늘 칸/.test(sc) && /old: function/.test(sc), '「예전 오늘 칸 아래에 펼치기」 가 있다');
is(/function fallback\(\)[\s\S]{0,200}classList\.remove\('hm-v2', 'hm-v2-old'\)/.test(sc) && /catch \(e\) \{ fallback\(e\)/.test(sc), '그리다 터지면 새 화면을 떼고 예전 화면으로');
B = box({ apex_home_v2: '1' }, '', { job: false });
is(B.g.HOME_V2.apply(dyn(B)) === false, '「지금 할 것」 카드가 없는 판에서는 새 화면을 안 쓴다');
B = box({}, '?go=home&home=v2');
is(B.g.HOME_V2.apply(dyn(B)) === true && B.store.apex_home_v2 === '1', '?home=v2 로 켠다');
B = box({ apex_home_v2: '1' }, '?home=old');
is(B.g.HOME_V2.apply(dyn(B)) === false && !('apex_home_v2' in B.store), '?home=old 로 끈다');

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
is(/class="dock"/.test(h) && /go\('insight'\)/.test(h) && /go\('mikki_talk'\)/.test(h) && /go\('edu'\)/.test(h), '아래 떠 있는 세 칸 — 상품전략기 · 화법(미끼상품&접촉전략) · 공부(성장 로드맵)');
B = box({ apex_home_v2: '1' }, '', { promo: true });
B.g.HOME_V2.apply(dyn(B));
is(/class="pr done"/.test(B.els.hv2.innerHTML) && /1\/1/.test(B.els.hv2.innerHTML), 'SNS 캐러셀 미션(d10)을 했으면 알리기 1/1');
B = box({ apex_home_v2: '1' }, '', { lead: true });
B.g.HOME_V2.apply(dyn(B));
h = B.els.hv2.innerHTML;
is((h.match(/class="ring"/g) || []).length === 4 && /who-strip/.test(h) && /hwhoSet\('p2'\)/.test(h) && /hwhoSet\('\*'\)/.test(h), '팀장 — 팀원 동그라미 한 줄(나 · 팀원 둘 · 팀 전체), 누르면 hwhoSet');

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 오늘 화면은 옛 홈을 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
