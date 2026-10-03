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
 * ★ <b>cnt</b> — 그 슬롯을 셀 수 있나.
 *     true  … 셀 수 있다. <b>0 이면 안 울립니다</b> (「0건」 알람은 알람이
 *             아니라 방해입니다).
 *     false … 못 센다. 숫자 없이 <b>알려만</b> 줍니다.
 *
 * ★★ 2026-10-03 · <b>여기 적혀 있던 말이 틀렸습니다.</b> 예상업적 칸에
 *    「expect_premium 은 DB·업적관리에 있어 본체가 못 읽습니다」 라고
 *    적어 두고 cnt 를 false 로 두었습니다. 그 말이 거짓이었습니다 — 그 금액은
 *    <b>dbs 의 칸</b>이고 홈이 이미 읽는 표입니다(2026-10-02 에 밝혀졌습니다).
 *    사장님 말씀 X05 「17시 예상업적 알람에 숫자」 가 그 거짓말 때문에
 *    <b>보류</b>로 남아 있었습니다. cnt 를 true 로 돌립니다.
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
    { k: 'perf', h: 17, t: '예상업적',     on: true,  cnt: true,
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

  /* ══ 17시 <b>예상업적</b> — 알람에 적는 글 ═══════════════════════════
     ★★ <b>앱과 서버가 이 한 함수를 부릅니다</b> (5번). 폰이 열려 있으면
       앱이(almLineFor), 잠겨 있으면 서버가(push-cron) 띄우는데 두 글이
       다르면 사장님이 <b>어느 쪽이 맞나</b> 를 물어야 합니다. 그 물음이
       생기는 순간 알람은 쓸모가 없어집니다.
     ★ 수는 <b>apex-pex.js</b> 가 세고, 금액 글은 <b>apex-won.js</b> 가
       적습니다. 여기서 더하거나 쉼표를 찍지 않습니다.
     ★ <b>못 센 것은 수를 한 자도 안 적습니다</b> (1번) — null 을 받으면
       null 을 돌려주고, 부르는 쪽이 표의 body 를 그대로 보냅니다.
     ★ <b>금액이 안 적힌 건수를 꼭 함께</b> 적습니다. 예상업적을 아직 안
       적으신 건이 섞이면 합이 작게 나오는데, 그것을 「적다」 로 읽으면
       거짓입니다.                                                      */
  function almWon(v) {
    var W = (typeof APEX_WON !== 'undefined') ? APEX_WON : null;
    if (!W) { try { W = require('../apex-won.js'); } catch (e) { W = null; } }
    return W ? W.txt(v) : null;
  }
  /* 울릴까 — 세 수가 다 0 이고 진행중도 없으면 <b>안 울립니다</b>.
     ★ <b>못 센 것(null)은 0 이 아닙니다</b> — 그때는 부르는 쪽이 표의 글로
       알려만 줍니다. 여기서 「안 울림」 으로 치면 <b>조용히 사라집니다</b>. */
  function almPerfWorth(o) {
    if (!o) return false;
    /* ★ <b>금액이 하나라도 있을 때만</b> 울립니다. 처음에 「진행중 건수」도
       넣었다가 재어 보니 <b>금액이 다 0 인데 울렸습니다</b> — 「진행중 예상
       0원 · 이번 달 0원 · 지난달 0원」 은 알람이 아니라 방해입니다.
       금액을 아직 안 적으신 건수는 <b>홈이 그 자리에서</b> 보여 줍니다. */
    return !!(o.live.won || o.now.won || o.last.won);
  }
  function almPerfTitle(o) {
    if (!o) return null;
    var t = almWon(o.live.won);
    return t ? ('예상업적 ' + t) : null;
  }
  function almPerfBody(o) {
    if (!o) return null;
    var a = almWon(o.live.won), b = almWon(o.now.won), c = almWon(o.last.won);
    if (a === null || b === null || c === null) return null;
    var L = ['진행중 예상 ' + a, '이번 달 ' + b, '지난달 ' + c], w = [];
    if (o.noAmt)  w.push('금액 안 적힌 ' + o.noAmt + '건');
    if (o.noDate) w.push('체결일 빈 ' + o.noDate + '건');
    if (o.guess)  w.push('예상으로 대신 센 ' + o.guess + '건');
    if (o.off)    w.push('보류·무산 ' + o.off + '건은 뺐습니다');
    return L.join(' · ') + (w.length ? ('\n' + w.join(' · ')) : '');
  }
  /* 한 줄로 — 부르는 쪽은 이것만 씁니다. 못 세면 <b>null</b> 입니다. */
  function almPerfLine(o) {
    if (!almPerfWorth(o)) return null;
    var t = almPerfTitle(o), b = almPerfBody(o);
    return (t && b) ? { title: t, body: b } : null;
  }

  var API = { ALM_SLOTS: ALM_SLOTS, almSlotOf: almSlotOf, almSlotAt: almSlotAt,
               almPerfLine: almPerfLine, almPerfWorth: almPerfWorth,
               almPerfTitle: almPerfTitle, almPerfBody: almPerfBody };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;   /* 서버 */
  for (var n in API) if (API.hasOwnProperty(n)) root[n] = API[n];              /* 앱 */
})(typeof globalThis !== 'undefined' ? globalThis : this);
