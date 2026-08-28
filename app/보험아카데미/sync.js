/* ═══════════════════════════════════════════════════════════════
   팀 점수 서버 취합 — Supabase REST
   · 서버가 없거나 실패하면 조용히 localStorage 만 쓴다 (앱은 절대 멈추지 않는다)
   · anon 키는 브라우저 공개용이다. service_role 키는 절대 넣지 말 것.
   · 테이블 : bohum_scores / bohum_progress
   · ⚠ academy_* 라는 이름은 쓰지 말 것. 같은 프로젝트의 CRM 이 academy_progress 를
     이미 쓰고 있어서 2026-08-27 에 실제로 충돌했다 (supabase.sql 주석 참고).
     CRM 에는 academy_ 로 시작하는 표가 4개 있다 — evaluations · modules · progress · quiz_questions.

   ── 로그인한 사람의 열쇠로만 서버에 간다 ────────────────────────────
   전에는 anon 키 하나로 읽고 썼다. anon 키는 이 파일에 그대로 박혀 있으니
   (공개용이라 그 자체는 정상) 서버 쪽 RLS 가 유일한 문인데, 그 문이
   「to anon using (true)」 로 열려 있었다 — 인터넷의 누구나 팀원 이름과
   점수를 읽고, 아무 점수나 써 넣고, 남의 진도를 덮어쓸 수 있었다.

   이제 <이 앱에 로그인한 사람의 토큰>으로만 간다(migration_45_bohum_rls.sql).
   교재는 앱과 <같은 주소>에서 열리므로 같은 localStorage 를 본다 —
   토큰을 따로 넘겨받지 않고 그때그때 읽는다. 넘겨받아 들고 있으면 한
   시간 뒤 만료된 것을 계속 쓰다가 <말없이> 저장이 안 된다.

   로그인이 없으면 <서버를 아예 안 부르고> localStorage 만 쓴다. 그리고
   왜 안 되는지 화면에 적는다 — 조용히 안 되면 사장님은 된 줄 아신다.
   ═══════════════════════════════════════════════════════════════ */
window.SYNC = (function(){
'use strict';

var CFG = {
  url : 'https://miakdhxtqofpndtlyzxa.supabase.co',
  key : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYWtkaHh0cW9mcG5kdGx5enhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzA5NDIsImV4cCI6MjA5OTc0Njk0Mn0.Rodj7B8brXLiIP3g4kLJl4oCzMKlbYzy1SgwSAFhzOU',
  team: 'APEX'
};

var STATE = { ok:null, msg:'확인 전', last:0 };   // ok: true 연결 / false 미설정·실패 / null 아직

function dev(){
  try{
    var d = localStorage.getItem('bohum_device');
    if(!d){ d = 'd' + Math.random().toString(36).slice(2,10); localStorage.setItem('bohum_device', d); }
    return d;
  }catch(e){ return 'unknown'; }
}
/* ── 로그인한 사람 ────────────────────────────────────────────────
   앱이 supabase-js 로 저장해 둔 세션을 그대로 읽는다. 같은 주소라 같은
   localStorage 다. 키 이름은 sb-<프로젝트>-auth-token 이고, 판에 따라
   "base64-" 를 앞에 붙여 담기도 한다. 이름이 바뀌어도 찾도록 훑어보는
   갈래를 하나 둔다.

   <만료된 토큰은 없는 것으로 친다.> 그것으로 부르면 401 이 오고 화면에는
   「전송 실패」만 뜬다 — 왜 실패했는지 모른다. 앱이 곧 새로 받아 두므로
   다음 번에 그 값을 읽는다.                                            */
function ref(){ var m = (CFG.url||'').match(/^https?:\/\/([^.]+)\./); return m ? m[1] : ''; }
function rawSession(){
  var k = 'sb-' + ref() + '-auth-token', v = null, i, n;
  try{ v = localStorage.getItem(k); }catch(e){ return null; }
  if(v) return v;
  try{
    for(i=0;i<localStorage.length;i++){
      n = localStorage.key(i);
      if(n && n.indexOf('sb-')===0 && /-auth-token$/.test(n)) return localStorage.getItem(n);
    }
  }catch(e){}
  return null;
}
function auth(){
  var raw = rawSession(), s = null;
  if(!raw) return null;
  if(raw.indexOf('base64-')===0){
    try{ raw = decodeURIComponent(escape(atob(raw.slice(7)))); }catch(e){ return null; }
  }
  try{ s = JSON.parse(raw); }catch(e){ return null; }
  if(s && s.currentSession) s = s.currentSession;          /* 옛 판 */
  if(!s || !s.access_token) return null;
  /* 만료됐으면 없는 것으로 친다 (초 단위) */
  if(s.expires_at && (s.expires_at * 1000) <= Date.now()) return null;
  var uid = (s.user && s.user.id) || null;
  if(!uid) return null;                                    /* 누구 것인지 모르면 안 쓴다 */
  return { token:s.access_token, uid:uid };
}
/* 서버에 갈 수 있는가 — 못 가면 <왜 못 가는지> 적어 두고 null 을 준다.

   로그인 뒤에 <다시 시도되게> 하는 것이 이 함수의 나머지 절반이다.
   아래 함수들은 STATE.ok===false 면 곧바로 돌아선다. 로그인 전에 한 번
   실패해 false 가 박히면, 로그인한 뒤에도 영영 안 붙는다. 그래서 열쇠가
   생기는 순간 <로그인 때문에 박아 둔 false 만> 지운다 — 표가 없다거나
   서버가 죽었다는 진짜 실패는 그대로 둔다.                              */
var NOLOGIN = '로그인해야 팀 취합이 됩니다 — 이 기기에는 그대로 저장됩니다';
function need(){
  var a = auth();
  if(a){
    if(STATE.ok === false && STATE.msg === NOLOGIN){ STATE.ok = null; STATE.msg = '확인 전'; }
    return a;
  }
  STATE.ok = false;
  STATE.msg = NOLOGIN;
  return null;
}
function H(a, extra){
  var h = { 'apikey':CFG.key, 'Authorization':'Bearer '+a.token, 'Content-Type':'application/json' };
  if(extra) for(var k in extra) h[k]=extra[k];
  return h;
}
function url(path){ return CFG.url + '/rest/v1/' + path; }

function fail(e){
  STATE.ok = false;
  STATE.msg = (e && e.message) ? e.message : '연결 실패';
  return null;
}

/* 연결 · 테이블 존재 확인 */
function check(){
  if(!CFG.url || !CFG.key){ STATE.ok=false; STATE.msg='설정 없음'; return Promise.resolve(false); }
  var a = need(); if(!a) return Promise.resolve(false);
  return fetch(url('bohum_scores?select=id&limit=1'), {headers:H(a)})
    .then(function(r){
      if(r.ok){ STATE.ok=true; STATE.msg='연결됨'; return true; }
      if(r.status===404 || r.status===400){ STATE.ok=false; STATE.msg='테이블 없음 — 운영 가이드 6번에서 설정하세요'; return false; }
      if(r.status===401 || r.status===403){ STATE.ok=false; STATE.msg=NOLOGIN; return false; }
      STATE.ok=false; STATE.msg='서버 응답 '+r.status; return false;
    })
    .catch(function(e){ fail(e); return false; });
}

/* 응시 결과 1건 전송. owner_id 를 함께 담는다 — 서버 규칙이
   owner_id = auth.uid() 인지 보고 받아 주므로 빠뜨리면 통째로 거절된다. */
function pushScore(a){
  var me = need(); if(!me) return Promise.resolve(false);
  if(STATE.ok === false) return Promise.resolve(false);
  var row = {
    team:CFG.team, name:a.name, set_id:a.id, set_name:a.n, cat:a.cat,
    score:a.score, max_q:a.max, pct:a.pct, wrong:a.wrong||[], device:dev(),
    owner_id: me.uid
  };
  return fetch(url('bohum_scores'), {method:'POST', headers:H(me,{'Prefer':'return=minimal'}), body:JSON.stringify(row)})
    .then(function(r){ if(r.ok){ STATE.ok=true; STATE.msg='연결됨'; return true; } STATE.ok=false; STATE.msg='전송 실패 '+r.status; return false; })
    .catch(function(e){ fail(e); return false; });
}

/* 진도 upsert (team,name 기준) */
function pushProgress(name, done){
  if(!name) return Promise.resolve(false);
  var me = need(); if(!me) return Promise.resolve(false);
  if(STATE.ok === false) return Promise.resolve(false);
  var row = { team:CFG.team, name:name, done:done||{}, updated_at:new Date().toISOString(),
              owner_id: me.uid };
  return fetch(url('bohum_progress?on_conflict=team,name'),
      {method:'POST', headers:H(me,{'Prefer':'resolution=merge-duplicates,return=minimal'}), body:JSON.stringify(row)})
    .then(function(r){ return r.ok; })
    .catch(function(){ return false; });
}

/* 팀 전체 결과 (사람 × 세트 최고점) */
function pullTeam(){
  var me = need(); if(!me) return Promise.resolve(null);
  if(STATE.ok === false) return Promise.resolve(null);
  var q = 'bohum_scores?select=name,set_id,set_name,cat,pct,score,max_q,created_at'
        + '&team=eq.' + encodeURIComponent(CFG.team)
        + '&order=created_at.desc&limit=2000';
  return fetch(url(q), {headers:H(me)})
    .then(function(r){ if(!r.ok){ STATE.ok=false; STATE.msg='조회 실패 '+r.status; return null; } STATE.ok=true; STATE.msg='연결됨'; return r.json(); })
    .catch(function(e){ return fail(e); });
}
function pullProgress(){
  var me = need(); if(!me) return Promise.resolve(null);
  if(STATE.ok === false) return Promise.resolve(null);
  return fetch(url('bohum_progress?select=name,done,updated_at&team=eq.'+encodeURIComponent(CFG.team)), {headers:H(me)})
    .then(function(r){ return r.ok? r.json() : null; })
    .catch(function(){ return null; });
}

/* 이 기기에 쌓인 기록을 서버로 한 번에 올린다 (뒤늦게 서버를 켠 경우) */
function pushAllLocal(db){
  if(!db) return Promise.resolve(0);
  if(!need()) return Promise.resolve(0);
  if(STATE.ok === false) return Promise.resolve(0);
  var jobs = [];
  Object.keys(db).forEach(function(n){
    (db[n].attempts||[]).forEach(function(a){
      jobs.push(pushScore({name:n, id:a.id, n:a.n, cat:a.cat, score:a.score, max:a.max, pct:a.pct, wrong:a.wrong}));
    });
  });
  return Promise.all(jobs).then(function(rs){ return rs.filter(Boolean).length; });
}

/* 화면이 「왜 안 붙나」를 물을 수 있게 열어 둔다 — 로그인 여부만, 토큰은 안 준다 */
function who(){ var a = auth(); return a ? { uid:a.uid } : null; }

return { cfg:CFG, state:STATE, check:check, pushScore:pushScore, pushProgress:pushProgress,
         pullTeam:pullTeam, pullProgress:pullProgress, pushAllLocal:pushAllLocal, device:dev,
         who:who, NOLOGIN:NOLOGIN };
})();
