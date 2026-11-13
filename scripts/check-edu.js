/* ══════════════════════════════════════════════════════════════════
   check-edu.js — 🌱 <b>성장</b> — 입사부터 경력자까지 한 길로
   (판 X379 · X380 → X409)

   사장님 말씀 (2026-11-06) — 「큰 카테고리에서 <b>교육</b>도 하나 만들어줘
   <b>도구 밑에</b> 거기에 교육자료 쓸것들 다 정리해서 넣어주고」.
   사장님 말씀 (2026-11-10) — 「입사부터, 과정, 경력자까지 레벨업이 되도록 …
   교육이나 지식에 관련된 엄청난 내용들 싹 정리해서 하나로 만들고,
   <b>단순화</b>하는 과정과 <b>숙지</b>하는 과정을 「성장」 칸이라는 아래 다
   만들고 정리」.

   ── 재어 보고 안 것 ───────────────────────────────────────────────
   과정이 셋(마스터 과정 14일 · 90일 아카데미 · 보험 마스터 아카데미)인데
   서로 몰랐고, 90일 아카데미는 「APEX 본인 점검란」 이라는 이름 뒤에 숨어
   있었습니다. 숙지하는 틀(열두 주제 · 교재 장 · 스스로 합격)은 숨은
   성장판 안에 이미 있었습니다. 지식은 서랍 다섯 갈래에 흩어져 있었습니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] 「성장」 묶음이 <b>상담 도구 바로 밑</b>이다 — 옛 이름 「교육」 이 안 남았다.
     [2] 교재 일곱이 <b>성장</b>에 있고, 현장에서 쥐는 일곱은 <b>상담 도구</b>에 남았다.
     [3] ★ <b>길이 하나도 안 사라졌다</b> (6번) — 일곱과 90일 아카데미가 그대로 열린다.
     [4] 🌱 성장 로드맵이 선다 — 네 장(한 길 · 익히기 · 매번 · 고객 앞) · 레벨 다섯.
         사장님 말씀 (2026-11-11) — 「…순차적으로 성장 가능하고 매번 사용할 수 있는 것들에
         분류까지」 · 「고객에게 필요한 내용들을 선별해서」.
     [5] ★ 표가 <b>성장 묶음을 다 들고</b> 있다 — 빠짐 0 · 헛것 0 · 겹침 0 (5번).
         교재 장 이름은 <b>교재 원본</b>(data1 · data2 · EXTRA)과 같다 (1번).
     [6] ★ <b>단순화</b> — 「지금 할 것 하나」 가 서고, 끝냈다고 하면 다음으로 넘어간다.
         체크는 <b>이 브라우저</b>에만 — 서버로 안 간다.
     [7] ★ <b>숙지</b> — 열두 주제를 GB_CUR 에서 <b>그대로</b> 읽고, 합격은 성장판과
         <b>같은 도장</b>(gbStamp)이다. 저장 자리를 따로 만들지 않았다 (5번).
     [8] ★ <b>매번</b> — 병 이름으로 찾으면 질병 보험가이드가 서고, 「암」 은 교재
         진단비 장을 찾는다. 찾기는 고객 앞도 같이 본다. 못 찾으면 못 찾았다고 한다 (1번).
    [12] ★ <b>분류</b> — 한 화면은 「매번」 과 「고객 앞」 중 <b>한쪽</b>에만. 고객 앞은 상담
         순서 다섯 마디이고, 설계사만 보는 것(소식지 · 대본 · 화법)은 고객 앞에 안 선다.
         한 길의 걸음에는 끝낸 뒤 어디로 가는지 꼬리표가 붙는다. 「왜 이렇게 나눴나」 는
         성장판 여섯 축(GB_AX)과 90일 구간(AC_ROAD)을 <b>그 표에서</b> 읽는다.
     [9] <b>등급 문</b>이 산다 — 설계사에게는 EM 두 칸이 안 서고, 교육매니저에게는 선다.
    [10] 「언제 쓰는지」 분류(NAV_WHEN)는 <b>안 건드렸다</b>.
    [11] 누르는 칸 44px 이상 · 글씨 13px 이상 · 그림 파일 0 · 서버는 합격 한 줄을
         처음 한 번만 · 콘솔 조용 · 폰 폭에서 옆으로 안 밀린다.

   ★ 네 자리 등록(메뉴·분류표·지도 사전·지도 그림)은 <b>check-newscr</b> 가
     봅니다 — 여기서 또 보지 않습니다 (5번).
   ★ ✍️ 콘텐츠 갈래는 <b>check-conthub</b> 가 봅니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9221;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
const GROW = fs.readFileSync(path.join(ROOT, 'app', 'apex-grow.js'), 'utf8');
const ACAD = ['data1.js', 'data2.js', 'index.html']
  .map(f => fs.readFileSync(path.join(ROOT, 'app', '보험아카데미', f), 'utf8')).join('\n');

/* 옮긴 교재 일곱 — 말씀하신 「교육자료 쓸것들」 */
const 옮긴것 = ['bohum', 'ta_train', 'jiin_grow', 'ta_say', 'rej_gym', 'bcd_lec', 'fp_talk'];
/* 현장에서 고객 앞에 쥐는 것 — 상담 도구에 <b>남아야</b> 합니다 */
const 남을것 = ['ta_script', 'saybook', 'silson5', 'mikki_talk', 'dz_guide', 'kijun', 'sangdam'];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_grow_v1'); } catch(e){}
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
   'osCliInfoLoad','osRepListLoad'].forEach(n => { window[n] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded=true; if(cb)cb(); };
  window.setupDone = function(){return true;}; window.setupCanRun = function(){return true;};
  window.osTabAllowed = function(){return true;}; window.toast = function(){};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.list=[]; CM.loaded=true; CM.meta={};
  /* 서버 대신 — 어떤 사슬로 불러도 빈 답을 주고, <b>합격 줄(scope pass)을 읽은
     횟수</b>만 셉니다 (7번). 다른 화면도 이 문을 쓰므로 사슬이 끊기면 안 됩니다. */
  window.__sbCalls = 0;
  window.osClient = function(){
    const mk = () => { let pass = false, sel = false;
      const p = new Proxy(function(){}, {
        get(t, k){
          if (k === 'then') return (ok, no) => { if (pass && sel) window.__sbCalls++;
            return Promise.resolve({ data: pass && sel ? [{ items: {} }] : [], error: null }).then(ok, no); };
          return (...a) => { if (k === 'eq' && a[0] === 'scope' && a[1] === 'pass') pass = true;
                             if (k === 'select') sel = true; return p; };
        } });
      return p; };
    return { from(){ return mk(); }, auth: { getSession(){ return Promise.resolve({ data: {} }); } } };
  };
  try{ osHideLoginGate(); }catch(e){}
};

(async () => {
  console.log('🌱 성장 — 입사부터 경력자까지 한 길로 (판 X379 · X380 → X409)');

  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  const 정적 = /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|cdnjs\.cloudflare|unpkg\.com/;
  /* 바깥을 막습니다 — 안 막으면 CI 에서 진짜 자료가 그려집니다 (check-netblock) */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + PORT) >= 0 || 정적.test(u)) ? r.continue() : r.abort();
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof go === 'function' && typeof renderGrow === 'function', { timeout: 60000 });
  await pg.evaluate(SEED);

  sec('[1] 「성장」 묶음이 <b>상담 도구 바로 밑</b>이다');
  const 차례 = await pg.evaluate(() => TABS.map(g => g.group));
  const i도구 = 차례.indexOf('상담 도구'), i성장 = 차례.indexOf('성장');
  is(i성장 >= 0, '  「성장」 묶음이 있다' + (i성장 < 0 ? ' ← 없습니다' : ''));
  is(i도구 >= 0 && i성장 === i도구 + 1,
     '  차례가 <b>상담 도구 → 성장</b> 이다 ← ' + 차례.slice(Math.max(0, i도구 - 1), i도구 + 3).join(' → '));
  is(차례.indexOf('교육') < 0 && 차례.indexOf('교육 자료') < 0, '  옛 이름 「교육」 · 「교육 자료」 묶음이 남아 있지 않다');

  sec('[2] 교재 일곱은 <b>성장</b>에 · 현장에서 쥐는 것은 <b>상담 도구</b>에');
  const 자리 = await pg.evaluate(() => {
    const m = {};
    TABS.forEach(g => (g.items || []).forEach(it => { m[it.id] = g.group; }));
    return m;
  });
  const 안옮김 = 옮긴것.filter(id => 자리[id] !== '성장');
  is(안옮김.length === 0, '  교재 <b>일곱</b>이 성장 갈래에 있다' +
     (안옮김.length ? ' ← ' + 안옮김.map(x => x + '(' + (자리[x] || '없음') + ')').join(', ') : ''));
  const 끌려감 = 남을것.filter(id => 자리[id] !== '상담 도구');
  is(끌려감.length === 0, '  현장에서 쥐는 <b>일곱</b>은 상담 도구에 남았다' +
     (끌려감.length ? ' ← ' + 끌려감.map(x => x + '(' + (자리[x] || '없음') + ')').join(', ') : ''));

  sec('[3] ★ <b>길이 하나도 안 사라졌다</b> (6번)');
  for (const id of 옮긴것.concat(['academy'])) {
    const 열림 = await pg.evaluate((k) => new Promise(r => {
      go(k);
      setTimeout(() => r({
        글자: (document.querySelector('#dynPane') || { innerText: '' }).innerText.replace(/\s+/g, ' ').trim().length,
        덮개: /-mode\b/.test(document.body.className),
        메뉴: (typeof navItemOf === 'function' && navItemOf(k)) ? navItemOf(k).title : '' }), 900);
    }), id);
    is((열림.글자 > 40 || 열림.덮개) && !!열림.메뉴,
       '  ' + id + ' — 메뉴에 「' + (열림.메뉴 || '(없음)') + '」 로 있고 열린다');
  }
  const 이름 = await pg.evaluate(() => (navItemOf('academy') || {}).title);
  is(이름 === '90일 아카데미', '  「APEX 본인 점검란」 이 <b>90일 아카데미</b> 로 불린다 ← ' + 이름);
  const 옛낱말 = await pg.evaluate(() => /본인 점검란/.test((navItemOf('academy') || {}).ak || ''));
  is(옛낱말, '  옛 이름은 <b>찾기 낱말</b>에 남았다 — 옛 이름으로 찾아도 열린다');

  sec('[4] 🌱 성장 로드맵이 선다 — 네 장 · 레벨 다섯');
  const E = await pg.evaluate(() => new Promise(r => {
    go('edu');
    setTimeout(() => r({
      제목: (document.querySelector('#dynPane .page-title') || {}).innerText || '',
      장: [].slice.call(document.querySelectorAll('#dynPane .gr-seg button')).map(x => x.innerText.replace(/\s+/g, ' ')),
      층: document.querySelectorAll('#dynPane .gr-lad button').length,
      지금: (document.querySelector('#dynPane .gr-now .n') || {}).innerText || '',
      목표: GR_LV.filter(L => !L.goal || !L.t || !L.s).length,
      글: (document.querySelector('#dynPane') || { innerText: '' }).innerText,
      img: document.querySelectorAll('#dynPane img').length,
      sw: document.documentElement.scrollWidth, iw: innerWidth }), 900);
  }));
  is(/성장 로드맵/.test(E.제목), '  화면이 선다 ← ' + E.제목);
  is(E.장.length === 4 && /한 길/.test(E.장[0]) && /익히기/.test(E.장[1]) && /매번/.test(E.장[2]) && /고객 앞/.test(E.장[3]),
     '  네 장 — ' + E.장.join(' · '));
  is(E.층 === 5, '  레벨 <b>다섯</b>(Lv.0~4) ← ' + E.층);
  is(E.목표 === 0, '  레벨마다 이름 · 한 줄 · 목표가 있다');
  is(!/undefined|NaN|\[object/.test(E.글), '  화면에 <b>부서진 값</b>이 없다');
  is(E.img === 0, '  <b>그림 파일을 안 받아 온다</b> — img ' + E.img + '개 (9번)');
  is(E.sw <= E.iw, '  폰 폭(' + E.iw + 'px)에서 <b>옆으로 안 밀린다</b> ← ' + E.sw + 'px');

  sec('[5] ★ 표가 <b>성장 묶음을 다 들고</b> 있다 (5번)');
  const D = await pg.evaluate(() => {
    const g = TABS.filter(x => x.group === '성장')[0];
    const 메뉴 = (g ? g.items : []).map(x => x.id).filter(x => x !== 'edu');
    const 모든 = {}; TABS.forEach(x => (x.items || []).forEach(it => { 모든[it.id] = 1; }));
    const 길 = [], 창고 = [], 길판 = [], 구간 = [];
    GR_LV.forEach(L => L.st.forEach(s => { if (s.go) 길.push(s.go); if (s.acad) 길판.push(s.acad); if (s.road != null) 구간.push(s.road); }));
    GR_KNOW.forEach(k => k.it.forEach(s => { 창고.push(s.go ? 'go:' + s.go : 'acad:' + s.acad); if (s.acad) 길판.push(s.acad); }));
    const 고객 = []; GR_CUST.forEach(k => k.it.forEach(s => { 고객.push(s.go ? 'go:' + s.go : 'acad:' + s.acad); }));
    const 창고go = 창고.filter(x => /^go:/.test(x)).map(x => x.slice(3));
    const 다 = 길.concat(창고go, 고객.filter(x => /^go:/.test(x)).map(x => x.slice(3)));
    return { 메뉴: 메뉴,
             빠진: 메뉴.filter(x => 다.indexOf(x) < 0),
             헛것: 다.filter(x => !모든[x]),
             겹침: 창고.filter((x, i) => 창고.indexOf(x) !== i),
             고객겹침: 고객.filter((x, i) => 고객.indexOf(x) !== i),
             양쪽: 고객.filter(x => 창고.indexOf(x) >= 0),
             판: 길판.filter((x, i) => 길판.indexOf(x) === i),
             없는판: 길판.filter(x => !GR_ACAD[x]),
             없는구간: 구간.filter(x => !AC_ROAD[x]),
             구간수: AC_ROAD.length, 쓴구간: 구간.filter((x, i) => 구간.indexOf(x) === i).length };
  });
  is(D.빠진.length === 0, '  성장 묶음의 ' + D.메뉴.length + '칸이 <b>전부</b> 한 길 · 매번 · 고객 앞에 섰다' +
     (D.빠진.length ? ' ← 빠짐: ' + D.빠진.join(', ') : ''));
  is(D.헛것.length === 0, '  표에 <b>메뉴에 없는 화면</b>이 없다' + (D.헛것.length ? ' ← ' + D.헛것.join(', ') : ''));
  is(D.겹침.length === 0 && D.고객겹침.length === 0, '  「매번」 · 「고객 앞」 안에서 같은 것이 <b>두 갈래에</b> 서지 않는다' +
     (D.겹침.length || D.고객겹침.length ? ' ← ' + D.겹침.concat(D.고객겹침).join(', ') : ''));
  is(D.양쪽.length === 0, '  ★ 한 화면은 「매번」 과 「고객 앞」 중 <b>한쪽</b>에만 선다' + (D.양쪽.length ? ' ← ' + D.양쪽.join(', ') : ''));
  is(D.없는판.length === 0 && D.없는구간.length === 0, '  교재 장 · 90일 구간이 <b>있는 것만</b> 가리킨다' +
     (D.없는판.length || D.없는구간.length ? ' ← ' + D.없는판.concat(D.없는구간).join(', ') : ''));
  is(D.쓴구간 === D.구간수, '  90일 아카데미 <b>' + D.구간수 + '구간이 다</b> 한 길에 섰다 ← ' + D.쓴구간);
  /* 교재 장 이름은 교재 원본과 같아야 합니다 — 옮겨 적은 이름이 낡으면 없는 장을 가리킵니다 (1번) */
  const 이름표 = {};
  (GROW.match(/GR_ACAD=\{[\s\S]*?\};/) || [''])[0].replace(/(\w+):'([^']+)'/g, (m, k, v) => { 이름표[k] = v; });
  const 어긋남 = Object.keys(이름표).filter(k => {
    const t = 이름표[k];
    return ACAD.indexOf('id:"' + k + '"') >= 0 ? ACAD.indexOf('title:"' + t + '"') < 0
         : ACAD.indexOf("id:'" + k + "',title:'" + t + "'") < 0;
  });
  is(Object.keys(이름표).length >= 11 && 어긋남.length === 0,
     '  교재 장 이름 ' + Object.keys(이름표).length + '개가 <b>교재 원본</b>과 같다' + (어긋남.length ? ' ← ' + 어긋남.join(', ') : ''));

  sec('[6] ★ <b>단순화</b> — 지금 할 것 하나 · 끝내면 다음으로');
  const S = await pg.evaluate(() => new Promise(r => {
    localStorage.removeItem('apex_grow_v1'); grLv(0); grTab('path');
    const a = (document.querySelector('.gr-now .n') || {}).innerText || '';
    const 서버전 = window.__sbCalls;
    document.querySelector('.gr-now .gr-b.ghost').click();
    setTimeout(() => {
      const b = (document.querySelector('.gr-now .n') || {}).innerText || '';
      const 저장 = JSON.parse(localStorage.getItem('apex_grow_v1') || '{}');
      const 걸음 = grSteps(0).length;
      grLv(1);
      const c = (document.querySelector('.gr-lad button.on') || {}).innerText || '';
      r({ a, b, 저장: Object.keys(저장.done || {}).length, 서버: window.__sbCalls - 서버전,
          걸음, 펼친: document.querySelectorAll('#dynPane .gr-st').length, c });
    }, 200);
  }));
  is(!!S.a && S.a !== S.b, '  「끝냈어요」 를 누르면 <b>다음 걸음</b>으로 ← ' + S.a + ' → ' + S.b);
  is(S.저장 === 1 && S.서버 === 0, '  체크는 <b>이 브라우저</b>에만 — 서버 ' + S.서버 + '번');
  is(/Lv\.1/.test(S.c), '  레벨을 누르면 <b>그 레벨 하나만</b> 펴진다 ← ' + S.c.replace(/\s+/g, ' ') + ' · ' + S.펼친 + '걸음');

  sec('[7] ★ <b>숙지</b> — 열두 주제 · 성장판과 같은 도장');
  const L = await pg.evaluate(() => new Promise(r => {
    grTab('learn');
    setTimeout(() => {
      const n = document.querySelectorAll('#dynPane .gr-su').length;
      const 이름 = [].slice.call(document.querySelectorAll('#dynPane .gr-su .nm')).map(x => x.innerText);
      const 같다 = 이름.join('|') === GB_CUR.map(c => c[1]).join('|');
      const 첫서버 = window.__sbCalls;
      grTab('path'); grTab('learn');
      setTimeout(() => {
        const 둘째서버 = window.__sbCalls;
        let 부름 = 0; const 원래 = window.gbStamp;
        window.gbStamp = function (s) { 부름++; return 원래.apply(this, arguments); };
        grStamp(GB_CUR[0][0]);
        setTimeout(() => {
          const 켜짐 = document.querySelectorAll('#dynPane .gr-su.on').length;
          grStamp(GB_CUR[0][0]); window.gbStamp = 원래;
          r({ n, 같다, 첫서버, 둘째서버, 부름, 켜짐, 꺼짐: document.querySelectorAll('#dynPane .gr-su.on').length,
              책: document.querySelectorAll('#dynPane .gr-su .gr-tool').length });
        }, 150);
      }, 300);
    }, 400);
  }));
  is(L.n > 0 && L.같다, '  열두 주제를 <b>GB_CUR 그대로</b> 읽는다 ← ' + L.n + '개');
  is(L.첫서버 === 1 && L.둘째서버 === 1, '  합격 기록은 <b>처음 한 번만</b> 읽는다 (7번) ← ' + L.첫서버 + ' · ' + L.둘째서버);
  is(L.부름 === 2 && L.켜짐 === 1 && L.꺼짐 === 0, '  합격은 <b>gbStamp</b>(성장판과 같은 도장)로 켜지고 꺼진다 ← 부름 ' + L.부름 + ' · 켜짐 ' + L.켜짐 + ' · 꺼짐 ' + L.꺼짐);
  is(!/upsert|daily_checks'\)\.insert/.test(GROW), '  apex-grow.js 가 <b>저장 자리를 따로</b> 안 만든다 (5번)');
  is(L.책 >= L.n, '  주제마다 <b>교재 · 화법서</b>로 가는 단추가 있다');

  sec('[8] ★ <b>매번</b> — 찾기');
  const K = await pg.evaluate(() => new Promise(r => {
    grTab('know');
    const 줄 = () => [].slice.call(document.querySelectorAll('#grKnow .gr-row')).map(x => x.innerText.replace(/\s+/g, ' '));
    const 전체 = 줄().length;
    grFind('갑상선'); const a = 줄();
    grFind('암'); const b = 줄();
    grFind('명함'); const d = [].slice.call(document.querySelectorAll('#grKnow .t-card')).map(x => x.innerText.replace(/\s+/g, ' '));
    grFind('ㅋㅋㅋ없는말'); const c = (document.querySelector('#grKnow .gr-none') || {}).innerText || '';
    grFind('');
    r({ 전체, a, b, c, d });
  }));
  is(K.전체 >= 35, '  매번 꺼내는 것이 <b>한 칸</b>에 — ' + K.전체 + '줄');
  is(K.d.some(x => /명함/.test(x) && /고객 앞/.test(x)), '  찾기는 <b>고객 앞</b>도 같이 본다 — 「명함」 → 디지털 명함(🤝 고객 앞)');
  is(K.a.some(x => /질병 보험가이드/.test(x) && /찾은 병/.test(x)), '  「갑상선」 → <b>질병 보험가이드</b> 와 찾은 병 이름');
  is(K.b.some(x => /진단비/.test(x)), '  「암」 → 교재 <b>진단비</b> 장도 선다');
  is(/찾은 것이 없습니다/.test(K.c), '  못 찾으면 <b>못 찾았다</b>고 한다 (1번)');

  sec('[9] <b>등급 문</b> — 못 여는 칸은 안 그린다 (1번)');
  const 문 = await pg.evaluate(() => new Promise(r => {
    const 센다 = () => [].slice.call(document.querySelectorAll('#dynPane .gr-st .n'))
                        .map(x => x.innerText.replace(/\s+/g, ' ').trim()).join(' | ');
    OS.profile.role = 'fp'; go('edu'); grTab('path'); grLv(4);
    setTimeout(() => {
      const 설계사 = 센다();
      OS.profile.role = 'education_manager'; grPaint();
      setTimeout(() => { const em = 센다(); OS.profile.role = 'fp'; r({ 설계사, 교육매니저: em }); }, 300);
    }, 300);
  }));
  is(!/운영센터|교육 캘린더/.test(문.설계사), '  설계사에게는 <b>EM 두 칸이 안 선다</b>');
  is(/운영센터/.test(문.교육매니저) && /교육 캘린더/.test(문.교육매니저), '  교육매니저에게는 <b>선다</b>');

  sec('[10] 「언제 쓰는지」 분류는 <b>안 건드렸다</b>');
  const W = await pg.evaluate((o) => {
    const out = {};
    o.forEach(id => { out[id] = NAV_WHEN[id] || '(없음)'; });
    return { 분류: out, edu: NAV_WHEN['edu'] || '(없음)' };
  }, 옮긴것);
  const 바뀜 = 옮긴것.filter(id => W.분류[id] !== (id === 'bohum' ? 'know' : 'meet'));
  is(바뀜.length === 0, '  옮긴 일곱의 「언제 쓰는지」 가 <b>그대로</b>다' +
     (바뀜.length ? ' ← ' + 바뀜.map(x => x + '→' + W.분류[x]).join(', ') : ''));
  is(W.edu === 'know', '  🌱 성장 로드맵은 <b>찾아보고 배우기</b> 다 ← ' + W.edu);

  sec('[12] ★ <b>분류</b> — 고객 앞 · 꼬리표 · 왜 이렇게 나눴나');
  const C = await pg.evaluate(() => new Promise(r => {
    OS.profile.role = 'fp'; go('edu'); grTab('cust');
    setTimeout(() => {
      const 마디 = [].slice.call(document.querySelectorAll('#grHost .t-card .gr-hd')).map(x => x.firstChild ? x.firstChild.textContent : '');
      const 글 = (document.querySelector('#grHost') || { innerText: '' }).innerText;
      const 줄 = [].slice.call(document.querySelectorAll('#grHost .gr-row b')).map(x => x.innerText);
      const 안됨 = (document.querySelector('#grHost .gr-no') || { innerText: '' }).innerText;
      const 표안됨 = GR_CUST.some(g => g.it.some(s => ['insight', 'ta_script', 'ta_say', 'dz_guide', 'keep4', 'growboard', 'emcenter'].indexOf(s.go) >= 0));
      grTab('path'); grLv(1);
      const 꼬리 = [].slice.call(document.querySelectorAll('#grHost .gr-use')).map(x => x.innerText);
      const why = document.querySelector('#grHost details.gr-why');
      const 축 = why ? why.querySelectorAll('.gr-ax')[0] : null;
      r({ 마디, 줄: 줄.length, 안됨, 표안됨, 꼬리, why: !!why, 접힘: why ? !why.open : false,
          축: 축 ? 축.querySelectorAll('span').length : 0, 축수: GB_AX.length,
          구간: why ? (why.querySelectorAll('.gr-ax')[1] || { children: [] }).children.length : 0,
          구간수: AC_ROAD.filter(x => /→/.test(x.grow || '')).length, 글 });
    }, 300);
  }));
  const 마디 = C.마디.filter(x => /^[①②③④⑤]/.test(x));
  is(마디.length === 5 && 마디.every((x, i) => x.indexOf('①②③④⑤'[i]) === 0), '  고객 앞이 <b>상담 순서 다섯 마디</b>로 선다 ← ' + 마디.join(' · '));
  is(C.줄 >= 15, '  고객과 같이 보거나 보내는 화면 ' + C.줄 + '개');
  is(/고객 제시 불가/.test(C.안됨), '  상품전략기는 <b>그 화면에 적힌 말</b>(「고객 제시 불가」)로 막는다');
  is(!C.표안됨, '  ★ 설계사만 보는 것(소식지 · 대본 · 화법 · 팀 숫자)은 <b>고객 앞 표에 없다</b>');
  is(/상품전략기/.test(C.안됨) && /대본/.test(C.안됨), '  「고객 앞에 꺼내지 않는 것」 을 <b>까닭과 함께</b> 적는다');
  is(C.꼬리.some(x => /매번/.test(x)), '  한 길의 걸음에 <b>끝낸 뒤 어디로 가나</b> 꼬리표 — ' + (C.꼬리[0] || '(없음)'));
  is(C.why && C.접힘, '  「왜 이렇게 나눴나」 가 한 길 밑에 <b>접혀</b> 있다');
  is(C.축 === C.축수 && C.구간 === C.구간수 && C.구간 > 0,
     '  성장 기준은 <b>성장판 여섯 축 · 90일 구간</b>을 그 표에서 읽는다 ← 축 ' + C.축 + '/' + C.축수 + ' · 구간 ' + C.구간 + '/' + C.구간수);
  is(!/undefined|NaN|\[object/.test(C.글), '  고객 앞에 <b>부서진 값</b>이 없다');

  sec('[11] 읽히나 · 누를 수 있나 · 조용한가');
  const R = await pg.evaluate(() => new Promise(r => {
    const out = { h: [], fs: [] };
    const 잰다 = () => {
      [].slice.call(document.querySelectorAll('#grHost button, #grHost input')).forEach(b => {
        if (b.offsetParent) out.h.push(Math.round(b.getBoundingClientRect().height)); });
      [].slice.call(document.querySelectorAll('#grHost *')).forEach(e => {
        if (e.offsetParent && [].some.call(e.childNodes, n => n.nodeType === 3 && n.textContent.trim()))
          out.fs.push(parseFloat(getComputedStyle(e).fontSize)); });
    };
    ['path', 'learn', 'know', 'cust'].forEach(t => { grTab(t); 잰다(); });
    grTab('path'); const w = document.querySelector('#grHost details.gr-why'); if (w) { w.open = true; 잰다(); w.open = false; }
    r({ h: Math.min.apply(null, out.h), fs: Math.min.apply(null, out.fs) });
  }));
  is(R.h >= 44, '  누르는 칸이 <b>44px 이상</b> — 가장 낮은 칸 ' + R.h + 'px');
  is(R.fs >= 13, '  글씨가 <b>13px 이상</b> — 가장 작은 글씨 ' + R.fs + 'px');
  const 그리개 = ['renderGrow', 'grInnerHtml', 'grPathHtml', 'grLearnHtml', 'grKnowHtml', 'grKnowList', 'grStamp', 'grCustHtml', 'grWhyHtml', 'grUseOf'];
  const 조용 = 그리개.filter(n => {
    const i = GROW.indexOf('function ' + n + '(');
    if (i < 0) return true;
    const j = GROW.indexOf('\nfunction ', i + 10);
    return /osClient\(|sb\.from\(|fetch\(/.test(GROW.slice(i, j < 0 ? GROW.length : j));
  });
  is(조용.length === 0, '  그리는 함수가 <b>서버를 안 부른다</b> — 부르는 곳은 grPassLoad 하나 (7번)' + (조용.length ? ' ← ' + 조용.join(', ') : ''));
  is(errs.length === 0, '  콘솔이 조용하다' + (errs.length ? ' ← ' + errs[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지가 어긋납니다'); process.exit(1); }
  console.log('✓ 성장 — 도구 바로 밑에 서고, 한 길 · 익히기 · 매번 · 고객 앞이 한 화면에 섰고, 길은 하나도 안 사라졌습니다.');
})();
