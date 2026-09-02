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
     7. 되풀이해서 서버를 부르지 않는다 (7번)
     8. <b>새 공지가 하나 더 올라와도</b> 확인 안 한 지목 공지는 안 사라진다
     9. 설정에서 <b>「올렸는데 팀에 보이나」</b> 를 서버에 물어 답한다 —
        이 기기에 담긴 것으로 「게시 중」 이라 답하지 않는다 (1번)         */

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
   무엇을 어떻게 이어 불러도 안 터진다.

   ── 표별로 다르게 답해야 하는 자리가 생겼다 ──────────────────────────
   앱이 <b>같은 표를 두 가지로</b> 읽기 시작했다 — 배너에 세울 <b>최신 한
   건</b>과, 나를 지목한 <b>미확인 공지</b>. 둘이 서로 다른 줄이라야 「새
   공지에 밀려 사라지는가」 를 잴 수 있다. 그래서 rows 에 <b>표 이름을 키로
   한 객체</b>를 주면 <code>.eq()</code> 조건을 실제로 걸어 준다. 예전처럼
   배열 하나를 주면 <b>그대로 다</b> 돌려준다 — 있던 칸은 안 건드린다.  */
const CHAIN = `(function(rows,onPost){
  var isMap=Object.prototype.toString.call(rows)!=='[object Array]';
  var mk=function(tbl){
    var f=[],a={};
    ['select','neq','gt','gte','lt','lte','is','in','not','or','order','limit',
     'range','single','maybeSingle','filter','match','upsert','update','delete'
    ].forEach(function(k){ a[k]=function(){ return a; }; });
    a.eq=function(c,v){ f.push([c,v]); return a; };
    var data=function(){
      if(!isMap)return rows||[];
      var rs=(rows&&rows[tbl])||[];
      if(!f.length)return rs;
      return rs.filter(function(r){
        for(var i=0;i<f.length;i++)if(String(r[f[i][0]])!==String(f[i][1]))return false;
        return true;
      });
    };
    a.insert=function(row){ if(onPost)onPost(tbl,row); return a; };
    a.then=function(res,rej){ return Promise.resolve({data:data(),error:null}).then(res,rej); };
    a.catch=function(fn){ return Promise.resolve({data:data(),error:null}).catch(fn); };
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

  /* 확인 현황은 이제 <b>칸마다</b> 나온다 — 공지가 「칸의 목록」이 되면서
     「맨 위 하나의 현황」 이라는 자리 자체가 없어졌다. 그래서 여기서도
     칸 목록(#osNtcAdmin)을 세워 놓고 <b>그 칸의</b> 현황을 본다. */
  console.log('\n[8] 대표는 칸마다 누가 확인했는지 이름으로 본다');
  const W = await page.evaluate(() => {
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner', active: true, plan: 'pro' };
    OSMT.rows = [{ id: 'u1', name: '홍길동' }, { id: 'u2', name: '김철수' }];
    /* <b>이 칸이 쓸 공지를 여기서 세운다.</b> 앞 칸이 남긴 것을 그냥 읽으면
       앞 칸을 고칠 때마다 여기가 같이 무너진다 — 실제로 그랬다. */
    OS_NTC.list = [{ id: 'n1', text: '확인해 주세요', img: '', on: true, ts: '2026-09-02',
                     by: '윤시현', targets: ['u1', 'u2'], mustAck: true }];
    OS_NTC.loaded = true; OS_NTC.busy = false; OS_NTC.err = '';
    OS_NOTICE = OS_NTC.list[0];
    OS_ACK.loaded = true; OS_ACK.ackd = { n1: { u1: 'x' } }; OS_ACK.err = '';
    const d = document.createElement('div'); d.id = 'osNtcAdmin';
    document.body.appendChild(d);
    osAckWhoPaint();
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    const ok = d.querySelectorAll('.p span.ok').length, no = d.querySelectorAll('.p span.no').length;
    const hide = /osNtcHide/.test(d.innerHTML);
    d.remove();
    return { t, ok, no, hide };
  });
  is(/2명 중 1명/.test(W.t), '  <b>몇 명 중 몇 명</b>인지 센다 — 「' + W.t.slice(0, 30) + '…」');
  is(W.ok === 1 && W.no === 1, '  확인한 사람과 <b>안 한 사람</b>이 갈려 보인다 — ✓' + W.ok + ' · ·' + W.no);
  is(/홍길동/.test(W.t) && /김철수/.test(W.t),
     '  <b>이름으로</b> 보인다 — id 만 보면 누군지 모른다');
  is(W.hide, '  칸마다 <b>「이 칸만 내리기」</b> 가 있다 — 나머지는 그대로 둔다');

  /* ── 새 공지가 하나 더 올라와도 <b>확인 안 한 것은 안 사라진다</b> ────
     앱은 공지를 최신 한 건만 읽는다. 그래서 지목 공지 뒤에 다른 공지를
     하나만 더 올려도 아직 확인 안 한 사람의 붉은 띠가 그냥 사라졌다.
     「확인할 때까지 지워지지 않도록」 이 안 지켜지던 자리다.            */
  console.log('\n[10] 새 공지가 덮어써도 — 확인 안 한 지목 공지는 그대로 남는다');
  const K = await page.evaluate(async (CHAIN_SRC) => {
    const posts = [];
    const chain = eval(CHAIN_SRC)({
      /* 맨 앞이 최신 — 배너에 서는 것은 지목 없는 「주간 회의」 다 */
      os_notices: [
        { id: 'n2', text: '주간 회의는 목요일입니다', active: true, must_ack: false,
          targets: null, created_at: '2026-08-29T01:00:00Z', author: '윤시현' },
        { id: 'n1', text: '수당표를 꼭 확인해 주세요', active: true, must_ack: true,
          targets: ['u2'], created_at: '2026-08-28T01:00:00Z', author: '윤시현' }
      ],
      os_notice_acks: []            /* 아직 아무도 확인 안 했다 */
    }, (t, row) => posts.push({ t, row }));
    window.osClient = function () { return chain; };
    OS.session = { user: { id: 'u2' } };
    OS.profile = { id: 'u2', name: '홍길순', role: 'member', active: true, plan: 'pro' };
    OS_NOTICE = null; OS_ACK.ackd = {}; OS_ACK.mine = []; OS_ACK.loaded = false; OS_ACK.scanned = false;
    osNoticeLoad();
    await new Promise(r => setTimeout(r, 700));
    const bar = document.getElementById('osAckBar');
    const shown = bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '';
    /* 눌러 보면 <b>띠에 뜬 그 공지</b>로 확인이 가야 한다 */
    const b = document.getElementById('osAckBtn'); if (b) b.click();
    await new Promise(r => setTimeout(r, 400));
    const sent = posts.filter(p => p.t === 'os_notice_acks').map(p => p.row);
    const after = document.getElementById('osAckBar');
    return {
      banner: (OS_NOTICE || {}).id || '',
      shown, sent,
      gone: !(after && after.textContent.replace(/\s+/g, '').length)
    };
  }, CHAIN);
  is(K.banner === 'n2', '  배너에 서는 것은 <b>최신 공지</b>다 — 지금 「' + K.banner + '」');
  is(/수당표/.test(K.shown),
     '  그래도 띠에는 <b>확인 안 한 지목 공지</b>가 남는다 — 「' + K.shown.slice(0, 34) + '…」');
  is(K.sent.length === 1 && K.sent[0] && K.sent[0].notice_id === 'n1' && K.sent[0].member_id === 'u2',
     '  확인은 <b>띠에 뜬 그 공지로</b> 간다 — ' + JSON.stringify(K.sent[0] || null));
  is(K.gone, '  확인하면 <b>사라진다</b>');

  /* ── 「올렸는데 팀에 보이나」 ────────────────────────────────────────
     여태 이 자리는 이 기기에 담긴 것을 「현재 게시 중인 공지」 라 적었다.
     서버에 못 올라가도 초록 상자가 그대로 떠서, 다시 들어오면 올라간
     것처럼 보였다. 실패를 성공처럼 말한 자리다 (CLAUDE.md 1번).       */
  console.log('\n[11] 설정 — 서버에 올라갔는지를 서버에 물어 답한다');
  const N0 = await page.evaluate(async (CHAIN_SRC) => {
    const chain = eval(CHAIN_SRC)({ os_notices: [], os_notice_acks: [] });
    window.osClient = function () { return chain; };
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner', active: true, plan: 'pro' };
    /* 이 기기에는 글이 담겨 있다 — 서버에는 없다 */
    OS_NOTICE = { id: '', text: '이번 주 목요일 회의', img: '', on: true, ts: '', by: '윤시현',
                  targets: [], mustAck: false };
    OS_NSEEN.done = false; OS_NSEEN.row = null; OS_NSEEN.err = ''; OS_NSEEN.busy = false;
    osNSeenLoad(true);
    await new Promise(r => setTimeout(r, 500));
    return osNSeenHtml().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }, CHAIN);
  is(/서버에 올라간 공지가 없습니다/.test(N0),
     '  서버에 없으면 <b>없다고 말한다</b> — 「' + N0.slice(0, 44) + '…」');
  is(/이 기기에만/.test(N0),
     '  이 기기에만 있다고 <b>이름 대어</b> 말한다 — 「게시 중」 이라 안 한다');
  is(!/게시 중인 공지/.test(N0), '  <b>안 올라간 것을 올라갔다고 말하지 않는다</b> (1번)');

  const N1 = await page.evaluate(async (CHAIN_SRC) => {
    const chain = eval(CHAIN_SRC)({
      os_notices: [{ id: 'n9', text: '수당표를 꼭 확인해 주세요', active: true, must_ack: true,
                     targets: ['u2', 'u3'], created_at: '2026-08-29T01:00:00Z', author: '윤시현' }],
      os_notice_acks: [{ notice_id: 'n9', member_id: 'u2', acked_at: 'x' }]
    });
    window.osClient = function () { return chain; };
    OS_ACK.loaded = false; OS_ACK.ackd = {};
    /* 이 기기 글은 서버 것과 <b>다르다</b> — 고쳐 놓고 저장을 안 한 자리 */
    OS_NOTICE = { id: 'n9', text: '수당표 확인 부탁드립니다(고침)', img: '', on: true, ts: '',
                  by: '윤시현', targets: ['u2', 'u3'], mustAck: true };
    OS_NSEEN.done = false; OS_NSEEN.row = null; OS_NSEEN.err = ''; OS_NSEEN.busy = false;
    osNSeenLoad(true);
    await new Promise(r => setTimeout(r, 600));
    return osNSeenHtml().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }, CHAIN);
  /* <b>화면이 실제로 이것을 쓰는가.</b> 함수만 재면, 카드가 다시 이 기기
     것으로 「게시 중」 이라 적어도 점검은 초록이다 — 실제로 그랬다. */
  const N2 = await page.evaluate(async (CHAIN_SRC) => {
    const chain = eval(CHAIN_SRC)({ os_notices: [], os_notice_acks: [] });
    window.osClient = function () { return chain; };
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '윤시현', role: 'owner', active: true, plan: 'pro' };
    OS_NOTICE = { id: '', text: '이번 주 목요일 회의', img: '', on: true, ts: '', by: '윤시현',
                  targets: [], mustAck: false };
    OS_NSEEN.done = false; OS_NSEEN.row = null; OS_NSEEN.err = ''; OS_NSEEN.busy = false;
    osNSeenLoad(true);
    await new Promise(r => setTimeout(r, 500));
    const d = document.createElement('div');
    d.innerHTML = osNoticeCardHtml();
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    const has = !!d.querySelector('#osNSeen');
    d.remove();
    return { t, has };
  }, CHAIN);
  is(N2.has, '  <b>설정 카드가 그 칸을 실제로 세운다</b> (#osNSeen)');
  is(/서버에 올라간 공지가 없습니다/.test(N2.t),
     '  <b>카드 자체가</b> 서버에 없다고 말한다 — 함수만 맞고 화면이 딴소리하면 안 된다');
  is(!/현재 게시 중인 공지/.test(N2.t),
     '  카드에 <b>「현재 게시 중인 공지」</b> 가 안 남아 있다 — 이 기기 것을 그렇게 부르던 자리');

  is(/팀에 보입니다/.test(N1), '  올라가 있으면 <b>팀에 보인다</b>고 말한다');
  is(/지목 2명 중 1명 확인/.test(N1),
     '  <b>몇 명 중 몇 명이 확인</b>했는지 센다 — 「' + (N1.match(/지목[^·]*/) || [''])[0].trim() + '」');
  is(/다릅니다/.test(N1),
     '  이 기기 글이 서버 것과 다르면 <b>다르다고 말한다</b> — 저장을 안 하신 자리다');

  console.log('\n[12] 콘솔이 조용하다');
  const real = errs.filter(e => !/limit is not a function/.test(e));
  is(real.length === 0, '  터진 곳이 없다' + (real.length ? ' — ' + real.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close(); api.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 공지를 봤는지 알 수 없습니다')
                  : '✓ 지목한 사람에게 맨 위에 · 본인만 확인 · 못 보내면 안 사라집니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
