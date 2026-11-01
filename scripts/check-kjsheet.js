/* ══════════════════════════════════════════════════════════════════
   check-kjsheet.js — <b>「보험의 기준 · 한 장 안내서」 가 지어내지 않고 한 장에 서나</b> (판 X281)

   사장님 말씀 2026-11-01 —
     「자 이거로 보험 담보와, 설명 왜 가입해야하는지 어떻게 지급되는지
       설명할수 있는 한장 보험의 기준과 설명안내서를 만들어줘」

   app/kijun-sheet.html 은 고객 앞에서 펴는 종이입니다. 「이렇게 나와요」 칸이
   약속처럼 읽히거나, 「제 기준」 이 셀프 점검이 판정에 쓰는 기준과 다르면
   고객 앞에서 두 말이 됩니다(1번 · 5번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ 담보 아홉 칸이 셀프 점검·보장 점검표의 칸과 같은 이름으로 서고,
         칸마다 네 자리(이런 거예요 · 왜 · 이렇게 나와요 · 제 기준)가 다 찼다
     [2] ★★ 지급은 두 갈래로만 — 진단·수술·사망은 「정해진 금액」, 실비·배상은
         「쓴 만큼」 · 「얼마 나옵니다」 「보장됩니다」 같은 약속이 없다(1번)
     [3] ★★ 「제 기준」 이 셀프 점검(selfcheck-core.js)의 판정과 같은 말을 한다 —
         연소득 1~2배 ↔ m>=1 · 90세 ↔ '90세 이상' · 뇌혈관질환 · 허혈성 · 할 때마다(5번)
     [4] ★★ 「약관과 보험사 심사 결과에 따라요」 · 「규정 아님」 이 있다 ·
         세금 말(비과세·세액공제·과세)이 한 자도 없다(2번)
     [5] ★ A4 가로 <b>한 장</b>으로 뽑힌다 · 인쇄에서 tnum 이 꺼져 있다(4-1) ·
         뽑은 PDF 를 다시 읽으면 숫자가 그대로 나온다
     [6] 설계사 이름은 # 뒤 by= 에서만, 꺾쇠를 지우고 선다 · 인쇄에도 남는다 ·
         아무것도 보내지 않는다(7번) · 폰 390px 에서 옆으로 안 샌다
     [7] 길 — 셀프 점검 결과의 「한 장 안내서」 가 보낸 설계사 이름을 들고 간다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9251;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SHEET = fs.readFileSync(path.join(ROOT, 'app', 'kijun-sheet.html'), 'utf8');
const CORE = fs.readFileSync(path.join(ROOT, 'app', 'selfcheck-core.js'), 'utf8');
const body = SHEET.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');

console.log('\n[2] 지급은 두 갈래로만 · 약속이 없다 (1번)');
is(!/보장됩니다|지급됩니다|받으실 수 있습니다|나옵니다|무조건|100%|확정적으로/.test(body), '  「보장됩니다 · 나옵니다 · 무조건」 같은 약속 말이 없다');
console.log('\n[4] 조건부 문구 · 세금 (2번)');
is(/지급 여부와 금액은 약관과 보험사 심사 결과에 따라요/.test(body), '  「지급 여부와 금액은 약관과 보험사 심사 결과에 따라요」');
is(/규정 아님/.test(body) && /보험료·보장은 심사 결과에 따라요/.test(body), '  「규정 아님」 · 「보험료·보장은 심사 결과에 따라요」');
is(!/비과세|세액공제|과세|소득공제|절세/.test(body), '  세금 말이 한 자도 없다');
console.log('\n[3] 「제 기준」 이 셀프 점검의 판정과 같은 말 (5번)');
is(/연소득의 1~2배/.test(body) && /m>=1\?'ok'/.test(CORE), '  암 진단비 — 안내서 「연소득의 1~2배」 · 셀프 점검은 1배부터 괜찮아요');
is(/90세 이상/.test(body) && /\['90','90세 이상','ok'\]/.test(CORE), '  보장 기간 — 둘 다 「90세 이상」');
is(/뇌혈관질환<\/em> <span class="code">I60–I69/.test(body) && /\['v','뇌혈관질환','ok'\]/.test(CORE), '  뇌 — 둘 다 「뇌혈관질환」 이 넓은 이름');
is(/허혈성 심장질환<\/em> <span class="code">I20–I25/.test(body) && /허혈성 심장질환/.test(CORE), '  심장 — 둘 다 「허혈성 심장질환」');
is(/할 때마다<\/em> 나오나/.test(body) && /\['m','할 때마다/.test(CORE), '  수술비 — 둘 다 「할 때마다」');
console.log('\n[6] 아무것도 보내지 않는다 (7번)');
const js = (SHEET.match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1];
is(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(js), '  fetch · XHR · beacon 이 없다');
is(!/<input/.test(body), '  적는 칸이 없다 — 고객 이름을 받지 않는다(3번)');

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
  /* 바깥은 끊는다 (check-netblock) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage(), errs = [], sent = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => { if (/fetch|xhr|websocket|ping/.test(r.resourceType())) sent.push(r.url()); });
  const O = 'http://127.0.0.1:' + PORT + '/app/';
  await p.goto(O + 'kijun-sheet.html#by=' + encodeURIComponent('홍길동<b>'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(400);

  console.log('\n[1] 담보 아홉 칸 · 네 자리');
  const rows = await p.$$eval('tr[data-cov]', a => a.map(r => ({ k: r.dataset.cov, cells: [...r.children].map(td => td.textContent.trim().length) })));
  is(rows.map(r => r.k).join(',') === 'silson,cancer,brain,heart,surg,nonpay,care,death,liab', '  셀프 점검·보장 점검표와 같은 아홉 칸이 같은 차례');
  is(rows.length === 9 && rows.every(r => r.cells.length === 5 && r.cells.every(n => n >= 4)), '  칸마다 다섯 자리가 다 찼다(담보 · 이런 거예요 · 왜 · 이렇게 나와요 · 제 기준)');
  const kind = await p.$$eval('tr[data-cov]', a => a.map(r => r.dataset.cov + ':' + (r.querySelector('.pill.fx') ? 'fx' : r.querySelector('.pill.rl') ? 'rl' : '-')).join(' '));
  is(/silson:rl/.test(kind) && /liab:rl/.test(kind) && ['cancer', 'brain', 'heart', 'surg', 'death'].every(k => kind.indexOf(k + ':fx') >= 0),
     '  ★★ 실비·배상은 「쓴 만큼」, 진단·수술·사망은 「정해진 금액」 (' + kind + ')');

  console.log('\n[6] 설계사 이름 · 폰');
  is(await p.isVisible('[data-by]') && (await p.textContent('[data-by-name]')) === '홍길동b', '  # 뒤 by= 의 이름이 꺾쇠를 지우고 선다 (「홍길동b」)');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-sheet.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(300);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다');
  is(!(await m.isVisible('[data-by]')), '  이름이 없으면 「안내 · 설계사」 줄을 안 세운다');
  await m.close();

  console.log('\n[5] A4 가로 한 장 · 다시 읽히나 (4-1)');
  await p.emulateMedia({ media: 'print' });
  const tnum = await p.$eval('.cov td', e => getComputedStyle(e).fontVariantNumeric + '|' + getComputedStyle(e).fontFeatureSettings);
  is(!/tabular/.test(tnum) && !/tnum/.test(tnum), '  인쇄에서 tnum 이 꺼져 있다 (' + tnum + ')');
  is(await p.isVisible('[data-by]') && !(await p.isVisible('[data-print]')), '  인쇄에 이름은 남고 단추는 빠진다');
  const pdf = path.join(require('os').tmpdir(), 'kjsheet-' + process.pid + '.pdf');
  await p.pdf({ path: pdf, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
  const raw = fs.readFileSync(pdf, 'latin1');
  const pages = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  is(pages === 1, '  ★ A4 가로 한 장 (' + pages + '쪽)');
  let txt = '';
  try { txt = cp.execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8' }); } catch (e) { txt = null; }
  if (txt === null) console.log('     (pdftotext 가 없어 다시 읽기는 건너뜁니다 — 없는 것을 있다고 하지 않습니다)');
  else is(/2,000만/.test(txt) && /1,000만/.test(txt) && /I60–I69|I60-I69/.test(txt), '  뽑은 PDF 를 다시 읽으면 숫자가 그대로 (2,000만 · 1,000만 · I60–I69)');
  try { fs.unlinkSync(pdf); } catch (e) { }
  await p.emulateMedia({ media: 'screen' });

  console.log('\n[7] 셀프 점검 결과 → 한 장 안내서');
  const c = await ctx.newPage();
  await c.goto(O + 'selfcheck.html#by=' + encodeURIComponent('홍길동'), { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(300);
  const href = await c.getAttribute('[data-sc-sheet]', 'href');
  is(href === 'kijun-sheet.html#by=' + encodeURIComponent('홍길동'), '  보낸 설계사 이름을 들고 간다 (' + href + ')');
  await c.close();

  is(sent.length === 0, '  눌러 봐도 요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 한 장 안내서 — 아홉 칸 · 두 갈래 지급 · 같은 기준 · 한 장.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
