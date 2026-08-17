/* ════════════════════════════════════════════════════════════════════════
   Gemini 모델 이름을 코드에 박지 않는다 — 물어보고 고른다

   ⚠️ 왜 이걸 만들었나.
      저장소 전체가 'gemini-2.0-flash' 를 여섯 군데에 박아 두고 있었다. 그런데
      실서버에서 그 이름이 404 로 돌아온다. 모델은 이름이 바뀌거나 내려간다.
      박아 두면 그날 조용히 죽는데, 죽은 자리가 브리핑·분석이라 화면에는
      "AI 연결이 없어 숫자만 정리했습니다" 만 뜬다 — 키가 멀쩡한데도.

      그래서 이름을 추측하지 않는다. 이 키로 쓸 수 있는 모델 목록을 받아
      그중에서 고른다. 목록에 없으면 무엇이 있는지 그대로 알려 준다.

     검사:  node scripts/check-gemini-model.js   (네트워크 안 탐)
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const LIST_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/* 앞에 있을수록 먼저 쓴다. 값싸고 빠른 flash 계열을 앞에 둔다 —
   우리가 시키는 일(제목을 정해진 JSON 으로 바꾸기)에는 그걸로 충분하다. */
const PREFER = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro'
];

/* 목록에서 고르는 규칙만 따로 뺐다. 네트워크 없이 검사할 수 있어야 한다. */
/* 후보를 순서대로 준다. 하나만 고르면 그게 안 될 때 방법이 없다 —
   목록에 있는데도 generateContent 가 404 로 막히는 조합이 실제로 있었다
   (gemini-2.5-flash 를 목록에서 골랐는데 부르면 404). 이유를 캐는 대신
   되는 것을 찾을 때까지 내려간다. */
function rankModels(names) {
  const bad = /embedding|aqa|vision|tts|image|imagen|veo|learnlm/i;
  const usable = (names || []).map(s => String(s || '').replace(/^models\//, ''))
                              .filter(n => n && !bad.test(n));
  const out = [];
  for (const p of PREFER) if (usable.indexOf(p) >= 0) out.push(p);
  usable.filter(n => /flash/i.test(n)).forEach(n => { if (out.indexOf(n) < 0) out.push(n); });
  usable.forEach(n => { if (out.indexOf(n) < 0) out.push(n); });
  return out;
}

function pickModel(names) {
  const usable = (names || []).map(s => String(s || '').replace(/^models\//, '')).filter(Boolean);
  if (!usable.length) return null;
  for (const p of PREFER) if (usable.indexOf(p) >= 0) return p;
  /* 선호 목록에 없으면 flash 계열 아무거나 — 그것도 없으면 첫 번째.
     ⚠️ 'vision'·'embedding'·'tts' 처럼 글을 안 쓰는 모델이 섞여 오므로 거른다. */
  const bad = /embedding|aqa|vision|tts|image|imagen|veo|learnlm/i;
  const flash = usable.filter(n => /flash/i.test(n) && !bad.test(n));
  if (flash.length) return flash[0];
  const any = usable.filter(n => !bad.test(n));
  return any[0] || null;
}

/* 컨테이너가 사는 동안만 기억한다. 매번 목록을 받으면 호출을 낭비한다. */
let cached = null, cachedAt = 0, inflight = null;
const TTL_MS = 6 * 3600 * 1000;

/* 이 키로 쓸 수 있는 모델 목록. resolveModel 과 callGemini 가 같이 쓴다. */
async function listModels(key, fetchImpl) {
  if (!key) throw new Error('GEMINI_API_KEY 가 없습니다');
  const doFetch = fetchImpl || fetch;
  const r = await doFetch(LIST_URL + '?key=' + encodeURIComponent(key), {
    signal: AbortSignal.timeout(15000)
  });
  const txt = await r.text();
  if (!r.ok) {
    /* 상태 코드만 던지면 원인을 못 찾는다. 본문을 같이 준다 —
       키가 틀렸는지, 결제가 안 됐는지, 지역 제한인지가 거기 적혀 있다. */
    throw new Error('Gemini 모델 목록 ' + r.status + ' — ' + txt.slice(0, 180));
  }
  let j = {};
  try { j = JSON.parse(txt); } catch (e) { throw new Error('Gemini 모델 목록이 JSON 이 아닙니다'); }
  const all = (j.models || []).map(m => String(m.name || '').replace(/^models\//, '')).filter(Boolean);
  const gen = (j.models || [])
    .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0)
    .map(m => String(m.name || '').replace(/^models\//, ''));
  /* generateContent 를 지원한다고 표시된 것이 없으면 전체를 후보로 둔다 —
     목록의 표시가 비어 있어도 실제로는 되는 경우가 있어서, 시도는 해 본다. */
  const out = gen.length ? gen : all;
  out._all = all;
  return out;
}

async function resolveModel(key, fetchImpl) {
  if (!key) throw new Error('GEMINI_API_KEY 가 없습니다');
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const names = await listModels(key, fetchImpl);
    const hit = pickModel(names);
    if (!hit) {
      throw new Error('이 키로 글을 쓸 수 있는 Gemini 모델이 없습니다. 받은 모델: ' +
        ((names._all || names).length ? (names._all || names).slice(0, 8).join(', ') : '(응답에 모델이 하나도 없음)'));
    }
    cached = hit; cachedAt = Date.now();
    return hit;
  })().finally(() => { inflight = null; });
  return inflight;
}

/* ── 실제로 되는 모델로 부른다 ────────────────────────────────────────
   목록에서 후보를 받아 앞에서부터 시도한다. 404/400 이면 다음 후보로 내려가고,
   성공한 것을 기억해 다음부터는 그것만 쓴다.

   ⚠️ 404·400 에서만 내려간다. 429(한도)·500(서버)에서 다음 모델로 넘어가면
      멀쩡한 모델을 버리고 한도만 더 쓴다. */
let good = null, goodAt = 0;

async function callGemini(key, body, fetchImpl) {
  const doFetch = fetchImpl || fetch;
  const url = m => LIST_URL + '/' + m + ':generateContent?key=' + encodeURIComponent(key);

  if (good && Date.now() - goodAt < TTL_MS) {
    const r = await doFetch(url(good), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000)
    });
    if (r.ok) return { res: r, model: good };
    if (r.status !== 404 && r.status !== 400) {
      throw new Error('Gemini ' + r.status + ' (모델 ' + good + ') — ' + (await r.text()).slice(0, 200));
    }
    good = null;                       /* 되던 모델이 막혔다 — 다시 찾는다 */
  }

  const names = await listModels(key, doFetch);
  const cands = rankModels(names);
  if (!cands.length) {
    throw new Error('이 키로 글을 쓸 수 있는 Gemini 모델이 없습니다. 받은 모델: ' +
      (names.length ? names.slice(0, 8).join(', ') : '(응답에 모델이 하나도 없음)'));
  }

  const tried = [];
  for (const m of cands.slice(0, 6)) {
    const r = await doFetch(url(m), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000)
    });
    if (r.ok) { good = m; goodAt = Date.now(); return { res: r, model: m }; }
    if (r.status !== 404 && r.status !== 400) {
      throw new Error('Gemini ' + r.status + ' (모델 ' + m + ') — ' + (await r.text()).slice(0, 200));
    }
    tried.push(m + '=' + r.status);
  }
  throw new Error('Gemini 후보를 다 시도했지만 전부 막혔습니다 — ' + tried.join(' · ') +
    ' / 목록에 있던 모델: ' + cands.slice(0, 6).join(', '));
}

function _reset() { cached = null; cachedAt = 0; inflight = null; good = null; goodAt = 0; }

module.exports = { resolveModel, callGemini, pickModel, rankModels, PREFER, LIST_URL, _reset };
