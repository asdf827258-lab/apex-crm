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
     「묻는 덮개가 서버를 부르나」 하나다 — 여기서 다시 센다 (8번). */
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

  console.log('\n[7] 덮개가 <b>다음 화면을 안 덮는다</b>');
  /* ★ 실제로 그러고 있었습니다. 나갈 때 뜼는 덮개를 안 닫았더니, 다음
     화면으로 가도 그 덮개가 <b>화면을 통째로 덮고</b> 있었고, 앱이 멈춘
     것처럼 보였습니다. check-stayput 이 먼저 잡았습니다 (8번). */
  await p.evaluate(() => { localStorage.removeItem('apex_crm_when'); go('crm'); });
  await p.waitForTimeout(350);
  is((await sheet()).on, '  들어가면 뜼고');
  await p.evaluate(() => go('clients')); await p.waitForTimeout(350);
  /* 여기서 뜼는 것은 <b>맞습니다</b> — 나가실 때 여쭤보는 그 덮개입니다.
     잘못된 것은 <b>그 다음</b>입니다 — 달아나지 않고 또 화면을 옮기면,
     덮개가 그대로 따라가 새 화면을 통째로 덮습니다. 앱이 멈춘 것처럼
     보입니다 — check-stayput 이 먼저 잡은 자리입니다 (8번). */
  is((await sheet()).on, '  나갈 때 여쭤보는 덮개는 <b>거기서 뜼는 게 맞다</b>');
  await p.evaluate(() => go('home')); await p.waitForTimeout(350);
  const G = await p.evaluate(() => {
    const e = document.getElementById('crqSheet');
    const hit = document.elementFromPoint(innerWidth >> 1, 24);
    return { on: !!(e && e.classList.contains('on')),
      covers: !!(hit && e && (hit === e || e.contains(hit))) };
  });
  is(G.on === false, '  <b>또 옮기면 사라진다</b> — 달아나지 않는다');
  is(G.covers === false, '  새 화면의 <b>맨 윗줄을 안 덮는다</b>');
  await p.evaluate(() => { crqClose(); localStorage.removeItem('apex_crm_when'); });

  console.log('\n[8] <b>서버를 안 부른다</b> (7번) · 터진 곳이 없다');
  /* ★ 앱은 뜨면서 제 일로 소식도 받아 옵니다. 그것까지 세면 이 줄은
     언제나 빨간불이고, 그러면 <b>무엇을 재는지 알 수 없습니다</b> — 헛것을
     잡는 점검은 안 잡는 점검보다 나쁘다 (8번). 그래서 <b>묻는 덮개의 글</b>을
     직접 봅니다 — 거기에 서버를 부르는 줄이 없으면 부를 길이 없습니다. */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const blk = (SRC.split('var CRQ=')[1] || '').split('function hdbStripHtml')[0];
  is(blk.length > 1000, '  ⑦ 칸이 index.html 에 있다 — ' + blk.length + '자');
  is(!/fetch\s*\(|osClient\s*\(|\.from\s*\(/.test(blk),
     '  묻는 덮개에 <b>서버를 부르는 줄이 없다</b> (7번)');
  is(/localStorage/.test(blk), '  고르신 시각은 <b>이 브라우저에만</b> 담긴다 (3번)');
  is(/document\.hidden/.test(blk),
     '  화면이 <b>뒤로 가 있으면 쉰다</b> — 안 보는 화면에서 돌지 않는다 (7번)');
  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  /* ══ [9] <b>홈 카드에서 오시면 안 묻는다</b> ═══════════════════════════
     2026-09-26 에 설계사처럼 몰아 보다 잡았습니다. 홈 카드의 큰 단추
     「🤝 만나러 갑니다」 를 누르면 DB 통합 CRM 으로 가는데, 거기서 이
     덮개가 떠서 <b>한 번 더</b> 눌러야 했습니다. 이미 그 사람과 그 일을
     고르신 뒤인데 또 묻는 것은 권유가 아니라 <b>한 번 누를 일을 두 번</b>
     으로 만드는 것입니다.
     ★ 그렇다고 <b>덮개를 지우면 안 됩니다</b> — 사장님 말씀 ⑦ 입니다.
       서랍·메뉴로 들어가실 때는 그대로 물어야 합니다. 그것도 여기서 같이
       잽니다. 한쪽만 재면 고치다 저쪽을 죽입니다 (1번).
     ★ 자국이 <b>낡으면 다시 묻는지</b>도 잽니다 — 영영 안 묻게 되면
       ⑦ 이 조용히 죽습니다.                                          */
  console.log('\n[9] <b>홈 카드에서 오시면 안 묻는다</b> — 이미 고르셨다 (⑦ 은 그대로)');
  /* ⓐ 홈 카드의 큰 단추가 가는 그 길로 — hmOpen 을 진짜로 부른다 */
  await p.evaluate(() => {
    try { localStorage.removeItem('apex_crm_when'); } catch (e) {}
    crqClose(); go('home');
    window.hmSteps = () => [{ key: 'k1', k: 'db', gox: 'crm', id: '' }];
    CRQ.viaHome = 0;
  });
  await p.waitForTimeout(350);
  await p.evaluate(() => hmOpen('k1'));
  await p.waitForTimeout(450);
  const H1 = await sheet();
  is(H1.on === false, '  홈 카드에서 오면 <b>덮개가 안 뜬다</b>' + (H1.on ? (' ← 「' + H1.t.slice(0, 34) + '…」') : ''));
  const kept8 = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('apex_crm_when') || '{}'); } catch (e) { return {}; } });
  is(!!kept8.did, '  <b>「시작했다」 로 적힌다</b> — 그래야 나갈 때도 안 묻는다 · ' + JSON.stringify(kept8));
  await p.evaluate(() => go('home')); await p.waitForTimeout(400);
  is((await sheet()).on === false, '  <b>나갈 때도 안 묻는다</b> — 답이 한 곳에 있다 (5번)');

  /* ⓑ 서랍·메뉴로 들어가면 <b>그대로 묻는다</b> — ⑦ 이 안 죽었나 */
  await p.evaluate(() => { try { localStorage.removeItem('apex_crm_when'); } catch (e) {} crqClose(); CRQ.viaHome = 0; go('home'); });
  await p.waitForTimeout(300);
  await p.evaluate(() => go('crm')); await p.waitForTimeout(400);
  const H2 = await sheet();
  is(H2.on && /고객 관리부터 시작하시죠/.test(H2.t),
     '  <b>서랍으로 들어가면 그대로 묻는다</b> — 사장님 말씀 ⑦ 이 안 죽었다');

  /* ⓒ 자국이 <b>낡았으면</b> 다시 묻는다 — 영영 안 묻는 것이 아니다 */
  await p.evaluate(() => { try { localStorage.removeItem('apex_crm_when'); } catch (e) {} crqClose(); go('home'); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { CRQ.viaHome = Date.now() - 999999; go('crm'); });
  await p.waitForTimeout(400);
  const H3 = await sheet();
  is(H3.on && /고객 관리부터 시작하시죠/.test(H3.t),
     '  자국이 <b>낡았으면 다시 묻는다</b> — 한 번 홈에서 왔다고 영영 안 묻지 않는다');
  await p.evaluate(() => { crqClose(); go('home'); }); await p.waitForTimeout(350);

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ CRM 묻기 — 고칠 자리 ' + bad + '곳'
    : '✓ CRM — 들어가면 시작을 권하고, 나가면 언제 할지 묻고, 그 시각에 한 번 알려 드립니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
