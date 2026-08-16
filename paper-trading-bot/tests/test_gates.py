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

from main import _concentration, _span_mismatch


def res(total, per):
    return {"total": {"total_pnl": total},
            "per_symbol": {k: {"total_pnl": v} for k, v in per.items()}}


def spans(**kw):
    return {"spans": {k: {"days": v, "bars": v * 10, "src": "public"} for k, v in kw.items()}}


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


def test_합계보다_크게_잃은_종목은_비율_대신_풀어서_적는다():
    """다른 종목이 반대로 벌면 비율이 100%를 넘는다 — '손실의 118%' 는
    맞는 말이지만 오타처럼 읽힌다. BTC 를 뺐을 때 실제로 나온 상황."""
    out = _concentration(res(-7_711, {"SPY": -9_110, "QQQ": -620,
                                      "GLD": -640, "USO": 2_659}))
    assert out is not None and out.startswith("SPY")
    assert "%" not in out
    assert "-9,110" in out and "-7,711" in out


def test_손익이_0이면_판정하지_않는다():
    """0으로 나누면 안 되고, 0에 대한 비율은 뜻이 없다."""
    assert _concentration(res(0, {"A": 5_000, "B": -5_000})) is None


def test_데이터를_못_받은_종목은_건너뛴다():
    r = res(-10_000, {"A": -9_500, "B": -500})
    r["per_symbol"]["C"] = {"error": "데이터 없음", "total_pnl": -99_999}
    out = _concentration(r)
    assert out is not None and out.startswith("A")     # C 가 아니라 A 여야 한다


# ── 자산별 기간이 비슷한가 ────────────────────────────────────────────────
# '24개월' 이라고 찍고 돌렸는데 SPY 는 86일, BTC 는 729일이었다. 다섯을
# 한 잔고 곡선에 태워 놓고 합계를 뽑았으니 기간이 다른 것끼리 더한 셈이다.

def test_기간이_크게_다르면_잡아낸다():
    """실제로 나왔던 조합 그대로 — 공개 소스는 15분봉을 60일까지만 준다."""
    out = _span_mismatch(spans(SPY=86, QQQ=86, **{"BTC/USD": 729}, GLD=1061, USO=1061))
    assert out is not None
    assert "SPY" in out and "86" in out and "1061" in out


def test_기간이_비슷하면_통과한다():
    assert _span_mismatch(spans(SPY=700, QQQ=729, GLD=1061)) is None


def test_경계값_정확히_절반은_통과():
    """'절반 미만' 이면 막는다. 딱 절반은 아직 아니다."""
    assert _span_mismatch(spans(A=500, B=1000)) is None
    assert _span_mismatch(spans(A=499, B=1000)) is not None


def test_자산이_하나면_비교할_게_없다():
    assert _span_mismatch(spans(SPY=86)) is None
    assert _span_mismatch({}) is None


def test_기간을_못_읽은_자산은_빼고_본다():
    """데이터를 못 받은 자산은 spans 에 없다 — 0일로 오해하면 안 된다."""
    r = spans(SPY=700, QQQ=729)
    r["spans"]["USO"] = {"days": 0, "bars": 0, "src": "실패"}
    assert _span_mismatch(r) is None
