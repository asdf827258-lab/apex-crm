"""리포트 검사 — 리포트는 파일로 남고 웹훅으로 나간다. 새면 회수할 수 없다.

  ① 키가 절대 실리지 않는가
  ② dry-run 이 정말 아무것도 남기지 않는가
  ③ 계좌를 못 읽어도 리포트가 나오는가 (모르는 값을 0 으로 속이지 않고)
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import report as rp

NOW = datetime(2026, 3, 10, 21, 0, tzinfo=timezone.utc)
CFG = {
    "run": {"trades_csv": "trades.csv"},
    "report": {"max_words": 200},
    "assets": [
        {"symbol": "SPY", "strategy": "mean_reversion", "timeframe": "15Min"},
        {"symbol": "BTC/USD", "strategy": "breakout", "timeframe": "1Hour"},
    ],
}


class FakeBroker:
    paper = True

    def __init__(self, fail=False):
        self.fail = fail

    def equity(self):
        if self.fail:
            raise RuntimeError("connection refused to https://paper-api.alpaca.markets")
        return 98_400.0

    def cash(self):
        return 50_000.0

    def positions(self):
        return {"SPY": {"side": "long", "qty": 100, "avg": 500.0, "unrealized": -120.0}}


class FakeState:
    peak_equity = 100_000.0
    status = "RUNNING"
    stopped_reason = ""


def write_trades(tmp_path, rows):
    p = tmp_path / "trades.csv"
    lines = ["entry_time,exit_time,symbol,side,qty,entry_price,exit_price,pnl,reason"]
    lines += [",".join(str(x) for x in r) for r in rows]
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return str(p)


def cfg_with(path):
    c = dict(CFG)
    c["run"] = {"trades_csv": path}
    return c


# ══ ① 비밀은 절대 나가지 않는다 ═══════════════════════════════════════════
def test_리포트에_키가_들어가면_가려진다(monkeypatch):
    secret = "PKTESTSECRETVALUE1234567"
    monkeypatch.setenv("ALPACA_API_KEY", secret)
    dirty = f"잔고 100 · 키 {secret} 로 접속"
    out = rp.scrub(dirty)
    assert secret not in out
    assert "***가려짐***" in out


def test_정상_리포트에는_애초에_키가_없다(monkeypatch, tmp_path):
    monkeypatch.setenv("ALPACA_API_KEY", "PKREALKEY000000000000000")
    monkeypatch.setenv("ALPACA_SECRET_KEY", "SKREALSECRET00000000000000000000")
    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                    broker=FakeBroker(), state=FakeState(), now=NOW)
    text = rp.build(ctx)
    assert "PKREALKEY000000000000000" not in text
    assert "SKREALSECRET00000000000000000000" not in text
    # scrub 이 아무것도 바꾸지 않아야 한다 — 애초에 넣지 않으니까
    assert rp.scrub(text) == text


def test_웹훅_주소도_본문에_실리지_않는다(monkeypatch, tmp_path):
    monkeypatch.setenv("REPORT_WEBHOOK_URL", "https://hooks.example.com/T000/B000/XyZsecret123")
    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.MORNING,
                    broker=FakeBroker(), state=FakeState(), now=NOW)
    assert "XyZsecret123" not in rp.build(ctx)


# ══ ② dry-run 은 아무것도 남기지 않는다 ═══════════════════════════════════
def test_dry_run은_파일을_만들지_않는다(tmp_path, capsys):
    out = tmp_path / "reports"
    res = rp.run(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                 broker=FakeBroker(), state=FakeState(),
                 dry_run=True, outdir=str(out), now=NOW)
    assert res["path"] is None
    assert res["delivery"] == "dry-run"
    assert not out.exists(), "dry-run 인데 폴더를 만들었다"
    assert "저녁 리포트" in capsys.readouterr().out


def test_dry_run이_아니면_파일로_남는다(tmp_path):
    out = tmp_path / "reports"
    res = rp.run(cfg_with(str(tmp_path / "none.csv")), kind=rp.MORNING,
                 broker=FakeBroker(), state=FakeState(),
                 dry_run=False, outdir=str(out), now=NOW)
    assert res["path"] and Path(res["path"]).exists()
    assert "20260310-morning" in res["path"]
    assert Path(res["path"]).read_text(encoding="utf-8").strip() == res["text"]


def test_웹훅이_없으면_조용히_넘어간다(monkeypatch):
    monkeypatch.delenv("REPORT_WEBHOOK_URL", raising=False)
    assert "미설정" in rp.post_webhook("아무 글")


# ══ ③ 모르는 값을 0 으로 속이지 않는다 ════════════════════════════════════
def test_계좌를_못_읽어도_리포트가_나온다(tmp_path):
    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                    broker=FakeBroker(fail=True), state=FakeState(), now=NOW)
    text = rp.build(ctx)
    assert "잔고 —" in text, "못 읽은 잔고를 0 으로 채우면 안 된다"
    assert "계좌를 읽지 못했습니다" in text


def test_거래가_없으면_체결_없음이라고_쓴다(tmp_path):
    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                    broker=FakeBroker(), state=FakeState(), now=NOW)
    assert "오늘: 체결 없음" in rp.build(ctx)


def test_정지_상태면_맨_위에_표시된다(tmp_path):
    class Stopped(FakeState):
        status = "STOPPED"
        stopped_reason = "낙폭 10.4%"

    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                    broker=FakeBroker(), state=Stopped(), now=NOW)
    text = rp.build(ctx)
    assert "🛑" in text and "낙폭 10.4%" in text
    assert text.index("🛑") < text.index("잔고"), "정지 표시가 잔고보다 먼저 나와야 한다"


# ══ 날짜 구분과 숫자 ══════════════════════════════════════════════════════
def test_아침은_어제_저녁은_오늘을_집계한다(tmp_path):
    y = (NOW - timedelta(days=1)).strftime("%Y-%m-%d")
    t = NOW.strftime("%Y-%m-%d")
    path = write_trades(tmp_path, [
        (f"{y}T10:00", f"{y}T15:00", "SPY", "long", 10, 500, 510, 100.0, "signal"),
        (f"{t}T10:00", f"{t}T15:00", "QQQ", "long", 5, 400, 390, -50.0, "stop"),
        (f"{t}T11:00", f"{t}T16:00", "GLD", "long", 8, 200, 205, 40.0, "signal"),
    ])
    cfg = cfg_with(path)

    morn = rp.build(rp.gather(cfg, kind=rp.MORNING, broker=FakeBroker(),
                              state=FakeState(), now=NOW))
    assert "어제: 1건 체결, 1승 0패, 손익 +100.00" in morn

    eve = rp.build(rp.gather(cfg, kind=rp.EVENING, broker=FakeBroker(),
                             state=FakeState(), now=NOW))
    assert "오늘: 2건 체결, 1승 1패, 손익 -10.00" in eve
    assert "최고 GLD +40" in eve and "최악 QQQ -50" in eve
    assert "손절로 나간 거래 1건" in eve


def test_낙폭이_고점_대비로_계산된다(tmp_path):
    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                    broker=FakeBroker(), state=FakeState(), now=NOW)
    # 100,000 → 98,400 = 1.60%
    assert "낙폭 1.60%" in rp.build(ctx)


def test_고점보다_위면_낙폭은_0(tmp_path):
    class Low(FakeState):
        peak_equity = 90_000.0

    ctx = rp.gather(cfg_with(str(tmp_path / "none.csv")), kind=rp.EVENING,
                    broker=FakeBroker(), state=Low(), now=NOW)
    assert "낙폭 0.00%" in rp.build(ctx)


# ══ 길이 제한 ═════════════════════════════════════════════════════════════
def test_단어_제한을_넘기지_않는다():
    long_text = "\n".join(f"{i}번 줄 " + "단어 " * 20 for i in range(50))
    out = rp._cap_words(long_text, 200)
    assert len(out.split()) <= 200 + 6, "제한을 크게 넘겼다"
    assert "생략" in out, "잘랐으면 잘랐다고 알려야 한다"


def test_짧으면_그대로_둔다():
    s = "짧은 리포트"
    assert rp._cap_words(s, 200) == s


def test_깨진_trades_csv에도_죽지_않는다(tmp_path):
    p = tmp_path / "trades.csv"
    p.write_text("이건 CSV 가 아니다\n@@@\n", encoding="utf-8")
    assert rp.read_trades(str(p)) == [] or isinstance(rp.read_trades(str(p)), list)


def test_없는_파일이면_빈_목록():
    assert rp.read_trades("/존재하지/않는/경로.csv") == []
