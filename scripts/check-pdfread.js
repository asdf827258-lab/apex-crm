/* 글씨를 읽는 자리 — 「무조건 읽힌다」 를 지키는 점검

   이 앱에서 제일 자주 「그냥 안 되던」 자리다. 원인은 넷이었고, 넷 다
   조용해서 원인을 짐작하기 어려웠다.

     1. <b>우리가 뽑은 PDF 를 우리가 못 읽었다.</b> font-feature-settings
        "tnum" 을 켜고 인쇄하면 숫자 글자가 유니코드를 잃는다. 사람 눈에는
        3억 5,719만원인데 프로그램이 읽으면 「억 만원」 — 숫자가 통째로
        사라지고 사용자 지정 글자(U+E0xx)만 남는다. 그 종이를 다시
        비포&애프터에 넣으면 금액을 하나도 못 읽는다.
     2. <b>pdf.js 가 조용히 영원히 멈춘다.</b> 탭이 뒤로 가면 rAF 가 서서
        render promise 가 안 끝난다 — 에러도 없이 스피너만 돈다.
     3. <b>안 보이는 글자</b>(제어문자·폭 없는 공백·전각 숫자)가 섞여
        사전이 헛돈다.
     4. <b>못 읽어도 왜 못 읽었는지 안 말한다.</b>

   여기서 그 넷을 다 지킨다. 특히 1번은 <b>실제로 PDF 를 뽑아 다시 읽는
   왕복 시험</b>으로 본다 — 눈으로 짐작하지 않는다.                   */
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
  const base = 'http://127.0.0.1:' + srv.address().port;
  await page.goto(base + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 안 보이는 글자를 씻어 내는가');
  const clean = await page.evaluate(() => {
    const pua = String.fromCharCode(0xE073);
    return {
      제어: pdfClean('암' + String.fromCharCode(1) + '진단비'),
      폭없는: pdfClean('뇌' + String.fromCharCode(0x200B) + '혈관'),
      전각: pdfClean('３,０００만원'),
      전각공백: pdfClean('암　진단비').indexOf(' ') > 0,
      pua유지: pdfClean(pua).length
    };
  });
  is(clean.제어 === '암 진단비', '  제어문자(U+0001)를 공백으로 — ' + JSON.stringify(clean.제어));
  is(clean.폭없는 === '뇌혈관', '  폭 없는 공백(U+200B)은 지운다 — ' + clean.폭없는);
  is(clean.전각 === '3,000만원', '  전각 숫자 ３０００ 를 반각으로 — ' + clean.전각);
  is(clean.전각공백, '  전각 공백(U+3000)도 보통 공백으로');

  console.log('\n[2] 뽑아 낸 글을 믿어도 되는지 스스로 묻는가');
  const trust = await page.evaluate(() => {
    const pua = new Array(30).join(String.fromCharCode(0xE073));
    const good = ('암진단비 3,000만원 뇌혈관질환진단비 2,000만원 월보험료 128,900원 ').repeat(20);
    const nodigit = ('보장 합계 억 만 지금까지 새 설계 보장 합계 억 만 이렇게 바뀝니다 ').repeat(20);
    return {
      좋은글: pdfTextTrust(good),
      글꼴깨짐: pdfTextTrust(good + pua),
      숫자없음: pdfTextTrust(nodigit),
      스캔본: pdfTextTrust('짧은 글')
    };
  });
  is(trust.좋은글.ok, '  멀쩡한 글은 통과시킨다');
  is(!trust.글꼴깨짐.ok && /글꼴/.test(trust.글꼴깨짐.why),
     '  사용자 지정 글자가 섞이면 <b>못 믿는다</b> — ' + trust.글꼴깨짐.why);
  is(!trust.숫자없음.ok && /숫자가/.test(trust.숫자없음.why),
     '  글은 있는데 숫자가 없으면 못 믿는다 — ' + trust.숫자없음.why);
  is(!trust.스캔본.ok && trust.스캔본.scan === true, '  글이 거의 없으면 스캔본으로 본다');

  console.log('\n[3] 숨은 탭에서도 그림이 그려지는가 (스피너가 안 멈추던 병)');
  const src = fs.readFileSync('app/index.html', 'utf8');
  is(/intent:'print'/.test(src), "  render 에 intent:'print' 를 준다 — rAF 를 안 탄다");
  is(!/pg\.render\(\{canvasContext:[^}]*\}\)\.promise/.test(src.replace(/\s/g, '')) ||
     /function pdfDraw/.test(src),
     '  렌더는 pdfDraw 한 곳으로 모았다');
  is(/function pdfWait/.test(src) && /TIMEOUT/.test(src), '  모든 기다림에 끝(시간 제한)이 있다');
  is(/function pdfWhy/.test(src) && /암호가 걸린 PDF/.test(src),
     '  못 읽으면 <b>왜</b> 못 읽었는지 사람 말로 말한다');

  console.log('\n[4] tnum 을 켠 채로 인쇄하지 않는가 (우리 종이를 우리가 읽으려면)');
  is(!/font-feature-settings:"tnum" 1\}/.test(src.replace(/@media screen\{[^}]*\}/g, '')) ||
     /@media screen\{body\{font-feature-settings:"tnum" 1\}\}/.test(src),
     '  tnum 은 @media screen 안에만 있다 (종이에는 안 나간다)');
  ['app/상담자료/통합상담_APEX.html', 'app/재무설계/상담자료.html'].forEach(f => {
    if (!fs.existsSync(f)) return;
    const t = fs.readFileSync(f, 'utf8');
    const hits = (t.match(/font-feature-settings:\s*"tnum"/g) || []).length;
    const screened = (t.match(/@media screen\{[^}]*font-feature-settings:\s*"tnum"/g) || []).length;
    is(hits === 0 || screened >= 1, '  ' + path.basename(f) + ' 도 tnum 을 화면에만 쓴다');
  });

  /* ── 「tnum」 은 <b>철자가 둘</b>이다 ──────────────────────────────
     <code>font-feature-settings:"tnum"</code> 과
     <code>font-variant-numeric:tabular-nums</code> 는 <b>같은 기능</b>을 켠다.
     글자로만 잡으면 다른 철자로 그대로 들어온다 — 실제로 보장분석
     리포트 덱(bj-bdv·bj-civ, <b>금액 칸</b>)이 그 철자로 켜 두고
     인쇄까지 나가고 있었다. 제안서 쪽만 지키고 있었던 것이다.

     그래서 <b>글자가 아니라 결과를 잰다</b> — 인쇄 화면으로 바꿔 놓고
     그 칸의 <b>계산된 값</b>을 본다. 철자가 몇 개든 이 자리는 못 지나간다. */
  const num = await page.evaluate(() => {
    if (typeof bjCssMount === 'function') bjCssMount();
    if (typeof insCssMount === 'function') insCssMount();
    let t = document.getElementById('TNUM');
    if (!t) {
      t = document.createElement('div');
      t.id = 'TNUM';
      document.body.appendChild(t);
    }
    t.className = 'bj-deck';
    t.innerHTML = '<div class="bj-s"><div class="bj-pg">3</div>' +
      '<div class="bj-bdv">3억 5,719만원</div><div class="bj-civ">500,000원</div></div>';
    return true;
  });
  const numOn = async () => page.evaluate(() =>
    ['.bj-pg', '.bj-bdv', '.bj-civ'].map(s => {
      const e = document.querySelector('#TNUM ' + s), c = getComputedStyle(e);
      return (/tabular/.test(c.fontVariantNumeric) || /tnum/.test(c.fontFeatureSettings)) ? s : null;
    }).filter(Boolean));
  await page.emulateMedia({ media: 'screen' });
  const onScreen = await numOn();
  await page.emulateMedia({ media: 'print' });
  const onPrint = await numOn();
  await page.emulateMedia({ media: 'screen' });
  is(num && onPrint.length === 0,
     '  리포트 덱의 <b>금액 칸</b>도 종이에서는 tnum 이 꺼진다 — ' +
     '켜져 있으면 ' + (onPrint.join(' · ') || '(없음)') + ' 에서 숫자가 유니코드를 잃는다');
  is(onScreen.length === 3,
     '  화면에서는 그대로 켜 둔다 — 자릿수가 맞아야 눈으로 검산이 된다 · ' + onScreen.length + '/3');

  console.log('\n[5] 왕복 — 우리가 뽑은 제안서를 우리가 다시 읽는가');
  const doc = await page.evaluate(() => {
    ['apex_baba_rows', 'apex_baba_plans', 'apex_baba_prop'].forEach(k => localStorage.removeItem(k));
    BABA.rows = null; BABA.plans = null; babaBlank();
    const V = { death: [5000, 10000], cancer: [3000, 10000], brain: [1000, 3000],
                heart: [1000, 3000], silson: [5000, 5000], fee: [212400, 246800] };
    BABA.rows.forEach(r => { if (V[r.k]) { r.b = V[r.k][0]; r.a = V[r.k][1]; } });
    BABA.at = '점검'; babaSave();
    localStorage.setItem('apex_baba_prop', JSON.stringify({ who: '홍길동', by: '점검', tel: '', hi: '', note: '' }));
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>왕복</title>' +
      '<style>' + babaPropCss() + '</style></head><body>' + babaPropBodyHtml() + '</body></html>';
  });
  const pp = await browser.newPage({ viewport: { width: 718, height: 1047 } });
  await pp.setContent(doc, { waitUntil: 'load' });
  await pp.emulateMedia({ media: 'print' });
  const pdfBuf = await pp.pdf({ format: 'A4', printBackground: true });
  await pp.close();
  const back = await page.evaluate(async (b64) => {
    const raw = atob(b64), arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    const file = new File([arr], '왕복.pdf', { type: 'application/pdf' });
    const t = await babaTextAll(file);
    babaTossReset();
    const got = babaScan(t.text || '');
    /* 어느 칸(권장·기존·신규)을 집는지는 장 배치에 따라 달라진다.
       그래서 <b>값의 자격</b>만 본다 — 말이 되는 크기인가, 버린 게 있나. */
    const vals = Object.keys(got).filter(k => k !== 'fee').map(k => got[k].won);
    return {
      숫자: (t.text.match(/[0-9]/g) || []).length,
      믿는가: pdfTextTrust(t.text).ok,
      담보수: Object.keys(got).length,
      암: got.cancer ? got.cancer.won : null,
      최대: vals.length ? Math.max.apply(null, vals) : 0,
      버린것: BABA_TOSS.n
    };
  }, pdfBuf.toString('base64'));
  is(back.숫자 > 200, '  뽑은 종이에서 숫자가 다시 나온다 — ' + back.숫자 + '개 (tnum 을 켜면 0 이 된다)');
  is(back.믿는가, '  그 글을 믿을 수 있다고 판단한다');
  is(back.담보수 >= 5, '  담보를 다시 잡는다 — ' + back.담보수 + '개');
  is(back.암 !== null, '  암 진단비를 다시 잡는다 — ' + back.암);
  /* 12692294억 사고가 다시 나면 여기서 걸린다 */
  is(back.최대 <= 50000, '  <b>말이 안 되는 큰 값이 없다</b> — 가장 큰 값 ' + back.최대 + '만원 (12692295억 사고가 다시 나면 여기서 걸린다)');
  /* 제안서에는 「보장 차이 +2억 7,491만」 같은 <b>요약 줄</b>이 있어 안전망이
     몇 번 걸린다. 그게 정상이다 — 그 값들이 담보 칸에 안 실리는 것이 중요하다. */
  is(back.버린것 <= 8, '  안전망이 걸러 낸 숫자 ' + back.버린것 + '개 (요약 줄의 합계 — 담보 칸에는 안 실린다)');

  console.log('\n[5-2] 사전 — 우리가 쓰는 이름과 「보험료 차이」');
  const dict = await page.evaluate(() => {
    babaTossReset();
    const a = babaScan('사망(주계약) 5,000만원 후유장해 3,000만원');
    const b = babaScan('월 보험료 차이 +34,400원 월 보험료 212,400원');
    const c = babaScan('월 보험료 차이 +34,400원');
    return { 사망: a.death ? a.death.won : null,
             장해: a.disab ? a.disab.won : null,
             합계: b.fee ? b.fee.won : null,
             차이만: c.fee ? c.fee.won : null };
  });
  is(dict.사망 === 5000, '  「사망(주계약)」 — 우리가 화면에 쓰는 이름도 사전에 있다 — ' + dict.사망);
  is(dict.장해 === 3000, '  「후유장해」 도 그대로 — ' + dict.장해);
  is(dict.합계 === 212400, '  「월 보험료 차이」 를 건너뛰고 <b>합계</b>를 집는다 — ' + dict.합계);
  is(dict.차이만 === null, '  차이밖에 없으면 <b>모름</b>으로 둔다 (34,400원짜리 보험을 만들지 않는다)');

  console.log('\n[5-3] 글자가 한 글자씩 벌어진 PDF 도 읽는가');
  /* pdf.js 가 글자마다 조각을 주는 문서가 실제로 있다(A+에셋 보장분석자료).
     이름은 공백을 지우고 찾으니 다 찾는데 금액은 「3 , 0 0 0 만 원」 이 되어
     하나도 못 읽었다 — 담보 47개를 찾아 놓고 결과가 0개였다. */
  const spaced = await page.evaluate(() => {
    const glyphs = (txt, x0, y) => txt.split('').map((c, i) =>
      ({ str: c, width: 6, height: 10, transform: [1, 0, 0, 10, x0 + i * 6, y] }));
    /* 붙어 있는 글자들 — 사이에 공백이 들어가면 안 된다 */
    const one = pdfJoin(glyphs('암진단비3,000만원', 0, 100));
    /* 칸이 벌어진 표 — 사이에 공백이 들어가야 한다 */
    const two = pdfJoin(glyphs('암진단비', 0, 100).concat(glyphs('3,000만원', 200, 100)));
    /* 줄이 바뀌면 줄바꿈 */
    const three = pdfJoin(glyphs('암진단비', 0, 100).concat(glyphs('뇌혈관', 0, 80)));
    return { one, two, three, 읽음: babaWon(one) };
  });
  is(spaced.one === '암진단비3,000만원', '  붙은 글자는 붙여서 잇는다 — ' + spaced.one);
  is(spaced.읽음 === 3000, '  그래서 금액이 읽힌다 — ' + spaced.읽음 + '만원 (예전에는 못 읽었다)');
  is(/암진단비 3,000만원/.test(spaced.two), '  칸이 벌어지면 띄운다 (표가 안 붙는다) — ' + spaced.two);
  is(/\n/.test(spaced.three), '  줄이 바뀌면 줄을 바꾼다');

  console.log('\n[5-4] 라벨과 금액 사이에 다른 숫자가 껴도 보험료를 읽는가');
  const prem = await page.evaluate(() => ({
    보장분석: babaPlanPrem('DB손보 아이러브플러스건강보험2409 2025-02-27 월납 30년 100세 126,384 원'),
    제안서: babaPlanPrem('무배당 삼성 통합보장보험 월보험료 62,000원'),
    원없음: babaPlanPrem('합계보험료 210,500'),
    가입금액: babaPlanPrem('보험료 계산 기준 암진단비 5,000만원'),
    날짜: babaPlanPrem('월납 2025-02-27 2121-02-27')
  }));
  is(prem.보장분석 === 126384,
     '  「월납 30년 100세 126,384원」 — 사이에 30·100 이 껴도 읽는다 (15건 중 14건이 여기서 막혔다)');
  is(prem.제안서 === 62000, '  라벨 바로 뒤 금액도 그대로 — ' + prem.제안서);
  is(prem.원없음 === 210500, '  「원」 이 없어도 읽는다 — ' + prem.원없음);
  is(prem.가입금액 === null, '  만·억이 붙었으면 가입금액이지 보험료가 아니다');
  is(prem.날짜 === null, '  날짜만 있으면 <b>모름</b>으로 둔다');

  console.log('\n[5-5] 날짜·쪽번호를 금액으로 보지 않는가');
  const junk = await page.evaluate(() => ({
    날짜: babaWon('2025-02-27'),
    점날짜: babaWon('2020.07.15'),
    쪽번호: babaWon('008 / 034'),
    조항뒤금액: babaWon('제3조. 5,000만원'),
    진짜: babaWon('3,000만원')
  }));
  is(junk.날짜 === null && junk.점날짜 === null, '  날짜는 금액이 아니다');
  is(junk.쪽번호 === null, '  쪽번호(008 / 034)도 금액이 아니다');
  is(junk.조항뒤금액 === 5000, '  <b>「제3조. 5,000만원」 은 그대로 읽는다</b> — 앞 글자만 보고 자르면 이게 죽는다');
  is(junk.진짜 === 3000, '  멀쩡한 금액은 그대로');

  console.log('\n[6] 못 믿을 글이면 그림으로 다시 읽는 길이 있는가');
  is(/kind:'text-weak'/.test(src), '  AI 가 없으면 「글이 못 미덥다」 고 이름을 붙여 남긴다');
  is(/AI 를 연결하면 같은 파일을 그림으로 다시 읽습니다/.test(src),
     '  그때 무엇을 하면 되는지 알려 준다');
  is(/그래서 <b>그림으로 다시 읽었습니다\.<\/b>/.test(src),
     '  AI 가 있으면 그림으로 다시 읽고, 그 사실을 밝힌다');
  is(errs.length === 0, '  중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 어긋남') : '글 읽기 점검 통과 — 다 맞습니다.');
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
