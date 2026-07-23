/*
 * APEX YUN PRO — Google Gemini API 공용 프록시 (Netlify Functions)
 * ────────────────────────────────────────────────────────────────
 * 목적: 팀원 30명이 각자 Gemini 키를 발급받지 않아도, 회사 Gemini 키 1개(서버 환경변수)로
 *       콘텐츠(블로그·SNS·마케팅)를 저렴하게 공용 사용하게 한다.
 *       Claude(비쌈)는 무거운 리포트·민감정보 전용, Gemini(쌈)는 일상 콘텐츠 전용으로 분리.
 *
 * 배포(Netlify):
 *   1) 이 파일을  netlify/functions/gemini.js  로 둔다(이미 위치함).
 *   2) 루트 netlify.toml 의 redirect 로  /api/gemini → 이 함수  연결(이미 설정).
 *   3) Netlify → Site settings → Environment variables 에
 *        GEMINI_API_KEY = AIza... 또는 AQ...   (회사 Gemini 키) 추가.
 *        (무료 키도 되지만, 30명 공용은 Google AI Studio에서 결제를 켠 유료 키를 권장 — 한도 수십 배)
 *   4) 앱 설정 → 무료 AI(Gemini) 카드 → "공용 프록시(무키)" 칸에  /api/gemini  입력.
 *
 * 남용 방지(선택): ALLOWED_ORIGIN 화이트리스트 + SHARED_TOKEN 공유토큰(Claude 프록시와 동일값 사용 가능).
 *
 * 설계: '얇은 통과 프록시'. 앱이 Google 표준 payload(systemInstruction/contents/generationConfig)를
 *       그대로 보내면, 서버가 model만 뽑아 URL을 만들고 키를 붙여 Google로 전달, 응답 원본을 되돌린다.
 *       → 앱의 기존 파싱·자동 이어쓰기 로직을 그대로 재사용(코드 변경 최소).
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

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

  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "서버에 GEMINI_API_KEY 환경변수가 없습니다." }) };

  if (SHARED_TOKEN) {
    const t = event.headers["x-app-token"] || event.headers["X-App-Token"];
    if (t !== SHARED_TOKEN)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ message: "토큰이 올바르지 않습니다." }) };
  }

  try {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (e) { body = {}; }

    // 모델명만 추출 후 payload에서 제거(Google이 모르는 필드로 거부하지 않도록)
    let model = body.model || "gemini-flash-latest";
    delete body.model;
    // 경로 조작 방지: 모델명 화이트리스트 문자만 허용
    model = String(model).replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 60) || "gemini-flash-latest";

    const url = BASE + model + ":generateContent?key=" + encodeURIComponent(key);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Google 응답(성공/에러 JSON)을 원본 상태코드 그대로 되돌린다 → 앱이 기존 방식대로 파싱.
    const text = await r.text();
    return {
      statusCode: r.status,
      headers: Object.assign({ "Content-Type": "application/json" }, cors),
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ message: "프록시 오류: " + (e && e.message ? e.message : String(e)) }),
    };
  }
};
