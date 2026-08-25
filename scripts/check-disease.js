/* 질병 보험가이드 — 지어낸 것이 섞여 있지 않은가.

   이 자료는 고객 앞에서 「이 병은 이렇게 치료하고, 그때 이 담보가 나옵니다」
   라고 말하는 데 쓰인다. 그래서 여기 적힌 담보 이름이 보장분석이 쓰는 이름과
   한 글자라도 다르면, 설계사가 증권에서 그 담보를 못 찾는다. 그 순간 상담이
   멈춘다.

   여기서 확인한다.

     1. 질병 표가 <b>한 벌</b>인가 — 앱이 그 한 벌을 읽는가, 다시 적지 않았는가
     2. 담보 이름이 INS_KEY·INS_AREA 가 아는 이름인가 (한 글자씩 견준다)
     3. 질병코드가 KCD_DATA 에 있는 코드인가
     4. 빠진 칸 없이 다섯 토막이 다 있는가 (병·원인·치료·담보·화법)
     5. 단정하지 않는가 — 「반드시 지급」 「무조건」 같은 말이 없는가
     6. 견본 이름이 홍길동인가 — 실제 고객 이름이 없는가
     7. 화면이 실제로 서는가 · 질병을 열면 다섯 토막이 다 나오는가
     8. 담보를 누르면 「이 담보가 어디에서 일하나」 가 나오는가
     9. 담보 말모이 — 이 돈이 무슨 돈인지 스물다섯 가지가 다 적히는가
    10. 전부 펼쳐 인쇄하면 한 권으로 묶이는가
    11. 좁은 화면에서 옆으로 안 밀리는가 · 인쇄에서 안 짤리는가
    12. <b>자료를 못 읽으면 화면을 안 세우는가</b> — 일부러 끊어 보고 확인한다
    13. <b>겹쳐 받는 법</b> — 동시에 열리는 개수를 흐름에서 세는가 ·
        그 병과 <b>상관없는 담보를 권하지 않는가</b>
    14. <b>도해</b> — 색 오타로 도형이 말없이 사라지지 않는가 ·
        새로 그린 그림이 목록에서 빠지지 않는가
    15. <b>전이·합병증</b> — 겁만 주고 끝내지 않는가(무엇을 하는가·담보가 붙는가) ·
        외운 비율을 적지 않는가 · 없는 질병에 지어내 붙이지 않는가
    17. <b>코드로 찾기</b> — 코드 표가 한 벌인가 · 진단명과 사고 원인을 가르는가 ·
        지도가 있는 자료만 가리키는가 · 담보를 정하지 않는다고 적는가
    16. <b>범위 표</b> — 출처 없는 비율을 적지 않는가 · 코드를 세부별로 빠짐없이
        폈는가 · 그 코드를 앱이 아는가 · 「약관이 정한다」 고 적는가
    18. <b>얼마 듭니까</b> — 숫자마다 근거가 붙어 있는가 · 제도 숫자에 「언제 기준」이
        붙는가 · 자료가 없는 병에 지어내지 않고 <b>없다고 적는가</b>                   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8877;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

/* 자료 파일을 <b>일부러 없애 보는</b> 길. 알람이 실제로 울리는지 보려면
   한 번은 망가뜨려 봐야 한다. 안 울리는 알람은 알람이 아니다. */
let CUT = false;

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (CUT && /질병가이드-data\.js$/.test(p)) {           /* 못 읽은 척한다 */
    res.writeHead(404); res.end(); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

const DATA = 'app/질병가이드-data.js';
const VIZF = 'app/질병가이드-도해.js';
const KCDF = 'app/질병가이드-코드.js';
const PAGE = 'app/재무설계/질병보험가이드.html';

(async () => {
  const app  = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const raw  = fs.readFileSync(path.join(ROOT, DATA), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');

  /* 자료를 그대로 읽어 온다 */
  const vizRaw = fs.readFileSync(path.join(ROOT, VIZF), 'utf8');
  const kcdRaw = fs.readFileSync(path.join(ROOT, KCDF), 'utf8');
  const sandbox = { window: {} };
  new Function('window', raw)(sandbox.window);
  new Function('window', 'document', vizRaw)(sandbox.window, { querySelectorAll: function () { return []; } });
  new Function('window', kcdRaw)(sandbox.window);
  const D = sandbox.window.DZ_DATA;
  const VIZ = sandbox.window.DZ_VIZ;
  const KCD = sandbox.window.DZ_KCD;

  /* ═══ 1. 표가 한 벌인가 ═══ */
  console.log('\n[1] 질병 표가 한 벌인가 — 두 벌이면 한쪽만 고쳐진다');
  is(!!(D && D.list && D.list.length), '자료 한 벌이 읽힌다 — 질병 ' + ((D && D.list) ? D.list.length : 0) + '종');
  is(/<script src="질병가이드-data\.js"><\/script>/.test(app), '앱이 그 한 벌을 싣는다');
  is(/<script src="\.\.\/질병가이드-data\.js"><\/script>/.test(html), '가이드 화면도 같은 한 벌을 싣는다');
  is(/var TP_DISEASES\s*=\s*\(function/.test(app),
     '치료비 지급지도가 그 표에서 꺼내 쓴다 (질병 표를 다시 적지 않았다)');
  is(!/var TP_DISEASES\s*=\s*\[/.test(app), '앱 안에 질병 표가 다시 적혀 있지 않다');
  is(/var CLAIM_SCENARIOS\s*=\s*\(window\.DZ_DATA/.test(app),
     '청구·사후관리의 질병 사례도 같은 한 벌에서 온다');
  is(!/var CLAIM_SCENARIOS\s*=\s*\[/.test(app), '앱 안에 사례 표가 다시 적혀 있지 않다');
  is(/질병가이드-도해\.js/.test(html), '가이드가 그림 파일을 싣는다');
  is(!/dz3d/.test(html) && !/dz3d/.test(vizRaw), '돌리기만 하던 옛 3D 자취가 남아 있지 않다');
  is(/<script src="apex-deck\.js">|상담자료\/apex-deck\.js/.test(html),
     '준법 문구는 상담자료 공통 덧붙임에서 온다 (여기서 따로 쓰지 않는다)');

  /* ═══ 2. 담보 이름 ═══ */
  console.log('\n[2] 담보 이름이 보장분석이 쓰는 이름과 같은가 — 다르면 증권에서 못 찾는다');
  const keyBlk = app.slice(app.indexOf('var INS_KEY'), app.indexOf('function insGaps'));
  const KEY = [...keyBlk.matchAll(/k:\s*'([^']+)'/g)].map(m => m[1]);
  const areaBlk = app.slice(app.indexOf('var INS_AREA'), app.indexOf('function insAreaOf'));
  const AREA = [...areaBlk.matchAll(/re:\s*(\/(?:[^\/\\]|\\.)+\/)/g)].map(m => eval(m[1]));
  const AK = [...areaBlk.matchAll(/k:\s*'([^']+)'/g)].map(m => m[1]);
  is(KEY.length > 0 && AREA.length > 0, '앱에서 담보 이름표를 찾았다 — INS_KEY ' + KEY.length + ' · INS_AREA ' + AREA.length);

  /* 담보 이름은 <b>말모이(DZ_DATA.cov)에 적힌 것만</b> 쓸 수 있다.
     갈래(INS_AREA)만 맞으면 통과시키면 「표적치료특약」 같은 새 이름이 슬쩍 끼어든다.
     실제로 그렇게 새 봤다 — 그래서 여기서는 한 글자까지 견준다. */
  const VOCAB = new Map((D.cov || []).map(c => [c.k, c]));
  is(VOCAB.size > 0, '담보 말모이가 있다 — ' + VOCAB.size + '개');

  const badVocab = [], badArea = [], loose = [];
  (D.cov || []).forEach(c => {
    if (AK.indexOf(c.area) < 0) { badArea.push('말모이 ' + c.k + ':' + c.area); return; }
    const areaRe = AREA[AK.indexOf(c.area)];
    if (KEY.indexOf(c.k) < 0 && !areaRe.test(c.k)) loose.push(c.k + ' (' + c.area + ')');
    if (!c.d) badVocab.push(c.k + ' 설명 없음');
  });
  is(loose.length === 0,
     '말모이의 이름을 앱의 이름표가 전부 알아본다' + (loose.length ? ' — 못 알아보는 이름: ' + loose.join(' / ') : ''));
  is(badVocab.length === 0, '말모이마다 「무슨 돈인지」 한 줄이 붙어 있다' + (badVocab.length ? ' — ' + badVocab.join(' / ') : ''));

  const badPay = [];
  (D.list || []).forEach(d => {
    if (AK.indexOf(d.area) < 0) badArea.push(d.id + ':' + d.area);
    (d.path || []).forEach(s => (s.pay || []).forEach(p => {
      if (!VOCAB.has(p.k)) badPay.push(d.id + ' · ' + p.k);
    }));
  });
  is(badPay.length === 0, '치료 단계에 붙은 담보가 전부 말모이에 있다' + (badPay.length ? ' — 말모이에 없는 이름: ' + badPay.join(' / ') : ''));
  is(badArea.length === 0, '질병마다 붙인 큰 틀이 INS_AREA 에 있다' + (badArea.length ? ' — ' + badArea.join(' / ') : ''));

  /* ★ 담보 이름표(INS_KEY) 옆 주석에 <b>출처 없는 비율</b>이 담보마다 적혀
     있었다(숫자는 여기에도 옮겨 적지 않는다). 질병 가이드에서는
     대표님이 잡아 지웠는데, 앱 쪽에는 그대로 남아 있었다. 주석이라 화면에는
     안 나오지만 다음 사람이 사실로 옮겨 적으면 그때는 고객 앞에 나간다.
     실제로 이 점검은 <b>경고하려고 그 숫자를 인용해 둔 주석</b>부터 잡았다 —
     인용이든 주장이든 다음 사람이 옮겨 적을 위험은 같기 때문에 맞는 판정이다.

     <b>그 블록 안만</b> 본다 — 파일 전체에서 % 를 잡으면 「100분의100」 같은
     멀쩡한 것까지 걸려 헛것이 된다. 안 잡는 점검보다 나쁜 것이 헛것이다. */
  const keyPct = (keyBlk.match(/약\s*[0-9]+\s*%|[0-9]+\s*%\s*(이상|\+)/g) || []);
  is(keyPct.length === 0, '담보 이름표 옆에 <b>출처 없는 비율</b>을 적지 않는다' +
     (keyPct.length ? ' — 적혀 있음: ' + keyPct.join(' / ') : ''));

  /* INS_KEY 열넷은 요즘 실지급을 가르는 계열이다. 말모이가 하나라도 빠뜨리면
     설계사가 그 담보를 설명할 자리가 없어진다. */
  const keyMiss = KEY.filter(k => !VOCAB.has(k));
  is(keyMiss.length === 0, 'INS_KEY 계열(' + KEY.length + '개)을 하나도 빠뜨리지 않았다' + (keyMiss.length ? ' — 빠짐: ' + keyMiss.join(' / ') : ''));

  /* 말모이에만 있고 아무 질병에서도 안 쓰이는 담보는 설명만 있고 갈 곳이 없다 */
  const usedK = new Set();
  (D.list || []).forEach(d => {
    (d.path || []).forEach(s => (s.pay || []).forEach(p => usedK.add(p.k)));
    ((d.plan && d.plan.layers) || []).forEach(L => (L.rows || []).forEach(r => usedK.add(r.k)));
  });
  (D.ops || []).forEach(o => (o.pay || []).forEach(p => usedK.add(p.k)));
  const idle = [...VOCAB.keys()].filter(k => !usedK.has(k));
  is(idle.length === 0, '말모이의 담보가 전부 어느 질병 어느 단계엔가 붙어 있다' + (idle.length ? ' — 갈 곳 없음: ' + idle.join(' / ') : ''));

  /* ═══ 3. 질병코드 ═══ */
  console.log('\n[3] 질병코드가 앱이 아는 코드인가');
  const kcdBlk = app.slice(app.indexOf('var KCD_DATA'), app.indexOf('function kcdSearch'));
  const CODES = new Set([...kcdBlk.matchAll(/\['([A-Z][0-9]{2})','/g)].map(m => m[1]));
  const badCode = [];
  (D.list || []).forEach(d => (d.codes || []).forEach(c => { if (!CODES.has(c[0])) badCode.push(d.id + ':' + c[0]); }));
  is(CODES.size > 50, 'KCD 표를 찾았다 — 코드 ' + CODES.size + '개');
  is(badCode.length === 0, '적어 둔 코드가 전부 그 표에 있다' + (badCode.length ? ' — 없는 코드: ' + badCode.join(' / ') : ''));

  /* ═══ 4. 빠진 칸 ═══ */
  console.log('\n[4] 다섯 토막이 다 있는가 — 하나라도 비면 상담이 끊긴다');
  const holes = [];
  (D.list || []).forEach(d => {
    if (!d.one || !(d.what || []).length) holes.push(d.id + ' 어떤 병인가');
    if (!d.cause || !(d.cause.why || []).length || !(d.cause.risk || []).length || !d.cause.say) holes.push(d.id + ' 원인');
    if (!(d.path || []).length) holes.push(d.id + ' 치료과정');
    (d.path || []).forEach(s => {
      if (!s.k || !s.dur || !s.desc) holes.push(d.id + ' 단계 빈칸');
      if (!('pay' in s)) holes.push(d.id + ' 단계에 담보 칸이 없음');
      if (!s.watch) holes.push(d.id + ' · ' + s.k + ' 갈리는 자리');
    });
    if (!(d.trap || []).length) holes.push(d.id + ' 막히는 자리');
    if (!d.talk || !d.talk.open || !(d.talk.spin || []).length || !(d.talk.obj || []).length) holes.push(d.id + ' 화법');
    if (!('src' in d)) holes.push(d.id + ' 근거 칸');
  });
  is(holes.length === 0, '빈칸 없음' + (holes.length ? ' — ' + holes.slice(0, 6).join(' / ') : ''));
  is(!!(D.disc && D.disc.med && D.disc.pay && D.disc.num), '치료·지급·숫자에 대한 꼬리표가 한 곳에 있다');

  /* ═══ 4-2. 술식 ═══ */
  console.log('\n[4-2] 수술·치료 방법이 다 채워졌는가 — 「등을 합니다」 로는 3초를 못 버틴다');
  const opHole = [], opBad = [], dzIds = new Set((D.list || []).map(d => d.id));
  (D.ops || []).forEach(o => {
    if (!dzIds.has(o.dz)) opBad.push('없는 질병 ' + o.dz);
    if (!o.n || !o.how || !o.when || !o.ins || !o.kind) opHole.push(o.n || '(이름 없음)');
    (o.pay || []).forEach(p => { if (!VOCAB.has(p.k)) opBad.push(o.n + ' · ' + p.k); });
  });
  is((D.ops || []).length > 0, '술식이 있다 — ' + (D.ops || []).length + '개');
  is(opHole.length === 0, '술식마다 어떻게·언제·보험이 다 적혀 있다' + (opHole.length ? ' — 빈칸: ' + opHole.slice(0, 5).join(' / ') : ''));
  is(opBad.length === 0, '술식의 담보가 전부 말모이에 있다' + (opBad.length ? ' — ' + opBad.join(' / ') : ''));
  const dzNoOp = (D.list || []).filter(d => !(D.ops || []).some(o => o.dz === d.id)).map(d => d.name);
  is(dzNoOp.length === 0, '질병마다 술식이 하나 이상 붙어 있다' + (dzNoOp.length ? ' — 없음: ' + dzNoOp.join(' / ') : ''));

  /* ═══ 4-3. 용어 ═══ */
  console.log('\n[4-3] 용어 사전 — 진단서에 적힌 말을 풀어 두었는가');
  const tmHole = (D.terms || []).filter(t => !t.t || !t.d || !t.g).map(t => t.t || '(이름 없음)');
  is((D.terms || []).length >= 40, '용어가 넉넉히 있다 — ' + (D.terms || []).length + '개');
  is(tmHole.length === 0, '용어마다 갈래와 뜻이 있다' + (tmHole.length ? ' — ' + tmHole.join(' / ') : ''));

  /* ═══ 4-4. 사례 ═══ */
  console.log('\n[4-4] 사례 — 질병과 이어져 있는가');
  const caseIds = new Set((D.cases || []).map(c => c.id));
  const badCase = [];
  (D.list || []).forEach(d => (d.caseIds || []).forEach(i => { if (!caseIds.has(i)) badCase.push(d.id + ':' + i); }));
  is((D.cases || []).length > 0, '사례가 있다 — ' + (D.cases || []).length + '건');
  is(badCase.length === 0, '질병이 가리키는 사례가 전부 실재한다' + (badCase.length ? ' — 없는 사례: ' + badCase.join(' / ') : ''));

  /* ═══ 4-5. 도해 ═══ */
  console.log('\n[4-5] 도해 — 직접 그렸는가, 질병마다 붙었는가');
  is(!!(VIZ && VIZ.keys && VIZ.keys.length), '도해가 읽힌다 — ' + ((VIZ && VIZ.keys) ? VIZ.keys.length : 0) + '개');
  const dzNoViz = (D.list || []).filter(d => !VIZ.forDz(d.id).length).map(d => d.name);
  is(dzNoViz.length === 0, '질병마다 도해가 하나 이상 붙어 있다' + (dzNoViz.length ? ' — 없음: ' + dzNoViz.join(' / ') : ''));
  /* 남의 삽화를 갖다 붙이지 않았는가 — 직접 그린 SVG 만 쓴다 */
  is(!/<img\s/i.test(vizRaw), '도해에 남의 그림을 갖다 붙이지 않았다 (img 없음)');
  is(!/url\s*\(\s*['"]?https?:/i.test(vizRaw), '바깥에서 그림을 받아 오지 않는다');
  is(/<svg/i.test(vizRaw), '직접 그린 SVG 로 되어 있다');
  is(/직접 그린/.test(vizRaw), '「직접 그린 그림」 이라고 화면에 밝힌다');
  /* 사실 그림 — 조직처럼 보이려면 이름표와 층이 실제로 들어 있어야 한다 */
  const REAL = ['skin_cross', 'skin_cancer', 'cancer_invade', 'wall_layer', 'wall_invade', 'artery_cross', 'artery_rupture'];
  const realMiss = REAL.filter(k => (VIZ.keys || []).indexOf(k) < 0);
  is(realMiss.length === 0, '사실 그림 일곱 장이 다 있다' + (realMiss.length ? ' — 빠짐: ' + realMiss.join(' / ') : ''));
  const noLbl = REAL.filter(k => { const v = VIZ.get(k); return !v || v.html.indexOf('class="lbl"') < 0; });
  is(noLbl.length === 0, '사실 그림마다 이름표가 붙어 있다' + (noLbl.length ? ' — 없음: ' + noLbl.join(' / ') : ''));
  const noZoom = REAL.filter(k => { const v = VIZ.get(k); return !v || v.html.indexOf('dzart') < 0; });
  is(noZoom.length === 0, '사실 그림은 확대해서 볼 수 있다' + (noZoom.length ? ' — 안 됨: ' + noZoom.join(' / ') : ''));

  /* ═══ 4-6. 설계사용 설계 ═══ */
  console.log('\n[4-6] 설계사용 — 위험감 화법과 층별 구성이 다 채워졌는가');
  const planHole = [], planBad = [], fearHole = [];
  (D.list || []).forEach(d => {
    const P = d.plan;
    if (!P) { planHole.push(d.name + ' 설계 없음'); return; }
    if (!(P.why || []).length) planHole.push(d.name + ' 왜 어려운가');
    if (!(P.layers || []).length) planHole.push(d.name + ' 층');
    if (!(P.first || []).length) planHole.push(d.name + ' 예산 순서');
    if (!(P.check || []).length) planHole.push(d.name + ' 증권 확인');
    (P.fear || []).forEach(f => {
      /* 문제만 던지고 끝내지 않는다 — 해결로 넘기는 말이 반드시 짝으로 있어야 한다 */
      if (!f.say || !f.why || !f.then) fearHole.push(d.name + ' · ' + (f.say || '').slice(0, 14));
    });
    if (!(P.fear || []).length) planHole.push(d.name + ' 위험감 화법');
    (P.layers || []).forEach(L => {
      if (!L.n || !L.d || !(L.rows || []).length) planHole.push(d.name + ' 층 빈칸');
      (L.rows || []).forEach(r => {
        if (!VOCAB.has(r.k)) planBad.push(d.name + ' · ' + r.k);
        if (!r.why) planHole.push(d.name + ' · ' + r.k + ' 왜 넣는가');
      });
    });
  });
  is(planHole.length === 0, '질병 ' + (D.list || []).length + '종에 설계가 빠짐없이 붙어 있다' +
     (planHole.length ? ' — 빈칸: ' + planHole.slice(0, 5).join(' / ') : ''));
  is(planBad.length === 0, '설계에 쓴 담보가 전부 말모이에 있다' + (planBad.length ? ' — 모르는 이름: ' + planBad.join(' / ') : ''));
  is(fearHole.length === 0,
     '위험감 화법마다 <b>왜 먹히나</b>와 <b>해결로 넘기는 말</b>이 짝으로 있다' +
     (fearHole.length ? ' — 짝 없음: ' + fearHole.join(' / ') : ''));
  const nLayer = (D.list || []).reduce((a, d) => a + ((d.plan && d.plan.layers) || []).length, 0);
  /* 연습의 채점 기준 — 질병마다 「없으면 설계가 성립 안 되는 자리」가 있어야 한다 */
  const noMust = (D.list || []).filter(d =>
    ((d.plan && d.plan.layers) || []).reduce((a, L) => a + (L.rows || []).filter(r => r.must).length, 0) < 3
  ).map(d => d.name);
  is(noMust.length === 0, '질병마다 꼭 들어가야 하는 자리가 셋 이상 정해져 있다' +
     (noMust.length ? ' — 모자람: ' + noMust.join(' / ') : ''));

  const nRow = (D.list || []).reduce((a, d) =>
    a + ((d.plan && d.plan.layers) || []).reduce((b, L) => b + (L.rows || []).length, 0), 0);
  is(nRow > 100, '층별 담보 줄이 넉넉하다 — 층 ' + nLayer + ' · 줄 ' + nRow);

  /* ═══ 4-7. 약관 어디를 보나 ═══ */
  console.log('\n[4-7] 약관 지도 — 자리와 함정이 다 적혀 있는가');
  const N = D.nav || {};
  is((N.order || []).length >= 5, '찾는 순서가 다섯 걸음 이상 적혀 있다 — ' + (N.order || []).length + '걸음');
  is((N.where || []).length >= 20, '질문이 넉넉히 있다 — ' + (N.where || []).length + '가지');
  const navHole = [], navBad = [];
  (N.where || []).forEach(w => {
    if (!w.q || !(w.at || []).length || !w.how || !w.trap) navHole.push((w.q || '').slice(0, 14));
    (w.cov || []).forEach(k => { if (!VOCAB.has(k)) navBad.push(w.q.slice(0, 10) + ' · ' + k); });
    (w.dz || []).forEach(k => { if (!dzIds.has(k)) navBad.push(w.q.slice(0, 10) + ' · ' + k); });
  });
  is(navHole.length === 0, '질문마다 <b>펴야 할 자리 · 무엇을 확인하나 · 자주 틀리는 자리</b>가 다 있다' +
     (navHole.length ? ' — 빈칸: ' + navHole.join(' / ') : ''));
  is(navBad.length === 0, '약관 지도가 가리키는 담보·질병이 실재한다' + (navBad.length ? ' — ' + navBad.join(' / ') : ''));
  /* 약관 원문을 옮겨 적지 않았는가 — 목차 이름만 있어야 한다 */
  const navTxt = JSON.stringify(N);
  is(!/제\s*\d+\s*조\s*\(/.test(navTxt), '약관 조문을 옮겨 적지 않았다 (목차 이름만)');
  is(/원문을 서버나 공개 주소에 올리지 않습니다|원문은 적지 않습니다/.test(navTxt),
     '약관 원문을 올리지 않는다는 규칙이 적혀 있다');

  /* ═══ 5. 단정하지 않는가 ═══ */
  console.log('\n[5] 단정하지 않는가 — 지급은 약관과 심사가 정한다');
  const SAY_NO = [
    [/반드시\s*지급/, '「반드시 지급」'],
    [/무조건\s*(지급|나옵|받)/, '「무조건 지급/나옵니다」'],
    [/전액\s*보장(됩니다|합니다)/, '「전액 보장됩니다」'],
    [/비과세\s*(상품)?입니다/, '「비과세입니다」 — 결론을 말하면 무너진다'],
    [/100%\s*(지급|보장)/, '「100% 지급」']
  ];
  /* 화면에 나가는 글만 본다 — 주석에 적힌 「이렇게 쓰지 않는다」 는 규칙이지 문구가 아니다 */
  const body = raw.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const said = SAY_NO.filter(([re]) => re.test(body)).map(([, t]) => t);
  is(said.length === 0, '단정하는 말이 없다' + (said.length ? ' — ' + said.join(' / ') : ''));
  is(/심사\s*결과에\s*따릅니다/.test(body), '「심사 결과에 따릅니다」 를 빼지 않았다');
  is(/약관/.test(body), '약관이 우선임을 적어 두었다');

  /* ═══ 6. 실명 ═══ */
  console.log('\n[6] 견본에 실제 고객 이름이 없는가');
  is(!/김[가-힣]{2}\s*(님|고객)/.test(body) && !/이[가-힣]{2}\s*고객님/.test(body),
     '실제 사람 이름처럼 보이는 견본이 없다');

  /* ═══ 7~10. 화면 ═══ */
  const browser = await chromium.launch();

  console.log('\n[7] 화면이 실제로 서는가');
  let page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('' + e));
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });

  const cards = await page.locator('.dcard').count();
  is(cards === D.list.length, '질병 ' + D.list.length + '종이 모두 카드로 선다 (' + cards + '개)');
  is(errs.length === 0, '콘솔이 조용하다' + (errs.length ? ' — ' + errs[0] : ''));

  /* 질병 하나를 열어 본다 */
  await page.locator('.dcard').first().click();
  await page.waitForTimeout(200);
  const txt = await page.locator('#detailPane').innerText();
  const need = ['어떤 병입니까', '왜 생깁니까', '어떻게 치료하고', '자주 막힙니다', '어떻게 말합니까', '근거'];
  const miss = need.filter(t => txt.indexOf(t) < 0);
  is(miss.length === 0, '한 질병을 열면 여섯 토막이 다 나온다' + (miss.length ? ' — 빠짐: ' + miss.join(' ') : ''));
  is(/여기서 갈립니다/.test(txt), '단계마다 「여기서 갈립니다」 가 붙는다');
  is(/심사 결과에 따릅니다/.test(txt), '화면 아래에 지급 꼬리표가 붙는다');

  console.log('\n[8] 담보를 누르면 그 담보가 어디에서 일하는지 나오는가');
  const payCount = await page.locator('.stage .pay').count();
  is(payCount > 0, '단계마다 담보 알약이 붙어 있다 (' + payCount + '개)');
  await page.locator('.stage .pay').first().click();
  await page.waitForTimeout(180);
  const back = await page.locator('#detailPane').innerText();
  is(/는 어디에서 일합니까/.test(back), '담보 되짚기 화면이 열린다');
  is(/이 질병 열기/.test(back), '되짚기에서 다시 질병으로 들어갈 수 있다');

  console.log('\n[8-2] 그림 · 술식 · 사례가 화면에 서는가');
  /* 위에서 담보 되짚기로 넘어갔으니 질병 한 장을 다시 연다 */
  await page.evaluate(id => open_(id), D.list[0].id);
  await page.waitForTimeout(300);
  const vizN = await page.locator('.viz').count();
  is(vizN > 0, '도해가 그려진다 (' + vizN + '장)');
  is((await page.locator('.op').count()) > 0, '술식 카드가 선다 (' + (await page.locator('.op').count()) + '개)');
  is((await page.locator('.case').count()) > 0, '사례 카드가 선다 (' + (await page.locator('.case').count()) + '건)');
  is(/직접 그린/.test(await page.locator('#detailPane').innerText()), '도해마다 「직접 그린 도식」 이 붙는다');
  is(/예시입니다|예시입니다\.|지급을 보장하는 숫자가 아닙니다/.test(await page.locator('#detailPane').innerText()),
     '사례 금액이 예시라고 밝힌다');

  /* 확대해서 들여다볼 수 있는가 — 못 하면 그냥 그림 한 장이다 */
  await page.locator('.dzart').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const artN = await page.locator('.dzart').count();
  is(artN > 0, '확대해서 보는 사실 그림이 있다 (' + artN + '장)');
  if (artN) {
    const svg0 = page.locator('.dzart svg').first();
    const before = await svg0.getAttribute('viewBox');
    await page.locator('.dzart .dzart-b[data-act="in"]').first().click();
    await page.waitForTimeout(150);
    const after = await svg0.getAttribute('viewBox');
    is(before !== after, '「+ 확대」 를 누르면 실제로 확대된다');
    await page.locator('.dzart .dzart-b[data-act="reset"]').first().click();
    await page.waitForTimeout(120);
    is((await svg0.getAttribute('viewBox')) === before, '「처음으로」 를 누르면 되돌아온다');

    /* 이름표 끄기 — 고객 앞에서 하나씩 짚으려면 꺼져야 한다 */
    const lblN = await page.locator('.dzart .lbl').first().count();
    is(lblN > 0, '사실 그림에 이름표가 붙어 있다');
    await page.locator('.dzart .dzart-b[data-act="label"]').first().click();
    await page.waitForTimeout(120);
    is(await page.locator('.dzart').first().evaluate(el => el.classList.contains('nolbl')),
       '「이름표 끄기」 를 누르면 이름표가 사라진다');
    await page.locator('.dzart .dzart-b[data-act="label"]').first().click();
    await page.waitForTimeout(120);
    is(!(await page.locator('.dzart').first().evaluate(el => el.classList.contains('nolbl'))),
       '다시 누르면 이름표가 돌아온다');
  } else {
    no('사실 그림을 찾지 못했다');
  }

  console.log('\n[8-3] 설계사용 칸이 화면에 서는가 — 고객 화면과 섞이지 않게');
  await page.evaluate(id => open_(id), 'stroke');
  await page.waitForTimeout(300);
  is((await page.locator('.sec.pro').count()) === 1, '설계사용 칸이 한 곳에 선다');
  const proTxt = await page.locator('.sec.pro').innerText();
  is(/설계사용 · 고객 화면 아님/.test(proTxt), '고객 화면이 아니라는 표시가 붙는다');
  is((await page.locator('.sec.pro .lay').count()) > 0, '층별 구성표가 그려진다 (' +
     (await page.locator('.sec.pro .lay').count()) + '층)');
  is((await page.locator('.sec.pro .fear .f').count()) > 0, '위험감 화법이 그려진다');
  is(/왜 먹히나/.test(proTxt) && /→ 이어서/.test(proTxt), '화법마다 「왜 먹히나」와 「이어서」가 함께 나온다');
  is(/겁을 주는 것이 아니라 구조를 보여 드리는 것/.test(proTxt), '겁주는 자료가 아니라고 적어 둔다');
  is(/그대로 확정하지 마십시오/.test(proTxt) && /심사 결과에 따릅니다/.test(proTxt),
     '기준선을 확정하지 말라는 말과 심사 꼬리표가 붙는다');
  is(/예산이 빠듯할 때 이 순서로/.test(proTxt), '예산이 빠듯할 때의 순서가 있다');
  is(/증권에서 이것만은 확인/.test(proTxt), '증권 확인 체크리스트가 있다');
  /* 층의 담보 이름을 누르면 그 담보 설명으로 간다 */
  await page.locator('.sec.pro .kbtn').first().click();
  await page.waitForTimeout(180);
  is(/는 어디에서 일합니까/.test(await page.locator('#detailPane').innerText()),
     '설계표의 담보 이름을 누르면 그 담보 설명으로 이어진다');

  console.log('\n[8-4] 설계 연습 — 체크하면 화법까지 나오는가');
  await page.evaluate(() => drillOpen('stroke'));
  await page.waitForTimeout(300);
  const boxes = await page.locator('.dl input').count();
  is(boxes > 0, '층별 담보가 체크할 수 있게 놓인다 (' + boxes + '칸)');
  /* 연습은 <b>배우는 자리가 아니라 확인하는 자리</b>다. 그래서 머리에
     「겹쳐 받는 법부터 보기」 가 있어야 한다 — 문제부터 내면 안 된다. */
  const drillHd = await page.locator('.drill-hd').innerText();
  is(/익혔는지 확인/.test(drillHd), '연습 화면이 열리고, <b>확인하는 자리</b>임을 밝힌다');
  is(/겹쳐 받는 법/.test(drillHd), '연습보다 <b>가르치는 화면을 먼저</b> 가리킨다');

  /* 하나도 안 고르고 채점 — 빠뜨린 자리가 전부 나와야 한다 */
  await page.evaluate(() => drillScore());
  await page.waitForTimeout(250);
  const zero = await page.locator('.score .n').innerText();
  is(/^0\//.test(zero), '아무것도 안 고르면 0점이 나온다 (' + zero + ')');
  const missAll = await page.locator('.miss .m').count();
  is(missAll > 0, '빠뜨린 자리가 하나씩 짚인다 (' + missAll + '개)');
  is(/없으면 ·/.test(await page.locator('.miss').innerText()), '빠뜨린 자리마다 「없으면」이 붙는다');

  /* 몇 개 고르고 다시 채점 — 대본이 그만큼 두꺼워져야 한다 */
  await page.evaluate(() => {
    drillAgain();
    ['뇌혈관질환 (전체)', '입원일당', '간병인사용일당'].forEach(k => { DRILL.picked[k] = true; });
    drillScore();
  });
  await page.waitForTimeout(250);
  const sc = await page.locator('.script').innerText();
  is(/이 설계를 이렇게 설명하십시오/.test(sc), '채점하면 대본이 나온다');
  is(/문을 엽니다/.test(sc) && /위험을 짚습니다/.test(sc) && /한 문장으로 묶습니다/.test(sc),
     '대본이 열기 → 위험 → 설명 → 비유 → 닫기 순서로 선다');
  is(sc.indexOf('뇌혈관질환 (전체)') >= 0, '고른 담보가 대본 안에서 설명된다');
  is(/대본에 없는 것/.test(sc), '빠뜨린 것은 대본에서 빠졌다고 알려 준다');
  is(/그대로 읽는 원고가 아니라/.test(await page.locator('#detailPane').innerText()),
     '대본에 준법 꼬리표가 붙는다');
  /* 체크가 달라지면 대본도 달라져야 한다 — 안 그러면 연습이 아니다 */
  const len1 = sc.length;
  await page.evaluate(() => { drillAgain(); drillAll(1); drillScore(); });
  await page.waitForTimeout(250);
  const len2 = (await page.locator('.script').innerText()).length;
  is(len2 > len1, '더 많이 고르면 대본도 그만큼 두꺼워진다 (' + len1 + ' → ' + len2 + '자)');
  is(/^\d+\/\d+$/.test((await page.locator('.score .n').innerText()).replace(/\s/g, '')), '점수가 분수로 나온다');

  console.log('\n[8-5] 가상설계창 — 설계안 모양인가 · 얼마 나오는지 세는가 · 어떻게 고칠지 말하는가');
  await page.evaluate(() => { try { localStorage.removeItem('apex_dz_lab'); } catch (e) {} labOpen(); });
  await page.waitForTimeout(350);
  const sheetRows = await page.locator('.psheet tr').count();
  is(sheetRows > (D.cov || []).length, '가입설계 표에 담보가 다 놓인다 (줄 ' + sheetRows + ')');
  const amtBoxes = await page.locator('.psheet input.amt').count();
  is(amtBoxes === (D.cov || []).length - 1,
     '실손을 뺀 담보마다 가입금액 칸이 있다 (' + amtBoxes + '칸) — 실손은 금액이 아니라 담김/안 담김');
  is((await page.locator('.wsheet input').first().inputValue()) === '홍길동', '견본 이름은 홍길동이다');
  is(/실제 고객 이름을 넣지 마십시오/.test(await page.locator('.wnote').innerText()),
     '실제 고객 이름을 넣지 말라고 적어 둔다');
  is(/보험료는 계산하지 않습니다/.test(await page.locator('.lab-hd').innerText()),
     '보험료를 지어내지 않는다고 적어 둔다');

  /* 아무것도 안 넣으면 합계가 없어야 한다 */
  is((await page.locator('.paysum .n').innerText()).indexOf('—') >= 0, '가입금액을 안 넣으면 합계를 만들지 않는다');

  /* 넣은 대로 셈이 맞는가 — 진단비 1회 + 일당×일수 + 치료비×횟수 */
  await page.evaluate(() => {
    LAB.amt = { '일반암진단비': 5000, '입원일당': 3, '암주요치료비 (급여)': 500, '실손': 1 };
    LAB.dz = 'cancer_major'; LAB.days['cancer_major'] = 10; LAB.cnt['cancer_major'] = 4;
    labPaintOut();
  });
  await page.waitForTimeout(250);
  const sum = await page.locator('.paysum .n').innerText();
  /* 5000 + 3×10 + 500×4 = 7030만 */
  is(sum.replace(/[^0-9]/g, '') === '7030',
     '넣으신 금액과 일수·횟수로 정확히 센다 — 5,000 + 3×10 + 500×4 = 7,030만 (' + sum + ')');
  const payTxt = await page.locator('#detailPane').innerText();
  is(/3만 × 10일/.test(payTxt), '일당은 「1일당 × 일수」 로 셈을 보여 준다');
  is(/500만 × 4회/.test(payTxt), '치료비는 「1회당 × 횟수」 로 셈을 보여 준다');
  is(/실손은 실제 병원비에 따라 달라 합계에 넣지 않았습니다/.test(payTxt),
     '실손은 합계에 넣지 않고 따로 적는다');
  is(/지급을 약속하는 숫자가 아닙니다/.test(payTxt), '지급을 약속하는 값이 아니라고 밝힌다');

  /* 일수를 안 넣으면 안 세고, 안 셌다고 말해야 한다 */
  await page.evaluate(() => { LAB.days['cancer_major'] = 0; labPaintOut(); });
  await page.waitForTimeout(200);
  const noDay = await page.locator('#detailPane').innerText();
  is(/일수를 안 넣으셔서 안 셌습니다/.test(noDay), '일수를 안 넣으면 세지 않고 그렇다고 말한다');

  /* 어떻게 고칠지 — 없는 것은 「넣으십시오」, 기준선보다 작으면 「올리십시오」 */
  await page.evaluate(() => {
    LAB.amt = { '일반암진단비': 3000, '실손': 1 };
    LAB.days = {}; LAB.cnt = {}; labPaintOut();
  });
  await page.waitForTimeout(250);
  const fixTxt = await page.locator('#detailPane').innerText();
  is((await page.locator('.fx').count()) > 0, '고칠 자리를 짚어 준다 (' + (await page.locator('.fx').count()) + '곳)');
  is(/올리십시오/.test(fixTxt) && /기준선/.test(fixTxt),
     '기준선보다 작으면 「올리십시오」 라고 지금 금액과 기준선을 같이 말한다');
  is(/지금 3,000만 → 기준선 5,000만/.test(fixTxt.replace(/\s+/g, ' ')),
     '지금 금액과 올려야 할 금액을 함께 보여 준다');
  is(/넣으십시오/.test(fixTxt), '안 담은 자리는 「넣으십시오」 라고 말한다');
  is(/그대로 확정하지 마십시오/.test(fixTxt), '기준선을 확정하지 말라는 말이 붙는다');

  /* 앞뒤가 안 맞으면 잡는가 — 유사암이 일반암보다 큰 경우 */
  await page.evaluate(() => { LAB.amt['유사암진단비'] = 9000; labPaintOut(); });
  await page.waitForTimeout(200);
  is(/뒤집혔습니다|뒤집힌 구조/.test(await page.locator('#detailPane').innerText()),
     '유사암이 일반암보다 크면 뒤집혔다고 잡는다');

  /* 단계마다 무엇이 열리고 무엇이 비는지 */
  const stageTxt = await page.locator('#detailPane').innerText();
  is(/단계마다 무엇이 열리고 무엇이 빕니까/.test(stageTxt), '질병 단계별로 펼쳐진다');
  is(/안 담으신 것 ·/.test(stageTxt), '그 단계에서 안 담은 담보를 짚어 준다');


  console.log('\n[8-6] 약관 어디를 보나 — 자리를 짚어 주는가');
  await page.locator('button.btn', { hasText: '약관 어디를 보나' }).click();
  await page.waitForTimeout(250);
  const navTx = await page.locator('#detailPane').innerText();
  is(/약관 — 어디를 펴야 합니까/.test(navTx), '약관 지도가 열린다');
  is((await page.locator('.navq').count()) === (N.where || []).length,
     '질문 ' + (N.where || []).length + '가지가 모두 적힌다');
  is((await page.locator('.ordr .o').count()) === (N.order || []).length, '찾는 순서가 적힌다');
  is(/여기서 자주 틀립니다/.test(navTx), '질문마다 자주 틀리는 자리가 붙는다');
  is(/원문은 적지 않습니다/.test(navTx), '약관 원문은 안 적는다고 화면에 밝힌다');

  console.log('\n[9] 담보 말모이가 화면에 서는가 — 「이 돈이 무슨 돈인지」');
  await page.locator('button.btn', { hasText: '담보 말모이' }).click();
  await page.waitForTimeout(200);
  const dic = await page.locator('#detailPane').innerText();
  is(/담보 말모이 — 이 돈이 무슨 돈입니까/.test(dic), '말모이 화면이 열린다');
  const shown = (D.cov || []).filter(c => dic.indexOf(c.k) >= 0).length;
  is(shown === (D.cov || []).length, '말모이 ' + (D.cov || []).length + '개가 모두 적힌다 (' + shown + '개)');
  is(/여기에서 일합니다/.test(dic), '담보마다 어느 질병에서 일하는지 적힌다');

  console.log('\n[9-2] 용어 사전이 화면에 서는가');
  await page.locator('button.btn', { hasText: '용어 사전' }).click();
  await page.waitForTimeout(200);
  const tm = await page.locator('#detailPane').innerText();
  is(/용어 사전 — 진단서에 적힌 그 말/.test(tm), '용어 사전이 열린다');
  const tmShown = (D.terms || []).filter(t => tm.indexOf(t.t) >= 0).length;
  is(tmShown === (D.terms || []).length, '용어 ' + (D.terms || []).length + '개가 모두 적힌다 (' + tmShown + '개)');

  console.log('\n[10] 전부 펼쳐 인쇄 — 한 권으로 묶이는가');
  await page.evaluate(() => { window.print = function(){ window.__printed = 1; }; });
  await page.locator('button.btn', { hasText: '전부 펼쳐 인쇄' }).click();
  await page.waitForTimeout(700);
  const bookTxt = await page.locator('#detailPane').innerText();
  const bookMiss = D.list.filter(d => bookTxt.indexOf(d.name) < 0).map(d => d.name);
  is(bookMiss.length === 0, '질병 ' + D.list.length + '종이 한 번에 다 펼쳐진다' + (bookMiss.length ? ' — 빠짐: ' + bookMiss.join(' / ') : ''));
  is(await page.evaluate(() => window.__printed === 1), '펼친 뒤 인쇄창이 뜬다');

  console.log('\n[11] 좁은 화면 · 인쇄');
  await page.setViewportSize({ width: 390, height: 780 });
  await page.waitForTimeout(150);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  is(over <= 2, '390px 에서 옆으로 안 밀린다 (' + over + 'px)');

  /* 폰에서 머리와 도구줄이 화면을 다 먹으면, 설계사는 첫 화면에서 질병을
     하나도 못 본다 — 실제로 794px 아래로 밀려 있었다. 도구줄은 붙어 다니는
     줄이라 키가 크면 스크롤 내내 화면을 가린다. 그래서 둘 다 잰다. */
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const mob = await page.evaluate(() => {
    const bar = document.querySelector('.bar'), card = document.querySelector('.dcard');
    if (!bar || !card) return null;
    return { bar: Math.round(bar.getBoundingClientRect().height),
             card: Math.round(card.getBoundingClientRect().top + window.scrollY) };
  });
  is(!!mob, '390px 에서도 도구줄과 질병 카드가 서 있다');
  is(!!mob && mob.bar <= 120, '붙어 다니는 도구줄이 폰 화면을 가리지 않는다 (' + (mob ? mob.bar : '?') + 'px)');
  is(!!mob && mob.card <= 480, '폰 첫 화면에서 질병이 보인다 — 첫 카드가 ' + (mob ? mob.card : '?') + 'px 아래');
  is(/page-break-inside\s*:\s*avoid/.test(html), '인쇄에서 토막이 잘리지 않게 해 두었다');
  is(/\.dzart\.nolbl\.lbl\{display:inline;?\}/.test(html.replace(/\s+/g, '')),
     '종이에는 이름표를 켜서 인쇄한다 — 화면에서 꺼 뒀어도');
  is(/\.dzart-tools,\.dzart-hint\{display:none;?\}/.test(html.replace(/\s+/g, '')),
     '인쇄물에는 단추가 나가지 않는다');
  is(/@media\s+print/.test(html), '인쇄용 규칙이 있다');
  await page.close();


  /* ═══ 13. 겹쳐 받는 법 — 가르치는 화면이 실제로 가르치는가 ═══
     여기서 가장 위험한 것은 <b>그 병과 상관없는 담보를 권하는 것</b>이다.
     피부암 상담에서 뇌혈관질환수술비를 「＋ 얹으십시오」 로 띄우면
     그 자리에서 설계사가 신뢰를 잃는다. 그래서 그것부터 본다. */
  console.log('\n[13] 겹쳐 받는 법 — 가르치는 자리');
  const S = D.stack;
  is(!!S, '겹치기 자료가 한 벌 있다');
  is(S && S.law.length >= 3, '겹치기가 되는 이유를 ' + (S ? S.law.length : 0) + '가지 적어 둔다');
  is(S && S.rule.length >= 5, '층별 규칙이 ' + (S ? S.rule.length : 0) + '개다');
  is(S && S.no.length >= 4, '겹치지 <b>않는</b> 자리도 ' + (S ? S.no.length : 0) + '개 적어 둔다');
  is(S && S.ord.length >= 5, '예산이 빠듯할 때의 순서가 적혀 있다');

  /* 규칙의 담보 이름은 말모이 안에서만 */
  const covSet = new Set(D.cov.map(c => c.k));
  const ruleBad = [];
  (S ? S.rule : []).forEach(r => (r.layer || []).forEach(l =>
    (l.alt || []).forEach(k => { if (!covSet.has(k)) ruleBad.push(k); })));
  is(ruleBad.length === 0, '규칙이 부르는 담보 이름이 전부 말모이 안에 있다' +
     (ruleBad.length ? ' — 없는 이름: ' + ruleBad.join(', ') : ''));
  const anyBad = (S ? S.any : []).filter(k => !covSet.has(k));
  is(anyBad.length === 0, '「병을 가리지 않는 담보」 목록도 말모이 안에 있다' +
     (anyBad.length ? ' — ' + anyBad.join(', ') : ''));

  /* 층은 이름이 아니라 <b>역할</b>로 적는다 — 이름을 못 박으면 다른 병에서 회색으로 뜬다 */
  const noRole = [];
  (S ? S.rule : []).forEach(r => (r.layer || []).forEach(l => {
    if (!l.role || !l.alt || !l.alt.length || !l.d) noRole.push(r.n);
  }));
  is(noRole.length === 0, '층마다 <b>역할·후보·설명</b>이 다 있다' +
     (noRole.length ? ' — 빠짐: ' + [...new Set(noRole)].join(' / ') : ''));
  const noEx = (S ? S.rule : []).filter(r => !r.how || !r.watch || !r.ex).map(r => r.n);
  is(noEx.length === 0, '규칙마다 <b>겹치는 법 · 갈리는 자리 · 보기</b>가 다 붙어 있다' +
     (noEx.length ? ' — 빠짐: ' + noEx.join(' / ') : ''));
  is(!!(S && /심사/.test(S.tail)), '겹친다고 <b>지급을 약속하지 않는다</b> — 심사를 말한다');

  /* ── 브라우저 ── */
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  await page.evaluate(() => stackOpen('mi'));
  await page.waitForTimeout(400);
  const stkTxt = await page.locator('#detailPane').innerText();
  is(stkTxt.length > 3000, '겹쳐 받는 법 화면이 선다 (' + stkTxt.length + '자)');
  is(await page.locator('.stk-rule').count() >= 5, '층별 규칙이 화면에 다 선다');

  /* 동시에 열리는 개수는 <b>자료에 적지 않고 흐름에서 센다.</b>
     화면이 세는 값과 path 에서 직접 센 값이 같아야 한 벌에서 나온 것이다. */
  const cnts = await page.locator('.stk-st .cnt').allInnerTexts();
  const mi = D.list.find(d => d.id === 'mi');
  const want = (mi.path || []).map(st => new Set((st.pay || []).map(p => p.k)).size);
  const got = cnts.map(t => parseInt(t, 10));
  is(JSON.stringify(got) === JSON.stringify(want),
     '동시에 열리는 개수를 <b>치료 흐름에서 센다</b> — 자료에 따로 적지 않는다 (' +
     got.join('·') + ' vs ' + want.join('·') + ')');

  /* 상관없는 담보를 권하지 않는다 — 피부암 화면에 뇌·심장 전용이 ＋ 로 뜨면 안 된다 */
  await page.evaluate(() => stackOpen('skin'));
  await page.waitForTimeout(400);
  const canTxt = (await page.locator('.stk-rule .r.can').allInnerTexts()).join(' ');
  const wrong = ['뇌혈관질환수술비', '허혈성심장질환수술비', '뇌혈관질환 (전체)', '허혈성심장질환 (전체)']
    .filter(k => canTxt.indexOf(k) >= 0);
  is(wrong.length === 0, '피부암 상담에 <b>뇌·심장 전용 담보를 권하지 않는다</b>' +
     (wrong.length ? ' — 권하고 있음: ' + wrong.join(', ') : ''));
  is(canTxt.length > 0, '피부암에서도 얹을 자리는 짚어 준다');

  /* 질병을 바꾸면 ✓ 조합이 실제로 달라진다 — 한 벌에서 나온다는 증거 */
  const hasOf = async id => {
    await page.evaluate(i => stackOpen(i), id);
    await page.waitForTimeout(300);
    return (await page.locator('.stk-rule .r.has .nm').allInnerTexts()).join('|');
  };
  const hMi = await hasOf('mi'), hCan = await hasOf('cancer_major');
  is(hMi !== hCan && hMi.length > 0 && hCan.length > 0,
     '질병을 바꾸면 <b>겹치는 자리가 실제로 달라진다</b>');

  /* 치료 흐름 아래의 겹침 한 줄이 모든 질병에 붙는가 */
  let miniN = 0;
  for (const d of D.list) {
    await page.evaluate(i => open_(i), d.id);
    await page.waitForTimeout(90);
    if (await page.locator('.stk-mini').count()) miniN++;
  }
  is(miniN === D.list.length, '질병마다 치료 흐름 아래에 <b>몇 개가 동시에 열리는지</b> 한 줄이 붙는다 (' +
     miniN + '/' + D.list.length + ')');

  /* 들머리는 한 곳만 안다 — 삼항 사슬로 늘어놓지 않는다 */
  is(!/hash === '/.test(html) && /var GOTO = \{/.test(html),
     '「어디로 갈 것인가」를 <b>표 하나</b>로 둔다 — 삼항 사슬로 늘어놓지 않는다');
  /* 프래그먼트만 바꾸면 브라우저가 다시 열지 않는다 — 그러면 이전 화면을
     그대로 읽고 여섯 개가 전부 통과해 버린다. 실제로 그렇게 헛것을 잡고 있었다.
     그래서 <b>매번 새 창</b>에서 연다. 그리고 화면마다 다른 글이 나오는지 본다. */
  const seenTxt = {};
  for (const to of ['stack', 'drill', 'lab', 'nav', 'cov', 'terms']) {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await pg.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}#${to}`,
                  { waitUntil: 'networkidle' });
    await pg.waitForTimeout(500);
    const t = await pg.locator('#detailPane').innerText();
    seenTxt[to] = t.length;
    is(t.length > 400, '#' + to + ' 로 바로 들어가진다 (' + t.length + '자)');
    await pg.close();
  }
  is(new Set(Object.values(seenTxt)).size === Object.keys(seenTxt).length,
     '들머리마다 <b>서로 다른 화면</b>이 열린다 — 같은 화면을 여섯 번 세지 않는다 (' +
     Object.keys(seenTxt).map(k => k + ':' + seenTxt[k]).join(' · ') + ')');
  await page.close();


  /* ═══ 14. 도해 — 안 보이게 깨진 그림이 없는가 ═══
     색 값 한 글자가 깨지면 브라우저는 <b>말없이 그 도형을 안 그립니다.</b>
     실제로 stroke="#B3A?596" 하나 때문에 뇌 주름 120줄이 통째로 사라졌고,
     콘솔에도 아무 말이 없었습니다. 그래서 색 값을 전부 훑습니다. */
  console.log('\n[14] 도해 — 안 보이게 깨진 그림이 없는가');
  const vizSrc = fs.readFileSync('app/질병가이드-도해.js', 'utf8');

  is(/var KEYS = Object\.keys\(V\)/.test(vizSrc),
     '그림 목록을 <b>V 에서 바로 뽑는다</b> — 손으로 적어 두면 새 그림이 조용히 사라진다');

  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const vizListN = await page.evaluate(() => window.DZ_VIZ.keys.length);
  const vizDefN = (vizSrc.match(/^\s{2}V\.[a-z_0-9]+ = \{/gm) || []).length;
  is(vizListN === vizDefN, '그린 그림이 ' + vizDefN + '장, 목록에 선 그림이 ' + vizListN + '장 — 같다');

  /* 색 값이 실제로 색인가 */
  const badCol = [];
  (vizSrc.match(/(?:fill|stroke|stop-color)="[^"]*"/g) || []).forEach(v => {
    const val = v.split('="')[1].slice(0, -1);
    if (val.indexOf("' +") >= 0 || val.indexOf('url(') === 0) return;   /* 코드로 끼워 넣는 자리 */
    if (val === 'none' || val === 'currentColor') return;
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{8}$/.test(val)) return;
    if (/^(rgb|rgba|hsl)\(/.test(val)) return;
    badCol.push(v);
  });
  is(badCol.length === 0, '색 값이 전부 진짜 색이다 — 오타 하나로 도형이 <b>말없이 사라지지</b> 않는다' +
     (badCol.length ? ' — 깨짐: ' + badCol.slice(0, 4).join(' / ') : ''));

  /* SVG 안의 <text> 에는 <b> 를 쓸 수 없다. 넣으면 브라우저가 그 자리에서
     문서를 포기하고 <b>그 뒤 전부를 맨 글자로 흘려 버린다</b> — 그림 한 장이
     아니라 화면 아래가 통째로 무너진다. 실제로 투석 그림에서 그랬다. */
  const bTag = [];
  (vizSrc.match(/(?:lbl|note)\([^;]*?\);/gs) || []).forEach(v => {
    if (v.indexOf('<b>') >= 0) bTag.push(v.slice(0, 70).replace(/\s+/g, ' '));
  });
  is(bTag.length === 0, '이름표 글에 <b> 를 쓰지 않는다 — SVG 글자칸은 <b> 를 모른다' +
     (bTag.length ? ' — 들어 있음: ' + bTag.slice(0, 3).join(' / ') : ''));

  /* 그림마다 실제로 도형이 들어 있는가 — 빈 껍데기를 세우지 않는다 */
  const thin = await page.evaluate(() => {
    const out = [];
    window.DZ_VIZ.keys.forEach(k => {
      const o = window.DZ_VIZ.get(k) || {};
      const n = ((o.html || '').match(/<(path|circle|ellipse|rect|line|polyline|polygon|text)\b/g) || []).length;
      if (n < 15) out.push(k + '(' + n + ')');
    });
    return out;
  });
  is(thin.length === 0, '그림마다 도형이 들어 있다 — 빈 껍데기가 없다' +
     (thin.length ? ' — 얇음: ' + thin.join(', ') : ''));

  /* 뇌·심장은 <b>사실 그림</b>이 붙어야 한다 — 상담에서 가장 많이 갈리는 자리다 */
  const deep = await page.evaluate(() => {
    const cnt = k => {
      const o = window.DZ_VIZ.get(k) || {};
      return ((o.html || '').match(/<(path|circle|ellipse|rect|line|polyline|polygon)\b/g) || []).length;
    };
    return { heart: cnt('heart_coro'), heartDead: cnt('heart_dead'),
             brain: cnt('brain_terr'), brainVs: cnt('brain_vs') };
  });
  is(deep.heart >= 300 && deep.heartDead >= 300,
     '심장을 <b>사실 그림</b>으로 그렸다 (관상동맥 ' + deep.heart + '도형 · 막힌 자리 ' + deep.heartDead + '도형)');
  is(deep.brain >= 300 && deep.brainVs >= 300,
     '뇌를 <b>사실 그림</b>으로 그렸다 (구역 ' + deep.brain + '도형 · 막힘/터짐 ' + deep.brainVs + '도형)');

  /* 질병마다 <b>사실 그림</b>이 하나 이상 붙어야 한다. 도식(색칠한 판)만
     붙어 있으면 고객 앞에서 「그림으로 보여 드리겠습니다」 가 안 된다. */
  const noReal = await page.evaluate(() => {
    const out = [];
    window.DZ_DATA.list.forEach(d => {
      const g = window.DZ_VIZ.forDz(d.id) || [];
      const real = g.filter(o =>
        ((o.html || '').match(/<(path|circle|ellipse|rect|line|polyline|polygon)\b/g) || []).length >= 150);
      if (!real.length) out.push(d.name);
    });
    return out;
  });
  is(noReal.length === 0, '질병 ' + D.list.length + '종 <b>전부</b> 사실 그림이 하나 이상 붙는다' +
     (noReal.length ? ' — 도식뿐: ' + noReal.join(' / ') : ''));

  /* 뇌경색과 뇌출혈을 <b>한 그림에서 견주는</b> 장이 있어야 한다 */
  const vsTxt = await page.evaluate(() => (window.DZ_VIZ.get('brain_vs') || {}).d || '');
  is(/뇌경색/.test(vsTxt) && /뇌출혈/.test(vsTxt) && /범위/.test(vsTxt),
     '막힌 것과 터진 것을 견주고, <b>담보 범위</b>로 이어 말한다');
  await page.close();


  /* ═══ 15. 전이와 합병증 — 지어내지 않고, 담보로 이어지는가 ═══
     이 두 자리는 겁을 주기 가장 쉬운 자리다. 그래서 확인한다 —
     자리마다 <b>무엇을 하는가</b>와 <b>그때 열리는 담보</b>가 붙어 있는지,
     비율(몇 %) 같은 외운 숫자를 적지 않았는지, 그리고 담보 이름이
     전부 말모이 안에 있는지. */
  /* 코드를 비워 둔 질병에서 화면이 실제로 <b>「적지 않았습니다」 라고 말하는지</b>를
     소스가 아니라 <b>그 질병을 열어</b> 확인한다. 소스에서 낱말만 찾으면 다른 곳에
     같은 말이 있어 늘 통과한다 — 실제로 그렇게 헛것을 잡고 있었다.
     다만 이 점검도 「엉뚱한 코드를 끌어다 쓰지 않았는지」 까지는 못 본다.
     다른 병의 코드도 표 안에 있는 코드이기 때문이다 — 그 판단은 사람이 한다. */
  console.log('\n[14-2] 코드를 모르는 질병');
  const noCodeDz = (D.list || []).filter(d => !(d.codes || []).length);
  if (noCodeDz.length) {
    const pg2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await pg2.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
    await pg2.evaluate(i => open_(i), noCodeDz[0].id);
    await pg2.waitForTimeout(300);
    const nc = await pg2.locator('.nocode').count();
    const ncTxt = nc ? await pg2.locator('.nocode').innerText() : '';
    is(nc === 1 && /적지 않았습니다/.test(ncTxt),
       '코드를 비워 둔 질병(' + noCodeDz.map(d => d.name).join(' / ') + ')을 열면 ' +
       '화면이 <b>「적지 않았습니다」 라고 말한다</b> — 빈칸으로 두지 않는다');
    await pg2.close();
  } else {
    is(true, '코드를 비워 둔 질병이 없다');
  }

  console.log('\n[15] 전이와 합병증');
  const SP = D.spread, CP = D.comp;
  is(!!SP, '전이 자료가 한 벌 있다');
  is(!!CP, '합병증 자료가 한 벌 있다');
  is(SP && SP.how.length >= 3, '가는 길을 ' + (SP ? SP.how.length : 0) + '가지로 나눠 적었다');
  is(SP && SP.where.length >= 5, '전이가 잘 가는 자리가 ' + (SP ? SP.where.length : 0) + '곳 적혀 있다');

  /* 겁만 주고 끝나지 않는다 — 자리마다 「무엇을 합니까」와 담보가 붙어야 한다 */
  const spHole = (SP ? SP.where : []).filter(w =>
    !w.why || !w.fear || !(w.sign || []).length || !(w.care || []).length ||
    !(w.cov || []).length || !w.talk).map(w => w.k);
  is(spHole.length === 0, '자리마다 <b>무엇을 하는가</b>와 <b>그때 열리는 담보</b>가 붙어 있다 — 겁만 주고 끝내지 않는다' +
     (spHole.length ? ' — 빠짐: ' + spHole.join(' / ') : ''));

  const covSet2 = new Set(D.cov.map(c => c.k));
  const spCovBad = [];
  (SP ? SP.where : []).forEach(w => (w.cov || []).forEach(k => { if (!covSet2.has(k)) spCovBad.push(w.k + ':' + k); }));
  is(spCovBad.length === 0, '전이에서 부르는 담보가 전부 말모이 안에 있다' +
     (spCovBad.length ? ' — ' + spCovBad.join(', ') : ''));

  /* 가리키는 질병과 자리가 실재하는가 — 없는 것을 가리키면 화면이 빕니다 */
  const whereK = new Set((SP ? SP.where : []).map(w => w.k));
  const dzIdSet = new Set(D.list.map(d => d.id));
  const linkBad = [];
  Object.keys((SP && SP.byDz) || {}).forEach(id => {
    if (!dzIdSet.has(id)) linkBad.push('없는 질병 ' + id);
    ((SP.byDz[id]) || []).forEach(w => { if (!whereK.has(w)) linkBad.push(id + ' → 없는 자리 ' + w); });
  });
  is(linkBad.length === 0, '「이 암은 어디로」 가 가리키는 질병과 자리가 전부 실재한다' +
     (linkBad.length ? ' — ' + linkBad.join(' / ') : ''));

  /* 외운 숫자를 적지 않는다 — 전이율·생존율 같은 퍼센트는 자료마다 다르다 */
  const spTxt = JSON.stringify(SP || {});
  const pct = spTxt.match(/[0-9]+\s*(%|퍼센트)/g) || [];
  is(pct.length === 0, '전이에 <b>비율(몇 %)을 적지 않는다</b> — 자료마다 다르고 개정된다' +
     (pct.length ? ' — 적혀 있음: ' + pct.slice(0, 4).join(', ') : ''));

  /* 합병증 — 질병 전부에 붙었는가 · 담보와 화법이 있는가 */
  const cpMiss = D.list.filter(d => !((CP && CP.byDz) || {})[d.id]).map(d => d.name);
  is(cpMiss.length === 0, '질병 ' + D.list.length + '종 <b>전부</b> 합병증이 붙어 있다' +
     (cpMiss.length ? ' — 없음: ' + cpMiss.join(' / ') : ''));

  let cpN = 0; const cpHole = [], cpCovBad = [];
  Object.keys((CP && CP.byDz) || {}).forEach(id => {
    (CP.byDz[id] || []).forEach(c => {
      cpN++;
      if (!c.k || !c.when || !c.why || !(c.sign || []).length || !c.say) cpHole.push(id + ':' + (c.k || '?'));
      (c.cov || []).forEach(k => { if (!covSet2.has(k)) cpCovBad.push(id + ':' + k); });
    });
  });
  is(cpN >= 30, '합병증이 ' + cpN + '가지 적혀 있다');
  is(cpHole.length === 0, '합병증마다 <b>언제·왜·무엇이 보이면·어떻게 말하는가</b>가 다 있다' +
     (cpHole.length ? ' — 빠짐: ' + cpHole.slice(0, 5).join(' / ') : ''));
  is(cpCovBad.length === 0, '합병증에서 부르는 담보가 전부 말모이 안에 있다' +
     (cpCovBad.length ? ' — ' + cpCovBad.slice(0, 5).join(', ') : ''));

  /* 단정하지 않는다 */
  is(!!(SP && /주치의|심사/.test(SP.tail)) && !!(CP && /주치의|심사/.test(CP.tail)),
     '둘 다 <b>주치의와 심사</b>로 닫는다 — 전이도 합병증도 단정하지 않는다');

  /* ── 브라우저 ── */
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  await page.evaluate(() => spreadOpen('cancer_major'));
  await page.waitForTimeout(400);
  const spTxt2 = await page.locator('#detailPane').innerText();
  is(spTxt2.length > 2500, '전이 화면이 선다 (' + spTxt2.length + '자)');
  is(await page.locator('.spr-w.on').count() > 0, '고른 암이 <b>잘 가는 자리</b>가 표시된다');
  is(/이 암이 잘 가는 자리/.test(spTxt2), '그 암이 가는 자리를 그 자리에서 짚어 준다');

  /* 질병을 바꾸면 짚이는 자리가 달라진다 — 한 벌에서 나온다는 증거 */
  const onOf = async id => {
    await page.evaluate(i => spreadOpen(i), id);
    await page.waitForTimeout(280);
    return (await page.locator('.spr-w.on .wh b').allInnerTexts()).join('|');
  };
  const a1 = await onOf('cancer_major'), a2 = await onOf('thyroid');
  is(a1 !== a2 && a1.length > 0 && a2.length > 0, '질병을 바꾸면 <b>짚이는 자리가 실제로 달라진다</b>');

  await page.evaluate(() => compOpen('chronic'));
  await page.waitForTimeout(400);
  const cpTxt = await page.locator('#detailPane').innerText();
  is(await page.locator('.cmp-c').count() >= 3, '합병증 화면이 서고 여러 가지가 나온다');
  is(/투석/.test(cpTxt), '당뇨의 종착역(투석)을 합병증에서 짚는다');
  is(await page.locator('.cmp-c .covs .pay').count() > 0, '합병증마다 <b>그때 열리는 담보</b>를 누를 수 있다');

  /* 질병 상세가 <b>한 줄기</b>인가 — 재발 → 전이 → 합병증 → 얼마 듭니까.
     처음에는 짧은 칸 + 「→ 보러 가기」 단추였다. 대표님이 「학습자료인데 왜 따로
     있느냐」 고 하셨고 맞는 말이다. 이제 <b>그 자리에 전문을 편다.</b>
     그래서 여기서도 단추가 아니라 <b>알맹이가 실제로 있는지</b>를 본다. */
  let miniS = 0, miniC = 0, miniR = 0, miniCost = 0;
  for (const d of D.list) {
    await page.evaluate(i => open_(i), d.id);
    await page.waitForTimeout(90);
    if (await page.locator('.spr-w').count()) miniS++;
    if (await page.locator('.cmp-c').count()) miniC++;
    if (await page.locator('.rlg').count()) miniR++;
    if (await page.locator('.qcshield').count()) miniCost++;
  }
  is(miniC === D.list.length, '질병마다 상세에 <b>합병증 전문</b>이 이어 붙는다 (' + miniC + '/' + D.list.length + ')');
  is(miniR === D.list.length, '질병마다 상세에 <b>재발</b> 칸이 붙는다 (' + miniR + '/' + D.list.length + ')');
  is(miniCost === D.list.length, '질병마다 상세에 <b>얼마 듭니까</b>가 붙는다 (' + miniCost + '/' + D.list.length + ')');
  is(miniS === Object.keys((SP && SP.byDz) || {}).filter(k => (SP.byDz[k] || []).length).length,
     '전이는 <b>경로를 적어 둔 암에만</b> 붙는다 (' + miniS + '개) — 없는 질병에 지어내 붙이지 않는다');
  await page.close();

  /* ═══ 8-3. 범위 표 ═══
     대표님이 「뇌혈관코드·심장전체코드가 세부별로 나와있지도 않은데 정확히
     확인했니」 라고 물었을 때, 나는 확인하지 않았다. 표에는
     「약 10% 수준」 「약 90% 이상」 같은 <b>출처 없는 비율</b>이 적혀 있었고,
     범위로 적어 둔 I60~I69 안의 I66·I68·I69 는 앱의 KCD 표에 아예 없었다.
     그런데 <b>범위 표를 보는 점검이 한 줄도 없었다.</b> 그래서 여기 둔다. */
  console.log('\n[16] 범위 표 — 비율을 지어내지 않는가 · 코드를 빠짐없이 펴 두었는가');
  const RANGED = (D.list || []).filter(d => d.range);
  is(RANGED.length > 0, '범위 표가 있는 질병을 찾았다 — ' + RANGED.length + '종');

  const rPct = [];
  RANGED.forEach(d => {
    if (/[0-9]+\s*(%|퍼센트)/.test(JSON.stringify(d.range))) rPct.push(d.id);
  });
  is(rPct.length === 0,
     '범위 표에 <b>비율(몇 %)을 적지 않는다</b> — 확인한 출처가 없는 숫자다' +
     (rPct.length ? ' — ' + rPct.join(' / ') : ''));

  /* 앱이 AI 에게 보내는 지시문에도 같은 비율이 <b>한 벌 더</b> 있었다.
     한쪽만 고치면 화면과 리포트가 다른 말을 한다. */
  const brainLine = (app.match(/^.*뇌출혈 I60.*$/m) || [''])[0];
  const heartLine = (app.match(/^.*급성심근경색 I21.*$/m) || [''])[0];
  is(brainLine && heartLine, '앱 지시문에서도 뇌·심장 범위 줄을 찾았다');
  is(!/[0-9]+\s*%/.test(brainLine + heartLine),
     '앱 지시문에도 <b>같은 비율이 남아 있지 않다</b> — 쌍둥이를 함께 지웠다');

  /* 이름을 앱 KCD 표에서 <b>그대로 가져다 견준다.</b> 외워 적었더니 여섯 자리가
     틀려 있었다 — 「거미막밑출혈」(→거미막하출혈) · 「폐색·협착」(→폐쇄 및 협착) ·
     「만성 허혈심장질환」(→만성 허혈심장병). 진단서에 찍히는 이름과 한 글자라도
     다르면 설계사가 코드 검색창에서 그 병을 못 찾는다. */
  const KNAME = new Map([...kcdBlk.matchAll(/\['([A-Z][0-9]{2})','([^']+)'/g)].map(m => [m[1], m[2]]));

  /* ○ 보다 △ 가, △ 보다 — 가 좁다. 왼쪽 담보가 오른쪽보다 넓을 수는 없다. */
  const RANK = { 0: 0, 2: 1, 1: 2 };

  const rBad = [], rShape = [], rGap = [], rMono = [], rName = [];
  RANGED.forEach(d => {
    const cols = d.range.cols || [], rows = d.range.rows || [];
    if (!cols.length || !rows.length) { rShape.push(d.id + ' 빈 표'); return; }
    rows.forEach(r => {
      const code = r[0];
      if (!CODES.has(code)) rBad.push(d.id + ':' + code);
      else if (KNAME.get(code) !== r[1]) rName.push(d.id + ':' + code + ' 「' + r[1] + '」≠「' + KNAME.get(code) + '」');
      if (!r[1]) rShape.push(d.id + ':' + code + ' 진단명 없음');
      if (r.length !== cols.length + 2) rShape.push(d.id + ':' + code + ' 칸 수가 담보 수와 다름');
      for (let i = 2; i < r.length; i++) {
        if (![0, 1, 2].includes(r[i])) rShape.push(d.id + ':' + code + ' 알 수 없는 표시 ' + r[i]);
        if (i > 2 && RANK[r[i - 1]] > RANK[r[i]]) rMono.push(d.id + ':' + code);
      }
    });
    /* 세부별로 <b>빠짐없이</b> 폈는가. 줄 차례는 담보 범위 순이라 번호순이 아니다 —
       그래서 정렬해 놓고 구멍만 본다. I60 다음이 I63 이면 가운데가 비어 있다. */
    const ns = rows.map(r => parseInt(r[0].slice(1), 10)).sort((a, b) => a - b);
    for (let i = 1; i < ns.length; i++) {
      if (ns[i] === ns[i - 1]) rGap.push(d.id + ': 같은 코드가 두 줄 ' + ns[i]);
      else if (ns[i] !== ns[i - 1] + 1) rGap.push(d.id + ':' + rows[0][0][0] + ns[i - 1] + '→' + rows[0][0][0] + ns[i]);
    }
    /* <b>어디서 읽었는지</b> 적혀 있는가. 이 표는 외워 적으면 안 되는 표다. */
    if (!(d.src || []).some(x => /질병·?사인분류|KCD/.test(x[0]))) rName.push(d.id + ' KCD 출처가 src 에 없음');
  });
  is(rBad.length === 0, '범위 표의 코드가 <b>전부 앱의 KCD 표에 있다</b>' +
     (rBad.length ? ' — 없는 코드: ' + rBad.join(' / ') : ''));
  is(rName.length === 0, '진단명이 <b>앱 KCD 표와 한 글자까지 같다</b> · 어디서 읽었는지 src 에 적었다' +
     (rName.length ? ' — ' + rName.join(' / ') : ''));
  is(rShape.length === 0, '범위 표의 칸이 담보 수와 맞고 표시가 ○·—·△ 뿐이다' +
     (rShape.length ? ' — ' + rShape.join(' / ') : ''));
  is(rGap.length === 0, '코드를 <b>한 자리도 건너뛰지 않고</b> 폈다 — 「I60~I69」 라고만 적고 넘어가지 않는다' +
     (rGap.length ? ' — 건너뛴 자리: ' + rGap.join(' / ') : ''));
  is(rMono.length === 0, '좁은 담보에 드는 코드는 <b>넓은 담보에도 든다</b> — 표가 뒤집히지 않았다' +
     (rMono.length ? ' — ' + rMono.join(' / ') : ''));

  /* 화면에 실제로 찍히는가 — 자료만 고치고 그리는 자리를 안 고친 적이 있다 */
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.evaluate(i => open_(i), RANGED[0].id);
  await page.waitForTimeout(150);
  const rTxt = await page.locator('.range').innerText();
  is(RANGED[0].range.rows.every(r => rTxt.indexOf(r[0]) >= 0),
     '펴 둔 코드가 <b>화면에 한 줄씩 다 찍힌다</b>');
  is(/약관/.test(rTxt) && /회사·개정회차/.test(rTxt),
     '무엇이 지급되는지는 <b>그 상품 약관이 정한다</b>고 화면에 적는다 — 이 표를 결론으로 읽지 않게');
  is(!/[0-9]+\s*%/.test(rTxt), '화면에 찍힌 범위 표에도 비율이 없다');
  await page.close();

  /* ═══ 8-4. 코드로 찾기 ═══
     1,491개 질병 코드를 한 벌로 들여왔다. 이 표가 조용히 어긋나면
     설계사가 진단서를 들고 <b>엉뚱한 갈래</b>를 펴게 된다.

     ★ 이 표는 <b>담보를 정하지 않는다.</b> 「어느 갈래를 보십시오」 까지다.
       그 말이 화면에서 사라지면 결론으로 읽힌다 — 그것도 여기서 본다.       */
  console.log('\n[17] 코드로 찾기 — 코드 표가 한 벌인가 · 담보를 정하지 않는가');
  is(!!(KCD && KCD.rows && KCD.rows.length > 1500),
     'KCD 코드 표가 읽힌다 — ' + ((KCD && KCD.rows) ? KCD.rows.length : 0) + '벌');
  is(/<script src="\.\.\/질병가이드-코드\.js"><\/script>/.test(html), '가이드가 코드 표를 싣는다');

  /* 이름을 <b>사람이 타이핑하지 않았다</b>는 것이 이 표의 값어치다.
     어디서 받았는지가 없으면 다음 사람이 손으로 고치기 시작한다. */
  is(!!(KCD.src && KCD.src.u && KCD.src.got), '<b>어디서 언제 받았는지</b>가 표에 적혀 있다');
  is(fs.existsSync(path.join(ROOT, 'scripts/kcd-fetch.js')),
     '다시 받아 오는 스크립트가 있다 — 개정되면 손으로 고치지 않는다');

  /* 코드마다 이름이 있고, 3자리 꼴이며, 두 번 적히지 않았다 */
  const kSeen = new Set(), kBad = [];
  KCD.rows.forEach(r => {
    if (!/^[A-Z][0-9]{2}$/.test(r[0])) kBad.push('꼴이 이상함 ' + r[0]);
    /* 처음엔 「두 글자보다 짧으면 이름 없음」 으로 잡았다. 그랬더니 <b>B86 「옴」</b>이
       걸렸다 — 한 글자짜리 진짜 KCD 이름이다. 헛것을 잡는 점검은 안 잡는 점검보다
       나쁘므로, <b>비어 있는 것만</b> 잡는다. */
    if (!r[1]) kBad.push('이름 없음 ' + r[0]);
    if (kSeen.has(r[0])) kBad.push('두 번 적힘 ' + r[0]);
    kSeen.add(r[0]);
  });
  is(kBad.length === 0, '코드가 3자리 꼴이고 이름이 있고 <b>두 번 적히지 않았다</b>' +
     (kBad.length ? ' — ' + kBad.slice(0, 5).join(' / ') : ''));

  /* 진단명과 그렇지 않은 것을 <b>갈라 놓는다.</b>
     X00(불에 노출)을 질병으로 착각하면 상담이 통째로 어긋난다. */
  const kKinds = {};
  KCD.rows.forEach(r => { const k = KCD.kind(r[0]); kKinds[k] = (kKinds[k] || 0) + 1; });
  is((kKinds['외인'] || 0) > 300 && (kKinds['증상'] || 0) > 50 && (kKinds['보건'] || 0) > 50,
     '사고 원인·증상·검진 코드를 <b>진단명과 갈라 둔다</b> — ' +
     Object.keys(kKinds).map(k => k + ' ' + kKinds[k]).join(' · '));
  is(KCD.kind('X00') === '외인' && KCD.kind('R42') === '증상' && KCD.kind('Z11') === '보건' &&
     KCD.kind('C18') === '질병', '표본 넷이 제 갈래에 든다 (X00·R42·Z11·C18)');
  is(KCD.area('X00') === null && KCD.area('C18') === '암',
     '진단명이 아닌 코드에는 <b>담보 갈래를 붙이지 않는다</b>');

  /* 지도가 가리키는 곳이 <b>실재하는 질병</b>인가 */
  const kIds = new Set(D.list.map(d => d.id));
  const kGhost = [...new Set(KCD.rows.map(r => KCD.dz(r[0])).filter(x => x && !kIds.has(x)))];
  is(kGhost.length === 0, '지도가 <b>있는 상담자료만</b> 가리킨다' +
     (kGhost.length ? ' — 없는 질병: ' + kGhost.join(' / ') : ''));

  /* 질병 자료가 적어 둔 코드는 <b>전부 이어져야</b> 한다.
     자료에는 있는데 코드에서 못 찾으면, 설계사가 진단서를 들고 헤맨다. */
  const kMiss = [];
  D.list.forEach(d => (d.codes || []).forEach(c => { if (!KCD.dz(c[0])) kMiss.push(d.id + ':' + c[0]); }));
  is(kMiss.length === 0, '질병 자료가 적어 둔 코드가 <b>전부 상담자료로 이어진다</b>' +
     (kMiss.length ? ' — 못 이음: ' + kMiss.slice(0, 8).join(' / ') : ''));

  /* 어느 질병도 코드에서 <b>못 닿는 채로</b> 남지 않는다 */
  const kHit = new Set(KCD.rows.map(r => KCD.dz(r[0])).filter(Boolean));
  const kOrphan = D.list.filter(d => !kHit.has(d.id)).map(d => d.id);
  is(kOrphan.length === 0, '질병 ' + D.list.length + '종 <b>전부</b> 코드에서 닿는다' +
     (kOrphan.length ? ' — 못 닿음: ' + kOrphan.join(' / ') : ''));

  /* 화면에서 실제로 찾아진다 — 자료만 고치고 그리는 자리를 안 고친 적이 있다 */
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => kcdOpen(''));
  await page.waitForTimeout(200);
  await page.fill('#kcdQ', 'I63');
  await page.waitForTimeout(250);
  const kTxt = await page.locator('#kcdRes').innerText();
  is(/I63/.test(kTxt) && /뇌경색증/.test(kTxt), '코드를 넣으면 <b>KCD 이름</b>이 나온다 (I63)');
  is((await page.locator('.kcdr .go button').count()) > 0, '이어진 상담자료로 <b>갈 수 있다</b>');

  await page.fill('#kcdQ', 'X00');
  await page.waitForTimeout(250);
  const kX = await page.locator('#kcdRes').innerText();
  is(/진단명이 아닙니다/.test(kX), '사고 원인 코드에는 <b>「진단명이 아닙니다」</b> 라고 적는다');

  await page.fill('#kcdQ', 'ZZZZZ');
  await page.waitForTimeout(250);
  is(/지어내지 않습니다/.test(await page.locator('#kcdRes').innerText()),
     '없는 코드에는 <b>지어내지 않는다</b>고 적는다');

  const kAll = await page.locator('#detailPane').innerText();
  is(/약관의 분류표/.test(kAll) && /회사·개정회차/.test(kAll),
     '<b>이 표는 담보를 정하지 않는다</b>고 화면에 적는다');
  is(/kcdcode\.kr/.test(kAll) && /KOICD/.test(kAll),
     '어디서 받았는지와 <b>못 들어간 곳(KOICD)</b>을 화면에 적는다');
  await page.close();

  /* ═══ 8-5. 얼마 듭니까 ═══
     고객이 정말 묻는 것은 「그 병 걸리면 얼마 드느냐」 다. 그런데 이 자리가
     제일 지어내기 쉽다 — 그럴듯한 금액은 아무도 안 물어보고 믿는다.

     그래서 여기서는 <b>숫자마다 근거가 붙어 있는가</b>를 본다. 그리고
     <b>제도 숫자는 해마다 바뀐다</b>고 화면이 말하는지, 자료가 없는 병에는
     <b>없다고 적는지</b>를 본다.                                            */
  console.log('\n[18] 얼마 듭니까 — 숫자마다 근거가 붙었는가 · 없는 것을 지어내지 않는가');
  const C = D.cost;
  is(!!(C && C.head && C.shield && C.gap && C.byDz && C.tail && C.src),
     '비용 자료가 여섯 토막을 다 갖췄다 (머리·막아주는것·남는셋·질병별·꼬리·출처)');

  /* 출처가 <b>진짜 주소</b>인가. 제목만 적고 링크가 없으면 확인할 길이 없다 */
  const cSrcBad = (C.src || []).filter(r => !(r && r[0] && /^https:\/\//.test(r[1] || '')));
  is(cSrcBad.length === 0, '출처마다 <b>제목과 주소</b>가 다 있다 — ' + (C.src || []).length + '벌' +
     (cSrcBad.length ? ' / 모자란 것 ' + cSrcBad.length : ''));

  /* ★ 여기가 이 점검의 핵심이다.
     <b>숫자가 적힌 칸에는 반드시 근거 번호(s)가 붙어야 한다.</b>
     붙어 있지 않으면 화면에 「근거 ↗」 없이 금액만 찍힌다 — 그게 지어낸 것과
     구별이 안 된다. 숫자가 없는 설명 칸까지 잡으면 헛것이 되므로,
     <b>금액·기간 꼴</b>(만원 · 원 · %  · 일 · 개월)이 있는 것만 본다. */
  const NUMY = /[0-9][0-9,]*\s*(만원|억|원|%|일|개월|년간|배)/;
  const cNoSrc = [];
  const srcOK = s => Number.isInteger(s) && s >= 0 && s < (C.src || []).length;
  (C.shield || []).forEach(x => {
    const t = (x.k || '') + (x.d || '') + (x.w || '');
    if (NUMY.test(t) && !srcOK(x.s)) cNoSrc.push('막아주는것 · ' + x.k);
  });
  Object.keys(C.byDz || {}).forEach(id => (C.byDz[id] || []).forEach(r => {
    const t = (r.v || '') + (r.n || '');
    if (NUMY.test(t) && !srcOK(r.s)) cNoSrc.push(id + ' · ' + r.k);
  }));
  is(cNoSrc.length === 0, '<b>숫자가 적힌 칸마다 근거가 붙어 있다</b>' +
     (cNoSrc.length ? ' — 근거 없는 숫자: ' + cNoSrc.join(' / ') : ''));

  /* 담보 이름은 여기서도 <b>말모이에 있는 것만</b> 쓴다.
     [2] 와 같은 잣대다 — 이 화면에서만 새 이름이 새는 일이 실제로 있었다. */
  const cBadCov = [];
  (C.gap || []).forEach(x => (x.cov || []).forEach(k => { if (!VOCAB.has(k)) cBadCov.push(x.k + ' · ' + k); }));
  is(cBadCov.length === 0, '남는 셋에 붙인 담보가 <b>전부 말모이에 있다</b>' +
     (cBadCov.length ? ' — 말모이에 없는 이름: ' + cBadCov.join(' / ') : ''));

  /* 없는 질병에 숫자를 달아 두면 아무도 못 본다 — 화면에 안 나오기 때문이다 */
  const cGhost = Object.keys(C.byDz || {}).filter(id => !kIds.has(id));
  is(cGhost.length === 0, '질병별 숫자가 <b>있는 질병에만</b> 붙어 있다' +
     (cGhost.length ? ' — 없는 질병: ' + cGhost.join(' / ') : ''));

  /* 제도 숫자는 <b>언제 기준인지</b>가 없으면 다음 해에 거짓말이 된다 */
  const cNoYear = (C.shield || []).filter(x => {
    const t = (x.d || '') + (x.w || '');
    return NUMY.test(t) && !/(20[0-9]{2}년|해마다|사업 연도|그때 확인)/.test(t);
  }).map(x => x.k);
  is(cNoYear.length === 0, '제도 숫자에는 <b>언제 기준인지 · 바뀐다</b>는 말이 붙어 있다' +
     (cNoYear.length ? ' — 안 붙은 것: ' + cNoYear.join(' / ') : ''));
  is(/해마다 바뀝니다/.test(C.tail) && /약관과 심사가 정합니다/.test(C.tail),
     '꼬리에 <b>「해마다 바뀝니다」·「약관과 심사가 정합니다」</b>가 있다');

  /* 단정하지 않는가 — 비용 화면은 특히 「이만큼 나옵니다」 로 새기 쉽다 */
  const cTxt = JSON.stringify(C);
  const cSure = ['무조건', '반드시 지급', '전액 보장', '걱정 없습니다'].filter(w => cTxt.indexOf(w) >= 0);
  is(cSure.length === 0, '비용 화면이 <b>단정하지 않는다</b>' + (cSure.length ? ' — ' + cSure.join(' / ') : ''));

  /* 화면에서 실제로 서는가 */
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => costOpen());
  await page.waitForTimeout(200);
  const cT0 = await page.locator('#detailPane').innerText();
  is(/막아 주는 것/.test(cT0) && /남는 셋/.test(cT0),
     '<b>막아 주는 것 먼저 · 남는 셋</b> 순서로 선다');
  is((await page.locator('.qcshield .qcs').count()) === C.shield.length &&
     (await page.locator('.qcgap .qcg').count()) === C.gap.length,
     '자료에 있는 만큼 그대로 그린다 — 막아주는것 ' + C.shield.length + ' · 남는셋 ' + C.gap.length);
  is(/해마다 바뀝니다/.test(cT0), '화면이 <b>「제도 숫자는 해마다 바뀝니다」</b> 라고 적는다');
  /* 자료에 적은 줄바꿈 태그가 <b>글자 그대로</b> 찍힌 적이 있다. 고객 앞에서 보이는 자리다. */
  is(!/&lt;br&gt;|<br>/.test(cT0), '태그가 <b>글자로 찍히지 않는다</b> (&lt;br&gt;)');
  is((await page.locator('#detailPane ul.src a').count()) === C.src.length,
     '출처를 <b>화면 아래에 그대로</b> 붙인다');

  await page.evaluate(() => costOpen('stroke'));
  await page.waitForTimeout(200);
  const cT1 = await page.locator('#detailPane').innerText();
  is(/70\.5일/.test(cT1) && /385만/.test(cT1), '질병을 고르면 <b>확인한 숫자</b>가 나온다 (뇌졸중)');
  is((await page.locator('.qcnr .n a').count()) >= C.byDz.stroke.length,
     '질병별 숫자마다 <b>근거 ↗</b> 가 붙는다');

  /* ★ 자료가 없는 병 — 여기서 <b>안 지어내는지</b>가 갈린다 */
  const cEmpty = D.list.map(d => d.id).filter(id => !(C.byDz || {})[id])[0];
  await page.evaluate(id => costOpen(id), cEmpty);
  await page.waitForTimeout(200);
  const cT2 = await page.locator('#detailPane').innerText();
  is(/확인한 자료를 아직 못 붙였습니다/.test(cT2) && /지어내지 않습니다/.test(cT2),
     '자료가 없는 병에는 <b>없다고 적는다</b> — 지어내지 않는다 (' + cEmpty + ')');
  is((await page.locator('.qcnum').count()) === 0, '없는 병에 <b>빈 숫자 칸을 세우지 않는다</b>');
  await page.close();

  /* ═══ 8-6. 한 줄기 ═══
     「암 → 재발 → 전이 를 한 번에 이어서 봐야 하는데 따로다」 — 대표님 말씀이
     맞았다. 학습자료인데 도구줄로 흩어 놓았다. 이제 질병 상세가 한 줄기다.

     ★ 차례 번호를 <b>손으로 박지 않는다.</b> 실제로 ⑫ 다음에 ⑧ 이 나왔고,
       전이가 없는 병에서는 번호를 건너뛰었다. 세는 자리를 하나로 두면
       칸이 늘거나 빠져도 어긋날 데가 없다 — 그것을 여기서 본다.            */
  console.log('\n[19] 한 줄기 — 재발→전이→합병증→비용이 이어지는가 · 차례가 어긋나지 않는가');
  const R = D.relapse;
  is(!!(R && R.head && R.words && R.gate && R.say && R.tail),
     '재발 자료가 다섯 토막을 다 갖췄다 (머리·세 낱말·갈리는 자리·화법·꼬리)');
  is((R.words || []).length >= 3 && (R.gate || []).length >= 4,
     '재발 · 전이 · 잔존을 <b>갈라 두고</b>, 지급이 갈리는 자리를 짚는다');

  /* 재발은 <b>숫자를 적기 가장 쉬운 자리</b>다 — 재발률·생존율은 자료마다 다르다 */
  const rlTxt = JSON.stringify(R);
  const rlNum = (rlTxt.match(/[0-9]+\s*(%|퍼센트)/g) || []);
  is(rlNum.length === 0, '재발에 <b>외운 비율을 적지 않는다</b>' + (rlNum.length ? ' — 적혀 있음: ' + rlNum.join(' / ') : ''));
  is(/약관과 심사가 정합니다/.test(R.tail), '재발도 <b>「약관과 심사가 정합니다」</b> 로 닫는다');

  /* 담보 이름은 여기서도 말모이 안의 것만 */
  const rlBad = [];
  (R.gate || []).forEach(g => (g.cov || []).forEach(k => { if (!VOCAB.has(k)) rlBad.push(g.k + ' · ' + k); }));
  is(rlBad.length === 0, '재발에 붙인 담보가 <b>전부 말모이에 있다</b>' +
     (rlBad.length ? ' — 없는 이름: ' + rlBad.join(' / ') : ''));

  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });

  /* 차례가 ①부터 하나씩, 건너뛰지도 되돌아가지도 않는가 — 질병 전부에서 */
  const MARKS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
  const seqBad = [];
  for (const d of D.list) {
    await page.evaluate(i => open_(i), d.id);
    await page.waitForTimeout(90);
    const ems = await page.$$eval('#detailPane .sec h3 em', ns => ns.map(n => n.textContent));
    const nums = ems.filter(t => MARKS.indexOf(t) >= 0);
    const want = nums.map((_, i) => MARKS.charAt(i));
    if (nums.join('') !== want.join('')) seqBad.push(d.id + ': ' + nums.join(''));
  }
  is(seqBad.length === 0, '질병 ' + D.list.length + '종 <b>차례가 ①부터 하나씩</b> 이어진다' +
     (seqBad.length ? ' — 어긋남: ' + seqBad.slice(0, 4).join(' / ') : ''));

  /* 한 줄기 — 암이면 재발 다음이 전이, 그다음 합병증, 그다음 비용 */
  await page.evaluate(() => open_('cancer_major'));
  await page.waitForTimeout(300);
  const chainT = await page.$$eval('#detailPane .sec h3', ns => ns.map(n => n.innerText.replace(/\n/g, ' ')));
  const idx = k => chainT.findIndex(t => t.indexOf(k) >= 0);
  is(idx('다시 걸리면') >= 0 && idx('전이 —') > idx('다시 걸리면') &&
     idx('합병증 —') > idx('전이 —') && idx('얼마 듭니까') > idx('합병증 —'),
     '암은 <b>재발 → 전이 → 합병증 → 얼마</b> 차례로 이어진다 — 따로 열지 않는다');

  /* 「보러 가기」 단추만 있고 알맹이가 없으면 안 된다 */
  is((await page.locator('.spr-w').count()) > 0 && (await page.locator('.cmp-c').count()) > 0 &&
     (await page.locator('.qcshield').count()) > 0,
     '단추가 아니라 <b>알맹이가 그 자리에</b> 있다 (전이 카드 · 합병증 · 막아 주는 것)');

  /* 코드 — 그 병의 코드가 다 있고, 가까운 코드는 「자료를 보시면 됩니다」 까지다 */
  /* ★ 처음엔 화면 전체 글자에서 코드를 찾았다. 그랬더니 I66 을 자료에서 <b>빼도
     점검이 통과</b>했다 — 「가까운 코드」 목록이 KCD 에서 그것을 도로 그려 주기
     때문이다. 안 울리는 알람은 알람이 아니다. <b>이 병의 코드 칸(.codes)만</b> 본다. */
  const chips = async id => {
    await page.evaluate(i => open_(i), id);
    await page.waitForTimeout(250);
    return page.$$eval('.codes i b', ns => ns.map(n => n.textContent));
  };
  const stC = await chips('stroke');
  const stMiss = ['I60','I61','I62','I63','I64','I65','I66','I67','I68','I69'].filter(c => stC.indexOf(c) < 0);
  is(stMiss.length === 0, '뇌졸중 <b>이 병의 코드</b> 칸에 I60~I69 가 하나도 안 빠졌다' +
     (stMiss.length ? ' — 빠짐: ' + stMiss.join(',') : ''));
  const miC = await chips('mi');
  const miMiss = ['I20','I21','I22','I23','I24','I25'].filter(c => miC.indexOf(c) < 0);
  is(miMiss.length === 0, '허혈성심장질환 <b>이 병의 코드</b> 칸에 I20~I25 가 하나도 안 빠졌다' +
     (miMiss.length ? ' — 빠짐: ' + miMiss.join(',') : ''));
  await page.evaluate(() => open_('stroke'));
  await page.waitForTimeout(250);
  const stT = await page.locator('#detailPane').innerText();
  is(/이 자료를 보시면 됩니다/.test(stT) && /담보를 정하지 않습니다/.test(stT),
     '가까운 코드는 <b>「이 자료를 보시면 됩니다」</b> 까지다 — 담보를 정하지 않는다');
  await page.close();

  /* ═══ 9. 일부러 끊어 본다 ═══ */
  console.log('\n[12] 자료를 못 읽으면 화면을 안 세우는가 — 일부러 끊어 본다');
  CUT = true;
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://localhost:${PORT}/${PAGE.split('/').map(encodeURIComponent).join('/')}`, { waitUntil: 'networkidle' });
  const cut = await page.locator('body').innerText();
  is(/아무 자료도 만들지 않습니다/.test(cut), '자료가 없으면 「아무 자료도 만들지 않습니다」 라고 적는다');
  is((await page.locator('.dcard').count()) === 0, '없는 질병을 지어내 세우지 않는다');
  await page.close();
  CUT = false;

  await browser.close();
  srv.close();

  console.log('\n──────────────────────────────');
  if (fail) { console.log('질병 가이드 점검 실패 — ' + fail + '곳'); process.exit(1); }
  console.log('질병 가이드 점검 통과 — ' + pass + '곳 모두 맞습니다.');
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
