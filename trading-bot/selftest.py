"""네트워크와 실제 키 없이 코드가 맞는지 검증하는 셀프테스트.

Alpaca 서버 대신 내 컴퓨터 안에 가짜 서버(목 서버)를 잠깐 띄우고,
check_account.py가 쓰는 것과 똑같은 코드 경로를 태워본다.

이게 통과하면 "코드는 정상이다"가 증명된다.
실제 계좌 연결은 여기서 확인할 수 없다 — 그건 키를 넣고 check_account.py를 돌려야 한다.

실행:  python selftest.py
"""

from __future__ import annotations

import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from alpaca_paper import (
    ConfigError,
    Credentials,
    account_status,
    describe_error,
    fetch_account,
    load_credentials,
    render_account,
    resolve_base_url,
)

# 목 서버가 인정할 가짜 키. 진짜 키가 아니며 어디에도 전송되지 않는다.
FAKE_KEY = "PKTEST0000000000TEST"
FAKE_SECRET = "skTESTsecretvalue0000000000000000TEST"

# Alpaca가 실제로 돌려주는 응답과 같은 모양의 가짜 계좌 데이터.
FAKE_ACCOUNT = {
    "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "account_number": "PA0TESTACCOUNT",
    "status": "ACTIVE",
    "currency": "USD",
    "cash": "100000",
    "buying_power": "200000",
    "portfolio_value": "100000",
    "equity": "100000",
    "trading_blocked": False,
    "account_blocked": False,
    "pattern_day_trader": False,
}


class MockAlpacaHandler(BaseHTTPRequestHandler):
    """GET /v2/account 하나만 흉내내는 최소한의 가짜 서버."""

    # 서버가 요청 로그를 콘솔에 쏟지 않게 막는다.
    def log_message(self, *args) -> None:  # noqa: D102
        pass

    def _send_json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - http.server가 요구하는 이름
        if self.path != "/v2/account":
            self._send_json(404, {"message": "not found"})
            return

        # 진짜 Alpaca처럼 키를 헤더에서 확인한다. 틀리면 401.
        key = self.headers.get("APCA-API-KEY-ID")
        secret = self.headers.get("APCA-API-SECRET-KEY")
        if key != FAKE_KEY or secret != FAKE_SECRET:
            self._send_json(401, {"code": 40110000, "message": "unauthorized"})
            return

        self._send_json(200, dict(FAKE_ACCOUNT, **self.server.account_overrides))


class MockAlpacaServer:
    """`with` 블록 안에서만 살아있는 로컬 목 서버."""

    def __init__(self, **account_overrides) -> None:
        self._overrides = account_overrides

    def __enter__(self) -> str:
        # 포트 0 = 비어 있는 포트를 운영체제가 골라준다.
        self._httpd = ThreadingHTTPServer(("127.0.0.1", 0), MockAlpacaHandler)
        self._httpd.account_overrides = self._overrides
        self._thread = threading.Thread(target=self._httpd.serve_forever, daemon=True)
        self._thread.start()
        port = self._httpd.server_address[1]
        return f"http://127.0.0.1:{port}"

    def __exit__(self, *exc_info) -> None:
        self._httpd.shutdown()
        self._httpd.server_close()
        self._thread.join(timeout=5)


# --------------------------------------------------------------------------
# 검사 항목
# --------------------------------------------------------------------------

def test_balance_fetch_succeeds() -> None:
    """정상 키 → 잔고 조회 성공, 상태 ACTIVE."""
    creds = Credentials(FAKE_KEY, FAKE_SECRET)
    with MockAlpacaServer() as url:
        account = fetch_account(creds, url_override=url)

    assert account_status(account) == "ACTIVE", account_status(account)
    assert account.account_number == "PA0TESTACCOUNT"
    assert str(account.cash) == "100000"


def test_report_renders_balance() -> None:
    """출력 표에 잔고가 들어가고, 시크릿은 절대 들어가지 않는다."""
    creds = Credentials(FAKE_KEY, FAKE_SECRET)
    with MockAlpacaServer() as url:
        account = fetch_account(creds, url_override=url)

    report = render_account(account)
    assert "ACTIVE" in report
    assert "100000" in report
    assert FAKE_SECRET not in report, "시크릿이 출력에 노출됐다"
    assert FAKE_KEY not in report, "API 키가 출력에 노출됐다"


def test_non_active_status_is_caught() -> None:
    """계좌 상태가 ACTIVE가 아니면 그대로 잡아낸다."""
    creds = Credentials(FAKE_KEY, FAKE_SECRET)
    with MockAlpacaServer(status="ACCOUNT_UPDATED") as url:
        account = fetch_account(creds, url_override=url)

    assert account_status(account) != "ACTIVE"


def test_wrong_key_gives_paper_hint() -> None:
    """키가 틀리면 401 → '모의계좌 키로 재발급' 안내가 나온다."""
    creds = Credentials("WRONGKEY", "WRONGSECRET")
    with MockAlpacaServer() as url:
        try:
            fetch_account(creds, url_override=url)
        except Exception as exc:  # noqa: BLE001
            message = describe_error(exc)
        else:
            raise AssertionError("틀린 키인데 조회가 성공해버렸다")

    assert "Paper Trading" in message, message


def test_masking_hides_secret() -> None:
    """마스킹된 문자열에 키 원본이 남지 않는다."""
    masked = Credentials(FAKE_KEY, FAKE_SECRET).masked()
    assert FAKE_KEY not in masked
    assert FAKE_SECRET not in masked
    assert masked.startswith(FAKE_KEY[:4])
    assert "*" in masked


def test_live_url_is_refused() -> None:
    """실계좌 주소는 어떤 경우에도 거부한다."""
    for live in ("https://api.alpaca.markets", "https://broker-api.alpaca.markets"):
        try:
            resolve_base_url(live)
        except ConfigError as exc:
            assert "실계좌" in str(exc)
        else:
            raise AssertionError(f"실계좌 주소가 통과해버렸다: {live}")


def test_default_url_is_paper() -> None:
    """주소를 지정하지 않으면 SDK 기본값(모의계좌)을 쓴다."""
    assert resolve_base_url(None) is None

    client = __import__("alpaca_paper").build_client(Credentials(FAKE_KEY, FAKE_SECRET))
    # _base_url 은 문자열이 아니라 BaseURL enum 이라 .value 로 실제 주소를 꺼내야 한다.
    raw = client._base_url
    base = str(getattr(raw, "value", raw))
    assert "paper-api.alpaca.markets" in base, base
    assert "//api.alpaca.markets" not in base, base


def test_missing_keys_are_reported() -> None:
    """키가 없으면 네트워크를 타기 전에 친절하게 걸러낸다."""
    saved = {k: os.environ.pop(k, None) for k in ("ALPACA_API_KEY", "ALPACA_SECRET_KEY")}
    try:
        load_credentials(env_file="/nonexistent/.env")
    except ConfigError as exc:
        assert "ALPACA_API_KEY" in str(exc)
    else:
        raise AssertionError("키가 없는데 통과해버렸다")
    finally:
        for key, value in saved.items():
            if value is not None:
                os.environ[key] = value


def test_quoted_key_is_reported() -> None:
    """따옴표가 섞인 키를 401 나기 전에 잡아준다."""
    os.environ["ALPACA_API_KEY"] = '"PKTEST"'
    os.environ["ALPACA_SECRET_KEY"] = "whatever"
    try:
        load_credentials(env_file="/nonexistent/.env")
    except ConfigError as exc:
        assert "따옴표" in str(exc)
    else:
        raise AssertionError("따옴표 섞인 키가 통과해버렸다")
    finally:
        os.environ.pop("ALPACA_API_KEY", None)
        os.environ.pop("ALPACA_SECRET_KEY", None)


def test_proxy_block_is_explained() -> None:
    """프록시 차단을 키 문제로 오해하지 않게 구분해서 설명한다."""
    blocked = Exception(
        "HTTPSConnectionPool(host='paper-api.alpaca.markets', port=443): "
        "Max retries exceeded (Caused by ProxyError('Unable to connect to proxy', "
        "OSError('Tunnel connection failed: 403 Forbidden')))"
    )
    message = describe_error(blocked)
    assert "네트워크" in message
    assert "키 문제가 아니다" in message


TESTS = [
    test_balance_fetch_succeeds,
    test_report_renders_balance,
    test_non_active_status_is_caught,
    test_wrong_key_gives_paper_hint,
    test_masking_hides_secret,
    test_live_url_is_refused,
    test_default_url_is_paper,
    test_missing_keys_are_reported,
    test_quoted_key_is_reported,
    test_proxy_block_is_explained,
]


def main() -> int:
    # 로컬 목 서버는 프록시를 거치면 안 된다.
    os.environ["NO_PROXY"] = "127.0.0.1,localhost"
    os.environ["no_proxy"] = "127.0.0.1,localhost"

    print("셀프테스트: 가짜 Alpaca 서버로 코드 경로를 검증한다 (실제 접속 없음)\n")

    failures = []
    for test in TESTS:
        name = test.__name__.removeprefix("test_")
        try:
            test()
        except Exception as exc:  # noqa: BLE001
            failures.append((name, exc))
            print(f"  ✗ {name}\n      {type(exc).__name__}: {exc}")
        else:
            print(f"  ✓ {name}")

    total = len(TESTS)
    print()
    if failures:
        print(f"[실패] {len(failures)}/{total} 항목이 깨졌다. 위 메시지를 보고 고쳐라.")
        return 1

    print(f"[성공] {total}/{total} 통과 — 코드는 정상이다.")
    print("       남은 단계: .env에 모의계좌 키를 넣고 `python check_account.py` 로")
    print("       실제 계좌 상태가 ACTIVE로 나오는지 확인하면 끝이다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
