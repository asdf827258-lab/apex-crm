/* 비포 & 애프터 — 회사마다 다르게 쓴 말을 잡아내고, 사람이 고칠 수 있는가.

   여태 이 화면은 통합조회 PDF 한 형식만 읽었다. 비포&애프터에 올리는
   <b>신규 제안서</b>는 회사마다 서식이 달라 못 읽었고, 못 읽은 채로
   원문을 통째로 AI 에게 던졌다. AI 가 숫자를 잘못 보면 그대로 보고서에
   실리고, 고객 앞에서 틀린 금액을 말하게 된다.

   여기서 확인한다.

     1. 금액 표기를 손으로 아는 답과 같게 읽는가 (1억 · 3,000만원 · 원 단위)
     2. 회사마다 다른 담보 이름을 같은 담보로 묶는가
     3. 「유사암진단비」 안의 「암진단비」 를 일반암으로 잘못 집지 않는가
     4. 못 찾은 칸을 0 이 아니라 <b>빈 칸</b>으로 두는가
     5. 사람이 고친 값이 AI 에게 가는 글에 그대로 실리는가          */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 금액을 손으로 아는 답과 같게 읽는가 (만원 단위)');
  const money = await page.evaluate(() => ({
    억:      babaWon('1억원'),
    억만:    babaWon('1억 5,000만원'),
    만:      babaWon('3,000만원'),
    만짧:    babaWon('5000만'),
    천만:    babaWon('2천만원'),
    원:      babaWon('10,000,000원'),
    보험료:  babaWon('128,900원'),
    잔돈:    babaWon('900원'),
    없음:    babaWon('가입금액 —')
  }));
  [['억', 10000, '1억원'], ['억만', 15000, '1억 5,000만원'], ['만', 3000, '3,000만원'],
   ['만짧', 5000, '5000만'], ['천만', 2000, '2천만원'], ['원', 1000, '10,000,000원'],
   ['보험료', 13, '128,900원 → 12.89 → 13']].forEach(([k, want, label]) =>
    is(money[k] === want, '  ' + label + ' = ' + want + '만 · 나온 값 ' + money[k]));
  is(money.잔돈 === 0, '  몇 백원짜리는 금액으로 안 본다');
  is(money.없음 === null, '  숫자가 없으면 0 이 아니라 「모름」 이다');

  console.log('\n[2] 회사마다 다른 이름을 같은 담보로 묶는가');
  const co = await page.evaluate(() => {
    const A = babaScan('일반암진단비 3,000만원 뇌혈관질환진단비 2,000만원 ' +
                       '급성심근경색증진단비 1,500만원 질병수술비 100만원 월보험료 128,900원');
    const B = babaScan('암진단급여금 5,000만원 뇌혈관질환 진단급여금 3,000만원 ' +
                       '허혈성심장질환진단급여금 2,000만원 합계보험료 210,500원');
    const C = babaScan('악성신생물(암)진단비 1억원 뇌졸중진단비 2,000만원 ' +
                       '표적항암약물허가치료비 3,000만원 실손의료비 가입 납입보험료 95,000원');
    return { A, B, C };
  });
  is(co.A.cancer && co.A.cancer.won === 3000, '  A사 「일반암진단비 3,000만원」 → 3,000');
  is(co.A.brain && co.A.brain.won === 2000, '  A사 「뇌혈관질환진단비」 → 2,000');
  is(co.A.mi && co.A.mi.won === 1500, '  A사 「급성심근경색증진단비」 → 1,500');
  is(co.A.fee && co.A.fee.won === 13, '  A사 「월보험료 128,900원」 → 13만');
  is(co.B.cancer && co.B.cancer.won === 5000, '  B사 「암진단급여금 5,000만원」 → 5,000');
  is(co.B.brain && co.B.brain.won === 3000, '  B사 「뇌혈관질환 진단급여금」 → 3,000 (띄어쓰기 달라도)');
  is(co.B.heart && co.B.heart.won === 2000, '  B사 「허혈성심장질환진단급여금」 → 2,000');
  is(co.B.fee && co.B.fee.won === 21, '  B사 「합계보험료 210,500원」 → 21만');
  is(co.C.cancer && co.C.cancer.won === 10000, '  C사 「악성신생물(암)진단비 1억원」 → 10,000');
  is(co.C.stroke && co.C.stroke.won === 2000, '  C사 「뇌졸중진단비」 → 2,000');
  is(co.C.target && co.C.target.won === 3000, '  C사 「표적항암약물허가치료비」 → 3,000');

  console.log('\n[3] 비슷한 이름을 잘못 집지 않는가');
  const trap = await page.evaluate(() => ({
    유사만: babaScan('유사암진단비 600만원'),
    둘다:   babaScan('일반암진단비 4,000만원 유사암진단비 800만원'),
    소액:   babaScan('소액암진단비 500만원')
  }));
  is(!trap.유사만.cancer, '  「유사암진단비」 만 있으면 일반암은 <b>안 잡는다</b>');
  is(trap.유사만.cancer2 && trap.유사만.cancer2.won === 600, '  유사암으로 제대로 잡는다 — 600');
  is(trap.둘다.cancer && trap.둘다.cancer.won === 4000, '  둘 다 있으면 일반암은 4,000');
  is(trap.둘다.cancer2 && trap.둘다.cancer2.won === 800, '  유사암은 800 — 서로 안 섞인다');
  is(!trap.소액.cancer && trap.소액.cancer2, '  「소액암」 도 일반암으로 안 샌다');

  console.log('\n[4] 못 찾은 칸은 0 이 아니라 빈 칸이다');
  const grid = await page.evaluate(() => {
    const B = babaScan('일반암진단비 3,000만원 월보험료 100,000원');
    const A = babaScan('일반암진단비 5,000만원 뇌혈관질환진단비 2,000만원 월보험료 150,000원');
    BABA.rows = BABA_TERMS.map(t => {
      const b = B[t.k] || null, a = A[t.k] || null;
      return { k: t.k, n: t.n, b: b ? b.won : null, a: a ? a.won : null, raw: '' };
    });
    BABA.at = '지금';
    const cancer = BABA.rows.find(r => r.k === 'cancer');
    const brain = BABA.rows.find(r => r.k === 'brain');
    const teeth = BABA.rows.find(r => r.k === 'teeth');
    return { cancerB: cancer.b, cancerA: cancer.a, brainB: brain.b, brainA: brain.a,
             teethB: teeth.b, html: babaGridHtml() };
  });
  is(grid.cancerB === 3000 && grid.cancerA === 5000, '  일반암 기존 3,000 · 신규 5,000');
  is(grid.brainB === null && grid.brainA === 2000, '  기존에 없던 뇌혈관은 기존이 빈 칸, 신규 2,000');
  is(grid.teethB === null, '  아예 안 나온 담보는 빈 칸이다 (0 이 아니다)');
  is(/못 찾음/.test(grid.html), '  화면이 「못 찾음」 이라고 알려 준다');
  is(/보내기 전에 고치세요/.test(grid.html), '  고치라고 말해 준다');
  is(/만원/.test(grid.html), '  단위를 밝힌다');

  console.log('\n[5] 사람이 고친 값이 AI 에게 그대로 간다');
  const brief = await page.evaluate(() => {
    /* 설계사가 뇌혈관 기존값을 손으로 1,000 이라고 적는다 */
    const i = BABA.rows.findIndex(r => r.k === 'brain');
    babaSet(i, 'b', '1,000');
    const before = babaBrief();
    /* 지우면 원문 그대로 보낸다 */
    babaClear();
    return { txt: before, cleared: babaBrief() };
  });
  is(/설계사가 확인한 담보 표/.test(brief.txt), '  「사람이 확인한 표」 라고 못 박는다');
  is(/이 표의 숫자를 그대로 쓴다/.test(brief.txt), '  원문보다 이 표를 쓰라고 시킨다');
  is(/뇌혈관질환 진단비 \| 1000 \| 2000/.test(brief.txt.replace(/\s*\|\s*/g, ' | ')),
     '  손으로 고친 1,000 이 그대로 실린다');
  is(/확인 필요/.test(brief.txt), '  빈 칸은 「확인 필요」 로 나간다 — 지어내지 말라고');
  is(brief.cleared === '', '  표를 지우면 원문 그대로 보낸다');

  console.log('\n[6] 화면에 단추가 붙어 있는가');
  const btn = await page.evaluate(() => {
    const p = PDF_TOOLS.filter(x => x.id === 'baba')[0];
    return { has: !!p, scan: !!(p && p.scan) };
  });
  is(btn.has, '  비포&애프터 카드가 있다');
  const src = require('fs').readFileSync('app/index.html', 'utf8');
  is(/babaDeepRead\(/.test(src) && /끝까지 읽기/.test(src),
     '  「끝까지 읽기 · 값 고치기」 단추가 있다 (쪼개서 전부 읽는 쪽으로 바뀌었다)');
  is(/babaBrief\(\)/.test(src), '  만들 때 확인한 표를 앞에 붙인다');

  console.log('\n[7] 무엇을 읽는지 표로 보여 준다');
  const dict = await page.evaluate(() => {
    babaDictToggle();
    const h = babaDictHtml();
    return { on: BABA_DICT_ON, n: BABA_TERMS.length, html: h,
             /* 머리줄(thead)은 빼고 센다 */
             rows: ((h.split('<tbody>')[1] || '').match(/<tr>/g) || []).length };
  });
  is(dict.on && dict.rows === dict.n,
     '  읽어내는 담보 ' + dict.n + '개가 한 줄씩 다 나온다 — ' + dict.rows + '줄');
  is(/읽어내는 담보/.test(dict.html), '  「읽어내는 담보 N개」 라고 제목이 붙는다');
  is(/이 이름들을 찾습니다/.test(dict.html), '  담보마다 찾는 이름이 같이 보인다');
  is(/일반암.*악성신생물|악성신생물.*일반암/s.test(dict.html), '  같은 담보의 여러 표기가 보인다');
  is(/건너뜀/.test(dict.html), '  헷갈리는 이름은 「건너뜀」 이라고 밝힌다 (유사암 → 일반암 오탐 방지)');
  is(/우리 회사 표기/.test(dict.html), '  회사 표기를 직접 넣는 단추가 줄마다 있다');

  console.log('\n[8] 못 읽으면 가르칠 수 있다 — 이게 「어떤 상황에서도」 의 답이다');
  const teach = await page.evaluate(() => {
    /* 사전에 없는 회사 표기 */
    /* 사전 어디에도 안 걸리는 표기를 골라야 한다. 「뇌혈관보장특약」 은
       기본 사전의 「뇌혈관」 에 이미 걸리므로 시험거리가 못 된다.      */
    const odd = '무배당OO생명 특약안내 · 악성종양보장특약Ⅱ 4,500만원 · 머리혈관보장특약Ⅲ 2,500만원';
    const before = babaScan(odd);
    /* 사장님이 이 회사 표기를 넣는다 */
    const add = {};
    add.cancer = ['악성종양보장특약'];
    add.brain = ['머리혈관보장특약'];
    localStorage.setItem('apex_baba_syn', JSON.stringify(add));
    const after = babaScan(odd);
    const terms = babaTerms();
    const c = terms.filter(t => t.k === 'cancer')[0];
    return { beforeCancer: !!before.cancer, beforeBrain: !!before.brain,
             afterCancer: after.cancer ? after.cancer.won : null,
             afterBrain: after.brain ? after.brain.won : null,
             first: c ? c.syn[0] : '', keptDefault: c ? c.syn.indexOf('일반암') >= 0 : false };
  });
  is(!teach.beforeCancer && !teach.beforeBrain,
     '  처음 보는 회사 표기는 못 읽는다 (당연하다) — 암 ' + teach.beforeCancer + ' · 뇌 ' + teach.beforeBrain);
  is(teach.afterCancer === 4500, '  그 표기를 넣으면 바로 읽는다 — 악성종양보장특약Ⅱ 4,500만 → ' + teach.afterCancer);
  is(teach.afterBrain === 2500, '  머리혈관보장특약Ⅲ 2,500만 → ' + teach.afterBrain);
  is(teach.first === '악성종양보장특약', '  넣으신 표기를 먼저 본다 — ' + teach.first);
  is(teach.keptDefault, '  원래 사전도 그대로 남는다 (덮어쓰지 않는다)');

  console.log('\n[9] PDF 가 없어도 표를 열어 손으로 적는다');
  const blank = await page.evaluate(() => {
    localStorage.removeItem('apex_baba_syn');
    BABA.rows = null;
    babaBlank();
    const n = BABA.rows.length;
    babaSet(2, 'b', '3,000');
    babaSet(2, 'a', '5000');
    const saved = JSON.parse(localStorage.getItem('apex_baba_rows') || 'null');
    /* 새로고침한 셈 치고 되살려 본다 */
    BABA.rows = null;
    babaLoad();
    return { n: n, b: BABA.rows[2].b, a: BABA.rows[2].a,
             savedN: saved && saved.rows ? saved.rows.length : 0,
             brief: babaBrief() };
  });
  is(blank.n === dict.n, '  PDF 없이도 ' + blank.n + '줄이 통째로 열린다');
  is(blank.b === 3000 && blank.a === 5000, '  손으로 적은 값이 들어간다 — 3,000 / 5,000');
  is(blank.savedN === dict.n, '  적은 것이 저장된다 — ' + blank.savedN + '줄');
  is(blank.b === 3000, '  새로고침해도 살아 있다');
  is(/3000/.test(blank.brief.replace(/,/g, '')) && /5000/.test(blank.brief.replace(/,/g, '')),
     '  손으로 적은 값도 그대로 AI 에게 간다');

  console.log('\n[10] 화면에 세 단추가 다 있다');
  const btn3 = require('fs').readFileSync('app/index.html', 'utf8');
  is(/babaBlank\(\)/.test(btn3), '  「✍️ 표만 열기 (손으로 적기)」 가 있다');
  is(/babaDictToggle\(\)/.test(btn3), '  「📖 읽는 담보 보기」 가 있다');
  is(/babaDeepRead\(/.test(btn3), '  「📋 끝까지 읽기」 도 그대로 있다');

  console.log('\n[11] AI 가 준 담보명을 우리 27칸에 제대로 앉히는가');
  const map = await page.evaluate(() => ({
    normal: babaMapName('일반암진단비'),
    space:  babaMapName('악성신생물(암) 진단급여금'),
    trap:   babaMapName('유사암진단비'),
    trap2:  babaMapName('갑상선암진단비'),
    brain:  babaMapName('뇌혈관질환진단비Ⅱ'),
    fee:    babaMapName('합계보험료'),
    none:   babaMapName('연금개시나이')
  }));
  is(map.normal === 'cancer', '  「일반암진단비」 → 일반암');
  is(map.space === 'cancer', '  「악성신생물(암) 진단급여금」 → 일반암');
  is(map.trap === 'cancer2', '  「유사암진단비」 는 유사암으로 — 일반암으로 안 샌다');
  is(map.trap2 === 'cancer2', '  「갑상선암진단비」 도 유사암으로');
  is(map.brain === 'brain', '  「뇌혈관질환진단비Ⅱ」 → 뇌혈관');
  is(map.fee === 'fee', '  「합계보험료」 → 월 보험료');
  is(map.none === null, '  모르는 이름은 억지로 안 맞춘다');

  console.log('\n[12] AI 가 지저분하게 답해도 숫자를 건져 낸다');
  const parse = await page.evaluate(() => ({
    fence: babaParseAi('```json\n[{"n":"일반암","won":3000}]\n```'),
    prose: babaParseAi('네, 판독했습니다.\n[{"n":"뇌혈관","won":2000}]\n이상입니다.'),
    str:   babaParseAi('[{"n":"월 보험료","won":"128,900"}]'),
    nulln: babaParseAi('[{"n":"치아","won":null},{"n":"암","won":500}]'),
    junk:  babaParseAi('읽지 못했습니다'),
    empty: babaParseAi('')
  }));
  is(parse.fence.length === 1 && parse.fence[0].won === 3000, '  코드펜스를 벗겨 낸다');
  is(parse.prose.length === 1 && parse.prose[0].won === 2000, '  앞뒤에 말을 붙여도 배열만 집는다');
  is(parse.str.length === 1 && parse.str[0].won === 128900, '  숫자를 글자로 줘도 숫자로 바꾼다');
  is(parse.nulln.length === 2 && parse.nulln[0].won === null, '  없는 값은 null 로 둔다 (0 으로 안 만든다)');
  is(parse.junk.length === 0 && parse.empty.length === 0, '  배열이 없으면 빈손으로 — 안 터진다');

  console.log('\n[13] 스물몇 쪽짜리 스캔본을 쪼개서 끝까지 읽는가');
  /* 진짜 스캔 PDF 를 만들 수는 없으니, 읽는 길만 흉내 낸다.
     보는 것은 <b>몇 묶음으로 쪼개 어디까지 갔는가</b> 다.        */
  const deep = await page.evaluate(async () => {
    const calls = [];
    window.babaTextAll = () => Promise.resolve({ text: '', pages: 11 });   /* 글자 없는 11쪽 */
    window.babaImgRange = (f, from, to) => { calls.push([from, to]); return Promise.resolve(['img']); };
    window.aiReady = () => true;
    window.callAIVision = (sys, user) => {
      const m = user.match(/(\d+)~(\d+)쪽/);
      const from = +m[1];
      if (from === 5) return Promise.reject(new Error('한 묶음 실패'));   /* 가운데 하나를 일부러 넘어뜨린다 */
      if (from === 1) return Promise.resolve('[{"n":"일반암진단비","won":3000}]');
      return Promise.resolve('[{"n":"뇌혈관질환진단비","won":2000},{"n":"합계보험료","won":21}]');
    };
    const steps = [];
    const r = await babaReadFile({ name: 'scan.pdf' }, (c, t, from, to) => steps.push(c + '/' + t + ':' + from + '-' + to));
    return { kind: r.kind, chunks: r.chunks, failed: r.failed,
             found: r.found, calls, steps, sys: babaAiSys(), user: babaAiUser(9, 11) };
  });
  is(deep.kind === 'scan', '  글자가 없으면 스캔본으로 본다');
  is(deep.chunks === 3, '  11쪽을 넉 장씩 3묶음으로 쪼갠다 — ' + deep.chunks + '묶음');
  is(JSON.stringify(deep.calls) === '[[1,4],[5,8],[9,11]]',
     '  1~4 · 5~8 · 9~11 쪽을 빠짐없이 훑는다 — ' + JSON.stringify(deep.calls));
  is(deep.steps.length === 3 && /1\/3:1-4/.test(deep.steps[0]),
     '  어디까지 갔는지 화면에 알린다 — ' + deep.steps.join(' · '));
  is(deep.failed === 1, '  가운데 묶음이 넘어져도 세어 둔다 — 못 읽은 묶음 ' + deep.failed + '개');
  is(deep.found.length === 3, '  나머지 묶음 값은 그대로 살아 있다 — ' + deep.found.length + '개');
  is(deep.found.some(x => x.won === 2000), '  9~11쪽(마지막 묶음) 값도 들어온다 — 뒤쪽을 안 버린다');
  is(/JSON 배열만/.test(deep.sys) && /지어내지 마라/.test(deep.sys),
     '  AI 에게 JSON 만 · 지어내지 말라고 못 박는다');
  is(/만원 단위 정수/.test(deep.sys), '  단위를 만원으로 못 박는다');

  console.log('\n[14] 글자형과 스캔본을 한 표로 합치는가');
  const merged = await page.evaluate(() => {
    const out = babaMerge([
      { kind: 'text', text: '일반암진단비 3,000만원 · 뇌혈관질환진단비 1,000만원' },
      { kind: 'scan', found: [{ n: '일반암진단비', won: 9999 },        /* 뒤에 온 것은 안 덮는다 */
                              { n: '급성심근경색증진단비', won: 1500 },
                              { n: '치아보철', won: null }] }
    ]);
    return { cancer: out.cancer ? out.cancer.won : null,
             brain: out.brain ? out.brain.won : null,
             mi: out.mi ? out.mi.won : null,
             teeth: out.teeth ? out.teeth.won : null };
  });
  is(merged.cancer === 3000, '  글자에서 먼저 읽은 값이 이긴다 — 3,000 (9,999 로 안 덮인다)');
  is(merged.brain === 1000, '  글자 쪽 값이 그대로 남는다');
  is(merged.mi === 1500, '  스캔 쪽에만 있는 담보는 스캔에서 가져온다');
  is(merged.teeth === null || merged.teeth === undefined, '  값이 없으면 0 이 아니라 빈 칸이다');

  console.log('\n[15] AI 가 없으면 그렇다고 말한다');
  const noai = await page.evaluate(async () => {
    window.babaTextAll = () => Promise.resolve({ text: '', pages: 8 });
    window.aiReady = () => false;
    const r = await babaReadFile({ name: 'scan.pdf' }, () => {});
    return r.kind;
  });
  is(noai === 'scan-noai', '  스캔본인데 AI 가 없으면 조용히 빈 표를 내밀지 않는다 — ' + noai);

  console.log('\n[16] 전·후 차이가 그림으로 나오는가');
  const ch = await page.evaluate(() => {
    localStorage.removeItem('apex_baba_rows');
    BABA.rows = null; babaBlank();
    const set = (name, b, a) => {
      const i = BABA.rows.findIndex(r => r.n === name);
      if (i < 0) return;
      if (b !== null) babaSet(i, 'b', String(b));
      if (a !== null) babaSet(i, 'a', String(a));
    };
    set('암 진단비(일반암)', 3000, 5000);      /* 늘어남 */
    set('뇌혈관질환 진단비', 2000, 1000);      /* 줄어듦 */
    set('급성심근경색', 1000, 1000);           /* 그대로 */
    set('간병·요양', null, 2000);              /* 기존에만 없음 */
    set('월 보험료', 21, 18);                  /* 보험료는 줄었다 */
    BABA_CH_ON = true;
    const h = babaChartHtml();
    return { sumB: babaSum('b'), sumA: babaSum('a'),
             feeB: babaFee('b'), feeA: babaFee('a'),
             html: h, off: (BABA_CH_ON = false, babaChartHtml()) };
  });
  is(ch.sumB === 6000 && ch.sumA === 9000,
     '  보장 합계를 더한다 — 기존 ' + ch.sumB + ' → 신규 ' + ch.sumA + ' (만원)');
  is(ch.feeB === 21 && ch.feeA === 18, '  월 보험료는 보장 합계에 안 넣고 따로 센다');
  is(/보장이[\s\S]{0,40}3,000만[\s\S]{0,20}늘었습니다/.test(ch.html),
     '  맨 위 한 줄이 「보장이 3,000만 늘었습니다」 라고 말한다');
  is(/보험료는[\s\S]{0,40}3만원[\s\S]{0,20}줄었습니다/.test(ch.html),
     '  보험료가 줄어든 것도 같이 말한다');
  is(/▲[\s\S]{0,20}2,000만/.test(ch.html), '  늘어난 담보에 ▲ 2,000만');
  is(/▼[\s\S]{0,20}1,000만/.test(ch.html), '  줄어든 담보에 ▼ 1,000만');
  is(/그대로/.test(ch.html), '  안 바뀐 담보는 「그대로」');
  is(/한쪽만 확인/.test(ch.html), '  한쪽만 있는 담보는 「한쪽만 확인」 — 0 으로 안 채운다');
  is(!/치아|응급실/.test(ch.html), '  둘 다 빈 담보는 아예 안 그린다 (없는 것을 그리지 않는다)');
  is(/#3182F6/.test(ch.html) && /#FF9500/.test(ch.html),
     '  토스 파랑으로 늘어난 것, 주황으로 줄어든 것 — 빨강은 안 쓴다');
  is(!/#F04452|#E5484D|red/i.test(ch.html), '  고객 앞에서 빨강을 안 쓴다');
  is(/babaChartPrint\(\)/.test(ch.html), '  「인쇄 · PDF 로 저장」 단추가 있다');
  is(ch.off === '', '  접으면 안 그린다');

  const src2 = require('fs').readFileSync('app/index.html', 'utf8');
  is(/babaChartToggle\(\)/.test(src2), '  화면에 「📈 전·후 그래프」 단추가 붙어 있다');
  is(/babaChartHtml\(\)\+babaGridHtml\(\)/.test(src2.replace(/\s/g, '')),
     '  표를 다시 그릴 때 그래프도 같이 그린다 (고친 값이 바로 반영된다)');
  is(/보장·지급은 약관과 심사/.test(src2), '  인쇄본에 약관·심사 단서가 붙는다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '비포&애프터 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '비포&애프터 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
