"""Alpaca 모의계좌(Paper) 연결 확인 스크립트.

하는 일은 딱 하나다: .env에 넣어둔 모의계좌 키로 접속해서 계좌 상태와 잔고를 한 번 읽어온다.
주문은 넣지 않고, 실계좌(api.alpaca.markets)에는 접속하지 않는다.

실행:  python check_account.py
"""

import os
import sys

from dotenv import load_dotenv

# 모의계좌 주소. 실계좌(api.alpaca.markets)는 이 스크립트에서 절대 쓰지 않는다.
PAPER_ENDPOINT = "https://paper-api.alpaca.markets"


def mask(value: str) -> str:
    """키를 화면에 찍을 때 앞 4글자만 남기고 가린다. 값 자체는 절대 출력하지 않는다."""
    if not value:
        return "(비어 있음)"
    return f"{value[:4]}{'*' * 8} (길이 {len(value)})"


def main() -> int:
    load_dotenv()

    api_key = os.getenv("ALPACA_API_KEY", "").strip()
    secret_key = os.getenv("ALPACA_SECRET_KEY", "").strip()

    missing = [
        name
        for name, value in (("ALPACA_API_KEY", api_key), ("ALPACA_SECRET_KEY", secret_key))
        if not value
    ]
    if missing:
        print("[실패] .env에서 다음 값을 찾지 못했다: " + ", ".join(missing))
        print("       .env.example을 .env로 복사한 뒤 모의계좌 키를 채워 넣어라.")
        return 1

    # 키 자체가 아니라, 제대로 읽혔는지만 확인할 수 있게 가린 형태로만 보여준다.
    print(f"키 로딩 확인 : ALPACA_API_KEY = {mask(api_key)}")
    print(f"접속 대상    : {PAPER_ENDPOINT} (모의계좌)")

    from alpaca.trading.client import TradingClient

    # paper=True 가 모의계좌 주소로 보내주는 스위치다. 이 값을 False로 바꾸면 실계좌로 가니 건드리지 말 것.
    client = TradingClient(api_key, secret_key, paper=True)

    try:
        account = client.get_account()
    except Exception as exc:  # noqa: BLE001 - 초보자에게 원인을 그대로 보여주는 편이 낫다
        print(f"[실패] 계좌 조회 중 오류: {type(exc).__name__}: {exc}")
        print("       흔한 원인 3가지:")
        print("       1) 키를 실계좌용으로 발급받았다 → 모의계좌(Paper) 화면에서 다시 발급")
        print("       2) 키를 복사할 때 공백/줄바꿈이 섞였다")
        print("       3) 네트워크가 paper-api.alpaca.markets 로 나가지 못한다")
        return 1

    status = getattr(account.status, "value", str(account.status))

    print("-" * 46)
    print(f"계좌 상태     : {status}")
    print(f"계좌 번호     : {account.account_number}")
    print(f"통화          : {account.currency}")
    print(f"현금          : {account.cash}")
    print(f"매수 가능 금액: {account.buying_power}")
    print(f"평가 총액     : {account.portfolio_value}")
    print("-" * 46)

    if status != "ACTIVE":
        print(f"[실패] 계좌 상태가 ACTIVE가 아니다(현재: {status}). Alpaca 대시보드에서 계좌 상태를 확인하라.")
        return 1

    print("[성공] 모의계좌 연결과 잔고 조회까지 정상이다. 주문은 한 건도 넣지 않았다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
