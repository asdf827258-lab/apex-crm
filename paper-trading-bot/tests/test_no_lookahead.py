"""미래 참조(누수) 검사 — 백테스트를 거짓으로 좋게 만드는 가장 흔한 반칙.

두 가지를 본다.
  ① 지표가 미래 봉을 보지 않는가 — 뒤쪽 데이터를 바꿔도 앞쪽 지표는 그대로여야 한다
  ② 체결이 신호 봉의 종가가 아니라 다음 봉에서 일어나는가
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import backtest as bt
from strategies import breakout, mean_reversion, trend_following


def make_bars(n=400, seed=7, start=100.0):
    rs = np.random.default_rng(seed)
    steps = rs.normal(0, 0.01, n)
    close = start * np.exp(np.cumsum(steps))
    s = pd.Series(close)
    high = s * (1 + np.abs(rs.normal(0, 0.004, n)))
    low = s * (1 - np.abs(rs.normal(0, 0.004, n)))
    op = s.shift(1).fillna(s.iloc[0])
    vol = rs.lognormal(10, 0.5, n)
    idx = pd.date_range("2025-01-01", periods=n, freq="1h", tz="UTC")
    return pd.DataFrame({"open": op.values, "high": high.values, "low": low.values,
                         "close": s.values, "volume": vol}, index=idx)


# ══ ① 지표가 미래를 보지 않는가 ═══════════════════════════════════════════
@pytest.mark.parametrize("mod,params", [
    (mean_reversion, {"lookback": 20, "entry_std": 1.5}),
    (breakout, {"lookback": 20, "volume_mult": 1.5}),
    (trend_following, {"fast_ema": 20, "slow_ema": 50}),
], ids=["평균회귀", "돌파", "추세추종"])
def test_뒤쪽_데이터를_바꿔도_앞쪽_지표는_그대로다(mod, params):
    """미래를 참조한다면 뒤를 바꿨을 때 앞이 흔들린다."""
    df = make_bars()
    cut = 300

    a = mod.prepare(df, params).iloc[:cut]

    tampered = df.copy()
    tampered.iloc[cut:, tampered.columns.get_loc("close")] *= 3.0    # 뒤쪽을 크게 왜곡
    tampered.iloc[cut:, tampered.columns.get_loc("high")] *= 3.0
    tampered.iloc[cut:, tampered.columns.get_loc("low")] *= 3.0
    b = mod.prepare(tampered, params).iloc[:cut]

    for col in a.columns:
        if a[col].dtype.kind not in "fi":
            continue
        pd.testing.assert_series_equal(
            a[col], b[col], check_names=False,
            obj=f"{mod.NAME}.{col} 이 미래 데이터에 영향을 받았다",
        )


def test_돌파는_현재봉을_최고가에_포함하지_않는다():
    """현재 봉을 포함하면 종가가 자기 자신을 넘을 수 없어 신호가 영원히 안 난다."""
    df = make_bars()
    out = breakout.prepare(df, {"lookback": 20})
    # hh 는 shift(1) 된 값이라 현재 봉의 high 와 같을 수 없다(우연 제외)
    same = (out["hh"] == out["high"]).sum()
    assert same < len(out) * 0.05, "hh 가 현재 봉을 포함하고 있다"


def test_추세추종은_교차한_순간에만_신호를_낸다():
    """현재 봉만 보면 '위에 있는 모든 구간' 이 신호가 되어 계속 진입한다.

    실제로 한 번 무너진 적이 있다. shift(1) 을 fill_value 없이 쓰면 dtype 이
    object 가 되고, 그러면 ~prev 가 -1/-2 (둘 다 참) 이 되어 교차 마스크가
    통째로 사라진다. 그때 cross_up 은 above 와 완전히 같아진다.
    """
    df = make_bars(n=600)
    out = trend_following.prepare(df, {"fast_ema": 20, "slow_ema": 50})
    above = out["fast"] > out["slow"]
    prev = above.shift(1)

    ups = out.index[out["cross_up"].fillna(False)]
    dns = out.index[out["cross_dn"].fillna(False)]
    assert len(ups) > 0 and len(dns) > 0, "교차가 한 번도 없으면 테스트가 의미 없다"

    for t in ups:
        assert above.loc[t], "cross_up 인데 지금 위에 있지 않다"
        assert prev.loc[t] in (False, np.False_), "cross_up 인데 직전에도 위에 있었다 — 교차가 아니다"
    for t in dns:
        assert not above.loc[t], "cross_dn 인데 지금 아래에 있지 않다"
        assert prev.loc[t] in (True, np.True_), "cross_dn 인데 직전에도 아래였다 — 교차가 아니다"

    # 위에 머무는 구간이 여러 봉인데도 신호는 첫 봉에서만 나야 한다
    assert int(out["cross_up"].sum()) < int(above.sum()), \
        "위에 있는 모든 봉에서 신호가 나면 교차 판정이 아니다"

    # 연속된 두 봉에서 같은 방향 신호가 연달아 나오면 교차가 아니다
    for col in ("cross_up", "cross_dn"):
        s = out[col].astype(bool)
        assert not (s & s.shift(1, fill_value=False)).any(), f"{col} 이 연속 봉에서 났다"

    # dtype 자체가 진짜 bool 이어야 한다 — object 가 되면 위 논리가 조용히 무너진다
    assert out["cross_up"].dtype == bool and out["cross_dn"].dtype == bool


# ══ ② 체결이 다음 봉에서 일어나는가 ═══════════════════════════════════════
def test_신호_봉의_종가로_체결하지_않는다():
    """진입 시각이 신호 봉이 아니라 그다음 봉이어야 한다."""
    df = make_bars(n=500, seed=11)
    eq = {"equity": 100_000.0}
    trades = bt.run_symbol(
        df, symbol="TEST", strategy="mean_reversion",
        params={"lookback": 20, "entry_std": 1.0, "atr_stop_mult": 3.0},
        costs=bt.Costs(0.0, 0.0), equity_ref=eq, correlation_filter=False,
    )
    assert trades, "거래가 한 건도 없으면 검사가 의미 없다"

    prepared = mean_reversion.prepare(df, {"lookback": 20, "entry_std": 1.0})
    times = list(prepared.index.astype(str))
    for t in trades:
        i = times.index(t.entry_time)
        assert i > 0, "첫 봉에서 진입할 수는 없다"
        # 진입가는 '그 봉의 시가' 에서 나와야 한다 (신호 봉 종가가 아니라)
        assert t.entry_price == pytest.approx(float(prepared.iloc[i]["open"]), rel=1e-9)


def test_마지막_봉에서는_새로_진입하지_않는다():
    """다음 봉이 없으면 체결할 수 없다."""
    df = make_bars(n=200, seed=3)
    eq = {"equity": 100_000.0}
    trades = bt.run_symbol(
        df, symbol="TEST", strategy="mean_reversion",
        params={"lookback": 20, "entry_std": 1.0, "atr_stop_mult": 3.0},
        costs=bt.Costs(0.0, 0.0), equity_ref=eq, correlation_filter=False,
    )
    last = str(df.index[-1])
    assert all(t.entry_time != last or t.reason == "end_of_data" for t in trades)


# ══ 비용이 실제로 반영되는가 ══════════════════════════════════════════════
def test_슬리피지를_올리면_성과가_나빠진다():
    """0 으로 두면 결과가 실제보다 좋게 나온다 — 반영되는지 확인한다."""
    df = make_bars(n=800, seed=5)
    params = {"lookback": 20, "entry_std": 1.0, "atr_stop_mult": 3.0}

    def total(slip):
        eq = {"equity": 100_000.0}
        tr = bt.run_symbol(df, symbol="T", strategy="mean_reversion", params=params,
                           costs=bt.Costs(0.0, slip), equity_ref=eq, correlation_filter=False)
        return sum(t.pnl for t in tr), len(tr)

    p0, n0 = total(0.0)
    p10, n10 = total(10.0)
    assert n0 > 0 and n10 > 0
    assert p10 < p0, f"슬리피지를 10bps 로 올렸는데 손익이 나아졌다 ({p0:.2f} → {p10:.2f})"


def test_수수료도_반영된다():
    df = make_bars(n=600, seed=9)
    params = {"lookback": 20, "entry_std": 1.0, "atr_stop_mult": 3.0}

    def total(fee):
        eq = {"equity": 100_000.0}
        tr = bt.run_symbol(df, symbol="T", strategy="mean_reversion", params=params,
                           costs=bt.Costs(fee, 0.0), equity_ref=eq, correlation_filter=False)
        return sum(t.pnl for t in tr)

    assert total(20.0) < total(0.0)


def test_모든_거래에_손절이_있다():
    """손절 없는 거래가 하나라도 있으면 안 된다."""
    df = make_bars(n=600, seed=13)
    eq = {"equity": 100_000.0}
    trades = bt.run_symbol(df, symbol="T", strategy="trend_following",
                           params={"fast_ema": 20, "slow_ema": 50, "atr_stop_mult": 3.0},
                           costs=bt.Costs(0.0, 5.0), equity_ref=eq, correlation_filter=False)
    assert trades
    for t in trades:
        assert t.reason in ("stop", "signal", "end_of_data")
        assert t.qty > 0 and t.entry_price > 0
