/* 블로그 공장 — 홍보 글을 많이 만들되, <b>지어내지 않는가</b>.

   블로그 자동화에서 무너지는 자리는 늘 같다. 「글을 많이 만들어라」 고
   시키면 AI 는 <b>없는 숫자와 없는 후기</b>를 만들어 채운다. 「가입자
   90% 가 만족」 같은 문장이 그렇게 태어나고, 그것이 검색에 걸리면
   그때는 <b>회사 이름이 걸린다.</b> 지운다고 캐시에서 지워지지 않는다.

   그래서 이 공장은 <b>글감 없이는 글을 안 만든다.</b> 여기서 지킨다.

     1. 화면이 서는가 · 위쪽 키트와 두 벌이 되지 않았는가
     2. 갈래 표가 <b>한 곳</b>이고, 갈래마다 <b>비었을 때 할 말</b>이 있는가
     3. 뉴스 글감이 <b>받아 둔 실제 기사</b>에서만 오는가 — 없으면 0개
     4. 홍보가 <b>열에 하나</b>인가 — 자랑만 편성되지 않는가 · 읽는 사람이 갈리는가
     5. 글감이 없으면 <b>AI 를 안 부르는가</b> (빈 줄을 채우지 않는다)
     6. 초안 주문서에 <b>근거가 실려</b> 나가는가 · 지어내지 말라고 시키는가
     7. 발행 게이트가 <b>잡을 것을 잡는가</b> — 단정·실명·세금 결론·빈칸
     8. <b>헛것을 안 잡는가</b> — 멀쩡한 글은 통과한다 (CLAUDE.md 8)
     9. 준법 문구를 <b>config/compliance.json</b> 에서 읽는가 (다시 안 적었나)
    10. 홍보 글감이 <b>실제로 있는 메뉴</b>만 말하는가                  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

/* 가짜 신문 — 진짜로 받아 둔 것처럼 NLIVE 에 심는다. 견본이라 고객 이름은 안 쓴다. */
const NEWS = [
  { t: '실손보험 청구 간소화 시행… 병원에서 바로 전송', u: 'https://example.test/n1', s: '보험신문', d: '2026-08-20', cats: ['ins'] },
  { t: '연말정산 세액공제 대상 손질 논의', u: 'https://example.test/n2', s: '한국경제', d: '2026-08-19', cats: ['tax'] },
  { t: '전세보증금 반환보증 기준 변경', u: 'https://example.test/n3', s: '매일경제', d: '2026-08-18', cats: ['realty'] },
  { t: '한은 기준금리 동결… 시장은 인하 시점 주목', u: 'https://example.test/e1', s: '연합뉴스 경제', d: '2026-08-20', cats: ['econ'] },
  { t: '원·달러 환율 사흘째 하락', u: 'https://example.test/e2', s: '이데일리 경제', d: '2026-08-19', cats: ['econ'] }
];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto(base + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof go === 'function' && typeof BF_KINDS !== 'undefined', null, { timeout: 30000 });
  await page.evaluate(() => { window.osTabAllowed = function () { return true; }; });

  console.log('\n[1] 화면이 서는가 — 위쪽 키트와 두 벌이 되지 않았는가');
  await page.evaluate(() => go('blog'));
  await page.waitForFunction(() => !!document.getElementById('bf_body'), null, { timeout: 15000 });
  const seen = await page.evaluate(() => ({
    factory: !!document.getElementById('bf_body'),
    kit: /상위노출 키트/.test(document.body.innerText),
    gen: !!document.getElementById('card_blog_post'),
    plans: document.body.innerText.indexOf('한 달치 편성') >= 0
  }));
  is(seen.factory, '  블로그 공장이 선다');
  is(seen.plans, '  「한 달치 편성」 이 있다');
  is(seen.kit, '  기존 상위노출 키트가 그대로 남아 있다 — 갈아엎지 않았다');
  is(seen.gen, '  기존 「SEO 블로그 글 생성」 도 그대로다');
  is(/CUSTOM=\[\s*\{tab:'blog',render:function\(\)\{return blogFactory\(\);\}\},\s*\{tab:'blog',render:function\(\)\{return blogSeoKit\(\);\}\}/.test(SRC),
     '  둘 다 같은 등록부(CUSTOM)로 붙었다 — 그리는 자리가 하나다');

  console.log('\n[2] 갈래 표가 한 곳이고, 비었을 때 할 말이 있는가');
  const kinds = await page.evaluate(() => BF_ORDER.map(k => ({
    k: k, t: BF_KINDS[k].t, why: !!BF_KINDS[k].why, empty: BF_KINDS[k].empty || '',
    reader: BF_KINDS[k].reader, seeds: typeof BF_KINDS[k].seeds === 'function',
    order: typeof BF_KINDS[k].order === 'function' })));
  is(kinds.length === 6, '  갈래가 여섯이다 — ' + kinds.map(x => x.t).join(' · '));
  is(kinds.every(x => x.why), '  갈래마다 왜 쓰는지 적혀 있다');
  is(await page.evaluate(() => BF_ORDER.length === Object.keys(BF_KINDS).length),
     '  차례표(BF_ORDER)가 갈래를 하나도 빠뜨리지 않았다');
  /* 글감 모으기도 · 주문서 쓰기도 이 표 하나가 답한다. 갈래를 늘리면서
     한쪽만 늘리면 그 갈래는 조용히 빈다 — 그 자리를 잡는다. */
  is(kinds.every(x => x.seeds), '  갈래마다 <b>글감 모으는 법</b>이 표 안에 있다');
  is(kinds.every(x => x.order), '  갈래마다 <b>주문서 쓰는 법</b>이 표 안에 있다');
  is(kinds.every(x => x.reader === '고객' || x.reader === '동료'),
     '  갈래마다 <b>누가 읽나</b>가 달려 있다');
  is(kinds.filter(x => x.reader === '동료').map(x => x.k).sort().join(',') === 'culture,growth',
     '  동료가 읽는 글은 문화·성장 둘이다 — 고객 글과 섞이지 않게 갈라 둔다');
  is(kinds.filter(x => x.k !== 'ours' && x.k !== 'culture').every(x => x.empty.length > 10),
     '  글감이 비었을 때 <b>어디서 채우는지</b> 말해 준다 — 조용히 비워 두지 않는다');
  /* 갈래를 삼항 사슬로 나열하면 하나 빠뜨린다 (CLAUDE.md 5) */
  is(!/kind===['"](news|econ)['"]\s*\?[\s\S]{0,120}kind===['"](ask|culture)['"]\s*\?/.test(SRC),
     '  갈래를 삼항 사슬로 나열하지 않았다');

  console.log('\n[3] 뉴스 글감이 받아 둔 실제 기사에서만 오는가');
  const dry = await page.evaluate(() => { NLIVE.items = []; return bfSeeds().news.length; });
  is(dry === 0, '  받아 둔 기사가 없으면 뉴스 글감은 0개다 — 지어내지 않는다 (' + dry + ')');
  const wet = await page.evaluate(n => { NLIVE.items = n; const s = bfSeeds();
    return { news: s.news.map(x => x.title), econ: s.econ.map(x => x.title),
             first: s.news[0], srcHasLink: /https:\/\//.test(s.news[0].src) }; }, NEWS);
  is(wet.news.length + wet.econ.length === NEWS.length, '  받아 둔 기사 수만큼 글감이 된다 ('
     + wet.news.length + '+' + wet.econ.length + ')');
  is(wet.first.title === NEWS[0].t, '  기사 제목을 그대로 쓴다 — ' + wet.first.title.slice(0, 24));
  is(/보험신문/.test(wet.first.src) && /2026-08-20/.test(wet.first.src) && wet.srcHasLink,
     '  근거에 언론사·날짜·링크가 그대로 실린다 (CLAUDE.md 9)');
  /* 경제 기사가 보험 칸에 섞이면 「매일 경제뉴스」 가 매일 나오지 않는다 */
  is(wet.econ.length === 2 && wet.econ.every(t => /금리|환율/.test(t)),
     '  경제 칸 기사만 경제 글감이 된다 — ' + wet.econ.join(' / '));
  is(wet.news.every(t => !/금리 동결|환율 사흘째/.test(t)),
     '  경제 기사가 보험·정책 칸에 섞이지 않는다');
  const dryEcon = await page.evaluate(() => { NLIVE.items = []; return bfSeeds().econ.length; });
  is(dryEcon === 0, '  경제 기사도 없으면 0개다 — 매일 쓰는 갈래라고 지어내지 않는다');

  console.log('\n[4] 홍보가 열에 하나인가 · 읽는 사람이 갈리는가');
  const mix = await page.evaluate(n => { NLIVE.items = n; BF.perweek = 5; bfPlan();
    const by = {}, rd = {};
    BF.rows.forEach(r => { by[r.kind] = (by[r.kind] || 0) + 1;
      const k = BF_KINDS[r.kind].reader; rd[k] = (rd[k] || 0) + 1; });
    return { by: by, rd: rd, n: BF.rows.length, mix: BF_MIX.slice(0) }; }, NEWS);
  is(mix.n === 20, '  주 5편이면 한 달 20편을 편성한다 (' + mix.n + ')');
  is(mix.mix.length === 10 && mix.mix.filter(x => x === 'ours').length === 1,
     '  섞는 비율이 열에 하나다 — 홍보 ' + mix.mix.filter(x => x === 'ours').length + '/10');
  is((mix.by.ours || 0) * 5 <= mix.n,
     '  홍보가 전체의 5분의 1을 넘지 않는다 (홍보 ' + (mix.by.ours || 0) + ' / ' + mix.n + ')');
  /* 갈래를 늘려 놓고 비율에서 빠뜨리면 그 갈래는 영원히 안 나온다 */
  const missing = await page.evaluate(() => BF_ORDER.filter(k => BF_MIX.indexOf(k) < 0));
  is(missing.length === 0, '  여섯 갈래가 모두 비율에 들어 있다' + (missing.length ? ' — 빠짐: ' + missing.join(',') : ''));
  is((mix.by.econ || 0) >= (mix.by.news || 0),
     '  경제뉴스가 가장 자주 돈다 — 「매일」 이라고 했으니 (' + (mix.by.econ || 0) + '편)');
  is((mix.rd['동료'] || 0) > 0 && (mix.rd['고객'] || 0) > (mix.rd['동료'] || 0) * 2,
     '  동료용 글이 들어가되 고객 글이 훨씬 많다 (고객 ' + (mix.rd['고객'] || 0) + ' · 동료 ' + (mix.rd['동료'] || 0) + ')');

  console.log('\n[5] 글감이 없으면 AI 를 안 부르는가');
  /* 초안 만들기는 <b>기다렸다가</b> 세야 한다. 바로 세면 아직 안 부른
     것을 「안 부른다」 로 잘못 읽는다 — 처음에 그렇게 헛통과했다. */
  const noSeed = await page.evaluate(async () => {
    let calls = 0;
    window.callAI = function () { calls++; return Promise.resolve('x'); };
    window.aiReady = function () { return true; };
    localStorage.removeItem('apex_blog_asks');
    BF_ORDER.forEach(k => localStorage.removeItem('apex_blog_mine_' + k));
    NLIVE.items = []; BF.perweek = 5; bfPlan();
    const empties = BF.rows.filter(r => !r.seed).length;
    BF.rows.forEach((r, i) => { if (!r.seed) bfDraft(i); });
    await new Promise(r => setTimeout(r, 600));
    return { calls: calls, empties: empties, busy: BF.busy,
             made: BF.rows.filter(r => r.out).length,
             shown: /글감 없음/.test(document.getElementById('bf_body').innerText) };
  });
  is(noSeed.empties > 0, '  글감이 없으면 그 줄은 비워 둔다 (' + noSeed.empties + '줄)');
  is(noSeed.calls === 0, '  빈 줄로는 AI 를 부르지 않는다 — 없는 글감을 채우지 않는다 (부른 횟수 ' + noSeed.calls + ')');
  is(noSeed.made === 0 && noSeed.busy === -1, '  빈 줄에 초안이 생기지 않는다 (생긴 글 ' + noSeed.made + '편)');
  is(noSeed.shown, '  화면에 「글감 없음」 이라고 적는다 — 조용히 넘어가지 않는다');

  console.log('\n[6] 초안 주문서에 근거가 실려 나가는가');
  const order = await page.evaluate(n => {
    NLIVE.items = n; BF.perweek = 5; bfPlan();
    const row = BF.rows.filter(r => r.seed && r.kind === 'news')[0];
    const ours = BF.rows.filter(r => r.seed && r.kind === 'ours')[0];
    return { u: bfUser(row), o: bfUser(ours), sys: bfSys() };
  }, NEWS);
  is(/\[근거\]/.test(order.u) && /보험신문/.test(order.u), '  기사 근거가 주문서에 실린다');
  is(/\[\[확인 필요/.test(order.sys), '  모르는 값은 [[확인 필요]] 로 비우라고 시킨다');
  is(/기사 본문을 옮겨 적지 않는다/.test(order.sys), '  기사 본문을 옮기지 말라고 시킨다 (저작권)');
  is(/요건 충족 시/.test(order.sys) && /세무 전문가/.test(order.sys),
     '  세금은 결론 말고 요건만 적으라고 시킨다 (CLAUDE.md 2)');
  is(/심사 결과에 따릅니다/.test(order.sys), '  보험료·보장은 심사 결과에 따른다고 시킨다');
  is(/실명/.test(order.sys) && /홍길동/.test(order.sys), '  실명 금지 · 견본 이름은 홍길동 (CLAUDE.md 3)');
  is(/딛고 선 것/.test(order.sys), '  글 끝에 근거를 옮겨 적으라고 시킨다');
  is(/없는 실적·후기·만족도를 만들어 넣지 않는다/.test(order.o),
     '  홍보 글에도 없는 실적·후기를 만들지 말라고 못 박는다');
  is(/모집 광고도 규정을 받는다/.test(order.sys),
     '  동료용 글에서도 수입을 보장하지 말라고 시킨다');
  /* 갈래마다 주문서가 실제로 다르게 나오는가 — 표만 늘리고 주문이 같으면
     여섯 갈래가 다 같은 글이 된다 */
  const each = await page.evaluate(n => {
    NLIVE.items = n;
    localStorage.setItem('apex_blog_mine_ask', JSON.stringify([{ q: '암 진단비는 얼마가 적당한가요?', at: '2026-08-23' }]));
    localStorage.setItem('apex_blog_mine_culture', JSON.stringify([{ q: '상담 끝나면 그날 안에 기록을 남깁니다', at: '2026-08-23' }]));
    const s = bfSeeds(), out = {};
    BF_ORDER.forEach(k => { out[k] = s[k].length ? bfUser({ seed: s[k][0] }) : ''; });
    return out;
  }, NEWS);
  const bodies = Object.keys(each).map(k => each[k]);
  is(bodies.every(b => b.length > 200), '  여섯 갈래가 모두 주문서를 만들어 낸다');
  is(new Set(bodies).size === bodies.length, '  갈래마다 주문서가 다르다 — 한 벌을 돌려 쓰지 않는다');
  is(/\[읽는 사람\] 고객/.test(each.econ) && /\[읽는 사람\] 동료/.test(each.culture),
     '  주문서에 <b>누가 읽나</b>가 실려 나간다');
  is(/오늘의 경제 이야기/.test(each.econ) && /특정 상품을 권하는 글로 만들지 말고/.test(each.econ),
     '  경제뉴스는 상품 권유 글로 만들지 말라고 시킨다');
  is(/가족 같은|열정 넘치는/.test(each.culture) && /지어내지 말고/.test(each.culture),
     '  문화 글은 분위기를 지어내지 말라고 시킨다');
  is(/전체 지도의 순서표/.test(each.growth) && /지도에 없는 기능·성과·수입을 만들어 넣지 않는다/.test(each.growth),
     '  성장 글은 지도에 있는 순서만 쓰라고 시킨다');

  console.log('\n[7] 발행 게이트가 잡을 것을 잡는가');
  const G = await page.evaluate(() => {
    const t = s => bfGuard(s);
    return {
      ban:   t('이 상품은 무조건 됩니다. 확정 수익 보장.'),
      top:   t('업계 1위 설계사입니다.'),
      tax:   t('이 상품은 비과세입니다. 절세 효과가 큽니다.'),
      name:  t('김철수님 사례입니다. 보험료는 심사 결과에 따릅니다.'),
      hole:  t('진단비는 [[확인 필요: 상품설명서에서 확인]] 입니다.'),
      needTax: t('세액공제를 받을 수 있습니다.'),
      needUw:  t('보험료는 나이에 따라 다릅니다.'),
      pay:     t('우리와 함께하면 수입을 보장합니다.'),
      pay2:    t('억대 연봉 설계사가 되실 수 있습니다.'),
      pay3:    t('누구나 성공합니다.')
    };
  });
  is(G.ban.hits.some(h => /무조건/.test(h.w)), '  「무조건」 을 잡는다');
  is(G.ban.hits.some(h => /확정\s*수익/.test(h.w)), '  「확정 수익」 을 잡는다');
  is(G.top.hits.some(h => /1위/.test(h.w)), '  「업계 1위」 를 잡는다');
  is(G.tax.hits.some(h => /비과세/.test(h.w)), '  「비과세입니다」 라는 결론을 잡는다 (CLAUDE.md 2)');
  is(G.name.hits.some(h => /김철수님/.test(h.w)), '  사람 이름처럼 보이는 말을 잡는다 (CLAUDE.md 3)');
  is(G.hole.holes.length === 1 && !G.hole.ok, '  AI 가 못 채운 [[확인 필요]] 가 남으면 통과시키지 않는다');
  is(G.pay.hits.some(h => /수입.*보장/.test(h.w)), '  「수입을 보장」 을 잡는다 — 모집 광고 규정');
  is(G.pay2.hits.some(h => /억대/.test(h.w)), '  「억대 연봉」 을 잡는다');
  is(G.pay3.hits.some(h => /누구나/.test(h.w)), '  「누구나 성공」 을 잡는다');
  is(G.needTax.miss.length > 0, '  세금 이야기에 「요건 충족 시」 가 없으면 잡는다');
  is(G.needUw.miss.length > 0, '  보험료 이야기에 「심사 결과에 따릅니다」 가 없으면 잡는다');

  console.log('\n[8] 헛것을 안 잡는가 — 멀쩡한 글은 통과한다');
  const OK = await page.evaluate(() => {
    const good = '고객님께서 자주 묻는 질문입니다. 사장님도 같은 고민을 하십니다. ' +
      '보장 내용과 보험료는 심사 결과에 따릅니다. 세액공제는 요건 충족 시 적용되며, ' +
      '구체적인 판단은 세무 전문가에게 확인하시기 바랍니다. 홍길동님을 예로 들면 이렇습니다.';
    return { g: bfGuard(good), names: bfNames('고객님 사장님 어머님 대표님 여러분') };
  });
  is(OK.g.ok, '  멀쩡한 글은 통과한다' + (OK.g.ok ? '' : ' — 잡힌 것: ' +
     JSON.stringify(OK.g.hits.map(h => h.w)) + JSON.stringify(OK.g.miss)));
  is(OK.names.length === 0, '  「고객님·사장님·어머님」 을 이름으로 잘못 잡지 않는다');

  console.log('\n[9] 준법 문구를 config/compliance.json 에서 읽는가');
  const cj = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/compliance.json'), 'utf8'));
  is(/fetch\('\.\.\/config\/compliance\.json'/.test(SRC), '  config/compliance.json 을 읽어 온다');
  const fixed = cj['카드_하단_고정'];
  is(SRC.indexOf(fixed) < 0, '  그 문구를 앱에 다시 적어 두지 않았다 — 두 벌이면 한쪽만 고쳐진다 (CLAUDE.md 5)');
  const packed = await page.evaluate(() => {
    let got = '';
    window.copyText = function (t) { got = t; };
    BF.comply = null; BF.complyErr = '';
    return bfComply().then(() => {
      NLIVE.items = []; BF.rows = [{ when: '1/1', kind: 'ours', seed: { kind: 'ours', title: 'x', src: '메뉴' },
        out: '보장 내용은 심사 결과에 따릅니다. 세액공제는 요건 충족 시 적용됩니다.', guard: null }];
      BF.rows[0].guard = bfGuard(BF.rows[0].out);
      bfPack(0);
      return { got: got, ok: BF.rows[0].guard.ok, read: !!BF.comply };
    });
  });
  is(packed.read, '  실제로 읽어 왔다');
  is(packed.ok && packed.got.indexOf(fixed) >= 0, '  통과한 글에는 준법 문구가 붙어 나온다');
  is(packed.got.indexOf('세제·한도는') >= 0, '  세금 이야기에는 세제 문구가 더 붙는다');
  const blocked = await page.evaluate(() => {
    let got = 'NONE';
    window.copyText = function (t) { got = t; };
    BF.rows = [{ when: '1/1', kind: 'ours', seed: { kind: 'ours', title: 'x', src: '메뉴' },
      out: '이 상품은 무조건 좋습니다.', guard: null }];
    BF.rows[0].guard = bfGuard(BF.rows[0].out);
    bfPack(0);
    return got;
  });
  is(blocked === 'NONE', '  고칠 곳이 남은 글은 발행 묶음이 열리지 않는다');

  console.log('\n[10] 홍보·문화 글감이 실제로 있는 메뉴만 말하는가');
  const seedLists = await page.evaluate(() => ({
    ours: BF_OURS.map(o => ({ m: o.m, t: o.t, d: o.d })),
    culture: BF_CULTURE.map(o => ({ m: o.m, t: o.t, d: o.d }))
  }));
  /* 앱이 실제로 쓰는 <b>제목</b> 안에 그 이름이 있는지 본다. 아무 데나 스친
     글자가 아니라 메뉴 이름이어야 한다 — 없는 메뉴를 홍보하면 그 글을 보고
     찾아온 분이 못 찾는다. */
  const titles = (SRC.match(/title:'[^']+'/g) || []).map(x => x.slice(7, -1));
  const inMenu = m => titles.some(t => t.indexOf(m) >= 0);
  seedLists.ours.forEach(o => is(inMenu(o.m), '  홍보 — 「' + o.m + '」 는 앱에 실제로 있는 메뉴다'));
  seedLists.culture.forEach(o => is(inMenu(o.m), '  문화 — 「' + o.m + '」 는 앱에 실제로 있는 메뉴다'));
  const all = seedLists.ours.concat(seedLists.culture);
  is(all.every(o => !/[0-9]{2,}\s*(%|퍼센트|명|건)/.test(o.t + o.d)),
     '  글감에 실적 숫자를 적어 두지 않았다 — 지어낸 성과가 씨앗이 되지 않게');
  is(seedLists.culture.every(o => !/가족\s*같|열정|최고의\s*팀|즐거운\s*분위기/.test(o.t + o.d)),
     '  문화 글감이 분위기 말로 채워져 있지 않다 — 확인되는 방식만 씨앗이 된다');

  console.log('\n[11] 성장 글감이 전체 지도의 순서표에서 그대로 오는가');
  const gr = await page.evaluate(() => {
    const s = bfGrowthSeeds();
    const r = (typeof APEX_MAP !== 'undefined' && APEX_MAP.recipes) || [];
    return { n: s.length, recipes: r.length, first: s[0] || null,
             names: !!(typeof APEX_MAP !== 'undefined' && APEX_MAP.names) };
  });
  is(gr.recipes > 0 && gr.n === gr.recipes,
     '  순서표 수만큼 글감이 된다 (' + gr.n + '/' + gr.recipes + ') — 늘리거나 줄이지 않는다');
  is(gr.names, '  메뉴 이름을 지도에서 읽는다 — 이름을 여기에 다시 적어 두지 않았다');
  is(!!gr.first && /→/.test(gr.first.src), '  근거에 순서가 통째로 실린다 — ' + (gr.first ? gr.first.src.slice(0, 46) : ''));
  is(!!gr.first && gr.first.steps.split('\n').length >= 2, '  단계가 번호와 함께 실린다');
  /* 지도가 없는 배포에서도 <b>지어내지 않는다</b> — 이 갈래는 통째로 비어야 한다 */
  const noMap = await page.evaluate(() => {
    const keep = window.APEX_MAP; window.APEX_MAP = undefined;
    const n = bfGrowthSeeds().length; window.APEX_MAP = keep; return n;
  });
  is(noMap === 0, '  지도를 못 읽으면 성장 글감은 0개다 — 없는 순서를 만들지 않는다');

  is(errs.length === 0, '\n화면에 터진 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? '✗ 블로그 공장 점검 ' + bad + '군데 실패' : '✓ 블로그 공장 점검 통과 — 글감 없이는 글을 안 만듭니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
