/* ══════════════════════════════════════════════════════════════════
   apex-route.js — 지역 동선

   하고 싶었던 일은 두 가지입니다.

   ① AP 를 하나 잡으면, 그 지역에 사는 사람 열 명에게 바로 걸어서
      「가는 김에」로 약속을 더 붙인다. 한 번 가는 길에 한 명만 만나고
      오는 것이 가장 아까운 일이었습니다.
   ② 그날 잡힌 약속들을 지도에 올려 놓고, 어느 순서로 돌면 길에서
      버리는 시간이 가장 적은지 본다.

   ③ 그러려면 지역이 갈라지면 안 됩니다. 「순천」·「순천시」·「전남 순천시」
      가 서로 다른 지역이 되면 ①에 사람이 덜 뜨고 ②의 지역 목록이 두 번
      뜹니다. 그래서 지역은 카카오가 정한 이름과 법정동 코드로 잡습니다.
      손으로 적은 옛 자료도 regionText() 로 같은 지역으로 봅니다.

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
var HAS_STD=false;       /* dbs 에 region_code/sigungu 칸이 있나 (migration_47) */
var KEY="";              /* 카카오 JavaScript 키 */
var KEY_TEAM=false;      /* 팀이 같이 쓰는 키인가(app_config) */
var GC=null, PS=null;    /* 카카오 주소검색 · 장소검색 */
var MAP=null, OVERLAY=[];
var PMAP=null;           /* 위치 고르는 창의 지도 — 동선 지도(MAP)와 다른 판이다 */
var CACHE={}; try{ CACHE=JSON.parse(localStorage.getItem("apexGeoCacheV1")||"{}") }catch(e){ CACHE={} }
var HOME=null;  try{ HOME=JSON.parse(localStorage.getItem("apexRouteHomeV1")||"null") }catch(e){}
var STAY=+(localStorage.getItem("apexRouteStayV1")||60);   /* 한 건 상담에 쓰는 시간(분) */

/* ── 자잘한 셈 ──────────────────────────────────────────────────── */
function norm(s){return String(s==null?"":s).replace(/\s+/g,"").toLowerCase()}

/* ── 지역 이름을 하나로 모은다 ──────────────────────────────────
   지역이 자유 입력이라 「순천」·「순천시」·「전남 순천시」가 서로 다른
   지역으로 갈라졌습니다. 갈라지면 「이 지역 열 명」에 사람이 덜 뜨고,
   지도 지역 목록에 같은 데가 두 번 뜹니다.

   그래서 비교는 언제나 이 「맨 이름」으로 합니다. 시·도 이름을 떼고,
   끝의 시/군/구를 뗍니다. 서버의 region_key() 와 같은 규칙입니다.
   시·도 이름밖에 없으면(「광주」) 그대로 둡니다 — 지우면 빈칸이 됩니다. */
var SIDO_RE=/^(서울특별시|서울|부산광역시|부산|대구광역시|대구|인천광역시|인천|광주광역시|대전광역시|대전|울산광역시|울산|세종특별자치시|세종|경기도|경기|강원특별자치도|강원도|강원|충청북도|충북|충청남도|충남|전북특별자치도|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주도|제주)/;
function strip(s,re){ var t=s.replace(re,""); return t?t:s }
function regionText(s){
  s=String(s==null?"":s).replace(/\s+/g,"");
  if(!s)return "";
  s=strip(s,SIDO_RE);
  s=strip(s,/(특별자치시|특별자치도|특별시|광역시|자치시|자치구|자치도)$/);
  s=strip(s,/(시|군|구)$/);
  return s.toLowerCase();
}
/* 두 사람이 같은 지역인가 — 코드가 둘 다 있으면 코드로, 아니면 이름으로 */
function sameRegion(a,b){
  var ca=a&&a.region_code?String(a.region_code).slice(0,5):"";
  var cb=b&&b.region_code?String(b.region_code).slice(0,5):"";
  if(ca&&cb)return ca===cb;
  var ta=regionText(a&&a.region), tb=regionText(b&&b.region);
  return !!ta&&ta===tb;
}
/* 화면에 보여 줄 이름 — 카카오가 준 표준 이름이 있으면 그것을 쓴다 */
function regionName(d){ return (d&&(d.sigungu||d.region))||"" }
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

/* ── 좌표 → 행정구역 ────────────────────────────────────────────
   카카오가 「전라남도 / 순천시 / 조례동」과 법정동 코드를 돌려줍니다.
   지역 이름을 사람이 적는 대신 이 값을 씁니다 — 오타도 없고 갈라지지도
   않습니다. 세종처럼 시·군·구가 없는 데는 시·도 이름을 시군구로 씁니다. */
var RCACHE={}; try{ RCACHE=JSON.parse(localStorage.getItem("apexRegionCacheV1")||"{}") }catch(e){ RCACHE={} }
function region2(lat,lng){
  if(lat==null||lng==null)return Promise.resolve(null);
  var k=(+lat).toFixed(4)+","+(+lng).toFixed(4);
  if(RCACHE[k])return Promise.resolve(RCACHE[k]);
  return sdk().then(function(){
    return new Promise(function(res){
      var done=false, t=setTimeout(function(){ if(!done){done=true;res(null)} },7000);
      GC.coord2RegionCode(+lng,+lat,function(r,st){
        if(done)return; done=true; clearTimeout(t);
        if(st!==kakao.maps.services.Status.OK||!r||!r.length)return res(null);
        /* 법정동(B)을 먼저 쓴다 — 코드가 안 바뀌는 쪽입니다 */
        var b=null,i;
        for(i=0;i<r.length;i++){ if(r[i].region_type==="B"){ b=r[i]; break } }
        if(!b)b=r[0];
        var v={ sido:b.region_1depth_name||"",
                sigungu:b.region_2depth_name||b.region_1depth_name||"",
                dong:b.region_3depth_name||"",
                region_code:b.code||"" };
        RCACHE[k]=v;
        try{ localStorage.setItem("apexRegionCacheV1",JSON.stringify(RCACHE)) }catch(e){}
        res(v);
      });
    });
  }).catch(function(){ return null });
}

/* 적어 놓은 글자 하나로 좌표와 행정구역을 한꺼번에 얻는다 */
function resolvePlace(text,hint){
  return geo(text,hint).then(function(p){
    if(!p)return null;
    return region2(p.lat,p.lng).then(function(r){
      return {lat:p.lat,lng:p.lng,label:p.label,
              sido:(r&&r.sido)||"",sigungu:(r&&r.sigungu)||"",
              dong:(r&&r.dong)||"",region_code:(r&&r.region_code)||""};
    });
  });
}

/* ── 주소 찾기 창 ───────────────────────────────────────────────
   손으로 적으면 「순천」·「순천시」·「순천 조례」가 다 달라집니다.
   여기서 고르면 카카오가 정한 이름과 코드가 그대로 들어갑니다. */
var pickCb=null;
function pickModal(){
  styles();
  if(q("rtPick"))return;
  var m=document.createElement("div");
  m.className="modal"; m.id="rtPick";
  m.innerHTML=
    '<div class="modal-box" style="width:min(620px,100%)">'+
      '<div class="modal-head"><h3 id="rtPickT">주소 찾기</h3><button class="close" id="rtPickX">×</button></div>'+
      '<div class="modal-body">'+
        /* 타이핑이 병목이라 <b>안 쳐도 되는 길</b>을 먼저 둔다.
           만나고 나서 차에서 단추 하나 — 그게 제일 빠르다. */
        '<div class="rt-ways">'+
          '<button class="btn btn-dark" id="rtPickHere">📍 지금 여기</button>'+
          '<button class="btn btn-light" id="rtPickMapBtn">🗺️ 지도에서 찍기</button>'+
        '</div>'+
        '<div class="rt-pmap hidden" id="rtPickMapBox"><div id="rtPickMap"></div>'+
          '<div class="rt-cross">📍</div></div>'+
        '<div class="hidden" id="rtPickMapGoBox" style="margin:10px 0">'+
          '<button class="btn btn-primary" id="rtPickMapGo" style="width:100%">가운데 이 자리로 하겠습니다</button></div>'+
        '<div class="field"><label>또는 주소·건물 이름을 적고 <b>찾기</b></label>'+
          '<div style="display:flex;gap:6px">'+
            '<input id="rtPickQ" placeholder="순천시 조례동 / 조례동 스타벅스 / 중앙로 100" style="flex:1;min-width:0">'+
            '<button class="btn btn-primary" id="rtPickGo" style="flex:none">찾기</button>'+
          '</div></div>'+
        '<div id="rtPickR"></div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(m);
  q("rtPickX").onclick=function(){ m.classList.remove("open"); pickCb=null };
  q("rtPickGo").onclick=pickRun;
  q("rtPickHere").onclick=pickHere;
  q("rtPickMapBtn").onclick=pickMapOpen;
  q("rtPickMapGo").onclick=pickMapTake;
  q("rtPickQ").addEventListener("keydown",function(e){ if(e.key==="Enter"){ e.preventDefault(); pickRun() } });
}
function pickOpen(title,seed,cb){
  if(!KEY){ say("지도 키가 아직 없어 주소 찾기를 쓸 수 없습니다 — 🗺️ 지역 동선 → 키 설정",5000); return }
  pickModal();
  pickCb=cb;
  q("rtPickT").textContent=title||"주소 찾기";
  q("rtPickQ").value=seed||"";
  var mb=q("rtPickMapBox"); if(mb){ mb.classList.add("hidden"); q("rtPickMapGoBox").classList.add("hidden") }
  q("rtPickR").innerHTML='<div class="notice">'+
    '<b>📍 지금 여기</b> 는 고객을 만난 자리에서 누르면 한 글자도 안 치고 끝납니다. '+
    '<b>🗺️ 지도에서 찍기</b> 는 지도를 움직여 가운데에 맞추면 됩니다.<br>'+
    '동 이름만 적어도 됩니다 — 「조례동」.</div>';
  q("rtPick").classList.add("open");
  /* 글칸에 <b>손을 얹지 않습니다.</b> 폰에서 손이 얹히면 키보드가 올라와
     화면 절반을 먹는데, 정작 눌러야 할 두 단추가 그 밑에 깔립니다.
     타이핑을 없애려고 만든 창이니 키보드를 먼저 띄우면 앞뒤가 안 맞습니다.

     처음에는 「이미 적힌 것이 있을 때만 얹자」로 두었는데, 씨앗에 지역
     칸이 들어가 <b>거의 언제나 참</b>이었습니다 — 결국 늘 올라옵니다.
     쓸 사람은 칸을 누르면 됩니다. */
}
/* ── ① 지금 여기 ────────────────────────────────────────────────
   제일 빠른 길입니다. 고객을 만나고 나서 차에서 단추 하나면 끝납니다 —
   <b>한 글자도 안 칩니다.</b> 폰이 아는 좌표를 그대로 쓰고, 동네 이름은
   카카오가 붙여 줍니다.

   다만 이것은 <b>지금 계신 곳</b>입니다. 사무실에 앉아 누르면 사무실이
   그 고객 자리로 적힙니다. 그래서 무엇을 적는지 화면에 먼저 밝힙니다. */
function pickHere(){
  if(!navigator.geolocation){ say("이 브라우저는 위치를 알려 주지 않습니다. 지도에서 찍어 주세요.",5000); return }
  q("rtPickR").innerHTML='<div class="notice"><b>지금 계신 곳</b>을 찾는 중입니다… '+
    '폰이 물어보면 <b>허용</b>을 눌러 주세요.</div>';
  navigator.geolocation.getCurrentPosition(function(pos){
    var c=pos.coords;
    pickTake({lat:c.latitude,lng:c.longitude,title:"",
      sub:"지금 계신 곳 (오차 약 "+Math.round(c.accuracy||0)+"m)"});
  },function(e){
    /* 왜 안 됐는지 말한다. 「안 됩니다」만 적으면 열 번을 눌러도 열 번 같다 */
    var why=e&&e.code===1?"위치 권한이 막혀 있습니다 — 브라우저 주소창의 자물쇠에서 위치를 허용해 주세요."
           :e&&e.code===3?"시간이 너무 걸립니다 — 건물 안이면 창가로 나가 보시거나, 지도에서 찍어 주세요."
           :"지금 계신 곳을 못 찾았습니다 — 지도에서 찍어 주세요.";
    q("rtPickR").innerHTML='<div class="empty">'+E(why)+'</div>';
  },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}

/* ── ② 지도에서 찍기 ────────────────────────────────────────────
   지도를 움직여 <b>가운데 십자</b>에 맞춥니다. 핀을 손가락으로 집는 것보다
   폰에서 훨씬 쉽고, 손가락에 가려지지도 않습니다. */
function pickMapOpen(){
  var box=q("rtPickMapBox");
  q("rtPickR").innerHTML="";
  sdk().then(function(){
    box.classList.remove("hidden");
    q("rtPickMapGoBox").classList.remove("hidden");
    var c=(HOME&&HOME.lat)?HOME:{lat:34.9506,lng:127.4872};   /* 출발지, 없으면 순천 */
    if(!PMAP){
      PMAP=new kakao.maps.Map(q("rtPickMap"),
        {center:new kakao.maps.LatLng(c.lat,c.lng),level:4});
    }
    setTimeout(function(){ try{ PMAP.relayout() }catch(e){} },80);
  }).catch(function(){
    q("rtPickR").innerHTML='<div class="empty">지도를 못 켰습니다 — 🗺️ 지역 동선 에서 키와 도메인을 확인해 주세요.</div>';
  });
}
function pickMapTake(){
  if(!PMAP)return;
  var c=PMAP.getCenter();
  pickTake({lat:c.getLat(),lng:c.getLng(),title:"",sub:"지도에서 찍은 자리"});
}

function pickRun(){
  var kw=(q("rtPickQ").value||"").trim();
  if(!kw){ say("찾을 말을 적어 주세요."); return }
  q("rtPickR").innerHTML='<div class="notice">찾는 중입니다…</div>';
  sdk().then(function(){
    var got=[], waiting=2;
    function done(){
      if(--waiting>0)return;
      if(!got.length){
        q("rtPickR").innerHTML='<div class="empty">못 찾았습니다. '+
          '「순천시 조례동」 처럼 시·군 이름을 앞에 붙여 보세요.</div>';
        return;
      }
      q("rtPickR").innerHTML='<div class="rt-h">찾은 곳 '+got.length+'개 — 맞는 것을 누르세요</div>'+
        '<div class="rt-card">'+got.map(function(g,i){
          return '<div class="rt-row rt-hit" data-pick="'+i+'">'+
            '<div class="rt-who"><b>'+(g.kind==="주소"?"📮 ":"📍 ")+E(g.title)+'</b>'+
            '<small>'+E(g.sub||"")+'</small></div></div>';
        }).join("")+'</div>';
      Array.prototype.forEach.call(q("rtPickR").querySelectorAll("[data-pick]"),function(el){
        el.onclick=function(){ pickTake(got[+el.getAttribute("data-pick")]) };
      });
    }
    GC.addressSearch(kw,function(r,st){
      if(st===kakao.maps.services.Status.OK&&r){
        r.slice(0,8).forEach(function(a){
          got.push({kind:"주소",title:a.address_name,
            sub:(a.road_address&&a.road_address.address_name)||"지번 주소",
            lat:+a.y,lng:+a.x});
        });
      }
      done();
    });
    PS.keywordSearch(kw,function(r,st){
      if(st===kakao.maps.services.Status.OK&&r){
        r.slice(0,8).forEach(function(p){
          got.push({kind:"장소",title:p.place_name,
            sub:(p.road_address_name||p.address_name||"")+(p.phone?" · "+p.phone:""),
            lat:+p.y,lng:+p.x});
        });
      }
      done();
    });
  }).catch(function(){
    q("rtPickR").innerHTML='<div class="empty">지도를 못 불렀습니다 — 키와 도메인 등록을 확인하세요.</div>';
  });
}
function pickTake(g){
  q("rtPickR").innerHTML='<div class="notice">행정구역을 확인하는 중입니다…</div>';
  region2(g.lat,g.lng).then(function(r){
    /* 이름을 안 주고 좌표만 온 길(지금 여기 · 지도에서 찍기)이 있다.
       그때는 카카오가 답한 <b>동네 이름</b>을 그대로 쓴다 — 사람이 칠 것이 없다. */
    var nm=g.title||[(r&&r.sigungu)||"",(r&&r.dong)||""].filter(Boolean).join(" ");
    var out={lat:g.lat,lng:g.lng,label:nm,detail:g.sub,
      sido:(r&&r.sido)||"",sigungu:(r&&r.sigungu)||"",
      dong:(r&&r.dong)||"",region_code:(r&&r.region_code)||""};
    q("rtPick").classList.remove("open");
    var cb=pickCb; pickCb=null;
    if(cb)cb(out);
  });
}

/* ── 서버에 칸이 있는지 한 번만 물어본다 ─────────────────────────
   없으면 위치 기능만 접어 두고, 원래 화면은 그대로 돌아갑니다. */
function probe(){
  return Promise.all([
    sb.from("dbs").select("id,addr,lat,lng,next_appt_place,next_appt_lat,next_appt_lng").limit(1)
      .then(function(r){ HAS_DB=!r.error }).catch(function(){ HAS_DB=false }),
    sb.from("calls").select("id,appt_place,appt_lat,appt_lng").limit(1)
      .then(function(r){ HAS_CALL=!r.error }).catch(function(){ HAS_CALL=false }),
    sb.from("dbs").select("id,region_code,sido,sigungu,dong").limit(1)
      .then(function(r){ HAS_STD=!r.error }).catch(function(){ HAS_STD=false })
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
var PICKED={db:null,call:null};

/* 지금까지 쓰인 지역 이름 — 오타로 새 지역이 생기지 않게 골라 쓰게 한다.
   같은 곳이 두 이름으로 적혀 있으면 카카오가 준 표준 이름 쪽만 남깁니다. */
function regionList(){
  var by={};
  dbs.forEach(function(d){
    var k=regionText(d.region); if(!k)return;
    var nm=regionName(d);
    if(!by[k]||(d.sigungu&&!by[k].std)) by[k]={name:nm,std:!!d.sigungu};
  });
  return Object.keys(by).sort().map(function(k){ return by[k].name });
}
function fillRegionList(){
  var dl=q("rtRegions");
  if(!dl){ dl=document.createElement("datalist"); dl.id="rtRegions"; document.body.appendChild(dl) }
  dl.innerHTML=regionList().map(function(n){ return '<option value="'+E(n)+'">' }).join("");
}

function injectFields(){
  var rg=q("region");
  if(rg&&!rg.getAttribute("list")){
    rg.setAttribute("list","rtRegions");
    rg.setAttribute("placeholder","순천시 — 아래 「주소로 찾기」로 고르면 정확합니다");
  }
  if(HAS_DB&&rg&&!q("dbAddr")){
    var f=document.createElement("div");
    f.className="field";
    f.innerHTML='<label>동네·상세위치 <small style="font-weight:600;color:#8b95a1">지도·동선에 씁니다</small></label>'+
      '<div style="display:flex;gap:6px">'+
        '<input id="dbAddr" placeholder="조례동 / 순천시 조례동 한아름아파트" style="flex:1;min-width:0">'+
        '<button type="button" class="btn btn-light" id="dbAddrFind" style="flex:none;white-space:nowrap">📍 주소로 찾기</button>'+
      '</div><div id="dbAddrTag" style="margin-top:5px"></div>';
    rg.parentNode.parentNode.insertBefore(f,rg.parentNode.nextSibling);
    q("dbAddrFind").onclick=function(){
      pickOpen("고객이 사는 곳 찾기",(q("dbAddr").value||q("region").value||"").trim(),function(p){
        var txt=p.label+(p.dong&&p.label.indexOf(p.dong)<0?" ("+p.dong+")":"");
        q("dbAddr").value=txt;
        if(p.sigungu) q("region").value=p.sigungu;
        PICKED.db=Object.assign({text:txt},p);
        addrTag(p);
      });
    };
    q("dbAddr").addEventListener("input",function(){
      if(!PICKED.db||PICKED.db.text!==q("dbAddr").value){ PICKED.db=null; addrTag(null) }
    });
  }
  var af=q("appointmentField");
  if(HAS_CALL&&af&&!q("apptPlace")){
    var g=document.createElement("div");
    g.className="field hidden"; g.id="apptPlaceField";
    g.innerHTML='<label>만날 장소 <small style="font-weight:600;color:#8b95a1">지도에 이 점이 찍힙니다</small></label>'+
      '<div style="display:flex;gap:6px">'+
        '<input id="apptPlace" placeholder="조례동 스타벅스 / 고객 자택" style="flex:1;min-width:0">'+
        '<button type="button" class="btn btn-light" id="apptFind" style="flex:none;white-space:nowrap">📍 찾기</button>'+
      '</div>';
    af.parentNode.insertBefore(g,af.nextSibling);
    q("apptFind").onclick=function(){
      var d=findDb(((q("callDbId")||{}).value)||"");
      pickOpen("만날 곳 찾기",(q("apptPlace").value||regionName(d)||"").trim(),function(p){
        q("apptPlace").value=p.label;
        PICKED.call=Object.assign({text:p.label},p);
        say("만날 곳을 "+(p.sigungu||"")+" "+(p.dong||"")+" 로 잡았습니다.",2600);
      });
    };
    q("apptPlace").addEventListener("input",function(){
      if(!PICKED.call||PICKED.call.text!==q("apptPlace").value)PICKED.call=null;
    });
  }
  var ta=document.querySelector(".top-actions");
  if(ta&&!q("rtBtn")){
    var b=document.createElement("button");
    b.id="rtBtn"; b.className="btn btn-dark"; b.textContent="🗺️ 지역 동선";
    b.onclick=function(){ routeOpen() };
    ta.insertBefore(b,ta.firstChild);
  }
}
function addrTag(p){
  var t=q("dbAddrTag"); if(!t)return;
  t.innerHTML=p?('<span class="badge green">카카오 확인 · '+E([p.sido,p.sigungu,p.dong].filter(Boolean).join(" "))+'</span>')
                :'';
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
    injectFields(); fillRegionList();
    var d=id?findDb(id):null;
    if(q("dbAddr")) q("dbAddr").value=(d&&d.addr)||"";
    PICKED.db=(d&&d.addr&&d.lat&&d.lng)
      ? {text:d.addr,lat:+d.lat,lng:+d.lng,label:d.addr,
         sido:d.sido||"",sigungu:d.sigungu||"",dong:d.dong||"",region_code:d.region_code||""}
      : null;
    addrTag(PICKED.db&&PICKED.db.region_code?PICKED.db:null);
    return r;
  };
}
var origSaveDb=window.saveDb;
if(typeof origSaveDb==="function"){
  window.saveDb=function(){
    var self=this, args=arguments;
    /* 단계가 AP·PC·CS 로 올라갔는지 — 저장 전에 기억해 둔다 */
    var _id=((q("dbId")||{}).value)||"";
    var _was=_id?(((findDb(_id)||{}).stage)||""):"";
    var _now=((q("dbStage")||{}).value)||"";
    var _nm=((q("customerName")||{}).value||"").trim();
    var _ph=((q("phone")||{}).value||"").trim();
    var body=function(){ return origSaveDb.apply(self,args) };
    if(HAS_DB&&q("dbAddr")) body=function(){ return saveDbGeo(self,args) };
    return Promise.resolve().then(body).then(function(v){
      afterStage(_id,_was,_now,_nm,_ph);
      return v;
    });
  };
  function saveDbGeo(self,args){
    var t=(q("dbAddr").value||"").trim(), region=((q("region")||{}).value||"").trim();
    var extra={addr:t||null,lat:null,lng:null};
    if(HAS_STD) Object.assign(extra,{region_code:null,sido:null,sigungu:null,dong:null});
    /* 창에서 골라 둔 것이 그대로면 다시 묻지 않는다 */
    var pre=(PICKED.db&&PICKED.db.text===t)?Promise.resolve(PICKED.db)
           :(t?resolvePlace(t,region):Promise.resolve(null));
    return pre.then(function(p){
      if(p){
        extra.lat=p.lat; extra.lng=p.lng;
        /* 지역 칸이 비었으면 카카오가 준 이름으로 채워 준다 */
        if(p.sigungu&&!region&&q("region")){ q("region").value=p.sigungu; region=p.sigungu }
        var clash=!!(p.sigungu&&region&&regionText(region)!==regionText(p.sigungu));
        if(HAS_STD&&!clash){
          extra.region_code=p.region_code||null; extra.sido=p.sido||null;
          extra.sigungu=p.sigungu||null; extra.dong=p.dong||null;
        }
        /* 적어 둔 지역과 주소가 다른 데를 가리키면 — 좌표만 넣고 행정구역은
           비워 둡니다. 여기서 남의 지역 코드를 적어 버리면 그 사람이 통째로
           다른 지역 사람으로 세어집니다. */
        if(clash){
          say("지역은 「"+region+"」인데 주소는 "+p.sigungu+" 입니다. "+
              "행정구역은 비워 두었습니다 — 📍 주소로 찾기 로 다시 잡아 주세요.",8000);
        }
      }
      return withPatch("dbs",extra,function(){ return origSaveDb.apply(self,args) });
    });
  }
}

/* ── 단계가 올라가면 그 지역 열 명 ──────────────────────────────
   AP 만이 아니라 PC·CS 에서도 똑같이 뜹니다. 어느 단계든 <b>그 지역에
   갈 일이 생긴 것</b>은 같기 때문입니다. */
var STAGE_HIT={AP:1,PC:1,CS:1};
function guessNew(nm,ph){
  if(!nm)return null;
  var hit=null;
  try{
    dbs.forEach(function(d){
      if(d.customer_name!==nm)return;
      if(ph&&(d.phone||"")!==ph)return;
      if(!hit||String(d.updated_at||"")>String(hit.updated_at||""))hit=d;
    });
  }catch(e){}
  return hit;
}
function afterStage(id,was,now,nm,ph){
  if(!STAGE_HIT[now]||now===was)return;
  var closed=q("dbModal")&&!q("dbModal").classList.contains("open");
  if(!closed)return;                      /* 저장이 안 됐으면 창이 열려 있다 */
  setTimeout(function(){
    var d=id?findDb(id):guessNew(nm,ph);
    if(d)nearOpen(d.id,nextAppt(d),now);
  },320);
}

/* ── 통화 저장 — 장소를 같이 넣고, AP 면 바로 「이 지역 열 명」 ── */
var origOpenCall=window.openCall;
if(typeof origOpenCall==="function"){
  window.openCall=function(id){
    var r=origOpenCall.apply(this,arguments);
    injectFields();
    var d=findDb(id);
    if(q("apptPlace")) q("apptPlace").value=(d&&d.next_appt_place)||(d&&d.addr)||"";
    PICKED.call=(d&&d.next_appt_place&&d.next_appt_lat&&d.next_appt_lng)
      ? {text:d.next_appt_place,lat:+d.next_appt_lat,lng:+d.next_appt_lng}
      : ((d&&d.addr&&d.lat&&d.lng&&!d.next_appt_place)
          ? {text:d.addr,lat:+d.lat,lng:+d.lng} : null);
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
      if(place) pre=(PICKED.call&&PICKED.call.text===place)
        ? Promise.resolve(PICKED.call) : geo(place,regionName(d));
    }
    return pre.then(function(p){
      if(p){ extra.appt_lat=p.lat; extra.appt_lng=p.lng }
      return withPatch("calls",extra,function(){ return origSaveCall.apply(self,args) });
    }).then(function(v){
      /* 저장이 실제로 끝났으면 창이 닫혀 있습니다 */
      var closed=q("callModal")&&!q("callModal").classList.contains("open");
      if(res==="상담"&&app&&closed&&d) setTimeout(function(){ nearOpen(dbId,app,"AP") },300);
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
  var rg=regionText(d0.region), now=Date.now(), p0=ptOf(d0), out=[];
  if(!rg&&!d0.region_code)return out;
  dbs.forEach(function(d){
    if(d.id===d0.id)return;
    if(!sameRegion(d0,d))return;
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
  var area=(regionName(d0)||"그쪽")+(placeOf(d0)?" "+String(placeOf(d0)).split(" ")[0]:"");
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
  styles();
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
        '<button class="btn btn-light hidden" id="rtNearCare">📋 계약 후 관리 미리보기</button>'+
        '<button class="btn btn-dark" id="rtNearMap">🗺️ 이날 동선 보기</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(m);
  var close=function(){ m.classList.remove("open") };
  q("rtNearX").onclick=close; q("rtNearL").onclick=close;
}

/* 단계마다 그 지역에 가는 이유가 다릅니다 — 고객에게 할 말은 같지만,
   나에게 보이는 안내는 달라야 합니다. */
var WHY={
  AP:{tag:"약속",  line:"님 <b>약속 한 건</b> 때문에 "},
  PC:{tag:"상담",  line:"님을 <b>상담</b>하러 "},
  CS:{tag:"클로징",line:"님 <b>계약 자리</b> 때문에 "}
};
/* 날짜가 없을 때 — 내일 오후 2시부터 잡아 둔다. 화면에서 고칠 수 있습니다. */
function defWhen(){
  var d=new Date(); d.setDate(d.getDate()+1); d.setHours(14,0,0,0); return d;
}
function localVal(d){
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
}
/* 지금 창에 적힌 날짜 — 화법과 「이날 동선」이 이것을 씁니다 */
function curWhen(){
  var el=q("rtNearWhen");
  var v=el&&el.value?new Date(el.value):null;
  return (v&&!isNaN(v))?v:defWhen();
}

function nearOpen(dbId,when,why){
  var d0=findDb(dbId); if(!d0)return;
  nearModal();
  var w=when?new Date(when):null;
  if(!w||isNaN(w)){ var na=nextAppt(d0); w=na?new Date(na):defWhen() }
  var W=WHY[why]||WHY.AP;
  var list=candidates(d0,w,10);
  var day=(w.getMonth()+1)+"월 "+w.getDate()+"일("+wday(w)+") "+hm(w);
  q("rtNearT").innerHTML="📍 "+E(regionName(d0)||"지역")+" — "+E(day)+" "+E(W.tag)+" 잡혔습니다";
  var head=
    '<div class="notice" style="margin-bottom:14px">'+
      '<b>'+E(d0.customer_name)+'</b> '+W.line+E(regionName(d0)||"그 지역")+'까지 갑니다. '+
      '가는 김에 <b>2~3명만 더</b> 붙이면 하루가 채워집니다.<br>'+
      '아래는 같은 지역에서 <b>아직 약속이 없고 · 거절하지 않은</b> 사람을 '+
      '오래 방치된 순 · 덜 걸어본 순 · 가까운 순으로 섞어 뽑은 열 명입니다.'+
    '</div>'+
    '<div class="field" style="margin-bottom:14px">'+
      '<label>그 지역에 가는 날 <small style="font-weight:600;color:#8b95a1">'+
        '이 날짜로 화법이 만들어집니다 — 고쳐도 됩니다</small></label>'+
      '<input type="datetime-local" id="rtNearWhen" value="'+E(localVal(w))+'">'+
    '</div>';
  if(!list.length){
    q("rtNearB").innerHTML=head+'<div class="empty">같은 지역에 아직 걸 사람이 없습니다.<br>'+
      'DB 등록 창의 <b>지역</b> 칸을 「'+E(regionName(d0)||"순천시")+'」로 맞춰 두면 여기에 모입니다.<br>'+
      '<b>📍 주소로 찾기</b> 로 고르면 이름이 갈라지지 않습니다.</div>';
  }else{
    var rows=list.map(function(c,i){
      var d=c.d, tel=(d.phone||"").replace(/[^0-9+]/g,"");
      var bg=c.n===0?'<span class="badge yellow">한 번도 안 걺</span>'
                    :'<span class="badge gray">'+c.n+'회 접촉</span>';
      var far=c.km!=null?'<span class="badge blue" style="margin-left:4px">'+kmTxt(c.km)+'</span>':"";
      /* 위치를 모르는 사람은 <b>여기서 바로</b> 찍게 한다. 이 목록을 볼 때
         사장님은 이미 이 열 명을 보고 계신다 — 전화 걸면서 「아, ○○동
         사세요?」 하는 그 순간이 자료가 들어오는 제일 싼 자리다.
         따로 시간 내서 정리하는 일을 아예 없앤다. */
      var noPt=!ptOf(d);
      if(noPt) far+='<span class="badge yellow" style="margin-left:4px">동네 모름</span>';
      return '<div class="rt-row">'+
        '<div class="rt-no">'+(i+1)+'</div>'+
        '<div class="rt-who"><b>'+E(d.customer_name)+'</b>'+
          '<small>'+E(d.phone||"연락처 없음")+(placeOf(d)?" · "+E(placeOf(d)):"")+'</small>'+
          '<div style="margin-top:5px">'+bg+far+
          '<span class="badge gray" style="margin-left:4px">'+c.days+'일째</span></div></div>'+
        '<div class="rt-act">'+
          (tel?'<a class="btn btn-primary btn-sm" href="tel:'+E(tel)+'">📞 전화</a>':"")+
          '<button class="btn btn-light btn-sm" data-talk="'+i+'">📋 화법</button>'+
          (noPt?'<button class="btn btn-light btn-sm" data-pin="'+E(d.id)+'">📍 동네</button>'
               :'<a class="btn btn-light btn-sm" target="_blank" rel="noopener" href="'+naviUrl(d)+'">🧭 내비</a>')+
          '<button class="btn btn-dark btn-sm" data-call="'+E(d.id)+'">약속 잡기</button>'+
        '</div>'+
        '<div class="rt-talk hidden" id="rtTalk'+i+'"></div>'+
      '</div>';
    }).join("");
    q("rtNearB").innerHTML=head+'<div class="rt-list">'+rows+'</div>';
    Array.prototype.forEach.call(q("rtNearB").querySelectorAll("[data-pin]"),function(b){
      b.onclick=function(){ pinOne(b.getAttribute("data-pin")) };
    });
    Array.prototype.forEach.call(q("rtNearB").querySelectorAll("[data-talk]"),function(b){
      b.onclick=function(){
        var i=+b.getAttribute("data-talk"), box=q("rtTalk"+i), c=list[i];
        if(box.getAttribute("data-on")==="1"){ box.classList.add("hidden"); box.setAttribute("data-on","0"); return }
        box.setAttribute("data-on","1"); box.classList.remove("hidden");
        var W2=curWhen();
        box.innerHTML=tCard("전화 — 가는 김에",talk(c.d,d0,W2,"a"))+
                      tCard("전화 — 못 받은 보험금",talk(c.d,d0,W2,"b"))+
                      tCard("문자로 보낼 때",talk(c.d,d0,W2,"sms"));
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
  /* 클로징 자리면, 계약 뒤에 무엇을 챙기게 되는지 미리 보여 준다.
     계약 자리에서 이 이야기를 해 두면 뒤에 전화하기가 쉬워집니다. */
  var care=q("rtNearCare");
  if(care){
    var can=(why==="CS"&&typeof window.apexCarePreview==="function");
    care.classList.toggle("hidden",!can);
    care.onclick=can?function(){ window.apexCarePreview(d0.id) }:null;
  }
  q("rtNearMap").onclick=function(){
    q("rtNear").classList.remove("open");
    routeOpen(dayKey(curWhen()),regionName(d0));
  };
  /* 날짜를 고치면 이미 펼쳐 둔 화법은 접는다 — 옛 날짜가 남아 있으면 안 됩니다 */
  var wi=q("rtNearWhen");
  if(wi)wi.onchange=function(){
    Array.prototype.forEach.call(q("rtNearB").querySelectorAll(".rt-talk"),function(b){
      b.classList.add("hidden"); b.setAttribute("data-on","0"); b.innerHTML="";
    });
    var t=curWhen();
    q("rtNearT").innerHTML="📍 "+E(regionName(d0)||"지역")+" — "+
      E((t.getMonth()+1)+"월 "+t.getDate()+"일("+wday(t)+") "+hm(t))+" "+E(W.tag)+" 잡혔습니다";
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
  ".rt-hit{cursor:pointer;border-radius:10px;padding-left:9px;padding-right:9px}",
  ".rt-ways{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}",
  ".rt-ways .btn{flex:1;min-width:150px}",
  ".rt-pmap{position:relative;height:320px;border-radius:12px;overflow:hidden;border:1px solid var(--line,#e5e8eb)}",
  ".rt-pmap>div{width:100%;height:100%}",
  /* 지도를 움직여 가운데 십자에 맞춘다 — 손가락으로 핀을 집는 것보다 폰에서 훨씬 쉽다 */
  ".rt-cross{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-26px 0 0 -13px;",
  "pointer-events:none;z-index:5;font-size:26px;line-height:26px;text-align:center}",
  ".rt-hit:hover{background:#eef6ff}",
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
      '<button class="btn btn-light btn-sm" id="rtFix">📍 위치 정리하기</button>'+
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
  q("rtFix").onclick=fixAll;
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
    if(region&&regionText(d.region)!==regionText(region))return;
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
    if(region&&regionText(d.region)!==regionText(region))return;
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
  /* 「순천」과 「순천시」가 목록에 두 번 뜨지 않게 맨 이름으로 묶는다 */
  var by={}, sel=q("rtRegion"), keep=sel.value;
  dbs.forEach(function(d){
    var k=regionText(d.region); if(!k)return;
    if(!by[k])by[k]={name:regionName(d),n:0,split:{},std:!!d.sigungu};
    by[k].n++;
    by[k].split[String(d.region||"").trim()]=1;
    if(d.sigungu&&!by[k].std){ by[k].name=d.sigungu; by[k].std=true }
  });
  var keys=Object.keys(by).sort(), names=keys.map(function(k){return by[k].name});
  sel.innerHTML='<option value="">지역 전체</option>'+keys.map(function(k){
    var g=by[k], dup=Object.keys(g.split).length>1?" ⚠":"";
    return '<option value="'+E(g.name)+'">'+E(g.name)+' ('+g.n+')'+dup+'</option>' }).join("");
  if(keep){
    Array.prototype.forEach.call(sel.options,function(o){
      if(regionText(o.value)===regionText(keep))sel.value=o.value });
  }

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

  /* 지역이 두 이름으로 갈라져 있으면 먼저 알려 준다 — 여기서 사람이 샙니다 */
  var split={};
  dbs.forEach(function(d){
    if(owner&&d.assigned_to!==owner)return;
    var k=regionText(d.region); if(!k)return;
    (split[k]=split[k]||{})[String(d.region||"").trim()]=1;
  });
  var bad=Object.keys(split).filter(function(k){ return Object.keys(split[k]).length>1 });
  if(bad.length){
    side.push('<div class="rt-card" style="background:#fff4e6;border-color:#ffd8a8;color:#a8730f;font-size:13px">'+
      '<b>지역 이름이 '+bad.length+'곳에서 갈라져 있습니다.</b><br>'+
      bad.slice(0,3).map(function(k){ return E(Object.keys(split[k]).join(" / ")) }).join("<br>")+
      (bad.length>3?"<br>…":"")+
      '<br><br>지금은 같은 지역으로 <b>보고 세고 있습니다</b>. 다만 원래 CRM 화면의 지역 칸에는 갈라진 채로 보입니다 — '+
      '위의 <b>🏷 지역 정리</b> 를 누르면 카카오가 정한 한 이름으로 모읍니다.</div>');
  }

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
      var nav=x.pt?'<a class="btn btn-light btn-sm" target="_blank" rel="noopener" href="'+
        naviUrl(x.d)+'">🧭 내비</a>':"";
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
  }).catch(function(e){ keyPanel(false,e) });
}

/* ── 키가 없을 때 안내 ──────────────────────────────────────────── */
/* 왜 안 됐는지 <b>화면에 적는다.</b> 카카오는 이유를 또박또박 말해 줍니다 —
   「domain mismatched! caller=… check out registered web domains」. 그런데
   그 답은 <script> 태그로 받아 오는 것이라 브라우저가 본문을 못 읽고
   (CORS 허용이 없습니다) onerror 만 옵니다. 예전에는 그 자리에서 아무 말
   없이 이 화면으로 되돌아왔습니다 — 사장님 눈에는 <b>단추가 안 먹는</b>
   것으로 보였습니다. 이유를 모르면 열 번을 눌러도 열 번 똑같습니다.
   그래서 「키는 넣었는데 카카오가 거절했다」를 따로 적고, 막히는 자리
   둘(도메인 등록 · 카카오맵 켜기)을 지금 이 주소와 함께 보여 줍니다. */
function keyPanel(force,err){
  var box=q("rtNokey"); if(!box)return;
  box.classList.remove("hidden");
  var why="";
  if(KEY&&err&&String(err.message||err)!=="NOKEY"){
    why='<div class="rt-card" style="background:#fff1f0;border-color:#ffccc7;color:#a8071a;'+
        'margin-bottom:14px;line-height:1.7">'+
        '<b>키는 들어갔는데 카카오가 거절했습니다.</b><br>'+
        '거의 언제나 아래 <b>둘 중 하나</b>입니다 — 키를 다시 만들 필요는 없습니다.'+
        '<ol style="margin:8px 0 0;padding-left:18px">'+
        '<li><b>이 주소가 등록돼 있지 않다</b> — 카카오 콘솔의 Web 플랫폼에 '+
          '<code style="background:#fff;padding:1px 5px;border-radius:5px">'+E(location.origin)+'</code> '+
          '를 그대로 넣으세요. 끝에 <b>/</b> 를 붙이지 마십시오.</li>'+
        '<li><b>카카오맵을 아직 안 켰다</b> — 제품 설정 → 카카오맵 → <b>사용함</b>.</li>'+
        '</ol></div>';
  }
  box.innerHTML=why+
    '<div style="max-width:520px">'+
    '<h3 style="margin:0 0 8px;color:var(--navy)">지도를 켜려면 카카오 키가 한 번 필요합니다</h3>'+
    '<p style="color:var(--muted);line-height:1.65;margin:0 0 14px">무료입니다. '+
    '한 사람(대표)이 한 번만 넣으면 팀 전체가 같이 씁니다.</p>'+
    '<ol style="line-height:1.9;color:var(--text);padding-left:18px;margin:0 0 14px">'+
    '<li><a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener">developers.kakao.com</a> 접속 → 카카오 계정 로그인</li>'+
    '<li><b>애플리케이션 추가하기</b> → 앱 이름 「APEX」, 회사명 아무거나 → 저장</li>'+
    '<li>만든 앱 → <b>앱 키</b> 에서 <b>JavaScript 키</b> 를 복사</li>'+
    '<li>같은 앱 → <b>일반</b>(또는 <b>플랫폼</b>) → <b>Web</b> → 사이트 도메인에 아래 주소를 등록<br>'+
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

/* ── 🏠 출발지 ──────────────────────────────────────────────────
   아침에 어디서 나서는지. 이것이 있어야 「몇 시에 나서야 하는지」가
   나옵니다. 예전에는 이 함수가 「좌표 채우기」와 주석을 같이 쓰고
   있어서, 그쪽을 지울 때 <b>같이 딸려 나갔습니다</b> — 화면은 멀쩡한데
   🏠 출발지만 죽었습니다. 점검이 잡아 줬습니다. 이제 자기 주석을
   따로 갖습니다. */
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

/* ── 📍 위치 정리하기 — 한 단추, 한 화면, 한 번 누르기 ────────────
   예전에는 단추가 셋이었습니다 — 「좌표 채우기」·「지역 정리」·「주소를
   동네 칸으로」. 셋 다 결국 <b>같은 일</b>을 나눠 하던 것인데, 어느 것을
   어느 순서로 눌러야 하는지 아무도 몰랐습니다. 순서를 틀리면 「채울 것이
   없습니다」만 뜨고 아무 일도 안 일어났습니다.

   이제 한 단추입니다. 한 번 훑어 <b>세 가지를 한꺼번에</b> 계획하고,
   무엇이 어떻게 바뀌는지 한 화면에 보여 준 뒤, 누르면 그때 씁니다.

     ① 지역 칸에 주소가 통째로 든 줄 → 동네 칸으로 옮기고 좌표까지
     ② 동네는 적혔는데 좌표가 없는 줄 → 좌표를 채우고
     ③ 같은 시인데 이름이 갈라진 줄 → 한 이름으로 모은다

   ★ 가드는 그대로입니다. 카카오가 <b>적힌 지역과 다른 데</b>를 가리키면
   좌표만 넣고 <b>행정구역은 손대지 않습니다.</b> 시험에서 「여수」가
   「순천시」로 바뀌려 했던 자리입니다 — 「학동」처럼 전국에 여러 개인
   이름을 넣으면 엉뚱한 시가 나옵니다. 사람이 적어 둔 동네도 안 덮습니다. */
/* 지역 칸에 <b>주소가 통째로</b> 들어간 줄인가 — 「여수시 ○○동 343
   ○○ 근처(자택)」 같은 것. 맨 이름이 길거나 숫자·괄호가 섞였으면
   도시 이름이 아니라 주소다. */
function looksAddr(t){
  var k=regionText(t);
  return !!k && (k.length>4 || /[0-9()]/.test(k));
}
function fixAll(){
  if(!HAS_DB){ say("서버에 위치 칸이 없습니다 — migration_46_db_geo.sql 을 한 번 실행하세요.",6000); return }
  if(!KEY){ keyPanel(true); return }
  var owner=q("rtOwner").value||"";
  var mine=dbs.filter(function(d){ return !owner||d.assigned_to===owner });
  if(!mine.length){ say("정리할 고객이 없습니다."); return }

  /* ③ 을 위해 같은 시끼리 먼저 묶어 둔다 */
  var by={};
  mine.forEach(function(d){
    var k=regionText(d.region); if(!k||looksAddr(d.region))return;
    if(!by[k])by[k]={key:k,rows:[],names:{},std:""};
    by[k].rows.push(d); by[k].names[String(d.region||"").trim()]=1;
    if(d.sigungu&&!by[k].std&&regionText(d.sigungu)===k)by[k].std=d.sigungu;
  });

  /* 카카오에 물어볼 것 — 한 줄에 한 번만 묻는다 (7번) */
  var jobs=[];
  mine.forEach(function(d){
    if(looksAddr(d.region)&&!String(d.addr||"").trim())
      jobs.push({kind:"addr",d:d,text:String(d.region||"").trim()});
    else if(String(d.addr||"").trim()&&!(d.lat&&d.lng))
      jobs.push({kind:"geo",d:d,text:String(d.addr).trim()});
    if(String(d.next_appt_place||"").trim()&&!(d.next_appt_lat&&d.next_appt_lng))
      jobs.push({kind:"appt",d:d,text:String(d.next_appt_place).trim()});
  });
  Object.keys(by).forEach(function(k){
    var g=by[k];
    if(Object.keys(g.names).length<2)return;      /* 안 갈라졌으면 둘 일이 없다 */
    if(g.std)return;                              /* 이미 카카오가 준 이름이 있다 */
    var seed=Object.keys(g.names).sort()[0];
    jobs.push({kind:"name",g:g,text:seed});
  });

  if(!jobs.length){ say("정리할 것이 없습니다 — 위치가 이미 다 맞아 있습니다.",4000); return }

  say("카카오에 "+jobs.length+"건을 확인하는 중입니다…",8000);
  var i=0, plan=[], skip=[];
  (function step(){
    if(i>=jobs.length)return show();
    var j=jobs[i++];
    resolvePlace(j.text,(j.kind==="name")?"":regionName(j.d||{})).then(function(p){
      if(!p){ skip.push({t:j.text,why:"카카오가 이 주소를 못 찾았습니다"}); return }
      var kk=p.sigungu?regionText(p.sigungu):"";
      if(j.kind==="name"){
        if(kk&&kk===j.g.key)plan.push({kind:"name",g:j.g,std:p.sigungu,sido:p.sido||""});
        else skip.push({t:Object.keys(j.g.names).join(" · "),
          why:p.sigungu?("카카오는 「"+p.sigungu+"」라고 답했습니다 — 적힌 지역과 다릅니다")
                       :"시·군·구를 알 수 없습니다"});
        return;
      }
      /* 적힌 지역과 다른 데면 좌표만 — 행정구역은 안 건드린다.
         <b>왜 그대로 두는지 갈라서 적는다.</b> 두 가드에 같은 말을 적으면
         하나를 빼도 화면이 똑같아 아무도 못 알아챈다 (8번). */
      var same=false, why="";
      if(j.kind==="addr"){
        if(kk.length<2) why="「"+p.sigungu+"」는 여러 시에 다 있는 이름이라 쓰지 않습니다";
        else if(regionText(j.text).indexOf(kk)!==0)
          why="카카오는 「"+p.sigungu+"」라고 답했는데 적힌 글이 그 이름으로 시작하지 않습니다";
        else same=true;
      }else{
        if(kk&&regionText(j.d.region)===kk) same=true;
        else if(p.sigungu&&j.kind!=="appt")
          why="카카오는 「"+p.sigungu+"」라고 답했습니다 — 적힌 지역과 다릅니다";
      }
      plan.push({kind:j.kind,d:j.d,text:j.text,p:p,same:same});
      if(why) skip.push({t:j.text,why:why+" (좌표만 넣습니다)"});
    }).catch(function(){ skip.push({t:j.text,why:"확인하지 못했습니다"}) })
      .then(function(){ setTimeout(step,220) });
  })();

  function show(){
    tidyModal();
    q("rtTidyT").textContent="위치 정리하기";
    var A=plan.filter(function(x){return x.kind==="addr"}),
        G=plan.filter(function(x){return x.kind==="geo"||x.kind==="appt"}),
        N=plan.filter(function(x){return x.kind==="name"});
    function card(t,rows){ return rows.length
      ? '<div class="rt-h">'+t+' '+rows.length+'건</div><div class="rt-card">'+rows.join("")+'</div>' : "" }
    var h='<div class="notice" style="margin-bottom:12px">'+
      '<b>한 번에 정리합니다.</b> 고객 정보·단계·약속은 건드리지 않습니다. '+
      '카카오가 <b>적힌 지역과 다른 데</b>를 가리키면 좌표만 넣고 행정구역은 비워 둡니다.</div>';
    h+=card("주소를 동네 칸으로 옮기고 좌표까지",A.map(function(x){
      return '<div class="rt-row"><div class="rt-no">📮</div><div class="rt-who"><b>'+E(x.text)+'</b>'+
        '<small>'+(x.same?('지역은 「<b>'+E(x.p.sigungu)+'</b>」로 바로잡습니다'):'좌표만 넣습니다')+'</small></div></div>' }));
    h+=card("좌표를 채웁니다",G.map(function(x){
      return '<div class="rt-row"><div class="rt-no">📍</div><div class="rt-who"><b>'+E(x.d.customer_name)+'</b>'+
        '<small>'+E(x.text)+(x.kind==="appt"?" · 만날 장소":"")+'</small></div></div>' }));
    h+=card("갈라진 지역 이름을 하나로",N.map(function(x){
      return '<div class="rt-row"><div class="rt-no">🏷</div><div class="rt-who"><b>'+
        E(Object.keys(x.g.names).join(" · "))+'</b><small>「<b>'+E(x.std)+'</b>」로 모읍니다 · '+
        x.g.rows.length+'건</small></div></div>' }));
    if(skip.length)h+='<div class="rt-h">그대로 두는 것</div><div class="rt-card">'+
      skip.map(function(x){ return '<div class="rt-row"><div class="rt-no">✋</div>'+
        '<div class="rt-who"><b>'+E(x.t)+'</b><small>'+E(x.why)+'</small></div></div>' }).join("")+'</div>';
    if(!plan.length){
      h+='<div class="notice">바꿀 것이 없습니다.</div>';
      q("rtTidyGo").classList.add("hidden");
    }else q("rtTidyGo").classList.remove("hidden");
    q("rtTidyB").innerHTML=h;
    q("rtTidyGo").onclick=function(){ apply() };
    q("rtTidy2").classList.add("open");
  }

  function apply(){
    var jobs2=[];
    plan.forEach(function(x){
      if(x.kind==="name"){
        x.g.rows.forEach(function(d){
          var pa={region:x.std};
          if(HAS_STD){ pa.sigungu=x.std; if(x.sido)pa.sido=x.sido }
          jobs2.push({id:d.id,patch:pa});
        });
        return;
      }
      if(x.kind==="appt"){ jobs2.push({id:x.d.id,patch:{next_appt_lat:x.p.lat,next_appt_lng:x.p.lng}}); return }
      var pa={lat:x.p.lat,lng:x.p.lng};
      if(x.kind==="addr")pa.addr=x.text;
      if(x.same){
        if(x.kind==="addr")pa.region=x.p.sigungu;
        if(HAS_STD){ pa.region_code=x.p.region_code||null; pa.sido=x.p.sido||null;
                     pa.sigungu=x.p.sigungu||null; pa.dong=x.p.dong||null }
      }
      jobs2.push({id:x.d.id,patch:pa});
    });
    q("rtTidyGo").disabled=true; q("rtTidyGo").textContent="정리하는 중…";
    var j=0, ok=0, no=0;
    (function run(){
      if(j>=jobs2.length){
        q("rtTidy2").classList.remove("open");
        q("rtTidyGo").disabled=false; q("rtTidyGo").textContent="이대로 바꾸기";
        say(ok+"건을 정리했습니다."+(no?" "+no+"건은 권한이 없어 넘어갔습니다.":""),6000);
        if(window.loadAll)Promise.resolve(loadAll()).then(function(){ fillPickers(); render() });
        else render();
        return;
      }
      var t=jobs2[j++];
      sb.from("dbs").update(t.patch).eq("id",t.id).then(function(r){
        if(r&&r.error)no++; else ok++;
      }).catch(function(){ no++ }).then(function(){ setTimeout(run,60) });
    })();
  }
}

/* ── 내비로 넘기는 주소 ───────────────────────────────────────────
   폰에서는 카카오맵·카카오내비가 받아 그대로 길안내가 시작됩니다.
   PC 에서는 카카오맵 웹이 열립니다.

   경유지를 <b>한 번에 밀어 넣는</b> 길도 있습니다(카카오내비 SDK). 다만
   한 번에 몇 곳까지 받는지가 우리가 정하는 값이 아니라서, 넘겼는데 뒤가
   잘리면 <b>안 간 곳을 갔다고 믿게 됩니다.</b> 그래서 여기서는 구간마다
   하나씩 넘깁니다 — 현장에서도 어차피 한 구간씩 갑니다.
   주소를 만드는 자리는 여기 <b>한 곳</b>뿐입니다 (5번). */
function naviUrl(d){
  var p=ptOf(d); if(!p)return "";
  return "https://map.kakao.com/link/to/"+
    encodeURIComponent(d.customer_name||"약속")+","+p.lat+","+p.lng;
}

/* ── 그 자리에서 한 사람 동네 찍기 ────────────────────────────── */
function pinOne(id){
  var d=findDb(id); if(!d)return;
  if(!HAS_DB){ say("서버에 위치 칸이 없습니다 — migration_46_db_geo.sql 을 한 번 실행하세요.",6000); return }
  pickOpen(E(d.customer_name||"고객")+" 님 동네",(d.addr||regionName(d)||"").trim(),function(p){
    var txt=p.label+(p.dong&&p.label.indexOf(p.dong)<0?" ("+p.dong+")":"");
    var patch={addr:txt,lat:p.lat,lng:p.lng};
    /* 적힌 지역과 다른 시·군이 나오면 좌표만 넣습니다 — 여수가 순천시로
       바뀌려 했던 그 가드를 여기서도 씁니다. */
    var clash=!!(p.sigungu&&d.region&&regionText(p.sigungu)!==regionText(d.region));
    if(HAS_STD&&!clash){
      patch.region_code=p.region_code||null; patch.sido=p.sido||null;
      patch.sigungu=p.sigungu||null; patch.dong=p.dong||null;
    }
    sb.from("dbs").update(patch).eq("id",d.id).then(function(r){
      if(r&&r.error){ say("저장하지 못했습니다: "+(r.error.message||""),6000); return }
      say(txt+" 로 적었습니다."+(clash?" 지역이 「"+d.region+"」인데 주소는 "+p.sigungu+" 라 행정구역은 비워 두었습니다.":""),
          clash?8000:3000);
      if(window.loadAll)Promise.resolve(loadAll()).then(render); else render();
    });
  });
}

function tidyModal(){
  styles();
  if(q("rtTidy2"))return;
  var m=document.createElement("div");
  m.className="modal"; m.id="rtTidy2";
  m.innerHTML=
    '<div class="modal-box" style="width:min(620px,100%)">'+
      '<div class="modal-head"><h3 id="rtTidyT">지역 이름 정리</h3><button class="close" id="rtTidyX">×</button></div>'+
      '<div class="modal-body" id="rtTidyB"></div>'+
      '<div class="modal-foot"><button class="btn btn-light" id="rtTidyC">그만두기</button>'+
        '<button class="btn btn-primary hidden" id="rtTidyGo">이대로 바꾸기</button></div>'+
    '</div>';
  document.body.appendChild(m);
  var c=function(){ m.classList.remove("open") };
  q("rtTidyX").onclick=c; q("rtTidyC").onclick=c;
}

/* ── 열기 ───────────────────────────────────────────────────────── */
function routeOpen(dateStr,region){
  wrap(); fillPickers();
  q("rtDate").value=dateStr||q("rtDate").value||todayKey();
  if(region!==undefined&&region!==null){
    var s=q("rtRegion"), hit=false;
    Array.prototype.forEach.call(s.options,function(o){ if(regionText(o.value)===regionText(region)){s.value=o.value;hit=true} });
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
    }else if(!HAS_STD){
      console.log("[apex-route] 지역 표준화 칸이 없습니다 — migration_47_region_std.sql 을 실행하면 켜집니다. "+
                  "(그전에도 「순천」과 「순천시」는 같은 지역으로 봅니다)");
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
