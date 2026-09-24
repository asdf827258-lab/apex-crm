/* ══════════════════════════════════════════════════════════════════
   check-baend.js — <b>보장분석이 「만기 한 줄」 을 제대로 적는가</b> (왕복)

   사장님 말씀 (2026-09-24) — 「보장분석이 돌 때 <b>다음 만기일 한 줄</b>을
   client_meta 에 적어 두게 하는 것이 다음 판입니다」, 그리고
   「<b>「D-30」 이라고 쓰지 마십시오.</b> 달까지밖에 모르는 값으로 일 단위
   D-30 을 만들면 <b>없는 정밀도를 지어내는 것</b>입니다 (1번)」.

   ── 왜 <b>왕복</b>으로 재는가 ─────────────────────────────────────
   규칙(app/day-rank.js)이 멀쩡해도 <b>적어 보내는 쪽</b>이 비어 있으면 화면은
   조용합니다. 그래서 app/ba.html 을 <b>실제로 띄워</b> 계약을 넣고 baEndOf()
   가 무엇을 내놓는지 잽니다. 글자로만 보면 못 잡습니다 (8번).

   ── 여기서 재는 것 ───────────────────────────────────────────────
     · 납입 만기를 <b>달까지만</b> 적는가 (일(日)은 원래 없다)
     · <b>9999세만기(종신)</b>를 만기로 안 읽는가 — 그대로 빼면 9,959년
     · <b>해지한 계약</b>은 안 세는가
     · <b>출처</b>를 같이 적는가 — 증권 날짜가 생기면 그쪽이 이긴다
     · 요약(sum)에 <b>실어 보내는가</b> — 홈이 읽는 자리가 거기다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

console.log('\n[1] <b>보장분석이 실제로 그 한 줄을 적는가</b> (왕복)');
/* check-queue(fast) 가 <b>규칙</b>을 재고, 여기서는 <b>적어 보내는 쪽</b>을 잽니다 */
const { chromium } = require('playwright');
const http = require('http'), url = require('url');
const PORT = 8931;
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const pg = await br.newPage();
  await pg.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  await pg.goto('http://127.0.0.1:' + PORT + '/app/ba.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForFunction(() => typeof baEndOf === 'function', { timeout: 30000 });
  const out = await pg.evaluate(() => {
    const Y = new Date().getFullYear();
    const M = new Date().getMonth() + 1, MM = (M < 10 ? '0' : '') + M;
    S.who = { name: '홍길동', age: '45', sex: '남', retire: '60', life: '85', incMan: '', expMan: '' };
    S.before = [
      /* ① 이번 달에 납입이 끝나는 계약 — 가입 달 + 햇수 */
      { id: 'a', co: '한화생명', nm: '무배당 종합', start: (Y - 20) + '-' + MM,
        years: '20', term: '20년납 100세만기', act: 'keep', cov: {}, cov2: {} },
      /* ② 종신 — KB 는 9999세만기로 적는다. 만기로 읽으면 안 된다 */
      { id: 'b', co: 'KB손보', nm: '종신', start: '2020-03', years: '', term: '전기납 9999세만기',
        act: 'keep', cov: {}, cov2: {} },
      /* ③ 해지한 계약 — 없어질 보험의 만기는 안 센다 */
      { id: 'c', co: '삼성생명', nm: '해지할 것', start: (Y - 19) + '-01', years: '19',
        term: '19년납 46세만기', act: 'cancel', cov: {}, cov2: {} }
    ];
    const e = baEndOf();
    /* 종신만 남기면? — 아무것도 안 나와야 한다 */
    const keep = S.before;
    S.before = [keep[1]];
    const only9999 = baEndOf();
    S.before = keep;
    return { e: e, only9999: only9999, Y: Y, age9999: baEndAge('전기납 9999세만기'), age100: baEndAge('20년납 100세만기') };
  });
  is(!!(out.e && out.e.pay), '  <b>납입 만기를 적는다</b> — ' + JSON.stringify((out.e || {}).pay));
  is(!!(out.e && out.e.pay && /^\d{4}-\d{2}$/.test(out.e.pay.ym)),
     '  <b>달까지만</b> 적는다 — 일(日)은 원래 없다 (1번)');
  is(out.age9999 === null, '  9999세만기는 <b>모름</b>이다 — baEndAge 9999 → ' + out.age9999);
  is(out.age100 === 100, '  100세만기는 <b>100</b>으로 읽는다 — ' + out.age100);
  is(out.only9999 === null || !out.only9999.cov,
     '  <b>종신만 있으면 만기를 안 적는다</b> — 9,959년이 되지 않는다');
  is(!!(out.e && out.e.src), '  <b>출처</b>를 같이 적는다 — ' + ((out.e || {}).src || '(없음)'));
  const covNm = (out.e && out.e.cov && out.e.cov.nm) || '';
  is(!/해지할 것/.test(covNm), '  <b>해지한 계약은 안 센다</b> — ' + (covNm || '(없음)'));
  /* 적어 보내는 자리(sum)에 실려 있는가 */
  is(/end:\s*baEndOf\(\)/.test(BA), '  요약(sum)에 <b>그 줄을 실어 보낸다</b> — 홈이 읽는 자리가 여기다');
  await br.close(); srv.close();

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ 만기 한 줄 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 만기를 아는 만큼만 적고, 종신을 9,959년으로 읽지 않습니다.');
})();
