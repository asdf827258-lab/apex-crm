# -*- coding: utf-8 -*-
"""4차 — 두 사람의 지도를 1부에 넣고, 새로 찍은 앱 화면 사진을 제자리에 박는다."""
import base64, re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:70]!r}"
    S = S.replace(old, new)
    LOG.append(f"  ✓ {tag}")


def uri(name):
    b = base64.b64encode(open(f"web/{name}.webp", "rb").read()).decode()
    return f"data:image/webp;base64,{b}"


def pinned(name, alt, cap, pins, steps, note=None, warn=None):
    dots = "".join(f'<span class="pin" style="left:{l}%;top:{t}%" aria-hidden="true">{i}</span>'
                   for i, (l, t) in enumerate(pins, 1))
    out = [f'<figure class="pw"><div class="pw-i"><img alt="{alt}" src="{uri(name)}">{dots}</div>',
           f'<figcaption>{cap}</figcaption></figure>',
           '<div class="ms-do"><p class="ms-h">번호대로 보십시오</p><ol>']
    out += [f'<li>{s}</li>' for s in steps]
    out.append('</ol></div>')
    if note: out.append(f'<div class="ms-tip">{note}</div>')
    if warn: out.append(f'<div class="ms-warn">{warn}</div>')
    return "\n".join(out)


# ═══ 1. 두 사람의 지도 — 1부, 여덟 단계 뒤 ═══════════════════════
maps = open("frag_maps.html", encoding="utf8").read().rstrip()
sub1('  <h3>홍보는 이 리듬으로 — 주 3회면 충분합니다</h3>',
     maps + '\n\n  <h3>홍보는 이 리듬으로 — 주 3회면 충분합니다</h3>',
     "두 사람의 지도")


# ═══ 2. 8부 02 · 왼쪽 메뉴 — 오래된 사진을 새 사진으로 ══════════
old_menu = re.search(
    r'<figure class="sc"><img alt="왼쪽 메뉴 — 하루 동선대로 열네 칸 \(그림은 이전 판\)" src="data:image/[a-z]+;base64,[^"]+">'
    r'<figcaption>.*?</figcaption></figure>', S, re.S)
assert old_menu, "옛 메뉴 그림을 못 찾음"
sub1(old_menu.group(0),
     f'<figure class="sc" style="max-width:340px;margin-left:auto;margin-right:auto">'
     f'<img alt="왼쪽 메뉴 — 열네 칸을 접어 놓은 모습" src="{uri("app-menu-fold")}">'
     f'<figcaption>왼쪽 메뉴 — <b>하루 동선대로 열네 칸.</b> 맨 위가 「보험전략실」이고 '
     f'맨 아래가 「시스템」입니다. 칸 오른쪽 숫자가 그 안의 화면 수입니다 '
     f'(직급·요금제에 따라 안 보이는 화면이 있어 숫자가 다를 수 있습니다)</figcaption></figure>',
     "8부 02 메뉴 사진 교체")

sub1('<p>화면이 예순 개가 넘지만 <b>칸은 열네 개</b>입니다. 위에서 아래로 <b>아침에 여는 것 → 거의 안 보는 것</b> 순서입니다.</p>',
     '<p>화면이 여든 개지만 <b>칸은 열네 개</b>입니다. 위에서 아래로 <b>아침에 여는 것 → 거의 안 보는 것</b> 순서입니다. '
     '<b>「모두 접기」를 눌러 이 모습으로 두는 것</b>을 권합니다 — 열네 줄이 한눈에 들어옵니다.</p>',
     "8부 02 본문")


# ═══ 3. 6부 미끼 레이더 — 실제 화면 두 장 ═══════════════════════
mikki = pinned(
    "app-mikki", "미끼 레이더 첫 화면 — 다섯 묶음 탭과 하루 30분 루틴",
    "미끼 레이더를 열면 나오는 첫 화면 — <b>오늘 할 일 셋</b>이 이미 적혀 있습니다",
    [(16.0, 9.5), (28.0, 9.5), (42.0, 9.5), (56.0, 9.5), (66.0, 9.5), (33.0, 34.0), (18.0, 82.0)],
    ["<b>🚀 오늘</b> — 지금 보고 있는 자리. 하루 30분 루틴과 이번 달 요약.",
     "<b>📡 신상품</b> — 뭐가 나왔나 · 어떤 각도로 갈까.",
     "<b>📜 약관</b> — 약관 쌓고 · 판정하고 · 회사별로 줄 세우기. <b>여기가 이 도구의 심장</b>입니다.",
     "<b>📖 고객</b> — 보여 줄 자료 · 미끼 설계 · 접촉 문자.",
     "<b>📘 사용법</b> — 쓰는 법과 <b>지켜야 할 선</b>. 처음이면 여기부터 읽으십시오.",
     "<b>하루 30분이 전부입니다</b> — 뉴스 훑기 5분 · 신상품 1건 공부 10분 · 고객 3명 접촉 15분. "
     "「공부한 걸로 문자 3통, 답이 오면 그날은 성공」이 이 도구가 잡으려는 습관입니다.",
     "<b>오늘 것 찾기</b> — 새 자료를 불러올 때만 누릅니다. 매일 누를 필요 없습니다."],
    note="<b>비어 있는 것이 정상입니다</b> 화면이 「공부할 뉴스가 없습니다」라고 말하는 것은 고장이 아니라 "
         "<b>아직 자료를 안 넣은 것</b>입니다. 약관과 뉴스를 넣기 전까지는 이 도구가 할 말이 없습니다.")

lock = (f'<figure class="pw" style="max-width:430px"><div class="pw-i">'
        f'<img alt="미끼 레이더 첫 실행 — 암호를 정하는 화면" src="{uri("app-mikki-lock")}"></div>'
        f'<figcaption>처음 열면 암호를 정하라고 나옵니다. 화면이 스스로 <b>「이 잠금은 옆 사람이 '
        f'무심코 여는 것을 막는 용도」</b>라고 적어 둡니다 — 보안이 아니라는 뜻입니다.</figcaption></figure>')

sub1('  <h3>다섯 묶음 열세 화면</h3>',
     '  <h3>열면 이렇게 생겼습니다</h3>\n' + lock + '\n' + mikki + '\n\n  <h3>다섯 묶음 열세 화면</h3>',
     "6부 미끼 레이더 사진")


# ═══ 4. 8부 13단계 · 계산기 — 발표 트랙과 물가상승률 ════════════
fin = pinned(
    "app-finance", "재무설계 계산기 — 왼쪽 사이드바와 종합보고서 메뉴, 오른쪽 아래 발표 단추",
    "재무설계 계산기 — 왼쪽에 <b>고객 값</b>, 오른쪽에 <b>보고서</b>, 아래에 <b>발표</b>",
    [(12.5, 11.0), (12.5, 25.0), (12.5, 73.0), (40.0, 10.5), (56.0, 17.5), (91.5, 95.0), (66.0, 41.0)],
    ["<b>물가상승률이 맨 위 고정칸</b>입니다. 은퇴 목표액 · 교육자금 · 부동산 · 투자 발표자료가 "
     "전부 이 숫자로 계산됩니다. <b>보여 주되 겁주는 데 쓰지 마십시오.</b>",
     "<b>고객 기본 정보</b> — 팩트파인딩에 적은 것이 <b>단추 없이</b> 여기로 넘어옵니다.",
     "<b>연 총급여</b> — 월소득이 ×12 되어 담깁니다. 월 620 이면 <b>7,440</b>. "
     "여기서 고친 값은 다시 덮이지 않습니다.",
     "<b>종합보고서 메뉴</b> — 팩트파인딩부터 상속·증여까지 열세 장. <b>전부 하지 않습니다.</b> 고객이 고른 것만.",
     "<b>교육자금 · 투자 컨설팅 · 상속·증여</b> — 「애들 학비가 걱정」, 「목돈을 굴리고 싶다」가 나오면 여는 자리.",
     "<b>▶ 발표 — 트랙 골라 열기.</b> 누르면 네 트랙(₩연금 · $달러 · 📈투자·세금 · 🎓교육자금)이 펼쳐집니다. "
     "<b>탭을 옮기지 않아도</b> 고른 트랙으로 바로 열립니다.",
     "<b>현금흐름 구조와 건전성 점수</b> — 상품 이야기 전에 <b>이 그림부터</b> 보여 줍니다. "
     "적자가 빨갛게 뜨면 고객이 먼저 묻습니다."],
    warn="<b>순서를 지키십시오</b> 왼쪽을 채우기 전에 오른쪽 보고서를 열면 <b>0 이 가득한 화면</b>이 나옵니다. "
         "고객 앞에서 0 을 보여 주면 그날 상담은 거기서 끝납니다.")

sub1('<div class="ms-tip"><b>발표할 때</b> 우하단 <b>▶</b> 를 누르면',
     fin + '\n<div class="ms-tip"><b>발표할 때</b> 우하단 <b>▶</b> 를 누르면',
     "8부 13단계 계산기 사진")


# ═══ 5. 8부 11단계 · 상담자료 — 계산기와 나눠 쓰기 ══════════════
deck = (f'<figure class="sc"><img alt="재무설계 상담자료 — 60분 흐름과 계산기와 나눠 쓰기" '
        f'src="{uri("app-fpdeck")}">'
        f'<figcaption>재무설계 상담자료 — <b>60분 흐름</b>이 화면에 적혀 있습니다. '
        f'아래 <b>「계산기와 나눠 쓰기 — 같은 숫자를 두 번 치지 않습니다」</b>가 '
        f'단추 없이 넘어가는 그 자리입니다</figcaption></figure>')
sub1('<div class="ms-tip"><b>요령</b> 화면을 <b>고객 쪽으로 돌려</b> 놓고 채우십시오.',
     deck + '\n<div class="ms-tip"><b>요령</b> 화면을 <b>고객 쪽으로 돌려</b> 놓고 채우십시오.',
     "8부 11단계 상담자료 사진")


# ═══ 6. 도구 백과 미끼 레이더 항목에 사진 ═══════════════════════
sub1('<div class="te-h"><b>미끼 레이더</b><span class="te-id">bait_radar</span></div>\n',
     f'<div class="te-h"><b>미끼 레이더</b><span class="te-id">mikki</span></div>\n'
     f'<img class="te-img" alt="미끼 레이더 화면" src="{uri("app-mikki")}">\n',
     "도구 백과 미끼 레이더 사진")


# ═══ 7. 표지 · 차례 손보기 ═════════════════════════════════════
sub1('<b>109</b>', '<b>114</b>', "표지 그림 수 109→114")
sub1('<span>가치관 여섯 · 고객이 도는 여덟 단계 한 바퀴 · 홍보 리듬 · 하루/주/월 루틴</span>',
     '<span>가치관 여섯 · 고객이 도는 여덟 단계 한 바퀴 · <b>내 지도와 설계사 지도</b> · 홍보 리듬 · 하루/주/월 루틴</span>',
     "차례 1부 설명")
sub1('<a href="#s5">제5부 CRM 설명서</a>로 가십시오.',
     '<a href="#s5">제5부 CRM 설명서</a>로 가십시오.', "확인용", 1)


# ═══ 8. CSS ════════════════════════════════════════════════════
css = open("frag_css2.txt", encoding="utf8").read()
new = css[css.index("/* 두 사람의 지도 */"):]
k = S.rfind("</style>")
S = S[:k] + new + S[k:]
LOG.append("  ✓ 지도 CSS (mp-)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG))
print(f"\n{len(S.encode()):,} bytes")
