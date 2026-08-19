# -*- coding: utf-8 -*-
"""13차 — 18부 「레벨업」. 부록만 s18 → s19 로 한 칸 밀린다."""
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


# ═══ 1. 부록을 s18 → s19 로 ════════════════════════════════════
k = 0
for pat, rep in [(r'id="s18"', 'id="s19"'), (r'href="#s18"', 'href="#s19"'),
                 (r'class="toc-n">18</span>', 'class="toc-n">19</span>')]:
    S, n = re.subn(pat, rep, S); k += n
LOG.append(f"  ✓ 부록 s18 → s19 ({k}곳)")
assert 'id="s18"' not in S, "자리가 안 비었다"


# ═══ 2. 18부 끼우기 — 17부(숫자) 뒤, 부록 앞 ═══════════════════
lv = open("frag_level.html", encoding="utf8").read().rstrip()
m = re.search(r'\n<!--[^\n]*부록[^\n]*-->\n(?=<section)', S)
anchor = m.group(0) if m else '\n<section class="part" id="s19">'
sub1(anchor, "\n\n" + lv + "\n" + anchor, "18부 삽입")


# ═══ 3. 이동 막대 · 차례 · 표지 ════════════════════════════════
sub1('<a href="#s17">숫자</a><a href="#s19">부록 · 아침 한 줄</a>',
     '<a href="#s17">숫자</a><a href="#s18">레벨업</a>'
     '<a href="#s19">부록 · 아침 한 줄</a>', "이동 막대")

toc_ap = re.search(r'<a class="toc-item" href="#s19">.*?</a>', S, re.S).group(0)
sub1(toc_ap,
'''<a class="toc-item" href="#s18"><span class="toc-n">18</span><div>'''
'''<b>레벨업 — 성장판을 이렇게 씁니다</b>'''
'''<span>여섯 축과 점수 공식 · 「한 축을 200% 해도 100점」 · '''
'''배워서 터치할 것 열두 개 · 리더의 한 주</span>'''
'''<span class="go">「요즘 잘 안 되네」가 고칠 축 하나로 바뀝니다</span></div></a>
        ''' + toc_ap, "차례 18부")

sub1('<div><span class="w1">계약 뒤가 비어 있다</span><span class="w2">'
     '<a href="#s8">8부 고객 365일</a></span>'
     '<span class="w3">증권 · 보장 · 가족 · 동의까지 쌓는 자리</span></div>',
     '<div><span class="w1">계약 뒤가 비어 있다</span><span class="w2">'
     '<a href="#s8">8부 고객 365일</a></span>'
     '<span class="w3">증권 · 보장 · 가족 · 동의까지 쌓는 자리</span></div>\n'
     '        <div><span class="w1">뭘 고쳐야 할지 모르겠다</span><span class="w2">'
     '<a href="#s18">18부 레벨업</a></span>'
     '<span class="w3">여섯 축으로 재고, 가장 벌어진 하나만 이번 달에</span></div>',
     "표지 읽는 순서")


# ═══ 4. 앞 장에서 이어지게 ═════════════════════════════════════
sub1('<a class="tw-k tw-ka" href="#s8"><b>8부 고객 365일</b>'
     '<span>계약 뒤를 어떻게 지키나</span></a>',
     '<a class="tw-k tw-ka" href="#s18"><b>18부 레벨업</b>'
     '<span>내 여섯 축 중 어디가 낮은가</span></a>', "이용 방향 · 이어가기")

sub1('<p class="rd-go"><b>여기까지 오면</b> — 1번이 <b>저절로</b> 채워집니다.</p>',
     '<p class="rd-go"><b>여기까지 오면</b> — 1번이 <b>저절로</b> 채워집니다.</p>\n'
     '      <p class="rd-go" style="border:0;padding-top:6px">'
     '<b>지금 몇 번인지 모르겠으면</b> — <a href="#s18">18부 레벨업</a>에서 '
     '<b>여섯 축</b>을 재 보시죠. 가장 낮은 축이 곧 지금 번호입니다.</p>',
     "로드맵 · 레벨업으로")


# ═══ 5. CSS ════════════════════════════════════════════════════
CSS = """
/* 레벨업 */
.lv-ax{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 26px}
@media(max-width:760px){.lv-ax{grid-template-columns:1fr}}
.lv-a{border:1px solid var(--line);border-radius:16px;padding:18px 20px;background:var(--bg)}
.lv-an{display:flex;align-items:baseline;gap:10px;margin-bottom:10px}
.lv-an b{font-size:20px;font-weight:800;color:var(--g900);letter-spacing:-.04em}
.lv-at{font-size:13px;font-weight:800;color:#fff;background:var(--blue);
  border-radius:8px;padding:3px 9px}
.lv-aw{margin:0 0 9px;font-size:15.5px;line-height:1.7;color:var(--g700);font-weight:500}
.lv-as{margin-bottom:10px}
.lv-af{margin:0;background:var(--fill);border-radius:11px;padding:11px 13px;
  font-size:14.5px;line-height:1.7;color:var(--g700);font-weight:500}
.lv-af b{color:var(--blue-ink);margin-right:5px}

.lv-ups{margin:16px 0 8px}
.lv-u{display:flex;align-items:center;gap:14px;border:1px solid var(--line);
  border-radius:14px;padding:14px 18px;margin-bottom:8px;background:var(--bg)}
.lv-ux{flex:1}
.lv-ux b{display:block;font-size:16.5px;font-weight:800;color:var(--g900);letter-spacing:-.03em}
.lv-ux span{display:block;font-size:14px;color:var(--g600);font-weight:500;margin-top:3px}
.lv-uv{font-size:27px;font-weight:800;color:var(--blue);letter-spacing:-.04em;flex:none}
.lv-uv em{font-size:14px;font-style:normal;margin-left:2px;font-weight:700}
.lv-ok{color:var(--green);font-weight:700}

.lv-miss{border:1px solid var(--line);border-radius:16px;overflow:hidden;margin:16px 0 8px}
.lv-mh{margin:0;padding:14px 20px;background:var(--fill);font-size:15.5px;
  font-weight:800;color:var(--g900);letter-spacing:-.02em}
.lv-mt{width:100%;border-collapse:collapse}
.lv-mt td{padding:12px 20px;border-top:1px solid var(--line);font-size:15px;
  line-height:1.65;color:var(--g600);font-weight:500;vertical-align:top}
.lv-mt td.lv-mw{color:var(--g900);font-weight:700;width:44%}
.lv-mt td b{color:var(--red)}

.lv-wk{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:16px 0 22px}
@media(max-width:900px){.lv-wk{grid-template-columns:1fr}}
.lv-w{border:1px solid var(--line);border-radius:14px;padding:15px 16px;background:var(--bg)}
.lv-wd{width:28px;height:28px;border-radius:50%;background:#101B29;color:#fff;
  display:grid;place-items:center;font-size:14px;font-weight:800;margin-bottom:10px}
.lv-wb b{display:block;font-size:16px;font-weight:800;color:var(--g900);
  letter-spacing:-.03em;margin-bottom:6px}
.lv-wb p{margin:0;font-size:14.5px;line-height:1.7;color:var(--g700);font-weight:500}

@media print{ .lv-a,.lv-u,.lv-w,.lv-miss{break-inside:avoid} }
"""
k = S.rfind("</style>")
S = S[:k] + CSS + S[k:]
LOG.append("  ✓ CSS (lv-)")

open("book-final.html", "w", encoding="utf8").write(S)
print("\n".join(LOG)); print(f"\n{len(S.encode()):,} bytes")
