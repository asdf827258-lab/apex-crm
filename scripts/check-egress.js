/* 서버에서 <b>쓸데없이 많이</b> 받아 오지 않는가.

   실제로 이런 일이 있었다. 「AI 조직 라이브」 화면이 60초마다 AI 보고서
   <b>본문 120건</b>을 통째로 다시 받았다. body 는 AI 가 쓴 글이라 길이
   제한이 없다. 화면 하나 열어 두면 한 시간에 수십 MB 가 나갔고,
   그것이 쌓여 Supabase 무료 한도(월 5GB)를 <b>세 배(15GB)</b> 로 넘겼다.
   한도를 넘기자 프로젝트가 통째로 막혔고 — <b>로그인까지 안 됐다.</b>

   숫자가 새는 것은 눈에 안 보인다. 그래서 여기서 지킨다.

     1. 되풀이해 묻는 간격이 너무 짧지 않은가
     2. 화면을 안 보고 있으면 아예 묻지 않는가
     3. 눌러서 받는 길이 대신 있는가 — 왜 안 움직이는지 화면에 적었는가
     4. 누른 만큼만 받는가
     5. 다른 화면(시세)도 안 보고 있으면 쉬는가                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 저절로 되풀이해 받지 않는다');
  const src = await page.evaluate(() => {
    AO.timer = setInterval(function () {}, 1000);
    aoTick();
    return { tick: '' + aoTick, stopped: AO.timer === null, hasBtn: typeof aoRefresh === 'function' };
  });
  is(!/setInterval/.test(src.tick), '  타이머를 아예 안 건다');
  is(!/aoLoad\(/.test(src.tick), '  저절로 본문을 받지 않는다');
  is(src.stopped, '  남아 있던 옛 타이머는 확실히 끈다');
  is(src.hasBtn, '  대신 눌러서 받는 길(aoRefresh)이 있다');

  console.log('\n[2] 화면에 「새로고침」 이 서 있다');
  const ui = await page.evaluate(() => {
    OS.profile = { id: 'me', name: '점검', role: 'owner', plan: 'vip' };
    const box = document.createElement('div'); box.id = 'aoBody'; document.body.appendChild(box);
    AO.loaded = true; AO.rows = []; AO.ideas = []; AO.busy = '';
    aoRender();
    const h = box.innerHTML;
    box.remove();
    return { btn: /id="aoRefBtn"/.test(h), say: /저절로 새로 받지 않습니다/.test(h) };
  });
  is(ui.btn, '  🔄 새로고침 단추가 있다');
  is(ui.say, '  「저절로 새로 받지 않습니다」 라고 밝힌다 — 왜 안 움직이는지 알 수 있게');

  console.log('\n[3] 누르면 그때 한 번만 받는다');
  const once = await page.evaluate(() => {
    const box = document.createElement('div'); box.id = 'aoBody'; document.body.appendChild(box);
    let n = 0;
    const real = window.aoLoad;
    window.aoLoad = function () { n++; };
    aoRefresh(); aoRefresh();
    window.aoLoad = real; box.remove();
    return n;
  });
  is(once === 2, '  누른 만큼만 받는다 (두 번 눌러 ' + once + '회) — 저절로 늘지 않는다');

  console.log('\n[4] 시세도 안 보고 있으면 쉰다');
  const inv = await page.evaluate(() => ('' + invStartTimer));
  is(/document\.hidden/.test(inv), '  다른 탭에 있으면 시세를 안 받아 온다');

  console.log('\n[6] 다른 타이머가 본문을 되풀이해 받지 않는다');
  const others = await page.evaluate(() => {
    const out = [];
    /* 소스에서 setInterval 을 찾아, 그 안에서 body 를 받는 것이 있는지 본다 */
    const txt = document.documentElement.innerHTML;
    const re = /setInterval\(([\s\S]{0,400}?),\s*(\d+)\s*\)/g;
    let m;
    while ((m = re.exec(txt))) {
      const secs = +m[2] / 1000;
      if (secs > 0 && secs < 120 && /body/.test(m[1])) out.push(Math.round(secs) + '초 · ' + m[1].slice(0, 60));
    }
    return out;
  });
  is(others.length === 0, '  2분 안쪽으로 본문을 받는 타이머가 없다' +
     (others.length ? ' — ' + others.join(' / ') : ''));

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '서버 사용량 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '서버 사용량 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
