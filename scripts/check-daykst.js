/* ══════════════════════════════════════════════════════════════════
   check-daykst.js — 🕐 <b>「오늘」 이 어느 시각에 물어도 한국 날짜인가.</b>

   ── 왜 이 자가 따로 있나 ─────────────────────────────────────────
   check-clockfree [5][6] 은 <b>글</b>을 봅니다 — 「toISOString() 으로
   날짜를 뽑는 자리가 없나」. 몇 초면 끝나 좋지만, <b>글이 맞아도 값이
   틀릴</b> 수 있습니다. 이 저장소에서 두 번 겪었습니다 —
     · 🚦 한도 띠 : 글은 멀쩡한데 <b>띠가 화면에 안 붙어</b> 있었습니다
     · 🕐 날짜    : cmToday 가 UTC 였는데 <b>이름이 *Today() 라서</b>
                    자가 봤고, rdDays·analysisDate 는 <b>이름이 달라</b>
                    열넷이 그냥 지나갔습니다
   그래서 이 자는 <b>브라우저를 띄우고 시계를 못 박아 값을 읽습니다.</b>

   ── 어떻게 ───────────────────────────────────────────────────────
   시계를 <b>2026-10-05 16:00 UTC</b> 에 못 박습니다 — 한국으로는
   <b>2026-10-06 01:00</b> 입니다. 그러면
     · 맨 UTC 로 뽑으면   → <b>2026-10-05</b> (어제)
     · 한국 날짜로 뽑으면 → <b>2026-10-06</b> (오늘)
   두 답이 <b>하루 갈립니다.</b> 그 틈에서 값을 읽으면 어느 쪽인지
   숨길 수 없습니다. ★ <b>시계를 못 박았으므로 CI 가 몇 시에 돌아도
   같은 것을 잽니다</b> (check-clockfree 가 지키는 그 규칙입니다).

   ⚠ 이 자가 왜 필요한지 — 사장님 폰에서 실제로 이랬습니다 :
     한국 시간 <b>밤 0시~아침 9시</b> 사이에
       · 전화를 걸고 기록해도 명단이 <b>「❄️ 기록 없음」</b>
       · <b>배정일·계약일</b>이 하루 이른 날짜로 서버에 담김
       · <b>고객이 보는 제안서</b>에 어제 날짜가 찍힘
     아침에 일하시는 분에게는 <b>늘 그 시각</b>입니다.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] app/index.html — 「오늘」 을 내는 자리가 다 한국 날짜인가
     [2] app/index.html — <b>「며칠 됐나」 셈</b>(rdDays·cmDays)이 맞나
     [3] db-crm.html    — 배정일·계약일 기본값이 한국 날짜인가
     [4] app/finance.html — 환율 적은 날이 한국 날짜인가
     [5] ★ 두 화면이 <b>같은 날</b>이라고 답하나 (본체 ↔ CRM)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
/* 🕰 <b>시계를 못 박습니다</b> — 한 곳에서 (lib-clock.js · 판 X83).
   CI 가 <b>몇 시에 돌아도 같은 것을 재야</b> 합니다. 판 X78 에서 홈 높이 자
   넷을 박고, 판 X82 에서 check-crmask 가 <b>밤 11시 반에만</b> 빨간불을
   켜는 것을 보고 이 갈래를 끝까지 박기로 했습니다.                 */
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

/* 못 박은 때 — 한국과 UTC 가 <b>하루 갈리는</b> 틈 */
const 못박은때 = new Date('2026-10-05T16:00:00Z');
const 어제UTC = '2026-10-05';   /* 맨 UTC 로 뽑으면 이것 */
const 오늘KST = '2026-10-06';   /* 한국 날짜로 뽑으면 이것 */

/* 서버를 안 부르는 껍데기 — 이 자는 <b>날짜만</b> 봅니다 */
const STUB = `window.supabase={createClient:function(){return {
 from:function(){var b={};['select','eq','in','order','limit','range','single','maybeSingle',
  'insert','update','upsert','delete','is','not','or','gte','lte','gt','lt','like','ilike',
  'contains','neq'].forEach(function(k){b[k]=function(){return b}});
  b.then=function(r){return Promise.resolve({data:[],error:null}).then(r)};
  b.catch=function(){return b};return b},
 auth:{onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
  getSession:function(){return Promise.resolve({data:{session:null},error:null})},
  getUser:function(){return Promise.resolve({data:{user:null},error:null})},
  signOut:function(){return Promise.resolve({})}},
 channel:function(){return {on:function(){return this},subscribe:function(){return this},
  unsubscribe:function(){}}},removeChannel:function(){}}}};`;

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();

  const 열 = async (어디) => {
    const kctx = await br.newContext(CLK.ctxOpt());
    await CLK.pin(kctx, 14);
    const pg = await kctx.newPage();
    /* ★ 시계를 못 박는다 — 이 한 줄이 이 자의 뼈대다 */
    await pg.clock.setFixedTime(못박은때);
    /* ★ <b>바깥을 막는다</b> — 이 꼴('**://**')이 이 저장소의 규약입니다.
       안 막으면 CI 에서 <b>사장님 진짜 서버</b>를 읽습니다 (check-netblock). */
    await pg.route('**://**', async r => {
      const u = r.request().url();
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + 어디, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(1800);
    return pg;
  };
  /* 화면 안에서 불러 보고, 터지면 터졌다고 그대로 가져온다 (삼키지 않는다) */
  const 물어 = (pg, 이름들) => pg.evaluate(ns => {
    const o = {};
    ns.forEach(nm => {
      try { o[nm] = String(eval(nm)); } catch (e) { o[nm] = '터짐: ' + e.message; }
    });
    o.__맨UTC = new Date().toISOString().slice(0, 10);
    return o;
  }, 이름들);

  console.log('  못 박은 때 : ' + 못박은때.toISOString() + '  (= 한국 ' + 오늘KST + ' 01:00)');
  console.log('  맨 UTC → ' + 어제UTC + '  ·  한국 날짜 → ' + 오늘KST);

  head('[1] <b>app/index.html</b> — 「오늘」 을 내는 자리가 다 한국 날짜다');
  const A = await 열('/app/index.html');
  const a = await 물어(A, ['ccToday()', 'cmToday()', 'mstToday()', 'arToday()', 'nbToday()', 'hxToday()', 'mcalToday()']);
  is(a.__맨UTC === 어제UTC,
     '  못이 박혔다 — 맨 UTC 가 ' + a.__맨UTC + ' 다 (' + 어제UTC + ' 여야 맞습니다)');
  Object.keys(a).filter(k => k !== '__맨UTC').forEach(k => {
    is(a[k] === 오늘KST, '  <b>' + k + '</b> → ' + a[k] + (a[k] === 오늘KST ? '' : ' ← 한국 날짜가 아닙니다'));
  });

  head('[2] ★★ <b>「며칠 됐나」 셈</b>이 맞다 — 하루가 밀리면 여기가 울린다');
  const d = await A.evaluate((오늘) => {
    const g = f => { try { return f(); } catch (e) { return '터짐: ' + e.message; } };
    const 어제 = (() => { const x = new Date(오늘 + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); })();
    return { '오늘': g(() => rdDays(오늘)), '어제': g(() => rdDays(어제)),
             'cm오늘': g(() => cmDays(오늘)), 'cm어제': g(() => cmDays(어제)) };
  }, 오늘KST);
  is(String(d['오늘']) === '0', '  ★★ rdDays(오늘) = <b>0</b> · 실제 ' + d['오늘'] + ' (UTC 로 세면 -1 입니다)');
  is(String(d['어제']) === '1', '  ★★ rdDays(어제) = <b>1</b> · 실제 ' + d['어제']);
  is(String(d['cm오늘']) === '0', '  ★★ cmDays(오늘) = <b>0</b> · 실제 ' + d['cm오늘'] + ' — 「❄️ 기록 없음」 이 찍혔던 자리입니다');
  is(String(d['cm어제']) === '1', '  ★★ cmDays(어제) = <b>1</b> · 실제 ' + d['cm어제']);

  head('[3] ★★ <b>db-crm.html</b> — 배정일·계약일 기본값이 한국 날짜다 (서버에 담김)');
  const D = await 열('/db-crm.html');
  const b = await 물어(D, ['crmToday()', 'todayLocal()', 'today()']);
  is(b.__맨UTC === 어제UTC, '  못이 박혔다 — 맨 UTC ' + b.__맨UTC);
  is(b['crmToday()'] === 오늘KST, '  <b>crmToday()</b> → ' + b['crmToday()']);
  is(b['today()'] === 오늘KST,
     '  ★★ <b>today()</b> → ' + b['today()'] + ' — 배정일·계약일·증권전달일의 기본값입니다');
  is(b['todayLocal()'] === 오늘KST,
     '  ★ 옛 이름도 같은 답 — <b>기기 시각이 아니라</b> 한국 날짜다 (' + b['todayLocal()'] + ')');

  head('[4] <b>app/finance.html</b> — 환율 적은 날이 한국 날짜다');
  const F = await 열('/app/finance.html');
  const c = await 물어(F, ['fxToday()']);
  is(c.__맨UTC === 어제UTC, '  못이 박혔다 — 맨 UTC ' + c.__맨UTC);
  is(c['fxToday()'] === 오늘KST, '  <b>fxToday()</b> → ' + c['fxToday()']);

  head('[5] ★ 세 화면이 <b>같은 날</b>이라고 답한다');
  const 답들 = { '본체 ccToday': a['ccToday()'], 'CRM today': b['today()'], '계산기 fxToday': c['fxToday()'] };
  const 모음 = Object.keys(답들).map(k => k + ' ' + 답들[k]);
  is(new Set(Object.values(답들)).size === 1,
     '  ★ 한 날로 모인다 — ' + 모음.join(' · '));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 아침에 일하시면 하루가 밀립니다.'); process.exit(1); }
  console.log('✓ ' + n + '가지 모두 통과 — 몇 시에 물어도 한국 날짜 하나로 답합니다.');
})().catch(e => { console.log('터짐: ' + (e && e.stack || e)); process.exit(1); });
