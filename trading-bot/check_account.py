"""Alpaca 모의계좌(Paper)에 접속해 잔고를 한 번 읽어온다.

하는 일은 딱 하나다: 계좌 상태와 잔고를 확인하는 것.
주문은 넣지 않고, 실계좌(api.alpaca.markets)에는 접속하지 않는다.

실행:  python check_account.py
"""

from __future__ import annotations

import sys

from alpaca_paper import (
    PAPER_BASE_URL,
    ConfigError,
    account_status,
    describe_error,
    fetch_account,
    load_credentials,
    render_account,
)


def main() -> int:
    try:
        creds = load_credentials()
    except ConfigError as exc:
        print(f"[실패] {exc}")
        return 1

    print(f"키 로딩 확인 : ALPACA_API_KEY = {creds.masked()}")
    print(f"접속 대상    : {PAPER_BASE_URL} (모의계좌)")

    try:
        account = fetch_account(creds)
    except ConfigError as exc:
        print(f"[실패] {exc}")
        return 1
    except Exception as exc:  # noqa: BLE001 - 원인을 그대로 보여주는 편이 초보자에게 낫다
        print(f"[실패] 계좌 조회에 실패했다.\n       {describe_error(exc)}")
        return 1

    print(render_account(account))

    status = account_status(account)
    if status != "ACTIVE":
        print(
            f"[실패] 계좌 상태가 ACTIVE가 아니다(현재: {status}).\n"
            "       Alpaca 대시보드에서 모의계좌 상태를 확인해라."
        )
        return 1

    print("[성공] 모의계좌 연결과 잔고 조회까지 정상이다. 주문은 한 건도 넣지 않았다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
