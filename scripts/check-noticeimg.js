/* <b>공지 사진 때문에 공지가 통째로 죽던 것</b>

   2026-09-18 서버에서 직접 재 본 값입니다.

     공지 18줄 · 사진 붙은 줄 14 · <b>사진 합계 76MB</b> · 가장 큰 한 줄 <b>12MB</b>
     그런데 <b>글은 다 합쳐 162바이트</b>

   홈을 열면 목록을 읽는데, 그때 사진(img)까지 같이 달라고 했습니다. 서버가
   다 못 보내고 <code>canceling statement due to statement timeout</code> 으로
   스스로 끊었고, 그러면 <b>162바이트짜리 글까지</b> 못 받아 공지가 아예
   안 떴습니다. 로그인 전, 아무것도 안 눌러도 그랬습니다.

   여기서 재는 것은 <b>결과</b>입니다 (CLAUDE.md 8번):

     [1] 목록을 읽을 때 <b>사진을 안 달라고 한다</b>
     [2] 사진만 있는 공지가 <b>안 사라진다</b> — 「모름」을 「없음」으로 적지 않는다 (1번)
     [3] 사진은 <b>그 칸이 눈에 들어올 때 한 줄씩</b> 받는다 (7번)
     [4] 받아 온 사진이 <b>그 자리에</b> 들어간다
     [5] 사진을 <b>못 받아도 글은 그대로</b> 선다 — 그리고 못 받았다고 말한다 (1번)
     [6] 담을 때 <b>줄인다</b> — 원본 그대로 박지 않는다
     [7] 다 합쳐 한도를 넘으면 <b>멈추고 말한다</b> — 몰래 빠뜨리지 않는다 (1번)
     [8] 이 기기에 담을 때 <b>사진은 안 담는다</b> — 12MB 가 localStorage 를 넘긴다  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8871;
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

/* 흉내 서버 — <b>무슨 칸을 달라고 했는지</b>까지 적어 둔다. 그게 이 점검의 전부다.
   eq 는 실제로 거른다 — 안 거르면 「한 줄만 받았다」를 잴 수 없다. */
const STUB = `
window.__sel = [];    /* {tbl, cols, where} — 무엇을 달라고 했나 */
window.__fail = {};
window.supabase = { createClient: function () {
  var mk = function (tbl) {
    var q = {}, w = [], cols = '';
    ['order','limit','neq','gte','lte','gt','lt','is','not','or','filter',
     'range','single','maybeSingle','match','ilike','like'].forEach(function (m) {
      q[m] = function () { return q; };
    });
    q.select = function (c) { cols = c || ''; window.__sel.push({ tbl: tbl, cols: cols, where: w.slice() }); return q; };
    q.eq = function (c, v) { w.push(c + '=' + v);
      /* select 가 먼저 불렸으면 그 기록에도 붙여 준다 */
      var last = window.__sel[window.__sel.length - 1];
      if (last && last.tbl === tbl) last.where = w.slice();
      return q; };
    q['in'] = function () { return q; };
    q.then = function (res) {
      if (window.__fail[tbl]) return Promise.resolve({ data: null, error: { message: window.__fail[tbl] } }).then(res);
      var d = (window.__rows && window.__rows[tbl]) || [];
      d = d.filter(function (row) {
        return w.every(function (f) { var kv = f.split('='); return String(row[kv[0]]) === kv[1]; });
      });
      /* <b>달라고 한 칸만</b> 돌려준다 — 서버가 그러듯이. 이래야 목록 읽기에
         사진이 안 딸려 오는 것이 실제로 확인된다. */
      var want = String(cols).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (want.length) d = d.map(function (row) {
        var o = {}; want.forEach(function (k) { if (k in row) o[k] = row[k]; }); return o; });
      return Promise.resolve({ data: d, error: null }).then(res);
    };
    q.insert = function (r) { return { then: function (res) { return Promise.resolve({ data: [r], error: null }).then(res); } }; };
    q.update = function () { return { eq: function () { return { then: function (res) { return Promise.resolve({ data: [], error: null }).then(res); } }; } }; };
    q.upsert = function (r) { return { select: function () { return q; }, then: function (res) { return Promise.resolve({ data: [r], error: null }).then(res); } }; };
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

/* 실제 자료를 닮게 — <b>글은 짧고 사진은 크다.</b> 그리고 <b>글 없이 사진만</b>
   있는 줄이 섞여 있다 (실제로 18줄 중 14줄이 그렇다). */
const BIG = 'data:image/jpeg;base64,' + 'A'.repeat(300000);
const SEED = `
  OS.session = { user: { id: 'u2', email: 'k@t' } };
  OS.profile = { id: 'u2', name: '홍길동', role: 'owner', active: true, plan: 'vip' };
  OSMT.rows = [{ id: 'u2', name: '홍길동' }];
  window.__rows = {
    os_notices: [
      { id: 'n1', text: '', img: ${JSON.stringify(BIG)}, active: true,
        created_at: '2026-09-17', author: '홍길동', targets: [], must_ack: false },
      { id: 'n2', text: '수당표를 확인해 주세요', img: ${JSON.stringify(BIG)}, active: true,
        created_at: '2026-09-16', author: '홍길동', targets: [], must_ack: false },
      { id: 'n3', text: '이번 주 회식은 목요일입니다', img: '', active: true,
        created_at: '2026-09-15', author: '홍길동', targets: [], must_ack: false }
    ],
    os_notice_acks: []
  };
  window.toast = function (m) { (window.__toast = window.__toast || []).push('' + m); };
  if (!document.getElementById('osNoticeHome')) {
    var d = document.createElement('div'); d.id = 'osNoticeHome'; document.body.appendChild(d);
  }
  window.__sel = [];
  osNoticeLoad(true);`;

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
    typeof osNoticeHomeHtml === 'function' && typeof osNtcShown === 'function' &&
    typeof osNtcImgGet === 'function' && typeof osNtcShrink === 'function');
  if (!booted) {
    console.log('✗ 앱이 뜨지 않았거나 사진을 따로 받는 곳이 없습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }
  await page.evaluate(SEED);
  await page.waitForTimeout(600);

  /* ── [1] 목록을 읽을 때 사진을 안 달라고 한다 ── */
  console.log('\n[1] 목록을 읽을 때 <b>사진을 안 달라고 한다</b>');
  const A = await page.evaluate(() => {
    const list = window.__sel.filter(s => s.tbl === 'os_notices' && !(s.where || []).length);
    return { cols: list.map(s => s.cols), n: list.length };
  });
  is(A.n > 0, '  공지 목록을 실제로 읽었다 (' + A.n + '번)');
  is(A.cols.every(c => !/\bimg\b/.test(c)),
     '  목록 읽기에 <b>img 가 없다</b> — ' + (A.cols[0] || '(못 읽음)'));

  /* ── [2] 사진만 있는 공지가 안 사라진다 ── */
  console.log('\n[2] 사진만 있는 공지가 <b>안 사라진다</b> — 「모름」을 「없음」으로 적지 않는다 (1번)');
  const B = await page.evaluate(() => {
    /* 재는 순간을 <b>못 박는다</b>. 앱은 이미 눈에 보이는 첫 칸을 받아 두었을
       수 있어, 안 맞추면 「2자리」와 「3자리」가 돌 때마다 갈린다 — 그런 점검은
       사람이 안 믿는다 (8번). 도로 「아직 안 물어본」 상태로 두고 잰다. */
    window.OS_NIMG = {};
    (OS_NTC.list || []).forEach(n => { n.img = ''; });
    if (window.OS_NOTICE) OS_NOTICE.img = '';
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    return { shown: osNtcShown().length, items: d.querySelectorAll('.ntc-item').length,
             hold: d.querySelectorAll('[data-ntc-img]').length,
             t: d.textContent.replace(/\s+/g, ' ') };
  });
  is(B.shown === 3, '  세 칸이 다 산다 — ' + B.shown + '칸 (글 없는 n1 이 안 지워졌다)');
  is(B.items === 3, '  화면에도 <b>세 칸</b>이 선다 — ' + B.items + '칸');
  is(B.hold === 3, '  <b>세 칸 다</b> 사진 올 자리를 잡아 두었다 — ' + B.hold + '자리 ' +
     '(안 물어본 칸을 「사진 없음」으로 단정하지 않는다)');
  is(/불러오는 중/.test(B.t), '  「사진 불러오는 중」 이라고 <b>적는다</b> — 빈 칸으로 두지 않는다');

  /* ── [3] 사진은 그 칸이 눈에 들어올 때 한 줄씩 ── */
  console.log('\n[3] 사진은 <b>한 줄씩 따로</b> 받는다 (7번)');
  /* 앞 단계가 이미 받아 둔 것을 물려받으면 「0번 불렀다」가 되어 <b>무엇을
     쟀는지 알 수 없다</b>. 도로 「아직 모름」으로 돌려놓고 잰다. */
  await page.evaluate(() => {
    window.OS_NIMG = {};
    (OS_NTC.list || []).forEach(n => { n.img = ''; });
    if (window.OS_NOTICE) OS_NOTICE.img = '';
    window.__sel = [];
    document.getElementById('osNoticeHome').innerHTML = osNoticeHomeHtml();
    osNtcImgWatch();
  });
  await page.waitForTimeout(500);
  /* 사진은 <b>눈에 들어온 것부터</b> 받는다 (7번). 그래서 화면 아래 칸은
     사장님이 <b>내려 봐야</b> 받는다 — 그게 이 고침의 핵심이다. 시험도 그렇게
     한다: 남은 자리를 하나씩 눈앞으로 끌어다 놓는다. */
  for (let i = 0; i < 6; i++) {
    const left = await page.evaluate(() => {
      const e = document.querySelector('[data-ntc-img]');
      if (e) e.scrollIntoView({ block: 'center' });
      return document.querySelectorAll('[data-ntc-img]').length;
    });
    if (!left) break;
    await page.waitForTimeout(450);
  }
  const C = await page.evaluate(() => {
    const one = window.__sel.filter(s => s.tbl === 'os_notices' && (s.where || []).length);
    const ids = one.map(s => (s.where || []).join('&'));
    return { n: one.length, cols: one.map(s => s.cols), where: ids,
             uniq: ids.filter((v, i) => ids.indexOf(v) === i).length };
  });
  is(C.n > 0, '  사진을 <b>따로</b> 받으러 갔다 (' + C.n + '번)');
  is(C.cols.every(c => c === 'img'), '  받아 온 것은 <b>img 한 칸뿐</b> — ' + C.cols.join(' · '));
  is(C.where.every(w => /^id=/.test(w)), '  <b>그 줄 하나만</b> 짚어서 받는다 — ' + C.where.join(' · '));
  is(C.n === 3, '  내려 보면 <b>세 칸 다</b> 받는다 — ' + C.n + '번');
  is(C.uniq === C.n, '  같은 칸을 <b>두 번 부르지 않는다</b> — ' + C.n + '번 중 다른 것 ' + C.uniq + '개 (7번)');

  /* ── [4] 받아 온 사진이 그 자리에 들어간다 ── */
  console.log('\n[4] 받아 온 사진이 <b>그 자리에</b> 들어간다');
  const D = await page.evaluate(() => {
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    return { imgs: d.querySelectorAll('.ntc-item img').length,
             hold: d.querySelectorAll('[data-ntc-img]').length,
             t: d.textContent.replace(/\s+/g, ' ') };
  });
  is(D.imgs === 2, '  사진 <b>두 장</b>이 실제로 걸렸다 — ' + D.imgs + '장');
  is(D.hold === 0, '  기다리는 자리는 <b>다 사라졌다</b> — ' + D.hold + '자리 ' +
     '(물어봤더니 없던 칸도 자리를 비운다)');
  is(/수당표/.test(D.t) && /회식/.test(D.t), '  글도 그대로 있다');

  /* ── [5] 못 받아도 글은 그대로 ── */
  console.log('\n[5] 사진을 <b>못 받아도 글은 그대로</b> 선다 (1번)');
  const E = await page.evaluate(async () => {
    window.__fail.os_notices = 'canceling statement due to statement timeout';
    /* <b>받아 둔 사진까지</b> 도로 비운다 — 안 그러면 이미 걸린 사진이 보여서
       「못 받았다」를 잴 수가 없다 */
    window.OS_NIMG = {};
    (OS_NTC.list || []).forEach(n => { n.img = ''; });
    if (window.OS_NOTICE) OS_NOTICE.img = '';
    const d = document.getElementById('osNoticeHome');
    d.innerHTML = osNoticeHomeHtml();
    osNtcImgWatch();
    await new Promise(r => setTimeout(r, 600));
    d.innerHTML = osNoticeHomeHtml();
    const t = d.textContent.replace(/\s+/g, ' ');
    window.__fail.os_notices = '';
    return { t: t, items: d.querySelectorAll('.ntc-item').length };
  });
  is(E.items === 3, '  칸은 <b>그대로 셋</b> — ' + E.items + '칸');
  is(/수당표/.test(E.t) && /회식/.test(E.t), '  <b>글은 그대로</b> 보인다 — 사진 때문에 글까지 죽지 않는다');
  is(/못 받았습니다/.test(E.t), '  <b>못 받았다고 말한다</b> — 없는 척하지 않는다');
  is(/다시 받기/.test(E.t), '  <b>다시 받기</b>를 내어 준다');

  /* ── [6] 담을 때 줄인다 ── */
  console.log('\n[6] 담을 때 <b>줄인다</b> — 원본 그대로 박지 않는다');
  const F = await page.evaluate(async () => {
    /* 3000×2000 짜리 한 장을 만든다 — 줄이기 전에는 아주 크다 */
    /* <b>사진처럼</b> 만든다. 단색 네모만 그리면 PNG 가 너무 잘 줄어들어
       원본이 한도에도 못 미치고, 그러면 이 시험이 아무것도 안 잰다. */
    const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 1600;
    const cx = cv.getContext('2d');
    const im0 = cx.createImageData(2400, 1600), px = im0.data;
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let y = 0; y < 1600; y++) for (let x = 0; x < 2400; x++) {
      const i = (y * 2400 + x) * 4, g = (x / 2400) * 200 + (y / 1600) * 55;
      px[i] = g + rnd() * 50; px[i + 1] = (255 - g) + rnd() * 50; px[i + 2] = 120 + rnd() * 90; px[i + 3] = 255;
    }
    cx.putImageData(im0, 0, 0);
    const raw = cv.toDataURL('image/png');
    const blob = await (await fetch(raw)).blob();
    const file = new File([blob], '큰사진.png', { type: 'image/png' });
    const out = await new Promise(res => osNtcShrink(file, s => res({ ok: 1, s: s }), m => res({ ok: 0, m: m })));
    if (!out.ok) return { err: out.m };
    const im = new Image(); im.src = out.s;
    await new Promise(r => { im.onload = r; im.onerror = r; });
    return { rawLen: raw.length, len: out.s.length, w: im.naturalWidth, h: im.naturalHeight,
             sw: cv.width, sh: cv.height,
             one: window.OS_NIMG_ONE, side: window.OS_NIMG_SIDE };
  });
  is(!F.err, '  줄이기가 실제로 돌았다' + (F.err ? ' — ' + F.err : ''));
  if (!F.err) {
    is(F.w <= F.side && F.h <= F.side,
       '  긴 변이 <b>' + F.side + 'px 이하</b>로 줄었다 — ' + F.sw + '×' + F.sh + ' → ' + F.w + '×' + F.h);
    is(F.len <= F.one,
       '  한 장이 <b>' + Math.round(F.one / 1024) + 'KB 이하</b>가 됐다 — ' +
       Math.round(F.rawLen / 1024) + 'KB → ' + Math.round(F.len / 1024) + 'KB');
    is(F.rawLen > F.one,
       '  견본이 <b>한 장 한도보다 크다</b> — 안 그러면 이 시험이 아무것도 안 잰다 (' +
       Math.round(F.rawLen / 1024) + 'KB > ' + Math.round(F.one / 1024) + 'KB)');
    is(F.len < F.rawLen, '  <b>원본보다 작다</b> — 손 안 댄 채 넣지 않는다');
  }

  /* ── [7] 다 합쳐 한도를 넘으면 멈추고 말한다 ── */
  console.log('\n[7] 다 합쳐 넘으면 <b>멈추고 말한다</b> (1번)');
  const G = await page.evaluate(() => {
    return { all: window.OS_NIMG_ALL, one: window.OS_NIMG_ONE,
             hasBytes: typeof osNtcImgBytes === 'function' };
  });
  is(G.hasBytes, '  <b>합계를 세는 곳</b>이 있다 — 한 장씩만 재면 다섯 장이 통째로 들어간다');
  is(G.all > 0 && G.all <= 2 * 1024 * 1024,
     '  합계 한도가 <b>' + Math.round(G.all / 1024) + 'KB</b> 다');
  is(G.one > 0 && G.one < G.all, '  한 장 한도(' + Math.round(G.one / 1024) + 'KB)가 합계보다 작다');
  const H = await page.evaluate(async () => {
    window.OS_NOTICE_IMGS = [];
    /* 한 장 한도만큼 찬 것을 미리 쌓아 두고, 한 장 더 담아 본다 */
    const pad = 'data:image/jpeg;base64,' + 'A'.repeat(window.OS_NIMG_ALL - 1000);
    window.OS_NOTICE_IMGS.push({ s: pad, c: '' });
    window.__toast = [];
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600;
    const cx = cv.getContext('2d'); cx.fillStyle = '#123'; cx.fillRect(0, 0, 800, 600);
    const blob = await (await fetch(cv.toDataURL('image/png'))).blob();
    const file = new File([blob], '한장더.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(file);
    osNoticeImgFile({ files: dt.files });
    await new Promise(r => setTimeout(r, 900));
    return { n: window.OS_NOTICE_IMGS.length, toast: (window.__toast || []).join(' | ') };
  });
  is(H.n === 1, '  한도를 넘는 장은 <b>안 담는다</b> — ' + H.n + '장');
  is(/못 담았습니다/.test(H.toast) && /넘어/.test(H.toast),
     '  <b>무엇이 왜 안 들어갔는지 말한다</b> — ' + (H.toast || '(아무 말도 안 했다)'));

  /* ── [8] 이 기기에 담을 때 사진은 안 담는다 ── */
  console.log('\n[8] 이 기기에 담을 때 <b>사진은 안 담는다</b>');
  const I = await page.evaluate(() => {
    const big = 'data:image/jpeg;base64,' + 'A'.repeat(200000);
    osNoticeLocalSet({ id: 'n9', text: '글은 담긴다', img: big, on: true });
    const s = localStorage.getItem('apex_notice') || '';
    return { len: s.length, hasImg: s.indexOf('AAAAAAAAAA') >= 0, hasText: /글은 담긴다/.test(s) };
  });
  is(!I.hasImg, '  담긴 것에 <b>사진이 없다</b> — ' + I.len + '자');
  is(I.hasText, '  <b>글은 담긴다</b> — 서버를 못 읽어도 보여 줄 것이 남는다');
  is(I.len < 5000, '  담긴 것이 <b>작다</b> — localStorage 자리를 안 넘긴다 (' + I.len + '자)');

  console.log('\n[9] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '자리' : '✓ 공지 사진 — 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
