/* 발표 단추 — 보고 있는 탭이 아니라 <b>고객</b>이 트랙을 정한다.

   전에는 우하단 발표 단추가 지금 보고 있는 탭의 트랙만 열었다.
   연금 탭에서 상담하다가 고객이 달러를 물으면 탭을 옮겼다가 다시
   눌러야 했다. 상담 중에 그 한 번이 흐름을 끊는다.

   여기서 확인한다.

     1. 단추를 누르면 다섯 트랙이 다 뜨는가
     2. 지금 보는 탭이 어느 것인지 표시되는가
     3. 어느 트랙을 골라도 그 트랙으로 열리는가 — 탭을 안 옮기고
     4. 고객 데이터가 트랙과 함께 그대로 넘어가는가                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));

  await page.goto(base + '/app/finance.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 단추가 트랙 고르기 판을 연다');
  is(await page.locator('#apexPresentBtn').count() === 1, '우하단에 발표 단추가 있다');
  await page.click('#apexPresentBtn');
  await page.waitForTimeout(320);
  const sheet = await page.locator('#apexTrackSheet').count();
  is(sheet === 1, '누르면 고르기 판이 뜬다');
  const tracks = await page.$$eval('#apexTrackSheet .tk[data-tk]',
    els => els.map(e => ({ k: e.getAttribute('data-tk'),
                           n: (e.querySelector('.n') || {}).textContent || '',
                           now: e.classList.contains('now') })));
  is(tracks.length === 5, '다섯 트랙이 다 있다 — ' + tracks.map(t => t.k).join(' '));
  ['w', 'd', 't', 'e', 'c'].forEach(k => is(tracks.some(t => t.k === k), '  트랙 ' + k));

  console.log('\n[2] 지금 보는 탭을 알려 준다');
  const nowOn = tracks.filter(t => t.now);
  is(nowOn.length === 1, '「지금 보는 탭」 표시가 딱 하나다');
  is(/지금 보는 탭/.test(nowOn[0] ? nowOn[0].n : ''), '그 트랙에 배지가 붙어 있다');

  console.log('\n[3] 고른 트랙으로 열린다 — 탭은 그대로 둔 채');
  const before = await page.evaluate(() => apexCurrentTab());
  for (const k of ['w', 'd', 't', 'e', 'c']) {
    await page.evaluate(() => { if (!document.getElementById('apexTrackSheet')) apexPickTrack(); });
    await page.waitForTimeout(160);
    await page.click('#apexTrackSheet .tk[data-tk="' + k + '"]');
    await page.waitForTimeout(420);
    const got = await page.evaluate(() => {
      const f = document.getElementById('apexDeckFrame');
      return f ? f.getAttribute('src') : '';
    });
    const q = new URLSearchParams((got.split('?')[1] || ''));
    is(q.get('track') === k, '  ' + k + ' 를 고르면 track=' + q.get('track') + ' 로 열린다');
    if (k === 'w') {
      is(!!q.get('name') && !!q.get('age') && !!q.get('inf'),
         '  고객 데이터가 같이 넘어간다 (name·age·inf)');
      is(q.get('present') === '1' || /present=1/.test(got), '  발표 모드로 열린다');
    }
    await page.evaluate(() => apexCloseModal());
    await page.waitForTimeout(140);
  }
  const after = await page.evaluate(() => apexCurrentTab());
  is(before === after, '트랙을 골라도 보던 탭은 안 바뀐다 — ' + before);

  console.log('\n[3-2] 상담자료 쪽에서도 그 갈래가 실제로 열린다');
  /* 발표 단추가 track=c 를 보내도 상담자료가 안 받으면 첫 갈래가 열린다.
     아무 소리도 안 나기 때문에 여기서 반드시 잡아야 한다. */
  for (const k of ['w', 'd', 't', 'e', 'c']) {
    const deck = await browser.newPage();
    await deck.goto(base + '/app/상담자료/통합상담_APEX.html?track=' + k,
                    { waitUntil: 'domcontentloaded' });
    await deck.waitForTimeout(1400);
    const got = await deck.evaluate(() => (window.__curTrack ? window.__curTrack() : '?'));
    is(got === k, '  ?track=' + k + ' 로 열면 그 갈래가 선다 — ' + got);
    await deck.close();
  }
  const cApi = await browser.newPage();
  await cApi.goto(base + '/app/상담자료/통합상담_APEX.html?track=c', { waitUntil: 'domcontentloaded' });
  await cApi.waitForTimeout(1400);
  const cInfo = await cApi.evaluate(() => {
    const el = document.getElementById('trackC');
    return { has: !!window.__apexC, on: !!el && !el.classList.contains('off'),
             txt: el ? el.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(cInfo.has, '  일시납·쿠폰 갈래에 손잡이(__apexC)가 있다');
  is(cInfo.on, '  그 갈래가 화면에 떠 있다');
  is(/월세/.test(cInfo.txt) && /상가|부동산/.test(cInfo.txt), '  부동산 이야기가 그 안에 있다');
  is(/쿠폰/.test(cInfo.txt), '  쿠폰 이야기가 그 안에 있다');
  await cApi.close();

  console.log('\n[4] 닫기');
  await page.evaluate(() => apexPickTrack());
  await page.waitForTimeout(160);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(220);
  is(await page.locator('#apexTrackSheet').count() === 0, 'Esc 로 닫힌다');
  await page.evaluate(() => apexPickTrack());
  await page.waitForTimeout(160);
  await page.click('#apexTrackScrim', { position: { x: 5, y: 5 } });
  await page.waitForTimeout(220);
  is(await page.locator('#apexTrackSheet').count() === 0, '바깥을 눌러도 닫힌다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '발표 트랙 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '발표 트랙 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
