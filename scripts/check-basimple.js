/* <b>보장분석 전·후 ③ 간편</b> — 고객이 고른 담보만, 한 장.

   사장님 말씀 — 「보장분석버전, 전체담보비교 / 시니어간소화 버전있는데
   <b>간편 버전해서, 핵심만 그리고, 고객이 선택한것만 볼수 있도록해.
   이미지도 간편 버전이니 새로이해</b>」.

   ① 전체는 설계사용이라 표가 깁니다. ② 시니어는 쉬운 말이지만 <b>무엇을
   볼지는 여전히 우리가</b> 정합니다. ③ 간편은 <b>고객이 고른 것만</b>
   봅니다 — 폰으로 마주 앉아 보여 드릴 때 쓰는 판입니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 모드가 <b>셋</b>이고 ③이 간편이다
     [2] 고르는 목록은 <b>읽어 낸 담보</b>뿐이다 — 없는 것을 안 세운다 (1번)
     [3] 처음에 <b>핵심 넷</b>이 골라져 있고, 눌러서 바꾸면 <b>남는다</b>
     [4] 고른 것이 <b>정말로</b> AI 에게 넘어간다 — 안 고른 것도 같이
     [5] <b>안 고른 것을 밝힌다</b> — 조용히 빼면 그 담보가 없는 것처럼 보인다
     [6] 그림은 <b>직접 그린 SVG</b> 다 (9번) · 그림이 숫자를 안 말한다
     [7] 간편이 아닐 때는 <b>자리를 안 먹는다</b>                        */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8915;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 견본 고객은 <b>홍길동</b> 입니다 (3번). 읽어 낸 담보는 다섯 갈래만
   — 아홉 갈래를 다 심으면 「없는 것을 안 세운다」 를 못 잽니다. */
const SEED=`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
  window.osLoadProfile=function(){};window.osProfileApply=function(){};
  window.osShowLoginGate=function(){};window.arLoad=function(){};window.toast=function(){};
  try{localStorage.removeItem('apex_baba_pick');}catch(e){}
  BABA_PICK=null;
  /* 자료에서 읽어 낸 계약 — 담보는 <b>다섯 갈래</b>만 들어 있다 */
  window.babaPlans=function(){
    return [{id:'p1',slot:'b',co:'삼성생명',nm:'기존종합',prem:132000,keep:'keep',
             cov:{'암':30000000,'뇌·심장':20000000,'실손':5000000}},
            {id:'p2',slot:'b',co:'현대해상',nm:'기존실손',prem:41000,keep:'keep',
             cov:{'수술·입원':3000000,'운전자·기타':1000000}}];
  };`;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:900}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2400);

  console.log('\n[1] 모드가 <b>셋</b>이고 ③이 간편이다');
  const M=await page.evaluate((seed)=>{
    (0,eval)(seed);
    let p=null; PDF_TOOLS.forEach(x=>{ if(x.id==='baba')p=x; });
    return { n:p?p.modes.length:0,
             ids:p?p.modes.map(m=>m.id):[],
             titles:p?p.modes.map(m=>m.title):[],
             desc:p?(p.modes[2]||{}).desc||'':'' };
  },SEED);
  is(M.n===3, '모드가 <b>셋</b>이다 — '+M.titles.join(' / '));
  is(M.ids[2]==='simple', '③이 <b>간편</b>이다 — '+M.ids.join(','));
  is(/고른 담보만/.test(M.desc), '설명에 <b>「고른 담보만」</b>이 적혀 있다');

  console.log('\n[2] 고르는 목록은 <b>읽어 낸 담보</b>뿐이다 (1번)');
  const A=await page.evaluate((seed)=>{
    (0,eval)(seed);
    return { all:babaPickAll(),
             /* INS_AREA 차례를 그대로 따르는가 — 여기서 또 적으면 두 벌이다 */
             order:INS_AREA.map(x=>x.k) };
  },SEED);
  is(A.all.length===5, '<b>읽어 낸 다섯 갈래</b>만 고르게 한다 — '+A.all.join(' · '));
  is(A.all.indexOf('치매·간병')<0&&A.all.indexOf('사망·장해')<0,
     '<b>자료에 없는 담보는 안 세운다</b> — 골라 놓고 빈칸이 나오면 안 된다 (1번)');
  is(JSON.stringify(A.all)===JSON.stringify(A.order.filter(k=>A.all.indexOf(k)>=0)),
     '<b>INS_AREA 차례 그대로</b> 선다 — 차례를 여기서 또 적지 않는다 (5번)');

  console.log('\n[3] 처음엔 <b>핵심 넷</b> · 바꾸면 <b>남는다</b>');
  const P=await page.evaluate((seed)=>{
    (0,eval)(seed);
    const first=babaPicked().slice();
    babaPickToggle('운전자·기타');
    const added=babaPicked().slice();
    const saved=(function(){try{return JSON.parse(localStorage.getItem('apex_baba_pick')||'[]')}catch(e){return []}})();
    /* <b>다시 연 척</b> — 적어 둔 것에서 다시 시작하는가 */
    BABA_PICK=null;
    const again=babaPicked().slice();
    babaPickReset();
    const reset=babaPicked().slice();
    return {first,added,saved,again,reset,core:BABA_CORE};
  },SEED);
  is(P.first.join(' · ')==='암 · 뇌·심장 · 실손 · 수술·입원',
     '처음엔 <b>핵심 넷</b>이 골라져 있다 — '+P.first.join(' · '));
  is(P.added.indexOf('운전자·기타')>=0, '눌러서 <b>더 고를 수 있다</b> — '+P.added.length+'가지');
  is(P.saved.indexOf('운전자·기타')>=0, '고른 것을 <b>적어 둔다</b> — 매번 다시 안 고르신다');
  is(P.again.indexOf('운전자·기타')>=0, '<b>다시 열어도 그대로</b>다 — '+P.again.join(' · '));
  is(P.reset.join(' · ')==='암 · 뇌·심장 · 실손 · 수술·입원',
     '<b>「핵심 넷으로」</b> 가 되돌려 준다 — 못 돌아오면 갇힌다');

  console.log('\n[4] 고른 것이 <b>정말로</b> AI 에게 넘어간다');
  const B=await page.evaluate((seed)=>{
    (0,eval)(seed);
    let p=null; PDF_TOOLS.forEach(x=>{ if(x.id==='baba')p=x; });
    setPdfMode('baba','simple');
    const o=collectPdfOpts(p);
    const parts=[{slot:'기존 보장분석 PDF',name:'a.pdf',text:'기존 담보 글'},
                 {slot:'신규 제안서 1',name:'b.pdf',text:'신규 담보 글'}];
    const r=p.build(parts,o);
    return { mode:o.mode, picked:o.picked, rest:o.rest,
             user:r.user||'', system:r.system||'', max:r.max };
  },SEED);
  is(B.mode==='simple', '③ 간편을 고르면 <b>그 모드로</b> 간다 — '+B.mode);
  is((B.picked||[]).join(' · ')==='암 · 뇌·심장 · 실손 · 수술·입원',
     '고른 담보가 <b>그대로</b> 실린다 — '+(B.picked||[]).join(' · '));
  is(/암 · 뇌·심장 · 실손 · 수술·입원/.test(B.user),
     'AI 에게 보내는 글에 <b>고른 담보가 적혀</b> 있다');
  is(/고른 담보 줄만/.test(B.user), '<b>고른 줄만</b> 만들라고 시킨다');
  is(B.max&&B.max<3800, '<b>짧게</b> 받는다 — '+B.max+'자 (전체·시니어보다 짧다)');

  console.log('\n[5] <b>안 고른 것을 밝힌다</b> (1번)');
  is((B.rest||[]).join(' · ')==='운전자·기타',
     '안 고른 담보를 <b>따로 들고 간다</b> — '+(B.rest||[]).join(' · '));
  is(/고르지 않아 뺀 담보/.test(B.user)&&/운전자·기타/.test(B.user),
     'AI 에게 <b>뺀 담보를 알려 준다</b> — 조용히 빼면 그 담보가 없는 것처럼 보인다');
  is(/없어지는 것은 아닙니다/.test(B.user),
     '「<b>뺐다고 그 담보가 없어지는 것은 아닙니다</b>」 를 적게 한다');
  is(/심사 결과에 따릅니다/.test(B.user), '「<b>심사 결과에 따릅니다</b>」 를 빼지 않는다 (2번)');
  is(/자료에 없음/.test(B.user)&&/숫자를 만들지 않는다/.test(B.system),
     '읽어 낸 값이 없으면 <b>「자료에 없음」</b> — 숫자를 지어내지 않는다 (1번)');

  const F=await page.evaluate((seed)=>{
    (0,eval)(seed);
    setPdfMode('baba','simple');
    const box=document.createElement('div'); box.id='babaPickBox';
    document.body.appendChild(box);
    box.innerHTML=babaPickBoxHtml();
    return { txt:box.textContent.replace(/\s+/g,' ').trim(),
             chips:box.querySelectorAll('.baba-pick-c').length,
             on:box.querySelectorAll('.baba-pick-c.on').length,
             small:[].slice.call(box.querySelectorAll('.baba-pick-c'))
                     .filter(e=>e.getBoundingClientRect().height<40).length };
  },SEED);
  is(F.chips===5&&F.on===4, '화면에도 <b>다섯 중 넷</b>이 켜져 선다 — '+F.on+'/'+F.chips);
  is(/안 고른 1가지/.test(F.txt)&&/운전자·기타/.test(F.txt),
     '화면에서도 <b>뺀 것을 이름으로</b> 말한다 — 「'+F.txt.slice(0,64)+'…」');
  is(F.small===0, '칩이 <b>손가락으로 누를 만하다</b> — 40px 아래면 폰에서 빗나간다');

  console.log('\n[6] 그림은 <b>직접 그린 SVG</b> 다 (9번)');
  const S=await page.evaluate((seed)=>{
    (0,eval)(seed);
    return { svg:babaSimpleSvg(['암','실손']), none:babaSimpleSvg([]) };
  },SEED);
  is(/^<svg/.test(S.svg), '<b>SVG 로 그린다</b> — 사진은 인쇄에서 뭉개진다 (9번)');
  is(!/<img|background-image|\.png|\.jpg/.test(S.svg), '<b>남의 그림을 안 붙인다</b> (9번)');
  is(/role="img"/.test(S.svg)&&/aria-label=/.test(S.svg), '그림에 <b>이름</b>이 붙어 있다');
  is(/암/.test(S.svg)&&/실손/.test(S.svg)&&!/뇌·심장/.test(S.svg),
     '<b>고른 담보만</b> 그린다 — 암 · 실손');
  is(!/[0-9]{3,}원|만원|억/.test(S.svg),
     '그림이 <b>금액을 말하지 않는다</b> — 표와 그림이 각자 숫자를 말하면 갈린다 (5번)');
  is(/보기용/.test(S.svg), '<b>「막대 길이는 보기용」</b> 이라고 적는다 — 길이를 금액으로 읽으면 안 된다 (1번)');
  is(/고르신 담보가 없습니다/.test(S.none), '하나도 안 고르면 <b>그렇다고 적는다</b>');

  console.log('\n[7] 간편이 아닐 때는 <b>자리를 안 먹는다</b>');
  const O=await page.evaluate((seed)=>{
    (0,eval)(seed);
    setPdfMode('baba','full');   const a=babaPickBoxHtml();
    setPdfMode('baba','senior'); const b=babaPickBoxHtml();
    setPdfMode('baba','simple'); const c=babaPickBoxHtml();
    return {a:a.length,b:b.length,c:c.length};
  },SEED);
  is(O.a===0&&O.b===0, '① 전체 · ② 시니어에서는 <b>안 선다</b> — 안 쓰는 칸은 자리를 안 먹는다');
  is(O.c>0, '③ 간편에서는 <b>선다</b>');

  console.log('\n[8] 자료가 없을 때 — <b>지어내지 않는다</b> (1번)');
  const Z=await page.evaluate((seed)=>{
    (0,eval)(seed);
    window.babaPlans=function(){return [];};
    return { all:babaPickAll(), html:babaPickHtml() };
  },SEED);
  is(Z.all.length===0, '읽어 낸 담보가 없으면 <b>목록이 빈다</b>');
  is(/읽어 낸 담보가 없습니다/.test(Z.html)&&/PDF/.test(Z.html),
     '<b>왜 비었는지</b> 적고 무엇을 하면 되는지 말한다');

  console.log('\n[9] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 간편판이 아직 못 미덥습니다')
                 :'✓ 간편판은 고객이 고른 담보만, 뺀 것은 뺐다고 말합니다.');
  process.exit(bad?1:0);
})();
