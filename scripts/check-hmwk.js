/* ══════════════════════════════════════════════════════════════════
   check-hmwk.js — <b>목각 「이번 주」 칸의 세 수.</b>

   목각(docs/APEX_목각_폰.html · flowBar 아래)의 「이번 주」 칸은
   <b>전화 5 · 만남 3 · 예상업적 120만</b> 세 수를 적는데, 우리 카드는
   <b>연속 가동 하나</b>만 적고 있었습니다. 셋 가운데 <b>둘은 셀 수
   있습니다</b> — 이미 「오늘 기록」 이 같은 것을 하루치로 세고 있었습니다.

   ── <b>새로 세지 않습니다</b> (5번) ───────────────────────────────
   「전화인가 만남인가」 를 가르는 자는 <b>day-rank.js 하나</b>입니다. 하루치
   (actOf)도 이제 <b>actRange 를 부릅니다</b> — 두 곳에서 각자 가르면 한쪽만
   고쳐져 「오늘 기록」 과 「이번 주」 가 <b>다른 셈</b>이 됩니다. 줄을 모으는
   자리도 <b>hmActRows 하나</b>입니다.
   주의 첫날도 <b>mcalWkStart 하나</b>가 압니다 — 바로 아래 「이번 주」 주간
   격자와 <b>같은 주</b>여야 합니다. 한 화면에서 「이번 주」 가 두 뜻이면
   그것이 0-1번이 말하는 <b>스스로 어긋난 자리</b>입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>세는 자가 하나다</b> — actOf 가 actRange 를 부른다. 같은 날을
         범위로 주면 두 수가 <b>글자까지 같다</b>
     [2] ★★ <b>줄을 모으는 자리가 하나다</b> — hmActOf · hmWkAct 가 둘 다
         hmActRows 를 부른다
     [3] ★★ <b>「이번 주」 가 한 뜻이다</b> — 카드가 센 주의 첫날과 아래
         주간 격자의 첫날이 <b>같은 월요일</b>이다
     [4] ★★ <b>정말 센다</b> — 기록을 심으면 수가 오르고, <b>지난 주</b>
         기록은 안 세고, <b>월요일</b> 기록은 센다
     [5] ★ <b>전화와 만남을 갈라 센다</b> — 한 줄이 둘로 세어지지 않는다
     [6] ★★ <b>못 읽었으면 수를 안 적는다</b> (1번) — 줄을 안 세우고
         이름표도 0개. 「0건」 은 「아무것도 안 하셨다」 로 읽힙니다
     [7] ★★ <b>이 칸에 금액을 안 적는다</b> (5번) — 목각의 셋째 수(예상업적)는
         <b>2026-10-02 부터 셉니다</b>(check-pex). 다만 그 금액은 <b>📊 상담현황</b>
         한 곳에 적고, 이 칸은 <b>어디서 보는지</b>만 적습니다 — 같은 수를 두
         곳에 적으면 한쪽만 고쳐집니다
     [8] ★★ <b>서버를 안 부른다</b> (7번) — 이미 읽어 둔 것으로만 셈한다
     [9] 길이 — 카드가 <b>175px 이하</b>이고 칸이 안 늘어난다

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>「예상업적 120만」 이 맞는 금액인가</b> 는 안 잽니다. ⚠ 2026-10-02 부터
   <b>그 수는 셉니다</b> — 「못 셉니다」 라고 적어 두었던 제 말이 틀렸습니다
   (안 읽는 것이 아니라 <b>안 받아 오고 있었습니다</b>). 세는 자리와 그 셈은
   <b>check-pex</b> 가 봅니다. 이 자는 <b>이 칸이 금액을 안 적고 어디서
   보는지만 적는가</b> 까지입니다 — 같은 수가 두 곳에 있으면 갈립니다 (5번).
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8979;
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
/* 2026-10-01 은 <b>목요일</b>입니다 — 이번 주 월요일이 9-28 이고
   지난 주(9-25 금)가 범위 밖이라 두 쪽을 다 볼 수 있습니다 */
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
  window.actLoad = function () {};                   /* 서버는 안 부릅니다 */
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  OSC.list = [{ id: 'c1', name: '홍길동A', advisor_id: 'me' },
              { id: 'c2', name: '홍길동B', advisor_id: 'me' }];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; AR.calls = [];
  /* 연속 가동 칩이 설 만큼만 심습니다 — 이 자는 그 수를 안 봅니다 */
  ACT.day = { '2026-10-01': { call: 1, cli: 0, rep: 0, chk: 0 } }; ACT.from = '2026-08-03';
  go('home');
};
/* 접촉 기록을 손으로 심습니다 — <b>서버는 안 부릅니다</b> */
const PUT = (rows) => {
  CM.meta = { c1: { touch: [] }, c2: { touch: [] } };
  (rows || []).forEach((r, i) => { CM.meta[i % 2 ? 'c2' : 'c1'].touch.push({ at: r[0], how: r[1] }); });
};
const LOOK = () => {
  try { go('home'); } catch (e) {}
  const pane = document.getElementById('dynPane');
  const two = pane.querySelector('.hm-2col');
  const card = two ? [].slice.call(two.children[1].children)
    .filter(e => (e.innerText || '').indexOf('이번 주') >= 0)[0] : null;
  const A = (n) => [].slice.call(pane.querySelectorAll('[data-ask="' + n + '"]'))
    .map(e => (e.textContent || '').trim());
  return { W: (typeof hmWkAct === 'function') ? hmWkAct() : undefined,
           T: (typeof hmActOf === 'function') ? hmActOf() : undefined,
           wk: (typeof mcalWk === 'function') ? mcalWk() : '',
           card: card ? (card.innerText || '').replace(/\s+/g, ' ').trim() : '',
           cardH: card ? Math.round(card.getBoundingClientRect().height) : 0,
           call: A('이번주전화'), meet: A('이번주만남'),
           rowN: card ? card.querySelectorAll('.hm-rt-n').length : 0,
           rowH: card ? Math.round((card.querySelector('.hm-rt-n') || { getBoundingClientRect: () => ({ height: 0 }) })
                   .getBoundingClientRect().height) : 0,
           oneLine: card ? Math.round((card.querySelector('.hm-rt-n') || { getBoundingClientRect: () => ({ height: 99 }) })
                   .getBoundingClientRect().height) <= 24 : false,
           /* ⚠ <b>카드 안에서만</b> 찾습니다. 홈 위 띠에도 「🔥 연속 N일」 칩이
              있어 pane 전체에서 찾으면 그 칩(y 137)과 카드의 전화(y 1579)를
              견주어 늘 울립니다 — 제 셈이 틀린 헛것입니다 (8번).         */
           runY: (() => { const e = card && card.querySelector('[data-ask="연속가동일"]');
                   return e ? Math.round(e.getBoundingClientRect().top) : -1; })(),
           callY: (() => { const e = card && card.querySelector('[data-ask="이번주전화"]');
                   return e ? Math.round(e.getBoundingClientRect().top) : -2; })(),
           homeH: Math.round(pane.scrollHeight) };
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
  await p.waitForFunction(() => typeof hmWkAct === 'function' && typeof renderHome === 'function'
                             && typeof mcalWkStart === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(1800);
  const hits0 = hits;
  const run = (rows) => p.evaluate(({ rows, put, src }) => {
    (0, eval)('(' + put + ')')(rows);
    return (0, eval)('(' + src + ')')();
  }, { rows, put: String(PUT), src: String(LOOK) });
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const dr = fs.readFileSync(path.join(ROOT, 'app/day-rank.js'), 'utf8');

  console.log('\n[1] ★★ <b>세는 자가 하나다</b> (5번)');
  is(/function actOf\(rows, today\) \{ return actRange\(rows, today, today\); \}/.test(dr),
    '  ★★ 하루치(actOf)가 <b>actRange 를 부른다</b> — 가르는 말을 두 곳에 안 둡니다');
  is((dr.match(/isCall\(r\.how\)/g) || []).length === 1,
    '  ★ 「전화인가」 를 묻는 자리가 <b>한 곳</b>이다 — '
      + (dr.match(/isCall\(r\.how\)/g) || []).length + '곳');
  const same = await p.evaluate(() => {
    const rows = [{ at: '2026-10-01', how: '통화' }, { at: '2026-10-01', how: '만남' },
                  { at: '2026-09-30', how: '통화' }];
    return { a: DAYRANK.actOf(rows, '2026-10-01'),
             b: DAYRANK.actRange(rows, '2026-10-01', '2026-10-01') };
  });
  is(JSON.stringify(same.a) === JSON.stringify(same.b),
    '  ★★ 같은 날을 범위로 주면 <b>두 수가 같다</b> — ' + JSON.stringify(same.a));

  console.log('\n[2] ★★ <b>줄을 모으는 자리가 하나다</b> (5번)');
  is(/function hmActOf\(\)\{\s*var rows=hmActRows\(\);/.test(src),
    '  오늘치가 <b>hmActRows</b> 를 부른다');
  is(/function hmWkAct\(\)\{\s*var rows=hmActRows\(\);/.test(src),
    '  이번 주치도 <b>같은 자리</b>를 부른다');
  is((src.match(/m\.touch&&m\.touch\.push\)rows=rows\.concat/g) || []).length === 1,
    '  ★★ 줄을 모으는 글이 <b>한 곳</b>뿐이다 — '
      + (src.match(/m\.touch&&m\.touch\.push\)rows=rows\.concat/g) || []).length + '곳');

  console.log('\n[3] ★★ <b>「이번 주」 가 한 뜻이다</b> (0-1번)');
  const w0 = await run([['2026-09-28', '통화']]);
  is(w0.W && w0.W.from === '2026-09-28',
    '  카드가 센 주의 첫날이 <b>월요일 9-28</b> — ' + (w0.W ? w0.W.from : 'null'));
  is(w0.W && w0.W.from === w0.wk,
    '  ★★ 아래 <b>주간 격자와 같은 주</b>다 — 격자 ' + w0.wk + ' · 카드 '
      + (w0.W ? w0.W.from : 'null') + (w0.W && w0.W.from === w0.wk ? '' : ' ← 갈렸습니다'));
  is(w0.W && w0.W.to === '2026-10-01' && w0.card.indexOf('월~오늘') >= 0,
    '  ★ <b>무엇을 센 것인지 적는다</b> — 「월~오늘」 (끝 ' + (w0.W ? w0.W.to : '?') + ')');
  is(!/function hmWkAct[\s\S]{0,700}getUTCDay\(\)/.test(src),
    '  ★★ 주의 첫날을 <b>여기서 또 세지 않는다</b> — mcalWkStart 를 부릅니다');

  console.log('\n[4] ★★ <b>정말 센다</b> — 그리고 주 밖은 안 센다');
  const wk = await run([['2026-10-01', '통화'], ['2026-09-30', '통화'], ['2026-09-28', '통화'],
                        ['2026-09-30', '만남'], ['2026-09-29', '방문'],
                        ['2026-09-25', '통화'], ['2026-09-24', '만남']]);
  is(wk.W && wk.W.call === 3,
    '  전화 <b>3건</b> — ' + (wk.W ? wk.W.call : 'null') + '건 (목·수·월 · 지난 주 금요일은 뺐습니다)');
  is(wk.W && wk.W.meet === 2,
    '  만남 <b>2건</b> — ' + (wk.W ? wk.W.meet : 'null') + '건 (수 만남 · 화 방문)');
  is(wk.W && wk.W.all === 5,
    '  ★ 이번 주 기록 <b>5건</b>만 들었다 — ' + (wk.W ? wk.W.all : 'null')
      + '건 (지난 주 2건은 안 셉니다)');
  is(wk.W && wk.T && wk.T.call === 1 && wk.W.call > wk.T.call,
    '  ★★ <b>오늘치와 다른 수</b>다 — 오늘 ' + (wk.T ? wk.T.call : '?') + ' · 이번 주 '
      + (wk.W ? wk.W.call : '?') + ' (같으면 하루치를 주간이라 적은 것입니다)');
  is(wk.call.length === 1 && wk.call[0] === '3' && wk.meet.length === 1 && wk.meet[0] === '2',
    '  ★ <b>화면에도 그 수가 선다</b> — 전화 ' + (wk.call[0] || '없음') + ' · 만남 ' + (wk.meet[0] || '없음'));

  console.log('\n[5] ★ <b>전화와 만남을 갈라 센다</b>');
  const one = await p.evaluate(() =>
    DAYRANK.actRange([{ at: '2026-09-30', how: '전화' }], '2026-09-28', '2026-10-01'));
  is(one.call === 1 && one.meet === 0 && one.all === 1,
    '  한 줄이 <b>둘로 세어지지 않는다</b> — ' + JSON.stringify(one));

  console.log('\n[6] ★★ <b>못 읽었으면 수를 안 적는다</b> (1번)');
  const nul = await p.evaluate(({ src }) => {
    const keep = CM.loaded; CM.loaded = false;
    const o = (0, eval)('(' + src + ')')();
    CM.loaded = keep;
    return o;
  }, { src: String(LOOK) });
  is(nul.W === null, '  hmWkAct 이 <b>null</b> 이다 — 0 이 아닙니다');
  is(nul.call.length === 0 && nul.meet.length === 0,
    '  ★★ <b>줄을 안 세운다</b> — 이름표 ' + (nul.call.length + nul.meet.length) + '개');
  is(nul.card.indexOf('전화') < 0 && nul.card.indexOf('만남') < 0,
    '  ★ 「전화 0」 이라고 <b>적지 않는다</b> — 「아무것도 안 하셨다」 로 읽힙니다');

  console.log('\n[7] ★★ <b>이 칸에 금액을 안 적고 어디서 보는지를 적는다</b> (5번)');
  /* ⚠ ★★ <b>이 두 줄은 뒤집혔습니다</b> (2026-10-02). 전에는 「못 셈 이라
     적는다 · DB·업적관리에 있다고 적는다」 를 보았습니다 — 그때는 본체가
     그 금액을 안 받아 오고 있었습니다. 사장님 말씀 「예상업적을 셀 수 있도록」
     으로 <b>이제 셉니다</b>(check-pex). 그 금액은 <b>📊 상담현황</b> 한 곳에
     적고, 이 칸은 <b>가는 곳</b>만 적습니다 — 같은 수를 두 곳에 적으면 한쪽만
     고쳐져 홈 안에서 두 금액이 갈립니다 (5번).
     ★ <b>자를 없앤 것이 아닙니다</b> — 아래 「금액이 한 자도 없다」 는 그대로
       보고, 「어디서 보는지 적는가」 로 묻는 것을 바꿨습니다.             */
  is(wk.card.indexOf('업적은') >= 0 && wk.card.indexOf('상담현황') >= 0,
    '  ★★ <b>어디서 보는지</b>를 적는다 — 「'
      + (wk.card.match(/업적은[^·]{0,16}/) || ['없다'])[0].trim() + '」');
  is(wk.card.indexOf('못 셈') < 0 && wk.card.indexOf('DB·업적관리') < 0,
    '  ★★ 「못 셈 · DB·업적관리」 라는 <b>옛말이 없다</b> — 이제 거짓입니다');
  /* 목각의 「120만」 을 베껴 적으면 그 자리에서 울립니다. 날짜(10-01)·
     건수(3건)·일수는 수가 아니라 <b>센 것</b>이라 거르고, <b>금액</b>만 봅니다. */
  /* ⚠ <b>이 줄은 처음에 헛것이었습니다.</b> 끝에 \b 를 붙여 두었는데 「만원」
     은 ASCII 로는 둘 다 낱말 문자가 아니라 <b>경계가 생기지 않습니다</b> —
     「120만원」 을 일부러 적어 보니 <b>안 울렸습니다.</b> \b 를 뗐습니다 (8번). */
  is(!/[0-9][0-9,]*\s*(만원|억|원|만)/.test(wk.card.replace(/만남/g, '')),
    '  ★★ 카드에 <b>금액이 한 자도 없다</b> — 「'
      + ((wk.card.replace(/만남/g, '').match(/[0-9][0-9,]*\s*(만원|원|만)/) || ['없습니다'])[0]) + '」');

  console.log('\n[8] ★★ <b>서버를 안 부른다</b> (7번)');
  is(hits === hits0, '  이 자가 재는 동안 바깥을 <b>' + (hits - hits0) + '번</b> 불렀다');
  is(!/function hmWkAct[\s\S]{0,600}osClient\(/.test(src),
    '  ★ hmWkAct 이 <b>서버를 안 부른다</b> — 읽어 둔 것으로만 셈합니다');

  console.log('\n[9] 길이 — <b>제 줄을 안 세운다</b>');
  /* ★★ 전화·만남을 <b>제 줄로</b> 세우면 카드가 155 → 193px 가 되어 홈이
     4.2화면을 넘었습니다. 그래서 「연속 가동」 줄 <b>뒤에 붙이고</b> 「오늘
     것도 들었습니다」 를 꼬리글로 내려 <b>162px</b> 로 두었습니다.
     되돌려 제 줄로 세우면 이 자리가 울립니다 (8번).                     */
  is(wk.cardH <= 175, '  「이번 주」 카드가 <b>' + wk.cardH + 'px</b> — 175px 이하');
  is(wk.rowN === 1,
    '  ★★ 수를 적는 줄이 <b>하나</b>다 — ' + wk.rowN + '줄 (둘이면 홈이 20px 길어집니다)');
  is(wk.callY === wk.runY,
    '  ★ 전화·만남이 <b>연속 가동과 같은 줄</b>에 있다 — y ' + wk.runY + ' / ' + wk.callY);
  is(wk.oneLine,
    '  ★ 그 줄이 <b>한 줄</b>이다 — ' + wk.rowH + 'px (두 줄이면 20px 더 깁니다)');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 「이번 주」 칸에 구멍이 있습니다')
                  : '✓ 한 자가 세고 · 주가 한 뜻이고 · 주 밖은 안 세고 · 모르면 0 이라 하지 않고 · 금액은 한 곳에만 적습니다');
  console.log('  ⚠ 「예상업적 120만」 은 못 셉니다 — DB·업적관리에 있어 본체가 못 읽습니다. 못 센다고 적었는지까지만 봅니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
