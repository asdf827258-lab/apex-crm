/* ══════════════════════════════════════════════════════════════════
   check-kjff.js — <b>「팩트파인딩 · 함께 점검표」 가 한 벌로, 지어내지 않고, 기억하지 않고 서나</b> (판 X405)

   사장님 말씀 2026-11-10 「이 기준으로 팩트파인딩, 고객의 상황을 이해하고 같이 점검할수 있는표 별도로 만들어줘」

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 한 벌 — ② 보장 점검의 문항 · 고를 것 · 판정 · 기준 숫자는 selfcheck-core.js 에서만 온다.
         이 화면 파일에 고를 것 글자 · 기준 숫자(뇌 · 심장 금액 · 끝 나이)를 또 적지 않는다(5번)
     [2] ★ ① 고객 이해(KJ_FF) — 다섯 묶음 · 물음마다 「왜 묻나」 · 「자세히」 가 실제 있는 담보 · 병에 닿는다 ·
         금액 · 약속 · 세금 말 0 · 건강 묶음에 「고지는 청약서 질문에 그대로」 · 숫자 칸(앱 팩트파인딩 CM_FF 의 몫) 0
     [3] ★★ 판정이 셀프 점검과 같은 말 — 고른 답마다 화면의 판정 = APXSelf.judge · 암은 진단비 ÷ 연소득 ·
         ③ 함께 정리의 셈이 문항 수와 맞고 「먼저 볼 것」 이 비어 있어요 → 채우면 좋아요 → 확인해요 차례
     [4] ★★ 고객 이름 칸 0 · 적은 것을 기억하지 않는다 — 남는 것은 글씨 크기뿐 · 다시 열면 비어 있다(3번)
     [5] 인쇄 — 단추 · 「자세히」 는 안 나오고 □/☑ 로 찍힌다 · 표 머리가 쪽마다 · tnum 꺼짐(4-1)
     [6] 앱 · 사전 · 지도 · 가이드 · 설계서 · 실비 · 대조표에서 닿는다 · 폰 390px 세 크기 · 요청 0(7번) · 오류 0
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9304;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8');
const box = { window: {} };
['kijun-dict.js', 'kijun-care.js', 'kijun-ff.js'].forEach(f => vm.runInNewContext(rd(f), box));
const F = box.window.KJ_FF || { know: [], wrap: [] };
const DICT = {}, CARE = {};
(box.window.KJ_DICT || []).forEach(g => g.d.forEach(x => { DICT[x.id] = 1; }));
(box.window.KJ_CARE || []).forEach(g => g.d.forEach(x => { CARE[x.id] = 1; }));
const FFJ = rd('kijun-ff.js'), FFH = rd('kijun-ff.html'), CORE = rd('selfcheck-core.js');
const items = []; F.know.forEach(g => g.items.forEach(it => items.push(Object.assign({ g: g.g }, it))));

console.log('\n[1] 한 벌 (5번)');
const coreBox = { window: {}, document: { querySelector: () => null, readyState: 'complete', addEventListener() {} }, localStorage: { getItem: () => null } };
vm.runInNewContext(CORE, coreBox);
const A = coreBox.window.APXSelf;
const labels = []; A.catalog().forEach(q => A.options(q.k).forEach(o => labels.push(o[1])));
/* 다섯 글자 넘는 고를 것만 본다 — 「뇌졸중」 같은 병 이름은 ① 의 집안 이야기에서도 정당하게 쓰이고, 「모르겠어요」 는 어디에나 있는 말이다(헛것 금지 · 8번) */
const GENERIC = ['모르겠어요'];
const copied = labels.filter(t => t.length >= 5 && GENERIC.indexOf(t) < 0 && (FFJ.indexOf(t) >= 0 || FFH.indexOf(t) >= 0));
is(/<script src="selfcheck-core\.js"><\/script>/.test(FFH) && /A\.catalog\(\)/.test(FFH) && /A\.options\(/.test(FFH) && /A\.judge\(/.test(FFH), '  ② 의 문항 · 고를 것 · 판정을 APXSelf 에서 빌린다');
is(copied.length === 0, '  고를 것 글자를 또 적지 않았다' + (copied.length ? ' ← ' + copied.slice(0, 3).join(' · ') : ''));
const T = A.TARGET, nums = [String(T.brain), String(T.heart), T.brain.toLocaleString(), T.heart.toLocaleString(), T.end + '세'];
const hard = nums.filter(n => (FFJ + FFH.replace(/<!--[\s\S]*?-->/g, '')).indexOf(n) >= 0);
is(hard.length === 0, '  기준 숫자(뇌 · 심장 금액 · 끝 나이)를 박지 않았다 — TARGET 에서 채운다' + (hard.length ? ' ← ' + hard.join(', ') : ''));

console.log('\n[2] ① 고객 이해 (1번 · 2번 · 3번)');
is(F.know.length === 5 && ['family', 'work', 'health', 'worry', 'hope'].every(g => F.know.some(x => x.g === g)), '  다섯 묶음 — 가족 · 일 · 건강 · 걱정 · 바라는 것');
is(items.length >= 12 && items.every(it => String(it.q || '').length >= 6 && String(it.why || '').length >= 10 && ['one', 'many', 'line'].indexOf(it.how) >= 0 && (it.how === 'line' || (it.o && it.o.length >= 2))), '  물음 ' + items.length + '개 — 묻는 말 · 왜 묻나 · 고르기');
const deadTo = []; items.forEach(it => (it.to || []).forEach(u => {
  const m = u.match(/^(kijun-[a-z]+\.html)(?:#([a-z0-9-]+))?$/);
  if (!m || !fs.existsSync(path.join(ROOT, 'app', m[1]))) return deadTo.push(it.k + ':' + u);
  if (m[2] && m[1] === 'kijun-dict.html' && !DICT[m[2]]) deadTo.push(it.k + ':' + u);
  if (m[2] && m[1] === 'kijun-care.html' && !CARE[m[2]]) deadTo.push(it.k + ':' + u);
}));
is(deadTo.length === 0, '  「자세히」 가 실제 있는 화면 · 담보 · 병에 닿는다' + (deadTo.length ? ' ← ' + deadTo.join(', ') : ''));
const txt = JSON.stringify(F);
is(!/\d[\d,]*\s*(만\s*원|만원|원\b|억)|\d\s*%/.test(txt) && !/보장됩니다|지급됩니다|나옵니다|무조건|100%|비과세|절세|세액공제/.test(txt), '  금액 · 비율 · 약속 · 세금 말 0');
const hl = F.know.find(g => g.g === 'health') || {};
is(/고지/.test(hl.note || '') && /청약서/.test(hl.note || ''), '  건강 묶음 — 「고지는 청약서 질문에 그대로」 를 밝힌다');
is(items.every(it => it.how !== 'num') && !/type="number"[^>]*data-line/.test(FFH) && !/f_income|f_age|f_loan/.test(FFJ + FFH), '  숫자 칸은 두지 않는다 — 나이 · 소득 · 지출은 앱 팩트파인딩(CM_FF)의 몫');

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
  await p.goto(O + 'kijun-ff.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[3] 판정이 셀프 점검과 같은 말');
  const cat = A.catalog();
  is(await p.locator('[data-row]').count() === cat.length && await p.locator('[data-groups] .it').count() === items.length, '  ② 문항 ' + cat.length + '줄 · ① 물음 ' + items.length + '개가 다 선다');
  const std = await p.textContent('[data-std]');
  is(std.indexOf(A.man(T.brain)) >= 0 && std.indexOf(A.man(T.heart)) >= 0 && std.indexOf(T.end + '세') >= 0 && std.indexOf(T.cancer[0] + '~' + T.cancer[1] + '배') >= 0, '  📏 제 기준 — TARGET 그대로(' + A.man(T.brain) + ' · ' + A.man(T.heart) + ' · ' + T.end + '세)');
  const picks = []; for (const q of cat) { if (q.r) continue; const o = A.options(q.k); picks.push([q.k, o[picks.length % o.length][0]]); }
  for (const [k, v] of picks) await p.click('.op[data-op="a"][data-k="' + k + '"][data-v="' + v + '"]');
  await p.fill('[data-num="c"]', '3000'); await p.fill('[data-num="i"]', '5000');
  const shown = await p.$$eval('[data-res]', a => a.map(e => [e.getAttribute('data-res'), (e.querySelector('[data-s]') || { getAttribute: () => null }).getAttribute('data-s')]));
  const want = shown.map(([k]) => { const pk = picks.find(x => x[0] === k); const j = k === 'cancer' ? A.judge('cancer', undefined, { c: 3000, i: 5000 }) : A.judge(k, pk && pk[1], {}); return [k, j ? j.s : null]; });
  is(JSON.stringify(shown) === JSON.stringify(want), '  고른 답마다 판정 = APXSelf.judge (' + shown.length + '줄 · 암 3,000만 ÷ 연소득 5,000만 → ' + (want.find(x => x[0] === 'cancer') || [])[1] + ')');
  const sum = await p.$$eval('[data-cnt] b', a => a.map(e => +e.textContent));
  is(sum.reduce((x, y) => x + y, 0) === cat.length, '  ③ 셈의 합 = 문항 수 (' + sum.join('+') + ')');
  const ORD = { need: 0, mid: 1, chk: 2 }, firsts = await p.$$eval('[data-first-k]', a => a.map(e => e.getAttribute('data-first-k')));
  const fs2 = firsts.map(k => (shown.find(x => x[0] === k) || [])[1]);
  is(firsts.length >= 1 && firsts.length <= 3 && fs2.every((s, i) => i === 0 || ORD[fs2[i - 1]] <= ORD[s]), '  「먼저 볼 것」 — 비어 있어요 → 채우면 좋아요 → 확인해요 차례 (' + fs2.join(' → ') + ')');
  await p.click('[data-it="top"] .op[data-i="0"]');
  is(/암/.test(await p.textContent('[data-worry]')), '  고객이 고른 걱정이 ③ 에 그대로 선다');

  console.log('\n[4] 이름 칸 0 · 기억하지 않음 (3번)');
  const nameField = await p.$$eval('input,textarea', a => a.filter(e => /이름|성명|고객명/.test((e.placeholder || '') + (e.getAttribute('aria-label') || '') + ((e.closest('label') || {}).textContent || ''))).length);
  is(nameField === 0, '  고객 이름을 적는 칸이 없다');
  await p.fill('[data-it="keep"] .ln', '견본 한 줄'); await p.fill('[data-meta="d"]', '견본 날');
  const keys = await p.evaluate(() => { const k = []; try { for (let i = 0; i < localStorage.length; i++) k.push(localStorage.key(i)); } catch (e) {} return k; });
  is(keys.every(k => k === 'kjFont'), '  적은 것을 기억하지 않는다 — 남는 것은 글씨 크기뿐 (' + (keys.join(',') || '없음') + ')');
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200);
  is(await p.locator('.op.on').count() === 0 && await p.inputValue('[data-it="keep"] .ln') === '' && await p.locator('[data-s]').count() === 0, '  다시 열면 비어 있다');

  console.log('\n[5] 인쇄 (4-1)');
  await p.click('[data-it="spouse"] .op[data-i="1"]');
  await p.emulateMedia({ media: 'print' });
  const pr = await p.evaluate(() => {
    const cs = e => getComputedStyle(e), on = document.querySelector('.op.on'), off = document.querySelector('.op:not(.on)');
    return { act: cs(document.querySelector('.act')).display, to: cs(document.querySelector('.it .to')).display, th: cs(document.querySelector('.chk thead')).display,
      on: getComputedStyle(on, '::before').content, off: getComputedStyle(off, '::before').content,
      tn: cs(document.querySelector('.chk td')).fontVariantNumeric + '|' + cs(document.querySelector('.chk td')).fontFeatureSettings };
  });
  is(pr.act === 'none' && pr.to === 'none', '  단추 · 「자세히」 는 종이에 안 나온다');
  is(/☑/.test(pr.on) && /□/.test(pr.off), '  고른 것은 ☑, 안 고른 것은 □ 로 찍힌다');
  is(pr.th === 'table-header-group' && !/tabular|tnum/.test(pr.tn), '  표 머리가 쪽마다 · tnum 꺼짐');
  const pdf = await p.pdf({ format: 'A4' });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  is(pages >= 2 && pages <= 9, '  A4 ' + pages + '쪽');
  await p.emulateMedia({ media: 'screen' });

  console.log('\n[6] 닿는 길 · 폰 · 요청');
  const IDX = rd('index.html');
  is(/function kjOpenFF\(\)/.test(IDX) && /onclick="kjOpenFF\(\)"/.test(IDX), '  앱의 「보험의 기준」 화면에서 닿는다 (kjOpenFF)');
  is(['kijun-dict.html', 'kijun-care.html', 'kijun-guide.html', 'kijun-sheet.html', 'kijun-silson.html', 'kijun-compare.html'].every(f => rd(f).indexOf('href="kijun-ff.html"') >= 0), '  사전 · 지도 · 가이드 · 설계서 · 실비 · 대조표에서 닿는다');
  const over = [];
  for (const z of ['m', 'l', 'x']) {
    const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
    await m.addInitScript(v => { try { localStorage.setItem('kjFont', v); } catch (e) {} }, z);
    await m.goto(O + 'kijun-ff.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(150);
    const w = await m.evaluate(() => document.documentElement.scrollWidth); if (w > 390) over.push(z + ':' + w);
    await m.close();
  }
  is(over.length === 0, '  폰 390px — 세 크기 모두 옆으로 안 샌다' + (over.length ? ' ← ' + over.join(', ') : ''));
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 팩트파인딩 · 함께 점검표 — 셀프 점검과 같은 말로, 이름 없이, 기억하지 않고.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
