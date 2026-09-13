#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   홈 — 따라만 가면 되는 한 장 · 주간/월간 달력

   홈이 바로가기 카드밭이었습니다. 무엇부터 할지는 사장님이 정해야 했고,
   그래서 아침마다 「오늘 뭐부터 하지」 로 시작했습니다.

   여기서 못 박는 것은 여섯입니다.

     ① 홈이 <b>순서를 정해 준다</b> — ①②③ 이 붙고, 급한 것이 위에 온다
     ② <b>없는 줄은 안 세운다.</b> 0 을 늘어놓으면 아무것도 안 보입니다 (1번)
     ③ 숫자를 <b>새로 세지 않는다</b> — 달력 한 벌(mcalItems)과 마디가
        이미 센 것을 모읍니다. 두 곳에서 세면 두 숫자가 달라집니다 (5번)
     ④ 달력이 <b>주간·월간</b> 둘 다 선다 — 주에서는 무엇이 있는지가
        <b>글자로</b> 읽힌다. 점만 찍으면 눌러 봐야 압니다
     ⑤ 달력은 <b>한 벌</b>이다 — 홈에서 주로 바꾸면 다른 화면도 같이 바뀐다
     ⑥ 홈에서 <b>날짜를 누르면 실제로 바뀐다</b> — mcalPaint 가 홈을
        모르면 눌려도 아무 일이 안 일어납니다

   견본 고객 이름은 「홍길동」 계열입니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8839;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);

/* 오늘·이번 주에 <b>갈래마다 하나씩</b> 놓습니다 — 줄이 순서대로 서는지
   보려면 갈래가 여럿이어야 합니다.                                  */
const SEED = `(function(){
  var T=mcalToday(), tomo=mcalShift(T,1), d3=mcalShift(T,3);
  /* mcalItems 를 견본으로 갈아 끼웁니다 — 서버를 흉내 내는 것보다
     <b>달력이 받는 꼴</b>을 그대로 주는 편이 덜 흔들립니다. */
  window.__seed={};
  window.__seed[T]=[
    {k:'appt', t:'홍길동', s:'14:00 · 순천시'},
    {k:'touch',t:'성춘향'},
    {k:'touch',t:'임꺽정'},
    {k:'next', t:'이몽룡', s:'증권 전달'},
    {k:'bd',   t:'심청'},
    {k:'help', t:'흥부 자료 찾아 주기'}
  ];
  window.__seed[tomo]=[{k:'appt',t:'놀부',s:'10:30 · 여수시'},{k:'touch',t:'방자'}];
  window.__seed[d3]=[{k:'next',t:'장길산',s:'서류 보내기'}];
  window.mcalItems=function(){ return window.__seed; };
  /* 계약 마디는 따로 셉니다 */
  window.mstDueList=function(){ return {due:[{},{}],soon:[],none:0,total:2}; };
})();`;

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof hmTodayHtml === 'function' && typeof mcalWeekHtml === 'function' &&
                                 typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(s => { eval(s); }, SEED);
  await pg.evaluate(() => { go('home'); });
  await pg.waitForSelector('#hmToday', { timeout: 20000 });
  await pg.evaluate(() => hmPaint());
  await pg.waitForTimeout(200);
  await clearOvl(pg);

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 홈이 <b>순서를 정해 준다</b>');
  const rows = await pg.evaluate(() => Array.from(document.querySelectorAll('#hmToday .hm-row')).map(r => ({
    no: (r.querySelector('.hm-no') || {}).textContent || '',
    t: (r.querySelector('.hm-m b') || {}).textContent || '',
    n: (r.querySelector('.hm-n') || {}).textContent || ''
  })));
  is(rows.length >= 5, '오늘 줄이 <b>갈래별로</b> 섰다 — ' + rows.length + '줄');
  is(rows.map(r => r.no).join('') === rows.map((r, i) => String(i + 1)).join(''),
     '번호가 <b>1부터 빠짐없이</b> 붙는다 — ' + rows.map(r => r.no).join(''));
  is(rows[0] && rows[0].t === '약속', '<b>약속이 맨 위</b>다 — 시간이 정해진 것부터 (' + (rows[0] || {}).t + ')');
  is(rows[1] && rows[1].t === '계약 마디', '그다음이 <b>계약 마디</b> — ' + (rows[1] || {}).t);
  const big = await pg.evaluate(() => (document.querySelector('#hmToday .hm-big') || {}).textContent || '');
  is(/8건/.test(big), '맨 위 큰 글이 <b>모두 더한 수</b>를 말한다 — 「' + big.trim() + '」');
  const touch = rows.filter(r => r.t === '연락할 분')[0];
  is(touch && touch.n === '2', '갈래마다 <b>제 수</b>를 적는다 — 연락할 분 ' + (touch || {}).n);

  /* ─────────────────────────────────────────────────────────── */
  head('[2] <b>없는 줄은 안 세운다</b> (1번)');
  const none = await pg.evaluate(() => {
    const keep = window.__seed;
    window.__seed = {};
    const realMadi = window.mstDueList;
    window.mstDueList = function () { return { due: [], soon: [], none: 0, total: 0 }; };
    const h = hmTodayHtml();
    window.__seed = keep; window.mstDueList = realMadi;
    return h;
  });
  is(!/hm-row/.test(none), '아무것도 없으면 <b>줄을 하나도 안 세운다</b> — 0 을 늘어놓지 않는다');
  is(/오늘 챙길 것이 <em>없습니다<\/em>/.test(none), '<b>「없습니다」라고 적는다</b> — 빈 판을 세우지 않는다');
  is(/달력에서 이번 주와 이번 달을 미리/.test(none), '비었을 때 <b>다음에 볼 곳</b>을 알려 준다');

  /* 갈래 하나만 있으면 그 한 줄만 — 번호도 1 하나 */
  const one = await pg.evaluate(() => {
    const keep = window.__seed, realMadi = window.mstDueList;
    window.__seed = {}; window.__seed[mcalToday()] = [{ k: 'bd', t: '심청' }];
    window.mstDueList = function () { return { due: [], soon: [], none: 0, total: 0 }; };
    const h = hmTodayHtml();
    window.__seed = keep; window.mstDueList = realMadi;
    return h;
  });
  /* 「hm-rows」 가 「hm-row」 를 품고 있어, 느슨하게 세면 한 줄인데 둘로 셉니다 */
  is((one.match(/class="hm-row"/g) || []).length === 1, '갈래가 하나면 <b>한 줄만</b> 선다');
  is(/생일/.test(one) && !/약속/.test(one), '<b>있는 갈래만</b> 적는다 — 생일만 있고 약속은 없다');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 숫자를 <b>새로 세지 않는다</b> (5번)');
  is((SRC.match(/function hmCount\s*\(/g) || []).length === 1, 'hmCount() 가 한 곳에 있다');
  const cnt = SRC.slice(SRC.indexOf('function hmCount('), SRC.indexOf('function hmCount(') + 900);
  is(/mcalItems\(\)/.test(cnt), '달력 한 벌(mcalItems)이 <b>이미 센 것</b>을 읽는다');
  is(/mstDueList/.test(cnt), '계약 마디는 <b>마디가 센 것</b>을 읽는다');
  is(!/OSC\.list/.test(cnt) && !/cmOf\(/.test(cnt),
     '고객 목록을 <b>여기서 다시 훑지 않는다</b> — 두 곳에서 세면 두 숫자가 달라진다');
  is((SRC.match(/var HM_ORD\s*=/g) || []).length === 1,
     '순서 표가 <b>한 곳</b>에만 있다 — 삼항 사슬로 늘어놓지 않았다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 달력이 <b>주간·월간</b> 둘 다 선다');
  const seg = await pg.evaluate(() => {
    const s = document.querySelector('#hmCalHost .mcal-seg');
    return { there: !!s, txt: s ? s.textContent.replace(/\s+/g, '') : '',
             month: !!document.querySelector('#hmCalHost .mcal-grid'),
             week: !!document.querySelector('#hmCalHost .mcal-wgrid') };
  });
  is(seg.there && /주/.test(seg.txt) && /월/.test(seg.txt), '홈 달력에 <b>주 / 월</b> 고르개가 있다');
  is(seg.month && !seg.week, '처음에는 <b>월</b>이 선다');

  await pg.evaluate(() => mcalSetView('week'));
  await pg.waitForTimeout(200);
  const wk = await pg.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('#hmCalHost .mcal-wd'));
    const busy = cells.filter(c => c.querySelectorAll('.wi').length);
    return { n: cells.length, busy: busy.length,
             txt: busy.length ? busy[0].textContent.replace(/\s+/g, ' ').trim() : '',
             h: cells.length ? Math.round(cells[0].getBoundingClientRect().height) : 0,
             title: (document.querySelector('#hmCalHost .mcal-hd b') || {}).textContent || '' };
  });
  is(wk.n === 7, '주간은 <b>이레</b>가 선다 — ' + wk.n + '칸');
  is(wk.h > 80, '칸이 <b>넓다</b> — ' + wk.h + 'px (점만 찍는 달력보다 높아야 글자가 들어간다)');
  is(wk.busy >= 1, '일이 있는 날이 <b>채워진다</b> — ' + wk.busy + '일');
  is(/홍길동|성춘향|임꺽정|이몽룡|심청|흥부/.test(wk.txt),
     '무엇이 있는지가 <b>글자로</b> 읽힌다 — 「' + wk.txt.slice(0, 40) + '…」');
  is(/~/.test(wk.title), '머리글이 <b>그 주의 날짜</b>를 적는다 — ' + wk.title);

  /* ─────────────────────────────────────────────────────────── */
  head('[5] 달력은 <b>한 벌</b>이다 (5번)');
  ['mcalItems', 'mcalCardHtml', 'mcalWeekHtml', 'mcalGridHtml', 'mcalPaint'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  const cross = await pg.evaluate(() => {
    go('mycal');
    const w = !!document.querySelector('#mycalHost .mcal-wgrid');
    go('home');
    return w;
  });
  await pg.waitForTimeout(200);
  is(cross, '홈에서 <b>주</b>로 바꾸면 내 캘린더도 <b>주</b>로 서 있다 — 한 벌이라서');

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 홈에서 <b>날짜를 누르면 실제로 바뀐다</b>');
  const paint = SRC.slice(SRC.indexOf('function mcalPaint('), SRC.indexOf('function mcalPaint(') + 700);
  is(/hmCalHost/.test(paint), 'mcalPaint 가 <b>홈 자리를 안다</b> — 모르면 눌려도 아무 일이 없다');
  await pg.evaluate(() => { mcalSetView('week'); });
  await pg.waitForTimeout(200);
  await clearOvl(pg);
  const picked = await pg.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('#hmCalHost .mcal-wd'));
    const target = cells[3];
    if (!target) return { ok: false };
    target.click();
    return { ok: true };
  });
  await pg.waitForTimeout(250);
  const after = await pg.evaluate(() => ({
    sel: MCAL.sel,
    marked: !!document.querySelector('#hmCalHost .mcal-wd.sel'),
    day: (document.querySelector('#hmCalHost .mcal-day .h') || {}).textContent || ''
  }));
  is(picked.ok && !!after.sel, '날짜를 누르면 <b>고른 날이 기억된다</b> — ' + after.sel);
  is(after.marked, '고른 칸에 <b>표시가 남는다</b>');
  is(after.day.length > 0, '아래에 <b>그날 것이 펴진다</b> — 「' + after.day.trim() + '」');

  /* 앞뒤 단추는 하나 — 주를 보고 있으면 주를 옮긴다 */
  const moved = await pg.evaluate(() => {
    const before = mcalWk();
    mcalMove(1);
    const after = mcalWk();
    mcalMove(-1);
    return { before: before, after: after };
  });
  is(moved.after !== moved.before, '주를 보고 있으면 ‹ › 가 <b>주를 옮긴다</b> — ' +
     moved.before + ' → ' + moved.after);

  head('[7] 이 판을 그리는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 홈 한 장 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 홈 한 장 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
