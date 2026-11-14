/* 📅 <b>오늘에서 캘린더 — 보기도 쉽고 넣기도 쉽게</b> (판 X434)

   사장님 말씀 (2026-11-14) — 「<b>캘린더에 일정 추가 하기가 많이 어렵다.</b>
   여기서 추가로 <b>고객 일정</b>을 만들 수도 있는 건데 안 되어서 어렵고,
   <b>오늘에서 캘린더 보기가 쉽지가 않네</b>. 위치의 조정 또는, <b>다른 칸을
   줄여서 그 자리에 같이 놔두는 방법</b>을 찾아. <b>맨 위에 고객 163분 이
   부분을 칸을 효율적으로 줄인 뒤</b> 하는 걸 추천한다」.

   ── 이 자가 보는 것 ────────────────────────────────────────────
     1. 📅 이번 주 칸이 <b>맨 위 묶음 바로 그 자리</b>에 선다
     2. 이레가 서고 <b>첫 칸이 오늘</b>이다
     3. ★★ <b>건수를 여기서 또 안 센다</b> (5번) — mcalDay 와 같은 수인가
     4. ★ 못 읽었으면 <b>날짜를 지어 세우지 않는다</b> (1번)
     5. ★★ <b>넣는 단추가 하나</b>다 (5번) — 처음에 둘이었고 서로 <b>다른
        날</b>을 봤습니다(제 것은 고른 날, 폼의 것은 달력이 고른 날)
     6. ★★ <b>「어느 날인가」 를 묻는 곳이 하나</b>다 — MCAL.sel
     7. ★★ <b>저장 코드를 새로 안 짰다</b> (사장님 규칙) — 담는 자는
        mcalMyAdd 하나이고 적는 칸도 mcalMyFormHtml 그대로인가
     8. ★ 👤 고객 약속은 <b>여기서 안 담그고</b> 길만 연다 (1번 · 6번)
     9. ★ 맨 위 칸을 <b>정말로 줄였다</b> — 86 → 56px (사장님이 시키신 것)
    10. ★ 누르는 자리가 44px 이상이다

   ★ 사장님 진짜 서버는 한 번도 안 부릅니다 (8번).                        */
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
const sec = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2700);
  await page.evaluate(() => {
    window.toast = function () {};
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    try { go('home'); } catch (e) {}
    try { if (typeof hmPaint === 'function') hmPaint(); } catch (e) {}
  });
  await page.waitForTimeout(600);

  sec('[7] ★★ 저장 코드를 <b>새로 안 짰다</b> (사장님 규칙 · 5번)');
  const SRC = fs.readFileSync('app/index.html', 'utf8');
  const 토막 = SRC.slice(SRC.indexOf('var HM_SCHED={'), SRC.indexOf('function hmSumHtml(){'));
  is(/mcalMyFormHtml\(/.test(토막), '적는 칸은 <b>내 캘린더가 쓰는 그것</b>(mcalMyFormHtml)이다');
  is(!/\.from\(|insert\(|upsert\(/.test(토막),
     '이 토막에 <b>서버에 담는 줄이 한 줄도 없다</b> — 담는 자는 mcalMyAdd 하나');
  is(/mcalItems\(\)/.test(토막) && /mcalDay\(/.test(토막),
     '건수는 <b>mcalItems · mcalDay</b> 에게 묻는다 — 여기서 또 안 센다');
  is(/MCAL\.sel/.test(토막), '「어느 날인가」 는 <b>MCAL.sel</b> 한 곳이 답한다');

  sec('[1]·[2] 📅 이번 주 칸이 서고, 첫 칸이 오늘이다');
  const V = await page.evaluate(() => {
    const box = document.getElementById('hmSchedBox');
    const d = box ? [...box.querySelectorAll('.hm-sch-d button')] : [];
    return {
      섰나: !!box,
      앞: box ? (box.previousElementSibling || {}).className || '' : '',
      날수: d.length,
      첫칸: d.length ? (d[0].innerText || '').replace(/\s+/g, ' ').trim() : '',
      키: box ? Math.round(box.getBoundingClientRect().height) : 0,
      단추: box ? [...box.querySelectorAll('button')]
        .map(e => ({ t: (e.innerText || '').trim().slice(0, 8),
                     h: Math.round(e.getBoundingClientRect().height) })) : []
    };
  });
  is(V.섰나, '📅 이번 주 칸이 홈에 선다');
  is(/hm-two/.test(V.앞), '<b>맨 위 묶음 바로 아래</b>다 — 앞은 「' + V.앞 + '」');
  is(V.날수 === 7, '이레가 선다 — ' + V.날수 + '칸');
  is(/오늘/.test(V.첫칸), '첫 칸이 <b>오늘</b>이다 — 「' + V.첫칸 + '」');
  is(V.키 > 0 && V.키 <= 170, '접힌 키가 <b>170px 아래</b>다 — ' + V.키 + 'px');

  sec('[10] 누르는 자리가 44px 이상이다');
  is(V.단추.length >= 9, '단추가 선다 — ' + V.단추.length + '개');
  const 작은 = V.단추.filter(x => x.h < 44);
  is(작은.length === 0, '44px 아래가 없다' +
     (작은.length ? ' — ' + 작은.map(x => x.t + ' ' + x.h).join(' · ') : ''));

  sec('[3] ★★ 건수를 <b>여기서 또 안 센다</b> (5번)');
  const C = await page.evaluate(() => {
    const D = hmSchedDays();
    if (!D) return { 같나: null };
    const it = mcalItems();
    const 바름 = D.map(x => (mcalDay(it, x.d) || []).length);
    const 적힌 = D.map(x => x.n);
    return { 같나: 바름.join(',') === 적힌.join(','), 바름: 바름.join(','), 적힌: 적힌.join(',') };
  });
  is(C.같나 === true, '이레의 건수가 달력과 <b>한 자도 안 다르다</b> — ' + C.적힌 + ' (달력 ' + C.바름 + ')');

  sec('[4] 못 읽었으면 <b>날짜를 지어 세우지 않는다</b> (1번)');
  const U = await page.evaluate(() => {
    const keep = window.mcalItems;
    window.mcalItems = function () { throw new Error('아직'); };
    const body = hmSchedBody();
    window.mcalItems = keep;
    return { 날: (body.match(/hm-sch-d/g) || []).length, 말: /아직 못 읽었습니다/.test(body) };
  });
  is(U.날 === 0, '날짜 칸을 아예 안 세운다');
  is(U.말, '<b>「아직 못 읽었습니다」 라고 말한다</b> — 0건이라고 안 적는다');

  sec('[5]·[6] ＋일정 — <b>넣는 단추가 하나</b>이고 날이 하나다');
  const P = await page.evaluate(() => {
    hmSchedToggle();
    const box = document.getElementById('hmSchedBox');
    const txt = (box.innerText || '').replace(/\s+/g, ' ');
    const 넣기 = [...box.querySelectorAll('button')]
      .filter(e => /넣기|넣습니다|에 넣/.test((e.innerText || ''))).length;
    return { 폼: !!document.getElementById('mcalMyT'), 넣기: 넣기, 글: txt.slice(0, 80) };
  });
  is(P.폼, '적는 칸이 열린다 (mcalMyT)');
  is(P.넣기 === 1, '★ <b>넣는 단추가 하나</b>다 — ' + P.넣기 + '개 (둘이면 서로 다른 날을 봅니다)');
  const S2 = await page.evaluate(() => {
    const d = [...document.querySelectorAll('#hmSchedBox .hm-sch-d button')];
    d[3].click();
    const sel = MCAL.sel;
    const box = document.getElementById('hmSchedBox');
    return { sel: sel, 적힘: /📌/.test(box.innerText) && box.innerText.indexOf(sel) >= 0 };
  });
  is(!!S2.sel, '날을 고르면 <b>MCAL.sel</b> 이 바뀐다 — ' + S2.sel);
  is(S2.적힘, '고른 날을 <b>화면에 적어 준다</b> — 「📌 ' + S2.sel + ' 에 넣습니다」');

  sec('[7-2] 넣으면 <b>그 날에</b> 들어간다 — 담는 자는 mcalMyAdd 하나');
  const A = await page.evaluate(() => {
    const 받음 = [];
    const keep = window.mcalMyAdd;
    window.mcalMyAdd = function (ds, hm, t) { 받음.push(ds + '|' + hm + '|' + t); return true; };
    document.getElementById('mcalMyT').value = '지점 회의';
    const b = [...document.querySelectorAll('#hmSchedBox button')]
      .filter(e => /넣기/.test(e.innerText || ''))[0];
    if (b) b.click();
    window.mcalMyAdd = keep;
    return { 받음: 받음.join(' '), 고른날: MCAL.sel };
  });
  is(A.받음.indexOf(A.고른날) === 0,
     '<b>고른 날</b>로 mcalMyAdd 를 부른다 — 「' + A.받음 + '」 (고른 날 ' + A.고른날 + ')');

  sec('[8] 👤 고객 약속은 <b>여기서 안 담근다</b> (1번 · 6번)');
  is(!/next_appt/.test(토막), '배정 줄(next_appt)에 손대지 않는다 — 적는 자리는 고객 창·동선이다');
  is(/go\('clients'\)/.test(토막), '그 분 카드로 <b>길만 연다</b>');

  sec('[9] 맨 위 칸을 <b>정말로 줄였다</b> (사장님이 시키신 것)');
  const T = await page.evaluate(() => {
    const t = document.querySelector('.hm-two');
    const b = t ? t.querySelector('button') : null;
    return { 칸: t ? Math.round(t.getBoundingClientRect().height) : -1,
             쪽: b ? Math.round(b.getBoundingClientRect().height) : -1 };
  });
  /* ⚠ <b>CSS 값(minHeight)으로 재면 안 됩니다</b> — #dynPane button{min-height:44px}
     가 이깁니다. 처음에 56px 인지 물었다가 44px 을 받아 <b>멀쩡한 자리를
     고발했습니다</b>. 눈에 보이는 것은 <b>실제 키</b>입니다 (8번). */
  is(T.쪽 > 0 && T.쪽 <= 80, '맨 위 칸 하나가 <b>80px 아래</b>다 — ' + T.쪽 + 'px (손대기 전 94px 묶음)');
  is(T.칸 > 0 && T.칸 <= 100, '맨 위 묶음이 <b>100px 아래</b>다 — ' + T.칸 + 'px');

  sec('[11] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : '홈에서 이번 주가 바로 보이고, 일정은 한 단추로 그 날에 들어갑니다.');
  process.exit(bad ? 1 : 0);
})();
