"""증권사 연결 — 모의와 실계좌 사이의 문.

이 파일의 핵심은 주문을 잘 내는 게 아니라 **실계좌로 잘못 가지 않는 것**이다.

  기본값은 언제나 모의다. 환경변수가 하나도 없으면 무조건 paper-api 로 붙는다.
  실계좌는 세 가지가 동시에 있을 때만 열린다:
    ① ALPACA_PAPER=false
    ② ALPACA_LIVE_CONFIRM=I_UNDERSTAND_REAL_MONEY
    ③ 명령에 --live 플래그
  하나라도 없으면 실계좌로 가지 않고 **모의로 내려서** 실행하고 이유를 알린다.

⚠️ 이 파일에서는 키 값을 절대 출력하지 않는다. 로그·예외·리포트 어디에도.
"""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass
from typing import Optional

PAPER_HOST = "paper-api.alpaca.markets"
LIVE_HOST = "api.alpaca.markets"
LIVE_CONFIRM_PHRASE = "I_UNDERSTAND_REAL_MONEY"


def _truthy(v: Optional[str]) -> bool:
    return str(v or "").strip().lower() in {"1", "true", "yes", "y", "on"}


def _falsy(v: Optional[str]) -> bool:
    return str(v or "").strip().lower() in {"0", "false", "no", "n", "off"}


@dataclass
class ModeDecision:
    """어느 계좌로 갈지, 왜 그렇게 정했는지."""
    paper: bool
    requested_live: bool
    reasons: list          # 실계좌가 아닌 이유들 (모의로 내려간 근거)

    @property
    def demoted(self) -> bool:
        """실계좌를 요청했는데 조건이 모자라 모의로 내려간 경우."""
        return self.requested_live and self.paper


def decide_mode(env: dict | None = None, live_flag: bool = False) -> ModeDecision:
    """세 열쇠를 확인한다. 순수 함수라 테스트가 그대로 검증한다.

    env 를 넘기지 않으면 os.environ 을 본다.
    """
    e = os.environ if env is None else env

    paper_var = e.get("ALPACA_PAPER")
    confirm = (e.get("ALPACA_LIVE_CONFIRM") or "").strip()

    # ALPACA_PAPER 를 명시적으로 false 로 둔 경우에만 '실계좌 의사' 로 본다.
    # 값이 없거나 이상하면 모의다 — 모르면 안전한 쪽.
    wants_live_env = _falsy(paper_var)

    reasons: list = []
    if not wants_live_env:
        if paper_var is None:
            reasons.append("ALPACA_PAPER 가 없습니다 (기본값 = 모의)")
        else:
            reasons.append("ALPACA_PAPER 가 false 가 아닙니다")
    if confirm != LIVE_CONFIRM_PHRASE:
        if not confirm:
            reasons.append("ALPACA_LIVE_CONFIRM 이 없습니다")
        else:
            reasons.append("ALPACA_LIVE_CONFIRM 문구가 정확하지 않습니다")
    if not live_flag:
        reasons.append("--live 플래그가 없습니다")

    # 사용자가 실계좌를 '시도' 했는지 — 셋 중 하나라도 건드렸으면 시도로 본다
    requested_live = bool(wants_live_env or confirm or live_flag)

    is_live = wants_live_env and (confirm == LIVE_CONFIRM_PHRASE) and live_flag
    return ModeDecision(paper=not is_live, requested_live=requested_live, reasons=reasons)


def base_url(paper: bool) -> str:
    return f"https://{PAPER_HOST}" if paper else f"https://{LIVE_HOST}"


def mask(value: Optional[str]) -> str:
    """키가 '있다' 는 것만 보여준다. 값은 절대 노출하지 않는다."""
    if not value:
        return "(없음)"
    return f"{value[:4]}{'*' * 8} (길이 {len(value)})"


def live_banner(equity: float, max_loss: float, countdown: int = 10, out=None) -> None:
    """실계좌로 시작할 때 화면 맨 위에 띄우는 경고. 카운트다운 뒤에 시작한다."""
    w = out or sys.stdout
    line = "=" * 64
    print(line, file=w)
    print("  ⚠️  실계좌 모드 — 진짜 돈이 나갑니다  ⚠️", file=w)
    print(line, file=w)
    print(f"  현재 잔고            : {equity:,.2f}", file=w)
    print(f"  한 번 매매 최대 손실 : {max_loss:,.2f}", file=w)
    print(f"  접속 주소            : https://{LIVE_HOST}", file=w)
    print(line, file=w)
    for i in range(countdown, 0, -1):
        print(f"  {i}초 뒤 시작합니다… (중단하려면 Ctrl+C)", file=w, flush=True)
        time.sleep(1)
    print("  시작합니다.", file=w, flush=True)


class Broker:
    """Alpaca 연결. dry_run 이면 주문 함수가 아예 전송하지 않는다."""

    def __init__(self, *, paper: bool = True, dry_run: bool = False, logger=None):
        self.paper = bool(paper)
        self.dry_run = bool(dry_run)
        self.log = logger
        self._client = None
        self._api_key = os.getenv("ALPACA_API_KEY", "")
        self._secret = os.getenv("ALPACA_SECRET_KEY", "")

    # ── 연결 ────────────────────────────────────────────────────────────
    def connect(self):
        if self._client is not None:
            return self._client
        if not self._api_key or not self._secret:
            raise RuntimeError(
                ".env 에 ALPACA_API_KEY / ALPACA_SECRET_KEY 가 없습니다. "
                ".env.example 을 복사해 채우세요."
            )
        try:
            from alpaca.trading.client import TradingClient
        except ImportError as exc:
            raise RuntimeError("alpaca-py 가 설치되지 않았습니다: pip install alpaca-py") from exc

        self._client = TradingClient(self._api_key, self._secret, paper=self.paper)

        # 정말 우리가 의도한 주소로 붙었는지 확인한다.
        # alpaca-py 는 _base_url 을 Enum 으로 들고 있어 str() 하면 'BaseURL.TRADING_PAPER'
        # 가 나온다. 그대로 검사하면 통과해 버리므로 .value 를 먼저 꺼낸다.
        raw = getattr(self._client, "_base_url", "")
        url = str(getattr(raw, "value", raw))
        if self.paper and PAPER_HOST not in url:
            raise RuntimeError(f"모의로 붙어야 하는데 주소가 다릅니다: {url}")
        if not self.paper and LIVE_HOST not in url:
            raise RuntimeError(f"실계좌로 붙어야 하는데 주소가 다릅니다: {url}")
        return self._client

    def base_url(self) -> str:
        return base_url(self.paper)

    # ── 조회 ────────────────────────────────────────────────────────────
    def account(self):
        return self.connect().get_account()

    def equity(self) -> float:
        return float(self.account().equity)

    def cash(self) -> float:
        return float(self.account().cash)

    def positions(self) -> dict:
        """{"SPY": {"side": "long", "qty": 10, "avg": 500.0}, ...}"""
        out = {}
        for p in self.connect().get_all_positions():
            qty = float(p.qty)
            out[str(p.symbol).upper()] = {
                "side": "long" if qty > 0 else "short",
                "qty": abs(qty),
                "avg": float(p.avg_entry_price),
                "unrealized": float(getattr(p, "unrealized_pl", 0) or 0),
            }
        return out

    def open_order_symbols(self) -> set:
        """접수돼 있는 주문의 종목 — 같은 신호로 두 번 넣지 않기 위해."""
        try:
            from alpaca.trading.requests import GetOrdersRequest
            from alpaca.trading.enums import QueryOrderStatus
            req = GetOrdersRequest(status=QueryOrderStatus.OPEN)
            return {str(o.symbol).upper() for o in self.connect().get_orders(req)}
        except Exception:
            return set()

    def market_open(self, symbol: str) -> bool:
        """BTC 는 24시간, 주식·ETF 는 미국 장중에만."""
        if str(symbol).upper().startswith("BTC"):
            return True
        try:
            return bool(self.connect().get_clock().is_open)
        except Exception:
            return False

    # ── 주문 ────────────────────────────────────────────────────────────
    def submit(self, *, symbol: str, side: str, qty: float, reason: str = "") -> dict:
        """시장가 주문. dry_run 이면 전송하지 않고 계획만 돌려준다."""
        plan = {
            "symbol": symbol, "side": side, "qty": qty,
            "paper": self.paper, "reason": reason,
            "submitted": False, "dry_run": self.dry_run,
        }
        if self.dry_run:
            self._say(f"[모의계획] {symbol} {side} {qty} — 주문은 보내지 않았습니다 ({reason})")
            return plan
        if qty is None or qty <= 0:
            plan["error"] = "수량이 0 이라 보내지 않았습니다"
            return plan

        from alpaca.trading.requests import MarketOrderRequest
        from alpaca.trading.enums import OrderSide, TimeInForce

        crypto = str(symbol).upper().startswith("BTC")
        req = MarketOrderRequest(
            symbol=symbol,
            qty=qty,
            side=OrderSide.BUY if side in ("long", "buy") else OrderSide.SELL,
            time_in_force=TimeInForce.GTC if crypto else TimeInForce.DAY,
        )
        order = self.connect().submit_order(req)
        plan["submitted"] = True
        plan["order_id"] = str(order.id)
        self._say(f"[주문] {symbol} {side} {qty} → id={order.id} ({'모의' if self.paper else '실계좌'})")
        return plan

    def cancel_all(self) -> int:
        if self.dry_run:
            self._say("[모의계획] 열린 주문 취소 — 보내지 않았습니다")
            return 0
        self.connect().cancel_orders()
        return 1

    def close_all(self) -> int:
        if self.dry_run:
            self._say("[모의계획] 전량 청산 — 보내지 않았습니다")
            return 0
        self.connect().close_all_positions(cancel_orders=True)
        return 1

    def _say(self, msg: str) -> None:
        if self.log:
            self.log(msg)
        else:
            print(msg)
