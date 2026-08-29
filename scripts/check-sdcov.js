/* <b>「ai제안서에서 보장분석 상담자료에서 보장내용을 못 읽는다」</b>

   상담자료의 보장분석표는 담보를 <code>riders</code> 로 받게 되어 있고,
   못 받으면 그 자리에 <b>「자료에서 담보를 못 읽었습니다 — 직접 더해
   주세요」</b> 를 띄웁니다. 사장님이 보신 것이 그것입니다.

   그런데 <b>앱은 담보를 이미 읽어 두고 있었습니다.</b>
   <code>PR.scan.riders</code> 에 상품마다 담보 이름과 금액이 들어 있습니다.
   넘겨 주는 자리(<code>sdPlanRows</code>)가 <b>회사·상품·보험료·가입연도
   넷만</b> 보내고 담보 칸을 통째로 비워 보냈을 뿐입니다.

   ── 여기서 제일 위험한 것 ──────────────────────────────────────────
   <b>남의 보장을 이 계약에 얹는 것</b>입니다. 상품 이름이 안 맞는데
   아무 담보 묶음이나 붙이면, 고객님 앞 표에 <b>가입한 적 없는 담보</b>가
   섭니다. 그래서 이름이 맞을 때만 붙이고, 안 맞으면 <b>그 회사에 묶음이
   딱 하나일 때만</b> 씁니다. 그래도 없으면 <b>빈 채로 둡니다</b>.

   그리고 금액이 못 믿을 값이면(표에서 옆 칸이 붙어 「12683400원」 이 된
   숫자) <b>빈칸으로 보냅니다</b> — 틀린 금액을 고객 앞 표에 세우는 것보다
   비워 두고 고치시게 하는 편이 낫습니다 (CLAUDE.md 1번).

   지키는 것
     1. 담보가 <b>실제로 넘어간다</b>
     2. 상담자료가 쓰는 <b>이름·금액·종류</b> 모양으로 간다
     3. <b>남의 담보를 안 붙인다</b> — 못 고르면 비운다
     4. 못 믿을 금액은 <b>빈칸</b>으로 — 틀린 숫자를 안 세운다
     5. 무엇을 넘겼는지 <b>화면에 적는다</b> · 0개면 0개라고 말한다      */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 앱이 증권에서 읽어낸 모양 그대로 — 견본 사람은 홍길동 (CLAUDE.md 3번) */
const SCAN = {
  who: { name: '홍길동', age: 47, sex: '남' },
  plans: [
    { co: '삼성화재', name: '무배당 튼튼종합보험', fee: 84000, from: '2019-04-01' },
    { co: 'DB손해보험', name: '(무)프로미라이프 건강보험', fee: 62000, from: '2021-09-15' },
    { co: '메리츠화재', name: '무배당 알찬암보험', fee: 38000, from: '2023-02-01' }
  ],
  riders: [
    { co: '삼성화재', product: '무배당 튼튼종합보험', from: '2019-04-01', rows: [
      { kind: '정액', name: '암진단비', amount: '3,000만', raw: '3,000만', bad: 0, area: '암' },
      { kind: '정액', name: '뇌졸중진단비', amount: '2,000만', raw: '2,000만', bad: 0, area: '뇌·심장' },
      /* 표에서 옆 칸이 붙어 버린 숫자 — 금액은 못 믿는다 */
      { kind: '정액', name: '질병수술비', amount: '', raw: '12683400원', bad: 1, area: '수술·입원' },
      { kind: '실손', name: '상해입원의료비', amount: '5,000만', raw: '5,000만', bad: 0, area: '실손' }
    ] },
    { co: 'DB손해보험', product: '프로미라이프 건강보험', from: '2021-09-15', rows: [
      { kind: '정액', name: '급성심근경색진단비', amount: '2,000만', raw: '2,000만', bad: 0, area: '뇌·심장' },
      { kind: '정액', name: '질병입원일당', amount: '3만', raw: '3만', bad: 0, area: '수술·입원' }
    ] }
    /* 메리츠화재 것은 <b>일부러 없다</b> — 못 읽은 상품이 있는 상황 */
  ]
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] 담보가 실제로 넘어간다');
  const A = await page.evaluate((SCAN) => {
    PR.scan = SCAN;
    const rows = sdPlanRows();
    return {
      n: rows.length,
      riders: rows.map(r => (r.riders || []).length),
      total: sdRiderN(rows),
      first: (rows[0].riders || [])[0] || null,
      keys: Object.keys(rows[0] || {})
    };
  }, SCAN);
  is(A.n === 3, '  계약이 <b>세 건</b> 넘어간다 — ' + A.n + '건');
  is(A.total > 0, '  <b>담보가 넘어간다</b> — 모두 ' + A.total + '개 (여태 0개였다)');
  is(A.keys.indexOf('riders') >= 0, '  계약마다 <b>riders</b> 칸이 붙는다 — 상담자료가 그 이름으로 읽는다');
  is(A.first && A.first.name === '암진단비' && A.first.amount === '3,000만',
     '  <b>이름과 금액이 그대로</b> 간다 — 「' + (A.first ? A.first.name + ' · ' + A.first.amount : '없음') + '」');

  console.log('\n[2] 상담자료가 쓰는 말로 간다 — 표가 그 말로 묶는다');
  const B = await page.evaluate((SCAN) => {
    PR.scan = SCAN;
    const rs = sdPlanRows()[0].riders;
    const by = {}; rs.forEach(r => { by[r.name] = r; });
    return {
      암: by['암진단비'], 뇌: by['뇌졸중진단비'], 실: by['상해입원의료비'],
      kinds: rs.map(r => r.kind)
    };
  }, SCAN);
  is(B.암 && B.암.kind === '진단비' && B.암.target === '암',
     '  「암진단비」 → 종류 <b>진단비</b> · 부위 <b>암</b>');
  is(B.뇌 && B.뇌.target === '뇌', '  「뇌졸중진단비」 → 부위 <b>뇌</b>');
  is(B.실 && B.실.kind === '실손', '  「상해입원의료비」 → 종류 <b>실손</b>');
  is(B.kinds.indexOf('정액') < 0, '  앱 안에서만 쓰던 말(정액)이 <b>안 새어 나간다</b>');

  console.log('\n[3] 남의 담보를 안 붙인다 — 못 고르면 비운다');
  const C = await page.evaluate((SCAN) => {
    PR.scan = SCAN;
    const rows = sdPlanRows();
    const mz = rows.filter(r => /메리츠/.test(r.company))[0];
    /* 회사에 묶음이 둘이면 이름이 안 맞을 때 아무것도 안 붙여야 한다 */
    const S2 = JSON.parse(JSON.stringify(SCAN));
    S2.riders.push({ co: '삼성화재', product: '무배당 다른상품', from: '2020-01-01',
                     rows: [{ kind: '정액', name: '남의담보', amount: '1억', raw: '1억', bad: 0, area: '암' }] });
    S2.plans[0].name = '이름이 전혀 다른 상품';
    PR.scan = S2;
    const amb = sdPlanRows()[0];
    return { mz: (mz.riders || []).length, mzName: mz.name,
             amb: (amb.riders || []).length,
             ambHas: JSON.stringify(amb.riders || []).indexOf('남의담보') >= 0 };
  }, SCAN);
  is(C.mz === 0, '  못 읽은 상품은 <b>빈 채로</b> 간다 — 「' + C.mzName + '」 담보 ' + C.mz + '개');
  is(C.amb === 0 && !C.ambHas,
     '  한 회사에 묶음이 둘이고 이름이 안 맞으면 <b>아무것도 안 붙인다</b> — ' + C.amb + '개');

  console.log('\n[4] 못 믿을 금액은 빈칸으로 — 틀린 숫자를 안 세운다');
  const D = await page.evaluate((SCAN) => {
    PR.scan = SCAN;
    const rs = sdPlanRows()[0].riders;
    const su = rs.filter(r => r.name === '질병수술비')[0];
    return { there: !!su, amt: su ? su.amount : null,
             noRaw: JSON.stringify(rs).indexOf('12683400') < 0 };
  }, SCAN);
  is(D.there, '  <b>담보 이름은 남는다</b> — 금액이 이상하다고 담보를 통째로 버리지 않는다');
  is(D.amt === '', '  금액은 <b>빈칸</b>이다 — 그 자리에서 고치시면 된다');
  is(D.noRaw, '  <b>붙어 버린 숫자(12683400)가 안 넘어간다</b>');

  console.log('\n[5] 무엇을 넘겼는지 화면에 적는다');
  const E = await page.evaluate((SCAN) => {
    PR.scan = SCAN;
    sdPushPlan();
    const ok = sdSentHtml().replace(/<[^>]*>/g, '');
    /* 담보를 하나도 못 읽은 경우 */
    const S0 = JSON.parse(JSON.stringify(SCAN)); S0.riders = [];
    PR.scan = S0; sdPushPlan();
    const none = sdSentHtml().replace(/<[^>]*>/g, '');
    /* 아무것도 없는 경우 */
    PR.scan = null; sdPushPlan();
    const empty = sdSentHtml().replace(/<[^>]*>/g, '');
    return { ok, none, empty };
  }, SCAN);
  is(/계약 3건 · 담보 6개/.test(E.ok), '  <b>계약 몇 건 · 담보 몇 개</b>를 적는다 — 「' + E.ok.slice(0, 40) + '…」');
  is(/담보는 0개입니다/.test(E.none), '  담보를 못 읽었으면 <b>0개라고</b> 말한다 — 「넘어갔겠지」 로 안 둔다');
  is(/지어내지 않습니다/.test(E.none), '  <b>없는 담보를 지어내지 않는다</b>고 밝힌다 (1번)');
  is(/아직 넘긴 계약이 없습니다/.test(E.empty), '  아직 없으면 <b>없다고</b> 말한다');

  console.log('\n[6] 상담자료가 이 모양을 실제로 받는다');
  const deck = fs.readFileSync('app/상담자료/메인 상담자료.html', 'utf8');
  is(/if \(m\.t === 'apex:insurances'\)/.test(deck), '  상담자료가 <b>apex:insurances</b> 를 받는다');
  is(/s10ImportInsurances/.test(deck), '  받은 것을 <b>보장분석표로 넣는다</b>');
  is(/Array\.isArray\(ins\.riders\)/.test(deck), '  <b>riders</b> 를 담보로 읽는다 — 우리가 보내는 그 이름');
  is(/자료에서 담보를 못 읽었습니다/.test(deck),
     '  담보가 없으면 상담자료가 <b>그렇게 적는다</b> — 사장님이 보신 그 문구다');

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 상담자료가 보장내용을 못 받습니다')
                  : '✓ 담보가 이름·금액 그대로 넘어가고, 못 고르면 비우고, 넘긴 것을 적습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
