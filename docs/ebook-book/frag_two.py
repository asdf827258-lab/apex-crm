# -*- coding: utf-8 -*-
"""맨 앞 — 「한 장으로: 누가 무엇을 하나」.

설계사는 이 앱을 **어떻게 쓰는가**, 매니저는 이 앱으로 **어떻게 관리하는가**.
둘을 나눠서 한 판씩. 화면 이름은 전부 실제 화면에 찍힌 글자 그대로다.
표로 만들면 좁은 화면에서 잘리므로 SVG 로 직접 줄을 나눈다.
"""
import sys
sys.stdout.reconfigure(encoding="utf8")

VBW = 1180
# 칸 넷 — 언제 · 어느 화면 · 무엇을 하나 · 됐다는 뜻
C1, W1 = 18, 132
C2, W2 = C1 + W1 + 10, 268
C3, W3 = C2 + W2 + 10, 458
C4, W4 = C3 + W3 + 10, 256
HEADH, PAD = 52, 15


def tw(t, fs):
    """글자 너비 어림 — 한글은 넓고 영문·숫자는 좁다"""
    return sum((fs if ord(c) > 0x2000 else fs * 0.55) for c in t)


def wrap(t, fs, maxw):
    """띄어쓰기에서만 접는다. 한 낱말이 칸보다 길면 그냥 넘긴다."""
    out, cur = [], ""
    for w in t.split(" "):
        cand = (cur + " " + w).strip()
        if cur and tw(cand, fs) > maxw:
            out.append(cur); cur = w
        else:
            cur = cand
    if cur:
        out.append(cur)
    return out


ADV = [
 ("아침 10분", ["오늘의 알림"],
  ["화면이 <b>오늘 연락할 사람</b>을 골라 놓았습니다.",
   "위에서부터 그대로 겁니다 — 누구부터 걸지 고르지 않습니다."],
  ["목록이 비었다"]),
 ("통화 30초", ["DB 관리 → 접촉", "TA 결과 기록"],
  ["끊고 <b>30초 안에</b> 남깁니다 — 결과(부재·거절·상담) · 메모 한 줄.",
   "결과가 「상담」이면 <b>상담 약속일시</b> 칸이 열립니다. 여기가 핵심입니다."],
  ["단톡 문구가 만들어졌다"]),
 ("상담 자리", ["재무설계 상담자료", "재무설계 계산기"],
  ["계산기 왼쪽 아래 <b>「▶ 상담 순서」</b>를 켜고 다섯 단계를 끝까지 갑니다.",
   "탭은 하나만 엽니다. 여러 개 열면 고객이 따라오지 못합니다."],
  ["다음 약속 날짜를 받고 헤어졌다"]),
 ("저녁 5분", ["DB 관리", "녹음 전달"],
  ["오늘 만난 사람의 <b>단계</b>를 옮기고, 녹음을 전달합니다.",
   "장기 관리로 갈 사람은 <b>고객 365일</b>로 넘깁니다."],
  ["빨간 글씨가 하나도 없다"]),
 ("주 1회 · 월요일", ["KPI·타율 분석"],
  ["<b>내가 어느 단계에서 끊기는지</b>만 봅니다 — TA · AP · PC · CS.",
   "가장 낮은 칸 <b>하나만</b> 골라 이번 주에 그것만 고칩니다."],
  ["이번 주 고칠 것 하나가 정해졌다"]),
 ("월 1회", ["TFA 업무관리", "내 업적 · 월간보고"],
  ["목표와 실적을 적고 <b>제출</b>합니다. 업적은 월초보험료 하나로 셉니다.",
   "<b>본인 점검란</b>에서 내가 어디까지 왔는지 스스로 확인합니다."],
  ["제출했고, 다음 달 할 일을 받았다"]),
]

MGR = [
 ("아침 10분", ["통합 대시보드"],
  ["<b>진행률</b>부터 봅니다. 100%가 아니면 <b>아직 한 번도 안 건 사람</b>이 있습니다.",
   "<b>후속조치 미완료</b>는 0 으로 두는 것이 기본입니다."],
  ["진행률 100% · 미완료 0"]),
 ("매일", ["담당자·팀 통계"],
  ["누가 안 걸었는지 <b>이름으로</b> 보입니다 — 총 배정 · TA 완료 · 완료율.",
   "혼내는 자리가 아니라 <b>막힌 사람을 찾는</b> 자리입니다."],
  ["완료율 낮은 사람에게 말을 걸었다"]),
 ("매일", ["녹음 전달", "부재 이력"],
  ["<b>미전달</b>은 회사 규정 사항입니다. 그날 안에 닫습니다.",
   "<b>3차 이상 부재</b>는 방법을 바꿀 때입니다 — 시간대 · 문자 먼저."],
  ["미전달 0건"]),
 ("주 1회 · 월요일", ["KPI·타율 분석", "AI 피드백"],
  ["<b>팀이 어디서 새는지</b>를 한 칸으로 좁힙니다.",
   "TA 많고 AP 적으면 <b>넘기는 말</b>, PC 있고 CS 없으면 <b>안 여쭌 것</b>,",
   "증권이 밀리면 <b>사후관리</b>가 문제입니다."],
  ["팀에 줄 말 한 줄이 정해졌다"]),
 ("주 1회", ["TFA 업무관리", "팀원 관리 · 리더 할 일"],
  ["팀원별로 <b>코칭 한 줄</b>을 남깁니다. 받은 사람은 <b>내 코칭</b>에서 답합니다.",
   "「더 열심히」는 코칭이 아닙니다. <b>어느 단계를 어떻게</b>인지 적습니다."],
  ["팀원 전원에게 코칭이 갔다"]),
 ("월 1회", ["월간 영업보고서"],
  ["팀원 월간보고를 <b>취합</b>합니다. 안 낸 사람은 화면이 이름으로 세워 줍니다.",
   "부족한 것과 <b>다음 달 할 일</b>을 정리해 내려 줍니다."],
  ["안 낸 사람 0명"]),
]


def rich(t):
    """<b> 만 살려서 tspan 으로. 굵은 조각의 너비도 같이 센다."""
    parts, buf, bold = [], "", False
    i = 0
    while i < len(t):
        if t.startswith("<b>", i):
            if buf: parts.append((buf, bold)); buf = ""
            bold = True; i += 3
        elif t.startswith("</b>", i):
            if buf: parts.append((buf, bold)); buf = ""
            bold = False; i += 4
        else:
            buf += t[i]; i += 1
    if buf: parts.append((buf, bold))
    return parts


def line(t, x, y, cls, fs):
    segs = rich(t)
    out = [f'<text class="{cls}" x="{x}" y="{y}">']
    for s, b in segs:
        s = s.replace("&", "&amp;").replace("<", "&lt;")
        cls_b = " class=\"tw-b\"" if b else ""
        out.append(f'<tspan{cls_b}>{s}</tspan>')
    out.append("</text>")
    return "".join(out)


def row_h(r):
    _, screens, body, done = r
    n = 0
    for b in body:
        plain = b.replace("<b>", "").replace("</b>", "")
        n += len(wrap(plain, 15.5, W3 - 24))
    hs = 34 + len(screens) * 30
    hb = 30 + n * 24
    hd = 34 + sum(len(wrap(d, 14.5, W4 - 26)) for d in done) * 22
    return max(hs, hb, hd, 74)


def panel(rows, title, sub, tone):
    hs = [row_h(r) for r in rows]
    H = HEADH + sum(hs) + len(hs) * 8 + 14
    acc = "tw-a1" if tone == "adv" else "tw-a2"
    P = [f'<svg viewBox="0 0 {VBW} {H}" role="img" aria-label="{title} — {sub}">']

    # 머리 줄
    P.append(f'<rect class="tw-hd {acc}" x="{C1}" y="8" width="{VBW-36}" height="{HEADH-14}" rx="12"/>')
    P.append(f'<text class="tw-hn" x="{C1+18}" y="{HEADH-19}">{title}</text>')
    P.append(f'<text class="tw-hs" x="{C1+18+tw(title,20)+14}" y="{HEADH-19}">{sub}</text>')
    # 부제가 왼쪽 두 칸 위를 지나가므로, 딱지는 셋째 칸부터 단다
    for lbl, cx in (("무엇을 하나", C3), ("됐다는 뜻", C4)):
        P.append(f'<text class="tw-hc" x="{cx}" y="{HEADH-19}">{lbl}</text>')

    y = HEADH + 4
    for (when, screens, body, done), h in zip(rows, hs):
        P.append(f'<rect class="tw-row" x="{C1}" y="{y}" width="{VBW-36}" height="{h}" rx="11"/>')
        # ① 언제
        for i, ln in enumerate(wrap(when, 15, W1 - 16)):
            P.append(f'<text class="tw-when" x="{C1+15}" y="{y+31+i*21}">{ln}</text>')
        # ② 어느 화면 — 실제 화면 이름
        for i, s in enumerate(screens):
            wpx = tw(s, 14.5) + 22
            P.append(f'<rect class="tw-chip {acc}-c" x="{C2}" y="{y+13+i*30}" '
                     f'width="{wpx:.0f}" height="24" rx="7"/>')
            P.append(f'<text class="tw-chipt" x="{C2+11}" y="{y+30+i*30}">{s}</text>')
        # ③ 무엇을 하나
        ly = y + 30
        for b in body:
            plain = b.replace("<b>", "").replace("</b>", "")
            for ln in wrap(plain, 15.5, W3 - 24):
                # 줄바꿈된 조각에 원래 굵기를 다시 입힌다
                P.append(line(_restore(ln, b), C3, ly, "tw-b1", 15.5))
                ly += 24
        # ④ 됐다는 뜻
        dy = y + 30
        for d in done:
            for ln in wrap(d, 14.5, W4 - 26):
                P.append(f'<text class="tw-done" x="{C4+17}" y="{dy}">{ln}</text>')
                dy += 22
            P.append(f'<text class="tw-ck" x="{C4}" y="{y+30}">✓</text>')
        y += h + 8
    P.append("</svg>")
    return "\n    ".join(P)


def _restore(plain_line, original):
    """줄바꿈된 조각에 원래 <b> 를 다시 입힌다."""
    res, i = "", 0
    op = original.replace("<b>", "\x01").replace("</b>", "\x02")
    # 원문에서 이 조각이 시작하는 자리를 찾는다
    flat = op.replace("\x01", "").replace("\x02", "")
    st = flat.find(plain_line)
    if st < 0:
        return plain_line
    cnt, bold = 0, False
    for ch in op:
        if ch == "\x01": bold = True; continue
        if ch == "\x02": bold = False; continue
        if st <= cnt < st + len(plain_line):
            res += ("<b>" + ch + "</b>") if bold else ch
        cnt += 1
    return res.replace("</b><b>", "")


# ═══ 갈라지는 자리 — 어디로 가면 되는지 ════════════════════════
NEXT_A = [("#s2", "2부 단계", "지금 이 고객이 어느 칸인지"),
          ("#s6", "6부 CRM 설명서", "사진 보고 그대로 따라 하기"),
          ("#s9", "9부 사용설명서", "하루 전체를 순서대로")]
NEXT_M = [("#s5", "5부 CRM", "무엇을 보고 무엇을 묻나"),
          ("#s3", "3부 전문성", "무엇을 가르칠 것인가"),
          ("#s14", "14부 자립", "혼자 굴러가게 만드는 법")]


def keys(items, tone):
    return "\n      ".join(
        f'<a class="tw-k {tone}" href="{h}"><b>{t}</b><span>{d}</span></a>'
        for h, t, d in items)


HTML = f'''<!-- ═══ 맨 앞 · 한 장으로 누가 무엇을 하나 ═══ -->
<section class="sty" id="s-who">
  <span class="sty-tag">먼저 이 표 한 장</span>
  <h2 class="sty-h">누가 무엇을 하나</h2>
  <p class="sty-d">이 책은 <b>두 사람</b>을 위해 썼습니다.
  <b>설계사</b>는 이 앱을 <b>어떻게 쓰는지</b>, <b>매니저</b>는 이 앱으로
  <b>어떻게 관리하는지</b>. 먼저 아래 두 판만 보시죠 —
  <b>여기까지가 전부</b>고, 뒤는 한 줄씩 펼친 것입니다.</p>

  <div class="tw-lead">
    <div class="tw-l1"><b>설계사</b>라면 <span>첫 번째 판</span>만 보셔도 오늘 일이 됩니다.</div>
    <div class="tw-l2"><b>매니저</b>라면 <span>두 판 다</span> 보셔야 합니다 —
    설계사가 뭘 하는지 알아야 볼 수 있으니까요.</div>
  </div>

  <figure class="brain">
    {panel(ADV, "설계사", "이 앱을 어떻게 쓰는가 — 하루", "adv")}
    <figcaption><b>왼쪽부터 오른쪽으로 읽으시면 됩니다.</b>
    언제 · 어느 화면을 여는지 · 거기서 무엇을 하는지 · 무엇이 되면 끝난 것인지.
    파란 딱지는 <b>화면에 그대로 찍힌 이름</b>입니다.</figcaption>
  </figure>

  <div class="tw-key">
    {keys(NEXT_A, "tw-ka")}
  </div>

  <figure class="brain">
    {panel(MGR, "매니저", "이 앱으로 어떻게 관리하는가 — 하루", "mgr")}
    <figcaption><b>관리는 다그치는 일이 아니라 막힌 자리를 찾는 일입니다.</b>
    그래서 매니저가 보는 화면은 전부 <b>사람 이름과 숫자</b>로 되어 있습니다 —
    누가 안 걸었는지, 어느 단계에서 새는지.</figcaption>
  </figure>

  <div class="tw-key">
    {keys(NEXT_M, "tw-km")}
  </div>

  <p class="ms-tip"><b>한 줄로 줄이면</b> 설계사는 <b>「오늘의 알림」에서 시작해 「TA 결과 기록」으로 끝내고</b>,
  매니저는 <b>「통합 대시보드」에서 시작해 「KPI·타율 분석」으로 끝냅니다.</b>
  나머지는 이 두 줄을 지키려고 있는 것들입니다.</p>
</section>
'''

open("frag_two.html", "w", encoding="utf8").write(HTML)
print(f"누가 무엇을 하나: {len(HTML.encode()):,} bytes")
