/* 블로그 공장(app/blog.html) — <b>정말 올릴 수 있는가</b>.

   이것은 CRM 안의 기능이 아니다. 글을 올리는 일이 주인공이라 밖으로
   떼어 놓았다. 그래서 여기서 제일 먼저 보는 것은 「기능이 있나」 가
   아니라 <b>「올리는 데까지 가나」</b> 다.

   올리는 자리에서 실제로 무너지는 것은 이것들이다.

     · 마크다운을 그대로 붙이면 네이버 편집기에 <b>## 이 글자로 보인다.</b>
       제목도 표도 안 산다. 그래서 <b>서식(HTML)</b>으로 넘겨야 한다.
     · [이미지: …] 자리에 넣을 <b>파일이 없으면</b> 거기서 멈춘다.
     · AI 가 못 채운 자리를 <b>못 보고</b> 그대로 올린다.
     · 준법 문구가 운영에서만 404 로 안 붙는다 (_redirects 강제 막음)

   그리고 지어내지 않는 규칙은 그대로다.

     1. 페이지가 <b>혼자 서는가</b> · 앱에는 <b>링크만</b> 남았는가(두 벌 아님)
     2. 갈래 표가 한 곳인가 · 누가 읽나가 달려 있는가
     3. 뉴스를 <b>서버 창구에서 칸별로</b> 받는가 — 낱말표를 다시 안 적었나
     4. 홍보가 열에 하나인가
     5. 글감이 없으면 <b>AI 를 안 부르는가</b>
     6. 주문서에 근거·그림 목록이 실리는가 · 지어내지 말라고 시키는가
     7. 게이트가 잡을 것을 잡는가 · 8. <b>헛것을 안 잡는가</b>
     9. 준법 문구를 config/compliance.json 에서 읽고 <b>운영에서도 열리는가</b>
    10. 그림이 SVG 로 서고 <b>PNG 로 바뀌는가</b> · 없는 숫자를 안 그리는가
    11. <b>올리기</b> — 서식 복사가 진짜 HTML 인가 · 자리표시가 보이는가
    12. 자료를 <b>여기에 다시 적어 두지 않았는가</b>
    13. <b>연결</b> — 앱과 같은 칸에 쓰는가 · 키를 화면에 되비추지 않는가 ·
        연결이 없으면 <b>묻지 않아도 열리는가</b>                            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json' };
const PAGE = 'app/blog.html', ARTJS = 'app/blog-art.js';
const SRC = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
const ART_SRC = fs.readFileSync(path.join(ROOT, ARTJS), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

/* 가짜 신문 — 서버 창구가 칸별로 내려주는 모양 그대로. 견본이라 고객 이름은 안 쓴다. */
const NEWS = {
  '경제': [{ title:'한은 기준금리 동결… 시장은 인하 시점 주목', link:'https://example.test/e1', source:'연합뉴스 경제', date:'2026-08-20' },
           { title:'원·달러 환율 사흘째 하락', link:'https://example.test/e2', source:'이데일리 경제', date:'2026-08-19' }],
  '보험': [{ title:'실손보험 청구 간소화 시행… 병원에서 바로 전송', link:'https://example.test/n1', source:'보험신문', date:'2026-08-20' }],
  '부동산': [{ title:'전세보증금 반환보증 기준 변경', link:'https://example.test/n3', source:'매일경제', date:'2026-08-18' }],
  '생활정책': [], '정책자금': []
};
let asked = [];
const srv = http.createServer((rq, rs) => {
  const u = url.parse(rq.url, true);
  let p = decodeURIComponent(u.pathname);
  if (p === '/api/market') {
    asked.push(u.query.cat || '');
    rs.writeHead(200, { 'Content-Type':'application/json' });
    rs.end(JSON.stringify({ ok:true, news: NEWS[u.query.cat] || [] }));
    return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 점검용 가짜 키 — <b>통째로 적어 두지 않는다.</b>
   Netlify 는 배포물에서 키처럼 생긴 문자열을 찾으면 빌드를 세운다. 이 PR 의
   미리보기 배포가 세 번 엎어졌고, 원인이 바로 여기 박아 둔 가짜 키였다.
   빌드 로그는 인증이 있어야 읽혀서, 파일 이름과 _redirects 를 하나씩 빼
   보고서야 찾았다. 점검용이라도 키 모양으로 적어 두지 않는다 (CLAUDE.md 10). */
const FAKE_KEY = 'sk-' + 'ant-' + 'TESTKEY' + '1234567890abcd';

const DRAFT = '## 제목 후보\n- 금리가 내려간다는데 내 노후 계획은 어떻게 되나요\n- 두 번째 제목\n\n' +
  '## 지금 무슨 일이 있었나\n본문입니다. 보험료는 심사 결과에 따릅니다.\n\n' +
  '| 구분 | 이것 | 저것 |\n| --- | --- | --- |\n| 하는 일 | 가 | 나 |\n\n' +
  '> 한 줄 강조입니다.\n\n## 내 돈에는 어떤 뜻인가\n[이미지: 뉴스 카드 | alt: 기사 카드]\n본문입니다.\n\n' +
  '## 지금 확인해 볼 것\n- 첫째\n- 둘째\n\n## 해시태그\n#금리 #노후\n';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));

  console.log('\n[1] 페이지가 혼자 서는가 · 앱에는 링크만 남았는가');
  await page.goto(base + '/' + PAGE, { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => typeof KINDS !== 'undefined' && typeof ART !== 'undefined', null, { timeout:20000 });
  is(errs.length === 0, '  열 때 터지는 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));
  const shell = await page.evaluate(() => ({
    seeds: !!document.getElementById('seeds'), rows: !!document.getElementById('rows'),
    map: typeof APEX_MAP !== 'undefined' && !!APEX_MAP.recipes,
    title: document.title
  }));
  is(shell.seeds && shell.rows, '  글감 창고와 편성표가 선다');
  is(shell.map, '  지도(apex-map-data.js)를 같이 읽는다');
  /* 앱 쪽에 같은 것이 남아 있으면 한쪽만 고쳐진다 (CLAUDE.md 5) */
  is(IDX.indexOf('function blogFactory(') < 0 && IDX.indexOf('var BF_KINDS') < 0,
     '  앱(index.html)에서 공장이 빠졌다 — 두 벌로 두지 않았다');
  is(IDX.indexOf('blog.html') > 0 && IDX.indexOf('function blogFactoryLink()') > 0,
     '  앱에는 여는 링크만 남았다');
  is(IDX.indexOf('function blogSeoKit()') > 0,
     '  상위노출 키트는 그대로다 — 공장에 없는 내용이라 갈아엎지 않았다');
  /* 글을 쓰는 문이 둘이면 어느 쪽으로 쓴 글인지 나중에 알 수 없다 (CLAUDE.md 5) */
  is(!/id:'blog_post'|id:'blog_titles'/.test(IDX),
     '  앱 안의 블로그 글 생성기·제목 후보는 치웠다 — 글 쓰는 문은 공장 하나다');
  is(!/blog_post|blog_titles/.test(IDX),
     '  치운 도구 이름이 다른 곳에도 안 남았다 — 없는 이름을 부르지 않는다');

  console.log('\n[2] 갈래 표가 한 곳인가 · 누가 읽나가 달려 있는가');
  const kinds = await page.evaluate(() => ORDER.map(k => ({ k, t:KINDS[k].t, reader:KINDS[k].reader,
    why:!!KINDS[k].why, order:typeof KINDS[k].order === 'function', art:(KINDS[k].art||[]).length })));
  is(kinds.length === 7, '  갈래가 일곱이다 — ' + kinds.map(x => x.t).join(' · '));
  is(await page.evaluate(() => ORDER.length === Object.keys(KINDS).length), '  차례표가 하나도 안 빠뜨렸다');
  is(kinds.every(x => x.why && x.order && x.art >= 2), '  갈래마다 왜·주문서·쓸 그림이 표 안에 있다');
  is(kinds.every(x => x.reader === '고객' || x.reader === '동료'), '  갈래마다 누가 읽나가 달려 있다');
  is(kinds.filter(x => x.reader === '동료').map(x => x.k).sort().join(',') === 'culture,growth',
     '  동료가 읽는 글은 문화·성장 둘이다');
  is(!/kind\s*===\s*['"](news|econ)['"]\s*\?[\s\S]{0,120}['"](ask|culture)['"]\s*\?/.test(SRC),
     '  갈래를 삼항 사슬로 나열하지 않았다');

  console.log('\n[3] 뉴스를 서버 창구에서 칸별로 받는가');
  asked = [];
  await page.evaluate(() => pullNews());
  await page.waitForFunction(() => !document.getElementById('btnNews').disabled, null, { timeout:20000 });
  is(asked.includes('경제'), '  경제 칸을 부른다');
  ['보험','부동산','생활정책','정책자금'].forEach(c => is(asked.includes(c), '  ' + c + ' 칸을 부른다'));
  /* 어느 매체가 어느 칸인지는 config/sources.json 이 정한다. 낱말표를 여기 다시
     적어 두면 두 벌이 되어 한쪽만 늘어난다 (CLAUDE.md 5).
     ※ 낱말이 <b>스쳐 나오는 것</b>을 잡으면 안 된다 — 질문 예시에 「진단비」가
        있다고 낱말표는 아니다. 처음에 그렇게 헛것을 잡았다 (CLAUDE.md 8).
        표는 배열로 생긴다. 배열이 있는지를 본다. */
  is(!/\bkw\s*:\s*\[/.test(SRC) && !/NL_CATS|키워드_/.test(SRC),
     '  기사를 가려내는 낱말 배열을 이 파일에 다시 적어 두지 않았다');
  /* 칸 이름이 sources.json 에 실제로 있는가 — 오타 한 글자면 그 갈래는
     영영 조용히 빈다. 서버는 모르는 칸을 그냥 0건으로 돌려준다. */
  const secs = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'config/sources.json'), 'utf8')));
  const cats = await page.evaluate(() => ORDER.filter(k => KINDS[k].cat)
    .flatMap(k => KINDS[k].cat.split(',')));
  const ghost = cats.filter(c => !secs.includes(c));
  is(ghost.length === 0, '  부르는 칸이 모두 config/sources.json 에 있다 ('
     + cats.join(' · ') + ')' + (ghost.length ? ' — 없는 칸: ' + ghost.join(',') : ''));
  const got = await page.evaluate(() => ({ econ: seeds().econ.map(s => s.title), news: seeds().news.map(s => s.title),
    first: seeds().econ[0] }));
  is(got.econ.length === 2, '  경제 글감이 두 건이다');
  is(got.news.length === 2, '  보험·정책 글감이 두 건이다 (보험 1 + 부동산 1)');
  is(!got.news.some(t => /금리 동결|환율/.test(t)), '  경제 기사가 보험 칸에 섞이지 않는다');
  is(/연합뉴스/.test(got.first.src) && /2026-08-20/.test(got.first.src) && /https:/.test(got.first.src),
     '  근거에 언론사·날짜·링크가 그대로 실린다 (CLAUDE.md 9)');
  const dry = await page.evaluate(() => { S.news.items = []; return [seeds().econ.length, seeds().news.length]; });
  is(dry[0] === 0 && dry[1] === 0, '  못 받았으면 0개다 — 매일 쓰는 갈래라고 지어내지 않는다');

  /* ── 못 받았을 때 <b>왜</b> 못 받았는지 화면에 남는가 ────────────────
     전에는 실패를 toast 한 줄로만 알렸다. toast 는 몇 초 뒤 사라지고 배지는
     「뉴스 아직 안 받음」 그대로였다 — 누른 사람은 <b>눌리지도 않은 줄</b>
     알았다. 실제로 그래서 「블로그가 작동도 안 된다」로 보였다 (1번). */
  const why = await page.evaluate(() => {
    S.news = { at: '', items: [], err: '경제: 공유 토큰이 맞지 않습니다' };
    paint();
    const b = document.getElementById('newsWhy');
    return { on: !!b, txt: b ? b.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(why.on, '  못 받으면 <b>이유가 화면에 남는다</b> — toast 처럼 사라지지 않는다');
  is(/뉴스를 못 받았습니다/.test(why.txt) && /공유 토큰/.test(why.txt),
     '  <b>무엇 때문인지</b> 그대로 적는다 — 「' + why.txt.slice(0, 40) + '…」');
  is(/⚙ 연결|공유 토큰에 앱과 같은 값/.test(why.txt),
     '  <b>무엇을 하면 되는지</b>도 알려 준다 — 누를 자리를 댄다');
  is(/지어내지 않습니다/.test(why.txt),
     '  글감이 없으면 <b>글을 안 만든다</b>고 그 자리에서 밝힌다 (1번)');
  const gone = await page.evaluate(() => {
    S.news = { at: '2026-08-28 09:00', items: [{ t: 'x', u: '', s: '', d: '', cat: '경제' }], err: '' };
    paint();
    return !document.getElementById('newsWhy');
  });
  is(gone, '  받아 오면 그 알림이 <b>사라진다</b> — 다 나은 뒤에도 겁주지 않는다');

  console.log('\n[4] 홍보가 열에 하나인가');
  const mix = await page.evaluate(async () => {
    await pullNews();
    localStorage.setItem('apex_blog_mine_ask', JSON.stringify([{ q:'암 진단비는 얼마가 적당한가요?', at:'2026-08-23' }]));
    S.perweek = 5; plan();
    const by = {}, rd = {};
    S.rows.forEach(r => { by[r.kind] = (by[r.kind]||0)+1; const w = KINDS[r.kind].reader; rd[w] = (rd[w]||0)+1; });
    return { by, rd, n:S.rows.length, mix:MIX.slice(0), missing: ORDER.filter(k => !MIX.includes(k)) };
  });
  is(mix.n === 20, '  주 5편이면 한 달 20편 (' + mix.n + ')');
  is(mix.mix.length % 10 === 0 && mix.mix.filter(x => x === 'ours').length === mix.mix.length / 10,
     '  열에 홍보 하나 (' + mix.mix.length + '편에 ' + mix.mix.filter(x => x === 'ours').length + '편)');
  is(mix.missing.length === 0, '  일곱 갈래가 모두 비율에 있다' + (mix.missing.length ? ' — 빠짐: ' + mix.missing : ''));
  /* 정보 글만 이어지면 이웃이 안 붙는다 — 사람이 보이는 글이 실제로 자주 도는가 */
  is(mix.mix.filter(x => x === 'day').length * 4 >= mix.mix.length,
     '  「오늘 있었던 일」 이 넷에 하나꼴로 돈다 (' + mix.mix.filter(x => x === 'day').length + '/' + mix.mix.length + ')');
  const daily = await page.evaluate(() => { S.perweek = 7; plan();
    return { n:S.rows.length, when:S.rows.slice(0, 3).map(r => r.when), kinds:new Set(S.rows.map(r => r.kind)).size }; });
  is(daily.n === 28, '  «매일» 을 고르면 한 달 28편 (' + daily.n + ')');
  is(new Set(daily.when).size === 3, '  하루에 한 편씩 날짜가 붙는다 — ' + daily.when.join(' · '));
  is(daily.kinds === 7, '  한 달이면 일곱 갈래가 모두 한 번은 돈다');
  /* 화면에 실제로 그 단추가 있는가 — setWeek 만 보면 눌러 볼 자리가 없어도 통과한다 */
  const wk = await page.evaluate(() => { paint();
    return [...document.getElementById('wk').querySelectorAll('button')].map(b => b.textContent.trim()); });
  is(wk.indexOf('매일') >= 0, '  «매일» 단추가 화면에 있다 — ' + wk.join(' · '));
  is(await page.evaluate(() => { setWeek(7); const n = S.rows.length; setWeek(2);
    return n === 0 || S.perweek === 2; }), '  눌러 두면 그대로 남는다');
  is((mix.by.econ||0) >= (mix.by.news||0), '  경제뉴스가 가장 자주 돈다 (' + (mix.by.econ||0) + '편)');
  is((mix.rd['동료']||0) > 0 && (mix.rd['고객']||0) > (mix.rd['동료']||0) * 2,
     '  동료용이 들어가되 고객 글이 훨씬 많다 (고객 ' + mix.rd['고객'] + ' · 동료 ' + mix.rd['동료'] + ')');

  console.log('\n[5] 글감이 없으면 AI 를 안 부르는가');
  const noSeed = await page.evaluate(async () => {
    let calls = 0;
    /* 갈아 끼운 것은 <b>돌려놓는다</b> — 안 그러면 뒤 항목이 「연결돼 있다」 로
       잘못 읽고 조용히 헛통과한다. 실제로 [13] 이 그렇게 넘어갔다. */
    const realAsk = window.ask, realReady = window.aiReady;
    window.ask = function(){ calls++; return Promise.resolve('x'); };
    window.aiReady = () => true;
    localStorage.removeItem('apex_blog_mine_ask'); localStorage.removeItem('apex_blog_mine_culture');
    S.news = { at:'', items:[], err:'' }; S.perweek = 5; plan();
    const empties = S.rows.filter(r => !r.seed).length;
    S.rows.forEach((r, i) => { if (!r.seed) draft(i); });
    await new Promise(r => setTimeout(r, 600));
    window.ask = realAsk; window.aiReady = realReady;
    return { calls, empties, made:S.rows.filter(r => r.out).length,
             shown:/글감 없음/.test(document.getElementById('rows').innerText) };
  });
  is(noSeed.empties > 0, '  글감이 없으면 그 줄은 비워 둔다 (' + noSeed.empties + '줄)');
  is(noSeed.calls === 0 && noSeed.made === 0, '  빈 줄로는 AI 를 부르지 않는다 (부른 횟수 ' + noSeed.calls + ')');
  is(noSeed.shown, '  화면에 「글감 없음」 이라고 적는다');

  console.log('\n[6] 주문서에 근거·그림 목록이 실리는가');
  const order = await page.evaluate(async () => {
    await pullNews();
    localStorage.setItem('apex_blog_mine_ask', JSON.stringify([{ q:'암 진단비는 얼마가 적당한가요?', at:'2026-08-23' }]));
    localStorage.setItem('apex_blog_mine_day', JSON.stringify([{ q:'청구 서류가 반려돼 병원에 다시 다녀왔다', at:'2026-08-23' }]));
    S.perweek = 5; plan();
    const s = seeds(), out = {};
    ORDER.forEach(k => { out[k] = s[k].length ? userPrompt({ kind:k, seed:s[k][0] }) : ''; });
    return { each:out, sys:sysPrompt() };
  });
  const bodies = ORDER_LIST().map(k => order.each[k]);
  function ORDER_LIST(){ return ['econ','news','ask','day','ours','culture','growth']; }
  is(bodies.every(b => b && b.length > 200), '  일곱 갈래가 모두 주문서를 만든다');
  is(new Set(bodies).size === bodies.length, '  갈래마다 주문서가 다르다');
  is(/\[근거\]/.test(order.each.econ) && /연합뉴스/.test(order.each.econ), '  기사 근거가 실린다');
  is(/\[쓸 수 있는 그림\]/.test(order.each.econ) && /뉴스 카드/.test(order.each.econ),
     '  <b>쓸 수 있는 그림 목록</b>이 실린다 — 없는 그림을 안 부르게');
  is(/\[읽는 사람\] 고객/.test(order.each.econ) && /\[읽는 사람\] 동료/.test(order.each.culture),
     '  누가 읽나가 실린다');
  is(/\[\[확인 필요/.test(order.sys), '  모르는 값은 [[확인 필요]] 로 비우라고 시킨다');
  is(/기사 본문을 옮겨 적지 않는다/.test(order.sys), '  기사 본문을 옮기지 말라고 시킨다 (저작권)');
  is(/요건 충족 시/.test(order.sys) && /세무 전문가/.test(order.sys), '  세금은 요건만 적으라고 시킨다');
  is(/심사 결과에 따릅니다/.test(order.sys), '  보험료는 심사 결과에 따른다고 시킨다');
  is(/실명/.test(order.sys) && /홍길동/.test(order.sys), '  실명 금지 · 견본은 홍길동');
  is(/모집 광고도 규정을 받는다/.test(order.sys), '  동료용 글에서 수입을 보장하지 말라고 시킨다');
  is(/목록에 없는 그림을 부르지 않는다/.test(order.sys), '  없는 그림을 부르지 말라고 시킨다');

  /* 앱에서 치운 두 도구(글 생성·제목 후보)가 하던 일이 여기 그대로 있는가.
     안 그러면 「일원화」가 아니라 그냥 없어진 것이다. */
  is(/만들어 넣지 않는다/.test(order.each.day) && /이름과 알아볼 수 있는 사연/.test(order.each.day),
     '  「오늘 있었던 일」 은 적어 두신 것 밖을 보태지 말라고 시킨다 · 이름도 빼라고 시킨다');
  is(/\[읽는 사람\] 고객/.test(order.each.day), '  「오늘 있었던 일」 은 고객이 읽는 글이다');
  is(/## 제목 후보 \d+개/.test(order.each.econ) && /숫자형[\s\S]{0,40}질문형/.test(order.each.econ),
     '  제목 후보를 유형까지 섞어 시킨다 — 치운 «제목 후보» 가 하던 일');
  const LEN = await page.evaluate(() => {
    const out = { keys:Object.keys(LENS), order:LEN_ORDER.slice(), body:{}, max:{} };
    const s = seeds(), row = { kind:'econ', seed:s.econ[0] };
    LEN_ORDER.forEach(k => { setLen(k); out.body[k] = userPrompt(row); out.max[k] = lenNow().max; });
    setLen('보통');
    return out;
  });
  is(LEN.order.length === 4 && LEN.order.length === LEN.keys.length,
     '  글 길이가 넷이다 — ' + LEN.order.join(' · '));
  is(LEN.order.every(k => LEN.keys.indexOf(k) >= 0), '  길이 차례표가 하나도 안 빠뜨렸다');
  is(new Set(LEN.order.map(k => LEN.body[k])).size === 4,
     '  길이를 바꾸면 주문서가 실제로 달라진다 — 치운 «글 생성» 의 분량 고르기');
  is(LEN.max['짧게'] < LEN.max['보통'] && LEN.max['보통'] < LEN.max['길게'] && LEN.max['길게'] < LEN.max['아주 길게'],
     '  길수록 받을 자리도 넓어진다 — 길게 시켜 놓고 중간에 끊기지 않게');
  is(!/\bask\([^)]*,\s*9000\s*\)/.test(SRC), '  받을 자리를 숫자로 박아 두지 않았다');

  console.log('\n[7] 게이트가 잡을 것을 잡는가');
  const G = await page.evaluate(() => {
    const t = s => guard(s);
    return { ban:t('이 상품은 무조건 됩니다. 확정 수익 보장.'), top:t('업계 1위 설계사입니다.'),
      tax:t('이 상품은 비과세입니다.'), name:t('김철수님 사례입니다. 보험료는 심사 결과에 따릅니다.'),
      hole:t('진단비는 [[확인 필요: 상품설명서에서 확인]] 입니다.'),
      needTax:t('세액공제를 받을 수 있습니다.'), needUw:t('보험료는 나이에 따라 다릅니다.'),
      pay:t('우리와 함께하면 수입을 보장합니다.'), pay2:t('억대 연봉 설계사가 되실 수 있습니다.'),
      art:guard('본문 [이미지: 고객 사진 | alt: 고객]', 'econ') };
  });
  is(G.ban.hits.some(h => /무조건/.test(h.w)), '  「무조건」 을 잡는다');
  is(G.ban.hits.some(h => /확정\s*수익/.test(h.w)), '  「확정 수익」 을 잡는다');
  is(G.top.hits.some(h => /1위/.test(h.w)), '  「업계 1위」 를 잡는다');
  is(G.tax.hits.some(h => /비과세/.test(h.w)), '  「비과세입니다」 라는 결론을 잡는다 (CLAUDE.md 2)');
  is(G.name.hits.some(h => /김철수님/.test(h.w)), '  사람 이름처럼 보이는 말을 잡는다 (CLAUDE.md 3)');
  is(G.hole.holes.length === 1 && !G.hole.ok, '  못 채운 [[확인 필요]] 가 남으면 통과시키지 않는다');
  is(G.needTax.miss.length > 0, '  세금 글에 「요건 충족 시」 가 없으면 잡는다');
  is(G.needUw.miss.length > 0, '  보험료 글에 「심사 결과에 따릅니다」 가 없으면 잡는다');
  is(G.pay.hits.some(h => /수입.*보장/.test(h.w)), '  「수입을 보장」 을 잡는다 — 모집 광고 규정');
  is(G.pay2.hits.some(h => /억대/.test(h.w)), '  「억대 연봉」 을 잡는다');
  is(G.art.noart.length === 1, '  못 그리는 그림(「고객 사진」)을 부르면 잡는다');

  console.log('\n[8] 헛것을 안 잡는가');
  const OK = await page.evaluate(() => ({
    good: guard('고객님께서 자주 묻는 질문입니다. 사장님도 같은 고민을 하십니다. 보장 내용과 보험료는 심사 결과에 따릅니다. ' +
      '세액공제는 요건 충족 시 적용되며, 구체적인 판단은 세무 전문가에게 확인하시기 바랍니다. 홍길동님을 예로 들면 이렇습니다.'),
    names: names('고객님 사장님 어머님 대표님 여러분'),
    art: guard('본문 [이미지: 뉴스 카드 | alt: 카드]', 'econ'),
    loose: guard('본문 [이미지: 대표이미지 | alt: 대표]', 'econ'),
    none: guard('그림이 없는 글입니다.', 'econ')
  }));
  is(OK.good.ok, '  멀쩡한 글은 통과한다' + (OK.good.ok ? '' : ' — ' + JSON.stringify(OK.good.hits.map(h => h.w)) + JSON.stringify(OK.good.miss)));
  is(OK.names.length === 0, '  「고객님·사장님·어머님」 을 이름으로 잘못 잡지 않는다');
  is(OK.art.noart.length === 0, '  만들 수 있는 그림은 안 잡는다');
  is(OK.loose.noart.length === 0, '  이름이 조금 달라도 같은 그림이면 통과시킨다');
  is(OK.none.noart.length === 0, '  그림을 안 부른 글을 잡지 않는다');

  console.log('\n[9] 준법 문구 — 읽어 오는가 · 운영에서도 열리는가');
  const cj = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/compliance.json'), 'utf8'));
  const fixed = cj['카드_하단_고정'];
  is(/fetch\('\.\.\/config\/compliance\.json'\)/.test(SRC), '  config/compliance.json 을 읽어 온다');
  is(SRC.indexOf(fixed) < 0, '  그 문구를 페이지에 다시 적어 두지 않았다 (CLAUDE.md 5)');
  /* _redirects 의 /config/* 막음이 강제(!)라, 열어 주는 줄이 없으면
     미리보기에서는 되고 <b>운영에서만</b> 조용히 404 가 난다. */
  const rd = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')
    .filter(l => l.trim() && l.trim()[0] !== '#');
  const allow = rd.findIndex(l => /^\/config\/compliance\.json\s/.test(l));
  const block = rd.findIndex(l => /^\/config\/\*/.test(l));
  is(allow >= 0, '  _redirects 가 compliance.json 을 열어 준다 — 운영에서 404 나지 않게');
  is(allow >= 0 && block >= 0 && allow < block, '  열어 주는 줄이 막는 줄보다 먼저다 (먼저 맞는 규칙이 이긴다)');
  const packed = await page.evaluate(async () => {
    let got = '';
    navigator.clipboard.writeText = t => { got = t; return Promise.resolve(); };
    await comply();
    S.rows = [{ when:'1/1', kind:'ours', seed:{ kind:'ours', title:'x', src:'메뉴' },
      out:'보장 내용은 심사 결과에 따릅니다. 세액공제는 요건 충족 시 적용됩니다.', guard:null }];
    S.rows[0].guard = guard(S.rows[0].out, 'ours');
    await copyPlain(0);
    return { got, ok:S.rows[0].guard.ok, read:!!S.comply };
  });
  is(packed.read, '  실제로 읽어 왔다');
  is(packed.ok && packed.got.indexOf(fixed) >= 0, '  통과한 글에 준법 문구가 붙어 나온다');

  /* 회사 문구를 우리가 지어낼 수 없다. 넣을 자리를 만들고,
     넣기 전까지는 <b>기본값이라고 계속 말해야</b> 한다 — 말없이 붙어 나가면
     회사 문구인 줄 알고 그대로 올린다. (CLAUDE.md 1) */
  const own = await page.evaluate(async () => {
    const out = {};
    out.defaultSays = document.getElementById('tgCmp').textContent;
    out.defaultWarnsOnPublish = (() => { S.rows = [{ when:'1/1', kind:'ours',
      seed:{ kind:'ours', title:'x', src:'메뉴' }, out:'보장 내용은 심사 결과에 따릅니다.', guard:null }];
      S.rows[0].guard = guard(S.rows[0].out, 'ours'); return S.complyMine; })();
    /* 하단 문구를 비운 채로는 저장되지 않는다 */
    CMP_OPEN = true; paint();
    document.getElementById('p_카드_하단_고정').value = '';
    document.getElementById('p_org').value = '○○에셋 ○○본부';
    cmpSave();
    out.blankRefused = !localStorage.getItem('apex_blog_comply');
    /* 회사 문구를 넣는다 — 심의필 번호는 일부러 비워 둔다 */
    document.getElementById('p_카드_하단_고정').value = '○○에셋 준법감시 지침에 따른 회사 고정 문구입니다.';
    document.getElementById('p_org').value = '○○에셋 ○○본부';
    document.getElementById('p_gam').value = '';
    cmpSave();
    await comply();
    let got = '';
    navigator.clipboard.writeText = t => { got = t; return Promise.resolve(); };
    await copyPlain(0);
    out.mine = S.complyMine; out.tag = document.getElementById('tgCmp').textContent;
    out.got = got;
    /* 되돌리면 다시 기본값이라고 말한다 */
    cmpReset(); await comply();
    out.backToDefault = !S.complyMine;
    return out;
  });
  is(/기본값/.test(own.defaultSays), '  회사 문구를 안 넣으면 <b>기본값이라고 딱지에 적는다</b>');
  is(own.defaultWarnsOnPublish === false, '  기본값인 채로는 「회사 것」 이라고 말하지 않는다');
  is(/기본 문구가 아직 기본값입니다|기본값입니다/.test(SRC), '  올리는 화면에서도 기본값이라고 말한다');
  is(own.blankRefused, '  하단 고정 문구를 비운 채로는 저장되지 않는다 — 문구 없이 「회사 것」 이 되면 안 된다');
  is(own.mine === true && /회사 것/.test(own.tag), '  회사 문구를 넣으면 「회사 것」 으로 바뀐다');
  is(own.got.indexOf('○○에셋 준법감시 지침에 따른 회사 고정 문구입니다.') >= 0,
     '  넣은 회사 문구가 실제로 글 끝에 붙어 나간다');
  is(own.got.indexOf(fixed) < 0, '  기본 문구는 더 이상 안 붙는다 — 두 벌이 겹쳐 나가지 않는다');
  is(own.got.indexOf('○○에셋 ○○본부') >= 0, '  적어 두신 소속이 붙는다');
  is(own.got.indexOf('광고심의필') < 0, '  심의필 번호를 안 넣으면 <b>아무것도 안 적는다</b> — 없는 번호를 만들지 않는다');
  is(own.backToDefault, '  되돌리면 다시 기본값이라고 말한다');
  is(SRC.indexOf('26-') < 0 || !/광고심의필\s*['"]?\s*:\s*['"]2[0-9]-\d/.test(SRC),
     '  심의필 번호를 코드에 적어 두지 않았다');
  is(packed.got.indexOf('세제·한도는') >= 0, '  세금 이야기에는 세제 문구가 더 붙는다');
  const blocked = await page.evaluate(async () => {
    let got = 'NONE';
    navigator.clipboard.writeText = t => { got = t; return Promise.resolve(); };
    S.rows = [{ when:'1/1', kind:'ours', seed:{ kind:'ours', title:'x', src:'메뉴' },
      out:'이 상품은 무조건 좋습니다.', guard:null }];
    S.rows[0].guard = guard(S.rows[0].out, 'ours');
    await copyRich(0);
    return got;
  });
  is(blocked === 'NONE', '  고칠 곳이 남은 글은 <b>서식 복사가 안 열린다</b>');
  /* 눌러 보고 나서야 아는 것이 아니라, <b>눌리지 않는 것</b>이 보여야 한다 */
  const btns = await page.evaluate(async () => {
    S.rows = [{ when:'1/1', kind:'econ', seed:{ kind:'econ', title:'x', src:'기사' },
      out:'이 상품은 무조건 좋습니다.', guard:null }];
    S.rows[0].guard = guard(S.rows[0].out, 'econ');
    await show(0);
    const t = document.getElementById('view').innerText;
    const dis = [...document.querySelectorAll('#view button')].filter(b => b.disabled).map(b => b.textContent);
    return { dis, plain:/마크다운으로 복사/.test(t) };
  });
  is(btns.dis.some(t => /서식 있는 복사/.test(t)), '  막혔을 때 그 단추가 <b>눌리지 않는다</b>');
  is(btns.dis.some(t => /고칠 곳 \d+군데/.test(t)), '  단추에 몇 군데 고쳐야 하는지 적힌다 — ' + (btns.dis[0]||''));
  is(btns.plain, '  그래도 마크다운 복사는 열어 둔다 — 손으로 고치실 수 있게');
  /* 저장해 둔 글을 <b>다시 열었을 때</b>도 준법 문구가 붙어야 한다.
     열 때 안 읽어 두면 「못 읽었습니다」 가 잘못 뜬다 — 실제로 그랬다. */
  const restored = await page.evaluate(async () => {
    S.comply = null;                       /* 새로 연 것처럼 */
    let got = '';
    navigator.clipboard.writeText = t => { got = t; return Promise.resolve(); };
    S.rows = [{ when:'1/1', kind:'ours', seed:{ kind:'ours', title:'x', src:'메뉴' },
      out:'보장 내용은 심사 결과에 따릅니다.', guard:null }];
    S.rows[0].guard = guard(S.rows[0].out, 'ours');
    await copyPlain(0);
    return got;
  });
  is(restored.indexOf('못 읽었습니다') < 0 && restored.indexOf(fixed) >= 0,
     '  저장해 둔 글을 다시 열어도 준법 문구가 붙는다');

  console.log('\n[10] 그림이 서는가 · PNG 로 바뀌는가 · 없는 숫자를 안 그리는가');
  const art = await page.evaluate(async (draft) => {
    await pullNews();
    localStorage.setItem('apex_blog_mine_ask', JSON.stringify([{ q:'암 진단비는 얼마가 적당한가요?', at:'2026-08-23' }]));
    S.perweek = 5; plan();
    const rows = {};
    ORDER.forEach(k => { const r = S.rows.find(x => x.seed && x.kind === k); if (r) { r.out = draft; rows[k] = r; } });
    const out = [];
    ORDER.forEach(k => KINDS[k].art.forEach(id => {
      const b = build(id, rows[k]);
      out.push({ k, id, t:ART[id].t, err:b.err || '', svg:b.svg || '', alt:b.alt || '', file:b.file || '',
                 w:b.w || 0, h:b.h || 0,
                 txt:(b.svg ? (b.svg.match(/<tspan[^>]*>([^<]*)<\/tspan>/g) || []).map(x => x.replace(/<[^>]+>/g,'')).join(' ') : '') });
    }));
    return out;
  }, DRAFT);
  const okArt = art.filter(a => !a.err);
  is(okArt.length >= 15, '  갈래마다 그림이 선다 (' + okArt.length + '장)');
  is(okArt.every(a => a.svg.indexOf('<svg') === 0 && a.w > 0 && a.h > 0), '  모두 크기를 가진 SVG 다');
  is(okArt.every(a => a.alt.length > 4 && /\.png$/.test(a.file)), '  그림마다 alt 와 파일 이름이 있다');
  const money = okArt.filter(a => /[0-9][0-9,]*\s*(원|만원|억|%|퍼센트|배)/.test(a.txt));
  is(money.length === 0, '  그림 글자에 금액·퍼센트가 없다 — 없는 숫자를 그리지 않는다'
     + (money.length ? ' — ' + money[0].id + ': ' + money[0].txt.slice(0, 40) : ''));
  const card = okArt.find(a => a.id === 'news');
  is(!!card && /금리|환율/.test(card.svg), '  뉴스 카드에 기사 제목이 그대로 들어간다');
  is(!!card && /연합뉴스|이데일리/.test(card.svg) && /2026-08-/.test(card.svg), '  언론사와 날짜가 함께 들어간다');
  is(!!card && /본문은 원문에서/.test(card.svg), '  기사 본문은 옮기지 않았다고 적는다');
  const noDraft = await page.evaluate(() => ({
    cover: build('cover', { kind:'econ', seed:{ kind:'econ', title:'x', src:'y' }, out:'' }).err || '',
    toc:   build('toc',   { kind:'econ', seed:{ kind:'econ', title:'x', src:'y' }, out:'' }).err || '' }));
  is(/초안을 먼저/.test(noDraft.cover) && /초안을 먼저/.test(noDraft.toc), '  초안이 없으면 못 만든다고 말한다');
  const png = await page.evaluate(async () => {
    const r = build('w8', {});
    if (r.err) return { ok:false, why:r.err };
    const u = URL.createObjectURL(new Blob([r.svg], { type:'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    if (!await new Promise(res => { img.onload = () => res(true); img.onerror = () => res(false); img.src = u; }))
      return { ok:false, why:'그림을 못 읽었습니다' };
    const c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
    const g = c.getContext('2d'); g.fillStyle = '#FFF'; g.fillRect(0, 0, r.w, r.h); g.drawImage(img, 0, 0);
    const b = await new Promise(res => c.toBlob(res, 'image/png'));
    if (!b) return { ok:false, why:'PNG 로 안 바뀝니다' };
    const head = new Uint8Array(await b.slice(0, 8).arrayBuffer());
    return { ok:true, size:b.size, png:head[1] === 0x50 && head[2] === 0x4E && head[3] === 0x47, w:c.width, h:c.height };
  });
  is(png.ok && png.png, '  SVG 가 진짜 PNG 로 바뀐다' + (png.why ? ' — ' + png.why : ''));
  is(png.ok && png.size > 3000, '  빈 그림이 아니다 (' + (png.ok ? Math.round(png.size/1024) + 'KB' : '?') + ')');
  is(png.ok && png.w === 1200, '  블로그에 쓸 만한 크기다 (' + (png.ok ? png.w + '×' + png.h : '?') + ')');

  console.log('\n[11] 올리기 — 서식이 살아서 넘어가는가');
  /* 마크다운을 그대로 붙이면 편집기에 「##」 이 글자로 보인다. 여기가
     이 화면의 이유라, 제일 꼼꼼히 본다. */
  const paste = await page.evaluate(d => ({
    html: md2html(d, true), view: md2html(d, false),
    plain: d
  }), DRAFT);
  is(/<h2>지금 무슨 일이 있었나<\/h2>/.test(paste.html), '  ## 이 진짜 제목(h2)으로 바뀐다');
  is(/<table>[\s\S]*<th>구분<\/th>[\s\S]*<td>가<\/td>[\s\S]*<\/table>/.test(paste.html), '  표가 진짜 표(table)로 바뀐다');
  is(/<blockquote>한 줄 강조입니다\.<\/blockquote>/.test(paste.html), '  인용이 인용으로 바뀐다');
  is(/<ul><li>첫째<\/li><li>둘째<\/li><\/ul>/.test(paste.html), '  목록이 목록으로 바뀐다');
  is(/class="ph"[^>]*>[\s\S]*뉴스 카드[\s\S]*그림을 넣으세요/.test(paste.html),
     '  [이미지: …] 자리가 <b>「여기에 넣으세요」</b> 로 보인다 — 붙여넣고 어디인지 바로 안다');
  is(paste.html.indexOf('##') < 0 && paste.html.indexOf('| ---') < 0,
     '  붙여넣을 글에 마크다운 기호가 남지 않는다');
  const holes = await page.evaluate(() => ({
    view: md2html('진단비는 [[확인 필요: 확인]] 입니다.', false),
    paste: md2html('진단비는 [[확인 필요: 확인]] 입니다.', true) }));
  is(/class="hole"/.test(holes.view), '  화면에서는 못 채운 자리가 <b>노랗게</b> 보인다');
  is(!/\[\[/.test(holes.paste), '  붙여넣을 때는 이중 괄호를 남기지 않는다');
  const rich = await page.evaluate(async () => {
    let got = null;
    window.ClipboardItem = function(o){ this.o = o; };
    navigator.clipboard.write = async items => { got = items[0].o; };
    S.rows = [{ when:'1/1', kind:'econ', seed:{ kind:'econ', title:'x', src:'기사' },
      out:'## 무엇이 달라지나\n보험료는 심사 결과에 따릅니다.\n', guard:null }];
    S.rows[0].guard = guard(S.rows[0].out, 'econ');
    await copyRich(0);
    if (!got) return { ok:false };
    return { ok:true, keys:Object.keys(got), html:await got['text/html'].text(), plain:await got['text/plain'].text() };
  });
  is(rich.ok && rich.keys.includes('text/html') && rich.keys.includes('text/plain'),
     '  서식(HTML)과 글자를 <b>둘 다</b> 클립보드에 넣는다');
  is(rich.ok && /<h2>무엇이 달라지나<\/h2>/.test(rich.html), '  넘어가는 서식 안에 제목이 살아 있다');
  is(rich.ok && rich.plain.indexOf('## 무엇이 달라지나') >= 0, '  서식을 못 받는 곳에는 글자가 간다');
  const steps = await page.evaluate(() => {
    S.rows[0].out = '## 하나\n보험료는 심사 결과에 따릅니다.\n'; S.rows[0].guard = guard(S.rows[0].out, 'econ');
    show(0);
    const t = document.getElementById('view').innerText;
    return { steps:(document.querySelectorAll('.steps li')||[]).length, txt:t };
  });
  is(steps.steps >= 5, '  올리는 순서가 체크할 수 있게 나온다 (' + steps.steps + '단계)');
  is(/서식 있는 복사/.test(steps.txt) && /모두 내려받기/.test(steps.txt),
     '  «서식 있는 복사» 와 «그림 모두 내려받기» 가 한자리에 있다');
  is(/준법감시/.test(steps.txt), '  마지막에 준법감시를 거치라고 적혀 있다');

  console.log('\n[12] 자료를 여기에 다시 적어 두지 않았는가');
  const reuse = await page.evaluate(() => ({
    w8: build('w8', {}).svg || '', kids: (APEX_MAP.kids && APEX_MAP.kids.wallets) || [] }));
  const hit = reuse.kids.filter(n => reuse.w8.indexOf(n.slice(0, 4)) >= 0).length;
  is(reuse.kids.length === 8 && hit === 8, '  여덟 칸 이름을 <b>지도에서</b> 읽는다 (' + hit + '/8)');
  is(ART_SRC.indexOf('생활 통장') < 0 && SRC.indexOf('생활 통장') < 0,
     '  여덟 칸 이름을 파일에 적어 두지 않았다 — 지도가 바뀌면 같이 바뀐다');
  const noMap = await page.evaluate(() => {
    const keep = window.APEX_MAP; window.APEX_MAP = undefined;
    const g = growthSeeds().length, w = build('w8', {}).err || '';
    window.APEX_MAP = keep; return { g, w };
  });
  is(noMap.g === 0, '  지도를 못 읽으면 성장 글감은 0개다 — 없는 순서를 만들지 않는다');
  is(/지도[^]{0,20}못 읽어/.test(noMap.w), '  지도를 못 읽으면 8통장 그림도 안 그린다 — 이름을 지어내지 않는다');
  is(/localStorage/.test(SRC) && SRC.indexOf("'apex_studio_'") > 0,
     '  AI 연결·내 소개는 앱에 저장해 둔 값을 그대로 쓴다');

  console.log('\n[13] 연결 — 앱과 같은 칸에 쓰는가 · 키를 되비추지 않는가');
  /* 칸을 따로 만들면 두 벌이 되어 「앱에서는 되는데 여기서는 안 되는」 자리가 생긴다.
     그리고 키는 화면에 통째로 다시 띄우면 안 된다 (CLAUDE.md 10). */
  const conn = await page.evaluate((K) => {
    ['apikey','proxy','apptoken','model','conn'].forEach(k => localStorage.removeItem('apex_studio_' + k));
    localStorage.removeItem('apex_intro_guest');
    CONN_OPEN = false; paint();
    const shownWhenEmpty = !document.getElementById('conn').hidden;
    /* 내 키로 저장 */
    connMode('direct');
    document.getElementById('c_key').value = K;
    document.getElementById('c_model').value = 'claude-sonnet-4-6';
    document.getElementById('c_org').value = '○○본부';
    document.getElementById('c_name').value = '홍길동';
    document.getElementById('c_title').value = '사업단장';
    connSave();
    const box = document.getElementById('conn').innerHTML;
    const intro = JSON.parse(localStorage.getItem('apex_intro_guest') || 'null');
    return {
      shownWhenEmpty,
      key: localStorage.getItem('apex_studio_apikey'),
      model: localStorage.getItem('apex_studio_model'),
      ready: aiReady(),
      full: box.indexOf(K) >= 0,
      masked: box.indexOf(K.slice(0,7) + '…' + K.slice(-4)) >= 0,
      inputVal: (document.getElementById('c_key') || {}).value,
      intro, brandLine: brand()
    };
  }, FAKE_KEY);
  is(conn.shownWhenEmpty, '  연결이 없으면 <b>묻지 않아도</b> 연결 칸이 열려 있다');
  is(conn.key === FAKE_KEY, '  키를 앱이 쓰는 그 칸(apex_studio_apikey)에 쓴다');
  is(conn.model === 'claude-sonnet-4-6', '  모델도 같은 칸에 쓴다');
  is(conn.ready, '  넣고 나면 연결됨으로 바뀐다');
  is(!conn.full, '  저장한 키를 화면에 <b>그대로 되비추지 않는다</b> (CLAUDE.md 10)');
  is(conn.masked, '  앞뒤 몇 자만 보여 준다 — 무엇을 넣어 뒀는지는 알 수 있게');
  is(!conn.inputVal, '  입력 칸을 비워 둔다 — 캡처·어깨너머로 안 읽히게');
  is(!!conn.intro && conn.intro.org === '○○본부', '  그림 꼬리말 이름을 앱이 쓰는 칸(apex_intro_)에 쓴다');
  is(/○○본부/.test(conn.brandLine) && /홍길동 사업단장/.test(conn.brandLine),
     '  그림 꼬리말이 그 값을 그대로 쓴다 — ' + conn.brandLine);
  const footed = await page.evaluate(() => build('w8', {}).svg);
  is(/○○본부/.test(footed), '  그림에 실제로 꼬리말이 들어간다');
  const empty = await page.evaluate(() => {
    localStorage.removeItem('apex_intro_guest');
    return { line: brand(), svg: build('w8', {}).svg };
  });
  is(empty.line === '', '  안 적어 두면 꼬리말이 빈다 — 없는 이름을 만들지 않는다');
  is(!/○○본부/.test(empty.svg), '  그림에도 안 들어간다');
  /* 빈 칸으로 저장했다고 넣어 둔 키가 날아가면 안 된다 */
  const keep = await page.evaluate(() => {
    document.getElementById('c_key').value = '';
    connSave();
    return localStorage.getItem('apex_studio_apikey');
  });
  is(keep === FAKE_KEY, '  빈 칸으로 저장해도 넣어 둔 키가 안 날아간다');
  /* 프록시 쪽도 같은 칸을 쓴다 */
  const px = await page.evaluate(() => {
    connMode('proxy');
    document.getElementById('c_proxy').value = 'https://example.test/api/generate';
    document.getElementById('c_tok').value = 'tok-123';
    connSave();
    return { p: localStorage.getItem('apex_studio_proxy'), t: localStorage.getItem('apex_studio_apptoken'),
             c: localStorage.getItem('apex_studio_conn'), ready: aiReady() };
  });
  is(px.p === 'https://example.test/api/generate' && px.t === 'tok-123' && px.c === 'proxy',
     '  프록시·토큰·방식도 앱이 쓰는 칸에 그대로 쓴다');
  is(px.ready, '  프록시만으로도 연결됨이 된다');
  const badUrl = await page.evaluate(() => {
    document.getElementById('c_proxy').value = 'example.test/api';
    connSave();
    return localStorage.getItem('apex_studio_proxy');
  });
  is(badUrl === 'https://example.test/api/generate', '  https:// 가 아닌 주소는 저장하지 않는다');
  /* 연결 확인이 진짜로 부르는가 — 눌러 보고 답을 받아야 「된다」 고 말할 수 있다 */
  const tested = await page.evaluate(async () => {
    let hit = null;
    const real = window.fetch;
    window.fetch = async (u, o) => {
      if (String(u).includes('/api/generate')) { hit = JSON.parse(o.body);
        return new Response(JSON.stringify({ content:[{ type:'text', text:'좋습니다' }] }), { status:200 }); }
      return real(u, o);
    };
    document.getElementById('c_proxy').value = 'https://example.test/api/generate';
    connSave();
    await connTest();
    window.fetch = real;
    return hit;
  });
  is(!!tested, '  «연결 확인» 이 진짜로 AI 를 부른다');
  is(!!tested && tested.max_tokens <= 64, '  확인은 아주 짧게 부른다 (' + (tested ? tested.max_tokens : '?') + '토큰) — 지갑을 안 태운다');
  is(!!tested && tested.model === 'claude-sonnet-4-6', '  저장해 둔 모델로 부른다');
  /* 키가 코드나 로그에 박혀 있지 않은가 (CLAUDE.md 10) */
  is(!/sk-ant-[A-Za-z0-9_-]{10,}/.test(SRC) && !/sk-ant-[A-Za-z0-9_-]{10,}/.test(ART_SRC),
     '  페이지 어디에도 진짜 키가 적혀 있지 않다');
  /* 점검 파일 자신도 지킨다 — 여기 박아 둔 가짜 키 하나가 배포를 세 번 세웠다 */
  const SELF = fs.readFileSync(path.join(ROOT, 'scripts/check-blogauto.js'), 'utf8');
  is(!/sk-ant-[A-Za-z0-9_-]{10,}/.test(SELF),
     '  이 점검 파일에도 키 모양 문자열이 없다 — 배포가 키로 보고 세운다');
  is(!/console\.log\([^)]*apikey/i.test(SRC), '  키를 로그에 찍지 않는다');

  console.log('\n[14] 매일 한 편 — 아침에 누를 단추가 하나인가');
  /* 여기 [14] 를 만들며 <b>안 울리는 알람</b>을 하나 잡았다. 「글감이 없으면 AI 를
     안 부른다」 는 연결을 안 해 둔 채로 재면 <b>언제나 통과한다</b> — 글감이 아니라
     연결이 없어서 안 부른 것이기 때문이다. 그래서 연결을 먼저 해 두고 잰다.
     그리고 되돌리기는 「막는 줄을 지운다」 가 아니라 <b>「없는 글감을 지어내 채운다」</b>
     로 해야 울린다 — 그것이 실제로 무서운 자리다. (CLAUDE.md 8) */
  /* 매일 쓰려면 아침에 누를 것이 하나여야 한다. 다만 <b>글감이 없으면 만들지 않는다</b>. */
  const day = await page.evaluate(async () => {
    const out = {};
    localStorage.clear();
    S.rows = []; S.news = { at:'', items:[], err:'' }; S.busy = -1; S.comply = null;
    S.perweek = 7; await pullNews(); plan();
    out.hasToday   = todayAt();
    out.stamped    = S.rows.every(r => /^\d{4}-\d{2}-\d{2}$/.test(r.ymd || ''));
    out.firstIsNow = S.rows[0] && S.rows[0].ymd === ymd(0);
    /* 오늘 줄이 없으면 그 뒤는 전부 못 한다 — 여기서 멈추고 <b>왜</b> 인지 말한다 */
    if (out.hasToday < 0) { out.stopped = '편성표에 오늘 줄이 없다'; return out; }

    /* ① 써 둔 글은 다시 편성해도 안 지워진다 — 그리고 두 벌이 되지도 않는다 */
    S.rows[out.hasToday].out = '어제 쓴 글';
    S.rows[out.hasToday].guard = { ok:true, hits:[], miss:[], holes:[], noart:[] };
    S.perweek = 2; plan();
    out.kept = S.rows.filter(r => r.out === '어제 쓴 글').length;
    out.dupDays = S.rows.length - new Set(S.rows.map(r => r.ymd)).size;

    /* ② 글감이 없으면 «오늘 것» 이 AI 를 안 부른다.
       연결을 <b>먼저</b> 해 둔다 — 안 그러면 「연결이 없어서」 안 부른 것을
       「글감이 없어서」 안 불렀다고 잘못 읽는다. 그러면 이 알람은 안 울린다. */
    localStorage.setItem('apex_studio_apikey', 'x');
    S.perweek = 7; S.rows = []; plan();
    let i = todayAt(); S.rows[i].seed = null; S.rows[i].kind = 'day'; S.rows[i].out = '';
    localStorage.removeItem('apex_blog_mine_day');
    let calls = 0; const realAsk = window.ask; window.ask = () => { calls++; return Promise.resolve('x'); };
    await today1();
    out.noSeedCalls = calls; out.stillEmpty = !S.rows[todayAt()].out;

    /* ③ 글감을 적어 두면 한 번 눌러 초안까지 간다 */
    localStorage.setItem('apex_blog_mine_day',
      JSON.stringify([{ q:'청구 서류가 반려돼 병원에 다시 다녀왔다', at:ymd(0) },
                      { q:'어제 적어 둔 것', at:ymd(-1) }]));
    await today1();
    out.seedCalls = calls; out.drafted = !!S.rows[todayAt()].out;
    out.boundSeed = (S.rows[todayAt()].seed || {}).title;
    window.ask = realAsk;

    /* ④ 뉴스가 어제 것이면 오늘 것으로 다시 받고 시작한다 */
    S.rows = []; S.perweek = 7; plan();
    i = todayAt(); S.rows[i].kind = 'econ'; S.rows[i].out = ''; S.rows[i].seed = null;
    S.news.at = ymd(-1) + ' 07:00';
    out.staleBefore = newsFresh();
    window.ask = () => Promise.resolve('x');
    await today1();
    out.freshAfter = newsFresh();
    window.ask = realAsk;

    /* ⑤ 밀린 줄 · 이어서 며칠 */
    S.rows = [{ ymd:ymd(-3), when:'x', kind:'econ', seed:null, out:'', guard:null, up:false },
              { ymd:ymd(-2), when:'x', kind:'econ', seed:null, out:'', guard:null, up:true  },
              { ymd:ymd(-1), when:'x', kind:'econ', seed:null, out:'', guard:null, up:true  },
              { ymd:ymd(0),  when:'x', kind:'econ', seed:null, out:'', guard:null, up:false }];
    out.late = lateRows().length; out.streakYesterday = streak();
    S.rows[3].up = true; out.streakToday = streak();
    paint();
    out.rowNow  = document.querySelectorAll('#rows tr.now').length;
    out.rowLate = document.querySelectorAll('#rows tr.late').length;
    out.card    = document.getElementById('today').textContent;
    return out;
  });
  is(day.hasToday === 0, '  편성하면 <b>오늘부터</b> 채운다 — 내일부터가 아니다' +
     (day.stopped ? ' — ' + day.stopped : ''));
  is(day.stamped && day.firstIsNow, '  줄마다 진짜 날짜가 붙는다 — 라벨만 보고 오늘을 다시 세지 않는다');
  if (day.stopped) { is(false, '  오늘 줄이 없어 [14] 의 나머지를 못 봤다 — 위를 먼저 고치십시오'); }
  is(day.kept === 1, '  다시 편성해도 <b>써 둔 글이 안 지워진다</b> — 매일 쓰면 매일 편성을 누르게 된다');
  is(day.dupDays === 0, '  한 날짜가 <b>두 줄이 되지 않는다</b> — 오늘 것이 둘이면 어느 것을 쓸지 모른다');
  is(day.noSeedCalls === 0 && day.stillEmpty,
     '  글감이 없으면 «오늘 것» 이 <b>AI 를 안 부른다</b> (부른 횟수 ' + day.noSeedCalls + ')');
  is(day.seedCalls === 1 && day.drafted, '  글감을 적어 두면 <b>한 번 눌러</b> 초안까지 간다');
  is(day.boundSeed === '청구 서류가 반려돼 병원에 다시 다녀왔다',
     '  <b>오늘 아침 적은 것</b>에 묶인다 — 어제 것이 아니라 (' + day.boundSeed + ')');
  is(day.staleBefore === false && day.freshAfter === true,
     '  뉴스가 어제 것이면 <b>오늘 것으로 다시 받고</b> 시작한다 — 날짜 틀린 글이 나가지 않게');
  is(day.late === 1, '  밀린 줄을 센다 (' + day.late + ') — 안 올린 지난 줄만');
  is(day.streakYesterday === 2, '  오늘 것을 안 올렸으면 <b>어제부터</b> 센다 (' + day.streakYesterday + '일)');
  is(day.streakToday === 3, '  오늘 것을 올리면 오늘까지 센다 (' + day.streakToday + '일)');
  is(day.rowNow === 1 && day.rowLate === 1, '  표에서 오늘 줄과 밀린 줄이 눈에 보인다');
  is(/오늘/.test(day.card), '  오늘 칸이 맨 위에 선다');
  /* 날짜를 여러 곳에서 다시 세면 하루가 어긋난다 (CLAUDE.md 5) */
  is((SRC.match(/new Date\(Date\.now\(\)\s*\+\s*9\s*\*/g) || []).length === 1,
     '  한국 시각을 세는 곳이 <b>한 곳뿐</b>이다');

  console.log('\n[15] 매일 올려도 안 지겨운가 · 글감이 마르기 전에 말하는가');
  const more = await page.evaluate(async () => {
    const out = {};
    localStorage.clear(); S.rows=[]; S.busy=-1; S.perweek=7; S.comply=null;
    localStorage.setItem('apex_blog_mine_day', JSON.stringify([
      { q:'첫째 날 일', at:ymd(0) }, { q:'둘째 날 일', at:ymd(0) }]));
    await pullNews(); plan();

    /* ① 대표 이미지가 날마다·갈래마다 다른가 — 다시 그리면 같은가 */
    const mk = (d, k) => { const r={ ymd:d, kind:k, seed:{kind:k,title:'x',src:'y'},
      out:'## 제목 후보\n- 오늘의 제목입니다\n\n## 본문\n글.\n' }; return build('cover', r); };
    const a = mk(ymd(0),'day'), b = mk(ymd(1),'day'), c = mk(ymd(0),'econ'), a2 = mk(ymd(0),'day');
    out.diffDay  = a.svg !== b.svg;
    out.diffKind = a.svg !== c.svg;
    out.same     = a.svg === a2.svg;
    out.kindColor = c.svg.indexOf(KINDS.econ.c) >= 0 && a.svg.indexOf(KINDS.day.c) >= 0;
    /* 무늬에 숫자·눈금이 섞이지 않았나 — 그림이 근거가 되면 안 된다 */
    out.noNums = !/<text[^>]*>\s*[\d,.]+\s*</.test(a.svg);

    /* ② 요 며칠 올린 제목을 주문서에 실어 「같은 이야기 그만」 이라고 시키는가 */
    S.rows=[{ ymd:ymd(-1), when:'x', kind:'day', seed:{kind:'day',title:'어제',src:'z'},
              out:'## 제목 후보\n- 어제 쓴 제목입니다\n\n## 본문\n글.\n', guard:null, up:true },
            { ymd:ymd(0), when:'y', kind:'day', seed:{kind:'day',title:'오늘',src:'z'},
              out:'', guard:null, up:false }];
    out.recent = recentTitles(S.rows[1]);
    out.prompt = userPrompt(S.rows[1]);
    out.selfFree = recentTitles(S.rows[0]).indexOf('어제 쓴 제목입니다') < 0;

    /* ③ 글감이 며칠치 남았나 */
    S.rows=[]; plan();
    out.runFull = runway().n;
    localStorage.removeItem('apex_blog_mine_day');
    localStorage.removeItem('apex_blog_mine_ask');
    S.rows=[]; plan(); const R2=runway(); out.runThin=R2.n; out.dry=R2.dry;
    paint(); out.warns = (function(){ const h=document.getElementById('today').innerHTML;
      return /비어 있는 갈래/.test(h) && R2.dry.every(k=>h.indexOf(KINDS[k].t)>=0); })();

    /* ④ 내일 것 — 글감이 없으면 역시 안 만든다 */
    let calls=0; const realAsk=window.ask; window.ask=()=>{calls++;return Promise.resolve('x');};
    localStorage.setItem('apex_studio_apikey','x');
    S.rows=[]; plan();
    const ti=S.rows.findIndex(r=>r.ymd===ymd(1));
    S.rows[ti].kind='day'; S.rows[ti].seed=null; S.rows[ti].out='';
    await tomorrow1(); out.tmrNoSeed=calls;
    localStorage.setItem('apex_blog_mine_day', JSON.stringify([{ q:'내일 쓸 것', at:ymd(0) }]));
    await tomorrow1(); out.tmrCalls=calls; out.tmrDone=!!S.rows[ti].out;
    out.tmrIsTomorrow=S.rows[ti].ymd===ymd(1);
    window.ask=realAsk;
    return out;
  });
  is(more.diffDay,  '  대표 이미지가 <b>날마다 다르다</b> — 서른 날 같은 그림이면 죽어 보인다');
  is(more.diffKind, '  갈래마다도 다르다');
  is(more.same,     '  같은 글은 다시 그려도 <b>같은 그림</b>이다 — 어제 글이 딴 그림이 되면 헷갈린다');
  is(more.kindColor,'  갈래 색을 <b>갈래 표에서</b> 읽는다 — 그림 쪽에 다시 안 적었다');
  is(more.noNums,   '  무늬에 숫자·눈금이 없다 — 그림이 근거가 되면 안 된다 (CLAUDE.md 9)');
  is(more.recent.indexOf('어제 쓴 제목입니다') >= 0, '  어제 올린 제목을 안다 (' + more.recent.join(' · ') + ')');
  is(/요 며칠 이미 올린 글/.test(more.prompt) && /같은 이야기를 다시 하지 않는다/.test(more.prompt),
     '  <b>같은 이야기를 또 하지 말라</b>고 주문서에 실어 보낸다');
  is(more.selfFree, '  지금 쓰는 글 자신은 그 목록에서 뺀다 — 자기 제목을 피하라고 시키면 안 된다');
  is(more.runFull > more.runThin, '  글감이 줄면 쓸 수 있는 편수도 준다 (' + more.runFull + ' → ' + more.runThin + ')');
  is(more.dry.indexOf('day') >= 0 && more.dry.indexOf('ask') >= 0,
     '  <b>어느 갈래가 비었는지</b> 이름으로 말한다 — ' + more.dry.join(' · '));
  is(more.dry.indexOf('econ') < 0, '  이레치만 본다 — 차 있는 갈래를 비었다고 하지 않는다 (헛것 금지 · CLAUDE.md 8)');
  is(more.warns, '  <b>바닥나기 전에</b> 빈 갈래를 이름으로 화면에 적는다 — 아침에 열어 보고서야 알면 그날은 못 쓴다');
  is(more.tmrNoSeed === 0, '  «내일 것» 도 글감이 없으면 <b>AI 를 안 부른다</b>');
  is(more.tmrCalls === 1 && more.tmrDone && more.tmrIsTomorrow,
     '  «내일 것» 은 <b>내일 줄</b>을 만든다 — 오늘 것을 덮어쓰지 않는다');

  is(errs.length === 0, '\n화면에 터진 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? '✗ 블로그 공장 점검 ' + bad + '군데 실패'
                  : '✓ 블로그 공장 점검 통과 — 글감 없이는 글을 안 만들고, 서식과 그림까지 올라갑니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
