/* ══════════════════════════════════════════════════════════════════
   apex-route.js — 지역 동선

   하고 싶었던 일은 두 가지입니다.

   ① AP 를 하나 잡으면, 그 지역에 사는 사람 열 명에게 바로 걸어서
      「가는 김에」로 약속을 더 붙인다. 한 번 가는 길에 한 명만 만나고
      오는 것이 가장 아까운 일이었습니다.
   ② 그날 잡힌 약속들을 지도에 올려 놓고, 어느 순서로 돌면 길에서
      버리는 시간이 가장 적은지 본다.

   db-crm.html 은 한 줄(<script src>)만 늘었습니다. 나머지는 전부
   여기서 원래 함수를 감싸는 방식으로 붙습니다 — 그래야 같은 파일을
   고치는 다른 작업과 부딪히지 않습니다.

   서버에 칸이 없으면(migration_46 미실행) 조용히 물러납니다.
   지금까지 쓰던 화면은 그대로 돌아갑니다.
   ══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.__APEX_ROUTE__)return; window.__APEX_ROUTE__=1;

/* ── 원래 화면이 이미 만들어 둔 것들 ─────────────────────────────
   $ · esc · fmt · toast · dbs · calls · profiles · profile · sb ·
   stageOf · nextAppt · getCalls · result · pname · openCall · loadAll
   전부 db-crm.html 안에 있습니다. 여기서는 빌려 씁니다. */
var q=function(id){return document.getElementById(id)};
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function say(m,ms){ try{ toast(m,ms) }catch(e){ console.log(m) } }

/* ── 상태 ───────────────────────────────────────────────────────── */
var HAS_DB=false;        /* dbs 에 addr/lat/lng 칸이 있나 */
var HAS_CALL=false;      /* calls 에 appt_place 칸이 있나 */
var KEY="";              /* 카카오 JavaScript 키 */
var KEY_TEAM=false;      /* 팀이 같이 쓰는 키인가(app_config) */
var GC=null, PS=null;    /* 카카오 주소검색 · 장소검색 */
var MAP=null, OVERLAY=[];
var CACHE={}; try{ CACHE=JSON.parse(localStorage.getItem("apexGeoCacheV1")||"{}") }catch(e){ CACHE={} }
var HOME=null;  try{ HOME=JSON.parse(localStorage.getItem("apexRouteHomeV1")||"null") }catch(e){}
var STAY=+(localStorage.getItem("apexRouteStayV1")||60);   /* 한 건 상담에 쓰는 시간(분) */

/* ── 자잘한 셈 ──────────────────────────────────────────────────── */
function norm(s){return String(s==null?"":s).replace(/\s+/g,"").toLowerCase()}
function myId(){ try{ return profile&&profile.id }catch(e){ return null } }
function findDb(id){ try{ return dbs.filter(function(d){return d.id===id})[0] }catch(e){ return null } }

/* 두 점 사이 직선거리(km) */
function hav(a,b){
  if(!a||!b)return null;
  var R=6371, r=Math.PI/180;
  var dLa=(b.lat-a.lat)*r, dLo=(b.lng-a.lng)*r;
  var x=Math.sin(dLa/2)*Math.sin(dLa/2)+
        Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
/* 직선거리를 「차로 몇 분」으로 어림한다.
   실제 길찾기가 아니라 어림입니다 — 직선의 1.35배를 시속 28km 로 달리고,
   주차하고 걸어 들어가는 데 4분을 더합니다. 화면에도 어림이라고 적습니다. */
function mins(km){ if(km==null)return null; return Math.max(5, Math.round(km*1.35/28*60)+4) }
function kmTxt(km){ return km==null?"-":(km<1?Math.round(km*1000)+"m":km.toFixed(1)+"km") }
function pad(n){return (n<10?"0":"")+n}
function hm(d){ return pad(d.getHours())+":"+pad(d.getMinutes()) }
function dayKey(v){ var d=new Date(v); if(isNaN(d))return ""; return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()) }
function todayKey(){ return dayKey(new Date()) }
function wday(d){ return "일월화수목금토".charAt(d.getDay()) }

/* 그 사람을 지도 어디에 찍을까 — 약속 장소가 먼저, 없으면 사는 동네 */
function ptOf(d){
  if(!d)return null;
  if(d.next_appt_lat&&d.next_appt_lng) return {lat:+d.next_appt_lat,lng:+d.next_appt_lng,label:d.next_appt_place||d.addr||""};
  if(d.lat&&d.lng) return {lat:+d.lat,lng:+d.lng,label:d.addr||""};
  return null;
}
function placeOf(d){ return (d&&(d.next_appt_place||d.addr))||"" }

/* ── 카카오 키 ──────────────────────────────────────────────────── */
function keyLoad(){
  try{ KEY=localStorage.getItem("apexKakaoKeyV1")||"" }catch(e){}
  return Promise.resolve()
    .then(function(){ return sb.from("app_config").select("value").eq("key","kakao_js_key").maybeSingle() })
    .then(function(r){ if(r&&!r.error&&r.data&&(r.data.value||"").trim()){ KEY=r.data.value.trim(); KEY_TEAM=true } })
    .catch(function(){});
}
function keySave(v){
  v=(v||"").trim();
  try{ localStorage.setItem("apexKakaoKeyV1",v) }catch(e){}
  KEY=v;
  /* 대표면 팀 전체가 같이 쓰게 서버에도 올린다. 권한이 없으면 조용히 넘어간다. */
  return Promise.resolve()
    .then(function(){ return sb.from("app_config").upsert({key:"kakao_js_key",value:v},{onConflict:"key"}) })
    .then(function(r){ if(r&&!r.error) KEY_TEAM=true })
    .catch(function(){});
}

/* ── 카카오 지도 SDK ────────────────────────────────────────────── */
var sdkP=null;
function sdk(){
  if(window.kakao&&window.kakao.maps&&window.kakao.maps.services){
    if(!GC){ GC=new kakao.maps.services.Geocoder(); PS=new kakao.maps.services.Places() }
    return Promise.resolve();
  }
  if(sdkP)return sdkP;
  if(!KEY)return Promise.reject(new Error("NOKEY"));
  sdkP=new Promise(function(res,rej){
    var s=document.createElement("script");
    s.src="https://dapi.kakao.com/v2/maps/sdk.js?appkey="+encodeURIComponent(KEY)+"&libraries=services&autoload=false";
    s.onload=function(){
      try{ kakao.maps.load(function(){
        GC=new kakao.maps.services.Geocoder(); PS=new kakao.maps.services.Places(); res();
      }) }catch(e){ rej(e) }
    };
    s.onerror=function(){ sdkP=null; rej(new Error("LOAD")) };
    document.head.appendChild(s);
  });
  return sdkP;
}

/* ── 주소 → 좌표 ────────────────────────────────────────────────
   주소로 먼저 찾고, 안 나오면 장소 이름으로 다시 찾습니다.
   「조례동 스타벅스」 처럼 적어도 잡히게 하려는 것입니다.
   한 번 찾은 것은 브라우저에 적어 두고 다시 묻지 않습니다. */
function keyOf(t,region){ var s=String(t||"").trim(); return (region&&s.indexOf(region)<0?region+" ":"")+s }
function saveCache(k,v){ CACHE[k]=v; try{ localStorage.setItem("apexGeoCacheV1",JSON.stringify(CACHE)) }catch(e){} return v }
function geo(text,region){
  var k=keyOf(text,region);
  if(!String(text||"").trim())return Promise.resolve(null);
  if(CACHE[k])return Promise.resolve(CACHE[k]);
  return sdk().then(function(){
    return new Promise(function(res){
      var done=false, t=setTimeout(function(){ if(!done){done=true;res(null)} },7000);
      GC.addressSearch(k,function(r,st){
        if(done)return;
        if(st===kakao.maps.services.Status.OK&&r&&r[0]){
          done=true;clearTimeout(t);
          return res(saveCache(k,{lat:+r[0].y,lng:+r[0].x,label:r[0].address_name}));
        }
        PS.keywordSearch(k,function(r2,st2){
          if(done)return; done=true; clearTimeout(t);
          if(st2===kakao.maps.services.Status.OK&&r2&&r2[0]){
            return res(saveCache(k,{lat:+r2[0].y,lng:+r2[0].x,
              label:r2[0].place_name+(r2[0].road_address_name?" · "+r2[0].road_address_name:"")}));
          }
          res(null);
        });
      });
    });
  }).catch(function(){ return null });
}

/* ── 서버에 칸이 있는지 한 번만 물어본다 ─────────────────────────
   없으면 위치 기능만 접어 두고, 원래 화면은 그대로 돌아갑니다. */
function probe(){
  return Promise.all([
    sb.from("dbs").select("id,addr,lat,lng,next_appt_place,next_appt_lat,next_appt_lng").limit(1)
      .then(function(r){ HAS_DB=!r.error }).catch(function(){ HAS_DB=false }),
    sb.from("calls").select("id,appt_place,appt_lat,appt_lng").limit(1)
      .then(function(r){ HAS_CALL=!r.error }).catch(function(){ HAS_CALL=false })
  ]);
}

/* 원래 저장 함수가 만드는 payload 에 칸 몇 개를 얹는다.
   저장 함수를 통째로 베껴 오면 다음에 그쪽이 바뀔 때 조용히 어긋납니다.
   그래서 저장이 도는 그 순간에만 sb.from 을 감싸고 곧바로 되돌립니다. */
function withPatch(table,extra,run){
  if(!extra||!Object.keys(extra).length) return Promise.resolve().then(run);
  var had=Object.prototype.hasOwnProperty.call(sb,"from"), orig=sb.from;
  sb.from=function(t){
    var b=orig.apply(sb,arguments);
    if(t!==table)return b;
    ["insert","update","upsert"].forEach(function(m){
      if(typeof b[m]!=="function")return;
      var om=b[m].bind(b);
      b[m]=function(p){
        var a=Array.prototype.slice.call(arguments);
        if(p&&typeof p==="object"&&!Array.isArray(p)) a[0]=Object.assign({},p,extra);
        return om.apply(null,a);
      };
    });
    return b;
  };
  function undo(){ if(had)sb.from=orig; else delete sb.from }
  return Promise.resolve().then(run).then(
    function(v){ undo(); return v },
    function(e){ undo(); throw e }
  );
}

/* ── 입력 칸 두 개를 원래 창에 끼워 넣는다 ───────────────────────
   ① DB 등록 창 : 지역 밑에 「동네·상세위치」
   ② 통화 기록 창 : 상담 약속일시 밑에 「만날 장소」 */
function injectFields(){
  var rg=q("region");
  if(HAS_DB&&rg&&!q("dbAddr")){
    var f=document.createElement("div");
    f.className="field";
    f.innerHTML='<label>동네·상세위치 <small style="font-weight:600;color:#8b95a1">지도·동선에 씁니다</small></label>'+
      '<input id="dbAddr" placeholder="조례동 / 순천시 조례동 한아름아파트">';
    rg.parentNode.parentNode.insertBefore(f,rg.parentNode.nextSibling);
  }
  var af=q("appointmentField");
  if(HAS_CALL&&af&&!q("apptPlace")){
    var g=document.createElement("div");
    g.className="field hidden"; g.id="apptPlaceField";
    g.innerHTML='<label>만날 장소 <small style="font-weight:600;color:#8b95a1">지도에 이 점이 찍힙니다</small></label>'+
      '<input id="apptPlace" placeholder="조례동 스타벅스 / 고객 자택">';
    af.parentNode.insertBefore(g,af.nextSibling);
  }
  var ta=document.querySelector(".top-actions");
  if(ta&&!q("rtBtn")){
    var b=document.createElement("button");
    b.id="rtBtn"; b.className="btn btn-dark"; b.textContent="🗺️ 지역 동선";
    b.onclick=function(){ routeOpen() };
    ta.insertBefore(b,ta.firstChild);
  }
}

/* 상담을 고르면 장소 칸도 같이 열린다 */
var origToggle=window.toggleAppointment;
if(typeof origToggle==="function"){
  window.toggleAppointment=function(){
    var r=origToggle.apply(this,arguments);
    var af=q("appointmentField"), pf=q("apptPlaceField");
    if(af&&pf) pf.classList.toggle("hidden",af.classList.contains("hidden"));
    return r;
  };
}

/* ── DB 저장 — 동네를 좌표까지 바꿔서 같이 넣는다 ────────────── */
var origOpenDb=window.openDb;
if(typeof origOpenDb==="function"){
  window.openDb=function(id){
    var r=origOpenDb.apply(this,arguments);
    injectFields();
    var d=id?findDb(id):null;
    if(q("dbAddr")) q("dbAddr").value=(d&&d.addr)||"";
    return r;
  };
}
var origSaveDb=window.saveDb;
if(typeof origSaveDb==="function"){
  window.saveDb=function(){
    var self=this, args=arguments;
    if(!HAS_DB||!q("dbAddr")) return origSaveDb.apply(self,args);
    var t=(q("dbAddr").value||"").trim(), region=((q("region")||{}).value||"").trim();
    var extra={addr:t||null,lat:null,lng:null};
    return (t?geo(t,region):Promise.resolve(null)).then(function(p){
      if(p){ extra.lat=p.lat; extra.lng=p.lng }
      return withPatch("dbs",extra,function(){ return origSaveDb.apply(self,args) });
    });
  };
}

/* ── 통화 저장 — 장소를 같이 넣고, AP 면 바로 「이 지역 열 명」 ── */
var origOpenCall=window.openCall;
if(typeof origOpenCall==="function"){
  window.openCall=function(id){
    var r=origOpenCall.apply(this,arguments);
    injectFields();
    var d=findDb(id);
    if(q("apptPlace")) q("apptPlace").value=(d&&d.next_appt_place)||(d&&d.addr)||"";
    if(window.toggleAppointment) window.toggleAppointment();
    return r;
  };
}
var origSaveCall=window.saveCall;
if(typeof origSaveCall==="function"){
  window.saveCall=function(){
    var self=this, args=arguments;
    var dbId=((q("callDbId")||{}).value)||"";
    var res=((q("callResult")||{}).value)||"";
    var app=((q("appointmentAt")||{}).value)||"";
    var place=((q("apptPlace")||{}).value||"").trim();
    var extra={}, pre=Promise.resolve(null);
    var d=findDb(dbId);
    if(HAS_CALL&&res==="상담"){
      extra.appt_place=place||null; extra.appt_lat=null; extra.appt_lng=null;
      if(place) pre=geo(place,(d&&d.region)||"");
    }
    return pre.then(function(p){
      if(p){ extra.appt_lat=p.lat; extra.appt_lng=p.lng }
      return withPatch("calls",extra,function(){ return origSaveCall.apply(self,args) });
    }).then(function(v){
      /* 저장이 실제로 끝났으면 창이 닫혀 있습니다 */
      var closed=q("callModal")&&!q("callModal").classList.contains("open");
      if(res==="상담"&&app&&closed&&d) setTimeout(function(){ nearOpen(dbId,app) },300);
      return v;
    });
  };
}

/* ══════════════════════════════════════════════════════════════════
   ① AP 를 잡았다 → 그 지역 열 명
   ══════════════════════════════════════════════════════════════════ */

/* 누구부터 걸까 — 오래 방치된 사람 · 덜 걸어본 사람 · 가까운 사람 순.
   이미 약속이 있거나, 거절했거나, 계약까지 끝난 사람은 뺍니다. */
function candidates(d0,when,limit){
  var rg=norm(d0.region), now=Date.now(), p0=ptOf(d0), out=[];
  if(!rg)return out;
  dbs.forEach(function(d){
    if(d.id===d0.id)return;
    if(norm(d.region)!==rg)return;
    if(d.assigned_to!==d0.assigned_to)return;
    var s=stageOf(d);
    if(s==="계약완료"||s==="증권전달")return;
    if(nextAppt(d))return;
    if(result(d)==="거절")return;
    var cs=getCalls(d.id), last=cs[0], n=cs.length;
    var base=last?last.call_at:(d.assigned_date||d.created_at);
    var since=base?(now-new Date(base))/864e5:30;
    if(isNaN(since))since=30;
    var sc=Math.min(since,120)*1.0+Math.max(0,5-n)*6+(n===0?12:0);
    var p1=ptOf(d), km=(p0&&p1)?hav(p0,p1):null;
    if(km!=null)sc+=Math.max(0,18-km*3);
    out.push({d:d,score:sc,days:Math.round(since),n:n,km:km});
  });
  out.sort(function(a,b){return b.score-a.score});
  return out.slice(0,limit||10);
}

function ampm(d){var h=d.getHours(),m=d.getMinutes();return (h<12?"오전 ":"오후 ")+(h%12||12)+"시"+(m?" "+m+"분":"")}
/* 받침을 보고 조사를 고른다 — 「3시이나」 같은 말이 나가지 않게 */
function jong(s){ s=String(s||""); var c=s.charCodeAt(s.length-1);
  return (c>=0xAC00&&c<=0xD7A3)?((c-0xAC00)%28)>0:false }
function josa(s,withJ,without){ return s+(jong(s)?withJ:without) }
/* 그 약속 앞뒤로 비는 시간 두 개를 권한다 */
function slots(when){
  var a=new Date(when), g=(STAY+30)*60000;
  function r30(d){var m=d.getMinutes();d.setMinutes(m<15?0:(m<45?30:60),0,0);return d}
  var b=r30(new Date(a.getTime()-g)), c=r30(new Date(a.getTime()+g)), out=[];
  if(b.getHours()>=9)out.push(b);
  if(c.getHours()<20)out.push(c);
  if(!out.length)out.push(r30(new Date(a.getTime()+g*2)));
  return out;
}

/* 화법 — 없는 마감·없는 혜택을 만들지 않고, 안 바꿔도 된다는 말을 남깁니다.
   (원래 화면의 TA 스크립트가 지키는 것 셋과 같은 기준입니다) */
function talk(cand,d0,when,kind){
  var a=new Date(when), day=(a.getMonth()+1)+"월 "+a.getDate()+"일 "+wday(a)+"요일";
  var s=slots(when), t1=ampm(s[0]), t2=s[1]?ampm(s[1]):null;
  var me=""; try{ me=profile.name||"" }catch(e){}
  var nm=(cand.customer_name||"고객"), who=nm+"님";
  var area=(d0.region||"그쪽")+(placeOf(d0)?" "+String(placeOf(d0)).split(" ")[0]:"");
  var ask=t2?(josa(t1,"이나","나")+" "+t2+" 중에 어느 쪽이 편하실까요?")
            :(josa(t1,"이","가")+" 편하실까요?");
  if(kind==="sms"){
    return who+" 안녕하세요, APEX "+me+"입니다.\n"+
      day+"에 "+area+" 쪽에 갈 일이 있어 연락드립니다. 가는 길에 잠깐 뵙고, "+
      "지금 들어 두신 보장에 빠진 데가 없는지만 봐 드리려 합니다. 10분이면 됩니다.\n"+
      ask+" 편하신 시간 알려 주시면 그때 맞춰 가겠습니다.";
  }
  if(kind==="b"){
    return who+" 안녕하세요, APEX "+me+"입니다. 잠깐 통화 괜찮으실까요?\n"+
      "다름이 아니라 "+day+"에 "+area+" 쪽에 볼일이 있어 갑니다.\n"+
      "가입해 두신 보험에서 청구 안 하고 넘어가신 게 있는지 한번 봐 드리려고요. "+
      "서류 미리 준비하실 것 없고, 없으면 없다고 말씀드립니다. 10분이면 끝납니다.\n"+ask;
  }
  return who+" 안녕하세요, APEX "+me+"입니다. 잠깐 통화 괜찮으실까요?\n"+
    "제가 "+day+"에 "+area+" 쪽에 갈 일이 있어서 연락드렸습니다.\n"+
    "가는 길에 잠깐 들러서, 지금 가입해 두신 보장에 빠진 데가 없는지만 같이 보려고 합니다. "+
    "새로 뭘 권해 드리려는 게 아니고, 안 바꾸셔도 되면 그렇게 말씀드립니다. 10분이면 됩니다.\n"+ask;
}

function tCard(t,body){
  return '<div class="rt-t"><div class="rt-th">'+E(t)+
    '<button class="btn btn-light btn-sm" data-copy="'+E(body)+'">복사</button></div>'+
    '<div class="rt-tb">'+E(body).replace(/\n/g,"<br>")+'</div></div>';
}

function nearModal(){
  if(q("rtNear"))return;
  var m=document.createElement("div");
  m.className="modal"; m.id="rtNear";
  m.innerHTML=
    '<div class="modal-box" style="width:min(900px,100%)">'+
      '<div class="modal-head"><h3 id="rtNearT">이 지역, 지금 걸 사람</h3>'+
        '<button class="close" id="rtNearX">×</button></div>'+
      '<div class="modal-body" id="rtNearB"></div>'+
      '<div class="modal-foot">'+
        '<button class="btn btn-light" id="rtNearL">나중에</button>'+
        '<button class="btn btn-dark" id="rtNearMap">🗺️ 이날 동선 보기</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(m);
  var close=function(){ m.classList.remove("open") };
  q("rtNearX").onclick=close; q("rtNearL").onclick=close;
}

function nearOpen(dbId,when){
  var d0=findDb(dbId); if(!d0)return;
  nearModal();
  var list=candidates(d0,when,10);
  var a=new Date(when), day=(a.getMonth()+1)+"월 "+a.getDate()+"일("+wday(a)+") "+hm(a);
  q("rtNearT").innerHTML="📍 "+E(d0.region||"지역")+" — "+E(day)+" 약속이 잡혔습니다";
  var head=
    '<div class="notice" style="margin-bottom:14px">'+
      '<b>'+E(d0.customer_name)+'</b> 님 한 건 때문에 '+E(d0.region||"그 지역")+'까지 갑니다. '+
      '가는 김에 <b>2~3명만 더</b> 붙이면 하루가 채워집니다.<br>'+
      '아래는 같은 지역에서 <b>아직 약속이 없고 · 거절하지 않은</b> 사람을 '+
      '오래 방치된 순 · 덜 걸어본 순 · 가까운 순으로 섞어 뽑은 열 명입니다.'+
    '</div>';
  if(!list.length){
    q("rtNearB").innerHTML=head+'<div class="empty">같은 지역에 아직 걸 사람이 없습니다.<br>'+
      'DB 등록 창의 <b>지역</b> 칸을 「'+E(d0.region||"순천")+'」로 맞춰 두면 여기에 모입니다.</div>';
  }else{
    var rows=list.map(function(c,i){
      var d=c.d, tel=(d.phone||"").replace(/[^0-9+]/g,"");
      var bg=c.n===0?'<span class="badge yellow">한 번도 안 걺</span>'
                    :'<span class="badge gray">'+c.n+'회 접촉</span>';
      var far=c.km!=null?'<span class="badge blue" style="margin-left:4px">'+kmTxt(c.km)+'</span>':"";
      return '<div class="rt-row">'+
        '<div class="rt-no">'+(i+1)+'</div>'+
        '<div class="rt-who"><b>'+E(d.customer_name)+'</b>'+
          '<small>'+E(d.phone||"연락처 없음")+(placeOf(d)?" · "+E(placeOf(d)):"")+'</small>'+
          '<div style="margin-top:5px">'+bg+far+
          '<span class="badge gray" style="margin-left:4px">'+c.days+'일째</span></div></div>'+
        '<div class="rt-act">'+
          (tel?'<a class="btn btn-primary btn-sm" href="tel:'+E(tel)+'">📞 전화</a>':"")+
          '<button class="btn btn-light btn-sm" data-talk="'+i+'">📋 화법</button>'+
          '<button class="btn btn-dark btn-sm" data-call="'+E(d.id)+'">약속 잡기</button>'+
        '</div>'+
        '<div class="rt-talk hidden" id="rtTalk'+i+'"></div>'+
      '</div>';
    }).join("");
    q("rtNearB").innerHTML=head+'<div class="rt-list">'+rows+'</div>';
    Array.prototype.forEach.call(q("rtNearB").querySelectorAll("[data-talk]"),function(b){
      b.onclick=function(){
        var i=+b.getAttribute("data-talk"), box=q("rtTalk"+i), c=list[i];
        if(box.getAttribute("data-on")==="1"){ box.classList.add("hidden"); box.setAttribute("data-on","0"); return }
        box.setAttribute("data-on","1"); box.classList.remove("hidden");
        box.innerHTML=tCard("전화 — 가는 김에",talk(c.d,d0,when,"a"))+
                      tCard("전화 — 못 받은 보험금",talk(c.d,d0,when,"b"))+
                      tCard("문자로 보낼 때",talk(c.d,d0,when,"sms"));
        Array.prototype.forEach.call(box.querySelectorAll("[data-copy]"),function(cb){
          cb.onclick=function(){ copyText(cb.getAttribute("data-copy")) };
        });
      };
    });
    Array.prototype.forEach.call(q("rtNearB").querySelectorAll("[data-call]"),function(b){
      b.onclick=function(){
        q("rtNear").classList.remove("open");
        if(window.openCall) window.openCall(b.getAttribute("data-call"));
      };
    });
  }
  q("rtNearMap").onclick=function(){
    q("rtNear").classList.remove("open");
    routeOpen(dayKey(when),d0.region);
  };
  q("rtNear").classList.add("open");
}

/* ══════════════════════════════════════════════════════════════════
   ② 그날 동선 — 지도 위에 올려 놓고 순서를 본다

   길찾기 서버를 부르지 않습니다(브라우저에서는 막혀 있습니다).
   직선거리를 1.35배 해서 시속 28km 로 달린 셈 치고 어림합니다.
   그래서 화면에도 「어림」이라고 적어 둡니다 — 실제 출발 전에는
   카카오맵 길찾기를 한 번 눌러 확인하십시오.
   ══════════════════════════════════════════════════════════════════ */

function styles(){
  if(q("rtCss"))return;
  var s=document.createElement("style"); s.id="rtCss";
  s.textContent=[
  "#rtWrap{position:fixed;inset:0;z-index:130;background:var(--bg);display:none;flex-direction:column}",
  "#rtWrap.on{display:flex}",
  ".rt-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:11px 16px;background:#fff;border-bottom:1px solid var(--line)}",
  ".rt-bar b{font-size:16px;color:var(--navy);margin-right:4px}",
  ".rt-bar input,.rt-bar select{width:auto;min-width:120px;padding:8px 10px;border-radius:9px}",
  ".rt-sp{flex:1}",
  ".rt-body{flex:1;display:flex;min-height:0}",
  ".rt-side{width:420px;max-width:46vw;overflow:auto;padding:16px;background:#fff;border-right:1px solid var(--line)}",
  ".rt-mapbox{flex:1;position:relative;min-width:0}",
  "#rtMap{position:absolute;inset:0}",
  ".rt-nokey{position:absolute;inset:0;background:#fff;overflow:auto;padding:26px;display:grid;place-items:start center}",
  ".rt-card{background:#fff;border:1px solid var(--line);border-radius:15px;padding:14px;margin-bottom:11px}",
  ".rt-h{font-size:13px;font-weight:900;color:var(--navy);margin:16px 0 9px}",
  ".rt-h:first-child{margin-top:0}",
  ".rt-stop{display:flex;gap:11px;align-items:flex-start;padding:11px 0;border-bottom:1px dashed #e9edf1}",
  ".rt-stop:last-child{border-bottom:0}",
  ".rt-t0{width:52px;flex:none;font-weight:900;color:var(--navy);font-size:15px}",
  ".rt-t0 small{display:block;font-size:11px;color:var(--muted);font-weight:700}",
  ".rt-i{flex:1;min-width:0}.rt-i b{color:var(--navy)}",
  ".rt-i small{display:block;color:var(--muted);margin-top:2px;font-size:12px;white-space:normal}",
  ".rt-move{font-size:12px;color:#245ea8;background:#eef6ff;border-radius:8px;padding:4px 8px;display:inline-block;margin:6px 0 0}",
  ".rt-bad{font-size:12px;color:var(--red);background:var(--redbg);border-radius:8px;padding:5px 9px;display:block;margin-top:6px;font-weight:800}",
  ".rt-sum{display:flex;gap:9px;flex-wrap:wrap;margin-top:4px}",
  ".rt-sum div{flex:1;min-width:96px;background:#f5f7fa;border-radius:11px;padding:10px}",
  ".rt-sum span{display:block;font-size:11px;color:var(--muted);font-weight:800}",
  ".rt-sum strong{display:block;font-size:19px;color:var(--navy);margin-top:3px}",
  ".rt-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:11px 2px;border-bottom:1px solid #eef1f4}",
  ".rt-row:last-child{border-bottom:0}",
  ".rt-no{width:26px;height:26px;flex:none;border-radius:8px;background:#eef2f6;color:#596575;display:grid;place-items:center;font-weight:900;font-size:12px}",
  ".rt-who{flex:1;min-width:150px}.rt-who b{color:var(--navy)}",
  ".rt-who small{display:block;color:var(--muted);font-size:12px;margin-top:2px}",
  ".rt-act{display:flex;gap:5px;flex-wrap:wrap}",
  ".rt-act .btn{text-decoration:none}",
  ".rt-talk{width:100%;margin-top:8px}",
  ".rt-t{background:#f7f9fc;border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:7px}",
  ".rt-th{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:900;color:var(--navy);margin-bottom:6px}",
  ".rt-tb{font-size:13px;line-height:1.65;color:var(--text);white-space:normal}",
  ".rt-pin{background:var(--blue);color:#fff;border-radius:999px;min-width:24px;height:24px;padding:0 7px;display:grid;place-items:center;font-weight:900;font-size:12px;box-shadow:0 3px 9px rgba(0,0,0,.28);border:2px solid #fff}",
  ".rt-pin.c{background:#8b95a1;width:16px;height:16px;min-width:16px;font-size:0;padding:0}",
  ".rt-pin.h{background:var(--navy)}",
  "@media(max-width:860px){.rt-body{flex-direction:column}.rt-side{width:auto;max-width:none;max-height:52%;border-right:0;border-bottom:1px solid var(--line)}}"
  ].join("");
  document.head.appendChild(s);
}

function wrap(){
  styles();
  if(q("rtWrap"))return;
  var w=document.createElement("div"); w.id="rtWrap";
  w.innerHTML=
    '<div class="rt-bar">'+
      '<b>🗺️ 지역 동선</b>'+
      '<input type="date" id="rtDate">'+
      '<select id="rtRegion"></select>'+
      '<select id="rtOwner"></select>'+
      '<select id="rtStay"><option value="30">상담 30분</option><option value="45">상담 45분</option>'+
        '<option value="60">상담 60분</option><option value="90">상담 90분</option></select>'+
      '<button class="btn btn-light btn-sm" id="rtHome">🏠 출발지</button>'+
      '<button class="btn btn-light btn-sm" id="rtFill">📍 좌표 채우기</button>'+
      '<span class="rt-sp"></span>'+
      '<button class="btn btn-light btn-sm" id="rtKey">키 설정</button>'+
      '<button class="btn btn-dark btn-sm" id="rtX">닫기</button>'+
    '</div>'+
    '<div class="rt-body">'+
      '<div class="rt-side" id="rtSide"></div>'+
      '<div class="rt-mapbox"><div id="rtMap"></div><div class="rt-nokey hidden" id="rtNokey"></div></div>'+
    '</div>';
  document.body.appendChild(w);
  q("rtX").onclick=function(){ w.classList.remove("on") };
  q("rtDate").onchange=render; q("rtRegion").onchange=render; q("rtOwner").onchange=render;
  q("rtStay").onchange=function(){ STAY=+q("rtStay").value||60;
    try{ localStorage.setItem("apexRouteStayV1",STAY) }catch(e){} render() };
  q("rtHome").onclick=setHome;
  q("rtFill").onclick=fillCoords;
  q("rtKey").onclick=function(){ keyPanel(true) };
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&w.classList.contains("on")) w.classList.remove("on");
  });
}

/* ── 그날의 확정 약속 ──────────────────────────────────────────── */
function stopsOf(dateStr,region,owner){
  var out=[];
  dbs.forEach(function(d){
    var a=nextAppt(d); if(!a)return;
    if(dayKey(a)!==dateStr)return;
    if(owner&&d.assigned_to!==owner)return;
    if(region&&norm(d.region)!==norm(region))return;
    out.push({d:d,at:new Date(a),pt:ptOf(d)});
  });
  out.sort(function(a,b){return a.at-b.at});
  return out;
}
/* 그날 그 지역에서 아직 약속이 없는 사람 — 틈에 끼워 넣을 후보 */
function pool(region,owner){
  var out=[];
  dbs.forEach(function(d){
    if(owner&&d.assigned_to!==owner)return;
    if(region&&norm(d.region)!==norm(region))return;
    var s=stageOf(d);
    if(s==="계약완료"||s==="증권전달")return;
    if(nextAppt(d))return;
    if(result(d)==="거절")return;
    out.push(d);
  });
  return out;
}

/* ── 순서 짜기 — 가까운 곳부터 잇고(NN), 꼬인 데를 편다(2-opt) ── */
function tour(pts,start){
  var n=pts.length, rest=[], i;
  for(i=0;i<n;i++)rest.push(i);
  var order=[], cur=start||null;
  while(rest.length){
    var best=0;
    if(cur){
      var bd=Infinity;
      for(i=0;i<rest.length;i++){
        var dd=hav(cur,pts[rest[i]]); if(dd==null)dd=9999;
        if(dd<bd){bd=dd;best=i}
      }
    }
    var k=rest.splice(best,1)[0];
    order.push(k); cur=pts[k];
  }
  function total(o){
    var t=0,p=start;
    for(var j=0;j<o.length;j++){ var d2=hav(p,pts[o[j]]); if(d2!=null)t+=d2; p=pts[o[j]] }
    return t;
  }
  var improved=true, guard=0;
  while(improved&&guard++<40){
    improved=false;
    for(var a=0;a<order.length-1;a++)for(var b=a+1;b<order.length;b++){
      var o2=order.slice(0,a).concat(order.slice(a,b+1).reverse(),order.slice(b+1));
      if(total(o2)<total(order)-0.01){ order=o2; improved=true }
    }
  }
  return {order:order,km:total(order)};
}

function legs(stops){
  var out=[], prev=HOME?{lat:HOME.lat,lng:HOME.lng}:null, km=0, late=0, unknown=0;
  stops.forEach(function(s,i){
    var d=hav(prev,s.pt), m=mins(d);
    if(d==null&&s.pt==null)unknown++;
    if(d!=null)km+=d;
    var bad=null;
    if(i>0){
      var gap=(s.at-stops[i-1].at)/60000, need=STAY+(m||0);
      if(m!=null&&gap<need){ bad=Math.round(need-gap); late++ }
    }
    out.push({s:s,km:d,min:m,bad:bad});
    prev=s.pt||prev;
  });
  return {list:out,km:km,late:late,unknown:unknown};
}

/* 후보를 어느 틈에 넣으면 손해가 가장 적은가 */
function fitIn(stops,c){
  var p=ptOf(c); if(!p)return null;
  var best=null, i;
  var pts=stops.map(function(s){return s.pt});
  for(i=0;i<=stops.length;i++){
    var prev=i===0?(HOME||null):stops[i-1].pt;
    var next=i===stops.length?null:stops[i].pt;
    var inM=mins(hav(prev,p)), outM=next?mins(hav(p,next)):0;
    if(inM==null&&i>0)continue;
    var add=(inM||0)+(outM||0)-(next&&prev?(mins(hav(prev,next))||0):0);
    var room;
    if(i===0){
      var nine=new Date(stops.length?stops[0].at:new Date()); nine.setHours(9,0,0,0);
      room=stops.length?((stops[0].at-nine)/60000):600;
    }else if(i===stops.length){
      var eight=new Date(stops[i-1].at); eight.setHours(20,0,0,0);
      room=(eight-stops[i-1].at)/60000-STAY;
    }else{
      room=(stops[i].at-stops[i-1].at)/60000-STAY;
    }
    var need=STAY+(inM||0)+(outM||0);
    var slack=Math.round(room-need);
    var where = !stops.length ? "이날 아무 때나"
              : i===0 ? "첫 약속 전"
              : i===stops.length ? "마지막 약속 뒤"
              : (i+"번째와 "+(i+1)+"번째 사이");
    var cand={at:i,add:Math.round(add),slack:slack,ok:slack>=0,where:where};
    if(!best||(cand.ok&&!best.ok)||(cand.ok===best.ok&&cand.add<best.add))best=cand;
  }
  return best;
}

/* ── 화면 ───────────────────────────────────────────────────────── */
function fillPickers(){
  var rs={}, sel=q("rtRegion"), keep=sel.value;
  dbs.forEach(function(d){ if(d.region&&String(d.region).trim())rs[String(d.region).trim()]=1 });
  var names=Object.keys(rs).sort();
  sel.innerHTML='<option value="">지역 전체</option>'+names.map(function(n){
    return '<option value="'+E(n)+'">'+E(n)+'</option>' }).join("");
  if(keep&&names.indexOf(keep)>=0)sel.value=keep;

  var os=q("rtOwner"), keep2=os.value, me=myId(), opts=[];
  try{ profiles.forEach(function(p){ opts.push('<option value="'+E(p.id)+'">'+E(p.name||"담당자")+'</option>') }) }catch(e){}
  os.innerHTML='<option value="">담당자 전체</option>'+opts.join("");
  os.value=keep2||me||"";
  if(os.value!==(keep2||me||""))os.value="";
}

function render(){
  var date=q("rtDate").value||todayKey();
  var region=q("rtRegion").value||"";
  var owner=q("rtOwner").value||"";
  var stops=stopsOf(date,region,owner);
  var L=legs(stops);
  var side=[];

  var dt=new Date(date+"T00:00:00");
  side.push('<div class="rt-h">'+E((dt.getMonth()+1)+"월 "+dt.getDate()+"일("+wday(dt)+")")+
    ' 확정 약속 '+stops.length+'건'+(region?' · '+E(region):"")+'</div>');

  if(!stops.length){
    side.push('<div class="rt-card" style="color:var(--muted)">이날 잡힌 약속이 없습니다. '+
      '날짜를 바꿔 보시거나, 아래 후보에게 걸어 하루를 만드십시오.</div>');
  }else{
    var body=stops.map(function(x,i){
      var l=L.list[i];
      var move;
      if(l.min!=null){
        move='<span class="rt-move">'+(i===0?"🏠 출발지에서 ":"앞 사람에게서 ")+
             kmTxt(l.km)+' · 차로 '+l.min+'분쯤</span>';
      }else if(i===0&&!HOME&&x.pt){
        move='<span class="rt-move">여기서 하루가 시작됩니다 — 위 <b>🏠 출발지</b>를 정하면 몇 시에 나서야 하는지까지 셉니다</span>';
      }else{
        move='<span class="rt-move" style="background:#fff4e6;color:#a8730f">'+
             '위치를 몰라 이동시간을 못 셉니다 — 통화 기록의 「만날 장소」를 적어 주세요</span>';
      }
      var bad=l.bad?'<span class="rt-bad">앞 약속과 '+Math.round((x.at-stops[i-1].at)/60000)+
        '분 차이인데 상담 '+STAY+'분 + 이동 '+l.min+'분이 필요합니다 — <b>'+l.bad+'분 늦습니다</b></span>':"";
      var nav=x.pt?'<a class="btn btn-light btn-sm" target="_blank" rel="noopener" href="https://map.kakao.com/link/to/'+
        encodeURIComponent((x.d.customer_name||"약속"))+','+x.pt.lat+','+x.pt.lng+'">길찾기</a>':"";
      return '<div class="rt-stop"><div class="rt-t0">'+hm(x.at)+'<small>'+(i+1)+'번째</small></div>'+
        '<div class="rt-i"><b>'+E(x.d.customer_name)+'</b>'+
        '<small>'+E(placeOf(x.d)||"장소 미정")+(x.d.phone?" · "+E(x.d.phone):"")+'</small>'+
        move+bad+'</div><div>'+nav+'</div></div>';
    }).join("");
    side.push('<div class="rt-card">'+body+'</div>');

    var firstM=L.list[0]&&L.list[0].min;
    var dep=(HOME&&firstM!=null)?new Date(stops[0].at.getTime()-(firstM+5)*60000):null;
    side.push('<div class="rt-sum">'+
      '<div><span>총 이동</span><strong>'+(L.km?Math.round(L.km)+"km":"-")+'</strong></div>'+
      '<div><span>길에서</span><strong>'+
        (L.list.filter(function(l){return l.min!=null}).reduce(function(a,l){return a+l.min},0)||"-")+'분</strong></div>'+
      '<div><span>출발</span><strong>'+(dep?hm(dep):"-")+'</strong></div>'+
      '</div>');
    if(!HOME) side.push('<div class="rt-card" style="background:#eef6ff;border-color:#c9ddff;'+
      'color:#245ea8;font-size:13px;margin-top:9px">위의 <b>🏠 출발지</b>에 사무실이나 집 주소를 한 번 넣어 두면, '+
      '몇 시에 나서야 첫 약속을 지키는지까지 나옵니다.</div>');
    if(L.unknown) side.push('<div class="rt-card" style="background:#fff4e6;border-color:#ffd8a8;color:#a8730f;font-size:13px">'+
      '위치를 모르는 약속이 '+L.unknown+'건 있습니다. 통화 기록의 <b>만날 장소</b>나 DB의 <b>동네</b>를 적고 '+
      '<b>📍 좌표 채우기</b>를 누르면 지도에 올라갑니다.</div>');

    /* 시간을 다시 잡을 수 있다면 이 순서가 낫다 */
    var pts=stops.map(function(s){return s.pt}), okAll=pts.every(function(p){return !!p});
    if(okAll&&stops.length>=3){
      var t=tour(pts,HOME||pts[0]);
      var same=t.order.every(function(v,i){return v===i});
      if(!same&&t.km<L.km-0.5){
        var names=t.order.map(function(k,i){return (i+1)+". "+ (stops[k].d.customer_name||"") }).join("  →  ");
        side.push('<div class="rt-h">시간을 다시 잡을 수 있다면</div>'+
          '<div class="rt-card" style="background:#eef6ff;border-color:#c9ddff">'+
          '<div style="font-size:13px;line-height:1.6;color:#245ea8">이 순서로 돌면 이동이 <b>'+
          Math.round(L.km)+'km → '+Math.round(t.km)+'km</b> 로 줄어듭니다 '+
          '(길에서 버리는 시간 약 <b>'+Math.max(0,mins(L.km)-mins(t.km))+'분</b> 절약).</div>'+
          '<div style="margin-top:8px;font-weight:800;color:var(--navy);font-size:13px">'+E(names)+'</div></div>');
      }
    }
  }

  /* ── 틈에 끼워 넣을 사람 ── */
  var cands=pool(region,owner).map(function(d){
    var f=fitIn(stops,d);
    return {d:d,fit:f};
  });
  cands.sort(function(a,b){
    var ao=a.fit&&a.fit.ok?0:1, bo=b.fit&&b.fit.ok?0:1;
    if(ao!==bo)return ao-bo;
    if(a.fit&&b.fit)return a.fit.add-b.fit.add;
    return a.fit?-1:(b.fit?1:0);
  });
  var top=cands.slice(0,8);
  side.push('<div class="rt-h">여기 더 넣을 수 있는 사람 '+
    (stops.length?'<small style="font-weight:700;color:var(--muted)">— 약속 사이 빈틈 기준</small>':"")+'</div>');
  if(!top.length){
    side.push('<div class="rt-card" style="color:var(--muted)">이 지역에 아직 걸 사람이 없습니다.</div>');
  }else{
    var anchor=stops[0];
    side.push('<div class="rt-card">'+top.map(function(c,i){
      var d=c.d, tel=(d.phone||"").replace(/[^0-9+]/g,"");
      var tag;
      if(!c.fit) tag='<span class="badge gray">위치 모름</span>';
      else if(c.fit.ok) tag='<span class="badge green">'+E(c.fit.where)+' · 여유 '+c.fit.slack+'분</span>'+
        '<span class="badge blue" style="margin-left:4px">돌아가는 시간 +'+c.fit.add+'분</span>';
      else tag='<span class="badge yellow">'+E(c.fit.where)+' — '+Math.abs(c.fit.slack)+'분 모자람</span>';
      return '<div class="rt-row"><div class="rt-no">'+(i+1)+'</div>'+
        '<div class="rt-who"><b>'+E(d.customer_name)+'</b>'+
        '<small>'+E(placeOf(d)||"동네 미입력")+(d.phone?" · "+E(d.phone):"")+'</small>'+
        '<div style="margin-top:5px">'+tag+'</div></div>'+
        '<div class="rt-act">'+
          (tel?'<a class="btn btn-primary btn-sm" href="tel:'+E(tel)+'">📞</a>':"")+
          (anchor?'<button class="btn btn-light btn-sm" data-rtalk="'+i+'">📋 화법</button>':"")+
          '<button class="btn btn-dark btn-sm" data-rcall="'+E(d.id)+'">약속 잡기</button>'+
        '</div><div class="rt-talk hidden" id="rtRT'+i+'"></div></div>';
    }).join("")+'</div>');
  }

  side.push('<div class="rt-card" style="font-size:12px;color:var(--muted);line-height:1.6">'+
    '이동시간은 <b>어림</b>입니다 — 직선거리를 1.35배 해서 시속 28km 로 달린 셈으로 셉니다. '+
    '실제 출발 전에는 <b>길찾기</b> 를 한 번 눌러 확인하십시오.</div>');

  q("rtSide").innerHTML=side.join("");

  Array.prototype.forEach.call(q("rtSide").querySelectorAll("[data-rcall]"),function(b){
    b.onclick=function(){ q("rtWrap").classList.remove("on");
      if(window.openCall) window.openCall(b.getAttribute("data-rcall")) };
  });
  Array.prototype.forEach.call(q("rtSide").querySelectorAll("[data-rtalk]"),function(b){
    b.onclick=function(){
      var i=+b.getAttribute("data-rtalk"), box=q("rtRT"+i), c=top[i], a=stops[0];
      if(!a)return;
      if(box.getAttribute("data-on")==="1"){ box.classList.add("hidden"); box.setAttribute("data-on","0"); return }
      box.setAttribute("data-on","1"); box.classList.remove("hidden");
      box.innerHTML=tCard("전화 — 가는 김에",talk(c.d,a.d,a.at,"a"))+
                    tCard("문자로 보낼 때",talk(c.d,a.d,a.at,"sms"));
      Array.prototype.forEach.call(box.querySelectorAll("[data-copy]"),function(cb){
        cb.onclick=function(){ copyText(cb.getAttribute("data-copy")) };
      });
    };
  });

  drawMap(stops,top);
}

/* ── 지도 ───────────────────────────────────────────────────────── */
function drawMap(stops,cands){
  if(!KEY){ keyPanel(false); return }
  q("rtNokey").classList.add("hidden");
  sdk().then(function(){
    var pts=stops.filter(function(s){return s.pt});
    var center=pts.length?pts[0].pt:(HOME||{lat:34.9506,lng:127.4872}); /* 기본은 순천 */
    if(!MAP){
      MAP=new kakao.maps.Map(q("rtMap"),{center:new kakao.maps.LatLng(center.lat,center.lng),level:6});
    }
    OVERLAY.forEach(function(o){ try{ o.setMap(null) }catch(e){} });
    OVERLAY=[];
    var bounds=new kakao.maps.LatLngBounds(), any=false, path=[];

    function pin(p,html,cls,z){
      var ll=new kakao.maps.LatLng(p.lat,p.lng);
      var el=document.createElement("div"); el.className="rt-pin "+(cls||""); el.innerHTML=html;
      var ov=new kakao.maps.CustomOverlay({position:ll,content:el,yAnchor:.5,zIndex:z||3});
      ov.setMap(MAP); OVERLAY.push(ov); bounds.extend(ll); any=true; return ll;
    }
    if(HOME) pin(HOME,"🏠","h",4);
    stops.forEach(function(s,i){ if(s.pt) path.push(pin(s.pt,String(i+1),"",5)) });
    cands.forEach(function(c){ var p=ptOf(c.d); if(p) pin(p,"","c",2) });
    if(HOME&&path.length) path.unshift(new kakao.maps.LatLng(HOME.lat,HOME.lng));
    if(path.length>1){
      var line=new kakao.maps.Polyline({path:path,strokeWeight:4,strokeColor:"#3182f6",
        strokeOpacity:.85,strokeStyle:"solid"});
      line.setMap(MAP); OVERLAY.push(line);
    }
    if(any) MAP.setBounds(bounds,60,60,60,60);
    setTimeout(function(){ try{ MAP.relayout(); if(any)MAP.setBounds(bounds,60,60,60,60) }catch(e){} },120);
  }).catch(function(){ keyPanel(false) });
}

/* ── 키가 없을 때 안내 ──────────────────────────────────────────── */
function keyPanel(force){
  var box=q("rtNokey"); if(!box)return;
  box.classList.remove("hidden");
  box.innerHTML=
    '<div style="max-width:520px">'+
    '<h3 style="margin:0 0 8px;color:var(--navy)">지도를 켜려면 카카오 키가 한 번 필요합니다</h3>'+
    '<p style="color:var(--muted);line-height:1.65;margin:0 0 14px">무료입니다. '+
    '한 사람(대표)이 한 번만 넣으면 팀 전체가 같이 씁니다.</p>'+
    '<ol style="line-height:1.9;color:var(--text);padding-left:18px;margin:0 0 14px">'+
    '<li><a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener">developers.kakao.com</a> 접속 → 카카오 계정 로그인</li>'+
    '<li><b>애플리케이션 추가하기</b> → 앱 이름 「APEX」, 회사명 아무거나 → 저장</li>'+
    '<li>만든 앱 → <b>앱 키</b> 에서 <b>JavaScript 키</b> 를 복사</li>'+
    '<li>같은 앱 → <b>플랫폼 → Web</b> → 사이트 도메인에 아래 두 줄을 등록<br>'+
      '<code style="font-size:12px;background:#f1f4f7;padding:2px 6px;border-radius:6px">'+
      E(location.origin)+'</code></li>'+
    '<li>카카오맵 → <b>제품 설정 → 카카오맵</b> 에서 <b>사용함</b> 으로 켜기</li>'+
    '</ol>'+
    '<div class="field"><label>JavaScript 키</label>'+
    '<input id="rtKeyIn" placeholder="여기에 붙여 넣으세요" value="'+E(KEY)+'"></div>'+
    '<button class="btn btn-primary" id="rtKeySave">저장하고 지도 켜기</button>'+
    (KEY_TEAM?'<div class="notice" style="margin-top:12px">지금 키는 <b>팀 전체</b>가 같이 쓰는 키입니다.</div>':"")+
    '</div>';
  q("rtKeySave").onclick=function(){
    var v=(q("rtKeyIn").value||"").trim();
    if(!v){ say("키를 붙여 넣어 주세요."); return }
    keySave(v).then(function(){ sdkP=null; say("저장했습니다."); render() });
  };
}

/* ── 출발지 · 좌표 채우기 ───────────────────────────────────────── */
function setHome(){
  var cur=HOME?HOME.label:"";
  var t=prompt("아침에 출발하는 곳을 적어 주세요 (사무실·집 주소)",cur||"");
  if(t===null)return;
  t=t.trim();
  if(!t){ HOME=null; try{ localStorage.removeItem("apexRouteHomeV1") }catch(e){}; render(); return }
  geo(t,"").then(function(p){
    if(!p){ say("그 주소를 못 찾았습니다. 「순천시 조례동 1번지」 처럼 적어 보세요.",3500); return }
    HOME={lat:p.lat,lng:p.lng,label:t};
    try{ localStorage.setItem("apexRouteHomeV1",JSON.stringify(HOME)) }catch(e){}
    say("출발지를 "+p.label+" 로 잡았습니다.",3000); render();
  });
}

function fillCoords(){
  if(!HAS_DB){ say("서버에 위치 칸이 없습니다 — migration_46_db_geo.sql 을 한 번 실행하세요.",6000); return }
  if(!KEY){ keyPanel(true); return }
  var region=q("rtRegion").value||"", owner=q("rtOwner").value||"";
  var todo=[];
  dbs.forEach(function(d){
    if(owner&&d.assigned_to!==owner)return;
    if(region&&norm(d.region)!==norm(region))return;
    if(d.addr&&!(d.lat&&d.lng))todo.push({d:d,text:d.addr,kind:"home"});
    if(d.next_appt_place&&!(d.next_appt_lat&&d.next_appt_lng))todo.push({d:d,text:d.next_appt_place,kind:"appt"});
  });
  if(!todo.length){ say("좌표를 채울 것이 없습니다. 동네나 만날 장소를 먼저 적어 주세요.",3500); return }
  say("주소 "+todo.length+"건을 좌표로 바꾸는 중입니다…",4000);
  var i=0, ok=0;
  (function step(){
    if(i>=todo.length){
      say("좌표 "+ok+"건을 채웠습니다.",3000);
      if(window.loadAll) Promise.resolve(loadAll()).then(render); else render();
      return;
    }
    var t=todo[i++];
    geo(t.text,t.d.region||"").then(function(p){
      if(!p)return null;
      var patch=t.kind==="home"?{lat:p.lat,lng:p.lng}:{next_appt_lat:p.lat,next_appt_lng:p.lng};
      return sb.from("dbs").update(patch).eq("id",t.d.id).then(function(r){ if(!r.error)ok++ });
    }).catch(function(){}).then(function(){ setTimeout(step,220) });
  })();
}

/* ── 열기 ───────────────────────────────────────────────────────── */
function routeOpen(dateStr,region){
  wrap(); fillPickers();
  q("rtDate").value=dateStr||q("rtDate").value||todayKey();
  if(region!==undefined&&region!==null){
    var s=q("rtRegion"), hit=false;
    Array.prototype.forEach.call(s.options,function(o){ if(norm(o.value)===norm(region)){s.value=o.value;hit=true} });
    if(!hit)s.value="";
  }
  q("rtStay").value=String(STAY);
  q("rtWrap").classList.add("on");
  render();
}
window.apexRouteOpen=routeOpen;

/* ── 시작 ───────────────────────────────────────────────────────── */
function boot(){
  probe().then(keyLoad).then(function(){
    injectFields();
    if(!HAS_DB&&!HAS_CALL){
      console.log("[apex-route] 서버에 위치 칸이 없습니다 — migration_46_db_geo.sql 을 실행하면 켜집니다.");
    }
  });
}
/* 로그인이 끝나 sb·profile 이 생긴 뒤에 붙는다 */
var tries=0;
(function ready(){
  var ok=false;
  try{ ok=!!(sb&&profile&&profile.id) }catch(e){ ok=false }
  if(ok)return boot();
  if(tries++<600)setTimeout(ready,600);
})();

})();
