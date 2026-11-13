/* ══ 보장 전·후 「🙂 심플 — 질문으로 보기」 (판 X429) ══════════════════════
   사장님 말씀 「정말 어른들에게 확 와닿고 보기쉽게 설명하고 질문 -> 설명 이런 느낌으로
   심플 버전도」 · 「핵심 담보에 대한 설명과 새로운 담보가 왜 필요한지 간단한 설명칸도!
   질문하고? 그 설명하고 필요하게끔 느끼도록」 · 「좋아 crm에 심플버전으로 만들어줘」.

   한 장 = ① 질문(어두운 화면 가득) → ② 📘 쉽게 말하면(담보 설명 + 그림) → ③ 💡 그래서 필요합니다.
   장은 <b>손으로 고르지 않는다</b> — calc()/diff() 의 <b>새로 생기거나 늘어나는 담보</b>만 장이 된다.
   없는 담보로 장을 세우지 않는다 (CLAUDE.md 1번).

   숫자는 전부 이 화면이 이미 쓰는 것에서만 온다 —
     보험료 premCalc() · 사건별 채움 evCalc() · 담보 설명 DESC · 순위 rankProps().
   통계 둘은 ba-report.html SRC(hira_brain · hira_heart) 그대로 · 출처를 그 장 아래에 적는다.

   ba.html 에는 <b>단추 한 개 + script 한 줄</b>만 — 나머지는 이 파일 안에서 (공유 저장소 원칙).
   이름은 전부 baq* · CSS 는 #baqBox 안에만. */

var BAQ={on:false,pres:false,cur:0};
/* ba-report.html SRC 의 두 줄 — 그대로 옮김(새 숫자 아님) */
var BAQ_SRC={
  brain:'<출처 : 건강보험심사평가원_뇌혈관질환(I60~I69) 117만 1,534명 · 뇌졸중(I60~I64) 63만 4,177명 진료인원_2022년 (코메디닷컴 2023-09-16)>',
  heart:'<출처 : 건강보험심사평가원_허혈성 심장질환 진료인원 구성 — 협심증 68.4% · 만성 허혈 20.5% · 급성심근경색 10.2%_2011~2015년 심사자료 (토요경제 2016-09-28)>'
};
var BAQ_TX=['target','immuno','cantx','cantxN','antican','anticanD','proton','radIM','robotS','canSurg','canLiv'];
var BAQ_SURG=['brainS','heartOp','circS','stent','brainTx','heartTx','cvTx'];
var BAQ_CARE=['nurUD','ltcF','ltcD','dem2','nurNS'];
var BAQ_BRAIN_ANY=['brain','circD','stroke','brainh','braini'];
var BAQ_HEART_ANY=['heartA','heart','mi','circD','heartW'];

/* ── 돈 — 받는 값은 전부 <b>만원</b> (CLAUDE.md 4번 · 이름이 Won 으로 끝난다) ── */
/* 어르신은 「117,500원」 보다 「11만 7,500원」 을 더 빨리 읽는다 */
function baqMonWon(v){
  var w=Math.round((+v||0)*10000),neg=w<0;w=Math.abs(w);
  if(!w)return '0원';
  var m=Math.floor(w/10000),r=w%10000;
  return (neg?'-':'')+(m?m.toLocaleString()+'만':'')+(r?(m?' ':'')+r.toLocaleString():'')+'원';
}
function baqWon(v){
  v=+v||0;if(!v)return '0원';
  if(v%1)return baqMonWon(v);
  var neg=v<0;v=Math.abs(v);
  var e=Math.floor(v/10000),r=Math.round(v%10000);
  return (neg?'-':'')+(e?e+'억':'')+(r?(e?' ':'')+r.toLocaleString()+'만':'')+'원';
}
function baqAmt(k,v){var u=UNIT[k];return (u==='D'?'하루 ':u==='M'?'매달 ':u==='A'?'한도 ':'')+baqWon(v);}
/* 받침이 있으면 은 · 이 · 을, 없으면 는 · 가 · 를 */
function baqJosa(w,a,b){var c=(''+w).replace(/[^가-힣]+$/,'');c=c.charCodeAt(c.length-1);
  return w+((c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28)?a:b);}
function baqTxt(h){return (''+h).replace(/<[^>]+>/g,'');}
function baqHas(t,keys){for(var i=0;i<keys.length;i++)if((t[keys[i]]||0)>0)return keys[i];return null;}
/* 담보 설명(DESC)의 첫 문장만 — 짧게 */
function baqFirst(d){d=''+(d||'');var i=d.search(/\.(\s|$)/);return i>=0?d.slice(0,i+1):d;}
/* 「뇌졸중 진단」 → 「뇌졸중 진단비」 · 이미 「…비」 면 그대로 */
function baqNm(k){var s=SNAME[k]||'';return /진단$/.test(s)?s+'비':s;}

/* 컵 = 병원비, 물 = 보험에서 나오는 돈. 모자란 만큼은 빨간 점선, 넘치면 흘러넘친다 */
function baqCup(rate,w,h){
  w=w||170;h=h||230;var r=Math.max(0,rate||0),fill=Math.min(1,r/100),top=18,bot=h-8;
  var lvl=bot-(bot-top)*fill,ov=r>100,col=r>=100?'#3182f6':'#ff8a00';
  var path='M15 '+top+' L25 '+bot+' Q25 '+(bot+6)+' 33 '+(bot+6)+' L'+(w-33)+' '+(bot+6)+' Q'+(w-25)+' '+(bot+6)+' '+(w-25)+' '+bot+' L'+(w-15)+' '+top;
  var x0=15+(lvl-top)/(bot-top)*10,x1=w-15-(lvl-top)/(bot-top)*10;
  var water=fill>0?'<path d="M'+x0+' '+lvl+' L25 '+bot+' Q25 '+(bot+6)+' 33 '+(bot+6)+' L'+(w-33)+' '+(bot+6)+' Q'+(w-25)+' '+(bot+6)+' '+(w-25)+' '+bot+' L'+x1+' '+lvl+' Z" fill="'+col+'" opacity=".9"/>':'';
  var gap=(r<100)?'<rect x="'+(x0+4)+'" y="'+(top+4)+'" width="'+(x1-x0-8)+'" height="'+Math.max(0,lvl-top-8)+'" fill="#ffeeee" stroke="#f04452" stroke-width="3" stroke-dasharray="10 8" rx="6"/>':'';
  var spill=ov?'<path d="M15 '+top+' q-8 30 -2 60" stroke="#3182f6" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M'+(w-15)+' '+top+' q8 30 2 60" stroke="#3182f6" stroke-width="7" fill="none" stroke-linecap="round"/>':'';
  return '<svg width="'+w+'" height="'+(h+8)+'" viewBox="-6 0 '+(w+12)+' '+(h+8)+'" aria-hidden="true">'+gap+water+'<path d="'+path+'" fill="none" stroke="#4e5968" stroke-width="5" stroke-linejoin="round"/>'+spill+'</svg>';
}
/* 「지금 → 넣으면」 막대 둘 — 병원비 기준값이 없을 때의 그림 */
function baqBars(b,a,k){
  var mx=Math.max(b,a,1);
  function bar(v,t,c){return '<div class="bq-br"><span>'+t+'</span><i style="width:'+Math.max(2,Math.round(v/mx*100))+'%;background:'+c+'"></i><b>'+baqAmt(k,v)+'</b></div>';}
  return '<div style="width:100%">'+bar(b,'지금','#ff8a00')+bar(a,'바꾼 뒤','#3182f6')+'</div>';
}
/* 뇌 — 큰 원(뇌혈관질환 117만) 안의 작은 원(뇌졸중 63만). mode: stroke · part · none */
function baqBrainSvg(mode){
  var bA=117,bS=63,rS=Math.round(150*Math.sqrt(bS/bA)),cx=210-150+rS+14,cy=175+150-rS-14;
  var inFill=mode==='stroke'?'#ff8a00':'#c5ccd6';
  var s='<svg width="600" height="350" viewBox="0 0 600 350" aria-hidden="true"><circle cx="210" cy="175" r="150" fill="#ffeeee" stroke="#f04452" stroke-width="4" stroke-dasharray="12 9"/>'+
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+rS+'" fill="'+inFill+'"/>'+
    '<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="30" font-weight="800" fill="#fff">뇌졸중</text>'+
    '<text x="'+cx+'" y="'+(cy+32)+'" text-anchor="middle" font-size="26" font-weight="700" fill="#fff">'+bS+'만 명</text>';
  if(mode==='stroke')s+='<line x1="300" y1="95" x2="380" y2="70" stroke="#f04452" stroke-width="3"/><text x="388" y="62" font-size="26" font-weight="800" fill="#f04452">그 밖의 뇌혈관 병</text><text x="388" y="96" font-size="26" font-weight="800" fill="#f04452">'+(bA-bS)+'만 명 → 지금 0원</text>';
  else if(mode==='part')s+='<circle cx="'+(cx+22)+'" cy="'+(cy-30)+'" r="16" fill="#ff8a00" stroke="#fff" stroke-width="3"/><line x1="'+(cx+38)+'" y1="'+(cy-36)+'" x2="380" y2="70" stroke="#ff8a00" stroke-width="3"/><text x="388" y="62" font-size="26" font-weight="800" fill="#c2410c">지금 보험은</text><text x="388" y="96" font-size="26" font-weight="800" fill="#c2410c">이 안의 일부만</text>';
  else s+='<line x1="300" y1="95" x2="380" y2="70" stroke="#f04452" stroke-width="3"/><text x="388" y="62" font-size="26" font-weight="800" fill="#f04452">뇌혈관 병 전부</text><text x="388" y="96" font-size="26" font-weight="800" fill="#f04452">→ 지금 0원</text>';
  return s+'<line x1="340" y1="250" x2="390" y2="270" stroke="#4e5968" stroke-width="3"/><text x="398" y="268" font-size="24" font-weight="700" fill="#4e5968">뇌혈관질환 전체</text><text x="398" y="298" font-size="24" fill="#4e5968">'+bA+'만 명</text></svg>';
}
/* 심장 — 허혈성 심장병 10명: 협심증 약 7 · 만성 허혈 약 2 · 급성심근경색 약 1 (68.4 · 20.5 · 10.2%) */
function baqHeartBlk(mode){
  var h='<div class="bq-blk">',i;for(i=0;i<7;i++)h+='<i></i>';h+='<i class="m"></i><i class="m"></i><i class="k'+(mode==='mi'?'':' z')+'"></i></div>';
  h+='<div class="bq-lg"><i style="background:#ffb057"></i>협심증 <b>약 7명</b><i style="background:#c5ccd6"></i>만성 허혈 <b>약 2명</b><i style="background:#3182f6"></i>급성심근경색 <b>약 1명</b></div>';
  return '<div>'+h+'<div class="bq-vt">'+(mode==='mi'?'지금 보험은 <span class="b">파란 1명</span>일 때만 나옵니다':'지금 보험은 <span class="r">어느 경우에도 0원</span>입니다')+'</div></div>';
}
/* 설명 칸 글씨 — 글이 길면 줄인다(넘치지 않게) */
function baqExFs(t){var n=baqTxt(t).length;return n<=58?33:n<=85?29:n<=115?26:23;}

/* ══ 장 만들기 — 고객 자료에서 ══════════════════════════════════════ */
function baqBuild(){
  var C=calc(),D=diff(C),P=premCalc(),G={},Bf=C.b,i,k;
  D.gain.forEach(function(g){G[g.k]=g;});
  var who=S.who&&S.who.name?esc(S.who.name)+' 님':'고객님';
  var E={};EVENTS.forEach(function(ev){E[ev.k]=evCalc(ev,C);E[ev.k].t=ev.t;});
  var used={},cards=[];
  function bb(k){return Bf[k]||0;}
  function aa(k){return C.a[k]||0;}
  function use(keys){keys.forEach(function(x){used[x]=1;});}
  function rateOk(e){return e&&e.cost>0;}

  /* 1 암 진단비 */
  var kc=G.cancer?'cancer':(G.cancerI?'cancerI':null);
  if(kc){
    var ec=E.cancer,b0=bb(kc),vis;
    if(rateOk(ec)&&ec.gapB>0)vis='<div class="bq-row"><div class="bq-cupw">'+baqCup(ec.rateB,170,250)+'<div class="cl">지금</div></div><div><div class="bq-s1">병원비 '+baqWon(ec.cost)+' 중</div><div class="bq-xl r">'+baqWon(ec.gapB)+'</div><div class="bq-s2">내 돈으로 내야 합니다</div></div></div>';
    else vis=baqBars(b0,aa(kc),kc);
    use([kc]);
    cards.push({ql:'암 진단비, 충분할까요?',
      q:b0>0?'<em>암</em> 진단비 '+baqWon(b0)+',<br>충분할까요?':'<em>암</em>에 걸리면,<br>진단비가 나올까요?',
      qh:b0>0?'암에 걸리면 병원비가 얼마나 들지 떠올려 보세요':'지금 '+who+' 보험엔 암 진단비가 없습니다',
      nm:kc==='cancer'?'암 진단비':baqNm(kc),ex:DESC[kc]||DESC.cancer,vis:vis,
      why:b0>0?'빈 컵만큼은 <b>모아 두신 돈이나 자녀</b>에게서 나갑니다':'지금은 암 진단을 받아도 <b>목돈이 나오지 않습니다</b>',
      now:baqWon(b0),aft:baqWon(aa(kc)),
      ft:(rateOk(ec)?'병원비 '+baqWon(ec.cost)+'는 상담에서 정한 기준값이며 실제와 다를 수 있습니다 · ':'')+'실제 지급은 약관과 보험사 심사에 따릅니다',
      talk:'병원비를 <b>컵</b>이라고 하면 보험은 <b>물</b>이에요. 빈 만큼은 <b>모아 두신 돈</b>에서 나가요.',
      sum:'암 — 진단비 <span class="b">'+baqWon(aa(kc))+'</span>'});
  }
  /* 2 암 치료비 */
  var tx=BAQ_TX.filter(function(x){return G[x];});
  if(tx.length){
    var hot={};EVENTS[0].sim.forEach(function(st,j){tx.forEach(function(x){if(st.pay.indexOf(x)>=0)hot[j]=1;});});
    var sims=EVENTS[0].sim,strip='<div class="bq-stg">'+sims.map(function(st,j){return '<div class="'+(hot[j]?'hot':'')+'"><i>'+st.ic+'</i><b>'+esc(st.k)+'</b><span>'+esc(st.dur)+'</span></div>';}).join('')+'</div>';
    var hk=null;for(i=sims.length-1;i>=0;i--)if(hot[i])hk=sims[i];
    var lead=G.target?'target':G.immuno?'immuno':tx[0];
    use(tx);
    cards.push({ql:'암 치료, 한 번으로 끝날까요?',
      q:'<em>암 치료</em>, 진단받는 날<br>한 번으로 끝날까요?',
      qh:bb('cancer')>0?'지금 '+who+' 보험엔 「암 진단비 '+baqWon(bb('cancer'))+'」가 있습니다':'진단비 한 번 받으면 끝일까요?',
      nm:'암 치료비',ex:'치료는 <b>몇 달에서 5년</b>까지 갑니다. '+baqFirst(DESC[lead]),
      vis:'<div style="width:100%">'+strip+(hk?'<div class="bq-vt">새로 넣는 치료비는 <span class="r">'+hk.ic+' '+esc(hk.k)+'</span> 때 나옵니다</div>':'')+
        '<div class="bq-vs">'+(bb('cancer')>0?'지금 보험은 <b class="r">진단 때 한 번</b>만 나옵니다':'지금 보험엔 <b class="r">치료비 담보가 없습니다</b>')+'</div></div>',
      why:'진단비는 <b>한 번</b>,<br>치료비는 <b>치료받을 때</b>',
      multi:tx.slice(0,3).map(function(x){return [SNAME[x],(bb(x)?baqWon(bb(x)).replace(/원$/,''):'0')+' → '+baqAmt(x,aa(x))];}),
      ft:'치료 기간은 일반적 경과 예시입니다 · 치료비는 담보마다 지급 횟수 · 범위가 다르며 실제 지급은 약관과 보험사 심사에 따릅니다',
      talk:'요즘 암은 <b>진단보다 치료가 깁니다.</b> 진단비만 있으면 <b>제일 비싼 구간</b>을 맨몸으로 지나가셔야 해요.',
      sum:'암 치료 — <span class="b">치료받을 때</span> 따로'});
  }
  /* 3 뇌 — 넓은 이름 */
  var kb=G.brain?'brain':(G.circD?'circD':null);
  if(kb&&!bb('brain')&&!bb('circD')){
    var mode=bb('stroke')>0?'stroke':(bb('brainh')>0||bb('braini')>0)?'part':'none';
    var narrow=mode==='stroke'?'stroke':bb('brainh')>0?'brainh':'braini';
    use([kb]);
    cards.push({ql:'뇌 병이면 다 나올까요?',
      q:mode==='none'?'<em>뇌</em>에 병이 오면,<br>지금 보험에서 나올까요?':'<em>'+SNAME[narrow].replace(/\s*진단$/,'')+'</em> 진단비가 있으면,<br>뇌에 무슨 병이 와도 나올까요?',
      qh:mode==='none'?'지금 '+who+' 보험엔 뇌 진단비가 없습니다':'지금 '+who+' 보험엔 「'+baqNm(narrow)+' '+baqWon(bb(narrow))+'」가 있습니다',
      nm:baqNm(kb),
      ex:mode==='none'?DESC[kb]:(mode==='stroke'?'뇌졸중은 <b>뇌출혈 · 뇌경색만</b> 봅니다.':baqJosa('<b>'+SNAME[narrow].replace(/\s*진단$/,'')+'</b>','은','는')+' '+baqFirst(DESC[narrow]))+' '+(kb==='brain'?'뇌혈관질환은 뇌에 생기는 병 <b>전부</b>를 보는 <b>가장 넓은 이름</b>입니다.':baqFirst(DESC.circD)),
      vis:baqBrainSvg(mode),
      why:mode==='stroke'?'뇌 병으로 병원 간 117만 명 중<br><b>54만 명</b>은 뇌졸중 진단비를 못 받습니다':
          mode==='part'?'뇌 병으로 병원 간 117만 명 중<br>지금 보험이 열리는 건 <b>일부</b>뿐입니다':'뇌 병으로 병원 간 사람 한 해 117만 명<br>지금 보험으론 <b>누구여도 0원</b>입니다',
      now:'0원',aft:baqWon(aa(kb)),
      ft:esc(BAQ_SRC.brain)+' · 진단비 범위는 상품 약관의 질병코드 표를 따릅니다',
      talk:'이름은 비슷해도 <b>그물 크기</b>가 달라요. 좁은 그물로는 <b>빠져나가는 병</b>이 많습니다.',
      sum:'뇌 — <span class="b">넓은 이름</span>('+SNAME[kb].replace(/\s*진단(비)?$/,'')+')으로'});
  }
  /* 4 심장 — 넓은 이름 */
  var kh=G.heart?'heart':G.heartA?'heartA':(G.circD&&!used.circD?'circD':null);
  if(kh&&!bb('heart')&&!bb('heartA')&&!bb('circD')){
    var hm=bb('mi')>0?'mi':'none';
    use([kh]);
    cards.push({ql:'심장 병이면 다 나올까요?',
      q:hm==='mi'?'<em>심근경색</em> 진단비가 있으면,<br>협심증일 때도 나올까요?':'<em>심장</em>에 병이 오면,<br>지금 보험에서 나올까요?',
      qh:hm==='mi'?'지금 '+who+' 보험엔 「급성심근경색 진단비 '+baqWon(bb('mi'))+'」가 있습니다':'지금 '+who+' 보험엔 심장 진단비가 없습니다',
      nm:baqNm(kh),
      ex:(hm==='mi'?'급성심근경색은 혈관이 <b>완전히 막힌 경우만</b> 봅니다. ':'')+baqFirst(DESC[kh]).replace(/\(협심증·심근경색\)/,'(<b>협심증</b> · 심근경색)'),
      vis:baqHeartBlk(hm),
      why:hm==='mi'?'허혈성 심장병 10명 중 <b>약 9명</b>은<br>심근경색 진단비를 못 받습니다':'허혈성 심장병 10명 모두<br>지금 보험으론 <b>0원</b>입니다',
      now:'0원',aft:baqWon(aa(kh)),
      ft:esc(BAQ_SRC.heart)+' · 진단비 범위는 상품 약관의 질병코드 표를 따릅니다',
      talk:hm==='mi'?'심근경색 진단비 <b>'+baqWon(bb('mi'))+'</b>, 큰돈 같지만 <b>10명 중 1명</b>에게만 열리는 문이에요.':'심장은 <b>협심증</b>이 제일 흔해요. 그 문부터 열어 두셔야 합니다.',
      sum:'심장 — <span class="b">협심증까지</span> 보는 이름으로'});
  }
  /* 5 뇌 · 심장 수술 · 치료비 */
  var sg=BAQ_SURG.filter(function(x){return G[x];});
  if(sg.length){
    var dx=baqHas(Bf,BAQ_BRAIN_ANY.concat(BAQ_HEART_ANY));
    use(sg);
    cards.push({ql:'수술비는 따로 나올까요?',
      q:'진단비 받으면,<br><em>수술비</em>는 따로 나올까요?',qh:'뇌 · 심장은 진단 다음에 바로 시술 · 수술이 옵니다',
      nm:'뇌 · 심장 수술 · 치료비',
      ex:'진단비는 <b>진단받을 때</b>, 수술비는 <b>수술 · 시술받을 때</b> 따로 나옵니다 — 한 번 아플 때 <b>지갑이 둘</b>입니다.',
      vis:'<div class="bq-vsx"><div class="'+(dx?'ok':'no')+'"><b>진단받으면</b><i>'+(dx?'✓':'✕')+'</i><span>'+(dx?'지금도 나옵니다':'지금은 0원')+'</span></div><div class="no"><b>수술하면</b><i>✕</i><span>지금은 0원</span></div></div>',
      why:'쓰러진 뒤 <b>바로</b> 하는 치료라<br>진단비만으론 모자랍니다',
      multi:sg.slice(0,3).map(function(x){return [SNAME[x],(bb(x)?baqWon(bb(x)).replace(/원$/,''):'0')+' → '+baqAmt(x,aa(x))];}),
      talk:'진단비는 <b>입구</b>, 수술비는 <b>그다음 문</b>이에요.',
      sum:'뇌 · 심장 — <span class="b">수술비</span> 따로'});
  }
  /* 6 간병 · 요양 */
  var cr=BAQ_CARE.filter(function(x){return G[x];});
  if(cr.length){
    var ek=E.care,none=!baqHas(Bf,BAQ_CARE),vc;
    var PH={nurUD:'간병인을 <b>실제로 쓴 날</b> 나옵니다.',ltcF:'장기요양 등급을 받으면 <b>매달</b> 나옵니다.',ltcD:'장기요양 등급을 받으면 <b>목돈</b>이 한 번 나옵니다.',
            dem2:'중증치매로 진단되면 <b>목돈</b>이 나옵니다.',nurNS:'간호 · 간병 통합 병동에 입원한 <b>날마다</b> 나옵니다.'};
    if(rateOk(ek))vc='<div class="bq-row"><div class="bq-cupw">'+baqCup(ek.rateB,170,250)+'<div class="cl">지금</div></div><div>'+
      (ek.totB>0?'<div class="bq-s1">돌봄 비용 '+baqWon(ek.cost)+' 중</div><div class="bq-xl r">'+baqWon(ek.gapB)+'</div><div class="bq-s2">가족이 냅니다</div>':
        '<div class="bq-xl r" style="font-size:92px">0원</div><div class="bq-s2">돌봄 비용 '+baqWon(ek.cost)+'를<br><span class="r">전부 가족이</span> 냅니다</div>')+'</div></div>';
    else vc=baqBars(bb(cr[0]),aa(cr[0]),cr[0]);
    use(cr);
    cards.push({ql:'누가 돌봐 드려야 할 때는요?',
      q:'나중에 <em>누가 돌봐 드려야</em><br>할 때는요?',qh:'자녀분들이 일을 쉬고 돌봐 드릴 수 있을까요?',
      nm:'간병 · 요양',ex:cr.slice(0,2).map(function(x){return PH[x];}).join(' ')+(G.ltcF?' 끝나는 날이 정해져 있지 않은 보장입니다.':''),
      vis:vc,
      why:none?'지금 보험으로는<br><b>한 푼도</b> 안 나옵니다':'지금 보험으로는<br><b>모자랍니다</b>',
      multi:cr.slice(0,3).map(function(x){return [SNAME[x],baqAmt(x,aa(x))];}),
      ft:(rateOk(ek)?'돌봄 비용 '+baqWon(ek.cost)+'는 상담에서 정한 기준값이며 실제와 다를 수 있습니다 · ':'')+'장기요양은 공단 등급판정이 있어야 나옵니다 · 실제 지급은 약관과 보험사 심사에 따릅니다',
      talk:'많이들 놓치시는 곳이에요. <b>치료비보다 돌봄비</b>가 오래 갑니다.',
      sum:'간병 · 요양 — '+(none?'<span class="b">처음</span> 생김':'<span class="b">늘어남</span>')});
  }
  /* 그 밖에 늘어나는 것 · 줄어드는 것 — 표준 순서로 (조용히 빼지 않는다) */
  var ORD={},n=0;STD.forEach(function(g){g.rows.forEach(function(r){ORD[r.k]=n++;});});
  var rest=D.gain.filter(function(g){return !used[g.k];}).sort(function(x,y){return (ORD[x.k]||0)-(ORD[y.k]||0);});
  var loss=D.loss.slice().sort(function(x,y){return (ORD[x.k]||0)-(ORD[y.k]||0);});
  return {who:who,C:C,P:P,E:E,cards:cards,rest:rest,loss:loss,nB:(S.before||[]).length,
    cancel:(S.before||[]).some(function(p){return p.act==='cancel';})};
}

/* ── 장 그리기 ───────────────────────────────────────────────── */
function baqQc(n,NQ,qt,qh,extra){return '<div class="bq-qc">'+(n?'<div class="ey">질문 '+n+' / '+NQ+'</div>':'')+'<div class="qt">'+qt+'</div>'+(qh?'<div class="qh">'+qh+'</div>':'')+(extra||'')+'</div>';}
function baqHead(n,NQ,qt){var h='<div class="bq-hd">'+(n?'<span class="n">질문 '+n+'</span>':'')+'<span class="t">'+qt.replace(/<br>/g,' ')+'</span></div>';
  if(n){h+='<div class="bq-dots">';for(var i=1;i<=NQ;i++)h+='<i class="'+(i<=n?'on':'')+'"></i>';h+='</div>';}return h;}
function baqList(rows,lossy){
  return '<div class="bq-ls">'+rows.slice(0,4).map(function(g){
    return '<div><div class="a"><b>'+esc(SNAME[g.k])+'</b><span class="'+(lossy?'r':'b')+'">'+(g.b?baqAmt(g.k,g.b):'0원')+' → '+(g.a?baqAmt(g.k,g.a):'0원')+'</span></div>'+
      (DESC[g.k]?'<div class="d">'+baqFirst(DESC[g.k])+'</div>':'')+'</div>';}).join('')+
    (rows.length>4?'<div class="more">외 '+(rows.length-4)+'가지 — 「🔍 전체 담보 비교」 에서 보실 수 있습니다</div>':'')+'</div>';
}
function baqHtml(){
  var M=baqBuild(),SL=[],P=M.P,E=M.E,qi=0;
  var hasMon=P.monB!==null&&P.monB>0;
  var NQ=M.cards.length+(hasMon?1:0);
  var tk=function(t){return '<div class="bq-tk">🗣 '+t+'</div>';};
  var ftDef='실제 지급은 약관과 보험사 심사에 따릅니다';
  function qa(o){var n=o.noQ?0:++qi;
    SL.push('<section class="bq-sl s2" data-n="2">'+baqQc(n,NQ,o.q,o.qh,o.extra)+baqHead(n,NQ,o.q)+
      '<div class="bq-ans">'+o.ans+'</div><div class="bq-ft">'+(o.ft||ftDef)+'</div>'+tk(o.talk)+'</section>');}
  function card(o){var n=++qi;
    var nb=o.multi?'<div class="nb multi'+(o.multi.length>2?' m3':'')+'">'+o.multi.map(function(m){return '<div class="aft"><span>'+esc(m[0])+'</span><b>'+m[1]+'</b></div>';}).join('')+'</div>':
      '<div class="nb"><div class="now"><span>지금</span><b>'+o.now+'</b></div><div class="ar">→</div><div class="aft"><span>넣으면</span><b>'+o.aft+'</b></div></div>';
    SL.push('<section class="bq-sl s3" data-n="3">'+baqQc(n,NQ,o.q,o.qh)+baqHead(n,NQ,o.q)+
      '<div class="bq-mid"><div class="ex"><div class="h">📘 쉽게 말하면</div><div class="t" style="font-size:'+baqExFs(o.ex)+'px">'+o.ex+'</div></div><div class="vis">'+o.vis+'</div></div>'+
      '<div class="bq-need"><div class="l"><div class="h">💡 그래서 필요합니다 — '+esc(o.nm)+'</div><div class="w">'+o.why+'</div></div>'+nb+'</div>'+
      '<div class="bq-ft">'+(o.ft||'담보 금액은 상품마다 다르며 '+ftDef)+'</div>'+tk(o.talk)+'</section>');}

  if(!M.cards.length&&!M.rest.length){
    return '<section class="bq-sl s1" data-n="1"><div class="bq-qc"><div class="ey">APEX 사업단 · 보장 점검</div><div class="qt" style="font-size:60px">새로 생기는 보장이<br><em>아직 없습니다</em></div>'+
      '<div class="qh">③ 추가 보험에 제안을 넣거나, ② 지금 보험에서 해지 · 배서를 적으시면<br>늘어나는 담보만 골라 질문 장을 만들어 드립니다</div></div></section>';
  }
  /* 0 표지 — 첫 마디부터 질문 */
  var qls=(hasMon?['한 달에 얼마 내고 계실까요?']:[]).concat(M.cards.map(function(c){return c.ql;}));
  SL.push('<section class="bq-sl s1" data-n="1"><div class="bq-qc"><div class="ey">APEX 사업단 · '+M.who+' 보장 점검</div>'+
    '<div class="qt" style="font-size:68px">보험 이름만 보면 다 들어 있습니다.<br><em>그런데, 정말 나올까요?</em></div>'+
    (qls.length?'<div class="bq-ql">'+qls.slice(0,8).map(function(t,i){return '<div><b>'+(i+1)+'</b>'+t+'</div>';}).join('')+'</div>':'')+'</div>'+
    tk('어려운 보험 말은 빼고 <b>질문 '+NQ+'개</b>만 여쭤볼게요. 맞히셔도 틀리셔도 괜찮습니다.')+'</section>');
  /* 1 보험료 */
  if(hasMon)qa({q:'지금 보험료,<br><em>한 달에 얼마</em> 내고 계실까요?',qh:'짐작해 보셔도 좋습니다',
    extra:'<div class="bq-gs"><span>5만원쯤</span><span>10만원쯤</span><span>15만원쯤</span><span>잘 모르겠다</span></div>',
    ans:'<div style="margin-top:60px" class="bq-say">지금 들고 계신 보험 <b>'+M.nB+'개</b>, 다 합치면</div><div class="bq-big">매달 <span class="b">'+baqMonWon(P.monB)+'</span></div>'+
      '<div class="bq-say" style="margin-top:14px">1년이면 <b>'+baqMonWon(P.monB*12)+'</b> — <b>이 돈이 제 일을 하고 있는지</b> 같이 보겠습니다</div>',
    ft:'보험료는 적어 두신 계약 기준입니다',
    talk:'정확히 아시는 분이 거의 없어요. <b>맞히셨어요?</b> 이만큼 내시는데, 정작 필요할 때 나오는지가 중요하죠.'});
  M.cards.forEach(card);
  /* 그 밖에 · 줄어드는 것 */
  if(M.rest.length)qa({noQ:1,q:'그 밖에 <em>새로 생기거나<br>늘어나는</em> 보장입니다',
    ans:baqList(M.rest,false),ft:'담보 금액은 상품마다 다르며 '+ftDef,talk:'나머지는 <b>짧게</b> 짚고 넘어갈게요. 궁금하신 것만 말씀해 주세요.'});
  if(M.loss.length)qa({noQ:1,q:'반대로, <em>줄어드는 것</em>도<br>있습니다',
    ans:baqList(M.loss,true),ft:'해지 · 배서로 줄어드는 담보입니다 · '+ftDef,talk:'<b>좋은 것만</b> 말씀드리지 않을게요. 줄어드는 것도 같이 보셔야 합니다.'});
  /* 바꾼 뒤 */
  var evs=EVENTS.filter(function(ev){return E[ev.k].cost>0;}),worst=null;
  evs.forEach(function(ev){var e=E[ev.k];if(e.gapA>0&&(!worst||e.gapA>worst.gapA))worst=e;});
  var R=[];try{R=rankProps().slice(0,3);}catch(err){R=[];}
  if(evs.length||R.length)qa({noQ:1,q:'그럼, <em>바꾸고 나면</em><br>어떻게 될까요?',
    ans:'<div class="bq-row" style="gap:44px;align-items:flex-start;margin-top:40px">'+
      (evs.length?'<div class="bq-row" style="gap:20px">'+evs.map(function(ev){var e=E[ev.k];
        return '<div class="bq-cupw">'+baqCup(e.rateA,120,180)+'<div class="cl">'+esc(ev.t)+'</div><div style="margin-top:6px"><span class="bq-tag '+(e.gapA>0?'r':'b')+'">'+(e.gapA>0?baqWon(e.gapA)+' 모자람':'채워집니다')+'</span></div></div>';}).join('')+'</div>':'')+
      '<div style="flex:1;min-width:0">'+(R.length?'<div class="bq-say" style="font-size:26px;margin-bottom:12px">이렇게 넣습니다</div><div class="bq-pick">'+
        R.map(function(x){return '<div><b>'+x.rank+'번</b><em>'+esc(x.p.nm||'제안')+'</em>'+(x.prem>0?'<span>월 '+baqMonWon(x.prem)+'</span>':'')+'</div>';}).join('')+'</div>':'')+
      '<div class="bq-say" style="font-size:26px;margin-top:16px">'+(worst?baqJosa(esc(worst.t),'은','는')+' 아직 <b class="r">'+baqWon(worst.gapA)+'</b> 모자랍니다 — <b>다음에 같이</b> 보시죠':'기준으로 잡은 병원비만큼 <b class="b">모두 찹니다</b>')+'</div></div></div>',
    ft:evs.length?'병원비는 상담에서 정한 기준값이며 실제와 다를 수 있습니다 · '+ftDef:ftDef,
    talk:worst?'채워지는 곳과 <b>아직 덜 찬 곳</b>을 같이 보여 드릴게요 — <b>좋은 것만</b> 말씀드리지 않습니다.':'기준으로 잡은 병원비만큼은 <b>다 찹니다.</b>'});
  /* 얼마 더 */
  var d=P.monD;
  if(d!==null){
    var day=Math.round(Math.abs(d)*10000/30/100)/100;
    qa({noQ:1,q:'그래서 <em>한 달에 얼마</em><br>'+(d>=0?'더 드나요?':'달라지나요?'),
      ans:'<div class="bq-mon" style="margin-top:70px"><div class="box"><span>지금</span><b>'+baqMonWon(P.monB)+'</b></div><div class="arr">→</div><div class="box on"><span>바꾼 뒤</span><b class="b">'+baqMonWon(P.monA)+'</b></div></div>'+
        '<div class="bq-say" style="margin-top:40px;font-size:40px">'+(d>0?'한 달에 <b class="r">'+baqMonWon(d)+'</b> 더 · 하루로 치면 약 <b>'+baqMonWon(day)+'</b>':d<0?'한 달에 <b class="b">'+baqMonWon(-d)+'</b> 덜 냅니다':'보험료는 <b>그대로</b>입니다')+'</div>',
      ft:'보험료 · 가입 여부는 보험사 심사 결과에 따라 달라질 수 있습니다'+(M.cancel?'<br>기존 보험을 해지하고 새로 가입하면 ① 질병이력 · 나이 때문에 가입이 거절되거나 보험료가 오를 수 있고 ② 새로 면책기간이 적용되는 등 보장이 제한될 수 있습니다':''),
      talk:d>0?'부담되시면 말씀해 주세요 — <b>순서를 나눠서</b> 넣어도 됩니다.':'보험료는 늘지 않으면서 <b>비어 있던 곳</b>을 채웁니다.'});
  }
  /* 정리 */
  var lines=M.cards.map(function(c){return '<div><i style="background:var(--bq-blue)">✓</i><p>'+c.sum+'</p></div>';});
  if(M.rest.length)lines.push('<div><i style="background:var(--bq-blue)">✓</i><p>그 밖에 <span class="b">'+M.rest.length+'가지</span> 새로 · 늘어남</p></div>');
  var tail=[];
  if(M.loss.length)tail.push('<div><i style="background:var(--bq-red)">!</i><p>줄어드는 것 <span class="r">'+M.loss.length+'가지</span> — 꼭 확인</p></div>');
  else if(worst)tail.push('<div><i style="background:var(--bq-red)">!</i><p>'+baqJosa(esc(worst.t),'은','는')+' 아직 <span class="r">'+baqWon(worst.gapA)+'</span> 모자람</p></div>');
  if(d!==null)tail.push('<div><i style="background:var(--bq-sub)">₩</i><p>매달 '+(d>0?'<span class="r">'+baqMonWon(d)+'</span> 더':d<0?'<span class="b">'+baqMonWon(-d)+'</span> 덜':'그대로')+'</p></div>');
  lines=lines.slice(0,Math.max(1,5-tail.length)).concat(tail);
  SL.push('<section class="bq-sl s1" data-n="1"><div class="bq-hd"><span class="t" style="font-size:54px">오늘 기억하실 것 <span class="b">'+['','한','두','세','네','다섯'][lines.length]+' 가지</span></span></div>'+
    '<div style="position:absolute;left:72px;right:72px;top:150px"><div class="bq-chk">'+lines.join('')+'</div></div>'+
    '<div class="bq-ft">실제 지급은 약관과 보험사 심사에 따르며, 보험료 · 가입 여부는 심사 결과에 따라 달라질 수 있습니다</div>'+
    tk('오늘 이야기는 이 '+['','한','두','세','네','다섯'][lines.length]+' 줄이 전부예요. <b>사진 찍어 두셔도 됩니다.</b>')+'</section>');
  /* 끝 */
  SL.push('<section class="bq-sl s1" data-n="1"><div class="bq-qc"><div class="qt">궁금하신 것,<br><em>편하게 물어보세요</em></div><div class="qh">자녀분과 같이 한 번 더 보셔도 좋습니다</div></div>'+
    tk('<b>어느 질문이 제일 마음에 걸리세요?</b> — 거기서부터 다시 보시면 됩니다.')+'</section>');
  return SL.join('');
}

/* ══ 열고 닫기 · 넘기기 ════════════════════════════════════════════ */
function baqCss(){
  if(document.getElementById('baqCss'))return;
  var st=document.createElement('style');st.id='baqCss';
  st.textContent=
'#baqBox{--bq-ink:#191f28;--bq-sub:#4e5968;--bq-mute:#6b7684;--bq-line:#e5e8eb;--bq-bg:#f2f4f6;--bq-blue:#3182f6;--bq-blueS:#e8f3ff;--bq-red:#f04452;--bq-redS:#ffeeee;'+
'position:fixed;inset:0;z-index:2147483000;background:#d9dde2;overflow:auto;color:var(--bq-ink);word-break:keep-all;font-family:"Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif}'+
'#baqBox *{box-sizing:border-box}'+
'#baqBox .bq-bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:10px;background:#fff;border-bottom:1px solid var(--bq-line);font-size:15px}'+
'#baqBox .bq-bar button{font:inherit;font-weight:700;border:1px solid var(--bq-line);background:#fff;color:var(--bq-ink);border-radius:10px;padding:10px 14px;min-height:44px;cursor:pointer}'+
'#baqBox .bq-bar button.on{background:var(--bq-blue);color:#fff;border-color:var(--bq-blue)}'+
'#baqBox .bq-bar button.go{background:var(--bq-ink);color:#fff;border-color:var(--bq-ink)}'+
'#baqBox .bq-bar .bq-x{margin-left:6px}'+
'#baqBox .bq-deck{display:flex;flex-direction:column;align-items:center;gap:22px;padding:22px 16px 60px}'+
'#baqBox .bq-fr{position:relative;flex:none;overflow:hidden;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,.08);background:#fff}'+
'#baqBox .bq-sl{position:absolute;left:0;top:0;width:1280px;height:720px;background:#fff;overflow:hidden;transform-origin:0 0}'+
'#baqBox .r{color:var(--bq-red)}#baqBox .b{color:var(--bq-blue)}'+
'#baqBox .bq-qc{position:absolute;inset:0;z-index:3;background:radial-gradient(120% 90% at 85% 20%,#1f3b73 0%,#0b1730 55%,#060d1d 100%);color:#fff;padding:0 96px;display:flex;flex-direction:column;justify-content:center;transition:opacity .5s ease,transform .5s ease}'+
'#baqBox .bq-qc:after{content:"?";position:absolute;right:60px;bottom:-90px;font-size:620px;font-weight:900;line-height:1;color:rgba(255,255,255,.06)}'+
'#baqBox .bq-qc .ey{font-size:26px;font-weight:800;color:#8fb8ff;letter-spacing:.04em;margin-bottom:26px;position:relative;z-index:1}'+
'#baqBox .bq-qc .qt{font-size:80px;font-weight:800;line-height:1.24;letter-spacing:-.025em;position:relative;z-index:1}'+
'#baqBox .bq-qc .qt em{font-style:normal;color:#ffd66b}'+
'#baqBox .bq-qc .qh{font-size:32px;color:#b9c6dc;margin-top:34px;line-height:1.45;position:relative;z-index:1}'+
'#baqBox .bq-gs{display:flex;gap:16px;margin-top:40px;position:relative;z-index:1}'+
'#baqBox .bq-gs span{font-size:30px;font-weight:700;border:2px solid rgba(255,255,255,.35);border-radius:16px;padding:16px 28px;color:#fff}'+
'#baqBox .bq-sl.s2 .bq-qc,#baqBox .bq-sl.s3 .bq-qc{opacity:0;transform:scale(1.04);pointer-events:none}'+
'#baqBox .bq-ql{display:grid;grid-template-columns:1fr 1fr;gap:14px 40px;margin-top:40px;position:relative;z-index:1}'+
'#baqBox .bq-ql div{font-size:27px;font-weight:700;color:#dbe5f5;display:flex;gap:14px;align-items:center}'+
'#baqBox .bq-ql div b{flex:none;width:44px;height:44px;border-radius:50%;background:rgba(143,184,255,.18);color:#8fb8ff;display:grid;place-items:center;font-size:21px}'+
'#baqBox .bq-hd{position:absolute;left:72px;right:200px;top:36px;display:flex;align-items:baseline;gap:16px}'+
'#baqBox .bq-hd .n{flex:none;font-size:20px;font-weight:800;color:var(--bq-blue);background:var(--bq-blueS);border-radius:999px;padding:6px 16px}'+
'#baqBox .bq-hd .t{font-size:38px;font-weight:800;letter-spacing:-.02em}'+
'#baqBox .bq-hd .t em{font-style:normal;color:var(--bq-blue)}'+
'#baqBox .bq-dots{position:absolute;top:50px;right:56px;display:flex;gap:8px}'+
'#baqBox .bq-dots i{width:12px;height:12px;border-radius:50%;background:var(--bq-line)}'+
'#baqBox .bq-dots i.on{background:var(--bq-blue)}'+
'#baqBox .bq-ft{position:absolute;left:72px;right:72px;bottom:14px;font-size:16px;color:var(--bq-mute);line-height:1.45}'+
'#baqBox .bq-mid{position:absolute;left:72px;right:72px;top:112px;height:356px;display:flex;gap:40px;align-items:stretch;transition:opacity .45s ease,transform .45s ease}'+
'#baqBox .bq-mid .ex{flex:0 0 470px;background:#fff8e6;border-radius:28px;padding:30px 34px;display:flex;flex-direction:column}'+
'#baqBox .bq-mid .ex .h{font-size:24px;font-weight:800;color:#8a6a2f;margin-bottom:14px}'+
'#baqBox .bq-mid .ex .t{line-height:1.5;font-weight:600;color:#3d3220}'+
'#baqBox .bq-mid .ex .t b{color:#c2410c;font-weight:800}'+
'#baqBox .bq-mid .vis{flex:1;min-width:0;display:flex;align-items:center;justify-content:center}'+
'#baqBox .bq-sl.s1 .bq-mid{opacity:0;transform:translateY(24px)}'+
'#baqBox .bq-need{position:absolute;left:72px;right:72px;top:480px;height:166px;border-radius:28px;background:linear-gradient(100deg,#0b1730,#1b3f86);color:#fff;display:flex;align-items:center;padding:0 32px;gap:22px;transition:opacity .45s ease,transform .45s ease}'+
'#baqBox .bq-need .l{flex:1;min-width:0}'+
'#baqBox .bq-need .l .h{font-size:23px;font-weight:800;color:#ffd66b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
'#baqBox .bq-need .l .w{font-size:28px;font-weight:600;line-height:1.4;margin-top:8px}'+
'#baqBox .bq-need .l .w b{color:#ffd66b}'+
'#baqBox .bq-need .nb{display:flex;align-items:center;gap:18px;flex:none}'+
'#baqBox .bq-need .now{text-align:center}'+
'#baqBox .bq-need .now span,#baqBox .bq-need .aft span{display:block;font-size:20px;color:#b9c6dc;font-weight:700}'+
'#baqBox .bq-need .now b{font-size:50px;font-weight:800;color:#ff8f9a;white-space:nowrap}'+
'#baqBox .bq-need .ar{font-size:52px;color:#8fb8ff}'+
'#baqBox .bq-need .aft{text-align:center;background:#fff;border-radius:22px;padding:12px 24px}'+
'#baqBox .bq-need .aft span{color:var(--bq-sub)}'+
'#baqBox .bq-need .aft b{font-size:60px;font-weight:900;color:var(--bq-blue);letter-spacing:-.02em;white-space:nowrap}'+
'#baqBox .bq-need .multi{gap:10px}'+
'#baqBox .bq-need .multi .aft{padding:10px 14px;max-width:270px}'+
'#baqBox .bq-need .multi .aft b{font-size:30px}'+
'#baqBox .bq-need .multi.m3 .aft{max-width:230px}#baqBox .bq-need .multi.m3 .aft b{font-size:26px}'+
'#baqBox .bq-sl.s1 .bq-need,#baqBox .bq-sl.s2 .bq-need{opacity:0;transform:translateY(30px)}'+
'#baqBox .bq-ans{position:absolute;left:72px;right:72px;top:116px;bottom:60px;transition:opacity .45s ease,transform .45s ease}'+
'#baqBox .bq-sl.s1 .bq-ans{opacity:0;transform:translateY(24px)}'+
'#baqBox .bq-big{font-size:120px;font-weight:900;letter-spacing:-.035em;line-height:1.05}'+
'#baqBox .bq-say{font-size:34px;line-height:1.5;color:var(--bq-sub)}#baqBox .bq-say b{color:var(--bq-ink)}#baqBox .bq-say b.r{color:var(--bq-red)}#baqBox .bq-say b.b{color:var(--bq-blue)}'+
'#baqBox .bq-tag{white-space:nowrap;display:inline-block;font-size:20px;font-weight:800;border-radius:12px;padding:6px 12px}'+
'#baqBox .bq-tag.r{background:var(--bq-redS);color:var(--bq-red)}#baqBox .bq-tag.b{background:var(--bq-blueS);color:var(--bq-blue)}'+
'#baqBox .bq-row{display:flex;gap:30px;align-items:center}'+
'#baqBox .bq-cupw{text-align:center}#baqBox .bq-cupw .cl{font-size:26px;font-weight:800;margin-top:8px}'+
'#baqBox .bq-s1{font-size:24px;color:var(--bq-sub);font-weight:700}#baqBox .bq-xl{font-size:76px;font-weight:900}#baqBox .bq-s2{font-size:28px;font-weight:700;line-height:1.4}'+
'#baqBox .bq-vt{font-size:27px;font-weight:800;margin-top:18px;text-align:center;line-height:1.35}#baqBox .bq-vs{font-size:25px;color:var(--bq-sub);font-weight:600;text-align:center;margin-top:6px}'+
'#baqBox .bq-br{display:flex;align-items:center;gap:14px;margin:18px 0}#baqBox .bq-br span{flex:0 0 96px;font-size:26px;font-weight:800;color:var(--bq-sub)}'+
'#baqBox .bq-br i{display:block;height:46px;border-radius:12px}#baqBox .bq-br b{font-size:30px;font-weight:900;white-space:nowrap}'+
'#baqBox .bq-stg{display:flex;gap:12px;width:100%}'+
'#baqBox .bq-stg div{flex:1;border-radius:20px;background:var(--bq-bg);padding:16px 8px;text-align:center}'+
'#baqBox .bq-stg div i{display:block;font-style:normal;font-size:40px}'+
'#baqBox .bq-stg div b{display:block;font-size:22px;margin-top:6px}'+
'#baqBox .bq-stg div span{display:block;font-size:20px;color:var(--bq-sub);margin-top:4px}'+
'#baqBox .bq-stg div.hot{background:var(--bq-redS);outline:4px solid var(--bq-red)}#baqBox .bq-stg div.hot b{color:var(--bq-red)}'+
'#baqBox .bq-blk{display:flex;gap:10px;justify-content:center}'+
'#baqBox .bq-blk i{width:46px;height:120px;border-radius:12px;background:#ffb057}#baqBox .bq-blk i.m{background:#c5ccd6}#baqBox .bq-blk i.k{background:var(--bq-blue);box-shadow:0 0 0 5px #bcd8ff}#baqBox .bq-blk i.k.z{box-shadow:none}'+
'#baqBox .bq-lg{font-size:22px;color:var(--bq-sub);margin-top:16px;line-height:1.6;text-align:center}'+
'#baqBox .bq-lg i{display:inline-block;width:18px;height:18px;border-radius:5px;vertical-align:-2px;margin:0 6px 0 4px}'+
'#baqBox .bq-vsx{display:flex;gap:26px}'+
'#baqBox .bq-vsx div{width:250px;border-radius:24px;padding:24px;text-align:center;background:var(--bq-bg)}'+
'#baqBox .bq-vsx div b{display:block;font-size:30px}#baqBox .bq-vsx div i{display:block;font-style:normal;font-size:84px;font-weight:900;margin:6px 0}'+
'#baqBox .bq-vsx div span{font-size:24px;color:var(--bq-sub);font-weight:700}'+
'#baqBox .bq-vsx .ok{background:var(--bq-blueS)}#baqBox .bq-vsx .ok i{color:var(--bq-blue)}#baqBox .bq-vsx .no{background:var(--bq-redS)}#baqBox .bq-vsx .no i{color:var(--bq-red)}'+
'#baqBox .bq-mon{display:flex;align-items:center;gap:30px}'+
'#baqBox .bq-mon .box{border-radius:28px;padding:28px 36px;background:var(--bq-bg)}'+
'#baqBox .bq-mon .box span{display:block;font-size:26px;color:var(--bq-sub);font-weight:700}'+
'#baqBox .bq-mon .box b{white-space:nowrap;font-size:62px;font-weight:900;letter-spacing:-.02em}#baqBox .bq-mon .box.on{background:var(--bq-blueS)}'+
'#baqBox .bq-mon .arr{font-size:64px;color:var(--bq-mute)}'+
'#baqBox .bq-pick{display:flex;flex-direction:column;gap:14px}'+
'#baqBox .bq-pick div{display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700;background:var(--bq-bg);border-radius:18px;padding:16px 24px}'+
'#baqBox .bq-pick div b{flex:none;font-size:22px;color:#fff;background:var(--bq-blue);border-radius:10px;padding:5px 12px}'+
'#baqBox .bq-pick div em{flex:1;min-width:0;font-style:normal;font-size:27px;word-break:break-all;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}#baqBox .bq-pick div span{flex:none;white-space:nowrap;margin-left:auto;font-size:24px;color:var(--bq-sub);font-weight:600}'+
'#baqBox .bq-ls{display:flex;flex-direction:column;gap:12px;margin-top:10px}'+
'#baqBox .bq-ls>div{background:var(--bq-bg);border-radius:18px;padding:14px 24px}'+
'#baqBox .bq-ls .a{display:flex;align-items:baseline;gap:16px}#baqBox .bq-ls .a b{font-size:30px}'+
'#baqBox .bq-ls .a span{margin-left:auto;font-size:28px;font-weight:800;white-space:nowrap}'+
'#baqBox .bq-ls .d{font-size:21px;color:var(--bq-sub);margin-top:4px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}#baqBox .bq-ls .d b{color:var(--bq-ink)}'+
'#baqBox .bq-ls .more{background:none;font-size:22px;color:var(--bq-sub);padding:4px 24px}'+
'#baqBox .bq-chk{display:flex;flex-direction:column;gap:22px}'+
'#baqBox .bq-chk div{font-size:38px;font-weight:700;display:flex;gap:18px;align-items:center}'+
'#baqBox .bq-chk div p{margin:0}#baqBox .bq-chk div i{flex:none;font-style:normal;width:56px;height:56px;border-radius:16px;display:grid;place-items:center;font-size:28px;color:#fff}'+
'#baqBox .bq-tk{display:none;position:absolute;z-index:4;left:0;right:0;bottom:0;background:#191f28;color:#fff;font-size:21px;line-height:1.5;padding:12px 72px}'+
'#baqBox .bq-tk b{color:#ffd66b}#baqBox.talk .bq-tk{display:block}'+
'#baqBox.pres{background:#000;overflow:hidden}#baqBox.pres .bq-bar{display:none}'+
'#baqBox.pres .bq-deck{padding:0;height:100%;justify-content:center;gap:0}'+
'#baqBox.pres .bq-fr{display:none;border-radius:0;box-shadow:none}#baqBox.pres .bq-fr.cur{display:block}'+
'#baqBox .bq-hint{display:none;position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(25,31,40,.86);color:#fff;font-size:14px;padding:8px 14px;border-radius:10px;white-space:nowrap;pointer-events:none;z-index:9}'+
'#baqBox.pres .bq-hint{display:block;animation:bqHint 5s forwards}@keyframes bqHint{0%,70%{opacity:1}100%{opacity:0}}'+
'@media print{#baqBox{display:none!important}}';
  document.head.appendChild(st);
}
function baqOpen(){
  baqCss();
  var box=document.getElementById('baqBox');
  if(!box){box=document.createElement('div');box.id='baqBox';box.setAttribute('role','dialog');box.setAttribute('aria-label','보장 전·후 심플 — 질문으로 보기');document.body.appendChild(box);}
  var html;
  try{html=baqHtml();}catch(e){html='<section class="bq-sl s1" data-n="1"><div class="bq-qc"><div class="qt" style="font-size:48px">화면을 그리다 멈췄습니다</div><div class="qh">'+esc((e&&e.message)||'')+'</div></div></section>';}
  box.innerHTML='<div class="bq-bar">'+
    '<button id="baqB1" onclick="baqAll(1)">① 질문</button>'+
    '<button id="baqB2" onclick="baqAll(2)">② 쉽게 말하면</button>'+
    '<button id="baqB3" class="on" onclick="baqAll(3)">③ 그래서 필요합니다</button>'+
    '<button onclick="baqTalk()">🗣 설계사 한 마디</button>'+
    '<button class="go" onclick="baqPres(true)">🔳 발표 시작</button>'+
    '<button class="bq-x" onclick="baqClose()">✕ 닫기</button></div>'+
    '<div class="bq-deck" id="baqDeck">'+html.replace(/<section /g,'<div class="bq-fr"><section ').replace(/<\/section>/g,'</section></div>')+'</div>'+
    '<div class="bq-hint">눌러서 · → · 스페이스 : 다음 &nbsp;·&nbsp; ← : 앞으로 &nbsp;·&nbsp; S : 설계사 한 마디 &nbsp;·&nbsp; Esc : 나가기</div>';
  BAQ.on=true;BAQ.pres=false;BAQ.cur=0;
  document.documentElement.style.overflow='hidden';
  baqFit();box.scrollTop=0;
}
function baqClose(){
  if(BAQ.pres)baqPres(false);
  var box=document.getElementById('baqBox');if(box)box.parentNode.removeChild(box);
  BAQ.on=false;document.documentElement.style.overflow='';
}
function baqSl(){return [].slice.call(document.querySelectorAll('#baqBox .bq-sl'));}
function baqStepOf(s){return +((s.className.match(/\bs(\d)\b/)||[0,1])[1]);}
function baqSet(s,k){var n=+s.getAttribute('data-n');k=Math.max(1,Math.min(n,k));s.classList.remove('s1','s2','s3');s.classList.add('s'+k);}
function baqAll(k){baqSl().forEach(function(s){baqSet(s,k);});
  [1,2,3].forEach(function(j){var b=document.getElementById('baqB'+j);if(b)b.classList.toggle('on',j===k);});}
function baqTalk(){var b=document.getElementById('baqBox');if(b)b.classList.toggle('talk');}
function baqFit(){
  var box=document.getElementById('baqBox');if(!box)return;
  var W,sc,fr=[].slice.call(box.querySelectorAll('.bq-fr'));
  if(BAQ.pres){sc=Math.min(box.clientWidth/1280,box.clientHeight/720);}
  else{W=Math.min(1280,box.clientWidth-32);sc=W/1280;}
  fr.forEach(function(f){f.style.width=Math.round(1280*sc)+'px';f.style.height=Math.round(720*sc)+'px';
    f.firstChild.style.transform='scale('+sc+')';});
}
function baqShow(i,k){var L=baqSl();BAQ.cur=Math.max(0,Math.min(L.length-1,i));
  L.forEach(function(s,j){s.parentNode.classList.toggle('cur',j===BAQ.cur);});baqSet(L[BAQ.cur],k||1);}
function baqPres(on){
  var box=document.getElementById('baqBox');if(!box)return;
  BAQ.pres=!!on;box.classList.toggle('pres',BAQ.pres);
  try{
    if(BAQ.pres){if(box.requestFullscreen)box.requestFullscreen();else if(box.webkitRequestFullscreen)box.webkitRequestFullscreen();}
    else if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();
  }catch(e){}
  if(BAQ.pres)baqShow(0,1);else baqAll(3);
  baqFit();
}
function baqNext(){var L=baqSl(),s=L[BAQ.cur],k=baqStepOf(s);if(k<+s.getAttribute('data-n')){baqSet(s,k+1);return;}if(BAQ.cur<L.length-1)baqShow(BAQ.cur+1,1);}
function baqPrev(){var L=baqSl(),s=L[BAQ.cur],k=baqStepOf(s);if(k>1){baqSet(s,k-1);return;}if(BAQ.cur>0)baqShow(BAQ.cur-1,9);}
/* 열려 있을 때는 <b>이 화면이 먼저</b> 키를 받는다 — 뒤의 「한 장씩 넘기기」 가 같이 넘어가지 않게 */
window.addEventListener('keydown',function(e){
  if(!BAQ.on)return;
  var k=e.key,hit=true;
  if(BAQ.pres){
    if(k==='ArrowRight'||k===' '||k==='Spacebar'||k==='PageDown'||k==='Enter')baqNext();
    else if(k==='ArrowLeft'||k==='PageUp')baqPrev();
    else if(k==='s'||k==='S')baqTalk();
    else if(k==='Escape')baqPres(false);
    else hit=false;
  }else if(k==='Escape')baqClose();
  else hit=false;
  if(hit){e.preventDefault();e.stopPropagation();}
},true);
document.addEventListener('click',function(e){
  if(!BAQ.on||!BAQ.pres)return;
  if(!e.target.closest||!e.target.closest('#baqDeck'))return;
  (e.clientX<window.innerWidth/4?baqPrev:baqNext)();
});
var _bqX=null;
document.addEventListener('touchstart',function(e){_bqX=(BAQ.on&&BAQ.pres&&e.touches&&e.touches.length===1)?e.touches[0].clientX:null;},true);
document.addEventListener('touchend',function(e){
  if(_bqX===null)return;var t=(e.changedTouches||[])[0];if(!t)return;
  var dx=t.clientX-_bqX;_bqX=null;if(Math.abs(dx)<60)return;
  e.preventDefault();(dx<0?baqNext:baqPrev)();
},true);
document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&BAQ.pres)baqPres(false);});
window.addEventListener('resize',function(){if(BAQ.on)baqFit();});
