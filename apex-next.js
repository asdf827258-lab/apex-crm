/* ══════════════════════════════════════════════════════════════════
   apex-next.js — <b>「다음 한 걸음」 칸의 모양.</b> 여기 하나에만 적는다.

   토스는 <b>끝난 자리에서 다음 한 걸음</b>을 줍니다. 메뉴로 돌려보내지
   않습니다. 이 앱도 세 자리에서 그렇게 합니다 —

     · db-crm.html            통화를 저장하면 <b>다음 한 분</b>
     · app/ba.html            전·후를 저장하면 <b>고객에게 보여 드리기</b>
     · app/증권전달/index.html 인쇄 창이 닫히면 <b>CRM 에 올리기</b>

   세 자리의 <b>말</b>은 다릅니다. 그런데 <b>모양</b>은 같아야 합니다 —
   같은 자리에 같은 크기의 파란 단추 하나. 그래서 처음에 세 파일에 각각
   적었다가, 그것이 곧 <b>「칸 모양 CSS 를 한 화면에서만 입혀 다른 화면이
   벌거벗었다」</b> 가 되는 자리임을 알았습니다 (CLAUDE.md 5번). 단추 색을
   한 번만 고치면 두 화면은 그대로 남습니다.

   그래서 <b>모양은 여기</b>, 말은 각자 화면에 둡니다.

   ★ <b>ES5</b> 로 씁니다 — app/index.html 이 ES5 라 어디서든 실릴 수 있게.
   ★ 색·둥글기에 <b>대체값</b>을 답니다. 이 세 화면 중 둘에는 :root 계단이
     없어서, 대체값이 없으면 단추가 <b>투명하게</b> 섭니다 — 화면은 멀쩡한데
     아무것도 안 보이는, 제일 찾기 어려운 고장입니다 (apex-hold.js 와 같은 규칙).
   ══════════════════════════════════════════════════════════════════ */
(function(g){
'use strict';

/* 옷은 <b>한 번만</b> — 쓰는 화면마다 부릅니다 (5번) */
function nextCss(){
  if(document.getElementById('apexNextCss'))return;
  var st=document.createElement('style');st.id='apexNextCss';
  st.textContent=
   /* ── 바닥에 뜨는 칸 (ba · 증권전달) ── */
   '.nx-wrap{position:fixed;left:0;right:0;bottom:0;z-index:960;display:none;padding:12px;'+
     'padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));pointer-events:none}'+
   '.nx-wrap.on{display:block}'+
   /* <b>발표 중에는 안 뜬다</b> — 고객이 보고 계신 화면이다 */
   'body.presenting .nx-wrap{display:none!important}'+
   /* ── 칸과 단추 (세 화면 공통) ── */
   '.nx-card{pointer-events:auto;max-width:540px;margin:0 auto;'+
     'background:#fff;color:var(--ink-1,#0D1117);border:1px solid var(--ink-7,#E9EAEC);'+
     'border-radius:var(--r-md,16px);padding:15px 16px;line-height:1.65}'+
   '.nx-wrap .nx-card{box-shadow:0 12px 34px rgba(0,0,0,.16)}'+
   '.nx-next{font-size:var(--t3,17px);font-weight:900;letter-spacing:-.03em;line-height:1.5}'+
   '.nx-sub{font-size:var(--t6,13px);font-weight:600;color:var(--ink-4,#6B7280);margin-top:5px;line-height:1.65}'+
   '.nx-btns{display:flex;gap:9px;margin-top:14px}'+
   /* <b>으뜸은 하나</b>. 둘을 나란히 파랗게 두면 또 고르셔야 한다. */
   '.nx-go{flex:1;min-height:52px;border:0;border-radius:var(--r-pill,999px);'+
     'background:var(--primary,#1A56DB);color:#fff;font:inherit;font-size:var(--t4,15px);'+
     'font-weight:800;letter-spacing:-.02em;cursor:pointer}'+
   '.nx-stop{min-height:52px;padding:0 18px;border:1px solid var(--ink-7,#E9EAEC);'+
     'border-radius:var(--r-pill,999px);background:#fff;color:var(--ink-3,#374151);'+
     'font:inherit;font-size:var(--t5,14px);font-weight:700;cursor:pointer}'+
   '@media print{.nx-wrap{display:none!important}}'+
   '@media(max-width:520px){.nx-btns{flex-direction:column}.nx-stop{width:100%}}';
  document.head.appendChild(st);
}
/* 바닥 칸을 세운다 — 자리는 여기가, <b>말은 부르는 쪽</b>이 (5번) */
function nextSheet(id,html){
  nextCss();
  var box=document.getElementById(id);
  if(!box){ box=document.createElement('div'); box.id=id; box.className='nx-wrap'; document.body.appendChild(box); }
  box.innerHTML=html;
  box.classList.add('on');
  return box;
}
function nextSheetHide(id){ var b=document.getElementById(id); if(b)b.classList.remove('on'); }

g.nextCss       = nextCss;
g.nextSheet     = nextSheet;
g.nextSheetHide = nextSheetHide;

})(typeof window!=='undefined'?window:this);
