/* <b>고객 상태에 따라 오늘 무엇을 할지 말해 주는가.</b>

   사장님 말씀 그대로 — 「TA / AP / PC / CS(증권전달) / 거절 / 부재 등 고객의
   상태에 따라서, 오늘 해야 할 일을 찾아주고 정리해 줘」.

   여태 이 앱은 <b>세기만</b> 했습니다. 「부재 12 · 거절 5 · 진행중 3」 은
   나오는데 <b>그래서 오늘 뭘 하라</b>는 말이 없었습니다. 숫자는 보고이지
   행동이 아닙니다.

   여기서 재는 것 (CLAUDE.md 8번 — 결과를 잰다):

     [1] 상태마다 <b>오늘 무엇을</b> 이 있다 — 빈 줄이 하나도 없다
     [2] 표가 <b>하나</b>다 — 이름표·색·차례·기준일을 따로 안 적는다 (5번)
     [3] 기준일이 <b>코드에 안 박혀</b> 있다 — 사장님이 고치면 그 값이 이긴다
     [4] 잘못 적은 값(빈칸·글자·음수)을 <b>0 으로 쓰지 않는다</b> (1번)
     [5] 홈 「지금 이것 하세요」 에 <b>실제로</b> 그 사람과 할 말이 선다
     [6] DB 줄을 열면 <b>CRM 으로</b> 간다 — 고객 365일 카드로 보내면 안 열린다
     [7] 팀원 것이 내 목록에 <b>안 섞인다</b>
     [8] 고객 이름은 <b>씻어서</b> 나가고, 내가 쓴 글은 그대로 보인다 (3번)   */
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

/* 오늘 기준으로 며칠 전인지 — 점검이 날짜를 박아 두면 내일 빨간불이 된다 */
const ago=(n)=>{const d=new Date(Date.now()-n*86400000);return d.toISOString().slice(0,10);};

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch(); const page=await b.newPage({viewport:{width:430,height:900}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  console.log('\n[1] 상태마다 <b>오늘 무엇을</b> 이 있다');
  const T=await page.evaluate(()=>{
    const K=tdoOrder();
    /* 말을 만드는 곳은 <b>arTodoOf 하나</b>다 — 상태마다 진짜로 말이 나오는지
       그쪽에 물어본다. 표에 또 적어 두면 두 글이 갈린다 (5번). */
    const say=(k,extra)=>arTodoOf(Object.assign({k:k,d:tdoWait(k),ap:'',st:'',plan:''},extra||{}));
    return { keys:K,
      empty:K.filter(k=>!(say(k)||'').trim()),
      noSt:K.filter(k=>TDO[k].st===undefined),
      ords:K.map(k=>TDO[k].ord),
      /* 같은 무리라도 <b>형편이 다르면 다르게</b> 말해야 한다 */
      runAp: say('run',{ap:'2026-09-20 14:00'}),
      runNo: say('run'),
      runPc: say('run',{st:'PC'}),
      polNew:say('pol',{d:1}), polOld:say('pol',{d:20}),
      /* 표에 말이 <b>안 적혀 있어야</b> 한다 */
      tableHasDo:K.some(k=>TDO[k].do!==undefined||TDO[k].do2!==undefined) };
  });
  is(T.keys.length>=8, '상태가 <b>'+T.keys.length+'가지</b> 있다');
  is(T.empty.length===0, '상태마다 <b>오늘 무엇을</b> 이 나온다'+
     (T.empty.length?(' ← '+T.empty.join(',')):''));
  is(T.noSt.length===0, '상태마다 <b>사장님이 쓰시는 말</b>(TA·AP·PC·CS)이 붙어 있다');
  is(!T.tableHasDo, '표에는 <b>말을 안 적어 둔다</b> — 말하는 곳은 arTodoOf 하나다 (5번)');
  is(T.runAp!==T.runNo, '진행중은 <b>약속이 있을 때와 없을 때</b>를 갈라 말한다');
  is(T.runPc!==T.runNo, '<b>PC(제안)</b> 는 또 다르게 말한다 — 「'+T.runPc.slice(0,26)+'…」');
  is(T.polNew!==T.polOld, '계약은 <b>며칠 됐는지</b>에 따라 다르게 말한다 — 「'+T.polOld.slice(0,26)+'…」');
  is(new Set(T.ords).size===T.ords.length, '차례가 <b>겹치지 않는다</b> — ' + T.ords.join(','));

  console.log('\n[2] 표가 하나다 (5번)');
  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const two=await page.evaluate(()=>{
    const K=tdoOrder();
    return { lab:K.every(k=>AR_TKL[k]===TDO[k].t), col:K.every(k=>AR_TKC[k]===TDO[k].c),
             ord:JSON.stringify(bcrOrd())===JSON.stringify(K) };
  });
  is(two.lab, '이름표(AR_TKL)가 <b>표에서</b> 나온다 — 따로 적으면 갈린다');
  is(two.col, '색(AR_TKC)도 <b>표에서</b> 나온다');
  is(two.ord, '차례(BCR_ORD)도 <b>표에서</b> 센다');
  is(!/var BCR_ORD=\[/.test(SRC), '옛 차례표가 <b>안 남아 있다</b> — 죽은 판이 돌면 안 된다 (5번)');

  console.log('\n[3] 기준일이 코드에 안 박혀 있다 — 사장님이 고치면 그 값이 이긴다');
  const fn=SRC.slice(SRC.indexOf('function arTouch(who){'), SRC.indexOf('function arTouch(who){')+2600);
  is(!/days>=\d|days<=\d|bd<=\d|pd<=\d/.test(fn.replace(/\s/g,'')),
     '사람을 고르는 곳에 <b>맨 숫자가 없다</b> — 전부 tdoWait() 를 본다');
  const W=await page.evaluate(()=>{
    const real=window.osCfgGet, out={};
    out.def=tdoWait('no');
    window.osCfgGet=(k,d)=>k==='tdo_wait_no'?'21':real(k,d);
    out.mine=tdoWait('no'); out.on=tdoOn('no');
    window.osCfgGet=real;
    return out;
  });
  is(W.def===7, '기본값이 살아 있다 — 부재 <b>'+W.def+'일</b>');
  is(W.mine===21, '사장님이 고치시면 <b>그 값이 이긴다</b> — '+W.mine+'일');
  is(W.on===true, '고치신 것을 <b>고쳤다고 표시</b>한다');

  console.log('\n[4] 잘못 적은 값을 0 으로 쓰지 않는다 (1번)');
  const Z=await page.evaluate(()=>{
    const real=window.osCfgGet,out={};
    ['','  ','abc','-3','3.7'].forEach((v,i)=>{
      window.osCfgGet=(k,d)=>k==='tdo_wait_no'?v:real(k,d);
      out[i]=tdoWait('no');
    });
    window.osCfgGet=real; return out;
  });
  is(Z[0]===7&&Z[1]===7, '비우면 <b>기본값</b>으로 돌아간다 — 0 이 아니다');
  is(Z[2]===7, '글자를 적으면 <b>기본값</b> — 0 으로 읽으면 모두가 오늘 걸 사람이 된다');
  is(Z[3]===7, '음수도 <b>기본값</b>');
  is(Z[4]===3, '소수는 <b>정수로</b> 읽는다 — '+Z[4]);

  /* ── 견본 — 상태마다 한 사람씩. 이름은 홍길동 계열 (3번) ── */
  const SEED=(D)=>`
    OS.session={user:{id:'me'}};
    OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
    AR.loaded=true; AR.busy=false;
    AR.db=${JSON.stringify(D)};
    AR.cliRows=[];
    window.toast=function(){};`;
  const T0=new Date().toISOString().slice(0,10);
  const DB=[
    {id:'d1',who:'me',name:'홍길동',region:'광주',src:'일반',stage:'AP',res:'상담',
     appt:T0+'T14:00',days:1,n:2,cAt:'',pAt:''},
    {id:'d2',who:'me',name:'홍길순',region:'광주',src:'일반',stage:'PC',res:'상담',
     appt:'',days:10,n:3,cAt:'',pAt:''},
    {id:'d3',who:'me',name:'홍말순',region:'광주',src:'일반',stage:'TA',res:'부재',
     appt:'',days:9,n:1,cAt:'',pAt:''},
    {id:'d4',who:'me',name:'홍갑돌',region:'광주',src:'일반',stage:'미접촉',res:'거절',
     appt:'',days:20,n:1,cAt:'',pAt:''},
    {id:'d5',who:'me',name:'홍을돌',region:'광주',src:'일반',stage:'미접촉',res:'미진행',
     appt:'',days:5,n:0,cAt:'',pAt:''},
    {id:'d6',who:'me',name:'홍병돌',region:'광주',src:'일반',stage:'계약완료',res:'상담',
     appt:'',days:2,n:4,cAt:ago(2),pAt:''},
    {id:'d7',who:'me',name:'홍정돌',region:'광주',src:'일반',stage:'증권전달',res:'상담',
     appt:'',days:5,n:5,cAt:ago(20),pAt:ago(5)},
    {id:'d8',who:'남',name:'남의고객',region:'서울',src:'일반',stage:'TA',res:'부재',
     appt:'',days:30,n:1,cAt:'',pAt:''}
  ];
  console.log('\n[5] 홈 「지금 이것 하세요」 에 그 사람과 할 말이 선다');
  const H=await page.evaluate(async([seed])=>{
    (0,eval)(seed);
    go('home'); await new Promise(r=>setTimeout(r,700));
    const L=hmSteps().filter(x=>x.k==='db');
    const pane=document.getElementById('dynPane');
    const now=pane.querySelector('.hm-now');
    return { n:L.length, kinds:L.map(x=>x.tk),
             first:L[0]||null,
             allTodo:L.every(x=>(x.s||'').replace(/<[^>]*>/g,'').trim().length>5),
             allName:L.every(x=>(x.t||'').length>0),
             nowTxt:now?now.textContent.replace(/\s+/g,' ').trim():'',
             nowHtml:now?now.innerHTML:'',
             cnt:(hmCount()||{}).db };
  },[SEED(DB)]);
  is(H.n===6, '내 DB <b>여섯 명</b>이 상태별 할 일로 선다 — '+H.n+
     '명 (남의 것 한 명은 빠지고, 오늘 약속 한 명은 달력이 맡는다)');
  is(H.allName, '줄마다 <b>그 사람 이름</b>이 있다');
  is(H.allTodo, '줄마다 <b>오늘 무엇을</b> 이 있다 — 「어디로 가세요」 로 끝나지 않는다');
  is(H.cnt===H.n, '홈 카드가 <b>목록과 같은 수</b>를 센다 — 카드 '+H.cnt+' · 목록 '+H.n+
     ' (두 곳이 다르면 어느 쪽이 맞는지 모른다 · 5번)');
  is(/약속/.test(H.nowTxt)||/AP/.test(H.nowTxt),
     '맨 앞은 <b>오늘 약속</b>이다 — 시간이 정해진 것이 먼저 ('+H.nowTxt.slice(0,42)+'…)');
  is(H.first&&H.first.kt&&/·/.test(H.first.kt),
     '이름표에 <b>사장님 말</b>이 붙는다 — 「'+((H.first||{}).kt||'')+'」');
  /* <b>같은 사람이 두 번 서면</b> 한쪽을 끝내도 다른 쪽이 남아 「다 했는데
     안 줄어든다」 가 된다. 오늘 약속은 달력이 시간과 함께 이미 세워 둔다. */
  const DUP=await page.evaluate(async([seed])=>{
    (0,eval)(seed);
    go('home'); await new Promise(r=>setTimeout(r,600));
    const L=hmSteps(), seen={}, dup=[];
    L.forEach(x=>{ const nm=(x.t||''); if(seen[nm])dup.push(nm); seen[nm]=1; });
    return { dup, all:L.length, appt:L.filter(x=>x.k==='appt').length,
             db:L.filter(x=>x.k==='db').length };
  },[SEED(DB)]);
  is(DUP.dup.length===0, '<b>같은 사람이 두 번 안 선다</b>'+
     (DUP.dup.length?(' ← '+DUP.dup.join(',')):'')+' (오늘 약속은 달력이 시간과 함께 세운다)');
  is(DUP.appt>=1, '오늘 약속은 <b>달력 줄로</b> 선다 — '+DUP.appt+'건 (시간이 붙어 있다)');

  console.log('\n[6] 눌러서 여는 곳 · 이름 씻기 (3번)');
  const O=await page.evaluate(async([seed])=>{
    (0,eval)(seed);
    go('home'); await new Promise(r=>setTimeout(r,500));
    const L=hmSteps().filter(x=>x.k==='db');
    let went=''; const g=window.go; window.go=function(t){went=t;};
    let cli=''; const gc=window.navGoCli; window.navGoCli=function(id){cli=id;};
    hmOpen(L[0].key);
    window.go=g; window.navGoCli=gc;
    /* 이름에 꺾쇠가 섞여 들어와도 그대로 그리면 안 된다 */
    AR.db=[{id:'x1',who:'me',name:'<img src=x onerror=1>홍길동',region:'',src:'',
            stage:'TA',res:'부재',appt:'',days:9,n:1,cAt:'',pAt:''}];
    hmPaint(); await new Promise(r=>setTimeout(r,250));
    const now=document.querySelector('#dynPane .hm-now');
    const html=now?now.innerHTML:'';
    /* 사장님이 적으신 메모가 글에 섞여 들어가는 자리 — 고객 365일의 「다음 할 일」 */
    AR.db=[];
    AR.cliRows=[{id:'c1',who:'me',name:'홍길동',plan:'<img src=x onerror=1>전화드리기',
                 days:200,bd:'',ever:true,at:'',man:null,due:''}];
    hmPaint(); await new Promise(r=>setTimeout(r,250));
    const n2=document.querySelector('#dynPane .hm-now');
    /* 이 줄은 <b>고객 365일</b> 사람이다 — 그분 카드로 가야 한다 */
    let w2='',c2=''; const g2=window.go, gc2=window.navGoCli;
    window.go=function(t){w2=t;}; window.navGoCli=function(id){c2=id;w2='clients';};
    hmOpen(hmSteps()[0].key);
    window.go=g2; window.navGoCli=gc2;
    return { went, cli, html, memo:n2?n2.innerHTML:'', memoGo:w2, memoId:c2 };
  },[SEED(DB)]);
  is(O.went==='crm', '<b>CRM 으로</b> 간다 — '+(O.went||'아무 데도')+
     ' (배정 DB 의 id 로 고객 카드를 열면 안 열린다)');
  is(O.cli==='', '고객 365일 카드를 <b>안 연다</b>');
  is(!/<img/i.test(O.html), '고객 이름에 섞인 <b>꺾쇠를 씻는다</b> (3번)');
  /* 글자 「onerror」 가 <b>씻긴 채로</b> 보이는 것은 괜찮다 — 살아 있는
     꺾쇠(&lt;img)가 있으면 안 된다. 처음에 글자로 재어 헛알람을 냈다 (8번). */
  is(!/<img/i.test(O.memo), '<b>적어 두신 메모</b>도 씻는다 — arTodoOf 는 「적어 둔 일부터 — ○○」 처럼 '+
     '메모를 글에 섞어 넣는다. 안 씻으면 메모 한 줄에 화면이 깨진다 (3번)');
  is(O.memoGo==='clients'&&O.memoId==='c1',
     '<b>기고객·생일</b>은 CRM 이 아니라 <b>그분 카드</b>로 간다 — '+
     (O.memoGo||'?')+'/'+(O.memoId||'?')+' (배정 DB 와 고객 365일은 id 가 다르다)');

  console.log('\n[7] 사장님이 기준을 고치시면 목록이 따라 바뀐다');
  const C=await page.evaluate(async([seed])=>{
    (0,eval)(seed);
    const real=window.osCfgGet;
    const n0=arTouch('me').filter(x=>x.k==='no').length;
    window.osCfgGet=(k,d)=>k==='tdo_wait_no'?'30':real(k,d);
    const n1=arTouch('me').filter(x=>x.k==='no').length;
    window.osCfgGet=real;
    return {n0,n1};
  },[SEED(DB)]);
  is(C.n0===1, '기본(7일)이면 9일 된 부재가 <b>올라온다</b> — '+C.n0+'명');
  is(C.n1===0, '30일로 고치시면 <b>안 올라온다</b> — '+C.n1+'명 (기준이 진짜로 쓰인다)');

  console.log('\n[8] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 오늘 무엇을 할지 아직 못 말합니다')
                 :'✓ 고객 상태마다 오늘 무엇을 할지 말하고, 기준은 사장님이 정하십니다.');
  process.exit(bad?1:0);
})();
