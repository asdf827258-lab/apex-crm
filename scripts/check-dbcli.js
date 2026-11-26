/* 👥 <b>엑셀 한 벌로 고객 365일에도 한번에</b> — 판 X573

   사장님 말씀 (2026-11-26) — 「<b>고객 365일에다가도 한번에 못 넣나?</b>」

   ── 손대기 전에 재어 본 것 ─────────────────────────────────────────
   · 배정 DB → 내 고객 다리는 <b>이미 있었습니다</b> — 명단의 「내 고객으로」
     (olToMine). 그런데 <b>한 명씩</b>뿐이었습니다.
   · 고객 365일 화면에는 엑셀 길이 <b>있었습니다</b> — 「+ 새 고객」 → 첫 칸의
     「📇 엑셀·CSV → 고객 365일」. 그런데 단추가 <b>「새 고객」 한 명</b>이라고만
     적혀 있어, 열어 보지 않으면 알 수가 없었습니다. <b>화면이 말을 안 한 것</b>입니다.
   · 그래서 둘입니다 — ① 화면이 말하게 ② 엑셀 한 벌로 <b>양쪽에 한 번에</b>.

   ── 여기서 재는 것 ───────────────────────────────────────────────
     [1] ★★ <b>문이 선다</b> — 고객 365일 머리에 「📥 엑셀로 명단」 · 옛 단추도 그대로
     [2] ★★ <b>칸이 선다</b> — 배정 DB 로 넣을 때 「고객 365일에도 함께」 · 기본은 끔
     [3] ★★ <b>못 할 때 까닭을 말한다</b> (1번) — 다리 칸이 없는 서버 · 명단을 못 읽음.
            그리고 <b>한 줄도 안 넣는다</b> — 다리 없는 고객을 만들지 않습니다
     [4] ★★ <b>이미 내 고객인 분은 새로 안 만든다</b> (5-1번) — 그 분 번호로 다리만
     [5] ★★ <b>짝을 차례로 믿지 않는다</b> — 돌아온 번호가 <b>어느 줄</b>의 것인지
            k 로 맞춘다. 차례로 맞추면 남의 다리가 붙습니다 (판 X138)
     [6] ★★ <b>이름만 같은 분은 손대지 않는다</b> (1번) — 번호가 달라 모릅니다.
            그리고 <b>그렇다고 말한다</b>
     [7] ★★ <b>안 켜면 예전 그대로</b> (6번) — clients 를 한 번도 안 부른다
     [8] ★  <b>고치는 호출이 0번</b> (7번) — 다리를 넣기 전에 박아 둡니다
     [9] ★  <b>반대 방향은 없다</b> — 배정 DB 전용 칸(배정일·담당자·단계·종류)이
            고객 줄에 섞이지 않는다. 개인 고객을 배정 DB 에 섞으면 배정 한도
            (일반 20 · 변액 +30)를 넘겨 사고가 납니다

   ⚠ <b>안 재는 것과 까닭</b> (8번) —
     · 엑셀을 <b>읽는 기계</b>와 <b>배정 DB 로 넣는 길</b>은 안 봅니다 —
       check-cimp 계열과 check-dbimp 가 봅니다. 두 자가 같은 것을 세면 어긋납니다 (5번).
       여기서 보는 것은 <b>고객 365일 쪽으로 갈라지는 자리</b>뿐입니다.
     · 사장님 <b>진짜 서버는 한 번도 안 부릅니다</b> — 가짜 서버를 끼워 간 줄을 봅니다.

   ⚠ <b>이 자를 짜며 알게 된 것</b> — 가짜 서버가 보낸 번호를 <b>그대로 돌려줘야</b>
     합니다. 엉뚱한 번호를 돌려주면 cliMakeMany 가 「서버가 번호를 새로 매겼다」 는
     길로 빠져(판 X138 을 막는 그 길), 묶어 넣는 길을 <b>한 번도 안 재게</b> 됩니다. */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8977;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json;charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { const g = path.join(ROOT, 'app', p); if (fs.existsSync(g)) f = g; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

/* 견본 — 고객 이름은 <b>홍길동 식구</b>로만 씁니다 (CLAUDE.md 3번).
   ★ 차례를 일부러 섞었습니다 — 다리 ① · 새로 ② · 이름만 ③ · 새로 ④.
     [5] 에서 「차례로 짝지으면 틀린다」 를 보려면 <b>건너뛴 자리</b>가 있어야 합니다. */
const HEAD = ['고객명', '연락처', '생년월일', '주소', 'DB종류', '배정일', '담당자'];
const ROWS = [HEAD,
  ['성춘향', '010-5555-6666', '1985-03-04', '전남 순천시 조례동', '소개 DB', '2026-11-20', ''],  /* ① 이미 내 고객 */
  ['이몽룡', '010-7777-1234', '19900811',   '서울 강남구 역삼동', '소개',     '2026-11-20', ''],  /* ② 새로 */
  ['월매',   '010-3333-7777', '1960-02-02', '순천시 연향동',     '소개',     '2026-11-20', ''],  /* ③ 이름만 같음 */
  ['방자',   '010-8888-7777', '1991-07-07', '여수시 학동',       '소개',     '2026-11-20', ''],  /* ④ 새로 */
  ['홍길동', '010-1111-2222', '1977-01-02', '순천시 왕지동',     '소개',     '2026-11-20', '']]; /* ⑤ 배정 DB 에 이미 */

const SEED = function (opt) {
  window.__ins = []; window.__upd = [];
  /* ★ 보낸 번호를 <b>그대로</b> 돌려줍니다 — 안 그러면 cliMakeMany 가
     「서버가 번호를 새로 매겼다」 길로 빠져 묶어 넣기를 한 번도 안 잽니다. */
  window.osClient = function () {
    return { from: function (t) { return {
      insert: function (rs) { window.__ins.push({ t: t, rows: rs });
        return { select: function () { return Promise.resolve({
          data: rs.map(function (x, i) { return { id: x.id || ('srv' + i) }; }), error: null }); } }; },
      update: function (v) { window.__upd.push({ t: t, v: v });
        return { eq: function () { return Promise.resolve({ data: [], error: null }); } }; } }; } };
  };
  window.OS = window.OS || {}; window.OS.session = { user: { id: 'ME' } };
  window.arMyId = function () { return 'ME'; };
  window.arLoad = function () {};
  window.osLoadClients = function () {};
  window.AR = window.AR || {}; window.AR.loaded = true;
  window.AR.noLink = !!opt.noLink;                 /* 다리 칸이 없는 서버 */
  window.AR.db = [{ id: 'd1', customer_name: '홍길동', phone: '010-1111-2222', src: '소개' }];
  window.arScope = function () { return []; };
  window.hdbStages = function () { return ['미접촉', 'TA', 'AP', 'PC', 'CS']; };
  window.osRole = function () { return 'owner'; }; window.osIsOwner = function () { return true; };
  /* 👥 이미 내 고객인 분들 — c1 은 <b>번호가 같고</b>, c2 는 <b>이름만</b> 같습니다 */
  window.OSC = window.OSC || {};
  window.OSC.loaded = !opt.cliUnread;
  window.OSC.list = [{ id: 'c1', phone: '010-5555-6666', name_masked: '성○향' },
                     { id: 'c2', phone: '010-9999-0000', name_masked: '월○' }];
  try { if (typeof cmRealSet === 'function') { cmRealSet('c1', '성춘향'); cmRealSet('c2', '월매'); } } catch (e) {}
};

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const 돌리기 = async (opt) => {
    const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route('**://**', (r) => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e && e.message).slice(0, 90)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(3800);
    const R = await pg.evaluate(async (a) => {
      eval('(' + a.seed + ')(' + JSON.stringify(a.opt) + ')');
      const O = {};
      window.dbimpOpen();
      window.cimpTake(a.rows, '');
      O.cliDefault = window.DBIMP.cli;
      const mh = window.cimpMapHtml();
      O.hasCk = /고객 365일에도 함께/.test(mh);
      O.ckOff = /disabled[^>]*onchange="dbimpCliSet|onchange="dbimpCliSet[^>]*disabled/.test(mh);
      O.why = window.dbimpCliWhy();
      O.sayWhy = /지금은 못 합니다/.test(mh);
      if (a.opt.on) window.dbimpCliSet(true);
      const P = window.cimpPickList();
      O.pick = P.map(function (x) { return x.nm; });
      if (a.opt.on) { const sp = window.dbimpCliSplit(P);
        O.split = { mk: sp.mk.map(function (x) { return x.nm + '@' + x.k; }),
                    link: sp.link.map(function (x) { return x.at + '→' + x.cid; }),
                    name: sp.name.map(function (x) { return x.nm + '@' + x.at; }) }; }
      window.cimpGo();
      await new Promise(function (r) { setTimeout(r, 1500); });
      O.err = window.CIMP.err; O.res = window.CIMP.res || {};
      O.ins = window.__ins.map(function (x) { return { t: x.t, n: x.rows.length,
        keys: Object.keys(x.rows[0] || {}),
        cid: x.rows.map(function (r) { return r.client_id || ''; }),
        nm: x.rows.map(function (r) { return r.customer_name || r.name_masked || ''; }),
        ids: x.rows.map(function (r) { return r.id || ''; }) }; });
      O.upd = window.__upd.length;
      O.done = (window.cimpDoneHtml() || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      return O;
    }, { rows: ROWS, seed: SEED.toString(), opt: opt });
    R.errs = errs; await ctx.close(); return R;
  };

  const 글 = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };
  const APP = 글('app/index.html');

  head('[1] ★★ <b>문이 선다</b> — 고객 365일 화면이 제 입으로 말한다 (1번 · 6번)');
  /* ⚠ <b>제 자가 틀렸던 자리 ①</b> — 처음에 고객 365일 띠에 「📥 엑셀로 명단」
     단추를 <b>하나 더</b> 세우고 그것을 찾게 했습니다. 그런데 폰(390px)에서 띠가
     358px 인데 찾기 칸 최소 180 · 「+ 새 고객」 86 · 새 단추 113 + 틈 24 =
     <b>403px</b> 이라 둘째 줄이 생겨, 고객 365일 화면이 <b>56px</b> 길어졌습니다
     (check-phonefit 의 clients 눈금 3.2 → 3.3 으로 CI 가 울었습니다).
     ★ 그래서 <b>더하지 않고 이름만 고쳤습니다</b> — 그 자리 주석이 이미
       「고객을 넣는 길은 cregOpen <b>한 흐름</b>」 이라 적어 두었고 엑셀도 그
       안에 있습니다. 하나 더 세우면 길이 둘인 척하게 됩니다 (5번).
     ⚠ 그리고 이 자는 <b>높이를 안 잽니다</b> — check-phonefit 이 그 임자입니다.
       두 자가 같은 것을 세면 어긋납니다 (5번). 여기서는 <b>단추가 하나이고
       제 이름에 엑셀을 적나</b> 만 봅니다. */
  is(/onclick="cregOpen\(\)"[^>]*>➕ 고객 넣기 · 엑셀<\/button>/.test(APP),
     '  고객 365일 머리 단추가 <b>제 이름에 「엑셀」 을 적는다</b> — 열어 보지 않아도 알 수 있게 (1번)');
  is((APP.match(/class="osc-search"/g) || []).length === 1 &&
     !/📥 엑셀로 명단<\/button>/.test(APP),
     '  그 띠에 고객 넣는 단추가 <b>하나</b>다 — 길이 둘인 척하지 않고 폰에서 한 줄에 선다 (5번)');
  is(/onclick="cregGoXls\(\)"/.test(APP) && /onclick="dbimpOpen\(\)"/.test(APP),
     '  「➕ 고객 넣기」 의 엑셀 문 둘도 그대로 있다');
  is(/function dbimpCliSplit\(/.test(APP) && !/function dbimpCliMake\(/.test(APP),
     '  <b>넣는 자를 새로 짜지 않았다</b> — 가르기만 하고 cliMakeMany·dbimpMany 를 부릅니다 (5번)');
  /* ⚠ <b>제 자가 틀렸던 자리 ②</b> — 처음에 <code>OSC.list</code> 쓰는 자리를 세어
     「한 곳이어야 한다」 고 했습니다. 그런데 앱 전체에 <b>22곳</b>이고 저마다 다른
     일을 합니다 — 셈 자체가 헛것이었습니다. 보아야 할 것은 「번호·이름으로 찾는
     <b>그 명단</b>을 짓는 자가 하나인가」 입니다 (8번 · 헛것을 잡는 자가 더 나쁩니다). */
  is(/function cimpHaveCli\(/.test(APP) &&
     /function cimpHaveIx\(\)\{[\s\S]{0,500}return cimpHaveCli\(\);/.test(APP) &&
     /function dbimpCliSplit\(pick\)\{\s*var H=cimpHaveCli\(\)/.test(APP),
     '  고객 365일 명단을 <b>짓는 곳이 하나</b>다 — cimpHaveIx·dbimpCliSplit 이 같은 cimpHaveCli 를 부른다 (5번)');
  /* ⚠ <b>제 자가 틀렸던 자리 ③</b> — 여기서도 <code>cmRealOf(c.id)</code> 를 세어
     「한 곳」 이라 했는데 앱 전체에 <b>10곳</b>입니다(화면마다 실명을 꺼내 보입니다).
     세 번 내리 <b>셈으로</b> 재려 했고 세 번 다 헛것이었습니다 — 보아야 할 것은
     「dbimpCli* 가 <b>제 손으로</b> 명단을 다시 짓나」 뿐입니다 (8번). */
  is(!/function dbimpCli[A-Za-z]*\([^)]*\)\{[\s\S]{0,700}OSC\.list/.test(APP),
     '  dbimpCli* 가 <b>제 손으로 명단을 다시 짓지 않는다</b> — cimpHaveCli 를 부릅니다 (5번)');

  /* ── ① 안 켠 판 ───────────────────────────────────────────── */
  const A = await 돌리기({ on: false });
  head('[2] ★★ <b>칸이 선다 · 기본은 끔</b> (7번)');
  is(A.hasCk, '  배정 DB 로 넣을 때 <b>「고객 365일에도 함께」</b> 칸이 선다');
  is(A.cliDefault === false, '  <b>기본은 끔</b>이다 — 서버를 한 벌 더 부르는 일은 누르신 때만 (7번)');
  is(A.why === '', '  할 수 있는 판에서는 <b>까닭이 비어 있다</b> — ' + JSON.stringify(A.why).slice(0, 40));

  head('[7] ★★ <b>안 켜면 예전 그대로</b> (6번)');
  is(A.ins.length > 0 && A.ins.every((x) => x.t === 'dbs'),
     '  간 표가 <b>dbs 하나</b>다 — clients 를 한 번도 안 부른다 · ' + A.ins.map((x) => x.t + '×' + x.n).join(' '));
  is(A.ins.every((x) => x.cid.every((c) => !c)),
     '  다리(client_id)를 <b>안 박는다</b> — 안 켜셨으니 이을 고객이 없습니다');
  is(!A.res.cliNew && !A.res.cliLink && !A.res.cliName,
     '  결과에 고객 365일 칸이 <b>안 선다</b> — 0 을 적어 「했는데 0명」 처럼 보이지 않게 (8번)');

  /* ── ② 켠 판 ─────────────────────────────────────────────── */
  const B = await 돌리기({ on: true });
  head('[4] ★★ <b>이미 내 고객인 분은 새로 안 만든다</b> (5-1번)');
  is(B.pick.join(',') === '성춘향,이몽룡,월매,방자',
     '  배정 DB 에 이미 있는 홍길동은 빠지고 넷이 남는다 — ' + B.pick.join(','));
  is(!!B.split && B.split.link.join(',') === '0→c1',
     '  <b>번호가 같은 성춘향</b>은 이미 계신 분(c1)으로 이어만 붙인다 — ' + (B.split ? B.split.link.join(',') : '?'));
  const cliIns = B.ins.filter((x) => x.t === 'clients');
  const cliNm = [].concat.apply([], cliIns.map((x) => x.nm));
  is(cliNm.length === 2 && !cliNm.some((n) => /성/.test(n)),
     '  고객 줄을 <b>둘만</b> 만든다 — 성춘향은 안 만든다 · ' + JSON.stringify(cliNm));
  is(B.res.cliLink === 1 && B.res.cliNew === 2 && B.res.cliNoId === 0,
     '  센 것과 한 것이 <b>같다</b> — 새로 ' + B.res.cliNew + ' · 이어만 ' + B.res.cliLink + ' · 못 이음 ' + B.res.cliNoId);

  head('[5] ★★ <b>짝을 차례로 믿지 않는다</b> (판 X138 에서 데인 자리)');
  is(!!B.split && B.split.mk.join(',') === '이몽룡@1,방자@3',
     '  만들 분이 <b>1번·3번 줄</b>이다 — 가운데 2번(월매)을 건너뜁니다 · ' + (B.split ? B.split.mk.join(',') : '?'));
  const dbs = B.ins.filter((x) => x.t === 'dbs');
  const cid = [].concat.apply([], dbs.map((x) => x.cid));
  const nms = [].concat.apply([], dbs.map((x) => x.nm));
  const newIds = [].concat.apply([], cliIns.map((x) => x.ids));
  is(cid.length === 4 && cid[0] === 'c1' && !!cid[1] && !cid[2] && !!cid[3],
     '  다리가 <b>0·1·3 번 줄에만</b> 박힌다 (2번 줄은 이름만 같은 분) · ' +
       nms.map((n, i) => n + (cid[i] ? '✓' : '—')).join(' '));
  is(newIds.indexOf(cid[1]) >= 0 && newIds.indexOf(cid[3]) >= 0 && cid[1] !== cid[3],
     '  박힌 번호가 <b>방금 만든 그 고객</b>의 것이다 — 차례로 맞추면 한 칸 밀립니다');

  head('[6] ★★ <b>이름만 같은 분은 손대지 않는다</b> (1번)');
  is(!!B.split && B.split.name.join(',') === '월매@2',
     '  번호가 다른 월매는 <b>모름</b>으로 둔다 — ' + (B.split ? B.split.name.join(',') : '?'));
  is(B.res.cliName === 1 && /이름이 같아/.test(B.done) && /월매/.test(B.done),
     '  화면이 <b>그렇다고 말한다</b> — 누구인지까지 적습니다');
  is(/내 고객으로/.test(B.done),
     '  <b>어떻게 이으면 되는지</b>도 적는다 — 막다른 말을 하지 않습니다 (1번)');

  head('[8] ★ <b>고치는 호출이 0번</b> (7번)');
  is(B.upd === 0, '  다리를 <b>넣기 전에 박아</b> update 를 한 번도 안 부른다 — ' + B.upd + '번');
  is(dbs.length <= 1 && cliIns.length <= 2,
     '  <b>묶어</b> 보낸다 — dbs ' + dbs.length + '번 · clients ' + cliIns.length + '번');

  head('[9] ★ <b>반대 방향은 없다</b> — 개인 고객을 배정 DB 에 섞지 않는다');
  const BAD = ['assigned_date', 'assigned_to', 'stage', 'source', 'region', 'age'];
  const leak = BAD.filter((k) => cliIns.some((x) => x.keys.indexOf(k) >= 0));
  is(leak.length === 0, '  고객 줄에 배정 DB 칸이 <b>안 섞인다</b> — ' + (leak.length ? leak.join(',') : '하나도 없음'));
  is(cliIns.every((x) => x.keys.indexOf('name_masked') >= 0 && x.keys.indexOf('name') < 0),
     '  이름은 <b>가려서</b> 서버로 간다 (3번)');
  is(!cliIns.some((x) => x.keys.some((k) => /rrn|jumin|주민/i.test(k))),
     '  주민번호 칸은 <b>한 글자도</b> 안 간다 (3번)');

  /* ── ③ 다리 칸이 없는 서버 ───────────────────────────────── */
  const C = await 돌리기({ on: true, noLink: true });
  head('[3] ★★ <b>못 할 때는 까닭을 말하고 한 줄도 안 넣는다</b> (1번)');
  is(/서버 준비 SQL/.test(C.why) && /이어지지 않은 고객/.test(C.why),
     '  다리 칸이 없으면 <b>까닭과 할 일</b>을 적는다 — ' + C.why.slice(0, 46));
  is(C.ckOff && C.sayWhy, '  칸은 잠기고 <b>왜 잠겼는지</b> 화면에 적는다 — 잠긴 단추만 내밀지 않습니다 (6번)');
  is(C.ins.length === 0 && /못 합니다|서버 준비/.test(C.err || ''),
     '  <b>한 줄도 안 넣는다</b> — 이어지지 않은 고객을 만들지 않습니다 · 보낸 것 ' + C.ins.length + '건');

  const D = await 돌리기({ on: true, cliUnread: true });
  is(/아직 못 읽었습니다/.test(D.why) && D.ins.length === 0,
     '  고객 명단을 <b>못 읽었으면</b> 그렇다고 하고 멈춘다 — 모른 채 넣으면 한 줄 더 생깁니다');

  head('터진 것');
  const allErr = [].concat(A.errs, B.errs, C.errs, D.errs);
  is(allErr.length === 0, '  화면이 안 터진다 — ' + (allErr.length ? allErr.slice(0, 2).join(' | ') : '0건'));

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 고객 365일 함께 넣기 점검 — ' + bad + '가지가 어긋났습니다.'); process.exit(1); }
  console.log('✓ 고객 365일 함께 넣기 점검 통과 — 한 벌로 양쪽에 들어가고, 같은 분은 한 줄입니다.');
})().catch((e) => { console.error('✗ 터졌습니다 — ' + (e && e.message)); try { srv.close(); } catch (x) {} process.exit(1); });
