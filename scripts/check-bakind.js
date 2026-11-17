/* 🔄 <b>보장분석 전·후 — 담은 자리와 꺼내는 자리가 같은가</b> (판 X458)

   사장님 말씀 2026-11-15 「보장분석 전후에서 <b>어디서든 공유가 안되잖아</b>」
   — 고객 창 ▸ 서류에서 「여*은 보장 전·후」 를 여셨는데 <b>(내용 없음)</b> 이었습니다.

   ── 재어 보니 공유가 안 된 것이 아니었습니다 ───────────────────────
   자료는 <b>이미 서버에</b> 있었습니다 — saved_reports(kind='ba_state').
   baHello 가 그 줄을 읽어 「보장 전·후 만들기」 화면에 내려 줍니다. 그러니
   다른 기기에서도 <b>그 화면을 열면</b> 그대로 섰습니다.

   ⚠⚠ <b>갈래 이름을 묻는 곳이 넷으로 갈려 있었습니다</b> (CLAUDE.md 5번) —
     · baSave   : kind <b>'ba_state'</b> 로 담고
     · baHello  : kind <b>'ba_state'</b> 로 읽고
     · oscBaRows: kind <b>'baba'</b> 를 찾고          ← 여기가 어긋났습니다
     · 서류 목록 이름표: <b>'baba'</b> 만 알고         ← 여기도
   그래서 고객 창의 「🔄 보장분석 전·후」 칸이 <b>「아직 없습니다」</b> 라고
   적었습니다. <b>있는데 없다고 말한 것</b>입니다 — 1번이 제일 싫어하는 자리입니다.
   서류 목록에는 날 이름 <b>📄 ba_state</b> 로 뜨고, 「보기」 를 누르면
   content.md 가 없어 <b>(내용 없음)</b> 이었습니다.

   여기서 못 박는 것:
     [1] 담는 갈래를 <b>한 곳</b>(CHK_KIND)만 안다 — 날글자로 흩어 적지 않는다.
     [2] 저장해 둔 줄이 있으면 전·후 칸이 <b>「없습니다」 라고 안 한다.</b>
     [3] 서류 목록이 <b>날 kind</b> 를 그대로 안 찍는다 — 사람 말로 적는다.
     [4] 누르면 <b>(내용 없음) 창이 아니라 그 화면</b>으로 간다.
     [5] ★ <b>옛 'baba' 줄도 그대로 보인다</b> — 예전에 만들어 둔 자료를
         못 보게 하지 않는다 (6번).
     [6] 글이 없는 자료에 <b>「(내용 없음)」 이라고만 적지 않는다</b> (1번).

   ⚠ <b>이 자가 못 보는 것</b> — 서버에 정말로 줄이 있는지는 안 봅니다.
     사장님 진짜 서버를 안 부릅니다(7번). 담는 쪽과 꺼내는 쪽이 <b>같은 글자</b>를
     보는지만 봅니다. 그것이 이번에 깨졌던 자리입니다.                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/index.html';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!bad && !ok) {} if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본은 <b>홍길동</b> 입니다 (CLAUDE.md 3번) */
const 줄 = (kind) => ({ id:'r-'+kind, kind:kind, title:'홍○동 보장 전·후 (2026-11-14)',
  created_at:'2026-11-14T09:00:00Z',
  content:{ v:1, at:'2026-11-14', state:{ who:{ name:'홍○동' } }, sum:{ n:12 } } });

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 430, height: 900 } });
  /* 🔌 바깥을 막습니다 — 점검이 사장님 진짜 서버를 읽지 않습니다 (7번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof oscBaHtml === 'function' && typeof oscBaRows === 'function',
                           { timeout: 60000 });
  const SRC = fs.readFileSync(FILE, 'utf8');

  head('[1] 담는 갈래를 <b>한 곳</b>만 안다 (5번)');
  is(/var\s+CHK_KIND\s*=\s*'ba_state'/.test(SRC), '갈래 대장(CHK_KIND)이 있다');
  /* 주석은 뺍니다 — 글로 적은 것과 코드로 쓴 것은 다릅니다 (8번) */
  const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/var APP_BUILD_NOTE=[\s\S]*?;\n/, ' ');
  const 날글 = (CODE.match(/'ba_state'/g) || []).length;
  is(날글 === 1, '  <b>\'ba_state\'</b> 를 날글자로 적은 곳이 ' + 날글 +
     '곳 — 대장 한 줄뿐이어야 합니다 (담는 쪽과 꺼내는 쪽이 갈리면 있는데 없다고 합니다)');

  head('[2] 저장해 둔 줄이 있으면 <b>「없습니다」 라고 안 한다</b> (1번)');
  const 신 = await pg.evaluate((row) => {
    OSC.current = { id:'c1', name_masked:'홍○동' };
    OSC.repsLoaded = true; OSC.reps = [row];
    const h = oscBaHtml();
    return { 꺼낸수: oscBaRows().length, 글: h,
             없다고하나: /전·후 자료가 아직|아직 없습니다/.test(h) };
  }, 줄('ba_state'));
  is(신.꺼낸수 === 1, '  담아 둔 줄(kind=ba_state)을 <b>' + 신.꺼낸수 + '개</b> 찾는다');
  is(!신.없다고하나, '  ★★ 전·후 칸이 <b>「아직 없습니다」 라고 안 한다</b> — 있는데 없다고 하면 ' +
     '사장님은 자료를 잃은 줄 아십니다 (1번)');
  is(/홍○동 보장 전·후/.test(신.글), '  그 줄의 제목이 칸에 선다');

  head('[3] ★ <b>옛 \'baba\' 줄도 그대로 보인다</b> (6번 — 예전 자료를 못 보게 하지 않는다)');
  const 옛 = await pg.evaluate((row) => {
    OSC.reps = [row]; return { 꺼낸수: oscBaRows().length, 없다고하나: /전·후 자료가 아직|아직 없습니다/.test(oscBaHtml()) };
  }, 줄('baba'));
  is(옛.꺼낸수 === 1 && !옛.없다고하나, '  옛 갈래(baba)로 담긴 줄도 <b>' + 옛.꺼낸수 + '개</b> 그대로 선다');

  head('[4] 서류 목록이 <b>날 kind</b> 를 그대로 안 찍는다');
  const 이름 = await pg.evaluate(() =>
    (typeof osRepKindName === 'function')
      ? { ba: osRepKindName('ba_state'), 옛: osRepKindName('baba'), 모름: osRepKindName('zzz') }
      : null);
  is(!!이름, '갈래 이름을 묻는 곳(osRepKindName)이 있다');
  if (이름) {
    is(!/ba_state/.test(이름.ba), '  ba_state 를 <b>' + 이름.ba + '</b> 라고 사람 말로 적는다');
    is(!/^📄 baba$/.test(이름.옛), '  옛 baba 도 사람 말로 적는다 — ' + 이름.옛);
    is(/zzz/.test(이름.모름), '  ★ 모르는 갈래는 <b>그대로 적습니다</b> — 지어내지 않습니다 (1번)');
  }

  head('[5] ★★ 누르면 <b>(내용 없음) 창이 아니라 그 화면</b>으로 간다');
  const 길 = await pg.evaluate((row) => {
    OSC.current = { id:'c1', name_masked:'홍○동' };
    OSC.repsLoaded = true; OSC.reps = [row];
    const h = oscBaHtml();
    let 간곳 = '';
    const og = window.oscBaGo, ob = window.openBa;
    window.oscBaGo = function(){ 간곳 = 'oscBaGo'; };
    window.openBa  = function(){ 간곳 = 'openBa'; };
    const m = h.match(/onclick="([a-zA-Z0-9_]+)\(([^)]*)\)"/g) || [];
    /* 줄 단추를 그대로 눌러 봅니다 */
    const row1 = (h.match(/onclick="([a-zA-Z0-9_]+\([^)]*\))"[^>]*>\s*<span class="av">/) || [])[1];
    if (row1) { try { eval(row1); } catch (e) { 간곳 = '터짐: ' + e.message; } }
    window.oscBaGo = og; window.openBa = ob;
    return { 단추: row1 || '(없음)', 간곳: 간곳, 보기로가나: /osRepView/.test(row1 || '') };
  }, 줄('ba_state'));
  is(!길.보기로가나, '  줄 단추가 <b>osRepView(글 창)로 안 간다</b> — 그 창에는 보여 줄 글이 없습니다');
  is(/oscBaGo|openBa/.test(길.간곳), '  ★ 눌렀더니 <b>' + 길.간곳 + '</b> 로 갔다 — 전·후를 여는 문은 ' +
     '한 곳입니다 (5번 · 단추: ' + 길.단추 + ')');

  head('[6] 글이 없는 자료에 <b>「(내용 없음)」 이라고만</b> 적지 않는다 (1번)');
  const 빈 = await pg.evaluate(() => {
    OSC.reps = [{ id:'r9', kind:'consult', title:'글 없는 자료', created_at:'2026-11-14T09:00:00Z',
                  content:{ v:1 } }];
    try { osRepView(0); } catch (e) { return { 터짐: e.message }; }
    /* ⚠ cssText 로 넣으면 style 글에 <b>빈칸이 끼어</b>(z-index: 5200) 글자로 못 찾습니다.
       닫기 단추(osRepVX)에서 <b>위로 올라가</b> 창을 집습니다 — 자가 헛다리를 짚었던 자리입니다. */
    const x = document.getElementById('osRepVX');
    const ovl = x ? (x.closest('div[style]') ? x.closest('div[style]').parentElement.parentElement : null) : null;
    const top = x ? (function(){ let e = x; while (e && e.parentElement !== document.body) e = e.parentElement; return e; })() : null;
    const t = top ? (top.innerText || '') : '';
    if (top) top.remove();
    return { 글: t.replace(/\s+/g, ' ').trim().slice(0, 100), 창있나: !!top };
  });
  is(!빈.터짐 && !/^.*\(내용 없음\)\s*$/.test(빈.글) && /없습니다|화면에서|만든 화면/.test(빈.글),
     '  글이 없으면 <b>무엇을 해야 하는지</b> 말한다 — 「' + (빈.글 || 빈.터짐 || '') + '」');

  head('[7] 콘솔');
  is(errs.length === 0, errs.length ? ('터진 것 — ' + errs.slice(0, 2).join(' / ')) : '터진 곳이 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '🔄 전·후 점검 통과 — 담은 자리와 꺼내는 자리가 같고, 있는 것을 없다고 하지 않습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
