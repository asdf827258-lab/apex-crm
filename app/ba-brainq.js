/* ══ 🧠 윤시현의 두뇌 — 쉬운판 (판 X509) ═══════════════════════════════════
   사장님 말씀 (2026-11-19) 「윤시현의 두뇌도 그렇고, 단어들 전체적으로 쉽게 재구성하고 쉽게 사용할수 있도록」 →
   목업 ④ 두뇌 쉬운판 → (11-20) 「응 차례대로 진행해」.

   지금 두뇌는 다섯 구역(바로 걸리는 말 · 여는 말 · 상담 흐름 · 병원비 공부방 · 그 밖의 비유)이라 상담 중에 찾기 어렵다.
   쉬운판은 <b>고객이 한 말을 누르면 세 칸만</b>: 🖼 한 줄 그림 · 💬 이렇게 말하세요 · 🔁 또 물으면(주고받기).
   ★ 글은 BRAIN_DOC 그대로 — 한 글자도 새로 안 쓴다(fig · back · rp · ex · so). 묶음 이름 셋만 새로.
   ★ 「이 고객에게 바로 걸리는 말」(brainPick().hot)은 목록에 🎯 로 표시하고, 그 고객 숫자 줄(you · why)을 맨 위에.
   ★ 「📚 전체 두뇌」 로 예전 다섯 구역이 그대로 열린다(여는 말 · 상담 흐름 · 병원비 공부방은 거기에).
   ba.html 은 brainHtml 맨 앞 한 줄 · 전체판 머리 단추 하나 · script 한 줄. 이름은 bz* · CSS 는 .bz 안.            */

var BZ_GROUP=[['💸 보험료 · 금액',[3,8,4,11]],['🙅 이미 있어요',[0,1,6,2]],['⏳ 나중에 · 해지',[7,9,10,5]]];
function bzView(){return S.brainView||window.BA_BRAIN_DEFAULT||'easy';}
function bzSet(v){S.brainView=v;save();render();window.scrollTo(0,0);}
function bzStrip(t){return String(t||'').replace(/<[^>]+>/g,'').replace(/^["“]|["”]$/g,'').trim();}
function bzHot(){var m={};try{brainPick().hot.forEach(function(x){var i=BRAIN_DOC.indexOf(x.d);if(i>=0&&!m[i])m[i]=x;});}catch(e){}return m;}
function bzOrder(){var seen={},G=BZ_GROUP.map(function(g){return [g[0],g[1].filter(function(i){if(!BRAIN_DOC[i]||seen[i])return false;seen[i]=1;return true;})];});
  var rest=[];BRAIN_DOC.forEach(function(d,i){if(!seen[i])rest.push(i);});if(rest.length)G.push(['📚 그 밖에',rest]);return G;}
function bzCur(H){var c=S.bzCur;if(c!==undefined&&BRAIN_DOC[c])return +c;var k=Object.keys(H);return k.length?+k[0]:(BZ_GROUP[0][1][0]||0);}
function bzPick(i){S.bzCur=i;save();var w=document.getElementById('bzWrap');if(w){w.innerHTML=bzBody();var a=document.getElementById('bzAns');
  if(a&&window.innerWidth<820)a.scrollIntoView({behavior:'smooth',block:'start'});}else render();}
function bzBody(){
  var H=bzHot(),cur=bzCur(H),d=BRAIN_DOC[cur]||BRAIN_DOC[0],G=bzOrder();
  var l='<div class="bz-l"><b class="bz-lh">고객이 이렇게 말하면</b><p class="bz-ls">누르세요 — 옆에 답이 나옵니다'+(Object.keys(H).length?' · 🎯 = 이 고객에게 바로 걸리는 말':'')+'</p>'+
    G.map(function(g){return '<div class="bz-g">'+g[0]+'</div>'+g[1].map(function(i){var x=BRAIN_DOC[i];
      return '<button class="bz-q'+(i===cur?' on':'')+(H[i]?' hot':'')+'" onclick="bzPick('+i+')">'+(H[i]?'🎯 ':'')+x.ic+' '+esc(bzStrip(x.q))+'</button>';}).join('');}).join('')+'</div>';
  var hot=H[cur],rp=(d.rp||[]).map(function(t){return '<div class="bz-b c"><small>고객</small>'+t.c+'</div><div class="bz-b m"><small>나</small>'+t.m+'</div>';}).join('');
  var a='<div class="bz-a" id="bzAns"><p class="bz-qq">'+d.ic+' '+d.q+'</p><p class="bz-tg">'+d.t+(d.tag?' · '+d.tag:'')+'</p>'+
    (hot&&(hot.you||hot.why)?'<div class="bz-box bz-you"><div class="l">🎯 이 고객에게</div><div class="t">'+(hot.you||'')+(hot.why?'<div class="why">'+hot.why+'</div>':'')+'</div></div>':'')+
    '<div class="bz-box bz-fig"><div class="l">🖼 한 줄 그림</div><div class="t">'+d.fig+'</div></div>'+
    '<div class="bz-box bz-say"><div class="l">💬 이렇게 말하세요</div><div class="t">'+d.back+'</div></div>'+
    (rp?'<div class="bz-box bz-rp"><div class="l">🔁 또 물으면 — 이렇게 주고받아요</div><div class="bz-chat">'+rp+'</div></div>':'')+
    '<details class="bz-more"><summary>＋ 왜 그런지 (설계사용 설명)</summary><div class="t">'+(d.ex||'')+(d.so?'<br><br>'+d.so:'')+'</div></details></div>';
  return l+a;
}
function bzHtml(){
  return '<div class="card bz"><h2>🧠 윤시현의 두뇌 — 쉬운판'+
    '<span class="r"><button class="mini" onclick="bzSet(\'full\')">📚 전체 두뇌 보기</button><button class="mini" onclick="closePanel()">닫기</button></span></h2>'+
    '<p class="bz-lead">고객이 한 말을 누르면 <b>세 칸만</b> 나옵니다 — 🖼 한 줄 그림 · 💬 이렇게 말하세요 · 🔁 또 물으면. '+
    '여는 말 · 상담 흐름 · 병원비 공부방은 「📚 전체 두뇌 보기」 에 그대로 있습니다.</p>'+
    '<div class="bz-w" id="bzWrap">'+bzBody()+'</div></div>';
}

(function(){var st=document.createElement('style');st.textContent=[
'.bz .bz-lead{font-size:var(--t4,15px);color:var(--gyd);margin:4px 0 12px}',
'.bz .bz-w{display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px;align-items:start}',
'@media (max-width:820px){.bz .bz-w{grid-template-columns:1fr}}',
'.bz .bz-l{background:var(--bg);border-radius:14px;padding:12px}',
'.bz .bz-lh{font-size:var(--t4,15px)}.bz .bz-ls{font-size:13px;color:var(--gyd);margin:2px 0 6px}',
'.bz .bz-g{font-size:13px;font-weight:800;color:var(--gyd);margin:10px 2px 6px}',
'.bz .bz-q{display:block;width:100%;text-align:left;min-height:48px;border-radius:12px;border:1px solid var(--ln);background:#fff;font:inherit;font-size:var(--t4,15px);font-weight:700;color:var(--nv);padding:8px 12px;margin-bottom:6px;cursor:pointer;line-height:1.45}',
'.bz .bz-q.hot{border-color:var(--or)}.bz .bz-q.on{border-color:var(--blt);background:var(--bl2);color:var(--blt)}',
'.bz .bz-a{min-width:0}.bz .bz-qq{font-size:22px;font-weight:800;margin:4px 0 2px;line-height:1.4}.bz .bz-tg{font-size:13px;color:var(--gyd);margin:0 0 12px}',
'.bz .bz-box{border-radius:14px;padding:14px 16px;margin-bottom:10px;border:1px solid var(--ln)}',
'.bz .bz-box .l{font-size:13px;font-weight:800;color:var(--gyd);margin-bottom:6px}.bz .bz-box .t{font-size:17px;line-height:1.7}',
'.bz .bz-box.bz-fig{background:var(--bg)}.bz .bz-box.bz-fig .t{font-size:19px}',
'.bz .bz-box.bz-say{background:var(--bl2);border-color:var(--bl2)}.bz .bz-box.bz-say .l{color:var(--blt)}.bz .bz-box.bz-say .t{font-size:19px;font-weight:600}',
'.bz .bz-say b{color:var(--blt);font-weight:800}',
'.bz .bz-box.bz-you{background:var(--or2);border-color:var(--or2)}.bz .bz-box.bz-you .l{color:var(--or)}.bz .bz-box.bz-you .why{font-size:14px;color:var(--gyd);margin-top:4px}',
'.bz .bz-chat{display:flex;flex-direction:column;gap:8px}',
'.bz .bz-b{max-width:88%;border-radius:14px;padding:10px 12px;font-size:16px;line-height:1.6}.bz .bz-b small{display:block;font-size:13px;font-weight:800;color:var(--gyd)}',
'.bz .bz-b.c{background:var(--bg);align-self:flex-start}.bz .bz-b.m{background:var(--gr2);align-self:flex-end}',
'.bz .bz-more summary{cursor:pointer;font-weight:800;color:var(--blt);min-height:44px;display:flex;align-items:center}',
'.bz .bz-more .t{font-size:15px;line-height:1.7;color:var(--gyd);background:var(--bg);border-radius:12px;padding:12px}'
].join('\n');document.head.appendChild(st);})();
