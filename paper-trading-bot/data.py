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


# ── 키 없이 받는 공개 시세 ──────────────────────────────────────────────
# Alpaca 키가 없어서 백테스트를 계속 합성 데이터로만 돌리고 있었다. 합성
# 데이터로는 전략이 통하는지 알 수가 없다 — 순수 랜덤워크에서는 평균회귀가
# 비용만큼 잃는 게 정상이라, 좋게 나와도 나쁘게 나와도 판단 근거가 안 된다.
#
# 그래서 키 없이 받을 수 있는 공개 시세를 하나 더 뒀다. 진짜 시장 데이터라
# 관문 판정에 쓸 수 있다. 다만 두 가지를 알고 써야 한다:
#   · 비공식 경로다. 예고 없이 막히거나 모양이 바뀔 수 있다.
#     Alpaca 키가 생기면 그쪽이 1순위다.
#   · 봉 종류마다 받을 수 있는 기간이 다르다(아래 표). 15분봉은 60일까지라
#     6개월치를 달라고 해도 60일밖에 안 온다. 그럴 때는 조용히 줄이지 않고
#     실제로 몇 일치를 받았는지 출처 문자열에 적어 돌려준다.

_PUB_HOST = "https://query1.finance.yahoo.com/v8/finance/chart/"

# 우리 표기 → 공개 소스 표기
_PUB_SYMBOL = {"BTC/USD": "BTC-USD", "ETH/USD": "ETH-USD"}

# 봉 → (공개 소스 interval, 받을 수 있는 최대 기간(일), 묶어야 하는 배수)
_PUB_TF = {
    "1Min": ("1m", 7, 1),
    "5Min": ("5m", 60, 1),
    "15Min": ("15m", 60, 1),
    "30Min": ("30m", 60, 1),
    "1Hour": ("1h", 730, 1),
    "4Hour": ("1h", 730, 4),    # 4시간봉은 안 준다. 1시간봉을 넷씩 묶는다.
    "1Day": ("1d", 3650, 1),
}


def _pub_resample(df: pd.DataFrame, mult: int) -> pd.DataFrame:
    """1시간봉 넷을 4시간봉 하나로 묶는다. 고가는 최대, 저가는 최소."""
    if mult <= 1:
        return df
    rule = f"{mult}h"
    out = df.resample(rule, label="left", closed="left").agg(
        {"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"}
    )
    return out.dropna(subset=["close"])


def fetch_bars_public(symbol: str, timeframe: str, months: int = 6) -> tuple[pd.DataFrame, str]:
    """키 없이 공개 경로에서 과거 봉을 받는다. (데이터, 출처설명) 을 돌려준다."""
    import json
    import urllib.request

    if timeframe not in _PUB_TF:
        raise RuntimeError(f"{timeframe} 봉은 공개 소스에서 받을 수 없습니다.")
    interval, max_days, mult = _PUB_TF[timeframe]

    want_days = int(months * 31)
    days = min(want_days, max_days)
    ticker = _PUB_SYMBOL.get(symbol, symbol.replace("/", "-"))

    url = f"{_PUB_HOST}{ticker}?range={days}d&interval={interval}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        j = json.loads(r.read().decode())

    res = (j.get("chart") or {}).get("result") or []
    if not res:
        err = ((j.get("chart") or {}).get("error") or {}).get("description", "")
        raise RuntimeError(f"{symbol} 공개 시세를 받지 못했습니다. {err}"[:160])

    r0 = res[0]
    ts = r0.get("timestamp") or []
    q = ((r0.get("indicators") or {}).get("quote") or [{}])[0]
    if not ts:
        raise RuntimeError(f"{symbol} 공개 시세가 비어 있습니다 (기간 {days}일 · {interval})")

    df = pd.DataFrame({
        "open": q.get("open"), "high": q.get("high"),
        "low": q.get("low"), "close": q.get("close"), "volume": q.get("volume"),
    }, index=pd.to_datetime(ts, unit="s", utc=True))

    # 장 마감·휴장 구간은 값이 비어서 온다. 채우지 않고 버린다 —
    # 앞 값으로 채우면 없던 봉이 생겨 신호가 가짜로 늘어난다.
    df = df.dropna(subset=["close"]).sort_index()
    df["volume"] = df["volume"].fillna(0)
    df = _pub_resample(df, mult)

    if len(df) < 30:
        raise RuntimeError(f"{symbol} 봉이 {len(df)}개뿐이라 백테스트에 쓸 수 없습니다.")

    got_days = (df.index[-1] - df.index[0]).days
    note = f"public:{interval}"
    if mult > 1:
        note += f"x{mult}"
    note += f" {got_days}일 {len(df)}봉"
    if days < want_days:
        note += f" (요청 {want_days}일 → 이 봉은 {max_days}일까지만 받을 수 있습니다)"
    return df, note


def load_bars(symbol: str, timeframe: str, months: int = 6,
              synthetic: bool = False, public: bool = False) -> tuple[pd.DataFrame, str]:
    """(데이터, 출처). 출처는 결과 파일에 그대로 적어 둔다."""
    if synthetic:
        return synthetic_bars(symbol, timeframe, months), "synthetic"
    if public:
        return fetch_bars_public(symbol, timeframe, months)
    return fetch_bars(symbol, timeframe, months), "alpaca"
