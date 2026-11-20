/* 🧠 윤시현의 두뇌 — 쉬운판 · 판 X509 (app/ba-brainq.js)

   사장님 말씀 2026-11-19 「윤시현의 두뇌도 그렇고, 단어들 전체적으로 쉽게 재구성하고 쉽게 사용할수 있도록」 →
   11-20 「응 차례대로 진행해」.

   보는 것
     [1] 두뇌를 열면 쉬운판 — 고객이 한 말 12개가 세 묶음으로 · 카드 하나도 안 빠짐
     [2] ★★ 글이 두뇌 그대로 — 12장 모두 한 줄 그림 · 이렇게 말하세요 · 주고받기 수가 BRAIN_DOC 과 같다(지어낸 말 없음)
     [3] 이 고객에게 바로 걸리는 말(brainPick().hot)은 🎯 · 그 고객 숫자 줄이 맨 위
     [4] 「📚 전체 두뇌 보기」 → 예전 다섯 구역 그대로 · 「🙂 쉬운판으로」 돌아오기
     [5] 누를 때 화면 전체를 다시 안 그린다 · 44px · 폰 390 한 줄로 · 보내는 요청 0 · 오류 0                    */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1360, height: 900 } });
  const errs = [], out = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', q => { if (q.method() !== 'GET') out.push(q.method() + ' ' + q.url()); });
  await pg.route('**://**', r => /^http:\/\/127\.0\.0\.1/.test(r.request().url()) ? r.continue() : r.abort());
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { localStorage.clear(); window.confirm = () => true; doSample(); showPanel('brain'); go('edit'); });
  await pg.waitForTimeout(200);

  head('[1] 쉬운판이 먼저');
  const L = await pg.evaluate(() => ({ easy: !!document.querySelector('.card.bz'), full: !!document.getElementById('bq1'),
    q: document.querySelectorAll('.bz-q').length, g: [].map.call(document.querySelectorAll('.bz-g'), g => g.textContent.trim()), n: BRAIN_DOC.length }));
  is(L.easy && !L.full, '두뇌를 열면 쉬운판(예전 다섯 구역은 안 섬)');
  is(L.q === L.n, '고객이 한 말 ' + L.q + '개 = 두뇌 카드 ' + L.n + '장 — 하나도 안 빠짐');
  is(L.g.length >= 3 && /보험료/.test(L.g[0]) && /이미 있어요/.test(L.g[1]) && /나중에/.test(L.g[2]), '묶음 — ' + L.g.join(' / '));

  head('[2] ★★ 글이 두뇌 그대로');
  const same = await pg.evaluate(async () => {
    const strip = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); };
    const bad = [];
    for (let i = 0; i < BRAIN_DOC.length; i++) {
      bzPick(i); const d = BRAIN_DOC[i], a = document.getElementById('bzAns');
      const fig = a.querySelector('.bz-fig .t').textContent.replace(/\s+/g, ' ').trim(), say = a.querySelector('.bz-say .t').textContent.replace(/\s+/g, ' ').trim();
      const rp = a.querySelectorAll('.bz-b').length;
      if (fig !== strip(d.fig) || say !== strip(d.back) || rp !== (d.rp || []).length * 2) bad.push(i + ':' + d.t);
    }
    return bad;
  });
  is(same.length === 0, '12장 모두 한 줄 그림 · 이렇게 말하세요 · 주고받기가 BRAIN_DOC 그대로' + (same.length ? ' — 다름: ' + same.join(' / ') : ''));

  head('[3] 이 고객에게');
  const H = await pg.evaluate(() => { const hot = {}; brainPick().hot.forEach(x => { const i = BRAIN_DOC.indexOf(x.d); if (i >= 0 && !hot[i]) hot[i] = x; });
    const ks = Object.keys(hot); bzPick(+ks[0]); const you = (document.querySelector('#bzAns .bz-you .t') || {}).textContent || '';
    const w = document.createElement('div'); w.innerHTML = hot[ks[0]].you || '';
    return { n: ks.length, mark: document.querySelectorAll('.bz-q.hot').length, you: you.replace(/\s+/g, ' ').trim(), want: w.textContent.replace(/\s+/g, ' ').trim() }; });
  is(H.n > 0 && H.mark === H.n, '🎯 표시 ' + H.mark + '개 = 바로 걸리는 말 ' + H.n + '개');
  is(!!H.want && H.you.indexOf(H.want) === 0, '고른 말 맨 위에 그 고객 숫자 줄 — ' + H.you.slice(0, 50));

  head('[4] 전체 두뇌 · 돌아오기');
  await pg.click('.bz h2 .mini:has-text("전체 두뇌")'); await pg.waitForTimeout(150);
  const F = await pg.evaluate(() => ({ secs: ['bq1', 'bq2', 'bq3', 'bq4', 'bq5'].filter(id => document.getElementById(id)).length, easy: !!document.querySelector('.card.bz') }));
  is(F.secs === 5 && !F.easy, '「📚 전체 두뇌 보기」 → 예전 다섯 구역 그대로');
  await pg.click('h2 .mini:has-text("쉬운판으로")'); await pg.waitForTimeout(150);
  is(await pg.evaluate(() => !!document.querySelector('.card.bz')), '「🙂 쉬운판으로」 돌아온다');

  head('[5] 다시 그리지 않기 · 44px · 폰 · 조용함');
  const keep = await pg.evaluate(() => { window.__bzCard = document.querySelector('.card.bz'); bzPick(2); return document.querySelector('.card.bz') === window.__bzCard; });
  is(keep, '말을 눌러도 화면 전체를 다시 안 그린다(답 칸만)');
  const tiny = await pg.evaluate(() => [].filter.call(document.querySelectorAll('.bz button, .bz summary'), b => b.offsetParent && Math.round(b.getBoundingClientRect().height) < 44).map(b => b.textContent.trim().slice(0, 10)));
  is(tiny.length === 0, '누르는 자리 44px 아래 0개' + (tiny.length ? ' — ' + tiny.join(' / ') : ''));
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(200);
  const ph = await pg.evaluate(() => { const w = document.querySelector('.bz-w'); return { cols: getComputedStyle(w).gridTemplateColumns.split(' ').length, sw: document.documentElement.scrollWidth }; });
  is(ph.cols === 1 && ph.sw <= 390, '폰 390 — 한 줄로 · 옆으로 안 밀림 (' + ph.sw + ')');
  is(out.length === 0, '보내는 요청 0' + (out.length ? ' — ' + out.slice(0, 2).join(' / ') : ''));
  is(errs.length === 0, '오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 빨간불' : '두뇌 쉬운판 점검 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
