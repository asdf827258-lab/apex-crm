/* 미끼상품 심화(PART 6) — <b>한 담보는 한 자리</b>에만 있는가.

   여태 한 담보 이야기가 여러 장에 흩어져 있었다. 흩어지면 두 가지가
   망가진다 — ① 화법을 고쳤을 때 <b>한쪽만</b> 고쳐져 어느 것이 최신인지
   알 수 없다 ② 현장에서 다 못 찾아 <b>던지고 나서 막힌다.</b>

   그래서 담보 하나를 <b>DEEP 한 줄</b>에 두고, 화면·목차·22장 한 줄 카드가
   전부 그 줄에서 나오게 했다. 여기서 못 박는 것은 이렇다.

     1. 유닛마다 아홉 칸이 다 선다. 지금 실린 것에 <b>빈 칸이 없다.</b>
     2. 칸을 비우면 화면이 <b>「아직 안 적었습니다」</b> 라고 말한다.
        빈 자리를 그럴듯한 말로 채우지 않는다 (CLAUDE.md 1번).
     3. <b>금액·한도·요건 숫자를 적지 않는다.</b> 회사·상품·판마다 다르다.
        외운 숫자를 고객 앞에서 말하면 그 자리에서 무너진다 (2번).
     4. 유닛마다 <b>「심사 결과에 따릅니다」</b> 가 적혀 있다.
     5. 22장의 「한 줄 던지기」 는 <b>DEEP 에서 나온다.</b> 손으로 또 적으면
        두 벌이 된다 (5번). 손으로 적힌 카드가 남아 있지 않은지 본다.
     6. 목차·서랍이 유닛을 <b>빠짐없이</b> 싣는다. 유닛을 늘렸는데 목차에
        안 뜨면 아무도 못 찾는다.
     7. 발표 모드가 유닛도 넘긴다.
     8. 견본 이름은 <b>홍길동</b>. 실제 고객 이름을 쓰지 않는다 (3번).      */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/상담자료/미끼상품_접촉전략.html';
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

/* 아홉 칸의 이름 — 화면의 소제목에서 이 순서로 나와야 한다 */
const NINE = ['① 이게 뭔데요', '② 누구에게 열리나', '③ 문 여는 첫 마디', '④ 고객이 스스로 말하게',
              '⑤ 던지기', '⑥ 이 담보에서', '⑦ 닫기', '⑧ 다음 계약으로', '⑨ 넘으면 안 되는 선'];

/* 적으면 안 되는 것 — <b>금액·한도·요건 숫자.</b>
   「3분만 확인」 같은 시간 약속이나 「40대」 같은 연령대는 요건이 아니라
   대상 설명이라 잡지 않는다. 헛것을 잡는 점검은 안 잡느니만 못하다 (8번). */
const MONEY = [
  [/[0-9][0-9,]*\s*만\s*원/, '「N만원」 — 금액'],
  [/[0-9][0-9,]*\s*억/, '「N억」 — 금액'],
  [/[0-9][0-9,]*\s*원(?!포인트)/, '「N원」 — 금액'],
  [/[0-9]+\s*(?:%|퍼센트)/, '「N%」 — 비율'],
  [/[0-9]+\s*개월/, '「N개월」 — 요건 기간'],
  [/[0-9]+\s*일\s*(?:이상|이내|째)/, '「N일 이상/이내」 — 요건 기간'],
  [/[0-9]+\s*세\s*(?:이상|이하|미만|까지)/, '「N세 이상」 — 요건 나이'],
];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1100, height: 950 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/' + FILE.split('/').map(encodeURIComponent).join('/'),
    { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(900);

  head('[1] 유닛마다 아홉 칸이 다 선다 · 지금 빈 칸이 없다');
  const U = await pg.evaluate(() => {
    return [].slice.call(document.querySelectorAll('#deepHost section.wrap')).map(function (s) {
      return {
        id: s.id,
        title: (s.querySelector('.chap') || {}).textContent || '',
        subs: [].slice.call(s.querySelectorAll('.subh')).map(function (x) { return x.textContent.trim(); }),
        blank: [].slice.call(s.querySelectorAll('.lb')).filter(function (x) { return /아직 안 적었/.test(x.textContent); }).length,
        text: s.textContent.replace(/\s+/g, ' ')
      };
    });
  });
  is(U.length >= 8, '심화 유닛이 ' + U.length + '개 서 있다');
  let missing = [];
  U.forEach(u => {
    NINE.forEach((n, k) => {
      /* 「!a.indexOf(n) === 0」 은 <b>언제나 거짓</b>이다 — !x 는 참·거짓이라
         0 과 같아지지 않는다. 그렇게 쓰면 이 알람은 영원히 안 운다. */
      if ((u.subs[k] || '').indexOf(n) !== 0) missing.push(u.id + ' ' + (u.subs[k] ? ('「' + u.subs[k].slice(0, 14) + '」 자리에 ') : '') + n);
    });
  });
  is(missing.length === 0, missing.length ? ('칸이 빠지거나 순서가 다른 곳 — ' + missing.slice(0, 4).join(' / ')) :
     '유닛 ' + U.length + '개 모두 아홉 칸이 <이 순서로> 선다');
  const blanks = U.filter(u => u.blank > 0);
  is(blanks.length === 0, blanks.length ? ('아직 안 적은 칸이 있다 — ' + blanks.map(b => b.id + '(' + b.blank + ')').join(' ')) :
     '지금 실린 유닛에 안 적은 칸이 없다');

  head('[2] 칸을 비우면 <아직 안 적었습니다> 라고 말한다 — 지어내지 않는다');
  const probe = await pg.evaluate(() => {
    var keep = JSON.parse(JSON.stringify(window.DEEP));
    /* 첫 유닛의 던지기·거절을 비워 본다 */
    delete window.DEEP[0].cast; window.DEEP[0].no = [];
    window.deepPaint();
    var s = document.getElementById(keep[0].id);
    var out = {
      says: [].slice.call(s.querySelectorAll('.lb')).filter(function (x) { return /아직 안 적었/.test(x.textContent); }).length,
      /* 빈 칸 자리에 아무 문장이나 지어 넣지 않았나 — 그 자리 글에 따옴표 화법이 없어야 한다 */
      invented: /“[^”]{10,}”/.test(([].slice.call(s.querySelectorAll('.note.warn')).map(function (n) { return n.textContent; }).join(' ')))
    };
    window.DEEP = keep; window.deepPaint();
    return out;
  });
  is(probe.says >= 2, '두 칸을 비우니 「아직 안 적었습니다」 가 ' + probe.says + '군데 떴다');
  is(!probe.invented, '빈 칸 자리에 <화법을 지어 넣지 않는다>');
  const after = await pg.evaluate(() => document.querySelectorAll('#deepHost section.wrap').length);
  is(after === U.length, '되돌리면 유닛 ' + after + '개가 그대로 돌아온다');

  head('[3] 금액·한도·요건 숫자를 적지 않는다 — 회사·상품·판마다 다르다');
  let hits = [];
  U.forEach(u => {
    MONEY.forEach(([re, what]) => {
      const m = u.text.match(re);
      if (m) hits.push(u.id + ' ' + what + ' → 「…' + u.text.slice(Math.max(0, u.text.indexOf(m[0]) - 18), u.text.indexOf(m[0]) + m[0].length + 8) + '…」');
    });
  });
  is(hits.length === 0, hits.length ? ('숫자가 적혀 있다 — ' + hits.slice(0, 3).join(' / ')) :
     '유닛 ' + U.length + '개 어디에도 금액·한도·요건 숫자가 없다');

  head('[4] 유닛마다 <심사 결과에 따릅니다> 가 있다');
  const noJudge = U.filter(u => u.text.indexOf('심사 결과에 따릅니다') < 0).map(u => u.id);
  is(noJudge.length === 0, noJudge.length ? ('빠진 유닛 — ' + noJudge.join(' ')) :
     '유닛 ' + U.length + '개 전부 「심사 결과에 따릅니다」 를 달고 있다');

  head('[5] 22장 한 줄 카드는 DEEP 에서 나온다 — 손으로 또 적지 않는다');
  const one = await pg.evaluate(() => ({
    n: document.querySelectorAll('#oneLine .card').length,
    deep: (window.DEEP || []).length,
    /* 22장 안에 <손으로 적힌> 카드가 남아 있나 — #oneLine 밖의 .card */
    hand: document.querySelectorAll('#c22 > .card').length,
    links: [].slice.call(document.querySelectorAll('#oneLine a')).map(a => a.getAttribute('href'))
  }));
  is(one.n === one.deep, '한 줄 카드 ' + one.n + '장 = 유닛 ' + one.deep + '개 — 같은 줄에서 나온다');
  is(one.hand === 0, '22장에 손으로 적힌 카드가 ' + one.hand + '장 — 두 벌이 아니다');
  const badLink = one.links.filter(h => !U.some(u => h === '#' + u.id));
  is(one.links.length === one.deep && badLink.length === 0,
     '한 줄 카드마다 <그 유닛으로 가는 길>이 있다 (' + one.links.length + '개)');

  head('[6] 목차·서랍이 유닛을 빠짐없이 싣는다');
  const toc = await pg.evaluate(() => ({
    grid: [].slice.call(document.querySelectorAll('#tocGrid .toc-item')).map(a => a.getAttribute('href')),
    drawer: [].slice.call(document.querySelectorAll('#drawer a')).map(a => a.getAttribute('href'))
  }));
  const lost = U.filter(u => toc.grid.indexOf('#' + u.id) < 0).map(u => u.id);
  is(lost.length === 0, lost.length ? ('목차에 안 뜨는 유닛 — ' + lost.join(' ')) :
     '목차에 유닛 ' + U.length + '개가 다 있다 (전체 ' + toc.grid.length + '칸)');
  const lostD = U.filter(u => toc.drawer.indexOf('#' + u.id) < 0).map(u => u.id);
  is(lostD.length === 0, lostD.length ? ('서랍에 안 뜨는 유닛 — ' + lostD.join(' ')) : '☰ 서랍에도 다 있다');
  is(toc.grid.indexOf('#deep0') >= 0, '「이 파트를 쓰는 법」 도 목차에 있다');

  head('[7] 발표 모드가 유닛도 넘긴다');
  await pg.evaluate(() => { document.getElementById('pvStart').click(); });
  await pg.waitForTimeout(400);
  const pv = await pg.evaluate((ids) => {
    var n = document.getElementById('pvNum').textContent || '';
    var total = parseInt((n.split('/')[1] || '0').trim(), 10);
    /* 목차에서 마지막 유닛으로 바로 가 본다 */
    var items = [].slice.call(document.querySelectorAll('.pv-i'));
    var last = ids[ids.length - 1];
    var hit = items.filter(function (b) { return (b.textContent || '').indexOf(last.t) >= 0; })[0];
    if (hit) hit.click();
    return { total: total, on: (document.querySelector('section.wrap.pon') || {}).id || '', found: !!hit };
  }, U.map(u => ({ id: u.id, t: (u.title || '').replace(/\s+/g, ' ').trim() })));
  is(pv.total >= U.length, '발표에서 넘길 장이 ' + pv.total + '장 — 유닛 ' + U.length + '개를 포함한다');
  is(pv.found && pv.on === U[U.length - 1].id,
     '발표 목차에서 마지막 유닛(' + U[U.length - 1].id + ')으로 바로 간다 — 지금 ' + (pv.on || '(없음)'));
  await pg.evaluate(() => { document.getElementById('pvExit').click(); });
  await pg.waitForTimeout(250);

  head('[8] 견본 이름은 홍길동 — 실제 고객 이름을 안 쓴다');
  const names = await pg.evaluate(() => {
    var t = [].slice.call(document.querySelectorAll('#deepHost section.wrap'))
      .map(function (s) { return s.textContent; }).join(' ');
    /* 「OOO 님」 · 「OOO 씨」 꼴을 찾는다 */
    return (t.match(/[가-힣]{2,4}\s*(?:님|씨)(?![들만은는이가])/g) || []);
  });
  const notOk = names.filter(n => !/(홍길동|고객|사장|어머|아버|대표|손님|자녀|부모)/.test(n));
  is(notOk.length === 0, notOk.length ? ('사람 이름 같은 것이 있다 — ' + notOk.slice(0, 5).join(' / ')) :
     '유닛에 실제 사람 이름이 없다');

  head('[9] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '심화 점검 통과 — 담보 하나가 한 자리에서 계약까지 갑니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
