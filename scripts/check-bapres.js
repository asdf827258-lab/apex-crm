/* 🔳 보장분석 전·후 — 발표가 <b>화면 안 가운데</b>에 서고, 폰·태블릿에서도 <b>인쇄가 되나</b> (판 X587)

   사장님 말씀 2026-11-27 「프레젠테이션 모드랑, 인쇄 버튼 작동 문제랑 해결해볼래」 → 「몰라 너가 확인해봐」

   CRM 처럼 <b>iframe(allow=fullscreen) 안에</b> 띄우고 다섯 크기에서 발표를 눌러 재어 보니 —
     ■ 갤탭 세로(800 폭) — 무대가 <b>왼쪽 밖으로 240px</b> 나가 앞이 잘렸다. 폰(390) — 445px.
       갤탭 가로(1280) — 14px 잘리고 가운데가 아님. PC(1440)도 왼쪽 113 · 오른쪽 47 로 치우침.
       까닭: .deck-fit 이 flex 가운데 정렬인데, 가운데를 <b>줄이기 전 1280</b>으로 잡고 거기에 marginLeft 를 또 더했다.
     ■ 인쇄 — PC 크롬은 iframe 안의 window.print() 가 그 화면만 뽑지만, 폰·태블릿 브라우저는
       iframe 안의 인쇄가 막히거나 바깥(CRM 전체)을 찍는 일이 있다. 「모든 담보 표」 는 <b>iframe 속 iframe</b> 이라 더하다.

   여기서 못 박는 것
     [1] 다섯 크기(PC · 갤탭 가로/세로 · 폰 세로/가로) — 발표 무대가 화면 <b>안</b>에 있고 좌우 여백이 같다(±2px) · 세로도 가운데
     [2] 갤탭(안드로이드 크롬 UA) + iframe — 인쇄 단추 여섯(맨 밑 🖨·📄 다섯 + 위 띠 가로)이 저마다
         <b>새 창</b>을 열고 거기서 print() 를 부른다 · 새 창에 CRM 이 안 섞인다 · 원래 화면은 제자리(가로 무대·보고서 꼴 걷힘)
     [3] PC 는 <b>그대로</b> — 새 창 없이 그 자리에서 인쇄
   ⚠ 되돌림 둘 — 가운데를 flex 에 맡기면 [1] 이, 폰을 PC 로 치면 [2] 가 웁니다.                         */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
let OVR = null;
const HOST = '<!doctype html><meta charset=utf-8><body style="margin:0"><div style="height:56px;background:#123;color:#fff">CRM-TOPBAR-MARK</div>' +
  '<iframe id="baFrame" allow="fullscreen" src="/app/ba.html" style="width:100%;height:calc(100vh - 56px);border:0"></iframe>';
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
  if (p === '/host.html') { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(HOST); return; }
  if (p === '/app/ba.html' && OVR) { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(OVR); return; }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : /\.css$/.test(f) ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const VPS = [{ n: 'PC 1440×900', w: 1440, h: 900 }, { n: '갤탭 가로 1280×800', w: 1280, h: 800, m: 1 }, { n: '갤탭 세로 800×1280', w: 800, h: 1280, m: 1 },
  { n: '폰 세로 390×844', w: 390, h: 844, m: 1 }, { n: '폰 가로 844×390', w: 844, h: 390, m: 1 }];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const host = 'http://127.0.0.1:' + srv.address().port + '/host.html';
  const br = await chromium.launch();
  const ctxOf = (vp, ua) => br.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.m, isMobile: !!vp.m, userAgent: ua || undefined });
  const route = async (ctx) => ctx.route('**://**', r => { const u = r.request().url(); if (/^http:\/\/127\.0\.0\.1/.test(u)) r.continue(); else r.abort(); });
  const frameOf = async (pg) => { await pg.goto(host, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(900); return pg.frame({ url: /ba\.html/ }); };

  /* [1] 발표 무대 자리 */
  const stage = async (vp) => {
    const ctx = await ctxOf(vp); await route(ctx); const pg = await ctx.newPage(); const fr = await frameOf(pg);
    /* 견본 자료 — 앱이 스스로 넣는 예시 고객이다. 실제 고객이 아니다 */
    await fr.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; go('show'); });
    await pg.waitForTimeout(300);
    await fr.evaluate(() => deckShow(true)); await pg.waitForTimeout(500);
    const r = await fr.evaluate(() => { const c = document.querySelector('#app .show > .cur'), b = c.getBoundingClientRect(), bar = document.querySelector('.deckbar');
      const bh = bar && getComputedStyle(bar).position === 'fixed' ? bar.offsetHeight : 0;
      /* 위는 무대 자리(deckWrap) 꼭대기부터 잰다 — 폰 세로는 그 위에 「가로로 돌리면 크게」 안내 띠가 있다 */
      const wt = Math.max(0, document.getElementById('deckWrap').getBoundingClientRect().top);
      return { x: b.x, y: b.y - wt, w: b.width, h: b.height, vw: innerWidth, vh: innerHeight - wt, bh }; });
    await ctx.close(); return r;
  };
  head('[1] 발표 무대가 화면 안 · 가운데 (CRM 처럼 iframe 안)');
  for (const vp of VPS) {
    const r = await stage(vp);
    const L = Math.round(r.x), R = Math.round(r.vw - r.x - r.w), T = Math.round(r.y), B = Math.round(r.vh - r.bh - r.y - r.h);
    is(L >= 0 && R >= 0 && T >= 0 && Math.abs(L - R) <= 2 && Math.abs(T - B) <= 40 && r.w > r.vw * 0.6,
      `${vp.n} — 좌 ${L} · 우 ${R} · 위 ${T} · 아래 ${B} · 무대 ${Math.round(r.w)}×${Math.round(r.h)}`);
  }
  /* 되돌림 — 가운데를 flex 에 맡기면(예전) 갤탭 세로에서 운다 */
  OVR = BA.replace("  wrap.style.justifyContent='flex-start';\n  var pres=", "  var pres=0&&")
          .replace("  wrap.style.justifyContent='flex-start';\r\n  var pres=", "  var pres=0&&");
  is(OVR !== BA, '(되돌림 준비 — 가운데 맞춤 줄을 찾았다)');
  { const r = await stage(VPS[2]); is(Math.round(r.x) < 0, `되돌리면 갤탭 세로 무대가 왼쪽 밖으로 나간다(${Math.round(r.x)}) — 자가 진짜로 잰다`); }
  OVR = null;

  /* [2] 갤탭 — 인쇄 단추마다 새 창 */
  const mob = async (expectPop) => {
    const ctx = await ctxOf(VPS[1], UA); await route(ctx);
    await ctx.addInitScript(() => { if (window.top === window && !document.getElementById('baFrame')) { window.__printed = 0; window.print = function () { window.__printed++; }; } });
    const pg = await ctx.newPage(); const fr = await frameOf(pg);
    await fr.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; go('show'); window.__raw = 0; BA_PRINT_RAW = function () { window.__raw++; }; });
    await pg.waitForTimeout(300);
    const names = await fr.evaluate(() => [...document.querySelectorAll('.showctl button')].map(b => b.textContent.trim()).filter(t => /^🖨|^📄/.test(t)));
    const jobs = names.map(n => ({ n, sel: '.showctl button' })).concat([{ n: '🖨 인쇄 (가로)', sel: '.bar button', edit: 1 }]);
    const out = [];
    for (const j of jobs) {
      await fr.evaluate((e) => { if (e) go('edit'); else if (S.mode !== 'show') { S.deck = true; go('show'); } }, !!j.edit);
      await pg.waitForTimeout(250);
      const h = await fr.evaluateHandle((a) => [...document.querySelectorAll(a.sel)].find(b => b.textContent.trim() === a.n && b.offsetParent), j);
      const el = h.asElement(); if (!el) { out.push({ n: j.n, miss: 1 }); continue; }
      const popP = ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null);
      const raw0 = await fr.evaluate(() => window.__raw);
      await el.scrollIntoViewIfNeeded(); await el.click();
      const pop = await popP; let info = null;
      if (pop) { await pop.waitForTimeout(3300); info = await pop.evaluate(() => ({ p: window.__printed, crm: document.body.innerText.indexOf('CRM-TOPBAR-MARK') >= 0, cls: document.body.className })); await pop.close(); }
      const back = await fr.evaluate(() => ({ land: document.body.classList.contains('printland'), frp: document.body.classList.contains('frpOn'), mode: S.mode, raw: window.__raw }));
      out.push({ n: j.n, pop: !!pop, info, back, raw: back.raw - raw0, edit: !!j.edit });
    }
    await ctx.close(); return out;
  };
  head('[2] 갤탭(안드로이드 크롬) + iframe — 인쇄 단추마다 새 창에서 인쇄');
  const res = await mob();
  is(res.length >= 6, `인쇄 단추 ${res.length}개를 눌러 봄(맨 밑 🖨·📄 다섯 + 위 띠 가로)`);
  for (const r of res) {
    if (r.miss) { is(false, `${r.n} — 단추를 못 찾음`); continue; }
    is(r.pop && r.info && r.info.p === 1 && !r.info.crm && r.raw === 0 && !r.back.land && !r.back.frp && r.back.mode === (r.edit ? 'edit' : 'show'),
      `${r.n.slice(0, 30)} — 새 창 ${r.pop ? '열림' : '없음'} · 거기서 인쇄 ${r.info ? r.info.p : '-'} · CRM 섞임 ${r.info ? r.info.crm : '-'} · 원래 화면 ${r.back.mode}${r.back.land ? '(가로 꼴 남음!)' : ''}`);
  }
  const land = res.find(r => /가로로 인쇄/.test(r.n)); is(land && land.info && /printland/.test(land.info.cls), '가로 인쇄 새 창이 가로 무대 꼴(printland)을 들고 갔다');
  const fr2 = res.find(r => /최종 보고서/.test(r.n)); is(fr2 && fr2.info && /frpOn/.test(fr2.info.cls), '최종 보고서 새 창이 보고서 꼴(frpOn)을 들고 갔다');

  /* 되돌림 — 폰을 PC 로 치면 새 창이 안 열린다 */
  OVR = BA.replace('function baMobile(){', 'function baMobile(){return false;');
  { const r2 = await mob(); is(r2.length && r2.every(r => !r.pop), '되돌리면(폰을 PC 로) 새 창이 하나도 안 열린다 — 자가 진짜로 잰다'); }
  OVR = null;

  /* [3] PC 는 그대로 */
  head('[3] PC 는 그대로 — 그 자리에서 인쇄');
  {
    const ctx = await ctxOf(VPS[0]); await route(ctx); const pg = await ctx.newPage(); const fr = await frameOf(pg);
    await fr.evaluate(() => { localStorage.clear(); doSample(); window.__raw = 0; BA_PRINT_RAW = function () { window.__raw++; }; });
    let popped = 0; ctx.on('page', () => popped++);
    await fr.evaluate(() => baPrintLand()); await pg.waitForTimeout(500);
    await fr.evaluate(() => frPrint()); await pg.waitForTimeout(500);
    const raw = await fr.evaluate(() => window.__raw);
    is(popped === 0 && raw === 2, `PC — 새 창 ${popped} · 그 자리 인쇄 ${raw}(가로 · 최종 보고서)`);
    await ctx.close();
  }

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '곳이 어긋났습니다'); process.exit(1); }
  console.log('✓ 발표 무대는 어느 화면에서나 가운데 · 폰·태블릿에서도 인쇄 단추가 새 창에서 뽑힙니다 (판 X587)');
})().catch(e => { console.error(e); process.exit(1); });
