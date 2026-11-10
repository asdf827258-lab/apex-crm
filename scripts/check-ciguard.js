/* ══ 🧱 check-ciguard — 점검이 <b>사장님의 진짜 Supabase</b> 를 부르지 않는가 (판 X398) ══════
   사장님 말씀 (2026-11-10) 「병합되면 ci 진짜 서버 부르는것도 해줘」.

   ⚠ 재어 보니 (2026-11-10 서버 로그) CI 점검이 가짜 id(me · u1 · c1)로 진짜 서버를 하루
     수천 번 불렀습니다 — saved_reports 1,735 · daily_checks 822 · calls 566 · health_checks 450.
     브라우저를 띄우는 자 120가지가 바깥을 막지 않았습니다(check-netblock 눈금).
     ★ 막는 자리는 <b>한 곳</b> — scripts/lib-netguard.js. run-checks 가 모든 점검에 얹습니다.

   보는 것
     [1] run-checks 가 모든 점검을 lib-netguard 를 얹어 돌린다 (NODE_OPTIONS)
     [2] 끊는 주소가 맞다 — 사장님 서버(https · wss)는 끊고, CDN 의 supabase-js ·
         supabase.com 안내 주소 · localhost 는 안 끊는다 (8번 — 헛것을 막지 않게)
     [3] ★★ <b>막은 판</b> — 진짜 브라우저로 다섯 길(손잡이 없음 · 자가 다 흘림 · fallback ·
         창 안 fetch · route.fetch)을 다 해 봐도 <b>서버에 0번</b> 닿는다
         · 자가 지어 준 가짜 답(fulfill)은 그대로 · localhost 도 그대로 · 인쇄용 빈 창도 그대로
     [4] ★ <b>안 막은 판</b> — 같은 시험이 <b>닿는 것을 본다</b> (안 울리는 알람이 아니게 · 8번)
   ★ 진짜 서버를 <b>한 번도 안 부릅니다</b> — 브라우저에게 「*.supabase.co 는 이 컴퓨터」 라고
     일러 두고(host-resolver-rules) 여기 세운 작은 서버가 받습니다. 프록시도 끕니다.
     막개는 제 규칙을 <b>맨 앞</b>에 두므로 막은 판에서는 그 「이 컴퓨터」 약속이 집니다.
   ⚠ 되돌림 — run-checks 에서 NODE_OPTIONS 줄을 빼면 [1] 이, lib-netguard 의 끊개를 빼면 [3] 이 웁니다.
   ══════════════════════════════════════════════════════════════════ */
const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const G = require('./lib-netguard.js');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('\n[1] run-checks 가 모든 점검에 lib-netguard 를 얹는가');
const RC = fs.readFileSync(path.join(__dirname, 'run-checks.js'), 'utf8');
is(/require\(['"]\.\/lib-netguard(\.js)?['"]\)/.test(RC), '  run-checks 가 lib-netguard 를 부른다');
is(/execSync\([\s\S]{0,400}NODE_OPTIONS:\s*NETGUARD\.nodeOptions\(process\.env\.NODE_OPTIONS\)/.test(RC),
   '  ★ 점검을 돌리는 execSync 의 env 에 NODE_OPTIONS — 있던 값은 지키고 덧붙인다');
const no = G.nodeOptions('--max-old-space-size=4096');
is(/^--max-old-space-size=4096 --require=/.test(no) && G.nodeOptions(no) === no, '  있던 NODE_OPTIONS 는 그대로 · 두 번 얹지 않는다');

console.log('\n[2] 끊는 주소가 맞나 — 사장님 서버만');
const CUT = ['https://miakdhxtqofpndtlyzxa.supabase.co/rest/v1/dbs?select=id', 'wss://miakdhxtqofpndtlyzxa.supabase.co/realtime/v1/websocket',
  'https://miakdhxtqofpndtlyzxa.supabase.co', 'http://a.supabase.co:8080/x'];
const KEEP = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'https://supabase.com/dashboard/project/x',
  'https://status.supabase.com/', 'http://127.0.0.1:5000/app/index.html?u=https://a.supabase.co', 'https://evilsupabase.co/'];
is(CUT.every(G.isBad), '  끊는다 — ' + CUT.filter(u => !G.isBad(u)).join(' · ') + (CUT.every(G.isBad) ? '사장님 서버 https · wss' : ' 가 안 끊깁니다'));
is(KEEP.every(u => !G.isBad(u)), '  안 끊는다 — CDN · 안내 주소 · localhost' + (KEEP.filter(G.isBad).length ? ' ✗ ' + KEEP.filter(G.isBad).join(' · ') : ''));

/* 시험 — 자식 node 로 브라우저를 띄웁니다(run-checks 와 같은 길: NODE_OPTIONS) */
const PROBE = `
const { chromium } = require('playwright');
const P = +process.env.PORT, H = 'http://miakdhxtqofpndtlyzxa.supabase.co:' + P;
const go = (p, u) => p.goto(u, { timeout: 8000 }).then(x => 'ok ' + x.status()).catch(e => 'X ' + String(e.message).split('\\n')[0].slice(0, 60));
(async () => {
  const R = {};
  const b = await chromium.launch({ args: ['--no-proxy-server', '--host-resolver-rules=MAP *.supabase.co 127.0.0.1:' + P] });
  const p1 = await b.newPage(); R.a = await go(p1, H + '/a');
  const c2 = await b.newContext(); await c2.route('**://**', r => r.continue()); const p2 = await c2.newPage(); R.b = await go(p2, H + '/b');
  R.local = await go(await c2.newPage(), 'http://127.0.0.1:' + P + '/ok');   /* 새 창에서 — 끊긴 창은 오류 쪽으로 넘어가는 중이라 */
  const c3 = await b.newContext(); const p3 = await c3.newPage(); await p3.route('**/*', r => r.fallback()); R.c = await go(p3, H + '/c');
  const c4 = await b.newContext(); const p4 = await c4.newPage();
  await p4.route('**/*', r => /\\/d$/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'text/plain', body: 'stub' }) : r.continue());
  R.d = await go(p4, H + '/d'); R.dBody = await p4.evaluate(() => document.body.innerText).catch(() => '');
  const p4b = await c4.newPage(); await p4b.goto('http://127.0.0.1:' + P + '/ok');
  R.e = await p4b.evaluate(u => fetch(u).then(r => 'ok ' + r.status).catch(e => 'X ' + e.message), H + '/e');
  /* route.fetch 는 node 가 직접 부르므로 브라우저의 「이 컴퓨터」 약속이 안 먹습니다 — 안 막은 판에서는 안 합니다(진짜 서버에 닿을 수 있어서) */
  if (process.env.SKIPF !== '1') {
  const c5 = await b.newContext(); const p5 = await c5.newPage();
  await p5.route('**/f', async r => { try { const res = await r.fetch({ timeout: 4000 }); await r.fulfill({ response: res }); R.fWhy = 'fetched'; }
    catch (e) { R.fWhy = String(e.message).slice(0, 80); try { await r.abort(); } catch (x) {} } });
  R.f = await go(p5, H + '/f');
  }
  /* 인쇄용 빈 창(about:blank) — 창 묶음에 가로채기를 걸면 여기서 ui.css 가 안 내려옵니다(check-uiprint · 판 X398 에서 물림) */
  const c6 = await b.newContext(); const p6 = await c6.newPage(); await p6.goto('http://127.0.0.1:' + P + '/ok');
  const [pop] = await Promise.all([p6.waitForEvent('popup'), p6.evaluate(P => { const w = window.open('', '_blank');
    w.document.write('<link rel=stylesheet href="http://127.0.0.1:' + P + '/pop.css"><p id=x>x</p>'); w.document.close(); }, P)]);
  R.pop = await pop.waitForFunction(() => getComputedStyle(document.getElementById('x')).color === 'rgb(255, 0, 0)', null, { timeout: 6000 }).then(() => 'ok').catch(() => 'X');
  await b.close(); console.log('@@' + JSON.stringify(R));
})().catch(e => { console.log('@@' + JSON.stringify({ err: String(e.message || e) })); });`;

(async () => {
  const hits = [];
  const srv = http.createServer((q, s) => {
    if (q.url === '/pop.css') { s.writeHead(200, { 'content-type': 'text/css' }); s.end('#x{color:#f00}'); return; }
    if (q.url !== '/ok') hits.push(q.url); s.writeHead(200, { 'content-type': 'text/plain' }); s.end('ok'); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const PORT = srv.address().port;
  const run = (guard) => new Promise(res => {
    hits.length = 0;
    const env = Object.assign({}, process.env, { PORT: String(PORT), SKIPF: guard ? '0' : '1' });
    env.NODE_OPTIONS = guard ? G.nodeOptions(process.env.NODE_OPTIONS) : String(process.env.NODE_OPTIONS || '').replace(/--require=\S*lib-netguard\.js/g, '').trim();
    cp.execFile(process.execPath, ['-e', PROBE], { cwd: ROOT, env, timeout: 90000 }, (e, out) => {
      const m = String(out || '').match(/@@(.*)/); let R = {};
      try { R = m ? JSON.parse(m[1]) : { err: String(e && e.message) }; } catch (x) { R = { err: 'parse' }; }
      res({ R, hits: hits.slice() });
    });
  });

  console.log('\n[3] ★★ 막은 판 — 다섯 길 모두 서버에 0번');
  const A = await run(true);
  if (A.R.err) is(false, '  시험이 안 돌았습니다 — ' + A.R.err);
  const tag = (h) => h.map(u => u.replace(/\?.*$/, '')).join(' ');
  is(A.hits.length === 0, '  ★★ 서버가 받은 것 ' + A.hits.length + '번' + (A.hits.length ? ' — ' + tag(A.hits) : ''));
  is(/^X /.test(A.R.a || '') && /^X /.test(A.R.b || '') && /^X /.test(A.R.c || ''), '  손잡이 없음 · 자가 다 흘림(continue) · fallback — 다 끊김 · ' + [A.R.a, A.R.b, A.R.c].map(x => (x || '').slice(0, 30)).join(' | '));
  is(/^X /.test(A.R.e || ''), '  창 안 fetch() — 끊김 · ' + (A.R.e || ''));
  is(/lib-netguard/.test(A.R.fWhy || ''), '  route.fetch()(node 쪽에서 부르는 길) — 끊김 · ' + (A.R.fWhy || ''));
  is(/^ok 200/.test(A.R.d || '') && A.R.dBody === 'stub', '  자가 지어 준 가짜 답(fulfill)은 그대로 — 「' + (A.R.dBody || '') + '」');
  is(/^ok 200/.test(A.R.local || ''), '  localhost 는 그대로 — ' + (A.R.local || ''));
  is(A.R.pop === 'ok', '  ★ 인쇄용 빈 창(about:blank)이 제 CSS 를 받는다 — 창 묶음 가로채기로 막으면 여기가 깨집니다(check-uiprint 에서 물림) · ' + (A.R.pop || ''));

  console.log('\n[4] ★ 안 막은 판 — 같은 시험이 <b>닿는 것을 본다</b> (안 울리는 알람이 아니게)');
  const B = await run(false);
  const got = ['/a', '/b', '/c', '/e'].filter(k => B.hits.some(h => h.indexOf(k) === 0));
  is(got.length === 4, '  막개가 없으면 네 길이 다 닿습니다 — ' + (got.join(' ') || '0') + ' (이 시험이 새는 것을 볼 수 있다는 뜻)');
  is(B.R.dBody === 'stub' && !B.hits.some(h => h.indexOf('/d') === 0), '  가짜 답은 안 막은 판에서도 망에 안 나갑니다 — 막개가 바꾸는 것이 없다');

  srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불 — 점검이 사장님 서버를 부르면 무료 한도를 갉아먹고, 서버 상태가 점검 답을 바꿉니다') : '✓ 🧱 점검 브라우저는 사장님 Supabase 에 닿지 않습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
