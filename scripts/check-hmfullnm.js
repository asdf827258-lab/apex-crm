/* ══ 👤 check-hmfullnm — 오늘(홈)은 실명 · 고객 앞에서는 한 번 눌러 가린다 (판 X399) ══
   사장님 말씀 (2026-11-09) — 「고객들의 이름을 풀로 보여주게 해줘」 → 여쭈니
   「실명 + 가리기 단추」 (홈은 고객 앞에서 여는 화면이라 다른 분 실명이 보이면 안 됨).

   묻는 것
     [1] 기본은 <b>실명</b> — 💡 막힌 데 · 지금 할 것 · 동선 · 약속이 지난 분에 「홍말순」 이 그대로
     [2] 맨 위 띠에 <b>「🙈 이름 가리기」</b> 가 오늘 화면에만 선다 (다른 화면에서는 안 보인다)
     [3] 누르면 <b>가린다</b> — 실명이 하나도 안 남고 「홍*순」 · 이 폰에 기억(localStorage) · 서버 안 부름
     [4] 다시 누르면 실명으로 돌아온다 · 홈 키가 한 px 도 안 바뀐다
     [5] ★ <b>나가는 이름은 그대로 가린다</b> — 폰 달력(mcalOutName) · 계산기로 미는 값(hmOutNm)
     [6] 이미 가린 이름(서버본 「홍*순」)은 담당 DB 에 <b>한 분으로만</b> 맞을 때만 실명으로 — 둘이면 가린 채 (1번)
   되돌림 — hmFullNm 이 osMaskName 을 다시 부르면 [1] 이, 단추를 빼면 [2]~[4] 가 웁니다.
   ═════════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9061;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
             '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  if (q.url.indexOf('/.netlify/functions/') === 0) { s.writeHead(200, { 'Content-Type': 'application/json' }); s.end('{"key":null,"has":false}'); return; }
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 홍길동 집안만 (3번). 담당은 전부 나(me) */
const SEED = async () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', user_id: 'me', name: '홍길동', role: 'member', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.__AR = 0; window.arLoad = function () { window.__AR++; };
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = []; AR.noPex = false; AR.noLink = false;
  const mk = (id, name, stage, appt) => ({ id, who: 'me', name, region: '순천', src: '일반', stage, expect: null, contract: null,
    closed: '', cAt: '', pAt: '', got: '2026-06-01', n: 1, last: '', res: '미진행', appt: appt || '', memo: '', days: 10 });
  const d = new Date(), p2 = n => (n < 10 ? '0' : '') + n;
  const day = k => { const x = new Date(d.getTime() + k * 864e5); return x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate()); };
  AR.db = [mk('d1', '홍길동', 'AP', day(-8) + 'T10:00'), mk('d2', '홍말순', 'PC', day(0) + 'T23:30'), mk('d3', '홍길순', 'TA', day(1) + 'T11:00')];
  try { go('home'); } catch (e) {}
  try { renderHome(); } catch (e) {}
  await new Promise(r => setTimeout(r, 900));
};
const LOOK = () => {
  const pane = document.getElementById('dynPane');
  const b = document.getElementById('hmNmBtn');
  return { H: pane ? pane.scrollHeight : 0, t: pane ? pane.innerText : '',
    btn: b ? { t: b.textContent, shown: getComputedStyle(b).display !== 'none' && b.offsetWidth > 0,
               h: Math.round(b.getBoundingClientRect().height) } : null,
    ls: (() => { try { return localStorage.getItem('apex_hm_hidenm'); } catch (e) { return 'ERR'; } })() };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  let srvCalls = 0;
  await ctx.route('**://**', r => { const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    if (/supabase/.test(u)) srvCalls++;
    return r.abort(); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await p.waitForTimeout(1200);
  await p.evaluate(SEED);
  const A = await p.evaluate(LOOK);

  console.log('\n[1] 기본은 <b>실명</b>');
  is(/홍말순/.test(A.t), '  「홍말순」 이 홈에 그대로 선다');
  is(!/홍\*순|홍○○/.test(A.t), '  가린 꼴(홍*순)이 하나도 없다');
  const parts = await p.evaluate(() => {
    const g = s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ') : ''; };
    return { ask: g('.hm-band-ask'), job: g('#hmJobHost') };
  });
  is(/홍말순/.test(parts.ask), '  💡 막힌 데에 실명 — 「' + parts.ask.slice(0, 40) + '」');
  is(/홍(말순|길동|길순)님/.test(parts.job), '  지금 할 것에 실명 — 「' + (parts.job.match(/홍\S*님/) || [''])[0] + '」');

  /* ⚠⚠ <b>2026-11-14 (판 X437) — 이 자리의 약속이 뒤집혔습니다.</b>
     여태는 「<b>오늘 화면에만</b>」 이었습니다. 그런데 판 X436 에서 「도구」 화면의
     「지금 ○○님께」 줄도 <b>실명</b>으로 바뀌었고(사장님 말씀 2026-11-14 「* 이렇게
     가리는 게 없도록 해. 검색하고 알아보는 데 어려움이 커」), 그 화면에서는 단추가
     <b>DOM 에 있는데 보이지 않아</b> 고객 앞에서 <b>가릴 길이 없었습니다.</b>
     CLAUDE.md 6번 — 「단추는 정말로 할 일이 없을 때만 감춘다」.
     ★ 그래서 이제 재는 것은 「오늘 화면에만」 이 아니라 <b>「실명을 찍는 화면마다」</b>
       입니다. 어디인지는 <b>HM_NM_TABS 한 곳</b>이 압니다(5번) — 이 자는 그 표를
       읽어서 묻습니다. 표에 화면이 늘면 이 자도 같이 따라갑니다. */
  console.log('\n[2] 맨 위 띠에 「🙈 이름 가리기」 — <b>실명을 찍는 화면마다</b> (판 X437)');
  is(!!A.btn && A.btn.shown && /이름 가리기/.test(A.btn.t), '  오늘 화면에 선다 — ' + (A.btn ? A.btn.t : '(없음)'));
  is(!!A.btn && A.btn.h >= 44, '  누르는 자리 44px 이상 — ' + (A.btn ? A.btn.h : 0) + 'px');
  const TABS = await p.evaluate(async () => {
    /* 표를 <b>앱에게 물어봅니다</b> — 여기 또 적으면 두 곳이 됩니다 (5번) */
    let T = null; try { T = Object.keys(HM_NM_TABS); } catch (e) { T = null; }
    const out = { 표: T, 봄: {} };
    for (const t of ['home', 'tools', 'clients', 'mycal']) {
      try { go(t); } catch (e) {}
      await new Promise(r => setTimeout(r, 420));
      const b = document.getElementById('hmNmBtn');
      out.봄[t] = !!(b && getComputedStyle(b).display !== 'none');
    }
    try { go('home'); } catch (e) {} await new Promise(r => setTimeout(r, 600));
    return out;
  });
  is(Array.isArray(TABS.표) && TABS.표.length > 0,
     '  어디에 서는지 <b>묻는 곳이 하나</b>다 — HM_NM_TABS = ' + (TABS.표 || ['없음']).join(' · ') + ' (5번)');
  is(TABS.봄.tools === true,
     '  ★★ <b>실명을 찍는 「도구」 화면에도 선다</b> — 실명을 찍으면서 감추면 고객 앞에서 가릴 길이 없다 (6번 · 판 X437)');
  const 샐자리 = ['clients', 'mycal'].filter(t => TABS.봄[t] && !(TABS.표 || []).includes(t));
  is(샐자리.length === 0,
     '  표에 없는 화면에는 <b>안 선다</b> — 할 일이 없는 단추는 감춘다' +
     (샐자리.length ? (' ← ' + 샐자리.join(' · ') + ' 에 서 있습니다') : ''));

  console.log('\n[3] 누르면 <b>가린다</b>');
  const c0 = srvCalls;
  await p.click('#hmNmBtn'); await p.waitForTimeout(900);
  const B = await p.evaluate(LOOK);
  is(!/홍말순|홍길순/.test(B.t), '  실명이 하나도 안 남는다');
  is(/홍\*순/.test(B.t), '  「홍*순」 으로 선다');
  is(B.ls === '1', '  이 폰에 기억한다 (apex_hm_hidenm = ' + B.ls + ')');
  is(!!B.btn && /이름 보이기/.test(B.btn.t), '  단추가 「이름 보이기」 로 바뀐다 — ' + (B.btn ? B.btn.t : ''));
  is(srvCalls === c0, '  서버를 안 부른다 (7번) — ' + (srvCalls - c0) + '번');
  /* 다시 열어도 가린 채 */
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
  await p.waitForTimeout(1200); await p.evaluate(SEED);
  const B2 = await p.evaluate(LOOK);
  is(!/홍말순|홍길순/.test(B2.t), '  ★ 다시 열어도 가린 채 — 고객 앞에서 앱을 다시 켜도 안 샌다');

  console.log('\n[4] 다시 누르면 실명 · 홈 키 그대로');
  await p.click('#hmNmBtn'); await p.waitForTimeout(900);
  const C = await p.evaluate(LOOK);
  is(/홍말순/.test(C.t) && C.ls == null, '  실명으로 돌아오고 기억도 지운다');
  is(A.H === B.H && B.H === C.H, '  홈 키가 그대로 — ' + [A.H, B.H, C.H].join(' · ') + 'px');

  console.log('\n[5] ★ <b>나가는 이름은 그대로 가린다</b>');
  const O = await p.evaluate(() => ({
    cal: (typeof mcalOutName === 'function') ? mcalOutName({ id: 'x', advisor_id: 'me', name_masked: '홍*순' }) : null,
    out: (typeof hmOutNm === 'function') ? hmOutNm({ nm: '홍말순' }) : null }));
  is(O.cal !== null && !/홍말순/.test(O.cal), '  폰 달력으로 나가는 이름 — 「' + O.cal + '」');
  is(O.out !== null && !/홍말순/.test(O.out), '  계산기로 미는 이름 — 「' + O.out + '」');

  console.log('\n[6] 가린 이름 되돌리기 — 한 분으로만 맞을 때만 (1번)');
  const U = await p.evaluate(() => {
    const one = hmFullNm(osMaskName('홍길동'));  /* 홍말순·홍길순은 둘 다 홍*순이라 이미 두 분입니다 */
    const d = AR.db; AR.db = d.concat([Object.assign({}, d[0], { id: 'd9', name: '홍가동' })]);
    try { MCAL_REAL.src = null; } catch (e) {}
    const two = hmFullNm(osMaskName('홍길동'));
    AR.db = d; try { MCAL_REAL.src = null; } catch (e) {}
    return { one, two, mk: osMaskName('홍길동'), amb: hmFullNm('홍*순') };
  });
  is(U.one === '홍길동', '  한 분이면 실명 — ' + U.mk + ' → ' + U.one);
  is(U.two === U.mk, '  두 분(홍길동·홍가동)이면 가린 채 — ' + U.two + ' (엉뚱한 이름을 안 붙인다)');
  is(U.amb === '홍*순', '  홍말순·홍길순처럼 가린 꼴이 같은 두 분도 가린 채 — ' + U.amb);

  is(errs.length === 0, '  페이지 오류 0 — ' + (errs[0] || ''));
  await b.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '가지 빨간불' : '\n✓ 오늘(홈) 실명 · 가리기 단추 · 나가는 이름은 가림');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
