/* ══════════════════════════════════════════════════════════════════
   check-hmmadi.js — <b>목각의 「보낼 말 보기」.</b>

   사장님 말씀 (2026-10-02) — <b>「보낼 말 보기도 만들어줘」</b>.
   목각(docs/APEX_목각.html 900줄)은 곁기둥 「💌 이번 달 고객 관리」 칸에
   <b>「마디 N건 — 오늘 것만이 아니라 이번 달 것 전부입니다」</b> 와
   <b>「보낼 말 보기」</b> 단추를 둡니다. 우리는 그 자리에 <b>「아직 세는
   자리가 없습니다」</b> 라고만 적고 있었습니다.

   ── <b>세는 자리는 이미 있었습니다</b> (5번) ──────────────────────
   계약 마디는 <b>mstDueList()</b> 가 세고, 보낼 말은 <b>MST_STEPS</b>
   (1·3·6·9·12개월)에 적혀 있고, 복사는 <b>mstCopy()</b> 가 하고, 「보냈습니다」
   는 <b>mstToggle()</b> 이 적습니다 — 「고객 365일」 의 <b>📆 계약 마디 접점</b>
   카드가 그 전부를 들고 있었습니다. 홈이 <b>안 부르고 있었을 뿐</b>입니다.
   그래서 「이번 달 것 전부」 를 얻으려고 그 자에 <b>바구니 하나(mon)</b>만
   더했습니다. 홈에서 또 세면 두 화면이 <b>다른 수</b>를 말합니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>세는 자가 하나다</b> — 홈이 mstDueList 를 부르고, 계약일을
         직접 읽거나 달을 제 손으로 세지 않는다
     [2] ★★ <b>「이번 달 것 전부」 다</b> — 오늘 것만이 아니고, 지난달·
         다음달 마디는 안 센다. 목각이 적어 둔 그 말을 화면에도 적는다
     [3] ★★ <b>보낸 것까지 세고 「아직 몇 건」 을 갈라 적는다</b> —
         보냈다고 적으면 「아직」 만 줄고 「마디 N건」 은 그대로다
         (줄면 「없어졌다」 로 읽힙니다)
     [4] ★★ <b>못 읽었으면 수를 안 적는다</b> (1번) — 줄을 안 세우고
         이름표도 0개. 「0건」 은 「할 일이 없다」 로 읽힙니다
     [5] ★★ <b>계약일 모르는 분을 몇 분인지 적는다</b> (1번) — 조용히
         빠뜨리면 「이번 달은 할 일이 없다」 가 됩니다
     [6] ★★ <b>이름이 한 자도 안 찍힌다</b> (3번) — 홈은 고객 앞에서
         여는 화면입니다
     [7] ★★ <b>단추가 정말 그 자리로 간다</b> — 누르면 고객 365일이 열리고
         「📆 계약 마디 접점」 카드와 「📋 보낼 말 복사」 가 거기 있다
     [8] ★★ <b>홈에 보낼 말을 베껴 적지 않았다</b> (5번) — 글은 MST_STEPS
         한 곳에 있습니다
     [9] ★ <b>서버를 안 부른다</b> (7번)
    [10] 길이 — 카드가 <b>옛 판(155px) 보다 길지 않다</b> · 단추 44px

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>보낸 뒤의 답은 안 셉니다.</b> 「보냈습니다」 를 누른 것까지는 알지만
   고객이 답을 주셨는지는 적어 두는 자리가 아직 없습니다. 그래서 이 칸은
   「보낼 것이 몇 건인가」 까지만 말합니다 (1번).
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8977;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
let hits = 0;
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
/* 2026-10-01 못박음 — 이번 달은 <b>10월</b>입니다 */
const PIN = () => {
  const R = Date, base = new R('2026-10-01T09:00:00Z').getTime();
  function F() { return arguments.length ? new R(...arguments) : new R(base); }
  F.now = () => base; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  window.actLoad = function () {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; AR.calls = [];
  ACT.day = { '2026-10-01': { call: 1, cli: 0, rep: 0, chk: 0 } }; ACT.from = '2026-08-03';
  go('home');
};
/* 계약일을 손으로 심습니다 — <b>서버는 안 부릅니다</b>.
   ⚠ <b>처음에 날을 잘못 골랐습니다.</b> 「9-30 계약이면 첫 마디가 11월」 이라
     여겼는데 +1개월은 <b>10-30</b> 이라 10월에 들었습니다 — 자가 울려서 알았고,
     코드가 아니라 <b>제 셈</b>이 틀렸습니다 (8번).
   10월에 드는 마디 : +1개월(2026-09-05 → 10-05) · +3개월(2026-07-20 → 10-20)
                      · +12개월(2025-10-10 → 10-10)
   10월에 <b>안</b> 드는 분 : <b>오늘 계약한 분</b>(2026-10-01) — 마디가
                      11-01 · 2027-01-01 · 04-01 · 07-01 · 10-01 로 다 밖입니다 */
const PUT = (rows) => {
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = (rows || []).map(r => ({ id: r[0], name: r[2] || '홍길동', advisor_id: 'me' }));
  CM.loaded = true; CM.meta = {};
  (rows || []).forEach(r => { CM.meta[r[0]] = r[1] ? { cd: r[1] } : {}; });
};
const LOOK = () => {
  try { go('home'); } catch (e) {}
  const pane = document.getElementById('dynPane');
  const two = pane.querySelector('.hm-2col');
  const card = two ? [].slice.call(two.children[1].children)
    .filter(e => (e.innerText || '').indexOf('이번 달 고객 관리') >= 0)[0] : null;
  const btn = card ? [].slice.call(card.querySelectorAll('button'))
    .filter(e => (e.textContent || '').indexOf('보낼 말') >= 0)[0] : null;
  return { L: (typeof mstDueList === 'function') ? (function () {
             try { const o = mstDueList();
               return { mon: o.mon.length, left: o.monLeft, due: o.due.length,
                        none: o.none, total: o.total }; } catch (e) { return null; } })() : null,
           card: card ? (card.innerText || '').replace(/\s+/g, ' ').trim() : '',
           cardH: card ? Math.round(card.getBoundingClientRect().height) : 0,
           btnH: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
           btnMin: btn ? Math.round(parseFloat(getComputedStyle(btn).minHeight) || 0) : 0,
           btnT: btn ? (btn.textContent || '').trim() : '(없음)',
           ask: [].slice.call(pane.querySelectorAll('[data-ask="이번달마디"]'))
                  .map(e => (e.textContent || '').trim()) };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    hits++; return r.abort();
  });
  await ctx.addInitScript(PIN);
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof hmMadiSideHtml === 'function' && typeof mstDueList === 'function'
                             && typeof renderHome === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(1800);
  const hits0 = hits;
  const run = (rows) => p.evaluate(({ rows, put, src }) => {
    (0, eval)('(' + put + ')')(rows);
    return (0, eval)('(' + src + ')')();
  }, { rows, put: String(PUT), src: String(LOOK) });
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const FN = (nm) => { const i = src.indexOf('function ' + nm + '('); if (i < 0) return '';
    const r = src.slice(i + 1), e = r.indexOf('\nfunction '); return e > 0 ? r.slice(0, e) : r.slice(0, 4000); };
  const MD = FN('hmMadiSideHtml');

  console.log('\n[1] ★★ <b>세는 자가 하나다</b> (5번)');
  is(MD.length > 0 && /mstDueList\(\)/.test(MD),
    '  홈이 <b>mstDueList 를 부른다</b> — 세는 자를 빌려 씁니다');
  is(MD.length > 0 && !/MST_STEPS|mstAdd\(|\.cd\b/.test(MD),
    '  ★★ 계약일·마디 표를 <b>직접 안 읽는다</b> — 읽으면 두 화면이 다른 수를 말합니다');
  is(!/function hmMadiSideHtml[\s\S]{0,1400}slice\(0,\s*7\)/.test(src),
    '  ★ <b>달을 제 손으로 세지 않는다</b> — 「이번 달」 의 뜻이 두 곳에 생기지 않습니다');

  console.log('\n[2] ★★ <b>「이번 달 것 전부」 다</b>');
  /* 10월에 드는 것 셋 + 10월 밖인 분 하나 + 계약일 모르는 분 하나 */
  const w = await run([['c1', '2026-09-05'], ['c2', '2026-07-20'], ['c3', '2025-10-10'],
                       ['c4', '2026-10-01'], ['c5', '']]);
  is(w.L && w.L.mon === 3,
    '  이번 달 마디 <b>3건</b> — ' + (w.L ? w.L.mon : 'null') + '건 (10-05 · 10-20 · 10-10)');
  is(w.L && w.L.total === 5 && w.L.none === 1,
    '  ★ 다섯 분 가운데 <b>계약일 모르는 분 1분</b> — 모두 ' + (w.L ? w.L.total : '?')
      + '분 · 모름 ' + (w.L ? w.L.none : '?') + '분');
  is(w.ask.length === 1 && w.ask[0] === '3건',
    '  화면에도 <b>그 수가 선다</b> — ' + (w.ask[0] || '없음'));
  is(w.card.indexOf('이번 달 것 전부') >= 0,
    '  ★★ <b>목각의 말을 화면에 적는다</b> — 「오늘 것만이 아니라 이번 달 것 전부」');
  /* 마디가 모두 10월 밖인 분 하나만 두면 <b>0건</b>이어야 합니다 */
  const nx = await run([['c4', '2026-10-01']]);
  is(nx.L && nx.L.mon === 0 && nx.ask.length === 0,
    '  ★★ <b>다음 달 마디는 안 센다</b> — ' + (nx.L ? nx.L.mon : 'null')
      + '건 · 이름표 ' + nx.ask.length + '개');
  is(nx.card.indexOf('없습니다') >= 0,
    '  없으면 <b>없다고 적는다</b> — 「' + (nx.card.match(/이번 달[^·]*/) || ['없다'])[0].trim() + '」');

  console.log('\n[3] ★★ <b>보낸 것까지 세고 「아직」 을 갈라 적는다</b>');
  is(w.L && w.L.left === 3 && w.card.indexOf('아직 3건') >= 0,
    '  아직 <b>3건</b> — ' + (w.L ? w.L.left : 'null') + '건');
  /* ⚠ 바로 위 [2] 에서 <b>명단을 c4 하나로 바꿔</b> 두었습니다 — 다시 심지
     않으면 c1 이 없어 0건이 나오고, 코드가 아니라 <b>제 셈</b>이 틀린 채로
     빨간불이 켭니다. 실제로 그렇게 울렸습니다 (8번).                     */
  const sent = await p.evaluate(({ rows, put, src }) => {
    (0, eval)('(' + put + ')')(rows);
    /* 10-05 마디(1개월) 하나를 「보냈습니다」 로 적습니다 */
    mstMark('c1', 1, true);
    return (0, eval)('(' + src + ')')();
  }, { rows: [['c1', '2026-09-05'], ['c2', '2026-07-20'], ['c3', '2025-10-10'],
              ['c4', '2026-10-01'], ['c5', '']],
       put: String(PUT), src: String(LOOK) });
  is(sent.L && sent.L.mon === 3,
    '  ★★ 보냈다고 적어도 <b>「마디 3건」 은 그대로</b>다 — ' + (sent.L ? sent.L.mon : 'null')
      + '건 (줄면 「없어졌다」 로 읽힙니다)');
  is(sent.L && sent.L.left === 2 && sent.card.indexOf('아직 2건') >= 0,
    '  ★ <b>「아직」 만 하나 줄었다</b> — ' + (sent.L ? sent.L.left : 'null') + '건');
  await p.evaluate(() => { mstMark('c1', 1, false); });

  console.log('\n[4] ★★ <b>못 읽었으면 수를 안 적는다</b> (1번)');
  const nul = await p.evaluate(({ src }) => {
    const keep = CM.loaded; CM.loaded = false;
    const o = (0, eval)('(' + src + ')')(); CM.loaded = keep; return o;
  }, { src: String(LOOK) });
  is(nul.ask.length === 0, '  ★★ <b>이름표가 0개</b>다 — ' + nul.ask.length + '개');
  is(nul.card.indexOf('아직 못 읽었습니다') >= 0,
    '  <b>「아직 못 읽었습니다」</b> 라고 적는다');
  is(!/\d+건/.test(nul.card), '  ★ <b>「N건」 이 한 번도 안 적힌다</b>');

  console.log('\n[5] ★★ <b>계약일 모르는 분을 적는다</b> (1번)');
  is(w.card.indexOf('계약일 모름') >= 0 && /계약일 모름 1분/.test(w.card.replace(/\s+/g, ' ')),
    '  <b>「계약일 모름 1분」</b> 이라 적는다 — 조용히 빠뜨리지 않습니다');
  const allcd = await run([['c1', '2026-09-05']]);
  is(allcd.card.indexOf('계약일 모름') < 0,
    '  ★ 모르는 분이 없으면 <b>그 말을 안 적는다</b> — 「0분」 이라고도 안 적습니다');

  console.log('\n[6] ★★ <b>이름이 한 자도 안 찍힌다</b> (3번)');
  const nm = await run([['c1', '2026-09-05', '홍길동A'], ['c2', '2026-07-20', '홍길동B']]);
  is(nm.card.indexOf('홍길동') < 0,
    '  홈 카드에 <b>이름이 없다</b>' + (nm.card.indexOf('홍길동') >= 0 ? ' ← 찍혔습니다' : ''));
  is(MD.length > 0 && !/cmName|osMaskName|\.name\b/.test(MD),
    '  ★★ 이름을 <b>꺼내 오지도 않는다</b> — 꺼내면 언젠가 찍힙니다');

  console.log('\n[7] ★★ <b>단추가 정말 그 자리로 간다</b>');
  is(w.btnT.indexOf('보낼 말 보기') >= 0, '  단추 글자가 <b>목각 그대로</b>다 — 「' + w.btnT + '」');
  is(w.btnH >= 44, '  ★ 폰에서 손가락이 닿는다 — <b>' + w.btnH + 'px</b> (44px 이상)');
  /* ⚠ ★★ <b>폰에서만 재면 아무것도 못 봅니다.</b> 640px 아래에는 「#dynPane
     button{min-height:44px}」 라는 <b>덮는 규칙</b>이 이미 있어, 곁단추가
     30px 로 적혀 있어도 폰에서는 44px 로 섭니다. 실제로 30px 로 되돌려 보니
     이 자는 44px 라 읽고 check-hmclick(넓은 폭)은 30px 라 읽었습니다 —
     <b>제 줄이 헛것이었습니다.</b> 그래서 <b>넓은 폭에서 다시 잽니다</b>.
     PC 에서도 여는 화면이라 그쪽이 진짜 구멍이었습니다 (8번).            */
  const wide = await (async () => {
    await p.setViewportSize({ width: 1024, height: 900 });
    await p.waitForTimeout(260);
    const o = await p.evaluate(() => {
      const pane = document.getElementById('dynPane');
      const b2 = [].slice.call(pane.querySelectorAll('.hm-rt-go'));
      const mine = b2.filter(e => (e.textContent || '').indexOf('보낼 말') >= 0)[0];
      return { n: b2.length,
               small: b2.filter(e => e.getBoundingClientRect().height < 44)
                        .map(e => Math.round(e.getBoundingClientRect().height)
                               + 'px 「' + (e.textContent || '').trim() + '」'),
               h: mine ? Math.round(mine.getBoundingClientRect().height) : 0 };
    });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(260);
    return o;
  })();
  is(wide.h >= 44,
    '  ★★ <b>넓은 폭(1024px)에서도 44px 이다</b> — ' + wide.h + 'px (폰은 덮는 규칙이 가려 줍니다)');
  is(wide.small.length === 0,
    '  ★★ 곁단추 <b>' + wide.n + '개가 다</b> 44px 이다 — 넷이 30px 였고 이 판에 같이 고쳤습니다'
      + (wide.small.length ? (' ← ' + wide.small.join(' / ')) : ''));
  const go = await p.evaluate(async () => {
    const pane = document.getElementById('dynPane');
    const two = pane.querySelector('.hm-2col');
    const card = [].slice.call(two.children[1].children)
      .filter(e => (e.innerText || '').indexOf('이번 달 고객 관리') >= 0)[0];
    const btn = [].slice.call(card.querySelectorAll('button'))
      .filter(e => (e.textContent || '').indexOf('보낼 말') >= 0)[0];
    if (!btn) return { no: '단추를 못 찾았습니다' };
    btn.click();
    await new Promise(r => setTimeout(r, 700));
    const mst = document.getElementById('mstCard');
    return { tab: (typeof TAB !== 'undefined' ? TAB : (window.OS && OS.tab) || ''),
             has: !!mst,
             copy: mst ? /보낼 말 복사/.test(mst.innerText || '') : false,
             done: mst ? /보냈습니다/.test(mst.innerText || '') : false,
             title: mst ? (mst.innerText || '').replace(/\s+/g, ' ').slice(0, 40) : '' };
  });
  is(!go.no && go.has,
    '  ★★ 누르면 <b>「📆 계약 마디 접점」 카드가 거기 있다</b> — 「' + (go.title || '없습니다') + '」');
  is(!!go.copy, '  ★★ 거기 <b>「📋 보낼 말 복사」</b> 가 있다 — 홈이 그 자리로 모신 것이 맞습니다');
  is(!!go.done, '  ★ <b>「보냈습니다」</b> 도 거기 있다 — 보내고 적는 자리까지 한 곳입니다');

  console.log('\n[8] ★★ <b>홈에 보낼 말을 베껴 적지 않았다</b> (5번)');
  is(MD.length > 0 && !/고객님, 안녕하세요/.test(MD),
    '  홈에 <b>보낼 글이 없다</b> — 글은 MST_STEPS 한 곳에 있습니다');
  is((src.match(/고객님, 안녕하세요\. 지난달 준비해 드린/g) || []).length === 1,
    '  ★★ 1개월 마디의 글이 <b>한 곳</b>뿐이다 — '
      + (src.match(/고객님, 안녕하세요\. 지난달 준비해 드린/g) || []).length + '곳');

  console.log('\n[9] ★ <b>서버를 안 부른다</b> (7번)');
  is(hits === hits0, '  이 자가 재는 동안 바깥을 <b>' + (hits - hits0) + '번</b> 불렀다');
  is(MD.length > 0 && !/osClient\(/.test(MD),
    '  ★ 홈 카드가 <b>서버를 안 부른다</b> — 읽어 둔 것으로만 셈합니다');

  console.log('\n[10] 길이 — <b>옛 판보다 길지 않다</b>');
  /* 옛 판(「아직 세는 자리가 없습니다」 한 장)은 155px 였습니다. 홈에 남은
     자리가 4.8px 뿐이라, 이 칸은 그보다 <b>길어지면 안 됩니다</b>.      */
  is(w.cardH <= 155,
    '  카드가 <b>' + w.cardH + 'px</b> — 옛 판 155px 이하 (홈에 남은 자리가 4.8px 입니다)');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 「보낼 말 보기」 에 구멍이 있습니다')
                  : '✓ 이번 달 것 전부를 세고 · 보낸 것도 세고 · 모르면 0 이라 하지 않고 · 이름을 안 적고 · 단추가 그 자리로 갑니다');
  console.log('  ⚠ 보낸 뒤의 <b>답</b>은 안 셉니다 — 적어 두는 자리가 아직 없습니다 (1번).');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
