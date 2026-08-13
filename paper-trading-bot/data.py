"""시세 데이터 — Alpaca 에서 받아오고, 없으면 합성 데이터로 파이프라인을 검증한다.

인터넷이 막힌 곳이나 키가 아직 없을 때도 백테스트 배관이 도는지 확인할 수 있어야
한다. 그래서 --synthetic 을 두었다. 다만 합성 데이터의 성과는 아무 의미가 없다 —
'코드가 도는가' 만 본다. 결과 파일에도 그렇게 표시된다.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd

TF_MINUTES = {"1Min": 1, "5Min": 5, "15Min": 15, "1Hour": 60, "4Hour": 240, "1Day": 1440}


def _alpaca_timeframe(tf: str):
    from alpaca.data.timeframe import TimeFrame, TimeFrameUnit
    return {
        "1Min": TimeFrame.Minute,
        "5Min": TimeFrame(5, TimeFrameUnit.Minute),
        "15Min": TimeFrame(15, TimeFrameUnit.Minute),
        "1Hour": TimeFrame.Hour,
        "4Hour": TimeFrame(4, TimeFrameUnit.Hour),
        "1Day": TimeFrame.Day,
    }[tf]


def is_crypto(symbol: str) -> bool:
    return str(symbol).upper().startswith("BTC") or "/" in str(symbol)


def fetch_bars(symbol: str, timeframe: str, months: int = 6) -> pd.DataFrame:
    """Alpaca 에서 과거 봉을 받아온다. 실패하면 예외를 그대로 올린다."""
    key, sec = os.getenv("ALPACA_API_KEY"), os.getenv("ALPACA_SECRET_KEY")
    if not key or not sec:
        raise RuntimeError(".env 에 ALPACA_API_KEY / ALPACA_SECRET_KEY 가 없습니다.")

    end = datetime.now(timezone.utc) - timedelta(minutes=20)   # 최신 봉은 지연이 있어 살짝 뒤로
    start = end - timedelta(days=int(months * 31))
    tf = _alpaca_timeframe(timeframe)

    if is_crypto(symbol):
        from alpaca.data.historical import CryptoHistoricalDataClient
        from alpaca.data.requests import CryptoBarsRequest
        client = CryptoHistoricalDataClient(key, sec)
        req = CryptoBarsRequest(symbol_or_symbols=symbol, timeframe=tf, start=start, end=end)
        bars = client.get_crypto_bars(req)
    else:
        from alpaca.data.historical import StockHistoricalDataClient
        from alpaca.data.requests import StockBarsRequest
        client = StockHistoricalDataClient(key, sec)
        req = StockBarsRequest(symbol_or_symbols=symbol, timeframe=tf, start=start, end=end)
        bars = client.get_stock_bars(req)

    df = bars.df
    if df is None or len(df) == 0:
        raise RuntimeError(f"{symbol} 데이터가 비어 있습니다 (기간 {months}개월)")
    if isinstance(df.index, pd.MultiIndex):
        df = df.reset_index(level=0, drop=True)
    df = df.rename(columns=str.lower)
    keep = [c for c in ("open", "high", "low", "close", "volume") if c in df.columns]
    df = df[keep].copy()
    df.index = pd.to_datetime(df.index, utc=True)
    return df.sort_index()


def synthetic_bars(symbol: str, timeframe: str, months: int = 6, seed: int | None = None) -> pd.DataFrame:
    """검증용 가짜 봉. 성과 해석에 쓰면 안 된다 — 배관 점검 전용.

    자산마다 성격을 다르게 만들어(추세형/평균회귀형/고변동) 세 전략이 각각
    신호를 내는지 볼 수 있게 했다.
    """
    minutes = TF_MINUTES.get(timeframe, 60)
    n = max(300, int(months * 30 * 24 * 60 / minutes))
    n = min(n, 20000)

    rs = np.random.default_rng(abs(hash((symbol, seed))) % (2**32) if seed is None else seed)

    sym = str(symbol).upper()
    if sym.startswith("BTC"):
        base, vol, drift = 60000.0, 0.010, 0.00012      # 고변동 + 완만한 상승
    elif sym in ("GLD", "USO"):
        base, vol, drift = 200.0, 0.004, 0.00010        # 추세가 잘 나는 편
    else:
        base, vol, drift = 500.0, 0.003, 0.00002        # 지수 — 평균 근처를 오감

    # 랜덤워크 + 약한 평균회귀(지수) 또는 추세(원자재)
    steps = rs.normal(drift, vol, n)
    if sym in ("SPY", "QQQ"):
        # 평균으로 되돌리는 힘을 넣어 밴드 이탈이 실제로 생기게 한다
        x = np.zeros(n)
        for i in range(1, n):
            x[i] = x[i - 1] * 0.97 + steps[i]
        close = base * np.exp(np.cumsum(steps) * 0.3 + x)
    else:
        close = base * np.exp(np.cumsum(steps))

    close = pd.Series(close)
    spread = close * vol
    high = close + np.abs(rs.normal(0, 1, n)) * spread
    low = close - np.abs(rs.normal(0, 1, n)) * spread
    open_ = close.shift(1).fillna(close.iloc[0])
    volume = rs.lognormal(mean=10, sigma=0.6, size=n)

    end = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    idx = pd.date_range(end=end, periods=n, freq=f"{minutes}min", tz="UTC")

    return pd.DataFrame(
        {"open": open_.values, "high": high.values, "low": low.values,
         "close": close.values, "volume": volume},
        index=idx,
    )


def load_bars(symbol: str, timeframe: str, months: int = 6, synthetic: bool = False) -> tuple[pd.DataFrame, str]:
    """(데이터, 출처). 출처는 결과 파일에 그대로 적어 둔다."""
    if synthetic:
        return synthetic_bars(symbol, timeframe, months), "synthetic"
    return fetch_bars(symbol, timeframe, months), "alpaca"
