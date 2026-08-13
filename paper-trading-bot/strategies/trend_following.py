"""추세 추종 — GLD, USO (4시간봉)

빠른 이동평균이 느린 것을 위로 뚫으면 사고, 아래로 뚫으면 판다.
원자재는 한 방향으로 오래 가는 성질이 있어서 이 규칙을 쓴다.

  진입(롱): 50 EMA 가 200 EMA 를 위로 교차
  청산/숏:  50 EMA 가 200 EMA 를 아래로 교차
  손절:     3×ATR 트레일링 스톱

⚠️ GLD·USO 는 금·원유 선물이 아니라 ETF 대리 자산이다.
   원자재 가격을 따라가지만 수익 구조가 같지 않다 (README 참고).

⚠️ 교차 판정에는 '직전 봉의 관계' 가 필요하다. 현재 봉만 보면 교차한 순간이
   아니라 '위에 있는 모든 구간' 이 신호가 되어 계속 진입한다.
"""

from __future__ import annotations

import pandas as pd

from .indicators import atr, ema

NAME = "trend_following"
DEFAULTS = {"fast_ema": 50, "slow_ema": 200, "atr_period": 14, "atr_stop_mult": 3.0}


def prepare(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    p = {**DEFAULTS, **(params or {})}
    out = df.copy()
    out["fast"] = ema(out["close"], p["fast_ema"])
    out["slow"] = ema(out["close"], p["slow_ema"])
    out["atr"] = atr(out, p["atr_period"])
    above = (out["fast"] > out["slow"]).astype(bool)
    # shift(fill_value=) 를 반드시 쓴다. fill_value 없이 shift 하면 첫 칸이 NaN 이 되어
    # dtype 이 object 로 바뀌고, 그러면 ~prev 가 True→-2, False→-1 (둘 다 참) 이 되어
    # 교차 판정이 통째로 무력해진다. 그러면 '위에 있는 모든 봉' 이 신호가 된다.
    prev_above = above.shift(1, fill_value=False).astype(bool)
    out["cross_up"] = above & ~prev_above
    out["cross_dn"] = ~above & prev_above
    return out


def signal(row: pd.Series, position: str | None) -> str:
    for k in ("fast", "slow"):
        v = row.get(k)
        if v is None or pd.isna(v):
            return "hold"

    up = bool(row.get("cross_up", False))
    dn = bool(row.get("cross_dn", False))

    if position == "long":
        return "exit" if dn else "hold"
    if position == "short":
        return "exit" if up else "hold"

    if up:
        return "long"
    if dn:
        return "short"
    return "hold"
