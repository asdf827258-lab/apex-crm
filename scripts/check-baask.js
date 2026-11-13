/* 🙂 보장 전·후 심플 — 질문으로 보기 · 판 X429 (app/ba-ask.js)

   사장님 말씀 2026-11-13 「정말 어른들에게 확 와닿고 보기쉽게 설명하고 질문 -> 설명」 ·
   「핵심 담보에 대한 설명과 새로운 담보가 왜 필요한지 간단한 설명칸도!」 · 「좋아 crm에 심플버전으로 만들어줘」.

     [1] 분석 모드 줄에 단추 · 누르면 겹화면이 뜨고 ✕ 로 닫힌다
     [2] 장은 <b>새로 생기거나 늘어나는 담보</b>에서만 — 늘어나는 게 없으면 장을 세우지 않는다(1번)
     [3] 한 장 = ① 질문 → ② 📘 쉽게 말하면(DESC) → ③ 💡 그래서 필요합니다(지금 → 넣으면)
     [4] 숫자는 이 화면의 셈과 같다 — premCalc · calc · evCalc
     [5] 통계 장에는 출처가 그 장 아래에 붙는다
     [6] 줄어드는 것을 숨기지 않는다 · 해지가 있으면 승환 안내
     [7] 발표 — → 로 단계가 열리고 ← 로 되돌고, Esc 두 번이면 나간다 · 뒤 화면 장은 안 움직인다
     [8] 장 안에서 넘치지 않는다 · 글씨 16px 이상(1280 기준)
     [9] 조용한가                                                                                   */
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

/* 장마다 — 제목 · 단계 수 · 넘침 · 가장 작은 글씨(1280 기준) */
const SCAN = () => [].slice.call(document.querySelectorAll('#baqBox .bq-sl')).map(s => {
  const sb = s.getBoundingClientRect(), sc = sb.width / 1280, over = [];
  s.querySelectorAll('.bq-mid .ex,.bq-need,.bq-need .l,.bq-ans,.bq-hd,.bq-qc .qt,.bq-chk,.bq-mid .vis').forEach(el => {
    /* 질문 글(80px)은 글꼴에 따라 글자 윗부분이 줄 상자보다 몇 px 높다 — 넘침이 아니다 (8번 · 헛것을 잡지 않는다) */
    const tol = el.classList.contains('qt') ? 8 : 2;
    if (el.scrollHeight > el.clientHeight + tol || el.scrollWidth > el.clientWidth + 2) over.push(el.className); });
  s.querySelectorAll('.bq-need .nb,.bq-ans > *').forEach(el => { const b = el.getBoundingClientRect();
    if (b.right > sb.right - 40 * sc || b.bottom > sb.bottom - 30 * sc) over.push('끝 ' + el.className); });
  const ft = s.querySelector('.bq-ft'), nd = s.querySelector('.bq-need');
  if (ft && nd && ft.getBoundingClientRect().top < nd.getBoundingClientRect().bottom) over.push('각주가 띠에 겹침');
  let min = 99; s.querySelectorAll('*').forEach(el => { if (!el.childNodes.length || ![].some.call(el.childNodes, n => n.nodeType === 3 && n.textContent.trim())) return;
    const f = parseFloat(getComputedStyle(el).fontSize); if (f < min) min = f; });
  return { n: +s.dataset.n, t: ((s.querySelector('.bq-hd .t') || s.querySelector('.qt') || {}).textContent || '').replace(/\s+/g, ' '),
    txt: s.innerText, ex: (s.querySelector('.bq-mid .ex .t') || {}).innerHTML || '', need: (s.querySelector('.bq-need') || {}).innerText || '',
    ft: (s.querySelector('.bq-ft') || {}).innerText || '', over, min: Math.round(min * 10) / 10 };
});

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [], out = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', q => { if (q.method() !== 'GET') out.push(q.method() + ' ' + q.url()); });
  await pg.route('**://**', r => /^http:\/\/127\.0\.0\.1/.test(r.request().url()) ? r.continue() : r.abort());
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);

  /* 견본 고객(가상 · doSample) — 암 2,000 · 뇌졸중 2,000 · 급성심근경색 3,000 → 종합 + 운전자 */
  await pg.evaluate(() => { localStorage.clear(); window.confirm = () => true; doSample(); S.deck = true; S.slide = 'sHd'; save(); go('show'); });
  await pg.waitForTimeout(400);

  head('[1] 단추와 겹화면');
  const btn = pg.locator('.showctl button:has-text("심플 — 질문으로 보기")');
  is(await btn.count() === 1, '「분석 모드」 줄에 「🙂 심플 — 질문으로 보기」 단추');
  await btn.click(); await pg.waitForTimeout(300);
  const box = await pg.evaluate(() => { const b = document.getElementById('baqBox'), r = b && b.getBoundingClientRect();
    return b ? { w: r.width, h: r.height, z: getComputedStyle(b).zIndex, pos: getComputedStyle(b).position } : null; });
  is(box && box.pos === 'fixed' && box.w >= 1390 && box.h >= 890, '누르면 화면 가득 겹화면 — ' + JSON.stringify(box));
  const A = await pg.evaluate(SCAN);

  head('[2] 장은 늘어나는 담보에서만');
  const titles = A.map(x => x.t);
  const want = ['암 진단비', '암 치료', '뇌졸중 진단비가 있으면', '심근경색 진단비가 있으면', '수술비', '누가 돌봐'];
  is(want.every(w => titles.some(t => t.indexOf(w) >= 0)), '견본 고객 — 암 · 암 치료 · 뇌 · 심장 · 수술 · 간병 질문이 선다');
  is(titles.some(t => /그 밖에/.test(t)) && /유사암/.test(A.find(x => /그 밖에/.test(x.t)).txt), '나머지 늘어나는 담보(유사암 등)는 「그 밖에」 장으로 — 조용히 빼지 않는다');
  const E0 = await pg.evaluate(() => { baqClose(); S.after = []; S.before.forEach(p => { p.act = 'keep'; }); save(); go('show'); baqOpen();
    const L = document.querySelectorAll('#baqBox .bq-sl'); return { n: L.length, t: L[0] && L[0].innerText }; });
  is(E0.n === 1 && /아직 없습니다/.test(E0.t), '늘어나는 담보가 없으면 장을 세우지 않고 「아직 없습니다」 한 장 — ' + E0.n + '장');
  await pg.evaluate(() => { baqClose(); localStorage.clear(); doSample(); S.deck = true; S.slide = 'sHd'; save(); go('show'); baqOpen(); });

  head('[3] 한 장 = 질문 → 쉽게 말하면 → 그래서 필요합니다');
  const cards = A.filter(x => x.n === 3);
  is(cards.length === 6, '세 단계 장 여섯 — ' + cards.length);
  is(cards.every(x => /쉽게 말하면/.test(x.txt) && /그래서 필요합니다/.test(x.need)), '장마다 📘 쉽게 말하면 칸 · 💡 그래서 필요합니다 띠');
  const cExt = await pg.evaluate(() => baqTxt(DESC.cancer));
  is(cards[0].ex.replace(/<[^>]+>/g, '') === cExt, '설명 칸은 화면의 담보 설명(DESC) 문장 그대로');

  head('[4] 숫자는 이 화면의 셈과 같다');
  const N = await pg.evaluate(() => { const C = calc(), P = premCalc(), ec = evCalc(EVENTS[0], C);
    return { mon: baqMonWon(P.monB), monA: baqMonWon(P.monA), d: baqMonWon(P.monD), ca: baqWon(C.a.cancer), cb: baqWon(C.b.cancer), gap: baqWon(ec.gapB),
      brain: baqWon(C.a.brain), heart: baqWon(C.a.heart) }; });
  const T = n => A.find(x => x.t.indexOf(n) >= 0) || { txt: '', need: '' };
  is(T('한 달에 얼마 내고').txt.indexOf(N.mon) >= 0 && N.mon === '11만 7,500원', '지금 보험료 = premCalc 매달 ' + N.mon);
  is(T('암 진단비').need.indexOf(N.cb) >= 0 && T('암 진단비').need.indexOf(N.ca) >= 0, '암 진단비 지금 ' + N.cb + ' → 넣으면 ' + N.ca);
  is(T('암 진단비').txt.indexOf(N.gap) >= 0, '빈 컵 = 병원비 − 지금 나오는 돈(evCalc) ' + N.gap);
  is(T('뇌졸중').need.indexOf(N.brain) >= 0 && T('심근경색').need.indexOf(N.heart) >= 0, '뇌혈관 ' + N.brain + ' · 허혈성 ' + N.heart + ' — 바꾼 뒤 금액 그대로');
  is(A.some(x => x.txt.indexOf(N.monA) >= 0 && x.txt.indexOf(N.d) >= 0), '바꾼 뒤 매달 ' + N.monA + ' · ' + N.d + ' 더');

  head('[5] 통계 장에는 출처');
  is(/건강보험심사평가원/.test(T('뇌졸중').ft) && /2022/.test(T('뇌졸중').ft) && /117만/.test(T('뇌졸중').txt), '뇌 장 — 117만 · 63만, 심평원 2022 출처');
  is(/건강보험심사평가원/.test(T('심근경색').ft) && /10\.2%/.test(T('심근경색').ft), '심장 장 — 10명 중 1명, 심평원 10.2% 출처');

  head('[6] 줄어드는 것 · 해지');
  const L6 = await pg.evaluate(() => { baqClose(); S.before[3].act = 'cancel'; save(); go('show'); baqOpen();
    const L = [].slice.call(document.querySelectorAll('#baqBox .bq-sl')).map(s => s.innerText); return L; });
  const loss = L6.find(t => /줄어드는 것/.test(t) && /질병사망/.test(t));
  is(!!loss, '해지로 질병사망 등이 빠지면 「반대로, 줄어드는 것도 있습니다」 장');
  is(L6.some(t => /면책기간/.test(t) && /가입이 거절/.test(t)), '해지가 있으면 승환 안내(거절 · 보험료 · 면책기간)');
  is(L6.some(t => /오늘 기억하실 것/.test(t) && /줄어드는 것/.test(t)), '정리 장에도 「줄어드는 것 — 꼭 확인」');
  await pg.evaluate(() => { baqClose(); localStorage.clear(); doSample(); S.deck = true; S.slide = 'sHd'; save(); go('show'); baqOpen(); });

  head('[7] 발표');
  await pg.locator('#baqBox button:has-text("발표 시작")').click(); await pg.waitForTimeout(200);
  const seq = [];
  for (let j = 0; j < 9; j++) { if (j) await pg.keyboard.press('ArrowRight'); seq.push(await pg.evaluate(() => BAQ.cur + ':' + baqStepOf(baqSl()[BAQ.cur]))); }
  is(seq.join(' ') === '0:1 1:1 1:2 2:1 2:2 2:3 3:1 3:2 3:3', '→ 로 질문 → 쉽게 말하면 → 그래서 필요합니다 — ' + seq.join(' '));
  await pg.waitForTimeout(700);   /* 덮개는 0.5초 동안 걷힌다 */
  const vis = await pg.evaluate(() => { const s = baqSl()[3], f = s.parentNode; return { cur: f.classList.contains('cur'), qc: getComputedStyle(s.querySelector('.bq-qc')).opacity }; });
  is(vis.cur && vis.qc === '0', '셋째 단계에선 질문 덮개가 걷힌다');
  await pg.keyboard.press('ArrowLeft'); await pg.keyboard.press('ArrowLeft');
  is(await pg.evaluate(() => BAQ.cur + ':' + baqStepOf(baqSl()[BAQ.cur])) === '3:1', '← 로 한 단계씩 되돌아간다');
  is(await pg.evaluate(() => S.slide) === 'sHd', '뒤의 「한 장씩 넘기기」 장은 같이 안 넘어간다 — ' + await pg.evaluate(() => S.slide));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  const e1 = await pg.evaluate(() => BAQ.pres + '/' + BAQ.on);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  const e2 = await pg.evaluate(() => BAQ.on + '/' + !!document.getElementById('baqBox') + '/' + document.documentElement.style.overflow);
  is(e1 === 'false/true' && e2 === 'false/false/', 'Esc 한 번 = 발표 끝, 두 번 = 닫기 · 스크롤 되살림 — ' + e1 + ' · ' + e2);

  head('[8] 넘치지 않고 크게');
  const over = A.filter(x => x.over.length);
  is(!over.length, '장 ' + A.length + '개 모두 넘치지 않는다' + (over.length ? ' — ' + over.map(x => x.t.slice(0, 14) + ':' + x.over.join(',')).join(' | ') : ''));
  const minF = Math.min.apply(null, A.map(x => x.min));
  is(minF >= 16 * (1386 - 32 > 1280 ? 1 : (1386 - 32) / 1280) - .5, '가장 작은 글씨 ' + minF + 'px (1280 장 기준 16px 이상)');

  head('[9] 조용한가');
  is(!errs.length, '스크립트 오류 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  is(!out.length, '서버로 보내는 것 없음' + (out.length ? ' — ' + out.join(' / ') : ''));

  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 실패' : '\n✓ 심플 — 질문으로 보기 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
