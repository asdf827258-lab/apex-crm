/* ══════════════════════════════════════════════════════════════════
   check-ntcimg.js — <b>공지 사진이 홈을 열 때마다 17MB 씩 나가던 자리.</b>

   2026-09-23 배포된 앱을 브라우저로 열어 그대로 셌습니다.
   <b>로그인도 하기 전에</b> —

     os_notices?select=img&id=eq.6dac80ac…  →  <b>12.4MB</b> (500 이 날 때도)
     os_notices?select=img&id=eq.204c2dfc…  →   5.8MB
     os_notices?select=img&id=eq.7d09733a…  →   2.8MB

   한 번 여는 데 <b>17.6MB</b>. 하루 백 번이면 1.7GB 입니다. CLAUDE.md 7번의
   「무료 한도를 세 배로 넘겨 로그인까지 막힌 적이 있습니다」 가 이 자리입니다.

   담는 쪽은 이미 고쳐져 있었습니다(한 장 400KB · 모두 1.2MB). 터지는 것은
   그 고치기 <b>전</b>에 담긴 옛 자료라, <b>읽는 쪽</b>을 막습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 목록을 읽을 때 <b>크기(img_len)까지</b> 받는다
     [2] 상한을 넘으면 <b>서버를 아예 안 부른다</b> — 이것이 이 점검의 핵심
     [3] <b>크기를 모르면 막지 않는다</b> (1번) — 준비 SQL 전에는 여태처럼
     [4] 화면에 <b>몇 MB 인지</b> 적는다 — 「사진 없음」으로 뭉개지 않는다
     [5] 줄여 담기는 <b>대표·관리자에게만</b> — 서버 규칙이 그렇다
     [6] 줄이는 자리가 <b>하나</b>다 (5번) — 파일에서 온 것도, 담겨 있던
         글자도 같은 길로 지나간다
     [7] 물러서기 — img_len 칸이 <b>없는</b> 서버에서도 targets·must_ack 를
         한꺼번에 잃지 않는다 (여태 두 칸이라 잃었다)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8956;
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

/* 견본 공지 — 글은 <b>홍길동</b> 집안 말고 공지 문구라 그대로 씁니다 (3번).
   o.hasLen=false 면 <b>준비 SQL 을 안 돌린 서버</b>를 흉내 냅니다 — img_len 을
   달라고 하면 400 을 주고, 앱이 한 칸 물러서는지 봅니다.                */
const SEED = (o) => `
 window.__T='';window.__IMGQ=[];window.__COLS=[];
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'${o.role || 'member'}',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 window.osOwnerEmail=function(){return '';};window.osMyEmail=function(){return '';};
 GB.loaded=true;GB.teams=[];GB.rows=[];AR.db=[];AR.cliRows=[];AR.loaded=true;
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];CM.loaded=true;CM.who={};
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 try{ localStorage.removeItem('apex_notice_local'); }catch(e){}
 /* 세 줄 — 아주 큰 것 · 큰 것 · 작은 것. <b>작은 것은 받아야</b> 한다.
    작은 줄이 없으면 「전부 막기」로 고쳐도 초록이 된다 (8번). */
 var NTC=[
  {id:'n-big', text:'큰 사진 공지',   active:true, created_at:'2026-08-03T06:10:24Z', author:'윤시현',
   targets:null, must_ack:false, img_len:${o.bigLen === undefined ? 12442133 : o.bigLen}},
  {id:'n-mid', text:'중간 사진 공지', active:true, created_at:'2026-08-03T05:30:28Z', author:'윤시현',
   targets:null, must_ack:true,  img_len:5845473},
  {id:'n-sml', text:'작은 사진 공지', active:true, created_at:'2026-08-02T17:24:03Z', author:'윤시현',
   targets:null, must_ack:false, img_len:120000}];
 var IMG={'n-big':'[{"s":"data:image/png;base64,AAAA","c":""}]',
          'n-mid':'[{"s":"data:image/png;base64,BBBB","c":""}]',
          'n-sml':'[{"s":"data:image/png;base64,CCCC","c":""}]'};
 window.osClient=function(){
  var mk=function(t){
   var st={t:t,op:'',cols:'',id:'',sel:false};
   var a={
    update:function(){st.op='update';return a;},insert:function(){st.op='insert';return a;},
    upsert:function(){st.op='upsert';return a;},'delete':function(){st.op='delete';return a;},
    select:function(c){st.sel=true;st.cols=c||'';if(t==='os_notices'){window.__COLS.push(st.cols);}return a;},
    order:function(){return a;},range:function(){return a;},limit:function(){return a;},
    single:function(){return a;},gte:function(){return a;},'in':function(){return a;},
    is:function(){return a;},neq:function(){return a;},not:function(){return a;},
    eq:function(k,v){st.id=v;return a;},
    then:function(ok,no){
     if(t!=='os_notices')return Promise.resolve({data:[],error:null}).then(ok,no);
     if(st.op)return Promise.resolve({data:[{id:st.id}],error:null}).then(ok,no);
     /* <b>사진 한 줄</b>을 달라고 한 것인가 — 이것을 세는 것이 이 점검이다 */
     if(st.cols==='img'){ window.__IMGQ.push(st.id);
       return Promise.resolve({data:[{img:IMG[st.id]||''}],error:null}).then(ok,no); }
     /* 준비 SQL 을 안 돌린 서버 흉내 — img_len 을 달라고 하면 400 */
     if(${o.hasLen === false ? 'true' : 'false'} && st.cols.indexOf('img_len')>=0)
       return Promise.resolve({data:null,error:{message:'column os_notices.img_len does not exist'}}).then(ok,no);
     var want=st.cols.split(','), rows=NTC.map(function(r){
       var out={},i; for(i=0;i<want.length;i++){var k=want[i]; if(k in r)out[k]=r[k];} return out; });
     return Promise.resolve({data:rows,error:null}).then(ok,no);
    }};
   return a;};
  return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 OS_NTC.loaded=false;OS_NTC.at=0;OS_NIMG={};
 go('home');
 if(typeof osNoticeLoad==='function')osNoticeLoad(true);`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(1800);
    /* 사진 칸은 <b>눈에 들어올 때</b> 받는다 — 보이게 해 준다 */
    await p.evaluate(() => { try { osNtcImgWatch(); } catch (e) {}
      document.querySelectorAll('[data-ntc-img]').forEach(e => { try { osNtcImgGet(e.getAttribute('data-ntc-img')); } catch (x) {} }); });
    await p.waitForTimeout(700);
    return { ctx, p, errs };
  };
  const look = (p) => p.evaluate(() => ({
    asked: (window.__IMGQ || []).slice(),
    cols: (window.__COLS || []).slice(),
    st: { big: osNtcImgSt('n-big'), mid: osNtcImgSt('n-mid'), sml: osNtcImgSt('n-sml') },
    len: { big: osNtcLenOf('n-big'), mid: osNtcLenOf('n-mid'), sml: osNtcLenOf('n-sml') },
    txt: (document.getElementById('osNoticeHome') || document.body).innerText.replace(/\s+/g, ' '),
    rows: (OS_NTC.list || []).map(x => ({ id: x.id, ack: x.mustAck }))
  }));

  const A = await open({});
  is(A.errs.length === 0, '  홈을 여는 동안 콘솔 오류가 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));
  const a = await look(A.p);

  console.log('\n[1] 목록을 읽을 때 <b>크기(img_len)까지</b> 받는다');
  is(a.cols.some(c => c.indexOf('img_len') >= 0),
     '  첫 질의가 <b>img_len</b> 을 달라고 한다 — ' + (a.cols[0] || '').slice(0, 64));
  is(a.len.big === 12442133 && a.len.sml === 120000,
     '  줄마다 <b>제 크기</b>를 들고 있다 — 큰 것 ' + a.len.big + ' · 작은 것 ' + a.len.sml);

  console.log('\n[2] 상한을 넘으면 <b>서버를 아예 안 부른다</b> (7번)');
  is(a.asked.indexOf('n-big') < 0, '  12.4MB 짜리는 <b>안 부른다</b>' +
     (a.asked.indexOf('n-big') >= 0 ? ' ← 불렀다' : ''));
  is(a.asked.indexOf('n-mid') < 0, '  5.8MB 짜리도 <b>안 부른다</b>');
  /* ⚠ <b>작은 것은 받아야 한다.</b> 이 줄이 없으면 「전부 막기」로 고쳐도
     초록이 된다 — 그러면 공지 사진이 통째로 사라진다 (8번). */
  is(a.asked.indexOf('n-sml') >= 0, '  <b>작은 것은 그대로 받는다</b> — 전부 막는 것이 아니다');
  is(a.st.big === 'big' && a.st.mid === 'big' && a.st.sml === 'ok',
     '  상태가 갈린다 — 큰 것 ' + a.st.big + ' · 중간 ' + a.st.mid + ' · 작은 것 ' + a.st.sml);

  console.log('\n[3] <b>크기를 모르면 막지 않는다</b> (1번)');
  /* 준비 SQL 을 안 돌리셨으면 img_len 이 없다. 그때 「크다」고 단정해
     멀쩡한 공지를 숨기면 그게 더 나쁘다. */
  const N = await open({ hasLen: false });
  const n = await look(N.p);
  is(n.len.big === null, '  크기를 <b>모른다</b>고 둔다 — 0 으로 채우지 않는다 (1번)');
  is(n.asked.indexOf('n-big') >= 0, '  모르면 <b>여태처럼 받아 본다</b> — 숨기지 않는다');

  console.log('\n[7] 물러서기 — img_len 이 없어도 <b>확인 요청</b>을 안 잃는다');
  /* 여태는 「풍성한 것 → 맨 기본」 두 칸이라, img_len 이 없는 서버에서
     targets·must_ack 까지 한꺼번에 잃었다. 확인 대상 공지가 안 뜬다. */
  is(n.cols.length >= 2 && n.cols[1].indexOf('must_ack') >= 0,
     '  <b>한 칸씩</b> 물러선다 — 2번째 질의 ' + (n.cols[1] || '').slice(0, 56));
  const mid = (n.rows || []).filter(r => r.id === 'n-mid')[0];
  is(!!(mid && mid.ack), '  그래서 <b>확인 요청(must_ack)</b>이 그대로 산다');

  console.log('\n[4] 화면에 <b>몇 MB 인지</b> 적는다 (1번)');
  is(/11\.9MB|11,9MB/.test(a.txt), '  큰 것을 <b>11.9MB</b> 라고 적는다 — ' +
     ((a.txt.match(/사진이 [^라]*라 안 받았습니다/) || [''])[0]));
  is(/5\.6MB/.test(a.txt), '  중간 것도 <b>제 크기</b>로 적는다 — 뭉뚱그리지 않는다');
  is(!/사진 없음|사진이 없습니다/.test(a.txt),
     '  <b>「사진 없음」으로 뭉개지 않는다</b> — 안 올린 줄 아시면 다시 올리십니다 (1번)');
  is(/받아 보기/.test(a.txt), '  <b>그래도 받아 보는 길</b>을 남긴다');

  console.log('\n[5] 줄여 담기는 <b>대표·관리자에게만</b>');
  is(!/줄여서 다시 담기/.test(a.txt) && /대표·관리자/.test(a.txt),
     '  팀원에게는 <b>안 보인다</b> — 눌러도 서버가 막는다(os_notices_admin_write)');
  const M = await open({ role: 'admin' });
  const m2 = await look(M.p);
  is(/줄여서 다시 담기/.test(m2.txt), '  관리자에게는 <b>보인다</b>');
  /* 받아 두지도 않고 누르면 <b>못 줄인다고 말한다</b> — 조용히 아무 일도
     안 일어나면 「눌렀는데 안 된다」가 된다 */
  const say = await M.p.evaluate(() => { window.__T = ''; osNtcImgFix('n-big'); return window.__T; });
  is(/먼저|받아야/.test(say), '  받아 두기 전에 누르면 <b>그렇다고 말한다</b> — ' + say.slice(0, 40));

  console.log('\n[6] 줄이는 자리가 <b>하나</b>다 (5번)');
  const src = fs.readFileSync('app/index.html', 'utf8');
  is(/function osNtcShrinkUrl\(/.test(src), '  <b>osNtcShrinkUrl</b> 한 곳이 줄인다');
  /* ⚠ <b>파일 전체에서 toDataURL 을 세면 안 됩니다.</b> PDF·프로필 사진·
     카드뉴스에도 있어 일곱 곳이 나옵니다 — 헛것을 잡는 점검은 안 잡는
     점검보다 나쁩니다 (8번). <b>공지(osNtc) 자리 안에서만</b> 셉니다. */
  const ntc = src.slice(src.indexOf('function osNtcShrinkUrl'), src.indexOf('function osNoticeImgFile'));
  is(ntc.length > 200 && (ntc.match(/toDataURL\(/g) || []).length === 1,
     '  공지 자리에서 줄이는 코드가 <b>한 벌</b>이다 — ' +
     (ntc.match(/toDataURL\(/g) || []).length + '곳');
  is(/osNtcShrinkUrl\(''\+rd\.result/.test(src),
     '  파일에서 고른 것도 <b>같은 길</b>로 지나간다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 공지 사진 — 큰 것은 안 받고, 왜 안 받는지 말합니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
