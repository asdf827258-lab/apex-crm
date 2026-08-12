"""위험 관리 — 이 파일이 계좌를 지킨다.

여기서 틀리면 나머지가 아무리 잘 돌아도 돈을 잃는다. 그래서 규칙을 다섯 개로
줄이고, 전부 순수 함수로 만들어 테스트가 실제로 검증할 수 있게 했다.

  ① 거래당 1%      한 번 매매에 거는 위험은 잔고의 1%
  ② ATR 사이징     조용한 자산은 크게, 요동치는 자산은 작게 — 위험은 늘 같게
  ③ 상관 필터      SPY·QQQ 둘 다 롱이면 BTC 신규 롱 금지
  ④ 하드 스톱      진입할 때 손절이 정해지고 뒤로 밀지 않는다
  ⑤ 낙폭 정지      고점 대비 10% 빠지면 전량 정리하고 사람이 풀 때까지 멈춤

⚠️ 순서가 가장 중요하다.
   수량을 먼저 정하고 손절을 끼워 맞추면 1% 한도가 그냥 깨진다.
   여기서는 '손절 폭이 수량을 정한다'. 반대로 못 하게 함수 모양을 그렇게 짰다.
"""

from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass, asdict
from typing import Optional


STATE_RUNNING = "RUNNING"
STATE_STOPPED = "STOPPED"


# ══════════════════════════════════════════════════════════════════════════
# ① · ② 포지션 사이징 — 손절 폭이 수량을 정한다
# ══════════════════════════════════════════════════════════════════════════
def risk_budget(equity: float, per_trade_pct: float) -> float:
    """이번 거래에 걸 수 있는 최대 손실 금액."""
    if equity is None or equity <= 0:
        return 0.0
    return equity * (per_trade_pct / 100.0)


def position_size(
    equity: float,
    entry_price: float,
    stop_price: float,
    per_trade_pct: float = 1.0,
    *,
    allow_fractional: bool = False,
    max_notional_pct: float = 100.0,
) -> float:
    """수량 = (잔고 × 1%) ÷ 손절까지의 거리.

    손절 거리가 0 이하이면 0 을 준다 — 주문을 건너뛰라는 뜻이다.
    (0 으로 나누면 수량이 무한대가 된다. 그 사고를 여기서 막는다)

    allow_fractional: 암호화폐는 소수 수량이 되고 주식은 정수로 내린다.
    max_notional_pct: 1% 룰을 지켜도 손절이 아주 좁으면 수량이 잔고를 넘을 수 있다.
                      현금보다 큰 주문이 나가지 않게 상한을 둔다.
    """
    if entry_price is None or stop_price is None:
        return 0.0
    if not (entry_price > 0):
        return 0.0

    distance = abs(float(entry_price) - float(stop_price))
    if distance <= 0:
        return 0.0

    budget = risk_budget(equity, per_trade_pct)
    if budget <= 0:
        return 0.0

    qty = budget / distance

    # 잔고보다 큰 주문은 낼 수 없다
    max_notional = equity * (max_notional_pct / 100.0)
    if qty * entry_price > max_notional:
        qty = max_notional / entry_price

    if not allow_fractional:
        qty = math.floor(qty)
    else:
        qty = math.floor(qty * 1e8) / 1e8      # 8자리에서 버림

    return max(qty, 0.0)


def stop_from_atr(entry_price: float, atr: float, mult: float, side: str) -> Optional[float]:
    """ATR 배수로 손절가를 만든다. 롱이면 아래, 숏이면 위."""
    if entry_price is None or atr is None or atr <= 0 or mult <= 0:
        return None
    d = atr * mult
    if side == "long":
        stop = entry_price - d
        return stop if stop > 0 else None
    if side == "short":
        return entry_price + d
    return None


# ══════════════════════════════════════════════════════════════════════════
# ③ 상관 필터 — 서로 다른 자산 세 개가 아니라 같은 베팅 세 배가 되는 것을 막는다
# ══════════════════════════════════════════════════════════════════════════
def correlation_blocked(symbol: str, side: str, open_positions: dict) -> bool:
    """SPY·QQQ 가 둘 다 롱인 상태에서 BTC 신규 롱을 막는다.

    open_positions: {"SPY": "long", "QQQ": "long", ...}
    """
    if not symbol.upper().startswith("BTC"):
        return False
    if side != "long":
        return False
    pos = {k.upper(): v for k, v in (open_positions or {}).items()}
    return pos.get("SPY") == "long" and pos.get("QQQ") == "long"


# ══════════════════════════════════════════════════════════════════════════
# ⑤ 낙폭 정지 — 잔고 최고점을 파일에 남긴다
#    남기지 않으면 프로그램을 껐다 켤 때마다 기준이 초기화돼 장치가 무력해진다
# ══════════════════════════════════════════════════════════════════════════
@dataclass
class BotState:
    peak_equity: float = 0.0
    status: str = STATE_RUNNING
    stopped_reason: str = ""
    stopped_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


def load_state(path: str) -> BotState:
    try:
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        return BotState(
            peak_equity=float(d.get("peak_equity") or 0.0),
            status=str(d.get("status") or STATE_RUNNING),
            stopped_reason=str(d.get("stopped_reason") or ""),
            stopped_at=str(d.get("stopped_at") or ""),
        )
    except (FileNotFoundError, json.JSONDecodeError, ValueError, TypeError):
        return BotState()


def save_state(path: str, state: BotState) -> None:
    tmp = path + ".tmp"
    d = os.path.dirname(os.path.abspath(path))
    if d:
        os.makedirs(d, exist_ok=True)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state.to_dict(), f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)          # 쓰다 죽어도 파일이 깨지지 않게


def drawdown_pct(equity: float, peak: float) -> float:
    """고점 대비 몇 % 내려왔는지. 고점보다 위면 0."""
    if not peak or peak <= 0:
        return 0.0
    if equity >= peak:
        return 0.0
    return (peak - equity) / peak * 100.0


def update_peak(state: BotState, equity: float) -> BotState:
    if equity is not None and equity > state.peak_equity:
        state.peak_equity = float(equity)
    return state


def check_drawdown(state: BotState, equity: float, max_dd_pct: float, now_iso: str = "") -> tuple[BotState, bool]:
    """고점을 갱신하고, 한도를 넘었으면 STOPPED 로 바꾼다.

    돌려주는 두 번째 값이 True 면 '지금 막 정지되었다' 는 뜻 —
    호출한 쪽이 주문 취소·포지션 정리를 해야 한다.
    """
    state = update_peak(state, equity)
    if state.status == STATE_STOPPED:
        return state, False
    dd = drawdown_pct(equity, state.peak_equity)
    if dd >= max_dd_pct:
        state.status = STATE_STOPPED
        state.stopped_reason = f"고점 대비 {dd:.2f}% 하락 (한도 {max_dd_pct}%)"
        state.stopped_at = now_iso
        return state, True
    return state, False


def can_trade(state: BotState) -> bool:
    """STOPPED 면 사람이 resume 하기 전까지 아무 주문도 내지 않는다."""
    return state.status != STATE_STOPPED


def resume(state: BotState) -> BotState:
    """사람이 직접 푸는 것. 자동으로 풀리지 않는다.

    고점을 지금 잔고로 낮추지 않는다 — 낮추면 정지 장치가 리셋되어
    같은 손실을 한 번 더 허용하게 된다.
    """
    state.status = STATE_RUNNING
    state.stopped_reason = ""
    state.stopped_at = ""
    return state


# ══════════════════════════════════════════════════════════════════════════
# 주문 직전 최종 관문 — 여기를 통과하지 못하면 주문은 나가지 않는다
# ══════════════════════════════════════════════════════════════════════════
def preflight(
    *,
    state: BotState,
    symbol: str,
    side: str,
    qty: float,
    entry_price: float,
    stop_price: Optional[float],
    equity: float,
    cash: float,
    market_open: bool,
    open_positions: dict,
    pending_symbols: set,
    min_qty: float = 0.0,
) -> tuple[bool, str]:
    """(통과 여부, 이유). 이유는 로그에 그대로 남겨 나중에 추적할 수 있게 한다."""
    if not can_trade(state):
        return False, f"정지 상태입니다 ({state.stopped_reason})"
    if not market_open:
        return False, f"{symbol} 은(는) 지금 거래 시간이 아닙니다"
    if stop_price is None:
        return False, "손절가가 없습니다 — 손절 없는 주문은 내지 않습니다"
    if abs(float(entry_price) - float(stop_price)) <= 0:
        return False, "손절 거리가 0 입니다"
    if qty is None or qty <= 0:
        return False, "수량이 0 입니다 (손절 폭이 너무 넓거나 잔고가 작습니다)"
    if min_qty and qty < min_qty:
        return False, f"최소 주문 수량({min_qty}) 미만입니다"
    if symbol in (pending_symbols or set()):
        return False, "같은 종목의 주문이 이미 접수돼 있습니다 (중복 방지)"
    if symbol.upper() in {k.upper() for k in (open_positions or {})}:
        return False, "이미 보유 중입니다 (중복 진입 방지)"
    if correlation_blocked(symbol, side, open_positions):
        return False, "상관 필터 — SPY·QQQ 가 둘 다 롱이라 BTC 신규 롱을 막습니다"
    notional = float(qty) * float(entry_price)
    if side == "long" and cash is not None and notional > cash:
        return False, f"현금 부족 (필요 {notional:,.0f} / 보유 {cash:,.0f})"
    return True, "통과"
