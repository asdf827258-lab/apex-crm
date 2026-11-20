/* ════════════════════════════════════════════════════════════════════════
   Claude 모델 이름을 코드에 박지 않는다 — 물어보고 고른다

   ⚠️ 왜 이걸 만들었나.
      `gemini-model.js` 머리에 적힌 그 병이 Claude 쪽에도 그대로 있습니다 —
      저장소가 'claude-sonnet-4-5-20250929' 를 <b>일곱 군데</b>에 박아 두었습니다.
      모델은 이름이 바뀌고 내려갑니다. 박아 두면 그날 조용히 죽는데, 죽은
      자리가 브리핑·분석이라 화면에는 「AI 연결이 없어 숫자만 정리했습니다」
      만 뜹니다 — 키가 멀쩡한데도.

      그래서 이름을 추측하지 않습니다. 이 키로 쓸 수 있는 모델 목록을 받아
      그중에서 고릅니다. 목록에 없으면 무엇이 있는지 그대로 알려 줍니다.

   ★ 날짜가 박힌 이름을 선호 목록에 적지 않습니다. <b>갈래</b>(sonnet·haiku·
     opus)로만 고르고, 같은 갈래에서는 서버가 준 순서(새것 먼저)를 따릅니다.
     그래야 새 판이 나와도 이 파일을 안 고칩니다.

   ⚠️ 이미 박아 둔 일곱 자리는 <b>여기서 안 고칩니다</b> — 브리핑·분석·투자는
      다른 갈래이고 저마다 시험이 필요합니다. 이 자는 <b>새 코드가 쓰는 길</b>이고,
      그 일곱이 옮겨 올 자리입니다 (CLAUDE.md 5번).

     검사:  node scripts/check-adreview.js   (네트워크 안 탐)
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const LIST_URL = 'https://api.anthropic.com/v1/models';
const MSG_URL = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

/* 갈래 선호 — 앞에 있을수록 먼저 씁니다.
   sonnet 을 앞에 둡니다: 우리가 시키는 일(숫자를 보고 한국말로 판단을 쓰고
   문구 초안을 짓기)에 글 솜씨가 필요하고, opus 는 같은 일에 몇 배 비쌉니다
   (사장님 말씀 2026-11-12 「돈은 더 줄이고」). haiku 는 sonnet 이 막혔을 때. */
const FAMILIES = ['sonnet', 'haiku', 'opus'];

/* 고르는 규칙만 따로 뺐습니다 — 네트워크 없이 검사할 수 있어야 합니다.
   후보를 순서대로 줍니다. 하나만 고르면 그게 안 될 때 방법이 없습니다. */
function rankModels(ids) {
  const bad = /embedding|voice|tts|whisper/i;
  const usable = (ids || []).map(s => String(s || '').trim())
                            .filter(n => n && !bad.test(n));
  const out = [];
  FAMILIES.forEach(f => {
    usable.forEach(n => { if (n.indexOf(f) >= 0 && out.indexOf(n) < 0) out.push(n); });
  });
  /* 갈래 이름이 안 든 새 이름이 생길 수 있습니다 — 버리지 않고 뒤에 둡니다 */
  usable.forEach(n => { if (out.indexOf(n) < 0) out.push(n); });
  return out;
}

function pickModel(ids) {
  const r = rankModels(ids);
  return r.length ? r[0] : null;
}

/* 컨테이너가 사는 동안만 기억합니다. 매번 목록을 받으면 호출을 낭비합니다 (7번). */
let cached = null, cachedAt = 0, inflight = null;
let good = null, goodAt = 0;
const TTL_MS = 6 * 3600 * 1000;

async function listModels(key, fetchImpl) {
  if (!key) throw new Error('ANTHROPIC_API_KEY 가 없습니다');
  const doFetch = fetchImpl || fetch;
  const r = await doFetch(LIST_URL + '?limit=100', {
    headers: { 'x-api-key': key, 'anthropic-version': VERSION },
    signal: AbortSignal.timeout(15000)
  });
  const txt = await r.text();
  if (!r.ok) {
    /* 상태 코드만 던지면 원인을 못 찾습니다. 본문을 같이 줍니다 —
       키가 틀렸는지, 한도인지, 결제가 안 됐는지가 거기 적혀 있습니다. */
    throw new Error('Claude 모델 목록 ' + r.status + ' — ' + txt.slice(0, 180));
  }
  let j = {};
  try { j = JSON.parse(txt); } catch (e) { throw new Error('Claude 모델 목록이 JSON 이 아닙니다'); }
  return (j.data || []).map(m => String(m.id || '')).filter(Boolean);
}

async function resolveModel(key, fetchImpl) {
  if (!key) throw new Error('ANTHROPIC_API_KEY 가 없습니다');
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const ids = await listModels(key, fetchImpl);
    const hit = pickModel(ids);
    if (!hit) {
      throw new Error('이 키로 쓸 수 있는 Claude 모델이 없습니다. 받은 모델: ' +
        (ids.length ? ids.slice(0, 8).join(', ') : '(응답에 모델이 하나도 없음)'));
    }
    cached = hit; cachedAt = Date.now();
    return hit;
  })().finally(() => { inflight = null; });
  return inflight;
}

/* ── 실제로 되는 모델로 부릅니다 ──────────────────────────────────────
   목록에서 후보를 받아 앞에서부터 시도합니다. 404/400 이면 다음 후보로
   내려가고, 성공한 것을 기억해 다음부터는 그것만 씁니다.

   ⚠️ 404·400 에서만 내려갑니다. 429(한도)·500(서버)에서 다음 모델로 넘어가면
      멀쩡한 모델을 버리고 한도만 더 씁니다. */
async function callClaude(key, body, fetchImpl) {
  if (!key) throw new Error('ANTHROPIC_API_KEY 가 없습니다');
  const doFetch = fetchImpl || fetch;
  const hdr = { 'x-api-key': key, 'anthropic-version': VERSION, 'Content-Type': 'application/json' };
  const post = (m) => doFetch(MSG_URL, {
    method: 'POST', headers: hdr,
    body: JSON.stringify(Object.assign({}, body, { model: m })),
    signal: AbortSignal.timeout(60000)
  });

  if (good && Date.now() - goodAt < TTL_MS) {
    const r = await post(good);
    if (r.ok) return { res: r, model: good };
    if (r.status !== 404 && r.status !== 400) {
      throw new Error('Claude ' + r.status + ' (모델 ' + good + ') — ' + (await r.text()).slice(0, 200));
    }
    good = null;                       /* 되던 모델이 막혔습니다 — 다시 찾습니다 */
  }

  const cands = rankModels(await listModels(key, doFetch));
  if (!cands.length) throw new Error('이 키로 쓸 수 있는 Claude 모델이 없습니다');

  const tried = [];
  for (const m of cands.slice(0, 5)) {
    const r = await post(m);
    if (r.ok) { good = m; goodAt = Date.now(); return { res: r, model: m }; }
    if (r.status !== 404 && r.status !== 400) {
      throw new Error('Claude ' + r.status + ' (모델 ' + m + ') — ' + (await r.text()).slice(0, 200));
    }
    tried.push(m + '=' + r.status);
  }
  throw new Error('Claude 후보를 다 시도했지만 전부 막혔습니다 — ' + tried.join(' · ') +
    ' / 목록에 있던 모델: ' + cands.slice(0, 5).join(', '));
}

/* 글만 뽑아 줍니다. 부르는 쪽마다 content 배열을 다시 펴지 않게. */
async function askClaude(key, opts, fetchImpl) {
  const o = opts || {};
  const { res, model } = await callClaude(key, {
    max_tokens: o.maxTokens || 1200,
    system: o.system || '',
    messages: [{ role: 'user', content: o.user || '' }]
  }, fetchImpl);
  const j = await res.json();
  const text = (j.content || []).map(c => c.text || '').join('').trim();
  return { text: text, model: model };
}

function _reset() { cached = null; cachedAt = 0; inflight = null; good = null; goodAt = 0; }

module.exports = { resolveModel, callClaude, askClaude, listModels, pickModel, rankModels,
                   FAMILIES, LIST_URL, MSG_URL, VERSION, _reset };
