"""위험 관리 검산 — 손으로 답을 아는 문제만 넣었다.

계산기가 틀리면 1% 룰이 조용히 깨진다. 그게 가장 무섭다.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from risk import manager as rm


# ══ ① 거래당 1% ═══════════════════════════════════════════════════════════
def test_손절_폭이_수량을_정한다():
    """잔고 100,000 의 1% = 1,000. 손절까지 10 이면 100주."""
    qty = rm.position_size(100_000, entry_price=500, stop_price=490, per_trade_pct=1.0)
    assert qty == 100
    assert abs(500 - 490) * qty == 1_000, "실제 위험이 정확히 1% 여야 한다"


def test_손절이_좁으면_수량이_커지고_넓으면_작아진다():
    tight = rm.position_size(100_000, 500, 495, 1.0)     # 거리 5  → 200주
    wide = rm.position_size(100_000, 500, 480, 1.0)      # 거리 20 → 50주
    assert tight == 200 and wide == 50
    # 어느 쪽이든 잃는 돈은 같다
    assert abs(500 - 495) * tight == abs(500 - 480) * wide == 1_000


def test_변동성이_달라도_위험은_같다():
    """조용한 금과 요동치는 비트코인 — 잃을 수 있는 금액은 같아야 한다."""
    gold = rm.position_size(100_000, 200, rm.stop_from_atr(200, 1.0, 3.0, "long"), 1.0)
    btc = rm.position_size(100_000, 60_000, rm.stop_from_atr(60_000, 1_200, 2.0, "long"),
                           1.0, allow_fractional=True)
    gold_risk = abs(200 - rm.stop_from_atr(200, 1.0, 3.0, "long")) * gold
    btc_risk = abs(60_000 - rm.stop_from_atr(60_000, 1_200, 2.0, "long")) * btc
    assert gold_risk <= 1_000.5 and btc_risk <= 1_000.5
    assert btc < 1 < gold, "비트코인은 소수 수량, 금은 여러 주가 나와야 한다"


def test_손절_거리가_0이면_주문하지_않는다():
    """0 으로 나누면 수량이 무한대가 된다. 여기서 막는다."""
    assert rm.position_size(100_000, 500, 500, 1.0) == 0
    assert rm.position_size(100_000, 500, None, 1.0) == 0


def test_잔고보다_큰_주문은_나가지_않는다():
    """손절이 아주 좁으면 1% 룰을 지켜도 수량이 잔고를 넘을 수 있다."""
    qty = rm.position_size(10_000, entry_price=100, stop_price=99.99, per_trade_pct=1.0)
    assert qty * 100 <= 10_000 + 1e-6


def test_잔고가_0이거나_음수면_0():
    assert rm.position_size(0, 500, 490) == 0
    assert rm.position_size(-100, 500, 490) == 0


def test_주식은_정수_암호화폐는_소수():
    assert rm.position_size(100_000, 333, 320, 1.0) == 76         # 내림
    frac = rm.position_size(100_000, 60_000, 58_000, 1.0, allow_fractional=True)
    assert 0 < frac < 1


# ══ 손절가 ════════════════════════════════════════════════════════════════
def test_ATR_손절가():
    assert rm.stop_from_atr(100, 2, 3, "long") == 94
    assert rm.stop_from_atr(100, 2, 3, "short") == 106
    assert rm.stop_from_atr(1, 2, 3, "long") is None, "0 이하로 내려가면 손절가가 될 수 없다"
    assert rm.stop_from_atr(100, 0, 3, "long") is None


# ══ ③ 상관 필터 ═══════════════════════════════════════════════════════════
def test_SPY_QQQ가_둘_다_롱이면_BTC_신규롱을_막는다():
    assert rm.correlation_blocked("BTC/USD", "long", {"SPY": "long", "QQQ": "long"}) is True


def test_하나만_롱이면_막지_않는다():
    assert rm.correlation_blocked("BTC/USD", "long", {"SPY": "long"}) is False
    assert rm.correlation_blocked("BTC/USD", "long", {"SPY": "long", "QQQ": "short"}) is False


def test_BTC_숏이나_다른_종목은_막지_않는다():
    both = {"SPY": "long", "QQQ": "long"}
    assert rm.correlation_blocked("BTC/USD", "short", both) is False
    assert rm.correlation_blocked("GLD", "long", both) is False


# ══ ⑤ 낙폭 정지 ═══════════════════════════════════════════════════════════
def test_낙폭_계산():
    assert rm.drawdown_pct(90, 100) == pytest.approx(10.0)
    assert rm.drawdown_pct(110, 100) == 0.0, "고점보다 위면 낙폭 0"
    assert rm.drawdown_pct(100, 0) == 0.0


def test_10퍼센트_빠지면_정지된다():
    st = rm.BotState(peak_equity=100_000)
    st, just = rm.check_drawdown(st, 89_999, 10.0, "now")
    assert just is True
    assert st.status == rm.STATE_STOPPED
    assert rm.can_trade(st) is False


def test_9퍼센트에서는_정지되지_않는다():
    st = rm.BotState(peak_equity=100_000)
    st, just = rm.check_drawdown(st, 91_000, 10.0)
    assert just is False and st.status == rm.STATE_RUNNING


def test_고점은_계속_갱신된다():
    st = rm.BotState()
    for eq in (100, 120, 110, 150):
        st, _ = rm.check_drawdown(st, eq, 10.0)
    assert st.peak_equity == 150


def test_정지는_사람이_풀기_전까지_유지된다():
    st = rm.BotState(peak_equity=100_000, status=rm.STATE_STOPPED, stopped_reason="테스트")
    st, just = rm.check_drawdown(st, 100_000, 10.0)
    assert just is False
    assert st.status == rm.STATE_STOPPED, "잔고가 회복돼도 자동으로 풀리면 안 된다"
    st = rm.resume(st)
    assert st.status == rm.STATE_RUNNING


def test_재개해도_고점을_낮추지_않는다():
    """낮추면 같은 손실을 한 번 더 허용하게 된다."""
    st = rm.BotState(peak_equity=100_000, status=rm.STATE_STOPPED)
    st = rm.resume(st)
    assert st.peak_equity == 100_000


def test_상태가_파일로_남고_다시_읽힌다(tmp_path):
    """저장하지 않으면 껐다 켤 때마다 기준이 초기화돼 정지 장치가 무력해진다."""
    p = str(tmp_path / "state.json")
    st = rm.BotState(peak_equity=123_456.78, status=rm.STATE_STOPPED, stopped_reason="낙폭")
    rm.save_state(p, st)
    back = rm.load_state(p)
    assert back.peak_equity == pytest.approx(123_456.78)
    assert back.status == rm.STATE_STOPPED
    assert back.stopped_reason == "낙폭"


def test_상태파일이_깨져_있어도_죽지_않는다(tmp_path):
    p = tmp_path / "state.json"
    p.write_text("이건 JSON 이 아니다", encoding="utf-8")
    st = rm.load_state(str(p))
    assert st.status == rm.STATE_RUNNING and st.peak_equity == 0.0


# ══ 주문 직전 최종 관문 ═══════════════════════════════════════════════════
def _base(**kw):
    d = dict(
        state=rm.BotState(peak_equity=100_000),
        symbol="SPY", side="long", qty=10, entry_price=500, stop_price=490,
        equity=100_000, cash=100_000, market_open=True,
        open_positions={}, pending_symbols=set(),
    )
    d.update(kw)
    return d


def test_정상이면_통과한다():
    ok, why = rm.preflight(**_base())
    assert ok is True, why


@pytest.mark.parametrize("kw,frag", [
    ({"state": rm.BotState(status=rm.STATE_STOPPED, stopped_reason="낙폭")}, "정지"),
    ({"market_open": False}, "거래 시간"),
    ({"stop_price": None}, "손절가"),
    ({"stop_price": 500}, "손절 거리"),
    ({"qty": 0}, "수량"),
    ({"pending_symbols": {"SPY"}}, "이미 접수"),
    ({"open_positions": {"SPY": "long"}}, "이미 보유"),
    ({"cash": 100}, "현금 부족"),
])
def test_막아야_할_상황을_전부_막는다(kw, frag):
    ok, why = rm.preflight(**_base(**kw))
    assert ok is False, f"막았어야 하는데 통과했다: {kw}"
    assert frag in why, f"이유가 '{frag}' 를 담아야 하는데 '{why}'"


def test_상관필터도_최종관문에서_막힌다():
    ok, why = rm.preflight(**_base(symbol="BTC/USD", open_positions={"SPY": "long", "QQQ": "long"}))
    assert ok is False and "상관" in why
