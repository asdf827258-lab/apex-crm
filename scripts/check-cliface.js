/* <b>고객 365일 얼굴</b> — 고객정보는 늘 눈에, 전·후는 바로 손에.

   사장님 말씀 —
     「고객정보 맨 위, 어디서든 볼 수 있도록 만들어주고」
     「보장분석 문서 / 보장분석 / 고객맞춤보장분석풀리포트 / 다 지워버려
      눈에 안보이게」
     「보장분석 전 / 후 자료가 여기에 뜨게끔 하고 이걸 읽어내서 터치할 수
      있도록 하고 싶어」

   상담 중에는 아래로 내려갈수록 <b>누구 화면인지</b> 사라졌습니다. 다시
   위로 올라가 이름을 확인하고 내려오기를 반복했습니다. 그리고 정작 제일
   많이 여는 <b>전·후</b> 는 저장된 자료 칸에 다른 것들과 섞여 있었습니다.

   ★ 세 칸은 <b>접어 둡니다. 지우지 않습니다.</b> PDF 를 거기로 올려야
     담보가 들어오고, 그 담보로 전·후가 만들어집니다. 통째로 없애면 그
     길이 끊깁니다 — 눈에서 치우되 한 번 눌러 펴실 수 있게 둡니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 고객정보가 <b>맨 위에 붙어</b> 내려가도 따라온다
     [2] 모르는 값을 <b>「모름」</b> 이라 적는다 — 빈칸은 0 으로 읽힌다 (1번)
     [3] 세 칸이 <b>접혀</b> 있다 — 그러나 펴면 그대로 있다
     [4] <b>전·후 자료</b>가 따로 서고 <b>눌러서</b> 열린다
     [5] 없으면 <b>없다고</b> 하고, 아직 못 읽었으면 「없다」고 안 한다 (1번)
     [6] 목록을 <b>두 번 안 읽는다</b> (7번)                              */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8911;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 견본 고객은 <b>홍길동</b> 입니다 (3번) */
const SEED=(o)=>`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
  window.osLoadProfile=function(){};window.osProfileApply=function(){};
  window.osShowLoginGate=function(){};window.arLoad=function(){};window.toast=function(){};
  /* 서버를 안 부르고 <b>화면만</b> 잽니다 — 여기서 재려는 것은 얼굴입니다 */
  window.osLoadDocs=function(){};window.osLoadAnalysis=function(){};
  window.osCallsLoad=function(){};window.frLoad=function(){};window.osBindDrop=function(){};
  window.osCliInfoLoad=function(){};
  OSC.view='detail';
  OSC.current={id:'c1',advisor_id:'me',name_masked:'홍○동',created_at:'2026-01-02T00:00:00Z',
               consent_status:'none'};
  CM_BASE={c1:${o.info===false?'{}':"{by:1980,gd:'M',inc:520,exp:300,ph:'010-0000-0000'}"}};
  OSC.repsLoaded=${o.loading?'false':'true'};
  OSC.reps=${o.none?'[]':`[
    {id:'r1',kind:'baba',title:'홍○동 님 비포&애프터',created_at:'2026-09-10T00:00:00Z',content:{md:'# 전·후\\n내용'}},
    {id:'r2',kind:'finance',title:'재무설계',created_at:'2026-09-09T00:00:00Z',content:{md:'x'}},
    {id:'r3',kind:'baba',title:'두 번째 전·후',created_at:'2026-08-01T00:00:00Z',content:{md:'# 또'}}
  ]`};`;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.addInitScript(()=>{
    window.__net=[];
    const f=window.fetch;
    window.fetch=function(u){ window.__net.push(String(u).slice(0,90)); return f.apply(this,arguments); };
    window.__open=async function(){
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
      go('clients');
      await new Promise(r=>setTimeout(r,80));
    };
  });
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  console.log('\n[1] 고객정보가 <b>맨 위에 붙어</b> 있다');
  const T=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const bar=document.getElementById('oscTopBar');
    if(!bar)return {has:false};
    const cs=getComputedStyle(bar);
    return { has:true, pos:cs.position, top:cs.top,
             txt:bar.textContent.replace(/\s+/g,' ').trim(),
             tel:!!bar.querySelector('a[href^="tel:"]'),
             ed:!!bar.querySelector('.ed'),
             /* 맨 위인가 — 뒤로 가기 줄 바로 다음이어야 한다 */
             first:(function(){
               const w=document.querySelector('#dynPane .osc-wrap');
               return !!(w&&w.children[1]&&w.children[1].id==='oscTopBar');
             })() };
  },SEED({}));
  is(T.has, '고객정보 <b>고정 줄</b>이 있다');
  is(T.pos==='sticky', '<b>붙어 있다</b>(sticky) — 내려가도 따라온다 · '+T.pos);
  is(T.first, '<b>맨 위</b>다 — 뒤로 가기 바로 밑');
  is(/홍○동/.test(T.txt), '이름이 <b>가린 채로</b> 선다 (3번) — '+T.txt.slice(0,44));
  is(/47세/.test(T.txt), '<b>나이</b>를 세어 적는다 — 1980년생 · 47세');
  is(/520만원/.test(T.txt), '<b>월 소득</b>이 만원 단위로 선다 (4번)');
  is(T.tel, '<b>눌러서 바로 전화</b>가 걸린다 — 번호를 옮겨 적지 않는다');
  is(T.ed, '<b>고치기</b> 가 있다 — 그 자리에서 칸으로 내려간다');

  console.log('\n[2] 모르는 값을 <b>「모름」</b> 이라 적는다 (1번)');
  const U=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const bar=document.getElementById('oscTopBar');
    return { txt:bar?bar.textContent.replace(/\s+/g,' ').trim():'',
             tel:!!(bar&&bar.querySelector('a[href^="tel:"]')) };
  },SEED({info:false}));
  is((U.txt.match(/모름/g)||[]).length>=3,
     '나이·성별·소득을 모르면 <b>「모름」</b> 이라 적는다 — '+U.txt.slice(0,50));
  is(!U.tel, '번호를 모르면 <b>전화 단추를 안 세운다</b> — 눌러 보고 나서야 알면 안 된다');

  console.log('\n[3] 예전 세 칸은 <b>접혀</b> 있다 — 그러나 지워지지 않았다');
  const F=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const d=document.getElementById('oscOld');
    const txtClosed=(document.querySelector('#dynPane .osc-wrap')||{}).innerText||'';
    if(d)d.open=true;
    const inside=d?d.textContent:'';
    return { has:!!d, open:d?d.open:null,
             closedShows:/보장분석 문서|고객 맞춤 보장분석 풀리포트/.test(txtClosed),
             drop:!!document.getElementById('oscDrop'),
             ana:!!document.getElementById('oscAnalysisPanel'),
             fr:!!document.getElementById('frPanel'),
             inside:/보장분석 문서/.test(inside)&&/고객 맞춤 보장분석 풀리포트/.test(inside) };
  },SEED({}));
  is(F.has, '세 칸이 <b>한 접이</b>로 묶여 있다');
  is(!F.closedShows, '<b>펴기 전에는 눈에 안 보인다</b> — 사장님 말씀대로');
  is(F.inside, '펴면 <b>보장분석 문서 · 풀리포트</b>가 그대로 있다');
  is(F.drop&&F.ana&&F.fr,
     '<b>지워지지 않았다</b> — PDF 를 거기로 올려야 담보가 들어오고 그 담보로 전·후가 만들어진다');

  console.log('\n[4] <b>전·후 자료</b>가 따로 서고 <b>눌러서</b> 열린다');
  const B=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const host=document.getElementById('oscBaHost');
    const rows=host?[].slice.call(host.querySelectorAll('.osc-ba-r')):[];
    const out={ has:!!host, n:rows.length,
                titles:rows.map(e=>(e.querySelector('.tt')||{}).textContent||''),
                /* 전·후 칸이 <b>저장된 자료 칸보다 위</b>에 있어야 손이 먼저 간다 */
                above:(function(){
                  const w=document.querySelector('#dynPane .osc-wrap');
                  if(!w||!host)return false;
                  const reps=document.getElementById('oscReps');
                  if(!reps)return false;
                  return !!(host.compareDocumentPosition(reps)&Node.DOCUMENT_POSITION_FOLLOWING);
                })() };
    if(rows.length){ rows[0].click(); await new Promise(r=>setTimeout(r,60)); }
    const ovl=[].slice.call(document.querySelectorAll('div')).filter(e=>/전·후/.test(e.textContent)&&e.style.position==='fixed');
    out.opened=ovl.length>0;
    if(ovl.length)ovl[0].remove();
    return out;
  },SEED({}));
  is(B.has, '<b>「🔄 보장분석 전·후」</b> 칸이 선다');
  is(B.n===2, '<b>전·후 것만</b> 골라 선다 — '+B.n+'건 (재무설계는 안 섞인다)');
  is(B.titles.join(' · ')==='홍○동 님 비포&애프터 · 두 번째 전·후',
     '<b>최근 것부터</b> 선다 — '+B.titles.join(' · '));
  is(B.above, '<b>저장된 자료 칸보다 위</b>에 있다 — 제일 많이 여는 것이 제일 위다');
  is(B.opened, '<b>눌렀더니 그 자리에서 열린다</b> — 화면을 옮겨 다니지 않는다');

  console.log('\n[5] <b>지어내지 않는다</b> (1번)');
  const N=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const h=document.getElementById('oscBaHost');
    return { txt:h?h.textContent.replace(/\s+/g,' ').trim():'',
             make:!!(h&&/만들기/.test(h.textContent)) };
  },SEED({none:true}));
  is(/아직 없습니다/.test(N.txt), '없으면 <b>없다고</b> 적는다 — 「'+N.txt.slice(0,40)+'…」');
  is(N.make, '<b>만들러 가는 길</b>을 보여 준다 — 없다고만 하면 거기서 끝난다');

  const L=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const h=document.getElementById('oscBaHost');
    return { txt:h?h.textContent:'' };
  },SEED({loading:true}));
  is(/찾는 중/.test(L.txt)&&!/아직 없습니다/.test(L.txt),
     '<b>아직 못 읽었으면</b> 「없다」고 말하지 않는다 — 읽는 중이라고 적는다');

  console.log('\n[5-1] <b>가입한 보험</b>이 그 자리에 선다');
  /* 사장님 말씀 — 「고객의 보험 내용도 고객 365에 입력하는데 뜰수 있게 해줘」.
     여태 이 자료는 <b>보장분석을 돌릴 때만</b> 읽어서 화면 어디에도 없었다. */
  const PL=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    /* 서버 대신 <b>손에 쥐여 준다</b> — 여기서 재려는 것은 화면이다 */
    OSCP={cid:'c1',busy:false,err:'',rows:[
      {id:'a',insurer:'삼성생명',product_name:'종합보장',monthly_premium:132000,payment_term:'20년납'},
      {id:'b',insurer:'',product_name:'실손',monthly_premium:null,payment_term:''}
    ]};
    oscPolPaint();
    const h=document.getElementById('oscPolHost');
    return { txt:h?h.textContent.replace(/\s+/g,' ').trim():'',
             rows:h?h.querySelectorAll('.osc-pol-r').length:0 };
  },SEED({}));
  is(PL.rows===2, '<b>가입한 보험</b> 칸에 계약이 선다 — '+PL.rows+'건');
  is(/132,000원\/월/.test(PL.txt), '<b>월 보험료가 원 단위</b>로 선다 (4번)');
  is(/보험료 확인 필요/.test(PL.txt),
     '<b>모르는 보험료를 0 으로 안 적는다</b> (1번) — 0 은 「보험료가 없다」는 뜻이 된다');
  is(/1건은 보험료 확인 필요/.test(PL.txt)&&/132,000원/.test(PL.txt),
     '<b>모르는 것은 합계에 안 더하고</b> 몇 건인지 말한다 — 「'+PL.txt.slice(0,60)+'…」');
  is(/회사 확인 필요/.test(PL.txt), '회사를 못 읽었으면 <b>확인 필요</b>라고 적는다');
  is(/심사 결과에 따릅니다/.test(PL.txt), '<b>「심사 결과에 따릅니다」</b> 를 빼지 않는다 (2번)');

  const PZ=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    OSCP={cid:'c1',busy:false,err:'',rows:[]}; oscPolPaint();
    const a=(document.getElementById('oscPolHost')||{}).textContent||'';
    OSCP={cid:'c1',busy:true,err:'',rows:null}; oscPolPaint();
    const b=(document.getElementById('oscPolHost')||{}).textContent||'';
    OSCP={cid:'c1',busy:false,err:'막힘',rows:null}; oscPolPaint();
    const c=(document.getElementById('oscPolHost')||{}).textContent||'';
    return {a,b,c};
  },SEED({}));
  is(/읽어 둔 계약이 없습니다/.test(PZ.a)&&/PDF/.test(PZ.a),
     '없으면 <b>없다고</b> 하고 어디에 올리는지 알려 준다');
  is(/찾는 중/.test(PZ.b)&&!/없습니다/.test(PZ.b),
     '<b>아직 못 읽었으면</b> 「없다」고 말하지 않는다');
  is(/못 읽었습니다/.test(PZ.c),
     '<b>못 읽었으면 못 읽었다</b>고 한다 — 빈 목록을 「없다」로 바꾸지 않는다 (1번)');

  console.log('\n[6] 목록을 <b>두 번 안 읽는다</b> (7번)');
  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const fn=SRC.slice(SRC.indexOf('function oscBaRows('),SRC.indexOf('function osClientDetailHtml('));
  is(!/\.from\(|fetch\(/.test(fn),
     '전·후 칸이 <b>서버를 따로 안 부른다</b> — 저장된 자료 목록을 그대로 쓴다 (5번)');
  const NET=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__open();
    const a=window.__net.length;
    oscBaHtml(); oscBaPaint(); oscTopHtml(OSC.current); oscTopPaint();
    return window.__net.length-a;
  },SEED({}));
  is(NET===0, '두 칸을 그려도 <b>서버를 한 번도 안 부른다</b> — '+NET+'번');

  console.log('\n[7] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 고객 365일 얼굴이 아직 안 맞습니다')
                 :'✓ 고객정보는 늘 눈에 있고, 전·후는 바로 손에 있습니다.');
  process.exit(bad?1:0);
})();
