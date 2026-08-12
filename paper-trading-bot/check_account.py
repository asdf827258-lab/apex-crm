"""
Alpaca 모의계좌(Paper) 연결 확인 — 잔고를 한 번 읽어오기만 한다.

실행:  python check_account.py

이 파일이 지키는 것 (안전장치)
  · 주문을 한 건도 넣지 않는다. 조회 함수만 부른다.
  · 실계좌(api.alpaca.markets)에 접속하지 않는다. paper=True 로 고정하고,
    실제로 연결 직전에 주소가 paper-api 인지 확인한 뒤 아니면 멈춘다.
  · API 키·시크릿을 화면이나 로그에 절대 출력하지 않는다(앞 4글자만 마스킹 표시).
"""

import os
import sys

from dotenv import load_dotenv

PAPER_HOST = "paper-api.alpaca.markets"
LIVE_HOST = "api.alpaca.markets"


def mask(value: str) -> str:
    """키가 '들어와 있다'는 것만 보여주고 값은 감춘다."""
    if not value:
        return "(없음)"
    return f"{value[:4]}{'*' * 8} (길이 {len(value)})"


def money(value) -> str:
    """'100000' → '100,000.00' 처럼 읽기 쉽게."""
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return str(value)


def classify_error(msg: str) -> str:
    """예외 메시지를 'network' / 'auth' / 'unknown' 으로 가른다.

    ⚠️ 순서가 중요하다. 프록시가 막을 때도 'Tunnel connection failed: 403' 처럼
       403 이 섞여 나오기 때문에, 401/403 을 먼저 보면 멀쩡한 키를 두고
       "키가 틀렸다"고 엉뚱하게 안내하게 된다. 네트워크를 먼저 판정한다.
    """
    low = (msg or "").lower()

    network_markers = (
        "proxyerror", "unable to connect to proxy", "tunnel connection failed",
        "getaddrinfo", "name or service not known", "max retries exceeded",
        "connectionerror", "connection refused", "timed out", "ssl",
    )
    if any(m in low for m in network_markers):
        return "network"

    auth_markers = ("unauthorized", "forbidden", "invalid key", "access key", "401", "403")
    if any(m in low for m in auth_markers):
        return "auth"

    return "unknown"


def is_active(status) -> bool:
    """계좌 상태가 정확히 ACTIVE 인가.

    ⚠️ 'ACTIVE' in str(status) 로 검사하면 안 된다.
       alpaca 의 상태값에는 INACTIVE 가 있고, 'INACTIVE' 안에 'ACTIVE' 가 들어 있어서
       정지된 계좌를 '정상'으로 통과시켜 버린다.
       enum 은 str() 하면 'AccountStatus.ACTIVE' 가 되므로 마지막 조각만 떼어 정확히 비교한다.
    """
    name = str(getattr(status, "value", status)).strip().upper()
    if "." in name:                      # 'ACCOUNTSTATUS.ACTIVE' → 'ACTIVE'
        name = name.rsplit(".", 1)[-1]
    return name == "ACTIVE"


def resolve_base_url(client) -> str:
    """alpaca-py 는 _base_url 을 Enum(BaseURL.TRADING_PAPER)으로 들고 있다.

    str() 하면 'BaseURL.TRADING_PAPER' 가 나와 주소 검사가 통과하지 못하므로
    .value 를 먼저 꺼낸다.
    """
    raw = getattr(client, "_base_url", "")
    return str(getattr(raw, "value", raw))


def fail(title: str, *lines: str) -> None:
    """실패를 '무엇을 하면 되는지'까지 적어서 알려주고 종료한다."""
    print(f"\n❌ {title}")
    for line in lines:
        print(f"   {line}")
    sys.exit(1)


def main() -> None:
    print("=" * 60)
    print("Alpaca 모의계좌 연결 확인")
    print("=" * 60)

    # ── 1) .env 에서 키 읽기 ────────────────────────────────────────────
    load_dotenv()
    api_key = os.getenv("ALPACA_API_KEY", "").strip()
    secret_key = os.getenv("ALPACA_SECRET_KEY", "").strip()

    print(f"\n[1/4] .env 읽기")
    print(f"      ALPACA_API_KEY    : {mask(api_key)}")
    print(f"      ALPACA_SECRET_KEY : {mask(secret_key)}")

    if not api_key or not secret_key:
        fail(
            ".env 에 키가 없습니다.",
            "cp .env.example .env  로 파일을 만들고 두 줄을 채우세요.",
            "키는 https://app.alpaca.markets 에서 우측 상단을 'Paper' 로 바꾼 뒤 발급합니다.",
        )

    if api_key.startswith("여기에") or secret_key.startswith("여기에"):
        fail(
            ".env 가 아직 예시값 그대로입니다.",
            "'여기에_...' 부분을 실제 발급받은 키로 바꾸세요.",
        )

    # ── 2) 클라이언트 만들기 (paper=True 고정) ──────────────────────────
    print(f"\n[2/4] 클라이언트 생성 (paper=True)")
    try:
        from alpaca.trading.client import TradingClient
    except ImportError:
        fail(
            "alpaca-py 가 설치되어 있지 않습니다.",
            "가상환경을 켠 상태인지 확인하세요:  source .venv/bin/activate",
            "그다음:  pip install alpaca-py python-dotenv",
        )

    client = TradingClient(api_key, secret_key, paper=True)

    # ── 3) 실계좌 접속 차단 확인 ────────────────────────────────────────
    base_url = resolve_base_url(client)
    print(f"\n[3/4] 접속 주소 확인")
    print(f"      {base_url}")
    if LIVE_HOST in base_url and PAPER_HOST not in base_url:
        fail(
            "실계좌 주소로 연결되려 했습니다. 중단합니다.",
            "TradingClient(..., paper=True) 인지 확인하세요.",
        )
    if PAPER_HOST not in base_url:
        fail(
            "모의계좌 주소가 아닙니다. 안전을 위해 중단합니다.",
            f"기대한 주소: https://{PAPER_HOST}",
        )
    print(f"      ✅ 모의계좌(paper) 주소가 맞습니다. 실계좌 아님.")

    # ── 4) 잔고 조회 (조회만, 주문 없음) ────────────────────────────────
    print(f"\n[4/4] 계좌 조회 중…")
    try:
        account = client.get_account()
    except Exception as e:  # noqa: BLE001 - 초보자에게 원인을 그대로 보여주는 게 목적
        msg = str(e)
        kind = classify_error(msg)

        if kind == "network":
            fail(
                f"Alpaca 서버에 닿지 못했습니다 (키 문제가 아닙니다).",
                f"이 컴퓨터에서 https://{PAPER_HOST} 로 나가는 연결이 막혀 있습니다.",
                "회사망·VPN·방화벽·프록시가 원인인 경우가 많습니다. 개인 네트워크에서 다시 시도해 보세요.",
                f"확인: curl -sS -o /dev/null -w '%{{http_code}}\\n' https://{PAPER_HOST}/v2/clock",
                f"(원문: {msg[:200]})",
            )

        if kind == "auth":
            fail(
                "키가 거부됐습니다 (401/403).",
                "① 실계좌(Live) 키를 넣지 않았는지 확인하세요 — Paper 화면에서 발급한 키여야 합니다.",
                "② 키를 복사할 때 앞뒤 공백이나 따옴표가 붙지 않았는지 확인하세요.",
                "③ 키를 재발급하면 이전 키는 즉시 무효가 됩니다. 최신 키인지 확인하세요.",
                f"(원문: {msg[:200]})",
            )

        fail("계좌 조회에 실패했습니다.", f"원문: {msg[:300]}")

    # ── 결과 ────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("✅ 연결 성공 — 모의계좌 잔고")
    print("=" * 60)
    print(f"  계좌상태 (status)   : {account.status}")
    print(f"  계좌번호            : {account.account_number}")
    print(f"  통화                : {account.currency}")
    print(f"  현금 (cash)         : {money(account.cash)}")
    print(f"  매수여력 (buying_power): {money(account.buying_power)}")
    print(f"  평가총액 (equity)   : {money(account.equity)}")
    print(f"  거래정지 여부       : {account.trading_blocked}")
    print("=" * 60)

    if not is_active(account.status):
        fail(
            f"계좌 상태가 ACTIVE 가 아닙니다: {account.status}",
            "Alpaca 대시보드에서 모의계좌 상태를 확인하세요.",
            "ONBOARDING·APPROVAL_PENDING 이면 계정 심사가 끝나기를 기다리면 됩니다.",
        )

    if account.trading_blocked:
        fail(
            "계좌 상태는 ACTIVE 지만 거래가 차단되어 있습니다 (trading_blocked=True).",
            "Alpaca 대시보드에서 차단 사유를 확인하세요.",
        )

    print("\n🎉 검증 통과: 상태 ACTIVE · 주문은 한 건도 넣지 않았습니다.")


if __name__ == "__main__":
    main()
