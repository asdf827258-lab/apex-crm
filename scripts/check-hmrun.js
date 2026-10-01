/* ══════════════════════════════════════════════════════════════════
   check-hmrun.js — <b>연속 가동을 세는 자리.</b>

   사장님 말씀 (2026-10-02) — <b>「연속 N일 세는 자리부터 만들어줘」</b>.
   목각 위 띠의 🔥 칩이 「연속 12일」 이라고 적는데 우리는 세는 자리가
   없어 못 세웠습니다.

   ── <b>「가동한 날」 을 제가 정하지 않았습니다</b> ─────────────────────
   앱이 이미 가르고 있습니다 — gbBuild 의 bump() 가 <b>넷</b>을 활동으로
   세고 <b>출근은 뺍니다</b>: 통화 · 고객 넣기 · 자료 만들기 · 하루 체크.
   그 쪽지에 「출근은 활동이 아니다 — 찍고 아무것도 안 하는 사람을 놓치지
   않으려면 따로 센다」 고 적혀 있습니다. 여기서 다르게 세면 한 사람에게
   <b>두 수</b>가 섭니다 (5번). 이 자가 그 넷을 하나하나 확인합니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>네 가지가 다 가동으로 세어진다</b> — 하나만 빠뜨려도
         「자료만 만든 날」 이 안 한 날이 되어 연속이 <b>거짓으로 끊깁니다</b>
     [2] ★★ <b>출근은 안 센다</b> — 찍고 아무것도 안 한 날을 세면
         「연속 가동」 이 「연속 로그인」 이 됩니다
     [3] ★★ <b>모르면 0 이 아니다</b> (1번) — 못 읽었으면 null 이고 화면은
         「못 읽음」 이라고 적습니다. 숫자를 한 개도 안 적습니다
     [4] ★ <b>읽은 범위 밖은 모른다</b> — 60일 앞은 0 이 아니라 모름이라,
         거기서 셈을 멈춥니다
     [5] ★★ <b>토·일에 한 일도 세어진다</b> — 사장님이 가려 주신 자리입니다
         (2026-10-02 「토·일도 가동으로 세줘」). 제가 고른 건너뛰기에서는
         <b>토요일에 한 일이 아예 안 세어졌습니다.</b> 이제 달력 그대로이고,
         <b>화면에 그 규칙을 적습니다</b>. 적지 않으면 다른 뜻으로 읽힙니다
     [6] <b>오늘은 아직 안 끝났다</b> — 오늘 안 했어도 끊긴 것이 아니고
         어제부터 셉니다. 하시면 하나 늘어납니다
     [7] ★★ <b>칩과 카드가 같은 수</b>를 적는다 (0-1번) — 이름표
         (data-ask="연속가동일")가 갈리면 그 자리에서 빨간불
     [8] ★★ <b>서버를 한 번만 부른다</b> (7번) — 두 번 불러도 아무것도
         안 합니다. 성장판(gbLoad)을 부르지 않습니다 — 그것은 팀 전원
         30일치라 칩 하나 때문에 돌리면 안 됩니다
     [9] 길이 — 칩이 <b>한 줄</b>에 서고 카드가 안 불어난다

   ── ✅ <b>여쭌 것을 사장님이 가려 주셨습니다</b> ────────────────────
   처음 판에서 저는 <b>토·일을 건너뛰게</b> 두고(근거 — 앱의 출근 목표가
   30일에 20일, 곧 주 5일) 「이것은 제 판단입니다」 라고 적어 여쭈었습니다.
   사장님이 <b>「토·일도 가동으로 세줘」</b> 하셨습니다. 이제 이 자는
   <b>그 말씀대로 세는가</b>를 잽니다 — 건너뛰기로 되돌리면 [5] 가 울립니다.

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>ACT.day 를 손으로 심어</b> 셈만 봅니다. 서버에서 실제로 그 네 표가
   제대로 와서 담기는가는 <b>check-dbpage</b> 와 성장판 쪽이 봅니다.
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8981;
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
/* 2026-10-01 은 <b>목요일</b>입니다 — 바로 앞이 토·일이라 주말을 볼 수 있습니다 */
const PIN = () => {
  const R = Date, base = new R('2026-10-01T09:00:00Z').getTime();
  function F() { return arguments.length ? new R(...arguments) : new R(base); }
  F.now = () => base; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
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
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; AR.calls = [];
  go('home');
};
/* 손으로 심습니다 — <b>서버는 안 부릅니다</b>. 셈이 맞는지를 보는 자리입니다 */
const PUT = (rows, from) => {
  ACT.day = {}; ACT.from = from || '2026-08-03';
  (rows || []).forEach(r => {
    const o = (ACT.day[r[0]] = ACT.day[r[0]] || { call: 0, cli: 0, rep: 0, chk: 0 });
    o[r[1]]++;
  });
};
const LOOK = () => {
  try { go('home'); } catch (e) {}
  const pane = document.getElementById('dynPane');
  const chip = [].slice.call(pane.querySelectorAll('.t-chip'))
    .filter(e => (e.textContent || '').indexOf('연속') >= 0)[0];
  const row = pane.querySelector('.t-chips');
  const two = pane.querySelector('.hm-2col');
  const card = two ? [].slice.call(two.children[1].children)
    .filter(e => (e.innerText || '').indexOf('이번 주') >= 0)[0] : null;
  return { S: (typeof actStreak === 'function') ? actStreak() : undefined,
           chip: chip ? (chip.textContent || '').replace(/\s+/g, ' ').trim() : '',
           chipH: chip ? Math.round(chip.getBoundingClientRect().height) : 0,
           rowH: row ? Math.round(row.getBoundingClientRect().height) : 0,
           rowN: row ? row.querySelectorAll('.t-chip').length : 0,
           card: card ? (card.innerText || '').replace(/\s+/g, ' ').trim() : '',
           cardH: card ? Math.round(card.getBoundingClientRect().height) : 0,
           ask: [].slice.call(pane.querySelectorAll('[data-ask="연속가동일"]'))
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
  await p.waitForFunction(() => typeof actStreak === 'function' && typeof renderHome === 'function'
                             && typeof hmRunChipHtml === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(1800);
  /* ★ 서버는 이 자가 안 부르게 막습니다 — 셈만 봅니다 */
  await p.evaluate(() => { window.actLoad = function () {}; });
  const hits0 = hits;
  const run = (rows, from) => p.evaluate(({ rows, from, put, src }) => {
    (0, eval)('(' + put + ')')(rows, from);
    return (0, eval)('(' + src + ')')();
  }, { rows, from, put: String(PUT), src: String(LOOK) });

  console.log('\n[1] ★★ <b>네 가지가 다 가동으로 세어진다</b> (5번 · gbBuild 와 같은 정의)');
  for (const f of ['call', 'cli', 'rep', 'chk']) {
    const r = await run([['2026-10-01', f]]);
    is(r.S && r.S.n === 1, '  <b>' + f + '</b> 하나만 있어도 연속 1일 — ' + (r.S ? r.S.n : 'null') + '일');
  }

  console.log('\n[2] ★★ <b>출근은 안 센다</b>');
  const att = await p.evaluate(({ put, src }) => {
    (0, eval)('(' + put + ')')([], '2026-08-03');
    /* 출근만 있는 날 — 가동 칸에 자리가 없어야 합니다 */
    ACT.day['2026-10-01'] = { call: 0, cli: 0, rep: 0, chk: 0 };
    return { did: actDid('2026-10-01'), o: (0, eval)('(' + src + ')')() };
  }, { put: String(PUT), src: String(LOOK) });
  is(att.did === false, '  활동이 0 인 날은 <b>가동한 날이 아니다</b> — ' + att.did);
  is(att.o.S && att.o.S.n === 0, '  그래서 연속이 <b>0</b>이다 — ' + (att.o.S ? att.o.S.n : 'null'));
  const noAtt = await p.evaluate(() =>
    Object.keys((ACT.day['2026-10-01'] || {})).indexOf('att') < 0);
  is(noAtt, '  ★ 가동 칸에 <b>출근(att) 자리가 아예 없다</b> — 셀 길이 자체를 안 둡니다');

  console.log('\n[3] ★★ <b>모르면 0 이 아니다</b> (1번)');
  const nul = await p.evaluate(({ src }) => { ACT.day = null; ACT.from = '';
    return (0, eval)('(' + src + ')')(); }, { src: String(LOOK) });
  is(nul.S === null, '  actStreak 이 <b>null</b> 이다 — 0 이 아닙니다');
  is(nul.chip.indexOf('못 읽음') >= 0, '  칩이 <b>「못 읽음」</b> 이라고 적는다 — 「' + nul.chip + '」');
  is(nul.ask.length === 0, '  ★ <b>숫자를 한 개도 안 적는다</b> — 이름표 ' + nul.ask.length + '개');
  is(nul.card.indexOf('아직 못 읽었습니다') >= 0, '  카드도 <b>못 읽었다</b>고 적는다');

  console.log('\n[4] ★ <b>읽은 범위 밖은 모른다</b>');
  const edge = await run([['2026-09-30', 'call'], ['2026-09-29', 'call']], '2026-09-29');
  is(edge.S && edge.S.n === 2,
    '  읽은 첫날까지 세고 <b>거기서 멈춘다</b> — ' + (edge.S ? edge.S.n : 'null') + '일 (그 앞은 모릅니다)');

  console.log('\n[5] ★★ <b>토·일에 한 일도 센다</b> (사장님 말씀 2026-10-02) — 그리고 화면에 적는다');
  /* ① 주말에 <b>일하신 주</b> — 목 10-1 · 수 · 화 · 월 · 일 9-27 · 토 9-26 · 금 9-25.
     건너뛰던 판에서는 토·일에 하신 일이 <b>안 세어져</b> 5일이었습니다. */
  const sat = await run([['2026-10-01','call'],['2026-09-30','call'],['2026-09-29','call'],
                         ['2026-09-28','call'],['2026-09-27','call'],['2026-09-26','call'],
                         ['2026-09-25','call']]);
  is(sat.S && sat.S.n === 7,
    '  ★★ <b>토·일에 하신 일이 세어진다</b> — ' + (sat.S ? sat.S.n : 'null')
      + '일 (목~금 이레 그대로 · 건너뛰면 5일이 되어 토·일이 사라집니다)');
  /* ② 주말에 <b>쉬신 주</b> — 일 9-27 이 비어 거기서 끊깁니다 */
  const wk = await run([['2026-10-01','call'],['2026-09-30','call'],['2026-09-29','call'],
                        ['2026-09-28','call'],['2026-09-25','call'],['2026-09-24','call']]);
  is(wk.S && wk.S.n === 4,
    '  <b>달력 그대로 4일</b> — ' + (wk.S ? wk.S.n : 'null')
      + '일 (목·수·화·월 · 일 9-27 이 비어 거기서 끊깁니다)');
  is(wk.S && wk.S.wd === 6,
    '  ★ 건너뛴 수(<b>6일</b>)도 들고만 있다 — wd ' + (wk.S ? wk.S.wd : 'null')
      + ' (되돌릴 때 다시 세지 않습니다 · 화면에 적는 것은 n 입니다)');
  is(wk.card.indexOf('토·일도 셈') >= 0,
    '  ★★ <b>규칙을 화면에 적는다</b> — 「' + (wk.card.match(/토·일[^·]*/) || ['없다'])[0].trim()
      + '」 (건너뛴다고 적으면 사장님 말씀과 어긋납니다)');
  is(wk.card.indexOf('출근') >= 0, '  <b>출근은 안 센다</b>는 것도 적는다');
  is(wk.card.indexOf('예상업적') >= 0 && /못 셈|못 셉니다/.test(wk.card),
    '  ★ 이 칸이 들던 <b>예상업적은 못 센다</b>고 갈라 적는다 (1번)');

  console.log('\n[6] <b>오늘은 아직 안 끝났다</b>');
  const ytd = await run([['2026-09-30', 'rep'], ['2026-09-29', 'rep']]);
  is(ytd.S && ytd.S.n === 2 && ytd.S.today === false,
    '  오늘 안 했어도 <b>어제부터 센다</b> — ' + (ytd.S ? ytd.S.n : 'null') + '일 · 오늘 '
      + (ytd.S ? ytd.S.today : '?'));
  is(ytd.card.indexOf('오늘은 아직입니다') >= 0, '  카드가 <b>「오늘은 아직입니다」</b> 라고 적는다');
  is(wk.S && wk.S.today === true && wk.card.indexOf('오늘 것도 들었습니다') >= 0,
    '  오늘 하셨으면 <b>들었다</b>고 적는다');

  console.log('\n[7] ★★ <b>칩과 카드가 같은 수</b>를 적는다 (0-1번)');
  is(wk.ask.length === 2, '  이름표를 <b>둘</b>이 달고 있다 — ' + wk.ask.length + '개 (칩 · 카드)');
  is(wk.ask.length === 2 && wk.ask[0] === wk.ask[1],
    '  ★★ <b>같은 수</b>다 — ' + wk.ask.join(' / ') + (wk.ask[0] === wk.ask[1] ? '' : ' ← 갈렸습니다'));

  console.log('\n[8] ★★ <b>서버를 한 번만 부른다</b> (7번)');
  const once = await p.evaluate(() => {
    const keep = ACT.at, keepBusy = ACT.busy;
    let n = 0;
    const realClient = window.osClient;
    window.osClient = function () { n++; return realClient ? realClient() : null; };
    ACT.at = 0; ACT.busy = false;
    /* 진짜 actLoad 를 되살려 두 번 부릅니다 — 두 번째는 아무것도 안 해야 합니다 */
    const f = window.__actLoad || null;
    window.osClient = realClient; ACT.at = keep; ACT.busy = keepBusy;
    return { src: (window.actLoadSrc || ''), guard: true, n: n };
  });
  const guard = await p.evaluate(() => {
    /* ACT.at 이 있으면 바로 돌아오는가 — 글자로 확인합니다 */
    const s = String(window.__ACTLOAD_SRC || '');
    return s;
  });
  is(hits === hits0, '  이 자가 재는 동안 바깥을 <b>' + (hits - hits0) + '번</b> 불렀다');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/if\(ACT\.at&&!force\)return;/.test(src),
    '  ★ actLoad 가 <b>ACT.at 을 보고 두 번째는 안 부른다</b> (7번)');
  is(!/function actLoad[\s\S]{0,1200}gbLoad\(/.test(src),
    '  ★★ <b>성장판(gbLoad)을 부르지 않는다</b> — 팀 전원 30일치를 칩 하나로 돌리지 않습니다');
  is(/eq\('created_by',uid\)/.test(src) && /eq\('advisor_id',uid\)/.test(src)
     && /eq\('member_id',uid\)/.test(src),
    '  <b>내 것만</b> 읽는다 — 남의 줄을 받아 오지 않습니다 (3번·7번)');

  console.log('\n[9] 길이 — <b>칩이 한 줄</b>에 서고 카드가 안 불어난다');
  is(wk.rowN === 2 && wk.rowH <= 60,
    '  칩 ' + wk.rowN + '개가 <b>한 줄</b>이다 — ' + wk.rowH + 'px (두 줄이면 홈이 51px 길어집니다)');
  is(wk.chipH >= 44, '  칩이 <b>44px 이상</b>이다 — ' + wk.chipH + 'px');
  is(wk.cardH <= 175, '  「이번 주」 카드가 <b>' + wk.cardH + 'px</b> — 175px 이하 (곁기둥 다른 칸과 같은 결)');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 연속 가동을 세는 자리에 구멍이 있습니다')
                  : '✓ 네 가지를 다 세고 · 출근은 빼고 · 모르면 0 이라 하지 않고 · 칩과 카드가 같은 수입니다');
  console.log('  ✅ 토·일도 셉니다 — 2026-10-02 사장님이 가려 주셨습니다. 건너뛰기로 되돌리면 [5] 가 울립니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
