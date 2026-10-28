/* 📇 달력에서 <b>기존 고객의 상태</b>를 적는 자리 — 판 X121

   사장님 말씀 (2026-10-17) — 「캘린더 달력을 클릭해서 기존 고객의 상태를
   입력하면 <b>캘린더에 등록이 되도록</b>」.

   여기서 확인한다.

     1. 날을 누르면 <b>고객 고르개 · 상태 · 메모 · 넣기</b> 가 선다
     2. 상태 목록이 <b>CM_HOW 한 곳</b>에서 온다 — 두 벌이면 한쪽만 늘어난다 (5번)
     3. <b>지난 날·오늘</b> 에 넣으면 그 고객의 접촉 기록에 <b>그 날짜로</b> 들어간다
     4. <b>앞날</b> 에 넣으면 다음 할 일이 되고, 달력 <b>그 날</b>에 ▶ 할 일로 선다
     5. 안내 글과 실제로 하는 일이 <b>같은 자리</b>에서 갈린다 (mcalCusAhead 하나)
     6. 고객을 안 고르면 <b>아무것도 안 넣는다</b> (1번)
     7. 저장 코드를 <b>새로 안 짰다</b> — cmTouchAdd · cmNextSave 를 부른다 (5번)        */
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
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  /* 사장님 <b>진짜 서버</b>를 읽지 않는다 — 이 자리에서 나가는 길을 막는다 */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:')) return r.continue();
    return r.abort();
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 견본 — 실제 고객 이름이 아니라 홍길동·이몽룡 (3번) */
  const seed = await page.evaluate(() => {
    window.toast = function () {};
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    const day = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: day(40) },
      { id: 'c2', name_masked: '이○룡', advisor_id: 'me', created_at: day(300) }
    ];
    CM.meta = { c1: { fp: {}, touch: [] }, c2: { fp: {}, touch: [{ at: day(20), how: '전화' }] } };
    CC.calls = {}; CC.loaded = true; CM.loaded = true; CM.pick = '';
    /* 쓰는 자리는 cmSave 하나다. 여기서는 <b>서버만</b> 떼고 그대로 둔다 —
       달력이 무엇을 건네는지를 보려는 것이지 저장을 다시 짜는 게 아니다. */
    window.__saves = [];
    window.cmSave = function (id, patch, then) {
      window.__saves.push({ id: id, patch: JSON.parse(JSON.stringify(patch)) });
      const m = cmOf(id); for (const k in patch) m[k] = patch[k];
      if (then) then();
    };
    /* <b>진짜 화면</b>에서 재려고 달력을 엽니다 — 떼어 낸 div 에서 누르면
       실제로 그 자리에 단추가 섰는지를 못 봅니다 (8번). */
    if(typeof osHideLoginGate==='function')osHideLoginGate();
    go('mycal');
    if(typeof osHideLoginGate==='function')osHideLoginGate();
    return true;
  });
  await page.waitForTimeout(1200);
  if (!seed) { console.log('  ✗ 견본을 못 세웠습니다'); process.exit(1); }

  const ahead = (n) => new Date(Date.now() + 9 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);
  const back  = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);

  console.log('\n[1] 날을 누르면 고객에게 적는 칸이 선다');
  const form = await page.evaluate((d) => {
    MCAL.sel = d;
    const h = mcalDayHtml();
    const w = document.createElement('div'); w.innerHTML = h;
    const sel = w.querySelector('#mcalCusId');
    return {
      has: !!sel, hasHow: !!w.querySelector('#mcalCusHow'),
      hasNote: !!w.querySelector('#mcalCusNote'),
      hasBtn: /mcalCusPut\(\)/.test(h),
      n: sel ? sel.querySelectorAll('option').length : 0,
      names: sel ? [].slice.call(sel.querySelectorAll('option')).map(o => o.textContent) : [],
      hows: [].slice.call(w.querySelectorAll('#mcalCusHow option')).map(o => o.value)
    };
  }, back(1));
  is(form.has && form.hasHow && form.hasNote && form.hasBtn,
     '  고객 고르개 · 상태 · 메모 · 넣기 가 모두 선다');
  is(form.n === 2, '  고르개에 기존 고객이 전부 선다 — ' + form.n + '명');
  is(form.names.join(',') === '이○룡,홍○동', '  이름순으로 선다 — ' + form.names.join(' · '));

  console.log('\n[1-2] 안 고른 날에는 칸이 안 선다 — 폰이 길어지면 안 된다');
  /* ★ 늘 펴 두었더니 폰에서 248px 늘어 고객 365일 3.0→3.4 · 내 캘린더 2.0→2.3
     화면이 되었습니다(check-phonefit 가 잡았습니다). 사장님 말씀도 「달력을
     클릭해서」 였습니다 — 안 고른 날에는 0px 이어야 합니다. */
  const 안고름 = await page.evaluate(() => {
    MCAL.sel = ''; mcalPaint();
    const h = mcalDayHtml();
    return { 칸: /mcalCusId/.test(h),
             내일정: /mcalMyT/.test(h),
             화면칸: !!document.querySelector('.mcal-day .mcal-cus') };
  });
  is(!안고름.칸 && !안고름.화면칸, '  날을 안 고르면 고객 적기 칸이 <b>안 선다</b>');
  is(안고름.내일정, '  그래도 「내 일정」 칸은 그대로 선다 — 치운 길이 없다 (6번)');

  console.log('\n[2] 상태 목록은 CM_HOW 한 곳에서 온다 (5번)');
  const how = await page.evaluate(() => (typeof CM_HOW !== 'undefined') ? CM_HOW.slice() : null);
  is(!!how, '  CM_HOW 가 있다 — ' + (how || []).join(' · '));
  is(!!how && form.hows.join(',') === how.join(','),
     '  달력 고르개가 CM_HOW 와 글자 그대로 같다');

  console.log('\n[3] 지난 날에 넣으면 그 날짜로 접촉 기록이 된다');
  /* ★ <b>진짜 화면에서 진짜로 누릅니다.</b> 떼어 낸 div 에 그려 놓고 함수를
     부르면, 그 칸이 <b>실제 달력에 서 있는지</b>는 아무도 안 본 것입니다. */
  const 날누르기 = async (d) => {
    /* mcalPick 은 <b>토글</b>이다 — 이미 고른 날을 또 누르면 풀린다.
       손으로 누르는 것과 같게 하려고, 고른 것을 비우고 그 칸을 진짜로 누른다. */
    /* 달력은 <b>이번 주</b>로 열립니다 — 앞날이 그 주 밖이면 칸이 없습니다.
       달 보기로 돌리고 그 달로 옮긴 뒤에 누릅니다. */
    await page.evaluate((dd) => {
      MCAL.sel = ''; window.__saves = [];
      if (typeof mcalSetView === 'function') mcalSetView('month');
      MCAL.ym = dd.slice(0, 7);
      mcalPaint();
    }, d);
    await page.waitForTimeout(300);
    await page.click('button[onclick*="mcalPick(\'' + d + '\')"]');
    await page.waitForTimeout(500);
  };
  await 날누르기(back(1));
  const stand = await page.$('.mcal-day #mcalCusId');
  is(!!stand, '  고르개가 <b>진짜 달력 화면</b>에 서 있다');
  if (stand) {
    await page.selectOption('.mcal-day #mcalCusId', 'c1');
    await page.selectOption('.mcal-day #mcalCusHow', '만남');
    await page.fill('.mcal-day #mcalCusNote', '증권 보여 드림');
  }
  /* 단추는 이 칸 안의 「넣기」 — 손가락으로 누르듯 누른다 */
  if (stand) await page.click('.mcal-day .mcal-cus button.mcal-add-b');
  await page.waitForTimeout(700);
  const past = await page.evaluate(() => {
    const s = window.__saves.slice();
    const t = (cmOf('c1').touch || [])[0] || {};
    return { n: s.length, key: s[0] ? Object.keys(s[0].patch).join(',') : '',
             id: s[0] ? s[0].id : '', at: t.at, how: t.how, note: t.note };
  });
  is(past.n === 1 && past.id === 'c1', '  고른 고객에게 한 번만 쓴다');
  is(past.key === 'touch', '  접촉 기록(touch)으로 들어간다 — ' + past.key);
  is(past.at === back(1), '  <b>고른 날짜</b>로 들어간다 — ' + past.at + ' (오늘이 아님)');
  is(past.how === '만남' && past.note === '증권 보여 드림', '  고른 상태와 적은 말이 그대로 담긴다');

  console.log('\n[4] 앞날에 넣으면 다음 할 일이 되고, 달력 그 날에 선다');
  await 날누르기(ahead(4));
  await page.selectOption('.mcal-day #mcalCusId', 'c2');
  await page.selectOption('.mcal-day #mcalCusHow', '전화');
  await page.fill('.mcal-day #mcalCusNote', '보장분석 설명');
  await page.click('.mcal-day .mcal-cus button.mcal-add-b');
  await page.waitForTimeout(900);
  const fut = await page.evaluate((d) => {
    const s = window.__saves.slice();
    const it = mcalItems();
    const row = (it[d] || []).filter(x => x.k === 'next' && x.id === 'c2')[0] || null;
    /* ★ <b>눈에 실제로 보이나</b> — 자료에만 있고 화면에 안 서면 등록이 안 된 것이다 */
    const seen = [].slice.call(document.querySelectorAll('.mcal-day .mcal-it'))
      .some(e => /보장분석 설명/.test(e.textContent || ''));
    return { key: s[0] ? Object.keys(s[0].patch).join(',') : '',
             /* ★ 판 X122 부터 다음 할 일은 <b>쌓입니다</b> — 묻는 곳은 cmNextAll 하나 (5번).
                옛 m.next 를 직접 보던 자리를 그대로 옮깁니다. 무르게 한 것이 아니라,
                재는 대상이 한 칸에서 목록으로 바뀐 것입니다. */
             due: (cmNextTop('c2') || {}).due,
             what: (cmNextTop('c2') || {}).what,
             쌓임: cmNextAll('c2').length,
             onCal: !!row, calTxt: row ? (row.s || '') : '', seen: seen };
  }, ahead(4));
  is(/\bnx\b/.test(fut.key), '  다음 할 일 목록(nx)으로 들어간다 — ' + fut.key);
  is(fut.쌓임 === 1, '  이 고객의 첫 건이다 — ' + fut.쌓임 + '건');
  is(fut.due === ahead(4), '  기한이 <b>고른 날</b>이다 — ' + fut.due);
  is(fut.what === '전화 — 보장분석 설명', '  무엇을 할지가 적힌다 — ' + fut.what);
  is(fut.onCal, '  ★ <b>달력 그 날에 ▶ 할 일로 선다</b> — 등록이 실제로 됩니다');
  is(fut.calTxt === '전화 — 보장분석 설명', '  달력에 적힌 글이 저장한 것과 같다');
  is(fut.seen, '  ★ 넣자마자 <b>그 날 칸에 눈으로 보인다</b> — 다시 열지 않아도 됩니다');

  console.log('\n[5] 안내와 결과가 같은 자리에서 갈린다 (5번)');
  const says = await page.evaluate((o) => {
    const g = (d) => { MCAL.sel = d; return mcalDayHtml(); };
    return { ahead: /앞날/.test(g(o.a)) && /다음 할 일/.test(g(o.a)),
             past: /접촉 기록/.test(g(o.b)),
             today: /접촉 기록/.test(g(o.t)),
             one: typeof mcalCusAhead === 'function',
             aFn: mcalCusAhead(o.a), bFn: mcalCusAhead(o.b), tFn: mcalCusAhead(o.t) };
  }, { a: ahead(4), b: back(1), t: await page.evaluate(() => mcalToday()) });
  is(says.ahead, '  앞날 칸은 「앞날 · 다음 할 일」 이라 적는다');
  is(says.past && says.today, '  지난 날·오늘 칸은 「접촉 기록」 이라 적는다');
  is(says.one && says.aFn === true && says.bFn === false && says.tFn === false,
     '  판정하는 자리는 mcalCusAhead 하나다 — 오늘은 앞날이 아니다');

  console.log('\n[6] 고객을 안 고르면 아무것도 안 넣는다 (1번)');
  await 날누르기(back(1));
  await page.evaluate(() => { document.querySelector('.mcal-day #mcalCusId').value = ''; });
  await page.click('.mcal-day .mcal-cus button.mcal-add-b');
  await page.waitForTimeout(500);
  const none = await page.evaluate(() => window.__saves.length);
  is(none === 0, '  고객이 비면 저장이 한 번도 안 일어난다');

  console.log('\n[7] 저장 코드를 새로 안 짰다 (5번 · 사장님 말씀)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const i = src.indexOf('function mcalCusPut(');
  const body = src.slice(i, src.indexOf('\nfunction ', i + 10));
  is(/cmTouchAdd\(/.test(body) && /cmNextSave\(/.test(body),
     '  mcalCusPut 은 cmTouchAdd · cmNextSave 를 부른다');
  is(!/cmSave\s*\(/.test(body) && !/saved_reports/.test(body),
     '  제 손으로 cmSave·서버를 부르지 않는다');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? (' — ' + errs[0]) : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ 고칠 자리 ' + bad + '곳') : '✓ 달력에서 고객 상태 적기 — 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
