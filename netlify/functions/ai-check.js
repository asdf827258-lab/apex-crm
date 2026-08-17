/* ════════════════════════════════════════════════════════════════
   APEX 서버 열쇠 점검 — 「지금 확인」 이 부르는 자리

   왜 따로 만들었나.
   ────────────────
   전에는 이 버튼이 ai-daily 를 직접 불렀다. 그런데 ai-daily 는
   netlify.toml 에 schedule 이 걸린 예약 함수다. Netlify 는 예약 함수의
   HTTP 호출을 막고 빈 몸통에 403 만 돌려준다. 그래서 열쇠를 제대로
   넣어 둔 뒤에도 화면은 늘 「아직 안 됩니다」 였고, 대표님은 멀쩡한
   열쇠를 몇 번이고 다시 넣게 됐다. 열쇠가 문제가 아니었다.

   이 함수는 schedule 을 걸지 않는다. 그리고 무거운 야간 근무를 돌리지
   않는다 — 열쇠가 살아 있는지만 짧게 찔러 보고 끝낸다(각 6초 제한).
   쓰기도 하지 않는다. 눌러도 아무것도 망가지지 않는다.

   무엇을 돌려주나. 「된다/안 된다」 한 줄로 끝내지 않는다. 어느 열쇠가
   어떻게 막혔는지를 말한다. 그래야 무엇을 고칠지 알 수 있다.
   ════════════════════════════════════════════════════════════════ */

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const GM_KEY = process.env.GEMINI_API_KEY || '';

/* 야간 근무가 실제로 부르는 모델과 같은 이름을 쓴다.
   모델이 은퇴하면 열쇠는 멀쩡한데 야간 근무만 죽는다 —
   그 경우도 여기서 잡히라고 일부러 같은 값을 본다. */
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const GEMINI_MODEL = 'gemini-2.0-flash';

function kstToday() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/* 열쇠 앞 네 글자만 보여 준다. 어떤 종류를 넣었는지 알아보는 데는
   충분하고(AIza… · AQ.… · sk-ant…), 비밀이 새지는 않는다. */
function head(v) {
  return v ? String(v).slice(0, 4) : '';
}

async function ping(url, opts, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms || 6000);
  try {
    const r = await fetch(url, Object.assign({ signal: ac.signal }, opts));
    const body = await r.text();
    return { status: r.status, ok: r.ok, body: body };
  } catch (e) {
    const aborted = e && (e.name === 'AbortError' || /abort/i.test(e.message || ''));
    return { status: 0, ok: false, body: aborted ? '시간 초과' : (e && e.message ? e.message : String(e)) };
  } finally {
    clearTimeout(t);
  }
}

/* 서버 응답에서 사람이 읽을 한 줄만 뽑는다. JSON 이면 message,
   아니면 앞부분을 자른다. 통째로 흘리면 화면이 못 읽는다. */
function why(r) {
  try {
    const j = JSON.parse(r.body);
    const m = (j.error && (j.error.message || j.error.status)) || j.message || j.msg || j.hint;
    if (m) return String(m).slice(0, 160);
  } catch (e) {}
  return String(r.body || '').replace(/\s+/g, ' ').trim().slice(0, 160) || ('HTTP ' + r.status);
}

async function checkSupabase() {
  if (!SB_KEY) return { on: false, ok: false, msg: 'SUPABASE_SERVICE_ROLE_KEY 가 서버에 없습니다.' };
  const r = await ping(SB_URL + '/rest/v1/ai_dept_reports?select=dept&limit=1', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
  });
  if (r.ok) return { on: true, ok: true, msg: 'DB 에 붙습니다.' };
  if (r.status === 401 || r.status === 403)
    return { on: true, ok: false, msg: 'DB 가 열쇠를 거절했습니다 — service_role 키가 맞는지 보세요. (' + why(r) + ')' };
  return { on: true, ok: false, msg: 'DB 에 못 붙었습니다 — ' + why(r) };
}

async function checkClaude() {
  if (!AI_KEY) return { on: false, ok: false, msg: 'ANTHROPIC_API_KEY 가 서버에 없습니다.' };
  const r = await ping('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] })
  });
  if (r.ok) return { on: true, ok: true, head: head(AI_KEY), msg: '앤트로픽이 답합니다.' };
  if (r.status === 401)
    return { on: true, ok: false, head: head(AI_KEY), msg: '앤트로픽이 열쇠를 거절했습니다 — 키가 틀렸거나 지워졌습니다.' };
  if (r.status === 400 && /model/i.test(r.body))
    return { on: true, ok: false, head: head(AI_KEY), msg: '열쇠는 맞는데 모델 이름을 모른답니다 — ' + CLAUDE_MODEL + ' (' + why(r) + ')' };
  if (r.status === 429)
    return { on: true, ok: false, head: head(AI_KEY), msg: '앤트로픽 한도에 걸렸습니다 — 결제·사용량을 보세요.' };
  return { on: true, ok: false, head: head(AI_KEY), msg: '앤트로픽 오류 — ' + why(r) };
}

async function checkGemini() {
  if (!GM_KEY) return { on: false, ok: false, msg: 'GEMINI_API_KEY 가 서버에 없습니다.' };
  const r = await ping(
    'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL +
      ':generateContent?key=' + encodeURIComponent(GM_KEY),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 }
      })
    }
  );
  if (r.ok) return { on: true, ok: true, head: head(GM_KEY), msg: '구글이 답합니다.' };
  /* 401 UNAUTHENTICATED 은 「키가 틀렸다」 가 아니라 「이건 API 키가 아니다」 다.
     구글은 API 키로 읽히는 값이면 400 API_KEY_INVALID 로 답한다(없는 키여도).
     401 이 오면 붙여 넣은 글자가 API 키가 아닌 다른 것(OAuth 토큰·세션 값 등)이다.
     실제로 AI Studio 화면에서 키가 아닌 값을 집어 오는 일이 잦다. */
  if (r.status === 401)
    return { on: true, ok: false, head: head(GM_KEY),
      msg: '넣으신 값이 API 키가 아닙니다 — 구글이 API 키로 읽지도 못했습니다(「' + head(GM_KEY) + '…」 로 시작). ' +
           'Google AI Studio → Get API key 에서 나오는 AIza… 로 시작하는 값을 넣으세요.' };
  if (r.status === 400 && /API key not valid|API_KEY_INVALID/i.test(r.body))
    return { on: true, ok: false, head: head(GM_KEY),
      msg: '구글이 열쇠를 거절했습니다 — 키 값이 아닌 다른 글자를 붙여 넣지 않았는지 보세요. (지금 값은 「' + head(GM_KEY) + '…」 로 시작합니다)' };
  if (r.status === 403)
    return { on: true, ok: false, head: head(GM_KEY),
      msg: '열쇠는 있는데 권한이 없습니다 — 그 키의 구글 프로젝트에서 Generative Language API 를 켜야 합니다. (' + why(r) + ')' };
  if (r.status === 404)
    return { on: true, ok: false, head: head(GM_KEY),
      msg: '열쇠는 맞는데 모델이 없습니다 — ' + GEMINI_MODEL + ' 가 은퇴했을 수 있습니다. (' + why(r) + ')' };
  if (r.status === 429)
    return { on: true, ok: false, head: head(GM_KEY), msg: '구글 한도에 걸렸습니다 — 잠시 뒤 다시 보세요.' };
  return { on: true, ok: false, head: head(GM_KEY), msg: '구글 오류 — ' + why(r) };
}

/* 열쇠가 다 맞아도 새벽 5시가 아직 안 지났으면 오늘 것은 없다.
   「없다」 를 「고장」 으로 읽지 않도록 마지막으로 쌓인 날을 같이 본다. */
async function lastReport() {
  if (!SB_KEY) return null;
  const r = await ping(SB_URL + '/rest/v1/ai_dept_reports?select=ref_date&order=ref_date.desc&limit=1', {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
  });
  if (!r.ok) return null;
  try {
    const j = JSON.parse(r.body);
    return (j && j[0] && j[0].ref_date) || null;
  } catch (e) { return null; }
}

exports.handler = async function (event) {
  const cors = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };
  if (event && event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const [db, claude, gemini] = await Promise.all([checkSupabase(), checkClaude(), checkGemini()]);
  const last = await lastReport();

  /* 글 쓰는 열쇠는 둘 중 하나만 살아 있으면 된다 — 야간 근무도 그렇게 돈다. */
  const writer = claude.ok || gemini.ok;
  const ok = db.ok && writer;

  let reason;
  if (ok) {
    reason = '열쇠가 다 맞습니다. 매일 새벽 5시에 서버가 알아서 만듭니다.';
    if (last === kstToday()) reason += ' 오늘 것도 이미 쌓여 있습니다.';
    else if (last) reason += ' 마지막으로 쌓인 날은 ' + last + ' 입니다.';
    else reason += ' 아직 쌓인 보고는 없습니다 — 첫 새벽이 지나면 생깁니다.';
  } else if (!db.ok) {
    reason = db.msg;
  } else if (!claude.on && !gemini.on) {
    reason = '글 쓰는 열쇠가 하나도 없습니다 — ANTHROPIC_API_KEY 또는 GEMINI_API_KEY 둘 중 하나를 넣으세요.';
  } else {
    reason = '글 쓰는 열쇠가 살아 있지 않습니다. ' +
      [claude.on ? '앤트로픽: ' + claude.msg : null,
       gemini.on ? '구글: ' + gemini.msg : null].filter(Boolean).join(' / ');
  }

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      ok: ok,
      reason: reason,
      checked_at: new Date().toISOString(),
      last_report: last,
      keys: {
        SUPABASE_SERVICE_ROLE_KEY: db,
        ANTHROPIC_API_KEY: claude,
        GEMINI_API_KEY: gemini
      }
    })
  };
};
