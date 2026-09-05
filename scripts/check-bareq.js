/* 가입설계 요청서 — 발표에서 <b>청약까지</b> 손으로 옮겨 적지 않게.

   발표가 끝나면 사장님은 화면에서 정한 것을 <b>손으로 다시 옮겨</b>
   적어야 했다. 옮겨 적는 자리마다 틀릴 자리가 생긴다 — 담보 하나를
   빠뜨리거나, 금액을 한 칸 밀려 적는다. 그래서 화면에 있는 것을
   <b>그대로</b> 한 장으로 뽑는다. 여기서 못 박는 것은 다섯 가지다.

     1. <b>담보가 한 줄도 안 빠진다.</b> 새 설계에 적은 담보 수와 종이의
        줄 수가 같아야 한다. 하나라도 빠지면 그 담보는 <b>청약에서
        사라진다</b> — 고객은 넣은 줄 알고, 사고 때 없다.
     2. <b>금액이 화면과 같다.</b> 옮겨 적다 한 칸 밀리는 것을 막으려고
        만든 종이인데 종이가 다른 값을 적으면 뜻이 없다.
     3. <b>빈칸을 빈칸이라고 말한다.</b> 보험사·상품명·보험료·납입기간이
        안 적힌 채로 청약이 넘어가면 그게 사고다. 맨 위에 적는다.
     4. <b>해지 앞에 경고를 세운다.</b> 새 계약이 승낙되기 전에 해지하면
        그 사이 사고는 어느 쪽에서도 안 나온다. 되돌릴 수 없는 일이다.
     5. <b>이 종이는 청약서가 아니다.</b> 그렇게 적혀 있어야 하고,
        「심사 결과에 따릅니다」와 고지의무를 빼지 않는다 (2번).

   그리고 <b>아무것도 없으면 빈 종이를 안 만든다</b> — 지어내지 않는다 (1번). */
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

  head('[1] 요청서가 실제로 열린다');
  const open = await pg.evaluate(() => {
    /* 견본 자료 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
    localStorage.clear(); S = blank(); save(); doSample();
    go('req');
    return { has: !!document.querySelector('.rq'),
             tab: document.getElementById('tabReq') ? document.getElementById('tabReq').className : '',
             mode: S.mode };
  });
  await pg.waitForTimeout(250);
  is(open.has, '「📋 가입설계 요청서」 탭을 누르면 종이가 선다');
  is(open.tab.indexOf('on') >= 0, '그 탭이 <켜진 것으로> 보인다 — 지금 어디인지 알 수 있다');

  head('[2] 담보가 한 줄도 안 빠진다 · 금액이 화면과 같다');
  const rows = await pg.evaluate(() => {
    /* 앱이 들고 있는 담보 수를 <b>직접 세어</b> 종이와 견준다 */
    function count(pol, which) {
      var cov = (which === 'cov2') ? (pol.cov2 || {}) : (pol.cov || {}), n = 0;
      STD.forEach(function (g) { g.rows.forEach(function (r) {
        if (num(cov[r.k]) !== null && num(cov[r.k]) !== undefined) n++; }); });
      return n;
    }
    var want = 0;
    S.after.forEach(function (p) { want += count(p, 'cov'); });
    S.before.forEach(function (p) { if ((p.act || 'keep') === 'endo') want += count(p, 'cov2'); });
    /* 종이의 담보 줄 — 표마다 머리줄이 하나씩 있으니 뺀다 */
    var tb = [].slice.call(document.querySelectorAll('.rq table.rqc'));
    var got = 0; tb.forEach(function (t) { got += t.querySelectorAll('tr').length - 1; });
    /* 한 담보를 골라 <b>화면의 값</b>과 종이의 값을 맞대어 본다 */
    var p0 = S.after[0], k0 = null, i, j;
    for (i = 0; i < STD.length && !k0; i++) for (j = 0; j < STD[i].rows.length; j++) {
      var k = STD[i].rows[j].k;
      if (p0 && num((p0.cov || {})[k]) !== null && num((p0.cov || {})[k]) !== undefined) { k0 = STD[i].rows[j]; break; }
    }
    var wantTxt = k0 ? amt(k0.k, num(p0.cov[k0.k])) : '';
    var paper = (document.querySelector('.rq') || {}).textContent || '';
    return { want: want, got: got, tb: tb.length, k: k0 ? k0.n : '', wantTxt: wantTxt,
             sameAmt: !!(k0 && paper.indexOf(wantTxt) >= 0),
             news: document.querySelectorAll('.rqs')[0] ? document.querySelectorAll('.rqs')[0].querySelectorAll('.rqp').length : 0,
             wantNews: S.after.length };
  });
  is(rows.got === rows.want && rows.want > 0,
     '담보 ' + rows.want + '줄이 <한 줄도 안 빠지고> 종이에 있다 (지금 ' + rows.got + '줄 · 표 ' + rows.tb + '개)');
  is(rows.news === rows.wantNews && rows.wantNews > 0,
     '새로 넣을 설계 ' + rows.wantNews + '건이 <각각 제 칸>으로 선다 (지금 ' + rows.news + '건)');
  is(rows.sameAmt,
     '금액이 <화면과 같다> — 「' + rows.k + ' ' + rows.wantTxt + '」이 종이에 그대로 있다');

  head('[3] 빈칸을 <빈칸이라고> 말한다');
  const miss = await pg.evaluate(() => {
    localStorage.clear(); S = blank(); save(); doSample();
    S.who.name = '';                        /* 이름을 지운다 */
    if (S.after[0]) { S.after[0].co = ''; S.after[0].years = ''; }
    save(); go('req');
    /* <b>맨 위</b>에 적혀야 한다 — 첫 알림 칸을 그대로 본다.
       「비어 있다」는 글자를 찾아 다니면 종이 아무 데나 있어도 통과한다. */
    var w = document.querySelector('.rq .note');
    return { txt: w ? (w.textContent || '').replace(/\s+/g, ' ') : '' };
  });
  await pg.waitForTimeout(200);
  is(/비어 있습니다/.test(miss.txt) && /보험사/.test(miss.txt) && /납입기간/.test(miss.txt),
     '무엇이 비었는지 <이름을 대어> 맨 위에 적는다 — 「' + miss.txt.slice(0, 62) + '…」');
  is(/만들기/.test(miss.txt),
     '<어디서 채우면 되는지>까지 적는다 — 「만들기 화면에서 채우시면」');

  head('[4] 해지 앞에 <되돌릴 수 없다>는 경고를 세운다');
  const kill = await pg.evaluate(() => {
    localStorage.clear(); S = blank(); save(); doSample();
    S.before[0].act = 'cancel'; save(); go('req');
    var t = (document.querySelector('.rq') || {}).textContent || '';
    return { txt: t.replace(/\s+/g, ' '), has: /해지/.test(t) };
  });
  await pg.waitForTimeout(200);
  is(/승낙된 뒤에/.test(kill.txt),
     '<새 계약이 승낙된 뒤에 해지>하라고 적는다 — 먼저 해지하면 그 사이 사고가 빈다');
  is(/어느 쪽에서도 안 나옵니다/.test(kill.txt),
     '먼저 해지하면 <어느 쪽에서도 안 나온다>고 그대로 적는다');
  is(/돌아오지 않고/.test(kill.txt) && /그때 나이/.test(kill.txt),
     '이미 낸 돈은 <안 돌아오고>, 다시 가입하면 <그때 나이·건강>으로 심사받는다고 적는다');

  head('[5] 이 종이는 <청약서가 아니다>');
  const say = await pg.evaluate(() => {
    localStorage.clear(); S = blank(); save(); doSample(); go('req');
    return ((document.querySelector('.rq') || {}).textContent || '').replace(/\s+/g, ' ');
  });
  await pg.waitForTimeout(200);
  is(/청약서가 아닙니다/.test(say), '<「청약서가 아닙니다」>라고 첫 줄에 적는다');
  is(/심사 결과에 따릅니다/.test(say), '<「심사 결과에 따릅니다」>를 빼지 않는다 (2번)');
  is(/고지의무/.test(say), '<고지의무>를 청약 단계에서 알려야 한다고 적는다');
  is(/원수사/.test(say) && /비교설명확인서/.test(say),
     '청약·상품설명서 교부·비교설명확인서는 <원수사(GA) 시스템>에서 한다고 적는다');

  head('[6] 아무것도 없으면 <빈 종이를 안 만든다>');
  const empty = await pg.evaluate(() => {
    localStorage.clear(); S = blank(); save(); go('req');
    var t = (document.querySelector('.rq') || {}).textContent || '';
    return { txt: t.replace(/\s+/g, ' '), pans: document.querySelectorAll('.rq .rqp').length };
  });
  await pg.waitForTimeout(200);
  is(empty.pans === 0, '정한 것이 없으면 계약 칸을 <하나도 안 세운다> (지금 ' + empty.pans + '칸)');
  is(/아무것도 지어내지 않습니다/.test(empty.txt),
     '<아무것도 지어내지 않는다>고 화면에 적는다 (1번)');

  head('[7] 인쇄하면 <전부> 나온다');
  await pg.evaluate(() => { localStorage.clear(); S = blank(); save(); doSample(); S.before[0].act = 'cancel'; save(); go('req'); });
  await pg.waitForTimeout(300);
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(250);
  const pr = await pg.evaluate(() => {
    var hid = [].slice.call(document.querySelectorAll('.rq .rqp, .rq table, .rq .rqf'))
      .filter(function (x) { return getComputedStyle(x).display === 'none'; }).length;
    return { hid: hid, ctl: [].slice.call(document.querySelectorAll('.showctl'))
      .filter(function (x) { return getComputedStyle(x).display !== 'none'; }).length };
  });
  await pg.emulateMedia({ media: 'screen' });
  is(pr.hid === 0, '종이에서 <숨는 칸이 없다> (숨은 것 ' + pr.hid + '개)');
  is(pr.ctl === 0, '설계사 단추는 <종이에 안 나온다>');

  head('[8] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '가입설계 요청서 점검 통과 — 손으로 옮겨 적을 것이 없습니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
