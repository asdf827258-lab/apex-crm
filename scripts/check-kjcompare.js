/* ══════════════════════════════════════════════════════════════════
   check-kjcompare.js — <b>「보험의 기준」 글씨가 크고, 뽑아서 견줘 볼 수 있나</b> (판 X323)

   사장님 말씀 2026-11-04 「글이 너무 작은데, 조금 더 쉽게 내가 뽑아서 이해하고 대조할수 있도록 만들고」

   app/kijun-font.js(글씨 크기 한 벌) · app/kijun-compare.html(담보 대조표).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ 글씨 단추 한 벌 — 사전 · 지도 · 실비 · 가이드 · 대조표 · 설계서가 같은 kijun-font.js 를 부른다(5번) ·
         처음엔 「크게」 · 한 장에 맞춰야 하는 설계서는 인쇄에서 안 키운다
     [2] ★★ 대조표 — 고른 갈래의 담보가 빠짐없이 한 줄씩 · 「꼭 볼 것」 은 사전의 글을 그대로 나눈 것(지어 적지 않음 · 1번) ·
         갈래를 끄면 그 표가 빠진다 · 「요즘 나온 담보만」 은 🆕 표지 담보만
     [3] ★★ 고객 이름 칸이 없다 · 적은 값은 기억하지 않는다 — 다시 열면 비어 있다(3번)
     [4] ★ 인쇄 — A4 세로 · 표 머리가 쪽마다 · 고르는 칸은 안 나옴 · 글씨가 크다(크게 = 화면과 같은 배율) · tnum 꺼짐(4-1)
     [5] 글씨 단추를 누르면 바뀌고 다른 화면도 따라간다 · 폰 390px 에서 세 크기 모두 옆으로 안 샌다
     [6] 앱 · 사전 · 지도 · 실비 · 가이드 · 설계서에서 닿는다 · 요청 0(7번) · 오류 0
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9303;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8');
const box = { window: {} }; vm.runInNewContext(rd('kijun-dict.js'), box);
const D = box.window.KJ_DICT || [], byId = {}; D.forEach(g => g.d.forEach(x => { byId[x.id] = x; }));
const PAGES = ['kijun-dict.html', 'kijun-care.html', 'kijun-silson.html', 'kijun-guide.html', 'kijun-compare.html', 'kijun-sheet.html'];
const DEF = ['silson', 'cancer', 'cv', 'surg', 'care', 'life', 'death'];
const squash = t => String(t || '').replace(/\s+/g, '');

console.log('\n[1] 글씨 단추 한 벌 (5번)');
is(PAGES.every(f => /<script src="kijun-font\.js"><\/script>/.test(rd(f))), '  여섯 화면이 kijun-font.js 를 부른다');
const FJ = rd('kijun-font.js');
is(/DEF = 'l'/.test(FJ) && /'보통'/.test(FJ) && /'크게'/.test(FJ) && /'아주 크게'/.test(FJ), '  보통 · 크게 · 아주 크게 — 처음엔 「크게」');
is(/data-kjf-print="off"/.test(rd('kijun-sheet.html')) && !/data-kjf-print="off"/.test(rd('kijun-compare.html')), '  한 장 설계서는 인쇄에서 안 키운다 · 대조표는 키운다');

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
  await p.goto(O + 'kijun-compare.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[2] 담보 대조표');
  const want = DEF.reduce((n, g) => n + (D.find(x => x.g === g) || { d: [] }).d.length, 0);
  const rows = await p.$$eval('[data-row]', a => a.map(e => [e.getAttribute('data-row'), [].map.call(e.querySelectorAll('li'), l => l.textContent)]));
  is(rows.length === want && DEF.every(g => (D.find(x => x.g === g) || { d: [] }).d.every(x => rows.some(r => r[0] === x.id))), '  고른 갈래 일곱 — 담보 ' + rows.length + '줄이 빠짐없이');
  const made = rows.filter(([id, li]) => !li.length || li.some(t => squash(byId[id].c).indexOf(squash(t)) < 0));
  is(made.length === 0, '  「꼭 볼 것」 □ 는 모두 사전의 글에서 나눈 것 — 지어 적지 않는다' + (made.length ? ' ← ' + made.map(r => r[0]).slice(0, 3).join(', ') : ''));
  is(await p.locator('[data-row] [data-h="① 지금 보험"] input').count() === rows.length * 3 && await p.locator('[data-row] [data-h="② 새 제안"] input').count() === rows.length * 3, '  줄마다 ① 지금 보험 · ② 새 제안 — 가입 금액 · 기간 · 갱신형');
  await p.uncheck('[data-pick] input[data-g="death"]');
  is(await p.locator('[data-tbl="death"]').count() === 0, '  「사망」 을 끄면 그 표가 빠진다');
  await p.check('[data-pick] input[data-new]');
  const nw = Object.values(byId).filter(x => x.nw).length;
  is(await p.locator('[data-row]').count() === nw && await p.locator('[data-tbl="new"]').count() === 1, '  「요즘 나온 담보만」 — 🆕 담보 ' + nw + '줄 한 장으로');
  await p.uncheck('[data-pick] input[data-new]'); await p.check('[data-pick] input[data-g="death"]');

  console.log('\n[3] 이름 칸 없음 · 기억하지 않음 (3번)');
  const nameField = await p.$$eval('input,textarea', a => a.filter(e => /이름|성명|고객/.test((e.placeholder || '') + (e.getAttribute('aria-label') || '') + ((e.closest('label') || {}).textContent || ''))).length);
  is(nameField === 0, '  고객 이름을 적는 칸이 없다');
  await p.fill('[data-row="cancer"] [data-h="① 지금 보험"] input >> nth=0', '견본값');
  await p.fill('[data-meta="a"]', '견본 상품');
  const keys = await p.evaluate(() => { const k = []; try { for (let i = 0; i < localStorage.length; i++) k.push(localStorage.key(i)); } catch (e) {} return k; });
  is(keys.every(k => k === 'kjFont'), '  적은 값을 기억하지 않는다 — 남는 것은 글씨 크기뿐 (' + (keys.join(',') || '없음') + ')');
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200);
  is(await p.inputValue('[data-row="cancer"] [data-h="① 지금 보험"] input >> nth=0') === '' && await p.inputValue('[data-meta="a"]') === '', '  다시 열면 비어 있다');

  console.log('\n[4] 인쇄 (4-1)');
  await p.emulateMedia({ media: 'print' });
  const pr = await p.evaluate(() => {
    const n = document.querySelector('.cmp td.n b'), li = document.querySelector('.cmp li'), cs = e => getComputedStyle(e);
    return { z: parseFloat(cs(document.body).zoom || '1'), fb: parseFloat(cs(n).fontSize), fl: parseFloat(cs(li).fontSize), th: cs(document.querySelector('.cmp thead')).display,
      pick: cs(document.querySelector('.pick-box')).display, tn: cs(document.querySelector('.cmp td')).fontVariantNumeric + '|' + cs(document.querySelector('.cmp td')).fontFeatureSettings };
  });
  is(pr.z >= 1.14 && pr.fb * pr.z >= 15 && pr.fl * pr.z >= 13.5, '  글씨가 크다 — 담보 이름 ' + (pr.fb * pr.z).toFixed(1) + 'px · 꼭 볼 것 ' + (pr.fl * pr.z).toFixed(1) + 'px (배율 ' + pr.z + ')');
  is(pr.th === 'table-header-group' && pr.pick === 'none', '  표 머리가 쪽마다 · 고르는 칸은 안 나온다');
  is(!/tabular|tnum/.test(pr.tn), '  인쇄에서 tnum 이 꺼져 있다');
  const pdf = await p.pdf({ format: 'A4' });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  is(pages >= 3 && pages <= 12, '  A4 ' + pages + '쪽 — 일곱 갈래가 넘치지도 모자라지도 않게');
  await p.emulateMedia({ media: 'screen' });
  const s2 = await ctx.newPage(); await s2.goto(O + 'kijun-sheet.html', { waitUntil: 'domcontentloaded' }); await s2.waitForTimeout(200);
  await s2.emulateMedia({ media: 'print' });
  is(await s2.evaluate(() => parseFloat(getComputedStyle(document.body).zoom || '1')) === 1, '  한 장 설계서는 인쇄 배율 1 — 한 장을 지킨다');
  await s2.close();

  console.log('\n[5] 글씨 단추 · 폰');
  await p.click('[data-kjf-box] button[data-kjf-k="x"]');
  is(await p.getAttribute('html', 'data-kjf') === 'x' && await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--kjz').trim()) === '1.3', '  「아주 크게」 를 누르면 배율 1.3');
  const q = await ctx.newPage(); await q.goto(O + 'kijun-care.html', { waitUntil: 'domcontentloaded' }); await q.waitForTimeout(200);
  is(await q.getAttribute('html', 'data-kjf') === 'x' && await q.locator('[data-kjf-box] button.on[data-kjf-k="x"]').count() === 1, '  다른 화면(진단·치료 지도)도 따라간다');
  await q.close();
  await p.click('[data-kjf-box] button[data-kjf-k="l"]');
  const over = [];
  for (const z of ['m', 'l', 'x']) {
    const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
    await m.addInitScript(v => { try { localStorage.setItem('kjFont', v); } catch (e) {} }, z);
    for (const f of PAGES) { await m.goto(O + f, { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(120); const w = await m.evaluate(() => document.documentElement.scrollWidth); if (w > 390) over.push(z + ':' + f + ':' + w); }
    await m.close();
  }
  is(over.length === 0, '  폰 390px — 세 크기 × 여섯 화면이 옆으로 안 샌다' + (over.length ? ' ← ' + over.join(', ') : ''));

  console.log('\n[6] 닿는 길 · 요청');
  const IDX = rd('index.html');
  is(/function kjOpenCompare\(\)/.test(IDX) && /onclick="kjOpenCompare\(\)"/.test(IDX), '  앱의 「보험의 기준」 화면에서 닿는다 (kjOpenCompare)');
  is(['kijun-dict.html', 'kijun-care.html', 'kijun-silson.html', 'kijun-guide.html', 'kijun-sheet.html'].every(f => rd(f).indexOf('href="kijun-compare.html"') >= 0), '  사전 · 지도 · 실비 · 가이드 · 설계서에서 닿는다');
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 대조표 — 크게 뽑고, 사전의 글 그대로, 이름 없이, 기억하지 않고.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
