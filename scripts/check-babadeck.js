/* 전·후 프레젠테이션 — 틀은 고정, 숫자만 바뀐다.

   여태 비포&애프터는 AI 가 리포트 <b>전체</b>를 글로 썼고 그 글이 곧
   화면이었다. AI 가 흔들리면 화면이 통째로 무너졌다 — 「됐다가 안 됐다가」
   의 뿌리가 이것이다. 이제 열 장의 자리를 앱이 그리고 숫자만 갈아 끼운다.

   여기서 확인한다.

     1. AI 가 하나도 안 와도 아홉 장이 다 서는가
     2. 자료가 반쪽(기존만·신규만)이어도 안 무너지는가
     3. 숫자를 바꾸면 화면 숫자만 바뀌고 장 차례는 그대로인가
     4. 왜 못 읽었는지 <b>파일 단위로</b> 말하는가
     5. AI 답이 깨져서 와도(앞뒤에 말이 붙어도) 건져 내는가          */
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

/* 장 제목은 고정이다 — 바뀌면 상담 순서가 바뀐다 */
const SECS = ['한눈에', '3대 진단비', '주요 보장 요약', '담보별 전·후 비교',
              '가장 크게 달라지는 것', '새로 생기는 보장', '아직 비어 있는 것',
              '보험료', '오늘 정하실 것'];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 견본은 실제 고객이 아니라 「홍길동」 이다 */
  const seed = (rows) => page.evaluate((rows) => {
    BABA.rows = BABA_TERMS.map(t => {
      const v = rows[t.k];
      return { k: t.k, n: t.n, b: v ? v[0] : null, a: v ? v[1] : null, raw: '' };
    });
    BABA.ai = {}; BABA.diag = [];
    try { localStorage.setItem('apex_baba_prop', JSON.stringify({ who: '홍길동 고객님', by: '윤시현' })); } catch (e) {}
    return babaPropBodyHtml();
  }, rows);

  console.log('\n[1] AI 가 하나도 안 와도 아홉 장이 다 선다');
  const full = await seed({
    cancer: [3000, 5000], cancer2: [300, 1000], brain: [1000, 3000], mi: [1000, 2000],
    heart: [null, 2000], surg: [50, 200], inpD: [2, 5], silson: [null, 1],
    death: [5000, 5000], fee: [13, 18]
  });
  SECS.forEach(t => is(full.indexOf(t) >= 0, '  ' + t));
  is(/홍길동 고객님/.test(full), '  표지에 고객 호칭이 들어간다');
  is(!/undefined|NaN|\[object/.test(full), '  화면에 undefined · NaN 이 새어 나오지 않는다');

  console.log('\n[2] 숫자는 바뀌고 장 차례는 그대로다');
  const half = await seed({ cancer: [3000, null], brain: [1000, null] });   /* 기존만 있는 반쪽 */
  SECS.forEach(t => is(half.indexOf(t) >= 0, '  기존만 있어도 · ' + t));
  const half2 = await seed({ cancer: [null, 5000] });                        /* 신규만 있는 반쪽 */
  SECS.forEach(t => is(half2.indexOf(t) >= 0, '  신규만 있어도 · ' + t));
  const none = await seed({});                                              /* 아무것도 못 읽은 때 */
  SECS.forEach(t => is(none.indexOf(t) >= 0, '  하나도 못 읽어도 · ' + t));
  is(/확인 필요|없습니다|못했습니다/.test(none), '  빈 자리는 「확인 필요」 라고 적는다 — 0 으로 안 채운다');

  console.log('\n[3] 3대 진단비는 넓은 이름이 비면 좁은 이름으로 채운다');
  const tri = await page.evaluate(() => {
    BABA.rows = BABA_TERMS.map(t => ({ k: t.k, n: t.n, b: null, a: null }));
    /* 뇌혈관질환은 없고 뇌출혈·뇌경색만 있는 회사 서식 */
    const set = (k, b, a) => { const r = babaRowOf(k); if (r) { r.b = b; r.a = a; } };
    set('brainh', 1000, 2000); set('braini', 800, 2000);
    return { b: babaPick(['brain', 'stroke', 'brainh', 'braini'], 'b'),
             a: babaPick(['brain', 'stroke', 'brainh', 'braini'], 'a') };
  });
  is(tri.b === 1000, '  뇌 — 기존은 둘 중 큰 1,000만 (나온 값 ' + tri.b + ')');
  is(tri.a === 2000, '  뇌 — 신규는 2,000만 (나온 값 ' + tri.a + ')');

  console.log('\n[4] 왜 못 읽었는지 파일 단위로 말한다');
  const why = await page.evaluate(() => {
    BABA.rows = BABA_TERMS.map(t => ({ k: t.k, n: t.n, b: null, a: null }));
    const r = babaRowOf('cancer'); if (r) r.a = 5000;
    BABA.diag = [
      { name: '신규제안서.pdf', slot: '신규 제안서 1', old: false, kind: 'text', pages: 12, chars: 8200, chunks: 0, failed: 0, found: 6 },
      { name: '기존증권_스캔.pdf', slot: '기존 보장분석 PDF', old: true, kind: 'scan-noai', pages: 9, chars: 0, chunks: 0, failed: 0, found: 0 }
    ];
    return babaWhyHtml();
  });
  is(/신규제안서\.pdf/.test(why) && /기존증권_스캔\.pdf/.test(why), '  파일 이름을 그대로 짚는다');
  is(/스캔본/.test(why) && /AI/.test(why), '  글자 없는 스캔본은 AI 가 있어야 읽는다고 말한다');
  is(/기존/.test(why) && /하나도 없습니다/.test(why), '  한쪽이 비면 그 사실을 말한다');
  is(/6개/.test(why) && /0개/.test(why), '  파일마다 찾은 담보 수를 적는다');

  console.log('\n[5] AI 답이 깨져 와도 건져 낸다');
  const j = await page.evaluate(() => ({
    fence: babaJson('```json\n{"head":"좋아집니다","lines":["가","나"],"close":"끝"}\n```'),
    chat:  babaJson('네 알겠습니다. {"head":"a","lines":[],"close":"b"} 이상입니다.'),
    broken: babaJson('{"head": 이건 깨진 JSON'),
    empty: babaJson('')
  }));
  is(j.fence && j.fence.head === '좋아집니다', '  ``` 로 감싸 와도 읽는다');
  is(j.chat && j.chat.head === 'a', '  앞뒤에 말이 붙어 와도 읽는다');
  is(j.broken === null && j.empty === null, '  못 읽으면 억지로 만들지 않고 null 을 준다');

  console.log('\n[6] 한 단추 · 열 장이 다 붙어 있다');
  const wired = await page.evaluate(() => {
    const p = PDF_TOOLS.filter(x => x.id === 'baba')[0];
    const h = renderPdfTool(p);
    return { make: /babaMake\('baba'\)/.test(h), read: /babaDeepRead\('baba'\)/.test(h),
             rep: /runPdf\('baba'\)/.test(h),
             fns: ['babaMake','babaShowDeck','babaWhyHtml','babaTriHtml','babaNewGoneHtml',
                   'babaTopCardsHtml','babaFeeHtml','babaPropAskHtml','babaAiFill','babaJson']
                   .filter(n => typeof window[n] !== 'function') };
  });
  is(wired.make, '  「전·후 제안서 만들기」 한 단추가 붙어 있다');
  is(wired.read, '  「값만 읽기」 도 남아 있다 — 없애지 않았다');
  is(wired.rep, '  「AI 글 리포트」 도 남아 있다 — 없애지 않았다');
  is(wired.fns.length === 0, '  필요한 함수가 다 있다' + (wired.fns.length ? ' — 없는 것 ' + wired.fns.join(',') : ''));

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '전·후 프레젠테이션 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '전·후 프레젠테이션 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
