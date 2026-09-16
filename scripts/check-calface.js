/* <b>이번 주 · 이번 달 — 이름 · 담당자 · 무엇을 할지.</b>

   사장님 말씀 — 「여기 화면에서 <b>뭐하면 좋을지</b> / 담당자[설계사] 이름도
   해야 팀별 관리가 쉽고, 이거 <b>이름 그대로 다 표기</b>는 안 되니?」

   ★ 여기서 <b>제 실수 하나</b>를 찾았습니다. 이 달력은 <b>화면에서도</b>
     가린 이름을 먼저 썼습니다 — 「김*호 · 연락」 이 114줄 섰습니다. 가리는
     까닭은 <b>밖으로 나갈 때</b>(iCloud·구글 달력)이지 이 브라우저 화면이
     아닙니다 (3번). 고객 365일은 이미 아는 이름을 그대로 보여 주고 있어,
     <b>같은 사람을 두 화면이 다르게 부르고</b> 있었습니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 화면에는 <b>아는 이름 그대로</b> — 배정 DB 에서도 되찾는다
     [2] 못 찾은 이름은 <b>가린 채로</b> 둔다 · 왜 그런지 적는다 (1번)
     [3] 폰 달력으로 <b>나가는</b> 이름은 여전히 가린다 (3번)
     [4] 줄마다 <b>무엇을 할지</b> 가 있다 — 고객 365일 규칙 한 곳에서
     [5] 줄마다 <b>담당자</b> 가 있다 · 담당자를 고르면 달력도 따라온다
     [6] 잘린 글자가 없다 · 콘솔이 조용하다                              */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PORT=8927;
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css'};
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(rq.url.split('?')[0]); if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);rs.end();return;}
  rs.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 견본은 <b>홍길동</b> 집안입니다 (3번).
   · 홍*동 — 배정 DB 에 <b>같은 담당자</b>의 홍길동이 있다 → 되찾는다
   · 임*정 — 배정 DB 에 있지만 <b>담당자가 다르다</b> → 되찾는다(제 담당자로)
   · 장*수 — 어디에도 없다 → <b>가린 채로</b> 둔다
   · 최*수 — 배정 DB 에 <b>같은 가린 이름이 둘</b> → 누구인지 못 가린다 */
const SEED=`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'윤시현',role:'owner',active:true,plan:'vip'};
  window.osLoadProfile=function(){};window.osProfileApply=function(){};
  window.osShowLoginGate=function(){};window.toast=function(){};window.arLoad=function(){};
  try{osHideLoginGate();}catch(e){}
  CM.who={me:'윤시현',u2:'박서준'};CM.pick='';
  AR.loaded=true;AR.busy=false;AR.cliRows=[];
  AR.db=[{id:'b1',who:'me',name:'홍길동',region:'순천',src:'일반',stage:'부재',
          appt:'',days:9,n:1,cAt:'',pAt:''},
         {id:'b2',who:'u2',name:'임꺽정',region:'여수',src:'일반',stage:'TA',
          appt:'',days:4,n:1,cAt:'',pAt:''},
         {id:'b3',who:'me',name:'최민수',region:'광양',src:'일반',stage:'TA',
          appt:'',days:4,n:1,cAt:'',pAt:''},
         {id:'b4',who:'me',name:'최영수',region:'광양',src:'일반',stage:'TA',
          appt:'',days:4,n:1,cAt:'',pAt:''}];
  OSC.list=[{id:'c1',advisor_id:'me',name_masked:'홍*동',created_at:'2026-01-02'},
            {id:'c2',advisor_id:'u2',name_masked:'임*정',created_at:'2026-01-02'},
            {id:'c3',advisor_id:'me',name_masked:'장*수',created_at:'2026-01-02'},
            {id:'c4',advisor_id:'me',name_masked:'최*수',created_at:'2026-01-02'}];`;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const page=await b.newPage({viewport:{width:430,height:1100}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  console.log('\n[1] 화면에는 <b>아는 이름 그대로</b>');
  const A=await page.evaluate(seed=>{
    (0,eval)(seed);
    go('mycal');
    const out={};
    const nm=id=>{const c=OSC.list.filter(x=>x.id===id)[0];return mcalName(c);};
    out.mine=nm('c1'); out.other=nm('c2'); out.none=nm('c3'); out.twin=nm('c4');
    out.out1=mcalOutName(OSC.list[0]);
    /* 「실명으로 내보내기」 를 켜면 그때만 그대로 나간다 */
    mcalCfgSet('real',true); out.out2=mcalOutName(OSC.list[0]); mcalCfgSet('real',false);
    return out;
  },SEED);
  is(A.mine==='홍길동',
     '이 브라우저가 <b>배정 DB</b> 에서 되찾는다 — 홍*동 → '+A.mine+' (고객 명부에는 가린 이름만 올라간다)');
  is(A.other==='임꺽정', '<b>남의 담당</b> 고객도 그 담당자 것에서 찾는다 — 임*정 → '+A.other);

  console.log('\n[2] 못 찾은 이름은 <b>가린 채로</b> 둔다 (1번)');
  is(A.none==='장*수', '어디에도 없으면 <b>그대로 둔다</b> — '+A.none+' (그럴듯한 이름을 지어내지 않는다)');
  /* ↓ 이것이 제일 위험한 자리다 — 「최*수」 가 최민수인지 최영수인지 모른다.
       아무거나 붙이면 사장님이 고객 앞에서 <b>다른 이름</b>으로 부르신다. */
  is(A.twin==='최*수',
     '같은 담당자에게 <b>같은 가린 이름이 둘</b>이면 아무 이름도 안 붙인다 — '+A.twin+
     ' (최민수·최영수 중 누구인지 모른다)');

  console.log('\n[3] 폰 달력으로 <b>나가는</b> 이름은 가린다 (3번)');
  is(A.out1==='홍*동', 'iCloud·구글로 나갈 때는 <b>가린 채</b>다 — '+A.out1);
  is(A.out2==='홍길동', '「실명으로 내보내기」 를 켜신 <b>그때만</b> 그대로 나간다 — '+A.out2);
  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  is(/mcalOutName\(plan\[i\]\.c\)/.test(SRC),
     '오늘 것 <b>내보내기</b>가 그 길을 쓴다 — 화면용을 그대로 실으면 실명이 클라우드로 올라간다');

  console.log('\n[4] 줄마다 <b>무엇을 할지</b> · [5] <b>담당자</b>');
  const B=await page.evaluate(()=>{
    const rows=[].slice.call(document.querySelectorAll('#dynPane .mcal-it'));
    return { n:rows.length,
      txt:rows.map(x=>x.textContent.replace(/\s+/g,' ').trim()),
      doN:rows.filter(x=>x.querySelector('.mcal-do')).length,
      whoN:rows.filter(x=>x.querySelector('.mcal-who')).length,
      whos:rows.map(x=>(x.querySelector('.mcal-who')||{}).textContent||''),
      picks:[].slice.call(document.querySelectorAll('#dynPane .mcal-day .cm-whos .cm-sb'))
              .map(x=>x.textContent.replace(/\s+/g,' ').trim()),
      mask:(document.querySelector('#dynPane .mcal-mask')||{}).textContent||'' };
  });
  is(B.n===4, '네 분이 모두 선다 — '+B.n+'줄');
  is(B.doN===B.n, '줄마다 <b>무엇을 할지</b> 가 붙는다 — '+B.doN+'/'+B.n+'줄');
  is(/전화|소식/.test(B.txt[0])&&/한 번도 연락한 적이 없습니다/.test(B.txt[0]),
     '무엇을 · 왜 를 <b>그대로</b> 적는다 — 「'+B.txt[0].replace(/^[^가-힣]*/,'').slice(0,40)+'…」');
  /* 고객 365일 규칙(CC_RULES)을 여기서 또 적지 않았나 — 두 벌이면 갈린다 (5번) */
  const body=SRC.slice(SRC.indexOf('function mcalDoOf('),SRC.indexOf('function mcalWhoName('));
  is(/ccPlan\(/.test(body)&&!/한 번도 연락한 적이 없습니다/.test(body),
     '무엇을 할지는 <b>고객 365일 규칙 한 곳</b>에서 가져온다 (5번) — 여기 또 안 적었다');
  is(B.whoN===B.n, '줄마다 <b>담당자 이름</b>이 붙는다 — '+B.whoN+'/'+B.n+'줄');
  is(B.whos.indexOf('박서준')>=0&&B.whos.indexOf('윤시현')>=0,
     '<b>누가 맡은 분인지</b> 그대로 — '+B.whos.filter(Boolean).join(' · '));
  is(B.picks.length>=3, '<b>담당자 고르개</b>가 달력 위에 선다 — '+B.picks.join(' / '));
  is(/가려진/.test(B.mask)&&/2분/.test(B.mask),
     '아직 <b>가려진 분</b>이 몇 분인지와 까닭을 적는다 — 「'+B.mask.replace(/\s+/g,' ').slice(0,38)+'…」');

  console.log('\n[5-1] 담당자를 고르면 <b>달력도 따라온다</b> (5번)');
  const C=await page.evaluate(()=>{
    const out={};
    cmWhoSet('u2');
    out.after=[].slice.call(document.querySelectorAll('#dynPane .mcal-it'))
                .map(x=>(x.querySelector('b')||{}).textContent||'');
    out.pick=CM.pick;
    cmWhoSet('u2');
    out.back=[].slice.call(document.querySelectorAll('#dynPane .mcal-it')).length;
    return out;
  });
  is(C.pick==='u2'&&C.after.length===1&&C.after[0]==='임꺽정',
     '한 사람을 고르면 <b>그분 것만</b> 남는다 — '+(C.after.join(',')||'없음')+
     ' (고르개는 고객 365일과 한 벌이다)');
  is(C.back===4, '같은 칸을 <b>다시 누르면 전체</b>로 — '+C.back+'줄');

  console.log('\n[6] 글자가 <b>안 잘린다</b> · 콘솔');
  /* 윗줄(.mcal-it .m span)이 <b>한 줄로 자르게</b> 해 두어, 여기서 되돌려야 한다.
     안 되돌리면 「목소리가 먼저입니」 에서 글자가 잘린다 — 잘린 말은 안 읽힌다.

     ※ 처음에는 안쪽 <i> 하나만 쟀다. 그런데 <i> 는 <b>자기 규칙</b>으로
       보호받고 있어, 바깥 줄이 잘려도 초록이 떴다 — <b>안 울리는 알람</b>
       이었다 (8번). 이제 <b>두 줄을 다</b> 잰다. */
  const D=await page.evaluate(()=>{
    const one=sel=>{
      const e=document.querySelector(sel);
      if(!e)return null;
      return {ws:getComputedStyle(e).whiteSpace,cut:e.scrollWidth>e.clientWidth+1,
              t:e.textContent.replace(/\s+/g,' ').trim()};
    };
    return {head:one('#dynPane .mcal-do'),tail:one('#dynPane .mcal-do i')};
  });
  const wrapOk=x=>!!x&&x.ws!=='nowrap'&&!x.cut;
  is(wrapOk(D.head)&&wrapOk(D.tail),
     '긴 줄이 <b>두 줄 다 접혀서</b> 보인다 — 「'+(((D.tail||{}).t||'').slice(0,26))+'…」'+
     ((!wrapOk(D.head)&&D.head)?(' ← 윗줄이 '+D.head.ws+(D.head.cut?'·잘림':'')):'')+
     ((!wrapOk(D.tail)&&D.tail)?(' ← 아랫줄이 '+D.tail.ws+(D.tail.cut?'·잘림':'')):''));
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 달력이 아직 누구인지·무엇을 할지 말하지 않습니다')
                 :'✓ 이름 그대로 서고, 무엇을 할지와 누가 맡았는지가 줄마다 있습니다.');
  process.exit(bad?1:0);
})();
