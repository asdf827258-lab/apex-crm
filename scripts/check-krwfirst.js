/* ══════════════════════════════════════════════════════════════════
   check-krwfirst.js — <b>원화가 먼저 서는가.</b>

   사장님 말씀 — 「발표에서 달러 / 교육자금 부분이 전부 월보험료가 USD 로
   되어 있는데 <b>원화 기준으로</b> 보여 주라고. (괄호로 USD 금액)
   <b>실시간 반영</b>으로 하고」.

   고객이 통장에서 빠져나가는 것을 느끼는 단위는 <b>원</b>입니다. 달러가 앞에
   서면 매달 얼마인지 머릿속으로 한 번 더 곱해야 하고, 그 1초에 상담이
   끊깁니다. 화면은 <b>월 26만 4,033원 ($177.92)</b> 라고 읽혀야 합니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     ① 달러 트랙 <b>월보험료</b>가 원화 먼저 · 달러는 괄호로
     ② <b>환율을 움직이면 같이 바뀐다</b> — 실시간
     ③ <b>만원으로 뭉개지 않는다</b> — 「26만원」과 「26만 4,033원」은
        5년이면 24만원 차이다. 제안서와 안 맞는 숫자는 그 자리에서 꼬인다 (1번)
     ④ <b>달러를 없애지 않는다</b> — 제안서가 달러라 맞대 보셔야 한다 (1번)
     ⑤ 셈이 맞는다 — 원화 = 달러 × 환율
     ⑥ 교육자금도 <b>원화가 큰 글자</b>다

   ★ 바깥으로 안 나갑니다 — CI 는 인터넷이 되므로, 막지 않으면 늦게 온
     응답이 심어 둔 값을 덮어써 <b>CI 에서만</b> 빨간불이 켜집니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8996;
const DECK = '/app/' + encodeURIComponent('상담자료') + '/' + encodeURIComponent('통합상담_APEX') + '.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
/* 「26만 4,033원」 → 264033 */
const wonNum = (t) => {
  const m = /([\d,]+)만(?:\s*([\d,]+)원)?/.exec(t);
  if (m) return (+m[1].replace(/,/g, '')) * 10000 + (m[2] ? +m[2].replace(/,/g, '') : 0);
  const p = /([\d,]+)원/.exec(t);
  return p ? +p[1].replace(/,/g, '') : null;
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥은 막습니다 — 재는 것은 우리 화면이지 서버가 아닙니다 */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + PORT + DECK, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2400);

  /* 화면의 <b>진짜 칸</b>을 울립니다 — 안쪽 변수를 만지면 배선이 끊겨도 모릅니다 (8번) */
  const set = async (id, v) => {
    await pg.evaluate(([id, v]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, [id, v]);
    await pg.waitForTimeout(160);
  };
  const read = async () => await pg.evaluate(() => {
    const t = (s) => { const e = document.querySelector(s); return e ? (e.innerText || '').replace(/\s+/g, ' ').trim() : ''; };
    return { sub: t('.sub2'), echo: t('#paidEcho') };
  });

  head('[1] <b>달러 트랙 월보험료</b> — 원화가 먼저, 달러는 괄호로');
  const A = await read();
  is(/^월 [\d,]+만/.test(A.sub), '머리줄이 <b>「월 …만…원」</b>으로 시작한다 — ' + A.sub.slice(0, 44));
  is(!/^월 \$/.test(A.sub), '머리줄이 <b>「월 $」로 시작하지 않는다</b>');
  is(/\(\$[\d,]+\.\d\d\)/.test(A.sub), '달러가 <b>괄호로</b> 따라온다 — 제안서와 맞대 보셔야 한다 (1번)');
  is(/^월 [\d,]+만/.test(A.echo), '입력 옆 메아리도 <b>원화가 먼저</b>다 — ' + A.echo.slice(0, 48));

  /* ── <b>열면 월 100만원</b> ────────────────────────────────────────
     사장님 말씀 — 「기본값은 모두 계산하기 쉽게 100만원으로 먼저 세팅해서」.
     고객 앞에서는 배수로 셈합니다 — 100만원이 기준이면 200만원은 두 배입니다.
     26만 4,033원에서 시작하면 그 암산이 안 됩니다.
     ★ 센트로 반올림하면 999,993원이 되어 <b>7원이 샙니다</b>. 「100만원」이라
       해 놓고 99만 9,993원을 띄우면 그 자리에서 믿음이 깎입니다 (1번). */
  head('[2] <b>열면 월 100만원</b> — 배수로 셈하시기 쉽도록');
  const w1484 = wonNum(A.sub);
  is(w1484 === 1000000, '달러 트랙이 <b>정확히 100만원</b>에서 선다 — ' +
     (w1484 === null ? '(못 읽음)' : w1484.toLocaleString('ko-KR') + '원'));
  const DEF = await pg.evaluate(() => {
    const v = id => { const e = document.getElementById(id); return e ? +e.value : null; };
    return { pen: v('iPrem'), gw: v('gwPay'), edu: v('eMon'), prem: v('dPrem') };
  });
  is(DEF.pen === 100, '연금 <b>월 납입금액</b>도 100만원 — ' + DEF.pen + '만원');
  is(DEF.gw === 100,  '보증 <b>월 납입금액</b>도 100만원 — ' + DEF.gw + '만원');
  is(DEF.edu === 100, '교육 <b>월 납입액</b>도 100만원 — ' + DEF.edu + '만원');

  head('[2-1] <b>제안서 값은 한 번에 돌아온다</b> — 버리는 것이 아니다 (1번)');
  const P = await pg.evaluate(() => {
    const b = document.getElementById('dPremProp');
    if (!b) return { no: true };
    b.click();
    const sub = document.querySelector('.sub2');
    return { prem: +document.getElementById('dPrem').value,
             sub: (sub ? sub.innerText : '').replace(/\s+/g, ' ').trim() };
  });
  is(!P.no, '<b>제안서 값으로</b> 단추가 있다');
  is(P.prem === 177.92, '누르면 제안서에 적힌 <b>$177.92</b>로 돌아온다 — ' + P.prem);
  is(wonNum(P.sub) === Math.round(177.92 * 1484),
     '그때 원화도 <b>같이 따라온다</b> — ' + (wonNum(P.sub) || 0).toLocaleString('ko-KR') + '원');
  await set('dPrem', (1000000 / 1484).toFixed(2));

  head('[3] <b>환율을 움직이면 같이 바뀐다</b> — 실시간');
  await set('iFxIn', 1600); await set('iFxOut', 1600);
  const B = await read();
  await set('iFxIn', 1300); await set('iFxOut', 1300);
  const C = await read();
  const w1600 = wonNum(B.sub), w1300 = wonNum(C.sub);
  is(w1600 !== null && w1600 !== w1484, '환율 1,600원 — 숫자가 <b>바뀐다</b> (' + (w1600 || 0).toLocaleString('ko-KR') + '원)');
  is(w1300 !== null && w1300 < w1484, '환율 1,300원 — <b>줄어든다</b> (' + (w1300 || 0).toLocaleString('ko-KR') + '원)');
  const usdOf = t => (/\(\$([\d,.]+)\)/.exec(t) || [])[1] || '';
  is(usdOf(B.sub) && usdOf(B.sub) === usdOf(C.sub) && usdOf(B.sub) === usdOf(A.sub),
     '환율이 바뀌어도 <b>달러는 그대로</b>다 ($' + usdOf(B.sub) + ') — 달러가 변하면 그건 딴 상품이다');

  head('[4] <b>셈이 맞는가</b> — 원화 = 달러 × 환율 (지어낸 숫자가 아니다)');
  /* 칸에 적힌 달러를 그대로 읽어 견준다 — 숫자를 여기 또 적으면 기본값을
     바꿀 때 이 점검만 낡는다 (5번) */
  const cents = await pg.evaluate(() => +document.getElementById('dPrem').value);
  const ok = (w, fx) => w !== null && Math.abs(w - cents * fx) <= 10;
  is(ok(w1600, 1600), '1,600원 → ' + (w1600 || 0).toLocaleString('ko-KR') + '원 (셈 ' + Math.round(cents * 1600).toLocaleString('ko-KR') + '원)');
  is(ok(w1300, 1300), '1,300원 → ' + (w1300 || 0).toLocaleString('ko-KR') + '원 (셈 ' + Math.round(cents * 1300).toLocaleString('ko-KR') + '원)');

  head('[5] <b>보험료를 바꾸면</b> 원화도 따라온다');
  await set('iFxIn', 1484); await set('iFxOut', 1484);
  await set('dPrem', 300);
  const D = await read();
  const w300 = wonNum(D.sub);
  is(w300 !== null && Math.abs(w300 - 300 * 1484) <= 1,
     '$300 → <b>' + (w300 || 0).toLocaleString('ko-KR') + '원</b> (셈 ' + (300 * 1484).toLocaleString('ko-KR') + '원)');
  is(/\(\$300\.00\)/.test(D.sub), '괄호 안 달러도 <b>따라 바뀐다</b>');
  await set('dPrem', (1000000 / 1484).toFixed(2));

  head('[6] <b>교육자금</b>도 원화가 큰 글자다');
  const E = await pg.evaluate(() => {
    const el = document.getElementById('eMon');
    if (el) { el.value = '30'; el.dispatchEvent(new Event('input', { bubbles: true })); }
    const t = (s) => { const e = document.querySelector(s); return e ? (e.innerText || '').replace(/\s+/g, ' ').trim() : ''; };
    return { big: t('#eRes .big.g') || t('#eRes .split .big:last-of-type') || t('#eRes .big'),
             all: t('#eRes'),
             hot: t('#eMonBox .b.hot'),
             ths: [...document.querySelectorAll('#eMonBox table.mile thead th')].map(x => (x.innerText || '').replace(/\s+/g, ' ')) };
  });
  is(/달러 상품에서 찾을 때[^$]*만원/.test(E.all),
     '<b>달러 상품에서 찾을 때</b>의 큰 글자가 원화다');
  is(/만원 \(\$[\d,]+\)/.test(E.all), '달러는 <b>괄호로</b> 따라온다');
  is(/^[\d,]+만/.test(E.hot), '월 납입 칸의 결과도 <b>원화가 먼저</b>다 — ' + E.hot.slice(0, 40));
  is(E.ths.some(x => /받는 금액/.test(x) && /원화/.test(x)), '표의 <b>받는 금액</b> 칸이 원화다 — ' + (E.ths[2] || ''));
  is(E.ths.some(x => x.trim() === '달러'), '<b>달러 칸도 남아 있다</b> — 없애지 않는다 (1번)');

  head('[7] 이 판을 그리는 동안 <b>터진 곳이 없다</b>');
  is(errs.length === 0, '콘솔 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));

  console.log('\n' + (bad ? ('✗ 원화가 먼저 안 섭니다 — ' + bad + '자리')
                          : '✓ 달러·교육자금 모두 원화가 먼저 서고, 환율을 움직이면 같이 바뀝니다'));
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
