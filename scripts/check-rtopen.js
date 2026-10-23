/* 🗺️ 홈 「지역 동선」 이 정말 동선 창까지 가나 · 폰에서 칸이 공백을 안 먹나 — 판 X172

   사장님 말씀 (2026-10-23) — 「지역동선은 왜 안되고 칸 잡아먹는 공백이 너무 많은데」.

   ── 재어 보니 ──────────────────────────────────────────────────────
   ① 홈의 「🗺️ 지역 동선 →」 (단추 넷)이 하는 일은 go('crm') 하나였습니다.
      DB 통합 CRM <b>명단</b>이 뜨고, 동선은 그 위 「🗺️ 지역 동선」 을 한 번 더 눌러야
      떴습니다. 단추 이름은 「지역 동선」 인데 동선이 안 떴습니다.
   ② 폰(390px)에서 동선 창 위 도구 띠가 <b>네 줄 · 199px</b>, 그 밑 목록은 335px 뿐.

   여기서 잽니다 —
     [1] hmRtOpen 이 CRM 안의 동선 창(apexRouteOpen)을 <b>부르나</b> — 다시 안 만드나 (5번)
         · CRM 이 다 읽었나(apexCrmReady)를 묻고 여나 — 덜 읽고 열면 약속 0 으로 섭니다 (1번)
         · 기다림에 끝이 있고, 못 열면 <b>그렇다고</b> 말하나 (4-1번 「모든 기다림에는 시간 제한」)
     [2] CRM 이 다 읽으면 apexCrmReady() 가 참이 되나 (진짜 db-crm.html 을 띄워 잽니다)
     [3] 폰 폭에서 도구 띠가 160px 안 · 단추·고르는 칸 여덟이 <b>다 보이나</b>(하나도 안 숨김 · 6번)
         · 누르는 자리 40px 이상 · 글자 13px 이상
     [4] 컴퓨터 폭은 그대로 한 줄인가 — 폰 옷이 컴퓨터로 새지 않나

   ★ 견본 서버는 check-rtteam 의 STUB 을 <b>그 파일에서 읽어</b> 씁니다 — 두 벌 두지 않습니다 (5번).
   ★ 바깥(카카오·Supabase)은 끊습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const body = (src, head) => { const i = src.indexOf(head); if (i < 0) return ''; const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

(async () => {
  const APP = fs.readFileSync('app/index.html', 'utf8');
  const CRM = fs.readFileSync('db-crm.html', 'utf8');
  const RT = fs.readFileSync('scripts/check-rtteam.js', 'utf8');
  const STUB = (RT.match(/const STUB = `([\s\S]*?)`;/) || [])[1] || '';

  console.log('\n[1] 홈 「🗺️ 지역 동선」 이 동선 창을 부른다');
  const f = body(APP, 'function hmRtOpen(');
  is(f !== '', '  hmRtOpen 을 찾았다');
  is(/apexRouteOpen\(/.test(f), '  CRM 안의 동선 창(apexRouteOpen)을 <b>부른다</b> — 명단만 열고 끝내지 않는다');
  is(!/new kakao|rtWrap|function routeOpen/.test(f), '  동선 창을 <b>여기 다시 안 만든다</b> — 한 곳(apex-route.js) (5번)');
  is(/apexCrmReady/.test(f), '  CRM 이 <b>다 읽었나</b> 묻고 연다 — 덜 읽고 열면 약속 0 으로 섭니다 (1번)');
  is(/setTimeout/.test(f) && /\+\+n>\d+/.test(f) && /toast\(/.test(f),
     '  기다림에 <b>끝</b>이 있고, 못 열면 그렇다고 말한다 — 스피너만 도는 일이 없다');
  const n = (APP.match(/onclick="hmRtOpen\(\)"/g) || []).length;
  is(n >= 3, '  홈의 「지역 동선」 단추 ' + n + '개가 다 이 한 함수로 간다');
  is(/window\.apexCrmReady=function\(\)\{ return !!\(DBL\.loaded&&!DBL\.busy\); \};/.test(CRM),
     '  db-crm.html 이 「다 읽었나」 를 밖으로 내준다 (DBL 은 let 이라 밖에서 안 보임)');

  const srv = http.createServer((q, s) => {
    const fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(fp, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const open = async (w) => {
    const ctx = await br.newContext(Object.assign({}, CLK.ctxOpt(), { viewport: { width: w, height: 844 } }));
    await CLK.pin(ctx, 14);
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e)));
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
      if (/route-km/.test(u)) return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' });
      if (/dapi\.kakao\.com/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{"errorType":"AccessDeniedError"}' });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.abort();
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=u1', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
    return { ctx, pg, errs };
  };

  console.log('\n[2] CRM 이 다 읽으면 「다 읽었다」 고 답한다');
  const A = await open(390);
  const ready = await A.pg.evaluate(() => typeof window.apexCrmReady === 'function' && window.apexCrmReady());
  is(STUB.length > 1000, '  견본 서버를 check-rtteam 에서 읽었다 (' + STUB.length + '자)');
  is(ready === true, '  apexCrmReady() — ' + ready);
  is(await A.pg.evaluate(() => typeof window.apexRouteOpen === 'function'), '  apexRouteOpen 이 밖에서 보인다');

  console.log('\n[3] 📱 폰 폭 — 도구 띠가 공백을 안 먹는다');
  await A.pg.evaluate(() => apexRouteOpen());
  await A.pg.waitForTimeout(600);
  const M = await A.pg.evaluate(() => {
    const bar = document.querySelector('.rt-bar'), side = document.getElementById('rtSide');
    const ids = ['rtDate', 'rtRegion', 'rtOwner', 'rtStay', 'rtHome', 'rtFix', 'rtKey', 'rtX'];
    const seen = ids.filter(k => { const e = document.getElementById(k); if (!e) return false; const r = e.getBoundingClientRect(); return r.width >= 40 && r.height > 0 && getComputedStyle(e).display !== 'none'; });
    const hs = ids.map(k => { const e = document.getElementById(k); return e ? Math.round(e.getBoundingClientRect().height) : 0; });
    const fs = ids.map(k => { const e = document.getElementById(k); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; });
    const over = document.documentElement.scrollWidth > window.innerWidth + 1;
    return { bar: Math.round(bar.getBoundingClientRect().height), side: Math.round(side.getBoundingClientRect().height),
             seen: seen.length, n: ids.length, hs: hs, fs: fs, over: over,
             title: !!(bar.querySelector('b') && bar.querySelector('b').getBoundingClientRect().width > 0) };
  });
  is(M.bar <= 160, '  도구 띠 ' + M.bar + 'px — 160px 안 (손대기 전 199px · 네 줄)');
  is(M.seen === M.n && M.title, '  단추·고르는 칸 ' + M.seen + '/' + M.n + ' 다 보인다 — 하나도 안 숨겼다 (6번)');
  is(M.hs.every(h => h >= 40), '  누르는 자리 40px 이상 — ' + M.hs.join(' · '));
  is(M.fs.every(x => x >= 13), '  글자 13px 이상 — ' + M.fs.join(' · '));
  is(!M.over, '  가로로 안 넘친다');
  is(M.side >= 350, '  그 밑 목록 칸 ' + M.side + 'px (손대기 전 335px)');
  is(!A.errs.length, '  조용히 터진 곳이 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));
  await A.ctx.close();

  console.log('\n[4] 🖥️ 컴퓨터 폭은 그대로 — 폰 옷이 안 샌다');
  const B = await open(1280);
  await B.pg.evaluate(() => apexRouteOpen());
  await B.pg.waitForTimeout(500);
  const D = await B.pg.evaluate(() => {
    const bar = document.querySelector('.rt-bar');
    return { bar: Math.round(bar.getBoundingClientRect().height),
             date: Math.round(document.getElementById('rtDate').getBoundingClientRect().width) };
  });
  is(D.bar <= 70, '  도구 띠 한 줄 — ' + D.bar + 'px');
  is(D.date < 400, '  날짜 칸이 띠를 다 먹지 않는다 — ' + D.date + 'px');
  await B.ctx.close();

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 「지역 동선」 을 눌렀는데 동선이 안 뜨면 단추가 거짓말을 합니다.'); process.exit(1); }
  console.log('✓ 홈에서 누르면 동선 창이 뜨고, 폰에서도 칸이 공백을 안 먹습니다.');
})().catch(e => { console.error(e); process.exit(1); });
