/* ══════════════════════════════════════════════════════════════════
   check-kjpics.js — <b>「보험의 기준」 그림이 지어내지 않고, 한 벌로, 제대로 서나</b> (판 X318)

   사장님 말씀 2026-11-04 「이미지를 넣어서 조금 더 쉽게 할수 있는 방법이 있난」 → 「응 전부 되고
   치료과정에서 보상되는 담보 기준도 정리해주고」

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 몸 그림은 한 벌 — app/apex-body.js 에만 몸 윤곽이 있고, 보장 전·후(ba.html)와 진단·치료 지도가
         둘 다 그것을 부른다(5번). ba.html 에 몸 윤곽이 되살아나면 빨간불.
     [2] ★ 그림 한 벌(kijun-pics.js) — 나오는 길 다섯 그림이 다 서고 모르는 길엔 안 그린다 · 직접 그린 SVG 만
         (바깥 그림 · <img> 0 · 9번) · 그림에 금액 숫자 0 · 막대 밑에 「비율이 아니에요」(1번)
     [3] ★ 몸 지도 부위(KJ_BODY) — 열 곳 이상 · 병 id 가 모두 KJ_CARE 에 있다 · 점이 그림 안에 있다
     [4] ★★ 보상 기준(KJ_RULE) — 열 단계 · 단계마다 언제 · 무엇으로 · 흔히 안 되는 때 · 담보(사전 id) ·
         금액 · 비율 · 기간 · 일수 · 횟수 숫자 0 · 약속 말 0 · 세금 말 0 (1번 · 2번)
     [5] 진단·치료 지도 화면 — 몸 지도를 누르면 그 부위 병만 · 다시 누르면 풀린다 · 길 그림 동그라미 수 = 단계 수 ·
         동그라미를 누르면 그 단계가 선다 · 담보 칩마다 그 담보의 나오는 길 그림
     [6] 담보 사전 — 카드마다 나오는 길 그림이 그 담보의 길과 같다 · 실비 두 장에 「실비 이야기」 로 가는 길
     [7] 요청 0(7번) · 폰 390px · 오류 0 · 보장 전·후가 몸 그림을 그대로 그린다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9301;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8');
const box = { window: {} };
['kijun-dict.js', 'kijun-care.js', 'kijun-pics.js', 'apex-body.js'].forEach(f => vm.runInNewContext(rd(f), box));
const W = box.window, DICT = {}, CARE = {};
(W.KJ_DICT || []).forEach(g => g.d.forEach(x => { DICT[x.id] = x; }));
(W.KJ_CARE || []).forEach(g => g.d.forEach(x => { CARE[x.id] = x; }));
const BODY = W.KJ_BODY || [], RULE = W.KJ_RULE || [], PIC = W.KJ_PIC;

console.log('\n[1] 몸 그림은 한 벌 (5번)');
const SIL = 'M66 82 Q100 74 134 82';   /* 몸통 윤곽의 첫 마디 — 이 글자가 있는 곳이 몸을 그리는 곳 */
const holders = fs.readdirSync(path.join(ROOT, 'app')).filter(f => /\.(html|js)$/.test(f)).filter(f => rd(f).indexOf(SIL) >= 0);
/* ⚠ 아는 예외 하나 — index.html 의 babaBodySvg(비포&애프터 · 보장분석 갈래 baba*)는 장기 자리가 조금 다른 옛 판입니다.
     남의 갈래 함수라 이 판에서 바꾸지 않고, 따로 할 일로 넘겼습니다(CLAUDE.md 11번). 그 한 곳만 봐 주고, 더 늘면 빨간불. */
const IDX = rd('index.html'), idxN = IDX.split(SIL).length - 1, idxOk = idxN === 0 || (idxN === 1 && /function babaBodySvg\(\)\{[\s\S]{0,1500}M66 82 Q100 74 134 82/.test(IDX));
is(holders.filter(f => f !== 'index.html').join() === 'apex-body.js' && idxOk, '  몸 윤곽이 apex-body.js 한 곳에만 — 아는 예외 index.html babaBodySvg 하나 (' + holders.join(', ') + ')');
const BA = rd('ba.html'), CH = rd('kijun-care.html');
is(/<script src="apex-body\.js"><\/script>/.test(BA) && /function anatSvg\(C\)\{[\s\S]{0,900}window\.APXBody\.svg\(pins\)/.test(BA), '  보장 전·후(ba.html)가 apex-body.js 를 불러 그 몸에 점을 얹는다');
is(/<script src="apex-body\.js"><\/script>/.test(CH) && /window\.APXBody\.svg\(/.test(CH), '  진단·치료 지도도 같은 몸을 쓴다');
is(W.APXBody && /^<svg viewBox="0 0 200 470"/.test(W.APXBody.svg('')), '  몸 그림이 선다 (viewBox 0 0 200 470)');

console.log('\n[2] 그림 한 벌 · 직접 그린 SVG · 숫자 0 (1번 · 9번)');
const PS = rd('kijun-pics.js');
is(PIC && ['fx', 'rl', 'day', 'rate', 'wv'].every(k => new RegExp('^<svg[^>]*data-kjp="' + k + '"').test(PIC.kind(k))) && PIC.kind('zz') === '', '  나오는 길 다섯 그림이 다 서고, 모르는 길엔 그리지 않는다');
is(!/<img|https?:\/\/|url\(\s*['"]?http/.test(PS + rd('apex-body.js')), '  바깥 그림 · <img> 0 — 직접 그린 SVG 만');
const billTxt = PIC ? PIC.bill().replace(/<[^>]+>/g, ' ') : '';
is(PIC && /비율이 아니에요/.test(billTxt) && !/\d[\d,]*\s*(만\s*원|만원|원\b|억)|\d\s*%/.test(billTxt), '  병원비 한 막대 — 금액 · 비율 숫자 0, 「비율이 아니에요」 를 밝힌다');
is(/실비[^<]*한도/.test(billTxt) && /병원비와 따로/.test(billTxt) && /생활비/.test(billTxt), '  막대가 실비가 받치는 칸 · 병원비와 따로인 돈(진단비 · 생활비)을 함께 보여 준다');

console.log('\n[3] 몸 지도 부위');
is(BODY.length >= 10, '  부위 ' + BODY.length + '곳');
const ghost = []; BODY.forEach(b => b.ids.forEach(id => { if (!CARE[id]) ghost.push(b.p + ':' + id); }));
is(ghost.length === 0 && BODY.every(b => b.ids.length >= 1), '  부위의 병이 모두 KJ_CARE 에 있다' + (ghost.length ? ' ← ' + ghost.join(', ') : ''));
is(BODY.every(b => b.dot[0] > 0 && b.dot[0] < 200 && b.dot[1] > 0 && b.dot[1] < 470 && /^[LR]$/.test(b.side)), '  점이 몸 그림 안에 있고, 이름표가 왼쪽 · 오른쪽에 선다');
is(new Set(BODY.map(b => b.p)).size === BODY.length, '  부위 이름이 겹치지 않는다');

console.log('\n[4] 치료 과정 보상 기준 (1번 · 2번)');
is(RULE.length >= 10, '  단계 ' + RULE.length + '개');
is(RULE.every(r => ['when', 'need', 'miss'].every(f => String(r[f] || '').length >= 8) && ['fx', 'rl', 'day', 'rate', 'wv'].indexOf(r.pic) >= 0 && r.cov.length >= 1), '  단계마다 언제 · 무엇으로 · 흔히 안 되는 때 · 그림 · 담보');
const rg = []; RULE.forEach(r => r.cov.forEach(id => { if (!DICT[id]) rg.push(r.s + ':' + id); }));
is(rg.length === 0, '  담보가 모두 사전의 담보' + (rg.length ? ' ← ' + rg.join(', ') : ''));
const rt = r => [r.s, r.when, r.need, r.miss].join(' ');
const rnum = RULE.filter(r => /\d[\d,]*\s*(만\s*원|만원|원\b|억)|\d\s*%|\d+\s*(시간|일|회|번|년|개월|세)|\d+\s*(일|회|번|년|개월)\s*(이내|안|동안|까지|이상)/.test(rt(r)));
is(rnum.length === 0, '  금액 · 비율 · 기간 · 일수 · 횟수 숫자 0 — 상품마다 달라요' + (rnum.length ? ' ← ' + rnum.map(r => r.s).join(', ') : ''));
const rpro = RULE.filter(r => /보장됩니다|지급됩니다|나옵니다|나와요|무조건|반드시 받|비과세|절세|세액공제/.test(rt(r)));
is(rpro.length === 0, '  약속 말 · 세금 말 0' + (rpro.length ? ' ← ' + rpro.map(r => r.s).join(', ') : ''));
is(['진단', '입원', '수술', '항암', '통원', '비급여', '간병', '장해', '납입면제', '청구'].every(w => RULE.some(r => r.s.indexOf(w) >= 0)), '  진단 → 입원 → 수술 → 항암 → 통원 → 비급여 → 간병 → 장해 → 납입면제 → 청구까지 빠짐없이');

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
  p.on('pageerror', e => errs.push('care: ' + e.message)); p.on('request', r => { if (/fetch|xhr|websocket|ping/.test(r.resourceType())) sent.push(r.url()); });
  const O = 'http://127.0.0.1:' + PORT + '/app/';
  await p.goto(O + 'kijun-care.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[5] 진단·치료 지도 화면');
  is(await p.locator('[data-bodymap] button[data-bp]').count() === BODY.length && await p.locator('[data-bodymap] svg g[data-bp]').count() === BODY.length, '  몸 지도 — 이름표 ' + BODY.length + ' · 점 ' + BODY.length);
  const heart = BODY.find(x => x.p === 'heart');
  await p.click('[data-bodymap] button[data-bp="heart"]');
  const hc = await p.$$eval('.card', a => a.map(e => e.dataset.id));
  is(heart && hc.length === heart.ids.length && hc.every(id => heart.ids.indexOf(id) >= 0) && await p.isVisible('[data-bpick]'), '  「심장」 을 누르면 심장 병 ' + hc.length + '가지만 선다 (' + hc.join(',') + ')');
  await p.click('[data-bodymap] svg g[data-bp="heart"]', { force: true });
  is(await p.locator('.card').count() === Object.keys(CARE).length && !(await p.isVisible('[data-bpick]')), '  다시 누르면 풀린다 — 몸의 점으로도');
  await p.click('[data-bodymap] svg g[data-bp="brain"]', { force: true });
  is(await p.locator('.card').count() === BODY.find(x => x.p === 'brain').ids.length, '  몸의 점(뇌)을 눌러도 그 부위 병만');
  await p.click('[data-bclear]');
  const roads = await p.$$eval('[data-kjp-road]', a => a.map(e => [e.getAttribute('data-kjp-road'), e.querySelectorAll('.kjp-st').length]));
  is(roads.length === (W.KJ_PATH || []).length && roads.every(([g, n]) => (W.KJ_PATH.find(x => x.g === g) || { d: [] }).d.length === n), '  길 그림 ' + roads.length + '개 — 동그라미 수 = 단계 수');
  await p.click('[data-way="cancer"] .kjp-st[data-si="3"]');
  is(await p.getAttribute('[data-way="cancer"] .step.hit', 'data-si') === '3', '  동그라미(4)를 누르면 그 단계 카드가 선다');
  is(await p.locator('[data-strip] .kjp-card').count() === 5 && await p.locator('[data-bill] svg[data-kjp-bill]').count() === 1, '  병원비 한 막대 · 나오는 길 다섯이 선다');
  is(await p.locator('[data-rules] [data-rule]').count() === RULE.length, '  보상 기준 ' + RULE.length + '단계가 선다');
  const chip = await p.$$eval('.card .cov a', a => a.map(e => [e.getAttribute('href').split('#')[1], (e.querySelector('svg[data-kjp]') || { getAttribute: () => '' }).getAttribute('data-kjp')]));
  is(chip.length > 0 && chip.every(([id, k]) => DICT[id] && DICT[id].k === k), '  담보 칩 ' + chip.length + '개마다 그 담보의 나오는 길 그림');

  console.log('\n[6] 담보 사전');
  const d = await ctx.newPage(); d.on('pageerror', e => errs.push('dict: ' + e.message));
  await d.goto(O + 'kijun-dict.html', { waitUntil: 'domcontentloaded' }); await d.waitForTimeout(300);
  const dk = await d.$$eval('.card', a => a.map(e => [e.dataset.id, (e.querySelector('.pill svg[data-kjp]') || { getAttribute: () => '' }).getAttribute('data-kjp')]));
  is(dk.length === Object.keys(DICT).length && dk.every(([id, k]) => DICT[id].k === k), '  카드 ' + dk.length + '장마다 그 담보의 나오는 길 그림');
  is(await d.locator('.legend svg[data-kjp]').count() === 5, '  뜻풀이 줄에도 다섯 그림');
  const more = await d.evaluate(() => ['silson', 'silson-np'].map(id => { const e = document.querySelector('.card[data-id="' + id + '"] [data-more]'); return e ? e.getAttribute('href') : ''; }));
  is(more.every(h => h === 'kijun-silson.html'), '  실비 두 장에서 「실비 이야기」 로 간다' + (more.every(Boolean) ? '' : ' ← 길 없음'));
  await d.close();

  console.log('\n[7] 폰 · 요청 · 보장 전·후');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-care.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다 (몸 지도 · 길 그림 · 막대 포함)');
  await m.close();
  const a = await ctx.newPage(); a.on('pageerror', e => errs.push('ba: ' + e.message));
  await a.goto(O + 'ba.html', { waitUntil: 'domcontentloaded' }); await a.waitForTimeout(800);
  is(await a.evaluate(() => !!(window.APXBody && typeof anatSvg === 'function' && /APXBody\.svg\(pins\)/.test(String(anatSvg)) && /^<svg viewBox="0 0 200 470"/.test(window.APXBody.svg('')))).catch(() => false), '  보장 전·후의 「내 몸 어디에」 가 같은 몸(APXBody)을 부른다');
  await a.close();
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 그림 — 몸은 한 벌, 직접 그린 SVG, 숫자 없이, 보상 기준 ' + RULE.length + '단계.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
