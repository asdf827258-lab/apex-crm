# -*- coding: utf-8 -*-
"""새로 붙이는 CSS 와 도구 백과 항목."""

# ── 새 CSS — 기존 클래스와 겹치지 않는 접두사만 쓴다 (rdr- / nmb-)
CSS = """
/* 미끼 레이더 — 자료가 어디까지 가는가 */
.rdr-fig{margin:22px 0;padding:0}
.rdr-fig svg{width:100%;height:auto;display:block;border:1px solid var(--line);
  border-radius:16px;background:var(--bg-2);padding:6px 0}
.rdr-fig figcaption{font-size:13.5px;color:var(--g600);margin-top:9px;font-weight:600;line-height:1.6}
.rdr-fig figcaption b{color:var(--g800)}
.rdr-srv{fill:var(--fill);stroke:var(--line-2);stroke-width:1.6}
.rdr-box{fill:var(--bg);stroke:var(--line);stroke-width:1.6}
.rdr-t{fill:var(--g900);font-size:19px;font-weight:800;letter-spacing:-.03em}
.rdr-s{fill:var(--g600);font-size:14px;font-weight:600}
.rdr-on{fill:var(--g900)} .rdr-on2{fill:var(--g600)}
.rdr-bd{stroke:var(--line-2);stroke-width:2;stroke-dasharray:8 7}
.rdr-ln{stroke:var(--line-2);stroke-width:2.2}
.rdr-ok{stroke:var(--blue);stroke-width:2.6}
.rdr-no{stroke:var(--red);stroke-width:2.6;stroke-dasharray:7 6}
.rdr-x{stroke:var(--red);stroke-width:3.4;stroke-linecap:round;fill:none}
.rdr-head{fill:var(--blue)} .rdr-head2{fill:var(--line-2)}
.rdr-lb{fill:var(--g600);font-size:14px;font-weight:600}
.rdr-lbb{fill:var(--blue-ink)} .rdr-lbr{fill:var(--red)}

/* 외우는 숫자 — 식 */
.nmb-f{border:1px solid var(--line);border-radius:16px;overflow:hidden;margin:20px 0;background:var(--bg)}
.nmb-r{display:grid;grid-template-columns:118px 1fr;gap:0 16px;padding:15px 19px;
  border-bottom:1px solid var(--line);align-items:baseline}
@media(max-width:520px){.nmb-r{grid-template-columns:1fr;gap:5px}}
.nmb-k{font-size:14px;font-weight:700;color:var(--blue-ink)}
.nmb-v{font-size:16px;font-weight:600;color:var(--g900);letter-spacing:-.01em;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums}
.nmb-v sup{font-size:.72em}
.nmb-n{padding:12px 19px;font-size:13.5px;color:var(--g600);font-weight:500;background:var(--bg-2)}

@media print{
  .rdr-fig,.nmb-f{break-inside:avoid}
  .rdr-fig svg{background:#fff}
}
"""

# ── 도구 백과 — 보험전략실 묶음 (그림은 아직 없음)
TE_GROUP = """<details><summary>보험전략실 <span class="cnt">1</span></summary><div class="det-body">
<div class="te">
<div class="te-h"><b>미끼 레이더</b><span class="te-id">bait_radar</span></div>
<p class="te-w">약관을 조문 단위로 쪼개 <b>스물아홉 항목</b>으로 판정하고, 담보별·회사별로 줄을 세웁니다.
근거는 해석이 아니라 <b>약관 원문 문장</b>으로 인용하고 그 쪽을 그림으로 떠 형광펜을 칩니다.
독소조항 체크리스트 · 이달의 컨셉 · 접촉 화법 · 고객 제시자료까지 열세 화면.</p>
<p class="te-k"><b>언제</b> 매달 한 번 30분 · 약관 PDF 를 받았을 때</p>
<p class="te-c"><b>고객 앞에서</b> 판정만 말하지 말고 <b>원문을 띄우십시오.</b>
「자료에 없음」과 「보장하지 않음」은 다릅니다 — 못 찾은 것을 없다고 말하면 그 자료는 신뢰를 잃습니다.
자세한 것은 <b>제4부</b>에 있습니다.</p>
</div>
</div></details>
"""

if __name__ == "__main__":
    open("frag_css.txt", "w", encoding="utf8").write(CSS)
    open("frag_te.html", "w", encoding="utf8").write(TE_GROUP)
    print("css bytes", len(CSS), "· te bytes", len(TE_GROUP))
