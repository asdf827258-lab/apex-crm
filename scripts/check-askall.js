/* ══════════════════════════════════════════════════════════════════
   check-askall.js — <b>사장님이 물으신 것이 화면에서 실제로 되는가.</b>

   2026-09-20 에 한 번에 일곱 가지를 물으셨습니다. 점검을 갈래마다 따로
   두었지만, <b>「물으신 것이 다 됐나」 를 한 장으로</b> 답하는 자리도
   있어야 합니다 — 갈래마다 초록인데 정작 시키신 것이 안 되는 일이
   실제로 있었습니다(담당자 줄이 2,040px 에 있어 「딱 보이게」 가 아니었던 것).

     ① 매일 하는 일이 달력에 <b>미리</b> 서고, 거기서 하면 체크된다
     ② 고객 365 담당자 분류가 <b>딱 보이게</b> — 첫 화면 안에
     ③ 홈에서도 <b>그 담당자 것만</b>
     ④ 팀원 화면을 따로 — <b>관리자는 자기 팀원 것</b>
     ⑤ 비포&애프터 대신 <b>보장분석 전&후 만들기</b>
     ⑥ 홈에서 단계를 <b>바로바로</b> · 통합CRM 에 반영
     ⑦ 홈에서 고객을 <b>넣고·고치고·지우기</b>

   ★ 「단추가 섰나」 가 아니라 <b>어느 표에 무엇을 썼나</b>와 <b>몇 px 에
     있나</b>를 봅니다. 화면만 보면 눌렀는데 아무 데도 안 쓰는 판과,
     있긴 한데 두 화면 아래 있는 판을 통과시킵니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8902;
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css'};
const srv=http.createServer((rq,rs)=>{let f=path.join(ROOT,decodeURIComponent(url.parse(rq.url).pathname));
 if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);rs.end();return;}
 rs.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/html; charset=utf-8'});fs.createReadStream(f).pipe(rs);});
const out=[]; const ok=(n,v,e)=>out.push({n,v:!!v,e:String(e==null?'':e).slice(0,110)});
const SEED=(role)=>`
 window.__W=[];
 OS.session={user:{id:'me'}};OS.profile={id:'me',name:'홍길동',role:'${role}',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'},{id:'t2',name:'2팀'}];
 GB.teamOf={me:'t1',u2:'t1',u3:'t2'};
 GB.rows=[{id:'me',name:'홍길동'},{id:'u2',name:'홍길순'},{id:'u3',name:'홍갑돌'}];
 var _e={};window.arRowOf=function(id){var m={me:'홍길동',u2:'홍길순',u3:'홍갑돌'};
   return m[id]?{id:id,name:m[id],sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'보장분석3DB',stage:'미접촉',days:9,n:0,res:'미진행',cAt:'',pAt:''},
        {id:'d2',who:'u2',name:'홍길순B',region:'천안',src:'일반',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
        {id:'d3',who:'u3',name:'홍갑돌C',region:'세종',src:'일반',stage:'AP',days:2,n:2,res:'상담',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];
 CM.loaded=true;CM.who={me:'홍길동',u2:'홍길순',u3:'홍갑돌'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=[{id:'c1',advisor_id:'me',name_masked:'홍○동',created_at:'2026-01-01'},
           {id:'c2',advisor_id:'u2',name_masked:'홍○순',created_at:'2026-01-02'}];
 window.cmLoadAll=function(cb){if(cb)cb();};
 /* 심어 둔 목록을 <b>다시 읽어 덮지 않게</b> 한다 — 여기서 재는 것은 읽기가 아니라 화면이다 */
 window.osLoadClients=function(){};
 window.osClient=function(){var mk=function(t){var st={t:t,op:'',pay:null,id:''};var a={
   update:function(p){st.op='update';st.pay=p;return a;},insert:function(p){st.op='insert';st.pay=p;return a;},
   upsert:function(p){st.op='upsert';st.pay=p;return a;},'delete':function(){st.op='delete';return a;},
   select:function(){st.sel=true;return a;},order:function(){return a;},range:function(){return a;},limit:function(){return a;},
   single:function(){return a;},gte:function(){return a;},'in':function(){return a;},is:function(){return a;},
   neq:function(){return a;},not:function(){return a;},eq:function(k,v){st.id=v;return a;},
   then:function(o,n){window.__W.push({t:st.t,op:st.op,id:st.id,pay:st.pay});
         /* ★ 진짜 서버처럼 <b>몇 줄을 바꿨는지</b> 돌려준다.
            Supabase 는 RLS 로 막힌 UPDATE·DELETE 를 <b>에러가 아니라 0줄</b>로
            돌려준다 — 여태 이 가짜 서버가 늘 빈 배열만 줘서, 앱이 「0줄인데
            됐다고 말하는」 병을 <b>한 번도 못 봤다</b>(2026-09-21).
            window.__RLS 를 켜면 그 자리를 그대로 만든다. */
         /* ★ <b>.select() 를 부른 쪽에만</b> 줄을 돌려준다 — 진짜 PostgREST
            가 그렇다. 안 부르면 data 가 없고, 그러면 「0줄」인지 「안 알려
            줌」인지 <b>구분할 수 없다</b>(1번). 여기서 늘 돌려주면 앱이
            .select() 를 빠뜨려도 점검이 초록이라 그대로 나간다 (8번). */
     if(st.op&&!st.sel)return Promise.resolve({error:null}).then(o,n);
     var rows=(!st.op)?[]:(window.__RLS?[]:[{id:st.id||'new-1'}]);
     return Promise.resolve({data:rows,error:null}).then(o,n);}};return a;};
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;
(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const mk=async(role)=>{
    const ctx=await b.newContext({viewport:{width:430,height:930}});
    await ctx.route('**://**',r=>r.request().url().indexOf('127.0.0.1:'+PORT)>=0?r.continue():r.abort());
    const p=await ctx.newPage(); const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,110)));
    await p.goto('http://127.0.0.1:'+PORT+'/app/index.html');await p.waitForTimeout(2400);
    await p.evaluate(()=>document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove()));
    await p.evaluate(SEED(role));await p.waitForTimeout(900);
    return {ctx,p,errs};
  };
  /* ── ① 매일 하는 일이 달력에 미리 · 체크 ── */
  {
    const {ctx,p}=await mk('member');
    await p.evaluate(()=>go('mycal'));await p.waitForTimeout(800);
    const a=await p.evaluate(()=>{const I=mcalItems(),ym=mcalYm();
      const last=new Date(Date.UTC(+ym.slice(0,4),+ym.slice(5,7),0)).getUTCDate();
      let n=0;for(let d=1;d<=last;d++){const ds=ym+'-'+('0'+d).slice(-2);
        if((I[ds]||[]).some(x=>x.k==='rt'))n++;}
      return {last,n,items:mrtItems().length};});
    ok('① 이 달 날마다 미리 서 있다',a.n===a.last,a.n+' / '+a.last+'일 · 하루 '+a.items+'가지');
    /* 달력에 아예 안 서 있으면 여기서 <b>터지지 말고</b> 빨간불이어야 한다 —
       터지면 「무엇이 틀렸는지」 대신 에러 글만 남는다 (8번) */
    await p.evaluate(()=>{try{mcalPick(mcalToday());mrtOpenSet(mcalToday());}catch(e){}});
    await p.waitForTimeout(500);
    const rows=await p.evaluate(()=>document.querySelectorAll('.mrt-it').length);
    ok('① 날을 누르면 그 자리에서 펴진다',rows>=5,rows+'줄');
    await p.evaluate(()=>{const x=document.querySelector('.mrt-it');if(x)x.click();});await p.waitForTimeout(500);
    const c=await p.evaluate(()=>({on:document.querySelectorAll('.mrt-it.on').length,
      store:localStorage.getItem('apex_ck_day_'+mcalToday()),ck:JSON.stringify(ckLoad('day')),
      hd:((document.querySelector('.mrt-hd')||{}).innerText||'(칸이 안 섰다)').replace(/\s+/g,' ').trim()}));
    ok('① 한 것이 체크로 남는다',c.on===1,c.hd.slice(0,24));
    ok('① 실행 체크판과 같은 자리에 담긴다',c.store===c.ck&&/"d1":1/.test(c.store||''),'달력 '+c.store+' = 체크판 '+c.ck);
    await ctx.close();
  }
  /* ── ② 고객 365 담당자 분류가 딱 보이게 ── */
  {
    const {ctx,p}=await mk('leader');
    await p.evaluate(()=>go('clients'));await p.waitForTimeout(1200);
    /* 진짜 앱에서는 목록이 실려 오면 osLoadClients 가 osRenderList 를 부른다.
       여기서는 읽기를 막아 두었으니 그 마지막 한 걸음만 손으로 밟는다. */
    await p.evaluate(()=>osRenderList());await p.waitForTimeout(400);
    const a=await p.evaluate(()=>{
      const w=document.querySelector('.cm-whos'),bd=document.getElementById('cli365Top');
      const nw=document.querySelector('.cm-wnow');
      return {has:!!w,n:document.querySelectorAll('.cm-whos').length,top:w?Math.round(w.getBoundingClientRect().top+scrollY):null,
        other:bd?Math.round(bd.getBoundingClientRect().top+scrollY):null,
        chips:w?[...w.querySelectorAll('.cm-sb')].map(x=>x.innerText.replace(/\s+/g,' ').trim()):[],
        now:nw?nw.innerText.replace(/\s+/g,' ').trim():''};});
    ok('② 담당자 줄이 선다',a.has&&a.chips.length>=2,a.chips.join(' | '));
    ok('② 담당자 줄은 한 줄뿐이다 (두 곳에 안 선다)',a.n===1,a.n+'줄');
    ok('② 첫 화면 안에 보인다 (딱 보이게)',a.has&&a.top<500,'담당자 '+a.top+'px · 화면 930px');
    ok('② 미션 카드보다 위에 있다',a.has&&a.other!==null&&a.top<a.other,'담당자 '+a.top+'px · 그 다음 칸 '+a.other+'px');
    ok('② 지금 누구 것인지 글자로 적는다',/담당자|보고 있습니다/.test(a.now),a.now.slice(0,60));
    await ctx.close();
  }
  /* ── ③④ 홈이 그 담당자 것만 · 팀원 화면 ── */
  for(const role of ['member','leader','branch_manager']){
    const {ctx,p}=await mk(role);
    const rd=()=>p.evaluate(()=>({bar:!!document.querySelector('.hwho'),
      chips:[...document.querySelectorAll('.hwho-c')].map(x=>x.innerText.replace(/\s+/g,' ').trim()),
      other:!!document.querySelector('.hwho.other'),back:!!document.querySelector('.hwho-back'),
      steps:hmSteps().map(x=>x.t),say:((document.querySelector('.hwho-now')||{}).innerText||'').replace(/\s+/g,' ').trim()}));
    const a=await rd();
    if(role==='member'){
      ok('③ 설계사 — 고르개가 안 선다',!a.bar,'띠 '+a.bar);
      ok('③ 설계사 — 자기 것만',a.steps.join()==='홍길동A,홍○동',a.steps.join(' · '));
    }else{
      ok('③ '+role+' — 처음엔 내 것만',a.steps.join()==='홍길동A,홍○동',a.steps.join(' · '));
      ok('④ '+role+' — 팀원 고르개가 선다',a.bar&&a.chips.length>=2,a.chips.join(' | '));
      if(role==='leader')
        ok('④ 지점장 — 남의 팀(홍갑돌)은 안 뜬다',!a.chips.some(x=>/홍갑돌/.test(x)),a.chips.join(' | '));
      if(role==='branch_manager')
        ok('④ 본부장 — 팀 밖(홍갑돌)도 보인다',a.chips.some(x=>/홍갑돌/.test(x)),a.chips.join(' | '));
      await p.evaluate(()=>hwhoSet('u2'));await p.waitForTimeout(600);
      const s=await rd();
      ok('④ '+role+' — 그 팀원 것으로 바뀐다',s.steps.join()==='홍길순B,홍○순',s.steps.join(' · '));
      ok('④ '+role+' — 내 것이 아니라고 적는다',s.other&&s.back&&/내 것이 아닙니다/.test(s.say),s.say.slice(0,52));
      await p.evaluate(()=>hwhoMe());await p.waitForTimeout(500);
      const t=await rd();
      ok('④ '+role+' — 한 번에 내 화면으로',t.steps.join()==='홍길동A,홍○동'&&!t.other,t.steps.join(' · '));
    }
    await ctx.close();
  }
  /* ── ④-2 <b>내 배정이 0건인 대표</b> ────────────────────────────────
     2026-09-21 — 진짜 데이터에서 대표 한 계정에 배정된 DB 가 <b>0건</b>
     이었습니다. 그러면 고르개 명단에 팀원 한 사람만 남아 <b>띠가 통째로
     사라지고</b>, 홈은 「오늘 챙길 것이 없습니다」 만 띄운 채 팀원 화면으로
     <b>건너갈 길이 없었습니다</b> — ④가 <b>0건인 날에만 말없이</b> 안 되던
     자리입니다. 위의 ③④ 는 언제나 내 것을 한 줄 심어 두고 재서 못 봤습니다.
     안 울리는 알람은 알람이 아닙니다 (8번).                            */
  {
    const {ctx,p}=await mk('branch_manager');
    /* 내 것만 걷어 낸다 — <b>다른 건 그대로</b>. 0 은 「모른다」가 아니라
       「오늘은 없다」 이므로 화면은 그대로 서야 한다 (1번). */
    /* 팀원도 <b>한 사람만</b> 남긴다 — 그래야 명단이 한 줄이 되고, 내가
       빠지면 L.length<2 로 <b>띠가 통째로 사라지던</b> 그 자리가 된다.
       둘을 남겨 두면 띠는 그대로 서서 <b>안 울리는 알람</b>이 된다 (8번). */
    await p.evaluate(()=>{ AR.db=AR.db.filter(x=>x.who==='u2');
                           OSC.list=OSC.list.filter(x=>x.advisor_id==='u2');
                           hmPaint(); });
    await p.waitForTimeout(700);
    const z=await p.evaluate(()=>({bar:!!document.querySelector('.hwho'),
      chips:[...document.querySelectorAll('.hwho-c')].map(x=>x.innerText.replace(/\s+/g,' ').trim()),
      steps:hmSteps().map(x=>x.t),
      me:(hwhoList().filter(x=>x.id==='me')[0]||{}).n}));
    ok('④ 내 배정이 0건이어도 <b>고르개가 선다</b>',z.bar&&z.chips.length>=2,z.chips.join(' | '));
    ok('④ 0건인 내 이름도 <b>명단에 남는다</b> — 0 은 「오늘은 없다」다',z.me===0,'내 건수 '+z.me);
    ok('④ 0건이라고 <b>남의 것을 대신 세우지 않는다</b>',z.steps.length===0,z.steps.join(' · ')||'(비어 있음)');
    /* 0 인 까닭이 둘이다 — 「오늘은 없다」 와 「나한테는 배정이 없다」.
       뒤엣것에 「주기가 돌아오면 뜹니다」 라고만 하면 <b>영영 안 뜹니다</b> (1번) */
    const z1=await p.evaluate(()=>((document.querySelector('.hm-sub')||
      document.querySelector('.hm-card')||{}).innerText||'').replace(/\s+/g,' '));
    ok('④ 0건이면 <b>무엇을 하면 되는지</b> 적는다 — 「주기가 돌아오면」 으로 끝내지 않는다',
       /배정된 분이 오늘은 없습니다/.test(z1)&&/팀원/.test(z1),
       (z1.match(/내게 배정된[^.]*\./)||[''])[0].slice(0,70));
    await p.evaluate(()=>hwhoSet('u2'));await p.waitForTimeout(700);
    const z2=await p.evaluate(()=>({steps:hmSteps().map(x=>x.t),
      back:!!document.querySelector('.hwho-back')}));
    ok('④ 0건이어도 <b>팀원 화면으로 건너간다</b>',z2.steps.join()==='홍길순B,홍○순'&&z2.back,z2.steps.join(' · '));
    await ctx.close();
  }
  /* ── ⑤ 비포&애프터 → 전&후 만들기 ── */
  {
    const {ctx,p}=await mk('member');
    const a=await p.evaluate(()=>{
      let w1='',w2='';const g=window.go;
      window.go=function(t){w1=t;};oscBaGo();
      window.go=function(t){w2=t;};frOpenBaba();window.go=g;
      const tl=s=>(APEX_STAGE.map[s].tools||[]);
      return {oscBaGo:w1,frOpenBaba:w2,PC:tl('PC'),CS:tl('CS'),won:tl('계약완료'),AP:tl('AP'),
        anyBaba:['미접촉','부재','거절','TA','AP','PC','CS','계약완료','증권전달','소개완료']
          .filter(s=>(APEX_STAGE.map[s].tools||[]).indexOf('baba')>=0),
        babaAlive:typeof osTabAllowed==='function'};});
    ok('⑤ 고객 카드에서 여는 곳',a.oscBaGo==='frmake',a.oscBaGo);
    ok('⑤ 풀리포트에서 여는 곳',a.frOpenBaba==='frmake',a.frOpenBaba);
    ok('⑤ 단계 도구에 비포&애프터가 없다',a.anyBaba.length===0,'PC '+a.PC.join(',')+' · CS '+a.CS.join(',')+' · 계약완료 '+a.won.join(','));
    const alive=await p.evaluate(()=>{let w='';const g=window.go;window.go=function(t){w=t;};
      try{go('baba');}catch(e){}window.go=g;return typeof navItemOf==='function'&&!!navItemOf('baba');});
    ok('⑤ 그래도 baba 화면은 살아 있다 (옛 자료)',alive,'navItemOf(baba) 있음');
    await ctx.close();
  }
  /* ── ⑥⑦ 홈에서 단계 · 고객 넣고 고치고 지우기 ── */
  {
    const {ctx,p}=await mk('member');
    const W=()=>p.evaluate(()=>{const w=window.__W.slice();window.__W=[];return w;});
    await W();
    const strip=await p.evaluate(()=>{const e=document.querySelector('.hdb');
      return e?[...e.querySelectorAll('.hdb-b')].map(x=>x.innerText.trim()):null;});
    ok('⑥ 홈에 단계 줄이 선다',!!strip&&strip.length>=4,(strip||[]).join(' | '));
    await p.evaluate(()=>hdbUp('d1'));await p.waitForTimeout(450);
    const w1=await W();
    ok('⑥ 단계가 dbs 에 저장된다 (CRM 이 읽는 표)',
       w1.length===1&&w1[0].t==='dbs'&&w1[0].pay&&w1[0].pay.stage==='TA',JSON.stringify(w1.map(x=>x.t+'.'+x.op+' '+JSON.stringify(x.pay))));
    await p.evaluate(()=>hdbCall('d1','부재'));await p.waitForTimeout(450);
    const w2=await W();
    ok('⑥ 통화가 calls 에 들어간다 (접촉 n/5 가 세는 표)',
       w2.length===1&&w2[0].t==='calls'&&w2[0].pay.result==='부재',JSON.stringify(w2.map(x=>x.t+'.'+x.op)));
    await p.evaluate(()=>{const b=[...document.querySelectorAll('.hm-cal')].find(x=>/고객 넣기/.test(x.innerText));if(b)b.click();});
    await p.waitForTimeout(450);
    const opened=await p.evaluate(()=>!!document.querySelector('#hdbSheet.on'));
    ok('⑦ 홈에서 「고객 넣기」 가 홈을 안 벗어나고 뜬다',opened,'덮개 '+opened);
    await p.evaluate(()=>{document.getElementById('hdbName').value='홍길동새';});
    await p.evaluate(()=>hdbSave());await p.waitForTimeout(600);
    const w3=(await W()).filter(x=>x.t==='dbs');
    ok('⑦ 새 고객이 dbs 에 들어간다',w3.length===1&&w3[0].op==='insert'&&w3[0].pay.customer_name==='홍길동새',
       JSON.stringify(w3[0]&&{name:w3[0].pay.customer_name,who:w3[0].pay.assigned_to,got:w3[0].pay.assigned_date}));
    await p.evaluate(()=>hdbOpen('d1',''));await p.waitForTimeout(350);
    await p.evaluate(()=>{document.getElementById('hdbRegion').value='광주';});
    await p.evaluate(()=>hdbSave());await p.waitForTimeout(500);
    const w4=(await W()).filter(x=>x.t==='dbs');
    ok('⑦ 고친 것이 저장된다',w4.length===1&&w4[0].op==='update'&&w4[0].pay.region==='광주',JSON.stringify(w4[0]&&w4[0].pay.region));
    await p.evaluate(()=>hdbOpen('d1',''));await p.waitForTimeout(300);
    await p.evaluate(()=>hdbDel('d1'));await p.waitForTimeout(500);
    const w5=(await W()).filter(x=>x.t==='dbs');
    ok('⑦ 지우면 dbs 에서 지운다',w5.length===1&&w5[0].op==='delete',JSON.stringify(w5.map(x=>x.op)));
    await p.evaluate(()=>hdbUp('d2'));await p.waitForTimeout(400);
    const w6=await W();
    ok('⑥⑦ 남의 고객은 아무것도 안 나간다',w6.length===0,'나간 글 '+w6.length+'건 · '+(await p.evaluate(()=>window.__T||'')).slice(0,30));
    await ctx.close();
  }
  await b.close();srv.close();

  const bad=out.filter(function(r){return !r.v;});
  out.forEach(function(r){ console.log((r.v?'  \u2713 ':'  \u2717 ')+r.n+(r.e?('  \u2014  '+r.e):'')); });
  console.log('');
  console.log(bad.length
    ? ('\u2717 \uc0ac\uc7a5\ub2d8\uc774 \ubb3c\uc73c\uc2e0 \uac83 \u2014 '+bad.length+'\uc790\ub9ac \uc5b4\uae0b\ub0a9\ub2c8\ub2e4')
    : ('\u2713 \uc0ac\uc7a5\ub2d8\uc774 \ubb3c\uc73c\uc2e0 \uc77c\uacf1 \uac00\uc9c0\uac00 \ud654\uba74\uc5d0\uc11c \uc2e4\uc81c\ub85c \ub429\ub2c8\ub2e4 \u2014 '+out.length+'\uc790\ub9ac'));
  process.exit(bad.length?1:0);
})().catch(function(e){ console.error(e); process.exit(1); });
