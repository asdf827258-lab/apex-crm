/* ══════════════════════════════════════════════════════════════════════
   업적 한 벌 — 월간보고 「실제 올린 월초 · 실제 건수」 는 손으로 안 친다
   ─────────────────────────────────────────────────────────────────────
   사장님 말씀 2026-11-03 —
   「업적 합쳐주고, 왜 서로 공유가 안되냐고, 한곳에서 수정하면 모두가
    똑같은 화면을 볼수 있도록 하라고」

   왜 갈라져 있었나 — 같은 업적을 세 곳에 따로 적었습니다.
     · EM 업적 입력 · ✍️ 내 업적 입력   (계약 한 건씩 · 원)   ← 이제 이것이 원본
     · 월간보고 「실제 올린 월초」         (한 달 합계 · 만원 · 손으로)
     · DB 통합 CRM 「계약」 표시
   서버(EM운영센터_SQL migration_66)가 원본이 바뀔 때마다 월간보고의
   act_prem(만원) · act_case 를 다시 세어 넣고, DB 「계약」 은 원본에
   「확인 전」 업적으로 들어갑니다. 그래서 여기서는
     ① 두 칸을 손으로 못 치게 하고 — 「✍️ 내 업적 입력에서 자동」 이라 적고
     ② 저장할 때 두 칸을 안 보냅니다(원본이 센 값을 덮지 않게).
   목표 · 계획 · 소회 · 제출은 예전 그대로입니다.

   index.html 에는 이 파일을 부르는 <script> 한 줄만 — 지우면 원래대로.
   ES5 로 씁니다 — 본체와 같은 손버릇.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.APEX_PERF_LINK) return;
window.APEX_PERF_LINK=1;

/* ② 저장에서 실적 두 칸을 뺀다 */
function wrapSave(){
  if(typeof window.pfSave!=='function'||window.pfSave._link) return !!(window.pfSave&&window.pfSave._link);
  var o=window.pfSave;
  window.pfSave=function(patch,quiet){
    if(patch&&typeof patch==='object'){
      var p={},k; for(k in patch) if(Object.prototype.hasOwnProperty.call(patch,k)&&k!=='act_prem'&&k!=='act_case') p[k]=patch[k];
      patch=p;
    }
    return o.call(this,patch,quiet);
  };
  window.pfSave._link=1;
  return true;
}

/* ① 칸을 잠그고 까닭을 적는다 — 화면이 다시 그려질 때마다 */
function lock(){
  ['pf_act','pf_acase'].forEach(function(id){
    var el=document.getElementById(id); if(!el||el.getAttribute('data-link')) return;
    el.readOnly=true; el.setAttribute('data-link','1'); el.setAttribute('tabindex','-1');
    el.style.background='var(--t-bg)';
    el.title='✍️ 내 업적 입력(EM 업적)에서 자동으로 셉니다';
  });
  var a=document.getElementById('pf_act');
  if(a&&!document.getElementById('pfLinkNote')){
    var box=a.closest?a.closest('.frm'):null; if(!box) return;
    var d=document.createElement('div'); d.id='pfLinkNote';
    d.style.cssText='margin-top:8px;font-size:var(--t6);color:var(--t-sub);line-height:1.6';
    d.innerHTML='실적은 <b style="color:var(--t-ink)">✍️ 내 업적 입력</b>에 넣은 계약에서 저절로 셉니다 — EM 화면 · 이 화면 · 리더 화면이 같은 숫자를 봅니다. '+
      '<a href="javascript:void 0" onclick="if(typeof go===\'function\')go(\'myperf\')" style="font-weight:800;color:var(--t-ink);text-decoration:underline">업적 넣으러 가기 →</a>';
    box.parentNode.insertBefore(d,box.nextSibling);
  }
}

var n=0;
(function wait(){ if(!wrapSave()&&(n+=1)<120) setTimeout(wait,1000); })();
if(window.MutationObserver){
  new MutationObserver(function(){ if(document.getElementById('pf_act')) lock(); })
    .observe(document.documentElement,{childList:true,subtree:true});
}
})();
