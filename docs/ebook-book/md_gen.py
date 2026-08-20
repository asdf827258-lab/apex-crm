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
    <div class="pt">폰 모드 · 웹 모드<br>{n} / {tot}</div></div>'''


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



CSS += """
/* 폰 목업 */
.ph{width:300px;border:9px solid #101B29;border-radius:32px;overflow:hidden;
  background:#F7F9FB;flex:none}
.ph-top{background:#101B29;color:#fff;padding:9px 14px;font-size:11px;font-weight:800;
  display:flex;justify-content:space-between}
.ph-b{padding:12px}
.ph-d{font-size:11px;font-weight:900;color:#8B95A1;letter-spacing:.04em;margin:11px 0 6px}
.ph-d:first-child{margin-top:0}
.ph-c{background:#fff;border:1px solid #E5E8EB;border-radius:12px;padding:10px 12px;
  margin-bottom:6px}
.ph-c .t{font-size:13.5px;font-weight:800;letter-spacing:-.03em;line-height:1.35}
.ph-c .s{font-size:11.5px;color:#8B95A1;font-weight:600;margin-top:3px;line-height:1.45}
.ph-c.hot{border-color:#F5C2C7;background:#FFF5F5}
.ph-c.now{border:2px solid #3182F6;background:#EFF6FF}
.ph-tag{display:inline-block;font-size:10px;font-weight:800;border-radius:5px;
  padding:2px 6px;margin-right:4px}
.tg-b{background:#EFF6FF;color:#1B64DA}.tg-r{background:#FEE2E2;color:#C0392B}
.tg-g{background:#DCFCE7;color:#0F7B4F}
.ph-bar{display:flex;gap:4px;margin-top:8px}
.ph-bar span{flex:1;text-align:center;font-size:10.5px;font-weight:800;
  background:#F1F5F9;color:#475569;border-radius:7px;padding:5px 0}
.ph-bar span.on{background:#3182F6;color:#fff}
.ph-nav{display:flex;background:#fff;border-top:1px solid #E5E8EB}
.ph-nav div{flex:1;text-align:center;padding:9px 0;font-size:10.5px;font-weight:800;color:#8B95A1}
.ph-nav div.on{color:#3182F6}
.ph-nav b{display:block;font-size:15px;font-weight:400}
"""



CSS += """
.bpbar{display:flex;gap:2px;margin:10px 0 4px;align-items:flex-end}
.bpbar span{flex:1;background:#FEE2E2;border-radius:3px 3px 0 0;position:relative}
.bpbar span b{position:absolute;bottom:-17px;left:0;right:0;text-align:center;
  font-size:9.5px;color:#8B95A1;font-weight:700}
.bp2{display:flex;gap:2px;margin:10px 0 4px;align-items:flex-end}
.bp2 span{flex:1;background:#DCFCE7;border-radius:3px 3px 0 0;position:relative}
.bp2 span b{position:absolute;bottom:-17px;left:0;right:0;text-align:center;
  font-size:9.5px;color:#8B95A1;font-weight:700}
"""


BP = [1180, 1080, 900, 880, 820, 760, 720, 700, 640, 560, 520, 420]
bars = "".join(f'<span style="height:{18+i*3}px"><b>{p}</b></span>'
               for i, p in enumerate(reversed(BP)))

P1 = f'''<div class="pg">
{head(1)}
<h1>지금은 「모드」가 아닙니다</h1>
<p class="sub">폰에서 불편한 진짜 이유를 찾았습니다.
<b>폰 화면이 따로 있는 게 아니라 PC 화면이 조금씩 줄어드는</b> 것이었습니다.</p>

<div class="sec"><h2>앱이 화면을 가르는 폭 — 열두 군데</h2>
<div class="bpbar">{bars}</div>
<div style="height:20px"></div>
<p class="note">폭이 <b>1180 · 1080 · 900 · 880 · 820 · 760 · 720 · 700 · 640 · 560 · 520 · 420</b>
열두 군데에서 조금씩 달라집니다. <b>DB 통합 CRM 은 넷뿐</b>입니다(1050 · 760 · 640 · 460).<br>
이건 <b>「폰용으로 만든 것」이 아니라 「좁아지면 줄이는 것」</b>입니다.
그래서 폰에서 열면 <b>작아진 PC 화면</b>이 나옵니다.</p></div>

<div class="sec"><h2>그래서 두 모드로 확실히 가릅니다</h2>
<div class="row">
  <div class="bx" style="flex:1;border-top:4px solid #8B95A1">
    <div class="k">웹 모드 · PC</div><div class="v">보고 판단하는 곳</div>
    <p><b>넓게 · 여러 개를 한눈에 · 표로.</b><br>
    타율을 보고, 팀을 보고, 계획을 세우고, 자료를 만듭니다.<br><br>
    <b>키보드가 있습니다.</b> 여러 건을 이어서 칩니다.</p></div>
  <div class="bx dark" style="flex:1;border-top:4px solid #3182F6">
    <div class="k">폰 모드</div><div class="v">하고 기록하는 곳</div>
    <p><b>하나씩 · 크게 · 카드로.</b><br>
    오늘 걸 사람을 보고, 걸고, 30초 안에 남기고, 문자를 보냅니다.<br><br>
    <b>엄지뿐입니다.</b> 타이핑은 <b>지는 싸움</b>입니다.</p></div>
</div>
<p class="note"><b>「폰은 화면이 작으니 줄인다」가 아닙니다.</b>
폰은 <b>한 번에 하나만 보면 되니까 오히려 크게</b> 만듭니다 —
말씀하신 그대로입니다. 적게 보여 주고 <b>큼직하게</b>.</p></div>

<div class="sec"><h2>가르는 폭은 하나로 — 720px</h2>
<div class="bp2">
  <span style="height:52px"><b>720px 미만 · 폰 모드</b></span>
  <span style="height:52px"><b>720px 이상 · 웹 모드</b></span>
</div>
<div style="height:20px"></div>
<div class="row">
  <div class="bx"><div class="k">왜 폭으로 가르나</div><div class="v">기기 판별은 계속 틀립니다</div>
    <p>태블릿 · 폴더블 · 「데스크톱 사이트로 보기」 —
    <b>기기 이름으로는 못 맞춥니다.</b> 폭이 정직합니다</p></div>
  <div class="bx"><div class="k">그래도 애매하면</div><div class="v">사람이 바꿉니다</div>
    <p>설정에 <b>「화면 모드 — 자동 · 폰 · 웹」</b>.
    <b>이 기기에만</b> 기억합니다. 큰 폰 쓰는 분은 손으로 고정하면 됩니다</p></div>
  <div class="bx red"><div class="k">하지 말 것</div><div class="v">열두 폭 유지</div>
    <p>지금 것을 그대로 두고 폰 모드를 <b>덧붙이면</b>
    <b>열세 번째 폭</b>이 됩니다. <b>720 하나로 모아야</b> 합니다</p></div>
</div></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 2쪽 — 화면별로 무엇이 다른가
SCR = [
 ("DB 관리", "표 열세 칸 · 거르개 넷 · 여러 건을 눈으로 견줌",
  "<b>카드 한 장에 한 사람.</b> 이름 · 며칠째 · 다음 할 일.<br>거르개는 <b>칩 넷</b>으로 접어 둠"),
 ("TA 결과 기록", "화법 패널 + 입력칸이 한 창에",
  "<b>한 번에 한 칸.</b> 결과 → 메모 → 약속 순서로 넘김"),
 ("오늘의 알림", "카드 목록 · 오른쪽에 단추",
  "<b>거의 그대로.</b> 단추만 <b>아래쪽</b>으로 — 엄지가 닿게"),
 ("KPI·타율 분석", "표와 그래프를 나란히",
  "<b>숫자 넷만.</b> 자세히는 <b>「웹에서 보세요」</b>"),
 ("담당자·팀 통계", "표 열 칸",
  "<b>폰에서 안 엽니다.</b> 리더가 PC 에서 볼 것"),
 ("고객 365일", "왼쪽 목록 + 오른쪽 상세",
  "<b>목록 → 누르면 상세.</b> 뒤로가기로 돌아옴"),
 ("보장분석 상담자료", "16장 슬라이드 · 고객과 함께",
  "<b>가로로 돌려서.</b> 고객에게 보여 주는 화면은 <b>폰 세로로 안 됩니다</b>"),
 ("성장판 · 도구 88칸", "전부",
  "<b>폰에서는 덜 씁니다.</b> 열리되 <b>웹을 권하는 한 줄</b>"),
]
rows = "".join(
    f'''<tr><td style="width:150px"><b>{a}</b></td>
    <td style="width:290px;color:#8B95A1">{b}</td><td>{c}</td></tr>'''
    for a, b, c in SCR)

P2 = f'''<div class="pg">
{head(2)}
<h1>화면마다 무엇이 달라지나</h1>
<p class="sub">전부 다시 만들지 않습니다. <b>폰에서 실제로 쓰는 것</b>만 손보고,
나머지는 <b>「웹에서 보세요」</b> 한 줄이면 됩니다.</p>

<div class="sec">
<table>
<thead><tr><th>화면</th><th>웹 모드 (지금)</th><th>폰 모드</th></tr></thead>
<tbody>{rows}</tbody>
</table>
<p class="note"><b>「폰에서 안 엽니다」를 적는 것이 중요합니다.</b>
전부 폰에서 되게 만들려다 <b>전부 어중간해집니다.</b>
담당자·팀 통계는 <b>리더가 PC 에서 보는 것</b>이라고 못박으면
그 화면에 시간을 안 써도 됩니다.</p></div>

<div class="sec"><h2>폰 모드에서 공통으로 바뀌는 것 — 여섯</h2>
<div class="row">
  <div class="bx"><div class="k">01</div><div class="v">표 → 카드</div>
    <p>가로로 미는 것을 없앱니다. <b>한 사람 = 한 카드</b></p></div>
  <div class="bx"><div class="k">02</div><div class="v">단추는 아래로</div>
    <p>위는 보는 곳, <b>아래는 누르는 곳</b>. 엄지가 닿는 자리</p></div>
  <div class="bx"><div class="k">03</div><div class="v">글자는 키웁니다</div>
    <p>본문 <b>16px 이상</b>. 폰이라고 작게 만들면 안 읽습니다</p></div>
</div>
<div class="row" style="margin-top:11px">
  <div class="bx"><div class="k">04</div><div class="v">한 화면에 한 가지</div>
    <p>옆에 나란히 두지 않습니다. <b>위아래로</b></p></div>
  <div class="bx"><div class="k">05</div><div class="v">누르는 곳은 44px 이상</div>
    <p>작은 단추는 <b>안 눌립니다.</b> 손가락은 정확하지 않습니다</p></div>
  <div class="bx"><div class="k">06</div><div class="v">타이핑을 없앱니다</div>
    <p><b>다음 쪽에서 자세히.</b> 이게 제일 큽니다</p></div>
</div></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 3쪽 — 폰 기록 30초
P3 = f'''<div class="pg">
{head(3)}
<h1>폰에서 기록하는 법</h1>
<p class="sub">「끊고 30초 안에」가 폰에서는 <b>30초가 안 됩니다.</b>
타이핑 때문입니다. <b>타이핑을 없애면</b> 진짜 30초가 됩니다.</p>

<div class="sec"><div class="row" style="align-items:flex-start;gap:22px">
  <div class="ph">
    <div class="ph-top"><span>9:41</span><span>TA 결과 기록</span></div>
    <div class="ph-b">
      <div style="font-size:15px;font-weight:900;letter-spacing:-.03em">홍길동 · 서울 강남</div>
      <div style="font-size:11.5px;color:#8B95A1;font-weight:700;margin-top:2px">
        2차 통화 · 방금 끊음</div>

      <div class="ph-d">1 · 어떻게 끝났나</div>
      <div style="display:flex;gap:6px">
        <div style="flex:1;background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;
          padding:14px 0;text-align:center;font-size:14px;font-weight:900">부재</div>
        <div style="flex:1;background:#FEE2E2;border:1px solid #E5E8EB;border-radius:12px;
          padding:14px 0;text-align:center;font-size:14px;font-weight:900;color:#8B95A1">거절</div>
        <div style="flex:1;background:#DCFCE7;border:1px solid #E5E8EB;border-radius:12px;
          padding:14px 0;text-align:center;font-size:14px;font-weight:900;color:#8B95A1">상담</div>
      </div>

      <div class="ph-d">2 · 메모 <span style="color:#3182F6">(말해도 됩니다)</span></div>
      <div class="ph-c" style="padding:12px">
        <div style="display:flex;align-items:center;gap:9px">
          <div style="width:38px;height:38px;border-radius:50%;background:#3182F6;color:#fff;
            display:grid;place-items:center;font-size:17px;flex:none">🎤</div>
          <div style="font-size:12.5px;color:#8B95A1;font-weight:600;line-height:1.45">
            눌러서 말하면<br>글로 적힙니다</div>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px">
          <span class="ph-tag tg-b" style="font-size:11px;padding:5px 9px">저녁에 다시</span>
          <span class="ph-tag tg-b" style="font-size:11px;padding:5px 9px">가족 상의</span>
          <span class="ph-tag tg-b" style="font-size:11px;padding:5px 9px">자료 보내기로</span>
          <span class="ph-tag tg-b" style="font-size:11px;padding:5px 9px">＋</span>
        </div>
      </div>

      <div class="ph-d">3 · 다음</div>
      <div style="display:flex;gap:6px">
        <div style="flex:1;background:#EFF6FF;border:2px solid #3182F6;border-radius:12px;
          padding:11px 0;text-align:center;font-size:13px;font-weight:800">모레 저녁</div>
        <div style="flex:1;background:#fff;border:1px solid #E5E8EB;border-radius:12px;
          padding:11px 0;text-align:center;font-size:13px;font-weight:800;color:#8B95A1">
          날짜 고르기</div>
      </div>

      <div style="background:#3182F6;color:#fff;border-radius:13px;padding:15px;
        text-align:center;font-size:16px;font-weight:900;margin-top:14px">저장 · 30초 끝</div>
      <div style="text-align:center;font-size:11px;color:#8B95A1;font-weight:700;margin-top:8px">
        단톡 문구가 같이 복사됩니다</div>
    </div>
  </div>

  <div style="flex:1">
    <h2>타이핑을 없애는 네 가지</h2>
    <table>
    <tbody>
      <tr><td style="width:106px"><b>① 결과</b></td>
        <td><b>큰 단추 셋</b>(부재·거절·상담). 고르는 데 <b>1초</b>.
        지금은 목록에서 골라야 합니다</td></tr>
      <tr><td><b>② 메모</b></td>
        <td><b>말하면 적힙니다.</b> 음성 비서가 쓰는 받아쓰기를
        <b>그대로</b> 씁니다 — 새로 만들 것이 없습니다</td></tr>
      <tr><td><b>③ 자주 쓰는 말</b></td>
        <td>내가 <b>실제로 많이 쓴 메모</b>에서 뽑아 칩으로.
        「저녁에 다시」 「가족 상의」 — 누르면 들어갑니다</td></tr>
      <tr><td><b>④ 다음 약속</b></td>
        <td><b>「모레 저녁」</b> 같은 흔한 것을 단추로.
        정확한 날짜만 <b>폰 기본 달력</b>으로</td></tr>
    </tbody></table>

    <h2 style="margin-top:20px">받아쓰기는 이미 있습니다</h2>
    <div class="bx grn"><div class="v">음성 비서의 것을 그대로</div>
      <p>앱에 <b>음성 비서</b>가 있고 이미 <b>SpeechRecognition</b> 을 씁니다
      (「아펙스」 하고 부르는 그것). <b>같은 함수를 메모 칸에서 부르면</b> 됩니다 —
      새 라이브러리도, 서버도, 권한 설계도 필요 없습니다.</p>
      <p style="margin-top:9px"><b>다만</b> 아이폰은 말할 때마다
      <b>마이크 허락</b>을 다시 물을 수 있고, 조용한 곳이 아니면 잘 못 알아듣습니다.
      그래서 <b>고친 뒤 저장</b>하게 해야 하고, 칩(③)이 같이 있어야 합니다.</p></div>

    <div class="bx red" style="margin-top:11px"><div class="v">✕ 음성만 두면 안 됩니다</div>
      <p>차 안·사무실에서는 말하기 어렵습니다.
      <b>음성 · 칩 · 자판 셋을 다</b> 두고 <b>고르게</b> 하세요.
      하나만 강요하면 그 상황에서 안 쓰게 됩니다.</p></div>
  </div>
</div></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 4쪽 — 어떻게 만드나 · 순서
P4 = f'''<div class="pg">
{head(4)}
<h1>어떻게 만드나</h1>
<p class="sub">화면을 두 벌로 만들지 않습니다.
<b>같은 화면에 폰 모드를 얹습니다</b> — 두 벌이 되면 한쪽이 반드시 낡습니다.</p>

<div class="sec"><h2>몸에 딱지 하나 붙이는 것으로 끝냅니다</h2>
<div class="row">
  <div class="bx" style="flex:1.3"><div class="k">방법</div>
    <div class="v">body 에 「폰」 딱지</div>
    <p>폭이 720 미만이거나 사람이 폰으로 고정하면
    <b>body 에 딱지</b>를 붙입니다. 나머지는 전부 <b>그 딱지 아래</b>에서
    모양만 바꿉니다.</p>
    <p style="margin-top:9px"><b>미끼 레이더 · 상담자료가 이미 이렇게</b> 하고 있습니다 —
    <code>body.mikki-mode</code> 처럼요. <b>같은 방식</b>이라 낯설지 않습니다.</p></div>
  <div class="bx"><div class="k">고르는 자리</div><div class="v">설정 · 화면 모드</div>
    <p><b>자동 · 폰 · 웹</b> 셋. 기본은 자동.
    <b>이 기기에만</b> 기억합니다</p>
    <p style="margin-top:9px">웹 모드에서 폰으로 바꾸면
    <b>PC 에서도 폰 화면</b>이 나옵니다 — 만들면서 확인하기에 좋습니다</p></div>
</div>
<p class="note"><b>새 파일을 만들지 않습니다.</b> 지금 열두 폭을 <b>720 하나로 모으고</b>,
폰 모드에서 달라지는 것만 그 아래 적습니다.
<b>화면 두 벌은 절대 만들지 마세요</b> — 고칠 때마다 두 군데를 고쳐야 하고,
반드시 한쪽을 잊습니다.</p></div>

<div class="sec"><h2>순서 — 실제로 쓰는 것부터</h2>
<table>
<thead><tr><th style="width:76px">순서</th><th style="width:230px">무엇을</th>
<th style="width:96px">시간</th><th>왜 여기부터인가</th></tr></thead>
<tbody>
<tr style="background:#F2FBF6"><td><b>1</b></td>
  <td><b>모드 딱지 + 설정</b></td><td>하루</td>
  <td>이게 있어야 나머지를 <b>얹을 자리</b>가 생깁니다</td></tr>
<tr style="background:#F2FBF6"><td><b>2</b></td>
  <td><b>TA 결과 기록 폰 모드</b><br>
    <span style="font-size:11.5px;color:#8B95A1">단추 셋 · 음성 · 칩 · 다음</span></td>
  <td>이삼 일</td>
  <td><b>하루에 제일 많이 하는 일</b>입니다. 여기가 편해지면 나머지는 덤</td></tr>
<tr><td><b>3</b></td><td>DB 관리 표 → 카드</td><td>이삼 일</td>
  <td>2 를 하려면 <b>목록에서 그 사람을 찾아야</b> 합니다</td></tr>
<tr><td><b>4</b></td><td>오늘의 알림 단추 아래로</td><td>반나절</td>
  <td>이미 카드라 <b>손볼 게 적습니다</b></td></tr>
<tr><td><b>5</b></td><td>「웹에서 보세요」 한 줄</td><td>반나절</td>
  <td>통계·성장판 등에. <b>안 만들 것을 정하는 일</b>입니다</td></tr>
<tr><td><b>6</b></td><td>「오늘」 한 화면</td><td>이삼 일</td>
  <td>앞의 것들이 편해진 <b>뒤에</b> 묶습니다</td></tr>
</tbody></table>
<p class="note"><b>2 번이 이 문서의 핵심입니다.</b> 통화는 하루에 수십 번인데
기록이 폰에서 불편하면 <b>안 남깁니다.</b> 안 남기면 나머지 전부가 거짓말이 됩니다 —
오늘의 알림도, 타율도, 3년 관리도.</p></div>

<div class="sec"><h2>겹치지 않게 — 지금 상태</h2>
<table>
<tbody>
<tr><td style="width:210px"><b>main #251</b></td>
  <td>폰 홈 화면 · 지름길. <b>여는 길은 됐습니다</b> — 이 문서는 <b>연 다음</b> 이야기입니다</td></tr>
<tr><td><b>고객관리 세션</b></td>
  <td>3년 관리 규칙. <b>내용</b>은 그쪽, <b>폰에서 어떻게 보이나</b>는 여기 — 안 부딪힙니다</td></tr>
<tr><td><b>제가 넣은 것</b></td>
  <td>처방전 · 문자(db-crm.html). <b>폰 모드에서 자리만</b> 바뀝니다</td></tr>
<tr style="background:#FFF5F5"><td><b>주의</b></td>
  <td><b>CRM 폰 모드는 db-crm.html 을 크게 고칩니다.</b>
  다른 세션이 그 파일을 만지고 있으면 <b>먼저 정하고</b> 시작하세요</td></tr>
</tbody></table></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:20px;line-height:1.5;margin-top:3px">
  <b style="color:#60A5FA">웹은 보고 판단하는 곳, 폰은 하고 기록하는 곳.</b><br>
  폰은 작으니 줄이는 게 아니라 <b style="color:#60A5FA">하나만 보면 되니까 크게</b> 만듭니다.<br>
  <span style="font-size:15px;color:#9FB6CC">그리고 폰에서는 타이핑을 없앱니다 — 그게 30초를 지키는 유일한 길입니다.</span></div>
</div>

{FOOT}</div>
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>폰 모드 · 웹 모드</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}{P4}</body></html>')
open("md.html", "w", encoding="utf8").write(HTML)
print(f"md.html {len(HTML.encode())/1024:.0f}KB")
