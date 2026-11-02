/* ══════════════════════════════════════════════════════════════════
   check-kjdict.js — <b>「보험의 기준 · 담보 사전」 이 지어내지 않고 빠짐없이 서나</b> (판 X299)

   사장님 말씀 2026-11-02 「현존하는 모든 보험 담보에 대한 이해를 적어줘」

   app/kijun-dict.js(글 한 벌) · app/kijun-dict.html(그리기). 고객이 읽는 사전이라
   금액·약속·세금 말이 하나만 섞여도 고객은 그대로 믿습니다(1번 · 2번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ 갈래 열셋 · 담보 60가지 이상 · 담보마다 네 자리(이런 거예요 · 왜 · 이렇게 나와요 · 꼭 볼 것)
         · 나오는 길(정해진 금액 · 쓴 만큼 · 날 수만큼 · 비율만큼 · 보험료 면제)이 다 있다 · id 가 안 겹친다
     [2] ★★ 금액을 적지 않는다(「○만 원」 「○억」 0) · 약속 말 0 · 세금 말 0 (1번 · 2번)
     [3] ★★ 같은 범위를 말한다 — 뇌·심장·유사암 코드가 한 장 설계서와 같다 (5번)
     [4] ★ 실손형은 「쓴 만큼」, 진단비는 「정해진 금액」, 일당은 「날 수만큼」, 장해는 「비율만큼」
     [5] 찾기 · 갈래 고르기 · #id 로 들어오면 그 담보에 선다 · 설계서의 「자세히」 아홉이 다 닿는다
     [6] 요청 0(7번) · 폰 390px · 인쇄 tnum 꺼짐(4-1) · 오류 0
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9261;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app', 'kijun-dict.js'), 'utf8');
const SHEET = fs.readFileSync(path.join(ROOT, 'app', 'kijun-sheet.html'), 'utf8');
const box = { window: {} }; vm.runInNewContext(SRC, box);
const D = box.window.KJ_DICT || [];
const all = []; D.forEach(g => g.d.forEach(x => all.push(Object.assign({ g: g.g }, x))));
const byId = {}; all.forEach(x => { byId[x.id] = x; });
const text = x => [x.n, x.a, x.w, x.y, x.h, x.c].join(' ');

console.log('\n[1] 빠짐없이 · 네 자리');
is(D.length === 13, '  갈래 ' + D.length + ' — 실손 · 암 · 뇌심장 · 진단비 · 수술 · 일당 · 간병 · 장해 · 사망 · 운전자 · 배상재산 · 치아 · 어린이');
is(all.length >= 60, '  담보 ' + all.length + '가지');
is(Object.keys(byId).length === all.length, '  id 가 겹치지 않는다');
is(all.every(x => ['w', 'y', 'h', 'c'].every(f => String(x[f] || '').trim().length >= 8)), '  담보마다 네 자리가 다 찼다');
is(all.every(x => ['fx', 'rl', 'day', 'rate', 'wv'].indexOf(x.k) >= 0), '  나오는 길이 다섯 가지 안에 있다');

console.log('\n[2] 금액 · 약속 · 세금 0 (1번 · 2번)');
const money = all.filter(x => /\d[\d,]*\s*(만\s*원|만원|억|천만|백만)/.test(text(x)));
is(money.length === 0, '  금액을 적지 않는다' + (money.length ? ' ← ' + money.map(x => x.id).join(', ') : ''));
const promise = all.filter(x => /보장됩니다|지급됩니다|나옵니다|받으실 수 있|무조건|100%|확정적/.test(text(x)));
is(promise.length === 0, '  약속 말이 없다' + (promise.length ? ' ← ' + promise.map(x => x.id).join(', ') : ''));
const tax = all.filter(x => /비과세|세액공제|과세|소득공제|절세/.test(text(x)));
is(tax.length === 0, '  세금 말이 없다' + (tax.length ? ' ← ' + tax.map(x => x.id).join(', ') : ''));

console.log('\n[3] 한 장 설계서와 같은 범위 (5번)');
const same = [['brain-h', 'I60–I62'], ['brain-s', 'I60–I63 등'], ['brain', 'I60–I69'], ['heart-a', 'I21–I23'], ['heart', 'I20–I25']];
for (const [id, code] of same) is(byId[id] && byId[id].a.indexOf(code) >= 0 && SHEET.indexOf(code) >= 0, '  ' + (byId[id] ? byId[id].n : id) + ' — ' + code + ' (사전 · 설계서 둘 다)');
is(['C73', 'D00–D09', 'D37–D48'].every(c => byId.similar && byId.similar.a.indexOf(c) >= 0), '  유사암 — C73 · D00–D09 · D37–D48');

console.log('\n[4] 나오는 길이 담보의 성격과 맞다');
is(['silson', 'silson-np', 'liab', 'car-settle', 'car-fine', 'car-lawyer', 'fire-liab'].every(id => byId[id] && byId[id].k === 'rl'), '  실손 · 배상 · 운전자 비용은 「쓴 만큼」');
is(['cancer', 'similar', 'brain', 'heart', 'surg', 'death'].every(id => byId[id] && byId[id].k === 'fx'), '  진단비 · 수술비 · 사망은 「정해진 금액」');
is(['hosp', 'icu', 'care', 'clinic'].every(id => byId[id] && byId[id].k === 'day'), '  입원 · 통원 · 간병인 일당은 「날 수만큼」');
is(['disab-a', 'disab-d'].every(id => byId[id] && byId[id].k === 'rate'), '  후유장해는 「비율만큼」');

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
  await p.goto(O + 'kijun-dict.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[5] 찾기 · 고르기 · 바로 가기');
  is(await p.locator('.card').count() === all.length, '  카드 ' + all.length + '장이 다 선다');
  await p.fill('[data-q]', '뇌경색');
  const hit = await p.$$eval('.card', a => a.map(e => e.dataset.id));
  is(hit.indexOf('brain-h') >= 0 && hit.indexOf('brain-s') >= 0 && hit.length < all.length, '  「뇌경색」 으로 찾으면 뇌출혈·뇌졸중 카드가 선다 (' + hit.join(',') + ')');
  await p.fill('[data-q]', '없는낱말쿼크');
  is(await p.locator('.card').count() === 0 && await p.isVisible('[data-none]'), '  없으면 「없어요」 — 지어 세우지 않는다');
  await p.fill('[data-q]', '');
  await p.click('[data-chips] button[data-g="car"]');
  is(await p.$$eval('.card', a => a.every(e => /^car-/.test(e.dataset.id))) && await p.locator('.card').count() === 5, '  「운전자」 갈래만 고르면 다섯 장');
  await p.click('[data-chips] button[data-g=""]');
  await p.goto(O + 'kijun-dict.html#heart', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  is(await p.getAttribute('.card.hit', 'data-id') === 'heart', '  #heart 로 들어오면 허혈성 심장질환 카드에 선다');
  const links = (SHEET.match(/href="kijun-dict\.html#([a-z-]+)"/g) || []).map(s => s.replace(/.*#|"/g, ''));
  is(links.length === 9 && links.every(id => byId[id]), '  설계서의 「자세히」 아홉이 모두 사전의 담보에 닿는다');

  console.log('\n[6] 폰 · 인쇄 · 요청');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-dict.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다');
  await m.close();
  await p.emulateMedia({ media: 'print' });
  const tn = await p.$eval('.card dd', e => getComputedStyle(e).fontVariantNumeric + '|' + getComputedStyle(e).fontFeatureSettings);
  is(!/tabular|tnum/.test(tn), '  인쇄에서 tnum 이 꺼져 있다');
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 담보 사전 — ' + all.length + '가지, 금액·약속·세금 없이, 설계서와 같은 범위로.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
