"""안전장치 오프라인 테스트 — 인터넷 없이도 돌아간다.

실행:  pytest -q

여기서 확인하는 것
  · 키가 절대 그대로 출력되지 않는다
  · paper=True 는 정말 모의계좌 주소로 간다 / paper=False 는 실계좌 주소다
  · 프록시·방화벽 오류를 '키가 틀렸다'로 잘못 안내하지 않는다
"""

import pytest

from check_account import (
    LIVE_HOST,
    PAPER_HOST,
    classify_error,
    is_active,
    mask,
    resolve_base_url,
)


# ── 키가 새지 않는가 ────────────────────────────────────────────────────
def test_mask_는_키_전체를_노출하지_않는다():
    secret = "PKABCDEFGHIJKLMNOPQR"
    out = mask(secret)
    assert secret not in out
    assert out.startswith("PKAB")
    assert "*" in out


def test_mask_는_빈값도_처리한다():
    assert mask("") == "(없음)"


# ── 모의계좌 / 실계좌 주소 ──────────────────────────────────────────────
def test_paper_True_는_모의계좌_주소로_간다():
    from alpaca.trading.client import TradingClient

    url = resolve_base_url(TradingClient("dummy", "dummy", paper=True))
    assert PAPER_HOST in url
    assert url == f"https://{PAPER_HOST}"


def test_paper_False_는_실계좌_주소다_그래서_쓰지_않는다():
    """실계좌 주소를 '식별'만 한다. 접속하지 않는다."""
    from alpaca.trading.client import TradingClient

    url = resolve_base_url(TradingClient("dummy", "dummy", paper=False))
    assert url == f"https://{LIVE_HOST}"
    assert PAPER_HOST not in url


def test_base_url_이_enum이어도_문자열_주소가_나온다():
    """str(Enum) 이면 'BaseURL.TRADING_PAPER' 가 나와 주소 검사가 통과해버린다."""
    from alpaca.trading.client import TradingClient

    client = TradingClient("dummy", "dummy", paper=True)
    assert str(client._base_url) != resolve_base_url(client)
    assert resolve_base_url(client).startswith("https://")


# ── 오류 분류 — 여기가 제일 헷갈리는 지점 ───────────────────────────────
def test_프록시_차단은_네트워크로_분류된다():
    """프록시 메시지에 403 이 섞여 있어도 '키 문제'로 오해하면 안 된다."""
    msg = (
        "HTTPSConnectionPool(host='paper-api.alpaca.markets', port=443): "
        "Max retries exceeded with url: /v2/account "
        "(Caused by ProxyError('Unable to connect to proxy', "
        "OSError('Tunnel connection failed: 403 Forbidden')))"
    )
    assert classify_error(msg) == "network"


@pytest.mark.parametrize(
    "msg",
    [
        "HTTPSConnectionPool(...): Max retries exceeded",
        "[Errno -2] Name or service not known",
        "Connection refused",
        "Read timed out",
    ],
)
def test_네트워크_오류들(msg):
    assert classify_error(msg) == "network"


@pytest.mark.parametrize(
    "msg",
    [
        '{"code":40110000,"message":"access key verification failed"}',
        "401 Client Error: Unauthorized for url: https://paper-api.alpaca.markets/v2/account",
        "403 Client Error: Forbidden",
    ],
)
def test_진짜_인증_실패는_auth_로_분류된다(msg):
    assert classify_error(msg) == "auth"


def test_모르는_오류는_unknown():
    assert classify_error("something else entirely") == "unknown"
    assert classify_error("") == "unknown"


# ── 계좌 상태 판정 — 여기서 한 번 크게 틀릴 뻔했다 ──────────────────────
def test_INACTIVE_를_ACTIVE_로_오인하지_않는다():
    """'INACTIVE' 안에 'ACTIVE' 가 들어 있다. 부분일치로 검사하면 정지된 계좌가 통과한다."""
    from alpaca.trading.enums import AccountStatus

    assert is_active(AccountStatus.ACTIVE) is True
    assert is_active(AccountStatus.INACTIVE) is False
    assert is_active("INACTIVE") is False
    assert is_active("AccountStatus.INACTIVE") is False


def test_ACTIVE_이외의_모든_상태는_거부된다():
    """alpaca 가 정의한 상태를 전부 돌려 ACTIVE 하나만 통과하는지 확인한다."""
    from alpaca.trading.enums import AccountStatus

    passed = [s.value for s in AccountStatus if is_active(s)]
    assert passed == ["ACTIVE"], f"ACTIVE 외에 통과한 상태가 있다: {passed}"


def test_enum이든_문자열이든_같게_판정한다():
    from alpaca.trading.enums import AccountStatus

    assert is_active(AccountStatus.ACTIVE) == is_active("ACTIVE")
    assert is_active("AccountStatus.ACTIVE") is True
    assert is_active("  active  ") is True
