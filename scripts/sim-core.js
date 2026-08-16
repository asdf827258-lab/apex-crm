/* ══════════════════════════════════════════════════════════════════════════
   모의 포트폴리오 엔진 — 순수 계산만 한다

   실제 주문은 절대 내지 않는다. 이 파일은 DB 도 네트워크도 모른다.
   "오늘 신호와 시세를 주면, 가상으로 무엇을 사고팔지" 만 돌려준다.
   부르는 쪽(netlify/functions/invest-sim.js)이 그 결과를 기록한다.

   왜 나눴나
     계산과 입출력이 섞여 있으면 검사할 수가 없다. 돈이 걸린 규칙일수록
     검사가 되어야 한다. perf-core.js 와 같은 이유, 같은 구조다.

   지키는 규칙 (config.yaml 과 같은 값을 쓴다)
     · 1% 룰      — 한 번에 거는 위험은 잔고의 1%. 손절 폭이 수량을 정한다
     · 낙폭 정지   — 고점 대비 10% 빠지면 전량 정리하고 멈춘다
     · 동시 3종목  — 그 이상 벌리지 않는다
     · 비용 5bps   — 사고팔 때마다 뗀다. 0 으로 두면 결과가 실제보다 좋아진다
   ══════════════════════════════════════════════════════════════════════════ */

const DEFAULTS = {
  perTradePct: 1.0,      /* 한 번에 거는 위험 (%) */
  maxDrawdownPct: 10.0,  /* 고점 대비 이만큼 빠지면 정지 */
  maxPositions: 3,       /* 동시 보유 상한 */
  costBps: 5.0,          /* 사고팔 때 비용 (bps) */
  stopPct: 2.5           /* 손절 거리 — 종목별 값이 없을 때 쓰는 기본값 (%) */
};

function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }
function round2(x) { return Math.round(x * 100) / 100; }

/* 비용은 사고팔 때 양쪽 다 뗀다 */
function cost(amount, bps) { return Math.abs(amount) * (bps / 10000); }

/* ══════════════════════════════════════════════════════════════════════════
   평가 — 지금 들고 있는 것의 값어치
   holdings: [{code, qty, avg}]   prices: {code: 종가}
   시세를 모르는 종목은 매입가로 잡고 몇 개인지 따로 세어 돌려준다.
   0 으로 채우면 평가액이 갑자기 줄어 낙폭 정지가 잘못 걸린다.
   ══════════════════════════════════════════════════════════════════════════ */
function value(holdings, prices) {
  let total = 0, unknown = 0;
  (holdings || []).forEach(h => {
    const qty = n(h.qty) || 0;
    if (qty <= 0) return;
    const px = n((prices || {})[h.code]);
    if (px == null) { unknown++; total += qty * (n(h.avg) || 0); }
    else total += qty * px;
  });
  return { value: Math.round(total), unknownPrices: unknown };
}

/* ══════════════════════════════════════════════════════════════════════════
   수량 — 손절 폭이 정한다

   수량을 먼저 정하고 손절을 끼워 맞추면 1% 한도가 그냥 깨진다. 그래서 함수
   모양을 반대로 못 하게 했다. 손절 거리가 0 이면 수량은 0 이고 주문은 없다.
   ══════════════════════════════════════════════════════════════════════════ */
function sizeFor(equity, price, stopDistance, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const budget = (n(equity) || 0) * (o.perTradePct / 100);
  const dist = n(stopDistance);
  const px = n(price);
  if (!budget || !dist || dist <= 0 || !px || px <= 0) return 0;
  return Math.floor(budget / dist);
}

/* 종목이 손절 거리를 안 알려주면 가격의 몇 % 로 잡는다 */
function defaultStop(price, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const px = n(price);
  return px == null ? null : Math.max(1, Math.round(px * o.stopPct / 100));
}

/* ══════════════════════════════════════════════════════════════════════════
   하루치 결정 — 오늘 무엇을 사고팔지

   state:   {cash, holdings:[{code,name,qty,avg}], peak, halted}
   signals: [{code, name, side:'buy'|'sell', strategy, reason, stopDistance?}]
   prices:  {code: 종가}

   돌려주는 것: {orders:[...], state:{...}, notes:[...]}
   orders 는 '가상 체결' 이다. 실제 주문이 아니다.
   ══════════════════════════════════════════════════════════════════════════ */
function decideDay(state, signals, prices, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const notes = [];
  const orders = [];

  let cash = n(state && state.cash) || 0;
  let holdings = ((state && state.holdings) || []).map(h => ({
    code: h.code, name: h.name || h.code,
    qty: n(h.qty) || 0, avg: n(h.avg) || 0
  })).filter(h => h.qty > 0);
  let peak = n(state && state.peak) || 0;
  let halted = !!(state && state.halted);

  const px = code => n((prices || {})[code]);
  const equityNow = () => cash + value(holdings, prices).value;

  /* ── ① 낙폭 정지가 먼저다 ──────────────────────────────────────────
     신호를 처리하기 전에 본다. 정지선을 넘은 날 새로 사는 일이 없게. */
  const eq = equityNow();
  if (eq > peak) peak = eq;
  const dd = peak > 0 ? (peak - eq) / peak * 100 : 0;

  if (!halted && peak > 0 && dd >= o.maxDrawdownPct) {
    holdings.forEach(h => {
      const p = px(h.code);
      if (p == null) { notes.push(`${h.code} 시세를 몰라 청산하지 못했습니다`); return; }
      const gross = h.qty * p;
      const fee = cost(gross, o.costBps);
      cash += gross - fee;
      orders.push({ code: h.code, name: h.name, side: 'sell', qty: h.qty, price: p,
                    amount: Math.round(gross - fee), reason: '낙폭 정지', forced: true });
    });
    holdings = holdings.filter(h => px(h.code) == null);   /* 못 판 것만 남는다 */
    halted = true;
    notes.push(`고점 대비 ${round2(dd)}% 빠져 정지선(${o.maxDrawdownPct}%)에 닿았습니다. 전량 정리하고 멈춥니다.`);
    return { orders, notes, state: { cash: Math.round(cash), holdings, peak: Math.round(peak), halted } };
  }

  if (halted) {
    notes.push('정지 상태입니다. 신호가 있어도 새로 사지 않습니다.');
    return { orders, notes, state: { cash: Math.round(cash), holdings, peak: Math.round(peak), halted } };
  }

  /* ── ② 매도 먼저 ──────────────────────────────────────────────────
     현금을 만들어 놓아야 매수가 가능하다. 순서를 바꾸면 살 수 있는데
     현금이 없어서 못 사는 일이 생긴다. */
  (signals || []).filter(s => String(s.side) === 'sell').forEach(s => {
    const held = holdings.filter(h => h.code === s.code)[0];
    if (!held) { notes.push(`${s.code} 매도 신호 — 들고 있지 않아 넘어갑니다`); return; }
    const p = px(s.code);
    if (p == null) { notes.push(`${s.code} 시세를 몰라 팔지 못했습니다`); return; }
    const gross = held.qty * p;
    const fee = cost(gross, o.costBps);
    cash += gross - fee;
    orders.push({ code: s.code, name: held.name, side: 'sell', qty: held.qty, price: p,
                  amount: Math.round(gross - fee), reason: s.reason || s.strategy || '' });
    holdings = holdings.filter(h => h.code !== s.code);
  });

  /* ── ③ 매수 ───────────────────────────────────────────────────────
     equity 는 매도가 끝난 뒤 값으로 잡는다. 매도 전 값으로 계산하면
     이미 판 종목의 값어치까지 위험예산에 넣게 된다. */
  const equity = equityNow();
  (signals || []).filter(s => String(s.side) === 'buy').forEach(s => {
    if (holdings.length >= o.maxPositions) {
      notes.push(`${s.code} 매수 신호 — 동시 보유 상한(${o.maxPositions}종목)이라 넘어갑니다`);
      return;
    }
    if (holdings.some(h => h.code === s.code)) {
      notes.push(`${s.code} 매수 신호 — 이미 보유 중이라 넘어갑니다`);
      return;
    }
    const p = px(s.code);
    if (p == null) { notes.push(`${s.code} 시세를 몰라 사지 못했습니다`); return; }

    const stop = n(s.stopDistance) || defaultStop(p, o);
    const qty = sizeFor(equity, p, stop, o);
    if (qty <= 0) { notes.push(`${s.code} 수량이 0 이라 넘어갑니다 (손절 거리 ${stop})`); return; }

    const gross = qty * p;
    const fee = cost(gross, o.costBps);
    if (gross + fee > cash) {
      /* 현금이 모자라면 살 수 있는 만큼만. 규칙을 넘겨서 사지는 않는다. */
      const affordable = Math.floor(cash / (p * (1 + o.costBps / 10000)));
      if (affordable <= 0) { notes.push(`${s.code} 현금이 모자라 넘어갑니다`); return; }
      const g2 = affordable * p, f2 = cost(g2, o.costBps);
      cash -= g2 + f2;
      holdings.push({ code: s.code, name: s.name || s.code, qty: affordable, avg: p });
      orders.push({ code: s.code, name: s.name || s.code, side: 'buy', qty: affordable, price: p,
                    amount: Math.round(g2 + f2), reason: s.reason || s.strategy || '', partial: true });
      notes.push(`${s.code} 현금이 모자라 ${qty}주 대신 ${affordable}주만 샀습니다`);
      return;
    }
    cash -= gross + fee;
    holdings.push({ code: s.code, name: s.name || s.code, qty: qty, avg: p });
    orders.push({ code: s.code, name: s.name || s.code, side: 'buy', qty: qty, price: p,
                  amount: Math.round(gross + fee), reason: s.reason || s.strategy || '' });
  });

  const endEq = cash + value(holdings, prices).value;
  if (endEq > peak) peak = endEq;

  return {
    orders, notes,
    state: { cash: Math.round(cash), holdings, peak: Math.round(peak), halted }
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   시나리오 — 하나의 숫자를 뽑지 않는다

   navs 로 일별 수익률을 만들고, 그 분포에서 나쁜쪽·중간·좋은쪽을 뽑아
   기간을 늘려 보여준다. "예상 수익률 18%" 같은 단일 예측은 만들지 않는다.
   그건 틀리고, 고객에게 보이면 투자권유가 된다.

   표본이 적으면 아예 null 을 돌려준다 — 20일치로 3년을 말하면 안 된다.
   ══════════════════════════════════════════════════════════════════════════ */
function scenarios(navs, opts) {
  const o = Object.assign({ minDays: 60, horizonDays: 252 }, opts || {});
  const rows = (navs || [])
    .map(x => ({ date: x.date || x.nav_date, v: n(x.value), flow: n(x.flow) || 0 }))
    .filter(x => x.v != null && x.v > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (rows.length < o.minDays + 1) {
    return { ok: false, days: rows.length, need: o.minDays + 1,
             reason: `표본이 ${rows.length}일치라 아직 말할 수 없습니다. 최소 ${o.minDays + 1}일 필요합니다.` };
  }

  /* 일별 수익률 — 그날 들어온 돈은 빼고 잰다 */
  const rets = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1].v;
    if (!prev) continue;
    rets.push((rows[i].v - prev - rows[i].flow) / prev);
  }
  if (rets.length < o.minDays) return { ok: false, days: rets.length, need: o.minDays };

  const sorted = rets.slice().sort((a, b) => a - b);
  const at = p => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];

  /* 분위수를 기간만큼 이어 붙인다. 복리로 늘리되 -100% 아래로는 안 간다. */
  const grow = r => Math.max(-0.99, Math.pow(1 + r, o.horizonDays) - 1);

  return {
    ok: true,
    days: rets.length,
    horizonDays: o.horizonDays,
    bad: round2(grow(at(0.10)) * 100),
    mid: round2(grow(at(0.50)) * 100),
    good: round2(grow(at(0.90)) * 100),
    assumptions: [
      `표본 ${rets.length}영업일의 일별 수익률 분포`,
      `${o.horizonDays}영업일(약 1년)로 늘려 본 것`,
      '10 / 50 / 90 분위수',
      '과거 분포이며 예측이 아닙니다'
    ]
  };
}

const API = { DEFAULTS, value, sizeFor, defaultStop, decideDay, scenarios, cost };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') window.SimCore = API;
