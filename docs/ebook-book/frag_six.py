# -*- coding: utf-8 -*-
"""영업프로세스 여섯 칸 — 한 칸에 한 장씩, 잘리지 않는 그림으로."""
import sys
sys.stdout.reconfigure(encoding="utf8")

VBW, LX, LW, RX = 1180, 20, 250, 292
RW = 1160 - RX


def tw(t, fs):
    """글자 너비 어림 — 한글은 넓고 영문·숫자는 좁다"""
    return sum((fs if ord(c) > 0x2000 else fs * 0.55) for c in t)


CARDS = [
 dict(no="1", nm="유입", sub="만나기 전",
   goal=["아는 사람이 떨어져도", "안 막히게 —", "사람이 계속 들어오는", "길을 만든다"],
   hum=["아는 사람 명단을 머리로 떠올린다",
        "명단이 떨어지면 그때부터 막힌다",
        "「소개 좀 해 주세요」를 부탁하게 된다"],
   ax=["콘텐츠로 찾아오게 만든다 — 주 2회, 고객이 검색하는 질문에 답한다",
       "광고를 돌린다면 문구와 예산을 화면에서 먼저 확인한다",
       "들어온 리드·지인소개는 그날 CRM 에 올린다 — 다섯 칸이면 끝",
       "이달의 컨셉을 하나 정한다 — 신상품과 약관 근거로"],
   tools=["블로그", "Threads", "인스타그램", "콘텐츠 캘린더", "메타 광고 가이드",
          "디지털 명함", "미끼 레이더"],
   done=["CRM 에 이름과 배정일이 올라갔다"],
   stuck=["「글 보고 연락드렸어요」가 한 달에 한 번도 없다면",
          "올리는 주기가 아니라 주제가 문제입니다"]),

 dict(no="2", nm="접촉", sub="TA · 전화",
   goal=["전화로 만날 약속까지.", "「관심 있대요」가 아니라", "달력에 날짜가", "들어가야 끝난다"],
   hum=["뭐라고 열지 매번 새로 생각한다",
        "거절이 나오면 그 자리에서 더 설득한다",
        "부재면 같은 시간에 또 건다"],
   ax=["DB 종류 열여덟 가지별 대본이 통화 창에 같이 뜬다",
       "여는 말 여섯 중 하나만 골라 읽는다 — 정중·공감·혜택·질문·회소성·소개기반",
       "거절 열일곱 개에는 답과 「이렇게 말하지 말 것」이 같이 있다",
       "부재는 시간대를 바꿔 2~3일 뒤 — 오전 10~11시 ↔ 저녁 7~8시",
       "끊고 30초 안에 결과 · 메모 · 약속 날짜를 남긴다"],
   tools=["DB 통합 CRM", "TA 맞춤 스크립트", "오늘의 알림", "AI 상담 어시스턴트"],
   done=["상담 약속 칸에 날짜와 시간이 들어갔다"],
   stuck=["부재가 많으면 시간대를,",
          "거절이 많으면 여는 말이 길거나 파는 말입니다"]),

 dict(no="3", nm="면담", sub="AP · 만남",
   goal=["고객이 자기 걱정을", "입으로 말하게 한다.", "내가 많이 말한 날은", "안 끝난 것이다"],
   hum=["상품 자료부터 꺼낸다",
        "내가 더 많이 말한다",
        "들은 것은 머리에만 남고 다음에 또 묻는다"],
   ax=["팩트파인딩 다섯 칸을 고객과 같이 채운다 — 소득·가족·보장·걱정·우선순위",
       "화면을 고객 쪽으로 돌려 놓는다. 내 화면이 아니라 같이 보는 화면",
       "「강점부터 말씀드리겠습니다」로 연다 — 공백부터 말하면 불안을 파는 사람",
       "적은 것은 단추 없이 계산기로 넘어간다 — 같은 걸 두 번 묻지 않는다",
       "「가장 먼저 듣고 싶은 것」 하나를 고객이 고르게 한다"],
   tools=["상담카드·팩트파인딩", "고객 365일", "재무설계 상담자료", "니즈 시뮬레이터"],
   done=["고객이 걱정을 말했고, 그중 하나가 정해졌다"],
   stuck=["TA 는 많은데 AP 가 안 늘면",
          "만나자는 말을 안 하고 있는 겁니다"]),

 dict(no="4", nm="설계", sub="PC · 제안",
   goal=["「얼마가 비었는지」를", "고객이 먼저 보게 한다.", "상품 이름을 외우게", "하는 자리가 아니다"],
   hum=["「대충 이 정도 나옵니다」로 말한다",
        "자료를 다섯 개 준비해 가서 하나도 안 남는다",
        "좋은 회사라고 말하지만 왜인지는 설명이 길어진다"],
   ax=["연금은 254 시나리오를 엑셀과 대조한 엔진이 계산한다",
       "보장 근거는 약관 원문 문장으로, 그 쪽까지 그림으로 떠서 보여 준다",
       "고객이 말한 걱정 하나에만 자료를 붙인다 — 다섯 개 들고 가면 하나도 안 남는다",
       "발표는 우하단 ▶ 에서 트랙을 골라 연다 — 탭을 뒤적이지 않는다",
       "못 찾은 칸은 0 이 아니라 빈 칸으로 둔다 — 0 은 「없다」로 읽힌다"],
   tools=["AI 보장분석", "8통장 진단지도", "재무설계 계산기", "치료비 지급지도", "비포&애프터"],
   done=["고객이 「얼마가 비었는지」에 끄덕였다"],
   stuck=["PC 는 하는데 CS 가 없으면",
          "보여 주고 나서 안 여쭌 겁니다"]),

 dict(no="5", nm="체결", sub="CS · 청약",
   goal=["미루지 않게", "결정을 여쭙는다.", "「생각해 볼게요」는", "아직 안 여쭌 것이다"],
   hum=["분위기를 보다가 못 여쭙고 나온다",
        "선택지를 하나만 들고 가서 예 / 아니오가 된다",
        "알릴의무를 나중에 확인한다"],
   ax=["선택지를 A · B · C 두세 개로 줄여 간다",
       "「어느 쪽이 편하실까요」로 여쭙는다 — 「하시겠어요?」보다 결정이 쉽다",
       "미루는 이유를 질문으로 확인한다 — 「어떤 부분이 걸리세요?」",
       "설명의무 문구를 금소법 AI 로 한 번 확인하고 들어간다",
       "알릴의무를 여기서 거른다 — 나중에 나오면 계약이 흔들린다"],
   tools=["제안서 비교", "제안서 카톡설명", "금소법 AI", "알릴의무 필터"],
   done=["청약서에 이름이 들어갔다"],
   stuck=["자꾸 미뤄지면 선택지가",
          "너무 많거나 하나뿐입니다"]),

 dict(no="6", nm="관리", sub="증권 · 청구 · 소개",
   goal=["계약이 아니라", "지급까지 간다.", "여기가 소개가", "시작되는 자리다"],
   hum=["계약하고 연락이 끊긴다",
        "증권 전달이 밀린다",
        "「소개 좀」을 부탁하게 된다"],
   ax=["증권은 나오면 즉시 전달한다 — 미전달은 목록에 빨갛게 남는다",
       "7일 넘게 안 닿은 고객을 화면이 매일 골라 올린다",
       "청구를 대신 해 드린다 — 「소개해 주실 분」이 아니라 「청구 도와드릴게요」",
       "1개월 안부 → 분기 1회 → 생일 · 갱신일",
       "새로 온 소개는 미접촉으로 다시 등록한다 — 여기서 한 바퀴가 새로 돈다"],
   tools=["오늘의 알림", "고객 365일", "청구·사후관리", "AI 실비계산기", "배서 안내서"],
   done=["증권을 전달했고, 소개가 왔다"],
   stuck=["계약은 되는데 소개가 없으면",
          "증권 전달과 청구에서 멈춰 있습니다"]),
]


def chips(items, x, y, maxw):
    """칩을 줄바꿈해 배치하고 (svg, 줄 수) 를 돌려준다"""
    out, cx, cy, rows = [], x, y, 1
    for t in items:
        w = tw(t, 15) + 30
        if cx + w > x + maxw:
            cx, cy, rows = x, cy + 40, rows + 1
        out.append(f'      <rect class="sx-chip" x="{cx:.0f}" y="{cy}" width="{w:.0f}" height="32" rx="10"/>')
        out.append(f'      <text class="sx-chipt" x="{cx+w/2:.0f}" y="{cy+21}" text-anchor="middle">{t}</text>')
        cx += w + 9
    return "\n".join(out), rows


def card(c):
    H_HUM = 34 + len(c["hum"]) * 27 + 14
    H_AX = 36 + len(c["ax"]) * 30 + 16
    _, crow = chips(c["tools"], RX + 18, 0, RW - 36)
    H_TL = 34 + crow * 40 + 6
    H_END = 34 + max(len(c["done"]), len(c["stuck"])) * 25 + 16
    PAD, GAPY = 20, 12
    y1 = PAD
    y2 = y1 + H_HUM + GAPY
    y3 = y2 + H_AX + GAPY
    y4 = y3 + H_TL + GAPY
    VBH = y4 + H_END + PAD
    LH = VBH - PAD * 2

    P = [f'    <svg viewBox="0 0 {VBW} {VBH}" role="img" '
         f'aria-label="{c["no"]}번 칸 {c["nm"]} — 목표와 APEX 접근, 쓰는 화면, 끝났다는 뜻">']

    # 왼쪽 검은 머리
    P.append(f'      <rect class="sx-hd" x="{LX}" y="{PAD}" width="{LW}" height="{LH}" rx="18"/>')
    P.append(f'      <text class="sx-no" x="{LX+24}" y="{PAD+42}">{c["no"]}</text>')
    P.append(f'      <text class="sx-nm" x="{LX+24}" y="{PAD+88}">{c["nm"]}</text>')
    P.append(f'      <text class="sx-sb" x="{LX+24}" y="{PAD+116}">{c["sub"]}</text>')
    P.append(f'      <line class="sx-sep" x1="{LX+24}" y1="{PAD+142}" x2="{LX+LW-24}" y2="{PAD+142}"/>')
    P.append(f'      <text class="sx-gk" x="{LX+24}" y="{PAD+172}">이 칸의 목표</text>')
    for i, ln in enumerate(c["goal"]):
        P.append(f'      <text class="sx-gv" x="{LX+24}" y="{PAD+202+i*27}">{ln}</text>')

    # 보통 이렇게들
    P.append(f'      <rect class="sx-hum" x="{RX}" y="{y1}" width="{RW}" height="{H_HUM}" rx="14"/>')
    P.append(f'      <text class="sx-k sx-kh" x="{RX+18}" y="{y1+26}">보통 이렇게들 하십니다</text>')
    for i, ln in enumerate(c["hum"]):
        P.append(f'      <text class="sx-hut" x="{RX+18}" y="{y1+56+i*27}">· {ln}</text>')

    # APEX 는 이렇게
    P.append(f'      <rect class="sx-ax" x="{RX}" y="{y2}" width="{RW}" height="{H_AX}" rx="14"/>')
    P.append(f'      <text class="sx-k sx-ka" x="{RX+18}" y="{y2+28}">APEX 는 이렇게 합니다</text>')
    for i, ln in enumerate(c["ax"]):
        P.append(f'      <circle class="sx-dot" cx="{RX+24}" cy="{y2+54+i*30-5}" r="3.4"/>')
        P.append(f'      <text class="sx-axt" x="{RX+38}" y="{y2+54+i*30}">{ln}</text>')

    # 쓰는 화면
    P.append(f'      <rect class="sx-tl" x="{RX}" y="{y3}" width="{RW}" height="{H_TL}" rx="14"/>')
    P.append(f'      <text class="sx-k sx-kt" x="{RX+18}" y="{y3+26}">쓰는 화면</text>')
    ch, _ = chips(c["tools"], RX + 18, y3 + 38, RW - 36)
    P.append(ch)

    # 끝났다는 뜻 / 막히면
    half = (RW - 12) / 2
    P.append(f'      <rect class="sx-ok" x="{RX}" y="{y4}" width="{half:.0f}" height="{H_END}" rx="14"/>')
    P.append(f'      <text class="sx-k sx-ko" x="{RX+18}" y="{y4+26}">이 칸이 끝났다는 뜻</text>')
    for i, ln in enumerate(c["done"]):
        P.append(f'      <text class="sx-okt" x="{RX+18}" y="{y4+54+i*25}">{ln}</text>')
    x5 = RX + half + 12
    P.append(f'      <rect class="sx-no2" x="{x5:.0f}" y="{y4}" width="{half:.0f}" height="{H_END}" rx="14"/>')
    P.append(f'      <text class="sx-k sx-kn" x="{x5+18:.0f}" y="{y4+26}">막히면 여기를 의심</text>')
    for i, ln in enumerate(c["stuck"]):
        P.append(f'      <text class="sx-not" x="{x5+18:.0f}" y="{y4+54+i*25}">{ln}</text>')

    P.append('    </svg>')
    return "\n".join(P)


FIGS = "\n".join(
    f'  <figure class="brain sx-fig">\n{card(c)}\n'
    f'    <figcaption><b>{c["no"]}. {c["nm"]}</b> — {c["sub"]}</figcaption>\n  </figure>'
    for c in CARDS)

HTML = f'''  <h3>여섯 칸을 처음부터 끝까지</h3>
  <p>
    어렵게 볼 것 없습니다. <b>고객 한 사람이 여섯 칸을 차례로 지나간다</b>고 생각하시면 돼요.
    칸마다 <b>할 일은 딱 하나씩</b>이고, 그 하나가 끝나면 다음 칸으로 넘어갑니다.
  </p>
  <div class="sx-strip">
    <span>① 알린다</span><i>→</i><span>② 전화한다</span><i>→</i><span>③ 만난다</span>
    <i>→</i><span>④ 보여 준다</span><i>→</i><span>⑤ 여쭙는다</span><i>→</i><span>⑥ 지킨다</span>
  </div>
  <p>
    아래에 <b>한 칸에 한 장씩</b> 펼쳐 두었습니다. 각 장은 늘 같은 순서예요 —
    <b>이 칸의 목표</b>(왼쪽 검은 칸) → <b>보통 이렇게들 하십니다</b> →
    <b>APEX 는 이렇게 합니다</b> → <b>쓰는 화면</b> → <b>끝났다는 뜻과 막히는 자리.</b>
    지금 막힌 칸 한 장만 보셔도 됩니다.
  </p>

{FIGS}

  <p class="ms-tip"><b>여섯 장을 한 번에 다 하려고 하지 마시고요</b>
  이번 달은 <b>한 칸만</b> 골라 보시죠. 대부분 ②번 아니면 ⑥번에서 막히십니다 —
  전화를 안 걸고 있거나, 계약 뒤에 연락이 끊기거나.
  둘 중 하나만 고쳐도 그 달 숫자가 달라집니다.</p>
'''

open("frag_six.html", "w", encoding="utf8").write(HTML)
print(f"여섯 칸 상세: {len(HTML.encode()):,} bytes · 카드 {len(CARDS)}장")
