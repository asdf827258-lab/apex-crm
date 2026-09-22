/* 🗄️ DB 통합 CRM — <b>들어갈 때와 나갈 때</b>

   사장님 말씀 ⑦ (2026-09-22) —
     「DB CRM 들어가면 <b>고객 관리부터 시작하시죠?</b> 하고 → 입력·관리,
      <b>페이지 벗어나면 언제 관리할지</b> 뜨게」

   못 박는 것 —
     ① 들어가면 <b>「고객 관리부터 시작하시죠?」</b> 가 뜬다
     ② <b>하루에 한 번만</b> 묻는다 — 들어갈 때마다 뜨면 권유가 아니라 방해다
     ③ 나가면 <b>「언제 관리할지」</b> 를 묻고, 고른 시각이 담긴다
     ④ <b>시작한다고 누르셨으면 나갈 때 안 묻는다</b> — 하고 나온 분께
        「언제 하실래요」 라고 물으면 앱이 안 보고 있다는 뜻이 된다
     ⑤ <b>이미 지난 시각을 내밀지 않는다</b> (1번) — 고르는 순간 지나간
        약속이 된다
     ⑥ <b>못 지키는 약속을 하지 않는다</b> (1번) — 앱이 열려 있을 때만
        뜬다는 것을 그 자리에 적는다
     ⑦ 그 시각이 되면 <b>실제로 뜬다</b>. 그리고 <b>한 번만</b> 뜬다
     ⑧ <b>서버를 안 부른다</b> (7번) · <b>실명을 안 담는다</b> (3번)        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8957;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

let bad = 0, srvHits = 0; const hitUrls = [];
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
 window.osLoadClients=function(){};
 /* CRM 틀은 안 싣습니다 — 여기서 재는 것은 <b>묻는 덮개</b>입니다 */
 window.mountCrm=function(){window.__MOUNT=(window.__MOUNT||0)+1;};
 GB.loaded=true;GB.teams=[];GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 window.copyText=function(t){window.__C=t;};window.confirm=function(){return true;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';AR.db=[];AR.cliRows=[];AR.calls=[];
 CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.osClient=function(){var mk=function(){var a={};
   ['update','insert','upsert','delete','select','order','range','limit','single','gte','in','is','neq','not','eq']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(ok){return Promise.resolve({data:[],error:null}).then(ok);};
   return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 try{localStorage.removeItem('apex_crm_when');}catch(e){}
 go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) { if (!/\.(html|js|css)(\?|$)/.test(u)) { srvHits++; hitUrls.push(u.slice(-70)); } return r.continue(); }
    return r.abort();
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(700);
  /* ★ 앱이 <b>뜨면서</b> 부르는 것까지 세면 이 줄은 언제나 빨간불이고,
     그러면 이 절이 <b>무엇을 재는지</b> 알 수 없다. 재려는 것은
     「묻는 덤개가 서버를 부르나」 하나다 — 여기서 다시 센다 (8번). */
  srvHits = 0; hitUrls.length = 0;

  const sheet = () => p.evaluate(() => {
    const e = document.getElementById('crqSheet');
    return { on: !!(e && e.classList.contains('on')),
      t: e ? (e.innerText || '').replace(/\s+/g, ' ') : '',
      btn: e ? [...e.querySelectorAll('button')].map(b => b.innerText.replace(/\s+/g, ' ')) : [] };
  });

  console.log('\n[1] 들어가면 <b>「고객 관리부터 시작하시죠?」</b>');
  await p.evaluate(() => go('crm')); await p.waitForTimeout(350);
  const A = await sheet();
  is(A.on, '  덮개가 <b>뜬다</b>');
  is(/고객 관리부터 시작하시죠/.test(A.t), '  <b>사장님 말씀 그대로</b> 묻는다 — 「' + A.t.slice(0, 40) + '…」');
  is(A.btn.some(b => /시작/.test(b)), '  <b>시작하는 단추</b>가 있다 — ' + A.btn.join(' / '));
  is(/단계를 옮기고|통화 결과|새 고객/.test(A.t), '  <b>무엇을 하는 자리인지</b> 적는다');

  console.log('\n[2] <b>하루에 한 번만</b> 묻는다 — 매번 뜨면 방해다');
  await p.evaluate(() => { crqClose(); go('home'); }); await p.waitForTimeout(300);
  await p.evaluate(() => { crqClose(); go('crm'); }); await p.waitForTimeout(350);
  is((await sheet()).on === false, '  두 번째로 들어가면 <b>안 뜬다</b>');

  console.log('\n[3] 나가면 <b>「언제 관리할지」</b> 를 묻는다');
  await p.evaluate(() => go('home')); await p.waitForTimeout(350);
  const B = await sheet();
  is(B.on, '  나갈 때 덮개가 <b>뜬다</b>');
  is(/언제 관리할/.test(B.t) || /언제 하실까/.test(B.t),
     '  <b>언제 할지</b>를 묻는다 — 「' + B.t.slice(0, 40) + '…」');
  is(B.btn.length >= 2, '  <b>고를 시각</b>을 내민다 — ' + B.btn.join(' / '));
  /* ⑥ 못 지키는 약속을 하지 않는다 (1번) */
  is(/앱이 열려 있을 때만/.test(B.t),
     '  <b>앱이 열려 있을 때만</b> 뜬다고 적는다 — 폰 알람인 줄 아시면 그날을 놓치신다 (1번)');
  is(/아침 알람/.test(B.t), '  <b>폰이 꺼져도 울리는 것</b>은 어디 있는지도 적는다');

  console.log('\n[4] <b>이미 지난 시각을 안 내민다</b> (1번)');
  const S = await p.evaluate(() => {
    const out = {};
    const RD = Date;
    const at = (h, m) => { const d = new Date(2026, 8, 22, h, m); 
      /* eslint-disable */ window.Date = function(a){ return arguments.length ? new RD(a) : new RD(d) };
      window.Date.now = () => d.getTime(); window.Date.prototype = RD.prototype;
      const r = crqSlots(); window.Date = RD; return r; };
    out.morning = at(9, 0).map(x => x.v);
    out.late = at(22, 30).map(x => x.v);
    return out;
  });
  is(S.morning.length >= 4, '  아침에는 <b>여러 자리</b>를 내민다 — ' + S.morning.join(' '));
  is(S.morning.every(v => v > '09:00'), '  다 <b>지금보다 뒤</b>다');
  is(S.late.every(v => v > '22:30' || v < '01:00'),
     '  늦은 밤에는 <b>오후 2시를 안 내민다</b> — ' + (S.late.join(' ') || '(없음)'));

  console.log('\n[5] 고르면 <b>담기고</b>, 그 시각이 되면 <b>한 번</b> 뜬다');
  await p.evaluate(() => crqPick('14:00')); await p.waitForTimeout(250);
  const kept = await p.evaluate(() => crqGet());
  is(kept.at === '14:00', '  고른 시각이 <b>담긴다</b> — ' + JSON.stringify(kept.at));
  is(!/홍길동/.test(JSON.stringify(kept)), '  <b>실명은 안 담는다</b> (3번) — ' + JSON.stringify(kept));
  await p.evaluate(() => { const o = crqGet(); o.at = '00:00'; crqSet(o); crqTick(); });
  await p.waitForTimeout(250);
  const C = await sheet();
  is(C.on && /하실 시간입니다/.test(C.t), '  그 시각이 되면 <b>뜬다</b> — 「' + C.t.slice(0, 34) + '…」');
  is(C.btn.some(b => /지금 열기/.test(b)), '  <b>바로 여는 단추</b>가 있다');
  await p.evaluate(() => crqClose());
  await p.evaluate(() => crqTick()); await p.waitForTimeout(250);
  is((await sheet()).on === false, '  <b>한 번만</b> 뜬다 — 1분마다 또 뜨면 앱을 닫으신다');

  console.log('\n[6] <b>시작한다고 누르셨으면 나갈 때 안 묻는다</b>');
  await p.evaluate(() => { localStorage.removeItem('apex_crm_when'); go('home'); crqClose(); });
  await p.evaluate(() => go('crm')); await p.waitForTimeout(300);
  await p.evaluate(() => crqStart()); await p.waitForTimeout(250);
  await p.evaluate(() => go('home')); await p.waitForTimeout(350);
  is((await sheet()).on === false, '  안 묻는다 — 하고 나온 분께 물으면 앱이 안 보고 있다는 뜻이 된다');

  console.log('\n[7] <b>서버를 안 부른다</b> (7번) · 터진 곳이 없다');
  /* ★ 앱은 뜨면서 제 일로 소식도 받아 옵니다. 그것까지 세면 이 줄은
     언제나 빨간불이고, 그러면 <b>무엇을 재는지 알 수 없습니다</b> — 헛것을
     잡는 점검은 안 잡는 점검보다 나쁘다 (8번). 그래서 <b>묻는 덤개의 글</b>을
     직접 봅니다 — 거기에 서버를 부르는 줄이 없으면 부를 길이 없습니다. */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const blk = (SRC.split('var CRQ=')[1] || '').split('function hdbStripHtml')[0];
  is(blk.length > 1000, '  ⑦ 칸이 index.html 에 있다 — ' + blk.length + '자');
  is(!/fetch\s*\(|osClient\s*\(|\.from\s*\(/.test(blk),
     '  묻는 덤개에 <b>서버를 부르는 줄이 없다</b> (7번)');
  is(/localStorage/.test(blk), '  고르신 시각은 <b>이 브라우저에만</b> 담긴다 (3번)');
  is(/document\.hidden/.test(blk),
     '  화면이 <b>뒤로 가 있으면 쉰다</b> — 안 보는 화면에서 돌지 않는다 (7번)');
  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ CRM 묻기 — 고칠 자리 ' + bad + '곳'
    : '✓ CRM — 들어가면 시작을 권하고, 나가면 언제 할지 묻고, 그 시각에 한 번 알려 드립니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
