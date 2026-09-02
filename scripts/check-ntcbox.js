/* <b>공지는 「칸」의 목록이다 — 하나씩 쌓고, 칸마다 담당자와 확인이 붙는다.</b>

   여태 공지는 <b>한 벌</b>이었습니다. 새로 올리면 앞의 것이 그냥 밀려나서
   「이건 살려 두고 저것만 하나 더」 가 안 됐습니다. 사장님 말씀 그대로
   — 「칸 하나씩 추가할 수 있도록, 담당자 지정하고 확인되도록」.

   여기서 재는 것은 <b>결과</b>입니다 (CLAUDE.md 8번):

     [1] 여러 칸이 <b>동시에</b> 화면에 선다 — 새 칸이 앞 칸을 안 지운다
     [2] 칸마다 <b>담당자</b>가 이름으로 보이고, 누가 찍었는지 갈려 보인다
     [3] <b>담당자 본인에게만</b> 확인 단추가 선다 — 남의 것은 못 찍는다
     [4] 확인은 <b>그 칸으로</b> 간다 — 옆 칸에 찍히면 안 된다
     [5] 서버에 못 보내면 <b>확인한 척하지 않는다</b> (1번)
     [6] 「이 칸만 내리기」 는 <b>그 칸만</b> 내린다 (update · 새 줄을 안 쌓는다)
     [7] 올린 뒤 쓰던 칸이 <b>비워진다</b> — 안 비우면 같은 공지가 두 칸이 된다
     [8] 칸이 열둘이어도 서버는 <b>두 번</b>만 부른다 (7번)
     [9] 이름을 아직 못 받았으면 <b>지어내지 않는다</b> (1번)                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8853;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
}).listen(PORT);

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 흉내 서버 — 무엇이 오는지 그대로 적어 둔다. 어떤 사슬이 와도 받아야 한다.
   <b>eq · in 은 실제로 거른다.</b> 안 걸러 주면 「u1 이 찍은 기록」 이 u2 것으로
   읽혀, 앱이 멀쩡한데 점검만 빨간불이 된다 — 헛알람이다 (8번). */
const STUB = `
window.__calls = []; window.__wrote = []; window.__fail = {};
window.supabase = { createClient: function () {
  var mk = function (tbl) {
    var q = {}, w = [];
    ['select','order','limit','neq','gte','lte','gt','lt','is','not','or','filter',
     'range','single','maybeSingle','match','ilike','like'].forEach(function (m) {
      q[m] = function () {
        if (m === 'select') { window.__calls.push(tbl + '.select'); }
        return q; };
    });
    q.eq = function (c, v) { w.push({ c: c, v: v, many: false }); return q; };
    q['in'] = function (c, a) { w.push({ c: c, v: a, many: true }); return q; };
    q.then = function (res) {
      var d = (window.__rows && window.__rows[tbl]) || [];
      d = d.filter(function (row) {
        return w.every(function (f) {
          return f.many ? (f.v || []).indexOf(row[f.c]) >= 0 : row[f.c] === f.v;
        });
      });
      if (window.__fail[tbl]) return Promise.resolve({ data: null, error: { message: window.__fail[tbl] } }).then(res);
      return Promise.resolve({ data: d, error: null }).then(res);
    };
    q.insert = function (r) {
      window.__wrote.push({ tbl: tbl, op: 'insert', row: r });
      return { then: function (res) {
        if (window.__fail[tbl]) return Promise.resolve({ data: null, error: { message: window.__fail[tbl] } }).then(res);
        return Promise.resolve({ data: [r], error: null }).then(res); } };
    };
    q.update = function (r) {
      var u = { tbl: tbl, op: 'update', row: r, where: null };
      window.__wrote.push(u);
      return { eq: function (c, v) { u.where = c + '=' + v;
        return { then: function (res) {
          if (window.__fail[tbl]) return Promise.resolve({ data: null, error: { message: window.__fail[tbl] } }).then(res);
          return Promise.resolve({ data: [], error: null }).then(res); } }; } };
    };
    q.upsert = function (r) { window.__wrote.push({ tbl: tbl, op: 'upsert', row: r });
      return { select: function () { return q; }, then: function (res) { return Promise.resolve({ data: [r], error: null }).then(res); } }; };
    q['delete'] = function () { return { eq: function () { return { then: function (res) { return Promise.resolve({ data: [], error: null }).then(res); } }; } }; };
    return q;
  };
  return { from: mk, rpc: function () { return Promise.resolve({ data: null, error: null }); },
    storage: { from: function () { return { upload: function () { return Promise.resolve({ data: null, error: null }); },
      getPublicUrl: function () { return { data: { publicUrl: '' } }; } }; } },
    auth: { getSession: function () { return Promise.resolve({ data: { session: { user: { id: 'u2', email: 'k@t' } } } }); },
      getUser: function () { return Promise.resolve({ data: { user: { id: 'u2' } } }); },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
      signOut: function () { return Promise.resolve({}); } } };
} };`;

/* 세 칸 — ①담당자 둘(내가 포함, 아직 미확인) ②담당자 없음 ③담당자 하나(남).
   <b>서버에 그대로 놓고 앱이 읽게 한다.</b> 앱 안 변수에 직접 꽂아 두면
   앱이 제 손으로 다시 읽는 순간 지워져, 무엇을 쟀는지 알 수 없게 된다. */
const SEED = `
  OS.session = { user: { id: 'u2', email: 'k@t' } };
  OS.profile = { id: 'u2', name: '김철수', role: 'owner', active: true, plan: 'vip' };
  OSMT.rows = [{ id: 'u1', name: '홍길동' }, { id: 'u2', name: '김철수' }];
  window.__rows = {
    os_notices: [
      { id: 'n1', text: '수당표를 확인해 주세요', img: '', active: true,
        created_at: '2026-09-02', author: '윤시현', targets: ['u1','u2'], must_ack: true },
      { id: 'n2', text: '이번 주 회식은 목요일입니다', img: '', active: true,
        created_at: '2026-09-01', author: '윤시현', targets: [], must_ack: false },
      { id: 'n3', text: '보장분석 자료 정리 부탁드립니다', img: '', active: true,
        created_at: '2026-08-31', author: '윤시현', targets: ['u1'], must_ack: true }
    ],
    os_notice_acks: [ { notice_id: 'n1', member_id: 'u1', acked_at: '2026-09-02' } ]
  };
  window.toast = function () {};
  if (!document.getElementById('osNoticeHome')) {
    var d = document.createElement('div'); d.id = 'osNoticeHome'; document.body.appendChild(d);
  }
  osNoticeLoad();`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.route('**://**', r =>
    r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home',
    { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2400);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  const booted = await page.evaluate(() =>
    typeof osNoticeHomeHtml === 'function' && typeof osNtcShown === 'function');
  if (!booted) {
    console.log('✗ 앱이 뜨지 않았습니다.'); errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }
  await page.evaluate(SEED);
  await page.waitForTimeout(500);

  /* ── 1) 칸이 여럿이 동시에 선다 ── */
  console.log('\n[1] 칸을 하나씩 쌓는다 — 새 칸이 앞 칸을 안 지운다');
  const A = await page.evaluate(() => {
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    const items = d.querySelectorAll('.ntc-item');
    const t = d.textContent.replace(/\s+/g, ' ');
    return { n: items.length, shown: osNtcShown().length, t: t,
             nos: [].slice.call(d.querySelectorAll('.ntc-no')).map(e => e.textContent) };
  });
  is(A.shown === 3, '  칸이 <b>세 개</b> 다 산다 — ' + A.shown + '개');
  is(A.n === 3, '  화면에도 <b>세 칸</b>이 선다 — ' + A.n + '칸');
  is(/수당표/.test(A.t) && /회식/.test(A.t) && /보장분석 자료/.test(A.t),
     '  <b>세 칸의 글이 다 보인다</b> — 최신 것 하나만 보이지 않는다');
  is(A.nos.join(',') === '1,2,3', '  칸마다 <b>번호</b>가 붙는다 — ' + A.nos.join(' · '));

  /* ── 2) 칸마다 담당자와 확인 현황 ── */
  console.log('\n[2] 칸마다 담당자가 이름으로 보인다');
  const B = await page.evaluate(() => {
    const d = document.getElementById('osNoticeHome');
    const it = d.querySelectorAll('.ntc-item');
    /* 칸이 줄어 있으면 <b>터지지 말고</b> 빈 값으로 답한다 — 점검이 죽으면
       무엇이 어긋났는지 못 읽는다 */
    const one = it[0] || document.createElement('div');
    const two = it[1] || document.createElement('div');
    return {
      oneT: one.textContent.replace(/\s+/g, ' '),
      oneOk: one.querySelectorAll('.ntc-who .p span.ok').length,
      oneNo: one.querySelectorAll('.ntc-who .p span.no').length,
      twoWho: two.querySelectorAll('.ntc-who').length,
      tags: d.querySelectorAll('.ntc-tag').length
    };
  });
  is(/홍길동/.test(B.oneT) && /김철수/.test(B.oneT),
     '  담당자가 <b>이름으로</b> 보인다 — id 만 보면 누군지 모른다');
  is(B.oneOk === 1 && B.oneNo === 1,
     '  <b>찍은 사람과 안 찍은 사람</b>이 갈려 보인다 — ✓' + B.oneOk + ' · ·' + B.oneNo);
  is(/2명.*중.*1명/.test(B.oneT), '  <b>몇 명 중 몇 명</b>인지 센다');
  is(B.twoWho === 0, '  담당자 없는 칸에는 <b>확인 줄이 안 붙는다</b> — 그냥 알림이다');
  is(B.tags === 2, '  담당자 있는 칸에만 <b>「확인 요청」</b> 딱지가 붙는다 (' + B.tags + '칸)');

  /* ── 3) 확인 단추는 <b>본인에게만</b> ── */
  console.log('\n[3] 확인 단추는 담당자 본인에게만 선다');
  const C = await page.evaluate(() => {
    const it = document.getElementById('osNoticeHome').querySelectorAll('.ntc-item');
    const g = i => it[i] || document.createElement('div');
    return { n: it.length,
             mine: !!g(0).querySelector('.ntc-ack'),      /* n1 = 내가 담당, 미확인 */
             none: !!g(1).querySelector('.ntc-ack'),      /* n2 = 담당자 없음 */
             other: !!g(2).querySelector('.ntc-ack'),     /* n3 = 남이 담당 */
             ask: g(0).classList.contains('ask') };
  });
  is(C.mine, '  내가 담당인 칸에는 <b>「확인했습니다」</b> 가 선다');
  is(!C.none, '  담당자 없는 칸에는 <b>안 선다</b>');
  is(C.n === 3 && !C.other, '  <b>남이 담당인 칸에는 안 선다</b> — 대신 눌러 줄 수 없다' +
     (C.n !== 3 ? ' ← 칸이 ' + C.n + '개뿐이라 볼 수가 없습니다' : ''));
  is(C.ask, '  아직 안 찍은 내 칸은 <b>눈에 띄게</b> 표시된다');

  /* ── 4) 확인은 <b>그 칸으로</b> 간다 ── */
  console.log('\n[4] 확인이 그 칸으로 간다 — 옆 칸에 안 찍힌다');
  const D = await page.evaluate(async () => {
    window.__wrote = [];
    osNtcAck('n1');
    await new Promise(r => setTimeout(r, 220));
    const w = window.__wrote.filter(x => x.tbl === 'os_notice_acks');
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    const it = d.querySelectorAll('.ntc-item');
    const one = it[0] || document.createElement('div');
    return { w: w, still: !!one.querySelector('.ntc-ack'),
             done: /내가 확인함/.test(one.textContent),
             cnt: /2명.*중.*2명/.test(one.textContent.replace(/\s+/g, ' ')) };
  });
  is(D.w.length === 1 && D.w[0].row && D.w[0].row.notice_id === 'n1',
     '  <b>그 칸의 id</b> 로 간다 — ' + JSON.stringify((D.w[0] || {}).row || {}));
  is(D.w.length === 1 && D.w[0].row.member_id === 'u2',
     '  <b>자기 id</b> 만 보낸다 — 남의 확인을 못 찍는다 (서버 RLS 가 다시 막는다)');
  is(!D.still && D.done, '  찍고 나면 <b>「✓ 내가 확인함」</b> 으로 바뀐다');
  is(D.cnt, '  그 칸의 <b>센 수</b>가 올라간다 — 2명 중 2명');

  /* ── 5) 못 보내면 확인한 척하지 않는다 (1번) ── */
  console.log('\n[5] 서버에 못 보내면 확인한 척하지 않는다 (1번)');
  const E = await page.evaluate(async () => {
    OS_ACK.ackd = { n1: { u1: 'x' } }; OS_ACK.err = '';
    window.__fail['os_notice_acks'] = 'new row violates row-level security policy';
    osNtcAck('n1');
    await new Promise(r => setTimeout(r, 260));
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    const it = d.querySelectorAll('.ntc-item')[0] || document.createElement('div');
    window.__fail = {};
    return { still: !!it.querySelector('.ntc-ack'),
             err: OS_ACK.err, said: /못 보냈습니다/.test(it.textContent) };
  });
  is(E.still, '  단추가 <b>그대로 남는다</b> — 사라지면 찍힌 줄 아신다');
  is(/못 보냈습니다/.test(E.err || ''), '  <b>왜 안 됐는지 적는다</b> — 「' + (E.err || '').replace(/<[^>]*>/g, '').slice(0, 46) + '…」');
  is(E.said, '  그 <b>칸 안에서</b> 안 됐다고 말한다 — 다른 화면 가서 찾지 않게');

  /* ── 6) 「이 칸만 내리기」 ── */
  console.log('\n[6] 「이 칸만 내리기」 는 그 칸만 내린다');
  const F = await page.evaluate(async () => {
    window.__wrote = [];
    osNtcHide('n2');
    await new Promise(r => setTimeout(r, 240));
    const w = window.__wrote.filter(x => x.tbl === 'os_notices');
    return { w: w, ops: w.map(x => x.op) };
  });
  is(F.w.length === 1 && F.ops[0] === 'update',
     '  <b>그 줄을 고친다</b> — 새 줄을 쌓지 않는다 (' + (F.ops.join(',') || '없음') + ')');
  is(F.w.length === 1 && F.w[0].row && F.w[0].row.active === false,
     '  <b>active=false</b> 로 내린다');
  is(F.w.length === 1 && F.w[0].where === 'id=n2',
     '  <b>그 칸만</b> 짚어서 내린다 — ' + ((F.w[0] || {}).where || '어디도 안 짚음'));

  /* ── 7) 올린 뒤 쓰던 칸이 비워진다 ── */
  console.log('\n[7] 칸을 올리면 쓰던 자리가 비워진다');
  const G = await page.evaluate(() => {
    const d = document.createElement('div'); d.id = 'osNtcForm';
    d.innerHTML = '<textarea id="osNoticeText">앞에 쓰던 글</textarea>' +
      '<input type="checkbox" id="osNoticeActive">' +
      '<div id="osNoticeTargets"><div class="os-tg">' +
      '<label class="on"><input type="checkbox" value="u1" checked> 홍길동</label></div></div>' +
      '<div id="osNoticeImgPrev"></div>';
    document.body.appendChild(d);
    OS_NOTICE_IMGS = [{ s: 'data:image/png;base64,x', c: '' }];
    osNtcFormClear();
    const out = { txt: document.getElementById('osNoticeText').value,
                  imgs: OS_NOTICE_IMGS.length,
                  checked: document.querySelectorAll('#osNoticeTargets input:checked').length,
                  on: document.getElementById('osNoticeActive').checked };
    d.remove();
    return out;
  });
  is(G.txt === '', '  글칸이 <b>비워진다</b> — 안 비우면 같은 공지가 두 칸이 된다');
  is(G.imgs === 0, '  사진도 <b>비워진다</b>');
  is(G.checked === 0, '  담당자 표시가 <b>풀린다</b> — 앞 칸 담당자가 그대로 지목되면 안 된다');
  is(G.on === true, '  「지금 게시」 는 <b>켜진 채</b>로 시작한다');

  /* ── 8) 서버를 아껴 쓴다 (7번) ── */
  console.log('\n[8] 칸이 여럿이어도 서버는 두 번만 부른다 (7번)');
  const H = await page.evaluate(async () => {
    window.__calls = []; OS_ACK.loaded = false; OS_ACK.ackd = {};
    osAckLoad(null);
    await new Promise(r => setTimeout(r, 200));
    const first = window.__calls.filter(c => c === 'os_notice_acks.select').length;
    let i; for (i = 0; i < 6; i++) { osAckLoad(null); osNtcPaint(); }
    await new Promise(r => setTimeout(r, 200));
    const after = window.__calls.filter(c => c === 'os_notice_acks.select').length;
    return { first: first, after: after };
  });
  is(H.first === 1, '  칸 셋의 확인 기록을 <b>한 번에</b> 읽는다 — ' + H.first + '번');
  is(H.after === 1, '  여섯 번 더 그려도 <b>안 더 부른다</b> — ' + H.after + '번');

  /* ── 9) 이름을 모르면 지어내지 않는다 (1번) ── */
  console.log('\n[9] 이름을 아직 못 받았으면 지어내지 않는다 (1번)');
  const I = await page.evaluate(() => {
    const keep = OSMT.rows; OSMT.rows = [];
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    const t = d.textContent.replace(/\s+/g, ' ');
    OSMT.rows = keep; d.innerHTML = osNoticeHomeHtml();
    return { t: t, fake: /홍길동|김철수/.test(t), said: /이름 불러오는 중/.test(t),
             raw: /u1|u2/.test(t) };
  });
  is(!I.fake, '  없는 이름을 <b>안 만든다</b>');
  is(I.said, '  <b>「이름 불러오는 중」</b> 이라고 적는다 — 모름을 모름이라 말한다');
  is(!I.raw, '  <b>날 id</b> 를 대신 보여 주지 않는다 — 봐도 누군지 모른다');

  console.log('\n[10] 콘솔');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 공지 칸이 제대로 안 섭니다')
                  : '✓ 공지는 칸으로 쌓이고, 칸마다 담당자가 본인 손으로 확인합니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
