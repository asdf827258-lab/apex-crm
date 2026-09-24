/* ══════════════════════════════════════════════════════════════════
   check-navez.js — <b>서랍을 열었을 때 처음 보는 것.</b>

   사장님 말씀 — 「메뉴가 너무 많아서 효율적인 방안을 찾고 개선해보자.
   <b>단 하나도 빼놓지 말고</b>, 정확히 하나씩 분류해서 토스 어플처럼 쉽게」.

   ── 실제로 이랬습니다 ────────────────────────────────────────────
   그 말씀에 <b>간편 버전</b>을 만들어 두었습니다. 96개를 「언제 여는가」
   여섯 갈래로 하나도 안 빼고 나눠 놓고, 그중 매일 여는 것만 세웁니다.
   그런데 <b>꺼진 채로</b> 두었습니다 — 처음 여시는 분은 여전히
   <b>4,199px(화면 다섯 개)</b> 짜리 서랍을 보셨습니다. 켜면 1,202px 입니다.
   <b>만들어 놓고 안 켜면 없는 것과 같습니다.</b>

   그리고 여섯 갈래 중 <b>📣 고객 늘리기</b> 하나는 뽑힌 화면이 아예
   없어서, 간편을 켜도 그 갈래가 <b>통째로 안 섰습니다.</b> 사장님은
   매일 올리시는데, 매일 여는 것만 세우는 자리에서 빠져 있었습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>처음 여는 분</b>은 간편으로 연다 — 그리고 확 짧다
     [2] <b>고른 것이 이긴다</b> — 「전체」 를 누르면 다음에도 전체
     [3] <b>빈 갈래가 없다</b> — 여섯이 다 선다 (대표 기준)
     [4] 뽑아 둔 것이 <b>실제로 다 선다</b> — 조용히 빠진 것이 없다
     [5] ★ <b>아무것도 안 지운다</b> — 찾기로 나오고 · 「전체」 로 다 돌아온다
     [6] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8968;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> (3번). 대표로 봅니다 — 설정·출발 점검은 대표만
   볼 수 있어서, 설계사로 재면 그 갈래가 비는 것이 <b>맞는</b> 일입니다. */
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.osLoadClients=function(){};window.cmLoadAll=function(cb){if(cb)cb();};
 OSC.loaded=true;OSC.list=[];AR.loaded=true;AR.db=[];AR.cliRows=[];CM.loaded=true;
 try{localStorage.setItem('apex_guide_seen_v2','1');localStorage.removeItem('apex_nav_easy_v1');}catch(e){}
`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(SEED);

  console.log('\n[1] <b>처음 여는 분</b>은 간편으로 연다 — 그리고 확 짧다');
  const A = await page.evaluate(async () => {
    try { localStorage.removeItem('apex_nav_easy_v1'); } catch (e) {}
    renderNav(); toggleNav(); await new Promise(r => setTimeout(r, 600));
    const body = document.getElementById('navBody');
    const ez = { on: ezOn(), h: Math.round(body.scrollHeight) };
    ezSet(false); await new Promise(r => setTimeout(r, 500));
    ez.full = Math.round(document.getElementById('navBody').scrollHeight);
    return ez;
  });
  is(A.on === true, '  아직 안 고르셨으면 <b>간편</b>으로 연다 — 만들어 놓고 안 켜면 없는 것과 같다');
  is(A.h > 0 && A.h <= A.full / 2,
     '  서랍이 <b>절반 아래</b>로 짧아진다 — ' + A.h + 'px / 전체 ' + A.full + 'px');
  is(A.h <= 1600, '  <b>두 화면 안</b>에 든다 — ' + A.h + 'px (고치기 전 ' + A.full + 'px · 화면 다섯 개)');

  console.log('\n[2] <b>고른 것이 이긴다</b>');
  const C = await page.evaluate(async () => {
    /* 위에서 「전체」 를 눌러 두었다 — 다시 그려도 전체여야 한다 */
    renderNav(); await new Promise(r => setTimeout(r, 400));
    const keepFull = ezOn();
    ezSet(true); renderNav(); await new Promise(r => setTimeout(r, 400));
    const keepEz = ezOn();
    return { keepFull, keepEz };
  });
  is(C.keepFull === false, '  「전체」 를 고르면 <b>다시 열어도 전체</b> — 기본값은 안 고르셨을 때만 쓴다');
  is(C.keepEz === true, '  「간편」 을 고르면 <b>다시 열어도 간편</b>');

  console.log('\n[3] <b>빈 갈래가 없다</b> — 여섯이 다 선다 (대표 기준)');
  const G = await page.evaluate(() => {
    const all = NAV_WHEN_G.map(w => w.t);
    const got = ezGroups().map(g => g.group);
    return { all, got, empty: all.filter(t => got.indexOf(t) < 0),
             n: ezGroups().reduce((a, g) => a + g.items.length, 0) };
  });
  is(G.empty.length === 0,
     '  여섯 갈래가 <b>다 선다</b> — ' + G.got.join(' · ') +
     (G.empty.length ? (' ← 빈 갈래: ' + G.empty.join(',')) : ''));
  is(G.n >= 10 && G.n <= 20,
     '  세우는 것은 <b>매일 여는 것만</b> — ' + G.n + '개 (너무 적으면 못 쓰고, 많으면 간편이 아니다)');

  console.log('\n[4] 뽑아 둔 것이 <b>실제로 다 선다</b>');
  const P = await page.evaluate(() => {
    const ids = []; visibleTabs().forEach(g => g.items.forEach(it => ids.push(it.id)));
    const shown = []; ezGroups().forEach(g => g.items.forEach(it => shown.push(it.id)));
    return { ghost: EZ_PICK.filter(id => ids.indexOf(id) < 0),
             notShown: EZ_PICK.filter(id => shown.indexOf(id) < 0),
             dup: EZ_PICK.filter((x, i) => EZ_PICK.indexOf(x) !== i) };
  });
  is(P.ghost.length === 0,
     '  뽑아 둔 것이 <b>메뉴에 다 있다</b>' + (P.ghost.length ? (' ← 없는 것: ' + P.ghost.join(',')) : '') +
     ' (실제로 settings 가 조용히 빠져 있었다)');
  is(P.notShown.length === 0,
     '  <b>하나도 안 빠지고</b> 선다' + (P.notShown.length ? (' ← ' + P.notShown.join(',')) : ''));
  is(P.dup.length === 0, '  같은 것을 <b>두 번 적지 않았다</b> (5번)' + (P.dup.length ? (' ← ' + P.dup.join(',')) : ''));

  console.log('\n[5] ★ <b>아무것도 안 지운다</b>');
  const K = await page.evaluate(async () => {
    ezSet(true); renderNav(); await new Promise(r => setTimeout(r, 500));
    const bar = (document.querySelector('.nav-ez-note') || {}).innerText || '';
    const cnt = (document.querySelector('.nav-ez-n') || {}).innerText || '';
    /* 간편에 <b>안 보이는</b> 화면을 찾기로 쳐 본다 — 나와야 한다 */
    const hidden = EZ_PICK.indexOf('blog') < 0 ? 'blog' : 'threads';
    navFind('블로그'); await new Promise(r => setTimeout(r, 400));
    const found = !!document.querySelector('#navBody [data-tab="' + hidden + '"]');
    navFind(''); await new Promise(r => setTimeout(r, 300));
    /* 「전체」 한 번이면 다 돌아온다 */
    ezSet(false); await new Promise(r => setTimeout(r, 500));
    const back = document.querySelectorAll('#navBody .tab-btn').length;
    ezSet(true); await new Promise(r => setTimeout(r, 400));
    const few = document.querySelectorAll('#navBody .tab-btn').length;
    return { bar, cnt, found, back, few };
  });
  is(K.found, '  간편에 <b>없는 화면도 찾기로 나온다</b> — 찾기는 언제나 전부에서 찾는다');
  is(/없어진 것이 아닙니다/.test(K.bar), '  <b>없어진 것이 아니라고</b> 적는다 (1번)');
  is(/\d+ *\/ *\d+/.test(K.cnt), '  <b>몇 개 중 몇 개</b>인지 적는다 — ' + K.cnt.replace(/\s+/g, ' '));
  is(K.back > K.few && K.few > 0,
     '  「전체」 한 번이면 <b>다 돌아온다</b> — 간편 ' + K.few + '개 → 전체 ' + K.back + '개');

  console.log('\n[6] 조용히 터지지 않았나');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource/i.test(x));
  is(real.length === 0, '  콘솔 오류 없음' + (real.length ? (' ← ' + real[0]) : ''));

  await ctx.close(); await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 서랍은 간편으로 열리고, 여섯 갈래가 다 서고, 하나도 안 없어졌습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
