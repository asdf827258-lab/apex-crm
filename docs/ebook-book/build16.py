# -*- coding: utf-8 -*-
"""16차 — 맨 앞에 「내가 이걸로 하려는 것」. 로드맵 · 이용 방향 다음 자리."""
import re, sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()
LOG = []


def sub1(old, new, tag, n=1):
    global S
    c = S.count(old)
    assert c == n, f"[{tag}] {n}건 기대, 실제 {c}건 — {old[:70]!r}"
    S = S.replace(old, new); LOG.append(f"  ✓ {tag}")


intent = open("frag_intent.html", encoding="utf8").read().rstrip()
sub1('<section class="sty" id="s-what">', intent + '\n\n<section class="sty" id="s-what">', "삽입")

sub1('<a href="#s-who">누가 어떻게</a><a href="#s-what">우리가 하는 일</a>',
     '<a href="#s-who">누가 어떻게</a><a href="#s-intent">내 의도</a>'
     '<a href="#s-what">우리가 하는 일</a>', "이동 막대")

sub1('<div><span class="w1">그다음</span><span class="w2">'
     '<a href="#s-who">누가 어떻게 쓰는가</a></span>'
     '<span class="w3">설계사의 하루와 매니저의 하루</span></div>',
     '<div><span class="w1">그다음</span><span class="w2">'
     '<a href="#s-who">누가 어떻게 쓰는가</a></span>'
     '<span class="w3">설계사의 하루와 매니저의 하루</span></div>\n'
     '        <div><span class="w1">왜 이렇게 만들었나</span><span class="w2">'
     '<a href="#s-intent">내가 이걸로 하려는 것</a></span>'
     '<span class="w3">무엇을 관리하고 · 무엇을 얻으려 하고 · 무엇을 부탁하는가</span></div>',
     "표지 읽는 순서")

CSS = """
/* 내 의도 — 셋 */
.in-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0 4px}
@media(max-width:900px){.in-3{grid-template-columns:1fr}}
.in-c{border:1px solid var(--line);border-radius:19px;padding:22px 22px 20px;
  background:var(--bg);position:relative;border-top:4px solid var(--blue)}
.in-2{border-top-color:var(--green)} .in-3c{border-top-color:var(--amber)}
.in-n{position:absolute;top:16px;right:20px;font-size:13px;font-weight:800;color:var(--g300,#D1D6DB)}
.in-c h3{margin:2px 0 9px;font-size:22px;font-weight:800;letter-spacing:-.045em;color:var(--g900)}
.in-l{margin:0 0 13px;font-size:16px;line-height:1.7;color:var(--g700);font-weight:500}
.in-l b{color:var(--g900)}
.in-c ul{margin:0;padding-left:17px}
.in-c li{font-size:15.5px;line-height:1.72;color:var(--g700);font-weight:500;margin-bottom:7px}
.in-c li b{color:var(--g900);font-weight:700}
.in-x{margin:14px 0 0;padding-top:13px;border-top:1px dashed var(--line-2);
  font-size:15px;line-height:1.7;color:var(--g600);font-weight:500}
.in-x b{color:var(--blue-ink)}
.in-h{margin-top:30px}
.in-p{font-size:16px;line-height:1.75;color:var(--g700);font-weight:500}
@media print{.in-c{break-inside:avoid}}
"""
k = S.rfind("</style>")
S = S[:k] + CSS + S[k:]
LOG.append("  ✓ CSS (in-)")
open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
