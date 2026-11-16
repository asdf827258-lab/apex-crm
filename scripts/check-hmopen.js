/* 🌅 <b>사장님이 이름 대어 시키신 홈 칸은 기본으로 펴져 있는가</b> (판 X459)

   사장님 말씀 2026-11-16 「crm 키니끼 안되있는것들이 많은데」 →
   「<b>오늘 부분이 하나도 안되어있는데</b>」.

   ── 재어 보니 없는 것이 아니었습니다 ──────────────────────────────
   다섯 가지(지역동선 · 🔦 투어 · 캘린더 · 아침 미션 · 실명)는 <b>다 서 있었습니다.</b>
   그런데 <b>HM_FOLD_DEF 가 비어 있어 홈의 접이가 하나도 안 펴져</b> 있었습니다.
   앱을 켜면 첫 화면에 고객 띠와 다섯 걸음만 보이고, 시키신 것은 전부
   <b>한 줄로 접힌 채</b>였습니다 — 사장님 눈에는 「하나도 안 되어 있다」 입니다.

   ★ 자리는 <b>안 옮깁니다.</b> 캘린더가 맨 밑인 것은 사장님이 X48 에서
     「이번주 캘린더 주간만 짤라서 <b>맨 밑에</b>」 라고 하신 그대로입니다 —
     지금 말씀으로 지난 말씀을 덮지 않습니다 (1번).
   ★ 홈이 길어지는 것은 <b>🗜 짧게</b>(판 X456)가 맡습니다. 기본은 「시키신 것이
     보이는 홈」, 한 번 누르면 「한 화면 홈」 — 어느 쪽도 안 덮습니다.

   여기서 못 박는 것:
     [1] 펴 둘 칸의 이름이 <b>한 곳</b>(HM_FOLD_DEF)에 적혀 있다.
     [2] 아침 미션 · 이번 주는 <b>기본으로 펴져</b> 있다.
     [3] 접는 단추는 <b>그대로</b>다 — 펴 두었다고 접을 길을 없애지 않는다 (6번).
     [4] 한 번 접으면 <b>그 고름이 남는다</b> — 기본값이 사장님 손을 덮지 않는다.
     [5] 홈이 <b>터무니없이 길어지지</b> 않는다 (기준선).
     [6] 🗜 짧게는 <b>그대로</b> 돈다 — 기본을 펴도 한 화면 길이는 안 늘어난다.

   ⚠ <b>이 자가 못 보는 것</b> — 「위로」 와 「TA 대본」 은 그 분의 단계·DB 종류에
     따라 서는 조건부 글이라, 견본으로는 늘 세울 수 없습니다. 있는 척하지
     않습니다 (1번). 그 둘은 check-msfive 가 따로 봅니다.                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/index.html';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 📏 기준선 — 재서 적은 값입니다. 줄이면 같이 내립니다 (0-1번) */
const 홈선 = 3883;   /* 기본(시키신 칸이 펴진) 홈 · 2026-11-16 에 재어 3,683px + 틈 200 */
const 짧은선 = 1200; /* 🗜 짧게 — 판 X456 에서 1,129px */

const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  OS.cfg = OS.cfg || {}; OS.cfg.schema_version = '47';
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients']
    .forEach(k => { window[k] = function () {}; });
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = () => true;
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range']
      .forEach(k => { o[k] = function () { return o; }; });
    o.single = () => chain({ data: null }); o.maybeSingle = () => chain({ data: null }); return o; };
  window.osClient = function () { return { from: function () { return {
      select: () => chain({ data: [], count: 0 }), update: () => chain({}), insert: () => chain({}),
      upsert: () => chain({}), delete: () => chain({}) }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id:'c1', advisor_id:'me', name_masked:'홍*동', created_at:'2026-09-03' }];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'AP', days:3, n:2, res:'상담' },
           { id:'d2', who:'me', name:'홍길순', region:'광주', src:'소개', stage:'TA', days:9, n:1, res:'' }];
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const 열기 = async (before) => {
    const ctx = await br.newContext({ viewport: { width: 430, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                    ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
    if (before) await pg.evaluate(before);
    await pg.evaluate(SEED);
    await pg.waitForTimeout(2800);
    return { pg, ctx, errs };
  };
  const SRC = fs.readFileSync(FILE, 'utf8');

  head('[1] 펴 둘 칸의 이름이 <b>한 곳</b>에 적혀 있다 (5번)');
  is(/var\s+HM_FOLD_DEF\s*=\s*\{[^}]*ms\s*:\s*(1|true)/.test(SRC) ||
     /HM_FOLD_DEF\s*=\s*\{[\s\S]{0,400}?ms\s*:/.test(SRC),
     'HM_FOLD_DEF 에 펴 둘 칸이 적혀 있다');

  const A = await 열기();
  head('[2] 사장님이 이름 대어 시키신 칸이 <b>기본으로 펴져</b> 있다');
  const 기본 = await A.pg.evaluate(() => {
    const o = {};
    ['ms','stk_week'].forEach(k => { o[k] = (typeof hmFoldOpen === 'function') ? hmFoldOpen(k) : null; });
    const p = document.querySelector('#dynPane');
    o.높이 = Math.round(p.scrollHeight);
    const ms = document.getElementById('hmMsTop');
    o.미션키 = ms ? Math.round(ms.getBoundingClientRect().height) : -1;
    o.접는단추 = [].slice.call(p.querySelectorAll('.hm-fold-h')).length;
    return o;
  });
  is(기본.ms === true, '  🌅 <b>아침 미션</b>이 기본으로 펴져 있다 — 위로·TA 대본·며칠째가 ' +
     '접이 안에 있어, 접혀 있으면 사장님은 그것을 못 보십니다');
  is(기본.stk_week === true, '  📆 <b>이번 주</b>가 기본으로 펴져 있다 (자리는 맨 밑 그대로 — X48)');
  is(기본.미션키 > 300, '  아침 미션 칸이 실제로 <b>' + 기본.미션키 + 'px</b> 로 펴져 섰다 (한 줄이 아니다)');

  head('[3] 접는 단추는 <b>그대로</b>다 (6번)');
  is(기본.접는단추 >= 3, '  접이 머리가 <b>' + 기본.접는단추 + '개</b> 그대로 있다 — 펴 두었다고 접을 길을 없애지 않는다');

  head('[4] 한 번 접으면 <b>그 고름이 남는다</b> — 기본값이 사장님 손을 덮지 않는다');
  const 손 = await A.pg.evaluate(() => {
    hmFoldSet('ms', false);
    return { 접힘: hmFoldOpen('ms') === false };
  });
  is(손.접힘, '  사장님이 접으시면 <b>접힌 채로</b> 남는다 — 기본값이 그것을 되돌리지 않는다');
  await A.ctx.close();

  head('[5] 홈이 터무니없이 길어지지 않는다');
  const B = await 열기();
  const 길이 = await B.pg.evaluate(() => Math.round(document.querySelector('#dynPane').scrollHeight));
  is(길이 <= 홈선, '  기본 홈 <b>' + 길이 + 'px</b> (폰 ' + (길이 / 844).toFixed(1) + '화면) / 기준선 ' + 홈선);
  if (길이 < 홈선 - 200) console.log('      · 기준선보다 짧습니다 — 홈선을 ' + (길이 + 200) + ' 로 내려 주십시오');

  head('[6] 🗜 짧게는 <b>그대로</b> 돈다 — 기본을 펴도 한 화면 길이는 안 늘어난다');
  const 짧 = await B.pg.evaluate(() => {
    try { localStorage.setItem('apex_hm_short_v1', '1'); hmShortApply(); } catch (e) { return -1; }
    return Math.round(document.querySelector('#dynPane').scrollHeight);
  });
  is(짧 > 0 && 짧 <= 짧은선, '  🗜 짧게 홈 <b>' + 짧 + 'px</b> (폰 ' + (짧 / 844).toFixed(2) + '화면) / 기준선 ' + 짧은선);
  is(B.errs.length === 0, B.errs.length ? ('터진 것 — ' + B.errs[0]) : '  터진 곳이 없다');
  await B.ctx.close();

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '🌅 홈 점검 통과 — 시키신 칸이 켜자마자 보이고, 접을 길도 🗜 짧게도 그대로입니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
