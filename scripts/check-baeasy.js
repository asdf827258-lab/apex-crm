/* ✍️ 보장 전·후 만들기 — 적는 것이 쉬워졌나 (판 X366)

   사장님 말씀 2026-11-06 「만들기나 입력하는 부분들 조금 더 쉽게 작성할 수 있도록 만들수 있어?」.

     1. 💰 금액을 말하듯 — 보험료 칸에 「450만」 「5만2천」 「1억2천만」, 담보 칸에 「3천」 「1억」 「3만원」 「5,000」.
        담는 단위는 그대로(보험료 = 원으로 적고 만원으로 담음 · 담보 = 만원). 「5,000」 이 5 가 되던 천 배 사고도 막는다.
     2. ✍️ 한 번에 적기 — 「암진단 3천, 뇌혈관 1000, 입원일당 3만」 한 줄을 칸으로 나눠 <b>먼저 보여 주고</b>,
        「칸에 넣기」 를 눌러야 들어간다. 못 알아본 줄은 칸을 고르게 하고, 같은 칸이 두 번이면 큰 금액 하나만.
        보험료 · 납입 · 만기 · 회사가 섞여 있으면 <b>빈 계약 칸만</b> 채운다.
     3. 「+ 손으로 적기 / + 제안 더하기」 를 누르면 담보판까지 펴고 그 칸에 커서가 간다.
     4. ⑤ 표준 담보표 — 빈 담보는 접어 두고 「빈 담보 N개도 보기」 로 편다. 화면이 확 짧아진다.   */
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
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  /* ★ 바깥은 끊습니다(check-netblock) */
  await pg.route('**://**', r => (r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort()));
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);

  head('[1] 금액을 말하듯 적어도 읽나');
  const W = await pg.evaluate(() => ({
    won: ['450만', '5만2천', '1억2천만', '1억 2천만원', '52,300', '4500000', '천만', 'abc'].map(v => [v, manOfWon(v), wonEcho(v)]),
    cov: ['3천', '1천5백', '1억', '3천만', '3만원', '30,000원', '5,000', '2000', '0.5', '', '모름'].map(v => [v, covIn(v)])
  }));
  const wm = Object.fromEntries(W.won.map(x => [x[0], x[1]])), we = Object.fromEntries(W.won.map(x => [x[0], x[2]]));
  is(wm['450만'] === '450' && we['450만'] === '= 450만원', '보험료 「450만」 → 만원 450 · 되읽기 「' + we['450만'] + '」');
  is(wm['5만2천'] === '5.2' && we['5만2천'] === '= 5만 2,000원', '「5만2천」 → 5.2 만원 · 「' + we['5만2천'] + '」');
  is(wm['1억2천만'] === '12000' && wm['1억 2천만원'] === '12000', '「1억2천만」 · 「1억 2천만원」 → 12000 만원');
  is(wm['52,300'] === '5.23' && wm['4500000'] === '450', '맨 숫자는 전처럼 원 — 「52,300」 → 5.23 · 「4500000」 → 450');
  is(wm['천만'] === '1000', '「천만」 → 1000 만원');
  is(wm['abc'] === '' && we['abc'] === '', '못 읽는 글은 지어내지 않고 비운다');
  const cm = Object.fromEntries(W.cov);
  is(cm['3천'] === '3000' && cm['1천5백'] === '1500', '담보 「3천」 = 3천만원(3000) · 「1천5백」 = 1500');
  is(cm['1억'] === '10000' && cm['3천만'] === '3000', '「1억」 → 10000 · 「3천만」 → 3000');
  is(cm['3만원'] === '3' && cm['30,000원'] === '3', '「원」 을 붙이면 원으로 — 「3만원」 · 「30,000원」 → 3 (일당)');
  is(cm['5,000'] === '5000', '「5,000」 → 5000 (전에는 쉼표에서 끊겨 5 — 천 배)');
  is(cm['2000'] === '2000' && cm['0.5'] === '0.5' && cm[''] === '' && cm['모름'] === '모름', '맨 숫자는 그대로 만원 · 빈칸은 빈칸 · 못 읽으면 친 그대로');

  head('[2] 담보 칸 · ⑤ 표 칸 · 제안서 칸이 같은 읽기를 쓰나');
  const C = await pg.evaluate(() => {
    localStorage.clear(); doSample(); go('edit');
    setCov('after', 0, 'cov', 'cancer', '3천');
    var a = S.after[0].cov.cancer;
    setCov('after', 0, 'cov', 'inpD', '3만원');
    var b = S.after[0].cov.inpD;
    setMan('a', 'deathA', '1억');
    var m = S.man.a.deathA;
    window.__PP = { P: { rows: [{ v: null }], other: [], ext: [] } }; ppAmt('rows', 0, '1,500'); var pv = __PP.P.rows[0].v; window.__PP = null;
    return { a: a, b: b, m: m, pv: pv };
  });
  is(C.a === '3000', '담보판 「3천」 → 3000 만원으로 담김');
  is(C.b === '3', '담보판 일당 「3만원」 → 3');
  is(C.m === '10000', '⑤ 표준 담보표 「1억」 → 10000');
  is(C.pv === 1500, '제안서 미리보기 금액 「1,500」 → 1500 (전에는 1)');

  head('[3] ✍️ 한 번에 적기 — 칸을 먼저 보여 주고, 눌러야 넣나');
  const Q = await pg.evaluate(() => {
    var r = qkParse('암진단 3천, 뇌혈관 1000\n급성심근경색 1천만원; 입원일당 30000\n질병수술비 50, 수술비 30\n아무말대잔치 500\n월 보험료 5만2천원\n삼성화재 20년납 100세만기\n유사암 치료비 300');
    return r.items.map(x => [x.name, x.k, x.v, !!x.dup, x.d]).concat([['META', JSON.stringify(r.meta)]]);
  });
  const qm = {}; Q.forEach(x => qm[x[0]] = x);
  is(qm['암진단'] && qm['암진단'][1] === 'cancer' && qm['암진단'][2] === 3000, '「암진단 3천」 → 일반암 3000');
  is(qm['뇌혈관'] && qm['뇌혈관'][1] === 'brain' && qm['뇌혈관'][2] === 1000, '「뇌혈관 1000」 → 뇌혈관질환 진단 1000');
  is(qm['급성심근경색'] && qm['급성심근경색'][1] === 'mi' && qm['급성심근경색'][2] === 1000, '「급성심근경색 1천만원」 → 1000 (쌍반점으로도 나눔)');
  is(qm['입원일당'] && qm['입원일당'][1] === 'inpD' && qm['입원일당'][2] === 3, '「입원일당 30000」 → 원으로 친 것을 알아보고 3만원/일');
  is(qm['질병수술비'] && qm['질병수술비'][1] === 'surg' && !qm['질병수술비'][3] && qm['수술비'][3], '같은 칸(질병 수술비)이 두 번이면 큰 금액만 — 작은 줄은 「같은 칸」 표시');
  is(qm['아무말대잔치'] && qm['아무말대잔치'][1] === '', '못 알아본 줄은 칸을 비워 두고 고르게 한다 (지어내지 않음)');
  is(qm['유사암 치료비'] && qm['유사암 치료비'][1] === '' && !!qm['유사암 치료비'][4], '표준표에 칸이 없는 사전 담보(유사암 치료비)는 참고 담보로');
  const meta = JSON.parse(qm['META'][1]);
  is(meta.prem === '5.2' && meta.co === '삼성화재' && meta.years === '20' && meta.term === '100세만기', '보험료 · 회사 · 납입 · 만기 줄은 계약 칸으로 — ' + qm['META'][1]);
  is(!qm['월 보험료 5만2천원'] && !qm['삼성화재'], '보험료 · 회사 줄을 담보로 잘못 세지 않는다');

  head('[4] 「+ 제안 더하기」 → 담보판이 펴지고 커서가 「한 번에 적기」 에');
  const U = await pg.evaluate(async () => {
    localStorage.clear(); doSample(); go('edit');
    var n0 = S.after.length; addPol('after'); await new Promise(r => setTimeout(r, 120));
    var i = S.after.length - 1, key = 'after' + i, ta = document.getElementById('qk_' + key);
    var focus = document.activeElement === ta;
    ta.value = '암진단 3천, 뇌혈관 1000, 아무말 500, 월 보험료 4만원, 20년납';
    ta.dispatchEvent(new Event('input'));
    var box = document.getElementById('qkv_' + key), rows = box.querySelectorAll('.qkr').length, sel = box.querySelectorAll('.qkr.no select').length;
    var before = JSON.stringify(S.after[i].cov);
    /* 못 알아본 줄에 칸을 골라 준다 */
    var no = [].slice.call(box.querySelectorAll('.qkr')).findIndex(function (r) { return r.classList.contains('no'); });
    qkKey('after', i, 'cov', no, 'stroke');
    box.querySelector('.qka .btn').click();
    var p = S.after[i];
    return { n0: n0, n1: S.after.length, ta: !!ta, focus: focus, rows: rows, sel: sel, before: before, cov: p.cov, prem: p.premMan, years: p.years,
      chip: (document.querySelectorAll('.pol')[S.before.length + i].querySelector('.padsum') || document.body).textContent };
  });
  is(U.n1 === U.n0 + 1 && U.ta, '새 제안 칸이 서고 「한 번에 적기」 칸이 바로 보인다');
  is(U.focus, '커서가 「한 번에 적기」 칸에 가 있다 — 누르자마자 칠 수 있다');
  is(U.rows === 3 && U.sel === 1, '미리보기 — 담보 3줄, 그중 못 알아본 1줄은 칸 고르기');
  is(U.before === '{}', '미리보기만으로는 안 들어간다 (눌러야 넣음)');
  is(U.cov.cancer === '3000' && U.cov.brain === '1000' && U.cov.stroke === '500', '「칸에 넣기」 → 일반암 3000 · 뇌혈관 1000 · 고른 칸(뇌졸중) 500');
  is(U.prem === '4' && U.years === '20', '빈 계약 칸에 월 보험료 4만원 · 20년납');
  const kept = await pg.evaluate(() => {
    var i = 0; S.after[i].premMan = '7'; render();
    var key = 'after' + i; S.polOpen[S.after[i].id] = true; S.padOpen[key] = true; render();
    var ta = document.getElementById('qk_' + key); ta.value = '월 보험료 9만원, 일반암 5000'; ta.dispatchEvent(new Event('input'));
    qkGo('after', i, 'cov'); return { prem: S.after[i].premMan, can: S.after[i].cov.cancer };
  });
  is(kept.prem === '7' && kept.can === '5000', '이미 적힌 보험료(7만원)는 안 덮는다 · 담보는 친 대로 바뀐다');

  head('[4-2] 참고 담보 금액이 제 단위로 적히나 (판 X357 에서 1만 배로 적히던 것)');
  const X = await pg.evaluate(() => {
    localStorage.clear(); doSample(); go('edit');
    var i = 0; S.polOpen[S.after[i].id] = true; S.padOpen['after' + i] = true; render();
    var ta = document.getElementById('qk_after' + i); ta.value = '유사암 치료비 300'; ta.dispatchEvent(new Event('input'));
    qkGo('after', i, 'cov');
    var chip = document.querySelector('.pext em').textContent;
    go('show'); var rep = (typeof frHtml === 'function') ? frHtml() : '';
    var m = rep.match(/유사암 치료비[^<]*<b>([^<]*)<\/b>/);
    return { ext: S.after[i].ext.map(e => e.n + '=' + e.v).join(','), chip: chip, rep: m ? m[1] : '(없음)' };
  });
  is(/유사암 치료비=300/.test(X.ext), '「유사암 치료비 300」 → 참고 담보 300 만원으로 담김 — ' + X.ext);
  is(/300만원/.test(X.chip) && !/억/.test(X.chip), '계약 아래 칩이 「300만원」 — ' + X.chip.trim());
  is(/300만원/.test(X.rep), '최종 보고서 계약 칩도 「300만원」 — ' + X.rep);

  head('[5] ⑤ 표준 담보표 — 빈 담보는 접혀 있나');
  const T = await pg.evaluate(() => {
    localStorage.clear(); doSample(); go('edit');
    var box = document.getElementById('stBox');
    var rows = box.querySelectorAll('table tr').length, more = box.querySelectorAll('tr.stmore').length, h = document.body.scrollHeight;
    var all = 0; STD.forEach(function (g) { all += g.rows.length; });
    var g0 = STD[0].mid; stEmp(g0);
    var rows2 = document.getElementById('stBox').querySelectorAll('table tr').length;
    var txt = document.getElementById('stBox').querySelector('tr.stmore button').textContent;
    stEmp(g0);
    return { rows: rows, more: more, h: h, all: all, rows2: rows2, txt: txt };
  });
  is(T.rows < T.all, '처음에는 적힌 담보만 — 표 줄 ' + T.rows + '줄 (담보 ' + T.all + '가지 전부가 아님)');
  is(T.more >= 5, '묶음마다 「빈 담보 N개도 보기」 단추 ' + T.more + '개');
  is(T.rows2 > T.rows && /빈 담보 접기/.test(T.txt), '누르면 그 묶음만 다 펴고 「빈 담보 접기」 로 바뀐다');
  is(T.h < 9000, '견본(계약 6건) 만들기 화면 높이 ' + T.h + 'px — 9,000px 안 (전에는 10,600px 남짓)');

  head('[6] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 적는 것이 쉬워졌습니다 — 금액 줄임말 · 한 번에 적기 · 빈 담보 접기');
  process.exit(bad ? 1 : 0);
})();
