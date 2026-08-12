"""아침·저녁 리포트 — 봇이 어젯밤 무엇을 했는지 사람 말로 알려준다.

  아침(07:00) : 어제 무슨 일이 있었나 · 오늘 무엇을 감시하나
  저녁(21:00) : 오늘 체결·손익·낙폭 · 지금 들고 있는 것

⚠️ 여기서 절대 하지 않는 것
   · API 키·시크릿을 어떤 형태로도 문자열에 넣지 않는다. 리포트는 파일로
     남고 웹훅으로 나가므로, 한 번 새어 나가면 회수할 수 없다.
   · 주문을 내지 않는다. 이 파일은 읽기 전용이다.
   · 없는 숫자를 0 으로 채우지 않는다. 모르면 '—' 로 둔다.
"""

from __future__ import annotations

import csv
import json
import os
import textwrap
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

MORNING = "morning"
EVENING = "evening"

# 리포트에 절대 실리면 안 되는 환경변수 이름들 — 마지막에 한 번 더 훑는다
SECRET_ENV = ("ALPACA_API_KEY", "ALPACA_SECRET_KEY", "ALPACA_LIVE_CONFIRM",
              "REPORT_WEBHOOK_URL")


# ══════════════════════════════════════════════════════════════════════════
# 재료 모으기
# ══════════════════════════════════════════════════════════════════════════
@dataclass
class Context:
    kind: str = EVENING
    mode: str = "모의"                 # 모의 | 실계좌
    now: str = ""
    equity: float | None = None
    cash: float | None = None
    peak_equity: float = 0.0
    status: str = "RUNNING"
    stopped_reason: str = ""
    positions: dict = field(default_factory=dict)     # {sym: {side, qty, avg, unrealized}}
    today: list = field(default_factory=list)         # 오늘 청산된 거래 dict 목록
    yesterday: list = field(default_factory=list)
    watch: list = field(default_factory=list)         # [(symbol, strategy, 한 줄 설명)]
    notes: list = field(default_factory=list)         # 경고·실패 메시지


def _day(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def read_trades(path: str) -> list:
    """trades.csv 를 읽는다. 없으면 빈 목록 — 리포트는 그래도 나와야 한다."""
    if not os.path.exists(path):
        return []
    out = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                try:
                    r["pnl"] = float(r.get("pnl") or 0)
                    r["qty"] = float(r.get("qty") or 0)
                except ValueError:
                    continue
                out.append(r)
    except Exception:
        return []
    return out


def split_by_day(trades: list, today: str, yesterday: str) -> tuple:
    t_today = [t for t in trades if str(t.get("exit_time", ""))[:10] == today]
    t_yest = [t for t in trades if str(t.get("exit_time", ""))[:10] == yesterday]
    return t_today, t_yest


def gather(cfg: dict, *, kind: str, broker=None, state=None, now: datetime | None = None) -> Context:
    """리포트에 필요한 것을 모은다. 계좌를 못 읽어도 리포트는 나온다."""
    now = now or datetime.now(timezone.utc)
    ctx = Context(kind=kind, now=now.isoformat(timespec="seconds"))

    if state is not None:
        ctx.peak_equity = float(getattr(state, "peak_equity", 0.0) or 0.0)
        ctx.status = getattr(state, "status", "RUNNING")
        ctx.stopped_reason = getattr(state, "stopped_reason", "") or ""

    if broker is not None:
        ctx.mode = "모의" if getattr(broker, "paper", True) else "실계좌"
        try:
            ctx.equity = float(broker.equity())
            ctx.cash = float(broker.cash())
        except Exception as e:
            ctx.notes.append(f"계좌를 읽지 못했습니다 ({_short(e)})")
        try:
            ctx.positions = broker.positions()
        except Exception as e:
            ctx.notes.append(f"포지션을 읽지 못했습니다 ({_short(e)})")

    trades = read_trades(cfg.get("run", {}).get("trades_csv", "trades.csv"))
    ctx.today, ctx.yesterday = split_by_day(trades, _day(now), _day(now - timedelta(days=1)))

    for a in cfg.get("assets", []):
        ctx.watch.append((a["symbol"], a["strategy"], a.get("timeframe", "")))
    return ctx


def _short(e) -> str:
    """예외 메시지는 짧게 자른다 — 긴 예외에 URL·헤더가 섞여 들어올 수 있다."""
    return str(e).splitlines()[0][:80]


# ══════════════════════════════════════════════════════════════════════════
# 글로 옮기기
# ══════════════════════════════════════════════════════════════════════════
def _money(v) -> str:
    return "—" if v is None else f"{v:,.2f}"


def _pnl_line(trades: list, label: str) -> str:
    if not trades:
        return f"{label}: 체결 없음"
    total = sum(t["pnl"] for t in trades)
    wins = sum(1 for t in trades if t["pnl"] > 0)
    return (f"{label}: {len(trades)}건 체결, {wins}승 {len(trades) - wins}패, "
            f"손익 {total:+,.2f}")


def _drawdown_line(ctx: Context) -> str:
    if not ctx.equity or ctx.peak_equity <= 0:
        return "고점 대비 낙폭: — (잔고를 읽지 못했습니다)"
    dd = max(0.0, (ctx.peak_equity - ctx.equity) / ctx.peak_equity * 100.0)
    return f"고점 {ctx.peak_equity:,.0f} 대비 낙폭 {dd:.2f}%"


def _positions_line(ctx: Context) -> str:
    if not ctx.positions:
        return "보유 포지션: 없음"
    parts = []
    for s, p in ctx.positions.items():
        parts.append(f"{s} {p.get('side', '?')} {p.get('qty', 0):,.4f} "
                     f"({p.get('unrealized', 0):+,.0f})")
    return "보유: " + " · ".join(parts)


def build(ctx: Context, max_words: int = 200) -> str:
    """리포트 본문. 200단어를 넘기지 않는다 — 길면 아무도 안 읽는다."""
    head = "☀️ 아침 리포트" if ctx.kind == MORNING else "🌙 저녁 리포트"
    lines = [f"{head} · {ctx.now} · {ctx.mode}"]

    if ctx.status != "RUNNING":
        lines.append(f"🛑 정지 상태입니다 — {ctx.stopped_reason or '사유 미기록'}. "
                     f"사람이 resume 하기 전까지 주문하지 않습니다.")

    lines.append(f"잔고 {_money(ctx.equity)} · 현금 {_money(ctx.cash)}")
    lines.append(_drawdown_line(ctx))

    if ctx.kind == MORNING:
        lines.append(_pnl_line(ctx.yesterday, "어제"))
        lines.append(_positions_line(ctx))
        watch = ", ".join(f"{s}({st.split('_')[0]},{tf})" for s, st, tf in ctx.watch)
        lines.append(f"오늘 감시: {watch}")
        lines.append("규칙은 그대로입니다 — 거래당 1%, 낙폭 10%면 자동 정지.")
    else:
        lines.append(_pnl_line(ctx.today, "오늘"))
        if ctx.today:
            worst = min(ctx.today, key=lambda t: t["pnl"])
            best = max(ctx.today, key=lambda t: t["pnl"])
            lines.append(f"최고 {best['symbol']} {best['pnl']:+,.0f} · "
                         f"최악 {worst['symbol']} {worst['pnl']:+,.0f} ({worst.get('reason', '')})")
            stops = [t for t in ctx.today if t.get("reason") == "stop"]
            if stops:
                lines.append(f"손절로 나간 거래 {len(stops)}건 — 규칙대로 잘린 것입니다.")
        lines.append(_positions_line(ctx))

    for n in ctx.notes:
        lines.append(f"⚠️ {n}")

    text = "\n".join(lines)
    return _cap_words(text, max_words)


def _cap_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    # 줄 단위로 자른다 — 단어 중간에서 끊으면 숫자가 반쪽이 되어 오해를 부른다
    kept, count = [], 0
    for line in text.split("\n"):
        n = len(line.split())
        if count + n > max_words:
            break
        kept.append(line)
        count += n
    kept.append(f"… (그 외 생략, {max_words}단어 제한)")
    return "\n".join(kept)


# ══════════════════════════════════════════════════════════════════════════
# 내보내기
# ══════════════════════════════════════════════════════════════════════════
def scrub(text: str) -> str:
    """마지막 안전망 — 환경변수에 든 비밀 값이 본문에 섞였으면 지운다.

    여기까지 올 일이 없어야 정상이다. 그래도 둔다. 한 번 새면 끝이라서.
    """
    for name in SECRET_ENV:
        v = os.getenv(name)
        if v and len(v) >= 8 and v in text:
            text = text.replace(v, "***가려짐***")
    return text


def save(text: str, outdir: str, kind: str, when: datetime | None = None) -> str:
    when = when or datetime.now(timezone.utc)
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, f"{when.strftime('%Y%m%d')}-{kind}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text + "\n")
    return path


def post_webhook(text: str) -> str:
    """REPORT_WEBHOOK_URL 이 있으면 슬랙 형식으로 보낸다. 없으면 조용히 넘어간다."""
    url = os.getenv("REPORT_WEBHOOK_URL", "").strip()
    if not url:
        return "웹훅 미설정 — 파일로만 남깁니다"
    try:
        import urllib.request
        body = json.dumps({"text": text}).encode("utf-8")
        req = urllib.request.Request(url, data=body,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return f"웹훅 전송 {r.status}"
    except Exception as e:
        # 주소가 예외 메시지에 실려 나올 수 있으므로 그대로 쓰지 않는다
        return f"웹훅 전송 실패 ({type(e).__name__})"


def run(cfg: dict, *, kind: str, broker=None, state=None,
        dry_run: bool = False, outdir: str = "reports",
        now: datetime | None = None) -> dict:
    """리포트를 만들고, dry-run 이 아니면 파일로 남기고 웹훅으로 보낸다."""
    ctx = gather(cfg, kind=kind, broker=broker, state=state, now=now)
    text = scrub(build(ctx, int(cfg.get("report", {}).get("max_words", 200))))

    print("\n" + "─" * 62)
    print(textwrap.dedent(text))
    print("─" * 62)

    if dry_run:
        print("[dry-run] 파일로 남기거나 보내지 않았습니다.")
        return {"text": text, "path": None, "delivery": "dry-run"}

    path = save(text, outdir, kind, now)
    delivery = post_webhook(text)
    print(f"저장 {path} · {delivery}")
    return {"text": text, "path": path, "delivery": delivery}
