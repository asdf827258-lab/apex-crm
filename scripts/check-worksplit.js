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
    줄:document.querySelectorAll('.ws-tbl tbody tr').length,
    일:document.querySelectorAll('.ws-tbl .ws-it').length,
    정할:document.querySelectorAll('.ws-extra .ws-it').length,
    담당:[].map.call(document.querySelectorAll('td.who [data-ed]'),e=>e.textContent),
    제목:document.querySelector('.ws-title').textContent }));
  const c0 = await 셈();
  is(c0.제목==='업무구분', '제목이 「업무구분」');
  is(c0.줄===8 && c0.담당.join('|')==='다정 EM·프로|EM·EM센터|이미라 실장|박주미 매니저|현아/다정프로|단장님|대전 설계매니저|TFA·팀장님',
     '담당자 여덟이 그림 차례대로 — '+c0.담당.join(' · '));
  is(c0.일===47, '할 일 47줄 (5 · 21 · 8 · 2 · 8 · 1 · 1 · 1) — '+c0.일);
  is(c0.정할===3, '추가 확정할 사항 셋 — '+c0.정할);
  const 처음 = await p.evaluate(()=>JSON.stringify(WS.seed()));
  is(!/홍길동|\d{2,3}-\d{3,4}-\d{4}/.test(처음), '처음 표에 고객 이름·전화번호가 없다 (3번)');

  sec('[3] ★★ 칸을 눌러 고치면 남는다');
  is(await p.evaluate(()=>document.querySelectorAll('[contenteditable="true"]').length)===0, '보기일 때는 칸이 안 고쳐진다 (잘못 눌러 지우지 않게)');
  await p.click('#wsEdit');
  is(await p.evaluate(()=>document.querySelectorAll('[contenteditable="true"]').length)>50, '「고치기」 를 누르면 칸이 모두 고쳐진다');
  const 첫 = '.ws-tbl tbody tr:nth-child(1) .ws-it:nth-child(1) .ws-t';
  await p.click(첫); await p.keyboard.press('End'); await p.keyboard.type(' (11월 중)');
  await p.keyboard.press('Enter'); await p.keyboard.type('홍길동 팀장과 일정 맞추기');
  await p.waitForTimeout(600);
  let c1 = await 셈();
  is(c1.일===48, 'Enter 로 그 아래 한 줄이 더해진다 — '+c1.일);
  await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await p.keyboard.press('Backspace');
  await p.waitForTimeout(100);
  c1 = await 셈();
  is(c1.일===47, '빈 줄에서 Backspace 면 그 줄이 지워진다 — '+c1.일);
  await p.click('.ws-tbl tbody tr:nth-child(2) .ws-it:nth-child(3) .ws-ck');
  await p.click('.ws-addrow .ws-add'); await p.keyboard.type('총무');
  await p.waitForTimeout(700);
  await p.reload({waitUntil:'load'});
  const r = await p.evaluate(()=>{
    var raw=localStorage.getItem('apex_worksplit_v1'), o=JSON.parse(raw), d=JSON.parse(o.doc);
    return { 첫:d.rows[0].items[0].t, 둘:d.rows[0].items[1].t, 완료:d.rows[1].items[2].done, 끝:d.rows[d.rows.length-1].who,
             줄:document.querySelectorAll('.ws-tbl tbody tr').length,
             셈:document.querySelector('.ws-tbl tbody tr:nth-child(2) .ws-cnt').textContent,
             줄그음:getComputedStyle(document.querySelector('.ws-tbl tbody tr:nth-child(2) .ws-it:nth-child(3) .ws-t')).textDecorationLine,
             at:o.at, 겉:typeof o.doc };
  });
  is(r.첫==='주미님 업무분담 및 순천 지원 범위 협의 (11월 중)', '고친 글이 다시 열어도 그대로 — '+r.첫);
  is(r.둘==='대전 설계매니저와 업계누적·모니터링·동시가입 연락', '지운 줄은 사라지고 다음 줄이 올라섰다');
  is(r.완료===true && r.셈==='1/21 완료' && r.줄그음==='line-through', '완료를 걸면 남고 · 그 줄은 그어지고 · 담당자 칸에 「1/21 완료」');
  is(r.끝==='총무' && r.줄===9, '「+ 담당자 줄 더하기」 로 새 담당자가 선다');
  is(/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(r.at) && r.겉==='string', '언제 고쳤는지 남고 · 표는 글자 하나(doc)로 감싸 담긴다');
  /* 되돌리기 */
  await p.click('#wsEdit');
  await p.click('.ws-tbl tbody tr:nth-child(9) td.who .ws-mini.x');
  const 지운뒤 = await p.evaluate(()=>document.querySelectorAll('.ws-tbl tbody tr').length);
  await p.click('#wsUndo');
  const 살린뒤 = await p.evaluate(()=>document.querySelectorAll('.ws-tbl tbody tr').length);
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
    const f = h.frame({url:/worksplit\.html/}); await f.waitForSelector('.ws-tbl');
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
    const f = h.frame({url:/worksplit\.html/}); await f.waitForSelector('.ws-tbl');
    await h.evaluate(()=>{ var d={title:'업무구분',sub:'',rows:[{who:'홍길동 EM',items:[{t:'받은 줄',done:false}]}],extraTitle:'추가 확정할 사항',extra:[],note:''};
      localStorage.setItem('apex_worksplit_v1',JSON.stringify({v:1,at:'2026-11-06 12:00',doc:JSON.stringify(d)})); });
    await h.waitForTimeout(400);
    const o = await f.evaluate(()=>({ n:document.querySelectorAll('.ws-tbl tbody tr').length, w:document.querySelector('td.who [data-ed]').textContent }));
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
  is(errs.length===0, '터진 것 0 — '+(errs[0]||''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ '+bad+'개 — 위를 보십시오' : '✓ 업무구분 — 회의 표가 그대로 서고, 눌러 고친 것이 남고, EM 이 고치면 팀이 같이 봅니다.');
  process.exit(bad?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
