/*
 * APEX YUN PRO — 투자·경제 실시간 데이터 프록시 (Netlify Functions)
 * ════════════════════════════════════════════════════════════════════════
 * 앱(주식관리·펀드관리·경제동향)이 쓰는 단일 창구다.  GET /api/market?kind=...
 *
 *   kind=health              어떤 키가 꽂혀 있는지 진단 (키 없이도 200)
 *   kind=quote&codes=..      국내/해외 주식·ETF 현재가 (여러 개 콤마로)
 *   kind=index               코스피·코스닥·코스피200 지수
 *   kind=fund&codes=..       공모펀드 기준가·수익률
 *   kind=econ                기준금리·환율·CD·국고채·물가 (한국은행 ECOS)
 *   kind=news&cat=경제       경제·보험 뉴스 (config/sources.json RSS 재사용)
 *   kind=all                 index+econ+news 한 번에 (경제동향 화면 첫 로딩용)
 *   kind=toss-probe          토스 설정이 맞는지 진단
 *   kind=toss-discover       키는 있는데 경로를 모를 때 토스 도메인 안에서 자동 탐색
 *   kind=krx-probe           공공데이터포털 연결 진단
 *
 * ── 토스 API 정리 ─────────────────────────────────────────────────────────
 *   · 토스페이먼츠 API = 결제·빌링 전용. 시세는 주지 않는다. 이 저장소에서는
 *     지금처럼 구독 결제만 담당한다(/api/toss-confirm, /api/toss-billing).
 *   · 토스증권 Open API = 있다. corp.tossinvest.com/ko/open-api 에서 신청하고
 *     승인되면 client_id / client_secret 을 받아 OAuth 2.0 으로 시세를 부른다.
 *     문서: developers.tossinvest.com/docs
 *     → 이 함수의 '1순위' 시세 제공자다. config/market.json 의 providers.toss 에
 *       문서에 적힌 base / token_path / paths.quote / field_map 을 채우고
 *       TOSS_CLIENT_ID / TOSS_CLIENT_SECRET 을 넣으면 바로 붙는다.
 *   · 채우기 전이거나 호출이 실패하면 다음 제공자로 자동 폴백한다:
 *       ① 토스증권(실시간) → ② 한국투자증권(실시간) → ③ 공공데이터포털(전일 종가)
 *     셋 중 하나만 있어도 화면은 정상 동작한다.
 *   · 토스 승인을 기다리는 중이라면 ③ 이 가장 빠르다 — data.go.kr 금융위원회
 *     주식·지수 시세정보는 자동승인이고 증권 계좌도 필요 없다(대신 T+1 종가).
 *   · 비공식 웹 내부 엔드포인트(WTS)는 쓰지 않는다 — 예고 없이 바뀌고
 *     약관 위반 소지가 있어, 고객 자산을 다루는 CRM 에 둘 성질이 아니다.
 *
 *   나머지 소스: 지수 → KIS · 경제지표 → 한국은행 ECOS ·
 *                펀드 → data.go.kr 금융위원회 · 뉴스 → config/sources.json RSS
 *
 * ── 환경변수 (Netlify → Site settings → Environment variables) ──────────
 *   TOSS_CLIENT_ID / TOSS_CLIENT_SECRET  토스증권 오픈API      (시세 1순위·실시간)
 *   KIS_APP_KEY / KIS_APP_SECRET      한국투자증권 앱키·시크릿 (2순위·실시간·지수)
 *   DATA_GO_KR_KEY                    공공데이터포털 인증키      (3순위·전일 종가)
 *   KIS_ENV                            real(기본) 또는 vts(모의투자)
 *   ECOS_API_KEY                       한국은행 ECOS 인증키       (경제지표)
 *   FUND_API_URL / FUND_API_KEY        data.go.kr 펀드 API        (펀드)
 *   SHARED_TOKEN / ALLOWED_ORIGIN      남용 방지 (다른 함수와 동일 규칙)
 *
 *   키가 하나도 없어도 이 함수는 500 을 내지 않는다.  { ok:false, need:[...] }
 *   로 "무엇을 넣어야 하는지"를 돌려주고, 앱은 그 안내 카드를 그린다.
 */

let CFG = {};
let SOURCES = {};
try { CFG = require('../../config/market.json'); } catch (e) { CFG = {}; }
try { SOURCES = require('../../config/sources.json'); } catch (e) { SOURCES = {}; }

const P = CFG.providers || {};
const TTL = CFG.cache_ttl || { quote: 20, index: 30, fund: 21600, econ: 21600, news: 900 };

/* ── 웜 컨테이너 동안만 사는 메모리 캐시 (무료 API 호출 한도 절약) ───────── */
const cache = new Map();
function cGet(k) {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) { cache.delete(k); return null; }
  return v.val;
}
function cSet(k, val, ttlSec) {
  cache.set(k, { val: val, exp: Date.now() + (ttlSec || 30) * 1000 });
  if (cache.size > 400) { const first = cache.keys().next().value; cache.delete(first); }
  return val;
}

function kstNow() { return new Date(Date.now() + 9 * 3600 * 1000); }
function ymd(d, sep) { const s = d.toISOString().slice(0, 10); return sep ? s : s.replace(/-/g, ''); }
function num(v) { const n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : null; }

/* 장중 여부 — 평일 09:00~15:30 KST. 앱이 자동 새로고침 주기를 정하는 데 쓴다. */
function marketOpen() {
  const d = kstNow(), day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  const m = d.getUTCHours() * 60 + d.getUTCMinutes();
  return m >= 9 * 60 && m <= 15 * 60 + 30;
}

/* ══════════════════════════════════════════════════════════════════════
   0) 토스증권 Open API — 시세 1순위 (OAuth 2.0 client_credentials)
      엔드포인트를 코드에 박지 않고 config/market.json 에서 읽는다.
      승인 문서마다 경로·필드명이 다를 수 있어, 값이 비어 있으면 조용히
      건너뛰고 KIS 로 간다. 추측한 경로로 호출해서 엉뚱한 에러를 내지 않는다.
   ══════════════════════════════════════════════════════════════════════ */
function tossCfg() { return P.toss || {}; }
function tossKeys() { return { id: process.env.TOSS_CLIENT_ID || '', sec: process.env.TOSS_CLIENT_SECRET || '' }; }
/* 쓸 수 있는 상태인가 = 키 2개 + 설정 3개(base·token_path·paths.quote)가 모두 있어야 한다 */
function tossReady() {
  const c = tossCfg(), k = tossKeys();
  return !!(k.id && k.sec && c.base && c.token_path && (c.paths || {}).quote);
}
function tossWhyNot() {
  const c = tossCfg(), k = tossKeys(), miss = [];
  if (!k.id) miss.push('환경변수 TOSS_CLIENT_ID');
  if (!k.sec) miss.push('환경변수 TOSS_CLIENT_SECRET');
  if (!c.base) miss.push('config/market.json → providers.toss.base');
  if (!c.token_path) miss.push('config/market.json → providers.toss.token_path');
  if (!(c.paths || {}).quote) miss.push('config/market.json → providers.toss.paths.quote');
  return miss;
}

let tossTok = null;
let tossTokInflight = null;
async function tossIssueToken() {
  const c = tossCfg(), k = tossKeys();
  const url = String(c.base).replace(/\/+$/, '') + c.token_path;
  const style = (c.token_style || 'form').toLowerCase();

  let headers = {}, body = '';
  if (style === 'json') {
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({ grant_type: 'client_credentials', client_id: k.id, client_secret: k.sec });
  } else if (style === 'basic') {
    headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(k.id + ':' + k.sec).toString('base64')
    };
    body = 'grant_type=client_credentials';
  } else {
    headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    body = new URLSearchParams({ grant_type: 'client_credentials', client_id: k.id, client_secret: k.sec }).toString();
  }

  const r = await fetch(url, { method: 'POST', headers: headers, body: body });
  const txt = await r.text();
  let j = {};
  try { j = JSON.parse(txt); } catch (e) { /* 아래에서 원문으로 알려준다 */ }
  const tok = j.access_token || j.accessToken || (j.data && (j.data.access_token || j.data.accessToken));
  if (!r.ok || !tok) {
    throw new Error('토스 토큰 발급 실패 ' + r.status + ' — ' + txt.slice(0, 200));
  }
  const exp = num(j.expires_in || j.expiresIn || (j.data && (j.data.expires_in || j.data.expiresIn))) || 3600;
  tossTok = { tok: tok, exp: Date.now() + (Math.max(exp, 120) - 60) * 1000 };
  return tok;
}
/* KIS 와 같은 이유로 동시 발급을 하나로 묶는다 */
function tossToken() {
  if (tossTok && tossTok.exp > Date.now()) return Promise.resolve(tossTok.tok);
  if (tossTokInflight) return tossTokInflight;
  tossTokInflight = tossIssueToken().finally(() => { tossTokInflight = null; });
  return tossTokInflight;
}
/* 앱은 005930 으로 입력한다 → 토스가 쓰는 A005930 으로 바꿔 보낸다 */
function tossCode(raw) {
  const c = tossCfg(), s = String(raw || '').trim().toUpperCase();
  if (s.indexOf(':') > 0) return s.split(':')[1];              /* NAS:AAPL → AAPL */
  if (/^\d{6}$/.test(s)) return ((c.code || {}).krx_prefix || 'A') + s;
  return s;
}
async function tossQuote(raw) {
  const c = tossCfg();
  const code = tossCode(raw);
  const tok = await tossToken();
  const path = String(c.paths.quote).replace(/\{code\}/g, encodeURIComponent(code));
  const url = String(c.base).replace(/\/+$/, '') + path;

  const r = await fetch(url, {
    headers: Object.assign(
      { Accept: 'application/json', Authorization: 'Bearer ' + tok },
      c.headers || {}
    )
  });
  const txt = await r.text();
  let j = {};
  try { j = JSON.parse(txt); } catch (e) { throw new Error('토스 응답이 JSON 이 아닙니다: ' + txt.slice(0, 160)); }
  if (!r.ok) throw new Error('토스 ' + r.status + ' — ' + txt.slice(0, 160));

  const fm = c.field_map || {};
  let o = fm.root ? dig(j, fm.root) : j;
  if (Array.isArray(o)) o = o[0];
  if (!o || typeof o !== 'object') {
    throw new Error('토스 응답에서 종목 데이터를 찾지 못했습니다. providers.toss.field_map.root 를 맞춰주세요. 응답: ' + txt.slice(0, 160));
  }
  const price = num(dig(o, fm.price || 'close'));
  if (price == null) {
    throw new Error('토스 응답에 현재가 필드가 없습니다. providers.toss.field_map.price 를 맞춰주세요. 응답: ' + txt.slice(0, 160));
  }
  const isOverseas = String(raw).indexOf(':') > 0;
  return {
    code: String(raw).trim().toUpperCase(),
    market: isOverseas ? String(raw).split(':')[0].toUpperCase() : 'KRX',
    currency: isOverseas ? 'USD' : 'KRW',
    name: dig(o, fm.name || 'name') || '',
    price: price,
    change: num(dig(o, fm.change || 'change')),
    changeRate: num(dig(o, fm.change_rate || 'changeRate')),
    prevClose: num(dig(o, fm.prev_close || 'base')),
    volume: num(dig(o, fm.volume || 'volume')),
    src: 'toss', at: new Date().toISOString()
  };
}

/* ══════════════════════════════════════════════════════════════════════
   1) 한국투자증권 KIS — 접근토큰 (발급 24시간 유효, 컨테이너 안에서 재사용)
   ══════════════════════════════════════════════════════════════════════ */
let kisTok = null;
let kisTokInflight = null;
function kisBase() {
  const k = P.kis || {};
  return (process.env.KIS_ENV === 'vts' ? k.base_vts : k.base_real) || k.base_real || '';
}
async function kisIssueToken(key, sec) {
  const r = await fetch(kisBase() + ((P.kis || {}).token_path || '/oauth2/tokenP'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', appkey: key, appsecret: sec })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    throw new Error('KIS 토큰 발급 실패 ' + r.status + ' ' + (j.error_description || j.msg1 || '').slice(0, 120));
  }
  /* expires_in(초)보다 5분 일찍 만료 처리해 경계에서 401 나는 것을 막는다. */
  kisTok = { tok: j.access_token, exp: Date.now() + (Math.min(num(j.expires_in) || 86400, 86400) - 300) * 1000 };
  return kisTok.tok;
}
/* ⚠️ KIS 는 토큰 발급 자체에 호출 제한이 있다(짧은 간격 재발급 거부).
   종목 여러 개를 동시에 조회하면 토큰이 없는 상태에서 동시에 발급을 때리게 되므로,
   진행 중인 발급 요청 하나를 모두가 나눠 갖도록 묶는다. */
function kisToken() {
  const key = process.env.KIS_APP_KEY, sec = process.env.KIS_APP_SECRET;
  if (!key || !sec) return Promise.reject(new Error('NEED:KIS_APP_KEY,KIS_APP_SECRET'));
  if (kisTok && kisTok.exp > Date.now() + 60000) return Promise.resolve(kisTok.tok);
  if (kisTokInflight) return kisTokInflight;
  kisTokInflight = kisIssueToken(key, sec).finally(() => { kisTokInflight = null; });
  return kisTokInflight;
}
async function kisGet(path, params, trId) {
  const tok = await kisToken();
  const qs = Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
  const r = await fetch(kisBase() + path + '?' + qs, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: 'Bearer ' + tok,
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET,
      tr_id: trId,
      custtype: 'P'
    }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('KIS ' + r.status + ' ' + String(j.msg1 || '').slice(0, 120));
  if (j.rt_cd && j.rt_cd !== '0') throw new Error('KIS ' + j.msg_cd + ' ' + String(j.msg1 || '').slice(0, 120));
  return j;
}

/* ── 국내 주식·ETF 현재가 ─────────────────────────────────────────────── */
async function quoteDomestic(code) {
  const j = await kisGet((P.kis.paths || {}).domestic_price, {
    FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code
  }, (P.kis.tr_ids || {}).domestic_price);
  const o = j.output || {};
  return {
    code: code, market: 'KRX', currency: 'KRW',
    name: o.hts_kor_isnm || '',
    price: num(o.stck_prpr),
    change: num(o.prdy_vrss),
    changeRate: num(o.prdy_ctrt),
    prevClose: num(o.stck_sdpr),
    open: num(o.stck_oprc), high: num(o.stck_hgpr), low: num(o.stck_lwpr),
    volume: num(o.acml_vol),
    high52: num(o.w52_hgpr), low52: num(o.w52_lwpr),
    per: num(o.per), pbr: num(o.pbr), cap: num(o.hts_avls),
    src: 'kis', at: new Date().toISOString()
  };
}
/* ── 해외 주식·ETF 현재가 (예: NAS:AAPL) ──────────────────────────────── */
async function quoteOverseas(excd, symb) {
  const j = await kisGet((P.kis.paths || {}).overseas_price, { AUTH: '', EXCD: excd, SYMB: symb },
    (P.kis.tr_ids || {}).overseas_price);
  const o = j.output || {};
  return {
    code: symb, market: excd, currency: 'USD',
    name: symb,
    price: num(o.last),
    change: num(o.diff),
    changeRate: num(o.rate),
    prevClose: num(o.base),
    volume: num(o.tvol),
    src: 'kis', at: new Date().toISOString()
  };
}

/* 코드 표기 규칙: '005930' = 국내, 'NAS:AAPL' = 해외(거래소:심볼)

   순서: ① 토스증권(실시간) → ② 한국투자증권(실시간) → ③ 공공데이터포털(전일 종가)
   앞의 것이 없거나 실패하면 다음으로 넘어간다. 셋 다 없으면 무엇을 넣으면 되는지 알려준다.
   가장 빨리 켤 수 있는 것이 ③ 이라 안내에서 맨 앞에 둔다(자동승인·계좌 불필요). */
async function quoteOne(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return null;
  const k = 'q:' + s;
  const hit = cGet(k);
  if (hit) return hit;

  const kisOk = !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET);
  const krxOk = krxReady();
  const notes = [];

  if (tossReady()) {
    try { return cSet(k, await tossQuote(s), TTL.quote); }
    catch (e) {
      notes.push('토스 실패: ' + String(e && e.message || e).slice(0, 110));
      if (!kisOk && !krxOk) throw new Error(notes[0]);   /* 뒤가 없으면 원인을 그대로 */
    }
  }

  if (kisOk) {
    try {
      const out = s.indexOf(':') > 0
        ? await quoteOverseas(s.split(':')[0], s.split(':')[1])
        : await quoteDomestic(s);
      if (notes.length) out.note = notes.join(' / ') + ' → KIS 사용';
      return cSet(k, out, TTL.quote);
    } catch (e) {
      notes.push('KIS 실패: ' + String(e && e.message || e).slice(0, 110));
      if (!krxOk) throw new Error(notes.join(' / '));
    }
  }

  if (krxOk) {
    try {
      const out = await krxQuote(s);
      out.note = (notes.length ? notes.join(' / ') + ' → ' : '')
        + '공공데이터 전일 종가(' + (out.asOf || '') + ')';
      return cSet(k, out, TTL.quote);
    } catch (e) {
      notes.push('공공데이터 실패: ' + String(e && e.message || e).slice(0, 110));
      throw new Error(notes.join(' / '));
    }
  }

  /* 아무것도 없다 — 셋 중 '한 세트'만 채우면 된다 */
  throw new Error('NEED:DATA_GO_KR_KEY,TOSS_CLIENT_ID,TOSS_CLIENT_SECRET,KIS_APP_KEY,KIS_APP_SECRET');
}

/* ── 지수를 살 수 있는 소스가 있는가 (KIS 또는 공공데이터) ────────────── */
function hasIndexSource() {
  return !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET) || krxReady();
}
/* 지수 전용 소스가 없을 때 — 지수를 따라가는 ETF 시세로 대신한다.
   토스증권 키 하나만 있어도 경제동향 화면이 비지 않게 하는 장치.
   지수 그 자체가 아니므로 proxy 표시를 달아 앱이 'ETF 기준' 이라고 밝히게 한다. */
async function indexProxyList() {
  const defs = CFG.index_proxy || [];
  const r = await settle(defs, async (d) => {
    const q = await quoteOne(d.code);
    return {
      id: d.id, name: d.name, code: d.code,
      price: q.price, change: q.change, changeRate: q.changeRate, volume: q.volume,
      proxy: true, note: d.note || 'ETF 기준',
      delayed: !!q.delayed, asOf: q.asOf || '',
      src: q.src, at: q.at
    };
  });
  return r;
}

/* ── 지수 — KIS(실시간) 우선, 없으면 공공데이터(전일 종가) ──────────────── */
async function indexOne(def) {
  const k = 'i:' + def.code;
  const hit = cGet(k);
  if (hit) return hit;

  if (!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET)) {
    if (krxReady()) return cSet(k, await krxIndex(def), TTL.index);
    throw new Error('NEED:DATA_GO_KR_KEY,KIS_APP_KEY,KIS_APP_SECRET');
  }
  try {
    return cSet(k, await kisIndexOne(def), TTL.index);
  } catch (e) {
    if (krxReady()) return cSet(k, await krxIndex(def), TTL.index);
    throw e;
  }
}
async function kisIndexOne(def) {
  const j = await kisGet((P.kis.paths || {}).domestic_index, {
    FID_COND_MRKT_DIV_CODE: 'U', FID_INPUT_ISCD: def.code
  }, (P.kis.tr_ids || {}).domestic_index);
  const o = j.output || {};
  return {
    id: def.id, name: def.name, code: def.code,
    price: num(o.bstp_nmix_prpr),
    change: num(o.bstp_nmix_prdy_vrss),
    changeRate: num(o.prdy_ctrt),
    volume: num(o.acml_vol),
    src: 'kis', at: new Date().toISOString()
  };
}

/* ══════════════════════════════════════════════════════════════════════
   1.5) 공공데이터포털 금융위원회 — 전일 종가 (승인 대기 없는 즉시 대안)
        토스 코드가 아직 안 나왔고 증권 계좌도 없을 때 오늘 바로 쓸 수 있는 길.
        실시간이 아니라 T+1 종가지만, 평가금액·수익률·목표/손절 판단에는 충분하다.
        토스나 KIS 가 붙으면 그쪽이 먼저 쓰이고 이건 뒤로 물러난다.
   ══════════════════════════════════════════════════════════════════════ */
function krxCfg() { return P.krx || {}; }
function krxReady() {
  const c = krxCfg();
  return !!(process.env.DATA_GO_KR_KEY && c.base && (c.paths || {}).quote);
}
/* 주말·공휴일에는 당일 데이터가 없다. 며칠 거슬러 올라가 가장 최근 영업일을 집는다. */
function krxRange() {
  const d = kstNow(), back = num(krxCfg().lookback_days) || 14;
  return [ymd(new Date(d.getTime() - back * 86400000)), ymd(d)];
}
async function krxGet(path, params) {
  const c = krxCfg();
  const q = new URLSearchParams(Object.assign({
    serviceKey: process.env.DATA_GO_KR_KEY,
    resultType: 'json', numOfRows: '30', pageNo: '1'
  }, params));
  const r = await fetch(c.base.replace(/\/+$/, '') + path + '?' + q.toString());
  const txt = await r.text();
  let j = {};
  try { j = JSON.parse(txt); } catch (e) { throw new Error('공공데이터 응답이 JSON 이 아닙니다: ' + txt.slice(0, 160)); }

  /* 키 오류·한도 초과는 별도 봉투로 온다 — 사유를 그대로 올려준다 */
  const hdr = (j.OpenAPI_ServiceResponse || {}).cmmMsgHeader;
  if (hdr) throw new Error('공공데이터 ' + (hdr.errMsg || '') + ' / ' + (hdr.returnAuthMsg || ''));
  const rh = ((j.response || {}).header) || {};
  if (rh.resultCode && rh.resultCode !== '00') throw new Error('공공데이터 ' + rh.resultCode + ' ' + (rh.resultMsg || ''));

  let items = dig(j, (c.field_map || {}).items_path || 'response.body.items.item');
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}
/* 여러 날짜가 오면 가장 최근 것 하나 */
function krxLatest(rows, fm, pick) {
  const use = rows.filter(pick || (() => true));
  if (!use.length) return null;
  return use.sort((a, b) => String(a[fm.date]).localeCompare(String(b[fm.date])))[use.length - 1];
}
async function krxQuote(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (s.indexOf(':') > 0) throw new Error('공공데이터 시세는 국내 종목만 지원합니다 (' + s + ' 는 해외)');
  const c = krxCfg(), fm = c.field_map || {}, rg = krxRange();
  const rows = await krxGet(c.paths.quote, { likeSrtnCd: s, beginBasDt: rg[0], endBasDt: rg[1] });
  /* likeSrtnCd 는 앞자리 일치라 다른 종목이 섞일 수 있다 — 정확히 같은 코드만 남긴다 */
  const it = krxLatest(rows, fm, r => String(r[fm.code]).trim() === s);
  if (!it) throw new Error('공공데이터에 최근 ' + (c.lookback_days || 14) + '일 내 ' + s + ' 종가가 없습니다');
  return {
    code: s, market: 'KRX', currency: 'KRW',
    name: it[fm.name] || '',
    price: num(it[fm.price]),
    change: num(it[fm.change]),
    changeRate: num(it[fm.change_rate]),
    open: num(it[fm.open]), high: num(it[fm.high]), low: num(it[fm.low]),
    volume: num(it[fm.volume]), cap: num(it[fm.cap]),
    delayed: true, asOf: it[fm.date] || '',
    src: 'krx', at: new Date().toISOString()
  };
}
async function krxIndex(def) {
  const c = krxCfg(), fm = c.field_map || {}, rg = krxRange();
  const nm = def.krx_name || def.name;
  const rows = await krxGet(c.paths.index, { idxNm: nm, beginBasDt: rg[0], endBasDt: rg[1] });
  const it = krxLatest(rows, fm, r => String(r[fm.index_name]).trim() === nm);
  if (!it) throw new Error('공공데이터에 지수 "' + nm + '" 가 없습니다 (config 의 krx_name 을 확인하세요)');
  return {
    id: def.id, name: def.name, code: def.code,
    price: num(it[fm.price]), change: num(it[fm.change]), changeRate: num(it[fm.change_rate]),
    volume: num(it[fm.volume]),
    delayed: true, asOf: it[fm.date] || '',
    src: 'krx', at: new Date().toISOString()
  };
}

/* ══════════════════════════════════════════════════════════════════════
   2) 한국은행 ECOS — 기준금리·환율·CD·국고채·물가
   ══════════════════════════════════════════════════════════════════════ */
function ecosRange(cycle) {
  const d = kstNow();
  if (cycle === 'D') {
    const s = new Date(d.getTime() - 400 * 86400000);
    return [ymd(s), ymd(d)];
  }
  if (cycle === 'M') {
    const s = new Date(d.getTime() - 800 * 86400000);
    return [ymd(s).slice(0, 6), ymd(d).slice(0, 6)];
  }
  if (cycle === 'Q') return [(d.getUTCFullYear() - 3) + 'Q1', d.getUTCFullYear() + 'Q4'];
  return [String(d.getUTCFullYear() - 6), String(d.getUTCFullYear())];
}
async function econOne(def) {
  const key = process.env.ECOS_API_KEY;
  if (!key) throw new Error('NEED:ECOS_API_KEY');
  const k = 'e:' + def.id;
  const hit = cGet(k);
  if (hit) return hit;

  const r0 = ecosRange(def.cycle);
  const url = [(P.ecos || {}).base || 'https://ecos.bok.or.kr/api/StatisticSearch',
    encodeURIComponent(key), 'json', 'kr', 1, 100, def.stat, def.cycle, r0[0], r0[1], def.item].join('/');

  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (j.RESULT && j.RESULT.CODE && j.RESULT.CODE !== 'INFO-000') {
    throw new Error('ECOS ' + j.RESULT.CODE + ' ' + String(j.RESULT.MESSAGE || '').slice(0, 100));
  }
  const rows = ((j.StatisticSearch || {}).row) || [];
  if (!rows.length) throw new Error('ECOS 데이터 없음 (' + def.stat + '/' + def.item + ')');

  /* 최신값 + 12개 시계열(스파크라인용) + 직전값 대비 변화 */
  const series = rows.slice(-12).map(x => ({ t: x.TIME, v: num(x.DATA_VALUE) }));
  const last = rows[rows.length - 1], prev = rows[rows.length - 2] || last;
  return cSet(k, {
    id: def.id, name: def.name, unit: def.unit || last.UNIT_NAME || '',
    hint: def.hint || '',
    value: num(last.DATA_VALUE), time: last.TIME,
    prev: num(prev.DATA_VALUE),
    diff: (num(last.DATA_VALUE) != null && num(prev.DATA_VALUE) != null)
      ? Math.round((num(last.DATA_VALUE) - num(prev.DATA_VALUE)) * 1000) / 1000 : null,
    series: series, src: 'ecos', at: new Date().toISOString()
  }, TTL.econ);
}

/* ══════════════════════════════════════════════════════════════════════
   3) 공모펀드 기준가 — data.go.kr 엔드포인트를 환경변수로 받는다
      (기관별 오퍼레이션명이 달라 코드에 고정하지 않았다. 미설정이면 앱이
       '수동 기준가 입력' 모드로 그대로 동작하므로 기능이 막히지 않는다.)
   ══════════════════════════════════════════════════════════════════════ */
function dig(obj, path) {
  return String(path || '').split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
}
async function fundOne(code) {
  const base = process.env.FUND_API_URL, key = process.env.FUND_API_KEY;
  if (!base || !key) throw new Error('NEED:FUND_API_URL,FUND_API_KEY');
  const k = 'f:' + code;
  const hit = cGet(k);
  if (hit) return hit;

  const cfg = P.fund || {}, pm = cfg.param_map || {}, fm = cfg.field_map || {};
  const q = new URLSearchParams();
  q.set('serviceKey', key);
  q.set(pm.type || 'resultType', 'json');
  q.set(pm.rows || 'numOfRows', '1');
  q.set(pm.page || 'pageNo', '1');
  q.set(pm.code || 'fundCd', code);

  const r = await fetch(base + (base.indexOf('?') >= 0 ? '&' : '?') + q.toString());
  const txt = await r.text();
  let j = {};
  try { j = JSON.parse(txt); } catch (e) { throw new Error('펀드 API 응답이 JSON 이 아닙니다: ' + txt.slice(0, 120)); }

  let items = dig(j, fm.items_path || 'response.body.items.item');
  if (!items) throw new Error('펀드 API 응답 구조가 다릅니다. config/market.json 의 field_map.items_path 를 맞춰주세요.');
  if (!Array.isArray(items)) items = [items];
  const it = items[0];
  if (!it) throw new Error('펀드 코드 ' + code + ' 조회 결과 없음');

  return cSet(k, {
    code: code, market: 'FUND', currency: 'KRW',
    name: it[fm.name] || '',
    price: num(it[fm.price]),
    date: it[fm.date] || '',
    return1m: num(it[fm.return_1m]), return3m: num(it[fm.return_3m]), return1y: num(it[fm.return_1y]),
    src: 'data.go.kr', at: new Date().toISOString()
  }, TTL.fund);
}

/* ══════════════════════════════════════════════════════════════════════
   4) 뉴스 — 저장소에 이미 있는 config/sources.json RSS 를 서버에서 모은다
      (브라우저에서 직접 RSS 를 부르면 CORS 로 막혀서 서버가 대신 받는다)
   ══════════════════════════════════════════════════════════════════════ */
function stripTags(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function pick(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  return m ? stripTags(m[1]) : '';
}
function pickLink(xml) {
  const m = xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m && stripTags(m[1])) return stripTags(m[1]);
  const h = xml.match(/<link[^>]*href=["']([^"']+)["']/i);
  return h ? h[1] : '';
}
async function fetchFeed(feed) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);   /* 죽은 피드가 함수를 붙잡지 않게 */
  try {
    const r = await fetch(feed.url, {
      signal: ctl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ApexYunPro/1.0)', Accept: 'application/rss+xml, application/xml, text/xml, */*' }
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];
    return blocks.slice(0, 20).map(b => ({
      title: pick(b, 'title'),
      link: pickLink(b),
      date: pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated') || pick(b, 'dc:date'),
      desc: (pick(b, 'description') || pick(b, 'summary')).slice(0, 200),
      source: feed.name
    })).filter(x => x.title && x.link);
  } catch (e) {
    return [];                      /* 한 피드가 죽어도 나머지는 그대로 나온다 */
  } finally { clearTimeout(timer); }
}
async function news(cat) {
  const nc = CFG.news || {};
  const cats = cat && cat !== 'all' ? [cat] : (nc.categories || ['경제']);
  const k = 'n:' + cats.join(',');
  const hit = cGet(k);
  if (hit) return hit;

  let feeds = [];
  cats.forEach(c => { (SOURCES[c] || []).forEach(f => feeds.push(f)); });
  if (!feeds.length) return cSet(k, { items: [], keywords: [] }, 60);

  const lists = await Promise.all(feeds.map(fetchFeed));
  const seen = {}, items = [];
  lists.forEach(l => l.forEach(it => {
    const key = it.title.slice(0, 40);
    if (seen[key]) return;
    seen[key] = 1;
    items.push(it);
  }));

  /* 설계사 관심 키워드가 제목/요약에 있으면 위로 올린다 (그냥 뉴스 나열 금지) */
  const kws = [];
  (nc.keyword_groups || []).forEach(g => (SOURCES[g] || []).forEach(w => kws.push(w)));
  items.forEach(it => {
    const hay = it.title + ' ' + it.desc;
    it.hits = kws.filter(w => hay.indexOf(w) >= 0);
  });
  items.sort((a, b) => {
    if (b.hits.length !== a.hits.length) return b.hits.length - a.hits.length;
    const ta = Date.parse(a.date) || 0, tb = Date.parse(b.date) || 0;
    return tb - ta;
  });

  return cSet(k, { items: items.slice(0, nc.max_items || 30), keywords: kws }, TTL.news);
}

/* ══════════════════════════════════════════════════════════════════════
   묶음 실행 — 하나가 실패해도 나머지는 살려서 돌려준다
   ══════════════════════════════════════════════════════════════════════ */
async function settle(list, fn) {
  const out = [], errs = [];
  const rs = await Promise.all(list.map(x => fn(x).then(v => ({ v: v })).catch(e => ({ e: e }))));
  rs.forEach((r, i) => {
    if (r.v) out.push(r.v);
    else errs.push({ target: typeof list[i] === 'object' ? (list[i].id || list[i].code) : list[i], message: String(r.e && r.e.message || r.e) });
  });
  return { list: out, errors: errs };
}

/* 어떤 키가 없어서 실패했는지 모아 앱에 '설정 안내 카드'로 보여준다 */
function needsOf(errs) {
  const need = {};
  (errs || []).forEach(e => {
    const m = String(e.message || '').match(/^NEED:(.+)$/);
    if (m) m[1].split(',').forEach(x => { need[x.trim()] = 1; });
  });
  return Object.keys(need);
}

exports.handler = async function (event) {
  const cors = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const SHARED = process.env.SHARED_TOKEN || '';
  if (SHARED) {
    const t = (event.headers || {})['x-app-token'] || (event.headers || {})['X-App-Token'];
    if (t !== SHARED) return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, message: '토큰이 올바르지 않습니다.' }) };
  }

  const q = event.queryStringParameters || {};
  const kind = (q.kind || 'health').toLowerCase();
  const meta = { kind: kind, marketOpen: marketOpen(), at: new Date().toISOString() };

  try {
    /* ── 진단: 무엇이 꽂혀 있고 무엇이 비었는지 ────────────────────────── */
    if (kind === 'health') {
      const has = {
        toss: tossReady(),
        kis: !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET),
        krx: krxReady(),
        ecos: !!process.env.ECOS_API_KEY,
        fund: !!(process.env.FUND_API_URL && process.env.FUND_API_KEY),
        news: !!(SOURCES && SOURCES['경제'])
      };
      let kisMsg = '', tossMsg = '';
      if (has.toss) { try { await tossToken(); tossMsg = '토큰 발급 정상'; } catch (e) { tossMsg = e.message; has.toss = false; } }
      else tossMsg = '미설정 — 필요한 것: ' + tossWhyNot().join(' · ');
      if (has.kis) { try { await kisToken(); kisMsg = '토큰 발급 정상'; } catch (e) { kisMsg = e.message; has.kis = false; } }
      const provider = has.toss ? 'toss' : (has.kis ? 'kis' : (has.krx ? 'krx' : 'none'));
      return {
        statusCode: 200, headers: cors,
        body: JSON.stringify({
          ok: true, meta: meta, has: has,
          quoteProvider: provider,
          realtime: provider === 'toss' || provider === 'kis',
          tossMessage: tossMsg, kisEnv: process.env.KIS_ENV || 'real', kisMessage: kisMsg,
          deeplink: (P.toss || {}).deeplink || null,
          guide: {
            DATA_GO_KR_KEY: '공공데이터포털 data.go.kr — 금융위원회 주식·지수 시세정보 활용신청(자동승인, 계좌 불필요). 전일 종가라 실시간은 아니지만 오늘 바로 켤 수 있는 길',
            TOSS_CLIENT_ID: '토스증권 corp.tossinvest.com/ko/open-api 신청·승인 후 발급 — 시세 1순위(실시간, 호출 IP 등록 필요)',
            KIS_APP_KEY: '한국투자증권 apiportal.koreainvestment.com 에서 발급 — 실시간 시세 + 지수(계좌 개설 필요)',
            ECOS_API_KEY: '한국은행 ecos.bok.or.kr/api 에서 발급(즉시) — 기준금리·환율·물가',
            FUND_API_URL: 'data.go.kr 금융위원회 펀드 API 활용신청 후 요청 URL 그대로 입력 — 공모펀드 기준가'
          }
        })
      };
    }

    /* ── 토스증권 연결 진단 — 어디서 막히는지 원문 그대로 보여준다 ────── */
    if (kind === 'toss-probe') {
      /* 순서가 거꾸로였다. 전에는 paths.quote 까지 다 채워야 토큰을 시도했는데,
         시세 경로는 토큰이 나온 뒤에야 확인할 수 있다. 그래서 키 발급이 제대로
         됐는지조차 알 수 없었다. 토큰에 필요한 것만 먼저 막고, 시세 경로는
         토큰이 나온 다음에 따진다. */
      const cfgT = tossCfg(), keyT = tossKeys(), blockers = [];
      if (!keyT.id)  blockers.push('환경변수 TOSS_CLIENT_ID');
      if (!keyT.sec) blockers.push('환경변수 TOSS_CLIENT_SECRET');
      if (!cfgT.base)       blockers.push('config/market.json → providers.toss.base');
      if (!cfgT.token_path) blockers.push('config/market.json → providers.toss.token_path');
      if (blockers.length) {
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'config',
            missing: blockers,
            hint: '토큰 발급에 필요한 것부터 채우세요. 시세 경로(paths.quote)는 토큰이 나온 뒤에 확인합니다.'
          })
        };
      }
      let tok = '';
      try { tok = await tossToken(); }
      catch (e) {
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'token', message: String(e.message || e),
            hint: 'token_path 와 token_style(form/json/basic) 을 문서에 맞게 고치세요. 호출 IP 등록(Netlify 아웃바운드 IP)도 확인하세요.'
          })
        };
      }
      /* 여기까지 왔으면 키는 맞다. 남은 건 시세 경로뿐이라고 분명히 말해 준다. */
      if (!(cfgT.paths || {}).quote) {
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'quote-config', tokenIssued: true,
            message: '토큰 발급 성공 — 키는 제대로 꽂혔습니다.',
            missing: ['config/market.json → providers.toss.paths.quote'],
            hint: '이제 시세 경로만 채우면 끝입니다. kind=toss-discover 를 부르면 후보를 두들겨 찾아 줍니다.'
          })
        };
      }
      const code = q.code || '005930';
      try {
        const out = await tossQuote(code);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, meta: meta, step: 'done', tokenIssued: !!tok, quote: out }) };
      } catch (e) {
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'quote', tokenIssued: !!tok, message: String(e.message || e),
            hint: 'paths.quote 와 field_map(root/price/name…) 을 위 응답 원문에 맞게 고치세요.'
          })
        };
      }
    }

    /* ── 토스 엔드포인트 자동 탐색 ─────────────────────────────────────
       키는 받았는데 문서의 정확한 경로를 아직 모를 때 쓴다.
       발급받은 client_id/secret 으로 토스 도메인 안에서만 후보를 몇 개
       두들겨 보고, 토큰이 나오는 조합을 찾아 config 에 붙여넣을 JSON 을 만들어 준다.
       ⚠️ 안전장치: 요청은 *.tossinvest.com 으로만 나간다. 조회(GET/POST 토큰)뿐이고
          주문 같은 건 건드리지 않는다. 문서에 적힌 값을 아는 순간 이건 필요 없다. */
    if (kind === 'toss-discover') {
      const k = tossKeys();
      if (!k.id || !k.sec) {
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, meta: meta, step: 'key', hint: 'TOSS_CLIENT_ID / TOSS_CLIENT_SECRET 환경변수를 먼저 넣으세요.' }) };
      }
      const hosts = (q.base ? [q.base] : [
        'https://openapi.tossinvest.com', 'https://api.tossinvest.com', 'https://open-api.tossinvest.com'
      ]).filter(h => /^https:\/\/[a-z0-9.-]*tossinvest\.com$/i.test(String(h).replace(/\/+$/, '')));
      if (!hosts.length) {
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, meta: meta, step: 'base', message: 'base 는 tossinvest.com 도메인만 허용합니다.' }) };
      }
      const tokenPaths = q.token_path ? [q.token_path]
        : ['/oauth2/token', '/api/v1/oauth2/token', '/v1/oauth2/token', '/oauth/token', '/auth/token'];
      const styles = q.token_style ? [q.token_style] : ['form', 'basic', 'json'];

      const tried = [];
      let found = null;
      /* 탐색은 설정을 잠시 바꿔가며 두들기는 것이라, 끝나면 반드시 원래대로 돌려놓는다
         (같은 컨테이너에서 다음 요청이 엉뚱한 설정으로 돌지 않게) */
      const savedQuote = (tossCfg().paths || {}).quote;
      const saved = { base: tossCfg().base, token_path: tossCfg().token_path, token_style: tossCfg().token_style };
      const restore = () => { Object.assign(tossCfg(), saved); tossCfg().paths.quote = savedQuote; tossTok = null; tossTokInflight = null; };
      for (const h of hosts) {
        for (const tp of tokenPaths) {
          for (const st of styles) {
            tossCfg().base = h; tossCfg().token_path = tp; tossCfg().token_style = st;
            tossTok = null; tossTokInflight = null;
            try {
              await tossIssueToken();
              found = { base: h, token_path: tp, token_style: st };
            } catch (e) {
              tried.push({ base: h, token_path: tp, token_style: st, error: String(e.message || e).slice(0, 120) });
            }
            if (found) break;
          }
          if (found) break;
        }
        if (found) break;
      }
      if (!found) {
        restore();
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'token', tried: tried.slice(0, 12),
            hint: '후보 중에 맞는 게 없습니다. 문서의 토큰 발급 주소를 알면 ?base=https://…&token_path=/… 로 직접 지정해 다시 부르세요. 401 만 나온다면 호출 IP 등록을 확인하세요.'
          })
        };
      }

      /* 토큰이 나왔다 — 이제 시세 경로를 찾는다 */
      const code = q.code || '005930';
      const quotePaths = q.quote_path ? [q.quote_path] : [
        '/v1/quotes/{code}', '/api/v1/quotes/{code}', '/v1/stocks/{code}/quote',
        '/api/v1/stocks/{code}/price', '/v1/market/quotes/{code}', '/v1/prices/{code}'
      ];
      const qTried = [];
      let quoteOk = null;
      for (const qp of quotePaths) {
        tossCfg().paths.quote = qp;
        try {
          const out = await tossQuote(code);
          quoteOk = { path: qp, sample: out };
          break;
        } catch (e) {
          const msg = String(e.message || e);
          qTried.push({ path: qp, error: msg.slice(0, 160) });
          /* 경로는 맞는데 필드 매핑만 틀린 경우를 구분해 준다 */
          if (/현재가 필드가 없습니다|종목 데이터를 찾지 못했습니다/.test(msg)) {
            quoteOk = { path: qp, needsFieldMap: true, raw: msg.slice(0, 400) };
            break;
          }
        }
      }

      const suggest = {
        base: found.base, token_path: found.token_path, token_style: found.token_style,
        paths: { quote: quoteOk ? quoteOk.path : '(문서에서 확인 필요)' }
      };
      restore();
      return {
        statusCode: 200, headers: cors,
        body: JSON.stringify({
          ok: !!(quoteOk && !quoteOk.needsFieldMap), meta: meta,
          step: quoteOk ? (quoteOk.needsFieldMap ? 'field_map' : 'done') : 'quote',
          token: found, quote: quoteOk, quoteTried: quoteOk ? undefined : qTried.slice(0, 8),
          suggestConfig: suggest,
          hint: quoteOk && !quoteOk.needsFieldMap
            ? '위 suggestConfig 값을 config/market.json 의 providers.toss 에 그대로 넣으면 됩니다.'
            : (quoteOk ? '경로는 맞는데 응답 필드명이 다릅니다. raw 를 보고 field_map(root/price/name)을 맞추세요.'
              : '토큰은 나왔지만 시세 경로를 못 찾았습니다. 문서의 경로를 ?quote_path=/… 로 지정해 다시 부르세요.')
        })
      };
    }

    /* ── 공공데이터포털 연결 진단 (토스·KIS 없이 오늘 바로 켤 때 쓰는 길) ─── */
    if (kind === 'krx-probe') {
      if (!process.env.DATA_GO_KR_KEY) {
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'key',
            hint: 'data.go.kr 에서 "금융위원회_주식시세정보"(15094808)와 "금융위원회_지수시세정보"(15094807) 를 활용신청(자동승인)한 뒤, 일반 인증키(Decoding) 를 DATA_GO_KR_KEY 환경변수에 넣으세요.'
          })
        };
      }
      const code = q.code || '005930';
      const out = { ok: true, meta: meta, step: 'done' };
      try { out.quote = await krxQuote(code); }
      catch (e) {
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'quote', message: String(e.message || e),
            hint: '"등록되지 않은 서비스키" 면 주식시세정보 활용신청이 아직 승인 전이거나 키를 잘못 넣은 것입니다. Encoding 키가 아니라 Decoding 키를 쓰세요.'
          })
        };
      }
      try { out.index = await krxIndex((CFG.indices || [])[0] || { id: 'kospi', name: '코스피', krx_name: '코스피' }); }
      catch (e) { out.indexError = String(e.message || e); out.indexHint = '지수시세정보는 별도 활용신청입니다. 주식만 신청했으면 여기서만 실패합니다.'; }
      return { statusCode: 200, headers: cors, body: JSON.stringify(out) };
    }

    /* ── 현재가 ────────────────────────────────────────────────────────── */
    if (kind === 'quote') {
      const codes = String(q.codes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 30);
      if (!codes.length) return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, meta: meta, message: 'codes 파라미터가 필요합니다.' }) };
      const r = await settle(codes, quoteOne);
      const need = needsOf(r.errors);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: r.list.length > 0, meta: meta, quotes: r.list, errors: r.errors, need: need }) };
    }

    /* ── 지수 ──────────────────────────────────────────────────────────── */
    if (kind === 'index') {
      const r = hasIndexSource() ? await settle(CFG.indices || [], indexOne) : await indexProxyList();
      return {
        statusCode: 200, headers: cors,
        body: JSON.stringify({
          ok: r.list.length > 0, meta: meta, indices: r.list,
          proxy: !hasIndexSource(),
          errors: r.errors, need: needsOf(r.errors)
        })
      };
    }

    /* ── 펀드 ──────────────────────────────────────────────────────────── */
    if (kind === 'fund') {
      const codes = String(q.codes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
      if (!codes.length) return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, meta: meta, message: 'codes 파라미터가 필요합니다.' }) };
      const r = await settle(codes, fundOne);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: r.list.length > 0, meta: meta, funds: r.list, errors: r.errors, need: needsOf(r.errors) }) };
    }

    /* ── 경제지표 ──────────────────────────────────────────────────────── */
    if (kind === 'econ') {
      const r = await settle(CFG.econ || [], econOne);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: r.list.length > 0, meta: meta, econ: r.list, errors: r.errors, need: needsOf(r.errors) }) };
    }

    /* ── 뉴스 ──────────────────────────────────────────────────────────── */
    if (kind === 'news') {
      const n = await news(q.cat || '');
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, meta: meta, news: n.items, keywords: n.keywords }) };
    }

    /* ── 경제동향 화면 첫 로딩 — 지수·지표·뉴스·관심종목을 한 번에 ─────── */
    if (kind === 'all') {
      const wl = (CFG.watchlist || []).map(w => w.code);
      const [idx, ec, nw, wq] = await Promise.all([
        hasIndexSource() ? settle(CFG.indices || [], indexOne) : indexProxyList(),
        settle(CFG.econ || [], econOne),
        news(q.cat || '').catch(() => ({ items: [], keywords: [] })),
        settle(wl, quoteOne)
      ]);
      const errors = [].concat(idx.errors, ec.errors, wq.errors);
      return {
        statusCode: 200, headers: cors,
        body: JSON.stringify({
          ok: true, meta: meta,
          indices: idx.list, econ: ec.list, news: nw.items, watchlist: wq.list,
          watchlistDefs: CFG.watchlist || [],
          indexProxy: !hasIndexSource(),
          deeplink: (P.toss || {}).deeplink || null,
          errors: errors, need: needsOf(errors)
        })
      };
    }

    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, message: '알 수 없는 kind: ' + kind }) };
  } catch (e) {
    const msg = String(e && e.message || e);
    const m = msg.match(/^NEED:(.+)$/);
    return {
      statusCode: 200, headers: cors,
      body: JSON.stringify({ ok: false, meta: meta, need: m ? m[1].split(',') : [], message: m ? '환경변수가 필요합니다: ' + m[1] : msg })
    };
  }
};
