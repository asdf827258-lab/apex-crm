"""돌파 — BTC/USD (1시간봉)

새 고점을 뚫을 때 사고, 새 저점을 깨면 판다. 단, 거래량이 실려야 한다.
거래량 없는 돌파는 되돌아오는 경우가 많아서 걸러낸다.

  진입(롱): 종가가 20기간 최고가를 넘고 + 거래량이 20기간 평균의 1.5배 이상
  진입(숏): 종가가 20기간 최저가를 깨고 + 같은 거래량 조건
  청산:     2×ATR 트레일링 스톱 (backtest/broker 가 관리)

⚠️ 최고/최저는 '직전 20봉' 으로 본다. 현재 봉을 포함하면 종가가 자기 자신을
   넘을 수 없어 신호가 영원히 안 난다. shift(1) 이 그 처리다.
"""

from __future__ import annotations

import pandas as pd

from .indicators import atr, rolling_max, rolling_min

NAME = "breakout"
DEFAULTS = {"lookback": 20, "volume_mult": 1.5, "atr_period": 14, "atr_stop_mult": 2.0}


def prepare(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    p = {**DEFAULTS, **(params or {})}
    n = p["lookback"]
    out = df.copy()
    # 직전 n봉 기준 — 현재 봉은 빼고 본다
    out["hh"] = rolling_max(out["high"], n).shift(1)
    out["ll"] = rolling_min(out["low"], n).shift(1)
    out["vol_ma"] = out["volume"].rolling(n, min_periods=n).mean().shift(1)
    out["atr"] = atr(out, p["atr_period"])
    out["vol_ok"] = out["volume"] >= (out["vol_ma"] * p["volume_mult"])
    return out


def signal(row: pd.Series, position: str | None) -> str:
    for k in ("close", "hh", "ll", "vol_ma"):
        v = row.get(k)
        if v is None or pd.isna(v):
            return "hold"

    close = float(row["close"])
    vol_ok = bool(row.get("vol_ok", False))

    if position == "long":
        # 저점을 깨면 나온다 (트레일링 스톱과 별개인 신호 청산)
        return "exit" if close < float(row["ll"]) else "hold"
    if position == "short":
        return "exit" if close > float(row["hh"]) else "hold"

    if not vol_ok:
        return "hold"                          # 거래량 없는 돌파는 무시
    if close > float(row["hh"]):
        return "long"
    if close < float(row["ll"]):
        return "short"
    return "hold"
