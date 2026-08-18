# -*- coding: utf-8 -*-
"""책의 말과 화면의 말을 대조한다 — 다르면 책이 틀린 것이다."""
import re, sys, json
sys.stdout.reconfigure(encoding="utf8")

CRM = open("/home/user/apex-crm/db-crm.html", encoding="utf8").read()
APP = open("/home/user/apex-crm/app/index.html", encoding="utf8").read()

def strings(src):
    """따옴표 안 한글과 태그 사이 한글을 전부 긁는다"""
    out = set()
    for m in re.finditer(r'>([^<>{}]{1,40})<', src):
        t = m.group(1).strip()
        if t and re.search(r'[가-힣]', t): out.add(t)
    for m in re.finditer(r"['\"]([^'\"\\\n]{1,40})['\"]", src):
        t = m.group(1).strip()
        if t and re.search(r'[가-힣]', t): out.add(t)
    return out

CRM_S, APP_S = strings(CRM), strings(APP)
ALL = CRM_S | APP_S
open("screen_strings.txt","w",encoding="utf8").write("\n".join(sorted(ALL)))
print(f"화면 문자열: CRM {len(CRM_S)} · 앱 {len(APP_S)} · 합 {len(ALL)}")

# 책이 「」 로 인용한 것들 = 화면 글자라고 주장하는 자리
B = open("book-final.html", encoding="utf8").read()
B = re.sub(r'<svg.*?</svg>', ' ', B, flags=re.S)   # 그림 안 글자는 따로 본다
quoted = re.findall(r'「([^」]{1,30})」', B)
from collections import Counter
cq = Counter(quoted)
print(f"책이 「」 로 인용한 낱말: {len(cq)}종 · {sum(cq.values())}회")
json.dump({"cq":cq, "all":sorted(ALL)}, open("audit.json","w"), ensure_ascii=False)
