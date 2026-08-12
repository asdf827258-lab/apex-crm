"""Alpaca 모의계좌(Paper) 연결에 필요한 공통 로직.

check_account.py(실제 연결)와 selftest.py(오프라인 검증)가 이 모듈을 함께 쓴다.
두 경로가 같은 코드를 타야 셀프테스트가 의미를 가진다.

이 모듈은 조회만 한다. 주문을 내는 함수는 존재하지 않는다.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlparse

from dotenv import load_dotenv

# 모의계좌 주소. 실계좌 주소는 이 프로젝트 어디에서도 쓰지 않는다.
PAPER_HOST = "paper-api.alpaca.markets"
PAPER_BASE_URL = f"https://{PAPER_HOST}"

# 실수로라도 실계좌에 붙는 것을 막기 위한 금지 목록.
LIVE_HOSTS = {"api.alpaca.markets", "broker-api.alpaca.markets"}

# 셀프테스트용 로컬 목(mock) 서버만 허용한다. 그 외 주소 교체는 전부 거부한다.
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}


class ConfigError(Exception):
    """키 누락이나 잘못된 접속 주소처럼, 네트워크를 타기 전에 걸러지는 문제."""


@dataclass(frozen=True)
class Credentials:
    api_key: str
    secret_key: str

    def masked(self) -> str:
        """키가 제대로 읽혔는지만 보여준다. 값 자체는 절대 노출하지 않는다."""
        head = self.api_key[:4]
        return f"{head}{'*' * 8} (길이 {len(self.api_key)})"


def load_credentials(env_file: str | None = None) -> Credentials:
    """.env(또는 환경변수)에서 모의계좌 키를 읽는다."""
    load_dotenv(env_file) if env_file else load_dotenv()

    api_key = os.getenv("ALPACA_API_KEY", "").strip()
    secret_key = os.getenv("ALPACA_SECRET_KEY", "").strip()

    missing = [
        name
        for name, value in (
            ("ALPACA_API_KEY", api_key),
            ("ALPACA_SECRET_KEY", secret_key),
        )
        if not value
    ]
    if missing:
        raise ConfigError(
            ".env에서 다음 값을 찾지 못했다: "
            + ", ".join(missing)
            + "\n       .env.example을 .env로 복사한 뒤 모의계좌 키를 채워 넣어라: cp .env.example .env"
        )

    # 키를 복사할 때 따옴표가 딸려오는 실수가 잦다. 조용히 401로 이어지므로 먼저 잡는다.
    for name, value in (("ALPACA_API_KEY", api_key), ("ALPACA_SECRET_KEY", secret_key)):
        if value[0] in "\"'" or value[-1] in "\"'":
            raise ConfigError(
                f"{name} 값에 따옴표가 섞여 있다. .env에서는 따옴표 없이 값만 적는다."
            )

    return Credentials(api_key=api_key, secret_key=secret_key)


def resolve_base_url(url_override: str | None) -> str | None:
    """접속 주소를 정한다. None이면 SDK 기본값(모의계좌)을 그대로 쓴다.

    셀프테스트용 로컬 주소만 허용하고, 실계좌 주소는 어떤 경우에도 거부한다.
    """
    if not url_override:
        return None

    host = (urlparse(url_override).hostname or "").lower()

    if host in LIVE_HOSTS:
        raise ConfigError(
            f"실계좌 주소({host})로는 접속하지 않는다. 이 프로젝트는 모의계좌 전용이다."
        )
    if host not in LOCAL_HOSTS:
        raise ConfigError(
            f"허용되지 않은 접속 주소다: {host or url_override}\n"
            "       주소 교체는 셀프테스트(로컬 목 서버)에서만 쓸 수 있다."
        )
    return url_override


def build_client(creds: Credentials, url_override: str | None = None):
    """모의계좌 전용 TradingClient를 만든다.

    paper=True 가 모의계좌 주소로 보내주는 스위치다. 이 값은 고정이며 바뀌지 않는다.
    """
    from alpaca.trading.client import TradingClient

    return TradingClient(
        creds.api_key,
        creds.secret_key,
        paper=True,
        url_override=resolve_base_url(url_override),
    )


def describe_error(exc: BaseException) -> str:
    """예외를 초보자가 바로 조치할 수 있는 문장으로 바꾼다."""
    text = str(exc)
    lowered = text.lower()

    # 프록시/방화벽이 터널 자체를 막은 경우. 키 문제로 오해하기 쉬워 먼저 구분한다.
    if "tunnel connection failed" in lowered or "unable to connect to proxy" in lowered:
        return (
            "네트워크가 paper-api.alpaca.markets 로 나가지 못한다 (프록시·방화벽 차단).\n"
            "       키 문제가 아니다. 사내망/VPN이라면 해당 도메인 허용이 필요하고,\n"
            "       개인 맥에서는 보통 그냥 뚫리니 로컬에서 다시 실행해봐라."
        )
    if "401" in text or "unauthorized" in lowered:
        return (
            "키가 거부됐다(401). 실계좌용 키를 발급받았을 가능성이 가장 높다.\n"
            "       Alpaca 대시보드를 Paper Trading 모드로 바꾼 뒤 키를 새로 발급해라."
        )
    if "403" in text or "forbidden" in lowered:
        return (
            "접근이 거부됐다(403). 키 권한이 부족하거나 네트워크 정책이 막고 있다.\n"
            "       모의계좌 모드에서 발급한 키가 맞는지 먼저 확인해라."
        )
    if "nodename nor servname" in lowered or "name or service not known" in lowered:
        return "도메인 이름을 찾지 못했다(DNS). 인터넷 연결 상태를 확인해라."
    if "timed out" in lowered or "timeout" in lowered:
        return "응답이 없어 시간 초과됐다. 잠시 후 다시 시도하거나 네트워크를 확인해라."

    return f"{type(exc).__name__}: {text}"


def fetch_account(creds: Credentials, url_override: str | None = None):
    """계좌 정보를 한 번 읽어온다. 주문은 내지 않는다."""
    return build_client(creds, url_override).get_account()


def account_status(account) -> str:
    """AccountStatus enum이든 문자열이든 'ACTIVE' 같은 문자열로 통일한다."""
    return getattr(account.status, "value", str(account.status))


def render_account(account) -> str:
    """계좌 정보를 사람이 읽을 표로 만든다. 민감한 값은 담지 않는다."""

    def field(name: str) -> str:
        value = getattr(account, name, None)
        return "-" if value is None else str(value)

    line = "-" * 46
    return "\n".join(
        [
            line,
            f"계좌 상태     : {account_status(account)}",
            f"계좌 번호     : {field('account_number')}",
            f"통화          : {field('currency')}",
            f"현금          : {field('cash')}",
            f"매수 가능 금액: {field('buying_power')}",
            f"평가 총액     : {field('portfolio_value')}",
            f"거래 차단 여부: {field('trading_blocked')}",
            line,
        ]
    )
