/* AI 제안서가 <b>상품 이름만</b> 읽고 끝내지 않는가.

   실제로 이런 말을 들었다 — 「상품 이름만 읽지 핵심 내용을 못 읽는다」.
   뜯어 보니 담보를 읽는 곳이 「상품별 가입담보상세」 라는 칸 하나에만
   기대고 있었다. 그 칸은 보장분석표에만 있다. 상담에서 실제로 받는
   자료는 회사가 뽑아 준 <b>가입설계서</b> 인데 거기엔 그 칸이 없다.
   그래서 상품 이름은 읽히고 담보는 하나도 안 읽혔다.

   여기서 확인한다.

     1. 그 칸이 없는 자료에서도 <b>보험별 담보</b>를 읽어 내는가
     2. 표 머리글·계약 정보를 담보로 잘못 세지 않는가
     3. 제안서에 <b>상품마다 한 장</b>이 서고, 담보 이름과 금액이 적히는가
     4. 한 줄 요약이 「무엇을 맡고 무엇은 안 맡는지」 를 말하는가
     5. AI 가 장을 써 와도 이 장이 빠지지 않는가
     6. 느슨하게 읽었으면 그렇다고 밝히는가 — 확실한 척하지 않는다        */
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

/* 회사가 뽑아 주는 가입설계서 꼴 — 「상품별 가입담보상세」 칸이 없다.
   견본이므로 고객 이름은 홍길동이다. */
const SEOL = [
  '가입설계서  계약자 홍길동  피보험자 홍길동  40세 남',
  '삼성화재 (무)무배당 마이헬스파트너 종합보험  보험기간 100세  납입기간 20년  월보험료 84,300원',
  '  담보명            가입금액',
  '  암진단비(유사암제외)   5,000만원',
  '  유사암진단비           1,000만원',
  '  뇌혈관질환진단비       2,000만원',
  '  허혈성심장질환진단비   2,000만원',
  '  질병수술비             50만원',
  '  질병입원일당           3만원',
  '  상해후유장해           1억원',
  '현대해상 (무)무배당 굿앤굿실손의료비보험  보험기간 100세  월보험료 22,400원',
  '  담보명            가입금액',
  '  질병입원의료비         5,000만원',
  '  질병통원의료비         30만원',
  '  상해입원의료비         5,000만원'
].join('\n');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 「상품별 가입담보상세」 칸이 없어도 담보를 읽는다');
  const sc = await page.evaluate((t) => {
    const s = insScan(t);
    return s ? { n: (s.riders || []).length, loose: s.looseRiders,
                 riderN: s.riderN,
                 prods: (s.riders || []).map(c => (c.co || '?') + ' / ' + c.product),
                 rows: (s.riders || []).map(c => c.rows.map(r => r.name + '=' + r.amount)),
                 areas: (s.riders || []).map(c => c.rows.map(r => r.area)) } : null;
  }, SEOL);
  is(sc !== null, '  자료를 읽어 낸다');
  is(sc && sc.n === 2, '  상품 두 건을 각각 세운다 — ' + (sc ? sc.prods.join(' | ') : ''));
  is(sc && sc.loose === 1, '  느슨하게 읽었다고 표시가 남는다');
  is(sc && sc.riderN >= 9, '  담보를 아홉 개 이상 읽는다 — ' + (sc ? sc.riderN : 0) + '개');
  const flat = sc ? sc.rows.flat() : [];
  ['암진단비(유사암제외)=5,000만원', '뇌혈관질환진단비=2,000만원', '질병입원일당=3만원',
   '상해후유장해=1억원', '질병통원의료비=30만원'].forEach(x =>
    is(flat.indexOf(x) >= 0, '    ' + x));
  is(sc && sc.areas.flat().indexOf('암') >= 0 && sc.areas.flat().indexOf('실손') >= 0,
     '  담보마다 큰 틀(암·실손 …)을 매긴다');

  console.log('\n[2] 표 머리글·계약 정보를 담보로 세지 않는다');
  is(flat.every(x => !/^담보명/.test(x)), '  「담보명 가입금액」 은 담보가 아니다');
  is(flat.every(x => !/보험기간|납입기간|월보험료|계약자|피보험자/.test(x)),
     '  보험기간 · 납입기간 · 월보험료는 담보가 아니다');

  console.log('\n[3] 제안서에 상품마다 한 장이 선다');
  const deck = await page.evaluate((t) => {
    const s = insScan(t);
    const p = prLocalFill({}, s, 'explain');
    const mine = (p.slides || []).filter(x => x.kicker === PR_PLAN_KICKER);
    return { all: (p.slides || []).length, n: mine.length,
             titles: mine.map(x => x.title),
             rows: mine.map(x => (x.rows || []).map(r => r.label + ' ' + r.value)),
             talks: mine.map(x => x.talk).filter(Boolean),
             read: p.readDocs };
  }, SEOL);
  is(deck.n >= 2, '  보험별 담보 장이 두 장 이상 — ' + deck.titles.join(' | '));
  is(deck.titles.some(x => /마이헬스파트너/.test(x)), '  상품 이름이 장 제목에 들어간다');
  is(deck.rows.flat().some(x => /암진단비.*5,000만원/.test(x)), '  담보 이름과 금액이 표에 적힌다');
  is(!/특약 \d+개/.test(deck.read), '  「특약 42개」 처럼 개수만 세지 않는다 — ' + deck.read);

  console.log('\n[4] 한 줄 요약이 맡은 것과 안 맡은 것을 말한다');
  is(deck.talks.length >= 2, '  상품마다 한 줄 요약이 붙는다');
  is(deck.talks.some(x => /맡고 있습니다/.test(x)), '  무엇을 맡고 있는지 말한다 — ' + (deck.talks[0] || ''));
  is(deck.talks.some(x => /없습니다/.test(x)), '  없는 것도 말한다 — 없다는 걸 알아야 채울지 정한다');

  console.log('\n[5] AI 가 장을 써 와도 이 장은 안 빠진다');
  const withAi = await page.evaluate((t) => {
    const s = insScan(t);
    const ai = { title: 'AI 가 쓴 제안서',
                 slides: [{ kicker: '표지', title: '표지', rows: [] },
                          { kicker: '한눈에', title: '한눈에', rows: [] },
                          { kicker: '마무리', title: '마무리', rows: [] }] };
    const p = prLocalFill(ai, s, 'explain');
    return { n: (p.slides || []).filter(x => x.kicker === PR_PLAN_KICKER).length,
             order: (p.slides || []).map(x => x.kicker),
             keep: (p.slides || []).filter(x => x.kicker === '마무리').length };
  }, SEOL);
  is(withAi.n >= 2, '  AI 장 사이에 보험별 담보가 끼워진다 — ' + withAi.order.join(' › '));
  is(withAi.order[0] === '표지' && withAi.order[1] === '한눈에', '  표지·한눈에는 앞에 그대로 둔다');
  is(withAi.keep === 1, '  AI 가 쓴 장을 지우지 않는다');
  const twice = await page.evaluate((t) => {
    const s = insScan(t);
    let p = prLocalFill({}, s, 'explain');
    p = prEnsurePlanSlides(p, s);
    p = prEnsurePlanSlides(p, s);
    return (p.slides || []).filter(x => x.kicker === PR_PLAN_KICKER).length;
  }, SEOL);
  is(twice === deck.n, '  두 번 채워도 장이 겹치지 않는다 — ' + twice);

  console.log('\n[6] 느슨하게 읽었으면 그렇다고 밝힌다');
  const brief = await page.evaluate((t) => insBrief(insScan(t)), SEOL);
  is(/■ 보험별 담보/.test(brief), '  AI 에게 주는 표에 「보험별 담보」 가 있다');
  is(/그대로 실어라/.test(brief), '  AI 에게 그대로 실으라고 못 박는다');
  is(/암진단비\(유사암제외\) \| 5,000만원/.test(brief), '  담보와 금액이 표에 들어간다');
  is(/직접 뜯어 읽었다/.test(brief), '  느슨하게 읽었다고 밝힌다 — 확실한 척하지 않는다');
  is(/단정하지 않는다/.test(brief), '  상품과 담보의 짝은 단정하지 말라고 이른다');

  console.log('\n[7] 원래 서식(보장분석표)은 그대로 읽는다');
  const strict = await page.evaluate(() => {
    /* 구간 제목은 이 문서에서 「홍길동님의 상품별 가입담보상세」 꼴로 나온다 */
    const t = '홍길동님의 상품별 가입담보상세 메리츠화재 | 가입일자 : 2019-03-11 | 내Mom같은 어린이보험 ' +
              '1 정액 암진단비(유사암제외) 3,000만 2 정액 뇌혈관질환진단비 2,000만 ' +
              '3 실손 질병입원의료비 5,000만';
    const s = insScan(t);
    return s ? { loose: s.looseRiders, n: (s.riders || []).length,
                 kinds: s.riders[0] ? s.riders[0].rows.map(r => r.kind) : [] } : null;
  });
  is(strict && strict.loose === 0, '  그 칸이 있으면 느슨한 읽기로 안 넘어간다');
  is(strict && strict.n === 1, '  계약 한 건을 세운다');
  is(strict && strict.kinds.indexOf('정액') >= 0 && strict.kinds.indexOf('실손') >= 0,
     '  정액 · 실손 구분도 그대로 읽는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '보험별 담보 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '보험별 담보 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
