/* ══════════════════════════════════════════════════════════════════
   apex-care.js — 계약 다음 1·3·6·12개월

   계약이 되면 화면에서 끝난 것처럼 되어 있었습니다. 그런데 실제로
   깨지는 자리는 계약 다음입니다 — 2회차가 안 빠져서 실효되고, 증권을
   안 보내서 민원이 되고, 병원 다녀온 걸 청구 안 하고 넘어갑니다.

   그래서 계약일로부터 1·3·6·12개월이 되면 <b>원래 있던 「🔔 오늘의 알림」</b>
   에 같이 뜹니다. 새 화면을 만들지 않았습니다 — 매일 보는 자리에 떠야
   챙기게 됩니다. 왼쪽 메뉴의 알림 숫자도 같이 올라갑니다.

   db-crm.html 은 <script> 한 줄만 늘었습니다. renderTouch 를 감싸는
   방식이라 그 파일을 고치는 다른 작업과 부딪히지 않습니다.

   서버에 followup 칸이 없으면(migration_48 미실행) 알림은 그대로 뜨되
   「챙김」 표시만 이 브라우저에 남습니다.
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.__APEX_CARE__)return; window.__APEX_CARE__=1;

var q=function(id){return document.getElementById(id)};
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function say(m,ms){ try{ toast(m,ms) }catch(e){ console.log(m) } }

var HAS_CARE=false;          /* dbs.followup 칸이 있나 */
var LOCAL={};                /* 칸이 없을 때 이 브라우저에만 남기는 표시 */
try{ LOCAL=JSON.parse(localStorage.getItem("apexCareLocalV1")||"{}") }catch(e){ LOCAL={} }
var OPEN={};                 /* 펼쳐 둔 카드 */

/* ══════════════════════════════════════════════════════════════════
   무엇을 챙길 것인가

   지어낸 항목이 아니라, 이 시기에 실제로 깨지는 것들입니다.
   보험사·상품마다 다른 것은 「확인」으로 적었습니다 — 단정하지 않습니다.
   ══════════════════════════════════════════════════════════════════ */
var CARE=[
{ id:"m1", days:30, tag:"1개월", t:"계약을 굳히는 달",
  why:"여기서 흔들리면 2회차에서 깨집니다. 그리고 소개가 가장 잘 나오는 때이기도 합니다.",
  items:[
    "증권을 전달했는가 — 아직이면 오늘 보냅니다. 민원은 거의 여기서 시작합니다.",
    "1회차 보험료가 정상 출금됐는지 · 자동이체 계좌와 날짜가 맞는지",
    "청약철회(15일)는 지났고 품질보증해지(3개월)는 남았다는 것을 알고 계신지",
    "해피콜에서 답하신 내용과 실제로 설명드린 것이 어긋난 데 없는지",
    "보험사 앱 가입 · 보험금 청구하는 법을 한 번 알려 드렸는지",
    "가족 중에 같이 봐 드릴 분이 있는지 — 지금이 가장 말 꺼내기 좋습니다"
  ],
  msg:"○○님, APEX ●●입니다. 지난달 준비해 드린 보험 잘 들어갔는지 확인차 연락드립니다.\n"+
      "증권은 받아 보셨는지, 보험료는 정상적으로 빠졌는지만 한 번 봐 주시면 됩니다.\n"+
      "그리고 나중에 병원 가셨을 때 청구하는 법을 아직 안 알려 드린 것 같아서요. "+
      "1~2분이면 되니 편하실 때 알려 주시면 설명드리겠습니다." },

{ id:"m3", days:90, tag:"3개월", t:"품질보증 끝나기 전 마지막 점검",
  why:"설명이 어긋난 게 있으면 지금이 마지막입니다. 실효의 대부분은 2회차 미납에서 옵니다.",
  items:[
    "품질보증해지 기간(가입 후 3개월)이 끝납니다 — 찜찜한 게 있으면 지금 정리",
    "2·3회차 보험료가 빠졌는지 — 안 빠진 게 있으면 오늘 안에 처리",
    "그동안 병원 다녀오신 일이 있는지 → 있으면 청구를 대신 챙겨 드리기",
    "배우자·자녀 보장도 한 번 봐 드릴지 물어보기",
    "연락처·주소가 바뀌지 않았는지 (증권·안내문이 반송되면 그때부터 끊깁니다)"
  ],
  msg:"○○님, APEX ●●입니다. 가입하신 지 석 달째라 한 번 확인드립니다.\n"+
      "보험료는 계속 잘 빠지고 있는지, 그사이 병원 가신 일은 없으셨는지요.\n"+
      "가셨던 일이 있으면 청구되는 게 있는지 제가 대신 확인해 드리겠습니다. "+
      "영수증 없으셔도 되고, 병원 이름과 날짜만 알려 주시면 됩니다." },

{ id:"m6", days:180, tag:"6개월", t:"그동안 병원 간 일은 없었는지",
  why:"받을 수 있었는데 모르고 넘어간 돈이 여기서 가장 많이 나옵니다. 소개도 이때 나옵니다.",
  items:[
    "유지 상태 · 연체 없는지",
    "6개월 동안 병원·약 처방이 있었는지 → 미청구 보험금 확인",
    "소득·가족에 변화가 있었는지 (출산·이직·창업·이사·대출)",
    "자동차·화재 등 만기가 다가오는 다른 보험이 있는지",
    "소개 — 6개월이면 관계가 자리 잡습니다. 부담 없이 한 번 더"
  ],
  msg:"○○님, APEX ●●입니다. 반년이 지나 한 번 여쭙습니다.\n"+
      "그사이 병원 가시거나 약 드신 일 있으셨나요? 작은 것도 청구되는 경우가 많아서요.\n"+
      "그리고 이사나 직장 같은 변화가 있으셨으면 그것도 알려 주세요 — "+
      "바뀐 게 있으면 보장도 같이 봐야 맞습니다." },

{ id:"m12", days:365, tag:"1년", t:"한 해 정리와 갱신 예고",
  why:"갱신형 특약은 보험료가 오릅니다. 오르고 나서 말씀드리면 늦습니다.",
  items:[
    "연말정산 보험료 납입증명서 발급 방법 안내",
    "1년 치 보장 리뷰 — 갱신형 특약 보험료 인상 여부를 미리 알려 드리기",
    "실손 갱신·전환을 볼 시기인지 확인",
    "건강검진 결과가 나왔으면 그 내용으로 다시 점검",
    "13회차까지 왔습니다 — 여기까지 오면 계약이 자리 잡은 것입니다(내부 기준)",
    "다음 1년은 늘릴지 · 줄일지 · 그대로 둘지 셋 중 하나로 정리해 드리기"
  ],
  msg:"○○님, APEX ●●입니다. 벌써 1년이 됐습니다.\n"+
      "연말정산 하실 때 필요한 납입증명서 받는 법 알려 드리겠습니다.\n"+
      "그리고 1년마다 보험료가 조정되는 항목이 있어서, 내년에 어떻게 되는지 "+
      "미리 정리해서 알려 드리려 합니다. 바꾸실 게 없으면 없다고 말씀드립니다." }
];

/* ── 자잘한 것 ──────────────────────────────────────────────────── */
function myId(){ try{ return profile&&profile.id }catch(e){ return null } }
function findDb(id){ try{ return dbs.filter(function(d){return d.id===id})[0] }catch(e){ return null } }
function dayDiff(from){
  var d=new Date(from); if(isNaN(d))return null;
  d.setHours(0,0,0,0);
  var t=new Date(); t.setHours(0,0,0,0);
  return Math.round((t-d)/86400000);
}
/* 언제부터 세나 — 계약일이 먼저, 없으면 증권 전달일 */
function baseOf(d){ return (d&&(d.contracted_at||d.policy_sent_at))||"" }
function isWon(d){ var s=""; try{ s=stageOf(d) }catch(e){ s=(d&&d.stage)||"" }
  return s==="계약완료"||s==="증권전달" }

function doneMap(d){
  if(HAS_CARE){ var f=d&&d.followup; return (f&&typeof f==="object")?f:{} }
  return LOCAL[d.id]||{};
}
function markDone(d,mid){
  var now=new Date().toISOString().slice(0,10), me=myId();
  if(!HAS_CARE){
    LOCAL[d.id]=LOCAL[d.id]||{}; LOCAL[d.id][mid]={at:now,by:me};
    try{ localStorage.setItem("apexCareLocalV1",JSON.stringify(LOCAL)) }catch(e){}
    say("챙긴 것으로 표시했습니다. (서버에 칸이 없어 이 브라우저에만 남습니다 — migration_48)",6000);
    redraw(); return Promise.resolve();
  }
  var f=Object.assign({},doneMap(d)); f[mid]={at:now,by:me};
  return sb.from("dbs").update({followup:f}).eq("id",d.id).then(function(r){
    if(r&&r.error){ say("표시하지 못했습니다: "+(r.error.message||""),5000); return }
    d.followup=f;                       /* 화면을 먼저 맞춰 둔다 */
    say("챙긴 것으로 표시했습니다.");
    redraw();
  });
}

/* ── 지금 챙길 것 ───────────────────────────────────────────────
   계약일 + 30/90/180/365 일. 사흘 전부터 미리 띄웁니다.

   ★ 한 사람에 <b>한 장만</b> 띄웁니다 — 지금 와 있는 시점 하나입니다.
   1년 된 계약에 「1개월 점검」을 같이 띄우면 아무 쓸모가 없고, 이 기능을
   켜는 날 밀린 카드가 사람마다 네 장씩 쏟아집니다. 지나간 시점은 카드
   안에 한 줄로만 알려 주고 목록을 채우지 않습니다. */
function careItems(pid){
  var out=[];
  var list=[]; try{ list=dbs }catch(e){ return out }
  list.forEach(function(d){
    if(pid&&d.assigned_to!==pid)return;
    if(!isWon(d))return;
    var base=baseOf(d); if(!base)return;
    var age=dayDiff(base); if(age==null)return;
    var done=doneMap(d);
    var cur=null, passed=[];
    CARE.forEach(function(c){
      if(age < c.days-3)return;                /* 아직 멀었다 */
      if(cur)passed.push(cur.tag);             /* 앞의 것은 지나간 것 */
      cur=c;
    });
    if(!cur)return;
    if(done[cur.id])return;                    /* 지금 시점은 이미 챙겼다 */
    out.push({d:d,c:cur,age:age,late:age-cur.days,base:base,
              passed:passed.filter(function(t,i){ return !done[CARE[i].id] })});
  });
  out.sort(function(a,b){ return b.late-a.late });
  return out;
}
/* 계약일이 안 적힌 계약 — 이게 있으면 알림이 아예 안 뜬다 */
function noDateList(pid){
  var out=[]; var list=[]; try{ list=dbs }catch(e){ return out }
  list.forEach(function(d){
    if(pid&&d.assigned_to!==pid)return;
    if(isWon(d)&&!baseOf(d))out.push(d);
  });
  return out;
}

/* ── 화면 ───────────────────────────────────────────────────────── */
function styles(){
  if(q("careCss"))return;
  var s=document.createElement("style"); s.id="careCss";
  s.textContent=[
  ".cr-wrap{margin-bottom:15px}",
  ".cr-card{background:#fff;border:1px solid var(--line);border-left:5px solid var(--blue);",
    "border-radius:15px;padding:14px 16px;margin-bottom:9px}",
  ".cr-card.late{border-left-color:var(--red)}",
  ".cr-card.soon{border-left-color:var(--yellow)}",
  ".cr-hd{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}",
  ".cr-nm{font-weight:900;color:var(--navy);font-size:15px}",
  ".cr-nm small{display:block;font-weight:700;color:var(--muted);font-size:12px;margin-top:3px}",
  ".cr-gap{flex:1}",
  ".cr-acts{display:flex;gap:5px;flex-wrap:wrap}",
  ".cr-acts .btn{text-decoration:none}",
  ".cr-why{font-size:13px;color:var(--text);background:#f5f8fc;border-radius:10px;padding:9px 11px;margin-top:9px;line-height:1.6}",
  ".cr-body{margin-top:10px}",
  ".cr-li{display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-bottom:1px dashed #eef1f4;font-size:13px;line-height:1.6}",
  ".cr-li:last-child{border-bottom:0}",
  ".cr-li i{font-style:normal;color:var(--blue);font-weight:900;flex:none}",
  ".cr-msg{background:#f7f9fc;border:1px solid var(--line);border-radius:12px;padding:11px;margin-top:10px}",
  ".cr-msg .h{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:900;color:var(--navy);margin-bottom:6px}",
  ".cr-msg .b{font-size:13px;line-height:1.7;white-space:normal}",
  ".cr-none{background:#fff;border:1px solid var(--line);border-radius:15px;padding:16px;font-size:13px;color:var(--muted);line-height:1.6}"
  ].join("");
  document.head.appendChild(s);
}

function card(it){
  var d=it.d, c=it.c, id=d.id+"__"+c.id;
  var cls=it.late>=14?"late":(it.late<0?"soon":"");
  var when=it.late<0 ? ("<b>"+(-it.late)+"일 뒤</b>가 "+c.tag+"입니다")
         : (it.late===0 ? ("오늘이 <b>"+c.tag+"</b>입니다")
         : ("<b>"+c.tag+"</b>이 지난 지 "+it.late+"일 됐습니다"));
  var tel=(d.phone||"").replace(/[^0-9+]/g,"");
  var open=!!OPEN[id];
  var body="";
  if(open){
    body='<div class="cr-body">'+
      '<div class="cr-why">'+E(c.why)+'</div>'+
      c.items.map(function(x){ return '<div class="cr-li"><i>·</i><span>'+E(x)+'</span></div>' }).join("")+
      '<div class="cr-msg"><div class="h">보낼 문구'+
        '<button class="btn btn-light btn-sm" data-cp="'+id+'">복사</button></div>'+
        '<div class="b">'+E(msgFor(d,c)).replace(/\n/g,"<br>")+'</div></div>'+
      '</div>';
  }
  return '<div class="cr-card '+cls+'" data-cr="'+E(id)+'">'+
    '<div class="cr-hd">'+
      '<div class="cr-nm">'+E(d.customer_name)+
        '<small>계약 '+E(String(it.base).slice(0,10))+' · '+it.age+'일째 · '+E(d.region||"")+'</small></div>'+
      '<div class="cr-gap"></div>'+
      '<span class="badge '+(cls==="late"?"red":(cls==="soon"?"yellow":"blue"))+'">'+when.replace(/<\/?b>/g,"")+'</span>'+
    '</div>'+
    (it.passed&&it.passed.length
      ? '<div style="font-size:12px;color:var(--muted);margin-top:7px">'+
        E(it.passed.join(" · "))+' 시점은 지나갔습니다 — 지금 것만 챙기면 됩니다</div>'
      : "")+
    '<div class="cr-hd" style="margin-top:9px">'+
      '<div style="font-size:13px;color:var(--navy);font-weight:800">'+E(c.tag)+' — '+E(c.t)+'</div>'+
      '<div class="cr-gap"></div>'+
      '<div class="cr-acts">'+
        (tel?'<a class="btn btn-primary btn-sm" href="tel:'+E(tel)+'">📞 전화</a>':"")+
        '<button class="btn btn-light btn-sm" data-cr-open="'+E(id)+'">'+(open?"접기":"무엇을 챙기나")+'</button>'+
        '<button class="btn btn-dark btn-sm" data-cr-done="'+E(id)+'">✅ 챙겼습니다</button>'+
      '</div>'+
    '</div>'+
    body+
  '</div>';
}
function msgFor(d,c){
  var me=""; try{ me=profile.name||"" }catch(e){}
  return c.msg.replace(/○○/g,(d.customer_name||"고객")).replace(/●●/g,me);
}

function inject(){
  styles();
  var host=q("touchBody"); if(!host)return 0;
  var me=myId(); if(!me)return 0;
  var items=careItems(me), miss=noDateList(me);
  var old=q("careWrap"); if(old&&old.parentNode)old.parentNode.removeChild(old);
  if(!items.length&&!miss.length)return 0;

  var w=document.createElement("div");
  w.className="cr-wrap"; w.id="careWrap";
  var h="";
  if(items.length){
    h+='<div class="notice" style="margin-bottom:11px">'+
       '<b>계약 뒤에 챙길 것 '+items.length+'건</b> — 계약이 깨지는 자리는 계약 다음입니다. '+
       '위에서부터 처리하세요. 챙기면 목록에서 사라집니다.'+
       (HAS_CARE?"":'<br><small>※ 서버에 칸이 없어 「챙겼습니다」 표시가 <b>이 브라우저에만</b> 남습니다 — migration_48_care.sql</small>')+
       '</div>'+items.map(card).join("");
  }
  if(miss.length){
    h+='<div class="cr-none">계약인데 <b>계약일이 비어 있는 고객이 '+miss.length+'명</b> 있습니다 — '+
       miss.slice(0,5).map(function(d){return E(d.customer_name)}).join(" · ")+
       (miss.length>5?" 외 "+(miss.length-5)+"명":"")+
       '.<br>계약일을 채워야 1·3·6·12개월 알림이 뜹니다. DB 수정 창에서 <b>계약일</b>을 적어 주세요.</div>';
  }
  w.innerHTML=h;
  host.insertBefore(w,host.firstChild);

  Array.prototype.forEach.call(w.querySelectorAll("[data-cr-open]"),function(b){
    b.onclick=function(){ var k=b.getAttribute("data-cr-open"); OPEN[k]=!OPEN[k]; inject() };
  });
  Array.prototype.forEach.call(w.querySelectorAll("[data-cp]"),function(b){
    b.onclick=function(){
      var p=b.getAttribute("data-cp").split("__"), d=findDb(p[0]);
      var c=CARE.filter(function(x){return x.id===p[1]})[0];
      if(d&&c&&window.copyText)copyText(msgFor(d,c));
    };
  });
  Array.prototype.forEach.call(w.querySelectorAll("[data-cr-done]"),function(b){
    b.onclick=function(){
      var p=b.getAttribute("data-cr-done").split("__"), d=findDb(p[0]);
      if(!d)return;
      b.disabled=true; b.textContent="표시 중…";
      markDone(d,p[1]);
    };
  });
  return items.length;
}

/* 왼쪽 메뉴의 알림 숫자에 우리 것도 더한다 — 그래야 실제로 「울립니다」 */
function bumpBadge(n){
  var b=q("touchBadge"); if(!b)return;
  var base=+(b.getAttribute("data-base")||"0");
  if(!b.getAttribute("data-base")) base=+(b.textContent||"0")||0;
  b.setAttribute("data-base",String(base));
  var total=base+n;
  b.textContent=String(total);
  b.classList.toggle("hidden",!total);
}
function redraw(){ try{ bumpBadge(inject()) }catch(e){ console.log(e) } }

/* ── 원래 화면을 감싼다 ─────────────────────────────────────────── */
var origRenderTouch=window.renderTouch;
if(typeof origRenderTouch==="function"){
  window.renderTouch=function(){
    var b=q("touchBadge"); if(b)b.removeAttribute("data-base");
    var r=origRenderTouch.apply(this,arguments);
    redraw();
    return r;
  };
}

/* ── CS 로 올리면 「계약되면 이렇게 관리합니다」를 한 번 보여 준다 ──
   계약 전에 미리 알고 있어야 계약 자리에서 말이 나옵니다. */
function preview(dbId){
  styles();
  var d=findDb(dbId); if(!d)return;
  var m=q("carePv");
  if(!m){
    m=document.createElement("div");
    m.className="modal"; m.id="carePv";
    m.innerHTML='<div class="modal-box" style="width:min(720px,100%)">'+
      '<div class="modal-head"><h3 id="carePvT">계약되면 이렇게 관리합니다</h3>'+
        '<button class="close" id="carePvX">×</button></div>'+
      '<div class="modal-body" id="carePvB"></div>'+
      '<div class="modal-foot"><button class="btn btn-primary" id="carePvC">알겠습니다</button></div>'+
      '</div>';
    document.body.appendChild(m);
    var c=function(){ m.classList.remove("open") };
    q("carePvX").onclick=c; q("carePvC").onclick=c;
  }
  q("carePvT").textContent=(d.customer_name||"이 고객")+" — 계약되면 이렇게 관리합니다";
  q("carePvB").innerHTML=
    '<div class="notice" style="margin-bottom:13px">'+
      '계약일을 적어 두면 아래 네 번이 <b>「🔔 오늘의 알림」에 저절로</b> 뜹니다. '+
      '계약 자리에서 이 이야기를 먼저 해 두면 고객이 전화를 기다립니다.</div>'+
    CARE.map(function(c){
      return '<div class="cr-card" style="border-left-color:var(--blue)">'+
        '<div class="cr-nm">'+E(c.tag)+' — '+E(c.t)+'<small>'+E(c.why)+'</small></div>'+
        '<div class="cr-body">'+c.items.slice(0,3).map(function(x){
          return '<div class="cr-li"><i>·</i><span>'+E(x)+'</span></div>' }).join("")+
        (c.items.length>3?'<div class="cr-li"><i>·</i><span style="color:var(--muted)">외 '+
          (c.items.length-3)+'가지</span></div>':"")+'</div></div>';
    }).join("");
  m.classList.add("open");
}
window.apexCarePreview=preview;

/* ── 시작 ───────────────────────────────────────────────────────── */
function boot(){
  Promise.resolve()
    .then(function(){ return sb.from("dbs").select("id,followup").limit(1) })
    .then(function(r){ HAS_CARE=!(r&&r.error) })
    .catch(function(){ HAS_CARE=false })
    .then(function(){
      if(!HAS_CARE)console.log("[apex-care] followup 칸이 없습니다 — migration_48_care.sql 을 실행하면 서버에 남습니다.");
      redraw();
    });
}
var tries=0;
(function ready(){
  var ok=false;
  try{ ok=!!(sb&&profile&&profile.id&&typeof stageOf==="function") }catch(e){ ok=false }
  if(ok)return boot();
  if(tries++<600)setTimeout(ready,600);
})();

})();
