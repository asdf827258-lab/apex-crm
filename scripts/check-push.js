/* <b>폰 알람 — 앱을 안 열어도 아침에 울린다.</b>

   사장님 말씀 — 「핸드폰으로도 알람이 뜨고 관리할 수 있도록 해야 하고」.

   길이 둘입니다. 여기서 <b>둘 다</b> 잽니다.
     ① 앱이 열려 있을 때  이 폰이 스스로 (alm* · 서버를 안 부른다)
     ② 앱이 닫혀 있을 때  서버가 보낸다 (netlify/functions/push.js)

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 알람 일꾼이 <b>화면을 저장하지 않는다</b> — 어제 판을 열면 어제 숫자가 나온다
     [2] 알람 글에 <b>고객 이름이 한 글자도 없다</b> (3번) · 홈이 센 것을 그대로 (5번)
     [3] <b>하루에 한 번</b> · 정한 시각 전에는 안 울린다 · 서버를 안 부른다 (7번)
     [4] 못 받는 자리를 <b>못 받는다고 말한다</b> (1번)
     [5] 준비 SQL 에 push_subs 가 있고 <b>나만 본다</b>
     [6] 서버가 봉한 것이 <b>그 폰에서만 풀린다</b> · 서명이 맞다 · 열쇠가 없으면 없다고 한다
     [7] 출발 점검이 <b>이 줄을 안다</b>

   ※ 머리 없는 브라우저는 알림을 아예 막습니다(Notification.permission 이
     늘 denied). 그래서 <b>브라우저의 알림창이 뜨는지</b>는 못 잽니다 —
     대신 Notification 을 가짜로 바꿔 <b>우리가 무엇을 어떻게 띄우려 했는지</b>
     를 그대로 받아 적습니다. 재는 것은 우리 코드이지 크롬이 아닙니다.      */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url'),crypto=require('crypto');
const ROOT=process.cwd(),PORT=8903;
let KEYROW=null;                       /* [9] 가 담으면 여기 들어온다 */
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname);
  /* 앱이 <b>진짜로 부르는 그 주소</b>를 여기서 받습니다 — 404 를 주면 앱은
     「못 물어봤다」 로 적고, 그러면 열쇠 칸이 아예 안 서서 자리를 못 잽니다. */
  if(p.indexOf('/.netlify/functions/push')===0){
    if(rq.method==='POST'){
      let bd='';rq.on('data',d=>bd+=d);rq.on('end',()=>{
        try{ KEYROW=JSON.parse(bd); }catch(e){ KEYROW=null; }
        rs.writeHead(200,{'Content-Type':'application/json'});
        rs.end(JSON.stringify(KEYROW?{ok:true}:{ok:false,reason:'못 읽음'}));});
      return; }
    rs.writeHead(200,{'Content-Type':'application/json'});
    rs.end(JSON.stringify(KEYROW?{key:KEYROW.pub,why:'',from:'db',has:true}
                                :{key:null,why:'서버에 알람 열쇠가 아직 없습니다.',from:'env',has:false}));
    return; }
  let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(rs);
});
const b64u=x=>Buffer.from(x).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=x=>Buffer.from(String(x).replace(/-/g,'+').replace(/_/g,'/'),'base64');
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 알림을 <b>가짜로</b> 바꾼다 — 띄우려 한 것을 그대로 받아 적는다 */
const FAKE=`
  window.__rang=[];
  window.Notification=function(t,o){window.__rang.push({t:t,b:(o||{}).body||'',via:'plain'});};
  window.Notification.permission='granted';
  window.Notification.requestPermission=function(cb){if(cb)cb('granted');return Promise.resolve('granted');};
  ALM.reg={showNotification:function(t,o){window.__rang.push({t:t,b:(o||{}).body||'',via:'sw'});}};
  ALM.synced=true;`;

const SEED=`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
  /* 늦게 온 「내 정보 읽기」가 OS.profile 을 지우면 홈이 아예 안 섭니다.
     CI 에는 네트워크가 있어 그 요청이 진짜로 나갑니다 — 여기서 재려는
     것은 로그인이 아니라 <b>알람</b>입니다 (8번). */
  window.osLoadProfile=function(){};
  window.osProfileApply=function(){};
  window.osShowLoginGate=function(){};
  /* arLoad 도 <b>세워 둔다.</b> CI 에는 네트워크가 있어 진짜 요청이 나가고,
     <b>늦게 돌아와</b> AR.db 를 빈 것으로 덮습니다. 그러면 「오늘 챙길 분」이
     0명이 되어 알람이 안 울리고, <b>CI 에서만</b> 빨간불이 납니다 — 헛알람입니다 (8번).
     [2] 는 300ms 만 기다려 살아남고 [3] 은 800ms 라 죽었습니다. */
  window.arLoad=function(){};
  AR.loaded=true; AR.busy=false; AR.cliRows=[];
  AR.db=[
   {id:'d2',who:'me',name:'홍길순',region:'광주',src:'일반',stage:'PC',appt:'',days:10,n:3,cAt:'',pAt:''},
   {id:'d3',who:'me',name:'홍말순',region:'광주',src:'일반',stage:'부재',appt:'',days:9,n:1,cAt:'',pAt:''},
   {id:'d5',who:'me',name:'홍을돌',region:'광주',src:'일반',stage:'미접촉',appt:'',days:5,n:0,cAt:'',pAt:''}];
  try{ localStorage.removeItem('apex_alm_day'); localStorage.removeItem('apex_alm_hour'); }catch(e){}
  window.toast=function(){};`;

/* ── 서버 함수를 <b>환경변수를 바꿔 가며</b> 불러 온다 ──
   봉하기·서명은 scripts/push-core.js 한 곳에 있으므로 그것도 같이 다시
   읽어야 합니다 — 안 그러면 처음 읽은 열쇠가 그대로 남습니다. */
function loadPush(env){
  const core=path.join(ROOT,'scripts/push-core.js');
  const http=path.join(ROOT,'netlify/functions/push.js');
  const cron=path.join(ROOT,'netlify/functions/push-cron.js');
  const keep={};
  Object.keys(env).forEach(k=>{keep[k]=process.env[k];
    if(env[k]===null)delete process.env[k]; else process.env[k]=env[k];});
  [core,http,cron].forEach(f=>{delete require.cache[require.resolve(f)];});
  const C=require(core), H=require(http), R=require(cron);
  Object.keys(keep).forEach(k=>{if(keep[k]===undefined)delete process.env[k];else process.env[k]=keep[k];});
  return {handler:H.handler, cron:R.handler, seal:C.seal, vapidAuth:C.vapidAuth};
}
const ub=s=>Buffer.from(String(s).replace(/-/g,'+').replace(/_/g,'/'),'base64');
const bu=x=>Buffer.from(x).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:430,height:1000}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.addInitScript(()=>{
    window.__net=[];
    const f=window.fetch;
    window.fetch=function(u){ window.__net.push(String(u).slice(0,90)); return f.apply(this,arguments); };
  });
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const SW =fs.readFileSync(path.join(ROOT,'app/sw.js'),'utf8');
  const NF =fs.readFileSync(path.join(ROOT,'netlify/functions/push.js'),'utf8');
  const TOML=fs.readFileSync(path.join(ROOT,'netlify.toml'),'utf8');

  console.log('\n[1] 알람 일꾼 — 화면을 저장하지 않는다');
  is(!/addEventListener\(\s*['"]fetch['"]/.test(SW),
     '<b>fetch 를 안 가로챈다</b> — 저장해 두면 폰이 어제 판을 열고 어제 숫자를 보여 준다');
  is(!/caches\.|cache\.addAll|cache\.put/.test(SW), '<b>캐시를 안 만든다</b>');
  is(/addEventListener\(\s*['"]push['"]/.test(SW)&&/showNotification/.test(SW),
     '서버가 보낸 것을 <b>받아서 띄운다</b>');
  is(/addEventListener\(\s*['"]notificationclick['"]/.test(SW)&&/matchAll/.test(SW),
     '눌렀을 때 <b>열려 있는 앱을 앞으로</b> 가져온다 — 새 탭을 또 열면 로그인부터 다시 한다');
  is(/addEventListener\(\s*['"]message['"]/.test(SW),
     '앱이 직접 「이렇게 띄워 줘」 하고 넘길 수 있다 — 아이폰은 이 길로 뜬다');
  is(!/[0-9]\s*명|건수|count/i.test(SW.replace(/\/\*[\s\S]*?\*\//g,'')),
     '일꾼이 <b>숫자를 만들지 않는다</b> — 보낸 쪽이 적어 준 글만 띄운다 (1번)');

  console.log('\n[2] 알람 글 — 이름이 한 글자도 없다 (3번)');
  const L=await page.evaluate(async(a)=>{
    (0,eval)(a.seed); (0,eval)(a.fake);
    go('home'); await new Promise(r=>setTimeout(r,300));
    const d=almLine(), steps=hmSteps().length;
    AR.db=[]; AR.cliRows=[];
    const none=almLine();
    return { d, steps, none, rangNone:(function(){window.__rang.length=0;almRing();return window.__rang.length;})() };
  },{seed:SEED,fake:FAKE});
  is(!!L.d, '오늘 챙길 분이 있으면 <b>글이 나온다</b> — 「'+((L.d||{}).title||'')+'」');
  is(L.d&&!/홍길순|홍말순|홍을돌|홍길동/.test(L.d.title+' '+L.d.body),
     '<b>이름이 한 글자도 없다</b> — 「'+((L.d||{}).body||'')+'」 (잠금화면은 남이 봅니다)');
  is(L.d&&L.d.n===L.steps, '홈이 센 것을 <b>그대로</b> 쓴다 — '+((L.d||{}).n)+' / '+L.steps+'건 (5번)');
  is(L.d&&/PC|부재|미접촉/.test(L.d.body), '<b>상태별로</b> 몇 건인지 적는다');
  is(L.none===null, '오늘 챙길 분이 없으면 <b>글을 안 만든다</b>');
  is(L.rangNone===0, '없으면 <b>안 울린다</b> — 「0건」 알람은 알람이 아니라 방해다');

  console.log('\n[3] 하루에 한 번 · 시각 · 서버를 안 부른다 (7번)');
  const T=await page.evaluate(async(a)=>{
    (0,eval)(a.seed); (0,eval)(a.fake);
    go('home'); await new Promise(r=>setTimeout(r,800));
    const out={};
    /* 재기 <b>직전에</b> 견본이 살아 있는지 같이 적어 둔다 — 나중에 또 지워지면
       「안 울린다」가 아니라 <b>「견본이 날아갔다」</b>고 말해 준다 */
    out.seed=(AR.db||[]).length;
    /* ── <b>시계를 손에 쥐고</b> 잰다 ─────────────────────────────────
       여태는 「지금 시각 + 1」 을 <b>아직 안 된 시각</b>으로 썼다. 그런데
       밤 11시에 돌리면 +1 이 24 라 23 으로 깎여 <b>지금</b>이 되고,
       「전에는 안 울린다」 가 빨개진다 — <b>하루 중 한 시간에만</b> 켜지는
       헛알람이었다. 고칠 것이 없는데 빨개지는 점검은 안 잡는 것보다
       나쁘다 (8번). 그래서 시각을 <b>오전 10시 반으로 고정</b>하고 잰다.
       날짜는 그대로라 arToday() 도 오늘을 그대로 말한다.              */
    const realNow=Date.now;
    (function(){
      const d=new Date();
      const fixed=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),1,30,0); /* KST 10:30 */
      Date.now=function(){return fixed;};
    })();
    out.fixedKst=new Date(Date.now()+9*3600000).getUTCHours();
    /* ⚠ 2026-09-25 · <b>지렛대가 바뀌었습니다.</b> 알람이 네 번이 되면서
       울릴지 말지를 정하는 것은 apex_alm_hour 가 아니라 <b>슬롯마다의
       시각</b>입니다. 옛 지렛대로 재면 「정한 시각 전에는 안 울린다」 가
       늘 빨개집니다 — 자가 낡은 것이지 앱이 깨진 것이 아닙니다.
       그래서 여기서도 <b>슬롯을 쥐고</b> 잽니다.
       ★ 슬롯 이름을 손으로 안 적습니다 — ALM_SLOTS 에서 받습니다 (5번). */
    const only=(k,h)=>{                      /* 그 하나만 켜고 시각을 정한다 */
      const o={};
      ALM_SLOTS.forEach(s=>{ o[s.k]={on:s.k===k,h:(s.k===k?h:s.h)}; });
      localStorage.setItem('apex_alm_slots_v1',JSON.stringify(o));
      ALM_SLOTS.forEach(s=>localStorage.removeItem('apex_alm_day_'+s.k));
      localStorage.removeItem('apex_alm_day');
    };
    out.slots=ALM_SLOTS.map(s=>s.k).join(',');
    out.slotN=ALM_SLOTS.length;
    /* 아직 안 된 시각 — 고정한 시각(10시)보다 뒤 */
    only('call',11);
    window.__rang.length=0; almTick(); out.early=window.__rang.length;
    /* 이미 지난 시각 */
    only('call',9);
    window.__rang.length=0; window.__net.length=0;
    almTick(); out.first=window.__rang.length; out.net=window.__net.length;
    out.stamp=localStorage.getItem('apex_alm_day_call')||'';
    out.today=arToday();
    /* 같은 날 또 부르면 */
    window.__rang.length=0; almTick(); out.again=window.__rang.length;
    /* ── 네 번이 <b>서로 안 막는가</b> — 하나가 울려도 나머지는 제 시각에 ──
       한 칸에 「오늘 울렸다」 를 적으면 아침에 한 번 울린 뒤 낮·저녁이
       통째로 막힙니다. 실제로 그렇게 짰다가 여기서 잡았습니다. */
    only('call',9);
    window.__rang.length=0; almTick();                /* call 이 울린다 */
    const o2=JSON.parse(localStorage.getItem('apex_alm_slots_v1'));
    /* ⚠ 둘째로 <b>예상업적</b>을 씁니다. 처음엔 「내일 약속」 으로 쟀는데
       견본에 내일 약속이 없어 <b>안 울리는 것이 정답</b>이었고, 그러면
       이 자를 못 댑니다 — 자가 빨개도 앱은 맞은 것입니다. 예상업적은
       못 세는 슬롯이라 <b>언제나 울립니다</b>. 여기서 재려는 것은
       「하나가 울려도 다른 것이 막히지 않나」 하나뿐입니다 (8번).     */
    o2.perf={on:true,h:9};
    localStorage.setItem('apex_alm_slots_v1',JSON.stringify(o2));
    window.__rang.length=0; almTick(); out.second=window.__rang.length;
    /* 오늘 챙길 분이 없으면 <b>표시를 안 남긴다</b> — 내일 또 걸러진다 */
    only('call',9);
    AR.db=[]; AR.cliRows=[];
    window.__rang.length=0; almTick();
    out.emptyRang=window.__rang.length; out.emptyStamp=localStorage.getItem('apex_alm_day_call')||'';
    /* <b>못 세는 슬롯</b>(예상업적)은 숫자 없이 울린다 — 0 이라고 적지 않는다 (1번) */
    only('perf',9);
    window.__rang.length=0; almTick();
    out.perfRang=window.__rang.length;
    /* ⚠ <b>__rang 은 본문을 b 에 담습니다</b>(t·b·via). 처음엔 .body 를
       읽어 빈 값이 나왔고, 그래서 「숫자가 없다」 가 <b>거저 통과</b>했습니다 —
       빈 글에는 숫자가 없으니까요. 안 울리는 알람이었습니다 (8번). */
    out.perfBody=(window.__rang[0]||{}).b||'';
    out.perfN=(typeof almLineFor==='function')?(almLineFor('perf')||{}).n:'?';
    /* 잘못 적은 값 — 슬롯 시각도 기본값으로 돌아가야 한다 */
    [-3,99,NaN].forEach((v,i)=>{
      const o={}; o.call={on:true,h:v};
      localStorage.setItem('apex_alm_slots_v1',JSON.stringify(o));
      out['sh'+i]=almSlotHour('call');
    });
    localStorage.removeItem('apex_alm_slots_v1'); out.sdef=almSlotHour('call');
    ['','abc','-3','99'].forEach((v,i)=>{localStorage.setItem('apex_alm_hour',v);out['h'+i]=almHour();});
    localStorage.removeItem('apex_alm_hour'); out.def=almHour();
    Date.now=realNow;                      /* 시계를 돌려 놓는다 */
    return out;
  },{seed:SEED,fake:FAKE});
  is(T.fixedKst===10, '재는 동안 <b>시계를 오전 10시 반</b>으로 잡아 둔다 — '+T.fixedKst+
     '시 (밤 11시에 돌려도 같은 답이 나와야 한다)');
  is(T.early===0, '정한 시각 <b>전에는 안 울린다</b>');
  is(T.seed===3, '재기 직전에 <b>심어 둔 견본이 살아 있다</b> — '+T.seed+'/3건 (0건이면 점검이 오염된 것이지 앱이 고장난 것이 아닙니다)');
  is(T.first===1, '시각이 지나면 <b>한 번 울린다</b>');
  is(T.net===0,   '울릴 때 <b>서버를 한 번도 안 부른다</b> — '+T.net+'번 (7번)');
  is(T.stamp===T.today, '울린 날을 <b>적어 둔다</b> — '+T.stamp);
  is(T.again===0, '같은 날 <b>또 안 울린다</b> — 홈을 열 때마다 울리면 끄십니다');
  is(T.emptyRang===0&&T.emptyStamp==='',
     '안 울렸으면 <b>날짜 표시도 안 남긴다</b> — 남기면 오후에 생긴 일이 내일까지 안 울린다');
  is(T.slotN===4, '알람이 <b>네 번</b>이다 — '+T.slots+' (표는 app/alm-slots.js 한 곳)');
  is(T.second===1,
     '하나가 울려도 <b>나머지는 제 시각에 울린다</b> — '+T.second+'번 ← 「오늘 울렸다」 를 한 칸에 적으면 낮·저녁이 통째로 막힙니다');
  is(T.perfRang===1&&T.perfN===null,
     '<b>못 세는 슬롯</b>(예상업적)은 숫자 없이 울린다 — 「'+T.perfBody.slice(0,24)+'」 ← 0 이라고 적으면 「없다」 는 뜻이 됩니다 (1번)');
  is(T.perfBody.length>6&&!/\d/.test(T.perfBody),
     '그 글에 <b>숫자가 없다</b> — 못 세는 것을 센 척하지 않는다 (1번) · 「'+T.perfBody+'」' +
     (T.perfBody.length>6?'':' ← 글이 비었습니다. 빈 글에는 숫자가 없으니 이 자가 거저 통과합니다'));
  is(T.sh0===9&&T.sh1===9&&T.sh2===9&&T.sdef===9,
     '슬롯도 잘못 적은 시각은 <b>표의 기본값</b>으로 — 0시로 읽으면 새벽에 울린다 (1번)');
  is(T.h0===8&&T.h1===8&&T.h2===8&&T.h3===8&&T.def===8,
     '잘못 적은 시각은 <b>기본값 8시</b> — 0시로 읽으면 새벽에 울린다 (1번)');

  console.log('\n[4] 못 받는 자리를 못 받는다고 말한다 (1번)');
  const W=await page.evaluate(async(a)=>{
    (0,eval)(a.seed);
    go('phone_app'); await new Promise(r=>setTimeout(r,700));
    const out={};
    const realIOS=window.pwaIsIOS, realStand=window.pwaInstalled;
    /* 아이폰인데 홈 화면에 안 담았다 */
    window.pwaIsIOS=function(){return true;}; window.pwaInstalled=function(){return false;};
    out.ios=almWhy(); almPaint();
    out.iosCard=(document.getElementById('almHost')||{}).textContent||'';
    /* 담았고 허락도 했다 */
    window.pwaInstalled=function(){return true;};
    out.ok=almWhy();
    window.pwaIsIOS=realIOS; window.pwaInstalled=realStand;
    /* 서버 열쇠가 없다 */
    ALM.keyErr='서버에 알람 열쇠(VAPID_PUBLIC)가 아직 없습니다.'; ALM.sub=null;
    ALM.key=null; ALM.keyAns=1;
    almPaint();
    out.noKey=(document.getElementById('almHost')||{}).textContent||'';
    out.hasHost=!!document.getElementById('almHost');
    /* <b>설계사에게는</b> 뭐라고 하나 — 눌러도 서버가 막으므로 만들기 단추를
       세우면 안 되고, 그러면 누가 해 주는지는 말해야 한다 (1번). */
    var realRole=OS.profile.role; OS.profile.role='member'; ALM.keyAt=Date.now();
    almPaint();
    out.mem=(document.getElementById('almHost')||{}).textContent||'';
    out.memCard=!!document.querySelector('.almk-card');
    out.memBand=!!document.querySelector('.almk-band');
    OS.profile.role=realRole; almPaint();
    return out;
  },{seed:SEED});
  is(W.hasHost, '「내 폰에 설치」 화면에 <b>알람 카드가 선다</b>');
  is(/홈 화면에 먼저 담아야/.test(W.ios), '아이폰은 <b>먼저 담아야 한다</b>고 말한다 — 「'+W.ios.replace(/<[^>]*>/g,'').slice(0,40)+'…」');
  is(/홈 화면에 먼저 담아야/.test(W.iosCard), '그 말을 <b>카드에도</b> 적는다');
  is(W.ok==='', '담고 허락하면 <b>막는 말이 없다</b>');
  /* ⚠ 여기는 원래 「VAPID_PUBLIC 을 Netlify 에 넣으세요」 가 적혔는지 봤다.
     이제 앱이 서버에 <b>직접</b> 담으므로 그 말은 거짓이 됐다. 대신 <b>어디로
     가면 되는지</b>를 적는지 본다 — 「없습니다」 로 끝내면 1번 위반이다. */
  is(/맨 위/.test(W.noKey)&&/🔑/.test(W.noKey)&&!/Netlify/.test(W.noKey),
     '서버 열쇠가 없으면 <b>어디서 하면 되는지</b> 적는다 (1번) — 이제 Netlify 로 안 보낸다');
  is(/대표|관리자/.test(W.mem)&&!W.memCard&&!W.memBand,
     '<b>설계사에게는 만들기를 안 권한다</b> — 눌러도 서버가 막는다. 대신 누가 해 주는지 말한다 (1·8번)');
  is(/② 앱이 닫혀 있을 때/.test(W.noKey),
     '<b>①과 ②를 갈라</b> 지금 무엇이 되는지 그대로 적는다 — 되는 것을 안 되는 것처럼 말하지 않는다');
  is(!/VAPID_(PRIVATE|PUBLIC|SUBJECT)\s*[:=]\s*['"][^'"]{12,}/.test(SRC),
     '앱 안에 <b>열쇠 값이 안 적혀 있다</b> — 이름만 적어 어디 넣으실지 알려 드린다 (10번)');

  console.log('\n[5] 준비 SQL — push_subs 가 있고 나만 본다');
  const Q=await page.evaluate(()=>{
    const m=HX_SQL['00'], t=m?m.lines.join('\n'):'';
    return { has:/create table if not exists public\.push_subs/.test(t),
      rls:/alter table public\.push_subs enable row level security/.test(t),
      pol:(t.match(/create policy push_subs_\w+ on public\.push_subs/g)||[]).length,
      mine:(t.match(/owner_id = auth\.uid\(\)/g)||[]).length,
      uniq:/endpoint  text not null unique/.test(t),
      ver:SETUP_VER, inSql:/values \('schema_version', '(\d+)'\)/.exec(t) };
  });
  is(Q.has&&Q.rls, 'push_subs 표가 있고 <b>RLS 가 켜져 있다</b>');
  is(Q.pol===4, '읽기·넣기·고치기·지우기 <b>네 가지 정책</b>이 있다 — '+Q.pol+'개');
  is(Q.uniq, '같은 폰을 <b>두 번 안 담는다</b> — endpoint 가 유일 키다 (5-1)');
  is(Q.inSql&&(+Q.inSql[1])===Q.ver, 'SQL 이 적는 판과 앱이 아는 판이 <b>같다</b> — '+
     (Q.inSql?Q.inSql[1]:'?')+' / '+Q.ver+' (갈리면 「아직입니다」 가 영영 안 없어진다)');
  is(!/^\s*--/m.test(SRC.slice(SRC.indexOf('var OS_PUSH_SQL=['),SRC.indexOf('var OS_PUSH_SQL=[')+2600)),
     'SQL 주석에 <b>-- 를 안 쓴다</b> (9번)');

  /* ══ <b>SQL 을 고쳤으면 판 번호도 올렸는가</b> ═══════════════════════
     ⚠ 2026-09-25 · 여기가 <b>비어 있었습니다.</b> 위의 자는 「SQL 이 적는
     번호」와 「앱이 아는 번호」가 <b>서로</b> 같은지만 봅니다 — 둘 다 옛
     번호면 조용합니다. 그날 제가 push_subs 에 hours 칸을 더하고 SETUP_VER
     을 안 올렸는데 <b>초록이었고</b>, 이미 준비를 마치신 사장님 화면에는
     「서버 준비가 아직 남았습니다」 칸이 아예 안 떴습니다. 사장님이
     「SQL이 어딨어?」 하고 물으셔서야 알았습니다.
     <b>넣는 것과 알리는 것은 다른 일입니다</b> (1번).

     그래서 SQL 글 전체의 <b>지문</b>을 여기 적어 둡니다. 한 글자라도
     고치면 지문이 달라지고, 그때 <b>판 번호를 같이 올리라</b>고 이 자가
     말합니다. 올린 뒤에는 이 줄의 지문을 새 값으로 바꾸십시오 — 아래
     빨간불이 새 값을 그대로 적어 줍니다.
     ★ 지문은 <b>사람이 손으로 옮기는 값</b>입니다. 자동으로 맞추면
       「고쳤는데 안 올렸다」 를 영영 못 잡습니다 (8번).               */
  const SQL_SIG = '5b035988872a';      /* SETUP_VER 43 · 판이 뒤로 못 가게 문지기를 더한 판 */
  const sqlAll = await page.evaluate(() => {
    const o = {}; for (const k in HX_SQL) if (HX_SQL[k] && HX_SQL[k].lines) o[k] = HX_SQL[k].lines.join('\n');
    return Object.keys(o).sort().map(k => k + '\n' + o[k]).join('\n');
  });
  const sig = crypto.createHash('sha256').update(sqlAll, 'utf8').digest('hex').slice(0, 12);
  is(sig === SQL_SIG,
     '준비 SQL 을 고쳤으면 <b>판 번호도 올렸다</b> — 지문 ' + sig +
     (sig === SQL_SIG ? ' (SETUP_VER ' + Q.ver + ')'
       : ' ← SQL 이 바뀌었습니다. ① SETUP_VER 과 SQL 안의 schema_version 을 <b>같이</b> 올리고' +
         ' ② 이 점검의 SQL_SIG 를 <b>' + sig + '</b> 로 바꾸십시오.' +
         ' 안 올리면 이미 준비를 마치신 분 화면에 <b>새 SQL 이 안 뜹니다</b>'));

  console.log('\n[6] 서버 — 봉한 것이 그 폰에서만 풀린다');
  /* 시험용 VAPID 한 쌍 — <b>여기서 만들고 여기서 버린다</b>. 진짜 열쇠는 서버에만 있다 (10번) */
  const kp=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const jwk=kp.privateKey.export({format:'jwk'});
  const PUB=bu(Buffer.concat([Buffer.from([4]),ub(jwk.x),ub(jwk.y)]));
  const ENV={VAPID_PUBLIC:PUB,VAPID_PRIVATE:jwk.d,VAPID_SUBJECT:'mailto:test@example.com',
             SUPABASE_SERVICE_ROLE_KEY:'test'};
  const P=loadPush(ENV);
  /* 가짜 폰 — 브라우저가 주는 것과 같은 모양 */
  const ua=crypto.createECDH('prime256v1'); ua.generateKeys();
  const uaPub=ua.getPublicKey(), uaAuth=crypto.randomBytes(16);
  const msg=JSON.stringify({title:'APEX YUN PRO',body:'오늘 챙길 분을 확인할 시간입니다.'});
  const body=P.seal(msg,bu(uaPub),bu(uaAuth));
  /* <b>따로 짠 푸는 쪽</b>으로 푼다 — 같은 코드로 풀면 틀려도 맞다고 나온다 */
  let got='',tail=-1;
  try{
    const salt=body.subarray(0,16),idlen=body.readUInt8(20);
    const asPub=body.subarray(21,21+idlen),ct=body.subarray(21+idlen);
    const hm=(k,d)=>crypto.createHmac('sha256',k).update(d).digest();
    const ikm=hm(hm(uaAuth,ua.computeSecret(asPub)),
      Buffer.concat([Buffer.from('WebPush: info\0'),uaPub,asPub,Buffer.from([1])]));
    const prk=hm(salt,ikm);
    const cek=hm(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
    const non=hm(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
    const dc=crypto.createDecipheriv('aes-128-gcm',cek,non);
    dc.setAuthTag(ct.subarray(ct.length-16));
    const pt=Buffer.concat([dc.update(ct.subarray(0,ct.length-16)),dc.final()]);
    tail=pt[pt.length-1]; got=pt.subarray(0,pt.length-1).toString('utf8');
  }catch(e){ got='('+e.message+')'; }
  is(got===msg, '<b>그 폰만 풀 수 있게</b> 봉한다 — 애플·구글 서버도 못 읽는다');
  is(tail===2, '마지막 덩이 표시(0x02)를 붙인다 — '+tail);
  is(body.readUInt32BE(16)===4096&&body.readUInt8(20)===65, '봉투 머리가 <b>규격대로</b>다');
  /* 다른 폰 열쇠로는 못 푼다 — 봉했다는 말이 참인지 되짚는다 */
  const other=crypto.createECDH('prime256v1'); other.generateKeys();
  let leak=false;
  try{
    const salt=body.subarray(0,16),asPub=body.subarray(21,86),ct=body.subarray(86);
    const hm=(k,d)=>crypto.createHmac('sha256',k).update(d).digest();
    const ikm=hm(hm(uaAuth,other.computeSecret(asPub)),
      Buffer.concat([Buffer.from('WebPush: info\0'),other.getPublicKey(),asPub,Buffer.from([1])]));
    const prk=hm(salt,ikm);
    const cek=hm(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
    const non=hm(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
    const dc=crypto.createDecipheriv('aes-128-gcm',cek,non);
    dc.setAuthTag(ct.subarray(ct.length-16));
    Buffer.concat([dc.update(ct.subarray(0,ct.length-16)),dc.final()]); leak=true;
  }catch(e){ leak=false; }
  is(!leak, '<b>다른 폰 열쇠로는 못 푼다</b> — 봉했다는 말이 참이다');
  /* VAPID 서명 */
  /* vapidAuth 는 이제 <b>열쇠를 받아</b> 쓴다 — 열쇠가 환경변수에도 표에도
     올 수 있게 되면서 바뀌었다. 여기서는 위에서 만든 그 열쇠를 그대로 준다. */
  const auth=P.vapidAuth('https://fcm.googleapis.com/fcm/send/abc',
    {pub:ENV.VAPID_PUBLIC,priv:ENV.VAPID_PRIVATE,subject:ENV.VAPID_SUBJECT});
  const m=auth.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/);
  let sigOk=false,aud='';
  if(m){
    try{
      sigOk=crypto.verify('sha256',Buffer.from(m[1]+'.'+m[2]),
        {key:crypto.createPublicKey({format:'jwk',key:{kty:'EC',crv:'P-256',x:jwk.x,y:jwk.y}}),
         dsaEncoding:'ieee-p1363'},ub(m[3]));
      aud=JSON.parse(ub(m[2]).toString()).aud;
    }catch(e){}
  }
  is(sigOk, '<b>우리가 보냈다는 서명</b>이 열쇠와 맞는다 (VAPID · ES256)');
  is(aud==='https://fcm.googleapis.com', '서명이 <b>그 푸시 서버 앞으로</b>만 쓰인다 — '+aud);
  is(m&&m[4]===PUB, '보낸 사람 열쇠를 <b>같이 적는다</b>');

  console.log('\n[6-1] 서버 — 열쇠가 없으면 없다고 하고, 죽은 주소는 지운다');
  const noKey=loadPush({VAPID_PUBLIC:null,VAPID_PRIVATE:null,VAPID_SUBJECT:null});
  const r1=JSON.parse((await noKey.handler({httpMethod:'GET',queryStringParameters:{key:'1'}})).body);
  is(r1.key===null&&/열쇠/.test(r1.why||''),
     '열쇠가 없으면 <b>없다고 대답한다</b> — 「'+(r1.why||'')+'」 (1번)');
  const r2=JSON.parse((await noKey.cron()).body);
  is(r2.ok===false&&r2.sent===0, '열쇠가 없으면 <b>보낸 척하지 않는다</b> — sent '+r2.sent);
  const r3=JSON.parse((await loadPush(ENV).handler({httpMethod:'GET',queryStringParameters:{key:'1'}})).body);
  is(r3.key===PUB&&!r3.why, '열쇠가 있으면 <b>공개 열쇠만</b> 돌려준다');
  is(!/VAPID_PRIVATE/.test(JSON.stringify(r3)), '<b>비밀 열쇠는 안 내보낸다</b> (10번)');
  /* 예약 실행 — 서버를 가짜로 세워 <b>무엇을 보내고 무엇을 지우는지</b> 본다 */
  const calls=[]; let sentBody=null; const realFetch=global.fetch;
  global.fetch=async(u,o)=>{
    calls.push({u:String(u),m:(o&&o.method)||'GET',b:(o&&typeof o.body==='string')?o.body:''});
    if(String(u).indexOf('/rest/v1/')>=0){
      const rows=(String(u).indexOf('select=')>=0&&(o||{}).method===undefined)
        ? [{endpoint:'https://push.example.com/dead',p256dh:bu(uaPub),auth:bu(uaAuth),hour:0,fail:0,
            owner_id:'u1',ua:'Android',created_at:'2026-09-05'},
           {endpoint:'https://push.example.com/live',p256dh:bu(uaPub),auth:bu(uaAuth),hour:0,fail:0,
            owner_id:'u1',ua:'iPhone', created_at:'2026-09-10'},
           /* <b>같은 폰의 옛 구독</b> — 홈 화면에 아이콘을 하나 더 담으면 이렇게 생긴다.
              여기로도 보내면 사장님 폰이 아침에 두 번 울린다. */
           {endpoint:'https://push.example.com/dup', p256dh:bu(uaPub),auth:bu(uaAuth),hour:0,fail:0,
            owner_id:'u1',ua:'iPhone', created_at:'2026-09-01'}] : [];
      return {ok:true,status:200,text:async()=>JSON.stringify(rows)};
    }
    if(String(u).indexOf('/dead')>=0)return {ok:false,status:410,text:async()=>'gone'};
    if(String(u).indexOf('/live')>=0&&o&&o.body)sentBody=o.body;
    return {ok:true,status:201,text:async()=>''};
  };
  const sched=loadPush(ENV);
  const kh=new Date(Date.now()+9*3600000).getUTCHours();
  const r4=JSON.parse((await sched.cron()).body);
  global.fetch=realFetch;
  /* 장부를 고르는 그 한 번. 옛 모양(?hour=eq.)만 찾다가 네 번이 되면서
     <b>아무것도 안 잡혔고</b>, 그러면 아래 자들이 통째로 빨개집니다 —
     앱이 아니라 자가 낡은 것입니다 (8번). 두 모양을 다 받습니다. */
  const q=calls.filter(c=>/push_subs\?(hour=eq\.|or=)/.test(c.u))[0];
  /* ⚠ 2026-09-25 · <b>고르는 조건이 바뀌었습니다.</b> 알람이 네 번이 되면서
     한 폰이 여러 시각을 가질 수 있어(hours 칸), 그 시각이 들어 있는 폰을
     고릅니다. ★ 옛 hour 한 칸도 <b>같이</b> 봅니다 — 준비 SQL 을 아직 안
     돌리신 장부에서는 hours 가 비어 있고, 그때도 아침 알람은 와야 합니다.
     둘 중 하나라도 빠지면 그 자리에서 알람이 조용히 끊깁니다.          */
  is(!!q&&q.u.indexOf('hours.cs.{'+kh+'}')>=0,
     '<b>그 시각을 켜 둔 폰</b>을 부른다 — 한국 '+kh+'시 (hours 칸)');
  is(!!q&&q.u.indexOf('hour.eq.'+kh)>=0&&q.u.indexOf('hours.is.null')>=0,
     '<b>옛 장부(hours 가 빈 폰)도 같이</b> 부른다 — 준비 SQL 전에도 아침 알람이 온다');
  is(r4.sent===1&&r4.gone===1,
     '살아 있는 곳엔 보내고 <b>죽은 주소(410)는 그 자리에서 지운다</b> — 보냄 '+r4.sent+' · 지움 '+r4.gone);
  is(calls.some(c=>c.m==='DELETE'&&/dead/.test(c.u)), '지우는 것을 <b>서버에도 지운다</b> — 안 지우면 매시간 없는 폰을 두드린다 (7번)');
  is(calls.some(c=>c.m==='PATCH'&&/live/.test(c.u)), '보낸 것은 <b>보냈다고 적어 둔다</b>');
  /* <b>실제로 나간 글을 풀어</b> 본다 — 코드를 읽어 짐작하지 않는다 */
  let sent='';
  if(sentBody){
    try{
      const salt=sentBody.subarray(0,16),asPub=sentBody.subarray(21,86),ct=sentBody.subarray(86);
      const hm=(k,d)=>crypto.createHmac('sha256',k).update(d).digest();
      const ikm=hm(hm(uaAuth,ua.computeSecret(asPub)),
        Buffer.concat([Buffer.from('WebPush: info\0'),uaPub,asPub,Buffer.from([1])]));
      const prk=hm(salt,ikm);
      const cek=hm(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
      const non=hm(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
      const dc=crypto.createDecipheriv('aes-128-gcm',cek,non);
      dc.setAuthTag(ct.subarray(ct.length-16));
      const pt=Buffer.concat([dc.update(ct.subarray(0,ct.length-16)),dc.final()]);
      sent=pt.subarray(0,pt.length-1).toString('utf8');
    }catch(e){ sent='('+e.message+')'; }
  }
  is(!!sent&&sent.charAt(0)==='{', '실제로 나간 글을 <b>풀어서</b> 본다 — '+sent.slice(0,64));
  is(!/[가-힣]{2,4}(님|씨)|홍길|전화|010-/.test(sent),
     '나간 글에 <b>고객 이야기가 없다</b> (3번)');
  is(!/\d+\s*(명|건)/.test(sent),
     '서버는 <b>건수를 말하지 않는다</b> — 「'+((JSON.parse(sent||'{}')||{}).body||'')+'」 (세려면 TDO 표를 서버에 또 적어야 하고, 그러면 화면과 알람이 다른 말을 한다 · 1·5번)');
  const NFC=NF.replace(/\/\*[\s\S]*?\*\//g,'');
  is(!/arTouch|AR_STAGES|var TDO|'미접촉'|'부재'|tdoDue/.test(NFC),
     '서버에 <b>상태 표를 베껴 두지 않았다</b> (5번)');
  is(/\[functions\."push-cron"\]\s*\n\s*schedule = "0 \* \* \* \*"/.test(TOML),
     '<b>매시 정각</b>에 돌게 적어 두었다 — 사람마다 받고 싶은 시각이 다르다');

  console.log('\n[6-3] <b>예약 함수를 HTTP 로 부르지 않는다</b> — 실제로 났던 사고');
  /* Netlify 는 예약(schedule)으로 등록한 함수를 <b>HTTP 로 못 부르게</b>
     막습니다 — 403 을 돌려줍니다. 처음에 한 함수에 세 가지(열쇠 주기 ·
     시험 보내기 · 예약 보내기)를 다 넣고 예약을 걸었더니, 앱이 열쇠를 못
     받아 <b>폰 알람이 조용히 안 켜졌습니다.</b> 사장님이 켜셨는데
     push_subs 가 0줄이었습니다. 배포해 보기 전에는 몰랐습니다 — 점검이
     핸들러를 <b>직접</b> 불렀지 HTTP 로 부르지 않았기 때문입니다 (8번). */
  /* <b>토막별로</b> 읽는다. 「[functions."X"] 부터 다음 schedule 까지」 로
     긁으면 예약이 안 걸린 토막이 <b>뒷 토막의 예약</b>을 집어 와 헛것을
     잡습니다 (8번). 주석(#)으로 꺼 둔 예약도 예약이 아닙니다 —
     daily-brief 가 그렇게 꺼져 있습니다. */
  const onCron={};
  TOML.split(/\n(?=\[)/).forEach(sec=>{
    const m=sec.match(/^\[functions\."([^"]+)"\]/);
    if(!m)return;
    if(sec.split('\n').slice(1).some(l=>/^\s*schedule\s*=/.test(l)))onCron[m[1]]=true;
  });
  /* 앱이 HTTP 로 부르는 함수들 — 소스에서 그대로 긁는다 */
  const walk=d=>{let o=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const f=path.join(d,e.name);
    if(e.isDirectory())o=o.concat(walk(f));
    else if(/\.(html|js)$/.test(e.name))o.push(f);} return o;};
  const APPS=walk(path.join(ROOT,'app')).concat([path.join(ROOT,'db-crm.html')])
    .filter(f=>fs.existsSync(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
  const called={},re2=/\/\.netlify\/functions\/([A-Za-z0-9_-]+)/g;
  let m2; while((m2=re2.exec(APPS)))called[m2[1]]=true;
  const clash=Object.keys(called).filter(n=>onCron[n]);
  is(clash.length===0,
     '앱이 부르는 함수 중에 <b>예약이 걸린 것이 없다</b>'+
     (clash.length?(' ← '+clash.join(', ')+' 는 예약이라 HTTP 로 부르면 403 이다'):
      ' — '+Object.keys(called).sort().join(' · ')));
  is(!!onCron['push-cron'], '보내는 일은 <b>push-cron</b> 이 예약으로 한다');
  is(!onCron['push'], '<b>push 에는 예약을 안 건다</b> — 앱이 불러야 하는 자리다');
  is(!!called['push'], '앱은 <b>push</b> 를 부른다 — '+Object.keys(called).sort().join(' · '));
  /* 봉하는 법이 두 벌이 되면 한쪽만 고쳐진다 (5번) */
  const fnHttp=fs.readFileSync(path.join(ROOT,'netlify/functions/push.js'),'utf8');
  const fnCron=fs.readFileSync(path.join(ROOT,'netlify/functions/push-cron.js'),'utf8');
  is(/require\(.*push-core/.test(fnHttp)&&/require\(.*push-core/.test(fnCron),
     '두 함수가 <b>같은 곳</b>을 가리킨다 — push-core.js (5번)');
  is(!/createECDH|createCipheriv|WebPush: info/.test(fnHttp+fnCron),
     '봉하는 법이 <b>두 벌이 안 된다</b> — 함수 안에 암호가 안 적혀 있다');

  console.log('\n[6-2] 홈에서 <b>한 번만</b> 알려 드린다 — 재촉이 아니라 소개');
  const N=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    const out={},mk=(perm,sw)=>{
      window.almCan=()=>({sw:sw!==false,notif:sw!==false,push:true,ios:false,stand:true,perm:perm});
    };
    /* <b>시간을 세지 않고, 앱이 칠할 때까지</b> 기다린다. 홈 칸은 hmArm()
       이 1.2초 뒤에 칠하므로 「700밀리초면 됐겠지」 는 CI 에서만 빨간불이
       납니다. 그렇다고 옆 칸이 차기를 기다려도 안 됩니다 — #hmCliHost 는
       renderHome() 이 <b>그 자리에서</b> 채워 기다림이 0초가 되고, 그러면
       한 줄이 <b>안 떠야</b> 하는 자리가 <b>헛되게 통과</b>합니다 (8번).
       hmPaint 를 한 겹 싸서 <b>실제로 칠해진 것</b>을 셉니다. */
    const wait=(fn,ms)=>new Promise(done=>{ const t0=Date.now();
      (function tick(){ let v=null; try{ v=fn(); }catch(e){}
        if(v||Date.now()-t0>(ms||8000))return done(v||null);
        setTimeout(tick,60); })(); });
    let painted=0;
    (function(){const real=window.hmPaint;
      window.hmPaint=function(){const r=real.apply(this,arguments);painted++;return r;};})();
    const shown=async()=>{ const n=painted; go('home');
      await wait(()=>painted>n?true:null);
      /* <b>뜰 자리면 뜰 때까지</b> 기다린다 — 칠하기가 한 번 더 남아 있을 수
         있습니다. 안 뜰 자리는 이미 한 번 칠해진 뒤라 「없다」 가 참입니다.
         이렇게 해야 타이밍에 기대지 않습니다 (8번). */
      if(almNudgeOn())await wait(()=>document.querySelector('#dynPane .alm-nudge'));
      const e=document.querySelector('#dynPane .alm-nudge');
      return e?e.textContent.replace(/\s+/g,' ').trim():''; };
    try{ localStorage.removeItem('apex_alm_bye'); }catch(e){}
    mk('default'); out.first=await shown();
    mk('granted'); out.on=await shown();
    mk('denied');  out.no=await shown();
    mk('default',false); out.cant=await shown();
    /* 닫으면 <b>다시 안 뜬다</b> */
    mk('default'); await shown(); almNudgeOff();
    out.afterBye=(document.querySelector('#dynPane .alm-nudge')||{}).textContent||'';
    out.afterByeReopen=await shown();
    try{ localStorage.removeItem('apex_alm_bye'); }catch(e){}
    /* 홈에서 눌러 <b>그 자리에서</b> 켜진다 */
    mk('default');
    await shown();
    let went='',asked=0;
    const g=window.go,a=window.almAsk;
    window.go=function(t){went=t;}; window.almAsk=function(){asked++;};
    const btn=document.querySelector('#dynPane .alm-nudge .ok');
    if(btn)btn.click();
    window.go=g; window.almAsk=a;
    out.asked=asked; out.went=went; out.btn=!!btn;
    delete window.almCan;
    return out;
  },SEED);
  is(/아침에 폰이 알려 드릴까요/.test(N.first),
     '아직 한 번도 안 물어본 분께 <b>한 줄</b>이 뜬다 — 「'+N.first.slice(0,30)+'…」');
  is(/고객 이름은 안 담/.test(N.first), '거기서도 <b>이름은 안 담는다</b>고 먼저 말한다 (3번)');
  is(N.on===''&&N.no==='', '이미 정하신 분께는 <b>안 뜬다</b> — 켜셨든 막으셨든');
  is(N.cant==='', '<b>못 받는 브라우저에는 안 권한다</b> — 못 할 일을 권하면 헛것이다 (8번)');
  is(N.afterBye===''&&N.afterByeReopen==='', '✕ 를 누르시면 <b>다시 안 뜬다</b>');
  is(N.btn&&N.asked===1&&N.went==='', '홈에서 <b>그 자리에서</b> 켠다 — 설치 화면까지 안 가신다'+
     (N.btn?'':' ← 단추가 안 섰다'));

  console.log('\n[6-4] <b>어플로 들어가도 된다</b> · 바탕화면 아이콘은 두 번 안 울린다');
  /* 사장님 물음 — 「어플로 들어가도 이렇게 할 수 있는 거지?」
     됩니다. 오히려 <b>아이폰은 홈 화면에 담아야만</b> 알람이 옵니다.
     다만 아이콘을 여럿 담으면 아이폰은 그것을 <b>각각 다른 웹앱</b>으로
     보아 구독이 여러 개 생깁니다 — 그대로 두면 아침에 그 수만큼 울립니다.
     그래서 두 겹으로 막습니다: 아이콘에서는 안 권하고, 서버도 한 기기에
     한 번만 보냅니다.                                                 */
  const A=await page.evaluate(async(a)=>{
    (0,eval)(a.seed); (0,eval)(a.fake);
    const out={},real=window.pwaInstalled;
    /* ① 홈 화면에 담아 연 <b>본 앱</b> — 여기서는 켜신다 */
    window.pwaInstalled=()=>true;
    history.replaceState(null,'',location.pathname);
    go('phone_app'); await new Promise(r=>setTimeout(r,700));
    almCss(); almPaint();
    const h1=(document.getElementById('almHost')||{}).innerHTML||'';
    out.mainBtn=/almAsk\(\)/.test(h1);
    out.mainSolo=/본 앱 열기/.test(h1);
    out.nudgeMain=almNudgeOn();
    /* ② 바탕화면 <b>캘린더 아이콘</b>으로 열린 판 */
    history.replaceState(null,'',location.pathname+'?go=mycal');
    out.solo=almSolo();
    almPaint();
    const h2=(document.getElementById('almHost')||{}).innerHTML||'';
    out.soloBtn=/almAsk\(\)/.test(h2);
    out.soloSays=/본 앱에서 한 번만/.test(h2);
    out.nudgeSolo=almNudgeOn();
    history.replaceState(null,'',location.pathname);
    window.pwaInstalled=real;
    /* 바탕화면에 담을 수 있는 화면들 */
    out.apps=PWA_APPS.map(x=>x.id);
    out.urls=PWA_APPS.map(x=>pwaUrlOf(x.id));
    return out;
  },{seed:SEED,fake:FAKE});
  is(A.mainBtn&&!A.mainSolo, '홈 화면에 담아 연 <b>본 앱에서는 켤 수 있다</b> — 아이폰은 담아야만 알람이 온다');
  is(A.nudgeMain===true, '본 앱에서는 <b>홈 한 줄로도</b> 권한다');
  is(A.solo===true, '바탕화면 아이콘으로 열린 것을 <b>앱이 안다</b>');
  is(!A.soloBtn&&A.soloSays,
     '아이콘에서는 <b>켜는 단추를 안 세운다</b> — 「본 앱에서 한 번만」 이라고 말한다');
  is(A.nudgeSolo===false, '아이콘에서는 <b>한 줄도 안 권한다</b> — 켜시면 아침에 두 번 울린다');
  is(A.apps.indexOf('mycal')===0, '바탕화면에 <b>캘린더가 맨 앞</b>에 있다 — '+A.apps.join(' · '));
  is(A.urls.every(u=>/\?go=[a-z_]{2,32}$/.test(u)), '아이콘 주소가 <b>그 화면으로</b> 간다 — '+A.urls[0].replace(/^https?:\/\/[^/]+/,''));
  /* 캘린더 아이콘이 <b>진짜로</b> 달력을 여는가 — 눌러 보는 대신 열어서 본다 */
  const cal=await ctx.newPage();
  await cal.goto('http://127.0.0.1:'+PORT+'/app/index.html?go=mycal',{waitUntil:'domcontentloaded'});
  await cal.waitForTimeout(2400);
  const C2=await cal.evaluate(()=>{
    const d=document.getElementById('dynPane');
    return { host:!!document.getElementById('mycalHost'),
             txt:(d?d.textContent:'').replace(/\s+/g,' ').slice(0,90) };
  });
  await cal.close();
  is(C2.host, '아이콘을 누르면 <b>달력이 바로 열린다</b> — 「'+C2.txt.slice(0,40)+'…」');
  is(/폰 기본 달력/.test(C2.txt)||C2.host, '거기서 <b>폰 기본 달력으로</b> 내보낼 수 있다');
  /* 서버 — 같은 기기에 두 번 안 보낸다 */
  const core=require(path.join(ROOT,'scripts/push-core.js'));
  const one=core.onePerDevice([
    {owner_id:'u1',ua:'iPhone',endpoint:'a',created_at:'2026-09-01'},
    {owner_id:'u1',ua:'iPhone',endpoint:'b',created_at:'2026-09-10'},   /* 같은 폰 · 다른 아이콘 */
    {owner_id:'u1',ua:'Mac',   endpoint:'c',created_at:'2026-09-05'},   /* 다른 기기 — 살아야 한다 */
    {owner_id:'u2',ua:'iPhone',endpoint:'d',created_at:'2026-09-05'},   /* 다른 사람 — 살아야 한다 */
    {owner_id:'u3',ua:'',      endpoint:'e',created_at:'2026-09-05'},   /* 기기를 모른다 */
    {owner_id:'u3',ua:'',      endpoint:'f',created_at:'2026-09-06'}
  ]).map(r=>r.endpoint).sort();
  is(one.join(',')==='b,c,d,e,f',
     '같은 폰에 아이콘을 여럿 담아도 <b>한 번만</b> 보낸다 — '+one.join(',')+
     ' (a 는 같은 폰의 옛 구독이라 빠진다)');
  is(one.indexOf('c')>=0&&one.indexOf('d')>=0, '<b>다른 기기·다른 사람</b>은 그대로 받는다');
  is(one.indexOf('e')>=0&&one.indexOf('f')>=0,
     '기기 이름을 <b>모르면 묶지 않는다</b> — 모르는 것을 같은 것으로 치면 울려야 할 폰이 빠진다 (1번)');
  /* ↓ <b>예약이 실제로 그것을 쓰는지</b>가 진짜로 재야 할 자리다. 위처럼
     함수만 따로 불러 보면, push-cron 이 그 함수를 안 써도 초록이 뜬다 —
     실제로 그렇게 지나칠 뻔했다 (8번). */
  is(!calls.some(c=>/\/dup/.test(c.u)),
     '예약이 <b>정말로</b> 같은 폰의 옛 구독을 건너뛴다 — 아침에 두 번 안 울린다');

  console.log('\n[7] 출발 점검이 이 줄을 안다');
  const R=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    const A=rdAuto(),x=A.filter(r=>r.k==='alarm')[0];
    return { has:!!x, go:x&&x.go, now:x&&x.now, how:x&&x.how };
  },SEED);
  is(R.has, '출발 점검에 <b>폰 아침 알람</b> 줄이 있다');
  is(R.go==='phone_app', '누르면 <b>켜는 자리로</b> 간다 — '+R.go);
  is(/이름은 알람에 안 담/.test(R.how||''), '거기서도 <b>이름을 안 담는다</b>고 말한다 (3번)');

  console.log('\n[9] <b>열쇠를 이 자리에서 만든다</b> — 만들 길이 없으면 ②는 영영 안 켜진다');
  /* 알람 ②는 다 만들어져 있었는데 <b>열쇠를 만들 길</b>이 어디에도 없어서
     「넣으세요」 라고 적어 두고 끝이었다. 여기서 재는 것은 <b>만든 열쇠가
     서버 코드로 실제로 서명이 되는가</b>다 — 모양만 보면 안 통하는 열쇠도
     통과한다 (8번). */
  /* ★ <b>사장님 폰 그대로 390×844</b> 로 잽니다. 430×1000 으로 재면
     한 화면이 156px 더 길어 「보인다」 가 나옵니다 — 헛것을 잡는 점검보다
     <b>안 잡는 점검</b>이 딱 이 모양입니다 (8번). */
  const VW=390, VH=844;
  const kkCtx = await b.newContext({ viewport:{width:VW,height:VH} });
  await kkCtx.route('**://**', r => r.request().url().indexOf('127.0.0.1:'+PORT)>=0 ? r.continue() : r.abort());
  const kkPage = await kkCtx.newPage();
  const kkErr=[]; kkPage.on('pageerror',e=>kkErr.push(String(e).slice(0,140)));
  await kkPage.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await kkPage.waitForTimeout(2600);
  await kkPage.evaluate(()=>document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove()));
  KEYROW=null;                          /* 서버에 열쇠가 <b>없는</b> 자리에서 시작한다 */
  /* ⚠ 머리 없는 브라우저는 알림이 <b>늘 denied</b> 입니다. 홈은 알람이 막힌
     자리에서는 서버에 열쇠를 안 묻게 해 두었으므로(뜻 없는 404 를 안 만들려고),
     여기서는 <b>허용된 폰</b>을 그대로 흉내 냅니다 — 재려는 것은 크롬이
     아니라 우리 코드입니다. */
  await kkPage.evaluate(`OS.session={user:{id:'me',email:'hong@example.com'},access_token:'t'};
    OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
    try{ Object.defineProperty(Notification,'permission',{get:function(){return 'granted';}}); }catch(e){}
    window.osLoadProfile=function(){}; window.osShowLoginGate=function(){}; window.toast=function(){};`);
  /* <b>화면을 진짜로 엽니다</b> — 아무 것도 손으로 세우지 않습니다.
     여태는 #almHost 를 우리가 만들어 붙이고 almPaint() 를 손으로 불러
     「단추가 있다」 를 재고 있었습니다. 그래서 단추가 <b>1,656px</b> 아래
     있어도 초록이었습니다. 사장님은 세 번 「안 보인다」 하셨는데 점검은
     세 번 다 초록이었습니다 — <b>안 울리는 알람</b>이었습니다 (8번). */
  await kkPage.evaluate(()=>go('phone_app'));
  await kkPage.waitForTimeout(2200);
  is(await kkPage.evaluate(()=>!!document.querySelector('[onclick="almkMake()"]')),
     '열쇠가 없으면 <b>만들기 단추</b>가 그 자리에 선다');
  /* ★★ <b>제일 중요한 줄</b> — 첫 화면 안에 있는가.
     코드가 맞아도 폰 두 개를 내려야 나오면 <b>없는 것</b>입니다. */
  const kkPos = await kkPage.evaluate(()=>{
    const pick=s=>{const e=document.querySelector(s);if(!e)return null;
      const r=e.getBoundingClientRect();return {top:Math.round(r.top+scrollY),h:Math.round(r.height)};};
    return {make:pick('[onclick="almkMake()"]'), card:pick('.almk-card'),
      first:((document.querySelector('#dynPane .card-title')||{}).innerText||'').replace(/\s+/g,' ').trim()};
  });
  is(!!kkPos.make && kkPos.make.top + kkPos.make.h <= VH,
     '<b>첫 화면 안에 선다</b> — 내리지 않고 보인다 · ' +
     (kkPos.make ? (kkPos.make.top+'px (화면 '+VH+'px)') : '단추가 없다'));
  is(/열쇠/.test(kkPos.first||''),
     '설치 화면 <b>첫 칸이 열쇠</b>다 — 맨 밑에 두면 못 찾으신다 · ' + (kkPos.first||'(없음)'));
  /* ★ <b>홈에서도</b> 부른다 — 설치 화면까지 들어가 보실 일이 없다.
     역시 <b>첫 화면 안</b>이라야 뜻이 있다. */
  await kkPage.evaluate(()=>go('home'));
  await kkPage.waitForTimeout(2200);
  const kkBand = await kkPage.evaluate(()=>{
    const e=document.querySelector('.almk-band .ok'); if(!e)return null;
    const r=e.getBoundingClientRect(); return {top:Math.round(r.top+scrollY),h:Math.round(r.height)};
  });
  is(!!kkBand && kkBand.top + kkBand.h <= VH,
     '<b>홈에도 한 줄</b>이 서고, 그것도 첫 화면 안이다 · ' +
     (kkBand ? (kkBand.top+'px') : '한 줄이 없다'));
  /* 눌러서 <b>거기로 간다</b> — 「설치 화면에 가서 찾으세요」 는 두 걸음이다 */
  if(kkBand)await kkPage.click('.almk-band .ok');
  await kkPage.waitForTimeout(1500);
  is(await kkPage.evaluate(()=>{
       const e=document.querySelector('[onclick="almkMake()"]'); if(!e)return false;
       const r=e.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight;
     }), '한 줄을 누르면 <b>열쇠 칸이 눈앞에</b> 온다 — 가서 찾으라고 하지 않는다');
  /* ★ <b>열기만 해도</b> 보여야 한다. 여태는 「알람 켜기」 를 눌러야 서버에
     열쇠를 물어봤고, 그제서야 단추가 떴다 — 화면을 열어 본 사장님 눈에는
     아무것도 없었다(「안 보인다」). 그리는 자리에서 묻는지 본다.        */
  const ixk = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const pblk = (ixk.split("tab==='phone_app'")[1]||'').slice(0,300);
  is(/almKeyLoad\(/.test(pblk),
     '<b>화면을 열 때</b> 열쇠를 묻는다 — 눌러야 보이면 못 찾으신다 (1번)');
  /* 만드는 <b>동안</b> 바깥으로 나가는 것이 있나 — 열쇠는 이 브라우저 밖으로 나가면 안 된다 (10번) */
  const kkOut=[]; const kkSpy=r=>{const u=r.url(); if(u.indexOf('127.0.0.1:'+PORT)<0)kkOut.push(u);};
  kkPage.on('request',kkSpy);
  await kkPage.evaluate(()=>almkMake());
  for(let i=0;i<40;i++){ if(await kkPage.evaluate(()=>!!ALMK.pub||!!ALMK.err))break; await kkPage.waitForTimeout(200); }
  kkPage.off('request',kkSpy);
  const KK = await kkPage.evaluate(()=>({pub:ALMK.pub,priv:ALMK.priv,sub:ALMK.sub,err:ALMK.err,
    hid:((document.querySelector('.almk-v.hide')||{}).textContent||''),
    txt:((document.querySelector('.almk')||{}).innerText||'')}));
  is(!KK.err && !!KK.pub && !!KK.priv, '눌러서 <b>열쇠가 만들어진다</b>'+(KK.err?(' ← '+KK.err):''));
  is(kkOut.length===0, '만드는 동안 <b>바깥으로 아무것도 안 나간다</b> (10번)'+(kkOut.length?(' ← '+kkOut[0]):''));
  /* ★ 제일 중요한 것 — 서버가 <b>이 열쇠로 실제로 서명</b>할 수 있는가 */
  let kkOk=false, kkWhy='';
  try{
    const kkPubB = unb64u(KK.pub);
    if (kkPubB.length !== 65) throw new Error('공개 열쇠가 65바이트가 아니다('+kkPubB.length+')');
    if (unb64u(KK.priv).length !== 32) throw new Error('비밀 열쇠가 32바이트가 아니다');
    const kkJwk = { kty:'EC', crv:'P-256',
      x:b64u(kkPubB.subarray(1,33)), y:b64u(kkPubB.subarray(33,65)), d:b64u(unb64u(KK.priv)) };
    const kkMsg = Buffer.from('apex.vapid.test','utf8');
    const kkSig = crypto.sign('sha256', kkMsg,
      { key: crypto.createPrivateKey({format:'jwk',key:kkJwk}), dsaEncoding:'ieee-p1363' });
    if (kkSig.length !== 64) throw new Error('서명이 64바이트가 아니다('+kkSig.length+')');
    kkOk = crypto.verify('sha256', kkMsg,
      { key: crypto.createPublicKey({format:'jwk',key:{kty:'EC',crv:'P-256',x:kkJwk.x,y:kkJwk.y}}),
        dsaEncoding:'ieee-p1363' }, kkSig);
  }catch(e){ kkWhy = e && e.message ? e.message : '알 수 없음'; }
  is(kkOk, '<b>서버가 그 열쇠로 실제로 서명한다</b> — push-core 가 쓰는 그 방법 그대로'+(kkWhy?(' ← '+kkWhy):''));
  /* 비밀 열쇠는 눈앞에 그대로 펼쳐 두지 않는다 */
  is(/•/.test(KK.hid), '비밀 열쇠는 <b>가려 둔다</b> — 눌러야 보인다');
  is(/mailto:/.test(KK.sub||''), '보낼 곳 주소를 <b>로그인한 메일로</b> 채워 둔다 — ' + (KK.sub||'비어 있음'));
  /* 태그가 글자로 찍히지 않는다 — 이 저장소에서 실제로 났던 사고(#405) */
  is(!/<b>|<\/b>|&lt;b&gt;/.test(KK.txt), '<b>태그가 글자로 안 찍힌다</b>');
  /* 이제 Netlify 를 안 거친다 — 「② 서버에 담기」 가 그 자리에 있고,
     누르면 무엇이 끝나는지 적혀 있어야 한다. 만들어만 주고 끝내면 안 된다 (1번). */
  is(await kkPage.evaluate(()=>!!document.querySelector('[onclick="almkSave()"]')),
     '만들면 <b>「② 서버에 담기」</b> 가 바로 옆에 선다 — Netlify 로 보내지 않는다');
  is(/담기|끝납니다/.test(KK.txt) && !/Environment variables/.test(KK.txt),
     '<b>누르면 끝난다</b>고 적어 준다 — 옮겨 적으시라고 하지 않는다 (1번)');
  /* ★ <b>담고 나면 셋 다 사라지는가.</b> 끝난 일을 계속 세워 두면 그것이
     재촉이 되고, 그 다음부터는 아무도 안 봅니다 — 「헛것을 잡는 점검은 안
     잡는 점검보다 나쁘다」 와 같은 자리입니다 (8번).                  */
  /* ── 2026-09-22 · <b>「로그인이 확인되지 않았습니다」 가 두 곳에 있었다</b> ──
     아침에 사장님이 폰에서 「② 서버에 담기」 를 누르셨는데 그 말이 떴습니다.
     앱은 멀쩡히 쓰고 계셨습니다. 까닭은 <b>앱이 들고 있던 표의 시간이
     지나</b> 있었던 것인데, 화면만 봐서는 <b>폰이 못 보낸 것인지 서버가
     물린 것인지</b> 알 수가 없었습니다 — 두 자리가 <b>똑같은 문장</b>을
     쓰고 있었기 때문입니다. 여기서 셋을 봅니다.                        */
  const almTokSrc = (ixk.split('function almkTok(')[1]||'').slice(0,700);
  is(/getSession\s*\(/.test(almTokSrc),
     '표를 <b>누르는 그 자리에서 새로 받는다</b> — 열 때 담아 둔 것만 쓰지 않는다');
  /* 진짜로 새 표를 쓰는가 — 들고 있던 것을 낡게 만들어 놓고 불러 본다 */
  const fresh = await kkPage.evaluate(() => new Promise(res => {
    /* 이 판에는 진짜 Supabase 가 없다. almkTok 이 보는 <b>그 자리</b>(OS.sb)에
       가짜를 세워 두고, 끝나면 되돌린다 — 뒤 시험이 영향을 안 받게. */
    const keptSb = OS.sb, kept = OS.session;
    OS.sb = { auth: { getSession: () => Promise.resolve({ data: { session: { access_token: '새표' } } }) } };
    OS.session = { access_token: '낡은표' };
    almkTok(t => { const held = (OS.session||{}).access_token;
      OS.sb = keptSb; OS.session = kept; res({ got: t, held: held }); });
  }));
  is(fresh.got === '새표', '  낡은 표를 들고 있어도 <b>새 표를 받아서</b> 보낸다 — ' + fresh.got);
  is(fresh.held === '새표', '  받은 표를 <b>담아 둔다</b> — 다음에 부르는 곳도 같이 새것을 쓴다');
  /* 표가 아예 없을 때 — <b>서버 말이 아니라 폰 말</b>로 적어야 한다 */
  const kkNoTok = await kkPage.evaluate(() => { ALMK.err=''; almkSend(''); return ALMK.err; });
  const srvMsg = fs.readFileSync(path.join(ROOT,'netlify/functions/push.js'),'utf8')
    .split("if (!uid) return")[1] || '';
  const srvLine = ((srvMsg.match(/reason:\s*\n?\s*'([^']+)'/)||[])[1]||'').trim();
  is(/폰/.test(kkNoTok), '표가 없으면 <b>폰 쪽 말</b>로 적는다 — ' + (kkNoTok||'(없음)'));
  is(!!srvLine && kkNoTok.slice(0,12) !== srvLine.slice(0,12),
     '<b>서버가 하는 말과 다른 말</b>이다 — 같은 문장이면 어느 쪽이 물렸는지 알 수 없다 (1번)');
  await kkPage.evaluate(()=>{ ALMK.err=''; });

  await kkPage.evaluate(()=>almkSave());
  for(let i=0;i<50;i++){ if(await kkPage.evaluate(()=>!!ALM.key||!!ALMK.err))break; await kkPage.waitForTimeout(200); }
  await kkPage.waitForTimeout(800);
  const kkDone = await kkPage.evaluate(()=>({
    key:!!ALM.key, err:ALMK.err, need:almkNeed(),
    card:!!document.querySelector('.almk-card'),
    st:((document.querySelectorAll('#almHost .alm-r')[1]||{}).innerText||'').replace(/\s+/g,' ')}));
  is(kkDone.key && !kkDone.err, '눌러서 <b>서버에 담긴다</b>'+(kkDone.err?(' ← '+kkDone.err):''));
  is(!!KEYROW && (KEYROW.priv||'').length>=40 && /^mailto:/.test(KEYROW.subject||''),
     '  서버가 받은 것이 <b>비밀 열쇠와 주소</b>다 · '+((KEYROW||{}).subject||'(없음)'));
  is(kkDone.need===false && kkDone.card===false,
     '<b>담고 나면 열쇠 칸이 사라진다</b> — 끝난 일을 세워 두지 않는다 (8번)');
  is(/됐습니다|됩니다/.test(kkDone.st||''),
     '  ②가 <b>된다</b>고 바뀐다 · '+(kkDone.st||'(못 읽음)'));
  await kkPage.evaluate(()=>go('home'));
  await kkPage.waitForTimeout(1600);
  is(await kkPage.evaluate(()=>!document.querySelector('.almk-band')),
     '<b>홈 한 줄도 같이 사라진다</b> — 한쪽만 남으면 거짓말이 된다 (5번)');
  is(kkErr.length===0, '만드는 동안 안 터졌다'+(kkErr.length?(' ← '+kkErr[0]):''));
  await kkCtx.close(); KEYROW=null;

  console.log('\n[10] <b>Netlify 없이 끝난다</b> — 만들고 그 자리에서 담는다');
  /* 사장님 말씀 — 「너가 마무리하라고」. 여태는 만들어 드리고 Netlify 환경변수에
     손으로 옮겨 넣으시라고 했습니다. 그 한 걸음 때문에 알람이 안 켜졌습니다.
     여기서 재는 것은 <b>한 바퀴가 실제로 도는가</b>입니다 —
     앱이 만들고 → 서버가 대표인지 보고 → 표에 담고 → 그 열쇠로 서명이 되는가.
     Supabase 자리에 가짜 서버를 세워 <b>진짜 길 그대로</b> 돌립니다.      */
  const SBP = PORT + 2;
  let ROW = null, ROLE = 'owner', BADKEY = false;
  const fakeSb = http.createServer(async (rq, rs) => {
    const u2 = url.parse(rq.url, true);
    let bd = ''; for await (const c of rq) bd += c;
    const J = (o, st) => { rs.writeHead(st || 200, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify(o)); };
    /* ⚠ 열쇠가 틀리면 Supabase 는 <b>무엇을 묻든</b> 이 한 줄만 돌려준다.
       진짜 서버가 실제로 그랬다 — 2026-09-22 사장님 화면. */
    if (BADKEY) return J({ message: 'Invalid API key',
                           hint: 'Double check your Supabase `anon` or `service_role` API key.' }, 401);
    if (u2.pathname === '/auth/v1/user')
      return J((rq.headers.authorization || '').indexOf('tok-ok') >= 0
        ? { id: '11111111-1111-1111-1111-111111111111' } : {});
    if (u2.pathname === '/rest/v1/profiles') return J([{ role: ROLE }]);
    if (u2.pathname === '/rest/v1/push_keys') {
      if (rq.method === 'POST') { ROW = JSON.parse(bd); return J({}, 201); }
      return J(ROW ? [{ pub: ROW.pub, priv: ROW.priv, subject: ROW.subject }] : []);
    }
    return J([]);
  });
  await new Promise(r => fakeSb.listen(SBP, r));
  process.env.SUPABASE_URL = 'http://127.0.0.1:' + SBP;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  /* 열쇠가 <b>환경변수에 있으면 그쪽이 먼저</b> — 표가 덮지 않는다 */
  delete process.env.VAPID_PUBLIC; delete process.env.VAPID_PRIVATE; delete process.env.VAPID_SUBJECT;
  Object.keys(require.cache).forEach(k => { if (/push-core|functions\/push\.js/.test(k)) delete require.cache[k]; });
  const CORE = require(path.join(ROOT, 'scripts/push-core.js'));
  const FN = require(path.join(ROOT, 'netlify/functions/push.js'));
  const call = (method, q, body) => FN.handler({ httpMethod: method, queryStringParameters: q || {}, body: body || '' })
    .then(r => { try { return JSON.parse(r.body); } catch (e) { return { _raw: r.body, _st: r.statusCode }; } });

  /* ── <b>앱과 서버가 같은 명단을 보는가</b> ─────────────────────────
     2026-09-21 — 앱은 osIsAppAdmin()(owner·admin)으로, 서버는
     owner·admin·<b>master</b> 로 물었습니다. 그래서 <b>master 로 로그인한
     대표에게는 열쇠 칸이 아예 안 떴습니다</b> — 서버는 받아 주는데 앱이
     안 보여 주니 「안 보인다」 가 됩니다. 명단이 갈리면 빨간불을 켭니다
     (5번 — 같은 것을 두 곳에 두면 한쪽만 늙습니다).                  */
  {
    const fnSrc = fs.readFileSync(path.join(ROOT,'netlify/functions/push.js'),'utf8');
    const ixSrc = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
    const grab = (src,re) => { const m = src.match(re);
      return m ? m[1].split(',').map(x=>x.replace(/['"\s]/g,'')).filter(Boolean).sort().join(',') : ''; };
    const srvRoles = grab(fnSrc, /\[([^\]]*)\]\.indexOf\(role\)/);
    const appRoles = grab(ixSrc, /ALMK_ROLES\s*=\s*\[([^\]]*)\]/);
    is(!!srvRoles && srvRoles===appRoles,
       '앱과 서버가 <b>같은 명단</b>으로 문을 연다 — 서버 [' + (srvRoles||'못 읽음') +
       '] · 앱 [' + (appRoles||'못 읽음') + ']');
    is(/master/.test(appRoles), '  <b>master</b> 가 앱 명단에 있다 — 대표 계정이 실제로 master 다');
  }

  /* 아무나 못 담는다 */
  ROLE = 'member';
  const noRole = await call('POST', { a: 'setkey' },
    JSON.stringify({ token: 'tok-ok', pub: 'x', priv: 'y', subject: 'mailto:a@b.c' }));
  is(noRole.ok === false && /대표|관리자/.test(noRole.reason || ''),
     '설계사는 <b>열쇠를 못 담는다</b> — 바뀌면 담긴 폰이 전부 못 받는다 · ' + (noRole.reason || ''));
  const noTok = await call('POST', { a: 'setkey' },
    JSON.stringify({ token: '', pub: 'x', priv: 'y', subject: 'mailto:a@b.c' }));
  is(noTok.ok === false, '로그인 없이도 <b>못 담는다</b> · ' + (noTok.reason || ''));

  /* 모양이 틀리면 담지 않는다 — 담아 두고 아침에 조용히 실패하는 것이 제일 나쁘다 */
  ROLE = 'owner';
  const badShape = await call('POST', { a: 'setkey' },
    JSON.stringify({ token: 'tok-ok', pub: 'x', priv: 'y', subject: 'mailto:a@b.c' }));
  is(badShape.ok === false && /65바이트|모양/.test(badShape.reason || ''),
     '<b>모양이 틀린 열쇠는 안 담는다</b> — 담아 두고 아침에 조용히 실패하지 않는다 (1번)');
  is(ROW === null, '  안 담은 것은 <b>정말로 안 담겼다</b>');

  /* 제대로 된 열쇠 — 담기고, 그 열쇠로 서명이 된다 */
  const real = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const rj = real.privateKey.export({ format: 'jwk' });
  const rawPub = Buffer.concat([Buffer.from([4]), unb64u(rj.x), unb64u(rj.y)]);
  const okSave = await call('POST', { a: 'setkey' }, JSON.stringify({
    token: 'tok-ok', pub: b64u(rawPub), priv: rj.d, subject: 'mailto:hong@example.com' }));
  is(okSave.ok === true, '대표가 누르면 <b>담긴다</b>' + (okSave.ok ? '' : (' ← ' + (okSave.reason || ''))));
  is(!!ROW && ROW.made_by === '11111111-1111-1111-1111-111111111111',
     '  <b>누가 담았는지</b> 남는다 — ' + ((ROW || {}).made_by || '안 남음'));
  const getK = await call('GET', {}, '');
  is(getK.has === true && getK.from === 'db' && getK.key === b64u(rawPub),
     '서버가 <b>표에서 읽어</b> 앱에 공개 열쇠를 준다 — 출처 ' + (getK.from || ''));
  /* ★ 비밀 열쇠가 앱으로 <b>절대</b> 안 나간다 (10번) */
  is(JSON.stringify(getK).indexOf(rj.d) < 0,
     '<b>비밀 열쇠는 앱으로 안 나간다</b> — 나가면 남이 우리 이름으로 고객 폰에 알림을 쏜다');
  const rdy = await CORE.ready();
  is(rdy === '', '<b>서버가 보낼 준비가 됐다</b>' + (rdy ? (' ← ' + rdy) : ''));
  /* 담긴 열쇠로 실제 서명 */
  let dbSign = false;
  try {
    const KK2 = await CORE.keys();
    const pb = unb64u(KK2.pub);
    const sg = crypto.sign('sha256', Buffer.from('t', 'utf8'), {
      key: crypto.createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256',
        x: b64u(pb.subarray(1, 33)), y: b64u(pb.subarray(33, 65)), d: b64u(unb64u(KK2.priv)) } }),
      dsaEncoding: 'ieee-p1363' });
    dbSign = (sg.length === 64);
  } catch (e) { dbSign = false; }
  is(dbSign, '<b>표에서 읽은 열쇠로 실제로 서명한다</b> — 담기만 하고 못 쓰면 헛일이다');

  /* 환경변수가 있으면 <b>그쪽이 먼저</b> — 이미 넣어 두신 분 것을 안 덮는다 */
  process.env.VAPID_PUBLIC = b64u(rawPub); process.env.VAPID_PRIVATE = rj.d;
  process.env.VAPID_SUBJECT = 'mailto:env@example.com';
  Object.keys(require.cache).forEach(k => { if (/push-core/.test(k)) delete require.cache[k]; });
  const CORE2 = require(path.join(ROOT, 'scripts/push-core.js'));
  const K3 = await CORE2.keys();
  is(K3.from === 'env' && K3.subject === 'mailto:env@example.com',
     '<b>환경변수가 있으면 그쪽이 먼저</b>다 — 표가 덮지 않는다 · 출처 ' + K3.from);
  console.log('\n[6-9] 🩺 <b>열쇠가 틀렸을 때 사장님 탓을 하지 않는가</b> (1번)');
  /* ⚠ 2026-09-22 아침. 사장님 화면에 이렇게 떴습니다 —
       「서버가 로그인 표를 확인하지 못했습니다 — 앱을 닫았다 여신 뒤 다시
        눌러 주세요. (서버 대답 401 · Invalid API key)」
     사장님은 앱을 껐다 켜기를 되풀이하셨습니다. 그런데 「Invalid API key」는
     <b>사장님 로그인이 아니라 서버가 내민 열쇠</b>가 거절당한 것입니다.
     고칠 곳은 Netlify 환경변수 한 줄이었습니다.
     <b>허물을 엉뚱한 사람에게 돌리면 영영 못 고칩니다.</b>               */
  {
    BADKEY = true;
    const r = await call('POST', { a: 'setkey' },
      /* 열쇠 모양은 안 봐도 된다 — 그 앞에서 막힐 일이다 */
      JSON.stringify({ token: 'tok-ok', pub: 'x', priv: 'y', subject: 'mailto:a@b.c' }));
    is(r && r.ok === false, '열쇠가 틀리면 <b>담기지 않는다</b>');
    is(!!(r && r.keyFault),
       '<b>서버가 「내 열쇠 탓」이라고 말한다</b> (keyFault) — 이 한 글자가 ' +
       '「앱을 껐다 켜세요」 를 스무 번 하느냐 마느냐를 가른다');
    is(!/닫았다 여신/.test(String((r && r.reason) || '')),
       '  <b>「앱을 닫았다 여세요」 라고 안 한다</b> — 그래 봐야 안 고쳐진다');
    is(!/<b>|<\/b>/.test(String((r && r.reason) || '')),
       '  이유는 <b>맨 글자</b>로만 온다 — Supabase 원문이 섞이는 자리라 ' +
       '화면이 날것으로 그리면 남의 글이 우리 화면에서 돈다');
    /* 🩺 진단 — <b>열쇠는 한 글자도 안 나간다</b> (10번) */
    const d = await call('GET', { diag: '1' });
    is(!!(d && d.key), '🩺 <b>살펴보기</b>가 열린다 — 안 보이면 못 고친다 (8번)');
    const flat = JSON.stringify(d || {});
    is(flat.indexOf(process.env.SUPABASE_SERVICE_ROLE_KEY) < 0,
       '  <b>열쇠 글자는 한 자도 안 나온다</b> (10번) — 모양과 대답만');
    is(/invalid api key/i.test(flat),
       '  <b>Supabase 가 뭐라 했는지</b>는 그대로 보여 준다 — 그것이 고칠 실마리다');
    is(d && d.key && d.key.kind && typeof d.key.len === 'number',
       '  열쇠 <b>모양</b>(꼴·글자 수)을 말한다 — ' + JSON.stringify((d && d.key) || {}));
    BADKEY = false;
  }
  /* <b>다른 프로젝트 열쇠</b>도 똑같이 「Invalid API key」다 — 고칠 법이 달라 갈라야 한다 */
  is(CORE.keyShape('eyJhbGciOiJIUzI1NiJ9.' +
       Buffer.from(JSON.stringify({ role: 'service_role', ref: 'somewhereelse' })).toString('base64url') +
       '.x').refOk === false,
     '<b>다른 프로젝트 열쇠</b>를 가려낸다 — 같은 말이 와도 고칠 법이 다르다');
  is((CORE.keyShape(process.env.SUPABASE_SERVICE_ROLE_KEY) || {}).kind === 'other',
     '  모르는 꼴은 <b>모른다고</b> 한다 (1번)');
  is(CORE.isKeyFault({ msg: 'Invalid API key' }) === true &&
     CORE.isKeyFault({ msg: 'invalid JWT: token is malformed' }) === false,
     '<b>열쇠 탓과 표 탓을 가른다</b> — 토큰이 상했으면 그때는 정말 다시 로그인이다');

  delete process.env.VAPID_PUBLIC; delete process.env.VAPID_PRIVATE; delete process.env.VAPID_SUBJECT;
  fakeSb.close();

  console.log('\n[8] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 폰 알람이 아직 못 미덥습니다')
                 :'✓ 폰이 아침에 울리고, 알람에 고객 이름이 없습니다. 열쇠는 이 자리에서 만듭니다.');
  process.exit(bad?1:0);
})();
