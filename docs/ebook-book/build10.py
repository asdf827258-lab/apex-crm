# -*- coding: utf-8 -*-
"""10차 — 맨 앞에 「누가 무엇을 하나」 두 판. 그리고 표지 로고를 진짜 로고로.

  로고는 앱 사이드바(.sb-logo)에 있는 것이 진짜다 —
  획 두 개짜리 A 와 「APEX」(흰) + 「YUN PRO」(#60A5FA).
  책 표지는 다른 A 와 은색 그라디언트 워드마크를 쓰고 있었다.
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


# ═══ 1. 표지 로고 — 앱에 실제로 쓰는 마크로 ════════════════════
old_lg = re.search(r'<svg class="lg".*?</svg>', S, re.S).group(0)
NEW_LG = '''<svg class="lg" viewBox="0 0 240 300" role="img" aria-label="APEX YUN PRO">
        <g fill="currentColor">
          <path d="M120 26 212 190 168 190 120 104 72 190 28 190Z"/>
          <path d="M120 120 176 214 146 214 120 168 94 214 64 214Z"/>
        </g>
      </svg>
      <div class="lg-w"><b>APEX</b> <span>YUN PRO</span></div>'''
sub1(old_lg, NEW_LG, "표지 로고 → 앱 마크")

# 로고 아래 딱지에서 브랜드 이름이 두 번 나오지 않게
sub1('<span class="badge">APEX YUN PRO · 팀 성장 지침서</span>',
     '<span class="badge">팀 성장 지침서</span>', "표지 딱지")


# ═══ 2. 맨 앞에 「누가 무엇을 하나」 ════════════════════════════
two = open("frag_two.html", encoding="utf8").read().rstrip()
sub1('<section class="sty" id="s-what">', two + '\n\n<section class="sty" id="s-what">',
     "누가 무엇을 하나 삽입")


# ═══ 3. 이동 막대 · 차례 · 표지 읽는 순서 ══════════════════════
sub1('<a href="#s-what">우리가 하는 일</a><a href="#s-brain">윤시현의 뇌</a>',
     '<a href="#s-who">누가 무엇을</a><a href="#s-what">우리가 하는 일</a>'
     '<a href="#s-brain">윤시현의 뇌</a>', "이동 막대")

sub1('급하시면 앞의 세 장 — <a href="#s-what"><b>우리가 하는 일</b></a> · ',
     '급하시면 <a href="#s-who"><b>「누가 무엇을 하나」 표 두 판</b></a>만 보셔도 됩니다. '
     '더 보실 여유가 있으면 <a href="#s-what"><b>우리가 하는 일</b></a> · ',
     "차례 머리말")

sub1('<div><span class="w1">이 책이 뭔지부터</span>',
     '<div><span class="w1">무조건 여기부터</span><span class="w2">'
     '<a href="#s-who">누가 무엇을 하나</a></span>'
     '<span class="w3">설계사는 어떻게 쓰고 매니저는 어떻게 관리하는가 — 표 두 판</span></div>\n'
     '        <div><span class="w1">이 책이 뭔지부터</span>', "표지 읽는 순서")


# ═══ 4. CSS ════════════════════════════════════════════════════
CSS = """
/* 표지 로고 — 앱과 같은 마크 */
.cv-l .lg{width:88px;height:auto;color:#fff;display:block;margin-bottom:10px}
.lg-w{font-size:31px;letter-spacing:-.05em;margin-bottom:18px;line-height:1}
.lg-w b{color:#fff;font-weight:800}
.lg-w span{color:#60A5FA;font-weight:800}

/* 누가 무엇을 하나 — 두 판 */
.tw-lead{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 4px}
@media(max-width:640px){.tw-lead{grid-template-columns:1fr}}
.tw-l1,.tw-l2{border-radius:13px;padding:12px 15px;font-size:14.5px;font-weight:600;
  line-height:1.6;color:var(--g700)}
.tw-l1{background:var(--blue-fill);border:1px solid var(--blue)}
.tw-l2{background:var(--fill);border:1px solid var(--line)}
.tw-l1 b,.tw-l2 b{color:var(--g900)}
.tw-l1 span{color:var(--blue-ink);font-weight:700}
.tw-l2 span{color:var(--g900);font-weight:700}

.tw-hd{stroke:none}
.tw-a1{fill:#101B29} .tw-a2{fill:#1C2A3A}
.tw-hn{fill:#fff;font-size:20px;font-weight:800;letter-spacing:-.04em}
.tw-hs{fill:#9FB6CC;font-size:14px;font-weight:600}
.tw-hc{fill:#7E93AA;font-size:12.5px;font-weight:700;letter-spacing:.02em}
.tw-row{fill:var(--bg);stroke:var(--line);stroke-width:1.4}
.tw-when{fill:var(--g900);font-size:15px;font-weight:800;letter-spacing:-.03em}
.tw-chip{stroke-width:1.4}
.tw-a1-c{fill:var(--blue-fill);stroke:var(--blue)}
.tw-a2-c{fill:var(--fill);stroke:var(--line-2)}
.tw-chipt{fill:var(--g900);font-size:14.5px;font-weight:700;letter-spacing:-.02em}
.tw-b1{fill:var(--g700);font-size:15.5px;font-weight:500}
.tw-b{fill:var(--g900);font-weight:800}
.tw-done{fill:var(--green);font-size:14.5px;font-weight:700}
.tw-ck{fill:var(--green);font-size:15px;font-weight:800}

.tw-key{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 26px}
@media(max-width:600px){.tw-key{grid-template-columns:1fr}}
.tw-k{display:block;border-radius:13px;padding:11px 14px;text-decoration:none;
  border:1px solid var(--line);background:var(--bg-2)}
.tw-k:hover{border-color:var(--blue);background:var(--blue-fill)}
.tw-k b{display:block;font-size:14.5px;font-weight:700;color:var(--g900);letter-spacing:-.02em}
.tw-k span{display:block;font-size:12.5px;color:var(--g600);font-weight:500;margin-top:3px}
.tw-ka b{color:var(--blue-ink)}

@media print{ .tw-key,.tw-lead{break-inside:avoid} }
"""
k = S.rfind("</style>")
S = S[:k] + CSS + S[k:]
LOG.append("  ✓ CSS (lg-w · tw-)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
