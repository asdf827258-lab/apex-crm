/*
 * APEX YUN PRO — 채용 지원 접수 (Netlify Functions)
 * ─────────────────────────────────────────────────────────────────────────
 * 후보가 사주·성향 검사를 마치고 "상담 신청"을 누르면 여기로 온다.
 * 후보는 로그인하지 않으므로 앱에서 바로 DB 에 넣을 수 없다(넣게 열어두면
 * 아무나 쓸 수 있는 표가 된다). 그래서 이 함수가 service_role 로 대신 넣는다.
 *
 * 같은 번호로 다시 내면 새 줄을 만들지 않고 기존 줄을 갱신한다
 * (recruits.phone_hash 유니크 인덱스 + merge-duplicates).
 *
 * 필요한 Netlify 환경변수:
 *   SUPABASE_SERVICE_ROLE_KEY  = Supabase 설정 → API → service_role 키  ← 필수·비밀
 *   SUPABASE_URL               = (선택) 기본값 아래 프로젝트 URL
 *   RECRUIT_PHONE_SALT         = (선택) 번호 해시에 섞는 값. 바꾸면 중복합치기가 새로 시작된다.
 *
 * ⚠️ service_role 키는 반드시 Netlify 환경변수에만 둔다(앱/브라우저 금지).
 */

const crypto = require("crypto");

const DEFAULT_SUPABASE_URL = "https://miakdhxtqofpndtlyzxa.supabase.co";
const MAX_BODY = 200 * 1024;          // 본문 상한 — 검사 답안까지 들어와도 넉넉하다
const RATE_PER_HOUR = 5;              // 한 자리에서 한 시간에 받을 수 있는 제출 수
const INTENTS = ["now", "soon", "maybe", "no"];
const SOURCES = ["link", "qr", "seminar"];

function s(v, n) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, n);
}
function digits(v, n) {
  return String(v == null ? "" : v).replace(/[^0-9]/g, "").slice(0, n);
}
function intOr(v, lo, hi, dflt) {
  const n = parseInt(v, 10);
  if (isNaN(n) || n < lo || n > hi) return dflt;
  return n;
}
function pick(v, list, dflt) {
  const x = String(v == null ? "" : v);
  return list.indexOf(x) >= 0 ? x : dflt;
}
/* 큰 객체가 통째로 들어오는 것을 막는다 */
function smallJson(v, maxChars) {
  try {
    if (v == null || typeof v !== "object") return {};
    const t = JSON.stringify(v);
    if (t.length > maxChars) return {};
    return v;
  } catch (e) { return {}; }
}

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

  const raw = event.body || "";
  if (raw.length > MAX_BODY)
    return { statusCode: 413, headers: cors, body: JSON.stringify({ message: "보내신 내용이 너무 큽니다." }) };

  let b;
  try { b = JSON.parse(raw); } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ message: "형식이 올바르지 않습니다." }) };
  }

  /* 동의 없이는 한 글자도 저장하지 않는다 */
  if (b.consent !== true)
    return { statusCode: 400, headers: cors, body: JSON.stringify({ message: "개인정보 수집·이용 동의가 필요합니다." }) };

  const name = s(b.name, 40);
  const phone = digits(b.phone, 20);
  if (!name)
    return { statusCode: 400, headers: cors, body: JSON.stringify({ message: "이름을 넣어 주세요." }) };
  if (phone.length < 9 || phone.length > 11)
    return { statusCode: 400, headers: cors, body: JSON.stringify({ message: "연락처를 다시 확인해 주세요." }) };

  const SB_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_KEY)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "서버에 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다." }) };

  const salt = process.env.RECRUIT_PHONE_SALT || "apex-recruit";
  const phoneHash = crypto.createHash("sha256").update(salt + "|" + phone).digest("hex");

  /* 같은 자리에서 쏟아지는 장난 제출을 막는다. 주소 원본은 저장하지 않고
     소금을 섞은 해시만 남긴다 — 누가 어디서 왔는지 알려는 게 아니라
     한 자리에서 몇 번 넣었는지만 세기 위해서다. */
  const rawIp = (event.headers["x-nf-client-connection-ip"] ||
    (event.headers["x-forwarded-for"] || "").split(",")[0] || "").trim();
  const ipHash = rawIp ? crypto.createHash("sha256").update(salt + "|ip|" + rawIp).digest("hex") : null;
  if (ipHash) {
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const q = SB_URL + "/rest/v1/recruits?select=id&ip_hash=eq." + ipHash +
        "&created_at=gte." + encodeURIComponent(since) + "&limit=" + (RATE_PER_HOUR + 1);
      const chk = await fetch(q, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
      if (chk.ok) {
        const prev = await chk.json();
        if (Array.isArray(prev) && prev.length >= RATE_PER_HOUR)
          return { statusCode: 429, headers: cors, body: JSON.stringify({
            message: "같은 곳에서 너무 여러 번 보내셨습니다. 잠시 후 다시 시도해 주세요." }) };
      }
    } catch (e) { /* 세다가 막히면 접수는 막지 않는다 — 진짜 지원자를 놓치는 게 더 나쁘다 */ }
  }

  const recruiterId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(String(b.recruiterId || "")) ? String(b.recruiterId) : null;

  const row = {
    org: s(b.org, 60),
    recruiter: s(b.recruiter, 40),
    recruiter_id: recruiterId,
    source: pick(b.source, SOURCES, "link"),
    name: name,
    phone: phone,
    phone_hash: phoneHash,
    ip_hash: ipHash,
    contact_time: s(b.contactTime, 40),
    intent: pick(b.intent, INTENTS, "maybe"),
    memo: s(b.memo, 500),
    gender: s(b.gender, 4),
    birth_y: intOr(b.y, 1900, 2100, null),
    birth_m: intOr(b.m, 1, 12, null),
    birth_d: intOr(b.d, 1, 31, null),
    birth_h: intOr(b.H, 0, 23, null),
    no_time: b.noTime === true,
    mbti: /^[EI][SN][TF][JP]$/.test(String(b.mbti || "")) ? String(b.mbti) : "",
    blood: pick(b.blood, ["A", "B", "O", "AB"], ""),
    day_gz: s(b.dayGz, 8),
    saju: smallJson(b.saju, 4000),
    answers: smallJson(b.answers, 20000),
    scores: smallJson(b.scores, 4000),
    consistency: intOr(b.consistency, 0, 100, 0),
    finished: b.finished === true,
    elapsed_sec: intOr(b.elapsedSec, 0, 86400, 0),
    /* stage 는 일부러 보내지 않는다. 새 건이면 표의 기본값 'new' 가 들어가고,
       같은 번호로 다시 내도 담당자가 옮겨 둔 단계와 메모는 그대로 남는다. */
    consent: true,
    consent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    /* 같은 번호면 기존 줄을 갱신한다. 보내지 않은 칸(stage·owner_note)은
       건드리지 않으므로 담당자가 옮겨 둔 단계와 메모는 그대로 남는다. */
    const res = await fetch(SB_URL + "/rest/v1/recruits?on_conflict=phone_hash", {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: "Bearer " + SB_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    });
    const txt = await res.text();
    if (!res.ok) {
      return { statusCode: 502, headers: cors, body: JSON.stringify({ message: "접수 중 문제가 생겼습니다. 잠시 후 다시 눌러 주세요.", detail: txt.slice(0, 400) }) };
    }
    let id = null;
    try { const j = JSON.parse(txt); if (j && j[0]) id = j[0].id; } catch (e) {}
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, id: id }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "접수 오류: " + (e && e.message ? e.message : String(e)) }) };
  }
};
