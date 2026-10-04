/* ══════════════════════════════════════════════════════════════════
   check-hmsit.js — <b>「고객의 현재 상황은 무엇인가요?」 와 맨 밑의 이번 주.</b>

   사장님 말씀 (2026-10-02) —
     「오늘 칸에, <b>이번주 캘린더 주간만 짤라서 맨 밑에</b> 띄어주고,
      <b>전화 걸러 갑니다 에서, 고객의 현재 상황은 무엇인가요? 로 묻고</b>,
      그걸 클릭하면 <b>TA / AP / PC / CS / 부재 / 거절</b> 나누고, 여기서
      클릭하면, <b>거기에 맞게 내가 맞는 기능들을 권유</b>하도록 띄어줘」

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] <b>물음이 큰 단추 자리</b>에 있다 — 「전화 걸러 갑니다」 자리를
         받았고, 안 고르셨으면 큰 단추가 <b>따로 안 선다</b>
     [2] <b>여섯 갈래</b>가 다 선다 — TA · AP · PC · CS · 부재 · 거절.
         DB 에 적힌 것은 <b>「·지금」</b> 으로 표시된다
     [3] ★★ <b>상황마다 권하는 것이 정말 다르다</b> — 여섯 모두
         무엇으로·무엇을 얻어 오나·어떻게가 다르고, <b>도구 묶음도 다르다</b>.
         같은 말이 여섯 곳에 나오면 분류한 척만 한 것이다
     [4] ★★ <b>분류를 홈에서 새로 짓지 않는다</b> (5번) — apex-stage.js 의
         MAP·BOX 가 쥔 것을 TDO 로 받아 그대로 쓴다. 표를 바꿔치기하면
         화면도 같이 바뀐다
     [5] ★★ <b>도구가 다 열린다</b> — 메뉴에 있는 것만 세운다(navItemOf)
     [6] ★★ <b>묻는 말에 몰래 쓰기를 섞지 않는다</b> (1번) — 상황을 고르는
         것은 <b>보여 달라는 말</b>이다. DB 줄의 단계가 <b>안 바뀐다</b>.
         DB 와 다른 것을 고르면 <b>다르다고 적고</b>, 그때는 큰 단추를
         <b>안 세운다</b> — 누르면 본 상황이 아닌 것으로 기록이 남는다
     [7] 📆 <b>이번 주가 맨 밑</b>에 있다 · 일곱 칸이다 · 날을 누르면
         그 자리에서 펴진다
     [8] ★ <b>격자를 새로 안 그린다</b> (5번) — 달력 화면의 mcalWeekHtml 을
         그대로 부른다. 바꿔치기하면 홈도 같이 바뀐다
     [9] 달력을 <b>못 읽었으면 「못 읽었습니다」</b> — 빈 주를 세우지 않는다 (1번)

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   「권하는 도구가 그 상황에 <b>정말 맞는가</b>」 는 안 잽니다 — 그것은
   사장님이 BOX 표에 적어 두신 판단입니다. 이 자는 <b>그 표가 화면까지
   그대로 오는가</b>만 봅니다. 표가 틀리면 여기는 초록입니다.
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8979;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const WHAT = ['TA', 'AP', 'PC', 'CS', '부재', '거절'];

/* 견본은 <b>홍길동</b> 집안 (3번). DB 단계는 <b>AP</b> 로 두어, 다른 것을
   골랐을 때 「다르다」 고 적는지 볼 수 있게 합니다.                      */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = [];
  AR.db = [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반',
             stage:'AP', days:3, n:2, res:'상담', cAt:'', pAt:'' }];
  AR.cat = 'touch'; AR.tkAll = false;
  go('home');
};
/* 그 카드의 <b>물음·칩·권유</b>를 한 곳에서 뜹니다 (5번) */
const LOOK = () => {
  const pane = document.getElementById('dynPane');
  const B = [].slice.call(pane.querySelectorAll('button'));
  const q = B.filter(e => (e.textContent || '').indexOf('현재 상황은 무엇인가요') >= 0)[0];
  const chips = [].slice.call(pane.querySelectorAll('.t-chip'))
    .filter(e => /·지금|^(☎️|🤝|📄|✍️|📵|🚫)\s*(TA|AP|PC|CS|부재|거절)/
      .test((e.textContent || '').trim()))
    .map(e => ({ t: (e.textContent || '').replace(/\s+/g, ' ').trim(),
                 h: Math.round(e.getBoundingClientRect().height),
                 on: /(^|\s)on(\s|$)/.test(e.className || '') }));
  const notes = [].slice.call(pane.querySelectorAll('.t-note'))
    .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim());
  const big = B.filter(e => /(^|\s)hm-do(\s|$)/.test(e.className || ''))
    .map(e => (e.textContent || '').trim());
  return { q: q ? (q.textContent || '').replace(/\s+/g, ' ').trim() : '',
           qh: q ? Math.round(q.getBoundingClientRect().height) : 0,
           chips: chips, notes: notes, big: big };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof hmStHtml === 'function'
                             && typeof hmWeekBody === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(2200);
  const look = () => p.evaluate(LOOK);
  const pick = (w) => p.evaluate(({ w, src }) => {
    const k = (hmSteps()[0] || {}).key || '';
    if (w) hmStPick(k, w); else { HM_ST[k] = ''; try { hmPaint(); } catch (e) {} }
    return (0, eval)('(' + src + ')')();
  }, { w, src: String(LOOK) });

  /* ── [1] 물음이 큰 단추 자리 ─────────────────────────────── */
  console.log('\n[1] <b>물음이 큰 단추 자리</b>에 있다');
  const A0 = await pick('');
  is(A0.q.indexOf('고객의 현재 상황은 무엇인가요') >= 0,
    '  물음 단추가 <b>있다</b> — 「' + (A0.q || '없습니다') + '」');
  is(A0.qh >= 44, '  <b>44px 이상</b>이다 — ' + A0.qh + 'px');
  is(A0.big.length === 1,
    '  ★ 안 고르셨으면 큰 단추가 <b>물음 하나</b>다 — ' + A0.big.length + '개 '
      + JSON.stringify(A0.big) + ' (둘이 서면 무엇을 먼저 누를지 흐려집니다)');

  /* ── [2] 여섯 갈래 ───────────────────────────────────────── */
  console.log('\n[2] <b>여섯 갈래</b>가 다 선다 · DB 것은 「·지금」');
  const A = await pick('AP');
  is(A.chips.length === 6, '  칩이 <b>여섯</b>이다 — ' + A.chips.length + '개');
  WHAT.forEach(w => is(A.chips.some(c => c.t.indexOf(w) >= 0), '  <b>' + w + '</b> 가 있다'));
  is(A.chips.filter(c => c.t.indexOf('·지금') >= 0).length === 1
     && A.chips.filter(c => c.t.indexOf('·지금') >= 0)[0].t.indexOf('AP') >= 0,
    '  ★ DB 것(AP)에만 <b>「·지금」</b> 이 붙는다');
  is(A.chips.every(c => c.h >= 44), '  칩도 <b>44px 이상</b>이다');

  /* ── [3]·[5]·[6] 상황마다 다른가 · 다 열리나 · 안 쓰나 ─────── */
  console.log('\n[3] ★★ <b>상황마다 권하는 것이 정말 다르다</b>');
  const got = {};
  for (const w of WHAT) {
    got[w] = await p.evaluate(({ w }) => {
      const k = (hmSteps()[0] || {}).key || '';
      hmStPick(k, w);
      const pane = document.getElementById('dynPane');
      const say = [].slice.call(pane.querySelectorAll('.t-note.b'))
        .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim())[0] || '';
      const tools = (typeof tdoTools === 'function') ? tdoTools(w).map(t => t.id) : [];
      /* ⚠ <b>「오늘 챙길 것」 안으로 좁혀 셉니다.</b> 처음에는 홈 전체에서
         go('…') 칩을 셌는데, 위 띠의 <b>🔔 알람 칩</b>(go('me'))까지 같이
         세어 여섯 자리가 모두 <b>하나씩 많게</b> 나왔습니다 — 코드가 아니라
         제 셈이 틀린 <b>헛것</b>이었습니다 (8번).                        */
      const host = document.getElementById('hmToday') || pane;
      const shown = [].slice.call(host.querySelectorAll('.t-chip'))
        .map(e => (e.getAttribute('onclick') || ''))
        .filter(o => o.indexOf("go('") === 0)
        .map(o => (o.match(/go\('([^']+)'/) || [])[1]);
      const warn = [].slice.call(pane.querySelectorAll('.t-note'))
        .map(e => (e.textContent || '')).filter(t => t.indexOf('DB 에') >= 0).length;
      const big = [].slice.call(pane.querySelectorAll('.hm-do'))
        .map(e => (e.textContent || '').trim()).filter(t => t.indexOf('현재 상황은') < 0);
      return { say, tools, shown, warn, big, stage: (AR.db[0] || {}).stage };
    }, { w });
  }
  const says = WHAT.map(w => got[w].say);
  is(new Set(says).size === 6,
    '  여섯이 <b>다른 말</b>을 한다 — ' + new Set(says).size + '가지');
  WHAT.forEach(w => console.log('      ' + w.padEnd(3) + ' ' + got[w].say.slice(0, 64)));
  const sig = WHAT.map(w => got[w].tools.join(','));
  is(new Set(sig).size >= 5,
    '  ★★ <b>도구 묶음도 다르다</b> — ' + new Set(sig).size + '가지 / 여섯 ('
      + WHAT.map(w => w + ' ' + got[w].tools.length + '개').join(' · ') + ')');

  console.log('\n[5] ★★ <b>도구가 다 열린다</b> — 메뉴에 있는 것만 세운다');
  const navOk = await p.evaluate(({ WHAT }) => {
    const bad = [];
    WHAT.forEach(w => (tdoTools(w) || []).forEach(t => {
      if (!navItemOf(t.id)) bad.push(w + '→' + t.id);
    }));
    return bad;
  }, { WHAT });
  is(navOk.length === 0, '  메뉴에 없는 도구 <b>' + navOk.length + '개</b>'
    + (navOk.length ? (' ← ' + navOk.join(' / ')) : ''));
  WHAT.forEach(w => is(got[w].shown.length === got[w].tools.length,
    '  <b>' + w + '</b> — 화면에 선 도구 ' + got[w].shown.length + '개 = 표가 준 것 '
      + got[w].tools.length + '개'));

  console.log('\n[6] ★★ <b>묻는 말에 몰래 쓰기를 섞지 않는다</b> (1번)');
  is(WHAT.every(w => got[w].stage === 'AP'),
    '  여섯을 다 눌러도 DB 줄의 단계가 <b>안 바뀐다</b> — ' + got['거절'].stage);
  is(got['AP'].warn === 0, '  DB 와 <b>같은 것</b>을 고르면 알림이 없다');
  is(WHAT.filter(w => w !== 'AP').every(w => got[w].warn === 1),
    '  ★ DB 와 <b>다른 것</b>을 고르면 「다릅니다」 라고 적는다');
  is(got['AP'].big.length === 1 && WHAT.filter(w => w !== 'AP').every(w => got[w].big.length === 0),
    '  ★★ 다른 상황을 보는 중에는 <b>큰 단추를 안 세운다</b> — 누르면 본 상황이 '
      + '아닌 것으로 기록이 남습니다 (AP ' + got['AP'].big.length + '개 · 나머지 0개)');

  /* ── [4] 표를 바꿔치기하면 화면도 바뀌나 ─────────────────── */
  console.log('\n[4] ★★ <b>분류를 홈에서 새로 짓지 않는다</b> (5번)');
  const swap = await p.evaluate(() => {
    const k = (hmSteps()[0] || {}).key || '';
    const keep = TDO['PC'].aim; TDO['PC'].aim = '★표에서 왔습니다★';
    hmStPick(k, 'PC');
    const t = ([].slice.call(document.getElementById('dynPane').querySelectorAll('.t-note.b'))
      .map(e => e.textContent || '')[0]) || '';
    TDO['PC'].aim = keep; return t;
  });
  is(swap.indexOf('★표에서 왔습니다★') >= 0,
    '  표(TDO←apex-stage)를 바꿔치기하면 <b>화면도 같이 바뀐다</b> — 「' + swap.slice(0, 44) + '」');

  /* ── [7]·[8]·[9] 이번 주 ─────────────────────────────────── */
  console.log('\n[7] 📆 <b>이번 주가 맨 밑</b>에 있다');
  const wk = await p.evaluate(() => {
    const k = (hmSteps()[0] || {}).key || ''; HM_ST[k] = '';
    try { hmPaint(); } catch (e) {}
    const t = document.getElementById('hmToday');
    const body = t ? t.querySelector('.card-body') : null;
    const kids = body ? [].slice.call(body.children) : [];
    const h = document.getElementById('hmWkHost');
    const before = h ? Math.round(h.getBoundingClientRect().height) : 0;
    const cells = h ? h.querySelectorAll('.mcal-wd').length : 0;
    const c0 = h ? h.querySelector('.mcal-wd') : null;
    if (c0) c0.click();
    const h2 = document.getElementById('hmWkHost');
    return { last: kids.length ? (kids[kids.length - 1].id || kids[kids.length - 1].className) : '',
             cells: cells, before: before,
             after: h2 ? Math.round(h2.getBoundingClientRect().height) : 0,
             opened: h2 ? /잡힌 것이 없습니다|오늘|월 \d+일/.test(h2.innerText || '') : false,
             head: h ? ((h.querySelector('.hm-rt-h') || {}).textContent || '').replace(/\s+/g, ' ').trim() : '' };
  });
  is(wk.last === 'hmWkHost', '  카드의 <b>맨 밑 칸</b>이다 — ' + (wk.last || '못 찾았습니다'));
  is(wk.cells === 7, '  칸이 <b>일곱</b>이다 — ' + wk.cells + '개');
  is(wk.head.indexOf('이번 주') >= 0, '  머리글이 <b>「이번 주」</b> 다 — 「' + wk.head + '」');
  is(wk.after > wk.before && wk.opened,
    '  ★ 날을 누르면 <b>그 자리에서 펴진다</b> — ' + wk.before + ' → ' + wk.after + 'px');

  console.log('\n[8] ★ <b>격자를 새로 안 그린다</b> (5번)');
  const g = await p.evaluate(() => {
    const keep = window.mcalWeekHtml;
    window.mcalWeekHtml = function () { return '<i>★달력에서 왔습니다★</i>'; };
    const t = hmWeekBody(); window.mcalWeekHtml = keep; return t;
  });
  is(g.indexOf('★달력에서 왔습니다★') >= 0, '  달력의 mcalWeekHtml 을 <b>그대로 부른다</b>');

  console.log('\n[9] 달력을 <b>못 읽었으면 못 읽었다고</b> 적는다 (1번)');
  const no = await p.evaluate(() => {
    const keep = window.mcalItems;
    window.mcalItems = function () { return null; };
    const t = hmWeekBody(); window.mcalItems = keep; return t;
  });
  is(no.indexOf('아직 못 읽었습니다') >= 0 && no.indexOf('mcal-wd') < 0,
    '  <b>빈 주를 안 세운다</b> — 「이번 주에 아무것도 없다」 가 되지 않습니다');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 상황 묻기 · 이번 주에 구멍이 있습니다')
                  : '✓ 여섯이 저마다 다른 것을 권하고 · 기록은 안 바뀌고 · 이번 주가 맨 밑에 섭니다');
  console.log('  ⚠ 「그 상황에 정말 맞는 도구인가」 는 안 잽니다 — 그것은 사장님이 BOX 표에 적어 두신 판단입니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
