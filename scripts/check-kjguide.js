/* ══════════════════════════════════════════════════════════════════
   check-kjguide.js — <b>「보험의 기준 · 설계 가이드」 가 같은 기준으로, 지어내지 않고 설명하나</b> (판 X307)

   사장님 말씀 2026-11-02 「설계가이드안도 해줘 디테일하고 설명까지 할 수 있게」

   app/kijun-guide.html — 설계사가 고객 앞에서 그대로 읽는 대본이 들어 있습니다.
   대본에 약속·세금 결론이 섞이거나, 기준 숫자가 셀프 점검·설계서와 다르면 고객 앞에서
   두 말이 됩니다(1번 · 2번 · 5번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ 아홉 걸음마다 일곱 자리(무엇을 · 제 기준 · 왜 · 이렇게 말해요 · 흔한 실수 · 꼭 확인 · 관련 담보)
     [2] ★★ 기준 숫자는 selfcheck-core.js 의 TARGET 에서 — 가이드 코드에 2,000 · 1,000 · 90 · 1~2배를
         또 적지 않았고, 화면에는 그 값이 그대로 선다 · 기준 파일을 못 읽으면 숫자를 지어 넣지 않는다(1번 · 5번)
     [3] ★★ 약속·세금 말은 ⑤ 「하지 않는 말」 안에서만, ✕ 로 지운 채로만 선다(1번 · 2번)
     [4] ★ 관련 담보가 모두 담보 사전(kijun-dict.js)에 있는 담보다 — 없는 id 를 걸지 않았다
     [5] 상황별 여섯 · 바꾸기 전에 여섯 · 하지 않는 말 여섯 · 설계 원칙 여섯
     [6] 요청 0(7번) · 폰 390px · 인쇄 tnum 꺼짐(4-1) · 오류 0
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9271;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app', 'kijun-guide.html'), 'utf8');
const js = (SRC.match(/<script>([\s\S]*?)<\/script>/) || [, ''])[1].replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n[2] 기준 숫자를 또 적지 않았다 (5번)');
is(/A\.TARGET/.test(js) && /\{c0\}~\{c1\}배/.test(js) && /\{brain\}/.test(js) && /\{heart\}/.test(js) && /\{end\}세/.test(js), '  기준 자리는 {c0}~{c1} · {brain} · {heart} · {end} 로 비워 두고 TARGET 으로 채운다');
const DONT = (js.match(/var DONT=\[[\s\S]*?\];/) || [''])[0];
const body = js.replace(DONT, '');
is(!/2,?000\s*만|2천만|1,?000\s*만|1천만|\b90\s*세|1~2배/.test(body), '  가이드 코드에 2,000만 · 1,000만 · 90세 · 1~2배를 또 적지 않았다');
console.log('\n[3] 약속·세금 말은 「하지 않는 말」 안에서만 (1번 · 2번)');
is(!/무조건|비과세|보장됩니다|지급됩니다|나옵니다|100%|손해예요|두 배예요/.test(body), '  「하지 않는 말」 밖에는 약속·세금 결론이 한 자도 없다');
is(/무조건/.test(DONT) && /비과세/.test(DONT), '  「하지 않는 말」 에는 그 말들이 ✕ 로 서 있다');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, s) => {
  const p = decodeURIComponent(url.parse(q.url).pathname), f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end('no'); return; }
  s.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); fs.createReadStream(f).pipe(s);
});
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [], sent = [];
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (/fetch|xhr|websocket|ping/.test(r.resourceType())) sent.push(r.url()); });
  const O = 'http://127.0.0.1:' + PORT + '/app/';
  await p.goto(O + 'kijun-guide.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[1] 아홉 걸음 · 일곱 자리');
  const steps = await p.$$eval('.step', a => a.map(e => ({ n: e.dataset.step, std: (e.querySelector('.std p') || {}).textContent || '', why: e.querySelectorAll('.box')[1].textContent.length, say: (e.querySelector('[data-say] p') || {}).textContent || '', oops: e.querySelectorAll('.oops li').length, chk: e.querySelectorAll('.chk li').length })));
  is(steps.length === 9, '  걸음 ' + steps.length + ' — 모으기 · 실비 · 암 · 뇌심장 · 치료 · 간병 · 가족 · 생활 사고 · 기간·정리');
  is(steps.every(s => s.std.length > 10 && s.why > 10 && s.say.length > 20 && s.oops >= 2 && s.chk >= 3), '  걸음마다 제 기준 · 왜 · 이렇게 말해요 · 흔한 실수 둘+ · 꼭 확인 셋+');
  const page = await p.evaluate(() => document.querySelector('[data-steps]').innerText);
  is(/연소득의 1~2배/.test(page) && /2,000만 원/.test(page) && /1,000만 원/.test(page) && /90세 이상/.test(page), '  ★★ 화면에는 TARGET 값이 그대로 선다 — 1~2배 · 2,000만 · 1,000만 · 90세');
  is(!/\{(c0|c1|brain|heart|end)\}/.test(page), '  채우지 못한 {자리} 가 화면에 남지 않았다');

  console.log('\n[3] 화면에서도 — 약속·세금 말은 ✕ 안에서만');
  const outside = await p.evaluate(() => { const c = document.querySelector('main').cloneNode(true); const d = c.querySelector('[data-dont-blk]'); if (d) d.remove(); const f = c.querySelector('.foot'); if (f) f.remove(); return c.innerText; });
  is(!/무조건|비과세 상품|보장됩니다|나옵니다|두 배예요|손해예요/.test(outside), '  「하지 않는 말」 밖 화면에 약속·세금 결론이 없다');
  is(await p.$$eval('[data-dont] s', a => a.length) === 6, '  하지 않는 말 여섯이 모두 ✕(지운 줄)로 선다');

  console.log('\n[4] 관련 담보가 사전에 있다');
  const rel = await p.evaluate(() => { const ids = {}; (window.KJ_DICT || []).forEach(g => g.d.forEach(x => { ids[x.id] = 1; })); const want = []; window.KJG.STEPS.forEach(s => s.rel.forEach(id => want.push(id))); return { want: want.length, miss: want.filter(id => !ids[id]), links: document.querySelectorAll('.rel a[href^="kijun-dict.html#"]').length }; });
  is(rel.miss.length === 0 && rel.links === rel.want, '  관련 담보 ' + rel.want + '개가 모두 사전에 있고 링크로 선다' + (rel.miss.length ? ' ← 없음: ' + rel.miss.join(', ') : ''));

  console.log('\n[5] 상황별 · 바꾸기 전 · 원칙');
  const n = await p.evaluate(() => [document.querySelectorAll('[data-life]>div').length, document.querySelectorAll('[data-swap] li').length, document.querySelectorAll('[data-rules]>div').length]);
  is(n[0] === 6 && n[1] === 6 && n[2] === 6, '  상황별 ' + n[0] + ' · 바꾸기 전에 ' + n[1] + ' · 원칙 ' + n[2]);

  console.log('\n[2] 기준 파일을 못 읽으면 (1번)');
  const q = await ctx.newPage();
  await q.route('**/selfcheck-core.js', r => r.abort());
  await q.goto(O + 'kijun-guide.html', { waitUntil: 'domcontentloaded' }); await q.waitForTimeout(300);
  const t2 = await q.evaluate(() => document.querySelector('[data-steps]').innerText);
  is(/기준 파일을 못 읽었어요/.test(t2) && !/2,000만 원/.test(t2), '  ★ 숫자를 지어 넣지 않고 「기준 파일을 못 읽었어요」');
  await q.close();

  console.log('\n[6] 폰 · 인쇄 · 요청');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-guide.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다');
  await m.close();
  await p.emulateMedia({ media: 'print' });
  const tn = await p.$eval('.step p', e => getComputedStyle(e).fontVariantNumeric + '|' + getComputedStyle(e).fontFeatureSettings);
  is(!/tabular|tnum/.test(tn), '  인쇄에서 tnum 이 꺼져 있다');
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 설계 가이드 — 아홉 걸음 · 같은 기준 · 약속 없는 대본.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
