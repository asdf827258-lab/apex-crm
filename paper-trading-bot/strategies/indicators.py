"""지표 계산 — 세 전략이 공유한다.

⚠️ 모든 지표는 '그 봉까지의 정보만' 쓴다. 미래를 훔쳐보지 않는다.
   pandas 의 rolling/ewm 은 기본이 과거만 보므로 그대로 쓰되,
   shift(-1) 같은 미래 참조를 쓰지 않는 것이 규칙이다.
"""

from __future__ import annotations

import pandas as pd


def sma(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).mean()


def rolling_std(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).std(ddof=0)


def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False, min_periods=n).mean()


def true_range(df: pd.DataFrame) -> pd.Series:
    """오늘 고저폭 / 어제 종가와의 갭 중 큰 것 — 갭까지 반영한 변동폭."""
    prev_close = df["close"].shift(1)
    a = df["high"] - df["low"]
    b = (df["high"] - prev_close).abs()
    c = (df["low"] - prev_close).abs()
    return pd.concat([a, b, c], axis=1).max(axis=1)


def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    """평균 진짜 변동폭. 포지션 크기를 정하는 자."""
    return true_range(df).rolling(n, min_periods=n).mean()


def rolling_max(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).max()


def rolling_min(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).min()
