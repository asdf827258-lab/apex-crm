/*
 * APEX YUN PRO — 채용 후보 문자 발송 (Netlify Functions)
 * ─────────────────────────────────────────────────────────────────────────
 * 대응 묶음에서 "문자 보내기"를 누르면 여기로 온다. 돈이 나가는 일이라
 * 안전장치를 겹겹이 두었다.
 *
 *   1) 로그인한 사람만. 앱이 보낸 Supabase 토큰을 서버에서 다시 확인한다.
 *      (확인 없이 열어두면 주소만 알면 누구나 돈을 쓸 수 있다)
 *   2) 내 후보에게만. 관리자·대표가 아니면 자기에게 배정된 건만 보낸다.
 *   3) 동의한 사람에게만. consent 가 true 가 아니면 번호가 있어도 뺀다.
 *   4) 밤에는 안 보낸다. 21시~08시(한국)에는 거절한다.
 *   5) 하루 상한. 기본 300건.
 *   6) 미리보기(dryRun). 키가 있어도 실제로 보내지 않고 보낼 내용만 돌려준다.
 *   7) 보낸 기록을 recruit_sends 에 남긴다.
 *
 * 필요한 Netlify 환경변수 (없으면 아무것도 보내지 않고 안내만 돌려준다):
 *   SOLAPI_API_KEY      = 솔라피 API 키
 *   SOLAPI_API_SECRET   = 솔라피 API 시크릿           ← 비밀
 *   SMS_SENDER          = 미리 등록한 발신번호(숫자만)
 *   SUPABASE_SERVICE_ROLE_KEY                          ← 비밀
 *   SMS_DAILY_CAP       = (선택) 하루 상한. 기본 300
 *
 * ⚠️ 광고성 문구를 보내려면 (광고) 표기와 무료 수신거부 안내가 따로 필요하다.
 *    이 함수는 "본인이 상담을 신청한 분께 보내는 회신"만 전제로 한다.
 */

const crypto = require("crypto");

const DEFAULT_SUPABASE_URL = "https://miakdhxtqofpndtlyzxa.supabase.co";
const SOLAPI_URL = "https://api.solapi.com/messages/v4/send-many/detail";
const MAX_PER_CALL = 100;
const NIGHT_FROM = 21, NIGHT_TO = 8;        // 한국시간 기준

function s(v, n) {
  return String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").trim().slice(0, n);
}
function digits(v) { return String(v == null ? "" : v).replace(/[^0-9]/g, ""); }
function kstHour() {
  return new Date(Date.now() + 9 * 3600000).getUTCHours();
}

exports.handler = async function (event) {
  const cors = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
  const bad = (code, msg, extra) =>
    ({ statusCode: code, headers: cors, body: JSON.stringify(Object.assign({ message: msg }, extra || {})) });

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return bad(405, "POST만 허용됩니다.");

  const SB_URL = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_KEY) return bad(500, "서버에 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.");

  let b;
  try { b = JSON.parse(event.body || "{}"); } catch (e) { return bad(400, "형식이 올바르지 않습니다."); }

  const dryRun = b.dryRun !== false;        /* 기본은 미리보기. 보내려면 명시해야 한다 */
  const ids = Array.isArray(b.ids) ? b.ids.filter(function (x) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x));
  }).slice(0, MAX_PER_CALL) : [];
  const texts = (b.texts && typeof b.texts === "object") ? b.texts : {};
  if (!ids.length) return bad(400, "보낼 대상이 없습니다.");

  /* ── 1) 누가 부르는지 확인한다 ───────────────────────────── */
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return bad(401, "로그인이 필요합니다.");
  let me;
  try {
    const who = await fetch(SB_URL + "/auth/v1/user", {
      headers: { apikey: SB_KEY, Authorization: "Bearer " + token },
    });
    if (!who.ok) return bad(401, "로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
    me = await who.json();
  } catch (e) { return bad(401, "로그인 정보를 확인할 수 없습니다."); }
  if (!me || !me.id) return bad(401, "로그인 정보를 확인할 수 없습니다.");

  let role = "member", myName = "";
  try {
    const pr = await fetch(SB_URL + "/rest/v1/profiles?select=name,role&id=eq." + me.id,
      { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    if (pr.ok) { const j = await pr.json(); if (j && j[0]) { role = j[0].role || "member"; myName = j[0].name || ""; } }
  } catch (e) {}
  const isAdmin = (role === "admin" || role === "owner");

  /* ── 2) 밤에는 보내지 않는다 ─────────────────────────────── */
  const h = kstHour();
  if (!dryRun && (h >= NIGHT_FROM || h < NIGHT_TO))
    return bad(400, "밤에는 보내지 않습니다(21시~08시). 아침에 다시 눌러 주세요.");

  /* ── 3) 대상을 서버에서 다시 읽는다 ──────────────────────── */
  let rows = [];
  try {
    const q = SB_URL + "/rest/v1/recruits?select=id,name,phone,consent,recruiter_id&id=in.(" + ids.join(",") + ")";
    const rs = await fetch(q, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    if (!rs.ok) return bad(502, "대상을 읽지 못했습니다.", { detail: (await rs.text()).slice(0, 300) });
    rows = await rs.json();
  } catch (e) { return bad(500, "대상을 읽지 못했습니다."); }

  const skipped = [];
  const targets = rows.filter(function (r) {
    if (r.consent !== true) { skipped.push({ name: r.name, why: "동의 없음" }); return false; }
    if (digits(r.phone).length < 9) { skipped.push({ name: r.name, why: "번호 이상" }); return false; }
    if (!isAdmin && r.recruiter_id !== me.id) { skipped.push({ name: r.name, why: "내 담당 아님" }); return false; }
    return true;
  });
  if (!targets.length)
    return bad(400, "보낼 수 있는 대상이 없습니다.", { skipped: skipped });

  /* ── 4) 하루 상한 ────────────────────────────────────────── */
  const cap = Math.max(1, parseInt(process.env.SMS_DAILY_CAP || "300", 10) || 300);
  try {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const q2 = SB_URL + "/rest/v1/recruit_sends?select=ok_count&dry_run=is.false&created_at=gte." + encodeURIComponent(since);
    const r2 = await fetch(q2, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    if (r2.ok) {
      const sent = (await r2.json()).reduce(function (a, x) { return a + (x.ok_count || 0); }, 0);
      if (!dryRun && sent + targets.length > cap)
        return bad(429, "하루 상한(" + cap + "건)을 넘습니다. 오늘 이미 " + sent + "건 보냈습니다.");
    }
  } catch (e) {}

  /* ── 5) 보낼 내용 ────────────────────────────────────────── */
  const from = digits(process.env.SMS_SENDER || "");
  const key = process.env.SOLAPI_API_KEY || "";
  const secret = process.env.SOLAPI_API_SECRET || "";
  const messages = targets.map(function (r) {
    return { to: digits(r.phone), from: from, text: s(texts[r.id] || b.text || "", 1000) };
  }).filter(function (m) { return !!m.text; });
  if (!messages.length) return bad(400, "보낼 문구가 비어 있습니다.");

  const preview = messages.slice(0, 3).map(function (m, i) {
    return { to: m.to.slice(0, 3) + "****" + m.to.slice(-4), name: targets[i].name, text: m.text };
  });

  async function log(ok, fail, note) {
    try {
      await fetch(SB_URL + "/rest/v1/recruit_sends", {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY,
          "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ sent_by: me.id, sent_name: s(myName, 40), segment: s(b.segment, 20),
          total: messages.length, ok_count: ok, fail_count: fail, dry_run: !!dryRun, note: s(note, 300) }),
      });
    } catch (e) {}
  }

  if (dryRun) {
    await log(0, 0, "미리보기");
    return { statusCode: 200, headers: cors, body: JSON.stringify({
      ok: true, dryRun: true, count: messages.length, skipped: skipped, preview: preview,
      configured: !!(key && secret && from),
      message: (key && secret && from)
        ? "미리보기입니다. 실제로 보내려면 다시 확인해 주세요."
        : "아직 문자 서비스가 연결되지 않았습니다. Netlify 환경변수에 SOLAPI_API_KEY · SOLAPI_API_SECRET · SMS_SENDER 를 넣으면 보낼 수 있습니다." }) };
  }

  if (!key || !secret || !from) {
    await log(0, messages.length, "미설정");
    return bad(400, "문자 서비스가 연결되지 않았습니다. Netlify 환경변수에 SOLAPI_API_KEY · SOLAPI_API_SECRET · SMS_SENDER(등록된 발신번호)를 넣어 주세요.");
  }

  /* ── 6) 실제 발송 ────────────────────────────────────────── */
  try {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString("hex");
    const sig = crypto.createHmac("sha256", secret).update(date + salt).digest("hex");
    const res = await fetch(SOLAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "HMAC-SHA256 apiKey=" + key + ", date=" + date + ", salt=" + salt + ", signature=" + sig,
      },
      body: JSON.stringify({ messages: messages }),
    });
    const txt = await res.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    const ok = (j && typeof j.groupInfo === "object" && j.groupInfo && j.groupInfo.count)
      ? (j.groupInfo.count.registeredSuccess || 0)
      : (res.ok ? messages.length : 0);
    const fail = messages.length - ok;
    await log(ok, fail, res.ok ? "" : txt.slice(0, 300));
    if (!res.ok)
      return bad(502, "문자 서버가 거절했습니다. 아래 내용을 확인해 주세요.", { detail: txt.slice(0, 500) });
    return { statusCode: 200, headers: cors, body: JSON.stringify({
      ok: true, sent: ok, failed: fail, skipped: skipped, detail: j }) };
  } catch (e) {
    await log(0, messages.length, String(e && e.message ? e.message : e).slice(0, 200));
    return bad(500, "발송 오류: " + (e && e.message ? e.message : String(e)));
  }
};
