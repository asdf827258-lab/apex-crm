"""실계좌 3중 잠금 — 이 파일이 통과하지 않으면 아무것도 하지 마세요.

세 가지가 동시에 있을 때만 실계좌가 열립니다.
  ① ALPACA_PAPER=false
  ② ALPACA_LIVE_CONFIRM=I_UNDERSTAND_REAL_MONEY
  ③ --live 플래그

하나라도 빠지면 실계좌로 가지 않고 모의로 내려가야 합니다.
"""

import itertools
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import broker as bk

PHRASE = bk.LIVE_CONFIRM_PHRASE

KEY_PAPER_FALSE = {"ALPACA_PAPER": "false"}
KEY_CONFIRM = {"ALPACA_LIVE_CONFIRM": PHRASE}


def env(*parts):
    out = {}
    for p in parts:
        out.update(p)
    return out


# ── 세 개가 다 있을 때만 열린다 ──────────────────────────────────────────
def test_세_열쇠가_모두_있으면_실계좌가_열린다():
    d = bk.decide_mode(env(KEY_PAPER_FALSE, KEY_CONFIRM), live_flag=True)
    assert d.paper is False, "세 조건이 모두 충족되면 실계좌여야 한다"
    assert d.demoted is False


@pytest.mark.parametrize(
    "missing",
    ["paper", "confirm", "flag"],
    ids=["ALPACA_PAPER 빠짐", "ALPACA_LIVE_CONFIRM 빠짐", "--live 빠짐"],
)
def test_하나라도_빠지면_모의로_내려간다(missing):
    e = env(KEY_PAPER_FALSE, KEY_CONFIRM)
    flag = True
    if missing == "paper":
        e.pop("ALPACA_PAPER")
    elif missing == "confirm":
        e.pop("ALPACA_LIVE_CONFIRM")
    else:
        flag = False

    d = bk.decide_mode(e, live_flag=flag)
    assert d.paper is True, f"{missing} 이 빠졌는데 실계좌로 갔다"
    assert d.demoted is True, "모의로 내려갔다는 표시가 있어야 한다"
    assert d.reasons, "왜 내려갔는지 이유가 있어야 한다"


def test_여덟_가지_조합_중_하나만_실계좌다():
    """세 조건의 모든 조합(2×2×2=8)을 돌려 딱 하나만 실계좌인지 본다."""
    live_count = 0
    for paper_false, confirm_ok, flag in itertools.product([True, False], repeat=3):
        e = {}
        if paper_false:
            e["ALPACA_PAPER"] = "false"
        if confirm_ok:
            e["ALPACA_LIVE_CONFIRM"] = PHRASE
        d = bk.decide_mode(e, live_flag=flag)
        if not d.paper:
            live_count += 1
            assert paper_false and confirm_ok and flag
    assert live_count == 1, f"실계좌로 열린 조합이 {live_count}개다 — 정확히 1개여야 한다"


# ── 흔한 실수들도 막는다 ─────────────────────────────────────────────────
@pytest.mark.parametrize("bad", [
    "i_understand_real_money",          # 소문자
    "I_UNDERSTAND_REAL_MONEY ",         # 뒤 공백 → strip 되므로 통과해야 함(아래서 별도 확인)
    "I UNDERSTAND REAL MONEY",          # 공백
    "I_UNDERSTAND_REALMONEY",           # 오타
    "yes",
])
def test_확인문구가_정확하지_않으면_안_열린다(bad):
    d = bk.decide_mode(env(KEY_PAPER_FALSE, {"ALPACA_LIVE_CONFIRM": bad}), live_flag=True)
    if bad.strip() == PHRASE:
        assert d.paper is False, "앞뒤 공백만 다른 것은 통과해야 한다"
    else:
        assert d.paper is True, f"'{bad}' 로 실계좌가 열렸다"


@pytest.mark.parametrize("v", ["true", "TRUE", "1", "yes", "", "아무말"])
def test_ALPACA_PAPER가_false가_아니면_모의다(v):
    d = bk.decide_mode(env({"ALPACA_PAPER": v}, KEY_CONFIRM), live_flag=True)
    assert d.paper is True, f"ALPACA_PAPER={v!r} 인데 실계좌로 갔다"


def test_환경변수가_아예_없으면_모의다():
    """가장 중요한 기본값 — 아무것도 설정하지 않은 사람이 실계좌로 가면 안 된다."""
    d = bk.decide_mode({}, live_flag=False)
    assert d.paper is True
    assert d.requested_live is False, "시도조차 안 했으므로 강등이 아니다"


def test_주소가_모의와_실계좌로_갈린다():
    assert bk.PAPER_HOST in bk.base_url(True)
    assert bk.LIVE_HOST in bk.base_url(False)
    assert bk.PAPER_HOST not in bk.base_url(False)


def test_키는_마스킹되어_값이_노출되지_않는다():
    secret = "PKABCDEFGHIJKLMNOPQRSTU"
    masked = bk.mask(secret)
    assert secret not in masked
    assert masked.startswith("PKAB")
    assert bk.mask("") == "(없음)"
    assert bk.mask(None) == "(없음)"


def test_실계좌_배너에_필요한_것이_다_나온다():
    import io
    buf = io.StringIO()
    bk.live_banner(12_345.67, 123.45, countdown=0, out=buf)
    s = buf.getvalue()
    assert "실계좌" in s and "진짜 돈" in s
    assert "12,345.67" in s, "현재 잔고가 나와야 한다"
    assert "123.45" in s, "한 번에 잃을 수 있는 최대 금액이 나와야 한다"
    assert bk.LIVE_HOST in s
