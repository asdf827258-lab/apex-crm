/* ════════════════════════════════════════════════════════════════════════
   공개 지연 시세가 조용히 틀린 숫자를 내보내지 않는가

     node scripts/check-public-quote.js

   여기 있는 검사는 전부 '고치기 전에는 실패했던' 것들이다. 네트워크를 타지
   않는다 — 실제 응답에서 뜬 값을 그대로 박아 두고 판정과 계산만 본다.

   ① 없는 티커를 물어도 404 가 아니라 '비슷한 것' 을 만들어 돌려준다
      에코프로비엠(코스닥 247540)을 247540.KS 로 물었더니 200 에 meta.symbol
      까지 '247540.KS' 로 맞춰서 왔다. 내용은 다른 종목이었다.
      현재가 194000(실제 116700) — 그대로 믿었으면 화면에 남의 값이 찍혔다.

   ② 전일 종가를 chartPreviousClose 에서 가져오면 안 된다
      그건 '요청한 구간이 시작되기 전' 의 종가다. range=5d 로 부르면 닷새 전
      값이라, 삼성전자가 +18.83% · 코스피가 +11.49% 로 찍혔다.
   ════════════════════════════════════════════════════════════════════════ */

const { _pub } = require('../netlify/functions/market.js');

let pass = 0, fail = 0;
function ok(name, cond, got) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (got === undefined ? '' : '  → ' + JSON.stringify(got))); }
}
function near(a, b) { return a != null && b != null && Math.abs(a - b) < 0.011; }

console.log('\n① 내가 물은 그 종목이 맞는가');

/* 실제로 247540.KS 가 돌려준 값 */
ok('코드를 펀드로 되돌려주면 거른다',
   _pub.looksReal({ instrumentType: 'MUTUALFUND', longName: '247540.KS,0P0001GZPV,623889' }) === false);
ok('이름이 코드 나열이면 거른다',
   _pub.looksReal({ instrumentType: 'EQUITY', longName: '247540.KS,0P0001GZPV,623889' }) === false);
ok('이름이 비어 있으면 거른다',
   _pub.looksReal({ instrumentType: 'EQUITY', longName: '', shortName: '' }) === false);

/* 실제로 통과해야 하는 것들 */
ok('주식은 통과 (삼성전자)',
   _pub.looksReal({ instrumentType: 'EQUITY', longName: 'Samsung Electronics Co., Ltd.' }) === true);
ok('ETF 는 통과 (KODEX 200)',
   _pub.looksReal({ instrumentType: 'ETF', longName: 'KODEX 200' }) === true);
ok('지수는 통과 (코스피)',
   _pub.looksReal({ instrumentType: 'INDEX', longName: 'KOSPI Composite Index' }) === true);
ok('쉼표가 있어도 6자리 코드가 없으면 이름으로 인정',
   _pub.looksReal({ instrumentType: 'EQUITY', longName: 'Samsung Electronics Co., Ltd.' }) === true);

console.log('\n② 등락률을 봉에서 직접 계산하는가');

/* 삼성전자 5일 종가 — chartPreviousClose 는 닷새 전(231000) 값이다 */
const 삼성 = _pub.shape(
  { meta: { currency: 'KRW', longName: 'Samsung Electronics Co., Ltd.', chartPreviousClose: 231000 },
    closes: [230000, 239500, 255500, 268000, 274500] }, '005930', 'KRX', 'KRW');
ok('현재가는 마지막 봉', 삼성.price === 274500, 삼성.price);
ok('전일 종가는 그 앞 봉(268000). 닷새 전 231000 이 아니다', 삼성.prevClose === 268000, 삼성.prevClose);
ok('등락률 +2.43% (고치기 전 +18.83%)', near(삼성.changeRate, 2.43), 삼성.changeRate);
ok('지연 표시가 붙는다', 삼성.delayed === true);

/* 코스피 — 같은 함정 */
const 코스피 = _pub.shape(
  { meta: { currency: 'KRW', longName: 'KOSPI Composite Index', chartPreviousClose: 6258.0 },
    closes: [6299.66, 6345.53, 6579.04, 6813.34, 6977.94] }, '0001', 'KRX', 'KRW');
ok('코스피 +2.42% (고치기 전 +11.49%)', near(코스피.changeRate, 2.42), 코스피.changeRate);

console.log('\n③ 봉이 하나뿐일 때만 chartPreviousClose 를 쓴다');

/* 코스피200 은 5일을 물어도 봉을 하나만 준다 */
const 코스피200 = _pub.shape(
  { meta: { currency: 'KRW', longName: 'KOSPI 200 Index', chartPreviousClose: 1071.24 },
    closes: [1098.18] }, '2001', 'KRX', 'KRW');
ok('봉이 하나면 chartPreviousClose 가 곧 전일 종가', 코스피200.prevClose === 1071.24, 코스피200.prevClose);
ok('코스피200 +2.51% — 코스피 +2.42% 와 앞뒤가 맞는다', near(코스피200.changeRate, 2.51), 코스피200.changeRate);

const 봉없음 = _pub.shape(
  { meta: { currency: 'KRW', longName: 'X', chartPreviousClose: 100, regularMarketPrice: 110 }, closes: [] },
  'X', 'KRX', 'KRW');
ok('봉이 없으면 등락률을 지어내지 않는다', 봉없음.changeRate === null, 봉없음.changeRate);
ok('봉이 없어도 현재가는 meta 에서 살린다', 봉없음.price === 110, 봉없음.price);

console.log('\n③\' 빈 봉을 건너뛰어 남의 날짜를 전일로 삼지 않는가');

/* ⚠️ 실제로 겪은 것. 코스닥 5일치를 연달아 부르면 08-18 자리가 있다가 없다가
      했다. 예전 코드는 null 을 지우고 배열을 당겨서, 빠진 날이 흔적 없이
      사라지고 08-14 종가가 '전일' 이 됐다. 화면 맨 위 숫자가 새로고침마다
      +0.26% ↔ −3.28% 로 널뛰었다 — 현재가는 그대로인데. */
const 코스닥정상 = _pub.shape(
  { meta: { currency: 'KRW', longName: 'KOSDAQ Composite Index', chartPreviousClose: 857.84 },
    closes: [858.91, 861.37, 864.65, 834.20, 836.25] }, '1001', 'KRX', 'KRW');
ok('전일은 바로 앞 봉(834.20)', 코스닥정상.prevClose === 834.2, 코스닥정상.prevClose);
ok('코스닥 +0.25%', near(코스닥정상.changeRate, 0.25), 코스닥정상.changeRate);

const 코스닥빈봉 = _pub.shape(
  { meta: { currency: 'KRW', longName: 'KOSDAQ Composite Index', chartPreviousClose: 857.84 },
    closes: [858.91, 861.37, 864.65, null, 836.25] }, '1001', 'KRX', 'KRW');
ok('앞 봉이 비면 나흘 전(864.65)으로 넘어가지 않는다',
   코스닥빈봉.prevClose !== 864.65, 코스닥빈봉.prevClose);
ok('앞 봉이 비면 등락률을 비운다 (−3.28% 를 찍지 않는다)',
   코스닥빈봉.changeRate === null, 코스닥빈봉.changeRate);
ok('현재가는 그대로 살린다', 코스닥빈봉.price === 836.25, 코스닥빈봉.price);
ok('왜 비었는지 남긴다', /전일 종가/.test(코스닥빈봉.approx || ''), 코스닥빈봉.approx);

/* 봉이 하나뿐이라 chartPreviousClose 를 쓸 때는 '대략값' 이라고 밝힌다.
   ⚠️ 그 값은 부를 때마다 달라진다 — ^KS200 에서 1082.0 과 1080.36 을 봤다. */
ok('봉이 하나면 대략값이라고 표시한다', /대략값/.test(코스피200.approx || ''), 코스피200.approx);
ok('봉이 둘 이상이면 그런 표시가 없다', !코스피.approx, 코스피.approx);

console.log('\n④ 소수점이 흘러넘치지 않는가');

const 애플 = _pub.shape(
  { meta: { currency: 'USD', longName: 'Apple Inc.' },
    closes: [305.260009765625, 305.9300537109375] }, 'AAPL', 'NAS', 'USD');
ok('전일 종가를 305.26 으로 자른다', 애플.prevClose === 305.26, 애플.prevClose);
ok('현재가를 305.93 으로 자른다', 애플.price === 305.93, 애플.price);

console.log('\n' + (fail ? '❌' : '✅') + '  ' + pass + ' 통과 · ' + fail + ' 실패\n');
process.exit(fail ? 1 : 0);
