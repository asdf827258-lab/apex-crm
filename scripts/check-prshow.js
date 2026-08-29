/* <b>「준비하지않으면, 준비하면, 연금 종신 내용 하나도 없다」</b>

   이 세 칸은 <b>AI 가 쓴 것만</b> 담고 있었습니다. 제안서는 여섯 조각을
   동시에 시켜 만드는데, 그중 <code>real</code>·<code>plan</code> 조각이
   시간초과나 형식 오류로 빠지면 세 칸이 통째로 「(없음)」 이 됐습니다.
   8통장과 문서는 앱이 채워 주는데 <b>이 세 칸만 채우는 자리가 없었습니다.</b>

   그렇다고 없는 숫자를 만들 수는 없습니다(CLAUDE.md 1번). 그래서 둘로
   나눕니다 — 숫자가 <b>아닌</b> 것(어떤 일이 벌어지는가)은 앱이 채우고
   <b>「앱이 채운 일반 설명이고 고객님 숫자가 아닙니다」 라고 화면에 못
   박습니다.</b> 숫자는 「확인 필요」 로 둡니다. 그리고 <b>그 조각만</b>
   다시 만드는 단추를 줍니다 — 여섯 개를 다시 돌리면 여섯 배입니다.

   ── 발표모드 ──────────────────────────────────────────────────────
   「이거 발표모드 따로 만들어야될거 같아. <b>절대로 내용이 짤리지
   않도록</b> 하고」

   발표 화면에서 흔히 하는 실수가 <code>overflow:hidden</code> 으로 한
   장을 화면에 맞추는 것입니다. 그러면 글이 길어질 때 <b>아랫부분이
   말없이 사라집니다.</b> 고객은 그 문단이 있는 줄도 모릅니다. 그래서
   몸통은 <b>언제나 스스로 스크롤</b>하고, 높이를 고정하지 않습니다.

   지키는 것
     1. 세 칸이 <b>비지 않는다</b>
     2. 앱이 채운 것은 <b>앱이 채웠다고 화면에 적는다</b> · 금액은 「확인 필요」
     3. <b>그 조각만</b> 다시 만들 수 있다
     4. 발표모드가 뜨고 · 넘어가고 · ESC 로 닫힌다
     5. <b>안 잘린다</b> — 긴 글이 다 나오고 스크롤이 있다               */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 앱이 증권에서 읽어낸 것을 흉내낸 자료 — 견본 사람은 홍길동 (CLAUDE.md 3번) */
const SCAN = {
  who: { name: '홍길동', age: 47, sex: '남' },
  total: { n: 3, fee: 184000 }, riderN: 42,
  areas: [{ area: '실손', rows: [1, 2], short: 0 }, { area: '암', rows: [1], short: 1 }],
  riderAreas: [{ area: '수술·입원', rows: [1, 2, 3], short: 0 }]
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] AI 가 세 조각을 못 줘도 — 칸이 비지 않는다');
  const A = await page.evaluate((SCAN) => {
    /* AI 가 real·plan 조각을 통째로 못 준 상황 */
    const p = prLocalFill({ title: '내 보험', slides: [{ kicker: '표지', title: 'x', lead: '', rows: [] }] }, SCAN, 'explain');
    return {
      reality: (p.reality || []).length,
      costs: (p.reality || []).map(x => x.cost),
      pre: ((p.benefit || {}).prepared || []).length,
      un: ((p.benefit || {}).unprepared || []).length,
      rLocal: (p.reality || []).every(x => x._local),
      bLocal: !!(p.benefit || {})._local,
      /* 없는 숫자를 만들지 않았는가 */
      noMoney: !(p.reality || []).some(x => /\d[\d,]*\s*(만원|억)/.test(x.cost || ''))
    };
  }, SCAN);
  is(A.reality === 4, '  <b>준비하지 않으면</b> 이 네 가지로 선다 — ' + A.reality + '개');
  is(A.pre + A.un >= 3, '  <b>준비하면</b> 이 증권에서 읽은 것으로 선다 — 준비 ' + A.pre + ' · 빈 것 ' + A.un);
  is(A.noMoney, '  <b>없는 금액을 만들지 않는다</b> — 전부 「확인 필요」 (' + A.costs.join(' · ') + ')');
  is(A.rLocal && A.bLocal, '  앱이 채운 것에 <b>표시가 붙는다</b> — 나중에 화면이 그걸 밝힌다');

  console.log('\n[2] 앱이 채웠다고 화면에 적는다 — 성공처럼 말하지 않는다 (1번)');
  const B = await page.evaluate((SCAN) => {
    PR.plan = prLocalFill({ title: '내 보험', slides: [{ kicker: '표지', title: 'x', lead: '', rows: [] }] }, SCAN, 'explain');
    PR.scan = SCAN; PR.age = 47;
    const d = document.createElement('div'); d.innerHTML = prRealityHtml();
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    const d2 = document.createElement('div'); d2.innerHTML = prBenefitHtml();
    const t2 = d2.textContent.replace(/\s+/g, ' ').trim();
    /* AI 가 제대로 준 경우에는 그 띠가 없어야 한다 — 헛알람은 안 잡는 것보다 나쁘다 (8번) */
    PR.plan.reality = [{ headline: 'AI 가 쓴 것', story: '내용', cost: '3,200만원' }];
    const d3 = document.createElement('div'); d3.innerHTML = prRealityHtml();
    return { t, t2, quiet: !/앱이 채웠습니다/.test(d3.textContent) };
  }, SCAN);
  is(/앱이 채웠습니다/.test(B.t), '  <b>「AI 가 못 써서 앱이 채웠습니다」</b> 라고 적는다');
  is(/고객님의 숫자가 아닙니다/.test(B.t), '  <b>고객님 숫자가 아니라고</b> 못 박는다');
  is(/이 조각만 다시 만들기/.test(B.t), '  그 자리에서 <b>그 조각만 다시</b> 만들 수 있다');
  is(/앱이 채웠습니다/.test(B.t2), '  <b>준비하면</b> 칸에도 같은 띠가 붙는다');
  is(B.quiet, '  AI 가 제대로 쓴 경우에는 <b>아무 말도 안 붙인다</b> — 헛알람이 없다 (8번)');

  console.log('\n[3] 그 조각만 다시 만든다 — 여섯 개를 다 돌리지 않는다');
  const C = await page.evaluate(async () => {
    const calls = [];
    window.aiReady = function () { return true; };
    window.callAI = function (sys, user, tok) {
      calls.push({ tok: tok, sys: (sys && sys.text) || String(sys).slice(0, 400) });
      return Promise.resolve(JSON.stringify({
        reality: [{ headline: 'AI 가 새로 쓴 것', story: '내용', cost: '3,200만원' }]
      }));
    };
    PR._user = '[고객 정보] 홍길동'; PR.busy = false;
    PR.plan = PR.plan || {}; PR.plan.reality = prLocalReality();
    prRetryPart('real');
    await new Promise(r => setTimeout(r, 400));
    return {
      n: calls.length,
      head: (PR.plan.reality[0] || {}).headline,
      local: !!(PR.plan.reality[0] || {})._local
    };
  });
  is(C.n === 1, '  <b>한 번만</b> 부른다 — ' + C.n + '번 (전부 다시면 여섯 번이다)');
  is(/AI 가 새로 쓴 것/.test(C.head || ''), '  받은 것으로 <b>앱이 채운 것을 덮는다</b>');
  is(!C.local, '  덮은 뒤에는 <b>「앱이 채웠다」 표시가 걷힌다</b>');

  console.log('\n[4] 발표모드 — 뜨고 · 넘어가고 · ESC 로 닫힌다');
  const D = await page.evaluate(async (SCAN) => {
    PR.plan = prLocalFill({ title: '내 보험', slides: [{ kicker: '표지', title: 'x', lead: '', rows: [] }] }, SCAN, 'explain');
    PR.scan = SCAN; PR.age = 47; PRS.i = 0;
    prShowOpen();
    await new Promise(r => setTimeout(r, 200));
    const el = document.getElementById('prShow');
    const n = prShowList().length;
    /* <b>안 열렸으면 터지지 말고 안 열렸다고 답한다.</b> 점검이 터지면
       빨간불 대신 스택만 남아 무엇이 틀렸는지 알 수 없다 (8번). */
    const head = document.querySelector('#prShow .ps-t');
    if (!head) return { there: false, n, t1: '', t2: '', t3: '', dots: 0, zoomed: '', closed: false, bodyFree: false };
    const t1 = head.textContent.trim();
    prShowGo(1);
    const t2 = document.querySelector('#prShow .ps-t').textContent.trim();
    /* 첫 장에서 이전을 눌러도 뒤로 안 넘어간다 */
    prShowAt(0); prShowGo(-1);
    const t3 = document.querySelector('#prShow .ps-t').textContent.trim();
    const dots = document.querySelectorAll('#prShow .ps-dot span').length;
    const zoomed = (function () { prShowZoom(0.2); return document.querySelector('#prShow .ps-in').style.fontSize; })();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise(r => setTimeout(r, 100));
    return { there: !!el, n, t1, t2, t3, dots, zoomed, closed: !document.getElementById('prShow'),
             bodyFree: document.body.style.overflow !== 'hidden' };
  }, SCAN);
  is(D.there, '  발표모드가 <b>뜬다</b>');
  is(D.n >= 4, '  세울 장이 <b>' + D.n + '개</b> 있다');
  is(D.t1 !== D.t2, '  <b>다음</b>으로 넘어간다 — 「' + D.t1 + '」 → 「' + D.t2 + '」');
  is(D.t3 === D.t1, '  첫 장에서 <b>더 뒤로 안 간다</b>');
  is(D.dots === D.n, '  아래에 <b>장 표시</b>가 있다 — ' + D.dots + '개');
  is(/%$/.test(D.zoomed || ''), '  글자 크기를 <b>키울 수 있다</b> — ' + D.zoomed);
  is(D.closed, '  <b>ESC 로 닫힌다</b>');
  is(D.bodyFree, '  닫으면 뒤 화면 <b>스크롤이 돌아온다</b>');

  console.log('\n[5] 절대 안 잘린다 — 긴 글이 다 나오고 스크롤이 있다');
  const E = await page.evaluate(async (SCAN) => {
    /* 아주 긴 글을 한 장에 넣어 본다 */
    const LONG = '가나다라마바사아자차카타파하 '.repeat(400);
    PR.plan = prLocalFill({ title: '내 보험', slides: [{ kicker: '표지', title: 'x', lead: '', rows: [] }] }, SCAN, 'explain');
    PR.plan.reality = [{ headline: '아주 긴 이야기', story: LONG, cost: '확인 필요' }];
    PR.scan = SCAN; PR.age = 47; PRS.i = 0; PRS.zoom = 1;
    prShowOpen();
    await new Promise(r => setTimeout(r, 250));
    /* 「준비하지 않으면」 장으로 간다 */
    const L = prShowList(); let idx = 0;
    L.forEach((x, i) => { if (x.k === 'reality') idx = i; });
    prShowAt(idx);
    await new Promise(r => setTimeout(r, 250));
    const body = document.querySelector('#prShow .ps-body');
    const inn = document.querySelector('#prShow .ps-in');
    const cs = getComputedStyle(body);
    /* 글이 끝까지 살아 있는가 — 마지막 글자가 DOM 에 있는가 */
    const txt = inn.textContent;
    const tailKept = txt.indexOf('가나다라마바사아자차카타파하') >= 0 &&
                     txt.split('가나다라마바사아자차카타파하').length > 300;
    /* 어느 조상도 hidden 으로 잘라내지 않는가 */
    let node = inn, clipped = '';
    while (node && node !== document.body) {
      const o = getComputedStyle(node);
      if (o.overflowY === 'hidden' || o.overflow === 'hidden') clipped = node.className || node.id;
      node = node.parentElement;
    }
    const r = { scrollY: cs.overflowY, canScroll: body.scrollHeight > body.clientHeight + 20,
                tailKept, clipped, sh: body.scrollHeight, ch: body.clientHeight };
    /* 실제로 끝까지 내려가지는가 */
    body.scrollTop = body.scrollHeight;
    r.reachedEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 4;
    prShowClose();
    return r;
  }, SCAN);
  is(E.scrollY === 'auto' || E.scrollY === 'scroll',
     '  몸통이 <b>스스로 스크롤</b>한다 — overflow-y:' + E.scrollY + ' (hidden 이면 잘린다)');
  is(E.canScroll, '  긴 글이 <b>화면보다 길게</b> 서 있다 — ' + E.sh + 'px / ' + E.ch + 'px');
  is(E.tailKept, '  <b>글이 잘려 나가지 않았다</b> — 끝까지 DOM 에 있다');
  is(!E.clipped, '  잘라내는 조상이 <b>없다</b>' + (E.clipped ? ' ← ' + E.clipped : ''));
  is(E.reachedEnd, '  <b>끝까지 내려간다</b> — 마지막 줄까지 읽힌다');

  console.log('\n[6] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 고객 앞에서 빈 칸이 뜨거나 글이 잘립니다')
                  : '✓ 세 칸이 안 비고 · 앱이 채운 것은 밝히고 · 발표에서 안 잘립니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
