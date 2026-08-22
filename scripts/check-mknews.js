/* 미끼 레이더 — 사무실 PC 없이 오늘 뉴스가 들어오는가.

   여태 뉴스 수집은 사무실 PC 의 「시작.bat」 이 했다. 그 컴퓨터를 켜 놓고
   와야만 오늘 기사를 볼 수 있었다. 출장 중이면 방법이 없었다.

   그런데 필요한 것은 이미 다 있었다.

     config/sources.json 의 「보험」 칸    보험신문·한국보험신문·매경·한경 RSS
     /api/market?kind=news&cat=보험       그걸 모아 주는 서버 창구
     미끼 레이더 안의 ingest(items)       받은 기사를 미끼 점수로 세우는 함수

   <b>미끼 레이더만 그 길을 안 쓰고 있었다.</b> 그 셋을 이었다.

   여기서 확인한다.

     0. 들어가면 <b>누르지 않아도</b> 오늘 뉴스가 들어오는가
        — 그리고 이미 기사가 있으면 다시 안 부르는가 (보시던 것을 안 갈아엎는다)
     1. 단추가 있고 눌리는가
     2. 앱 안에서 열면 토큰을 달고 부르는가 (서버가 SHARED_TOKEN 으로 막는다)
     3. 받은 기사가 진짜로 화면에 들어오는가
     4. 보험 기사가 아닌 것은 걸러 내고 <b>남은 수</b>를 말하는가
     5. 막히거나 비었을 때 조용히 끝나지 않고 이유를 말하는가
        — 특히 함수가 안 올라간 배포에서 되돌림 규칙 때문에 404 가 아니라
          앱 첫 화면 HTML 이 200 으로 오는 자리
     6. 앱 밖에서 파일만 열었을 때도 그렇다고 말해 주는가
     7. 사용 안내가 아직 「태블릿에서 뉴스 수집은 안 됩니다」 라고
        남아 있지 않은가 — 되는 일을 안 된다고 두면 안 쓰시게 된다
     8. 「▶ 오늘 것 찾기」 한 번이 시작.bat 을 그대로 대신하는가
        — 뉴스 → 훅 → 서재 → 판정 → 정리 다섯 걸음이 끝까지 도는가
     9. 화면 <b>어디에도</b> 「bat 을 눌러라」 가 안 남아 있는가
        — 한 군데라도 남으면 「또 눌러야 하나」 싶어진다        */
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
/* 보험은 아니지만 이제는 남겨야 하는 것 — 부동산·정책자금·세금 */
const NEWS_OTHER = [
  { title: '반도체 수출 3개월 연속 증가', link: 'https://x/9', date: '2026-08-15', source: '매일경제', desc: '' },
  { title: '서울 아파트 거래량 회복세', link: 'https://x/8', date: '2026-08-14', source: '한국경제', desc: '' }
];
/* 사업자·세금 기사 — 넓힌 그물이 이걸 잡아야 한다 */
const NEWS_BIZ = [
  { title: '소상공인 정책자금 500억 추가 공모… 다음 달 3일부터 접수', link: 'https://x/7', date: '2026-08-15', source: '연합뉴스', desc: '' },
  { title: '종합소득세 세액공제 한도 상향 시행령 개정', link: 'https://x/6', date: '2026-08-15', source: '한국경제', desc: '' }
];
/* 어느 주제에도 안 걸리는 것 — 이건 여전히 버려야 한다 */
const NEWS_JUNK = [
  { title: '프로야구 오늘의 경기 결과', link: 'https://x/5', date: '2026-08-15', source: '연합뉴스', desc: '' },
  { title: '주말 전국 흐리고 곳에 따라 비', link: 'https://x/4', date: '2026-08-15', source: '연합뉴스', desc: '' }
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
    if (MODE === 'biz') return j({ ok: true, news: NEWS_BIZ, keywords: [] });
    if (MODE === 'junk') return j({ ok: true, news: NEWS_JUNK, keywords: [] });
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
  let fr = await fh.contentFrame();
  await fr.waitForFunction(() => typeof ingest === 'function', null, { timeout: 30000 });
  await fr.waitForFunction(() => !!document.getElementById('mknOpen'), null, { timeout: 30000 });

  console.log('\n[0] 들어가면 누르지 않아도 오늘 뉴스가 들어온다');
  /* 「집에서 열었더니 텅 비어 있더라」 — 그 자리를 없앴다 */
  await fr.waitForFunction(() => typeof state !== 'undefined' && state.news && state.news.length > 0,
                           null, { timeout: 25000 });
  const auto0 = await fr.evaluate(() => ({
    n: state.news.length, pill: document.getElementById('mknOpen').textContent
  }));
  is(auto0.n === 3, '  아무것도 안 눌렀는데 3건이 들어와 있다 — ' + auto0.n + '건');
  is(/뉴스 3건/.test(auto0.pill), '  단추가 몇 건인지 보여 준다 — ' + auto0.pill);
  is(seen && seen.token === TOKEN, '  스스로 부를 때도 토큰을 붙인다');

  /* 이미 기사가 있으면 다시 안 가져온다 — 보시던 것을 갈아 치우지 않는다 */
  seen = null;
  await page.reload({ waitUntil: 'domcontentloaded' });
  const fh2 = await page.waitForSelector('#mk');
  fr = await fh2.contentFrame();
  await fr.waitForFunction(() => !!document.getElementById('mknOpen'), null, { timeout: 30000 });
  await fr.waitForFunction(() => typeof state !== 'undefined' && state.news && state.news.length > 0,
                           null, { timeout: 25000 });
  await page.waitForTimeout(2000);
  is(seen === null, '  이미 기사가 있으면 다시 안 부른다 (보시던 목록을 갈아 치우지 않는다)');

  console.log('\n[1] 단추가 있고, 눌러야 판이 열린다');
  const openTxt = await fr.evaluate(() => document.getElementById('mknOpen').textContent);
  is(/🌐 뉴스/.test(openTxt), '「🌐 뉴스」 단추가 있다 — ' + openTxt);
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
  const askedCats = seen ? decodeURIComponent(seen.query) : '';
  is(/kind=news/.test(seen ? seen.query : ''), '  뉴스를 부른다');
  /* 예전에는 보험 칸 하나만 불렀다. 그래서 정책자금·세금·부동산은
     서버에서 아예 오지도 않았다. */
  ['보험', '경제', '부동산', '생활정책', '정책자금'].forEach(c =>
    is(askedCats.indexOf(c) >= 0, '  ' + c + ' 칸을 부른다'));

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

  console.log('\n[4] 쓸 주제만 남기고, 남은 수를 말한다');
  MODE = 'mixed';
  msg = await pressAndRead(fr);
  /* 보험 3 + 아파트(부동산) 1 = 4. 반도체 기사는 어느 주제에도 안 걸려 버린다.
     예전에는 보험이 아니면 무조건 버려서 3건이었다. */
  is(/4건이 들어왔습니다/.test(msg), '  5건 받아 4건 남긴다 — 부동산 기사도 이제 남는다 — ' + msg.slice(0, 30));
  is(/5건 중/.test(msg), '  받은 수도 같이 밝힌다 (숫자가 줄어든 이유) — ' + msg.slice(-40));
  let ttl = await fr.evaluate(() => state.news.map(n => n.title));
  is(ttl.length === 4, '  목록도 4건이다');
  is(ttl.some(x => /아파트/.test(x)), '  부동산 기사가 남았다');
  is(!ttl.some(x => /반도체/.test(x)), '  어느 주제에도 안 걸리는 기사는 그대로 버린다');

  console.log('\n[4-2] 사업자·세금 기사도 잡는다');
  MODE = 'biz';
  msg = await pressAndRead(fr);
  is(/2건이 들어왔습니다/.test(msg), '  정책자금·세금 기사 2건이 다 남는다 — ' + msg.slice(0, 30));
  const biz = await fr.evaluate(() => state.news.map(n => ({ t: n.title, g: n.tags, s: n.score })));
  is(biz.some(x => (x.g || []).indexOf('정책자금') >= 0), '  「정책자금」 이름표가 붙는다');
  is(biz.some(x => (x.g || []).indexOf('세금') >= 0), '  「세금」 이름표가 붙는다');
  /* 마감이 있는 자금 기사가 사업자에게는 제일 센 미끼다 */
  const fund = biz.filter(x => /정책자금 500억/.test(x.t))[0];
  is(fund && fund.s >= 60, '  기한이 있는 자금 기사는 미끼 점수가 높다 — ' + (fund ? fund.s : '-'));

  MODE = 'junk';
  msg = await pressAndRead(fr);
  is(/쓸 만한 기사가 하나도 없었습니다/.test(msg), '  쓸 주제가 하나도 없으면 그렇게 말한다 — ' + msg.slice(0, 40));

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
  seen = null;
  await solo.waitForTimeout(2000);
  is(seen === null, '  토큰이 없으면 스스로 부르지 않는다 (열자마자 빨간 글씨만 뜨지 않게)');
  await solo.evaluate(() => document.getElementById('mknOpen').click());
  await solo.waitForSelector('#mknBtn', { timeout: 10000 });
  seen = null;
  msg = await pressAndRead(solo);
  is(seen && seen.token === '', '  부모가 없으면 토큰 없이 부른다 (있는 척하지 않는다)');
  is(/앱 안에서 열어 주세요/.test(msg), '  막히면 어떻게 하면 되는지 말한다 — ' + msg.slice(0, 40));
  is(soloErrs.length === 0, '  혼자 열어도 안 터진다' + (soloErrs.length ? ' — ' + soloErrs[0] : ''));

  console.log('\n[7] 사용 안내가 「안 된다」 고 남아 있지 않다');
  /* 되는 일을 안 된다고 적어 두면, 사장님은 되는 줄 모르고 안 쓰신다 */
  const gp = await ctx.newPage();
  const gErrs = [];
  gp.on('pageerror', e => gErrs.push(String(e).slice(0, 140)));
  await gp.goto(base + '/app/상담자료/미끼레이더/사용안내.html', { waitUntil: 'load' });
  await gp.waitForFunction(() => !!document.querySelector('.wrap.__mkn, .wrap'), null, { timeout: 15000 });
  await gp.waitForFunction(() => /달라진 것/.test(document.body.innerText), null, { timeout: 15000 });
  const g = await gp.evaluate(() => {
    const row = [...document.querySelectorAll('tr')].find(t => /태블릿에서 뉴스 수집/.test(t.textContent));
    return { first: (document.querySelector('.card h2') || {}).textContent || '',
             mark: row ? (row.querySelector('td') || {}).textContent : '',
             row: row ? row.textContent.replace(/\s+/g, ' ') : '',
             python: /파이썬이 필요합니다/.test(document.body.innerText),
             onlyNews: /뉴스만입니다/.test(document.body.innerText) };
  });
  is(/달라진 것/.test(g.first), '  맨 위에 달라진 것을 알린다 — ' + g.first);
  is(g.mark === '✓' && !g.python, '  「✕ 태블릿에서 뉴스 수집」 이 ✓ 로 바뀌었다');
  is(/뉴스 모아 오기/.test(g.row), '  어디를 누르면 되는지 적어 뒀다');
  is(g.onlyNews, '  뉴스만이고 약관은 직접 올려야 한다고 안내문에도 적혀 있다');
  const routine = await gp.evaluate(() => {
    const f = [...document.querySelectorAll('.flow')].find(x => /오늘 것 찾기|시작\.bat/.test(x.textContent));
    const ok = [...document.querySelectorAll('.ok')].find(x => /손대는 건 3가지/.test(x.textContent));
    return { flow: f ? f.textContent.replace(/\s+/g, ' ') : '',
             three: ok ? ok.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(/오늘 것 찾기/.test(routine.flow) && !/시작\.bat 더블클릭/.test(routine.flow),
     '  매달 순서가 「시작.bat 더블클릭」 에서 「▶ 오늘 것 찾기」 로 바뀌었다');
  is(/여러 개 한꺼번에/.test(routine.flow), '  약관은 화면에 여러 개 끌어다 놓는 것으로 적혀 있다');
  is(/오늘 것 찾기/.test(routine.three) && !/시작\.bat/.test(routine.three),
     '  「손대는 건 3가지」 에서도 bat 이 빠졌다 — ' + routine.three.slice(0, 52));
  is(gErrs.length === 0, '  안내문이 안 터진다' + (gErrs.length ? ' — ' + gErrs[0] : ''));

  console.log('\n[8] 「▶ 오늘 것 찾기」 한 번이면 시작.bat 을 대신한다');
  /* bat 이 하던 다섯 걸음(뉴스 → 훅 → 서재 → 판정 → 정리)이 이 화면 안에
     다 있었다. 막힌 곳은 ① 뉴스 하나뿐이었다 — data/news.json 은 사무실
     PC 가 만드는 파일이라 웹에는 없다. 그 자리를 서버로 이었다.        */
  MODE = 'ok';
  const page2 = await ctx.newPage();
  const e2 = [];
  page2.on('pageerror', e => e2.push(String(e).slice(0, 140)));
  await page2.goto(base + '/__app.html', { waitUntil: 'domcontentloaded' });
  const fh3 = await page2.waitForSelector('#mk');
  const f3 = await fh3.contentFrame();
  await f3.waitForFunction(() => typeof goRun === 'function' && typeof uploadFiles === 'function',
                           null, { timeout: 30000 });
  await f3.waitForFunction(() => !!document.getElementById('noBatNote'), null, { timeout: 20000 });

  const note = await f3.evaluate(() => document.getElementById('noBatNote').textContent);
  is(/시작.bat.*대신/.test(note.replace(/\s+/g, '')) || /대신합니다/.test(note),
     '  시작 화면이 「이 단추가 시작.bat 을 대신합니다」 라고 알려 준다');
  is(/사무실 PC/.test(note), '  사무실 PC 를 안 켜도 된다고 적혀 있다');

  /* 약관 한 건을 서재에 올린다 — uploadFiles 는 txt 도 받는다.
     한글 파일 이름은 시험 도구가 못 붙여서 영문으로 만든다.          */
  const tmp = path.join(require('os').tmpdir(), 'terms-sample.txt');
  fs.writeFileSync(tmp,
    '제1조(목적) 이 약관은 보험계약에 관한 사항을 정함을 목적으로 합니다.\n' +
    '제3조(보험금의 지급사유) 회사는 피보험자가 보험기간 중 암으로 진단확정된 경우 ' +
    '암진단보험금을 지급합니다. 다만 계약일부터 90일이 지나지 아니한 때에는 지급하지 아니합니다.\n' +
    '제5조(보험금을 지급하지 않는 사유) 회사는 피보험자가 고의로 자신을 해친 경우 ' +
    '보험금을 지급하지 않습니다. 갱신형 특약의 보험료는 갱신 시점의 나이와 위험률에 따라 인상될 수 있습니다.\n' +
    '제7조(감액지급) 계약일부터 1년 이내에 보험금 지급사유가 발생한 경우 보험금의 50퍼센트를 감액하여 지급합니다.\n');
  await f3.evaluate(() => { const t = [...document.querySelectorAll('.tab')].find(x => x.dataset.t === 'lib'); if (t) t.click(); });
  await f3.setInputFiles('#upFiles', tmp);
  await f3.waitForFunction(() => /쌓았습니다/.test((document.getElementById('upState') || {}).innerHTML || ''),
                           null, { timeout: 30000 });
  const libN = await f3.evaluate(() => ((state.lib && state.lib.items) || []).length);
  is(libN >= 1, '  약관을 화면에서 바로 쌓는다 (bat 없이) — 서재 ' + libN + '건');

  /* 이제 「오늘 것 찾기」 한 번 */
  await f3.evaluate(() => { const t = [...document.querySelectorAll('.tab')].find(x => x.dataset.t === 'start'); if (t) t.click(); });
  seen = null;
  await f3.evaluate(() => { state.news = []; document.getElementById('btnGo').click(); });
  await f3.waitForFunction(() => /완료|오류/.test((document.getElementById('goState') || {}).textContent || ''),
                           null, { timeout: 60000 });
  const run = await f3.evaluate(() => ({
    state: (document.getElementById('goState') || {}).textContent || '',
    out: (document.getElementById('goOut') || {}).textContent || '',
    news: state.news.length,
    hint: (document.getElementById('loadHint') || {}).textContent || ''
  }));
  is(/완료/.test(run.state), '  다섯 걸음이 끝까지 돈다 — ' + run.state.trim());
  is(run.news > 0, '  ① 뉴스가 서버에서 들어온다 (data/news.json 없이) — ' + run.news + '건');
  is(seen && seen.token === TOKEN, '  그때도 토큰을 붙여 부른다');
  is(!/시작\.bat/.test(run.hint), '  「시작.bat 으로 여세요」 가 더는 안 뜬다 — ' + run.hint.slice(0, 40));
  is(/접촉 명분|이달의 훅/.test(run.out), '  ② 이달의 훅이 뽑힌다');
  is(/약관 판정/.test(run.out), '  ④ 약관 판정 표가 나온다');
  is(/1건 판정|약관 1건/.test(run.out.replace(/\s+/g, ' ')) || /감액|갱신/.test(run.out),
     '  올린 약관이 실제로 판정된다');

  console.log('\n[9] 화면 어디에도 「bat 을 눌러라」 가 안 남아 있다');
  /* 한 군데라도 남아 있으면 「또 bat 을 눌러야 하나」 싶어진다.
     앞서 두 군데만 고쳤다가, 훑어보니 아홉 군데가 더 있었다.     */
  await f3.evaluate(() => { const t = [...document.querySelectorAll('.tab')].find(x => x.dataset.t === 'lib'); if (t) t.click(); });
  await f3.waitForTimeout(400);
  const lib = await f3.evaluate(() => ({
    hint: (document.getElementById('libHint') || {}).textContent || '',
    multi: !!document.querySelector('#upFiles[multiple]')
  }));
  is(!/\.bat|상품총서/.test(lib.hint), '  「상품총서_적재.bat」 안내가 사라졌다');
  is(/한꺼번에/.test(lib.hint), '  대신 「여러 개 한꺼번에 끌어다 놓으세요」 라고 적혀 있다');
  is(/서버로 올라가지 않습니다/.test(lib.hint), '  약관이 서버로 안 간다는 것도 밝혀 둔다');
  is(lib.multi, '  PDF 를 여러 개 한꺼번에 받는 칸이다');

  /* 화면 전체를 훑는다 — 열세 칸에 <b>떠 있는 판까지</b> 다.
     앞서는 section.page 만 봐서, 「📂 자료 폴더」 처럼 눌러야 뜨는
     판에 남은 한 군데를 놓쳤다. 이제 그것들도 열어 놓고 훑는다. */
  await f3.evaluate(() => {
    try{ if(typeof mkdPanel==='function'&&!document.getElementById('mkdBox'))mkdPanel(); }catch(e){}
    try{ if(typeof mkMovePanel==='function'&&!document.getElementById('mkMoveBox'))mkMovePanel(); }catch(e){}
    try{ if(typeof tvPanel==='function'&&!document.getElementById('tvBox'))tvPanel(); }catch(e){}
  });
  await f3.waitForTimeout(500);
  const sweep = await f3.evaluate(() => {
    const bad = [];
    document.querySelectorAll('section.page, #mkdBox, #mkMoveBox, #tvBox, #mknBox').forEach(p => {
      /* 「이 단추가 시작.bat 을 대신합니다」 는 알려 주려고 적은 것이다 */
      const note = p.querySelector('#noBatNote');
      const t = (p.textContent || '').replace(note ? note.textContent : '\u0000', '');
      const m = t.match(/[가-힣A-Za-z_]*\.bat/g);
      if (m) bad.push((p.id || p.className) + ': ' + [...new Set(m)].join(','));
    });
    return { bad, left: typeof batLeft === 'function' ? batLeft() : -1 };
  });
  is(sweep.bad.length === 0,
     '  열세 칸에도, 눌러야 뜨는 판에도 bat 이 안 적혀 있다' +
     (sweep.bad.length ? ' — 남음: ' + sweep.bad.join(' / ') : ''));
  is(sweep.left === 0, '  안내 상자·표에도 안 남았다 — ' + sweep.left + '군데');

  /* 「데이터 불러오기」 단추는 감싸기 전 함수를 붙잡고 있었다 —
     그래서 이 단추로만 「시작.bat 으로 여세요」 가 계속 떴다.      */
  await f3.evaluate(() => { const t = [...document.querySelectorAll('.tab')].find(x => x.dataset.t === 'radar'); if (t) t.click(); });
  await f3.evaluate(() => { state.news = []; });
  seen = null;
  await f3.evaluate(() => document.getElementById('btnSync').click());
  await f3.waitForFunction(() => typeof state !== 'undefined' && state.news.length > 0, null, { timeout: 25000 });
  const hint2 = await f3.evaluate(() => (document.getElementById('loadHint') || {}).textContent || '');
  is(!/\.bat/.test(hint2), '  「데이터 불러오기」 단추를 눌러도 bat 이 안 뜬다 — ' + hint2.slice(0, 44));
  is(/서버에서 오늘 보험 뉴스/.test(hint2), '  대신 서버에서 받았다고 말한다');
  is(seen && seen.token === TOKEN, '  그 단추도 서버를 부른다');

  is(e2.length === 0, '  이 화면이 안 터진다' + (e2.length ? ' — ' + e2[0] : ''));
  try { fs.unlinkSync(tmp); } catch (e) {}

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n[12] 회사별 신상품 — 어느 회사가 무엇을 냈나');
  /* 「왜 뉴스만 찾느냐」는 물음에서 나온 칸이다. 여태 이 화면은 신문 RSS
     세 개만 봤고 <b>어느 회사가 지금 무엇을 파는가</b>를 보는 창구가 없었다.
     보험사는 상품을 내면 보도자료를 뿌리고 그게 기사가 된다 — 상품명도
     홍보 문구도 거기 있다. 그것을 회사별로 묶는 칸이 이번에 생겼다.       */
  {
    /* 이 묶음은 브라우저가 살아 있는 자리에서 돌아야 해서 위로 올라왔다.
       아래에서 읽는 src·mk 보다 앞이라 <b>여기서 따로 읽는다.</b>      */
    const src = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));
    const mk  = fs.readFileSync('app/상담자료/미끼레이더/index.html', 'utf8');
    /* 소스 칸이 있는가 — 없으면 서버가 부를 것이 없다 */
    is(Array.isArray(src['보험사']) && src['보험사'].length >= 3,
       '  config 에 「보험사」 칸이 있다 — ' + ((src['보험사'] || []).length) + '개');
    (src['보험사'] || []).forEach(f => {
      is(/^https:\/\//.test(f.url || ''), '  ' + (f.name || '?') + ' 에 https 주소가 있다');
      /* gnews 표시가 없으면 <b>언론사 칸에 질의문이 찍힌다</b> —
         「보험 상품 출시」 가 언론사인 척 나온다.                        */
      is(f.gnews === true, '  ' + (f.name || '?') + ' 에 gnews 표시가 있다 — 진짜 언론사를 따로 읽는다');
    });
    /* 회사마다 따로 부르면 열아홉 번이다. 무료 한도를 세 배로 넘긴 적이 있다 */
    is((src['보험사'] || []).length <= 5,
       '  피드가 다섯을 넘지 않는다 — 서버를 아껴 쓴다 (' + ((src['보험사'] || []).length) + '개)');

    /* 서버가 모으는 쪽 — 진짜 구글 뉴스 모양을 먹여 <b>언론사가 바뀌는지</b> 본다 */
    const mkfn = require(path.join(ROOT, 'netlify/functions/market.js'));
    const realXml =
      '<rss><channel>' +
      '<item><title>삼성생명, ‘삼성 한번에내는연금보험’ 출시 - 보험신보</title>' +
      '<link>https://example.test/g1</link><pubDate>Tue, 18 Aug 2026 00:27:00 GMT</pubDate>' +
      '<source url="https://www.insweek.co.kr">보험신보</source></item>' +
      '<item><title>DB손해보험, ‘참좋은운전자보험’ 출시 - 한국보험신문</title>' +
      '<link>https://example.test/g2</link><pubDate>Wed, 12 Aug 2026 02:17:19 GMT</pubDate>' +
      '<source url="https://www.inspress.co.kr">한국보험신문</source></item>' +
      '</channel></rss>';
    const realFetch = global.fetch;
    global.fetch = async () => ({ ok: true, status: 200, text: async () => realXml });
    let out = [];
    try {
      const rr = await mkfn.handler({ httpMethod: 'GET',
        queryStringParameters: { kind: 'news', cat: '보험사' }, headers: {} });
      out = (JSON.parse(rr.body).news) || [];
    } catch (e) { out = []; }
    global.fetch = realFetch;

    is(out.length >= 2, '  서버가 「보험사」 칸을 모아 준다 — ' + out.length + '건');
    const one = out[0] || {};
    is(one.source === '보험신보' || one.source === '한국보험신문',
       '  언론사 칸에 <b>진짜 언론사</b>가 들어간다 — ' + (one.source || '없음'));
    is(!/보험 상품 출시|생명보험 신상품|손해보험 신상품/.test(one.source || ''),
       '  질의문이 언론사인 척 찍히지 않는다');
    is(out.every(x => !/ - (보험신보|한국보험신문)$/.test(x.title || '')),
       '  제목 끝의 「 - 언론사」 꼬리를 뗀다');

    /* 화면 쪽 — 회사와 상품명을 제목에서 읽는가 */
    await page.goto(base + '/app/상담자료/미끼레이더/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const rd = await page.evaluate(() => {
      if (typeof npcoCoOf !== 'function') return null;
      return {
        co1: npcoCoOf('삼성생명, ‘삼성 한번에내는연금보험’ 출시'),
        co2: npcoCoOf('DB손해보험, ‘참좋은운전자보험’ 선보여'),
        co3: npcoCoOf('금감원, 실손보험 비급여 기준 개정 예고'),
        p1: npcoProdOf('삼성생명, ‘삼성 한번에내는연금보험’ 출시'),
        p2: npcoProdOf('생명보험사, 복합형 종신보험 확대'),
        p3: npcoProdOf("KB손해보험, '건강관리·3대 질병 보장' 결합...‘헬스케어+ 건강보험’ 출시"),
        /* 신문마다 괄호를 넣었다 뺐다 한다 — 견줄 때 괄호를 털어야 같은 상품이 된다 */
        same: (typeof npcoFlat === 'function')
          && npcoFlat('KB다이렉트 핏테크 건강보험') === npcoFlat('KB다이렉트 핏(Fit)테크 건강보험'),
        card: !!document.getElementById('npcoCard'),
        pulled: (npcoState() || {}).n
      };
    });
    is(!!rd, '  회사별 신상품 칸이 붙어 있다');
    if (rd) {
      is(rd.card, '  화면에 칸이 선다');
      is(rd.co1 === '삼성생명', '  「삼성생명」 을 읽는다 — ' + rd.co1);
      /* 긴 이름부터 맞춰야 「DB손해보험」 을 「DB생명」 으로 안 잡는다 */
      is(rd.co2 === 'DB손해보험', '  「DB손해보험」 을 읽는다 — ' + rd.co2);
      is(rd.co3 === null, '  회사가 아닌 것(금감원)은 안 잡는다');
      is(rd.p1 === '삼성 한번에내는연금보험', '  상품명을 따옴표에서 집는다 — ' + rd.p1);
      /* 제목에 따옴표가 여럿일 때 앞의 것은 <b>홍보 문구</b>이고 뒤가 상품명이다.
         첫 짝만 보고 포기하면 「상품명이 없다」고 잘못 적힌다 — 실제 기사에서 났다. */
      is(rd.p3 === '헬스케어+ 건강보험',
         '  홍보 문구 뒤에 숨은 상품명도 집는다 — ' + rd.p3);
      /* 신문마다 괄호를 넣었다 뺐다 한다. 「핏테크」와 「핏(Fit)테크」는 같은 상품 */
      is(rd.same, '  괄호만 다른 같은 상품을 하나로 묶는다');
      /* 따옴표가 없으면 <b>비워 둔다</b>. 제목을 잘라 상품명인 척 적으면 지어내는 것이다 */
      is(rd.p2 === '', '  따옴표가 없으면 상품명을 지어내지 않는다');
      /* 서버를 아껴 쓴다 — 안 보는 판에서는 안 부른다 */
      is(rd.pulled === 0, '  들어가기 전에는 서버를 안 부른다');
    }
    /* 기사만 보고 보장을 말하지 않는다 — 약관은 따로 봐야 한다고 적혀 있는가 */
    const npTxt = mk.slice(mk.indexOf('npcoCard'), mk.indexOf('npcoCard') + 2200);
    is(/약관이 아닙니다|약관 분석기/.test(npTxt),
       '  「기사는 약관이 아니다」 라고 적어 둔다');
  }

  await browser.close();
  srv.close();
  /* ══ 스스로 쌓기 · 자료 칸 ══════════════════════════════════ */
  console.log('\n[10] 하루 한 번 스스로 모아 달 서랍에 쌓는다');
  const mk = fs.readFileSync('app/상담자료/미끼레이더/index.html', 'utf8');
  is(/function pulledToday\(\)/.test(mk), '  오늘 모았는지 기억하는 자리가 있다');
  is(/localStorage\.setItem\('mikki_pullday'/.test(mk), '  모은 날을 적어 둔다');
  is(/if\(pulledToday\(\)\)\{/.test(mk), '  오늘 이미 모았으면 다시 안 부른다 — 서버에 미안하지 않게');
  is(/pull\(\)\.then\(function\(ok\)\{ if\(ok\)markPulled\(\); \}/.test(mk),
     '  성공했을 때만 「오늘 모았다」 로 적는다 — 실패했는데 적으면 하루를 통째로 건너뛴다');
  is(/const added=archAdd\(state\.news\)/.test(mk), '  모은 것은 달 서랍에 쌓인다');
  is(/new Date\(Date\.now\(\)\+9\*3600\*1000\)/.test(mk), '  「오늘」 은 한국 시각으로 센다');

  console.log('\n[11] 정책자금·세금·부동산까지 긁어 온다');
  const src = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));
  is(Array.isArray(src['정책자금']) && src['정책자금'].length >= 3,
     '  정책자금 피드 칸이 있다 (' + ((src['정책자금'] || []).length) + '개)');
  (src['정책자금'] || []).forEach(f =>
    is(!!f.url && /^https:\/\//.test(f.url), '  ' + (f.name || '?') + ' 에 주소가 있다'));
  [['키워드_정책자금', 60], ['키워드_세금', 50], ['키워드_부동산', 60], ['키워드_지원금혜택', 45]].forEach(([k, n]) =>
    is((src[k] || []).length >= n, '  ' + k + ' 이(가) ' + n + '개 이상이다 — 지금 ' + ((src[k] || []).length)));
  /* 없애지 않았는가 — 있던 칸이 다 살아 있어야 한다 */
  ['경제', '보험', '부동산', '생활정책', '키워드_보험핫이슈', '키워드_투자솔루션'].forEach(k =>
    is(Array.isArray(src[k]) && src[k].length > 0, '  있던 칸 「' + k + '」 이(가) 그대로 있다'));
  /* 사업자 낱말이 실제로 들어 있는가 */
  ['소상공인', '신용보증', '이차보전', '노란우산공제', '두루누리'].forEach(w =>
    is((src['키워드_정책자금'] || []).indexOf(w) >= 0, '  「' + w + '」 이(가) 낱말에 있다'));
  ['가업상속공제', '경정청구', '금융소득종합과세'].forEach(w =>
    is((src['키워드_세금'] || []).indexOf(w) >= 0, '  세금 낱말에 「' + w + '」 이(가) 있다'));
  ['스트레스 DSR', '분양가상한제', '재건축초과이익'].forEach(w =>
    is((src['키워드_부동산'] || []).indexOf(w) >= 0, '  부동산 낱말에 「' + w + '」 이(가) 있다'));

  console.log('\n──────────────────────────────');
  console.log(bad ? '뉴스 모아 오기 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '뉴스 모아 오기 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
