# -*- coding: utf-8 -*-
"""11차 — 크게 먼저(로드맵 · 이용 방향), 그리고 빠져 있던 두 부.

  1) 맨 앞을 「로드맵 → 이용 방향」 으로 다시 잡는다. 읽기 어렵던 SVG 판 둘은
     HTML 로 바꾼다 — 흐르니까 안 잘리고, 글자 크기가 읽는 사람을 따른다.
  2) 새 7부 「상담」 · 새 8부 「고객 365일」 을 끼운다.
     옛 7~16부는 두 칸씩 밀린다.
"""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []
A, B = "\x01", "\x02"          # 이미 옮긴 번호를 다시 안 건드리게 감싸는 표식


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:80]!r}"
    S = S.replace(old, new)
    LOG.append(f"  ✓ {tag}")


# ═══ 1. 옛 7~16부를 두 칸씩 민다 (큰 번호부터) ═════════════════
n_moved = 0
for old in range(16, 6, -1):
    new = f"{A}{old + 2}{B}"
    for pat, rep in [
        (rf'id="s{old}"',              f'id="s{new}"'),
        (rf'href="#s{old}"',           f'href="#s{new}"'),
        (rf'제 {old} 부',               f'제 {new} 부'),
        (rf'제{old}부',                 f'제{new}부'),
        (rf'class="toc-n">{old}</span>', f'class="toc-n">{new}</span>'),
        (rf'═ {old}부',                 f'═ {new}부'),
        (rf'(?<!\d){old}부',            f'{new}부'),
    ]:
        S, k = re.subn(pat, rep, S)
        n_moved += k
S = S.replace(A, "").replace(B, "")
LOG.append(f"  ✓ 옛 7~16부를 9~18부로 ({n_moved}곳)")
assert 'id="s17"' in S and 'id="s18"' in S, "밀리지 않았다"
assert 'id="s7"' not in S and 'id="s8"' not in S, "자리가 안 비었다"


# ═══ 2. 새 7부(상담) · 8부(고객 365일) 끼우기 ══════════════════
talk = open("frag_talk.html", encoding="utf8").read().rstrip()
c365 = open("frag_365.html", encoding="utf8").read().rstrip()
sub1('<!-- ═══ 6부 · 미끼 레이더 ═══ -->',
     talk + "\n\n" + c365 + "\n\n<!-- ═══ 미끼 레이더 ═══ -->", "7·8부 삽입")


# ═══ 3. 맨 앞 — 로드맵 넣고, 읽기 힘들던 판 둘을 바꾼다 ═════════
road = open("frag_road.html", encoding="utf8").read().rstrip()
use = open("frag_use.html", encoding="utf8").read().rstrip()
i, j = S.find('<section class="sty" id="s-who">'), S.find('<section class="sty" id="s-what">')
assert 0 < i < j, "맨 앞 자리를 못 찾음"
S = S[:i] + road + "\n\n" + use + "\n\n" + S[j:]
LOG.append("  ✓ 로드맵 + 이용 방향 (SVG 판 둘 → HTML)")


# ═══ 4. 이동 막대 ══════════════════════════════════════════════
nav = re.search(r'<nav class="topnav"><div class="topnav-in">.*?</div></nav>', S, re.S).group(0)
sub1(nav, '''<nav class="topnav"><div class="topnav-in">
  <a href="#s-road">로드맵</a><a href="#s-who">누가 어떻게</a><a href="#s-what">우리가 하는 일</a>
  <a href="#s-brain">윤시현의 뇌</a><a href="#s-flow">영업프로세스</a>
  <a href="#s-pro">여는 이야기</a><a href="#s0">서장</a><a href="#s1">한 장으로</a><a href="#s2">단계</a>
  <a href="#s3">전문성</a><a href="#s4">마인드맵</a><a href="#s5">CRM</a><a href="#s6">CRM 설명서</a>
  <a href="#s7">상담</a><a href="#s8">고객 365일</a><a href="#s9">미끼 레이더</a>
  <a href="#s10">고객 앞에서</a><a href="#s11">사용설명서</a><a href="#s12">도구 85</a>
  <a href="#s13">처음 켤 때</a><a href="#s14">정착</a><a href="#s15">90일</a><a href="#s16">자립</a>
  <a href="#s17">숫자</a><a href="#s18">부록 · 아침 한 줄</a>
</div></nav>''', "이동 막대")


# ═══ 5. 차례 ═══════════════════════════════════════════════════
toc7 = re.search(r'<a class="toc-item" href="#s9">.*?</a>', S, re.S).group(0)
sub1(toc7,
'''<a class="toc-item" href="#s7"><span class="toc-n">7</span><div><b>상담 — 만나서 무슨 말을 하나</b>'''
'''<span>상담자료가 <b>둘</b>이라는 것 · 보장분석 열여섯 장을 넘기는 순서 · 3대 기준 · 상담 63분</span>'''
'''<span class="go">만나면 막히던 것이 순서로 바뀝니다</span></div></a>
        <a class="toc-item" href="#s8"><span class="toc-n">8</span><div><b>고객 365일 — 계약 뒤가 진짜</b>'''
'''<span>여섯 칸 · 담보 추출과 검수 · 저장된 상담 자료 · <b>고객 동의 네 단계</b></span>'''
'''<span class="go">계약한 고객이 일 년 뒤에도 남아 있게 됩니다</span></div></a>
        ''' + toc7, "차례 7·8부")


# ═══ 6. 표지 읽는 순서 ═════════════════════════════════════════
sub1('<div><span class="w1">무조건 여기부터</span><span class="w2">'
     '<a href="#s-who">누가 무엇을 하나</a></span>'
     '<span class="w3">설계사는 어떻게 쓰고 매니저는 어떻게 관리하는가 — 표 두 판</span></div>',
     '<div><span class="w1">무조건 여기부터</span><span class="w2">'
     '<a href="#s-road">로드맵</a></span>'
     '<span class="w3">설계사가 자리를 잡는 네 고비 — 지금 내가 몇 번인지부터</span></div>\n'
     '        <div><span class="w1">그다음</span><span class="w2">'
     '<a href="#s-who">누가 어떻게 쓰는가</a></span>'
     '<span class="w3">설계사의 하루와 매니저의 하루</span></div>\n'
     '        <div><span class="w1">만나면 막힌다</span><span class="w2">'
     '<a href="#s7">7부 상담</a></span>'
     '<span class="w3">상담자료 둘의 차이와 열여섯 장을 넘기는 순서</span></div>\n'
     '        <div><span class="w1">계약 뒤가 비어 있다</span><span class="w2">'
     '<a href="#s8">8부 고객 365일</a></span>'
     '<span class="w3">증권 · 보장 · 가족 · 동의까지 쌓는 자리</span></div>',
     "표지 읽는 순서")

sub1('급하시면 <a href="#s-who"><b>「누가 무엇을 하나」 표 두 판</b></a>만 보셔도 됩니다. '
     '더 보실 여유가 있으면 ',
     '급하시면 <a href="#s-road"><b>로드맵</b></a>과 '
     '<a href="#s-who"><b>누가 어떻게 쓰는가</b></a> 두 장만 보셔도 됩니다. '
     '더 보실 여유가 있으면 ', "차례 머리말")


# ═══ 7. 표지 숫자 — 부가 둘 늘었다 ══════════════════════════════
S = re.sub(r'(<div><b>)85(</b><span>화면 전부)', r'\g<1>85\g<2>', S)
LOG.append("  ✓ 표지 숫자 확인")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
