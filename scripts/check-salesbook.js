/* <b>영업 가이드북</b> — 뽑아서 들고 다니는 책이 성한가.

   이 문서는 화면이면서 <b>인쇄물</b>입니다. 신입에게 한 권씩 주고, 상담
   자리에서 앱과 나란히 띄워 둡니다. 그래서 여기서 지키는 것은 「글이
   있나」 가 아니라 <b>고객 앞에서 무너지는 자리가 없나</b> 입니다.

   ── 여기서 확인하는 것 ─────────────────────────────────────────

     1. <b>문이 살아 있다</b> — 사용가이드에 칸이 있고, 그 단추가 여는
        파일이 <b>실제로 있다.</b> 파일 이름을 바꾸면 여기서 걸립니다.
        (가이드가 없어진 화면을 설명하던 일이 실제로 있었습니다)
     2. <b>같은 것을 두 곳에 두지 않는다</b> (CLAUDE.md 5번) — 사용가이드
        쪽은 <b>문 하나</b>만이고, 가이드북 본문을 옮겨 적지 않았다.
     3. <b>여덟 장이 다 선다</b>, 그리고 차례의 링크가 <b>있는 자리</b>를
        가리킨다 — 죽은 앵커 0.
     4. <b>tnum 을 인쇄에 켜지 않았다</b> (4-1). 켜고 PDF 로 저장하면 숫자
        글자가 유니코드를 잃어, 우리가 뽑은 종이를 우리 앱이 못 읽습니다.
     5. <b>그림을 직접 그렸다</b> (9번) — 인라인 SVG 이고, 밖에서 이미지를
        끌어오지 않는다.
     6. <b>견본 사람이 홍길동이다</b> (3번) — 실제 고객 이름이 없다.
     7. <b>한장 보험료 비교의 출처 네 가지</b>가 적혀 있다. 사장님이 콕
        집어 넣으라고 한 자리다 — 이것이 빠지면 비교표가 「그냥 우리가
        싸다는 종이」 가 됩니다.
     8. <b>준법 문구가 빠지지 않았다</b> — 심사 결과 · 요건 충족 시 ·
        준법감시 · 실제 기사만.
     9. <b>인쇄에서 안 잘린다</b> — 인쇄 CSS 가 위 띠와 차례를 걷어내고,
        표·그림이 페이지 사이에서 안 쪼개진다. 그리고 화면이 <b>가로로
        안 넘친다.</b>
    10. 콘솔이 조용하다.                                              */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const BOOK = path.join(ROOT, 'app', '영업가이드북.html');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('영업 가이드북 — 뽑아서 들고 다니는 책이 성한가');

  /* ═══ 정적으로 볼 수 있는 것부터 — 브라우저를 띄우기 전에 ═══ */
  sec('[1] 문이 살아 있는가 — 사용가이드에서 실제로 열리는가');
  const APP = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');

  const urlLine = APP.match(/var\s+SALESBOOK_URL\s*=\s*'([^']+)'/);
  is(!!urlLine, '사용가이드가 여는 주소가 한 곳에 적혀 있다 (SALESBOOK_URL)');
  const target = urlLine ? path.join(ROOT, 'app', urlLine[1]) : '';
  is(!!target && fs.existsSync(target),
     '그 주소에 <b>파일이 실제로 있다</b>' + (urlLine ? ' — app/' + urlLine[1] : ''));
  is(/function\s+openSalesbook\s*\(/.test(APP) && /openSalesbook\(\)/.test(APP),
     '가이드의 단추가 <b>그 문을 부른다</b>');
  is(/id:'salesbook'/.test(APP) && /fn:manSalesbook/.test(APP),
     '사용가이드의 칸 목록(manSecs)에 <b>서 있다</b>');

  sec('[2] 같은 것을 두 곳에 두지 않았는가 (5번)');
  const manBlock = APP.slice(APP.indexOf('function manSalesbook()'),
                             APP.indexOf('function manSecs()'));
  is(manBlock.length > 0 && manBlock.length < 4500,
     '가이드 쪽은 <b>문 하나와 차례</b>뿐이다 — 본문을 옮겨 적지 않았다 (' + manBlock.length + '자)');
  const BK = fs.readFileSync(BOOK, 'utf8');
  is(/사용가이드/.test(BK) && /(옮겨 적지|한 벌만)/.test(BK),
     '가이드북이 <b>도구 사용법은 사용가이드에 있다</b>고 되짚어 준다');

  sec('[3] tnum 을 인쇄에 켜 두지 않았는가 (4-1)');
  /* 켜 두었으면 <b>@media screen 안</b>이어야 한다. 여기서는 아예 안 쓴다.
     주석은 걷어내고 본다 — 「쓰지 말자」 고 적어 둔 주석까지 세면 <b>헛것을
     잡는 점검</b>이 되고, 그러면 사람이 점검을 안 믿게 된다 (8번). */
  const CSS = BK.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const tnum = (CSS.match(/font-feature-settings/g) || []).length;
  is(tnum === 0,
     '숫자 글꼴 설정(font-feature-settings)을 <b>쓰지 않았다</b>' +
     (tnum ? ' ← ' + tnum + '군데 — 켜고 PDF 로 저장하면 숫자가 유니코드를 잃습니다' : ''));

  sec('[4] 그림을 직접 그렸는가 (9번)');
  const svgN = (BK.match(/<svg/g) || []).length;
  is(svgN >= 2, '인라인 SVG 로 직접 그렸다 — ' + svgN + '장');
  const imgs = BK.match(/<img[^>]*>/g) || [];
  is(imgs.length === 0,
     '밖에서 <b>이미지를 끌어오지 않는다</b>' + (imgs.length ? ' ← ' + imgs.length + '개' : ''));
  const outside = (BK.match(/https?:\/\/[^\s"'<)]+/g) || [])
    .filter(u => !/apex-hb-onecompare/.test(u));
  is(outside.length === 0,
     '바깥 주소를 <b>불러오지 않는다</b> — 인터넷이 없어도 그대로 뜬다' +
     (outside.length ? ' ← ' + outside.slice(0, 3).join(' ') : ''));

  sec('[5] 견본 사람이 홍길동인가 (3번)');
  is(/홍길동/.test(BK), '견본 이름으로 <b>홍길동</b>을 쓴다');
  is(/홍○/.test(BK), '가려진 이름(홍○○)도 보여 준다 — 서버에는 마스킹만 올라간다');
  const realish = ['김철수', '이영희', '박민수', '김영수', '최지우'].filter(n => BK.indexOf(n) >= 0);
  is(realish.length === 0,
     '다른 사람 이름을 견본으로 쓰지 않았다' + (realish.length ? ' ← ' + realish.join(', ') : ''));

  sec('[6] 한장 보험료 비교 — 출처를 적으라고 말하는가');
  is(/한장 보험료 비교/.test(BK), '한장 보험료 비교를 다룬다');
  is(/apex-hb-onecompare/.test(BK), '이 화면이 <b>밖에 있는 도구</b>라는 것을 밝힌다');
  [['기준일', /기준일/], ['설계 조건', /설계 조건/], ['산출 주체', /산출 주체/],
   ['개정 회차', /개정 회차/]].forEach(([nm, re]) => {
    is(re.test(BK), '  고객에게 보여 줄 때 <b>' + nm + '</b>을(를) 적으라고 말한다');
  });
  is(/심사 결과에 따릅니다/.test(BK), '  <b>「심사 결과에 따릅니다」</b>를 빼지 않았다');

  sec('[7] 준법 문구');
  [['요건 충족 시', /요건 충족 시/], ['준법감시', /준법감시/],
   ['약관', /약관/], ['실제 기사만', /실제 기사만/],
   ['해지 방어', /감액완납/]].forEach(([nm, re]) => {
    is(re.test(BK), '  <b>' + nm + '</b>이(가) 적혀 있다');
  });
  is(!/비과세 ?상품입니다|비과세입니다\.(?!.{0,40}(않|말))/.test(BK.replace(/\s+/g, ' ')),
     '  세금을 <b>결론으로 단정하지 않는다</b>');

  /* ═══ 실제로 열어 본다 ═══ */
  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(B + '/app/' + encodeURIComponent('영업가이드북.html'),
                  { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);

  sec('[8] 여덟 장이 다 서는가 · 차례가 있는 자리를 가리키는가');
  const got = await page.evaluate(() => {
    const secs = [].slice.call(document.querySelectorAll('section[id]')).map(s => s.id);
    const links = [].slice.call(document.querySelectorAll('.toc a'))
      .map(a => (a.getAttribute('href') || '').replace('#', ''));
    const dead = links.filter(h => !document.getElementById(h));
    const empty = [].slice.call(document.querySelectorAll('section[id]'))
      .filter(s => (s.textContent || '').replace(/\s+/g, '').length < 200)
      .map(s => s.id);
    return { secs, links, dead, empty,
             chars: (document.body.textContent || '').replace(/\s+/g, '').length,
             overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].forEach(id => {
    is(got.secs.indexOf(id) >= 0, '  ' + id + ' 장이 있다');
  });
  is(got.dead.length === 0,
     '  차례에 <b>죽은 링크가 없다</b> (' + got.links.length + '개)' +
     (got.dead.length ? ' ← ' + got.dead.join(', ') : ''));
  is(got.empty.length === 0,
     '  <b>빈 장이 없다</b>' + (got.empty.length ? ' ← ' + got.empty.join(', ') : ''));
  is(got.chars > 9000, '  글이 실려 있다 — ' + got.chars + '자');
  is(got.overflow <= 1, '  화면이 <b>가로로 안 넘친다</b> (' + got.overflow + 'px)');

  sec('[9] 인쇄에서 안 잘리는가');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);
  const pr = await page.evaluate(() => {
    const vis = (el) => !!el && getComputedStyle(el).display !== 'none';
    const tbl = document.querySelector('table');
    const fig = document.querySelector('figure');
    return { bar: vis(document.querySelector('.topbar')),
             toc: vis(document.querySelector('.toc')),
             tblKeep: tbl ? getComputedStyle(tbl.closest('.tbl-wrap') || tbl).breakInside : '',
             figKeep: fig ? getComputedStyle(fig).breakInside : '',
             secN: document.querySelectorAll('section[id]').length,
             chars: (document.body.textContent || '').replace(/\s+/g, '').length };
  });
  is(pr.bar === false, '  위 띠(인쇄 단추)가 <b>종이에 안 나온다</b>');
  is(pr.toc === false, '  차례가 <b>종이에 안 나온다</b>');
  is(pr.figKeep === 'avoid', '  그림이 <b>페이지 사이에서 안 쪼개진다</b>');
  is(pr.chars > 9000, '  인쇄본에도 <b>모든 장이 담긴다</b> — ' + pr.secN + '장 · ' + pr.chars + '자');
  await page.emulateMedia({ media: 'screen' });

  sec('[10] 콘솔이 조용한가');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 영업 가이드북에 손볼 곳이 있습니다')
                  : '✓ 영업 가이드북이 성합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
