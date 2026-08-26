/* <b>미끼 레이더가 약관을 제대로 읽는가 — 그리고 틀리게 읽지 않는가.</b>

   재 보니 <b>진짜 오답</b>이 나오고 있었습니다.

   약관 제4조는 거의 언제나 <b>「보험금을 지급하지 않는 사유」</b> 입니다.
   그 안에 「뇌혈관질환(I60~I69)」·「허혈성심장질환(I20~I25)」 이 그대로
   적혀 있습니다. 이것을 <b>「뇌혈관 전체 보장 · 유리」</b> 로 읽고 있었습니다.
   고객 앞에서 <b>「이 상품은 뇌혈관 전체가 됩니다」</b> 라고 말하게 되는
   자리입니다 — 없는 보장을 있다고 말하는 것이라, 숫자가 조금 틀린 것과
   다릅니다. (CLAUDE.md 1번)

   정밀 판정은 더 나빴습니다. 조문을 고를 때 제목에 「지급」·「보험금」 이
   있으면 <b>먼저</b> 보게 되어 있었는데, 「보험금을 <b>지급하지 않는</b>
   사유」 가 바로 그 꼴이라 <b>면책 조항을 제일 먼저</b> 뒤졌습니다.

   그리고 찾는 자리가 <b>첫 매치 하나</b>뿐이었습니다. 목차에 먼저 걸리면
   근거 문장이 목차에서 나왔습니다.

   여기서 확인합니다.
     1. 면책 조항을 <b>장점으로 읽지 않는가</b> — 발췌 · 정밀판정 · 상품카드
     2. 진짜 보장 조항이 있으면 <b>거기서</b> 근거를 뽑는가
     3. <b>목차</b>에서 근거를 뽑지 않는가
     4. 표가 넓은가 — 그리고 넓힌 규칙이 <b>실제로 걸리는가</b>
     5. <b>헛알람이 없는가</b> — 보험과 상관없는 글에는 하나도 안 걸리는가
     6. 판정하는 곳이 <b>하나</b>인가 — 죽은 판이 없는가 (CLAUDE.md 5번)     */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  const ct = /\.json$/.test(f) ? 'application/json' : 'text/html';
  rs.writeHead(200, { 'Content-Type': ct + '; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본 약관 — 실제 서식 그대로 목차가 앞에 오고 면책이 보장보다 먼저 온다 */
/* 진짜 약관 목차는 <b>조 제목에 담보 이름이 그대로</b> 들어 있다.
   그래서 목차를 안 걸러내면 근거 문장이 <b>목차에서</b> 나온다. */
const TOC = '[[p1]] 목 차\n제3조(보험금의 지급사유) ................ 5\n' +
            '제4조(보험금을 지급하지 않는 사유) ...... 7\n' +
            '제12조(뇌혈관질환 진단보험금) ........... 25\n' +
            '제13조(허혈성심장질환 진단보험금) ....... 27\n' +
            '제6조(암보장개시일) ............... 9\n';
const DENY = '[[p7]] 제4조(보험금을 지급하지 않는 사유) 회사는 다음의 경우에는 보험금을 지급하지 않습니다. ' +
  '1. 뇌혈관질환(I60~I69)으로 계약일 이전에 이미 진단이 확정되었던 경우 ' +
  '2. 허혈성심장질환(I20~I25)에 해당하더라도 계약 전에 발병한 경우\n';
const PAY = '[[p5]] 제3조(보험금의 지급사유) 뇌혈관질환(I60~I69)으로 진단확정된 경우 보험금을 지급합니다. ' +
  '허혈성심장질환(I20~I25)으로 진단확정된 경우에도 보험금을 지급합니다.\n';
/* 「용어의 정의」 조문에도 담보 이름이 나온다 — 근거를 여기서 뽑으면 안 된다.
   앞 번호이고 첫머리에 「보장」 이 있어, 차례를 안 매기면 이쪽이 먼저 잡힌다. */
const DEF = '[[p3]] 제1조(용어의 정의) 이 약관에서 「뇌혈관질환」 이란 보장 대상이 되는 ' +
  '뇌혈관질환(I60~I69) 을 말합니다.\n';
const OPEN = '[[p9]] 제6조(암보장개시일) 암에 대한 보장개시일은 계약일부터 90일이 지난 날의 다음날로 합니다.\n';
/* 넓힌 규칙이 실제로 걸리는지 재는 조각 */
const WIDE = '[[p12]] 제10조 고액암으로 진단확정된 경우 별도로 지급합니다. 중입자치료를 받은 경우에도 지급합니다. ' +
  '통원으로 항암약물치료를 받은 경우 지급합니다. 조혈모세포 이식을 받은 경우 지급합니다. ' +
  '로봇수술(다빈치)로 수술한 경우 수술보험금을 지급합니다. 관상동맥중재술(스텐트) 시 지급합니다. ' +
  '간병인 사용 일당을 지급합니다. 5대골절 또는 깁스치료 시 치료비를 지급합니다. ' +
  '제11조(상해의 정의) 상해라 함은 급격하고도 우연한 외래의 사고를 말합니다. ' +
  '제12조(재가입) 이 계약은 재가입 주기마다 재가입할 수 있습니다. ' +
  '제13조(해지환급금) 이 계약은 무해지환급형으로 중도 해지 시 해지환급금이 없습니다. ' +
  '제14조(계약의 해지) 보장개시일부터 2년이 지났을 때에는 계약을 해지할 수 없습니다. ' +
  '제15조(납입최고) 납입최고 기간 안에 보험료를 내지 아니하면 계약은 해지됩니다. ' +
  '제16조(청구권) 보험금청구권은 3년간 행사하지 아니하면 소멸시효가 완성됩니다. ' +
  '제17조(통원) 통원 1회당 자기부담 공제금액을 뺀 금액을 지급합니다.\n';
/* 보험과 아무 상관 없는 글 — 여기 걸리면 헛알람이다 */
const JUNK = '오늘 회사 회의에서 3분기 매출을 검토했습니다. 담당자는 다음 주까지 자료를 정리해 제출하기로 ' +
  '했습니다. 회의는 오후 2시에 시작해 한 시간 만에 끝났고 참석자는 모두 여덟 명이었습니다. ' +
  '커피값은 각자 냈고, 다음 회의 장소는 같은 곳으로 정했습니다. 자료는 이메일로 공유합니다.';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port +
    '/app/' + encodeURIComponent('상담자료') + '/' + encodeURIComponent('미끼레이더') + '/index.html';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 면책 조항을 장점으로 읽지 않는다');
  const deny = await page.evaluate(([toc, dn, open]) => {
    const doc = toc + dn + open;
    const A = analyzeTerms(doc), J = judgePrecise(doc, {});
    const f = A.finds.find(x => x.id === 'brainwide') || {};
    const h = A.finds.find(x => x.id === 'heartwide') || {};
    const row = J.rows.find(r => r.c === '뇌' && r.k === '보장 질병코드 범위') || {};
    return { fv: f.v || '(안 잡힘)', fden: !!f.denyOnly, hv: h.v || '(안 잡힘)',
             flabel: f.label || '', jv: row.v || '(없음)', jart: (row.ev || {}).art || '',
             facts: J.facts, good: A.stat.good };
  }, [TOC, DENY, OPEN]);
  is(deny.fv === 'info' && deny.fden,
     '  발췌 — 면책에만 있는 「뇌혈관질환」 이 <b>유리</b>가 아니다 (' + deny.fv + ')');
  is(deny.hv === 'info', '  발췌 — 「허혈성심장질환」 도 마찬가지 (' + deny.hv + ')');
  is(/면책 조항에서만/.test(deny.flabel),
     '  <b>말없이 버리지 않는다</b> — 「면책 조항에서만 나옴」 이라고 적는다');
  is(deny.good === 0, '  유리 조항이 <b>0</b> 이다 — 없는 장점을 만들지 않았다');
  is(deny.jv === 'mix', '  정밀판정 — 「혼재·조문 확인 필요」 로 남긴다 (' + deny.jv + ')');
  is(!deny.facts['뇌 보장범위'] && !deny.facts['심장 보장범위'],
     '  상품카드가 <b>거짓말하지 않는다</b> — 뇌·심장 범위를 안 적는다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 진짜 보장 조항이 있으면 거기서 근거를 뽑는다');
  const both = await page.evaluate(([toc, dn, pay, open]) => {
    const doc = toc + dn + pay + open;
    const A = analyzeTerms(doc), J = judgePrecise(doc, {});
    const f = A.finds.find(x => x.id === 'brainwide') || {};
    const row = J.rows.find(r => r.c === '뇌' && r.k === '보장 질병코드 범위') || {};
    return { fv: f.v, fart: f.art || '', jv: row.v, jart: (row.ev || {}).art || '',
             facts: J.facts };
  }, [TOC, DENY, PAY, OPEN]);
  is(both.fv === 'good', '  발췌 — <b>유리</b>로 돌아온다 (' + both.fv + ')');
  is(/지급사유/.test(both.fart), '  근거가 <b>지급사유 조문</b>에서 나온다 — ' + both.fart);
  is(both.jv === 'good' && /지급사유/.test(both.jart),
     '  정밀판정도 같다 — ' + both.jv + ' · ' + both.jart);
  is(both.facts['뇌 보장범위'] === '뇌혈관질환',
     '  상품카드가 제대로 적는다 — ' + (both.facts['뇌 보장범위'] || '(빔)'));
  /* 조문을 고르는 차례를 잰다. 「용어의 정의」 조문에도 담보 이름이 나오는데,
     거기서 인용을 뽑으면 <b>「…라 함은 …을 말합니다」</b> 라는 사전 문장이 근거로
     붙는다. 고객에게 보여 줄 근거는 <b>지급 조문</b>이어야 한다. */
  const order = await page.evaluate(([def, pay]) => {
    const doc = def + pay;
    const list = (scopeText(splitArticles(doc), '뇌') || []).map(a => a.no + ':' + a.title);
    const f = analyzeTerms(doc).finds.find(x => x.id === 'brainwide') || {};
    return { list, art: f.art || '' };
  }, [DEF, PAY]);
  const iPay = order.list.findIndex(x => /지급사유/.test(x));
  const iDef = order.list.findIndex(x => /정의/.test(x));
  is(iPay > -1 && iDef > -1 && iPay < iDef,
     '  <b>지급 조문 먼저 · 용어 정의 나중</b> — ' + order.list.join(' | '));
  is(/지급사유/.test(order.art),
     '  그래서 근거가 사전 문장이 아니라 <b>지급 조문</b>에서 나온다 — ' + order.art);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 목차에서 근거를 뽑지 않는다');
  const toc = await page.evaluate(([t, open]) => {
    const A = analyzeTerms(t + open);
    return { ids: A.finds.map(f => f.id), n: A.finds.length };
  }, [TOC, OPEN]);
  is(!toc.ids.includes('brainwide') && !toc.ids.includes('heartwide'),
     '  목차 줄에만 있는 낱말은 <b>안 잡는다</b> — ' + (toc.ids.join(' ') || '(없음)'));
  is(!/뇌혈관질환 진단보험금|허혈성심장질환 진단보험금/.test(both.fart + both.jart),
     '  본문이 있을 때도 근거를 <b>목차 조 제목에서</b> 뽑지 않는다 — ' + both.fart);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 표가 넓다 — 그리고 넓힌 규칙이 실제로 걸린다');
  const wide = await page.evaluate(([w]) => {
    const A = analyzeTerms(w), J = judgePrecise(w, {});
    const want = ['heavycancer', 'carci', 'chemoout', 'stemcell', 'robot', 'frac5',
                  'accdef', 'nurse', 'reenter', 'contest2y', 'claim3y', 'grace', 'outded'];
    const got = A.finds.map(f => f.id);
    return { n: { term: TERM_RULES.length, spec: SPEC_RULES.length, rubric: RUBRIC.length,
                  toxic: TOXIC.length, facts: FACTS.length },
             miss: want.filter(x => !got.includes(x)),
             conf: J.conf, tox: J.tox.length, facts: Object.keys(J.facts).length };
  }, [WIDE]);
  is(wide.n.term >= 68, '  발췌 규칙 <b>' + wide.n.term + '개</b> (예전 43)');
  is(wide.n.rubric >= 45, '  정밀판정 항목 <b>' + wide.n.rubric + '개</b> (예전 29)');
  is(wide.n.toxic >= 28, '  독소조항 <b>' + wide.n.toxic + '개</b> (예전 20)');
  is(wide.n.facts >= 22, '  상품카드 값 <b>' + wide.n.facts + '개</b> (예전 14)');
  is(wide.miss.length === 0,
     '  넓힌 규칙이 <b>실제 약관에서 걸린다</b>' + (wide.miss.length ? ' — 안 걸림: ' + wide.miss.join(' ') : ''));
  is(wide.conf >= 10 && wide.facts >= 6,
     '  판정 확인 ' + wide.conf + '항목 · 상품카드 ' + wide.facts + '칸 · 독소 ' + wide.tox + '개');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 헛알람이 없다 — 헛것을 잡는 규칙은 안 잡는 규칙보다 나쁘다');
  const junk = await page.evaluate(([j]) => {
    const A = analyzeTerms(j), J = judgePrecise(j, {});
    return { terms: A.finds.map(f => f.id), rows: J.rows.filter(r => r.v !== 'none').map(r => r.k),
             tox: J.tox.map(t => t.k), facts: Object.keys(J.facts) };
  }, [JUNK]);
  is(junk.terms.length === 0, '  발췌가 하나도 안 걸린다' + (junk.terms.length ? ' — ' + junk.terms.join(' ') : ''));
  is(junk.rows.length === 0, '  판정이 하나도 안 걸린다' + (junk.rows.length ? ' — ' + junk.rows.join(' ') : ''));
  is(junk.tox.length === 0, '  독소조항이 하나도 안 걸린다' + (junk.tox.length ? ' — ' + junk.tox.join(' ') : ''));
  is(junk.facts.length === 0, '  상품카드가 비어 있다' + (junk.facts.length ? ' — ' + junk.facts.join(' ') : ''));

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 판정하는 곳이 하나다 — 죽은 판이 없다 (CLAUDE.md 5번)');
  const one = await page.evaluate(() => ({
    gone: typeof judgeOne === 'undefined',
    has: typeof judgePrecise === 'function',
    scan: typeof scanRules === 'function' && typeof mkDenyRanges === 'function'
  }));
  is(one.gone, '  <b>judgeOne 이 없다</b> — window.judgeOne 으로 덮어쓴 죽은 판을 지웠다');
  is(one.has && one.scan, '  judgePrecise · scanRules · mkDenyRanges 가 살아 있다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 약관을 틀리게 읽거나 놓치고 있습니다')
                  : '✓ 면책을 장점으로 읽지 않고, 진짜 보장 조항에서 근거를 뽑습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
