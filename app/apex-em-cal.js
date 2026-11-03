/* ══════════════════════════════════════════════════════════════════════
   일정 한 벌 — EM 운영센터 「월간 일정」(본부 · 팀 일정)이 내 캘린더에도 (판 X303)
   ─────────────────────────────────────────────────────────────────────
   사장님 말씀 2026-11-03 — 「응 상담이랑 일정도 똑같이 합쳐줘」

   왜 갈라져 있었나 — 교육 · 시상 · 팀 회의 같은 본부 · 팀 일정은 EM 운영센터
   (em_events)에만 있었고, 팀원은 CRM 「내 캘린더」 만 봅니다. 그래서 EM 이
   일정을 바꿔도 팀원 달력에는 안 섰습니다.
   이제
     · EM 일정 → 여기 : em_events 를 읽어 내 캘린더 · TFA 스케줄 · 홈 달력에
       「🏢 본부 · 팀 일정」 으로 겹쳐 세웁니다(원본은 EM 운영센터 — 여기서는 보기만).
     · 팀원 약속 → EM : 반대쪽은 서버가 합니다(EM운영센터_SQL migration_67 ·
       em_appt_feed). DB 통합 CRM 에 잡은 약속이 EM 월간 일정에 「👥 팀원 약속」 으로.
   ★ <b>홈에서는 안 부릅니다</b> — 켤 때 · 홈 처음 서버 부름 수(check-boot 기준선)를
     늘리지 않게. 「내 캘린더」 를 열 때 한 번 받고(10분 동안 다시 안 받음),
     받은 것은 홈 달력에도 같이 섭니다(7번).
   보는 범위는 서버 정책 그대로 — 본부 일정은 모두, 팀 일정은 내 팀만.

   index.html 에는 이 파일을 부르는 <script> 한 줄만 — 지우면 원래대로.
   ES5 로 씁니다 — 본체와 같은 손버릇.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.APEX_EM_CAL) return;
var EMC=window.APEX_EM_CAL={rows:[],at:0,busy:false,err:''};
var TTL=10*60*1000;

function pad(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function client(){ try{ return (typeof osClient==='function')?osClient():null; }catch(e){ return null; } }

function load(force){
  if(EMC.busy) return;
  if(!force && EMC.at && Date.now()-EMC.at<TTL) return;
  var sb=client(); if(!sb) return;
  var a=new Date(),b=new Date();
  a.setDate(a.getDate()-45); b.setDate(b.getDate()+100);
  EMC.busy=true;
  /* ⚠ 서버 손이 모자라도(점검의 가짜 서버 · 옛 라이브러리) 달력을 안 터뜨린다 — 못 받으면 원래대로 */
  var q;
  try{
    q=sb.from('em_events').select('id,scope,edate,edate_end,etime,title,hidden');
    if(q&&typeof q.gte==='function') q=q.gte('edate',ymd(a));
    if(q&&typeof q.lte==='function') q=q.lte('edate',ymd(b));
    if(q&&typeof q.eq==='function') q=q.eq('hidden',false);
    if(q&&typeof q.limit==='function') q=q.limit(400);
  }catch(x){ q=null; }
  if(!q||typeof q.then!=='function'){ EMC.busy=false; EMC.at=Date.now(); return; }
  q.then(function(r){
      EMC.busy=false; EMC.at=Date.now();
      if(r&&r.error){ EMC.err=r.error.message||'못 읽음'; return; }   /* 표가 없거나 권한 — 조용히 원래대로 */
      EMC.err=''; EMC.rows=(r&&r.data)||[];
      try{ if(typeof mcalPaint==='function') mcalPaint(); }catch(e){}
    },function(){ EMC.busy=false; EMC.at=Date.now(); });
}

/* 달력 종류 하나 더 — 색 · 그림 */
/* ⚠ 받은 일정이 있을 때만 단다 — 범례(mcal-lg)가 MCAL_KIND 를 전부 늘어놓아, 일정이 없는데 달면
   폰에서 달력이 한 줄 길어진다(check-phonefit 이 잡음 · 판 X304 CI) */
function kind(){
  if(typeof MCAL_KIND==='undefined') return;
  if(EMC.rows.length){ if(!MCAL_KIND.em) MCAL_KIND.em={e:'🏢',t:'본부 · 팀 일정',c:'#7C3AED'}; }
  else if(MCAL_KIND.em) delete MCAL_KIND.em;
}

/* 달력 줄 모으는 자리(mcalItems) 하나에만 덧붙인다 — 홈 · 내 캘린더 · TFA 스케줄 · 고객 365일이 같이 얻는다(5번).
   who 를 안 단다 — 담당자를 골라도 사라지지 않게(mcalMine 은 임자 없는 줄을 안 거른다). */
function wrapItems(){
  if(typeof window.mcalItems!=='function'||window.mcalItems._em) return !!(window.mcalItems&&window.mcalItems._em);
  var o=window.mcalItems;
  window.mcalItems=function(){
    var out=o.apply(this,arguments)||{};
    try{
      kind();
      var i,e,d,end,n,ds;
      for(i=0;i<EMC.rows.length;i++){
        e=EMC.rows[i]; if(!e||e.hidden||!e.edate) continue;
        d=new Date(e.edate+'T00:00:00'); end=e.edate_end&&e.edate_end>e.edate?e.edate_end:e.edate;
        for(n=0;n<31;n++){
          ds=ymd(d); if(ds>end) break;
          (out[ds]=out[ds]||[]).push({k:'em',t:e.title||'일정',
            s:(e.etime?e.etime+' · ':'')+(e.scope==='hq'?'본부':'우리 팀')+(end!==e.edate?' · 연속':'')});
          d.setDate(d.getDate()+1);
        }
      }
    }catch(x){}
    return out;
  };
  window.mcalItems._em=1;
  return true;
}

/* 「내 캘린더」 를 그릴 때만 받는다 — 받은 것은 다른 달력(홈 · TFA 스케줄)에도 같이 선다.
   ⚠ go 를 감싸지 않는다 — 다른 자(check-bamake)가 go 의 글을 읽어 길을 확인한다(판 X304 CI 에서 걸림).
   내 캘린더 카드만 apps 를 켜고 그린다(renderMyCal) — 홈 달력 카드는 안 켠다. */
function wrapCard(){
  if(typeof window.mcalCardHtml!=='function'||window.mcalCardHtml._em) return !!(window.mcalCardHtml&&window.mcalCardHtml._em);
  var o=window.mcalCardHtml;
  window.mcalCardHtml=function(opt){
    try{ if(opt&&opt.apps) load(false); }catch(x){}
    return o.apply(this,arguments);
  };
  window.mcalCardHtml._em=1;
  return true;
}
/* 🏢 줄은 보기만 — 본체는 그 줄을 누르면 고객 목록으로 보내는데, EM 일정은 고객이 아니다.
   잡는 단계(capture)에서 먼저 받아 그 줄의 onclick 까지 안 가게 한다. */
document.addEventListener('click',function(ev){
  try{
    var it=ev.target&&ev.target.closest?ev.target.closest('.mcal-it'):null, e=it?it.querySelector('.e'):null;
    if(e&&e.textContent==='🏢'){ ev.stopPropagation(); ev.preventDefault(); }
  }catch(x){}
},true);

var tries=0;
(function wait(){
  var a=wrapItems(), b=wrapCard();
  if((!a||!b)&&(tries+=1)<120) setTimeout(wait,1000);
})();
})();
