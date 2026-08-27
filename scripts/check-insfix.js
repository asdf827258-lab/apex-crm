/* <b>보장분석에서 읽은 값을 그 자리에서 고칠 수 있는가.</b>

   ※ 읽는 힘 자체는 <b>check-insread.js</b>·<b>check-insdiag.js</b> 가 본다.
     여기는 <b>읽은 뒤에 손대는 길</b>만 본다 — 이름이 겹치지 않게 나눠 두었다.

   회사마다 서식이 다르다. 앱이 아무리 잘 읽어도 못 읽거나 잘못 읽는
   자리가 남는다. 비포&애프터에는 그 자리에서 고칠 길을 냈는데
   (babaSet) 보장분석에는 없었다 — <b>틀린 숫자를 보고도 손댈 방법이
   없었다.</b> 고객 앞에서 그것만큼 답답한 것이 없다.

   그 길을 내면서 <b>새로 생기는 위험</b>이 있다. 여기서 그것을 지킨다.

     ① <b>고친 값이 다른 고객 표에 붙는 것</b> — 제일 큰 사고다.
        김○○ 님 자료에서 고친 5,000만원이 이○○ 님 표에 앉으면,
        고객 앞에서 남의 보장을 읽어 주는 것이 된다.
     ② <b>비운 칸이 0 이 되는 것</b> — 0 은 「보장이 없다」 는 뜻이다.
        비우면 「읽은 값」 으로 돌아가야 한다 (CLAUDE.md 1번).
     ③ <b>고친 것을 안 밝히는 것</b> — 화면에도 AI 에게도 밝혀야 한다.
        AI 에게는 원문 글이 함께 가므로, 안 밝히면 AI 가 원문 숫자를
        보고 <b>도로 되돌린다.</b>
     ④ <b>리포트가 옛 숫자인 채 남는 것</b> — 카드의 판정은 바로 바뀌는데
        아래 리포트 본문은 AI 가 이미 쓴 글이라 안 바뀐다. 그것을 말해
        주지 않으면 사장님이 <b>고쳤다고 믿고</b> 옛 숫자를 보여 주신다.
     ⑤ <b>「다시 만들기」 한 번에 고친 값이 날아가는 것</b> — 다시 읽으면
        원문에서 다시 읽으므로, 붙잡아 두지 않으면 그대로 사라진다.

   여기서 확인합니다.
     1. 표가 실제로 서는가 — 담보 수만큼 · 읽은 값이 만원으로
     2. <b>붙어 버린 꼴</b>(「12683400원」)을 눈에 띄게 세우는가 —
        다만 <b>값은 안 고친다.</b> 무엇이 맞는지는 원본만 안다
     3. 고치면 <b>그 자리에서</b> 판정·부족 목록이 따라오는가
     4. 비우면 <b>읽은 값</b>으로 돌아가는가 (0 으로 안 채운다)
     5. <b>다른 자료에는 한 줄도 안 붙는가</b>
     6. 다시 읽어도 붙는가 (「다시 만들기」 를 견딘다)
     7. 화면·AI 에 <b>고친 값이라고 밝히는가</b> · 옛 리포트를 경고하는가
     8. <b>헛알람이 없는가</b> — 안 고쳤으면 조용한가
     9. 고친 뒤에도 <b>탭이 옆 칸으로 가는가</b> — 다시 그리면서 지금 눌린
        칸을 지워 버리면, 서른일곱 줄 표에서 한 칸마다 다시 눌러야 한다 */

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

/* 견본은 언제나 홍길동 — 실제 고객 이름을 쓰지 않는다 (CLAUDE.md 3번) */
const DOC =
  '홍길동 님의 전체 계약리스트\n' +
  '계약 건수 3건 합계보험료 1,250,000원\n' +
  '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 500,000 원\n' +
  '2 정상 현대해상 무배당 안심건강보험 2019-05-10 월납 15 년 90 세 450,000 원\n' +
  '3 정상 KB손해보험 무배당 행복보장보험 2020-07-21 월납 10 년 80 세 300,000 원\n' +
  '홍길동 님의 담보별 진단현황\n' +
  '암 진단 일반암진단비 권장 5,000만 1 가입 3,000만 1 부족 -2,000만\n' +
  '뇌/심장 진단 뇌혈관질환진단비 권장 3,000만 2 가입 1,000만 2 부족 -2,000만\n' +
  '실손의료비 질병입원의료비 권장 5,000만 3 가입 5,000만 3 충분 -\n';

/* 「다른 고객」 — 이름만 바뀌어도 지문이 달라야 한다 */
const OTHER = DOC.replace(/홍길동/g, '이순신');

/* 표에서 옆 칸이 붙어 버린 꼴 — 「12683400원」. 숫자로는 1,268만원이라
   멀쩡해 보여서, 표시해 주지 않으면 <b>눈으로도 못 잡는다.</b> */
const ODD = DOC.replace('가입 1,000만 2 부족 -2,000만', '가입 12683400원 2 부족 -2,000만');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* 화면을 한 벌 세우고 그 위에서 실제로 고쳐 본다.
     함수만 부르면 「화면에서 정말 고쳐지는가」 를 못 본다.  */
  const R = await page.evaluate(async ({ DOC, OTHER, ODD }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');

    const mount = (sc) => {
      const host = document.createElement('div');
      host._scan = sc;
      host.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
      document.body.appendChild(host);
      return host;
    };
    /* 다시 그리기는 브라우저가 자리를 옮기고 난 뒤다 — 한 박자 기다린다 */
    const done = async (el) => { insFixDone(el); await new Promise(r => setTimeout(r, 0)); };
    const rowOf = (d) => d.want + '|' + d.have + '|' + d.verdict + '|' + (d.gap || '') + '|fix=' + (d.fix || 0);

    /* ── 1. 표가 선다 ─────────────────────────────────────────── */
    let sc = insScan(DOC);
    let host = mount(sc);
    O.nDiag = sc.diags.length;
    O.nRow = host.querySelectorAll('.if-tb tbody tr').length;
    O.nIn = host.querySelectorAll('.if-i').length;
    O.vals = [].slice.call(host.querySelectorAll('.if-i')).map(x => x.value).join(',');
    O.read0 = rowOf(sc.diags[0]);
    O.short0 = sc.short.length;
    O.cleanOdd = host.querySelectorAll('.if-i.odd').length;   /* 멀쩡한 표엔 없다 */

    /* ── 1-2. 붙어 버린 꼴을 눈에 띄게 세운다 ─────────────────── */
    const hostO = mount(insScan(ODD));
    O.oddCell = hostO.querySelectorAll('.if-i.odd').length;
    O.oddTag = /붙어 보임 — 확인/.test(hostO.textContent);
    O.oddNote = /붙어 보이는 칸 1개/.test(hostO.textContent);
    O.oddRaw = /원문:\s*12683400원/.test(hostO.textContent);
    /* <b>값은 우리가 안 고친다</b> — 무엇이 맞는지는 원본만 안다 */
    O.oddKept = hostO._scan.diags[1].have;
    O.oddIn = [].slice.call(hostO.querySelectorAll('.if-i')).map(x => x.value)[3];

    /* ── 2. 고치면 그 자리에서 따라온다 ────────────────────────── */
    let ins = host.querySelectorAll('.if-i');
    insFixSet(ins[1], 0, 'have', '5000');      /* 가입 3,000만 → 5,000만 */
    await done(ins[1]);
    O.afterRow = rowOf(sc.diags[0]);
    O.afterShort = sc.short.length;
    O.afterN = sc.fixN;
    O.mineCell = host.querySelectorAll('.if-i.mine').length;
    O.mineTag = /직접 적으심/.test(host.textContent);
    O.rawKept = /원문:\s*3,000만/.test(host.textContent);
    O.noteMine = /직접 적으신 칸 1개/.test(host.textContent);
    O.noteStale = /고치기 전 값으로 만들어졌습니다/.test(host.textContent);
    O.calcTag = /앱이 다시 셈/.test(host.textContent);

    /* 권장도 고쳐 본다 — 두 칸이 따로 논다 */
    ins = host.querySelectorAll('.if-i');
    insFixSet(ins[0], 0, 'want', '10000');
    await done(ins[0]);
    O.bothRow = rowOf(sc.diags[0]);
    O.bothN = sc.fixN;

    /* ── 3. 비우면 읽은 값으로 ─────────────────────────────────── */
    ins = host.querySelectorAll('.if-i');
    insFixSet(ins[0], 0, 'want', '');
    await done(ins[0]);
    O.halfRow = rowOf(sc.diags[0]);
    ins = host.querySelectorAll('.if-i');
    insFixSet(ins[1], 0, 'have', '');
    await done(ins[1]);
    O.emptyRow = rowOf(sc.diags[0]);
    O.emptyN = sc.fixN;
    O.emptyShort = sc.short.length;

    /* ── 4·5. 다시 고친 뒤 — 다시 읽기 · 다른 자료 ─────────────── */
    ins = host.querySelectorAll('.if-i');
    insFixSet(ins[1], 0, 'have', '5000');
    await done(ins[1]);

    const sc2 = insScan(DOC);                   /* 「다시 만들기」 */
    O.reRow = rowOf(sc2.diags[0]);
    O.reN = sc2.fixN;
    O.reShort = sc2.short.length;

    const sc3 = insScan(OTHER);                 /* 다른 고객 */
    O.otherRow = rowOf(sc3.diags[0]);
    O.otherN = sc3.fixN;
    O.sigDiff = sc2.fixSig !== sc3.fixSig;

    /* ── 6. AI 에게 밝히는가 ───────────────────────────────────── */
    const br = insBrief(sc2);
    O.briefStar = /★설계사가 고침/.test(br);
    O.briefNote = /★ 쪽을 쓴다/.test(br);
    O.briefLine = (br.split('\n').filter(x => x.indexOf('일반암진단비') >= 0)[0] || '').trim();

    /* ── 7. 헛알람 — 안 고쳤으면 조용한가 ──────────────────────── */
    localStorage.removeItem('apex_ins_fix');
    const sc4 = insScan(DOC);
    const host4 = mount(sc4);
    O.quietN = sc4.fixN;
    O.quietMine = host4.querySelectorAll('.if-i.mine').length;
    O.quietNote = /직접 적으신 칸/.test(host4.textContent);
    O.quietStale = /고치기 전 값/.test(host4.textContent);
    O.quietStar = /★설계사가 고침/.test(insBrief(sc4));
    O.quietRow = rowOf(sc4.diags[0]);
    O.quietTable = host4.querySelectorAll('.if-tb tbody tr').length;

    /* <b>빈 껍데기</b>가 저장돼 있어도 「고쳤다」 고 하면 안 된다.
       지우다 만 자국·옛 판이 남긴 자국이 이렇게 남는다. 없는 담보 앞으로
       남은 값도 마찬가지 — 조용히 무시하고 터지지도 않아야 한다. */
    const shell = {};
    shell[insFixKey(sc4.diags[0])] = {};
    shell['없는담보|가짜'] = { h: 9999 };
    localStorage.setItem('apex_ins_fix', JSON.stringify({ sig: sc4.fixSig, fix: shell }));
    const sc5 = insScan(DOC);
    const host5 = mount(sc5);
    O.shellN = sc5.fixN;
    O.shellMine = host5.querySelectorAll('.if-i.mine').length;
    O.shellNote = /직접 적으신 칸/.test(host5.textContent);
    O.shellRow = rowOf(sc5.diags[0]);
    O.shellStar = /★설계사가 고침/.test(insBrief(sc5));

    /* 담보가 하나도 없는 자료에는 표를 세우지 않는다 (1번) */
    const scNo = insScan('홍길동 님의 전체 계약리스트\n계약 건수 1건 합계보험료 100,000원\n' +
      '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 100,000 원\n');
    O.noDiagTable = scNo ? /ins-fix/.test(insCardHtml(scNo)) : true;
    O.noDiagN = scNo ? scNo.diags.length : -1;
    return O;
  }, { DOC, OTHER, ODD });

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 읽은 값 표가 실제로 선다');
  is(R.nDiag === 3 && R.nRow === 3, '  담보 ' + R.nDiag + '개를 ' + R.nRow + '줄로 세운다');
  is(R.nIn === 6, '  줄마다 권장·가입 두 칸 — 모두 ' + R.nIn + '칸');
  is(R.vals === '5000,3000,3000,1000,5000,5000',
     '  읽은 값이 <b>만원</b>으로 들어가 있다 — ' + R.vals);
  is(R.read0 === '5,000만|3,000만|부족|-2,000만|fix=0', '  손대기 전 — ' + R.read0);
  is(R.noDiagN === 0 && R.noDiagTable === false,
     '  담보를 하나도 못 읽었으면 <b>표를 안 세운다</b> (빈 칸을 만들지 않는다)');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 붙어 버린 꼴을 눈에 띄게 세운다 — 값은 안 고친다');
  is(R.oddCell === 1 && R.oddTag,
     '  「12683400원」 칸에 <b>「붙어 보임 — 확인」</b> 이 붙는다');
  is(R.oddNote, '  위에 <b>「붙어 보이는 칸 1개」</b> 를 적는다');
  is(R.oddRaw && R.oddIn === '1268',
     '  <b>원문을 그대로</b> 보여 준다 — 칸에는 앱이 읽은 ' + R.oddIn + ' 이 그대로');
  is(R.oddKept === '12683400원',
     '  <b>값을 우리가 지어내 고치지 않는다</b> — ' + R.oddKept + ' 그대로 (CLAUDE.md 1번)');
  is(R.cleanOdd === 0, '  멀쩡한 표에는 <b>안 붙는다</b> — 헛알람 없음');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 고치면 그 자리에서 판정·부족이 따라온다');
  is(R.afterRow === '5,000만|5,000만원|충분||fix=1',
     '  가입 3,000만 → 5,000만 이면 <b>부족이 충분으로</b> — ' + R.afterRow);
  is(R.short0 === 2 && R.afterShort === 1,
     '  부족 목록도 함께 줄어든다 — ' + R.short0 + '개 → ' + R.afterShort + '개');
  is(R.afterN === 1 && R.mineCell === 1 && R.mineTag,
     '  그 칸만 <b>파랗게</b> 표시되고 「직접 적으심」 이 붙는다');
  is(R.rawKept, '  덮은 <b>원문(3,000만)</b>도 함께 남는다 — 되짚을 수 있다');
  is(R.calcTag, '  판정 옆에 <b>「앱이 다시 셈」</b> — 원본 판정이 아니라고 밝힌다');
  is(R.bothRow === '1억원|5,000만원|부족|-5,000만원|fix=1' && R.bothN === 1,
     '  권장도 따로 고쳐진다 — ' + R.bothRow);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 비우면 읽은 값으로 돌아간다 — 0 으로 채우지 않는다');
  is(R.halfRow === '5,000만|5,000만원|충분||fix=1',
     '  권장만 비우면 <b>권장만</b> 읽은 값으로 — ' + R.halfRow);
  is(R.emptyRow === '5,000만|3,000만|부족|-2,000만|fix=0',
     '  둘 다 비우면 <b>판정·과부족까지</b> 원본으로 — ' + R.emptyRow);
  is(R.emptyN === 0 && R.emptyShort === 2,
     '  고친 칸 수도 부족 목록도 되돌아온다 — ' + R.emptyN + '개 · 부족 ' + R.emptyShort + '개');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 다른 자료에는 한 줄도 안 붙는다');
  is(R.sigDiff, '  자료가 다르면 <b>지문이 다르다</b>');
  is(R.otherN === 0 && R.otherRow === '5,000만|3,000만|부족|-2,000만|fix=0',
     '  다른 고객 표는 <b>읽은 값 그대로</b> — ' + R.otherRow);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 「다시 만들기」 를 견딘다');
  is(R.reN === 1 && R.reRow === '5,000만|5,000만원|충분||fix=1',
     '  다시 읽어도 고친 값이 <b>그대로 붙는다</b> — ' + R.reRow);
  is(R.reShort === 1, '  부족 목록도 고친 값 기준 — ' + R.reShort + '개');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[7] 고친 값이라고 화면에도 AI 에게도 밝힌다');
  is(R.noteMine, '  화면 — 「직접 적으신 칸 N개」');
  is(R.noteStale, '  화면 — <b>「아래 리포트는 고치기 전 값」</b> 경고');
  is(R.briefStar && R.briefNote,
     '  AI — ★ 표시와 <b>「★ 쪽을 쓴다」</b> 안내가 함께 간다');
  is(/★설계사가 고침/.test(R.briefLine), '  그 줄에 붙는다 — ' + R.briefLine);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[8] 헛알람이 없다 — 안 고쳤으면 조용하다');
  is(R.quietTable === 3, '  표는 그대로 선다 — ' + R.quietTable + '줄');
  is(R.quietN === 0 && R.quietMine === 0, '  파란 칸도, 고친 칸 수도 <b>0</b>');
  is(!R.quietNote && !R.quietStale, '  「직접 적으신 칸」·「고치기 전 값」 안내가 <b>안 뜬다</b>');
  is(!R.quietStar, '  AI 브리핑에 ★ 가 <b>안 붙는다</b>');
  is(R.quietRow === '5,000만|3,000만|부족|-2,000만|fix=0', '  값도 원본 그대로 — ' + R.quietRow);
  is(R.shellN === 0 && R.shellMine === 0 && !R.shellNote && !R.shellStar,
     '  <b>빈 껍데기</b>가 저장돼 있어도 「고쳤다」 고 하지 않는다');
  is(R.shellRow === '5,000만|3,000만|부족|-2,000만|fix=0',
     '  없는 담보 앞으로 남은 값은 조용히 지나친다 — ' + R.shellRow);
  is(errs.length === 0, '  화면이 터지지 않는다' + (errs.length ? ' — ' + errs[0] : ''));

  /* ─────────────────────────────────────────────────────────────── */
  /* 표를 고치면 다시 그린다. 그런데 <b>지금 눌린 칸이 사라진다.</b>
     탭으로 옆 칸에 가려던 중이면 그 칸이 태어나기도 전에 지워져
     <b>본문으로 튕겨 나간다.</b> 담보 서른일곱 줄짜리 표에서 한 칸마다
     다시 눌러야 하면 고객 앞에서 못 쓴다. 진짜 자판으로 눌러 본다. */
  console.log('\n[9] 고친 뒤에도 탭이 옆 칸으로 간다');
  await page.evaluate((DOC) => {
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    if (typeof insCssMount === 'function') insCssMount();
    const sc = insScan(DOC);
    const h = document.createElement('div');
    h.id = 'TABH'; h._scan = sc;
    h.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
    document.body.appendChild(h);
  }, DOC);
  const where = () => page.evaluate(() => {
    const all = [].slice.call(document.querySelectorAll('#TABH .if-i'));
    return { i: all.indexOf(document.activeElement), n: all.length };
  });
  await page.locator('#TABH .if-i').nth(1).focus();
  const w0 = await where();
  await page.keyboard.type('5000');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  const w1 = await where();
  is(w0.i === 1, '  두 번째 칸에 들어갔다');
  is(w1.i === 2, '  값을 치고 탭 — <b>세 번째 칸</b>으로 간다 (본문으로 안 튕긴다)' +
     (w1.i < 0 ? ' — 지금은 튕겼습니다' : ' — 지금 ' + (w1.i + 1) + '번째'));
  const painted = await page.evaluate(() =>
    document.querySelectorAll('#TABH .if-i.mine').length + '|' +
    (/직접 적으신 칸 1개/.test(document.body.textContent) ? 1 : 0));
  is(painted === '1|1', '  그 사이에 표는 <b>제대로 다시 그려졌다</b> — ' + painted);

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('보장분석 고치기 점검 — ' + bad + '군데 어긋납니다.')
                  : '보장분석 고치기 점검 통과 — 읽은 값을 그 자리에서 고칠 수 있습니다.');
  process.exit(bad ? 1 : 0);
})();
