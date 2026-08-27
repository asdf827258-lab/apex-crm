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
        칸을 지워 버리면, 서른일곱 줄 표에서 한 칸마다 다시 눌러야 한다
    10. <b>특약</b>도 같은 길로 고쳐지는가 — 금액을 못 믿는다고 담보를
        버리지 않는가 · 수백 줄을 다 깔지 않는가 · 계열 판정이 살아나는가
    11. <b>0 을 적을 수 있는가</b> — ④ 의 짝이다. 못 읽은 칸을 0 으로
        채우지 않는 것과, 사장님이 <b>직접 적으신 0</b> 을 값으로 받는
        것은 같은 규칙의 앞뒤다. 여태 0 은 지우개여서, 원본이 엉뚱하게
        읽은 담보를 <b>「없다」 고 못 박을 방법이 없었다.</b> */

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

/* 특약 — 기준담보 37개 표에 <b>없는</b> 것들. 요즘 실지급을 가르는
   비급여 암주요치료비·표적항암·전액본인부담이 여기에만 있다. */
const RDOC =
  '홍길동 님의 전체 계약리스트\n' +
  '계약 건수 1건 합계보험료 500,000원\n' +
  '1 정상 삼성화재 무배당 튼튼종합보험 2018-03-01 월납 20 년 100 세 500,000 원\n' +
  '홍길동 님의 상품별 가입담보상세\n' +
  '삼성화재 | 가입일자 : 2018-03-01 | 무배당 튼튼종합보험 ' +
  '1 정액 일반암진단비 3,000만 2 정액 비급여암주요치료비 12683400원 ' +
  '3 정액 표적항암약물허가치료비 1,000만 4 정액 전액본인부담의료비 500만\n';

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

    /* 고치는 표는 <b>접힘이 기본</b>이다(급한 것이 있으면 저절로 펼쳐진다).
       표 자체를 보는 시험이라 여기서는 펼쳐 둔다 — 접힘 규칙은 [11] 이 본다. */
    const mount = (sc, keep) => {
      const host = document.createElement('div');
      host._scan = sc;
      if (!keep) { sc.fixOpen = 1; sc.dAll = 1; }
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
    sc.fixOpen = 1; sc.dAll = 1;
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
  /* 지우지 않고 그냥 친다 — 누를 때 통째로 잡히면 <b>덮어써야</b> 한다.
     안 잡히면 3000 뒤에 붙어 30005000 이 된다 (만 배 사고). */
  await page.keyboard.type('5000');
  const typed = await page.evaluate(() =>
    document.querySelectorAll('#TABH .if-i')[1].value);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  const w1 = await where();
  is(w0.i === 1, '  두 번째 칸에 들어갔다');
  is(typed === '5000', '  누르면 <b>통째로 잡혀</b> 덮어써진다 (이어 붙지 않는다) — ' + typed);
  is(w1.i === 2, '  값을 치고 탭 — <b>세 번째 칸</b>으로 간다 (본문으로 안 튕긴다)' +
     (w1.i < 0 ? ' — 지금은 튕겼습니다' : ' — 지금 ' + (w1.i + 1) + '번째'));
  const painted = await page.evaluate(() =>
    document.querySelectorAll('#TABH .if-i.mine').length + '|' +
    (/직접 적으신 칸 1개/.test(document.body.textContent) ? 1 : 0));
  is(painted === '1|1', '  그 사이에 표는 <b>제대로 다시 그려졌다</b> — ' + painted);

  /* ─────────────────────────────────────────────────────────────── */
  /* 특약은 계약 하나에 수십 개, 다 합치면 수백 줄이다. 담보진단 표는
     <b>기준담보 37개</b>만 보므로, 요즘 실지급을 가르는 비급여 암주요치료비·
     전액본인부담·표적항암·순환계치료비는 <b>특약에만</b> 있다. 정작 그 목록이
     못 고치는 곳이었다.

     그리고 더 큰 것이 있었다 — 금액을 못 믿으면 그 줄을 <b>통째로 버려서</b>
     「비급여 암주요치료비 ✕ 없음」 이라는 <b>틀린 결론</b>이 고객 앞에 섰다.
     있는 보장을 없다고 말하는 것이다.                                */
  console.log('\n[10] 특약도 같은 길로 고친다 — 금액을 못 믿어도 담보는 남는다');
  const RD = await page.evaluate(async ({ RDOC }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    if (typeof insCssMount === 'function') insCssMount();
    const sc = insScan(RDOC);
    sc.fixOpen = 1;
    const h = document.createElement('div');
    h.id = 'RH'; h._scan = sc;
    h.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
    document.body.appendChild(h);

    O.riderN = sc.riderN;
    O.names = sc.riders[0].rows.map(r => r.name).join(',');
    O.badRow = sc.riders[0].rows[1].name + '=' + sc.riders[0].rows[1].amount +
      '/원문=' + (sc.riders[0].rows[1].raw || '') + '/bad=' + (sc.riders[0].rows[1].bad || 0);
    /* 계열 판정이 살아나는가 — 이것이 고객 앞에 서는 결론이다 */
    O.gapOn = (sc.gaps || []).filter(g => /비급여 암주요치료비/.test(g.name)).map(g => g.has)[0];
    O.gapTxt = (sc.gaps || []).filter(g => /비급여 암주요치료비/.test(g.name)).map(g => g.found.join(''))[0];
    /* 손볼 것만 보인다 */
    O.shown = h.querySelectorAll('.if-r .if-i').length;
    O.oddTag = /붙어 보임 — 확인/.test(h.textContent);
    O.rawShown = /원문:\s*12683400원/.test(h.textContent);
    O.onlyNote = /손볼 것 1개/.test(h.textContent);
    /* AI 에게 숫자를 안 준다 */
    O.briefBad = insBrief(sc).split('\n').filter(x => x.indexOf('비급여암주요치료비') >= 0)[0] || '';

    /* 고친다 */
    const ins = h.querySelectorAll('.if-r .if-i');
    insFixRSet(ins[0], 0, 1, '3000');
    insFixDone(ins[0]);
    await new Promise(r => setTimeout(r, 0));
    O.fixRN = sc.fixRN;
    O.fixed = sc.riders[0].rows[1].amount + '/fx=' + sc.riders[0].rows[1].fx;
    O.mine = h.querySelectorAll('.if-r .if-i.mine').length;
    O.stale = /고치기 전 값/.test(h.textContent);
    O.clearBtn = /고친 값 1개 전부 지우기/.test(h.textContent);
    O.briefStar = /비급여암주요치료비.*★설계사가 고침/.test(insBrief(sc));
    /* 「다시 만들기」 를 견딘다 */
    const sc2 = insScan(RDOC);
    O.reN = sc2.fixRN;
    O.reAmt = sc2.riders[0].rows[1].amount;
    /* 다른 고객에게는 안 붙는다 */
    const sc3 = insScan(RDOC.replace(/홍길동/g, '이순신'));
    O.otherN = sc3.fixRN;
    O.otherAmt = sc3.riders[0].rows[1].amount;

    /* 전체 펼치기 */
    insFixRAll(h.querySelector('.if-r .if-btn button'));
    await new Promise(r => setTimeout(r, 0));
    O.allShown = h.querySelectorAll('.if-r .if-i').length;
    /* 전부 지우면 특약도 함께 되돌아간다 */
    insFixClear(h.querySelector('.if-btn button'));
    await new Promise(r => setTimeout(r, 0));
    O.clearedN = sc.fixRN;
    O.clearedAmt = sc.riders[0].rows[1].amount + '/bad=' + (sc.riders[0].rows[1].bad || 0);
    return O;
  }, { RDOC });

  is(RD.riderN === 4 && RD.names === '일반암진단비,비급여암주요치료비,표적항암약물허가치료비,전액본인부담의료비',
     '  금액을 못 믿어도 <b>담보 넷이 다 남는다</b> — ' + RD.names);
  is(RD.badRow === '비급여암주요치료비=/원문=12683400원/bad=1',
     '  금액만 비고 <b>원문이 남는다</b> — ' + RD.badRow);
  is(RD.gapOn === true && /금액 확인 필요/.test(RD.gapTxt || ''),
     '  <b>「○ 비급여 암주요치료비」</b> — 있는 보장을 없다고 하지 않는다 · ' + RD.gapTxt);
  is(RD.shown === 1 && RD.oddTag && RD.rawShown && RD.onlyNote,
     '  <b>손볼 것 한 칸만</b> 보이고 원문이 붙는다 (수백 줄을 다 깔지 않는다)');
  is(/확인 필요/.test(RD.briefBad) && !/1,?268/.test(RD.briefBad),
     '  AI 에게 <b>숫자를 주지 않는다</b> — ' + RD.briefBad.trim().slice(0, 76));
  is(RD.fixRN === 1 && RD.fixed === '3,000만원/fx=1' && RD.mine === 1,
     '  고치면 그 자리에서 들어간다 — ' + RD.fixed);
  is(RD.stale && RD.clearBtn && RD.briefStar,
     '  옛 리포트 경고 · 지우기 단추 · AI 에 ★ 가 <b>모두</b> 뜬다');
  is(RD.reN === 1 && RD.reAmt === '3,000만원',
     '  「다시 만들기」 를 견딘다 — ' + RD.reAmt);
  is(RD.otherN === 0 && RD.otherAmt === '',
     '  <b>다른 고객 특약에는 안 붙는다</b> — ' + (RD.otherAmt || '(빈 칸 그대로)'));
  is(RD.allShown === 4, '  펼치면 <b>전부</b> 나온다 — ' + RD.allShown + '칸');
  is(RD.clearedN === 0 && RD.clearedAmt === '/bad=1',
     '  전부 지우면 특약도 <b>함께</b> 되돌아간다 — ' + RD.clearedAmt);

  /* ─────────────────────────────────────────────────────────────── */
  /* 카드가 길면 상담 중에 리포트까지 내려가는 데만 한참 걸린다. 고치는
     표는 상담 <b>전에</b> 쓰는 것이라 접어 둔다. 그렇다고 늘 접어 두면
     <b>붙어 보이는 칸을 못 보고 지나친다</b> — 그것이 제일 위험하다.
     그래서 손볼 것이 하나라도 있으면 <b>펼친 채로</b> 연다.        */
  console.log('\n[11] 상담 화면을 안 가린다 — 접어 두되 급한 것은 펼친다');
  const P = await page.evaluate(async ({ DOC, ODD, RDOC }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    const put = (sc) => {
      document.body.innerHTML = '';
      const h = document.createElement('div');
      h.id = 'PH'; h._scan = sc;
      h.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
      document.body.appendChild(h);
      return h;
    };
    /* 멀쩡한 자료 — 접혀 있다 */
    let h = put(insScan(DOC));
    O.calmIn = h.querySelectorAll('.if-i').length;
    O.calmHead = /읽은 값 고치기/.test(h.textContent);
    O.calmCount = /담보진단 3개/.test(h.textContent);
    O.calmHot = h.querySelectorAll('.if-ph.hot').length;
    O.calmCta = /펼쳐서 고치기/.test(h.textContent);
    /* 눌러서 편다 */
    h.querySelector('.if-ph').click();
    await new Promise(r => setTimeout(r, 0));
    /* 펼쳐도 <b>손볼 것이 없으면 줄은 안 깐다</b> — 단추로 전체를 편다 */
    O.openIn = document.querySelectorAll('#PH .if-i').length;
    O.openCta = /접기/.test(document.getElementById('PH').textContent);
    O.openNote = /붙어 보이는 칸도, 고치신 칸도 <b>없습니다/.test(document.getElementById('PH').innerHTML);
    O.openBtn = /전체 3개 펼치기/.test(document.getElementById('PH').textContent);
    const dbtn = [].slice.call(document.querySelectorAll('#PH .if-btn button'))
      .filter(x => /전체 3개/.test(x.textContent))[0];
    if (dbtn) dbtn.click();
    await new Promise(r => setTimeout(r, 0));
    O.dAllIn = document.querySelectorAll('#PH .if-i').length;
    /* 다시 눌러 접는다 */
    document.querySelector('#PH .if-ph').click();
    await new Promise(r => setTimeout(r, 0));
    O.shutIn = document.querySelectorAll('#PH .if-i').length;

    /* 붙어 보이는 칸이 있으면 <b>저절로</b> 펼쳐진다 */
    h = put(insScan(ODD));
    O.oddIn = h.querySelectorAll('.if-i').length;
    O.oddHot = h.querySelectorAll('.if-ph.hot').length;
    O.oddHead = /붙어 보이는 칸 1개/.test(h.querySelector('.if-ph').textContent);
    /* 특약에 붙어 보이는 칸이 있어도 마찬가지 */
    h = put(insScan(RDOC));
    O.rOddIn = h.querySelectorAll('.if-r .if-i').length;
    O.rOddHead = /특약 4개/.test(h.querySelector('.if-ph').textContent);

    /* ── 하나뿐인 「붙어 보이는 칸」 을 고치는 <b>그 순간</b> ──────────
       고치고 나면 붙어 보이는 칸이 0 이 된다. 그렇다고 표가 그 자리에서
       접혀 버리면, 사장님은 방금 적은 숫자가 어디로 갔는지 알 수 없다. */
    h = put(insScan(ODD));
    O.editWasOpen = h.querySelectorAll('.if-i').length > 0;
    /* 접힘 기본이라 <b>붙어 보이는 그 줄만</b> 깔린다 — 칸이 둘뿐이다 */
    let ins = h.querySelectorAll('.if-i');
    O.editCells = ins.length;
    insFixSet(ins[1], 1, 'have', '2000');    /* 하나뿐인 붙어 보이는 칸 */
    insFixDone(ins[1]);
    await new Promise(r => setTimeout(r, 0));
    O.stillOpen = document.querySelectorAll('#PH .if-i').length > 0;
    O.stillMine = document.querySelectorAll('#PH .if-i.mine').length;
    O.noMoreOdd = document.querySelectorAll('#PH .if-i.odd').length;

    /* 다음에 다시 열면 — 손볼 것이 없으니 <b>접혀 있고</b>, 머리글이 말해 준다 */
    const fresh = insScan(ODD);
    h = put(fresh);
    O.mineShut = h.querySelectorAll('.if-i').length === 0;
    O.mineHead = /직접 적으신 칸 1개/.test(h.querySelector('.if-ph').textContent);
    O.mineNotHot = h.querySelectorAll('.if-ph.hot').length;
    return O;
  }, { DOC, ODD, RDOC });

  is(P.calmIn === 0 && P.calmHead && P.calmCount && P.calmCta,
     '  손볼 것이 없으면 <b>접혀 있다</b> — 머리글에 「담보진단 3개」 만');
  is(P.calmHot === 0, '  급한 것이 없으면 <b>노란 머리글이 아니다</b>');
  is(P.openIn === 0 && P.openCta && P.openNote && P.openBtn,
     '  펼쳐도 <b>손볼 것이 없으면 줄은 안 깐다</b> — 「전체 3개 펼치기」 단추만');
  is(P.dAllIn === 6, '  그 단추를 누르면 <b>전부</b> 나온다 — ' + P.dAllIn + '칸');
  is(P.shutIn === 0, '  다시 누르면 접힌다');
  is(P.oddIn === 2 && P.oddHot === 1 && P.oddHead,
     '  붙어 보이는 칸이 있으면 <b>저절로 펼쳐지고</b> 머리글이 노랗다');
  is(P.rOddIn === 1 && P.rOddHead,
     '  <b>특약</b>에 붙어 보이는 칸이 있어도 마찬가지 — ' + P.rOddIn + '칸');
  is(P.editCells === 2, '  펼쳐질 때도 <b>그 줄만</b> 깔린다 — ' + P.editCells + '칸');
  is(P.editWasOpen && P.stillOpen && P.stillMine === 1 && P.noMoreOdd === 0,
     '  마지막 칸을 고쳐 붙어 보이는 칸이 0 이 돼도 <b>표가 안 접힌다</b>');
  is(P.mineShut && P.mineHead && P.mineNotHot === 1,
     '  다음에 열면 <b>접혀 있고</b> 머리글이 「직접 적으신 칸 1개」 라고 말한다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 권장만 고치고 가입 칸이 비면 — 「미가입 · -5,000만원」 이라고 적으면
     <b>그 보장이 없다</b> 는 뜻이 된다. 비어 있는 것은 <b>모름</b>이지
     0 이 아니다. 오늘 밤 특약에서 잡은 것과 같은 사고다 (CLAUDE.md 1번). */
  console.log('\n[16] 모르는 칸을 「없다」 고 말하지 않는다');
  const N = await page.evaluate(async ({ DOC }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    const sc = insScan(DOC);
    sc.fixOpen = 1; sc.dAll = 1;
    const h = document.createElement('div');
    h.id = 'NH'; h._scan = sc;
    h.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
    document.body.appendChild(h);
    /* 가입 칸을 <b>비우고</b> 권장만 고친다 — 「얼마 있는지 모르겠다」 */
    let ins = h.querySelectorAll('.if-i');
    insFixSet(ins[1], 0, 'have', '');
    insFixSet(ins[0], 0, 'want', '10000');
    insFixDone(ins[0]);
    await new Promise(r => setTimeout(r, 0));
    /* 읽은 값이 있으니 비워도 그리로 돌아간다 — 진짜 빈 칸을 만들어 본다 */
    sc.diags[0].rh = '';
    insFixRow(sc.diags[0], { w: 10000 });
    O.row = sc.diags[0].have + '|' + sc.diags[0].verdict + '|' + (sc.diags[0].gap || '(없음)');
    O.notNo = sc.diags[0].verdict !== '미가입';
    O.noGap = !sc.diags[0].gap;
    /* 글자는 있는데 못 읽는 경우도 같다 */
    sc.diags[0].rh = '확인필요';
    insFixRow(sc.diags[0], { w: 10000 });
    O.row2 = sc.diags[0].have + '|' + sc.diags[0].verdict + '|' + (sc.diags[0].gap || '(없음)');
    /* 진짜 0 이면 그때는 부족이다 */
    sc.diags[0].rh = '0';
    insFixRow(sc.diags[0], { w: 10000 });
    O.row3 = sc.diags[0].have + '|' + sc.diags[0].verdict + '|' + (sc.diags[0].gap || '(없음)');
    return O;
  }, { DOC });
  is(N.notNo && N.noGap && N.row === '|확인 필요|(없음)',
     '  가입 칸이 비면 <b>「확인 필요」</b> — 「미가입」 도 과부족도 안 적는다 · ' + N.row);
  is(N.row2 === '확인필요|확인 필요|(없음)',
     '  글자는 있는데 못 읽어도 같다 — ' + N.row2);
  is(N.row3 === '0|확인 필요|(없음)',
     '  「0」 도 금액으로 못 읽으면 <b>지어내지 않는다</b> — ' + N.row3);

  /* ─────────────────────────────────────────────────────────────── */
  /* 앞의 [16] 과 <b>짝</b>이다. 못 읽은 칸을 0 으로 채우지 않는 것과,
     사장님이 <b>직접 적으신 0</b> 을 값으로 받는 것은 같은 규칙의 앞뒤다 —
     「모름(null)」 과 「0」 을 구분한다 (CLAUDE.md 1번).

     여태 0 은 <b>지우개</b>였다. 「0」 을 치고 탭을 누르면 말없이 읽은
     값으로 돌아갔다. 원본이 엉뚱하게 읽어 화면에 「일반암 3,000만원
     가입」 이라 찍혔는데 <b>실제로는 없는</b> 담보라면, 그것을 지울
     방법이 없었다. 고객 앞에 서는 숫자 중에 그보다 나쁜 것이 없다. */
  console.log('\n[17] 「없다」 고 못 박을 수 있다 — 0 은 지우개가 아니라 값이다');
  const Z = await page.evaluate(async ({ DOC }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    const sc = insScan(DOC);
    sc.fixOpen = 1; sc.dAll = 1; sc.rAll = 1;
    const h = document.createElement('div');
    h.id = 'ZH'; h._scan = sc;
    h.innerHTML = insCardHtml(sc);
    document.body.appendChild(h);
    O.read = sc.diags[0].have;               /* 원본이 읽은 값 */

    /* ① 가입 칸에 0 — 「이 담보는 없다」 */
    let ins = h.querySelectorAll('.if-i');
    insFixSet(ins[1], 0, 'have', '0');
    insFixDone(ins[1]);
    await new Promise(r => setTimeout(r, 0));
    const H = document.getElementById('ZH');
    O.row = sc.diags[0].have + '|' + sc.diags[0].verdict + '|' + (sc.diags[0].gap || '(없음)');
    O.fix = sc.diags[0].fix;
    O.cell = H.querySelectorAll('.if-i')[1].value;     /* 칸에 0 이 남아 있는가 */
    O.inShort = sc.short.some(d => d.name === sc.diags[0].name);
    O.fixN = sc.fixN;
    /* 요약 줄이 <b>「원본이」</b> 라고 말하면서 우리가 셈한 값을 섞으면,
       사장님이 고객에게 「분석표에도 이렇게 나옵니다」 라고 말씀하시게 된다. */
    const sh = H.querySelector('.ir-short');
    O.short = sh ? sh.textContent.replace(/\s+/g, ' ').trim() : '(없음)';

    /* ② 다시 읽어도 붙어 있는가 — 「다시 만들기」 를 견딘다 */
    const s2 = insScan(DOC);
    O.re = s2.diags[0].have + '|' + s2.diags[0].verdict + '|fixN=' + s2.fixN;

    /* ③ 비우면 그때는 <b>읽은 값</b>으로 돌아간다 — 지우개는 빈 칸이다 */
    const e = document.getElementById('ZH').querySelectorAll('.if-i')[1];
    insFixSet(e, 0, 'have', '');
    insFixDone(e);
    await new Promise(r => setTimeout(r, 0));
    O.cleared = sc.diags[0].have + '|' + sc.diags[0].verdict + '|fix=' + sc.diags[0].fix;

    /* ④ 빈 칸은 여전히 <b>센다</b> — 담보는 있고 금액만 못 읽은 것이다.
          그것을 버려서 「표적·면역 대응 불가」 라는 틀린 결론이 섰다. */
    O.emptyCounts = insAmtZero('') === false && insAmtZero(null) === false;
    O.zeroForms = ['0', '0원', '0만원', '0억'].every(insAmtZero);
    O.notZero = !insAmtZero('0.5만원') && !insAmtZero('1,000만원') && !insAmtZero('3,000만');

    /* ⑤ AI 에게 <b>0 이 무슨 뜻인지</b> 일러 준다 */
    insFixSet(document.getElementById('ZH').querySelectorAll('.if-i')[1], 0, 'have', '0');
    O.brief = insBrief(sc);
    return O;
  }, { DOC });

  /* 특약도 같다 — 그리고 0 이면 위쪽 <b>계열 표</b>에서도 빠져야 한다.
     세면 화면에 「○ 있음」 이라 찍혀, 없는 보장을 있다고 말한다.
     특약이 있는 자료(RDOC)로 따로 본다.                            */
  const ZR = await page.evaluate(async ({ RDOC }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    const sc = insScan(RDOC);
    sc.fixOpen = 1; sc.rAll = 1;
    const h = document.createElement('div');
    h.id = 'ZR'; h._scan = sc;
    h.innerHTML = insCardHtml(sc);
    document.body.appendChild(h);
    const rows = sc.riders[0].rows;
    let ri = -1;
    rows.forEach((x, k) => { if (/비급여/.test(x.name)) ri = k; });
    O.riderName = ri >= 0 ? rows[ri].name : '(못 찾음)';
    /* 금액을 못 믿어 <b>비워 둔</b> 줄이다 — 그래도 계열 표는 「있음」 이어야
       한다. 담보는 있고 금액만 모르는 것이다. */
    O.readAmt = rows[ri].amount === '' ? '(비어 있음)' : rows[ri].amount;
    const before = insScan(RDOC).gaps.filter(g => /비급여/.test(g.name))[0];
    O.gapBefore = before ? (before.has ? '있음' : '없음') : '(표에 없음)';
    insFixRSet(h.querySelectorAll('.if-i')[0], 0, ri, '0');
    O.rider = rows[ri].amount + '|fx=' + rows[ri].fx + '|na=' + rows[ri].na;
    const after = insScan(RDOC).gaps.filter(g => /비급여/.test(g.name))[0];
    O.gapAfter = after ? (after.has ? '있음' : '없음') : '(표에 없음)';
    /* 다른 계열은 <b>안 건드린다</b> — 하나 못 박았다고 옆이 따라 없어지면 안 된다 */
    const tgt = insScan(RDOC).gaps.filter(g => /표적/.test(g.name))[0];
    O.gapOther = tgt ? (tgt.has ? '있음' : '없음') : '(표에 없음)';
    return O;
  }, { RDOC });
  is(Z.read !== '0원' && Z.row === '0원|미가입|-5,000만원',
     '  가입 칸에 <b>0</b> 을 적으면 「미가입 · -전액」 — 읽은 값은 ' + Z.read + ' 였다 · ' + Z.row);
  is(Z.cell === '0',
     '  적으신 <b>0 이 칸에 남는다</b> — 되돌아가면 적은 것이 말없이 사라진 꼴이다 · 「' + Z.cell + '」');
  is(Z.fix === 1 && Z.fixN === 1 && Z.inShort,
     '  <b>고친 칸</b>으로 세고 부족 목록에도 올린다');
  is(Z.re === '0원|미가입|fixN=1',
     '  「다시 만들기」 를 <b>견딘다</b> — ' + Z.re);
  is(!/원본이 부족·미가입/.test(Z.short) && /★/.test(Z.short) && /앱이 다시 셈/.test(Z.short),
     '  요약 줄이 <b>「원본이」 라고 말하지 않는다</b> — 고친 줄에 ★ 를 달고 다시 셈한 것이라 밝힌다');
  is(/^3,000만\|부족\|fix=0$/.test(Z.cleared) || /부족\|fix=0$/.test(Z.cleared),
     '  <b>비우면</b> 읽은 값으로 돌아간다 — 지우개는 0 이 아니라 <b>빈 칸</b>이다 · ' + Z.cleared);
  is(ZR.rider === '0원|fx=1|na=0',
     '  <b>특약</b>도 같은 길로 0 이 된다 — ' + ZR.riderName + ' · ' + ZR.rider);
  is(ZR.readAmt === '(비어 있음)' && ZR.gapBefore === '있음',
     '  금액을 <b>못 읽어 비운</b> 줄은 그래도 「있음」 — 담보는 있고 금액만 모른다 · ' + ZR.readAmt);
  is(ZR.gapAfter === '없음',
     '  0 으로 못 박으면 위쪽 <b>계열 표에서도 빠진다</b> — ' + ZR.gapBefore + ' → ' + ZR.gapAfter);
  is(ZR.gapOther === '있음',
     '  <b>옆 계열은 안 건드린다</b> — 표적항암 ' + ZR.gapOther);
  is(Z.emptyCounts && Z.zeroForms && Z.notZero,
     '  <b>빈 칸은 0 이 아니다</b> — 「0/0원/0만원/0억」 만 0 으로 보고 「0.5만원」 은 아니다');
  is(/증권을 보고 <b>없다고 확인<\/b>한 것/.test(Z.brief) && /못 읽어서 비워 둔 칸과 다르다/.test(Z.brief),
     '  AI 에게 <b>0 이 무슨 뜻인지</b> 일러 준다 — 안 밝히면 못 읽은 칸과 같이 다룬다');
  is(/★ 없는 줄은 원본 보장분석표의 판정이고, ★ 붙은 줄은 앱이 다시 센 것/.test(Z.brief) &&
     !/※ 이것은 원본 보장분석표의 판정이다/.test(Z.brief),
     '  AI 에게도 <b>화면과 같은 말</b>을 한다 — 「전부 원본 판정」 이라고 하지 않는다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 고치는 표는 <b>우리끼리 보는 것</b>이다. 「붙어 보임 — 확인」·「원문:
     12683400원」 이 적힌 종이가 고객 손에 가면, 우리가 숫자를 못 믿는다는
     말을 고객이 읽는다. 인쇄에는 <b>한 글자도</b> 나가면 안 된다.     */
  console.log('\n[12] 고치는 표가 고객 손에 인쇄돼 나가지 않는다');
  await page.evaluate(({ ODD }) => {
    document.body.innerHTML = '';
    if (typeof insCssMount === 'function') insCssMount();
    const sc = insScan(ODD);
    sc.fixOpen = 1; sc.dAll = 1;
    const h = document.createElement('div');
    h.id = 'PR'; h._scan = sc;
    /* 실제 화면과 같은 옷을 입힌다 — bjPaint 도 report 도 no-print 로 감싼다 */
    /* 인쇄는 <b>#printRoot 안에 있는 것만</b> 나간다(@media print). 카드는
       그 안에 있더라도 no-print 라 빠져야 한다 — 두 겹으로 막힌 셈이다. */
    h.innerHTML = '<div id="printRoot">' +
      '<div class="no-print">' + insCardHtml(sc) + '</div>' +
      '<div class="report-doc-host">고객에게 나가는 리포트 본문</div></div>';
    document.body.appendChild(h);
  }, { ODD });
  const seen = async () => page.evaluate(() => {
    /* 자기 display 만 보면 안 된다 — 부모가 no-print 로 꺼져 있어도 자식의
       display 는 block 이다. <b>실제로 자리를 차지하는가</b>를 본다. */
    const vis = (s) => {
      const e = document.querySelector(s);
      if (!e) return 'none';
      if (!e.getClientRects().length) return 'none';
      return getComputedStyle(e).visibility === 'hidden' ? 'none' : 'show';
    };
    return { card: vis('#PR .ins-read'), fix: vis('#PR .ins-fix'),
             input: vis('#PR .if-i'), doc: vis('#PR .report-doc-host') };
  });
  await page.emulateMedia({ media: 'screen' });
  const onScreen = await seen();
  await page.emulateMedia({ media: 'print' });
  const onPaper = await seen();
  await page.emulateMedia({ media: 'screen' });
  is(onScreen.card === 'show' && onScreen.fix === 'show' && onScreen.input === 'show',
     '  화면에서는 보인다 — 카드·표·칸');
  is(onPaper.card === 'none' && onPaper.fix === 'none' && onPaper.input === 'none',
     '  <b>종이에는 한 글자도 안 나간다</b> — 카드 ' + onPaper.card + ' · 표 ' + onPaper.fix +
     ' · 칸 ' + onPaper.input);
  is(onPaper.doc === 'show',
     '  같은 #printRoot 안이어도 <b>리포트 본문은 그대로</b> 인쇄된다 — 카드만 빠진다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 보장분석 결과와 AI 제안서 결과를 <b>나란히 열어 두는 일은 흔하다.</b>
     저장 칸을 하나만 두었더니, 이쪽을 고치는 순간 저쪽 고친 값이
     <b>말없이</b> 사라졌다 — 실제로 재 보고 알았다. 자료마다 따로 담는다. */
  console.log('\n[13] 두 고객 표를 나란히 열어도 서로를 안 지운다');
  const M = await page.evaluate(async ({ DOC, OTHER }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    const put = (id, sc) => {
      const h = document.createElement('div');
      h.id = id; h._scan = sc; sc.fixOpen = 1; sc.dAll = 1;
      h.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
      document.body.appendChild(h);
      return h;
    };
    const scA = insScan(DOC), scB = insScan(OTHER);
    const A = put('MA', scA), B = put('MB', scB);
    O.sigDiff = scA.fixSig !== scB.fixSig;
    let ai = A.querySelectorAll('.if-i');
    insFixSet(ai[1], 0, 'have', '5000');
    insFixDone(ai[1]);
    await new Promise(r => setTimeout(r, 0));
    let bi = B.querySelectorAll('.if-i');
    insFixSet(bi[1], 0, 'have', '7000');
    insFixDone(bi[1]);
    await new Promise(r => setTimeout(r, 0));
    /* 둘 다 다시 읽어 본다 — 「다시 만들기」 를 두 번 누른 셈 */
    const a2 = insScan(DOC), b2 = insScan(OTHER);
    O.aKept = a2.diags[0].have + '/fixN=' + a2.fixN;
    O.bKept = b2.diags[0].have + '/fixN=' + b2.fixN;
    /* 한쪽만 지운다 — 옆 화면 것까지 지우면 안 된다 */
    insFixClear(A.querySelector('.if-btn button'));
    await new Promise(r => setTimeout(r, 0));
    const a3 = insScan(DOC), b3 = insScan(OTHER);
    O.aCleared = a3.diags[0].have + '/fixN=' + a3.fixN;
    O.bStill = b3.diags[0].have + '/fixN=' + b3.fixN;

    /* 옛 판(한 벌짜리)으로 저장돼 있어도 <b>그대로 옮겨 온다</b> */
    localStorage.removeItem('apex_ins_fix');
    const sig = insScan(DOC).fixSig;
    const k = insFixKey(insScan(DOC).diags[0]);
    const old = { sig: sig, fix: {} }; old.fix[k] = { h: 9000 };
    localStorage.setItem('apex_ins_fix', JSON.stringify(old));
    const a4 = insScan(DOC);
    O.migrated = a4.diags[0].have + '/fixN=' + a4.fixN;

    /* 자료가 아홉 벌째면 <b>제일 오래 안 쓴 것</b>부터 버린다 */
    localStorage.removeItem('apex_ins_fix');
    for (let i = 0; i < 10; i++) insFixPut('sig' + i, { a: { h: 100 + i } });
    const box = JSON.parse(localStorage.getItem('apex_ins_fix'));
    O.keep = box.order.length + '/' + Object.keys(box.docs).length;
    O.dropped = !box.docs.sig0 && !box.docs.sig1 && !!box.docs.sig9;

    /* ── 저장이 <b>막혔을 때</b> 말을 하는가 ─────────────────────────
       기기 용량이 찼거나 사생활 보호 모드면 쓰기가 막힌다. 조용히
       삼키면 사장님은 고쳐 두신 줄 아시는데 새로고침하면 없다. */
    document.body.innerHTML = '<div id="toast"></div>';
    const real = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k) {
      if (k === 'apex_ins_fix') throw new Error('QuotaExceededError');
      return real.apply(localStorage, arguments);
    };
    try {
      _insSaveWarned = false;
      insFixPut('sigX', { a: { h: 1 } });
      O.saveFail = /저장하지 못했습니다/.test(document.getElementById('toast').textContent);
    } finally { localStorage.setItem = real; }
    return O;
  }, { DOC, OTHER });

  is(M.sigDiff, '  두 자료의 <b>지문이 다르다</b>');
  is(M.aKept === '5,000만원/fixN=1' && M.bKept === '7,000만원/fixN=1',
     '  둘 다 <b>제 값을 지킨다</b> — A ' + M.aKept + ' · B ' + M.bKept);
  is(M.aCleared === '3,000만/fixN=0' && M.bStill === '7,000만원/fixN=1',
     '  한쪽을 지워도 <b>옆 화면은 그대로</b> — A ' + M.aCleared + ' · B ' + M.bStill);
  is(M.migrated === '9,000만원/fixN=1',
     '  옛 판(한 벌짜리)으로 저장된 값도 <b>그대로 옮겨 온다</b> — ' + M.migrated);
  is(M.keep === '8/8' && M.dropped,
     '  여덟 벌까지 두고 <b>제일 오래 안 쓴 것</b>부터 버린다 — ' + M.keep);
  is(M.saveFail,
     '  저장이 <b>막히면 말을 한다</b> — 조용히 삼키면 새로고침에 사라지는 걸 아무도 모른다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 이 칸은 <b>만원</b> 단위다. 「5,000만원」 을 적으려다 50000000 을 치면
     5,000억이 되어 <b>만 배</b>가 틀어진다 — CLAUDE.md 4번이 말하는 바로
     그 사고인데, 이번엔 앱이 아니라 손이 미끄러지는 자리다. 담보 하나가
     100억을 넘는 일은 사실상 없으니 거기서 여쭌다. <b>값은 안 고친다.</b> */
  console.log('\n[14] 만원 칸에 원을 적으시면 그 자리에서 여쭌다');
  const U = await page.evaluate(async ({ DOC, RDOC }) => {
    const O = {};
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    if (typeof insCssMount === 'function') insCssMount();
    /* 읽은 값이 크게 나온 것은 <b>안 잡는다</b> — 우리가 읽은 것이지
       사장님이 적으신 것이 아니다. 그건 붙어 보이는 칸이 본다.
       <b>아무것도 고치기 전에</b> 잰다 — 지문이 같으면 고친 값이 붙는다. */
    O.readBig = insFixCount(insScan(DOC.replace('가입 3,000만 1 부족', '가입 50000000만 1 부족'))).big;

    const sc = insScan(DOC);
    sc.fixOpen = 1; sc.dAll = 1;
    const h = document.createElement('div');
    h.id = 'UH'; h._scan = sc;
    h.innerHTML = '<div class="no-print">' + insCardHtml(sc) + '</div>';
    document.body.appendChild(h);

    /* 5,000만원을 적으려다 원을 친다 */
    let ins = h.querySelectorAll('.if-i');
    insFixSet(ins[1], 0, 'have', '50000000');
    insFixDone(ins[1]);
    await new Promise(r => setTimeout(r, 0));
    O.bigCell = document.querySelectorAll('#UH .if-i.big').length;
    O.bigAsk = /만원<\/b> 단위가 맞습니까/.test(document.getElementById('UH').innerHTML);
    O.bigNote = /단위가 이상한 칸 1개/.test(document.getElementById('UH').textContent);
    O.bigHead = /단위가 이상한 칸 1개/.test(document.querySelector('#UH .if-ph').textContent);
    /* <b>값은 안 고친다</b> — 적으신 그대로 둔다 */
    O.kept = sc.diags[0].have;
    O.keptIn = document.querySelectorAll('#UH .if-i')[1].value;

    /* 제대로 적으면 조용하다 */
    ins = document.querySelectorAll('#UH .if-i');
    insFixSet(ins[1], 0, 'have', '5000');
    insFixDone(ins[1]);
    await new Promise(r => setTimeout(r, 0));
    O.calmCell = document.querySelectorAll('#UH .if-i.big').length;
    O.calmNote = /단위가 이상한 칸/.test(document.getElementById('UH').textContent);
    O.calmMine = document.querySelectorAll('#UH .if-i.mine').length;
    O.calmVal = sc.diags[0].have;

    /* 10억(100,000만원)은 있을 수 있는 값이라 <b>안 잡는다</b> */
    ins = document.querySelectorAll('#UH .if-i');
    insFixSet(ins[1], 0, 'have', '100000');
    insFixDone(ins[1]);
    await new Promise(r => setTimeout(r, 0));
    O.tenCell = document.querySelectorAll('#UH .if-i.big').length;
    O.tenVal = sc.diags[0].have;
    /* 다시 크게 적어 둔다 — 아래에서 「저절로 펼쳐지는가」 를 본다 */
    ins = document.querySelectorAll('#UH .if-i');
    insFixSet(ins[1], 0, 'have', '50000000');
    insFixDone(ins[1]);
    await new Promise(r => setTimeout(r, 0));

    /* ── 단위가 이상한 칸은 <b>저절로 펼쳐져야</b> 한다 ──────────────
       만 배 틀어진 칸을 접어 두면 못 보고 지나친다 — 그대로 고객 앞에 선다. */
    document.body.innerHTML = '';
    const fresh = insScan(DOC);          /* 아까 적은 5,000억이 그대로 붙는다 */
    const h2 = document.createElement('div');
    h2.id = 'UH2'; h2._scan = fresh;     /* fixOpen 을 <b>안 건드린다</b> */
    h2.innerHTML = '<div class="no-print">' + insCardHtml(fresh) + '</div>';
    document.body.appendChild(h2);
    O.autoBigOpen = h2.querySelectorAll('.if-i').length > 0;
    O.autoBigCell = h2.querySelectorAll('.if-i.big').length;
    O.autoBigHot = h2.querySelectorAll('.if-ph.hot').length;

    /* ── 특약에서 난 것은 <b>특약 표에만</b> 떠야 한다 ────────────────
       담보진단 것과 섞어 세면, 담보진단 표가 「단위가 이상한 칸 1개」 라고
       말하는데 정작 그 표에는 빨간 칸이 없다 — 찾다가 못 찾으신다. */
    localStorage.removeItem('apex_ins_fix');
    document.body.innerHTML = '';
    const scR2 = insScan(RDOC);
    scR2.fixOpen = 1; scR2.dAll = 1;
    const h3 = document.createElement('div');
    h3.id = 'UH3'; h3._scan = scR2;
    h3.innerHTML = '<div class="no-print">' + insCardHtml(scR2) + '</div>';
    document.body.appendChild(h3);
    const ri = h3.querySelectorAll('.if-r .if-i');
    insFixRSet(ri[0], 0, 1, '50000000');     /* 특약 칸에 원을 적는다 */
    insFixDone(ri[0]);
    await new Promise(r => setTimeout(r, 0));
    const H3 = document.getElementById('UH3');
    O.rBigInR = H3.querySelectorAll('.if-r .if-note.odd').length &&
      /단위가 이상한 칸 1개/.test(H3.querySelector('.if-r').textContent) ? 1 : 0;
    /* 담보진단 표가 없는 자료라, 있었다면 거기 안 떠야 한다는 뜻으로 0 을 본다 */
    const dTable = H3.querySelector('.ins-fix:not(.if-r):not(.if-pan)');
    O.rBigInD = (dTable && /단위가 이상한 칸/.test(dTable.textContent)) ? 1 : 0;
    O.rBigHead = /단위가 이상한 칸 1개/.test(H3.querySelector('.if-ph').textContent);
    return O;
  }, { DOC, RDOC });

  is(U.bigCell === 1 && U.bigAsk, '  <b>빨간 칸</b>과 「만원 단위가 맞습니까?」 가 붙는다');
  is(U.bigNote && U.bigHead, '  표와 <b>머리글</b> 둘 다 「단위가 이상한 칸 1개」 라고 말한다');
  is(U.kept === '5000억원' && U.keptIn === '50000000',
     '  <b>값은 안 고친다</b> — 적으신 그대로 ' + U.kept);
  is(U.calmCell === 0 && !U.calmNote && U.calmMine === 1 && U.calmVal === '5,000만원',
     '  제대로 적으면 <b>조용하다</b> — ' + U.calmVal);
  is(U.tenCell === 0 && U.tenVal === '10억원',
     '  10억은 있을 수 있는 값이라 <b>안 잡는다</b> — ' + U.tenVal);
  is(U.readBig === 0,
     '  <b>우리가 읽은</b> 큰 값은 여기서 안 잡는다 (그건 「붙어 보임」 이 본다)');
  is(U.autoBigOpen && U.autoBigCell === 1 && U.autoBigHot === 1,
     '  단위가 이상한 칸이 있으면 <b>저절로 펼쳐진다</b> — 접어 두면 못 보고 지나친다');
  is(U.rBigInR === 1 && U.rBigInD === 0 && U.rBigHead,
     '  <b>특약</b>에서 난 것은 특약 표에만 뜬다 — 담보진단 표에 뜨면 찾다가 못 찾는다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 사장님은 <b>태블릿</b>으로 고객 앞에서 여신다. 손가락으로 누르는
     칸이 29px 이면 이 앱 자신의 기준(30px)에도 못 미쳐 옆 칸이 눌린다.
     그리고 본문이 옆으로 밀리면 표를 보려다 화면이 통째로 움직인다 —
     표는 <b>제 안에서만</b> 밀려야 한다. 재 보고 지킨다.            */
  console.log('\n[15] 태블릿에서 손가락으로 쓸 수 있다');
  const touch = [];
  for (const vp of [{ n: '폰 390', w: 390, h: 844 }, { n: '탭 800', w: 800, h: 1280 }]) {
    const pg = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2000);
    const m = await pg.evaluate(({ ODD, RDOC }) => {
      localStorage.removeItem('apex_ins_fix');
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;padding:10px;background:#fff';
      if (typeof insCssMount === 'function') insCssMount();
      /* 담보진단과 특약이 <b>둘 다</b> 있는 자료로 잰다 */
      const sc = insScan(ODD + RDOC.split('\n').slice(3).join('\n'));
      sc.fixOpen = 1; sc.dAll = 1; sc.rAll = 1;
      const h = document.createElement('div');
      h.id = 'TT'; h._scan = sc;
      h.innerHTML = insCardHtml(sc);
      document.body.appendChild(h);
      const hgt = (sel) => [].slice.call(document.querySelectorAll(sel))
        .map(x => Math.round(x.getBoundingClientRect().height));
      const ins = hgt('#TT .if-i'), btn = hgt('#TT button, #TT .if-ph');
      let tiny = 0;
      document.querySelectorAll('#TT *').forEach(el => {
        let has = false;
        el.childNodes.forEach(c => { if (c.nodeType === 3 && (c.textContent || '').trim()) has = true; });
        if (has && (parseFloat(getComputedStyle(el).fontSize) || 99) < 10) tiny++;
      });
      return { nIn: ins.length, minIn: Math.min.apply(null, ins.concat([999])),
               nBtn: btn.length, minBtn: Math.min.apply(null, btn.concat([999])),
               over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
               tiny: tiny };
    }, { ODD, RDOC });
    touch.push({ vp: vp.n, m });
    await pg.close();
  }
  touch.forEach(t => {
    is(t.m.nIn > 0 && t.m.minIn >= 30,
       '  ' + t.vp + ' — 고치는 칸이 <b>' + t.m.minIn + 'px</b> (30px 넘어야 손가락으로 눌린다)');
    is(t.m.nBtn > 0 && t.m.minBtn >= 30,
       '  ' + t.vp + ' — 단추·머리글이 <b>' + t.m.minBtn + 'px</b>');
    is(t.m.over === 0,
       '  ' + t.vp + ' — <b>본문이 옆으로 안 밀린다</b> (표는 제 안에서만 민다) · ' + t.m.over + 'px');
    is(t.m.tiny === 0, '  ' + t.vp + ' — 10px 미만 글자가 <b>없다</b>');
  });

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('보장분석 고치기 점검 — ' + bad + '군데 어긋납니다.')
                  : '보장분석 고치기 점검 통과 — 읽은 값을 그 자리에서 고칠 수 있습니다.');
  process.exit(bad ? 1 : 0);
})();
