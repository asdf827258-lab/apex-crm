"""평균 회귀 — SPY, QQQ (15분봉)

너무 내려가면 사고, 너무 올라가면 팔고, 평균으로 돌아오면 닫는다.
지수는 한쪽으로 계속 가기보다 평균 근처를 오가는 성질이 있어서 이 규칙을 쓴다.

  진입: 종가가 20기간 평균에서 ±N 표준편차 밖으로 벗어났을 때
  청산: 종가가 평균으로 되돌아왔을 때
  손절: 진입가 기준 ATR 배수 (risk/manager.py 가 계산)
"""

from __future__ import annotations

import pandas as pd

from .indicators import sma, rolling_std, atr

NAME = "mean_reversion"
DEFAULTS = {"lookback": 20, "entry_std": 1.5, "atr_period": 14, "atr_stop_mult": 2.0}


def prepare(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    p = {**DEFAULTS, **(params or {})}
    out = df.copy()
    out["ma"] = sma(out["close"], p["lookback"])
    out["sd"] = rolling_std(out["close"], p["lookback"])
    out["atr"] = atr(out, p["atr_period"])
    out["upper"] = out["ma"] + p["entry_std"] * out["sd"]
    out["lower"] = out["ma"] - p["entry_std"] * out["sd"]
    return out


def signal(row: pd.Series, position: str | None) -> str:
    """이 봉을 보고 무엇을 할지. 'long' | 'short' | 'exit' | 'hold'

    row 는 prepare() 를 거친 한 줄이다. position 은 지금 들고 있는 방향.
    """
    for k in ("close", "ma", "upper", "lower"):
        v = row.get(k)
        if v is None or pd.isna(v):
            return "hold"                      # 지표가 아직 안 채워짐

    close, ma = float(row["close"]), float(row["ma"])

    if position == "long":
        return "exit" if close >= ma else "hold"        # 평균 복귀 = 목표 달성
    if position == "short":
        return "exit" if close <= ma else "hold"

    if close < float(row["lower"]):
        return "long"
    if close > float(row["upper"]):
        return "short"
    return "hold"
