/* 📁 <b>DB 고객명단 엑셀 → DB 통합 CRM 자동 입력·분류</b> — 판 X569

   사장님 말씀 (2026-11-26) — 「<b>DB고객명단 → DB통합CRM에 자동으로 입력
   분류 기능 넣기 [엑셀]</b>」.

   ── 손대기 전에 재어 본 것 ─────────────────────────────────────────
   · <code>db-crm.html</code> 에 엑셀로 넣는 길이 <b>한 곳도 없었습니다</b> —
     「+ DB 등록」 으로 <b>한 명씩 손으로</b> 적는 길만 있었습니다.
   · 본체에는 엑셀 읽는 기계가 <b>이미 다 있었습니다</b>(cimp* 쉰 가지) —
     그런데 넣는 자리가 <b>늘 고객 365일</b> 하나였습니다. 「➕ 고객 넣기」 가
     「어느 쪽인지 먼저」 묻는데(판 X133) <b>엑셀만 묻지 않고</b> 고객으로 갔습니다.

   ── 여기서 재는 것 ───────────────────────────────────────────────
     [1] ★★ <b>문이 선다</b> — 「➕ 고객 넣기」 에 엑셀 두 갈래 · DB 통합 CRM 안에 단추
     [2] ★★ <b>배정 DB 로 열면 거기로 간다</b> — 머리에 「넣을 곳」 을 적고,
            설정 셋(배정일·종류·담당자)이 선다
     [3] ★★ <b>칸을 알아서 맞춘다</b> — 이름·연락처·생년·주소·종류·배정일·담당자
     [4] ★★ <b>자동 분류</b> — 종류를 이미 쓰시는 것에 모으나 · 지역에서 동을 뽑나 ·
            나이를 생년에서 셈하나 · 단계가 늘 첫 단계인가 · 담당자를 팀원과 맞추나
     [5] ★★ <b>같은 분을 두 번 넣지 않는다</b> (5-1번) — 배정 DB 에 이미 있는 분 ·
            파일 안 중복 · 이름 없는 줄을 갈라내고 <b>무엇과 겹쳤는지 말하나</b>
     [6] ★★ <b>지어내지 않는다</b> (1번) — 배정일이 없으면 <b>막고</b>, 오늘로 몰래
            채우지 않나 · 생년을 못 읽으면 나이를 <b>비우나</b>(0 이 아님)
     [7] ★★ <b>dbs 에만 넣는다</b> — clients 는 한 줄도 안 건드리나 (표를 안 합침)
     [8] ★★ <b>까닭을 거짓으로 말하지 않는다</b> (1번) — 「팀원 명단에 없다」 와
            「담당자를 바꿀 수 없다」 를 갈라 말하나
     [9] ★  주민번호 칸은 아예 안 들어오나 (3번) · 밑줄 칸을 서버로 안 보내나
    [10] ★  서버를 아껴 쓰나 (7번) — 묶어 보내나

   ⚠ <b>안 재는 것과 까닭</b> (8번) —
     · xlsx·CSV 를 <b>읽는 기계 자체</b>는 안 봅니다 — cimp* 는 고객 365일 쪽에서
       이미 쓰이고 그쪽 자(check-cimp 계열)가 봅니다. 여기서 또 재면 두 자가
       같은 것을 세다 어긋납니다 (5번). 여기서 보는 것은 <b>갈라지는 자리</b>입니다.
     · 사장님 <b>진짜 서버는 한 번도 안 부릅니다</b> — 가짜 서버를 끼워 간 줄을
       받아 봅니다. 바깥은 전부 끊습니다.

   ⚠ <b>제 자가 틀렸던 자리 ②</b> — 넣기를 <code>dbimpGo</code> 로 <b>바로</b> 불러
     재었습니다. 그런데 단추가 누르는 것은 <code>cimpGo</code> 이고, 거기서 배정 DB 로
     갈라집니다. 그 <b>갈라지는 줄을 떼어도 자가 안 울었습니다</b> — 단추가 지나는
     길로 부르게 고쳤습니다 (8번).

   ⚠ <b>제 자가 틀렸던 자리</b> — 처음에 팀원 명단을 심지 않고 재어 「담당자를
     못 맞춘다」 로 읽었습니다. 앱은 옳았고(팀원 배정은 대표·관리자만 할 수
     있습니다) <b>앱이 까닭을 거짓으로 말하는</b> 것이 참 문제였습니다.
     그래서 [8] 이 생겼습니다 — 재다가 찾은 버그입니다 (8번).         */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8993;
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

/* 견본 명단 — 고객 이름은 <b>홍길동 식구</b>로만 씁니다 (CLAUDE.md 3번) */
const HEAD = ['고객명', '연락처', '생년월일', '성별', '주소', 'DB종류', '배정일', '담당자', '비고'];
const ROWS = [HEAD,
  ['성춘향', '010-5555-6666', '1985-03-04', '여', '전남 순천시 조례동 123', '소개 DB', '2026-11-20', '김설계', '아는 분 소개'],
  ['이몽룡', '010-7777-1234', '19900811',   '남', '서울 강남구 역삼동',     '인터넷db', '46352',     '이설계', ''],
  ['홍길동', '010-1111-2222', '1977-01-02', '남', '순천시 왕지동',         '소개',     '2026-11-20', '김설계', '이미 있는 분'],
  /* ⚠ 담당자 시험 줄은 <b>번호가 겹치지 않아야</b> 합니다 — 겹치면 「파일 안 중복」 으로
     먼저 걸러져 담당자까지 못 갑니다. 제가 처음에 그렇게 짜서 헛빨간불이 떴습니다 (8번). */
  ['변학도', '010-4444-5555', '1980-05-05', '남', '부산 해운대구',         '리콜',     '2026-11-20', '없는사람', ''],
  ['향단',   '010-7777-1234', '1992-06-06', '여', '순천시 조례동',         '소개',     '2026-11-20', '김설계', '이몽룡과 번호가 같음'],
  ['',       '010-2222-0000', '1991-01-01', '남', '광주',                  '소개',     '2026-11-20', '', ''],
  ['월매',   '',              '1960-02-02', '여', '순천시 연향동',         '소개',     '2026-11-20', '김설계', '번호 없음'],
  ['방자',   '010-8888-7777', '',           '남', '여수시 학동',           '소개',     '2026-11-20', '김설계', '']];

/* 앱 안에서 심는 것 — 가짜 서버 · 팀원 · 이미 있는 분 */
const SEED = function (role) {
  window.__sent = [];
  window.osClient = function () { return { from: function (t) { return {
    insert: function (rs) { window.__sent.push({ t: t, rows: rs });
      return { select: function () { return Promise.resolve({ data: rs.map(function (x, i) { return { id: 'n' + i }; }), error: null }); } }; } }; } }; };
  window.arMyId = function () { return 'ME'; };
  window.arLoad = function () {};
  window.AR = window.AR || {}; window.AR.loaded = true;
  window.AR.db = [{ id: 'd1', customer_name: '홍길동', phone: '010-1111-2222', src: '소개' },
                  { id: 'd2', customer_name: '임꺽정', phone: '010-3333-4444', src: '인터넷' }];
  window.arScope = function () { return [{ id: 'U1', name: '김설계' }, { id: 'U2', name: '이설계' }]; };
  window.hdbStages = function () { return ['미접촉', 'TA', 'AP', 'PC', 'CS']; };
  if (role === 'owner') { window.osRole = function () { return 'owner'; }; window.osIsOwner = function () { return true; }; }
  else { window.osRole = function () { return 'fp'; }; window.osIsOwner = function () { return false; }; }
};

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const 열기 = async () => {
    const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
    /* ⚠ 바깥은 전부 끊습니다 — 「점검이 사장님 진짜 서버를 읽지 않는다」 */
    await ctx.route('**://**', (r) => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e && e.message).slice(0, 90)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(3800);
    return { ctx, pg, errs };
  };

  /* ── 글로 보는 것 ────────────────────────────────────────── */
  const 글 = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };
  const APP = 글('app/index.html'), DC = 글('db-crm.html');

  head('[1] ★★ <b>문이 선다</b> — 사장님이 찾는 자리에 (6번)');
  is(/onclick="dbimpOpen\(\)"/.test(APP),
     '  「➕ 고객 넣기」 에 <b>엑셀·CSV → DB 통합 CRM</b> 문이 있다');
  is(/onclick="cregGoXls\(\)"/.test(APP),
     '  <b>옛 길(엑셀 → 고객 365일)도 그대로</b> 있다 — 길을 안 지웁니다 (6번)');
  is(/id="dbXlsBtn"[\s\S]{0,80}onclick="dbXlsGo\(\)"/.test(DC),
     '  📁 DB 통합 CRM 머리에 <b>📥 엑셀로 명단</b> 단추가 있다');
  is(/function dbXlsGo\(\)[\s\S]{0,700}postMessage\(\{type:'apexDbImp'\}/.test(DC),
     '  그 단추는 <b>본체에 말만 보냅니다</b> — 엑셀 기계를 두 벌 만들지 않습니다 (5번)');
  is(/type==='apexDbImp'[\s\S]{0,120}dbimpOpen/.test(APP),
     '  본체가 그 말을 <b>받아 창을 엽니다</b>');
  is(/본체가 없습니다|APEX YUN PRO 에서 열어 주십시오/.test(DC),
     '  혼자(새 탭) 여셨으면 <b>어디로 가야 하는지 말해 줍니다</b> — 숨기지 않습니다 (1번)');

  /* ── 실제로 돌려 보는 것 ─────────────────────────────────── */
  const o = await 열기();
  const R = await o.pg.evaluate(async (a) => {
    eval('(' + a.seed + ')("owner")');
    const O = {};
    window.dbimpOpen();
    O.dest = window.cimpDest();
    O.say = window.cimpSay().replace(/<[^>]*>/g, ' ');
    window.cimpTake(a.rows, '');
    O.step = window.CIMP.step;
    O.map = {}; Object.keys(window.CIMP.map).forEach(function (k) { O.map[window.CIMP.head[k]] = window.CIMP.map[k]; });
    const mh = window.cimpMapHtml();
    O.setPanel = /배정 DB 로 넣습니다/.test(mh);
    O.sayStage = /단계는 늘/.test(mh);
    O.sayRrn = /주민번호 칸은 아예 안 가져옵니다/.test(mh);
    const S = window.cimpSort();
    O.bk = { ok: S.ok.length, dupHave: S.dupHave.length, dupFile: S.dupFile.length,
             noName: S.noName.length, noTel: S.noTel.length };
    O.whyHave = S.dupHave.map(function (x) { return x.nm + '|' + x.why; });
    O.whyFile = S.dupFile.map(function (x) { return x.nm + '|' + x.why; });
    const P = window.cimpPickList();
    O.rows = P.map(function (x) { const q = window.dbimpRow(x, 'ME');
      return { nm: q.customer_name, src: q.source, st: q.stage, age: q.age, got: q.assigned_date,
               who: q.assigned_to, rg: q.region, dong: q._why.dong, why: q._why.whyWho }; });
    O.snap = { a: window.dbimpSrcSnap('소개 DB'), b: window.dbimpSrcSnap('인터넷db'), c: window.dbimpSrcSnap('리콜') };
    O.date = { x: window.dbimpDate('46352'), y: window.dbimpDate('19900811'), z: window.dbimpDate('없음') };
    /* ★ <b>단추가 지나는 길로</b> 부릅니다 — cimpGo 입니다.
       ⚠ 처음에 dbimpGo 를 바로 불러 재었더니, 「넣는 자리를 가르는 줄」 을
         떼어도 자가 안 울었습니다 — 단추는 cimpGo 를 누르는데 자는 그 뒤를
         재고 있었습니다. 안 울리는 알람은 알람이 아닙니다 (8번). */
    window.cimpGo();
    await new Promise(function (r) { setTimeout(r, 900); });
    O.res = window.CIMP.res; O.err = window.CIMP.err; O.step2 = window.CIMP.step;
    O.sent = window.__sent.map(function (x) { return { t: x.t, n: x.rows.length, keys: Object.keys(x.rows[0]) }; });
    O.done = window.cimpDoneHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    return O;
  }, { rows: ROWS, seed: SEED.toString() });

  head('[2] ★★ <b>배정 DB 로 열면 거기로 간다</b>');
  is(R.dest === 'db', '  열면 넣을 곳이 <b>배정 DB</b> 다 — ' + R.dest);
  is(/넣을 곳/.test(R.say) && /배정 DB/.test(R.say),
     '  창 <b>맨 위에 「넣을 곳」</b>을 적는다 — 잘못 들어가면 손으로만 되돌립니다 (1번)');
  is(R.setPanel, '  칸 맞추기에 <b>배정일·종류·담당자</b> 설정이 선다');

  head('[3] ★★ <b>칸을 알아서 맞춘다</b>');
  const want = { '고객명': 'nm', '연락처': 'ph', '생년월일': 'by', '성별': 'gd',
                 '주소': 'rg', 'DB종류': 'src', '배정일': 'got', '담당자': 'who' };
  const miss = Object.keys(want).filter((k) => R.map[k] !== want[k]);
  is(miss.length === 0, '  머리글 <b>여덟</b>을 다 알아봤다' +
     (miss.length ? (' ⚠ 못 맞춘 것: ' + miss.map((k) => k + '→' + R.map[k]).join(' / ')) : ''));

  head('[4] ★★ <b>자동 분류</b>');
  is(R.snap.a === '소개' && R.snap.b === '인터넷',
     '  「소개 DB」·「인터넷db」 를 <b>이미 쓰시는 종류로 모은다</b> — ' + R.snap.a + ' · ' + R.snap.b);
  is(R.snap.c === '리콜',
     '  붙을 것이 없으면 <b>적힌 그대로</b> 둔다 — 지어내지 않습니다 (1번 · 리콜 → ' + R.snap.c + ')');
  const dong = R.rows.map((x) => x.dong).filter((x) => x);
  is(dong.length >= 3, '  주소에서 <b>동·읍·면</b>을 뽑는다 — ' + dong.slice(0, 3).join(' · '));
  const st = R.rows.map((x) => x.st);
  is(st.every((x) => x === '미접촉'),
     '  단계는 <b>늘 첫 단계(미접촉)</b> 다 — 상담·계약은 짐작하지 않습니다 (1번)');
  const chun = R.rows.filter((x) => x.nm === '성춘향')[0] || {};
  is(chun.age === (new Date()).getFullYear() - 1985 + 1,
     '  <b>나이를 생년에서 셈한다</b> — 성춘향 ' + chun.age + '세');
  is(chun.who === 'U1', '  담당자를 <b>팀원 명단과 맞춘다</b> — 김설계 → ' + chun.who);
  is(R.date.x && /^20\d\d-\d\d-\d\d$/.test(R.date.x) && R.date.y === '1990-08-11',
     '  <b>엑셀 날짜 수</b>도 읽는다 — 46352 → ' + R.date.x + ' · 19900811 → ' + R.date.y);

  head('[5] ★★ <b>같은 분을 두 번 넣지 않는다</b> (5-1번)');
  is(R.bk.dupHave === 1 && /이미 계십니다/.test(R.whyHave.join(' ')),
     '  <b>배정 DB 에 이미 있는 분</b>을 갈라내고 까닭을 말한다 — ' + (R.whyHave[0] || '(없음)'));
  /* ★ <b>이름을 박아 두지 않습니다</b> — 견본의 어느 줄이 걸릴지는 번호가 정합니다.
     묻는 것은 「갈라냈나 · <b>까닭을 말하나</b>」 입니다 (5-1번). */
  is(R.bk.dupFile === 1 && /파일 안에 같은 분/.test(R.whyFile.join(' ')),
     '  <b>파일 안 중복</b>도 갈라내고 까닭을 말한다 — ' + (R.whyFile[0] || '(없음)'));
  is(R.bk.noName === 1, '  <b>이름 없는 줄</b>은 안 넣는다 — ' + R.bk.noName + '줄');
  is(/이미 있어/.test(R.done) && /파일 안 중복/.test(R.done),
     '  끝낸 화면이 <b>무엇과 겹쳐 안 넣었는지</b> 말한다 — 「건너뜀 N건」 으로 끝내지 않습니다 (5-1번)');

  head('[6] ★★ <b>지어내지 않는다</b> (1번)');
  const bang = R.rows.filter((x) => x.nm === '방자')[0] || {};
  is(bang.age === undefined || bang.age === null,
     '  생년을 못 읽으면 나이를 <b>비운다</b> — 0 은 「0살」 입니다 (방자 ' + bang.age + ')');
  is(/오늘 날짜로 몰래 채우지 않습니다/.test(APP),
     '  배정일을 <b>오늘로 몰래 채우지 않는다</b>고 그 자리에서 말한다');
  /* ★★ <b>배정일이 없는 파일</b>을 실제로 넣어 봅니다 — 글로만 보면 안 됩니다.
     ⚠ 제 견본에 배정일 칸이 <b>있어서</b>, 오늘로 몰래 채우게 되돌려도 자가 안
       울었습니다. 비는 경우를 한 번도 안 재고 있었습니다 (8번).            */
  const o3 = await 열기();
  const R3 = await o3.pg.evaluate(async (a2) => {
    eval('(' + a2.seed + ')("owner")');
    window.dbimpOpen(); window.cimpTake(a2.rows, '');
    window.cimpGo();
    await new Promise(function (r) { setTimeout(r, 700); });
    return { err: window.CIMP.err, step: window.CIMP.step, sent: window.__sent.length,
             panel: /비울 수 없는 칸/.test(window.cimpMapHtml()) };
  }, { rows: [['고객명', '연락처'], ['성춘향', '010-5555-6666'], ['월매', '010-6666-7777']],
       seed: SEED.toString() });
  is(/배정일/.test(R3.err || '') && R3.step === 'map' && R3.sent === 0,
     '  배정일이 <b>없는 파일</b>은 넣기를 <b>막고</b> 그 자리에서 여쭙는다 — 서버로 간 줄 ' +
     R3.sent + '개 · 「' + String(R3.err || '').slice(0, 34) + '」');
  is(R3.panel, '  그 화면이 <b>비울 수 없는 칸</b>이라고 적는다 (1번)');
  await o3.ctx.close();

  head('[7] ★★ <b>dbs 에만 넣는다</b> — 표를 안 합칩니다');
  is(R.sent.length > 0 && R.sent.every((x) => x.t === 'dbs'),
     '  간 표가 <b>dbs 뿐</b>이다 — ' + R.sent.map((x) => x.t).join(','));
  is(R.sent.length > 0 && !R.sent[0].keys.some((k) => k.charAt(0) === '_'),
     '  <b>밑줄 칸</b>(_why)은 서버로 안 간다');
  /* ★ 수를 <b>박아 두지 않습니다</b> — 견본을 한 줄 늘리면 자가 거짓으로 웁니다.
     묻는 것은 「<b>고른 줄과 넣은 줄이 같은가</b>」 입니다 (5번 — 세는 곳은 하나). */
  is(R.res && R.bk.ok > 0 && R.res.ok === R.bk.ok,
     '  <b>고른 줄과 넣은 줄이 같다</b> — 고름 ' + R.bk.ok + ' · 넣음 ' + (R.res && R.res.ok));

  head('[8] ★★ <b>까닭을 거짓으로 말하지 않는다</b> (1번)');
  is(R.res && R.res.noWho === 1 && R.res.cantWho === 0,
     '  대표일 때는 「<b>팀원 명단에 없다</b>」 로 센다 — 없음 ' + (R.res && R.res.noWho) +
     ' · 못바꿈 ' + (R.res && R.res.cantWho));
  await o.ctx.close();

  /* 권한이 없는 설계사 — 같은 파일을 넣어 보면 <b>다른 까닭</b>을 말해야 한다 */
  const o2 = await 열기();
  const R2 = await o2.pg.evaluate(async (a) => {
    eval('(' + a.seed + ')("fp")');
    window.dbimpOpen(); window.cimpTake(a.rows, '');
    /* ★ <b>단추가 지나는 길로</b> 부릅니다 — cimpGo 입니다.
       ⚠ 처음에 dbimpGo 를 바로 불러 재었더니, 「넣는 자리를 가르는 줄」 을
         떼어도 자가 안 울었습니다 — 단추는 cimpGo 를 누르는데 자는 그 뒤를
         재고 있었습니다. 안 울리는 알람은 알람이 아닙니다 (8번). */
    window.cimpGo();
    await new Promise(function (r) { setTimeout(r, 900); });
    return { res: window.CIMP.res, can: window.dbimpCanWho(),
             done: window.cimpDoneHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') };
  }, { rows: ROWS, seed: SEED.toString() });
  is(R2.can === false && R2.res && R2.res.cantWho > 0 && R2.res.noWho === 0,
     '  설계사일 때는 「<b>담당자를 바꿀 수 없다</b>」 로 센다 — 못바꿈 ' +
     (R2.res && R2.res.cantWho) + ' · 없음 ' + (R2.res && R2.res.noWho));
  is(/대표·관리자만/.test(R2.done) && !/팀원 명단에서 못 찾았습니다/.test(R2.done),
     '  그 화면이 <b>권한 때문</b>이라고 말하고, 「명단에 없다」 고 <b>거짓을 안 적는다</b>');
  await o2.ctx.close();

  head('[9] ★ 주민번호와 밑줄 칸 (3번)');
  is(/CIMP_NO=\['주민'/.test(APP),
     '  <b>주민번호 머리글은 아예 잠겨</b> 있다 — 배정 DB 는 팀이 함께 보는 표입니다');
  is(/주민번호 칸은 아예 안 가져옵니다/.test(APP),
     '  그 말을 <b>화면에서도</b> 한다 (1번)');

  head('[10] ★ 서버를 아껴 쓴다 (7번)');
  is(/var DBIMP_CHUNK=\d+/.test(APP), '  <b>묶어 보낸다</b> — DBIMP_CHUNK');
  is(/dbimpMany\(rows,function\(at,of\)/.test(APP), '  몇 줄째인지 <b>화면에 적는다</b>');
  is(o.errs.length === 0 && o2.errs.length === 0,
     '  콘솔에 에러가 없다' + (o.errs.length ? (' — ' + o.errs[0]) : ''));

  await br.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
  console.log('✓ DB 명단 엑셀 점검 통과 — 넣으면 알아서 나뉘고, 같은 분은 두 번 안 들어갑니다.');
  srv.close(); process.exit(0);
})();
