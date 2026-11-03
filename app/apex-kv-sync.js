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

var USER_KEYS=['apex_ac90_v2','apex_master_done','apex_tatrain_v1','apex_rejgym_v1',
               'apex_mst_done','apex_mst_ans','apex_day_log','apex_day_month',
               'apex_hm_done','apex_hm_skip_v1','apex_hm_qdone_v1'];
var USER_PREFIX=['apex_ck_memo_'];
var ORG_KEYS=['apex_edu_cal_v1'];
var EM_ROLES=['admin','owner','master','manager','lead','leader','branch_manager','education_manager'];
var META='apex_kv_meta';            /* {열쇠: 이 기기가 마지막으로 맞춘 서버 시각} — 이 기기 것 */
var RETRY=[5000,15000,60000];

function kindOf(k){
  if(!k||typeof k!=='string') return '';
  if(ORG_KEYS.indexOf(k)>=0) return 'org';
  if(USER_KEYS.indexOf(k)>=0) return 'user';
  for(var i=0;i<USER_PREFIX.length;i++) if(k.indexOf(USER_PREFIX[i])===0) return 'user';
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
    ready=true; pull(true);
  }).then(null,function(){ if((waited+=5000)<180000) setTimeout(boot,5000); });
}
setTimeout(boot,800);

window.APEX_KV={ keys:USER_KEYS.concat(ORG_KEYS), kindOf:kindOf, flush:flush, _t:{ merge:merge, deep:deep, apply:apply } };
})();
