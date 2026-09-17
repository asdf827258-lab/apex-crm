/* ══════════════════════════════════════════════════════════════════
   apex-hold.js — <b>손에 자료가 있나.</b> 이것을 묻는 곳은 여기 하나다.

   이 지식이 <b>두 곳</b>에 있으면 안 되는 이유는 apex-stage.js 와 같다 —
   본체(app/index.html)와 DB 통합 CRM(db-crm.html)이 <b>같은 서버</b>를 읽고
   <b>같은 상태</b>를 마주하는데, 한쪽만 「아직」과 「없음」을 가르면 같은
   순간에 두 화면이 <b>다른 말</b>을 한다 (CLAUDE.md 5번).

   ★ 여기는 <b>ES5</b> 로 씁니다 — app/index.html 이 ES5 라 그렇습니다.
   ★ 글자 씻기(esc)도 <b>여기 것</b>을 씁니다. 부르는 쪽 함수(osEsc·esc)를
     기대면 한쪽 파일에서만 돌고, 다른 쪽에서는 조용히 터집니다.
   ══════════════════════════════════════════════════════════════════ */
(function(g){
'use strict';

/* 화면마다 이름이 달라(osEsc·esc) 여기서 제 것을 씁니다 */
function esc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* 담는 통이 답하는 <b>세 칸</b> — loaded · busy · err.
   AR·GB·CO·MC·OSC 가 모두 이 이름을 씁니다. 새 통을 만들 때도 이 이름으로
   두십시오. 이름이 갈리면 여기가 못 읽고, 못 읽으면 <b>ok 로 착각</b>합니다. */
/* <b>손에 있나</b> — 몇 건인지는 안 묻는다. wait · fail · ok 셋만 답한다. */
function holdReady(s){
  /* 통이 아예 없다 — <b>모른다</b>. 「없다」 고 답하지 않는다 (1번) */
  if(!s||typeof s!=='object')return 'wait';
  /* 못 받은 것이 먼저다 — 담는 통들은 실패해도 loaded 를 켠다(다 끝났다는 뜻).
     loaded 를 먼저 보면 <b>실패를 「다 왔다」 로 읽는다</b> (1번). */
  if(s.err)return 'fail';
  /* 이미 왔으면 지금 딴 일(AI 글쓰기 같은 것)로 busy 여도 손에는 있다.
     busy 만 보고 뼈대를 세우면, 있는 자료를 덮어 <b>화면이 뒷걸음질</b>친다. */
  if(s.loaded)return 'ok';
  return 'wait';
}
/* <b>손에 있나 + 몇 건인가</b> — 있는데 0건일 때만 none 이다 */
function holdOf(s,n){
  var r=holdReady(s);
  if(r!=='ok')return r;
  return (n>0)?'ok':'none';
}
/* 여럿을 한꺼번에 — <b>제일 나쁜 것</b>이 답이다.
   하나라도 아직이면 아직이고, 아직이 없는데 하나라도 못 받았으면 못 받은 것이다.
   「셋 중 둘만 왔으니 반쯤 맞다」 는 화면은 없다 — 반쯤 맞는 숫자가 제일 위험하다. */
var HOLD_RANK={wait:3,fail:2,none:1,ok:0};
function holdAll(L){
  var w='ok',i,v;
  for(i=0;i<(L||[]).length;i++){
    v=L[i]; if(!v)continue;
    if(HOLD_RANK[v]>HOLD_RANK[w])w=v;
  }
  return w;
}
/* ── <b>조사</b>는 받침을 보고 고른다 ─────────────────────────────
   「오늘 챙길 것<b>를</b>」 이라고 찍혔습니다. 이름을 넣어 만드는 글에 조사를
   박아 두면 반드시 이렇게 됩니다. 「것이(가)」 처럼 둘 다 적는 것도 안 됩니다 —
   고객 앞에 띄우는 화면입니다. 받침이 있으면 을·이, 없으면 를·가입니다. */
function holdJong(w){
  var t=String(w==null?'':w).replace(/<[^>]*>/g,''),c;
  if(!t)return false;
  c=t.charCodeAt(t.length-1);
  if(!(c>=0xAC00&&c<=0xD7A3))return false;   /* 한글이 아니면 <b>모른다</b> — 짐작해 붙이지 않는다 */
  return ((c-0xAC00)%28)!==0;
}
function holdEul(w){ return esc(w)+(holdJong(w)?'을':'를'); }
function holdIga(w){ return esc(w)+(holdJong(w)?'이':'가'); }

/* ── 뼈대 ──────────────────────────────────────────────────────────
   <b>올 것의 모양</b>을 회색으로 세워 둡니다. 글자를 안 적습니다 —
   「불러오는 중」 이라고 적어 두면 그것도 읽을 거리가 되어 눈이 갑니다. */
function holdSkel(n){
  var h='<div class="hold-sk" aria-hidden="true">',i;
  n=n||3;
  for(i=0;i<n;i++)h+='<div class="hold-skr"><span class="hold-skc"></span>'+
    '<span class="hold-skm"><i style="width:'+(46+(i%3)*16)+'%"></i><i style="width:'+(70-(i%3)*12)+'%"></i></span></div>';
  return h+'</div>';
}
/* ── 세 화면 ───────────────────────────────────────────────────────
   o.what  무엇을 기다리나 (「오늘 챙길 것」)
   o.fill  무엇이 채우나   (「고객을 넣으면 여기에 섭니다」)
   o.goT/o.go  채우러 가는 자리 — 없으면 단추를 안 세운다 (8번)
   o.again  다시 부르는 함수 이름 — 없으면 단추를 안 세운다
   o.why   못 받은 까닭 (서버가 준 말 그대로)                          */
function holdSay(st,o){
  o=o||{};
  var F=HOLD_VIEW[st];
  return F?F(o):'';
}
/* o.said — <b>머리줄에서 이미 말했다</b>는 뜻입니다. 홈처럼 h2 가 상태를
   먼저 적는 자리에서 여기가 또 적으면 <b>같은 문장이 한 카드에 두 번</b>
   섭니다. 두 번 적힌 말은 한 번도 안 읽힙니다.                          */
var HOLD_VIEW={
  wait:function(o){
    return '<div class="hold-w">'+holdSkel(o.n||3)+
      (o.said?'':('<div class="hold-n">'+holdEul(o.what||'자료')+' <b>읽는 중</b>입니다 — 아직 「없다」는 뜻이 아닙니다.</div>'))+'</div>';
  },
  fail:function(o){
    return '<div class="hold-b hold-fail">'+
      (o.said?'':('<div class="hold-t">⚠️ '+holdEul(o.what||'자료')+' <b>못 받았습니다</b></div>'+
        '<div class="hold-m">그래서 <b>몇 건인지 지금은 모릅니다</b> — 0건이라는 뜻이 아닙니다.</div>'))+
      (o.why?('<div class="hold-m"><span class="hold-y">서버가 준 말: '+esc(o.why)+'</span></div>'):'')+
      (o.again?('<button type="button" class="hold-go" onclick="'+o.again+'">↻ 다시 읽기</button>'):'')+'</div>';
  },
  none:function(o){
    return '<div class="hold-b hold-none">'+
      (o.said?'':('<div class="hold-t">✅ '+holdIga(o.what||'자료')+' <b>없습니다</b></div>'))+
      '<div class="hold-m">'+(o.fill?esc(o.fill):'')+'</div>'+
      (o.go?('<button type="button" class="hold-go" onclick="'+o.go+'">'+esc(o.goT||'채우러 가기')+' ›</button>'):'')+'</div>';
  }
};
/* 옷은 <b>한 번만</b> 입힙니다 — 쓰는 화면마다 부릅니다 (5번) */
function holdCss(){
  if(document.getElementById('holdCssTag'))return;
  var st=document.createElement('style');st.id='holdCssTag';
  /* ★ <b>토큰에 대체값을 답니다.</b> 본체(app/index.html)에는 :root 에 계단이
     있지만 <b>DB 통합 CRM 에는 없습니다.</b> 대체값 없이 var(--ink-7) 이라고
     적으면 그 줄이 통째로 무효가 되어 <b>뼈대가 투명하게</b> 섭니다 — 화면은
     멀쩡한데 아무것도 안 보이는, 제일 찾기 어려운 고장입니다.
     여기 적은 값은 본체 :root 의 값과 같습니다. */
  st.textContent=
   '.hold-sk{display:flex;flex-direction:column;gap:10px;margin:2px 0 10px}'+
   '.hold-skr{display:flex;align-items:center;gap:11px}'+
   '.hold-skc{flex:none;width:34px;height:34px;border-radius:var(--r-sm,8px);background:var(--ink-7,#E9EAEC);'+
     'animation:holdBreath 1.4s ease-in-out infinite}'+
   '.hold-skm{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}'+
   '.hold-skm i{display:block;height:11px;border-radius:var(--r-xs,6px);background:var(--ink-7,#E9EAEC);'+
     'animation:holdBreath 1.4s ease-in-out infinite}'+
   '.hold-skm i+i{height:9px;opacity:.65}'+
   '@keyframes holdBreath{0%,100%{opacity:.42}50%{opacity:.9}}'+
   '@media(prefers-reduced-motion:reduce){.hold-skc,.hold-skm i{animation:none;opacity:.55}}'+
   '.hold-n{font-size:var(--t6,13px);color:var(--ink-4,#6B7280);line-height:1.6;font-weight:600}'+
   '.hold-b{border-radius:var(--r-md,16px);padding:14px 15px;line-height:1.65}'+
   '.hold-none{background:#F6F8FB;border:1px solid var(--ink-7,#E9EAEC)}'+
   '.hold-fail{background:#FEF3F2;border:1px solid #FECDCA}'+
   '.hold-t{font-size:var(--t4,15px);font-weight:800;letter-spacing:-.02em;color:var(--ink-1,#0D1117);margin-bottom:5px}'+
   '.hold-fail .hold-t{color:#B42318}'+
   '.hold-m{font-size:var(--t6,13px);color:var(--ink-3,#374151);font-weight:600}'+
   '.hold-y{display:inline-block;margin-top:4px;font-size:var(--t6,13px);color:var(--ink-5,#9CA3AF);font-weight:600;word-break:break-all}'+
   '.hold-go{margin-top:11px;min-height:44px;padding:0 16px;border-radius:var(--r-pill,999px);'+
     'border:1px solid var(--primary,#1A56DB);background:#fff;color:var(--primary,#1A56DB);'+
     'font-size:var(--t5,14px);font-weight:800;letter-spacing:-.02em;cursor:pointer}'+
   '.hold-fail .hold-go{border-color:#B42318;color:#B42318}'+
   '.hold-go:hover{background:#F5F9FF}';
  document.head.appendChild(st);
}

/* 바깥으로 내보내는 것 — <b>이름을 그대로</b> 씁니다. 두 화면이 같은 이름으로
   부르므로, 이름을 바꾸면 한쪽만 고치는 일이 없습니다. */
g.holdReady = holdReady;
g.holdOf    = holdOf;
g.holdAll   = holdAll;
g.holdSkel  = holdSkel;
g.holdSay   = holdSay;
g.holdCss   = holdCss;
g.holdJong  = holdJong;
g.holdEul   = holdEul;
g.holdIga   = holdIga;
g.HOLD_VIEW = HOLD_VIEW;
g.HOLD_RANK = HOLD_RANK;

})(typeof window!=='undefined'?window:this);
