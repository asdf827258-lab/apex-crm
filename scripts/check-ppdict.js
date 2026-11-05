/* 📚 제안서 담보 이름을 담보사전 기준으로 정확히 읽는가 (판 X352)

   사장님 말씀 2026-11-05 「제안서 추가 입력하는거 제대로 확인해서 모든 치료비등을 이해할수 있도록 만들어 — 담보사전에 있는 담보부터
   암치료비, 암생활비, 순환계치료비, 순환계생활비, 암주요치료비/비급여암주요치료비 … 이름이 다를수 있어서, 추가 제안서가 회사마다
   다르다 보니 정확하게 뽑아내서 읽는 것이 중요해」.

     1. 회사마다 다른 담보 이름 표(아래 NAMES) — 줄마다 들어갈 칸(k)과 담보사전 id(d)가 맞는가.
        ★ 실제 제안서 8부(이 PC 안에서만 시험 · 저장소에 안 넣음)에서 틀리던 이름을 그대로 넣었다 —
          특정순환계질환 통합치료비 · 신특정순환계질환 통합치료비Plus · 간호·간병통합서비스 · 심장질환(특정I·II) ·
          장기요양(1~2등급) 진단 · 80%이상 후유장해 · 가족화재벌금 · 갑상선암 및 기타피부암 직접치료.
     2. 표준표에 새 칸 여섯(뇌혈관 · 심혈관 · 순환계 주요치료비 · 특정 심장질환 · 간호간병통합 일당 · 장기요양 진단비)이 서고,
        그 병의 받는 돈에 들어간다(순환계 주요치료비는 뇌 · 심장 둘 다).
     3. 칸이 없는 사전 담보는 「참고 담보」 — 미리보기에 따로 서고, 넣으면 그 계약에 남고(계산에는 안 넣음),
        만들기 카드 · 최종 보고서 「계약 한눈에」 에 적힌다.
     4. 미리보기의 줄마다 <b>담보사전 풀이</b>(사전의 w 그대로)가 붙는다 — 지어낸 풀이가 아니다.
     5. 사전 id 는 모두 kijun-dict.js 에 있는 것이다(없는 id 를 지어내지 않는다).                    */
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

/* [이름, 칸, 사전 id] — 칸 '' 은 「표준표에 칸 없음 → 참고 담보」 */
const NAMES = [
  /* 암 치료비 · 주요치료비 — 급여 / 비급여 */
  ['암주요치료비(연간1회한)', 'cantx', 'cancer-tx'],
  ['초기집중보장형프리미엄클래스II암주요치료보장(상급종합병원플러스)특약C(무배당,저해약환급금형)', 'cantx', 'cancer-tx'],
  ['상급종합병원플러스암직접치료보장특약C(무배당,저해약환급금형)', 'cantx', 'cancer-tx'],
  ['암 통합치료비Plus(종합병원)(고급형)(감액없음)(맞춤고지)', 'cantx', 'cancer-tx'],
  ['암 통합치료비(기본형)', 'cantx', 'cancer-tx'],
  ['암치료비(연간1회)', 'cantx', 'cancer-tx'],
  ['암 주요치료비 — 한도이연형', 'cantx', 'cancer-tx'],
  ['비급여암주요치료비', 'cantxN', 'nonpay'],
  ['암주요치료비(비급여)(연간1회한)', 'cantxN', 'nonpay'],
  ['비급여(전액본인부담 포함) 암 통합치료비Plus(종합병원)(맞춤고지)', 'cantxN', 'nonpay'],
  ['암 통합치료비II(비급여(전액본인부담 포함))(건강가입)', 'cantxN', 'nonpay'],
  ['비급여 암 주요치료비(수술·약물·방사선)', 'cantxN', 'nonpay'],
  ['선별급여 암주요치료비', '', 'sel-pay'],
  ['항암방사선약물치료비', 'antican', 'chemo'],
  ['항암방사선·약물치료비(유사암제외)', 'antican', 'chemo'],
  ['항암약물치료비', 'anticanD', 'chemo'],
  ['항암방사선치료비', 'antican', 'chemo'],
  ['표적항암약물허가치료비(연간1회한)', 'target', 'target'],
  ['특정면역항암약물허가치료비', 'immuno', 'immune'],
  ['카티(CAR-T)항암약물허가치료비', '', 'cart'],
  ['항암호르몬약물허가치료비', '', 'hormone'],
  ['중입자방사선치료비', 'proton', 'proton'],
  ['양성자방사선치료비', 'proton', 'proton'],
  ['세기조절방사선치료비(IMRT)', 'radIM', 'imrt'],
  ['다빈치로봇암수술비', 'robotS', 'robot'],
  ['암수술비(유사암제외)', 'canSurg', 'surg-c'],
  ['암 다학제통합진료비', '', 'mdt'],
  ['암직접치료입원일당(1일이상)', 'inpC', 'cancer-hosp'],
  ['암입원일당(1일이상)', 'inpC', 'cancer-hosp'],
  ['상급종합병원 암통원일당', 'outC', 'cancer-hosp'],
  ['암 간병인사용일당', 'canNur', 'care-pay'],
  /* 유사암 — 진단은 칸이 있고, 치료 · 수술은 칸이 없다 */
  ['상급종합병원플러스갑상선암및기타피부암직접치료보장특약C(무배당)', '', 'similar'],
  ['유사암수술비', '', 'similar'],
  ['유사암진단비(감액없음)', 'cancer2', 'similar'],
  ['갑상선암진단비', 'cancer2', 'similar'],
  /* 암 생활비 · 치료 생활비 */
  ['암생활자금(매월)', 'canLiv', 'cancer-life'],
  ['암 진단 후 생활비(월지급)', 'canLiv', 'cancer-life'],
  ['전이암생활비', 'canLiv', 'cancer-life'],
  ['암주요치료생활비', '', 'tx-life'],
  /* 암 진단 */
  ['암진단비(유사암 제외)(감액없음)(맞춤고지)', 'cancer', 'cancer'],
  ['일반암진단비', 'cancer', 'cancer'],
  ['통합암진단비(전이포함)', 'cancerI', 'cancer-all'],
  ['고액암진단비', 'cancerH', 'cancer-high'],
  ['재진단암진단비', 'cancerR', 'cancer-re'],
  ['전이암진단비', 'cancerM', 'cancer-re'],
  /* 순환계 치료비 — 뇌 · 심장 둘 다 / 뇌만 / 심장만 */
  ['특정순환계질환 통합치료비(건강가입)', 'cvTx', 'cv-tx'],
  ['신특정순환계질환 통합치료비Plus(감액없음)(맞춤고지)', 'cvTx', 'cv-tx'],
  ['순환계질환 주요치료비', 'cvTx', 'cv-tx'],
  ['뇌·심장 주요치료비(연간1회)', 'cvTx', 'cv-tx'],
  ['심뇌혈관질환 주요치료비', 'cvTx', 'cv-tx'],
  ['뇌혈관질환 주요치료비(연간1회)', 'brainTx', 'cv-tx'],
  ['뇌졸중 통합치료비', 'brainTx', 'cv-tx'],
  ['심혈관질환 주요치료비', 'heartTx', 'cv-tx'],
  ['허혈성심장질환 주요치료비', 'heartTx', 'cv-tx'],
  ['혈전용해치료비(특정순환계질환)', 'circT', 'cv-tx'],
  ['뇌졸중 혈전용해치료비', 'brainT', 'cv-tx'],
  ['혈전제거술 치료비', 'circT', 'cv-tx'],
  ['관상동맥중재술 치료비', 'stent', 'cv-tx'],
  /* 순환계 생활비 */
  ['순환계질환 생활자금', 'bhLiv', 'cv-life'],
  ['뇌·심장 생활비(매월)', 'bhLiv', 'cv-life'],
  ['뇌졸중·급성심근경색 생활자금', 'bhLiv', 'cv-life'],
  /* 뇌 · 심장 진단 */
  ['심뇌혈관질환진단비', 'circD', ''],
  ['순환계질환진단비', 'circD', ''],
  ['심장질환(특정I)진단비(감액없음)(맞춤고지)', 'heartW', 'heart-w'],
  ['심장질환(특정Ⅱ)진단비', 'heartW', 'heart-w'],
  ['심부전진단비', 'heartW', 'heart-w'],
  ['허혈성심장질환진단비', 'heart', 'heart'],
  ['급성심근경색증진단비', 'mi', 'heart-a'],
  ['뇌출혈진단비', 'brainh', 'brain-h'],
  ['뇌졸중진단비', 'stroke', 'brain-s'],
  ['뇌혈관질환진단비(감액없음)(맞춤고지)', 'brain', 'brain'],
  ['뇌혈관질환수술비', 'brainS', 'surg-c'],
  ['허혈성심장질환수술비', 'heartOp', 'surg-c'],
  /* 간병 · 돌봄 */
  ['간병인사용 질병입원일당(plus)(1일이상 180일한도)(요양병원제외)(건강가입)', 'nurUD', 'care-pay'],
  ['간병인지원 질병입원일당', 'nurUD', 'care'],
  ['간호·간병통합서비스 사용 질병입원일당(1일이상 180일한도)(건강가입)', 'nurNS', 'care-ns'],
  ['간호간병통합서비스 상해입원일당(1-180일)(맞춤고지)', 'nurNS', 'care-ns'],
  ['장기요양(1~2등급)진단특약(무)_DW 해약미지급 2형(간편III)', 'ltcD', 'ltc'],
  ['장기요양(1~5등급)재가급여지원금(월)', 'ltcF', 'ltc-care'],
  ['중증치매진단비', 'dem2', 'dementia'],
  ['경도치매진단비', '', 'dementia'],
  /* 장해 · 사망 */
  ['[기본계약]일반상해후유장해(3~100%)(맞춤고지)', 'disabA', 'disab-a'],
  ['일반상해80%이상후유장해(건강가입)[기본계약]', '', 'disab-a'],
  ['[기본계약]일반상해후유장해(20~100%)(맞춤고지)', '', 'disab-a'],
  ['질병후유장해(3~100%)', 'disabD', 'disab-d'],
  ['질병80%이상후유장해', '', 'disab-d'],
  ['고도후유장해 생활자금', 'disLiv', 'disab-life'],
  ['질병사망', 'deathD', 'death-d'],
  ['[기본계약]일반상해사망(맞춤고지)', 'deathA', 'death-a'],
  /* 수술 · 입원 */
  ['질병1~5종수술비II(매회지급)(맞춤고지)_5종', 'surg5D', 'surg'],
  ['상해1-5종수술비', 'surg5A', 'surg'],
  ['16대질병수술비', 'surgN', 'surg-n'],
  ['질병수술비(상급종합병원)(맞춤고지)', 'surg', 'surg'],
  ['외모특정상해수술비[기본계약]', '', 'surg'],
  ['질병입원일당(1일이상)', 'inpD', 'hosp'],
  ['중환자실입원일당', 'icu', 'icu'],
  /* 운전자 · 배상 · 재산 — 「화재벌금」 은 운전자 벌금이 아니다 */
  ['교통사고처리지원금(중대법규위반)', 'carAcc', 'car-settle'],
  ['변호사선임비용', 'lawyer', 'car-lawyer'],
  ['벌금(대인)', 'fine', 'car-fine'],
  ['가족화재벌금', '', 'fire-liab'],
  ['화재(폭발포함)배상책임', '', 'fire-liab'],
  ['가족일상생활중배상책임', 'liab', 'liab'],
  ['급배수시설 누출손해(주택)', '', 'leak'],
  ['주택(화재)임시거주비II(1일이상)', '', 'fire']
];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  /* ★ 바깥은 끊습니다(check-netblock) — 사장님 Supabase 를 부르지 않게 */
  await pg.route('**://**', r => (r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort()));
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);

  head('[1] 회사마다 다른 담보 이름 ' + NAMES.length + '줄 — 칸 · 담보사전');
  const R = await pg.evaluate(N => N.map(x => { var r = ppRule(x[0]); return [x[0], x[1], x[2], r.k, r.d]; }), NAMES);
  const wrong = R.filter(r => r[1] !== r[3] || (r[2] && r[2] !== r[4]));
  wrong.forEach(r => console.log('      ✗ 「' + r[0] + '」 → ' + (r[3] || '칸 없음') + ' / ' + (r[4] || '사전 없음') + '  (맞는 것: ' + (r[1] || '칸 없음') + ' / ' + (r[2] || '—') + ')'));
  is(wrong.length === 0, '이름 ' + NAMES.length + '줄 중 ' + (NAMES.length - wrong.length) + '줄이 맞는 칸 · 사전으로 간다');
  const req = ['cantx', 'cantxN', 'canLiv', 'cvTx', 'bhLiv'];
  is(req.every(k => R.some(r => r[3] === k)), '사장님이 짚으신 암 치료비 · 비급여 암주요치료비 · 암 생활비 · 순환계 치료비 · 순환계 생활비가 다 있다');

  head('[2] 사전 id 는 담보사전에 있는 것뿐 — 지어내지 않는다');
  const D = await pg.evaluate(() => { var ids = {}; (window.KJ_DICT || []).forEach(g => g.d.forEach(d => { ids[d.id] = 1; }));
    var used = {}; PP_RULES.forEach(r => { if (r[2]) used[r[2]] = 1; }); Object.keys(PP_K2D).forEach(k => { used[PP_K2D[k]] = 1; });
    return { n: Object.keys(ids).length, miss: Object.keys(used).filter(x => !ids[x]) }; });
  is(D.n > 80, '담보사전을 불러왔다 — ' + D.n + '가지');
  is(D.miss.length === 0, '규칙 표 · 칸 연결이 쓰는 사전 id 가 모두 사전에 있다' + (D.miss.length ? ' — 없는 것: ' + D.miss.join(', ') : ''));

  head('[3] 표준표 새 칸 여섯 — 그 병의 받는 돈에 들어간다');
  const S6 = await pg.evaluate(() => { var ks = {}; STD.forEach(g => g.rows.forEach(r => { ks[r.k] = r; }));
    var need = ['brainTx', 'heartTx', 'heartW', 'cvTx', 'nurNS', 'ltcD'];
    var E = {}; EVENTS.forEach(e => { E[e.k] = (e.lump || []).concat(e.day || [], e.month || []); });
    return { has: need.filter(k => ks[k]).length, desc: need.filter(k => DESC[k]).length, n: Object.keys(ks).length,
      brain: ['brainTx', 'cvTx'].every(k => E.brain.indexOf(k) >= 0), heart: ['heartTx', 'heartW', 'cvTx'].every(k => E.heart.indexOf(k) >= 0),
      care: E.care.indexOf('ltcD') >= 0, std0: need.every(k => ks[k] && ks[k].std === 0) }; });
  is(S6.has === 6 && S6.desc === 6, '새 칸 여섯과 설명 — 표준 담보 ' + S6.n + '가지');
  is(S6.std0, '새 칸의 표준 금액은 0(아직 안 정함) — 지어내지 않는다');
  is(S6.brain && S6.heart && S6.care, '순환계 주요치료비는 뇌 · 심장 둘 다, 뇌혈관/심혈관 주요치료비는 그 병에, 장기요양 진단비는 간병 · 요양에');
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.after.push({ id: 'zz', co: '시험화재', nm: '시험 순환계', start: '2026-11', years: '20', premMan: '3', act: 'keep', kb: false, cov: { cvTx: '5000' }, cov2: {} }); save(); });
  const EV = await pg.evaluate(() => { var C = calc(); var h = EVENTS.filter(e => e.k === 'heart')[0], b = EVENTS.filter(e => e.k === 'brain')[0];
    return { h: evCalc(h, C).totA, b: evCalc(b, C).totA }; });
  await pg.evaluate(() => { S.after.pop(); save(); });
  const EV0 = await pg.evaluate(() => { var C = calc(); var h = EVENTS.filter(e => e.k === 'heart')[0], b = EVENTS.filter(e => e.k === 'brain')[0];
    return { h: evCalc(h, C).totA, b: evCalc(b, C).totA }; });
  is(EV.h - EV0.h === 5000 && EV.b - EV0.b === 5000, '순환계 주요치료비 5,000만원을 넣으면 심장 · 뇌 받는 돈이 둘 다 5,000만원 늘어난다 (' + (EV.h - EV0.h) + ' · ' + (EV.b - EV0.b) + ')');

  head('[4] 미리보기 — 줄마다 담보사전 풀이 · 칸 없는 담보는 「참고 담보」');
  await pg.evaluate(() => { localStorage.clear(); doSample(); go('edit'); });
  await pg.waitForTimeout(300);
  const lines = [
    ['특정순환계질환 통합치료비(건강가입)', 5000], ['간호·간병통합서비스 사용 질병입원일당(1일이상 180일한도)', 7],
    ['상급종합병원플러스갑상선암및기타피부암직접치료보장특약C(무배당)', 200], ['일반상해80%이상후유장해(건강가입)', 100], ['20대가전제품 고장수리비용', 100]];
  await pg.evaluate(L => {
    var P = { co: '시험화재', nm: '시험 건강보험', term: '100세만기', years: '20', premMan: '5', rows: [], other: [], ext: [], usd: false };
    L.forEach(function (x, n) { var R = ppRule(x[0]), k = R.k; if (!ppFits(k, x[1])) k = '';
      var row = { n: n, raw: x[0] + ' · ' + x[1] + '만원', k: k, d: R.d || (k ? (PP_K2D[k] || '') : ''), v: x[1], on: !!k, usd: false };
      if (!k && row.d) row.on = true; (k ? P.rows : (row.d ? P.ext : P.other)).push(row); });
    window.__PP = { name: '시험_제안서.pdf', P: P }; ppSet(ppPreview());
  }, lines);
  const V = await pg.evaluate(() => { var v = document.querySelector('.ppv'); return {
    ext: v.querySelectorAll('.ppt[data-a="ext"] tbody tr').length, other: v.querySelectorAll('.ppt[data-a="other"] tbody tr').length,
    rows: v.querySelectorAll('.ppt[data-a="rows"] tbody tr').length, exp: [].map.call(v.querySelectorAll('.ppx'), x => x.textContent),
    cvw: (ppDict('cv-tx') || {}).w || '' }; });
  is(V.rows === 2 && V.ext === 2 && V.other === 1, '칸 있는 담보 ' + V.rows + ' · 참고 담보 ' + V.ext + ' · 못 알아본 줄 ' + V.other + ' (2 · 2 · 1)');
  is(V.exp.length >= 4 && V.cvw && V.exp.some(t => t.indexOf(V.cvw) >= 0), '줄마다 담보사전 풀이가 붙는다 — 사전 문장 그대로 (「' + (V.exp[0] || '').slice(0, 40) + '…」)');
  const before = await pg.evaluate(() => S.after.length);
  await pg.evaluate(() => ppGo());
  await pg.waitForTimeout(300);
  const G = await pg.evaluate(() => { var p = S.after[S.after.length - 1]; S.polOpen[p.id] = true; render();
    var card = [].slice.call(document.querySelectorAll('.pol')).pop();
    return { n: S.after.length, cov: p.cov, ext: (p.ext || []).map(e => e.n), card: card ? card.textContent : '' }; });
  is(G.n === before + 1 && G.cov.cvTx === '5000' && G.cov.nurNS === '7', '넣으면 순환계 주요치료비 · 간호간병 일당이 제 칸으로');
  is(G.ext.length === 2 && G.ext.every(Boolean), '칸 없는 담보 둘은 그 계약의 참고 담보로 — ' + G.ext.join(' · '));
  is(/참고 담보 2개/.test(G.card), '만들기 카드에 「📚 참고 담보 2개」');
  const FR = await pg.evaluate(() => { var d = document.createElement('div'); d.innerHTML = frHtml(); return d.textContent; });
  is(G.ext.every(n => FR.indexOf(n) >= 0) && /참고/.test(FR), '최종 보고서 「계약 한눈에」 에 참고 담보가 적힌다');
  const C2 = await pg.evaluate(() => { var C = calc(); return { cv: C.a.cvTx || 0 }; });
  is(C2.cv === 5000, '계산에는 칸 있는 담보만 — 순환계 주요치료비 ' + C2.cv + '만원');

  head('[5] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 제안서 담보 이름을 담보사전 기준으로 정확히 읽습니다');
  process.exit(bad ? 1 : 0);
})();
