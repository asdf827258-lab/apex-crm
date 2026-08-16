/* 시세 서버(/api/market)를 실제로 불러 본다 — 인터넷 없이.

   이 함수는 돈 이야기를 화면에 띄우는 근거다. 틀린 숫자가 올라가거나,
   키가 없을 때 화면이 죽거나, 키가 멀쩡한데 "키가 틀렸다"고 안내하면
   설계사가 고객 앞에서 곤란해진다. 그래서 여기서 다 확인한다.

   토스·한국투자증권·한국은행은 가짜로 답하게 한다. 실제로 부르지 않는다. */

const FN = require('path').join(process.cwd(), 'netlify/functions/market.js');
const CFG = require('path').join(process.cwd(), 'config/market.json');

const fail = [];
const ok = (c, m) => { if (!c) { fail.push(m); console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };

/* 매 시나리오마다 함수를 새로 읽는다 — 토큰 캐시가 섞이지 않게 */
function freshModule() {
  delete require.cache[FN];
  return require(FN);
}
function call(m, params, headers) {
  return m.handler({ httpMethod: 'GET', headers: headers || {}, queryStringParameters: params })
    .then(r => ({ status: r.statusCode, body: JSON.parse(r.body || '{}') }));
}
function clearKeys() {
  /* ⚠️ 새 환경변수를 추가하면 여기에도 넣어야 한다. 안 넣으면 앞 시나리오의 키가
     다음 시나리오까지 살아남아 엉뚱한 제공자가 붙고, 테스트가 거짓 통과한다. */
  ['TOSS_CLIENT_ID', 'TOSS_CLIENT_SECRET', 'KIS_APP_KEY', 'KIS_APP_SECRET',
    'DATA_GO_KR_KEY', 'ECOS_API_KEY', 'FUND_API_URL', 'FUND_API_KEY',
    'SHARED_TOKEN'].forEach(k => delete process.env[k]);
}
function resetTossCfg() {
  const c = require(CFG).providers.toss;
  c.base = ''; c.token_path = ''; c.token_style = 'form'; c.paths.quote = '';
  c.field_map = { root: '', name: 'name', price: 'close', change: 'change', change_rate: 'changeRate', prev_close: 'base', volume: 'volume' };
}
const R = (json, opts) => Promise.resolve({
  ok: (opts && opts.ok) !== false, status: (opts && opts.status) || 200,
  json: () => Promise.resolve(json), text: () => Promise.resolve(JSON.stringify(json))
});

(async () => {
  /* ══ 1) 키가 하나도 없을 때 — 500 을 내면 안 된다 ══════════════════ */
  console.log('\n[1] 키가 하나도 없을 때');
  clearKeys(); resetTossCfg();
  global.fetch = () => { throw new Error('여기서는 아무 데도 부르면 안 된다'); };
  let m = freshModule();

  let r = await call(m, { kind: 'health' });
  ok(r.status === 200, 'health 가 200 을 준다 (키가 없어도 서버는 안 죽는다)');
  ok(r.body.quoteProvider === 'none', '시세 제공자 없음으로 정확히 보고한다');
  ok(r.body.has.toss === false && r.body.has.kis === false, '토스·KIS 둘 다 없음으로 잡힌다');
  ok(/TOSS_CLIENT_ID/.test(r.body.tossMessage), '토스에 무엇이 빠졌는지 알려 준다');
  ok(r.body.deeplink && r.body.deeplink.krx.indexOf('tossinvest.com/stocks/A{code}') > 0,
    '키가 없어도 토스 딥링크 주소는 내려준다');

  r = await call(m, { kind: 'quote', codes: '005930' });
  ok(r.status === 200 && r.body.ok === false, '시세 요청도 200 (앱이 안내 카드를 그릴 수 있다)');
  ok(r.body.need.length === 5 && r.body.need[0] === 'DATA_GO_KR_KEY',
    '켤 수 있는 길 세 가지를 함께 알려 주고, 가장 빨리 되는 것을 앞에 둔다 (' + r.body.need.join(',') + ')');

  r = await call(m, { kind: 'toss-probe' });
  /* 개수만 세던 줄이었다. 시세 경로(paths.quote)를 토큰 발급 뒤로 미루면서
     막는 항목이 5개에서 4개로 줄었는데 이 줄이 옛 숫자 5를 계속 봐서
     main 이 빨간불이었다. 숫자 대신 「무엇을」 짚는지를 본다. */
  const miss = function (re) { return r.body.missing.some(function (x) { return re.test(x); }); };
  ok(r.body.step === 'config'
    && miss(/TOSS_CLIENT_ID/) && miss(/TOSS_CLIENT_SECRET/)
    && miss(/providers\.toss\.base/) && miss(/token_path/),
    '토큰 발급에 필요한 것을 이름으로 전부 짚어 준다 (' + r.body.missing.length + '개)');
  ok(!miss(/paths\.quote/),
    '시세 경로는 토큰이 나온 뒤에야 확인할 수 있어 여기서 막지 않는다');

  r = await call(m, { kind: 'nope' });
  ok(r.body.ok === false, '모르는 kind 는 거절한다');

  const pre = await m.handler({ httpMethod: 'OPTIONS', headers: {}, queryStringParameters: {} });
  ok(pre.statusCode === 204, 'CORS 사전요청(OPTIONS)에 답한다');

  /* ══ 2) 토스증권이 1순위로 붙는가 ══════════════════════════════════ */
  console.log('\n[2] 토스증권 오픈API 설정됨');
  clearKeys();
  process.env.TOSS_CLIENT_ID = 'cid'; process.env.TOSS_CLIENT_SECRET = 'csec';
  process.env.KIS_APP_KEY = 'kk'; process.env.KIS_APP_SECRET = 'ks';
  const t = require(CFG).providers.toss;
  t.base = 'https://openapi.toss.test'; t.token_path = '/oauth2/token'; t.token_style = 'form';
  t.paths.quote = '/v1/quotes/{code}';
  t.field_map = { root: 'data', name: 'name', price: 'close', change: 'change', change_rate: 'changeRate', prev_close: 'base', volume: 'volume' };

  const seen = [];
  let tossTokenCalls = 0, tossQuoteFails = false;
  global.fetch = (u, o) => {
    const s = String(u); seen.push(s);
    if (s.indexOf('koreainvestment') >= 0 && s.indexOf('tokenP') >= 0) return R({ access_token: 'K', expires_in: 86400 });
    if (s.indexOf('inquire-price') >= 0) return R({ rt_cd: '0', output: { hts_kor_isnm: 'SK하이닉스', stck_prpr: '59500', prdy_ctrt: '-0.8' } });
    if (s.indexOf('inquire-index-price') >= 0) return R({ rt_cd: '0', output: { bstp_nmix_prpr: '2765.43', bstp_nmix_prdy_vrss: '12.1', prdy_ctrt: '0.44' } });
    if (s.indexOf('openapi.toss.test/oauth2/token') >= 0) {
      tossTokenCalls++;
      if ((o.headers || {})['Content-Type'] !== 'application/x-www-form-urlencoded') return R({ error: 'wrong content-type' }, { ok: false, status: 400 });
      return new Promise(res => setTimeout(() => res({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ access_token: 'TT', expires_in: 3600 })) }), 20));
    }
    if (s.indexOf('/v1/quotes/') >= 0) {
      if (tossQuoteFails) return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('{"error":"boom"}') });
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { name: '삼성전자', close: 84000, change: 1000, changeRate: 1.2, base: 83000, volume: 123 } })) });
    }
    return R({}, { ok: false, status: 404 });
  };
  m = freshModule();

  r = await call(m, { kind: 'toss-probe', code: '005930' });
  ok(r.body.ok === true && r.body.step === 'done', '토스 진단이 끝까지 통과한다');
  ok(r.body.quote.price === 84000 && r.body.quote.name === '삼성전자', '응답 필드 매핑이 맞다');
  ok(seen.some(u => /\/v1\/quotes\/A005930$/.test(u)), '국내 종목에 A 접두어를 붙여 보낸다 (005930 → A005930)');

  r = await call(m, { kind: 'quote', codes: '005930' });
  ok(r.body.quotes[0].src === 'toss', '시세 1순위가 토스다');

  r = await call(m, { kind: 'health' });
  ok(r.body.quoteProvider === 'toss', 'health 도 토스라고 보고한다');

  /* 동시 요청에도 토큰은 한 번만 — 발급 호출제한을 넘지 않게 */
  clearKeys();
  process.env.TOSS_CLIENT_ID = 'cid'; process.env.TOSS_CLIENT_SECRET = 'csec';
  tossTokenCalls = 0;
  m = freshModule();
  await call(m, { kind: 'quote', codes: '005930,000660,069500,360750,133690' });
  ok(tossTokenCalls === 1, '종목 5개를 동시에 물어봐도 토큰 발급은 1회 (' + tossTokenCalls + '회)');

  /* ══ 3) 토스가 죽으면 한국투자증권으로 넘어가는가 ══════════════════ */
  console.log('\n[3] 토스 실패 → 한국투자증권 폴백');
  clearKeys();
  process.env.TOSS_CLIENT_ID = 'cid'; process.env.TOSS_CLIENT_SECRET = 'csec';
  process.env.KIS_APP_KEY = 'kk'; process.env.KIS_APP_SECRET = 'ks';
  tossQuoteFails = true;
  m = freshModule();
  r = await call(m, { kind: 'quote', codes: '000660' });
  ok(r.body.quotes.length === 1 && r.body.quotes[0].src === 'kis', '토스가 죽어도 KIS 로 값이 나온다');
  ok(/토스 실패/.test(r.body.quotes[0].note || ''), '무엇이 있었는지 기록을 남긴다');

  /* KIS 가 없으면 토스 오류를 그대로 보여줘야 한다 (엉뚱한 안내 금지) */
  delete process.env.KIS_APP_KEY; delete process.env.KIS_APP_SECRET;
  m = freshModule();
  r = await call(m, { kind: 'quote', codes: '000660' });
  ok(!/NEED:KIS/.test(r.body.errors[0].message), 'KIS 가 없을 땐 토스 오류를 그대로 보여준다 (KIS 안내로 덮지 않는다)');
  tossQuoteFails = false;

  /* ══ 4) 지수·경제지표 ══════════════════════════════════════════════ */
  console.log('\n[4] 지수 · 한국은행 지표');
  clearKeys();
  process.env.KIS_APP_KEY = 'kk'; process.env.KIS_APP_SECRET = 'ks'; process.env.ECOS_API_KEY = 'ec';
  resetTossCfg();
  global.fetch = (u) => {
    const s = String(u);
    if (s.indexOf('tokenP') >= 0) return R({ access_token: 'K', expires_in: 86400 });
    if (s.indexOf('inquire-index-price') >= 0) return R({ rt_cd: '0', output: { bstp_nmix_prpr: '2765.43', bstp_nmix_prdy_vrss: '12.1', prdy_ctrt: '0.44' } });
    if (s.indexOf('ecos.bok.or.kr') >= 0) return R({ StatisticSearch: { row: [
      { TIME: '202605', DATA_VALUE: '3.00', UNIT_NAME: '%' },
      { TIME: '202606', DATA_VALUE: '2.75', UNIT_NAME: '%' },
      { TIME: '202607', DATA_VALUE: '2.50', UNIT_NAME: '%' }] } });
    return R({}, { ok: false, status: 404 });
  };
  m = freshModule();

  r = await call(m, { kind: 'index' });
  ok(r.body.indices.length >= 1 && r.body.indices[0].price === 2765.43, '지수 값이 숫자로 정리된다');

  r = await call(m, { kind: 'econ' });
  const e0 = r.body.econ[0];
  ok(e0 && e0.value === 2.5, '최신 지표값을 집는다 (' + (e0 && e0.value) + '%)');
  ok(e0 && e0.diff === -0.25, '직전 대비 변화를 계산한다 (2.75 → 2.50 = ' + (e0 && e0.diff) + ')');
  ok(e0 && e0.series.length === 3, '추이 그래프용 시계열이 딸려 온다');
  ok(!!(e0 && e0.hint), '"고객에게 뜻하는 것" 한 줄이 붙는다');

  /* ECOS 가 에러를 주면 조용히 빈 값이 아니라 이유가 나와야 한다 */
  global.fetch = () => R({ RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' } });
  m = freshModule();
  process.env.ECOS_API_KEY = 'ec';
  r = await call(m, { kind: 'econ' });
  ok(r.body.ok === false && /INFO-200/.test(r.body.errors[0].message), 'ECOS 오류 사유를 그대로 전달한다');

  /* ══ 5) 뉴스 — RSS 를 읽고 설계사 키워드를 위로 올리는가 ══════════ */
  console.log('\n[5] 뉴스 수집·정렬');
  clearKeys();
  const xml = '<?xml version="1.0"?><rss><channel>'
    + '<item><title><![CDATA[한국은행 기준금리 동결… ISA 절세 관심]]></title><link>https://ex.com/1</link>'
    + '<pubDate>Wed, 06 Aug 2026 09:00:00 +0900</pubDate><description><![CDATA[<p>연금저축 수요가 늘고 있다.</p>]]></description></item>'
    + '<item><title>관련 없는 기사</title><link>https://ex.com/2</link>'
    + '<pubDate>Wed, 06 Aug 2026 10:00:00 +0900</pubDate><description>내용</description></item>'
    + '</channel></rss>';
  global.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(xml) });
  m = freshModule();
  r = await call(m, { kind: 'news' });
  ok(r.body.news.length === 2, 'RSS 항목을 읽어 낸다 (중복은 합친다)');
  ok(r.body.news[0].title.indexOf('기준금리') >= 0, '키워드가 걸린 기사가 맨 위로 온다');
  ok(r.body.news[0].hits.length >= 3, '어떤 키워드가 걸렸는지 표시한다 (' + r.body.news[0].hits.join(',') + ')');
  ok(/<p>/.test(xml) && !/<p>/.test(r.body.news[0].desc), 'HTML 태그를 벗겨서 준다');
  ok(r.body.news[1].hits.length === 0, '관련 없는 기사는 키워드가 비어 있다');

  /* 죽은 피드가 있어도 나머지는 나와야 한다 */
  let n = 0;
  global.fetch = () => (++n % 2 ? Promise.reject(new Error('죽은 피드')) : Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(xml) }));
  m = freshModule();
  r = await call(m, { kind: 'news' });
  ok(r.body.news.length >= 1, '피드 절반이 죽어도 나머지는 나온다');

  /* ══ 5.5) 공공데이터포털 — 승인 대기 없이 오늘 켜는 길 ═════════════ */
  console.log('\n[5.5] 공공데이터포털 전일 종가');
  clearKeys(); resetTossCfg();
  process.env.DATA_GO_KR_KEY = 'dk';
  const row = (d, code, nm, clpr, rt) => ({ basDt: d, srtnCd: code, itmsNm: nm, clpr: String(clpr), vs: '1', fltRt: String(rt), mkp: '1', hipr: '2', lopr: '3', trqu: '4', mrktTotAmt: '5' });
  let krxHeader = null;
  global.fetch = (u) => {
    const s = String(u);
    const wrap = items => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(
      krxHeader || { response: { header: { resultCode: '00' }, body: { items: { item: items } } } })) });
    if (s.indexOf('getStockPriceInfo') >= 0) return wrap([
      row('20260804', '005930', '삼성전자', 82000, -0.6),
      row('20260806', '005930', '삼성전자', 84000, 1.2),
      row('20260806', '0059301', '엉뚱한종목', 9999, 0),   /* likeSrtnCd 앞자리 일치로 섞여 들어오는 것 */
      row('20260805', '005930', '삼성전자', 83000, 0.6)]);
    if (s.indexOf('getStockMarketIndex') >= 0) return wrap([
      { basDt: '20260806', idxNm: '코스피', clpr: '2765.43', vs: '12.1', fltRt: '0.44', trqu: '9' },
      { basDt: '20260805', idxNm: '코스피', clpr: '2753.33', vs: '-3', fltRt: '-0.1', trqu: '8' },
      { basDt: '20260806', idxNm: '코스피 200', clpr: '370.1', vs: '1', fltRt: '0.3', trqu: '7' }]);
    return R({}, { ok: false, status: 404 });
  };
  m = freshModule();

  r = await call(m, { kind: 'quote', codes: '005930' });
  let qq = r.body.quotes[0];
  ok(qq && qq.src === 'krx', '토스·KIS 가 없으면 공공데이터가 받는다');
  ok(qq && qq.price === 84000 && qq.asOf === '20260806', '주말·공휴일을 건너뛰고 가장 최근 영업일을 집는다 (' + (qq && qq.asOf) + ')');
  ok(qq && qq.delayed === true, '실시간이 아니라는 표시(delayed)를 달아 보낸다');
  ok(qq && qq.name === '삼성전자', '앞자리만 같은 다른 종목(0059301)을 걸러낸다');

  r = await call(m, { kind: 'index' });
  const k200 = (r.body.indices || []).filter(x => x.id === 'kospi200')[0];
  ok(k200 && k200.price === 370.1, '지수명을 정확히 맞춰 고른다 ("코스피" 와 "코스피 200" 을 안 섞는다)');

  r = await call(m, { kind: 'health' });
  ok(r.body.quoteProvider === 'krx' && r.body.realtime === false,
    'health 가 "공공데이터 · 실시간 아님" 으로 정확히 보고한다');

  r = await call(m, { kind: 'krx-probe', code: '005930' });
  ok(r.body.ok === true && r.body.step === 'done', '공공데이터 진단이 통과한다');

  /* 키 오류 봉투를 사유 그대로 올리는가 */
  krxHeader = { OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR', returnAuthMsg: '등록되지 않은 서비스키' } } };
  m = freshModule();
  r = await call(m, { kind: 'krx-probe' });
  ok(r.body.step === 'quote' && /등록되지 않은 서비스키/.test(r.body.message), '키 오류 사유를 그대로 알려 준다');
  krxHeader = null;

  /* ══ 5.6) 제공자 우선순위 — 실시간이 있으면 실시간이 먼저 ══════════ */
  console.log('\n[5.6] 제공자 우선순위');
  process.env.KIS_APP_KEY = 'kk'; process.env.KIS_APP_SECRET = 'ks';
  const base = global.fetch;
  global.fetch = (u, o) => {
    const s = String(u);
    if (s.indexOf('tokenP') >= 0) return R({ access_token: 'K', expires_in: 86400 });
    if (s.indexOf('inquire-price') >= 0) return R({ rt_cd: '0', output: { hts_kor_isnm: '삼성전자', stck_prpr: '84500', prdy_ctrt: '1.8' } });
    return base(u, o);
  };
  m = freshModule();
  r = await call(m, { kind: 'quote', codes: '005930' });
  ok(r.body.quotes[0].src === 'kis', 'KIS 가 있으면 공공데이터보다 KIS 를 먼저 쓴다');

  /* KIS 가 죽으면 공공데이터로 내려간다 */
  global.fetch = (u, o) => {
    const s = String(u);
    if (s.indexOf('tokenP') >= 0) return R({ access_token: 'K', expires_in: 86400 });
    if (s.indexOf('inquire-price') >= 0) return R({ rt_cd: '1', msg_cd: 'X', msg1: '조회 실패' });
    return base(u, o);
  };
  m = freshModule();
  r = await call(m, { kind: 'quote', codes: '005930' });
  qq = r.body.quotes[0];
  ok(qq && qq.src === 'krx', 'KIS 가 죽으면 공공데이터가 이어받는다');
  ok(qq && /KIS 실패/.test(qq.note || ''), '무슨 일이 있었는지 기록을 남긴다');

  /* ══ 5.7) 토스 엔드포인트 자동 탐색 ════════════════════════════════ */
  console.log('\n[5.7] 토스 엔드포인트 자동 탐색');
  clearKeys(); resetTossCfg();
  process.env.TOSS_CLIENT_ID = 'cid'; process.env.TOSS_CLIENT_SECRET = 'csec';
  const urls = [];
  global.fetch = (u, o) => {
    const s = String(u); urls.push(s);
    if (s === 'https://api.tossinvest.com/v1/oauth2/token' && (o.headers.Authorization || '').indexOf('Basic') === 0)
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ access_token: 'TT', expires_in: 3600 })) });
    if (s === 'https://api.tossinvest.com/api/v1/stocks/A005930/price')
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { name: '삼성전자', close: 84000, changeRate: 1.2 } })) });
    return Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve('{"error":"invalid_client"}') });
  };
  const tcfg = require(CFG).providers.toss;
  tcfg.field_map = { root: 'data', name: 'name', price: 'close', change_rate: 'changeRate' };
  m = freshModule();
  r = await call(m, { kind: 'toss-discover' });
  ok(r.body.ok === true && r.body.step === 'done', '맞는 조합을 찾아낸다');
  ok(r.body.suggestConfig.token_path === '/v1/oauth2/token' && r.body.suggestConfig.token_style === 'basic',
    '토큰 경로·인증방식을 정확히 집는다 (' + r.body.suggestConfig.token_path + ' / ' + r.body.suggestConfig.token_style + ')');
  ok(r.body.suggestConfig.paths.quote === '/api/v1/stocks/{code}/price',
    '시세 경로를 찾아 {code} 자리까지 만들어 준다');
  ok(urls.every(u => /^https:\/\/[a-z0-9.-]*tossinvest\.com\//.test(u)),
    '탐색 요청이 토스 도메인 밖으로 절대 나가지 않는다 (' + urls.length + '회 전부)');
  ok(tcfg.base === '' && tcfg.paths.quote === '',
    '탐색이 끝나면 설정을 원래대로 되돌린다 (다음 요청이 엉뚱한 설정으로 돌지 않게)');

  r = await call(m, { kind: 'toss-discover', base: 'https://evil.example.com' });
  ok(r.body.ok === false && r.body.step === 'base', '토스가 아닌 도메인을 넘기면 거절한다');

  /* ══ 5.8) 토스 키 하나만 있을 때 — 화면이 비지 않는가 ═══════════════ */
  console.log('\n[5.8] 토스 단독 (KIS·공공데이터·ECOS 없음)');
  clearKeys(); resetTossCfg();
  process.env.TOSS_CLIENT_ID = 'cid'; process.env.TOSS_CLIENT_SECRET = 'csec';
  const tc = require(CFG).providers.toss;
  tc.base = 'https://api.tossinvest.com'; tc.token_path = '/v1/oauth2/token'; tc.token_style = 'basic';
  tc.paths.quote = '/api/v1/stocks/{code}/price';
  tc.field_map = { root: 'data', name: 'name', price: 'close', change_rate: 'changeRate' };
  const PX = {
    A069500: ['KODEX 200', 38500, 1.1], A229200: ['KODEX 코스닥150', 12100, -0.7],
    A360750: ['TIGER 미국S&P500', 19800, 0.5], A005930: ['삼성전자', 84000, 1.2],
    A000660: ['SK하이닉스', 195000, 2.1], A133690: ['TIGER 미국나스닥100', 102000, 0.8]
  };
  global.fetch = (u) => {
    const s = String(u);
    if (s.indexOf('/v1/oauth2/token') >= 0)
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ access_token: 'TT', expires_in: 3600 })) });
    const mm = s.match(/stocks\/(A\d+)\/price/);
    if (mm && PX[mm[1]]) {
      const p = PX[mm[1]];
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ data: { name: p[0], close: p[1], changeRate: p[2] } })) });
    }
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('nf'), json: () => Promise.resolve({}) });
  };
  m = freshModule();

  r = await call(m, { kind: 'index' });
  ok(r.body.proxy === true && r.body.indices.length === 3,
    '지수 전용 소스가 없으면 지수 ETF 로 대신 채운다 (' + r.body.indices.length + '개)');
  ok(r.body.indices.every(x => x.proxy === true && x.note),
    '지수 그 자체가 아니라는 표시(proxy + "ETF 기준")를 반드시 단다');
  ok((r.body.indices[0] || {}).src === 'toss', '그 값도 토스에서 가져온다');

  r = await call(m, { kind: 'all' });
  ok(r.body.indices.length === 3 && r.body.watchlist.length >= 4,
    '토스 키 하나로 경제동향 화면의 지수·관심종목이 채워진다');
  ok(r.body.econ.length === 0 && r.body.need.indexOf('ECOS_API_KEY') >= 0,
    '기준금리·환율은 토스가 줄 수 없어 한국은행 키를 요청한다 (정직하게 비운다)');

  /* 지수 전용 소스가 생기면 대체를 그만두는가 */
  process.env.DATA_GO_KR_KEY = 'dk';
  const tossFetch = global.fetch;
  global.fetch = (u, o) => {
    const s = String(u);
    if (s.indexOf('getStockMarketIndex') >= 0) return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(
      { response: { header: { resultCode: '00' }, body: { items: { item: [{ basDt: '20260806', idxNm: '코스피', clpr: '2765.43', vs: '1', fltRt: '0.4' }] } } } })) });
    return tossFetch(u, o);
  };
  m = freshModule();
  r = await call(m, { kind: 'index' });
  ok(r.body.proxy !== true && (r.body.indices[0] || {}).name === '코스피',
    '진짜 지수 소스가 생기면 ETF 대체를 그만두고 실제 지수를 쓴다');

  /* ══ 6) 남용 방지 ══════════════════════════════════════════════════ */
  console.log('\n[6] 남용 방지');
  clearKeys();
  process.env.SHARED_TOKEN = 'sec';
  global.fetch = () => R({});
  m = freshModule();
  r = await call(m, { kind: 'health' });
  ok(r.status === 401, '공유 토큰이 없으면 막는다');
  r = await call(m, { kind: 'health' }, { 'x-app-token': 'sec' });
  ok(r.status === 200, '토큰이 맞으면 통과한다');
  clearKeys();

  console.log('');
  if (fail.length) { console.log('실패 ' + fail.length + '건'); process.exit(1); }
  console.log('시세 서버 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
