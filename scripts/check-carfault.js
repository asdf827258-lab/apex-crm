/* 자동차사고 과실·보상 분석기가 앱 안에서 제대로 열리는가.

   이 화면은 밖에서 만들어 온 단일 파일이다. 통째로 붙일 때 늘 세 가지가 샌다.
     1. 메뉴에 세워 두고 정작 눌러도 안 열린다
     2. 열리긴 하는데 나올 길이 없다
     3. AI 가 회사 서버로 못 나간다 — 토큰을 안 실어서 401 인데
        화면에는 그냥 「안 된다」 로만 보인다
   그 셋을 본다.                                                        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8847;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
const TOOL = 'app/상담자료/자동차사고_과실분석.html';

(async () => {
  /* ══ [1] 파일이 있고, 혼자서도 도는가 ═══════════════════════ */
  console.log('\n[1] 파일');
  ok(fs.existsSync(TOOL), '도구 파일이 있다');
  const t = fs.readFileSync(TOOL, 'utf8');
  ok(/<title>APEX 자동차사고 과실·보상 분석기/.test(t), '제목이 APEX 것이다');
  ok(t.length > 100000, '통째로 들어왔다 (' + Math.round(t.length / 1000) + 'K자)');

  /* ══ [2] 서버 창구로 나가는 길 ══════════════════════════════ */
  console.log('\n[2] AI 가 회사 서버로 나가는 길');
  ok(/function appToken\(\)/.test(t), '바깥 앱에서 토큰을 빌려 오는 자리가 있다');
  ok(/window\.parent\.getAppToken/.test(t), '바깥 앱의 getAppToken 을 부른다');
  ok(/h\['X-App-Token'\] = t;/.test(t), '토큰을 헤더에 실어 보낸다');
  ok(/r\.status === 401/.test(t), '401 이면 토큰 문제라고 말해 준다');
  ok(/const raw = await r\.text\(\);/.test(t),
    '곧바로 json() 하지 않는다 — 되돌림 규칙 때문에 앱 HTML 이 200 으로 올 수 있다');
  ok(/서버 창구\(\/api\/generate\)가 아직 없습니다/.test(t),
    '함수가 안 올라갔으면 그렇다고 말해 준다');
  ok(/'\/api\/generate'/.test(t), '앱과 같은 창구를 쓴다');
  /* 개인 키를 쓸 때는 토큰을 실으면 안 된다 — 그 길은 앤트로픽으로 바로 간다 */
  const iKey = t.indexOf("'https://api.anthropic.com/v1/messages'");
  const iTok = t.indexOf("h['X-App-Token'] = t;");
  ok(iKey > 0 && iTok > iKey, '개인 키로 직접 갈 때는 공유 토큰을 안 붙인다');

  /* 서버가 실제로 이 모양을 받아 주는가 — 창구 계약을 견준다 */
  const gen = fs.readFileSync('netlify/functions/generate.js', 'utf8');
  ok(/body\.max_tokens/.test(gen) && /Array\.isArray\(body\.messages\)/.test(gen),
    '서버가 max_tokens · messages 를 받는다');
  ok(/text: out/.test(gen), '서버가 text 로 돌려준다 — 도구가 읽는 칸과 같다');
  ok(/x-app-token/.test(gen), '서버가 X-App-Token 을 본다');
  const rd = fs.readFileSync('_redirects', 'utf8');
  ok(/^\/api\/generate\s+\/\.netlify\/functions\/generate\s+200/m.test(rd),
    '/api/generate 가 함수로 이어져 있다');

  /* ══ [3] 앱 안에서 ══════════════════════════════════════════ */
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('main: ' + e.message));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'me', name: '윤점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me', email: 'me@t' } };
    window.toast = () => { };
    /* 로그인 전에 그려 둔 메뉴에는 이 칸이 없다. 사람이 로그인하면 앱이 다시 그린다 —
       시험도 그 순서를 그대로 밟는다. */
    if (typeof renderNav === 'function') renderNav();
  });

  console.log('\n[3] 왼쪽 메뉴 — 계약·청구 칸');
  let r = await page.evaluate(() => {
    let grp = null;
    (typeof TABS !== 'undefined' ? TABS : []).forEach(g => { if (g.group === '계약·청구') grp = g; });
    return {
      titles: grp ? grp.items.map(x => x.title) : [],
      item: grp ? grp.items.filter(x => x.id === 'car_fault')[0] : null
    };
  });
  ok(!!r.item, '「자동차사고 과실·보상」 이 계약·청구 칸에 있다');
  ok(r.item && r.item.icon === '🚗', '아이콘이 붙어 있다');
  ok(r.titles.indexOf('자동차사고 과실·보상') === r.titles.length - 1,
    '계약·청구 칸 맨 끝에 온다 — ' + r.titles.join(' · '));

  console.log('\n[4] 눌러서 열고, 나오기');
  r = await page.evaluate(() => {
    go('car_fault');
    const f = document.getElementById('carFaultFrame');
    return {
      mode: document.body.className,
      shown: !!document.getElementById('carFaultScreen'),
      src: f ? f.getAttribute('src') : '',
      marked: !!document.querySelector('.tab-btn[data-tab="car_fault"].on'),
      back: !!document.querySelector('#carFaultScreen .ff-back')
    };
  });
  ok(/carfault-mode/.test(r.mode), '누르면 전체화면으로 열린다');
  ok(r.src === '상담자료/자동차사고_과실분석.html', '그 파일을 띄운다 — ' + r.src);
  ok(r.marked, '메뉴에서 지금 이 칸이라고 표시된다');
  ok(r.back, '나올 단추가 있다');

  r = await page.evaluate(() => {
    go('home');
    return { mode: document.body.className, still: getComputedStyle(document.getElementById('carFaultScreen')).display };
  });
  ok(!/carfault-mode/.test(r.mode), '나오면 전체화면이 풀린다');
  ok(r.still === 'none', '나온 뒤에는 화면이 안 남는다');

  /* 다른 전체화면으로 갈아탈 때 겹치지 않는가 */
  r = await page.evaluate(() => {
    go('car_fault'); go('mikki_talk');
    return document.body.className;
  });
  ok(/mktalk-mode/.test(r) && !/carfault-mode/.test(r), '다른 전체화면으로 갈아타면 겹치지 않는다');

  console.log('\n[5] 창 안에서 실제로 그려지는가');
  await page.evaluate(() => go('car_fault'));
  await page.waitForTimeout(2200);
  r = await page.evaluate(() => {
    const f = document.getElementById('carFaultFrame');
    const d = f && f.contentDocument;
    if (!d) return { ok: false };
    return {
      ok: true,
      title: d.title,
      tabs: d.querySelectorAll('.tab').length,
      go: !!d.getElementById('go'),
      hasToken: typeof f.contentWindow.appToken === 'function',
      token: (function () { try { return f.contentWindow.appToken(); } catch (e) { return 'ERR:' + e.message; } })()
    };
  });
  ok(r.ok, '창이 실제로 열렸다');
  ok(/자동차사고 과실/.test(r.title || ''), '창 안 제목이 맞다 — ' + (r.title || ''));
  ok(r.tabs >= 3, '입력 칸(탭)이 그려진다 (' + r.tabs + ')');
  ok(r.go, '분석 시작 단추가 있다');
  ok(r.hasToken === true, '창 안에서 appToken() 이 산다');
  ok(typeof r.token === 'string' && r.token.indexOf('ERR:') !== 0,
    '토큰을 읽다 터지지 않는다');
  /* 앱은 공유 토큰을 스스로 만들어 둔다. 창이 보는 값이 바깥 값과 같아야 한다 —
     값 자체는 비밀이므로 여기서도 화면에도 찍지 않는다. */
  r = await page.evaluate(() => {
    const f = document.getElementById('carFaultFrame');
    let inner = ''; try { inner = f.contentWindow.appToken(); } catch (e) { inner = 'ERR'; }
    return { same: inner === getAppToken(), len: (inner || '').length };
  });
  ok(r.same, '창이 보는 토큰이 바깥 앱의 것과 같다');
  ok(r.len > 0, '앱이 스스로 만들어 둔 토큰이 창까지 간다 (' + r.len + '자)');

  /* 바꿔 두면 그 값을 따라가는가 */
  r = await page.evaluate(() => {
    const was = getAppToken();
    LS.set('apptoken', 'TEST-TOKEN');
    const f = document.getElementById('carFaultFrame');
    let v = ''; try { v = f.contentWindow.appToken(); } catch (e) { v = 'ERR:' + e.message; }
    LS.set('apptoken', was);
    return v;
  });
  ok(r === 'TEST-TOKEN', '바깥 값을 바꾸면 창도 그 값을 따라간다');

  const ferrs = [];
  page.frames().forEach(fr => { });
  page.on('pageerror', e => ferrs.push(e.message));
  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? (' — ' + errs[0]) : ''));

  console.log('\n[6] 좁은 화면');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => {
    const d = document.getElementById('carFaultFrame').contentDocument;
    return [d.documentElement.scrollWidth, d.documentElement.clientWidth];
  });
  ok(w[0] <= w[1] + 1, '390px 가로 스크롤 없음 (' + w[0] + '/' + w[1] + ')');

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('자동차사고 과실·보상 점검 통과 — 열리고, 나오고, 서버로 나갑니다.');
})().catch(e => { console.error(e); process.exit(1); });
