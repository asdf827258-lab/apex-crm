/* ══════════════════════════════════════════════════════════════════════
   🧭 홈이 권하는 동네가 <b>CRM 틀까지 가나</b> — 메뉴로 들어가도 (판 X261)

   사장님 말씀 (2026-10-30) — 「<b>다시 걸어주고</b> 검색할때 깨지는거 없도록해」.

   ⚠⚠ <b>판 X260 에서 제가 거짓을 적었습니다.</b> 코드 쪽지·대장·PR·판 쪽지에
     「안에서 「🗺️ 지역 동선」 단추로 여실 때도 추천이 서게 홈이 <b>미리</b>
     알려 둡니다」 라고 적어 두고, 정작 hmHotTell() 을 <b>홈 🚗 카드에서 여는
     길 하나에만</b> 걸었습니다(hmRtOpen). 그래서 사장님께서
     <b>메뉴 → DB 통합 CRM → 🗺️ 지역 동선</b> 으로 여시면 추천이 <b>안 떴습니다</b>.
     사장님이 쓰시는 길이 그 길입니다.

   ★ 그래서 이 자를 세웁니다 — <b>끊긴 그 길 하나</b>를 묻습니다.
     ⓐ 홈이 <b>센다</b>(hmHotTop) · ⓑ <b>메뉴로</b> 들어가면 틀이 <b>받는다</b> ·
     ⓒ <b>두 번째</b>로 들어가도 받는다(그동안 약속이 바뀔 수 있습니다) ·
     ⓓ 권할 근거가 없으면 <b>안 보낸다</b>(지어내지 않습니다 · 1번).
   ★ 되돌림 — 판 X260 꼴(홈 카드 길만)로 되돌리면 ⓒ 가 <b>null</b> 로 웁니다.
   ★ <b>세는 자가 하나인지</b>는 여기서 또 묻지 않습니다 — check-rtplan [7] ⓓ
     가 이미 묻습니다 (5번 · 같은 것을 두 곳에서 묻지 않습니다).
   ★ 바깥·사장님 서버를 <b>한 번도 안 부릅니다</b> (7번 · check-netblock).
   ══════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '..'), PORT = 9141;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const q = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  /* 서버 창구는 <b>빈 답을 곧바로</b> — 안 막으면 이 자가 「그날 망 사정」 을 잽니다 */
  if (q.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{}'); return;
  }
  const f = path.join(ROOT, q);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    rs.writeHead(404); rs.end('no'); return;
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 날짜를 <b>못 박습니다</b> — 「며칠 뒤」 로 씨를 만들면 자가 제 날에만 웁니다 (8번) */
const 못박은날 = '2026-09-15T09:00:00Z';
const PIN = (iso) => {
  const FIX = new Date(iso).getTime(); const R = Date; const off = FIX - R.now();
  function F(...a) { return a.length ? new R(...a) : new R(R.now() + off); }
  F.now = () => R.now() + off; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
/* 견본은 <b>홍길동</b> 집안 (3번). 이번 주 순천에 AP·PC 약속 셋 — 홈이 순천을 권할 자료 */
const SEED = (약속있나) => {
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
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {}; AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = 약속있나
    ? [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'AP', days:3, n:1, res:'', appt:'2026-09-16T10:00:00' },
       { id:'d2', who:'me', name:'홍길순', region:'순천', src:'소개', stage:'PC', days:5, n:1, res:'', appt:'2026-09-17T14:00:00' },
       { id:'d3', who:'me', name:'홍길중', region:'순천', src:'일반', stage:'AP', days:7, n:1, res:'', appt:'2026-09-18T11:00:00' },
       { id:'d4', who:'me', name:'홍갑돌', region:'광주', src:'소개', stage:'AP', days:9, n:1, res:'', appt:'2026-09-19T15:00:00' }]
    /* ⓓ 권할 근거가 <b>없는</b> 판 — 약속이 한 건도 없습니다 */
    : [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'TA', days:3, n:1, res:'', appt:'' }];
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const 바깥 = [];
  const 열기 = async (약속있나) => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(PIN, 못박은날);
    await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    /* ★ 바깥은 <b>한 번도</b> 안 부릅니다 — 부르면 적어 두고 빨간불입니다 (7번) */
    /* ★ 글꼴은 <b>집안 꼴</b>로 — check-netblock 은 `.route('**://**'` 를 보고
       「바깥을 막는 자」 로 셉니다. 다른 글꼴로 적으면 막고 있는데도
       <b>안 막는 자</b>로 세어 눈금이 늘어납니다. 눈금을 올리지 않고
       제 글꼴을 맞춥니다 (0-1번 · 5번).                                 */
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (u.startsWith('http://127.0.0.1:' + PORT) || u.startsWith('http://localhost:' + PORT)) return r.continue();
      if (/^https?:/.test(u)) { 바깥.push(u.slice(0, 60)); return r.abort(); }
      return r.continue();
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => 오류.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html',
      { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function',
      { timeout: 60000 });
    await p.evaluate(SEED, 약속있나);
    await p.waitForTimeout(2200);
    return { ctx, p };
  };
  const 오류 = [];

  /* ── ⓐ 홈이 센다 ─────────────────────────────────────────────── */
  head('[1] 🧭 <b>홈이 권하는 동네를 센다</b> (세는 자는 여기 한 곳 · 5번)');
  const A = await 열기(true);
  const 권함 = await A.p.evaluate(() => {
    try { return hmHotTop(); } catch (e) { return { 터짐: String(e.message) }; }
  });
  is(!!권함 && 권함.rg === '순천' && 권함.n === 3,
     '  홈이 <b>순천 3건</b>을 권한다 — ' + JSON.stringify(권함));

  /* ── ⓑ 메뉴로 들어가면 틀이 받는다 ───────────────────────────── */
  head('[2] 📨 <b>메뉴로 들어가면 틀이 받는다</b> — 사장님이 쓰시는 그 길 (판 X261)');
  /* ★ 홈 🚗 카드를 <b>거치지 않습니다</b>. 판 X260 에서 걸려 있던 길은
     그 카드뿐이었고, 메뉴로 들어가면 아무것도 안 갔습니다.          */
  await A.p.evaluate(() => go('crm'));
  await A.p.waitForTimeout(6000);
  const 받음 = await A.p.evaluate(() => {
    const f = document.getElementById('crmFrame');
    if (!f || !f.contentWindow) return '틀이 없음';
    try { return f.contentWindow.eval('JSON.stringify(window.__apexHotLast||null)'); }
    catch (e) { return 'eval 막힘 ' + e.message; }
  });
  /* 앱이 받은 것을 적어 두지는 않으므로, 받는 자리를 <b>감싸서</b> 봅니다 —
     앱은 한 줄도 안 고칩니다 (자가 앱을 고치게 하지 않습니다 · 8번). */
  const 끝끝 = await A.p.evaluate(async () => {
    const f = document.getElementById('crmFrame');
    if (!f || !f.contentWindow) return '틀이 없음';
    const w = f.contentWindow;
    if (typeof w.apexRouteHot !== 'function') return 'apexRouteHot 이 틀에 없음';
    w.eval('window.__본것=null; var _원=window.apexRouteHot;' +
           'window.apexRouteHot=function(h){ window.__본것=h; return _원(h); };');
    /* 홈으로 나갔다 <b>메뉴로 다시</b> 들어옵니다 — 그 길이 거는지 봅니다 */
    go('home'); await new Promise(r => setTimeout(r, 900));
    go('crm');  await new Promise(r => setTimeout(r, 1800));
    return w.eval('JSON.stringify(window.__본것)');
  });
  is(/"rg":"순천"/.test(String(끝끝)) && /"n":3/.test(String(끝끝)),
     '  ★★ 메뉴로 들어가니 틀이 <b>순천 3건</b>을 받았다 — ' + String(끝끝).slice(0, 90));

  /* ── ⓒ 두 번째로 들어가도 받는다 ─────────────────────────────── */
  head('[3] 🔁 <b>두 번째로 들어가도 받는다</b> — 그동안 약속이 바뀔 수 있습니다');
  const 두번 = await A.p.evaluate(async () => {
    const f = document.getElementById('crmFrame'); const w = f.contentWindow;
    w.eval('window.__본것=null');
    go('home'); await new Promise(r => setTimeout(r, 900));
    go('crm');  await new Promise(r => setTimeout(r, 1800));
    return w.eval('JSON.stringify(window.__본것)');
  });
  is(/"rg":"순천"/.test(String(두번)),
     '  ★★ 또 들어가도 <b>다시 보낸다</b> — ' + String(두번).slice(0, 70) +
     (/"rg":"순천"/.test(String(두번)) ? '' : ' ← 틀이 이미 떠 있으면 onload 가 다시 안 뜹니다'));
  await A.ctx.close();

  /* ── ⓓ 권할 근거가 없으면 안 보낸다 ─────────────────────────── */
  head('[4] 🤐 <b>권할 근거가 없으면 안 보낸다</b> — 지어내지 않습니다 (1번)');
  const B = await 열기(false);
  const 없음 = await B.p.evaluate(() => {
    try { return hmHotTop(); } catch (e) { return 'throw'; }
  });
  is(없음 === null,
     '  이번 주 AP·PC 약속이 없으면 홈이 <b>null</b> 을 돌려준다 — ' + JSON.stringify(없음));
  /* ⚠⚠ <b>이 줄이 엉뚱한 까닭으로 초록이었습니다.</b> 처음에는 틀을 열지
     않고 물었는데, hmHotTell 은 <b>틀이 없으면</b> 그것만으로 false 를
     돌려줍니다 — 「근거가 없어서」 가 아니라 「틀이 없어서」 였습니다.
     되돌려 「근거가 없어도 보내게」 해 봤더니 <b>안 울었습니다</b>.
     ★ 그래서 <b>틀을 먼저 열고</b> 묻습니다 — 그러면 false 의 까닭이
       「근거가 없다」 하나로 좁혀집니다 (8번 「안 울리는 알람은 알람이 아니다」). */
  await B.p.evaluate(() => go('crm'));
  await B.p.waitForTimeout(6000);
  const 틀떴나 = await B.p.evaluate(() => {
    const f = document.getElementById('crmFrame');
    return !!(f && f._mounted && f.contentWindow && typeof f.contentWindow.apexRouteHot === 'function');
  });
  is(틀떴나, '  (재려면 먼저) <b>틀이 떠 있다</b> — ' + (틀떴나 ? '떴습니다' : '← 안 떴으면 아래 줄이 헛 초록이 됩니다'));
  const 안보냄 = await B.p.evaluate(() => {
    try { return hmHotTell(); } catch (e) { return 'throw ' + e.message; }
  });
  is(틀떴나 && 안보냄 === false,
     '  ★★ 틀이 떠 있어도 <b>아무것도 안 보낸다</b> — hmHotTell() → ' + 안보냄 +
     (안보냄 === false ? '' : ' ← 빈 추천을 보내면 동선이 「권합니다」 라고 거짓말합니다'));
  await B.ctx.close();

  /* ── 조용한가 ────────────────────────────────────────────────── */
  head('[5] 🤫 <b>바깥을 안 부르고 조용한가</b> (7번 · 8번)');
  /* ⚠ 처음에 「바깥을 한 번도 안 부른다」 로 물었다가 <b>헛 빨간불</b>이
     떴습니다 — 10번은 <b>글꼴 CDN(Pretendard)</b> 이었습니다. 7번이 막으려는
     것은 「<b>사장님 서버를 되풀이해 부르는 것</b>」 이고 글꼴은 그것이
     아닙니다. 넓게 잡지 말고 <b>확실한 것만</b> 잡습니다 (8번).
     ★ 글꼴·CDN 은 다른 자(check-egress·check-netblock)가 제 눈으로 봅니다 —
       여기서 또 보면 같은 것을 두 곳에서 묻는 것입니다 (5번).           */
  /* ⚠⚠ 두 번째로 넓었습니다 — /supabase/ 로 걸렀더니 <b>라이브러리 파일</b>
     (cdn.jsdelivr.net/npm/@supabase/supabase-js)까지 잡혔습니다. 사장님 서버는
     <b>…supabase.co</b>(그 프로젝트 주소)와 <b>/.netlify/functions/</b> 입니다.
     이름이 비슷한 것을 같은 것으로 세지 않습니다 (8번 · 판 X191 의 결).   */
  const 서버 = 바깥.filter(u => /supabase\.co|\.netlify\/functions|dapi\.kakao/.test(u));
  is(서버.length === 0, '  <b>사장님 서버를 한 번도</b> 안 부른다 — ' + 서버.length + '번' +
     (서버.length ? (' ← ' + 서버.slice(0, 2).join(' · ')) : '') +
     ' (글꼴·CDN ' + (바깥.length - 서버.length) + '번은 셈에서 뺍니다 — 위 쪽지)');
  is(오류.length === 0, '  콘솔 오류가 <b>없다</b> — ' + 오류.length + '개' +
     (오류.length ? (' ← ' + [...new Set(오류)].slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ 홈의 추천이 동선까지 안 갑니다 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 홈이 권하는 동네가 메뉴로 들어가도 동선까지 갑니다 — 근거가 없으면 안 보냅니다.');
})();
