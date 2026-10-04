/* ══════════════════════════════════════════════════════════════════
   check-mstans.js — <b>보낸 뒤에 온 답을 적는 자리.</b>

   사장님 말씀 (2026-10-02) — <b>「보낸 뒤에 답도 적을 수 있게 만들어줘」</b>.
   여태 「✅ 보냈습니다」 를 누르면 <b>그 줄이 사라졌습니다</b>. 보낸 것은
   mstOf 가 건너뛰기 때문입니다 — 그래서 무슨 말이 돌아왔는지 적을 자리가
   아예 없었습니다. 「고객 365일 · 📆 계약 마디 접점」 에 <b>「💬 보냈습니다 —
   답을 적어 주십시오」</b> 토막을 세웠습니다.

   ── <b>어디에 담나</b> ────────────────────────────────────────────
   「보냈습니다」 가 이 기기(localStorage)이고 서버를 더 안 부릅니다 (7번).
   답은 <b>고객이 하신 말</b>이라 밖으로 안 내보내는 쪽이 맞습니다 (3번).
   그래서 같은 자리에 담되 <b>칸을 따로</b> 둡니다(보낸 표시에 섞으면 이미
   담긴 날짜 글이 깨집니다). ★ <b>폰과 PC 가 따로 센다는 것을 화면에
   적습니다</b> — 모르시면 「적었는데 없다」 가 됩니다 (1번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>보내기 전에는 답 자리가 없다</b> — 안 보낸 마디에 답을 묻는
         칸을 세우면 「보낸 줄 알았다」 가 됩니다
     [2] ★★ <b>보낸 뒤에 선다</b> — 보낸 수만큼 칸이 서고 손가락이 닿는다
     [3] ★★ <b>적으면 남는다</b> — 다시 읽어도 같고 화면에도 그대로 선다
     [4] ★★ <b>「답이 없었다」 와 「아직 안 적었다」 는 다르다</b> (1번) —
         안 적은 것은 <b>모르는 것</b>입니다. 둘을 한 칸에 담으면 셈이
         거짓이 됩니다
     [5] ★★ <b>글을 그대로 찍지 않는다</b> — 고객 말에 「&lt;」 가 섞여도
         글자로 보입니다
     [6] ★★ <b>고칠 길을 안 감춘다</b> (6번) — 적은 뒤에도 칸이 서 있고,
         적은 글이 그 칸에 들어 있고, 지우는 길이 있다
     [7] ★★ <b>홈과 고객 365일이 같은 수</b>를 말한다 (0-1번) — 이름표
         (data-ask="답적을마디")가 갈리면 그 자리에서 빨간불
     [8] ★★ <b>서버를 안 부른다</b> (7번) · <b>이 기기에만</b> 담긴다고
         화면에 적는다 (1번)
     [9] ★★ <b>오래된 것은 내려간다</b> — 90일이 지난 것은 이 자리에서
         내려가고, <b>언제 보냈는지 모르는 것은 안 세운다</b> (1번)
    [10] ★ <b>바구니 없는 답을 받아도 안 터진다</b> — 지난 판에 CI 가
         홈을 통째로 터뜨리는 같은 버그를 잡았습니다 (8번)
    [11] 길이 — 홈 카드가 안 불어나고, 한 번에 <b>다섯 줄</b>까지다

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>적어 두신 답이 맞는 말인가</b> 는 안 잽니다 — 그것은 고객이 하신
   말이고, 자는 <b>그 말이 그대로 남아 그대로 보이는가</b> 까지만 봅니다.
   ══════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8976;
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
const PIN = () => {
  const R = Date, base = new R('2026-10-02T09:00:00Z').getTime();
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
  window.setupDone = function () { return true; }; window.actLoad = function () {};
  window.__T = ''; window.toast = function (m) { window.__T = m; };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  /* 계약일을 넣습니다 — 넷째 분은 <b>계약일을 모르는 분</b>입니다 */
  OSC.list = [{ id: 'c1', name: '홍길동A', advisor_id: 'me' }, { id: 'c2', name: '홍길동B', advisor_id: 'me' },
              { id: 'c3', name: '홍길동C', advisor_id: 'me' }, { id: 'c4', name: '홍길동D', advisor_id: 'me' }];
  CM.loaded = true;
  CM.meta = { c1: { cd: '2026-09-05' }, c2: { cd: '2026-07-20' }, c3: { cd: '2025-10-10' }, c4: {} };
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = []; AR.calls = [];
  ACT.day = { '2026-10-02': { call: 1, cli: 0, rep: 0, chk: 0 } }; ACT.from = '2026-08-03';
  try { localStorage.removeItem('apex_mst_done'); localStorage.removeItem('apex_mst_ans'); } catch (e) {}
  go('home');
};
/* 보낸 표시와 적어 둔 답을 <b>손으로</b> 심습니다 — 서버는 안 부릅니다 */
const PUT = (done, ans) => {
  try {
    localStorage.setItem('apex_mst_done', JSON.stringify(done || {}));
    localStorage.setItem('apex_mst_ans', JSON.stringify(ans || {}));
  } catch (e) {}
};
const LOOK = () => {
  const L = (typeof mstDueList === 'function') ? mstDueList() : null;
  try { go('home'); } catch (e) {}
  const pane = document.getElementById('dynPane');
  const two = pane.querySelector('.hm-2col');
  const hc = two ? [].slice.call(two.children[1].children)
    .filter(e => (e.innerText || '').indexOf('이번 달 고객 관리') >= 0)[0] : null;
  return { L: L ? { sent: L.sent.length, ansNo: L.ansNo, monLeft: L.monLeft } : null,
           home: hc ? (hc.innerText || '').replace(/\s+/g, ' ').trim() : '',
           homeH: hc ? Math.round(hc.getBoundingClientRect().height) : 0,
           homeAsk: [].slice.call(pane.querySelectorAll('[data-ask="답적을마디"]'))
                      .map(e => (e.textContent || '').trim()) };
};
/* 고객 365일을 열어 <b>답 토막</b>을 봅니다 */
const OPEN = async () => {
  go('clients'); await new Promise(r => setTimeout(r, 650));
  const m = document.getElementById('mstCard');
  if (!m) return { no: '마디 카드가 없습니다' };
  const sep = [].slice.call(m.querySelectorAll('.mst-sep'))
    .map(e => (e.innerText || '').replace(/\s+/g, ' ').trim());
  const ans = sep.filter(t => t.indexOf('보냈습니다') >= 0)[0] || '';
  const ins = [].slice.call(m.querySelectorAll('input[id^=mstAnsIn_]'));
  return { sep: sep, ansSep: ans, nIn: ins.length,
           vals: ins.map(e => e.value),
           inH: ins.length ? Math.round(ins[0].getBoundingClientRect().height) : 0,
           btns: [].slice.call(m.querySelectorAll('.mst-b'))
             .map(e => (e.textContent || '').trim() + '/' + Math.round(e.getBoundingClientRect().height)),
           txt: (m.innerText || '').replace(/\s+/g, ' ').trim(),
           raw: m.innerHTML,
           ask: [].slice.call(m.querySelectorAll('[data-ask="답적을마디"]'))
                  .map(e => (e.textContent || '').trim()),
           h: Math.round(m.getBoundingClientRect().height) };
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
  await p.waitForFunction(() => typeof mstAnsRowHtml === 'function' && typeof mstDueList === 'function'
                             && typeof hmMadiSideHtml === 'function', { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(1800);
  const hits0 = hits;
  const put = (done, ans) => p.evaluate(({ done, ans, fn, src }) => {
    (0, eval)('(' + fn + ')')(done, ans);
    return (0, eval)('(' + src + ')')();
  }, { done, ans, fn: String(PUT), src: String(LOOK) });
  const open = () => p.evaluate(({ src }) => (0, eval)('(' + src + ')')(), { src: String(OPEN) });
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

  console.log('\n[1] ★★ <b>보내기 전에는 답 자리가 없다</b>');
  const pre = await put({}, {});
  is(pre.L && pre.L.sent === 0 && pre.L.ansNo === 0,
    '  보낸 것이 <b>0</b>이라 바구니도 비었다 — sent ' + (pre.L ? pre.L.sent : 'null'));
  const preO = await open();
  is(!preO.no && !preO.ansSep && preO.nIn === 0,
    '  ★★ <b>답 토막이 안 선다</b> — 칸 ' + (preO.nIn || 0) + '개 (세우면 「보낸 줄 알았다」 가 됩니다)');
  is(pre.homeAsk.length === 0,
    '  홈에도 <b>「답 적을 것」 이 안 적힌다</b> — 이름표 ' + pre.homeAsk.length + '개');

  console.log('\n[2] ★★ <b>보낸 뒤에 선다</b>');
  const D3 = { 'c1:1': '2026-10-02', 'c2:3': '2026-10-01', 'c3:12': '2026-09-28' };
  const s3 = await put(D3, {});
  is(s3.L && s3.L.sent === 3 && s3.L.ansNo === 3,
    '  보낸 <b>3건</b>이 다 서고 답은 <b>0건</b> 적혔다 — sent ' + (s3.L ? s3.L.sent : 'null')
      + ' · 안 적은 것 ' + (s3.L ? s3.L.ansNo : 'null'));
  const o3 = await open();
  is(!o3.no && o3.nIn === 3, '  ★★ 답 칸이 <b>3개</b> 선다 — ' + (o3.nIn || 0) + '개');
  is(o3.ansSep.indexOf('아직 3건') >= 0,
    '  토막 머리가 <b>「아직 3건」</b> 이라 적는다 — 「' + o3.ansSep + '」');
  is(o3.inH >= 44, '  ★ 적는 칸이 <b>' + o3.inH + 'px</b> — 44px 이상');
  const small = o3.btns.filter(x => +x.split('/')[1] < 44);
  is(small.length === 0, '  ★ 단추가 다 <b>44px 이상</b>이다'
    + (small.length ? (' ← ' + small.join(' / ')) : ' — ' + o3.btns.length + '개'));

  console.log('\n[3] ★★ <b>적으면 남는다</b>');
  const typed = await p.evaluate(async () => {
    const m = document.getElementById('mstCard');
    const ins = [].slice.call(m.querySelectorAll('input[id^=mstAnsIn_]'));
    ins[0].value = '<b>증권</b>은 받았는데 어디 뒀는지 모르겠다고 하셨습니다';
    const btn = [].slice.call(m.querySelectorAll('.mst-b.p'))
      .filter(e => (e.textContent || '').indexOf('답을 적어') >= 0)[0];
    btn.click(); await new Promise(r => setTimeout(r, 450));
    return { toast: window.__T, store: JSON.stringify(mstAnsAll()),
             of: JSON.stringify(mstAnsOf('c1', 1)) };
  });
  is(/증권/.test(typed.store) && /"k":"왔"/.test(typed.store),
    '  <b>담겼다</b> — ' + typed.store.slice(0, 80));
  is(typed.of !== 'null' && /증권/.test(typed.of),
    '  ★ <b>다시 읽어도 같다</b> (mstAnsOf) — ' + typed.of.slice(0, 60));
  const o4 = await open();
  is(o4.txt.indexOf('답이 왔습니다') >= 0 && o4.txt.indexOf('어디 뒀는지') >= 0,
    '  ★★ <b>화면에 그대로 선다</b>');
  is(o4.ansSep.indexOf('아직 2건') >= 0,
    '  ★ 안 적은 수가 <b>하나 줄었다</b> — 「' + o4.ansSep + '」');

  console.log('\n[4] ★★ <b>「답이 없었다」 와 「아직 안 적었다」 는 다르다</b> (1번)');
  is(o4.txt.indexOf('답을 아직 안 적었습니다') >= 0 && o4.txt.indexOf('모르는 것') >= 0,
    '  안 적은 줄은 <b>「아직 안 적었습니다 · 모르는 것입니다」</b> 라고 적는다');
  const none = await p.evaluate(async () => {
    const m = document.getElementById('mstCard');
    const btn = [].slice.call(m.querySelectorAll('.mst-b'))
      .filter(e => (e.textContent || '').indexOf('답이 없었습니다') >= 0)[0];
    btn.click(); await new Promise(r => setTimeout(r, 450));
    return { toast: window.__T, store: JSON.stringify(mstAnsAll()) };
  });
  const o5 = await open();
  is(/"k":"없"/.test(none.store), '  ★★ <b>「없었다」 를 따로 담는다</b> — 「안 적음」 과 다른 값입니다');
  is(o5.txt.indexOf('답이 없었습니다') >= 0,
    '  화면도 <b>「답이 없었습니다」</b> 라고 갈라 적는다');
  is(o5.ansSep.indexOf('아직 1건') >= 0,
    '  ★ 「없었다」 도 <b>적은 것</b>이라 안 적은 수에서 빠진다 — 「' + o5.ansSep + '」');
  const empty = await p.evaluate(() => JSON.stringify(mstAnsOf('c3', 12)));
  is(empty === 'null', '  ★★ 아무것도 안 적은 것은 <b>null</b> 이다 — 0 도 빈 글도 아닙니다');

  console.log('\n[5] ★★ <b>글을 그대로 찍지 않는다</b>');
  /* ⚠ ★★ <b>처음엔 카드 전체의 innerHTML 을 봤고, CI 에서만 울렸습니다.</b>
     줄 차례가 바뀌거나 다섯 줄에서 잘리면 그 글이 화면에 없을 수 있어,
     <b>재는 자리가 흔들렸습니다</b> — 제 손에서는 초록, CI 에서는 빨강.
     그래서 <b>그리는 함수를 바로 불러</b> 글 하나로 잽니다. 흔들릴 자리가
     없고, 울렸을 때 <b>무엇이 찍혔는지</b>도 적습니다 (8번).            */
  const esc = await p.evaluate(() => {
    mstAnsSet('cX', 1, '왔', '<b>증권</b>은 받았다고 하셨습니다');
    const row = { c: { id: 'cX', name: '홍길동X' }, sAt: '2026-10-02', gap: 0,
                  hit: { step: mstStep(1) }, ans: mstAnsOf('cX', 1) };
    const html = mstAnsRowHtml(row, 0);
    mstAnsSet('cX', 1, '지움');
    return { raw: /<b>증권<\/b>은 받았다/.test(html),
             esc: /&lt;b&gt;증권&lt;\/b&gt;은 받았다/.test(html),
             /* 울렸을 때 <b>무엇이 찍혔는지</b> — 마디 제목에도 「증권」 이 들어
                있어 그것이 먼저 잡혔습니다. 적은 글 쪽만 잘라 적습니다. */
             cut: (html.match(/(&lt;b&gt;|<b>증권<\/b>)[^<]{0,44}/) || ['못 찾음'])[0].slice(0, 60) };
  });
  is(!esc.raw && esc.esc,
    '  적으신 글이 <b>글자로</b> 보인다 — 날글이 들어가지 않습니다 (「' + esc.cut + '」)');

  console.log('\n[6] ★★ <b>고칠 길을 안 감춘다</b> (6번)');
  is(o5.nIn === 3, '  적은 뒤에도 칸이 <b>그대로 3개</b> 서 있다 — ' + o5.nIn + '개');
  /* ⚠ <b>첫 칸을 보면 안 됩니다.</b> 적은 줄은 <b>뒤로 내려갑니다</b>(적을 것이
     앞에 와야 하므로). 처음에 vals[0] 을 봤다가 울렸는데, 글은 멀쩡히
     다른 칸에 있었습니다 — 코드가 아니라 <b>제 셈</b>이 틀렸습니다 (8번).  */
  is(o5.vals.filter(v => (v || '').indexOf('어디 뒀는지') >= 0).length === 1,
    '  ★★ <b>적은 글이 칸에 들어 있다</b> — 고치고 다시 누르면 됩니다 ('
      + o5.vals.filter(v => v).length + '칸에 글이 있습니다)');
  /* ★ <b>적을 것이 앞</b>에 온다 — 할 일이 위에 있어야 합니다 */
  is((o5.vals[0] || '') === '' ,
    '  ★ <b>적을 것이 앞</b>에 선다 — 첫 칸이 비어 있다 (적은 줄은 내려갑니다)');
  is(o5.btns.filter(x => x.indexOf('지우기') === 0).length >= 2,
    '  ★ 적은 줄마다 <b>지우기</b>가 있다 — ' + o5.btns.filter(x => x.indexOf('지우기') === 0).length + '개');
  const cleared = await p.evaluate(async () => {
    mstAnsClear('c1', 1); await new Promise(r => setTimeout(r, 350));
    return { of: JSON.stringify(mstAnsOf('c1', 1)), n: mstDueList().ansNo };
  });
  is(cleared.of === 'null' && cleared.n === 2,
    '  ★ 지우면 <b>다시 「안 적음」</b> 이 된다 — 안 적은 것 ' + cleared.n + '건');

  console.log('\n[7] ★★ <b>홈과 고객 365일이 같은 수</b>를 말한다 (0-1번)');
  const o6 = await open();
  const hm = await p.evaluate(({ src }) => (0, eval)('(' + src + ')')(), { src: String(LOOK) });
  is(hm.homeAsk.length === 1 && o6.ask.length === 1,
    '  두 화면이 <b>이름표를 하나씩</b> 달고 있다 — 홈 ' + hm.homeAsk.length + ' · 마디 ' + o6.ask.length);
  is(hm.homeAsk.length === 1 && o6.ask.length === 1 && hm.homeAsk[0] === o6.ask[0],
    '  ★★ <b>같은 수</b>다 — 홈 ' + (hm.homeAsk[0] || '?') + ' · 마디 ' + (o6.ask[0] || '?')
      + (hm.homeAsk[0] === o6.ask[0] ? '' : ' ← 갈렸습니다'));
  is(hm.home.indexOf('답 적을 것') >= 0,
    '  홈이 <b>「답 적을 것 N건」</b> 이라 적는다 — 「' + (hm.home.match(/답 적을 것[^·]*/) || ['없다'])[0].trim() + '」');

  console.log('\n[8] ★★ <b>서버를 안 부른다</b> (7번) · <b>이 기기에만</b> 이라고 적는다');
  is(hits === hits0, '  이 자가 재는 동안 바깥을 <b>' + (hits - hits0) + '번</b> 불렀다');
  is(/이 기기에만/.test(o6.txt) && /폰과 PC 가 따로/.test(o6.txt),
    '  ★★ <b>「이 기기에만 · 폰과 PC 가 따로」</b> 라고 적는다 — 모르시면 「적었는데 없다」 가 됩니다');
  const fnA = (() => { const i = src.indexOf('function mstAnsSet('); if (i < 0) return '';
    const r = src.slice(i + 1), e = r.indexOf('\nfunction '); return e > 0 ? r.slice(0, e) : r.slice(0, 1200); })();
  is(fnA.length > 0 && !/osClient\(|cmSave\(/.test(fnA),
    '  ★ 담는 자리가 <b>서버를 안 부른다</b> — localStorage 하나입니다');

  console.log('\n[9] ★★ <b>오래된 것은 내려간다</b> · <b>모르는 것은 안 세운다</b>');
  const old = await put({ 'c1:1': '2026-01-05', 'c2:3': '2026-10-01' }, {});
  is(old.L && old.L.sent === 1,
    '  90일이 지난 것은 <b>내려간다</b> — 둘 가운데 ' + (old.L ? old.L.sent : 'null') + '건만 섰다');
  const noDate = await put({ 'c1:1': '', 'c2:3': '2026-10-01' }, {});
  is(noDate.L && noDate.L.sent === 1,
    '  ★★ <b>언제 보냈는지 모르면 안 세운다</b> (1번) — ' + (noDate.L ? noDate.L.sent : 'null') + '건');

  console.log('\n[10] ★ <b>바구니 없는 답을 받아도 안 터진다</b>');
  const odd = await p.evaluate(() => {
    const real = window.mstDueList;
    window.mstDueList = function () { return { due: [], soon: [], mon: [], monLeft: 0, none: 0, total: 3 }; };
    let err = '';
    try { hmMadiSideHtml(); mstCardHtml(); go('home'); } catch (e) { err = String(e && e.message || e); }
    window.mstDueList = real; try { go('home'); } catch (e) {}
    return err;
  });
  is(!odd, '  sent 가 없는 답을 받아도 <b>안 터진다</b>' + (odd ? (' ← ' + odd.slice(0, 70)) : ''));

  console.log('\n[11] 길이 — <b>홈이 안 불어난다</b>');
  const many = {};
  for (let i = 1; i <= 3; i++) for (const m of [1, 3, 6, 9, 12]) many['c' + i + ':' + m] = '2026-10-01';
  const big = await put(many, {});
  const oBig = await open();
  is(big.homeH <= 155,
    '  홈 카드가 <b>' + big.homeH + 'px</b> — 옛 판 155px 이하 (답 수를 적어도 안 늘어납니다)');
  is(oBig.nIn <= 5,
    '  ★ 한 번에 <b>다섯 줄</b>까지다 — ' + oBig.nIn + '개 (' + (big.L ? big.L.sent : '?') + '건 중)');
  is(oBig.txt.indexOf('더 있습니다') >= 0,
    '  ★ 나머지가 <b>몇 건인지 적는다</b> — 조용히 빠뜨리지 않습니다 (1번)');
  is(errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b>'
    + (errs.length ? (' ← ' + errs.slice(0, 2).join(' / ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 답을 적는 자리에 구멍이 있습니다')
                  : '✓ 보낸 뒤에만 서고 · 적으면 남고 · 「없었다」 와 「안 적음」 을 가르고 · 고칠 길이 있고 · 두 화면이 같은 수입니다');
  console.log('  ⚠ <b>적어 두신 답이 맞는 말인가</b> 는 안 잽니다 — 그 말이 그대로 남아 그대로 보이는가까지만 봅니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
