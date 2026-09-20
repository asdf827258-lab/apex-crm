/* ══════════════════════════════════════════════════════════════════
   check-mrt.js — <b>매일 하는 일이 달력에 미리 세팅돼 있고, 체크되는가.</b>

   사장님 말씀 — 「매일 하는 일들이 쌓이고 <b>월간 캘린더에 이미 세팅이
   다 되도록</b> 해줘 — 거기서 하면, <b>한 것들은 체크가 되도록</b>」

   ── 여기서 진짜로 보는 것 ─────────────────────────────────────────
     [1] <b>이 달의 날마다</b> 미리 서 있다 — 한 날도 안 빠진다
     [2] 날을 누르면 <b>그 자리에서</b> 펴지고 체크된다
     [3] 체크한 것이 <b>실행 체크판과 같은 자리</b>에 담긴다 (5번)
         — 표를 두 벌 두면 한쪽을 고칠 때 다른 쪽이 안 따라온다
     [4] <b>앞날은 체크하지 않는다</b> (1번) — 내일 할 일을 오늘 체크해
         두면 그것이 「했다」 가 된다. 앞날에 ✓ 도 안 찍는다
     [5] 지난 날은 <b>남아 있는 기록을 보여만</b> 준다
     [6] <b>「오늘 n건」 을 부풀리지 않는다</b> — 매일 하는 일은 잡힌 약속이
         아니다. 이것까지 세면 아무것도 없는 날도 1건으로 떠서, 열어 보면
         「잡힌 것이 없습니다」 가 뜬다
     [7] 홈 「오늘 챙길 것」 에 <b>두 번 안 선다</b> (5번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8900;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SEED = `
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'member',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};
 window.osClient=function(){return null;};          /* 서버는 안 쓴다 — 담는 자리만 본다 */
 GB.loaded=true;AR.rep={};AR.loaded=true;AR.busy='';AR.err='';AR.db=[];AR.cliRows=[];AR.calls=[];
 CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 HWHO.id='';CM.pick='';CM.picked=true;go('mycal');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 930 } });
  /* CI 에는 바깥으로 나가는 길이 있습니다 — 막아 둡니다 */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  /* 지난 날 기록이 남아 있는지도 봐야 하므로 <b>어제 것</b>을 하나 심는다.
     ⚠ 어제가 언제인지는 <b>앱에게 묻습니다</b>(mcalToday). 앱은 한국시간으로
     날을 셉니다(mcalNow = 지금+9시간). 여기서 UTC 로 세면 <b>UTC 낮 15시부터
     자정까지</b>, 즉 하루의 아홉 시간 동안 하루가 어긋나 심어 놓은 것을
     못 찾고 빨간불이 켜집니다 — 실제로 그렇게 울었습니다. 날을 세는 곳은
     한 곳이어야 합니다 (5번). */
  await page.evaluate(() => {
    const t = (typeof mcalToday === 'function') ? mcalToday()
            : new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1);
    localStorage.setItem('apex_ck_day_' + d.toISOString().slice(0, 10), JSON.stringify({ d1: 1, d2: 1 }));
  });
  await page.evaluate(SEED);
  await page.waitForTimeout(900);

  const look = () => page.evaluate(() => {
    const I = mcalItems(), T = mcalToday(), ym = mcalYm();
    const last = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
    let miss = [];
    for (let d = 1; d <= last; d++) {
      const ds = ym + '-' + ('0' + d).slice(-2);
      if (!(I[ds] || []).some(x => x.k === 'rt')) miss.push(ds);
    }
    const P = document.querySelector('.mrt');
    return {
      ym: ym, last: last, miss: miss,
      cells: [...document.querySelectorAll('.mcal-grid .mcal-d:not(.off)')].length,
      dots: [...document.querySelectorAll('.mcal-grid .mcal-d:not(.off) .dots')].length,
      badge: [...document.querySelectorAll('.mcal-grid .mcal-d:not(.off) .cnt')].map(x => x.textContent),
      tdyLbl: ((document.querySelector('.mcal-tdy') || {}).textContent || '').trim(),
      panel: P ? { n: P.querySelectorAll('.mrt-it').length, on: P.querySelectorAll('.mrt-it.on').length,
                   ro: P.querySelectorAll('.mrt-it.ro').length, open: P.classList.contains('on'),
                   hd: (P.querySelector('.mrt-hd') || {}).innerText.replace(/\s+/g, ' ').trim() } : null,
      store: localStorage.getItem('apex_ck_day_' + T),
      ck: (typeof ckLoad === 'function') ? JSON.stringify(ckLoad('day')) : null,
      items: (typeof mrtItems === 'function') ? mrtItems().length : 0,
      steps: (typeof hmSteps === 'function') ? hmSteps().map(x => x.k) : []
    };
  });

  const a = await look();

  console.log('\n[1] <b>이 달의 날마다</b> 미리 서 있다');
  is(a.items >= 5, '  매일 하는 일이 있다 — ' + a.items + '가지');
  is(a.miss.length === 0, '  ' + a.last + '일 <b>한 날도 안 빠진다</b>' + (a.miss.length ? (' ← 빠진 날 ' + a.miss.join(',')) : ''));
  is(a.dots === a.cells, '  달력 칸마다 <b>점이 찍힌다</b> — ' + a.dots + '/' + a.cells);

  console.log('\n[3] 표도 담는 자리도 <b>실행 체크판과 같다</b> (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const blk = (src.split('function mrtItems(){')[1] || '').split('function mcalItems(){')[0];
  is(/CK_ITEMS\.day/.test(blk), '  할 일 표를 <b>새로 안 만들었다</b> — CK_ITEMS.day 를 그대로 쓴다');
  is(/'apex_ck_day_'/.test(blk), '  담는 자리도 <b>체크판이 쓰는 그 열쇠</b>다');
  is(/ckToggle\('day'/.test(blk), '  켤 때도 <b>체크판의 그 함수</b>를 부른다 — 서버로 올리는 자리를 안 빠뜨린다');
  is(!/\['d1','/.test(blk), '  할 일 글을 <b>여기 다시 안 적었다</b>');

  console.log('\n[2] 날을 누르면 <b>그 자리에서</b> 펴지고 체크된다');
  await page.evaluate(() => mcalPick(mcalToday())); await page.waitForTimeout(450);
  const shut = await look();
  /* <b>접혀 있어도 몇 개 했는지는 보인다.</b> 접힌 것이 「없어진 것」 으로
     보이면 안 된다 — 메뉴 묶음을 접을 때와 같은 규칙이다 (8번). */
  is(!!shut.panel && !shut.panel.open, '  처음에는 <b>접혀 있다</b> — 열한 줄을 늘 펴 두면 화면이 0.9 화면씩 길어진다');
  is(!!shut.panel && shut.panel.n === 0, '  접히면 줄이 <b>안 그려진다</b>');
  is(!!shut.panel && /\d+ \/ \d+|하루 \d+가지/.test(shut.panel.hd),
     '  접힌 줄에도 <b>몇 개 했는지 남는다</b> — 「' + (shut.panel ? shut.panel.hd.slice(0, 26) : '') + '」');
  await page.evaluate(() => mrtOpenSet(mcalToday())); await page.waitForTimeout(450);
  const b = await look();
  is(!!b.panel && b.panel.open, '  누르면 <b>펴진다</b>');
  is(!!b.panel && b.panel.n === a.items, '  오늘 칸에 <b>' + (b.panel ? b.panel.n : 0) + '줄</b>이 선다');
  is(!!b.panel && b.panel.ro === 0, '  오늘 것은 <b>눌린다</b>');
  const small = await page.evaluate(() => [...document.querySelectorAll('.mrt-it')].filter(x => x.getBoundingClientRect().height < 44).length);
  is(small === 0, '  줄이 <b>손가락으로 누를 만하다</b> (44px)');
  await page.evaluate(() => { const x = document.querySelector('.mrt-it'); if (x) x.click(); });
  await page.waitForTimeout(450);
  const c = await look();
  is(!!c.panel && c.panel.on === 1, '  누르니 <b>체크가 켜진다</b>');
  /* 칸이 아예 안 섰을 때도 <b>깨끗이</b> 빨간불이 켜져야 한다 — 여기서
     터지면 「무엇이 틀렸는지」 대신 에러 글만 남는다 (8번) */
  is(!!c.panel && /1 \/ /.test(c.panel.hd),
     '  머릿수가 <b>같이 올라간다</b> — 「' + ((c.panel && c.panel.hd) || '칸이 안 섰다').slice(0, 26) + '」');
  is(!!c.store && /"d1":1/.test(c.store), '  <b>담겼다</b> — ' + c.store);
  is(c.ck === c.store, '  <b>실행 체크판이 읽는 것과 같은 글</b>이다 — 체크판 ' + c.ck);

  console.log('\n[4] <b>앞날은 체크하지 않는다</b> (1번)');
  const fut = await page.evaluate(() => {
    const d = new Date(mcalToday() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 2);
    const ds = d.toISOString().slice(0, 10);
    /* 앞날에 기록이 <b>있는 척</b> 해 본다 — 그래도 켜지면 안 된다 */
    localStorage.setItem('apex_ck_day_' + ds, JSON.stringify({ d1: 1 }));
    mcalPick(ds); mrtOpenSet(ds); return ds;
  });
  await page.waitForTimeout(450);
  const d = await look();
  is(!!d.panel && d.panel.ro === d.panel.n, '  앞날은 <b>전부 못 누르게</b> 서 있다 — ' + (d.panel ? d.panel.ro + '/' + d.panel.n : '?'));
  is(!!d.panel && d.panel.on === 0, '  기록이 있는 척해도 <b>켜지지 않는다</b>');
  is(!!d.panel && /아직 오지 않은 날/.test(d.panel.hd), '  <b>앞날이라고 적는다</b> — 「' + (d.panel ? d.panel.hd.slice(-30) : '') + '」');
  /* 그 날에 매일 하는 일이 아예 안 서 있으면 <b>여기서도 빨간불</b>이어야
     한다 — 없는 것을 「✓ 안 찍었으니 통과」 로 읽으면 안 된다 (8번) */
  const rtDay = await page.evaluate((ds) => {
    const I = mcalItems(); const x = (I[ds] || []).filter(y => y.k === 'rt')[0];
    if (!x) return { has: false, done: false };
    return { has: true, done: (typeof mcalRtDone === 'function') && mcalRtDone([x]) };
  }, fut);
  is(rtDay.has && !rtDay.done,
     '  앞날 칸에 <b>서 있고, ✓ 는 안 찍는다</b>' + (rtDay.has ? '' : ' ← 그 날에 아예 안 서 있다'));
  /* <b>화면의 disabled 만 믿지 않는다.</b> 단추를 못 누르게 해 두어도
     함수가 열려 있으면 다른 자리에서 불러 켤 수 있다 — 막는 곳은
     mrtToggle 안이어야 한다. 그래서 <b>손으로 직접</b> 불러 본다 (8번). */
  const forced = await page.evaluate((ds) => {
    const before = localStorage.getItem('apex_ck_day_' + ds);
    localStorage.removeItem('apex_ck_day_' + ds);
    mrtToggle(ds, 'd3');
    const after = localStorage.getItem('apex_ck_day_' + ds);
    if (before === null) localStorage.removeItem('apex_ck_day_' + ds);
    else localStorage.setItem('apex_ck_day_' + ds, before);
    return { after: after, said: window.__T || '' };
  }, fut);
  is(!forced.after || forced.after === '{}',
     '  <b>손으로 불러도</b> 앞날은 안 켜진다 — 담긴 것 ' + JSON.stringify(forced.after));
  is(/오늘 것만/.test(forced.said),
     '  <b>왜 안 되는지 말한다</b> — 「' + (forced.said || '아무 말도 없다').slice(0, 40) + '」');

  console.log('\n[5] 지난 날은 <b>보여만</b> 준다');
  const yst = await page.evaluate(() => {
    const d = new Date(mcalToday() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1);
    const ds = d.toISOString().slice(0, 10); mcalPick(ds); mrtOpenSet(ds); return ds;
  });
  await page.waitForTimeout(450);
  const e = await look();
  is(!!e.panel && e.panel.on === 2, '  어제 한 <b>2건이 그대로</b> 켜져 있다 — ' + (e.panel ? e.panel.on : 0) + '건');
  is(!!e.panel && e.panel.ro === e.panel.n, '  어제 것은 <b>못 누른다</b>');
  is(!!e.panel && /지난 기록/.test(e.panel.hd), '  <b>지난 기록이라고 적는다</b>');

  console.log('\n[6] <b>「오늘 n건」 을 부풀리지 않는다</b>');
  is(a.badge.length === 0 || a.badge.every(x => x === '✓'),
     '  잡힌 것이 없는 날에는 <b>숫자를 안 붙인다</b> — ' + JSON.stringify(a.badge.slice(0, 6)));
  is(/오늘 0건/.test(a.tdyLbl), '  「오늘 n건」 도 매일 하는 일을 <b>안 센다</b> — 「' + a.tdyLbl + '」');

  console.log('\n[7] 홈 「오늘 챙길 것」 에 <b>두 번 안 선다</b> (5번)');
  is(a.steps.indexOf('rt') < 0, '  홈 줄에 안 섞인다 — ' + JSON.stringify(a.steps));

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 매일 하는 일 — 고칠 자리 ' + bad + '곳'
    : '✓ 매일 하는 일 — 달력에 미리 서 있고, 그 자리에서 체크되고, 체크판과 같은 자리에 담깁니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
