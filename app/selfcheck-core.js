/* ══════════════════════════════════════════════════════════════════
   selfcheck-core.js — 보장 셀프 점검의 <b>문항·판정 한 벌</b> (판 X171 · X180)

   쓰는 곳은 셋이고, 셋 다 이 파일 하나를 읽습니다(5번 — 두 벌이 되면
   한 곳만 고쳐져 고객이 다른 답을 봅니다).
     · app/selfcheck.html            — 고객이 제 폰에서 여는 한 장
     · app/상담자료/보험의기준.html   — 강의 덱의 PART 5 셀프 점검 두 장
     · app/index.html 「보험의 기준 · 셀프 점검」 — 설계사가 내 링크를 만드는 칸
       (문항 목록·첫인사 거르개·링크 짓기만 빌려 씁니다)

   ── 내 플로우 (판 X180) ──────────────────────────────────────────
   설계사마다 <b>쓸 문항과 순서 · 내 이름 · 첫인사 한 줄</b>을 정해 자기
   링크를 만들 수 있습니다. 설정은 주소의 # 뒤에만 담습니다 — # 뒤는
   서버로 가지 않습니다(7번 · 아무것도 저장하지 않음).
   ★ <b>판정 기준과 「약관·심사」 문구는 못 바꿉니다.</b> 사람마다 기준이
     달라지면 「보험의 기준」 이 아니고, 고객은 회사 주소에서 본 말을
     사실로 믿습니다(1번·2번).
   ★ 첫인사에는 결론·약속 낱말을 못 씁니다(BAN) — 「비과세」 「무조건」 …
   ★ 고객 이름은 주소에 안 넣습니다(3번). 넣는 것은 설계사 이름뿐입니다.
   ES5 로 씁니다. 재는 자: scripts/check-selfcheck.js · check-kijun.js
   ══════════════════════════════════════════════════════════════════ */
(function(){
  var S={ok:'괜찮아요',mid:'채우면 좋아요',need:'비어 있어요',chk:'확인해요'};
  var ALLQ=[
    {k:'silson',n:'실비 가입 시기',g:'실비',q:'내 실비, 언제 가입하셨어요?',w:'증권 첫 장 · 계약일',
     o:[['1','2009년 10월 이전','ok'],['2','2009 ~ 2017년','ok'],['3','2017 ~ 2021년','ok'],['4','2021년 이후','ok'],['n','실비 없어요','need'],['?','모르겠어요','chk']],
     t:{ok:'예전 실비는 다시 못 들어요 — 갈아타기 전에 꼭 물어보세요',need:'병원비 대부분을 내 돈으로 내게 돼요',chk:'증권의 계약일을 봐요'}},
    {k:'cancer',n:'암 진단비',g:'진단비',q:'암 진단비, 연소득의 몇 배인가요?',w:'담보명 ‘암진단비’ 옆 가입금액',r:1,
     t:{ok:'쉬는 동안의 월급까지 버틸 수 있는 크기예요',mid:'연소득의 1~2배까지 채우면 좋아요',need:'치료하는 동안 생활비가 비어요',chk:'증권의 가입금액과 내 연소득을 넣어 봐요'}},
    {k:'brain',n:'뇌 보장 이름',g:'이름 · 뇌',q:'뇌 보장 이름, 어떤 글자로 돼 있나요?',w:'증권 담보명',
     o:[['v','뇌혈관질환','ok'],['s','뇌졸중','mid'],['h','뇌출혈만','mid'],['n','뇌 보장 없어요','need'],['?','모르겠어요','chk']],
     t:{ok:'가장 넓은 이름이에요',mid:'이름이 좁으면 뇌경색 등은 빠질 수 있어요 — 넓혀요',need:'뇌 쪽이 비어 있어요',chk:'담보명에서 ‘뇌’ 글자를 찾아봐요'}},
    {k:'heart',n:'심장 보장 이름',g:'이름 · 심장',q:'심장 보장 이름은요?',w:'증권 담보명',
     o:[['i','허혈성 심장질환 (또는 더 넓은 심장질환)','ok'],['a','급성심근경색만','mid'],['n','심장 보장 없어요','need'],['?','모르겠어요','chk']],
     t:{ok:'협심증까지 들어가는 이름이에요',mid:'협심증은 빠질 수 있어요 — 넓혀요',need:'심장 쪽이 비어 있어요',chk:'담보명에서 ‘심’ 글자를 찾아봐요'}},
    {k:'similar',n:'유사암',g:'이름 · 유사암',q:'암 진단비 줄에 ‘유사암 제외’ 같은 괄호가 있나요?',w:'담보명 옆 괄호',
     o:[['s','있고, 유사암 줄이 따로 있어요','ok'],['x','있는데 따로 줄은 못 찾았어요','mid'],['n','괄호가 없어요','chk'],['?','모르겠어요','chk']],
     t:{ok:'갑상선암·제자리암 등을 받는 줄이 있어요',mid:'갑상선암·제자리암 등은 이 줄에서 빠져요 — 받는 줄이 있는지 봐요',chk:'약관에서 유사암을 어떻게 주는지 확인해요'}},
    {k:'surg',n:'수술비 횟수',g:'횟수',q:'수술비, 수술할 때마다 나오나요?',w:'담보명의 ‘1~5종’ · ‘N대’',
     o:[['m','할 때마다 (종·N대 수술비)','ok'],['1','한 번만 나와요','mid'],['n','수술비 없어요','need'],['?','모르겠어요','chk']],
     t:{ok:'다시 수술해도 또 나와요',mid:'두 번째 수술부터는 내 돈이에요',need:'수술비가 비어 있어요',chk:'담보명에 ‘종’이나 ‘N대’가 있는지 봐요'}},
    {k:'ctreat',n:'암 치료비',g:'횟수',q:'암 치료비가 진단 뒤에도 나오나요?',w:'‘암치료비’ · ‘항암’ 담보',
     o:[['y','네, 치료할 때마다·해마다 나와요','ok'],['n','진단비 한 번뿐이에요','mid'],['?','모르겠어요','chk']],
     t:{ok:'재발·전이로 치료가 길어져도 나와요',mid:'치료가 길어지면 진단비 하나로 버텨야 해요',chk:'‘치료비’ 글자가 들어간 담보를 찾아봐요'}},
    {k:'nonpay',n:'비싼 암 치료',g:'비싼 치료',q:'보험 안 되는 비싼 암 치료 담보가 있나요?',w:'‘비급여 암치료’ · ‘표적·면역항암’ · ‘중입자’',
     o:[['y','있어요','ok'],['n','없어요','need'],['?','모르겠어요','chk']],
     t:{ok:'횟수·한도를 한 번 더 확인해요',need:'신약·새 치료는 실비로 다 안 돼요',chk:'담보명에 ‘비급여’ · ‘표적’ · ‘중입자’가 있는지 봐요'}},
    {k:'end',n:'보장 끝 나이',g:'기간',q:'보장은 몇 살까지예요?',w:'보험기간 (‘○○세 만기’)',
     o:[['90','90세 이상','ok'],['80','80대','mid'],['70','80세 전에 끝나요','need'],['?','모르겠어요','chk']],
     t:{ok:'큰 병이 많은 나이까지 지켜 줘요',mid:'끝나는 나이 뒤가 비어요',need:'큰 병이 많은 나이에 보장이 끝나요',chk:'증권의 보험기간을 봐요'}},
    {k:'pay',n:'납입 끝',g:'기간',q:'보험료, 은퇴 전에 다 내나요?',w:'납입기간 (‘○○년납’ · ‘○○세납’)',
     o:[['y','네, 은퇴 전에 끝나요','ok'],['n','은퇴 뒤에도 내요','mid'],['?','모르겠어요','chk']],
     t:{ok:'버는 동안 끝나서 오래 지킬 수 있어요',mid:'은퇴 뒤 보험료가 부담될 수 있어요',chk:'증권의 납입기간을 봐요'}},
    {k:'renew',n:'갱신형',g:'기간',q:'‘갱신형’ 담보가 있나요?',w:'담보명 옆 ‘갱신’ 표시',
     o:[['n','없어요 (비갱신)','ok'],['y','있어요','chk'],['?','모르겠어요','chk']],
     t:{ok:'보험료가 정해져 있어요',chk:'갱신 때 보험료가 다시 정해져요 — 몇 년마다인지 확인해요'}},
    {k:'claim',n:'안 한 청구',g:'청구',q:'지난 3년, 병원 다녀오고 청구 안 한 게 있나요?',w:'진료비 영수증 · 병원 기록',
     o:[['n','다 청구했어요','ok'],['y','있는 것 같아요','need'],['?','모르겠어요','chk']],
     t:{ok:'좋아요 — 앞으로도 3년 안에',need:'3년이 지나면 청구가 어려워요 — 진료 기록과 맞춰 봐요',chk:'진료 기록과 담보를 맞춰 봐요'}},
    {k:'dup',n:'실비 개수',g:'돈 흐름',q:'실비가 두 개 이상인가요?',w:'회사별 증권 · 가입 내역',
     o:[['1','하나예요 (또는 없어요)','ok'],['2','두 개 이상이에요','mid'],['?','모르겠어요','chk']],
     t:{ok:'겹친 실비는 없어요',mid:'두 개여도 쓴 돈 안에서 나눠 받아요 — 겹친 보험료인지 봐요',chk:'가입 내역에서 실비(실손)를 세어 봐요'}}
  ];
  var Q=ALLQ.slice(), FLOW={by:'',hi:''};
  /* 첫인사 거르개 — 결론·약속·주소는 못 쓴다 (1번 지어내지 않는다 · 2번 세금은 조건부) */
  var BAN=['비과세','무조건','100%','확정','원금','손해 없','손해없','반드시','틀림없','보장해 드','보장해드','보장합니다','공짜','최고','1등','수익률','http','www.','.com','.kr'];
  var HI_MAX=60, BY_MAX=20;
  function checkHi(t){
    t=String(t||'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'');
    var bad=[];BAN.forEach(function(w){if(t.toLowerCase().indexOf(w)>=0)bad.push(w)});
    if(/<|>/.test(t))bad.push('< >');
    return{text:t.slice(0,HI_MAX),ok:!bad.length&&t.length<=HI_MAX,bad:bad,long:t.length>HI_MAX};
  }
  function cleanBy(t){return String(t||'').replace(/[<>"'&#]/g,'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'').slice(0,BY_MAX)}
  function keys(list){var seen={},out=[];(list||[]).forEach(function(k){for(var j=0;j<ALLQ.length;j++)if(ALLQ[j].k===k&&!seen[k]){seen[k]=1;out.push(k)}});return out}
  /* 주소 짓기 — 설정은 # 뒤에만 */
  function link(o,base){
    o=o||{};var p=[],ks=keys(o.q),h=checkHi(o.hi),b=cleanBy(o.by);
    if(ks.length&&ks.join('.')!==ALLQ.map(function(q){return q.k}).join('.'))p.push('q='+ks.join('.'));   /* 열셋 그대로면 안 적는다 */
    if(b)p.push('by='+encodeURIComponent(b));
    if(h.text&&h.ok)p.push('hi='+encodeURIComponent(h.text));
    return(base||'')+(p.length?'#'+p.join('&'):'');
  }
  function parse(hash){
    var o={q:null,by:'',hi:''};
    String(hash||'').replace(/^#/,'').split('&').forEach(function(kv){
      var i=kv.indexOf('=');if(i<0)return;var k=kv.slice(0,i),v=kv.slice(i+1);
      try{v=decodeURIComponent(v)}catch(e){v=''}
      if(k==='q')o.q=keys(v.split('.'));else if(k==='by')o.by=cleanBy(v);else if(k==='hi'){var h=checkHi(v);o.hi=h.ok?h.text:''}
    });
    if(o.q&&!o.q.length)o.q=null;
    return o;
  }
  function useFlow(o){
    Q=o&&o.q?o.q.map(function(k){for(var j=0;j<ALLQ.length;j++)if(ALLQ[j].k===k)return ALLQ[j]}):ALLQ.slice();
    FLOW={by:o&&o.by||'',hi:o&&o.hi||''};
  }
  var ST={a:{},n:{},p:{}};
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function man(v){v=Math.round(v);if(v>=10000){var e=Math.floor(v/10000),r=v%10000;return e+'억'+(r?' '+r.toLocaleString()+'만':'')+' 원'}return v.toLocaleString()+'만 원'}
  /* 한 문항의 판정 — 답이 없으면 null (아직) */
  function judge(q){
    if(q.r){
      if(ST.a[q.k]==='?')return{s:'chk',a:'모르겠어요'};
      var c=ST.n.c, i=ST.n.i;
      if(c==null||c==='')return null;
      c=+c;if(c===0)return{s:'need',a:'암 진단비 없어요'};
      if(!(+i>0))return{s:'chk',a:man(c)+' · 연소득을 넣으면 배수로 봐요'};
      var m=c/(+i), t=(Math.round(m*10)/10).toFixed(1);
      return{s:m>=1?'ok':m>=.5?'mid':'need',a:man(c)+' · 연소득의 '+t+'배'};
    }
    var v=ST.a[q.k];if(v==null)return null;
    for(var j=0;j<q.o.length;j++)if(q.o[j][0]===v)return{s:q.o[j][2],a:q.o[j][1]};
    return null;
  }
  function qHtml(q,i){
    var h='<div class="sc-q" data-scq="'+q.k+'"><div class="sc-qh"><i>'+(i<9?'0':'')+(i+1)+'</i><div><span class="g">'+esc(q.g)+'</span><b>'+esc(q.q)+'</b><small>📍 '+esc(q.w)+'</small></div><em class="sc-st"></em></div><div class="sc-ops">';
    if(q.r)h+='<label>암 진단비 <input type="number" min="0" step="100" inputmode="numeric" data-scn="c" placeholder="가입금액"> 만 원</label><label>연소득 <input type="number" min="0" step="100" inputmode="numeric" data-scn="i" placeholder="예: 5000"> 만 원</label><button type="button" class="sc-op" data-scv="?">모르겠어요</button>';
    else for(var j=0;j<q.o.length;j++)h+='<button type="button" class="sc-op" data-scv="'+q.o[j][0]+'">'+esc(q.o[j][1])+'</button>';
    return h+'</div></div>';
  }
  function all(sel,root){return [].slice.call((root||document).querySelectorAll(sel))}
  function paint(){
    var cnt={ok:[],mid:[],need:[],chk:[]}, done=0;
    Q.forEach(function(q){
      var r=judge(q);
      all('.sc-q[data-scq="'+q.k+'"]').forEach(function(el){
        var st=el.querySelector('.sc-st');
        el.setAttribute('data-s',r?r.s:'');
        st.textContent=r?S[r.s]:'';
        all('.sc-op',el).forEach(function(b){b.classList.toggle('on',ST.a[q.k]===b.getAttribute('data-scv'))});
        all('[data-scn]',el).forEach(function(n){var v=ST.n[n.getAttribute('data-scn')];if(document.activeElement!==n)n.value=v==null?'':v});
      });
      if(r){done++;cnt[r.s].push({q:q,r:r})}
    });
    var pick=[];
    all('[data-sc="res"]').forEach(function(box){
      all('[data-sccnt]',box).forEach(function(e){var k=e.getAttribute('data-sccnt');if(k==='left')e.textContent=String(Q.length-done);else if(cnt[k])e.textContent=String(cnt[k].length)});
      var h='';
      ['need','mid','chk'].forEach(function(s){
        cnt[s].forEach(function(x){
          var on=!!ST.p[x.q.k];
          h+='<div class="sc-it s-'+s+(on?' on':'')+'"><button type="button" class="sc-pick" data-scp="'+x.q.k+'" aria-pressed="'+on+'">'+(on?'✋ 같이 볼래요':'☐ 같이 볼래요')+'</button><div><b><em>'+S[s]+'</em> '+esc(x.q.n)+' · '+esc(x.r.a)+'</b><small>'+esc((x.q.t||{})[s]||'')+'</small></div></div>';
        });
      });
      if(cnt.ok.length)h+='<p class="sc-okl"><em>괜찮아요</em> '+cnt.ok.map(function(x){return esc(x.q.n)}).join(' · ')+' — 그대로 두셔도 돼요</p>';
      var L=box.querySelector('[data-sc="list"]');
      if(L)L.innerHTML=done?h:'<p class="sc-empty">왼쪽(위) 문항에 답하면 여기에 <b>내 보험에서 볼 칸</b>이 모여요.</p>';
    });
    Q.forEach(function(q){if(ST.p[q.k]){var r=judge(q);if(r&&r.s!=='ok')pick.push(q.n)}});
    all('[data-sccnt="pick"]').forEach(function(e){e.textContent=String(pick.length)});
    all('[data-sccnt="done"]').forEach(function(e){e.textContent=String(done)});
    save();
  }
  function text(){
    var d=new Date(), L=['[내 보험 셀프 점검 · '+d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+']'], g={ok:[],mid:[],need:[],chk:[]}, pk=[];
    Q.forEach(function(q){var r=judge(q);if(r){g[r.s].push(q.n+'('+r.a+')');if(ST.p[q.k]&&r.s!=='ok')pk.push(q.n)}});
    ['need','mid','chk','ok'].forEach(function(s){if(g[s].length)L.push(S[s]+': '+g[s].join(', '))});
    if(FLOW.by)L.splice(1,0,'→ '+FLOW.by+' 설계사님께');
    L.push('✋ 같이 볼 칸: '+(pk.length?pk.join(', '):'아직 안 골랐어요'));
    L.push('※ 제가 증권을 보고 스스로 체크한 결과예요. 보장·지급은 약관과 보험사 심사 결과에 따라요.');
    return L.join('\n');
  }
  function copy(btn){
    var t=text(), ok=function(){var o=btn.textContent;btn.textContent='복사했어요 ✓';setTimeout(function(){btn.textContent=o},1600)};
    try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok,fb);return}}catch(e){}
    fb();
    function fb(){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){window.prompt('아래 글을 복사해 보내 주세요',t)}a.remove()}
  }
  /* 기억은 고객 본인 폰(따로 나가는 한 장)에서만 — 설계사 기기(덱)에는 남기지 않는다. 다음 고객에게 답이 보이면 안 된다 */
  var KEEP=!!document.querySelector('[data-sc-keep]'), KEY='apxSelfCheck';
  function save(){if(!KEEP)return;try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}
  function load(){if(!KEEP)return;try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.a)ST={a:v.a||{},n:v.n||{},p:v.p||{}}}catch(e){}}
  function init(){
    if(!document.querySelector('[data-sc]'))return;     /* 앱 본체처럼 칸이 없는 곳에서는 표만 빌려 준다 */
    if(document.querySelector('[data-sc-flow]'))useFlow(parse(location.hash));
    all('[data-sc="by"]').forEach(function(e){e.textContent=FLOW.by});
    all('[data-sc="hi"]').forEach(function(e){e.textContent=FLOW.hi?'“'+FLOW.hi+'”':''});
    all('[data-sc-show]').forEach(function(e){e.hidden=!FLOW[e.getAttribute('data-sc-show')]});
    all('[data-sc="qs"]').forEach(function(box){
      var from=+(box.getAttribute('data-from')||0), to=+(box.getAttribute('data-to')||Q.length);
      box.innerHTML=Q.slice(from,to).map(function(q,i){return qHtml(q,from+i)}).join('');
    });
    all('[data-sccnt="all"]').forEach(function(e){e.textContent=String(Q.length)});
    load();paint();
  }
  document.addEventListener('click',function(e){
    var t=e.target;if(!t.closest)return;
    var b=t.closest('.sc-op');
    if(b){var k=b.closest('.sc-q').getAttribute('data-scq'), v=b.getAttribute('data-scv');ST.a[k]=ST.a[k]===v?null:v;if(v!=='?'&&k==='cancer')ST.a[k]=null;paint();return}
    var p=t.closest('.sc-pick');if(p){var q=p.getAttribute('data-scp');ST.p[q]=!ST.p[q];paint();return}
    var a=t.closest('[data-sca]');if(!a)return;
    var act=a.getAttribute('data-sca');
    if(act==='copy')copy(a);
    else if(act==='print')window.print();
    else if(act==='clear'){ST={a:{},n:{},p:{}};paint()}
  });
  document.addEventListener('input',function(e){
    var n=e.target.closest&&e.target.closest('[data-scn]');if(!n)return;
    var v=String(n.value).trim();ST.n[n.getAttribute('data-scn')]=v===''||!isFinite(+v)?null:Math.max(0,+v);
    if(ST.a.cancer==='?')ST.a.cancer=null;
    paint();
  });
  window.APXSelf={init:init,paint:paint,text:text,reset:function(){ST={a:{},n:{},p:{}};paint()},
    catalog:function(){return ALLQ.map(function(q){return{k:q.k,n:q.n,g:q.g,q:q.q}})},
    link:link,parse:parse,checkHi:checkHi,cleanBy:cleanBy,BAN:BAN.slice(),HI_MAX:HI_MAX,BY_MAX:BY_MAX};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
