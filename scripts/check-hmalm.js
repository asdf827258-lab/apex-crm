/* ══════════════════════════════════════════════════════════════════
   check-hmalm.js — <b>홈의 🔔 알람 칩과 곁기둥 알람 카드.</b>

   사장님 말씀 (2026-10-02) — <b>「알람 칩도 세워줘」</b>.

   ⚠ <b>제가 「못 셉니다」 라고 적어 둔 자리였습니다 — 틀렸습니다.</b>
   앱은 자기 알람 시각을 <b>alm-slots.js 한 표</b>로 알고, 켜고 끈 것과 바꾼
   시각은 이 브라우저에 있습니다. 시계만 보면 <b>오늘 몇 번 남았는지</b> 셀 수
   있습니다. 못 센다고 적어 둔 것을 그대로 두면 <b>자가 거짓말</b>을 합니다 (8번).

   ── 이 자가 재는 것 ───────────────────────────────────────────────
     [1] <b>칩이 선다</b> · 누르면 🔔 알람 화면으로 가고 · 손가락이 닿는다
     [2] ★★ <b>네 때를 갈라 적는다</b> (1번) —
           모름(표를 못 읽음) ≠ 다 꺼짐 ≠ 오늘 다 지남 ≠ N번 남음.
         <b>모를 때 숫자를 안 적습니다</b>
     [3] ★★ <b>칩과 카드가 같은 수</b>를 적는다 (0-1번) — 세는 곳은
         almLeftToday() 하나다. 따로 세면 한 화면에서 두 답이 선다.
         이름표(data-ask="오늘남은알람")가 그것을 잡게 해 둔다
     [4] ★ <b>시계를 돌려</b> 센다 — 아침엔 셋, 오후엔 하나, 밤엔 없다.
         값을 박아 둔 것이 아니라 <b>정말 세는지</b>를 봅니다
     [5] ★★ <b>울린다고 단정하지 않는다</b> (1번) — 그 답은 서버에 이 기기가
         담겼는지에 달렸다. 홈에서 그것을 물으면 <b>서버를 부르게</b> 되므로
         (7번) 이 브라우저가 받을 수 있나까지만 적는다
     [6] <b>서버를 안 부른다</b> (7번) — 칩 하나 때문에 홈이 서버를 깨우지 않는다
     [7] ★ 곁기둥 카드가 <b>「아직 세는 자리가 없습니다」 를 더는 안 적는다</b> —
         셀 수 있게 됐으므로 그 말은 이제 거짓이다

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>알람이 실제로 울리는지는 안 잽니다.</b> 그것은 폰이 서버에 담겨 있어야
   하고(push_subs), 이 글을 쓰는 지금 <b>0줄</b>입니다. 칩이 「3번 남음」 이라고
   적는 것은 <b>시각표에 세 번 남았다</b>는 뜻이고 「세 번 울린다」 는 뜻이
   아닙니다 — 그래서 카드가 그 말을 따로 적습니다.
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8977;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
let hits = 0;                                   /* 바깥을 몇 번 부르나 (7번) */
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

const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; CM.loaded = true; CM.meta = {};
  go('home');
};

/* 시계를 <b>그 시각으로</b> 돌립니다 — 값을 박아 두지 않고 정말 세는지 봅니다 */
const AT = (hh) => {
  const R = Date, base = new R('2026-09-15T00:00:00').setHours(hh, 0, 0, 0);
  function F() { return arguments.length ? new R(...arguments) : new R(base); }
  F.now = () => base; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
/* 그 때의 칩·카드·이름표를 <b>한 곳에서</b> 뜹니다 (5번) */
const LOOK = () => {
  try { go('home'); } catch (e) {}
  const pane = document.getElementById('dynPane');
  const chip = [].slice.call(pane.querySelectorAll('.t-chip'))
    .filter(e => (e.textContent || '').indexOf('알람') >= 0)[0];
  /* ★ <b>곁칸 넷은 자리를 옮깁니다</b> (2026-10-06 · 사장님 「끌어올려」) —
     컴퓨터는 오른쪽 기둥(#hmSideHost), 폰은 오늘 카드 안 「지금 할 것」
     바로 아래(#hmSideUp)입니다. 그래서 <b>「두 기둥의 둘째 칸」 으로 찾지
     않습니다</b> — 그렇게 찾으면 폰에서 못 찾아 헛된 빨간불이 켜집니다 (8번).
     세울 자리를 정하는 곳은 app 쪽 hmSidePlace 하나입니다 (5번).        */
  const 곁칸 = [].concat(
    [].slice.call(document.querySelectorAll('#hmSideUp>*')),
    [].slice.call(document.querySelectorAll('#hmSideHost>*')));
  const R = 곁칸.length ? { children: 곁칸 } : null;
  const card = R ? [].slice.call(R.children)
    .filter(e => (e.innerText || '').indexOf('알람') >= 0)[0] : null;
  const ask = [].slice.call(pane.querySelectorAll('[data-ask="오늘남은알람"]'))
    .map(e => (e.textContent || '').trim());
  return {
    chip: chip ? (chip.textContent || '').replace(/\s+/g, ' ').trim() : '',
    chipH: chip ? Math.round(chip.getBoundingClientRect().height) : 0,
    chipGo: chip ? (chip.getAttribute('onclick') || '') : '',
    card: card ? (card.innerText || '').replace(/\s+/g, ' ').trim() : '',
    ask: ask, n: (almLeftToday() || []).length,
    none: almLeftToday() === null
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* ★ 바깥을 막고 <b>센다</b> — 홈이 칩 때문에 서버를 부르면 그 자리에서 보입니다 */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    hits++; return r.abort();
  });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof almLeftToday === 'function'
                             && typeof hmAlmChipHtml === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(2200);
  const run = async (hh, prep) => p.evaluate(({ hh, prep, at, src }) => {
    (0, eval)('(' + at + ')')(hh);
    if (prep) (0, eval)('(' + prep + ')')();
    return (0, eval)('(' + src + ')')();
  }, { hh, prep: prep ? String(prep) : '', at: String(AT), src: String(LOOK) });
  const hitsBefore = hits;

  /* ── [1]·[4] 아침 — 켠 셋이 다 남음 ─────────────────────────── */
  console.log('\n[1] <b>칩이 선다</b> · 누르면 그 화면으로 간다 · 손가락이 닿는다');
  const A = await run(6);
  is(!!A.chip, '  칩이 <b>있다</b> — 「' + (A.chip || '없습니다') + '」');
  /* ⚠ <b>목각 글자는 nav 'alm' 이지만 우리 화면 이름은 'me' 입니다</b> —
     알람은 「나 — 알람 · 내 숫자」 안에 있습니다(사장님 말씀 2026-09-25).
     처음 'alm' 을 적었다가 check-hmclick 이 「메뉴에 없는 화면」 으로
     잡아 주었습니다. 목각 이름을 그대로 베끼면 안 열리는 단추가 섭니다. */
  is(A.chipGo.indexOf("go('me')") >= 0,
    '  누르면 <b>「나 — 알람 · 내 숫자」</b> 로 간다 — ' + (A.chipGo || '없습니다'));
  is(A.chipH >= 44, '  <b>44px 이상</b>이다 — ' + A.chipH + 'px');

  console.log('\n[4] ★ <b>시계를 돌려 정말 세는지</b> 봅니다 (값을 박아 둔 것이 아닙니다)');
  is(A.n === 3 && /3번/.test(A.chip),
    '  새벽 6시 — 켠 셋이 <b>다 남았다</b> · ' + A.n + '번 / 칩 「' + A.chip + '」');
  const B = await run(14);
  is(B.n === 1 && /1번/.test(B.chip),
    '  오후 2시 — <b>하나만</b> 남았다 · ' + B.n + '번 / 칩 「' + B.chip + '」');
  const C = await run(22);
  is(C.n === 0 && C.chip.indexOf('다 지났습니다') >= 0,
    '  밤 10시 — <b>다 지났다</b> · 칩 「' + C.chip + '」');

  console.log('\n[2] ★★ <b>네 때를 갈라 적는다</b> (1번)');
  is(C.ask.length === 0,
    '  ★ 다 지난 때는 <b>숫자를 안 적는다</b> — 이름표 ' + C.ask.length + '개 (0번이라고 적지 않습니다)');
  const D = await run(6, () => { almSlotSet('call', false); almSlotSet('am', false); almSlotSet('perf', false); });
  is(D.chip.indexOf('다 꺼져 있습니다') >= 0,
    '  <b>다 꺼 놓으면</b> 그렇게 적는다 — 「' + D.chip + '」 (「다 지남」 과 다른 말입니다)');
  is(D.ask.length === 0, '  그때도 <b>숫자를 안 적는다</b> — 이름표 ' + D.ask.length + '개');
  const E = await p.evaluate(({ at, src }) => {
    (0, eval)('(' + at + ')')(6);
    const keep = window.ALM_SLOTS; window.ALM_SLOTS = [];       /* 표를 못 읽은 판 */
    const o = (0, eval)('(' + src + ')')();
    window.ALM_SLOTS = keep; return o;
  }, { at: String(AT), src: String(LOOK) });
  is(E.none === true && E.chip.indexOf('아직 못 읽었습니다') >= 0,
    '  ★★ <b>표를 못 읽었으면 「아직 못 읽었습니다」</b> — 「0번」 이 아닙니다 (1번) · 「' + E.chip + '」');
  is(E.ask.length === 0, '  그때도 <b>숫자가 없다</b> — 이름표 ' + E.ask.length + '개');

  /* ── [3] 칩과 카드가 같은 수 ─────────────────────────────────── */
  console.log('\n[3] ★★ <b>칩과 카드가 같은 수</b>를 적는다 (0-1번)');
  const F = await run(6, () => { almSlotSet('call', true); almSlotSet('am', true); almSlotSet('perf', true); });
  is(F.ask.length === 2, '  이름표를 <b>둘</b>이 달고 있다 — ' + F.ask.length + '개 (칩 · 카드)');
  is(F.ask.length === 2 && F.ask[0] === F.ask[1],
    '  ★★ <b>같은 수</b>다 — ' + F.ask.join(' / ') + (F.ask[0] === F.ask[1] ? '' : ' ← 갈렸습니다'));
  is(F.card.indexOf('오늘 남은 알람') >= 0 && /9시|13시|17시/.test(F.card),
    '  카드가 <b>몇 시에 무엇인지</b>도 적는다 — 「' + F.card.slice(0, 60) + '」');

  /* ── [5]·[7] 울린다고 단정하지 않는다 ────────────────────────── */
  console.log('\n[5] ★★ <b>울린다고 단정하지 않는다</b> (1번)');
  is(F.card.indexOf('울립니다') < 0 || F.card.indexOf('안 받습니다') >= 0,
    '  「울립니다」 라고 <b>단정하지 않는다</b> — 서버에 담겼는지는 여기서 모릅니다');
  is(F.card.indexOf('이 브라우저로는 안 받습니다') >= 0,
    '  <b>이 브라우저가 받을 수 있나</b>까지만 적는다 (almPhoneOn · 서버를 안 부릅니다)');

  console.log('\n[7] ★ 곁기둥 카드가 <b>「아직 세는 자리가 없습니다」 를 더는 안 적는다</b>');
  is(F.card.indexOf('아직 세는 자리가 없습니다') < 0,
    '  셀 수 있게 됐으므로 그 말은 <b>이제 거짓</b>입니다 (8번)');

  console.log('\n[6] <b>서버를 안 부른다</b> (7번)');
  is(hits === hitsBefore,
    '  재는 동안 바깥을 <b>' + (hits - hitsBefore) + '번</b> 불렀다 — 칩 하나 때문에 홈이 서버를 깨우지 않습니다');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  console.log('\n[8] ★★ <b>네 상태가 같은 높이로 적힌다</b> (2026-10-10 · 판 X76)');
  {
    /* ⚠ <b>여기가 홈을 사장님 선(4.2화면) 밖으로 밀어냈습니다.</b>
       이 곁칸은 네 상태로 적는데, 그중 셋이 <b>회색 상자</b>(.hm-rt-none ·
       padding 12px + margin 9px)를 쓰고 하나만 맨 줄(.hm-rt-n)이었습니다.
       그래서 <b>때에 따라 24px 이 늘었다 줄었다</b> 했습니다 —
         아침(남은 알람 있음 · 맨 줄) 3,540px · 4.19 ✓
         저녁(다 지났음 · 회색 상자)   3,564px · 4.22 ✗
       홈 높이 자는 <b>시계를 안 봅니다.</b> CI 가 낮에 돌면 초록, 저녁에
       돌면 빨간불이어서 PR 셋이 그대로 들어갔습니다.
       ★ 그래서 네 상태를 <b>모두 맨 줄</b>로 맞췄고, 이 자가 그것을 지킵니다.
         상자를 다시 쓰면 홈이 때에 따라 선을 넘습니다.
       ★ <b>다른 칸의 .hm-rt-none 은 안 셉니다</b> — 달력·업적·동선 칸은
         정말 「빈 자리」 를 적는 곳이라 상자가 맞습니다 (헛것 금지 · 8번). */
    const src = fs.readFileSync('app/index.html', 'utf8');
    const i = src.indexOf('function hmAlmSideHtml(){');
    const j = src.indexOf('\n}', i);
    const 몸 = src.slice(i, j > 0 ? j : i + 4000).replace(/\/\*[\s\S]*?\*\//g, '');
    const 상자 = (몸.match(/class="hm-rt-none"/g) || []).length;
    const 맨줄 = (몸.match(/class="hm-rt-n"/g) || []).length;
    is(상자 === 0, '  회색 상자(.hm-rt-none)를 <b>안 쓴다</b> — 지금 ' + 상자 + '곳');
    is(맨줄 === 4, '  네 상태를 <b>맨 줄 하나</b>로 적는다 — 지금 ' + 맨줄 + '곳 (못 읽음·다 꺼짐·다 지남·남음)');
  }

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 알람 칩에 구멍이 있습니다')
                  : '✓ 네 때를 갈라 적고 · 칩과 카드가 같은 수를 말하고 · 서버를 안 부릅니다');
  console.log('  ⚠ 알람이 실제로 울리는지는 안 잽니다 — 폰이 서버에 담겨 있어야 하고, 지금 push_subs 는 0줄입니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
