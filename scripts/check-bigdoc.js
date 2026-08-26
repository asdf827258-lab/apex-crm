/* <b>자료가 많아도 끝까지 읽는가.</b>

   사장님 말씀 — 「자료가 많았을 경우를 대비하고, 어떠한 경우에도 읽어내야만
   한다」. 재 보니 세 자리에서 <b>조용히</b> 끊기고 있었습니다.

   ① <b>회사 이름 표가 두 벌이었습니다.</b>
      INS_CO(보장분석) 66개 · BABA_CO(비포&애프터) 39개. 서로 다르게 비어
      있어서 <b>같은 증권을 두 화면이 다르게</b> 읽었습니다. 보장분석은
      「KB손보·농협손보·iM라이프」 를 읽는데 비포&애프터는 못 읽었고(31개),
      비포&애프터는 「농협손해보험」 을 읽는데 보장분석은 못 읽었습니다(4개).
      보장분석은 회사를 못 찾으면 <b>그 계약 줄을 통째로 버립니다</b> —
      계약 30건 중 「농협손해보험」 한 건이 목록에서 사라졌습니다.

   ② <b>계약을 24건까지만 읽었습니다.</b>
      25건째부터 <b>말없이</b> 사라졌습니다. 자산가 고객은 20~30건이 흔합니다.

   ③ <b>다른 양식 자료는 큰 틀 하나에 8줄까지만</b> 읽었습니다.
      그 길로만 읽히는 자료라 나머지는 그대로 사라졌습니다.

   여기서 확인합니다.
     1. 회사 이름 표가 <b>한 벌</b>인가 — 두 화면이 같은 회사를 읽는가
     2. 계약이 <b>많아도</b> 끝까지 읽는가 — 그리고 상한에 닿으면 말하는가
     3. 담보 진단·계약별 특약이 많아도 끝까지 읽는가
     4. 금액 표기가 어떻게 적혀 있어도 읽는가
     5. 자료를 여러 개 붙였을 때 <b>잘렸다고 말하는가</b>
     6. 큰 자료에서도 <b>빨리</b> 끝나는가 — 고객 앞에서 기다리지 않게       */

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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('\n[1] 회사 이름 표는 한 벌이다');
  const co = await page.evaluate(() => {
    const A = INS_CO.slice(), B = BABA_CO.slice();
    const sa = new Set(A), sb = new Set(B);
    return { same: INS_CO === BABA_CO, nA: A.length, nB: B.length,
             onlyIns: A.filter(x => !sb.has(x)), onlyBaba: B.filter(x => !sa.has(x)) };
  });
  is(co.same, '  두 화면이 <b>같은 표</b>를 가리킨다 — INS_CO ' + co.nA + '개');
  is(co.onlyIns.length === 0,
     '  보장분석만 아는 회사가 없다' + (co.onlyIns.length ? ' — ' + co.onlyIns.join(' · ') : ''));
  is(co.onlyBaba.length === 0,
     '  비포&애프터만 아는 회사가 없다' + (co.onlyBaba.length ? ' — ' + co.onlyBaba.join(' · ') : ''));

  console.log('\n[2] 두 화면이 같은 회사 표기를 읽는다');
  const both = await page.evaluate(() => {
    /* 줄임말·영문·계열사 — 실제 증권에 나오는 표기들 */
    const cases = ['삼성화재', 'KB손해보험', 'KB손보', 'DB손보', '농협손보', '농협손해보험',
                   'NH농협손해보험', 'iM라이프', 'KB라이프', '신한EZ손해보험', '우체국보험',
                   '푸르덴셜생명', '메트라이프생명', '하나손보'];
    return cases.map(c => {
      const B = babaPlanScan(c + ' (무)무배당 테스트종합보험 월보험료 50,000원\n' +
                            '  암진단비(유사암제외) 3,000만원');
      const I = insRows('1 정상 ' + c + ' 무배당 테스트종합보험 2018-03-01 월납 20 년 100 세 50,000 원', '');
      return { want: c, baba: B.length ? (B[0].co || '') : '', ins: I.length ? I[0].co : '' };
    });
  });
  both.forEach(x => {
    is(x.baba === x.want && x.ins === x.want,
       '  ' + x.want + ' — 비포&애프터 ' + (x.baba || '(못 읽음)') +
       ' · 보장분석 ' + (x.ins || '(못 읽음)'));
  });

  console.log('\n[3] 계약이 많아도 끝까지 읽는다');
  const many = await page.evaluate(() => {
    const CO = ['삼성화재', '현대해상', 'DB손해보험', 'KB손해보험', '메리츠화재', '한화손해보험',
                '흥국화재', '롯데손해보험', 'MG손해보험', '하나손해보험', '농협손해보험',
                'AXA손해보험', '캐롯손해보험', '삼성생명', '한화생명', '교보생명', '신한라이프',
                '미래에셋생명', '동양생명', '흥국생명'];
    const plan = n => ['가입설계서 계약자 홍길동 48세 남'].concat(
      Array.from({ length: n }, (_, i) => [
        CO[i % CO.length] + ' (무)무배당 P' + (i + 1) + '종합보험  보험기간 100세  월보험료 ' + (10000 + i * 137) + '원',
        '  암진단비(유사암제외)   ' + (1000 + i * 10) + '만원'
      ].join('\n'))).join('\n');
    const anal = n => ['보장분석 리포트  홍길동 (48세, 남자)', '홍길동 님의 전체 계약리스트']
      .concat(Array.from({ length: n }, (_, i) =>
        (i + 1) + ' 정상 ' + CO[i % CO.length] + ' 무배당 P' + (i + 1) +
        '종합보험 20' + String(10 + i % 15).padStart(2, '0') +
        '-03-01 월납 20 년 100 세 ' + (10000 + i * 137).toLocaleString() + ' 원')).join('\n');
    const out = { baba: [], ins: [], max: BABA_PLAN_MAX };
    [10, 25, 40, 60].forEach(n => {
      const t0 = Date.now(); const L = babaPlanScan(plan(n));
      out.baba.push({ want: n, got: L.length, ms: Date.now() - t0 });
    });
    [30, 60, 120, 200].forEach(n => {
      const t0 = Date.now(); const s = insScan(anal(n));
      out.ins.push({ want: n, got: s ? s.plans.length : 0, ms: Date.now() - t0 });
    });
    return out;
  });
  many.baba.forEach(x => is(x.got === x.want,
    '  비포&애프터 ' + String(x.want).padStart(3) + '건 → ' + x.got + '건 (' + x.ms + 'ms)' +
    (x.got < x.want ? '  ← ' + (x.want - x.got) + '건 사라짐' : '')));
  many.ins.forEach(x => is(x.got === x.want,
    '  보장분석 ' + String(x.want).padStart(3) + '건 → ' + x.got + '건 (' + x.ms + 'ms)' +
    (x.got < x.want ? '  ← ' + (x.want - x.got) + '건 사라짐' : '')));
  is(many.max >= 100, '  한 자료 상한이 넉넉하다 — ' + many.max + '건 (예전에는 24)');

  console.log('\n[4] 상한에 닿으면 조용히 버리지 않는다');
  const said = await page.evaluate(() => {
    const keep = babaPlans().slice(), rows = BABA.rows;
    let T = '가입설계서 계약자 홍길동';
    for (let i = 0; i < BABA_PLAN_MAX + 10; i++)
      T += '\n삼성화재 (무)무배당 Q' + (i + 1) + '종합보험 월보험료 ' + (10000 + i) + '원' +
           '\n  암진단비(유사암제외) ' + (1000 + i) + '만원';
    BABA.tooMany = 0; BABA.cut = [];
    babaPlanScan(T);
    const hit = BABA.tooMany;
    const d = document.createElement('div'); d.innerHTML = babaWhyHtml();
    const txt = d.textContent.replace(/\s+/g, ' ');
    BABA.tooMany = 0; BABA.plans = keep; BABA.rows = rows;
    return { hit: hit, txt: txt };
  });
  is(said.hit > 0, '  상한에 닿은 것을 알아챈다 — ' + said.hit);
  is(/건까지/.test(said.txt) && /뒷부분이 빠집니다/.test(said.txt),
     '  화면에 「뒷부분이 빠집니다」 라고 적는다');
  is(/나눠 올리시거나|손으로 더해/.test(said.txt), '  무엇을 하면 되는지 말한다');

  console.log('\n[5] 담보 진단·계약별 특약이 많아도 끝까지 읽는다');
  const deep = await page.evaluate(() => {
    const CO = ['삼성화재', '현대해상', 'DB손해보험', 'KB손해보험', '메리츠화재'];
    let T = '보장분석 리포트 홍길동 (48세, 남자)\n홍길동 님의 전체 계약리스트\n';
    for (let i = 0; i < 40; i++)
      T += (i + 1) + ' 정상 ' + CO[i % 5] + ' 무배당 P' + (i + 1) +
           '종합보험 2018-03-01 월납 20 년 100 세 ' + (10000 + i * 137) + ' 원\n';
    T += '홍길동 님의 상품별 가입담보상세\n';
    for (let i = 0; i < 40; i++) {
      T += CO[i % 5] + ' | 가입일자 : 2018-03-01 | 무배당 P' + (i + 1) + '종합보험 ';
      for (let j = 0; j < 15; j++) T += (j + 1) + ' 정액 담보' + (j + 1) + '진단비 ' + (1000 + j * 100) + '만 ';
      T += '\n';
    }
    T += '홍길동 님의 담보별 진단현황\n';
    for (let i = 0; i < 120; i++)
      T += '암 진단 담보' + (i + 1) + '진단비 권장 ' + (1000 + i * 10) + '만 가입 ' + (500 + i * 10) + '만 부족 -500만\n';
    const t0 = Date.now(); const s = insScan(T); const ms = Date.now() - t0;
    return { chars: T.length, max: PDF_TEXT_MAX, ms: ms,
             plans: s ? s.plans.length : 0, riders: s ? s.riders.length : 0,
             riderN: s ? s.riderN : 0, diags: s ? s.diags.length : 0 };
  });
  console.log('    자산가 한 부 — ' + deep.chars.toLocaleString() + '자 · ' + deep.ms + 'ms');
  is(deep.plans === 40, '  계약 40건 전부 — ' + deep.plans);
  is(deep.riders === 40, '  계약별 담보상세 40건 전부 — ' + deep.riders);
  is(deep.riderN === 600, '  특약 600개 전부 — ' + deep.riderN);
  is(deep.diags === 120, '  담보 진단 120줄 전부 — ' + deep.diags);
  is(deep.chars < deep.max,
     '  글자 상한(' + deep.max.toLocaleString() + '자) 안에 든다 — ' + deep.chars.toLocaleString() + '자');
  is(deep.ms < 3000, '  3초 안에 끝난다 — ' + deep.ms + 'ms (고객 앞에서 기다리지 않게)');

  console.log('\n[6] 다른 양식 자료도 큰 틀에서 안 자른다');
  const loose = await page.evaluate(() => {
    let T = '가입설계서 홍길동';
    for (let i = 0; i < 30; i++) T += '\n일반암진단비' + (i + 1) + ' ' + (1000 + i * 10) + '만원';
    const s = insLoose(T);
    const areas = s ? (s.areas || []) : [];
    return { max: INS_LOOSE_MAX, rows: areas.reduce((a, x) => a + (x.rows || []).length, 0) };
  });
  is(loose.max >= 30, '  큰 틀 하나에 담을 수 있는 줄이 넉넉하다 — ' + loose.max + '줄 (예전에는 8)');
  is(loose.rows >= 25, '  담보 30줄을 넣으면 ' + loose.rows + '줄이 남는다');

  console.log('\n[7] 금액이 어떻게 적혀 있어도 읽는다');
  const amt = await page.evaluate(() => {
    const head = '삼성화재 (무)무배당 A보험 월보험료 50,000원\n  암진단비(유사암제외)   ';
    const cases = [['5,000만원', 5000], ['1억원', 10000], ['1억 6,000만원', 16000],
                   ['5천만원', 5000], ['50,000,000원', 5000], ['5000만', 5000],
                   [': 5,000만원', 5000]];
    return cases.map(([txt, want]) => {
      const s = babaScan(head + txt);
      return { txt: txt, want: want, got: s.cancer ? s.cancer.won : null };
    });
  });
  amt.forEach(x => is(x.got === x.want,
    '  ' + x.txt.padEnd(14) + ' → ' + (x.got === null ? '못 읽음' : x.got + '만원')));

  console.log('\n[8] 자료를 여러 개 붙여 잘릴 때는 말해 준다');
  const trim = await page.evaluate(() => {
    const mk = (n, len) => ({ name: 'f' + n + '.pdf', slot: '기존', text: 'x'.repeat(len) });
    const small = pdfTrimParts(Array.from({ length: 3 }, (_, i) => mk(i + 1, 30000)));
    const big = pdfTrimParts(Array.from({ length: 12 }, (_, i) => mk(i + 1, 50000)));
    const sum = r => r.parts.reduce((a, p) => a + (p.text || '').length, 0);
    return { smallCut: 90000 - sum(small), smallNote: small.note || '',
             bigCut: 600000 - sum(big), bigNote: big.note || '', bigN: big.parts.length };
  });
  is(trim.smallCut === 0, '  자료가 적으면 안 자른다 — 3개 × 3만자 그대로');
  is(trim.bigCut > 0 && !!trim.bigNote,
     '  많이 잘릴 때는 <b>어느 파일을 얼마나</b> 잘랐는지 적는다 — ' +
     trim.bigNote.slice(0, 70));
  is(trim.bigN === 12, '  파일을 통째로 버리지는 않는다 — 12개 다 남는다');

  console.log('\n[9] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 어긋남\n'
                  : '큰 자료 점검 통과 — 자료가 많아도 끝까지 읽습니다.\n');
  process.exit(bad ? 1 : 0);
})();
