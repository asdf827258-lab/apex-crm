/* 📅 <b>오늘에서 캘린더 — 보기도 쉽고 넣기도 쉽게</b> (판 X434 → <b>판 X439 에서 하나로</b>)

   사장님 말씀 (2026-11-14) —
     「<b>캘린더에 일정추가 하기가 많이 어렵다.</b> 여기서 추가로 <b>고객 일정</b>을
      만들 수도 있는 건데 안 되어서 어렵고, <b>오늘에서 캘린더 보기가 쉽지가 않네.</b>
      위치의 조정 또는, 다른 칸을 줄여서 그 자리에 같이 놔두는 방법을 찾아.
      <b>맨 위에 고객 163분 이 부분을 칸을 효율적으로 줄인 뒤</b> 하는 걸 추천한다.」
     번외 — 「네이버 캘린더와 연동시키는 방법을 찾아. <b>어렵다면, 그냥 이대로
      진행하자.</b> 이거 캘린더를 <b>아이폰이든, 갤럭시든</b> 사용할 수 있도록 만들게」

   ── ⚠⚠ <b>판 X434 에서 제가 두 벌을 만들었습니다</b> ─────────────────
   「그 자리에 같이 놔두라」 는 말씀을 <b>새 칸을 세우라</b>로 읽고 📅 이번 주
   칸을 하나 더 만들었습니다. 그런데 홈에는 <b>이미 📆 이번 주</b>가 있었습니다
   (hmStack 안 #hmWkHost). 한 화면에 같은 것이 둘 — CLAUDE.md <b>5번</b>이
   「버그가 가장 많이 나온 자리」 라고 적어 둔 그것입니다. 자도 초록이었고,
   <b>화면을 재어 보고서야</b> 봤습니다(옛 것 y869 · 제 것 y1,153).

   ★ 판 X439 에서 <b>제 칸을 거두고</b>, 사장님이 없다고 하신 것만 <b>옛 칸
     안으로</b> 옮겼습니다. 홈이 <b>2,493 → 2,367px</b> 로 오히려 짧아졌습니다.

   ── 이 자가 보는 것 ────────────────────────────────────────────
     1. ★★ 홈에 「이번 주」 가 <b>하나</b>다 (5번) — 이것이 뼈대
     2. ★★ <b>접은 채로도 수가 보인다</b> — 「오늘 N건 · 이레 N건」.
        여태 이 접이 머리가 <b>비어</b> 있어 접으면 한 자도 안 보였습니다 —
        사장님 「보기가 쉽지가 않네」 의 절반이 이것입니다
     3. ★ 못 읽었으면 <b>「아직 못 읽었습니다」</b> — 0 이라고 안 적는다 (1번)
     4. ★★ 세는 자가 <b>mcalItems · mcalDay 하나</b>다 — 여기서 또 안 센다 (5번)
     5. ★★ <b>넣는 칸이 같은 칸 안에</b> 선다 — 「＋ 일정」 을 누르면 펴진다
     6. ★★ <b>저장 코드를 새로 안 짰다</b> (사장님 규칙) — mcalMyFormHtml ·
        mcalMyPut 그대로. 넣는 단추는 <b>폼에 있는 그것 하나</b>
     7. ★★ 「어느 날인가」 를 묻는 곳이 <b>MCAL.sel 하나</b>다 — 둘이면
        단추마다 다른 날에 넣습니다 (판 X434 에서 실제로 그랬습니다)
     8. ★ 고객 약속은 <b>여기서 안 담그고 길만 연다</b> (1번 · 6번)
     9. ★ 폰 달력 — <b>mcalDownload 하나</b>를 부르고, 네이버는 「가져오기」
        라고 <b>되는 길만</b> 적는다 (1번)
    10. ★ 맨 위 「고객 N분」 칸을 <b>정말로 줄였나</b> (사장님 말씀)
    11. ★ 누르는 자리 44px

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
  await page.waitForTimeout(2800);
  await page.evaluate(() => {
    window.toast = function () {};
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    try { go('home'); } catch (e) {}
  });
  await page.waitForTimeout(1400);

  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1] ★★ 홈에 「이번 주」 가 <b>하나</b>다 (5번) — 이 자의 뼈대');
  const ONE = await page.evaluate(() => {
    const n = (s) => document.querySelectorAll(s).length;
    return { 옛: n('#hmWkHost'), 내가만든것: n('#hmSchedBox'),
             주접이: n('#hmFold_stk_week') };
  });
  is(ONE.옛 === 1, '📆 이번 주 칸이 <b>한 곳</b>에 선다 (#hmWkHost · ' + ONE.옛 + '개)');
  is(ONE.내가만든것 === 0,
     '★★ 판 X434 의 <b>두 번째 칸이 없다</b> (#hmSchedBox · ' + ONE.내가만든것 + '개) — 둘이면 같은 주가 홈에 두 번 섭니다');
  is(!/function hmSchedBody\(/.test(SRC) && !/hmSchedHtml\(\)/.test(SRC),
     '  두 번째 칸을 <b>짓는 자도 없다</b> — 남겨 두면 다음 세션이 다시 세웁니다');

  sec('[2]·[3]·[4] <b>접은 채로도 수가 보인다</b> · 못 읽으면 모른다고');
  const F = await page.evaluate(() => {
    const f = document.getElementById('hmFold_stk_week');
    return { 있나: !!f, 폈나: f ? f.classList.contains('on') : null,
             키: f ? Math.round(f.getBoundingClientRect().height) : -1,
             머리: f ? (f.innerText || '').replace(/\s+/g, ' ').slice(0, 70) : '' };
  });
  is(F.있나 && F.폈나 === false, '폰에서는 <b>접힌 채로</b> 선다 — 홈을 안 늘립니다');
  is(F.키 > 0 && F.키 <= 90, '  접힌 키가 <b>90px 아래</b>다 — ' + F.키 + 'px');
  is(/오늘\s*\d+건/.test(F.머리) || /아직 못 읽었습니다/.test(F.머리),
     '  ★★ 머리에 <b>수가 적힌다</b> — 「' + F.머리 + '」');
  /* 세는 자가 하나인가 — 글로 묻습니다 (5번) */
  const SUB = SRC.slice(SRC.indexOf('function hmWeekSub()'), SRC.indexOf('function hmWeekBody()'));
  is(/mcalItems\(\)/.test(SUB) && /mcalDay\(/.test(SUB),
     '  세는 자는 <b>mcalItems · mcalDay 하나</b>다 — 여기서 또 안 센다 (5번)');
  is(/아직 못 읽었습니다/.test(SUB),
     '  ★ 못 읽었으면 <b>「아직 못 읽었습니다」</b> — 0 이라고 안 적는다 (1번)');
  is(!/\.from\(|fetch\(|osClient\(/.test(SUB), '  서버를 새로 안 부른다 (7번)');

  sec('[5]·[6]·[7] <b>넣는 칸이 같은 칸 안에</b> · 저장 코드를 새로 안 짰다');
  const G = await page.evaluate(async () => {
    const f = document.getElementById('hmFold_stk_week');
    const h = f && f.querySelector('.hm-fold-h'); if (h) h.click();
    await new Promise(z => setTimeout(z, 700));
    const 더하기 = [].slice.call(document.querySelectorAll('#hmFold_stk_week button'))
      .filter(b => b.offsetParent && /＋\s*일정/.test(b.textContent));
    const n0 = 더하기.length;
    if (n0) 더하기[0].click();
    await new Promise(z => setTimeout(z, 700));
    const box = document.getElementById('hmFold_stk_week');
    const btns = box ? [].slice.call(box.querySelectorAll('button')).filter(b => b.offsetParent) : [];
    return {
      더하기수: n0,
      넣는칸: !!document.querySelector('.hm-sch-f input, .hm-sch-f textarea'),
      넣기단추: btns.filter(b => /넣기|담기|저장/.test(b.textContent)).length,
      폰달력: btns.filter(b => /폰 달력|이번 달 전부|오늘 것만/.test(b.textContent)).length,
      고객: btns.filter(b => /고객 약속/.test(b.textContent)).length,
      작은: btns.filter(b => b.getBoundingClientRect().height < 44).length,
      글: (box ? box.innerText : '').replace(/\s+/g, ' ')
    };
  });
  is(G.더하기수 === 1, '★★ 「＋ 일정」 단추가 <b>하나</b>다 — ' + G.더하기수 + '개 (둘이면 서로 다른 날에 넣습니다)');
  is(G.넣는칸, '  누르면 <b>적는 칸이 펴진다</b> — 사장님 「일정추가 하기가 많이 어렵다」');
  is(G.넣기단추 >= 1 && G.넣기단추 <= 2,
     '  <b>넣는 단추는 폼에 있는 그것</b>이다 — ' + G.넣기단추 + '개 (여기서 또 안 세웁니다 · 5번)');
  const ROW = SRC.slice(SRC.indexOf('function hmSchedRow()'), SRC.indexOf('function hmSchedRow()') + 2400);
  is(/mcalMyFormHtml\(/.test(ROW) && !/\.from\(|insert\(|upsert\(/.test(ROW),
     '  ★★ <b>저장 코드를 새로 안 짰다</b> — mcalMyFormHtml 을 그대로 씁니다 (사장님 규칙)');
  is(/function hmSchedSel\(\)/.test(SRC) && /MCAL\s*&&\s*MCAL\.sel/.test(SRC) &&
     !/HM_SCHED\.sel/.test(SRC),
     '  ★★ 「어느 날인가」 를 묻는 곳이 <b>MCAL.sel 하나</b>다 (5번)');

  sec('[8]·[9] 고객 약속은 길만 · 폰 달력은 <b>되는 길만</b>');
  is(G.고객 === 1, '👤 고객 약속 단추가 선다 — ' + G.고객 + '개');
  const CUS = SRC.slice(SRC.indexOf('function hmSchedCus()'), SRC.indexOf('function hmSchedCus()') + 420);
  is(/go\('clients'\)/.test(CUS) && !/\.from\(|insert\(/.test(CUS),
     '  ★ 여기서 <b>안 담그고 길만 연다</b> — 적는 자리는 고객 창입니다 (1번 · 6번)');
  is(G.폰달력 >= 2, '📲 폰 달력으로 내보내는 단추가 선다 — ' + G.폰달력 + '개');
  /* ⚠ 처음에 「ics」 라는 <b>글자</b>를 찾았더니 제가 쪽지에 적어 둔 「.ics 면
     아이폰·갤럭시가 받습니다」 에 걸렸습니다 — 멀쩡한 자리를 고발했습니다.
     <b>만드는 코드</b>만 봅니다: 달력 파일의 머리글과 내려받기 꼴 (8번). */
  const 날코드 = ROW.replace(/\/\*[\s\S]*?\*\//g, '');
  is(/mcalDownload\(/.test(날코드) &&
     !/BEGIN:VCALENDAR|new Blob\(|createObjectURL|VEVENT/.test(날코드),
     '  ★ 내보내는 자는 <b>mcalDownload 하나</b>다 — 여기서 또 안 만듭니다 (5번)');
  is(/아이폰/.test(G.글) && /갤럭시/.test(G.글) && /네이버/.test(G.글) && /가져오기/.test(G.글),
     '  ★ <b>아이폰·갤럭시·네이버</b> 가 되는 길을 적는다 — 네이버는 「가져오기」 (1번)');
  is(!/네이버.{0,14}(연동|자동|바로 담깁니다)/.test(G.글),
     '  ★★ 네이버에 <b>직접 꽂는다고 안 적는다</b> — 없는 길을 있다고 하지 않습니다 (1번)');

  sec('[10]·[11] 맨 위 칸을 <b>정말로 줄였나</b> · 손가락이 닿나');
  const T = await page.evaluate(() => {
    const b = document.querySelector('.hm-two>button');
    const all = [].slice.call(document.querySelectorAll('.hm-two>button'));
    return { 키: b ? Math.round(b.getBoundingClientRect().height) : -1,
             수: all.length,
             작은: all.filter(x => x.getBoundingClientRect().height < 44).length };
  });
  is(T.키 > 0 && T.키 <= 80,
     '맨 위 「고객 N분」 칸이 <b>80px 아래</b>다 — ' + T.키 + 'px (전에는 86px · 사장님 「효율적으로 줄인뒤」)');
  is(T.작은 === 0, '  그래도 <b>44px 아래로는 안 내려갔다</b> — ' + T.수 + '칸 모두');
  is(G.작은 === 0, '「이번 주」 칸의 누르는 자리도 <b>44px 위</b>다');

  sec('[12] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                  : '이번 주는 한 곳이고, 접어도 수가 보이고, 그 자리에서 바로 넣습니다.');
  process.exit(bad ? 1 : 0);
})();
