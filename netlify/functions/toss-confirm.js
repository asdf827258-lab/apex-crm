/*
 * APEX YUN PRO — 토스페이먼츠 결제 최종 승인 + 구독 자동 활성화 (Netlify Functions)
 * ─────────────────────────────────────────────────────────────────────────
 * 흐름: 앱에서 카드 결제 성공 → 이 함수가 토스로 결제를 최종 승인(시크릿 키)하고,
 *       승인되면 해당 회원의 등급(profiles.plan)을 자동 부여한다(service_role).
 *
 * 이 파일은 저장소에 포함되어 있어 배포 시 자동으로 함께 올라갑니다.
 * 앱은  /api/toss-confirm  (→ 이 함수)로 호출합니다.
 *
 * 필요한 Netlify 환경변수 (Site settings → Environment variables):
 *   TOSS_SECRET_KEY            = 토스 시크릿 키(test_sk_… / live_sk_…)   ← 필수·비밀
 *   SUPABASE_SERVICE_ROLE_KEY  = Supabase 설정 → API → service_role 키    ← 필수·비밀
 *   SUPABASE_URL               = (선택) 기본값 아래 프로젝트 URL로 설정됨
 *
 * ⚠️ service_role·시크릿 키는 반드시 Netlify 환경변수에만 두세요(앱/브라우저 금지).
 */

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
// 공개 정보(anon 아님 주의: 여기선 URL만). 시크릿 키는 절대 코드에 넣지 않는다.
const DEFAULT_SUPABASE_URL = "https://miakdhxtqofpndtlyzxa.supabase.co";

exports.handler = async function (event) {
  const cors = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: cors, body: JSON.stringify({ message: "POST만 허용됩니다." }) };

  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "서버에 TOSS_SECRET_KEY 환경변수가 없습니다." }) };

  try {
    let b = {};
    try { b = JSON.parse(event.body || "{}"); } catch (e) { b = {}; }

    // 1) 토스 결제 최종 승인
    const auth = "Basic " + Buffer.from(secret + ":").toString("base64");
    const res = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey: b.paymentKey, orderId: b.orderId, amount: b.amount }),
    });
    const data = await res.json();

    // 2) 승인 성공 시 구독 자동 활성화 (service_role 로 RLS 우회)
    if (res.ok && b.userId && b.plan) {
      const SB_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
      const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (SB_URL && SB_KEY) {
        try {
          const until = new Date();
          if (b.cycle === "year") until.setFullYear(until.getFullYear() + 1);
          else until.setMonth(until.getMonth() + 1);
          const up = await fetch(SB_URL + "/rest/v1/profiles?id=eq." + encodeURIComponent(b.userId), {
            method: "PATCH",
            headers: {
              apikey: SB_KEY,
              Authorization: "Bearer " + SB_KEY,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ plan: b.plan, status: "approved", plan_until: until.toISOString() }),
          });
          data.__activated = up.ok;
          if (!up.ok) data.__activateError = await up.text();
        } catch (e) {
          data.__activated = false;
          data.__activateError = String(e && e.message ? e.message : e);
        }
      } else {
        data.__activated = false;
        data.__activateError = "SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.";
      }
    }

    return { statusCode: res.status, headers: cors, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "결제 승인 오류: " + (e && e.message ? e.message : String(e)) }) };
  }
};
