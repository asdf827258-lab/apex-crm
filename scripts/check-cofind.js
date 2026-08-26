/* <b>모르는 보험사 때문에 계약이 사라지지 않는가.</b>

   증권을 읽을 때 <b>보험사 이름을 못 찾으면 그 계약 줄을 통째로 버립니다</b>
   (insRows 의 `if (!co) continue`). 버리는 것 자체는 옳습니다 — 회사를
   짐작해 채우면 <b>남의 회사 이름</b>이 고객 앞에 섭니다 (CLAUDE.md 1번).

   문제는 <b>말없이</b> 버린 것이었습니다. 계약 30건 중 한 건이 사라져도
   합계만 보면 아무도 모릅니다. 실제로 「농협손해보험」 계약이 그렇게
   사라졌고, 견본을 만들어 세어 보고서야 찾았습니다.

   그리고 회사 표가 <b>코드에 박혀</b> 있었습니다. 새 회사가 나오거나
   증권이 모르는 표기로 적어 오면 그때마다 사람을 불러야 했습니다.

   여기서 확인합니다.
     1. 표가 <b>한 벌</b>인가 — 넣으면 두 화면이 <b>함께</b> 읽는가
     2. 못 읽은 줄을 <b>세어 화면에 말하는가</b> — 원문 그대로인가
     3. <b>헛알람이 없는가</b> — 다 읽은 자료에는 경고가 안 뜨는가
     4. 한 줄도 못 읽어도 <b>화면을 세우는가</b> — 넣을 자리가 있어야 한다
     5. 이상한 이름을 넣어도 <b>안 깨지는가</b> · 왜 안 되는지 말하는가
     6. 화면에서 <b>실제로</b> 넣어지고 지워지는가 · 새로고침에 안 날아가는가  */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 언제나 <b>홍길동</b> — 실제 고객 이름을 쓰지 않는다 (CLAUDE.md 3번) */
const DOC_MIX =
  '홍길동 님의 전체 계약리스트 ' +
  '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 50,000 원 ' +
  '2 정상 ZZ테스트해상 무배당 안심건강보험 2019-05-10 월납 15 년 90 세 32,000 원 ' +
  '3 정상 YY공제회 무배당 행복보장보험 2020-07-21 월납 10 년 80 세 21,000 원 ';
const DOC_OK =
  '홍길동 님의 전체 계약리스트 ' +
  '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 50,000 원 ' +
  '2 정상 현대해상 무배당 안심건강보험 2019-05-10 월납 15 년 90 세 32,000 원 ';
const DOC_NONE =
  '홍길동 님의 전체 계약리스트 ' +
  '1 정상 ZZ테스트해상 무배당 안심건강보험 2019-05-10 월납 15 년 90 세 32,000 원 ' +
  '2 정상 YY공제회 무배당 행복보장보험 2020-07-21 월납 10 년 80 세 21,000 원 ';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port + '/app/index.html';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 넣으면 두 화면이 함께 읽는다 — 표는 한 벌이다');
  const one = await page.evaluate(() => {
    const N = 'ZZ테스트해상';
    const line = '1 정상 ' + N + ' 무배당 안심건강보험 2019-05-10 월납 15 년 90 세 32,000 원';
    /* 비포&애프터는 계약을 <b>두 길</b>로 줍는다. 한 길만 고쳐 두고 넘어가면
       나머지 길이 <b>조용히</b> 코드 표만 보게 된다 — 그래서 둘을 따로 잰다.
         near … 회사 이름과 상품이 <b>붙어</b> 있는 꼴 (babaPlanScan 이 회사를 안다)
         far  … 「(무)무배당 ○○보험」 만 있고 회사는 <b>멀리</b> 있는 꼴 (babaPlanCoFind)
       near 는 「무배당」 이 없어 far 의 길로는 안 잡히고, far 는 회사와 상품
       사이가 30자를 넘어 near 의 길로는 안 잡힌다. 서로를 가려 주지 않는다. */
    const near = N + ' 튼튼종합보험 월보험료 32,000원';
    const far = N + ' 증권 요약입니다 계약자 홍길동 피보험자 홍길동 (무)무배당 안심건강보험 월보험료 32,000원';
    const read = () => ({
      ins: (insRows(line, '')[0] || {}).co || '',
      near: ((babaPlanScan(near) || [])[0] || {}).co || '',
      far: ((babaPlanScan(far) || [])[0] || {}).co || ''
    });
    const before = read();
    const msg = insCoAdd(N);
    const after = read();
    const n = insCoAll().length;
    insCoDel(N);
    const gone = read();
    return { before, after, gone, msg, n, mine: insCoMine().length };
  });
  is(!one.before.ins && !one.before.near && !one.before.far,
     '  넣기 전에는 <b>어느 길로도</b> 회사를 안 붙인다 — 짐작으로 채우지 않는다');
  is(one.msg === '', '  넣기가 성공한다' + (one.msg ? ' — ' + one.msg : ''));
  is(one.after.ins === 'ZZ테스트해상', '  넣은 뒤 <b>보장분석</b>이 읽는다 — ' + (one.after.ins || '(못 읽음)'));
  is(one.after.near === 'ZZ테스트해상',
     '  넣은 뒤 <b>비포&애프터</b>가 읽는다 — 회사가 상품에 붙은 꼴 · ' + (one.after.near || '(못 읽음)'));
  is(one.after.far === 'ZZ테스트해상',
     '  넣은 뒤 <b>비포&애프터</b>가 읽는다 — 회사가 멀리 있는 꼴 · ' + (one.after.far || '(못 읽음)'));
  is(!one.gone.ins && !one.gone.near && !one.gone.far, '  빼면 다시 안 읽는다 — 캐시가 안 남는다');
  is(one.mine === 0, '  뺀 뒤 목록이 비어 있다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 못 읽은 줄을 세어 화면에 말한다 — 원문 그대로');
  const said = await page.evaluate((doc) => {
    const sc = insScan(doc);
    const html = sc ? insCardHtml(sc) : '';
    return {
      plans: sc ? sc.plans.length : -1,
      co: sc ? (sc.plans[0] || {}).co : '',
      n: sc && sc.drop ? sc.drop.n : -1,
      rows: sc && sc.drop ? sc.drop.rows : [],
      warn: /ir-nc"/.test(html),
      says: /보험사 이름을 못 찾아/.test(html),
      box: /ir-nci/.test(html) && /insCoAddUi\(this\)/.test(html),
      guess: /ZZ테스트해상|YY공제회/.test(html)
    };
  }, DOC_MIX);
  is(said.plans === 1 && said.co === '삼성화재',
     '  아는 회사 1건은 그대로 읽는다 — ' + said.co + ' ' + said.plans + '건');
  is(said.n === 2, '  모르는 회사 <b>2줄</b>을 세었다 — ' + said.n + '줄');
  is(said.rows.some(r => r.indexOf('ZZ테스트해상') === 0) &&
     said.rows.some(r => r.indexOf('YY공제회') === 0),
     '  버린 줄을 <b>원문 그대로</b> 담았다 — ' + said.rows.join(' / '));
  is(said.warn && said.says, '  카드에 <b>경고가 뜬다</b>');
  is(said.box, '  그 자리에 <b>넣는 칸</b>이 있다');
  is(said.guess, '  원문을 화면에 보여 준다 — 사장님이 이름을 집어 넣으실 수 있다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 헛알람이 없다 — 다 읽은 자료에는 경고가 안 뜬다');
  const quiet = await page.evaluate((doc) => {
    const sc = insScan(doc);
    const html = sc ? insCardHtml(sc) : '';
    return { plans: sc ? sc.plans.length : -1, n: sc && sc.drop ? sc.drop.n : -1,
             warn: /ir-nc"/.test(html) };
  }, DOC_OK);
  is(quiet.plans === 2, '  두 계약을 다 읽었다 — ' + quiet.plans + '건');
  is(quiet.n === 0, '  버린 줄이 <b>0</b> 이다');
  is(!quiet.warn, '  경고가 <b>안 뜬다</b> — 헛것을 잡는 점검은 안 잡는 것보다 나쁘다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 한 줄도 못 읽어도 화면을 세운다 — 넣을 자리가 있어야 한다');
  const none = await page.evaluate((doc) => {
    const sc = insScan(doc);
    if (!sc) return { alive: false };
    const html = insCardHtml(sc);
    return { alive: true, plans: sc.plans.length, n: sc.drop.n,
             warn: /ir-nc"/.test(html), box: /insCoAddUi\(this\)/.test(html) };
  }, DOC_NONE);
  is(none.alive, '  <b>null 로 손 떼지 않는다</b> — 그러면 넣을 자리조차 없다');
  is(none.plans === 0 && none.n === 2, '  읽은 것 0건 · 버린 것 ' + none.n + '줄이라고 말한다');
  is(none.warn && none.box, '  경고와 넣는 칸이 그대로 있다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 이상한 이름을 넣어도 안 깨진다 — 왜 안 되는지 말한다');
  const odd = await page.evaluate(() => {
    const out = {};
    out.short = insCoAdd('가');
    out.long = insCoAdd('가나다라마바사아자차카타파하가나다라마바사');
    out.dup = insCoAdd('삼성화재');
    out.blank = insCoAdd('   ');
    /* 괄호·점이 든 이름을 넣어도 정규식이 안 깨져야 한다 */
    let threw = '';
    const N = '(주)ZZ테스트생명';
    insCoAdd(N);
    let readCo = '';
    try {
      readCo = ((babaPlanScan(N + ' (무)무배당 행복종합보험 월보험료 40,000원') || [])[0] || {}).co || '';
      insRows('1 정상 ' + N + ' 무배당 행복종합보험 2019-05-10 월납 15 년 90 세 32,000 원', '');
    } catch (e) { threw = String(e).slice(0, 90); }
    insCoDel(N);
    return { ...out, threw, readCo, mine: insCoMine().length };
  });
  is(!!odd.short && !!odd.long && !!odd.dup && !!odd.blank,
     '  못 넣는 이유를 <b>말한다</b> — 조용히 실패하지 않는다');
  is(/이미 읽고/.test(odd.dup), '  이미 아는 이름은 두 번 안 넣는다 — ' + odd.dup);
  is(odd.threw === '', '  괄호가 든 이름을 넣어도 <b>안 터진다</b>' + (odd.threw ? ' — ' + odd.threw : ''));
  is(odd.readCo === '(주)ZZ테스트생명', '  그 이름으로도 읽는다 — ' + (odd.readCo || '(못 읽음)'));
  is(odd.mine === 0, '  못 넣은 이름이 목록에 안 남았다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 화면에서 실제로 넣어지고 지워진다');
  await page.evaluate(() => {
    /* 비포&애프터는 로그인해야 열린다 — 점검에서는 문만 연다 */
    window.osTabAllowed = function () { return true; };
    try { localStorage.removeItem('apex_ins_co'); } catch (e) {}
    if (typeof _insCoAll !== 'undefined') { _insCoAll = null; _insRe = null; }
    go('baba');
  });
  await page.waitForTimeout(900);
  const btn = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button'))
      .filter(x => /읽는 회사 보기/.test(x.textContent));
    if (!b.length) return { found: false };
    b[0].click();
    return { found: true };
  });
  is(btn.found, '  단추 「🏢 읽는 회사 보기」 가 있다');
  await page.waitForTimeout(400);
  const card = await page.evaluate(() => {
    const e = document.getElementById('babaCo');
    const h = e ? e.innerHTML : '';
    return { open: /읽어내는 보험사/.test(h), input: !!(e && e.querySelector('input')),
             nBase: /읽어내는 보험사 <b>(\d+)곳/.exec(h) ? +RegExp.$1 : 0 };
  });
  is(card.open && card.input, '  칸이 펼쳐지고 <b>넣는 자리</b>가 있다 — ' + card.nBase + '곳');
  const typed = await page.evaluate(() => {
    const e = document.getElementById('babaCo');
    const inp = e.querySelector('input');
    inp.value = 'ZZ테스트해상';
    const b = e.querySelector('button');
    b.click();
    return { mine: insCoMine(), html: document.getElementById('babaCo').innerHTML };
  });
  is(typed.mine.length === 1 && typed.mine[0] === 'ZZ테스트해상',
     '  <b>실제로 들어간다</b> — ' + typed.mine.join(' · '));
  is(/ZZ테스트해상/.test(typed.html) && /babaCoDel/.test(typed.html),
     '  넣은 이름이 딱지로 보이고 <b>× 로 뺄 수 있다</b>');

  /* 새로고침에 안 날아가는가 */
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  const kept = await page.evaluate(() => {
    const co = ((babaPlanScan('ZZ테스트해상 (무)무배당 안심건강보험 월보험료 32,000원') || [])[0] || {}).co || '';
    const r = insCoMine();
    try { localStorage.removeItem('apex_ins_co'); } catch (e) {}
    return { mine: r, co: co };
  });
  is(kept.mine.length === 1 && kept.co === 'ZZ테스트해상',
     '  <b>새로고침해도 남아 있다</b> — ' + (kept.co || '(사라짐)'));

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 모르는 보험사 때문에 계약이 사라집니다')
                  : '✓ 모르는 보험사도 사장님이 그 자리에서 넣으시면 두 화면이 함께 읽습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
