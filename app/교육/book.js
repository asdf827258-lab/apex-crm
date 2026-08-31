/* 전자책 — 그리기만 합니다. 사실은 plan/master/easy/ment.js 에 있습니다.

   구조는 <b>앱</b>입니다. 문서가 아닙니다.
     홈 → 눌러서 장으로 → 장 안에서 눌러서 상세로 → 왼쪽 위 ‹ 로 나온다.
   칸을 위에 늘어놓지 않습니다. 지금 있는 자리 하나만 보입니다.               */
(function(){
var P=window.EDU_PLAN, M=window.EDU_MASTER, E=window.EDU_EASY, N=window.EDU_MENT||{};
var KEY='apex_edu_book';
function ls(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
function st(){var o=ls();o.read=o.read||{};o.hard=o.hard||{};return o;}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function rich(s){return esc(s).replace(/&lt;(\/?b)&gt;/g,'<$1>');}

/* 어려운 낱말에 점선 — 태그 밖 글자에만, 한 꼭지에서 처음 한 번만 */
var TERMS=Object.keys(E.terms).sort(function(a,b){return b.length-a.length;});
function R(s,seen){
  seen=seen||{};
  var parts=rich(s).split(/(<[^>]*>)/);
  for(var i=0;i<parts.length;i+=2){
    var t=parts[i]; if(!t)continue;
    for(var k=0;k<TERMS.length;k++){
      var w=TERMS[k]; if(seen[w])continue;
      var at=t.indexOf(w); if(at<0)continue;
      t=t.slice(0,at)+'<u class="tm" data-tm="'+esc(w)+'">'+esc(w)+'</u>'+t.slice(at+w.length);
      seen[w]=1;
    }
    parts[i]=t;
  }
  return parts.join('');
}

/* ── 부품 ── */
function row(o){
  var tag=o.go?'button':'div', at=o.go?' data-go="'+esc(o.go)+'"':'';
  return '<'+tag+' class="row'+(o.done?' done':'')+'"'+at+'>'+
    (o.bd!==undefined?'<span class="bd '+(o.c||'')+'">'+esc(o.bd)+'</span>':'')+
    '<span class="tx"><span class="t">'+R(o.t,o.seen)+'</span>'+
    (o.s?'<span class="s">'+R(o.s,o.seen)+'</span>':'')+'</span>'+
    (o.go?'<span class="ar">›</span>':'')+'</'+tag+'>';
}
function list(rows){return '<div class="list">'+rows.join('')+'</div>';}
var PRINTING=false;
function sec(key,title,body){
  var o=st(), note=E.notes[key], on=PRINTING?!!note:!!o.hard[key];
  return '<div class="sec" id="sec-'+key+'">'+
    (title?('<div class="hd-row"><h3>'+R(title)+'</h3>'+
      (note&&!PRINTING?'<button class="hardb'+(on?' on':'')+'" data-hard="'+esc(key)+'">'+
        (on?'✓ 표시함':'🙋 어려워요')+'</button>':'')+'</div>'):'')+
    '<div class="body">'+body+figOf(key)+picOf(key)+'</div>'+
    (on&&note?'<div class="easy"><span class="lb">쉽게 말하면요</span>'+rich(note)+'</div>':'')+
  '</div>';
}
/* 표 대신 — 두 쪽 견주기 */
function cmp(a,b,rows,seen){
  return '<div class="cmp"><div class="h"><span></span><span>'+esc(a)+'</span><span>'+esc(b)+'</span></div>'+
    rows.map(function(r){
      return '<div class="r"><div class="q">'+R(r[0],seen)+'</div><div class="two">'+
        '<div>'+R(r[1],seen)+'</div><div>'+R(r[2],seen)+'</div></div></div>';
    }).join('')+'</div>';
}

/* ── 그림은 손으로 그립니다 (CLAUDE.md 9) ── */
var C={b:'#3182F6',bl:'#E8F3FF',g:'#15C47E',gl:'#E8FAF3',r:'#F04452',rl:'#FFEBEE',
  a:'#E8A31D',al:'#FFF8E7',p:'#7C5CFC',pl:'#F1EDFF',k:'#191F28',m:'#8B95A1',ln:'#E5E8EB'};
function sv(w,h,inner){return '<svg viewBox="0 0 '+w+' '+h+'" role="img" xmlns="http://www.w3.org/2000/svg">'+
  '<style>.t{font:600 13px -apple-system,sans-serif;fill:'+C.k+'}.s{font:600 11px -apple-system,sans-serif;fill:'+C.m+'}'+
  '.n{font:800 17px -apple-system,sans-serif;fill:'+C.k+'}.w{font:800 13px -apple-system,sans-serif;fill:#fff}</style>'+
  inner+'</svg>';}
var FIG={
 funnel:function(){
   var L=[['TD','받은 명단',C.ln,230],['TA','전화한 것',C.bl,180],['AP','약속 잡힌 것',C.b,130],['PC','계약된 것',C.g,80]];
   var h='',y=18;
   for(var i=0;i<L.length;i++){
     var x=(340-L[i][3])/2;
     h+='<rect x="'+x+'" y="'+y+'" width="'+L[i][3]+'" height="42" rx="10" fill="'+L[i][2]+'"/>'+
        '<text x="170" y="'+(y+26)+'" text-anchor="middle" class="'+(i>1?'w':'t')+'">'+L[i][0]+' · '+L[i][1]+'</text>';
     if(i<3) h+='<path d="M170 '+(y+44)+' l-6 0 6 10 6 -10 z" fill="'+C.m+'"/>';
     y+=58;
   }
   return sv(340,y-10,h);
 },
 wallet:function(){
   var Nm=['생활','병원비','치료비','소득공백','가족보호','은퇴연금','간병','자산이전'],h='';
   for(var i=0;i<8;i++){
     var x=14+(i%4)*82, y=16+Math.floor(i/4)*76, weak=(i===3||i===6);
     h+='<rect x="'+x+'" y="'+y+'" width="70" height="60" rx="12" fill="'+(weak?C.rl:C.bl)+'"/>'+
        '<text x="'+(x+35)+'" y="'+(y+28)+'" text-anchor="middle" class="s">통장 '+(i+1)+'</text>'+
        '<text x="'+(x+35)+'" y="'+(y+46)+'" text-anchor="middle" class="t" style="font-size:11.5px">'+Nm[i]+'</text>';
   }
   return sv(340,192,h+'<text x="170" y="180" text-anchor="middle" class="s">붉은 칸이 지금 비어 있는 곳이에요</text>');
 },
 gap:function(){
   return sv(340,164,'<rect x="14" y="30" width="312" height="26" rx="8" fill="'+C.gl+'"/>'+
     '<text x="20" y="48" class="s">평소 — 소득이 들어옵니다</text>'+
     '<rect x="90" y="74" width="150" height="26" rx="8" fill="'+C.rl+'"/>'+
     '<text x="165" y="92" text-anchor="middle" class="s">일을 못 하는 동안</text>'+
     '<rect x="14" y="74" width="72" height="26" rx="8" fill="'+C.gl+'"/>'+
     '<rect x="244" y="74" width="82" height="26" rx="8" fill="'+C.gl+'"/>'+
     '<text x="165" y="126" text-anchor="middle" class="t">진단금은 한 번, 생활비는 매달</text>'+
     '<text x="165" y="148" text-anchor="middle" class="s">이 붉은 구간이 「소득공백」이에요</text>');
 },
 baba:function(){
   return sv(340,196,'<text x="80" y="22" text-anchor="middle" class="t">지금</text>'+
     '<text x="260" y="22" text-anchor="middle" class="t">바꾼 뒤</text>'+
     '<rect x="30" y="34" width="100" height="70" rx="12" fill="'+C.ln+'"/>'+
     '<text x="80" y="66" text-anchor="middle" class="s">보험료</text>'+
     '<text x="80" y="88" text-anchor="middle" class="n">높음</text>'+
     '<rect x="210" y="52" width="100" height="52" rx="12" fill="'+C.bl+'"/>'+
     '<text x="260" y="76" text-anchor="middle" class="s">보험료</text>'+
     '<text x="260" y="96" text-anchor="middle" class="n">낮음</text>'+
     '<rect x="30" y="116" width="100" height="40" rx="12" fill="'+C.rl+'"/>'+
     '<text x="80" y="141" text-anchor="middle" class="s">버티는 힘 약함</text>'+
     '<rect x="210" y="112" width="100" height="48" rx="12" fill="'+C.gl+'"/>'+
     '<text x="260" y="141" text-anchor="middle" class="s">버티는 힘 강함</text>'+
     '<text x="170" y="182" text-anchor="middle" class="s">「뭘 뺐나」가 아니라 이 둘이 어떻게 변했나를 봅니다</text>');
 },
 weekday:function(){
   var D=[['월','명단',C.bl],['화','전화',C.gl],['수','상담',C.pl],['목','결정',C.al],['금','정리',C.ln]],h='';
   for(var i=0;i<5;i++){
     var x=14+i*64;
     h+='<rect x="'+x+'" y="18" width="56" height="72" rx="12" fill="'+D[i][2]+'"/>'+
        '<text x="'+(x+28)+'" y="46" text-anchor="middle" class="n">'+D[i][0]+'</text>'+
        '<text x="'+(x+28)+'" y="70" text-anchor="middle" class="s">'+D[i][1]+'</text>';
   }
   return sv(340,124,h+'<text x="170" y="112" text-anchor="middle" class="s">매일 똑같이 하면 한 주가 그냥 흘러가요</text>');
 },
 month4:function(){
   var W=[['1주','채운다',C.gl],['2주','연다',C.pl],['3주','닫는다',C.al],['4주','심는다',C.bl]],h='';
   for(var i=0;i<4;i++){
     var x=14+i*80;
     h+='<rect x="'+x+'" y="20" width="70" height="58" rx="12" fill="'+W[i][2]+'"/>'+
        '<text x="'+(x+35)+'" y="44" text-anchor="middle" class="s">'+W[i][0]+'</text>'+
        '<text x="'+(x+35)+'" y="64" text-anchor="middle" class="t">'+W[i][1]+'</text>';
     if(i<3) h+='<path d="M'+(x+72)+' 49 l0 -5 8 5 -8 5 z" fill="'+C.m+'"/>';
   }
   return sv(340,112,h+'<text x="170" y="100" text-anchor="middle" class="s">다음 달 1주는 이번 달 4주에 만들어집니다</text>');
 },
 stack:function(){
   var lv=[[1,6,C.bl],[2,10,C.gl],[3,8,C.pl],[4,6,C.al]],h='',y=150,i;
   h+='<text x="170" y="26" text-anchor="middle" class="t">서른 장을 하나씩 쌓습니다</text>';
   for(i=0;i<4;i++){
     var w=lv[i][1]*16+10;
     h+='<rect x="'+((340-w)/2)+'" y="'+y+'" width="'+w+'" height="26" rx="8" fill="'+lv[i][2]+'"/>'+
        '<text x="170" y="'+(y+18)+'" text-anchor="middle" class="s">LEVEL '+lv[i][0]+' · '+lv[i][1]+'장</text>';
     y-=32;
   }
   return sv(340,208,h+'<text x="170" y="196" text-anchor="middle" class="s">아래부터 한 장씩 — 건너뛰지 않아요</text>');
 },
 gates:function(){
   var G=[['2주','습관'],['4주','한 바퀴'],['8주','분석'],['12주','자립']],h='';
   h+='<line x1="24" y1="46" x2="316" y2="46" stroke="'+C.ln+'" stroke-width="3"/>';
   for(var i=0;i<4;i++){
     var x=40+i*78;
     h+='<circle cx="'+x+'" cy="46" r="13" fill="'+C.b+'"/>'+
        '<text x="'+x+'" y="51" text-anchor="middle" class="w">'+(i+1)+'</text>'+
        '<text x="'+x+'" y="26" text-anchor="middle" class="t">'+G[i][0]+'</text>'+
        '<text x="'+x+'" y="76" text-anchor="middle" class="s">'+G[i][1]+'</text>';
   }
   return sv(340,114,h+'<text x="170" y="102" text-anchor="middle" class="s">시험이 아니라 앱에 남은 기록으로 봅니다</text>');
 },
 flow:function(){
   var F=['고객 등록','팩트파인딩','보장분석','치료비','전후 비교','제안','보고서','사후관리'],h='';
   for(var i=0;i<8;i++){
     var x=14+(i%4)*82, y=16+Math.floor(i/4)*62;
     h+='<rect x="'+x+'" y="'+y+'" width="70" height="42" rx="10" fill="'+(i<4?C.bl:C.gl)+'"/>'+
        '<text x="'+(x+35)+'" y="'+(y+26)+'" text-anchor="middle" class="t" style="font-size:11.5px">'+F[i]+'</text>';
     if(i%4<3) h+='<path d="M'+(x+72)+' '+(y+21)+' l0 -4 7 4 -7 4 z" fill="'+C.m+'"/>';
   }
   return sv(340,154,h+'<text x="170" y="142" text-anchor="middle" class="s">한 고객이 이 순서로 흘러갑니다</text>');
 }
};
function figOf(k){var f=E.figs&&E.figs[k];return (f&&FIG[f])?'<figure>'+FIG[f]()+'</figure>':'';}
function picOf(k){
  var p=E.pics&&E.pics[k]; if(!p)return '';
  return '<figure><img src="'+esc(p[0])+'" alt="'+esc(p[1])+'" loading="lazy">'+
    '<figcaption>'+rich(p[1])+'</figcaption></figure>';
}
function opens(ids,label){
  if(!ids||!ids.length)return '';
  var h='<div class="opl">'+esc(label||'여기서 바로 열 수 있어요')+'</div><div class="opens">';
  for(var i=0;i<ids.length;i++){
    var nm=P.screens[ids[i]]; if(!nm) continue;
    h+='<a class="op'+(i?' g':'')+'" target="_top" href="../index.html?go='+
       encodeURIComponent(ids[i])+'">'+esc(nm)+'</a>';
  }
  return h+'</div>';
}

/* ══ 장 ══ */
var CH=[
 {k:'how', t:'이 책을 읽는 법',      s:'2분이면 됩니다',            e:'📖'},
 {k:'team',t:'우리 팀은 이런 팀입니다', s:'약속 여섯 · 안 하는 일 여섯', e:'🤝'},
 {k:'path',t:'어디로 가는지',        s:'신입 열두 주 · 경력 여덟 주',  e:'🧭'},
 {k:'mast',t:'프로그램 배우기',      s:'서른 장을 하나씩',           e:'📱'},
 {k:'play',t:'이럴 땐 뭘 쓰나요',    s:'고객이 한 말로 찾기',        e:'🎯'},
 {k:'rhy', t:'하루 · 한 주 · 한 달',  s:'요일마다 하는 일이 달라요',   e:'📅'},
 {k:'stu', t:'무엇을 공부하나요',     s:'얼마나 · 어떻게 확인하나',    e:'📚'},
 {k:'lead',t:'팀을 여는 분들',       s:'지점장 · 교육매니저 · 조회',  e:'🧑‍🏫'},
 {k:'ses', t:'세션 카드',           s:'조회의 이번 주 한 가지',      e:'🃏'},
 {k:'ment',t:'고객에게 하는 말',     s:'스물세 줄 · 결이 셋',        e:'🗣'},
 {k:'law', t:'꼭 지키는 것',        s:'나가기 전에 되돌리는 자리',   e:'🛡'},
 {k:'dict',t:'어려운 말 사전',       s:'낱말 쉰셋',                e:'🔤'},
 {k:'mine',t:'내가 어려워한 곳',     s:'매니저에게 보여 주세요',      e:'🙋'}
];
var cur='home', sub='';
(function(){
  var h=(location.hash||'').replace('#','').split('/');
  if(h[0]&&(h[0]==='home'||CH.some(function(c){return c.k===h[0];}))){cur=h[0];sub=h[1]||'';}
})();
function go(k,s){cur=k;sub=s||'';try{location.hash=k+(s?('/'+s):'');}catch(e){}paint();}
function idx(){for(var i=0;i<CH.length;i++)if(CH[i].k===cur)return i;return -1;}

/* ══ 홈 ══ */
function vHome(){
  var o=st(), n=0, nx='';
  CH.forEach(function(c){if(o.read[c.k])n++;else if(!nx)nx=c.k;});
  var mo=(function(){try{return (JSON.parse(localStorage.getItem('apex_edu_me')||'{}').master)||{};}catch(e){return {};}})();
  var done=0, blocks='';
  M.cards.forEach(function(c){var d=!!mo[c.n];if(d)done++;blocks+='<i class="'+(d?'on':'')+'"></i>';});

  var h='<div class="hi"><h1>APEX 를 처음<br>쓰시는 분께</h1>'+
    '<p>여기 있는 걸 다 아실 필요는 없어요.<br><b>막혔을 때 어디를 펴면 되는지</b>만 아시면 됩니다.</p></div>';
  h+='<div class="stat"><div class="k">읽은 장</div>'+
     '<div class="v">'+n+' <small>/ '+CH.length+'</small></div>'+
     '<div class="pg"><i style="width:'+Math.round(n/CH.length*100)+'%"></i></div>'+
     '<div class="m">'+(n?'이어서 읽으시면 돼요.':'첫 장은 2분이면 끝납니다.')+'</div></div>';
  h+='<div class="stat"><div class="k">해 본 장 (서른 장 중)</div>'+
     '<div class="v">'+done+' <small>/ '+M.cards.length+'</small></div>'+
     '<div class="stack">'+blocks+'</div>'+
     '<div class="m">한 번에 다 하지 않아요. <b>한 장 읽고, 한 번 해 보고, 칸 하나</b>를 채웁니다.</div></div>';
  h+='<div class="grp">차례</div>';
  h+=list(CH.map(function(c,i){
    return row({bd:o.read[c.k]?'✓':(i+1),c:o.read[c.k]?'g':'',t:c.e+' '+c.t,s:c.s,go:c.k,done:!!o.read[c.k]});
  }));
  /* 종이로 갖고 싶은 분께 — 누르면 접어 둔 쉬운 말까지 펴서 한 권으로 나옵니다 */
  h+='<div class="sec"><div class="body"><p class="mini">'+
     '종이로 보고 싶으시면 아래를 누르세요. 접어 둔 쉬운 말까지 <b>전부 펴서</b> 한 권으로 나옵니다.</p>'+
     '<button class="clr" data-print="1">🖨 전부 인쇄 · PDF 로 저장</button></div></div>';
  return h;
}

/* ══ 장 ══ */
var V={};
V.how=function(){
  return sec('read',E.read.title,'<ul>'+E.read.lines.map(function(x){return '<li>'+rich(x)+'</li>';}).join('')+'</ul>')+
    sec('','한 가지만 기억하세요',
      '<div class="quo">「모릅니다. 확인해서 알려드리겠습니다.」</div>'+
      '<p>이 말을 할 줄 아는 게 첫날 배우는 전부예요. 모르는 건 흠이 아니고, <b>지어내는 것만</b> 흠입니다.</p>');
};
V.team=function(){
  var s={};
  var h=sec('creed','우리 팀의 약속','<p>'+R(P.welcome.line,s)+'</p>'+
    '<p>규칙이 아니라 <b>약속</b>이에요. 지키라고 드리는 게 아니라, 저희가 이렇게 하겠다는 말입니다.</p>')+
    list(P.creed.map(function(c,i){return row({bd:i+1,c:'g',t:c[0],s:c[1],seen:s});}));
  h+=sec('never','우리가 하지 않는 일',
    '<p>팀이 어떤 팀인지는 하는 일보다 <b>안 하는 일</b>에서 드러나요. 이 여섯은 예외가 없습니다.</p>')+
    list(P.never.map(function(x){return row({bd:'✕',c:'r',t:x,seen:s});}));
  return h;
};
V.path=function(){
  var s={},h='<p class="lede">'+rich(E.lead.c2)+'</p>';
  ['new','career'].forEach(function(t){
    var nm=(t==='new')?'신입으로 오신 분 · 열두 주':'경력으로 오신 분 · 여덟 주';
    h+='<div class="grp">'+esc(nm)+'</div>';
    h+=sec(t==='new'?'arc':'career','어떤 사람이 되어 있나','')+
       list(P.arc[t].map(function(a,i){
         return row({bd:a[0],c:['b','g','p'][i]||'',t:a[1],s:a[2]+'<br><b>'+a[3]+'</b>',seen:s});}));
    h+='<div class="grp">첫 주에 할 세 가지</div>'+
       list(P.firstWeek[t].map(function(f,i){return row({bd:i+1,c:'a',t:f[0],s:f[1],seen:s});}));
  });
  h+='<div class="grp">게이트</div>'+
    sec('gate','넘어가기 전에 보는 것',
      '<p>시험이 아니에요. <b>앱에 남은 기록</b>으로 봅니다. 통과 못 해도 혼나지 않고 같은 걸 한 주 더 합니다.</p>')+
    list(P.gates.map(function(g){return row({bd:g[0].replace('주',''),c:'b',t:g[1],s:g[2],seen:s});}))+
    '<div class="grp">경력</div>'+
    list(P.careerGates.map(function(g){return row({bd:g[0].replace('주',''),c:'p',t:g[1],s:g[2],seen:s});}));
  return h;
};

/* ── 서른 장 : 목록 → 눌러서 상세 ── */
V.mast=function(){
  if(sub) return cardView(sub);
  var s={},h='<p class="lede">'+rich(E.lead.c3)+'</p>';
  h+=sec('master','서른 장이 하는 일','<p>'+R(M.concept,s)+'</p>')+
     '<div class="warn">'+R(M.notManual,s)+'</div>';
  var mo=(function(){try{return (JSON.parse(localStorage.getItem('apex_edu_me')||'{}').master)||{};}catch(e){return {};}})();
  M.levels.forEach(function(lv){
    var inLv=M.cards.filter(function(c){return c.lv===lv[0];});
    var d=0; inLv.forEach(function(c){if(mo[c.n])d++;});
    h+='<div class="grp">LEVEL '+lv[0]+' · '+esc(lv[1])+' — '+esc(lv[3])+' ('+d+'/'+inLv.length+')</div>';
    h+=list(inLv.map(function(c){
      return row({bd:c.n,c:mo[c.n]?'g':'',t:c.kr,s:c.what,go:'mast/'+c.n,done:!!mo[c.n]});
    }));
  });
  h+='<div class="grp">마지막</div>'+list([row({bd:'✓',c:'k',t:'FINAL MISSION',s:'설명 없이 처음부터 끝까지',go:'mast/final'})]);
  return h;
};
function cardView(n){
  if(n==='final'){
    var f=M.final,s2={};
    return '<h2 class="head">FINAL MISSION</h2><p class="lede">설명 없이 처음부터 끝까지</p>'+
      sec('final','마지막 시험','<p>'+R(f.order,s2)+'</p>'+
        '<div class="chips">'+f.who.map(function(w){return '<span>'+esc(w)+'</span>';}).join('')+
        f.num.map(function(x){return '<span class="num">'+esc(x[0])+' '+esc(x[1])+esc(x[2])+'</span>';}).join('')+
        f.more.map(function(w){return '<span>'+esc(w)+'</span>';}).join('')+'</div>'+
        '<div class="kv">이건 꼭 들어가야 해요</div><p>'+f.must.map(esc).join(' → ')+'</p>'+
        '<div class="good"><b>합격</b><br>'+f.pass.map(function(x){return '· '+R(x,s2);}).join('<br>')+'</div>');
  }
  var c=null; M.cards.forEach(function(x){if(x.n===n)c=x;});
  if(!c) return '<div class="sec"><div class="body">그 장을 찾지 못했습니다.</div></div>';
  var q={}, h='<h2 class="head">'+esc(c.n)+'. '+R(c.kr,q)+'</h2>'+
    '<p class="lede">'+esc(c.name)+' · LEVEL '+c.lv+' · ⏱ '+esc(c.min)+'</p>';
  var b='<p>'+R(c.what,q)+'</p>';
  b+='<div class="kv">이럴 때 씁니다</div>'+
     c.when.map(function(w){return /「/.test(w)?('<div class="quo">'+R(w,q)+'</div>'):('<p>· '+R(w,q)+'</p>');}).join('');
  b+='<div class="kv">준비할 것</div><p>'+c.need.map(esc).join(' · ')+'</p>';
  h+=sec('m'+c.n,'무엇이고 언제 쓰나',b);
  h+='<div class="grp">순서</div>'+list(c.steps.map(function(x,i){return row({bd:i+1,c:'b',t:x,seen:q});}));
  h+='<div class="grp">이건 꼭 조심하세요</div>'+list(c.check.map(function(x){return row({bd:'!',c:'r',t:x,seen:q});}));
  var b2='';
  if(c.say) b2+='<div class="kv">고객에게는 이렇게</div><div class="quo">'+R(c.say,q)+'</div>';
  b2+='<div class="good"><b>이러면 다 한 거예요</b><br>'+R(c.pass,q)+'</div>';
  M.practice.filter(function(p2){return p2.at===c.n;}).forEach(function(p2){
    b2+='<div class="kv">연습해 보세요</div><div class="chips">'+
      p2.who.map(function(w){return '<span>'+esc(w)+'</span>';}).join('')+
      p2.num.map(function(x){return '<span class="num">'+esc(x[0])+' '+esc(x[1])+esc(x[2])+'</span>';}).join('')+
      '</div><p>'+R(p2.task,q)+'</p><div class="good">'+R(p2.pass,q)+'</div>';
  });
  b2+=opens(c.go,'눌러서 바로 열기');
  if(c.next) b2+='<div class="kv">다음</div><p>'+esc(c.next)+' · '+
    esc((M.cards.filter(function(x){return x.n===c.next;})[0]||{}).kr||'')+'</p>';
  h+=sec('',(c.say?'말과 합격':'합격'),b2);
  return h;
}

V.play=function(){
  var s={},h='<p class="lede">'+rich(E.lead.c4)+'</p>'+
    sec('play','같은 기능이라도 순서가 달라요','<p>고객이 한 말을 먼저 보세요. 그다음 번호 순서대로 켜시면 됩니다.</p>');
  M.playbook.forEach(function(pb){
    var q={};
    h+='<div class="grp">'+esc(pb.ic)+' '+esc(pb.t)+'</div>'+
      '<div class="sec"><div class="body"><div class="quo">'+R(pb.say,q)+'</div>'+
      '<div class="seq">'+pb.seq.map(function(n,i){
        var c=M.cards.filter(function(x){return x.n===n;})[0];
        return (i?'<i>→</i>':'')+'<b>'+esc(n)+' '+esc(c?c.kr:'')+'</b>';}).join('')+'</div>'+
      '<div class="warn">'+R(pb.note,q)+'</div></div></div>';
  });
  return h;
};
V.rhy=function(){
  var s={},h='<p class="lede">'+rich(E.lead.c5)+'</p>';
  h+='<div class="grp">신입의 하루</div>'+
     list(P.newDay.map(function(d){return row({bd:d[0].replace(/[^0-9:]/g,'')||'·',t:d[1],s:d[2],seen:s});}));
  h+=sec('week','요일마다 하는 일이 달라요',
    '<p>매일 똑같이 하면 한 주가 그냥 흘러가요. 그래서 <b>그날 안 하는 일</b>도 같이 정해 뒀습니다.</p>');
  P.week.forEach(function(w){
    var q={};
    h+='<div class="grp">'+esc(w.day)+'요일 · '+esc(w.head.replace(/<[^>]*>/g,''))+'</div>'+
      list(w.miss.map(function(m,i){return row({bd:i+1,c:'b',t:m[0],s:m[1],seen:q});}))+
      '<div class="warn">이날은 <b>'+R(w.no,q)+'</b></div>'+
      '<div class="good">확인 · '+R(w.see,q)+'</div>';
  });
  h+=sec('month','한 달은 네 주로 나눠요','')+
     list(P.monthly.weeks.map(function(w,i){return row({bd:w[0].replace('주차',''),c:['g','p','a','b'][i],t:w[1],s:w[2],seen:s});}));
  h+='<div class="grp">1일에 하는 것</div>'+
     list(P.monthly.open.map(function(x){return row({bd:'·',t:x[0],s:x[1],seen:s});}));
  h+='<div class="grp">말일에 하는 것</div>'+
     list(P.monthly.close.map(function(x){return row({bd:'·',c:'r',t:x[0],s:x[1],seen:s});}));
  h+=sec('cal','달력은 저절로 채워져요',
    '<p>요일 미션 · 월목 조회 · 달 열기와 닫기는 <b>자동으로 깔립니다.</b> 그 위에 제 일정만 얹으시면 돼요.</p>'+
    opens(['finance','wallets','bojang'],'상담에서 여는 화면'));
  return h;
};
V.stu=function(){
  var s={},h='<p class="lede">'+rich(E.lead.c6)+'</p>';
  h+=sec('study','얼마나 자주 하나요','')+
     list(P.studyRhythm.map(function(r){return row({bd:r[0].replace(/\s/g,''),c:'b',t:r[1],s:r[2],seen:s});}));
  h+='<div class="grp">무엇을 보나요</div>'+
     list(P.study.map(function(x){return row({bd:'·',t:x[0],s:x[1]+'<br><b>확인 · '+x[3]+'</b>',seen:s});}));
  h+='<div class="warn"><b>외울 건 숫자가 아니라 「어디서 확인하는가」예요.</b> 세법은 바뀝니다. '+
     '외운 숫자를 고객 앞에서 말하는 게 제일 위험해요.</div>';
  h+=sec('goal','내 목표를 세우는 법',
    '<p>목표를 적으면 앱이 <b>「오늘 몇 통 걸어야 하는지」</b>까지 계산해 줘요.</p>')+
    list(P.goalFields.map(function(f){return row({bd:'□',t:f[1]+' ('+f[2]+')',s:f[3]||'내가 정합니다',seen:s});}))+
    '<div class="warn">'+R(P.goalRules[0],s)+'</div>'+
    opens(['academy','growboard','airep'],'여기서 적고 봅니다');
  return h;
};
V.lead=function(){
  var s={},h='<p class="lede">'+rich(E.lead.c7)+'</p>';
  h+=sec('','지점장과 교육매니저는 보는 게 달라요','')+
     cmp('지점장','교육매니저',P.who.axis,s)+
     '<div class="warn">'+R(P.who.rule,s)+'</div>';
  h+='<div class="grp">지점장의 하루</div>'+
     list(P.mgrDay.map(function(d){return row({bd:'·',t:d[1],s:d[0]+' — '+d[2],seen:s});}))+
     '<div class="warn"><b>지점장이 하지 않는 것</b><br><br>'+
     P.leadNo.map(function(x){return '✕ '+R(x,s);}).join('<br><br>')+'</div>';
  h+=sec('lead','','');
  h+='<div class="grp">교육매니저의 하루</div>'+
     list(P.edu.day.map(function(d){return row({bd:'·',c:'p',t:d[1],s:d[2],seen:s});}));
  h+=sec('edu','','');
  h+=sec('meet','월요일 · 목요일 아침 조회',
    '<p>둘은 <b>다른 회의</b>예요. 월요일은 <b>누구를 만날지</b>, 목요일은 <b>누구에게 결정을 부탁할지</b>를 정합니다. 각 40분이에요.</p>');
  P.meetings.forEach(function(m){
    var q={};
    h+='<div class="grp">'+esc(m.day)+' · '+esc(m.title.replace(/<[^>]*>/g,''))+'</div>'+
      '<div class="sec"><div class="body"><div class="quo">'+R(m.goal,q)+'</div></div></div>'+
      list(m.steps.map(function(x){return row({bd:x[0]+'분',t:x[1],s:x[2],seen:q});}))+
      '<div class="warn">'+R(m.ban,q)+'</div>';
  });
  h+=sec('cover','팀원이 막혔다고 할 때','')+
     list(P.cover.map(function(c){return row({bd:'?',c:'a',t:c[0],s:'사실은 — '+c[1]+'<br><b>'+c[2]+'</b>',seen:s});}));
  return h;
};
V.ses=function(){
  var h='';
  P.sessions.forEach(function(x){
    var q={};
    h+='<div class="grp">'+esc(x.when)+'</div>'+
      sec('ses',x.title,'<p>'+R(x.why,q)+'</p>')+
      list(x.flow.map(function(f){return row({bd:f[0].replace('분',''),c:'g',t:f[1],s:f[2],seen:q});}));
    if(x.blanks) h+='<div class="grp">내가 채우는 칸</div>'+
      list(x.blanks.map(function(z){return row({bd:z[0],c:'a',t:z[1],s:z[2],seen:q});}));
    if(x.calc) h+='<div class="good"><b>계산</b><br>'+x.calc.map(esc).join('<br>')+'</div>';
    if(x.sheet) h+='<div class="grp">소식지 여섯 칸</div><div class="sec"><div class="body"><div class="chips">'+
      x.sheet.map(function(z){return '<span>'+esc(z)+'</span>';}).join('')+'</div></div></div>';
    if(x.rules) h+='<div class="warn"><b>지키는 것</b><br><br>'+
      x.rules.map(function(z){return '· '+R(z,q);}).join('<br><br>')+'</div>';
  });
  return h;
};
V.ment=function(){
  if(sub) return mentView(sub);
  var h='<p class="lede">MASTER 카드에서 <b>고객에게 실제로 하는 말</b>만 모았습니다. '+
    '<b>외우지 마세요.</b> 소리 내어 세 번 읽고, 그날 한 분에게 써 보시면 그때부터 입에 붙습니다.</p>';
  h+=sec('','결이 셋 있습니다','')+
     list([row({bd:1,t:'담백',s:'짧게, 사실만. 처음 만난 자리에서 안전해요.'}),
           row({bd:2,c:'g',t:'공감',s:'고객 걱정에 먼저 붙습니다. 방어가 풀려요.'}),
           row({bd:3,c:'p',t:'짚기',s:'핵심을 한 번 세게. 이미 편해진 사이에서 씁니다.'})]);
  h+='<div class="grp">스물세 줄</div>';
  h+=list(M.cards.filter(function(c){return c.say;}).map(function(c){
    var m=N[c.n]||{};
    return row({bd:c.n,c:m.law?'r':'b',t:c.kr,s:(m.sit||'').replace(/<[^>]*>/g,''),go:'ment/'+c.n});
  }));
  return h;
};
function mentView(n){
  var c=null; M.cards.forEach(function(x){if(x.n===n)c=x;});
  if(!c||!c.say) return '<div class="sec"><div class="body">그 줄을 찾지 못했습니다.</div></div>';
  var m=N[n]||{}, q={};
  var h='<h2 class="head">'+esc(n)+'. '+R(c.kr,q)+'</h2>';
  h+='<div class="quo">'+R(m.sit||c.when[0],q)+'</div>';
  h+='<div class="grp">지금 쓰는 말</div><div class="good">'+R(c.say,q)+'</div>';
  if(m.alt&&m.alt.length){
    h+='<div class="grp">이렇게도 말할 수 있어요</div>'+
      list(m.alt.map(function(a){
        return row({bd:a[0].charAt(0),c:a[0]==='공감'?'g':a[0]==='짚기'?'p':'',t:'「'+a[1]+'」',s:a[0],seen:q});
      }));
  }
  var b='';
  if(m.why) b+='<p>'+R(m.why,q)+'</p>';
  if(m.law) b+='<div class="warn"><b>이건 꼭</b> · '+R(m.law,q)+'</div>';
  b+=opens(c.go,'이 말을 하는 화면');
  h+=sec('','왜 이렇게 말하나',b);
  return h;
}
V.law=function(){
  var s={};
  return '<p class="lede">'+rich(E.lead.c8)+'</p>'+
    sec('law','고객에게 나가는 것에 꼭 붙는 말',
      '<p>아래가 빠져 있으면 <b>나가기 전에</b> 되돌립니다. 나간 자료는 못 되돌려요.</p>')+
    list(P.compliance.map(function(x){return row({bd:'!',c:'r',t:x,seen:s});}))+
    sec('','마지막으로','<div class="quo">보장과 지급은 약관과 심사 결과에 따릅니다.</div>'+
      '<p>이 한 줄을 빼지 않는 것이 <b>고객을 지키고 저를 지킵니다.</b></p>');
};
V.dict=function(){
  return '<p class="lede">'+rich(E.lead.c9)+'</p>'+
    list(Object.keys(E.terms).map(function(w){
      return row({bd:'가',t:w,s:E.terms[w]});
    }));
};
V.mine=function(){
  var o=st(), keys=Object.keys(o.hard).filter(function(k){return o.hard[k];});
  var h='<p class="lede">「어려워요」를 누르신 자리가 여기 모입니다. '+
    '<b>이 목록을 매니저에게 보여 주세요.</b> 모르는 건 흠이 아니에요.</p>';
  if(!keys.length) return h+'<div class="sec"><div class="body">'+
    '<p>아직 없습니다. 읽다가 막히면 꼭지 오른쪽 <b>「🙋 어려워요」</b>를 눌러 두세요.</p></div></div>';
  return h+list(keys.map(function(k){return row({bd:'?',c:'a',t:nameOf(k),s:E.notes[k]||''});}))+
    '<div class="sec"><div class="body"><p class="mini">매니저와 같이 보고 나면 지우셔도 됩니다.</p>'+
    '<button class="clr" data-clr="1">이 목록 지우기</button></div></div>';
};
function nameOf(k){
  if(/^m\d\d$/.test(k)){var c=M.cards.filter(function(x){return x.n===k.slice(1);})[0];
    return 'MASTER '+k.slice(1)+' · '+(c?c.kr:'');}
  if(/^mt\d\d$/.test(k)){var c2=M.cards.filter(function(x){return x.n===k.slice(2);})[0];
    return '멘트 '+k.slice(2)+' · '+(c2?c2.kr:'');}
  var map={creed:'우리 팀의 약속',never:'우리가 하지 않는 일',arc:'신입 — 어디로 가는지',
   career:'경력 — 어디로 가는지',first:'첫 주에 할 세 가지',gate:'게이트',master:'서른 장이 하는 일',
   play:'이럴 땐 뭘 쓰나요',week:'요일마다 하는 일',month:'한 달 네 주',cal:'달력',study:'공부',
   goal:'내 목표',lead:'지점장',edu:'교육매니저',meet:'월·목 조회',cover:'막혔다고 할 때',
   ses:'세션 카드',law:'꼭 지키는 것',read:'이 책을 읽는 법',final:'마지막 시험'};
  return map[k]||k;
}

/* ══ 그리기 ══ */
function paint(){
  var o=st(), i=idx(), body, title, cta='';
  if(cur==='home'){ body=vHome(); title='APEX 전자책'; }
  else{
    var c=CH[i];
    title=c.t;
    body=(sub?'':'<h2 class="head">'+esc(c.t)+'</h2>')+((V[cur]||function(){return '';})());
  }
  document.getElementById('pane').innerHTML=body;
  document.getElementById('nt').textContent=title;
  document.getElementById('bk').style.visibility=(cur==='home')?'hidden':'visible';

  /* 아래 고정 — 다음 할 일 하나만 */
  if(cur==='home'){
    var nx=''; CH.forEach(function(c2){if(!nx&&!o.read[c2.k])nx=c2.k;});
    var n=0; CH.forEach(function(c2){if(o.read[c2.k])n++;});
    cta=nx?'<button class="big" data-go="'+nx+'">'+(n?'이어보기':'첫 장부터 읽기')+'</button>':
            '<button class="big dn" data-go="dict">다 읽으셨어요 · 사전 보기</button>';
  }else if(sub){
    cta='<button class="big gh" data-back="1">‹</button>'+
        '<button class="big" data-go="'+cur+'">목록으로</button>';
  }else{
    var nxt=CH[i+1];
    cta='<button class="big gh" data-read="'+cur+'">'+(o.read[cur]?'✓':'읽음')+'</button>'+
        (nxt?'<button class="big" data-go="'+nxt.k+'">'+esc(nxt.t)+' ›</button>'
            :'<button class="big dn" data-go="home">처음으로</button>');
  }
  document.getElementById('ctain').innerHTML=cta;
  var rn=0; CH.forEach(function(c2){if(o.read[c2.k])rn++;});
  document.getElementById('pgi').style.width=Math.round(rn/CH.length*100)+'%';
  window.scrollTo(0,0);
}

/* ══ 한 곳에서 받습니다 ══ */
document.body.addEventListener('click',function(e){
  var el=e.target.closest('[data-go],[data-hard],[data-tm],[data-read],[data-back],[data-fs],[data-clr],[data-print]');
  if(!el) return;
  var v;
  if(el.hasAttribute('data-back')){ if(sub)go(cur); else go('home'); return; }
  if((v=el.getAttribute('data-go'))){ var p2=v.split('/'); return go(p2[0],p2[1]); }
  if((v=el.getAttribute('data-hard'))){ var o=st(); o.hard[v]=!o.hard[v]; save(o); return paint(); }
  if(el.getAttribute('data-clr')){ var o3=st(); o3.hard={}; save(o3); return paint(); }
  if(el.getAttribute('data-print')){ printAll(); window.print(); return; }
  if((v=el.getAttribute('data-read'))){ var o2=st(); o2.read[v]=!o2.read[v]; save(o2); return paint(); }
  if((v=el.getAttribute('data-fs'))) return fsSet(v);
  if((v=el.getAttribute('data-tm'))) return openSheet(v,E.terms[v]);
});
document.getElementById('bk').addEventListener('click',function(){ if(sub)go(cur); else go('home'); });

function openSheet(w,m){
  document.getElementById('shw').textContent=w;
  document.getElementById('shm').innerHTML=rich(m||'');
  document.getElementById('sheet').classList.add('on');
  document.getElementById('scrim').classList.add('on');
}
function closeSheet(){
  document.getElementById('sheet').classList.remove('on');
  document.getElementById('scrim').classList.remove('on');
}
document.getElementById('shc').addEventListener('click',closeSheet);
document.getElementById('scrim').addEventListener('click',closeSheet);
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(document.getElementById('sheet').classList.contains('on'))return closeSheet();
  if(sub)go(cur); else if(cur!=='home')go('home');
});
/* 주소 뒤 이름표가 바뀌면 따라갑니다 — 뒤로 가기가 이걸로 돕니다 */
window.addEventListener('hashchange',function(){
  var h=(location.hash||'').replace('#','').split('/');
  var k=h[0]||'home', s2=h[1]||'';
  if(k===cur&&s2===sub)return;
  if(k!=='home'&&!CH.some(function(c){return c.k===k;}))return;
  cur=k; sub=s2; paint();
});

/* 글자 크기 — 이 기기에만 남습니다 */
function fsGet(){return st().fs||'m';}
function fsSet(v){var o=st();o.fs=v;save(o);fsApply();}
function fsApply(){
  var v=fsGet();
  document.documentElement.setAttribute('data-fs',v==='m'?'':v);
  var bs=document.querySelectorAll('.fsb');
  for(var i=0;i<bs.length;i++) bs[i].classList.toggle('on',bs[i].getAttribute('data-fs')===v);
}

/* ══ 인쇄 — 종이는 처음부터 끝까지 읽는 물건입니다 ══ */
function printAll(){
  PRINTING=true;
  var save2=[cur,sub], all=vHome();
  CH.forEach(function(c){
    cur=c.k; sub='';
    all+='<div class="ch"><h2 class="head">'+esc(c.t)+'</h2></div>'+((V[c.k]||function(){return '';})());
    if(c.k==='mast'){ M.cards.forEach(function(x){ sub=x.n; all+='<div class="ch"></div>'+cardView(x.n); }); sub=''; }
    if(c.k==='ment'){ M.cards.filter(function(x){return x.say;}).forEach(function(x){ sub=x.n; all+=mentView(x.n); }); sub=''; }
  });
  cur=save2[0]; sub=save2[1];
  document.getElementById('pane').innerHTML=all;
}
window.addEventListener('beforeprint',function(){ if(!PRINTING) printAll(); });
window.addEventListener('afterprint',function(){ PRINTING=false; paint(); });

fsApply();
paint();
})();
