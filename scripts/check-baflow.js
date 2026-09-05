/* 혼자 보면서 <b>무슨 말을 할지</b> 잡을 수 있는가

   「무엇을 보여준다」까지만 적어 두면, 정작 고객 앞에서 <b>입이 안
   떨어집니다.</b> 그래서 단계마다 <b>실제로 뭐라고 말하는지</b>와
   <b>고객이 이렇게 나오면 이렇게 받는다</b>를 같이 적습니다.

   그리고 같은 진단서라도 <b>스물아홉과 예순다섯</b>은 급한 순서가
   다릅니다. 20대부터 70대까지 여섯 구간을 <b>한 벌</b>로 두고,
   진단서에는 <b>이 고객 나이의 한 구간만</b> 펴 놓습니다.

   여기서 못 박는 것은 넷입니다.

     1. <b>단계마다 대사가 있다.</b> 하나라도 비면 그 자리에서 막힌다.
     2. <b>나이대 여섯 구간이 다 채워져 있다</b> (20대~70대). 칸이 빈
        구간이 있으면 그 나이 고객 앞에서 할 말이 없다.
     3. <b>나이를 안 적었으면 이 칸을 안 세운다.</b> 아무 나이대나 골라
        보여 주면 그것이 이 고객 기준인 줄 안다 (1번).
     4. <b>표는 한 벌이다</b> — 두 벌이 되면 한쪽만 고쳐진다 (5번).      */
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

  head('[1] 흐름 — 단계마다 <실제로 뭐라고 말하는지>가 있다');
  const flow = await pg.evaluate(() => {
    /* 견본 자료 — 앱이 스스로 넣는 홍길동 자리다. 실제 고객 이름이 아니다. */
    localStorage.clear(); doSample(); showPanel('brain'); go('edit');
    var f = flowCalc(), rows = [];
    f.steps.forEach(function (st) { st.rows.forEach(function (r) { rows.push(r); }); });
    return { n: rows.length,
             noSay: rows.filter(function (r) { return !r.say; }).map(function (r) { return r.t; }),
             noIf: rows.filter(function (r) { return !r.if1 || !r.if2; }).map(function (r) { return r.t; }),
             sayN: document.querySelectorAll('.fwsay').length,
             ifN: document.querySelectorAll('.fwif').length };
  });
  await pg.waitForTimeout(300);
  is(flow.n > 0 && flow.noSay.length === 0,
     flow.noSay.length ? ('대사가 없는 단계 — ' + flow.noSay.join(' / ')) :
     '단계 ' + flow.n + '개 <전부> 그대로 읽을 대사가 있다');
  is(flow.noIf.length === 0,
     flow.noIf.length ? ('되받는 말이 없는 단계 — ' + flow.noIf.join(' / ')) :
     '단계마다 <「이렇게 나오면 이렇게 받는다」>가 있다 — 막히는 자리가 진짜 자리다');
  is(flow.sayN === flow.n && flow.ifN === flow.n,
     '적어 둔 것이 <화면에도 그대로> 선다 (대사 ' + flow.sayN + ' · 되받는 말 ' + flow.ifN + ' / 단계 ' + flow.n + ')');

  head('[2] 나이대 — <20대부터 70대까지> 여섯 구간이 다 채워져 있다');
  const age = await pg.evaluate(() => {
    var need = ['one', 'first', 'later', 'amt', 'term', 'prem', 'miss', 'ask', 'push', 'talk'];
    var hole = [];
    AGE_GUIDE.forEach(function (g) {
      need.forEach(function (k) {
        var v = g[k];
        var empty = (v === undefined || v === null || v === '' ||
                     (Object.prototype.toString.call(v) === '[object Array]' && !v.length));
        if (empty) hole.push(g.t + '·' + k);
      });
    });
    /* 나이 구간에 <b>틈</b>이 있으면 그 나이 고객은 아무 데도 안 걸린다 */
    var gap = [], a;
    for (a = 20; a <= 79; a++) {
      var hit = AGE_GUIDE.filter(function (g) { return a >= g.range[0] && a <= g.range[1]; });
      if (hit.length !== 1) gap.push(a + '세(' + hit.length + '곳)');
    }
    return { n: AGE_GUIDE.length, names: AGE_GUIDE.map(function (g) { return g.t; }), hole: hole, gap: gap };
  });
  is(age.n === 6, '구간이 <여섯>이다 — ' + age.names.join(' · '));
  is(age.hole.length === 0,
     age.hole.length ? ('빈 칸이 있는 구간 — ' + age.hole.slice(0, 6).join(' / ')) :
     '구간마다 <열 칸이 다> 채워져 있다 (먼저 · 나중 · 금액 · 납입 · 보험료 · 놓치는 것 · 물어볼 것 · 말할 것 · 한 줄)');
  is(age.gap.length === 0,
     age.gap.length ? ('나이가 <어디에도 안 걸리거나 두 곳에> 걸린다 — ' + age.gap.slice(0, 5).join(' ')) :
     '20세부터 79세까지 <어느 나이든 꼭 한 구간>에 걸린다');

  head('[3] 진단서에 <이 고객 나이의 한 구간>이 선다');
  const fit = await pg.evaluate(() => {
    localStorage.clear(); doSample(); showPanel('fit'); S.fitTab = 'plan'; go('edit');
    var f = document.querySelector('.fitsec[data-k=plan] .fage');
    return { has: !!f, txt: f ? (f.textContent || '').replace(/\s+/g, ' ') : '', age: S.who.age };
  });
  await pg.waitForTimeout(300);
  is(fit.has, '「준비 순서」 칸에 <나이대 가이드>가 선다');
  is(fit.txt.indexOf(String(fit.age) + '세') >= 0,
     '<이 고객 나이>가 그대로 적힌다 (' + fit.age + '세)');
  is(/이렇게 물어보십시오/.test(fit.txt) && /이렇게 말씀하십시오/.test(fit.txt),
     '<물어볼 말>과 <할 말>이 같이 선다 — 혼자 보면서 공부하는 자리다');
  is(/자주 놓치는 것/.test(fit.txt),
     '<이 나이대가 자주 놓치는 것>도 같이 적는다 — 좋은 쪽만 적지 않는다');

  head('[4] 나이를 안 적었으면 <안 세운다> (1번)');
  const none = await pg.evaluate(() => {
    S.who.age = ''; save(); go('edit');
    var f = document.querySelector('.fitsec[data-k=plan] .fage');
    var sec = document.querySelector('.fitsec[data-k=plan]');
    return { has: !!f, txt: sec ? (sec.textContent || '').replace(/\s+/g, ' ') : '' };
  });
  await pg.waitForTimeout(300);
  is(!none.has,
     '나이가 없으면 <아무 나이대도 안 세운다> — 골라 보여 주면 그것이 이 고객 기준인 줄 안다');
  is(/나이/.test(none.txt) && /적어 주시면/.test(none.txt),
     '<무엇을 적으면 나오는지>를 그 자리에 적는다');

  head('[5] 표는 <한 벌>이다 (5번)');
  const ba = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  is((ba.match(/var\s+AGE_GUIDE\s*=/g) || []).length === 1,
     '<AGE_GUIDE 가 한 곳>에만 있다 — 두 벌이면 한쪽만 고쳐진다');
  is((ba.match(/function\s+ageBand\s*\(/g) || []).length === 1,
     '<「이 고객이 어느 구간인가」>를 아는 자리도 한 곳이다');

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '상담 흐름 · 나이대 가이드 점검 통과 — 혼자 보고 무슨 말을 할지 잡을 수 있습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
