/* ══════════════════════════════════════════════════════════════════
   check-handover.js — <b>그 분을 들고 계산기·미끼 레이더로 간다.</b>
   그리고 <b>실명은 따라가지 않는다.</b>

   사장님 말씀 (2026-10-09) — 지도의 ㉣ 을 고르셨습니다 —
     「계산기·미끼 레이더로 <b>그 분을 들고</b> 가지 않습니다 — 지금은
      담보 이름만 넘깁니다. 「암진단비」 를 들고 미끼 레이더로 가고,
      거기서 그 분이 누구였는지 사라집니다」

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   <b>실명이 따라 나가는 것</b>입니다. 미끼 레이더는 딴 문서(iframe)이고
   이름이 <b>주소(?nm=)</b> 에 실려 갑니다 — 주소는 화면 속에 글자로 남습니다.
   계산기도 딴 문서입니다. CLAUDE.md 3번 — 「새로 만드는 화면·엑셀 내보내기·
   AI 로 보내는 값·인쇄도 <b>마스킹이 기본</b>이다」.
   그래서 이 자는 「이름이 갔나」 보다 <b>「어느 이름이 갔나」</b> 를 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ <b>실명이 안 나간다</b> — 이 기기에 실명을 두어 두고도,
         미끼 주소와 계산기 칸에는 <b>가린 이름만</b> 있다 (3번)
     [2] ★ <b>가리는 법은 한 곳</b> — hmOutNm 이 osMaskName 을 부르고
         <b>cmName 을 안 부른다</b>(그 자는 실명을 돌려줍니다) · 제 손으로
         가림 글자를 만들지 않는다 (5번)
     [3] 🎣 미끼 레이더 — 주소에 <b>담보와 그 분</b>이 둘 다 실리고,
         저쪽 카드가 <b>그 분을 이름으로</b> 부른다
     [4] 🧮 계산기 — <b>고객명 칸(s_name)</b> 에 그 분이 들어간다.
         새 칸을 만들지 않는다 (5번)
     [5] ★ 이름을 모르면 <b>안 싣는다</b> (1번) — 「고객님」 으로 메우면
         저쪽 화면에 그것이 이름으로 섭니다
     [6] ★ <b>밀어 넣는 자리가 하나</b> (5번) — finPush 밖에서 apexFinLoad
         를 직접 보내는 자리가 없다. 둘이면 한쪽만 고쳐집니다

   ── ⚠ 이 판에서 제가 네 번 틀린 것 ────────────────────────────────
   재는 동안 제 <b>씨</b>가 네 번 앱을 모함했습니다 — 없는 주소(cal)를
   재고, 새 브라우저를 열어 「기억 안 한다」 고 읽고, 없는 함수 이름으로
   「고르개 없다」 고 읽고, 씨에 가림 글자를 손으로 적어 「두 이름」 이라고
   읽었습니다. <b>네 번 다 앱이 맞았습니다.</b>
   그래서 이 자는 가린 이름을 <b>손으로 적지 않습니다</b> — 앱이 쓰는
   그 자(osMaskName)에게 물어서 견줍니다. 씨가 앱을 모함하지 못하게.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8967;
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
   ★ 세 글자라야 가린 꼴(홍*배)과 실명(홍보배)이 <b>다른 글자</b>가 됩니다 —
     두 글자면 가려도 비슷해 「실명이 샜나」 를 가릴 수 없습니다.           */
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
 /* ★ <b>가린 이름을 손으로 적지 않습니다</b> — 앱이 쓰는 그 자에게 물어서
    담습니다. 손으로 적었다가 「두 이름」 이라고 잘못 읽은 적이 있습니다. */
 var 실명='홍보배', 가린=osMaskName(실명);
 window.__REAL=실명; window.__MASK=가린;
 var CLI=[{id:'c4',who:'me',name:실명,nm:실명,name_masked:가린}];
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.db=[{id:'d4',who:'me',name:${o.이름없이 ? "''" : '실명'},stage:'AP',days:2,region:'서울 강남구',src:'DB'}];
 AR.cliRows=CLI;
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=CLI.map(function(c){return {id:c.id,name:c.name,nm:c.nm,name_masked:c.name_masked,who:'me',owner:'me'};});
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.noSum=false;CHKS.fin={};CHKS.at='00:00';
 CHKS.by={c4:{at:'2026-10-01',sum:{top:{gain:[{n:'암진단비',b:2000,a:5000}],loss:[]}}}};
 try{localStorage.removeItem('apex_hm_fold_v1');localStorage.removeItem('apex_ck_day');}catch(e){}
 HWHO.id='';go('home');`;

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
  /* ⑥ 의 그 분 줄을 펴 놓습니다 — 거기에 두 단추가 섭니다 */
  const 펴기 = async (p) => {
    await p.evaluate(async () => {
      try { if (!hmFoldOpen('ms')) hmFoldToggle('ms'); } catch (e) {}
      try { hmMsPick(0); HM_MSP.j = 5; hmMsPaint(); } catch (e) {}
      await new Promise(r => setTimeout(r, 480));
      try { if (!hmFoldOpen('chkcov')) hmFoldToggle('chkcov'); } catch (e) {}
    });
    await p.waitForTimeout(400);
  };

  console.log('[2] ★ <b>가리는 법은 한 곳</b> (5번)');
  {
    const src = fs.readFileSync('app/index.html', 'utf8');
    const 몸 = (src.match(/function hmOutNm\(x\)\{[\s\S]*?\n\}/) || [''])[0];
    is(!!몸, '  hmOutNm 이 있다');
    is(/osMaskName/.test(몸), '  <b>osMaskName</b> 에게 묻는다 — 앱이 쓰는 그 자');
    is(!/cmName/.test(몸), '  <b>cmName 을 안 부른다</b> — 그 자는 이 기기의 <b>실명</b>을 돌려줍니다');
    /* ⚠ 처음에는 몸통 전체에서 가림 글자를 찾다가 <b>쪽지에 적힌 보기</b>에
       걸려 헛울었습니다. 쪽지를 걷어내고 <b>돌아가는 줄</b>만 봅니다 (8번). */
    const 줄만 = 몸.replace(/\/\*[\s\S]*?\*\//g, '');
    is(!/['"]\*['"]|○/.test(줄만), '  가림 글자를 <b>제 손으로 만들지 않는다</b>');
    const n = (src.match(/function\s+hmOutNm\s*\(/g) || []).length;
    is(n === 1, '  hmOutNm 이 <b>하나</b>다 — 지금 ' + n + '개');
    /* [6] 밀어 넣는 자리 — <b>늘지 않았나</b>
       ── 기준선 4 · 왜 1 이 아닌가 ──────────────────────────────────
       계산기에 값을 밀어 넣는 자리가 <b>넷</b>입니다. 이 판에서 둘을 하나로
       모았습니다(osFinOpen → finPush). 나머지 셋은 이 판에서 <b>안 건드렸습니다</b> —
         · 둘(osFinFlush · 상담자료→계산기)은 <b>apexFinFlow 를 같이</b> 보냅니다.
           상담 순서를 켜는 쪽지라, 한 줄로 접으면 그 길이 끊깁니다.
           그 길은 check-cmsend 가 지키고 있어 함부로 손대지 않습니다.
         · 하나(팩트파인딩 → 계산기)는 토스트 글이 달라 접으면 말이 사라집니다.
       <b>늘면 빨간불</b>입니다. 줄이면 기준선도 같이 내려 주십시오 (8번). */
    const 직접 = (src.match(/postMessage\(\{type:'apexFinLoad'/g) || []).length;
    is(직접 <= 4, '  apexFinLoad 를 보내는 자리 ' + 직접 + '곳 — 기준선 4 (이 판에서 5 → 4)');
    is(/function\s+finPush\s*\(/.test(src), '  finPush — <b>기다렸다 밀어 넣는</b> 자리가 있다');
    const g = (src.match(/function osFinOpen\(i\)\{[\s\S]*?\n\}/) || [''])[0];
    is(/finPush\(/.test(g), '  osFinOpen 도 <b>그 한 곳</b>을 부른다 (쌍둥이 기다림판이 없다)');
  }

  const A = await open({});
  await 펴기(A.p);

  console.log('\n[3] 🎣 미끼 레이더 — <b>담보와 그 분</b>이 둘 다 간다');
  const r3 = await A.p.evaluate(async () => {
    const o = {};
    o.실명 = window.__REAL; o.가린 = window.__MASK;
    try { const P = chkPeople(); o.hmOutNm = hmOutNm(P[0]); } catch (e) { o.hmOutNm = 'X'; }
    const h = document.getElementById('hmMsHost');
    const bs = [...(h ? h.querySelectorAll('button[onclick]') : [])]
      .map(e => (e.getAttribute('onclick') || ''));
    o.미끼단추 = bs.filter(x => /hmChkMk/.test(x))[0] || '';
    o.계산기단추 = bs.filter(x => /hmFinGo/.test(x))[0] || '';
    if (o.미끼단추) { try { eval(o.미끼단추); } catch (e) { o.터짐 = e.message.slice(0, 50); } }
    await new Promise(r => setTimeout(r, 900));
    const f = document.getElementById('mikkiFrame');
    o.주소 = f ? decodeURIComponent(f.getAttribute('src') || '') : '';
    return o;
  });
  is(r3.hmOutNm === r3.가린,
    '  hmOutNm 이 <b>앱과 같은 가림꼴</b>을 낸다 — 「' + r3.hmOutNm + '」 · 앱 「' + r3.가린 + '」');
  is(!!r3.미끼단추 && !!r3.계산기단추, '  ⑥ 에 <b>두 단추</b>가 선다');
  is(/cov=/.test(r3.주소) && /암진단비/.test(r3.주소), '  주소에 <b>담보</b>가 실린다');
  is(/nm=/.test(r3.주소) && r3.주소.indexOf(r3.가린) >= 0, '  주소에 <b>그 분</b>이 실린다 — ' + r3.주소.slice(-28));

  console.log('\n[1] ★★ <b>실명은 따라가지 않는다</b> (3번)');
  is(r3.주소.indexOf(r3.실명) < 0,
    '  미끼 주소에 실명(' + r3.실명 + ')이 <b>없다</b>' + (r3.주소.indexOf(r3.실명) >= 0 ? ' ← 샜습니다' : ''));
  is(r3.실명 !== r3.가린, '  자가 제대로 섰다 — 실명과 가린 이름이 <b>다른 글자</b>다');

  console.log('\n[3-b] 미끼 레이더 화면이 <b>그 분을 이름으로</b> 부른다');
  await A.p.waitForTimeout(2600);
  const r3b = await A.p.evaluate(() => {
    const f = document.getElementById('mikkiFrame');
    if (!f || !f.contentDocument) return { X: '틀을 못 읽음' };
    const d = f.contentDocument;
    const box = [...d.querySelectorAll('.card')].find(c => /홈에서 넘어온/.test(c.textContent || ''));
    return { 글: box ? (box.innerText || '').replace(/\s+/g, ' ').trim() : '' };
  });
  is(!r3b.X && r3b.글.indexOf(r3.가린) >= 0,
    '  저쪽 카드가 <b>그 분</b>을 적는다 — 「' + (r3b.글 || r3b.X || '').slice(0, 40) + '」');
  is(!r3b.X && r3b.글.indexOf(r3.실명) < 0, '  저쪽 카드에도 <b>실명이 없다</b>');

  console.log('\n[4] 🧮 계산기 — <b>고객명 칸</b>에 그 분이 들어간다');
  const r4 = await A.p.evaluate(async () => {
    const o = {};
    try { go('home'); } catch (e) {}
    await new Promise(r => setTimeout(r, 700));
    try { hmFinGo(window.__MASK); } catch (e) { o.X = e.message.slice(0, 50); }
    o.토스트 = window.__T || '';
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 700));
      const f = document.getElementById('finFrame');
      if (f && f.contentDocument) {
        const el = f.contentDocument.getElementById('s_name');
        if (el) { o.고객명 = el.value; if (el.value === window.__MASK) break; }
      }
    }
    return o;
  });
  is(r4.고객명 === r3.가린, '  계산기 <b>s_name</b> 에 그 분이 들어갔다 — 「' + r4.고객명 + '」');
  is((r4.고객명 || '').indexOf(r3.실명) < 0, '  계산기에도 <b>실명이 없다</b>');
  is(/계산기/.test(r4.토스트), '  무엇을 했는지 <b>말해 준다</b> — 「' + r4.토스트 + '」');

  console.log('\n[5] ★ 이름을 <b>모르면 안 싣는다</b> (1번)');
  const B = await open({ 이름없이: true });
  const r5 = await B.p.evaluate(() => {
    const o = {};
    try { o.hmOutNm = hmOutNm({ nm: '', name: '' }); } catch (e) { o.hmOutNm = 'X'; }
    try { o.빈것으로부르면 = hmOutNm(null); } catch (e) { o.빈것으로부르면 = 'X'; }
    /* 이름이 없을 때 계산기에 무엇이 들어가나 */
    try { hmFinGo(''); } catch (e) {}
    return o;
  });
  is(r5.hmOutNm === '', '  이름이 비면 <b>빈 글</b>이다 — 「고객님」 으로 메우지 않는다');
  is(r5.빈것으로부르면 === '', '  줄 자체가 없어도 안 터지고 <b>빈 글</b>이다');
  await B.p.waitForTimeout(1200);
  const r5b = await B.p.evaluate(() => {
    const f = document.getElementById('finFrame');
    if (!f || !f.contentDocument) return { 못읽음: 1 };
    const el = f.contentDocument.getElementById('s_name');
    return { 고객명: el ? el.value : '(칸 없음)' };
  });
  is(r5b.못읽음 === 1 || r5b.고객명 === '고객님' || r5b.고객명 === '',
    '  이름 없이 누르면 계산기 칸을 <b>안 건드린다</b> — 「' + (r5b.고객명 || '(안 열림)') + '」');

  console.log('');
  const 터짐 = [...A.errs, ...B.errs];
  is(터짐.length === 0, '그 분을 들고 가는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? ' — ' + 터짐[0] : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.') : '\n✓ 그 분을 들고 갑니다 — 그리고 실명은 따라가지 않습니다.');
  process.exit(bad ? 1 : 0);
})();
