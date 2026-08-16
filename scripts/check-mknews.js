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

  /* 화면 전체를 훑는다 — 열 세 칸 어디에도 없어야 한다 */
  const sweep = await f3.evaluate(() => {
    const bad = [];
    document.querySelectorAll('section.page').forEach(p => {
      /* 「이 단추가 시작.bat 을 대신합니다」 는 알려 주려고 적은 것이다 */
      const note = p.querySelector('#noBatNote');
      const t = (p.textContent || '').replace(note ? note.textContent : '\u0000', '');
      const m = t.match(/[가-힣A-Za-z_]*\.bat/g);
      if (m) bad.push(p.id + ': ' + [...new Set(m)].join(','));
    });
    return { bad, left: typeof batLeft === 'function' ? batLeft() : -1 };
  });
  is(sweep.bad.length === 0,
     '  열세 칸 어디에도 bat 이 안 적혀 있다' + (sweep.bad.length ? ' — 남음: ' + sweep.bad.join(' / ') : ''));
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

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '뉴스 모아 오기 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '뉴스 모아 오기 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
