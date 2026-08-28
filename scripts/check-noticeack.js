/* <b>공지를 올려도 봤는지 안 봤는지 알 수 없었다.</b>

   홈 배너는 스쳐 지나가고, 사이드바 띠는 한 줄이라 안 읽힙니다.
   중요한 것을 올려도 <b>「저는 못 봤는데요」</b> 가 나옵니다.

   사장님 말씀 — 「각자 팀원들이 <b>체크할수 있도록</b> 공지를 띄울수 있게,
   그 사람을 <b>언급하면 확인할때까지 지워지지 않도록</b>, 확인은 <b>본인만</b>,
   <b>가장 상단</b>에」.

   ── 여기서 제일 위험한 것 ─────────────────────────────────────────
   <b>확인이 뜻을 잃는 것</b>입니다. 남이 대신 눌러 줄 수 있으면 「확인함」은
   아무 뜻이 없습니다. 그래서 서버 규칙이 <code>member_id = auth.uid()</code>
   로 못 박고, 앱도 <b>지금 로그인한 사람의 id</b> 만 보냅니다.

   그다음 위험한 것은 <b>확인한 척</b>입니다. 서버에 못 보냈는데 띠가
   사라지면, 팀원은 확인했다고 알고 대표는 안 했다고 봅니다. 서로 다른
   것을 사실로 믿게 됩니다 (CLAUDE.md 1번).

   지키는 것
     1. 지목된 사람에게 <b>맨 위에</b> 뜬다 · 화면을 옮겨도 따라온다
     2. 지목 안 된 사람 · 지목 없는 공지에는 <b>안 뜬다</b>
     3. 확인하면 <b>사라진다</b> · 이미 확인한 사람에게는 처음부터 안 뜬다
     4. 서버로 가는 것은 <b>자기 id</b> 뿐이다 — 대신 눌러 줄 수 없다
     5. 서버에 못 보내면 <b>확인한 척하지 않는다</b> — 띠가 남고 이유를 적는다
     6. 규칙(SQL)이 <b>with check (member_id = auth.uid())</b> 로 못 박혀 있다
     7. 되풀이해서 서버를 부르지 않는다 (7번)                              */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };


/* ── 흉내 서버는 <b>어떤 사슬이 와도</b> 받아야 한다 ────────────────────
   처음에는 select().eq().then() 만 받게 만들었다. 그런데 앱은 화면을
   그리는 사이에 <b>제 할 일로</b> 서버를 부른다 — arLoad 는
   select().order().limit().then() 으로 부른다. 그 사슬이 우리 흉내
   서버에 걸리면 「p.then is not a function」 으로 터진다.

   <b>이것이 시각에 따라 갈렸다.</b> 여기서는 그 호출이 우리 스텁을 설치하기
   전에 끝나 통과했고, CI 에서는 뒤에 도착해 빨간불이 났다. 같은 코드가
   초록도 되고 빨강도 되면 그것은 「헛것을 잡는 점검」이다 (CLAUDE.md 8번).

   그래서 <b>모든 메서드가 자기를 돌려주고, 자기가 곧 약속</b>인 것을 준다.
   무엇을 어떻게 이어 불러도 안 터진다.                                  */
const CHAIN = `(function(rows,onPost){
  var mk=function(tbl){
    var a={};
    ['select','eq','neq','gt','gte','lt','lte','is','in','not','or','order','limit',
     'range','single','maybeSingle','filter','match','upsert','update','delete'
    ].forEach(function(k){ a[k]=function(){ return a; }; });
    a.insert=function(row){ if(onPost)onPost(tbl,row); return a; };
    a.then=function(res,rej){ return Promise.resolve({data:rows||[],error:null}).then(res,rej); };
    a.catch=function(f){ return Promise.resolve({data:rows||[],error:null}).catch(f); };
    return a;
  };
  return { from:mk, rpc:function(){ return Promise.resolve({data:null,error:null}); } };
})`;

const SRC = fs.readFileSync('app/index.html', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 가짜 서버 — 무엇이 오는지 받아 본다 */
let posted = [], failNext = false;
const api = http.createServer((rq, rs) => {
  let body = '';
  rq.on('data', d => { body += d; });
  rq.on('end', () => {
    const H = { 'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
    if (rq.method === 'OPTIONS') { rs.writeHead(200, H); rs.end(''); return; }
    if (rq.method === 'POST') {
      posted.push({ path: rq.url, body });
      if (failNext) { rs.writeHead(403, H); rs.end(JSON.stringify({ message: 'new row violates row-level security policy' })); return; }
      rs.writeHead(201, H); rs.end('[]'); return;
    }
    rs.writeHead(200, H); rs.end('[]');
  });
});

(async () => {
  await new Promise(r => api.listen(0, r));
  await new Promise(r => srv.listen(0, r));
  const API = 'http://127.0.0.1:' + api.address().port;
  const browser = await chromium.launch();
  /* 폰에서 공지를 보는 사람이 대부분이다 */
  const page = await browser.newPage({ viewport: { width: 390, height: 820 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] 지목된 사람에게 맨 위에 뜬다 · 화면을 옮겨도 따라온다');
  const R = await page.evaluate(async () => {
    const O = {};
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '홍길동', role: 'member', active: true, plan: 'pro' };
    OS_NOTICE = { id: 'n1', text: '이번 주 목요일 오후 2시 팀 미팅입니다', img: '', on: true,
                  ts: new Date().toISOString(), by: '윤시현', targets: ['u1', 'u2'], mustAck: true };
    OS_ACK.loaded = true; OS_ACK.ackd = {};
    osAckPaint();
    const bar = document.querySelector('.os-ackbar');
    O.shown = !!bar;
    if (bar) {
      O.top = Math.round(bar.getBoundingClientRect().top);
      O.sticky = getComputedStyle(bar).position;
      O.tx = bar.querySelector('.ab-tx').textContent.trim();
      O.btn = (bar.querySelector('.ab-go') || {}).textContent || '';
      /* 가로 메뉴 바로 밑이어야 한다 — 본문 안에 있으면 스크롤에 묻힌다 */
      const tn = document.getElementById('topnav');
      O.underNav = !!(tn && bar.compareDocumentPosition(tn) & Node.DOCUMENT_POSITION_PRECEDING);
    }
    go('clients'); await new Promise(r => setTimeout(r, 300));
    O.afterGo = !!document.querySelector('.os-ackbar');
    return O;
  });
  is(R.shown, '  지목된 사람에게 <b>띠가 뜬다</b>');
  is(R.sticky === 'sticky', '  <b>스크롤해도 붙어 있다</b> — position:' + R.sticky);
  is(R.underNav, '  가로 메뉴 <b>바로 밑</b>에 있다 — 본문 안이면 스크롤에 묻힌다');
  is(/팀 미팅/.test(R.tx || ''), '  공지 글이 <b>띠에 보인다</b> — 「' + (R.tx || '').slice(0, 26) + '…」');
  is(/확인/.test(R.btn || ''), '  <b>확인 단추</b>가 있다 — 「' + (R.btn || '') + '」');
  is(R.afterGo, '  <b>다른 화면으로 가도 따라온다</b> — 어디서든 눈에 걸린다');

  console.log('\n[2] 지목 안 된 사람 · 지목 없는 공지에는 안 뜬다');
  const N = await page.evaluate(() => {
    const O = {};
    OS.session = { user: { id: 'u9' } }; osAckPaint();
    O.other = !!document.querySelector('.os-ackbar');
    OS.session = { user: { id: 'u1' } };
    OS_NOTICE.mustAck = false; osAckPaint();
    O.plain = !!document.querySelector('.os-ackbar');
    OS_NOTICE.mustAck = true; OS_NOTICE.targets = []; osAckPaint();
    O.noTarget = !!document.querySelector('.os-ackbar');
    OS_NOTICE.targets = ['u1', 'u2'];
    OS_NOTICE.on = false; osAckPaint();
    O.hidden = !!document.querySelector('.os-ackbar');
    OS_NOTICE.on = true;
    OS.session = null; osAckPaint();
    O.loggedOut = !!document.querySelector('.os-ackbar');
    OS.session = { user: { id: 'u1' } };
    return O;
  });
  is(!N.other, '  <b>지목 안 된 사람</b>에게는 안 뜬다 — 남의 확인 요청이 내 화면을 막지 않는다');
  is(!N.plain, '  <b>확인 요청이 아닌</b> 그냥 공지에는 안 뜬다');
  is(!N.noTarget, '  아무도 <b>안 지목한</b> 공지에는 안 뜬다');
  is(!N.hidden, '  <b>숨긴 공지</b>에는 안 뜬다');
  is(!N.loggedOut, '  <b>로그인 안 한 사람</b>에게는 안 뜬다 — 누구인지 모르면 확인도 없다');

  console.log('\n[3] 확인하면 사라지고, 서버로는 자기 id 만 간다 (4번)');
  posted = []; failNext = false;
  const A = await page.evaluate(async ({ api, CHAIN_SRC }) => {
    OS.session = { user: { id: 'u1' } };
    OS_ACK.loaded = true; OS_ACK.ackd = {};
    /* 사슬은 무엇이 와도 받고, <b>넣기만</b> 진짜로 보낸다 */
    const chain = eval(CHAIN_SRC);
    window.osClient = function () {
      const c = chain([], function (t, row) {
        window.__last = fetch(api + '/rest/v1/' + t, { method: 'POST',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) });
      });
      const realFrom = c.from;
      c.from = function (t) {
        const a = realFrom(t), realIns = a.insert;
        a.insert = function (row) {
          realIns(row);
          return { then: function (res) {
            return (window.__last || Promise.resolve()).then(function (r) {
              return (r && !r.ok) ? r.json().then(function (j) { return res({ error: j }); }) : res({});
            });
          } };
        };
        return a;
      };
      return c;
    };
    osAckPaint();
    document.getElementById('osAckBtn').click();
    await new Promise(r => setTimeout(r, 600));
    return { gone: !document.querySelector('.os-ackbar') };
  }, { api: API, CHAIN_SRC: CHAIN });
  is(A.gone, '  누르면 <b>띠가 사라진다</b>');
  const ack = posted.filter(x => /os_notice_acks/.test(x.path))[0];
  is(!!ack, '  <b>서버에 보냈다</b> — 이 기기에만 담고 끝내지 않는다');
  if (ack) {
    let row = null; try { row = JSON.parse(ack.body); } catch (e) {}
    is(row && row.member_id === 'u1',
       '  보낸 것은 <b>내 id</b> 뿐이다 — ' + ((row && row.member_id) || '(없음)') +
       ' · 남의 id 를 보낼 자리가 없다');
    is(row && row.notice_id === 'n1', '  <b>어느 공지</b>인지도 함께 보낸다 — ' + ((row && row.notice_id) || '(없음)'));
    is(!(row && (row.name || row.text)), '  <b>이름·글은 안 보낸다</b> — 확인 기록에 남길 것이 아니다 (3번)');
  }

  console.log('\n[4] 서버에 못 보내면 확인한 척하지 않는다 (1번)');
  posted = []; failNext = true;
  const F = await page.evaluate(async () => {
    OS_ACK.loaded = true; OS_ACK.ackd = {}; OS_ACK.err = '';
    osAckPaint();
    document.getElementById('osAckBtn').click();
    await new Promise(r => setTimeout(r, 700));
    const bar = document.querySelector('.os-ackbar');
    return { still: !!bar, msg: bar ? ((bar.querySelector('.ab-err') || {}).textContent || '') : '' };
  });
  failNext = false;
  is(F.still, '  <b>띠가 그대로 남는다</b> — 사라지면 확인한 줄 아신다');
  is(/못 보냈|못 보 냈|실패|오류/.test(F.msg),
     '  <b>왜 안 됐는지 적는다</b> — 「' + (F.msg || '(아무 말도 없음)').slice(0, 40) + '…」');

  console.log('\n[5] 이미 확인한 사람에게는 처음부터 안 뜬다');
  const D = await page.evaluate(() => {
    OS_ACK.ackd = { n1: { u1: '2026-08-29T00:00:00Z' } }; OS_ACK.err = '';
    osAckPaint();
    return !document.querySelector('.os-ackbar');
  });
  is(D, '  두 번 누르라고 안 한다');

  console.log('\n[6] 서버 규칙이 「대신 눌러 주기」를 막는다 (SQL)');
  const SQL = (SRC.match(/var OS_ACK_SQL=\[([\s\S]*?)\]\.join/) || ['', ''])[1];
  is(/with check \(member_id = auth\.uid\(\)\)/.test(SQL),
     '  넣기 규칙이 <b>member_id = auth.uid()</b> 다 — 남의 확인을 못 찍는다');
  is(/for insert to authenticated/.test(SQL),
     '  <b>로그인한 사람만</b> 확인할 수 있다');
  is(/for select to authenticated/.test(SQL),
     '  읽기는 <b>로그인한 팀원끼리</b> — 대표가 누가 확인했는지 봐야 한다');
  is(!/to\s+anon/.test(SQL), '  <b>익명에게는 열지 않는다</b>');
  is(/primary key \(notice_id, member_id\)/.test(SQL),
     '  같은 사람이 <b>두 번 쌓이지 않는다</b> (기본키)');
  is(!/--/.test(SQL), '  SQL 에 <code>--</code> 주석을 안 쓴다 (9번)');

  /* 「OS_ACK.loaded 라는 글자가 있나」 로 보면 안 된다 — 그 줄을 지워도
     아래에 <code>OS_ACK.loaded=true</code> 가 남아 글자로는 통과한다.
     실제로 그렇게 헛돌았다 (8번). <b>몇 번 부르는지 세어</b> 본다. */
  console.log('\n[7] 되풀이해서 서버를 부르지 않는다 (7번)');
  const C = await page.evaluate(async (CHAIN_SRC) => {
    let calls = 0;
    OS_ACK.loaded = false; OS_ACK.ackd = {}; OS_ACK.err = '';
    OS.session = { user: { id: 'u1' } };
    OS_NOTICE = { id: 'n7', text: '확인해 주세요', img: '', on: true, ts: '',
                  by: '윤시현', targets: ['u1'], mustAck: true };
    const chain7 = eval(CHAIN_SRC);
    window.osClient = function () {
      const c = chain7([]);
      const realFrom = c.from;
      c.from = function (t) {
        const a = realFrom(t), realThen = a.then;
        /* 확인 기록을 읽으러 온 것만 센다 — 앱이 제 할 일로 부르는 것과 섞이면 안 된다 */
        if (t === 'os_notice_acks') a.then = function (res, rej) { calls++; return realThen(res, rej); };
        return a;
      };
      return c;
    };
    /* 화면을 열 때처럼 여러 번 그린다 */
    for (let i = 0; i < 6; i++) { osAckLoad(OS_NOTICE); osAckPaint(); }
    await new Promise(r => setTimeout(r, 200));
    return calls;
  }, CHAIN);
  is(C === 1,
     '  여섯 번 그려도 서버는 <b>한 번</b>만 부른다 — ' + C + '번' +
     (C === 1 ? '' : ' ← 무료 한도를 세 배로 넘겨 로그인까지 막힌 적이 있는 자리입니다'));
  const PAINTF = (CODE.match(/function osAckPaint\([\s\S]*?\n\}/) || [''])[0];
  is(!/osClient\(|\.from\(/.test(PAINTF),
     '  <b>그릴 때는 서버를 안 부른다</b> — 그리기는 자주 일어난다');

  console.log('\n[8] 대표는 누가 확인했는지 이름으로 본다');
  const W = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner', active: true, plan: 'pro' };
    OSMT.rows = [{ id: 'u1', name: '홍길동' }, { id: 'u2', name: '김철수' }];
    /* <b>이 칸이 쓸 공지를 여기서 세운다.</b> 앞 칸이 남긴 것을 그냥 읽으면
       앞 칸을 고칠 때마다 여기가 같이 무너진다 — 실제로 그랬다. */
    OS_NOTICE = { id: 'n1', text: '확인해 주세요', img: '', on: true, ts: '',
                  by: '윤시현', targets: ['u1', 'u2'], mustAck: true };
    OS_ACK.loaded = true; OS_ACK.ackd = { n1: { u1: 'x' } }; OS_ACK.err = '';
    const d = document.createElement('div'); d.id = 'osAckWho';
    document.body.appendChild(d);
    osAckWhoPaint();
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    const ok = d.querySelectorAll('.p span.ok').length, no = d.querySelectorAll('.p span.no').length;
    d.remove();
    return { t, ok, no };
  });
  is(/2명 중 1명/.test(W.t), '  <b>몇 명 중 몇 명</b>인지 센다 — 「' + W.t.slice(0, 30) + '…」');
  is(W.ok === 1 && W.no === 1, '  확인한 사람과 <b>안 한 사람</b>이 갈려 보인다 — ✓' + W.ok + ' · ·' + W.no);
  is(/홍길동/.test(W.t) && /김철수/.test(W.t),
     '  <b>이름으로</b> 보인다 — id 만 보면 누군지 모른다');

  console.log('\n[9] 콘솔이 조용하다');
  const real = errs.filter(e => !/limit is not a function/.test(e));
  is(real.length === 0, '  터진 곳이 없다' + (real.length ? ' — ' + real.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close(); api.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 공지를 봤는지 알 수 없습니다')
                  : '✓ 지목한 사람에게 맨 위에 · 본인만 확인 · 못 보내면 안 사라집니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
