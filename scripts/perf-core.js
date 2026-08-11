/* 투자 성과 계산 — 순수 함수 모음 (이 파일이 유일한 정답지다)
   ══════════════════════════════════════════════════════════════════════════
   왜 따로 떼어 놓았나
     고객에게 "수익률 12%입니다" 라고 말하는 순간 그 숫자는 근거가 된다.
     (평가액-원금)/원금 은 추가납입이 한 번이라도 있으면 틀린다. 그래서
     제대로 된 두 가지를 쓴다.

       XIRR (금액가중) — "내 돈이 실제로 얼마나 불었나"
         언제 얼마를 넣고 뺐는지까지 반영. 고객에게 말할 때 이 숫자를 쓴다.

       TWR (시간가중)  — "굴린 솜씨가 어땠나"
         입출금 타이밍 영향을 걷어낸다. 벤치마크(코스피200 등)와 비교할 때
         이걸 써야 공정하다. 펀드 수익률 공시도 이 방식이다.

     둘은 다르게 나오는 게 정상이다. 오르기 직전에 목돈을 넣었으면
     XIRR > TWR, 오르고 나서 넣었으면 XIRR < TWR 이다.

   ── 부호 규칙 (여기서 헷갈리면 전부 틀어진다) ─────────────────────────────
     현금흐름은 '투자자 지갑' 기준이다.
       내 돈이 계좌로 들어감(매수·납입) → 음수(-)
       내 돈이 계좌에서 나옴(매도·인출·배당수령) → 양수(+)
       마지막에 남은 평가액 → 양수(+) 로 한 번 더 넣는다(지금 팔면 받을 돈)

   이 파일은 브라우저·서버 양쪽에서 같은 결과를 내야 한다.
   앱(app/index.html)에도 같은 함수가 들어 있고,
   scripts/check-perf.js 가 두 구현이 똑같은 답을 내는지 매번 대조한다.
   ══════════════════════════════════════════════════════════════════════════ */

'use strict';

const DAY = 86400000;

/* 'YYYY-MM-DD' | Date | ms → ms (UTC 자정 기준으로 눕힌다) */
function toMs(d) {
  if (d == null) return NaN;
  if (typeof d === 'number') return d;
  if (d instanceof Date) return d.getTime();
  const s = String(d).trim();
  const m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const t = Date.parse(s);
  return isNaN(t) ? NaN : t;
}
function yearsBetween(a, b) { return (b - a) / (365 * DAY); }
function fin(n) { return typeof n === 'number' && isFinite(n); }

/* ══════════════════════════════════════════════════════════════════════════
   XIRR — 불규칙한 시점의 현금흐름에 대한 연환산 내부수익률
   f(r) = Σ cf_i / (1+r)^t_i = 0  을 만족하는 r
   뉴턴법으로 빠르게 좁히고, 발산하면 이분법으로 확실하게 잡는다.
   ══════════════════════════════════════════════════════════════════════════ */
function xirr(flows, opts) {
  const o = opts || {};
  const cf = (flows || [])
    .map(f => ({ t: toMs(f.date != null ? f.date : f.t), v: Number(f.amount != null ? f.amount : f.v) }))
    .filter(f => fin(f.t) && fin(f.v) && f.v !== 0)
    .sort((a, b) => a.t - b.t);

  if (cf.length < 2) return null;
  /* 부호가 한쪽뿐이면 수익률이라는 개념이 성립하지 않는다 */
  const hasNeg = cf.some(f => f.v < 0), hasPos = cf.some(f => f.v > 0);
  if (!hasNeg || !hasPos) return null;

  const t0 = cf[0].t;
  const npv = r => {
    let s = 0;
    for (let i = 0; i < cf.length; i++) {
      const y = yearsBetween(t0, cf[i].t);
      const base = 1 + r;
      if (base <= 0) return NaN;
      s += cf[i].v / Math.pow(base, y);
    }
    return s;
  };

  /* ① 뉴턴법 */
  let r = fin(o.guess) ? o.guess : 0.1;
  for (let i = 0; i < 60; i++) {
    const f0 = npv(r);
    if (!fin(f0)) break;
    if (Math.abs(f0) < 1e-7) return round6(r);
    const h = 1e-6;
    const d = (npv(r + h) - f0) / h;
    if (!fin(d) || Math.abs(d) < 1e-12) break;
    const next = r - f0 / d;
    if (!fin(next)) break;
    if (next <= -0.9999999) { r = (r - 0.9999999) / 2; continue; }   /* -100% 아래로 못 간다 */
    if (Math.abs(next - r) < 1e-10) return round6(next);
    r = next;
  }

  /* ② 이분법 — 부호가 바뀌는 구간을 찾아 확실히 좁힌다 */
  let lo = -0.9, hi = 10, flo = npv(lo), fhi = npv(hi);

  /* 위쪽으로 넓히기 (대박 수익률) */
  let tries = 0;
  while (fin(flo) && fin(fhi) && flo * fhi > 0 && hi < 1e6 && tries++ < 40) {
    hi *= 2; fhi = npv(hi);
  }
  /* 아래쪽으로 넓히기 — -100% 에 바짝 붙여 간다.
     거의 전손(넣은 돈 100만, 남은 돈 1원)이면 답이 -99.9999% 근처라
     하한을 -0.9999 에 두면 구간을 못 잡고 null 이 되어 버린다. */
  for (let k = 2; k <= 14 && fin(flo) && fin(fhi) && flo * fhi > 0; k++) {
    lo = -1 + Math.pow(10, -k);
    flo = npv(lo);
  }
  if (!fin(flo) || !fin(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2, fm = npv(mid);
    if (!fin(fm)) return null;
    if (Math.abs(fm) < 1e-9 || (hi - lo) < 1e-12) return round6(mid);
    if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return round6((lo + hi) / 2);
}
function round6(n) { return Math.round(n * 1e6) / 1e6; }

/* ══════════════════════════════════════════════════════════════════════════
   TWR — 시간가중수익률 (입출금 영향을 걷어낸 '운용 성과')
   구간마다 수익률을 내고 이어 붙인다(chain-link).
   구간 수익률 = (기말평가액 - 기초평가액 - 순유입) / 기초평가액

   navs: [{date, value, flow}]  — value=그날 종가 평가액, flow=그날 순유입(+입금/-출금)
         flow 부호는 '계좌 기준' 이다(계좌로 들어오면 +). XIRR 의 지갑 기준과 반대라
         헷갈리기 쉬워 여기서만 계좌 기준으로 통일하고 이름도 flow 로 다르게 뒀다.
   ══════════════════════════════════════════════════════════════════════════ */
function twr(navs) {
  const rows = (navs || [])
    .map(n => ({ t: toMs(n.date != null ? n.date : n.t), v: Number(n.value), f: Number(n.flow || 0) }))
    .filter(n => fin(n.t) && fin(n.v))
    .sort((a, b) => a.t - b.t);
  if (rows.length < 2) return null;

  let growth = 1, used = 0;
  for (let i = 1; i < rows.length; i++) {
    const begin = rows[i - 1].v;
    /* 기초가 0이면 (계좌가 비어 있던 구간) 수익률을 정의할 수 없다 — 건너뛴다 */
    if (!(begin > 0)) continue;
    const r = (rows[i].v - begin - rows[i].f) / begin;
    if (!fin(r) || r <= -1) continue;
    growth *= (1 + r);
    used++;
  }
  if (!used) return null;
  return {
    total: round6(growth - 1),
    annualized: annualize(growth - 1, (rows[rows.length - 1].t - rows[0].t) / DAY),
    from: rows[0].t, to: rows[rows.length - 1].t, points: rows.length
  };
}

/* 누적수익률 → 연환산. 1년 미만은 부풀리지 않고 그대로 둔다(과대표시 방지). */
function annualize(totalReturn, days) {
  if (!fin(totalReturn) || !fin(days) || days <= 0) return null;
  if (days < 365) return null;
  return round6(Math.pow(1 + totalReturn, 365 / days) - 1);
}

/* ══════════════════════════════════════════════════════════════════════════
   거래내역 → XIRR 입력 현금흐름
   txns: [{date, kind, amount}]  kind: buy|sell|deposit|withdraw|dividend|fee
   endValue: 현재 평가액, endDate: 기준일
   ══════════════════════════════════════════════════════════════════════════ */
const OUTFLOW = { buy: 1, deposit: 1, fee: 1 };          /* 내 지갑에서 나감 → 음수 */
const INFLOW = { sell: 1, withdraw: 1, dividend: 1 };    /* 내 지갑으로 들어옴 → 양수 */

function txnsToFlows(txns, endValue, endDate) {
  const out = [];
  (txns || []).forEach(t => {
    const amt = Math.abs(Number(t.amount));
    if (!fin(amt) || amt === 0) return;
    const k = String(t.kind || '').toLowerCase();
    if (OUTFLOW[k]) out.push({ date: t.date, amount: -amt });
    else if (INFLOW[k]) out.push({ date: t.date, amount: amt });
    /* 모르는 종류는 계산에 넣지 않는다 — 조용히 틀리는 것보다 낫다 */
  });
  if (fin(Number(endValue)) && Number(endValue) !== 0) {
    out.push({ date: endDate != null ? endDate : Date.now(), amount: Number(endValue) });
  }
  return out;
}

/* 원금(순납입) — 넣은 돈에서 뺀 돈을 뺀 값 */
function netInvested(txns) {
  let s = 0;
  (txns || []).forEach(t => {
    const amt = Math.abs(Number(t.amount));
    if (!fin(amt)) return;
    const k = String(t.kind || '').toLowerCase();
    if (OUTFLOW[k]) s += amt;
    else if (INFLOW[k]) s -= amt;
  });
  return Math.round(s * 100) / 100;
}

/* ══════════════════════════════════════════════════════════════════════════
   자산배분 — 보유를 자산군별로 묶어 비중을 낸다
   holdings: [{code, market, assetClass, value}]  value=평가금액(원화 환산 후)
   ══════════════════════════════════════════════════════════════════════════ */
function allocation(holdings) {
  const by = {};
  let total = 0;
  (holdings || []).forEach(h => {
    const v = Number(h.value);
    if (!fin(v) || v <= 0) return;
    const cls = h.assetClass || h.cls || '기타';
    by[cls] = (by[cls] || 0) + v;
    total += v;
  });
  const list = Object.keys(by).map(k => ({
    cls: k, value: Math.round(by[k]),
    pct: total > 0 ? round6(by[k] / total * 100) : 0
  })).sort((a, b) => b.value - a.value);
  return { total: Math.round(total), list: list };
}

/* ══════════════════════════════════════════════════════════════════════════
   리밸런싱 — 목표 비중에서 밴드만큼 벗어났는지 보고, 맞추려면 얼마를 사고팔지
   targets: [{cls, target, band}]  target·band 는 % 단위 (band 없으면 기본 5%)
   ══════════════════════════════════════════════════════════════════════════ */
function rebalance(alloc, targets, opts) {
  const o = opts || {};
  const defBand = fin(o.band) ? o.band : 5;
  const total = alloc && fin(alloc.total) ? alloc.total : 0;
  const cur = {};
  ((alloc && alloc.list) || []).forEach(x => { cur[x.cls] = x; });

  const rows = (targets || []).map(t => {
    const c = cur[t.cls] || { value: 0, pct: 0 };
    const band = fin(t.band) ? t.band : defBand;
    const diff = round6(c.pct - Number(t.target));
    const targetValue = Math.round(total * Number(t.target) / 100);
    return {
      cls: t.cls,
      current: c.pct, target: Number(t.target), band: band,
      diff: diff,
      off: Math.abs(diff) > band,
      action: diff > band ? 'sell' : (diff < -band ? 'buy' : 'hold'),
      amount: Math.abs(targetValue - c.value) > 0 ? Math.round(Math.abs(targetValue - c.value)) : 0,
      currentValue: Math.round(c.value), targetValue: targetValue
    };
  });

  /* 목표에 없는데 들고 있는 자산군 — 빠뜨리면 합이 안 맞는다 */
  const named = {};
  (targets || []).forEach(t => { named[t.cls] = 1; });
  ((alloc && alloc.list) || []).forEach(x => {
    if (named[x.cls]) return;
    rows.push({
      cls: x.cls, current: x.pct, target: 0, band: defBand,
      diff: x.pct, off: x.pct > defBand, action: x.pct > defBand ? 'sell' : 'hold',
      amount: x.pct > defBand ? Math.round(x.value) : 0,
      currentValue: Math.round(x.value), targetValue: 0, unlisted: true
    });
  });

  const off = rows.filter(r => r.off);
  return {
    total: total, rows: rows, offCount: off.length,
    needsRebalance: off.length > 0,
    /* 사고팔 금액이 균형을 이루는지 — 크게 어긋나면 목표 합이 100%가 아니라는 뜻 */
    buyAmount: rows.filter(r => r.action === 'buy').reduce((s, r) => s + r.amount, 0),
    sellAmount: rows.filter(r => r.action === 'sell').reduce((s, r) => s + r.amount, 0),
    targetSum: round6((targets || []).reduce((s, t) => s + Number(t.target || 0), 0))
  };
}

/* 벤치마크 대비 초과수익 (같은 기간 TWR 끼리 비교해야 공정하다) */
function excessReturn(portfolioTotal, benchTotal) {
  if (!fin(portfolioTotal) || !fin(benchTotal)) return null;
  return round6(portfolioTotal - benchTotal);
}

const API = {
  xirr, twr, annualize, txnsToFlows, netInvested,
  allocation, rebalance, excessReturn, toMs, round6
};

if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.PerfCore = API;
