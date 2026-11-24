/* 📈 90일 아카데미 — 팀원이 안 넣어도 돌아가게 (판 X552)

   사장님 말씀 2026-11-24 「팀원들의 레벨을 어떻게 스스로 체크할지가 중요해
   팀원들 스스로가 체크를 안하거든」 → 「메인세션 90일 로드맵과 연결해서」 →
   「응, 1단계부터」 → 「2단계도 같이, 다만 편히 볼수있게 어려운 단어들을 최대한
   쉽게 교육도 매일 알람을 띄어줘 오늘 이거 공부해보자고! 딱 하고 싶게 5분 공부」.

   90일 아카데미(index.html · AC_ROAD · AC_WEEKS)는 네 가지를 <b>본인이 넣어야</b>
   돌았습니다 — ① 시작일 ② 주간 퍼널 숫자 ③ 12주 체크 ④ 공부 완료.

   1단계 ① 시작일 — 본인이 넣은 날이 없으면 <b>팀에 들어온 날</b>(team_members.joined_at).
            고친 날이 이기고, 팀 기록이 없으면 <b>짐작하지 않습니다</b>.
         ② 이번 주 숫자 — 손 입력 네 칸을 걷고 CRM 기록에서 셉니다 (ac9Stat 한 곳).
   2단계 ③ 판정 — 기록만 보고 신호 넷 중 하나 (ac9Judge 한 곳)
              기록 없음 · 아직 앞 단계 · 새는 곳(팀 가운데값보다 낮음) · 잘 가는 중
         ④ 리더 「팀 성장표」 — 팀원마다 그 판정 + 이번 주 한 가지 + 5분 공부 날 수
         ⑤ 「오늘 5분 공부」 — 판정이 고른 주제 하나, 홈에 하루 한 번 알림 시트,
            「다 했어요」 는 daily_checks(scope 'study5')에 한 줄 → 리더가 봄

   ★ 쉬운 말 — 화면에는 TD·TA·AP·PC 대신 「전화 건 분 · 통화된 분 · 만남 약속 ·
     계약」 을 쓰고, 교재 낱말은 옆에 작게만 붙입니다(교재와 이어 읽게). 낱말 표는
     PLAIN 한 곳입니다.
   ★ 셈 규칙
       전화 건 분 = 그 기간에 내가 건 DB · 통화된 분 = 결과가 부재가 아닌 DB
       만남 약속 = 결과 「상담」 · 계약 = 계약완료일 · 증권 전달 = 증권전달일
       제안까지 간 분·소개 받은 분 = <b>지금 단계</b>(날짜 칸이 없어 기간으로 못 끊음)
       비율은 아래 수가 <b>5명 이상</b>일 때만 판정에 씁니다(MIN). 팀 가운데값은
       그 비율을 가진 사람이 <b>3명 이상</b>일 때만 — 모자라면 「새는 곳」 을
       말하지 않고 「다음에 키울 곳」 으로만 적습니다 (1번).
     ⚠ MIN·3명 은 처음 정한 값입니다 — 사장님이 기준을 정하시면 여기만 고칩니다.
   ★ 몸은 index.html 의 ac* 함수를 <b>감싸기만</b> 합니다. 재는 자 check-ac90auto.js. */
(function(){
  if(typeof acStart!=='function'||typeof acRunView!=='function')return;

  var MIN=5,TEAM_N=3;
  var AC9={join:'',tried:false,busy:false,none:false,retry:0,arWait:0,
           team:null,teamBusy:false,timer:null,left:0};
  window.AC9=AC9;

  function pd(n){return (n<10?'0':'')+n;}
  function ymd(d){return d.getFullYear()+'-'+pd(d.getMonth()+1)+'-'+pd(d.getDate());}
  function ymdD(s){var a=(''+s).split('-');return new Date(+a[0],+a[1]-1,+a[2]);}
  function addDays(s,n){var d=ymdD(s);d.setDate(d.getDate()+n);return ymd(d);}
  function today(){return ymd(new Date());}
  function dayNo(s){return Math.round(ymdD(s).getTime()/86400000);}
  function me(){return (typeof arMyId==='function')?arMyId():null;}
  function shown(){return !!document.getElementById('acadBody');}
  function repaint(){var b=document.getElementById('acadBody');if(b&&typeof acBody==='function')b.innerHTML=acBody();}
  function esc(s){return (typeof osEsc==='function')?osEsc(s):(''+s);}
  function lead(){return (typeof gbIsLead==='function')?gbIsLead():false;}
  function ls(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null;}localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}}

  /* ── 쉬운 말 — 한 곳 ── */
  var PLAIN=[[/\bTD\b/g,'전화 걸기(TD)'],[/\bTA\b/g,'전화로 약속 잡기(TA)'],[/\bAP\b/g,'만나서 듣기(AP)'],
             [/\bPC\b/g,'제안하기(PC)'],[/\bCS\b/g,'계약 마무리(CS)'],[/\bRL\b/g,'소개 받기(RL)'],
             [/팩트파인딩/g,'고객 이야기 듣기'],[/클로징/g,'결정 여쭙기'],[/풀컨셉/g,'전체 그림'],[/병목/g,'막히는 곳']];
  function plain(s){s=''+(s||'');for(var i=0;i<PLAIN.length;i++)s=s.replace(PLAIN[i][0],PLAIN[i][1]);return s;}
  window.ac9Plain=plain;

  /* 90일 일곱 구간을 쉬운 말로 — AC_ROAD 와 같은 차례. need = 그 구간에 있어야 할 기록 */
  var SEG=[
    {name:'나를 알고 고객 고르기',need:'call'},
    {name:'전화로 만남 잡기',need:'meet'},
    {name:'보장 이야기 나누기',need:'meet'},
    {name:'저축 이야기 나누기',need:'meet'},
    {name:'돈 지도 그려 제안하기',need:'prop'},
    {name:'계약하고 소개 받기',need:'won'},
    {name:'계약하고 졸업하기',need:'won'},
    {name:'혼자 굴러가기 (90일 지남)',need:'won'}
  ];
  var NEED={call:'전화 기록',meet:'만남 약속',prop:'제안까지 간 분',won:'계약'};
  var RATE=[
    {k:'pick', name:'받는 비율', a:'talk',b:'call',say:'전화를 받으시는 비율',   edu:'TD → TA'},
    {k:'meet', name:'약속 비율', a:'meet',b:'talk',say:'통화가 만남으로 이어지는 비율',edu:'TA → AP'},
    {k:'close',name:'계약 비율', a:'won', b:'meet',say:'만남이 계약으로 이어지는 비율',edu:'AP → 계약'}
  ];

  /* ── 오늘 5분 — 주제 표 (모두 앱 안에 있는 화면으로 이어집니다) ── */
  var TOP={
    rec:  {emo:'📝',title:'통화 결과, 30초 만에 남기기',why:'기록이 있어야 앱이 대신 챙겨 줄 수 있어요.',
           steps:['DB 통합 CRM을 열어요','오늘 건 전화마다 결과(안 받음·거절·상담)를 눌러요','다음에 연락할 날을 하나 적어요'],go:'crm',btn:'DB 통합 CRM 열기'},
    pick: {emo:'📵',title:'안 받으시는 분께 보낼 문자 한 줄',why:'전화를 받으시는 비율을 올리는 가장 쉬운 방법이에요.',
           steps:['「보낼 말 모음」에서 부재 문자를 찾아요','내 말투로 한 줄만 고쳐 봐요','오늘 안 받으신 분 한 분께 보내 봐요'],go:'saybook',btn:'보낼 말 모음 열기'},
    meet: {emo:'📞',title:'거절을 만남 약속으로 바꾸는 한마디',why:'통화는 되는데 만남으로 잘 안 이어질 때 연습해요.',
           steps:['「TA 전체 대본」에서 거절이 나오는 대목을 골라요','소리 내어 세 번 따라 읽어요','내일 첫 통화에서 그대로 써 봐요'],go:'ta_say',btn:'TA 전체 대본 열기'},
    gym:  {emo:'🥊',title:'거절 근육 하루치',why:'거절이 덜 무서워지면 전화가 쉬워져요.',
           steps:['「거절 근육 훈련」에서 오늘 차례를 열어요','나오는 거절에 소리 내어 답해 봐요','제일 막힌 한마디를 메모해 둬요'],go:'rej_gym',btn:'거절 근육 훈련 열기'},
    close:{emo:'🤝',title:'결정을 부드럽게 여쭙는 말',why:'만남이 계약으로 이어지지 않을 때 연습해요.',
           steps:['「재무설계 실전화법서」에서 결정·마무리 대목을 골라요','고객이 망설일 때 할 말을 한 줄 적어요','다음 만남 전에 한 번 소리 내어 말해 봐요'],go:'fp_talk',btn:'실전화법서 열기'}
  };
  var TOP_OF={pick:'pick',meet:'meet',close:'close',call:'rec',prop:'close',won:'close'};
  var MINS=['1분','3분','1분'];

  /* ── ① 팀에 들어온 날 ── */
  function ac9LoadJoin(){
    if(AC9.tried||AC9.busy)return;
    var sb=(typeof osClient==='function')?osClient():null,uid=me();
    if(!sb||!uid){
      if(AC9.retry<12&&shown()){AC9.retry++;setTimeout(ac9LoadJoin,800);}
      return;
    }
    AC9.busy=true;
    var done=function(v){
      AC9.busy=false;AC9.tried=true;
      AC9.join=v||'';AC9.none=!v;
      if(v&&!acLoadProg().start&&typeof AC!=='undefined'){AC.data=null;if(typeof acCrmLoad==='function')acCrmLoad();}
      if(shown())repaint();
    };
    try{
      sb.from('team_members').select('joined_at').eq('member_id',uid)
        .order('joined_at',{ascending:true}).limit(1)
        .then(function(r){
          var x=(r&&!r.error&&r.data&&r.data[0])?r.data[0].joined_at:'';
          var d=x?new Date(x):null;
          done(d&&!isNaN(d.getTime())?ymd(d):'');
        },function(){done('');});
    }catch(e){done('');}
  }
  window.ac9LoadJoin=ac9LoadJoin;

  acStart=function(){var p=acLoadProg();return p.start||AC9.join||'';};
  window.acStartSrc=function(){var p=acLoadProg();return p.start?'mine':(AC9.join?'team':'');};

  var oldRender=renderAcademy;
  renderAcademy=function(){ac9Css();ac9LoadJoin();return oldRender.apply(this,arguments);};

  function srcNote(){
    var s=acStartSrc(),p=acLoadProg(),h='';
    if(s==='team')
      h='시작일은 <b>팀에 들어온 날('+esc(AC9.join)+')</b>로 자동으로 정했어요. 따로 넣을 것은 없어요.';
    else if(s==='mine')
      h='시작일은 <b>직접 고친 날('+esc(p.start)+')</b>이에요 — 이 기기에만 남아요.'+
        (AC9.join&&AC9.join!==p.start?' <button class="acad-tool" onclick="acSetStart(\'\')">팀에 들어온 날('+esc(AC9.join)+')로 되돌리기</button>':'');
    else if(AC9.busy||!AC9.tried)
      h='팀에 들어온 날을 찾는 중이에요…';
    else
      h='팀에 들어온 기록이 없어 <b>시작일을 정하지 못했어요</b>. 리더에게 팀 등록을 부탁하거나 아래에 날짜를 넣어 주세요.';
    return '<div class="acad-note" style="margin-bottom:10px">📅 '+h+'</div>';
  }

  /* ── ② 셈 — 한 곳 ── */
  var WON_ST={'PC':1,'CS':1,'계약완료':1,'증권전달':1,'소개완료':1};
  function ac9Stat(who,from,to){
    var L=(typeof AR!=='undefined'&&AR.calls)||[],D=(typeof AR!=='undefined'&&AR.db)||[];
    var dial={},conn={},appt={},i,c,r,oldest='';
    var o={call:0,talk:0,meet:0,won:0,sent:0,prop:0,intro:0,cut:false,noDate:false};
    for(i=0;i<L.length;i++){
      c=L[i];
      if(c.d&&(!oldest||c.d<oldest))oldest=c.d;
      if(c.w!==who||!c.b||!c.d||c.d<from||c.d>to)continue;
      dial[c.b]=1;
      if(c.r&&c.r!=='부재')conn[c.b]=1;
      if(c.r==='상담')appt[c.b]=1;
    }
    o.call=Object.keys(dial).length;o.talk=Object.keys(conn).length;o.meet=Object.keys(appt).length;
    for(i=0;i<D.length;i++){
      r=D[i];if(r.who!==who)continue;
      if(r.cAt&&r.cAt>=from&&r.cAt<=to)o.won++;
      if(r.pAt&&r.pAt>=from&&r.pAt<=to)o.sent++;
      if(WON_ST[r.stage])o.prop++;
      if(r.stage==='소개완료')o.intro++;
    }
    o.cut=!!(typeof AR!=='undefined'&&AR.callsCut&&oldest&&from<oldest);
    o.noDate=!!(typeof AR!=='undefined'&&AR.noStage);
    return o;
  }
  /* 1단계 이름 그대로 — 예전 점검·다른 곳이 부르는 이름 */
  function ac9Fun(from,to){
    var s=ac9Stat(me(),from,to);
    return {td:s.call,ta:s.talk,ap:s.meet,pc:s.won,rl:s.sent,cut:s.cut,noDate:s.noDate};
  }
  window.ac9Stat=ac9Stat;window.ac9Fun=ac9Fun;

  function ac9Win(wk){
    var s=acStart();
    if(!s){var t=today();return {from:addDays(t,-6),to:t,label:'최근 7일'};}
    var f=addDays(s,(wk-1)*7);
    return {from:f,to:addDays(f,6),label:wk+'주차'};
  }
  window.ac9Win=ac9Win;

  /* ── ③ 판정 — 한 곳 ── */
  function rateOf(s,R){return s[R.b]>=MIN?Math.round(s[R.a]/s[R.b]*100):null;}
  function ac9Mid(){
    /* 팀 가운데값 — 기록이 읽히는 사람들끼리. 3명이 안 되면 모른다 */
    var L=(typeof AR!=='undefined'&&AR.calls)||[],who={},i,t=today(),from=addDays(t,-29),out={};
    for(i=0;i<L.length;i++)if(L[i].w)who[L[i].w]=1;
    var st=Object.keys(who).map(function(w){return ac9Stat(w,from,t);});
    RATE.forEach(function(R){
      var v=[];
      st.forEach(function(s){var x=rateOf(s,R);if(x!==null)v.push(x);});
      if(v.length<TEAM_N){out[R.k]=null;return;}
      v.sort(function(a,b){return a-b;});
      var m=v.length>>1;out[R.k]=v.length%2?v[m]:Math.round((v[m-1]+v[m])/2);
    });
    return out;
  }
  function ac9Judge(who,start,mid){
    var t=today(),from=addDays(t,-29),s=ac9Stat(who,from,t);
    var day=start?Math.max(0,dayNo(t)-dayNo(start)+1):0;
    var seg=!start?-1:(day>90?7:acRoadIdx(day));
    var J={who:who,day:day,seg:seg,segName:seg>=0?SEG[seg].name:'',s:s,sig:'',head:'',why:'',topic:'',weak:null};
    if(!s.call){
      J.sig='none';J.head='최근 30일 기록이 없어요';
      J.why='CRM에 남긴 통화가 없어서 앱이 판정할 수 없어요. 통화 결과부터 남겨요.';J.topic='rec';return J;
    }
    var need=seg>=0?SEG[seg].need:'call';
    if(!s[need]&&!(need==='prop'&&s.won)){
      J.sig='stuck';J.head='아직 「'+NEED[need]+'」 전이에요';
      J.why=(seg>=0?'지금은 「'+SEG[seg].name+'」 때인데, 최근 30일에 '+NEED[need]+' 기록이 없어요.':'');
      J.topic=TOP_OF[need];return J;
    }
    var worst=null,gap=0,low=null,lowV=101;
    RATE.forEach(function(R){
      var x=rateOf(s,R);if(x===null)return;
      if(x<lowV){lowV=x;low={R:R,v:x};}
      var m=mid&&mid[R.k];
      if(m!==null&&m!==undefined&&x<m&&(m-x)>gap){gap=m-x;worst={R:R,v:x,m:m};}
    });
    if(worst){
      J.sig='leak';J.weak=worst;J.head='「'+worst.R.name+'」에서 새요';
      J.why=worst.R.say+'이 '+worst.v+'%로, 팀 가운데('+worst.m+'%)보다 낮아요.';J.topic=worst.R.k;return J;
    }
    J.sig='good';J.head='잘 가고 있어요';J.weak=low;
    J.why=low?('다음에 키울 곳은 「'+low.R.name+'」('+low.v+'%)예요.'+(mid&&mid[low.R.k]==null?' 팀 비교는 아직 사람이 모자라 못 해요.':'')):
              '비율을 말하기엔 아직 숫자가 적어요(5명 이상부터).';
    J.topic=low?low.R.k:'';
    return J;
  }
  window.ac9Judge=ac9Judge;window.ac9Mid=ac9Mid;

  var SIG={none:['기록 없음','a9-s-none'],stuck:['아직 앞 단계','a9-s-stuck'],leak:['새는 곳','a9-s-leak'],good:['잘 가는 중','a9-s-good']};
  function pill(sig){var x=SIG[sig]||['','a9-s-none'];return '<span class="a9-pill '+x[1]+'">'+x[0]+'</span>';}

  /* 오늘 주제 — 약한 곳이 있으면 사흘 중 이틀은 그 주제, 하루는 이번 주 커리큘럼.
     잘 가는 중이면 이번 주 커리큘럼. (판정 카드와 5분 주제가 서로 딴말하지 않게) */
  function weekTopic(){
    var info=acDayInfo(),w=(typeof acWeekById==='function')?acWeekById(info.set?info.week:1):null;
    if(!w)return null;
    var n=dayNo(today()),todo=(w.todo&&w.todo.length)?w.todo[n%w.todo.length]:'';
    return {id:'w'+w.n,emo:'📘',title:plain(w.topic),why:'이번 주 커리큘럼('+w.n+'주차) 차례예요 — 오늘의 기준: '+plain(w.criterion),
            steps:[plain(w.study)+' — 읽어 보기',plain(todo)||'오늘 할 일 하나 해 보기','오늘의 기준을 소리 내어 말해 보기'],
            go:(w.tools&&w.tools[0])?w.tools[0][0]:'academy',btn:(w.tools&&w.tools[0])?(w.tools[0][2]+' 열기'):'이번 주 보기'};
  }
  function ac9Topic(J){
    var n=dayNo(today()),k=J?J.topic:'';
    if(k==='meet'&&n%3===2)k='gym';
    var wt=weekTopic();
    if(wt&&(!k||J.sig==='good'||n%3===0))return wt;
    var t=TOP[k]||TOP.rec,o={};for(var x in t)o[x]=t[x];o.id=k||'rec';
    return o;
  }
  window.ac9Topic=ac9Topic;

  /* ── 5분 기록 — 이 기기 + 서버 한 줄(리더가 봄) ── */
  function fiveLog(){return ls('apex_ac9_five')||{};}
  function fiveDone(d){return !!fiveLog()[d||today()];}
  function streak(){
    var L=fiveLog(),n=0,d=today();
    if(!L[d])d=addDays(d,-1);
    while(L[d]){n++;d=addDays(d,-1);}
    return n;
  }
  window.ac9FiveDone=function(id){
    var L=fiveLog(),t=today();L[t]=id||'1';ls('apex_ac9_five',L);
    if(AC9.timer){clearInterval(AC9.timer);AC9.timer=null;}
    var sb=(typeof osClient==='function')?osClient():null,uid=me();
    if(sb&&uid){
      try{
        sb.from('daily_checks').upsert({member_id:uid,check_date:t,scope:'study5',
          items:{t:id||'',at:new Date().toISOString()},updated_at:new Date().toISOString()},
          {onConflict:'member_id,check_date,scope'}).then(function(){},function(){});
      }catch(e){}
    }
    if(typeof toast==='function')toast('오늘 5분 끝! 🔥 '+streak()+'일째 이어가는 중');
    a9SheetClose();
    if(shown())repaint();
  };
  window.ac9Timer=function(){
    if(AC9.timer)return;
    AC9.left=300;
    var tick=function(){
      var el=document.getElementById('a9Clock');
      if(!el){clearInterval(AC9.timer);AC9.timer=null;return;}
      el.textContent=pd(Math.floor(AC9.left/60))+':'+pd(AC9.left%60);
      if(AC9.left<=0){clearInterval(AC9.timer);AC9.timer=null;el.textContent='5분 끝! 「다 했어요」 눌러 주세요';return;}
      AC9.left--;
    };
    tick();AC9.timer=setInterval(tick,1000);
  };
  function weekDots(){
    var L=fiveLog(),h='',i,d;
    for(i=6;i>=0;i--){d=addDays(today(),-i);
      h+='<span class="a9-dot'+(L[d]?' on':'')+'" title="'+d+'">'+['일','월','화','수','목','금','토'][ymdD(d).getDay()]+'</span>';}
    return '<div class="a9-dots">'+h+'</div>';
  }

  /* ── 화면 — 판정 카드(대시보드 맨 위) ── */
  function arReady(){
    if(typeof AR==='undefined')return false;
    if(AR.loaded)return true;
    if(AR.busy!=='load'&&typeof arLoad==='function'&&me())arLoad();
    AC9.arWait=0;setTimeout(waitAr,700);
    return false;
  }
  function waitAr(){
    if(typeof AR==='undefined')return;
    if(AR.loaded){AC9.arWait=0;if(shown())repaint();return;}
    if(AC9.arWait++<45)setTimeout(waitAr,700);
  }
  function judgeCard(){
    if(!me())return '';
    if(!arReady())return '<div class="acad-note" style="margin-bottom:10px">내 CRM 기록을 읽는 중이에요…</div>';
    var J=ac9Judge(me(),acStart(),ac9Mid()),s=J.s,T=ac9Topic(J);
    var cells=[['전화 건 분',s.call,'TD'],['통화된 분',s.talk,'TA'],['만남 약속',s.meet,'AP'],
               ['계약',s.noDate?'—':s.won,'PC·CS'],['소개 받음',s.noDate?'—':s.intro,'RL']];
    var row='';cells.forEach(function(c){row+='<div class="a9-cell"><b>'+c[1]+'</b><span>'+c[0]+'</span><i>'+c[2]+'</i></div>';});
    return '<div class="a9-card">'+
      '<div class="a9-top">'+pill(J.sig)+'<span class="a9-when">'+(J.day?('DAY '+J.day+' · '+esc(J.segName)):'시작일을 정하면 시기도 알려 줘요')+'</span></div>'+
      '<div class="a9-head">'+esc(J.head)+'</div>'+
      '<div class="a9-why">'+esc(J.why)+'</div>'+
      '<div class="a9-cells">'+row+'</div>'+
      '<button class="a9-go" onclick="acGo(\'five\')">⏱ 오늘 5분 — '+esc(T.title)+'</button>'+
      '<div class="a9-src">근거: 최근 30일 DB 통합 CRM 기록 · 팀에 들어온 날. 따로 체크할 것은 없어요.</div>'+
    '</div>';
  }

  var oldDash=acDashView;
  acDashView=function(){return judgeCard()+srcNote()+oldDash.apply(this,arguments);};

  /* ── 화면 — 오늘 5분 ── */
  function fiveView(){
    var J=(me()&&typeof AR!=='undefined'&&AR.loaded)?ac9Judge(me(),acStart(),ac9Mid()):null;
    if(me()&&!J)arReady();
    var T=ac9Topic(J),done=fiveDone(),st=streak(),h='';
    h+='<div class="a9-card a9-five">'+
      '<div class="a9-top"><span class="a9-when">⏱ 오늘 5분 공부</span><span class="a9-fire">🔥 '+st+'일째</span></div>'+
      weekDots()+
      '<div class="a9-big">'+T.emo+' '+esc(T.title)+'</div>'+
      '<div class="a9-why">왜 이걸? '+esc(T.why)+(J&&J.sig&&J.sig!=='good'&&(''+T.id).charAt(0)!=='w'?' — 내 기록을 보고 골랐어요.':'')+'</div>'+
      '<ol class="a9-steps">';
    for(var i=0;i<T.steps.length;i++)h+='<li><span class="a9-min">'+MINS[i]+'</span>'+esc(T.steps[i])+'</li>';
    h+='</ol>';
    if(done){
      h+='<div class="a9-done">✅ 오늘 5분 끝! 내일 또 만나요.</div>'+
        '<button class="a9-sub" onclick="go(\''+T.go+'\')">'+esc(T.btn)+' (더 보고 싶으면)</button>';
    }else{
      h+='<div class="a9-clock" id="a9Clock">5:00</div>'+
        '<div class="a9-btns"><button class="a9-sub" onclick="ac9Timer()">▶ 5분 시작</button>'+
        '<button class="a9-sub" onclick="go(\''+T.go+'\')">'+esc(T.btn)+'</button></div>'+
        '<button class="a9-go" onclick="ac9FiveDone(\''+esc(T.id)+'\')">✅ 다 했어요</button>';
    }
    h+='</div>';
    if(J)h+='<div class="acad-note">'+pill(J.sig)+' '+esc(J.head)+' — '+esc(J.why)+'</div>';
    return h;
  }

  /* ── 화면 — 리더 「팀 성장표」 ── */
  function teamLoad(){
    if(AC9.teamBusy)return;
    var sb=(typeof osClient==='function')?osClient():null;if(!sb)return;
    AC9.teamBusy=true;
    if(typeof GB!=='undefined'&&!GB.loaded&&!GB.busy&&typeof gbLoad==='function')gbLoad();
    var q=function(p){return p.then(function(r){return r;},function(e){return {error:e||{}};});};
    Promise.all([
      q(sb.from('team_members').select('member_id,joined_at')),
      q(sb.from('daily_checks').select('member_id,check_date').eq('scope','study5').gte('check_date',addDays(today(),-6)))
    ]).then(function(r){
      var join={},five={};
      ((r[0]&&!r[0].error&&r[0].data)||[]).forEach(function(x){
        var d=x.joined_at?new Date(x.joined_at):null;if(!d||isNaN(d.getTime()))return;
        var s=ymd(d);if(!join[x.member_id]||s<join[x.member_id])join[x.member_id]=s;});
      ((r[1]&&!r[1].error&&r[1].data)||[]).forEach(function(x){five[x.member_id]=(five[x.member_id]||0)+1;});
      AC9.team={join:join,five:five,fiveErr:!!(r[1]&&r[1].error)};AC9.teamBusy=false;
      waitGb();
    });
  }
  function waitGb(n){
    n=n||0;
    if(typeof GB!=='undefined'&&GB.loaded){if(shown()&&AC.view==='team')repaint();return;}
    if(n<45)setTimeout(function(){waitGb(n+1);},700);
  }
  function teamView(){
    if(!lead())return '<div class="acad-note">팀 성장표는 리더만 봐요.</div>';
    if(!AC9.team){teamLoad();return '<div class="acad-note">팀 기록을 모으는 중이에요…</div>';}
    if(typeof GB==='undefined'||!GB.loaded){waitGb();return '<div class="acad-note">팀원 명단을 읽는 중이에요…</div>';}
    if(!arReady())return '<div class="acad-note">팀 CRM 기록을 읽는 중이에요…</div>';
    var rows=(GB.rows||[]).filter(function(r){return !GB.team||r.team===GB.team;});
    var mid=ac9Mid(),order={none:0,stuck:1,leak:2,good:3},cnt={none:0,stuck:0,leak:0,good:0};
    var list=rows.map(function(r){var J=ac9Judge(r.id,AC9.team.join[r.id]||'',mid);J.name=r.name;cnt[J.sig]++;return J;});
    list.sort(function(a,b){return order[a.sig]-order[b.sig]||b.day-a.day;});
    var h='<div class="a9-card">'+
      '<div class="a9-head">👥 팀 성장표 — 주간 회의 5분</div>'+
      '<div class="a9-why">빨강·노랑인 분부터 한 명씩, 「이번 주 한 가지」만 같이 정해요. 기록 없음은 「기록부터」예요. 팀원이 따로 체크한 것은 하나도 없어요 — 전부 CRM 기록이에요.</div>'+
      '<div class="a9-sum">'+pill('none')+' '+cnt.none+'명 '+pill('stuck')+' '+cnt.stuck+'명 '+pill('leak')+' '+cnt.leak+'명 '+pill('good')+' '+cnt.good+'명</div>'+
      (mid.pick==null&&mid.meet==null&&mid.close==null?'<div class="a9-src">팀 비교는 비율을 가진 사람이 3명 이상일 때부터 해요 — 지금은 「새는 곳」을 말하지 않아요.</div>':'')+
    '</div>';
    if(!list.length)h+='<div class="acad-note">팀원 명단이 비어 있어요.</div>';
    list.forEach(function(J){
      var T=ac9Topic(J),f=AC9.team.five[J.who]||0;
      h+='<div class="a9-mem a9-m-'+J.sig+'">'+
        '<div class="a9-top"><b class="a9-name">'+esc(J.name)+'</b>'+pill(J.sig)+'</div>'+
        '<div class="a9-when">'+(J.day?('DAY '+J.day+' · '+esc(J.segName)):'팀에 들어온 날 기록 없음')+'</div>'+
        '<div class="a9-why"><b>'+esc(J.head)+'</b> — '+esc(J.why)+'</div>'+
        '<div class="a9-line">이번 주 한 가지: <b>'+esc(T.title)+'</b></div>'+
        '<div class="a9-line">⏱ 5분 공부: 최근 7일 중 <b>'+f+'일</b>'+(AC9.team.fiveErr?' (못 읽음)':'')+'</div>'+
      '</div>';
    });
    return h;
  }

  /* ── 탭 — 「오늘 5분」 · 「팀 성장표」(리더) 를 더하고, 어려운 탭 이름을 쉽게 ── */
  var oldBody=acBody;
  acBody=function(){
    var extra=acTab('five','⏱ 오늘 5분')+(lead()?acTab('team','👥 팀 성장표'):'');
    if(AC.view==='five'||AC.view==='team'){
      /* 탭 줄은 index.html acBody 와 같은 차례 — 저쪽 탭을 늘리면 여기도 */
      var nav='<div class="acad-tabs">'+extra+
        acTab('dash','성장 대시보드')+acTab('road','90일 로드맵')+acTab('curr','12주 커리큘럼')+
        acTab('run','이번 주 숫자')+acTab('study','공부 진행')+acTab('check','체크리스트')+
        acTab('cert','졸업 기준')+'</div>';
      return nav+(AC.view==='five'?fiveView():teamView());
    }
    return oldBody.apply(this,arguments)
      .replace('<div class="acad-tabs">','<div class="acad-tabs">'+extra)
      .replace('주간 실행·퍼널','이번 주 숫자');
  };

  /* ── 이번 주 숫자 (예전 「주간 실행·퍼널」) — 쉬운 말 ── */
  function tile(label,v,sub){
    return '<div><div class="gl">'+label+'</div>'+
      '<div style="font-size:var(--t4);font-weight:900;color:var(--t-ink);margin-top:2px">'+v+'</div>'+
      (sub?'<div style="font-size:13px;color:var(--t-sub)">'+sub+'</div>':'')+'</div>';
  }
  acRunView=function(){
    var p=acLoadProg(),info=acDayInfo(),wk=info.set?info.week:1;
    if(!p.run[wk])p.run[wk]={td:0,ta:0,ap:0,pc:0,note:''};
    var note=p.run[wk].note||'',W=ac9Win(wk);
    var h='<div class="acad-hero"><div style="font-size:var(--t6);font-weight:800;color:var(--t-ink)">열심히가 아니라 <span style="color:var(--t-point)">어디서 끊기는지</span>로 성장합니다</div>'+
      '<div style="font-size:var(--t6);color:var(--t-sub);margin-top:4px;line-height:1.6">숫자는 <b>DB 통합 CRM 통화 기록에서 자동으로</b> 셉니다. 따로 적을 것은 없어요 — 통화 결과만 CRM에 남기면 돼요.</div></div>';
    if(!me())return h+'<div class="acad-note">로그인하면 내 DB 통합 CRM 통화 기록으로 이번 주 숫자를 자동으로 셉니다.</div>';
    if(!arReady())return h+'<div class="acad-note">DB 통합 CRM 기록을 불러오는 중이에요…</div>';
    if(AR.err)h+='<div class="acad-note" style="margin-bottom:10px">CRM 기록을 다 못 읽었어요 — '+esc(AR.err)+'</div>';

    var r=ac9Fun(W.from,W.to);
    var rate=function(a,b){return b>0?Math.round(a/b*100):0;};
    var r1=rate(r.ta,r.td),r2=rate(r.ap,r.ta),r3=rate(r.pc,r.ap);
    var worst=null,wv=101;
    [['받는 비율','전화 건 분 중 통화된 분',r1,r.td,'saybook','💬','보낼 말 모음 — 안 받으신 분께 문자 한 줄'],
     ['약속 비율','통화가 만남 약속으로 이어지는 비율',r2,r.ta,'ta_say','🎙','TA 전체 대본 — 거절을 약속으로'],
     ['계약 비율','만남 약속이 계약으로 이어지는 비율',r3,r.ap,'fp_talk','🗣️','실전화법서 — 결정을 부드럽게']].forEach(function(x){
      if(x[3]>0&&x[2]<wv){wv=x[2];worst=x;}
    });
    h+='<div class="acad-detail" style="margin-bottom:12px">'+
      '<div class="dh"><span class="wn">'+esc(W.label)+'</span><h3 style="font-size:var(--t5)">이번 주 숫자</h3></div>'+
      '<div style="font-size:13px;color:var(--t-sub);margin:-4px 0 10px">'+esc(W.from)+' ~ '+esc(W.to)+' · CRM 기록 그대로</div>'+
      '<div class="acad-inputs">'+
        tile('전화 건 분',r.td,'교재에선 TD')+tile('통화된 분',r.ta,'안 받음 빼고 · TA')+
        tile('만남 약속',r.ap,'결과 「상담」 · AP')+tile('계약',r.noDate?'—':r.pc,'계약완료일 기준')+
      '</div>'+
      '<div class="acad-funnel">'+
        acFunBar('전화 건 분',r.td,r.td,'#94A3B8')+acFunBar('통화된 분',r.ta,r.td,'#3B82F6')+
        acFunBar('만남 약속',r.ap,r.td,'#8B5CF6')+acFunBar('계약',r.noDate?0:r.pc,r.td,'#059669')+
      '</div>'+
      '<div class="acad-grid3" style="margin-top:12px">'+
        '<div><div class="gl">받는 비율</div><div class="gv" style="font-size:var(--t4);font-weight:900;color:var(--t-point)">'+r1+'%</div></div>'+
        '<div><div class="gl">약속 비율</div><div class="gv" style="font-size:var(--t4);font-weight:900;color:#7C3AED">'+r2+'%</div></div>'+
        '<div><div class="gl">계약 비율</div><div class="gv" style="font-size:var(--t4);font-weight:900;color:#059669">'+(r.noDate?'—':r3+'%')+'</div></div>'+
      '</div>'+
      '<div style="font-size:13px;color:var(--t-sub);margin-top:8px;line-height:1.55">증권 전달 '+(r.noDate?'—':r.rl+'건')+
        ' · 계약은 그 주에 계약완료일이 찍힌 분이라 약속한 주와 다를 수 있어요.</div>';
    if(r.cut)h+='<div class="acad-note" style="margin-top:10px">이 주는 통화 기록을 <b>다 읽지 못했어요</b>(최근 4,000통까지만 읽어요) — 실제보다 적게 보일 수 있어요.</div>';
    if(r.noDate)h+='<div class="acad-note" style="margin-top:10px">이 서버에는 계약완료일 칸이 아직 없어 <b>계약은 셀 수 없어요</b>.</div>';
    if(worst){
      h+='<div class="acad-gate" style="margin-top:12px"><b>·</b> 이번 주 제일 약한 곳은 <b>'+esc(worst[0])+'</b> ('+worst[2]+'%) — '+esc(worst[1])+'이에요. '+
        '여기부터 연습해요.</div>'+acToolRow([[worst[4],worst[5],worst[6]]]);
    }else if(!r.td){
      h+='<div class="acad-gate" style="margin-top:12px"><b>·</b> 이 기간에 CRM에 남긴 통화가 없어요. 통화 결과를 남기면 다음부터 자동으로 짚어 줘요.</div>'+
        acToolRow([['crm','🗄️','DB 통합 CRM 열기']]);
    }
    h+='<div style="margin-top:12px"><div class="gl" style="margin-bottom:5px">이번 주 바꿀 행동 1개 <span style="font-weight:400;color:var(--t-sub)">(적고 싶을 때만)</span></div>'+
      '<textarea onchange="acRunNote('+wk+',this.value)" placeholder="예: 안 받으신 분은 3번째부터 문자 한 줄 남기기" style="width:100%;box-sizing:border-box;border:1px solid var(--t-line);border-radius:10px;padding:10px 12px;font-size:var(--t6);font-family:inherit;line-height:1.6;min-height:64px">'+esc(note)+'</textarea></div>';
    h+='</div>';

    h+='<div class="acad-sec"><div class="sh">📤 주간 보고는 대표 브리핑으로</div>'+
      '<div style="font-size:var(--t6);color:var(--t-ink);line-height:1.7">위 숫자는 CRM 기록 그대로예요. 대표 브리핑에는 <b>바꿀 행동 하나</b>만 더해 남기면 다음 주 코칭으로 이어져요.</div>'+
      acToolRow([['report','📊','대표 브리핑 열기'],['crm','🗄️','DB CRM'],['attend','🗓️','출근 현황']])+'</div>';

    if(info.set&&info.day>0){
      var rows='';
      for(var i=1;i<=wk;i++){
        var w=ac9Win(i),x=ac9Fun(w.from,w.to);
        rows+='<tr style="border-top:1px solid var(--t-line-2)">'+
          '<td style="padding:8px 6px;font-size:var(--t6);font-weight:700;color:var(--t-ink)">'+i+'주'+(x.cut?' *':'')+'</td>'+
          '<td style="padding:8px 6px;text-align:right;font-size:var(--t6);color:var(--t-ink)">'+x.td+'</td>'+
          '<td style="padding:8px 6px;text-align:right;font-size:var(--t6);color:var(--t-ink)">'+x.ta+'</td>'+
          '<td style="padding:8px 6px;text-align:right;font-size:var(--t6);color:var(--t-ink)">'+x.ap+'</td>'+
          '<td style="padding:8px 6px;text-align:right;font-size:var(--t6);font-weight:800;color:#059669">'+(x.noDate?'—':x.pc)+'</td>'+
          '<td style="padding:8px 6px;text-align:right;font-size:var(--t6);color:var(--t-sub)">'+rate(x.ap,x.td)+'%</td></tr>';
      }
      h+='<div class="acad-sec"><div class="sh">📈 주차별 — CRM 기록에서 자동</div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'+
        '<thead><tr style="color:var(--t-sub2);font-size:var(--t6)"><th style="text-align:left;padding:4px 6px">주</th><th style="text-align:right;padding:4px 6px">전화</th><th style="text-align:right;padding:4px 6px">통화</th><th style="text-align:right;padding:4px 6px">약속</th><th style="text-align:right;padding:4px 6px">계약</th><th style="text-align:right;padding:4px 6px">약속률</th></tr></thead>'+
        '<tbody>'+rows+'</tbody></table></div>'+
        '<div style="font-size:13px;color:var(--t-sub);margin-top:6px">약속률 = 만남 약속 ÷ 전화 건 분 · * 표는 기록을 다 못 읽은 주</div></div>';
    }
    return h;
  };

  /* ── ⑤ 홈 알림 시트 — 하루 한 번 「오늘 이거 5분만!」 ──
     ★ 홈에 들어올 때만 뜹니다(고객 앞 화면에서는 안 뜹니다). 서버를 부르지 않고
       이미 읽어 둔 AR 만 씁니다 — 없으면 이번 주 커리큘럼 주제로.
     ★ 「이따가」 = 3시간 뒤 다시, 「오늘은 쉴게요」 = 내일까지 안 뜸.
     ⚠ 자동 점검 브라우저(navigator.webdriver)에서는 안 띄웁니다 — 다른 점검이 홈을
       누르다 이 시트에 가려 엉뚱하게 실패하지 않게. 이 시트 자체는 check-ac90auto 가
       window.__a9Force 로 켜서 봅니다.                                         */
  function a9SheetClose(){var s=document.getElementById('a9Sheet');if(s&&s.parentNode)s.parentNode.removeChild(s);}
  window.a9SheetClose=a9SheetClose;
  window.a9Later=function(h){
    var n=ls('apex_ac9_nudge')||{};
    if(h)n.until=Date.now()+h*3600000;else n.off=today();
    ls('apex_ac9_nudge',n);a9SheetClose();
  };
  window.a9Start=function(){a9SheetClose();if(typeof go==='function')go('academy');if(typeof acGo==='function')acGo('five');};
  function ac9Nudge(){
    if(navigator.webdriver&&!window.__a9Force)return;
    if(!me()||document.getElementById('a9Sheet'))return;
    var cur=(typeof currentTab==='function')?currentTab():'';
    if(cur!=='home')return;
    if(fiveDone())return;
    var n=ls('apex_ac9_nudge')||{};
    if(n.off===today()||(n.until&&Date.now()<n.until))return;
    ac9Css();
    var J=(typeof AR!=='undefined'&&AR.loaded)?ac9Judge(me(),acStart(),ac9Mid()):null;
    var T=ac9Topic(J),st=streak();
    var d=document.createElement('div');d.id='a9Sheet';d.className='a9-sheet';
    d.innerHTML='<div class="a9-sheet-in" role="dialog" aria-label="오늘 5분 공부">'+
      '<div class="a9-top"><span class="a9-when">⏱ 오늘의 5분</span>'+(st?'<span class="a9-fire">🔥 '+st+'일째</span>':'')+'</div>'+
      '<div class="a9-big">오늘 이거 5분만 해 봐요!</div>'+
      '<div class="a9-topic">'+T.emo+' '+esc(T.title)+'</div>'+
      '<div class="a9-why">'+esc(T.why)+'</div>'+
      '<button class="a9-go" onclick="a9Start()">지금 5분 하기</button>'+
      '<div class="a9-btns"><button class="a9-sub" onclick="a9Later(3)">이따가 할게요</button>'+
      '<button class="a9-sub" onclick="a9Later(0)">오늘은 쉴게요</button></div>'+
    '</div>';
    document.body.appendChild(d);
  }
  window.ac9Nudge=ac9Nudge;
  var oldGo=go;
  go=function(tab){
    var r=oldGo.apply(this,arguments);
    if(tab!=='home')a9SheetClose();
    else setTimeout(ac9Nudge,1500);
    return r;
  };
  (function boot(n){
    if(me()){setTimeout(ac9Nudge,1500);return;}
    if(n<25)setTimeout(function(){boot(n+1);},1000);
  })(0);

  /* ── 옷 — 토스 색 그대로(var(--t-*)) ── */
  function ac9Css(){
    if(document.getElementById('a9Css'))return;
    var s=document.createElement('style');s.id='a9Css';
    s.textContent=
'.a9-card{background:var(--t-card,#fff);border-radius:var(--t-r,20px);padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}'+
'.a9-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}'+
'.a9-when{font-size:13px;color:var(--t-sub,#636C78);font-weight:700}'+
'.a9-head{font-size:18px;font-weight:800;color:var(--t-ink,#191F28);margin-top:8px;line-height:1.4}'+
'.a9-big{font-size:20px;font-weight:800;color:var(--t-ink,#191F28);margin-top:10px;line-height:1.4}'+
'.a9-topic{font-size:16px;font-weight:700;color:var(--t-point,#1A56DB);margin-top:6px}'+
'.a9-why{font-size:14px;color:var(--t-sub,#636C78);line-height:1.6;margin-top:6px}'+
'.a9-pill{display:inline-block;font-size:13px;font-weight:800;border-radius:999px;padding:3px 10px}'+
'.a9-s-none{background:var(--t-bg,#F2F4F6);color:var(--t-sub,#636C78)}'+
'.a9-s-stuck{background:var(--t-warn-l,#FFF7ED);color:var(--t-warn-d,#8A5A12)}'+
'.a9-s-leak{background:var(--t-neg-l,#FEF2F2);color:var(--t-neg,#DC2626)}'+
'.a9-s-good{background:var(--t-point-l,#EBF3FF);color:var(--t-point,#1A56DB)}'+
'.a9-cells{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px}'+
'.a9-cell{background:var(--t-bg,#F2F4F6);border-radius:12px;padding:8px 4px;text-align:center;min-width:0}'+
'.a9-cell b{display:block;font-size:18px;color:var(--t-ink,#191F28)}'+
'.a9-cell span{display:block;font-size:13px;color:var(--t-ink,#191F28);line-height:1.3;word-break:keep-all}'+
'.a9-cell i{display:block;font-style:normal;font-size:13px;color:var(--t-sub,#636C78)}'+
'.a9-go{display:block;width:100%;margin-top:12px;border:0;border-radius:14px;padding:13px;font-size:15px;font-weight:800;background:var(--t-point,#1A56DB);color:#fff;font-family:inherit;cursor:pointer}'+
'.a9-sub{flex:1;border:0;border-radius:12px;padding:11px;font-size:14px;font-weight:700;background:var(--t-point-l,#EBF3FF);color:var(--t-point,#1A56DB);font-family:inherit;cursor:pointer}'+
'.a9-btns{display:flex;gap:8px;margin-top:10px}'+
'.a9-src{font-size:13px;color:var(--t-sub,#636C78);margin-top:10px;line-height:1.5}'+
'.a9-fire{font-size:14px;font-weight:800;color:var(--t-warn-d,#8A5A12)}'+
'.a9-dots{display:flex;gap:6px;margin-top:10px}'+
'.a9-dot{flex:1;text-align:center;font-size:13px;border-radius:10px;padding:5px 0;background:var(--t-bg,#F2F4F6);color:var(--t-sub,#636C78)}'+
'.a9-dot.on{background:var(--t-point,#1A56DB);color:#fff;font-weight:800}'+
'.a9-steps{margin:12px 0 0;padding-left:20px}'+
'.a9-steps li{font-size:15px;color:var(--t-ink,#191F28);line-height:1.6;margin-bottom:6px}'+
'.a9-min{display:inline-block;font-size:13px;font-weight:800;color:var(--t-point,#1A56DB);background:var(--t-point-l,#EBF3FF);border-radius:8px;padding:1px 7px;margin-right:6px}'+
'.a9-clock{font-size:28px;font-weight:900;text-align:center;color:var(--t-ink,#191F28);margin-top:12px;font-variant-numeric:tabular-nums}'+
'.a9-done{font-size:16px;font-weight:800;color:var(--t-point,#1A56DB);margin-top:12px}'+
'.a9-sum{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:14px;color:var(--t-ink,#191F28)}'+
'.a9-mem{background:var(--t-card,#fff);border-radius:16px;padding:14px;margin-bottom:8px;border-left:4px solid var(--t-bg,#F2F4F6)}'+
'.a9-m-stuck{border-left-color:#F59E0B}.a9-m-leak{border-left-color:var(--t-neg,#DC2626)}.a9-m-good{border-left-color:var(--t-point,#1A56DB)}'+
'.a9-name{font-size:16px;color:var(--t-ink,#191F28)}'+
'.a9-line{font-size:14px;color:var(--t-ink,#191F28);margin-top:6px;line-height:1.5}'+
'.a9-sheet{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9000;display:flex;align-items:flex-end;justify-content:center}'+
'.a9-sheet-in{background:var(--t-card,#fff);width:100%;max-width:480px;border-radius:24px 24px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));box-sizing:border-box}'+
'.a9-five .a9-big{margin-top:12px}';
    document.head.appendChild(s);
  }
})();
