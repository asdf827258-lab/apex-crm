"""성과 집계 — 거래 기록에서 숫자를 뽑고 파일로 남긴다.

여기 숫자를 보고 다음 단계로 갈지 말지 정한다. 그래서 좋게 보이도록
반올림하거나 유리한 것만 고르지 않는다. 최대 낙폭과 샤프는 항상 함께 낸다.
"""

from __future__ import annotations

import csv
import math
import os
from dataclasses import dataclass, field
from typing import Optional

import pandas as pd


@dataclass
class Trade:
    symbol: str
    side: str                 # long | short
    entry_time: str
    entry_price: float
    exit_time: str = ""
    exit_price: float = 0.0
    qty: float = 0.0
    pnl: float = 0.0
    reason: str = ""          # 왜 나왔는지 (signal / stop / drawdown)


@dataclass
class Portfolio:
    starting_equity: float = 100_000.0
    equity: float = 100_000.0
    trades: list = field(default_factory=list)
    equity_curve: list = field(default_factory=list)   # [(time, equity)]

    def record(self, t: Trade) -> None:
        self.equity += t.pnl
        self.trades.append(t)

    def mark(self, when, equity: Optional[float] = None) -> None:
        self.equity_curve.append((when, self.equity if equity is None else equity))


# ══════════════════════════════════════════════════════════════════════════
# 지표
# ══════════════════════════════════════════════════════════════════════════
def max_drawdown_pct(curve: list) -> float:
    """자산곡선의 최대 낙폭(%). 15% 를 넘으면 다음 단계로 넘기지 않는다."""
    peak, worst = None, 0.0
    for _, v in curve:
        if v is None:
            continue
        if peak is None or v > peak:
            peak = v
        if peak and peak > 0:
            dd = (peak - v) / peak * 100.0
            worst = max(worst, dd)
    return round(worst, 4)


def sharpe(curve: list, periods_per_year: int = 252) -> Optional[float]:
    """구간 수익률의 샤프. 값이 없거나 변동이 0이면 None (0으로 속이지 않는다)."""
    vals = [v for _, v in curve if v]
    if len(vals) < 3:
        return None
    s = pd.Series(vals, dtype="float64")
    rets = s.pct_change().dropna()
    if len(rets) < 2:
        return None
    sd = float(rets.std(ddof=0))
    if sd == 0 or math.isnan(sd):
        return None
    return round(float(rets.mean()) / sd * math.sqrt(periods_per_year), 4)


def summarize(trades: list, curve: list, starting_equity: float) -> dict:
    wins = [t for t in trades if t.pnl > 0]
    losses = [t for t in trades if t.pnl < 0]
    total_pnl = sum(t.pnl for t in trades)
    avg_win = (sum(t.pnl for t in wins) / len(wins)) if wins else 0.0
    avg_loss = (sum(t.pnl for t in losses) / len(losses)) if losses else 0.0
    return {
        "trades": len(trades),
        "wins": len(wins),
        "losses": len(losses),
        "win_rate_pct": round(len(wins) / len(trades) * 100, 2) if trades else 0.0,
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "profit_factor": round(abs(sum(t.pnl for t in wins) / sum(t.pnl for t in losses)), 3)
                         if losses and sum(t.pnl for t in losses) != 0 else None,
        "total_pnl": round(total_pnl, 2),
        "return_pct": round(total_pnl / starting_equity * 100, 3) if starting_equity else 0.0,
        "max_drawdown_pct": max_drawdown_pct(curve),
        "sharpe": sharpe(curve),
    }


# ══════════════════════════════════════════════════════════════════════════
# 파일 기록
# ══════════════════════════════════════════════════════════════════════════
TRADE_COLS = ["entry_time", "exit_time", "symbol", "side", "qty",
              "entry_price", "exit_price", "pnl", "reason"]


def append_trade(path: str, t: Trade) -> None:
    """체결을 한 줄씩 남긴다. 파일이 없으면 머리글부터 만든다."""
    new = not os.path.exists(path)
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(TRADE_COLS)
        w.writerow([t.entry_time, t.exit_time, t.symbol, t.side, t.qty,
                    round(t.entry_price, 6), round(t.exit_price, 6), round(t.pnl, 4), t.reason])


def write_trades(path: str, trades: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(TRADE_COLS)
        for t in trades:
            w.writerow([t.entry_time, t.exit_time, t.symbol, t.side, t.qty,
                        round(t.entry_price, 6), round(t.exit_price, 6), round(t.pnl, 4), t.reason])


def write_daily_pnl(path: str, trades: list) -> None:
    """일별 손익. 청산된 날 기준으로 묶는다."""
    by_day: dict = {}
    for t in trades:
        if not t.exit_time:
            continue
        day = str(t.exit_time)[:10]
        by_day[day] = by_day.get(day, 0.0) + t.pnl
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["date", "pnl", "trades"])
        counts: dict = {}
        for t in trades:
            if t.exit_time:
                d = str(t.exit_time)[:10]
                counts[d] = counts.get(d, 0) + 1
        for d in sorted(by_day):
            w.writerow([d, round(by_day[d], 4), counts.get(d, 0)])
