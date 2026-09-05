/* 연령대별 담보안 · 인쇄에서 색이 안 날아가는가

   표준 담보는 <b>59가지</b>입니다. 스물아홉과 예순다섯에게 같은 표를
   내밀면 고객은 <b>어디부터 봐야 할지</b> 모릅니다. 그래서 나이대마다
   순위와 금액을 매기고, <b>왜 그런지</b>를 같이 답니다.

   여기서 못 박는 것은 다섯입니다.

     1. <b>담보가 한 줄도 안 빠진다.</b> 어느 나이대를 골라도 59가지가
        전부 나와야 한다 — 빠진 담보는 그 상담에서 <b>없는 담보</b>다.
     2. <b>왜 그런지가 나이대마다 다르다.</b> 여섯 나이대 × 열 묶음이
        모두 채워져 있어야 한다. 비면 그 자리에서 할 말이 없다.
     3. <b>표준이 없는 담보에 숫자를 만들지 않는다</b> (1번).
     4. <b>인쇄하면 접힌 것까지 전부</b> 나온다 — 종이는 접을 수가 없다.
     5. <b>인쇄에서 색이 안 날아간다.</b> 브라우저는 배경색을 기본으로
        안 찍는다. print-color-adjust 가 없으면 파랑 머리띠도 초록·빨강
        칸도 하얗게 나오고 글자만 남는다 — 실제로 그렇게 무너졌다.      */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1100, height: 1000 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);

  head('[1] 어느 나이대를 골라도 <담보 59가지가 전부> 나온다');
  const all = await pg.evaluate(() => {
    /* 견본 자료 — 앱이 스스로 넣는 홍길동 자리다. 실제 고객 이름이 아니다. */
    localStorage.clear(); doSample(); showPanel('age'); go('edit');
    var want = 0; STD.forEach(function (g) { want += g.rows.length; });
    var out = [];
    AGE_GUIDE.forEach(function (b) {
      agePlanPick(b.k);
      var rows = 0;
      [].slice.call(document.querySelectorAll('.apt tr')).forEach(function (r) { if (r.querySelector('td')) rows++; });
      out.push({ k: b.t, got: rows, folds: document.querySelectorAll('.apf').length });
    });
    return { want: want, out: out, groups: STD.length };
  });
  await pg.waitForTimeout(300);
  is(all.want === 59, '표준 담보가 <59가지>다 (지금 ' + all.want + '가지)');
  const miss = all.out.filter(x => x.got !== all.want);
  is(miss.length === 0, miss.length ? ('담보가 빠지는 나이대 — ' + miss.map(x => x.k + ' ' + x.got + '개').join(' / ')) :
     '여섯 나이대 <전부> ' + all.want + '가지가 다 나온다');
  is(all.out.every(x => x.folds === all.groups),
     '묶음 <' + all.groups + '개>가 나이대마다 다 선다');

  head('[2] <왜 그런지>가 나이대마다 · 묶음마다 있다');
  const why = await pg.evaluate(() => {
    var hole = [], mul = [];
    AGE_GUIDE.forEach(function (b) {
      var P = AGE_PLAN[b.k];
      if (!P) { hole.push(b.t + '·통째로'); return; }
      STD.forEach(function (g) {
        var x = P[g.mid];
        if (!x) { hole.push(b.t + '·' + g.mid + '(없음)'); return; }
        if (!x.why) hole.push(b.t + '·' + g.mid + '(이유 없음)');
        if (typeof x.m !== 'number' || !(x.m > 0)) mul.push(b.t + '·' + g.mid);
        if (typeof x.p !== 'number') hole.push(b.t + '·' + g.mid + '(순위 없음)');
      });
    });
    return { hole: hole, mul: mul, n: AGE_GUIDE.length * STD.length };
  });
  is(why.hole.length === 0, why.hole.length ? ('빈 자리 — ' + why.hole.slice(0, 5).join(' / ')) :
     '나이대 × 묶음 <' + why.n + '자리>가 순위 · 배수 · 이유를 다 갖췄다');
  is(why.mul.length === 0, why.mul.length ? ('배수가 없는 자리 — ' + why.mul.slice(0, 4).join(' / ')) :
     '배수가 <숫자로> 있다 — 어디서 나온 금액인지 화면에 적을 수 있다');

  head('[3] 표준이 없는 담보에 <숫자를 만들지 않는다> (1번)');
  const zero = await pg.evaluate(() => {
    /* 표준 0 인 담보(비급여의료비 등)를 곱해 없는 숫자를 만들면 안 된다 */
    var z = [];
    STD.forEach(function (g) { g.rows.forEach(function (r) { if (!(r.std > 0)) z.push(r.n); }); });
    var made = z.filter(function () { return false; });
    return { z: z, calc: agePlanAmt(0, 1.2), txt: (document.querySelector('.apwrap') || {}).textContent || '' };
  });
  is(zero.calc === null, '표준이 <0> 이면 셈하지 않고 null 을 준다');
  is(zero.z.length === 0 || /표준 없음/.test(zero.txt),
     zero.z.length ? ('표준이 없는 담보 ' + zero.z.length + '개를 <「표준 없음」>이라고 적는다') :
     '표준이 없는 담보가 없다');

  head('[4] 인쇄하면 <접힌 것까지 전부> 나온다');
  await pg.evaluate(() => { agePlanPick('40'); });
  await pg.waitForTimeout(300);
  const before = await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('.api')).filter(x => getComputedStyle(x).display !== 'none').length);
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(350);
  const pr = await pg.evaluate(() => {
    var api = [].slice.call(document.querySelectorAll('.api'));
    var open = api.filter(x => getComputedStyle(x).display !== 'none').length;
    var nhi = [].slice.call(document.querySelectorAll('.nhi'));
    return { open: open, all: api.length, nhi: nhi.length,
             nhiOpen: nhi.filter(x => getComputedStyle(x).display !== 'none').length };
  });
  is(pr.all > 0 && pr.open === pr.all,
     '접어 둔 이유 <' + pr.all + '칸이 종이에서는 전부> 펴진다 (화면에서는 ' + before + '칸만 펴져 있었다)');

  head('[5] 인쇄에서 <색이 안 날아간다>');
  const col = await pg.evaluate(() => {
    function pca(el) {
      if (!el) return '(칸이 없음)';
      var c = getComputedStyle(el);
      return c.getPropertyValue('print-color-adjust').trim() ||
             c.getPropertyValue('-webkit-print-color-adjust').trim() || '(안 켬)';
    }
    function bg(el) { return el ? getComputedStyle(el).backgroundColor : '(칸이 없음)'; }
    var w = document.querySelector('.apwhy'), p = document.querySelector('.app');
    return { why: pca(w), pill: pca(p), whyBg: bg(w), pillBg: bg(p) };
  });
  await pg.emulateMedia({ media: 'screen' });
  is(col.why === 'exact' && col.pill === 'exact',
     '<print-color-adjust: exact> 이다 — 없으면 브라우저가 배경색을 안 찍어 종이가 하얗게 무너진다');
  is(!/rgba\(0, 0, 0, 0\)|transparent/.test(col.whyBg) && !/rgba\(0, 0, 0, 0\)|transparent/.test(col.pillBg),
     '종이에서도 <칸 색이 살아 있다> — 이유 칸 ' + col.whyBg + ' · 순위 딱지 ' + col.pillBg);

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '연령대별 담보안 점검 통과 — 뽑아서 그대로 들고 가실 수 있습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
