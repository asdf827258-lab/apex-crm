/* AI 키가 거절당했을 때 — 영어 오류를 그대로 뱉지 않고 살아 있는 쪽으로 넘어가는지.

   구글은 키가 틀리면 400 으로 이렇게 답한다.
       API key not valid. Please pass a valid API key.
   여태 앱은 이 문장을 그대로 화면에 띄웠다. TFA 업무관리에서도, 음성비서에서도.
   쓰는 사람 입장에서는 무엇을 어디서 고쳐야 하는지 알 길이 없었다.

   여기서 확인하는 것은 네 가지다.
     1. Gemini 키가 거절당하면 Claude 가 대신 답한다
     2. 거절당한 통로는 다시 부르지 않는다 (한 번 죽으면 그걸로 끝)
     3. 둘 다 거절당하면 한국어로 '무엇을 고쳐야 하는지' 를 말한다
     4. 내 개인 키가 나쁘면 회사 공용 통로로 한 번 더 해 본다             */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8823;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},gte:function(){return a},
   lte:function(){return a},is:function(){return a},neq:function(){return a},in:function(){return a},
   not:function(){return a},order:function(){return a},limit:function(){return a},single:function(){return a},
   range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'k',email:'k@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'k'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

/* 구글이 실제로 돌려주는 문장 그대로 */
const GOOG_BAD = JSON.stringify({
  error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' }
});

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    try { localStorage.setItem('apex_ar_auto_off', '1'); localStorage.setItem('apex_ar_brief_off', '1'); } catch (e) { }
  });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* 가짜 서버를 세운다. 어느 주소로 몇 번 갔는지 세고, 정해 둔 답을 돌려준다. */
  await page.evaluate(([bad]) => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.__hit = [];
    window.__mode = { gem: 'bad', claude: 'ok' };
    window.__badBody = bad;
    window.toast = function (m) { (window.__toast = window.__toast || []).push(m); };
    window.fetch = function (url, opt) {
      var u = '' + url;
      window.__hit.push(u);
      var isGem = /gemini|generativelanguage/i.test(u);
      if (isGem) {
        if (window.__mode.gem === 'bad')
          return Promise.resolve({ ok: false, status: 400, text: function () { return Promise.resolve(window.__badBody); } });
        return Promise.resolve({
          ok: true, status: 200, text: function () {
            return Promise.resolve(JSON.stringify({ candidates: [{ content: { parts: [{ text: '제미나이가 답했습니다' }] }, finishReason: 'STOP' }] }));
          }
        });
      }
      if (window.__mode.claude === 'bad')
        return Promise.resolve({
          ok: false, status: 401, text: function () {
            return Promise.resolve(JSON.stringify({ error: { type: 'authentication_error', message: 'invalid x-api-key' } }));
          }
        });
      return Promise.resolve({
        ok: true, status: 200, text: function () {
          return Promise.resolve(JSON.stringify({ content: [{ type: 'text', text: '클로드가 답했습니다' }], stop_reason: 'end_turn' }));
        }
      });
    };
  }, [GOOG_BAD]);

  const reset = (gem, claude, gkey) => page.evaluate(([g, c, k]) => {
    AI_DEAD.gkey = false; AI_DEAD.gproxy = false; AI_DEAD.claude = false;
    window.__mode = { gem: g, claude: c };
    window.__hit = []; window.__toast = [];
    LS.set('gkey', k || '');
    LS.set('provider', 'gemini');   /* Gemini 를 먼저 부르게 해서 거절을 재현한다 */
    AI_RETRY.on = false;
  }, [gem, claude, gkey]);

  const ask = () => page.evaluate(() => callAI('너는 점검용이다', '한 줄만 답해', 100, 'probe')
    .then(function (t) { return { out: t, err: '' }; }, function (e) { return { out: '', err: (e && e.message) || '오류' }; }));

  /* ── 1. Gemini 키가 거절당하면 Claude 가 대신 답한다 ── */
  await reset('bad', 'ok', '');
  const r1 = await ask();
  ok(r1.out.indexOf('클로드가 답했습니다') >= 0,
    'Gemini 키가 거절당해도 Claude 가 대신 답한다 — ' + (r1.out || r1.err).slice(0, 30));
  ok(!/API key not valid/i.test(r1.out + r1.err),
    '영어 오류 "API key not valid" 가 화면으로 새지 않는다');
  const t1 = await page.evaluate(() => (window.__toast || []).join(' | '));
  ok(/Gemini 키가 거절/.test(t1), '무슨 일이 있었는지 한국어로 알려 준다 — ' + t1.slice(0, 40));

  /* ── 2. 죽은 통로는 다시 부르지 않는다 ── */
  const dead1 = await page.evaluate(() => ({ gp: AI_DEAD.gproxy, ready: geminiReady() }));
  ok(dead1.gp === true, '거절당한 공용 통로를 죽은 것으로 적어 둔다');
  ok(dead1.ready === false, '죽은 뒤에는 Gemini 가 준비된 것으로 세지 않는다');
  await page.evaluate(() => { window.__hit = []; });
  const r2 = await ask();
  const gemHits = await page.evaluate(() => (window.__hit || []).filter(u => /gemini|generativelanguage/i.test(u)).length);
  ok(gemHits === 0, '두 번째 부름은 Gemini 를 아예 건드리지 않는다 (' + gemHits + '번)');
  ok(r2.out.indexOf('클로드가 답했습니다') >= 0, '두 번째도 Claude 가 바로 답한다');

  /* ── 3. 둘 다 거절당하면 한국어로 무엇을 고칠지 말한다 ── */
  await reset('bad', 'bad', '');
  const r3 = await ask();
  ok(!!r3.err, '둘 다 막히면 가짜 답을 지어내지 않고 실패로 끝낸다');
  ok(/ANTHROPIC_API_KEY/.test(r3.err) && /GEMINI_API_KEY/.test(r3.err),
    '고쳐야 할 환경변수 이름 두 개를 그대로 알려 준다');
  ok(/Netlify/.test(r3.err) && /환경변수/.test(r3.err),
    '어디서 고치는지(Netlify 환경변수)까지 적는다');
  ok(!/API key not valid/i.test(r3.err), '이때도 영어 원문을 그대로 보여주지 않는다');

  /* ── 4. 내 개인 키가 나쁘면 회사 공용 통로로 한 번 더 ── */
  await reset('bad', 'ok', 'AIzaBAD-personal-key');
  await page.evaluate(() => {
    /* 개인 키로 간 첫 통화만 거절하고, 공용 통로로 오면 받아 준다 */
    window.__hit = [];
    var real = window.fetch;
    window.fetch = function (url, opt) {
      var u = '' + url;
      window.__hit.push(u);
      if (/generativelanguage/i.test(u))
        return Promise.resolve({ ok: false, status: 400, text: function () { return Promise.resolve(window.__badBody); } });
      if (/\/api\/gemini/.test(u))
        return Promise.resolve({
          ok: true, status: 200, text: function () {
            return Promise.resolve(JSON.stringify({ candidates: [{ content: { parts: [{ text: '회사 키로 답했습니다' }] }, finishReason: 'STOP' }] }));
          }
        });
      return real(url, opt);
    };
  });
  const r4 = await ask();
  ok(r4.out.indexOf('회사 키로 답했습니다') >= 0,
    '내 개인 키가 나쁘면 회사 공용 통로로 넘어가 답을 받는다 — ' + (r4.out || r4.err).slice(0, 30));
  const dead4 = await page.evaluate(() => ({ gk: AI_DEAD.gkey, gp: AI_DEAD.gproxy }));
  ok(dead4.gk === true && dead4.gp === false,
    '나쁜 것은 내 개인 키뿐이라고 정확히 구분한다');

  /* ── 5. 음성비서도 같은 길을 쓴다 ── */
  const va = await page.evaluate(() => typeof vaAI === 'function' && /callAI\(/.test(vaAI.toString()));
  ok(va, '음성비서도 callAI 를 거치므로 같은 대체가 걸린다');

  /* ── 6. 환경변수 이름 복사에 Gemini 키가 들어간다 ── */
  const nm = await page.evaluate(() => nfCopyNames.toString());
  ok(/GEMINI_API_KEY/.test(nm), '환경변수 이름 복사 단추에 GEMINI_API_KEY 도 들어간다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  if (fail.length) { console.log('\nAI 키 검사 실패:'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('\nAI 키 검사 통과');
})();
