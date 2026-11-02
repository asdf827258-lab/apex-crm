/* <b>오늘 어디로 가시나</b> — 홈에서 약속과 그 주변을 한 장으로.

   사장님 말씀 — 「지역 동선도, 홈 화면에서 고객 만남 약속과 주변 TA 돌릴
   미션을 오늘 성공하게 해줘」.

   ★ 지역 동선을 <b>홈에 다시 만들지 않습니다</b> (5번). 길 찾기·지도·
     동네 찍기는 <b>DB 통합 CRM 한 곳</b>에만 있습니다. 홈은 오늘 어디로
     가는지와 그 근처에 걸 분이 몇인지만 보여 주고 그 도구로 넘깁니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 오늘 약속이 <b>시간 순서대로</b> 선다
     [2] 그 지역에서 <b>오늘 걸 분</b>이 같이 뜬다 — 간 김에 도는 사람
     [3] <b>지어내지 않는다</b> — 아무도 없으면 이름도 수도 안 짓고, 지역을
         모르는 줄은 안 붙이고, 못 읽었으면 「없다」고 말하지 않는다
     [3-1] <b>약속만 없는 날</b>에는 빈손으로 두지 않는다 (판 X142)
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
    /* 📞 번호 — 판 X217. 한 분은 <b>일부러 비워</b> 둡니다. 「번호 없음」 과
       「있다」 가 같은 글이면 자가 눈을 감습니다 (1번·8번).            */
    var due=function(id,nm,rg,st,d,who,ph){
      return {id:id,who:who||'me',name:nm,region:rg,src:'일반',stage:st,
              phone:(ph===undefined?'010-0000-0000':ph),
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
      due('n8','홍칠돌','순천시','부재',12,'me',''),
      ${opt.many?`
      due('m1','홍구돌','순천시','PC',3),
      due('m2','홍십돌','순천시','부재',9),
      due('m3','홍열한','순천시','PC',4),
      due('m4','홍열두','순천시','부재',11),
      due('m5','홍열석','순천시','PC',6),
      due('m6','홍열넉','순천시','부재',13),`:''}
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
             more:chips.filter(e=>e.classList.contains('more')).length,
             /* 📞 판 X217 — 전화 자리가 줄마다 서는가 · 걸리는가 */
             tel:c.querySelectorAll('.hm-rt-tel').length,
             telNo:c.querySelectorAll('.hm-rt-tel.no').length,
             telHref:c.querySelectorAll('a.hm-rt-tel[href^="tel:"]').length,
             tel1:((c.querySelector('a.hm-rt-tel[href^="tel:"]')||{}).getAttribute
                   ? c.querySelector('a.hm-rt-tel[href^="tel:"]').getAttribute('href') : '') };
  },SEED({}));
  is(N.near.indexOf('홍갑돌')>=0, '같은 시(市) 사람이 <b>올라온다</b> — '+N.near.join(' · '));
  is(N.near.indexOf('홍을돌')>=0,
     '<b>「순천 시」 처럼 띄어 써도</b> 같은 곳으로 본다 — 견줄 때만 공백을 지운다');
  is(N.near.indexOf('홍병돌')<0, '<b>다른 시(여수)는 안 붙인다</b> — 간 김에 못 돈다');
  is(N.near.indexOf('홍정돌')<0, '<b>지역을 모르는 분은 안 붙인다</b> (1번) — 0 으로 세면 「없다」가 된다');
  is(/6명/.test(N.txt), '<b>몇 분인지</b> 적는다 — 「'+N.txt.replace(/\s+/g,' ').trim()+'」');
  /* ★★ <b>2026-10-26 (판 X217) — 다섯에서 열로.</b> 사장님 말씀 — 「오늘 어디로
     가시나는, <b>추천해서 여기에 띄어주라고 10명</b> - 그리고 <b>전화할수 있도록</b>
     지역동선에서 띄우는 칸을 띄어주고」.
     ★ 그래서 <b>두 판</b>을 봅니다 — 여섯뿐이면 <b>안 접고</b>, 열보다 많으면
       <b>열만 세우고 「더 보기」 하나</b>. 전에는 여섯 판 하나만 보았고, 바를
       열로 올리는 순간 「더 보기」 를 <b>아무도 안 재게</b> 될 뻔했습니다 (8번). */
  is(N.more===0, '<b>열까지는 안 접는다</b> — 여섯 분이면 「더 보기」 가 없다 (판 X217)');
  is(N.tel>=6 && N.telNo===1,
     '  ★ 줄마다 <b>📞 전화</b>가 선다 — ' + N.tel + '자리 · 번호 없는 분 ' + N.telNo +
     '명은 <b>「번호 없음」</b> 이라고 적는다 (1번)');
  is(N.telHref>=5 && /^tel:0100000/.test(N.tel1||''),
     '  ★ <b>진짜 걸리는 자리</b>다 — ' + (N.tel1||'(없다)') + ' (' + N.telHref + '자리)');

  const M=await page.evaluate(async(seed)=>{
    (0,eval)(seed); await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    const chips=[].slice.call(c.querySelectorAll('.hm-rt-c'));
    return { 줄:c.querySelectorAll('.hm-rt-one').length,
             more:chips.filter(e=>e.classList.contains('more')).length,
             txt:(c.querySelector('.hm-rt-n')||{}).textContent||'' };
  },SEED({many:true}));
  is(M.줄===10, '열보다 많으면 <b>열만</b> 세운다 — ' + M.줄 + '줄 (판 X217)');
  is(M.more===1, '많으면 <b>「더 보기」</b> 하나로 접는다 — 홈이 목록이 되면 안 본다');
  is(/12명/.test(M.txt), '그래도 <b>몇 분인지</b>는 다 적는다 — 「' + M.txt.replace(/\s+/g,' ').trim() + '」');

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

  console.log('\n[3-1] <b>약속만 없는 날</b> — 빈손으로 두지 않는다 (판 X142)');
  /* ★★ 2026-10-20 · 사장님 말씀 「왜 지역동선에 추천인들이 안 떠」.
     위 [3] 은 <b>아무도 없는 날</b>(AR.db=[]) 을 재고 있었습니다. 그래서
     맞는 말이었지만, 사장님이 실제로 맞으시는 날 — <b>약속만 없고 사람은
     그대로 계신 날</b> — 을 아무도 안 재고 있었습니다. 그 날 앱은
     「8분을 하루로 묶으시면」 이라고 수까지 적어 놓고 <b>그 8분이 누구인지는
     한 명도 안 보여 줬습니다.</b> hmRtNear·hmRtMeet 가 약속이 0건이면 그
     자리에서 빈 배열을 돌려주고 있었기 때문입니다.
     여기는 <b>그 날</b>을 잽니다. 「지어내지 말라」 를 느슨하게 한 것이
     아닙니다 — 약속 줄·시각은 여전히 0 이어야 하고, 뜨는 분은 모두 AR.db 에
     <b>실제로 있는 분</b>이어야 하고, 그 동네 분이 아니면 안 뜨어야 합니다. */
  const Y=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    /* 약속만 지웁니다 — <b>사람은 그대로</b> 계십니다.
       ★ 홍을돌(순천 시)을 만나야 할 단계로 올려 둡니다. 그러면 지역을
         <b>날글로 묶는 자</b>(hmRtRgTop 4분)와 <b>공백을 지워 묶는 자</b>
         (hmRtMeet 5분)의 수가 갈립니다 — 화면이 어느 쪽을 적는지 보려고
         일부러 갈라 둡니다 (8번). */
    AR.db.forEach(x=>{ x.appt=''; if(x.id==='n2')x.stage='PC'; });
    await window.__home();
    const c=document.querySelector('#dynPane .hm-rt');
    const T=(c.textContent||'').replace(/\s+/g,' ').trim();
    const chip=[].slice.call(c.querySelectorAll('.hm-rt-c:not(.more)'))
                 .map(e=>(e.firstChild&&e.firstChild.textContent||'').trim());
    const row=[].slice.call(c.querySelectorAll('.t-row .nm')).map(e=>e.textContent.trim());
    const fh=c.querySelector('.hm-fold-h');
    return { shown:!!c, txt:T, chip:chip, row:row,
      apr:c.querySelectorAll('.hm-rt-r').length, hhmm:/\d\d:\d\d/.test(T),
      /* 머리글 — 접힌 채로 <b>보이는 글</b>입니다 */
      ttl:fh?((fh.querySelector('.t')||{}).firstChild||{}).textContent||'':'',
      sub:fh?((fh.querySelector('.t span')||{}).textContent||''):'',
      btn:fh?fh.tagName.toLowerCase():'', exp:fh?fh.getAttribute('aria-expanded'):'',
      bodyIn:(()=>{ const b=c.querySelector('.hm-fold-b');
        return b?{chip:b.querySelectorAll('.hm-rt-c').length,row:b.querySelectorAll('.t-row').length}
                :{chip:0,row:0}; })(),
      bodyH:(()=>{ const b=c.querySelector('.hm-fold-b');
        return b?Math.round(b.getBoundingClientRect().height):0; })(),
      /* 🧭 <b>추천 줄 · 이름 알약</b> — 판 X249 에서 접이 <b>밖</b>으로
         나왔습니다. 접힌 채로도 보이는 글은 이제 여기입니다. */
      rec:(()=>{ const r=c.querySelector('.hm-rt-why');
        return r?{ t:((r.querySelector('b')||{}).textContent||''),
                   s:((r.querySelector('span[data-ask]')||{}).textContent||''),
                   h:Math.round(r.getBoundingClientRect().height) }
                :{t:'',s:'',h:0}; })(),
      pill:[].slice.call(c.querySelectorAll('.hm-rt-p:not(.more)'))
             .map(e=>({n:(e.textContent||'').trim(),
                       h:Math.round(e.getBoundingClientRect().height)})),
      note:(c.querySelector('.t-note.g')||{}).textContent||'',
      ask:[].slice.call(c.querySelectorAll('[data-ask="권한동네몇분"]'))
             .map(e=>(e.textContent.match(/\d+/)||[''])[0]),
      topn:(hmRtWhere().top[0]||{}).n, meetn:hmRtMeet().length,
      real:AR.db.map(x=>x.name) };
  },SEED({}));
  is(Y.shown&&Y.apr===0&&!Y.hhmm,
     '약속이 없으니 <b>시간 줄도 시각도 안 짓는다</b> (1번) — 줄 '+Y.apr+' · 시각 '+(Y.hhmm?'있음':'없음'));
  is(Y.chip.length>0&&Y.row.length>0,
     '★ 그래도 <b>사람이 선다</b> — 걸 분 '+Y.chip.length+'명 · 만나야 할 분 '+Y.row.length+
     '명 (여기가 0 이면 사장님이 보신 그 빈 화면이다)');
  /* ⬆ <b>판 X249 — 보는 자리가 접이 머리글에서 「추천 줄」 로 옮겼습니다.</b>
     사장님 말씀 (2026-10-30) 「칸을 너무 잡아 먹는거 같아, <b>오른쪽에
     조그만하게</b>」 → 여쭈니 「권하는 동네 + 걸 분 이름칩」 을 고르셨습니다.
     추천을 접이 <b>밖</b>으로 꺼냈으니 묻는 자리도 따라갑니다.
     ★ 묻는 것은 <b>그대로</b>입니다 — 「왜 그 동네인지 접지 않아도 적나」. */
  is(/순천시/.test(Y.rec.t)&&/권합니다/.test(Y.rec.t)&&/제일 많은/.test(Y.rec.s),
     '<b>왜 그 동네인지</b> 접지 않아도 적는다 — 「'+Y.rec.t+'」 · 「'+Y.rec.s+'」');
  is(Y.rec.h>0, '  ★ 그 줄이 <b>정말 보인다</b> — '+Y.rec.h+'px');
  /* ★ 머리글은 <b>몇 분인지 말하고 누르는 단추</b>입니다 (6번) — 사람은
     안쪽에 다 들어 있습니다.
     ⚠ <b>판 X248 에서 처음부터 펴 둡니다.</b> 전에는 접어 두었고, 그 까닭을
       「펴 두면 홈이 4.68화면이 되어 <b>4.2 선</b>을 넘는다」 고 여기 적어
       두었습니다. 2026-10-30 사장님 말씀 — 「지역동선하고 <b>내가 추천
       띄우고</b> 뉴스부터 멘트까지 오늘 한칸에서 다 할 수 있도록 했는데
       안되어있어서」. 그래서 <b>그 선을 사장님이 직접 놓아 주셨습니다</b>
       (「홈이 길어져도 괜찮다」) — 4.2 → 4.3 으로 올린 자리는
       `check-homeone` 의 `HOME_SCR` 한 곳이고, 왜 올렸는지도 거기 적혀
       있습니다. ★ <b>제가 느슨하게 한 것이 아닙니다</b> (8번).
     ★ 묻는 것은 <b>그대로</b>입니다 — 단추이고, 몇 분인지 말하고, 사람이
       안쪽에 다 있습니다. <b>처음 상태만</b> 「접힘」 → 「펴짐」 입니다.
     ★ 손으로 접으면 <b>접힌 채로 기억합니다</b> — 그쪽은 `check-homeone`
       [1-a2] 가 봅니다(기본값보다 사람 손이 이깁니다).                    */
  /* ★★ <b>걸 분 이름이 접지 않아도 보입니다</b> (판 X249) — 사장님이 두 번
     말씀하신 「추천인들」 입니다(판 X142 「왜 지역동선에 추천인들이 안떠」).
     ⚠ 알약도 <b>손가락 바닥 44px</b> 입니다 — 작게 보이려고 줄이지 않습니다. */
  is(Y.pill.length>0&&Y.pill.every(p=>p.h>=44),
     '★★ <b>걸 분 이름이 알약으로 접지 않아도</b> 선다 — '+Y.pill.length+'개 · '+
     (Y.pill[0]?Y.pill[0].h:0)+'px');
  is(Y.btn==='button'&&Y.exp==='false'&&/\d+분/.test(Y.sub),
     '접이는 <b>안에 든 것을 말하고 누르는 단추</b>다 (판 X249) — 「'+Y.sub+
     '」 · '+Y.btn+' · 펴짐 '+Y.exp);
  is(Y.bodyIn.chip>0&&Y.bodyIn.row>0,
     '사람은 <b>그 안에 다 들어 있다</b> — 칩 '+Y.bodyIn.chip+
     '개 · 줄 '+Y.bodyIn.row+'개 (접으시면 기억합니다 · hmFoldOpen)');
  /* ★★ <b>접힌 것이 정말 접혔나</b> — aria 만 보면 거저 통과합니다 (8번).
     속이 <b>높이를 안 가지는지</b> 로 잽니다. 판 X249 에서 뜻이 뒤집혔습니다. */
  is(Y.bodyH===0,
     '  ★★ 접힌 속이 <b>정말 안 보인다</b> — 높이 '+Y.bodyH+'px');
  const 지어낸=[].concat(Y.chip,Y.row).filter(nm=>nm&&Y.real.indexOf(nm)<0);
  is(지어낸.length===0,
     '뜨는 분은 <b>모두 AR.db 에 실제로 있는 분</b>이다 (1번) — 지어낸 이름 '+지어낸.length+'개'+
     (지어낸.length?(' ← '+지어낸.join(' · ')):''));
  is(!/홍병돌/.test(Y.txt)&&!/홍정돌/.test(Y.txt)&&!/남의고객/.test(Y.txt),
     '<b>다른 시(여수)·지역 모르는 분·남의 고객은 안 뜬다</b> — 권한 동네만 넓어지면 안 된다 (1·3번)');
  /* ⬆ 판 X249 — 추천 줄이 <b>셋째 자리</b>가 되었습니다. 수가 늘어도
     묻는 것은 그대로 — <b>다 같은 수인가</b>. 두 곳으로 못 박아 두면
     자리가 늘 때마다 헛 빨간불이 켜집니다 (8번). */
  is(Y.ask.length>=2&&Y.ask.every(v=>v===Y.ask[0])&&Y.ask[0]===String(Y.meetn),
     '권한 줄과 「가시는 김에」 줄이 <b>같은 수</b>를 말한다 — '+Y.ask.join(' / ')+
     ' (hmRtMeet '+Y.meetn+' 하나가 센다 · 날글로 묶으면 '+Y.topn+' 이라 갈린다) (5번)');
  /* ★ 줄이 아예 없으면 이 자가 <b>거저 통과</b>합니다 — 있는지도 함께 봅니다 (8번) */
  is(!!Y.note&&!/더 계십니다/.test(Y.note),
     '약속이 없는 날엔 <b>「더」 를 안 붙인다</b> — 그 분들이 바로 위에 말한 그 분들이다 — 「'+
     Y.note.replace(/\s+/g,' ').trim()+'」');
  is(/순천시로 권합니다/.test(Y.rec.t),
     '<b>받침에 맞는 말</b>로 적는다 — 「순천시<b>로</b>」 (「순천시 로」 라고 찍힌 적이 있다)');

  const JO=await page.evaluate(async(seed)=>{
    (0,eval)(seed);
    AR.db.forEach(x=>{ x.appt=''; if(x.region)x.region='서울 강남'; });
    await window.__home();
    const c=document.querySelector('#dynPane .hm-rt'),r=c&&c.querySelector('.hm-rt-why');
    return { none:r?((r.querySelector('b')||{}).textContent||''):'' };
  },SEED({}));
  is(/서울 강남으로 권합니다/.test(JO.none),
     '<b>받침이 있으면 「으로」</b> — 묻는 곳은 hmRo 하나다 (5번) — 「'+
     JO.none.replace(/\s+/g,' ').trim().slice(0,46)+'…」');

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
