/* 📄 상품 제안서(가입설계서) PDF 를 읽어 <b>표로 띄우고</b>, 고친 대로 ③ 추가 보험에 넣는가 (판 X330)

   사장님 말씀 2026-11-04 「우리가 상품 제안서를 넣으면 읽을 수 있도록 해줘, 틀린 건 우리가 수정하도록
   지금처럼 자료에 띄우면 좋을 것 같아」. 그리고 「맡겨 주시면」 약속 장이 서는가.

     1. <b>글자로 된 PDF</b> 를 만들어(이 자가 직접 · 보험사 서식 흉내) 실제 파일 고르기로 넣는다.
        회사 · 상품명 · 월 보험료 · 납입 · 만기 · 담보 줄을 읽는가.
     2. <b>바로 넣지 않는다</b> — 표(원문 줄 · 담보 · 금액)가 먼저 뜨고, 「이대로 넣기」 전에는 S.after 가 그대로.
     3. <b>고친 값이 들어간다</b> — 금액 한 칸을 고치고 한 줄을 빼고 넣으면 그대로 들어간다(틀린 건 우리가 고친다).
     4. 「순환계」 줄은 순환계 담보로 — 이름 맞추기가 뇌 쪽을 먼저 보는 함정.
     5. 글자가 없는 PDF(스캔)는 <b>아무것도 안 넣고</b> 손으로 적으라고 말한다 — 지어내지 않는다(1번).
     6. 「맡겨 주시면」 장 — 약속 여섯이 서고, <b>지급을 장담하는 말</b>이 없다(심의 10대 금지 ⑥).   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url'), os = require('os');
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
const PLAN = '<!doctype html><html lang="ko"><meta charset="utf-8"><body style="font-family:sans-serif;font-size:12px;padding:30px">' +
  '<h2>가입설계서</h2><p>삼성화재해상보험 · 무배당 삼성화재 건강보험 마이헬스 파트너(2601.15)</p>' +
  '<p>피보험자 : 홍*호 (45세 남) · 20년납 100세만기 · 월납</p><table border="1">' +
  [['일반암진단비(유사암제외)', '3,000만원', '21,300'], ['유사암진단비', '600만원', '1,140'], ['표적항암약물허가치료비', '2,000만원', '3,200'],
   ['뇌혈관질환진단비', '1,000만원', '2,350'], ['간병인사용일당(요양병원제외)', '15만원', '1,520'], ['암생활자금(매월)', '100만원', '1,050'],
   ['특정순환계질환 혈전용해치료비', '500만원', '380'], ['보험료납입면제', '-', '420']]
    .map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>20년납 100세만기</td><td>' + r[2] + '</td></tr>').join('') +
  '</table><p>합계보험료 38,400원 (월납)</p></body></html>';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'baprop-'));
  const pdf = path.join(tmp, 'plan.pdf'), blankPdf = path.join(tmp, 'scan.pdf');
  const mk = await br.newPage();
  await mk.setContent(PLAN); await mk.pdf({ path: pdf, format: 'A4' });
  await mk.setContent('<html><body><svg width="400" height="300"><rect width="400" height="300" fill="#ccc"/></svg></body></html>');
  await mk.pdf({ path: blankPdf, format: 'A4' }); await mk.close();

  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  /* ★ 바깥은 끊습니다(check-netblock) — 사장님 Supabase 를 부르지 않게. PDF 글자를 뽑는 pdf.js 만
     cdnjs 에서 받습니다: 이 자가 재는 것이 바로 그 글자 뽑기라 막으면 아무것도 못 잽니다. */
  await pg.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + port) >= 0 || /cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\//.test(u)) ? r.continue() : r.abort();
  });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  /* 견본 자료 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); go('edit'); });
  await pg.waitForTimeout(400);

  head('[1] 제안서 칸이 ③ 추가 보험에 선다');
  is(await pg.evaluate(() => !!document.querySelector('.kb.pp #ppDrop')), '「상품 제안서 PDF」 칸과 끌어다 놓는 자리가 있다');

  head('[2] 글자로 된 PDF 를 읽는다 — 바로 넣지 않고 표로 띄운다');
  const n0 = await pg.evaluate(() => S.after.length);
  let fc;
  try { [fc] = await Promise.all([pg.waitForEvent('filechooser', { timeout: 5000 }), pg.evaluate(() => ppPick())]); await fc.setFiles(pdf); } catch (e) {}
  let got = false;
  try { await pg.waitForSelector('.ppv', { timeout: 30000 }); got = true; } catch (e) {}
  is(got, '표가 떴다 — PDF 글자를 뽑았다' + (got ? '' : ' (pdf.js 를 못 받았으면 인터넷 연결 문제일 수 있음)'));
  if (got) {
    const P = await pg.evaluate(() => ({ co: __PP.P.co, nm: __PP.P.nm, prem: __PP.P.premMan, years: __PP.P.years, term: __PP.P.term,
      rows: __PP.P.rows.map(r => [r.k, r.v]), raw: __PP.P.rows.length && __PP.P.rows[0].raw, after: S.after.length }));
    is(P.co === '삼성화재', '회사 — 「' + P.co + '」');
    is(/마이헬스 파트너/.test(P.nm), '상품명이 끝까지 — 「' + P.nm + '」');
    is(P.prem === '3.84' && P.years === '20' && P.term === '100세만기', '월 보험료 · 납입 · 만기 — ' + P.prem + '만원 · ' + P.years + '년 · ' + P.term);
    const K = Object.fromEntries(P.rows);
    is(K.cancer === 3000 && K.cancer2 === 600 && K.target === 2000 && K.brain === 1000 && K.nurUD === 15 && K.canLiv === 100,
       '담보 줄 ' + P.rows.length + '개를 만원으로 — ' + P.rows.map(r => r[0] + ' ' + r[1]).join(' · '));
    is(K.circT === 500 && K.brainT === undefined, '「순환계」 줄은 순환계 혈전용해 담보로 — 뇌 쪽으로 가지 않는다');
    is(!('waiv' in K) && !P.rows.some(r => /납입면제/.test(r[0])), '「보험료납입면제」 같은 줄은 담보로 안 넣는다');
    is(/일반암진단비/.test(P.raw || ''), '표에 <제안서 원문 줄>이 그대로 보인다 — 맞춰 볼 수 있게');
    is(P.after === n0, '「이대로 넣기」 전에는 ③ 추가 보험이 <그대로>다 (' + P.after + '건)');

    head('[3] 틀린 칸을 고치면 고친 대로 들어간다');
    await pg.evaluate(() => { const i = __PP.P.rows.findIndex(r => r.k === 'cancer'); ppAmt('rows', i, '4000');
      const j = __PP.P.rows.findIndex(r => r.k === 'nurUD'); ppTog('rows', j, false); __PP.P.co = '삼성화재해상보험'; ppGo(); });
    await pg.waitForTimeout(400);
    const A = await pg.evaluate(() => { const p = S.after[S.after.length - 1]; return { n: S.after.length, co: p.co, cov: p.cov, pp: p.pp, prem: p.premMan }; });
    is(A.n === n0 + 1, '넣으면 ③ 추가 보험에 <한 건> 늘어난다 (' + n0 + ' → ' + A.n + ')');
    is(A.cov.cancer === '4000' && A.cov.nurUD === undefined && A.co === '삼성화재해상보험',
       '고친 금액 · 뺀 줄 · 고친 회사 이름이 그대로 — 일반암 ' + A.cov.cancer + ' · 간병인 ' + (A.cov.nurUD || '안 넣음') + ' · ' + A.co);
    is(A.pp === 'plan.pdf' && A.prem === '3.84', '어느 제안서에서 왔는지(' + A.pp + ')와 보험료가 남는다');
  }

  head('[4] 글자가 없는 PDF(스캔)는 아무것도 안 넣는다');
  const n1 = await pg.evaluate(() => S.after.length);
  try { const [fc2] = await Promise.all([pg.waitForEvent('filechooser', { timeout: 5000 }), pg.evaluate(() => ppPick())]); await fc2.setFiles(blankPdf); } catch (e) {}
  await pg.waitForTimeout(4000);
  const sc = await pg.evaluate(() => ({ t: (document.getElementById('ppBox') || {}).textContent || '', n: S.after.length, pv: !!document.querySelector('.ppv') }));
  is(sc.n === n1 && !sc.pv && /손으로|스캔|그림|제안 더하기/.test(sc.t), '스캔 PDF — 표를 안 띄우고 「손으로 적어 주세요」 라고 말한다 (「' + sc.t.slice(0, 40) + '…」)');

  /* [4-1] 판 X346 — 실제 제안서 8부에서 틀렸던 모양을 그대로 흉내 낸다(실제 고객 서류는 저장소에 넣지 않는다).
     ① 설명 문단 · 예시표의 금액을 담보로 잡던 것 → <b>담보 표(가입금액 + 보험료 머리줄)만</b> 읽는다
     ② 담보 이름이 꺾여 금액 줄과 떨어진 것 ③ 「1천5백만원 · 5천만원 · 1백만원」
     ④ 1~5종처럼 같은 담보가 여러 줄 → 큰 금액 하나만 체크 ⑤ 「암진단비(유사암 제외)」 가 유사암으로 가던 것
     ⑥ 「간병인사용 질병입원일당」 은 입원일당이 아니라 간병인 일당 ⑦ 합계 보험료는 「보장보험료 합계」 줄에서 */
  head('[4-1] 실제 제안서 모양 — 표만 · 꺾인 이름 · 천/백만원 · 1~5종 · 유사암 제외 · 간병인사용');
  const KBLIKE = '<!doctype html><html lang="ko"><meta charset="utf-8"><body style="font-family:sans-serif;font-size:12px;padding:30px">' +
    '<p>KB 5.10.10 Young 플러스 건강보험(무배당)(26.07)</p><p>※ 예시 : 40세 남성, 가입금액 1천만원 기준 — 암진단비 1천만원</p>' +
    '<p>보장명 가입금액 보험료(원) 보험료비중(%) 납입|보험기간</p>' +
    '<p>44 암진단비(유사암 제외)(감액없음)(맞춤고지) 5천만원 55,400 22.1 20년/90세</p>' +
    '<p>89 뇌혈관질환진단비(감액없음)(맞춤고지) 2천만원 19,360 7.7 20년/90세</p>' +
    '<p>93 심장질환(특정I)진단비(감액없음)(맞춤고지) 1천5백만원 16,410 6.5 20년/90세</p>' +
    '<p>195 질병1~5종수술비II(매회지급)(맞춤고지)_5종 1천만원 9,800 3.9 20년/90세</p>' +
    '<p>196 질병1~5종수술비II(매회지급)(맞춤고지)_4종 5백만원 950 0.4 20년/90세</p>' +
    '<p>400</p><p>간병인사용 질병입원일당(1일이상 180일한도)(요양병원제외)(건</p><p>강가입)</p><p>15만원 6,390 20년/90세</p>' +
    '<p>- MRI촬영(급여) : 5만원</p><p>보장보험료 합계 250,740 원</p><p>※ 상품제안서_가입담보는 요약 안내입니다</p></body></html>';
  const kbPdf = path.join(tmp, 'kblike.pdf');
  { const m2 = await br.newPage(); await m2.setContent(KBLIKE); await m2.pdf({ path: kbPdf, format: 'A4' }); await m2.close(); }
  await pg.evaluate(() => { window.__PP = null; go('edit'); });
  try { const [fc3] = await Promise.all([pg.waitForEvent('filechooser', { timeout: 5000 }), pg.evaluate(() => ppPick())]); await fc3.setFiles(kbPdf); } catch (e) {}
  let got2 = false; try { await pg.waitForSelector('.ppv', { timeout: 30000 }); got2 = true; } catch (e) {}
  if (got2) {
    const Q = await pg.evaluate(() => ({ prem: __PP.P.premMan, nm: __PP.P.nm,
      on: __PP.P.rows.filter(r => r.on).map(r => [r.k, r.v]), all: __PP.P.rows.map(r => r.k),
      oth: __PP.P.other.map(r => r.raw), dupTag: !!document.querySelector('.ppv em.dup') }));
    const O = Object.fromEntries(Q.on);
    is(O.cancer === 5000 && Q.all.indexOf('cancer2') < 0, '「암진단비(유사암 제외)」 5천만원 → <일반암 5,000만원> — 유사암으로 안 간다');
    is(O.brain === 2000, '「2천만원」 → 2,000만원');
    is(O.surg5D === 1000 && Q.all.filter(k => k === 'surg5D').length === 2, '1~5종 두 줄 중 <큰 금액(1,000만원) 하나만> 체크 — 더하면 부풀려진다');
    is(Q.dupTag, '빼 둔 줄에 「같은 담보 · 조건만 다름」 이라고 적어 둔다');
    is(O.nurUD === 15 && O.inpD === undefined, '꺾인 이름 「간병인사용 질병입원일당 …」 + 다음 줄 「15만원」 → <간병인 일당 15만원> (입원일당 아님)');
    /* 판 X357 — 「심장질환(특정I)」 은 이제 칸이 있다(특정 심장질환 진단 heartW). 예전에는 못 알아본 줄로 떨어지던 담보 */
    is(O.heartW === 1500 && !Q.oth.some(r => /심장질환\(특정I\)/.test(r)), '「심장질환(특정I) 진단비」 1천5백만원 → <특정 심장질환 진단 1,500만원> (판 X357 · 예전에는 못 알아본 줄)');
    is(Object.keys(O).indexOf('silD') < 0 && !Q.oth.some(r => /MRI/.test(r)) && !Q.on.some(r => r[1] === 1000 && r[0] === 'cancer'), '설명 줄(「- MRI촬영 : 5만원」 · 「예시 … 1천만원 기준」)은 담보로 안 잡는다');
    is(Q.prem === '25.074', '월 보험료는 「보장보험료 합계 250,740 원」 → 25.074만원');
    is(/Young 플러스 건강보험/.test(Q.nm), '상품명 — 「' + Q.nm + '」');
  } else is(false, 'KB 모양 PDF 의 표가 안 떴다');

  head('[5] 「맡겨 주시면」 — 약속 여섯 · 장담하는 말 없음');
  await pg.evaluate(() => { S.deck = true; go('show'); });
  await pg.waitForTimeout(500);
  const T = await pg.evaluate(() => { const s = document.getElementById('sTrust'); const L = deckList().map(x => x.id);
    return { ok: !!s, n: s ? s.querySelectorAll('.trc').length : 0, txt: s ? s.textContent : '', at: L.indexOf('sTrust'), close: L.indexOf('sClose'), last: L[L.length - 1] }; });
  is(T.ok && T.n === 6, '약속 장이 서고 약속이 <여섯> — ' + T.n);
  is(T.at >= 0 && T.at === T.close - 1 && T.last === 'sClose', '「이제 무엇이 달라집니까」 바로 앞에 선다 — 마지막 장은 그대로 클로징');
  is(!/받아\s*드립니다|100\s*%|무조건|반드시\s*받|보장해\s*드립/.test(T.txt), '지급을 <장담하는 말>이 없다 (심의 10대 금지 ⑥)');
  is(/약관과 심사/.test(T.txt), '「지급 여부와 금액은 약관과 심사에 따릅니다」 를 밝힌다');
  is(/상법 제662조/.test(T.txt), '3년 시효의 근거(상법 제662조)를 적는다');

  head('[6] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 제안서를 읽어 표로 띄우고, 고친 대로 넣습니다 · 약속 장이 섭니다');
  process.exit(bad ? 1 : 0);
})();
