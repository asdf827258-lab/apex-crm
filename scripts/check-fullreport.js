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
    window.__cov = function (id, pid, name, amount) {
      return { id: id, policy_id: pid, original_name: name, normalized_name: null, category: null,
               amount: (amount === undefined ? null : amount), unit: 'KRW', payment_frequency: null,
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
    const body = frBodyHtml(M), charts = frChartsHtml(M), jn = frJourneyHtml(M);
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

  is(errs.length === 0, '화면을 여는 동안 오류가 나지 않는다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '군데가 걸렸습니다.' : '풀리포트 점검 통과 — 읽어 낸 담보가 하나도 사라지지 않습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
