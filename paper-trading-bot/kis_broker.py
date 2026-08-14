"""한국투자증권 연결 — 국내 주식 주문.

broker.py(Alpaca·미국)와 **같은 규칙**을 따른다. 규칙이 두 벌이면 한쪽만
고치고 다른 쪽을 잊는다.

  기본값은 언제나 모의투자다. 환경변수가 하나도 없으면 무조건 모의(vts)로 붙는다.
  실계좌는 세 가지가 동시에 있을 때만 열린다:
    ① KIS_PAPER=false
    ② KIS_LIVE_CONFIRM=I_UNDERSTAND_REAL_MONEY
    ③ 명령에 --live 플래그
  하나라도 없으면 실계좌로 가지 않고 **모의로 내려서** 실행하고 이유를 알린다.

왜 토스가 아니라 한국투자증권인가
  토스증권 오픈API 는 호출 IP 를 미리 등록해야 한다. 붙여 봤는데 토큰 발급까지는
  됐지만, 서버 IP 가 배포마다 바뀌어 등록으로는 쫓아갈 수 없었다. 한국투자증권은
  IP 등록이 없고 모의투자 계좌까지 준다. 자세한 경위는 docs/KEYS.md 에 있다.

⚠️ 이 파일에서는 키 값도 계좌번호도 절대 그대로 출력하지 않는다.
⚠️ 주문 함수는 dry_run 이면 아무것도 전송하지 않는다. 기본이 dry_run 이다.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from typing import Optional

LIVE_CONFIRM_PHRASE = "I_UNDERSTAND_REAL_MONEY"

PAPER_HOST = "https://openapivts.koreainvestment.com:29443"   # 모의투자
LIVE_HOST = "https://openapi.koreainvestment.com:9443"        # 실전

# 거래 구분 코드(TR ID)는 모의와 실전이 다르다. 문서 값이 바뀌면 여기만 고친다.
# 앞글자 V = 모의(virtual), T = 실전.
TR = {
    "buy":     {"paper": "VTTC0802U", "live": "TTTC0802U"},   # 현금 매수
    "sell":    {"paper": "VTTC0801U", "live": "TTTC0801U"},   # 현금 매도
    "cancel":  {"paper": "VTTC0803U", "live": "TTTC0803U"},   # 정정·취소
    "balance": {"paper": "VTTC8434R", "live": "TTTC8434R"},   # 잔고조회
    "fills":   {"paper": "VTTC8001R", "live": "TTTC8001R"},   # 체결조회
}

PATH = {
    "token":   "/oauth2/tokenP",
    "hashkey": "/uapi/hashkey",
    "order":   "/uapi/domestic-stock/v1/trading/order-cash",
    "cancel":  "/uapi/domestic-stock/v1/trading/order-rvsecncl",
    "balance": "/uapi/domestic-stock/v1/trading/inquire-balance",
    "fills":   "/uapi/domestic-stock/v1/trading/inquire-daily-ccld",
}


def _truthy(v: Optional[str]) -> bool:
    return str(v or "").strip().lower() in {"1", "true", "yes", "y", "on"}


def _falsy(v: Optional[str]) -> bool:
    return str(v or "").strip().lower() in {"0", "false", "no", "n", "off"}


@dataclass
class KisMode:
    """어느 계좌로 갈지, 왜 그렇게 정했는지."""
    paper: bool
    requested_live: bool
    reasons: list = field(default_factory=list)

    @property
    def demoted(self) -> bool:
        """실계좌를 요청했는데 조건이 모자라 모의로 내려간 경우."""
        return self.requested_live and self.paper


def decide_mode(env: dict | None = None, live_flag: bool = False) -> KisMode:
    """세 열쇠를 확인한다. 순수 함수라 테스트가 그대로 검증한다.

    broker.decide_mode 와 같은 판정을 하되 환경변수 이름만 KIS_ 다.
    """
    e = os.environ if env is None else env

    paper_var = e.get("KIS_PAPER")
    confirm = (e.get("KIS_LIVE_CONFIRM") or "").strip()

    # KIS_PAPER 를 명시적으로 false 로 둔 경우에만 '실계좌 의사' 로 본다.
    # 값이 없거나 이상하면 모의다 — 모르면 안전한 쪽.
    wants_live_env = _falsy(paper_var)

    reasons: list = []
    if not wants_live_env:
        if paper_var is None:
            reasons.append("KIS_PAPER 가 없습니다 (기본값 = 모의)")
        else:
            reasons.append("KIS_PAPER 가 false 가 아닙니다")
    if confirm != LIVE_CONFIRM_PHRASE:
        if not confirm:
            reasons.append("KIS_LIVE_CONFIRM 이 없습니다")
        else:
            reasons.append("KIS_LIVE_CONFIRM 문구가 정확하지 않습니다")
    if not live_flag:
        reasons.append("--live 플래그가 없습니다")

    requested_live = bool(wants_live_env or confirm or live_flag)
    is_live = wants_live_env and (confirm == LIVE_CONFIRM_PHRASE) and live_flag
    return KisMode(paper=not is_live, requested_live=requested_live, reasons=reasons)


def base_url(paper: bool) -> str:
    return PAPER_HOST if paper else LIVE_HOST


def tr_id(kind: str, paper: bool) -> str:
    return TR[kind]["paper" if paper else "live"]


def mask(value: Optional[str]) -> str:
    """키가 '있다' 는 것만 보여준다. 값은 절대 노출하지 않는다."""
    if not value:
        return "(없음)"
    return f"{value[:4]}{'*' * 8} (길이 {len(value)})"


def mask_account(acct: Optional[str]) -> str:
    """계좌번호도 가린다. 뒤 두 자리만 남긴다."""
    s = str(acct or "").strip()
    if not s:
        return "(없음)"
    return f"{'*' * max(len(s) - 2, 0)}{s[-2:]}"


def split_account(raw: Optional[str]) -> tuple:
    """'12345678-01' 또는 '1234567801' → ('12345678', '01').

    KIS 는 종합계좌번호 8자리와 상품코드 2자리를 따로 받는다.
    형식이 아니면 (None, None) 을 돌려주고, 부르는 쪽이 주문을 막는다.
    """
    s = str(raw or "").strip().replace(" ", "")
    if "-" in s:
        head, _, tail = s.partition("-")
    elif len(s) == 10:
        head, tail = s[:8], s[8:]
    else:
        return (None, None)
    if not (head.isdigit() and tail.isdigit() and len(head) == 8 and len(tail) == 2):
        return (None, None)
    return (head, tail)


class KisBroker:
    """한국투자증권 연결. dry_run 이면 주문 함수가 아예 전송하지 않는다.

    기본값이 paper=True, dry_run=True 다 — 실수로 주문이 나가지 않게.
    """

    def __init__(self, *, paper: bool = True, dry_run: bool = True, logger=None,
                 env: dict | None = None, session=None):
        self.paper = paper
        self.dry_run = dry_run
        self.log = logger
        self._env = os.environ if env is None else env
        self._session = session          # 테스트에서 갈아끼운다
        self._tok = None
        self._tok_exp = 0.0

    # ── 키 ────────────────────────────────────────────────────────────
    @property
    def app_key(self) -> str:
        return (self._env.get("KIS_APP_KEY") or "").strip()

    @property
    def app_secret(self) -> str:
        return (self._env.get("KIS_APP_SECRET") or "").strip()

    @property
    def account(self) -> str:
        return (self._env.get("KIS_ACCOUNT") or "").strip()

    def missing(self) -> list:
        """무엇이 빠졌는지. 비어 있으면 부를 준비가 된 것."""
        out = []
        if not self.app_key:
            out.append("KIS_APP_KEY")
        if not self.app_secret:
            out.append("KIS_APP_SECRET")
        if split_account(self.account) == (None, None):
            out.append("KIS_ACCOUNT (예: 12345678-01)")
        return out

    def base_url(self) -> str:
        return base_url(self.paper)

    # ── HTTP ──────────────────────────────────────────────────────────
    def _http(self):
        if self._session is not None:
            return self._session
        import requests                                    # 지연 임포트
        self._session = requests.Session()
        return self._session

    def _post(self, path: str, *, headers: dict, body: dict) -> dict:
        r = self._http().post(self.base_url() + path, headers=headers,
                              data=json.dumps(body), timeout=15)
        return self._read(r, path)

    def _get(self, path: str, *, headers: dict, params: dict) -> dict:
        r = self._http().get(self.base_url() + path, headers=headers,
                             params=params, timeout=15)
        return self._read(r, path)

    @staticmethod
    def _read(r, path: str) -> dict:
        try:
            j = r.json()
        except Exception:
            raise RuntimeError(f"{path} 응답이 JSON 이 아닙니다 ({r.status_code})")
        if r.status_code >= 400:
            # 키 값이 섞여 나오지 않게 메시지만 뽑는다
            msg = j.get("msg1") or j.get("error_description") or j.get("msg") or ""
            raise RuntimeError(f"{path} 실패 {r.status_code} — {str(msg)[:160]}")
        return j

    # ── 토큰 ──────────────────────────────────────────────────────────
    def token(self) -> str:
        if self._tok and self._tok_exp > time.time():
            return self._tok
        miss = self.missing()
        if miss:
            raise RuntimeError("키가 없습니다: " + ", ".join(miss))
        j = self._post(PATH["token"],
                       headers={"Content-Type": "application/json"},
                       body={"grant_type": "client_credentials",
                             "appkey": self.app_key, "appsecret": self.app_secret})
        tok = j.get("access_token")
        if not tok:
            raise RuntimeError("토큰이 응답에 없습니다")
        # 만료 1분 전에 새로 받는다
        self._tok = tok
        self._tok_exp = time.time() + max(int(j.get("expires_in") or 3600) - 60, 60)
        return tok

    def _hashkey(self, body: dict) -> str:
        """KIS 는 주문 본문의 해시를 헤더에 같이 요구한다."""
        j = self._post(PATH["hashkey"],
                       headers={"Content-Type": "application/json",
                                "appkey": self.app_key, "appsecret": self.app_secret},
                       body=body)
        return j.get("HASH", "")

    def _headers(self, kind: str, *, hashkey: str = "") -> dict:
        h = {
            "Content-Type": "application/json",
            "authorization": f"Bearer {self.token()}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": tr_id(kind, self.paper),
            "custtype": "P",
        }
        if hashkey:
            h["hashkey"] = hashkey
        return h

    # ── 주문 ──────────────────────────────────────────────────────────
    def build_order(self, *, code: str, side: str, qty: int, price: int = 0) -> dict:
        """주문 본문을 만든다. 전송하지 않는다 — 테스트가 이 모양을 검증한다.

        price=0 이면 시장가(주문구분 01), 그 외는 지정가(00).
        """
        acct, prod = split_account(self.account)
        return {
            "CANO": acct or "",
            "ACNT_PRDT_CD": prod or "",
            "PDNO": str(code).strip().upper().lstrip("A"),   # A005930 → 005930
            "ORD_DVSN": "01" if not price else "00",
            "ORD_QTY": str(int(qty)),
            "ORD_UNPR": str(int(price)),
        }

    def submit(self, *, code: str, side: str, qty: int, price: int = 0,
               reason: str = "") -> dict:
        """국내 주식 주문. dry_run 이면 전송하지 않고 계획만 돌려준다."""
        side_l = str(side).strip().lower()
        kind = "buy" if side_l in ("long", "buy", "매수") else "sell"
        plan = {
            "market": "KRX", "code": code, "side": kind, "qty": qty, "price": price,
            "paper": self.paper, "reason": reason,
            "submitted": False, "dry_run": self.dry_run,
            "tr_id": tr_id(kind, self.paper),
        }
        if self.dry_run:
            self._say(f"[모의계획] {code} {kind} {qty}주 "
                      f"{'시장가' if not price else f'{price:,}원'} — 주문은 보내지 않았습니다 ({reason})")
            return plan
        if qty is None or int(qty) <= 0:
            plan["error"] = "수량이 0 이라 보내지 않았습니다"
            return plan
        miss = self.missing()
        if miss:
            plan["error"] = "키가 없습니다: " + ", ".join(miss)
            return plan

        body = self.build_order(code=code, side=kind, qty=qty, price=price)
        j = self._post(PATH["order"],
                       headers=self._headers(kind, hashkey=self._hashkey(body)),
                       body=body)
        # rt_cd 가 '0' 이 아니면 거래소가 거부한 것 — 성공으로 세면 안 된다
        if str(j.get("rt_cd")) != "0":
            plan["error"] = f"거부됨 — {str(j.get('msg1') or '')[:140]}"
            self._say(f"[주문거부] {code} {kind} {qty}주 — {plan['error']}")
            return plan
        out = j.get("output") or {}
        plan["submitted"] = True
        plan["order_no"] = out.get("ODNO", "")
        self._say(f"[주문] {code} {kind} {qty}주 → 주문번호 {plan['order_no']} "
                  f"({'모의' if self.paper else '실계좌'})")
        return plan

    def cancel(self, *, order_no: str, qty: int = 0, org_no: str = "") -> dict:
        """주문 취소. qty=0 이면 잔량 전부."""
        plan = {"order_no": order_no, "qty": qty, "paper": self.paper,
                "submitted": False, "dry_run": self.dry_run}
        if self.dry_run:
            self._say(f"[모의계획] 주문 {order_no} 취소 — 보내지 않았습니다")
            return plan
        acct, prod = split_account(self.account)
        body = {
            "CANO": acct or "", "ACNT_PRDT_CD": prod or "",
            "KRX_FWDG_ORD_ORGNO": org_no, "ORGN_ODNO": str(order_no),
            "ORD_DVSN": "00", "RVSE_CNCL_DVSN_CD": "02",     # 02 = 취소
            "ORD_QTY": str(int(qty)), "ORD_UNPR": "0",
            "QTY_ALL_ORD_YN": "Y" if not qty else "N",
        }
        j = self._post(PATH["cancel"],
                       headers=self._headers("cancel", hashkey=self._hashkey(body)),
                       body=body)
        if str(j.get("rt_cd")) != "0":
            plan["error"] = f"거부됨 — {str(j.get('msg1') or '')[:140]}"
            return plan
        plan["submitted"] = True
        return plan

    # ── 조회 ──────────────────────────────────────────────────────────
    def balance(self) -> dict:
        """잔고·보유 종목. 조회는 dry_run 이어도 막지 않는다 — 읽기만 한다."""
        acct, prod = split_account(self.account)
        j = self._get(PATH["balance"], headers=self._headers("balance"), params={
            "CANO": acct or "", "ACNT_PRDT_CD": prod or "",
            "AFHR_FLPR_YN": "N", "OFL_YN": "", "INQR_DVSN": "02",
            "UNPR_DVSN": "01", "FUND_STTL_ICLD_YN": "N",
            "FNCG_AMT_AUTO_RDPT_YN": "N", "PRCS_DVSN": "00",
            "CTX_AREA_FK100": "", "CTX_AREA_NK100": "",
        })
        holds = []
        for r in (j.get("output1") or []):
            qty = int(float(r.get("hldg_qty") or 0))
            if qty <= 0:
                continue
            holds.append({
                "code": r.get("pdno", ""), "name": r.get("prdt_name", ""),
                "qty": qty,
                "avg": float(r.get("pchs_avg_pric") or 0),
                "price": float(r.get("prpr") or 0),
                "pl": float(r.get("evlu_pfls_amt") or 0),
            })
        summ = (j.get("output2") or [{}])[0]
        return {
            "paper": self.paper,
            "cash": float(summ.get("dnca_tot_amt") or 0),
            "value": float(summ.get("tot_evlu_amt") or 0),
            "pl": float(summ.get("evlu_pfls_smtl_amt") or 0),
            "holdings": holds,
        }

    def fills(self, *, date: str = "") -> list:
        """오늘(또는 지정일) 체결 내역."""
        acct, prod = split_account(self.account)
        d = date or time.strftime("%Y%m%d", time.gmtime(time.time() + 9 * 3600))
        j = self._get(PATH["fills"], headers=self._headers("fills"), params={
            "CANO": acct or "", "ACNT_PRDT_CD": prod or "",
            "INQR_STRT_DT": d, "INQR_END_DT": d,
            "SLL_BUY_DVSN_CD": "00", "INQR_DVSN": "00", "PDNO": "",
            "CCLD_DVSN": "01", "ORD_GNO_BRNO": "", "ODNO": "",
            "INQR_DVSN_3": "00", "INQR_DVSN_1": "",
            "CTX_AREA_FK100": "", "CTX_AREA_NK100": "",
        })
        out = []
        for r in (j.get("output1") or []):
            out.append({
                "code": r.get("pdno", ""), "name": r.get("prdt_name", ""),
                "side": r.get("sll_buy_dvsn_cd_name", ""),
                "qty": int(float(r.get("tot_ccld_qty") or 0)),
                "price": float(r.get("avg_prvs") or 0),
                "order_no": r.get("odno", ""),
            })
        return out

    def status_lines(self) -> list:
        """화면에 그대로 찍을 상태 줄. 키 값은 가린다."""
        return [
            f"  접속 예정   : {self.base_url()}  ({'모의' if self.paper else '실계좌'})",
            f"  앱키        : {mask(self.app_key)}",
            f"  앱시크릿    : {mask(self.app_secret)}",
            f"  계좌        : {mask_account(self.account)}",
            f"  주문 전송   : {'안 함 (dry-run)' if self.dry_run else '함'}",
        ]

    def _say(self, msg: str) -> None:
        if self.log:
            self.log(msg)
        else:
            print(msg)
