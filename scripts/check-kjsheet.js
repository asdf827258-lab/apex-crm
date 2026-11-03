/* ══════════════════════════════════════════════════════════════════
   check-kjsheet.js — <b>「보험의 기준 · 한 장 설계서」 — 담보를 이해하고 내가 직접 설계하나</b> (판 X305)

   사장님 말씀 2026-11-01 「보험 담보와, 설명 왜 가입해야하는지 어떻게 지급되는지
   설명할수 있는 한장 보험의 기준과 설명안내서를 만들어줘」 → 2026-11-02 「이미지
   띄워봐 한장으로 진짜 보험 설계도 스스로하고, 담보에 대한 이해도 정확히 할수 있도록」

   app/kijun-sheet.html 은 고객이 혼자 숫자를 넣고 「내 설계」 를 받는 종이입니다.
   목표를 지어 내거나, 셀프 점검과 다른 기준으로 판정하면 고객이 그대로 믿습니다(1번 · 5번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ 줄마다 읽을 것(이런 거예요 · 왜 · 이렇게 나와요)과 적을 칸 · 목표 · 설계가 다 있다
     [2] ★★ 지급은 두 갈래 — 실비·배상 「쓴 만큼」 · 진단·수술·사망 「정해진 금액」 ·
         약속 말 0(1번) · 「약관과 보험사 심사 결과에 따라요」 · 세금 말 0(2번) · 보험료를 셈하지 않는다
     [3] ★★ 기준·판정은 selfcheck-core.js 한 곳 — 설계서 코드에 기준 숫자를 또 적지 않았고
         (TARGET · judge · options 를 빌림) 고를 것도 셀프 점검의 것 그대로다(5번)
     [4] ★★ 적은 숫자로만 셈한다 — 연소득 5,000만 · 암 3,000만 → +2,000만 · 뇌출혈만 → 넓히기 ·
         사망 = 대출 + 생활비×12×해 − 모아 둔 돈 · 안 적은 칸은 「아직」 이고 목표를 지어 내지 않는다
     [5] ★ A4 가로 한 장(숫자를 다 채워도) · 인쇄 tnum 꺼짐 · 다시 읽으면 숫자 그대로(4-1)
     [6] ★★ 설계사가 앱에서 연 것(#p=1)은 기억하지 않고, 고객 폰은 기억한다 · 「처음부터」 로 지워진다(3번)
     [7] 셀프 점검 답을 같은 칸으로 가져온다 · 셀프 점검 결과에서 설계사 이름을 들고 온다
     [8] 요청 0(7번) · 이름 칸 0(3번) · 폰 390px
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9251;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SHEET = fs.readFileSync(path.join(ROOT, 'app', 'kijun-sheet.html'), 'utf8');
const CORE = fs.readFileSync(path.join(ROOT, 'app', 'selfcheck-core.js'), 'utf8');
const body = SHEET.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script>[\s\S]*?<\/script>/g, '');
const js = (SHEET.match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1];

console.log('\n[2] 지급 두 갈래 · 약속 0 · 세금 0 (1번 · 2번)');
is(!/보장됩니다|지급됩니다|받으실 수 있습니다|나옵니다|무조건|100%/.test(body + js), '  「보장됩니다 · 나옵니다 · 무조건」 같은 약속 말이 없다');
is(/지급 여부와 금액은 약관과 보험사 심사 결과에 따라요/.test(body) && /규정 아님/.test(body), '  「지급 여부와 금액은 약관과 보험사 심사 결과에 따라요」 · 「규정 아님」');
is(!/비과세|세액공제|과세|소득공제|절세/.test(body + js), '  세금 말이 한 자도 없다');
is(/이 종이는 보험료를 셈하지 않아요/.test(body) && !/보험료[^.·]{0,12}(만 원|원\))/.test(body + js), '  보험료를 셈하지 않는다고 밝히고, 보험료 금액을 적지 않는다');
console.log('\n[3] 기준·판정은 selfcheck-core.js 한 곳 (5번)');
is(/var TARGET=\{cancer:\[1,2\],brain:2000,heart:1000,end:90\}/.test(CORE) && /m>=TARGET\.cancer\[0\]/.test(CORE), '  기준 숫자는 셀프 점검 판정이 쓰는 TARGET 하나');
is(/A\.TARGET/.test(js) && /A\.judge\(/.test(js) && /A\.options\(/.test(js), '  설계서는 TARGET · judge · options 를 빌린다');
is(!/2000|1000|\b90\b|\*1\b|\*2\b/.test(js.replace(/\/\*[\s\S]*?\*\//g, '')), '  설계서 코드에 기준 숫자(2000 · 1000 · 90 · 1~2배)를 또 적지 않았다');
is(!/<option value="(v|h|s|i|a|m|1)">(뇌|급성|허혈|할 때마다|한 번만)/.test(body), '  뇌·심장·수술 고를 것을 화면에 또 박지 않았다 — 셀프 점검 문항에서 채운다');
console.log('\n[8] 보내지 않는다 · 이름 칸 0');
is(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(js), '  fetch · XHR · beacon 이 없다');
is(!/data-k="(name|이름|tel|phone)"/.test(SHEET) && !/type=["']?(tel|email|text)/.test(SHEET), '  이름·전화 칸이 없다 — 숫자와 고르기만');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, s) => {
  const p = decodeURIComponent(url.parse(q.url).pathname), f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end('no'); return; }
  s.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } });
  /* 바깥은 끊는다 (check-netblock) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [], sent = [];
  const watch = pg => { pg.on('pageerror', e => errs.push(e.message)); pg.on('request', r => { if (/fetch|xhr|websocket|ping/.test(r.resourceType())) sent.push(r.url()); }); };
  const O = 'http://127.0.0.1:' + PORT + '/app/';
  const p = await ctx.newPage(); watch(p);
  await p.goto(O + 'kijun-sheet.html#p=1&by=' + encodeURIComponent('홍길동<b>'), { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);
  const out = k => p.$eval('[data-out="' + k + '"]', e => e.innerText.replace(/\s+/g, ' ').trim());
  const goal = k => p.$eval('[data-goal="' + k + '"]', e => e.innerText.replace(/\s+/g, ' ').trim());
  const set = async (k, v) => { const e = await p.$('[data-k="' + k + '"]'); if (await e.evaluate(x => x.tagName) === 'SELECT') await e.selectOption(v); else await e.fill(v); };

  console.log('\n[1] 줄마다 읽을 것 · 적을 칸 · 목표 · 설계');
  const rows = await p.$$eval('tr[data-cov]', a => a.map(r => ({ k: r.dataset.cov, read: [...r.querySelectorAll('td.n,td.w')].every(td => td.textContent.trim().length > 6), inp: r.querySelectorAll('[data-k]').length, out: !!r.querySelector('[data-out]') })));
  is(rows.map(r => r.k).join(',') === 'silson,cancer,brain,heart,surg,nonpay,care,death,liab,term', '  열 줄 — 셀프 점검의 아홉 칸 + 기간');
  is(rows.every(r => r.read && r.inp >= 1 && r.out), '  줄마다 읽을 글 · 적을 칸 · 내 설계 칸이 다 있다');
  const kind = await p.$$eval('tr[data-cov]', a => a.map(r => r.dataset.cov + ':' + (r.querySelector('.pill.fx') ? 'fx' : r.querySelector('.pill.rl') ? 'rl' : '-')).join(' '));
  is(/silson:rl/.test(kind) && /liab:rl/.test(kind) && ['cancer', 'brain', 'heart', 'surg', 'death'].every(k => kind.indexOf(k + ':fx') >= 0), '  ★★ 실비·배상 「쓴 만큼」 · 진단·수술·사망 「정해진 금액」');
  const optN = await p.$$eval('select[data-opt="brain"] option', a => a.map(o => o.textContent).join('|'));
  is(/뇌혈관질환/.test(optN) && /뇌출혈만/.test(optN), '  뇌 고를 것이 셀프 점검 문항 그대로 (' + optN + ')');

  console.log('\n[4] 적은 숫자로만 셈한다 (1번)');
  is((await p.$$eval('[data-out]', a => a.filter(e => /아직/.test(e.textContent)).length)) === 10, '  처음엔 열 줄 모두 「아직」 — 판정을 지어 내지 않는다');
  is(/연소득을 적으면 목표가 나와요/.test(await goal('cancer')), '  연소득을 모르면 암 목표 금액을 지어 내지 않는다');
  await set('cancer', '3000');
  is(/연소득을 적어 배수 보기/.test(await out('cancer')) && !/채우기/.test(await out('cancer')), '  연소득 없이 암만 적으면 「채우기」 금액을 안 낸다');
  await set('inc', '5000');
  is(/5,000만 원 ~ 1억 원/.test(await goal('cancer')), '  연소득 5,000만 → 목표 5,000만 ~ 1억');
  is(/채우면 좋아요/.test(await out('cancer')) && /\+2,000만 원 채우기/.test(await out('cancer')), '  ★★ 암 3,000만 → 채우면 좋아요 · +2,000만');
  await set('brainN', 'h'); await set('brain', '2000');
  is(/뇌혈관질환으로 넓히기/.test(await out('brain')), '  뇌출혈만 · 2,000만 → 「뇌혈관질환으로 넓히기」(금액만 맞아도 이름이 좁으면)');
  await set('brainN', 'v'); await set('brain', '1500');
  is(/\+500만 원 채우기/.test(await out('brain')), '  뇌혈관질환 · 1,500만 → +500만');
  await set('brain', '');
  is(/확인해요/.test(await out('brain')) && /가입 금액 확인/.test(await out('brain')), '  금액을 비우면 「확인해요」 — 0 으로 치지 않는다');
  await set('death', '10000'); await set('loan', '20000'); await set('live', '300');
  is(/필요한 돈 보기/.test(await out('death')), '  생활비·남은 해를 다 안 적으면 필요한 돈을 지어 내지 않는다');
  await set('yrs', '15'); await set('save', '5000');
  is(/6억 9,000만 원/.test(await goal('death')) && /\+5억 9,000만 원/.test(await out('death')), '  ★ 사망 — 2억 + 300만×12×15 − 5,000만 = 6억 9,000만 → +5억 9,000만');
  await set('end', '90'); await set('payend', '65'); await set('retire', '60');
  is(/은퇴 뒤 5년 더 내요/.test(await out('term')), '  기간 — 다 내는 나이 65 · 은퇴 60 → 「은퇴 뒤 5년 더」');
  await set('silson', '3'); await set('surg', '1'); await set('nonpay', 'n'); await set('care', 'd'); await set('liab', '2'); await set('heartN', 'a'); await set('heart', '1000');
  const plan = await p.$eval('[data-plan]', e => e.innerText);
  const cnt = await p.$$eval('[data-cnt]', a => a.map(e => e.dataset.cnt + e.textContent).join(' '));
  is(/^비싼 암 치료/.test(plan.trim()) && (plan.match(/\n/g) || []).length >= 7, '  내 설계도가 「비어 있어요」 부터 차례로 모인다');
  is(/need1/.test(cnt) && /ok1/.test(cnt), '  설계도 수가 줄의 판정과 같다 (' + cnt + ')');

  console.log('\n[5] A4 가로 한 장 · 다시 읽히나 (4-1)');
  await p.emulateMedia({ media: 'print' });
  const tnum = await p.$eval('.cov td', e => getComputedStyle(e).fontVariantNumeric + '|' + getComputedStyle(e).fontFeatureSettings);
  is(!/tabular/.test(tnum) && !/tnum/.test(tnum), '  인쇄에서 tnum 이 꺼져 있다');
  const pdf = path.join(require('os').tmpdir(), 'kjsheet-' + process.pid + '.pdf');
  await p.pdf({ path: pdf, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
  const pages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  is(pages === 1, '  ★ 열 줄을 다 채워도 A4 가로 한 장 (' + pages + '쪽)');
  let txt = null; try { txt = cp.execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8' }); } catch (e) { }
  if (txt === null) console.log('     (pdftotext 가 없어 다시 읽기는 건너뜁니다 — 없는 것을 있다고 하지 않습니다)');
  else is(/2,000만 원/.test(txt) && /5억 9,000만 원/.test(txt) && /I60–I69|I60-I69/.test(txt), '  뽑은 PDF 를 다시 읽으면 숫자가 그대로');
  try { fs.unlinkSync(pdf); } catch (e) { }
  await p.emulateMedia({ media: 'screen' });

  console.log('\n[6] 기억 — 설계사 기기는 안 남고, 고객 폰은 남는다 (3번)');
  is(await p.evaluate(() => localStorage.getItem('apxDesign')) === null, '  ★★ 앱에서 연 것(#p=1)은 적은 숫자를 기억하지 않는다');
  is(await p.isVisible('[data-by]') && (await p.textContent('[data-by-name]')) === '홍길동b', '  설계사 이름은 꺾쇠를 지우고 선다');
  const c = await ctx.newPage(); watch(c);
  await c.goto(O + 'kijun-sheet.html', { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(200);
  await c.fill('[data-k="inc"]', '4000');
  await c.reload({ waitUntil: 'domcontentloaded' }); await c.waitForTimeout(200);
  is(await c.inputValue('[data-k="inc"]') === '4000', '  고객 폰(설계사 표시 없음)은 다시 열어도 남는다');
  await c.click('[data-clear]');
  is(await c.inputValue('[data-k="inc"]') === '' && await c.evaluate(() => localStorage.getItem('apxDesign')) === null, '  「처음부터」 로 칸과 기억이 다 지워진다');

  console.log('\n[7] 셀프 점검 ↔ 설계서');
  await c.evaluate(() => localStorage.setItem('apxSelfCheck', JSON.stringify({ a: { brain: 'h', silson: '2', cancer: null }, n: { c: 2000, i: 6000 }, p: {} })));
  await c.reload({ waitUntil: 'domcontentloaded' }); await c.waitForTimeout(200);
  is(await c.isVisible('[data-from-self]'), '  이 폰에 셀프 점검 답이 있으면 「가져오기」 가 선다');
  await c.click('[data-from-self]');
  is(await c.inputValue('[data-k="brainN"]') === 'h' && await c.inputValue('[data-k="cancer"]') === '2000' && await c.inputValue('[data-k="inc"]') === '6000', '  뇌 이름 · 암 금액 · 연소득이 같은 칸으로 들어온다');
  await c.goto(O + 'selfcheck.html#by=' + encodeURIComponent('홍길동'), { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(200);
  is(await c.getAttribute('[data-sc-sheet]', 'href') === 'kijun-sheet.html#by=' + encodeURIComponent('홍길동'), '  셀프 점검 결과의 길이 보낸 설계사 이름을 들고 온다');
  await c.close();
  const m = await ctx.newPage(); watch(m); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-sheet.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다');
  await m.close();

  is(sent.length === 0, '  눌러 봐도 요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 한 장 설계서 — 읽고 · 적고 · 내 설계까지, 지어내지 않고 한 장.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
