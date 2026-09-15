/* ══ 폰 알람 — <b>앱이 부르는 자리</b> ═══════════════════════════════
 *
 * 앱(app/index.html 의 alm*)이 여기에 두 가지를 묻습니다 —
 *   GET  ?key=1       이 서버의 공개 열쇠를 주세요 (구독할 때 한 번)
 *   POST {endpoint}   이 폰에 시험 알람을 한 번 보내 주세요
 *
 * ★ <b>여기에 예약(schedule)을 걸지 마십시오.</b> Netlify 는 예약으로 등록한
 *   함수를 <b>HTTP 로 못 부르게</b> 막습니다 — 403 을 돌려줍니다. 처음에는
 *   보내는 일까지 한 함수에 넣고 예약을 걸었는데, 그 순간 앱이 열쇠를 못
 *   받아 <b>폰 알람이 조용히 안 켜졌습니다.</b> 사장님이 알람을 켜셨는데
 *   push_subs 가 0줄이었습니다. 시각에 맞춰 보내는 일은 push-cron.js 가
 *   합니다. check-push 가 이 둘이 섞이지 않는지 지킵니다 (8번).
 *
 * ★ 봉하기·서명은 scripts/push-core.js 한 곳에 있습니다 (5번).
 * ★ 열쇠는 환경변수에만 (10번) · 고객 이름은 여기 안 옵니다 (3번).
 */
const P = require('../../scripts/push-core.js');

exports.handler = async function (event) {
  const q = (event && event.queryStringParameters) || {};
  const method = (event && event.httpMethod) || 'GET';

  /* ① 앱이 열쇠를 묻는다 — 없으면 <b>없다고</b> 대답한다 (1번) */
  if (method === 'GET') {
    const why = P.PUB ? '' : '서버에 알람 열쇠(VAPID_PUBLIC)가 아직 없습니다.';
    return { statusCode: 200, headers: P.JSON_HEAD,
      body: JSON.stringify({ key: P.PUB || null, why: why }) };
  }

  if (method !== 'POST')
    return { statusCode: 405, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '쓸 수 없는 방법입니다' }) };

  const bad = P.ready();
  if (bad) return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: bad }) };

  /* ② 시험 — 그 주소를 가진 폰에만. 주소를 아는 것 자체가 그 폰이라는 증거다 */
  let ep = '';
  try { ep = (JSON.parse(event.body || '{}') || {}).endpoint || ''; } catch (e) { ep = ''; }
  if (!ep) return { statusCode: 400, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: '어느 폰인지 안 적혀 있습니다' }) };

  const g = await P.sb(P.TABLE + '?endpoint=eq.' + encodeURIComponent(ep) + '&select=*');
  const row = (g.json || [])[0];
  if (!row) return { statusCode: 404, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: '서버에 담기지 않은 폰입니다' }) };
  if (row.last_at && (Date.now() - new Date(row.last_at).getTime()) < P.TEST_GAP_MS)
    return { statusCode: 429, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '조금 뒤에 다시 해 주세요' }) };

  let r;
  try { r = await P.sendOne(row, { title: 'APEX YUN PRO (시험)', body: '서버에서 보낸 알람입니다.', go: '/app/index.html' }); }
  catch (e) { return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: false, reason: String((e && e.message) || e).slice(0, 160) }) }; }

  if (r.status === 404 || r.status === 410) { await P.drop(ep);
    return { statusCode: 200, headers: P.JSON_HEAD,
      body: JSON.stringify({ ok: false, reason: '이 폰 주소가 만료되어 지웠습니다 — 다시 켜 주세요' }) }; }

  await P.touch(ep, r.ok ? 0 : (row.fail || 0) + 1);
  return { statusCode: 200, headers: P.JSON_HEAD,
    body: JSON.stringify({ ok: r.ok, status: r.status, reason: r.text }) };
};
