/* <b>고객 상태 한 벌 — 그리고 오늘 어떻게 연락할지.</b>

   사장님 말씀 — 「칸을 분류하지 말고 하나로 만들자. 그래야 전체 관리가
   쉬워질 거고, 어떻게 연락할지 방향성을 잡아 보자」.

   여태 같은 사람을 <b>세 가지 말</b>로 불렀습니다.
     stage (배정 DB)  미접촉·TA·AP·PC·CS·계약완료·증권전달
     result(통화 기록) 부재·거절·상담
     k     (오늘 할 일) new·no·rej·run·pol·won·bd·old
   게다가 부재는 TA 로, 거절은 미접촉으로 <b>뭉개져</b> 단계만 보면
   안 받는 사람과 통화된 사람이 같은 칸에 있었습니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 상태마다 <b>오늘 무엇을</b> 과 <b>어떻게 연락할지</b> 가 있다
     [2] 상태가 <b>한 벌</b>이다 — db-crm.html 과도 글자 하나 안 다르다
     [3] 언제 뜨는지가 <b>코드에 안 박혀</b> 있다 — 사장님이 고치면 그 값이 이긴다
     [4] 잘못 적은 값(빈칸·글자·음수)을 <b>0 으로 쓰지 않는다</b> (1번)
     [5] 홈에 <b>그 사람과 할 말</b>이 서고, 같은 사람이 두 번 안 선다
     [6] 눌러서 <b>맞는 화면</b>으로 가고, 이름·메모를 씻는다 (3번)
     [7] 기준을 고치면 목록이 <b>따라 바뀐다</b>                          */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8871;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname);let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch(); const page=await b.newPage({viewport:{width:430,height:900}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const CRM=fs.readFileSync(path.join(ROOT,'db-crm.html'),'utf8');

  console.log('\n[1] 상태마다 <b>오늘 무엇을</b> 과 <b>어떻게 연락할지</b>');
  const T=await page.evaluate(()=>{
    const K=tdoOrder();
    const say=(k,ex)=>arTodoOf(Object.assign({k:k,d:tdoWait(k),ap:'',plan:''},ex||{}));
    return { keys:K, ords:K.map(k=>TDO[k].ord),
      empty:K.filter(k=>!(say(k)||'').trim()),
      noWay:K.filter(k=>!TDO[k].ch||!TDO[k].aim||!TDO[k].way),
      hasDo:K.some(k=>TDO[k].do!==undefined),
      apAp:say('AP',{ap:'2026-09-20 14:00'}), apNo:say('AP'),
      pc:say('PC'), cs:say('CS'),
      polNew:say('계약완료',{d:1}), polOld:say('계약완료',{d:20}) };
  });
  is(T.keys.length>=10, '상태가 <b>'+T.keys.length+'가지</b> 있다');
  is(T.empty.length===0, '상태마다 <b>오늘 무엇을</b> 이 나온다'+(T.empty.length?(' ← '+T.empty.join(',')):''));
  is(T.noWay.length===0, '상태마다 <b>무엇으로 · 오늘의 목표 · 어디서 시작하나</b> 가 있다'+
     (T.noWay.length?(' ← '+T.noWay.join(',')):''));
  is(!T.hasDo, '표에는 <b>할 말을 안 적어 둔다</b> — 말하는 곳은 arTodoOf 하나다 (5번)');
  is(new Set(T.ords).size===T.ords.length, '차례가 <b>안 겹친다</b> — '+T.ords.join(','));
  is(T.apAp!==T.apNo, 'AP 는 <b>약속이 있을 때와 없을 때</b>를 갈라 말한다');
  is(T.pc!==T.apNo && T.cs!==T.pc, '<b>PC · CS</b> 가 각각 다르게 말한다 — 「'+T.pc.slice(0,24)+'…」');
  is(T.polNew!==T.polOld, '계약완료는 <b>며칠 됐는지</b>로 다르게 말한다 — 「'+T.polOld.slice(0,24)+'…」');

  console.log('\n[2] 상태가 <b>한 벌</b>이다 (5번)');
  const two=await page.evaluate(()=>{
    const K=tdoOrder();
    return { lab:K.every(k=>AR_TKL[k]===TDO[k].t), col:K.every(k=>AR_TKC[k]===TDO[k].c),
      ord:JSON.stringify(bcrOrd())===JSON.stringify(K),
      stages:AR_STAGES.slice(), dbKeys:K.filter(k=>TDO[k].src==='db'),
      no:arStageOf({},'부재'), rej:arStageOf({},'거절'),
      ap:arStageOf({},'상담'), none:arStageOf({},''), byHand:arStageOf({stage:'PC'},'부재') };
  });
  is(two.lab&&two.col&&two.ord, '이름표·색·차례가 <b>표 하나</b>에서 나온다');
  is(!/var BCR_ORD=\[/.test(SRC), '옛 차례표가 <b>안 남아 있다</b> (5번)');
  is(two.dbKeys.every(k=>two.stages.indexOf(k)>=0),
     '오늘 할 일의 상태가 <b>단계 목록과 같은 말</b>이다 — '+two.dbKeys.join(' · '));
  is(two.no==='부재', '부재를 <b>부재로</b> 둔다 — '+two.no+
     ' (예전에는 TA 로 뭉개 안 받는 사람과 통화된 사람이 한 칸에 있었다)');
  is(two.rej==='거절', '거절을 <b>거절로</b> 둔다 — '+two.rej+
     ' (예전에는 미접촉으로 뭉개 한 번도 안 건 사람과 섞였다)');
  is(two.ap==='AP'&&two.none==='미접촉', '상담은 <b>AP</b> · 아무것도 없으면 <b>미접촉</b>');
  is(two.byHand==='PC', '<b>손으로 정하신 단계가 이긴다</b> — '+two.byHand);
  /* db-crm.html 은 <b>따로 있는 파일</b>이다 — 거기와 갈리면 두 화면이 다른 말을 한다 */
  const crmStages=((CRM.match(/const STAGES=\[([^\]]*)\]/)||[])[1]||'').replace(/\s/g,'');
  is(crmStages===two.stages.map(x=>'"'+x+'"').join(','),
     'DB CRM 화면도 <b>글자 하나 안 다르다</b> — '+crmStages.slice(0,40)+'…');
  const crmFlat=CRM.replace(/\s/g,'');
  is(/r==="거절"\)return"거절"/.test(crmFlat)&&/r==="부재"\)return"부재"/.test(crmFlat),
     'DB CRM 도 부재·거절을 <b>뭉개지 않는다</b>');

  console.log('\n[3] 언제 뜨는지가 코드에 안 박혀 있다');
  const fn=SRC.slice(SRC.indexOf('function arTouch(who){'), SRC.indexOf('function arTouch(who){')+2400);
  is(!/days>=\d|days<=\d|bd<=\d|pd<=\d|d>=\d\d|d<=\d\d/.test(fn.replace(/\s/g,'')),
     '사람을 고르는 곳에 <b>맨 숫자가 없다</b> — 전부 tdoDue() 를 본다');
  const W=await page.evaluate(()=>{
    const real=window.osCfgGet,out={};
    out.def=tdoWait('부재'); out.won=tdoWait('증권전달'); out.old=tdoWait('기고객');
    out.daily=['AP','PC','CS','계약완료'].every(k=>TDO[k].rule==='daily');
    out.dueDaily=tdoDue('AP',9999);          /* 매일이면 며칠이 지나든 뜬다 */
    out.dueWithin=[tdoDue('증권전달',3),tdoDue('증권전달',40)];
    out.dueAfter=[tdoDue('부재',1),tdoDue('부재',5)];
    window.osCfgGet=(k,d)=>k==='tdo_wait_부재'?'21':real(k,d);
    out.mine=tdoWait('부재'); out.on=tdoOn('부재');
    window.osCfgGet=real; return out;
  });
  is(W.def===3,  '부재 <b>3일</b> — 사장님이 정하신 값');
  is(W.won===15, '증권전달 <b>15일</b>');
  is(W.old===30, '기고객 <b>30일</b>');
  is(W.daily,    'AP·PC·CS·계약완료는 <b>매일</b> 뜬다 — 붙잡고 있는 사람은 매일 봐야 한다');
  is(W.dueDaily, '매일짜리는 <b>며칠이 지나든</b> 뜬다');
  is(W.dueWithin[0]&&!W.dueWithin[1], '「N일 안에는 매일」 은 <b>지나면 내려간다</b> — 기회가 닫힌 뒤엔 안 뜬다');
  is(!W.dueAfter[0]&&W.dueAfter[1],   '「N일 지나면」 은 <b>그 전에는 안 뜬다</b> — 어제 건 사람을 오늘 또 걸지 않는다');
  is(W.mine===21, '사장님이 고치시면 <b>그 값이 이긴다</b> — '+W.mine+'일');
  is(W.on===true, '고치신 것을 <b>고쳤다고 표시</b>한다');

  console.log('\n[4] 잘못 적은 값을 0 으로 쓰지 않는다 (1번)');
  const Z=await page.evaluate(()=>{
    const real=window.osCfgGet,out={};
    ['','  ','abc','-3','3.7'].forEach((v,i)=>{
      window.osCfgGet=(k,d)=>k==='tdo_wait_부재'?v:real(k,d);
      out[i]=tdoWait('부재');
    });
    window.osCfgGet=real; return out;
  });
  is(Z[0]===3&&Z[1]===3, '비우면 <b>기본값</b>으로 — 0 이 아니다');
  is(Z[2]===3, '글자를 적으면 <b>기본값</b> — 0 으로 읽으면 모두가 오늘 걸 사람이 된다');
  is(Z[3]===3, '음수도 <b>기본값</b>');
  is(Z[4]===3, '소수는 <b>정수로</b> — '+Z[4]);

  /* ── 견본 ─────────────────────────────────────────────────────────
     <b>날짜는 앱에게 물어서</b> 만든다. 예전에는 UTC 로 오늘을 만들었는데,
     앱은 한국 시간으로 셉니다. 한국이 자정을 넘기는 시각(UTC 15시)부터
     하루가 어긋나 <b>밤에만 빨간불</b>이 났습니다 — 헛알람입니다 (8번). */
  const SEED=`
    OS.session={user:{id:'me'}};
    OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
    /* arLoad 를 <b>세워 둔다.</b> CI 에는 네트워크가 있어 진짜 요청이 나가고,
       늦게 돌아와 AR.db 를 빈 것으로 덮습니다 — <b>CI 에서만</b> 빨간불이 납니다 (8번). */
    window.arLoad = function () {};
    AR.loaded=true; AR.busy=false; AR.cliRows=[];
    (function(){
      var T=arToday(), ago=function(n){
        var d=new Date(T+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()-n);
        return d.toISOString().slice(0,10); };
      AR.db=[
       {id:'d1',who:'me',name:'홍길동',region:'광주',src:'일반',stage:'AP',
        appt:T+'T14:00',days:1,n:2,cAt:'',pAt:''},
       {id:'d2',who:'me',name:'홍길순',region:'광주',src:'일반',stage:'PC',
        appt:'',days:10,n:3,cAt:'',pAt:''},
       {id:'d3',who:'me',name:'홍말순',region:'광주',src:'일반',stage:'부재',
        appt:'',days:9,n:1,cAt:'',pAt:''},
       {id:'d4',who:'me',name:'홍갑돌',region:'광주',src:'일반',stage:'거절',
        appt:'',days:20,n:1,cAt:'',pAt:''},
       {id:'d5',who:'me',name:'홍을돌',region:'광주',src:'일반',stage:'미접촉',
        appt:'',days:5,n:0,cAt:'',pAt:''},
       {id:'d6',who:'me',name:'홍병돌',region:'광주',src:'일반',stage:'계약완료',
        appt:'',days:2,n:4,cAt:ago(2),pAt:''},
       {id:'d7',who:'me',name:'홍정돌',region:'광주',src:'일반',stage:'증권전달',
        appt:'',days:5,n:5,cAt:ago(20),pAt:ago(5)},
       {id:'d8',who:'남',name:'남의고객',region:'서울',src:'일반',stage:'부재',
        appt:'',days:30,n:1,cAt:'',pAt:''}];
    })();
    window.toast=function(){};`;

  console.log('\n[5] 홈에 그 사람과 할 말이 서고, 두 번 안 선다');
  const H=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    go('home'); await new Promise(r=>setTimeout(r,700));
    const L=hmSteps(), D=L.filter(x=>x.k==='db'), seen={}, dup=[];
    L.forEach(x=>{const n=x.t||''; if(seen[n])dup.push(n); seen[n]=1;});
    const now=document.querySelector('#dynPane .hm-now');
    return { n:D.length, kinds:D.map(x=>x.tk), dup,
      appt:L.filter(x=>x.k==='appt').length,
      allTodo:D.every(x=>(x.s||'').trim().length>5),
      allName:D.every(x=>(x.t||'').length>0),
      kt:(D[0]||{}).kt||'',
      cnt:(hmCount()||{}).db,
      nowTxt:now?now.textContent.replace(/\s+/g,' ').trim():'' };
  },SEED);
  is(H.n===6, '내 DB <b>여섯 명</b>이 상태별로 선다 — '+H.n+
     '명 (남의 것 한 명은 빠지고, 오늘 약속 한 명은 달력이 맡는다)');
  is(H.kinds.indexOf('부재')>=0&&H.kinds.indexOf('거절')>=0,
     '부재·거절이 <b>제 이름으로</b> 선다 — '+H.kinds.join(' · '));
  is(H.allName&&H.allTodo, '줄마다 <b>이름과 오늘 무엇을</b> 이 있다');
  is(H.dup.length===0, '<b>같은 사람이 두 번 안 선다</b>'+(H.dup.length?(' ← '+H.dup.join(',')):''));
  is(H.appt===1, '오늘 약속은 <b>달력 줄로</b> 선다 — '+H.appt+'건 (시간이 붙어 있다)');
  is(H.cnt===H.n, '홈 카드가 <b>목록과 같은 수</b>를 센다 — 카드 '+H.cnt+' · 목록 '+H.n+' (5번)');
  is(/·/.test(H.kt), '이름표에 <b>어떻게 연락할지</b> 가 붙는다 — 「'+H.kt.slice(0,34)+'…」');

  console.log('\n[6] 눌러서 여는 곳 · 이름과 메모 씻기 (3번)');
  const O=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    go('home'); await new Promise(r=>setTimeout(r,500));
    const D=hmSteps().filter(x=>x.k==='db');
    let went='',cli=''; const g=window.go, gc=window.navGoCli;
    window.go=function(t){went=t;}; window.navGoCli=function(id){cli=id;};
    hmOpen(D[0].key);
    window.go=g; window.navGoCli=gc;
    /* 이름에 꺾쇠가 섞여 들어와도 그대로 그리면 안 된다 */
    AR.db=[{id:'x1',who:'me',name:'<img src=x onerror=1>홍길동',region:'',src:'',
            stage:'부재',appt:'',days:9,n:1,cAt:'',pAt:''}];
    hmPaint(); await new Promise(r=>setTimeout(r,250));
    const n1=document.querySelector('#dynPane .hm-now');
    const html=n1?n1.innerHTML:'';
    /* 사장님이 적으신 메모가 글에 섞이는 자리 — 고객 365일의 「다음 할 일」 */
    AR.db=[];
    AR.cliRows=[{id:'c1',who:'me',name:'홍길동',plan:'<img src=x onerror=1>전화드리기',
                 days:200,bd:'',ever:true,at:'',man:null,due:''}];
    hmPaint(); await new Promise(r=>setTimeout(r,250));
    const n2=document.querySelector('#dynPane .hm-now');
    let w2='',c2=''; const g2=window.go, gc2=window.navGoCli;
    window.go=function(t){w2=t;}; window.navGoCli=function(id){c2=id;w2='clients';};
    hmOpen(hmSteps()[0].key);
    window.go=g2; window.navGoCli=gc2;
    return { went, cli, html, memo:n2?n2.innerHTML:'', memoGo:w2, memoId:c2 };
  },SEED);
  is(O.went==='crm'&&O.cli==='', '배정 DB 사람은 <b>CRM 으로</b> — '+(O.went||'아무 데도')+
     ' (배정 DB 의 id 로 고객 카드를 열면 안 열린다)');
  is(!/<img/i.test(O.html), '고객 이름에 섞인 <b>꺾쇠를 씻는다</b> (3번)');
  is(!/<img/i.test(O.memo), '<b>적어 두신 메모</b>도 씻는다 — 「적어 둔 일부터 — ○○」 에 메모가 섞여 들어간다');
  is(O.memoGo==='clients'&&O.memoId==='c1',
     '<b>기고객·생일</b>은 <b>그분 카드</b>로 간다 — '+(O.memoGo||'?')+'/'+(O.memoId||'?'));

  console.log('\n[7] 기준을 고치면 목록이 따라 바뀐다');
  const C=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    const real=window.osCfgGet;
    const a=arTouch('me').filter(x=>x.k==='부재').length;
    window.osCfgGet=(k,d)=>k==='tdo_wait_부재'?'30':real(k,d);
    const b=arTouch('me').filter(x=>x.k==='부재').length;
    window.osCfgGet=(k,d)=>k==='tdo_wait_증권전달'?'3':real(k,d);
    const c=arTouch('me').filter(x=>x.k==='증권전달').length;
    window.osCfgGet=real;
    return {a,b,c};
  },SEED);
  is(C.a===1, '부재 3일이면 9일 된 분이 <b>올라온다</b> — '+C.a+'명');
  is(C.b===0, '30일로 고치시면 <b>안 올라온다</b> — '+C.b+'명 (기준이 진짜로 쓰인다)');
  is(C.c===0, '증권전달을 3일로 줄이시면 5일 된 분이 <b>내려간다</b> — '+C.c+'명');

  console.log('\n[8] 상태마다 <b>손에 쥘 것</b> — 그 자리에서 열린다');
  const G=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    const K=tdoOrder(),out={};
    /* 표에 적어 둔 id 와, 그중 <b>실제로 메뉴에 있어 열리는</b> 것 */
    out.listed={}; out.live={}; out.dead=[];
    K.forEach(k=>{
      const ids=(TDO[k].tools||[]);
      out.listed[k]=ids.slice();
      out.live[k]=tdoTools(k).map(it=>it.id);
      ids.forEach(id=>{ if(out.live[k].indexOf(id)<0)out.dead.push(k+'/'+id); });
    });
    out.none=K.filter(k=>!tdoTools(k).length);
    /* 표에 이름·아이콘을 또 적어 두지 않았나 (5번) */
    out.dupName=K.filter(k=>TDO[k].title||TDO[k].icon||TDO[k].toolName);
    /* 메뉴에서 빠지면(등급·권한) 단추도 같이 빠지나 */
    const real=window.navItemOf;
    window.navItemOf=function(id){ return id==='baba'?null:real(id); };
    out.gone=tdoTools('PC').map(it=>it.id);
    window.navItemOf=real;
    /* 홈에 실제로 그려지고, 눌러서 그 화면이 열리나 */
    AR.db=[{id:'p1',who:'me',name:'홍길동',region:'광주',src:'일반',stage:'PC',
            appt:'',days:10,n:3,cAt:'',pAt:''}];
    AR.cliRows=[];
    go('home'); await new Promise(r=>setTimeout(r,700));
    const btns=[].slice.call(document.querySelectorAll('#dynPane .hm-now .hm-tool'));
    out.btnTxt=btns.map(b=>b.textContent.replace(/\s+/g,' ').trim());
    let went=''; const g=window.go; window.go=function(t){went=t;};
    if(btns[0])btns[0].click();
    window.go=g; out.went=went;
    return out;
  },SEED);
  /* 사장님이 <b>직접 정해 주신 다섯</b> — 여기가 바뀌면 사장님 말씀이 지워진 것이다 */
  const BOSS={ '미접촉':['biz_news','cs_assist'], 'AP':['sangdam','fp_talk','frmake'],
               'PC':['baba','brain','finance'], '계약완료':['pdel','baba'],
               '거절':['mikki_talk','news_live'] };
  const off=Object.keys(BOSS).filter(k=>(G.listed[k]||[]).join(',')!==BOSS[k].join(','));
  is(off.length===0, '사장님이 정하신 <b>다섯 상태</b>의 도구가 그대로다'+
     (off.length?(' ← '+off.map(k=>k+': '+(G.listed[k]||[]).join(',')).join(' / ')):''));
  /* ↓ 이것이 실제로 잡았다 — 'req'(가입설계 요청서)는 비포&애프터 <b>안에</b>
       있는 것이라 탭이 아니었고, 단추가 조용히 안 서고 있었다. */
  is(G.dead.length===0, '표에 적은 도구가 <b>전부 열리는 화면</b>이다'+
     (G.dead.length?(' ← '+G.dead.join(' · ')+' 는 메뉴에 없다'):''));
  is(G.none.length===0, '<b>열한 상태 모두</b> 손에 쥘 것이 있다'+
     (G.none.length?(' ← '+G.none.join(',')):''));
  is(G.dupName.length===0, '표에 <b>이름·아이콘을 또 안 적는다</b> — 메뉴에서 가져온다 (5번)');
  is(G.gone.length===2&&G.gone.indexOf('baba')<0,
     '메뉴에 없는 사람에게는 <b>그 단추가 안 선다</b> — '+G.gone.join(',')+
     ' (못 여는 단추를 세우면 눌렀는데 아무 일도 안 난다)');
  is(G.btnTxt.length===3, 'PC 줄에 단추가 <b>세 개</b> 선다 — '+G.btnTxt.join(' · '));
  is(/비포&애프터|윤시현|계산기/.test(G.btnTxt.join(' ')),
     '단추에 <b>메뉴에 적힌 이름</b>이 그대로 뜬다');
  is(G.went==='baba', '눌렀더니 <b>그 화면으로</b> 간다 — '+(G.went||'아무 데도'));

  console.log('\n[9] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 상태가 아직 한 벌이 아닙니다')
                 :'✓ 상태가 한 벌이고, 상태마다 오늘 어떻게 연락할지 말합니다.');
  process.exit(bad?1:0);
})();
