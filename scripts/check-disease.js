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
    12. <b>자료를 못 읽으면 화면을 안 세우는가</b> — 일부러 끊어 보고 확인한다              */
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
const PAGE = 'app/재무설계/질병보험가이드.html';

(async () => {
  const app  = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const raw  = fs.readFileSync(path.join(ROOT, DATA), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');

  /* 자료를 그대로 읽어 온다 */
  const vizRaw = fs.readFileSync(path.join(ROOT, VIZF), 'utf8');
  const sandbox = { window: {} };
  new Function('window', raw)(sandbox.window);
  new Function('window', 'document', vizRaw)(sandbox.window, { querySelectorAll: function () { return []; } });
  const D = sandbox.window.DZ_DATA;
  const VIZ = sandbox.window.DZ_VIZ;

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
  is(/설계 연습/.test(await page.locator('.drill-hd').innerText()), '연습 화면이 열린다');

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
  is(/page-break-inside\s*:\s*avoid/.test(html), '인쇄에서 토막이 잘리지 않게 해 두었다');
  is(/\.dzart\.nolbl\.lbl\{display:inline;?\}/.test(html.replace(/\s+/g, '')),
     '종이에는 이름표를 켜서 인쇄한다 — 화면에서 꺼 뒀어도');
  is(/\.dzart-tools,\.dzart-hint\{display:none;?\}/.test(html.replace(/\s+/g, '')),
     '인쇄물에는 단추가 나가지 않는다');
  is(/@media\s+print/.test(html), '인쇄용 규칙이 있다');
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
