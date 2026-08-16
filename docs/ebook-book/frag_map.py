# -*- coding: utf-8 -*-
"""14갈래 로고 지도 SVG 생성 — 기존 .rm-* 클래스와 토큰을 그대로 쓴다."""

LEFT = [
    ("cap0",  "🎣", "보험전략실",  "근거를 쥐는 힘",     1),
    ("cap1",  "🧭", "하루 시작",   "준비하는 힘",        5),
    ("cap2",  "🗂️", "내 고객",     "기억하는 힘",        3),
    ("cap3",  "📑", "증권 분석",   "읽어내는 힘",        8),
    ("cap4",  "🗣️", "상담 도구",   "흐르게 하는 힘",     9),
    ("cap5",  "📈", "투자·경제",   "넓게 보는 힘",       4),
    ("cap6",  "🧾", "계약·청구",   "끝까지 가는 힘",     6),
]
RIGHT = [
    ("cap7",  "🔍", "자료 조회",   "찾아내는 힘",        6),
    ("cap8",  "🏦", "법인 컨설팅", "큰 판으로 가는 힘",  6),
    ("cap9",  "📰", "콘텐츠 제작", "먼저 알리는 힘",     7),
    ("cap10", "🎯", "광고·유입",   "만들어 내는 힘",     8),
    ("cap11", "🏢", "조직 관리",   "넘겨주는 힘",        9),
    ("cap12", "📘", "교육 자료",   "가르치는 힘",        3),
    ("cap13", "⚙️", "시스템",      "서 있게 하는 힘",    5),
]

CONN = [101 + 104 * i for i in range(7)]      # 7행
HUB_Y = CONN[3]                                # 가운데 행과 같은 높이 = 413
BOX_H, BOX_W, RX = 78, 284, 16
VB_W, VB_H = 940, 800


def build():
    L = []
    L.append('<div class="rmap">')
    L.append('    <svg viewBox="0 0 %d %d" role="img" '
             'aria-label="APEX 로고에서 열네 갈래로 펼쳐지는 왼쪽 메뉴 지도">' % (VB_W, VB_H))

    # 연결선 — 허브에서 각 행으로
    for y in CONN:
        L.append('      <path class="rm-line" d="M352 %d C 318 %d, 322 %d, 290 %d"/>' % (HUB_Y, HUB_Y, y, y))
        L.append('      <path class="rm-line" d="M588 %d C 622 %d, 618 %d, 650 %d"/>' % (HUB_Y, HUB_Y, y, y))

    # 왼쪽 일곱 칸 — 오른쪽 정렬
    for (aid, ic, name, power, n), cy in zip(LEFT, CONN):
        by = cy - 39
        L.append('      <a class="rm-g" href="#%s">' % aid)
        L.append('        <rect class="rm-box" x="6" y="%d" width="%d" height="%d" rx="%d"/>' % (by, BOX_W, BOX_H, RX))
        L.append('        <text x="26" y="%d" style="font-size:24px">%s</text>' % (by + 47, ic))
        L.append('        <text class="rm-t" x="272" y="%d" text-anchor="end">%s</text>' % (by + 35, name))
        L.append('        <text class="rm-s" x="272" y="%d" text-anchor="end">%s '
                 '<tspan class="rm-c">· 화면 %d</tspan></text>' % (by + 59, power, n))
        L.append('      </a>')

    # 오른쪽 일곱 칸 — 왼쪽 정렬
    for (aid, ic, name, power, n), cy in zip(RIGHT, CONN):
        by = cy - 39
        L.append('      <a class="rm-g" href="#%s">' % aid)
        L.append('        <rect class="rm-box" x="650" y="%d" width="%d" height="%d" rx="%d"/>' % (by, BOX_W, BOX_H, RX))
        L.append('        <text x="672" y="%d" style="font-size:24px">%s</text>' % (by + 47, ic))
        L.append('        <text class="rm-t" x="704" y="%d" text-anchor="start">%s</text>' % (by + 35, name))
        L.append('        <text class="rm-s" x="704" y="%d" text-anchor="start">%s '
                 '<tspan class="rm-c">· 화면 %d</tspan></text>' % (by + 59, power, n))
        L.append('      </a>')

    # 가운데 APEX 마크 — 원래 좌표에서 허브 이동분(+52)만큼 내린다
    dy = HUB_Y - 361
    L.append('      <circle class="rm-hub" cx="470" cy="%d" r="118"/>' % HUB_Y)
    L.append('      <g fill="#F0F4F8" transform="translate(274.0,%.1f) scale(0.3096)">'
             '<path d="M632 268 L872 668 L772 668 L632 448 L534 668 L394 668 Z"/>'
             '<path d="M639 495 L674 657 L556 657 Z"/></g>' % (186.1 + dy))
    L.append('      <g fill="none" stroke="#8FA0B4" stroke-width="17" stroke-linejoin="miter" '
             'transform="translate(384.5,%.1f) scale(0.1333)">'
             '<path d="M236 878 L312 730 L388 878"/>'
             '<path d="M456 878 L456 731 L548 731 A36 36 0 0 1 548 803 L456 803"/>'
             '<path d="M700 731 L700 878 M700 731 L822 731 M700 805 L800 805 M700 878 L822 878"/>'
             '<path d="M890 731 L1046 878 M1046 731 L890 878"/></g>' % (305.8 + dy))
    L.append('    </svg>')
    L.append('  </div>')
    return "\n".join(L)


if __name__ == "__main__":
    import io, sys
    sys.stdout.reconfigure(encoding="utf-8")
    out = build()
    open("frag_map.html", "w", encoding="utf8").write(out)
    print(out[:900])
    print("...")
    print("bytes:", len(out.encode()))
