# -*- coding: utf-8 -*-
"""5차 — 맨 앞에 「우리가 하는 일」, 2부에 「단계」를 넣고, 말투를 부드럽게 고친다."""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:70]!r}"
    S = S.replace(old, new)
    LOG.append(f"  ✓ {tag}")


# ═══ 1. 앵커 재매핑 — 새 2부가 들어가면서 뒤가 하나씩 밀린다 ═════
IDMAP = {f"s{o}": f"s{o+1}" for o in range(15, 1, -1)}   # s15→s16 … s2→s3
before = len(re.findall(r'(id="|href="#)(s\d+)"', S))
S = re.sub(r'(id="|href="#)(s\d+)"',
           lambda m: m.group(1) + IDMAP.get(m.group(2), m.group(2)) + '"', S)
LOG.append(f"  ✓ 앵커 재매핑 ({before})")

for o in range(14, 1, -1):
    sub1(f'<span class="part-no">제 {o} 부</span>',
         f'<span class="part-no">제 {o+1} 부</span>', f"part-no 제{o}→제{o+1}")


# ═══ 2. 본문 속 「N부」 표기 밀기 (앵커는 이미 밀렸고, 글자만 맞춘다) ═══
for old, new_, tag in [
    ('<a href="#s6">제5부 CRM 설명서</a>', '<a href="#s6">제6부 CRM 설명서</a>', "→CRM 설명서"),
    ('<a href="#s10">제9부 도구 백과</a>', '<a href="#s10">제10부 도구 백과</a>', "→도구 백과"),
    ('<b>8부를 그대로</b>', '<b>9부를 그대로</b>', "→연습표"),
    ('<a href="#s7">제6부</a>와 <a href="#s11">제10부</a>',
     '<a href="#s7">제7부</a>와 <a href="#s11">제11부</a>', "→미끼·처음켤때"),
    ('<a href="#s5">4부</a> · <a href="#s6">5부</a>',
     '<a href="#s5">5부</a> · <a href="#s6">6부</a>', "→90일 커리큘럼"),
    ('<a href="#s5">제4부 CRM</a>', '<a href="#s5">제5부 CRM</a>', "→미끼에서 CRM"),
    ('<b>제6부</b>에 있습니다', '<b>제7부</b>에 있습니다', "→te 미끼"),
    ('<a href="#s15">제14부</a>에 있습니다', '<a href="#s15">제15부</a>에 있습니다', "→te 계산기"),
]:
    c = S.count(old)
    assert c >= 1, f"[{tag}] 못 찾음 — {old[:50]!r}"
    S = S.replace(old, new_)
    LOG.append(f"  ✓ {tag} ({c})")


# ═══ 3. 위쪽 이동 막대 ═════════════════════════════════════════
nav_old = re.search(r'<nav class="topnav"><div class="topnav-in">.*?</div></nav>', S, re.S).group(0)
sub1(nav_old,
'''<nav class="topnav"><div class="topnav-in">
  <a href="#s-what">우리가 하는 일</a><a href="#s-pro">여는 이야기</a><a href="#s0">서장</a>
  <a href="#s1">한 장으로</a><a href="#s2">단계</a><a href="#s3">전문성</a><a href="#s4">마인드맵</a>
  <a href="#s5">CRM</a><a href="#s6">CRM 설명서</a><a href="#s7">미끼 레이더</a><a href="#s8">고객 앞에서</a>
  <a href="#s9">사용설명서</a><a href="#s10">도구 85</a><a href="#s11">처음 켤 때</a><a href="#s12">정착</a>
  <a href="#s13">90일</a><a href="#s14">자립</a><a href="#s15">숫자</a><a href="#s16">부록</a>
</div></nav>''', "상단 이동 막대")


# ═══ 4. 차례 ═══════════════════════════════════════════════════
items = re.findall(r'<a class="toc-item" href="#(s\d+)"><span class="toc-n">\d+</span><div>(.*?)</div></a>', S, re.S)
assert len(items) == 16, f"차례 16개 기대, 실제 {len(items)}"
inner = dict(items)
inner["s13"] = inner["s13"].replace(
    "<span>무엇이 나와야 하고 어디까지면 합격인가</span>",
    "<span>참고용 — 시간이 지나면서 무엇이 붙는가. <b>먼저 볼 것은 2부 단계</b>입니다</span>")
NEW = {
 "s2": '<b>단계 — TA · AP · PC · CS · 관리</b>'
       '<span>고객이 지나가는 길 한 장 · 어디서 막혔는지 30초에 아는 법 · 단계별 준비와 공부거리</span>'
       '<span class="go">「몇 개월 차」를 잊고 단계로 일하게 됩니다</span>',
}
ORDER = ["s0"] + [f"s{i}" for i in range(1, 17)]
rows = [f'    <a class="toc-item" href="#{sid}"><span class="toc-n">{n}</span><div>'
        f'{NEW.get(sid) or inner[sid]}</div></a>' for n, sid in enumerate(ORDER)]
old_list = re.search(r'<div class="toc-list">.*?\n  </div>', S, re.S).group(0)
sub1(old_list, '<div class="toc-list">\n' + "\n".join(rows) + '\n  </div>', "차례 다시 짜기")

# 차례 머리에 「우리가 하는 일」 한 줄
sub1('<p class="toc-h">차례 · 눌러서 바로 갑니다</p>',
     '<p class="toc-h">차례 · 눌러서 바로 갑니다</p>\n  '
     '<p style="font-size:15px;line-height:1.7;color:var(--g700);margin:0 0 14px;font-weight:500">'
     '급하시면 <a href="#s-what"><b>「우리가 하는 일」</b></a> 한 장과 '
     '<a href="#s2"><b>2부 단계</b></a>만 보셔도 됩니다.</p>',
     "차례 머리말")


# ═══ 5. 표지 읽는 순서 ═════════════════════════════════════════
cv = re.search(r'<div class="cv-who">.*?\n      </div>', S, re.S).group(0)
sub1(cv,
'''<div class="cv-who">
        <div><span class="w1">이 책이 뭔지부터</span><span class="w2"><a href="#s-what">우리가 하는 일</a></span><span class="w3">APEX 로 설계사의 값을 어떻게 올리는가 — 여섯 가지</span></div>
        <div><span class="w1">시간이 없으면</span><span class="w2"><a href="#s1">1부</a> + <a href="#s2">2부</a></span><span class="w3">가치관과 여덟 단계, 그리고 TA·AP·PC·CS. 여기까지가 뼈대입니다</span></div>
        <div><span class="w1">오늘 입사한 신입</span><span class="w2"><a href="#s2">2부</a> → <a href="#s6">6부</a> → <a href="#s9">9부</a></span><span class="w3">단계를 먼저, 그다음 CRM 사진 보고 그대로, 마지막에 하루 전체</span></div>
        <div><span class="w1">고객이 자꾸 끊긴다</span><span class="w2"><a href="#s2">2부</a> 단계</span><span class="w3">어디서 막혔는지 30초에 찾고, 그 단계 준비법만 보면 됩니다</span></div>
        <div><span class="w1">리더 · 매니저</span><span class="w2"><a href="#s2">2부</a> → <a href="#s12">12부</a></span><span class="w3">팀원 단계 분포로 코칭하기. 「더 열심히」 말고 막힌 칸 하나</span></div>
        <div><span class="w1">대표 · 처음 켤 때</span><span class="w2"><a href="#s11">11부</a> 세 가지</span><span class="w3">SQL · 메뉴 구성 · 열쇠. 순서를 지키면 한 번으로 끝납니다</span></div>
        <div><span class="w1">상담 중에 막혔을 때</span><span class="w2"><a href="#s10">10부</a> 도구 백과</span><span class="w3">화면 85개를 이름으로 찾아 그 자리에서 해결</span></div>
      </div>''', "표지 읽는 순서")


# ═══ 6. 90일·정착 장에 「참고」 딱지 ════════════════════════════
sub1('<h2>성장 — 90일 열두 주</h2>\n  <p class="dek">앱 「본인 점검란」에 들어 있는 것을 종이로 옮겼습니다.</p>',
     '<h2>성장 — 90일 열두 주</h2>\n  <p class="dek">앱 「본인 점검란」에 들어 있는 것을 종이로 옮겼습니다. '
     '<b>참고용입니다</b> — 날짜에 맞춰 억지로 따라가지 마시고, '
     '<a href="#s2">2부 단계</a>에서 막힌 칸을 먼저 보세요.</p>',
     "90일 장에 참고 딱지")

sub1('<h2>정착 — 첫 30일</h2>\n  <p class="dek">성장시키기 전에 먼저 남게 만들어야 합니다. 나가는 사람은 아무것도 배우지 못합니다.</p>',
     '<h2>정착 — 첫 30일</h2>\n  <p class="dek">성장시키기 전에 먼저 남게 만드는 이야기입니다. '
     '나가는 사람은 아무것도 배우지 못하니까요. '
     '<b>날짜는 참고</b>고, 하는 일은 <a href="#s2">2부 단계</a>와 같습니다.</p>',
     "정착 장에 참고 딱지")


# ═══ 7. 새 장 둘 끼워 넣기 ═════════════════════════════════════
opener = open("frag_open.html", encoding="utf8").read().rstrip()
stage = open("frag_stage.html", encoding="utf8").read().rstrip()

sub1('<section class="sty" id="s-pro">',
     opener + '\n\n<section class="sty" id="s-pro">', "맨 앞 「우리가 하는 일」")
sub1('<!-- ═══ 2부 · 전문성 ═══ -->\n<section class="part" id="s3">',
     stage + '\n\n<!-- ═══ 3부 · 전문성 ═══ -->\n<section class="part" id="s3">',
     "2부 단계 삽입")


# ═══ 8. 말투 — 「…십시오」를 「…세요」로 ════════════════════════
n = S.count("십시오")
S = S.replace("십시오", "세요")
LOG.append(f"  ✓ 말투 부드럽게 ({n}곳)")

for old, new, tag in [
    ("사람은 잊습니다.", "사람은 잊어버립니다.", "말투 · 잊습니다"),
    ("아무도 못 합니다.", "아무도 못 합니다. 저도 못 했습니다.", "말투 · 못 합니다"),
    ("반드시 상품설명서와 약관으로 확인하고", "반드시 상품설명서와 약관으로 확인하시고", "말투 · 꼬리말"),
    ("이 목록은 코드에서 뽑은 것이다.", "이 목록은 코드에서 뽑은 것입니다.", "말투 · 목록"),
]:
    c = S.count(old)
    if c:
        S = S.replace(old, new); LOG.append(f"  ✓ {tag} ({c})")


# ═══ 9. 새 CSS ════════════════════════════════════════════════
css = open("frag_css2.txt", encoding="utf8").read()
new = css[css.index("/* 값 지도 · 단계판 */"):]
k = S.rfind("</style>")
S = S[:k] + new + S[k:]
LOG.append("  ✓ CSS (op- · st-)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG))
print(f"\n{len(S.encode()):,} bytes")
