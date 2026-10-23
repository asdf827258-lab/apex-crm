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
        ★ 판 X135 부터 갈래가 <b>셋</b>입니다 — 👤 내 고객 · 📇 배정 DB ·
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

   ★ 판 X161 새 판 (2026-10-23 「탭 다섯으로 하고 추천대로 새 판 만들어」) — 창이 <b>세 걸음</b>입니다.
     ① 누구(이름·번호 · 이미 계신 분 찾기) → ② 어디서(👤 · 📇 고르는 칸 — 여기가 위 2번의 그 자리)
     → ③ 더 아시는 것(👤 만). 📁 엑셀은 ① 아래 한 칸입니다(이름을 하나 적고 나서 「여러 명」 을 고르게
     하면 거꾸로라). 그래서 고르는 칸은 ①의 📁 하나 + ②의 둘 = <b>셋</b> 그대로입니다.
     10. ★★ 번호가 같은 분이 <b>이미 계시면</b> ① 에서 알려 주나 · 가린 이름만 같으면 <b>약한 짝</b>이라 적나
     11. ★ 👤 셋째 걸음 — 넣는 것은 <b>cliMake</b>(사람 줄) · <b>cmSave</b>(어디서·소개) 뿐인가 · 고객 창 <b>정보</b> 탭이 열리나
     12. ★ 📇 는 이미 있는 배정 DB 창에 <b>적으신 이름·번호를 옮겨</b> 여나 (두 번 안 치게)
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
  /* 새 판 — 👤 는 등록 창(osNewClient) 대신 셋째 걸음이 <b>cliMake</b> 를 부릅니다. 넣는 자는 그대로 하나입니다 (5번) */
  is(/cliMake\(/.test(blk) && /hdbNew/.test(blk) && /cimpOpen/.test(blk),
     '이미 있는 자 셋을 <b>부르기만</b> 한다 — cliMake · hdbNew · cimpOpen');

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
    let cards = [].slice.call(document.querySelectorAll('.creg-c'));
    const px = cards.map(c => Math.round(c.getBoundingClientRect().height));
    let txt = sheet ? sheet.textContent : '';
    const nm = document.getElementById('cregNm'), ph = document.getElementById('cregPh');
    const step1 = !!nm && !!ph;
    /* ① 이름 없이 다음 → 안 넘어간다 */
    cregStep(2);
    const stay = !!document.getElementById('cregNm');
    document.getElementById('cregNm').value = '홍길동';
    cregStep(2);
    const c2 = [].slice.call(document.querySelectorAll('.creg-c'));
    c2.forEach(c => px.push(Math.round(c.getBoundingClientRect().height)));
    txt += ' ' + (sheet ? sheet.textContent : '');
    return { open: !!(sheet && sheet.classList.contains('on')),
             n: cards.length + c2.length, n1: cards.length, n2: c2.length, step1: step1, stay: stay,
             txt: txt.replace(/\s+/g, ' '),
             px: px,
             x: !!document.querySelector('.creg-x'),
             after: location.hash + '|' + (typeof currentTab === 'function' ? currentTab() : '?'),
             same: before === (location.hash + '|' + (typeof currentTab === 'function' ? currentTab() : '?')) };
  });
  console.log('\n[2] 창이 둘의 다른 점을 말한다');
  is(W.open, '창이 열린다');
  /* ⚠ 판 X135 에서 <b>셋째 갈래</b>(📁 엑셀·CSV)가 붙었습니다. 수를 박아 두는
     자리라, 늘 때마다 여기도 같이 고칩니다 — 느슨히 >=2 로 풀면 갈래가 조용히
     사라져도 초록입니다 (8번).                                              */
  is(W.n === 3 && W.n1 === 1 && W.n2 === 2, '고르는 칸이 셋이다 — ① 📁 하나 · ② 👤📇 둘 (받음 ' + W.n1 + ' · ' + W.n2 + ')');
  is(W.step1, '첫 걸음은 <b>누구</b> — 이름 · 번호 칸');
  is(W.stay, '이름 없이 「다음」 을 누르면 안 넘어간다');
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
    cregOpen(); document.getElementById('cregNm').value = '홍길동'; cregStep(2); cregGoCli();
    o.cli = !!document.getElementById('cregBy') && !!document.getElementById('cregSay') && /정보 탭/.test(document.getElementById('cregSheet').textContent);
    o.cliTab = (typeof currentTab === 'function') ? currentTab() : '?';
    cregClose();
    cregOpen(); document.getElementById('cregNm').value = '홍길순'; document.getElementById('cregPh').value = '010-3333-4444';
    cregStep(2); cregGoDb();
    o.db = !!document.getElementById('hdbName');
    o.carry = o.db && document.getElementById('hdbName').value === '홍길순' &&
              (document.getElementById('hdbPhone') || {}).value === '010-3333-4444';
    o.dbTab = (typeof currentTab === 'function') ? currentTab() : '?';
    if (typeof hdbClose === 'function') hdbClose();
    return o;
  });
  is(pick.cli, '👤 를 누르면 <b>셋째 걸음</b>(더 아시는 것)이 선다 — 넣고 나면 고객 창 정보 탭');
  is(pick.db, '📇 를 누르면 <b>배정 DB 등록 창</b>이 뜬다 (#hdbName)');
  is(pick.carry, '📇 창에 <b>적으신 이름·번호가 옮겨져</b> 있다 — 두 번 안 칩니다');

  console.log('\n[10] 이미 계신 분을 번호로 찾는다');
  const dup = await page.evaluate(() => {
    OSC.list = [{ id: 'k1', name_masked: '홍*동', phone: '010-1111-2222' }, { id: 'k2', name_masked: '홍*순' }];
    AR.db = [{ id: 'q1', name: '홍말순', phone: '010 5555 6666', stage: 'TA', client_id: '' }];
    const a = cregDup('홍길동', '010-1111-2222'), b = cregDup('홍길순', ''), c = cregDup('홍말순', '01055556666'),
          d = cregDup('홍길동', '010-9999-0000');
    return { a: a.map(x => x.k + ':' + (x.cli || x.db)).join(','), b: b.map(x => x.k + ':' + x.cli).join(','),
             c: c.map(x => x.k + ':' + x.db).join(','), d: d.map(x => x.k).join(',') };
  });
  is(dup.a === 'sure:k1', '  번호가 같으면 <b>확실한 짝</b> — ' + dup.a);
  is(dup.b === 'weak:k2', '  가린 이름만 같으면 <b>약한 짝</b> (번호를 한 번 더 보라고) — ' + dup.b);
  is(dup.c === 'sure:q1', '  배정 DB 줄도 번호로 찾는다 (띄어쓰기·- 는 지우고 견준다) — ' + dup.c);
  is(dup.d.indexOf('sure') < 0, '  번호가 다르면 이름이 같아도 「확실」 이라 하지 않는다 — 번호가 말한다 (받음 ' + (dup.d || '없음') + ')');

  console.log('\n[11] 👤 넣기 — cliMake · cmSave 만 부르고 정보 탭을 연다');
  const mk = await page.evaluate(() => {
    const got = {}, real = { cliMake: window.cliMake, cmSave: window.cmSave, cusGo: window.cusGo, osLoadClients: window.osLoadClients };
    window.cliMake = function (n, ex, cb) { got.n = n; got.ex = ex; cb('k9', '홍*동', ''); };
    window.cmSave = function (id, p, cb) { got.patch = p; if (cb) cb(); };
    window.cusGo = function (o) { got.go = o.cli + '|' + o.tab; };
    window.osLoadClients = function () {};
    cregOpen(); document.getElementById('cregNm').value = '홍길동'; document.getElementById('cregPh').value = '010-7777-8888';
    cregStep(2); cregGoCli(); CREG.src = 'ref'; cregPaint();
    document.getElementById('cregRef').value = '홍갑돌'; document.getElementById('cregBy').value = '1982';
    cregMake();
    Object.keys(real).forEach(k => { window[k] = real[k]; });
    return { n: got.n, ex: JSON.stringify(got.ex || {}), patch: JSON.stringify(got.patch || {}), go: got.go || '',
             real: (typeof cmRefRealOf === 'function') ? cmRefRealOf('k9') : '' };
  });
  is(mk.n === '홍길동' && /"ph":"010-7777-8888"/.test(mk.ex) && /"by":1982/.test(mk.ex),
     '  cliMake 에 이름·번호·생년이 간다 — ' + mk.ex);
  is(!/"gd"|"memo"/.test(mk.ex), '  <b>비운 칸은 안 보낸다</b> — 성별·처음 들은 말을 안 적었으면 「모름」 그대로 (1번)');
  is(/"src":"ref"/.test(mk.patch) && /"refx":"홍\*돌"/.test(mk.patch) && !/홍갑돌/.test(mk.patch),
     '  어디서·소개는 cmSave 로 — 소개자 실명은 <b>서버로 안 간다</b>(가린 이름만 · 3번) — ' + mk.patch);
  is(mk.real === '홍갑돌', '  소개자 실명은 이 기기에만 남는다');
  is(mk.go === 'k9|info', '  넣고 나면 <b>고객 창 정보 탭</b>이 열린다 — ' + mk.go);
  is(pick.cliTab === 'home' && pick.dbTab === 'home',
     '둘 다 <b>화면을 안 옮긴다</b> — 홈 그대로 (받음 ' + pick.cliTab + ' / ' + pick.dbTab + ')');

  console.log('\n[9] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
