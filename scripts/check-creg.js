/* ➕ <b>고객 넣기</b> 가 어느 쪽인지 먼저 묻는가 — 판 X133

   사장님 말씀 (2026-10-19) — 「등록은 <b>오늘에서 바로</b> 할 수 있도록
   만들자. 그리고 <b>고객 365 / DB 이걸 구분을 잘 못하는 거 같아서</b>」.

   ── 재어 보니 앱 탓이었습니다 ──────────────────────────────────────
   홈 「오늘 챙길 것」 머리에 <b>이미 「➕ 고객 넣기」 단추가 있었습니다.</b>
   그런데 그 단추가 하는 일은 <b>hdbNew()</b> — 묻지도 않고 <b>배정 DB 등록</b>
   창을 엽니다. 이름은 「고객 넣기」 인데 여는 것은 배정 DB 입니다. 내
   고객(고객 365일)을 넣으려 해도 거기로 갑니다. 같은 단추가 <b>세 군데</b>
   (홈 · 아침 미션 빈 칸 · 서랍 메뉴)에 똑같이 달려 있었습니다.

   여기서 확인합니다.

     1. 세 군데가 다 <b>고르는 창</b>으로 가는가 — hdbNew 로 직행하지 않는가
        ★ 판 X134 부터 갈래가 <b>셋</b>입니다 — 👤 내 고객 · 📇 배정 DB ·
          📁 엑셀·CSV(여러 명 한꺼번에)
     2. ★★ 창이 <b>둘의 다른 점</b>을 말하는가 — 사장님이 짚으신 그 자리입니다
        · 「배정 한도」 가 어느 쪽에 걸리는지 또렷이 적는가
     3. ★★ <b>저장 코드를 새로 안 짰는가</b> (5번 · 사장님 규칙) —
        creg 안에 insert 가 한 줄도 없는가
     4. ★ 고르면 <b>이미 있는 창</b>이 뜨는가 — 👤 는 osNewClient,
        📇 는 hdbNew. <b>어느 화면에서든</b> 열리는가 (화면을 안 옮긴다)
     5. ★ 닫는 길이 둘인가 — ✕ 와 바깥 누르기 (하나뿐이면 갇힙니다)
     6. ★★ 홈이 <b>안 길어졌는가</b> — 새 단추를 세우지 않고 있던 단추가
        가는 곳만 바꿉니다. 홈은 4.2화면이 꽉 찼습니다 (8번)
     7. ★ 손가락이 닿는가 — 고르는 단추가 44px 이상
     8. ★ <b>표를 합치지 않았는가</b> — 창이 「하나로 합칩니다」 같은 말을
        하지 않는가. 배정 한도를 세는 자가 배정 DB 만 봐야 합니다

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  const src = fs.readFileSync('app/index.html', 'utf8');

  console.log('\n[1] 세 군데가 다 고르는 창으로 간다');
  /* 날글에서 봅니다 — 셋이 저마다 다른 화면에 있어 한 판에 다 못 세웁니다.
     ⚠ 이름표가 <b>다음 줄</b>에 있는 단추가 하나 있습니다(서랍 메뉴) —
       처음에 [^>]*> 로 찾다가 그 하나를 놓쳐 「둘」 이라고 울었습니다.
       줄바꿈을 넘는 자로 바꿉니다 (8번). */
  const btn = (fn) => (src.match(
      new RegExp('onclick="' + fn + '\\(\\)"[\\s\\S]{0,160}?고객 넣기', 'g')) || []).length;
  const nCreg = btn('cregOpen'), nDirect = btn('hdbNew');
  is(nCreg === 3, '「고객 넣기」 단추 셋이 모두 고르는 창으로 간다 (받음 ' + nCreg + ')');
  is(nDirect === 0,
     '배정 DB 창으로 <b>직행하는 단추가 없다</b> (받음 ' + nDirect + '개)');

  console.log('\n[3] 저장 코드를 새로 안 짰다');
  const blk = (src.match(/var CREG_K=\[[\s\S]*?function cregCss\(\)\{[\s\S]*?\n\}/) || [''])[0];
  is(blk !== '', 'creg 토막을 찾았다');
  is(!/\.insert\(|\.upsert\(|from\('clients'\)|from\('dbs'\)/.test(blk),
     'creg 안에 서버에 넣는 글이 <b>한 줄도 없다</b> (5번)');
  is(/osNewClient/.test(blk) && /hdbNew/.test(blk) && /cimpOpen/.test(blk),
     '이미 있는 창 셋을 <b>부르기만</b> 한다 — osNewClient · hdbNew · cimpOpen');

  console.log('\n[8] 표를 합친다고 말하지 않는다');
  is(!/표를 합|하나의 표|한 표로 합/.test(blk),
     '「표를 합칩니다」 같은 말이 없다 — 배정 한도를 세는 자가 배정 DB 만 봐야 합니다');

  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const W = await page.evaluate(() => {
    window.toast = function () {};
    OS.profile = { id: 'me', name: '윤시현', role: 'owner' };
    OS.session = { user: { id: 'me' } };
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    /* ★ <b>홈에서</b> 엽니다 — 화면을 안 옮기고 열려야 「오늘에서 바로」 입니다 */
    go('home');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    const before = location.hash + '|' + (typeof currentTab === 'function' ? currentTab() : '?');
    cregOpen();
    const sheet = document.getElementById('cregSheet');
    const cards = [].slice.call(document.querySelectorAll('.creg-c'));
    return { open: !!(sheet && sheet.classList.contains('on')),
             n: cards.length,
             txt: sheet ? sheet.textContent.replace(/\s+/g, ' ') : '',
             px: cards.map(c => Math.round(c.getBoundingClientRect().height)),
             x: !!document.querySelector('.creg-x'),
             after: location.hash + '|' + (typeof currentTab === 'function' ? currentTab() : '?'),
             same: before === (location.hash + '|' + (typeof currentTab === 'function' ? currentTab() : '?')) };
  });
  console.log('\n[2] 창이 둘의 다른 점을 말한다');
  is(W.open, '창이 열린다');
  /* ⚠ 판 X134 에서 <b>셋째 갈래</b>(📁 엑셀·CSV)가 붙었습니다. 수를 박아 두는
     자리라, 늘 때마다 여기도 같이 고칩니다 — 느슨히 >=2 로 풀면 갈래가 조용히
     사라져도 초록입니다 (8번).                                              */
  is(W.n === 3, '고르는 칸이 셋이다 (받음 ' + W.n + ')');
  is(/엑셀/.test(W.txt) && /여러 명 한꺼번에/.test(W.txt),
     '📁 엑셀·CSV — 여러 명 한꺼번에 라고 적는다');
  is(/내 고객<\/b>으로 들어갑니다|내 고객으로 들어갑니다/.test(W.txt) || /안 셉니다/.test(W.txt),
     '엑셀에서 가져온 분이 <b>어느 쪽으로</b> 들어가는지 적는다');
  is(/내 고객/.test(W.txt) && /고객 365일/.test(W.txt), '👤 내 고객 · 고객 365일 이라고 적는다');
  is(/배정 DB/.test(W.txt) && /DB 통합 CRM/.test(W.txt), '📇 배정 DB · DB 통합 CRM 이라고 적는다');
  is(/안 셉니다/.test(W.txt) && /셉니다/.test(W.txt),
     '<b>배정 한도</b>가 어느 쪽에 걸리는지 또렷이 적는다 — 사장님이 짚으신 자리');
  is(/일반 20/.test(W.txt) && /변액/.test(W.txt), '한도 수(일반 20 · 변액 +30)를 적는다');
  is(/이어집니다|내 고객으로/.test(W.txt), '둘을 잇는 길도 알려 준다');

  console.log('\n[4] 화면을 안 옮긴다 — 오늘에서 바로');
  is(W.same && /home/.test(W.after),
     '창을 열어도 <b>홈 그대로</b>다 (받음 ' + W.after + ')');

  console.log('\n[7] 손가락이 닿는다');
  is(W.px.length > 0 && W.px.every(h => h >= 44),
     '고르는 칸이 44px 이상이다 — ' + W.px.join(' · ') + 'px');

  console.log('\n[5] 닫는 길이 둘이다');
  is(W.x, '✕ 가 있다');
  const close = await page.evaluate(() => {
    const sh = document.getElementById('cregSheet');
    sh.dispatchEvent(new MouseEvent('click', { bubbles: true }));   /* 바깥 누르기 */
    const byOut = !sh.classList.contains('on');
    cregOpen();
    document.querySelector('.creg-x').click();
    return { byOut: byOut, byX: !document.getElementById('cregSheet').classList.contains('on') };
  });
  is(close.byOut, '바깥을 누르면 닫힌다');
  is(close.byX, '✕ 로도 닫힌다');

  console.log('\n[4-2] 고르면 이미 있는 창이 뜬다 — 화면은 그대로');
  const pick = await page.evaluate(() => {
    const o = {};
    cregOpen(); cregGoCli();
    o.cli = !!document.getElementById('oscName');
    o.cliTab = (typeof currentTab === 'function') ? currentTab() : '?';
    if (typeof osCloseModal === 'function') osCloseModal();
    cregOpen(); cregGoDb();
    o.db = !!document.getElementById('hdbName');
    o.dbTab = (typeof currentTab === 'function') ? currentTab() : '?';
    if (typeof hdbClose === 'function') hdbClose();
    return o;
  });
  is(pick.cli, '👤 를 누르면 <b>고객 365일 등록 창</b>이 뜬다 (#oscName)');
  is(pick.db, '📇 를 누르면 <b>배정 DB 등록 창</b>이 뜬다 (#hdbName)');
  is(pick.cliTab === 'home' && pick.dbTab === 'home',
     '둘 다 <b>화면을 안 옮긴다</b> — 홈 그대로 (받음 ' + pick.cliTab + ' / ' + pick.dbTab + ')');

  console.log('\n[9] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
