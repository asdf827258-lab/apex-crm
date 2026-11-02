/* ══════════════════════════════════════════════════════════════════
   check-kjcare.js — <b>「보험의 기준 · 진단·치료 지도」 가 지어내지 않고 서나</b> (판 X300)

   사장님 말씀 2026-11-02 「세부적으로 말해줘 대표적 진단과 치료방법 급여 비급여 치료든」

   app/kijun-care.js(글 한 벌) · app/kijun-care.html(그리기). 병마다 진단 · 치료(급여/비급여/조건부)
   · 받치는 담보 · 꼭 볼 것. 고객이 「이건 나온다」 로 읽는 자리라 금액 · 비율 · 약속이 하나만
   섞여도 그대로 믿습니다(1번 · 2번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ 갈래 일곱 · 병 30가지 이상 · 병마다 진단 · 치료(하나 이상, 표지는 g/b/c) · 담보 · 꼭 볼 것 · id 안 겹침
     [2] ★★ 금액 0 · 본인부담 비율(%) 0 · 약속 말 0 · 세금 말 0 (1번 · 2번)
     [3] ★★ 받치는 담보가 모두 담보 사전(kijun-dict.js)에 있는 담보다 — 지어 낸 담보 0 (5번)
     [4] ★ 헷갈리는 자리를 바로 말한다 — TIA(G45)는 뇌혈관 담보로 안 받친다 · 협심증은 허혈성(heart)이지
         급성심근경색(heart-a)이 아니다 · 갑상선암은 유사암 · 대장 선종은 암이 아니다 · 로봇 수술은 비급여
     [5] 맨 위에 「대표적인 경우 · 심평원·병원에서 확인 · 약관과 심사」 를 밝힌다 · 찾기 · 갈래 · 비급여 고르기 · #id
     [6] 담보 사전 · 설계 가이드 · 설계서 · 앱(kjOpenCare)에서 닿는다 · 담보 칩이 사전에 닿는다
     [7] 요청 0(7번) · 폰 390px · 인쇄 tnum 꺼짐(4-1) · 오류 0
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9281;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8');
const box = { window: {} };
vm.runInNewContext(rd('kijun-dict.js'), box); vm.runInNewContext(rd('kijun-care.js'), box);
const C = box.window.KJ_CARE || [], DICT = {};
(box.window.KJ_DICT || []).forEach(g => g.d.forEach(x => { DICT[x.id] = x; }));
const all = []; C.forEach(g => g.d.forEach(x => all.push(Object.assign({ g: g.g }, x))));
const byId = {}; all.forEach(x => { byId[x.id] = x; });
const text = x => [x.n, x.code, x.dx, x.tip].concat((x.tx || []).map(t => t[0])).join(' ');
const flag = (id, re) => { const x = byId[id]; const t = x && x.tx.find(t => re.test(t[0])); return t ? t[1] : null; };

console.log('\n[1] 빠짐없이');
is(C.length === 7, '  갈래 ' + C.length + ' — 암 · 뇌혈관 · 심장 · 근골격 · 흔한 수술 · 노년 · 감염/아이');
is(all.length >= 30, '  병 ' + all.length + '가지');
is(Object.keys(byId).length === all.length, '  id 가 겹치지 않는다');
is(all.every(x => String(x.dx || '').trim().length >= 8 && String(x.tip || '').trim().length >= 8), '  병마다 「어떻게 진단」 · 「꼭 볼 것」 이 찼다');
is(all.every(x => Array.isArray(x.tx) && x.tx.length >= 1 && x.tx.every(t => t[0] && ['g', 'b', 'c'].indexOf(t[1]) >= 0)), '  치료마다 급여 · 비급여 · 조건부 표지가 있다');
const fl = { g: 0, b: 0, c: 0 }; all.forEach(x => x.tx.forEach(t => fl[t[1]]++));
is(fl.g > 0 && fl.b > 0 && fl.c > 0, '  세 표지가 다 쓰인다 — 급여 ' + fl.g + ' · 비급여 ' + fl.b + ' · 조건부 ' + fl.c);

console.log('\n[2] 금액 · 비율 · 약속 · 세금 0 (1번 · 2번)');
const money = all.filter(x => /\d[\d,]*\s*(만\s*원|만원|원\b|억|천만|백만)/.test(text(x)));
is(money.length === 0, '  금액을 적지 않는다' + (money.length ? ' ← ' + money.map(x => x.id).join(', ') : ''));
const rate = all.filter(x => /\d\s*%|퍼센트|할\s*\d/.test(text(x)));
is(rate.length === 0, '  본인부담 비율을 적지 않는다' + (rate.length ? ' ← ' + rate.map(x => x.id).join(', ') : ''));
const promise = all.filter(x => /보장됩니다|지급됩니다|나옵니다|나와요|받으실 수 있|무조건|100%|확정적|많이 나오/.test(text(x)));
is(promise.length === 0, '  약속 말이 없다' + (promise.length ? ' ← ' + promise.map(x => x.id).join(', ') : ''));
const tax = all.filter(x => /비과세|세액공제|과세|소득공제|절세/.test(text(x)));
is(tax.length === 0, '  세금 말이 없다' + (tax.length ? ' ← ' + tax.map(x => x.id).join(', ') : ''));

console.log('\n[3] 받치는 담보 = 담보 사전의 담보 (5번)');
const ghost = []; all.forEach(x => (x.cov || []).forEach(id => { if (!DICT[id]) ghost.push(x.id + ':' + id); }));
is(all.every(x => (x.cov || []).length >= 1) && ghost.length === 0, '  지어 낸 담보 0' + (ghost.length ? ' ← ' + ghost.join(', ') : ''));

console.log('\n[4] 헷갈리는 자리를 바로 말한다');
const brainCov = ['brain-h', 'brain-s', 'brain', 'cv-tx'];
is(byId.tia && byId.tia.code === 'G45' && !byId.tia.cov.some(id => brainCov.indexOf(id) >= 0) && /G/.test(byId.tia.tip), '  TIA(G45) — 뇌혈관 담보로 안 받친다, 까닭(G 코드)을 말한다');
is(byId.angina && byId.angina.cov.indexOf('heart') >= 0 && byId.angina.cov.indexOf('heart-a') < 0, '  협심증 — 허혈성(heart) 으로 받치고 급성심근경색(heart-a) 은 아니다');
is(byId.ami && byId.ami.cov.indexOf('heart-a') >= 0 && byId.ami.code === 'I21–I23' && DICT['heart-a'].a.indexOf('I21–I23') >= 0, '  급성심근경색 — I21–I23 (사전과 같은 범위)');
is(byId.infarct && byId.infarct.cov.indexOf('brain-h') < 0 && byId.infarct.cov.indexOf('brain-s') >= 0, '  뇌경색 — 뇌출혈 담보가 아니라 뇌졸중 이상');
is(byId.thyroid && byId.thyroid.cov.indexOf('similar') >= 0 && byId.thyroid.cov.indexOf('cancer') < 0, '  갑상선암 — 유사암 줄');
is(byId.polyp && byId.polyp.cov.indexOf('cancer') < 0 && byId.polyp.cov.indexOf('similar') < 0, '  대장 선종 — 암 담보로 받치지 않는다');
is(['stomach', 'thyroid', 'prostate'].every(id => flag(id, /로봇/) === 'b'), '  로봇 수술 — 비급여로 적는다');
is(flag('disc', /도수/) === 'b' && flag('disc', /MRI/) === 'c', '  디스크 — 도수치료는 비급여, MRI 는 조건부(목적에 따라)');
is(flag('cataract', /다초점/) === 'b', '  백내장 — 다초점 렌즈는 비급여');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, s) => {
  const p = decodeURIComponent(url.parse(q.url).pathname), f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end('no'); return; }
  s.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); fs.createReadStream(f).pipe(s);
});
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [], sent = [];
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (/fetch|xhr|websocket|ping/.test(r.resourceType())) sent.push(r.url()); });
  const O = 'http://127.0.0.1:' + PORT + '/app/';
  await p.goto(O + 'kijun-care.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[5] 맨 위 밝힘 · 찾기 · 고르기');
  const warn = await p.textContent('[data-warn]');
  is(/대표적인 경우/.test(warn) && /심평원/.test(warn) && /약관과 보험사 심사/.test(warn) && /금액/.test(warn), '  맨 위 — 「대표적인 경우 · 심평원·병원에서 확인 · 금액 안 적음 · 약관과 심사」');
  is(await p.locator('[data-how] .f').count() === 3, '  급여 · 비급여 · 조건부가 무슨 뜻인지 먼저 말한다');
  is(await p.locator('.card').count() === all.length, '  카드 ' + all.length + '장이 다 선다');
  await p.fill('[data-q]', '스텐트');
  const hit = await p.$$eval('.card', a => a.map(e => e.dataset.id));
  is(hit.indexOf('angina') >= 0 && hit.indexOf('ami') >= 0 && hit.length < all.length, '  「스텐트」 로 찾으면 협심증 · 심근경색이 선다 (' + hit.join(',') + ')');
  await p.fill('[data-q]', '없는낱말쿼크');
  is(await p.locator('.card').count() === 0 && await p.isVisible('[data-none]'), '  없으면 「없어요」 — 지어 세우지 않는다');
  await p.fill('[data-q]', '');
  await p.click('[data-chips] button[data-g="brain"]');
  is(await p.locator('.card').count() === C.find(g => g.g === 'brain').d.length, '  「뇌혈관」 갈래만 고르면 그 병만');
  await p.click('[data-chips] button[data-g=""]');
  await p.click('[data-chips] button[data-fl="b"]');
  const withB = all.filter(x => x.tx.some(t => t[1] === 'b')).length;
  is(await p.locator('.card').count() === withB && withB < all.length, '  「비급여가 있는 병」 — ' + withB + '가지만 선다');
  await p.click('[data-chips] button[data-fl="b"]');
  is(await p.locator('.card').count() === all.length, '  한 번 더 누르면 풀린다');
  const covLinks = await p.$$eval('.card .cov a', a => a.map(e => e.getAttribute('href')));
  is(covLinks.length > 0 && covLinks.every(h => /^kijun-dict\.html#[a-z-]+$/.test(h)), '  담보 칩 ' + covLinks.length + '개가 모두 사전으로 간다');
  await p.goto(O + 'kijun-care.html#tia', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  is(await p.getAttribute('.card.hit', 'data-id') === 'tia', '  #tia 로 들어오면 그 카드에 선다');

  console.log('\n[6] 어디서든 닿는다');
  const IDX = rd('index.html');
  is(['kijun-dict.html', 'kijun-guide.html', 'kijun-sheet.html'].every(f => rd(f).indexOf('href="kijun-care.html"') >= 0), '  담보 사전 · 설계 가이드 · 설계서에서 닿는다');
  is(/function kjOpenCare\(\)/.test(IDX) && /onclick="kjOpenCare\(\)"/.test(IDX) && /KJ_CARE_URL='kijun-care\.html'/.test(IDX), '  앱의 「보험의 기준」 화면에서 닿는다 (kjOpenCare)');

  console.log('\n[7] 폰 · 인쇄 · 요청');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-care.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다');
  await m.close();
  await p.emulateMedia({ media: 'print' });
  const tn = await p.$eval('.card dd', e => getComputedStyle(e).fontVariantNumeric + '|' + getComputedStyle(e).fontFeatureSettings);
  is(!/tabular|tnum/.test(tn), '  인쇄에서 tnum 이 꺼져 있다');
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 진단·치료 지도 — ' + all.length + '가지, 금액·비율·약속 없이, 사전의 담보로만.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
