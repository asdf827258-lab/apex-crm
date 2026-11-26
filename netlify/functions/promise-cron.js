/* ══ 💬 팀원 약속 알람 — <b>30분마다 깨어나는 자리</b> (판 X573) ══════════════
 *
 * netlify.toml 이 <b>매시 0분 · 30분</b>에 부릅니다. 하는 일은 P.promisePush 한 줄뿐이고,
 * 무엇을 언제 누구에게 보낼지는 app/promise-rule.js(MPR) 한 곳에 있습니다 (5번).
 *
 *   8:00   지점장 · 대표   ☀️ 아침 조회 — 팀 숫자 + 놓친 약속 (MPR.pushFor)
 *   8:00   팀원 본인       ☀️ 오늘 챙길 약속 (MPR.memberPush)
 *   12:00 · 17:00 팀원 본인 📋 아직 남은 약속 — 남았을 때만
 *   매 판  팀원 본인       ⏰ 시각 있는 약속 30분 전 (MPR.soonPush)
 *
 * ★ 왜 push-cron 에 안 두나 — push-cron 은 <b>매시 정각</b>에만 돕니다. 30분 전 알람은
 *   정각만으로는 못 맞춥니다. 그렇다고 push-cron 을 30분마다 돌리면 다른 알람(블로그 · 예상업적 …)이
 *   두 번 갑니다. 그래서 약속 알람만 이 자리로 옮겼습니다 — 둘이 서로를 모릅니다.
 * ★ 예약 전용입니다 — Netlify 는 예약 함수를 HTTP 로 못 부르게 막습니다(403).
 * ★ 고객에게는 아무것도 안 갑니다. 폰 알람을 켜 둔 기기(push_subs)에만, 본인 · 지점장 · 대표에게만.
 * ★ 못 읽으면 한 통도 안 보냅니다 — 반만 센 수를 보내지 않습니다 (1번).
 */
const P = require('../../scripts/push-core.js');

exports.handler = async function () {
  const bad = await P.ready();
  if (bad) return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, sent: 0, reason: bad }) };
  /* 몇 초 늦게 깨어나도 그 판으로 봅니다 — 0~29분이면 0분 판, 30~59분이면 30분 판 */
  const k = new Date(Date.now() + 9 * 3600 * 1000);
  const h = k.getUTCHours(), min = k.getUTCMinutes() < 30 ? 0 : 30;
  let r;
  try { r = await P.promisePush(h, { min: min }); }
  catch (e) { r = { ok: false, reason: String((e && e.message) || e).slice(0, 120) }; }
  return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify(Object.assign({ kstHour: h, min: min }, r)) };
};
