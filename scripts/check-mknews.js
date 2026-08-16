/* 미끼 레이더 — 사무실 PC 없이 오늘 뉴스가 들어오는가.

   여태 뉴스 수집은 사무실 PC 의 「시작.bat」 이 했다. 그 컴퓨터를 켜 놓고
   와야만 오늘 기사를 볼 수 있었다. 출장 중이면 방법이 없었다.

   그런데 필요한 것은 이미 다 있었다.

     config/sources.json 의 「보험」 칸    보험신문·한국보험신문·매경·한경 RSS
     /api/market?kind=news&cat=보험       그걸 모아 주는 서버 창구
     미끼 레이더 안의 ingest(items)       받은 기사를 미끼 점수로 세우는 함수

   <b>미끼 레이더만 그 길을 안 쓰고 있었다.</b> 그 셋을 이었다.

   여기서 확인한다.

     1. 단추가 있고 눌리는가
     2. 앱 안에서 열면 토큰을 달고 부르는가 (서버가 SHARED_TOKEN 으로 막는다)
     3. 받은 기사가 진짜로 화면에 들어오는가
     4. 보험 기사가 아닌 것은 걸러 내고 <b>남은 수</b>를 말하는가
     5. 막히거나 비었을 때 조용히 끝나지 않고 이유를 말하는가
        — 특히 함수가 안 올라간 배포에서 되돌림 규칙 때문에 404 가 아니라
          앱 첫 화면 HTML 이 200 으로 오는 자리
     6. 앱 밖에서 파일만 열었을 때도 그렇다고 말해 주는가              */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const TOKEN = 'test-shared-token';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const APP_HTML = '<!doctype html><html><head><title>APEX YUN PRO</title></head><body>앱 첫 화면</body></html>';

const NEWS_INS = [
  { title: '금감원, 실손보험 청구 간소화 시행령 확정', link: 'https://x/1', date: '2026-08-15', source: '보험신문', desc: '' },
  { title: '생보사 뇌·심장 진단비 담보 한도 상향', link: 'https://x/2', date: '2026-08-15', source: '한국경제', desc: '' },
  { title: '손보 빅4, 암 보험금 지급 기준 손질', link: 'https://x/3', date: '2026-08-14', source: '매일경제', desc: '' }
];
const NEWS_OTHER = [
  { title: '반도체 수출 3개월 연속 증가', link: 'https://x/9', date: '2026-08-15', source: '매일경제', desc: '' },
  { title: '서울 아파트 거래량 회복세', link: 'https://x/8', date: '2026-08-14', source: '한국경제', desc: '' }
];

/* 서버가 어떻게 답할지 — 시험 중에 바꿔 가며 본다 */
let MODE = 'ok';
let seen = null;   /* 마지막으로 받은 요청 (헤더·주소) */

const srv = http.createServer((rq, rs) => {
  const u = url.parse(rq.url);
  let p = decodeURIComponent(u.pathname);

  if (p === '/api/market') {
    seen = { query: u.query || '', token: rq.headers['x-app-token'] || '' };
    const j = (o, code) => { rs.writeHead(code || 200, { 'Content-Type': 'application/json; charset=utf-8' });
                             rs.end(JSON.stringify(o)); };
    /* 배포에 함수가 안 올라갔을 때 — 되돌림 규칙이 앱 화면을 200 으로 준다 */
    if (MODE === 'nofunc') { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(APP_HTML); return; }
    if (MODE === 'down') return j({ ok: false, message: '자료를 가져오지 못했습니다.' }, 500);
    if (seen.token !== TOKEN) return j({ ok: false, message: '토큰이 올바르지 않습니다.' }, 401);
    if (MODE === 'empty') return j({ ok: true, news: [], keywords: [] });
    if (MODE === 'other') return j({ ok: true, news: NEWS_OTHER, keywords: [] });
    if (MODE === 'mixed') return j({ ok: true, news: NEWS_INS.concat(NEWS_OTHER), keywords: [] });
    return j({ ok: true, news: NEWS_INS, keywords: [] });
  }

  /* 앱이 미끼 레이더를 품고 있는 모양 그대로 흉내 낸다 */
  if (p === '/__app.html') {
    rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    rs.end('<!doctype html><html><head><meta charset="utf-8"><title>APEX</title></head><body>' +
           '<script>function getAppToken(){return ' + JSON.stringify(TOKEN) + ';}<\/script>' +
           '<iframe id="mk" style="width:1200px;height:900px;border:0" ' +
           'src="/app/%EC%83%81%EB%8B%B4%EC%9E%90%EB%A3%8C/%EB%AF%B8%EB%81%BC%EB%A0%88%EC%9D%B4%EB%8D%94/index.html"></iframe>' +
           '</body></html>');
    return;
  }

  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const idx = path.join(f, 'index.html');
    if (fs.existsSync(idx)) f = idx;
    else { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(APP_HTML); return; }
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 「모으는 중…」 이 끝날 때까지 기다렸다가 나온 말을 읽는다 */
async function pressAndRead(fr) {
  await fr.evaluate(() => document.getElementById('mknBtn').click());
  await fr.waitForFunction(() => {
    const e = document.getElementById('mknMsg');
    return e && e.textContent && !/모으는 중/.test(e.textContent);
  }, null, { timeout: 20000 });
  return await fr.evaluate(() => document.getElementById('mknMsg').textContent || '');
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));

  await page.goto(base + '/__app.html', { waitUntil: 'domcontentloaded' });
  const fh = await page.waitForSelector('#mk');
  const fr = await fh.contentFrame();
  await fr.waitForFunction(() => typeof ingest === 'function', null, { timeout: 30000 });
  await fr.waitForFunction(() => !!document.getElementById('mknOpen'), null, { timeout: 30000 });

  console.log('\n[1] 단추가 있고, 눌러야 판이 열린다');
  const openTxt = await fr.evaluate(() => document.getElementById('mknOpen').textContent);
  is(/뉴스 모아 오기/.test(openTxt), '「🌐 뉴스 모아 오기」 단추가 있다 — ' + openTxt);
  is(await fr.evaluate(() => !document.getElementById('mknBox')), '누르기 전에는 판이 안 떠 있다');
  /* 화면에 잠금 덮개가 있어 마우스가 안 닿는다 — 직접 누른다 */
  await fr.evaluate(() => document.getElementById('mknOpen').click());
  await fr.waitForSelector('#mknBtn', { timeout: 10000 });
  const boxTxt = await fr.evaluate(() => document.getElementById('mknBox').textContent);
  is(/사무실 PC/.test(boxTxt), '  사무실 PC 없이 된다고 적혀 있다');
  is(/뉴스만/.test(boxTxt) && /약관/.test(boxTxt),
     '  <b>뉴스만</b>이고 약관은 직접 올려야 한다고 밝혀 둔다 — 못 하는 일을 된다고 하지 않는다');

  console.log('\n[2] 앱 안에서 열면 토큰을 달고 부른다');
  MODE = 'ok';
  let msg = await pressAndRead(fr);
  is(seen && seen.token === TOKEN, '  X-App-Token 을 붙여 보낸다 (없으면 서버가 401 로 막는다)');
  is(seen && /kind=news/.test(seen.query) && /cat=%EB%B3%B4%ED%97%98|cat=보험/.test(decodeURIComponent(seen.query) + seen.query),
     '  보험 칸을 부른다 — ' + (seen ? seen.query : ''));

  console.log('\n[3] 받은 기사가 진짜로 화면에 들어온다');
  is(/3건이 들어왔습니다/.test(msg), '  들어온 건수를 말한다 — ' + msg.slice(0, 40));
  const got = await fr.evaluate(() => ({
    n: (typeof state !== 'undefined' && state.news) ? state.news.length : -1,
    first: (typeof state !== 'undefined' && state.news && state.news[0]) ? state.news[0].title : '',
    stat: (document.getElementById('stNews') || {}).textContent || '',
    saved: (JSON.parse(localStorage.getItem('mikki_news') || '[]') || []).length
  }));
  is(got.n === 3, '  목록에 3건이 앉았다 — ' + got.n + '건');
  is(/실손|진단비|암/.test(got.first), '  미끼 점수 높은 것이 맨 위다 — ' + got.first.slice(0, 30));
  is(/3/.test(got.stat), '  위쪽 「뉴스 N건」 도 같이 바뀐다 — ' + got.stat.trim());
  is(got.saved === 3, '  껐다 켜도 남게 저장한다 — ' + got.saved + '건');

  console.log('\n[4] 보험 기사가 아닌 것은 걸러 내고, 남은 수를 말한다');
  MODE = 'mixed';
  msg = await pressAndRead(fr);
  is(/3건이 들어왔습니다/.test(msg), '  5건 받아 3건만 남긴다 — ' + msg.slice(0, 30));
  is(/5건 중/.test(msg), '  받은 수도 같이 밝힌다 (숫자가 줄어든 이유) — ' + msg.slice(-40));
  is(await fr.evaluate(() => state.news.length) === 3, '  목록도 3건이다');

  MODE = 'other';
  msg = await pressAndRead(fr);
  is(/보험 기사가 하나도 없었습니다/.test(msg), '  보험 기사가 하나도 없으면 그렇게 말한다 — ' + msg.slice(0, 40));

  console.log('\n[5] 안 될 때 조용히 끝나지 않는다');
  MODE = 'empty';
  msg = await pressAndRead(fr);
  is(/가져온 뉴스가 없습니다/.test(msg), '  0건이면 0건이라고 말한다 — ' + msg.slice(0, 30));

  MODE = 'nofunc';
  msg = await pressAndRead(fr);
  is(/api\/market/.test(msg) && /배포/.test(msg),
     '  함수가 안 올라간 배포(앱 화면이 200 으로 옴)에서도 이유를 말한다 — ' + msg.slice(0, 50));
  is(!/JSON|Unexpected|token <|SyntaxError/i.test(msg), '  영어 오류를 그대로 던지지 않는다');

  MODE = 'down';
  msg = await pressAndRead(fr);
  is(/500/.test(msg), '  서버가 앓으면 몇 번으로 답했는지 말한다 — ' + msg.slice(0, 40));

  const still = await fr.evaluate(() => ({
    n: state.news.length,
    on: !document.getElementById('mknBtn').disabled,
    txt: document.getElementById('mknBtn').textContent
  }));
  is(still.n === 0 || still.n === 3, '  실패해도 보던 목록을 망가뜨리지 않는다');
  is(still.on && /뉴스 모아 오기/.test(still.txt), '  실패한 뒤에도 단추가 다시 눌린다 — ' + still.txt);

  console.log('\n[6] 앱 밖에서 파일만 열면 그렇다고 말해 준다');
  MODE = 'ok';
  const solo = await ctx.newPage();
  const soloErrs = [];
  solo.on('pageerror', e => soloErrs.push(String(e).slice(0, 140)));
  await solo.goto(base + '/app/상담자료/미끼레이더/index.html', { waitUntil: 'domcontentloaded' });
  await solo.waitForFunction(() => !!document.getElementById('mknOpen'), null, { timeout: 30000 });
  await solo.evaluate(() => document.getElementById('mknOpen').click());
  await solo.waitForSelector('#mknBtn', { timeout: 10000 });
  seen = null;
  msg = await pressAndRead(solo);
  is(seen && seen.token === '', '  부모가 없으면 토큰 없이 부른다 (있는 척하지 않는다)');
  is(/앱 안에서 열어 주세요/.test(msg), '  막히면 어떻게 하면 되는지 말한다 — ' + msg.slice(0, 40));
  is(soloErrs.length === 0, '  혼자 열어도 안 터진다' + (soloErrs.length ? ' — ' + soloErrs[0] : ''));

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '뉴스 모아 오기 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '뉴스 모아 오기 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
