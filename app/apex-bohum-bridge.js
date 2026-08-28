/* ══════════════════════════════════════════════════════════════════════
   교재 ↔ 성장판 다리
   ─────────────────────────────────────────────────────────────────────
   하는 일 두 가지.

   ① 이름을 대신 넣어 준다
      교재는 원래 응시자 이름을 손으로 치게 돼 있다. 혼자 쓰는 사이트일 땐
      그래도 됐는데, CRM 안에서는 누가 로그인했는지 이미 알고 있다.
      그래서 틀로 이름을 밀어 넣는다. 「김민수」 「김민수 」 「민수」 가
      세 사람으로 갈라지는 일을 막는 게 목적이다.

   ② 성장판 「공부」 축을 진짜 점수로 바꾼다
      여섯 축 중 다섯(출근·실행·활동·고객·자료)은 기록에서 저절로 나오는데
      「공부」만 스스로 합격을 주는 자기신고였다. 아는 척해도 점수가 올랐다.
      이제 교재 테스트에서 실제로 통과한 세트 수를 센다.

   ─────────────────────────────────────────────────────────────────────
   왜 파일을 따로 뺐나 — index.html 을 여러 군데 고치면 다른 작업과 부딪힌다.
   그래서 index.html 에는 이 파일을 부르는 <script> 한 줄만 넣고,
   나머지는 전부 여기서 원래 함수를 감싸는 방식으로 처리한다.
   이 파일을 지우고 그 한 줄만 빼면 앱은 원래대로 돌아간다.

   읽기만 한다 — 서버에 아무것도 쓰지 않는다.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var PASS_LINE = 70;   /* 교재 통과선 (성장 경로 1~3단계 기준) */
var SET_TOTAL = 9;    /* 테스트 세트 수 — 보상 5 · 설계 3 · 종합 1 */
var TEAM      = 'APEX';

var BH = { pass:null, tried:0, busy:false };

function log(){ /* 조용히 — 콘솔을 더럽히지 않는다 */ }

/* ── 이름 한 벌로 맞추기 ──────────────────────────────────────────────
   공백만 지운다. 「김 민수」와 「김민수」는 같은 사람이다.
   더 세게 다듬으면(예: 성 떼기) 동명이인이 뭉쳐 버린다. */
function key(s){ return String(s==null?'':s).replace(/\s+/g,''); }

function myName(){
  try{ return (window.OS && OS.profile && OS.profile.name) || ''; }catch(e){ return ''; }
}

/* ══════ ① 이름 밀어 넣기 ══════════════════════════════════════════ */
function pushName(){
  var f = document.getElementById('bohumFrame');
  var n = myName();
  if(!f || !f.contentWindow || !n) return false;
  try{ f.contentWindow.postMessage({type:'apexBohumWho', name:n}, location.origin); return true; }
  catch(e){ return false; }
}

/* 교재가 「나 떴다」고 알려 오면 그때 넣는다. 이게 가장 확실하다. */
window.addEventListener('message', function(e){
  if(e.origin !== location.origin) return;
  var d = e.data;
  if(d && d.type === 'apexBohumReady') pushName();
});

/* 알림을 못 받는 경우(옛 교재 파일)를 대비해 틀이 뜨면 몇 번 더 시도한다 */
function hookMount(){
  if(typeof window.mountBohum !== 'function' || window.mountBohum.__bh) return false;
  var orig = window.mountBohum;
  var wrapped = function(){
    var r = orig.apply(this, arguments);
    var f = document.getElementById('bohumFrame');
    if(f && !f.__bhLoad){
      f.__bhLoad = true;
      f.addEventListener('load', function(){ setTimeout(pushName, 60); });
    }
    setTimeout(pushName, 500);
    setTimeout(pushName, 1800);
    return r;
  };
  wrapped.__bh = true;
  window.mountBohum = wrapped;
  return true;
}

/* ══════ ② 공부 축 ════════════════════════════════════════════════ */

/* 축의 뜻을 바꾼다 — 「스스로 합격 준 주제 12개」 → 「통과한 테스트 세트 9개」.
   index.html 의 GB_AX 를 고치지 않고 여기서 갈아 끼운다. */
function patchAxis(){
  if(typeof window.GB_AX === 'undefined' || !GB_AX.length) return false;
  for(var i=0;i<GB_AX.length;i++){
    if(GB_AX[i].k !== 'stu') continue;
    if(GB_AX[i].__bh) return true;
    GB_AX[i].__bh = true;
    GB_AX[i].t   = SET_TOTAL;
    GB_AX[i].u   = '세트';
    GB_AX[i].w   = '통과한 테스트 세트 (' + PASS_LINE + '점 이상)';
    GB_AX[i].tab = 'bohum';
    GB_AX[i].tn  = '보험 마스터 아카데미';
    GB_AX[i].fix = '하루 한 레벨만 읽고 그 자리에서 테스트를 봅니다. ' +
                   '읽기만 하면 점수가 안 오릅니다 — 통과해야 오릅니다. ' +
                   '틀린 문제는 해설에서 본문으로 바로 넘어갑니다.';
    return true;
  }
  return false;
}

/* 서버에서 팀 응시 기록을 읽는다.
   ※ 로그인한 사람의 열쇠가 아니라 anon 열쇠로 부른다.
      bohum_* 의 열람 규칙이 anon 앞으로 열려 있어서, 로그인 열쇠로 부르면 막힌다. */
function fetchScores(force){
  if(!window.APEX_SB || !APEX_SB.url || !APEX_SB.key) return;
  var now = Date.now();

  /* 매달린 요청 때문에 영영 잠기지 않게 — 15초가 지나면 다시 시도한다.
     탭이 뒤로 밀리면 요청이 한참 멈춰 있을 수 있다. */
  if(BH.busy && (now - (BH.busyAt||0)) < 15000) return;
  /* 방금 읽었으면 또 읽지 않는다 */
  if(!force && BH.pass && (now - (BH.at||0)) < 60000) return;

  BH.busy = true; BH.busyAt = now;

  var ctl = null, timer = null;
  try{ ctl = new AbortController(); }catch(e){}
  var opt = { headers:{ apikey:APEX_SB.key, Authorization:'Bearer '+APEX_SB.key } };
  if(ctl){ opt.signal = ctl.signal; timer = setTimeout(function(){ try{ ctl.abort(); }catch(e){} }, 12000); }

  var release = function(){ BH.busy = false; if(timer) clearTimeout(timer); };

  var u = APEX_SB.url + '/rest/v1/bohum_scores' +
          '?select=name,set_id,pct&team=eq.' + encodeURIComponent(TEAM) + '&limit=5000';
  fetch(u, opt)
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(rows){
      release();
      if(!rows) return;
      BH.pass = countPassed(rows);
      BH.at = Date.now();
      if(typeof window.gbPaint === 'function' && window.GB && GB.rows && GB.rows.length){
        apply(); gbPaint();
      }
    })
    .catch(function(){ release(); });
}

/* 사람 × 세트 최고점을 잡고, 통과선을 넘은 세트 수를 센다.
   같은 세트를 열 번 봐도 한 번만 센다 — 안 그러면 재응시로 점수를 부풀릴 수 있다. */
function countPassed(rows){
  /* best[사람][세트] = 최고점 — 이름과 세트를 한 글자로 이어 붙이면
     구분자가 이름 안에 들어갈 때 조용히 어긋난다. 두 겹으로 둔다. */
  var best = {}, i, r, nm, sid, p;
  for(i=0;i<rows.length;i++){
    r = rows[i];
    if(!r || !r.name || !r.set_id) continue;
    nm = key(r.name); sid = String(r.set_id);
    p = Number(r.pct) || 0;
    if(!best[nm]) best[nm] = {};
    if(!(sid in best[nm]) || p > best[nm][sid]) best[nm][sid] = p;
  }
  var out = {};
  for(nm in best){
    var n = 0;
    for(sid in best[nm]) if(best[nm][sid] >= PASS_LINE) n++;
    out[nm] = n;
  }
  return out;
}

/* 성장판이 계산해 둔 줄에 공부 점수만 갈아 끼운다.
   그림 그리기 직전에 부르므로 몇 번을 불러도 결과가 같다. */
function apply(){
  if(!BH.pass || !window.GB || !GB.rows || typeof window.gbScore !== 'function') return;
  var i, r, v, moved = false;
  for(i=0;i<GB.rows.length;i++){
    r = GB.rows[i];
    v = BH.pass[key(r.name)] || 0;
    if(r.raw.stu !== v){ r.raw.stu = v; moved = true; }
    if(v) r.any = true;
    gbScore(r);
  }
  /* 총점이 바뀌었으면 줄 순서도 다시 잡는다 — 성장판이 원래 총점 순으로 세운다 */
  if(moved) GB.rows.sort(function(a,b){ return b.total - a.total; });
}

function hookPaint(){
  if(typeof window.gbPaint !== 'function' || window.gbPaint.__bh) return false;
  var orig = window.gbPaint;
  var wrapped = function(){ try{ apply(); }catch(e){} return orig.apply(this, arguments); };
  wrapped.__bh = true;
  window.gbPaint = wrapped;
  return true;
}

function hookLoad(){
  if(typeof window.gbLoad !== 'function' || window.gbLoad.__bh) return false;
  var orig = window.gbLoad;
  var wrapped = function(){ var r = orig.apply(this, arguments); fetchScores(); return r; };
  wrapped.__bh = true;
  window.gbLoad = wrapped;
  return true;
}

/* ══════ 붙이기 ═════════════════════════════════════════════════════
   이 파일이 본문보다 먼저 읽힐 수도 있어서, 함수가 생길 때까지 기다린다.
   30초를 넘기면 조용히 포기한다 — 앱은 원래대로 돈다. */
(function wait(){
  var ok = 0;
  ok += hookMount()   ? 1 : 0;
  ok += patchAxis()   ? 1 : 0;
  ok += hookPaint()   ? 1 : 0;
  ok += hookLoad()    ? 1 : 0;
  ok += hookAcademy() ? 1 : 0;
  if(ok >= 5) return;
  if(++BH.tried > 150) return;
  setTimeout(wait, 200);
})();

/* ══════ ③ 신입 90일 로드맵 ↔ 교재 ══════════════════════════════════
   지금 팀원 눈에 아카데미가 두 개다 — 「APEX 본인 점검란(90일)」과
   「보험 마스터 아카데미(교재)」. 어디부터 할지 모른다.
   두 개를 하나의 길로 잇는다.

   ⚠ 본인 점검란의 「공부 진행」도 학습중/완료를 스스로 누르는 자기신고다.
     남의 저장값을 건드리지 않는다 — 대신 교재 테스트를 실제로 통과했는지
     옆에 같이 보여 준다. 눌러 놓은 「완료」와 실제가 다르면 그 자리에서 보인다. */

/* 90일 7구간 ↔ 교재 레벨 */
var ROAD_MAP = [
  ['L0','L1','L2'],        /* DAY 1~14  자기진단 · 고객 선정 */
  ['L2'],                  /* DAY 15~28 접촉 · 팩트파인딩 */
  ['L3','L4','L5','L6'],   /* DAY 29~42 보장 풀컨셉 */
  ['L9'],                  /* DAY 43~56 저축 풀컨셉 */
  ['L9'],                  /* DAY 57~70 연금 · 투자 */
  ['L7','L8','L10'],       /* DAY 71~84 클로징 · 자립 */
  []                       /* DAY 85~90 졸업 — 교재는 완독 상태 */
];

/* 공부 18주제 ↔ 교재 레벨 · 테스트 세트.
   억지로 다 붙이지 않았다. 교재에 없는 주제는 비워 둔다 — 없는 것을 있다고 하면 안 된다. */
var STUDY_MAP = [
  {},                                        /* 영업 기본 */
  {},                                        /* 고객 분석 */
  {},                                        /* 접촉 TA */
  {},                                        /* 팩트파인딩 */
  {lv:['L1','L4'], q:['B5']},                /* 치료비 통장 */
  {lv:['L3','L5'], q:['D3']},                /* 보장분석 */
  {lv:['L2','L6','L7'], q:[]},               /* 생활보장 */
  {lv:['L8'], q:['B1','B2']},                /* 청구 실무 */
  {lv:['L9'], q:[]},                         /* 현금흐름 */
  {lv:['L9'], q:[]},                         /* 목적자금 */
  {lv:['L9'], q:[]},                         /* 저축 기준 */
  {},                                        /* 위험성향 */
  {lv:['L9'], q:[]},                         /* 연금 */
  {},                                        /* 변액 · 달러 */
  {lv:['L10'], q:['D1']},                    /* 풀컨셉 */
  {},                                        /* 클로징 */
  {},                                        /* 콘텐츠 브랜딩 */
  {}                                         /* 자립 운영 */
];

/* 교재를 그 자리에서 연다. 레벨 이름을 주면 그 레벨로 바로 간다. */
window.bohumOpen = function(hash){
  var f = document.getElementById('bohumFrame');
  if(f){
    var url = '보험아카데미/index.html' + (hash ? '#' + hash : '');
    if(f._mounted && f.contentWindow){
      try{ f.contentWindow.location.hash = hash || 'GROW'; }catch(e){ f.src = url; }
    }else{
      f.src = url; f._mounted = true;
    }
  }
  if(typeof window.go === 'function') go('bohum');
  return false;
};

function esc2(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

/* 내 테스트 점수 — 통과한 세트 이름 모음 */
function myPassed(){
  var n = key(myName());
  if(!n || !BH.pass) return null;
  return BH.pass[n] || 0;
}

function lvChips(lv){
  if(!lv || !lv.length) return '';
  return lv.map(function(id){
    return '<button type="button" class="bhchip" onclick="return bohumOpen(\'' + id + '\')">📕 ' + id + '</button>';
  }).join('');
}

function bhCss(){
  if(document.getElementById('bhStyle')) return;
  var st = document.createElement('style'); st.id = 'bhStyle';
  st.textContent =
    '.bhbox{border:1px solid #E5E8EB;border-radius:12px;background:#fff;padding:14px 16px;margin:0 0 14px}' +
    '.bhbox h4{margin:0 0 4px;font-size:13.5px;font-weight:800;color:#1C2434;letter-spacing:-.02em}' +
    '.bhbox .bhd{font-size:12px;color:#6B7280;line-height:1.6;margin:0 0 11px}' +
    '.bhrow{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #F1F3F5;flex-wrap:wrap}' +
    '.bhrow:first-of-type{border-top:0}' +
    '.bhrow .bhk{flex:none;min-width:104px;font-size:12.4px;font-weight:700;color:#1C2434}' +
    '.bhrow .bhv{flex:1;min-width:150px;font-size:12px;color:#6B7280}' +
    '.bhchip{appearance:none;border:1px solid #DBE7FF;background:#EEF4FE;color:#1B64DA;border-radius:99px;' +
      'font-family:inherit;font-size:11.5px;font-weight:700;padding:3px 9px;cursor:pointer;margin-right:4px}' +
    '.bhchip:hover{background:#DBE7FF}' +
    '.bhq{font-size:11.5px;color:#8B95A1;margin-right:6px}' +
    '.bhnone{font-size:11.5px;color:#C0C7D0}' +
    '.bhok{font-size:11.5px;font-weight:800;color:#059669;background:#ECFDF5;border-radius:99px;padding:2px 9px}' +
    '.bhno{font-size:11.5px;font-weight:700;color:#B45309;background:#FFFBEB;border-radius:99px;padding:2px 9px}';
  document.head.appendChild(st);
}

function studyBox(){
  bhCss();
  var passed = myPassed();
  var h = '<div class="bhbox"><h4>📕 교재와 이어지는 자리</h4>' +
    '<div class="bhd">이 주제를 교재 어디서 배우는지입니다. 눌러서 바로 여세요. ' +
    (passed === null
      ? '<b>교재 테스트를 한 번 보면</b> 여기에 통과 여부도 같이 뜹니다.'
      : '「완료」를 눌러 둔 것과 <b>실제 테스트 통과</b>가 다르면 그 자리에서 보입니다.') +
    '</div>';
  var any = 0;
  (window.AC_STUDY || []).forEach(function(m, i){
    var mp = STUDY_MAP[i]; if(!mp || !mp.lv) return;
    any++;
    h += '<div class="bhrow"><span class="bhk">' + esc2(m[0]) + '</span>' +
         '<span class="bhv">' + lvChips(mp.lv) +
         (mp.q && mp.q.length ? '<span class="bhq">테스트 ' + mp.q.join(' · ') + '</span>' : '') +
         '</span></div>';
  });
  if(!any) h += '<div class="bhnone">이을 자리를 찾지 못했습니다.</div>';
  h += '<div class="bhd" style="margin:10px 0 0">교재에 없는 주제(접촉 TA · 클로징 · 콘텐츠 등)는 비워 뒀습니다. ' +
       '없는 것을 있다고 적지 않습니다.</div></div>';
  return h;
}

function roadBox(){
  bhCss();
  var h = '<div class="bhbox"><h4>📕 90일 구간마다 교재 어디까지</h4>' +
    '<div class="bhd">로드맵은 <b>무엇을 만드는지</b>, 교재는 <b>그걸 하려면 뭘 알아야 하는지</b>입니다. ' +
    '같은 길의 앞뒤입니다 — 구간에 들어갈 때 그 레벨을 먼저 읽으세요.</div>';
  (window.AC_ROAD || []).forEach(function(r, i){
    var lv = ROAD_MAP[i] || [];
    h += '<div class="bhrow"><span class="bhk">' + esc2(r.r) + '</span>' +
         '<span class="bhv">' + (lv.length ? lvChips(lv) : '<span class="bhnone">교재는 이미 완독 상태입니다</span>') +
         '</span></div>';
  });
  h += '<div class="bhd" style="margin:10px 0 0">읽고 나면 <b>현장 과제</b>가 열립니다 — ' +
       '읽은 것을 그 주에 한 번은 써 보는 자리입니다. ' +
       '<button type="button" class="bhchip" onclick="return bohumOpen(\'PRAC\')">📕 현장 과제</button></div></div>';
  return h;
}

function hookAcademy(){
  var ok = 0;
  if(typeof window.acStudyView === 'function' && !window.acStudyView.__bh){
    var s0 = window.acStudyView;
    var s1 = function(){ var r = s0.apply(this, arguments); try{ return studyBox() + r; }catch(e){ return r; } };
    s1.__bh = true; window.acStudyView = s1;
  }
  if(typeof window.acRoadView === 'function' && !window.acRoadView.__bh){
    var r0 = window.acRoadView;
    var r1 = function(){ var r = r0.apply(this, arguments); try{ return roadBox() + r; }catch(e){ return r; } };
    r1.__bh = true; window.acRoadView = r1;
  }
  if(window.acStudyView && window.acStudyView.__bh) ok++;
  if(window.acRoadView && window.acRoadView.__bh) ok++;
  return ok >= 2;
}

/* 밖에서 확인할 수 있게 조금만 열어 둔다 */
window.APEX_BOHUM = { state:BH, refresh:function(){ return fetchScores(true); }, pushName:pushName,
                      roadMap:ROAD_MAP, studyMap:STUDY_MAP };

})();
