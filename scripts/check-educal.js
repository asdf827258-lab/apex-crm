/* 📅 <b>APEX 교육 캘린더</b> — 앱 안에서 열리나 · <b>로그인을 또 묻지 않나</b> ·
   누구에게 보이나 · 뽑은 종이를 다시 읽을 수 있나.

   사장님 말씀 2026-10-23 —
   「교육캘린더 이미지도 그렇고 다 바궈줘 <b>토스 테마 아이콘 등 전부</b>
    바꿔줘 색상 까지」 → 「<b>2번</b>으로 하고 <b>로그인 창을 없애버려</b>
    이미 1차 로그인을 하니깐」

   ★★ <b>「로그인 창을 없애버려」 를 지키는 길은 「앱 안에 두는 것」 이었습니다.</b>
     새 탭으로 내보내면 주소가 달라 세션이 안 이어져 거기서 또 묻습니다.
     그래서 <b>덮개(#educalScreen)</b> 로 엽니다 — 상담자료·계산기가 쓰는
     그 패턴입니다(5번). 이 자가 지키는 것은 <b>그 약속</b>입니다.
   ★★ 「2번」 은 <b>교육매니저·지점장·대표만</b>입니다. 문을 여는 것은
     묶음의 role 이 아니라 <b>OS_KEY_ROLE[이름표]</b> 입니다 — 판 X173 에서
     재어 보고 알았습니다(role:'edu' 만 달았을 때 설계사에게도 보였습니다).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>로그인 칸이 한 곳도 없다</b> — 이 쪽에도, 길에도 (사장님 말씀)
     [2] <b>문</b> — 교육매니저·지점장·대표는 열리고, 리더·설계사는 닫힌다
     [3] <b>덮개로 열리고 다시 벗겨진다</b> — OS_FULL_MODES 에 이름이 있나
     [4] 색을 <b>또 적지 않는다</b> — app/ui.css 를 가리킨다 (5번)
     [5] <b>종이에서는 tnum 이 꺼진다</b> — 날짜·시간을 다시 읽으려면 (4-1)
     [6] 서버를 <b>안 부른다</b> — 적은 것은 이 기기에만 (7번)
     [7] 일곱 장이 <b>다 열린다</b> · 조용한가
   ⚠ <b>대비</b>와 <b>첫 장</b>의 글씨·단추는 <b>check-read</b> 가 셉니다.
     여기서는 그것을 또 세지 않고, <b>접힌 여섯 장</b>을 눌러서 봅니다 —
     check-read 는 열었을 때 서는 첫 장만 보므로 넷째 장의 34px 단추 둘을
     아무도 못 보고 있었습니다. 묻는 물음이 달라 두 자리인 것입니다 (5번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8993;
const PAGE = 'app/edu-cal.html';
const MIME = { '.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json' };
const STUB = fs.readFileSync(path.join(ROOT,'scripts/smoke.js'),'utf8').split('const STUB = `')[1].split('`;')[0];
const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(url.parse(q.url).pathname.split('?')[0]);
  if(p==='/')p='/index.html'; let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);s.end('');return;}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(s); });
let bad = 0;
const is = (ok,m)=>{ console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++; };
const sec = (t)=>console.log('\n'+t);

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const SRC = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const CAL = fs.readFileSync(path.join(ROOT,PAGE),'utf8');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  /* ⚠ 바깥은 끊습니다 — 글꼴 하나 때문에 CI 가 남의 서버에 매달리지 않습니다 (7번) */
  await ctx.route('**://**', rt=>{ const u=rt.request().url();
    if(u.indexOf('127.0.0.1:'+PORT)>=0)return rt.continue();
    return rt.fulfill({status:200,contentType:'text/css',body:''}); });
  const errs = [];

  sec('[1] ★★ <b>로그인 칸이 한 곳도 없다</b> (사장님 말씀)');
  is(!/type\s*=\s*["']password["']/i.test(CAL),
     '이 쪽에 <b>비밀번호 칸</b>이 없다 — 앱 로그인 하나로 끝입니다');
  is(!/\bsignIn\b|\bsignin\(/.test(CAL),
     '로그인을 <b>부르는 자리</b>가 없다');
  is(!/apex-hb-em\.netlify\.app/.test(CAL),
     '<b>따로 선 주소</b>로 넘기지 않는다 — 넘기면 거기서 또 묻습니다');
  /* 길도 봅니다 — 메뉴에서 새 탭 주소로 가면 약속이 깨집니다 */
  is(/var EDUCAL_URL='edu-cal\.html';/.test(SRC),
     '본체는 이 쪽을 <b>같은 자리(edu-cal.html)</b> 에서 부른다');

  sec('[2] ★★ <b>문</b> — 「2번」 은 교육매니저·지점장·대표만');
  const 봐야 = { owner:true, admin:true, branch_manager:true, education_manager:true,
                 leader:false, member:false };
  for(const role of Object.keys(봐야)){
    const pg = await ctx.newPage();
    pg.on('pageerror',e=>errs.push(role+': '+String(e).slice(0,90)));
    await pg.addInitScript(STUB);
    await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
    await pg.waitForTimeout(2300);
    const r = await pg.evaluate(ro=>{
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
      OS.profile={id:'t',name:'점검',role:ro,plan:'vip'};
      OS.session={user:{id:'t',email:'t@test'}}; window.toast=function(){};
      if(typeof renderNav==='function')renderNav();
      var el=document.getElementById('navMain');
      return { 문:(typeof osTabAllowed==='function')?!!osTabAllowed('educal'):null,
               기둥에:!!(el&&(el.textContent||'').indexOf('APEX 교육 캘린더')>=0) };
    },role);
    const want=봐야[role];
    is(r.문===want && r.기둥에===want,
       role.padEnd(18)+' → '+(want?'<b>보인다</b>':'<b>안 보인다</b>')+
       '  (문 '+(r.문?'열림':'닫힘')+' · 기둥 '+(r.기둥에?'섬':'안 섬')+')');
    await pg.close();
  }

  sec('[3] <b>덮개로 열리고 다시 벗겨진다</b>');
  /* ⚠ 이름이 OS_FULL_MODES 에 없으면 <b>「← 워크스페이스」 를 눌러도 안 벗겨집니다</b> —
     한장비교가 그 자리에서 데였습니다 (check-stayput 이 세는 그 목록). */
  is(/'educal-mode'/.test(SRC.split('var OS_FULL_MODES=')[1].split('];')[0]),
     'OS_FULL_MODES 에 <b>educal-mode</b> 가 적혀 있다 — 없으면 안 벗겨집니다');
  const pg = await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2300);
  const o = await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'t',name:'점검',role:'education_manager',plan:'vip'};
    OS.session={user:{id:'t',email:'t@test'}}; window.toast=function(){};
    go('educal');
    var f=document.getElementById('educalFrame');
    var app=document.querySelector('.app');
    return { 몸:document.body.className.indexOf('educal-mode')>=0,
             주소:f?(f.getAttribute('src')||''):'(칸이 없음)',
             앱가림:app?getComputedStyle(app).display:'(없음)',
             덮개:f?getComputedStyle(f.parentElement).display:'(없음)' };
  });
  is(o.몸, '몸에 <b>educal-mode</b> 가 붙는다');
  is(o.주소==='edu-cal.html', '덮개가 <b>edu-cal.html</b> 을 문다 — '+o.주소);
  is(o.앱가림==='none' && o.덮개==='block', '워크스페이스가 가려지고 덮개가 선다');
  const 뒤 = await pg.evaluate(()=>{ exitEducal();
    return { 몸:document.body.className.indexOf('educal-mode')>=0,
             앱:getComputedStyle(document.querySelector('.app')).display }; });
  is(!뒤.몸 && 뒤.앱!=='none', '「← 워크스페이스」 로 <b>다시 벗겨진다</b>');
  await pg.close();

  sec('[4] 색을 <b>또 적지 않는다</b> (5번)');
  is(/<link rel="stylesheet" href="ui\.css">/.test(CAL),
     '색표는 <b>app/ui.css 한 곳</b>에서 온다');
  is(!/prefers-color-scheme/.test(CAL),
     '<b>어두운 판이 없다</b> — 앱에 없어, 있으면 이 쪽만 혼자 다른 옷을 입습니다');
  is(/apex-icon\.js/.test(CAL),
     '아이콘은 <b>app/apex-icon.js</b> 한 곳에서 온다 — 선 그림입니다 (9번)');

  sec('[5] ★ <b>종이에서는 tnum 이 꺼진다</b> (4-1)');
  /* ⚠ <b>글자가 아니라 결과를 잽니다</b> — 철자가 둘(font-variant-numeric ·
     font-feature-settings)이라 글자로 막으면 다른 철자로 그대로 들어옵니다.
     check-pdfread 가 이미 그 자리에서 데였습니다 (8번). */
  const p2 = await ctx.newPage();
  p2.on('pageerror',e=>errs.push('캘린더: '+String(e).slice(0,90)));
  await p2.goto('http://127.0.0.1:'+PORT+'/'+PAGE,{waitUntil:'domcontentloaded',timeout:45000});
  await p2.waitForTimeout(1500);
  const 잰다 = async ()=>p2.evaluate(()=>{
    var 켜짐=[], seen={};
    [].slice.call(document.querySelectorAll('.monthnav .m,.tt th,.tt td,.ssum b,.cal .num'))
      .forEach(function(e){ if(!e.offsetParent)return;
        var c=getComputedStyle(e);
        if(/tabular/.test(c.fontVariantNumeric)||/tnum/.test(c.fontFeatureSettings)){
          var k=e.className||e.tagName; if(!seen[k]){seen[k]=1;켜짐.push(k);} } });
    return 켜짐;
  });
  await p2.emulateMedia({ media:'screen' });
  const 화면 = await 잰다();
  await p2.emulateMedia({ media:'print' });
  const 종이 = await 잰다();
  await p2.emulateMedia({ media:'screen' });
  is(화면.length>0, '화면에서는 숫자가 <b>나란히</b> 선다 — '+(화면.join(' · ')||'(한 곳도 없음)'));
  is(종이.length===0, '종이에서는 <b>꺼진다</b> — 켜져 있으면 '+
     (종이.join(' · ')||'(없음)')+' 에서 날짜·시간이 유니코드를 잃습니다');

  sec('[6] 서버를 <b>안 부른다</b> (7번)');
  /* 적은 것은 이 기기(localStorage)에만 남는다고 대장에 적었습니다 —
     그 말이 참말이어야 합니다 (1번). 늘려야 할 일이 생기면 이 줄을 보고
     <b>대장과 쪽지를 같이</b> 고치십시오. */
  const 부름 = ['fetch(','XMLHttpRequest','supabase','navigator.sendBeacon']
    .filter(k=>CAL.indexOf(k)>=0);
  is(부름.length===0, '서버를 부르는 자리가 없다'+(부름.length?(' ← '+부름.join(' · ')):''));
  is(/localStorage/.test(CAL), '적은 것은 <b>이 기기</b>에 남는다');

  sec('[7] 일곱 장이 <b>다 열린다</b>');
  const 장 = ['월간 캘린더','신입 교육 주간','팀별 교육','교육매니저 운영표',
              '본부장 루틴','공지 만들기','설정 · 저장'];
  const 탭 = await p2.evaluate(()=>[].slice.call(document.querySelectorAll('.tab'))
    .map(t=>(t.textContent||'').replace(/\s+/g,' ').trim()));
  const 빠짐 = 장.filter(k=>탭.indexOf(k)<0);
  is(빠짐.length===0, '일곱 장이 다 있다 — '+탭.length+'장'+
     (빠짐.length?(' ← 빠짐: '+빠짐.join(' · ')):''));
  /* ★★ <b>일곱 장을 하나하나 눌러서</b> 봅니다 — check-read 는 열었을 때
     서는 <b>첫 장</b>만 잽니다. 그래서 「신입 교육 주간」·「일반 주간」 두
     단추가 <b>34px</b> 인 것을 아무도 못 보고 있었습니다(넷째 장에 있습니다).
     접힌 장도 사장님은 누르십니다 — <b>안 보이는 자리가 제일 오래 썩습니다.</b>
     ⚠ 눌러 놓고 <b>기다린 뒤에</b> 잽니다 — 바로 재면 그리는 중에 재어
       수가 흔들립니다(헛 빨간불이 제일 나쁩니다 · 8번).                  */
  let 빈장 = [], 작은장 = [], 좁은장 = [];
  for(let i=0;i<탭.length;i++){
    await p2.evaluate(i=>{ var ts=document.querySelectorAll('.tab'); if(ts[i])ts[i].click(); },i);
    await p2.waitForTimeout(320);
    const m = await p2.evaluate(()=>{
      var v=[].slice.call(document.querySelectorAll('.view,.pane,section,[data-pane]'))
             .filter(function(e){return e.offsetParent;});
      var h=v.reduce(function(a,e){return a+e.getBoundingClientRect().height;},0);
      var tap=0,small=0;
      [].slice.call(document.querySelectorAll('button,a[role=button],.btn,[onclick]')).forEach(function(b){
        if(!b.offsetParent)return;
        if(b.querySelector('button'))return;
        if(b.parentElement&&b.parentElement.closest('button,[onclick],a[role=button],.btn'))return;
        var r=b.getBoundingClientRect(); if(r.width<4||r.height<2)return;
        if(Math.round(r.height)<44)tap++;
      });
      [].slice.call(document.querySelectorAll('*')).forEach(function(e){
        if(!e.offsetParent&&e.tagName!=='BODY')return;
        var t=[].slice.call(e.childNodes).filter(function(n){return n.nodeType===3;})
                .map(function(n){return n.nodeValue.trim();}).join('');
        if(!t)return;
        if(Math.round(parseFloat(getComputedStyle(e).fontSize))<13)small++;
      });
      return {h:h,tap:tap,small:small};
    });
    if(m.h<120) 빈장.push(탭[i]);
    if(m.tap>0) 좁은장.push(탭[i]+' '+m.tap+'개');
    if(m.small>0) 작은장.push(탭[i]+' '+m.small+'곳');
  }
  is(빈장.length===0, '눌러 보면 <b>어느 장도 비어 있지 않다</b>'+
     (빈장.length?(' ← 빈 장: '+빈장.join(' · ')):''));
  is(좁은장.length===0, '일곱 장 <b>어디에도 44px 밑 단추가 없다</b>'+
     (좁은장.length?(' ← '+좁은장.join(' · ')):'')) ;
  is(작은장.length===0, '일곱 장 <b>어디에도 13px 밑 글씨가 없다</b>'+
     (작은장.length?(' ← '+작은장.join(' · ')):'')) ;
  /* 로그인 칸은 <b>눌러 들어간 뒤에도</b> 없어야 합니다 */
  const 비번 = await p2.evaluate(()=>document.querySelectorAll('input[type=password]').length);
  is(비번===0, '일곱 장을 다 눌러 본 뒤에도 <b>비밀번호 칸이 0개</b>');
  await p2.close();

  sec('[8] 조용한가');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?' ← '+errs.slice(0,2).join(' · '):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad? '✗ '+bad+'개 — 교육 캘린더가 약속을 못 지키고 있습니다.'
                 : '✓ 교육 캘린더가 앱 안에서 로그인 없이 열리고, 볼 사람만 봅니다.');
  process.exit(bad?1:0);
})();
