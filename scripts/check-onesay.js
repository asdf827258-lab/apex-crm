/* ══════════════════════════════════════════════════════════════════
   check-onesay.js — <b>한 물음에는 한 답.</b> 화면이 스스로 모순되지 않나.

   사장님 말씀 (2026-09-24) — 「오늘 누구를 대할까 를 <b>세 곳이 따로</b>
   답합니다. … 「몇 분 남았나」 가 <b>한 곳에서만</b> 나옵니다」

   ── 왜 점검 218가지가 다 초록인데 이 일이 났나 ─────────────────────
   점검은 저마다 <b>자기가 지키려고 만든 것</b>만 봅니다. 「카드가 잘 서나」
   「미션이 잘 서나」 는 각각 초록인데, <b>둘을 나란히 놓고 견주는 자</b>가
   없었습니다. 2026-09-25 에 손으로 재어 보니 한 화면에 이렇게 있었습니다 —
     · 퀘스트 띠   「오늘 <b>3분</b> 중 1번째」
     · 아침 미션   「오늘 관리 <b>0/1명</b>」
     · 카드의 1번  홍길동A(AP)  ↔  미션 ①의 1번  홍길동B(TA)
   <b>틀린 값은 아닙니다</b> — 세는 것이 서로 다릅니다. 그런데 화면에 그렇게
   안 적혀 있어서, 사장님 눈에는 같은 물음에 두 답입니다.

   ── 어떻게 잡나 ───────────────────────────────────────────────────
   숫자를 적는 자리가 <b>제 입으로</b> 무슨 물음에 답하는지 말하게 합니다
   (<code>data-ask</code>). 그러면 기계가 견줄 수 있습니다 —
     [1] 「오늘 N분/명/개」 라고 적으면서 <b>이름표를 안 단</b> 자리
     [2] 대장(ASK)에 없는 <b>낯선 이름표</b>
     [3] <b>같은 이름표끼리 수가 다른</b> 자리  ← 진짜 버그
     [4] <b>다른 이름표가 다른 수</b>를 말하는데, 무엇을 세는지 화면에 안
         적힌 자리 (사장님이 못 가리는 자리)
     [5] 미션에 뜬 분이 <b>오늘 큐 밖</b>에서 온 것 (지어낸 사람)
     [6] 「1번」 이 두 곳에서 <b>다른 사람</b>

   ★ <b>기준선은 줄이라고만 있습니다.</b> [4][6] 은 오늘 어긋난 자리가
     있어 그 수를 적어 둡니다 — <b>늘면 빨간불</b>이고, 줄이면 기준선도 같이
     내려 주십시오. 「지금 이만큼 어긋나 있다」 를 <b>숫자로 남기는 것</b>이
     이 점검이 하는 일입니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8941;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
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

/* ── 물음 대장 ────────────────────────────────────────────────────
   이름표를 하나 새로 쓰려면 <b>여기에 먼저</b> 적습니다. 그래야 「아무 이름이나
   붙여서 견주기를 피하는」 일이 안 생깁니다.
     뜻   — 무엇을 세는가 (사람 말로)
     구별 — 그 물음이 <b>다른 물음과 다르다</b>는 것을 화면에서 알아볼 낱말.
            으뜸 물음(오늘 볼 분 전부)에는 없습니다 — 그것이 기본이라서. */
const ASK = {
  '오늘몇분':        { 뜻: '오늘 볼 분 전부 (hmLeft·hmCount)', 구별: null },
  '전화로약속잡을분': { 뜻: '전화로 약속 잡을 분만 (HM_MS_POOL 단계)', 구별: ['전화', '약속', 'TA', '미접촉'] }
};
/* ⚠ 2026-09-25 현재 어긋나 있는 자리 — <b>늘면 빨간불</b>입니다.
   [4] 1곳 — 「오늘 관리 0/1명」 이 무엇을 세는지 화면에 안 적혀 있습니다.
   [6] 1곳 — 카드의 1번(AP)과 미션 ①의 1번(TA)이 다른 사람입니다.
   둘 다 <b>셈이 아니라 말</b>의 문제라 고치면 기준선을 0 으로 내리십시오. */
const BASE = { 이름표없음: 0, 낯선이름표: 0, 안가려짐: 1, 다른1번: 1 };

const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.osLoadClients=function(){};window.cmLoadAll=function(cb){if(cb)cb();};
 window.toast=function(){};window.setupShow=function(){return false;};window.osIsOwner=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1'};GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 OS_NTC={list:[],loaded:true,busy:false,err:'',max:12,posting:false,at:Date.now(),sig:null};
 OS_NOTICE=null;window.osNoticeLoad=function(){};window.osNoticeLocalGet=function(){return null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';AR.cliRows=[];AR.calls=[];
 /* 단계를 <b>섞어</b> 둡니다 — 카드 큐(전부)와 미션 풀(전화 자리)이
    갈리는 판이라야 이 점검이 할 일이 있습니다 */
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''},
        {id:'d2',who:'me',name:'홍길동B',region:'광양',src:'개척',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
        {id:'d3',who:'me',name:'홍길동C',region:'여수',src:'일반',stage:'PC',days:6,n:3,res:'상담',cAt:'',pAt:''}];
 CM.loaded=true;CM.who={me:'홍길동'};CM.meta={};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 try{['apex_hm_qdone_v1','apex_hm_skip_v1','apex_hm_fold_v1','apex_newslive'].forEach(function(k){localStorage.removeItem(k);});}catch(e){}
 if(typeof NLIVE!=='undefined'){NLIVE.items=[];NLIVE.at='';}
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.evaluate(SEED);
  await page.waitForTimeout(1600);

  const R = await page.evaluate(() => {
    const pane = document.getElementById('dynPane');
    /* 「오늘 … N분/명/개」 라고 적는 자리를 다 찾는다 */
    const RE = /(\d+)\s*(분|명|개)(?![월일])/;
    const said = [];
    const walk = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const e = n.parentElement;
      if (!e || !e.offsetParent) continue;
      /* 그 자리가 <b>오늘</b> 이야기를 하고 있나 — 한 칸 위 글까지 본다 */
      const near = ((e.closest('[data-ask]') || e.parentElement || e).textContent || '').replace(/\s+/g, ' ');
      const t = (n.nodeValue || '').replace(/\s+/g, ' ');
      if (!RE.test(t)) continue;
      if (!/오늘/.test(near)) continue;
      /* 이름표는 <b>제 자리나 위쪽</b> 어디에 있어도 된다 */
      const holder = e.closest('[data-ask]');
      const ns = (near.match(/(\d+)\s*(?:분|명|개)/g) || []).map(s => parseInt(s, 10));
      said.push({
        글: near.trim().slice(0, 48),
        ask: holder ? holder.getAttribute('data-ask') : '',
        수: ns.length ? ns[ns.length - 1] : parseInt((t.match(RE) || [])[1], 10)
      });
    }
    /* 「1번이 누구인가」 */
    const card = ((pane.querySelector('.hm-now .hm-now-m .m b') || {}).textContent || '').replace(/님$/, '').trim();
    const host = document.getElementById('hmMsHost');
    const msNames = ((host && host.textContent) || '').match(/홍길동[A-Z]/g) || [];
    let queue = [];
    try { queue = hmLeft().list.map(z => z.t || ''); } catch (e) {}
    let two = {};
    try { two = { hmLeft: hmLeft().all, hmCount: (hmCount() || {}).total }; } catch (e) {}
    return { said, card, msNames, queue, two };
  });

  /* 같은 글이 여러 text node 로 쪼개져 두 번 잡히는 것을 접는다 */
  const seen = {}, said = [];
  R.said.forEach(s => { const k = s.ask + '|' + s.글; if (!seen[k]) { seen[k] = 1; said.push(s); } });

  console.log('\n[0] 홈이 <b>「오늘 …」 숫자</b>를 적는 자리');
  said.forEach(s => console.log('      ' + (s.ask ? ('[' + s.ask + '] ') : '[이름표 없음] ') + s.수 + ' ← 「' + s.글 + '」'));
  is(said.length > 0, '  적는 자리를 찾았다 — ' + said.length + '곳');

  console.log('\n[1] 숫자를 적으면 <b>무엇을 세는지 스스로 말한다</b> (data-ask)');
  const 없음 = said.filter(s => !s.ask);
  is(없음.length <= BASE.이름표없음,
    '  이름표 없이 적는 자리 ' + 없음.length + '곳 — 기준선 ' + BASE.이름표없음 +
    (없음.length ? (' ← ' + 없음.map(s => '「' + s.글.slice(0, 26) + '」').join(' · ')) : ''));

  console.log('\n[2] 이름표는 <b>물음 대장에 있는 것</b>만 쓴다');
  const 낯선 = said.filter(s => s.ask && !ASK[s.ask]);
  is(낯선.length <= BASE.낯선이름표,
    '  대장에 없는 이름표 ' + 낯선.length + '가지 — 기준선 ' + BASE.낯선이름표 +
    (낯선.length ? (' ← ' + [...new Set(낯선.map(s => s.ask))].join(' · ')) : ''));

  console.log('\n[3] <b>같은 이름표끼리 수가 같다</b> — 여기가 갈리면 진짜 버그다');
  const by = {};
  said.forEach(s => { if (!s.ask) return; (by[s.ask] = by[s.ask] || []).push(s); });
  Object.keys(by).forEach(k => {
    const ns = [...new Set(by[k].map(s => s.수))];
    is(ns.length === 1,
      '  [' + k + '] ' + by[k].length + '곳이 모두 <b>' + ns.join(' / ') + '</b> 라고 말한다' +
      (ns.length > 1 ? ' ← 갈렸다. ' + (ASK[k] ? ASK[k].뜻 : '') : ''));
  });

  console.log('\n[4] <b>다른 물음이면 그렇다고 화면에 적혀 있다</b>');
  const nums = [...new Set(Object.keys(by).map(k => by[k][0].수))];
  let 안가려짐 = 0;
  Object.keys(by).forEach(k => {
    const d = ASK[k] && ASK[k].구별;
    if (!d) return;                      /* 으뜸 물음은 가릴 것이 없다 */
    const 글 = by[k].map(s => s.글).join(' ');
    const ok = d.some(w => 글.indexOf(w) >= 0);
    if (!ok) 안가려짐++;
    console.log('      [' + k + '] ' + (ok ? '가려진다' : '<b>안 가려진다</b>') +
      ' — 「' + by[k][0].글.slice(0, 34) + '」 (' + ASK[k].뜻 + ')');
  });
  is(nums.length <= 1 || 안가려짐 <= BASE.안가려짐,
    '  다른 수를 말하면서 <b>무엇을 세는지 안 적은</b> 자리 ' + 안가려짐 + '곳 — 기준선 ' + BASE.안가려짐 +
    (nums.length > 1 ? (' · 화면에 선 수 ' + nums.join(' / ')) : ' · 수가 하나뿐이라 헷갈릴 일이 없다'));

  console.log('\n[5] 미션에 뜬 분은 <b>오늘 큐에서</b> 나온다 — 따로 고르지 않는다 (5번)');
  let 밖 = R.msNames.filter(nm => R.queue.indexOf(nm) < 0);
  is(밖.length === 0,
    '  큐 밖에서 온 분 ' + 밖.length + '명' + (밖.length ? (' ← ' + 밖.join(' · ')) : '') +
    ' · 큐 ' + R.queue.join(' → '));
  /* ⚠ 위 한 줄만으로는 <b>거저 통과합니다</b> — 미션이 제 손으로 고르더라도
     그 분들이 큐에도 있으면 아무 말이 없습니다. 실제로 되돌려 보고 알았습니다.
     그래서 <b>한 분을 끝내 놓고</b> 봅니다. 끝낸 분은 큐에서 빠지므로,
     미션이 큐를 안 보고 있으면 <b>그 분이 ① 에 그대로 남아</b> 걸립니다 (8번). */
  const F = await page.evaluate(async () => {
    const before = ((document.getElementById('hmMsHost') || {}).textContent || '').match(/홍길동[A-Z]/g) || [];
    /* <b>미션에 떠 있는 분</b>을 끝냅니다 — 큐에만 있고 미션에 없는 분을
       끝내면 「빠졌다」 가 저절로 참이라 자가 헛집습니다 (8번). */
    const L = hmLeft().list;
    const who = L.filter(z => before.indexOf(z.t) >= 0)[0] || L[0] || {};
    hmQfin(who.key);
    await new Promise(r => setTimeout(r, 500));
    const after = ((document.getElementById('hmMsHost') || {}).textContent || '').match(/홍길동[A-Z]/g) || [];
    let q = []; try { q = hmLeft().list.map(z => z.t || ''); } catch (e) {}
    return { 끝낸분: who.t || '', before, after, 큐: q };
  });
  const 남음 = F.끝낸분 && F.after.indexOf(F.끝낸분) >= 0;
  const 밖2 = F.after.filter(nm => F.큐.indexOf(nm) < 0);
  is(!남음 && 밖2.length === 0,
    '  <b>「' + (F.끝낸분 || '?') + '」 을 끝내니</b> 미션 ① 에서도 빠진다 — ' +
    '미션 ' + (F.before.join('·') || '없음') + ' → ' + (F.after.join('·') || '없음') +
    ' · 큐 ' + (F.큐.join('·') || '없음') +
    (남음 ? ' ← <b>끝냈는데 남아 있습니다</b>' : '') +
    (밖2.length ? (' ← 큐 밖: ' + 밖2.join('·')) : ''));

  console.log('\n[6] <b>「1번」 이 두 곳에서 같은 사람인가</b>');
  const 다름 = (R.card && R.msNames.length && R.card !== R.msNames[0]) ? 1 : 0;
  is(다름 <= BASE.다른1번,
    '  카드의 1번 「' + (R.card || '없음') + '」 · 미션 ①의 1번 「' + (R.msNames[0] || '없음') + '」 — ' +
    (다름 ? '<b>다릅니다</b>' : '같습니다') + ' · 기준선 ' + BASE.다른1번);

  console.log('\n[7] 「오늘 몇 분」 을 <b>두 함수가 세는데</b> 값이 같은가 (5번)');
  is(R.two.hmLeft === R.two.hmCount,
    '  hmLeft() ' + R.two.hmLeft + ' · hmCount() ' + R.two.hmCount +
    (R.two.hmLeft === R.two.hmCount ? ' — 같다' : ' ← <b>갈렸다.</b> 한 곳만 남기십시오'));

  console.log('\n[8] 콘솔');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 3).join(' | ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 한 화면이 스스로 다른 말을 합니다')
                  : '✓ 한 물음에 한 답입니다 (어긋난 자리는 기준선 안쪽).');
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
