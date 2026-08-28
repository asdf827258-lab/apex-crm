/* ══════════════════════════════════════════════════════════════════════
   품고 있는 앱(APEX OS)과 손잡기
   ─────────────────────────────────────────────────────────────────────
   교재가 CRM 안 틀(iframe)에서 열리면, 밖에서 로그인한 사람 이름을 받아
   응시자 이름으로 그대로 쓴다. 팀원이 자기 이름을 다시 칠 일이 없다.

   왜 필요한가 — 손으로 치면 「김민수」 「김민수 」 「민수」 가 팀 현황에서
   세 사람으로 갈라진다. 이름을 안 적고 그냥 풀면 기록이 아예 안 남는다.

   혼자 열었을 때(밖이 없을 때)는 아무 일도 안 일어난다.
   원래대로 이름을 직접 적는다. 그래서 이 파일은 있어도 되고 없어도 된다.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* 틀 안이 아니면 할 일이 없다 */
var inFrame = false;
try{ inFrame = (window.parent && window.parent !== window); }catch(e){ inFrame = true; }
if(!inFrame) return;

function applyName(n){
  n = String(n==null?'':n).replace(/^\s+|\s+$/g,'');
  if(!n) return;
  if(window.APEX_HOST_NAME === n) return;      /* 같은 이름을 또 받으면 조용히 넘어간다 */
  window.APEX_HOST_NAME = n;                   /* 화면이 이 값을 보고 이름칸을 잠근다 */

  /* 본문은 통째로 한 함수 안에 들어 있어 밖에서 못 부른다.
     그래서 본문이 문을 하나 내 준다(__bohumSetWho) — 그걸로 이름을 넣고 다시 그린다. */
  var done = false;
  try{ if(typeof window.__bohumSetWho === 'function') done = !!window.__bohumSetWho(n); }catch(e){}

  /* 문이 아직 안 열렸으면(본문보다 먼저 도착) 저장만 해 두고 잠깐 뒤 다시 시도한다.
     기록이 이름 없이 쌓이는 것만은 막아야 한다. */
  if(!done){
    try{ localStorage.setItem('bohum_tester', n); }catch(e){}
    var tries = 0;
    var again = function(){
      if(typeof window.__bohumSetWho === 'function'){ try{ window.__bohumSetWho(n); }catch(e){} return; }
      if(++tries < 25) setTimeout(again, 200);
    };
    setTimeout(again, 100);
  }
}

window.addEventListener('message', function(e){
  /* 같은 주소에서 온 것만 받는다 */
  if(e.origin !== location.origin) return;
  var d = e.data;
  if(d && d.type === 'apexBohumWho') applyName(d.name);
});

/* 「나 떴다」고 알린다 — 밖에서 이걸 보고 이름을 보내 준다.
   먼저 물어보는 쪽이 확실하다. 밖이 언제 준비될지 이쪽은 모른다. */
function hello(){
  try{ window.parent.postMessage({type:'apexBohumReady'}, location.origin); }catch(e){}
}
hello();
if(document.readyState !== 'complete') window.addEventListener('load', hello);
setTimeout(hello, 800);

})();
