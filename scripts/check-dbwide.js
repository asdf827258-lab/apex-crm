/* ══════════════════════════════════════════════════════════════════
   check-dbwide.js — <b>DB 목록이 한눈에 들어오는가.</b>

   사장님 말씀: 「DB 관리에서 칸이 엄청 띄어져 있어서 한눈에 안 들어온다.」

   재 보니 그랬습니다 (2026-09-18, 창 1280px) —

     쓸 수 있는 자리 <b>940px</b>  ·  표가 필요한 폭 <b>1,227px</b>
     그중 <b>312px</b> 이 순전히 좌우 여백이었습니다 (칸 열셋 × 24px).

   칸이 열셋이라 옆으로 밀렸고, 고객 앞에서 표를 손가락으로 밀며 찾는
   동안 대화가 끊깁니다.

   ── 고친 두 갈래 ──────────────────────────────────────────────────
     ① <b>여백을 줄였다</b> — 좌우만 12px→7px. 위아래(10px)는 손가락이
        누를 크기라 그대로. 날짜는 여덟 자로, 줄마다 되풀이되던
        「무엇을 할까요 ›」 는 넓은 화면에서 <b>›</b> 만.
     ② <b>서랍을 접는 길</b>을 냈다 — 「⇔ 넓게」. 글자는 더 못 줄인다
        (이 화면은 13px 아래 글자를 하나도 안 두기로 했다). 남은 자리는
        서랍 242px 뿐이라, <b>없애지 않고 접는다.</b>

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 넓은 화면(1440)에서 <b>서랍을 편 채로도</b> 표가 안 샌다
     [2] 「⇔ 넓게」 단추가 있고, 누르면 <b>1280 에서도</b> 안 샌다
     [3] 고르신 것이 <b>기억된다</b> — 다시 열면 그대로
     [4] 폰에서는 그 단추를 <b>안 보여 준다</b> — 서랍이 이미 접혀 있다
     [5] 좁히려고 <b>글자를 줄이지 않았다</b> — 13px 아래가 하나도 없다
     [6] 날짜가 <b>연도를 안 버렸다</b> — 배정일은 해가 넘어가면 뜻이 달라진다 (1번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8997;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안입니다 (3번). 칸이 다 차야 폭을 제대로 잽니다 —
   빈 칸만 있는 표는 좁게 나와 <b>잰 값이 거짓말을 합니다.</b> */
const SEED = `
  document.getElementById('configScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  window.toast=function(){};
  profile={id:'me',name:'홍길동',role:'admin',active:true};
  profiles=[profile]; dbSources=['일반','개척'];
  DBL={loaded:true,busy:false,err:''};
  dbs=[{id:'d1',assigned_to:'me',customer_name:'홍길순',phone:'010-0000-0001',stage:'부재',
        source:'일반',assigned_date:'2026-09-01',region:'순천시'},
       {id:'d2',assigned_to:'me',customer_name:'홍말순',phone:'010-0000-0002',stage:'미접촉',
        source:'개척',assigned_date:'2025-12-31',region:'여수시'},
       {id:'d3',assigned_to:'me',customer_name:'홍삼순',phone:'010-0000-0003',stage:'TA',
        source:'일반',assigned_date:'2026-08-11',region:'광양시'}];
  calls=[]; crmTeams=[];crmTeamOf={};cliKeys={};attendance=[];attErr=null;
  fillProfiles();fillSources();fillStages(); goPage('db'); renderAll();`;

/* 표가 제 틀 밖으로 나가나 — <b>틀 안쪽 폭</b>과 <b>틀 폭</b>을 견준다.
   문서 전체 폭을 보면 다른 것 때문에 넘친 것까지 이 표 탓이 된다 (8번). */
const measure = (page, seed) => page.evaluate((s) => {
  if (s) (0, eval)(s);
  const wrap = document.querySelector('#dbBody').closest('.table-wrap');
  const btn = document.getElementById('wideBtn');
  const tds = [...document.querySelectorAll('#dbBody td')];
  const small = tds.filter(t => parseFloat(getComputedStyle(t).fontSize) < 13).length +
    [...document.querySelectorAll('#dbBody td *')]
      .filter(e => { const f = parseFloat(getComputedStyle(e).fontSize); return f > 0 && f < 13; }).length;
  const dateTd = document.querySelector('#dbBody td[data-th="배정일"]');
  const row = document.querySelector('#dbBody tr');
  const padSum = row ? [...row.querySelectorAll('td')].reduce((t, td) => {
    const c = getComputedStyle(td); return t + parseFloat(c.paddingLeft) + parseFloat(c.paddingRight); }, 0) : 0;
  return {
    wrapW: Math.round(wrap.getBoundingClientRect().width),
    need: wrap.scrollWidth,
    wide: document.getElementById('app').classList.contains('wide'),
    btn: btn ? (btn.textContent || '').trim() : '(없음)',
    btnSeen: btn ? (btn.getBoundingClientRect().width > 0) : false,
    small: small,
    date: dateTd ? (dateTd.textContent || '').trim() : '(없음)',
    padSum: Math.round(padSum)
  };
}, seed);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();

  /* ── [1] 넓은 화면 — 서랍을 편 채로도 ── */
  console.log('\n[1] 넓은 화면(1440)에서 <b>서랍을 편 채로도</b> 표가 안 샌다');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const A = await measure(page, SEED);
  is(A.need <= A.wrapW,
     '  1440 에서 <b>한눈에</b> — 자리 ' + A.wrapW + 'px · 표 ' + A.need + 'px' +
     (A.need > A.wrapW ? (' (' + (A.need - A.wrapW) + 'px 넘침)') : ''));
  is(!A.wide, '  처음에는 서랍이 <b>펼쳐져</b> 있다 — 「메뉴가 어디 갔지」가 안 된다');

  /* ── 폭과 <b>빽빽함</b>은 다른 이야기다 ──────────────────────────
     사장님 말씀은 「칸이 엄청 띄어져 있다」 였다. 표가 틀 안에 들어가도
     칸마다 빈자리가 넓으면 <b>눈이 한 번에 못 담는다.</b> 그래서 <b>줄 하나의
     좌우 여백을 다 합쳐</b> 잰다 — 열셋이면 12px 씩일 때 312px 이었다.
     px 을 하나 못 박지 않고 <b>총량</b>으로 재는 것은, 칸이 하나 늘거나
     줄어도 이 점검이 헛알람을 안 내게 하려는 것이다 (8번). */
  console.log('\n[1-2] 칸이 <b>너무 띄어져 있지 않다</b>');
  is(A.padSum <= 200,
     '  줄 하나의 좌우 여백을 <b>다 합쳐 ' + A.padSum + 'px</b> 이다 (200px 아래 · 예전 312px)');

  /* ── [5] 글자를 줄여서 좁힌 것이 아니다 ── */
  console.log('\n[5] 좁히려고 <b>글자를 줄이지 않았다</b>');
  is(A.small === 0, '  13px 아래 글자가 <b>하나도 없다</b> — ' + A.small + '곳');

  /* ── [6] 날짜가 연도를 안 버렸다 ── */
  console.log('\n[6] 날짜가 <b>연도를 안 버렸다</b> (1번)');
  is(/^\d{2}\.\d{2}\.\d{2}$/.test(A.date),
     '  배정일이 <b>짧아졌지만 연도가 남았다</b> — ' + A.date);
  is(A.date.length <= 8, '  여덟 자 안이다 — ' + A.date.length + '자');
  await ctx.close();

  /* ── [2][3] 좁은 화면 — 넓게 보기 ── */
  console.log('\n[2] 「⇔ 넓게」로 <b>1280 에서도</b> 안 샌다');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errs.push(e.message));
  await p2.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1400);
  const B = await measure(p2, SEED);
  is(B.btn === '⇔ 넓게', '  위 띠에 <b>「⇔ 넓게」</b> 단추가 있다 — ' + B.btn);
  is(B.btnSeen, '  <b>눈에 보인다</b> — 숨어 있으면 없는 것과 같다');
  /* <b>실제로 누른다.</b> 함수를 직접 부르면 단추가 안 이어져 있어도 통과한다 (8번) */
  await p2.click('#wideBtn');
  await p2.waitForTimeout(450);
  const C = await measure(p2, null);
  is(C.wide, '  누르면 <b>서랍이 접힌다</b>');
  is(C.btn === '⇔ 좁게', '  단추 글자가 <b>돌아가는 길</b>을 말한다 — ' + C.btn);
  is(C.need <= C.wrapW,
     '  1280 에서도 <b>한눈에</b> — 자리 ' + C.wrapW + 'px · 표 ' + C.need + 'px' +
     (C.need > C.wrapW ? (' (' + (C.need - C.wrapW) + 'px 넘침)') : ''));
  is(C.wrapW > B.wrapW, '  자리가 <b>실제로 늘었다</b> — ' + B.wrapW + 'px → ' + C.wrapW + 'px');

  console.log('\n[3] 고르신 것이 <b>기억된다</b>');
  await p2.reload({ waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1400);
  const D = await measure(p2, SEED);
  is(D.wide, '  다시 열어도 <b>넓게</b> 그대로다');
  is(D.btn === '⇔ 좁게', '  단추 글자도 그 상태를 말한다 — ' + D.btn);
  /* 도로 좁게 — 담아 둔 것이 <b>양쪽 다</b> 기억되는지 본다 */
  await p2.click('#wideBtn');
  await p2.waitForTimeout(300);
  await p2.reload({ waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1400);
  const E = await measure(p2, SEED);
  is(!E.wide, '  <b>도로 좁게</b>도 기억된다 — 한쪽만 기억하면 못 돌아온다');
  await ctx2.close();

  /* ── [4] 폰 ── */
  console.log('\n[4] 폰에서는 그 단추를 <b>안 보여 준다</b>');
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx3.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p3 = await ctx3.newPage();
  p3.on('pageerror', e => errs.push(e.message));
  await p3.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await p3.waitForTimeout(1400);
  const F = await measure(p3, SEED);
  is(!F.btnSeen, '  폰에서는 <b>안 보인다</b> — 서랍이 이미 접혀 있어 누를 일이 없다');
  await ctx3.close();

  console.log('\n[7] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '자리' : '✓ DB 목록이 한눈에 — 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
