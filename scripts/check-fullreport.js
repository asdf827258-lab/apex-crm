/* 고객 맞춤 보장분석 풀리포트 — <b>읽어 낸 담보가 하나도 사라지지 않는가.</b>

   이 화면이 무너지는 방식은 딱 정해져 있다. 전부 「조용히」 일어난다.

   ① <b>담보가 소리 없이 준다.</b> 사전에 없는 이름을 만나면 버리고, 표에는
      「전체 담보」라고 적힌다. 86건을 읽어 82건을 보여 주면서 전체라고 말하는
      것이 이 화면에서 가장 나쁜 일이다. 그래서 <b>세는 자리</b>를 시험한다.
   ② <b>「유지」를 찍었는데 조정 후에서 담보가 없어진다.</b> 고객이 그 자리에서
      「그럼 지금 있는 건 다 없어지는 겁니까」 라고 묻는다. 비포&애프터에서
      실제로 겪은 사고다. 그리고 <b>「해지검토」는 해지가 아니다.</b>
   ③ <b>보장 범위가 다른 진단비를 그냥 더한다.</b> 뇌출혈+뇌졸중+뇌혈관질환을
      6,000만원이라고 말하면, 뇌경색이 왔을 때 그 자리에서 무너진다.
   ④ <b>모름(null)을 0 으로 바꾼다.</b> 못 읽은 것을 0 으로 적으면 「보장이
      없다」는 뜻이 되어 버린다.
   ⑤ <b>기준 치료비를 지어낸다.</b> 출처 없는 숫자를 공식 치료비처럼 보여 주면
      고객은 그것을 사실로 믿는다. 안 넣었으면 <b>계산하지 않아야</b> 한다.
   ⑥ <b>일당을 목돈처럼 더한다.</b> 「하루 10만원」이 「10만원」이 된다.

   요구사항 35번의 TEST 01~10 을 <b>실제 함수를 불러</b> 돌린다. 글자만 보면
   함수가 사라져도 통과한다 (CLAUDE.md 8번).                                */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const APP = fs.readFileSync('app/index.html', 'utf8');
/* 주석에 적어 둔 설명을 코드로 착각하면 헛알람이 된다 (CLAUDE.md 8번) */
const CODE = APP.replace(/\/\*[\s\S]*?\*\//g, ' ');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  /* 시험용 자료를 앱 안에 세운다 — 서버는 안 부른다.
     이름은 「홍길동」 (CLAUDE.md 3번). */
  const seed = await page.evaluate(() => {
    if (typeof frMaster !== 'function') return { no: 'frMaster' };
    window.__frSeed = function (pols, covs, state, scen) {
      FR.cid = 'c1'; FR.client = { birth_year: 1983, gender: 'M', monthly_income: 550, monthly_fixed_expense: 290 };
      FR.pols = pols; FR.covs = covs; FR.state = state || frBlankState(); FR.rid = 'x'; FR.busy = false;
      OSC.current = { id: 'c1', name_masked: '홍○동' };
      OS.cfg = OS.cfg || {};
      OS.cfg.fr_scenarios = scen ? JSON.stringify(scen) : '';
      return true;
    };
    window.__cov = function (id, pid, name, amount, freq) {
      return { id: id, policy_id: pid, original_name: name, normalized_name: null, category: null,
               amount: (amount === undefined ? null : amount), unit: 'KRW',
               payment_frequency: (freq === undefined ? null : freq),
               renewable: null, source_page: 1, source_text: '원문', confidence: 0.9,
               verification_status: 'approved' };
    };
    window.__pol = function (id, prem, renew) {
      return { id: id, insurer: 'A생명', product_name: '건강보험', monthly_premium: prem,
               payment_term: '20년납', coverage_term: '100세', renewable: renew,
               source_document_id: 'd1', policyholder: '홍○동', insured: '홍○동' };
    };
    return { ok: 1 };
  });
  is(!seed.no, '풀리포트 함수가 실제로 실려 있다' + (seed.no ? ' — ' + seed.no + ' 없음' : ''));
  if (seed.no) { await browser.close(); srv.close(); process.exit(1); }

  /* ── TEST 01 · 02 · 09 — 담보가 하나도 사라지지 않는가 ── */
  console.log('\n[1] 세는 자리 — 원본 담보 수 = 시스템 담보 수 = 보고서 담보 수');
  const counts = await page.evaluate(() => {
    const out = [];
    const run = (n, names) => {
      const covs = names.map((nm, i) => __cov('c' + i, 'p1', nm, 10000000));
      __frSeed([__pol('p1', 82400, false)], covs);
      const M = frMaster(), T = frCounts(M);
      const html = frDocHtml(M, T);
      /* 부록 표에 실제로 <b>몇 줄</b>이 섰는지 센다 — 세는 함수만 믿지 않는다 */
      const rows = (html.match(/<tr>/g) || []).length;
      out.push({ n: n, extracted: T.extracted, report: T.report, lost: T.lost,
                 uncls: T.unclassified, rows: rows, htmlLen: html.length });
    };
    run('TEST01 담보 20개', Array.from({ length: 20 }, (_, i) => '일반암진단비' + i));
    const many = [];
    for (let i = 0; i < 104; i++) many.push(['일반암진단비', '뇌출혈진단비', '급성심근경색진단비', '질병수술비',
      '질병입원일당', '실손의료비', '간병인사용일당', '후유장해'][i % 8] + ' ' + i);
    run('TEST02 담보 104개', many);
    run('TEST09 사전에 없는 이름 포함', ['일반암진단비', '깨끗한하늘특약', '무지개보장특약', '뇌출혈진단비']);
    return out;
  });
  counts.forEach(c => {
    is(c.lost === 0, c.n + ' — 추출 ' + c.extracted + ' = 보고서 ' + c.report + ' (어긋남 ' + c.lost + ')');
  });
  is(counts[2].uncls === 2, 'TEST09 — 사전에 없는 담보 2건을 <b>버리지 않고</b> 미분류로 셌다 (미분류 ' + counts[2].uncls + ')');
  is(counts[1].rows >= 104, 'TEST02 — 담보 104개가 부록 표에 모두 줄로 섰다 (' + counts[1].rows + '줄)');
  is(!/\.slice\(0,\s*\d+\)/.test(
       (CODE.match(/function frAppendixHtml[\s\S]*?\n}\n/) || [''])[0]),
     '부록이 slice·상위 N 개로 담보를 숨기지 않는다');

  /* ── TEST 05 · 06 · 07 · 08 — 조치 상태 ── */
  console.log('\n[2] 유지·조정·해지검토·해지·신규 — 상태를 섞지 않는가');
  const acts = await page.evaluate(() => {
    const covs = [__cov('x1', 'p1', '일반암진단비', 30000000), __cov('x2', 'p2', '뇌출혈진단비', 20000000),
                  __cov('x3', 'p3', '급성심근경색진단비', 10000000), __cov('x4', 'p4', '질병수술비', 5000000)];
    const pols = [__pol('p1', 82400, false), __pol('p2', 41000, true),
                  __pol('p3', 30000, false), __pol('p4', 25000, false)];
    const st = frBlankState();
    st.pact = { p1: 'KEEP', p2: 'REVIEW_CANCEL', p3: 'CANCEL', p4: 'NEW' };
    __frSeed(pols, covs, st);
    const M = frMaster(), by = {}; M.forEach(m => by[m.id] = m);
    const pr = frPrem();
    return { keepA: by.x1.aWon, keepB: by.x1.bWon,
             reviewA: by.x2.aWon, cancelA: by.x3.aWon,
             newB: by.x4.bWon, newA: by.x4.aWon,
             premB: pr.beforeWon, premA: pr.afterWon, len: M.length };
  });
  is(acts.keepA === 30000000, 'TEST05 유지 — 기존 담보가 조정 후에 <b>그대로</b> 남는다 (' + acts.keepA + ')');
  is(acts.reviewA === 20000000, 'TEST07 해지검토 — 해지가 아니므로 조정 후에 남는다 (' + acts.reviewA + ')');
  is(acts.cancelA === null, '해지 확정 — 조정 후에서 빠진다');
  is(acts.newB === null && acts.newA === 5000000, 'TEST08 신규 제안 — 현재에는 없고 조정 후에만 있다');
  is(acts.premB === 82400 + 41000 + 30000, '현재 보험료는 신규 제안을 빼고 센다 (' + acts.premB + '원)');
  is(acts.premA === 82400 + 41000 + 25000, '조정 후 보험료는 해지 확정만 빠진다 (' + acts.premA + '원)');
  is(acts.len === 4, '어떤 조치를 찍어도 마스터 목록의 줄 수는 그대로다');

  /* ── TEST 03 — 납입완료 ── */
  console.log('\n[3] TEST03 납입완료 — 보험료 0 · 보장은 유지');
  const paid = await page.evaluate(() => {
    const st = frBlankState(); st.pact = { p1: 'PAID_UP' };
    __frSeed([__pol('p1', 82400, false)], [__cov('x1', 'p1', '일반암진단비', 30000000)], st);
    const M = frMaster(), pr = frPrem();
    return { b: M[0].bWon, a: M[0].aWon, premB: pr.beforeWon, premA: pr.afterWon, n: pr.paidUp };
  });
  is(paid.b === 30000000 && paid.a === 30000000, '납입완료 계약의 담보는 현재·조정 후 모두 살아 있다');
  is(paid.premB === 0 && paid.premA === 0, '납입완료 계약의 보험료는 0 으로 센다');
  is(paid.n === 1, '납입완료 건수를 따로 센다');

  /* ── TEST 04 · 10 — 모름을 0 으로 바꾸지 않는가 ── */
  console.log('\n[4] 모름(null)과 0 을 섞지 않는가');
  const nulls = await page.evaluate(() => {
    __frSeed([__pol('p1', null, true), __pol('p2', 30000, null)],
             [__cov('x1', 'p1', '일반암진단비'), __cov('x2', 'p2', '뇌출혈진단비', 20000000)]);
    const M = frMaster(), T = frCounts(M), pr = frPrem();
    FR.client = { birth_year: null, gender: null, monthly_income: null, monthly_fixed_expense: null };
    const e = frEcon();
    return { amt: M[0].bWon, noAmt: T.noAmount, unkPrem: pr.unknownB, premB: pr.beforeWon,
             ratio: e.ratioBefore, income: e.incomeWon, age: e.age,
             renewN: e.renewN, renewKnown: e.renewKnown, renewUnknown: e.renewUnknown,
             txt: frAmtText(null) };
  });
  is(nulls.amt === null, '금액을 못 읽은 담보는 null 로 남는다 (0 아님)');
  is(nulls.noAmt === 1, '금액 확인 필요 건수를 따로 센다');
  is(nulls.unkPrem === 1 && nulls.premB === 30000, '보험료를 못 읽은 계약을 0 으로 더하지 않고 따로 센다');
  is(nulls.ratio === null && nulls.income === null && nulls.age === null,
     'TEST10 경제정보 미입력 — 0% 가 아니라 「모름」으로 둔다');
  is(/확인 필요/.test(nulls.txt), '화면에도 「확인 필요」로 적는다');
  is(nulls.renewKnown === 1 && nulls.renewUnknown === 1,
     'TEST04 갱신·비갱신 혼재 — 갱신여부를 못 읽은 계약을 따로 센다');

  /* ── §15 — 보장 범위가 다른 진단비를 단순 합산하지 않는가 ── */
  console.log('\n[5] 같은 사건에서 열리는 담보만 더하는가 (요구사항 15번)');
  const scope = await page.evaluate(() => {
    const scen = [{ id: 's1', diseaseCategory: 'BRAIN', diseaseCode: 'brain_infarct',
                    scenarioName: '뇌경색 표준', referenceTreatmentCostWon: 40000000,
                    purposes: ['DIAGNOSIS', 'SURGERY', 'TREATMENT'], treatmentSteps: [],
                    sourceName: '시험', sourceDate: '2026-01', active: true }];
    __frSeed([__pol('p1', 50000, false)],
      [__cov('b1', 'p1', '뇌혈관질환진단비', 30000000),
       __cov('b2', 'p1', '뇌졸중진단비', 20000000),
       __cov('b3', 'p1', '뇌출혈진단비', 10000000)], null, scen);
    const M = frMaster(), sc = frScenActive()[0], r = frScenCalc(sc, M, 'before');
    /* 갑상선암이 일반암 진단비를 끌어오지 않는가 */
    const scen2 = [{ id: 's2', diseaseCategory: 'CANCER', diseaseCode: 'cancer_minor',
                     scenarioName: '갑상선암', referenceTreatmentCostWon: 10000000,
                     purposes: ['DIAGNOSIS'], treatmentSteps: [], sourceName: '시험', active: true }];
    __frSeed([__pol('p1', 50000, false)],
      [__cov('c1', 'p1', '일반암진단비', 30000000), __cov('c2', 'p1', '유사암진단비', 5000000)], null, scen2);
    const M2 = frMaster(), r2 = frScenCalc(frScenActive()[0], M2, 'before');
    /* 재진단·전이는 <b>첫 사건이 아니다</b> — 같이 더하면 방어력이 부풀어 오른다 */
    const scen3 = [{ id: 's3', diseaseCategory: 'CANCER', diseaseCode: 'cancer_general',
                     scenarioName: '위암 표준', referenceTreatmentCostWon: 50000000,
                     purposes: ['DIAGNOSIS'], treatmentSteps: [], sourceName: '시험', active: true }];
    __frSeed([__pol('p1', 50000, false)],
      [__cov('d1', 'p1', '일반암진단비', 30000000),
       __cov('d2', 'p1', '재진단암진단비', 20000000),
       __cov('d3', 'p1', '전이암진단비', 20000000)], null, scen3);
    const M3 = frMaster(), r3 = frScenCalc(frScenActive()[0], M3, 'before');
    return { won: r.coverWon, off: r.offDz.length, sum: 60000000,
             cancerWon: r2.coverWon, cancerOff: r2.offDz.length,
             firstWon: r3.coverWon, firstOff: r3.offDz.length };
  });
  is(scope.won === 50000000, '뇌경색 — 뇌혈관질환+뇌졸중만 더했다 (' + scope.won + '원, 단순합산 ' + scope.sum + '원 아님)');
  is(scope.off === 1, '뇌출혈 진단비는 이 사건에서 지급되지 않아 <b>빼고</b> 그 사실을 남겼다');
  is(scope.cancerWon === 5000000, '갑상선암 — 유사암만 더했다 (일반암 3,000만을 끌어오지 않음)');
  is(scope.cancerOff === 1, '일반암 진단비를 뺀 사실을 남겼다');
  is(scope.firstWon === 30000000 && scope.firstOff === 2,
     '첫 진단 시나리오에 <b>재진단암·전이암을 같이 더하지 않는다</b> (' + scope.firstWon + '원)');

  /* ── 화면이 저장해 둔 고객 정보를 실제로 읽는가 ── */
  console.log('\n[5-1] 저장해 둔 고객 정보를 리포트가 읽는가');
  const prof = await page.evaluate(() => {
    __frSeed([__pol('p1', 50000, false)], [__cov('c1', 'p1', '일반암진단비', 30000000)]);
    const M = frMaster(), doc = frPage1Html(M, frCounts(M));
    return { male: doc.indexOf('43세 · 남') >= 0 || doc.indexOf('세 · 남') >= 0,
             name: doc.indexOf('홍○동') >= 0 };
  });
  is(prof.male, '성별을 FR.client 에서 읽는다 — OSC.current 에는 없어 늘 「미입력」이 되던 자리');
  is(prof.name, '고객 이름은 마스킹된 이름을 그대로 쓴다');

  /* ── §9·§10 — 기준 치료비가 없으면 방어력을 만들지 않는가 ── */
  console.log('\n[6] 기준 치료비 미설정 — 숫자를 지어내지 않는가');
  const noStd = await page.evaluate(() => {
    __frSeed([__pol('p1', 50000, false)], [__cov('c1', 'p1', '일반암진단비', 30000000)], null, []);
    const M = frMaster(), T = frCounts(M), doc = frDocHtml(M, T);
    const r = frScenCalc({ referenceTreatmentCostWon: null }, M, 'before');
    /* 있을 때는 100% 넘는 값을 그대로 적는가 */
    const scen = [{ id: 's1', diseaseCategory: 'CANCER', diseaseCode: 'cancer_general',
                    scenarioName: '암', referenceTreatmentCostWon: 20000000,
                    purposes: ['DIAGNOSIS'], treatmentSteps: [], sourceName: '', active: true }];
    __frSeed([__pol('p1', 50000, false)], [__cov('c1', 'p1', '일반암진단비', 30000000)], null, scen);
    const M2 = frMaster(), over = frScenCalc(frScenActive()[0], M2, 'before');
    const doc2 = frDocHtml(M2, frCounts(M2));
    return { na: r.na, rate: r.rate, hasMsg: doc.indexOf('기준 치료비 미설정') >= 0,
             overRate: Math.round(over.rate), shows150: doc2.indexOf('150%') >= 0,
             noSrc: doc2.indexOf('출처가 적혀 있지 않습니다') >= 0 };
  });
  is(noStd.na === true && noStd.rate === null, '기준 치료비가 없으면 방어력을 계산하지 않는다');
  is(noStd.hasMsg, '화면에 「기준 치료비 미설정」이라고 적는다');
  is(noStd.overRate === 150 && noStd.shows150, '100% 를 넘으면 실제 값(150%)을 그대로 적는다');
  is(noStd.noSrc, '출처가 없는 기준 치료비는 「공식 치료비가 아니다」라고 밝힌다');
  is(!/referenceTreatmentCostWon\s*:\s*[0-9]/.test(CODE), '기준 치료비를 코드에 박아 두지 않았다');

  /* ── 일당·실손을 목돈과 같이 더하지 않는가 ── */
  console.log('\n[7] 일당·실손 — 목돈과 같은 자로 재지 않는가');
  const kinds = await page.evaluate(() => {
    const scen = [{ id: 's1', diseaseCategory: 'CANCER', diseaseCode: 'cancer_general',
                    scenarioName: '암', referenceTreatmentCostWon: 50000000,
                    purposes: ['DIAGNOSIS', 'HOSPITAL', 'ACTUAL_EXPENSE'], treatmentSteps: [],
                    sourceName: '시험', active: true }];
    __frSeed([__pol('p1', 50000, false)],
      [__cov('c1', 'p1', '일반암진단비', 30000000),
       __cov('c2', 'p1', '질병입원일당', 100000),
       __cov('c3', 'p1', '실손의료비', 50000000)], null, scen);
    const M = frMaster(), r = frScenCalc(frScenActive()[0], M, 'before');
    /* 입원일수를 넣으면 그때만 환산한다 */
    const sc2 = frScenActive()[0]; sc2.inpatientDays = 21;
    const r2 = frScenCalc(sc2, M, 'before');
    const g = frGroupSum(M, ['DIAGNOSIS'], 'before');
    return { won: r.coverWon, actual: r.actual.length, noDays: r.dailyNoDays.length,
             won2: r2.coverWon, group: g.won,
             pays: M.map(m => m.pay).join(',') };
  });
  is(kinds.pays === 'LUMP,DAILY,ACTUAL', '목돈·일당·실손을 구분해 표시한다 (' + kinds.pays + ')');
  is(kinds.won === 30000000, '입원일수가 없으면 일당·실손을 더하지 않는다 (' + kinds.won + '원)');
  is(kinds.actual === 1 && kinds.noDays === 1, '더하지 않은 이유를 각각 남긴다');
  is(kinds.won2 === 30000000 + 100000 * 21, '입원일수를 설정하면 그때만 일당×일수로 환산한다');
  is(kinds.group === 30000000, '목적별 합계에도 목돈만 더한다');

  /* ── 분류기 ── */
  console.log('\n[8] 담보 분류 — 이름이 비슷하다고 남의 칸에 넣지 않는가');
  const cls = await page.evaluate(() => {
    const t = n => { const c = frClassify(n, null); return c.key + '|' + c.ok; };
    return {
      thyroid: t('갑상선암진단비'), general: t('일반암진단비'),
      exclude: t('암진단비(유사암 제외)'),
      target: t('표적항암약물허가치료비'), drug: t('항암약물치료비'),
      brainAll: t('뇌혈관질환진단비'), brainHemo: t('뇌출혈진단비'),
      mi: t('급성심근경색진단비'), isch: t('허혈성심장질환진단비'),
      spaced: t('뇌 혈 관 질 환 진 단 비'),
      unknown: t('깨끗한하늘특약'),
      cart: t('CAR-T 치료비'), open: t('비관혈수술비')
    };
  });
  is(cls.thyroid === 'cancer_thy|1', '갑상선암이 일반암으로 가지 않는다');
  is(cls.general === 'cancer_gen|1', '일반암을 일반암으로 읽는다');
  is(cls.exclude === 'cancer_gen|1', '「(유사암 제외)」는 범위를 좁히는 말이지 다른 담보가 아니다');
  is(cls.target === 'anti_target|1' && cls.drug === 'anti_drug|1', '표적항암과 항암약물을 가르다');
  is(cls.brainAll === 'brain_vessel|1' && cls.brainHemo === 'brain_hemo|1', '뇌혈관질환과 뇌출혈을 가르다');
  is(cls.mi === 'heart_mi|1' && cls.isch === 'heart_isch|1', '급성심근경색과 허혈성심장질환을 가르다');
  is(cls.spaced === 'brain_vessel|1', '글자가 벌어져 나온 이름도 읽는다');
  is(cls.cart === 'anti_cart|1', 'CAR-T 처럼 부호가 낀 이름도 읽는다');
  is(cls.open === 'surg_closed|1', '「비관혈」을 「관혈」로 읽지 않는다');
  is(cls.unknown === 'null|0', '모르는 이름은 <b>버리지 않고</b> 미분류로 돌려준다');

  /* ── 요구사항 13번 — 점검할 보장 카테고리가 사전에 다 있는가 ── */
  console.log('\n[9] 사전이 요구된 담보군을 덮는가');
  const dict = await page.evaluate(() => {
    const want = ['일반암', '유사암', '갑상선암', '제자리암', '경계성종양', '재진단암', '전이암', '통합암',
      '암수술', '암입원', '암통원', '항암약물치료', '항암방사선치료', '표적항암약물허가치료', '면역항암치료',
      '중입자치료', '양성자치료', '암주요치료비',
      '뇌출혈', '뇌졸중', '뇌혈관질환', '뇌혈관수술', '혈전용해치료',
      '급성심근경색', '허혈성심장질환', '심혈관질환', '심장수술', '혈전제거치료',
      '질병수술', '상해수술', '1종수술', '5종수술', '관혈수술', '비관혈수술', '로봇수술', '다빈치수술',
      '질병입원일당', '상해입원일당', '중환자실', '질병통원', '상해통원', '응급실',
      '도수치료', '주사치료', 'MRI', '비급여',
      '질병후유장해', '상해후유장해', '질병사망', '상해사망', '일반사망', '재해사망',
      '간병인사용일당', '간호간병통합서비스', '요양병원', '치매', '장기요양', '재가급여', '시설급여',
      '방문요양', '방문간호', '주야간보호', '복지용구',
      '골절진단', '골절수술', '깁스', '화상진단', '화상수술',
      '배상책임', '운전자', '치아', '특정질환', '생활질환'];
    const miss = want.filter(w => !frClassify(w + '보장', null).ok);
    return { total: FR_DICT.length, miss: miss, cats: FR_CATS.length, purs: FR_PUR.length };
  });
  is(dict.miss.length === 0, '요구된 담보군 ' + (dict.total) + '줄 사전이 모두 읽힌다' +
     (dict.miss.length ? ' — 못 읽음: ' + dict.miss.join(', ') : ''));

  /* ── 그림 장 ── */
  console.log('\n[9-1] 그림 — 인체도·그래프·치료 여정이 거짓말하지 않는가');
  const pic = await page.evaluate(() => {
    const scen = [{ id: 's1', diseaseCategory: 'CANCER', diseaseCode: 'cancer_general',
                    scenarioName: '위암 표준', referenceTreatmentCostWon: 50000000, inpatientDays: 21,
                    purposes: ['DIAGNOSIS', 'SURGERY', 'TREATMENT'], sourceName: '시험', active: true,
                    treatmentSteps: [
                      { no: '01', name: '진단', keys: ['cancer_gen', 'cancer_minor'], costWon: 5000000 },
                      { no: '03', name: '입원', keys: ['hos_dz'], costWon: 4000000 },
                      { no: '04', name: '항암약물치료', keys: ['anti_drug'], costWon: 20000000 }] }];
    const covs = [__cov('c1', 'p1', '일반암진단비', 30000000),
                  __cov('c2', 'p1', '유사암진단비', 5000000),
                  __cov('c3', 'p1', '질병입원일당', 30000),
                  __cov('c4', 'p1', '항암방사선치료비'),          /* 금액 못 읽음 */
                  __cov('c5', 'p2', '항암약물치료비', 10000000),  /* 신규 제안 */
                  __cov('c6', 'p1', '골절진단비', 1000000)];
    const st = frBlankState(); st.pact = { p2: 'NEW' };
    __frSeed([__pol('p1', 50000, false), __pol('p2', 30000, false)], covs, st, scen);
    const M = frMaster();
    const body = frBodyHtml(M), charts = frChartsHtml(M), jn = frStepsTableHtml(frScenActive()[0], M);
    const B = frStepCalc(frScenActive()[0], M, 'before');
    const cancerRg = frRegion(FR_BODY.filter(x => x.k === 'CANCER')[0], M);
    /* 담보가 하나도 없는 부위 */
    const nur = frRegion(FR_BODY.filter(x => x.k === 'NURSING')[0], M);
    const sc = frScenCalc(frScenActive()[0], M, 'before');
    return {
      bodySvg: /<svg/.test(body), dots: (body.match(/fr-dot/g) || []).length,
      step01: B[0].coverWon, step01off: B[0].off,
      step03: B[1].coverWon, step03daily: B[1].daily,
      step04unk: B[2].unknown, step04pend: B[2].pend,
      scenPend: sc.pend.length, scenUnk: sc.unknown.length,
      cancerLump: cancerRg.bWon, cancerCover: cancerRg.rate ? cancerRg.rate.coverB : null,
      saysBoth: frRegionSay(cancerRg).indexOf('이 사건에서 열리는 것은') >= 0,
      offB: cancerRg.rate ? cancerRg.rate.offB : -1,
      nurNone: frRegionSay(nur).indexOf('준비된 담보가 없습니다') >= 0,
      nurColor: frRegionColor(nur),
      chartsHasActual: charts.indexOf('실손') >= 0,
      jnLen: jn.length
    };
  });
  is(pic.bodySvg && pic.dots === 4, '인체 그림을 새로 그리지 않고 가져다 쓰고, 부위 점이 얹힌다 (' + pic.dots + '개)');
  is(pic.step01 === 30000000 && pic.step01off === 1,
     '단계 계산도 사건 자를 쓴다 — 위암 「진단」에 유사암을 더하지 않는다 (' + pic.step01 + '원)');
  is(pic.step03 === 30000 * 21 && pic.step03daily === 1, '일당 단계는 입원일수로 환산하고 그 사실을 남긴다');
  is(pic.step04unk === 0 && pic.step04pend === 1,
     '신규 제안 담보를 「금액 확인 필요」가 아니라 「조정 후에만」으로 가른다');
  is(pic.scenPend === 1 && pic.scenUnk === 1, '방어력 계산도 「못 읽음」과 「아직 없음」을 가른다');
  is(pic.cancerLump !== pic.cancerCover && pic.saysBoth,
     '부위 합계(' + pic.cancerLump + ')와 방어력 기준액(' + pic.cancerCover + ')이 다르면 그 말을 한다');
  is(pic.offB === 1, '뺀 담보는 <b>그 부위 안에서만</b> 센다 — 표 전체를 세어 「14건」이라 적던 자리 (' + pic.offB + '건)');
  is(pic.nurNone && pic.nurColor === '#CBD5E1', '담보가 없는 부위는 「준비된 담보가 없습니다」라고 말한다');
  is(pic.jnLen > 500, '치료 여정이 실제로 그려진다');

  /* ── 일당인가 목돈인가 · 네 갈래 · 그때 우리 집은 ── */
  console.log('\n[9-2] 일당을 목돈으로, 목돈을 일당으로 보지 않는가 (147억 사고)');
  const kind = await page.evaluate(() => {
    const covs = [__cov('k1', 'p1', '장기요양 급여', 20000000),
                  __cov('k2', 'p1', '간병인사용일당', 100000),
                  __cov('k3', 'p1', '질병입원일당', 30000),
                  __cov('k4', 'p1', '질병통원비', 300000),
                  __cov('k5', 'p1', '요양간병자금', 50000, '일당'),
                  __cov('k6', 'p1', '치매 진단·간병비', 10000000)];
    const scen = [{ id: 'n1', diseaseCategory: 'NURSING', diseaseCode: 'care_ltc',
                    scenarioName: '장기요양 재가 2년', referenceTreatmentCostWon: 48000000,
                    inpatientDays: 730, incomeGapMonths: 0,
                    purposes: ['NURSING', 'DIAGNOSIS', 'OUTPATIENT'], treatmentSteps: [],
                    sourceName: '시험', active: true }];
    __frSeed([__pol('p1', 50000, false)], covs, null, scen);
    const M = frMaster(), by = {}; M.forEach(m => by[m.id] = m);
    const r = frScenCalc(frScenActive()[0], M, 'before');
    return { ltc: by.k1.pay, nurse: by.k2.pay, hosp: by.k3.pay, out: by.k4.pay,
             byFreq: by.k5.pay, dementia: by.k6.pay,
             cover: r.coverWon, rate: Math.round(r.rate * 10) / 10 };
  });
  is(kind.ltc === 'LUMP', '장기요양 급여(목돈)를 일당으로 보지 않는다 — 730일을 곱해 147억이 되던 자리');
  is(kind.dementia === 'LUMP', '치매 진단·간병비도 목돈으로 본다');
  is(kind.nurse === 'DAILY' && kind.hosp === 'DAILY', '이름이 「일당」이라고 말하면 일당으로 본다');
  is(kind.byFreq === 'DAILY', '추출된 지급주기가 「일당」이면 이름이 달라도 일당으로 본다');
  is(kind.out === 'VISIT', '통원비는 1회당 한도다 — 입원일수를 곱하지 않는다');
  /* 목돈 2건 + 일당 2건(이름으로 잡힌 것 · 지급주기로 잡힌 것) — 통원비는 빠진다 */
  is(kind.cover === 20000000 + 10000000 + 100000 * 730 + 50000 * 730,
     '목돈은 그대로, 일당만 일수로 환산해 더한다 (' + kind.cover + '원)');
  is(kind.rate < 500, '준비 수준이 말이 되는 범위에 있다 (' + kind.rate + '% · 전에는 30796.9%)');

  console.log('\n[9-3] 네 갈래(암·뇌·심장·간병)와 「그때 우리 집은」');
  const care = await page.evaluate(() => {
    const mk = (cat, code, name, cost, months) => ({
      id: 's' + cat, diseaseCategory: cat, diseaseCode: code, scenarioName: name,
      referenceTreatmentCostWon: cost, incomeGapMonths: months,
      purposes: ['DIAGNOSIS', 'SURGERY', 'TREATMENT', 'NURSING'], treatmentSteps: [],
      sourceName: '시험', sourceDate: '2026-08', active: true });
    const scen = [mk('CANCER', 'cancer_general', '위암', 50000000, 6),
                  mk('BRAIN', 'brain_infarct', '뇌경색', 40000000, 9),
                  mk('HEART', 'heart_mi', '심근경색', 35000000, 3),
                  mk('NURSING', 'care_ltc', '장기요양', 48000000, 0)];
    const covs = [__cov('c1', 'p1', '일반암진단비', 30000000)];
    /* ① 소득·지출·가족이 <b>없을 때</b> — 만들어 내지 않는가 */
    const st0 = frBlankState();
    __frSeed([__pol('p1', 50000, false)], covs, st0, scen);
    FR.client = { birth_year: null, gender: null, monthly_income: null, monthly_fixed_expense: null };
    const bare = frCareHtml(frMaster());
    const r0 = frTrackCalc(FR_TRACKS[0], frMaster());
    /* ② 소득·지출·가족이 <b>있을 때</b> — 그 값으로 푸는가 */
    const st = frBlankState();
    st.prof = { dependents: 3, retireAge: 65, family: [{ rel: '배우자', age: 41 }, { rel: '자녀', age: 9 }] };
    __frSeed([__pol('p1', 50000, false)], covs, st, scen);
    const M = frMaster(), full = frCareHtml(M), r1 = frTrackCalc(FR_TRACKS[0], M);
    const nur = frTrackCalc(FR_TRACKS[3], M);
    return {
      tracks: (full.match(/치료 여정과 그때 우리 집/g) || []).length,
      hasCare: full.indexOf('간병 · 요양 — 치료 여정') >= 0,
      bareNoInvent: bare.indexOf('월 소득을 넣으시면') >= 0 && bare.indexOf('셈하지 않았습니다') >= 0,
      bareMonths: r0.payMonthsB,
      needWon: r1.needWon, living: r1.livingWon, self: r1.selfBeforeWon,
      payMonths: Math.round(r1.payMonthsB * 10) / 10,
      saysChild: full.indexOf('자녀</b>이 9세') >= 0 || full.indexOf('자녀 9세') >= 0,
      saysDep: full.indexOf('부양가족 <b>3인</b>') >= 0,
      nurZero: nur.months === 0 && full.indexOf('소득중단이 없는 것으로 설정') >= 0,
      stagesCancer: frTrackStages(FR_TRACKS[0]).length,
      stagesCare: frTrackStages(FR_TRACKS[3]).length
    };
  });
  is(care.tracks === 4 && care.hasCare, '암·뇌·심장·간병 <b>네 갈래</b>가 모두 선다 (' + care.tracks + '장)');
  is(care.stagesCancer >= 4 && care.stagesCare === 4,
     '암·뇌·심장 여정은 치료비 지급지도의 것을 <b>가져다 쓰고</b>, 간병만 여기 넷을 둔다');
  is(care.bareNoInvent && care.bareMonths === null,
     '소득·지출이 비면 <b>셈하지 않고</b> 무엇을 넣어야 하는지 적는다');
  is(care.living === 290 * 10000 * 6, '치료 기간의 <b>생활비</b>를 필요한 돈에 더한다 (' + care.living + '원)');
  is(care.needWon === 50000000 + 290 * 10000 * 6, '필요한 돈 = 기준 치료비 + 그동안의 고정지출');
  is(care.payMonths === Math.round(30000000 / 5500000 * 10) / 10,
     '보험금을 <b>월급 몇 달치</b>로 바꿔 말한다 (' + care.payMonths + '개월)');
  is(care.saysChild && care.saysDep, '부양가족 수와 <b>가장 어린 가족의 나이</b>를 문장에 쓴다');
  is(care.nurZero, '소득중단 0개월인 갈래는 「0개월을 메우고도」라고 말하지 않는다');

  /* ── 전후 비교 · 그 자리에서 고치기 · 비포&애프터에서 가져오기 ── */
  console.log('\n[9-4] 전후 비교 — 그 자리에서 고치고, 고친 것을 밝히는가');
  const ed = await page.evaluate(() => {
    __frSeed([__pol('p1', 50000, false)],
      [__cov('e1', 'p1', '일반암진단비', 30000000),
       __cov('e2', 'p1', '뇌출혈진단비', 10000000)]);
    frCellSet('e1', 'b', 50000000);
    frCellSet('e1', 'a', 80000000);
    let M = frMaster(), by = {}; M.forEach(m => by[m.id] = m);
    const fixed = { b: by.e1.bWon, a: by.e1.aWon, mb: by.e1.mb, ma: by.e1.ma };
    /* 빈 칸은 「그대로」 — 조정 후를 비우면 <b>현재 값</b>을 따라간다.
       현재를 손으로 5,000만으로 고쳐 두었으니 그대로도 5,000만이다. */
    frCellSet('e1', 'a', '');
    M = frMaster(); by = {}; M.forEach(m => by[m.id] = m);
    const blank = { a: by.e1.aWon, ma: by.e1.ma };
    /* 현재까지 비우면 <b>추출값</b>으로 돌아온다 — 고친 것을 되돌릴 수 있어야 한다 */
    frCellSet('e1', 'b', '');
    M = frMaster(); by = {}; M.forEach(m => by[m.id] = m);
    const undone = { b: by.e1.bWon, a: by.e1.aWon, mb: by.e1.mb };
    frCellSet('e1', 'b', 50000000);   /* 아래 세는 자리 시험을 위해 되돌린다 */
    frAddRow();
    const st = frState(), row = st.add[st.add.length - 1];
    frAddSet(row.id, 'name', '표적항암약물허가치료비');
    frCellSet(row.id, 'a', 20000000);
    M = frMaster();
    const T = frCounts(M);
    const added = M[M.length - 1];
    const doc = frBaPageHtml(M, T);
    return {
      fixed: fixed, blank: blank, undone: undone,
      addName: added.raw, addKey: added.key, addA: added.aWon, addB: added.bWon, hand: added.hand,
      extracted: T.extracted, addedN: T.added, report: T.report, lost: T.lost, edited: T.edited,
      inputs: (doc.match(/class="fr-in/g) || []).length,
      prints: (doc.match(/class="fr-pr"/g) || []).length,
      noSlice: doc.indexOf('상위 몇 개로 자르지 않았습니다') >= 0
    };
  });
  is(ed.fixed.b === 50000000 && ed.fixed.a === 80000000, '표에서 고친 값이 <b>마지막 말</b>이다 — 앱이 덧칠하지 않는다');
  is(ed.fixed.mb === 1 && ed.fixed.ma === 1, '고친 칸에 「손」 딱지가 붙는다 — 조용히 바뀌지 않는다');
  is(ed.blank.a === 50000000 && ed.blank.ma === 0,
     '조정 후를 비우면 <b>「그대로」</b> — 0 이 아니라 현재 값을 따라간다 (' + ed.blank.a + ')');
  is(ed.undone.b === 30000000 && ed.undone.a === 30000000 && ed.undone.mb === 0,
     '현재까지 비우면 <b>추출값으로 돌아온다</b> — 고친 것을 되돌릴 수 있다 (' + ed.undone.b + ')');
  is(ed.addKey === 'anti_target' && ed.addA === 20000000, '손으로 더한 담보도 <b>사전으로 분류</b>된다');
  is(ed.hand === 1 && ed.addB === null, '손으로 더한 담보는 「손으로 적음」으로 서고, 안 적은 칸은 null 이다');
  is(ed.extracted === 2 && ed.addedN === 1 && ed.report === 3 && ed.lost === 0,
     '추출 ' + ed.extracted + ' + 손으로 적음 ' + ed.addedN + ' = 보고서 ' + ed.report + ' (어긋남 0)');
  is(ed.edited === 1, '손으로 고친 <b>추출값</b>만 따로 센다 (손으로 더한 줄은 안 센다)');
  is(ed.inputs >= 6 && ed.prints >= 6, '칸마다 <b>입력칸과 인쇄용 글자</b>를 함께 낸다 — 종이에서 숫자가 살아 있어야 한다');
  is(ed.noSlice, '전후 비교가 상위 몇 개로 자르지 않는다고 밝힌다');

  console.log('\n[9-5] 비포&애프터에서 가져오기 — 만원을 원으로, 겹치면 말한다');
  const bridge = await page.evaluate(() => {
    __frSeed([__pol('p1', 50000, false)], [__cov('b1', 'p1', '암주요치료비', 8000000)]);
    if (typeof BABA === 'undefined') return { no: 1 };
    BABA.rows = [{ k: 'cantx', n: '암주요치료비', b: 1000, a: 1000 },
                 { k: 'teeth', n: '치아·치과', b: 100, a: 300 }];
    BABA.plans = [];
    const first = frFromBaba();
    let M = frMaster(), T = frCounts(M);
    const dup1 = T.dup;
    const teeth = M.filter(m => m.raw === '치아·치과')[0];
    const again = frFromBaba();
    M = frMaster(); T = frCounts(M);
    return { no: 0, first: first, again: again, added: T.added, report: T.report, lost: T.lost,
             dup: dup1, teethB: teeth.bWon, teethA: teeth.aWon, teethKey: teeth.key,
             from: teeth.from, src: teeth.src };
  });
  is(!bridge.no, '비포&애프터 자리가 있다');
  is(bridge.teethB === 100 * 10000 && bridge.teethA === 300 * 10000,
     '<b>만원 → 원</b> 으로 바꿔 가져온다 (' + bridge.teethB + '원) — 여기서 틀리면 만 배가 틀린다');
  is(bridge.teethKey === 'etc_dental', '가져온 이름을 <b>같은 사전</b>으로 분류한다 — 열쇠 대응표를 두 벌 두지 않는다');
  is(bridge.from === '비포&애프터' && bridge.src === '',
     '어디서 왔는지는 from 에, 원문 조각은 src 에 — <b>이름이 거짓말하지 않는다</b>');
  is(bridge.first === 2 && bridge.again === 0 && bridge.added === 2,
     '두 번 눌러도 <b>두 벌이 되지 않는다</b> (처음 ' + bridge.first + ' · 다시 ' + bridge.again + ')');
  is(bridge.lost === 0, '가져온 뒤에도 세는 자리가 맞는다');
  is(bridge.dup === 1, '이미 추출된 담보와 겹치면 <b>조용히 합치지도 버리지도 않고</b> 말한다');


  /* ── 읽기 점검 — 못 읽은 것을 말하는가 ── */
  console.log('\n[9-6] 읽기 점검 — 「왜 부분 추출인지」를 말하는가');
  const rd = await page.evaluate(() => {
    __frSeed([__pol('p1', 50000, false)],
      [__cov('r1', 'p1', '일반암진단비', 30000000),
       __cov('r2', 'p1', '깨끗한하늘특약', 2000000),      /* 분류 실패 */
       __cov('r3', 'p1', '항암방사선치료비')]);
    FR.covs[2].source_text='항암방사선치료비 확인불가';FR.covs[1].source_text='깨끗한하늘특약 200만';            /* 금액 실패 */
    FR.pols[0].source_document_id = 'd1';
    FR.docs = [
      { id: 'd1', file_name: '보장분석리포트.pdf', page_count: 12, parse_status: 'partial' },
      { id: 'd2', file_name: '스캔증권.pdf', page_count: 6, parse_status: 'failed' },
      { id: 'd3', file_name: '아직안읽음.pdf', page_count: 3, parse_status: 'pending' }];
    FR.runs = { d1: { document_id: 'd1', validation_errors: ['출처(page) 없는 금액 담보 4건 — 검수 필요.', '표기 월보험료와 담보 합계가 불일치 — 검수 필요.'] } };
    FR.imgPages = 5;
    FR.readAt = FR.cid; FR.readBusy = false; FR.readErr = '';
    const M = frMaster(), T = frCounts(M);
    const h = frReadHtml(M, T);
    const t1 = frDocTally('d1');
    return {
      why: h.indexOf('출처(page) 없는 금액 담보 4건') >= 0,
      mismatch: h.indexOf('표기 월보험료와 담보 합계가 불일치') >= 0,
      failed: h.indexOf('이 문서에서는 아무것도 못 읽었습니다') >= 0,
      pending: h.indexOf('아직 <b>담보 추출</b>을 실행하지 않았습니다') >= 0,
      img: h.indexOf('그림으로 읽은 쪽이 5쪽') >= 0,
      uncls: h.indexOf('분류를 못 한 담보 1건') >= 0,
      noAmt: h.indexOf('금액을 못 읽은 담보 1건') >= 0,
      honest: h.indexOf('모르는 것을 셀 수는 없기 때문입니다') >= 0,
      docPols: t1.pols, docCovs: t1.covs,
      srcBtn: (h.match(/원문보기/g) || []).length,
      srcText: h.indexOf('항암방사선치료비 ') >= 0,
      docs3: (h.match(/fr-rd-doc/g) || []).length
    };
  });
  is(rd.why && rd.mismatch, '「부분 추출」의 <b>이유</b>를 그대로 적는다 — 저장만 되고 안 보이던 값이다');
  is(rd.failed, '아무것도 못 읽은 문서는 <b>무엇을 해야 하는지</b>까지 말한다');
  is(rd.pending, '아직 안 읽은 문서를 「읽었다」고 하지 않는다');
  is(rd.img, '글자가 없어 <b>그림으로 읽은 쪽</b>이 몇 쪽인지 말한다');
  is(rd.uncls && rd.noAmt, '분류 못 한 담보와 금액 못 읽은 담보를 <b>그 자리에서</b> 고치게 한다');
  is(rd.honest, '<b>셀 수 없는 것</b>을 셀 수 있는 척하지 않는다 — 원문에 있는데 안 잡힌 담보');
  is(rd.docPols === 1 && rd.docCovs === 3, '문서마다 <b>몇 건이 나왔는지</b> 센다');
  is(rd.docs3 === 3, '문서 3건이 모두 선다 — 실패한 것도 숨기지 않는다');
  is(rd.srcBtn >= 2, '못 읽은 담보마다 <b>원문보기</b>가 붙는다 — 원문 조각이 살아 있어야 나온다 (' + rd.srcBtn + '개)');

  console.log('\n[9-7] 읽기 점검은 서버를 아껴 쓰는가 (CLAUDE.md 7번)');
  const lazy = await page.evaluate(() => {
    const src = frLoad.toString() + frGo.toString();
    return {
      notInLoad: src.indexOf('extraction_runs') < 0 && src.indexOf('document_pages') < 0,
      lazyGuard: /read.*readAt\s*!==\s*FR\.cid/.test(frGo.toString()),
      headCount: frReadLoad.toString().indexOf("head:true") >= 0
    };
  });
  is(lazy.notInLoad, '고객을 열 때는 <b>안 부른다</b> — 안 보는 화면이 서버를 갉아먹지 않게');
  is(lazy.lazyGuard, '탭을 여실 때 <b>한 번만</b> 부르고 그 뒤엔 담아 둔 것을 쓴다');
  is(lazy.headCount, '그림으로 읽은 쪽은 <b>세기만</b> 한다 — 쪽 원문을 다 받아 오지 않는다');


  /* ── 인쇄 ── */
  console.log('\n[10] 종이 — 어긋난 채로 뽑지 않고, 우리가 다시 읽을 수 있는가');
  const print = await page.evaluate(() => {
    __frSeed([__pol('p1', 50000, false)], [__cov('c1', 'p1', '일반암진단비', 30000000)]);
    const M = frMaster(), T = frCounts(M);
    FR.built = { M: M, T: { ...T, lost: 2 } };
    let printed = false; const real = window.print; window.print = () => { printed = true; };
    frPrint();                       /* 어긋난 상태 → 여기서 멈춰야 한다 */
    window.print = real;
    /* CSS 는 따로 올려 놓고 본다 — frPrint 가 멈추면 CSS 도 안 올라와,
       빈 문자열에서 「tnum 없음」이 통과하는 헛알람이 났다 (CLAUDE.md 8번) */
    frCssMount();
    const css = (document.getElementById('frCss') || {}).textContent || '';
    return { blocked: !printed, cssLen: css.length,
             tnum: /tnum/.test(css),
             reflow: css.indexOf('.fr-tri{grid-template-columns:repeat(3,1fr)!important}') >= 0,
             avoid: css.indexOf('page-break-inside:avoid') >= 0 };
  });
  is(print.cssLen > 2000, '풀리포트 CSS 가 실제로 올라온다 (' + print.cssLen + '자)');
  is(print.blocked, '담보가 어긋나면 저장(인쇄)을 멈춘다');
  is(!print.tnum, 'tnum 을 켜지 않는다 — 켜면 우리가 뽑은 PDF 를 우리가 못 읽는다');
  is(print.reflow, 'A4 안쪽 폭(718px)에서 「한 줄로 풀기」가 먹지 않게 종이에서 칸을 되돌린다');
  is(print.avoid, '카드가 쪽 중간에서 잘리지 않는다');

  /* ── 판단을 AI 에게 넘기지 않는가 (요구사항 27번) ── */
  console.log('\n[11] 이 화면은 AI 에게 판단을 시키지 않는가');
  /* 이 모듈이 서 있는 <b>구간만</b> 잘라서 본다. 파일 끝까지 보면 다른 화면의
     AI 호출이 걸려 헛알람이 난다 — 실제로 그렇게 났다 (CLAUDE.md 8번). */
  const frFrom = CODE.indexOf('var FR_PUR='), frTo = CODE.indexOf('function osSubmitFeedback');
  is(frFrom > 0 && frTo > frFrom, '풀리포트 모듈 구간을 찾을 수 있다');
  const frAll = CODE.slice(frFrom, frTo);
  is(!/callAI\s*\(|callAIVision\s*\(/.test(frAll), '풀리포트 안에서 AI 를 부르지 않는다');
  is(/function frSay/.test(frAll), '고객 문구는 규칙(frSay)이 만든다');
  is(!/generateContent|api\/gemini|anthropic/.test(frAll), '이 모듈은 LLM API 를 새로 붙이지 않는다');

  /* ── 입구를 하나로 — 메뉴에서 빼되 화면은 죽이지 않는다 ── */
  console.log('\n[12] 비포&애프터 — 목록에서만 빠지고 화면은 사는가');
  const menu = await page.evaluate(() => {
    var inMenu = false;
    TABS.forEach(function (g) { (g.items || []).forEach(function (it) { if (it.id === 'baba') inMenu = true; }); });
    var grp = (typeof OS_TAB_GROUP !== 'undefined') ? OS_TAB_GROUP['baba'] : null;
    var groupExists = TABS.some(function (g) { return (g.key || g.group) === grp; });
    var allowed = (typeof osTabAllowed === 'function') ? osTabAllowed('baba') : null;
    /* 실행 체크판이 아직 이 화면을 가리키는가 — 가리키는데 죽으면 없는 화면을 여는 단추가 된다 */
    var ck = false;
    try { RT_STEP.forEach(function (s) { s.rows.forEach(function (r) { if (r.tab === 'baba') ck = true; }); }); } catch (e) { }
    try { go('baba'); } catch (e) { }
    return { inMenu: inMenu, grp: grp, groupExists: groupExists, allowed: allowed, ck: ck };
  });
  await page.waitForTimeout(800);
  const opened = await page.evaluate(() => {
    var d = document.getElementById('dynPane') || document.getElementById('main');
    var t = (d && d.innerText) || '';
    return { shown: t.indexOf('비포') >= 0 || t.indexOf('애프터') >= 0, len: t.length };
  });
  is(menu.inMenu === false, '왼쪽 목록에서 빠졌다 — 같은 일을 두 곳에서 묻지 않는다');
  is(menu.grp === '증권 분석' && menu.groupExists,
     '「메뉴엔 없지만 살아 있는 화면」으로 <b>OS_TAB_GROUP</b> 에 적혀 있다 — 목록을 두 벌로 만들지 않는다');
  is(menu.allowed === true, '권한 판정이 원래 칸을 따라 열려 있다 (osTabAllowed)');
  is(menu.ck === true && opened.shown,
     "실행 체크판이 가리키는 화면이 go('baba') 로 <b>실제로 열린다</b> (" + opened.len + '자)');
  is(/frOpenBaba/.test(CODE) && /frFromBaba/.test(CODE),
     '풀리포트 안에 들어가는 길(🔄 빠른 비포&애프터)과 가져오는 길이 둘 다 있다');


  is(errs.length === 0, '화면을 여는 동안 오류가 나지 않는다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '군데가 걸렸습니다.' : '풀리포트 점검 통과 — 읽어 낸 담보가 하나도 사라지지 않습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
