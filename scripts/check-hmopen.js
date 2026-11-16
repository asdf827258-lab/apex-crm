/* 🌅 <b>홈 접이를 펴 두면 「지금 할 것」 이 밀려나는가</b> (판 X459)

   ── 제가 데인 자리입니다 ────────────────────────────────────────
   사장님 말씀 2026-11-16 「crm 키니끼 안되있는것들이 많은데」 →
   「<b>오늘 부분이 하나도 안되어있는데</b>」.

   재어 보니 <b>없는 것이 아니었습니다.</b> 시키신 다섯(지역동선 · 🔦 투어 ·
   캘린더 · 아침 미션 · 실명)이 다 서 있는데, HM_FOLD_DEF 가 비어 있어
   홈의 접이가 하나도 안 펴진 채였습니다 — 켜면 첫 화면에 고객 띠와
   다섯 걸음만 보이고 나머지는 <b>한 줄로 접혀</b> 있었습니다.

   ⚠⚠ 그래서 <b>기본을 펴짐으로 바꿨다가 되돌렸습니다.</b> 아침 미션이
     85 → 597px 로 서면서 <b>「지금 할 것」 이 y977 로 밀려 첫 화면 밖</b>으로
     나갔습니다. 그것은 <b>사장님의 지난 말씀</b>입니다 — 판 X187
     「<b>지금할것을 맨위로</b>」. 자 여섯이 한꺼번에 울어 저를 잡았습니다.

   ★★ <b>접혀 있는 것은 실수가 아니라 사장님 말씀을 지키는 것입니다.</b>
     접는 까닭도 사장님 말씀 「<b>클릭하면 펼쳐지고</b> 할 수 있도록」 입니다.

   ── 그래서 이 자가 하는 일 ──────────────────────────────────────
   「펴 두어도 되나」 를 <b>실제로 펴 보고</b> 잽니다. 다음 세션이 같은
   생각으로 HM_FOLD_DEF 를 채우면, 그 자리에서 <b>무엇이 밀려나는지</b>
   수로 보여 줍니다 — 저처럼 CI 여섯 개를 돌려 보고서야 알지 않도록.

     [1] 지금 기본으로 펴 둔 칸이 있다면, 그 때문에 「지금 할 것」 이
         <b>첫 화면 밖</b>으로 나가지 않는다.
     [2] 접힌 채로도 머리글이 <b>무엇이 들었는지</b> 말한다 (1번) —
         접혀 있는데 머리글까지 비면 그것은 정말 「없는 것」 입니다.
     [3] 🗜 짧게는 그대로 돈다 — 한 화면으로 줄이는 길이 살아 있다.
     [4] ★ <b>펴 보면 무엇이 밀려나는지</b> 를 적어 둔다 (지어내지 않고 잽니다).

   ⚠ 이 자는 「펴라」 고도 「접으라」 고도 하지 않습니다. <b>펴면 무엇이
     깨지는지</b>만 말합니다 — 무엇을 보실지는 사장님이 정하실 일입니다 (1번). */
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
const 화면 = 844;

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
/* 「지금 할 것」 의 아랫변 — <b>check-hmms 가 보는 그 자리(#hmJobHost)</b>를 그대로 봅니다 (5번).
   ⚠ 처음에 #hmJobWrap(바깥 테두리)을 쟀다가 2,023px 이 나와 늘 빨간불이었습니다 —
     두 자가 다른 자리를 보면 한쪽만 고쳐집니다. */
const 지금할것끝 = () => {
  const p = document.getElementById('dynPane');
  const w = document.getElementById('hmJobHost');
  if (!p || !w) return -1;
  const top = p.getBoundingClientRect().top;
  const b = w.getBoundingClientRect();
  return Math.round(b.top - top + b.height);
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const 열기 = async (폄) => {
    const ctx = await br.newContext({ viewport: { width: 430, height: 화면 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                    ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE, { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
    await pg.evaluate(SEED);
    await pg.waitForTimeout(2600);
    if (폄 && 폄.length) {
      await pg.evaluate((ks) => { ks.forEach(k => { try { hmFoldSet(k, true); } catch (e) {} }); go('home'); }, 폄);
      await pg.waitForTimeout(2400);
    }
    return { pg, ctx, errs };
  };

  head('[1] 지금 <b>기본으로 펴 둔 칸</b> 때문에 「지금 할 것」 이 밀려나지 않았다');
  const SRC = fs.readFileSync(FILE, 'utf8');
  const 적힌 = (SRC.match(/var\s+HM_FOLD_DEF\s*=\s*\{([\s\S]{0,300}?)\}/) || [, ''])[1]
    .replace(/\/\*[\s\S]*?\*\//g, ' ').match(/[a-z_]+\s*:/g) || [];
  const A = await 열기();
  const 지금 = await A.pg.evaluate(지금할것끝);
  const 홈 = await A.pg.evaluate(() => Math.round(document.querySelector('#dynPane').scrollHeight));
  console.log('      · HM_FOLD_DEF 에 적힌 칸 ' + 적힌.length + '개' +
              (적힌.length ? (' — ' + 적힌.join(' ').replace(/:/g, '')) : ' (비어 있음)'));
  console.log('      · 「지금 할 것」 아랫변 ' + 지금 + 'px · 홈 ' + 홈 + 'px (' + (홈 / 화면).toFixed(2) + '화면)');
  /* ★ <b>check-hmms 가 이미 묻는 것을 또 묻지 않습니다</b> (5번) — 그 자가 「지금 할 것」 이
       첫 화면 안인지를 봅니다. 이 자는 <b>HM_FOLD_DEF 를 채웠을 때만</b> 그 값이
       나빠졌는지를 봅니다. 두 자가 같은 것을 각자 재면 한쪽만 고쳐집니다. */
  if (!적힌.length) {
    is(true, 'HM_FOLD_DEF 가 비어 있다 — 「지금 할 것」 자리는 <b>check-hmms</b> 가 봅니다 (5번)');
  } else {
    /* ⚠ <b>견줄 바닥은 「다 접었을 때」 입니다.</b> 처음에 그냥 한 번 더 열어 재었더니
         같은 기본값으로 두 번 재어 늘 같은 수가 나왔습니다 — <b>안 울리는 알람</b>이었습니다 (8번).
         그래서 적힌 칸을 <b>하나하나 접고</b> 잽니다. */
    const B0 = await 열기();
    await B0.pg.evaluate((ks) => { ks.forEach(k => { try { hmFoldSet(k, false); } catch (e) {} }); go('home'); },
                         적힌.map(x => x.replace(/\s*:/, '')));
    await B0.pg.waitForTimeout(2200);
    const 민값 = await B0.pg.evaluate(지금할것끝);
    await B0.ctx.close();
    is(지금 <= 민값 + 8,
       '★★ 펴 둔 칸 때문에 「지금 할 것」 이 <b>밀려나지 않았다</b> — 아랫변 ' + 지금 +
       'px (다 접었을 때 ' + 민값 + 'px · 판 X187 사장님 말씀 「지금할것을 맨위로」)');
  }

  head('[2] 접힌 채로도 머리글이 <b>무엇이 들었는지</b> 말한다 (1번)');
  const 머리 = await A.pg.evaluate(() => {
    const out = [];
    [].slice.call(document.querySelectorAll('#dynPane .hm-fold-h')).forEach(h => {
      const 폄 = h.getAttribute('aria-expanded') !== 'false';
      const t = (h.innerText || '').replace(/\s+/g, ' ').trim();
      if (!폄) out.push({ t: t.slice(0, 60), 글자: t.length });
    });
    return out;
  });
  is(머리.length > 0, '  접힌 칸이 <b>' + 머리.length + '개</b> 있다 (0이면 이 자가 눈이 먼 것입니다 · 8번)');
  const 벙어리 = 머리.filter(x => x.글자 < 8);
  is(벙어리.length === 0, '  ★ 접힌 칸이 모두 <b>제 머리글로 말한다</b>' +
     (벙어리.length ? (' ← 말 없는 칸 ' + 벙어리.length + '개') : ' — 접혀 있어도 무엇이 들었는지 보입니다'));

  head('[3] 🗜 짧게는 그대로 돈다');
  const 짧 = await A.pg.evaluate(() => {
    try { localStorage.setItem('apex_hm_short_v1', '1'); hmShortApply(); } catch (e) { return -1; }
    return Math.round(document.querySelector('#dynPane').scrollHeight);
  });
  is(짧 > 0 && 짧 < 홈, '  🗜 짧게 홈 <b>' + 짧 + 'px</b> — 기본 ' + 홈 + 'px 에서 줄어든다');
  await A.ctx.close();

  head('[4] ★ <b>펴 보면 무엇이 밀려나는지</b> — 재서 적습니다 (지어내지 않습니다)');
  const B = await 열기(['ms', 'stk_week']);
  const 편지금 = await B.pg.evaluate(지금할것끝);
  const 편홈 = await B.pg.evaluate(() => Math.round(document.querySelector('#dynPane').scrollHeight));
  console.log('      · 🌅 아침 미션 · 📆 이번 주를 펴면 —');
  console.log('        「지금 할 것」 아랫변 ' + 지금 + ' → <b>' + 편지금 + 'px</b>' +
              (편지금 > 화면 ? '  ⚠ 첫 화면 밖' : '  (첫 화면 안)'));
  console.log('        홈 ' + 홈 + ' → <b>' + 편홈 + 'px</b>');
  is(true, '재어 적었습니다 — <b>펴면 「지금 할 것」 이 ' + (편지금 > 화면 ? '밀려납니다' : '그대로입니다') +
     '</b>. 무엇을 보실지는 사장님이 정하실 일입니다 (1번)');
  is(B.errs.length === 0, B.errs.length ? ('터진 것 — ' + B.errs[0]) : '  터진 곳이 없다');
  await B.ctx.close();

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '🌅 홈 접이 점검 통과 — 「지금 할 것」 이 맨 위에 있고, 접힌 칸도 제 입으로 말합니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
