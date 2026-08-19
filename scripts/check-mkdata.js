/* 미끼 레이더 — 사무실에서 만든 data 폴더를 웹에서도 쓰는가.

   이 화면은 옆의 data/ 폴더에서 뉴스·신상품·약관을 읽는다. 그 폴더는
   사무실 PC 의 「시작.bat」 이 만들어 준다. 웹에는 없다 — 약관을 공개
   주소에 올릴 수 없어 저장소에 넣지 않았다.

   그런데 더 나빴다. 없는 주소를 부르면 Netlify 되돌림 규칙 때문에
   <b>404 가 아니라 APEX 첫 화면 HTML 이 200 으로</b> 돌아온다. 화면은
   그걸 JSON 으로 읽으려다 조용히 실패하고 아무 말 없이 비어 있었다.
   「사무실에선 됐는데 집에선 안 된다」 가 이것이었다.

   여기서 확인한다.

     1. 폴더를 안 넣었으면 「자료 폴더 없음」 이라고 눈에 띄게 말하는가
     2. 폴더를 넣으면 fetch 가 그걸 돌려주는가 (원래 코드는 안 고치고)
     3. 새로고침해도 남아 있는가
     4. data/ 가 아닌 주소는 건드리지 않는가
     5. 지우면 원래대로 돌아가는가                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url'), os = require('os');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  /* 배포본과 같게 흉내 낸다 — 없는 주소도 200 으로 앱 화면을 준다 */
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const idx = path.join(f, 'index.html');
    if (fs.existsSync(idx)) f = idx;
    else { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
           rs.end('<!doctype html><html><head><title>APEX YUN PRO</title></head><body>앱 첫 화면</body></html>');
           return; }
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const PAGE = '/app/상담자료/미끼레이더/index.html';

/* 사무실 시작.bat 이 만들어 놓은 것 같은 data 폴더를 흉내로 만든다 */
function makeDataDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mkd-'));
  const d = path.join(root, 'data');
  fs.mkdirSync(path.join(d, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(d, 'products', 'ontop-cancer'), { recursive: true });
  fs.writeFileSync(path.join(d, 'library.json'), JSON.stringify({
    generated: '2026-08-16', source: '시작.bat', count: 2,
    items: [{ id: 'a1', title: '무배당 든든종신보험 약관', co: '한화생명' },
            { id: 'a2', title: '간편심사 판매자료', co: '삼성생명' }]
  }));
  fs.writeFileSync(path.join(d, 'news.json'), JSON.stringify({
    generated: '2026-08-16',
    items: [{ t: '뇌·심장 담보 확대 신상품 출시', score: 88 }]
  }));
  fs.writeFileSync(path.join(d, 'docs', 'a1.txt'), '제5조(보험금의 지급사유) 회사는 피보험자가…');
  fs.writeFileSync(path.join(d, 'products', 'index.json'), JSON.stringify({
    items: [{ slug: 'ontop-cancer', name: '온탑 암보장 플러스' }]
  }));
  fs.writeFileSync(path.join(d, 'products', 'ontop-cancer', 'brief.json'), JSON.stringify({
    name: '온탑 암보장 플러스', 판정: '표적항암 3,000만'
  }));
  return { root, dir: d };
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(base + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  console.log('\n[1] 폴더가 없으면 없다고 말한다');
  const btn = await page.evaluate(() => {
    const b = document.getElementById('mkdBtn');
    return b ? { txt: b.textContent, warn: /없음/.test(b.textContent) } : null;
  });
  is(!!btn, '「자료 폴더」 단추가 있다');
  is(btn && btn.warn, '없을 때 「자료 폴더 없음」 이라고 뜬다 — ' + (btn ? btn.txt : ''));

  console.log('\n[2] 지금은 자료를 못 읽는다 (되돌림 규칙 때문에 앱 화면이 온다)');
  const before = await page.evaluate(async () => {
    try {
      const r = await fetch('data/library.json?t=' + Date.now());
      const t = await r.text();
      return { ok: r.ok, isHtml: /<!doctype html>/i.test(t), json: (() => { try { JSON.parse(t); return true; } catch (e) { return false; } })() };
    } catch (e) { return { err: String(e).slice(0, 60) }; }
  });
  is(before.ok === true, '  없는데도 200 이 온다 (404 가 아니다)');
  is(before.isHtml && !before.json, '  내용은 JSON 이 아니라 앱 화면 HTML 이다 — 이래서 조용히 비었다');

  console.log('\n[3] data 폴더를 넣으면 그걸 돌려준다');
  const { root, dir } = makeDataDir();
  const files = [];
  (function walk(p) {
    fs.readdirSync(p).forEach(n => {
      const f = path.join(p, n);
      fs.statSync(f).isDirectory() ? walk(f) : files.push(f);
    });
  })(dir);
  is(files.length === 5, '  흉내 낸 data 폴더에 파일 5개를 만들었다 — ' + files.length);

  await page.evaluate(() => mkdPanel());
  /* webkitdirectory 칸은 파일 목록이 아니라 <b>폴더 경로</b>를 받는다 */
  await page.setInputFiles('#mkdPick', dir);
  await page.waitForTimeout(1200);
  const said = await page.evaluate(() => (document.getElementById('mkdMsg') || {}).textContent || '');
  is(/넣었습니다/.test(said), '  넣었다고 답한다 — ' + said.slice(0, 40));

  await page.waitForLoadState('load');
  await page.waitForTimeout(2200);
  await page.waitForFunction(() => typeof mkdState === 'function', null, { timeout: 30000 });

  console.log('\n[4] 새로고침한 뒤에도 읽힌다');
  /* 몇 개인지는 DB 를 세고 나서 채워진다 — 셀 때까지 기다린다 */
  await page.waitForFunction(() => mkdState().n > 0, null, { timeout: 30000 });
  const st = await page.evaluate(() => mkdState());
  is(st.n === 5 && st.ready, '  파일 5개가 그대로 있다 — ' + st.n + '개');
  const after = await page.evaluate(async () => {
    const lib = await (await fetch('data/library.json?t=' + Date.now())).json();
    const news = await (await fetch('data/news.json?t=1')).json();
    const doc = await (await fetch('data/docs/a1.txt')).text();
    const pi = await (await fetch('data/products/index.json?t=1')).json();
    const br = await (await fetch('data/products/ontop-cancer/brief.json')).json();
    return { libN: lib.count, libT: lib.items[0].title, news: news.items[0].t,
             doc: doc, prod: pi.items[0].slug, brief: br['판정'] };
  });
  is(after.libN === 2 && /든든종신/.test(after.libT), '  library.json 이 진짜로 읽힌다 — ' + after.libT);
  is(/뇌·심장/.test(after.news), '  news.json 도 읽힌다 — ' + after.news);
  is(/제5조/.test(after.doc), '  docs/a1.txt 글이 읽힌다');
  is(after.prod === 'ontop-cancer', '  products/index.json 이 읽힌다');
  is(/3,000만/.test(after.brief), '  products/<slug>/brief.json 까지 읽힌다 — ' + after.brief);
  const btn2 = await page.evaluate(() => (document.getElementById('mkdBtn') || {}).textContent || '');
  is(/자료 5개/.test(btn2), '  단추가 「자료 5개」 로 바뀐다 — ' + btn2);

  console.log('\n[5] data/ 가 아닌 주소는 건드리지 않는다');
  const other = await page.evaluate(async () => {
    const r = await fetch('사용안내.html');
    const t = await r.text();
    return { ok: r.ok, len: t.length };
  });
  is(other.ok && other.len > 500, '  옆 파일은 그대로 원래 길로 간다 — ' + other.len + '자');

  console.log('\n[6] 지우면 원래대로');
  await page.evaluate(() => { if (!document.getElementById('mkdBox')) mkdPanel(); });
  /* 화면에 잠금 덮개(#lockOv)가 있어 마우스가 안 닿는다 — 직접 누른다 */
  await page.evaluate(() => document.getElementById('mkdClr').click());
  await page.waitForLoadState('load');
  await page.waitForTimeout(2200);
  await page.waitForFunction(() => typeof mkdState === 'function', null, { timeout: 30000 });
  const gone = await page.evaluate(() => mkdState());
  is(gone.n === 0 && !gone.ready, '  넣은 것이 지워졌다');
  const back = await page.evaluate(async () => {
    const t = await (await fetch('data/library.json?t=1')).text();
    return /<!doctype html>/i.test(t);
  });
  is(back, '  다시 원래 길(앱 화면)로 돌아간다 — 가로채기가 안 남는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  try { fs.rmSync(root, { recursive: true, force: true }); } catch (e) {}
  console.log('\n──────────────────────────────');
  console.log(bad ? '자료 폴더 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '자료 폴더 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
