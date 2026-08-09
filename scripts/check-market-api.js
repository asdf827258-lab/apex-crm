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
  ['TOSS_CLIENT_ID', 'TOSS_CLIENT_SECRET', 'KIS_APP_KEY', 'KIS_APP_SECRET',
    'ECOS_API_KEY', 'FUND_API_URL', 'FUND_API_KEY', 'SHARED_TOKEN'].forEach(k => delete process.env[k]);
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
  ok(r.body.need.length === 4, '토스 한 쌍 + KIS 한 쌍을 함께 알려 준다 (' + r.body.need.join(',') + ')');

  r = await call(m, { kind: 'toss-probe' });
  ok(r.body.step === 'config' && r.body.missing.length === 5, '토스 진단이 못 채운 항목 5개를 짚어 준다');

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
