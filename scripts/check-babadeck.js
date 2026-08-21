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
const SECS = ['한눈에', '지금 가진 보험', '3대 진단비', '주요 보장 요약',
              '달라지는 보장', '담보 전체', '가장 크게 달라지는 것', '새로 생기는 보장',
              '아직 비어 있는 것', '보험료', '오늘 정하실 것'];

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

  console.log('\n[1] AI 가 하나도 안 와도 열한 장이 다 선다');
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

  console.log('\n[6] 한 단추 · 열한 장이 다 붙어 있다');
  const wired = await page.evaluate(() => {
    const p = PDF_TOOLS.filter(x => x.id === 'baba')[0];
    const h = renderPdfTool(p);
    return { make: /babaMake\('baba'\)/.test(h), read: /babaDeepRead\('baba'\)/.test(h),
             rep: /runPdf\('baba'\)/.test(h),
             fns: ['babaMake','babaShowDeck','babaWhyHtml','babaTriHtml','babaNewGoneHtml',
                   'babaTopCardsHtml','babaFeeHtml','babaPropAskHtml','babaAiFill','babaJson',
                   'babaPlanDeckHtml','babaPlanEditHtml','babaPlanScan','babaDeckBarsHtml',
                   'babaDeckTableHtml','babaGapDeckHtml','bpScopeCss','babaFeeTxt']
                   .filter(n => typeof window[n] !== 'function') };
  });
  is(wired.make, '  「전·후 제안서 만들기」 한 단추가 붙어 있다');
  is(wired.read, '  「값만 읽기」 도 남아 있다 — 없애지 않았다');
  is(wired.rep, '  「AI 글 리포트」 도 남아 있다 — 없애지 않았다');
  is(wired.fns.length === 0, '  필요한 함수가 다 있다' + (wired.fns.length ? ' — 없는 것 ' + wired.fns.join(',') : ''));

  console.log('\n[7] 인체 한 장에 자리 없는 담보가 없다');
  /* 여기 자리가 없으면 읽어 놓고도 화면에 안 나온다. 넓은 이름(사망·후유장해·
     실손)이 여기 없어서, 회사가 「사망」 한 줄로만 적으면 표가 「—」 였다. */
  const homeless = await page.evaluate(() => {
    const home = {};
    BABA_BODY.forEach(g => g.rows.forEach(r => home[r[0]] = 1));
    return BABA_TERMS.filter(t => t.k !== 'fee' && !home[t.k]).map(t => t.n);
  });
  is(homeless.length === 0, '  담보가 다 자리를 갖는다' + (homeless.length ? ' — 빠진 것 ' + homeless.join(', ') : ''));
  const wide = await page.evaluate(() => {
    BABA.rows = BABA_TERMS.map(t => ({ k: t.k, n: t.n, b: null, a: null }));
    /* 「사망」 한 줄로만 적어 둔 회사 — 질병사망·상해사망은 비어 있다 */
    const set = (k, b, a) => { const r = BABA.rows.filter(x => x.k === k)[0]; if (r) { r.b = b; r.a = a; } };
    set('death', 5000, 10000); set('disab', null, 10000); set('silson', 5000, 5000);
    return babaBodyHtml(false).replace(/\s+/g, ' ');
  });
  is(/사망\(주계약\)/.test(wide), '  넓은 이름 「사망(주계약)」 이 인체 표에 줄을 갖는다');
  is(/5,000[\s\S]{0,120}10,000/.test(wide), '  그 줄에 읽은 값이 그대로 들어간다');
  is(/후유장해/.test(wide) && /실손의료비/.test(wide), '  후유장해 · 실손의료비도 넓은 이름 줄이 있다');

  console.log('\n[8] 보험료는 원 단위 — 만원으로 반올림하지 않는다');
  const fee = await page.evaluate(() => {
    const one = babaScan('월보험료 128,000원 암진단비 5,000만원');
    BABA.rows = BABA_TERMS.map(t => ({ k: t.k, n: t.n,
      b: t.k === 'fee' ? 128000 : null, a: t.k === 'fee' ? 164000 : null }));
    const h = babaFeeHtml().replace(/\s+/g, ' ');
    /* 예전 판이 만원으로 저장해 둔 것도 되살린다 */
    BABA.rows.filter(x => x.k === 'fee')[0].b = 13;
    BABA.rows.filter(x => x.k === 'fee')[0].a = 16;
    babaFeeFix();
    const f = BABA.rows.filter(x => x.k === 'fee')[0];
    return { read: one.fee ? one.fee.won : null, cancer: one.cancer ? one.cancer.won : null,
             h: h, fix: [f.b, f.a], txt: babaFeeTxt(36000) };
  });
  is(fee.read === 128000, '  「월보험료 128,000원」 을 128000 으로 읽는다 (13만원으로 뭉개지 않는다) — ' + fee.read);
  is(fee.cancer === 5000, '  담보는 그대로 만원 단위로 읽는다 — ' + fee.cancer);
  is(fee.txt === '36,000원', '  보험료는 원으로 적는다 — ' + fee.txt);
  is(/128,000원/.test(fee.h) && /164,000원/.test(fee.h), '  기존·새 설계 보험료가 원으로 나온다');
  is(/\+36,000원/.test(fee.h), '  월 차액도 원으로 나온다');
  is(/4,320,000원/.test(fee.h) && /8,640,000원/.test(fee.h), '  10년 · 20년 누계가 맞는다');
  is(fee.fix[0] === 130000 && fee.fix[1] === 160000, '  예전 판이 만원으로 적어 둔 것은 원으로 올린다 — ' + fee.fix.join('/'));

  console.log('\n[9] 상품 목록 · 유지 · 해지');
  const plan = await page.evaluate(() => {
    try { localStorage.removeItem('apex_baba_plans'); } catch (e) {}
    BABA.plans = null;
    const found = babaPlanScan(
      '계약자 홍길동 삼성생명 (무)무배당 삼성 통합보장보험 월보험료 62,000원 ' +
      '보험기간 100세 납입기간 20년 현대해상 (무)무배당 실손의료보험 월 38,000원 담보명 가입금액');
    babaPlanMerge(found, 'b');
    babaPlanMerge(found, 'b');                       /* 두 번 읽어도 안 겹쳐야 한다 */
    const L = babaPlanOf('b');
    if (L[0]) babaPlanSet(L[0].id, 'keep', 'keep');
    if (L[1]) babaPlanSet(L[1].id, 'keep', 'drop');
    return { found: found.map(x => x.nm), co: found.map(x => x.co), prem: found.map(x => x.prem),
             n: L.length, deck: babaPlanDeckHtml().replace(/\s+/g, ' '),
             edit: babaPlanEditHtml().replace(/\s+/g, ' '),
             empty: (function () { BABA.plans = []; const h = babaPlanDeckHtml(); BABA.plans = L; return h; })() };
  });
  is(plan.found.length >= 2, '  글에서 계약 두 건을 뽑는다 — ' + plan.found.join(' / '));
  is(plan.co.indexOf('삼성생명') >= 0, '  회사 이름을 그 상품 가까이에서 찾는다');
  is(plan.prem.indexOf(62000) >= 0, '  월 보험료도 같이 뽑는다 (원 단위)');
  is(plan.found.every(n => !/가입금액|담보명|보험기간|납입기간/.test(n)), '  표 머리글은 상품으로 안 본다');
  is(plan.n === plan.found.length, '  두 번 읽어도 같은 계약이 겹치지 않는다 — ' + plan.n + '건');
  is(/유지/.test(plan.deck) && /해지/.test(plan.deck), '  제안서에 유지 · 해지가 찍힌다');
  is(/지금 가진 보험/.test(plan.deck), '  「지금 가진 보험」 이 제목이다');
  is(/확인 필요/.test(plan.deck) || plan.prem.every(x => x !== null),
     '  보험료를 못 찾은 계약은 「확인 필요」 — 0 으로 안 채운다');
  is(/새 보장이 시작된 뒤/.test(plan.deck), '  해지 시점을 함부로 앞세우지 않는다');
  is(/babaPlanSet\(/.test(plan.edit) && /babaPlanAdd\(/.test(plan.edit), '  화면에서 손으로 고칠 수 있다');
  is(/못 읽었습니다/.test(plan.empty), '  하나도 못 읽으면 그렇다고 말한다 — 지어내지 않는다');

  console.log('\n[10] 담보 막대는 줄마다 견주고, 전체는 표 한 장이다');
  const bars = await page.evaluate(() => {
    BABA.rows = BABA_TERMS.map(t => ({ k: t.k, n: t.n, b: null, a: null }));
    const set = (k, b, a) => { const r = BABA.rows.filter(x => x.k === k)[0]; if (r) { r.b = b; r.a = a; } };
    set('death', 5000, 10000); set('inpD', 2, 3); set('cancer', 3000, 5000);
    const h = babaDeckBarsHtml(), t = babaDeckTableHtml();
    const w = (h.match(/class="bp-bar (?:old|new)" style="width:(\d+)%/g) || [])
                .map(x => +x.match(/(\d+)%/)[1]);
    return { h: h, t: t, w: w, rows: (t.match(/<tr>/g) || []).length };
  });
  is(bars.w.filter(x => x === 100).length === 3, '  줄마다 큰 값이 가득 찬 길이가 된다 (세 줄 → 100% 셋)');
  is(bars.w.indexOf(0) < 0 && bars.w.filter(x => x > 0 && x < 100).length === 3,
     '  작은 값도 보이게 그린다 — ' + bars.w.join(','));
  is(/담보끼리 길이로 견주지 마세요/.test(bars.h), '  담보끼리 견주지 말라고 적어 둔다');
  is(bars.rows >= 3, '  전체 표에 담보가 다 들어간다 — ' + bars.rows + '줄');
  is(/0 원이라는 뜻이 아닙니다/.test(bars.t), '  「—」 가 0 이 아니라고 밝힌다');

  console.log('\n[11] 화면 미리보기와 인쇄본이 같은 CSS 를 쓴다');
  const css = await page.evaluate(() => {
    const raw = babaPropCss(), sc = bpScopeCss(raw, '.bp-prev');
    return { raw: raw.length, sc: sc.length, page: /@page/.test(sc),
             body: /(^|\})body\{/.test(sc), scoped: /\.bp-prev \.bp-kpi\{/.test(sc),
             root: /\.bp-prev\{--ink:/.test(sc), media: /@media[^{]*\{\.bp-prev /.test(sc) };
  });
  is(css.sc > 1000, '  인쇄본 CSS 한 벌을 그대로 씌운다 — ' + css.sc + '자');
  is(!css.page, '  @page 는 화면에 안 새어 나온다');
  is(!css.body, '  body 규칙이 앱 전체를 건드리지 않는다');
  is(css.root, '  :root 는 .bp-prev 안으로 옮긴다');
  is(css.scoped, '  선택자마다 .bp-prev 가 앞에 붙는다');
  is(css.media, '  @media 안쪽도 같이 씌운다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '전·후 프레젠테이션 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '전·후 프레젠테이션 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
