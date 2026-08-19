# -*- coding: utf-8 -*-
"""「하루 한 장」 설득 문서 — A4 네 쪽.

  논지 하나. 대표님이 앱 주석에 이미 원칙을 다 써 두셨는데,
  아침 보고 화면만 그 원칙을 안 따르고 있다. 인용은 전부 실제 문장이다.
"""
import sys
sys.stdout.reconfigure(encoding="utf8")
FONTS = open("fonts.css", encoding="utf8").read()

CSS = FONTS + """
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Pretendard,-apple-system,sans-serif;background:#fff;color:#191F28;
  -webkit-font-smoothing:antialiased}
.pg{width:1240px;height:1754px;padding:58px 62px;display:flex;flex-direction:column;background:#fff}
.hd{display:flex;justify-content:space-between;align-items:flex-start;
  border-bottom:3px solid #191F28;padding-bottom:15px;margin-bottom:22px}
.bi{display:flex;align-items:center;gap:10px}.bi svg{width:26px;color:#191F28}
.bw{font-size:19px;font-weight:800;letter-spacing:-.05em}.bw span{color:#3182F6}
.pt{font-size:12px;font-weight:700;color:#8B95A1;text-align:right;line-height:1.6}
h1{font-size:36px;font-weight:800;letter-spacing:-.05em;line-height:1.2;margin-bottom:9px}
.sub{font-size:16px;color:#4E5968;font-weight:500;line-height:1.65;margin-bottom:20px}
.sub b{color:#191F28}
h2{font-size:12px;font-weight:800;color:#3182F6;letter-spacing:.08em;margin-bottom:10px}
.sec{margin-bottom:20px;flex:none}
/* .pg 가 세로 flex 라 곧바로 놓인 상자가 남은 높이만큼 늘어난다 */
.pg > .bx{flex:none}
.row{display:flex;gap:11px}
.bx{flex:1;border:1.5px solid #E5E8EB;border-radius:14px;padding:15px 17px}
.bx .k{font-size:11.5px;font-weight:800;color:#8B95A1;margin-bottom:6px}
.bx .v{font-size:15.5px;font-weight:800;letter-spacing:-.03em;line-height:1.45}
.bx p{font-size:13.5px;color:#4E5968;line-height:1.62;font-weight:500;margin-top:5px}
.bx p b{color:#191F28}
.dark{background:#101B29;border-color:#101B29}
.dark .k{color:#7E93AA}.dark .v{color:#fff}.dark p{color:#9FB6CC}.dark p b{color:#fff}
.red{border-color:#F5C2C7;background:#FFF5F5}.red .v{color:#C0392B}
.grn{border-color:#A7E3C0;background:#F2FBF6}.grn .v{color:#0F7B4F}
.ft{margin-top:auto;border-top:1.5px solid #E5E8EB;padding-top:12px;
  font-size:11px;color:#8B95A1;line-height:1.65;font-weight:500}
.ft b{color:#4E5968}
table{width:100%;border-collapse:collapse}
th{font-size:11.5px;font-weight:800;color:#8B95A1;text-align:left;padding:0 9px 8px;
  border-bottom:1.5px solid #E5E8EB}
td{font-size:13.5px;padding:10px 9px;border-bottom:1px solid #F2F4F6;font-weight:500;
  color:#333D4B;line-height:1.6;vertical-align:top}
td b{font-weight:800;color:#191F28}
.note{font-size:12px;color:#8B95A1;line-height:1.65;font-weight:500;margin-top:8px}
.note b{color:#4E5968}
ul{list-style:none}
li{font-size:14px;color:#333D4B;line-height:1.7;font-weight:500;
  padding-left:15px;position:relative;margin-bottom:4px}
li:before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;
  border-radius:50%;background:#3182F6}
li b{color:#191F28;font-weight:700}

/* 대표님이 쓰신 말 */
.q{border-left:4px solid #101B29;padding:10px 0 10px 15px;margin-bottom:13px}
.q .t{font-size:16px;font-weight:700;color:#191F28;line-height:1.6;letter-spacing:-.02em}
.q .s{font-size:11.5px;color:#8B95A1;font-weight:600;margin-top:5px}
.q .s b{color:#3182F6}

/* 목업 — 아침 보고 */
.mk{border-radius:16px;overflow:hidden;background:#0B1220;padding:20px 22px;color:#fff}
.mk-k{font-size:11px;font-weight:900;letter-spacing:.5px;color:#93C5FD}
.mk-h{font-size:24px;font-weight:900;letter-spacing:-.03em;margin-top:4px;line-height:1.3}
.mk-h em{font-style:normal;color:#FCA5A5}
.mk-y{background:#152033;border:1.5px solid #223349;border-radius:13px;padding:12px;
  margin:13px 0;display:flex;gap:6px}
.mk-y div{flex:1;text-align:center}
.mk-y b{display:block;font-size:21px;font-weight:900;line-height:1.1}
.mk-y span{display:block;font-size:10.5px;font-weight:800;color:#7E93AA;margin-top:3px}
.mk-l{background:#132033;border:1px solid #223349;border-radius:11px;padding:10px 12px;
  margin-bottom:6px;display:flex;align-items:center;gap:9px}
.mk-l .e{font-size:15px;flex:none}
.mk-l .tx{flex:1;font-size:13.5px;font-weight:700;line-height:1.45}
.mk-l .tx em{display:block;font-style:normal;font-size:11.5px;color:#9FB6CC;
  font-weight:600;margin-top:2px}
.mk-l .go{font-size:11px;font-weight:800;color:#93C5FD;background:#1B2C45;
  border-radius:7px;padding:4px 9px;flex:none}
.mk-l.big{background:#16263D;border-color:#2E4A6B;padding:13px 14px}
.mk-l.big .tx{font-size:15px}
.mk-l.late{background:#2A1520;border-color:#5B2233}
.mk-more{font-size:12px;color:#7E93AA;font-weight:700;text-align:center;padding:7px}
.mk-off{margin-top:12px;display:flex;gap:14px;font-size:11.5px;color:#7E93AA;font-weight:600}
.mk-off b{color:#FCA5A5}
.mk-btn{margin-top:11px;background:#3182F6;border-radius:11px;padding:11px;
  text-align:center;font-size:14.5px;font-weight:800}
.mk-cap{font-size:12px;font-weight:800;margin-bottom:7px}
.cap-no{color:#C0392B}.cap-ok{color:#0F7B4F}

/* 카톡 */
.kk{background:#B2C7DA;border-radius:14px;padding:16px}
.kk-b{background:#fff;border-radius:12px;padding:13px 15px;max-width:96%}
.kk-t{font-size:13.5px;line-height:1.7;color:#191F28;font-weight:600}
.kk-t b{font-weight:800}
.kk-n{font-size:11px;color:#4E5968;font-weight:700;margin-bottom:6px}
"""
LOGO = ('<svg viewBox="0 0 240 220" fill="currentColor"><path d="M120 26 212 190 168 190 '
        '120 104 72 190 28 190Z"/><path d="M120 120 176 214 146 214 120 168 94 214 64 214Z"/></svg>')


def head(n, tot=4):
    return f'''<div class="hd"><div class="bi">{LOGO}
    <div class="bw">APEX <span>YUN PRO</span></div></div>
    <div class="pt">고객 한 장 — 한 사람을 꾸준히<br>{n} / {tot}</div></div>'''


FOOT = ('<div class="ft"><b>에이플러스에셋 온탑본부 · 윤시현 사업단장</b> &nbsp;|&nbsp; '
        '인용한 문장은 모두 <b>앱 코드 주석에 실제로 적혀 있는 것</b>입니다. '
        '화면 목업은 제안이며 실제 화면과 다릅니다.')







CSS += """
/* 큰 틀 그림 */
.fw{width:100%;height:auto;display:block}
.fw-l{fill:#fff;stroke:#D6DBE0;stroke-width:1.6}
.fw-l5{fill:#101B29;stroke:#101B29}
.fw-n{fill:#8B95A1;font-size:12px;font-weight:800;letter-spacing:.04em}
.fw-t{fill:#191F28;font-size:19px;font-weight:800;letter-spacing:-.04em}
.fw-t5{fill:#fff}
.fw-s{fill:#4E5968;font-size:13.5px;font-weight:500}
.fw-s5{fill:#9FB6CC}
.fw-hub{fill:#EFF6FF;stroke:#3182F6;stroke-width:2.4}
.fw-ht{fill:#1B64DA;font-size:22px;font-weight:800;letter-spacing:-.04em}
.fw-hs{fill:#4E5968;font-size:13px;font-weight:600}
.fw-ar{fill:none;stroke:#C9CFD6;stroke-width:2.2}
.fw-loop{fill:none;stroke:#3182F6;stroke-width:2.4;stroke-dasharray:7 5}
.fw-lt{fill:#1B64DA;font-size:12.5px;font-weight:800}
.fw-r{fill:#F8FAFC;stroke:#E5E8EB;stroke-width:1.4}
.fw-rt{fill:#191F28;font-size:14px;font-weight:800;letter-spacing:-.03em}
.fw-rs{fill:#8B95A1;font-size:12px;font-weight:600}
"""


# ═══════════════════════════════ 큰 틀 그림
LAYERS = [
 ("1", "자료", "이미 쌓이고 있는 것",
  "고객 정보 · 통화 이력 · 상담 자료 · 계약 · 증권", False),
 ("2", "계산", "앱이 스스로 아는 것",
  "몇 년차 · 며칠째 · 나이 · 자녀 나이 · 갱신 · 만기", False),
 ("3", "판단", "다음 하나를 정한다",
  "지금 이 사람에게 무엇을 — 하나만", False),
 ("4", "실행", "열고 말한다",
  "처방(무엇을 열지) · 할 말 · ✉ 문자", False),
 ("5", "기록", "알게 된 것 한 줄",
  "이 한 줄이 다시 ①로 돌아간다", True),
]
RHY = [("오늘", "아침 세 줄", "누구부터"),
       ("분기", "열두 번", "안 만난 사람"),
       ("3년", "연차 셋", "믿음 → 확장 → 소개")]


def frame():
    W, H = 1130, 560
    P = [f'<svg class="fw" viewBox="0 0 {W} {H}" role="img" '
         f'aria-label="한 사람을 관리하는 다섯 층과 세 리듬">']
    # 왼쪽 — 세 리듬
    for i, (a, b, c) in enumerate(RHY):
        y = 62 + i * 96
        P.append(f'<rect class="fw-r" x="14" y="{y}" width="196" height="76" rx="14"/>')
        P.append(f'<text class="fw-rt" x="32" y="{y+29}">{a} · {b}</text>')
        P.append(f'<text class="fw-rs" x="32" y="{y+52}">{c}</text>')
        P.append(f'<path class="fw-ar" d="M210 {y+38} H 246" marker-end="url(#fa)"/>')
    # 가운데 — 고객 한 장
    P.append('<rect class="fw-hub" x="250" y="150" width="212" height="150" rx="20"/>')
    P.append('<text class="fw-ht" x="356" y="205" text-anchor="middle">고객 한 장</text>')
    P.append('<text class="fw-hs" x="356" y="234" text-anchor="middle">한 사람 = 한 화면</text>')
    P.append('<text class="fw-hs" x="356" y="256" text-anchor="middle">여기서만 봅니다</text>')
    P.append('<path class="fw-ar" d="M462 225 H 498" marker-end="url(#fa)"/>')
    # 오른쪽 — 다섯 층
    for i, (n, t, s, d, dark) in enumerate(LAYERS):
        y = 26 + i * 100
        cl = " fw-l5" if dark else ""
        tc = " fw-t5" if dark else ""
        sc = " fw-s5" if dark else ""
        P.append(f'<rect class="fw-l{cl}" x="502" y="{y}" width="566" height="80" rx="14"/>')
        P.append(f'<text class="fw-n{sc}" x="524" y="{y+30}">{n}</text>')
        P.append(f'<text class="fw-t{tc}" x="524" y="{y+52}">{t}</text>')
        P.append(f'<text class="fw-s{sc}" x="524+{len(t)*20}" y="{y+51}">— {s}</text>'
                 .replace(f'x="524+{len(t)*20}"', f'x="{524+len(t)*21+14}"'))
        P.append(f'<text class="fw-s{sc}" x="524" y="{y+72}">{d}</text>')
        if i < 4:
            P.append(f'<path class="fw-ar" d="M785 {y+80} V {y+100}" marker-end="url(#fa)"/>')
    # 되돌아가는 고리 — 5 에서 1 로
    # ⑤ 에서 ① 로 — 상자 바깥으로 돌린다
    P.append('<path class="fw-loop" d="M1068 466 H 1100 V 66 H 1068" marker-end="url(#fb)"/>')
    P.append('<text class="fw-lt" x="1114" y="266" text-anchor="middle" '
             'transform="rotate(90 1114 266)">쌓일수록 좋아집니다</text>')
    P.append('<defs>'
             '<marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
             'markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#C9CFD6"/></marker>'
             '<marker id="fb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
             'markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#3182F6"/></marker>'
             '</defs>')
    P.append('</svg>')
    return "\n".join(P)


P1 = f'''<div class="pg">
{head(1)}
<h1>큰 틀 — 한 사람 한 장</h1>
<p class="sub">지금까지 이야기한 것들이 <b>흩어진 기능 여럿</b>이 아니라
<b>한 사람 둘레를 도는 하나</b>라는 것을 그려 봤습니다.
가운데는 <b>고객 한 장</b>이고, 나머지는 전부 그것을 채우거나 그것에서 나옵니다.</p>

<div class="sec">{frame()}</div>

<div class="sec"><h2>이 틀의 핵심은 ⑤ 가 ① 로 돌아가는 것입니다</h2>
<div class="row">
  <div class="bx dark" style="flex:1.3"><div class="k">고리가 있으면</div>
    <div class="v">쓸수록 좋아집니다</div>
    <p>터치할 때마다 <b>알게 된 것 한 줄</b>이 쌓입니다.
    그 한 줄이 다음 터치를 <b>더 쉽게</b> 만듭니다.
    반년이면 「무슨 말로 걸지」를 <b>고민할 필요가 없어집니다</b> —
    그 사람에 대해 아는 게 열 줄이니까요.</p></div>
  <div class="bx red"><div class="k">고리가 없으면</div>
    <div class="v">3년 뒤에도 똑같습니다</div>
    <p>지금이 그렇습니다. 터치하면 <b>그걸로 끝</b>입니다.
    그래서 3년 뒤에도 <b>여전히 뉴스로</b> 터치하게 됩니다.</p></div>
</div>
<p class="note"><b>그래서 ⑤ 를 제일 쉽게 만들어야 합니다.</b>
칸 여러 개짜리 폼이면 아무도 안 씁니다. <b>한 줄</b>이어야 합니다 —
그리고 그 한 줄을 <b>안 쓰면 다음 칸으로 못 넘어가게</b> 하는 게 아니라,
<b>쓰면 다음이 편해지게</b> 만들어야 합니다.</p></div>

<div class="sec"><h2>세 리듬은 「누구를」만 정합니다</h2>
<table>
<thead><tr><th style="width:150px">리듬</th><th style="width:230px">무엇을 고르나</th>
<th>어디로 보내나</th></tr></thead>
<tbody>
<tr><td><b>오늘</b> · 아침 세 줄</td><td>오늘 손댈 <b>세 사람</b></td>
  <td rowspan="3" style="vertical-align:middle;background:#EFF6FF">
    <b style="font-size:15px">전부 「고객 한 장」으로 들어갑니다.</b><br>
    누구를 고르는 방법만 셋이고, <b>그다음은 하나</b>입니다.<br>
    그래서 설계사가 외울 것은 <b>화면 하나</b>뿐입니다.</td></tr>
<tr><td><b>분기</b> · 열두 번</td><td>이번 분기 <b>아직 안 만난 사람</b></td></tr>
<tr><td><b>3년</b> · 연차 셋</td><td>연차가 <b>바뀐 사람</b> · 변한 것이 있는 사람</td></tr>
</tbody></table></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 2쪽 — 고객 한 장 목업
P2 = f'''<div class="pg">
{head(2)}
<h1>고객 한 장 — 이렇게 생깁니다</h1>
<p class="sub">고객 365일의 고객 하나를 열면 나오는 화면입니다.
<b>위에서 아래로 읽으면</b> 오늘 무엇을 할지가 정해집니다.</p>

<div class="sec">
<div class="mock" style="background:#F8FAFC;color:#191F28;border:1.5px solid #D6DBE0;padding:0">
  <div style="background:#101B29;padding:16px 20px;display:flex;
    justify-content:space-between;align-items:center;flex-wrap:wrap;gap:9px">
    <div>
      <div style="font-size:21px;font-weight:900;color:#fff;letter-spacing:-.03em">홍*동 님</div>
      <div style="font-size:12.5px;color:#9FB6CC;font-weight:600;margin-top:3px">
        48세 · 서울 강남 · <b style="color:#6EE7B7">동의 완료</b></div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <span style="background:#1B2C45;color:#93C5FD;font-size:12px;font-weight:800;
        border-radius:8px;padding:6px 11px">2년차 7개월</span>
      <span style="background:#2A1520;color:#FCA5A5;font-size:12px;font-weight:800;
        border-radius:8px;padding:6px 11px">87일째 조용</span>
    </div>
  </div>

  <div style="padding:16px 20px">
    <div style="font-size:11.5px;font-weight:900;color:#C0392B;letter-spacing:.04em">
      ② 계산 · 올해 변한 것</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 16px">
      <span style="background:#FFF5F5;border:1px solid #F5C2C7;border-radius:9px;
        padding:7px 12px;font-size:13px;font-weight:700">🎂 생일 D-12</span>
      <span style="background:#FFF5F5;border:1px solid #F5C2C7;border-radius:9px;
        padding:7px 12px;font-size:13px;font-weight:700">👦 첫째 중학교 진학</span>
      <span style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:9px;
        padding:7px 12px;font-size:13px;font-weight:700">🔁 실손 갱신 내년 3월</span>
    </div>

    <div style="font-size:11.5px;font-weight:900;color:#8B95A1;letter-spacing:.04em">
      ① 자료 · 아는 것</div>
    <div style="background:#fff;border:1px solid #E5E8EB;border-radius:12px;
      padding:12px 14px;margin:8px 0 16px;font-size:13.5px;line-height:1.75">
      배우자와 자녀 둘(중2 · 초5) · 부모님 두 분 생존 · 대출 잔액 부담<br>
      계약 2건 — 본인 종합(2024-03) · 배우자 실손(2025-01)<br>
      해 준 것 — 실손 청구 3건 대행 · 보장분석 2회<br>
      <span style="color:#8B95A1">지난 이야기 — 어머님 수술(2025-06)</span></div>

    <div style="background:#EFF6FF;border:2px solid #3182F6;border-radius:13px;padding:14px 16px">
      <div style="font-size:11.5px;font-weight:900;color:#1B64DA;letter-spacing:.04em">
        ③ 판단 · 다음 하나</div>
      <div style="font-size:17px;font-weight:800;letter-spacing:-.03em;margin:6px 0 4px">
        생일 축하 + 첫째 진학 이야기</div>
      <div style="font-size:13px;color:#4E5968;font-weight:500;line-height:1.6">
        2년차는 <b>가족으로 넓히는 해</b>입니다. 생일이 12일 남았고 첫째가 진학합니다 —
        <b>두 가지가 겹치는 지금</b>이 가장 좋은 때입니다.</div>
    </div>

    <div style="font-size:11.5px;font-weight:900;color:#0F7B4F;letter-spacing:.04em;
      margin-top:16px">④ 실행</div>
    <div style="background:#fff;border:1px solid #E5E8EB;border-radius:12px;
      padding:12px 14px;margin-top:8px">
      <div style="font-size:13.5px;line-height:1.7">
        「생일 축하드립니다. 그리고 첫째가 올해 중학교 가죠?<br>
        학비 준비는 어떻게 하고 계신지 한번 여쭤보고 싶어서요.」</div>
      <div style="display:flex;gap:6px;margin-top:11px;flex-wrap:wrap">
        <span style="background:#3182F6;color:#fff;font-size:12.5px;font-weight:800;
          border-radius:8px;padding:7px 13px">✉ 문자</span>
        <span style="background:#F1F5F9;color:#475569;font-size:12.5px;font-weight:800;
          border-radius:8px;padding:7px 13px">복사</span>
        <span style="background:#F1F5F9;color:#475569;font-size:12.5px;font-weight:800;
          border-radius:8px;padding:7px 13px">재무설계 계산기 열기 ↗</span>
      </div>
    </div>

    <div style="background:#F2FBF6;border:1.5px solid #A7E3C0;border-radius:13px;
      padding:13px 16px;margin-top:14px">
      <div style="font-size:11.5px;font-weight:900;color:#0F7B4F;letter-spacing:.04em">
        ⑤ 기록 · 오늘 알게 된 것 한 줄</div>
      <div style="background:#fff;border:1.5px solid #A7E3C0;border-radius:9px;
        padding:10px 12px;margin-top:8px;font-size:13.5px;color:#8B95A1">
        예) 첫째 학원비 월 80만원 부담된다고 하심<span style="color:#0F7B4F">│</span></div>
      <div style="font-size:12px;color:#4E5968;font-weight:600;margin-top:8px">
        이 한 줄이 <b>다음 통화의 첫마디</b>가 됩니다. 안 쓰셔도 되지만, 쓰면 다음이 편합니다.</div>
    </div>
  </div>
</div>
</div>

<p class="note"><b>새로 만드는 칸은 ②③⑤ 셋뿐입니다.</b>
①은 고객 365일에 <b>이미 있고</b>, ④는 처방전과 문자로 <b>이미 만들었습니다.</b>
②는 있는 값으로 <b>계산만</b> 하면 되고, ③은 ②와 연차를 보고 <b>고르는 규칙</b>이며,
⑤는 <b>입력칸 하나</b>입니다.</p>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 3쪽 — 다섯 층 상세
L = [
 ("①", "자료", "#8B95A1",
  ["고객 정보 — 연락처 · 출생연도 · 성별 · 소득 · 메모", "통화 이력 — CRM 에서 넘어옴",
   "저장된 상담 자료 — 보장분석 · 비포&애프터 · 재무설계", "보장분석 문서 · 담보 · 동의 상태"],
  "<b>거의 다 있습니다.</b> 계약일과 생월일 두 칸만 없습니다",
  "있음"),
 ("②", "계산", "#C0392B",
  ["몇 년차 몇 개월 — <b>계약일</b>에서", "며칠째 조용 — 마지막 접점에서",
   "나이 · 자녀 나이 — 출생연도와 메모에서", "갱신 · 만기 — 계약일과 증권에서"],
  "값은 다 있는데 <b>계산해서 보여 주는 자리가 없습니다</b>",
  "만들 것"),
 ("③", "판단", "#1B64DA",
  ["연차(1·2·3년차)가 <b>무엇을 할 해</b>인지 정합니다",
   "변한 것 중 <b>가장 가까운 하나</b>를 고릅니다",
   "겹치면 겹치는 것을 먼저 — 생일 + 진학처럼",
   "아무것도 없으면 <b>「올해는 조용해도 됩니다」</b>"],
  "규칙 열 줄이면 됩니다. <b>AI 가 아니라 규칙</b>으로 — 틀려도 이유를 알 수 있게",
  "만들 것"),
 ("④", "실행", "#0F7B4F",
  ["무엇을 열지 — <b>처방전</b>이 이미 합니다",
   "뭐라고 할지 — 문구를 만들어 줍니다",
   "<b>✉ 문자 · 복사</b> — 이미 넣었습니다",
   "화면 열기 — 처방전에서 이어집니다"],
  "<b>이미 만들었습니다.</b> 고객 한 장에서 부르기만 하면 됩니다",
  "있음"),
 ("⑤", "기록", "#0F7B4F",
  ["<b>한 줄</b>입니다. 폼이 아닙니다", "안 써도 넘어갑니다 — 막지 않습니다",
   "쓴 줄은 <b>①의 「지난 이야기」</b>로 들어갑니다",
   "다음에 이 사람을 열면 <b>맨 위에</b> 보입니다"],
  "<b>이 층이 전부를 살립니다.</b> 없으면 3년 뒤에도 똑같습니다",
  "만들 것"),
]
rows = "".join(
    f'''<tr><td style="width:78px"><b style="color:{c};font-size:17px">{n}</b><br>
    <b>{t}</b></td>
    <td style="width:400px"><ul style="margin:0">{"".join(f"<li>{x}</li>" for x in items)}</ul></td>
    <td>{note}</td>
    <td style="width:74px;text-align:center">
      <b style="color:{'#0F7B4F' if st=='있음' else '#C0392B'}">{st}</b></td></tr>'''
    for n, t, c, items, note, st in L)

P3 = f'''<div class="pg">
{head(3)}
<h1>다섯 층 — 무엇이 있고 무엇을 만드나</h1>
<p class="sub">다섯 층 중 <b>둘은 이미 있습니다.</b>
새로 만드는 것은 <b>②계산 · ③판단 · ⑤기록</b> 셋뿐입니다.</p>

<div class="sec">
<table>
<thead><tr><th>층</th><th>무엇이 들어가나</th><th>지금 상태</th>
<th style="text-align:center">만드나</th></tr></thead>
<tbody>{rows}</tbody>
</table></div>

<div class="sec"><h2>③ 판단은 AI 로 하지 마시죠 — 규칙으로</h2>
<div class="row">
  <div class="bx red"><div class="v">✕ AI 에게 맡기면</div>
    <p>왜 그 사람을 고르라고 했는지 <b>설명이 안 됩니다.</b>
    한 번 이상하면 <b>그다음부터 안 믿습니다</b></p></div>
  <div class="bx grn" style="flex:1.4"><div class="v">✓ 규칙이면</div>
    <p><b>「생일 30일 안 → 축하」 「연차 2년 + 자녀 진학 → 교육자금」</b>
    처럼 열 줄이면 됩니다. 틀리면 <b>어느 줄이 틀렸는지</b> 보이고 고칠 수 있습니다.<br><br>
    AI 는 <b>④의 문구를 다듬는 데</b>만 쓰세요 — 거기서는 틀려도 사람이 읽고 고칩니다.</p></div>
</div></div>

<div class="sec"><h2>「관리가 됐다」는 뜻 — 층마다 다릅니다</h2>
<table>
<thead><tr><th style="width:130px">언제</th><th style="width:250px">이러면 된 것</th>
<th>어디서 보나</th></tr></thead>
<tbody>
<tr><td><b>오늘</b></td><td>아침 세 줄이 <b>0</b> 이 됐다</td><td>아침 보고 · 오늘의 알림</td></tr>
<tr><td><b>한 사람</b></td><td>⑤ <b>한 줄이 쌓였다</b></td><td>고객 한 장 · 지난 이야기</td></tr>
<tr><td><b>분기</b></td><td>이번 분기 <b>안 만난 사람이 0</b></td><td>분기 판</td></tr>
<tr><td><b>1년</b></td><td>연차가 올라가며 <b>할 일이 바뀌었다</b></td><td>고객 한 장 · 연차 딱지</td></tr>
<tr class="" style="background:#EFF6FF"><td><b>3년</b></td>
  <td><b>인수인계 한 장이 채워졌다</b></td>
  <td>고객 한 장 — 여섯 줄이 다 차면 그게 인수인계서입니다</td></tr>
</tbody></table>
<p class="note"><b>맨 아래 줄이 목적지입니다.</b> 나머지 넷은 거기 가려고 있는 것입니다.
그리고 <b>따로 만들 것이 없습니다</b> — 고객 한 장이 채워지면 그게 인수인계 한 장입니다.</p></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 4쪽 — 만드는 순서
STEPS = [
 ("0단계", "이미 끝난 것", "—",
  "처방전 · 문자 보내기. <b>CRM 에 넣어 돌아가고 있습니다</b>", "grn"),
 ("1단계", "칸 두 개", "반나절",
  "<b>계약일 · 생월일</b>. 이게 없으면 ②가 계산을 못 합니다", ""),
 ("2단계", "② 계산 — 연차와 변한 것", "이삼 일",
  "고객 한 장 위쪽에 <b>딱지로</b>. 「2년차 7개월」 「생일 D-12」", ""),
 ("3단계", "⑤ 기록 한 줄", "하루",
  "<b>여기서 고리가 닫힙니다.</b> 2단계보다 먼저 해도 됩니다", ""),
 ("4단계", "③ 판단 — 다음 하나", "이삼 일",
  "규칙 열 줄. <b>②가 있어야</b> 만들 수 있습니다", ""),
 ("5단계", "분기 판", "하루",
  "30일 고객관리의 <b>기간만</b> 바꿉니다", ""),
 ("6단계", "인수인계 한 장", "이삼 일",
  "①~⑤가 쌓이면 <b>모아서 보여 주기만</b> 하면 됩니다", "grn"),
]
srows = "".join(
    f'''<tr{' style="background:#F2FBF6"' if c else ''}>
    <td><b>{a}</b></td><td><b>{b}</b></td><td>{t}</td><td>{d}</td></tr>'''
    for a, b, t, d, c in STEPS)

P4 = f'''<div class="pg">
{head(4)}
<h1>만드는 순서</h1>
<p class="sub">전부 <b>2~3주</b>면 됩니다. 새 표는 하나도 안 만듭니다 —
전부 지금 쓰는 자리에 얹습니다.</p>

<div class="sec">
<table>
<thead><tr><th style="width:82px">순서</th><th style="width:210px">무엇을</th>
<th style="width:96px">드는 시간</th><th>왜 이 순서인가</th></tr></thead>
<tbody>{srows}</tbody>
</table>
<p class="note"><b>1단계를 건너뛰면 나머지가 전부 막힙니다.</b>
계약일이 없으면 연차를 못 세고, 연차를 못 세면 ③이 판단을 못 합니다.
<b>칸 두 개가 반나절</b>인데 이게 전부의 뿌리입니다.</p></div>

<div class="sec"><h2>먼저 확인하실 것 — 제가 모르는 것들</h2>
<div class="row">
  <div class="bx"><div class="k">01</div><div class="v">계약일이 어디 있습니까</div>
    <p>CRM 에 <b>「계약일」 라벨</b>은 있는데 고객 365일에는 안 보입니다.
    <b>둘을 잇는 게 맞는지</b>, 아니면 고객 365일에 따로 적을지 정하셔야 합니다</p></div>
  <div class="bx"><div class="k">02</div><div class="v">연차 셋이 맞습니까</div>
    <p>믿음 → 확장 → 소개로 잡았는데 <b>실제로 그렇게 흘러가는지</b>는
    대표님이 아십니다. 4년차 이후는 어떻게 되는지도요</p></div>
  <div class="bx"><div class="k">03</div><div class="v">분기가 맞습니까</div>
    <p>석 달에 한 번으로 잡았는데, 고객 수에 따라
    <b>두 달이나 넉 달</b>이 맞을 수도 있습니다</p></div>
</div></div>

<div class="sec"><h2>이 틀이 지키는 것 — 넷</h2>
<table>
<tbody>
<tr><td style="width:210px"><b>화면 하나만 외웁니다</b></td>
  <td>누구를 고르는 길은 셋(오늘·분기·3년)이지만
  <b>들어가는 곳은 「고객 한 장」 하나</b>입니다</td></tr>
<tr><td><b>다음 하나만 정해 줍니다</b></td>
  <td>목록을 주지 않습니다. <b>이 사람에게 지금 무엇을</b> 하나만</td></tr>
<tr><td><b>쓸수록 좋아집니다</b></td>
  <td>⑤가 ①로 돌아갑니다. <b>이 고리가 없으면 3년 뒤에도 똑같습니다</b></td></tr>
<tr><td><b>사람이 나가도 남습니다</b></td>
  <td>채워진 고객 한 장이 곧 <b>인수인계서</b>입니다.
  따로 만들 것이 없습니다</td></tr>
</tbody></table></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:21px;line-height:1.5;margin-top:3px">
  기능을 늘리는 게 아니라 <b style="color:#60A5FA">한 사람 둘레로 모으는</b> 일입니다.<br>
  <b style="color:#60A5FA">한 사람 = 한 장</b>, 그 장에서 <b style="color:#60A5FA">다음 하나</b>만 정해 주고,<br>
  하고 나면 <b style="color:#60A5FA">한 줄이 쌓이게</b> 하는 것 — 이게 전부입니다.</div>
</div>

{FOOT}</div>
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>고객 한 장 — 한 사람을 꾸준히</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}{P4}</body></html>')
open("one.html", "w", encoding="utf8").write(HTML)
print(f"one.html {len(HTML.encode())/1024:.0f}KB")
