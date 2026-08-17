/* ════════════════════════════════════════════════════════════════════════
   실시간 투자정보 분석 — 시세 + 뉴스 + 공시 + AI 를 한 종목으로 합친다

     GET /api/analyst?codes=005930,000660
     GET /api/analyst?codes=NVDA,AAPL&market=US
     GET /api/analyst?kind=health        무엇이 꽂혀 있고 무엇이 비었는지

   ── 데이터가 어디서 오는가 ──────────────────────────────────────────────
     시세·등락률·거래량·호가·캔들·종목정보 → 토스증권 Open API (또는 대체 소스)
     뉴스                                 → 구글 뉴스 RSS (별도 소스)
     공시                                 → DART(국내) · SEC EDGAR(미국)
     분석                                 → Anthropic / Gemini

   ⚠️ 토스증권 Open API 에는 뉴스도 커뮤니티도 없다. 공식 규격
      (openapi.tossinvest.com/openapi-docs/latest/openapi.json · v1.2.14)
      엔드포인트 33개를 전부 확인했고 community/comment/opinion/sentiment/
      news/discussion 단어 자체가 없다. 그래서 이 파일은 토스에서 뉴스를
      찾지 않으며, 없는 엔드포인트를 만들어 부르지도 않는다.

      토스에서 쓰는 것은 규격에 실재하는 것뿐이다:
        /api/v1/prices · /api/v1/candles · /api/v1/orderbook · /api/v1/stocks
        /api/v1/trades · /api/v1/stocks/{symbol}/investor-trading

      시세는 market.js 를 거쳐 받는다. 거기에 토스→중계→KIS→공공데이터→
      공개지연 순서가 이미 서 있어서, 토스가 막혀도 화면이 비지 않는다.
      토스를 직접 부르는 코드를 여기 또 두면 그 순서가 두 벌이 된다.

   ── 계산은 밖에 있다 ────────────────────────────────────────────────────
     scripts/analyst-core.js     중복제거·최신가중·집계·정합·신뢰도  (검사 35)
     scripts/analyst-ai.js       AI 응답 스키마 검증                 (검사 27)
     scripts/analyst-sources.js  뉴스·공시 수집
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const CORE = require('../../scripts/analyst-core.js');
const AIX = require('../../scripts/analyst-ai.js');
const SRC = require('../../scripts/analyst-sources.js');

const market = require('./market.js').handler;

const SHARED = process.env.SHARED_TOKEN || '';
const ALLOW = process.env.ALLOWED_ORIGIN || '*';
const cors = {
  'Access-Control-Allow-Origin': ALLOW,
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
  'Content-Type': 'application/json; charset=utf-8'
};

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }

/* 종목 이름은 시세 응답에서 온다. 뉴스는 코드가 아니라 이름으로 찾아야 하므로
   이름을 못 얻으면 그 종목은 뉴스를 건너뛴다 — '005930' 으로 검색하면
   엉뚱한 것이 잡힌다. 조용히 아무거나 넣는 것보다 건너뛰고 말하는 게 낫다. */
async function quoteOf(code, overseas, exchange) {
  /* ⚠️ market.js 는 콜론이 없으면 국내 종목으로 본다. 'NVDA' 를 그대로 넘겼더니
        005930 처럼 취급해 NVDA.KS / NVDA.KQ 를 찾다가 404 가 났다. 해외는
        '거래소:티커' 형태로 넘겨야 한다.
        거래소 이름은 KIS 로 받을 때만 뜻이 있고(NAS·NYS·AMS), 공개 시세로 받을
        때는 티커만 쓴다. 그래서 기본값을 두되 exchange 로 바꿀 수 있게 한다. */
  const ask = overseas ? ((exchange || 'NAS') + ':' + code) : code;
  const r = await market({
    httpMethod: 'GET',
    headers: { 'x-app-token': SHARED },
    queryStringParameters: { kind: 'quote', codes: ask }
  });
  const j = JSON.parse(r.body || '{}');
  const q = (j.quotes || [])[0] || null;
  const err = (j.errors || [])[0];
  return { quote: q, error: err ? String(err.message || '').slice(0, 120) : (q ? '' : '시세를 못 받았습니다') };
}

/* ── 국내 종목의 한국어 이름 ────────────────────────────────────────────
   ⚠️ 이걸 안 하면 조용히 남의 회사 뉴스를 물어 온다. 공개 시세는 종목명을
      영문으로 준다("Samsung Electronics Co., Ltd."). 그대로 한국 뉴스를
      검색했더니 삼성바이오로직스·삼성그룹 기사가 섞여 들어왔다. 화면에는
      '삼성전자 뉴스' 라고 적힌 채로.

      그래서 한국어 이름을 못 구하면 뉴스를 아예 찾지 않는다. 남의 회사
      기사를 이 종목 것처럼 보여 주는 쪽이, 뉴스가 없는 쪽보다 훨씬 나쁘다.

   찾는 순서:
     ① 부를 때 넘겨 준 이름 (names=005930:삼성전자)
     ② Supabase invest_holdings 에 저장된 이름 (앱이 한국어로 넣어 둔다)
     ③ 토스 /api/v1/stocks (종목 기본 정보) — 토스가 연결되면 여기서 온다.
        규격에 실재하는 엔드포인트이며, 지금은 IP 문제로 닿지 않아 비워 둔다.
   ── 그래도 못 구하면 뉴스를 건너뛴다. */
function looksKorean(s) { return /[가-힣]/.test(String(s || '')); }

async function krNameOf(code, given) {
  if (given && looksKorean(given)) return given;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const url = (process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co') +
      '/rest/v1/invest_holdings?code=eq.' + encodeURIComponent(code) + '&select=name&limit=5';
    const r = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key },
                                 signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const rows = await r.json();
    const hit = (rows || []).map(x => x.name).filter(looksKorean)[0];
    return hit || null;
  } catch (e) { return null; }
}

/* 거래량 비교용 과거값. 지금은 공개 소스의 일봉을 쓴다 —
   토스가 붙으면 /api/v1/candles 로 바꾸면 되고, 그 자리에 주석을 남겨 둔다. */
async function pastVolumes(code, overseas) {
  const t = overseas ? code : null;
  try {
    const sym = t || (code + '.KS');
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
                encodeURIComponent(sym) + '?range=1mo&interval=1d';
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const j = await r.json();
    const res = ((j.chart || {}).result || [])[0];
    if (!res) return [];
    const q = (((res.indicators || {}).quote || [])[0]) || {};
    return (q.volume || []).filter(v => v != null).slice(0, -1);   /* 오늘 봉은 뺀다 */
  } catch (e) { return []; }
}

async function analyzeOne(code, overseas, nowMs, givenName, exchange) {
  const out = {
    ticker: code, company: '', market: overseas ? 'US' : 'KRX',
    price: null, changeRate: null, volume: null, priceSource: '', delayed: null,
    volumeChange: null,
    news: { collected: 0, deduped: 0, analyzed: 0, dropped: [], note: '' },
    topNews: [], positiveRatio: null, negativeRatio: null, neutralRatio: null,
    catalysts: [], riskFactors: [],
    disclosures: [], disclosureNote: '',
    marketOpinion: '', aiSummary: '', aiConfidence: 0, alignment: null,
    problems: []
  };

  /* ── ① 시세 ── */
  const qr = await quoteOf(code, overseas, exchange);
  if (qr.quote) {
    out.company = qr.quote.name || '';
    out.price = qr.quote.price;
    out.changeRate = qr.quote.changeRate;
    out.volume = qr.quote.volume;
    out.priceSource = qr.quote.src || '';
    out.delayed = !!qr.quote.delayed;
  } else {
    out.problems.push(qr.error);
  }

  /* ── ② 거래량 변화 ── */
  const past = await pastVolumes(code, overseas);
  out.volumeChange = CORE.volumeChange(out.volume, past);

  /* ── ③ 뉴스 ──
     ⚠️ 회사 이름을 모르면 검색하지 않는다. 6자리 코드로 뉴스를 찾으면
        전혀 다른 기사가 잡힌다. */
  let analyzed = [], rawFresh = [];
  let searchName = out.company;
  if (!overseas) {
    const kr = await krNameOf(code, givenName || out.company);
    if (kr) { searchName = kr; out.company = kr; }
    else searchName = '';                 /* 영문 이름으로는 검색하지 않는다 */
  }

  if (!searchName) {
    /* 해외 종목은 티커만 있어도 찾는다. 한국어 이름 얘기를 하면 안 된다 —
       원인을 엉뚱한 데서 찾게 만든다. */
    if (overseas) {
      out.news.note = '종목명을 몰라 뉴스를 찾지 않았습니다 (시세 실패)';
      out.problems.push('뉴스 건너뜀 — 시세를 못 받아 종목명을 모름');
    } else if (out.company) {
      out.news.note = '한국어 종목명을 몰라 뉴스를 건너뛰었습니다 — 영문명("' + out.company +
        '")으로 검색하면 다른 회사 기사가 섞입니다. names=' + code + ':종목명 으로 넘기거나 앱에 보유종목으로 등록하세요.';
      out.problems.push('뉴스 건너뜀 — 한국어 종목명 없음');
    } else {
      out.news.note = '종목명을 몰라 뉴스를 찾지 않았습니다 (시세 실패)';
      out.problems.push('뉴스 건너뜀 — 시세를 못 받아 종목명을 모름');
    }
  } else {
    const got = await SRC.newsFor({ name: searchName, ticker: code, overseas: overseas }, { limit: 25 });
    out.news.collected = got.items.length;
    if (got.errors.length) out.problems.push('뉴스 일부 실패: ' + got.errors.join(' / ').slice(0, 100));

    const deduped = CORE.dedupe(got.items);
    out.news.deduped = deduped.length;

    /* 최신 것부터, 너무 오래된 것은 애초에 AI 에게 안 보낸다 — 돈과 시간을
       0 가중치 기사에 쓸 이유가 없다. */
    const fresh = deduped
      .filter(x => CORE.recencyWeight(x.publishedAt, nowMs) > 0)
      .sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
      .slice(0, 30);

    rawFresh = fresh;
    if (fresh.length) {
      const res = await AIX.analyzeNews({ ticker: code, company: out.company }, fresh);
      /* dupCount 를 분석 결과에 다시 붙인다 — 집계에서 받아쓴 수를 쓴다 */
      const byTitle = {}; fresh.forEach(f => { byTitle[f.title] = f; });
      analyzed = res.rows.map(r => Object.assign({}, r, {
        dupCount: (byTitle[r.title] || {}).dupCount || 1,
        url: (byTitle[r.title] || {}).url || ''
      }));
      out.news.analyzed = analyzed.length;
      out.news.dropped = res.dropped;
      out.news.note = res.note || '';
    } else {
      out.news.note = '최근 72시간 안의 기사가 없습니다';
    }
  }

  /* ── ④ 공시 ── */
  const dis = await SRC.disclosuresFor({ ticker: code, overseas: overseas, corpCode: null }, {});
  out.disclosures = dis.items || [];
  out.disclosureNote = dis.note || '';

  /* ── ⑤ 집계 ── */
  const agg = CORE.aggregate(analyzed, nowMs);
  out.positiveRatio = agg.positiveRatio;
  out.negativeRatio = agg.negativeRatio;
  out.neutralRatio = agg.neutralRatio;
  out.topNews = agg.top.map(x => ({
    title: x.title, url: x.url || '', source: x.source, publishedAt: x.publishedAt,
    sentiment: x.sentiment, importance: x.importance, reason: x.reason, dupCount: x.dupCount || 1
  }));

  /* ⚠️ 감성 분석이 안 됐다고 기사까지 감추면 안 된다.
        AI 키가 없을 때 43건을 모아 놓고 화면에는 한 줄도 안 보여 주고 있었다.
        제목·언론사·시각은 AI 없이도 다 아는 사실이다. 아는 것은 보여 주고,
        모르는 것(감성·중요도)만 비운다. 왜 비었는지는 newsAnalyzed 로 알린다. */
  out.newsAnalyzed = out.topNews.length > 0;
  if (!out.topNews.length && rawFresh.length) {
    out.topNews = rawFresh.slice(0, 6).map(x => ({
      title: x.title, url: x.url || '', source: x.source, publishedAt: x.publishedAt,
      sentiment: null, importance: null, reason: '', dupCount: x.dupCount || 1
    }));
  }

  /* 상승요인·하락위험은 중요도 순으로 모아 중복을 지운다 */
  const pick = (key) => {
    const seen = new Set(), list = [];
    analyzed.slice().sort((a, b) => b.importance - a.importance).forEach(r => {
      (r[key] || []).forEach(v => { const k = v.trim(); if (k && !seen.has(k)) { seen.add(k); list.push(k); } });
    });
    return list.slice(0, 6);
  };
  out.catalysts = pick('catalysts');
  out.riskFactors = pick('riskFactors');

  /* ── ⑥ 뉴스와 주가 방향 ── */
  out.alignment = CORE.alignment(agg.netScore, out.changeRate);

  /* ── ⑦ 시장 의견 ──
     ⚠️ 기사를 42건 모아 놓고 '기사 0건' 이라고 적고 있었다. 화면 안에서 말이
        어긋나면 어느 쪽이 참인지 알 수 없다. 모은 것과 분석한 것을 갈라 말한다. */
  if (!out.newsAnalyzed && out.news.deduped) {
    out.marketOpinion = '기사 ' + out.news.deduped + '건 · 감성은 못 쟀습니다';
  } else if (!agg.enoughForOpinion) {
    out.marketOpinion = agg.note || '표본이 적어 의견을 말하지 않습니다';
  } else if (agg.netScore > 0.25) out.marketOpinion = '최근 기사는 대체로 우호적입니다';
  else if (agg.netScore < -0.25) out.marketOpinion = '최근 기사는 대체로 부정적입니다';
  else out.marketOpinion = '기사가 한쪽으로 기울지 않았습니다';

  /* ── ⑧ 신뢰도 ── */
  const conf = CORE.confidence(agg, out.price != null, out.disclosures.length > 0);
  out.aiConfidence = conf.score;
  out.confidenceReasons = conf.reasons;

  /* ── ⑨ 종합 한 줄 — 지어내지 않고 위에서 구한 것만 엮는다 ── */
  const bits = [];
  if (out.price != null) bits.push('현재가 ' + Number(out.price).toLocaleString('ko-KR') +
    (out.changeRate != null ? ' (' + (out.changeRate > 0 ? '+' : '') + out.changeRate + '%)' : '') +
    (out.delayed ? ' · 지연' : ''));
  if (out.volumeChange && out.volumeChange.ratio != null) bits.push('거래량 ' + out.volumeChange.note);
  if (out.news.analyzed) bits.push('기사 ' + out.news.analyzed + '건 분석 · ' + out.marketOpinion);
  else if (out.news.deduped) bits.push('기사 ' + out.news.deduped + '건 모았으나 감성 분석은 못 했습니다');
  else bits.push('분석할 기사가 없습니다');
  if (out.alignment && out.alignment.verdict === 'diverged') bits.push('⚠️ ' + out.alignment.reason);
  if (out.disclosures.length) bits.push('공시 ' + out.disclosures.length + '건');
  out.aiSummary = bits.join(' · ');

  return out;
}

exports.handler = async function (event) {
  const started = Date.now();
  const p = (event && event.queryStringParameters) || {};
  if (event && event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  if (p.kind === 'health') {
    return {
      statusCode: 200, headers: cors,
      body: JSON.stringify({
        ok: true,
        시세: 'market.js 경유 (토스→중계→KIS→공공데이터→공개지연)',
        뉴스: '구글 뉴스 RSS · 키 불필요',
        국내공시: SRC.dartReady() ? 'DART 준비됨' : 'DART_API_KEY 없음 (무료 발급 opendart.fss.or.kr)',
        미국공시: 'SEC EDGAR · 키 불필요 (SEC_USER_AGENT 로 연락처 지정 권장)',
        분석: (process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)
          ? 'AI 준비됨' : 'ANTHROPIC_API_KEY / GEMINI_API_KEY 없음 — 뉴스는 모으지만 감성 분석은 못 합니다',
        토스뉴스API: '없음. 토스 Open API 규격에 뉴스·커뮤니티 엔드포인트가 존재하지 않습니다.'
      })
    };
  }

  if (SHARED) {
    const t = (event.headers || {})['x-app-token'] || (event.headers || {})['X-App-Token'];
    if (t !== SHARED) return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, message: '토큰이 올바르지 않습니다.' }) };
  }

  const codes = String(p.codes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 8);
  if (!codes.length) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, message: 'codes 가 필요합니다. 예: ?codes=005930,000660' }) };
  }
  const overseas = String(p.market || '').toUpperCase() === 'US';
  const nowMs = Date.now();

  /* names=005930:삼성전자,000660:SK하이닉스
     국내 종목은 한국어 이름이 있어야 뉴스를 제대로 찾는다. 앱에 보유종목으로
     들어 있으면 자동으로 읽지만, 안 그런 종목은 여기로 넘겨 주면 된다. */
  const nameOf = {};
  String(p.names || '').split(',').forEach(pair => {
    const i = pair.indexOf(':');
    if (i > 0) nameOf[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  });

  const results = [];
  for (const c of codes) {
    try { results.push(await analyzeOne(c, overseas, nowMs, nameOf[c], p.exchange)); }
    catch (e) { results.push({ ticker: c, problems: ['분석 실패: ' + String(e.message || e).slice(0, 140)] }); }
  }

  return {
    statusCode: 200, headers: cors,
    body: JSON.stringify({ ok: true, at: new Date().toISOString(), ms: Date.now() - started, stocks: results })
  };
};
