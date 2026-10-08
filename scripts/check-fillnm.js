/* ══════════════════════════════════════════════════════════════════
   check-fillnm.js — <b>상담 화면이 「누구 상담인지」 를 안다.</b>
   그리고 <b>어느 이름을 적는지</b>를 자리마다 가린다.

   사장님 말씀 (2026-10-09 · 판 X76) — 낮의 상담 본편을 끝까지 몰아 본
   뒤에 고르신 A 입니다 —
     「이름 칸이 <b>있는데 비어 있는</b> 넷을 먼저 채워라」

   ── 재어 보니 ─────────────────────────────────────────────────────
   상담 화면 <b>열셋</b> 가운데 그 분을 아는 것은 <b>고객 365일 하나</b>
   뿐이었습니다. 고객 앞에 앉아 팩트파인딩을 열고 전·후 만들기를 띄우는데
   어느 화면도 「누구 상담인지」 를 안 적었습니다. 그런데 <b>자리는 이미
   있었습니다</b> — ff_name · prName · cName 세 칸이 비어 있었고,
   전·후 만들기는 이름을 <b>받아 두고도</b>(HOST.name) 쓰는 자리가 0곳
   이었습니다. 그래서 이 판은 새로 만드는 판이 아니라 <b>채우는 판</b>입니다.

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   <b>어느 이름을 적느냐</b>입니다. 두 가지로 틀릴 수 있고 둘 다 사고입니다.
     ⓐ 밖으로 나가는 칸에 <b>실명</b>을 적는 것 — AI 제안서는 이름을
       그대로 AI 에게 보냅니다 (3번). 앱이 제 입으로 그 칸에
       「고객 실명 대신 <b>김○○</b> 처럼」 이라고 적어 두었습니다.
     ⓑ 이 기기 화면에 <b>가린 이름</b>을 적는 것 — 그러면 고객 앞에서
       「홍*배 님」 이라고 부르게 됩니다. check-calface 가 바로 이것을
       한 번 잡았습니다 — <b>가리는 까닭은 밖으로 나갈 때이지 이 브라우저
       화면이 아닙니다.</b>
   그래서 이 자는 「이름이 들어갔나」 가 아니라 <b>「어느 이름이 들어갔나」</b>
   를 자리마다 따로 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>밖으로 나가는 칸은 가린 이름</b> — AI 제안서(prName) ·
         전·후 만들기(baWho) 에 실명이 <b>없다</b> (3번)
     [2] ★★ <b>이 기기 칸은 실명</b> — 팩트파인딩(ff_name) · 상담자료
         (cName) 는 고객 앞에서 부를 이름이라 실명이다
     [3] ★ <b>묻는 자리는 하나</b> (5번) — 어느 칸이냐·어느 이름이냐를
         표 하나(CS_NM)가 알고, 삼항 사슬이 없다
     [4] ★ <b>빠른 return 보다 앞</b>에서 부른다 — sangdam·frmake 는 아래에서
         먼저 return 하므로 꼬리에 걸면 안 걸립니다
     [5] ★ <b>손으로 적어 두신 것을 안 덮는다</b> · 이름을 <b>모르면
         안 채운다</b> (1번) — 「고객님」 이 이름으로 저장됩니다
     [6] ★ <b>끝이 있다</b> · 서버를 한 번도 안 부른다 (7번)
     [7] 🧑 전·후 만들기 — 받아 두고 안 보여 주던 자리를 세우고,
         <b>그 파일에 있는 토큰</b>만 쓴다 (없는 토큰은 글자를 지웁니다)

   ── ⚠ 이 판에서 제가 또 틀린 것 ──────────────────────────────────
   「csNm 이 실명을 안 돌려준다」 고 읽었습니다. 앱이 아니라 <b>제 씨</b>가
   틀렸습니다 — 실명 창고 이름은 'apex_cli_real_'+cmWho() 인데 제가
   'apex_cm_real' 이라고 지어 심었습니다. <b>이 판에서 여섯 번째</b>입니다.
   그래서 이 자는 실명도 가린 이름도 <b>손으로 적지 않습니다</b> —
   앱이 쓰는 그 자(cmRealSet · osMaskName)에게 맡기고 돌려받아 견줍니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8971;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 점검 데이터의 이름은 <b>홍길동</b> 꼴입니다 (3번).
   ★ 세 글자라야 가린 꼴(홍*배)과 실명(홍보배)이 <b>다른 글자</b>가 됩니다.
   ★ 실명은 <b>앱이 쓰는 그 자</b>(cmRealSet)로 심습니다 — 창고 이름을
     손으로 지어 심었다가 앱을 모함한 적이 있습니다.                   */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 window.__T='';
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;CM.meta={c4:{db:'d4'}};
 var 실명='홍보배', 가린=osMaskName(실명);
 window.__REAL=실명; window.__MASK=가린;
 try{ cmRealSet('c4',실명); }catch(e){}
 window.__STORED=(typeof cmRealOf==='function')?cmRealOf('c4'):'';
 var CLI=[{id:'c4',who:'me',name:실명,nm:실명,name_masked:가린,by:1985,gd:'M'}];
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.db=[{id:'d4',who:'me',name:실명,stage:'PC',days:3,region:'서울 강남구',src:'DB'}];
 AR.cliRows=CLI;
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=CLI.map(function(c){return {id:c.id,name:c.name,nm:c.nm,name_masked:c.name_masked,who:'me',owner:'me'};});
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.noSum=false;CHKS.fin={};CHKS.at='00:00';
 CHKS.by={};
 try{localStorage.removeItem('apex_hm_fold_v1');localStorage.removeItem('apex_ck_day');}catch(e){}
 HWHO.id='';
 ${o.아무도없이 ? 'try{OSC.current=null;}catch(e){}' : "try{ osOpenClient('c4'); }catch(e){}"}
 go('home');`;

/* 그 화면을 세우고, <b>정말 그 화면인지 확인한 뒤에</b> 칸을 읽습니다.
   ★ 틀 화면(sangdam·frmake)은 #dynPane 을 바꾸지 않아, 확인 없이 읽으면
     <b>한 걸음 전 화면</b>을 읽습니다 — 이 판에서 실제로 그랬습니다.   */
const 읽기 = async (p, tab, id) => await p.evaluate(async a => {
  const [tab, id] = a;
  try { go(tab); } catch (e) { return { X: String(e.message).slice(0, 50) }; }
  let 쟀나 = false;
  for (let i = 0; i < 28; i++) {
    await new Promise(r => setTimeout(r, 250));
    try { if (currentTab() === tab) { 쟀나 = true; break; } } catch (e) {}
  }
  let v = '', 어디 = '';
  for (let i = 0; i < 26; i++) {
    await new Promise(r => setTimeout(r, 520));
    const docs = [document];
    [...document.querySelectorAll('iframe')].filter(f => f.offsetParent).forEach(f => {
      try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {} });
    for (const d of docs) {
      let e2 = null; try { e2 = d.getElementById(id); } catch (e) {}
      if (!e2) continue;
      const cur = ('value' in e2 && e2.tagName === 'INPUT')
        ? (e2.value || '') : ((e2.innerText || e2.textContent || '').trim());
      if (cur) { v = cur; 어디 = (d === document ? '본체' : '틀'); break; }
    }
    if (v) break;
  }
  return { v, 어디, 쟀나 };
}, [tab, id]);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2200);
    return { ctx, p, errs };
  };
  const src = fs.readFileSync('app/index.html', 'utf8');
  const ba = fs.readFileSync('app/ba.html', 'utf8');
  /* 쪽지에 적은 보기가 규칙에 걸려 헛울은 적이 있습니다 — 걷어냅니다 (8번) */
  const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

  console.log('[3] ★ <b>묻는 자리는 하나</b> (5번)');
  {
    const n = (src.match(/var\s+CS_NM\s*=/g) || []).length;
    is(n === 1, '  어느 칸·어느 이름을 아는 표가 <b>한 벌</b>이다 — 지금 ' + n + '개');
    const 표 = (src.match(/var CS_NM=\{[\s\S]*?\n\};/) || [''])[0];
    is(/fact_find/.test(표) && /ai_prop/.test(표) && /sangdam/.test(표),
      '  표에 세 화면이 다 있다 (전·후 만들기는 저쪽 파일이 스스로 적습니다)');
    is(/out:true/.test(표) && /out:false/.test(표),
      '  표가 <b>어느 이름인지</b>까지 적는다 — out 칸이 둘 다 있다');
    const 몸 = 걷기((src.match(/function csFillNm\(tab\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(!!몸, '  csFillNm 이 있다');
    is(/CS_NM\[tab\]/.test(몸), '  표에서 <b>골라</b> 온다');
    is(!/tab\s*===\s*['"]/.test(몸), '  <b>삼항 사슬이 없다</b> — 화면을 더 이어도 빠뜨릴 자리가 없다');
    const w = 걷기((src.match(/function csNm\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    const wo = 걷기((src.match(/function csNmOut\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(/cmName/.test(w) && !/osMaskName/.test(w), '  실명은 <b>cmName</b> 하나에게만 묻는다');
    is(/hmOutNm/.test(wo), '  가린 이름은 <b>hmOutNm</b> 하나에게만 묻는다 — 제 손으로 가리지 않는다');
    is(!/['"]\*['"]|○/.test(w + wo), '  가림 글자를 <b>제 손으로 만들지 않는다</b>');
    const who = 걷기((src.match(/function csWho\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(/OSC\.current/.test(who), '  「지금 누구인가」 는 <b>고객 365일이 세운 것</b>을 본다 — 다시 고르지 않는다');
    const 부름 = (걷기(src).match(/csFillNm\(/g) || []).length;
    is(부름 === 2, '  부르는 자리가 <b>하나</b>다 (선언 1 + 호출 1 = 2) — 지금 ' + 부름);
  }

  console.log('\n[4] ★ <b>빠른 return 보다 앞</b>에서 부른다');
  {
    const i = src.indexOf('function go(tab){');
    const 몸 = src.slice(i, i + 190000);
    const 끝 = 몸.indexOf('\n}');
    const g = 몸.slice(0, 끝 > 0 ? 끝 : 190000);
    /* ★ <b>자리를 「머리에서 몇째 줄」 로 재지 않습니다.</b> 처음에는 그렇게
       쟀는데, go() 머리에 여섯 줄을 보태자 <b>check-stay</b> 가 빨개졌습니다 —
       그 자는 「주소를 적는 줄」 이 go() 앞 3,000글자 안에 있나를 보고 있어서,
       제 쪽지가 그 줄을 창 밖으로 밀어냈습니다. 쪽지 길이로 빨간불이 켜지는
       자는 헛것을 잡는 자입니다 (8번). 그래서 <b>뜻으로</b> 잽니다 —
       「지금 어디」 를 적은 뒤이고, <b>첫 빠른 return 앞</b>이면 맞습니다.   */
    const a = g.indexOf('csFillNm(tab)');
    const b = g.indexOf("replaceState(null,''");
    const c = g.indexOf('if(!_ok){');
    is(a > 0, '  go() 안에서 부른다');
    is(b > 0 && a > b, '  「지금 어디」(주소·lastTab)를 적은 <b>뒤</b>다 — 그 줄을 밀어내지 않는다');
    is(c > 0 && a < c, '  <b>첫 빠른 return 앞</b>이다 — 꼬리에 걸면 안 걸리는 화면이 있다');
    const 먼저 = /tab\s*===\s*'sangdam'[\s\S]{0,400}?return/.test(g);
    is(먼저, '  sangdam 이 go() 안에서 <b>먼저 return</b> 한다 — 그래서 꼬리에 걸 수 없다');
  }

  console.log('\n[6] ★ <b>끝이 있다</b> · 서버를 안 부른다 (7번)');
  {
    const i = src.indexOf('function csWho(){'), j = src.indexOf('function go(tab){');
    const 블록 = 걷기(src.slice(i, j));
    is(/tries\s*<\s*\d+/.test(블록), '  기다리는 데 <b>끝이 있다</b> — 영원히 돌지 않는다');
    is(!/fetch\(|osClient\(|supabase/.test(블록), '  이 블록이 <b>서버를 한 번도 안 부른다</b>');
    is(/if\(!v\)return/.test(블록.replace(/\s/g, '')), '  이름을 <b>모르면 안 채운다</b> (1번)');
    const put = 걷기((src.match(/function csPut\(doc,id,v\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(/el\.value/.test(put) && /return false/.test(put), '  csPut 이 <b>이미 적힌 칸을 돌려보낸다</b>');
    is(/dispatchEvent/.test(put), '  채운 뒤 <b>그 화면에 알려 준다</b> — 칸만 바꾸면 저쪽이 모른다');
  }

  console.log('\n[7] 🧑 전·후 만들기 — 받아 두고 <b>안 보여 주던</b> 자리');
  {
    const n = (ba.match(/id="baWho"/g) || []).length;
    is(n === 1, '  설 자리가 <b>하나</b>다 — 지금 ' + n + '개');
    const css = (ba.match(/\.bar \.who\{[^}]*\}/) || [''])[0];
    is(!!css, '  그 자리 옷(.bar .who)이 있다 — 한쪽만 있으면 벌거벗습니다');
    /* ★★ <b>없는 토큰을 쓰면 글자가 사라집니다.</b> 이 파일은 --ink·--line
       을 안 세웁니다 — 본체 이름을 그대로 가져다 쓰면 색이 비어 버립니다. */
    const 쓴것 = [...new Set((css.match(/var\(--[a-z0-9-]+\)/g) || []))];
    const 없는것 = 쓴것.filter(t => {
      const k = t.replace(/^var\(/, '').replace(/\)$/, '');
      return ba.indexOf(' ' + k + ':') < 0 && ba.indexOf(';' + k + ':') < 0 && ba.indexOf('\n' + k + ':') < 0;
    });
    is(없는것.length === 0,
      '  <b>그 파일에 있는 토큰</b>만 쓴다 — ' + 쓴것.length + '개 중 없는 것 ' + 없는것.length +
      (없는것.length ? (' ← ' + 없는것.join(' ')) : ''));
    const 채움 = (걷기(ba).match(/getElementById\('baWho'\)/g) || []).length;
    is(채움 === 1, '  채우는 자리가 <b>하나</b>다 (5번) — 지금 ' + 채움);
    const ri = 걷기((ba.match(/function renderIn\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    is(/HOST\.name/.test(ri), '  <b>이미 와 있던 이름</b>(HOST.name)을 쓴다 — 새로 받아 오지 않는다');
    is(/HOST\.name\s*\?/.test(ri) || /display=HOST\.name/.test(ri),
      '  없으면 <b>아무것도 안 세운다</b> (1번) — 「고객님」 으로 메우지 않는다');
  }

  const A = await open({});
  const 이름 = await A.p.evaluate(() => ({
    실명: window.__REAL, 가린: window.__MASK, 담긴것: window.__STORED,
    csNm: (typeof csNm === 'function') ? csNm() : '(없음)',
    csNmOut: (typeof csNmOut === 'function') ? csNmOut() : '(없음)' }));

  console.log('\n[0] 자가 제대로 섰나 — <b>씨가 앱을 모함하지 못하게</b>');
  is(이름.실명 !== 이름.가린, '  실명(' + 이름.실명 + ')과 가린 이름(' + 이름.가린 + ')이 <b>다른 글자</b>다');
  is(이름.담긴것 === 이름.실명, '  실명이 <b>앱이 쓰는 창고</b>에 담겼다 — cmRealOf 가 돌려준다');
  is(이름.csNm === 이름.실명, '  csNm() → <b>실명</b> 「' + 이름.csNm + '」 (화면·이 기기 자리)');
  is(이름.csNmOut === 이름.가린, '  csNmOut() → <b>가린 이름</b> 「' + 이름.csNmOut + '」 (밖으로 나가는 자리)');

  const 자리 = [['fact_find', 'ff_name', false], ['ai_prop', 'prName', true],
                ['sangdam', 'cName', false], ['frmake', 'baWho', true]];
  const 본것 = {};
  console.log('\n[1][2] ★★ 네 자리에 <b>어느 이름</b>이 들어갔나');
  for (const [tab, id, 가려야] of 자리) {
    const r = await 읽기(A.p, tab, id);
    본것[tab] = r;
    if (r.X) { is(false, '  ' + tab + ' — 터졌습니다: ' + r.X); continue; }
    is(r.쟀나, '  ' + tab + ' — <b>정말 그 화면을 쟀다</b>');
    const 실 = r.v.indexOf(이름.실명) >= 0, 가 = r.v.indexOf(이름.가린) >= 0;
    is(!!r.v, '  ' + tab + ' · ' + id + ' — 채워졌다 「' + r.v.slice(0, 18) + '」 (' + r.어디 + ')');
    if (가려야) is(가 && !실, '  ' + tab + ' — ★★ <b>가린 이름</b>이다 · 실명이 ' + (실 ? '<b>샜습니다</b>' : '없다') + ' (3번)');
    else        is(실, '  ' + tab + ' — ★★ <b>실명</b>이다 — 고객 앞에서 부를 이름입니다 (check-calface)');
  }

  console.log('\n[5] ★ <b>손으로 적어 두신 것을 안 덮는다</b>');
  const r5 = await A.p.evaluate(async () => {
    try { go('fact_find'); } catch (e) {}
    for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 250));
      try { if (currentTab() === 'fact_find') break; } catch (e) {} }
    const el = document.getElementById('ff_name');
    if (!el) return { 없음: 1 };
    el.value = '손으로적음';
    try { csFillNm('fact_find'); } catch (e) { return { X: String(e.message).slice(0, 40) }; }
    await new Promise(r => setTimeout(r, 1600));
    return { 값: document.getElementById('ff_name').value };
  });
  is(r5.값 === '손으로적음', '  적어 두신 글이 <b>그대로다</b> — 「' + (r5.값 || r5.X || '(칸 없음)') + '」');

  console.log('\n[5-b] ★ 이름을 <b>모르면 아무 칸도 안 채운다</b> (1번)');
  const B = await open({ 아무도없이: true });
  const r5b = await B.p.evaluate(async () => {
    const o = {};
    o.csNm = (typeof csNm === 'function') ? csNm() : 'X';
    o.csNmOut = (typeof csNmOut === 'function') ? csNmOut() : 'X';
    try { go('fact_find'); } catch (e) {}
    for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 250));
      try { if (currentTab() === 'fact_find') break; } catch (e) {} }
    await new Promise(r => setTimeout(r, 1800));
    const el = document.getElementById('ff_name');
    o.칸 = el ? el.value : '(칸 없음)';
    return o;
  });
  is(r5b.csNm === '' && r5b.csNmOut === '', '  고른 분이 없으면 <b>빈 글</b>이다 — 「고객님」 이 아니다');
  is(r5b.칸 === '', '  칸도 <b>그대로 비어 있다</b> — 「' + (r5b.칸 || '(비어 있음)') + '」');

  console.log('');
  const 터짐 = [...A.errs, ...B.errs];
  is(터짐.length === 0, '네 화면을 여는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? ' — ' + 터짐[0] : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.')
                  : '\n✓ 상담 화면이 「누구 상담인지」 를 압니다 — 그리고 밖으로는 가린 이름만 나갑니다.');
  process.exit(bad ? 1 : 0);
})();
