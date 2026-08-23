/* 비교표 — <b>색이 뜻을 갖는가, 그리고 한쪽 편만 들지 않는가.</b>

   고객은 표를 읽지 않고 훑습니다. 열두 줄이 다 같은 무게로 보이면 정작
   봐야 할 자리를 못 찾고 넘어갑니다. 그래서 자리마다 색을 줍니다.

     .w 초록 — 보험이 유리한 자리
     .o 파랑 — 다른 쪽이 유리한 자리
     .x 빨강 — 조심할 자리 (우리 칸에도 그대로 붙습니다)
     own    — 마지막 칸(보험)이 세로로 옅게 깔려 눈이 따라갑니다

   여기서 막는 것은 둘입니다.

   ① <b>벌거벗은 표.</b> 전에는 표마다 style="color:var(--usd-d)" 을 손으로
      붙였습니다. 그러다 5장 정리표와 달러 4장 표가 통째로 색이 없었고,
      <b>보험이 이기는 자리가 하나도 안 보였습니다.</b> 열두 줄 중 여섯 줄이
      보험 승인데 고객 눈에는 회색 글씨 열두 줄이었습니다.

   ② <b>한쪽 편만 든 표.</b> 이게 더 위험합니다. 초록만 칠하면 고객이 먼저
      알아봅니다 — 그리고 그 순간 표 전체를 못 믿게 됩니다. 트랙 C 가
      부동산이 이기는 자리를 파랗게 그대로 적어 둔 이유가 그것입니다.
      그래서 <b>초록이 있으면 파랑도 있어야</b> 통과합니다.

   그리고 색은 무슨 뜻인지 적어 두지 않으면 「알록달록하네」로 끝납니다 —
   표마다 범례를 답니다.                                                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const PAGE = 'app/상담자료/통합상담_APEX.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p === '/api/market') { rs.writeHead(200, { 'Content-Type': 'application/json' });
                             rs.end(JSON.stringify({ ok: true, news: [] })); return; }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rgb = c => (String(c).match(/[0-9.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
const same = (a, b) => rgb(a).every((v, i) => Math.abs(v - rgb(b)[i]) < 4);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto(base + '/' + PAGE.split('/').map(encodeURIComponent).join('/'),
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  /* 표가 어느 트랙에 있든 다 훑는다 — 트랙을 여기서 다시 세면 늘 때 빠뜨린다 */
  const tbls = [];
  for (const k of await page.evaluate(() => Object.keys(DECK))) {
    await page.evaluate(x => window.__go(x), k);
    await page.waitForTimeout(300);
    const got = await page.evaluate(kk => [].map.call(
      document.querySelectorAll('.track:not(.off) table.t.own, table.t.own'), t => {
        const sec = t.closest('section');
        const cell = s => t.querySelector(s);
        const cs = e => e ? getComputedStyle(e).backgroundColor : '';
        const lgd = sec ? sec.querySelector('.lgd') : null;
        const head = t.querySelector('thead th:last-child');
        return {
          trk: kk, id: sec ? sec.id : '?',
          cols: t.querySelectorAll('thead th').length,
          rows: t.querySelectorAll('tbody tr').length,
          w: t.querySelectorAll('td.w').length,
          o: t.querySelectorAll('td.o').length,
          x: t.querySelectorAll('td.x').length,
          /* 우리 칸이 세로로 구분되는가 — 마지막 칸과 가운데 칸의 바탕이 다른가 */
          ownBg: cs(cell('tbody tr td:last-child')),
          midBg: cs(cell('tbody tr td:nth-child(2)')),
          headMark: head ? getComputedStyle(head).boxShadow : '',
          lgd: lgd ? [].map.call(lgd.querySelectorAll('i'),
                 e => e.className.trim() + '|' + e.textContent.trim()) : null,
          /* 손으로 칠한 색이 남아 있으면 다음 표에서 또 빠뜨린다 */
          inline: t.innerHTML.split('style="color:').length - 1
        };
      }), k);
    got.forEach(g => { if (!tbls.some(t => t.id === g.id)) tbls.push(g); });
  }

  console.log('\n[1] 색을 쓰는 비교표를 찾는다');
  is(tbls.length >= 2, '  own 표가 ' + tbls.length + '장 — ' + tbls.map(t => t.id).join(' · '));

  console.log('\n[2] 보험 칸이 세로로 눈에 들어온다');
  tbls.forEach(t => {
    is(!same(t.ownBg, t.midBg),
       '  ' + t.id + ' — 보험 칸 바탕이 다른 칸과 다르다 (' + t.ownBg + ' vs ' + t.midBg + ')');
    is(/[1-9]/.test(t.headMark) && t.headMark !== 'none',
       '  ' + t.id + ' — 머리칸에 표시가 붙어 있다');
  });

  console.log('\n[3] 한쪽 편만 들지 않는다 — 초록이 있으면 파랑도 있다');
  /* 초록만 칠한 표는 고객이 먼저 알아본다. 그 순간 표 전체를 못 믿게 된다. */
  tbls.forEach(t => {
    is(t.w >= 2, '  ' + t.id + ' — 보험이 유리한 자리를 짚는다 (' + t.w + '칸)');
    is(t.o >= 2, '  ' + t.id + ' — 다른 쪽이 유리한 자리도 그대로 짚는다 (' + t.o + '칸)');
    is(t.x >= 1, '  ' + t.id + ' — 조심할 자리를 감추지 않는다 (' + t.x + '칸)');
  });

  console.log('\n[4] 색이 무슨 뜻인지 적어 둔다');
  tbls.forEach(t => {
    is(!!t.lgd && t.lgd.length === 3, '  ' + t.id + ' — 범례가 세 갈래다');
    if (!t.lgd) return;
    [['w', '보험'], ['o', '다른'], ['x', '조심']].forEach(([c, word]) =>
      is(t.lgd.some(l => l.split('|')[0].indexOf(c) >= 0 && l.indexOf(word) >= 0),
         '  ' + t.id + ' — 「' + word + '」 갈래를 적어 둔다'));
  });

  console.log('\n[5] 색은 한 곳에서만 준다');
  /* 표마다 손으로 칠하면 <b>반드시 어떤 표를 빠뜨린다</b> — 실제로 두 표가
     통째로 벌거벗어 있었다. 자리 이름만 붙이고 색은 스타일시트가 준다. */
  tbls.forEach(t => is(t.inline === 0,
    '  ' + t.id + ' — 표 안에 손으로 칠한 색이 없다' + (t.inline ? ' (' + t.inline + '곳)' : '')));

  console.log('\n[6] 폰에서 표가 화면 밖으로 새지 않는다');
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 } });
  ph.on('pageerror', e => errs.push('phone: ' + String(e).slice(0, 120)));
  await ph.goto(base + '/' + PAGE.split('/').map(encodeURIComponent).join('/'),
                { waitUntil: 'domcontentloaded' });
  await ph.waitForTimeout(2200);
  /* 표가 어느 갈래에 있는지 여기서 다시 세지 않는다 — 다섯 갈래를 다 넘겨 본다 */
  for (const k of await ph.evaluate(() => Object.keys(DECK))) {
    const over = await ph.evaluate(async kk => {
      window.__go(kk); await new Promise(r => setTimeout(r, 260));
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    }, k);
    is(over <= 2, '  ' + k + ' 갈래 — 390px 에서 가로 밀림 ' + over + 'px');
  }

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n비교표 점검 통과 — 색이 뜻을 갖고, 양쪽을 다 적습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
