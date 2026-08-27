/* ═══════════════════════════════════════════════════════════════
   팀 점수 서버 취합 — Supabase REST
   · 서버가 없거나 실패하면 조용히 localStorage 만 쓴다 (앱은 절대 멈추지 않는다)
   · anon 키는 브라우저 공개용이다. service_role 키는 절대 넣지 말 것.
   · 테이블 : bohum_scores / bohum_progress
   · ⚠ academy_* 라는 이름은 쓰지 말 것. 같은 프로젝트의 CRM 이 academy_progress 를
     이미 쓰고 있어서 2026-08-27 에 실제로 충돌했다 (supabase.sql 주석 참고).
     CRM 에는 academy_ 로 시작하는 표가 4개 있다 — evaluations · modules · progress · quiz_questions.
     전수 점검 결과 익명(anon) 에 열린 표는 bohum_* 둘뿐이다. 점검 쿼리 : _audit_names.sql
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
function H(extra){
  var h = { 'apikey':CFG.key, 'Authorization':'Bearer '+CFG.key, 'Content-Type':'application/json' };
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
  return fetch(url('bohum_scores?select=id&limit=1'), {headers:H()})
    .then(function(r){
      if(r.ok){ STATE.ok=true; STATE.msg='연결됨'; return true; }
      if(r.status===404 || r.status===400){ STATE.ok=false; STATE.msg='테이블 없음 — 운영 가이드 6번에서 설정하세요'; return false; }
      STATE.ok=false; STATE.msg='서버 응답 '+r.status; return false;
    })
    .catch(function(e){ fail(e); return false; });
}

/* 응시 결과 1건 전송 */
function pushScore(a){
  if(STATE.ok === false) return Promise.resolve(false);
  var row = {
    team:CFG.team, name:a.name, set_id:a.id, set_name:a.n, cat:a.cat,
    score:a.score, max_q:a.max, pct:a.pct, wrong:a.wrong||[], device:dev()
  };
  return fetch(url('bohum_scores'), {method:'POST', headers:H({'Prefer':'return=minimal'}), body:JSON.stringify(row)})
    .then(function(r){ if(r.ok){ STATE.ok=true; STATE.msg='연결됨'; return true; } STATE.ok=false; STATE.msg='전송 실패 '+r.status; return false; })
    .catch(function(e){ fail(e); return false; });
}

/* 진도 upsert (team,name 기준) */
function pushProgress(name, done){
  if(STATE.ok === false || !name) return Promise.resolve(false);
  var row = { team:CFG.team, name:name, done:done||{}, updated_at:new Date().toISOString() };
  return fetch(url('bohum_progress?on_conflict=team,name'),
      {method:'POST', headers:H({'Prefer':'resolution=merge-duplicates,return=minimal'}), body:JSON.stringify(row)})
    .then(function(r){ return r.ok; })
    .catch(function(){ return false; });
}

/* 팀 전체 결과 (사람 × 세트 최고점) */
function pullTeam(){
  if(STATE.ok === false) return Promise.resolve(null);
  var q = 'bohum_scores?select=name,set_id,set_name,cat,pct,score,max_q,created_at'
        + '&team=eq.' + encodeURIComponent(CFG.team)
        + '&order=created_at.desc&limit=2000';
  return fetch(url(q), {headers:H()})
    .then(function(r){ if(!r.ok){ STATE.ok=false; STATE.msg='조회 실패 '+r.status; return null; } STATE.ok=true; STATE.msg='연결됨'; return r.json(); })
    .catch(function(e){ return fail(e); });
}
function pullProgress(){
  if(STATE.ok === false) return Promise.resolve(null);
  return fetch(url('bohum_progress?select=name,done,updated_at&team=eq.'+encodeURIComponent(CFG.team)), {headers:H()})
    .then(function(r){ return r.ok? r.json() : null; })
    .catch(function(){ return null; });
}

/* 이 기기에 쌓인 기록을 서버로 한 번에 올린다 (뒤늦게 서버를 켠 경우) */
function pushAllLocal(db){
  if(STATE.ok === false || !db) return Promise.resolve(0);
  var jobs = [];
  Object.keys(db).forEach(function(n){
    (db[n].attempts||[]).forEach(function(a){
      jobs.push(pushScore({name:n, id:a.id, n:a.n, cat:a.cat, score:a.score, max:a.max, pct:a.pct, wrong:a.wrong}));
    });
  });
  return Promise.all(jobs).then(function(rs){ return rs.filter(Boolean).length; });
}

return { cfg:CFG, state:STATE, check:check, pushScore:pushScore, pushProgress:pushProgress,
         pullTeam:pullTeam, pullProgress:pullProgress, pushAllLocal:pushAllLocal, device:dev };
})();
