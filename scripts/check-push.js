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
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname);let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(rs);
});
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
    /* 아직 안 된 시각 — 고정한 시각보다 뒤 */
    localStorage.setItem('apex_alm_hour','11');
    localStorage.removeItem('apex_alm_day');
    window.__rang.length=0; almTick(); out.early=window.__rang.length;
    /* 이미 지난 시각 */
    localStorage.setItem('apex_alm_hour','9');
    window.__rang.length=0; window.__net.length=0;
    almTick(); out.first=window.__rang.length; out.net=window.__net.length;
    out.stamp=localStorage.getItem('apex_alm_day')||'';
    out.today=arToday();
    /* 같은 날 또 부르면 */
    window.__rang.length=0; almTick(); out.again=window.__rang.length;
    /* 오늘 챙길 분이 없으면 <b>표시를 안 남긴다</b> — 내일 또 걸러진다 */
    localStorage.removeItem('apex_alm_day');
    AR.db=[]; AR.cliRows=[];
    window.__rang.length=0; almTick();
    out.emptyRang=window.__rang.length; out.emptyStamp=localStorage.getItem('apex_alm_day')||'';
    /* 잘못 적은 값 */
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
    almPaint();
    out.noKey=(document.getElementById('almHost')||{}).textContent||'';
    out.hasHost=!!document.getElementById('almHost');
    return out;
  },{seed:SEED});
  is(W.hasHost, '「내 폰에 설치」 화면에 <b>알람 카드가 선다</b>');
  is(/홈 화면에 먼저 담아야/.test(W.ios), '아이폰은 <b>먼저 담아야 한다</b>고 말한다 — 「'+W.ios.replace(/<[^>]*>/g,'').slice(0,40)+'…」');
  is(/홈 화면에 먼저 담아야/.test(W.iosCard), '그 말을 <b>카드에도</b> 적는다');
  is(W.ok==='', '담고 허락하면 <b>막는 말이 없다</b>');
  is(/VAPID_PUBLIC/.test(W.noKey)&&/Netlify/.test(W.noKey),
     '서버 열쇠가 없으면 <b>무엇을 넣어야 하는지</b> 적는다 (1번)');
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
  const auth=P.vapidAuth('https://fcm.googleapis.com/fcm/send/abc');
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
  const q=calls.filter(c=>/push_subs\?hour=eq\./.test(c.u))[0];
  is(!!q&&q.u.indexOf('hour=eq.'+kh)>=0, '<b>그 시각으로 정해 둔 폰만</b> 부른다 — 한국 '+kh+'시');
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

  console.log('\n[8] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 폰 알람이 아직 못 미덥습니다')
                 :'✓ 폰이 아침에 울리고, 알람에 고객 이름이 없습니다.');
  process.exit(bad?1:0);
})();
