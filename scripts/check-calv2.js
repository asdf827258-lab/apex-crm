/* ═══════════════════════════════════════════════════════════════
   check-calv2.js — 📅 <b>새 달력 탭(시안 9차 「달력」)이 예전 내 캘린더를 안 깨나</b> (판 X516)

   사장님 말씀 (2026-11-23) 「4번 해」 — 시안 9차 점검표 고칠 차례 ④ 달력 탭(폰 달력 담기 스위치 포함).

   ⚠ 이 자는 <b>안전망</b>입니다 — 「시안과 같은가」 는 시안 사진과 새 화면 사진을 나란히 놓고 봅니다(PR 쪽지).

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 기본은 새 화면 — 「↩ 예전 화면」 고른 기기(old)·자동 점검(webdriver)만 예전 내 캘린더 · ALLOWED=false 로 모두 끔
     [2] ★★ index.html 은 세 자리만 — 싣기 · renderMyCal 첫 줄(빈 글이면 예전) · 예전 화면 맨 위 「✨ 새 달력」, 모두 typeof/try 안
     [3] ★★ 부르는 라이브 함수가 <b>정말 있다</b> (mcalItems · mcalDay · MCAL_KIND · mcalYmShift · mcalPaint · HOME_V2.sched/route …)
     [4] ★★ 시안 차례 — 달력 → 달 머리 → 한 달 판 → 색 풀이 → 고른 날 목록 → (오늘) 동선 → ＋ 일정 넣기 → 📲 폰 달력에도 담기
     [5] ★  가짜 달력으로 그려 본다 — 월요일 시작 · 오늘/고른 날 · 색 점(매일 하는 일 빼고 셋까지) · 시각 차례 · 내 일정 ✕ · 매일 하는 일 칸
     [6] ★★ 📲 스위치 — 이 기기 한 칸(apex_cal_ics) · 켜져 있으면 일정 넣기(schedPut)가 그 한 건 .ics 를 바로 받음(schedIcs) · 꺼지면 안 받음
     [7] ★  서버를 안 부르고 저장은 이 기기 고르기 두 칸뿐 · 옷은 .cal2 아래
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/cal-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const sc = 걷기(SRC);

function box(store, opt) {
  opt = opt || {};
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const els = {}, said = [];
  const doc = { head: { appendChild: e => { els[e.id] = e; } }, documentElement: {}, createElement: () => ({ id: '', textContent: '' }), getElementById: id => els[id] || null };
  const KIND = { my: { e: '✏️', t: '내 일정', c: '#475569' }, appt: { e: '📌', t: '약속', c: '#DC2626' }, touch: { e: '☎️', t: '연락', c: 'var(--primary)' },
    next: { e: '▶', t: '할 일', c: '#0F766E' }, bd: { e: '🎂', t: '생일', c: '#B45309' }, help: { e: '🤝', t: '도와줄 것', c: '#7C3AED' }, rt: { e: '📋', t: '매일 하는 일', c: '#0369A1' } };
  const ITEMS = opt.items || {
    '2026-11-23': [{ k: 'rt', t: '매일 하는 일' }, { k: 'touch', id: 'c1', t: '홍길동', late: '2026-11-20' }, { k: 'appt', t: '홍갑돌', s: '14:00 · 순천' }, { k: 'my', my: 'm1', t: '지점 회의', s: '09:30' },
      { k: 'bd', id: 'c2', t: '성춘향' }],
    '2026-11-25': [{ k: 'next', id: 'c3', t: '홍말순' }],
    '2026-12-02': [{ k: 'help', t: '홍판서 서류' }]
  };
  const MCAL = { ym: opt.ym || '', sel: opt.sel || '', view: 'week' };
  const g = {
    said, localStorage: ls, navigator: { webdriver: !!opt.robot }, document: doc, toast: t => said.push(['toast', t]),
    osEsc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    MCAL, MCAL_KIND: KIND, mcalToday: () => '2026-11-23', mcalYm: () => MCAL.ym || '2026-11', mcalItems: () => ITEMS,
    mcalDay: (it, ds) => (it[ds] || []), mcalManyWho: () => false, mcalWhoTag: () => '', hmFullNm: s => s,
    mcalYmShift: n => { said.push(['shift', n]); MCAL.ym = n > 0 ? '2026-12' : '2026-10'; MCAL.sel = ''; }, mcalGoToday: () => said.push(['today']),
    mcalPaint: () => said.push(['paint']), mcalMyLoad: () => said.push(['myload']), OS: { profile: { id: 'me' } },
    mrtPanelHtml: ds => '<div class="mrt">매일 ' + ds + '</div>',
    HOME_V2: { sched: () => said.push(['sched']), schedSet: (k, v) => said.push(['schedSet', k, v]), route: () => said.push(['route']) },
    go: t => said.push(['go', t])
  };
  g.window = g;
  vm.createContext(g);
  let src = SRC;
  if (opt.allowed === false) src = src.replace('var ALLOWED = true;', 'var ALLOWED = false;');
  vm.runInContext(src, g);
  return { g, els, store, said, MCAL };
}

console.log('\n[1] 기본은 새 화면 · 예전 화면은 고른 기기만');
is(box({}).g.CAL_V2.on() === true && /<h1>달력<\/h1>/.test(box({}).g.calV2Html()), '고른 적 없는 기기 = 새 달력');
is(box({ apex_cal_v2: 'old' }).g.calV2Html() === '' && /calV2Use\(true\)">✨ 새 달력/.test(box({ apex_cal_v2: 'old' }).g.calV2Back()), '「↩ 예전 화면」 고른 기기 = 빈 글(→ 예전 내 캘린더) · 맨 위 「✨ 새 달력」');
is(box({}, { robot: true }).g.calV2Html() === '' && box({}, { robot: true }).g.calV2Back() === '', '자동 점검 브라우저 = 예전 화면 · 단추도 안 섬(옛 달력 점검이 그대로 돈다)');
is(/var ALLOWED = true;/.test(SRC) && box({ apex_cal_v2: '1' }, { allowed: false }).g.calV2Html() === '' && box({ apex_cal_v2: 'old' }, { allowed: false }).g.calV2Back() === '', 'ALLOWED=false 한 줄이면 새 달력도 단추도 안 선다');
{
  const B = box({}); B.g.calV2Use(false);
  is(B.store.apex_cal_v2 === 'old' && B.said.some(x => x[0] === 'go' && x[1] === 'mycal'), '「↩ 예전 화면」 → 이 기기에 old · 달력 탭 다시 그림');
  B.g.calV2Use(true);
  is(B.store.apex_cal_v2 === '1', '「✨ 새 달력」 → 1');
}

console.log('\n[2] index.html 은 세 자리만');
is((IX.match(/<script src="cal-v2\.js"><\/script>/g) || []).length === 1 && IX.indexOf('<script src="cal-v2.js">') > IX.indexOf('<script src="home-v2.js">'), 'cal-v2.js 를 한 번, home-v2.js 뒤에 싣는다');
const RM = IX.slice(IX.indexOf('function renderMyCal(){'), IX.indexOf('function mcalRealAsk(el){'));
is(RM.indexOf('calV2Html') < RM.indexOf('var c=mcalCfg();') && /try\{ if\(typeof calV2Html==='function'\)\{ var v2c=calV2Html\(\); if\(v2c\)return v2c; \} \}catch\(eV2c\)\{\}/.test(RM) &&
   /\(\(typeof calV2Back==='function'\)\?calV2Back\(\):''\)\+/.test(RM) && /mcalCardHtml\(\{apps:true,picks:true\}\)/.test(RM) && /mcalDownload\(\\'daily\\'\)/.test(RM),
  'renderMyCal 첫 줄에서 새 달력(빈 글이면 예전) · 예전 화면 맨 위 「✨ 새 달력」 자리 · 예전 칸(달력 카드 · 매일 아침 알림)은 그대로 — typeof · try 안');
is((IX.match(/calV2/g) || []).length === 4, 'index.html 에 calV2 이름은 네 번뿐(싣기 빼고 두 자리)');
is(/<div id="mycalHost">'\+renderMyCal\(\)\+'<\/div>/.test(IX) && /var e=document\.getElementById\('mycalHost'\);\s*if\(e\)e\.innerHTML=renderMyCal\(\);/.test(IX), '다시 그리는 자는 예전 그대로 mcalPaint(#mycalHost) — 날 고르기 · 달 넘기기 · 일정 넣기 뒤 저절로 따라옴');

console.log('\n[3] 부르는 라이브 함수가 있다');
const has = n => new RegExp('function ' + n + '\\(|var ' + n + '\\s*=').test(IX);
const NEED = ['mcalItems', 'mcalDay', 'MCAL_KIND', 'MCAL', 'mcalToday', 'mcalYm', 'mcalYmShift', 'mcalGoToday', 'mcalPaint', 'mcalMyLoad', 'mcalManyWho', 'mcalWhoTag', 'hmFullNm',
  'mcalMyDel', 'mrtPanelHtml', 'mcalDownload', 'osOpenClient', 'osEsc', 'go', 'hmRtOpen', 'mcalMyPut', 'mcalCusPut', 'icsBuild'];
const miss = NEED.filter(n => !has(n));
is(!miss.length, '부르는 함수 ' + NEED.length + '개가 앱에 있다' + (miss.length ? ' — 없음: ' + miss.join(', ') : ''));
is(/sched: schedOpen, schedSet: schedSet, schedPut: schedPut, schedIcs: schedIcs,/.test(HV) && /route: routeSheet,/.test(HV) && /function sheet\(inner\) \{\s*var d = g\.document; css\(\);/.test(HV),
  '＋ 일정 넣기 · 오늘 동선은 오늘 화면의 그 시트(HOME_V2.sched · schedSet · route) — 시트가 제 옷을 스스로 입어 달력 탭에서도 선다');

console.log('\n[4] 시안 차례 (rCal)');
let B = box({}), h = B.g.calV2Html();
const ORD = ['<h1>달력</h1>', 'class="calhd"', 'class="calg"', 'class="calleg"', '<div class="sec"><b>11월 23일 월요일 · 오늘</b>', 'class="rtl"', '＋ 일정 넣기', '폰 달력에도 담기'];
const at = ORD.map(k => h.indexOf(k));
is(at.every(x => x >= 0) && at.every((x, i) => !i || x > at[i - 1]), '달력 → 달 머리 → 한 달 판 → 색 풀이 → 고른 날 목록 → 오늘 동선 → ＋ 일정 넣기 → 📲 폰 달력에도 담기' + (at.some(x => x < 0) ? ' — 없음: ' + ORD.filter((k, i) => at[i] < 0).join(' | ') : ''));
is(/<b>2026년 11월<\/b>/.test(h) && /calV2Move\(-1\)/.test(h) && /calV2Move\(1\)/.test(h) && /calV2Today\(\)">오늘/.test(h) && /calV2Use\(false\)">↩ 예전 화면/.test(h), '달 머리 — ‹ 2026년 11월 › · 오늘 · ↩ 예전 화면');
is(B.said.some(x => x[0] === 'myload'), '내 일정을 읽어 오는 것도 예전 달력과 같은 한 번(mcalMyLoad)');

console.log('\n[5] 가짜 달력으로 그려 본다');
const grid = h.slice(h.indexOf('class="calg"'), h.indexOf('class="calleg"'));
is((grid.match(/class="dh">/g) || []).length === 7 && /class="dh">월<\/div><div class="dh">화/.test(grid) && (grid.match(/<div><\/div>/g) || []).length === 6 && (grid.match(/class="cd/g) || []).length === 30,
  '한 달 판 — 월요일 시작(2026-11-01 은 일요일 → 빈 칸 여섯) · 30일');
const c23 = (grid.match(/<button type="button" class="cd on td" onclick="calV2Pick\('2026-11-23'\)"><b>23<\/b><span>(.*?)<\/span><\/button>/) || [])[1] || '';
is(c23 && (c23.match(/<i /g) || []).length === 3 && !/#0369A1/.test(c23) && /#C|var\(--primary\)/.test(c23), '오늘이자 고른 날 = on td · 점은 갈래별 셋까지 · 매일 하는 일(rt)은 점에서 뺌');
is(/calV2Pick\('2026-11-25'\)"><b>25<\/b><span><i style="background:#0F766E"><\/i>/.test(grid), '다른 날도 그 갈래 색 점(할 일)');
const leg = h.slice(h.indexOf('class="calleg"'), h.indexOf('class="sec"'));
is(/내 일정/.test(leg) && /약속/.test(leg) && /연락/.test(leg) && /할 일/.test(leg) && /생일/.test(leg) && !/도와줄 것/.test(leg) && !/매일 하는 일/.test(leg), '색 풀이 — 이 달에 있는 갈래만(다음 달 「도와줄 것」 · 매일 하는 일은 안 적음)');
const day = h.slice(h.indexOf('class="sec"'), h.indexOf('class="rtl"'));
is(day.indexOf('09:30') < day.indexOf('14:00') && day.indexOf('14:00') < day.indexOf('종일') && /<small>4개<\/small>/.test(day), '고른 날 목록 — 시각 차례(09:30 → 14:00 → 종일) · 매일 하는 일은 개수에서 뺌');
is(/📌 홍갑돌<\/div><div class="t2">약속 · 순천/.test(day) && /☎️ 홍길동<\/div><div class="t2">연락 · 11\/20 지났음/.test(day) && /osOpenClient\('c1'\)/.test(day) && /go\('clients'\)/.test(day),
  '약속 = 시각 · 이름 · 장소 · 연락 = 지난 날 · 누르면 예전 날 목록과 같은 길(osOpenClient · 고객 365일)');
is(/✏️ 지점 회의/.test(day) && /onclick="mcalMyDel\('m1'\)">✕/.test(day), '내 일정 — 예전처럼 ✕ 로 지움(mcalMyDel)');
is(/<div class="rt"><div class="mrt">매일 2026-11-23<\/div><\/div>/.test(day), '매일 하는 일 — 예전 달력이 펴던 칸(mrtPanelHtml) 그대로');
is(/calV2Route\(\)"><span>📍 오늘 동선 · 약속 1곳/.test(h), '오늘이면 📍 오늘 동선(그날 약속 수)');
B.g.calV2Pick('2026-11-25'); h = B.g.calV2Html();
is(B.MCAL.sel === '2026-11-25' && B.said.some(x => x[0] === 'paint') && /11월 25일 수요일<\/b><small>1개/.test(h) && !/class="rtl"/.test(h), '날 고르기 → MCAL.sel 한 곳 · mcalPaint 로 다시 · 오늘 아니면 동선 줄 없음');
B.g.calV2Pick('2026-11-25');
is(B.MCAL.sel === '2026-11-25', '같은 날을 다시 눌러도 풀리지 않음(시안 — 늘 고른 채)');
B.g.calV2Move(1); h = B.g.calV2Html();
is(B.said.some(x => x[0] === 'shift' && x[1] === 1) && /<b>2026년 12월<\/b>/.test(h) && /12월 1일 화요일<\/b><small>0개/.test(h) && /이날은 일정이 없어요/.test(h) && /도와줄 것/.test(h),
  '› 다음 달 → mcalYmShift · 고른 날이 비면 그 달 1일 · 빈 날은 「이날은 일정이 없어요」');
B.g.calV2Today();
is(B.said.some(x => x[0] === 'today'), '「오늘」 → mcalGoToday');
B = box({}, { sel: '2026-11-25' }); B.g.calV2Add();
is(B.said.some(x => x[0] === 'sched') && B.said.some(x => x[0] === 'schedSet' && x[1] === 'ds' && x[2] === '2026-11-25'), '＋ 일정 넣기 → 오늘 화면의 그 시트 · 고른 날로');
B.g.calV2Route();
is(B.said.some(x => x[0] === 'route'), '📍 오늘 동선 → 오늘 화면의 그 시트');

console.log('\n[6] 📲 폰 달력에도 담기');
B = box({}); h = B.g.calV2Html();
is(B.g.CAL_V2.icsOn() === true && /class="sw on"/.test(h) && /일정을 넣으면 폰 달력 파일도 바로 받아요/.test(h), '처음엔 켜짐(시안) · 무엇을 하는지 그대로 적음(저절로 들어간다고 안 함)');
B.g.calV2Ics(); h = B.g.calV2Html();
is(B.store.apex_cal_ics === '0' && B.g.CAL_V2.icsOn() === false && /class="sw"/.test(h) && B.said.some(x => x[0] === 'toast' && /껐어요/.test(x[1])), '누르면 끔 · 이 기기 한 칸(apex_cal_ics) · 다시 그림');
is(box({}, { robot: true }).g.CAL_V2.icsOn() === false, '자동 점검 브라우저는 꺼진 채(점검 중에 파일을 받지 않게)');
is(/mcalDownload\(\\'month\\'\)">.*이번 달 통째로 폰 달력에/.test(SRC) && /calV2Use\(false\)">.*예전 내 캘린더/.test(SRC), '이번 달 통째로(mcalDownload month — 이름은 mcalOutName 가림 그대로) · 예전 설정으로 가는 줄');
const SP = HV.slice(HV.indexOf('  function schedPut() {'), HV.indexOf('  function schedIcs() {'));
is(/try \{ if \(g\.CAL_V2 && g\.CAL_V2\.icsOn\(\)\) \{ SCH\.done\.ics = true; schedIcs\(\); \} \} catch \(eI\) \{\}/.test(SP) && SP.indexOf('SCH.done = {') < SP.indexOf('CAL_V2.icsOn()') && SP.indexOf('CAL_V2.icsOn()') < SP.lastIndexOf('schedPaint();'),
  '일정 넣기(schedPut) — 넣은 뒤 스위치가 켜져 있으면 그 한 건 .ics 를 바로(schedIcs) · 없거나 꺼지면 예전 그대로');
is(/D\.ics \? '<div class="sub" style="margin-top:8px">📲 폰 달력 파일도 받았어요/.test(HV), '「넣었어요」 화면 — 받았다고 · 끄는 자리를 알려 줌');
{
  /* schedPut 을 실제로 돌려 본다 — 켜짐이면 .ics 한 번, 꺼짐이면 0번 */
  const run = icsOn => {
    const calls = [];
    const els = { mcalMyT: { value: '지점 회의' }, mcalMyH: { value: '' } };
    const G = { CAL_V2: { icsOn: () => icsOn }, mcalToday: () => '2026-11-23', MCAL: {}, mcalMyPut: () => calls.push('put'), toast: () => {},
      icsBuild: (n, e) => { calls.push('ics:' + e[0].title); return 'BEGIN:VCALENDAR'; },
      document: { getElementById: id => els[id] || null, createElement: () => ({ click: () => calls.push('click'), remove() {} }), body: { appendChild() {} } } };
    const fnSrc = HV.slice(HV.indexOf('  var SCH = {'), HV.indexOf('  /* 💬 보내기 화면'));
    const ctx = { g: G, el: id => els[id] || null, T: (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } }, E: s => String(s), Q: s => String(s),
      schedPaint: () => {}, paint: () => {}, Blob: function () {}, URL: { createObjectURL: () => 'blob:', revokeObjectURL() {} }, setTimeout: f => f(), encodeURIComponent, Date };
    vm.createContext(ctx);
    vm.runInContext(fnSrc.replace(/function schedPaint\(\)[\s\S]*?\n  \}\n/, '') + '\nSCH.ds="2026-11-25";SCH.tab="me";schedPut();this.__D=SCH.done;', ctx);
    return { calls, D: ctx.__D };
  };
  const a = run(true), b = run(false);
  is(a.calls.indexOf('put') >= 0 && a.calls.filter(x => x === 'ics:지점 회의').length === 1 && a.calls.indexOf('click') >= 0 && a.D && a.D.ics === true, '켜짐 — 넣고(mcalMyPut) 그 한 건 .ics 를 한 번 받음');
  is(b.calls.indexOf('put') >= 0 && !b.calls.some(x => /^ics:/.test(x)) && b.D && !b.D.ics, '꺼짐 — 넣기만 · 파일은 「넣었어요」 단추로만');
}

console.log('\n[7] 서버 · 저장 · 옷');
is(!/\.from\(|fetch\(|supabase|XMLHttpRequest|osClient\(|mcalMyPut|mcalCusPut|cmSave|cmTouchAdd/.test(sc), '서버 · 고객 칸 저장을 안 부름(일정 넣기는 오늘 화면 시트가 있던 함수로)');
const sets = (sc.match(/setItem\([^)]*\)/g) || []);
is(sets.length === 1 && /lsSet\(KEY, v \? '1' : 'old'\)/.test(sc) && /lsSet\(ICS_KEY, v \? '1' : '0'\)/.test(sc) && (sc.match(/lsSet\(/g) || []).length === 3, '저장은 이 기기 고르기 두 칸(apex_cal_v2 · apex_cal_ics)뿐');
const cssBody = (SRC.match(/var C = \[([\s\S]*?)\];/) || ['', ''])[1], rules = [];
(cssBody.match(/'([^']*)'/g) || []).map(s => s.slice(1, -1)).join('').replace(/([^{}]+)\{[^}]*\}/g, (m, sel) => { rules.push(sel.trim()); return ''; });
const badSel = rules.filter(r => r.split(',').some(s => !/^\s*\.cal2b?\b/.test(s)));
is(rules.length > 30 && !badSel.length, '옷 ' + rules.length + '줄 모두 .cal2 · .cal2b 아래' + (badSel.length ? ' — 밖: ' + badSel.slice(0, 3).join(' | ') : ''));
is(!/font-size:(1[0-2]|[0-9])px/.test(cssBody), '13px 밑 글씨 없음');

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 달력은 예전 내 캘린더를 안 깨고 시안 차례로 섭니다');
process.exit(bad ? 1 : 0);
