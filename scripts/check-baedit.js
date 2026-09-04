/* 보장 전·후 <b>만들기</b> 화면이 눈에 들어오는가.

   계약 여섯 건을 넣으면 만들기 화면이 <b>아홉 화면</b>이 됐다. 그런데
   사장님이 여기서 제일 많이 하는 일은 <b>유지·배서·해지를 누르는 것</b>이다.
   그 셋을 누르려고 여섯 번을 내려야 했다. 그래서 계약을 한 줄로 접었다.

   접는 것은 <b>숨기는 것과 다르다.</b> 접힌 줄에도 담보 수와 돈이 적혀
   있고, 펴면 전부 그대로 있다. 여기서 못 박는 것은 이렇다.

     1. 계약은 접혀 있는 것이 기본. 한 줄에 상품명·회사·담보 수·돈 둘·
        유지/배서/해지가 다 선다.
     2. 펴면 폼·납입줄·담보판이 그대로 나오고, 다시 접힌다.
     3. 접힘·펼침은 <b>계약 id</b> 로 기억한다. 번호로 들면 위의 계약을
        지웠을 때 <b>엉뚱한 계약</b>이 펴진다.
     4. <b>접힌 줄에서도 유지·배서·해지가 눌린다.</b> 이게 안 되면 접은
        의미가 없다 — 누르려고 매번 펴야 한다.
     5. 접힌 줄의 돈과 펼친 줄의 돈이 <b>같은 값</b>이다. 세는 자리가
        둘이면 두 숫자가 갈라지고, 고객 앞에서 어느 쪽이 맞는지 모른다.
     6. <b>「외 N개」 · 「그 밖에 N건」 으로 담보를 숨기지 않는다.</b>
        열일곱 건 중 일곱만 보이면 나머지 열 건은 사장님에게 「없는 것」이
        되고, 고객 앞에서 「이게 다입니다」 라고 말하게 된다. 실제로 이
        화면에 세 군데 있었다 — 담보 요약 · 비는 자리 · 채우는 자리.
     7. 위 띠는 자주 쓰는 것만. 나머지는 「⋯ 더보기」 안에 있고,
        밖을 누르면 닫힌다.
     8. 새로 만든 계약은 <b>펴진 채로</b> 나온다 — 적으려고 누른 것이다.  */
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
const head = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);
  /* 견본 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); go('edit'); });
  await pg.waitForTimeout(500);

  const snap = () => pg.evaluate(() => ({
    h: document.body.scrollHeight,
    pols: [].slice.call(document.querySelectorAll('.pol')).map(function (p) {
      return {
        open: p.classList.contains('open'),
        nm: ((p.querySelector('.ph b') || {}).textContent || '').trim(),
        band: getComputedStyle(p).borderLeftColor,
        money: [].slice.call(p.querySelectorAll('.paym span')).map(function (s) { return s.textContent.replace(/\s+/g, ' ').trim(); }),
        forms: p.querySelectorAll('.f input').length,
        payl: p.querySelectorAll('.payl span').length,
        pad: p.querySelectorAll('.padshut, .pad').length,
        tg: p.querySelectorAll('.tg button').length
      };
    }),
    /* 화면 어디에도 「외 N개」 · 「그 밖에 N건」 이 없어야 한다 */
    cut: ((document.getElementById('app') || {}).textContent || '').match(/외\s*\d+\s*개|그\s*밖에\s*\d+\s*건/g) || [],
    gainN: document.querySelectorAll('.sum.gain .li').length,
    lossN: document.querySelectorAll('.sum.loss .li').length,
    side: getComputedStyle(document.querySelector('.side')).position
  }));

  head('[1] 계약은 접혀 있는 것이 기본 — 한 줄에 필요한 것이 다 선다');
  const A = await snap();
  is(A.pols.length >= 4, '견본을 넣으면 계약이 ' + A.pols.length + '건 선다');
  is(A.pols.every(p => !p.open), '여섯 건 모두 접혀 있다');
  is(A.pols.every(p => p.forms === 0 && p.pad === 0), '접힌 줄에는 입력칸·담보판이 안 그려진다 — 화면이 짧아진다');
  is(A.pols.every(p => p.nm.length > 0), '접혀 있어도 상품명이 다 보인다');

  head('[2] 접힌 줄의 돈은 <둘> · 펼친 줄과 같은 값');
  const two = A.pols.filter(p => p.money.length === 2).length;
  is(two === A.pols.length, '계약 ' + A.pols.length + '건 모두 돈이 <두 칸>이다 — 다섯을 늘어놓으면 어느 것이 중요한지 안 보인다');
  is(A.pols.every(p => /^월 /.test(p.money[0])), '첫 칸은 <월 보험료>다');
  is(A.pols.every(p => /앞으로|납입완료/.test(p.money[1])), '둘째 칸은 <앞으로 낼 돈>이다');

  head('[3] 펴면 그대로 나오고 · 다시 접힌다 · 값이 갈라지지 않는다');
  await pg.evaluate(() => { document.querySelectorAll('.pol .pcar')[1].click(); });
  await pg.waitForTimeout(300);
  const B = await snap();
  is(B.pols[1].open, '둘째 계약이 펴졌다');
  is(B.pols[1].forms >= 6, '펴니 입력칸이 ' + B.pols[1].forms + '개 나온다');
  is(B.pols[1].pad >= 1, '담보판도 그대로 나온다');
  is(B.pols.filter(p => p.open).length === 1, '누른 하나만 펴진다 — 나머지는 그대로 접혀 있다');
  /* 접힌 줄의 「월」 과 펼친 줄의 「월」 이 같은 값인가 */
  const mm = await pg.evaluate(() => {
    var p = document.querySelectorAll('.pol')[1];
    var mini = ((p.querySelector('.paym span') || {}).textContent || '').replace(/[^0-9]/g, '');
    var full = '';
    [].slice.call(p.querySelectorAll('.payl span')).forEach(function (s) {
      if (/^월 /.test(s.textContent) && !full) full = s.textContent.replace(/[^0-9]/g, '');
    });
    return { mini: mini, full: full };
  });
  is(mm.mini && mm.mini === mm.full, '접힌 줄과 펼친 줄이 <같은 월 보험료>를 말한다 (' + mm.mini + ' / ' + mm.full + ')');
  await pg.evaluate(() => { document.querySelectorAll('.pol .pcar')[1].click(); });
  await pg.waitForTimeout(250);
  is(!(await snap()).pols[1].open, '다시 누르면 접힌다');

  head('[4] 접힘·펼침은 <계약 id> 로 기억한다 — 위를 지워도 안 엉킨다');
  const keep = await pg.evaluate(() => {
    document.querySelectorAll('.pol .pcar')[2].click();          /* 셋째를 편다 */
    var openName = ((document.querySelectorAll('.pol')[2].querySelector('.ph b')) || {}).textContent.trim();
    window.confirm = function () { return true; };
    delPol('before', 0);                                          /* 첫째를 지운다 */
    return openName;
  });
  await pg.waitForTimeout(350);
  const C = await snap();
  const nowOpen = C.pols.filter(p => p.open).map(p => p.nm);
  is(nowOpen.length === 1 && nowOpen[0] === keep,
     '위 계약을 지워도 펴 둔 것은 그대로 「' + keep + '」 — 지금 ' + (nowOpen[0] || '(없음)'));
  await pg.evaluate(() => { localStorage.clear(); doSample(); go('edit'); });
  await pg.waitForTimeout(400);

  head('[5] 접힌 줄에서 유지·배서·해지가 눌린다 — 이게 안 되면 접은 뜻이 없다');
  const act = await pg.evaluate(() => {
    var before = S.before[0].act;
    var p = document.querySelectorAll('.pol')[0];
    var btn = [].slice.call(p.querySelectorAll('.tg button')).filter(function (b) { return b.textContent.indexOf('해지') >= 0; })[0];
    var folded = !p.classList.contains('open');
    if (btn) btn.click();
    return { folded: folded, before: before, after: S.before[0].act, had: !!btn };
  });
  await pg.waitForTimeout(300);
  is(act.folded && act.had, '접힌 줄에 유지·배서·해지 단추가 있다');
  is(act.before !== 'cancel' && act.after === 'cancel', '접힌 채로 눌러 「' + act.before + '」 → 「' + act.after + '」 로 바뀐다');
  const D = await snap();
  is(!D.pols[0].open, '눌러도 줄이 펴지지 않는다 — 자리가 안 튄다');

  head('[6] 왼쪽 색 띠가 유지·배서·해지마다 다르다 — 글자 없이 색으로 센다');
  const bands = await pg.evaluate(() => {
    S.before[0].act = 'keep'; S.before[1].act = 'endo'; S.before[2].act = 'cancel'; save(); render();
    return [].slice.call(document.querySelectorAll('.pol')).slice(0, 3)
      .map(function (p) { return getComputedStyle(p).borderLeftColor; });
  });
  await pg.waitForTimeout(200);
  is(new Set(bands).size === 3, '유지·배서·해지의 띠 색이 셋 다 다르다 — ' + bands.join(' / '));
  is(bands.every(b => b !== 'rgb(229, 232, 235)'), '셋 다 회색(기본)이 아니다');

  head('[7] 「외 N개」 · 「그 밖에 N건」 으로 담보를 숨기지 않는다');
  const E = await pg.evaluate(() => {
    /* 담보판을 펴서 요약 칩까지 다 그려 본다 */
    S.polOpen = {}; S.before.forEach(function (p) { S.polOpen[p.id] = true; });
    S.after.forEach(function (p) { S.polOpen[p.id] = true; });
    save(); render();
    var C = calc(), D = diff(C);
    return {
      cut: (document.getElementById('app').textContent || '').match(/외\s*\d+\s*개|그\s*밖에\s*\d+\s*건/g) || [],
      gainN: document.querySelectorAll('.sum.gain .li').length, gain: D.gain.length,
      lossN: document.querySelectorAll('.sum.loss .li').length, loss: D.loss.length,
      chips: document.querySelectorAll('.padsum span').length
    };
  });
  await pg.waitForTimeout(250);
  is(E.cut.length === 0, E.cut.length ? ('아직 자르는 자리가 있다 — ' + E.cut.join(' / ')) :
     '만들기 화면 어디에도 「외 N개」·「그 밖에 N건」 이 없다');
  is(E.gainN === E.gain, '채우는 자리 ' + E.gain + '건이 <전부> 서 있다 (' + E.gainN + '개)');
  is(E.lossN === E.loss, '비는 자리 ' + E.loss + '건이 <전부> 서 있다 (' + E.lossN + '개)');

  head('[8] 위 띠는 자주 쓰는 것만 · 나머지는 ⋯ 더보기 안에');
  const bar = await pg.evaluate(() => ({
    top: [].slice.call(document.querySelectorAll('.bar .sp > button')).filter(b => b.offsetParent !== null).length,
    more: document.querySelectorAll('#barMoreBox button').length,
    openBefore: document.getElementById('barMoreBox').classList.contains('on')
  }));
  is(bar.top <= 5, '위 띠에 늘 보이는 단추가 ' + bar.top + '개다 — 예전에는 열한 개였다');
  is(bar.more >= 5, '나머지 ' + bar.more + '개가 「⋯ 더보기」 안에 있다');
  is(!bar.openBefore, '처음에는 닫혀 있다');
  await pg.evaluate(() => barMore(true));
  await pg.waitForTimeout(200);
  is(await pg.evaluate(() => document.getElementById('barMoreBox').classList.contains('on')), '누르면 열린다');
  await pg.mouse.click(700, 600);
  await pg.waitForTimeout(250);
  is(!(await pg.evaluate(() => document.getElementById('barMoreBox').classList.contains('on'))),
     '밖을 누르면 닫힌다 — 열어 둔 채로 두면 아래가 가려진 줄 모른다');

  head('[9] 새로 만든 계약은 펴진 채로 나온다');
  const nw = await pg.evaluate(() => {
    var n0 = S.after.length;
    addPol('after');
    var pols = [].slice.call(document.querySelectorAll('.pol'));
    return { was: n0, now: S.after.length, lastOpen: pols[pols.length - 1].classList.contains('open') };
  });
  await pg.waitForTimeout(250);
  is(nw.now === nw.was + 1 && nw.lastOpen, '「+ 제안 더하기」 로 만든 계약은 <펴진 채로> 선다 — 적으려고 누른 것이다');

  head('[10] 화면이 실제로 짧아졌다 · 옆 칸은 붙박이다');
  await pg.evaluate(() => { localStorage.clear(); doSample(); go('edit'); });
  await pg.waitForTimeout(400);
  const F = await snap();
  is(F.h < 8000, '계약 6건 · 화면 높이 ' + F.h + 'px (' + (F.h / 900).toFixed(1) + '화면) — 예전 8,462px(9.4화면)보다 짧다');
  is(F.side === 'sticky', '옆 요약 칸은 <붙박이>라 내려도 따라온다');

  head('[11] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '만들기 화면 점검 통과 — 접어도 아무것도 안 숨습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
