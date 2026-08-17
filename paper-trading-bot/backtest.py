"""백테스트 — 과거 데이터로 규칙에 구멍이 있는지 찾는다.

미래를 예측하는 도구가 아니다. '규칙이 말이 되는가' 를 보는 도구다.

⚠️ 백테스트를 좋게 보이게 만드는 반칙을 여기서 막는다.
   ① 신호가 난 봉의 종가로 체결 → 실제로는 그 종가를 보고 나서야 주문한다.
      그래서 여기서는 **다음 봉 시가**로 체결한다.
   ② 수수료·슬리피지 0 → 항상 반영하고 결과에 가정값을 함께 출력한다.
   ③ 미래 참조 → 지표는 shift 로 과거만 보게 만들고, 루프도 i 시점까지만 읽는다.
   ④ 봉 안쪽 미래 참조 → 트레일링 스톱을 **이번 봉의 고가로 올린 뒤 이번 봉의
      저가로 손절 판정**하면, 봉 안에서 고가와 저가 중 뭐가 먼저였는지 모르면서
      나에게 유리한 쪽으로 가정하는 것이 된다. 그래서 판정은 '들고 들어온 스톱'
      으로 하고, 스톱은 판정이 끝난 뒤에 올린다.
   ⑤ 종목을 하나씩 끝까지 돌리기 → SPY 를 전 구간 다 돌린 뒤에야 BTC 가 시작하면
      'BTC 진입 시점에 SPY 를 들고 있는가' 가 항상 거짓이 된다. 상관 필터가
      호출은 되는데 한 번도 막지 못한다(실제로 3433번 호출·0번 차단이었다).
      그래서 전 종목을 **시간 순으로 섞어서** 돌린다.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import pandas as pd

import portfolio as pf
from portfolio import Portfolio, Trade
from risk import manager as rm
from strategies import breakout, mean_reversion, trend_following

STRATS = {
    "mean_reversion": mean_reversion,
    "breakout": breakout,
    "trend_following": trend_following,
}


@dataclass
class Costs:
    commission_bps: float = 0.0
    slippage_bps: float = 5.0

    def fill_price(self, price: float, side: str) -> float:
        """슬리피지 — 살 때는 조금 비싸게, 팔 때는 조금 싸게 체결된다."""
        slip = price * (self.slippage_bps / 10_000.0)
        return price + slip if side in ("long", "buy") else price - slip

    def commission(self, notional: float) -> float:
        return abs(notional) * (self.commission_bps / 10_000.0)


@dataclass
class OpenPos:
    side: str
    qty: float
    entry_price: float
    entry_time: str
    stop: float
    atr_mult: float
    peak: float          # 트레일링 스톱용 — 롱이면 최고가, 숏이면 최저가
    entry_fee: float = 0.0   # 진입 수수료. 손익에 같이 넣어야 거래 한 건의 실제 비용이 된다


def _trail(pos: OpenPos, bar: pd.Series) -> float:
    """트레일링 스톱을 따라 올린다. 절대 뒤로 물러나지 않는다.

    ⚠️ 반드시 '손절 판정이 끝난 뒤' 에 부른다. 판정 전에 부르면 이번 봉의 고가로
       스톱을 올려놓고 이번 봉의 저가로 판정하게 되어, 봉 안쪽 순서를 나에게
       유리하게 가정하는 셈이 된다.
    """
    atr = float(bar.get("atr") or 0)
    if atr <= 0:
        return pos.stop
    if pos.side == "long":
        pos.peak = max(pos.peak, float(bar["high"]))
        return max(pos.stop, pos.peak - atr * pos.atr_mult)
    pos.peak = min(pos.peak, float(bar["low"]))
    return min(pos.stop, pos.peak + atr * pos.atr_mult)


class SymbolRunner:
    """한 종목의 진행 상태. 봉 하나씩(step) 전진한다.

    종목별로 끝까지 돌리지 않고 한 봉씩 전진시킬 수 있어야, 전 종목을 시간 순으로
    섞어서 돌릴 수 있다. 그래야 상관 필터가 '같은 시각에 무엇을 들고 있는가' 를
    실제로 보게 된다.
    """

    def __init__(self, df, *, symbol, strategy, params, costs, equity_ref,
                 per_trade_pct=1.0, open_positions=None, correlation_filter=True):
        self.mod = STRATS[strategy]
        self.data = self.mod.prepare(df, params)
        self.idx = self.data.index
        self.symbol = symbol
        self.costs = costs
        self.equity_ref = equity_ref
        self.per_trade_pct = per_trade_pct
        self.open_positions = open_positions if open_positions is not None else {}
        self.correlation_filter = correlation_filter
        self.stop_mult = float(params.get(
            "atr_stop_mult", getattr(self.mod, "DEFAULTS", {}).get("atr_stop_mult", 2.0)))
        self.fractional = str(symbol).upper().startswith("BTC")
        self.pos: OpenPos | None = None
        self.trades: list = []
        self.blocked_count = 0        # 상관 필터가 실제로 몇 번 막았는가

    # ── 청산 한 건을 장부에 적는다 ──────────────────────────────────────
    def _close(self, exit_px: float, exit_time: str, reason: str) -> None:
        pos = self.pos
        gross = (exit_px - pos.entry_price) * pos.qty
        if pos.side == "short":
            gross = -gross
        fee = self.costs.commission(exit_px * pos.qty) + pos.entry_fee
        t = Trade(symbol=self.symbol, side=pos.side, entry_time=pos.entry_time,
                  entry_price=pos.entry_price, exit_time=exit_time, exit_price=exit_px,
                  qty=pos.qty, pnl=round(gross - fee, 6), reason=reason)
        self.trades.append(t)
        self.equity_ref["equity"] += t.pnl
        self.open_positions.pop(self.symbol.upper(), None)
        self.pos = None

    def n_steps(self) -> int:
        """마지막 봉에서는 '다음 봉' 이 없어 체결할 수 없다 → len-1 까지만 본다."""
        return max(0, len(self.data) - 1)

    def step(self, i: int) -> None:
        row = self.data.iloc[i]
        nxt = self.data.iloc[i + 1]
        now = str(self.idx[i])

        # ── ① 손절 먼저. '들고 들어온' 스톱으로 판정한다 (이번 봉 고가로 올리기 전) ──
        if self.pos is not None:
            hit = (self.pos.side == "long" and float(row["low"]) <= self.pos.stop) or \
                  (self.pos.side == "short" and float(row["high"]) >= self.pos.stop)
            if hit:
                exit_px = self.costs.fill_price(
                    self.pos.stop, "sell" if self.pos.side == "long" else "buy")
                self._close(exit_px, now, "stop")
            else:
                # 살아남았으면 이제 스톱을 올린다 — 다음 봉부터 적용된다
                self.pos.stop = _trail(self.pos, row)

        sig = self.mod.signal(row, self.pos.side if self.pos else None)

        # ── ② 청산 신호 → 다음 봉 시가 ──
        if self.pos is not None and sig == "exit":
            raw = float(nxt["open"])
            exit_px = self.costs.fill_price(raw, "sell" if self.pos.side == "long" else "buy")
            self._close(exit_px, str(self.idx[i + 1]), "signal")
            return

        # ── ③ 진입 신호 → 다음 봉 시가 ──
        if self.pos is None and sig in ("long", "short"):
            if self.correlation_filter and rm.correlation_blocked(
                    self.symbol, sig, self.open_positions):
                self.blocked_count += 1
                return
            atr = float(row.get("atr") or 0)
            if atr <= 0:
                return
            raw = float(nxt["open"])
            entry_px = self.costs.fill_price(raw, "buy" if sig == "long" else "sell")
            stop = rm.stop_from_atr(entry_px, atr, self.stop_mult, sig)
            if stop is None:
                return
            qty = rm.position_size(self.equity_ref["equity"], entry_px, stop,
                                   self.per_trade_pct, allow_fractional=self.fractional)
            if qty <= 0:
                return
            # 진입 수수료는 여기서 잔고에서 빼지 않는다. 청산할 때 pnl 에 한 번만
            # 반영한다 — 양쪽에서 빼면 같은 수수료를 두 번 무는 셈이 된다.
            fee = self.costs.commission(entry_px * qty)
            self.pos = OpenPos(side=sig, qty=qty, entry_price=entry_px,
                               entry_time=str(self.idx[i + 1]), stop=stop,
                               atr_mult=self.stop_mult, peak=entry_px, entry_fee=fee)
            self.open_positions[self.symbol.upper()] = sig

    def finish(self) -> None:
        """끝났는데 들고 있으면 마지막 종가로 정리한다 (미청산은 성과를 왜곡한다)."""
        if self.pos is None:
            return
        last = self.data.iloc[-1]
        exit_px = self.costs.fill_price(
            float(last["close"]), "sell" if self.pos.side == "long" else "buy")
        self._close(exit_px, str(self.idx[-1]), "end_of_data")


def run_symbol(
    df: pd.DataFrame,
    *,
    symbol: str,
    strategy: str,
    params: dict,
    costs: Costs,
    equity_ref: dict,
    per_trade_pct: float = 1.0,
    open_positions: dict | None = None,
    correlation_filter: bool = True,
) -> list:
    """한 종목만 처음부터 끝까지 돌린다. 체결된 거래 목록을 돌려준다.

    여러 종목을 같이 돌릴 때는 run() 을 쓴다 — 이 함수를 종목마다 부르면
    시간이 어긋나서 상관 필터가 무력해진다.
    """
    r = SymbolRunner(df, symbol=symbol, strategy=strategy, params=params, costs=costs,
                     equity_ref=equity_ref, per_trade_pct=per_trade_pct,
                     open_positions=open_positions, correlation_filter=correlation_filter)
    for i in range(r.n_steps()):
        r.step(i)
    r.finish()
    return r.trades


def run(
    bars_by_symbol: dict,
    assets: list,
    *,
    costs: Costs,
    starting_equity: float = 100_000.0,
    per_trade_pct: float = 1.0,
    correlation_filter: bool = True,
    outdir: str = "results",
    source: str = "alpaca",
) -> dict:
    """전 종목 백테스트. 결과 dict 와 results/ 파일들을 남긴다."""
    os.makedirs(outdir, exist_ok=True)
    equity_ref = {"equity": float(starting_equity)}
    open_positions: dict = {}
    all_trades: list = []
    per_symbol: dict = {}

    # ── 종목별 주자를 만들고 ─────────────────────────────────────────────
    runners: dict = {}
    for a in assets:
        sym = a["symbol"]
        df = bars_by_symbol.get(sym)
        if df is None or len(df) < 50:
            per_symbol[sym] = {"error": "데이터가 부족합니다", "trades": 0}
            continue
        runners[sym] = SymbolRunner(
            df, symbol=sym, strategy=a["strategy"], params=a.get("params") or {},
            costs=costs, equity_ref=equity_ref, per_trade_pct=per_trade_pct,
            open_positions=open_positions, correlation_filter=correlation_filter,
        )

    # ── 전 종목의 봉을 하나의 시간축에 늘어놓고 시간 순으로 전진시킨다 ────
    #    종목마다 봉 간격이 다르다(15분·1시간·4시간). 그래도 시각으로 정렬하면
    #    '그 순간 무엇을 들고 있었는가' 가 실제와 같아진다. 상관 필터가 여기서
    #    비로소 진짜로 동작한다.
    timeline = []
    for sym, r in runners.items():
        for i in range(r.n_steps()):
            timeline.append((r.idx[i], sym, i))
    timeline.sort(key=lambda e: e[0])

    for _ts, sym, i in timeline:
        runners[sym].step(i)

    for sym, r in runners.items():
        r.finish()
        all_trades.extend(r.trades)
        curve = _curve_from(r.trades, starting_equity)
        per_symbol[sym] = pf.summarize(r.trades, curve, starting_equity)
        per_symbol[sym]["strategy"] = next(
            a["strategy"] for a in assets if a["symbol"] == sym)
        per_symbol[sym]["blocked_by_correlation"] = r.blocked_count

    all_trades.sort(key=lambda t: t.exit_time or t.entry_time)
    total_curve = _curve_from(all_trades, starting_equity)
    total = pf.summarize(all_trades, total_curve, starting_equity)
    total["final_equity"] = round(equity_ref["equity"], 2)

    pf.write_trades(os.path.join(outdir, "trades.csv"), all_trades)
    pf.write_daily_pnl(os.path.join(outdir, "daily_pnl.csv"), all_trades)
    _write_curve(os.path.join(outdir, "equity_curve.csv"), total_curve)
    _try_plot(total_curve, os.path.join(outdir, "backtest_results.png"), source)

    return {
        "source": source,
        "costs": {"commission_bps": costs.commission_bps, "slippage_bps": costs.slippage_bps},
        "starting_equity": starting_equity,
        "per_symbol": per_symbol,
        "total": total,
        "outdir": outdir,
    }


def _curve_from(trades: list, starting_equity: float) -> list:
    eq = starting_equity
    curve = [("start", eq)]
    for t in sorted(trades, key=lambda x: x.exit_time or x.entry_time):
        eq += t.pnl
        curve.append((t.exit_time or t.entry_time, eq))
    return curve


def _write_curve(path: str, curve: list) -> None:
    import csv
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["time", "equity"])
        for t, v in curve:
            w.writerow([t, round(v, 4)])


def _try_plot(curve: list, path: str, source: str) -> None:
    """그래프는 있으면 좋은 것. matplotlib 이 없어도 백테스트는 끝나야 한다."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        return
    # 출처 문자열에 한글이 섞여 있다("... 1061일 1707봉 (요청 744일 → ...)").
    # 기본 폰트(DejaVu Sans)에 한글이 없어서 그림에는 □□□ 가 찍히고, 글자 하나마다
    # 경고가 한 줄씩 나와 화면이 경고로 뒤덮인다. 한글 폰트가 깔려 있으면 쓰고,
    # 없으면 제목에서 한글을 떼어 낸다 — 그림 제목은 어차피 영어다.
    label = source
    if any(ord(ch) > 0x2000 for ch in source):
        try:
            from matplotlib import font_manager
            have = {f.name for f in font_manager.fontManager.ttflist}
            korean = next((f for f in ("Pretendard", "Noto Sans KR", "NanumGothic",
                                       "Malgun Gothic", "AppleGothic") if f in have), None)
        except Exception:
            korean = None
        if korean:
            matplotlib.rcParams["font.family"] = korean
            matplotlib.rcParams["axes.unicode_minus"] = False
        else:
            label = source.split(" ")[0]          # 'public:1hx4' 처럼 앞부분만
    try:
        ys = [v for _, v in curve]
        fig, ax = plt.subplots(figsize=(10, 4.5))
        ax.plot(range(len(ys)), ys, linewidth=1.4)
        ax.set_title(f"Equity curve ({label})")
        ax.set_xlabel("trade #")
        ax.set_ylabel("equity")
        ax.grid(alpha=0.3)
        fig.tight_layout()
        fig.savefig(path, dpi=110)
        plt.close(fig)
    except Exception:
        pass
