/* ══════════════════════════════════════════════════════════════════
   check-hmsheet.js — <b>홈에서 안 벗어나고 오늘 미션을 끝내는가.</b>

   사장님 말씀: 「홈화면에서 벗어나지 않고 오늘의 미션을 다 마무리하고 싶다.」

   여태는 「무엇을 할까요?」 에서 도구를 고르면 go() 가 <b>홈을 헐고</b> 그
   화면으로 갔습니다. 돌아오려면 메뉴를 찾아 홈을 누르고, 그러고 나서
   <b>몇 건 중 몇 번째였는지를 다시 찾아야</b> 했습니다. 열 건이면 화면을
   스무 번 옮겨 다닙니다.

   이제 <b>덮습니다.</b> 홈은 아래 그대로 서 있고 닫으면 그 자리입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 사장님이 정하신 도구가 <b>갈래로 다 선다</b> (AP 여섯)
     [2] 도구를 누르면 <b>덮개</b>가 뜨고 <b>그 파일</b>을 문다
     [3] 덮개에 <b>앱을 다시 싣지 않는다</b> — 4.3MB 를 또 읽지 않는다 (7번)
     [4] 덮개 아래 <b>홈이 그대로</b> 있다 — 헐지 않는다
     [5] 「닫기」 면 <b>같은 자리</b>로 돌아온다
     [6] 「✓ 했습니다」 면 <b>오늘 한 것</b>으로 표시되고 다음 건으로 간다
     [7] 주소가 없는 도구는 <b>돌아오는 띠</b>가 선다
     [8] 홈으로 오면 <b>띠가 사라진다</b> — 메뉴로 오셔도
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8873;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안입니다 (3번). arLoad 를 세워 둡니다 — CI 에는
   네트워크가 있어 진짜 요청이 늦게 돌아와 AR.db 를 빈 것으로 덮습니다. */
const SEED = `
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
  window.arLoad=function(){};
  AR.loaded=true; AR.busy=false; AR.cliRows=[];
  AR.db=[
    {id:'d1',who:'me',name:'홍길순',region:'광주',src:'일반',stage:'AP',
     appt:'',days:10,n:2,cAt:'',pAt:''},
    {id:'d2',who:'me',name:'홍말순',region:'광주',src:'일반',stage:'거절',
     appt:'',days:20,n:1,cAt:'',pAt:''}];
  window.toast=function(){};
  if(typeof OSC!=='undefined'){OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=OSC.list||[];}
  window.osLoadClients=function(){};
  go('home');`;

const look = (page) => page.evaluate(() => {
  const sh = document.getElementById('hmSheet');
  const fr = document.getElementById('hmShFrame');
  const bar = document.getElementById('hmBack');
  const now = document.querySelector('#dynPane .hm-now');
  const opts = [...document.querySelectorAll('#dynPane .hm-now .hm-ask-o')];
  return {
    sheetOn: !!(sh && sh.classList.contains('on')),
    src: fr ? (fr.getAttribute('src') || '') : '',
    barOn: !!(bar && bar.style.display === 'flex'),
    barTxt: bar ? (bar.textContent || '').replace(/\s+/g, ' ').trim() : '',
    homeAlive: !!now,
    head: now ? (now.querySelector('.hm-now-k') || {}).textContent || '' : '',
    opts: opts.map(b => (b.textContent || '').replace(/\s+/g, ' ').trim()),
    shHead: sh ? (sh.textContent || '').replace(/\s+/g, ' ').trim() : ''
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  /* 바깥은 막습니다 — CI 에는 네트워크가 있어 진짜 요청이 나갑니다 (8번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  const booted = await page.evaluate(() =>
    typeof hmSheetOpen === 'function' && typeof hmSheetUrl === 'function' && typeof hmPick === 'function');
  if (!booted) {
    console.log('✗ 덮개를 여는 곳이 없습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }
  await page.evaluate(SEED);
  await page.waitForTimeout(700);

  /* ── [1] 갈래 ── */
  console.log('\n[1] 사장님이 정하신 도구가 <b>갈래로 다 선다</b>');
  const A = await look(page);
  is(A.homeAlive, '  홈에 <b>「지금 이것」</b> 이 섰다');
  /* ── 이름을 <b>여기 손으로 적지 않는다</b> ─────────────────────────
     적어 뒀다가 실제로 낡았다. 다른 PR 이 메뉴에서 「재무설계 상담자료」
     를 <b>「재무&보장 상담자료」</b> 로 바꾸자, 화면은 멀쩡한데 이 점검만
     빨간불이 켜졌다 — <b>헛것을 잡는 점검</b>이 된 것이다 (8번).

     그래서 <b>그 단계가 무엇을 쥐는지는 apex-stage.js</b> 에 묻고,
     <b>그 이름이 무엇인지는 메뉴</b>(navItemOf)에 묻는다. 둘 다 앱이
     실제로 쓰는 곳이라, 이름을 바꾸면 이 점검도 저절로 따라온다 (5번). */
  const want = await page.evaluate(() => {
    const ids = (window.APEX_STAGE && APEX_STAGE.map && APEX_STAGE.map['AP'])
      ? (APEX_STAGE.map['AP'].tools || []) : [];
    return ids.map(id => {
      const it = (typeof navItemOf === 'function') ? navItemOf(id) : null;
      return it ? (it.title || '') : '';
    }).filter(Boolean);
  });
  is(want.length >= 5, '  AP 가 쥘 도구를 <b>표에서 읽었다</b> — ' + want.length + '가지 · ' + want.join(' / '));
  const miss = want.filter(t => !A.opts.some(o => o.indexOf(t) >= 0));
  is(want.length > 0 && miss.length === 0,
     '  AP 에서 <b>' + want.length + '가지</b>가 다 보인다' + (miss.length ? (' ← 빠진 것 ' + miss.join(' / ')) : ''));

  /* ── [2][3][4] 덮개 ── */
  console.log('\n[2] 도구를 누르면 <b>덮개</b>가 뜨고 <b>그 파일</b>을 문다');
  /* <b>실제 단추를 누른다</b> — 함수를 직접 부르면 안 이어져 있어도 통과한다 (8번) */
  const at = A.opts.findIndex(o => o.indexOf('보장분석 상담자료') >= 0);
  await page.evaluate((i) => document.querySelectorAll('#dynPane .hm-now .hm-ask-o')[i].click(), at);
  await page.waitForTimeout(500);
  const B = await look(page);
  is(B.sheetOn, '  덮개가 <b>떴다</b>');
  is(/상담자료/.test(decodeURIComponent(B.src)),
     '  덮개가 <b>보장분석 상담자료</b>를 물었다 — ' + decodeURIComponent(B.src).slice(0, 60));
  console.log('\n[3] 덮개에 <b>앱을 다시 싣지 않는다</b> (7번)');
  is(B.src.indexOf('index.html') < 0 || B.src.indexOf('app/index.html') < 0,
     '  덮개가 <b>app/index.html 을 다시 물지 않는다</b> — 4.3MB 를 또 읽지 않는다');
  console.log('\n[4] 덮개 아래 <b>홈이 그대로</b> 있다');
  is(B.homeAlive, '  홈이 <b>안 헐렸다</b> — 닫으면 그 자리다');
  is(/몇|건|번째/.test(B.shHead) || /번째/.test(B.shHead),
     '  덮개 머리줄이 <b>몇 건 중 몇 번째</b>인지 말한다 — ' + B.shHead.slice(0, 40));

  /* ── [5] 닫기 ── */
  console.log('\n[5] 「닫기」 면 <b>같은 자리</b>로 돌아온다');
  await page.evaluate(() => [...document.querySelectorAll('#hmSheet .hmsh-x')][0].click());
  await page.waitForTimeout(400);
  const C = await look(page);
  is(!C.sheetOn, '  덮개가 <b>사라졌다</b>');
  is(C.homeAlive && C.head === A.head,
     '  <b>같은 자리</b>다 — ' + (C.head || '(없음)').replace(/\s+/g, ' ').trim());

  /* ── [6] 했습니다 ── */
  console.log('\n[6] 「✓ 했습니다」 면 <b>오늘 한 것</b>으로 표시된다');
  await page.evaluate((i) => document.querySelectorAll('#dynPane .hm-now .hm-ask-o')[i].click(), at);
  await page.waitForTimeout(400);
  const D = await page.evaluate(() => {
    const k = (hmNext().x || {}).key || '';
    const before = hmIsDone(k);
    [...document.querySelectorAll('#hmSheet .hmsh-did')][0].click();
    return { k: k, before: before };
  });
  await page.waitForTimeout(400);
  const E = await page.evaluate((k) => ({ done: hmIsDone(k), sheetOn: !!(document.getElementById('hmSheet') || {}).classList?.contains('on') }), D.k);
  is(!D.before && E.done, '  그 건이 <b>오늘 한 것</b>으로 표시됐다');
  is(!E.sheetOn, '  덮개가 <b>닫혔다</b>');

  /* ── [7][8] 주소 없는 도구 — 돌아오는 띠 ── */
  console.log('\n[7] 주소가 없는 도구는 <b>돌아오는 띠</b>가 선다');
  const F = await page.evaluate(() => {
    const o = [...document.querySelectorAll('#dynPane .hm-now .hm-ask-o')];
    const i = o.findIndex(b => (b.textContent || '').indexOf('고객에게 전할 뉴스') >= 0);
    if (i >= 0) o[i].click();
    return { i: i, opts: o.map(b => (b.textContent || '').replace(/\s+/g, ' ').trim()) };
  });
  await page.waitForTimeout(600);
  const G = await look(page);
  is(F.i >= 0, '  <b>「고객에게 전할 뉴스」</b> 갈래가 있다' + (F.i < 0 ? (' ← ' + F.opts.join(' | ').slice(0, 90)) : ''));
  is(G.barOn, '  <b>돌아오는 띠</b>가 섰다');
  is(/홈/.test(G.barTxt) && /했습니다/.test(G.barTxt),
     '  띠가 <b>「✓ 했습니다」 와 「← 홈」</b> 을 함께 준다 — ' + G.barTxt.slice(0, 50));
  is(!G.sheetOn, '  이것은 <b>덮개가 아니다</b> — 앱 안에서 그리는 화면이라 go() 에 맡긴다');

  console.log('\n[8] 홈으로 오면 <b>띠가 사라진다</b> — 메뉴로 오셔도');
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(500);
  const H = await look(page);
  is(!H.barOn, '  메뉴로 홈에 오셔도 띠가 <b>사라진다</b>');
  is(H.homeAlive, '  홈이 <b>다시 섰다</b>');

  console.log('\n[9] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '자리' : '✓ 홈에서 안 벗어난다 — 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
