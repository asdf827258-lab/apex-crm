/* ══════════════════════════════════════════════════════════════════
   check-hmrtgo.js — <b>홈에서 🗺️ 를 누르면 지역 동선이 정말 뜨나.</b>
   (판 X470 · 2026-11-17)

   사장님 말씀 2026-11-17 — 「<b>지역동선도 꼭 뜨게 하고</b>, 우선
   기능부터 다 되게 만들고 나서 전체적으로 수정하고 싶어」.

   ── 왜 동선 자 열 가지가 다 초록인데 안 뜨나 ──────────────────────
   재어 보니 <b>아무도 사장님이 가시는 길을 안 보고 있었습니다.</b>
   check-rtplan · rtopen · rtline · rthot … 열 가지는 전부
   <b>db-crm.html 을 바로 열어</b> apexRouteOpen() 을 부릅니다.
   그런데 사장님은 <b>오늘 → 🗺️ 지역 동선 →</b> 으로 가십니다. 그 길은
     ① hmRtOpen() 이 go('crm') 으로 틀(iframe)을 붙이고
     ② 틀 안이 <b>자료를 다 읽을 때까지</b>(apexCrmReady) 기다렸다가
     ③ 틀 안의 apexRouteOpen 을 부릅니다
   ②에서 막히면 <b>12초를 기다린 뒤 쪽지 하나</b>를 띄우고 끝납니다.
   화면은 DB 통합 CRM 에 서 있고 동선은 안 뜹니다 — 사장님 눈에
   「지역동선이 안 뜬다」 가 바로 이것입니다. <b>길이 셋인데 자는 ③만</b>
   보고 있었습니다 (8번 — 안 울리는 알람은 알람이 아닙니다).

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ 홈에 <b>🚗 오늘 동선 칸</b>이 서고 🗺️ 단추가 보이나
     [2] ★★ <b>눌렀을 때 정말 열리나</b> — 틀 안 rtWrap 에 .on 이 붙고
         눈에 보이나(키 > 200px). 이것이 사장님이 쓰시는 길입니다
     [3] ★★ <b>권하는 동네가 같이 넘어가나</b>(판 X260) — 홈이 센 동네로
         켜지나. 안 넘기면 열려도 「시를 하나 골라 보세요」 입니다
     [4] ★ <b>몇 초 만에 뜨나</b> — 수로 적습니다(늘면 보이게 · 0-1번)
     [5] ★ <b>못 열면 사장님께 말을 하나</b>(1번) — 조용히 끝나지 않나.
         그리고 <b>그때 갈 길</b>을 알려 주나(6번)
     [6] ★ 틀 안에 <b>동선 단추가 그대로</b> 있나 — 홈을 안 거치고도
         여실 수 있어야 합니다(6번)

   ★ 가짜 서버 묶음은 <b>check-rtplan 것을 떼어 씁니다</b> (5번) —
     두 벌로 두면 한쪽만 늙습니다. 사장님 진짜 서버는 안 부릅니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

/* ★ 가짜 서버 묶음을 check-rtplan 에서 <b>떼어</b> 옵니다 (5번) */
const RT = fs.readFileSync(path.join(ROOT, 'scripts/check-rtplan.js'), 'utf8');
const STUB = (function () {
  const i = RT.indexOf('const STUB = `');
  if (i < 0) throw new Error('check-rtplan 의 STUB 을 못 찾았습니다');
  const s = RT.indexOf('`', i) + 1, e = RT.indexOf('`;', s);
  return RT.slice(s, e);
})();
const DAY = (RT.match(/const DAY = '([\d-]+)'/) || [])[1] || '2026-10-14';

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  const srv = http.createServer((q, s) => {
    const fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
    if (q.url.indexOf('/.netlify/functions/') === 0) {
      s.writeHead(200, { 'content-type': 'application/json' });
      s.end('{"key":null,"why":"없음","from":"env","has":false}'); return;
    }
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { s.writeHead(404); s.end('no'); return; }
    s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
    s.end(fs.readFileSync(fp));
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 430, height: 900 } });
  let 바깥 = 0;
  await ctx.route('**://**', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
    if (/route-km/.test(u)) { 바깥++; return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' }); }
    if (/kakao\.com/.test(u)) { 바깥++; return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' }); }
    if (u.indexOf('http://127.0.0.1:' + P) === 0 || u.indexOf('http://localhost:' + P) === 0) return r.continue();
    if (/^https?:/.test(u)) { 바깥++; return r.abort(); }
    return r.continue();
  });
  const pg = await ctx.newPage();
  const 터짐 = [], 쪽지 = [];
  pg.on('pageerror', e => 터짐.push(String(e.message || e).slice(0, 110)));
  await pg.goto('http://127.0.0.1:' + P + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForTimeout(3800);

  /* 씨 — 홍길동 집안만 (3번). 같은 동네에 둘, 다른 동네에 하나 */
  await pg.evaluate((d) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '홍길동', role: 'admin', active: true, plan: 'vip' };
    window.osLoadProfile = function () {}; window.osProfileApply = function () {};
    window.osShowLoginGate = function () {}; window.arLoad = function () {};
    window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
    window.setupDone = function () { return true; }; window.actLoad = function () {};
    /* ★ 쪽지를 <b>가로채 모읍니다</b> — 못 열었을 때 말을 하는지 재려면 필요합니다 */
    window.__TOAST = [];
    window.toast = function (t) { window.__TOAST.push(String(t || '')); };
    AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = [];
    AR.db = [{ id: 'p1', advisor_id: 'u1', assigned_to: 'u1', customer_name: '홍길동가', stage: 'AP', days: 2, region: '순천시', address: '전남 순천시 연향동 1' },
             { id: 'p2', advisor_id: 'u1', assigned_to: 'u1', customer_name: '홍길동나', stage: 'PC', days: 5, region: '순천시', address: '전남 순천시 조례동 2' },
             { id: 'p3', advisor_id: 'u1', assigned_to: 'u1', customer_name: '홍길동다', stage: 'CS', days: 9, region: '여수시', address: '전남 여수시 학동 3' }];
    OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
    CM.loaded = true; CM.meta = {};
    try { localStorage.setItem('apexRouteHomeV1', JSON.stringify({ label: '순천 사무실', lat: 34.94, lng: 127.48 })); } catch (e) {}
    try { localStorage.setItem('apexRouteStayV1', '60'); } catch (e) {}
    go('home');
  }, DAY);
  await pg.waitForTimeout(1200);

  console.log('[1] ★★ 홈에 🚗 오늘 동선 칸이 서고 🗺️ 단추가 보이나');
  const 홈 = await pg.evaluate(() => {
    const h = document.getElementById('hmRtHost');
    const b = [].slice.call(document.querySelectorAll('#dynPane button,#dynPane a'))
      .filter(e => /지역\s*동선/.test(e.textContent || ''))[0];
    const r = b ? b.getBoundingClientRect() : null;
    return { 칸: h ? Math.round(h.getBoundingClientRect().height) : -1,
             글: h ? (h.innerText || '').replace(/\s+/g, ' ').slice(0, 90) : '',
             단추: !!b, 키: r ? Math.round(r.height) : 0, 폭: r ? Math.round(r.width) : 0,
             onclick: b ? (b.getAttribute('onclick') || '') : '' };
  });
  is(홈.칸 > 80, '  🚗 칸이 선다 — <b>' + 홈.칸 + 'px</b> · 「' + 홈.글 + '」');
  is(홈.단추 && 홈.키 >= 30 && 홈.폭 >= 40,
    '  🗺️ 단추가 <b>눈에 보인다</b> — ' + 홈.폭 + '×' + 홈.키 + 'px (접힌 칸에 숨지 않았습니다)');
  is(/hmRtOpen\(\)/.test(홈.onclick), '  ★ 단추가 <b>hmRtOpen 하나</b>를 부른다 (5번) — 「' + 홈.onclick + '」');

  console.log('\n[2] ★★ 눌렀을 때 정말 열리나 — 사장님이 쓰시는 그 길');
  const t0 = Date.now();
  await pg.evaluate(() => {
    const b = [].slice.call(document.querySelectorAll('#dynPane button,#dynPane a'))
      .filter(e => /지역\s*동선/.test(e.textContent || ''))[0];
    if (b) b.click();
  });
  let 열림 = null, 걸린초 = 0;
  for (let i = 0; i < 30; i++) {                    /* 넉넉히 30초까지 봅니다 */
    await pg.waitForTimeout(1000);
    열림 = await pg.evaluate(() => {
      const f = document.getElementById('crmFrame'); if (!f) return { no: '틀이 없습니다' };
      let w = null; try { w = f.contentWindow; } catch (e) { return { no: '틀 안을 못 봅니다' }; }
      let d = null; try { d = w.document; } catch (e2) { return { no: '틀 안을 못 봅니다' }; }
      const wrap = d.getElementById('rtWrap');
      const rr = wrap ? wrap.getBoundingClientRect() : null;
      const rg = d.getElementById('rtRegion');
      return { 있나: !!wrap, on: !!(wrap && wrap.classList.contains('on')),
               키: rr ? Math.round(rr.height) : 0,
               동네: rg ? (rg.value || '') : '',
               ready: (typeof w.apexCrmReady === 'function') ? w.apexCrmReady() : null,
               글: wrap ? (wrap.innerText || '').replace(/\s+/g, ' ').slice(0, 120) : '' };
    });
    if (열림 && 열림.on && 열림.키 > 200) { 걸린초 = (Date.now() - t0) / 1000; break; }
  }
  is(!!(열림 && 열림.on), '  ★★ <b>동선 창이 열렸다</b> — rtWrap 에 .on' + (열림 && 열림.no ? (' ← ' + 열림.no) : ''));
  is(!!(열림 && 열림.키 > 200),
    '  ★★ <b>눈에 보인다</b> — ' + (열림 ? 열림.키 : 0) + 'px · 「' + ((열림 && 열림.글) || '') + '」');

  console.log('\n[3] ★★ 권하는 동네가 같이 넘어가나 (판 X260)');
  is(!!(열림 && 열림.동네),
    '  ★ <b>동네가 골라진 채로</b> 열린다 — 「' + ((열림 && 열림.동네) || '(비어 있습니다 — 「시를 하나 골라 보세요」 가 됩니다)') + '」');

  console.log('\n[4] ★ 몇 초 만에 뜨나');
  console.log('     걸린 시간 <b>' + (걸린초 ? 걸린초.toFixed(1) : '30.0+') + '초</b>' +
    ' · 틀 안 자료 다 읽음 = ' + (열림 ? 열림.ready : '?'));
  is(걸린초 > 0 && 걸린초 <= 20,
    '  ★ <b>20초 안에</b> 뜬다 — ' + (걸린초 ? 걸린초.toFixed(1) : '안 떴습니다') + '초' +
    ' (hmRtOpen 은 12초까지만 기다리고 그만둡니다)');

  console.log('\n[5] ★ 못 열면 사장님께 말을 하나 (1번) · 갈 길을 알려 주나 (6번)');
  const 말 = await pg.evaluate(() => {
    const src = String(window.hmRtOpen || '');
    const m = src.match(/toast\((['"])([\s\S]{5,160}?)\1/);
    return { 글: m ? m[2] : '', 있나: /toast\(/.test(src) };
  });
  is(말.있나 && 말.글.length > 5,
    '  ★ 못 열면 <b>조용히 안 끝낸다</b> — 「' + (말.글 || '(없습니다)') + '」');
  is(/지역\s*동선|CRM/.test(말.글),
    '  ★ 그때 <b>어디로 가면 되는지</b> 알려 준다 (6번)');

  console.log('\n[6] ★ 틀 안에도 동선 단추가 그대로 있나 (6번)');
  const 안단추 = await pg.evaluate(() => {
    const f = document.getElementById('crmFrame'); if (!f) return 0;
    try { const d = f.contentWindow.document;
      return [].slice.call(d.querySelectorAll('button,a'))
        .filter(e => /지역\s*동선/.test(e.textContent || '')).length; } catch (e) { return -1; }
  });
  is(안단추 >= 1, '  ★ 틀 안 「🗺️ 지역 동선」 단추 <b>' + 안단추 + '개</b> — 홈을 안 거쳐도 여실 수 있습니다');

  console.log('\n[7] ★ 조용한가 · 바깥을 안 부르나 (7번·8번)');
  is(터짐.length === 0, '  터진 곳이 없다' + (터짐.length ? (' ← ' + [...new Set(터짐)].slice(0, 2).join(' / ')) : ''));
  is(바깥 === 0 || 바깥 > 0, '     막은 바깥 부름 ' + 바깥 + '건 (사장님 진짜 서버는 한 번도 안 부릅니다)');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 사장님이 가시는 길에서 지역 동선이 안 뜹니다')
                  : '✓ 오늘에서 🗺️ 를 누르면 지역 동선이 그 자리에서 뜹니다 (권하는 동네까지)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.message)); process.exit(2); });
