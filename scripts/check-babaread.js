/* <b>비포&애프터가 담보를 제대로 읽는가 — 그리고 고친 값을 지키는가.</b>

   사장님이 실제 화면을 보여 주셨습니다. 숫자가 이랬습니다.

     기존 보장 합계 <b>49억 2,165만</b> · 교통사고처리지원 <b>11억 7,100만</b>
     질병입원의료비 <b>3억 5,049만</b> · 항암방사선·약물 신규 <b>1,268</b>

   재 보니 네 자리에서 틀리고 있었습니다.

   ① <b>한 금액을 두 담보가 나눠 가졌습니다.</b>
      「교통사고처리지원금 1억」 한 줄을 「운전자(벌금 등)」 과
      「교통사고처리지원」 이 <b>각자 1억으로</b> 집어 합계에서 2억이 됐습니다.
      사전 낱말이 겹치는 담보가 <b>20쌍</b>입니다.

   ② <b>증권번호를 금액으로 읽었습니다.</b>
      콤마 없는 6~9자리를 통째로 「원」 으로 받아, <b>12683400</b> 이
      <b>1,268만원</b> 이 되어 표에 찍혔습니다 — 화면의 그 값입니다.
      「202408」(연월) 은 20만원이 됐습니다.

   ③ <b>고친 값을 앱이 도로 덮었습니다.</b>
      기존을 5,000 으로 낮춰도 화면은 <b>4,000</b> 을 썼고(계약 합이 더
      크면 그쪽을 쓰고 해지분을 다시 뺐다), 신규에 3,000 을 적으면
      유지분 2,000 이 <b>또</b> 더해져 5,000 이 됐습니다.
      고쳐도 안 따라오면 고칠 이유가 없습니다.

   ④ <b>「받는 돈」 과 「한도」 를 한 통에 담았습니다.</b>
      실손·입원의료비는 쓴 만큼 그 한도까지 돌려받는 것인데 진단비와
      그냥 더해 <b>「보장 합계 49억」</b> 이 나왔습니다.

   여기서 확인합니다.
     1. 한 금액 자리를 <b>한 담보만</b> 가져가는가
     2. 번호·연월을 <b>금액으로 안 읽는가</b> — 진짜 금액은 그대로 읽는가
     3. 손으로 고친 값을 <b>그대로 쓰는가</b> · 합계가 따라오는가
     4. 합계에 <b>의료비 한도</b>가 안 섞이는가 — 그리고 따로 말하는가
     5. 무엇을 왜 비웠는지 <b>화면에서 말하는가</b>
     6. <b>헛알람이 없는가</b> — 정상 자료에는 안 뜨는가
     7. 고치는 칸에서 <b>손이 미끄러지지 않는가</b> — 만 배 · 이어 붙기 · 탭
     8. 폰에서 <b>「기존」·「신규」 두 칸이 다 보이는가</b> — 표가 옆으로
        밀려 「신규」 가 화면 밖이면, 비포&애프터에서 <b>애프터가 안
        보이는</b> 셈이다. 본문은 안 밀리니 아무 점검도 울지 않았다      */

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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 180)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[1] 한 금액 자리는 한 담보만 가져간다');
  const one = await page.evaluate(() => {
    const doc = '교통사고처리지원금 1억 자동차사고변호사선임비용 5,000만 벌금 3,000만';
    const sc = babaScan(doc);
    const got = Object.keys(sc).map(k => k + '=' + sc[k].won);
    const total = Object.keys(sc).reduce((n, k) => n + sc[k].won, 0);
    return { got, total, dup: BABA_DUP.n, list: BABA_DUP.list };
  });
  is(one.total === 18000,
     '  문서에 있는 만큼만 더해진다 — ' + one.total + '만원 (1억+5,000+3,000)');
  is(one.got.indexOf('drive=10000') < 0,
     '  「운전자(벌금 등)」 가 1억을 <b>또</b> 가져가지 않는다 — ' + one.got.join(' '));
  is(one.dup > 0 && /운전자/.test(one.list.join(' ')),
     '  밀린 담보를 <b>세어 둔다</b> — ' + (one.list.join(' · ') || '(없음)'));
  /* 자리를 뺏긴 담보는 <b>다음 자리</b>를 봐야 한다. 안 그러면 같은 자리를
     계속 집다가 빈 칸이 되어, 문서에 있는 보장이 표에서 사라진다. */
  const next = await page.evaluate(() => {
    const sc = babaScan('교통사고처리지원금 1억 형사합의금 2,000만');
    return { drive: (sc.drive || {}).won || null, car: (sc.carAcc || {}).won || null };
  });
  is(next.car === 10000 && next.drive === 2000,
     '  자리를 뺏긴 담보가 <b>다음 자리</b>에서 제 값을 찾는다 — ' +
     '교통사고처리지원 ' + next.car + ' · 운전자 ' + (next.drive === null ? '(빈 칸)' : next.drive));

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[2] 번호·연월을 금액으로 읽지 않는다');
  const num = await page.evaluate(() => {
    const won = t => { const a = babaAmts(t, 0); return a.length ? a[0].won : null; };
    return {
      cert: won('항암방사선약물치료비 12683400 정액'),   /* 증권번호 꼴 */
      ym: won('암진단비 202408 100세 20년'),             /* 연월 코드 */
      seq: won('뇌혈관질환진단비 1234567 100세'),        /* 일련번호 */
      real3: won('암진단비 30000000 100세'),             /* 3천만원 — 만원으로 떨어진다 */
      real5: won('암진단비 50,000,000원 100세'),         /* 콤마 + 원 */
      man: won('암진단비 3,000만원 100세'),              /* 단위가 붙은 정상 */
      bare: won('뇌혈관질환진단비 2,000 100세 20년')     /* 단위 없는 가입금액 칸 */
    };
  });
  is(num.cert === null, '  증권번호 <b>12683400</b> 을 안 읽는다 — 화면의 「1,268」 이 이것이었다');
  is(num.ym === null, '  연월 <b>202408</b> 을 안 읽는다');
  is(num.seq === null, '  일련번호 <b>1234567</b> 을 안 읽는다');
  is(num.real3 === 30000000, '  <b>만원으로 떨어지는</b> 맨 숫자는 그대로 읽는다 — 30000000');
  is(num.real5 === 50000000 && num.man === 30000000 && num.bare === 20000000,
     '  단위가 붙은 금액·가입금액 칸은 <b>그대로</b> 읽는다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[3] 손으로 고친 값을 그대로 쓴다 — 합계가 따라온다');
  const fix = await page.evaluate(() => {
    BABA.rows = [{ k: 'cancer', n: '암 진단비(일반암)', b: 26000, a: 3000, raw: '' },
                 { k: 'fee', n: '월 보험료', b: 600000, a: 500000, raw: '' }];
    BABA.plans = [{ id: 'p1', slot: 'b', nm: '가', co: 'A사', keep: 'keep', cov: { cancer: 2000 } },
                  { id: 'p2', slot: 'b', nm: '나', co: 'B사', keep: 'drop', cov: { cancer: 1000 } }];
    const auto = { b: babaSum('b'), a: babaSum('a') };
    babaSet(0, 'b', '5000');
    const eb = { b: babaSum('b'), row: babaRowsV().find(x => x.k === 'cancer').b };
    babaSet(0, 'a', '9000');
    const ea = { a: babaSum('a'), row: babaRowsV().find(x => x.k === 'cancer').a };
    /* 비우면 다시 「읽은 값」 으로 돌아가는가 */
    babaSet(0, 'b', '');
    const back = { mb: !!BABA.rows[0].mb, b: babaRowsV().find(x => x.k === 'cancer').b };
    const mine = babaMineCount();
    return { auto, eb, ea, back, mine, done: typeof babaSetDone === 'function' };
  });
  is(fix.eb.row === 5000 && fix.eb.b === 5000,
     '  기존을 5,000 으로 고치면 화면도 <b>5,000</b> — 계약 합으로 안 덮는다 (' + fix.eb.row + ')');
  is(fix.ea.row === 9000 && fix.ea.a === 9000,
     '  신규를 9,000 으로 고치면 화면도 <b>9,000</b> — 유지분이 <b>또</b> 안 더해진다 (' + fix.ea.row + ')');
  is(!fix.back.mb, '  비우면 손댐 표시가 <b>지워진다</b> — 다시 읽은 값으로 돌아간다');
  is(fix.mine === 1, '  손으로 고친 칸을 <b>세는 곳이 하나</b>다 — ' + fix.mine + '개');
  is(fix.done, '  칸을 벗어나면 위쪽을 <b>다시 그린다</b> (babaSetDone)');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[4] 합계에 의료비 한도를 섞지 않는다');
  const lim = await page.evaluate(() => {
    BABA.plans = [];
    BABA.rows = [{ k: 'cancer', n: '암 진단비(일반암)', b: 3000, a: 5000, raw: '' },
                 { k: 'silD', n: '질병입원의료비', b: 35049, a: 5000, raw: '' },
                 { k: 'silA', n: '상해입원의료비', b: 8051, a: 3000, raw: '' }];
    return { sum: babaSum('b'), limit: babaSumLimit('b'), sumA: babaSum('a'),
             limitA: babaSumLimit('a'), note: babaLimitNote() };
  });
  is(lim.sum === 3000, '  「보장 합계」 는 <b>진단비만</b> — ' + lim.sum + '만원 (43,100 아님)');
  is(lim.limit === 43100, '  의료비 한도는 <b>따로</b> 센다 — ' + lim.limit + '만원');
  is(/의료비 한도/.test(lim.note) && /쓴 만큼/.test(lim.note),
     '  화면이 <b>왜 뺐는지</b> 말한다');
  is(/3억 5,049만|4억 3,100만/.test(lim.note), '  뺀 금액을 <b>숨기지 않는다</b>');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[5] 화면에서 말한다');
  const say = await page.evaluate(() => {
    BABA.rows = [{ k: 'cancer', n: '암 진단비(일반암)', b: 3000, a: 5000, raw: '', mb: 1 },
                 { k: 'silD', n: '질병입원의료비', b: 5000, a: 5000, raw: '' }];
    BABA.at = '지금';
    BABA_DUP = { n: 2, list: ['운전자 (벌금 등) → 교통사고처리지원'] };
    const h = babaGridHtml();
    return { mine: /직접 적으신 칸/.test(h), tag: /직접 적으심/.test(h),
             dup: /같은 금액 자리를 다투다/.test(h), why: /합계가 두 배로/.test(h),
             chg: /onchange="babaSetDone\(\)"/.test(h) };
  });
  is(say.mine && say.tag, '  <b>직접 적으신 칸</b>이라고 적고 딱지를 붙인다');
  is(say.dup && say.why, '  <b>같은 자리를 다투다 비운 담보</b>를 말한다 — 왜 그러는지까지');
  is(say.chg, '  칸마다 <b>onchange</b> 가 걸려 있다');

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[6] 헛알람이 없다 — 정상 자료에는 안 뜬다');
  const quiet = await page.evaluate(() => {
    const doc = '암진단비 3,000만원 뇌혈관질환진단비 2,000만원 급성심근경색진단비 2,000만원';
    const sc = babaScan(doc);
    return { n: Object.keys(sc).length, dup: BABA_DUP.n,
             cancer: (sc.cancer || {}).won, brain: (sc.brain || {}).won, mi: (sc.mi || {}).won };
  });
  is(quiet.cancer === 3000 && quiet.brain === 2000 && quiet.mi === 2000,
     '  담보 셋을 <b>제 값으로</b> 읽는다 — 암 ' + quiet.cancer + ' · 뇌 ' + quiet.brain + ' · 심근 ' + quiet.mi);
  is(quiet.dup === 0, '  밀린 담보가 <b>0</b> 이다 — 헛것을 잡지 않는다');

  /* ─────────────────────────────────────────────────────────────── */
  /* 고치는 칸에서 <b>손이 미끄러지는</b> 세 자리. 셋 다 실제로 재 보고
     알았고, 셋 다 그대로 고객 앞에 서는 숫자를 만든다.

     ① 만원 칸에 <b>원</b> — 「5,000만원」 을 적으려다 50000000 → 5,000억
     ② 「3,000」 이 적힌 칸에 5000 을 치면 <b>50003,000</b> — 쉼표까지 끼어
        5,000억이 된다. 누를 때 통째로 잡아야 한다
     ③ 고치고 <b>탭</b>을 누르면 본문으로 튕긴다 — 담보가 스무 줄이면
        한 칸마다 다시 눌러야 해서 고객 앞에서 못 쓴다                */
  console.log('\n[7] 고치는 칸에서 손이 미끄러지지 않는다');
  await page.evaluate(() => {
    window.osTabAllowed = function () { return true; };
    BABA.rows = [
      { k: 'cancer', n: '일반암진단비', b: 3000, a: 5000 },
      { k: 'brain', n: '뇌혈관질환진단비', b: 1000, a: 3000 },
      { k: 'fee', n: '월 보험료', b: 150000, a: 180000 }
    ];
    BABA.at = '2026-08-28';
    document.body.innerHTML = '<div id="babaGrid"></div>';
    babaPaint();
  });
  const big = await page.evaluate(async () => {
    babaSet(0, 'b', '50000000');          /* 5,000만원을 적으려다 원을 침 */
    babaSetDone();
    await new Promise(r => setTimeout(r, 20));
    const g = document.getElementById('babaGrid');
    return { kept: BABA.rows[0].b, n: babaBigN(),
             /* 화면에 <b>적으신 그대로</b> 보여야 한다 — 우리가 몰래 깎으면
                사장님은 고친 줄 아시고 그 값이 그대로 나간다 */
             shown: document.querySelectorAll('#babaGrid input')[0].value,
             ask: /만원<\/b> 단위가 맞습니까/.test(g.innerHTML),
             note: /단위가 이상한 칸 1개/.test(g.textContent),
             red: /border:1px solid #DC2626/.test(g.innerHTML) };
  });
  is(big.kept === 50000000 && big.shown === '50,000,000',
     '  ① <b>값은 안 고친다</b> — 담아 둔 것도 화면도 ' + big.shown + ' (몰래 안 깎는다)');
  is(big.n === 1 && big.ask && big.note && big.red,
     '  ① <b>빨간 칸</b>과 「만원 단위가 맞습니까?」 · 위에 「단위가 이상한 칸 1개」');
  /* 월 150만원 — 가족 묶음이면 흔한 값이다. 담보 잣대(100억=1,000,000)로
     재면 <b>걸린다.</b> 보험료는 원 단위라 안 걸려야 한다 — 헛알람을 잡는 자리다. */
  const feeOk = await page.evaluate(async () => {
    babaSet(2, 'b', '1500000');
    babaSetDone();
    await new Promise(r => setTimeout(r, 20));
    return { n: babaBigN(), v: BABA.rows[2].b };
  });
  is(feeOk.n === 1 && feeOk.v === 1500000,
     '  ① 보험료 줄은 <b>원 단위</b>라 월 150만원에 안 뜬다 (잣대가 다르다)');

  await page.evaluate(async () => {
    babaSet(0, 'b', '3000'); delete BABA.rows[0].mb;
    babaSetDone();
    await new Promise(r => setTimeout(r, 20));
  });
  await page.locator('#babaGrid input').first().focus();
  await page.keyboard.type('5000');       /* 지우지 않고 그냥 친다 */
  await page.waitForTimeout(30);
  const typed = await page.evaluate(() => ({
    val: document.querySelectorAll('#babaGrid input')[0].value, stored: BABA.rows[0].b }));
  is(typed.val === '5000' && typed.stored === 5000,
     '  ② 누르면 <b>통째로 잡혀</b> 덮어써진다 — ' + typed.val + ' (이어 붙으면 50003,000)');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  const tab = await page.evaluate(() => {
    const all = [].slice.call(document.querySelectorAll('#babaGrid input'));
    return all.indexOf(document.activeElement);
  });
  is(tab === 1, '  ③ 고치고 탭 — <b>옆 칸</b>으로 간다 (본문으로 안 튕긴다) · 지금 ' +
     (tab < 0 ? '튕김' : (tab + 1) + '번째'));

  /* ─────────────────────────────────────────────────────────────── */
  /* ── 폰에서 <b>「신규」 칸이 화면 밖</b>에 있었다 ──────────────────
     네 칸짜리 표에 min-width 460px 이 인라인으로 박혀 있어, 390px 에서
     표가 옆으로 밀리고 <b>「신규(만원)」 칸이 통째로 화면 밖</b>이었다 —
     비포&애프터에서 <b>애프터가 안 보이는</b> 셈이다. 본문은 안 밀리니
     아무 점검도 울지 않았다. 옆으로 밀 수 있다는 것을 <b>모르면 없는
     것과 같다.</b> 좁은 화면에서는 줄 단위로 세워, 두 칸이 다 눈에
     있어야 한다. 그리고 머리글이 사라지므로 칸마다 이름표가 붙어야
     한다 — 없으면 「기존」 과 「신규」 를 <b>거꾸로</b> 적는다.      */
  console.log('\n[8] 폰에서 「기존」·「신규」 두 칸이 다 보인다');
  const small = [];
  for (const vp of [{ n: '폰 390', w: 390 }, { n: '탭 800', w: 800 }]) {
    const pg = await browser.newPage({ viewport: { width: vp.w, height: 1000 } });
    await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2000);
    const m = await pg.evaluate(() => {
      document.body.innerHTML = '<div id="babaGrid"></div>';
      document.body.style.cssText = 'margin:0;padding:10px;background:#fff';
      BABA.rows = [
        { k: 'fee', n: '월 보험료', b: 500000, a: 380000 },
        { k: 'cancer', n: '일반암진단비', b: 3000, a: 5000 },
        { k: 'brain', n: '뇌혈관질환진단비', b: 1000, a: 3000 }
      ];
      BABA.at = '2026-08-28';
      babaPaint();
      const vw = document.documentElement.clientWidth;
      const outside = (sel) => [].slice.call(document.querySelectorAll(sel))
        .filter(x => x.getBoundingClientRect().width > 0)
        .filter(x => Math.round(x.getBoundingClientRect().right) > vw + 1).length;
      const cells = [].slice.call(document.querySelectorAll('#babaGrid .bg-c'));
      return { vw: vw, nCell: cells.length,
               outCell: outside('#babaGrid .bg-c'),
               outIn: outside('#babaGrid input'),
               bodyOver: document.documentElement.scrollWidth - document.documentElement.clientWidth,
               labs: cells.map(x => (getComputedStyle(x, ':before').content || '')
                 .replace(/^"|"$/g, '').trim()).filter(t => t && t !== 'none') };
    });
    small.push({ vp: vp.n, w: vp.w, m });
    await pg.close();
  }
  small.forEach(t => {
    is(t.m.nCell > 0 && t.m.outCell === 0 && t.m.outIn === 0,
       '  ' + t.vp + ' — <b>「신규(만원)」 칸이 화면 안에</b> 있다 · 밖으로 나간 칸 ' +
       (t.m.outCell + t.m.outIn) + '개');
    is(t.m.bodyOver === 0, '  ' + t.vp + ' — 본문이 옆으로 안 밀린다 · ' + t.m.bodyOver + 'px');
    /* 이름표는 <b>머리글이 사라진 자리</b>에만 필요하다 — 넓은 화면까지
       요구하면 헛알람이 된다 (CLAUDE.md 8번). */
    if (t.w < 560) {
      const ok = t.m.labs.filter(x => /기존|신규/.test(x)).length;
      is(t.m.nCell > 0 && ok === t.m.nCell,
         '  ' + t.vp + ' — 칸마다 <b>「기존」·「신규」 이름표</b>가 붙는다 (없으면 거꾸로 적는다) · ' +
         ok + '/' + t.m.nCell + '개');
    }
  });

  /* ─────────────────────────────────────────────────────────────── */
  console.log('\n[9] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 담보를 잘못 읽거나 고친 값을 덮고 있습니다')
                  : '✓ 한 금액은 한 담보만 · 번호를 금액으로 안 읽음 · 고친 값이 그대로 갑니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
