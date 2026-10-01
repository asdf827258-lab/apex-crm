/* ══════════════════════════════════════════════════════════════════
   check-hmclick.js — <b>홈에서 누르는 것이 정말 눌리는가.</b>

   사장님 말씀 (2026-10-01) — <b>「누르는 것도 이어서 해줘」</b>.
   앞선 판들이 홈의 <b>모양</b>을 목각에 맞췄습니다. 이 판은 <b>손가락</b>
   입니다 — 보이는 것마다 누르면 무엇이 되는가.

   ── 목각의 누르는 것 열셋을 맞대어 봤습니다 ──────────────────────
   docs/mokgak/mokgak-pc.html 의 vHome 이 쥔 것 (A(…) 쓰임 그대로) —
     ① 보장분석 PDF 넣기 (nav kb)          → 우리: 히어로 단추 go('bojang')
     ② 🔔 알람 칩 (nav alm)                → <b>없음</b> · 칩을 못 셉니다
     ③④⑤⑥ 근거 보기 · 내리기 · 관리 멘트 복사 · 한 장으로 보기
        (읽어 둔 보장분석 카드)             → <b>없음</b> · 그 개념이 앱에 없습니다
     ⑦ 전화 걸고/만나고 기록 남기기 (did)   → 우리: hmDoHtml 큰 단추
     ⑧ <b>한 장으로 보기 (open)</b>         → <b>이번 판에 이었습니다</b>
     ⑨ 자료 열기 (nav tool)                → 우리 약속 칸은 「내 캘린더」 로 갑니다
     ⑩ 크게 보기 (nav cal)                 → 홈에 달력 칸이 없습니다
     ⑪ 동선 줄마다 (open id)               → 우리: hmRtPerson — 이미 이어져 있음
     ⑫ 🗺️ 이 순서로 돌기 (nav rt)           → 우리: hmRtOpen — 이미 이어져 있음
     ⑬ 보낼 말 보기 (nav madi)             → <b>없음</b> · 마디 화면이 없습니다
   ★ ②③④⑤⑥⑬ 은 <b>안 세웁니다.</b> 눌러도 안 열리는 단추는 「없는 것」
     보다 나쁩니다 (1번). 무엇이 없는지는 위에 적어 둡니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 홈에 누를 것이 <b>몇 개인가</b> — 세어서 적는다
     [2] ★★ <b>죽은 단추가 없다</b> — onclick 이 부르는 함수가 정말 있다.
         check-html 은 <b>이것을 못 봅니다</b> — 글자로는 멀쩡한 이름이라
         터지는 건 사장님이 누르는 그 순간입니다 (5번의 「죽은 판」 과 같은 결).
     [3] ★★ <b>안 열리는 화면으로 보내지 않는다</b> — go('x') 의 x 가
         정말 메뉴에 있다(navItemOf). hmMovedHtml 이 이미 쓰는 자입니다.
     [4] 목각이 둔 단추가 <b>글자 그대로</b> 있다 — 네 가지
     [5] ★ 「한 장으로 보기」 를 <b>실제로 눌러</b> 그 사람 자리로 가는가
     [6] <b>손가락이 닿는다</b> — 보이는 것 중 44px 아래 (기준선)

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   「목각과 같아졌다」 는 <b>안 잽니다.</b> 위 ②③④⑤⑥⑬ 여섯은 앱에 자리가
   없어 못 이었습니다. 그것까지 초록이라고 적으면 이 자가 거짓말입니다 (8번).
   ══════════════════════════════════════════════════════════════════ */

/* 기준선 — <b>늘면 빨간불, 줄이면 손으로 내립니다.</b>
   지금 있는 다섯이고, <b>하나하나 이름을 적어 둡니다</b> — 적어 두지 않으면
   다음 사람이 「다섯이 무엇인지」 를 다시 재야 합니다.
     30px ➕ 고객 넣기            (hdbNew)      · 카드 머리의 곁단추
     30px 📅 내 캘린더            (go)          · 카드 머리의 곁단추
     22px ✅ 이분 끝 다음 분으로 → (hmQfin)      · 단추가 아니라 <b>글줄</b>
     22px 다음 분 → 오늘은 뒤로    (hmSkip)      · 단추가 아니라 <b>글줄</b>
     30px 🗺️ 지역 동선 →          (hmRtOpen)    · 카드 머리의 곁단추
     30px 시각 바꾸기 →           (go)          · 카드 머리의 곁단추 (2026-10-02)
     30px 달력 크게 보기 →        (go)          · 카드 머리의 곁단추 (2026-10-02)
     30px 내 숫자 →               (go)          · 카드 머리의 곁단추 (2026-10-02)
   ⬆ 2026-10-02 · 5 → <b>6</b>. 「🔔 알람」 카드가 셀 수 있게 되면서 머리에
     곁단추가 하나 섰습니다(사장님 말씀 「알람 칩도 세워줘」). <b>같은 옷
     (.hm-rt-go)·같은 30px</b> 이라 위 「지역 동선 →」 과 한 식구입니다 —
     새로 생긴 갈래가 아니라 <b>같은 갈래가 하나 늘어난 것</b>입니다.
   「0 이어야 한다」 로 두면 이 판과 아무 상관 없는 다섯이 당장 빨간불이라
   사람이 자를 안 믿게 됩니다 (8번). <b>여섯 번째를 막는</b> 자입니다.
   ★ 이 다섯을 44px 로 키우는 것은 <b>따로 여쭐 일</b>입니다 — 카드 머리의
     곁단추를 키우면 머리글이 두 줄로 접히고, 글줄을 단추로 만들면
     「이분 끝」 이 큰 단추와 똑같이 보여 잘못 누릅니다.                 */
const BASE = { 작은것: 8 };

const 못박은날 = '2026-09-15T09:00:00Z';
const PIN = (iso) => {
  const FIX = new Date(iso).getTime(); const R = Date; const off = FIX - R.now();
  function F(...a){ return a.length ? new R(...a) : new R(R.now() + off); }
  F.now = () => R.now() + off; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8971;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안 (3번). */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k] = function () { return o; }; });
    o.single = function () { return chain({ data: null }); };
    o.maybeSingle = function () { return chain({ data: null }); }; return o; };
  window.osClient = function () { return { from: function () { return {
      select: function () { return chain({ data: [], count: 0 }); },
      update: function () { return chain({}); }, insert: function () { return chain({}); },
      upsert: function () { return chain({}); }, delete: function () { return chain({}); } }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = []; CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'AP', days:3, n:2, res:'상담', cAt:'', pAt:'' },
           { id:'d2', who:'me', name:'홍길순', region:'광주', src:'소개', stage:'TA', days:9, n:1, res:'', cAt:'', pAt:'' },
           { id:'d3', who:'me', name:'홍길중', region:'순천', src:'소개', stage:'PC', days:5, n:3, res:'', cAt:'', pAt:'' }];
  go('home');
  /* <b>접힌 것은 먼저 펴고 잽니다.</b> 접힌 단추는 높이가 0px 이라
     「손가락이 안 닿는다」 로 세어집니다 — 안 닿는 것이 아니라
     <b>안 보이는</b> 것입니다 (check-toss 에서 배운 것). */
  try { hmFoldSet('etc', true); hmFoldSet('more', true); } catch (e) {}
  go('home');
};

/* 홈에서 누를 것을 <b>한 곳에서</b> 뽑습니다 — 두 번 세지 않습니다 (5번) */
const PICK = () => {
  const pane = document.getElementById('dynPane');
  const els = [].slice.call(pane.querySelectorAll('button,[onclick],[role="button"]'));
  return els.map((e, i) => {
    const oc = e.getAttribute('onclick') || '';
    const r = e.getBoundingClientRect();
    const fn = (oc.match(/^\s*([A-Za-z_$][\w$]*)\s*\(/) || [])[1] || '';
    const gos = (oc.match(/\bgo\(\s*'([^']+)'/g) || []).map(s => s.replace(/.*'([^']+)'.*/, '$1'));
    return { i, t: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28),
             h: Math.round(r.height), fn, gos,
             live: fn ? (typeof window[fn] === 'function') : null,
             dead: gos.filter(g => typeof navItemOf === 'function' && g !== 'home' && !navItemOf(g)) };
  });
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const open = async (w) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    /* ★ <b>바깥을 막습니다.</b> 안 막으면 이 자가 「그날 망 사정」 과
       <b>진짜 고객 자료</b>를 잽니다 (check-hmexact 에서 실제로 그랬습니다). */
    await ctx.route('**://**', r =>
      r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    await ctx.addInitScript(PIN, 못박은날);
    await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
    await p.evaluate(SEED);
    await p.waitForTimeout(2600);
    return p;
  };

  const PC = await open(1280);
  const L = await PC.evaluate(PICK);

  console.log('\n[1] 홈에서 <b>누를 것</b>을 세어 봅니다');
  is(L.length >= 20, '  누를 곳 <b>' + L.length + '개</b> — 손으로 안 적고 화면에서 뽑습니다');

  console.log('\n[2] ★★ <b>죽은 단추가 없다</b> — 부르는 함수가 정말 있나');
  const 죽은 = L.filter(o => o.live === false);
  const 맨손 = L.filter(o => o.live === null);
  is(죽은.length === 0, '  없는 함수를 부르는 단추 <b>' + 죽은.length + '개</b>'
    + (죽은.length ? (' ← ' + 죽은.map(o => o.fn + '() · 「' + o.t + '」').join(' / ')) : ''));
  is(맨손.length === 0, '  <b>아무것도 안 부르는</b> 단추 ' + 맨손.length + '개'
    + (맨손.length ? (' ← ' + 맨손.map(o => '「' + o.t + '」').join(' / ')) : ''));

  console.log('\n[3] ★★ <b>안 열리는 화면으로 보내지 않는다</b> (navItemOf)');
  const 헛길 = L.filter(o => o.dead.length);
  is(헛길.length === 0, '  메뉴에 없는 화면을 가리키는 단추 <b>' + 헛길.length + '개</b>'
    + (헛길.length ? (' ← ' + 헛길.map(o => '「' + o.t + '」→' + o.dead.join(',')).join(' / '))
                   : ' · 가리키는 화면 ' + [...new Set(L.flatMap(o => o.gos))].length + '가지'));

  console.log('\n[4] 목각이 둔 단추가 <b>글자 그대로</b> 있다');
  const say = (s) => L.some(o => o.t.indexOf(s) >= 0);
  is(say('보장분석 PDF 넣기'), '  ① <b>「보장분석 PDF 넣기」</b> (목각 nav kb)');
  /* ⚠ 2026-10-02 · <b>묻는 것을 바꿨습니다(자를 없앤 것이 아닙니다).</b>
     사장님 말씀 「전화 걸러 갑니다 <b>에서</b>, 고객의 현재 상황은
     무엇인가요? 로 묻고」 로, 목각의 did 자리가 <b>물음</b>이 되었습니다.
     큰 단추(hmPick)는 <b>상황을 고르시면</b> 그 자리에 섭니다.
     ★ 여기서는 <b>그 자리가 비지 않았는지</b>만 봅니다. 「고르면 정말 서나」 ·
       「DB 와 다를 때는 안 서나」 는 <b>check-hmsit</b> 가 봅니다 — 한 자리를
       두 자가 따로 재면 한쪽만 늙습니다 (5번).                          */
  is(L.some(o => o.fn === 'hmStOpen'),
    '  ⑦ <b>그 자리에 물음이 있다</b> — 「고객의 현재 상황은 무엇인가요?」 '
      + '(목각 did 자리 · 큰 단추는 고르시면 섭니다 · check-hmsit)');
  is(say('한 장으로 보기'), '  ⑧ <b>「한 장으로 보기」</b> (목각 open) ← 이번 판');
  is(say('지역 동선'), '  ⑫ <b>「🗺️ 지역 동선 →」</b> (목각 nav rt)');

  console.log('\n[5] ★ <b>「한 장으로 보기」 를 눌러 봅니다</b>');
  const go1 = await PC.evaluate(() => {
    const pane = document.getElementById('dynPane');
    const b = [].slice.call(pane.querySelectorAll('button'))
      .filter(e => (e.textContent || '').indexOf('한 장으로 보기') >= 0)[0];
    if (!b) return { no: 1 };
    const oc = b.getAttribute('onclick') || '';
    b.click();
    const t = (typeof lastTab !== 'undefined') ? lastTab : '';
    try { go('home'); } catch (e) {}
    return { no: 0, oc: oc.slice(0, 48), tab: t };
  });
  is(!go1.no, '  단추를 찾았다 — ' + (go1.oc || '못 찾았습니다'));
  is(!go1.no && !!go1.tab && go1.tab !== 'home',
    '  누르면 <b>그 사람 자리로 갑니다</b> — ' + (go1.tab || '아무 데도 안 갔습니다'));

  console.log('\n[6] <b>손가락이 닿는다</b> — 보이는 것만 잽니다');
  const 작은 = L.filter(o => o.h > 0 && o.h < 44);
  is(작은.length <= BASE.작은것, '  44px 아래가 <b>' + 작은.length + '개</b> / 기준선 '
    + BASE.작은것 + (작은.length > BASE.작은것
      ? (' ← ' + 작은.map(o => o.h + 'px 「' + o.t + '」').join(' / '))
      : ''));
  if (작은.length < BASE.작은것)
    console.log('    ↓ ' + 작은.length + '개로 줄었습니다 — 기준선도 같이 내려 주십시오 (8번)');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 홈에서 누르는 것에 구멍이 있습니다')
                  : '✓ 홈의 누를 것 ' + L.length + '개가 모두 살아 있고 · 있는 화면만 가리킵니다');
  console.log('  못 이은 것 여섯(목각 ②③④⑤⑥⑬)은 이 파일 머리에 적어 두었습니다 — 초록이 「다 됐다」 가 아닙니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
