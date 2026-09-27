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
     [9] ★ <b>맞지 않으면 안 담는다</b> · 검산식이 목각과 같은 식인가
     [9-1] ★★ <b>누르면 보험나이·상령일이 나온다</b> · 계산기와 <b>같은 답</b>인가 (5번)
     [9-2] ★ 상령일이 곧이면 말해 준다 · <b>금액은 지어내지 않는다</b>
    [10] 지우면 없어진다 · 고치기·지우기를 <b>안 감춘다</b> (6번)
    [11] 새 CSS 0줄 · 새 class 0개 · hex 0개 · <b>.t-note.s 안 씀</b>
    [12] 누르는 것이 <b>받침을 받는 모양</b>인가 (span onclick 은 못 받습니다) · 안 터졌나
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
   ★ 2026-09-27 에 바꿨습니다. 앱이 이제 <b>검산을 봅니다</b>(목각 그대로)
     므로, 견본도 <b>검산이 맞는</b> 번호여야 담깁니다.
   ★ 검산 자리를 <b>자가 스스로 셉니다</b> — 앱 함수를 빌려 오면 앱이 틀렸을
     때 자도 같이 틀려 안 웁니다 (8번).                                  */
const 검산 = d12 => {
  const W = [2,3,4,5,6,7,8,9,2,3,4,5];
  let t = 0;
  for (let i = 0; i < 12; i++) t += W[i] * (+d12.charAt(i));
  return String((11 - t % 11) % 10);
};
const 번호 = (yymmdd, g) => { const h = yymmdd + g + '23456'; return h + 검산(h); };
const RRN = 번호('900101', '1');           /* 1990-01-01 · 남 */
const DASH = RRN.slice(0, 6) + '-' + RRN.slice(6);
const MASK = '900101-1●●●●●●';
const 틀린번호 = RRN.slice(0, 12) + String((+RRN.charAt(12) + 1) % 10);
/* 상령일이 <b>곧</b> 오는 분 — 오늘에서 거꾸로 만듭니다. 날짜를 박아 두면
   달이 바뀌는 날 자가 거짓말을 합니다 (8번).                            */
const 곧상령 = (() => {
  const t = new Date(); const up = new Date(t.getTime() + 50 * 864e5);
  const b = new Date(up.getFullYear(), up.getMonth() - 6, up.getDate());
  const mm = ('0' + (b.getMonth() + 1)).slice(-2), dd = ('0' + b.getDate()).slice(-2);
  return 번호('90' + mm + dd, '1');
})();

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

  console.log('\n[9] ★ <b>맞지 않으면 안 담는다</b> — 목각 그대로 (2026-09-27 뒤집음)');
  /* ★ <b>여기 두 줄은 뒤집힌 자였습니다.</b> 처음에 저는 제 판단으로
       「검산을 안 본다 · 이상해도 담는다」 를 지키게 만들어 두었습니다.
       사장님 목각(docs/APEX_목각_폰.html)을 눌러 보니 <b>검산이 안 맞으면
       저장을 막고</b> 「맞지 않는 번호입니다」 라고 말합니다. 설계는
       사장님 것입니다 — 자를 목각 쪽으로 돌렸습니다.                   */
  const K = await p.evaluate(async (Z) => {
    const put = async (val) => {
      cmRrnSet('c1', ''); cmDetailPaint('c1');
      await new Promise(r => setTimeout(r, 300));
      const el = document.getElementById('cmRrnIn');
      if (el) el.value = val;
      TOASTS.length = 0;
      cmRrnSave('c1');
      await new Promise(r => setTimeout(r, 350));
      return { 담김: cmRrnOf('c1'), 말: TOASTS.join(' '), 칸: (document.getElementById('cmRrnIn') || {}).value };
    };
    return { 짧은것: await put('900101123'), 틀린것: await put(Z.bad), 맞는것: await put(Z.ok) };
  }, { bad: 틀린번호, ok: RRN });
  is(K.짧은것.담김 === '' && /열세 자리를 다 적어/.test(K.짧은것.말),
     '  열세 자리가 아니면 <b>안 담고</b> 그렇게 말한다 — 「' + K.짧은것.말.slice(0, 40) + '」');
  is(K.틀린것.담김 === '' && /맞지 않는 번호/.test(K.틀린것.말),
     '  ★ <b>검산이 안 맞으면 안 담는다</b> — 목각과 같은 말 「' + K.틀린것.말.slice(0, 40) + '」');
  is(K.틀린것.칸 === 틀린번호,
     '  막았어도 <b>적으신 글자는 칸에 남는다</b> — 열세 자리를 다시 안 치셔도 됩니다');
  is(K.맞는것.담김 === RRN, '  맞는 번호는 <b>담긴다</b>');
  is(/cmRrnSum/.test(SRC) && /11\s*-\s*t\s*%\s*11/.test(SRC),
     '  ★ <b>검산식이 코드에 있다</b> — 목각 rrnOk 와 같은 식 (2,3,4,5,6,7,8,9,2,3,4,5)');

  console.log('\n[9-1] ★★ <b>누르면 보험나이·상령일이 나온다</b> — 목각의 그 자리');
  /* ★ 사장님 말씀 (2026-09-27) — 「목각 버튼 눌러서 어떻게 바뀌는지 제대로
       보고 변경하라고」. 목각의 주민번호 칸은 번호를 <b>보관</b>하는 칸이
       아니라, 거기서 <b>보험나이와 상령일</b>이 나오는 칸이었습니다.
       저는 가린 번호만 보여 주고 있었습니다.                            */
  const N = await p.evaluate(() => {
    const t = document.body.innerText || '';
    return { t: t,
             생년: /생년월일/.test(t), 만나이: /만 나이/.test(t),
             보험나이: /보험나이/.test(t), 상령일: /상령일/.test(t),
             디데이: /D-\d+/.test(t) };
  });
  is(N.생년 && N.만나이, '  <b>생년월일 · 만 나이</b>가 선다');
  is(N.보험나이 && N.상령일 && N.디데이, '  ★ <b>보험나이 · 다음 상령일 · D-N</b> 이 선다');

  /* ★★ <b>계산기와 같은 답인가.</b> 앱에는 이미 보험나이 계산기가 있었습니다.
     두 곳에서 각자 세면 한 화면은 52세, 다른 화면은 53세라고 적는 날이 옵니다 —
     그 자리에서 보험료가 틀립니다 (5번). <b>두 화면을 실제로 몰아</b> 봅니다. */
  const S2 = await p.evaluate(async () => {
    const b = cmRrnBirth(cmRrnOf('c1'));
    const mine = insAgeOf(b.dt, new Date());
    /* 계산기 화면을 실제로 열어 같은 생일을 넣고 눌러 본다 */
    go('calc');
    await new Promise(r => setTimeout(r, 700));
    const el = document.getElementById('ca_birth');
    if (!el) return { 계산기없음: true };
    el.value = b.y + '-' + ('0' + b.m).slice(-2) + '-' + ('0' + b.d).slice(-2);
    calcAge();
    await new Promise(r => setTimeout(r, 300));
    const res = (document.getElementById('ca_res') || {}).innerText || '';
    return { 내것: mine.ins, 계산기글: res.replace(/\s+/g, ' ') };
  });
  is(!S2.계산기없음, '  계산기 화면을 열었다');
  is(!S2.계산기없음 && S2.계산기글.indexOf(S2.내것 + '세') >= 0,
     '  ★★ 고객 한 장과 <b>계산기가 같은 답</b>이다 — 보험나이 ' + S2.내것 + '세' +
     (S2.계산기없음 ? '' : ('\n      · 계산기: ' + (S2.계산기글 || '(빈 글)').slice(0, 90))));
  is(/function insAgeOf\(/.test(SRC) && (SRC.match(/insAgeOf\(/g) || []).length >= 3,
     '  셈하는 곳이 <b>하나</b>이고 두 화면이 그것을 부른다 (5번)');

  console.log('\n[9-2] ★ 상령일이 <b>곧</b>이면 말해 준다 · 금액은 지어내지 않는다');
  const G2 = await p.evaluate(async (soon) => {
    /* 홈으로 돌아와 고객을 다시 연다 */
    osOpenClient('c1');
    await new Promise(r => setTimeout(r, 700));
    cmRrnSet('c1', soon); cmDetailPaint('c1');
    await new Promise(r => setTimeout(r, 400));
    return document.body.innerText || '';
  }, 곧상령);
  is(/상령일이 \d+일 남았습니다/.test(G2),
     '  상령일이 90일 안이면 <b>한 줄 더</b> 붙는다');
  is(/보험료가 올라갑니다/.test(G2) && /심사 결과에 따릅니다/.test(G2),
     '  「올라갑니다」 까지만 말하고 <b>심사 결과에 따른다</b>고 붙인다 (2번)');
  is(!/보험료가 [\d,]+ *원 (더 )?올라|[\d,]+원 인상/.test(G2),
     '  ★ <b>얼마 오른다고는 안 적는다</b> (1번) — 상품마다 다릅니다');

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
  /* ★ class 값 안에 JS 를 이어 붙인 것(t-tag'+(…?' due':'')+')은 <b>한 이름이
     아닙니다.</b> 통째로 세면 「ui.css 에 없는 이름」 이라는 헛불이 켜집니다 —
     실제로 켜졌습니다 (8번). 따옴표·더하기가 든 토막은 건너뜁니다.        */
  (조각.match(/class="([^"]+)"/g) || []).forEach(m => {
    m.replace(/class="|"/g, '').split(/\s+/).forEach(k => {
      if (k && k.indexOf("'") < 0 && k.indexOf('+') < 0 && 이름.indexOf(k) < 0) 이름.push(k); });
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

  console.log('\n[12] 누르는 것이 <b>받침을 받는 모양</b>인가 · 조용히 터지지 않았나');
  /* ★ 여기도 <b>울릴 수 없는 자</b>였습니다. app/index.html 에 이미
       #dynPane button, #dynPane .btn, #dynPane select{min-height:44px}
     가 있어 일부러 height:30px 을 박아도 44 로 나옵니다 — check-cusskin 에서
     같은 자리를 찾아 고쳤고, 여기도 같이 고쳤습니다.
     그 받침은 button·select·.btn 에만 걸립니다. <span onclick> 으로 만들면
     받침을 못 받아 손가락으로 못 누를 만큼 작아집니다 — 그것을 봅니다 (8번). */
  const M = await p.evaluate(async rrn => {
    cmRrnSet('c1', rrn); cmDetailPaint('c1');
    await new Promise(r => setTimeout(r, 300));
    cmRrnEdit();
    await new Promise(r => setTimeout(r, 200));
    const box = document.getElementById('cmRrnV');
    const card = box ? box.closest('.t-card') : null;
    const out = [], 맨몸 = [];
    if (card) [].slice.call(card.querySelectorAll('[onclick]')).forEach(x => {
      const tag = x.tagName.toLowerCase(), cls = (x.className || '').toString();
      const 받침 = (tag === 'button' || tag === 'select' ||
                    /(^|\s)(btn|t-btn|t-gb|t-chip|t-row)(\s|$)/.test(cls));
      out.push({ t: (x.textContent || '').trim().slice(0, 12), h: Math.round(x.getBoundingClientRect().height), 받침: 받침 });
      if (!받침) 맨몸.push(tag + ' 「' + (x.textContent || '').trim().slice(0, 12) + '」');
    });
    return { all: out, 맨몸: 맨몸 };
  }, RRN);
  is(M.all.length >= 6 && !M.맨몸.length,
     '  누르는 것 ' + M.all.length + '개가 <b>모두 button 이거나 받침 class</b> 를 가졌다' +
     (M.맨몸.length ? ('\n      ✗ 받침 없는 것: ' + M.맨몸.join(', ')) : ''));
  const 작은것 = M.all.filter(x => x.h > 0 && x.h < 44);
  is(!작은것.length, '  그래서 잰 높이도 <b>모두 44px 이상</b> — ' +
     M.all.map(x => x.t + ' ' + x.h).join(' · ') +
     (작은것.length ? ('\n      ✗ ' + 작은것.map(x => x.t + ' ' + x.h + 'px').join(', ')) : ''));
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 주민등록번호는 이 기기에만 · 가린 채로 · 서버 0번 · 백업 파일에도 안 담깁니다.');
  process.exit(bad ? 1 : 0);
})();
