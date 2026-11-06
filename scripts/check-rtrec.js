/* ══════════════════════════════════════════════════════════════════════
   🧭 홈이 적은 동네로 🗺️ 지역 동선이 열리나 · 덮개가 동선을 안 덮나 (판 X359)

   사장님 말씀 (2026-11-04) — 「<b>실제 체크해보고 지역동선까지 안되는거 다
   찾아, 오늘에서</b>」.

   ── 재어 보고 안 것 (사장님 계정과 같은 모양: 배정 94명 · 지역은 시 이름만 ·
      약속 0 · 주소 0 · 진짜 카카오 지도 · 진짜 길찾기 서버) ──────────────
   ⓐ 홈 🚗 칸은 「오늘 약속 없음 · <b>순천으로 권합니다</b>」 라고 적는데,
      🗺️ 지역 동선 → 을 누르면 동선 창이 <b>「시 전체 · 94명」</b> 으로 열렸습니다.
      줄은 hmRtWhere(만나야 할 분이 제일 많은 동네)에게 묻고, 단추는
      hmHotTop(이번 주 AP·PC 약속)에게 물었습니다. 약속이 없는 주에는 단추가
      아무것도 안 넘겼습니다 — <b>같은 물음에 두 답</b>입니다 (5번).
   ⓑ 폰에서 그 단추로 들어가면 「👋 <b>고객 관리부터 시작하시죠?</b>」 덮개가
      동선 창 아래 절반을 덮었습니다. 홈 카드에서 들어올 때는 안 묻기로 한
      자국(CRQ.viaHome)을 🗺️ 단추만 안 남겼습니다.

   ── 보는 것 ─────────────────────────────────────────────────────────
     [1] 홈이 <b>순천을 권한다</b>고 적는다 (견본이 그 날을 만든다)
     [2] ★★ 🗺️ 지역 동선 → 을 누르면 동선 창이 <b>순천시</b>로 열린다
     [3] ★★ 「고객 관리부터 시작하시죠?」 덮개가 <b>안 뜬다</b>
     [4] 권할 것이 없는 날은 <b>아무것도 안 넘긴다</b> — 지어내지 않는다 (1번)
   ⚠ 되돌림 — 단추를 hmHotTop 만 보게 되돌리면 [2] 가 「」 로 웁니다.
     자국 한 줄을 지우면 [3] 이 웁니다.
   ★ 바깥·사장님 서버를 <b>한 번도 안 부릅니다</b> (7번). 지도(카카오)는 부르려다 막힙니다 —
     여기서 보는 것은 <b>어느 시로 열리나</b>이고 그것은 지도 없이도 섭니다.
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
/* CRM 쪽 견본 서버는 check-rtteam 의 것을 <b>그 파일에서 읽어</b> 씁니다 — 두 벌 두지 않습니다 (5번) */
const RT = fs.readFileSync(path.join(__dirname, 'check-rtteam.js'), 'utf8');
const STUB = (RT.match(/const STUB = `([\s\S]*?)`;/) || [])[1] || '';
const srv = http.createServer((rq, rs) => {
  const q = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (q.indexOf('/.netlify/functions/') === 0 || q.indexOf('/api/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"ok":false,"why":"NOKEY"}'); return;
  }
  const f = path.join(ROOT, q);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본은 홍길동 집안 (3번). 약속은 <b>한 건도 없고</b>, 순천에 만날 분이 여럿 · 여수에 하나.
   사장님 계정이 실제로 그 꼴입니다(2026-11-04 · 지역은 시 이름만 · 약속 0). */
const SEED = (있나) => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'u1' } };
  OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {}; AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  const R = (id, rg, st) => ({ id: id, who: 'u1', name: '홍길동', region: rg, src: '일반', stage: st, days: 9, n: 1, res: '', appt: '' });
  AR.db = 있나
    ? [R('a1', '순천', 'AP'), R('a2', '순천', 'PC'), R('a3', '순천', 'TA'), R('a4', '순천', 'AP'),
       R('a5', '순천', '미접촉'), R('b1', '여수', 'TA')]
    : [];
  HWHO.id = ''; go('home');
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const 바깥 = [], 오류 = [];
  const 열기 = async (있나) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (u.startsWith('http://127.0.0.1:' + PORT) || u.startsWith('http://localhost:' + PORT)) return r.continue();
      if (/^https?:/.test(u)) { 바깥.push(u.slice(0, 60)); return r.abort(); }
      return r.continue();
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => 오류.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
    await p.evaluate(SEED, 있나);
    await p.waitForTimeout(1800);
    return { ctx, p };
  };

  head('[1] 🚗 홈이 <b>순천을 권한다</b>고 적는다');
  const A = await 열기(true);
  const 줄 = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-rt-why');
    return { t: e ? e.innerText.replace(/\s+/g, ' ') : '', rg: (typeof hmRtOpenRg === 'function') ? hmRtOpenRg() : '(없음)' };
  });
  is(/순천으로 권합니다/.test(줄.t), '  「' + 줄.t.slice(0, 50) + '」');

  head('[2] ★★ 🗺️ 지역 동선 → 을 누르면 <b>그 동네로</b> 열린다');
  await A.p.evaluate(() => { const g = document.querySelector('.hm-rt-go'); if (g) g.click(); });
  await A.p.waitForFunction(() => {
    const f = document.getElementById('crmFrame');
    try { const d = f && f.contentDocument; const w = d && d.getElementById('rtWrap'); return !!(w && w.classList.contains('on')); } catch (e) { return false; }
  }, { timeout: 30000 }).catch(() => {});
  const 열림 = await A.p.evaluate(() => {
    const f = document.getElementById('crmFrame'); let rg = '(동선 창 없음)';
    try { const s = f.contentDocument.getElementById('rtRegion'); if (s) rg = s.value; } catch (e) { rg = '(틀을 못 읽음)'; }
    const sh = document.getElementById('crqSheet');
    return { rg, 덮개: !!(sh && sh.classList.contains('on')) };
  });
  is(열림.rg === '순천시', '  동선 창의 시 고르개가 「' + 열림.rg + '」 — 홈이 적은 그 동네' +
     (열림.rg === '' ? ' ← 「시 전체」 로 열렸습니다(단추가 다른 자에게 물음)' : ''));

  head('[3] ★★ 「고객 관리부터 시작하시죠?」 덮개가 <b>동선을 안 덮는다</b>');
  is(!열림.덮개, '  덮개 ' + (열림.덮개 ? '떴습니다 ← 폰에서 동선 창 아래 절반을 덮습니다' : '안 떴습니다'));
  await A.ctx.close();

  head('[4] 권할 것이 없는 날은 <b>아무것도 안 넘긴다</b> (1번)');
  const B = await 열기(false);
  const 없음 = await B.p.evaluate(() => { try { return hmRtOpenRg(); } catch (e) { return 'throw ' + e.message; } });
  is(없음 === undefined, '  hmRtOpenRg() → ' + JSON.stringify(없음) + ' — 지어낸 동네를 안 넘깁니다');
  await B.ctx.close();

  head('[5] 조용한가');
  is(!오류.length, '  터진 곳 없음' + (오류.length ? ' — ' + 오류[0] : ''));
  const 서버 = 바깥.filter(u => !/pretendard|jsdelivr\.net\/gh|fonts\.|dapi\.kakao\.com/i.test(u));
  is(!서버.length, '  바깥 서버를 안 부른다' + (서버.length ? ' — ' + 서버.slice(0, 3).join(' · ') : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 홈이 권한 동네와 동선 창이 어긋나면 사장님은 다시 고르셔야 합니다.'); process.exit(1); }
  console.log('✓ 🗺️ 지역 동선이 홈이 적은 동네로, 덮개 없이 열립니다.');
})().catch(e => { console.error(e); process.exit(1); });
