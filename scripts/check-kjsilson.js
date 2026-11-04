/* ══════════════════════════════════════════════════════════════════
   check-kjsilson.js — <b>「보험의 기준 · 실비 이야기」 가 지어내지 않고 맞게 서나</b> (판 X318)

   사장님 말씀 2026-11-04 「실비 역사와 보장내용도 자세히 알려줘」

   app/kijun-silson.js(글 한 벌) · app/kijun-silson.html(그리기). 고객이 「내 실비는 몇 세대」 를 믿고
   갈아타기를 정하는 자리라, 세대를 가르는 달이 하루만 틀려도 고객 앞에서 무너집니다(1번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 세대 넷이 빈틈없이 이어진다 — 표준약관이 바뀐 달(2009년 10월 · 2017년 4월 · 2021년 7월)에서 정확히 갈린다 ·
         세대마다 내가 내는 몫 · 무엇을 보나 · 보험료 · 갱신·재가입 · 이런 분은
     [2] ★★ 금액(공제 · 한도) 0 · 약속 말 0 · 세금 말 0 · 개편 논의에 날짜를 지어 적지 않는다 (1번 · 2번 · 9번) ·
         「대표적인 표준약관 기준 · 내 비율은 증권」 을 맨 위에 밝힌다
     [3] ★ 보장 다섯 · 안 되는 것 · 여러 개 들면 나눠서(비례보상) · 청구 세 걸음 · 갈아타기 전 네 가지
     [4] ★★ 「내 실비 가입 달」 — 경계 달마다 맞는 세대를 고른다 · 엉뚱한 값엔 세대를 지어 고르지 않는다 ·
         아무것도 기억하지 않는다(3번)
     [5] 길 그림 세대 넷 · 병원비 한 막대(kijun-pics.js 한 벌) · 앱 · 사전 · 지도 · 가이드 · 설계서에서 닿는다
     [6] 요청 0(7번) · 폰 390px · 인쇄 tnum 꺼짐(4-1) · 오류 0
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9302;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8');
const box = { window: {} }; vm.runInNewContext(rd('kijun-silson.js'), box);
const S = box.window.KJ_SILSON || { eras: [] }, E = S.eras || [];
const nextYm = v => (v % 100 === 12) ? (Math.floor(v / 100) + 1) * 100 + 1 : v + 1;

console.log('\n[1] 세대 넷 · 경계 달');
is(E.length === 4 && E.map(e => e.g).join() === '1,2,3,4', '  세대 넷 — 1 · 2 · 3 · 4');
is(E[0] && E[0].from === 0 && E[3] && E[3].to >= 209912 && E.every((e, i) => i === 0 || e.from === nextYm(E[i - 1].to)), '  빈틈없이 이어진다 — 앞 세대 끝 다음 달이 뒤 세대 첫 달');
is(E[1] && E[1].from === 200910 && E[2] && E[2].from === 201704 && E[3] && E[3].from === 202107, '  표준약관이 바뀐 달에서 갈린다 — 2009년 10월 · 2017년 4월 · 2021년 7월');
is(E.every(e => ['nick', 'when', 'pay', 'cover', 'prem', 'renew', 'keep'].every(f => String(e[f] || '').length >= 4)), '  세대마다 별명 · 시기 · 내가 내는 몫 · 무엇을 보나 · 보험료 · 갱신 · 이런 분은');
is(E[2] && /도수/.test(E[2].cover) && /주사/.test(E[2].cover) && /MRI/.test(E[2].cover) && /특약/.test(E[2].cover), '  3세대 — 비급여 3종(도수 · 주사 · MRI)을 특약으로 나눈 세대');
is(E[3] && /급여/.test(E[3].cover) && /비급여/.test(E[3].cover) && /(오르|할증)/.test(E[3].prem), '  4세대 — 급여 · 비급여를 나누고, 비급여를 많이 받으면 다음 해 보험료가 오른다');

console.log('\n[2] 금액 · 약속 · 세금 · 지어낸 날짜 0 (1번 · 2번 · 9번)');
const all = JSON.stringify(S);
is(!/\d[\d,]*\s*(만\s*원|만원|원\b|천원|억)/.test(all), '  공제 · 한도 금액을 적지 않는다');
is(!/보장됩니다|지급됩니다|나옵니다|무조건|100%|확정적/.test(all), '  약속 말이 없다');
is(!/비과세|세액공제|소득공제|절세|과세/.test(all), '  세금 말이 없다');
is(S.next && !/\d{4}\s*년|\d+\s*월|\d{4}[.\-/]\d/.test(S.next) && /확인/.test(S.next), '  개편 논의 — 시행 날짜를 지어 적지 않고 「발표로 확인」');
const H = rd('kijun-silson.html');
is(/대표적인 표준약관 기준/.test(H) && /증권과 약관으로 확인/.test(H) && /약관과 보험사 심사 결과/.test(H), '  맨 위 — 「대표적인 표준약관 기준 · 내 비율은 증권 · 지급은 심사」');

console.log('\n[3] 보장 · 안 되는 것 · 청구 · 갈아타기');
is((S.cover || []).length >= 5 && S.cover.every(c => c.t && c.d && c.c), '  보장 ' + (S.cover || []).length + '가지 — 무엇 · 꼭 볼 것');
is((S.out || []).length >= 5 && /치과/.test(S.out.join()) && /미용/.test(S.out.join()), '  안 되는 것 ' + (S.out || []).length + '가지 — 치과 · 한방 비급여 · 미용 …');
is(/비례보상/.test(S.many || '') && /두 배로 받지 않/.test(S.many || ''), '  여러 개 들어도 나눠서 — 두 배로 받지 않는다');
is((S.claim || []).length === 3 && /실손24/.test(JSON.stringify(S.claim)), '  청구 세 걸음 · 실손24');
is((S.swap || []).length >= 4 && /심사/.test(S.swap.join()) && /증권/.test(S.swap.join()), '  갈아타기 전 ' + (S.swap || []).length + '가지 — 다시 심사 · 증권으로 세대 확인');

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
  await p.goto(O + 'kijun-silson.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(300);

  console.log('\n[4] 내 실비 가입 달');
  const cases = [['2005-03', '1'], ['2009-09', '1'], ['2009-10', '2'], ['2017-03', '2'], ['2017-04', '3'], ['2021-06', '3'], ['2021-07', '4'], ['2026-11', '4']];
  const got = [];
  for (const [ym, g] of cases) { await p.fill('[data-join]', ym); got.push([ym, g, await p.getAttribute('.era.on', 'data-era').catch(() => null)]); }
  is(got.every(([, g, o]) => g === o), '  경계 달마다 맞는 세대 — ' + got.map(([y, g, o]) => y + '→' + o).join(' · '));
  await p.fill('[data-join]', '');
  await p.evaluate(() => { const e = document.querySelector('[data-join]'); e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });
  is(await p.locator('.era.on').count() === 0 && /지어서 세대를 정하지 않아요/.test(await p.textContent('[data-mine]')), '  모르면 세대를 지어 고르지 않는다');
  is(await p.evaluate(() => { try { return localStorage.length; } catch (e) { return 0; } }) === 0, '  아무것도 기억하지 않는다 (3번)');

  console.log('\n[5] 그림 · 닿는 길');
  is(await p.locator('[data-tl] svg [data-era-g]').count() === 4, '  실비가 걸어온 길 — 세대 넷');
  is(await p.locator('[data-bill] svg[data-kjp-bill]').count() === 1 && /<script src="kijun-pics\.js"><\/script>/.test(H), '  병원비 한 막대 — kijun-pics.js 한 벌');
  is(await p.locator('.era').count() === 4 && await p.locator('[data-covs] .cov').count() === S.cover.length && await p.locator('[data-claim] > div').count() === 3, '  세대 카드 넷 · 보장 · 청구가 선다');
  const IDX = rd('index.html');
  is(/function kjOpenSilson\(\)/.test(IDX) && /onclick="kjOpenSilson\(\)"/.test(IDX), '  앱의 「보험의 기준」 화면에서 닿는다 (kjOpenSilson)');
  is(['kijun-dict.html', 'kijun-care.html', 'kijun-guide.html', 'kijun-sheet.html'].every(f => rd(f).indexOf('href="kijun-silson.html"') >= 0), '  담보 사전 · 진단·치료 지도 · 설계 가이드 · 설계서에서 닿는다');

  console.log('\n[6] 폰 · 인쇄 · 요청');
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(O + 'kijun-silson.html', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200);
  is(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, '  폰 390px 에서 옆으로 안 샌다');
  await m.close();
  await p.emulateMedia({ media: 'print' });
  const tn = await p.$eval('.era dd', e => getComputedStyle(e).fontVariantNumeric + '|' + getComputedStyle(e).fontFeatureSettings);
  is(!/tabular|tnum/.test(tn), '  인쇄에서 tnum 이 꺼져 있다');
  is(sent.length === 0, '  요청 0 (7번)' + (sent.length ? ' ← ' + sent[0] : ''));
  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs[0] : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 실비 이야기 — 세대 넷이 바뀐 달에서 정확히 갈리고, 금액 · 약속 · 지어낸 날짜 없이.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
