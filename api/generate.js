/*
 * APEX YUN PRO — Claude API 프록시 (서버리스)
 * ─────────────────────────────────────────────
 * 목적: 앱을 쓰는 사람(팀원·고객)이 API 키를 직접 입력하지 않아도 되게 한다.
 *       키는 서버 환경변수에 한 번만 보관하고, 프런트는 이 URL만 호출한다.
 *
 * 배포 (Vercel 예시):
 *   1) 이 파일을 프로젝트 루트의  api/generate.js  로 둔다.
 *   2) Vercel 대시보드 → Settings → Environment Variables 에
 *        ANTHROPIC_API_KEY = sk-ant-...   (본인 키)
 *      를 추가한다. (절대 코드에 키를 적지 않는다)
 *   3) 배포 후, 앱 설정 → '서버 프록시'에  https://<배포주소>/api/generate  입력.
 *
 * 비용 안내: 호출 비용은 여전히 위 키의 계정에 청구된다(공짜 아님).
 * 보호 팁: 공개 URL이므로 남용 방지를 위해 ALLOWED_ORIGIN 화이트리스트,
 *          또는 간단한 공유 토큰(아래 SHARED_TOKEN) 사용을 권장.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*"; // 예: https://apex.example.com
const SHARED_TOKEN = process.env.SHARED_TOKEN || "";       // 비우면 토큰 검사 안 함

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-App-Token");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ message: "POST만 허용됩니다." });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ message: "서버에 ANTHROPIC_API_KEY 환경변수가 없습니다." });

  // (선택) 공유 토큰 검사
  if (SHARED_TOKEN) {
    const t = req.headers["x-app-token"];
    if (t !== SHARED_TOKEN) return res.status(401).json({ message: "토큰이 올바르지 않습니다." });
  }

  try {
    // body 파싱 (Vercel은 자동 파싱, 일부 환경 대비 방어)
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body || "{}");
    if (!body || typeof body !== "object") body = {};

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
      return res.status(r.status).json({ message: msg });
    }

    const data = JSON.parse(text);
    const out = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // 프런트(callClaude)는 {text} 또는 표준 {content} 모두 처리한다
    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(500).json({ message: "프록시 오류: " + (e && e.message ? e.message : String(e)) });
  }
};

/*
 * Netlify Functions 로 쓰려면 파일을 netlify/functions/generate.js 로 두고
 * 아래 형태로 감싸면 됩니다(요지는 동일):
 *
 * exports.handler = async (event) => {
 *   const body = JSON.parse(event.body || "{}");
 *   ...위와 동일하게 Anthropic 호출...
 *   return { statusCode: 200, headers:{...cors}, body: JSON.stringify({ text }) };
 * };
 */
