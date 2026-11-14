/* 📄 제안서 읽기 — 실제 제안서 8부를 원문과 맞춰 보고 고친 것이 그대로인가 (판 X373)

   사장님 말씀 2026-11-06 「새로운 추가보험 제안서, 어떻게 읽어내는지 실수는 없는지 확인해서 정리해줘」 →
   「pdf 면 제대로 읽을수 있는지」 → 「응 고쳐줘」.

   글자 PDF 는 글자 · 숫자를 틀리지 않았다(8부 0건). 틀린 것은 <b>읽은 줄을 어느 칸에 얼마로 넣느냐</b> 였다.
   실제 고객 서류는 저장소에 넣지 않는다 — 틀렸던 <b>모양</b>만 흉내 낸 가짜 제안서를 이 자가 직접 PDF 로 만든다.

     [1] 삼성 모양 — 이름이 다른 두 특약(둘 다 상급종합병원플러스 · 암직접치료 500 + 암주요치료 1,000)은 <b>더한다</b> · 주보험 = 사망보험금 · 만기 「종신」
     [2] KB 모양 — 조건 붙은 줄(상급종합병원 100 · 181일 이상 10)은 기본 칸에서 뺀다 · 특정I/II 는 하나 · 「허혈심장질환」
     [3] 메리츠 모양 — 보험료는 1회차 보험료(묶음 소계 아님) · 「안내참조」 줄이 다음 줄을 먹지 않는다 · 잘린 상품명 괄호
     [4] NH 모양 — 표 「가입금액(만원)」 3,000 이 아니라 <b>보장내용 지급금액</b> 300만원 · 「1회당」 · 매달 칸은 큰 것 하나 · 만기 함정
     [5] 메트 모양 — 설명 문장(「지급받는 사망보험금은 3,815만원으로 … 손실」)은 담보가 아니다
     [6] 사진 · 표 없는 서류는 <b>하나도 체크하지 않는다</b>
     [7] 생보식 이름 · 유사암 치료비 풀이
     [8] 넣으면 더한 금액 그대로 들어간다(ppGo)
     [9] 넣기 단추는 표 위에 크게 · 표를 내려도 머리 띠 밑에 보인다 (판 X437 · 2026-11-14 「밑에 있어서 안 보여」)   */
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
const doc = (ps) => '<!doctype html><html lang="ko"><meta charset="utf-8"><body style="font-family:sans-serif;font-size:11px;padding:24px">' +
  ps.map(p => '<p style="margin:3px 0">' + p + '</p>').join('') + '</body></html>';

const DOCS = {
  samsung: doc(['삼성생명 · 삼성 The퍼스트 건강보험(무배당,무해약환급금형)', '합계보험료 42,104원 보험기간 (주보험기준) 2026-10-15부터 종신까지 납입주기 월납',
    '구 분 보험가입금액 보험기간 납입기간 보험료',
    '1 주보험[일반고지] 300만원 종신 20년납 7,500원',
    '29 상급종합병원플러스암직접치료보장특약C(무배당) 500만원 100세만기 20년납 9,540원',
    '46 초기집중보장형프리미엄클래스II암주요치료보장(상급종합병원플러스)특약C(무배당) 1,000만원 100세만기 20년납 23,850원',
    '30 갑상선암및기타피부암직접치료보장특약C(무배당) 200만원 100세만기 20년납 534원',
    '합 계 보 험 료 42,104원', '[주보험[일반고지] 보장내용]', '사망보험금 피보험자가 보험기간 중 사망한 경우 300만원']),
  kb: doc(['KB 5.10.10 Young 플러스 건강보험(무배당)', '보장명 가입금액 보험료(원) 보험료비중(%) 납입|보험기간',
    '180 질병수술비(맞춤고지) 30만원 6,414 2.6 20년/90세',
    '194 질병수술비(상급종합병원)(맞춤고지) 1백만원 3,540 1.4 20년/90세',
    '93 심장질환(특정I)진단비(감액없음)(맞춤고지) 1천5백만원 16,410 6.5 20년/90세',
    '95 심장질환(특정II)진단비(감액없음)(맞춤고지) 1천5백만원 4,395 1.8 20년/90세',
    '529 간호간병통합서비스 상해입원일당(1-180일)(맞춤고지) 7만원 1,575 0.6 20년/90세',
    '530 간호간병통합서비스 질병입원일당(1-180일)(맞춤고지) 7만원 4,802 1.9 20년/90세',
    '531 간호간병통합서비스 상해질병입원일당(요양/정신/한방병원제외,181일이상)(맞춤고지) 10만원 57 0.0 20년/90세',
    '60 허혈심장질환진단비(맞춤고지) 1천만원 3,000 1.2 20년/90세',
    '보장보험료 합계 250,740 원']),
  meritz: doc(['(무) 메리츠 The건강한 내Mom대로 5.10.5 보장보험2607(3.0) (해약환급금지급형)( 납입면제 1형)(건강고지형(간편))',
    '1회차보험료(할인후) 31,550 원', '가입담보 가입금액 보험료(원) 납기/만기', '보장보험료 합계 3,717 원',
    '402 간병인사용 일반상해입원일당(1일이상 180일한도)(요양병원)(건강가입) 5만원 190 20년 / 90세',
    '403 간병인사용 질병입원일당(plus)(1일이상 180일한도)(요양병원제외)(건강가입) 15만원 6,390 20년 / 90세',
    '404 간호·간병통합서비스 사용 질병입원일당(1일이상 180일한도)(건강가입) 5만원 2,250 20년 / 90세',
    '405 간호·간병통합서비스 사용 질병입원일당(181일이상)(요양,정신,한방병원제외)(건강가입) 7만원 35 20년 / 90세',
    '13 화재(폭발포함)배상책임 안내참조 56 20년 / 20년 31 풍수재손해(특수건물) 1억5천만원 450 20년 / 20년',
    '보장보험료 합계 12,677 원', '※ 가입담보리스트는 요약 안내입니다']),
  nh: doc(['상품명 NH올원더풀간병안심요양보험(무배당)', '보험기간 종신 ',
    '구 분 가입금액(만원) 보험기간 납입기간 보험료(원)',
    '주계약 NH올원더풀간병안심요양보험(무) 해약미지급형 2형(간편III) 300 100세 20년 12,330',
    '장기요양(1~2등급)진단특약(무)_DW 해약미지급 2형(간편III) 3,000 100세 20년 7,308',
    '장기요양(1~5등급)진단특약(무)_DW 해약미지급 2형(간편III) 8,000 100세 20년 92,720',
    '장기요양(1~5등급)방문요양보장특약(무)_DW 해약미지급 2형(간편III) 1,500 100세 20년 52,215',
    '장기요양(1~5등급)복합재가급여보장특약(무)_DW 해약미지급 2형(간편III) 3,500 100세 20년 40,670',
    '실납입 보험료 205,243', '※ 기준 : 여자 72세, 100세만기, 20년납, 월납',
    '■ 주계약 보장내용', '급부명 지급사유 지급금액', '사망보험금 피보험자가 보험기간 중 사망한 경우 300만원', '■ 선택특약 보장내용',
    '장기요양(1~2등급)진단특약(무)_DW 해약미지급 2형(간편III)', '급부명 지급사유 지급금액', '장기요양(1~2등급)보험금', '장기요양(1~2등급)상태가 되었을 때 (최초 1회한)', '300만원',
    '장기요양(1~5등급)진단특약(무)_DW 해약미지급 2형(간편III)', '급부명 지급사유 지급금액', '장기요양(1~5등급)보험금', '장기요양(1~5등급)상태가 되었을 때 (최초 1회한)', '800만원',
    '장기요양(1~5등급)방문요양보장특약(무)_DW 해약미지급 2형(간편III)', '급부명 지급사유 지급금액', '방문요양보험금', '방문요양을 이용하였을 때 (월 1회에 한함)', '1회당', '15만원',
    '장기요양(1~5등급)복합재가급여보장특약(무)_DW 해약미지급 2형(간편III)', '급부명 지급사유 지급금액', '복합재가급여보험금', '복합재가급여를 이용하였을 때 (월 1회한)', '1회당', '35만원']),
  met: doc(['보험상품명(주계약) 무배당 백만인을 위한 달러종신보험Plus(저해약환급금형I)', '주계약 보험기간 2026년 10월 27일 부터 종신 까지',
    '구분 가입금액 보험기간 납입기간 보험료', '무배당 백만인을 위한 달러종신보험Plus(저해약환급금형I) $6,000.00 종신 5 년납 $150.66',
    '합계보험료 $150.66 (₩199,560)', '(종신,5년납) (100세만기,5년납)', '외화 달러 환율',
    '가입금액 $6,000 · 보험료 $150.66 · 납입 5년', '지급받는 사망보험금은 3,815만원으로 (원화환산 기준) 손실이 발생할 수 있습니다.'])
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ppfix-'));
  const mk = await br.newPage(), B64 = {};
  for (const k of Object.keys(DOCS)) { const f = path.join(tmp, k + '.pdf'); await mk.setContent(DOCS[k]); await mk.pdf({ path: f, format: 'A4' }); B64[k] = fs.readFileSync(f).toString('base64'); }
  await mk.close();

  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  /* 바깥은 끊는다(check-netblock) — PDF 글자를 뽑는 pdf.js 만 cdnjs 에서 */
  await pg.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + port) >= 0 || /cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\//.test(u)) ? r.continue() : r.abort();
  });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { localStorage.clear(); doSample(); go('edit'); });

  const R = {};
  for (const k of Object.keys(B64)) {
    R[k] = await pg.evaluate(async ([b64, nm]) => {
      const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i);
      const txt = await extractPdfText(new File([u], nm, { type: 'application/pdf' }));
      const P = ppParse(txt, nm); window.__PP = { P: P, name: nm };
      const html = ppPreview();
      const on = {}; P.rows.filter(r => r.on).forEach(r => { on[r.k] = (on[r.k] || 0) + r.v; });
      const n0 = S.after.length; ppGo(); const p = S.after[S.after.length - 1];
      return { co: P.co, nm: P.nm, prem: P.premMan, term: P.term, years: P.years, on, nOn: P.rows.filter(r => r.on).length,
        raws: P.rows.concat(P.ext, P.other).map(r => r.raw), ext: P.ext.filter(r => r.on).map(r => ({ d: r.d, v: r.v, raw: r.raw })),
        tv: P.rows.concat(P.ext).filter(r => r.tv != null).map(r => [r.k || r.d, r.tv, r.v]), html,
        added: S.after.length > n0 ? { cov: p.cov, ext: p.ext } : null,
        tag: (function () { const c = Array.from(document.querySelectorAll('.pol.new')).pop(); return !!c && !!c.querySelector('.tag.pp') && !c.querySelector('.tag.hand'); })() };
    }, [B64[k], k + '.pdf']);
  }

  head('[1] 삼성 모양 — 이름이 다른 두 특약은 더한다 · 주보험 = 사망 · 만기');
  const A = R.samsung;
  is(A.on.cantx === 1500, '「암직접치료 500」 + 「암주요치료 1,000」 → <암주요치료비 1,500만원> (전에는 1,000 하나만) — ' + A.on.cantx);
  is(/따로 붙는 특약/.test(A.html), '미리보기에 「따로 붙는 특약 — 더해서 넣음」 이라고 적는다');
  is(A.ext.some(e => e.d === 'death' && e.v === 300 && /주계약 = 사망보험금/.test(e.raw)), '「주보험[일반고지] 300만원」 → 사망 담보(주계약 = 사망보험금) — 전에는 못 알아본 줄');
  is(A.ext.some(e => e.d === 'similar') && /유사암\(갑상선암/.test(A.html) && !/유사암 진단비<\/b>/.test(A.html), '갑상선암 치료 특약을 「유사암 진단비」 라고 풀지 않는다');
  is(A.term === '종신' && A.prem === '4.2104', '만기 「보험기간 … 종신까지」 → 종신 · 보험료 42,104원 — ' + A.term + ' / ' + A.prem);

  head('[2] KB 모양 — 조건 붙은 줄 · 특정I/II · 허혈심장질환');
  const K = R.kb;
  is(K.on.surg === 30, '질병수술비 <30만원> — 「(상급종합병원) 1백만원」 은 상급종합병원에서만이라 기본 칸에서 뺀다 — ' + K.on.surg);
  is(/조건이 붙은 줄/.test(K.html), '뺀 줄에 「조건이 붙은 줄」 이라고 적는다');
  is(K.on.heartW === 1500, '심장질환(특정I) · (특정II) 는 같은 담보 · 범위만 다름 → 1,500만원 하나 — ' + K.on.heartW);
  is(K.on.nurNS === 7, '간호간병 일당 <7만원>(1~180일) — 「181일 이상 10만원」 을 집지 않는다 — ' + K.on.nurNS);
  is(K.on.heart === 1000, '「허혈심장질환진단비」(성 없이) → 허혈성심장질환 진단 1,000만원 — ' + K.on.heart);
  is(K.prem === '25.074' && K.term === '90세만기', '보험료 25.074만 · 만기 「20년/90세」 → 90세만기 — ' + K.prem + ' / ' + K.term);

  head('[3] 메리츠 모양 — 1회차 보험료 · 안내참조 줄 · 잘린 상품명');
  const M = R.meritz;
  is(M.prem === '3.155', '보험료는 「1회차보험료(할인후) 31,550원」 — 첫 묶음 소계 3,717원이 아니다 — ' + M.prem);
  is(M.on.nurUD === 15 && M.on.nurNS === 5, '간병인 15만 · 간호간병 5만(1~180일) — 요양병원 · 181일 이상 줄은 뺀다 — ' + M.on.nurUD + ' / ' + M.on.nurNS);
  is(M.raws.some(r => /^풍수재손해/.test(r)) && !M.raws.some(r => /배상책임.*풍수재/.test(r)), '금액이 「안내참조」 인 배상책임 줄이 다음 줄 「풍수재손해 1억5천」 을 먹지 않는다');
  is(!/\([^)]*$/.test(M.nm), '70자에서 잘린 상품명에 열린 괄호가 안 남는다 — 「' + M.nm + '」');

  head('[4] NH 모양 — 보장내용 지급금액 · 1회당 · 매달 칸 · 만기 함정');
  const N = R.nh;
  is(N.on.ltcD === 1100, '장기요양 진단 — 표 3,000 · 8,000 이 아니라 <보장내용 300만 + 800만 = 1,100만원> (등급별 따로 나옴) — ' + N.on.ltcD);
  is(N.tv.some(t => t[0] === 'ltcD' && t[1] === 8000 && t[2] === 800) && /보장내용 지급액/.test(N.html), '바꾼 줄에 표 가입금액을 적어 둔다(「표 가입금액 8,000만 → 보장내용 지급액」)');
  is(N.on.ltcF === 35, '매달 받는 장기요양 급여 — 1회당 35만 · 15만 중 <큰 것 하나 35만원> (2,000 · 3,500 이 아니다) — ' + N.on.ltcF);
  is(N.ext.some(e => e.d === 'death' && e.v === 300), '주계약 300 → 사망 담보(보장내용 「사망보험금 300만원」)');
  is(N.term === '100세만기', '안내의 「보험기간 종신」(날짜 없음)을 만기로 집지 않는다 → 100세만기 — ' + N.term);
  is(N.prem === '20.5243', '보험료 「실납입 보험료 205,243」 — ' + N.prem);

  head('[5] 메트 모양 — 설명 문장은 담보가 아니다');
  const T = R.met;
  is(!T.raws.some(r => /사망보험금은/.test(r)) && !T.ext.some(e => e.v === 3815), '「지급받는 사망보험금은 3,815만원으로 … 손실」 을 사망 담보로 안 잡는다');
  is(T.term === '종신' && T.prem === '19.956', '달러 종신 — 만기 종신(비교표의 「100세만기」 아님) · 보험료 ₩199,560 — ' + T.term + ' / ' + T.prem);

  head('[6] 사진 · 표 없는 서류는 하나도 체크하지 않는다');
  const O = await pg.evaluate(() => {
    const a = ppParse('암 5,000 만원\n뇌혈관질환 진단비 3,000 만원\n질병 및 재해수술비 5종 500 만원', 'shot.png', true);
    const b = ppParse('백혈병 림프종 고액암 1억원\n뇌졸중진단비 2,000만원', 'note.pdf', false);
    window.__PP = { P: a, name: 'shot.png' }; a.ocr = true; const h = ppPreview();
    return { aOn: a.rows.concat(a.ext).filter(r => r.on).length, aN: a.rows.length, bOn: b.rows.concat(b.ext).filter(r => r.on).length, bN: b.rows.length, bL: !!b.loose, h };
  });
  is(O.aN > 0 && O.aOn === 0 && /하나도 체크하지 않았습니다/.test(O.h), '사진 — 읽은 ' + O.aN + '줄 모두 체크 안 함 · 「하나도 체크하지 않았습니다」');
  is(O.bL && O.bN > 0 && O.bOn === 0, '담보 표가 없는 서류의 설명 줄(납입 · 만기 없음) — ' + O.bN + '줄 모두 체크 안 함');

  head('[7] 생보식 이름');
  const NM = await pg.evaluate(() => ['입원급여금', '질병 및 재해수술비 5종', '질병 및 재해 수술비', '허혈심장질환진단비', '허혈성심장질환진단비', '갑상선암직접치료비'].map(n => { const r = ppRule(n); return r.k || r.d; }));
  is(NM[0] === 'inpD', '「입원급여금」 → 질병입원일당 — ' + NM[0]);
  is(NM[1] === 'surg5D' && NM[2] === 'surg', '「질병 및 재해수술비 5종」 → 1~5종 수술비 · 「질병 및 재해 수술비」 → 수술비 — ' + NM[1] + ' / ' + NM[2]);
  is(NM[3] === 'heart' && NM[4] === 'heart', '「허혈심장질환」 · 「허혈성심장질환」 둘 다 허혈성심장질환 진단');
  is(NM[5] === 'similar', '갑상선암 치료비 → 유사암 치료비(진단비 아님)');

  head('[8] 넣으면 — 더한 금액 · 보장내용 금액 그대로');
  is(A.added && A.added.cov.cantx === '1500' && A.added.ext.some(e => e.d === 'death' && e.v === 300), '삼성 모양 → 계약에 암주요치료비 1,500 · 참고 담보 사망 300');
  is(N.added && N.added.cov.ltcD === '1100' && N.added.cov.ltcF === '35', 'NH 모양 → 계약에 장기요양 진단 1,100 · 장기요양 급여 35');
  is(K.added && K.added.cov.surg === '30' && K.added.cov.nurNS === '7', 'KB 모양 → 질병수술비 30 · 간호간병 7');
  is(K.tag, '제안서에서 넣은 계약은 「제안서에서 읽음」 표시(「손으로 적음」 아님 · 판 X390)');

  /* 사장님 말씀 2026-11-14 「추가 버튼이 밑에 있어서 안 보여서 위로 · 크게」 (판 X437) —
     표가 길면 맨 아래 단추를 못 찾았다. 넣기 단추가 표 위에 크게 있고, 표를 내려도 머리 띠 밑에 붙어 보이는가 */
  head('[9] 넣기 단추 — 표 위에 · 크게 · 내려도 보인다');
  for (const vp of [[1440, 900], [390, 800]]) {
    await pg.setViewportSize({ width: vp[0], height: vp[1] });
    const G = await pg.evaluate(async (b64) => {
      const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i);
      const txt = await extractPdfText(new File([u], 'meritz.pdf', { type: 'application/pdf' }));
      window.__PP = { P: ppParse(txt, 'meritz.pdf'), name: 'meritz.pdf' }; ppSet(ppPreview());
      const v = document.querySelector('.ppv'), g = v && v.querySelector('.ppgo .go'), t = v && v.querySelector('.ppt');
      if (!g || !t) return null;
      const first = v.querySelector('button') === g, above = !!(g.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING);
      const h = g.getBoundingClientRect().height, fs = parseFloat(getComputedStyle(g).fontSize);
      /* 표 한가운데까지 내린 뒤 — 머리 띠(.bar) 밑, 화면 안에 있어야 한다 */
      const tb = t.getBoundingClientRect(); scrollBy(0, tb.top + tb.height / 2 - innerHeight / 2);
      await new Promise(r => setTimeout(r, 200));
      const r = g.getBoundingClientRect(), bar = document.querySelector('.bar').getBoundingClientRect();
      const seen = r.top >= bar.bottom - 1 && r.bottom <= innerHeight;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { first, above, h, fs, seen, onTop: !!hit && g.contains(hit), y: Math.round(r.top), barB: Math.round(bar.bottom) };
    }, B64.meritz);
    is(G && G.first && G.above, vp[0] + 'px — 넣기 단추가 미리보기 <b>맨 처음 단추</b> · 표보다 위');
    is(G && G.h >= 56 && G.fs >= 17, vp[0] + 'px — 크게(높이 ' + (G && Math.round(G.h)) + 'px · 글씨 ' + (G && G.fs) + 'px)');
    is(G && G.seen && G.onTop, vp[0] + 'px — 표 가운데까지 내려도 머리 띠 밑에 보이고 눌린다(단추 ' + (G && G.y) + ' · 띠 끝 ' + (G && G.barB) + ')');
    const n0 = await pg.evaluate(() => S.after.length);
    await pg.locator('.ppgo .go').click();
    is(await pg.evaluate((n0) => S.after.length === n0 + 1 && !document.querySelector('.ppv'), n0), vp[0] + 'px — 위 단추를 누르면 ③ 추가 보험에 들어가고 미리보기가 닫힌다');
  }

  head('[10] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 제안서 읽기 — 더할 특약은 더하고 · 조건 붙은 줄은 빼고 · 보장내용 금액 · 설명 문장 · 사진은 체크 안 함');
  process.exit(bad ? 1 : 0);
})();
