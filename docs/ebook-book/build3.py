# -*- coding: utf-8 -*-
"""3차 — 앞에 「가치관과 일하는 순서」, CRM 뒤에 「CRM 설명서」를 넣고 장 번호를 다시 맞춘다."""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:60]!r}"
    S = S.replace(old, new)
    LOG.append(f"  ✓ {tag}")


# ═══ 1. 앵커 다시 매기기 ═══════════════════════════════════════
# 새 장 둘: s1(가치관) · s5(CRM 설명서)
IDMAP = {f"s{o}": f"s{n}" for o, n in
         [(1, 2), (2, 3), (3, 4), (4, 6), (5, 7), (6, 8), (7, 9),
          (8, 10), (9, 11), (10, 12), (11, 13), (12, 14), (13, 15)]}
before = len(re.findall(r'(id="|href="#)(s\d+)"', S))
S = re.sub(r'(id="|href="#)(s\d+)"',
           lambda m: m.group(1) + IDMAP.get(m.group(2), m.group(2)) + '"', S)
LOG.append(f"  ✓ 앵커 재매핑 ({before})")

for o, n in [(12, 14), (11, 13), (10, 12), (9, 11), (8, 10), (7, 9),
             (6, 8), (5, 7), (4, 6), (3, 4), (2, 3), (1, 2)]:
    sub1(f'<span class="part-no">제 {o} 부</span>',
         f'<span class="part-no">제 {n} 부</span>', f"part-no 제{o}→제{n}")


# ═══ 2. 본문 속 「N부」 표기 ════════════════════════════════════
sub1('<a href="#s9">제7부 도구 백과</a>', '<a href="#s9">제9부 도구 백과</a>', "마인드맵→도구백과")
sub1('<a href="#s6">제4부</a>와 <a href="#s10">제8부</a>',
     '<a href="#s6">제6부</a>와 <a href="#s10">제10부</a>', "마인드맵→미끼·처음켤때")
sub1('자세한 것은 <b>제4부</b>에 있습니다.', '자세한 것은 <b>제6부</b>에 있습니다.', "te 미끼→제6부")
sub1('<a href="#s14">제12부</a>에 있습니다', '<a href="#s14">제14부</a>에 있습니다', "te 계산기→제14부")
sub1('<td class="s">신입에게 <b>6부를 그대로</b> 시켜 봤다</td>',
     '<td class="s">신입에게 <b>8부를 그대로</b> 시켜 봤다</td>', "연습표 6부→8부")
sub1('이 뒤부터는 3부 CRM 의 규칙이 그대로 적용됩니다.',
     '이 뒤부터는 <a href="#s4">제4부 CRM</a> 의 규칙이 그대로 적용됩니다.', "미끼→CRM 참조")


# ═══ 3. 위쪽 이동 막대 ═════════════════════════════════════════
sub1('''<nav class="topnav"><div class="topnav-in">
  <a href="#s-pro">여는 이야기</a><a href="#s0">서장</a><a href="#s2">전문성</a><a href="#s3">마인드맵</a><a href="#s4">CRM</a>
  <a href="#s6">미끼 레이더</a><a href="#s7">고객 앞에서</a><a href="#s8">사용설명서</a><a href="#s9">도구 85</a>
  <a href="#s10">처음 켤 때</a><a href="#s11">정착</a><a href="#s12">90일</a><a href="#s13">자립</a>
  <a href="#s14">숫자</a><a href="#s15">부록</a>
</div></nav>''',
'''<nav class="topnav"><div class="topnav-in">
  <a href="#s-pro">여는 이야기</a><a href="#s0">서장</a><a href="#s1">한 장으로</a><a href="#s2">전문성</a><a href="#s3">마인드맵</a>
  <a href="#s4">CRM</a><a href="#s5">CRM 설명서</a><a href="#s6">미끼 레이더</a><a href="#s7">고객 앞에서</a>
  <a href="#s8">사용설명서</a><a href="#s9">도구 85</a><a href="#s10">처음 켤 때</a><a href="#s11">정착</a>
  <a href="#s12">90일</a><a href="#s13">자립</a><a href="#s14">숫자</a><a href="#s15">부록</a>
</div></nav>''', "상단 이동 막대")


# ═══ 4. 표지 ═══════════════════════════════════════════════════
sub1('<b>102</b>', '<b>109</b>', "표지 그림 수 102→109")
sub1('''        <div><span class="w1">오늘 입사한 신입</span><span class="w2"><a href="#s2">1부</a> → <a href="#s3">2부</a> → <a href="#s8">6부</a></span><span class="w3">왜 이 일을 하는지 먼저, 그다음 화면 보고 그대로 따라 하기</span></div>
        <div><span class="w1">3개월 차</span><span class="w2"><a href="#s12">10부</a> + <a href="#s8">6부</a></span><span class="w3">90일 로드맵을 열어 두고, 막힌 주차의 화면만 골라 보기</span></div>
        <div><span class="w1">리더 · 매니저</span><span class="w2"><a href="#s11">9부</a> → <a href="#s13">11부</a></span><span class="w3">정착 30일과 자립 기준. 팀원에게 무엇을 언제 시킬지</span></div>
        <div><span class="w1">대표 · 처음 켤 때</span><span class="w2"><a href="#s10">8부</a> 세 가지</span><span class="w3">SQL · 메뉴 구성 · 열쇠. 순서를 지키면 한 번으로 끝납니다</span></div>
        <div><span class="w1">상담 중에 막혔을 때</span><span class="w2"><a href="#s9">7부</a> 도구 백과</span><span class="w3">화면 85개를 이름으로 찾아 그 자리에서 해결</span></div>''',
'''        <div><span class="w1">시간이 없으면</span><span class="w2"><a href="#s1">1부</a> 한 장으로</span><span class="w3">가치관 · 여덟 단계 한 바퀴 · 하루/주/월 루틴. 여기만 읽어도 일이 됩니다</span></div>
        <div><span class="w1">오늘 입사한 신입</span><span class="w2"><a href="#s1">1부</a> → <a href="#s5">5부</a> → <a href="#s8">8부</a></span><span class="w3">순서를 먼저, 그다음 CRM 사진 보고 그대로, 마지막에 하루 전체</span></div>
        <div><span class="w1">전화가 안 될 때</span><span class="w2"><a href="#s5">5부</a> CRM 설명서</span><span class="w3">화면 사진에 번호를 찍어 뒀습니다. 뭐라고 열지·무엇을 남길지</span></div>
        <div><span class="w1">3개월 차</span><span class="w2"><a href="#s12">12부</a> + <a href="#s8">8부</a></span><span class="w3">90일 로드맵을 열어 두고, 막힌 주차의 화면만 골라 보기</span></div>
        <div><span class="w1">리더 · 매니저</span><span class="w2"><a href="#s11">11부</a> → <a href="#s13">13부</a></span><span class="w3">정착 30일과 자립 기준. 팀원에게 무엇을 언제 시킬지</span></div>
        <div><span class="w1">대표 · 처음 켤 때</span><span class="w2"><a href="#s10">10부</a> 세 가지</span><span class="w3">SQL · 메뉴 구성 · 열쇠. 순서를 지키면 한 번으로 끝납니다</span></div>
        <div><span class="w1">상담 중에 막혔을 때</span><span class="w2"><a href="#s9">9부</a> 도구 백과</span><span class="w3">화면 85개를 이름으로 찾아 그 자리에서 해결</span></div>''',
     "표지 읽는 순서")


# ═══ 5. 차례 ═══════════════════════════════════════════════════
items = re.findall(r'<a class="toc-item" href="#(s\d+)"><span class="toc-n">\d+</span><div>(.*?)</div></a>', S, re.S)
assert len(items) == 14, f"차례 14개 기대, 실제 {len(items)}"
inner = dict(items)
NEW = {
 "s1": '<b>한 장으로 — 나의 가치관과 일하는 순서</b>'
       '<span>가치관 여섯 · 고객이 도는 여덟 단계 한 바퀴 · 홍보 리듬 · 하루/주/월 루틴</span>'
       '<span class="go">이 장만 읽고 따라 해도 일이 굴러갑니다</span>',
 "s5": '<b>CRM 설명서 — 사진 보고 그대로</b>'
       '<span>실제 화면 일곱 장에 번호를 찍었습니다. 오늘의 알림 · DB 관리 · 통화 창 · KPI · TA 스크립트</span>'
       '<span class="go">전화를 걸고 기록을 남기는 일이 30초가 됩니다</span>',
}
ORDER = ["s0"] + [f"s{i}" for i in range(1, 16)]
rows = [f'    <a class="toc-item" href="#{sid}"><span class="toc-n">{n}</span><div>'
        f'{NEW.get(sid) or inner[sid]}</div></a>'
        for n, sid in enumerate(ORDER)]
old_list = re.search(r'<div class="toc-list">.*?\n  </div>', S, re.S).group(0)
sub1(old_list, '<div class="toc-list">\n' + "\n".join(rows) + '\n  </div>', "차례 다시 짜기")


# ═══ 6. 꼬리말 ═════════════════════════════════════════════════
sub1('''    10부의 12주 커리큘럼과 7구간 로드맵, 부록의 하루 열 칸은 앱 「본인 점검란」에 실린 내용을 옮긴 것입니다.
    7부의 화면 목록은 <b>2026년 8월 16일 배포판</b> 메뉴 그대로입니다 — 열네 칸 여든 화면.
    12부의 금액·환급률은 제안서 원문과 공시 기준을 옮긴 <b>예시</b>이며 미래 수익을 보장하지 않습니다.''',
'''    12부의 12주 커리큘럼과 7구간 로드맵, 부록의 하루 열 칸은 앱 「본인 점검란」에 실린 내용을 옮긴 것입니다.
    9부의 화면 목록은 <b>2026년 8월 16일 배포판</b> 메뉴 그대로입니다 — 열네 칸 여든 화면.
    5부의 CRM 화면 사진은 같은 판을 <b>견본 자료로 채워 찍은 것</b>이며, 이름·연락처는 전부 가짜입니다.
    14부의 금액·환급률은 제안서 원문과 공시 기준을 옮긴 <b>예시</b>이며 미래 수익을 보장하지 않습니다.''',
     "꼬리말")


# ═══ 7. 새 장 둘 끼워 넣기 ═════════════════════════════════════
s1 = open("frag_s1.html", encoding="utf8").read().rstrip()
s5 = open("frag_s6.html", encoding="utf8").read().rstrip()
# 조각 안의 번호를 최종 배치에 맞춘다
s5 = s5.replace('id="s6"', 'id="s5"').replace('<span class="part-no">제 6 부</span>',
                                              '<span class="part-no">제 5 부</span>')
s1 = s1.replace('<a href="#s6">제6부 CRM 설명서</a>', '<a href="#s5">제5부 CRM 설명서</a>') \
       .replace('<a href="#s10">제10부 도구 백과</a>', '<a href="#s9">제9부 도구 백과</a>')
assert 'id="s5"' in s5 and '제 5 부' in s5
assert '#s5' in s1 and '#s9' in s1

sub1('<!-- ═══ 1부 ═══ -->\n<section class="part" id="s2">',
     s1 + '\n\n<!-- ═══ 2부 · 전문성 ═══ -->\n<section class="part" id="s2">',
     "1부 한 장으로 삽입")
sub1('<!-- ═══ 4부 · 미끼 레이더 ═══ -->\n<section class="part" id="s6">',
     s5 + '\n\n<!-- ═══ 6부 · 미끼 레이더 ═══ -->\n<section class="part" id="s6">',
     "5부 CRM 설명서 삽입")


# ═══ 8. 새 CSS ════════════════════════════════════════════════
css = open("frag_css2.txt", encoding="utf8").read()
k = S.rfind("</style>")
assert k > 0
S = S[:k] + css + S[k:]
LOG.append("  ✓ 새 CSS (cyc- · pw · pin)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG))
print(f"\n{len(S.encode()):,} bytes")
