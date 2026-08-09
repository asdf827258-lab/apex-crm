/* 윤시스쿨 — 정말로 우리 일을 보고 있는가.

   이 화면은 오래도록 혼자 돌았다. 오피스에는 지어낸 이름 서른둘이 걸어 다녔고
   진행판은 늘 0 이었고 할일은 그 이름들에게 배정됐다. 그래서 아무 도움이 안 됐다.
   지금은 앱 안(같은 출처 iframe)에서 부모가 읽어 둔 실제 기록을 그대로 본다.

   그래서 여기서 두 가지를 본다.
   하나, 앱 안에서 열면 진짜 팀·진짜 DB 가 뜨는가.
   둘, 앱 밖(새 탭)에서 열면 데모라고 스스로 밝히는가.
   둘째가 더 중요하다. 지어낸 이름을 진짜인 척 보여 주는 것이 원래 문제였다.     */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8891;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* AI 보고 검사와 같은 자료를 쓴다 — 한 자료로 두 화면을 보면 어긋날 일이 없다 */
const STUB = fs.readFileSync('scripts/check-airep.js', 'utf8').split('const STUB = `')[1].split('\n`;\n')[0];
const YS = '/app/%EC%9C%A4%EC%8B%9C%EC%8A%A4%EC%BF%A8/index.html';

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* ══════════ 1) 앱 안에서 — 진짜 우리 팀이 뜨는가 ══════════ */
  console.log('\n앱 안에서 열었을 때');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('앱: ' + e.message));
  await page.addInitScript(() => {
    try { localStorage.setItem('apex_ar_brief_off', '1'); localStorage.setItem('apex_ar_auto_off', '1'); } catch (e) { }
  });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osHelpOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'p1', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'p1', email: 'o@t' } };
    window.toast = function () { };
    window.callAI = () => Promise.resolve('테스트');
    if (typeof GB !== 'undefined') { GB.loaded = false; GB.busy = false; GB.rows = []; }
    if (typeof AR !== 'undefined') { AR.loaded = false; }
    if (typeof gbLoad === 'function') gbLoad();
    if (typeof arLoad === 'function') arLoad();
  });
  await page.waitForFunction(() => typeof GB !== 'undefined' && GB.loaded && GB.rows.length, { timeout: 15000 });
  await page.evaluate(() => go('yoonsi'));
  await page.waitForTimeout(6000);

  const fr = page.frames().find(f => f.url().indexOf('index.html') >= 0 && f !== page.mainFrame());
  ok(!!fr, '윤시스쿨 창이 앱 안에 열린다');
  if (!fr) { console.log('\n✗ ' + fail.join('\n✗ ')); await browser.close(); srv.close(); process.exit(1); }

  const st = await fr.evaluate(() => ({
    on: YS.on,
    teams: YS.teams.map(t => t.name),
    names: YS.teams.reduce((a, t) => a.concat(t.members.map(m => m.name)), []),
    nums: YS.nums, db: YS.db,
    bar: (document.getElementById('ysBar') || {}).textContent || '',
    zones: Array.prototype.map.call(document.querySelectorAll('.zlab'), e => e.textContent),
    tags: Array.prototype.map.call(document.querySelectorAll('.tag'), e => e.textContent.replace('★', '')),
    todoWho: Array.prototype.map.call(document.querySelectorAll('#todo_who option'), e => e.textContent),
    ctx: (typeof ysCtx === 'function') ? ysCtx() : ''
  }));

  ok(st.on === true, '실제 업무와 연결된다 (YS.on)');
  ok(/실제 업무와 연결됨/.test(st.bar), '맨 위에 연결됐다고 적힌다');
  ok(st.teams.indexOf('온탑1팀') >= 0 && st.teams.indexOf('온탑2팀') >= 0,
    '팀 이름이 뜬다 (아이디 t1 이 아니라) — ' + st.teams.join(' · '));
  ok(st.teams.indexOf('소속 없음') >= 0, '소속 없는 사람도 따로 모인다');
  ok(st.zones.indexOf('온탑1팀') >= 0, '오피스 구역 이름이 실제 팀이다 — ' + st.zones.join(' · '));

  const REAL = ['박서준', '최민아', '이지훈', '윤시현'];
  ok(REAL.every(n => st.names.indexOf(n) >= 0), '실제 팀원 넷이 모두 있다');
  ok(REAL.every(n => st.tags.indexOf(n) >= 0), '오피스에 실제 이름표가 걸린다');

  const FAKE = ['김상중', '카리나', '제니', '이효리', '신동엽', '마동석', '차은우'];
  ok(!FAKE.some(n => st.names.indexOf(n) >= 0), '지어낸 이름이 하나도 안 섞인다');
  ok(!FAKE.some(n => st.tags.indexOf(n) >= 0), '오피스에도 지어낸 이름이 없다');
  ok(!FAKE.some(n => st.todoWho.indexOf(n) >= 0), '할일을 지어낸 사람에게 배정하지 않는다');
  ok(REAL.every(n => st.todoWho.indexOf(n) >= 0), '할일 대상이 실제 팀원이다');

  /* 진행판이 0 으로 비어 있지 않은가 — 이게 원래 불만이었다 */
  ok(st.db && st.db.all > 0, '진행판에 실제 DB 건수가 잡힌다 (' + (st.db || {}).all + '건)');
  ok(st.nums && st.nums.people === 4, '팀 인원이 실제와 같다 (' + (st.nums || {}).people + '명)');
  ok(st.nums && st.nums.call > 0, '최근 30일 통화가 잡힌다 (' + (st.nums || {}).call + '통)');

  /* 숫자끼리 어긋나지 않는가 — 「오늘 움직인 4명」인데 「멈춘 3명」이면 거짓말이다 */
  const n = st.nums || {};
  ok(n.move + n.stop + n.quiet <= n.people,
    '움직인 사람 + 멈춘 사람이 인원수를 넘지 않는다 (' + n.move + '+' + n.stop + '+' + n.quiet + ' ≤ ' + n.people + ')');

  const funnel = await fr.evaluate(() => ({
    html: (document.getElementById('pipe') || {}).innerHTML || '',
    cls: (document.getElementById('pipe') || { className: '' }).className,
    duty: (document.getElementById('ysDuty') || {}).textContent || ''
  }));
  ok(/미진행/.test(funnel.html) && /진행중/.test(funnel.html) && /기고객/.test(funnel.html),
    '진행판이 실제 DB 단계(미진행·부재·거절·진행중·기고객·생일)로 선다');
  ok(/\bys\b/.test(funnel.cls), '진행판이 옛 격자와 겹치지 않게 표시된다');
  ok(/오늘 팀이 해야 할 것/.test(funnel.duty), '업무현황에 오늘 팀이 할 일이 실제 기록에서 올라온다');
  ok(/박서준/.test(funnel.duty), '할 일이 사람 이름과 함께 나온다');

  /* AI 에게 넘기는 글 — 숫자는 주되 고객은 안 준다 */
  ok(/우리 조직의 지금 숫자/.test(st.ctx), 'AI 에게 우리 숫자를 함께 넘긴다');
  ok(/박서준\(온탑1팀\)/.test(st.ctx), '팀원별 상태가 팀 이름과 함께 넘어간다');
  ok(!/고객12|고객18|010-|김○○/.test(st.ctx), '고객 이름·번호는 AI 로 넘기지 않는다');
  ok(/지어내지 마세요/.test(st.ctx), '숫자를 지어내지 말라고 못 박는다');

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs[0] : ''));
  await ctx.close();

  /* ══════════ 2) 앱 밖에서 — 데모라고 밝히는가 ══════════ */
  console.log('\n새 탭에서 혼자 열었을 때');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p2 = await ctx2.newPage();
  const e2 = [];
  p2.on('pageerror', e => e2.push('단독: ' + e.message));
  await p2.goto('http://127.0.0.1:' + PORT + YS, { waitUntil: 'load' });
  await p2.waitForTimeout(2500);

  const alone = await p2.evaluate(() => ({
    on: YS.on,
    bar: (document.getElementById('ysBar') || {}).textContent || '',
    tags: Array.prototype.map.call(document.querySelectorAll('.tag'), e => e.textContent).length
  }));
  ok(alone.on === false, '앱 밖에서는 연결되지 않는다');
  ok(/데모 화면입니다/.test(alone.bar), '스스로 데모라고 밝힌다');
  ok(/실제 팀원이 아닙니다/.test(alone.bar), '이 사람들은 실제 팀원이 아니라고 적는다');
  ok(alone.tags > 0, '그래도 화면은 정상으로 뜬다 (' + alone.tags + '명)');
  ok(e2.length === 0, '앱 밖에서도 오류가 없다' + (e2.length ? ' — ' + e2[0] : ''));
  await ctx2.close();

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ ' + fail.join('\n✗ ')); process.exit(1); }
  console.log('\n윤시스쿨 검사 통과');
})();
