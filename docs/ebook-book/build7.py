# -*- coding: utf-8 -*-
"""7차 — 맨 앞에 「윤시현의 뇌」 한 장과 「영업프로세스 — APEX 는 어떻게 접근하는가」."""
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


brain = open("frag_brain.html", encoding="utf8").read().rstrip()
flow = open("frag_flow.html", encoding="utf8").read().rstrip()

# ═══ 1. 「우리가 하는 일」 뒤에 두 장을 붙인다 ═══════════════════
sub1('<section class="sty" id="s-pro">',
     brain + '\n\n' + flow + '\n\n<section class="sty" id="s-pro">',
     "뇌 · 영업프로세스 삽입")


# ═══ 2. 이동 막대 ══════════════════════════════════════════════
nav = re.search(r'<nav class="topnav"><div class="topnav-in">.*?</div></nav>', S, re.S).group(0)
sub1(nav,
'''<nav class="topnav"><div class="topnav-in">
  <a href="#s-what">우리가 하는 일</a><a href="#s-brain">윤시현의 뇌</a><a href="#s-flow">영업프로세스</a>
  <a href="#s-pro">여는 이야기</a><a href="#s0">서장</a><a href="#s1">한 장으로</a><a href="#s2">단계</a>
  <a href="#s3">전문성</a><a href="#s4">마인드맵</a><a href="#s5">CRM</a><a href="#s6">CRM 설명서</a>
  <a href="#s7">미끼 레이더</a><a href="#s8">고객 앞에서</a><a href="#s9">사용설명서</a><a href="#s10">도구 85</a>
  <a href="#s11">처음 켤 때</a><a href="#s12">정착</a><a href="#s13">90일</a><a href="#s14">자립</a>
  <a href="#s15">숫자</a><a href="#s16">부록 · 아침 한 줄</a>
</div></nav>''', "상단 이동 막대")


# ═══ 3. 차례 머리말 · 표지 ═════════════════════════════════════
sub1('급하시면 <a href="#s-what"><b>「우리가 하는 일」</b></a> 한 장과 '
     '<a href="#s2"><b>2부 단계</b></a>만 보셔도 됩니다.',
     '급하시면 앞의 세 장 — <a href="#s-what"><b>우리가 하는 일</b></a> · '
     '<a href="#s-brain"><b>윤시현의 뇌</b></a> · <a href="#s-flow"><b>영업프로세스</b></a> — '
     '만 보셔도 됩니다. 나머지는 그 세 장을 하나씩 펼친 것입니다.',
     "차례 머리말")

sub1('<div><span class="w1">이 책이 뭔지부터</span><span class="w2">'
     '<a href="#s-what">우리가 하는 일</a></span>'
     '<span class="w3">APEX 로 설계사의 값을 어떻게 올리는가 — 여섯 가지</span></div>',
     '<div><span class="w1">이 책이 뭔지부터</span><span class="w2">'
     '<a href="#s-what">우리가 하는 일</a></span>'
     '<span class="w3">APEX 로 설계사의 값을 어떻게 올리는가 — 여섯 가지</span></div>\n'
     '        <div><span class="w1">한 장으로 다 보고 싶다</span><span class="w2">'
     '<a href="#s-brain">윤시현의 뇌</a></span>'
     '<span class="w3">이 책의 모든 지도를 하나로 합친 그림. 여기서 아무 가지나 따라가면 됩니다</span></div>\n'
     '        <div><span class="w1">영업 방식이 궁금하면</span><span class="w2">'
     '<a href="#s-flow">영업프로세스</a></span>'
     '<span class="w3">유입부터 소개까지 여섯 칸 — 사람이 하던 것과 APEX 가 하는 것</span></div>',
     "표지 읽는 순서")


# ═══ 4. CSS ════════════════════════════════════════════════════
CSS = """
/* 한 장 지도 — 본문 폭을 넘겨 크게 본다 */
.brain{width:min(96vw,1080px);margin:26px 0 8px;margin-left:50%;
  transform:translateX(-50%);padding:0}
.brain svg{width:100%;height:auto;display:block;border:1px solid var(--line);
  border-radius:20px;background:var(--bg-2);padding:10px 0}
.brain figcaption{font-size:14px;color:var(--g600);margin:11px auto 0;font-weight:500;
  line-height:1.65;max-width:740px;padding:0 4px}
.brain figcaption b{color:var(--g800)}
@media(max-width:820px){.brain{width:calc(100vw - 28px)}}

/* 뇌 — 가지와 잎 */
.bn-hub{fill:#101B29;stroke:#2A3B4F;stroke-width:2}
.bn-hk{fill:#7E93AA;font-size:16px;font-weight:700;letter-spacing:.08em}
.bn-hn{fill:#fff;font-size:40px;font-weight:800;letter-spacing:-.04em}
.bn-hs{fill:#9FB6CC;font-size:19px;font-weight:700}
.bn-hs2{fill:#6D8298;font-size:14px;font-weight:500}
.bn-s{fill:none;stroke-width:2.4}
.bn-s-l{stroke:var(--line-2)}
.bn-s-r{stroke:#9CC4F5}
.bn-box{fill:var(--bg);stroke-width:1.8}
.bn-l{stroke:var(--line-2)}
.bn-r{stroke:#A8CBF7}
.bn-t{fill:var(--g900);font-size:24px;font-weight:800;letter-spacing:-.035em}
.bn-o{font-size:14px;font-weight:700}
.bn-l-o{fill:var(--g500)} .bn-r-o{fill:var(--blue)}
.bn-d{stroke:none}
.bn-l-d{fill:var(--g500)} .bn-r-d{fill:var(--blue)}
.bn-l2{fill:var(--g700);font-size:15px;font-weight:600}

.bn-key{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0 4px}
@media(max-width:600px){.bn-key{grid-template-columns:1fr 1fr}}
.bn-kk{display:block;background:var(--bg-2);border:1px solid var(--line);border-radius:13px;
  padding:11px 13px;text-decoration:none}
.bn-kk:hover{border-color:var(--blue);background:var(--blue-fill)}
.bn-kk b{display:block;font-size:14.5px;font-weight:700;color:var(--g900);letter-spacing:-.02em}
.bn-kk span{display:block;font-size:12.5px;color:var(--blue-ink);font-weight:600;margin-top:3px}

/* 영업프로세스 판 */
.fl-rl{font-size:16px;font-weight:800;letter-spacing:-.03em}
.fl-rl1{fill:var(--g900)} .fl-rl2{fill:var(--g500)}
.fl-rl3{fill:var(--blue-ink)} .fl-rl4{fill:var(--green)}
.fl-ph{fill:#101B29;stroke:#101B29}
.fl-no{fill:#7E93AA;font-size:15px;font-weight:800}
.fl-nm{fill:#fff;font-size:27px;font-weight:800;letter-spacing:-.04em}
.fl-sb{fill:#9FB6CC;font-size:14px;font-weight:600}
.fl-ar{stroke:var(--line-2);stroke-width:2.4}
.fl-hd{fill:var(--line-2)}
.fl-hu{fill:var(--fill);stroke:var(--line);stroke-width:1.4}
.fl-ht{fill:var(--g600);font-size:14.5px;font-weight:600}
.fl-dn{stroke:var(--blue);stroke-width:2.2;stroke-dasharray:6 5}
.fl-ax{fill:var(--blue-fill);stroke:var(--blue);stroke-width:1.8}
.fl-at{fill:var(--g900);font-size:15px;font-weight:700}
.fl-lf{fill:var(--green-fill);stroke:var(--green);stroke-width:1.4}
.fl-lt{fill:var(--green);font-size:12.5px;font-weight:800;letter-spacing:.04em}
.fl-lv{fill:var(--g800);font-size:14px;font-weight:700}
.fl-cap{fill:var(--g600);font-size:14.5px;font-weight:600}

@media print{
  .brain{width:auto;margin-left:0;transform:none}
  .brain svg{background:#fff;break-inside:avoid}
  .bn-key,.fl-cap{break-inside:avoid}
}
"""
k = S.rfind("</style>")
S = S[:k] + CSS + S[k:]
LOG.append("  ✓ CSS (brain · bn- · fl-)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG))
print(f"\n{len(S.encode()):,} bytes")
