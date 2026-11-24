/* ═══════════════════════════════════════════════════════════════
   check-myday.js — 📅 <b>오늘 내 일정 · 팀원 스스로 체크 · 💌 교육매니저 한마디</b> (판 X554)

   사장님 말씀 (2026-11-24) — 「더 쉽고 이걸 스스로 체크할 수 있도록 / 교육매니저도 함께하고
   체크하도록 · 독려하고 스케줄 부족한 부분들을 같이 알아봐 주고 해 나갈 수 있도록」.
   몸 = app/my-day.js · 서버 = EM운영센터 migration_71(em_my_day · em_my_rep · em_my_day_put · em_my_coach_seen).

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 새 오늘 화면 차례 — 「이번 달 목표」 바로 밑 · try 안(part) · index.html 이 home-v2.js 뒤에 싣는다
     [2] ★★ 서버는 함수 넷만 — em_daily 표를 직접 안 읽고 안 씀(교육매니저 메모 · 숫자가 내려오면 안 됨)
     [3] ★★ 팀원 화면을 고른 리더 · 읽기 실패(SQL 전)면 칸을 안 세운다 — 헛칸 · 남의 칸 금지
     [4] ★★ CRM 약속을 일정 줄로 넣을 때 고객 이름이 안 따라간다 (운영센터로 올라가는 글)
     [5] ★  고정 일정 규칙 — 매주 요일 · 매월 n일 · 31일은 짧은 달 말일 (운영센터 daily.js repFor 와 같은 뜻)
     [6] ★  🔥 연속 — 주말 건너뜀 · 오늘 아직이면 어제부터
     [7] ★  저장은 바뀐 칸만 — 나머지는 null(서버가 그대로 둠 = 교육매니저가 고친 것을 안 덮음)
     [8] ★  안 읽은 💌 이 있으면 칸 머리가 한마디로 바뀐다 · 읽으면 다시 일정
     [9] ★  글씨 13px 바닥 · 옷은 .hv2 / #hv2Sheet 아래로만
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/my-day.js'), 'utf8');
const HV = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');

function make(o) {
  o = o || {};
  const calls = [], styles = [];
  const doc = { getElementById: id => (id === 'mydCss' ? (styles.length ? {} : null) : (o.els || {})[id] || null), head: { appendChild: s => styles.push(s) },
    createElement: () => ({}) };
  const rpc = (n, a) => { calls.push([n, a]); const r = (o.rpc || {})[n]; return Promise.resolve(typeof r === 'function' ? r(a) : (r || { data: [], error: null })); };
  const g = { document: doc, OS: { profile: { id: 'u1' } }, hwhoIsMe: () => o.me !== false, mcalToday: () => o.today || '2026-11-24',
    osClient: () => ({ rpc }), mcalItems: () => ({}), mcalDay: () => o.appts || [], toast() {}, HOME_V2: { paint() {}, sheet(h) { g._sheet = h; } } };
  g.window = g;
  vm.createContext(g); vm.runInContext(SRC, g);
  return { g, calls, styles, M: g.MY_DAY };
}
const tick = () => new Promise(r => setTimeout(r, 5));

(async () => {
  console.log('\n[1] 새 오늘 화면 차례 · 싣기');
  is(/monHtml\(\) \+ part\(mydayHtml\) \+ stepsHtml\(\)/.test(HV), '목표 → 📅 오늘 내 일정 → 다섯 걸음 (part 로 감쌈 — 터져도 빈 칸)');
  is(/function mydayHtml\(\) \{ return g\.MY_DAY \? g\.MY_DAY\.html\(\) : ''; \}/.test(HV), 'my-day.js 가 없어도 빈 칸');
  const a = IX.indexOf('<script src="home-v2.js"></script>'), b = IX.indexOf('<script src="my-day.js"></script>');
  is(a > 0 && b > a, 'index.html — home-v2.js 다음에 my-day.js');

  console.log('\n[2] 서버는 함수 넷만');
  const rpcs = [...code.matchAll(/\.rpc\('([a-z_]+)'/g)].map(m => m[1]).sort();
  is(JSON.stringify([...new Set(rpcs)]) === JSON.stringify(['em_my_coach_seen', 'em_my_day', 'em_my_day_put', 'em_my_rep']), 'rpc = ' + [...new Set(rpcs)].join(' · '));
  is(!/\.from\(|fetch\(|em_daily['"]/.test(code), 'em_daily 표 · fetch 를 직접 안 부름');

  console.log('\n[3] 남의 칸 · 헛칸 금지');
  { const X = make({ me: false }); is(X.M.html() === '' && X.calls.length === 0, '팀원 화면을 고른 리더 — 칸 없음 · 서버 안 부름'); }
  { const X = make({ rpc: { em_my_day: { data: null, error: { message: 'function em_my_day does not exist' } } } });
    X.M.html(); await tick(); is(X.M.html() === '', 'SQL 전(함수 없음) — 칸 없음'); }
  { const X = make(); X.M.html(); X.M.html(); await tick(); X.M.html();
    is(X.calls.filter(c => c[0] === 'em_my_day').length === 1, '서버 읽기는 세션에 한 번 (' + X.calls.filter(c => c[0] === 'em_my_day').length + '번)'); }

  console.log('\n[4] 고객 이름이 안 따라간다');
  { const X = make({ appts: [{ k: 'appt', s: '14:00 · 홍길순 고객 보장분석', t: 'c9' }, { k: 'bd', s: '생일', t: 'c8' }] });
    X.M.html(); await tick(); X.M.open();
    const sh = X.g._sheet || '';
    is(/14:00 고객 약속/.test(sh) && !/홍길순/.test(sh) && !/생일/.test(sh), '약속은 「14:00 고객 약속」 만 · 이름 · 메모 없음 · 약속 아닌 것 빠짐'); }

  console.log('\n[5] 고정 일정 규칙');
  { const rules = [{ who: '*', k: 'w', v: [1], t: '09:30 본부 교육' }, { who: 't:x', k: 'w', v: [2, 4], t: '오후 개척' }, { who: '*', k: 'm', v: 31, t: '마감' }, { who: '*', k: 'm', v: 24, t: '24일 점검' }];
    const X = make({ rpc: { em_my_rep: { data: rules, error: null } } }); X.M.html(); await tick();
    is(X.M._repOf('2026-11-23').join('|') === '09:30 본부 교육', '월요일 = 본부 교육');
    is(X.M._repOf('2026-11-24').join('|') === '24일 점검|오후 개척', '11/24(화) = 오후 개척 · 24일 점검');
    is(X.M._repOf('2026-11-30').join('|') === '09:30 본부 교육|마감', '11월 31일 규칙 → 30일(말일)'); }

  console.log('\n[6] 🔥 연속');
  { const rows = ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23'].map(d => ({ d, plan: 'x', done: 'ok', self_at: d + 'T09:00:00Z' }));
    const X = make({ rpc: { em_my_day: { data: rows, error: null } } }); X.M.html(); await tick();
    is(X.M._streak() === 4, '수 · 목 · 금 · (주말 건너뜀) · 월 = 4일 · 오늘(화) 아직이라 어제부터 (' + X.M._streak() + ')'); }

  console.log('\n[7] 바뀐 칸만');
  { const X = make({ rpc: { em_my_day: { data: [{ d: '2026-11-24', plan: '10시 상담', done: '', self_note: '', self_at: 'x' }], error: null } } });
    X.M.html(); await tick();
    X.g.document.getElementById = id => ({ mydPlan: { value: '10시 상담' }, mydNote: { value: '' } })[id] || null;
    X.M.done('ok'); await tick();
    const p = X.calls.find(c => c[0] === 'em_my_day_put');
    is(p && p[1].p_done === 'ok' && p[1].p_plan === null && p[1].p_note === null, '했나만 누르면 일정 · 한 줄은 null ' + JSON.stringify(p && p[1])); }

  console.log('\n[8] 💌 한마디');
  { const rows = [{ d: '2026-11-24', plan: '10시', done: '', coach: '내일 콜 리스트 같이 봐요!', coach_by: '홍판서', coach_at: '2026-11-24T05:00:00Z', coach_seen_at: null }];
    const X = make({ rpc: { em_my_day: { data: rows, error: null } } }); X.M.html(); await tick();
    const h = X.M.html();
    is(/홍판서님 한마디가 왔어요/.test(h) && /내일 콜 리스트/.test(h), '안 읽은 한마디 → 칸 머리');
    rows[0].coach_seen_at = '2026-11-24T06:00:00Z';
    is(/오늘 내 일정/.test(X.M.html()), '읽은 뒤 → 다시 「오늘 내 일정」'); }

  console.log('\n[9] 글씨 · 옷');
  const css = (SRC.match(/var C = \[([\s\S]*?)\];/) || [])[1] || '';
  const px = [...css.matchAll(/font-size:(\d+)px/g)].map(m => +m[1]);
  is(px.length > 5 && Math.min(...px) >= 13, '글씨 가장 작은 것 ' + Math.min(...px) + 'px');
  const sel = [...css.matchAll(/'([^'{]+)\{/g)].map(m => m[1]).join(',').split(',').map(s => s.trim()).filter(Boolean);
  is(sel.every(s => /^(\.hv2 |#hv2Sheet )/.test(s)), '옷 ' + sel.length + '개 모두 .hv2 · #hv2Sheet 아래');

  console.log(bad ? `\n✗ ${bad}가지 어긋남` : '\n✓ 모두 맞음');
  process.exit(bad ? 1 : 0);
})();
