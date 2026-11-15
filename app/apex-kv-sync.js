/* ══════════════════════════════════════════════════════════════════════
   이 기기에만 있던 기록을 서버로 — 폰에서 적어도 PC 에 보이게
   ─────────────────────────────────────────────────────────────────────
   사장님 말씀 2026-11-03 —
   「em운영센터나 다른 crm에서 기록하는 모든게 한군데서 입력하더라도
    어디서든 기록이 공유 되도록 만들어줘」

   그날 재어 보니 아래 기록은 <b>그 기기 localStorage 에만</b> 있었습니다.
   그래서 폰과 PC 가 따로 셌고, 리더 · EM 은 볼 수 없었습니다.
     · 본인 점검란(12주 · AC_ROAD · 90일)       apex_ac90_v2
     · APEX 마스터 14일                        apex_master_done
     · 신입 TA 교육 · 거절 근육 훈련             apex_tatrain_v1 · apex_rejgym_v1
     · 4년 유지관리 「보냈습니다」 · 답          apex_mst_done · apex_mst_ans
     · 하루 한 장 기록 · 이달 날수              apex_day_log · apex_day_month
     · 홈 「끝 · 뒤로 · 했음」                  apex_hm_done · apex_hm_skip_v1 · apex_hm_qdone_v1
     · 체크판 오늘 메모                         apex_ck_memo_<날짜>
     · 교육 캘린더 (조직 한 벌)                 apex_edu_cal_v1
   이 파일이 그 열쇠들만 서버 표(apex_user_kv · apex_org_kv)로 올리고,
   다른 기기에서 열면 내려받습니다. 화면 코드는 한 줄도 안 고칩니다 —
   localStorage 에 쓰는 순간을 잡아서 올리고, 열 때 먼저 채워 둡니다.

   ★ <b>올리지 않는 것</b> (CLAUDE.md 3번 · 실명은 이 브라우저에만):
     고객 실명 apex_cli_real_* · 상담카드 apex_fact_cards_*(이름 · 건강) ·
     지인 8주 성장 apex_jiin_grow(지인 실명 명단) · 비포&애프터 · 치료비 · 8통장.
     목록에 없는 열쇠는 절대 안 올립니다 — 넣을 때는 여기 목록에 적습니다.

   ── 같은 기록을 두 기기에서 따로 고친 적이 있으면 ─────────────────────
   이 기기에서 처음 맞출 때는 <b>합칩니다</b>(체크는 한쪽만 했어도 남김).
   그다음부터는 서버 시각이 늦은 쪽이 이깁니다. 시각은 서버가 찍습니다.

   ES5 로 씁니다 — 본체와 같은 손버릇. 서버가 안 되면 조용히 예전처럼
   이 기기에만 남고, 다시 붙으면 올립니다.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.APEX_KV) return;

var ORG_KEYS=['apex_edu_cal_v1'];
var EM_ROLES=['admin','owner','master','manager','lead','leader','branch_manager','education_manager'];
var META='apex_kv_meta';            /* {열쇠: 이 기기가 마지막으로 맞춘 서버 시각} — 이 기기 것 */
var RETRY=[5000,15000,60000];
/* ══ 🔁 <b>명단을 뒤집었습니다</b> (판 X449 · 2026-11-15) ══════════════════
   사장님 말씀 2026-11-15 — 「현재 컴퓨터에서 저장하고, 노트북[다른 곳]에서 열면
   <b>안 보이는 것들이 있어서는 안 되</b>. 전체적으로 모든 내용이 공유 되도록
   만들자. 반대로 노트북 핸드폰에서 저장해도, 어디서든 공유되어야 돼.
   "우리 APEX-PRO" <b>모든게</b>」

   ⚠⚠ <b>재어 보고 까닭을 찾았습니다.</b> apex_ 열쇠 <b>169개</b> 중 올라가는 것이
     <b>13개</b>, 이 기기에만 남는 것이 <b>156개</b>였습니다. 코드가 틀린 것이
     아니라 <b>꼴</b>이 틀렸습니다 — 여기가 「<b>올릴 것을 하나씩 적어 두는
     명단</b>」 이라, 2026-11-03 에 적은 열셋이 그대로 열셋인 동안 화면이 수십 개
     늘었습니다. 명단은 적는 날만 맞고 그 뒤로 날마다 낡습니다.
   ★★ 그래서 <b>뒤집습니다</b> — 이제 <b>안 올릴 것만</b> 적습니다. 새 화면이
     늘면 아무도 손대지 않아도 같이 올라갑니다. <b>이 목록이 짧아야 합니다.</b>
   ★ apex_user_kv 의 서버 규칙은 <b>user_id = auth.uid()</b> 입니다 — <b>본인만</b>
     봅니다(재어 확인했습니다). 팀도 관리자도 못 봅니다. 사장님 기기끼리 나누는
     자리이지 팀에 내놓는 자리가 아닙니다.
   ★★ 그래서 <b>고객 실명도 올라갑니다</b> — 안 올리면 노트북·폰에서 모든 고객이
     「홍○동」 으로 보여, 사장님이 2026-11-14 에 고치라 하신 그 불편(「* 이렇게
     가리는게 없도록해. 검색하고 알아보는데 어려움이 커」)이 <b>다른 기기에서
     되살아납니다.</b> 팀이 보는 자리(clients.name_masked)는 한 글자도 안 바뀌고,
     나가는 자리(AI · 폰 달력 · 엑셀 · 인쇄)는 <b>여전히 가립니다</b> (3번).
   ⛔ <b>주민등록번호는 안 올립니다</b> — 사장님 규칙 「서버로 보내지 말 것 ·
     서버 호출 0번」 입니다. 그 열쇠(apex_cli_rrn_)는 이름으로도 막고 접두사로도
     막습니다. 그래서 주민번호만은 <b>그 기기에서 다시 적으셔야</b> 합니다 (1번).  */

/* ── ⛔ 안 올리는 것 ① <b>이 기기 취향</b> — 올리면 오히려 성가십니다 ── */
var NEVER_EXACT=[
  'apex_kv_meta','apex_kv_reload','apex_user_kv','apex_org_kv',        /* 이 자의 살림 */
  'apex_last_tab','apex_ck_tab','apex_th_cat','apex_ar_cat',           /* 어느 탭을 보던 중이었나 */
  'apex_mcal_view','apex_org_view','apex_delivery_view','apex_delivery_learnpane',
  'apex_nav_fold','apex_nav_easy_v1','apex_nav_grp_shut_v1',
  'apex_set_fold','apex_set_scroll','apex_set_scroll_arm','apex_set_sec',
  'apex_hm_fold_v1','apex_ck_help','apex_capture_guard',
  /* 🙈 이름 가리기 — 사장님이 「<b>그 폰에서</b> 가립니다」 라고 못 박으셨습니다 (판 X399) */
  'apex_hm_hidenm',
  'apex_guide_seen_v2','apex_tour_done_v1','apex_intro_guest',
  /* 💳 결제 설정 — 기기마다 다를 수 있고 잘못 덮이면 <b>돈이 틀립니다</b>. 한 번 더 적으시는
     값이 잘못 덮이는 것보다 낫습니다 (1번). 열쇠 자체는 아래 낱말 그물이 또 막습니다. */
  'apex_toss_confirm_url','apex_pay_cfg',
  /* 📡 <b>이미 제 길로 서버에 올라갑니다</b> — 또 올리면 한 자료가 두 곳이 됩니다 (5번).
     공지는 OS_NOTICE · 조직도는 ORGS.srv · 사업자는 business_clients 가 임자입니다. */
  'apex_notice','apex_org_chart','apex_biz'
];
var NEVER_PRE=[
  'apex_cli_rrn_',      /* ⛔ 주민등록번호 — 사장님 규칙 「서버 호출 0번」 */
  'apex_studio_',       /* 토큰 · 프록시 설정 */
  'apex_intro_',        /* 처음 안내를 봤나 — 이 기기 */
  'apex_fold_',         /* 접힘 */
  'apex_hide_teams_'    /* 숨긴 팀 — 보기 취향 */
];
/* ⛔ ② <b>비밀 낌새는 이름만으로도 막습니다</b> — 목록을 하나 빠뜨려도 새어 나가지
   않게 하는 두 번째 그물입니다. 재어 보니 이 그물에 걸리는 열쇠는 다섯이고
   (apex_cli_rrn_ · apex_key · apex_personal_key · apex_studio_apptoken ·
   apex_toss_client_key) 전부 막아야 하는 것입니다 — 헛것이 없습니다 (8번). */
var NEVER_WORD=/(key|token|secret|rrn|passw|credential)/i;
/* ── apex_ 이름 밖인데 <b>사장님 일</b>인 것 — 여기는 하나씩 적습니다 ──
   우리 이름(apex_)을 안 쓰는 화면이 몇 있습니다. 그쪽은 그물이 못 덮으니
   적어 둡니다. 적은 수와 전체 수를 check-kvall 이 찍어 <b>낡으면 보이게</b> 합니다. */
var ALSO_EXACT=['ba_agent_v1','wk_v1','utp_bag','s6_profile',
                'kdCost','kdLife','kdMe','kdNeed','kdReview'];
var ALSO_PRE=['mikki_'];
/* 📦 너무 큰 값은 안 올립니다 — 저장할 때마다 서버로 나가면 무료 한도를 먹습니다 (7번).
   안 올렸으면 <b>안 올렸다고</b> 남깁니다. 조용히 빠뜨리면 사장님이 노트북에서
   그것만 비어 있는 까닭을 영영 모르십니다 (1번). */
var MAX_V=512*1024;
var tooBig={};

function kindOf(k){
  if(!k||typeof k!=='string') return '';
  if(ORG_KEYS.indexOf(k)>=0) return 'org';
  if(NEVER_WORD.test(k)) return '';                       /* 비밀 낌새 — 제일 먼저 막습니다 */
  var i;
  if(k.indexOf('apex_')===0){
    if(NEVER_EXACT.indexOf(k)>=0) return '';
    for(i=0;i<NEVER_PRE.length;i++) if(k.indexOf(NEVER_PRE[i])===0) return '';
    return 'user';
  }
  if(ALSO_EXACT.indexOf(k)>=0) return 'user';
  for(i=0;i<ALSO_PRE.length;i++) if(k.indexOf(ALSO_PRE[i])===0) return 'user';
  return '';
}

var LS=null; try{ LS=window.localStorage; }catch(e){}
if(!LS) return;
var proto=window.Storage&&Storage.prototype; if(!proto) return;
var oSet=proto.setItem, oRem=proto.removeItem;
var applying=false, client=null, uid=null, role='', who='', ready=false;
var dirty={}, timers={}, tries={}, loadedAt=Date.now(), touched=false;

function rawSet(k,v){ applying=true; try{ oSet.call(LS,k,v); }catch(e){} applying=false; }
function meta(){ try{ return JSON.parse(LS.getItem(META)||'{}')||{}; }catch(e){ return {}; } }
function metaSet(m){ try{ oSet.call(LS,META,JSON.stringify(m)); }catch(e){} }

/* ── 쓰는 순간을 잡는다 ── */
proto.setItem=function(k,v){
  var r=oSet.apply(this,arguments);
  if(this===LS && !applying && kindOf(k)) queue(k);
  return r;
};
proto.removeItem=function(k){
  var r=oRem.apply(this,arguments);
  if(this===LS && !applying && kindOf(k)) queue(k);
  return r;
};
/* 같은 주소의 다른 창 · 안쪽 화면(iframe)이 쓴 것 — 그쪽엔 이 파일이 없을 수 있다 */
window.addEventListener('storage',function(e){
  if(e.storageArea===LS && e.key && kindOf(e.key) && !applying) queue(e.key);
});
['keydown','input','pointerdown'].forEach(function(t){ window.addEventListener(t,function(){ touched=true; },true); });

function queue(k){
  dirty[k]=true;
  clearTimeout(timers[k]);
  timers[k]=setTimeout(function(){ push(k); },1500);
}

/* ── 서버 연결 — 본체(OS.sb) · 하루 한 장(SB) · 바깥 창의 것을 빌린다. 새로 만들지 않는다
      (클라이언트를 하나 더 만들면 로그인 표를 서로 갱신하다 로그아웃될 수 있다) ── */
function findClient(){
  try{ if(window.OS&&OS.sb&&OS.sb.from) return OS.sb; }catch(e){}
  try{ if(window.SB&&SB.from) return SB; }catch(e){}
  try{ if(window.parent!==window&&parent.OS&&parent.OS.sb) return parent.OS.sb; }catch(e){}
  return null;
}
function findRole(){
  try{ if(window.OS&&OS.profile) return OS.profile.role||''; }catch(e){}
  try{ if(window.parent!==window&&parent.OS&&parent.OS.profile) return parent.OS.profile.role||''; }catch(e){}
  try{ if(window.ME&&ME.role) return ME.role; }catch(e){}
  return '';
}

function push(k){
  if(!ready){ return; }                         /* 붙으면 dirty 를 한꺼번에 올림 */
  var kind=kindOf(k); if(!kind) return;
  var v=LS.getItem(k); if(v==null) v='';
  /* 📦 너무 크면 안 올리고 <b>안 올렸다고 남깁니다</b> (1번 · 7번) — 조용히 빠뜨리면
     사장님이 노트북에서 그것만 비어 있는 까닭을 영영 모르십니다. */
  if(v.length>MAX_V){ tooBig[k]=v.length; dirty[k]=false; return; }
  if(tooBig[k]) delete tooBig[k];
  if(!role) role=findRole();
  if(kind==='org' && EM_ROLES.indexOf(role)<0){ dirty[k]=false; return; }   /* 조직 한 벌은 EM 만 고침 */
  var row = kind==='user' ? {user_id:uid,k:k,v:v} : {k:k,v:v,updated_by:who};
  client.from(kind==='user'?'apex_user_kv':'apex_org_kv').upsert(row).select('updated_at').then(function(r){
    if(r&&r.error) throw r.error;
    var m=meta(); if(r&&r.data&&r.data[0]) m[k]=r.data[0].updated_at; metaSet(m);
    if(LS.getItem(k)===v || (LS.getItem(k)==null && v==='')) dirty[k]=false;
    tries[k]=0;
  }).then(null,function(){
    var t=RETRY[Math.min(tries[k]||0,RETRY.length-1)]; tries[k]=(tries[k]||0)+1;
    clearTimeout(timers[k]); timers[k]=setTimeout(function(){ push(k); },t);
  });
}
function flush(){ Object.keys(dirty).forEach(function(k){ if(dirty[k]) push(k); }); }
window.addEventListener('online',flush);
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden') flush();
  else if(ready) pull(false);
  else if(armed) armed();
});

/* ── 합치기 — 처음 맞출 때만. 체크(참)는 한쪽만 했어도 남긴다 ── */
function isObj(x){ return x&&typeof x==='object'&&!Array.isArray(x); }
function empty(x){ return x===undefined||x===null||x===''||x===false||x===0; }
function deep(a,b){                            /* a = 서버, b = 이 기기 */
  if(isObj(a)&&isObj(b)){
    var o={},k; for(k in a) if(Object.prototype.hasOwnProperty.call(a,k)) o[k]=a[k];
    for(k in b) if(Object.prototype.hasOwnProperty.call(b,k)) o[k]=(k in a)?deep(a[k],b[k]):b[k];
    return o;
  }
  if(Array.isArray(a)&&Array.isArray(b)){
    var out=a.slice(), seen={}; a.forEach(function(x){ seen[JSON.stringify(x)]=1; });
    b.forEach(function(x){ var s=JSON.stringify(x); if(!seen[s]){ seen[s]=1; out.push(x); } });
    return out;
  }
  return empty(a)?b:a;
}
function merge(sv,lv){
  var a,b; try{ a=JSON.parse(sv); b=JSON.parse(lv); }catch(e){ return (lv||'').length>(sv||'').length?lv:sv; }
  return JSON.stringify(deep(a,b));
}

/* ── 내려받기 ── */
function apply(rows){
  var m=meta(), changed=[];
  (rows||[]).forEach(function(r){
    var k=r.k; if(!kindOf(k)||dirty[k]) return;  /* 이 기기에서 고치는 중이면 이 기기 것이 올라감 */
    var local=LS.getItem(k), seen=m[k];
    if(seen===r.updated_at) return;
    if(local==null||local===r.v){ if(local!==r.v){ rawSet(k,r.v); changed.push(k); } m[k]=r.updated_at; return; }
    var v=seen?r.v:merge(r.v,local);             /* 처음이면 합치고, 아니면 서버(늦은 쪽) */
    rawSet(k,v); changed.push(k); m[k]=r.updated_at;
    if(v!==r.v) dirty[k]=true;                   /* 합친 결과를 다시 올림 */
  });
  metaSet(m);
  return changed;
}

function pull(first){
  var reqs=[ client.from('apex_user_kv').select('k,v,updated_at').eq('user_id',uid),
             client.from('apex_org_kv').select('k,v,updated_at').in('k',ORG_KEYS) ];
  Promise.all(reqs).then(function(rs){
    var rows=[], have={};
    rs.forEach(function(r){ if(r&&!r.error&&r.data) r.data.forEach(function(x){ rows.push(x); have[x.k]=1; }); });
    if(rs[0]&&rs[0].error) return;               /* 표가 아직 없거나 권한 — 예전처럼 이 기기에만 */
    var changed=apply(rows);
    if(first){                                   /* 이 기기에만 있고 서버엔 없는 것 — 처음 한 번 올림 */
      for(var i=0;i<LS.length;i++){ var k=LS.key(i); if(kindOf(k)&&!have[k]&&LS.getItem(k)!=null) dirty[k]=true; }
    }
    flush();
    if(changed.length) told(changed,first);
  }).then(null,function(){});
}

/* 받은 것이 화면에 보이려면 다시 그려야 한다 — 막 열었을 때는 한 번 새로 열고, 쓰는 중이면 알려만 준다 */
function told(keys,first){
  var once=false; try{ once=sessionStorage.getItem('apex_kv_reload')==='1'; }catch(e){}
  if(first && !touched && !once && Date.now()-loadedAt<20000){
    try{ sessionStorage.setItem('apex_kv_reload','1'); }catch(e){}
    location.reload(); return;
  }
  if(document.getElementById('apexKvBar')) return;
  var d=document.createElement('div'); d.id='apexKvBar';
  d.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#191F28;color:#fff;'+
    'border-radius:14px;padding:11px 14px;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center';
  d.innerHTML='다른 기기에서 적은 기록을 받았어요 <button style="border:0;border-radius:10px;padding:7px 11px;font:inherit;font-size:13px;cursor:pointer">새로 고침</button>';
  d.querySelector('button').onclick=function(){ location.reload(); };
  document.body.appendChild(d);
}

/* ── 붙기 — 로그인이 끝날 때까지 기다린다(최대 3분) ── */
var waited=0;
function boot(){
  client=findClient();
  if(!client){ if((waited+=1500)<180000) setTimeout(boot,1500); return; }
  var ses=null;
  try{ if(window.OS&&OS.session&&OS.session.user) ses=Promise.resolve({data:{session:OS.session}}); }catch(e){}
  try{ if(!ses&&window.parent!==window&&parent.OS&&parent.OS.session&&parent.OS.session.user) ses=Promise.resolve({data:{session:parent.OS.session}}); }catch(e){}
  try{ if(!ses&&client.auth&&typeof client.auth.getSession==='function') ses=client.auth.getSession(); }catch(e){ ses=null; }
  if(!ses){ if((waited+=3000)<180000) setTimeout(boot,3000); return; }   /* 아직 로그인 전 — 기다림 */
  ses.then(function(r){
    var s=r&&r.data&&r.data.session;
    if(!s||!s.user){ if((waited+=3000)<180000) setTimeout(boot,3000); return; }
    uid=s.user.id; role=findRole();
    try{ who=(window.OS&&OS.profile&&OS.profile.name)||''; }catch(e){}
    start();
  }).then(null,function(){ if((waited+=5000)<180000) setTimeout(boot,5000); });
}
/* ★ 켜자마자 부르지 않는다 — 켤 때 서버 부름 수(check-boot 기준선 19 · 7번)를 늘리지 않게.
   처음 누르거나 · 치거나 · 다른 창에서 돌아올 때 한 번 받는다. 그 전에 쓴 것은 dirty 에 모였다가 같이 올라간다. */
var armed=null, EV=['keydown','pointerdown','touchstart'];
function start(){
  if(ready) return;
  var go1=function(){
    if(ready) return; ready=true; armed=null;
    EV.forEach(function(t){ window.removeEventListener(t,go1,true); });
    pull(true);
  };
  if(touched) return go1();
  armed=go1;
  EV.forEach(function(t){ window.addEventListener(t,go1,true); });
}
setTimeout(boot,800);

/* 바깥(점검·화면)이 묻는 자리 — <b>묻는 곳은 kindOf 하나</b>입니다 (5번).
   never 는 자가 「무엇을 막는지」 를 재려고 내주는 것이고, 판정은 kindOf 가 합니다. */
window.APEX_KV={ kindOf:kindOf, flush:flush, tooBig:tooBig, maxV:MAX_V,
  never:{ exact:NEVER_EXACT, pre:NEVER_PRE, word:NEVER_WORD },
  also:{ exact:ALSO_EXACT, pre:ALSO_PRE }, org:ORG_KEYS,
  _t:{ merge:merge, deep:deep, apply:apply } };
})();
