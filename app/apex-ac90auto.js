/* 📈 90일 아카데미 — 팀원이 안 넣어도 돌아가게 (판 X552 · 1단계)

   사장님 말씀 2026-11-24 「팀원들의 레벨을 어떻게 스스로 체크할지가 중요해
   팀원들 스스로가 체크를 안하거든」 → 「메인세션 90일 로드맵과 연결해서」 →
   「응, 1단계부터」.

   90일 아카데미(index.html · AC_ROAD · AC_WEEKS)는 네 가지를 <b>본인이 넣어야</b>
   돌았습니다 — ① 시작일 ② 주간 퍼널 숫자 ③ 12주 체크 ④ 공부 완료.
   이 파일은 그 가운데 <b>①과 ②</b>를 기록으로 채웁니다.

   ① 시작일 — 본인이 넣은 날이 없으면 <b>팀에 들어온 날</b>(team_members.joined_at)
      로 셉니다. 본인이 고친 날이 있으면 그것이 이깁니다(이 기기에만 남는 것은
      예전과 같습니다). 팀 기록이 없으면 <b>짐작하지 않고</b> 「못 정했다」고 적습니다.
   ② 주간 퍼널 — 손으로 옮겨 적던 TD·TA·AP·PC 를 <b>DB 통합 CRM 통화 장부
      (AR.calls)와 DB 줄(AR.db)</b>에서 바로 셉니다. 셈은 ac9Fun 한 곳입니다.
        TD 전화 건 분  = 그 주에 내가 한 번이라도 건 DB
        TA 통화된 분   = 그 중 결과가 부재가 아닌 DB(거절·상담)
        AP 상담 약속   = 그 중 결과가 상담(약속)인 DB
        PC 계약        = 그 주에 계약완료일(contracted_at)이 찍힌 내 DB
        RL 증권전달    = 그 주에 증권전달일(policy_sent_at)이 찍힌 내 DB (참고 줄)
      ★ 통화 장부는 최근 4,000통까지만 읽습니다(arLoad). 그보다 앞 주는
        <b>덜 읽었다고</b> 적습니다 — 0 이라고 하지 않습니다.

   ★ 몸은 index.html 의 ac* 함수를 <b>감싸기만</b> 합니다 — 표(AC_ROAD·AC_WEEKS)와
     화면 뼈대는 그대로 씁니다. 재는 자 scripts/check-ac90auto.js.            */
(function(){
  if(typeof acStart!=='function'||typeof acRunView!=='function')return;

  var AC9={join:'',tried:false,busy:false,none:false,retry:0,arWait:0};
  window.AC9=AC9;

  function pd(n){return (n<10?'0':'')+n;}
  function ymd(d){return d.getFullYear()+'-'+pd(d.getMonth()+1)+'-'+pd(d.getDate());}
  function addDays(s,n){var a=(''+s).split('-'),d=new Date(+a[0],+a[1]-1,+a[2]);d.setDate(d.getDate()+n);return ymd(d);}
  function today(){return ymd(new Date());}
  function me(){return (typeof arMyId==='function')?arMyId():null;}
  function shown(){return !!document.getElementById('acadBody');}
  function repaint(){var b=document.getElementById('acadBody');if(b&&typeof acBody==='function')b.innerHTML=acBody();}

  /* ── ① 팀에 들어온 날 ── */
  function ac9LoadJoin(){
    if(AC9.tried||AC9.busy)return;
    var sb=(typeof osClient==='function')?osClient():null,uid=me();
    if(!sb||!uid){
      /* 로그인이 아직 안 끝났을 수 있다 — 화면이 떠 있는 동안 몇 번만 다시 본다 */
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

  /* 시작일 — 본인이 고친 날 > 팀에 들어온 날 > 없음 */
  acStart=function(){var p=acLoadProg();return p.start||AC9.join||'';};
  window.acStartSrc=function(){var p=acLoadProg();return p.start?'mine':(AC9.join?'team':'');};

  var oldRender=renderAcademy;
  renderAcademy=function(){ac9LoadJoin();return oldRender.apply(this,arguments);};

  function srcNote(){
    var s=acStartSrc(),p=acLoadProg(),h='';
    if(s==='team')
      h='시작일은 <b>팀에 들어온 날('+osEsc(AC9.join)+')</b>로 자동으로 정했어요. 따로 넣을 것은 없어요.';
    else if(s==='mine')
      h='시작일은 <b>직접 고친 날('+osEsc(p.start)+')</b>이에요 — 이 기기에만 남아요.'+
        (AC9.join&&AC9.join!==p.start?' <button class="acad-tool" onclick="acSetStart(\'\')">팀에 들어온 날('+osEsc(AC9.join)+')로 되돌리기</button>':'');
    else if(AC9.busy||!AC9.tried)
      h='팀에 들어온 날을 찾는 중이에요…';
    else
      h='팀에 들어온 기록이 없어 <b>시작일을 정하지 못했어요</b>. 리더에게 팀 등록을 부탁하거나 아래에 날짜를 넣어 주세요.';
    return '<div class="acad-note" style="margin-bottom:10px">📅 '+h+'</div>';
  }
  var oldDash=acDashView;
  acDashView=function(){return srcNote()+oldDash.apply(this,arguments);};

  /* ── ② 주간 퍼널 — 셈은 여기 한 곳 ── */
  function ac9Win(wk){
    var s=acStart();
    if(!s){var t=today();return {from:addDays(t,-6),to:t,label:'최근 7일'};}
    var f=addDays(s,(wk-1)*7);
    return {from:f,to:addDays(f,6),label:wk+'주차'};
  }
  function ac9Fun(from,to){
    var who=me(),L=(typeof AR!=='undefined'&&AR.calls)||[],D=(typeof AR!=='undefined'&&AR.db)||[];
    var dial={},conn={},appt={},i,c,r,o={td:0,ta:0,ap:0,pc:0,rl:0,cut:false,noDate:false};
    var oldest='';
    for(i=0;i<L.length;i++){
      c=L[i];
      if(c.d&&(!oldest||c.d<oldest))oldest=c.d;
      if(c.w!==who||!c.b||!c.d||c.d<from||c.d>to)continue;
      dial[c.b]=1;
      if(c.r&&c.r!=='부재')conn[c.b]=1;
      if(c.r==='상담')appt[c.b]=1;
    }
    o.td=Object.keys(dial).length;o.ta=Object.keys(conn).length;o.ap=Object.keys(appt).length;
    for(i=0;i<D.length;i++){
      r=D[i];if(r.who!==who)continue;
      if(r.cAt&&r.cAt>=from&&r.cAt<=to)o.pc++;
      if(r.pAt&&r.pAt>=from&&r.pAt<=to)o.rl++;
    }
    /* 4,000통에서 끊었고 그 주가 읽은 것보다 앞이면 — 모른다 (1번) */
    o.cut=!!(typeof AR!=='undefined'&&AR.callsCut&&oldest&&from<oldest);
    o.noDate=!!(typeof AR!=='undefined'&&AR.noStage);
    return o;
  }
  window.ac9Fun=ac9Fun;window.ac9Win=ac9Win;

  function waitAr(){
    if(typeof AR==='undefined')return;
    if(AR.loaded){AC9.arWait=0;if(shown()&&AC.view==='run')repaint();return;}
    if(AC9.arWait++<45)setTimeout(waitAr,700);
  }

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

    var who=me();
    if(!who){
      return h+'<div class="acad-note">로그인하면 내 DB 통합 CRM 통화 기록으로 이번 주 퍼널을 자동으로 셉니다.</div>';
    }
    if(typeof AR==='undefined'||!AR.loaded){
      if(typeof AR!=='undefined'&&AR.busy!=='load'&&typeof arLoad==='function')arLoad();
      AC9.arWait=0;setTimeout(waitAr,700);
      return h+'<div class="acad-note">DB 통합 CRM 기록을 불러오는 중이에요…</div>';
    }
    if(AR.err)h+='<div class="acad-note" style="margin-bottom:10px">CRM 기록을 다 못 읽었어요 — '+osEsc(AR.err)+'</div>';

    var r=ac9Fun(W.from,W.to);
    var rate=function(a,b){return b>0?Math.round(a/b*100):0;};
    var r1=rate(r.ta,r.td),r2=rate(r.ap,r.ta),r3=rate(r.pc,r.ap);
    var worst=null,wv=101;
    [['TD → TA','전화 건 분 중 통화된 분',r1,r.td,'crm','🗄️','DB 통합 CRM — 부재는 3차까지 다시 걸기'],
     ['TA → AP','통화에서 상담 약속까지',r2,r.ta,'cs_assist','💬','AI 상담 어시스턴트로 첫 멘트 다듬기'],
     ['AP → PC','상담 약속에서 계약까지',r3,r.ap,'katalk','💬','제안서 카톡설명으로 결정 요청']].forEach(function(x){
      if(x[3]>0&&x[2]<wv){wv=x[2];worst=x;}
    });

    h+='<div class="acad-detail" style="margin-bottom:12px">'+
      '<div class="dh"><span class="wn">'+osEsc(W.label)+'</span><h3 style="font-size:var(--t5)">이번 주 영업 퍼널</h3></div>'+
      '<div style="font-size:13px;color:var(--t-sub);margin:-4px 0 10px">'+osEsc(W.from)+' ~ '+osEsc(W.to)+' · CRM 기록 그대로</div>'+
      '<div class="acad-inputs">'+
        tile('TD 전화 건 분',r.td,'건 DB 수')+tile('TA 통화된 분',r.ta,'부재 아닌 결과')+
        tile('AP 상담 약속',r.ap,'결과 「상담」')+tile('PC 계약',r.noDate?'—':r.pc,'계약완료일 기준')+
      '</div>'+
      '<div class="acad-funnel">'+
        acFunBar('TD 전화 건 분',r.td,r.td,'#94A3B8')+acFunBar('TA 통화된 분',r.ta,r.td,'#3B82F6')+
        acFunBar('AP 상담 약속',r.ap,r.td,'#8B5CF6')+acFunBar('PC 계약',r.noDate?0:r.pc,r.td,'#059669')+
      '</div>'+
      '<div class="acad-grid3" style="margin-top:12px">'+
        '<div><div class="gl">TD → TA</div><div class="gv" style="font-size:var(--t4);font-weight:900;color:var(--t-point)">'+r1+'%</div></div>'+
        '<div><div class="gl">TA → AP</div><div class="gv" style="font-size:var(--t4);font-weight:900;color:#7C3AED">'+r2+'%</div></div>'+
        '<div><div class="gl">AP → PC</div><div class="gv" style="font-size:var(--t4);font-weight:900;color:#059669">'+(r.noDate?'—':r3+'%')+'</div></div>'+
      '</div>'+
      '<div style="font-size:13px;color:var(--t-sub);margin-top:8px;line-height:1.55">RL 증권전달 '+(r.noDate?'—':r.rl+'건')+
        ' · 계약은 그 주에 계약완료일이 찍힌 분이라 약속한 주와 다를 수 있어요.</div>';
    if(r.cut)h+='<div class="acad-note" style="margin-top:10px">이 주는 통화 기록을 <b>다 읽지 못했어요</b>(최근 4,000통까지만 읽어요) — 실제보다 적게 보일 수 있어요.</div>';
    if(r.noDate)h+='<div class="acad-note" style="margin-top:10px">이 서버에는 계약완료일 칸이 아직 없어 <b>계약은 셀 수 없어요</b>.</div>';
    if(worst){
      h+='<div class="acad-gate" style="margin-top:12px"><b>·</b> 이번 주 병목은 <b>'+osEsc(worst[0])+'</b> ('+worst[2]+'%) — '+osEsc(worst[1])+'입니다. '+
        '여기부터 고치세요.</div>'+acToolRow([[worst[4],worst[5],worst[6]]]);
    }else if(!r.td){
      h+='<div class="acad-gate" style="margin-top:12px"><b>·</b> 이 기간에 CRM에 남긴 통화가 없어요. 통화 결과를 남기면 다음부터 자동으로 짚어 줘요.</div>'+
        acToolRow([['crm','🗄️','DB 통합 CRM 열기']]);
    }
    h+='<div style="margin-top:12px"><div class="gl" style="margin-bottom:5px">이번 주 바꿀 행동 1개 <span style="font-weight:400;color:var(--t-sub)">(적고 싶을 때만)</span></div>'+
      '<textarea onchange="acRunNote('+wk+',this.value)" placeholder="예: 부재 고객은 3차까지 무조건 재접촉하고 CRM에 차수를 남긴다" style="width:100%;box-sizing:border-box;border:1px solid var(--t-line);border-radius:10px;padding:10px 12px;font-size:var(--t6);font-family:inherit;line-height:1.6;min-height:64px">'+osEsc(note)+'</textarea></div>';
    h+='</div>';

    h+='<div class="acad-sec"><div class="sh">📤 주간 보고는 대표 브리핑으로</div>'+
      '<div style="font-size:var(--t6);color:var(--t-ink);line-height:1.7">위 숫자는 CRM 기록 그대로예요. 대표 브리핑에는 <b>바꿀 행동 하나</b>만 더해 남기면 다음 주 코칭으로 이어져요.</div>'+
      acToolRow([['report','📊','대표 브리핑 열기'],['crm','🗄️','DB CRM'],['attend','🗓️','출근 현황']])+'</div>';

    /* 주차별 — 시작일이 있을 때만, 1주차부터 지금 주까지 모두 기록에서 */
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
        '<thead><tr style="color:var(--t-sub2);font-size:var(--t6)"><th style="text-align:left;padding:4px 6px">주차</th><th style="text-align:right;padding:4px 6px">TD</th><th style="text-align:right;padding:4px 6px">TA</th><th style="text-align:right;padding:4px 6px">AP</th><th style="text-align:right;padding:4px 6px">PC</th><th style="text-align:right;padding:4px 6px">약속률</th></tr></thead>'+
        '<tbody>'+rows+'</tbody></table></div>'+
        '<div style="font-size:13px;color:var(--t-sub);margin-top:6px">약속률 = AP ÷ TD · * 표는 기록을 다 못 읽은 주</div></div>';
    }
    return h;
  };
})();
