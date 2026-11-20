/* ══ 광고 저녁 자가 점검 — <b>예약으로 부르는 자리</b> ═════════════════
 *
 * 일은 ad-review.js 가 합니다. 여기는 <b>예약만</b> 받는 껍데기입니다.
 *
 * ★ <b>왜 나눴나.</b> Netlify 는 예약(schedule)으로 등록한 함수를 HTTP 로
 *   못 부르게 막습니다 — 403 을 돌려줍니다. ad-spend / ad-spend-cron 과
 *   같은 관례를 그대로 따릅니다.
 *
 * ★ <b>일을 여기 또 적지 않습니다</b> (5번). 두 벌이 되면 한쪽만 고쳐집니다.
 */
exports.handler = require('./ad-review.js').handler;
