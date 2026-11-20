/* ══ 📱 보장 전·후 — 고객 카톡판 (판 X507) ══════════════════════════════════
   사장님 말씀 (2026-11-19) 「고객이 카톡버전이나 조금 더 보기 쉽게 정리할수 있도록 버전도 만들고 싶어
   우선 목각부터」 · 「그래도 고객이 내 보험 자세히 이해할수 있도록 만들고」 → (11-20) 「응 차례대로 진행해」.

   카톡으로 <b>그림 여러 장</b>을 보낸다(장마다 한 가지 — 고객은 넘겨 가며 본다).
     1 표지 · 목차   2~ 내 보험 자세히(계약 두 건씩)   돈이 나오는 모양   늘어나는 것 · 줄어드는 것   보험료 · 꼭 보실 것
   ★ 링크가 아니라 그림이다 — 고객 자료가 이 기기 밖으로 안 나간다(그림은 이 기기에서 굽는다 · frImgBake 와 같은 길).
     링크로 보내는 판은 준법 확인 뒤에.
   ★ 숫자는 이 화면 셈 그대로 — calc() · payCalc() · diff(). 담보 이름은 ✏️ 담보 고치기와 같은 쉬운 이름(beNm),
     작게 증권 이름(NAME). 지어낸 숫자 없음.
   ★ 줄어드는 것도 숨기지 않는다 · 정리(해지)하는 계약이 있으면 해지 불이익 ①② 를 심의 문구 그대로 마지막 장에.
   ba.html 은 안 고친다 — ④ 보여주기 단추 한 개(ba-steps.js)와 script 한 줄만. 이름은 bk* · CSS 는 #bkHost · #bkBox 안.   */

var BK_W=720;   /* 굽는 너비 — ×1.5 로 1080px 그림 */
var BK_ACT={keep:'그대로 둬요',endo:'일부 바꿔요',cancel:'정리해요',new:'새로 들어요'};
var BK_SHAPE={L:['💰','한 번에 목돈','진단 · 수술 · 사고가 생기면 정한 금액이 한 번에'],D:['🛏','하루마다','입원 · 간병한 날 수만큼'],
  M:['📅','매달','돌봄 등급을 받으면 달마다'],A:['🧾','쓴 만큼 · 한도 안에서','병원비 · 합의금 · 벌금처럼 실제로 든 돈을 한도 안에서']};
/* 실손 여섯 칸은 고객 그림에서 두 줄(병 · 사고)로 — 이름이 다 「…의료비」 라 여섯 줄이면 안 읽힌다 */
var BK_SIL={silD:['SILD','입원'],silDO:['SILD','통원'],silDP:['SILD','약'],silA:['SILA','입원'],silAO:['SILA','통원'],silAP:['SILA','약']};
var BK_SILN={SILD:'병원비 돌려받기 — 병 (실손)',SILA:'병원비 돌려받기 — 사고 (실손)'};
function bkSil(o,g){var t=[];for(var k in BK_SIL)if(BK_SIL[k][0]===g&&num(o[k])!==null&&num(o[k])>0)t.push(BK_SIL[k][1]+' '+man(num(o[k])));return t.join(' · ');}
function bkSilRow(b,a,g,gone){var tb=bkSil(b,g),ta=bkSil(a,g);if(!tb&&!ta)return '';
  return '<li><span>🧾 '+BK_SILN[g]+'<small>쓴 병원비를 한도 안에서 · 내가 내는 몫은 빼고</small></span><b class="sil'+(gone?' gone':'')+'">'+(gone?tb:(ta||tb))+'</b></li>';}
function bkNm(k){return (typeof beNm==='function')?beNm(k):(SNAME[k]||NAME[k]||k);}
function bkAmt(k,v){var u=UNIT[k]||'L';if(u==='D')return '하루 '+man(v)+'원';if(u==='M')return '매달 '+man(v)+'원';if(u==='A')return '한도 '+man(v)+'원';return man(v)+'원';}
function bkWho(){var n=(S.who&&S.who.name)?String(S.who.name).trim():'';return n?esc(n)+' 님':'고객님';}
function bkAct(p,sd){return sd==='after'?'new':(p.act||'keep');}
function bkAfter(p,sd){var a=bkAct(p,sd);return (a==='keep'||a==='new')?(p.cov||{}):(a==='endo'?(p.cov2||{}):{});}
function bkOrd(o){var ks=[];STD.forEach(function(g){g.rows.forEach(function(r){if(num(o[r.k])!==null&&num(o[r.k])>0)ks.push(r.k);});});
  var U={L:0,D:1,M:2,A:3};return ks.sort(function(x,y){return U[UNIT[x]]-U[UNIT[y]];});}
function bkEnd(p){var m=String(p.start||'').match(/^(\d{4})\D?(\d{1,2})/),y=num(p.years);if(!m||!(y>0))return '';
  var e=(+m[1])*12+(+m[2])-1+Math.round(y*12)-1;return Math.floor(e/12)+'년 '+(e%12+1)+'월';}

/* ── 장 만들기 — 장마다 { t: 목차 이름, h: 속 HTML } ── */
function bkCards(){
  var C=calc(),cards=[],L=[];
  S.before.forEach(function(p){L.push({p:p,sd:'before'});});S.after.forEach(function(p){L.push({p:p,sd:'after'});});
  /* 내 보험 자세히 — 계약마다 */
  var pcs=L.map(function(x){var p=x.p,a=bkAct(p,x.sd),b=p.cov||{},af=bkAfter(p,x.sd),c=payCalc(p,x.sd),u={},k;
    for(k in b)u[k]=b[k];for(k in af)if(num(af[k])!==null)u[k]=af[k];
    var pm=(c.done&&a!=='new')?'보험료 <b>다 냈어요 ✓</b>':
      ('월 <b>'+(c.prem===null?'—':fee(c.prem))+'</b>'+(a==='endo'&&num(p.premMan2)!==null&&p.premMan2!==''?' → 바꾸면 <b>'+fee(num(p.premMan2))+'</b>':'')+
       (a!=='cancel'&&bkEnd(p)?' · <b>'+bkEnd(p)+'</b>까지 내요':''));
    var ks=bkOrd(u).filter(function(k){return !BK_SIL[k];}),sil=bkSilRow(b,af,'SILD',a==='cancel')+bkSilRow(b,af,'SILA',a==='cancel');
    var rows=sil+ks.slice(0,12).map(function(k){var vb=num(b[k]),va=num(af[k]),cls='',v;
      if(a==='cancel'){cls='gone';v=bkAmt(k,vb);}
      else if(a==='endo'&&vb!==null&&va!==null&&vb!==va){cls='hi';v='<small>지금 '+bkAmt(k,vb)+'</small>'+bkAmt(k,va);}
      else if(a==='endo'&&vb===null){cls='hi';v='<small>새로</small>'+bkAmt(k,va);}
      else if(a==='endo'&&va===null){cls='gone';v='<small>빠져요</small>'+bkAmt(k,vb);}
      else v=bkAmt(k,va!==null?va:vb);
      return '<li><span>'+(MIC[k]||'')+' '+esc(bkNm(k))+(bkNm(k)!==NAME[k]?'<small>'+esc(NAME[k]||k)+'</small>':'')+'</span><b class="'+cls+'">'+v+'</b></li>';}).join('');
    var tip={endo:'계약은 그대로 두고 <b>보장만</b> 바꿔요.',cancel:'정리하는 보험이에요. 같은 보장이 <b>새로 드는 보험</b>에 들어 있는지 함께 보세요.',
      new:'새로 드는 보험이에요. 가입하고 처음 얼마 동안은 보장이 줄거나 안 될 수 있어요(약관에서 확인).'}[a]||'';
    return '<div class="pc"><div class="ph"><div><div class="co">'+esc(p.co||'회사 미상')+'</div><div class="nm">'+esc(p.nm||'이름 없는 계약')+'</div></div>'+
      '<span class="st '+a+'">'+BK_ACT[a]+'</span></div><div class="pm">'+pm+'</div><ul class="cv">'+rows+'</ul>'+
      (ks.length>12?'<p class="more">그 밖에 '+(ks.length-12)+'개 — 최종 보고서에 다 있어요</p>':'')+(tip?'<p class="tip">'+tip+'</p>':'')+'</div>';});
  for(var i=0;i<pcs.length;i+=2)cards.push({t:'내 보험 자세히'+(pcs.length>2?' ('+(i/2+1)+')':''),h:'<h2>📄 내 보험 자세히</h2><p class="lead">계약마다 — 무엇을 그대로 두고, 무엇을 바꾸는지</p>'+pcs.slice(i,i+2).join('')});
  /* 돈이 나오는 모양 — 바꾸면 합계 */
  var G={L:[],D:[],M:[],A:[]};['SILD','SILA'].forEach(function(g){var t=bkSil(C.a,g);if(t)G.A.push('<li><span>'+BK_SILN[g]+'</span><b class="sil">'+t+'</b></li>');});
  bkOrd(C.a).filter(function(k){return !BK_SIL[k];}).forEach(function(k){G[UNIT[k]||'L'].push('<li><span>'+esc(bkNm(k))+'</span><b>'+bkAmt(k,C.a[k])+'</b></li>');});
  cards.push({t:'돈이 나오는 모양',h:'<h2>🧭 돈이 나오는 모양</h2><p class="lead">바꾸면 — 모든 보험을 합쳐서, 나오는 모양별로</p>'+
    ['L','D','M','A'].filter(function(u){return G[u].length;}).map(function(u){var s=BK_SHAPE[u];
      return '<div class="shp s'+u+'"><h3>'+s[0]+' '+s[1]+' <em>'+G[u].length+'개</em></h3><p>'+s[2]+'</p><ul class="cv">'+G[u].join('')+'</ul></div>';}).join('')+
    '<p class="note">진단비 · 수술비 · 입원일당처럼 정한 금액이 나오는 보장은 보험마다 따로 나오는 경우가 많아 합쳐서 적었어요. 병원비 · 합의금처럼 쓴 만큼 나오는 것은 보험끼리 나눠서 나와요. 실제 지급은 약관 기준이에요.</p>'});
  /* 늘어나는 것 · 줄어드는 것 */
  var D=diff(C),li=function(x){return '<li><span>'+esc(bkNm(x.k))+'</span><b>'+(x.b?bkAmt(x.k,x.b):'없음')+' → '+(x.a?bkAmt(x.k,x.a):'없음')+'</b></li>';};
  cards.push({t:'늘어나는 것 · 줄어드는 것',h:'<h2>⚖️ 바꾸면 달라지는 것</h2><p class="lead">지금 → 바꾸면 (모든 보험을 합쳐서)</p>'+
    '<div class="shp sG"><h3>⏫ 늘어나요 <em>'+D.gain.length+'개</em></h3><ul class="cv">'+(D.gain.slice(0,14).map(li).join('')||'<li><span>없어요</span></li>')+'</ul>'+
      (D.gain.length>14?'<p class="more">그 밖에 '+(D.gain.length-14)+'개</p>':'')+'</div>'+
    '<div class="shp sR"><h3>⏬ 줄어들어요 <em>'+D.loss.length+'개</em></h3><ul class="cv">'+(D.loss.slice(0,14).map(li).join('')||'<li><span>줄어드는 보장은 없어요</span></li>')+'</ul>'+
      (D.loss.length>14?'<p class="more">그 밖에 '+(D.loss.length-14)+'개</p>':'')+'</div>'});
  /* 보험료 · 꼭 보실 것 */
  var PC=premCalc(),pb=PC.monB,pa=PC.monA,d=pa-pb,cx=S.before.some(function(p){return (p.act||'keep')==='cancel';});
  var ag=(typeof frAgent==='function')?frAgent():{nm:'',tel:''},nx=new Date();nx.setFullYear(nx.getFullYear()+1);
  cards.push({t:'보험료 · 꼭 보실 것',h:'<h2>💳 한 달 보험료</h2>'+
    '<div class="prem"><div><span>지금</span><b>'+fee(pb)+'</b></div><i>→</i><div class="a"><span>바꾸면</span><b>'+fee(pa)+'</b></div></div>'+
    (d!==null?'<p class="pd">한 달에 <b>'+(d>=0?'+':'−')+fee(Math.abs(d))+'</b></p>':'')+
    ((PC.noPremB||PC.noPremA)?'<p class="note">보험료를 안 적은 계약이 있어 그 계약은 빼고 셌어요.</p>':'')+'<p class="note">다 낸 보험은 한 달 보험료에서 뺐어요.</p>'+
    '<div class="warn"><b>꼭 보실 것</b>'+
      '<p>※ 보험사 및 상품별로 상이할 수 있으므로, 관련한 세부사항은 반드시 해당 약관을 참조하시기 바랍니다.</p>'+
      '<p>※ 보험회사 상품별, 성별, 연령, 직업에 따라 가입 가능한 담보와 가입금액, 보험료 등은 달라질 수 있습니다.</p>'+
      (cx?'<p>보험계약자가 기존 보험계약을 해지하고 새로운 보험계약을 체결하는 과정에서<br>① 질병이력, 연령증가 등으로 가입이 거절되거나 보험료가 인상될 수 있습니다.<br>② 가입 상품에 따라 새로운 면책기간 적용 및 보장 제한 등 기타 불이익이 발생할 수 있습니다.</p>':'')+
    '</div>'+
    '<div class="ag">'+((ag.nm||ag.tel)?'<b>담당</b> '+esc(ag.nm||'')+(ag.tel?' · '+esc(ag.tel):'')+'<br>':'')+
      '<b>다음 점검</b> '+nx.getFullYear()+'년 '+(nx.getMonth()+1)+'월 — 해마다 한 번 다시 봐 드려요</div>'});
  /* 표지 · 목차 — 맨 앞 */
  var nB=S.before.length,nA=S.after.length,today=new Date();
  var cover='<div class="cov"><p class="k">보장 점검 · '+today.getFullYear()+'.'+(today.getMonth()+1)+'.'+today.getDate()+'</p>'+
    '<h1>'+bkWho()+'의<br>보험 한 번에 보기</h1>'+
    '<div class="kp"><div><span>지금 보험</span><b>'+nB+'건</b></div><div><span>새로 드는 보험</span><b>'+nA+'건</b></div>'+
    '<div><span>한 달 보험료</span><b>'+fee(premCalc().monB)+' → '+fee(premCalc().monA)+'</b></div></div></div>'+
    '<h3 class="tc">이렇게 넘겨 보세요</h3><ol class="toc">'+cards.map(function(c,i){return '<li><i>'+(i+2)+'</i>'+c.t+'</li>';}).join('')+'</ol>'+
    '<p class="note">옆으로 넘기면 다음 장이에요. 궁금한 곳은 그 장 번호로 물어보세요.</p>';
  cards.unshift({t:'표지 · 목차',h:cover});
  return cards;
}

/* ── 굽기 · 보여 주기 ── */
function bkPage(c,i,n){return '<div class="pg"><div class="top"><span>'+bkWho()+' · 보장 점검</span><span>'+(i+1)+' / '+n+'</span></div>'+c.h+'</div>';}
function bkOpen(){
  if(typeof frH2c!=='function'){toast('그림 만드는 기능을 못 찾았습니다',4000);return;}
  if(!S.before.length&&!S.after.length){toast('② 지금 보험부터 넣어 주세요',4000);return;}
  var cards=bkCards();toast('카톡판 '+cards.length+'장을 그림으로 만드는 중입니다…',3000);
  frH2c().then(function(h2c){
    var out=[],i=0;
    function one(){
      if(i>=cards.length)return Promise.resolve(out);
      var host=document.createElement('div');host.id='bkHost';host.setAttribute('aria-hidden','true');
      host.style.cssText='position:absolute;left:-12000px;top:0;width:'+BK_W+'px';host.innerHTML=bkPage(cards[i],i,cards.length);
      document.body.appendChild(host);
      return ((document.fonts&&document.fonts.ready)||Promise.resolve()).then(function(){return new Promise(function(r){setTimeout(r,60);});})
        .then(function(){return h2c(host,{scale:1.5,backgroundColor:'#ffffff',useCORS:true,logging:false,scrollX:0,scrollY:0,windowWidth:1280});})
        .then(function(cv){host.remove();return new Promise(function(r){cv.toBlob(function(b){out.push({blob:b,w:cv.width,h:cv.height,t:cards[i].t});i++;r();},'image/png');});},
              function(e){host.remove();throw e;}).then(one);
    }
    return one();
  }).then(function(list){window.__BK=list;bkShow();})
    .catch(function(e){toast('카톡판을 만들지 못했습니다 — '+(e&&e.message||e),7000);});
}
function bkName(i,t){var n=(S.who&&S.who.name)?String(S.who.name).trim().replace(/[\\/:*?"<>|\s]/g,''):'고객';
  return n+'_보장점검_'+String(i+1).padStart(2,'0')+'_'+t.replace(/[\\/:*?"<>|·\s()]/g,'')+'.png';}
function bkShow(){
  var L=window.__BK||[];var box=document.getElementById('bkBox');
  if(!box){box=document.createElement('div');box.id='bkBox';box.className='noprint';document.body.appendChild(box);}
  L.forEach(function(x){if(x.url)URL.revokeObjectURL(x.url);x.url=URL.createObjectURL(x.blob);});
  var files=[];try{files=L.map(function(x,i){return new File([x.blob],bkName(i,x.t),{type:'image/png'});});}catch(e){}
  var canShare=!!(files.length&&navigator.canShare&&navigator.canShare({files:files}));
  var inApp=(typeof frImgInApp==='function')&&frImgInApp(),ag=(typeof frAgent==='function')?frAgent():{nm:'',tel:''};
  box.innerHTML='<div class="bkb"><div class="bkh"><b>📱 카톡판</b><span>그림 '+L.length+'장 · 순서대로 보내 주세요</span>'+
      '<button class="mini" onclick="bkClose()" aria-label="닫기">✕ 닫기</button></div>'+
    '<div class="bkag"><span>마지막 장 담당</span><input value="'+esc(ag.nm)+'" placeholder="이름 예) 홍길동 TFA" oninput="frAgentSet(\'nm\',this.value)" aria-label="담당 이름">'+
      '<input value="'+esc(ag.tel)+'" placeholder="연락처" inputmode="tel" oninput="frAgentSet(\'tel\',this.value)" aria-label="담당 연락처">'+
      '<button class="mini" onclick="bkOpen()">↻ 다시 만들기</button></div>'+
    '<div class="bka">'+(canShare?'<button class="btn g" onclick="bkShare()">📤 '+L.length+'장 한 번에 보내기 (카톡 · 문자)</button>':'')+
      (inApp?'':'<button class="btn" onclick="bkSaveAll()">💾 '+L.length+'장 모두 저장</button>')+'</div>'+
    '<div class="bki">'+L.map(function(x,i){return '<figure><img src="'+x.url+'" alt="카톡판 '+(i+1)+'장 — '+esc(x.t)+'"><figcaption><b>'+(i+1)+'</b> '+esc(x.t)+
      (inApp?'':' <button class="mini" onclick="bkSave('+i+')">💾 이 장 저장</button>')+'</figcaption></figure>';}).join('')+'</div>'+
    '<p class="fin">'+(inApp?'그림을 <b>길게 눌러</b> 「이미지 저장」 하세요. ':'')+'고객님 자료는 이 기기 안에서만 그림으로 만들었습니다 — 보내실 분이 맞는지 한 번 더 확인하고 보내 주세요.</p></div>';
  box.style.display='flex';
}
function bkClose(){var b=document.getElementById('bkBox');if(b)b.style.display='none';}
function bkSave(i){var x=(window.__BK||[])[i];if(!x)return;var a=document.createElement('a');a.href=x.url;a.download=bkName(i,x.t);document.body.appendChild(a);a.click();a.remove();}
function bkSaveAll(){var L=window.__BK||[];L.forEach(function(x,i){setTimeout(function(){bkSave(i);},i*350);});toast(L.length+'장을 저장합니다',3000);}
function bkShare(){var L=window.__BK||[];var f=L.map(function(x,i){return new File([x.blob],bkName(i,x.t),{type:'image/png'});});
  navigator.share({files:f,title:'보장 점검'}).catch(function(e){if(e&&e.name==='AbortError')return;toast('보내기 창을 못 열었습니다 — 「모두 저장」 을 눌러 주세요',5000);});}

(function(){var st=document.createElement('style');st.textContent=[
/* 굽는 장 — 폰에서 읽히게 큼직하게 (720 → ×1.5) */
'#bkHost{font-family:inherit;color:var(--nv);background:#fff}',
'#bkHost .pg{padding:30px 32px 34px;box-sizing:border-box}',
'#bkHost .top{display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:var(--gyd);border-bottom:1px solid var(--ln);padding-bottom:10px;margin-bottom:18px}',
'#bkHost h1{font-size:40px;line-height:1.3;margin:6px 0 22px;letter-spacing:-.02em}',
'#bkHost h2{font-size:30px;margin:0 0 6px;letter-spacing:-.02em}#bkHost h3{font-size:22px;margin:0 0 6px}',
'#bkHost .lead{font-size:18px;color:var(--gyd);margin:0 0 16px}',
'#bkHost .cov{background:var(--bl2);border-radius:22px;padding:26px 26px 22px;margin-bottom:22px}#bkHost .cov .k{font-size:17px;font-weight:800;color:var(--blt);margin:0}',
'#bkHost .kp{display:grid;grid-template-columns:1fr 1fr;gap:10px}#bkHost .kp div{background:#fff;border-radius:14px;padding:12px 14px}',
'#bkHost .kp div:last-child{grid-column:1/-1}#bkHost .kp span{display:block;font-size:15px;color:var(--gyd);font-weight:700}#bkHost .kp b{font-size:24px}',
'#bkHost .tc{margin-top:4px}#bkHost .toc{list-style:none;padding:0;margin:8px 0 14px;display:block;columns:auto;column-count:1}',
'#bkHost .toc li{width:auto;float:none}',
'#bkHost .cv li b.sil{font-size:16px;white-space:normal;max-width:52%}',
'#bkHost .toc li{display:flex;gap:12px;align-items:center;font-size:21px;font-weight:700;padding:12px 4px;border-bottom:1px solid var(--ln)}',
'#bkHost .toc i{font-style:normal;width:34px;height:34px;border-radius:17px;background:var(--nv);color:#fff;display:grid;place-items:center;font-size:17px}',
'#bkHost .pc{border:1.5px solid var(--ln);border-radius:20px;padding:18px 20px;margin-bottom:16px}',
'#bkHost .ph{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}#bkHost .co{font-size:15px;font-weight:700;color:var(--gyd)}#bkHost .nm{font-size:23px;font-weight:800}',
'#bkHost .st{font-size:15px;font-weight:800;border-radius:9px;padding:5px 10px;white-space:nowrap}',
'#bkHost .st.keep{background:var(--gr2);color:var(--gr)}#bkHost .st.endo{background:var(--or2);color:var(--or)}#bkHost .st.cancel{background:#fff;color:var(--rd);box-shadow:inset 0 0 0 1.5px var(--rd)}#bkHost .st.new{background:var(--bl2);color:var(--blt)}',
'#bkHost .pm{font-size:17px;color:var(--gyd);margin:8px 0 10px}#bkHost .pm b{color:var(--nv)}',
'#bkHost .cv{list-style:none;padding:0;margin:0}',
'#bkHost .cv li{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:9px 0;border-top:1px solid var(--ln);font-size:18px}',
'#bkHost .cv li span{font-weight:700;line-height:1.35}#bkHost .cv li span small{display:block;font-size:14px;color:var(--gyd);font-weight:500}',
'#bkHost .cv li b{white-space:nowrap;text-align:right;font-size:19px}#bkHost .cv li b small{display:block;font-size:14px;color:var(--gyd);font-weight:600}',
'#bkHost .cv li b.hi{color:var(--blt)}#bkHost .cv li b.gone{color:var(--gyd);text-decoration:line-through}',
'#bkHost .tip{font-size:16px;background:var(--bg);border-radius:12px;padding:10px 12px;margin:10px 0 0}#bkHost .more{font-size:15px;color:var(--gyd);margin:8px 0 0}',
'#bkHost .shp{border-radius:18px;padding:16px 18px;margin-bottom:14px;background:var(--bg)}#bkHost .shp h3 em{font-style:normal;font-size:16px;color:var(--gyd)}',
'#bkHost .shp p{font-size:16px;color:var(--gyd);margin:0 0 8px}#bkHost .sG{background:var(--gr2)}#bkHost .sR{background:var(--rd2)}',
'#bkHost .note{font-size:15px;color:var(--gyd);line-height:1.6}',
'#bkHost .prem{display:flex;align-items:center;justify-content:center;gap:16px;margin:18px 0 6px}#bkHost .prem div{text-align:center}',
'#bkHost .prem span{display:block;font-size:17px;color:var(--gyd);font-weight:700}#bkHost .prem b{font-size:32px}#bkHost .prem .a b{color:var(--blt)}#bkHost .prem i{font-style:normal;font-size:26px;color:var(--gyd)}',
'#bkHost .pd{text-align:center;font-size:20px;margin:4px 0 18px}',
'#bkHost .warn{background:var(--or2);color:var(--or);border-radius:16px;padding:14px 16px;font-size:15px;line-height:1.65}#bkHost .warn p{margin:6px 0 0}#bkHost .warn b{font-size:17px}',
'#bkHost .ag{margin-top:16px;font-size:17px;line-height:1.7;border-top:1px solid var(--ln);padding-top:12px}',
/* 화면 — 구운 그림 보기 */
'#bkBox{position:fixed;inset:0;z-index:2147482000;background:rgba(15,23,42,.55);display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}',
'#bkBox .bkb{background:#fff;border-radius:18px;max-width:560px;width:100%;padding:16px}',
'#bkBox .bkh{display:flex;gap:10px;align-items:center}#bkBox .bkh b{font-size:18px}#bkBox .bkh span{font-size:14px;color:var(--gyd)}#bkBox .bkh .mini{margin-left:auto;min-height:44px}',
'#bkBox .bkag{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 0;font-size:14px;color:var(--gyd)}#bkBox .bkag input{flex:1;min-width:120px;min-height:44px}#bkBox .bkag .mini{min-height:44px}',
'#bkBox .bka{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}#bkBox .bka .btn{min-height:48px;flex:1}',
'#bkBox .bki figure{margin:0 0 14px}#bkBox .bki img{width:100%;border:1px solid var(--ln);border-radius:12px;display:block}',
'#bkBox .bki figcaption{display:flex;gap:8px;align-items:center;font-size:14px;margin-top:6px}#bkBox .bki figcaption .mini{margin-left:auto;min-height:44px}',
'#bkBox .fin{font-size:13px;color:var(--gyd);margin:6px 0 0}'
].join('\n');document.head.appendChild(st);})();
