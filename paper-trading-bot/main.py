"""자동매매 봇 — 명령 창구.

  python main.py backtest --months 6
  python main.py backtest --months 6 --slippage-bps 10
  python main.py paper --dry-run      계획만 출력, 주문 없음
  python main.py paper --once         모의계좌에 한 사이클
  python main.py paper                모의계좌 연속 루프
  python main.py live --once          실계좌 한 사이클 (3중 잠금 필요)
  python main.py status               상태·포지션·잔고
  python main.py report --morning     아침 리포트
  python main.py report --evening     저녁 리포트 (--dry-run 이면 출력만)
  python main.py stop --close-all     전량 정리하고 STOPPED
  python main.py resume               사람이 직접 재개

⚠️ 기본은 모의다. 실계좌는 세 열쇠가 다 있을 때만 열린다.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

from dotenv import load_dotenv

import broker as bk
import data as dm
import portfolio as pf
from portfolio import Trade
from risk import manager as rm

load_dotenv()


# ── 설정 ────────────────────────────────────────────────────────────────
def load_config(path: str = "config.yaml") -> dict:
    try:
        import yaml
    except ImportError:
        print("PyYAML 이 필요합니다:  pip install pyyaml", file=sys.stderr)
        raise SystemExit(1)
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def log(cfg: dict, msg: str, live: bool = False) -> None:
    """로그 한 줄마다 실계좌 여부를 남긴다 — 나중에 추적할 수 있게."""
    tag = "LIVE " if live else "PAPER"
    line = f"[{now_iso()}][{tag}] {msg}"
    print(line)
    try:
        with open(cfg["run"]["log_file"], "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════════════════
# backtest
# ══════════════════════════════════════════════════════════════════════════
def cmd_backtest(args, cfg) -> int:
    import backtest as bt

    costs = bt.Costs(
        commission_bps=float(cfg["costs"]["commission_bps"]),
        slippage_bps=float(args.slippage_bps if args.slippage_bps is not None
                           else cfg["costs"]["slippage_bps"]),
    )
    print(f"백테스트 {args.months}개월 · 슬리피지 {costs.slippage_bps}bps · 수수료 {costs.commission_bps}bps")

    bars, source = {}, "alpaca"
    for a in cfg["assets"]:
        sym, tf = a["symbol"], a["timeframe"]
        try:
            df, src = dm.load_bars(sym, tf, args.months, synthetic=args.synthetic)
            bars[sym] = df
            source = src
            print(f"  {sym:<8} {tf:<6} {len(df):>6}봉  ({src})")
        except Exception as e:
            print(f"  {sym:<8} {tf:<6} 실패 — {str(e)[:90]}")

    if not bars:
        print("\n데이터를 하나도 못 받았습니다.")
        print("  · 키가 없다면 .env 를 채우세요")
        print("  · 배관만 확인하려면:  python main.py backtest --months 6 --synthetic")
        return 1

    res = bt.run(
        bars, cfg["assets"], costs=costs,
        starting_equity=float(args.equity),
        per_trade_pct=float(cfg["risk"]["per_trade_pct"]),
        correlation_filter=bool(cfg["risk"]["correlation_filter"]),
        outdir=args.outdir, source=source,
    )
    _print_backtest(res)
    with open(os.path.join(args.outdir, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    return 0


def _print_backtest(res: dict) -> None:
    print("\n" + "=" * 78)
    if res["source"] == "synthetic":
        print("  ⚠️  합성 데이터입니다. 배관 점검용이고 성과 해석에 쓰면 안 됩니다.")
        print("=" * 78)
    print(f"  가정 — 수수료 {res['costs']['commission_bps']}bps · 슬리피지 {res['costs']['slippage_bps']}bps")
    print("=" * 78)
    head = f"{'자산':<10}{'전략':<18}{'거래':>5}{'승률':>8}{'손익':>13}{'낙폭%':>9}{'샤프':>8}"
    print(head)
    print("-" * 78)
    for sym, s in res["per_symbol"].items():
        if s.get("error"):
            print(f"{sym:<10}{'—':<18}{'—':>5}  {s['error']}")
            continue
        sh = "—" if s["sharpe"] is None else f"{s['sharpe']:.2f}"
        print(f"{sym:<10}{s.get('strategy',''):<18}{s['trades']:>5}{s['win_rate_pct']:>7.1f}%"
              f"{s['total_pnl']:>13,.0f}{s['max_drawdown_pct']:>9.2f}{sh:>8}")
    t = res["total"]
    print("-" * 78)
    sh = "—" if t["sharpe"] is None else f"{t['sharpe']:.2f}"
    print(f"{'합계':<10}{'':<18}{t['trades']:>5}{t['win_rate_pct']:>7.1f}%"
          f"{t['total_pnl']:>13,.0f}{t['max_drawdown_pct']:>9.2f}{sh:>8}")
    print(f"\n  최종 잔고 {t['final_equity']:,.0f}  ·  수익률 {t['return_pct']:+.2f}%")
    print(f"  결과 파일: {res['outdir']}/  (trades.csv · daily_pnl.csv · equity_curve.csv · backtest_results.png)")

    print("\n  ── 다음 단계로 갈지 판단 ──")
    _gate("거래가 실제로 발생했는가", t["trades"] > 0, f"{t['trades']}건")
    _gate("최대 낙폭 15% 이하", t["max_drawdown_pct"] <= 15.0, f"{t['max_drawdown_pct']:.2f}%")
    _gate("샤프 지수 양수", (t["sharpe"] or 0) > 0, sh)
    _gate("비용이 0 이 아닌가", res["costs"]["slippage_bps"] > 0, f"{res['costs']['slippage_bps']}bps")
    big = _concentration(res)
    _gate("한 자산에 쏠리지 않았는가", big is None, big or "고르게 분포")
    print()


def _gate(label: str, ok: bool, note: str = "") -> None:
    print(f"   {'✅' if ok else '❌'} {label:<22} {note}")


def _concentration(res: dict) -> str | None:
    tot = res["total"]["total_pnl"]
    if abs(tot) < 1e-9:
        return None
    for sym, s in res["per_symbol"].items():
        if s.get("error"):
            continue
        if tot > 0 and s["total_pnl"] > tot * 0.8:
            return f"{sym} 하나가 수익의 80% 초과"
    return None


# ══════════════════════════════════════════════════════════════════════════
# paper / live — 한 사이클
# ══════════════════════════════════════════════════════════════════════════
def _decide(args) -> bk.ModeDecision:
    return bk.decide_mode(live_flag=bool(getattr(args, "live_flag", False)))


def cmd_trade(args, cfg) -> int:
    import backtest as bt
    from strategies import breakout, mean_reversion, trend_following
    strats = {"mean_reversion": mean_reversion, "breakout": breakout, "trend_following": trend_following}

    decision = _decide(args)
    live = not decision.paper

    if decision.demoted:
        print("\n⚠️  실계좌로 가지 않고 모의로 내려서 실행합니다. 빠진 것:")
        for r in decision.reasons:
            print(f"    · {r}")
        print()

    state_path = cfg["run"]["state_file"]
    state = rm.load_state(state_path)

    broker = bk.Broker(paper=decision.paper, dry_run=bool(args.dry_run),
                       logger=lambda m: log(cfg, m, live))

    if args.dry_run:
        print(f"[모의계획 모드] 주문을 한 건도 보내지 않습니다 · 접속 예정 {broker.base_url()}")

    # 잔고 — dry-run 이고 키가 없어도 계획은 보여줄 수 있게 한다
    try:
        equity, cash = broker.equity(), broker.cash()
    except Exception as e:
        if not args.dry_run:
            print(f"계좌를 읽지 못했습니다: {e}")
            return 1
        equity = cash = float(args.equity)
        print(f"계좌를 읽지 못해 가정 잔고 {equity:,.0f} 으로 계획만 계산합니다. ({str(e)[:70]})")

    per_pct = float(cfg["risk"]["per_trade_pct"])
    if live and not args.dry_run:
        bk.live_banner(equity, rm.risk_budget(equity, per_pct))

    # 낙폭 정지 확인 — 주문보다 먼저
    state, just_stopped = rm.check_drawdown(state, equity, float(cfg["risk"]["max_drawdown_pct"]), now_iso())
    rm.save_state(state_path, state)
    if just_stopped:
        log(cfg, f"낙폭 한도 도달 — {state.stopped_reason}. 주문 취소 후 전량 정리합니다.", live)
        broker.cancel_all()
        broker.close_all()
        return 2
    if not rm.can_trade(state):
        print(f"정지 상태입니다 ({state.stopped_reason}). 재개하려면:  python main.py resume")
        return 2

    positions = {} if args.dry_run else broker.positions()
    pos_side = {k: v["side"] for k, v in positions.items()}
    pending = set() if args.dry_run else broker.open_order_symbols()

    print(f"\n잔고 {equity:,.2f} · 현금 {cash:,.2f} · 위험예산 {rm.risk_budget(equity, per_pct):,.2f} "
          f"({'모의' if decision.paper else '실계좌'})")
    print("-" * 78)

    acted = 0
    for a in cfg["assets"]:
        sym, tf = a["symbol"], a["timeframe"]
        mod = strats[a["strategy"]]
        try:
            df, _src = dm.load_bars(sym, tf, months=2, synthetic=bool(args.synthetic))
        except Exception as e:
            print(f"  {sym:<9} 시세 실패 — {str(e)[:60]}")
            continue

        prepared = mod.prepare(df, a.get("params") or {})
        row = prepared.iloc[-1]
        held = pos_side.get(sym.upper())
        sig = mod.signal(row, held)

        if sig == "hold":
            print(f"  {sym:<9} 신호 없음")
            continue
        if sig == "exit":
            print(f"  {sym:<9} 청산 신호")
            if not args.dry_run:
                broker.submit(symbol=sym, side="sell" if held == "long" else "buy",
                              qty=positions[sym.upper()]["qty"], reason="exit signal")
                acted += 1
            continue

        atr = float(row.get("atr") or 0)
        entry = float(row["close"])
        stop_mult = float((a.get("params") or {}).get("atr_stop_mult",
                          getattr(mod, "DEFAULTS", {}).get("atr_stop_mult", 2.0)))
        stop = rm.stop_from_atr(entry, atr, stop_mult, sig)
        qty = rm.position_size(equity, entry, stop or 0, per_pct,
                               allow_fractional=sym.upper().startswith("BTC"))

        ok, why = rm.preflight(
            state=state, symbol=sym, side=sig, qty=qty, entry_price=entry, stop_price=stop,
            equity=equity, cash=cash, market_open=broker.market_open(sym) if not args.dry_run else True,
            open_positions=pos_side, pending_symbols=pending,
        )
        risk_amt = abs(entry - stop) * qty if stop else 0
        print(f"  {sym:<9} {sig:<5} 수량 {qty:<12,.6f} 진입 {entry:,.2f} 손절 {stop:,.2f} "
              f"위험 {risk_amt:,.0f}  → {'주문' if ok else '건너뜀'} ({why})")
        if ok and not args.dry_run:
            broker.submit(symbol=sym, side=sig, qty=qty, reason=f"{a['strategy']} {sig}")
            pending.add(sym)
            acted += 1

    print("-" * 78)
    print(f"{'계획만 출력했습니다 (주문 0건)' if args.dry_run else f'주문 {acted}건 처리'}")
    return 0


def cmd_loop(args, cfg) -> int:
    """연속 루프. 끊김·휴장은 넘기고 계속 돈다."""
    interval = int(cfg["run"]["loop_seconds"])
    print(f"연속 실행 시작 — {interval}초마다 확인합니다. 멈추려면 Ctrl+C")
    while True:
        try:
            rc = cmd_trade(args, cfg)
            if rc == 2:
                print("정지 상태라 루프를 끝냅니다.")
                return 2
        except KeyboardInterrupt:
            print("\n사용자가 중단했습니다.")
            return 0
        except Exception as e:
            log(cfg, f"루프 오류 — 넘기고 계속합니다: {str(e)[:120]}")
        time.sleep(interval)


# ══════════════════════════════════════════════════════════════════════════
# status / stop / resume
# ══════════════════════════════════════════════════════════════════════════
def cmd_status(args, cfg) -> int:
    state = rm.load_state(cfg["run"]["state_file"])
    decision = _decide(args)
    print("=" * 60)
    print(f"  상태        : {state.status}")
    if state.status == rm.STATE_STOPPED:
        print(f"  정지 사유   : {state.stopped_reason}")
        print(f"  정지 시각   : {state.stopped_at}")
        print(f"  재개하려면  : python main.py resume")
    print(f"  잔고 최고점 : {state.peak_equity:,.2f}")
    print(f"  접속 예정   : {bk.base_url(decision.paper)}  ({'모의' if decision.paper else '실계좌'})")
    print(f"  키          : API {bk.mask(os.getenv('ALPACA_API_KEY'))} / SECRET {bk.mask(os.getenv('ALPACA_SECRET_KEY'))}")
    print("=" * 60)

    broker = bk.Broker(paper=decision.paper)
    try:
        acct = broker.account()
        print(f"  계좌상태 {acct.status} · 잔고 {float(acct.equity):,.2f} · 현금 {float(acct.cash):,.2f}")
        pos = broker.positions()
        if not pos:
            print("  보유 포지션 없음")
        for s, p in pos.items():
            print(f"   · {s:<9} {p['side']:<5} {p['qty']:<12,.6f} 평단 {p['avg']:,.2f} 평가손익 {p['unrealized']:+,.2f}")
    except Exception as e:
        print(f"  계좌 조회 실패: {str(e)[:110]}")
    return 0


def cmd_kis(args, cfg) -> int:
    """국내 주식(한국투자증권). 미국 쪽과 같은 3중 잠금을 쓴다.

    주문은 기본이 dry-run 이다. 실제로 내려면 --send 를 붙여야 하고,
    실계좌로 가려면 거기에 세 열쇠가 더 필요하다.
    """
    import kis_broker as kb

    decision = kb.decide_mode(live_flag=getattr(args, "live_flag", False))
    if decision.demoted:
        print("⚠️  실계좌로 가지 않고 모의로 내려서 실행합니다. 빠진 것:")
        for r in decision.reasons:
            print(f"    · {r}")
        print()

    dry = not getattr(args, "send", False)
    broker = kb.KisBroker(paper=decision.paper, dry_run=dry)

    if args.kis_cmd == "status":
        print("=" * 60)
        for line in broker.status_lines():
            print(line)
        miss = broker.missing()
        print(f"  빠진 것     : {', '.join(miss) if miss else '없음'}")
        print("=" * 60)
        if miss:
            print("  .env 에 위 값을 넣으면 조회·주문을 쓸 수 있습니다.")
            return 0
        try:
            b = broker.balance()
            print(f"  예수금 {b['cash']:,.0f}원 · 평가 {b['value']:,.0f}원 · 손익 {b['pl']:+,.0f}원")
            if not b["holdings"]:
                print("  보유 종목 없음")
            for h in b["holdings"]:
                print(f"   · {h['code']} {h['name'][:12]:<12} {h['qty']:>6,}주 "
                      f"평단 {h['avg']:>10,.0f} 현재 {h['price']:>10,.0f} 손익 {h['pl']:+,.0f}")
        except Exception as e:
            print(f"  계좌 조회 실패: {str(e)[:140]}")
        return 0

    if args.kis_cmd == "order":
        if not args.code or not args.qty:
            print("종목코드(--code)와 수량(--qty)이 필요합니다.")
            return 1
        plan = broker.submit(code=args.code, side=args.side, qty=args.qty,
                             price=args.price or 0, reason="수동 주문")
        if plan.get("error"):
            print(f"  보내지 않았습니다 — {plan['error']}")
            return 1
        if not plan["submitted"]:
            print("  계획만 출력했습니다 (주문 0건). 실제로 내려면 --send 를 붙이세요.")
        return 0

    if args.kis_cmd == "fills":
        try:
            rows = broker.fills()
            if not rows:
                print("오늘 체결 없음")
            for r in rows:
                print(f"  {r['code']} {r['name'][:12]:<12} {r['side']:<4} "
                      f"{r['qty']:>6,}주 @ {r['price']:>10,.0f}  주문번호 {r['order_no']}")
        except Exception as e:
            print(f"체결 조회 실패: {str(e)[:140]}")
            return 1
        return 0

    return 1


def cmd_report(args, cfg) -> int:
    import report as rp

    kind = rp.MORNING if args.morning else rp.EVENING
    decision = _decide(args)
    state = rm.load_state(cfg["run"]["state_file"])
    broker = bk.Broker(paper=decision.paper)
    rp.run(cfg, kind=kind, broker=broker, state=state,
           dry_run=bool(args.dry_run), outdir=args.outdir)
    return 0


def cmd_stop(args, cfg) -> int:
    decision = _decide(args)
    state = rm.load_state(cfg["run"]["state_file"])
    state.status = rm.STATE_STOPPED
    state.stopped_reason = "사람이 stop 명령으로 정지"
    state.stopped_at = now_iso()
    rm.save_state(cfg["run"]["state_file"], state)

    if args.close_all:
        broker = bk.Broker(paper=decision.paper, dry_run=bool(args.dry_run))
        try:
            broker.cancel_all()
            broker.close_all()
            print("열린 주문을 취소하고 포지션을 정리했습니다.")
        except Exception as e:
            print(f"정리 중 오류: {str(e)[:110]}")
    print(f"상태를 {rm.STATE_STOPPED} 로 바꿨습니다. 사람이 resume 하기 전까지 주문하지 않습니다.")
    return 0


def cmd_resume(args, cfg) -> int:
    state = rm.load_state(cfg["run"]["state_file"])
    if state.status != rm.STATE_STOPPED:
        print("이미 실행 상태입니다.")
        return 0
    prev = state.stopped_reason
    state = rm.resume(state)
    rm.save_state(cfg["run"]["state_file"], state)
    print(f"재개했습니다. (직전 정지 사유: {prev})")
    print(f"잔고 최고점은 {state.peak_equity:,.2f} 그대로 둡니다 — 낮추면 정지 장치가 무력해집니다.")
    return 0


# ══════════════════════════════════════════════════════════════════════════
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Alpaca 5자산 자동매매 봇 (기본: 모의투자)")
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("--config", default="config.yaml")
        sp.add_argument("--equity", type=float, default=100_000.0, help="계좌를 못 읽을 때 쓸 가정 잔고")
        sp.add_argument("--synthetic", action="store_true", help="합성 데이터로 배관만 확인")

    b = sub.add_parser("backtest", help="과거 데이터로 검증")
    common(b)
    b.add_argument("--months", type=int, default=6)
    b.add_argument("--slippage-bps", type=float, default=None)
    b.add_argument("--outdir", default="results")

    for name, help_ in (("paper", "모의투자"), ("live", "실계좌 (3중 잠금 필요)")):
        t = sub.add_parser(name, help=help_)
        common(t)
        t.add_argument("--dry-run", action="store_true", help="계획만 출력, 주문 없음")
        t.add_argument("--once", action="store_true", help="한 사이클만")
        if name == "live":
            t.add_argument("--live", dest="live_flag", action="store_true",
                           help="실계좌 3중 잠금의 세 번째 열쇠")

    s = sub.add_parser("status", help="상태·포지션·잔고")
    common(s)

    rp = sub.add_parser("report", help="아침·저녁 리포트")
    common(rp)
    g = rp.add_mutually_exclusive_group()
    g.add_argument("--morning", action="store_true", help="아침 리포트")
    g.add_argument("--evening", action="store_true", help="저녁 리포트 (기본)")
    rp.add_argument("--dry-run", action="store_true", help="화면에만 출력, 저장·전송 없음")
    rp.add_argument("--outdir", default="reports")

    st = sub.add_parser("stop", help="정지")
    common(st)
    st.add_argument("--close-all", action="store_true")
    st.add_argument("--dry-run", action="store_true")
    r = sub.add_parser("resume", help="재개")
    common(r)

    # ── 국내 주식 (한국투자증권) ─────────────────────────────────────
    # 미국 쪽과 같은 3중 잠금. 여기에 --send 라는 문턱이 하나 더 있다:
    # --send 없이는 무엇을 하든 주문이 나가지 않는다.
    k = sub.add_parser("kis", help="국내 주식 — 조회·주문 (한국투자증권)")
    common(k)
    k.add_argument("kis_cmd", choices=["status", "order", "fills"],
                   help="status=계좌·잔고 · order=주문 · fills=오늘 체결")
    k.add_argument("--code", help="종목코드 (예: 005930)")
    k.add_argument("--side", default="buy", choices=["buy", "sell"])
    k.add_argument("--qty", type=int, help="수량(주)")
    k.add_argument("--price", type=int, default=0, help="지정가. 없으면 시장가")
    k.add_argument("--send", action="store_true",
                   help="실제로 주문을 보냅니다. 없으면 계획만 출력합니다")
    k.add_argument("--live", dest="live_flag", action="store_true",
                   help="실계좌. KIS_PAPER=false 와 KIS_LIVE_CONFIRM 이 함께 있어야 열립니다")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    cfg = load_config(args.config)

    if args.cmd == "backtest":
        return cmd_backtest(args, cfg)
    if args.cmd in ("paper", "live"):
        if not hasattr(args, "live_flag"):
            args.live_flag = False
        return cmd_trade(args, cfg) if args.once or args.dry_run else cmd_loop(args, cfg)
    if args.cmd == "status":
        args.live_flag = False
        return cmd_status(args, cfg)
    if args.cmd == "report":
        args.live_flag = False
        return cmd_report(args, cfg)
    if args.cmd == "stop":
        args.live_flag = False
        return cmd_stop(args, cfg)
    if args.cmd == "resume":
        args.live_flag = False
        return cmd_resume(args, cfg)
    if args.cmd == "kis":
        return cmd_kis(args, cfg)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
