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
                  __cov('c6', 'p1', '골절진단비', 1000000),
                  __cov('c8', 'p1', '질병입원의료비', 50000000)];
    const st = frBlankState(); st.pact = { p2: 'NEW' };
    __frSeed([__pol('p1', 50000, false), __pol('p2', 30000, false)], covs, st, scen);
    const M = frMaster();
    const body = frBodyHtml(M), charts = frChartsHtml(M), jn = frStepsTableHtml(frScenActive()[0], M);
    const B = frStepCalc(frScenActive()[0], M, 'before');
    const sc = frScenCalc(frScenActive()[0], M, 'before');
    return {
      bodySvg: /<svg/.test(body),
      reuse: body.indexOf('baba-body-grid') >= 0,
      cols: (body.indexOf('권장') >= 0) && (body.indexOf('기존') >= 0) && (body.indexOf('신규') >= 0),
      man: body.indexOf('3,000') >= 0,          /* 3,000만원 — 원을 만원으로 옮겼는가 */
      recNote: body.indexOf('권장</b> 열') >= 0,
      /* 하루 3만원(일당)과 한도 5,000만원(실손)이 한 칸에 더해지면 5,003 이 된다 */
      mixed: (function(){
        /* 안내문이 아니라 <b>표 칸</b>만 본다 — 글자 뭉치째 뒤지면 내 설명글도 값으로 읽힌다.
           body 는 아직 화면에 없으니 <b>여기서 세운다.</b> */
        var d=document.createElement('div');d.innerHTML=body;
        var g=d.querySelectorAll('td'),i;
        if(!g.length)return 'td없음';
        for(i=0;i<g.length;i++)if(g[i].textContent.indexOf('5,003')>=0)return true;
        return false;
      })(),
      offNote: body.indexOf('지급 방식이 칸과 달라') >= 0,
      slotKinds: [frBodySlotKind('inpD'), frBodySlotKind('silD'), frBodySlotKind('cancer'), frBodySlotKind('outC')].join(','),
      /* 치료 여정도 지급지도의 것을 그대로 쓰는가 */
      /* 함수만 재면 안 된다 — <b>갈래 한 장</b>을 실제로 그려 본다 */
      trackPage: (function(){
        var MM = frMaster();
        var pg = frTrackPageHtml(frTrackCalc(FR_TRACKS[0], MM), MM);
        return { tj: pg.indexOf('tj-step') >= 0, wallet: pg.indexOf('여러 개의 지갑') >= 0 };
      })(),
      /* 골절진단비(100만)가 암 사건 <b>셈</b>에 섞여 들어오지 않는가 */
      scenCoverB: frScenCalc(frScenActive()[0], frMaster(), 'before').coverWon,
      catOff: [frCatOff('FRACTURE','CANCER'), frCatOff('SURGERY','CANCER'), frCatOff('CANCER','CANCER'), frCatOff('SILSON','BRAIN')].join(','),
      tpReuse: (function(){
        var r = frTrackCalc(FR_TRACKS[0], frMaster());
        var m = frTpMapHtml(r, frMaster());
        var d = document.createElement('div'); d.innerHTML = m;
        var seg = m.indexOf('여러 개의 지갑') >= 0;
        var x = frTpCov(r, frMaster(), frTpDis(FR_TRACKS[0]));
        return { has: m.indexOf('tj-step') >= 0, wallet: seg,
                 noSilbi: x.cov.silbi === 0, actNote: m.indexOf('금액으로 바꾸지 않았습니다') >= 0,
                 /* 하루치를 목돈 칸에 넣지 않았는가 — 일당은 제 칸(perDay)으로 */
                 perDay: x.cov.perDay, diag: x.cov.diag,
                 /* 지급지도 화면은 건드리지 않았는가 */
                 plain: tpBody().indexOf('내 보장 입력') >= 0 && tpBody().indexOf('tp-dis') >= 0 };
      })(),

      step01: B[0].coverWon, step01off: B[0].off,
      step03: B[1].coverWon, step03daily: B[1].daily,
      step04unk: B[2].unknown, step04pend: B[2].pend,
      scenPend: sc.pend.length, scenUnk: sc.unknown.length,
      chartsHasActual: charts.indexOf('실손') >= 0,
      jnLen: jn.length
    };
  });
  is(pic.bodySvg && pic.reuse,
     '인체 그림을 <b>새로 그리지 않고</b> 비포&애프터의 것을 그대로 쓴다 (baba-body-grid)');
  is(pic.cols, '권장 · 기존 · 신규 <b>세 열</b>이 원본 그대로 선다');
  is(pic.man, '원을 <b>만원</b>으로 옮겨 그림에 넣는다 — 그림은 만원으로 그린다 (3,000)');
  is(pic.recNote, '<b>권장</b> 열이 어디서 왔는지(또는 왜 비었는지) 밝힌다');
  is(pic.catOff === 'true,false,false,false',
     '<b>큰 묶음</b>도 사건 자로 본다 — 골절진단비는 암 사건에 안 열리고, 수술·실손은 두루 열린다');
  is(pic.scenCoverB === 30000000,
     '방어력 셈에서 <b>골절진단비 100만원이 빠진다</b> — 암 진단비 3,000만원만 남는다 (' + pic.scenCoverB + '원)');
  is(pic.trackPage.tj && pic.trackPage.wallet && pic.tpReuse.has,
     '치료 여정을 <b>새로 그리지 않고</b> 치료비 지급지도의 것을 그대로 쓴다 — <b>갈래 한 장에 실제로 서는지</b>까지 본다');
  is(pic.tpReuse.noSilbi && pic.tpReuse.actNote,
     '실손 보전율을 <b>짐작해 넣지 않는다</b> — 몇 건인지만 말한다');
  is(pic.tpReuse.perDay === 3 && pic.tpReuse.diag === 3000,
     '일당은 <b>제 칸(하루 얼마)</b>으로, 목돈은 목돈 칸으로 간다 (일당 '+pic.tpReuse.perDay+'만 · 진단 '+pic.tpReuse.diag+'만)');
  is(pic.tpReuse.plain,
     '치료비 지급지도 화면은 <b>한 글자도 달라지지 않는다</b> — 입력칸도 질병 단추도 그대로');
  is(pic.slotKinds === 'DAILY,ACTUAL,LUMP,DAILY',
     '칸마다 <b>무엇을 담는 칸인지</b>를 안다 (' + pic.slotKinds + ')');
  is(pic.mixed === false,
     '하루치와 목돈을 <b>한 칸에 더하지 않는다</b> — 일당 3만 + 실손 5,000만 = 「5,003만」 이 되던 자리');
  is(pic.step01 === 30000000 && pic.step01off === 1,
     '단계 계산도 사건 자를 쓴다 — 위암 「진단」에 유사암을 더하지 않는다 (' + pic.step01 + '원)');
  is(pic.step03 === 30000 * 21 && pic.step03daily === 1, '일당 단계는 입원일수로 환산하고 그 사실을 남긴다');
  is(pic.step04unk === 0 && pic.step04pend === 1,
     '신규 제안 담보를 「금액 확인 필요」가 아니라 「조정 후에만」으로 가른다');
  is(pic.scenPend === 1 && pic.scenUnk === 1, '방어력 계산도 「못 읽음」과 「아직 없음」을 가른다');
  /* 부위 카드(frRegion·FR_BODY)는 걷어냈다 — 인체 한 장을 비포&애프터의 원본으로
     바꾸면서 아무 데서도 안 그려지는 옛 판이 되었다. 그리지 않는 것을 점검이
     붙들고 있으면 「보고 있다」는 착각만 남는다 (CLAUDE.md 5번). */
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


  /* ── [9-8] 🔀 전 · 후 만들기 ─────────────────────────────────────
     왼쪽에서 해지를 누르면 오른쪽이 <b>그 자리에서</b> 무엇이 비는지 말하는가.
     그리고 금액을 못 읽은 담보가 <b>조용히 빠지지</b> 않는가.            */
  console.log('\n[9-8] 전 · 후 만들기 — 누르면 그 자리에서 말하는가');
  const mkS = await page.evaluate(() => {
    const covs = [__cov('a1', 'p1', '뇌출혈진단비', 10000000),
                  __cov('d1', 'p1', '간병인사용일당', 100000),
                  __cov('a2', 'p1', '항암방사선치료비'),          /* 금액 못 읽음 */
                  __cov('b1', 'p2', '일반암진단비', 30000000)];
    __frSeed([__pol('p1', 50000, false), __pol('p2', 30000, false)], covs, frBlankState(), []);

    /* ① 아무것도 안 눌렀을 때 — 비는 자리는 없어야 한다 */
    const zero = frMakeDiff(frMaster());

    /* ② 계약 하나를 해지 */
    frState().pact['p1'] = 'CANCEL';
    const M = frMaster();
    const D = frMakeDiff(M);
    const html = frMakeHtml(M);

    /* ③ 담보 하나만 해지 */
    frState().pact = {};
    frState().cact['b1'] = 'CANCEL';
    const D2 = frMakeDiff(frMaster());

    /* ④ 조정 후 금액을 직접 적으면 채우는 자리로 */
    frState().cact = {};
    frState().cadjWon['a1'] = 50000000;
    const D3 = frMakeDiff(frMaster());
    frState().cadjWon = {};

    return {
      zeroLoss: zero.loss.length, zeroGain: zero.gain.length,
      lossN: D.loss.length, lossWon: D.loss.length ? D.loss[0].won : null,
      unknownN: D.lostUnknown.length,
      say: D.loss.length ? frMakeSay(D.loss[0]) : '',
      headCount: html.indexOf('2+1건') >= 0,
      unkNote: html.indexOf('금액을 못 읽은 담보 <b>1건</b>도 함께 사라집니다') >= 0,
      zeroWord: html.indexOf('0원이라는 뜻이 아닙니다') >= 0,
      covLoss: D2.loss.length, covWon: D2.loss.length ? D2.loss[0].won : null,
      gainN: D3.gain.length, gainWon: D3.gain.length ? D3.gain[0].won : null,
      body: html.indexOf('baba-body-grid') >= 0,
      prem: html.indexOf('월 보험료 · 지금') >= 0,
      /* 하루치를 목돈처럼 말하지 않는가 */
      daily: (function(){
        frState().cadjWon['d1'] = 150000;
        var D = frMakeDiff(frMaster());
        var g = D.gain.filter(function(x){return x.m.id==='d1';})[0];
        frState().cadjWon = {};
        return g ? frMoneyBy(g.m, g.won) : '없음';
      })()
    };
  });
  is(mkS.zeroLoss === 0 && mkS.zeroGain === 0,
     '아무것도 안 눌렀으면 <b>비는 자리도 채우는 자리도 없다</b>');
  is(mkS.lossN === 2 && mkS.lossWon === 10000000,
     '계약을 해지하면 그 담보가 <b>비는 자리</b>로 선다 (' + mkS.lossWon + '원)');
  is(mkS.say.indexOf('뇌출혈') >= 0 && mkS.say.indexOf('1,000만원') >= 0,
     '무엇이 비는지 <b>그 자리에서 말한다</b> — ' + mkS.say.replace(/<[^>]*>/g, ''));
  is(mkS.unknownN === 1 && mkS.unkNote && mkS.zeroWord,
     '금액을 <b>못 읽은 담보도 사라진다고 말한다</b> — 조용히 빼지 않고, 0원이라 하지도 않는다');
  is(mkS.headCount,
     '「비는 자리」 머리에 <b>못 읽은 건수까지</b> 적는다 (2+1건)');
  is(mkS.covLoss === 1 && mkS.covWon === 30000000,
     '담보 하나만 해지해도 <b>그 담보만</b> 빈다 (' + mkS.covWon + '원)');
  is(mkS.gainN === 1 && mkS.gainWon === 40000000,
     '조정 후 금액을 직접 적으면 <b>채우는 자리</b>로 선다 — 1,000만 → 5,000만이면 4,000만 (' + mkS.gainWon + '원)');
  is(mkS.daily === '하루 5만원',
     '하루치를 <b>목돈처럼 말하지 않는다</b> — 「5만원 늘어납니다」가 아니라 「' + mkS.daily + '」');
  is(mkS.body && mkS.prem,
     '한 화면에 <b>월 보험료 전·후</b>와 <b>인체 한 장</b>이 같이 서서 누를 때마다 다시 그려진다');

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
    /* 목록에 서 있는가(hide 를 거른 뒤) 와 TABS 에 살아 있는가는 다른 물음이다 */
    var listed = false, entry = null;
    TABS.forEach(function (g) {
      (g.items || []).forEach(function (it) {
        if (it.id !== 'baba') return;
        entry = { hide: !!it.hide, ak: it.ak };
        if (!g.hide && !it.hide) listed = true;
      });
    });
    /* 권한은 <b>같은 칸의 형제와 견준다.</b> 이 시험은 로그인하지 않은 free 등급이라
       증권 분석 칸이 통째로 막혀 있다 — 절대값으로 보면 헛알람이 난다.
       봐야 할 것은 <b>hide 가 권한을 바꾸지 않았는가</b> 다. */
    var A = (typeof osTabAllowed === 'function');
    var allowed = A ? osTabAllowed('baba') : null;
    var sibling = A ? osTabAllowed('bojang') : null;
    /* 실행 체크판이 아직 이 화면을 가리키는가 — 가리키는데 죽으면 없는 화면을 여는 단추가 된다 */
    var ck = false;
    try { RT_STEP.forEach(function (s) { s.rows.forEach(function (r) { if (r.tab === 'baba') ck = true; }); }); } catch (e) { }
    try { go('baba'); } catch (e) { }
    return { listed: listed, entry: entry, allowed: allowed, sibling: sibling, ck: ck };
  });
  await page.waitForTimeout(800);
  const opened = await page.evaluate(() => {
    var d = document.getElementById('dynPane') || document.getElementById('main');
    var t = (d && d.innerText) || '';
    return { shown: t.indexOf('비포') >= 0 || t.indexOf('애프터') >= 0, len: t.length, err: 0 };
  });
  is(menu.listed === false, '왼쪽 목록에는 안 선다 — 같은 일을 두 곳에서 묻지 않는다');
  is(!!(menu.entry && menu.entry.hide), '<b>TABS 에 hide 로 남아 있다</b> — 지우지 않는다(teamhub 와 같은 방식). 메뉴 찾기·음성·주소로 그대로 열린다');
  is(menu.entry && menu.entry.ak === '보장분석', '권한 열쇠(ak)를 그대로 들고 있다 — 등급·권한이 안 바뀐다');
  is(menu.allowed === menu.sibling,
     'hide 가 <b>권한을 바꾸지 않는다</b> — 같은 칸의 AI 보장분석과 판정이 같다 (' + menu.allowed + ')');
  is(menu.ck === true, '실행 체크판이 아직 이 화면을 가리킨다 — 가리키는데 지우면 없는 화면을 여는 단추가 된다');
  is(opened.len > 0 && opened.err === 0,
     "go('baba') 가 <b>말없이 죽지 않는다</b> — 무엇이든 그려 준다 (" + opened.len + '자)');
  is(/frOpenBaba/.test(CODE) && /frFromBaba/.test(CODE),
     '풀리포트 안에 들어가는 길(🔄 빠른 비포&애프터)과 가져오는 길이 둘 다 있다');


  /* ── 메뉴에서 바로 들어가기 · 관리자 칸의 돈 ── */
  console.log('\n[13] 「보장분석 전&후 만들기」 — 메뉴에서 그 자리로 바로 가는가');
  const mk = await page.evaluate(() => {
    var it = null, grp = null;
    TABS.forEach(function (g) {
      (g.items || []).forEach(function (x) { if (x.id === 'frmake') { it = x; grp = g.group; } });
    });
    /* 고객을 보던 중이면 그 고객 상세로, 아니면 목록으로 — 둘 다 clients 화면이다 */
    OSC.current = { id: 'c1', name_masked: '홍○동' };
    OSC.view = 'list';
    var went = '';
    var realGo = window.go;
    window.go = function (t) { went = t; };
    try { frMakeGo(); } catch (e) { went = 'ERR:' + e.message; }
    var view1 = OSC.view, page1 = FR.page;
    OSC.current = null; OSC.view = 'detail';
    var went2 = '';
    window.go = function (t) { went2 = t; };
    try { frMakeGo(); } catch (e) { went2 = 'ERR:' + e.message; }
    var view2 = OSC.view;
    window.go = realGo;
    return { has: !!it, grp: grp, ak: it && it.ak, title: it && it.title, hide: !!(it && it.hide),
             went: went, view1: view1, page1: page1, went2: went2, view2: view2 };
  });
  is(mk.has, '메뉴에 「' + (mk.title || '?') + '」 가 있다 (' + mk.grp + ' 칸)');
  is(mk.grp === '증권 분석' && mk.hide === false, '증권 분석 칸에 <b>보이게</b> 선다');
  is(mk.ak === '고객', "권한 열쇠는 <b>실제로 여는 화면</b>(고객) 것을 쓴다 — 못 여는 사람에게 단추만 보이지 않게");
  is(mk.went === 'clients' && mk.view1 === 'detail',
     '보던 고객이 있으면 <b>그 고객 상세</b>로 간다 (' + mk.went + '/' + mk.view1 + ')');
  is(mk.went2 === 'clients' && mk.view2 === 'list',
     '보던 고객이 없으면 <b>고객 목록</b>으로 간다 — 목록을 두 벌로 만들지 않는다');
  /* 메뉴 이름이 「전&후 만들기」다 — 리포트가 아니라 <b>만드는 화면</b>이 열려야 한다 */
  is(mk.page1 === 'make', '메뉴가 데려간 자리에서 <b>전·후 만들기</b> 화면이 펴져 있다');

  console.log('\n[13-1] 관리자 칸의 돈 — 0 을 잘못 세지 않게 읽어 주는가');
  const rd2 = await page.evaluate(() => {
    OS.cfg = OS.cfg || {};
    OS.cfg.fr_scenarios = JSON.stringify([{
      id: 'z1', diseaseCategory: 'CANCER', diseaseCode: 'cancer_general',
      scenarioName: '시험', referenceTreatmentCostWon: 50000000,
      purposes: ['DIAGNOSIS'], sourceName: '시험', active: true,
      treatmentSteps: [{ no: '01', name: '진단', keys: ['cancer_gen'], costWon: 5000000 },
                       { no: '02', name: '수술', keys: ['surg_dz'], costWon: null }]
    }]);
    var h = frScenAdminHtml();
    /* 글자만 찾으면 <b>헛통과</b>한다 — 단계 합 문구에도 「5,000만원」이 들어 있어서,
       칸 밑의 되읽기를 떼도 그대로 지나갔다. 되읽기 칸(fr-rd)을 <b>세어야</b> 한다.
       기준 치료비 1 + 단계 2 = 3 개 (CLAUDE.md 8번 — 안 우는 알람은 알람이 아니다). */
    return { rdCount: (h.match(/class="fr-rd"/g) || []).length,
             readCost: h.indexOf('5,000만원') >= 0,
             readStep: h.indexOf('500만원') >= 0,
             sumNote: h.indexOf('단계 합') >= 0,
             noAuto: h.indexOf('자동으로 맞추지 않습니다') >= 0,
             unsetNote: h.indexOf('미설정 단계 1개는 빼고 더했습니다') >= 0 };
  });
  is(rd2.rdCount === 3 && rd2.readCost && rd2.readStep,
     '기준 치료비 1 + 단계 2 = <b>돈 칸 3개 모두</b> 사람이 읽는 금액으로 되읽어 준다 (' + rd2.rdCount + '개)');
  is(rd2.sumNote && rd2.noAuto,
     '단계 합이 기준과 다르면 말하되 <b>자동으로 맞추지 않는다</b> — 넣으신 값이 마지막 말이다');
  is(rd2.unsetNote, '미설정 단계는 <b>0 으로 세지 않고</b> 뺀 사실을 적는다');


  is(errs.length === 0, '화면을 여는 동안 오류가 나지 않는다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '군데가 걸렸습니다.' : '풀리포트 점검 통과 — 읽어 낸 담보가 하나도 사라지지 않습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
