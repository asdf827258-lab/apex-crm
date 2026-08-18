# -*- coding: utf-8 -*-
"""화면에 실제로 찍히는 글자만 골라낸다 — 제목 · 표머리 · 라벨 · 단추 · 단계"""
import re, sys, json
sys.stdout.reconfigure(encoding="utf8")
CRM = open("/home/user/apex-crm/db-crm.html", encoding="utf8").read()
APP = open("/home/user/apex-crm/app/index.html", encoding="utf8").read()
UI = {}

# 1) CRM 페이지 제목
UI["CRM 페이지 제목"] = sorted(set(re.findall(r"\b\w+\s*:\s*'([^']+)'", 
    re.search(r"(?:PAGE_TITLE|TITLES|pageTitle)\s*=\s*\{(.*?)\}", CRM, re.S).group(1)))) \
    if re.search(r"(?:PAGE_TITLE|TITLES|pageTitle)\s*=\s*\{", CRM, re.S) else []

# 2) CRM 표 머리 <th>
UI["CRM 표 머리"] = sorted(set(t.strip() for t in re.findall(r'<th[^>]*>([^<]{1,20})</th>', CRM) if re.search(r'[가-힣]', t)))
# 3) CRM 라벨
UI["CRM 라벨"] = sorted(set(t.strip() for t in re.findall(r'<label[^>]*>([^<]{1,24})</label>', CRM) if re.search(r'[가-힣]', t)))
# 4) CRM 단추
UI["CRM 단추"] = sorted(set(t.strip() for t in re.findall(r'<button[^>]*>([^<]{1,24})</button>', CRM) if re.search(r'[가-힣0-9]', t)))
# 5) 단계 · 결과
for nm in ("STAGES","RESULTS","STAGE","RESULT"):
    m = re.search(nm + r"\s*=\s*\[([^\]]+)\]", CRM)
    if m: UI["CRM "+nm] = re.findall(r"'([^']+)'", m.group(1))
# 6) CRM h1~h3 · 모달 제목
UI["CRM 제목류"] = sorted(set(t.strip() for t in re.findall(r'<h[1-3][^>]*>([^<]{1,34})</h[1-3]>', CRM) if re.search(r'[가-힣]', t)))

# 7) 앱 TABS — 화면 이름 전부
tabs = re.search(r'var TABS\s*=\s*(\[.*?\n\s*\];)', APP, re.S)
raw = tabs.group(1) if tabs else ""
UI["앱 갈래(그룹)"] = re.findall(r"(?:group|g)\s*:\s*'([^']+)'", raw) or re.findall(r"name\s*:\s*'([^']+)'\s*,\s*(?:items|kids)", raw)
UI["앱 화면 이름"] = sorted(set(re.findall(r"(?:t|title|label|name)\s*:\s*'([^']{2,26})'", raw)))
json.dump(UI, open("/tmp/claude-0/-home-user-apex-crm/4f580999-2f16-5769-a70a-e46d71debafe/scratchpad/ui.json","w"), ensure_ascii=False, indent=1)
for k,v in UI.items():
    print(f"\n### {k} ({len(v)})")
    print(" · ".join(v[:200]))
