/* ══════════════════════════════════════════════════════════════════
   check-onecard.js — <b>「오늘 한 분」 카드가 목업의 짜임새인가.</b>

   사장님 말씀 (2026-09-25) — 「<b>카드 짜임새를 목업처럼</b>」.

   목업(docs/토스판_사본.html)의 .one 카드는 이 차례로 읽힙니다 —
     <b>누구</b>(아바타+이름 크게) → <b>왜 오늘인가</b>(회색 상자) →
     <b>무엇을</b>(큰 한 문장) → <b>어떻게</b> → <b>큰 단추 한 방</b>
   앱은 작은 파란 단계 이름표가 먼저 서고, 할 일은 「무엇을 할까요?」
   번호 ①번에 <b>평문으로 눌려</b> 들어가 있었습니다 — 사장님이
   apex-stage.js 에 굵게 적어 두신 데가 화면에서 지워졌습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>차례</b> — 이름 → 왜 오늘인가 → 무엇을 → 어떻게 → 큰 단추
     [2] <b>누구인지가 먼저</b> — 이름이 카드에서 제일 큰 글씨다
     [3] <b>할 말이 apex-stage.js 그대로</b> — 굵게 강조한 데까지 살아 있다
     [4] <b>같은 말을 두 번 안 적는다</b> — 그 문장이 번호 갈래에 또 없다
     [5] <b>단추가 두 벌이 아니다</b> — 큰 단추도 hmPicks ①번을 부른다
     [6] <b>접은 것을 조용히 안 버린다</b> — 한 분께 거리가 여럿이면 적는다
     [7] <b>없는 것은 안 그린다</b> — 표에 할 말이 없는 줄(연락할 분)에
         그럴듯한 문장을 지어 세우지 않는다 (1번)

   ★ <b>글자를 여기 안 적습니다.</b> 할 말은 apex-stage.js 에서 그때그때
     읽습니다 — 여기 베껴 두면 사장님이 그 파일을 고치실 때 이 줄이 낡아
     거짓말이 됩니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8939;
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

/* 견본은 <b>홍길동</b> 집안입니다 (3번).
   · ap   단계(AP)가 붙은 분 — 표에 <b>할 말이 있는</b> 줄
   · both 같은 분이 <b>두 자리</b>에서 올라온다 — 배정 DB 와 30일 약속.
          hmSteps 가 한 줄로 접으면서 x.more 에 세어 둡니다.
   · only 배정 DB 가 <b>없는</b> 판 — 30일 약속만 남아 표에 할 말이 없습니다 */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(){};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1'};
 GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return (i==='me')?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=${o.only ? '[]' : `[{id:'${o.both ? 'c1' : 'd1'}',who:'me',name:'홍길동A',region:'순천',src:'일반',
        stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''}]`};
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=${(o.both || o.only)
   ? `[{id:'c1',name_masked:'홍○○',advisor_id:'me',consent_status:'none',created_at:'2026-01-02'}]`
   : '[]'};
 CM.meta={c1:{touch:[]}};
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 try{ localStorage.removeItem('apex_hm_qdone_v1');
      localStorage.removeItem('apex_hm_skip_v1');
      localStorage.removeItem('apex_hm_fold_v1');
      localStorage.removeItem('apex_newslive'); }catch(e){}
 if(typeof NLIVE!=='undefined'){NLIVE.items=[];NLIVE.at='';}
 window.osClient=function(){var mk=function(){var a={
   update:function(){return a;},insert:function(){return a;},upsert:function(){return a;},
   'delete':function(){return a;},select:function(){return a;},order:function(){return a;},
   range:function(){return a;},limit:function(){return a;},single:function(){return a;},
   gte:function(){return a;},'in':function(){return a;},is:function(){return a;},
   neq:function(){return a;},not:function(){return a;},eq:function(){return a;},
   then:function(o2,n2){return Promise.resolve({data:[],error:null}).then(o2,n2);}};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

/* 카드를 통째로 재 온다 */
const look = (p) => p.evaluate(() => {
  const card = document.querySelector('#dynPane .hm-now');
  if (!card) return null;
  const q = (s) => card.querySelector(s);
  const at = (s) => { const e = q(s); return e ? [].indexOf.call(card.children, e.closest('.hm-now>*')) : -1; };
  const fs2 = (e) => e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : 0;
  const one = (typeof hmNext === 'function') ? hmNext() : null;
  const x = one && one.x;
  const picks = (x && typeof hmPicks === 'function') ? hmPicks(x) : [];
  /* 표(apex-stage.js)가 이 단계에 뭐라 적어 두었나 — <b>여기서 읽습니다</b> */
  const st = x ? ((x.k === 'db') ? x.tk : x.k) : '';
  const map = (window.APEX_STAGE && APEX_STAGE.map) ? (APEX_STAGE.map[st] || null) : null;
  return {
    ord: { nm: at('.hm-now-m'), why: at('.hm-why'), aim: at('.hm-aim'),
           way: at('.hm-way'), go: at('.hm-do') },
    nmTxt: (q('.hm-now-m .m b') || {}).textContent || '',
    nmPx: fs2(q('.hm-now-m .m b')),
    ktPx: fs2(q('.hm-now-k')),
    /* 카드 안에서 <b>제일 큰 글씨</b>가 이름인가 */
    maxPx: (() => { let m = 0;
      card.querySelectorAll('*').forEach(e => {
        if (!e.offsetParent) return;
        const n = e.childNodes[0];
        if (!(n && n.nodeType === 3 && (n.nodeValue || '').trim())) return;
        const v = parseFloat(getComputedStyle(e).fontSize);
        if (v > m) m = v; });
      return Math.round(m); })(),
    aimHtml: (q('.hm-aim') || {}).innerHTML || '',
    wayTxt: (q('.hm-way') || {}).textContent || '',
    whyTxt: (q('.hm-why') || {}).textContent || '',
    doTxt: ((q('.hm-do') || {}).textContent || '').trim(),
    doAttr: (q('.hm-do') || {}).getAttribute ? (q('.hm-do').getAttribute('onclick') || '') : '',
    askTxt: (q('.hm-ask') || {}).textContent || '',
    mapAim: map ? (map.aim || '') : '',
    mapWay: map ? (map.way || '') : '',
    pick0: picks[0] ? (picks[0].act || '') : '',
    more: x ? (x.more || 0) : 0,
    kind: x ? x.k : '',
    btnOf: (x && window.HM_ACT && HM_ACT[x.k]) ? (HM_ACT[x.k].btn || '') : ''
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } });
  /* 바깥은 막습니다 — CI 에는 네트워크가 있어 진짜 요청이 나갑니다 (8번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(SEED({}));
  await page.waitForTimeout(900);
  const A = await look(page);

  console.log('\n[1] 목업의 <b>차례</b>로 선다 — 누구 → 왜 오늘인가 → 무엇을 → 어떻게 → 단추');
  if (!A) { is(false, '  카드가 안 섭니다'); }
  else {
    const seq = [A.ord.nm, A.ord.why, A.ord.aim, A.ord.way, A.ord.go];
    is(seq.every(v => v >= 0) && seq.every((v, i) => i === 0 || v > seq[i - 1]),
      '  다섯이 <b>이 차례</b>로 선다 — 이름' + A.ord.nm + ' · 왜' + A.ord.why +
      ' · 무엇' + A.ord.aim + ' · 어떻게' + A.ord.way + ' · 단추' + A.ord.go +
      (seq.some(v => v < 0) ? ' ← 없는 것이 있다' : ''));

    console.log('\n[2] <b>누구인지가 먼저</b> — 이름이 카드에서 제일 큰 글씨다');
    is(A.nmPx > A.ktPx && A.nmPx >= A.maxPx,
      '  이름 ' + A.nmPx + 'px · 단계 이름표 ' + A.ktPx + 'px · 카드에서 제일 큰 글씨 ' + A.maxPx + 'px ' +
      '— 「' + A.nmTxt.trim() + '」');

    console.log('\n[3] 할 말이 <b>apex-stage.js 그대로</b> 선다 — 굵게 강조한 데까지');
    is(!!A.mapAim && A.aimHtml.trim() === A.mapAim.trim(),
      '  <b>무엇을</b> 이 표에 적힌 글자 그대로다 — 「' + A.aimHtml.trim().slice(0, 44) + '」');
    is(/<b>/.test(A.aimHtml),
      '  <b>굵게 강조한 데가 살아 있다</b> — 평문으로 누르면 어디가 핵심인지 사라진다');
    is(!!A.mapWay && A.wayTxt.trim() === A.mapWay.replace(/<[^>]*>/g, '').trim(),
      '  <b>어떻게</b> 도 표 그대로다 — 「' + A.wayTxt.trim().slice(0, 40) + '」');

    console.log('\n[4] <b>같은 말을 두 번 안 적는다</b> (5번)');
    const bare = A.mapAim.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    is(!!bare && A.askTxt.replace(/\s+/g, '').indexOf(bare) < 0,
      '  그 문장이 <b>번호 갈래에 또 없다</b> — 두 번 적히면 눈이 미끄러진다');

    console.log('\n[5] <b>단추가 두 벌이 아니다</b> — 큰 단추도 hmPicks ①번을 부른다');
    is(/hmPick\(/.test(A.doAttr) && /,\s*0\)/.test(A.doAttr) && A.pick0 === 'open',
      '  큰 단추가 <b>hmPick(…,0)</b> 을 부른다 — 「' + (A.doAttr || '없다').slice(0, 38) + '」');
    is(/갑니다|보내기|열기/.test(A.doTxt),
      '  단추가 <b>무엇을 하는 단추인지</b> 말한다 — 「' + (A.doTxt || '없다') + '」');
  }

  /* ── [6] 접은 것을 조용히 안 버린다 ── */
  console.log('\n[6] 한 분께 거리가 여럿이면 <b>몇 가지인지 적는다</b> (1번)');
  await page.evaluate(SEED({ both: true }));
  await page.waitForTimeout(900);
  const B = await look(page);
  is(!!B && B.more >= 1,
    '  같은 분이 <b>두 자리</b>에서 올라와 한 줄로 접혔다 — 접은 것 ' + (B ? B.more : 0) + '가지');
  is(!!B && /거리가/.test(B.whyTxt),
    '  그것을 <b>화면에 적는다</b> — 「' + ((B && B.whyTxt) || '안 적는다').replace(/\s+/g, ' ').trim().slice(0, 52) + '」');

  /* ── [7] 없는 것은 안 그린다 ── */
  console.log('\n[7] 표에 <b>할 말이 없는 줄</b>에는 지어 세우지 않는다 (1번)');
  await page.evaluate(SEED({ only: true }));
  await page.waitForTimeout(900);
  const C = await look(page);
  is(!!C && !C.mapAim && C.ord.aim < 0 && C.ord.way < 0,
    '  「' + ((C && C.kind) || '?') + '」 줄에는 <b>큰 문장을 안 세운다</b> — 표에 적힌 것이 없다');
  is(!!C && C.ord.go >= 0 && !!C.btnOf && C.doTxt === C.btnOf,
    '  그래도 <b>단추는 선다</b> — HM_ACT 가 적어 둔 그대로 「' + ((C && C.doTxt) || '없다') + '」');
  /* ★ <b>「거리가 N가지」 하나만</b> 적혀서는 안 됩니다. 달력에서 올라온 줄은
     제 한 줄(s)이 비어 있어 「왜 오늘인가 —」 뒤가 통째로 빈 적이 있습니다.
     그 갈래가 무엇이라 말하는지는 HM_ORD 표에 이미 적혀 있습니다.       */
  /* ⚠ <b>제가 쓴 자가 한 번 거저 통과했습니다.</b> 처음에는 「·」 앞을 잘라
     봤는데, 까닭이 통째로 비면 「·」 자체가 안 붙어서 <b>거리 수가 머리로
     올라와</b> 늘 초록이었습니다. 이제 <b>거리 수를 먼저 걷어내고</b> 남는
     것이 있는지 봅니다 — 되돌려 보고 알았습니다 (8번).                  */
  const head = ((C && C.whyTxt) || '')
    .replace(/왜 오늘인가\s*—/, '')
    .replace(/·?\s*이분께 거리가 \d+가지/, '')
    .replace(/[·\s]+/g, ' ').trim();
  is(head.length >= 4,
    '  <b>왜 오늘인가</b> 에 <b>진짜 까닭</b>이 적힌다 — 「' +
    ((C && C.whyTxt) || '안 적는다').replace(/\s+/g, ' ').trim().slice(0, 52) + '」');

  console.log('\n[8] 콘솔');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 3).join(' | ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 카드가 목업의 짜임새가 아닙니다')
                  : '✓ 카드가 목업의 차례로 서고, 할 말은 표에 적힌 그대로입니다.');
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
