/* 🔗 <b>자비스가 앱의 기능과 정말 이어져 있나</b> (판 X358)

   사장님 말씀 2026-11-06 — 「자비스 디자인은 짰고 기존에 있는 내부 기능들 하고 잘 연결 되었는지 봐봐」.
   자비스(app/apex-map.html)는 앱(app/index.html) 안의 틀에서 돌며, 답의 단추마다 <b>앱의 함수</b>를 부릅니다 —
   화면 열기(go · jvDock) · 질병 가이드(dzGuideOpen) · 화법서(fpTalkOpen) · 상담자료 덱 · 고객 창(cusGo) ·
   복사(copyText) · 계산기로 넘기기(osFinPushPen) · 시키는 일(VA_ACT) · 오늘 챙길 것(cmTodo).
   그 이름이 앱에서 바뀌거나 사라지면 자비스는 <b>단추를 그대로 세운 채</b> 눌러도 아무 일이 안 납니다
   (대개 try/catch 에 조용히 삼켜집니다 — 「안 울리는 알람」 · 8번). 그 자리를 하나하나 <b>실제로 눌러</b> 봅니다.

     [1] 자비스가 부르는 앱 함수가 <b>앱에 다 있다</b> — 파일에서 이름을 모아(P.○○ · window.parent.○○) 앱을 띄워 하나하나 확인
     [2] 들어가는 길 — 서랍 · 홈 · 메뉴의 자비스 단추가 자비스 모드를 연다 · 나오는 길이 앞 화면으로 돌아간다
     [3] 답의 단추를 <b>눌러서</b> 그 화면이 정말 열린다 — 🪟 여기서 보기 · 📖 질병 가이드 · 📕 화법서 · 🎞 덱 · 🪪 고객 창 · 📋 복사
     [4] 「이 화면 열기 ›」 가 가리키는 화면이 앱에 있다 (없는 화면으로 새 탭을 열지 않는다)
     [5] 시키는 일 — 음성 비서 사전(VA_ACT)의 보기 말(ex)을 자비스가 <b>그 일</b>로 알아듣는다 · 일마다 하는 함수가 있다
     [6] 읽기만 하는 일꾼(오늘 브리핑 · 남은 할 일 · 챙길 고객 …)이 앱의 값을 읽어 온다(오류 0)
     [7] AI 연결 단추가 열쇠 창을 연다 · 오류 0

   쓰는 법: node scripts/check-jvlink.js          (저장소 그대로)
           JV_ROOT=<다른 사본> node scripts/check-jvlink.js   (예: main 을 따로 받아 둔 곳 — 라이브와 같은 판을 잴 때) */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.JV_ROOT || path.join(__dirname, '..'), PORT = +(process.env.JV_PORT || 9201);
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = t => console.log('\n' + t);
const MT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
const SEED = () => {
  try { localStorage.setItem('apex_login_ok', '1'); } catch (e) {}
  window.osLoadProfile = function(){}; window.osProfileApply = function(){};
  window.osShowLoginGate = function(){}; window.arLoad = function(){};
  window.osLoadClients = function(){}; window.cmLoadAll = function(cb){ if (cb) cb(); };
  window.toast = function(){};
  window.setupDone = function(){ return true; }; window.setupCanRun = function(){ return true; };
  window.osTabAllowed = function(){ return true; };
  OS.profile = { id: 'me', user_id: 'me', name: '윤설계', role: 'fp', team: 'A', active: true };
  OS.session = { user: { id: 'me' } };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  CM.loaded = true; AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  OSC.list = [{ id: 'c0', name_masked: '홍○○', advisor_id: 'me', stage: 'AP', created_at: '2026-08-01', phone: '010-1234-5678' }];
  CM.meta = { c0: { nx: [{ k: 'nx1', what: '증권 전달', due: '2026-11-03' }], touch: [] } };
  window.cmSave = function(id, patch, then){ CM.meta[id] = Object.assign({}, CM.meta[id] || {}, patch); if (then) then(); };
  /* 새 탭 · 새 창은 열지 않고 적어 둡니다 */
  window.__opened = []; window.open = function(u){ window.__opened.push(String(u)); return null; };
  try { cmRealSet('c0', '홍길동'); } catch (e) {}
  try { osHideLoginGate(); } catch (e) {}
  try { renderNav(); } catch (e) {}
  go('home');
};

(async () => {
  console.log('🔗 자비스 — 앱의 기능과 이어져 있나 (판 X358)' + (process.env.JV_ROOT ? ' · 잰 곳 ' + ROOT : ''));
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.route('**://**', rt => rt.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? rt.continue()
    : rt.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED); await p.waitForTimeout(800);

  sec('[2] 들어가는 길 · 나오는 길');
  const ENT = await p.evaluate(async () => {
    const out = [];
    const cand = () => [].slice.call(document.querySelectorAll('[onclick*="go(\'apexmap\')"], [data-go="apexmap"]')).filter(e => e.offsetParent !== null);
    go('home'); await new Promise(r => setTimeout(r, 500));
    const L = cand().map(e => (e.closest('#sidebar,#navFix,.sidebar') ? '서랍 · ' : '') + (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24));
    for (let i = 0; i < L.length; i++){
      go('home'); await new Promise(r => setTimeout(r, 350));
      const el = cand()[i]; if (!el) { out.push({ n: L[i], ok: false, why: '다시 그린 뒤 안 보임' }); continue; }
      el.click(); await new Promise(r => setTimeout(r, 500));
      out.push({ n: L[i], ok: document.body.classList.contains('apexmap-mode') && (typeof currentTab !== 'function' || currentTab() === 'apexmap') });
    }
    return out;
  });
  is(ENT.length >= 2 && ENT.every(x => x.ok), '자비스를 여는 단추 ' + ENT.length + '곳이 모두 자비스 모드를 연다 — ' + ENT.map(x => (x.ok ? '' : '✗') + x.n).join(' · '));
  await p.evaluate(() => go('apexmap')); await p.waitForTimeout(2200);
  const f = p.frame({ url: /apex-map\.html/ });
  if (!f){ is(false, '자비스 모드가 앱 안에서 안 열립니다'); await b.close(); srv.close(); process.exit(1); }
  await f.evaluate(() => { ['gproxy', 'proxy', 'apikey', 'gkey'].forEach(k => LS.del(k)); try { modeLabel(); } catch (e) {} try { jvExtLoad(); } catch (e) {} });
  await p.waitForTimeout(3500);
  /* 나오는 길 — 새 판은 자비스 위 띠의 「← 업무」, 옛 판은 떠 있는 「← 워크스페이스」 */
  const EX = await p.evaluate(async () => {
    go('clients'); await new Promise(r => setTimeout(r, 300)); go('apexmap'); await new Promise(r => setTimeout(r, 600));
    const fr = document.getElementById('apexMapFrame'), d = fr && fr.contentDocument;
    const inner = d && d.getElementById('jvBack'), outer = document.querySelector('#apexMapScreen .fin-float .ff-back:not(#amissBtn)');
    const vis = e => !!(e && e.offsetParent !== null && !e.hidden);
    const which = vis(inner) ? '자비스 위 띠 「← 업무」' : (vis(outer) ? '떠 있는 「← 워크스페이스」' : '');
    (vis(inner) ? inner : outer).click(); await new Promise(r => setTimeout(r, 400));
    return { which, back: !document.body.classList.contains('apexmap-mode'), tab: typeof currentTab === 'function' ? currentTab() : '' };
  });
  is(!!EX.which && EX.back && EX.tab === 'clients', '나오는 단추(' + (EX.which || '없음') + ')가 <b>앞 화면(고객 365일)</b>으로 돌아간다 — ' + EX.tab);
  await p.evaluate(() => go('apexmap')); await p.waitForTimeout(1200);

  sec('[1] 자비스가 부르는 앱 함수가 앱에 다 있다');
  const JS = fs.readFileSync(path.join(ROOT, 'app/apex-map.html'), 'utf8');
  const names = new Set();
  JS.replace(/\bP0?\.([A-Za-z_]\w*)\s*\(/g, (m, n) => { names.add(n); });
  JS.replace(/window\.parent\.([A-Za-z_]\w*)/g, (m, n) => { names.add(n); });
  /* 「안 될 때 옛 길로」 를 두고 부르는 것(있는지 먼저 묻는 것)도 다 세웁니다 — 없으면 그 단추는 옛 길로만 갑니다 */
  const NOTFN = ['calc' /* 연금 엔진(pension-engine.js)의 셈 — 앱 함수가 아닙니다 */, 'indexOf', 'TABS', 'VA_ACT', 'VA_MAKE_RE', 'APEX_STAGE', 'DZ_DATA', 'OS', 'OSC', 'CM', 'document', 'location', 'apply', 'call', 'test', 'exec'];
  const want = [...names].filter(n => NOTFN.indexOf(n) < 0).sort();
  /* 단추가 <b>이름으로</b> 부르는 것(open:{fn:'dzGuideOpen'}) — 자비스 안의 것(jvHere · jvDeckOpen)이 아니면 앱에 있어야 합니다 */
  const byName = [...new Set((JS.match(/fn:'([A-Za-z_]\w*)'/g) || []).map(x => x.slice(4, -1)))];
  const miss = await p.evaluate(({ want, byName }) => {
    const fr = document.getElementById('apexMapFrame'), w = fr && fr.contentWindow;
    return want.filter(n => typeof window[n] !== 'function')
      .concat(byName.filter(n => typeof window[n] !== 'function' && !(w && typeof w[n] === 'function')).map(n => n + '(단추)'));
  }, { want, byName });
  is(want.length >= 30 && miss.length === 0, '자비스가 부르는 앱 함수 ' + want.length + '가지 · 단추가 이름으로 부르는 ' + byName.length + '가지가 모두 있다' + (miss.length ? ' ← <b>없음</b>: ' + miss.join(' · ') : ''));
  const DATA = await p.evaluate(() => ({ tabs: Array.isArray(window.TABS), va: Array.isArray(window.VA_ACT), stage: !!(window.APEX_STAGE && APEX_STAGE.taFrame), dz: !!(window.DZ_DATA && DZ_DATA.list) }));
  is(DATA.tabs && DATA.va && DATA.stage && DATA.dz, '자비스가 읽는 앱의 표 — 메뉴(TABS) · 시키는 일(VA_ACT) · 영업 단계(APEX_STAGE) · 질병(DZ_DATA)이 다 있다');

  sec('[3] 답의 단추를 눌러서 그 화면이 정말 열린다');
  /* 물어서 답 카드를 세우고, 그 단추를 <b>사람처럼</b>누른 뒤 앱이 어디에 섰는지 봅니다 */
  const press = async (q, sel, pick) => {
    await p.evaluate(() => { try { jvDockEnd(); } catch (e) {} go('apexmap'); window.__opened = []; }); await p.waitForTimeout(700);
    const fr = p.frame({ url: /apex-map\.html/ });
    const got = await fr.evaluate(async ({ q, sel, pick }) => {
      jLog.innerHTML = ''; window.speak = function(){}; ask(q); await new Promise(r => setTimeout(r, 1400));
      const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
      const L = c ? [].slice.call(c.querySelectorAll(sel)) : [];
      const el = pick ? L.filter(e => pick.test ? false : (e.textContent || '').indexOf(pick) >= 0)[0] || L[0] : L[0];
      if (!el) return { none: true, n: L.length };
      const label = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
      el.click(); return { label, here: el.getAttribute('data-here') || '' };
    }, { q, sel, pick });
    await p.waitForTimeout(900);
    const st = await p.evaluate(() => ({ tab: typeof currentTab === 'function' ? currentTab() : '', dock: document.body.classList.contains('jv-dock'),
      modes: [].slice.call(document.body.classList).filter(c => /-mode$/.test(c)),
      band: (() => { const sc = document.getElementById('apexMapScreen'), r = sc ? sc.getBoundingClientRect() : null;
        return !!(r && r.height > 0 && r.height < innerHeight / 2 && Math.abs(r.bottom - innerHeight) <= 2 && getComputedStyle(sc).display !== 'none'); })(),
      dzTo: (window.DZG && (DZG.jump || (DZG.ready ? 'ready' : ''))) || '', fpTo: (window.FPT && (FPT.jump || (FPT.ready ? 'ready' : ''))) || '',
      full: document.body.classList.contains('apexmap-mode'), opened: (window.__opened || []).slice(), cus: window.__cus || null }));
    return Object.assign({ q }, got, st);
  };
  /* 고객 창은 여는 임자(cusGo)를 지켜봅니다 — 연 뒤에 그대로 부릅니다 */
  await p.evaluate(() => { const k = window.cusGo; window.cusGo = function(o){ window.__cus = o; try { return k.apply(this, arguments); } catch (e) { window.__cus = { err: String(e) }; } }; });
  const T = [
    ['🪟 여기서 보기(길의 걸음)', '보장분석 어떻게 해?', '.st-here[data-here]', '', s => s.dock && !s.full && !!s.tab && s.tab === s.here],
    ['🪟 TA 스크립트 열기(다섯 마디)', '처음 전화 뭐라고 해?', '.jf-best .jr-open', '', s => s.dock && s.tab === 'ta_script'],
    ['🪟 인수 기준 열기(가입돼?)', '협심증 있는 고객 가입돼?', '.jf-best .jr-open', '', s => s.dock && s.tab === 'ref_underwrite'],
    ['🪟 보낼 말 모음 열기(보낼 글)', '부재중이면 문자 뭐라고 보내?', '.jf-best .jr-open', '', s => s.dock && s.tab === 'saybook'],
    /* 질병 가이드 · 화법서는 <b>제 전체 화면</b>(osFullMode)으로 열리고 자비스는 아래 띠로 남습니다 — 그 병 · 그 장으로 가라는 말(jump)이 함께 갑니다 */
    ['📖 질병 가이드에서 이 병 열기', '뇌졸중 화법', '.jr-open', '질병 가이드', s => s.modes.indexOf('dzguide-mode') >= 0 && s.band && !!s.dzTo],
    ['📕 화법서 이 장 열기', '연금 화법', '.jr-open', '화법서', s => s.modes.indexOf('fptalk-mode') >= 0 && s.band && !!s.fpTo],
    ['🪪 고객 창 열기', '홍길동', '[data-cli]', '', s => !!(s.cus && !s.cus.err)]
  ];
  for (const [n, q, sel, pick, ok] of T){
    const r = await press(q, sel, pick);
    is(!r.none && ok(r), n + ' — 「' + q + '」 → ' + (r.none ? '<b>단추가 안 섬</b>' : '「' + r.label + '」 → 앱 ' + (r.modes.filter(m => m !== 'apexmap-mode')[0] || r.tab || '?') + (r.dock ? ' · 자비스는 아래 띠' + (r.band ? '' : '(<b>안 보임</b>)') : '') + (r.cus ? ' · 고객 창(' + JSON.stringify(r.cus).slice(0, 30) + ')' : '')));
  }
  /* 🎞 덱 — 덱마다 여는 길이 다릅니다(화면 안 틀 · 새 창). 색인의 첫 장으로 하나씩 엽니다 */
  const DK = await p.evaluate(async () => {
    const fr = document.getElementById('apexMapFrame').contentWindow, D = (fr.jvDecks && fr.jvDecks()) || [], out = [];
    /* 새 창으로 여는 덱은 자비스(틀 안)가 <b>제 window.open</b> 으로 엽니다 — 그것도 적어 둡니다 */
    fr.open = function(u){ window.__opened.push(String(u)); return { closed: false, location: { href: String(u) }, document: null }; };
    for (const d of D){
      try { fr.jvDockEnd && fr.jvDockEnd(); } catch (e) {}
      go('apexmap'); window.__opened = []; await new Promise(r => setTimeout(r, 500));
      const sl = (d.slides || [])[1] || (d.slides || [])[0];
      let ok = false, why = '';
      try { fr.jvDeckOpen(d.k, sl.id); await new Promise(r => setTimeout(r, 900));
        ok = d.win ? (window.__opened.length > 0) : (typeof currentTab === 'function' && currentTab() === d.screen);
        why = d.win ? (window.__opened[0] || '새 창 안 열림').slice(-40) : (typeof currentTab === 'function' ? currentTab() : '');
      } catch (e) { why = String(e).slice(0, 60); }
      out.push({ n: d.n, ok, why });
    }
    try { jvDockEnd(); } catch (e) {}
    return out;
  });
  is(DK.length >= 4 && DK.every(x => x.ok), '🎞 상담자료 덱 ' + DK.length + '벌 — 장을 누르면 그 덱이 열린다 · ' + DK.map(x => (x.ok ? '' : '✗') + x.n + '(' + x.why + ')').join(' · '));
  const CP = await (async () => { await p.evaluate(() => { go('apexmap'); window.__cp = []; const k = window.copyText; window.__kcp = k; window.copyText = function(t){ window.__cp.push(t); }; }); await p.waitForTimeout(500);
    const fr = p.frame({ url: /apex-map\.html/ });
    await fr.evaluate(async () => { jLog.innerHTML = ''; ask('지금 바빠요 라고 끊으려 해'); await new Promise(r => setTimeout(r, 1200)); const bt = document.querySelector('#jLog .jf-best .jr-copy'); if (bt) bt.click(); });
    return p.evaluate(() => { const c = window.__cp.slice(); window.copyText = window.__kcp; return c; }); })();
  is(CP.length === 1 && /바쁘실 때/.test(CP[0]), '📋 말 복사 → 앱의 copyText 로 <b>말만</b> 간다 — 「' + (CP[0] || '').slice(0, 24) + '…」');

  sec('[4] 「이 화면 열기 ›」 가 가리키는 화면이 앱에 있다');
  const LK = await p.evaluate(async () => {
    go('apexmap'); await new Promise(r => setTimeout(r, 500));
    const fr = document.getElementById('apexMapFrame').contentWindow, ids = new Set(TABS.reduce((a, g) => a.concat((g.items || []).map(x => x.id)), []));
    const qs = ['보장분석 어떻게 해?', '고객 등록은 어디서 해?', '청구 서류 어떻게 받아?', '연금 상담 하려면?', '처음 전화 뭐라고 해?', '오늘 챙길 고객 누구야'];
    const bad = [], seen = new Set();
    for (const q of qs){
      fr.jLog.innerHTML = ''; fr.ask(q); await new Promise(r => setTimeout(r, 1200));
      [].slice.call(fr.document.querySelectorAll('#jLog a[data-id], #jLog [data-here]')).forEach(a => {
        const id = a.getAttribute('data-id') || a.getAttribute('data-here'); seen.add(id); if (!ids.has(id) && !(typeof navItemOf === 'function' && navItemOf(id))) bad.push(id); });
    }
    return { n: seen.size, bad: [...new Set(bad)] };
  });
  is(LK.n >= 5 && LK.bad.length === 0, '답 속 화면 길 ' + LK.n + '곳이 모두 앱의 메뉴에 있는 화면이다' + (LK.bad.length ? ' ← <b>없는 화면</b>: ' + LK.bad.join(', ') : ''));

  sec('[5] 시키는 일 — 음성 비서 사전의 보기 말을 자비스가 그 일로 알아듣는다');
  const AC = await p.evaluate(() => {
    const fr = document.getElementById('apexMapFrame').contentWindow, skip = fr.JV_ACT_SKIP || [], out = [];
    VA_ACT.forEach(a => { if (!a || skip.indexOf(a.k) >= 0 || !a.ex) return;
      if (!(a.w || a.c || (a.v && a.v.length))) return;                /* 읽기만 하는 일은 [6] 일꾼 */
      let A = null; try { A = fr.jvAct(a.ex); } catch (e) {}
      out.push({ k: a.k, ex: a.ex, got: A ? A.k : '', run: typeof a.run === 'function' }); });
    return out;
  });
  const AW = AC.filter(x => x.got !== x.k || !x.run);
  is(AC.length >= 5 && AW.length === 0, '시키는 일 ' + AC.length + '가지 — 보기 말마다 자비스가 <b>그 일 카드</b>를 세운다' + (AW.length ? ' ← 어긋남: ' + AW.map(x => x.k + '(「' + x.ex + '」 → ' + (x.got || '안 섬') + ')').join(' · ') : ''));

  sec('[6] 읽기만 하는 일꾼이 앱의 값을 읽어 온다');
  const WK = await p.evaluate(() => {
    const fr = document.getElementById('apexMapFrame').contentWindow;
    return fr.jvActs().filter(a => a && typeof a.run === 'function' && !(a.w || a.c || (a.v && a.v.length))).map(a => {
      let r = null, err = ''; try { r = fr.jvRun(a); } catch (e) { err = String(e).slice(0, 60); }
      return { k: a.k, ok: !err, say: r ? r.say.slice(0, 40) : '', go: r ? r.go : '' }; });
  });
  is(WK.length >= 5 && WK.every(x => x.ok), '일꾼 ' + WK.length + '명이 오류 없이 앱의 값을 읽는다 — ' + WK.map(x => x.k).join(' · '));
  const TD = WK.filter(x => x.k === '오늘고객')[0];
  is(!!TD && /홍길동|기한/.test(TD.say), '「오늘 챙길 고객」 일꾼이 견본 고객의 기한 지난 일을 읽어 온다 — 「' + (TD ? TD.say : '') + '」');

  sec('[7] AI 연결 · 오류');
  const KB = await p.evaluate(async () => { go('apexmap'); await new Promise(r => setTimeout(r, 400));
    const d = document.getElementById('apexMapFrame').contentDocument, bt = d.getElementById('aiBtn'); if (bt) bt.click(); await new Promise(r => setTimeout(r, 300));
    const kb = d.getElementById('keyBox'), shown = !!(kb && getComputedStyle(kb).display !== 'none');
    try { d.defaultView.closeKey && d.defaultView.closeKey(); } catch (e) {} if (kb) kb.style.display = ''; kb && kb.classList.remove('on');
    return { shown }; });
  is(KB.shown, 'AI 연결 단추가 열쇠 창을 연다');
  is(errs.length === 0, '앱 · 자비스 스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));

  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '곳이 끊겨 있습니다' : '✓ 자비스가 앱의 기능과 다 이어져 있습니다'));
  process.exit(bad ? 1 : 0);
})();
