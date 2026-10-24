/* 🎓 <b>교육시스템EM</b> — 기둥 맨 위에 서나 · <b>누구에게 보이나</b> · 어디로 가나.

   사장님 말씀 2026-10-23 —
   「타 세션에 있는 <b>교육매니저 em 전용 사이트</b>를 메뉴 <b>맨 왼쪽 위</b>에다가
    넣어줄래 <b>교육시스템EM</b> 이라는 목록으로 넣어줘」

   그 사이트는 <b>따로 선 주소</b>입니다 — https://apex-hb-em.netlify.app
   (APEX HB · EM 전용 운영센터 · 대시보드·주간 마감·업적 입력·월급 정산·
    시책 관리·팀원·시책 자료실·수수료/시책표·데이터 아홉 칸).

   ★★ <b>여기서 제일 중요한 것은 「문」 입니다.</b> 팀 업적·시책·<b>월급</b>을
     다루는 자리라, 메뉴에 이름이 뜨는 것만으로도 「저게 뭔가」 가 됩니다.
     교육매니저·지점장·대표에게만 보여야 합니다.
   ★★ 만들면서 <b>실제로 틀렸던 자리</b>라 이 자를 세웁니다 — 묶음에
     role:'edu' 를 달면 될 줄 알았는데 <b>설계사에게도 그대로 보였습니다.</b>
     문을 여는 것은 묶음의 role 이 아니라 <b>OS_KEY_ROLE[열쇠]</b> 였습니다.
     재어 보고 알았습니다 (8번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 주소가 <b>한 곳</b>에 적혀 있고 새 탭으로 열린다 (5번)
     [2] <b>문</b> — 교육매니저·지점장·대표는 열리고, 리더·설계사는 닫힌다
     [3] 기둥 <b>맨 위</b>에 「교육시스템EM」 이름표로 선다
     [4] 화면을 열면 <b>주소 말고는 지어낸 것이 없다</b> (1번)
   ⚠ 사이트 <b>안쪽</b>은 안 봅니다 — 거기 데이터베이스가 정합니다.
     이 자가 바깥으로 나가면 CI 가 남의 서버에 매달립니다 (7번).        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8997;
const SITE = 'https://apex-hb-em.netlify.app';
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

  sec('[1] 주소가 <b>한 곳</b>에 적혀 있나 (5번)');
  const n = (SRC.match(/apex-hb-em\.netlify\.app/g)||[]).length;
  is(n===1, '본체에 그 주소가 <b>'+n+'번</b> 적혀 있다 — 한 번이어야 합니다');

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  /* ⚠ 바깥은 끊습니다 — 남의 서버에 매달리지 않습니다 (7번) */
  await ctx.route('**://**', rt=>{ const u=rt.request().url();
    if(u.indexOf('127.0.0.1:'+PORT)>=0)return rt.continue();
    return rt.fulfill({status:200,contentType:'application/javascript',body:''}); });
  const errs=[];

  sec('[2] ★★ <b>문</b> — 누구에게 보이나');
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
      var lab=el?[].slice.call(el.querySelectorAll('.t-glab')).map(function(x){return x.textContent.trim();}):[];
      return { 문:(typeof osTabAllowed==='function')?!!osTabAllowed('emcenter'):null,
               맨위:lab[0]||'', 이름표:lab.indexOf('교육시스템EM')>=0,
               기둥에:!!(el&&(el.textContent||'').indexOf('EM 전용 운영센터')>=0) };
    },role);
    const want=봐야[role];
    is(r.문===want && r.기둥에===want,
       role.padEnd(18)+' → '+(want?'<b>보인다</b>':'<b>안 보인다</b>')+
       '  (문 '+(r.문?'열림':'닫힘')+' · 기둥 '+(r.기둥에?'섬':'안 섬')+')');
    if(want) is(r.맨위==='교육시스템EM',
       '   └ 기둥 <b>맨 위</b> 이름표가 「교육시스템EM」 — '+(r.맨위||'(없음)'));
    else is(r.맨위==='오늘 하루',
       '   └ 안 보이는 사람에게는 맨 위가 <b>「오늘 하루」</b> 그대로 — '+(r.맨위||'(없음)'));
    await pg.close();
  }

  sec('[3] 눌러서 <b>열어 본다</b>');
  const pg = await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2300);
  const o = await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'t',name:'점검',role:'education_manager',plan:'vip'};
    OS.session={user:{id:'t',email:'t@test'}}; window.toast=function(){};
    go('emcenter');
    var d=document.getElementById('dynPane');
    var a=d?d.querySelector('a[href*="apex-hb-em"]'):null;
    var txt=(d&&d.textContent||'').replace(/\s+/g,' ');
    return { 제목:((d&&d.querySelector('.page-title'))||{}).textContent||'',
             주소:a?a.getAttribute('href'):'', 새탭:a?(a.getAttribute('target')||''):'',
             안전:a?(a.getAttribute('rel')||''):'', 글:txt.slice(0,300) };
  });
  is(o.제목==='EM 전용 운영센터', '화면 이름이 <b>EM 전용 운영센터</b> — '+(o.제목||'(없음)'));
  is(o.주소===SITE, '단추가 <b>그 주소</b>로 간다 — '+(o.주소||'(없음)'));
  is(o.새탭==='_blank', '<b>새 탭</b>으로 연다 — 보던 자리를 안 잃습니다');
  is(/noopener/.test(o.안전), 'rel 에 <b>noopener</b> 가 있다');

  sec('[4] <b>지어낸 것이 없나</b> (1번)');
  /* 꾸밈표는 esc() 를 지나 글자 그대로 찍힙니다 — 실제로 그랬습니다 */
  is(o.글.indexOf('<b>')<0 && o.글.indexOf('</b>')<0,
     '화면에 <b>꺾쇠가 글자로</b> 안 찍힌다 — esc() 를 지나는 자리입니다');
  /* 그쪽에 있는 칸 이름만 적습니다 — 실제로 열어 보고 받아 적은 아홉입니다 */
  const 칸 = ['대시보드','주간 마감','업적 입력','월급 정산','시책 관리','팀원','자료실','데이터'];
  const 빠짐 = 칸.filter(k=>o.글.indexOf(k)<0);
  is(빠짐.length===0, '그쪽 칸 이름을 <b>적어 둔 그대로</b> 적는다'+
     (빠짐.length?(' ← 빠짐: '+빠짐.join(' · ')):''));
  is(/한 번 더 로그인/.test(o.글),
     '<b>한 번 더 로그인</b>해야 한다고 미리 말한다 — 주소가 달라 세션이 안 이어집니다');

  sec('[5] 조용한가');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?' ← '+errs.slice(0,2).join(' · '):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad? '✗ '+bad+'개 — 교육시스템EM 이 제자리에 없습니다.'
                 : '✓ 교육시스템EM 이 맨 위에 서고, 볼 사람에게만 보입니다.');
  process.exit(bad?1:0);
})();
