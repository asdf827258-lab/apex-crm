/* 음성 비서 — 애매하면 세 갈래를 드리고 고르게 한다.

   88칸이 있는데 이름을 정확히 불러야만 열렸다. 「고객 뭐 있지」 처럼
   두루뭉술하게 말하면 아무거나 열리거나 AI 에게 넘어갔고, 사람에게는
   「그거 말고 저거」 라고 말할 자리가 없었다.

   여기서 확인한다.

     1. 두루뭉술한 말에 <b>가까운 화면 셋</b>을 내놓는가
     2. 「1번」·「첫번째」·이름 — 어떻게 말해도 알아듣는가
     3. 「없어」 라고 하면 AI 로 넘어가는가
     4. 상담 이야기(「고객이 비싸다고 하는데」)에는 메뉴가 안 튀어나오는가
     5. 귀로 못 고를 때 손으로 고를 단추가 나오는가                */
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
  /* 말하지도 읽지도 않게 막아 둔다 — 점검은 고르는 길만 본다 */
  await page.evaluate(() => {
    window.toast = function () {};
    window.vaSay = function (t, then) { if (then) then(); };
    window.go = function (t) { window.__went = t; };
    window.vaAI = function (t) { window.__ai = t; };
    OS.profile = { id: 'va', name: '점검', role: 'owner', plan: 'vip' };
  });

  const run = (t) => page.evaluate((t) => {
    window.__went = ''; window.__ai = '';
    VA.pick = null; VA.log = []; VA.hist = [];
    vaRun(t);
    return { pick: VA.pick ? VA.pick.list.map(x => x.title) : null,
             say: (VA.log.filter(x => x.w === 'bot').pop() || {}).t || '',
             went: window.__went, ai: window.__ai };
  }, t);
  const after = (t) => page.evaluate((t) => {
    window.__went = ''; window.__ai = '';
    vaRun(t);
    return { went: window.__went, ai: window.__ai,
             say: (VA.log.filter(x => x.w === 'bot').pop() || {}).t || '',
             pick: VA.pick ? VA.pick.list.map(x => x.title) : null };
  }, t);

  console.log('\n[1] 두루뭉술한 말에 가까운 화면 셋을 내놓는다');
  const a = await run('고객 뭐 있지');
  is(a.pick && a.pick.length >= 2, '  셋(또는 둘)을 골라 준다 — ' + (a.pick || []).join(' / '));
  is(/번호나 이름으로/.test(a.say), '  어떻게 고르는지 말해 준다');
  is(!a.went, '  마음대로 화면을 열지 않는다');

  console.log('\n[2] 번호로도 이름으로도 고른다');
  await run('고객 뭐 있지');
  const b1 = await after('1번');
  is(!!b1.went, '  「1번」 으로 연다 — ' + b1.went);
  await run('고객 뭐 있지');
  const b2 = await after('두번째');
  is(!!b2.went, '  「두번째」 로 연다 — ' + b2.went);
  const c = await run('고객 뭐 있지');
  const b3 = await page.evaluate((nm) => {
    window.__went = ''; vaRun(nm); return window.__went;
  }, (c.pick || [''])[2] || (c.pick || [''])[0]);
  is(!!b3, '  이름을 말해도 연다 — ' + b3);

  console.log('\n[3] 「없어」 라고 하면 AI 가 받는다');
  await run('고객 뭐 있지');
  const d = await after('없어');
  is(d.ai === '고객 뭐 있지', '  처음에 한 말 그대로 AI 에게 넘긴다');
  is(!d.pick, '  물음은 닫힌다');

  console.log('\n[4] 상담 이야기에는 메뉴가 안 튀어나온다');
  const e1 = await run('고객이 비싸다고 하는데 어떻게 하지');
  is(!e1.pick, '  「고객이 비싸다고 하는데」 — 메뉴를 내밀지 않는다');
  const e2 = await run('암 진단비가 왜 필요한지 설명해줘');
  is(!e2.pick, '  「암 진단비가 왜 필요한지」 — 메뉴를 내밀지 않는다');

  console.log('\n[5] 이름을 정확히 부르면 그냥 연다 — 셋을 거치지 않는다');
  const f = await run('고객 365 열어줘');
  is(!!f.went && !f.pick, '  바로 연다 — ' + f.went);

  console.log('\n[6] 손으로도 고를 수 있다');
  const g = await page.evaluate(() => {
    VA.pick = null; VA.log = [];
    vaRun('뭐 좀 보여줘');
    const h = vaPickHtml();
    return { n: (h.match(/va-po/g) || []).length, no: /셋 다 아닙니다/.test(h),
             list: VA.pick ? VA.pick.list.length : 0 };
  });
  is(g.list >= 2, '  실마리가 없어도 많이 쓰는 것으로 골라 준다 — ' + g.list + '개');
  is(g.n >= 3, '  단추로 그려진다');
  is(g.no, '  「셋 다 아닙니다」 길이 함께 있다');

  console.log('\n[7] 오래된 물음은 번호로 잘못 듣지 않는다');
  const h = await page.evaluate(() => {
    VA.pick = null; VA.log = [];
    vaRun('고객 뭐 있지');
    if (VA.pick) VA.pick.at = 1;          /* 아주 오래전에 물어본 것으로 만든다 */
    window.__went = ''; window.__ai = '';
    vaRun('1번');
    return { went: window.__went, ai: window.__ai };
  });
  is(!h.went, '  한참 지난 뒤의 「1번」 은 화면을 열지 않는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '음성 세 갈래 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '음성 세 갈래 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
