/* ══════════════════════════════════════════════════════════════════
   check-hmjudge.js — 🧭 <b>판단 · 앱이 아는 것</b>이 거짓말을 안 하나.

   사장님 말씀 (2026-09-27 · 목각) — 「판단 — ① 가입이 되는 분인가
   ② 어느 통장이 비었나 ③ 무엇을 펴 놓나 · 다음 PC」 그리고
   「앱이 이미 아는 것 — …를 다 갖고 있습니다」.

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] AP 한 분에게 <b>판단 세 줄</b>과 <b>다음 단계</b>가 선다
     [2] <b>말이 한 곳에서</b> 온다 (5번) — apex-stage.js 의 MAP.
         본체에 판단 글을 또 적으면 DB 통합 CRM 과 다른 말을 한다
     [3] ★ <b>표에 없는 단계에는 안 세운다</b> (1번) — 거절에 「다음
         단계」 를 지어 붙이지 않는다 (사장님 말씀)
     [4] ★ <b>있는 화면만 가리킨다</b> (1번) — 「갖고 있습니다」 라고
         적어 놓고 눌러서 안 열리면 고객 앞에서 드러난다
     [5] <b>새 CSS·새 class 를 안 만들었나</b> (사장님 계약)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9031;
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

/* 견본 — AP 한 분. 이름은 「홍길동」 (3번) */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const me=(typeof arMyId==='function')?arMyId():'me';
  AR.db=[{id:'d1',who:me,name:'홍길동A',region:'강남구',src:'보장분석10DB',stage:'AP',
          cAt:'',pAt:'',got:'2026-08-01',n:2,last:'2026-09-25',res:'상담',appt:'',memo:'',days:2}];
  try{ osHideLoginGate(); }catch(e){}
  /* ⚠ 2026-09-30 — 「이분 자세히」 가 <b>접힌 채가 기본</b>이 됐습니다 (사장님 말씀 「그 넷도 접어」). 접힌 채로 재면 여기 보려는 것이 화면에 없습니다 — <b>먼저 펴고 잽니다.</b> check-tdo·check-homeshape 가 이미 쓰는 방법입니다 (5번). ★ <b>재는 것은 하나도 안 줄였습니다</b> — 펴 놓고 보면 그것이 제대로 서나. 자를 옮기지 지우지 않습니다 (8번). ★ <b>접힌 채로 열리는지</b>는 check-hmtwo 가 봅니다. */
  try{ HM_MORE=true; }catch(e){}
  go('home');
};
const CARD = () => {
  const e = document.querySelector('#dynPane .hm-now');
  if (!e) return { 없음:true };
  const note = [].slice.call(e.querySelectorAll('.t-note')).map(x => x.innerText.replace(/\s+/g,' ').trim());
  return { t: e.innerText.replace(/\s+/g,' ').trim(), 쪽지: note,
           칩: [].slice.call(e.querySelectorAll('.t-chips .t-chip'))
                 .map(x => ({ t:x.textContent.trim(), go:x.getAttribute('onclick')||'' })) };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await p.evaluate(SEED); await p.waitForTimeout(1200);

  console.log('\n[1] AP 한 분에게 <b>판단</b>과 <b>다음 단계</b>가 선다');
  const A = await p.evaluate(CARD);
  is(!A.없음, '  「지금 할 것」 카드가 선다');
  const 판단 = A.쪽지.filter(x => /^판단/.test(x))[0] || '';
  is(!!판단, '  <b>판단</b> 줄이 선다 — ' + (판단 || '(없음)').slice(0, 60));
  /* ★ 판단 <b>글자를 여기 안 박습니다</b> — 표를 고치면 이 줄이 낡아
     새 판단을 <b>재지 않고</b> 초록불을 켭니다 (8번). 표에서 읽어 견줍니다. */
  const 표 = await p.evaluate(() => (APEX_STAGE.map.AP || {}).q || []);
  is(표.length === 3, '  표에 판단이 <b>셋</b>이다 — ' + 표.join(' · '));
  const 빠진 = 표.filter(q => 판단.indexOf(q) < 0);
  is(빠진.length === 0, '  ★ 화면이 <b>표 그대로</b> 적는다' +
     (빠진.length ? (' ← 빠짐 ' + 빠진.join(' · ')) : ''));
  is(/①/.test(판단) && /②/.test(판단) && /③/.test(판단), '  <b>번호</b>가 붙는다 — ①②③');
  const 다음 = await p.evaluate(() => APEX_STAGE.next('AP'));
  is(!!다음 && 판단.indexOf(다음) >= 0, '  <b>다음 단계</b>가 붙는다 — 다음 ' + 다음);

  console.log('\n[2] ★ <b>말이 한 곳에서</b> 온다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const STG = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  /* ★ <b>주석은 코드가 아닙니다.</b> 「목각에 이렇게 적혀 있다」 고 <b>적어
     둔 것</b>까지 세면, 왜 그렇게 했는지 설명을 남길수록 빨간불이 켜집니다
     (8번). check-onepal · check-cusglance 와 같은 처리입니다. */
  const SRC_C = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ')
                   .replace(/var APP_BUILD_NOTE=[\s\S]*?;\n/, ' ');
  표.forEach(q => is(SRC_C.indexOf(q) < 0,
    '  본체에 <b>「' + q + '」</b> 를 또 안 적었다 (주석은 빼고 셉니다)'));
  is((STG.match(/q:\['가입이 되는 분인가'/g) || []).length === 1,
     '  판단이 <b>apex-stage.js 에 한 벌</b>이다');
  is(/if\(m\.q\)TDO\[k\]\.q=m\.q/.test(SRC),
     '  본체는 <b>표에서 옮겨</b> 올 뿐이다 — 여기서 짓지 않는다');

  console.log('\n[3] ★ <b>표에 없는 단계에는 안 세운다</b> (1번)');
  const NO = await p.evaluate(() => {
    const out = {};
    ['거절','부재','미접촉','TA'].forEach(k => {
      out[k] = { q: !!(APEX_STAGE.map[k] && APEX_STAGE.map[k].q),
                 tdo: !!(typeof TDO !== 'undefined' && TDO[k] && TDO[k].q) };
    });
    return out;
  });
  Object.keys(NO).forEach(k => is(!NO[k].q && !NO[k].tdo,
    '  <b>' + k + '</b> 에는 판단을 안 지어 붙였다'));
  /* 거절에 다음 단계를 만들지 않는다 — 사장님 말씀 */
  const 거절다음 = await p.evaluate(() => APEX_STAGE.next('거절'));
  is(!거절다음, '  ★ <b>거절에 다음 단계를 만들지 않는다</b> — ' + (거절다음 || '없음'));
  /* 화면에서도 — 거절 한 분을 세워 보고 판단 줄이 안 뜨는지 */
  const R = await p.evaluate(async () => {
    AR.db[0].stage = '거절'; go('home');
    await new Promise(r => setTimeout(r, 700));
    const e = document.querySelector('#dynPane .hm-now');
    const t = e ? e.innerText.replace(/\s+/g,' ') : '';
    AR.db[0].stage = 'AP'; go('home');
    await new Promise(r => setTimeout(r, 700));
    return t;
  });
  is(R.indexOf('판단 —') < 0, '  ★ 거절 화면에 <b>판단 줄이 안 선다</b>');

  console.log('\n[4] ★ <b>있는 화면만 가리킨다</b> (1번)');
  const B = await p.evaluate(CARD);
  /* 「앱이 이미 아는 것」 은 상자(t-note)가 아니라 <b>설명 줄(t-sub)</b>
     입니다 — t-note.g 는 ui.css 에 hex 가 박혀 있어 화면에 새 색을
     들입니다(check-hmexact). 카드 <b>글 전체</b>에서 찾습니다. */
  const 아는 = /앱이 이미 아는 것/.test(B.t) ? '있음' : '';
  is(!!아는, '  <b>앱이 이미 아는 것</b> 줄이 선다');
  const K = await p.evaluate(() => (APEX_STAGE.map.AP || {}).know || []);
  is(K.length === 3, '  표에 아는 것이 <b>셋</b>이다 — ' + K.map(x => x.t).join(' · '));
  /* ★ <b>정말 열리는 화면인가.</b> 「갖고 있습니다」 는 결론이라, 눌러서
     안 열리면 그 자리에서 무너집니다 — 메뉴에 있는지 봅니다 (1번). */
  const 없는화면 = await p.evaluate(() =>
    ((APEX_STAGE.map.AP || {}).know || []).filter(k =>
      typeof navItemOf === 'function' && !navItemOf(k.tab)).map(k => k.t + '→' + k.tab));
  is(없는화면.length === 0, '  ★ 가리키는 화면이 <b>메뉴에 다 있다</b>' +
     (없는화면.length ? (' ← 없는 곳 ' + 없는화면.join(' · ')) : ''));
  /* ★ <b>「아는 것」 칩만</b> 봅니다. 같은 카드에 「한 가지만 여쭙기」 의
     답 칩(내일 전화 · 이번 주 안에 만남 …)도 t-chip 이라, 카드 전체에서
     긁으면 그것들이 「go 로 안 간다」 며 빨간불이 켜집니다 — 그 칩들은
     답하는 것이지 화면으로 가는 것이 아닙니다 (8번).                  */
  const 아는칩 = B.칩.filter(c => /^go\('[a-z_]+'\)$/.test(c.go.trim()));
  is(아는칩.length === K.length && 아는칩.length > 0,
     '  <b>아는 것 칩</b>이 표만큼 선다 — ' + 아는칩.length + '/' + K.length +
     ' (' + 아는칩.map(c => c.t).join(' · ') + ')');
  /* 진짜 열리나 — 하나를 눌러 봅니다 */
  const 갔나 = await p.evaluate(async () => {
    const c = document.querySelector('#dynPane .hm-now .t-chips .t-chip');
    if (!c) return '';
    c.click(); await new Promise(r => setTimeout(r, 600));
    return (typeof lastTab !== 'undefined') ? lastTab : '';
  });
  is(!!갔나 && 갔나 !== 'home', '  ★ 눌렀더니 <b>그 화면으로 갔다</b> — ' + (갔나 || '(안 감)'));

  console.log('\n[5] ★ <b>새 CSS·새 class 를 안 만들었다</b> (사장님 계약)');
  const i0 = SRC.indexOf('function hmJudgeHtml'), i1 = SRC.indexOf('function hmNowHtml(){');
  const BLK = (i0 >= 0 && i1 > i0) ? SRC.slice(i0, i1) : '';
  /* 주석은 코드가 아닙니다 — 「t-note.g 에 hex(#065F46)가 박혀 있어 안
     씁니다」 라고 <b>적어 둔 것</b>까지 세면, 왜 안 쓰는지 설명한 것이
     빨간불이 됩니다 (8번). 위 [2] 와 같은 처리입니다. */
  const BLK_C = BLK.replace(/\/\*[\s\S]*?\*\//g, ' ');
  is(BLK.length > 600, '  판단 묶음을 찾았다 — ' + BLK.length + '자');
  is(!/#[0-9a-fA-F]{6}\b/.test(BLK_C), '  ★ <b>hex 를 한 자도 안 적었다</b> (주석은 빼고 셉니다)');
  const UI = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
  const 새것 = (BLK.match(/class="([^"]+)"/g) || []).join(' ').replace(/class="|"/g,' ')
    .split(/\s+/).filter(Boolean)
    .filter(c => UI.indexOf('.' + c) < 0 && UI.indexOf('.t-note.' + c) < 0 &&
                 UI.indexOf('.t-chip.' + c) < 0);
  is(새것.length === 0, '  ★ <b>ui.css 이름만 썼다</b>' +
     (새것.length ? (' ← ' + [...new Set(새것)].join(' ')) : ''));
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' · ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '✓ 판단은 표에서 오고, 가리키는 화면은 정말 열립니다.');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
