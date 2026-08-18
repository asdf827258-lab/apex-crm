/* ════════════════════════════════════════════════════════════════════════
   뉴스 → 지정 JSON 으로 바꾸는 부분

   AI 가 돌려준 것을 그대로 믿지 않는다. 스키마에 맞는지 한 줄씩 검사하고,
   어긋나면 고쳐 쓰거나 버린다. 무엇을 왜 버렸는지도 남긴다.

   ⚠️ AI 에게 주는 것은 '제목' 뿐이다. 구글 뉴스 RSS 는 본문을 주지 않고,
      본문을 긁어 오지도 않는다(남의 저작물이고, 매체마다 구조가 달라 조용히
      엉뚱한 글을 담게 된다). 그래서 프롬프트에 "제목만 주어졌다" 를 못 박고,
      제목에 없는 수치·인용·인과관계를 쓰지 못하게 한다.

     검사:  node scripts/check-analyst-ai.js   (네트워크 안 탐)
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const GEMMODEL = require('./gemini-model.js');

const SENTIMENTS = ['positive', 'neutral', 'negative'];

/* 사용자가 정한 그대로의 모양. 빠진 칸은 채우지 않고 비운다. */
function emptyShape() {
  return {
    ticker: '', company: '', title: '', publishedAt: '', source: '', summary: '',
    sentiment: 'neutral', sentimentScore: 0, importance: 0, reason: '',
    keywords: [], riskFactors: [], catalysts: []
  };
}

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function strArr(v, max, len) {
  if (!Array.isArray(v)) return [];
  return v.map(x => String(x == null ? '' : x).replace(/\s+/g, ' ').trim())
          .filter(Boolean).slice(0, max || 6).map(s => s.slice(0, len || 40));
}

/* ── 한 건 검증 ─────────────────────────────────────────────────────────
   돌려주는 것: { ok, row, problems }
   ok=false 면 버린다. 버린 이유는 problems 에 남는다 — 조용히 사라지면
   "왜 기사가 줄었지" 를 영영 못 찾는다. */
function validateOne(raw, origin) {
  const problems = [];
  const src = origin || {};
  const o = (raw && typeof raw === 'object') ? raw : {};
  const row = emptyShape();

  /* 사실 칸은 AI 말이 아니라 원본을 쓴다. 여기를 AI 에게 맡기면 제목이
     슬쩍 바뀌거나 시각이 지어내진다. 실제로 그런 것을 본 적이 있다. */
  row.ticker = String(src.ticker || o.ticker || '').trim();
  row.company = String(src.company || o.company || '').trim();
  row.title = String(src.title || o.title || '').trim();
  row.publishedAt = String(src.publishedAt || '').trim();
  row.source = String(src.source || '').trim();

  if (!row.title) { problems.push('제목이 없다'); return { ok: false, row: row, problems: problems }; }

  /* summary — 본문을 안 줬으므로 제목을 넘어서는 서술이면 의심한다.
     길이만 자르고, 비어 있으면 비운 채로 둔다. 지어내지 않는다. */
  row.summary = String(o.summary == null ? '' : o.summary).replace(/\s+/g, ' ').trim().slice(0, 300);

  /* sentiment */
  const s = String(o.sentiment || '').toLowerCase().trim();
  if (SENTIMENTS.indexOf(s) < 0) { problems.push('sentiment 가 ' + JSON.stringify(o.sentiment)); row.sentiment = 'neutral'; }
  else row.sentiment = s;

  /* sentimentScore — -1 ~ 1 */
  let sc = n(o.sentimentScore);
  if (sc == null) { problems.push('sentimentScore 가 숫자가 아니다'); sc = 0; }
  else if (sc < -1 || sc > 1) { problems.push('sentimentScore 가 범위 밖(' + sc + ')'); sc = clamp(sc, -1, 1); }
  row.sentimentScore = Math.round(sc * 100) / 100;

  /* ⚠️ 라벨과 점수가 어긋나는 일이 실제로 있다 — 'positive' 인데 -0.7 같은 것.
        둘 중 무엇이 참인지 모르므로 고쳐 쓰지 않고 버린다. 한쪽에 맞춰
        다른 쪽을 바꾸면 있지도 않은 판단을 만들어 내는 것이다. */
  if ((row.sentiment === 'positive' && row.sentimentScore < 0) ||
      (row.sentiment === 'negative' && row.sentimentScore > 0)) {
    problems.push('sentiment(' + row.sentiment + ')와 점수(' + row.sentimentScore + ')가 어긋난다');
    return { ok: false, row: row, problems: problems };
  }

  /* importance — 0 ~ 10 */
  let imp = n(o.importance);
  if (imp == null) { problems.push('importance 가 숫자가 아니다'); imp = 0; }
  else if (imp < 0 || imp > 10) { problems.push('importance 가 범위 밖(' + imp + ')'); imp = clamp(imp, 0, 10); }
  row.importance = Math.round(imp * 10) / 10;

  row.reason = String(o.reason == null ? '' : o.reason).replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!row.reason) problems.push('reason 이 비었다');

  row.keywords = strArr(o.keywords, 8, 30);
  row.riskFactors = strArr(o.riskFactors, 6, 60);
  row.catalysts = strArr(o.catalysts, 6, 60);

  return { ok: true, row: row, problems: problems };
}

function validateBatch(list, origins) {
  const out = [], dropped = [];
  const arr = Array.isArray(list) ? list : [];
  arr.forEach((raw, i) => {
    const v = validateOne(raw, (origins || [])[i]);
    if (v.ok) out.push(v.row);
    else dropped.push({ title: String((origins || [])[i] && (origins || [])[i].title || '').slice(0, 60), problems: v.problems });
  });
  return { rows: out, dropped: dropped };
}

/* ── 프롬프트 ───────────────────────────────────────────────────────────── */
const SYSTEM =
  '너는 주식 뉴스 제목을 정해진 JSON 으로만 바꾸는 변환기다. 설명하지 말고 JSON 만 내라.\n' +
  '\n' +
  '가장 중요한 규칙 — 너에게는 기사 "제목" 만 주어진다. 본문은 없다.\n' +
  '  · 제목에 없는 수치·인용·날짜·인과관계를 쓰면 안 된다.\n' +
  '  · 본문을 읽은 것처럼 쓰면 안 된다. 모르면 summary 를 빈 문자열로 두어라.\n' +
  '  · 제목만으로 판단이 안 되면 sentiment 는 neutral, importance 는 낮게 매겨라.\n' +
  '\n' +
  'sentiment  positive | neutral | negative 셋 중 하나. 주가에 미칠 방향 기준.\n' +
  'sentimentScore  -1.0 ~ 1.0 실수. sentiment 와 부호가 어긋나면 안 된다\n' +
  '                (positive 인데 음수면 그 건은 버려진다).\n' +
  'importance  0 ~ 10. 실적·인수합병·규제·소송·대규모 계약은 높게,\n' +
  '            시황 잡담·주가 요약·목록 기사는 낮게.\n' +
  'reason      왜 그 판단인지 한 문장. 제목 안의 근거만 든다.\n' +
  'keywords    제목에서 뽑은 낱말 3~8개.\n' +
  'riskFactors 하락 위험. 제목에서 읽히는 것만. 없으면 빈 배열.\n' +
  'catalysts   상승 요인. 제목에서 읽히는 것만. 없으면 빈 배열.\n' +
  '\n' +
  '입력 기사 수와 출력 배열 길이는 반드시 같아야 하고 순서도 같아야 한다.';

function buildUser(stock, items) {
  return '종목: ' + (stock.company || stock.name || '') + ' (' + (stock.ticker || '') + ')\n\n' +
    '아래는 기사 제목 목록이다. 각 줄을 같은 순서로 변환하라.\n\n' +
    items.map((x, i) => (i + 1) + '. ' + x.title).join('\n') +
    '\n\n출력 형식(다른 말 없이 이것만):\n' +
    '{"items":[{"summary":"","sentiment":"neutral","sentimentScore":0,"importance":0,' +
    '"reason":"","keywords":[],"riskFactors":[],"catalysts":[]}]}';
}

/* 모델 응답에서 JSON 만 건져 낸다. ```json 울타리나 앞뒤 설명이 붙어 오는 일이 잦다. */
function extractJson(text) {
  const s = String(text || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : s;
  const i = body.indexOf('{'), j = body.lastIndexOf('}');
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(body.slice(i, j + 1)); } catch (e) { return null; }
}

async function askAI(system, user, maxTokens) {
  const AI = process.env.ANTHROPIC_API_KEY || '';
  const GM = process.env.GEMINI_API_KEY || '';
  if (AI) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AI, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: maxTokens || 4000, system: system,
                             messages: [{ role: 'user', content: user }] })
    });
    if (r.ok) { const j = await r.json(); return (j.content || []).map(c => c.text || '').join(''); }
    if (!GM) throw new Error('Anthropic ' + r.status);
  }
  if (!GM) throw new Error('AI 키 없음 (ANTHROPIC_API_KEY 또는 GEMINI_API_KEY)');
  const gem = await GEMMODEL.callGemini(GM, { systemInstruction: { parts: [{ text: system }] },
                           contents: [{ role: 'user', parts: [{ text: user }] }],
                           generationConfig: { maxOutputTokens: maxTokens || 4000, responseMimeType: 'application/json' } });
  const r2 = gem.res, gemModel = gem.model;
  if (!r2.ok) throw new Error('Gemini ' + r2.status + ' (모델 ' + gemModel + ') — ' + (await r2.text()).slice(0, 200));
  const j2 = await r2.json();
  return ((j2.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('');
}

/* ── 한 종목치 뉴스를 분석한다 ─────────────────────────────────────────
   기사가 많으면 나눠 보낸다. 한 번에 다 넣으면 뒤쪽이 잘리는데, 잘린 만큼
   조용히 사라져서 '분석했다' 는 말이 거짓이 된다. */
async function analyzeNews(stock, items, opts) {
  const o = opts || {};
  const chunk = o.chunk || 15;
  const origins = (items || []).map(x => Object.assign({}, x, {
    ticker: stock.ticker || '', company: stock.company || stock.name || ''
  }));
  if (!origins.length) return { rows: [], dropped: [], note: '분석할 기사가 없습니다' };

  const rows = [], dropped = [];
  const notes = [];
  for (let i = 0; i < origins.length; i += chunk) {
    const part = origins.slice(i, i + chunk);
    try {
      const text = await askAI(SYSTEM, buildUser(stock, part), 4000);
      const j = extractJson(text);
      const list = j && Array.isArray(j.items) ? j.items : null;
      if (!list) { notes.push((i / chunk + 1) + '번째 묶음: JSON 을 못 읽음'); continue; }
      /* ⚠️ 길이가 다르면 짝이 어긋난다 — 3번 기사 분석이 5번 기사에 붙는다.
            맞춰서 자르지 않고, 어긋났다고 남기고 짧은 쪽까지만 쓴다. */
      if (list.length !== part.length) {
        notes.push((i / chunk + 1) + '번째 묶음: 기사 ' + part.length + '건인데 결과 ' + list.length + '건');
      }
      const v = validateBatch(list.slice(0, part.length), part);
      rows.push(...v.rows);
      dropped.push(...v.dropped);
    } catch (e) {
      notes.push((i / chunk + 1) + '번째 묶음 실패: ' + String(e.message || e).slice(0, 80));
    }
  }
  return { rows: rows, dropped: dropped, note: notes.join(' · ') };
}

module.exports = { SYSTEM, buildUser, extractJson, validateOne, validateBatch, analyzeNews, emptyShape, SENTIMENTS };
