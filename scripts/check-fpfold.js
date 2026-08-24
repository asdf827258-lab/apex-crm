/* 재무설계 상담자료 — <b>접이를 펴도 글씨가 그대로인가.</b>

   고객 앞에서 항목을 탭해 근거를 펴면 글씨가 <b>반토막</b>이 났습니다.
   실제로 쟀습니다 — 14.93px 이 8.23px 로, 16.21px 이 10.31px 로 줄었습니다.
   그 자리에서 고객이 못 읽으면 근거를 편 뜻이 없습니다.

   까닭은 자동 맞춤(fitSlide)이었습니다. 장이 상자보다 길면 zoom 을 낮춰
   <b>장 전체</b>를 줄이는데, 접이를 펴면 장이 길어지므로 글씨까지 같이
   줄어들었습니다. 상자가 overflow:hidden 이라 줄이는 것 말고 방법이 없었습니다.

   고친 방법은 <b>접이를 재지 않는 것</b>입니다. 크기는 접었을 때 기준으로
   정하고, 편 내용이 넘치면 줄이는 대신 <b>스크롤</b>합니다.

   여기서 확인합니다.
     1. 접이가 있는 장에서 <b>전부 펴도</b> 글씨 크기가 그대로인가
     2. 편 내용이 넘칠 때 <b>스크롤</b>이 열리는가 — 안 그러면 잘려서 못 본다
     3. 접었다 폈다 해도 <b>되돌아오는가</b> — 한 번 줄면 안 돌아오던 자리다  */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const PAGE = '/app/재무설계/상담자료.html';

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  /* 발표는 넓은 화면에서 한다 — 1000px 이하면 맞춤이 아예 안 돈다 */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));

  await page.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  /* 견본 이름은 홍길동 — 실제 고객 이름은 쓰지 않는다 (CLAUDE.md 3번) */
  await page.evaluate(() => {
    const n = document.getElementById('f_name'); if (n) n.value = '홍길동';
    document.getElementById('start').click();
  });
  await page.waitForTimeout(900);

  const setup = await page.evaluate(() => ({
    slides: document.getElementById('slides').children.length,
    wide: document.getElementById('show').classList.contains('wide')
  }));

  console.log('\n[1] 발표가 선다');
  is(setup.slides > 0, '  장이 그려진다 — ' + setup.slides + '장');
  is(setup.wide, '  16:9 가로 모드다 — 이 모드에서만 자동 맞춤이 돈다');

  const idxs = await page.evaluate(() => {
    const box = document.getElementById('slides'), out = [];
    for (let i = 0; i < box.children.length; i++)
      if (box.children[i].querySelectorAll('.acc .acc-h').length) out.push(i);
    return out;
  });
  is(idxs.length > 0, '  접이가 있는 장을 찾았다 — ' + idxs.length + '장');

  console.log('\n[2] 접이를 전부 펴도 글씨가 그대로다');
  const rows = [];
  for (const i of idxs) {
    rows.push(await page.evaluate(async (i) => {
      const box = document.getElementById('slides');
      go(i); await new Promise(r => setTimeout(r, 180));
      const el = box.children[i];
      const heads = [].slice.call(el.querySelectorAll('.acc .acc-h'));
      const real = () => {
        const t = el.querySelector('.acc-t');
        return +(parseFloat(getComputedStyle(t).fontSize) * parseFloat(el.style.zoom || 1)).toFixed(2);
      };
      /* 전부 접고 잰다 */
      [].forEach.call(el.querySelectorAll('.acc.on'), a => a.classList.remove('on'));
      deckScale(); await new Promise(r => setTimeout(r, 220));
      const closed = real();
      /* 전부 펴고 잰다 — 진짜 클릭으로 (직접 class 를 켜면 손으로 여는 길을 안 본다) */
      heads.forEach(h => h.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
      await new Promise(r => setTimeout(r, 320));
      const opened = real();
      const on = el.querySelectorAll('.acc.on').length;
      const scroll = box.classList.contains('folded');
      const over = el.scrollHeight * parseFloat(el.style.zoom || 1) > box.clientHeight;
      /* 다시 접고 잰다 — 되돌아와야 한다 */
      heads.forEach(h => h.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
      await new Promise(r => setTimeout(r, 320));
      const back = real();
      return { i, folds: heads.length, on: on, closed, opened, back, scroll, over };
    }, i));
  }

  rows.forEach(r => {
    is(r.on === r.folds, '  장 #' + r.i + ' — 접이 ' + r.folds + '개가 실제로 펴진다 (' + r.on + '개)');
  });
  const shrunk = rows.filter(r => r.closed - r.opened > 0.5);
  is(shrunk.length === 0,
     '  펴도 글씨가 안 줄어든다' +
     (shrunk.length ? ' — 줄어든 장: ' + shrunk.map(r =>
        '#' + r.i + ' ' + r.closed + '→' + r.opened + 'px').join(', ') : ''));

  console.log('\n[3] 넘치면 잘리지 않고 스크롤된다');
  const over = rows.filter(r => r.over);
  is(over.every(r => r.scroll),
     '  넘치는 장은 스크롤이 열린다 — 넘친 장 ' + over.length + '개' +
     (over.filter(r => !r.scroll).length
        ? ' · 안 열린 장: ' + over.filter(r => !r.scroll).map(r => '#' + r.i).join(', ') : ''));

  console.log('\n[4] 접었다 펴도 되돌아온다');
  const stuck = rows.filter(r => Math.abs(r.back - r.closed) > 0.5);
  is(stuck.length === 0,
     '  다시 접으면 원래 크기로 돌아온다' +
     (stuck.length ? ' — 안 돌아온 장: ' + stuck.map(r =>
        '#' + r.i + ' ' + r.closed + '→' + r.back + 'px').join(', ') : ''));

  console.log('\n[5] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  /* 접었을 때부터 이미 작은 장은 접이와 상관없는 <b>다른 문제</b>다.
     여기서 빨간불을 켜면 헛알람이 되므로(8번) 숫자만 적어 둔다. */
  const tiny = rows.filter(r => r.closed < 11).map(r => '#' + r.i + ' ' + r.closed + 'px');
  if (tiny.length) console.log('\n  참고 — 접었을 때부터 작은 장이 있습니다: ' + tiny.join(', ') +
                               '\n         접이와 무관한 자리라 여기서 잡지 않습니다.');

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                  : '접이 점검 통과 — 펴도 글씨가 그대로입니다.\n');
  process.exit(bad ? 1 : 0);
})();
