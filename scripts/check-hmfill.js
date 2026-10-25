/* ══════════════════════════════════════════════════════════════════
   check-hmfill.js (판 X194) — ⚖️ <b>판단이 「지금 할 것」 에 늘 서나</b> ·
   📥 <b>빈 보장분석 칸이 자리를 안 먹나</b> · ➕ <b>고객 추가가 가운데 서나</b>.

   사장님 말씀 (2026-10-25) —
     ① 「DB통합CRM에있는 고객과 여기서 바로 고객등록할수 있도록
        <b>무엇을 도울까요 와 가운데에 고객 추가 칸</b>을 넣어서 한번에」
     ② 「<b>지금 할 것에 빈칸이 많은데</b> 뉴스부터 아까 내용들 여기에
        <b>알차게 채워줘</b>」 → 고르신 것은 <b>⚖️ 판단</b>,
        줄일 자리로 고르신 것은 <b>📥 읽어 둔 보장분석 빈 칸</b>입니다.

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>자리를 안 내고 채우는 것.</b> 홈은 4.2화면 선(check-homeone)에
      붙어 있습니다. 판단 한 줄은 <b>76px</b> 이라, 어디선가 그만큼을 내지
      않으면 그 선을 넘습니다. 「올리지 말고 줄이십시오」(8번).
   ⓑ <b>아무것도 없는 칸이 자리를 먹는 것.</b> 띄워 둔 보장분석이 없는 날
      그 칸이 <b>197px</b> — 화면의 4분의 1 — 을 먹고 있었습니다.
      ⚠ 짧게 만들되 <b>칸을 없애면 안 됩니다</b> — 「있다 없다 하는 칸을
        없앱니다」(사장님 말씀 2026-09-26). 길(8통장 진단)도 그대로여야
        합니다(6번).
   ⓒ <b>두 번 서는 것.</b> 판단을 늘 세우면서 「이분 자세히」 안에도 그대로
      두면, 펴실 때 같은 줄이 <b>두 번</b> 섭니다 (5번).
   ⓓ <b>접힌 줄이 거짓말하는 것.</b> 「이분 자세히 ▾ · 판단 · …」 이라고
      적어 두면, 판단이 밖에 나와 있는데 안에 있다고 말하는 셈입니다 (1번).
   ⓔ <b>고객 추가가 배정 DB 로 직행하는 것.</b> 어느 쪽인지 먼저 물어야
      합니다 — 묻는 자리는 cregOpen 하나입니다 (판 X133). 배정 한도
      (일반 20 · 변액 +30)를 세는 자가 배정 DB 만 봐야 하기 때문입니다.
      ⚠ 문이 <b>몇 개</b>인지는 check-creg 가 셉니다 — 여기서는 <b>홈 그
        자리에 서서 눌리나</b>만 봅니다 (같은 것을 두 번 안 셉니다 · 5번).
   ⓕ <b>손가락.</b> 44px (판 X146·X147 의 바닥).
   ⚠ 홈 <b>총</b> 높이는 여기서 안 잽니다 — check-homeone 하나가 봅니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8972;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
const 정적 = /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|cdnjs\.cloudflare|unpkg\.com/;
let 바깥 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{}'); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 씨 — 이름은 <b>홍길동</b> 집안 (3번) */
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupShow=function(){return false;};window.setupDone=function(){return true;};
 window.setupCanRun=function(){return true;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.cliRows=[{id:'c1',name:'홍길동가',nm:'홍길동가'}];
 AR.db=[{id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'},
        {id:'d2',who:'me',name:'홍길동나',stage:'PC',days:3,region:'서울',src:'일반'}];
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[{id:'c1',name:'홍길동가',phone:'010'}];
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};HWHO.id='';
 try{ localStorage.removeItem('apex_hm_fold_v1'); }catch(e){}
 go('home');`;

const 본 = async (p) => await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const hgt = (e) => e ? Math.round(e.getBoundingClientRect().height) : -1;
  const now = q('.hm-now'), kb = q('#hmKbHost'), two = q('.hm-two');
  /* ★ <b>이름표로 찾습니다</b>(.hm-judge) — 글자로 찾으면 말이 한 자만
     바뀌어도 자가 눈을 감습니다. 이름은 판 X195 에서 달았습니다 (5번). */
  const 판단 = [].slice.call(document.querySelectorAll('.hm-now .hm-judge'));
  const cells = two ? [].map.call(two.children, c => ({
      글: (c.innerText || '').replace(/\s+/g, ' ').trim(),
      길: c.getAttribute('onclick') || '',
      키: Math.round(c.getBoundingClientRect().height) })) : [];
  return {
    카드: hgt(now),
    판단수: 판단.length,
    판단글: 판단.length ? 판단[0].innerText.replace(/\s+/g, ' ').trim() : '',
    아는것: document.querySelectorAll('.hm-now .t-row').length,
    접힌글: ((q('.hm-more-b')) || {}).innerText || '',
    kb키: hgt(kb),
    kb글: kb ? (kb.innerText || '').replace(/\s+/g, ' ').trim() : '',
    kb이름표: !!(kb && /읽어 둔 보장분석/.test(kb.innerText || '')),
    kb길: kb ? [].map.call(kb.querySelectorAll('[onclick]'), e => e.getAttribute('onclick')) : [],
    kb누를키: kb ? Math.max.apply(null, [].map.call(kb.querySelectorAll('[onclick]'),
                e => Math.round(e.getBoundingClientRect().height)).concat([0])) : 0,
    칸: cells, 칸줄키: hgt(two),
    작은글: (() => { let n = 0; if (!now) return -1;
      [now, ...now.querySelectorAll('*'), ...(kb ? [kb, ...kb.querySelectorAll('*')] : [])].forEach(e => {
        if (!(e.textContent || '').trim()) return;
        const px = parseFloat(getComputedStyle(e).fontSize || '0');
        if (px > 0 && px < 13) n++; }); return n; })()
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    if (!정적.test(u)) 바깥++;
    return r.abort();
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED); await p.waitForTimeout(2400);

  console.log('🧱 「지금 할 것」 을 채우고, 빈 칸은 줄이고, 가운데에 고객 추가 (판 X194)');
  const a = await 본(p);

  /* ── [1] ⚖️ 판단이 늘 선다 ────────────────────────────────────── */
  head('[1] ⚖️ <b>판단이 접히지 않고 늘 선다</b> — 사장님이 고르신 줄');
  is(a.판단수 === 1, '  「판단 — …」 줄이 <b>' + a.판단수 + '개</b> 선다 (접기 전인데도)');
  is(/①/.test(a.판단글) && /다음/.test(a.판단글),
     '  번호와 <b>다음 단계</b>가 같이 적힌다 — 「' + a.판단글.slice(0, 54) + '…」');
  is(a.아는것 === 0,
     '  🧭 <b>앱이 아는 것</b>은 아직 안 선다 — ' + a.아는것 + '줄 (그쪽은 873px 라 접힌 채여야 한다)');
  is(!/·\s*판단/.test(a.접힌글),
     '  접힌 줄이 <b>「판단」 이라고 안 적는다</b> — 밖에 나와 있는 것을 안에 있다 하면 거짓말이다 (1번)' +
     '  ← 「' + a.접힌글.replace(/\s+/g, ' ').trim() + '」');

  /* ── [2] 펴도 두 번 안 선다 ───────────────────────────────────── */
  head('[2] 🧬 <b>펴도 같은 줄이 두 번 안 선다</b> (5번)');
  await p.evaluate(() => { HM_MORE = true; try { hmPaint(); } catch (e) {} });
  await p.waitForTimeout(900);
  const o = await 본(p);
  is(o.판단수 === 1, '  펴 봐도 「판단 —」 은 <b>' + o.판단수 + '개</b> 다 (둘이면 두 곳이 각자 그리는 것이다)');
  is(o.아는것 > 0, '  펴면 🧭 <b>앱이 아는 것</b>이 선다 — ' + o.아는것 + '줄');
  is(/접기/.test(o.접힌글), '  펴면 머리가 <b>접기</b>로 바뀐다 — 「' + o.접힌글.trim() + '」');
  await p.evaluate(() => { HM_MORE = false; try { hmPaint(); } catch (e) {} });
  await p.waitForTimeout(700);

  /* ── [3] 📥 빈 칸이 자리를 안 먹는다 ──────────────────────────── */
  head('[3] 📥 <b>띄워 둔 것이 없는 날, 그 칸이 자리를 안 먹는다</b> — 고치기 전 197px');
  is(a.kb키 > 0 && a.kb키 <= 130,
     '  빈 날의 칸이 <b>' + a.kb키 + 'px</b> — 130px 이하 (고치기 전 197px)');
  is(a.kb이름표, '  <b>칸은 그대로 선다</b> — 「📥 읽어 둔 보장분석」 이름표가 있다 (「있다 없다 하는 칸을 없앱니다」)');
  is(/없습니다/.test(a.kb글), '  <b>없다고 사실대로</b> 적는다 — 「' + a.kb글.slice(0, 46) + '…」');
  is(/8통장|고객에게 붙이기/.test(a.kb글),
     '  <b>무엇을 하면 되는지</b> 적는다 — 「🙌 고객에게 붙이기」 를 말해 준다 (6번)');
  is(a.kb길.some(x => /wallets/.test(x)),
     '  <b>가는 길이 그대로</b>다 — 8통장 진단으로 간다 (' + (a.kb길[0] || '없음') + ')');
  is(a.kb누를키 >= 44,
     '  누르는 줄이 <b>' + a.kb누를키 + 'px</b> — 손가락이 닿는다 (44px · 판 X146·X147)');

  /* ── [4] ➕ 고객 추가가 가운데에 선다 ─────────────────────────── */
  head('[4] ➕ <b>고객 추가가 두 칸 가운데에 선다</b> — 사장님이 가리키신 자리');
  is(a.칸.length === 3, '  칸이 <b>' + a.칸.length + '개</b> — DB통합CRM · 고객 추가 · 무엇을 도울까요');
  is(a.칸.length === 3 && /고객 추가/.test(a.칸[1].글),
     '  <b>가운데</b>가 고객 추가다 — 「' + ((a.칸[1] || {}).글 || '') + '」');
  is(a.칸.length === 3 && /cregOpen/.test(a.칸[1].길),
     '  눌러서 <b>어느 쪽인지 먼저 묻는 창</b>으로 간다 — ' + ((a.칸[1] || {}).길 || '없음'));
  is(a.칸.every(c => !/hdbNew|go\('crm'\)/.test(c.길) || !/고객 추가/.test(c.글)),
     '  배정 DB 로 <b>직행하지 않는다</b> — 한도를 세는 자가 그 창 하나다 (판 X133)');
  is(a.칸줄키 > 0 && a.칸줄키 <= 100,
     '  칸이 셋이 되어도 줄 키가 <b>' + a.칸줄키 + 'px</b> — 100px 이하 (둘이던 때 95px)');

  /* 정말 열리나 */
  const 창 = await p.evaluate(() => {
    const t = [].slice.call(document.querySelectorAll('.hm-two>button'))
                .find(x => /고객 추가/.test(x.innerText));
    if (!t) return { 눌림: false };
    t.click();
    const sh = document.getElementById('cregSheet');
    return { 눌림: true, 열림: !!(sh && sh.classList.contains('on')),
             글: sh ? (sh.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 70) : '' };
  });
  await p.waitForTimeout(500);
  is(창.눌림 && 창.열림, '  <b>눌러 보니 등록 창이 뜬다</b> — 「' + (창.글 || '') + '…」');
  await p.evaluate(() => { try { cregClose(); } catch (e) {} });

  /* ── [5] 읽히나 · 터진 데 없나 ────────────────────────────────── */
  head('[5] 👓 <b>읽히나 · 조용히 터진 데가 없나</b>');
  is(a.작은글 === 0, '  <b>13px 미만 글씨가 없다</b> — ' + a.작은글 + '곳 (판 X146·X147 의 바닥)');
  is(errs.length === 0, '  화면이 터진 자리 <b>' + errs.length + '곳</b>' + (errs[0] ? (' — ' + errs[0]) : ''));
  is(바깥 === 0, '  <b>사장님 서버를 안 부른다</b> — ' + 바깥 + '번 (글꼴 CDN 은 안 셉니다)');

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ 「지금 할 것」 채우기 — 고칠 자리 ' + bad + '곳')
                  : '\n✓ 통과 — ⚖️ 판단이 늘 서고, 📥 빈 칸은 줄었고, ➕ 고객 추가가 가운데 섭니다');
  process.exit(bad ? 1 : 0);
})();
