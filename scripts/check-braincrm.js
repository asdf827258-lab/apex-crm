/* 윤시현의 두뇌 — 뇌를 따라가면 우리 DB 가 열리는가.

   두뇌는 오래도록 혼자 말했다. 좋은 말은 했는데, 오늘 누구에게 전화해야
   하는지는 CRM 안에만 있었고 두뇌는 그것을 본 적이 없었다.

   그래서 여기서 세 가지를 본다.
   하나, 두뇌 화면에 CRM 의 진짜 기록이 올라오는가 (지어낸 숫자가 아니라).
   둘, 그 줄을 누르면 DB 통합 CRM 이 실제로 열리는가 — 이것이 「따라가면 열린다」다.
   셋, 두뇌에게 물을 때 그 숫자가 함께 넘어가되 고객 이름·번호는 안 넘어가는가.
       셋째가 가장 중요하다. 숫자를 주자고 고객을 넘기면 안 된다.            */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8893;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* AI 보고 검사와 같은 자료를 쓴다 — 한 자료로 여러 화면을 보면 어긋날 일이 없다 */
const STUB = fs.readFileSync('scripts/check-airep.js', 'utf8').split('const STUB = `')[1].split('\n`;\n')[0];

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    try { localStorage.setItem('apex_ar_brief_off', '1'); localStorage.setItem('apex_ar_auto_off', '1'); } catch (e) { }
  });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);

  /* 박서준으로 앉는다 — 배정 DB 가 가장 많은 사람이다 */
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osHelpOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'p2', name: '박서준', role: 'member', plan: 'vip' };
    OS.session = { user: { id: 'p2', email: 'm@t' } };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    window.__AI_OUT = '## 지금 걸 세 통\n부재부터 겁니다.';
    window.callAI = function (sys, user) {
      window.__aiCalls.push({ sys: sys, user: user });
      return Promise.resolve(window.__AI_OUT);
    };
    window.aiReady = function () { return true; };
    if (typeof AR !== 'undefined') { AR.loaded = false; AR.busy = ''; AR.db = null; }
  });

  console.log('\n두뇌 화면을 연다');
  await page.evaluate(() => go('brain'));
  await page.waitForTimeout(1200);

  ok(await page.evaluate(() => !!document.getElementById('bcrBody')),
    '두뇌 화면에 「두뇌가 보고 있는 우리 DB」 칸이 있다');

  /* 스스로 CRM 기록을 읽으러 간다 — 사람이 따로 누르지 않아도 */
  await page.waitForFunction(() => typeof AR !== 'undefined' && !!AR.db, { timeout: 20000 })
    .catch(() => { });
  ok(await page.evaluate(() => typeof AR !== 'undefined' && !!AR.db),
    '화면을 열면 스스로 CRM 기록을 읽는다');
  await page.waitForTimeout(1400);

  const view = await page.evaluate(() => ({
    chips: Array.prototype.map.call(document.querySelectorAll('#bcrBody .bcr-c'), e => e.textContent),
    rows: Array.prototype.map.call(document.querySelectorAll('#bcrBody .bcr-r .nm'), e => e.textContent),
    click: Array.prototype.map.call(document.querySelectorAll('#bcrBody .bcr-r'), e => e.getAttribute('onclick')),
    tail: (document.querySelector('#bcrBody .bcr-tail') || {}).textContent || '',
    n: (typeof bcrCount === 'function' && bcrCount()) ? bcrCount().all : 0,
    my: (typeof bcrList === 'function') ? bcrList(6).map(x => x.who) : []
  }));

  ok(view.n > 0, '오늘 손댈 사람이 실제 DB 에서 잡힌다 (' + view.n + '명)');
  ok(view.chips.length > 0, '단계별 칸이 선다 — ' + view.chips.join(' · '));
  ok(view.rows.length > 0, '사람 줄이 뜬다 (' + view.rows.length + '명)');
  ok(view.rows.every(n => /고객\d+/.test(n)), '뜨는 이름이 실제 DB 의 이름이다 (지어낸 이름이 아니다)');
  ok(view.my.every(w => w === 'p2'), '담당자는 자기 것만 본다');
  ok(view.click.every(c => /bcrGo\('(crm|clients)'\)/.test(c || '')),
    '줄마다 따라갈 곳이 붙어 있다');
  ok(/DB 통합 CRM/.test(view.tail), '「누르면 CRM 이 열린다」고 화면이 말한다');

  /* ── 여기가 핵심 — 정말로 따라가면 CRM 이 열리는가 ── */
  console.log('\n줄을 눌러 본다');
  await page.evaluate(() => {
    const r = document.querySelector('#bcrBody .bcr-r');
    r.click();
  });
  await page.waitForTimeout(2500);
  const opened = await page.evaluate(() => {
    const f = document.getElementById('crmFrame');
    return {
      tab: (typeof TAB !== 'undefined') ? TAB : '',
      mounted: !!(f && f._mounted),
      src: (f && f.getAttribute('src')) || '',
      shown: !!(f && f.offsetParent !== null)
    };
  });
  ok(/db-crm\.html/.test(opened.src), 'DB 통합 CRM 이 실제로 열린다 — ' + (opened.src || '(안 열림)'));
  ok(opened.mounted, 'CRM 틀이 올라와 있다');
  ok(opened.shown, 'CRM 화면이 눈에 보인다');

  /* 열린 CRM 이 두뇌가 세던 것과 같은 자리를 보는가 */
  ok(await page.evaluate(() => CRM_URL === '/db-crm.html'),
    'CRM 은 같은 주소의 /db-crm.html 이다 (로그인이 하나로 이어진다)');

  /* ── 두뇌에게 물을 때 숫자는 가고 고객은 안 가는가 ── */
  console.log('\n이 명단으로 오늘 순서를 짜 달라고 해 본다');
  await page.evaluate(() => { go('brain'); });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__aiCalls = []; bcrAsk(); });
  await page.waitForTimeout(1800);

  const call = await page.evaluate(() => window.__aiCalls[window.__aiCalls.length - 1] || null);
  ok(!!call, '두뇌가 실제로 불린다');
  const u = (call && call.user) || '';
  ok(/윤시현의 두뇌/.test((call && call.sys) || ''), '윤시현의 두뇌로서 답하게 시킨다');
  ok(/지금 우리 DB/.test(u), 'CRM 의 지금 숫자가 두뇌에게 넘어간다');
  ok(/오늘 손댈 사람 \d+명/.test(u), '숫자가 진짜 건수로 넘어간다');
  ok(/전화 습관/.test(u), '최근 30일 전화 습관까지 함께 넘어간다');
  ok(!/고객\d+/.test(u), '고객 이름은 넘기지 않는다');
  ok(!/010-|\d{3}-\d{4}/.test(u), '연락처는 넘기지 않는다');
  ok(/지어내지 마세요/.test(u), '없는 숫자를 지어내지 말라고 못 박는다');

  /* 평소 질문에도 오늘 판이 붙는가 — 두뇌가 우리 상황 위에서 답해야 한다 */
  await page.evaluate(() => { window.__aiCalls = []; brainAsk('오늘 무엇부터 할까?'); });
  await page.waitForTimeout(1500);
  const u2 = await page.evaluate(() => (window.__aiCalls[window.__aiCalls.length - 1] || {}).user || '');
  ok(/지금 우리 DB/.test(u2), '평소 질문에도 우리 DB 숫자가 함께 간다');
  ok(!/전화 습관/.test(u2), '평소 질문에는 필요 없는 것까지 붙이지 않는다');
  ok(!/고객\d+/.test(u2), '평소 질문에도 고객 이름은 안 넘어간다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ ' + fail.join('\n✗ ')); process.exit(1); }
  console.log('\n두뇌 → CRM 검사 통과');
})();
