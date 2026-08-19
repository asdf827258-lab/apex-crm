# -*- coding: utf-8 -*-
"""14차 — 2026-08-19 배포판에 맞춘다.

  앱이 늘었다. 열네 갈래 80화면 → 83화면, 받쳐 주는 다섯을 더해 85 → 88.
  새 화면 셋 — 자동차사고 과실·보상 · 미끼상품&접촉전략 · 고객에게 전할 뉴스.
  「미끼 레이더」는 보험전략실(사업단장 전용)로 남고, 설계사용은 미끼상품&접촉전략이다.
"""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:80]!r}"
    S = S.replace(old, new)
    LOG.append(f"  ✓ {tag}")


# ═══ 1. 갈래별 화면 수 — 셋이 늘었다 ═══════════════════════════
for nm, old, new in (("상담 도구", 9, 10), ("계약·청구", 6, 7), ("콘텐츠 제작", 7, 8)):
    # ① 지도 SVG
    sub1(f'>{nm}</text>', f'>{nm}</text>', f"{nm} 확인")
    # 왼쪽 칸은 end, 오른쪽 칸은 start 로 정렬돼 있다 — 둘 다 잡는다
    pat = (rf'(<text class="rm-t"[^>]*>{re.escape(nm)}</text>\s*'
           rf'<text class="rm-s"[^>]*>[^<]*'
           rf'<tspan class="rm-c">· 화면 ){old}(</tspan>)')
    S, k = re.subn(pat, rf'\g<1>{new}\g<2>', S)
    assert k == 1, f"{nm} 지도 {k}건"
    # ② 갈래 카드
    sub1(f'<span class="nm">{nm}</span><span class="rl">', f'<span class="nm">{nm}</span><span class="rl">',
         f"{nm} 카드 확인")
    pat2 = rf'(<span class="nm">{re.escape(nm)}</span><span class="rl">[^<]*</span><span class="ct">화면 ){old}(</span>)'
    S, k = re.subn(pat2, rf'\g<1>{new}\g<2>', S)
    assert k == 1, f"{nm} 카드 {k}건"
    # ③ 도구 백과 접이칸
    sub1(f'<details><summary>{nm} <span class="cnt">{old}</span></summary>',
         f'<details><summary>{nm} <span class="cnt">{new}</span></summary>', f"{nm} 백과 머리")
LOG.append("  ✓ 갈래 셋의 화면 수 (9→10 · 6→7 · 7→8)")


# ═══ 2. 새 화면 셋을 도구 백과에 ═══════════════════════════════
CAR = '''<div class="te">
      <div class="te-h"><b>자동차사고 과실·보상</b><span class="te-id">car_fault</span></div>
      <p class="te-w">사고 상황을 고르면 <b>과실비율 · 상황도 · 근거 법조문 · 판례</b>가 나오고,
      이어서 <b>보상금 계산기</b>와 <b>청구할 담보·서류 목록</b>, <b>고객 안내문</b>까지 만들어집니다.
      과실은 AI 가 아니라 <b>인정기준 도표</b>가 정합니다. 12대 중과실도 따로 짚어 줍니다.</p>
      <p class="te-k"><b>언제</b> 고객이 「사고 났어요」 하고 전화했을 때 — 그 자리에서</p>
      <p class="te-c"><b>고객 앞에서</b> 숫자부터 말하지 마시고 <b>상황도</b>를 같이 보세요.
      「왜 이 숫자가 나왔는지」가 화면에 있습니다. 안내문은 <b>인쇄·PDF·카톡 텍스트</b>로 바로 나갑니다.
      올린 사진·영상은 <b>「지금 지우기」</b>로 그 자리에서 지우시죠.</p>
    </div>
'''
MK = '''<div class="te">
      <div class="te-h"><b>미끼상품&amp;접촉전략</b><span class="te-id">mikki_talk</span></div>
      <p class="te-w"><b>작은 담보로 큰 니즈를 여는 법</b> — 스물일곱 장짜리 교재입니다.
      미끼가 뭔지, 왜 작은 것부터인지(발 걸치기 · 말 지키기), 좋은 미끼의 다섯 조건,
      상황별 상품 목록, 담보 쪼개기와 세트별 화법까지.
      <b>거절 응대 롤플레이</b>가 붙어 있어 고객 목소리를 듣고 <b>내 답변을 녹음</b>해 볼 수 있습니다.</p>
      <p class="te-k"><b>언제</b> 신입은 7일 · 30일 로드맵대로, 경력은 막히는 장만</p>
      <p class="te-c"><b>고객 앞에서</b> 이건 <b>고객에게 보여 주는 자료가 아닙니다.</b>
      내가 먼저 외우는 교재예요. 한 장 읽고 <b>그날 한 명에게 써 보는</b> 것이 전부입니다.</p>
    </div>
'''
NEWS = '''<div class="te">
      <div class="te-h"><b>고객에게 전할 뉴스</b><span class="te-id">news_live</span></div>
      <p class="te-w">오늘 기사를 <b>다섯 칸</b>으로 모읍니다 —
      보험 · <b>정책자금 · 세금 · 부동산 · 지원금</b>. 모은 것은 <b>달 서랍</b>에 쌓여
      지난달 것이 사라지지 않습니다.</p>
      <p class="te-k"><b>언제</b> 아침에 한 번 · 새 고객을 만들 때</p>
      <p class="te-c"><b>고객 앞에서</b> 보험 이야기로 열지 마시고
      <b>그 사람에게 걸리는 칸</b>으로 여세요 — 사장님이면 정책자금, 집 있으면 부동산.
      「이거 보셨어요?」 한 줄이 <b>오프닝 3분</b>입니다.</p>
    </div>
'''
def insert_before(name, block, tag):
    """그 화면 카드(<div class="te">) 바로 앞에 새 카드를 끼운다."""
    global S
    k = S.find(f'<div class="te-h"><b>{name}</b>')
    assert k > 0, f"[{tag}] {name} 를 못 찾음"
    st = S.rfind('<div class="te">', 0, k)
    assert st > 0, f"[{tag}] 여는 칸을 못 찾음"
    S = S[:st] + block + S[st:]
    LOG.append(f"  ✓ {tag}")


insert_before("알릴의무 필터", CAR, "자동차사고 과실·보상 넣기")
insert_before("재무설계 계산기", MK, "미끼상품&접촉전략 넣기")
insert_before("정책·상품 뉴스", NEWS, "고객에게 전할 뉴스 넣기")


# ═══ 3. 큰 숫자 ════════════════════════════════════════════════
sub1('<div><b>85</b><span>화면 전부</span></div>', '<div><b>88</b><span>화면 전부</span></div>', "표지 숫자")
sub1('<a href="#s12">도구 85</a>', '<a href="#s12">도구 88</a>', "이동 막대")
sub1('<h2>도구 백과 — 화면 85개 전부</h2>', '<h2>도구 백과 — 화면 88개 전부</h2>', "12부 제목")
sub1('<div class="v">80개</div><div class="l">화면 · 열네 칸</div>',
     '<div class="v">88개</div><div class="l">화면 · 열네 칸</div>', "표지 통계")
sub1('열네 칸 · 여든 화면', '열네 칸 · 여든셋', "뇌 지도")
sub1('화면이 여든 개지만 <b>칸은 열네 개</b>입니다',
     '화면이 <b>여든여덟</b> 개지만 <b>칸은 열네 개</b>입니다', "메뉴 읽는 법")
sub1('열네 칸 여든 화면', '열네 칸 여든셋 화면 · 받쳐 주는 다섯을 더해 여든여덟', "출처 표기")
sub1('화면이 예순 개가 넘습니다.', '화면이 <b>여든여덟</b> 개입니다.', "4부 머리말")
sub1('화면은 예순 개가 넘지만', '화면은 여든여덟 개지만', "4부 여섯 갈래")
S = S.replace('화면 85개를', '화면 88개를')
S = S.replace('2026년 8월 16일 배포판', '2026년 8월 19일 배포판')
LOG.append("  ✓ 큰 숫자 · 배포판 날짜")


# ═══ 4. 미끼 — 두 화면이 다르다는 것을 못박는다 ═════════════════
sub1('<span class="chip">미끼 레이더</span>',
     '<span class="chip">미끼 레이더</span><span class="chip">미끼상품&amp;접촉전략</span>',
     "미끼 둘 · 칩", S.count('<span class="chip">미끼 레이더</span>'))

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
