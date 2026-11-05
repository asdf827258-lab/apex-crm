/* ⌨️ <b>도구 화면 찾기 칸 — 치는 중에 글자가 안 쪼개지나 · 오타도 찾나</b> (판 X340)

   사장님 말씀 2026-11-05 — 「도구에서 검색 기능 오타 자꾸 나온다 고치고」.

   ── 재어 보니 ───────────────────────────────────────────────────
   찾기 칸이 <b>한 글자 칠 때마다</b> 화면 전체(찾기 칸까지)를 지우고 다시 세웠습니다
   (tlpSetQ → tlpPaint → innerHTML). 칸이 새로 생기면 <b>한글 조합이 끊겨</b>
   「연금」 이 자모로 쪼개집니다. 서랍 찾기는 같은 일을 겪고 이미 고쳐져 있었습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 글자를 쳐도 <b>찾기 칸이 그 칸 그대로</b>다(다시 안 세운다) · 값 · 커서 · 포커스 그대로
     [2] ★★ 한글 조합을 흉내 내어(compositionstart → 자모 → compositionend) 쳐도 칸이 그대로다
     [3] 찾으면 줄이 걸러진다 · 지우면 다 돌아온다 · 칸을 누르면 펴진다(tlpToggle 도 칸을 안 바꾼다)
     [4] ★ <b>오타</b> — 엄하게 찾아 0 이면 한 글자 틀린 것까지 본다(서랍과 같은 navHit) ·
         그때 「비슷한 이름을 찾았습니다」 라고 밝힌다 · 엄하게 걸리면 넓히지 않는다
     [5] 화면을 다시 열면(go) 칸이 새로 선다 — 처음 그리기는 그대로
     [6] 조용한가                                                                 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8967;
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
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  await ctx.route('**://**', rt=>rt.request().url().indexOf('127.0.0.1:'+PORT)>=0
    ? rt.continue() : rt.fulfill({status:200,contentType:'text/css',body:''}));
  const errs = [];
  const pg = await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2600);
  await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide,#arBriefOvl').forEach(x=>x.remove());
    OS.profile={id:'t',name:'점검',role:'branch_manager',plan:'vip'};
    OS.session={user:{id:'t',email:'t@test'}}; window.toast=function(){};
    go('tools');
  });
  await pg.waitForTimeout(900);
  const 줄수 = ()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('#dynPane .tlp-row')).length);

  sec('[1] ★★ 글자를 쳐도 찾기 칸이 그 칸 그대로인가');
  await pg.evaluate(()=>{ document.getElementById('tlpQ').__mark = 'same'; });
  await pg.evaluate(()=>{ document.querySelectorAll('#arBriefOvl').forEach(x=>x.remove()); document.getElementById('tlpQ').focus(); });
  await pg.keyboard.type('연금', {delay:40});
  const A = await pg.evaluate(()=>{ var e=document.getElementById('tlpQ');
    return {same:e.__mark==='same', v:e.value, focus:document.activeElement===e, caret:e.selectionStart, rows:document.querySelectorAll('#dynPane .tlp-row').length}; });
  is(A.same, '찾기 칸을 <b>다시 세우지 않는다</b> — 「연금」 을 치는 동안 같은 칸 (전에는 글자마다 새 칸)');
  is(A.v==='연금' && A.focus && A.caret===2, '값 「'+A.v+'」 · 포커스 그대로 · 커서 '+A.caret);
  is(A.rows>0, '「연금」 → 걸린 줄 '+A.rows+'개');

  sec('[2] ★★ 한글 조합을 흉내 내어 쳐도');
  const C = await pg.evaluate(()=>{ var e=document.getElementById('tlpQ'); e.value=''; tlpSetQ('');
    e.__mark='c'; e.focus();
    e.dispatchEvent(new CompositionEvent('compositionstart',{data:''}));
    ['ㅅ','시','실','실ㅂ','실비'].forEach(function(t){ e.value=t; e.dispatchEvent(new CompositionEvent('compositionupdate',{data:t})); e.dispatchEvent(new InputEvent('input',{data:t,isComposing:true,bubbles:true})); });
    e.dispatchEvent(new CompositionEvent('compositionend',{data:'실비'}));
    var e2=document.getElementById('tlpQ');
    return {same:e2===e && e2.__mark==='c', v:e2.value, rows:document.querySelectorAll('#dynPane .tlp-row').length}; });
  is(C.same && C.v==='실비', '조합 중(ㅅ→시→실→실ㅂ→실비)에도 칸이 그대로 — 값 「'+C.v+'」');
  is(C.rows>0, '「실비」 → 걸린 줄 '+C.rows+'개');

  sec('[3] 걸러지고 · 돌아오고 · 펴진다');
  const all0 = await pg.evaluate(()=>{ var e=document.getElementById('tlpQ'); e.value=''; tlpSetQ(''); return document.querySelectorAll('#dynPane .tlp-c .tlp-head').length; });
  const T = await pg.evaluate(()=>{ var e=document.getElementById('tlpQ'); e.__mark='t';
    var h=document.querySelector('#dynPane .tlp-head'); h.click();
    return {same:document.getElementById('tlpQ').__mark==='t', open:document.querySelectorAll('#dynPane .tlp-c.on').length}; });
  is(all0>=6 && T.open===1 && T.same, '지우면 칸 '+all0+'개가 돌아온다 · 칸을 누르면 그 칸만 펴진다 · 찾기 칸은 그대로');

  sec('[4] ★ 오타도 찾는다 — 서랍과 같은 규칙');
  const L = await pg.evaluate(()=>{
    var probe = function(q){ var e=document.getElementById('tlpQ'); e.value=q; tlpSetQ(q);
      return {rows:[].slice.call(document.querySelectorAll('#dynPane .tlp-row .n')).map(x=>x.textContent),
              loose:!!document.querySelector('#dynPane .tlp-loose'), none:!!document.querySelector('#dynPane .tlp-none:not(.tlp-loose)')}; };
    return {ok:probe('알릴의무'), typo:probe('알릴의뮤'), junk:probe('ㅋㅋㅋㅋㅋ쀍')}; });
  is(L.ok.rows.length>0 && !L.ok.loose, '「알릴의무」 → 엄하게 '+L.ok.rows.length+'개 · 넓히지 않는다');
  is(L.typo.rows.length>0 && L.typo.loose, '「알릴의뮤」(오타) → 비슷한 이름 '+L.typo.rows.length+'개 — 「'+(L.typo.rows[0]||'')+'」 · 「비슷한 이름을 찾았습니다」 라고 밝힌다');
  is(L.junk.rows.length===0 && L.junk.none, '아무 말(「ㅋㅋㅋㅋㅋ쀍」)은 「그런 이름은 없습니다」 — 헛것을 세우지 않는다 (8번)');

  sec('[5] 화면을 다시 열면 칸이 새로 선다');
  const R = await pg.evaluate(async ()=>{ go('home'); await new Promise(x=>setTimeout(x,300)); go('tools'); await new Promise(x=>setTimeout(x,400));
    return {q:!!document.getElementById('tlpQ'), body:!!document.getElementById('tlpBody')}; });
  is(R.q && R.body, '도구 화면을 다시 열면 찾기 칸 · 목록 자리가 다 선다');

  sec('[6] 조용한가');
  is(errs.length===0, '콘솔 오류 0'+(errs.length?' ← '+errs.slice(0,3).join(' · '):''));
  await b.close(); srv.close();
  console.log(bad?'\n✗ '+bad+'개':'\n✓ 모두 통과');
  process.exit(bad?1:0);
})();
