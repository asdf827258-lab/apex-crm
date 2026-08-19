/* 폰으로 들어와도 보기 쉬운가.

   팀원 대부분이 폰으로 먼저 연다. 그런데 가로로 밀리는 화면이 하나라도
   있으면 그 화면은 폰에서 쓸 수 없는 화면이 된다. 글자가 잘리고, 단추가
   화면 밖으로 나가고, 표가 반쯤 사라진다.

   여기서 확인한다 — 390px(아이폰 기준) 에서

     1. 몸통이 가로로 밀리지 않는가 (넘칠 것은 <b>제 칸 안에서</b> 밀려야 한다)
     2. 어느 칸이 밀어내는지 이름을 대는가
     3. 손가락으로 누를 수 있는 크기인가 (단추 높이)
     4. 폰에서 글자가 너무 작지 않은가                                  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json',
               '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const W = 390;
/* 폰에서 자주 여는 칸부터 */
const TABS = ['home', 'clients', 'crm', 'ta', 'ckboard', 'growboard', 'bojang', 'baba',
              'news_live', 'insta', 'airep', 'voiceasst', 'settings', 'phoneapp'];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: 780 },
                                       deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto(base + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'me', name: '점검', role: 'owner', plan: 'vip' };
    window.toast = function () {};
  });

  console.log('\n[1] 390px 에서 몸통이 가로로 밀리지 않는다');
  for (const t of TABS) {
    const r = await page.evaluate(async (t) => {
      try { go(t); } catch (e) { return { skip: true, why: String(e).slice(0, 60) }; }
      await new Promise(r => setTimeout(r, 380));
      const de = document.documentElement;
      const over = [];
      /* 어느 칸이 밀어내는지 이름을 댄다 — 「어딘가 넘친다」 로는 못 고친다 */
      document.querySelectorAll('.app *').forEach(el => {
        if (over.length >= 4) return;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        if (b.right <= de.clientWidth + 1) return;
        /* 제 칸 안에서 밀리는 것(가로 스크롤 상자)은 넘친 게 아니다 */
        let p = el.parentElement, inScroller = false;
        while (p && p !== document.body) {
          const cs = getComputedStyle(p);
          if (/(auto|scroll)/.test(cs.overflowX)) { inScroller = true; break; }
          p = p.parentElement;
        }
        if (inScroller) return;
        over.push((el.className || el.tagName).toString().slice(0, 48) +
                  ' →' + Math.round(b.right));
      });
      return { skip: false, sw: de.scrollWidth, cw: de.clientWidth, over: over };
    }, t);
    if (r.skip) { console.log('  · ' + t + ' — 열 수 없어 건너뜁니다'); continue; }
    is(r.sw <= r.cw + 1, '  ' + t + ' (' + r.sw + '/' + r.cw + ')' +
       (r.over.length ? ' — 밀어내는 칸: ' + r.over.join(' , ') : ''));
  }

  console.log('\n[2] 손가락으로 누를 수 있는 크기인가');
  const small = await page.evaluate(async () => {
    go('clients');
    await new Promise(r => setTimeout(r, 350));
    const out = [];
    document.querySelectorAll('.app button, .app .tab-btn').forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.height >= 30) return;
      out.push((b.className || '').toString().slice(0, 34) + ' h=' + Math.round(r.height));
    });
    return out.slice(0, 6);
  });
  is(small.length === 0, '  30px 보다 낮은 단추가 없다' + (small.length ? ' — ' + small.join(' , ') : ''));

  console.log('\n[3] 폰에서 글자가 너무 작지 않다');
  const tiny = await page.evaluate(async () => {
    go('home');
    await new Promise(r => setTimeout(r, 350));
    let n = 0;
    document.querySelectorAll('.app *').forEach(el => {
      if (!el.childNodes.length) return;
      let has = false;
      el.childNodes.forEach(c => { if (c.nodeType === 3 && (c.textContent || '').trim()) has = true; });
      if (!has) return;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 99;
      if (fs < 10) n++;
    });
    return n;
  });
  is(tiny === 0, '  10px 미만 글자가 없다' + (tiny ? ' — ' + tiny + '군데' : ''));

  console.log('\n[4] 오늘의 터치가 폰에서도 한 줄로 읽힌다');
  const cc = await page.evaluate(async () => {
    const day = (n) => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    OSC.list = [{ id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: day(60) }];
    CM.meta = { c1: { fp: {}, touch: [] } }; CM.loaded = true; CC.loaded = true; CM.pick = '';
    go('clients');
    await new Promise(r => setTimeout(r, 350));
    const el = document.getElementById('oscList');
    if (el) el.innerHTML = cmTopHtml('', OSC.list);
    await new Promise(r => setTimeout(r, 120));
    const row = document.querySelector('.ccp-row');
    const btn = document.querySelector('.ccp-go');
    return { has: !!row,
             w: row ? Math.round(row.getBoundingClientRect().width) : 0,
             bh: btn ? Math.round(btn.getBoundingClientRect().height) : 0,
             sw: document.documentElement.scrollWidth,
             cw: document.documentElement.clientWidth };
  });
  is(cc.has, '  오늘의 터치가 그려진다');
  is(cc.sw <= cc.cw + 1, '  그려도 가로로 안 밀린다 (' + cc.sw + '/' + cc.cw + ')');
  is(cc.bh >= 34, '  단추가 손가락에 맞는다 (' + cc.bh + 'px)');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '폰 화면 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '폰 화면 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
