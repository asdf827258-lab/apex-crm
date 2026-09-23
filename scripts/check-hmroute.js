/* <b>오늘 어디로 가시나</b> — 홈에서 약속과 그 주변을 한 장으로.

   사장님 말씀 — 「지역 동선도, 홈 화면에서 고객 만남 약속과 주변 TA 돌릴
   미션을 오늘 성공하게 해줘」.

   ★ 지역 동선을 <b>홈에 다시 만들지 않습니다</b> (5번). 길 찾기·지도·
     동네 찍기는 <b>DB 통합 CRM 한 곳</b>에만 있습니다. 홈은 오늘 어디로
     가는지와 그 근처에 걸 분이 몇인지만 보여 주고 그 도구로 넘깁니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 오늘 약속이 <b>시간 순서대로</b> 선다
     [2] 그 지역에서 <b>오늘 걸 분</b>이 같이 뜬다 — 간 김에 도는 사람
     [3] <b>지어내지 않는다</b> — 약속이 없으면 이름도 수도 안 짓고, 지역을
         모르는 줄은 안 붙이고, 못 읽었으면 「없다」고 말하지 않는다
     [4] 눌러서 <b>그 사람 것</b>으로 · 🗺️ 는 <b>CRM</b> 으로 간다
     [5] 서버를 <b>더 안 부른다</b> (7번)
     [6] 남의 약속이 <b>내 홈에 안 선다</b> (3번)                        */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8909;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* 견본 사람은 <b>홍길동</b> 입니다 (3번) */
const SEED=(opt)=>`
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
  /* CI 에는 네트워크가 있어 진짜 요청이 나갑니다. 늦게 돌아온 빈 손이
     심어 둔 것을 덮으면 <b>CI 에서만</b> 빨간불이 납니다 (8번). */
  window.osLoadProfile=function(){};
  window.osProfileApply=function(){};
  window.osShowLoginGate=function(){};
  window.arLoad=function(){};
  window.toast=function(){};
  GB.rows=[{id:'me',name:'홍길동',role:'owner',team:'t1',total:10,any:true,sc:{},
            raw:{att:0,run:0,call:0,cli:0,rep:0,stu:0},last:'',lastAtt:'',days:3}];
  GB.teams=[{id:'t1',name:'1팀'}]; GB.teamOf={me:'t1'};
  GB.loaded=true; GB.busy=false;
  AR.rep={}; AR.crm={}; AR.cli={}; AR.f='all'; AR.q='';
  AR.loaded=${opt.loaded===false?'false':'true'}; AR.busy=false; AR.cliRows=[];
  AR.open=''; AR.cat=''; AR.tkAll=false;
  (function(){
    var T=arToday();
    var ap=function(id,nm,rg,hm,who){
      return {id:id,who:who||'me',name:nm,region:rg,src:'일반',stage:'AP',
              appt:T+'T'+hm+':00',days:1,n:1,cAt:'',pAt:''}; };
    var due=function(id,nm,rg,st,d,who){
      return {id:id,who:who||'me',name:nm,region:rg,src:'일반',stage:st,
              appt:'',days:d,n:1,cAt:'',pAt:''}; };
    AR.db=${opt.empty?'[]':`[
      ap('p2','홍길순','순천시','14:00'),
      ap('p1','홍말순','순천시','09:30'),
      ${opt.noRegion?"ap('p9','홍무명','','11:00'),":""}
      due('n1','홍갑돌','순천시','PC',3),
      due('n2','홍을돌','순천 시','부재',9),
      due('n3','홍병돌','여수시','PC',3),
      due('n4','홍정돌','','미접촉',5),
      due('n5','홍무돌','순천시','미접촉',5),
      due('n6','홍오돌','순천시','부재',9),
      due('n7','홍육돌','순천시','PC',4),
      due('n8','홍칠돌','순천시','부재',12),
      ap('x1','남의고객','순천시','10:00','u9')
    ]`};
  })();`;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:900}});
  const page=await ctx.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
  await page.addInitScript(()=>{
    window.__net=[];
    const f=window.fetch;
    window.fetch=function(u){ window.__net.push(String(u).slice(0,90)); return f.apply(this,arguments); };
    /* 홈이 <b>실제로 칠해질 때까지</b> 기다릴 수 있게 한 겹 싼다 —
       시간을 세면 CI 에서만 어긋난다 (8번) */
    window.__home=async function(){
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
      go('home');
      if(typeof hmPaint==='function')hmPaint();
      if(typeof hmRtCss==='function')hmRtCss();
      await new Promise(r=>setTimeout(r,60));
    };
  });
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);

  console.log('\n[1] 오늘 약속이 <b>시간 순서대로</b> 선다');
  const A=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    const rows=c?[].slice.call(c.querySelectorAll('.hm-rt-r')):[];
    return { shown:!!c,
      times:rows.map(e=>(e.querySelector('.tm')||{}).textContent||''),
      names:rows.map(e=>(e.querySelector('.nm')||{}).textContent||''),
      regs:rows.map(e=>(e.querySelector('.rg')||{}).textContent||''),
      title:(c?(c.querySelector('.hm-rt-h b')||{}).textContent:'')||'' };
  },SEED({}));
  is(A.shown, '홈에 <b>「오늘 어디로 가시나」</b> 칸이 선다 — '+A.title);
  is(A.times.join(' · ')==='09:30 · 14:00',
     '<b>이른 약속부터</b> 선다 — '+A.times.join(' · ')+' (뒤죽박죽이면 하루를 못 짠다)');
  is(A.names.join(' · ')==='홍말순 · 홍길순', '이름이 그 시간에 붙는다 — '+A.names.join(' · '));
  is(A.regs.every(x=>/순천/.test(x)), '<b>어디인지</b>도 그 줄에 적는다 — '+A.regs.join(' · '));

  console.log('\n[2] 그 지역에서 <b>오늘 걸 분</b>이 같이 뜬다');
  const N=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    const chips=[].slice.call(c.querySelectorAll('.hm-rt-c'));
    return { txt:(c.querySelector('.hm-rt-n')||{}).textContent||'',
             chips:chips.map(e=>e.textContent.trim()),
             near:hmRtNear().map(x=>x.nm),
             more:chips.filter(e=>e.classList.contains('more')).length };
  },SEED({}));
  is(N.near.indexOf('홍갑돌')>=0, '같은 시(市) 사람이 <b>올라온다</b> — '+N.near.join(' · '));
  is(N.near.indexOf('홍을돌')>=0,
     '<b>「순천 시」 처럼 띄어 써도</b> 같은 곳으로 본다 — 견줄 때만 공백을 지운다');
  is(N.near.indexOf('홍병돌')<0, '<b>다른 시(여수)는 안 붙인다</b> — 간 김에 못 돈다');
  is(N.near.indexOf('홍정돌')<0, '<b>지역을 모르는 분은 안 붙인다</b> (1번) — 0 으로 세면 「없다」가 된다');
  is(/6명/.test(N.txt), '<b>몇 분인지</b> 적는다 — 「'+N.txt.replace(/\s+/g,' ').trim()+'」');
  is(N.more===1, '많으면 <b>「더 보기」</b> 하나로 접는다 — 홈이 목록이 되면 안 본다');

  console.log('\n[3] <b>지어내지 않는다</b> (1번)');
  /* ⚠ 2026-09-23 · 여기는 여태 「빈 날이면 칸을 아예 안 세운다」 를 봤습니다.
     사장님 말씀으로 <b>거꾸로</b> 바뀌었습니다 — 빈 날에 칸이 사라지면 그만큼
     밑엣것이 올라와 어제와 다른 화면이 되고, 「화면이 자꾸 달라서 힘들다」 가
     됩니다. 그래서 <b>자리는 지키되</b> 아래를 그대로 지킵니다 (1번) —
       · 이름도 시간도 <b>한 줄도 짓지 않는다</b>
       · 「주변에 몇 분」 같은 <b>수를 짓지 않는다</b>
       · 갈 데가 없다고 <b>말은 한다</b> — 빈 칸만 두면 고장 난 줄 안다
     느슨해진 것이 아닙니다. 「칸이 없다」 하나를 보던 자리가 <b>세 자리</b>로
     늘었고, 지어내면 그대로 빨간불입니다 (8번). */
  const Z=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    return { shown:!!c,
      rows:c?c.querySelectorAll('.hm-rt-r').length:0,
      chips:c?c.querySelectorAll('.hm-rt-c').length:0,
      txt:c?(c.textContent||'').replace(/\s+/g,' ').trim():'' };
  },SEED({empty:true}));
  is(Z.shown, '오늘 갈 데가 없어도 <b>자리는 그대로</b> 둔다 — 밑엣것이 올라와 어제와 다른 화면이 되지 않게');
  is(Z.rows===0&&Z.chips===0&&!/\d+\s*명/.test(Z.txt),
     '그 자리에 <b>이름도 수도 짓지 않는다</b> (1번) — 줄 '+Z.rows+' · 사람 '+Z.chips);
  is(/갈 데가 없습니다/.test(Z.txt),
     '<b>갈 데가 없다고 말한다</b> — 빈 칸만 두면 고장 난 줄 안다 — 「'+Z.txt.slice(0,44)+'…」');

  const W=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    return { shown:!!document.querySelector('#dynPane .hm-rt') };
  },SEED({loaded:false}));
  is(!W.shown, '<b>아직 못 읽었으면</b> 「없다」고 말하지 않는다 — 안 세운다');

  const R0=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    /* 약속은 있는데 <b>지역이 안 적힌</b> 날 */
    AR.db=AR.db.filter(x=>x.stage==='AP'&&x.who==='me').map(x=>{x.region='';return x;});
    await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    return { txt:c?((c.querySelector('.hm-rt-n0')||{}).textContent||''):'' };
  },SEED({}));
  is(/지역이 안 적혀/.test(R0.txt),
     '지역이 안 적혔으면 <b>그래서 못 찾았다</b>고 말한다 — 「'+R0.txt.replace(/\s+/g,' ').trim().slice(0,40)+'…」');

  console.log('\n[4] 눌러서 <b>그 사람 것</b>으로 · 🗺️ 는 CRM 으로');
  const C=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    let went=''; const g=window.go; window.go=function(t){went=t;};
    document.querySelector('#dynPane .hm-rt .hm-rt-r').click();
    const one={went,cat:AR.cat,open:AR.open,all:AR.tkAll};
    document.querySelector('#dynPane .hm-rt .hm-rt-go').click();
    const crm=went;
    window.go=g;
    return {one,crm};
  },SEED({}));
  is(C.one.went==='airep'&&C.one.cat==='touch'&&C.one.open==='p1',
     '약속 줄을 누르면 <b>TFA 에 그 고객이 펼쳐진다</b> — '+C.one.went+'/'+C.one.open);
  is(C.one.all===false, '<b>내 것</b>으로 연다 — 홈은 내 하루다 (3번)');
  is(C.crm==='crm', '🗺️ 를 누르면 <b>DB 통합 CRM</b> 으로 간다 — 길 찾기는 거기 한 곳이다 (5번)');

  const SRC=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const fn=SRC.slice(SRC.indexOf('function hmRtKey('),SRC.indexOf('function hmTmTeamName('));
  is(!/kakao|naver|map\.|길찾기|polyline|Polyline/i.test(fn),
     '홈 카드 안에 <b>지도를 다시 만드는 줄이 없다</b> (5번) — 두 벌이 되면 한쪽만 고친다');

  console.log('\n[5] 서버를 <b>더 안 부른다</b> (7번)');
  const NET=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    /* 카드를 그리는 <b>그 순간</b>만 센다 — 창을 열어 두고 세면 남의
       요청이 끼어들어 CI 에서만 빨간불이 난다 (8번) */
    const a=window.__net.length;
    hmRtHtml(); hmRtNear(); hmRtAppts(); hmRtCss();
    return window.__net.length-a;
  },SEED({}));
  is(NET===0, '카드를 그려도 <b>서버를 한 번도 안 부른다</b> — '+NET+'번 (이미 읽어 둔 것을 쓴다)');
  is(!/fetch\(|arLoad\(|\.from\(/.test(fn), '홈 카드 코드 안에 <b>서버를 부르는 줄이 없다</b>');

  console.log('\n[6] <b>남의 약속</b>이 내 홈에 안 선다 (3번)');
  const P=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    return { txt:c?c.textContent:'', mine:hmRtAppts().map(x=>x.nm) };
  },SEED({}));
  is(P.mine.indexOf('남의고객')<0&&!/남의고객/.test(P.txt),
     '남에게 배정된 약속은 <b>안 뜬다</b> — '+P.mine.join(' · '));

  console.log('\n[7] 콘솔');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 오늘 동선이 아직 못 미덥습니다')
                 :'✓ 홈에서 오늘 갈 곳과 그 주변을 한 장으로 봅니다.');
  process.exit(bad?1:0);
})();
