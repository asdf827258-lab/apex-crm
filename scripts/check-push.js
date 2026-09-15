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
  AR.loaded=true; AR.busy=false; AR.cliRows=[];
  AR.db=[
   {id:'d2',who:'me',name:'홍길순',region:'광주',src:'일반',stage:'PC',appt:'',days:10,n:3,cAt:'',pAt:''},
   {id:'d3',who:'me',name:'홍말순',region:'광주',src:'일반',stage:'부재',appt:'',days:9,n:1,cAt:'',pAt:''},
   {id:'d5',who:'me',name:'홍을돌',region:'광주',src:'일반',stage:'미접촉',appt:'',days:5,n:0,cAt:'',pAt:''}];
  try{ localStorage.removeItem('apex_alm_day'); localStorage.removeItem('apex_alm_hour'); }catch(e){}
  window.toast=function(){};`;

/* ── 서버 함수를 <b>환경변수를 바꿔 가며</b> 불러 온다 ── */
function loadPush(env){
  const p=path.join(ROOT,'netlify/functions/push.js');
  const keep={};
  Object.keys(env).forEach(k=>{keep[k]=process.env[k];
    if(env[k]===null)delete process.env[k]; else process.env[k]=env[k];});
  delete require.cache[require.resolve(p)];
  const m=require(p);
  const src=fs.readFileSync(p,'utf8');
  const box={exports:{}};
  new Function('require','module','exports',src+'\nmodule.exports.__t={seal,vapidAuth};')(require,box,box.exports);
  Object.keys(keep).forEach(k=>{if(keep[k]===undefined)delete process.env[k];else process.env[k]=keep[k];});
  return {handler:m.handler, seal:box.exports.__t.seal, vapidAuth:box.exports.__t.vapidAuth};
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
    const kst=()=>new Date(Date.now()+9*3600000).getUTCHours();
    /* 아직 안 된 시각 — 지금보다 뒤로 정해 둔다 */
    localStorage.setItem('apex_alm_hour',String(Math.min(23,kst()+1)));
    localStorage.removeItem('apex_alm_day');
    window.__rang.length=0; almTick(); out.early=window.__rang.length;
    /* 이미 지난 시각 */
    localStorage.setItem('apex_alm_hour','0');
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
    return out;
  },{seed:SEED,fake:FAKE});
  is(T.early===0, '정한 시각 <b>전에는 안 울린다</b>');
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
  const r2=JSON.parse((await noKey.handler({httpMethod:'GET',queryStringParameters:{}})).body);
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
        ? [{endpoint:'https://push.example.com/dead',p256dh:bu(uaPub),auth:bu(uaAuth),hour:0,fail:0},
           {endpoint:'https://push.example.com/live',p256dh:bu(uaPub),auth:bu(uaAuth),hour:0,fail:0}] : [];
      return {ok:true,status:200,text:async()=>JSON.stringify(rows)};
    }
    if(String(u).indexOf('/dead')>=0)return {ok:false,status:410,text:async()=>'gone'};
    if(String(u).indexOf('/live')>=0&&o&&o.body)sentBody=o.body;
    return {ok:true,status:201,text:async()=>''};
  };
  const sched=loadPush(ENV);
  const kh=new Date(Date.now()+9*3600000).getUTCHours();
  const r4=JSON.parse((await sched.handler({httpMethod:'GET',queryStringParameters:{}})).body);
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
  is(/\[functions\."push"\]/.test(TOML)&&/schedule = "0 \* \* \* \*"/.test(TOML),
     '<b>매시 정각</b>에 돌게 적어 두었다 — 사람마다 받고 싶은 시각이 다르다');

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
