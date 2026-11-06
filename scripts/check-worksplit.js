/* 🗂 <b>업무구분</b> — 담당자별 할 일 (판 X361)

   사장님 말씀 2026-11-06 — 회의 「담당자별 할 일」 표(그림)를 주시며
   「이 부분을 업무구분으로 짓고, html로 수정할 수 있도록 만들어」.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 메뉴 · 덮개 자리 — TABS · TAB_META · NAV_WHEN · OS_FULL_MODES · go · Esc · 지도
     [2] ★ 처음 표가 회의 그림 그대로다 — 담당자 여덟 · 할 일 47 · 정할 것 셋 (지어 넣은 줄 0 · 1번)
     [3] ★★ 칸을 눌러 고치면 남는다 — 글 고치기 · 할 일 더하기(Enter) · 지우기 · 완료 · 다시 열어도 그대로
     [4] ★★ 고칠 수 있는 사람 — 판단은 APEX_KV.canOrg() 한 곳 (5번)
           EM → 고친다 · 보기 권한 → 단추·체크가 잠긴다 · 권한 모름 → 「모릅니다」 라고 적는다 (1번)
     [5] ★★ 조직 한 벌로 올라간다 — ORG_KEYS 에 열쇠 · 두 기기 첫 맞춤에 담당자 줄이 두 벌로 안 붙는다
     [6] 다른 기기에서 고친 표가 오면 다시 그린다 (storage 소식)
     [7] 종이 — 띠·단추가 안 나오고 tnum 이 없다 (4-1번) · 흰색 고정 · 서버를 따로 안 부른다 (7번)
     [8] ★★ 「무엇을 문의하시나요?」 — 설계사가 「누구에게 묻지?」 를 바로 찾나
           청구 → 이미라 실장 · 박주미 매니저 · 띄어 친 「고객 등록」 도 찾나 · 이름으로도 · 단추는 표에 있는 일만 ·
           담당이 아직 안 정해진 일(제안서 출력)은 「안 정해졌다」 고 말하나 · 없는 말은 「없습니다」 · #q= 주소
     [9] ★★ 내보내기 — 한 파일로 받아, 인터넷을 다 막고 열어도 같은 표 · 찾기가 되나 · 고치는 단추가 없나 ·
           이 기기 저장소를 안 쓰나 · ui.css 없이도 색이 서나
     [11] 🖼 이미지 — 폭 1080 세로 한 장 · 사람 여덟 · 찾는 중이면 걸린 사람만 · PNG 로 내려받나 · 바깥 0
     [10] ★★ 내 수정용 — 받은 파일에서 고치고 · 다시 열어도 남고 · 앱의 팀 표 열쇠와 안 섞이고 ·
           거기서 고친 표로 설계사용(보기 전용)을 다시 뽑나 · 인터넷 0
   ⚠ 되돌려 보았습니다(8번) — canOrg 를 빼면 [4] · 감싸기(doc)를 풀면 [5] · ORG_KEYS 에서 빼면 [5]
     · OS_FULL_MODES 에서 빼면 [1] 이 웁니다.                                                     */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 9361;
const PAGE = 'app/worksplit.html';
const MIME = { '.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json' };
const STUB = fs.readFileSync(path.join(ROOT,'scripts/smoke.js'),'utf8').split('const STUB = `')[1].split('`;')[0];
/* 바깥 창 흉내 — APEX_KV.canOrg 가 무엇을 답하나만 바꿉니다 */
const host = c => '<!doctype html><meta charset="utf-8"><script>window.APEX_KV={canOrg:function(){return '+c+';}};</script>'+
  '<iframe id="f" src="/app/worksplit.html" style="width:1100px;height:900px"></iframe>';
const srv = http.createServer((q,s)=>{
  const u = url.parse(q.url,true); let p = decodeURIComponent(u.pathname);
  if(p==='/__host'){ s.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); s.end(host(u.query.c)); return; }
  if(p==='/')p='/index.html'; let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);s.end('');return;}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(s); });
let bad = 0;
const is = (ok,m)=>{ console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++; };
const sec = t=>console.log('\n'+t);

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const SRC = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const WS  = fs.readFileSync(path.join(ROOT,PAGE),'utf8');
  const KV  = fs.readFileSync(path.join(ROOT,'app/apex-kv-sync.js'),'utf8');
  const MAP = fs.readFileSync(path.join(ROOT,'app/apex-map.html'),'utf8');

  sec('[1] 메뉴 · 덮개 자리');
  is(/\{id:'worksplit',tk:'조직',icon:'[^']+',title:'업무구분',/.test(SRC), 'TABS 에 「업무구분」');
  is(/\n worksplit:\{tag:'조직 관리',title:'업무구분/.test(SRC), 'TAB_META.worksplit');
  is(/\n worksplit:'run',/.test(SRC), "NAV_WHEN.worksplit = 'run'");
  is(/'worksplit-mode'/.test(SRC.split('var OS_FULL_MODES=')[1].split('];')[0]), 'OS_FULL_MODES 에 worksplit-mode — 없으면 「← 워크스페이스」 로 안 벗겨집니다');
  is(/var WORKSPLIT_URL='worksplit\.html';/.test(SRC) && (SRC.match(/worksplit\.html'/g)||[]).length===1, '주소는 WORKSPLIT_URL 한 곳 (5번)');
  is(/contains\('worksplit-mode'\)\)exitWorksplit\(\)/.test(SRC), 'Esc 로 나간다');
  is(/"id": "worksplit"/.test(MAP) && /"worksplit": \{/.test(MAP), '지도(apex-map)에 선다');

  const br = await chromium.launch();
  const ctx = await br.newContext({viewport:{width:1200,height:900}});
  /* 127.0.0.1 밖은 전부 끊습니다 — 점검이 사장님 진짜 서버를 읽지 않게 (check-netblock) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [];

  /* 덮개로 열리고 벗겨진다 — 본체를 실제로 띄워 봅니다 */
  {
    const pg = await ctx.newPage();
    pg.on('pageerror',e=>errs.push('본체: '+String(e).slice(0,90)));
    await pg.addInitScript(STUB);
    await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
    await pg.waitForTimeout(2300);
    const o = await pg.evaluate(()=>{
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
      OS.profile={id:'t',name:'점검',role:'owner',plan:'vip'};
      OS.session={user:{id:'t',email:'t@test'}}; window.toast=function(){};
      go('worksplit');
      var f=document.getElementById('worksplitFrame'), app=document.querySelector('.app');
      return { 몸:document.body.classList.contains('worksplit-mode'), 주소:f?(f.getAttribute('src')||''):'(없음)',
               앱:app?getComputedStyle(app).display:'', 덮개:f?getComputedStyle(f.parentElement).display:'',
               물음:!!(window.APEX_KV&&typeof APEX_KV.canOrg==='function') };
    });
    is(o.몸 && o.주소==='worksplit.html' && o.앱==='none' && o.덮개==='block', 'go(\'worksplit\') — 덮개가 worksplit.html 을 물고 워크스페이스를 가린다');
    is(o.물음, '본체의 APEX_KV 가 canOrg 를 내놓는다 — 안쪽 화면이 권한을 여기 묻습니다');
    const 뒤 = await pg.evaluate(()=>{ exitWorksplit(); return document.body.classList.contains('worksplit-mode'); });
    is(!뒤, '「← 워크스페이스」 로 다시 벗겨진다');
    await pg.close();
  }

  sec('[2] ★ 처음 표가 회의 그림 그대로');
  const p = await ctx.newPage();
  p.on('pageerror',e=>errs.push('업무구분: '+String(e).slice(0,90)));
  p.on('dialog',d=>d.accept());
  const net = [];
  p.on('request',r=>{ const u=r.url(); if(!u.startsWith('http://127.0.0.1:'+PORT)) net.push(u); });
  await p.goto('http://127.0.0.1:'+PORT+'/'+PAGE,{waitUntil:'load',timeout:45000});
  await p.evaluate(()=>{ localStorage.removeItem('apex_worksplit_v1'); }); await p.reload({waitUntil:'load'});
  const 셈 = () => p.evaluate(()=>({
    줄:document.querySelectorAll('.ws-card').length,
    일:document.querySelectorAll('.ws-card .ws-it').length,
    정할:document.querySelectorAll('.ws-extra .ws-it').length,
    담당:[].map.call(document.querySelectorAll('.ws-card .ws-name'),e=>e.textContent),
    제목:document.querySelector('.ws-title').textContent }));
  const c0 = await 셈();
  is(c0.제목==='업무구분', '제목이 「업무구분」');
  is(c0.줄===8 && c0.담당.join('|')==='다정 EM·프로|EM·EM센터|이미라 실장|박주미 매니저|현아/다정프로|단장님|대전 설계매니저|TFA·팀장님',
     '담당자 여덟이 그림 차례대로 — '+c0.담당.join(' · '));
  is(c0.일===47, '할 일 47줄 (5 · 21 · 8 · 2 · 8 · 1 · 1 · 1) — '+c0.일);
  is(c0.정할===3, '추가 확정할 사항 셋 — '+c0.정할);
  const 판 = await p.evaluate(()=>({
    수:[].map.call(document.querySelectorAll('.ws-sum .ws-stat .n'),e=>e.textContent).join(' '),
    이름표:document.querySelectorAll('.ws-chips .ws-chip').length,
    큰:[].map.call(document.querySelectorAll('.ws-card.cols .ws-name'),e=>e.textContent).join(' '),
    옆:!!document.querySelector('.ws-side .ws-chips') && getComputedStyle(document.querySelector('.ws-side')).position }));
  is(판.수==='47 0 47 3', '★ 요약판 — 할 일 47 · 끝낸 것 0 · 남은 것 47 · 아직 정할 것 3 ('+판.수+') — 셈은 tally() 한 곳');
  is(판.이름표===8, '사람 이름표 여덟 — 누르면 그 카드로 — '+판.이름표);
  is(판.큰==='EM·EM센터 이미라 실장 현아/다정프로', '할 일 6줄 넘는 카드는 두 줄로 — '+판.큰);
  is(판.옆==='sticky', '컴퓨터에서는 왼쪽에 담당자 목록이 붙어 선다(내려도 따라옴)');
  await p.click('.ws-chip:nth-child(5)'); await p.waitForTimeout(700);
  const 내려 = await p.evaluate(()=>{ var r=document.querySelector('.ws-card[data-row="4"]').getBoundingClientRect(); return r.top>=0 && r.top<innerHeight/2; });
  is(내려, '이름표 「현아/다정프로」 를 누르면 그 카드가 화면 위쪽으로 온다');
  const 처음 = await p.evaluate(()=>JSON.stringify(WS.seed()));
  is(!/홍길동|\d{2,3}-\d{3,4}-\d{4}/.test(처음), '처음 표에 고객 이름·전화번호가 없다 (3번)');

  sec('[3] ★★ 칸을 눌러 고치면 남는다');
  is(await p.evaluate(()=>document.querySelectorAll('[contenteditable="true"]').length)===0, '보기일 때는 칸이 안 고쳐진다 (잘못 눌러 지우지 않게)');
  await p.click('#wsEdit');
  is(await p.evaluate(()=>document.querySelectorAll('[contenteditable="true"]').length)>50, '「고치기」 를 누르면 칸이 모두 고쳐진다');
  const 첫 = '.ws-card[data-row="0"] .ws-it:nth-child(1) .ws-t';
  await p.click(첫); await p.keyboard.press('Control+End');   /* End 는 꺾인 줄의 끝으로 갑니다 — 칸 끝은 Control+End */ await p.keyboard.type(' (11월 중)');
  await p.keyboard.press('Enter'); await p.keyboard.type('홍길동 팀장과 일정 맞추기');
  await p.waitForTimeout(600);
  let c1 = await 셈();
  is(c1.일===48, 'Enter 로 그 아래 한 줄이 더해진다 — '+c1.일);
  await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace');
  await p.waitForTimeout(100);
  c1 = await 셈();
  is(c1.일===47, '빈 줄에서 Backspace 면 그 줄이 지워진다 — '+c1.일);
  await p.click('.ws-card[data-row="1"] .ws-it:nth-child(3) .ws-ck');
  await p.click('.ws-addrow .ws-add'); await p.keyboard.type('총무');
  await p.waitForTimeout(700);
  await p.reload({waitUntil:'load'});
  const r = await p.evaluate(()=>{
    var raw=localStorage.getItem('apex_worksplit_v1'), o=JSON.parse(raw), d=JSON.parse(o.doc);
    return { 첫:d.rows[0].items[0].t, 둘:d.rows[0].items[1].t, 완료:d.rows[1].items[2].done, 끝:d.rows[d.rows.length-1].who,
             줄:document.querySelectorAll('.ws-card').length,
             셈:document.querySelector('.ws-card[data-row="1"] .ws-cnt').textContent,
             줄그음:getComputedStyle(document.querySelector('.ws-card[data-row="1"] .ws-it:nth-child(3) .ws-t')).textDecorationLine,
             at:o.at, 겉:typeof o.doc };
  });
  is(r.첫==='주미님 업무분담 및 순천 지원 범위 협의 (11월 중)', '고친 글이 다시 열어도 그대로 — '+r.첫);
  is(r.둘==='대전 설계매니저와 업계누적·모니터링·동시가입 연락', '지운 줄은 사라지고 다음 줄이 올라섰다');
  is(r.완료===true && r.셈==='1/21 완료' && r.줄그음==='line-through', '완료를 걸면 남고 · 그 줄은 그어지고 · 담당자 칸에 「1/21 완료」');
  is(r.끝==='총무' && r.줄===9, '「+ 담당자 줄 더하기」 로 새 담당자가 선다');
  is(/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(r.at) && r.겉==='string', '언제 고쳤는지 남고 · 표는 글자 하나(doc)로 감싸 담긴다');
  /* 안 끝난 것만 */
  await p.click('#wsOnly');
  const 거름 = await p.evaluate(()=>({ 보임:[].filter.call(document.querySelectorAll('.ws-card .ws-it'),e=>getComputedStyle(e).display!=='none').length,
    전부:document.querySelectorAll('.ws-card .ws-it').length, 요약:document.querySelector('.ws-sum .ws-stat.ok .n').textContent }));
  is(거름.전부===48 && 거름.보임===47 && 거름.요약==='1', '「안 끝난 것만」 — 끝낸 1줄이 숨고 나머지가 남는다(총무 한 줄 더해 48 → 47) · 요약판 「끝낸 것 1」 — '+거름.전부+' → '+거름.보임);
  await p.click('#wsOnly');
  /* 되돌리기 */
  await p.click('#wsEdit');
  await p.click('.ws-card[data-row="8"] .ws-chead .ws-mini.x');
  const 지운뒤 = await p.evaluate(()=>document.querySelectorAll('.ws-card').length);
  await p.click('#wsUndo');
  const 살린뒤 = await p.evaluate(()=>document.querySelectorAll('.ws-card').length);
  is(지운뒤===8 && 살린뒤===9, '담당자 줄을 지워도 「되돌리기」 로 살아난다');
  await p.click('#wsReset');
  is((await 셈()).일===47 && (await 셈()).줄===8, '「처음 표로」 — 회의 표로 돌아간다');
  const 혼자 = await p.evaluate(()=>document.getElementById('wsWho').textContent);
  is(/앱 밖에서 열었습니다/.test(혼자) && /이 기기에만/.test(혼자), '앱 밖에서 열면 「이 기기에만」 이라고 적는다');

  sec('[4] ★★ 고칠 수 있는 사람 — APEX_KV.canOrg() 한 곳');
  is(!/EM_ROLES|'education_manager'|'branch_manager'/.test(WS), '이 쪽에 권한 목록을 또 적지 않았다 (5번)');
  is(/function canOrg\(\)\{[^}]*EM_ROLES\.indexOf\(r\)>=0/.test(KV) && /canOrg:canOrg/.test(KV), 'apex-kv-sync 의 canOrg 가 올리는 자리와 같은 EM_ROLES 로 답한다');
  for(const [c,want] of [['true','team'],['false','view'],['null','wait']]){
    const h = await ctx.newPage(); h.on('pageerror',e=>errs.push('host '+c+': '+String(e).slice(0,90)));
    await h.goto('http://127.0.0.1:'+PORT+'/__host?c='+c,{waitUntil:'load'});
    const f = h.frame({url:/worksplit\.html/}); await f.waitForSelector('.ws-card');
    const o = await f.evaluate(()=>({ p:WS.perm(), 고치기:document.getElementById('wsEdit').disabled,
      체크:document.querySelector('.ws-ck').disabled, 말:document.getElementById('wsWho').textContent }));
    if(want==='team') is(o.p==='team' && !o.고치기 && !o.체크 && /EM 권한/.test(o.말) && /팀 전체/.test(o.말), 'EM → 고치고 체크하며 「팀 전체 화면이 같이 바뀝니다」');
    if(want==='view') is(o.p==='view' && o.고치기 && o.체크 && /보기 전용/.test(o.말), '보기 권한 → 「고치기」·완료 체크가 잠기고 「보기 전용」 (이 기기만 어긋나지 않게)');
    if(want==='wait') is(o.p==='wait' && /모릅니다/.test(o.말), '권한을 못 읽었으면 「모릅니다」 라고 적는다 (1번)');
    await h.close();
  }

  sec('[5] ★★ 조직 한 벌로 올라간다');
  const ok = (KV.match(/var ORG_KEYS=\[[^\]]*\]/)||[''])[0];
  is(/'apex_worksplit_v1'/.test(ok), 'ORG_KEYS 에 apex_worksplit_v1 — EM 이 고치면 apex_org_kv 로 갑니다');
  /* 두 기기가 따로 고친 뒤 처음 맞출 때 — kv-sync 의 merge 를 그대로 꺼내 씁니다 */
  const mergeSrc = KV.split('function isObj(x)')[1].split('/* ── 내려받기')[0];
  const merge = new Function('return (function(){ function isObj(x)'+mergeSrc+' return merge; })()')();
  const A = {v:1,at:'2026-11-06 10:00',doc:JSON.stringify({rows:[{who:'가',items:[{t:'하나',done:false}]}]})};
  const B = {v:1,at:'2026-11-06 11:00',doc:JSON.stringify({rows:[{who:'나',items:[{t:'둘',done:true}]}]})};
  const m = JSON.parse(merge(JSON.stringify(A),JSON.stringify(B)));
  const md = JSON.parse(m.doc);
  is(md.rows.length===1 && md.rows[0].who==='가', '첫 맞춤에 담당자 줄이 두 벌로 안 붙는다 — 서버 쪽 한 벌이 선다');

  sec('[6] 다른 기기에서 고친 표가 오면 다시 그린다');
  {
    const h = await ctx.newPage();
    await h.goto('http://127.0.0.1:'+PORT+'/__host?c=true',{waitUntil:'load'});
    const f = h.frame({url:/worksplit\.html/}); await f.waitForSelector('.ws-card');
    await h.evaluate(()=>{ var d={title:'업무구분',sub:'',rows:[{who:'홍길동 EM',items:[{t:'받은 줄',done:false}]}],extraTitle:'추가 확정할 사항',extra:[],note:''};
      localStorage.setItem('apex_worksplit_v1',JSON.stringify({v:1,at:'2026-11-06 12:00',doc:JSON.stringify(d)})); });
    await h.waitForTimeout(400);
    const o = await f.evaluate(()=>({ n:document.querySelectorAll('.ws-card').length, w:document.querySelector('.ws-card .ws-name').textContent }));
    is(o.n===1 && o.w==='홍길동 EM', '바깥 창이 받아 쓴 표가 안쪽 화면에 바로 선다');
    await h.close();
  }

  sec('[7] 종이 · 흰색 · 서버');
  await p.emulateMedia({media:'print'});
  const pr = await p.evaluate(()=>({ 띠:getComputedStyle(document.querySelector('.ws-bar')).display,
    단추:[].filter.call(document.querySelectorAll('.ws-add,.ws-tool'),e=>getComputedStyle(e).display!=='none').length }));
  is(pr.띠==='none' && pr.단추===0, '인쇄에는 띠·단추가 안 나온다');
  await p.emulateMedia({media:'screen'});
  is(!/font-feature-settings[^;}]*tnum|font-variant-numeric:[^;}]*tabular/.test(WS), 'tnum 을 안 쓴다 — 뽑은 종이를 다시 읽을 수 있게 (4-1번)');
  is(/<html data-theme="light"/.test(WS) && /<meta name="color-scheme" content="light">/.test(WS) && /:root\{\s*color-scheme:light/.test(WS), '흰색 고정 (check-lightmode 와 같은 세 자리)');
  is(/<link rel="stylesheet" href="ui\.css">/.test(WS), '색표는 app/ui.css 한 곳에서');
  is(!/fetch\(|XMLHttpRequest|supabase|createClient/.test(WS), '서버를 따로 안 부른다 — 올리고 받는 것은 apex-kv-sync (7번)');
  is(net.length===0, '바깥 주소를 하나도 안 부른다 — '+(net[0]||''));


  sec('[8] ★★ 무엇을 문의하시나요?');
  {
    const q = await ctx.newPage(); q.on('pageerror',e=>errs.push('찾기: '+String(e).slice(0,90)));
    await q.goto('http://127.0.0.1:'+PORT+'/'+PAGE,{waitUntil:'load'});
    await q.evaluate(()=>{ localStorage.removeItem('apex_worksplit_v1'); }); await q.reload({waitUntil:'load'});
    const 본 = () => q.evaluate(()=>({
      사람:[].map.call(document.querySelectorAll('.ws-card .ws-name'),e=>e.textContent),
      줄:document.querySelectorAll('.ws-card .ws-it').length,
      형광:document.querySelectorAll('.ws-card mark').length,
      머리:(document.querySelector('.ws-res .big')||{}).textContent||'',
      말:[].map.call(document.querySelectorAll('.ws-res .sub'),e=>e.textContent).join(' / '),
      요약숨음:document.querySelector('.ws-sum').hidden,
      정할:document.querySelectorAll('.ws-extra .ws-it').length }));
    await q.fill('#wsQ','청구');
    let r = await 본();
    is(r.사람.join('|')==='이미라 실장|박주미 매니저' && r.줄===2 && r.형광>=2,
       '「청구」 → 이미라 실장 · 박주미 매니저 (그 줄만 · 형광) — '+r.사람.join(' · ')+' · '+r.줄+'줄');
    is(/맡은 분 2명/.test(r.머리) && /이분들께 문의하세요/.test(r.말) && r.요약숨음, '「맡은 분 2명 · 할 일 2줄 · 이분들께 문의하세요」 · 찾는 동안 요약판은 접힌다');
    await q.fill('#wsQ','고객 등록');
    r = await 본();
    is(r.줄>=4 && r.사람.indexOf('이미라 실장')>=0 && r.사람.indexOf('TFA·팀장님')>=0, '띄어 친 「고객 등록」 도 「고객등록」 을 찾는다 — '+r.줄+'줄');
    await q.fill('#wsQ','이미라');
    r = await 본();
    is(r.사람.join('|')==='이미라 실장' && r.줄===8, '이름으로 치면 그분 할 일 여덟 줄이 다 선다');
    await q.fill('#wsQ','제안서 출력');
    r = await 본();
    is(r.사람.length===0 && /적힌 담당이 없습니다/.test(r.머리) && /안 정해졌습니다/.test(r.말) && r.정할===1,
       '★ 「제안서 출력」 — 담당이 아직 안 정해진 일은 「안 정해졌습니다」 라고 말한다 (지어 세우지 않음 · 1번)');
    await q.fill('#wsQ','보험료 환급');
    r = await 본();
    is(r.사람.length===0 && r.정할===0 && /적힌 담당이 없습니다/.test(r.머리), '표에 없는 말은 「없습니다」 — 아무나 세우지 않는다');
    await q.fill('#wsQ','');
    const 단추 = await q.evaluate(()=>[].map.call(document.querySelectorAll('#wsTopics .ws-topic'),e=>e.textContent));
    const 표글 = await q.evaluate(()=>JSON.stringify(WS.seed().rows));
    is(단추.length>=10 && 단추.every(t=>/\d+명$/.test(t)), '자주 묻는 것 단추 '+단추.length+'개 — 저마다 맡은 분 수');
    const 헛단추 = await q.evaluate(()=>{ var n=0; [].forEach.call(document.querySelectorAll('#wsTopics .ws-topic'),function(b){ b.click(); if(!document.querySelectorAll('.ws-card').length) n++; }); return n; });
    is(헛단추===0, '★ 어느 단추를 눌러도 맡은 분이 한 명 이상 선다 — 표에 없는 일로 단추를 안 세운다');
    await q.evaluate(()=>WS.setQ('설계·병력 재고지'));
    const 설계 = await q.evaluate(()=>[].map.call(document.querySelectorAll('.ws-card .ws-t'),e=>e.textContent));
    is(설계.length>=4 && !설계.some(t=>/^대전 설계매니저와/.test(t)) && 설계.some(t=>/병력 재고지/.test(t)),
       '「설계·병력 재고지」 단추에 「대전 설계매니저와 …연락」 이 안 걸린다 — 사람 이름 속 「설계」 는 뺍니다');
    await q.evaluate(()=>WS.setQ(''));
    await q.click('#wsTopics .ws-topic:first-child');
    const 첫 = await q.evaluate(()=>({v:document.getElementById('wsQ').value,h:location.hash,on:!!document.querySelector('#wsTopics .ws-topic.on')}));
    is(첫.v==='청구' && 첫.h==='#q='+encodeURIComponent('청구') && 첫.on, '단추 「청구」 를 누르면 찾기 칸에 들어가고 주소가 #q=청구 가 된다');
    await q.goto('http://127.0.0.1:'+PORT+'/'+PAGE+'#q='+encodeURIComponent('시상·업적'),{waitUntil:'load'}); await q.reload({waitUntil:'load'});   /* 주소 뒤 #만 바뀌면 새로 안 열립니다 */
    r = await 본();
    is(r.사람.length>=3 && /시상·업적/.test(r.머리), '#q=시상·업적 주소로 열면 찾아 둔 채 선다 — '+r.사람.join(' · '));
    await q.evaluate(()=>WS.setQ('청구')); await q.click('#wsEdit');
    const 고침 = await q.evaluate(()=>({q:document.getElementById('wsQ').value, 카드:document.querySelectorAll('.ws-card').length}));
    is(고침.q==='' && 고침.카드===8, '「고치기」 를 누르면 찾기를 풀고 전부 보인다 (걸러진 채 고치지 않게)');
    await q.close();
  }

  sec('[9] ★★ 내보내기 — 카톡으로 돌려 보는 한 파일');
  {
    const q = await ctx.newPage();
    await q.goto('http://127.0.0.1:'+PORT+'/'+PAGE,{waitUntil:'load'});
    await q.evaluate(()=>{ localStorage.removeItem('apex_worksplit_v1'); }); await q.reload({waitUntil:'load'});
    await q.click('.ws-card[data-row="0"] .ws-it:nth-child(1) .ws-ck');
    await q.click('#wsExport');
    const 패널 = await q.evaluate(()=>!document.getElementById('wsExpPanel').hidden);
    is(패널, '「내보내기」 를 누르면 두 갈래(설계사용 · 내 수정용)가 선다');
    const [dl] = await Promise.all([q.waitForEvent('download'), q.click('#wsExpView')]);
    const 이름 = dl.suggestedFilename();
    const html = fs.readFileSync(await dl.path(),'utf8');
    is(/^APEX_worksplit_\d{4}-\d\d-\d\d\.html$/.test(이름), '파일 이름이 .html 로 끝난다(영문 — 한글이면 「download」 로 떨어짐) — '+이름);
    is(!/<link rel="stylesheet" href="ui\.css">/.test(html) && /window\.WS_EMBED=/.test(html) && /--t-point:/.test(html),
       'ui.css 없이 서도록 색 값을 파일 안에 담았다 · 표도 파일 안에');
    is(!/홍길동|\d{2,3}-\d{3,4}-\d{4}/.test(html), '파일에 고객 이름·전화번호가 없다 (3번)');
    /* 인터넷을 다 막은 새 창에서 — 카톡으로 받아 연 것처럼 */
    const off = await br.newContext({viewport:{width:390,height:844}});
    const 바깥=[]; await off.route('**/*', r=>{ 바깥.push(r.request().url()); r.abort(); });
    const o = await off.newPage(); const oe=[]; o.on('pageerror',e=>oe.push(String(e).slice(0,90)));
    await o.setContent(html,{waitUntil:'load'});
    const v = await o.evaluate(()=>{
      var g=function(s){ return document.querySelectorAll(s).length; };
      var r={ 카드:g('.ws-card'), 줄:g('.ws-card .ws-it'), 완료:document.querySelector('.ws-sum .ws-stat.ok .n').textContent,
        고치기:getComputedStyle(document.getElementById('wsEdit')).display, 내보내기:getComputedStyle(document.getElementById('wsExport')).display,
        체크잠김:document.querySelector('.ws-ck').disabled, 말:document.getElementById('wsWho').textContent,
        띠색:getComputedStyle(document.querySelector('.ws-card')).borderTopColor, 저장:0 };
      try{ r.저장=localStorage.length; }catch(e){ r.저장=-1; }
      WS.setQ('청구'); r.찾기=[].map.call(document.querySelectorAll('.ws-card .ws-name'),function(e){return e.textContent;}).join('|');
      return r; });
    is(v.카드===8 && v.줄===47 && v.완료==='1', '받은 파일을 열면 같은 표 — 카드 8 · 할 일 47 · 내보낼 때 건 완료 1');
    is(v.찾기==='이미라 실장|박주미 매니저', '받은 파일에서도 「청구」 찾기가 된다');
    is(v.고치기==='none' && v.내보내기==='none' && v.체크잠김 && /보기용 파일/.test(v.말), '받은 파일은 보기 전용 — 고치기·내보내기가 없고 체크가 잠김 · 「보기용 파일」 이라고 적힘');
    is(v.띠색!=='rgba(0, 0, 0, 0)' && v.띠색!=='rgb(0, 0, 0)', 'ui.css 없이도 사람 색 띠가 선다 — '+v.띠색);
    is(v.저장<=0, '받은 파일은 그 기기 저장소에 안 쓴다');
    is(oe.length===0 && 바깥.length===0, '인터넷을 다 막아도 터지지 않고 · 바깥을 하나도 안 부른다 — '+(oe[0]||바깥[0]||''));
    await off.close(); await q.close();
  }

  sec('[10] ★★ 내 수정용 — 어디서든 열어 고치는 파일');
  {
    const q = await ctx.newPage();
    await q.goto('http://127.0.0.1:'+PORT+'/'+PAGE,{waitUntil:'load'});
    await q.evaluate(()=>{ localStorage.removeItem('apex_worksplit_v1'); }); await q.reload({waitUntil:'load'});
    await q.click('#wsExport');
    const [dl] = await Promise.all([q.waitForEvent('download'), q.click('#wsExpOwn')]);
    const 이름 = dl.suggestedFilename(); const html = fs.readFileSync(await dl.path(),'utf8');
    is(/^APEX_worksplit_edit_\d{4}-\d\d-\d\d\.html$/.test(이름) && /"mode":"own"/.test(html), '내 수정용 파일 — '+이름);
    await q.close();
    /* 받은 파일을 따로 선 주소에서 엽니다 — 인터넷은 다 막습니다 */
    const off = await br.newContext({viewport:{width:1100,height:900}});
    const 바깥=[];
    await off.route('**/*', r=>{ const u=r.request().url();
      if(u.startsWith('http://own.test/')){ r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}); return; }
      바깥.push(u); r.abort(); });
    const o = await off.newPage(); const oe=[]; o.on('pageerror',e=>oe.push(String(e).slice(0,90)));
    await o.goto('http://own.test/w.html',{waitUntil:'load'});
    const a0 = await o.evaluate(()=>({ p:WS.perm(), 고치기:getComputedStyle(document.getElementById('wsEdit')).display,
      잠김:document.getElementById('wsEdit').disabled, 말:document.getElementById('wsWho').textContent,
      단추:document.getElementById('wsExpOwn').textContent }));
    is(a0.p==='own' && a0.고치기!=='none' && !a0.잠김 && /내 수정용 파일/.test(a0.말), '열면 「내 수정용 파일」 — 「고치기」 가 선다');
    await o.click('#wsEdit');
    await o.click('.ws-card[data-row="0"] .ws-it:nth-child(1) .ws-t'); await o.keyboard.press('Control+End'); await o.keyboard.type(' (사장님 고침)');
    await o.click('#wsEdit'); await o.waitForTimeout(500);
    await o.reload({waitUntil:'load'});
    const a1 = await o.evaluate(()=>({ t:document.querySelector('.ws-card[data-row="0"] .ws-it .ws-t').textContent,
      열쇠:Object.keys(localStorage) }));
    is(/\(사장님 고침\)$/.test(a1.t), '고친 글이 다시 열어도 남는다 — '+a1.t);
    is(a1.열쇠.indexOf('apex_worksplit_own_v1')>=0 && a1.열쇠.indexOf('apex_worksplit_v1')<0, '★ 따로 된 열쇠(apex_worksplit_own_v1)에만 — 앱의 팀 표 열쇠와 안 섞인다');
    /* 여기서 설계사용을 다시 뽑습니다 */
    await o.click('#wsExport');
    const [d2] = await Promise.all([o.waitForEvent('download'), o.click('#wsExpView')]);
    const v2 = fs.readFileSync(await d2.path(),'utf8');
    is(/"mode":"view"/.test(v2) && /\(사장님 고침\)/.test(v2) && (v2.match(/<script id="wsEmbed">/g)||[]).length===1 && (v2.match(/id="wsVars"/g)||[]).length===1,
       '★ 수정용에서 뽑은 설계사용 — 고친 글이 담기고 · 담긴 표·색은 한 벌씩');
    const o2 = await off.newPage(); await o2.setContent(v2,{waitUntil:'load'});
    const v3 = await o2.evaluate(()=>({ p:WS.perm(), 고치기:getComputedStyle(document.getElementById('wsEdit')).display,
      띠:getComputedStyle(document.querySelector('.ws-card')).borderTopColor, 카드:document.querySelectorAll('.ws-card').length }));
    is(v3.p==='export' && v3.고치기==='none' && v3.카드===8 && v3.띠!=='rgba(0, 0, 0, 0)', '그 파일을 열면 보기 전용 · 카드 8 · 색 띠가 선다');
    is(oe.length===0 && 바깥.length===0, '인터넷을 다 막아도 터지지 않고 · 바깥을 안 부른다 — '+(oe[0]||바깥[0]||''));
    await off.close();
  }

  sec('[11] 🖼 이미지(PNG) — 카톡 사진으로');
  {
    const q = await ctx.newPage(); const qe=[]; q.on('pageerror',e=>qe.push(String(e).slice(0,90)));
    await q.goto('http://127.0.0.1:'+PORT+'/'+PAGE,{waitUntil:'load'});
    await q.evaluate(()=>{ localStorage.removeItem('apex_worksplit_v1'); }); await q.reload({waitUntil:'load'});
    const 전부 = await q.evaluate(()=>{ var r=WS.poster(); return {w:r.canvas.width,h:r.h,ch:r.canvas.height,n:r.names.join('|')}; });
    is(전부.w===1080 && 전부.h>2500 && 전부.h===전부.ch && 전부.n.split('|').length===8, '전부 — 폭 1080 · 높이 '+전부.h+' · 사람 여덟');
    await q.evaluate(()=>WS.setQ('청구'));
    const 청구 = await q.evaluate(()=>{ var r=WS.poster(); return {h:r.h,n:r.names.join('|'),q:r.q}; });
    is(청구.n==='이미라 실장|박주미 매니저' && 청구.h<전부.h/2 && 청구.q==='청구', '찾는 중이면 그 결과만 — 「청구」 → '+청구.n+' · 높이 '+청구.h);
    await q.click('#wsExport');
    const [dl] = await Promise.all([q.waitForEvent('download'), q.click('#wsExpImg')]);
    const buf = fs.readFileSync(await dl.path());
    const png = buf.slice(1,4).toString()==='PNG', w=buf.readUInt32BE(16), h=buf.readUInt32BE(20);
    is(png && w===1080 && h===청구.h && /^APEX_worksplit_\d{4}-\d\d-\d\d_search\.png$/.test(dl.suggestedFilename()),
       'PNG 로 내려받는다 — '+dl.suggestedFilename()+' · '+w+'×'+h);
    is(qe.length===0, '이미지를 그리다 터진 것 0 — '+(qe[0]||''));
    await q.close();
  }

  is(errs.length===0, '터진 것 0 — '+(errs[0]||''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ '+bad+'개 — 위를 보십시오' : '✓ 업무구분 — 회의 표가 그대로 서고, 눌러 고친 것이 남고, EM 이 고치면 팀이 같이 봅니다.');
  process.exit(bad?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
