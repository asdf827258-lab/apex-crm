/* ══ 🧭 보장 전·후 — 네 걸음 메뉴 (판 X506) ═══════════════════════════════
   사장님 말씀 (2026-11-19) 「담보 수정하는게 너무 복잡해 더 보기 쉽게해 전체적인 메뉴도」 →
   목업 ③ 메뉴 정리 → (2026-11-20) 「응 이제 그 다음거 해」.

   예전 위 띠: 탭 3 · 단추 6 · 「⋯ 더보기」 안 7 = <b>누를 것 17개</b>, 만들기 화면은 칸 여덟을 위아래로.
   이제: 상담 순서대로 <b>네 걸음</b> ① 고객 → ② 지금 보험 → ③ 바꿀 것 → ④ 보여주기 와
         <b>💾 저장 ▾ · 🧰 도구 ▾</b> 둘. 걸음마다 그 칸만 보인다.
   ★ 없어지는 기능은 없다 — 자리만 옮긴다(옮긴 곳은 아래 BS_MAP 주석 · check-basteps 가 하나하나 센다).
   ★ 칸은 <b>다 그려 두고 고른 걸음만 보인다</b> — 다른 화면 · 점검이 id 로 부르는 것이 그대로 있다.
     인쇄하면 걸음과 상관없이 다 나온다(종이는 통째로 드리는 것).
   ★ 「📜 한 장으로 다 보기」(도구 ▾) = 예전처럼 한 화면에 전부 — 익숙한 분을 위해 남긴다.

   옮긴 곳
     ✍ 만들기 탭            → ①②③ 걸음
     👤 고객에게 보여주기 탭 → ④ 보여주기 · 「노트북으로 보여주기」
     📋 가입설계 요청서 탭   → ③ 바꿀 것 맨 아래(바꿀 것을 정한 뒤 쓰니까) · ④ 에도
     📋 자동 보장분석        → ② 지금 보험(지금 보험을 읽은 바로 다음) · 도구 ▾
     🧠 윤시현의 두뇌        → 도구 ▾
     💾 고객 365일 · 파일로 저장 · 📂 불러오기 → 저장 ▾
     📄 최종 보고서 · 🖨 인쇄 · 💬 요약 한 장 이미지 → ④ 보여주기 (이미지는 도구 ▾ 에도)
     📘 사용방법 · 🎓 보장분석 기준 · 👥 연령대별 기준 · 예시 채우기 · 전부 지우기 → 도구 ▾
     🧾 숨은 · 미청구 보험금 칸 → ② 지금 보험(지금 보험 이야기라)
     ⚙ 치료 기준 칸 → ③ 바꿀 것 맨 아래

   ba.html 에는 위 띠 마크업 · editHtml 이 걸음 칸으로 감싸기 · renderIn 한 줄 · script 한 줄.
   이름은 전부 bs* · CSS 는 .bsteps · .bs-* 안에만.                                          */

var BS_NAME={1:'고객',2:'지금 보험',3:'바꿀 것',4:'보여주기'};
/* 처음 걸음 = ① 고객. 만들기 칸 전부를 한꺼번에 재는 옛 자들은 열기 전에 BA_STEP_DEFAULT=0(한 장으로 다 보기)을 심는다 */
function bsDef(){return (typeof window.BA_STEP_DEFAULT==='number')?window.BA_STEP_DEFAULT:1;}
function bsStep(){var s=S.step;if(s===undefined||s===null||s==='')return bsDef();s=+s;return (s>=0&&s<=4)?s:bsDef();}
function bsGo(n){S.step=n;S.panel='';S.mode='edit';save();render();window.scrollTo(0,0);}
function bsSec(n,html){return '<div class="bs-sec" data-s="'+n+'">'+html+'</div>';}
function bsSave(on){var box=document.getElementById('barSaveBox'),b=document.getElementById('barSaveBtn');if(!box)return;
  var next=(on===undefined)?!box.classList.contains('on'):!!on;box.classList.toggle('on',next);if(b)b.setAttribute('aria-expanded',next?'true':'false');
  if(next&&typeof barMore==='function')barMore(false);}
document.addEventListener('click',function(e){var box=document.getElementById('barSaveBox');
  if(!box||!box.classList.contains('on'))return;if(e.target&&e.target.closest&&e.target.closest('#barSaveWrap'))return;bsSave(false);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')bsSave(false);});

/* 위 띠 — 지금 어느 걸음인지 · 걸음마다 몇 건인지 */
function bsPaint(){
  var box=document.getElementById('bsSteps');if(!box)return;
  var on=(S.mode==='show')?4:((S.mode==='req')?3:(S.panel?-1:bsStep()));
  var nB=(S.before||[]).length,nA=(S.after||[]).length;
  var sub={1:(S.who&&S.who.age?S.who.age+'세':''),2:(nB?nB+'건':''),3:(nA?'새 '+nA+'건':''),4:''};
  [].forEach.call(box.querySelectorAll('button[data-s]'),function(b){var s=+b.getAttribute('data-s');
    b.className='tab'+(s===on?' on':'');b.setAttribute('aria-current',s===on?'step':'false');
    var em=b.querySelector('em');if(em)em.textContent=sub[s]?(' · '+sub[s]):'';});
  var all=document.getElementById('bsAllBtn');if(all)all.textContent=(bsStep()===0)?'🧭 네 걸음으로 나눠 보기':'📜 한 장으로 다 보기';
}
function bsAllToggle(){bsGo(bsStep()===0?1:0);}

/* ② 지금 보험 — 자동 보장분석 (예전 위 띠 단추) */
function bsFitCard(){
  return '<div class="card bs-fit noprint"><h2><span class="n">📋</span>자동 보장분석</h2>'+
    '<p>지금 보험을 다 넣었으면 한 번 눌러 보세요 — 빠진 곳 · 겹친 곳을 한 장으로 정리합니다.</p>'+
    '<button class="btn" onclick="showPanel(\'fit\')">📋 자동 보장분석 열기</button></div>';
}
/* ③ 바꿀 것 맨 아래 — 가입설계 요청서 */
function bsReqCard(){
  return '<div class="card bs-fit noprint"><h2><span class="n">📋</span>가입설계 요청서</h2>'+
    '<p>바꿀 것을 다 정했으면 — 지금까지 정한 것을 옮겨 적지 않고 요청서 한 장으로 뽑습니다.</p>'+
    '<button class="btn" onclick="go(\'req\')">📋 가입설계 요청서 만들기</button></div>';
}
/* ④ 보여주기 — 고객 앞에서 쓰는 것만 */
function bsShowCard(){
  var b=function(ic,t,d,fn,cls){return '<button class="bs-big'+(cls?' '+cls:'')+'" onclick="'+fn+'"><span class="ic">'+ic+'</span><b>'+t+'</b><small>'+d+'</small></button>';};
  return '<div class="card noprint"><h2><span class="n">4</span>보여주기</h2>'+
    '<p>고객 앞에서 쓰는 것만 모았습니다. 숫자는 ①②③ 에서 정한 그대로 나옵니다.</p><div class="bs-grid">'+
    b('💻','노트북으로 보여주기','한 장씩 넘기는 보고서 (짧게 보기 · 다 보기)',"go('show')",'pri')+
    (typeof baqOpen==='function'?b('🙂','심플 — 질문으로 보기','늘어나는 담보만 질문 → 쉽게 말하면 → 그래서 필요합니다','baqOpen()'):'')+
    b('📄','최종 보고서','드릴 종이 한 벌 (PDF 로 저장)','frPrint()')+
    b('💬','카톡 한 장 이미지','요약 한 장을 그림으로 — 카톡에 붙여 보내기','frImage()')+
    b('📋','가입설계 요청서','정한 것을 요청서 한 장으로',"go('req')")+
    b('🖨','이 화면 인쇄 · PDF','만들기 화면 전부(걸음과 상관없이 다 나옴)','window.print()')+
    '</div></div>';
}
/* 걸음 끝 — 다음 걸음으로 (1달차가 「이제 뭐 하지」 를 안 묻게) */
function bsNext(s){
  if(!s)return '';
  var h='<div class="bs-next noprint">';
  if(s>1)h+='<button class="btn n" onclick="bsGo('+(s-1)+')">← '+(s-1)+' '+BS_NAME[s-1]+'</button>';
  if(s<4)h+='<button class="btn" onclick="bsGo('+(s+1)+')">다음 → '+(s+1)+' '+BS_NAME[s+1]+'</button>';
  return h+'</div>';
}

(function(){var st=document.createElement('style');st.textContent=[
'.bar [hidden]{display:none!important}',
'.bsteps{display:flex;gap:4px;flex-wrap:wrap;align-items:center}',
'.bsteps .tab{min-height:44px;font-size:var(--t5,14px);font-weight:800}.bsteps .tab em{font-style:normal;font-weight:700;opacity:.85}',
'.bsteps .arw{color:var(--gy);font-size:13px}',
'@media (max-width:640px){.bsteps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));width:100%;gap:4px}.bsteps .arw,.bsteps em{display:none}.bsteps .tab{padding:4px 2px;font-size:13px;white-space:nowrap}.bar .lg{font-size:15px}.bar .sp{order:2;margin-left:auto}.bsteps{order:3}.bar .sp .btn{min-height:44px;padding:6px 10px}}',
'#bsMain[data-step="1"] .bs-sec:not([data-s="1"]),#bsMain[data-step="2"] .bs-sec:not([data-s="2"]),',
'#bsMain[data-step="3"] .bs-sec:not([data-s="3"]),#bsMain[data-step="4"] .bs-sec:not([data-s="4"]){display:none}',
'#bsMain[data-step="0"] .bs-sec[data-s="4"],#bsMain[data-step="0"] .bs-fit{display:none}',
'@media print{#bsMain .bs-sec{display:block!important}#bsMain .bs-sec[data-s="4"]{display:none!important}}',
'.bs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:10px}',
'.bs-big{appearance:none;text-align:left;border:1px solid var(--ln);background:#fff;border-radius:14px;padding:14px 16px;cursor:pointer;min-height:96px;display:flex;flex-direction:column;gap:4px;font:inherit;color:var(--nv)}',
'.bs-big:hover{border-color:var(--bl)}.bs-big .ic{font-size:24px}.bs-big b{font-size:var(--t4,15px)}.bs-big small{font-size:13px;color:var(--gyd);line-height:1.5}',
'.bs-big.pri{border:2px solid var(--blt);background:var(--bl2)}',
'.bs-next{display:flex;justify-content:space-between;gap:8px;margin:4px 0 16px}.bs-next .btn{min-height:48px;font-size:var(--t4,15px)}.bs-next .btn:only-child{margin-left:auto}'
].join('\n');document.head.appendChild(st);})();
