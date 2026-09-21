/* ══════════════════════════════════════════════════════════════════
   check-nlauto.js — <b>오늘 소식을 저절로, 그러나 하루 한 번만.</b>

   사장님 말씀 (2026-09-21) — 「오늘 뉴스 받아오는 것도 <b>자동으로</b> 안 되나」.

   아침 미션 ②④⑤ 는 받아 둔 소식이 있어야 채워집니다. 그런데 받아 오는
   것이 손이라, 안 누르면 다섯 가지 중 셋이 빈 채로 하루가 갑니다.

   ⚠ 그렇다고 <b>저절로 부르는 것</b>은 이 앱에서 제일 비싼 실수가 났던
     자리입니다 — 안 보는 화면이 60초마다 본문 120건을 받아 무료 한도를
     <b>세 배</b>로 넘겨 로그인까지 막혔습니다 (CLAUDE.md 7번).
     그래서 자동은 <b>홈을 여는 그때 · 하루 한 번</b>뿐이어야 합니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>타이머가 아니다</b> — setInterval 로 소식을 부르지 않는다
     [2] 홈을 열면 <b>한 번</b> 부른다 (아직 오늘 것이 없을 때)
     [3] <b>오늘 것이 이미 있으면</b> 안 부른다
     [4] <b>오늘 한 번 해 봤으면</b> 못 받았어도 다시 안 부른다 —
         안 그러면 서버가 안 될 때 홈을 열 때마다 두드린다
     [5] 다른 탭에 가 있으면 <b>쉰다</b> (document.hidden)
     [6] 로그인 전에는 <b>안 부른다</b>
     [7] 받아 오면 <b>홈이 그 자리에서 채워진다</b> — 📸 오늘 올릴 것과
         🌅 아침 미션이 같이 다시 칠해진다
     [8] 못 받아도 <b>지어내지 않는다</b> (1·9번) — 못 받았다고 적고
         손으로 받는 단추를 세운다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8937;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
/* 진짜 기사 두 건 — 고객 이름이 아니라 기사 제목이라 그대로 쓴다 */
const NEWS = [
  { title: '실손보험 청구 전산화 2단계 시행 — 의원급 확대', source: '연합뉴스', date: '2026-09-21', link: 'https://example.com/a' },
  { title: '기준금리 동결 … 가계대출 관리 강화', source: '한국경제', date: '2026-09-20', link: 'https://example.com/b' }
];
let hits = 0, fail = false;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  /* 소식 창구 — <b>몇 번 불렸는지</b> 센다. 그것이 이 점검의 자다 */
  if (p.indexOf('/api/market') === 0) {
    hits++;
    rs.writeHead(fail ? 500 : 200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify(fail ? { ok: false, message: '서버가 자료를 주지 못했습니다.' }
                               : { ok: true, news: NEWS })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ${o.anon ? '' : `OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};`}
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(){};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};
 GB.loaded=true;GB.teams=[];GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'보장분석',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 try{ ${o.have
    ? `localStorage.setItem('apex_newslive',JSON.stringify({at:nlToday()+' 09:00',got:2,drop:0,
         items:[{t:'${NEWS[0].title}',s:'${NEWS[0].source}',d:'${NEWS[0].date}',u:'${NEWS[0].link}',cats:['ins']}]}));`
    : `localStorage.removeItem('apex_newslive');`}
      ${o.tried ? `localStorage.setItem('apex_nl_auto_v1',nlToday());` : `localStorage.removeItem('apex_nl_auto_v1');`}
      localStorage.removeItem('apex_hm_ig_v1');
      localStorage.removeItem('apex_hm_fold_v1');
      localStorage.removeItem('apex_ck_day'); }catch(e){}
 NLIVE.items=[];NLIVE.at='';NLIVE.err='';NLIVE.busy=false;
 if(typeof nlLoad==='function')nlLoad();
 window.osClient=function(){var mk=function(){var a={
   update:function(){return a;},insert:function(){return a;},upsert:function(){return a;},
   'delete':function(){return a;},
   select:function(){return a;},order:function(){return a;},range:function(){return a;},
   limit:function(){return a;},single:function(){return a;},gte:function(){return a;},
   'in':function(){return a;},is:function(){return a;},neq:function(){return a;},not:function(){return a;},
   eq:function(){return a;},
   then:function(o2,n2){return Promise.resolve({data:[],error:null}).then(o2,n2);}};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  /* 바깥으로는 못 나가게 막되, <b>이 서버</b>로 가는 것은 통과시킨다 */
  const open = async (o) => {
    hits = 0; fail = !!(o && o.fail);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {}));
    await p.waitForTimeout(3600);        /* hmArm 이 1.8초 뒤에 nlAuto 를 부른다 */
    return { ctx, p, errs };
  };

  console.log('\n[1] <b>타이머가 아니다</b> — 되풀이해서 부르지 않는다 (7번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const loops = [];
  const re = /setInterval\(([\s\S]{0,400}?),\s*(\d+)\s*\)/g;
  let m; while ((m = re.exec(SRC))) if (/nlPull|nlAuto|api\/market/.test(m[1])) loops.push(m[2]);
  is(loops.length === 0, '  소식을 부르는 <b>setInterval 이 없다</b>' + (loops.length ? ' — ' + loops.join(',') : ''));

  console.log('\n[2] 홈을 열면 <b>한 번</b> 부른다');
  const A = await open({});
  is(A.errs.length === 0, '  콘솔 오류가 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));
  is(hits === 1, '  창구를 <b>정확히 한 번</b> 불렀다 — ' + hits + '번');
  const got = await A.p.evaluate(() => ({ n: NLIVE.items.length, at: NLIVE.at, t: (NLIVE.items[0] || {}).t || '' }));
  is(got.n > 0 && got.t === NEWS[0].title, '  받아 온 것이 <b>그 기사</b>다 — ' + got.t.slice(0, 20) + '…');

  console.log('\n[7] 받아 오면 <b>홈이 그 자리에서</b> 채워진다');
  const paint = await A.p.evaluate(() => {
    const ig = document.getElementById('hmIgHost');
    const box = document.getElementById('hmFold_ms');
    if (box && !hmFoldOpen('ms')) hmFoldToggle('ms');
    hmMsJump(1);
    return { ig: ig ? ig.innerText : '', head: document.querySelector('#hmFold_ig .hm-fold-h').innerText.replace(/\s+/g, ' ') };
  });
  await A.p.waitForTimeout(300);
  const ms = await A.p.evaluate(() => (document.getElementById('hmMsHost') || {}).innerText || '');
  is(paint.ig.indexOf(NEWS[0].title) >= 0, '  📸 오늘 올릴 것이 <b>다시 칠해졌다</b>');
  is(paint.head.indexOf('실손보험') >= 0, '  접힌 머리도 <b>그 제목</b>을 안다 — ' + paint.head);
  is(ms.indexOf(NEWS[0].title) >= 0, '  🌅 아침 미션 ② 에도 <b>그 소식</b>이 섰다');

  console.log('\n[3] <b>오늘 것이 이미 있으면</b> 안 부른다');
  const B = await open({ have: true });
  is(hits === 0, '  창구를 <b>안 불렀다</b> — ' + hits + '번');

  console.log('\n[4] <b>오늘 한 번 해 봤으면</b> 다시 안 부른다');
  const C = await open({ tried: true });
  is(hits === 0, '  소식이 없어도 <b>다시 안 두드린다</b> — ' + hits + '번');
  /* ⚠ 그리고 <b>못 받았을 때</b>도 그날은 한 번뿐이다 — 홈을 몇 번 열어도 */
  const D = await open({ fail: true });
  is(hits === 1, '  못 받은 날도 <b>한 번만</b> 두드렸다 — ' + hits + '번');
  hits = 0;
  await D.p.evaluate(() => { go('clients'); go('home'); });
  await D.p.waitForTimeout(3200);
  is(hits === 0, '  홈을 <b>다시 열어도</b> 또 안 두드린다 — ' + hits + '번');

  console.log('\n[8] 못 받아도 <b>지어내지 않는다</b> (1·9번)');
  const dz = await D.p.evaluate(() => {
    const box = document.getElementById('hmFold_ms');
    if (box && !hmFoldOpen('ms')) hmFoldToggle('ms');
    hmMsJump(4);
    return (document.getElementById('hmMsHost') || {}).innerText || '';
  });
  is(/지어내지 않습니다/.test(dz), '  <b>지어내지 않는다</b>고 적는다');
  is(/뉴스 받아 오기/.test(dz), '  <b>손으로 받는 단추</b>를 세운다');

  console.log('\n[5] 다른 탭에 가 있으면 <b>쉰다</b> (7번)');
  const E = await open({ tried: true });
  const hidden = await E.p.evaluate(() => {
    try { localStorage.removeItem('apex_nl_auto_v1'); } catch (e) {}
    Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return true; } });
    return nlAuto();
  });
  is(hidden === false && hits === 0, '  안 보는 동안에는 <b>안 부른다</b> — ' + hits + '번');

  console.log('\n[6] 로그인 전에는 <b>안 부른다</b>');
  const F = await open({ anon: true });
  is(hits === 0, '  로그인 안 했으면 <b>홈이 안 부른다</b> — ' + hits + '번');
  /* ⚠ 위 줄만으로는 <b>nlAuto 안의 지킴이</b>를 재지 못한다. hmArm 이 이미
     「로그인 안 했으면 돌아간다」 로 막고 있어서, 지킴이를 빼도 그 길로는
     안 불린다 — 실제로 빼 보니 <b>초록</b>이었다. 안 울리는 알람은 알람이
     아니다 (8번). 그래서 <b>직접 불러</b> 본다. */
  const anonCall = await F.p.evaluate(() => {
    try { localStorage.removeItem('apex_nl_auto_v1'); } catch (e) {}
    OS.profile = null;
    return nlAuto();
  });
  await F.p.waitForTimeout(400);
  is(anonCall === false && hits === 0,
     '  <b>직접 불러도</b> 로그인 전에는 안 부른다 — ' + hits + '번');

  await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 오늘 소식이 저절로, 그러나 하루 한 번만 옵니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
