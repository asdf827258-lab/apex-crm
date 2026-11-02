/* @toss: 토스페이먼츠 */   /* ★ 기계가 읽는 이름표 (S09 · check-namerule) */
/* ══════════════════════════════════════════════════════════════════════
   💳 <b>다음 결제일을 셈하는 자리. 한 곳입니다.</b> — 판 X291

   사장님 말씀 (2026-11-02) — 「<b>처음 날짜를 기억</b>」.

   ── 왜 ────────────────────────────────────────────────────────────────
   여태 두 함수가 저마다 이렇게 셈했습니다 —
       d.setMonth(d.getMonth() + 1)
   setMonth 는 <b>없는 날을 다음 달로 넘깁니다.</b> 1월 31일에 한 달을
   더하면 「2월 31일」 이 되고, 그것이 <b>3월 3일</b> 이 됩니다. 그래서
   31일에 시작한 구독은 <b>1/31 → 3/3 → 4/3 → 5/3 …</b> 으로 영영 밀렸습니다.
   한 해면 <b>한 달 가까이</b> 밀립니다 — 사장님이 받으실 돈이 늦어집니다.

   ── 무엇을 하나 ───────────────────────────────────────────────────────
   ★ <b>처음 날(anchor)을 기억</b>합니다. 1월 31일에 시작하셨으면 그 뒤로도
     <b>31일</b>이 기준입니다 — 2월처럼 31일이 없는 달에만 <b>그 달 말일</b>로
     한 번 내려갔다가, 3월에는 <b>다시 31일</b>로 돌아옵니다.
       1/31 → 2/28 → 3/31 → 4/30 → 5/31 …
     「미끄러짐만 막기」 로 하면 2/28 뒤로 28일에 굳습니다. 그래서 처음 날을
     따로 들고 있어야 합니다 (사장님이 고르신 쪽).
   ★ <b>한국 날</b>로 셈합니다. 결제일은 사장님과 고객이 <b>한국 달력</b>으로
     보시는 날짜입니다. 서버(UTC)의 날로 세면 밤에 시작한 구독이 하루
     어긋납니다.
   ★ <b>시각은 그대로</b> 둡니다 — 날짜만 옮깁니다.
   ★ 해마다 결제(year)는 <b>열두 달</b>을 더합니다. 그래서 2월 29일에
     시작한 구독도 평년에는 2월 28일로 내려갔다가, 다음 윤년에 29일로
     돌아옵니다.

   ⚠ <b>여기서만 셈합니다</b> (CLAUDE.md 5번). toss-billing · toss-confirm 이
     이 파일을 부릅니다 — 한쪽에만 고치면 두 곳이 다른 날을 말합니다.
   점검 : scripts/check-billday.js
   ══════════════════════════════════════════════════════════════════════ */

const KST = 9 * 3600 * 1000;

/* 그 순간의 <b>한국 달력</b> 조각 */
function kstParts(ms) {
  const d = new Date(ms + KST);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(),
           hh: d.getUTCHours(), mi: d.getUTCMinutes(), ss: d.getUTCSeconds(), ms: d.getUTCMilliseconds() };
}
/* 한국 달력의 그 날·그 시각이 가리키는 <b>진짜 순간</b> */
function kstAt(y, m, day, hh, mi, ss, ms) {
  return Date.UTC(y, m, day, hh, mi, ss, ms) - KST;
}
/* 그 달의 마지막 날 */
function lastDay(y, m) {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

/* 구독이 <b>처음 걸린 날</b>(1~31).
   ★★ <b>칸을 새로 두지 않았습니다.</b> 표에 이미 <b>started_at</b> 이 있고
     그것이 바로 「처음 날」 입니다 — 사장님이 SQL 을 돌리실 일이 없고,
     <b>옛 구독도 오늘부터 바로</b> 바르게 돕니다.
   ⚠ 칸을 더 두었다면 더 위험했습니다 — 아직 그 칸이 없는 서버에 그것을
     적어 보내면 PostgREST 가 400 으로 되돌려 <b>구독 만들기가 통째로
     실패</b>합니다. 돈이 오가는 길은 조용히 막히면 안 됩니다 (1번).
   ★ 그래도 <b>anchor_day</b> 를 먼저 봅니다 — 나중에 사장님이 칸을 두시면
     그쪽이 이기게 두는 것입니다. 지금은 아무도 안 적습니다. */
function anchorOf(sub, fallbackMs) {
  const a = sub && sub.anchor_day;
  if (a && a >= 1 && a <= 31) return a | 0;
  const base = (sub && sub.started_at) ? Date.parse(sub.started_at) : NaN;
  const ms = isNaN(base) ? (fallbackMs == null ? Date.now() : fallbackMs) : base;
  return kstParts(ms).d;
}

/* 다음 결제일 — <b>처음 날을 기준</b>으로, 그 달에 그 날이 없으면 말일 */
function addPeriod(from, cycle, anchorDay) {
  const t = (from instanceof Date) ? from.getTime()
          : (typeof from === "number" ? from : Date.parse(from));
  const p = kstParts(t);
  const n = (cycle === "year") ? 12 : 1;
  const ty = p.y + Math.floor((p.m + n) / 12);
  const tm = ((p.m + n) % 12 + 12) % 12;
  const want = (anchorDay && anchorDay >= 1 && anchorDay <= 31) ? (anchorDay | 0) : p.d;
  const day = Math.min(want, lastDay(ty, tm));
  return new Date(kstAt(ty, tm, day, p.hh, p.mi, p.ss, p.ms));
}

module.exports = { KST, kstParts, kstAt, lastDay, anchorOf, addPeriod };
