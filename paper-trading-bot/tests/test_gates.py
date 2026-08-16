"""관문 판정이 실제로 막는가 — 하나는 막는 척만 하고 있었다.

`_concentration` 은 "한 자산에 쏠리지 않았는가" 를 본다. 그런데 수익이
쏠린 경우만 검사하고 있었다(`if tot > 0` 안에서만 비교). 손실이 한 종목에
몰리면 그대로 통과했다.

공개 시세로 24개월 백테스트를 돌렸을 때 실제로 이렇게 나왔다:

    합계 손익 -46,678  ·  BTC/USD 손익 -41,285   (손실의 88%)
    ✅ 한 자산에 쏠리지 않았는가   ← 초록불이었다

쏠림은 방향과 무관하게 같은 문제다. 그 종목 하나가 결과를 정했고 나머지는
검증된 게 아니다. 아래 검사들은 고치기 전에 두 개가 실패한다.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import _concentration


def res(total, per):
    return {"total": {"total_pnl": total},
            "per_symbol": {k: {"total_pnl": v} for k, v in per.items()}}


def test_손실이_한_종목에_몰리면_잡아낸다():
    """고치기 전에 실패하던 검사 — 실제로 나왔던 숫자 그대로."""
    out = _concentration(res(-46_678, {"SPY": -5_726, "QQQ": -422,
                                       "BTC/USD": -41_285, "GLD": -401, "USO": 1_157}))
    assert out is not None
    assert "BTC/USD" in out
    assert "88" in out          # 손실의 88%


def test_수익이_한_종목에_몰려도_잡아낸다():
    out = _concentration(res(10_000, {"SPY": 9_000, "QQQ": 600, "GLD": 400}))
    assert out is not None and "SPY" in out


def test_고르게_퍼져_있으면_통과한다():
    assert _concentration(res(10_000, {"SPY": 4_000, "QQQ": 3_500, "GLD": 2_500})) is None
    assert _concentration(res(-10_000, {"SPY": -4_000, "QQQ": -3_500, "GLD": -2_500})) is None


def test_경계값_정확히_80퍼센트는_통과():
    """'초과' 라고 썼으면 초과여야 한다. 딱 80%는 넘긴 게 아니다."""
    assert _concentration(res(10_000, {"A": 8_000, "B": 2_000})) is None
    assert _concentration(res(-10_000, {"A": -8_000, "B": -2_000})) is None


def test_손익이_0이면_판정하지_않는다():
    """0으로 나누면 안 되고, 0에 대한 비율은 뜻이 없다."""
    assert _concentration(res(0, {"A": 5_000, "B": -5_000})) is None


def test_데이터를_못_받은_종목은_건너뛴다():
    r = res(-10_000, {"A": -9_500, "B": -500})
    r["per_symbol"]["C"] = {"error": "데이터 없음", "total_pnl": -99_999}
    out = _concentration(r)
    assert out is not None and out.startswith("A")     # C 가 아니라 A 여야 한다
