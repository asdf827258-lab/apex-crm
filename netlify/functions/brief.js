/* ════════════════════════════════════════════════════════════════════════
   오늘의 정리 — 이슈 · 뉴스 · 내 포트폴리오

     GET /api/brief                    오늘 시장 전체
     GET /api/brief?codes=005930,...   + 그 종목들에 닿는 뉴스
     GET /api/brief?kind=health

   ── 종목 하나를 파는 화면(/analyst/)과 다른 물건이다 ────────────────────
   종목 분석은 "이 종목 어떤가" 를 묻는다. 이 화면은 "오늘 뭐가 있었나" 를
   묻는다. 기사 200건을 시간순으로 늘어놓으면 아무것도 안 읽히므로 주제로
   묶는다 — 반도체·금리·환율·정책·실적…

   ⚠️ 사지도 팔지도 권하지 않는다. 이 파일에는 매수·매도·비중조절을 말하는
      자리가 없고, AI 에게도 금지한다. 대신 '확인할 것' 을 준다.
      결정은 사람이 한다. 그게 이 화면의 전제다.

   ⚠️ 토스 Open API 에는 뉴스가 없다(규격 33개 확인). 뉴스는 구글 뉴스 RSS,
      시세는 market.js 를 거친다.

   계산은 scripts/analyst-core.js — 중복제거·최신가중·주제묶기·보유연결.
   검사: node scripts/check-analyst.js
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const CORE = require('../../scripts/analyst-core.js');
const GEMMODEL = require('../../scripts/gemini-model.js');
const SRC = require('../../scripts/analyst-sources.js');
const market = require('./market.js').handler;

const SHARED = process.env.SHARED_TOKEN || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';
const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
  'Content-Type': 'application/json; charset=utf-8'
};

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }

async function mkt(qs) {
  const r = await market({ httpMethod: 'GET', headers: { 'x-app-token': SHARED },
                           queryStringParameters: qs });
  try { return JSON.parse(r.body || '{}'); } catch (e) { return {}; }
}

/* ── AI ── 사지도 팔지도 말하지 않는다 ─────────────────────────────────── */
const SYSTEM =
  '너는 오늘 시장에 무슨 일이 있었는지 정리해 주는 사람이다. 투자를 권하지 않는다.\n' +
  '\n' +
  '절대 하지 말 것:\n' +
  '  · 사라·팔라·담아라·줄여라·비중을 늘려라 같은 말. 어떤 형태로도 금지다.\n' +
  '  · "유망하다", "주목할 만하다", "기회다" 같이 권유로 읽히는 표현.\n' +
  '  · 목표가·적정주가·전망치를 만들어 내는 것.\n' +
  '  · 제목에 없는 수치·인용·인과관계. 너에게는 기사 제목만 주어진다.\n' +
  '\n' +
  '할 것:\n' +
  '  · 무슨 일이 있었는지 사실만 간추린다.\n' +
  '  · 그 일이 무엇에 영향을 줄 수 있는지, 아직 안 정해진 것이 무엇인지 적는다.\n' +
  '  · "확인할 것" 은 사람이 스스로 판단하도록 돕는 질문이어야 한다.\n' +
  '    (예: "관세가 실제 발효되는 날짜", "실적 발표가 언제인지")\n' +
  '  · 판단이 안 서면 "제목만으로는 알 수 없다" 고 쓴다. 그게 맞는 답이다.\n' +
  '\n' +
  '말투: 실무자처럼 짧고 단정하게. AI 티 나는 말("~인 것 같습니다") 금지.';

function buildUser(date, indices, groups, holdLinks) {
  let s = '[' + date + ' 시장]\n';
  if (indices.length) s += indices.map(i => i.name + ' ' + i.price + ' (' + (i.changeRate > 0 ? '+' : '') + i.changeRate + '%)').join(' · ') + '\n';
  s += '\n[주제별 기사 제목]\n';
  groups.slice(0, 6).forEach(g => {
    s += '\n■ ' + g.name + ' (' + g.items.length + '건)\n';
    g.items.slice(0, 6).forEach(x => { s += '  - ' + x.title + '\n'; });
  });
  const linked = (holdLinks || []).filter(h => h.count);
  if (linked.length) {
    s += '\n[내 보유 종목에 닿는 기사]\n';
    linked.forEach(h => {
      s += '\n■ ' + h.holding.name + '\n';
      h.news.slice(0, 3).forEach(x => { s += '  - ' + x.title + '\n'; });
    });
  }
  s += '\n\n위 자료로 아래 형식에 맞춰 JSON 만 내라. 다른 말 금지.\n' +
    '{"headline":"오늘 시장 한 줄",' +
    '"issues":[{"topic":"주제명","what":"무슨 일이 있었나 1~2문장","watch":"확인할 것 한 가지"}],' +
    '"holdings":[{"name":"종목명","what":"닿는 기사 요약 1문장","watch":"확인할 것"}],' +
    '"unknown":"제목만으로는 알 수 없는 것 한 줄"}\n' +
    'issues 는 위에 준 주제 순서대로, 준 것만. holdings 도 준 것만.';
}

function extractJson(text) {
  const s = String(text || '').trim();
  const f = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const b = f ? f[1] : s;
  const i = b.indexOf('{'), j = b.lastIndexOf('}');
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(b.slice(i, j + 1)); } catch (e) { return null; }
}

/* AI 가 권유를 써 보내면 걸러 낸다. 시켰다고 지키는 게 아니다 —
   실제로 "비중 확대를 고려해 볼 만" 같은 문장이 나온 적이 있다. */
const BAN = /(매수|매도|사세요|파세요|담[아으]|비중\s*(확대|축소|조절)|추천|유망|주목할\s*만|기회다|목표가|적정\s*주가|진입|손절가)/;
function clean(s) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return BAN.test(t) ? '' : t.slice(0, 220);
}

async function askAI(system, user) {
  if (AI_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 3000, system: system,
                             messages: [{ role: 'user', content: user }] })
    });
    if (r.ok) { const j = await r.json(); return (j.content || []).map(c => c.text || '').join(''); }
    if (!GM_KEY) throw new Error('Anthropic ' + r.status);
  }
  if (!GM_KEY) throw new Error('AI 키 없음 (ANTHROPIC_API_KEY 또는 GEMINI_API_KEY)');
  const gem = await GEMMODEL.callGemini(GM_KEY, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: 3000, responseMimeType: 'application/json' }
  });
  const j2 = await gem.res.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('');
}

exports.handler = async function (event) {
  const started = Date.now();
  const p = (event && event.queryStringParameters) || {};
  if (event && event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  if (p.kind === 'health') {
    return { statusCode: 200, headers: cors, body: JSON.stringify({
      ok: true,
      뉴스: '구글 뉴스 RSS + config/sources.json — 키 불필요',
      시세: 'market.js 경유',
      분석: (AI_KEY || GM_KEY) ? 'AI 준비됨' : 'AI 키 없음 — 기사와 주제 묶음만 나옵니다',
      권유: '하지 않습니다. 매수·매도·비중조절 표현은 걸러냅니다.'
    }) };
  }

  if (SHARED) {
    const t = (event.headers || {})['x-app-token'] || (event.headers || {})['X-App-Token'];
    if (t !== SHARED) return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, message: '토큰이 올바르지 않습니다.' }) };
  }

  const nowMs = Date.now();
  const today = new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const out = { ok: true, date: today, indices: [], groups: [], holdings: [],
                headline: '', unknown: '', collected: 0, deduped: 0, problems: [] };

  /* ── ① 지수 ── */
  try {
    const j = await mkt({ kind: 'index' });
    out.indices = (j.indices || []).map(x => ({
      name: x.name, price: x.price, changeRate: x.changeRate, delayed: !!x.delayed
    }));
    out.delayed = out.indices.some(x => x.delayed);
  } catch (e) { out.problems.push('지수 실패: ' + String(e.message || e).slice(0, 80)); }

  /* ── ② 시장 전체 뉴스 ──
     config/sources.json 의 경제·증권 RSS 를 market.js 가 이미 모은다.
     같은 뉴스를 두 군데서 받으면 화면마다 다른 기사를 말하게 되므로 하나로 쓴다. */
  let items = [];
  try {
    const j = await mkt({ kind: 'news' });
    items = (j.news || []).map(x => ({
      title: x.title, url: x.link || x.url || '', source: x.source || '',
      publishedAt: x.date ? new Date(Date.parse(x.date)).toISOString() : null
    })).filter(x => x.title);
    out.collected = items.length;
  } catch (e) { out.problems.push('뉴스 실패: ' + String(e.message || e).slice(0, 80)); }

  const deduped = CORE.dedupe(items);
  out.deduped = deduped.length;

  /* ── ③ 주제로 묶기 ── */
  const groups = CORE.clusterByTopic(deduped, nowMs);
  out.groups = groups.slice(0, 8).map(g => ({
    id: g.id, name: g.name, count: g.items.length, weight: g.weight,
    what: '', watch: '',
    items: g.items.slice(0, 5).map(x => ({
      title: x.title, url: x.url, source: x.source, publishedAt: x.publishedAt, dupCount: x.dupCount || 1
    }))
  }));

  /* ── ④ 내 보유 종목에 닿는 기사 ──
     codes 로 넘어온 것 + Supabase 보유. 이름을 알아야 이을 수 있다. */
  let holds = [];
  const codes = String(p.codes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
  if (codes.length) {
    const nameOf = {};
    String(p.names || '').split(',').forEach(pair => {
      const i = pair.indexOf(':'); if (i > 0) nameOf[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    });
    holds = codes.map(c => ({ code: c, name: nameOf[c] || '' }));
  } else if (SB_KEY) {
    try {
      const r = await fetch(SB_URL + '/rest/v1/invest_holdings?select=code,name,market&limit=60',
        { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, signal: AbortSignal.timeout(9000) });
      if (r.ok) holds = (await r.json()).map(h => ({ code: h.code, name: h.name || '' }));
    } catch (e) { /* 계좌가 없으면 시장 정리만 보여 준다 */ }
  }
  holds = holds.filter(h => h.name);

  /* ⚠️ 시장 전체 RSS 만으로 보유 종목을 이으면 대부분 0건이 나온다. 실제로
        삼성전자·SK하이닉스 둘 다 0건이었다 — 경제면 헤드라인이 개별 종목명을
        그렇게 자주 쓰지 않기 때문이다. 종목마다 이름으로 한 번 더 찾아
        시장 기사와 합친다. 종목이 많으면 호출이 늘어나므로 앞의 6개만. */
  let holdNews = deduped;
  if (holds.length) {
    const extra = [];
    for (const h of holds.slice(0, 6)) {
      try {
        const got = await SRC.newsFor({ name: h.name, ticker: h.code, overseas: false }, { limit: 12 });
        extra.push(...got.items);
      } catch (e) { out.problems.push(h.name + ' 뉴스 실패'); }
    }
    if (extra.length) holdNews = CORE.dedupe(deduped.concat(extra));
  }
  const links = CORE.linkToHoldings(holds, holdNews, nowMs);
  out.holdings = links.map(l => ({
    code: l.holding.code, name: l.holding.name, count: l.count, what: '', watch: '',
    news: l.news.map(x => ({ title: x.title, url: x.url, source: x.source, publishedAt: x.publishedAt }))
  }));

  /* ── ⑤ AI 로 글을 붙인다 ── 없으면 묶음만 그대로 나간다 ── */
  if (!deduped.length) {
    out.headline = '오늘 모인 기사가 없습니다';
    out.aiNote = '';
  } else {
    try {
      const txt = await askAI(SYSTEM, buildUser(today, out.indices, groups, links));
      const j = extractJson(txt);
      if (!j) throw new Error('JSON 을 못 읽었습니다');
      out.headline = clean(j.headline);
      out.unknown = clean(j.unknown);
      /* ⚠️ 이름으로 맞춘다. 순서로 맞추면 AI 가 한 칸 밀었을 때 다른 주제의
            설명이 엉뚱한 묶음에 붙는다 — 화면에서는 티가 안 난다. */
      const byTopic = {}; (j.issues || []).forEach(x => { if (x && x.topic) byTopic[String(x.topic).trim()] = x; });
      out.groups.forEach(g => { const m = byTopic[g.name]; if (m) { g.what = clean(m.what); g.watch = clean(m.watch); } });
      const byName = {}; (j.holdings || []).forEach(x => { if (x && x.name) byName[String(x.name).trim()] = x; });
      out.holdings.forEach(h => { const m = byName[h.name]; if (m) { h.what = clean(m.what); h.watch = clean(m.watch); } });
      out.aiNote = '';
    } catch (e) {
      out.aiNote = 'AI 정리를 못 했습니다 — ' + String(e.message || e).slice(0, 180);
      out.headline = '';
    }
  }

  out.ms = Date.now() - started;
  return { statusCode: 200, headers: cors, body: JSON.stringify(out) };
};
