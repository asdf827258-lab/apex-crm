/* <b>DB 통합 CRM — 단계 · 터치 횟수 · 종류 차례.</b>

   사장님 말씀 —
     「터치 횟수 · 별도 관리 현재 횟수로 체크하는데 · <b>별도 칸을 만들고
      표기는 그대로</b> 해줘」
     「고객 접촉[TA] / 수정[상담표기]에서가 다른데 · 부재/거절/상담 —
      TA/AP/PC/증권전달 · 이렇게 다른데 <b>하나로 합쳐</b>달라고 이야기했는데
      안되고 있고」
     「DB종류 선택할때 <b>가나다 순</b>으로 정리해줘」

   ★ 여기서 <b>진짜 버그 하나</b>를 잡았습니다. 단계 목록이 세 곳에 따로
     적혀 있었습니다 —
       STAGES 배열        : 미접촉 <b>부재 거절</b> TA AP PC CS 계약완료 증권전달 (9)
       수정 폼 #dbStage   : 미접촉 TA AP PC CS 계약완료 증권전달 (7)
       거르개 #stageFilter: 같은 7가지
     그래서 「부재」·「거절」 고객을 수정 창에서 열면 고를 option 이 없어
     <b>단계 칸이 빈 채로</b> 섰고, 그대로 저장하면 stage 가 <b>null 로
     지워졌습니다.</b> 손으로 정해 둔 상태가 사라지고, 거르개로 그 사람들을
     찾을 수도 없었습니다. 브라우저로 직접 확인했습니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 단계 고르는 자리가 <b>전부 STAGES 한 곳</b>에서 선다
     [2] 부재·거절 고객을 열고 저장해도 <b>단계가 안 지워진다</b>
     [3] 통화 창에서 <b>결과와 단계를 같이</b> 정한다 — 옮기는 규칙은 한 곳
     [4] 터치 횟수 <b>별도 칸</b> — 적으면 그것, 비우면 통화 건수 · 0 은 0
     [5] DB 종류가 <b>가나다 순</b>으로 선다 — 숫자는 숫자로, 영문은 뒤로  */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8919;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 견본 고객은 <b>홍길동</b> 입니다 (3번) */
const SEED=`
  profile={id:'me',name:'홍길동',role:'admin',active:true};
  profiles=[{id:'me',name:'홍길동',role:'admin',active:true}];
  dbSources=['일반','보장분석10DB','보장분석2DB','보장분석1DB','개척','NS홈쇼핑 화재보험','홈쇼핑DB+'];
  dbs=[{id:'d1',assigned_to:'me',customer_name:'홍길순',stage:'부재',source:'일반',
        assigned_date:'2026-09-01',region:'순천시',touch_count:null},
       {id:'d2',assigned_to:'me',customer_name:'홍말순',stage:'거절',source:'일반',
        assigned_date:'2026-09-01',region:'순천시',touch_count:7},
       {id:'d3',assigned_to:'me',customer_name:'홍갑돌',stage:'AP',source:'개척',
        assigned_date:'2026-09-01',region:'여수시',touch_count:0},
       {id:'d4',assigned_to:'me',customer_name:'홍복동',stage:'소개완료',source:'일반',
        assigned_date:'2026-03-02',region:'광양시',touch_count:null,
        contracted_at:'2026-05-10',policy_sent_at:'2026-05-20',policy_no:'P-2026-0510'}];
  calls=[{id:'c1',db_id:'d1',created_by:'me',call_at:'2026-09-10T09:00:00Z',result:'부재'},
         {id:'c2',db_id:'d1',created_by:'me',call_at:'2026-09-11T09:00:00Z',result:'부재'},
         {id:'c3',db_id:'d2',created_by:'me',call_at:'2026-09-11T09:00:00Z',result:'거절'}];
  crmTeams=[];crmTeamOf={};cliKeys={};attendance=[];attErr=null;
  fillProfiles();fillSources();fillStages();`;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const page=await b.newPage({viewport:{width:1100,height:900}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.goto('http://127.0.0.1:'+PORT+'/db-crm.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1400);

  console.log('\n[1] 단계 고르는 자리가 <b>전부 한 곳</b>에서 선다 (5번)');
  const A=await page.evaluate((seed)=>{
    (0,eval)(seed);
    const val=el=>[].slice.call(el.options).map(o=>o.value).filter(Boolean);
    return { stages:STAGES.slice(),
             edit:val(document.getElementById('dbStage')),
             filter:val(document.getElementById('stageFilter')).filter(v=>v!=='__nopol__'),
             call:val(document.getElementById('callStage')) };
  },SEED);
  is(A.edit.join(',')===A.stages.join(','),
     '수정 폼이 <b>표 그대로</b> 선다 — '+A.edit.length+'가지');
  is(A.filter.join(',')===A.stages.join(','),
     '거르개도 <b>표 그대로</b> — '+A.filter.length+'가지 (예전엔 부재·거절이 빠져 못 찾았다)');
  is(A.call.join(',')===A.stages.join(','), '통화 창도 <b>표 그대로</b> — '+A.call.length+'가지');
  is(A.edit.indexOf('부재')>=0&&A.edit.indexOf('거절')>=0,
     '<b>부재·거절</b>을 손으로 고를 수 있다 — 여태 못 골랐다');
  /* 박아 둔 목록이 <b>남아 있으면</b> 또 두 벌이 된다 */
  const SRC=fs.readFileSync(path.join(ROOT,'db-crm.html'),'utf8');
  const head=SRC.slice(0,SRC.indexOf('<script>'));
  is(!/<option>미접촉<\/option>/.test(head)&&!/<option>증권전달<\/option>/.test(head),
     'HTML 에 <b>단계를 또 적어 두지 않았다</b> (5번) — 적어 두면 한쪽만 늙는다');

  console.log('\n[2] 부재·거절을 열고 저장해도 <b>단계가 안 지워진다</b>');
  const B=await page.evaluate((seed)=>{
    (0,eval)(seed);
    const out={};
    ['d1','d2','d3'].forEach(id=>{
      const d=dbs.find(x=>x.id===id);
      openDb(id);
      const sel=document.getElementById('dbStage');
      const shown=sel.value;
      /* 저장할 때 무엇이 들어가는지 — saveDb 의 그 줄과 같은 셈 */
      const stg=sel.value||'';
      const saved=(STAGES.indexOf(stg)>=0)?stg:null;
      out[id]={was:d.stage,shown,saved};
      closeModal('dbModal');
    });
    return out;
  },SEED);
  is(B.d1.shown==='부재'&&B.d1.saved==='부재',
     '<b>부재</b> 고객을 열면 부재가 골라져 있고 저장해도 부재다 — 화면 '+B.d1.shown+' · 저장 '+B.d1.saved);
  is(B.d2.shown==='거절'&&B.d2.saved==='거절',
     '<b>거절</b>도 그대로다 — 화면 '+B.d2.shown+' · 저장 '+B.d2.saved);
  is(B.d3.saved==='AP', '<b>AP</b> 처럼 되던 것도 그대로다 — '+B.d3.saved);

  console.log('\n[2-1] <b>소개완료</b> — 단계를 올려도 계약일이 안 지워진다');
  /* 단계를 하나 더할 때 <b>제일 잘 빠지는 자리</b>다. 목록에만 넣고
     stagePick·saveDb 의 조건을 안 고치면, 그 고객을 열었을 때 계약일 칸이
     아예 안 서고 — 그대로 저장을 누르면 <b>계약일·증권번호가 null 로
     지워진다.</b> 부재·거절에서 단계가 지워지던 것과 같은 모양이다. */
  const B2=await page.evaluate((seed)=>{
    (0,eval)(seed);
    openDb('d4');
    const g=id=>document.getElementById(id);
    const seen=id=>{const e=g(id);return !!e&&!e.classList.contains('hidden')};
    const out={ shown:g('dbStage').value,
                wonOn:seen('wonField'), polOn:seen('polField'), noOn:seen('polNoField'),
                cAt:g('contractedAt').value, pAt:g('policySentAt').value, no:g('policyNo').value };
    /* 다른 단계로 내렸다가 되돌리면 칸이 따라 서고 사라지나 */
    g('dbStage').value='CS'; stagePick(); out.csOff=!seen('wonField')&&!seen('polField');
    g('dbStage').value='소개완료'; stagePick(); out.backOn=seen('wonField')&&seen('polField');
    closeModal('dbModal');
    return out;
  },SEED);
  is(B2.shown==='소개완료', '<b>소개완료</b> 고객을 열면 그 단계가 골라져 있다 — '+(B2.shown||'빈칸'));
  is(B2.wonOn&&B2.polOn&&B2.noOn,
     '<b>계약일 · 증권 전달일 · 증권번호</b> 칸이 셋 다 선다 — 안 서면 저장할 때 null 로 지워진다');
  is(B2.cAt==='2026-05-10'&&B2.pAt==='2026-05-20'&&B2.no==='P-2026-0510',
     '적어 두신 값이 <b>그대로</b> 뜬다 — '+B2.cAt+' · '+B2.pAt+' · '+B2.no);
  is(B2.csOff, 'CS 로 내리면 그 칸들이 <b>도로 숨는다</b> — 칸만 늘지 않는다');
  is(B2.backOn, '소개완료로 되돌리면 <b>다시 선다</b>');

  console.log('\n[3] 통화 창에서 <b>결과와 단계를 같이</b> 정한다');
  const C=await page.evaluate((seed)=>{
    (0,eval)(seed);
    openCall('d1');
    const out={};
    const res=document.getElementById('callResult'), st=document.getElementById('callStage');
    out.stageEmpty=st.value;                       /* 비어 있어야 결과대로 간다 */
    res.value='상담'; toggleAppointment();
    out.hintSangdam=(document.getElementById('callStageHint')||{}).textContent||'';
    out.autoSangdam=callStageFromResult('상담');
    res.value='부재'; toggleAppointment();
    out.autoBujae=callStageFromResult('부재');
    res.value='거절'; toggleAppointment();
    out.autoGeojeol=callStageFromResult('거절');
    /* 손으로 고르면 그 말이 바뀐다 */
    st.value='PC'; callStageHint();
    out.hintPick=(document.getElementById('callStageHint')||{}).textContent||'';
    closeModal('callModal');
    return out;
  },SEED);
  is(C.stageEmpty==='', '통화 창을 열면 단계는 <b>비어</b> 있다 — 비우면 결과대로 간다');
  is(C.autoSangdam==='AP'&&C.autoBujae==='부재'&&C.autoGeojeol==='거절',
     '결과가 단계로 <b>그대로</b> 옮겨진다 — 상담→'+C.autoSangdam+' · 부재→'+C.autoBujae+' · 거절→'+C.autoGeojeol);
  is(/AP/.test(C.hintSangdam)&&/상담/.test(C.hintSangdam),
     '<b>저장하면 무엇이 되는지</b> 그 자리에서 말한다 — 「'+C.hintSangdam.replace(/\s+/g,' ').slice(0,46)+'…」');
  is(/PC/.test(C.hintPick)&&/손으로/.test(C.hintPick),
     '손으로 고르면 <b>그것을 쓴다</b>고 말한다 — 「'+C.hintPick.replace(/\s+/g,' ').slice(0,40)+'…」');
  /* 옮기는 규칙이 <b>한 곳</b>인가 — 통화 창이 따로 적어 두지 않았나 (5번) */
  const body=SRC.slice(SRC.indexOf('function callStageFromResult('),
                       SRC.indexOf('function callStageHint('));
  is(/stageAuto\(/.test(body)&&!/["']AP["']/.test(body),
     '옮기는 규칙을 <b>여기서 또 적지 않았다</b> — stageAuto 한 곳만 안다 (5번)');
  is(/canEditDb\(/.test(SRC.slice(SRC.indexOf('async function saveCall('),
                                  SRC.indexOf('async function toggleGroup('))),
     '<b>고칠 권한이 없으면</b> 단계를 안 건드린다 — 못 하는 일을 한 척하지 않는다 (1번)');

  console.log('\n[4] 터치 횟수 <b>별도 칸</b> — 표기는 그대로');
  const D=await page.evaluate((seed)=>{
    (0,eval)(seed);
    const d1=dbs.find(x=>x.id==='d1'), d2=dbs.find(x=>x.id==='d2'), d3=dbs.find(x=>x.id==='d3');
    const out={ n1:touchCount(d1), n2:touchCount(d2), n3:touchCount(d3),
                calls1:touchCalls(d1), man1:touchManual(d1), man3:touchManual(d3),
                dots:touchDots(d1), dots2:touchDots(d2) };
    /* 수정 창에 값이 들어가나 */
    openDb('d2'); out.input2=document.getElementById('dbTouch').value; closeModal('dbModal');
    openDb('d1'); out.input1=document.getElementById('dbTouch').value; closeModal('dbModal');
    openDb('d3'); out.input3=document.getElementById('dbTouch').value; closeModal('dbModal');
    return out;
  },SEED);
  is(D.n1===2&&D.man1===null, '안 적으면 <b>통화 건수</b>로 센다 — '+D.n1+'회');
  is(D.n2===7, '적어 두면 <b>그 수</b>를 쓴다 — '+D.n2+'회 (통화는 1건뿐이다)');
  is(D.n3===0&&D.man3===0,
     '<b>0 을 적으면 0</b> 이다 — 「아직 한 번도 안 손댔다」는 뜻이지 「안 적음」이 아니다 (1번)');
  is(D.input1===''&&D.input2==='7'&&D.input3==='0',
     '수정 창에 <b>적어 둔 값 그대로</b> 뜬다 — 「'+D.input1+'」 · 「'+D.input2+'」 · 「'+D.input3+'」');
  is(/tdots/.test(D.dots)&&/td on/.test(D.dots),
     '<b>표기는 그대로</b>다 — 불 다섯 개 게이지');
  is(/손으로 적어 두신/.test(D.dots2)&&/통화 기록에서 셌/.test(D.dots),
     '손을 얹으면 <b>어디서 온 수인지</b> 말한다 — 화면 모양은 안 건드린다');
  is(/touch_count integer/.test(fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8')),
     '준비 SQL 에 <b>칸을 만드는 줄</b>이 있다 — 안 넣으면 적을 자리가 없다');
  is(/touch_count/.test(SRC)&&/migration_48_touch_count/.test(SRC),
     '칸이 <b>아직 없는 서버</b>에서도 저장이 안 막힌다 — 무엇을 돌리면 되는지 말한다 (1번)');

  console.log('\n[5] DB 종류가 <b>가나다 순</b>으로 선다');
  const E=await page.evaluate((seed)=>{
    (0,eval)(seed);
    const sel=document.getElementById('dbSource');
    /* 「＋ DB 종류 추가」는 속값이 __add__ 다 — 글자로 거르면 안 걸러진다 */
    const opts=[].slice.call(sel.options).map(o=>o.value).filter(v=>v&&v!==SRC_ADD);
    return { opts, list:srcList() };
  },SEED);
  const want=['개척','보장분석1DB','보장분석2DB','보장분석10DB','일반','홈쇼핑DB+','NS홈쇼핑 화재보험'];
  is(JSON.stringify(E.list)===JSON.stringify(want),
     '<b>가나다 순</b>이다 — '+E.list.join(' · '));
  is(E.list.indexOf('보장분석2DB')<E.list.indexOf('보장분석10DB'),
     '<b>2DB 가 10DB 보다 앞</b>이다 — 가나다로만 보면 뒤집힌다');
  is(E.list.indexOf('개척')<E.list.indexOf('NS홈쇼핑 화재보험'),
     '<b>한글이 먼저, 영문이 뒤</b>다 — 코드값으로 보면 영문이 맨 위에 선다');
  is(JSON.stringify(E.opts)===JSON.stringify(E.list), '고르는 칸도 <b>그 차례 그대로</b>다 — '+E.opts.join(' · '));

  /* 본체와 <b>한 칸도 안 달라야</b> 한다 — 파일이 둘이라 각자 잰다 (5번) */
  const APP=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const a=APP.indexOf('function arSrcKey('), z=APP.indexOf('function arSrcSort(L)');
  let appCmp=null;
  try{ appCmp=new Function(APP.slice(a,z)+'\nreturn arSrcCmp;')(); }catch(e){}
  is(!!appCmp, '본체에도 차례를 정하는 곳이 있다 — arSrcCmp');
  if(appCmp){
    const mine=['개척','보장분석1DB','보장분석2DB','보장분석10DB','일반','홈쇼핑DB+','NS홈쇼핑 화재보험','방송DB','소개'];
    const byApp=mine.slice().sort(appCmp);
    const byCrm=await page.evaluate(l=>l.slice().sort(srcCmp),mine);
    is(JSON.stringify(byApp)===JSON.stringify(byCrm),
       '본체와 CRM 이 <b>한 칸도 안 다르다</b> — '+byApp.join(' · '));
  }

  /* ══ [6] 상황을 누르면 <b>무엇을 도와드릴까요</b> ════════════════
     사장님 말씀 — 「고객 상황(부재/거절/AP/PC/증권전달 등)에 클릭하면
     무얼 도와줄지 물어보라고 했는데 안 뜬다」.

     여기서 재는 것 —
       · 딱지가 <b>정말 눌린다</b> (글자만 바꿔 놓고 안 눌리면 소용없다)
       · 그 단계의 <b>목표·방법</b>이 선다 — 본체와 같은 표에서 온다
       · <b>없는 갈래는 안 선다</b> — 거절은 다음 단계가 없다 (1번)
       · <b>못 하는 일은 안 선다</b> — 남의 고객이면 단계·수정이 빠진다
       · 고르면 <b>정말로 그 일이 일어난다</b> — 눌러서 창이 열리는지 본다 */
  console.log('\n[6] 상황을 누르면 <b>무엇을 도와드릴까요</b>');
  const ASK=await page.evaluate(()=>{
    /* 목록을 <b>실제로 세우고</b> 잰다 — 안 세우면 딱지가 0개라 무엇을 재는지 알 수 없다 */
    goPage('db'); renderDb();
    const read=()=>({
      open:!!(document.getElementById('askModal')||{}).classList
           &&document.getElementById('askModal').classList.contains('open'),
      aim:(document.querySelector('#askBody .ask-aim .v')||{}).textContent||'',
      way:(document.querySelector('#askBody .ask-aim .w')||{}).textContent||'',
      sum:(document.querySelector('#askBody .ask-sum')||{}).textContent||'',
      opts:[].slice.call(document.querySelectorAll('#askBody .ask-o')).map(e=>({
        t:e.querySelector('.m b').textContent,rec:e.classList.contains('rec')}))
    });
    const shut=()=>{const m=document.getElementById('askModal');if(m)m.classList.remove('open')};
    const out={};
    const badges=document.querySelectorAll('#dbBody .sg-badge');
    out.badgeN=badges.length;
    /* d1 부재 · d2 거절 · d3 AP — 목록 차례는 화면이 정한다. 이름으로 찾는다 */
    const rowOf=nm=>{
      const tr=[].slice.call(document.querySelectorAll('#dbBody tr'))
        .filter(r=>r.textContent.indexOf(nm)>=0)[0];
      return tr?tr.querySelector('.sg-badge'):null;
    };
    ['홍길순','홍말순','홍갑돌'].forEach((nm,i)=>{
      const b=rowOf(nm); if(!b){out['r'+i]={miss:1};return}
      b.click(); out['r'+i]=read(); shut();
    });
    /* 남의 고객으로 만들어 두고 다시 — 못 하는 일이 빠지나 */
    const keep=profile.role; profile.role='member';
    const d=dbs.find(x=>x.id==='d1'); const kw=d.assigned_to; d.assigned_to='someone';
    renderDb();
    const b2=rowOf('홍길순'); if(b2){b2.click(); out.other=read(); shut();}
    d.assigned_to=kw; profile.role=keep; renderDb();
    /* 정말로 그 일이 일어나나 — ① 을 누르면 접촉 창이 열린다 */
    const b3=rowOf('홍길순');
    if(b3){b3.click();
      const first=document.querySelector('#askBody .ask-o');
      if(first)first.click();
      out.calledOpen=document.getElementById('callModal').classList.contains('open');
      out.calledWho=(document.getElementById('callSummary')||{}).textContent||'';
      document.getElementById('callModal').classList.remove('open');
    }
    return out;
  });
  is(ASK.badgeN>=3, '상황 딱지가 <b>누를 수 있는 단추</b>로 선다 — '+ASK.badgeN+'개');
  is(ASK.r0&&ASK.r0.open===true, '부재를 누르면 <b>창이 열린다</b>');
  is(/한 번은 받으시게/.test((ASK.r0||{}).aim||''),
     '그 단계의 <b>목표</b>가 그대로 선다 — 「'+((ASK.r0||{}).aim||'없음')+'」');
  is(/시간대를 바꾸고/.test((ASK.r0||{}).way||''),
     '<b>어떻게</b> 하는지도 같이 선다 — 본체 홈과 같은 표에서 온다 (5번)');
  is(/홍길순/.test((ASK.r0||{}).sum||'')&&/부재/.test((ASK.r0||{}).sum||''),
     '누구의 <b>어떤 상황</b>인지 머리에 적힌다');
  const t0=((ASK.r0||{}).opts||[]).map(o=>o.t);
  is(t0.some(t=>/결과를 남긴다/.test(t)), '① <b>하고 나서 결과를 남기는</b> 갈래가 맨 위다');
  is(t0.some(t=>/「TA」 로 올린다/.test(t)), '부재의 <b>다음은 TA</b> — 표가 정한 대로');
  is(((ASK.r0||{}).opts||[]).filter(o=>o.rec).length>=2,
     '<b>기록으로 남는</b> 갈래가 따로 표시된다 — 열어 본 것과 한 것은 다르다 (1번)');
  const rej=((ASK.r1||{}).opts||[]).map(o=>o.t);
  is(rej.length>0&&!rej.some(t=>/로 올린다/.test(t)),
     '<b>거절은 다음 단계를 안 만든다</b> — 없는 자리를 지어내지 않는다 (1번)');
  is(/문을 닫지 않게/.test((ASK.r1||{}).aim||''), '거절에는 거절의 말이 선다');
  const ap=((ASK.r2||{}).opts||[]).map(o=>o.t);
  is(ap.some(t=>/「PC」 로 올린다/.test(t)), 'AP 의 다음은 <b>PC</b> 다');
  is(ap.some(t=>/보장분석 상담자료 열기|재무설계 실전화법서 열기|보장분석 전&후 만들기 열기/.test(t)),
     'AP 에서 쥘 <b>도구</b>가 이름으로 선다 — 메뉴 이름 그대로');
  const ot=((ASK.other||{}).opts||[]).map(o=>o.t);
  is(ot.length>0&&!ot.some(t=>/로 올린다|메모·정보 고치기/.test(t)),
     '<b>남의 고객이면 못 하는 갈래가 안 선다</b> — 눌렀는데 「권한 없음」 만 뜨는 단추를 안 세운다');
  is(ot.some(t=>/결과를 남긴다/.test(t)), '그래도 <b>연락하고 남기는</b> 것은 누구나 된다');
  is(ASK.calledOpen===true&&/홍길순/.test(ASK.calledWho||''),
     '고르면 <b>정말로 그 일이 일어난다</b> — ① 을 누르니 그분 접촉 창이 열렸다');

  console.log('\n[7] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — CRM 이 아직 안 맞습니다')
                 :'✓ 단계가 한 벌이고, 터치 횟수는 따로 적히고, 종류는 가나다로 섭니다.');
  process.exit(bad?1:0);
})();
