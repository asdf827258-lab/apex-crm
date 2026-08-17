# -*- coding: utf-8 -*-
"""6차 — 날짜를 제자리로 되돌리고, 아침 한 줄을 넣고, 말투를 권유형으로."""
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


# ═══ 1. 2부 — 「날짜를 잊으라」로 읽히던 문장 바로잡기 ═══════════
sub1('<p class="dek">「몇 개월 차에는 이걸 하세요」는 잊으셔도 됩니다.\n'
     '  중요한 건 <b>지금 이 고객이 어느 단계에 있는가</b> 하나입니다.</p>',
     '<p class="dek">「입사 몇 개월 차에는 이걸 하세요」는 잊으셔도 됩니다.\n'
     '  대신 <b>이 고객이 어느 단계에 있고, 그 단계의 날짜가 며칠 지났는가</b> —\n'
     '  이 둘만 보시면 됩니다. <b>단계와 날짜는 늘 붙어 다닙니다.</b></p>',
     "2부 머리말")

sub1('''    입사 3개월 차든 3년 차든, 눈앞의 고객은 <b>여섯 단계 중 어딘가에 있습니다.</b>
    3년 차라도 오늘 새로 받은 DB 는 미접촉이고, 3개월 차라도 증권 전달한 고객은 관리 단계입니다.
    그래서 <b>날짜가 아니라 단계로</b> 보시면 훨씬 쉽습니다.
    날짜 이야기(첫 30일 · 90일)는 뒤쪽 <a href="#s13">13부</a>에 참고로 남겨 뒀습니다.''',
'''    입사 3개월 차든 3년 차든, 눈앞의 고객은 <b>여섯 단계 중 어딘가에 있습니다.</b>
    3년 차라도 오늘 새로 받은 DB 는 미접촉이고, 3개월 차라도 증권 전달한 고객은 관리 단계예요.
    그래서 <b>내 경력이 아니라 고객의 단계로</b> 보시면 훨씬 쉽습니다.<br><br>
    <b>다만 고객 날짜는 이야기가 다릅니다.</b> 배정일 · 마지막 통화일 · 상담 약속 · 마지막 터치 —
    이 날짜들이 이 일의 심장입니다. 단계만 있고 날짜가 없으면 그건 그냥 이름표예요.
    <a href="#s2">바로 아래</a>에서 날짜 이야기를 따로 하겠습니다.''',
     "2부 들머리 카드")


# ═══ 2. 날짜 절 끼워 넣기 (진단표 뒤, 단계 카드 앞) ═════════════
date_sec = open("frag_date.html", encoding="utf8").read().rstrip()
sub1('  <h3>단계마다 무엇을 하고, 무엇을 준비하나</h3>',
     date_sec + '\n\n  <h3>단계마다 무엇을 하고, 무엇을 준비하나</h3>',
     "날짜 절 삽입")


# ═══ 3. 12·13부 — 「참고」의 뜻을 정확히 ════════════════════════
sub1('<b>참고용입니다</b> — 날짜에 맞춰 억지로 따라가지 마시고, '
     '<a href="#s2">2부 단계</a>에서 막힌 칸을 먼저 보세요.',
     '여기 적힌 <b>주차는 참고</b>예요 — 「입사 몇 주 차」에 맞춰 억지로 따라가지 마시고, '
     '<a href="#s2">2부 단계</a>에서 막힌 칸부터 보시면 됩니다. '
     '<b>고객 날짜(약속 · 마지막 터치)는 그대로 지키셔야 하고요.</b>',
     "13부 참고 딱지")

sub1('<b>날짜는 참고</b>고, 하는 일은 <a href="#s2">2부 단계</a>와 같습니다.',
     '<b>「며칠 차」는 참고</b>고, 하는 일은 <a href="#s2">2부 단계</a>와 같습니다. '
     '고객 약속 날짜는 첫날부터 끝까지 똑같이 중요합니다.',
     "12부 참고 딱지")

sub1('<span>참고용 — 시간이 지나면서 무엇이 붙는가. <b>먼저 볼 것은 2부 단계</b>입니다</span>',
     '<span>주차는 참고 — 시간이 지나면서 무엇이 붙는가. <b>먼저 볼 것은 2부 단계</b>입니다</span>',
     "차례 13부 설명")


# ═══ 4. 부록 — 아침에 한 줄 ════════════════════════════════════
q = open("frag_quote.html", encoding="utf8").read().rstrip()
sub1('  <h2>인쇄해서 붙여 두는 것</h2>\n',
     '  <h2>인쇄해서 붙여 두는 것</h2>\n'
     '  <p class="dek">여기부터는 <b>종이로 뽑아 두시면 좋은 것</b>들입니다.\n'
     '  아침에 읽는 한 줄, 저녁에 찍는 열 칸, 주머니에 넣는 상담 63분.</p>\n\n'
     + q + "\n\n", "부록 아침 한 줄")

sub1('<a href="#s16">부록</a>', '<a href="#s16">부록 · 아침 한 줄</a>', "이동 막대 부록")


# ═══ 5. 차례 — 2부·부록 설명 손보기 ════════════════════════════
sub1('<span>고객이 지나가는 길 한 장 · 어디서 막혔는지 30초에 아는 법 · 단계별 준비와 공부거리</span>'
     '<span class="go">「몇 개월 차」를 잊고 단계로 일하게 됩니다</span>',
     '<span>고객이 지나가는 길 한 장 · 어디서 막혔는지 30초에 아는 법 · '
     '<b>날짜 넷과 7·90·365 리듬</b> · 단계별 준비와 공부거리</span>'
     '<span class="go">단계와 날짜, 이 둘만 보면 오늘 할 일이 정해집니다</span>',
     "차례 2부 설명")


# ═══ 6. 말투 — 권유형으로 (「…세요」의 절반을 「…시죠」로) ═══════
PROTECT = [("마세요", "\x01"), ("주세요", "\x02"), ("계세요", "\x03")]
for a, b in PROTECT:
    S = S.replace(a, b)

cnt = {"n": 0, "hit": 0}


def soften(m):
    cnt["n"] += 1
    if cnt["n"] % 2 == 0:            # 하나 걸러 하나만 바꿔 리듬을 살린다
        return m.group(0)
    cnt["hit"] += 1
    return m.group(1) + "시죠"


S = re.sub(r'(\S)세요', lambda m: soften(m), S)
for a, b in PROTECT:
    S = S.replace(b, a)
LOG.append(f"  ✓ 권유형 말투 ({cnt['hit']}곳 → …시죠)")

for old, new, tag in [
    ("해 보시죠", "해 보시죠", "확인"),
    ("한번 해 보시죠", "한번 해 보시죠", "확인2"),
    ("<b>지우지 마세요.</b>", "<b>지우지 말아 주시고요.</b>", "말투 · 지우지"),
    ("겁주는 데 쓰지 마세요.", "겁주는 데 쓰지는 마시고요.", "말투 · 겁주기"),
]:
    c = S.count(old)
    if c and old != new:
        S = S.replace(old, new); LOG.append(f"  ✓ {tag} ({c})")


# ═══ 7. CSS ════════════════════════════════════════════════════
CSS = """
/* 날짜 축 */
.dt-axis{stroke:var(--line-2);stroke-width:2.4}
.dt-ax{fill:var(--g500);font-size:14px;font-weight:600}
.dt-dot{fill:var(--bg);stroke:var(--g600);stroke-width:3}
.dt-hot{fill:var(--blue-fill);stroke:var(--blue);stroke-width:4}
.dt-t{fill:var(--g900);font-size:18px;font-weight:800;letter-spacing:-.03em}
.dt-ht{fill:var(--blue-ink)}
.dt-s{fill:var(--g600);font-size:13.5px;font-weight:600}
.dt-r{fill:var(--blue-ink);font-size:15px;font-weight:700}
.dt-hr{fill:var(--blue)}
.dt-r2{fill:var(--g700);font-size:13.5px;font-weight:600}
.dt-note{fill:var(--g700);font-size:15.5px;font-weight:700}
.dt-note2{fill:var(--g500);font-size:14px;font-weight:500}

/* 아침에 한 줄 */
.qt{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);
  border:1px solid var(--line);border-radius:18px;overflow:hidden;margin:22px 0}
@media(max-width:640px){.qt{grid-template-columns:1fr}}
.qt-i{background:var(--bg);display:grid;grid-template-columns:34px 1fr;gap:0 12px;
  padding:14px 16px;align-items:start}
.qt-n{font-size:13px;font-weight:800;color:var(--blue);background:var(--blue-fill);
  border-radius:9px;text-align:center;line-height:26px;height:26px;
  font-variant-numeric:tabular-nums}
.qt-l{margin:0;font-size:15.5px;font-weight:700;color:var(--g900);line-height:1.55;
  letter-spacing:-.02em}
.qt-w{margin:5px 0 0;font-size:13.5px;color:var(--g600);line-height:1.6;font-weight:500}
.qt-src{display:inline-block;font-size:11.5px;font-weight:700;color:var(--g500);
  background:var(--fill);border-radius:6px;padding:2px 7px;margin-left:7px;
  vertical-align:middle}

@media print{
  .qt{grid-template-columns:1fr 1fr;break-inside:auto}
  .qt-i{break-inside:avoid}
  .dt-note,.dt-note2{fill:#4E5968}
}
"""
k = S.rfind("</style>")
S = S[:k] + CSS + S[k:]
LOG.append("  ✓ CSS (dt- · qt-)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG))
print(f"\n{len(S.encode()):,} bytes")
