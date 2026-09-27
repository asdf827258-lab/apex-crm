/* ══════════════════════════════════════════════════════════════════
   check-cusrrn.js — <b>주민등록번호가 이 기기를 못 벗어나나.</b>

   2026-09-27. 사장님 말씀 (목각 사진 2) — 「🔒 주민등록번호」.
   상자는 「<b>있는 .t-note 로 가</b>」.

   이 앱은 여태 이 번호를 <b>일부러 안 담았습니다</b> — 담는 자리가 없어
   청약 때마다 딴 데서 찾으셨습니다. 담는 자리를 만들면서, 나가는 길을
   <b>전부 막았는지</b>를 이 자가 봅니다.

   ★ 만들면서 <b>새는 자리를 하나 찾았습니다.</b> 설정·지식 백업
     (osExportData)이 apex 로 시작하는 <b>모든</b> localStorage 열쇠를
     JSON 파일로 내보내고 있었습니다. 그냥 만들었으면 번호가 그 파일에
     찍혀 메일·드라이브로 나갔습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 칸이 선다 · 담기고 다시 읽힌다
     [2] ★ <b>가린 채로 섭니다</b> — 날번호가 DOM 에 없다 (인쇄·캡처)
     [3] ★ 눌러야 보이고, 다시 누르면 가린다 · <b>저절로도</b> 가린다
     [4] ★ <b>서버를 0번 부른다</b> — 담을 때·지울 때 모두
     [5] ★ <b>설정 백업 파일에 안 담긴다</b> (API 키 제외는 그대로 산다)
     [6] ★ AI 로 가는 길이 <b>그대로 막혀 있다</b> (MYP_RRN)
     [7] ★ toast 에 <b>번호가 안 찍힌다</b> — 토스트도 캡처된다
     [8] ★ 고객 칸(CM_FIELDS)에 <b>안 들어가 있다</b> — 들어가면 cmSave 가 올린다
     [9] ★ 모양이 이상해도 <b>담기는 담는다</b> · <b>검산식을 안 쓴다</b>
    [10] 지우면 없어진다 · 고치기·지우기를 <b>안 감춘다</b> (6번)
    [11] 새 CSS 0줄 · 새 class 0개 · hex 0개 · <b>.t-note.s 안 씀</b>
    [12] 누르는 것이 44px 이상 · 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9032;
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

/* 견본 번호 — <b>실제 사람의 번호가 아닙니다.</b> 이름은 「홍길동」 (3번).
   달·날 자리는 말이 되게 두고(19900101) 뒤는 1234567 로 둡니다 —
   검산식으로 보면 <b>틀린</b> 번호입니다. 그것이 [9] 에서 필요합니다.  */
const RRN = '9001011234567';
const DASH = '900101-1234567';
const MASK = '900101-1******';

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  /* 백업에서 <b>빠져야 하는 것</b>과 <b>남아야 하는 것</b>을 같이 심습니다 */
  try { localStorage.setItem('apex_test_key','비밀키는 파일로 안 나갑니다'); } catch(e){}
  try { localStorage.setItem('apex_ck_tab','day'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.WROTE=[]; window.TOASTS=[]; window.FILES=[];
  window.toast=function(t){ TOASTS.push(''+t); };
  window.confirm=function(){ return true; };
  /* 내려받기를 <b>손에 받아</b> 봅니다 — 무엇이 파일에 담겼는지 봐야 합니다 */
  window.osDownloadBlob=function(name,text){ FILES.push({name:name,text:''+text}); };
  const chain = v => { const o = {
      then:function(f){ try{ f(v); }catch(e){} return o; }, catch:function(){ return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k]=function(){ return o; }; });
    o.single=function(){ return chain({data:null}); };
    o.maybeSingle=function(){ return chain({data:null}); };
    return o; };
  window.osClient=function(){
    return { from:function(tb){ return {
      select:function(){ WROTE.push({op:'select',tb:tb}); return chain({data:[]}); },
      update:function(o){ WROTE.push({op:'update',tb:tb,body:o}); return chain({}); },
      insert:function(o){ WROTE.push({op:'insert',tb:tb,body:o}); return chain({}); },
      upsert:function(o){ WROTE.push({op:'upsert',tb:tb,body:o}); return chain({}); },
      delete:function(){ WROTE.push({op:'delete',tb:tb}); return chain({}); }
    }; } };
  };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[];
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  OSC.list=[{id:'c1',name:'홍길동',name_masked:'홍○○',advisor_id:'me',stage:'CS',
             created_at:new Date(Date.now()-60*864e5).toISOString().slice(0,10)}];
  CM.loaded=true; CM.meta={ c1: (function(){ var m=cmBlank(); m._rid='r1'; return m; })() };
  try{ osHideLoginGate(); }catch(e){}
  osOpenClient('c1');
};

/* 주석·APP_BUILD_NOTE 를 <b>먼저 지웁니다.</b> 무엇에 <b>대해 적은 글</b>은
   그것을 <b>쓴 것</b>이 아닙니다 — 이 자리에서 여러 번 헛불이 켜졌습니다 (8번) */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ')
                    .replace(/var APP_BUILD_NOTE=[\s\S]*?;\n/g, ' ');

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  /* 바깥으로 나간 요청을 <b>전부</b> 적어 둡니다 — [4] 에서 셉니다 */
  const net = [];
  p.on('request', q => { const u = q.url();
    if (u.indexOf('http://127.0.0.1:' + PORT) !== 0 && u.indexOf('data:') !== 0 && u.indexOf('blob:') !== 0) net.push(u); });
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);

  const SRC = strip(fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8'));
  const CSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');

  console.log('\n[1] 칸이 선다 · 담기고 다시 읽힌다');
  const A = await p.evaluate(() => {
    const t = document.body.innerText || '';
    return { 있나: t.indexOf('주민등록번호') >= 0, 적는칸: !!document.getElementById('cmRrnIn'),
             담긴것: cmRrnOf('c1') };
  });
  is(A.있나, '  고객 한 장에 <b>🔒 주민등록번호</b> 칸이 선다');
  is(A.적는칸, '  아직 안 담겼으니 <b>적는 칸</b>이 열려 있다');
  is(A.담긴것 === '', '  아직 <b>아무것도 안 담겼다</b> — 지어내지 않습니다 (1번)');

  const B = await p.evaluate(rrn => {
    document.getElementById('cmRrnIn').value = rrn;
    cmRrnSave('c1');
    return { 담김: cmRrnOf('c1'), 다시: cmRrn()['c1'] };
  }, RRN);
  is(B.담김 === RRN, '  적으면 <b>담긴다</b> — 열세 자리 그대로');
  is(B.다시 === RRN, '  <b>이 브라우저에서 다시 읽힌다</b> (localStorage)');

  console.log('\n[2] ★ <b>가린 채로 섭니다</b> — 날번호가 DOM 에 없다');
  await p.waitForTimeout(500);
  const C = await p.evaluate(() => ({ html: document.body.innerHTML, txt: document.body.innerText || '' }));
  is(C.html.indexOf(RRN) < 0, '  날번호(붙임표 없이)가 <b>DOM 에 없다</b>');
  is(C.html.indexOf(DASH) < 0, '  날번호(붙임표 있이)도 <b>DOM 에 없다</b> — 인쇄·캡처에 안 남습니다');
  is(C.txt.indexOf(MASK) >= 0, '  <b>' + MASK + '</b> 로만 보인다');

  console.log('\n[3] ★ 눌러야 보이고, 다시 누르면 가린다 · <b>저절로도</b> 가린다');
  const D = await p.evaluate(() => {
    cmRrnShow('c1');
    const 보임 = (document.getElementById('cmRrnV') || {}).textContent || '';
    cmRrnHide();
    const 가림 = (document.getElementById('cmRrnV') || {}).textContent || '';
    return { 보임: 보임, 가림: 가림 };
  });
  is(D.보임 === DASH, '  「잠깐 보기」를 누르면 <b>보인다</b> — ' + D.보임);
  is(D.가림 === MASK, '  「가리기」를 누르면 <b>다시 가린다</b> — ' + D.가림);
  /* ★ 시간을 <b>줄여 놓고 진짜로 기다립니다.</b> 「setTimeout 이 적혀 있다」
     까지만 보면, 부르는 함수 이름을 잘못 적어도 초록입니다 (8번). */
  const E = await p.evaluate(async () => {
    window.CM_RRN_MS = 250;
    cmRrnShow('c1');
    const 직후 = (document.getElementById('cmRrnV') || {}).textContent || '';
    await new Promise(r => setTimeout(r, 700));
    const 나중 = (document.getElementById('cmRrnV') || {}).textContent || '';
    window.CM_RRN_MS = 20000;
    return { 직후: 직후, 나중: 나중 };
  });
  is(E.직후 === DASH && E.나중 === MASK,
     '  ★ 아무것도 안 눌러도 <b>저절로 다시 가린다</b> — 직후 ' + E.직후 + ' → 잠깐 뒤 ' + E.나중);

  console.log('\n[4] ★ <b>서버를 0번 부른다</b>');
  /* ★ 여기서 한 번 헛불이 켜졌습니다 — 화면이 <b>처음 뜰 때</b> 받아 오는
     글꼴·supabase 까지 세고 있었습니다. 그것은 이 카드가 부른 것이 아닙니다.
     <b>담고 지우는 동안만</b> 셉니다 (8번 — 헛것을 잡는 자가 더 나쁩니다). */
  net.length = 0;
  const F = await p.evaluate(async rrn => {
    WROTE.length = 0;
    document.getElementById('cmRrnIn') || cmRrnEdit();
    const el = document.getElementById('cmRrnIn');
    if (el) el.value = rrn;
    cmRrnSave('c1');
    await new Promise(r => setTimeout(r, 600));
    const 담을때 = WROTE.slice();
    WROTE.length = 0;
    cmRrnDel('c1');
    await new Promise(r => setTimeout(r, 600));
    const 지울때 = WROTE.slice();
    cmRrnSet('c1', rrn);
    return { 담을때: 담을때.length, 지울때: 지울때.length,
             어디: 담을때.concat(지울때).map(x => x.op + ':' + x.tb).join(',') };
  }, RRN);
  is(F.담을때 === 0, '  <b>담을 때</b> 서버를 안 부른다 — ' + F.담을때 + '번' + (F.어디 ? (' (' + F.어디 + ')') : ''));
  is(F.지울때 === 0, '  <b>지울 때</b>도 안 부른다 — ' + F.지울때 + '번');
  /* 저장 코드가 cmSave 를 타지 않는지 <b>글로도</b> 봅니다 */
  is(!/function cmRrnSet\(id,v\)\{[\s\S]{0,400}cmSave\(/.test(SRC),
     '  cmRrnSet 이 <b>cmSave 를 타지 않는다</b> — 열쇠가 따로입니다');
  await p.waitForTimeout(400);
  is(net.length === 0, '  담고 지우는 동안 바깥으로 나간 요청이 <b>없다</b>' +
     (net.length ? (' ← ' + net.slice(0, 2).join(' | ')) : ''));

  console.log('\n[5] ★ <b>설정 백업 파일에 안 담긴다</b>');
  const G = await p.evaluate(() => {
    FILES.length = 0;
    osExportData();
    const f = FILES[0] || { text: '' };
    let ls = {};
    try { ls = (JSON.parse(f.text) || {}).ls || {}; } catch (e) {}
    return { 글: f.text, 열쇠: Object.keys(ls) };
  });
  is(G.글.indexOf(RRN) < 0 && G.글.indexOf(DASH) < 0,
     '  ★ 백업 JSON 에 <b>번호가 없다</b> — 이 파일은 메일·드라이브로 나갑니다');
  is(!G.열쇠.filter(k => k.indexOf('apex_cli_rrn_') === 0).length,
     '  ★ 열쇠 자체가 <b>안 담긴다</b> (담긴 열쇠 ' + G.열쇠.length + '개)');
  /* ★ 제가 API 키 걸러내는 줄을 <b>한 곳으로 옮겼습니다.</b> 옮기다 그걸
     깨뜨렸으면 비밀키가 파일로 나갑니다 — 같이 봅니다 (8번). */
  is(G.열쇠.indexOf('apex_test_key') < 0,
     '  ★ 옮기면서 <b>API 키 제외가 안 깨졌다</b> — _key 로 끝나는 열쇠는 그대로 빠진다');
  is(G.열쇠.indexOf('apex_ck_tab') >= 0,
     '  <b>멀쩡한 것은 그대로 담긴다</b> — 헛것을 막지 않습니다 (8번)');
  is(/function osLsNever\(k\)/.test(SRC) &&
     (SRC.match(/osLsNever\(/g) || []).length >= 2,
     '  묻는 곳이 <b>한 곳</b>이고 내보내는 자리가 그것을 부른다 (5번)');

  console.log('\n[6] ★ AI·서버로 가는 길이 <b>그대로 막혀 있다</b>');
  const H = await p.evaluate(() => ({
    막나: MYP_RRN.test('900101-1234567 로 연락'),
    멀쩡: MYP_RRN.test('10시에 전화 드리기')
  }));
  is(H.막나, '  일정 글에 번호를 적으면 <b>막는다</b> (MYP_RRN 그대로)');
  is(!H.멀쩡, '  보통 글은 <b>안 막는다</b> — 헛것을 막지 않습니다 (8번)');

  console.log('\n[7] ★ toast 에 <b>번호가 안 찍힌다</b>');
  const I = await p.evaluate(async rrn => {
    TOASTS.length = 0;
    cmRrnSet('c1', '');
    cmDetailPaint('c1');
    await new Promise(r => setTimeout(r, 300));
    const el = document.getElementById('cmRrnIn');
    if (el) el.value = rrn;
    cmRrnSave('c1');
    cmRrnCopy('c1');
    await new Promise(r => setTimeout(r, 300));
    return TOASTS.join(' ⁄ ');
  }, RRN);
  is(I.indexOf(RRN) < 0 && I.indexOf(DASH) < 0 && !/\d{6}/.test(I),
     '  담기·복사 토스트에 <b>번호가 없다</b> — 「' + I.slice(0, 80) + '」');

  console.log('\n[8] ★ 고객 칸(CM_FIELDS)에 <b>안 들어가 있다</b>');
  const J = await p.evaluate(() => CM_FIELDS.map(f => f[0]).join(','));
  is(!/rrn|jumin|주민/i.test(J),
     '  ★ 고객 칸에 주민번호가 <b>없다</b> — 거기 넣으면 cmSave 가 서버로 올립니다 (칸 ' +
     J.split(',').length + '개)');

  console.log('\n[9] ★ 모양이 이상해도 <b>담기는 담는다</b> · <b>검산식을 안 쓴다</b>');
  const K = await p.evaluate(async () => {
    cmRrnSet('c1', '');
    cmDetailPaint('c1');
    await new Promise(r => setTimeout(r, 300));
    const el = document.getElementById('cmRrnIn');
    if (el) el.value = '900101123';           /* 아홉 자리 */
    cmRrnSave('c1');
    await new Promise(r => setTimeout(r, 400));
    return { 담김: cmRrnOf('c1'), 말: (document.body.innerText || ''),
             /* 검산으로 보면 틀린 번호 — 그래도 아무 말 안 해야 한다 */
             틀린것: cmRrnWhy('9001011234567'), 달이상: cmRrnWhy('9013011234567') };
  });
  is(K.담김 === '900101123', '  열세 자리가 아니어도 <b>버리지 않는다</b> — 담긴 것 ' + K.담김.length + '자리');
  is(/다시 보십시오/.test(K.말) && /열세 자리가 아닙니다/.test(K.말),
     '  <b>「다시 보십시오」 한 줄</b>은 붙는다 — 막지는 않습니다');
  is(K.틀린것 === '',
     '  ★ <b>검산식을 안 쓴다</b> — 2020년 10월 뒤 규칙이 바뀌어 확실하지 않습니다. ' +
     '확실하지 않은 규칙으로 맞는 번호를 틀렸다 하면 청약이 그 자리에서 멈춥니다 (8번)');
  is(K.달이상 === '달 자리가 01~12 가 아닙니다', '  <b>달 자리</b>처럼 확실한 것만 짚는다');
  is(!/%\s*11/.test(SRC.slice(SRC.indexOf('function cmRrnWhy'), SRC.indexOf('function cmRrnWhy') + 700)),
     '  검산 나눗셈이 <b>코드에 없다</b>');

  console.log('\n[10] 지우면 없어진다 · 고치기·지우기를 <b>안 감춘다</b> (6번)');
  const L = await p.evaluate(async rrn => {
    cmRrnSet('c1', rrn);
    cmDetailPaint('c1');
    await new Promise(r => setTimeout(r, 300));
    const t = document.body.innerText || '';
    const 있 = { 고치기: t.indexOf('고치기') >= 0, 지우기: t.indexOf('지우기') >= 0,
                보기: t.indexOf('잠깐 보기') >= 0, 복사: t.indexOf('복사') >= 0 };
    cmRrnDel('c1');
    await new Promise(r => setTimeout(r, 400));
    return { 있: 있, 지운뒤: cmRrnOf('c1'), 칸다시: !!document.getElementById('cmRrnIn') };
  }, RRN);
  is(L.있.고치기 && L.있.지우기, '  담긴 뒤에도 <b>고치기·지우기가 보인다</b> — 감추면 고칠 길이 없어집니다 (6번)');
  is(L.있.보기 && L.있.복사, '  <b>잠깐 보기·복사</b>도 있다 — 청약 화면에 붙여 넣을 수 있어야 합니다');
  is(L.지운뒤 === '', '  <b>지우면 없어진다</b>');
  is(L.칸다시, '  지운 뒤에는 <b>적는 칸이 다시 열린다</b>');

  console.log('\n[11] 새 CSS 0줄 · 새 class 0개 · hex 0개 · <b>.t-note.s 안 씀</b>');
  /* ★ 조각을 <b>두 번</b> 뜹니다. 담는 자리(cmRrn*)와 칸(cmRrnHtml)은 파일에서
     2,000줄쯤 떨어져 있어, 한 번에 뜨면 <b>그 사이 남의 화면을 통째로</b>
     삼킵니다 — 처음에 그래서 「새 class 125개」 라는 헛불이 켜졌습니다 (8번). */
  const 조각 = (() => {
    const cut = (a, b2) => { const i = SRC.indexOf(a), j = SRC.indexOf(b2, i + 1);
      return (i >= 0 && j > i) ? SRC.slice(i, j) : ''; };
    return cut('function cmRrn()', 'function cmName(c)') + '\n' +
           cut('function cmRrnHtml(id)', 'function cmRelHtml(id)');
  })();
  is(조각.length > 500, '  잴 조각을 찾았다 (' + 조각.length + '자)');
  const 이름 = [];
  (조각.match(/class="([^"]+)"/g) || []).forEach(m => {
    m.replace(/class="|"/g, '').split(/\s+/).forEach(k => { if (k && 이름.indexOf(k) < 0) 이름.push(k); });
  });
  /* ui.css 에 그 이름이 있나 — 홀로 선 것(.t-card)도, 갈래(.t-btn.sm)도,
     아랫것(.t-fld .l)도 같이 찾습니다. 없는 이름이면 <b>새로 만든</b> 것입니다 */
  const 없는것 = 이름.filter(k => CSS.indexOf('.' + k) < 0);
  is(!없는것.length, '  쓴 class ' + 이름.length + '개가 <b>모두 ui.css 에 있다</b> — ' +
     이름.join(' · ') + (없는것.length ? ('\n      ✗ 없는 이름: ' + 없는것.join(',')) : ''));
  is(!/class="t-note s"|class="t-note [a-z]*s"/.test(조각),
     '  ★ <b>.t-note.s 를 안 쓴다</b> — ui.css 에 없는 이름이었습니다. 사장님 답: 있는 .t-note 로');
  is(!/#[0-9A-Fa-f]{3,8}\b/.test(조각), '  hex 를 <b>직접 안 적는다</b> (4번·5번 — 색표는 한 곳)');
  is(!/style="[^"]*color:/.test(조각), '  style 로 <b>색을 안 박는다</b>');

  console.log('\n[12] 누르는 것이 44px 이상 · 조용히 터지지 않았나');
  const M = await p.evaluate(async rrn => {
    cmRrnSet('c1', rrn); cmDetailPaint('c1');
    await new Promise(r => setTimeout(r, 300));
    /* ★ <b>숨은 것은 0px 로 재집니다.</b> 「이 기기에만 담기」 는 담긴 뒤
       접혀 있어 0px 이 나오고, 「0 은 44 보다 작지 않다」 로 빠져나가
       <b>0px 인데 초록</b>이 됩니다. 이 앱에서 자 다섯이 그렇게 속았습니다.
       그래서 「고치기」를 눌러 <b>펴 놓고</b> 잽니다.                       */
    cmRrnEdit();
    await new Promise(r => setTimeout(r, 200));
    const out = [];
    const box = document.getElementById('cmRrnV');
    const card = box ? box.closest('.t-card') : null;
    if (card) [].slice.call(card.querySelectorAll('button')).forEach(x => {
      out.push({ t: (x.textContent || '').trim(), h: Math.round(x.getBoundingClientRect().height) });
    });
    return out;
  }, RRN);
  const 작은것 = M.filter(x => x.h < 44);
  is(M.length >= 6 && !작은것.length,
     '  단추 ' + M.length + '개가 <b>모두 44px 이상</b> — ' +
     M.map(x => x.t + ' ' + x.h).join(' · ') +
     (작은것.length ? ('\n      ✗ 작은 것: ' + 작은것.map(x => x.t + ' ' + x.h + 'px').join(',')) : ''));
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 주민등록번호는 이 기기에만 · 가린 채로 · 서버 0번 · 백업 파일에도 안 담깁니다.');
  process.exit(bad ? 1 : 0);
})();
