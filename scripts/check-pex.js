/* ══════════════════════════════════════════════════════════════════
   check-pex.js — <b>업적을 세는 자리.</b>

   사장님 말씀 (2026-10-02) — <b>「예상업적을 셀 수 있도록 스스로 매일 볼 수
   있도록 해. 지난달 업적과 이번달 예상업적 - 현재업적」</b>.

   여태 홈은 <b>「예상업적은 DB·업적관리에 있습니다 — 본체가 못 읽어 건수까지만
   셉니다」</b> 라고 적고 있었습니다. 세 판에 걸쳐 「못 셉니다」 라고 적어 둔
   자리입니다. 알고 보니 <b>못 읽는 것이 아니라 안 받아 오고 있었습니다</b> —
   expect_premium 은 홈이 이미 읽는 <b>같은 표(dbs)</b>의 칸입니다.

   ── <b>세는 자를 파일로 옮겼습니다</b> (5번) ──────────────────────
   규칙은 「DB · 업적관리」(edu-pipeline.html) 한 곳에만 있었습니다. 본체가
   세려면 <b>베껴 가야</b> 했고, 그러면 한쪽만 고쳐져 홈과 업적관리가
   <b>다른 금액</b>을 말합니다. 고객 앞에서 금액이 갈리면 그 자리에서
   깨집니다. 그래서 <b>apex-pex.js</b> 를 내고 둘이 같이 부릅니다.
   ⚠ 덱 안에는 손으로 적은 더하기가 <b>아직 여러 곳</b> 남아 있습니다 —
   머리 두 수부터 옮기고, 나머지는 <b>눈금</b>으로 둡니다(늘면 빨간불).
   이 화면을 돌려 볼 길이 없어 한 번에 다 고치지 않았습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>세는 자가 하나다</b> — 본체와 덱이 둘 다 apex-pex.js 를
         부르고, 덱의 손 더하기가 <b>늘지 않았다</b>
     [2] ★★ <b>세 수가 맞다</b> — 이번 달 · 지난달 · 진행중 예상
     [3] ★★ <b>보류·무산을 뺀다</b> · <b>체결일이 빈 것</b>은 어느 달인지
         몰라 빼고 <b>몇 건인지 적는다</b> (1번)
     [4] ★★ <b>금액이 안 적힌 건을 0 으로 적지 않는다</b> (1번) — 합이
         작게 나오는데 그것을 「적다」 로 읽으면 거짓입니다
     [5] ★★ <b>칸을 못 읽은 서버</b>에서는 금액을 한 자도 안 적는다 (1번)
     [6] ★★ <b>단위가 원이다</b> (4번) — 만 배 오류가 없다. 10000 을
         곱하거나 나누는 자리가 <b>한 곳도 없다</b>
     [7] ★★ <b>서버를 더 안 부른다</b> (7번) — 같은 물음에 <b>칸만</b>
         얹었다. dbs 를 부르는 자리가 늘지 않았다
     [8] ★★ <b>담당자 거르개가 한 곳</b>이다 (3번·5번) — 팀원을 골라
         놓으면 <b>그 분 것만</b> 섭니다. 남의 금액을 제 것으로 보면 안 됩니다
     [9] ★ <b>계약업적이 안 적힌 체결 건</b>은 예상업적으로 세고, 그렇게
         센 건수를 <b>밝힌다</b> — 「적힌 값」 과 「대신 쓴 값」 은 다릅니다
    [10] ★★ 본체와 덱이 <b>같은 줄에 같은 답</b>을 낸다
    [11] 길이 — 홈이 <b>안 불어났다</b>

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>적어 두신 예상업적이 맞는 금액인가</b> 는 안 잽니다 — 그것은 사장님이
   보고 적으시는 값입니다. 자는 <b>적힌 것을 그대로 더해 그대로 적는가</b>
   까지만 봅니다. 그래서 <b>안 적힌 건</b>이 몇인지 밝히는 것이 중요합니다.
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8975;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
/* ⚠ <b>덱에 남은 손 더하기</b> — 2026-10-02 에 17곳. <b>늘면 빨간불</b>이고,
   줄이면 이 수도 같이 내립니다 (0-1번). 머리 두 수는 이미 옮겼습니다.   */
const BASE = { 덱손더하기: 17 };
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
const PIN = () => {
  const R = Date, base = new R('2026-10-02T09:00:00Z').getTime();
  function F() { return arguments.length ? new R(...arguments) : new R(base); }
  F.now = () => base; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '홍길동', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
  window.actLoad = function () {}; window.arMyId = function () { return 'me'; };
  OSC.loaded = true; OSC.list = []; CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.calls = []; AR.noPex = false;
  ACT.day = { '2026-10-02': { call: 1, cli: 0, rep: 0, chk: 0 } }; ACT.from = '2026-08-03';
  go('home');
};
/* 줄을 손으로 심습니다 — <b>서버는 안 부릅니다</b>.
   d — [who, stage, closed, expect, contract, cAt]                       */
const PUT = (rows) => {
  AR.db = (rows || []).map(function (r, i) {
    return { id: 'd' + i, who: r[0], name: '홍길동' + i, region: '순천', src: '일반',
             stage: r[1], closed: r[2], expect: r[3], contract: r[4], cAt: r[5],
             pAt: '', got: '2026-09-01', n: 1, last: '', res: '상담', appt: '', memo: '', days: 3 };
  });
};
const LOOK = () => {
  try { go('home'); } catch (e) {}
  const flow = document.getElementById('hmFlow');
  const sub = flow ? flow.querySelector('.t-sub') : null;
  const pane = document.getElementById('dynPane');
  const A = (n) => [].slice.call(pane.querySelectorAll('[data-ask="' + n + '"]'))
    .map(e => (e.textContent || '').trim());
  return { o: (typeof pexSum === 'function') ? pexSum() : undefined,
           t: sub ? (sub.innerText || '').replace(/\s+/g, ' ').trim() : '',
           subH: sub ? Math.round(sub.getBoundingClientRect().height) : 0,
           flowH: flow ? Math.round(flow.getBoundingClientRect().height) : 0,
           ask: { now: A('이번달업적'), last: A('지난달업적'), live: A('진행중예상업적') },
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
  await p.waitForFunction(() => typeof pexSum === 'function' && typeof APEX_PEX !== 'undefined'
                             && typeof renderHome === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(1500);
  const hits0 = hits;
  const run = (rows) => p.evaluate(({ rows, put, src }) => {
    (0, eval)('(' + put + ')')(rows);
    return (0, eval)('(' + src + ')')();
  }, { rows, put: String(PUT), src: String(LOOK) });
  const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const DECK = fs.readFileSync(path.join(ROOT, 'edu-pipeline.html'), 'utf8');
  const PEXJS = fs.existsSync(path.join(ROOT, 'apex-pex.js'))
    ? fs.readFileSync(path.join(ROOT, 'apex-pex.js'), 'utf8') : '';

  console.log('\n[1] ★★ <b>세는 자가 하나다</b> (5번)');
  is(PEXJS.length > 0 && /PEX\.isDone/.test(PEXJS) && /PEX\.sum/.test(PEXJS),
    '  <b>apex-pex.js</b> 가 있고 판정·셈을 들고 있다');
  is(/src="\.\.\/apex-pex\.js"/.test(IDX), '  본체가 그것을 <b>부른다</b>');
  is(/src="apex-pex\.js"/.test(DECK), '  ★★ 「DB · 업적관리」 도 <b>같은 파일</b>을 부른다');
  is(/const isDone = r => APEX_PEX\.isDone\(r\);/.test(DECK)
     && /const isLive = r => APEX_PEX\.isLive\(r\);/.test(DECK),
    '  ★★ <b>판정이 덱에 안 남아 있다</b> — 부르기만 합니다');
  is(/APEX_PEX\.doneWon\(done\)/.test(DECK) && /APEX_PEX\.liveWon\(live\)/.test(DECK),
    '  ★ 덱의 <b>머리 두 수</b>도 그 자를 부른다');
  is(!/function (pexSum|pexRows)[\s\S]{0,900}(계약완료|증권전달)/.test(IDX),
    '  ★★ 본체가 <b>판정을 베껴 적지 않았다</b> — 단계 이름이 그 자리에 없습니다');
  const 손 = (DECK.match(/\+r\.contract \|\| \+r\.expect \|\| 0/g) || []).length
           + (DECK.match(/=> *[ab] \+ \(\+r\.expect \|\| 0\)/g) || []).length;
  is(손 <= BASE.덱손더하기,
    '  덱에 손으로 적은 더하기 <b>' + 손 + '곳</b> / 기준선 ' + BASE.덱손더하기
      + (손 > BASE.덱손더하기 ? ' ← 늘었습니다' : ''));
  if (손 < BASE.덱손더하기) console.log('    ↓ ' + 손 + '곳으로 줄었습니다 — 기준선도 내려 주십시오 (8번)');

  console.log('\n[2] ★★ <b>세 수가 맞다</b>');
  /* 이번 달 체결 2건(150만+80만) · 지난달 2건(250만+40만) · 진행중 3건(90만+170만+50만) */
  const W = await run([
    ['me', '계약완료', '', 1200000, 1500000, '2026-10-05'],
    ['me', '증권전달', '', 800000, 0, '2026-10-12'],
    ['me', '계약완료', '', 2000000, 2500000, '2026-09-08'],
    ['me', '증권전달', '', 300000, 400000, '2026-09-22'],
    ['me', 'AP', '', 900000, 0, ''],
    ['me', 'PC', '', 1700000, 0, ''],
    ['me', 'TA', '', 500000, 0, '']
  ]);
  is(W.o && W.o.now.won === 2300000 && W.o.now.n === 2,
    '  <b>이번 달 230만원 · 2건</b> — ' + (W.o ? W.o.now.won : 'null') + '원');
  is(W.o && W.o.last.won === 2900000 && W.o.last.n === 2,
    '  <b>지난달 290만원 · 2건</b> — ' + (W.o ? W.o.last.won : 'null') + '원');
  is(W.o && W.o.live.won === 3100000 && W.o.live.n === 3,
    '  <b>진행중 예상 310만원 · 3건</b> — ' + (W.o ? W.o.live.won : 'null') + '원');
  is(/이번 달 230만원/.test(W.t) && /지난달 290만원/.test(W.t) && /진행중 예상 310만원/.test(W.t),
    '  ★★ <b>화면에도 그 셋이 선다</b> — 「' + (W.t.match(/이번 달[^※]{0,52}/) || ['없다'])[0].trim() + '」');
  is(W.ask.now.length === 1 && W.ask.last.length === 1 && W.ask.live.length === 1,
    '  이름표를 <b>셋</b> 달고 있다 — ' + [W.ask.now[0], W.ask.last[0], W.ask.live[0]].join(' / '));

  console.log('\n[3] ★★ <b>보류·무산을 뺀다</b> · <b>체결일 빈 것</b>은 안 센다');
  const X = await run([
    ['me', '계약완료', '', 1200000, 1500000, '2026-10-05'],
    ['me', '계약완료', '무산', 9900000, 9900000, '2026-10-01'],
    ['me', '계약완료', '보류', 8800000, 8800000, '2026-10-02'],
    ['me', '계약완료', '', 700000, 700000, '']
  ]);
  is(X.o && X.o.now.won === 1500000,
    '  ★★ 무산·보류 <b>1,870만원</b>이 안 섞였다 — 이번 달 ' + (X.o ? X.o.now.won : 'null') + '원');
  is(X.o && X.o.off === 2 && /보류·무산 2건/.test(X.t),
    '  ★ 뺀 것이 <b>몇 건인지 적는다</b> — ' + (X.t.match(/보류·무산 \d+건/) || ['(없음)'])[0]);
  is(X.o && X.o.noDate === 1 && /체결일 빈 1건/.test(X.t),
    '  ★★ 체결일이 빈 건은 <b>이번 달로 밀어 넣지 않고</b> 몇 건인지 적는다 (1번) — '
      + (X.t.match(/체결일 빈 \d+건/) || ['(없음)'])[0]);

  console.log('\n[4] ★★ <b>금액이 안 적힌 건을 0 으로 적지 않는다</b> (1번)');
  const Y = await run([
    ['me', '계약완료', '', 1200000, 1500000, '2026-10-05'],
    ['me', 'AP', '', null, null, ''],
    ['me', 'PC', '', undefined, 0, ''],
    ['me', 'TA', '', 0, 0, '']
  ]);
  is(Y.o && Y.o.live.n === 3 && Y.o.live.won === 0 && Y.o.live.noAmt === 3,
    '  살아 있는 <b>3건</b>인데 <b>금액은 셋 다 안 적혀</b> 있다 — 합 '
      + (Y.o ? Y.o.live.won : 'null') + '원 · 안 적힌 것 ' + (Y.o ? Y.o.live.noAmt : 'null') + '건');
  is(Y.o && /금액 안 적힌 3건/.test(Y.t),
    '  ★★ <b>몇 건이 안 적혀 있는지 적는다</b> — ' + (Y.t.match(/금액 안 적힌 \d+건/) || ['(없음)'])[0]
      + ' (안 적으면 합이 작게 나오는 것을 「적다」 로 읽으십니다)');

  console.log('\n[5] ★★ 칸을 <b>못 읽은 서버</b>에서는 금액을 한 자도 안 적는다 (1번)');
  const Z = await p.evaluate(({ src }) => {
    AR.noPex = true; const o = (0, eval)('(' + src + ')')(); AR.noPex = false; return o;
  }, { src: String(LOOK) });
  is(Z.o === null, '  pexSum 이 <b>null</b> 이다 — 0 이 아닙니다');
  is(Z.ask.now.length === 0 && Z.ask.last.length === 0 && Z.ask.live.length === 0,
    '  이름표가 <b>0개</b>다 — ' + (Z.ask.now.length + Z.ask.last.length + Z.ask.live.length) + '개');
  /* 낫표 안은 약속이지 수가 아닙니다 (check-hmflow 의 그 자리와 같은 규약) */
  is(!/[\d,]+\s*(원|만원|억)/.test(Z.t.replace(/「[^」]*」/g, ' ')) && /못 읽었/.test(Z.t),
    '  ★★ 금액이 <b>한 자도 없다</b> — 「' + (Z.t.match(/업적은[^.]{0,26}/) || ['없다'])[0] + '」');

  console.log('\n[6] ★★ <b>단위가 원이다</b> (4번) — 만 배 오류가 없다');
  is(!/10000/.test(PEXJS), '  ★★ 세는 자에 <b>10000 이 한 번도 안 나온다</b> — 곱하거나 나누는 자리가 없습니다');
  const fnP = (() => { const i = IDX.indexOf('function pexRows('); if (i < 0) return '';
    const r = IDX.slice(i), e = r.indexOf('\nfunction pexNoteHtml'); return e > 0 ? r.slice(0, e) : r.slice(0, 2600); })();
  is(fnP.length > 0 && !/10000|\* *1e4|\/ *1e4/.test(fnP),
    '  ★ 본체의 업적 자리에도 <b>만 배 자리가 없다</b>');
  is(/function pexTxt\([\s\S]{0,120}frWonR/.test(IDX),
    '  ★ 적는 자는 <b>frWonR 하나</b>다 — 그것도 원을 받습니다 (4번)');
  const 억 = await run([['me', '계약완료', '', 0, 350000000, '2026-10-05']]);
  is(억.o && 억.o.now.won === 350000000 && /3억 5,000만원/.test(억.t),
    '  ★★ <b>3억 5,000만원</b>이 그대로 적힌다 — 「'
      + (억.t.match(/이번 달 [^(]{0,16}/) || ['없다'])[0].trim() + '」 (만 배가 틀리면 여기서 드러납니다)');

  console.log('\n[7] ★★ <b>서버를 더 안 부른다</b> (7번)');
  is(hits === hits0, '  이 자가 재는 동안 바깥을 <b>' + (hits - hits0) + '번</b> 불렀다');
  is(/expect_premium,contract_premium,closed_reason/.test(IDX),
    '  업적 칸 셋을 <b>한 줄로</b> 얹었다');
  /* ⚠ <b>한 줄만 읽는 자리</b>(id 로 한 분 꺼내는 곳)는 쪽 읽기가 아닙니다.
     처음에 그것까지 세어 「두 곳」 이라 울렸습니다 — 제 셈이 틀렸습니다 (8번).
     <b>쪽으로 나눠 읽는 자리</b>만 셉니다.                               */
  is((IDX.match(/sb\.from\('dbs'\)\.select\(c\)\.order\('id',\{ascending:true\}\)\.range\(/g) || []).length === 1,
    '  ★★ dbs 를 <b>쪽으로</b> 읽는 자리가 한 곳이다 — 부르는 횟수가 안 늘었습니다');
  is(/AR\.noPex=true/.test(IDX) && /if\(AR\.noPex\)return null;/.test(IDX),
    '  ★ 칸이 없는 서버는 <b>한 단만 내려가고</b>, 못 읽었다고 적어 둔다');

  console.log('\n[8] ★★ <b>담당자 거르개가 한 곳</b>이다 (3번·5번)');
  const T = await run([
    ['me', '계약완료', '', 0, 1000000, '2026-10-05'],
    ['u2', '계약완료', '', 0, 9000000, '2026-10-06']
  ]);
  is(T.o && T.o.now.won === 1000000,
    '  <b>내 것만</b> 센다 — ' + (T.o ? T.o.now.won : 'null') + '원 (남의 900만원이 안 섞였습니다)');
  is(/function pexRows\(\)\{[\s\S]{0,400}hwhoPick\(\)/.test(IDX),
    '  ★★ 「누구 것인가」 를 <b>hwhoPick 한 곳</b>에 묻는다 — 팀원을 고르면 그 분 것만 섭니다');

  console.log('\n[9] ★ <b>계약업적이 안 적힌 체결 건</b>을 밝힌다');
  const G = await run([['me', '증권전달', '', 800000, 0, '2026-10-05']]);
  is(G.o && G.o.now.won === 800000 && G.o.guess === 1,
    '  예상업적으로 <b>대신 셌다</b> — ' + (G.o ? G.o.now.won : 'null') + '원 · 대신 센 것 '
      + (G.o ? G.o.guess : 'null') + '건');
  is(/계약업적 안 적힌 1건/.test(G.t),
    '  ★ 그것을 <b>화면에 밝힌다</b> — ' + (G.t.match(/계약업적 안 적힌 \d+건[^.]*/) || ['(없음)'])[0]);

  console.log('\n[10] ★★ 본체와 덱이 <b>같은 줄에 같은 답</b>을 낸다');
  const S = await p.evaluate(() => {
    const L = [{ stage: '계약완료', closed: '', expect: 1200000, contract: 1500000, cdate: '2026-10-05' },
               { stage: 'AP', closed: '', expect: 900000, contract: 0, cdate: '' },
               { stage: '계약완료', closed: '무산', expect: 9900000, contract: 9900000, cdate: '2026-10-05' }];
    const o = APEX_PEX.sum(L, '2026-10');
    return { live: APEX_PEX.liveWon(L), done: APEX_PEX.doneWon(L), sumLive: o.live.won, sumNow: o.now.won };
  });
  is(S.live === S.sumLive && S.live === 900000,
    '  덱이 쓰는 <b>liveWon</b> 과 sum 의 진행중이 같다 — ' + S.live + ' / ' + S.sumLive);
  is(S.done === S.sumNow && S.done === 1500000,
    '  덱이 쓰는 <b>doneWon</b> 과 sum 의 이번 달이 같다 — ' + S.done + ' / ' + S.sumNow);

  console.log('\n[11] 길이 — <b>홈이 안 불어났다</b>');
  is(W.flowH <= 400,
    '  📊 상담현황 카드가 <b>' + W.flowH + 'px</b> — 400px 이하 (옛 판이 388px 였습니다)');
  is(W.subH <= 120, '  꼬리 줄이 <b>' + W.subH + 'px</b> — 120px 이하');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  /* ══ [11] <b>거짓이 된 말이 화면에 남아 있지 않다</b> (1번) ══════════
     2026-10-04 · 2026-10-02 에 「예상업적은 본체가 못 읽는다」 가 거짓인 것이
     밝혀지고 2026-10-03 에 세게 만들었는데, <b>성공 갈래만 고치고 실패 갈래
     둘을 놓쳤습니다.</b> 그래서 장부를 못 읽은 날 아침마다 홈 「이번 주」 칸이
     「예상업적은 <b>못 셉니다</b>(DB·업적관리)」 라고 적고 있었습니다 —
     사장님은 그 거짓말을 보고 계셨습니다.
     ★ <b>고치면 그 말을 하는 자리 전부를 고칩니다.</b> 한 자리만 고치면
       나머지가 옛말을 계속합니다 (1번·5번).
     ★ <b>낫표 안은 인용</b>입니다 — 「왜 틀렸는지」 를 남겨 두어야 다음
       세션이 되살리지 않습니다. 주장만 셉니다 (check-almpex 와 같은 규약).  */
  console.log('\n[11] ★★ <b>거짓이 된 말이 화면에 남아 있지 않다</b> (1번)');
  const 민주장10 = String(IDX).replace(/「[^」]*」/g, ' ');
  const 거짓 = (민주장10.match(/예상업적[^\n]{0,24}못 (셉니|센|읽)/g) || []);
  is(거짓.length === 0,
    '  「예상업적을 못 센다」 고 <b>주장하는 자리가 없다</b>'
    + (거짓.length ? ('\n      ✗ ' + 거짓.join('\n      ✗ ')) : ''));
  /* 못 읽은 갈래·끊긴 갈래 <b>둘 다</b> 어디서 보는지 적나 */
  const 이번주 = (() => { const i = IDX.indexOf('function hmRunSideHtml'); if (i < 0) return '';
    const r = IDX.slice(i); const e = r.indexOf('\nfunction hmWkAct'); return e > 0 ? r.slice(0, e) : r.slice(0, 2600); })();
  const 갈래 = (이번주.match(/hm-rt-none/g) || []).length;
  const 가리킴 = (이번주.match(/📊 상담현황/g) || []).length;
  is(갈래 > 0 && 가리킴 >= 2,
    '  「이번 주」 칸의 <b>실패 갈래도</b> 금액을 어디서 보는지 적는다 — 갈래 ' + 갈래 + '곳 · 가리킨 곳 ' + 가리킴 + '곳');

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 업적을 세는 자리에 구멍이 있습니다')
                  : '✓ 세는 자가 하나고 · 세 수가 맞고 · 무산을 빼고 · 모르는 것을 0 이라 하지 않고 · 단위가 원입니다');
  console.log('  ⚠ <b>적어 두신 예상업적이 맞는 금액인가</b> 는 안 잽니다 — 적힌 것을 그대로 더해 그대로 적는가까지만 봅니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
