# -*- coding: utf-8 -*-
"""맨 앞 — 「윤시현의 뇌」. 이 책의 모든 지도를 한 장으로 합친다."""
import sys
sys.stdout.reconfigure(encoding="utf8")

# (아이콘, 가지 이름, 한 줄, [잎])
LEFT = [
 ("🧭", "믿음", "안 바뀌는 여섯",
  ["상품이 아니라 순서를 판다", "기억이 아니라 기록으로", "감이 아니라 검산한 숫자로",
   "파는 게 아니라 푸는 것", "계약이 아니라 지급까지", "혼자가 아니라 넘겨줄 수 있게"]),
 ("💎", "값", "올리려는 여섯",
  ["기억 — 이백 명을 기억하는 사람", "근거 — 약관 문장으로 말한다", "숫자 — 검산한 것만 꺼낸다",
   "속도 — 5분 안에 찾아온다", "끝까지 — 지급까지 간다", "알려짐 — 찾아오게 만든다"]),
 ("🧰", "연장", "열네 칸 · 여든 화면",
  ["보험전략실 · 하루 시작 · 내 고객", "증권 분석 · 상담 도구 · 투자·경제",
   "계약·청구 · 자료 조회 · 법인 컨설팅", "콘텐츠 제작 · 광고·유입 · 조직 관리",
   "교육 자료 · 시스템"]),
 ("👥", "사람", "두 지도가 만나는 곳",
  ["내가 만든다 — 무기와 기준", "설계사가 쓴다 — 기록과 결과",
   "주고받는 자리는 언제나 CRM", "근거 · 순서 · 숫자 · 고칠 곳"]),
]
RIGHT = [
 ("🔄", "한 바퀴", "고객이 도는 여덟 걸음",
  ["① 알린다 → ② 받는다 → ③ 건다", "④ 잡는다 → ⑤ 푼다 → ⑥ 맺는다",
   "⑦ 지킨다 → ⑧ 받는다(소개)", "⑧ 의 소개가 다시 ① 이 된다", "한 바퀴 보통 석 달"]),
 ("📶", "단계", "어디까지 왔나",
  ["미접촉 → TA → AP → PC", "→ CS → 계약완료 → 증권전달 → 관리",
   "TA 많고 AP 적으면 · 넘기는 말", "PC 있고 CS 없으면 · 안 여쭌 것",
   "증권 밀리면 · 사후관리"]),
 ("📅", "날짜", "언제 움직이나",
  ["배정일 +3일 · 부재는 2~3일 뒤", "약속 전날 문자 · 제안 후 7일",
   "증권은 나오면 즉시", "7일 넘으면 알림이 올려 준다", "7일 · 90일 · 365일"]),
 ("☀️", "하루", "오늘 실제로 하는 일",
  ["아침 10분 — 약속과 걸 사람", "통화 30초 — 결과 · 메모 · 약속",
   "저녁 5분 — 알림 0건 · 빨간 글씨", "월요일 5분 — 타율 셋"]),
]

BW, GAP, TOP = 288, 54, 34
LX, RX = 26, 866
VBW = 1180
HX, HW, HH = 372, 436, 214


def box_h(n):
    """잎 개수에 맞춰 칸 높이를 잡는다 — 아래가 비지 않게"""
    return 60 + n * 26 + 18


def stack(items):
    """[(높이, y)] 와 기둥 전체 높이"""
    hs = [box_h(len(it[3])) for it in items]
    total = sum(hs) + GAP * (len(hs) - 1)
    return hs, total


_lh, _lt = stack(LEFT)
_rh, _rt = stack(RIGHT)
CONTENT = max(_lt, _rt)
VBH = TOP + CONTENT + 34
HCY = TOP + CONTENT / 2


def branch(ic, name, one, leaves, x, y, side, h):
    tone = "bn-l" if side == "L" else "bn-r"
    L = [f'      <rect class="bn-box {tone}" x="{x}" y="{y}" width="{BW}" height="{h}" rx="18"/>']
    tx = x + 22
    L.append(f'      <text x="{tx}" y="{y+40}" style="font-size:23px">{ic}</text>')
    L.append(f'      <text class="bn-t" x="{tx+38}" y="{y+39}">{name}</text>')
    L.append(f'      <text class="bn-o {tone}-o" x="{tx+38+len(name)*24+12}" y="{y+39}">{one}</text>')
    for i, lf in enumerate(leaves):
        L.append(f'      <circle class="bn-d {tone}-d" cx="{tx+6}" cy="{y+70+i*26-5}" r="3.2"/>')
        L.append(f'      <text class="bn-l2" x="{tx+18}" y="{y+70+i*26}">{lf}</text>')
    return "\n".join(L)


def build():
    def ys_of(hs, total):
        y0 = TOP + (CONTENT - total) / 2
        out, y = [], y0
        for h in hs:
            out.append(y); y += h + GAP
        return out

    lys, rys = ys_of(_lh, _lt), ys_of(_rh, _rt)
    P = [f'    <svg viewBox="0 0 {VBW} {VBH}" role="img" '
         f'aria-label="이 책 전부를 한 장에 — 믿음 값 연장 사람, 그리고 한 바퀴 단계 날짜 하루">']

    # 줄기 — 허브에서 여덟 가지로
    for y, h in zip(lys, _lh):
        cy = y + h / 2
        P.append(f'      <path class="bn-s bn-s-l" d="M{HX} {HCY:.0f} '
                 f'C {HX-56} {HCY:.0f}, {LX+BW+56} {cy:.0f}, {LX+BW} {cy:.0f}"/>')
    for y, h in zip(rys, _rh):
        cy = y + h / 2
        P.append(f'      <path class="bn-s bn-s-r" d="M{HX+HW} {HCY:.0f} '
                 f'C {HX+HW+56} {HCY:.0f}, {RX-56} {cy:.0f}, {RX} {cy:.0f}"/>')

    for (ic, nm, one, lv), y, h in zip(LEFT, lys, _lh):
        P.append(branch(ic, nm, one, lv, LX, y, "L", h))
    for (ic, nm, one, lv), y, h in zip(RIGHT, rys, _rh):
        P.append(branch(ic, nm, one, lv, RX, y, "R", h))

    # 가운데 — 뇌
    hy = HCY - HH / 2
    P.append(f'      <rect class="bn-hub" x="{HX}" y="{hy:.0f}" width="{HW}" height="{HH}" rx="30"/>')
    cx = HX + HW / 2
    P.append(f'      <text class="bn-hk" x="{cx:.0f}" y="{hy+50:.0f}" text-anchor="middle">APEX YUN PRO</text>')
    P.append(f'      <text class="bn-hn" x="{cx:.0f}" y="{hy+104:.0f}" text-anchor="middle">윤시현의 뇌</text>')
    P.append(f'      <text class="bn-hs" x="{cx:.0f}" y="{hy+142:.0f}" text-anchor="middle">'
             f'설계사의 값을 올린다</text>')
    P.append(f'      <text class="bn-hs2" x="{cx:.0f}" y="{hy+176:.0f}" text-anchor="middle">'
             f'왼쪽은 내 안에서 나온 것 · 오른쪽은 고객에게서 일어나는 일</text>')
    P.append('    </svg>')
    return "\n".join(P)


HTML = f'''<!-- ═══ 맨 앞 · 한 장 지도 ═══ -->
<section class="sty" id="s-brain">
  <span class="sty-tag">한 장으로 보는 전부</span>
  <h2 class="sty-h">윤시현의 뇌</h2>
  <p class="sty-d">이 책에 나오는 지도를 <b>전부 하나로 합친 것</b>입니다.
  제가 이 일을 어떤 순서로 생각하는지, 그 생각이 어느 화면으로 만들어졌는지가 여기 다 들어 있어요.
  뒤에 나오는 장들은 이 그림의 <b>가지 하나씩을 펼친 것</b>이라고 보시면 됩니다.</p>

  <figure class="brain">
{build()}
    <figcaption><b>읽는 법</b> — 가운데에서 시작해서 아무 가지나 따라가시면 됩니다.
    <b>왼쪽 넷</b>은 제가 믿는 것과 그래서 만든 것,
    <b>오른쪽 넷</b>은 고객에게 실제로 일어나는 일입니다.
    왼쪽이 오른쪽을 만들고, 오른쪽이 다시 왼쪽을 고칩니다.</figcaption>
  </figure>

  <div class="bn-key">
    <a class="bn-kk" href="#s1"><b>믿음 · 값</b><span>1부 한 장으로</span></a>
    <a class="bn-kk" href="#s2"><b>단계 · 날짜</b><span>2부 단계</span></a>
    <a class="bn-kk" href="#s4"><b>연장 열네 칸</b><span>4부 마인드맵</span></a>
    <a class="bn-kk" href="#s1"><b>한 바퀴 여덟</b><span>1부 여덟 단계</span></a>
    <a class="bn-kk" href="#s1"><b>사람 · 두 지도</b><span>1부 두 사람의 지도</span></a>
    <a class="bn-kk" href="#s6"><b>하루</b><span>6부 CRM 설명서</span></a>
  </div>

  <p class="ms-tip"><b>딱 하나만 가져가신다면</b> 왼쪽 맨 위 <b>「믿음」</b>입니다.
  나머지 일곱 가지는 저 여섯 줄을 지키려고 만든 것들이거든요.
  도구는 바뀌어도 저 여섯은 안 바뀝니다.</p>
</section>
'''

open("frag_brain.html", "w", encoding="utf8").write(HTML)
print(f"윤시현의 뇌: {len(HTML.encode()):,} bytes · viewBox {VBW}×{VBH}")
