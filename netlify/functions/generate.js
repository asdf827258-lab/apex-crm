/*
 * APEX YUN PRO — Claude API 프록시 (Netlify Functions 버전)
 * ────────────────────────────────────────────────────────
 * 목적: 앱 사용자(팀원)가 API 키를 직접 넣지 않아도 되게 한다.
 *       키는 Netlify 환경변수에 한 번만 보관하고, 프런트는 이 URL만 호출한다.
 *
 * 배포(Netlify):
 *   1) 이 파일을  netlify/functions/generate.js  로 둔다(이미 위치함).
 *   2) 루트  netlify.toml 의 publish/redirect 설정으로  /api/generate → 이 함수  연결.
 *   3) Netlify 대시보드 → Site settings → Environment variables 에
 *        ANTHROPIC_API_KEY = sk-ant-...   (본인 키) 추가. (절대 코드에 키를 넣지 않는다)
 *   4) 배포 후 앱 설정 → '서버 프록시' 에  https://<사이트>/api/generate  입력.
 *
 * 비용: 호출 비용은 위 키 계정에 청구됨(공짜 아님).
 * 남용 방지(선택): ALLOWED_ORIGIN 화이트리스트 + SHARED_TOKEN 공유토큰.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

exports.handler = async function (event) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
  const SHARED_TOKEN = process.env.SHARED_TOKEN || "";
  const cors = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: cors, body: JSON.stringify({ message: "POST만 허용됩니다." }) };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "서버에 ANTHROPIC_API_KEY 환경변수가 없습니다." }) };

  if (SHARED_TOKEN) {
    const t = event.headers["x-app-token"] || event.headers["X-App-Token"];
    if (t !== SHARED_TOKEN)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ message: "토큰이 올바르지 않습니다." }) };
  }

  try {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (e) { body = {}; }

    const payload = {
      model: body.model || "claude-sonnet-4-6",
      max_tokens: Math.min(body.max_tokens || 2000, 8000),
      system: typeof body.system === "string" ? body.system : "",
      messages: Array.isArray(body.messages)
        ? body.messages
        : [{ role: "user", content: String(body.user || "") }],
    };

    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) {
      let msg = text;
      try { const j = JSON.parse(text); msg = (j.error && j.error.message) || j.message || text; } catch (e) {}
      return { statusCode: r.status, headers: cors, body: JSON.stringify({ message: msg }) };
    }

    const data = JSON.parse(text);
    const out = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return {
      statusCode: 200,
      headers: Object.assign({ "Content-Type": "application/json" }, cors),
      body: JSON.stringify({ text: out }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ message: "프록시 오류: " + (e && e.message ? e.message : String(e)) }),
    };
  }
};
