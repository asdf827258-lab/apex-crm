/* ══════════════════════════════════════════════════════════════════
   apex-won.js — <b>돈을 글로 적는 자. 이 파일 하나입니다.</b>

   사장님 말씀 (2026-10-03) — <b>「시작해」</b> → X05 「17시 예상업적 알람에
   숫자」. 그 알람은 <b>폰이 잠들어 있을 때 서버가</b> 보냅니다. 그러려면
   서버도 금액을 글로 적어야 하는데, 적는 자가 여태 <b>app/index.html 안의
   frWonR 하나</b>였습니다. 서버에 베껴 적으면 <b>두 벌</b>이 되고, 한쪽만
   고쳐지면 <b>화면과 알람이 다른 금액</b>을 말합니다 (CLAUDE.md 5번).
   그래서 규칙을 이 파일로 <b>옮기고</b>(베낀 것이 아닙니다) 둘이 같이
   부릅니다 — apex-pex.js · alm-slots.js · day-rank.js 와 같은 방식입니다.

   ── 왜 apex-pex.js 에 안 넣었나 ──────────────────────────────────
   apex-pex.js 는 <b>세는 자</b>이고, 그 파일은 제 머리글에 <b>「만원으로
   바꾸는 것은 적는 쪽이 한다」</b> 고 적어 두었습니다. 자(check-pex [6])도
   <b>「세는 자에 10000 이 한 번도 안 나온다」</b> 를 지킵니다 — 곱하거나
   나누는 자리가 <b>만 배 오류</b>의 자리이기 때문입니다 (4번). 글로 적는
   데는 억·만으로 가르려면 10000 이 꼭 필요합니다. 그래서 <b>세는 자와
   적는 자를 섞지 않고</b> 파일을 따로 둡니다 — 두 자가 서로를 지킵니다.

   ── 단위 (CLAUDE.md 4번) ────────────────────────────────────────
   ★ <b>txt(won) 은 「원」을 받습니다.</b> 이름이 WonR 꼴이었던 까닭도
     그것입니다. 만원을 넣으면 <b>만 배</b>가 틀립니다 — 실제로 「50만원」 이
     「50억」 으로 찍힌 적이 있습니다.
   ★ <b>모름과 0 을 가릅니다</b> (1번) — 못 읽은 것은 「—」, 정말 0 원인
     것은 「0원」 입니다. 못 읽은 것을 0 으로 적으면 「없다」 가 됩니다.
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  var WON = {};

  /* 천 단위 쉼표 — 본체의 fmt() 와 <b>같은 식</b>입니다. 다르게 적으면
     같은 금액이 화면과 알람에서 다른 모양으로 섭니다.                  */
  WON.num = function (n) { return Math.round(n).toLocaleString('ko-KR'); };

  /* <b>원</b>을 받아 「3억 5,719만원」 으로 적습니다.
     ★ 큰 금액은 <b>억</b>으로 적습니다 (4번) — 「50,000만원」 은 한 박자
       늦게 읽힙니다. 고객 앞에서 그 한 박자가 계약을 흔듭니다.          */
  WON.txt = function (won) {
    if (won === null || won === undefined || !isFinite(won)) return '—';
    won = Math.round(won);
    if (won === 0) return '0원';
    var neg = won < 0; won = Math.abs(won);
    var 만 = 10000, man = Math.floor(won / 만), rest = won - man * 만,
        eok = Math.floor(man / 만), m2 = man - eok * 만, s = '';
    if (eok > 0) s += WON.num(eok) + '억';
    if (m2 > 0) s += (s ? ' ' : '') + WON.num(m2) + '만';
    if (!s) s = WON.num(won) + '';
    else if (rest > 0 && !eok) s += ' ' + WON.num(rest);
    return (neg ? '-' : '') + s + '원';
  };

  root.APEX_WON = WON;
  if (typeof module !== 'undefined' && module.exports) module.exports = WON;
})(typeof window !== 'undefined' ? window : this);
