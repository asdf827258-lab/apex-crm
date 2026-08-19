# -*- coding: utf-8 -*-
"""15차 — 갈래 카드 칩에도 새 화면을 올린다."""
import sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []
for old, new, tag in [
    ('<span class="chip">알릴의무 필터</span>',
     '<span class="chip">알릴의무 필터</span><span class="chip">자동차사고 과실·보상</span>',
     "계약·청구 칩"),
    ('<span class="chip">재무설계 실전화법서</span><span class="chip">재무설계 상담자료</span>',
     '<span class="chip">재무설계 실전화법서</span><span class="chip">보장분석 상담자료</span>'
     '<span class="chip">재무설계 상담자료</span><span class="chip">미끼상품&amp;접촉전략</span>',
     "상담 도구 칩"),
    ('<span class="chip">정책·상품 뉴스</span>',
     '<span class="chip">고객에게 전할 뉴스</span><span class="chip">정책·상품 뉴스</span>',
     "콘텐츠 제작 칩"),
]:
    c = S.count(old)
    assert c >= 1, f"[{tag}] 못 찾음"
    S = S.replace(old, new, 1)
    LOG.append(f"  ✓ {tag}")
open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
