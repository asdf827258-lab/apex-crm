/* ══ 폰 알람 — <b>시각에 맞춰 보내는 자리</b> ═══════════════════════
 *
 * netlify.toml 이 <b>매시 정각</b>에 부릅니다. 사람마다 받고 싶은 시각이
 * 달라(push_subs.hour) 시각을 하나로 박지 않고, 매시간 깨어나 <b>그 시각으로
 * 정해 둔 폰에만</b> 보냅니다. 정해 둔 폰이 없는 시간에는 장부 한 줄만 읽고
 * 곧바로 끝납니다 (7번).
 *
 * ★ 이 함수는 <b>예약 전용</b>입니다. Netlify 가 예약 함수의 HTTP 호출을
 *   막으므로(403), 앱이 부르는 일은 push.js 가 맡습니다. 둘을 한 파일에
 *   두면 앱이 열쇠를 못 받아 폰 알람이 <b>조용히 안 켜집니다</b> — 실제로
 *   그렇게 배포한 적이 있습니다.
 *
 * ★ <b>여기서 오늘 할 일을 세지 않습니다</b> (5번). 세려면 TDO 표를 서버에도
 *   또 적어야 하고, 그러면 사장님이 앱에서 기준을 고치셨을 때 알람만 옛
 *   기준으로 말합니다 — 화면과 알람이 다른 말을 합니다. 그래서 「확인할
 *   시간입니다」 까지만 하고, 건수는 앱을 열면 그 자리에서 셉니다.
 *   <b>지어낸 숫자보다 없는 숫자가 낫습니다</b> (1번).
 *
 * ★ 죽은 주소(404·410)는 그 자리에서 지웁니다 — 안 지우면 매시간 없는
 *   폰을 두드립니다 (7번).
 */
const P = require('../../scripts/push-core.js');

exports.handler = async function () {
  const bad = await P.ready();
  if (bad) return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, sent: 0, reason: bad }) };

  const h = P.kstHour();
  const g = await P.sb(P.TABLE + '?hour=eq.' + h + '&select=*&limit=' + P.MAX_PER_RUN);
  if (!g.ok) return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, sent: 0, reason: '장부를 못 읽었습니다 — ' + g.text.slice(0, 160) }) };

  /* <b>한 폰에 한 번만</b> — 홈 화면 아이콘을 여럿 담으면 아이폰은 그것을
     각각 다른 웹앱으로 보아 구독이 여러 개 생깁니다. 그대로 두면 아침에
     그 수만큼 울립니다. */
  const rows = P.onePerDevice(g.json || []);
  const msg = P.morning();
  let sent = 0, gone = 0, failed = 0;
  for (const row of rows) {
    let r;
    try { r = await P.sendOne(row, msg); }
    catch (e) { failed++; continue; }
    if (r.ok) { sent++; await P.touch(row.endpoint, 0); }
    else if (r.status === 404 || r.status === 410) { gone++; await P.drop(row.endpoint); }
    else { failed++; await P.touch(row.endpoint, (row.fail || 0) + 1); }
  }
  return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: true, kstHour: h, subs: rows.length, sent: sent, gone: gone, failed: failed }) };
};
