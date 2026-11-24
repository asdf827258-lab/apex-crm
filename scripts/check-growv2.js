/* ═══════════════════════════════════════════════════════════════
   check-growv2.js — 📣 <b>새 알리기 · 👥 팀 한눈에 · 🙋 나(시안 9차)가 예전 화면을 안 깨나</b> (판 X528)

   사장님 말씀 (2026-11-23) 「6번 해」 — 시안 9차 점검표 고칠 차례 ⑥ 알리기 탭 · 팀 탭(지점장) · 나.

   ⚠ 이 자는 <b>안전망</b>입니다 — 「시안과 같은가」 는 시안 사진과 새 화면 사진을 나란히 놓고 봅니다(PR 쪽지).

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 알리기 — 기본은 새 화면 · 「↩ 예전 화면」 고른 기기(old) · 자동 점검(webdriver)만 예전 콘텐츠 판 · ALLOWED=false 로 모두 끔
     [2] ★★ index.html 은 정해진 자리만 — 싣기 두 줄 · 콘텐츠 칸을 그리는 줄(빈 글이면 예전 · renderContentHub 는 그대로) · 예전 판 맨 위 「✨ 새 알리기」 · gbCalc 가 남기는 두 칸
     [3] ★★ 아래 탭 띠(TB)는 그대로 — 다섯 칸 · 「콘텐츠」 이름 그대로 (사장님 말씀 「그대로 둬」)
     [4] ★★ 알리기 차례 — 알리기 → 이번 주 다섯 칸 → 오늘 올릴 것 → 만들기 → 광고 · 심의 먼저 / 「올렸어요」 = 아침 미션 ⑤(d10) 같은 칸
     [5] ★★ 팀 한눈에 — 지점장만 · 목표 · 실적 = monthly_perf · 예상 = APEX_PEX · 오늘 전화 · 알리기 · 활동 0 · 못 읽으면 「…」(0 이라 안 씀)
     [6] ★  나 — 시안 openMe 차례 · 막힌 칸은 안 섬 · 새 오늘 화면 인사 줄 🙋
     [7] ★★ 서버에 쓰지 않음 · 새 읽기도 없음(있던 arLoad · gbLoad · pfLoad 만) · 옷은 .gr2 · .tm2 아래 · 13px 밑 글씨 없음
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const GR = fs.readFileSync(path.join(ROOT, 'app/grow-v2.js'), 'utf8');
const TM = fs.readFileSync(path.join(ROOT, 'app/team-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAMES = { biz_news: ['📰', '정책·상품 뉴스'], news_live: ['🌐', '고객에게 전할 뉴스'], insta: ['📸', '인스타그램'], blog: ['📝', '블로그'], threads: ['🧵', '스레드 연속글'],
  video: ['🎬', '유튜브&릴스'], calendar: ['🗓️', '콘텐츠 캘린더'], simui: ['🛡️', '외부글 심의필터'], mkt_meta: ['📣', '메타 광고 가이드'], ext_naver: ['📈', '네이버 광고 대량등록기'],
  me: ['🙋', '나 — 알람 · 내 숫자'], notice: ['📢', '공지사항'], settings: ['⚙️', '설정'], pricing: ['💳', '요금제·구독'], terms: ['📜', '약관·개인정보'], ready: ['🚦', '출발 점검'],
  phone_app: ['📲', '내 폰에 설치'], voice: ['💬', '건의함 · 불편한 점'] };

function base(store, opt) {
  opt = opt || {};
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const els = {}, said = [];
  const doc = { head: { appendChild: e => { els[e.id] = e; } }, documentElement: {}, createElement: () => ({ id: '', textContent: '' }), getElementById: id => els[id] || null };
  const blocked = opt.blocked || [];
  const g = {
    said, localStorage: ls, navigator: { webdriver: !!opt.robot }, document: doc, toast: t => said.push(['toast', t]), osEsc: esc,
    go: t => said.push(['go', t]), setTimeout: () => 0,
    navItemOf: id => (NAMES[id] && blocked.indexOf(id) < 0) ? { id } : null, osTabAllowed: id => blocked.indexOf(id) < 0,
    ctName: id => (NAMES[id] || ['', id])[1], ctIcon: id => (NAMES[id] || [''])[0], ctDesc: id => id === 'biz_news' ? '오늘 고를 기사' : '',
    ckDayK: () => '2026-11-25', hmMsCk: () => (opt.ck || {}), hmMsDid: ck => said.push(['did', ck]), hmMsUndo: ck => said.push(['undo', ck])
  };
  g.window = g;
  return { g, els, said, store };
}
function grow(store, opt) {
  const B = base(store, opt); vm.createContext(B.g);
  let src = GR; if (opt && opt.allowed === false) src = src.replace('var ALLOWED = true;', 'var ALLOWED = false;');
  vm.runInContext(src, B.g); return B;
}

console.log('\n[1] 알리기 — 기본은 새 화면 · 예전 판은 고른 기기만');
is(/<h1>알리기<\/h1>/.test(grow({}).g.growV2Html()), '고른 적 없는 기기 = 새 알리기');
is(grow({ apex_grow_v2: 'old' }).g.growV2Html() === '' && /growV2Use\(true\)">✨ 새 알리기/.test(grow({ apex_grow_v2: 'old' }).g.growV2Back()), '「↩ 예전 화면」 고른 기기 = 빈 글(→ 예전 콘텐츠 판) · 맨 위 「✨ 새 알리기」');
is(grow({}, { robot: true }).g.growV2Html() === '' && grow({}, { robot: true }).g.growV2Back() === '', '자동 점검 브라우저 = 예전 판 · 단추도 안 섬(옛 콘텐츠 판 점검이 그대로)');
is(/var ALLOWED = true;/.test(GR) && grow({ apex_grow_v2: '1' }, { allowed: false }).g.growV2Html() === '' && grow({ apex_grow_v2: 'old' }, { allowed: false }).g.growV2Back() === '', 'ALLOWED=false 한 줄이면 새 화면도 단추도 안 선다');
{
  const B = grow({}); B.g.growV2Use(false);
  is(B.store.apex_grow_v2 === 'old' && B.said.some(x => x[0] === 'go' && x[1] === 'content'), '「↩ 예전 화면」 → 이 기기에 old · 콘텐츠 칸 다시');
  B.g.growV2Use(true); is(B.store.apex_grow_v2 === '1', '「✨ 새 알리기」 → 1');
}

console.log('\n[2] index.html 은 정해진 자리만');
is((IX.match(/<script src="grow-v2\.js"><\/script>/g) || []).length === 1 && (IX.match(/<script src="team-v2\.js"><\/script>/g) || []).length === 1 &&
   IX.indexOf('<script src="team-v2.js">') > IX.indexOf('<script src="home-v2.js">'), 'grow-v2.js · team-v2.js 를 한 번씩, home-v2.js 뒤에 싣는다');
const RC = IX.slice(IX.indexOf("  else if(tab==='content')"), IX.indexOf("  else if(tab==='content')") + 300);
is(/else if\(tab==='content'\)\{ var v2g=''; try\{ if\(typeof growV2Html==='function'\)v2g=growV2Html\(\); \}catch\(eV2g\)\{\}/.test(RC) &&
   /dyn\.innerHTML=v2g\|\|\(\(\(typeof growV2Back==='function'\)\?growV2Back\(\):''\)\+renderContentHub\(\)\); \}/.test(RC) &&
   /function renderContentHub\(\)\{ return renderHubBoard\('content'\); \}/.test(IX),
  '콘텐츠 칸을 그리는 줄에서 새 알리기(빈 글이면 예전 판 + 맨 위 「✨ 새 알리기」) — typeof · try 안 · renderContentHub 는 한 글자도 안 바뀜(분류판 한 벌 · check-conthub [8])');
is((IX.match(/growV2/g) || []).length === 4 && (IX.match(/teamV2|meV2/g) || []).length === 0, 'index.html 에 growV2 이름은 네 번뿐(그리는 줄에만) · teamV2 · meV2 는 index.html 에 없음(새 오늘 화면에서만 엶)');
const GC = IX.slice(IX.indexOf('function gbCalc('), IX.indexOf('function gbScore('));
is(/GB\.callDay=\{\};calls\.forEach\(function\(c\)\{var k=c\.created_by,d=gbD\(c\.call_at\);if\(!k\)return;var o=\(GB\.callDay\[k\]=GB\.callDay\[k\]\|\|\{\}\);o\[d\]=\(o\[d\]\|\|0\)\+1;\}\);/.test(GC) &&
   /GB\.ckIt=\{\};/.test(GC) && /\(GB\.ckIt\[row\.member_id\]=GB\.ckIt\[row\.member_id\]\|\|\{\}\)\[row\.check_date\]=row\.items\|\|\{\};/.test(GC) &&
   /calls\.forEach\(function\(c\)\{bump\(c\.created_by,'call',c\.call_at\);\}\);/.test(GC) && /GB\.ckDay\[row\.member_id\]=GB\.ckDay\[row\.member_id\]\|\|\{\}\)\[row\.check_date\]=n;/.test(GC),
  '성장판 셈(gbCalc) — 예전 줄은 그대로, 그날 전화 수(GB.callDay) · 그날 체크 칸(GB.ckIt)을 남기는 두 자리만 더함');
{
  /* gbCalc 를 실제로 돌려 본다 — 점수는 예전과 같고 두 칸이 찬다 */
  const fnSrc = GC.replace(/\r/g, '');
  const ctx = { GB: { teamOf: {}, pass: {} }, CK_ITEMS: { day: [['d1'], ['d10']] }, gbD: s => String(s || '').slice(0, 10), gbScore: r => { r.total = r.raw.call; } };
  vm.createContext(ctx);
  vm.runInContext(fnSrc + '\nthis.__L=gbCalc([{id:"a",name:"홍길동"},{id:"b",name:"홍길순"}],[],[{created_by:"a",call_at:"2026-11-25T01:00:00Z"},{created_by:"a",call_at:"2026-11-25T03:00:00Z"},{created_by:"b",call_at:"2026-11-24T03:00:00Z"}],[],[],[{scope:"day",member_id:"b",check_date:"2026-11-25",items:{d10:1}}]);', ctx);
  is(ctx.GB.callDay.a['2026-11-25'] === 2 && ctx.GB.callDay.b['2026-11-24'] === 1 && ctx.GB.ckIt.b['2026-11-25'].d10 === 1 && ctx.__L[0].raw.call === 2 && ctx.GB.ckDay.b['2026-11-25'] === 1,
    '돌려 보니 — 그날 전화 a 2통 · b 1통 · b 의 그날 d10 · 30일 전화 수(raw.call) · 체크 수(ckDay)는 예전 그대로');
}

console.log('\n[3] 아래 탭 띠는 그대로');
const TBs = IX.slice(IX.indexOf('var TB=['), IX.indexOf('function tbOnOf('));
is((TBs.match(/\{id:'/g) || []).length === 5 && /\{id:'content',e:'✍️',t:'콘텐츠',w:\['grow'\],pin:\['content'\]\}/.test(TBs) && !/team|grow-v2|알리기/.test(TBs),
  '다섯 칸(오늘 · 고객 · 도구 · 콘텐츠 · 달력) · 「콘텐츠」 이름 그대로 — 「팀」 칸을 안 더함');

console.log('\n[4] 알리기 — 시안 rGrow 차례');
{
  let B = grow({ 'apex_ck_day_2026-11-24': '{"d10":1}', 'apex_ck_day_2026-11-21': '{"d10":1}' }), h = B.g.growV2Html();
  const ORD = ['<h1>알리기</h1>', '이번 주 나를 알린 날', 'class="wk"', '오늘 올릴 것', '<h2>만들기</h2>', '<h2>광고 <small>심의 먼저</small></h2>'];
  const at = ORD.map(k => h.indexOf(k));
  is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '알리기 → 이번 주 → 다섯 칸 → 오늘 올릴 것 → 만들기 → 광고 · 심의 먼저' + (at.some(x => x < 0) ? ' — 없음: ' + ORD.filter((k, i) => at[i] < 0).join(', ') : ''));
  const wk = h.slice(h.indexOf('class="wk"'), h.indexOf('오늘 올릴 것'));
  is((wk.match(/<span>[월화수목금]<\/span>/g) || []).length === 5 && /<div class="on"><b>✓<\/b><span>화<\/span>/.test(wk) && /<div class=" td"><b><\/b><span>수<\/span>/.test(wk) && /<span>1 \/ 5일<\/span>/.test(h),
    '월~금 다섯 칸 — 화요일(체크판이 남긴 그날 d10) ✓ · 오늘(수) 테두리 · 지난주 금요일은 안 셈 · 1 / 5일');
  is(/오늘의 뉴스로 카드 한 장 만들기/.test(h) && /growV2Go\('biz_news'\)">🖼 카드 만들기/.test(h) && /growV2Done\(\)">✓ 올렸어요/.test(h), '아직이면 — 카드 만들기(아침 미션 ⑤ 가 가리키는 정책·상품 뉴스) · ✓ 올렸어요');
  B.g.growV2Done(); is(B.said.some(x => x[0] === 'did' && x[1] === 'd10'), '✓ 올렸어요 = hmMsDid(\'d10\') — 아침 미션 ⑤ · 새 오늘 화면 📣 걸음과 같은 칸');
  B = grow({}, { ck: { d10: 1 } }); h = B.g.growV2Html();
  is(/오늘은 올렸어요 👏/.test(h) && /growV2Undo\(\)">되돌리기/.test(h) && !/✓ 올렸어요/.test(h) && /<div class="on td"><b>✓<\/b><span>수/.test(h), '올렸으면 — 👏 · 되돌리기 · 오늘 칸 ✓');
  B.g.growV2Undo(); is(B.said.some(x => x[0] === 'undo' && x[1] === 'd10'), '되돌리기 = hmMsUndo(\'d10\')');
  const mk = h.slice(h.indexOf('<h2>만들기</h2>'), h.indexOf('<h2>광고'));
  is(/정책·상품 뉴스/.test(mk) && /오늘 고를 기사/.test(mk) && /인스타그램/.test(mk) && /콘텐츠 캘린더/.test(mk) && /growV2Go\('blog'\)/.test(mk) && !/메타 광고/.test(mk), '만들기 — 이름 · 아이콘 · 설명은 메뉴 표(ctName · ctIcon · ctDesc)에서');
  is(/외부글 심의필터/.test(h.slice(h.indexOf('<h2>광고'))) && h.indexOf('외부글 심의필터') < h.indexOf('메타 광고 가이드'), '광고 — 심의필터가 맨 앞');
  h = grow({}, { blocked: ['mkt_meta', 'ext_naver', 'simui'] }).g.growV2Html();
  is(!/메타 광고 가이드|네이버 광고|외부글 심의필터/.test(h) && !/<h2>광고/.test(h), '등급에 막힌 화면은 안 섬 — 다 막히면 그 묶음 제목도 안 섬');
  is(!/병원비 청구|예시 기사/.test(GR), '시안의 예시 문구를 옮기지 않음');
}

console.log('\n[5] 팀 한눈에 (지점장)');
function team(opt) {
  opt = opt || {};
  const B = base({}, opt), g = B.g;
  const sheet = { html: '', on: false, scrollTop: 0, classList: { contains: () => sheet.on }, querySelector: () => sheet.box };
  Object.assign(g, {
    HOME_V2: { sheet: h => { sheet.on = true; sheet.box = { innerHTML: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }; sheet.box.innerHTML = h.replace(/^<div class="tm2">|<\/div>$/g, ''); }, close: () => { sheet.on = false; }, goal: () => g.said.push(['goal']) },
    hwhoCan: () => opt.lead !== false, arMyId: () => 'me', hwhoRoster: () => ({ ids: ['me', 'a', 'b', 'c'] }),
    hwhoList: () => [{ id: 'me', n: 3 }, { id: 'a', n: 5 }, { id: 'b', n: 0 }, { id: 'c', n: null }],
    hwhoName: id => ({ a: '홍길동', b: '홍길순', c: '홍갑돌' }[id] || '팀원'), arTeamOf: id => ({ me: 't1', a: 't1', b: 't2', c: 't2' }[id]), arTeamName: t => ({ t1: '1팀', t2: '2팀' }[t]),
    gbDay: () => '2026-11-25', mstToday: () => '2026-11-25',
    GB: opt.gb === false ? { loaded: false, busy: true } : { loaded: true, busy: false, rows: [{ id: 'me', last: '2026-11-25' }, { id: 'a', last: '2026-11-25' }, { id: 'b', last: '2026-11-20' }, { id: 'c', last: '2026-11-24' }],
      callDay: { a: { '2026-11-25': 4 }, me: { '2026-11-24': 9 } }, ckIt: { a: { '2026-11-25': { d10: 1 } }, b: { '2026-11-24': { d10: 1 } } } },
    PF: opt.pf === false ? { loaded: false } : { loaded: true, rows: [{ owner_id: 'me', goal_prem: 150, act_prem: 42 }, { owner_id: 'a', goal_prem: 200, act_prem: 128 }, { owner_id: 'c', goal_prem: 100, act_prem: 12 }] },
    AR: { loaded: true, db: [{ who: 'a', stage: 'AP', expect: 300000 }, { who: 'me', stage: 'PC', expect: 900000 }] },
    APEX_PEX: { sum: L => ({ live: { won: L.reduce((s, r) => s + r.expect, 0) } }) },
    hwhoSet: id => g.said.push(['hwhoSet', id]), arGoCat: c => g.said.push(['cat', c]),
    arLoad: () => g.said.push(['arLoad']), gbLoad: () => g.said.push(['gbLoad']), pfLoad: () => g.said.push(['pfLoad'])
  });
  g.getElementById = null;
  g.document.getElementById = id => id === 'hv2Sheet' ? sheet : null;
  vm.createContext(g); vm.runInContext(TM, g);
  return { g, said: B.said, sheet };
}
{
  let B = team(); B.g.teamV2Open(); let h = B.sheet.box.innerHTML;
  const ORD = ['<h1>우리 팀 한눈에</h1>', 'class="tgrid"', 'class="chips"', 'class="seg"', 'class="tmr"', '예전 팀 화면'];
  const at = ORD.map(k => h.indexOf(k));
  is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '우리 팀 한눈에 → 요약 네 칸 → 팀 칩 → 정렬 → 팀원 줄 → 예전 팀 화면' + (at.some(x => x < 0) ? ' — 없음: ' + ORD.filter((k, i) => at[i] < 0).join(', ') : ''));
  is(B.sheet.box.attrs['data-tv'] === '1' && /11월 · 4명/.test(h), '새 오늘 화면의 그 시트(HOME_V2.sheet) · 명단은 hwhoRoster(오늘 동그라미 줄과 같은 명단)');
  is(/<b>40%<\/b><span>목표 있는 3명 기준 · 팀 실적 182만 · 예상 120만<\/span>/.test(h), '첫 칸 — 목표 있는 분 실적 182 / 목표 450 = 40% · 실적 · 예상(APEX_PEX 원 → 만원)');
  is(/<b class="neg">1명<\/b><span>목표 없음/.test(h) && /<b class="neg">2명<\/b><span>오늘 활동 0/.test(h) && /<b class="neg">3명<\/b><span>오늘 알리기 안 함/.test(h),
    '목표 없음 1(홍길순) · 오늘 활동 0 2(마지막 활동이 오늘이 아니고 전화 · 알리기 없음) · 알리기 안 함 3');
  const rows = h.slice(h.indexOf('class="seg"'));
  is(rows.indexOf('홍길순') < rows.indexOf('홍갑돌') && rows.indexOf('홍갑돌') < rows.indexOf('홍길동') && rows.indexOf('홍길동') < rows.indexOf('나<small>'), '모자란 순 — 목표 없는 분 먼저(시안) · 그다음 모자란 만큼(홍갑돌 88 > 홍길동 42 > 나 18)');
  is(/홍길동<small>1팀<\/small><\/div><div class="tmr-v">128만 \/ 200만/.test(h) && /📞 4<\/span><span>오늘 챙길 5<\/span><span class="ok">📣 올림/.test(h), '한 줄 — 실적 / 목표 · 오늘 전화(그날 calls) · 오늘 챙길(hwhoList) · 📣 올림(그날 체크 d10)');
  is(/홍길순<small>2팀<\/small><\/div><div class="tmr-v w">목표 없음/.test(h) && /📞 0<\/span><span>오늘 챙길 0<\/span><span class="no">📣 아직<\/span><em>오늘 활동 0<\/em>/.test(h), '목표 없음 · 어제 한 알리기는 오늘로 안 셈 · 오늘 활동 0');
  is(/나<small>1팀<\/small>[\s\S]*?📞 0<\/span>/.test(h) && !/📞 9/.test(h), '나 — 어제 전화(9)는 오늘로 안 셈');
  B.g.teamV2Q('zero'); h = B.sheet.box.innerHTML;
  is(/class="tt2 on"[^>]*><b class="neg">2명<\/b><span>오늘 활동 0/.test(h) && /홍길순/.test(h.slice(h.indexOf('class="seg"'))) && !/홍길동/.test(h.slice(h.indexOf('class="seg"'))), '「오늘 활동 0」 칸을 누르면 그분들만');
  B.g.teamV2Q('zero'); B.g.teamV2F('2팀'); h = B.sheet.box.innerHTML;
  is(!/홍길동<small>/.test(h) && /홍길순<small>/.test(h) && /class="fchip on"[^>]*>2팀/.test(h), '팀 칩 — 2팀만');
  B.g.teamV2F('전체'); B.g.teamV2By('act'); h = B.sheet.box.innerHTML; const r2 = h.slice(h.indexOf('class="seg"'));
  is(r2.indexOf('홍길동') < r2.indexOf('나<small>') && r2.indexOf('나<small>') < r2.indexOf('홍갑돌'), '실적 순');
  B.g.teamV2Member('a'); h = B.sheet.box.innerHTML;
  is(/‹ 팀 한눈에/.test(h) && /홍길동님/.test(h) && /이대로면 <span class="neg">42만<\/span> 모자라요/.test(h) && /실적 <b>128만<\/b><\/span><span>예상 <b>30만<\/b><\/span><span>목표 <b>200만/.test(h) &&
     /전화 4 · 챙길 5/.test(h) && /올렸어요/.test(h) && /teamV2See\('a'\)">👀 이분 화면 그대로 보기/.test(h) && /DB · 업적관리에서/.test(h), '팀원 시트 — 모자란 만큼 · 실적 · 예상 · 목표 · 오늘 영업 · 알리기 · 이분 화면 · 목표는 업적관리에서');
  B.g.teamV2See('a'); is(B.said.some(x => x[0] === 'hwhoSet' && x[1] === 'a') && B.said.some(x => x[0] === 'go' && x[1] === 'home'), '「👀 이분 화면」 = 오늘 동그라미와 같은 hwhoSet');
  B.g.teamV2Open(); B.g.teamV2Member('me'); h = B.sheet.box.innerHTML;
  is(/teamV2Goal\(\)">목표 고치기/.test(h) && !/teamV2See/.test(h), '내 것 — 새 오늘 목표 시트로');
  B.g.teamV2Old(); is(B.said.some(x => x[0] === 'cat' && x[1] === 'dbperf') && B.said.some(x => x[0] === 'go' && x[1] === 'airep'), '예전 팀 화면 = DB · 업적관리(지금 목표 시트가 가리키는 그 자리)');
  is(!/응원/.test(걷기(TM)), '시안의 「💬 응원 한마디」 는 보내는 자리가 없어 안 세움');
  B = team({ gb: false }); B.g.teamV2Open(); h = B.sheet.box.innerHTML;
  is(/팀 명단을 읽는 중이에요/.test(h) && !/0명/.test(h) && B.said.some(x => x[0] === 'gbLoad') === false, '성장판을 읽는 중이면 「읽는 중」 — 0명이라 안 씀(이미 읽는 중이면 또 안 부름)');
  B = team({ pf: false }); B.g.teamV2Open(); h = B.sheet.box.innerHTML;
  is(/<b>—<\/b><span>목표를 읽는 중이에요/.test(h) && /<b class="">…<\/b><span>목표 없음/.test(h) && B.said.some(x => x[0] === 'pfLoad'), '목표를 못 읽었으면 「…」 · 있던 pfLoad 를 한 번 부름');
  B = team({ lead: false }); B.g.teamV2Open(); is(!B.sheet.on, '팀원(지점장 아님)은 안 열림');
}
const WH = HV.slice(HV.indexOf('  function whoHtml() {'), HV.indexOf('  function helloHtml('));
is(/if \(typeof g\.teamV2Open === 'function'\) h \+= '<button type="button" class="tmall" onclick="teamV2Open\(\)">📊 우리 팀 한눈에/.test(WH) && WH.indexOf('hwhoCan()') < WH.indexOf('teamV2Open'),
  '새 오늘 화면 — 팀원 동그라미 줄 밑 「📊 우리 팀 한눈에」(동그라미 줄이 서는 지점장 · 대표만)');

console.log('\n[6] 나');
{
  let B = team(); B.g.meV2Open(); let h = B.sheet.box.innerHTML;
  const ord = ['나 — 알람', '공지사항', '설정', '요금제', '약관', '출발 점검', '내 폰에 설치', '건의함'].map(k => h.indexOf(k));
  is(ord.every(x => x >= 0) && ord.every((x, i) => !i || x > ord[i - 1]) && /<h1[^>]*>나<\/h1>/.test(h), '시안 openMe 차례 — 나 · 공지 · 설정 · 요금제 · 약관 · 출발 점검 · 폰에 설치 · 건의함');
  B = team({ blocked: ['settings', 'ready'] }); B.g.meV2Open(); h = B.sheet.box.innerHTML;
  is(!/설정|출발 점검/.test(h) && /공지사항/.test(h), '대표 전용(설정 · 출발 점검)은 막힌 분께 안 섬(osTabAllowed)');
  B.g.meV2Go('notice'); is(B.said.some(x => x[0] === 'go' && x[1] === 'notice') && !B.sheet.on, '누르면 시트를 닫고 그 화면');
  const HE = HV.slice(HV.indexOf('  function helloHtml('), HV.indexOf('  function helloHtml(') + 900);
  is(/class="mebtn" onclick="meV2Open\(\)" aria-label="나/.test(HE) && /typeof g\.meV2Open === 'function'/.test(HE), '새 오늘 화면 인사 줄 오른쪽 🙋 (team-v2 가 없으면 안 섬)');
  is(/sheet: sheet,/.test(HV), '새 오늘 화면이 시트를 내줌(HOME_V2.sheet)');
  /* 판 X551 — 🌱 신입 도움말 스위치: 켜고 끄는 것은 새 오늘 화면(HOME_V2.newHelp) · 여기는 단추만 */
  is(!/신입 도움말/.test(h), '🌱 신입 도움말 — 새 오늘 화면(HOME_V2.newOn)이 없으면 안 섬');
  let on = false; B = team(); B.g.HOME_V2 = Object.assign(B.g.HOME_V2 || {}, { newOn: () => on }); B.g.meV2Open(); h = B.sheet.box.innerHTML;
  is(/onclick="HOME_V2\.newHelp\(\);meV2Open\(\)"/.test(h) && /신입 도움말/.test(h) && />꺼짐<\/span>/.test(h) && h.indexOf('신입 도움말') < h.indexOf('공지사항'), '🌱 신입 도움말 — 나 시트 맨 위 · 누르면 HOME_V2.newHelp 후 다시 그림 · 꺼짐 표시');
  on = true; B.g.meV2Open(); h = B.sheet.box.innerHTML;
  is(/>켜짐<\/span>/.test(h), '켜져 있으면 「켜짐」');
}

console.log('\n[7] 서버 · 저장 · 옷');
const all = 걷기(GR) + 걷기(TM);
is(!/\.from\(|\.rpc\(|\.insert\(|\.update\(|\.upsert\(|fetch\(|supabase|XMLHttpRequest|osClient\(/.test(all), '서버를 직접 안 부름 — 읽기는 있던 arLoad · gbLoad · pfLoad 만(이미 읽었으면 안 부름)');
is((all.match(/setItem\(/g) || []).length === 1 && /lsSet\(KEY, v \? '1' : 'old'\)/.test(GR) && !/lsSet|setItem/.test(걷기(TM)), '저장은 이 기기 고르기 한 칸(apex_grow_v2)뿐 · 알리기 체크는 있던 hmMsDid · hmMsUndo');
for (const [nm, S, pre] of [['grow-v2', GR, /^\s*\.gr2b?\b/], ['team-v2', TM, /^\s*\.tm2\b/]]) {
  const body = (S.match(/var C = \[([\s\S]*?)\];/) || ['', ''])[1], rules = [];
  (body.match(/'([^']*)'/g) || []).map(s => s.slice(1, -1)).join('').replace(/([^{}]+)\{[^}]*\}/g, (m, sel) => { rules.push(sel.trim()); return ''; });
  const out = rules.filter(r => r.split(',').some(s => !pre.test(s)));
  is(rules.length > 20 && !out.length, nm + ' 옷 ' + rules.length + '줄 모두 제 이름 아래' + (out.length ? ' — 밖: ' + out.slice(0, 3).join(' | ') : ''));
  is(!/font-size:(1[0-2]|[0-9])px/.test(body), nm + ' — 13px 밑 글씨 없음');
}

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 알리기 · 팀 한눈에 · 나는 예전 화면을 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
