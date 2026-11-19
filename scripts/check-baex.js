/* 🎞 제안서 → 보장 설명서 — 넣으면 바로 서고, <b>틀린 숫자로는 안 선다</b> (판 X499)

   사장님 말씀 2026-11-19 「응 제안서 넣으면 바로나오게 기능으로 만들어줘」.
   app/ba.html 의 「🎞 바로 설명서로」 — 제안서 PDF 를 읽어 보장 전·후 무대와 같은 결의 설명서(남색 표지 · 금색 번호 ·
   아래 화법 띠)를 한 벌 세운다. 실제 고객 서류는 저장소에 넣지 않는다 — 가짜 제안서를 이 자가 직접 PDF 로 만든다(견본 홍길동).

     [1] 글자 PDF — 담보 표를 <b>줄 통째로</b> 읽는다 · 「보험료납입면제대상보장」 줄도 담보다 · 같은 표가 설명 문장 옆에
         또 찍혀도(KB 「가입설계」 쪽) 두 번 세지 않는다
     [2] ★ 줄마다 보험료를 더한 값이 제안서 보험료와 <b>원 단위까지 같으면</b> 고치기 없이 바로 설명서가 선다
     [3] ★ 하나라도 틀리면 설명서 대신 <b>「읽은 값 고치기」</b> 가 먼저 선다 · 차이를 원으로 말한다 · 고치면 맞음으로 바뀐다
     [4] 설명서 숫자 — 표지 월 보험료 · 묶음 합 · 비중이 제안서 숫자 그대로
     [5] 해약환급금 — 표에서 읽은 줄만(낸 돈 = 월 보험료 × 개월 · 환급률이 맞는 줄) · 안 맞는 줄은 안 그린다 · 메우지 않는다
     [6] 납입면제 조건 — 번호가 차례로 이어지는 줄만 · 꺾인 줄은 잇고 · 짧은 괄호(유사암 제외)는 남긴다
     [7] 이름 — 제안서의 계약자 · 피보험자 이름을 설명서에 안 싣는다 · 전·후 칸 이름은 가려서(3번)
     [8] 그림 제안서(글자 인식) 모양 — 실제 KB 그림 제안서를 3배로 읽은 <b>줄 모양</b> 그대로(이름 없는 담보 줄만)
         「1.400 · 뭔 · 맘 · 면간 · 미45 · 520%」 를 고쳐 읽고 합계가 맞는가
     [9] 장마다 넘치지 않나 · tnum 은 화면에서만(4-1) · 누르는 것은 44px · 파일로 저장하면 문서 한 벌
     [10] 원래 판(손으로 지은 13장)의 그림 — 2026-11-19 사장님 말씀 「원래거가 더 좋은데」.
          암은 단계 흐름 · 뇌심장은 <b>제안서 본문의 병명</b> 칩(깨진 병명은 버리고 「일부」 라고 밝힘) · 다쳤을 때는
          장해율 막대(제안서에 「장해지급률을 … 곱한」 이 있을 때만) · 1~5종 수술 계단 · 할인 장(제안서 할인율 그대로)    */
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

/* 월 54,000원 — 열두 줄을 더하면 정확히 54,000 */
const ROWS = [
  '1 [기본계약]일반상해사망(맞춤고지) 1억원 3,000 5.6 20년/90세',
  '3 [기본계약]일반상해후유장해(3~100%)(맞춤고지) 1억원 2,680 5.0 20년/90세',
  '5 [2종의무부가특약]보험료납입면제대상보장(12대)(맞춤고지) 10만원 34 0.1 20년/20년',
  '44 암진단비(유사암 제외)(감액없음)(맞춤고지) 3천만원 20,000 37.0 20년/90세',
  '49 유사암진단비(감액없음)(맞춤고지) 6백만원 900 1.7 20년/90세',
  '89 뇌혈관질환진단비(감액없음)(맞춤고지) 1천만원 6,000 11.1 20년/90세',
  '93 심장질환(특정I)진단비(감액없음)(맞춤고지) 1천만원 5,500 10.2 20년/90세',
  '275 상해1~5종수술비(매회지급)_5종(맞춤고지) 1천만원 16 0.0 20년/80세',
  '276 상해1~5종수술비(매회지급)_4종(맞춤고지) 5백만원 40 0.1 20년/80세',
  '277 상해1~5종수술비(매회지급)_3종(맞춤고지) 2백만원 380 0.7 20년/80세',
  '363 암(유사암제외) 주요치료비II(종합병원,각 연간1회한)(맞춤고지) 1천만원 8,700 16.1 20년/80세',
  '371 비급여(전액본인부담 포함) 암 주요치료비Plus(종합병원)(맞춤고지) 1천만원 6,750 12.5 20년/80세'];
const PDOC = (rows) => doc(['KB금융그룹 · KB 5.10.10 Young 플러스 건강보험(무배당)(26.07)_세만기 해약환급금 미지급형(25270)',
  '홍길동 고객님을 위한 상품제안서', '계약자 : 홍길동', '(대표)피보험자 : 홍길동 (보험나이변경일 : 2027-05-12)', '청약번호 : RQ00-00000000 | 보험료 : 54,000원',
  'KB손해보험 고객콜센터 1544-0114 www.kbinsure.co.kr',
  '계약사항 20년납 90세만기 | 세만기 | 건강고지형(10년) | 해약환급금50%지급형(납입후)',
  '홍길동 피보험자님의 가입내용 (35세|여|1급|사무직)',
  '보장명 가입금액 보험료(원) 보험료비중(%) 납입|보험기간'].concat(rows).concat([
  '*보험료비중: 전체보장보험료 중 해당보장보험료의 비중',
  '상품제안서_가입설계(계약자용)', '보장명 및 보장내용 가입금액 보험료(원) 납입|보험기간',
  '1 [기본계약]일반상해사망(맞춤고지)', '보험기간중 상해의 직접결과로써 사망시 1억원 3,000 20년/90세',
  '3 [기본계약]일반상해후유장해(3~100%)(맞춤고지)', '보험기간중 상해로 장해분류표에서 정한 3~100% 장해지급률에 해당하는 상태가 되 1억원 2,680 20년/90세',
  '5 [2종의무부가특약]보험료납입면제대상보장(12대)(맞춤고지)', '보험기간중 아래사항 중 어느 한가지의 경우에 해당되는 때에 이 특별약관의 보험',
  '가입금액을 보험료납입면제대상보장(12대) 보험금으로 지급 (최초1회한)',
  '1. 일반상해50%이상후유장해시', '2. 질병50%이상후유장해시',
  '3. 암보장개시일(계약일로부터 그날을 포함하여 90일이 지난날의 다음날, 계약일', '현재 보험나이 15세미만의 경우 계약일) 이후에 암(유사암 제외)으로 진단확정된 경우',
  '4. 뇌혈관질환으로 진단확정된 경우 10만원 34 20년/20년', '5. 허혈성심장질환으로 진단확정된 경우',
  '※ 보험료납입면제대상보장(12대) 보험금은 중복하여 지급하지 않음',
  '보험기간중 상해로 장해분류표에서 정한 장해지급률을 보험가입금액에 곱한 금액을 지급',
  '※ 심장질환(특정Ⅰ) : 협심증, 기타 급성 허혈심장질환, 달리 BRE 질환에서의 심장막염,', '심방세동 및 조동, 심부전',
  '44 암진단비(유사암 제외)(감액없음)(맞춤고지)', '보험기간중 암보장개시일(계약일로부터 그날을 포함 90일이 지난날의 다음날, 계 3천만원 20,000 20년/90세',
  '상해담보 가입시, 이륜자동차를 운전(탑승 포함)하는 중에 발생한 상해사고로 보험금 지급사유가 발생한 경우',
  '가. 무사고 할인 2) 할인조건 및 할인율 : 무사고시 계약자가 무사고 할인을 신청한 경우에 한하여 보장부분 영업보험료의 5%를 할인합니다',
  '나. 장기유지 할인', '대상 납입회차 (월납 기준) : 37회차 ~ 120회차 → 할인율 : 1%', '대상 납입회차 (월납 기준) : 121회차 ~ 납입완료 시까지 → 할인율 : 2%',
  '(예: 10년납 가입 시 61회차~120회차까지 1% 할인 후 납입 완료)',
  '상품제안서_요약해약환급금예시(계약자용)', '경과기간 납입보험료 예상환급금 예상환급률',
  '3개월 162,000 0 0.0 %', '1년(36세) 648,000 0 0.0 %', '10년(45세) 6,480,000 0 0.0 %', '15년(50세) 9,720,001 0 0.0 %',
  '20년(55세) 12,960,000 6,739,200 52.0 %', '25년(60세) 12,960,000 9,999,999 56.9 %',
  '30년(65세) 12,960,000 7,983,360 61.6 %', '만기(90세) 12,960,000 0 0.0 %',
  '※ 이 상품은 순수보장형상품으로 만기환급금이 발생하지 않습니다.']));
/* 그림 제안서를 3배로 글자 인식한 줄 모양(실제 KB 제안서 · 담보 표 줄만 — 이름 · 청약번호 줄은 옮기지 않았다) */
const OCR = ['KB 5.10.10 Young 플러스 건강보험(무배당)(26.07)_세만기 해약환급금 미지급령(25270)',
  '보험료 94.812원', "'20년납 90세만기 | 세만기 | 건강고지형(10년)ㅣ|", '피보험자님의 가입내용 (19세|남|1급|대학(원)생)',
  '1 [기본계약]일반상해사망(맞춤고지)                    3억원       10,500            11.1        20년/90세',
  '3 [기본계약]일반상해후유장해(3~10096)(맞춤고지)       3억원       9,300           9.3      20년/90세',
  '4 [기본계약]일반상해후유장해(20~100%)(맞춤고지)       1백만원          14            0.0       20년/90세',
  '5 [2종의무부가특약]보험료납입면제대상보장(12대)(맞춤고지)   10만원        34         0.0     20년/20년',
  '44 암진단비(유사암 제외)(감액없음)(맞춤고지)     5천만원        27.650               29.2         203/904',
  '49 유사맘진단비(감액없음)}(맞춤고지)           1천만원           1,380                  1.5           20년/90세',
  '89 뇌혈관질환진단비(감액없음)(맞춤고지)        2천만원       9,540          10.1       20년/90세',
  '93 심장질환(특정 | )진단비(감액없음)(맞춤고지)     2천만원      11,280          11.9      20년/90세',
  '95 심장질환(특정 ㅣ| )진단비(감액없음)(맞춤고지)    2천만뭔         2,830               3.0        20년/90세',
  '275 상해1~5종수술비(매회지급) 5종(맞춤고지)      1천만원         16          0.0      20년/80세',
  '276 상해1~5종수술비(매회지급) 4종(맞춤고지)      5백만원              40                0.0         20년/80세',
  '277 상해1 ~5종수술비(매회지급) 3종(맞춤고지)     2백만원             380                 0.4          20년/80세',
  '278 상해1~5종수술비(매회지급) 2종(맞춤고지)      50만원        785           0.8      20년/80세',
  '279 상해1~5종수술비(매회지급) 1종(맞춤고지)      20만원            426                0.4         20년/80세',
  '300 항암방사선약물치료비(맞춤고지)             1백만뭔               347                    0.4           20년/90세',
  '312 항암중입자방사선치료비(최초1회한)(감액없음)(맞춤고지)   5천만뭔      1.400          1.5      20년/90세',
  '363 암(유사암제외) 주요치료비 || (종합병원,각 면간1회한)(맞춤고지)    1천만원        8,700              9.2        20년/80세',
  '364 유사암 주요치료비! (증합병뭔.각 면간1회한)(맞춤고지)       5백만원           500               0.5         20년/80세',
  '371 비급여(전액본인부담 포함) oF 주요치료비미45(종합병원)(맞춤고지)     1천만뭔      4,030           4.3      20년/80세',
  '373 비급며(전액본민부담 포한) of 주묘치료비미45(상급공한병원)(맞춤고지)   2천만원         5,660               6.0        20년/80세',
  '20년(39세)                                    22,754,880                                  11,834,055                     520%',
  '25 (44M)                                    22,754,880                                  12,957,095                     56.9 %',
  '60 (79M)                         22,754,880                         8,431,081               37.1%',
  '만기(90세)                                    22, 754,880                                             0                     0.0 %'].join('\n');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'baex-'));
  const mk = await br.newPage(), B64 = {};
  const bad1 = ROWS.map(r => r.replace(' 6,750 ', ' 6,705 '));     /* 45원 어긋난 제안서 */
  for (const [k, h] of [['ok', PDOC(ROWS)], ['off', PDOC(bad1)]]) { const f = path.join(tmp, k + '.pdf'); await mk.setContent(h); await mk.pdf({ path: f, format: 'A4' }); B64[k] = fs.readFileSync(f).toString('base64'); }
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
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.who.name = ''; save(); go('edit'); });
  const feed = (k) => pg.evaluate(async ([b64, nm]) => {
    baExClose(); S.bx = null;
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i);
    baExRead(new File([u], nm, { type: 'application/pdf' }));
    for (let i = 0; i < 100 && !document.getElementById('bxo'); i++) await new Promise(r => setTimeout(r, 100));
    const B = S.bx, f = document.getElementById('bxf');
    return { B: B ? JSON.parse(JSON.stringify(B)) : null, C: B ? baExCheck(B) : null, deck: !!f, edit: !!document.querySelector('.bxo-ed'),
      top: (document.querySelector('.bxe-top') || {}).textContent || '', bar: (document.querySelector('.bxo-bar') || {}).textContent || '' };
  }, [B64[k], k + '.pdf']);

  head('[1] 글자 PDF — 담보 표를 줄 통째로 · 납입면제 줄도 · 같은 표가 또 찍혀도 한 번');
  const A = await feed('ok');
  const nms = A.B ? A.B.rows.map(r => r.nm) : [];
  is(A.B && A.B.rows.length === 12, '담보 12줄을 읽었다 — ' + nms.length + '줄 (가입설계 쪽에 설명 문장과 같이 또 찍힌 줄은 안 셈)');
  is(nms.indexOf('보험료납입면제대상보장(12대)') >= 0, '「보험료납입면제대상보장(12대)」 줄을 담보로 읽는다 — 이름에 「보험료」 가 들어 있다고 버리지 않는다');
  is(A.B && A.B.rows.every(r => r.premWon > 0 && /^\d+년\/(\d+세|\d+년)$/.test(r.per)), '줄마다 보험료(원) · 납입/만기를 같이 읽는다');
  is(A.B && A.B.rows[0].man === 10000 && A.B.rows[3].man === 3000 && A.B.rows[2].man === 10, '가입금액 단위 — 1억원 = 10,000만 · 3천만원 = 3,000만 · 10만원 = 10만 (만원으로 담는다 · 4번)');
  is(A.B && A.B.age === 35 && A.B.sex === '여' && A.B.years === 20 && A.B.term === '90세만기', '나이 35 · 여 · 20년납 · 90세만기 — ' + (A.B && [A.B.age, A.B.sex, A.B.years, A.B.term].join(' · ')));

  head('[2] ★ 합계가 원 단위까지 맞으면 — 고치기 없이 바로 설명서');
  is(A.C && A.C.ok === true && A.C.sum === 54000 && A.B.totWon === 54000, '줄 합계 54,000원 = 제안서 보험료 54,000원 — ' + (A.C && A.C.why));
  is(A.deck && !A.edit, '설명서(iframe)가 바로 선다 · 고치기 표가 앞을 막지 않는다');
  is(/보험료 합계 맞음/.test(A.bar), '위 띠에 「✓ 보험료 합계 맞음」');

  const D = await pg.evaluate(() => baExDoc(S.bx));
  const fr = pg.frame({ url: /about:srcdoc/ }) || pg.frames()[1];
  await fr.waitForFunction(() => window.SL && SL.length > 3, null, { timeout: 8000 }).catch(() => {});

  head('[4] 설명서 숫자 — 제안서 숫자 그대로');
  const cov = await fr.evaluate(() => document.querySelector('.sl').textContent);
  is(/54,000원/.test(cov), '표지에 월 보험료 54,000원');
  is(D.indexOf('36,350') >= 0 && D.indexOf('67.3%') >= 0, '암 묶음 = 20,000 + 900 + 8,700 + 6,750 = 36,350원 · 67.3%');
  is(D.indexOf('보험료의&nbsp;<em>') >= 0 && /<em>67\.3%는 암<\/em>/.test(D), '01 장 화법 — 「보험료의 67.3%는 암」 (말로 못 바꾸는 비중은 숫자 그대로 · 은/는 맞춰)');
  is(/12,960,000/.test(D), '다 내면 총 12,960,000원 (54,000원 × 240회)');

  head('[5] 해약환급금 — 표에서 읽은 줄만 · 안 맞는 줄은 안 그린다');
  const RF = A.B ? A.B.refund : [];
  is(RF.length === 6, '맞는 줄 6개 — ' + RF.map(r => r.lb + ' ' + r.pct + '%').join(' · '));
  is(!RF.some(r => r.paidWon === 9720001), '「15년(50세) 9,720,001」 — 낸 돈이 월 보험료 × 개월이 아닌 줄은 버린다');
  is(!RF.some(r => r.refWon === 9999999), '「25년(60세) 9,999,999 · 56.9%」 — 환급률이 안 맞는 줄은 버린다(잘못 읽은 줄을 그리지 않는다)');
  is(D.indexOf('납입 중 해지 — 0원') >= 0 && /해약환급금 미지급형/.test(D), '납입 20년 안 환급 0원 → 「납입 중 해지 — 0원」 · 제안서에 「해약환급금 미지급」 이 있어 그 이름을 쓴다');
  is(D.indexOf('사이는 메우지 않았습니다') >= 0, '읽은 줄만 그렸다고 장에 밝힌다');

  head('[6] 납입면제 조건 — 번호 차례 · 꺾인 줄 잇기 · 짧은 괄호는 남김');
  const WV = A.B ? A.B.wv : [];
  is(WV.length === 5 && WV[2] === '암(유사암 제외)', '다섯 줄 · 3번이 「암(유사암 제외)」 — ' + JSON.stringify(WV));
  is(WV[3] === '뇌혈관질환', '4번 줄 옆에 찍힌 표 숫자(10만원 34 …)를 조건에 안 붙인다 — ' + WV[3]);

  head('[10] 원래 판의 그림 — 암 흐름 · 병명 칩 · 장해 막대 · 수술 계단 · 할인');
  const sec = (t) => { const m = D.match(new RegExp('<section class="sl[^"]*" data-t="' + t + '">([\\s\\S]*?)</section>')); return m ? m[1] : ''; };
  const can = sec('암'), cv = sec('뇌 · 심장'), acc = sec('다쳤을 때'), dc = sec('할인');
  is(/class="flow"/.test(can) && /진단 확정/.test(can) && /다음 해에도/.test(can) && /가입 후 90일이 지난 뒤부터/.test(can), '암 — 진단 확정 → … → 다음 해에도 흐름 · 「90일」 은 제안서에 그 말이 있어서');
  is(/<span>협심증<\/span>/.test(cv) && /<span>심부전<\/span>/.test(cv) && !/BRE/.test(cv) && /제안서 문구 중 일부/.test(cv), '뇌심장 — 제안서 「※ 심장질환(특정Ⅰ) :」 의 병명이 칩으로(꺾인 줄 이어서) · 깨진 「BRE」 는 버리고 「일부」 라고 밝힘');
  is(/심장질환\(특정Ⅰ\)/.test(cv), '짧은 이름에서 「(특정Ⅰ)」 를 걷지 않는다 — Ⅰ · Ⅱ 는 다른 담보');
  is(/1억원 × 장해지급률/.test(acc) && /5,000만원/.test(acc), '다쳤을 때 — 「장해지급률을 … 곱한」 문구가 있어 장해율 막대(1억 × 50% = 5,000만원)');
  is(/>3종</.test(acc) && />5종</.test(acc), '1~5종 수술 계단 — 3 · 4 · 5종');
  is(/무사고 할인/.test(dc) && /월 약 2,700원/.test(dc) && /1% · 월 약 540원/.test(dc) && /2% · 월 약 1,080원/.test(dc) && /신청해야/.test(dc), '할인 장 — 5% · 1% · 2% (54,000원 × 할인율의 어림값) · 「신청해야」 는 제안서에 그 말이 있어서');
  is((dc.match(/회차 ~/g) || []).length === 2, '「예: 10년납 가입 시 …」 줄은 할인 구간으로 세지 않는다');
  is(D.indexOf('담보 전체') < 0, '원래 판에 없던 「담보 전체」 표 장은 설명서에서 뺐다(표는 「고치기」 에)');

  head('[7] 이름 — 제안서 이름은 안 싣고, 전·후 칸 이름은 가린다(3번)');
  is(D.indexOf('홍길동') < 0 && /고객님/.test(D), '설명서에 「홍길동」 이 한 번도 없다 · 「고객님」');
  const D2 = await pg.evaluate(() => { S.who.name = '홍길동'; const d = baExDoc(S.bx); S.who.name = ''; return d; });
  is(D2.indexOf('홍길동') < 0 && D2.indexOf('홍○○ 님') >= 0, '전·후 칸에 「홍길동」 이 적혀 있어도 「홍○○ 님」 으로 선다');

  head('[9] 장마다 넘치지 않나 · tnum 은 화면에서만 · 44px · 파일 한 벌');
  const n = await fr.evaluate('SL.length'), over = [];
  for (let i = 0; i < n; i++) {
    await fr.evaluate(i => show(i), i);
    const o = await fr.evaluate(() => { const s = document.querySelector('.sl.on'), R = s.getBoundingClientRect(), out = [];
      s.querySelectorAll('*').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.height && (r.bottom > R.bottom + 1 || r.right > R.right + 1)) out.push(e.tagName); });
      const say = s.querySelector('.say'), body = s.querySelector('.body');
      if (say && body) [...body.querySelectorAll('.card,.note,table,svg')].forEach(c => { if (c.getBoundingClientRect().bottom > say.getBoundingClientRect().top + 1) out.push('화법 띠를 덮음'); });
      [...s.querySelectorAll('.card')].forEach(c => { if (c.scrollHeight > c.clientHeight + 2) out.push('카드 잘림'); });
      return out.length ? s.dataset.t + ':' + out[0] : ''; });
    if (o) over.push(o);
  }
  is(n >= 10 && !over.length, '장 ' + n + '개 — 넘치거나 잘린 장 ' + over.length + '개 ' + over.join(' '));
  is(/@media screen\{[^}]*tnum/.test(D) && (D.match(/tnum/g) || []).length === 1, 'tnum 은 @media screen 안 한 곳뿐 — 뽑은 PDF 숫자가 안 깨진다(4-1)');
  is(/^<!doctype html>/.test(D) && /@media print\{@page\{size:1280px 720px/.test(D), '파일로 저장하면 문서 한 벌 · 인쇄는 한 장에 한 쪽');
  const tap = await pg.evaluate(() => [...document.querySelectorAll('.bxo-bar button')].map(b => b.getBoundingClientRect().height).filter(h => h < 44).length);
  is(tap === 0, '위 띠 단추가 모두 44px 이상 — 모자란 것 ' + tap);
  const navTap = await fr.evaluate(() => [...document.querySelectorAll('#bar button')].map(b => b.getBoundingClientRect().height).filter(h => h < 44).length);
  is(navTap === 0, '설명서 넘김 단추 44px 이상');

  head('[3] ★ 하나라도 틀리면 — 설명서보다 고치기가 먼저');
  const O = await feed('off');
  is(O.C && O.C.ok === false && O.C.sum === 53955, '줄 합계 53,955원 ≠ 54,000원 — ' + (O.C && O.C.why));
  is(O.edit && !O.deck, '설명서 대신 「읽은 값 고치기」 표가 먼저 선다');
  is(/차이 45원/.test(O.top), '얼마가 어긋났는지 원으로 말한다 — 「차이 45원」');
  const Dw = await pg.evaluate(() => baExDoc(S.bx));
  is(/class="warn"/.test(Dw), '그래도 설명서를 열면 표지에 ⚠ 「맞춰 본 뒤 보여 드리세요」 가 선다(숨기지 않는다)');
  const fix = await pg.evaluate(() => { const i = S.bx.rows.findIndex(r => r.premWon === 6705); baExSet(i, 'premWon', '6750'); return { C: baExCheck(S.bx), sum: document.getElementById('bxSum').textContent }; });
  is(fix.C.ok === true && /제안서 보험료 ✓/.test(fix.sum), '고치기 표에서 6,705 → 6,750 으로 고치면 바로 「= 제안서 보험료 ✓」');
  await pg.evaluate(() => baExOpen('deck'));
  is(await pg.evaluate(() => !!document.getElementById('bxf') && /합계 맞음/.test(document.querySelector('.bxo-bar').textContent)), '「🎞 설명서」 로 넘어가면 맞음으로 선다');

  head('[8] 그림 제안서(글자 인식) 줄 모양 — 고쳐 읽고 합계가 맞나');
  const G = await pg.evaluate((t) => { const B = baExFrom(t, 'scan.pdf', true); return { B: JSON.parse(JSON.stringify(B)), C: baExCheck(B) }; }, OCR);
  const gn = G.B.rows.map(r => r.nm);
  is(G.B.rows.length === 20 && G.C.ok === true && G.C.sum === 94812, '담보 20줄 · 줄 합계 94,812원 = 「보험료 94.812원」(점도 쉼표로) — ' + G.C.why);
  is(G.B.rows.find(r => /중입자/.test(r.nm)).premWon === 1400 && G.B.rows.find(r => /^암진단비/.test(r.nm)).premWon === 27650, '「1.400」 → 1,400 · 「27.650」 → 27,650');
  is(gn.indexOf('유사암진단비') >= 0 && gn.some(n => /연간1회한/.test(n)) && gn.some(n => /암 주요치료비Plus\(상급종합병원\)/.test(n)), '「유사맘 · 면간 · oF 주요치료비미45 · 상급공한병원」 → 유사암 · 연간 · 암 주요치료비Plus · 상급종합병원');
  is(gn.indexOf('심장질환(특정Ⅰ)진단비') >= 0 && gn.indexOf('심장질환(특정Ⅱ)진단비') >= 0, '「특정 | 」 → 특정Ⅰ · 「특정 ㅣ| 」 → 특정Ⅱ');
  is(G.B.rows.find(r => /^암진단비/.test(r.nm)).per === '', '「203/904」 처럼 못 읽은 납입/만기는 <비워 둔다> — 짐작해 채우지 않는다(1번)');
  const accG = await pg.evaluate((t) => { const B = baExFrom(t, 'scan.pdf', true), d = baExDoc(B), m = d.match(/data-t="다쳤을 때">([\s\S]*?)<\/section>/); return m ? m[1] : ''; }, OCR);
  is(accG && !/× 장해지급률/.test(accG) && />5종</.test(accG), '「장해지급률을 … 곱한」 문구가 없는 제안서에는 장해율 막대를 안 그린다(셈을 지어내지 않음) · 수술 계단은 선다');
  is(G.B.refund.some(r => r.age === 39 && r.pct === 52) && G.B.refund.some(r => r.age === 44) && G.B.refund.some(r => /만기/.test(r.lb)),
    '해약환급금 「520%」 → 52.0% (환급률로 맞춰 봄) · 「25 (44M)」 → 44세 · 「22, 754,880」 → 22,754,880 — ' + G.B.refund.map(r => r.lb).join(' · '));

  head('[0] 이 화면에서 오류가 안 났나');
  is(!errs.length, '페이지 오류 ' + errs.length + '건 ' + errs.join(' | '));

  await br.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '가지가 어긋났습니다') : '\n✓ 제안서 → 설명서 — 바로 서고, 틀린 숫자로는 안 섭니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
