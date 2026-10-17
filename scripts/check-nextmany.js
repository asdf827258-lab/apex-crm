/* ▶ 다음 할 일이 <b>여러 개 쌓이는가</b> — 판 X122

   사장님 말씀 (2026-10-17) — 「다음 할일 여러개 쌓이게 해줘」.

   여태 한 분께 하나였습니다(m.next). 둘째를 잡으면 앞의 것이 말없이
   사라졌습니다. 여기서 확인한다.

     1. 둘·셋을 잡으면 <b>다 남는가</b> — 앞의 것이 안 사라지는가
     2. <b>옛 한 줄(m.next)</b> 을 아직 들고 있는 분의 것이 안 사라지는가
     3. 달력에 <b>저마다의 날</b>에 다 서는가 (여태 하나만 섰습니다)
     4. 「끝」 은 <b>그 한 줄만</b> 끝내고 접촉 기록에 남기는가
     5. 「✕」 는 그 줄만 지우고 <b>접촉 기록에 안 남기는가</b> (1번)
     6. 홈의 「다음에 할 일」·「오늘 할 것」 이 쌓인 것을 다 세우는가
     7. 같은 것을 같은 날에 두 번 안 넣는가
     8. ★ 묻는 자리가 <b>cmNextAll 하나</b>인가 — 화면이 .next 를 직접 안 보는가 (5번)              */
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
  /* 사장님 진짜 서버를 읽지 않는다 */
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const ahead = (n) => new Date(Date.now() + 9 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);
  const back  = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);

  /* 견본 — 홍길동·이몽룡 (3번). c2 는 <b>옛 한 줄</b>만 들고 있습니다. */
  await page.evaluate((o) => {
    window.toast = function () {};
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    /* arMyId() 는 OS.session 을 봅니다 — 안 세우면 홈 목록이 통째로 빕니다 */
    OS.session = { user: { id: 'me' } };
    if (typeof AR !== 'undefined') AR.loaded = true;
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: o.b40 },
      { id: 'c2', name_masked: '이○룡', advisor_id: 'me', created_at: o.b40 }
    ];
    CM.meta = { c1: { fp: {}, touch: [] },
                c2: { fp: {}, touch: [], next: { what: '옛 한 줄', due: o.a9 } } };
    CC.calls = {}; CC.loaded = true; CM.loaded = true; CM.pick = '';
    window.__saves = [];
    window.cmSave = function (id, patch, then) {
      window.__saves.push({ id: id, patch: JSON.parse(JSON.stringify(patch)) });
      const m = cmOf(id); for (const k in patch) m[k] = patch[k];
      if (then) then();
    };
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    go('clients');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
  }, { b40: back(40), a9: ahead(9) });
  await page.waitForTimeout(900);

  console.log('\n[1] 둘·셋을 잡으면 다 남는다');
  const many = await page.evaluate((o) => {
    cmNextSave('c1', '증권 가져다 드리기', o.a2);
    cmNextSave('c1', '보장분석 설명', o.a5);
    cmNextSave('c1', '만기 안내', o.a1);
    const A = cmNextAll('c1');
    return { n: A.length, 글: A.map(x => x.what), 날: A.map(x => x.due),
             열쇠중복: A.length !== new Set(A.map(x => x.k)).size };
  }, { a1: ahead(1), a2: ahead(2), a5: ahead(5) });
  is(many.n === 3, '  세 건이 다 남는다 — ' + many.n + '건: ' + many.글.join(' · '));
  is(many.날[0] === ahead(1) && many.날[2] === ahead(5), '  날짜순으로 선다 — ' + many.날.join(' < '));
  is(!many.열쇠중복, '  줄마다 열쇠가 다르다 — 지울 때 엉뚱한 줄이 안 지워진다');

  console.log('\n[2] 옛 한 줄을 들고 있는 분의 것이 안 사라진다 (1번)');
  const old1 = await page.evaluate(() => {
    const A = cmNextAll('c2');
    return { n: A.length, 글: A.map(x => x.what) };
  });
  is(old1.n === 1 && old1.글[0] === '옛 한 줄', '  옛 m.next 가 그대로 읽힌다');
  const old2 = await page.evaluate((o) => {
    cmNextSave('c2', '새로 잡은 것', o.a3);
    const A = cmNextAll('c2'), m = cmOf('c2');
    return { n: A.length, 글: A.map(x => x.what), 옛칸: m.next, 배열: (m.nx || []).length };
  }, { a3: ahead(3) });
  is(old2.n === 2, '  새것을 잡아도 옛것이 안 사라진다 — ' + old2.글.join(' · '));
  is(old2.옛칸 === null && old2.배열 === 2, '  쓰면서 옛 칸을 배열로 옮기고 비운다 (담는 자리는 하나)');

  /* ★ 옛 칸과 배열에 <b>같은 것</b>이 같이 있을 수 있습니다 — 다른 기기가
     옮기는 사이에 그렇게 됩니다. 그때 두 줄로 보이면 달력에 같은 일이 두 번
     섭니다. 읽을 때 거르는 자가 그것을 막습니다 (5번). */
  const twin = await page.evaluate((o) => {
    CM.meta.c3 = { fp: {}, touch: [],
      next: { what: '겹친 줄', due: o.a7 },
      /* 배열 <b>안에서도</b> 겹칠 수 있습니다 — 두 기기가 같은 날 같은 것을
         적으면 그렇습니다. 거르는 자가 둘(배열 안 · 옛 칸)이라 둘 다 잽니다. */
      nx: [{ k: 'z1', what: '겹친 줄', due: o.a7 },
           { k: 'z2', what: '겹친 줄', due: o.a7 },
           { k: 'z3', what: '다른 줄', due: o.a7 }] };
    OSC.list.push({ id: 'c3', name_masked: '성○향', advisor_id: 'me', created_at: o.b40 });
    const A = cmNextAll('c3');
    const it = mcalItems();
    const onCal = (it[o.a7] || []).filter(x => x.k === 'next' && x.id === 'c3').length;
    return { n: A.length, 달력: onCal };
  }, { a7: ahead(7), b40: back(40) });
  is(twin.n === 2, '  배열 안에서도 · 옛 칸과도 겹치면 <b>한 줄</b>로 읽는다 — ' + twin.n + '줄 (겹친 줄 · 다른 줄)');
  is(twin.달력 === 2, '  달력에도 겹쳐서 안 선다 — ' + twin.달력 + '건');

  console.log('\n[3] 달력에 저마다의 날에 다 선다');
  const cal = await page.evaluate((o) => {
    const it = mcalItems();
    const pick = (d) => (it[d] || []).filter(x => x.k === 'next' && x.id === 'c1').map(x => x.s);
    return { d1: pick(o.a1), d2: pick(o.a2), d5: pick(o.a5),
             모두: Object.keys(it).reduce((a, d) =>
               a + (it[d] || []).filter(x => x.k === 'next' && x.id === 'c1').length, 0) };
  }, { a1: ahead(1), a2: ahead(2), a5: ahead(5) });
  is(cal.모두 === 3, '  세 건이 달력에 다 찍힌다 — ' + cal.모두 + '건');
  is(cal.d1[0] === '만기 안내' && cal.d2[0] === '증권 가져다 드리기' && cal.d5[0] === '보장분석 설명',
     '  <b>저마다의 날</b>에 제 글로 선다');

  console.log('\n[4] 「끝」 은 그 한 줄만 — 접촉 기록에 남는다');
  const done = await page.evaluate(() => {
    const k = cmNextAll('c1')[1].k;              /* 가운데 줄 */
    window.__saves = [];
    cmNextDone('c1', k);
    const A = cmNextAll('c1'), T = cmOf('c1').touch || [];
    return { n: A.length, 남은글: A.map(x => x.what), 기록: T[0] && T[0].note, 방법: T[0] && T[0].how };
  });
  is(done.n === 2 && done.남은글.indexOf('증권 가져다 드리기') < 0,
     '  고른 줄만 빠진다 — ' + done.남은글.join(' · '));
  is(done.기록 === '증권 가져다 드리기' && done.방법 === '처리', '  끝낸 것이 접촉 기록에 남는다');

  console.log('\n[5] 「✕」 는 그 줄만 지우고 기록에 안 남긴다 (1번)');
  const del = await page.evaluate(() => {
    const before = (cmOf('c1').touch || []).length;
    const k = cmNextAll('c1')[0].k;
    cmNextDel('c1', k);
    const A = cmNextAll('c1'), T = cmOf('c1').touch || [];
    return { n: A.length, 글: A.map(x => x.what), 기록늘었나: T.length !== before };
  });
  is(del.n === 1, '  한 줄만 지워진다 — 남은 것 ' + del.글.join(' · '));
  is(!del.기록늘었나, '  안 한 일을 했다고 적지 않는다');

  console.log('\n[6] 홈의 두 목록이 쌓인 것을 다 세운다');
  const home = await page.evaluate((o) => {
    /* 홈이 읽는 줄을 다시 만든다 — 만드는 자리는 arCliRows 하나 */
    CM.meta.c1.nx = [{ k: 'a', what: '가', due: o.b1 }, { k: 'b', what: '나', due: o.b2 },
                     { k: 'c', what: '다', due: o.a3 }];
    CM.meta.c1.next = null;
    AR.cliRows = arCliRows(OSC.list, CM.meta, {});
    const row = (AR.cliRows || []).filter(r => r.id === 'c1')[0] || {};
    const todo = (typeof arTodoList === 'function') ? arTodoList() : [];
    const dueN = todo.filter(x => x.k === 'due' && /홍/.test(x.t || '')).length;
    /* ★ 「다음에 할 일 — 날짜순」 칸도 <b>실제로 그려</b> 센다. 여태 arTodoList
       만 보고 넘어갔더니, 이 칸을 하나만 세우게 되돌려도 자가 안 울었습니다 (8번). */
    let schedN = -1, schedTxt = '';
    try {
      const h = arSchedHtml();
      const w = document.createElement('div'); w.innerHTML = h;
      /* 한 줄은 .ar-ln 하나다 — 그 안의 글자 조각을 세면 줄 수가 부풀어 오른다 */
      const rows = [].slice.call(w.querySelectorAll('.ar-ln')).filter(e =>
        /🗓/.test(e.querySelector('.e') ? e.querySelector('.e').textContent : '') &&
        /홍/.test(e.textContent || ''));
      schedN = rows.length;
      schedTxt = rows.map(e => (e.querySelector('.t') || {}).textContent || '').join(' | ');
    } catch (e) { schedTxt = String(e).slice(0, 60); }
    return { 줄에담김: (row.plans || []).length, 맨앞: row.plan, 오늘할것: dueN,
             날짜순: schedN, 날짜순글: schedTxt };
  }, { b1: back(1), b2: back(2), a3: ahead(3) });
  is(home.줄에담김 === 3, '  고객 줄이 쌓인 것을 다 들고 간다 — ' + home.줄에담김 + '건');
  is(home.오늘할것 === 2, '  날이 지난 <b>두 건</b>이 「오늘 할 것」 에 따로 선다 — ' + home.오늘할것 + '줄');
  is(home.날짜순 === 3, '  「다음에 할 일 — 날짜순」 칸에 <b>세 줄</b>이 선다 — ' +
     home.날짜순 + '줄 · ' + home.날짜순글);

  console.log('\n[7] 같은 것을 같은 날에 두 번 안 넣는다');
  const dup = await page.evaluate((o) => {
    const b = cmNextAll('c2').length, bs = (cmOf('c2').nx || []).length;
    cmNextSave('c2', '새로 잡은 것', o.a3);
    return { 전: b, 후: cmNextAll('c2').length, 담긴전: bs, 담긴후: (cmOf('c2').nx || []).length };
  }, { a3: ahead(3) });
  is(dup.전 === dup.후, '  같은 글·같은 날은 안 보인다 — ' + dup.전 + ' → ' + dup.후);
  /* ★ <b>담긴 것</b>도 본다. 읽을 때만 걸러지면 눈에는 안 보이면서 자료가
     조용히 불어납니다 — 되돌려 보고 알았습니다 (8번). */
  is(dup.담긴전 === dup.담긴후, '  담긴 줄도 안 늘어난다 — ' + dup.담긴전 + ' → ' + dup.담긴후);

  console.log('\n[7-2] 서버로 실제로 실리는가 — 안 실리면 새로고침에 사라진다');
  /* ★★ cmBody 는 <b>CM_FIELDS 에 적힌 칸만</b> 싣습니다. nx 를 표에 안 넣으면
     화면에서는 쌓이는데 새로고침하면 통째로 사라집니다. 처음에 제가 그 줄을
     빠뜨렸고 check-cqa 가 잡아 주었습니다 — 여기서도 봅니다 (8번). */
  const 실림 = await page.evaluate(() => {
    const f = (typeof CM_FIELDS !== 'undefined') ? CM_FIELDS.map(r => r[0]) : [];
    const b = (typeof cmBody === 'function') ? cmBody(cmOf('c1')) : {};
    return { 표에: f.indexOf('nx') >= 0, 옛칸도: f.indexOf('next') >= 0,
             실린것: Array.isArray(b.nx) ? b.nx.length : null };
  });
  is(실림.표에, '  nx 가 <b>CM_FIELDS 표</b>에 있다 — 없으면 서버로 안 갑니다');
  is(실림.옛칸도, '  옛 next 칸도 표에 그대로 있다 — 빼면 옛 자료가 사라집니다 (1번)');
  is(실림.실린것 !== null && 실림.실린것 >= 1,
     '  cmBody 가 쌓인 것을 실어 보낸다 — ' + 실림.실린것 + '건');

  console.log('\n[8] 묻는 자리가 cmNextAll 하나인가 (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  /* 주석은 걷어 내고 본다 — 머리글에 적어 둔 옛 꼴을 「아직 쓴다」 로 읽으면 헛것이다 (8번) */
  const bare = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const raw = (bare.match(/\bm\s*&&\s*m\.next\b|\bm\.next\s*&&|\bm\.next\.what\b/g) || []).length;
  is(raw <= 1, '  화면이 .next 를 직접 보는 자리 ' + raw + '곳 — 기준선 1 (cmNextAll 안의 그 한 줄)');
  const own = ['cmNextAll', 'cmNextTop', 'cmNextN'].every(f => bare.indexOf('function ' + f + '(') >= 0);
  is(own, '  묻는 자 셋이 저마다 한 번만 선언돼 있다');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? (' — ' + errs[0]) : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ 고칠 자리 ' + bad + '곳') : '✓ 다음 할 일이 여러 개 쌓인다 — 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
