/* ══ 알람 네 번 — <b>한 표</b> ═══════════════════════════════════════
 *
 * 사장님 말씀 (2026-09-25) — 「알람 하루 네 번 만들고」.
 * 목업(docs/토스판_사본.html)의 「나」 화면에 적힌 넷 그대로입니다.
 *
 * ★ <b>앱과 서버가 같은 파일을 읽습니다</b> (5번). 앱은 <script> 로,
 *   서버는 netlify.toml 의 included_files 로 받습니다 — day-rank.js 와
 *   같은 방식입니다. 여기 말고 어디에도 시각·문구를 적지 마십시오.
 *   두 벌이 되는 순간 <b>화면과 알람이 다른 말</b>을 합니다.
 *
 * ★ <b>body 에 숫자를 적지 않습니다</b> (1번). 서버는 아무것도 세지
 *   않습니다 — 세려면 앱의 기준을 서버에도 또 적어야 하고, 그러면 사장님이
 *   기준을 고치셨을 때 알람만 옛 기준으로 말합니다. 그래서 「확인할
 *   시간입니다」 까지만 하고, 건수는 앱을 열면 그 자리에서 셉니다.
 *   앱이 켜져 있을 때는 앱이 직접 세어 숫자를 담습니다(almLineFor).
 *
 * ★ <b>cnt</b> — 그 슬롯을 앱이 셀 수 있나.
 *     true  … 셀 수 있다. <b>0 이면 안 울립니다</b> (「0건」 알람은 알람이
 *             아니라 방해입니다).
 *     false … 못 센다. 숫자 없이 <b>알려만</b> 줍니다. 예상업적은
 *             expect_premium 이고 그 값은 「DB · 업적관리」(edu-pipeline.html)
 *             에 있어 본체가 못 읽습니다. <b>모르는 것을 지어 적지 않습니다</b>.
 *
 * ★ 시각은 사장님이 바꾸실 수 있습니다(h 는 기본값일 뿐입니다).
 *   바꾼 값은 이 브라우저와 서버 줄(push_subs.hours)에 남습니다.
 */
(function (root) {
  'use strict';

  var ALM_SLOTS = [
    { k: 'call', h: 9,  t: '오늘 걸 사람', on: true,  cnt: true,
      body: '오늘 걸 분을 확인할 시간입니다.' },
    { k: 'am',   h: 13, t: '오전 결과',   on: true,  cnt: true,
      body: '오전에 건 결과를 남길 시간입니다.' },
    { k: 'perf', h: 17, t: '예상업적',     on: true,  cnt: false,
      body: '오늘 예상업적을 확인할 시간입니다.' },
    { k: 'tmr',  h: 21, t: '내일 약속',   on: false, cnt: true,
      body: '내일 약속을 확인할 시간입니다.' }
  ];

  function almSlotOf(k) {
    for (var i = 0; i < ALM_SLOTS.length; i++) if (ALM_SLOTS[i].k === k) return ALM_SLOTS[i];
    return null;
  }

  /* 그 시각에 보낼 글 — <b>서버가 부르는 자리</b>입니다.
     시각이 겹치면 앞의 것을 씁니다(사장님이 둘을 같은 시각에 두셨을 때). */
  function almSlotAt(h) {
    for (var i = 0; i < ALM_SLOTS.length; i++) if (ALM_SLOTS[i].h === h) return ALM_SLOTS[i];
    return null;
  }

  var API = { ALM_SLOTS: ALM_SLOTS, almSlotOf: almSlotOf, almSlotAt: almSlotAt };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;   /* 서버 */
  for (var n in API) if (API.hasOwnProperty(n)) root[n] = API[n];              /* 앱 */
})(typeof globalThis !== 'undefined' ? globalThis : this);
