/* ══════════════════════════════════════════════════════════════════
   apex-pex.js — <b>업적을 세는 자. 이 파일 하나입니다.</b>

   사장님 말씀 (2026-10-02) — <b>「예상업적을 셀 수 있도록 스스로 매일 볼 수
   있도록 해. 지난달 업적과 이번달 예상업적 - 현재업적」</b>.

   ── 왜 파일을 따로 냈나 (5번) ─────────────────────────────────────
   업적을 세는 규칙은 <b>「DB · 업적관리」(edu-pipeline.html)</b> 한 곳에만
   있었습니다. 본체(app/index.html)는 그 수를 못 적고 <b>「본체가 못 읽어
   건수까지만 셉니다」</b> 라고만 적어 두었습니다.
   이제 본체도 세야 하는데, <b>규칙을 베껴 가면 두 벌</b>이 됩니다 — 한쪽만
   고쳐지면 홈과 업적관리가 <b>다른 금액</b>을 말하고, 그러면 어느 쪽이
   맞는지 알 수 없습니다. 그래서 <b>세는 자를 이 파일로 빼고 둘이 같이
   부릅니다.</b> 베낀 것이 아니라 <b>옮긴 것</b>입니다.

   ── 단위 (CLAUDE.md 4번) ──────────────────────────────────────────
   ★ <b>이 파일이 다루는 수는 모두 「원」</b>입니다. dbs.expect_premium 과
     dbs.contract_premium 이 원이기 때문입니다(migration_49 의 쪽지 —
     「예상 월납(원)」). 그래서 돌려주는 칸 이름도 <b>won</b> 입니다.
     만원으로 바꾸는 것은 <b>적는 쪽</b>이 합니다 — 여기서 미리 나누면
     부르는 쪽이 「만원인가 원인가」 를 다시 헷갈립니다. 실제로 만 배를
     틀려 「50만원」 이 「50억」 으로 찍힌 적이 있습니다.

   ── 모르는 것과 0 (CLAUDE.md 1번) ─────────────────────────────────
   ★ <b>칸을 못 읽었으면 0 이 아니라 null 입니다.</b> 「예상업적 0원」 은
     「한 건도 없다」 는 뜻이고, 그것은 거짓일 수 있습니다. 못 읽었으면
     부르는 쪽이 <b>수를 한 자도 안 적어야</b> 합니다.
   ★ <b>계약업적이 안 적힌 체결 건</b>은 예상업적으로 대신 셉니다 — 업적관리
     화면이 그렇게 셉니다(계약업적을 손으로 안 적는 날이 있습니다). 다만
     그렇게 센 건이 <b>몇 건인지 따로 돌려줍니다</b>(guess). 「적힌 값」 과
     「대신 쓴 값」 은 다른 것이라, 적는 쪽이 밝힐 수 있어야 합니다.
   ══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  var PEX = {};

  /* ── 판정 — <b>업적관리 화면에 있던 그 두 줄 그대로</b>입니다 ──
     체결 = 보류·무산이 아니고 단계가 계약완료 또는 증권전달.
     진행중 = 보류·무산도 아니고 체결도 아닌 것.                        */
  PEX.DONE_STAGES = ['계약완료', '증권전달'];
  PEX.isClosed = function (r) { return !!(r && r.closed); };
  PEX.isDone = function (r) {
    if (!r || r.closed) return false;
    return PEX.DONE_STAGES.indexOf(r.stage) >= 0;
  };
  PEX.isLive = function (r) { return !!r && !r.closed && !PEX.isDone(r); };

  /* 한 건의 <b>체결 업적(원)</b> — 계약업적이 비었으면 예상업적을 씁니다.
     돌려주는 둘째 값은 <b>대신 쓴 것인가</b> 입니다.                   */
  PEX.wonOf = function (r) {
    var c = +((r && r.contract) || 0);
    if (c) return { won: c, guess: false };
    return { won: +((r && r.expect) || 0), guess: true };
  };
  /* ★★ <b>금액이 적혀 있나</b> — 안 적힌 것은 <b>0 이 아니라 모르는 것</b>입니다
     (1번). 예상업적을 아직 안 적으신 건이 섞이면 합이 작게 나오는데, 그것을
     「작다」 로 읽으면 거짓입니다. 그래서 <b>몇 건이 안 적혀 있는지</b> 따로
     셉니다. 적는 쪽이 그 수를 꼭 밝혀야 합니다.                         */
  PEX.hasAmt = function (v) {
    return !(v === null || v === undefined || v === '' || !isFinite(+v) || +v === 0);
  };

  /* ── 더하기 — <b>덱이 쓰던 두 수 그대로</b>입니다 ──
     liveWon  진행중 예상업적 — 살아 있는 건의 expect 합
     doneWon  계약업적 — 체결한 건의 (contract 또는 expect) 합. <b>달을 안
              가립니다</b> — 「이번 달」 로 좁히는 것은 sum 이 합니다.
     ★ 더하는 글이 두 곳에 있으면 한쪽만 고쳐집니다 (5번). sum 도 이 둘을
       부릅니다 — 그래서 홈·업적관리·이 파일이 <b>한 셈</b>입니다.      */
  PEX.liveWon = function (rows) {
    var i, s = 0; rows = rows || [];
    for (i = 0; i < rows.length; i++) if (PEX.isLive(rows[i])) s += +(rows[i].expect || 0);
    return s;
  };
  PEX.doneWon = function (rows) {
    var i, s = 0; rows = rows || [];
    for (i = 0; i < rows.length; i++) if (PEX.isDone(rows[i])) s += PEX.wonOf(rows[i]).won;
    return s;
  };

  PEX.ym = function (s) { return ('' + (s || '')).slice(0, 7); };
  /* 달을 옮깁니다 — '2026-01' 의 한 달 앞은 '2025-12' 입니다 */
  PEX.ymShift = function (ym, n) {
    var y = +('' + ym).slice(0, 4), m = +('' + ym).slice(5, 7) + (+n || 0);
    if (!y || !m && m !== 0) return '';
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    return y + '-' + ('0' + m).slice(-2);
  };

  /* ══ <b>세 수</b> ═══════════════════════════════════════════════
     rows — {stage, closed, expect, contract, cdate} 꼴. 두 화면이 각자
            제 줄에서 이 다섯 칸만 뽑아 넘깁니다.
     ym   — 「이번 달」. 안 주면 셈하지 않고 <b>null</b> 입니다 (1번).

     돌려주는 것 —
       live  <b>진행중 예상업적</b>  살아 있는 건의 expect 합
       now   <b>이번 달 업적</b>     이번 달에 체결한 건
       last  <b>지난달 업적</b>      지난달에 체결한 건
       left  now 를 뺀 나머지        live.won (아직 안 된 것)
       guess 계약업적이 안 적혀 예상업적으로 <b>대신 센</b> 건수
       off   보류·무산 건수 — 셈에서 뺀 것이 몇 건인지 밝힙니다
     ★ 체결은 <b>체결일(cdate)</b> 로 셉니다 — 배정월로 세면 절반 넘게
       엉뚱한 달에 잡힙니다(업적관리 화면이 재어 둔 사실입니다).
     ★ 체결인데 <b>체결일이 비었으면</b> 어느 달인지 모릅니다. 이번 달로
       밀어 넣지 않고 <b>noDate 로 따로 셉니다</b> (1번).              */
  PEX.sum = function (rows, ym) {
    if (!rows || typeof rows.length !== 'number') return null;
    if (!ym) return null;
    var last = PEX.ymShift(ym, -1);
    var o = { ym: ym, lastYm: last,
              live: { won: 0, n: 0, noAmt: 0 }, now: { won: 0, n: 0, noAmt: 0 },
              last: { won: 0, n: 0, noAmt: 0 },
              left: 0, guess: 0, off: 0, noDate: 0, noAmt: 0, all: rows.length };
    var i, r, w, m;
    for (i = 0; i < rows.length; i++) {
      r = rows[i]; if (!r) continue;
      if (PEX.isClosed(r)) { o.off++; continue; }
      if (PEX.isDone(r)) {
        w = PEX.wonOf(r);
        m = PEX.ym(r.cdate);
        if (!m) { o.noDate++; continue; }       /* 어느 달인지 모릅니다 */
        if (w.guess && w.won) o.guess++;
        /* 금액이 <b>아예 안 적힌</b> 체결 건 — 합에 0 을 더하지만 <b>몇 건인지</b>
           따로 셉니다. 「업적 0원」 과 「얼마인지 안 적음」 은 다릅니다 (1번). */
        var noA = !PEX.hasAmt(r.contract) && !PEX.hasAmt(r.expect);
        if (noA) o.noAmt++;
        if (m === ym) { o.now.won += w.won; o.now.n++; if (noA) o.now.noAmt++; }
        else if (m === last) { o.last.won += w.won; o.last.n++; if (noA) o.last.noAmt++; }
        continue;
      }
      o.live.n++;
      if (!PEX.hasAmt(r.expect)) { o.live.noAmt++; o.noAmt++; }
    }
    /* ★ 합은 <b>liveWon 한 곳</b>이 냅니다 — 위 칸칸이 더하던 줄을 지웠습니다 */
    o.live.won = PEX.liveWon(rows);
    o.left = o.live.won;
    return o;
  };

  root.APEX_PEX = PEX;
  if (typeof module !== 'undefined' && module.exports) module.exports = PEX;
})(typeof window !== 'undefined' ? window : this);
