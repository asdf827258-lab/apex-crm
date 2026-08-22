/* 질병 보험가이드 — 지어낸 것이 섞여 있지 않은가.

   이 자료는 고객 앞에서 「이 병은 이렇게 치료하고, 그때 이 담보가 나옵니다」
   라고 말하는 데 쓰인다. 그래서 여기 적힌 담보 이름이 보장분석이 쓰는 이름과
   한 글자라도 다르면, 설계사가 증권에서 그 담보를 못 찾는다. 그 순간 상담이
   멈춘다.

   여기서 확인한다.

     1. 질병 표가 <b>한 벌</b>인가 — 앱이 그 한 벌을 읽는가, 다시 적지 않았는가
     2. 담보 이름이 INS_KEY·INS_AREA 가 아는 이름인가 (한 글자씩 견준다)
     3. 질병코드가 KCD_DATA 에 있는 코드인가
     4. 빠진 칸 없이 다섯 토막이 다 있는가 (병·원인·치료·담보·화법)
     5. 단정하지 않는가 — 「반드시 지급」 「무조건」 같은 말이 없는가
     6. 견본 이름이 홍길동인가 — 실제 고객 이름이 없는가
     7. 화면이 실제로 서는가 · 질병을 열면 다섯 토막이 다 나오는가
     8. 담보를 누르면 「이 담보가 어디에서 일하나」 가 나오는가
     9. 담보 말모이 — 이 돈이 무슨 돈인지 스물다섯 가지가 다 적히는가
    10. 전부 펼쳐 인쇄하면 한 권으로 묶이는가
    11. 좁은 화면에서 옆으로 안 밀리는가 · 인쇄에서 안 짤리는가
    12. <b>자료를 못 읽으면 화면을 안 세우는가</b> — 일부러 끊어 보고 확인한다              */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8877;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

/* 자료 파일을 <b>일부러 없애 보는</b> 길. 알람이 실제로 울리는지 보려면
   한 번은 망가뜨려 봐야 한다. 안 울리는 알람은 알람이 아니다. */
let CUT = false;

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (CUT && /질병가이드-data\.js$/.test(p)) {           /* 못 읽은 척한다 */
    res.writeHead(404); res.end(); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

const DATA = 'app/질병가이드-data.js';
const PAGE = 'app/재무설계/질병보험가이드.html';

(async () => {
  const app  = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const raw  = fs.readFileSync(path.join(ROOT, DATA), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');

  /* 자료를 그대로 읽어 온다 */
  const sandbox = { window: {} };
  new Function('window', raw)(sandbox.window);
  const D = sandbox.window.DZ_DATA;

  /* ═══ 1. 표가 한 벌인가 ═══ */
  console.log('\n[1] 질병 표가 한 벌인가 — 두 벌이면 한쪽만 고쳐진다');
  is(!!(D && D.list && D.list.length), '자료 한 벌이 읽힌다 — 질병 ' + ((D && D.list) ? D.list.length : 0) + '종');
  is(/<script src="질병가이드-data\.js"><\/script>/.test(app), '앱이 그 한 벌을 싣는다');
  is(/<script src="\.\.\/질병가이드-data\.js"><\/script>/.test(html), '가이드 화면도 같은 한 벌을 싣는다');
  is(/var TP_DISEASES\s*=\s*\(function/.test(app),
     '치료비 지급지도가 그 표에서 꺼내 쓴다 (질병 표를 다시 적지 않았다)');
  is(!/var TP_DISEASES\s*=\s*\[/.test(app), '앱 안에 질병 표가 다시 적혀 있지 않다');
  is(/<script src="apex-deck\.js">|상담자료\/apex-deck\.js/.test(html),
     '준법 문구는 상담자료 공통 덧붙임에서 온다 (여기서 따로 쓰지 않는다)');

  /* ═══ 2. 담보 이름 ═══ */
  console.log('\n[2] 담보 이름이 보장분석이 쓰는 이름과 같은가 — 다르면 증권에서 못 찾는다');
  const keyBlk = app.slice(app.indexOf('var INS_KEY'), app.indexOf('function insGaps'));
  const KEY = [...keyBlk.matchAll(/k:\s*'([^']+)'/g)].map(m => m[1]);
  const areaBlk = app.slice(app.indexOf('var INS_AREA'), app.indexOf('function insAreaOf'));
  const AREA = [...areaBlk.matchAll(/re:\s*(\/(?:[^\/\\]|\\.)+\/)/g)].map(m => eval(m[1]));
  const AK = [...areaBlk.matchAll(/k:\s*'([^']+)'/g)].map(m => m[1]);
  is(KEY.length > 0 && AREA.length > 0, '앱에서 담보 이름표를 찾았다 — INS_KEY ' + KEY.length + ' · INS_AREA ' + AREA.length);

  /* 담보 이름은 <b>말모이(DZ_DATA.cov)에 적힌 것만</b> 쓸 수 있다.
     갈래(INS_AREA)만 맞으면 통과시키면 「표적치료특약」 같은 새 이름이 슬쩍 끼어든다.
     실제로 그렇게 새 봤다 — 그래서 여기서는 한 글자까지 견준다. */
  const VOCAB = new Map((D.cov || []).map(c => [c.k, c]));
  is(VOCAB.size > 0, '담보 말모이가 있다 — ' + VOCAB.size + '개');

  const badVocab = [], badArea = [], loose = [];
  (D.cov || []).forEach(c => {
    if (AK.indexOf(c.area) < 0) { badArea.push('말모이 ' + c.k + ':' + c.area); return; }
    const areaRe = AREA[AK.indexOf(c.area)];
    if (KEY.indexOf(c.k) < 0 && !areaRe.test(c.k)) loose.push(c.k + ' (' + c.area + ')');
    if (!c.d) badVocab.push(c.k + ' 설명 없음');
  });
  is(loose.length === 0,
     '말모이의 이름을 앱의 이름표가 전부 알아본다' + (loose.length ? ' — 못 알아보는 이름: ' + loose.join(' / ') : ''));
  is(badVocab.length === 0, '말모이마다 「무슨 돈인지」 한 줄이 붙어 있다' + (badVocab.length ? ' — ' + badVocab.join(' / ') : ''));

  const badPay = [];
  (D.list || []).forEach(d => {
    if (AK.indexOf(d.area) < 0) badArea.push(d.id + ':' + d.area);
    (d.path || []).forEach(s => (s.pay || []).forEach(p => {
      if (!VOCAB.has(p.k)) badPay.push(d.id + ' · ' + p.k);
    }));
  });
  is(badPay.length === 0, '치료 단계에 붙은 담보가 전부 말모이에 있다' + (badPay.length ? ' — 말모이에 없는 이름: ' + badPay.join(' / ') : ''));
  is(badArea.length === 0, '질병마다 붙인 큰 틀이 INS_AREA 에 있다' + (badArea.length ? ' — ' + badArea.join(' / ') : ''));

  /* INS_KEY 열넷은 요즘 실지급을 가르는 계열이다. 말모이가 하나라도 빠뜨리면
     설계사가 그 담보를 설명할 자리가 없어진다. */
  const keyMiss = KEY.filter(k => !VOCAB.has(k));
  is(keyMiss.length === 0, 'INS_KEY 열넷을 하나도 빠뜨리지 않았다' + (keyMiss.length ? ' — 빠짐: ' + keyMiss.join(' / ') : ''));

  /* 말모이에만 있고 아무 질병에서도 안 쓰이는 담보는 설명만 있고 갈 곳이 없다 */
  const usedK = new Set();
  (D.list || []).forEach(d => (d.path || []).forEach(s => (s.pay || []).forEach(p => usedK.add(p.k))));
  const idle = [...VOCAB.keys()].filter(k => !usedK.has(k));
  is(idle.length === 0, '말모이의 담보가 전부 어느 질병 어느 단계엔가 붙어 있다' + (idle.length ? ' — 갈 곳 없음: ' + idle.join(' / ') : ''));

  /* ═══ 3. 질병코드 ═══ */
  console.log('\n[3] 질병코드가 앱이 아는 코드인가');
  const kcdBlk = app.slice(app.indexOf('var KCD_DATA'), app.indexOf('function kcdSearch'));
  const CODES = new Set([...kcdBlk.matchAll(/\['([A-Z][0-9]{2})','/g)].map(m => m[1]));
  const badCode = [];
  (D.list || []).forEach(d => (d.codes || []).forEach(c => { if (!CODES.has(c[0])) badCode.push(d.id + ':' + c[0]); }));
  is(CODES.size > 50, 'KCD 표를 찾았다 — 코드 ' + CODES.size + '개');
  is(badCode.length === 0, '적어 둔 코드가 전부 그 표에 있다' + (badCode.length ? ' — 없는 코드: ' + badCode.join(' / ') : ''));

  /* ═══ 4. 빠진 칸 ═══ */
  console.log('\n[4] 다섯 토막이 다 있는가 — 하나라도 비면 상담이 끊긴다');
  const holes = [];
  (D.list || []).forEach(d => {
    if (!d.one || !(d.what || []).length) holes.push(d.id + ' 어떤 병인가');
    if (!d.cause || !(d.cause.why || []).length || !(d.cause.risk || []).length || !d.cause.say) holes.push(d.id + ' 원인');
    if (!(d.path || []).length) holes.push(d.id + ' 치료과정');
    (d.path || []).forEach(s => {
      if (!s.k || !s.dur || !s.desc) holes.push(d.id + ' 단계 빈칸');
      if (!('pay' in s)) holes.push(d.id + ' 단계에 담보 칸이 없음');
      if (!s.watch) holes.push(d.id + ' · ' + s.k + ' 갈리는 자리');
    });
    if (!(d.trap || []).length) holes.push(d.id + ' 막히는 자리');
    if (!d.talk || !d.talk.open || !(d.talk.spin || []).length || !(d.talk.obj || []).length) holes.push(d.id + ' 화법');
    if (!('src' in d)) holes.push(d.id + ' 근거 칸');
  });
  is(holes.length === 0, '빈칸 없음' + (holes.length ? ' — ' + holes.slice(0, 6).join(' / ') : ''));
  is(!!(D.disc && D.disc.med && D.disc.pay && D.disc.num), '치료·지급·숫자에 대한 꼬리표가 한 곳에 있다');

  /* ═══ 5. 단정하지 않는가 ═══ */
  console.log('\n[5] 단정하지 않는가 — 지급은 약관과 심사가 정한다');
  const SAY_NO = [
    [/반드시\s*지급/, '「반드시 지급」'],
    [/무조건\s*(지급|나옵|받)/, '「무조건 지급/나옵니다」'],
    [/전액\s*보장(됩니다|합니다)/, '「전액 보장됩니다」'],
    [/비과세\s*(상품)?입니다/, '「비과세입니다」 — 결론을 말하면 무너진다'],
    [/100%\s*(지급|보장)/, '「100% 지급」']
  ];
  /* 화면에 나가는 글만 본다 — 주석에 적힌 「이렇게 쓰지 않는다」 는 규칙이지 문구가 아니다 */
  const body = raw.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const said = SAY_NO.filter(([re]) => re.test(body)).map(([, t]) => t);
  is(said.length === 0, '단정하는 말이 없다' + (said.length ? ' — ' + said.join(' / ') : ''));
  is(/심사\s*결과에\s*따릅니다/.test(body), '「심사 결과에 따릅니다」 를 빼지 않았다');
  is(/약관/.test(body), '약관이 우선임을 적어 두었다');

  /* ═══ 6. 실명 ═══ */
  console.log('\n[6] 견본에 실제 고객 이름이 없는가');
  is(!/김[가-힣]{2}\s*(님|고객)/.test(body) && !/이[가-힣]{2}\s*고객님/.test(body),
     '실제 사람 이름처럼 보이는 견본이 없다');

  /* ═══ 7~10. 화면 ═══ */
  const browser = await chromium.launch();

  console.log('\n[7] 화면이 실제로 서는가');
  let page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('' + e));
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });

  const cards = await page.locator('.dcard').count();
  is(cards === D.list.length, '질병 ' + D.list.length + '종이 모두 카드로 선다 (' + cards + '개)');
  is(errs.length === 0, '콘솔이 조용하다' + (errs.length ? ' — ' + errs[0] : ''));

  /* 질병 하나를 열어 본다 */
  await page.locator('.dcard').first().click();
  await page.waitForTimeout(200);
  const txt = await page.locator('#detailPane').innerText();
  const need = ['어떤 병입니까', '왜 생깁니까', '어떻게 치료하고', '자주 막힙니다', '어떻게 말합니까', '근거'];
  const miss = need.filter(t => txt.indexOf(t) < 0);
  is(miss.length === 0, '한 질병을 열면 여섯 토막이 다 나온다' + (miss.length ? ' — 빠짐: ' + miss.join(' ') : ''));
  is(/여기서 갈립니다/.test(txt), '단계마다 「여기서 갈립니다」 가 붙는다');
  is(/심사 결과에 따릅니다/.test(txt), '화면 아래에 지급 꼬리표가 붙는다');

  console.log('\n[8] 담보를 누르면 그 담보가 어디에서 일하는지 나오는가');
  const payCount = await page.locator('.stage .pay').count();
  is(payCount > 0, '단계마다 담보 알약이 붙어 있다 (' + payCount + '개)');
  await page.locator('.stage .pay').first().click();
  await page.waitForTimeout(180);
  const back = await page.locator('#detailPane').innerText();
  is(/는 어디에서 일합니까/.test(back), '담보 되짚기 화면이 열린다');
  is(/이 질병 열기/.test(back), '되짚기에서 다시 질병으로 들어갈 수 있다');

  console.log('\n[9] 담보 말모이가 화면에 서는가 — 「이 돈이 무슨 돈인지」');
  await page.locator('button.btn', { hasText: '담보 말모이' }).click();
  await page.waitForTimeout(200);
  const dic = await page.locator('#detailPane').innerText();
  is(/담보 말모이 — 이 돈이 무슨 돈입니까/.test(dic), '말모이 화면이 열린다');
  const shown = (D.cov || []).filter(c => dic.indexOf(c.k) >= 0).length;
  is(shown === (D.cov || []).length, '말모이 ' + (D.cov || []).length + '개가 모두 적힌다 (' + shown + '개)');
  is(/여기에서 일합니다/.test(dic), '담보마다 어느 질병에서 일하는지 적힌다');

  console.log('\n[10] 전부 펼쳐 인쇄 — 한 권으로 묶이는가');
  await page.evaluate(() => { window.print = function(){ window.__printed = 1; }; });
  await page.locator('button.btn', { hasText: '전부 펼쳐 인쇄' }).click();
  await page.waitForTimeout(700);
  const bookTxt = await page.locator('#detailPane').innerText();
  const bookMiss = D.list.filter(d => bookTxt.indexOf(d.name) < 0).map(d => d.name);
  is(bookMiss.length === 0, '질병 ' + D.list.length + '종이 한 번에 다 펼쳐진다' + (bookMiss.length ? ' — 빠짐: ' + bookMiss.join(' / ') : ''));
  is(await page.evaluate(() => window.__printed === 1), '펼친 뒤 인쇄창이 뜬다');

  console.log('\n[11] 좁은 화면 · 인쇄');
  await page.setViewportSize({ width: 390, height: 780 });
  await page.waitForTimeout(150);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  is(over <= 2, '390px 에서 옆으로 안 밀린다 (' + over + 'px)');
  is(/page-break-inside\s*:\s*avoid/.test(html), '인쇄에서 토막이 잘리지 않게 해 두었다');
  is(/@media\s+print/.test(html), '인쇄용 규칙이 있다');
  await page.close();

  /* ═══ 9. 일부러 끊어 본다 ═══ */
  console.log('\n[12] 자료를 못 읽으면 화면을 안 세우는가 — 일부러 끊어 본다');
  CUT = true;
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  const cut = await page.locator('body').innerText();
  is(/아무 자료도 만들지 않습니다/.test(cut), '자료가 없으면 「아무 자료도 만들지 않습니다」 라고 적는다');
  is((await page.locator('.dcard').count()) === 0, '없는 질병을 지어내 세우지 않는다');
  await page.close();
  CUT = false;

  await browser.close();
  srv.close();

  console.log('\n──────────────────────────────');
  if (fail) { console.log('질병 가이드 점검 실패 — ' + fail + '곳'); process.exit(1); }
  console.log('질병 가이드 점검 통과 — ' + pass + '곳 모두 맞습니다.');
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
