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

async function resolveModel(key, fetchImpl) {
  if (!key) throw new Error('GEMINI_API_KEY 가 없습니다');
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  if (inflight) return inflight;

  const doFetch = fetchImpl || fetch;
  inflight = (async () => {
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
    const names = (j.models || [])
      .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0)
      .map(m => m.name);
    const hit = pickModel(names);
    if (!hit) {
      /* ⚠️ 걸러낸 뒤 목록을 보여 주면 언제나 "(비어 있음)" 이다. 정작 무엇이
            왔는지가 안 보여서 원인을 못 찾는다. 거르기 전 목록을 보여 준다. */
      throw new Error('이 키로 글을 쓸 수 있는 Gemini 모델이 없습니다. 받은 모델: ' +
        (all.length ? all.slice(0, 8).join(', ') : '(응답에 모델이 하나도 없음)'));
    }
    cached = hit; cachedAt = Date.now();
    return hit;
  })().finally(() => { inflight = null; });

  return inflight;
}

function _reset() { cached = null; cachedAt = 0; inflight = null; }

module.exports = { resolveModel, pickModel, PREFER, LIST_URL, _reset };
