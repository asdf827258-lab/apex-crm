/* ════════════════════════════════════════════════════════════════════════
   뉴스 · 공시 수집기

   ⚠️ 여기에는 토스가 없다. 토스증권 Open API 에는 뉴스도 커뮤니티도 없다 —
      공식 규격(openapi.json v1.2.14) 엔드포인트 33개를 전부 확인했고
      community / comment / opinion / sentiment / news / discussion 단어 자체가
      없다. 뉴스는 처음부터 별개 소스에서 온다. 토스는 시세·종목정보·시장정보·
      계좌·주문에만 쓴다.

   ── 소스 ────────────────────────────────────────────────────────────────
     국내 뉴스   구글 뉴스 RSS (기업명 검색) + config/sources.json 의 RSS
     해외 뉴스   구글 뉴스 RSS (티커 + 회사명 검색, 영문)
     국내 공시   DART  opendart.fss.or.kr        · DART_API_KEY 필요(무료)
     미국 공시   SEC   data.sec.gov              · 키 없음, User-Agent 필수

   ── 확인한 것 ───────────────────────────────────────────────────────────
     구글 뉴스 RSS  기업명·티커 검색 100건 회신 (제목·URL·언론사·시각)
     SEC            company_tickers.json + submissions/CIK##########.json 회신
     DART           키 없이 부르면 {"status":"010","message":"등록되지 않은 인증키입니다."}
                    → 엔드포인트는 맞고 키만 있으면 된다
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const UA_NEWS = 'Mozilla/5.0 (compatible; ApexYunPro/1.0)';
/* SEC 는 연락처가 담긴 User-Agent 를 요구한다. 없으면 403 으로 막는다. */
const UA_SEC = process.env.SEC_USER_AGENT || 'apex-crm/1.0 (contact: asdf827258@gmail.com)';

function txt(block, tag) {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i'));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
             .replace(/<[^>]+>/g, ' ')
             .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
             .replace(/\s+/g, ' ').trim();
}

async function get(url, headers, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: headers || {} });
    if (!r.ok) throw new Error(r.status + ' ' + url.slice(0, 70));
    return await r.text();
  } finally { clearTimeout(timer); }
}

/* ── 뉴스 ───────────────────────────────────────────────────────────────
   구글 뉴스 RSS 는 기사 '본문' 을 주지 않는다. 제목·링크·언론사·시각만 온다.
   그래서 아래 summary 는 비워 둔다. 본문을 긁어 오지 않는 이유는 두 가지다 —
   남의 저작물이고, 매체마다 구조가 달라 조용히 엉뚱한 글을 담게 된다.
   AI 에게도 "제목만 주어졌다" 고 분명히 알려서 없는 내용을 지어내지 않게 한다. */
function newsQuery(q, lang) {
  const p = lang === 'en'
    ? { hl: 'en-US', gl: 'US', ceid: 'US:en' }
    : { hl: 'ko', gl: 'KR', ceid: 'KR:ko' };
  return 'https://news.google.com/rss/search?q=' + encodeURIComponent(q) +
         '&hl=' + p.hl + '&gl=' + p.gl + '&ceid=' + p.ceid;
}

async function fetchNews(query, lang, limit) {
  const xml = await get(newsQuery(query, lang), { 'User-Agent': UA_NEWS, Accept: 'application/rss+xml, application/xml, */*' });
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const out = [];
  for (const b of blocks.slice(0, limit || 30)) {
    const title = txt(b, 'title');
    const link = txt(b, 'link');
    if (!title || !link) continue;
    const pub = txt(b, 'pubDate');
    const t = Date.parse(pub);
    out.push({
      title: title,
      url: link,
      source: txt(b, 'source') || '출처미상',
      publishedAt: isFinite(t) ? new Date(t).toISOString() : null,
      summary: '',                 /* RSS 는 본문을 주지 않는다 — 비워 둔다 */
      lang: lang === 'en' ? 'en' : 'ko'
    });
  }
  return out;
}

/* 한 종목에 대해 여러 각도로 물어보고 합친다. 검색어 하나로는 놓치는 게 많다.
   ⚠️ 티커만으로 검색하면 엉뚱한 게 섞인다 — 미국은 'NVDA stock' 처럼 묶고,
      국내는 6자리 코드가 뉴스에 거의 안 쓰이므로 회사 이름으로만 찾는다. */
async function newsFor(stock, opts) {
  const o = opts || {};
  const name = String(stock.name || '').trim();
  const ticker = String(stock.ticker || '').trim();
  const overseas = !!stock.overseas;

  const queries = [];
  if (overseas) {
    if (ticker) queries.push({ q: ticker + ' stock when:3d', lang: 'en' });
    if (name) queries.push({ q: '"' + name + '" when:3d', lang: 'en' });
  } else {
    if (name) queries.push({ q: name + ' when:3d', lang: 'ko' });
    if (name) queries.push({ q: name + ' 주가 OR 실적 OR 공시 when:3d', lang: 'ko' });
  }
  if (!queries.length) return { items: [], errors: ['검색어를 만들 수 없습니다 (이름·티커 없음)'] };

  const items = [], errors = [];
  for (const q of queries) {
    try { items.push(...await fetchNews(q.q, q.lang, o.limit || 25)); }
    catch (e) { errors.push(q.q.slice(0, 30) + ' → ' + String(e.message || e).slice(0, 60)); }
  }
  return { items: items, errors: errors };
}

/* ── 국내 공시 · DART ───────────────────────────────────────────────────
   corp_code 는 종목코드가 아니라 DART 고유번호(8자리)다. 둘을 헷갈리면
   조용히 0건이 나온다. 매핑표는 corpCode 인자로 밖에서 넣어 준다. */
function dartReady() { return !!process.env.DART_API_KEY; }

async function dartFor(corpCode, days) {
  if (!dartReady()) return { items: [], note: 'DART_API_KEY 가 없습니다 (무료 발급: opendart.fss.or.kr)' };
  if (!corpCode) return { items: [], note: 'DART 고유번호(corp_code)를 모릅니다 — 종목코드와 다릅니다' };

  const end = new Date(), bgn = new Date(Date.now() - (days || 7) * 86400000);
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const url = 'https://opendart.fss.or.kr/api/list.json?crtfc_key=' + encodeURIComponent(process.env.DART_API_KEY) +
              '&corp_code=' + encodeURIComponent(corpCode) +
              '&bgn_de=' + ymd(bgn) + '&end_de=' + ymd(end) + '&page_count=20';
  const raw = await get(url, {}, 12000);
  let j = {};
  try { j = JSON.parse(raw); } catch (e) { return { items: [], note: 'DART 응답이 JSON 이 아닙니다' }; }

  /* 013 = 조회된 데이터가 없음. 오류가 아니라 '공시가 없다' 는 뜻이다. */
  if (j.status === '013') return { items: [], note: '최근 ' + (days || 7) + '일 공시 없음' };
  if (j.status !== '000') return { items: [], note: 'DART ' + j.status + ' ' + String(j.message || '').slice(0, 60) };

  return {
    items: (j.list || []).map(x => ({
      kind: 'DART', title: x.report_nm, date: x.rcept_dt,
      url: 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=' + x.rcept_no,
      filer: x.flr_nm, note: x.rm || ''
    })),
    note: ''
  };
}

/* ── 미국 공시 · SEC EDGAR ──────────────────────────────────────────────
   키는 없지만 연락처가 든 User-Agent 를 요구한다. 없으면 403 이다.
   티커→CIK 표는 한 번 받아 두고 컨테이너가 사는 동안 재사용한다. */
let secMap = null, secMapAt = 0;
async function secCik(ticker) {
  if (!secMap || Date.now() - secMapAt > 12 * 3600 * 1000) {
    const raw = await get('https://www.sec.gov/files/company_tickers.json', { 'User-Agent': UA_SEC }, 20000);
    const j = JSON.parse(raw);
    secMap = {};
    Object.keys(j).forEach(k => { secMap[String(j[k].ticker).toUpperCase()] = String(j[k].cik_str).padStart(10, '0'); });
    secMapAt = Date.now();
  }
  return secMap[String(ticker || '').toUpperCase()] || null;
}

/* 사람이 볼 서류만 남긴다. Form 4(임원 매매)와 Form 3 은 하루에도 여러 건
   쏟아져 목록을 덮어 버리므로 기본에서 뺀다 — 필요하면 forms 로 넣어 준다.

   ⚠️ 13F-HR 과 13D/G 를 빠뜨렸다가 잡았다. NVDA 를 30일로 조회했더니 0건이
      나왔는데, 같은 시각 뉴스에는 "Nvidia discloses $21 billion stake in
      SpaceX" 가 떠 있었다. 그 근거가 8-K 가 아니라 2026-08-14 자 13F-HR
      이었다. 기사가 되는 공시를 공시 목록이 안 보여 주면 안 된다. */
const SEC_FORMS = ['8-K', '10-Q', '10-K', '6-K', '20-F', 'S-1', 'DEF 14A',
                   '13F-HR', 'SCHEDULE 13D', 'SCHEDULE 13G'];

async function secFor(ticker, days, forms) {
  const cik = await secCik(ticker);
  if (!cik) return { items: [], note: ticker + ' 의 CIK 를 찾지 못했습니다' };
  const raw = await get('https://data.sec.gov/submissions/CIK' + cik + '.json', { 'User-Agent': UA_SEC }, 20000);
  const j = JSON.parse(raw);
  const r = (j.filings || {}).recent || {};
  const want = forms || SEC_FORMS;
  const since = Date.now() - (days || 14) * 86400000;

  const out = [];
  for (let i = 0; i < (r.form || []).length && out.length < 20; i++) {
    if (want.indexOf(r.form[i]) < 0) continue;
    const t = Date.parse(r.filingDate[i]);
    if (isFinite(t) && t < since) break;                 /* 최신순이므로 여기서 끊는다 */
    out.push({
      kind: 'SEC', title: r.form[i] + (r.primaryDocDescription[i] ? ' · ' + r.primaryDocDescription[i] : ''),
      date: r.filingDate[i],
      url: 'https://www.sec.gov/Archives/edgar/data/' + parseInt(cik, 10) + '/' +
           String(r.accessionNumber[i]).replace(/-/g, '') + '/' + r.primaryDocument[i],
      filer: j.name, note: ''
    });
  }
  return { items: out, note: out.length ? '' : '최근 ' + (days || 14) + '일 주요 공시 없음' };
}

async function disclosuresFor(stock, opts) {
  const o = opts || {};
  try {
    return stock.overseas
      ? await secFor(stock.ticker, o.days || 14)
      : await dartFor(stock.corpCode, o.days || 7);
  } catch (e) {
    return { items: [], note: '공시 조회 실패: ' + String(e.message || e).slice(0, 80) };
  }
}

module.exports = { fetchNews, newsFor, dartFor, secFor, secCik, disclosuresFor, dartReady, SEC_FORMS };
