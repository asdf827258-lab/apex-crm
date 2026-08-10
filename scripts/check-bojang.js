/* AI 보장분석 — 눌렀을 때 결과물이 정말 나오는가.

   여태 이랬다.
     생성 누름 → 「고객 자료를 AI 로 보내기 전에」 동의창 → 동의 →
     창만 닫히고 끝. 결과물은 없다. 다시 눌러야 나온다.
   그리고 동의 기록 표(legal_consents)가 없거나 안 닿으면
     동의를 눌러도 저장 실패 → 창이 안 닫힘 → 영원히 못 씀.

   고객 증권을 다루는 도구는 전부 이 문 뒤에 있다 —
   보장분석·비포애프터·제안서비교·카톡설명·실비계산기·건강검진·알릴의무.
   문 하나가 막히면 그 일곱이 통째로 멈춘다.

   여기서 확인하는 것.
     1. 동의하면 하던 일이 그대로 이어져 결과물이 나온다 (두 번 안 누른다)
     2. 서버에 기록을 못 남겨도 사람의 동의는 유효하다 — 일이 안 막힌다
     3. 한 번 동의하면 새로고침해도 다시 안 묻는다
     4. 취소하면 조용히 끝난다 — 몰래 보내지 않는다
     5. 동의 전에는 고객 자료가 한 글자도 밖으로 안 나간다              */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8825;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 동의 기록 표가 있는 서버 / 없는 서버를 골라 흉내 낸다 */
const STUB = `
window.__consentTable = true;   /* false 면 표가 없는 서버 */
window.__saved = [];
window.supabase={createClient:function(){
 var mk=function(tbl){var f={};var a={
   select:function(){return a},eq:function(k,v){f[k]=v;return a},gte:function(){return a},
   lte:function(){return a},is:function(){return a},neq:function(){return a},in:function(){return a},
   not:function(){return a},order:function(){return a},limit:function(){return a},single:function(){return a},
   range:function(){return a},insert:function(){return a},update:function(){return a},
   upsert:function(v){
     if(tbl==='legal_consents'){
       if(!window.__consentTable){f._err={message:'relation "public.legal_consents" does not exist'};return a}
       window.__saved.push(v);
     }
     return a},
   then:function(res){
     if(f._err)return Promise.resolve({data:null,error:f._err}).then(res);
     if(tbl==='legal_consents'&&window.__consentTable&&window.__rows)
       return Promise.resolve({data:window.__rows,error:null}).then(res);
     return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'bj',email:'b@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'bj'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  async function boot(consentTable) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(() => {
      try { localStorage.clear(); localStorage.setItem('apex_ar_auto_off', '1'); localStorage.setItem('apex_ar_brief_off', '1'); } catch (e) { }
    });
    await page.addInitScript(STUB);
    await page.addInitScript(t => { window.__wantTable = t; }, consentTable);
    await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2600);
    await page.evaluate(() => {
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      window.__consentTable = window.__wantTable;
      OS.profile = { id: 'bj', name: '점검', role: 'owner', plan: 'vip' };
      OS.session = { user: { id: 'bj', email: 'b@t' } };
      window.__toast = []; window.toast = function (m) { window.__toast.push(m); };
      /* AI 는 가짜로 — 여기서 보는 것은 '문이 열리고 결과물이 오는가' 이다 */
      window.__ai = [];
      window.callClaude = function (sys, user) {
        window.__ai.push({ sys: sys, user: user });
        return Promise.resolve('## 보장분석 결과\n암 진단비가 3천만원 부족합니다.');
      };
      LGL.mine = {}; LGL.waiters = [];
    });
    return { ctx, page, errs };
  }

  /* 동의 문을 지나 결과물이 오는지 — callAI 를 직접 부른다 */
  const run = page => page.evaluate(() => {
    window.__ai = [];
    return { p: (window.__run = callAI('보장분석 시스템', '고객 증권 내용입니다', 500, 'bojang')
      .then(t => ({ out: t, err: '' }), e => ({ out: '', err: (e && e.message) || '오류' }))) , dummy: 1 };
  }).then(() => null);

  const settled = page => page.evaluate(() => window.__run);

  /* ══ ① 동의 기록 표가 있는 서버 ══ */
  console.log('── 동의 기록 표가 있는 서버 ──');
  const A = await boot(true);
  let page = A.page;

  await run(page);
  await page.waitForTimeout(400);
  const g1 = await page.evaluate(() => ({
    open: !!document.querySelector('#lgOvl.on'),
    txt: (document.getElementById('lgOvl') || {}).textContent || '',
    ai: window.__ai.length,
    waiters: (LGL.waiters || []).length
  }));
  ok(g1.open, '고객 자료 도구를 부르면 동의 창이 먼저 뜬다');
  ok(/고객 자료를 AI 로 보내기 전에/.test(g1.txt), '무엇을 왜 보내는지 적혀 있다');
  ok(g1.ai === 0, '동의 전에는 고객 자료가 한 글자도 밖으로 안 나간다');
  ok(g1.waiters === 1, '하던 일이 버려지지 않고 문 앞에서 기다린다 (' + g1.waiters + '건)');

  /* 동의를 누른다 — 여기서 결과물이 나와야 한다 */
  const r1 = await page.evaluate(async () => {
    document.getElementById('lgSensCk').checked = true;
    lgAgreeSensitive();
    const out = await window.__run;
    return {
      out, open: !!document.querySelector('#lgOvl.on'),
      ai: window.__ai.length, saved: window.__saved.length,
      msg: window.__toast.join(' | ')
    };
  });
  ok(/보장분석 결과/.test(r1.out.out || ''),
    '동의하면 하던 일이 그대로 이어져 결과물이 나온다 — 두 번 안 누른다');
  ok(r1.ai === 1, 'AI 를 정확히 한 번 부른다 (' + r1.ai + '번)');
  ok(r1.open === false, '동의 창이 닫힌다');
  ok(r1.saved === 1, '동의 기록이 서버에 남는다');
  ok(/이어서 진행/.test(r1.msg), '무슨 일이 일어났는지 말해 준다 — ' + r1.msg.slice(0, 40));

  /* 두 번째부터는 안 묻는다 */
  const r2 = await page.evaluate(async () => {
    window.__ai = [];
    const out = await callAI('보장분석 시스템', '두 번째 고객', 500, 'bojang')
      .then(t => ({ out: t, err: '' }), e => ({ out: '', err: e.message }));
    return { out, open: !!document.querySelector('#lgOvl.on'), ai: window.__ai.length };
  });
  ok(r2.open === false && /보장분석 결과/.test(r2.out.out || ''), '두 번째부터는 안 묻고 바로 만든다');

  /* 새로고침해도 안 묻는다 — 이 기기에 남겼기 때문 */
  const kept = await page.evaluate(() => {
    LGL.mine = {};                     /* 서버에서 못 받아온 척 */
    return { has: lgHas('sensitive', LG_SENS_VER), gate: lgGate('bojang') };
  });
  ok(kept.has === true && kept.gate === false,
    '새로고침해서 서버 기록을 못 받아와도 다시 안 묻는다 — 이 기기에 남겼다');

  ok(A.errs.length === 0, '자바스크립트 오류 없음' + (A.errs.length ? ' — ' + A.errs[0] : ''));
  await A.ctx.close();

  /* ══ ② 동의 기록 표가 없는 서버 — 여기서 영원히 막혔었다 ══ */
  console.log('── 동의 기록 표가 없는 서버 ──');
  const B = await boot(false);
  page = B.page;
  await run(page);
  await page.waitForTimeout(400);
  const r3 = await page.evaluate(async () => {
    document.getElementById('lgSensCk').checked = true;
    lgAgreeSensitive();
    const out = await window.__run;
    return {
      out, open: !!document.querySelector('#lgOvl.on'),
      ai: window.__ai.length, saved: window.__saved.length,
      msg: window.__toast.join(' | ')
    };
  });
  ok(/보장분석 결과/.test(r3.out.out || ''),
    '서버에 기록을 못 남겨도 결과물은 나온다 — 사람의 동의는 유효하다');
  ok(r3.open === false, '창이 닫힌다 — 눌러도 아무 일 없는 상태로 안 갇힌다');
  ok(r3.saved === 0, '서버에는 실제로 안 남았다 (표가 없으므로)');
  ok(/migration_32_legal\.sql/.test(r3.msg), '무엇을 실행해야 하는지 알려 준다 — ' + r3.msg.slice(0, 70));

  const kept2 = await page.evaluate(() => ({ has: lgHas('sensitive', LG_SENS_VER) }));
  ok(kept2.has === true, '표가 없어도 이 기기에는 남는다 — 다음부터 안 묻는다');

  ok(B.errs.length === 0, '표 없는 서버에서도 자바스크립트 오류 없음' + (B.errs.length ? ' — ' + B.errs[0] : ''));
  await B.ctx.close();

  /* ══ ③ 취소하면 조용히 끝난다 ══ */
  console.log('── 취소했을 때 ──');
  const C = await boot(true);
  page = C.page;
  await run(page);
  await page.waitForTimeout(400);
  const r4 = await page.evaluate(async () => {
    lgCloseSensitive(false);
    const out = await window.__run;
    return { out, ai: window.__ai.length, open: !!document.querySelector('#lgOvl.on') };
  });
  ok(!r4.out.out && !!r4.out.err, '취소하면 결과물을 만들지 않는다');
  ok(r4.ai === 0, '취소하면 고객 자료가 밖으로 안 나간다 (' + r4.ai + '번)');
  ok(/다시 눌러/.test(r4.out.err || ''), '왜 안 됐는지 말해 준다 — ' + (r4.out.err || '').slice(0, 40));
  ok(r4.open === false, '창은 닫힌다');

  /* 이 문 뒤에 있는 도구가 무엇인지 — 하나 막히면 이만큼 멈춘다 */
  const tools = await page.evaluate(() => Object.keys(LG_CUSTOMER_GEN));
  ok(tools.indexOf('bojang') >= 0 && tools.length >= 7,
    '고객 자료 도구 ' + tools.length + '개가 같은 문을 쓴다 — ' + tools.slice(0, 6).join(','));

  ok(C.errs.length === 0, '취소 흐름에서도 자바스크립트 오류 없음' + (C.errs.length ? ' — ' + C.errs[0] : ''));
  await C.ctx.close();

  await browser.close(); srv.close();
  if (fail.length) { console.log('\nAI 보장분석 검사 실패:'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('\nAI 보장분석 검사 통과');
})();
