/* <b>대표가 팀 전체의 오늘을 홈 한 장으로.</b>

   사장님 말씀 — 「보험회사 200명 300명이 되었을 때 모두를 관리할 수 있는
   포지션이 필요해」.

   지금까지 홈은 <b>내 것</b>만 말했습니다. 팀 전체는 TFA 를 열고 「팀 전체」로
   바꾸고 「오늘 손댈 사람」 을 골라야 보였습니다 — 세 번 눌러야 나오는 것은
   아침에 안 봅니다. 그래서 홈에 한 장으로 세웁니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] <b>리더에게만</b> 뜬다 — 설계사 화면에는 남의 이름이 없다 (3번)
     [2] <b>사람별로 묶인다</b> — 새로 안 센다 (5번)
     [3] <b>아직 못 읽었으면 0 이라고 말하지 않는다</b> (1번)
     [4] <b>서버를 더 안 부른다</b> — 이미 읽어 둔 것을 쓴다 (7번)
     [5] 눌러서 <b>그 사람 것</b>으로 펼쳐진다
     [6] 이름을 <b>씻는다</b> (3번) · 많은 분부터 · 여섯 명 넘으면 접는다      */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8901;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname);let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* <b>시간을 세지 않고 결과를 기다린다.</b> 홈은 hmArm() 이 1.2초 뒤에 칠하고,
   그 전에 cmLoadAll 이 서버를 부릅니다. CI 에는 네트워크가 있어 그 부름이
   실제로 나가므로, 「700밀리초 기다렸으니 그려졌겠지」 는 <b>CI 에서만
   빨간불</b>이 납니다 — 헛알람입니다 (8번). 그려질 때까지 봅니다.       */
const WAIT=`
  window.__wait=function(fn,ms){
    ms=ms||6000;
    return new Promise(function(done){
      var t0=Date.now();
      (function tick(){
        var v; try{ v=fn(); }catch(e){ v=null; }
        if(v||Date.now()-t0>ms)return done(v||null);
        setTimeout(tick,60);
      })();
    });
  };
  /* <b>앱이 칠할 때까지</b> 기다린다. 「옆 칸이 찼으니 됐겠지」 로는 못 잰다 —
     #hmCliHost 같은 칸은 renderHome() 이 <b>그 자리에서</b> 채우므로 기다림이
     0초가 되고, 그러면 「안 뜬다」 쪽 판정이 <b>헛되게 통과</b>한다.
     아직 안 그려진 것을 「안 뜬다」 로 읽는 점검은 알람이 아니다 (8번).
     그래서 hmPaint 를 한 겹 싸서 <b>실제로 칠해진 것</b>을 센다.        */
  window.__painted=0;
  (function(){var real=window.hmPaint;
    window.hmPaint=function(){var r=real.apply(this,arguments);window.__painted++;return r;};})();
  window.__home=function(){
    var n=window.__painted;
    go('home');
    return window.__wait(function(){ return (window.__painted>n)?true:null; },8000)
      .then(function(){
        /* <b>설 자리면 설 때까지</b> 기다린다 — 칠하기가 한 번 더 남아 있을
           수 있습니다. 안 설 자리(설계사)는 이미 한 번 칠해진 뒤라 「없다」
           가 참입니다. 이렇게 해야 타이밍에 기대지 않습니다 (8번). */
        if(typeof arIsLead==='function'&&arIsLead())
          return window.__wait(function(){
            return document.querySelector('#dynPane .hm-team'); },8000);
      });
  };`;

/* 견본 — 설계사 여덟 명에게 열두 건. <b>날짜는 앱에게 물어</b> 만든다(KST). */
const SEED=(role)=>WAIT+`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'${role}',active:true,plan:'vip'};
  /* <b>늦게 온 서버 대답이 내 정보를 지우지 못하게</b> 한다.
     CI 에는 네트워크가 있어 osLoadProfile 의 진짜 요청이 나갑니다. 로그인
     안 된 판이라 빈 손으로 돌아오고, osProfileApply 가 OS.profile=null 로
     지웁니다 — 그러면 홈이 아예 안 서서 <b>CI 에서만</b> 빨간불이 납니다.
     여기서 재려는 것은 로그인이 아니라 <b>팀 카드</b>입니다 (8번). */
  window.osLoadProfile=function(){};
  window.osProfileApply=function(){};
  window.osShowLoginGate=function(){};
  (function(){
    var mk=function(id,nm,team){
      var r={id:id,name:nm,role:'member',team:team,total:10,last:'',lastAtt:'',days:3,any:true,
             raw:{att:0,run:0,call:0,cli:0,rep:0,stu:0},sc:{}};
      (typeof GB_AX!=='undefined'?GB_AX:[]).forEach(function(a){r.sc[a.k]=0;});
      return r;};
    GB.rows=[mk('me','홍길동','t1'),mk('u2','홍길순','t1'),mk('u3','홍말순','t1'),
             mk('u4','홍갑돌','t2'),mk('u5','홍을돌','t2'),mk('u6','홍병돌','t2'),
             mk('u7','홍정돌','t3'),mk('u8','<img src=x onerror=1>홍무돌','t3')];
    GB.teams=[{id:'t1',name:'1팀'},{id:'t2',name:'2팀'},{id:'t3',name:'3팀'}];
    GB.teamOf={me:'t1',u2:'t1',u3:'t1',u4:'t2',u5:'t2',u6:'t2',u7:'t3',u8:'t3'};
    GB.team=''; GB.loaded=true; GB.busy=false;
  })();
  AR.rep={}; AR.crm={}; AR.cli={}; AR.f='all'; AR.q='';
  AR.loaded=true; AR.busy=false; AR.cliRows=[]; AR.open=''; AR.cat=''; AR.tkAll=false;
  (function(){
    var T=arToday(), mk=function(id,who,st,d){
      return {id:id,who:who,name:'홍길동',region:'광주',src:'일반',stage:st,
              appt:'',days:d,n:1,cAt:'',pAt:''}; };
    AR.db=[mk('a1','me','PC',3),   mk('a2','me','부재',9),  mk('a3','me','미접촉',5),
           mk('a4','u2','AP',1),   mk('a5','u2','거절',20),
           mk('a6','u3','계약완료',2),
           mk('a7','u4','TA',4),   mk('a8','u5','PC',2),    mk('a9','u6','부재',7),
           mk('b1','u7','AP',1),   mk('b2','u8','거절',30),
           mk('b3','','PC',2)];     /* 담당자를 모르는 줄 — 사람에 안 붙는다 */
  })();
  window.toast=function(){};`;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch(); const page=await b.newPage({viewport:{width:430,height:900}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  /* 서버를 몇 번 부르는지 <b>실제로</b> 센다 */
  await page.addInitScript(()=>{
    window.__net=[];
    const f=window.fetch;
    window.fetch=function(u,o){ window.__net.push(String(u).slice(0,90)); return f.apply(this,arguments); };
  });
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');

  console.log('\n[1] 리더에게만 뜬다 (3번)');
  const R=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    const c=document.querySelector('#dynPane .hm-team');
    /* 못 섰으면 <b>무엇 때문인지</b> 같이 돌려준다 — 「안 선다」 만 적으면
       다음 사람이 또 처음부터 찾습니다 */
    return { shown:!!c, txt:c?c.textContent.replace(/\s+/g,' ').trim():'',
             rows:document.querySelectorAll('#dynPane .hm-team .hm-tm-r').length,
             why:c?'':('프로필 '+(OS.profile?'있음':'없음')+
                       ' · 리더 '+((typeof arIsLead==='function'&&arIsLead())?'예':'아니오')+
                       ' · 자리 '+(document.getElementById('hmTeamHost')?'있음':'없음')+
                       ' · 읽음 '+(AR.loaded?'예':'아니오')+
                       ' · 화면 '+(window.TAB||'?')) };
  },SEED('owner'));
  is(R.shown, '대표 화면에 <b>「오늘 팀 전체」</b> 가 선다'+(R.why?(' ← '+R.why):''));
  const M=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    /* 설계사에게는 <b>안 떠야</b> 하므로 「뜨기를」 기다릴 수 없습니다.
       대신 앱이 <b>실제로 칠한 뒤에</b> 봅니다 — 그래야 「아직 안 그려졌을
       뿐」 과 「안 뜬다」 를 가릅니다. */
    await window.__home();
    const c=document.querySelector('#dynPane .hm-team');
    const body=document.getElementById('dynPane').textContent;
    return { shown:!!c, leaked:/홍길순|홍말순|홍갑돌/.test(body) };
  },SEED('member'));
  is(!M.shown, '설계사 화면에는 <b>안 뜬다</b> — 남의 담당 고객 수를 볼 자리가 아니다');
  is(!M.leaked, '설계사 홈에 <b>다른 설계사 이름이 없다</b> (3번)');

  console.log('\n[2] 사람별로 묶인다 — 새로 안 센다 (5번)');
  const G=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    const rows=hmTeamRows(), all=arTouch('');
    let sum=0; rows.forEach(r=>sum+=r.n);
    const c=document.querySelector('#dynPane .hm-team');
    const txt=c?c.textContent.replace(/\s+/g,' ').trim():'';
    /* 화면에 적힌 합계·사람 수를 <b>글에서 그대로</b> 읽는다 */
    const mTot=txt.match(/(\d+)건/), mWho=txt.match(/설계사 (\d+)명/);
    const first=rows[0]||{};
    return { nRows:rows.length, sum, all:all.length,
      withWho:all.filter(x=>x.who).length,
      tot:mTot?+mTot[1]:-1, who:mWho?+mWho[1]:-1,
      order:rows.map(r=>r.n), firstWho:first.who, firstN:first.n,
      chipsFirst:[].slice.call(document.querySelectorAll('#dynPane .hm-team .hm-tm-r')[0]
        .querySelectorAll('.hm-tm-c')).map(e=>e.textContent.trim()),
      domRows:document.querySelectorAll('#dynPane .hm-team .hm-tm-r').length,
      more:(document.querySelector('#dynPane .hm-team .hm-tm-more')||{}).textContent||'' };
  },SEED('owner'));
  is(G.sum===G.withWho, '카드 합계가 <b>TFA 가 고른 것과 같다</b> — '+G.sum+' / '+G.withWho+
     ' (담당자를 모르는 '+(G.all-G.withWho)+'건은 사람에 안 붙는다)');
  is(G.tot===G.sum&&G.who===G.nRows,
     '화면에 적힌 수가 <b>계산과 같다</b> — '+G.tot+'건 · 설계사 '+G.who+'명');
  is(G.nRows===8, '<b>담당자별로</b> 묶인다 — '+G.nRows+'명');
  is(G.order.join(',')===G.order.slice().sort((a,b)=>b-a).join(','),
     '<b>많은 분부터</b> 선다 — '+G.order.join(','));
  is(G.firstWho==='me'&&G.firstN===3, '제일 많은 분이 <b>맨 위</b> — 3건');
  is(G.chipsFirst.join(' ')==='PC 1 부재 1 미접촉 1',
     '상태 칩이 <b>TDO 차례대로</b> 붙는다 — '+G.chipsFirst.join(' · '));
  is(G.domRows===6&&/2명 더 보기/.test(G.more),
     '여섯 명까지 세우고 <b>나머지는 접는다</b> — '+G.domRows+'명 + 「'+G.more.trim()+'」');

  console.log('\n[3] 아직 못 읽었으면 0 이라고 말하지 않는다 (1번)');
  const L=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    /* <b>아직 읽는 중인 그 순간</b>을 그대로 만든다. arLoad 를 잠시 세워 두지
       않으면 재는 사이에 스스로 끝나 버려, 이 알람은 영영 안 울린다 (8번). */
    const real=window.arLoad; window.arLoad=function(){};
    AR.loaded=false; AR.busy='load'; AR.db=null;
    hmPaint(); await new Promise(r=>setTimeout(r,300));
    const c=document.querySelector('#dynPane .hm-team');
    const t1=c?c.textContent.replace(/\s+/g,' ').trim():'';
    AR.loaded=true; AR.busy=''; AR.db=[];
    hmPaint(); await new Promise(r=>setTimeout(r,300));
    const c2=document.querySelector('#dynPane .hm-team');
    const t2=c2?c2.textContent.replace(/\s+/g,' ').trim():'';
    window.arLoad=real;
    return { load:t1, empty:t2 };
  },SEED('owner'));
  is(/읽는 중/.test(L.load)&&!/0건|0명/.test(L.load),
     '못 읽었을 때는 <b>「읽는 중」</b> — 「0건」 이라고 안 적는다 — 「'+L.load.slice(0,44)+'…」');
  is(/없습니다/.test(L.empty)&&/배정/.test(L.empty),
     '진짜 없을 때는 <b>왜 비었는지</b> 말한다 — 「'+L.empty.slice(0,52)+'…」');

  console.log('\n[4] 서버를 더 안 부른다 (7번)');
  /* <b>시간 창으로 세지 않습니다.</b> 홈에는 이 카드 말고도 서버를 부르는
     것이 있어(출근 기록·AI 보고), CI 처럼 네트워크가 있는 자리에서는 남의
     부름이 창 안에 들어와 <b>헛알람</b>이 납니다 (8번). 카드 그리는 줄을
     <b>그 자리에서</b> 부르고 바로 셉니다 — 그 사이에 낀 것은 이 카드가
     부른 것뿐입니다. */
  const N=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    window.__net.length=0;
    hmTeamRows(); hmTeamHtml(); hmTeamCss();
    const t=document.getElementById('hmTeamHost');
    if(t)t.innerHTML=hmTeamHtml();
    return { n:window.__net.length, urls:window.__net.slice(0,3) };
  },SEED('owner'));
  is(N.n===0, '카드를 그려도 <b>서버를 한 번도 안 부른다</b> — '+N.n+'번'+
     (N.n?(' ← '+N.urls.join(' / ')):'')+' (이미 읽어 둔 것을 쓴다)');
  const fn=SRC.slice(SRC.indexOf('function hmTeamRows(){'), SRC.indexOf('function hmTeamOpen(who){'));
  is(!/fetch\(|arLoad\(|\.from\(/.test(fn), '팀 카드 코드 안에 <b>서버를 부르는 줄이 없다</b>');

  console.log('\n[5] 눌러서 그 사람 것으로 펼쳐진다');
  const O=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    let went=''; const g=window.go; window.go=function(t){went=t;};
    document.querySelectorAll('#dynPane .hm-team .hm-tm-r')[1].click();
    const one={went,cat:AR.cat,all:AR.tkAll,open:AR.open};
    AR.open='zz';
    document.querySelector('#dynPane .hm-team .hm-tm-go').click();
    const all={went,cat:AR.cat,all:AR.tkAll,open:AR.open};
    window.go=g;
    return {one,all};
  },SEED('owner'));
  is(O.one.went==='airep'&&O.one.cat==='touch'&&O.one.all===true,
     '눌렀더니 <b>TFA 「오늘 손댈 사람」 · 팀 전체</b>로 간다 — '+O.one.went+'/'+O.one.cat);
  is(!!O.one.open&&O.one.open!=='me', '<b>그 사람이 펼쳐진 채</b>로 열린다 — '+O.one.open);
  is(O.all.open==='', '「전부 →」 는 <b>아무도 안 펼치고</b> 전체로 연다');

  console.log('\n[5-1] <b>그룹 · 사람을 골라</b> 그것만 본다');
  /* 사장님 말씀 — 「팀 전체만 보이는데, 내가 그룹 / 또는 누군가를 선택하면
     그 사람만 볼수 있도록 만들어」. */
  const P=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    const box=()=>document.querySelector('#dynPane .hm-team');
    const chips=()=>[].slice.call(box().querySelectorAll('.hm-tm-p')).map(e=>e.textContent.trim());
    const names=()=>[].slice.call(box().querySelectorAll('.hm-tm-r .nm')).map(e=>e.textContent.trim());
    const out={chips:chips(),allNames:names(),sel:!!box().querySelector('.hm-tm-sel')};
    /* 2팀만 */
    hmTmSet('t:t2');
    out.teamNames=names(); out.teamTitle=(box().querySelector('.hm-tm-h b')||{}).textContent||'';
    /* 한 사람만 */
    hmTmSet('p:u2');
    out.oneNames=names(); out.oneTitle=(box().querySelector('.hm-tm-h b')||{}).textContent||'';
    out.oneGo=(box().querySelector('.hm-tm-go')||{}).textContent||'';
    /* 전체로 되돌리기 */
    hmTmSet('');
    out.backNames=names();
    /* 고른 쪽에 아무도 없으면 <b>왜 비었는지</b> 말한다 */
    hmTmSet('t:zz');
    out.emptyTxt=(box().querySelector('.hm-tm-none')||{}).textContent||'';
    hmTmSet('');
    return out;
  },SEED('owner'));
  is(P.chips[0]==='전체'&&P.chips.length>=4,
     '<b>전체 · 팀</b> 단추가 선다 — '+P.chips.join(' · '));
  is(P.sel, '<b>설계사 고르기</b> 칸이 있다 — 사람이 많아지면 단추로는 안 된다');
  is(P.teamNames.length>0&&P.teamNames.every(n=>['홍갑돌','홍을돌','홍병돌'].indexOf(n)>=0),
     '팀을 고르면 <b>그 팀 사람만</b> 남는다 — '+P.teamNames.join(' · '));
  is(/2팀/.test(P.teamTitle), '제목도 <b>고른 팀</b>으로 바뀐다 — '+P.teamTitle);
  is(P.oneNames.length===1&&P.oneNames[0]==='홍길순',
     '사람을 고르면 <b>그 한 분만</b> 남는다 — '+P.oneNames.join(' · '));
  is(/홍길순/.test(P.oneTitle)&&/이분 것/.test(P.oneGo),
     '그 분 이름으로 제목이 서고 <b>TFA 도 그 분 것</b>으로 연다 — '+P.oneTitle);
  is(P.backNames.length===P.allNames.length&&P.allNames.length>1,
     '<b>전체로 되돌아온다</b> — '+P.backNames.length+'명 (못 돌아오면 갇힌다)');
  is(/전체/.test(P.emptyTxt),
     '고른 쪽이 비면 <b>왜 비었는지</b> 말한다 — 「'+P.emptyTxt.replace(/\s+/g,' ').slice(0,36)+'…」');

  console.log('\n[5-2] <b>권한대로</b>만 보인다 — 화면이 서버보다 넓으면 안 된다');
  /* 서버(RLS)는 dbs_select 에서 「관리자거나, 내 것이거나, 내 팀 사람 것」
     으로 막는다. 화면이 더 넓게 보여 주면 남의 팀 이름이 뜨는데 눌러도
     빈 칸만 나온다 — 그것이 지금까지의 모습이었다. */
  const LD=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    const box=document.querySelector('#dynPane .hm-team');
    const names=box?[].slice.call(box.querySelectorAll('.hm-tm-r .nm')).map(e=>e.textContent.trim()):[];
    return {see:hmTmSee(),names,ids:hmTmScopeIds()};
  },SEED('leader'));
  is(LD.see==='team', '지점장은 <b>자기 팀</b>까지다 — '+LD.see);
  is(LD.names.length>0&&LD.names.every(n=>['홍길동','홍길순','홍말순'].indexOf(n)>=0),
     '지점장 화면에 <b>남의 팀 사람이 없다</b> — '+LD.names.join(' · '));
  is(LD.ids.indexOf('u4')<0&&LD.ids.indexOf('u7')<0,
     '볼 수 있는 사람에 <b>2·3팀이 안 들어 있다</b> — '+LD.ids.length+'명');

  const ME=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    await window.__home();
    return {see:hmTmSee(),ids:hmTmScopeIds()};
  },SEED('member'));
  is(ME.see==='me'&&ME.ids.length===1&&ME.ids[0]==='me',
     '설계사는 <b>본인만</b>이다 — '+ME.ids.join(' · '));

  const OW=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    return {see:hmTmSee(),n:hmTmScopeIds().length};
  },SEED('owner'));
  is(OW.see==='all'&&OW.n>=8, '대표는 <b>전체</b>를 본다 — '+OW.n+'명');

  console.log('\n[6] 이름을 씻는다 (3번)');
  const E=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    /* 꺾쇠가 섞인 이름을 <b>맨 위로</b> 올려 잘리지 않게 한다 */
    AR.db=[{id:'z1',who:'u8',name:'홍길동',region:'',src:'',stage:'PC',appt:'',days:2,n:1,cAt:'',pAt:''},
           {id:'z2',who:'u8',name:'홍길동',region:'',src:'',stage:'부재',appt:'',days:9,n:1,cAt:'',pAt:''}];
    await window.__home();
    const c=document.querySelector('#dynPane .hm-team');
    return { html:c?c.innerHTML:'', txt:c?c.textContent:'' };
  },SEED('owner'));
  is(/홍무돌/.test(E.txt), '팀원 이름이 <b>그대로 보인다</b>');
  is(!/<img/i.test(E.html), '이름에 섞인 <b>꺾쇠를 씻는다</b> (3번)');

  console.log('\n[7] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 대표가 팀의 오늘을 한 장으로 못 봅니다')
                 :'✓ 대표는 홈에서 팀 전체의 오늘을 한 장으로 봅니다.');
  process.exit(bad?1:0);
})();
