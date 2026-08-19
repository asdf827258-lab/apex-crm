# -*- coding: utf-8 -*-
"""17차 — 19부 「고객 처방전」. 부록만 s19 → s20 으로 밀린다."""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:70]!r}"
    S = S.replace(old, new); LOG.append(f"  ✓ {tag}")


k = 0
for pat, rep in [(r'id="s19"', 'id="s20"'), (r'href="#s19"', 'href="#s20"'),
                 (r'class="toc-n">19</span>', 'class="toc-n">20</span>')]:
    S, n = re.subn(pat, rep, S); k += n
LOG.append(f"  ✓ 부록 s19 → s20 ({k}곳)")

rx = open("frag_rx19.html", encoding="utf8").read().rstrip()
m = re.search(r'\n<!--[^\n]*부록[^\n]*-->\n(?=<section)', S)
anchor = m.group(0) if m else '\n<section class="part" id="s20">'
sub1(anchor, "\n\n" + rx + "\n" + anchor, "19부 삽입")

sub1('<a href="#s18">레벨업</a><a href="#s20">부록 · 아침 한 줄</a>',
     '<a href="#s18">레벨업</a><a href="#s19">고객 처방전</a>'
     '<a href="#s20">부록 · 아침 한 줄</a>', "이동 막대")

toc_ap = re.search(r'<a class="toc-item" href="#s20">.*?</a>', S, re.S).group(0)
sub1(toc_ap,
'''<a class="toc-item" href="#s19"><span class="toc-n">19</span><div>'''
'''<b>고객 처방전 — 적으면 나옵니다</b>'''
'''<span>고객이 한 말을 적으면 무엇을 열지 · 뭐라고 열지 · 무엇을 남길지 · 처방 열둘</span>'''
'''<span class="go">여든여덟 개를 외우지 않아도 됩니다</span></div></a>
        ''' + toc_ap, "차례 19부")

sub1('<div><span class="w1">뭘 고쳐야 할지 모르겠다</span><span class="w2">'
     '<a href="#s18">18부 레벨업</a></span>'
     '<span class="w3">여섯 축으로 재고, 가장 벌어진 하나만 이번 달에</span></div>',
     '<div><span class="w1">뭘 고쳐야 할지 모르겠다</span><span class="w2">'
     '<a href="#s18">18부 레벨업</a></span>'
     '<span class="w3">여섯 축으로 재고, 가장 벌어진 하나만 이번 달에</span></div>\n'
     '        <div><span class="w1">뭘 열어야 할지 모르겠다</span><span class="w2">'
     '<a href="#s19">19부 고객 처방전</a></span>'
     '<span class="w3">고객이 한 말을 적으면 나옵니다 — 외울 필요 없습니다</span></div>',
     "표지 읽는 순서")

# 6부 CRM 설명서에서 이어지게
sub1('<div class="card blue"><p class="card-h">이 설명서의 약속</p>',
     '<div class="ms-tip"><b>화면 이름을 외우기 어려우시면</b> — '
     '<a href="#s19">19부 고객 처방전</a>을 먼저 보시죠. '
     '「오늘의 알림」 맨 위에 <b>고객이 한 말을 적으면</b> 무엇을 열지가 나옵니다.</div>\n\n'
     '  <div class="card blue"><p class="card-h">이 설명서의 약속</p>', "6부에서 잇기")

CSS = """
/* 처방전 — 책에서 초록 줄을 가리킬 때 */
.rx-keep2{color:var(--green);font-weight:700}
"""
k2 = S.rfind("</style>")
S = S[:k2] + CSS + S[k2:]
LOG.append("  ✓ CSS")
open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
