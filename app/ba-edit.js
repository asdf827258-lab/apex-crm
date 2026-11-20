/* ══ ✏️ 담보 고치기 — 한 곳에서 (판 X502) ═══════════════════════════════
   사장님 말씀 (2026-11-19) 「담보 수정하는게 너무 복잡해 더 보기 쉽게해」 →
   목업을 보시고 (11-20) 「응 바꿔도 된다. 하지만 바꾸기전 너가 1달차 설계사라면
   어떻게 해야 더 쉽겠니」 → 「오우 너무 좋다」.

   예전에는 담보를 <b>두 군데</b>에서 고쳤다 — 계약마다 「✍️ 담보 적기 ▾」(부위 단추 ·
   만원 숫자) 와 ⑤ 표준표의 전 · 후 칸(손 표시). 어느 쪽이 마지막 말인지 헷갈렸다.
   이제 고치는 곳은 <b>이 칸 하나</b>다. ⑤ 표준표는 읽기만 한다.

   1달차 눈으로 더한 것
     ① 맨 위 순서 띠 — 계약마다 정하기 → 빈 곳 채우기 → 보험료 · 고객에게 말할 것,
        그리고 「👉 지금 할 일」 한 줄과 단추 하나
     ② 줄마다 기준 금액 — ★ <b>모든 계약을 합친 금액</b>과 견준다(rankHave). 계약 한 줄과
        견주면 이미 다른 계약으로 채운 고객에게도 「모자라요」 가 떠서 중복 가입을 부른다.
        기준은 ③ 「제안 순위」 와 같은 rankTarget(나이대 담보안 · 없으면 표준 금액) — 새 숫자 없음.
        「채우기」 는 모자란 만큼만 이 계약에 더한다.
     ③ 단위를 말로 — 하루 3만원 · 매달 50만원 · 한도
     ④ 이름 옆 ? — 언제 나오는지(DESC 첫 문장 그대로)
     ⑤ ↶ 되돌리기(여러 번) · 계약마다 「처음으로」
     ⑥ 빈 곳(rankSuggest 를 「바꾸면」 기준으로) 을 누르면 새 보험에 바로 — 없으면 새 제안을 만든다
     ⑦ 새 보험 · 배서의 월 보험료 칸이 여기 있다 — 비어 있으면 3단계가 안 끝난다
     ⑧ 해지를 고르면 고객에게 꼭 말할 것(해지 불이익 ①② — 심의 문구 그대로) + 「설명했어요」

   ba.html 에는 editHtml 한 자리 · 담보 적기 닫힌 줄 · 표준표 읽기만 · script 한 줄만.
   이름은 전부 be* · CSS 는 #beCard 안에만.                                        */

var BE={hist:[],p0:{},q:'',edit:null,open:null};
/* 쉬운 이름 — 크게. 증권에 적힌 이름(NAME)은 작게 아래에 그대로 둔다 */
var BE_EASY={
 cancer:'암 진단 — 한 번에',cancer2:'작은 암(갑상선암 등) 진단',target:'표적 · 면역 항암약 치료',
 cantx:'암 치료할 때마다 — 건강보험 되는 치료',cantxN:'암 치료할 때마다 — 건강보험 안 되는 치료',
 brain:'뇌혈관 병 전체 진단',stroke:'뇌출혈 · 뇌경색만 진단',brainS:'뇌혈관 수술',
 mi:'심장 혈관이 갑자기 꽉 막힌 경우만',heart:'심장 혈관 병 전체 진단 (협심증 포함)',heartOp:'심장 혈관 시술 · 수술',
 surgA:'다쳐서 수술',surgN:'큰 병 수술 (뇌 · 심장 · 폐렴 등)',surgL:'흔한 수술 (디스크 · 치핵 등)',
 inpD:'병으로 입원한 날마다',nurUD:'간병인 쓴 날마다',ltcF:'돌봄 등급 받으면 매달',dem2:'중증치매 진단',
 carAcc:'차 사고 합의금 지원',lawyer:'차 사고 변호사 비용',fine:'차 사고 벌금',carHurt:'차 사고로 다치면',
 deathD:'병으로 사망 — 가족에게',deathA:'사고로 사망 — 가족에게',disabA:'사고로 장해가 남으면',liab:'가족이 남에게 피해를 주면',
 frac:'뼈가 부러지면 (진단)',fracS:'뼈가 부러져 수술하면'};
/* [−] [+] 가 오르내리는 자주 쓰는 금액(만원) — 한도(A)는 사다리 없이 숫자를 눌러 적는다 */
var BE_LAD={L:[10,20,30,50,80,100,200,300,500,600,1000,1500,2000,3000,4000,5000,7000,10000,20000,30000,50000],
  D:[1,2,3,4,5,7,10,15,20,30,40,50],M:[10,20,30,50,100,150,200]};
var BE_ACT={keep:'그대로',endo:'일부 바꾸기',cancel:'정리'};

function beS(){if(!S.be||typeof S.be!=='object')S.be={};if(!S.be.seen)S.be.seen={};if(!S.be.told)S.be.told={};return S.be;}
function beList(){var L=[];S.before.forEach(function(p,i){L.push({p:p,sd:'before',i:i});});
  S.after.forEach(function(p,i){L.push({p:p,sd:'after',i:i});});return L;}
function beKey(x){return x.p.id||(x.sd+x.i);}
function beCur(){var s=beS(),L=beList(),j;for(j=0;j<L.length;j++)if(beKey(L[j])===s.sel)return L[j];return L[0]||null;}
function beAct(x){return x.sd==='after'?'new':(x.p.act||'keep');}
function beBag(x){var a=beAct(x);if(a==='endo'){if(!x.p.cov2)x.p.cov2={};return x.p.cov2;}
  if(a==='new'){if(!x.p.cov)x.p.cov={};return x.p.cov;}return null;}
function beName(x){return x.p.nm||(x.sd==='before'?'계약 '+(x.i+1):'새 제안 '+(x.i+1));}
function beNm(k){return BE_EASY[k]||SNAME[k]||NAME[k]||k;}
function beWhen(k){var d=String(DESC[k]||'').replace(/<[^>]*>/g,'').trim();var m=d.match(/^.*?[.!?](?=\s|$)/);return (m?m[0]:d).trim();}
function beAmt(k,v){if(v===null||v===undefined||!isFinite(v))return '—';var u=UNIT[k]||'L';
  if(u==='D')return '하루 '+man(v)+'원';if(u==='M')return '매달 '+man(v)+'원';if(u==='A')return '한도 '+man(v)+'원';return man(v)+'원';}
/* 「바꾸면」 쪽 합계 — 계약 · 새 제안 · ⑤ 표의 예전 손 고침까지 calc() 하나에서 */
function beBase(){return calc().a;}
function beGap(k,base){var t=rankTarget(k);if(t===null)return 0;var h=rankHave(k,base||beBase());return t>h?t-h:0;}
function beFirst(k,base){var g=beGap(k,base);if(g>0)return g;var s=SSTD[k];if(s>0)return s;var L=BE_LAD[UNIT[k]];return L?L[0]:10;}
/* 빈 곳 = ③ 「추가 제안」 과 같은 rankSuggest(묶음 셋 · 급한 순)를 「바꾸면」 합계로 센 것.
   묶음 안 담보를 다 내놓으면 견본 고객도 19개라 1달차가 질린다 — 안내에는 <b>묶음마다 설계 순서 앞 둘</b>만,
   나머지는 찾기 칸 아래에 다 둔다. 채울지 말지는 설계사가 정한다(「빈 곳은 이대로 둘게요」) */
/* ★ 「앞 둘」 은 <b>묶음의 설계 순서에서 정해진 두 담보</b>다(기준 금액이 있는 것). 비어 있는 것 중 앞 둘로 잡으면
   하나 채울 때마다 다음 담보가 올라와 끝이 안 난다(실제로 그랬다 — 암 치료비 묶음만 열 개).
   넓은 담보가 같이 비면 좁은 것은 rankSuggest 가 이미 뺐다 — 그 걸러진 줄(x.rows)과 겹치는 것만 */
function beCore(g){return g.rows.filter(function(r){return r.std>0&&r.u!=='A';}).slice(0,2).map(function(r){return r.k;});}
function beHoles(all){var base=beBase(),R=rankSuggest(base),out=[];
  (R.pick||[]).forEach(function(x){var core=beCore(x.g);
    x.rows.forEach(function(r){if((all||core.indexOf(r.k)>=0)&&out.indexOf(r.k)<0)out.push(r.k);});});return out;}
function beHoleOk(on){beS().holeOk=on?1:0;save();render();}
function beSnap(){try{BE.hist.push(JSON.stringify({b:S.before,a:S.after,s:S.be}));if(BE.hist.length>50)BE.hist.shift();}catch(e){}}
function beUndo(){if(!BE.hist.length)return;var o=JSON.parse(BE.hist.pop());S.before=o.b;S.after=o.a;S.be=o.s;BE.bref=S.before;BE.edit=null;save();render();beToast('하나 되돌렸어요');}
/* 다른 고객을 불러오면(KB · 견본 · 파일 — S.before 가 통째로 바뀜) 되돌리기와 「처음으로」 를 새로 센다.
   되돌리기도 S.before 를 바꾸므로 그때는 위에서 bref 를 맞춰 둔다 */
function beFresh(){if(BE.bref!==S.before){BE.bref=S.before;BE.p0={};BE.hist=[];BE.edit=null;BE.open=null;BE.q='';BE.more=0;}}
var beTT=0;
function beToast(t){var el=document.getElementById('beToast');if(!el){el=document.createElement('div');el.id='beToast';document.body.appendChild(el);}
  el.textContent=t;el.className='on';clearTimeout(beTT);beTT=setTimeout(function(){el.className='';},2400);}
function beRemember(x){var k=beKey(x);if(BE.p0[k])return;var p=x.p;
  BE.p0[k]=JSON.stringify({act:p.act||'keep',cov:p.cov||{},cov2:p.cov2||{},premMan:p.premMan||'',premMan2:p.premMan2||''});}
function beChanged(x){var o=BE.p0[beKey(x)],p=x.p;if(!o)return false;
  return o!==JSON.stringify({act:p.act||'keep',cov:p.cov||{},cov2:p.cov2||{},premMan:p.premMan||'',premMan2:p.premMan2||''});}

/* ── 누르는 것들 ── */
function beSel(sd,i){var x={p:S[sd][i],sd:sd,i:i},s=beS();s.sel=beKey(x);s.seen[beKey(x)]=1;BE.edit=null;BE.open=null;BE.q='';save();render();}
function beGo(sd,i){beSel(sd,i);setTimeout(function(){var c=document.getElementById('beCard');if(c)c.scrollIntoView({behavior:'smooth',block:'start'});},30);}
function beSetAct(i,a,ev){if(ev)ev.stopPropagation();var p=S.before[i],s=beS(),k=p.id||('before'+i);
  s.sel=k;s.seen[k]=1;if((p.act||'keep')===a){save();render();return;}beSnap();setAct(i,a);}
function beStep(k,dir){var x=beCur(),bag=x&&beBag(x);if(!bag)return;var L=BE_LAD[UNIT[k]]||[],v=num(bag[k])||0,n=v;
  if(dir>0){n=L.filter(function(y){return y>v;})[0];if(n===undefined)n=v;}
  else{var lo=L.filter(function(y){return y<v;});n=lo.length?lo[lo.length-1]:v;}
  if(n===v)return;beSnap();bag[k]=String(n);save();render();}
function beFill(k){var x=beCur(),bag=x&&beBag(x),g=beGap(k);if(!bag||!g)return;beSnap();
  bag[k]=String(Math.round(((num(bag[k])||0)+g)*100)/100);save();render();
  beToast(beNm(k)+' — 모자란 '+beAmt(k,g)+' 더해서 모두 합쳐 기준이 됐어요');}
function beDel(k){var x=beCur(),bag=x&&beBag(x);if(!bag)return;beSnap();delete bag[k];save();render();beToast(beNm(k)+' 뺐어요 — 잘못 눌렀으면 ↶ 되돌리기');}
function beBack(k){var x=beCur();if(!x||beAct(x)!=='endo')return;beSnap();x.p.cov2[k]=x.p.cov[k];save();render();}
function beAdd(k){var x=beCur(),bag=x&&beBag(x);if(!bag)return;var v=beFirst(k),g=beGap(k);beSnap();bag[k]=String(v);BE.q='';save();render();
  beToast(beNm(k)+' 넣었어요 — '+beAmt(k,v)+(g?' (모두 합쳐 기준까지)':''));}
function beNewPol(){return {id:nid(),co:'',nm:'',term:'',start:'',years:'',rnw:'',premMan:'',premMan2:'',act:'keep',kb:false,cov:{},cov2:{}};}
/* 빈 곳은 <b>새로 넣는 보험</b>에 — 고른 것이 새 보험이면 거기, 아니면 마지막 새 보험, 없으면 새 제안을 만든다 */
function beHole(k){var x=beCur(),t=(x&&x.sd==='after')?x.i:S.after.length-1,v=beFirst(k),s=beS();beSnap();
  if(t<0){S.after.push(beNewPol());t=S.after.length-1;}
  var p=S.after[t];if(!p.cov)p.cov={};p.cov[k]=String(v);var key=p.id||('after'+t);s.sel=key;s.seen[key]=1;save();render();
  beToast('「'+beName({p:p,sd:'after',i:t})+'」에 '+beNm(k)+' '+beAmt(k,v)+' 넣었어요');}
function beAddPol(){beSnap();var p=beNewPol(),s=beS();S.after.push(p);s.sel=p.id;s.seen[p.id]=1;save();render();}
function beReset(){var x=beCur();if(!x)return;var o=BE.p0[beKey(x)];if(!o)return;o=JSON.parse(o);beSnap();
  if(x.sd==='before')x.p.act=o.act;x.p.cov=o.cov;x.p.cov2=o.cov2;x.p.premMan=o.premMan;x.p.premMan2=o.premMan2;BE.edit=null;save();render();
  beToast('「'+beName(x)+'」 처음 상태로 돌렸어요');}
function beEdit(k){BE.edit=k;render();var el=document.getElementById('beIn');if(el){el.focus();el.select();}}
function beSetV(k,v){if(BE.edit!==k)return;BE.edit=null;var x=beCur(),bag=x&&beBag(x),c=covIn(v);
  if(bag&&c!==''&&num(c)!==null&&num(c)!==num(bag[k])){beSnap();bag[k]=c;}save();render();}
function beWhy(k){BE.open=(BE.open===k)?null:k;render();}
function beTold(on){var x=beCur();if(!x)return;beS().told[beKey(x)]=on?1:0;save();render();}
function bePrem(f,el){var x=beCur();if(!x)return;setPol(x.sd,x.i,f,manOfWon(el.value));wonEchoPut('we_be_'+f,el.value);beGuidePut();}
function beOld(){var x=beCur();if(!x)return;var key=x.sd+x.i;S.polOpen[x.p.id||key]=true;S.padOpen[key]=true;save();render();qkFocus(key);}
/* 찾기 칸은 한 번만 그린다 — 글자마다 칸을 다시 그리면 한글 조합이 끊긴다. 아래 단추 묶음(#beRes)만 다시 그림 */
function beQ(v){BE.q=v;var el=document.getElementById('beRes');if(el)el.innerHTML=beResHtml();}
function beResHtml(){var x=beCur(),bag=x&&beBag(x);if(!bag)return '';var q=BE.q.trim(),all=beHoles(true),holes=BE.more?all:beHoles(),L=[];
  var has=function(k){return num(bag[k])!==null;};
  if(q){STD.forEach(function(g){g.rows.forEach(function(r){if(L.length>=16||has(r.k))return;
      if((beNm(r.k)+' '+r.n+' '+g.mid+' '+(r.syn||[]).join(' ')).indexOf(q)>=0)L.push(r.k);});});}
  var h='';
  if(!q&&holes.length)h+='<div class="lb">🕳 아직 비어 있는 곳 — 누르면 기준 금액으로 들어가요</div><div class="chips">'+
    holes.filter(function(k){return !has(k);}).map(function(k){return '<button class="hot" onclick="beAdd(\''+k+'\')">＋ '+esc(beNm(k))+'</button>';}).join('')+
    (all.length>holes.length?'<button onclick="BE.more=1;beQ(BE.q)">다른 빈 곳 '+(all.length-holes.length)+'개 더 보기 ▾</button>':
      (BE.more&&all.length>beHoles().length?'<button onclick="BE.more=0;beQ(BE.q)">접기 ▴</button>':''))+'</div>';
  if(q)h+='<div class="lb">찾은 보장</div><div class="chips">'+(L.map(function(k){
      return '<button onclick="beAdd(\''+k+'\')">＋ '+esc(beNm(k))+(BE_EASY[k]?'':'')+'</button>';}).join('')||
      '<span class="none">없어요 — 이미 들어 있거나 다른 이름이에요. 약관 이름으로도 찾아보세요</span>')+'</div>';
  return h;}

/* ── 그리기 ── */
function beGuide(){
  var s=beS(),L=beList(),old=L.filter(function(x){return x.sd==='before';}),
    unseen=old.filter(function(x){return !s.seen[beKey(x)];}),hAll=beHoles(),holes=s.holeOk?[]:hAll,
    cx=old.filter(function(x){return beAct(x)==='cancel'&&!s.told[beKey(x)];}),
    np=L.filter(function(x){return x.sd==='after'&&num(x.p.premMan)===null;}),
    s3=!cx.length&&!np.length,now=unseen.length?1:(holes.length?2:(s3?4:3));
  var lab=['계약마다 정하기 '+(old.length-unseen.length)+'/'+old.length,'빈 곳 채우기'+(holes.length?' · 남은 '+holes.length+'개':(s.holeOk&&hAll.length?' · 이대로 둠':'')),'보험료 · 고객에게 말할 것'];
  var ok=[!unseen.length,!holes.length,s3];
  var h='<div class="gsteps">'+lab.map(function(t,i){return '<span class="'+(now===i+1?'now':(ok[i]?'ok':''))+'"><i>'+(ok[i]&&now!==i+1?'✓':(i+1))+'</i>'+t+'</span>';}).join('')+
    '<button class="mini gundo" onclick="beUndo()"'+(BE.hist.length?'':' disabled')+'>↶ 되돌리기'+(BE.hist.length?' ('+BE.hist.length+')':'')+'</button></div>';
  var t,b='';
  if(!L.length){t='👉 지금 할 일 — 위 ② 칸에 <b>KB 보장분석 PDF</b> 를 올리거나 <b>「+ 손으로 적기」</b> 를 누르세요.';}
  else if(now===1){var u=unseen[0];t='👉 지금 할 일 — <b>「'+esc(beName(u))+'」</b> 을 눌러 보고 그대로 · 일부 바꾸기 · 정리 중에 고르세요. 모르겠으면 <b>그대로</b>.';
    b='<button class="btn" onclick="beSel(\''+u.sd+'\','+u.i+')">이 계약 열기</button>';}
  else if(now===2){t='👉 지금 할 일 — 비어 있는 곳 <b>'+holes.length+'개</b> — '+holes.map(function(k){return esc(beNm(k));}).join(' · ')+'. 누르면 새 보험에 기준 금액으로 들어가요.';
    b='<button class="btn" onclick="beHole(\''+holes[0]+'\')">＋ '+esc(beNm(holes[0]))+' 넣기</button>'+
      '<button class="mini" onclick="beHoleOk(1)" title="채울지 말지는 설계사가 정합니다">빈 곳은 이대로 둘게요</button>';}
  else if(now===3&&np.length){t='👉 지금 할 일 — <b>「'+esc(beName(np[0]))+'」</b> 의 월 보험료를 아직 안 적었어요. 제안서에 적힌 금액을 적어 주세요.';
    b='<button class="btn" onclick="beSel(\''+np[0].sd+'\','+np[0].i+');setTimeout(function(){var e=document.getElementById(\'beP_premMan\');if(e)e.focus();},40)">적으러 가기</button>';}
  else if(now===3){t='👉 지금 할 일 — <b>「'+esc(beName(cx[0]))+'」</b> 을 정리해요. 고객에게 꼭 말할 것을 읽어 드렸는지 확인하세요.';
    b='<button class="btn" onclick="beSel(\''+cx[0].sd+'\','+cx[0].i+')">확인하러 가기</button>';}
  else{var C=calc();if(s.holeOk&&hAll.length)b='<button class="mini" onclick="beHoleOk(0)">빈 곳 다시 보기</button>';t='✅ 다 됐어요 — 월 보험료 지금 <b>'+fee(C.premB)+'</b> → 바꾸면 <b>'+fee(C.premA)+'</b>. 위 띠의 「👤 고객에게 보여주기」 로 넘어가세요.';}
  return h+'<div class="gnow"><span>'+t+'</span>'+b+'</div>';
}
function beGuidePut(){var e=document.getElementById('beGuide');if(e)e.innerHTML=beGuide();}
function beHtml(){
  beFresh();
  var L=beList(),x=beCur(),s=beS();
  L.forEach(beRemember);
  if(x&&!s.seen[beKey(x)]&&s.sel===beKey(x))s.seen[beKey(x)]=1;
  var h='<div class="card" id="beCard"><h2><span class="n">✏️</span>담보 고치기 — 한 곳에서</h2>'+
    '<p>담보 금액은 <b>여기 한 곳</b>에서 고칩니다. 왼쪽에서 계약을 고르고, <b>[−] [+]</b> 로 금액을 올리고 내리세요(숫자를 누르면 직접 적기). '+
    '오른쪽 요약과 ⑤ 표준표는 저절로 따라옵니다. 그대로 · 일부 바꾸기 · 정리 = 유지 · 배서 · 해지.</p>'+
    '<div class="guide" id="beGuide">'+beGuide()+'</div>';
  if(!x)return h+'</div>';
  /* 왼쪽 — 계약 목록 */
  var l='<div class="eg">지금 있는 보험</div>',ln='<div class="eg">새로 넣는 보험</div>',nNew=0;
  L.forEach(function(y){var a=beAct(y),k=beKey(y),bb=(a==='endo')?(y.p.cov2||{}):(y.p.cov||{}),n=0,kk;
    for(kk in bb)if(bb.hasOwnProperty(kk)&&num(bb[kk])!==null)n++;
    var pm=num(y.p.premMan),c='<div class="ep'+(k===beKey(x)?' on':'')+'" onclick="beSel(\''+y.sd+'\','+y.i+')">'+
      '<div class="co">'+esc(y.p.co||'회사 미상')+(y.sd==='before'&&!s.seen[k]?'<span class="dot">아직 안 봄</span>':'')+
        (a==='cancel'&&s.seen[k]?(s.told[k]?'<span class="dot ok">설명함</span>':'<span class="dot">설명 전</span>'):'')+'</div>'+
      '<div class="nm">'+esc(beName(y))+'</div>'+
      '<div class="mm">'+(pm===null?'보험료 아직':'월 '+fee(pm))+' · 보장 '+n+'개</div>';
    if(y.sd==='before')c+='<div class="seg">'+['keep','endo','cancel'].map(function(b){
      return '<button class="'+b+(a===b?' on':'')+'" onclick="beSetAct('+y.i+',\''+b+'\',event)">'+BE_ACT[b]+'</button>';}).join('')+'</div>';
    c+='</div>';if(y.sd==='before')l+=c;else{ln+=c;nNew++;}});
  if(!nNew)ln+='<div class="none">아직 없어요 — 빈 곳을 누르면 저절로 생겨요</div>';
  var left='<div class="bl">'+l+ln+'<button class="eadd" onclick="beAddPol()">＋ 새 보험 더하기</button>'+
    '<div class="none">제안서 PDF 는 위 ③ 칸에서 올리세요 — 여기에 저절로 섭니다.</div></div>';
  /* 가운데 — 고른 계약 */
  var a=beAct(x),p=x.p,bag=beBag(x),base=beBase(),why={keep:'그대로 두는 계약 — 보장이 그대로 「바꾸면」 에 남아요',
    endo:'일부 바꾸기 — 계약은 두고 보장만 바꿔요(배서). 뺀 줄은 ↺ 로 되살려요',
    cancel:'정리 — 이 계약의 보장은 「바꾸면」 에서 모두 빠져요(해지)',new:'새로 넣는 보험 — [−] [+] 로 금액을 고르세요. 빈 곳은 기준 금액으로 들어가요'}[a];
  var m='<div class="hd2"><div><h3>'+esc(p.co?p.co+' · ':'')+esc(beName(x))+'</h3><p>'+why+'</p></div><div class="hdr">'+
    '<span class="st '+a+'">'+({keep:'그대로 둬요',endo:'일부 바꿔요',cancel:'정리해요',new:'새로 들어요'})[a]+'</span>'+
    (beChanged(x)?'<button class="mini" onclick="beReset()">처음으로</button>':'')+'</div></div>';
  if(a==='new'||a==='endo'){var f=(a==='new')?'premMan':'premMan2',w=wonOfMan(p[f]);
    m+='<div class="prem"><label for="beP_'+f+'">'+(a==='new'?'월 보험료':'바꾼 뒤 월 보험료 (안 적으면 그대로)')+
      '<em class="wec" id="we_be_'+f+'">'+esc(wonEcho(w))+'</em></label><div class="uwr"><input id="beP_'+f+'" class="'+(a==='new'&&!w?'need':'')+'" value="'+esc(w)+'" '+
      'placeholder="'+(a==='new'?'제안서 금액':esc(wonOfMan(p.premMan)||'그대로'))+'" inputmode="numeric" onfocus="this.select()" oninput="bePrem(\''+f+'\',this)"><i>원</i></div></div>';}
  if(a==='keep'){var hs=beHoles();
    m+='<div class="lock">🔒 그대로 두는 계약이라 고칠 것이 없어요.<button class="mini" onclick="beSetAct('+x.i+',\'endo\')">보장을 바꾸려면 → 일부 바꾸기</button></div>';
    if(hs.length)m+='<div class="lock blu">💡 비어 있는 곳은 이 계약이 아니라 <b>새 보험</b>에 넣어요 — 누르면 바로 들어가요<div class="chips">'+
      hs.map(function(k){return '<button class="hot" onclick="beHole(\''+k+'\')">＋ '+esc(beNm(k))+'</button>';}).join('')+'</div></div>';}
  if(a==='cancel')m+='<div class="note w told"><b>🗣 정리하기 전에 고객에게 꼭 말할 것</b> (읽어 드리세요)<br>'+
    '보험계약자가 기존 보험계약을 해지하고 새로운 보험계약을 체결하는 과정에서<br>'+
    '① 질병이력, 연령증가 등으로 가입이 거절되거나 보험료가 인상될 수 있습니다.<br>'+
    '② 가입 상품에 따라 새로운 면책기간 적용 및 보장 제한 등 기타 불이익이 발생할 수 있습니다.<br>'+
    '아래 보장이 모두 빠져요. 같은 보장을 새 보험에 넣었는지 옆 요약에서 확인하세요.'+
    '<label><input type="checkbox"'+(s.told[beKey(x)]?' checked':'')+' onchange="beTold(this.checked)"> 고객에게 설명했어요</label></div>';
  var src=(a==='endo')?(p.cov2||{}):(p.cov||{}),u=[],k;
  STD.forEach(function(g){g.rows.forEach(function(r){var k2=r.k;
    if(num(src[k2])!==null||(a==='endo'&&num((p.cov||{})[k2])!==null))u.push(k2);});});
  var rows=u.map(function(k2){var vb=num((p.cov||{})[k2]),va=num(src[k2]),un=UNIT[k2],edit=!!bag,gone=(a==='endo'&&va===null)||a==='cancel',tag='';
    if(a==='endo'&&vb===null)tag='<em class="n">새로</em>';else if(a==='endo'&&va===null)tag='<em>빠짐</em>';else if(a==='endo'&&vb!==va)tag='<em>바뀜</em>';
    var vv=gone?vb:va,sd='',tg=rankTarget(k2),have=rankHave(k2,base);
    if(tg!==null&&un!=='A'&&!gone){var sum=(have!==vv)?('모두 합쳐 '+beAmt(k2,have)+' · '):'';
      sd=(have<tg)?'<button class="std lo"'+(edit?' onclick="event.stopPropagation();beFill(\''+k2+'\')" title="모자란 만큼 이 계약에 더해요"':' disabled')+'>'+sum+'기준 '+beAmt(k2,tg)+' · '+beAmt(k2,tg-have)+' 모자라요'+(edit?' → 채우기':'')+'</button>'
        :'<span class="std ok">✓ '+sum+'기준 '+beAmt(k2,tg)+' 채움</span>';}
    var lad=edit&&!gone&&un!=='A';
    var val=(BE.edit===k2&&edit&&!gone)?'<span class="vin"><input id="beIn" inputmode="text" value="'+esc(vv===null?'':String(vv))+'" onkeydown="if(event.key===\'Enter\')this.blur()" onblur="beSetV(\''+k2+'\',this.value)"><small>만원 · 「3천」 도 돼요</small></span>':
      '<button class="v"'+(edit&&!gone?' onclick="beEdit(\''+k2+'\')" title="눌러서 직접 적기"':' disabled')+'>'+beAmt(k2,vv)+(a==='endo'&&vb!==null&&va!==null&&vb!==va?'<small>지금 '+beAmt(k2,vb)+'</small>':'')+'</button>';
    var w=beWhen(k2);
    /* ? 는 26px 라 손가락 과녁으로 작다 — <b>이름 칸 전체</b>를 누르면 펴진다(44px 넘음 · check-read) */
    return '<div class="er'+(gone?' off':'')+'"><span class="ic">'+(MIC[k2]||'')+'</span><div class="t"'+
      (w?' role="button" tabindex="0" onclick="beWhy(\''+k2+'\')" title="눌러서 언제 나오는지 보기"':'')+'><b>'+esc(beNm(k2))+
      (w?'<span class="q" aria-hidden="true">?</span>':'')+tag+'</b><small>'+esc(NAME[k2]||k2)+'</small>'+sd+'</div>'+
      '<div class="stp">'+(lad?'<button onclick="beStep(\''+k2+'\',-1)" aria-label="줄이기">−</button>':'')+val+(lad?'<button onclick="beStep(\''+k2+'\',1)" aria-label="늘리기">＋</button>':'')+'</div>'+
      ((a==='endo'&&va===null)?'<button class="x" title="되살리기" onclick="beBack(\''+k2+'\')">↺</button>':(edit?'<button class="x" title="빼기" aria-label="빼기" onclick="beDel(\''+k2+'\')">✕</button>':'<span></span>'))+
      (BE.open===k2&&w?'<div class="when">💬 '+esc(w)+'</div>':'')+'</div>';}).join('');
  m+=rows||'<div class="blank">아직 보장이 없어요 — 아래 빨간 단추(비어 있는 곳)부터 넣어 보세요</div>';
  if(bag)m+='<div class="qadd"><input id="beQ" placeholder="🔎 보장 찾기 — 쉬운 말도 약관 말도 돼요 · 예) 암 · 뇌 · 입원 · 골절" value="'+esc(BE.q)+'" oninput="beQ(this.value)">'+
    '<div id="beRes">'+beResHtml()+'</div></div>';
  m+='<div class="old"><button class="mini" onclick="beOld()">'+(a==='keep'||a==='cancel'?'✍️ 읽어 온 금액이 틀렸으면 — 지금 담보 고치기':'✍️ 한 번에 적기(붙여넣기) · 부위별 칸 열기')+'</button></div>';
  return h+'<div class="ewrap">'+left+'<div class="emain">'+m+'</div></div></div>';
}

/* ── 모양 — #beCard 안에만 ── */
(function(){var st=document.createElement('style');st.textContent=[
'#beCard .guide{background:var(--bg);border-radius:14px;padding:12px 14px;margin:10px 0 14px}',
'#beCard .gsteps{display:flex;gap:6px;flex-wrap:wrap;align-items:center}',
'#beCard .gsteps span{display:flex;align-items:center;gap:6px;font-size:var(--t5,14px);font-weight:800;color:var(--gy);background:#fff;border-radius:20px;padding:6px 12px}',
'#beCard .gsteps span i{font-style:normal;width:22px;height:22px;border-radius:11px;background:var(--ln);color:var(--nv);display:grid;place-items:center;font-size:13px}',
'#beCard .gsteps span.now{background:var(--bl2);color:var(--blt)}#beCard .gsteps span.now i{background:var(--blt);color:#fff}',
'#beCard .gsteps span.ok{background:var(--gr2);color:var(--gr)}#beCard .gsteps span.ok i{background:var(--gr);color:#fff}',
'#beCard .gundo{margin-left:auto;min-height:44px}#beCard .gundo:disabled{color:var(--gy);background:var(--bg);cursor:default}',
'#beCard .gnow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:var(--t4,15px);font-weight:700;line-height:1.6;margin-top:10px;padding-top:10px;border-top:1px solid var(--ln)}',
'#beCard .gnow .mini{min-height:44px}#beCard .gnow span{flex:1;min-width:240px}#beCard .gnow b{color:var(--blt)}#beCard .gnow .btn{min-height:44px;font-size:var(--t5,14px)}',
'#beCard .ewrap{display:grid;grid-template-columns:286px minmax(0,1fr);gap:14px;align-items:start}',
'@media (max-width:860px){#beCard .ewrap{grid-template-columns:1fr}}',
'#beCard .eg{font-size:13px;font-weight:800;color:var(--gy);margin:4px 0 6px}',
'#beCard .ep{border:1.5px solid var(--ln);border-radius:12px;padding:9px 11px;margin-bottom:7px;cursor:pointer;background:#fff}',
'#beCard .ep.on{border-color:var(--bl);box-shadow:0 0 0 3px var(--bl2)}',
'#beCard .ep .co{font-size:13px;font-weight:700;color:var(--gy)}#beCard .ep .nm{font-size:var(--t4,15px);font-weight:800;color:var(--nv);margin:1px 0}',
'#beCard .ep .mm{font-size:13px;color:var(--gy)}',
'#beCard .dot{display:inline-block;font-size:13px;font-weight:800;color:var(--or);background:var(--or2);border-radius:6px;padding:0 6px;margin-left:5px}',
'#beCard .dot.ok{color:var(--gr);background:var(--gr2)}',
'#beCard .seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:7px}',
'#beCard .seg button{min-height:44px;border-radius:10px;border:1px solid var(--ln);background:#fff;font:inherit;font-size:13px;font-weight:800;color:var(--gy);cursor:pointer;padding:0 2px;white-space:nowrap}',
'#beCard .seg button.on.keep{background:var(--gr);color:#fff;border-color:var(--gr)}#beCard .seg button.on.endo{background:var(--or);color:#fff;border-color:var(--or)}',
'#beCard .seg button.on.cancel{background:var(--rd);color:#fff;border-color:var(--rd)}',
'#beCard .eadd{width:100%;min-height:44px;border-radius:12px;border:1.5px dashed var(--ln);background:#fff;font:inherit;font-weight:800;color:var(--gy);cursor:pointer;margin-top:2px}',
'#beCard .none{font-size:13px;color:var(--gy);margin:6px 2px}',
'#beCard .emain{border:1px solid var(--ln);border-radius:14px;padding:12px 14px;min-width:0}',
'#beCard .hd2{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:8px}',
'#beCard .hd2 h3{margin:0;font-size:var(--t3,17px)}#beCard .hd2 p{margin:3px 0 0;font-size:var(--t5,14px);color:var(--gy)}',
'#beCard .hdr{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}#beCard .hdr .mini{min-height:44px}',
'#beCard .st{font-size:13px;font-weight:800;border-radius:8px;padding:4px 9px;white-space:nowrap}',
'#beCard .st.keep{background:var(--gr2);color:var(--gr)}#beCard .st.endo{background:var(--or2);color:var(--or)}#beCard .st.cancel{background:#fff;color:var(--rd);box-shadow:inset 0 0 0 1px var(--rd)}#beCard .st.new{background:var(--bl2);color:var(--blt)}',
'#beCard .prem{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:4px 0 10px}#beCard .prem label{font-size:var(--t5,14px);font-weight:800}',
'#beCard .prem .uwr{display:flex;align-items:center;gap:6px}#beCard .prem input{width:150px;min-height:44px;text-align:right;font-weight:800}',
'#beCard .prem input.need{border-color:var(--rd)}',
'#beCard .lock{background:var(--bg);border-radius:12px;padding:10px 12px;font-size:var(--t5,14px);color:var(--gyd);margin-bottom:8px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}',
'#beCard .lock .mini{min-height:44px}#beCard .lock.blu{background:var(--bl2);color:var(--blt)}#beCard .lock .chips{width:100%}',
'#beCard .note.told label{display:flex;gap:8px;align-items:center;margin-top:8px;font-weight:800;cursor:pointer;min-height:44px}#beCard .note.told input{width:20px;height:20px}',
'#beCard .er{display:grid;grid-template-columns:28px minmax(0,1fr) auto 44px;gap:8px;align-items:center;padding:9px 2px;border-bottom:1px solid var(--ln)}',
'#beCard .er .ic{font-size:19px;text-align:center}',
'#beCard .er .t b{display:block;font-size:var(--t4,15px);line-height:1.35;color:var(--nv)}#beCard .er .t small{display:block;font-size:13px;color:var(--gy);margin-top:1px}',
'#beCard .er .t em{font-style:normal;font-size:13px;font-weight:800;color:var(--or);background:var(--or2);border-radius:6px;padding:0 6px;margin-left:4px}',
'#beCard .er .t em.n{color:var(--gr);background:var(--gr2)}',
'#beCard .er .t[role=button]{cursor:pointer;min-height:44px;border-radius:8px}#beCard .er .t[role=button]:hover b{color:var(--blt)}',
'#beCard .er .q{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:11px;background:var(--bg);color:var(--gyd);font-size:13px;font-weight:800;margin-left:5px;vertical-align:1px}',
'#beCard .std{display:inline-block;margin-top:4px;font:inherit;font-size:13px;font-weight:800;border-radius:7px;padding:2px 8px;border:0;text-align:left;line-height:1.4}',
'#beCard .std.lo{background:var(--or2);color:var(--or);cursor:pointer;min-height:32px}#beCard .std.ok{background:var(--gr2);color:var(--gr)}',
'#beCard .stp{display:flex;align-items:center;gap:4px}',
'#beCard .stp>button{width:44px;height:44px;border-radius:12px;border:1px solid var(--ln);background:#fff;font-size:20px;font-weight:800;cursor:pointer;color:var(--nv)}',
'#beCard .stp .v{min-width:108px;min-height:44px;text-align:center;font:inherit;font-size:var(--t3,16px);font-weight:800;line-height:1.2;border:0;background:none;color:var(--nv);cursor:text}',
'#beCard .stp .v:disabled{cursor:default;color:var(--gyd)}#beCard .stp .v small{display:block;font-size:13px;color:var(--gy);font-weight:700}',
'#beCard .vin{display:flex;flex-direction:column;align-items:center}#beCard .vin input{width:112px;min-height:44px;text-align:center;font-weight:800;border:1.5px solid var(--bl)}#beCard .vin small{font-size:13px;color:var(--gy)}',
'#beCard .er .x{width:44px;height:44px;border-radius:10px;border:0;background:none;color:var(--gy);font-size:18px;cursor:pointer}',
'#beCard .er .x:hover{background:var(--rd2);color:var(--rd)}',
'#beCard .er.off .t b{text-decoration:line-through;color:var(--gyd)}#beCard .er.off .ic{filter:grayscale(1)}',
'#beCard .er .when{grid-column:2/-1;font-size:var(--t5,14px);color:var(--gyd);background:var(--bg);border-radius:10px;padding:8px 10px}',
'#beCard .blank{border:2px dashed var(--ln);border-radius:12px;padding:14px;text-align:center;color:var(--gy);font-size:var(--t5,14px)}',
'#beCard .qadd{margin-top:12px;background:var(--bg);border-radius:12px;padding:10px}',
'#beCard .qadd input{width:100%;min-height:44px;font-size:var(--t4,15px)}',
'#beCard .lb{font-size:13px;font-weight:800;color:var(--gyd);margin:9px 0 6px}',
'#beCard .chips{display:flex;flex-wrap:wrap;gap:6px}',
'#beCard .chips button{min-height:44px;border-radius:22px;border:1px solid var(--ln);background:#fff;font:inherit;font-size:var(--t5,14px);font-weight:700;padding:0 13px;cursor:pointer;color:var(--nv)}',
'#beCard .chips button.hot{border-color:var(--rd);background:#fff;color:var(--rd)}',
'#beCard .old{margin-top:10px;text-align:right}#beCard .old .mini{min-height:44px}',
'#beToast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:var(--nv);color:#fff;border-radius:14px;padding:12px 18px;font-size:15px;font-weight:700;opacity:0;transition:opacity .2s;pointer-events:none;z-index:2147483000;max-width:calc(100% - 32px)}',
'#beToast.on{opacity:1}'
].join('\n');document.head.appendChild(st);})();
