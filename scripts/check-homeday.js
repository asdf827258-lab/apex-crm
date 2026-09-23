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
window.__q=[];                       /* 어느 표를 몇 번 불렀나 — 7번을 재려면 필요합니다 */
window.supabase={createClient:function(){
 var mk=function(t){window.__q.push(t||'?');var a={select:function(){return a},eq:function(){return a},order:function(){return a},
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
  /* <b>이미 읽어 둔 상태</b>로 둡니다 — 실제 앱은 고객·기록을 한 번 읽고 나면
     다시 안 읽습니다. 빈 값만 돌려주는 흉내에서는 그 「이미 읽었나」 판정이
     안 먹어서, 멀쩡한 앱을 두고 「자꾸 부른다」 고 잡게 됩니다 (8번). */
  OSC.list=[{id:'c1',name_masked:'홍○동'}];
  try{ CM.loaded=true; CM.meta=CM.meta||{}; }catch(e){}
  /* ★ 2026-09-23 · 심어 둔 이 한 분은 <b>오늘 통화한 것으로</b> 둡니다.
     안 적어 두면 「한 번도 통화·만남이 없는 분」이 되어 30일 약속 줄이
     한 줄 더 섭니다 — 그것은 맞는 동작이고 check-queue 가 봅니다.
     이 판은 <b>달력 줄이 차례대로 서는지</b> 를 재는 자리라, 다른 갈래가
     섞이면 수가 틀렸을 때 어디가 틀렸는지 알 수 없습니다. 자리를 늦추는
     것이 아니라 <b>빠져 있던 사실</b>을 채우는 것입니다 (8번). */
  try{ cmOf('c1').touch=[{at:mcalToday(),how:'전화'}]; }catch(e){}
  try{ AR.loaded=true; GB.loaded=true; }catch(e){}
  window.mstDueList=function(){ return {due:[
    {c:{id:'c9',name_masked:'홍○판'},hit:{d:0,step:{m:3,ic:'📮',t:'석 달째 인사'}}},
    {c:{id:'c8',name_masked:'김○돌'},hit:{d:0,step:{m:6,ic:'📮',t:'반년 점검'}}}
  ],soon:[],none:0,total:2}; };
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
  /* ⚠ 2026-09-23 · <b>어느 칸인지 박지 않는다.</b> 여태 `#hmToday .hm-big`
     하나를 집어 봤는데, 토스판이 들어오면서 그 수를 말하는 자리가 <b>맨 위
     인사</b>(.tz-greet)로 옮겨졌습니다. 두 곳에서 같은 말을 하지 않으려고
     아래 큰 글을 뺀 것이라(5번) 점검도 <b>칸이 아니라 화면 맨 위</b>를 봐야
     맞습니다. 여기서 못 박는 것은 「홈을 열면 <b>맨 위에서</b> 오늘 몇 건인지
     보인다」 이지 「그 글이 .hm-big 이다」 가 아닙니다.
     ★ 그래도 <b>맨 위</b>는 지킵니다 — 홈 맨 위 <b>400px 안</b>(폰 첫 눈)에
       그 수가 있어야 합니다. 아래로 밀려나면 그대로 빨간불입니다.
     ★ 「8건」 이든 「8개」 든 봅니다 — 토스 말투는 「개」 입니다. */
  const big = await pg.evaluate(() => {
    const pane = document.querySelector('.tab-pane.on'); if (!pane) return '';
    const top = pane.getBoundingClientRect().top;
    const out = [];
    pane.querySelectorAll('*').forEach(e => {
      if (e.children.length) return;                 /* 잎만 — 부모를 또 세지 않는다 */
      const r = e.getBoundingClientRect();
      if (r.height > 0 && r.top - top < 400) out.push(e.textContent || '');
    });
    return out.join(' ');
  });
  is(/8\s*[건개]/.test(big),
     '홈 <b>맨 위</b>(첫 400px)가 <b>모두 더한 수</b>를 말한다 — 「' +
     (big.replace(/\s+/g, ' ').trim().slice(0, 40)) + '」');
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
  /* 여태는 「아래 달력에서…」 라는 <b>문장</b>을 찾았다. 문장은 갈린다 —
     묻는 것은 「<b>채우러 갈 자리가 있나</b>」 다. 그래서 무엇이 채우는지와
     눌러서 갈 단추가 실제로 서는지를 본다. 전보다 조인 것이다 (8번). */
  is(/hold-none/.test(none), '비었을 때 <b>빈 손 칸</b>을 세운다');
  is(/고객을 넣고 상태를 적어/.test(none), '<b>무엇이 채우는지</b> 말한다');
  is(/class="hold-go"[^>]*onclick="go\('clients'\)"/.test(none),
     '<b>채우러 갈 단추</b>가 선다 — 「없습니다」 로 끝내지 않는다');

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
  /* ─────────────────────────────────────────────────────────── */
  /* ★ 2026-09-23 · <b>한 분 = 한 퀘스트</b>를 여기서 <b>실제로</b> 잽니다.
     여태 check-queue 가 글자(「seen[dk]!==undefined」)로 봤는데, 접는 방식을
     고치자 접는 일은 잘 되는데 점검만 울렸습니다 (8번). 브라우저가 도는
     이 자리에서 진짜 줄을 세어 봅니다.
     ★ 같은 분을 <b>일부러 여러 자리에</b> 심습니다. 심는 차례가 중요합니다 —
       <b>가벼운 것을 먼저</b>(연락 560), <b>무거운 것을 나중에</b>(할 일 900)
       둡니다. 순서대로 두면 「먼저 온 것을 남긴다」 로 되돌려도 답이 같아서
       <b>알람이 안 울립니다.</b> 안 울리는 알람은 알람이 아닙니다 (8번).  */
  head('[2-1] <b>한 분은 오늘 한 번만</b> 선다 (한 분 = 한 퀘스트)');
  const dup = await pg.evaluate(() => {
    const keep = window.__seed, realMadi = window.mstDueList;
    window.__seed = {};
    window.__seed[mcalToday()] = [
      { k: 'touch', id: 'dup1', t: '홍갑돌' },                      /* 560 — 먼저 */
      { k: 'bd',    id: 'dup1', t: '홍갑돌' },                      /* 764 */
      { k: 'next',  id: 'dup1', t: '홍갑돌', s: '증권 전달' }        /* 900 — 나중 */
    ];
    window.mstDueList = function () { return { due: [], soon: [], none: 0, total: 0 }; };
    const L = hmSteps().filter(r => r.id === 'dup1');   /* 세 자리에 심은 그 분 */
    window.__seed = keep; window.mstDueList = realMadi;
    return { n: L.length, k: (L[0] || {}).k, more: (L[0] || {}).more || 0 };
  });
  is(dup.n === 1, '같은 분을 <b>세 자리에 심어도 한 줄</b>만 선다 — ' + dup.n + '줄');
  is(dup.k === 'next',
     '남는 것은 <b>먼저 온 것이 아니라 무거운 것</b> — ' + dup.k +
     ' (할 일 900 · 생일 764 · 연락 560 — 연락을 먼저 심었습니다)');
  is(dup.more === 2, '<b>접은 수를 적어 둔다</b> — ' + dup.more + '건 (조용히 버리지 않는다 · 1번)');

  /* ─────────────────────────────────────────────────────────── */
  /* ★ 2026-09-23 · <b>단계 차례가 점수에 안 밀린다.</b>
     명세서의 「단계 520+지난일수×3」 을 그대로 옮겼더니 <b>찬 TA 가 계약
     코앞의 AP 를 밀어냈습니다</b> — 명세서 목업에는 단계라는 것이 아예 없어
     「며칠 밀렸나」 하나로만 셉니다. 이 앱의 TDO.ord 는 사장님이 정하신
     영업 차례(AP·PC·CS 먼저)이고, 명세서가 모르는 것이지 틀린 것이
     아닙니다. 여기서 못 박아 둡니다 — 다시 뒤집히면 홈이 0.3화면 길어지고
     (TA 에는 화법 칸이 붙습니다) 아침 미션 차례까지 같이 갈립니다.        */
  head('[2-2] <b>단계 차례가 점수에 안 밀린다</b> (TDO.ord)');
  const ord = await pg.evaluate(() => {
    const keep = window.__seed, realMadi = window.mstDueList, realTouch = window.arTouch;
    window.__seed = {};
    window.mstDueList = function () { return { due: [], soon: [], none: 0, total: 0 }; };
    /* 찬 TA 는 <b>마흔 날</b> 밀렸고, 계약 코앞 AP 는 <b>오늘</b> 것입니다.
       ★ 심는 차례가 중요합니다 — <b>덜 밀린 TA 를 먼저</b> 둡니다. 오래 밀린
         쪽을 먼저 두면 들어온 차례가 이미 답이라 「오래 밀린 분부터」 를
         빼도 답이 같아서 <b>알람이 안 울립니다</b> (8번). */
    window.arTouch = function () { return [
      { k: 'TA', id: 'o3', nm: '홍병돌', todo: '전화', d: 3 },
      { k: 'AP', id: 'o2', nm: '홍을돌', todo: '만남', d: 0 },
      { k: 'TA', id: 'o1', nm: '홍갑돌', todo: '전화', d: 40 }
    ]; };
    const L = hmSteps().filter(r => r.k === 'db').map(r => r.t);
    window.__seed = keep; window.mstDueList = realMadi; window.arTouch = realTouch;
    return L;
  });
  is(ord[0] === '홍을돌',
     '<b>계약 코앞(AP)</b>이 마흔 날 밀린 찬 TA 보다 먼저 — ' + ord.join(' · '));
  is(ord[1] === '홍갑돌' && ord[2] === '홍병돌',
     '<b>같은 단계 안에서는 오래 밀린 분</b>부터 — 40일째 → 3일째');

  /* ─────────────────────────────────────────────────────────── */
  /* ★ 2026-09-24 · <b>「몇 분 남았나」 는 한 곳에서만 나온다</b>
     (사장님 말씀 — 「세 자리를 하나로 · 몇 분 남았나 가 한 곳에서만」).
     여태 셋이 따로 셌습니다 —
       · 퀘스트 띠   r.n = hmSteps() 전체 (사람 아닌 줄 · 끝낸 분까지)
       · ① 목록      hmMsPeople().length
       · 「다음 분으로」 알림  그 자리에서 또 훑어 세기
     수가 달라도 화면은 멀쩡해 보여서 아무도 못 봅니다. 여기서 <b>같은
     수를 말하는지</b> 재고, 세는 자리가 hmLeft <b>하나</b>인지 글자로 봅니다. */
  head('[2-3] <b>「몇 분 남았나」 는 한 곳에서만</b> (5번)');
  const qn = await pg.evaluate(() => {
    const Q = hmLeft();
    const band = ((document.querySelector('#hmToday .hm-q-n') || {}).textContent || '');
    const m = band.match(/오늘\s*(\d+)\s*분\s*중\s*(\d+)\s*번째/);
    return { all: Q.all, n: Q.n, done: Q.done, band: band.replace(/\s+/g, ' ').trim(),
      bn: m ? +m[1] : -1, bi: m ? +m[2] : -1,
      ms: hmMsPeople().length,
      onlyPeople: hmLeft().list.every(x => !!(HM_ACT[x.k] && HM_ACT[x.k].ba)) };
  });
  is(qn.bn === qn.all,
     '  띠의 <b>전체 수</b>가 hmLeft 와 같다 — 띠 ' + qn.bn + ' · hmLeft ' + qn.all +
     ' 「' + qn.band + '」');
  is(qn.bi === qn.done + 1,
     '  띠의 <b>몇 번째</b>가 끝낸 수에서 이어진다 — ' + qn.bi + '번째 · 끝낸 ' + qn.done + '분');
  is(qn.onlyPeople,
     '  <b>사람인 줄만</b> 센다 — 할 일·도와줄 것·내 일정은 「분」 이 아니다 (HM_ACT 한 곳이 안다)');
  is(qn.ms <= qn.n,
     '  ① 목록이 <b>남은 분을 넘지 않는다</b> — ① ' + qn.ms + '명 · 남은 ' + qn.n + '분');
  /* 세는 자리가 <b>하나</b>인가 — 글자로 본다 */
  is((SRC.match(/function hmLeft\s*\(/g) || []).length === 1, '  hmLeft() 가 <b>한 곳</b>에 있다');
  is(!/for\s*\([^)]*\)\s*if\s*\(\s*!hmQdone\([^)]*\)\s*&&\s*!hmIsDone\(/.test(SRC),
     '  <b>남은 수를 또 훑어 세는 자리가 없다</b> — 있으면 띠와 알림이 다른 수를 말한다');

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 숫자를 <b>새로 세지 않는다</b> (5번)');
  is((SRC.match(/function hmCount\s*\(/g) || []).length === 1, 'hmCount() 가 한 곳에 있다');
  const cnt = SRC.slice(SRC.indexOf('function hmCount('), SRC.indexOf('function hmCount(') + 900);
  is(!/OSC\.list/.test(cnt) && !/cmOf\(/.test(cnt),
     '고객 목록을 <b>여기서 다시 훑지 않는다</b> — 두 곳에서 세면 두 숫자가 달라진다');
  /* <b>글자 모양이 아니라 결과를 잽니다.</b> 예전에는 「hmCount 안에 mcalItems
     라고 적혀 있나」 를 봤습니다. 그러면 세는 길이 한 겹 깊어지기만 해도
     멀쩡한 코드에 빨간불이 켜지고, 정작 <b>카드와 목록이 어긋나는 것</b>은
     못 잡습니다. 실제로 오늘 「카드 7 · 목록 6」 이 났습니다 (8번). */
  const agree = await pg.evaluate(() => {
    /* <b>DB 고객을 한 사람 심어야</b> 이 자리가 물립니다. 안 심으면 둘 다
       0 이라, 카드를 따로 세게 만들어도 빨간불이 안 켜집니다 (8번). */
    const keepDb = AR.db;
    AR.db = [{ id:'q1', who:(OS.session&&OS.session.user&&OS.session.user.id)||'me',
               name:'홍말순', region:'광주', src:'일반', stage:'TA', res:'부재',
               appt:'', days:40, n:1, cAt:'', pAt:'' }];
    AR.loaded = true; AR.busy = false;
    const c = hmCount(), L = hmSteps(), bad = [];
    AR.db = keepDb;
    HM_ORD.forEach(o => {
      const n = L.filter(x => x.k === o.k).length;
      if ((c[o.k] || 0) !== n) bad.push(o.k + ' 카드' + (c[o.k] || 0) + '·목록' + n);
    });
    return { bad, total: c.total, db: c.db||0,
             len: L.filter(x => HM_ORD.some(o => o.k === x.k)).length };
  });
  is(agree.bad.length === 0, '<b>카드 숫자와 목록이 갈래마다 같다</b>'+
     (agree.bad.length ? (' ← ' + agree.bad.join(' / ')) : '') +
     ' (다르면 어느 쪽이 맞는지 알 수 없다)');
  is(agree.total === agree.len, '<b>합계도 같다</b> — 카드 '+agree.total+' · 목록 '+agree.len);
  is(agree.db === 1, '심어 둔 <b>DB 고객 한 사람</b>이 실제로 세어진다 — '+agree.db+
     '명 (안 세어지면 위 두 자리가 0 대 0 이라 아무것도 안 잡는다)');
  is((SRC.match(/var HM_ORD\s*=/g) || []).length === 1,
     '순서 표가 <b>한 곳</b>에만 있다 — 삼항 사슬로 늘어놓지 않았다');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] 달력이 <b>주간·월간</b> 둘 다 선다');
  /* ── 홈 달력은 이제 <b>접힌 채로</b> 열립니다 (토스판 3단계) ─────────
     홈이 여섯 화면 반이라 큰 카드 셋을 접었습니다. 접힌 것은 화면에
     안 서므로 크기를 재면 <b>0px</b> 이 나옵니다 — 카드가 망가진 것이
     아니라 <b>안 편 것</b>입니다. 그러니 <b>펴고</b> 잽니다.
     여기서 「펴진다」 는 것 자체도 한 줄로 잽니다 — 안 펴지면 그 안의
     것은 영영 못 봅니다 (1번).                                        */
  const opened = await pg.evaluate(() => {
    const box = document.getElementById('hmFold_cal');
    if (!box) return 'noFold';
    const h = box.querySelector('.hm-fold-h');
    if (box.querySelector('.hm-fold-b').hidden) h.click();
    return box.querySelector('.hm-fold-b').hidden ? 'stuck' : 'open';
  });
  is(opened !== 'stuck', '접힌 <b>달력이 펴진다</b> — ' +
     (opened === 'noFold' ? '접기 상자가 없습니다(예전 판)' : '머리를 누르니 열렸습니다'));
  await pg.waitForTimeout(150);
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

  /* ══════════════════════════════════════════════════════════════
     [6-1] 「지금 이것 하세요」 — <b>따라만 가면 되는가</b>

     갈래별 건수만 세워 두면 <b>여전히 고르셔야 합니다</b> — 「연락할 분
     3건」 을 보고도 누구부터인지는 눌러 들어가 다시 고릅니다. 아침에
     제일 힘든 것이 그 고르는 일입니다. 그래서 맨 위에 <b>딱 한 건</b>을
     세웁니다.                                                        */
  head('[6-1] 「지금 이것」 — <b>한 건씩 따라가면 된다</b>');
  await pg.evaluate(() => { try { localStorage.removeItem('apex_hm_done'); } catch (e) {} go('home'); });
  await pg.waitForTimeout(500);
  await clearOvl(pg);
  const now = await pg.evaluate(() => {
    const d = document.querySelector('.hm-now');
    const rows = document.querySelector('.hm-rows');
    return { there: !!d, txt: d ? d.textContent.replace(/\s+/g, ' ') : '',
             nm: (d && d.querySelector('.hm-now-m b')) ? d.querySelector('.hm-now-m b').textContent : '',
             /* 「열기 · 했습니다」 두 단추를 <b>「무엇을 할까요?」 갈래</b>로
                바꿨습니다 — 읽고 나서 다시 고르는 두 동작을 한 동작으로.
                여기서 재려는 것은 <b>한 건이 크게 서고 그 자리에서 된다</b>
                는 것이니, 갈래가 몇이고 <b>끝냈다고 말할 자리</b>가 있는지
                를 봅니다. 모양이 바뀌었다고 느슨하게 재면 안 됩니다 (8번). */
             btn: d ? d.querySelectorAll('.hm-ask-o').length : 0,
             ask: !!(d && d.querySelector('.hm-ask-t')),
             /* 끝냈다는 말은 갈래마다 다르다 — 「보냈습니다」 · 「만났습니다」.
                표(HM_ACT)에 적힌 그대로 쓰므로 <b>「이미 」</b> 로 견준다 */
             hasDid: !!(d && [].slice.call(d.querySelectorAll('.hm-ask-o'))
                        .filter(b => /이미 /.test(b.textContent)).length),
             first: !!(d && rows && (d.compareDocumentPosition(rows) & Node.DOCUMENT_POSITION_FOLLOWING)),
             n: hmSteps().length };
  });
  is(now.there && now.btn >= 2 && now.ask,
     '<b>한 건</b>이 크게 서고 <b>「무엇을 할까요?」</b> 갈래가 선다 — '+now.btn+'가지');
  is(now.hasDid, '그 갈래 안에 <b>「이미 했습니다」</b> 가 있다 — 끝냈다고 말할 자리가 없으면 목록이 안 줄어든다');
  is(now.first, '갈래별 줄보다 <b>위에</b> 선다 — 제일 먼저 눈에 들어와야 한다');
  is(/1번째/.test(now.txt), '<b>몇 번째인지</b> 적는다 — 「' + (now.txt.match(/\d+건 중 \S+번째[^·]*/) || [''])[0].trim() + '」');
  /* 차례는 <b>HM_ORD 가 정한 그대로</b>입니다 — 시간이 정해진 약속이 맨 위,
     그다음이 계약 마디. 여기서 차례를 따로 적으면 갈라집니다 (5번). */
  is(now.nm === '홍길동' && /약속/.test(now.txt),
     '차례대로 <b>약속부터</b> 선다 — 시간이 정해진 것이 먼저다 (지금 「' + now.nm + '」)');

  head('[6-2] <b>기록으로 남는 것과 아닌 것을 구분해 말한다</b> (1번)');
  const said = await pg.evaluate(() => {
    const out = {};
    /* 연락 차례까지 넘겨 가며 무엇이라 적는지 본다 */
    const L = hmSteps();
    out.kinds = L.map(x => x.k);
    const A = window.HM_ACT;
    out.real = Object.keys(A).filter(k => A[k].real).sort().join(',');
    out.fake = Object.keys(A).filter(k => !A[k].real).sort().join(',');
    out.txtNow = (document.querySelector('.hm-now-n') || {}).textContent || '';
    return out;
  });
  is(said.real === 'madi,touch',
     '<b>기록이 남는 것은 연락과 계약 마디뿐</b>이라고 표에 적혀 있다 — ' + said.real);
  is(/기록으로 남습니다/.test(said.txtNow) || /오늘 하루 표시/.test(said.txtNow),
     '지금 이 건이 <b>어느 쪽인지</b> 그 자리에 적는다 — 「' + said.txtNow.replace(/\s+/g, ' ').slice(0, 46) + '」');

  head('[6-3] 끝내면 <b>다음 한 건</b>이 올라온다');
  const walk = await pg.evaluate(async () => {
    const seen = [];
    for (let i = 0; i < 4; i++) {
      const r = hmNext();
      if (!r.x) break;
      seen.push(r.x.k + ':' + r.x.t);
      hmDoneMark(r.x.key);          /* 실제 누르는 것과 같은 표시 */
    }
    hmPaint();
    await new Promise(r => setTimeout(r, 120));
    return { seen, left: hmNext().x ? hmNext().x.k : '',
             txt: (document.querySelector('.hm-now') || {}).textContent || '' };
  });
  is(walk.seen.length === 4 && walk.seen[0] !== walk.seen[1],
     '누를 때마다 <b>다른 건</b>이 올라온다 — ' + walk.seen.slice(0, 3).join(' → '));
  is(walk.seen[0].indexOf('appt:') === 0 && walk.seen[1].indexOf('madi:') === 0,
     'HM_ORD 가 정한 <b>그 차례</b>로 나온다 — 약속 → 계약 마디');
  const fin = await pg.evaluate(async () => {
    let guard = 0;
    while (hmNext().x && guard++ < 40) hmDoneMark(hmNext().x.key);
    hmPaint();
    await new Promise(r => setTimeout(r, 120));
    return (document.querySelector('.hm-card') || {}).textContent || '';
  });
  is(/다 하셨습니다/.test(fin), '<b>다 하면 다 하셨다고</b> 말한다 — 빈 칸으로 두지 않는다');

  head('[6-4] <b>어제 찍은 표시가 오늘 따라오지 않는다</b>');
  const stale = await pg.evaluate(() => {
    const k = hmSteps()[0].key;
    try { localStorage.setItem('apex_hm_done', JSON.stringify({ d: '2020-01-01', k: [k] })); } catch (e) {}
    return { done: hmIsDone(k), first: hmNext().x ? hmNext().x.key : '' };
  });
  is(!stale.done && stale.first, '어제 것으로 찍혀 있어도 <b>오늘은 다시 섭니다</b> — 날짜가 바뀌면 처음부터');

  /* ══════════════════════════════════════════════════════════════
     [8] TFA 업무관리가 <b>홈에서</b> 돈다

     하루 일을 두 화면에서 했습니다 — 고객은 홈에서, 내 일과 팀 일은
     TFA 에서. 아침에 홈을 보고 또 건너가야 했습니다. 이제 홈에서 끝납니다.
     ★ <b>새로 만들지 않았는가</b>가 제일 중요합니다 (5번). 따로 그리면
       한쪽만 고쳐져 두 화면이 서로 다른 말을 하게 됩니다.            */
  head('[8] TFA 업무관리가 <b>홈에서</b> 돈다');
  await pg.evaluate(() => { go('home'); });
  await pg.waitForTimeout(900);
  await clearOvl(pg);
  const tfa = await pg.evaluate(() => {
    const host = document.getElementById('hmTfaHost');
    const pane = document.getElementById('arPane');
    return { host: !!host, pane: !!(host && host.querySelector('#arPane')),
             cats: pane ? pane.querySelectorAll('.ar-cat').length : 0,
             /* 눈에서 뺀 칸(여섯째 자리 hide)은 세지 않는다 — 일부러 안 세운 것이다.
                2026-09-21 「오늘 터치할 사람」이 그렇게 빠졌다. */
             want: (typeof AR_CAT !== 'undefined') ? AR_CAT.filter(c => !c[5]).length : -1,
             hid: (typeof AR_CAT !== 'undefined') ? AR_CAT.filter(c => c[5]).map(c => c[0]) : [],
             go: !!document.querySelector('.hm-tfa-go'),
             body: !!(pane && pane.querySelector('.ar-main')) };
  });
  is(tfa.host && tfa.pane, 'TFA 판이 <b>홈 안에</b> 서 있다 — 같은 칸 이름(#arPane)이라 다시 그리기가 그대로 된다');
  is(tfa.cats === tfa.want && tfa.want > 0,
     '칸이 <b>하나도 안 빠지고</b> 선다 — ' + tfa.cats + ' / AR_CAT ' + tfa.want + '개'
     + (tfa.hid.length ? ' (눈에서 뺀 칸 ' + tfa.hid.join(', ') + ' 은 뺀 수)' : ''));
  is(tfa.body, '고른 칸의 <b>본문까지</b> 홈에 선다 — 이름만 늘어놓지 않는다');
  is(tfa.go, '<b>「전체 화면으로」</b> 가 있다 — 넓게 보고 싶으실 때');
  /* 새로 그리지 않았는가 — 소스로 못 박는다 (5번) */
  const tfaSrc = SRC.slice(SRC.indexOf('function hmTfaHtml('), SRC.indexOf('function hmTfaHtml(') + 900);
  is(/arInnerHtml\(\)/.test(tfaSrc), 'TFA 가 쓰던 판(arInnerHtml)을 <b>그대로</b> 부른다 — 제 몸통을 안 갖는다 (5번)');
  is((SRC.match(/function hmTfaHtml\s*\(/g) || []).length === 1, 'hmTfaHtml() 이 한 곳에 있다');

  head('[8-1] 칸을 누르면 <b>홈에 머문 채</b> 바뀐다');
  const sw = await pg.evaluate(async () => {
    const btns = [...document.querySelectorAll('#arPane .ar-cat')];
    const before = (document.querySelector('#arPane .ar-main') || {}).textContent || '';
    const t = btns.find(x => /팀원 관리/.test(x.textContent));
    if (t) t.click();
    await new Promise(r => setTimeout(r, 500));
    const after = (document.querySelector('#arPane .ar-main') || {}).textContent || '';
    return { cat: AR.cat, tab: (typeof lastTab !== 'undefined') ? lastTab : '?',
             changed: before.slice(0, 150) !== after.slice(0, 150),
             stillHome: !!document.getElementById('hmToday') };
  });
  is(sw.changed && sw.cat === 'team', '눌린 칸으로 <b>본문이 바뀐다</b> — 지금 「' + sw.cat + '」');
  is(sw.tab === 'home' && sw.stillHome, '<b>홈을 안 떠난다</b> — 오늘 챙길 것도 그대로 있다');

  head('[8-2] TFA 판이 <b>서버를 되풀이해 안 부른다</b> (7번)');
  /* ★ 여기서 재는 것은 <b>이 판이 더한 몫</b>뿐입니다. 홈이 원래 부르던
     것(고객·공지 등)까지 싸잡아 세면, 제가 건드리지도 않은 자리 때문에
     빨간불이 켜져 사람이 점검을 안 믿게 됩니다 (8번).
     그래서 arLoad 가 <b>실제로 서버까지 가는 횟수</b>만 셉니다 —
     홈을 다시 열 때마다 여기서 새면 한도가 그것으로 나갑니다.        */
  const armed = await pg.evaluate(async () => {
    window.__arN = 0;
    const real = window.arLoad;
    window.arLoad = function (force) {
      const was = (typeof AR !== 'undefined') && AR.loaded;
      if (!was || force) window.__arN++;
      return real.apply(this, arguments);
    };
    for (let i = 0; i < 3; i++) {
      go('clients'); await new Promise(r => setTimeout(r, 250));
      go('home');    await new Promise(r => setTimeout(r, 450));
    }
    window.arLoad = real;
    return { n: window.__arN, pane: !!document.getElementById('arPane') };
  });
  is(armed.n === 0 && armed.pane,
     '홈을 세 번 더 열어도 TFA 는 <b>다시 안 읽는다</b> — ' + armed.n + '번 ' +
     '(arLoad 가 스스로 막는다. 여기서 새면 하루 수십 번이 그대로 요금이 된다)');
  /* 코드로도 못 박는다 — 홈이 <b>TFA 가 아는 한 곳</b>을 부르는가 (5번) */
  const arm = SRC.slice(SRC.indexOf('function hmArm('), SRC.indexOf('function hmArm(') + 900);
  is(/osAiRepAfterRender\(\)/.test(arm),
     '깨우는 일은 <b>TFA 가 아는 한 곳</b>에 맡긴다 — 홈에서 따로 적으면 한쪽만 고쳐진다 (5번)');

  head('[8-3] 달력이 둘이어도 <b>둘 다</b> 바뀐다');
  /* 홈 달력과 「스케줄 관리」 칸의 달력이 같이 섭니다. 예전에는 첫 자리를
     그리고 그대로 나가(return) 나머지가 안 바뀌었습니다 — 눌리는데 안
     바뀌면 고장 난 것으로 보입니다. */
  const two = await pg.evaluate(async () => {
    arGoCat('sched');
    await new Promise(r => setTimeout(r, 600));
    const cals = document.querySelectorAll('.mcal-grid, .mcal-wk').length;
    const before = MCAL.ym;
    mcalMove(1);
    await new Promise(r => setTimeout(r, 400));
    const titles = [...document.querySelectorAll('.mcal-hd b')].map(x => x.textContent.trim());
    mcalMove(-1);
    return { cals, before, titles, same: titles.length > 1 && titles.every(x => x === titles[0]) };
  });
  is(two.titles.length >= 2, '홈과 스케줄 관리에 <b>달력이 둘</b> 섰다 — ' + two.titles.length + '개');
  is(two.same, '달을 넘기면 <b>둘 다</b> 따라 넘어간다 — ' + two.titles.join(' · '));

  head('[7] 이 판을 그리는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 홈 한 장 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 홈 한 장 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
