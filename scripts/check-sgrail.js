/* <b>DB 통합 CRM — 단계를 한눈에 보고 그 자리에서 올린다.</b>

   사장님 말씀 — 「APEX 쉬운판 너가 만든 것처럼, <b>쉽게 관리하고 보이도록</b>
   해야지」.

   여태 단계는 <b>목록 맨 끝 칸의 배지 하나</b>였습니다. 배정이 1,000건을
   넘고부터는 「지금 TA 가 몇 명인가」 를 알려면 거르개를 <b>열 번</b> 바꿔
   가며 세어야 했고, 한 사람 단계를 올리려면 <b>수정 창을 열고 · 고르고 ·
   저장</b> 세 번을 눌러야 했습니다. 단계는 <b>일의 순서</b>인데 화면에는
   순서가 없었습니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 단계 <b>길</b>이 선다 — 열 칸이 차례대로, 칸마다 인원
     [2] 칸을 누르면 <b>그 단계만</b> 남는다 — 거르개와 <b>한 벌</b>이다 (5번)
     [3] 찾기·담당자를 먹인 채로 센다 — <b>단계만</b> 빼고
     [4] 줄에서 <b>한 번에</b> 다음 단계로 — 차례는 STAGES 하나가 안다
     [5] 날짜가 필요한 단계는 <b>지어내지 않고</b> 수정 창을 연다 (1번)
     [6] 대시보드에도 <b>같은 길</b>이 선다 — 모양은 한 곳에서만 만든다 (5번)
     [7] 서버를 다시 부르지 않는다 (7번) · 손가락으로 누를 만하다          */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8923;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 견본 고객은 <b>홍길동</b> 집안입니다 (3번). 단계를 <b>골고루</b> 깔아야
   길이 제대로 서는지 보입니다 — 한 단계에 몰아 두면 0 인 칸을 못 봅니다. */
const SEED=`
  profile={id:'me',name:'홍길동',role:'admin',active:true};
  profiles=[{id:'me',name:'홍길동',role:'admin',active:true},
            {id:'u2',name:'홍판서',role:'member',active:true}];
  dbSources=['일반','개척'];
  dbs=[{id:'d1',assigned_to:'me',customer_name:'홍길순',stage:'미접촉',source:'일반',
        assigned_date:'2026-09-01',region:'순천시'},
       {id:'d2',assigned_to:'me',customer_name:'홍말순',stage:'미접촉',source:'개척',
        assigned_date:'2026-09-01',region:'광주광역시'},
       {id:'d3',assigned_to:'me',customer_name:'홍갑돌',stage:'TA',source:'일반',
        assigned_date:'2026-09-02',region:'광주광역시'},
       {id:'d4',assigned_to:'me',customer_name:'홍을돌',stage:'PC',source:'일반',
        assigned_date:'2026-09-02',region:'여수시'},
       {id:'d5',assigned_to:'me',customer_name:'홍병돌',stage:'계약완료',source:'일반',
        assigned_date:'2026-06-02',region:'여수시',contracted_at:'2026-08-20'},
       {id:'d6',assigned_to:'me',customer_name:'홍정돌',stage:'소개완료',source:'일반',
        assigned_date:'2026-02-02',region:'광양시',
        contracted_at:'2026-04-10',policy_sent_at:'2026-04-20',policy_no:'P-1'},
       {id:'d7',assigned_to:'u2',customer_name:'남의고객',stage:'TA',source:'일반',
        assigned_date:'2026-09-03',region:'순천시'}];
  calls=[];crmTeams=[];crmTeamOf={};cliKeys={};attendance=[];attErr=null;
  /* 로그인 문을 안 지나면 #app 이 통째로 hidden 이라 <b>크기가 전부 0</b> 이
     나온다 — 그 상태로 「44px 넘나」 를 재면 <b>안 울리는 알람</b>이 된다 (8번) */
  document.getElementById('app').classList.remove('hidden');
  ['configScreen','authScreen'].forEach(function(id){
    var e=document.getElementById(id); if(e)e.classList.add('hidden'); });
  fillProfiles();fillSources();fillStages();renderAll();`;

const txt=el=>el.textContent.replace(/\s+/g,' ').trim();

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const page=await b.newPage({viewport:{width:1100,height:900}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.goto('http://127.0.0.1:'+PORT+'/db-crm.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1400);

  console.log('\n[1] 단계 <b>길</b>이 선다 — 칸마다 인원');
  const A=await page.evaluate((seed)=>{
    (0,eval)(seed);
    goPage('db');
    const st=[].slice.call(document.querySelectorAll('#sgRail .sg-step'));
    return { stages:STAGES.slice(),
             names:st.map(x=>(x.querySelector('b')||{}).textContent||''),
             nums:st.map(x=>+(((x.querySelector('i')||{}).textContent)||0)),
             zero:st.filter(x=>x.classList.contains('zero')).length,
             arrows:document.querySelectorAll('#sgRail .sg-ar').length,
             warn:(document.querySelector('#sgRail .sg-warn')||{}).textContent||'' };
  },SEED);
  is(A.names.length===A.stages.length+1,
     '<b>전체 + 열 단계</b> 가 차례대로 선다 — '+A.names.length+'칸');
  is(A.names.slice(1).join(',')===A.stages.join(','),
     '차례가 <b>STAGES 그대로</b>다 — '+A.names.slice(1).join(' › '));
  is(A.nums[0]===7, '「전체」 칸이 <b>전부</b>를 센다 — '+A.nums[0]+'명');
  /* 손으로 푼 답과 맞춘다 — 미접촉 2 · TA 2(남의 것 포함) · PC 1 · 계약완료 1 · 소개완료 1 */
  const want={'미접촉':2,'TA':2,'PC':1,'계약완료':1,'소개완료':1};
  const got={}; A.names.slice(1).forEach((n,i)=>{got[n]=A.nums[i+1]});
  const off=Object.keys(want).filter(k=>got[k]!==want[k]);
  is(off.length===0, '칸마다 <b>인원이 맞는다</b> — 미접촉 '+got['미접촉']+' · TA '+got['TA']+
     ' · PC '+got['PC']+' · 계약완료 '+got['계약완료']+' · 소개완료 '+got['소개완료']+
     (off.length?(' ← '+off.map(k=>k+' '+got[k]+'≠'+want[k]).join(',')):''));
  is(A.zero>=3, '<b>비어 있는 칸도 자리를 지킨다</b> — '+A.zero+'칸이 흐리게 선다 (0 을 숨기면 순서가 끊긴다)');
  is(A.arrows===A.stages.length, '칸과 칸 사이에 <b>화살표</b>가 있다 — 순서라는 뜻이다');
  is(/증권 미전달 1명/.test(A.warn),
     '<b>증권을 아직 못 보낸 분</b>을 따로 짚는다 — 「'+A.warn.replace(/\s+/g,' ').slice(0,32)+'…」');

  console.log('\n[2] 칸을 누르면 <b>그 단계만</b> — 거르개와 한 벌이다 (5번)');
  const B=await page.evaluate(()=>{
    const pick=n=>{const st=[].slice.call(document.querySelectorAll('#sgRail .sg-step'));
                   const el=st.filter(x=>((x.querySelector('b')||{}).textContent||'')===n)[0];
                   if(el)el.click(); };
    const rows=()=>[].slice.call(document.querySelectorAll('#dbBody tr')).length;
    const nm=()=>[].slice.call(document.querySelectorAll('#dbBody .name'))
                   .map(x=>x.textContent.replace(/\s+/g,' ').trim()).join(' | ');
    const out={};
    pick('TA');
    out.filt=document.getElementById('stageFilter').value;   /* 거르개가 같이 움직였나 */
    out.n=rows(); out.who=nm();
    out.on=[].slice.call(document.querySelectorAll('#sgRail .sg-step.on'))
             .map(x=>(x.querySelector('b')||{}).textContent||'');
    pick('TA');                                              /* 같은 칸을 다시 */
    out.back=document.getElementById('stageFilter').value;
    out.backN=rows();
    /* 거르개를 <b>손으로</b> 움직여도 길이 따라오나 — 두 벌이면 어긋난다 */
    document.getElementById('stageFilter').value='PC'; renderDb();
    out.railOn=[].slice.call(document.querySelectorAll('#sgRail .sg-step.on'))
                 .map(x=>(x.querySelector('b')||{}).textContent||'');
    document.getElementById('stageFilter').value=''; renderDb();
    return out;
  });
  is(B.filt==='TA', '칸을 누르면 <b>거르개가 그 값</b>이 된다 — '+(B.filt||'빈칸')+' (따로 기억해 두면 둘이 어긋난다)');
  is(B.n===2&&B.who.indexOf('홍갑돌')>=0,
     '목록이 <b>그 단계만</b> 남는다 — '+B.n+'명 ('+B.who.slice(0,40)+')');
  is(B.on.length===1&&B.on[0]==='TA', '누른 칸에 <b>표시</b>가 남는다 — 지금 무엇을 보고 있는지 안다');
  is(B.back===''&&B.backN===7, '같은 칸을 <b>다시 누르면 전체</b>로 — 빠져나갈 길이 있다 ('+B.backN+'명)');
  is(B.railOn.length===1&&B.railOn[0]==='PC',
     '거르개를 손으로 바꿔도 <b>길이 따라온다</b> — '+(B.railOn[0]||'안 따라옴'));

  console.log('\n[3] 찾기·담당자를 먹인 채로 센다 — <b>단계만</b> 빼고');
  const C=await page.evaluate(()=>{
    const out={};
    const num=n=>{const st=[].slice.call(document.querySelectorAll('#sgRail .sg-step'));
      const el=st.filter(x=>((x.querySelector('b')||{}).textContent||'')===n)[0];
      return el?+((el.querySelector('i')||{}).textContent||0):-1; };
    document.getElementById('search').value='광주'; renderDb();
    out.gwangju={tot:num('전체'),ta:num('TA'),mi:num('미접촉')};
    document.getElementById('search').value='';
    document.getElementById('ownerFilter').value='me'; renderDb();
    out.mine={tot:num('전체'),ta:num('TA')};
    document.getElementById('ownerFilter').value=''; renderDb();
    return out;
  });
  is(C.gwangju.tot===2&&C.gwangju.ta===1&&C.gwangju.mi===1,
     '「광주」 로 찾으면 <b>그 안에서</b> 센다 — 전체 '+C.gwangju.tot+
     ' · TA '+C.gwangju.ta+' · 미접촉 '+C.gwangju.mi+' (「광주 + TA 몇 명」 이 보인다)');
  is(C.mine.tot===6&&C.mine.ta===1,
     '담당자를 고르면 <b>그 사람 것만</b> 센다 — 전체 '+C.mine.tot+' · TA '+C.mine.ta+
     ' (남의 고객 한 명이 빠진다)');

  console.log('\n[4] 줄에서 <b>한 번에</b> 다음 단계로');
  const D=await page.evaluate(()=>{
    const out={};
    /* 차례는 STAGES 하나가 안다 — 여기서 또 적으면 두 벌이 된다 */
    out.next={}; STAGES.forEach(k=>{out.next[k]=sgNextOf({id:'x',stage:k})});
    /* 표에 <b>빠진 단계</b>가 있으면 그 자리에서 단추가 조용히 안 선다.
       길은 이제 <b>apex-stage.js 한 곳</b>에 있다 — 본체와 같은 파일이다 (5번) */
    out.missing=STAGES.filter(k=>!(k in APEX_STAGE.go));
    renderDb();
    const btn=id=>{const t=[].slice.call(document.querySelectorAll('#dbBody tr'))
      .filter(r=>r.innerHTML.indexOf("sgUp('"+id+"')")>=0)[0]; return !!t; };
    out.hasD1=btn('d1'); out.hasD6=btn('d6');
    /* 관리자는 남의 것도 고칠 수 있다 — <b>팀원</b>으로 바꿔서 재야 진짜다 */
    profile.role='member'; renderDb();
    out.memberD7=btn('d7'); out.memberD1=btn('d1');
    profile.role='admin'; renderDb();
    out.label=(document.querySelector('#dbBody .sg-up')||{}).textContent||'';
    /* 진짜로 올라가나 — 서버로 <b>무엇을</b> 보내는지 받아 둔다.
       이 판에는 진짜 서버가 없으므로(sb=null) 흉내를 하나 세운다. */
    const sent=[]; const realLoad=window.loadAll;
      /* ⚠ 진짜 supabase-js 는 <b>.select() 로 바뀐 줄을 돌려줍니다.</b>
         db-crm 이 「0줄인데 됐다고 말하던 것」 을 고치면서 쓰기 끝마다
         .select("id") 를 붙였습니다 — 가짜 서버가 진짜와 다르면 여기서
         터집니다(2026-09-21 CI 가 실제로 그렇게 잡았습니다). */
    sb={from:function(t){const a={update:function(p){sent.push({t:t,p:p});
      const c={eq:function(){return c},select:function(){return c},
        then:function(ok,no){return Promise.resolve({error:null,data:[{id:'x'}]}).then(ok,no)}};
      return c}};return a}};
    window.confirm=function(){return true};
    window.loadAll=function(){return Promise.resolve()};
    return sgUp('d1').then(function(){
      window.loadAll=realLoad;
      out.sent=sent;
      return out;
    });
  });
  is(D.next['미접촉']==='TA'&&D.next['TA']==='AP'&&D.next['PC']==='CS'&&
     D.next['CS']==='계약완료'&&D.next['계약완료']==='증권전달'&&D.next['증권전달']==='소개완료',
     '다음 단계가 <b>앞으로 나아가는 길</b>이다 — 미접촉→'+D.next['미접촉']+' · TA→'+D.next['TA']+
     ' · PC→'+D.next['PC']+' · CS→'+D.next['CS']+' · 계약완료→'+D.next['계약완료']);
  /* ↓ 이것이 실제로 잡았다 — STAGES 차례를 그대로 쓰니 「미접촉 → <b>부재</b>」 가
       떴다. 부재는 나아간 것이 아니라 <b>전화를 안 받으신 것</b>이다. */
  is(D.next['미접촉']!=='부재'&&D.next['부재']==='TA',
     '<b>부재는 나아간 것이 아니다</b> — 미접촉 다음이 부재가 아니고, 부재에서 통화가 되면 TA 다 (부재→'+D.next['부재']+')');
  is(D.next['거절']===''&&D.next['소개완료']==='',
     '<b>거절과 마지막 단계</b>에는 다음이 없다 — 없는 자리를 지어내지 않는다 (1번)');
  is(D.missing.length===0,
     '<b>모든 단계</b>가 길 표에 적혀 있다'+(D.missing.length?(' ← '+D.missing.join(',')+' 가 빠져 단추가 안 선다'):''));
  is(D.hasD1&&!D.hasD6, '올릴 자리가 있는 분에게만 <b>단추가 선다</b>');
  is(!D.memberD7&&D.memberD1,
     '팀원에게는 <b>남의 고객</b> 단추가 안 선다 — 못 하는 일을 시키지 않는다 (내 고객에는 선다)');
  is(/→/.test(D.label)&&/TA/.test(D.label),
     '단추에 <b>어디로 가는지</b> 적혀 있다 — 「'+D.label.trim()+'」 (「→」 만 있으면 어디로 가는지 모른다)');
  is(D.sent.length===1&&D.sent[0].t==='dbs'&&D.sent[0].p.stage==='TA',
     '누르면 <b>그 단계만</b> 보낸다 — '+JSON.stringify((D.sent[0]||{}).p||{}));

  console.log('\n[5] 날짜가 필요한 단계는 <b>지어내지 않는다</b> (1번)');
  const E=await page.evaluate(()=>{
    const out={};
    const sent=[]; const realLoad=window.loadAll;
      /* ⚠ 진짜 supabase-js 는 <b>.select() 로 바뀐 줄을 돌려줍니다.</b>
         db-crm 이 「0줄인데 됐다고 말하던 것」 을 고치면서 쓰기 끝마다
         .select("id") 를 붙였습니다 — 가짜 서버가 진짜와 다르면 여기서
         터집니다(2026-09-21 CI 가 실제로 그렇게 잡았습니다). */
    sb={from:function(t){const a={update:function(p){sent.push({t:t,p:p});
      const c={eq:function(){return c},select:function(){return c},
        then:function(ok,no){return Promise.resolve({error:null,data:[{id:'x'}]}).then(ok,no)}};
      return c}};return a}};
    window.confirm=function(){return true};
    window.loadAll=function(){return Promise.resolve()};
    /* d4 는 PC → CS 라 날짜가 필요 없다. CS 로 올려 둔 뒤 CS → 계약완료 를 본다 */
    dbs.find(x=>x.id==='d4').stage='CS';
    return sgUp('d4').then(function(){
      out.sent=sent.slice();
      out.open=document.getElementById('dbModal').classList.contains('open');
      out.stage=document.getElementById('dbStage').value;
      out.wonOn=!document.getElementById('wonField').classList.contains('hidden');
      closeModal('dbModal');
      dbs.find(x=>x.id==='d4').stage='PC';
      window.loadAll=realLoad;
      return out;
    });
  });
  is(E.sent.length===0, '<b>바로 저장하지 않는다</b> — 계약일을 여기서 지어내면 안 된다');
  is(E.open&&E.stage==='계약완료', '<b>수정 창</b>을 열고 그 단계를 미리 골라 준다 — '+(E.stage||'안 골라짐'));
  is(E.wonOn, '<b>계약일 칸</b>이 서 있다 — 적으시고 저장하시면 됩니다');

  console.log('\n[6] 대시보드에도 <b>같은 길</b> — 모양은 한 곳에서만 만든다 (5번)');
  const F=await page.evaluate(()=>{
    goPage('dashboard');
    const out={};
    const st=[].slice.call(document.querySelectorAll('#sgDash .sg-step'));
    out.n=st.length;
    out.nums=st.map(x=>+(((x.querySelector('i')||{}).textContent)||0));
    out.names=st.map(x=>(x.querySelector('b')||{}).textContent||'');
    /* 대시보드는 <b>전체</b>를 본다 — DB 관리 거르개에 안 끌려간다 */
    const ta=st.filter(x=>((x.querySelector('b')||{}).textContent||'')==='TA')[0];
    if(ta)ta.click();
    out.page=(document.querySelector('.page.active')||{}).id||'';
    out.filt=document.getElementById('stageFilter').value;
    out.rows=document.querySelectorAll('#dbBody tr').length;
    document.getElementById('stageFilter').value=''; renderDb();
    return out;
  });
  is(F.n===11&&F.nums[0]===7, '대시보드에도 <b>같은 열한 칸</b>이 선다 — '+F.n+'칸 · 전체 '+F.nums[0]+'명');
  is(F.page==='page-db'&&F.filt==='TA'&&F.rows===2,
     '대시보드에서 누르면 <b>DB 관리로 데려가</b> 그 단계만 보여 준다 — '+F.page+' · '+F.rows+'명');
  const SRC=fs.readFileSync(path.join(ROOT,'db-crm.html'),'utf8');
  is((SRC.match(/function sgRailHtml\(/g)||[]).length===1&&
     /function sgRail\(\)\{[^\n]*sgRailHtml\(/.test(SRC)&&
     /function sgDash\(\)\{[^\n]*sgRailHtml\(/.test(SRC),
     '길 모양을 만드는 곳이 <b>하나</b>고, 두 화면이 그것을 부른다 (5번) — 따로 그리면 한쪽만 늙는다');
  is(/function stageNeeds\(/.test(SRC)&&
     /const k=stageNeeds\(s\)/.test(SRC)&&/k=stageNeeds\(st\)/.test(SRC),
     '계약일·증권일을 <b>어느 단계가 들고 있나</b>도 한 곳이다 — stageNeeds');

  console.log('\n[7] 서버를 안 부른다 (7번) · 손가락으로 누를 만하다');
  const G=await page.evaluate(()=>{
    let hits=0;
    sb={from:function(){hits++;return {select:function(){return this},
      eq:function(){return this},order:function(){return this},
      then:function(r){return Promise.resolve({data:[],error:null}).then(r)}}}};
    goPage('db'); renderDb(); sgDash();
    const st=[].slice.call(document.querySelectorAll('#sgRail .sg-step'));
    return { hits:hits, small:st.filter(x=>x.getBoundingClientRect().height<44).length,
             scroll:getComputedStyle(document.querySelector('#sgRail .sg-line')).overflowX };
  });
  is(G.hits===0, '길을 그리는 동안 <b>서버를 한 번도 안 부른다</b> — 이미 받아 둔 목록에서 센다 ('+G.hits+'번)');
  is(G.small===0, '칸이 <b>손가락으로 누를 만하다</b> — 44px 아래면 폰에서 빗나간다');
  is(G.scroll==='auto'||G.scroll==='scroll',
     '폰에서는 <b>옆으로 밀어</b> 본다 — 열한 칸을 줄바꿈하면 순서가 안 보인다');

  console.log('\n[8] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 단계가 아직 한눈에 안 보입니다')
                 :'✓ 단계가 한 줄 길로 서고, 그 자리에서 한 번에 올라갑니다.');
  process.exit(bad?1:0);
})();
