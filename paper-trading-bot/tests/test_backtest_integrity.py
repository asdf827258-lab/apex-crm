"""백테스트가 스스로를 속이지 않는가 — 실제로 세 번 속고 있었다.

이 파일의 모든 검사는 '고치기 전에는 실패했던' 것들이다. 단위 테스트가
초록불이어도 기능이 통째로 죽어 있을 수 있다는 걸 여기서 배웠다.

  ① 상관 필터가 호출만 되고 한 번도 막지 못했다 (3433번 호출 · 0번 차단)
     — 종목을 하나씩 끝까지 돌려서, BTC 차례에는 SPY 를 이미 다 팔고 난 뒤였다
  ② 트레일링 스톱을 이번 봉 고가로 올린 뒤 이번 봉 저가로 손절 판정했다
     — 봉 안쪽 순서를 나에게 유리하게 가정한 것
  ③ 진입 수수료가 거래 손익(pnl)에 빠져 있었다 — trades.csv 가 비용을 축소했다
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import backtest as bt
import data as dm
from strategies import mean_reversion

ASSETS = [
    {"symbol": "SPY", "strategy": "mean_reversion", "timeframe": "15Min",
     "params": {"lookback": 20, "entry_std": 1.5}},
    {"symbol": "QQQ", "strategy": "mean_reversion", "timeframe": "15Min",
     "params": {"lookback": 20, "entry_std": 1.8}},
    {"symbol": "BTC/USD", "strategy": "breakout", "timeframe": "1Hour",
     "params": {"lookback": 20, "volume_mult": 1.5, "atr_stop_mult": 2.0}},
]


def synth(assets):
    return {a["symbol"]: dm.load_bars(a["symbol"], a["timeframe"], 6, synthetic=True)[0]
            for a in assets}


# ══ ① 상관 필터가 진짜로 막는가 ═══════════════════════════════════════════
class _Scripted:
    """정해진 봉에서 정해진 신호를 내는 전략. 상황을 손으로 만들기 위한 것.

    무작위 데이터에 기대면 SPY·QQQ·BTC 가 겹치는 순간이 우연히 생기기를
    기다려야 한다. 실제로 자산 5개일 땐 3번 막고 3개일 땐 0번 막았다 —
    그런 건 검사가 아니라 운이다.
    """
    NAME = "scripted"
    DEFAULTS = {"atr_stop_mult": 3.0}

    @staticmethod
    def prepare(df, params=None):
        out = df.copy()
        out["sig"] = list((params or {}).get("script", ["hold"] * len(out)))
        return out

    @staticmethod
    def signal(row, position):
        s = str(row["sig"])
        if position and s in ("long", "short"):
            return "hold"          # 이미 들고 있으면 재진입 신호는 무시
        return s


bt.STRATS.setdefault("scripted", _Scripted)


def _flat_bars(n=60, price=100.0):
    """가격이 거의 움직이지 않는 봉 — 손절이 끼어들지 않게 한다."""
    idx = pd.date_range("2025-06-01", periods=n, freq="1h", tz="UTC")
    return pd.DataFrame({
        "open": [price] * n, "high": [price * 1.001] * n,
        "low": [price * 0.999] * n, "close": [price] * n,
        "volume": [1000.0] * n, "atr": [price * 0.01] * n,
    }, index=idx)


def _corr_scenario():
    """SPY·QQQ 가 먼저 롱으로 들어가 계속 들고 있고, 그 뒤 BTC 가 롱을 시도한다."""
    n = 60                       # run() 은 봉이 50개 미만이면 '데이터 부족' 으로 건너뛴다
    hold = ["hold"] * n

    def script(at, sig="long"):
        s = list(hold)
        s[at] = sig
        return s

    assets = [
        {"symbol": "SPY", "strategy": "scripted", "params": {"script": script(0)}},
        {"symbol": "QQQ", "strategy": "scripted", "params": {"script": script(0)}},
        {"symbol": "BTC/USD", "strategy": "scripted", "params": {"script": script(4)}},
    ]
    bars = {a["symbol"]: _flat_bars(n) for a in assets}
    bars["BTC/USD"] = _flat_bars(n, price=60_000.0)
    return bars, assets


def test_상관필터가_실제로_BTC_진입을_막는다(tmp_path):
    """호출 횟수가 아니라 '차단 횟수' 를 본다. 이걸 안 봐서 3433번 호출·0번 차단을 놓쳤다."""
    bars, assets = _corr_scenario()
    res = bt.run(bars, assets, costs=bt.Costs(0.0, 0.0), outdir=str(tmp_path),
                 correlation_filter=True)
    assert res["per_symbol"]["BTC/USD"]["blocked_by_correlation"] >= 1, \
        "SPY·QQQ 를 둘 다 들고 있는데 BTC 롱이 통과했다"
    assert res["per_symbol"]["BTC/USD"]["trades"] == 0, "막혔는데 거래가 생겼다"


def test_필터를_끄면_같은_상황에서_BTC가_들어간다(tmp_path):
    """막힌 게 필터 때문인지, 그냥 신호가 없어서인지 구분한다."""
    bars, assets = _corr_scenario()
    off = bt.run(bars, assets, costs=bt.Costs(0.0, 0.0), outdir=str(tmp_path),
                 correlation_filter=False)
    assert off["per_symbol"]["BTC/USD"]["trades"] >= 1, \
        "필터를 껐는데도 BTC 가 안 들어갔다 — 시나리오가 잘못됐다"
    assert off["per_symbol"]["BTC/USD"]["blocked_by_correlation"] == 0


def test_SPY_하나만_들고_있으면_BTC를_막지_않는다(tmp_path):
    bars, assets = _corr_scenario()
    n = len(bars["QQQ"])
    assets[1]["params"] = {"script": ["hold"] * n}       # QQQ 는 진입하지 않음
    res = bt.run(bars, assets, costs=bt.Costs(0.0, 0.0), outdir=str(tmp_path),
                 correlation_filter=True)
    assert res["per_symbol"]["BTC/USD"]["blocked_by_correlation"] == 0, \
        "SPY 하나만 롱인데 막았다 — 필터가 너무 세다"
    assert res["per_symbol"]["BTC/USD"]["trades"] >= 1


def test_여러_종목이_시간_순으로_섞여_돈다(tmp_path):
    """종목별로 끝까지 돌리면 포지션이 시간상 겹치지 않아 필터가 죽는다."""
    res = bt.run(synth(ASSETS), ASSETS, costs=bt.Costs(0.0, 5.0), outdir=str(tmp_path))
    tr = []
    for sym in ("SPY", "BTC/USD"):
        assert not res["per_symbol"][sym].get("error")
    # trades.csv 는 청산 시각 순으로 정렬돼 나온다 — 종목이 번갈아 나와야 정상이다
    rows = list(csv_rows(Path(tmp_path) / "trades.csv"))
    syms = [r["symbol"] for r in rows]
    assert len(set(syms)) > 1, "한 종목만 거래됐다면 이 검사는 의미가 없다"
    switches = sum(1 for a, b in zip(syms, syms[1:]) if a != b)
    assert switches > 5, f"종목이 {switches}번밖에 안 바뀌었다 — 시간축이 섞이지 않았다"


def csv_rows(path):
    import csv
    with open(path, encoding="utf-8") as f:
        yield from csv.DictReader(f)


# ══ ② 봉 안쪽 미래 참조 ═══════════════════════════════════════════════════
class _Silent:
    """아무 신호도 내지 않는 전략. 스톱 로직만 따로 떼어 보기 위한 것.

    진짜 전략을 쓰면 청산 신호가 끼어들어 무엇 때문에 포지션이 닫혔는지
    구분할 수 없다.
    """
    NAME = "silent"
    DEFAULTS = {"atr_stop_mult": 3.0}

    @staticmethod
    def prepare(df, params=None):
        return df.copy()

    @staticmethod
    def signal(row, position):
        return "hold"


bt.STRATS.setdefault("silent", _Silent)


def _runner_with_pos(bars, *, stop, side="long", atr_mult=3.0):
    df = pd.DataFrame(bars, index=pd.date_range("2025-01-01", periods=len(bars["close"]),
                                                freq="1h", tz="UTC"))
    eq = {"equity": 100_000.0}
    r = bt.SymbolRunner(df, symbol="T", strategy="silent", params={"atr_stop_mult": atr_mult},
                        costs=bt.Costs(0.0, 0.0), equity_ref=eq, correlation_filter=False)
    r.pos = bt.OpenPos(side=side, qty=10, entry_price=100.0, entry_time="t0",
                       stop=stop, atr_mult=atr_mult, peak=100.0)
    r.open_positions["T"] = side
    return r


def test_이번_봉_고가로_스톱을_올린_뒤_이번_봉_저가로_판정하지_않는다():
    """봉 안에서 고가와 저가 중 뭐가 먼저였는지는 알 수 없다.

    고가로 스톱을 먼저 올려놓고 같은 봉 저가로 판정하면, 실제보다 높은 가격에
    빠져나온 것으로 기록된다 — 나에게 유리한 쪽으로 속이는 것이다.
    """
    # 들고 들어온 스톱 = 90. 이번 봉은 고가 130(스톱을 크게 올릴 만함) · 저가 95.
    # 저가 95 는 원래 스톱 90 위 → 손절되면 안 된다.
    bars = {
        "open": [100.0, 100.0, 100.0],
        "high": [101.0, 130.0, 131.0],
        "low": [99.0, 95.0, 96.0],
        "close": [100.0, 120.0, 121.0],
        "volume": [1000.0, 1000.0, 1000.0],
        "atr": [5.0, 5.0, 5.0],
    }
    r = _runner_with_pos(bars, stop=90.0)
    r.step(1)

    stops = [t for t in r.trades if t.reason == "stop"]
    assert not stops, (
        "저가 95 가 스톱 90 을 건드리지 않았는데 손절됐다 — "
        "이번 봉 고가로 스톱을 먼저 올렸다는 뜻이다"
    )
    # 판정이 끝난 뒤에는 스톱이 올라가 있어야 한다 (다음 봉부터 적용)
    assert r.pos is not None and r.pos.stop > 90.0, "판정 후에는 트레일링이 올라가야 한다"


def test_들고_들어온_스톱을_건드리면_손절된다():
    """반대 방향 확인 — 너무 조여서 손절이 아예 안 나면 그것도 고장이다."""
    bars = {
        "open": [100.0, 100.0, 100.0],
        "high": [101.0, 102.0, 103.0],
        "low": [99.0, 88.0, 96.0],           # 저가 88 < 스톱 90 → 손절돼야 한다
        "close": [100.0, 95.0, 96.0],
        "volume": [1000.0, 1000.0, 1000.0],
        "atr": [5.0, 5.0, 5.0],
    }
    r = _runner_with_pos(bars, stop=90.0)
    r.step(1)
    assert r.pos is None, "스톱을 건드렸는데 손절되지 않았다"
    assert r.trades[-1].reason == "stop"
    assert r.trades[-1].exit_price == pytest.approx(90.0), "손절은 스톱 가격으로 나가야 한다"


def test_트레일링_스톱은_뒤로_물러나지_않는다():
    bars = {
        "open": [100.0] * 4, "high": [101.0, 130.0, 105.0, 104.0],
        "low": [99.0, 95.0, 96.0, 97.0], "close": [100.0, 120.0, 100.0, 99.0],
        "volume": [1000.0] * 4, "atr": [5.0] * 4,
    }
    r = _runner_with_pos(bars, stop=90.0)
    r.step(1)
    high_water = r.pos.stop
    r.step(2)
    assert r.pos is None or r.pos.stop >= high_water, "스톱이 내려갔다"


# ══ ③ 진입 수수료가 손익에 들어가는가 ═════════════════════════════════════
def test_거래마다_왕복_수수료가_손익에_들어간다():
    """거래 한 건씩 손으로 계산해 맞춰본다.

    두 번의 실행을 비교하는 방식으로는 잡히지 않는다 — 수수료가 잔고를 바꾸고,
    잔고가 수량을 바꾸기 때문에 두 실행은 애초에 같은 거래가 아니다.
    """
    fee_bps = 12.0
    df = make_bars(n=400, seed=21)
    eq = {"equity": 100_000.0}
    trades = bt.run_symbol(df, symbol="T", strategy="mean_reversion",
                           params={"lookback": 20, "entry_std": 1.0, "atr_stop_mult": 3.0},
                           costs=bt.Costs(fee_bps, 0.0), equity_ref=eq,
                           correlation_filter=False)
    assert trades, "거래가 없으면 검사가 의미 없다"

    for t in trades:
        gross = (t.exit_price - t.entry_price) * t.qty
        if t.side == "short":
            gross = -gross
        roundtrip = (t.entry_price * t.qty + t.exit_price * t.qty) * (fee_bps / 10_000.0)
        assert t.pnl == pytest.approx(gross - roundtrip, abs=1e-4), (
            f"{t.symbol} {t.entry_time} 손익에 왕복 수수료가 다 들어가지 않았다 "
            f"(기록 {t.pnl:.4f} / 기대 {gross - roundtrip:.4f})"
        )


def test_잔고_변화가_손익_합계와_정확히_같다():
    """같은 수수료를 두 번 물거나 한 번도 안 물면 여기서 어긋난다."""
    df = make_bars(n=400, seed=22)
    eq = {"equity": 100_000.0}
    tr = bt.run_symbol(df, symbol="T", strategy="mean_reversion",
                       params={"lookback": 20, "entry_std": 1.0, "atr_stop_mult": 3.0},
                       costs=bt.Costs(15.0, 5.0), equity_ref=eq, correlation_filter=False)
    assert tr
    assert eq["equity"] - 100_000.0 == pytest.approx(sum(t.pnl for t in tr), abs=1e-6), \
        "잔고 변화와 거래 손익 합계가 다르다 — 수수료를 두 번 물었거나 빠뜨렸다"


def make_bars(n=400, seed=7, start=100.0):
    rs = np.random.default_rng(seed)
    close = start * np.exp(np.cumsum(rs.normal(0, 0.01, n)))
    s = pd.Series(close)
    return pd.DataFrame({
        "open": s.shift(1).fillna(s.iloc[0]).values,
        "high": (s * (1 + np.abs(rs.normal(0, 0.004, n)))).values,
        "low": (s * (1 - np.abs(rs.normal(0, 0.004, n)))).values,
        "close": s.values,
        "volume": rs.lognormal(10, 0.5, n),
    }, index=pd.date_range("2025-01-01", periods=n, freq="1h", tz="UTC"))
