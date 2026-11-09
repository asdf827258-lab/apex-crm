/* ══ 🙈 check-hmmask — 홈에 <b>배정 DB 실명</b>이 그대로 서지 않나 (판 X359) ══════════
   사장님 말씀 (2026-11-04) 「실제 체크해보고 지역동선까지 안되는거 다 찾아, 오늘에서」
   → (2026-11-06) 「응 pr 올리고 <b>모두 다 고치고</b> 마무리해줘」.

   ⚠ 재어 보니 홈의 여러 칸이 배정 DB(dbs.customer_name) 이름을 <b>그대로</b> 세웠습니다 —
     지금 할 것 큰 이름 · 「이분 자세히」 머리 · 🚗 약속 줄·이름 알약·걸 분 줄·만나야 할 분 줄 ·
     아침 미션 · 이번 주 달력 · 오늘 약속 칸. 그런데 바로 위 「💡 막힌 데」 와 🕗 는 가렸습니다.
     CLAUDE.md 3번 — 「배정 DB 이름은 그대로 두되, <b>거기서 가져다 새 자리에 세울 때는 가린다</b>.
     벗기는 자리는 사람이 한 번 더 누르게 한다」. 홈이 그 새 자리입니다.

   보는 것
     [1] 접이를 <b>다 편</b> 홈 글 어디에도 배정 DB 실명(견본 「홍길동갑」 꼴)이 없다
         · title·aria 에도 없다
     [2] 가린 이름은 <b>선다</b> — 「아무 이름도 안 세움」 으로 거저 통과하지 않게
     [3] 오류 없이 선다
   ⚠ 되돌림 — 🚗 이름 알약 한 자리를 osMaskName 없이 되돌리면 [1] 이 그 자리를 적으며 웁니다.
   ★ 바깥·사장님 서버를 <b>한 번도 안 부릅니다</b> (7번 · 서버는 적어 두기만 하는 가짜).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 홍길동 집안(3번). 이름 끝 글자가 <b>모두 다르게</b>: 실명이 새면 「홍길동갑」 꼴이 그대로 보입니다.
   오늘 약속 둘(🚗 약속 줄 · 오늘 약속 칸 · 이번 주) · 같은 동네 AP/PC/TA(걸 분 · 만나야 할 분 · 아침 미션). */
const NAMES = ['홍길동갑','홍길동을','홍길동병','홍길동정','홍길동무','홍길동기','홍길동경','홍길동신'];
const SEED = (NAMES) => {
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_hm_fold_v1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  OS.profile={id:'me',user_id:'me',name:'홍설계',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={}; AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const t=arToday(), me=arMyId();
  const at=(dd,h)=>{ const d=new Date(t+'T00:00:00'); d.setDate(d.getDate()+dd); d.setHours(h,0,0,0);
    const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(h)+':00:00'; };
  const row=(i,stage,appt)=>({ id:'d'+i, who:me, name:NAMES[i], region:'순천', src:'일반', stage:stage, cAt:'', pAt:'',
    n:1, last:'', res:'', appt:appt||'', memo:'', days:40, phone:'010-0000-000'+i });
  AR.db=[ row(0,'AP',at(0,10)), row(1,'PC',at(0,14)), row(2,'AP',at(2,11)), row(3,'PC'), row(4,'TA'),
          row(5,'TA'), row(6,'AP'), row(7,'미접촉') ];
  window.osClient=function(){ const mk=function(){ const a={}; ['select','eq','in','order','limit','range','gte','lte','is','neq','not','single','maybeSingle','insert','update','upsert','delete']
      .forEach(k=>{ a[k]=function(){ return a; }; });
    a.then=function(ok,no){ return Promise.resolve({data:[],error:null}).then(ok,no); }; return a; };
    return { from:mk, rpc:function(){ return Promise.resolve({data:null,error:null}); } }; };
  try{ osHideLoginGate(); }catch(e){}
  try{ document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove()); }catch(e){}
  HWHO.id=''; go('home');
};
const LOOK = async (NAMES) => {
  /* 접이를 <b>다 폅니다</b> — 접힌 속은 글에 안 잡혀 거저 통과합니다 */
  for (let k = 0; k < 3; k++) {
    document.querySelectorAll('[onclick^="hmFoldToggle"]').forEach(b => { const w = b.closest('[id^="hmFold_"]'); if (w && !w.classList.contains('on')) b.click(); });
    await new Promise(r => setTimeout(r, 300));
  }
  try { if (typeof hmMoreToggle === 'function' && !document.querySelector('.hm-more.on')) hmMoreToggle(); } catch (e) {}
  await new Promise(r => setTimeout(r, 400));
  const root = document.getElementById('dynPane') || document.body, out = [];
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    for (const nm of NAMES) if (n.nodeValue.indexOf(nm) >= 0) {
      let e = n.parentElement, p = [];
      for (let i = 0; i < 4 && e; i++, e = e.parentElement) p.push((e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '') || e.tagName);
      out.push(nm + ' ← ' + p.join(' < '));
    }
  }
  root.querySelectorAll('[title],[aria-label]').forEach(e => { const v = (e.title || '') + ' ' + (e.getAttribute('aria-label') || '');
    for (const nm of NAMES) if (v.indexOf(nm) >= 0) out.push(nm + ' ← [속성] ' + (e.className || e.tagName)); });
  const txt = root.innerText;
  return { 샘: out, 가림: (txt.match(/홍\*+[가-힣]/g) || []).length, len: txt.length };
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  for (const w of [390, 1280]) {
    console.log('\n── ' + (w < 600 ? '📱 폰' : '🖥️ 컴퓨터') + ' ' + w + 'px');
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    /* 🙈 판 X388 — 홈은 이제 <b>실명이 기본</b>이고, 고객 앞에서 「🙈 이름 가리기」 를 누르면 가립니다.
       이 자는 <b>누른 뒤</b>를 봅니다 — 가리는 길이 무너지면 여기서 웁니다. 기본(실명)은 check-hmfullnm. */
    await ctx.addInitScript(() => { try { localStorage.setItem('apex_hm_hidenm', '1'); } catch (e) {} });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
    await p.waitForTimeout(1200);
    await p.evaluate(SEED, NAMES); await p.waitForTimeout(1500);
    const L = await p.evaluate(LOOK, NAMES);
    console.log('[1] 접이를 다 편 홈에 배정 DB 실명이 없나');
    is(L.len > 800 && L.샘.length === 0, '  ★★ 실명 ' + L.샘.length + '곳' + (L.샘.length ? ' — ' + L.샘.slice(0, 6).join(' | ') : '') + ' (홈 글 ' + L.len + '자)');
    console.log('[2] 가린 이름은 선다');
    is(L.가림 >= 3, '  가린 이름 ' + L.가림 + '곳 — 이름을 아예 안 세워 거저 통과하지 않습니다');
    console.log('[3] 오류 없이');
    is(!errs.length, '  ' + (errs.length ? errs[0] : '터진 곳 없음'));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불 — 홈에 실명이 서면 옆 사람이 화면을 봐도 고객 이름이 다 보입니다') : '✓ 🙈 홈의 배정 DB 이름은 가려서 섭니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
