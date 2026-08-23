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
let GONGSI = {};
try { GONGSI = require('../../config/gongsi.json'); } catch (e) { GONGSI = {}; }

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
/* ── 차단기 ────────────────────────────────────────────────────────────
   토스는 호출 IP 를 등록해야 토큰을 준다. 그런데 Netlify 함수가 나갈 때 쓰는
   IP 는 배포마다 바뀐다(3.144.168.102 → 18.222.65.41 → 3.16.137.242 를 확인).
   등록이 어긋난 동안에는 토큰 발급이 매번 403 으로 실패한다.

   설정을 규격대로 채우고 나면 토스가 1순위가 되므로, 이 상태에서는 모든 시세
   요청이 '실패할 게 뻔한 왕복' 을 한 번씩 더 하게 된다. 사용자는 그만큼 늦게
   화면을 본다. IP 문제는 다음 요청에서 저절로 낫는 종류가 아니므로, 한 번
   막히면 이 컨테이너에서는 잠시 토스를 건너뛴다.

   ⚠️ 아무 실패에나 차단기를 걸면 안 된다. 잠깐 끊긴 네트워크까지 5분씩
      막아 버리면 멀쩡한 토스를 안 쓰게 된다. IP·권한 거절일 때만 건다. */
let tossBlocked = 0;
const TOSS_BLOCK_MS = 5 * 60 * 1000;
function tossIsBlocked() { return tossBlocked > Date.now(); }
function tossBlockUntil(msg) {
  const m = String(msg || '');
  if (/ip address not allowed|access_denied|unauthorized_client|invalid_client/i.test(m)) {
    tossBlocked = Date.now() + TOSS_BLOCK_MS;
    return true;
  }
  return false;
}

/* KIS 와 같은 이유로 동시 발급을 하나로 묶는다 */
function tossToken() {
  if (tossTok && tossTok.exp > Date.now()) return Promise.resolve(tossTok.tok);
  if (tossIsBlocked()) {
    return Promise.reject(new Error('토스 건너뜀 — 조금 전 IP/권한 거절(' +
      Math.ceil((tossBlocked - Date.now()) / 1000) + '초 뒤 다시 시도). kind=toss-probe 로 현재 IP 를 확인하세요'));
  }
  if (tossTokInflight) return tossTokInflight;
  tossTokInflight = tossIssueToken()
    .catch(e => { tossBlockUntil(e && e.message); throw e; })
    .finally(() => { tossTokInflight = null; });
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

  if (tossReady() && !tossIsBlocked()) {
    try { return cSet(k, await tossQuote(s), TTL.quote); }
    catch (e) {
      notes.push('토스 실패: ' + String(e && e.message || e).slice(0, 110));
    }
  }

  /* ①' 집·서버의 toss-agent 가 방금 넣어 둔 값이 있으면 그게 진짜 토스 값이다 */
  if (relayReady() && s.indexOf(':') < 0) {
    try {
      const rows = await relayRows([s]);
      const row = (rows || [])[0];
      const age = row ? relayAgeMin(row.src) : null;
      if (row && age != null && age <= RELAY_FRESH_MIN && num(row.close) != null) {
        const out = relayShape(row);
        out.note = (notes.length ? notes.join(' / ') + ' → ' : '') + '토스 중계 ' + age + '분 전';
        return cSet(k, out, TTL.quote);
      }
      if (row && age != null) notes.push('토스 중계 ' + age + '분 전이라 건너뜀');
    } catch (e) { notes.push('중계 실패: ' + String(e && e.message || e).slice(0, 80)); }
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
    }
  }

  /* ④ 키가 하나도 없거나 앞의 셋이 다 실패했다 — 지연 시세라도 내보낸다.
        빈 화면보다 '지연 시세'가 낫다. 단, 지연이라고 반드시 적어서 보낸다. */
  try {
    const out = await pubQuote(s);
    out.note = (notes.length ? notes.join(' / ') + ' → ' : '') + '공개 지연 시세';
    return cSet(k, out, TTL.quote);
  } catch (e) {
    notes.push('공개 시세 실패: ' + String(e && e.message || e).slice(0, 110));
    /* ⚠️ 마지막 줄까지 실패했는데 키도 하나 없다면, '무엇을 넣으면 되는지' 를
          반드시 같이 줘야 한다. 앱은 이 NEED: 목록으로 안내 카드를 그린다.
          공개 시세를 넣으면서 이 줄을 지웠더니, 키가 없는 사람에게 원인만
          보이고 해결 방법이 안 보였다. 검사가 그걸 잡았다. */
    if (!tossReady() && !kisOk && !krxOk) {
      throw new Error('NEED:DATA_GO_KR_KEY,TOSS_CLIENT_ID,TOSS_CLIENT_SECRET,KIS_APP_KEY,KIS_APP_SECRET');
    }
    throw new Error(notes.join(' / '));
  }
}

/* ── 지수를 살 수 있는 소스가 있는가 (KIS 또는 공공데이터) ────────────── */
/* 지수를 '지수로서' 주는 소스가 있는가 (KIS 또는 공공데이터).
   ⚠️ 여기서 무조건 true 를 돌려주게 고쳤다가 검사 4개를 깨뜨렸다. 그러면
      indexProxyList 로 갈 일이 없어지는데, 토스 키만 있는 사람은 그 길로
      토스 시세의 ETF 값을 받고 있었다. 무조건 true 는 그 사람들의 지수를
      토스 값에서 공개 지연값으로 바꿔치기하고, 공개 경로마저 막히면 화면을
      통째로 비운다. 공개 지연 지수는 '지수 소스' 가 아니라 '마지막 보루' 다. */
function hasIndexSource() {
  return !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET) || krxReady();
}

/* 지수 전용 소스(KIS·공공데이터)가 없을 때 무엇으로 채우나.

   ① 공개 지연 '진짜 지수' (^KS11 = 코스피 그 자체)
   ② 그것도 안 되면 지수를 따라가는 ETF 로 대신 (토스 키만 있는 사람이 이 길)

   순서를 반대로 짰다가 되돌렸다. ETF 를 먼저 쓰면, 진짜 코스피(6,977.94)를
   받을 수 있는데도 화면에 'KODEX 200 · ETF 기준' 이 뜬다. 대체품은 원본을
   못 구할 때 쓰는 것이지 먼저 쓰는 게 아니다.

   ⚠️ indexProxyList 는 배열이 아니라 settle 의 결과({list, errors})를 준다.
      (proxy||[]).length 로 봤더니 객체에 length 가 없어 언제나 거짓이었고,
      토스에서 값이 멀쩡히 왔는데도 버리고 있었다. 검사 4개가 그걸 잡았다. */
async function indexFallback() {
  try {
    const real = await settle(CFG.indices || [], pubIndexOne);
    if (real && (real.list || []).length) return { rows: real, proxy: false };
  } catch (e) { /* 아래 ETF 대체로 */ }
  return { rows: await indexProxyList(), proxy: true };
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
    if (krxReady()) {
      try { return cSet(k, await krxIndex(def), TTL.index); } catch (e) { /* ④ 로 */ }
    }
    return cSet(k, await pubIndexOne(def), TTL.index);
  }
  try {
    return cSet(k, await kisIndexOne(def), TTL.index);
  } catch (e) {
    if (krxReady()) {
      try { return cSet(k, await krxIndex(def), TTL.index); } catch (e2) { /* ④ 로 */ }
    }
    return cSet(k, await pubIndexOne(def), TTL.index);
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
/* ══════════════════════════════════════════════════════════════════════
   ①' 토스 중계 — 집·서버에서 도는 toss-agent 가 넣어 둔 값

   토스는 호출 IP 를 등록해야 하는데 Netlify 의 나가는 IP 는 배포마다 바뀐다.
   서버리스에서는 못 푸는 문제라, 토스에 닿는 부분만 IP 가 고정된 곳으로 옮겼다
   (scripts/toss-agent.js). 그쪽이 Supabase 에 넣고 여기서는 읽기만 한다.

   ⚠️ 신선할 때만 쓴다. 15분이 넘으면 아예 건너뛰고 아래 단계로 내려간다.
      오래된 값을 현재가 자리에 놓으면 '토스 연결됨' 이라고 적힌 채 어제 값을
      보게 된다 — 연결이 끊긴 것보다 그쪽이 나쁘다. 집 인터넷은 IP 가 바뀌고
      PC 는 꺼지므로, 끊기는 건 예외가 아니라 일상이다.
   ══════════════════════════════════════════════════════════════════════ */
const RELAY_FRESH_MIN = 15;
function relayReady() {
  return !!(process.env.SUPABASE_SERVICE_ROLE_KEY &&
            (process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co'));
}
async function relayRows(codeList) {
  const url = (process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co') +
    /* ⚠️ ymd(d) 는 20260816 을 준다. 날짜 비교에는 하이픈이 있어야 하므로 두 번째
       인자를 반드시 넘긴다 — 안 넘기면 조용히 0건이 돌아온다. */
    '/rest/v1/invest_prices?price_date=eq.' + ymd(kstNow(), true) +
    '&code=in.(' + codeList.map(encodeURIComponent).join(',') + ')' +
    '&select=code,close,change_rate,currency,name,src&limit=250';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error('중계 조회 ' + r.status);
  return await r.json();
}
/* src 는 'toss 14:32' 꼴이다. 몇 분 전 값인지 여기서 되짚는다. */
function relayAgeMin(src) {
  const m = String(src || '').match(/^toss\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = kstNow();
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  const then = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const diff = mins - then;
  return diff < 0 ? diff + 1440 : diff;      /* 자정을 넘긴 경우 */
}
function relayShape(row) {
  return {
    code: row.code, market: 'KRX', currency: row.currency || 'KRW',
    name: row.name || '',
    price: num(row.close), change: null,
    changeRate: num(row.change_rate),
    delayed: false, asOf: '',
    src: 'toss-relay', at: new Date().toISOString()
  };
}

/* ══════════════════════════════════════════════════════════════════════
   ④ 공개 시세 — 키가 하나도 없을 때의 마지막 줄 (지연 시세)

   증권사 API 없이 국내 시세를 받을 방법을 찾다가 여기까지 왔다. 결론부터:
   체결 즉시 오는 진짜 실시간은 증권사를 거치지 않으면 못 받는다. 거래소가
   실시간 시세를 유료로 팔고 증권사가 고객에게 뿌리는 구조라, 기술이 아니라
   계약의 문제다. 우회하는 방법을 찾는 건 약관을 어기는 쪽으로 가는 길이다.

   대신 지연 시세는 키 없이 받을 수 있다. 코스피·코스닥·ETF·지수 모두 되는 것을
   확인했다(삼성전자 005930.KS · 에코프로비엠 247540.KQ · KODEX200 069500.KS ·
   ^KS11 · ^KQ11 · ^KS200).

   ⚠️ 반드시 delayed:true 를 달아 내보낸다. 화면이 지연 시세를 현재가처럼
      보여 주면 그게 제일 나쁘다 — 틀린 걸 모르는 채로 판단하게 된다.

   비공식 경로다. 예고 없이 막히거나 모양이 바뀔 수 있다. 그래서 마지막 줄이고,
   앞의 셋(토스·KIS·공공데이터) 중 하나라도 살아 있으면 그쪽이 먼저다.
   ══════════════════════════════════════════════════════════════════════ */
const PUB_HOST = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const PUB_IDX = { kospi: '^KS11', kosdaq: '^KQ11', kospi200: '^KS200' };
/* 코스피(.KS)인지 코스닥(.KQ)인지는 코드만 봐서는 모른다. 한 번 알아내면 기억한다 */
const pubSuffix = new Map();

async function pubFetch(ticker) {
  const url = PUB_HOST + encodeURIComponent(ticker) + '?range=5d&interval=1d';
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error('공개 시세 ' + r.status);
    const j = await r.json();
    const res = ((j.chart || {}).result || [])[0];
    if (!res || !res.meta) throw new Error((((j.chart || {}).error || {}).description) || '빈 응답');
    const q = (((res.indicators || {}).quote || [])[0]) || {};
    /* 종가 배열을 같이 돌려준다 — 등락률을 여기서 직접 계산해야 하기 때문이다.
       ⚠️ meta.chartPreviousClose 를 전일 종가로 쓰면 안 된다. 그건 '요청한
          구간이 시작되기 전' 의 종가라, range=5d 로 부르면 닷새 전 값이다.
          그걸 전일 종가로 쓰는 바람에 삼성전자가 +18.83%, 코스피가 +11.49%
          로 찍혔다. meta.previousClose 는 아예 안 온다. */
    return { meta: res.meta, closes: (q.close || []).filter(v => v != null).map(Number) };
  } finally { clearTimeout(timer); }
}

/* 이 응답이 내가 찾던 그 종목이 맞는가.
   ⚠️ 없는 티커를 물어도 404 가 아니라 '비슷한 것' 을 만들어 돌려준다.
      에코프로비엠(코스닥 247540)을 247540.KS 로 물었더니 200 에
      meta.symbol 도 '247540.KS' 로 맞춰서 왔다. 그런데 내용은
      instrumentType=MUTUALFUND 에 이름이 '247540.KS,0P0001GZPV,623889',
      현재가 194000(실제 116700). 그대로 믿었으면 화면에 다른 종목 값이
      찍혔을 것이다. 종목 코드가 펀드로 올 수는 없으므로 거기서 걸러낸다. */
function pubLooksReal(meta) {
  const type = String(meta.instrumentType || '').toUpperCase();
  if (['EQUITY', 'ETF', 'INDEX'].indexOf(type) < 0) return false;
  const nm = String(meta.longName || meta.shortName || '');
  if (!nm) return false;
  if (nm.indexOf(',') >= 0 && /\d{6}/.test(nm)) return false;   /* 코드 나열은 이름이 아니다 */
  return true;
}

/* 국내 코드 → 코스피(.KS)인지 코스닥(.KQ)인지 찾아 준다 */
async function pubKrTicker(code) {
  const memo = pubSuffix.get(code);
  if (memo) return code + memo;
  const why = [];
  for (const sfx of ['.KS', '.KQ']) {
    try {
      const got = await pubFetch(code + sfx);
      if (!pubLooksReal(got.meta)) { why.push(sfx + '=다른 종목'); continue; }
      pubSuffix.set(code, sfx);
      return code + sfx;
    } catch (e) { why.push(sfx + '=' + String(e.message || e).slice(0, 30)); }
  }
  throw new Error('공개 시세에 ' + code + ' 가 없습니다 (' + why.join(' · ') + ')');
}

function pubShape(got, code, market, currency) {
  const m = got.meta, cl = got.closes || [];
  /* 현재가는 마지막 일봉 종가로 잡는다. 장중이면 그 봉이 진행 중이라
     regularMarketPrice 와 같은 값이고, 장 마감 뒤면 그날 종가다.
     전일 종가는 그 앞 봉이다 — 같은 배열에서 뽑아야 둘이 어긋나지 않는다. */
  const p = cl.length ? cl[cl.length - 1] : num(m.regularMarketPrice);
  /* 봉이 하나뿐일 때만 chartPreviousClose 를 쓴다 — 그때는 '구간 직전 종가'가
     곧 전일 종가라 정확하다. 코스피200(^KS200)이 5일을 물어도 봉을 하나만
     주기 때문에 이 갈래가 필요하다. 봉이 둘 이상이면 절대 쓰지 않는다. */
  const prev = cl.length >= 2 ? cl[cl.length - 2]
             : (cl.length === 1 ? num(m.chartPreviousClose) : null);
  const chg = (p != null && prev != null) ? p - prev : null;
  return {
    code: code, market: market, currency: currency || m.currency || 'KRW',
    name: m.longName || m.shortName || '',
    price: p == null ? null : Math.round(p * 100) / 100,
    change: chg == null ? null : Math.round(chg * 100) / 100,
    changeRate: (chg != null && prev) ? Math.round(chg / prev * 10000) / 100 : null,
    prevClose: prev == null ? null : Math.round(prev * 100) / 100,
    high52: num(m.fiftyTwoWeekHigh), low52: num(m.fiftyTwoWeekLow),
    volume: num(m.regularMarketVolume),
    /* 지연 시세라는 사실을 지우지 않는다 */
    delayed: true,
    asOf: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : '',
    src: 'public', at: new Date().toISOString()
  };
}

async function pubQuote(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (s.indexOf(':') > 0) {                       /* 'NAS:AAPL' → 해외 */
    const symb = s.split(':')[1];
    const got = await pubFetch(symb);
    if (!pubLooksReal(got.meta)) throw new Error('공개 시세에 ' + symb + ' 가 없습니다');
    return pubShape(got, symb, s.split(':')[0], 'USD');
  }
  const t = await pubKrTicker(s);
  return pubShape(await pubFetch(t), s, 'KRX', 'KRW');
}

async function pubIndexOne(def) {
  const sym = PUB_IDX[def.id];
  if (!sym) throw new Error('공개 시세에 지수 ' + def.id + ' 표기가 없습니다');
  const q = pubShape(await pubFetch(sym), def.code, 'KRX', 'KRW');
  return { id: def.id, name: def.name, code: def.code,
           price: q.price, change: q.change, changeRate: q.changeRate, volume: q.volume,
           delayed: true, asOf: q.asOf, src: 'public', at: q.at };
}

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
    return blocks.slice(0, 20).map(b => {
      let title = pick(b, 'title');
      let press = feed.name;
      /* 모아 주는 피드(구글 뉴스 같은)는 <source> 에 <b>진짜 언론사</b>를 담고
         제목 끝에 「 - 언론사」 를 붙여 준다. 그걸 그대로 두면 언론사 칸에
         「보험 상품 출시」 같은 <b>질의문이 언론사인 척</b> 찍힌다.
         그래서 진짜 언론사를 꺼내 오고 제목에서는 꼬리를 뗀다.
         config 에서 gnews 로 <b>표시한 피드에만</b> 적용한다 —
         다른 피드가 <source> 를 다른 뜻으로 쓸 수도 있다.            */
      if (feed.gnews) {
        const real = pick(b, 'source');
        if (real) {
          press = real;
          const tail = ' - ' + real;
          if (title.slice(-tail.length) === tail) title = title.slice(0, -tail.length);
        }
      }
      return {
        title: title,
        link: pickLink(b),
        date: pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated') || pick(b, 'dc:date'),
        desc: (pick(b, 'description') || pick(b, 'summary')).slice(0, 200),
        source: press
      };
    }).filter(x => x.title && x.link);
  } catch (e) {
    return [];                      /* 한 피드가 죽어도 나머지는 그대로 나온다 */
  } finally { clearTimeout(timer); }
}
/* ── 공시실에서 「상품요약서」 주소만 찾아 온다 ─────────────────────
   원수사 자료를 우리 서버에 두지 않는다는 원칙은 그대로다 (CLAUDE.md 9).
   그래서 <b>PDF 는 절대 받지 않는다.</b> 여기서 받는 것은 협회의 상품비교
   공시 <b>목록 페이지</b>뿐이고, 돌려주는 것은 상품명·회사·<b>내려받기 주소</b>
   몇 KB 짜리 JSON 이다. 실제 내려받기는 <b>브라우저가 직접</b> 한다.

   브라우저가 이 목록을 스스로 못 받는 이유는 협회 서버가 「바깥에서
   읽어도 좋다」는 표시를 안 달아 두었기 때문이다. 그 한 겹만 여기서
   넘겨 준다.

   ※ 여기 있는 것은 <b>상품요약서</b>다. 약관 원문이 아니다 —
     약관은 각 회사 공시실에만 있다.
   ※ 생명보험만이다. 손해보험은 협회가 다르다(kpub.knia.or.kr).       */
function gongsiCode(name) {
  const map = (GONGSI['생명보험']) || {};
  if (!name) return '';
  const n = String(name).replace(/\s/g, '');
  /* 똑같은 이름이 있으면 그것부터. 「생명」 두 글자만 주셨을 때
     제일 긴 회사가 잡히는 일이 없게 한다. */
  for (const k of Object.keys(map)) if (k.replace(/\s/g, '') === n) return map[k];
  let best = '', bl = 0;
  for (const k of Object.keys(map)) {                  /* 그 다음은 긴 이름부터 — 「DB생명」을 다른 곳으로 잘못 잡지 않게 */
    const kk = k.replace(/\s/g, '');
    if ((n.indexOf(kk) >= 0 || kk.indexOf(n) >= 0) && kk.length > bl) { best = map[k]; bl = kk.length; }
  }
  return best;
}
function gongsiParse(html, cap) {
  const HOST = 'https://pub.insure.or.kr';
  const strip = x => String(x || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  /* 상품 한 건은 목록 체크박스에서 시작한다 — 거기서 다음 체크박스 전까지가 그 상품 몫 */
  const parts = String(html).split(/<input[^>]+name="listAprChk"/);
  const out = [];
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    const co = (seg.match(/id="l_memberNm_[^"]*"[^>]*>([^<]*)</) || [])[1];
    const nm = (seg.match(/id="l_prodNm_[^"]*"[^>]*>([^<]*)</) || [])[1];
    if (!co || !nm) continue;
    const fd = seg.match(/fn_fileDown\('(\d+)',\s*'(\d+)'\)/);
    const pg = (seg.match(/<a\s+href="(https?:\/\/[^"]+)"[^>]*target="_blank"/) || [])[1];
    out.push({
      co: strip(co), prod: strip(nm),
      file: fd ? (HOST + '/FileDown.do?fileNo=' + fd[1] + '&seq=' + fd[2]) : null,
      page: pg || null
    });
    if (out.length >= (cap || 60)) break;
  }
  return out;
}
async function gongsiList(coNm, q) {
  const cd = gongsiCode(coNm);
  if (!cd) {
    const names = Object.keys((GONGSI['생명보험']) || {});
    const e = new Error(coNm ? ('생명보험협회 공시에서 「' + coNm + '」 을(를) 못 찾았습니다.')
                             : '어느 회사인지 알려 주세요.');
    e.companies = names;                 /* 고를 수 있게 이름만 함께 준다 */
    throw e;
  }
  const url = (GONGSI['목록주소'] || '') + '?search_memberCd=' + encodeURIComponent(cd) + '&pageUnit=200';
  /* 시간 셈 — 이 함수는 10초에 끊긴다. 재 보니 한 번 받는 데 0.5~4.1초였다.
     그래서 첫 판은 6초까지 기다리고, <b>빨리 실패했을 때만</b> 한 번 더 해 본다.
     연달아 두드리면 협회가 잠깐 막는 것을 봤다 — 그때는 조금 쉬었다 가면 된다.
     느리게 실패한 것(시간 초과)은 다시 해 볼 시간이 없으니 그냥 알린다.
     제일 오래 걸려도 6 + 0.6 + 2.5 = 9.1초라 10초 안에 끝난다.        */
  async function once(ms) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error('협회 공시실이 ' + r.status + ' 로 답했습니다.');
      return await r.text();
    } finally { clearTimeout(timer); }
  }
  let html, t0 = Date.now();
  try {
    html = await once(6000);
  } catch (e1) {
    if (Date.now() - t0 > 2500) throw e1;            /* 느리게 실패 — 다시 할 시간이 없다 */
    await new Promise(r => setTimeout(r, 600));      /* 잠깐 쉬었다 한 번만 더 */
    html = await once(2500);
  }
  let rows = gongsiParse(html, 200);
  if (!rows.length) throw new Error('협회 공시실에서 목록을 읽지 못했습니다 — 페이지가 바뀐 것 같습니다.');
  /* 같은 상품이 두 번 오면 받기 단추도 두 번 뜬다. 중복은 받지 않는다.
     같은 파일을 가리키거나 회사+상품명이 같으면 한 건으로 본다. */
  {
    const seen = {}, uniq = [];
    for (const r of rows) {
      const key = (r.file || (r.co + '|' + r.prod)).trim();
      if (seen[key]) continue;
      seen[key] = 1; uniq.push(r);
    }
    rows = uniq;
  }
  const total = rows.length;
  /* 상품명으로 좁히는 일은 여기서 한다. 협회 검색칸은 상품명이 아니라
     보장 내용으로 걸러서, 상품명으로 찾으면 엉뚱한 것이 딸려 온다. */
  if (q) {
    const key = String(q).replace(/\s/g, '');
    const hit = rows.filter(x => x.prod.replace(/\s/g, '').indexOf(key) >= 0);
    if (hit.length) rows = hit;
    else return { rows: rows.slice(0, 60), total: total, matched: 0, q: q, co: coNm };
  }
  return { rows: rows.slice(0, 60), total: total, matched: q ? rows.length : null, q: q || '', co: coNm };
}

/* config/sources.json 에서 진짜 피드 칸만 (「_」 메모와 「키워드_」 낱말 목록은 뺀다) */
function feedCats() {
  return Object.keys(SOURCES).filter(k => k[0] !== '_' && k.indexOf('키워드_') !== 0
                                          && Array.isArray(SOURCES[k]) && SOURCES[k].length
                                          && SOURCES[k][0] && SOURCES[k][0].url);
}
async function news(cat) {
  const nc = CFG.news || {};
  /* cat=보험,부동산 처럼 여러 칸을 한 번에 부를 수 있다. 앱이 칸을 나눠
     보여 주려면 한 번에 다 받아 오는 편이 왕복이 적고 빠르다.        */
  const asked = cat && cat !== 'all'
    ? String(cat).split(',').map(s => s.trim()).filter(Boolean)
    : (nc.categories || feedCats());
  const known = feedCats();
  const cats = asked.filter(c => known.indexOf(c) >= 0);
  const k = 'n:' + cats.join(',');
  const hit = cGet(k);
  if (hit) return hit;

  let feeds = [];
  cats.forEach(c => { (SOURCES[c] || []).forEach(f => feeds.push(f)); });
  if (!feeds.length) return cSet(k, { items: [], keywords: [], cats: known }, 60);

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

  /* 한 칸만 부르면 30건, 여러 칸을 부르면 칸마다 그만큼 — 칸을 나눠 놓고
     보여 줄 때 한 칸이 다른 칸 자리를 다 먹지 않게 한다.            */
  const cap = Math.max(nc.max_items || 30, cats.length * (nc.max_per_cat || 25));
  return cSet(k, { items: items.slice(0, cap), keywords: kws, cats: known }, TTL.news);
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
    /* ── 토스 API 명세 받아오기 ────────────────────────────────────────
       경로를 하나씩 두들겨 찾는 건 시간이 오래 걸리고 헛다리를 짚는다.
       토스는 /api/v1/ 아래 전부를 401 로 돌려주기 때문에, 토큰 없이는
       경로가 있는지 없는지도 구분되지 않는다. 명세 문서를 토큰으로 받아
       경로 목록을 통째로 읽는 편이 확실하다. 읽기만 한다. */
    if (kind === 'toss-spec') {
      const c = tossCfg();
      let tok = '';
      try { tok = await tossToken(); }
      catch (e) {
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, meta: meta, step: 'token', message: String(e.message || e) }) };
      }
      const base = String(c.base).replace(/\/+$/, '');
      const cands = ['/api/v1/openapi.json', '/openapi.json', '/api/v1/v3/api-docs', '/api/v1/api-docs', '/api/v1/swagger.json'];
      const tried = [];
      for (const p of cands) {
        try {
          const r = await fetch(base + p, {
            headers: { Authorization: 'Bearer ' + tok, Accept: 'application/json' },
            signal: AbortSignal.timeout(12000)
          });
          const txt = await r.text();
          if (r.ok) {
            let j = null; try { j = JSON.parse(txt); } catch (_) { /* JSON 이 아니면 아래로 */ }
            if (j && j.paths) {
              return {
                statusCode: 200, headers: cors,
                body: JSON.stringify({
                  ok: true, meta: meta, specPath: p,
                  title: (j.info || {}).title || '', version: (j.info || {}).version || '',
                  servers: (j.servers || []).map(s => s.url),
                  paths: Object.keys(j.paths).slice(0, 300)
                })
              };
            }
          }
          tried.push({ path: p, status: r.status, head: txt.slice(0, 180) });
        } catch (e) { tried.push({ path: p, error: String(e.message || e).slice(0, 140) }); }
      }
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, meta: meta, step: 'spec', tokenIssued: !!tok, tried: tried }) };
    }

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
        const msg = String(e.message || e);
        /* "IP 가 허용 목록에 없다" 는 답이 오면, 정작 그 IP 가 뭔지를 알려주지 않는다.
           등록해야 할 값을 모르면 손을 쓸 수가 없어서 여기서 직접 물어본다.
           Netlify 함수는 나가는 IP 가 고정이 아닐 수 있으니 여러 번 불러 보고
           같은 값이면 등록, 매번 달라지면 등록으로는 못 푼다는 판단이 선다. */
        let outbound = null;
        if (/IP|ip address|access_denied|403/i.test(msg)) {
          try {
            const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(6000) });
            if (r.ok) outbound = (await r.json()).ip || null;
          } catch (_) { /* 못 알아내도 진단은 계속한다 */ }
        }
        return {
          statusCode: 200, headers: cors,
          body: JSON.stringify({
            ok: false, meta: meta, step: 'token', message: msg,
            outboundIp: outbound,
            hint: outbound
              ? ('이 서버가 나갈 때 쓰는 IP 는 ' + outbound + ' 입니다. 토스 허용 IP 에 넣어 보세요. '
                 + '이 진단을 몇 번 더 불러 IP 가 매번 같은지 확인하세요 — 매번 다르면 등록으로는 풀리지 않습니다.')
              : 'token_path 와 token_style(form/json/basic) 을 문서에 맞게 고치세요. 호출 IP 등록도 확인하세요.'
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
      let r, isProxy = false;
      if (hasIndexSource()) { r = await settle(CFG.indices || [], indexOne); }
      else { const f = await indexFallback(); r = f.rows; isProxy = f.proxy; }
      return {
        statusCode: 200, headers: cors,
        body: JSON.stringify({
          ok: r.list.length > 0, meta: meta, indices: r.list,
          proxy: isProxy,
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
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, meta: meta, news: n.items, keywords: n.keywords, cats: n.cats || feedCats() }) };
    }

    /* ── 공시실 상품요약서 주소 찾기 (PDF 는 안 받는다 — 주소만) ──────── */
    if (kind === 'gongsi') {
      try {
        const g = await gongsiList(q.co || '', q.q || '');
        return { statusCode: 200, headers: cors,
          body: JSON.stringify({ ok: true, meta: meta, kindOf: '상품요약서',
            note: '상품요약서입니다 — 약관 원문이 아닙니다. 약관은 각 회사 공시실에 있습니다.',
            co: g.co, q: g.q, total: g.total, matched: g.matched, items: g.rows }) };
      } catch (e) {
        /* 못 찾아도 화면이 멈추지 않게 — 왜 안 됐는지 그대로 말한다 */
        return { statusCode: 200, headers: cors,
          body: JSON.stringify({ ok: false, meta: meta, items: [],
            companies: (e && e.companies) || null,
            message: (e && e.message) || '공시실에서 찾지 못했습니다.' }) };
      }
    }

    /* ── 경제동향 화면 첫 로딩 — 지수·지표·뉴스·관심종목을 한 번에 ─────── */
    if (kind === 'all') {
      const wl = (CFG.watchlist || []).map(w => w.code);
      const [idx, ec, nw, wq] = await Promise.all([
        hasIndexSource() ? settle(CFG.indices || [], indexOne) : indexFallback().then(f => f.rows),
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

/* 검사에서만 쓰는 통로 — 공개 지연 시세의 판정과 계산을 밖에서 확인한다.
   node scripts/check-public-quote.js */
exports._pub = { looksReal: pubLooksReal, shape: pubShape };
exports._relay = { ageMin: relayAgeMin, shape: relayShape, freshMin: RELAY_FRESH_MIN };
