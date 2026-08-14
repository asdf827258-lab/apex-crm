"""국내 주문(한국투자증권)이 실수로 실계좌에 나가지 않는지.

미국(Alpaca)과 같은 규칙을 쓰기로 했으니, 같은 강도로 검증한다.
여기서 지키는 것은 딱 셋이다:

  ① 여덟 조합(2×2×2) 중 실계좌는 정확히 한 줄뿐이다
  ② dry_run 이면 네트워크를 아예 건드리지 않는다
  ③ 키·계좌번호가 화면이나 로그에 그대로 나오지 않는다
"""

import itertools

import pytest

import kis_broker as K


LIVE = K.LIVE_CONFIRM_PHRASE


# ── ① 3중 잠금 ────────────────────────────────────────────────────────
def test_아무것도_없으면_모의다():
    m = K.decide_mode(env={}, live_flag=False)
    assert m.paper is True
    assert m.demoted is False          # 시도조차 안 했으니 강등이 아니다


def test_여덟_조합_중_실계좌는_정확히_하나다():
    lives = []
    for paper_var, confirm, flag in itertools.product(
        [None, "false"], ["", LIVE], [False, True]
    ):
        env = {}
        if paper_var is not None:
            env["KIS_PAPER"] = paper_var
        if confirm:
            env["KIS_LIVE_CONFIRM"] = confirm
        m = K.decide_mode(env=env, live_flag=flag)
        if not m.paper:
            lives.append((paper_var, confirm, flag))

    assert lives == [("false", LIVE, True)], f"실계좌로 열린 조합: {lives}"


@pytest.mark.parametrize("confirm", [
    "i_understand_real_money",         # 소문자
    "I_UNDERSTAND_REAL_MONEY ",        # 뒤 공백은 strip 되지만 앞뒤 다른 글자는 안 된다
    "I_UNDERSTAND_REAL_MONE",          # 한 글자 빠짐
    "I UNDERSTAND REAL MONEY",         # 밑줄 대신 공백
])
def test_확인문구가_조금이라도_다르면_안_열린다(confirm):
    m = K.decide_mode(
        env={"KIS_PAPER": "false", "KIS_LIVE_CONFIRM": confirm}, live_flag=True)
    if confirm.strip() == LIVE:
        return                          # strip 으로 같아지는 것은 통과가 맞다
    assert m.paper is True
    assert m.demoted is True            # 시도했는데 막혔다 → 알려줘야 한다


def test_모의로_내려가면_이유를_알려준다():
    m = K.decide_mode(env={"KIS_PAPER": "false"}, live_flag=True)
    assert m.paper is True and m.demoted is True
    joined = " ".join(m.reasons)
    assert "KIS_LIVE_CONFIRM" in joined


def test_주소가_모드에_맞게_갈린다():
    assert "openapivts" in K.base_url(paper=True)
    assert "openapivts" not in K.base_url(paper=False)


def test_거래구분코드가_모드에_맞게_갈린다():
    # 모의는 V 로 시작한다. 이게 뒤바뀌면 모의 계좌에 실전 코드가 나간다.
    for kind in ("buy", "sell", "cancel", "balance", "fills"):
        assert K.tr_id(kind, paper=True).startswith("V")
        assert not K.tr_id(kind, paper=False).startswith("V")


# ── ② dry_run 이면 전송하지 않는다 ───────────────────────────────────
class 터지는세션:
    """네트워크를 쓰면 즉시 실패시킨다."""
    def post(self, *a, **k):
        raise AssertionError("dry_run 인데 POST 를 보냈습니다")

    def get(self, *a, **k):
        raise AssertionError("dry_run 인데 GET 을 보냈습니다")


def test_dry_run_이면_주문을_보내지_않는다():
    b = K.KisBroker(paper=True, dry_run=True, session=터지는세션(),
                    env={"KIS_APP_KEY": "k", "KIS_APP_SECRET": "s",
                         "KIS_ACCOUNT": "12345678-01"})
    plan = b.submit(code="005930", side="buy", qty=10)
    assert plan["submitted"] is False
    assert plan["dry_run"] is True


def test_dry_run_이면_취소도_보내지_않는다():
    b = K.KisBroker(paper=True, dry_run=True, session=터지는세션())
    assert b.cancel(order_no="0001")["submitted"] is False


def test_기본값은_모의_그리고_dry_run():
    b = K.KisBroker()
    assert b.paper is True and b.dry_run is True


def test_수량이_0이면_보내지_않는다():
    b = K.KisBroker(paper=True, dry_run=False, session=터지는세션(),
                    env={"KIS_APP_KEY": "k", "KIS_APP_SECRET": "s",
                         "KIS_ACCOUNT": "12345678-01"})
    plan = b.submit(code="005930", side="buy", qty=0)
    assert plan["submitted"] is False
    assert "0" in plan["error"]


def test_키가_없으면_보내지_않는다():
    b = K.KisBroker(paper=True, dry_run=False, session=터지는세션(), env={})
    plan = b.submit(code="005930", side="buy", qty=10)
    assert plan["submitted"] is False
    assert "KIS_APP_KEY" in plan["error"]


# ── 주문 본문 ─────────────────────────────────────────────────────────
def test_계좌번호를_두_토막으로_나눈다():
    assert K.split_account("12345678-01") == ("12345678", "01")
    assert K.split_account("1234567801") == ("12345678", "01")
    for bad in ("", None, "1234", "abcdefgh-01", "12345678-1"):
        assert K.split_account(bad) == (None, None), bad


def test_종목코드_앞의_A를_떼고_보낸다():
    b = K.KisBroker(env={"KIS_ACCOUNT": "12345678-01"})
    assert b.build_order(code="A005930", side="buy", qty=1)["PDNO"] == "005930"
    assert b.build_order(code="005930", side="buy", qty=1)["PDNO"] == "005930"


def test_가격이_0이면_시장가_아니면_지정가():
    b = K.KisBroker(env={"KIS_ACCOUNT": "12345678-01"})
    assert b.build_order(code="005930", side="buy", qty=1, price=0)["ORD_DVSN"] == "01"
    assert b.build_order(code="005930", side="buy", qty=1, price=71200)["ORD_DVSN"] == "00"


def test_거래소가_거부하면_성공으로_세지_않는다():
    """rt_cd 가 0 이 아닌데 submitted=True 로 넘기면 안 판 걸 팔았다고 기록한다."""
    class 거부하는세션:
        def post(self, url, **k):
            class R:
                status_code = 200
                @staticmethod
                def json():
                    if "hashkey" in url:
                        return {"HASH": "x"}
                    if "tokenP" in url:
                        return {"access_token": "t", "expires_in": 3600}
                    return {"rt_cd": "1", "msg1": "장 시작 전입니다"}
            return R()

    b = K.KisBroker(paper=True, dry_run=False, session=거부하는세션(),
                    env={"KIS_APP_KEY": "k", "KIS_APP_SECRET": "s",
                         "KIS_ACCOUNT": "12345678-01"})
    plan = b.submit(code="005930", side="buy", qty=1)
    assert plan["submitted"] is False
    assert "장 시작 전" in plan["error"]


# ── ③ 키가 새지 않는다 ───────────────────────────────────────────────
def test_키와_계좌번호가_화면에_그대로_나오지_않는다():
    key, sec, acct = "PSABCDEFGHIJKLMNOP", "SEC0123456789ABCDEF", "12345678-01"
    b = K.KisBroker(paper=True, env={"KIS_APP_KEY": key, "KIS_APP_SECRET": sec,
                                     "KIS_ACCOUNT": acct})
    text = "\n".join(b.status_lines())
    assert key not in text
    assert sec not in text
    assert "12345678" not in text       # 계좌 앞자리가 보이면 안 된다
    assert text.count("*") > 0


def test_mask_는_없는_값을_없다고_말한다():
    assert K.mask("") == "(없음)"
    assert K.mask_account(None) == "(없음)"
