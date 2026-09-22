/* 📣 <b>SNS 관리</b> — 인스타 · 블로그 · 올렸나 (사장님 말씀 ⑪)

   「인스타 & 블로그 자동화 → <b>SNS관리 버튼</b> · <b>매일 알람 권유</b> ·
    <b>승인하면 발행</b>」 (2026-09-22)

   ★ 이 앱에는 인스타그램·네이버 블로그에 <b>대신 올릴 열쇠가 없습니다.</b>
     있는 척하면 사장님은 올라간 줄 아시고 그날을 넘기십니다 (1번).
     그래서 여기서 재는 것은 <b>그 사실을 그 자리에 적었나</b> 입니다.

   못 박는 것 —
     ① 홈에 <b>SNS 관리</b> 칸이 선다 — 인스타와 블로그가 한 자리에
     ② <b>대신 안 올린다</b>고 그 자리에 적는다 (1번)
     ③ <b>블로그로 가는 길</b>이 있다
     ④ ✅ 를 누르면 <b>실행 체크판 한 통</b>(d10)에 담긴다 (5번) —
        새 저장칸을 만들면 달력·체크판과 어긋난다
     ⑤ 다시 누르면 <b>되돌아간다</b>
     ⑥ 접어 두셔도 머리에 <b>오늘 올렸는지</b>가 보인다 — 그것이 권유다
     ⑦ 기록이 없으면 <b>0일이라고 안 적는다</b> (1번)
     ⑧ 소식을 아직 못 받은 날에도 <b>SNS 관리는 선다</b> — 뉴스가 없다고
        블로그까지 못 쓰게 되면 안 된다                                  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8967;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify({ key: null, has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.copyText=function(t){window.__C=t;};
 GB.loaded=true;GB.teams=[];GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';AR.db=[];AR.cliRows=[];AR.calls=[];
 CM.loaded=true;CM.who={me:'홍길동'};OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};window.nlLoad=function(){};
 window.osClient=function(){var mk=function(){var a={};
   ['update','insert','upsert','delete','select','order','range','limit','single','gte','in','is','neq','not','eq']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(ok){return Promise.resolve({data:[],error:null}).then(ok);};
   return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 /* 오늘 기록은 지우고 시작합니다 */
 try{ Object.keys(localStorage).filter(function(k){return /^apex_ck_day_/.test(k)}).forEach(function(k){localStorage.removeItem(k)}); }catch(e){}
 go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(700);

  const box = () => p.evaluate(() => {
    const el = document.createElement('div');
    el.innerHTML = hmIgHtml();
    const b = el.querySelector('.hm-sns');
    return { has: !!b, t: b ? b.textContent.replace(/\s+/g, ' ') : '',
      blog: !!(b && b.querySelector('[onclick*="snsGoBlog"]')),
      did: !!(b && b.querySelector('[onclick*="snsDid"]')),
      undo: !!(b && b.querySelector('[onclick*="snsUndo"]')) };
  });

  console.log('\n[1] 홈에 <b>SNS 관리</b> 칸이 선다 — 인스타와 블로그가 한 자리에');
  const A = await box();
  is(A.has, '  칸이 <b>선다</b>');
  is(/SNS 관리/.test(A.t) && /인스타/.test(A.t) && /블로그/.test(A.t),
     '  <b>인스타 · 블로그</b>를 한 줄에 말한다 — 「' + A.t.slice(0, 40) + '…」');
  is(A.blog, '  <b>블로그로 가는 단추</b>가 있다');
  /* ⑧ 소식을 아직 못 받은 날에도 선다 — 뉴스가 없다고 블로그까지 막히면 안 된다 */
  is(await p.evaluate(() => {
    const keep = (typeof NLIVE !== 'undefined') ? NLIVE.items : null;
    if (typeof NLIVE !== 'undefined') NLIVE.items = [];
    const el = document.createElement('div'); el.innerHTML = hmIgHtml();
    const has = !!el.querySelector('.hm-sns');
    if (keep && typeof NLIVE !== 'undefined') NLIVE.items = keep;
    return has;
  }), '  <b>소식을 못 받은 날에도</b> 선다 — 뉴스가 없다고 블로그까지 막히면 안 된다');

  console.log('\n[2] <b>대신 안 올린다</b>고 그 자리에 적는다 (1번)');
  is(/올리는 것은 사장님이 하십니다/.test(A.t),
     '  <b>올리는 것은 사장님이 하신다</b>고 적는다');
  is(/열쇠가 없습니다/.test(A.t), '  <b>왜</b> 못 하는지도 적는다 — 열쇠가 없다');
  is(!/자동으로 올려|대신 올려 드립니다|발행됩니다/.test(A.t),
     '  <b>올려 준다고 말하지 않는다</b> — 올라간 줄 아시면 그날을 넘기신다');

  console.log('\n[3] ✅ 를 누르면 <b>실행 체크판 한 통</b>에 담긴다 (5번)');
  is(A.did && !A.undo, '  아직이면 <b>「올렸습니다」</b> 단추다');
  const B = await p.evaluate(() => {
    const before = !!(ckLoad('day') || {}).d10;
    snsDid();
    const after = !!(ckLoad('day') || {}).d10;
    return { before, after, ck: Object.keys(localStorage).filter(k => /^apex_ck_day_/.test(k)) };
  });
  is(B.before === false && B.after === true, '  체크판의 <b>d10</b> 이 켜진다');
  is(B.ck.length === 1, '  <b>새 저장칸을 안 만든다</b> — 담긴 열쇠 ' + B.ck.join(', '));
  const C = await box();
  is(C.undo && !C.did, '  누르고 나면 <b>되돌리기</b>로 바뀐다');
  is(/오늘 올리셨습니다/.test(C.t), '  <b>올리셨다고</b> 적는다');
  await p.evaluate(() => snsUndo());
  is((await p.evaluate(() => !!(ckLoad('day') || {}).d10)) === false, '  다시 누르면 <b>되돌아간다</b>');

  console.log('\n[4] 접어 두셔도 머리에 <b>오늘 올렸는지</b>가 보인다 — 그것이 권유다');
  const S1 = await p.evaluate(() => hmIgSub());
  await p.evaluate(() => snsDid());
  const S2 = await p.evaluate(() => hmIgSub());
  is(/오늘 아직/.test(S1), '  아직이면 <b>「오늘 아직」</b> — ' + S1);
  is(/오늘 올렸습니다/.test(S2), '  올리셨으면 <b>그렇게</b> — ' + S2);
  is(!/덮개|팝업/.test(A.t), '  덮개를 <b>또 띄우지 않는다</b> — 홈에 덮개가 둘 뜨면 아무것도 안 읽으신다');

  console.log('\n[5] 기록이 없으면 <b>0일이라고 안 적는다</b> (1번)');
  const D = await p.evaluate(() => {
    Object.keys(localStorage).filter(k => /^apex_ck_day_/.test(k)).forEach(k => localStorage.removeItem(k));
    const el = document.createElement('div'); el.innerHTML = hmIgHtml();
    const b = el.querySelector('.hm-sns');
    return { t: b ? b.textContent.replace(/\s+/g, ' ') : '', m: snsMonth() };
  });
  is(D.m === 0, '  이번 달 기록이 없다 — ' + D.m);
  is(!/이번 달 0일/.test(D.t) && /아직 없습니다/.test(D.t),
     '  <b>「0일」이라 안 적고 「아직 없습니다」</b> 라고 적는다 (1번)');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ SNS 관리 — 고칠 자리 ' + bad + '곳'
    : '✓ SNS 관리 — 인스타·블로그가 한 자리에 서고, 대신 올려 준다고 말하지 않습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
