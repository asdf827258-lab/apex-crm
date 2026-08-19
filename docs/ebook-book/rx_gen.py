# -*- coding: utf-8 -*-
"""「고객 처방전」 설계 문서 — A4 네 쪽. 목업 + 운영 방식."""
import sys
sys.stdout.reconfigure(encoding="utf8")
from rx_data import RX, FALLBACK
FONTS = open("fonts.css", encoding="utf8").read()

CSS = FONTS + """
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Pretendard,-apple-system,sans-serif;background:#fff;color:#191F28;
  -webkit-font-smoothing:antialiased}
.pg{width:1240px;height:1754px;padding:60px 64px;display:flex;flex-direction:column;background:#fff}
.hd{display:flex;justify-content:space-between;align-items:flex-start;
  border-bottom:3px solid #191F28;padding-bottom:16px;margin-bottom:24px}
.bi{display:flex;align-items:center;gap:10px}
.bi svg{width:27px;color:#191F28}
.bw{font-size:20px;font-weight:800;letter-spacing:-.05em}
.bw span{color:#3182F6}
.pt{font-size:12.5px;font-weight:700;color:#8B95A1;text-align:right;line-height:1.6}
h1{font-size:37px;font-weight:800;letter-spacing:-.05em;line-height:1.2;margin-bottom:9px}
.sub{font-size:16.5px;color:#4E5968;font-weight:500;line-height:1.65;margin-bottom:22px}
.sub b{color:#191F28}
h2{font-size:12.5px;font-weight:800;color:#3182F6;letter-spacing:.08em;margin-bottom:10px}
.sec{margin-bottom:22px}
.row{display:flex;gap:11px}
.bx{flex:1;border:1.5px solid #E5E8EB;border-radius:14px;padding:15px 17px}
.bx .k{font-size:11.5px;font-weight:800;color:#8B95A1;margin-bottom:6px;letter-spacing:.03em}
.bx .v{font-size:15.5px;font-weight:800;letter-spacing:-.03em;line-height:1.45}
.bx p{font-size:13.5px;color:#4E5968;line-height:1.62;font-weight:500;margin-top:5px}
.bx p b{color:#191F28}
.dark{background:#101B29;border-color:#101B29}
.dark .k{color:#7E93AA}.dark .v{color:#fff}.dark p{color:#9FB6CC}.dark p b{color:#fff}
.ft{margin-top:auto;border-top:1.5px solid #E5E8EB;padding-top:12px;
  font-size:11px;color:#8B95A1;line-height:1.65;font-weight:500}
.ft b{color:#4E5968}
table{width:100%;border-collapse:collapse}
th{font-size:11.5px;font-weight:800;color:#8B95A1;text-align:left;padding:0 9px 8px;
  border-bottom:1.5px solid #E5E8EB}
td{font-size:13px;padding:9px;border-bottom:1px solid #F2F4F6;font-weight:500;
  color:#333D4B;line-height:1.55;vertical-align:top}
td b{font-weight:800;color:#191F28}
.chip{display:inline-block;font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:6px;
  background:#EFF6FF;color:#1B64DA;margin:1px 2px 1px 0;white-space:nowrap}
.note{font-size:12px;color:#8B95A1;line-height:1.65;font-weight:500;margin-top:8px}
.note b{color:#4E5968}
ul{list-style:none}
li{font-size:14px;color:#333D4B;line-height:1.68;font-weight:500;
  padding-left:15px;position:relative;margin-bottom:4px}
li:before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;
  border-radius:50%;background:#3182F6}
li b{color:#191F28;font-weight:700}

/* ── 흐름 네 칸 ── */
.flow{display:flex;align-items:stretch;gap:0;margin:6px 0 4px}
.fs{flex:1;border:1.5px solid #E5E8EB;border-radius:14px;padding:15px 16px;position:relative}
.fa{align-self:center;color:#C9CFD6;font-size:19px;font-weight:800;padding:0 9px;flex:none}
.fs .n{font-size:11px;font-weight:800;color:#3182F6;letter-spacing:.05em;margin-bottom:5px}
.fs .t{font-size:16.5px;font-weight:800;letter-spacing:-.035em;margin-bottom:5px}
.fs p{font-size:13px;color:#4E5968;line-height:1.6;font-weight:500}
.fs p b{color:#191F28}

/* ── 목업 ── */
.mock{border:1.5px solid #D6DBE0;border-radius:16px;overflow:hidden;background:#F7F9FB}
.mk-top{background:#101B29;padding:11px 16px;display:flex;align-items:center;gap:9px}
.mk-top .dot{width:9px;height:9px;border-radius:50%;background:#3C4A5A}
.mk-ti{color:#9FB6CC;font-size:12px;font-weight:700;margin-left:6px}
.mk-b{padding:18px 20px}
.mk-lab{font-size:12px;font-weight:800;color:#4E5968;margin-bottom:7px}
.mk-in{background:#fff;border:2px solid #3182F6;border-radius:11px;padding:13px 15px;
  font-size:16px;font-weight:600;color:#191F28;margin-bottom:9px}
.mk-in em{font-style:normal;color:#8B95A1}
.mk-q{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:15px}
.mk-q span{font-size:12px;font-weight:700;color:#4E5968;background:#fff;
  border:1px solid #D6DBE0;border-radius:999px;padding:5px 11px}
.mk-q span.on{background:#3182F6;color:#fff;border-color:#3182F6}
.rx{background:#fff;border:1.5px solid #E5E8EB;border-radius:13px;overflow:hidden}
.rx-h{background:#EFF6FF;padding:11px 15px;font-size:14px;font-weight:800;color:#1B64DA;
  border-bottom:1px solid #DBE7FA}
.rx-r{display:grid;grid-template-columns:104px 1fr;gap:12px;padding:11px 15px;
  border-bottom:1px solid #F2F4F6;align-items:start}
.rx-r:last-child{border-bottom:0}
.rx-k{font-size:12px;font-weight:800;color:#8B95A1;padding-top:2px}
.rx-v{font-size:13.5px;color:#333D4B;line-height:1.6;font-weight:500}
.rx-v b{color:#191F28;font-weight:700}
.step{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.step i{width:19px;height:19px;border-radius:50%;background:#3182F6;color:#fff;
  font-size:11px;font-weight:800;display:grid;place-items:center;font-style:normal;flex:none}
.step i.off{background:#fff;border:1.5px solid #C9CFD6;color:#8B95A1}
.close-bx{flex:none}
.mk-go{margin-top:13px;background:#3182F6;color:#fff;border-radius:11px;padding:12px;
  text-align:center;font-size:15px;font-weight:800}
"""
LOGO = ('<svg viewBox="0 0 240 220" fill="currentColor"><path d="M120 26 212 190 168 190 '
        '120 104 72 190 28 190Z"/><path d="M120 120 176 214 146 214 120 168 94 214 64 214Z"/></svg>')


def head(n, tot=5):
    return f'''<div class="hd"><div class="bi">{LOGO}
    <div class="bw">APEX <span>YUN PRO</span></div></div>
    <div class="pt">고객 처방전 · 설계와 운영<br>{n} / {tot}</div></div>'''


FOOT = ('<div class="ft"><b>에이플러스에셋 온탑본부 · 윤시현 사업단장</b> &nbsp;|&nbsp; '
        '문서에 나오는 화면 이름은 <b>2026-08-19 배포판에 실제로 있는 것</b>만 썼습니다. '
        '처방 문구는 상담 보조용이며 특정 상품의 가입 권유가 아닙니다.</div>')


# ═══════════════════════════════════ 1쪽 — 왜 · 흐름
P1 = f'''<div class="pg">
{head(1)}
<h1>고객 처방전</h1>
<p class="sub">고객이 한 말을 <b>한 줄 적으면</b>, 지금 열 화면과 할 말과 남길 것을
<b>순서대로</b> 알려 주는 칸입니다. 새 기능을 만드는 게 아니라
<b>이미 있는 여든여덟 개를 이어 주는</b> 일입니다.</p>

<div class="sec"><h2>왜 필요한가</h2>
<div class="row">
  <div class="bx dark"><div class="k">지금 벌어지는 일</div><div class="v">화면은 있는데 못 찾습니다</div>
    <p>「돈이 안 모여요」를 들었을 때 <b>8통장 진단지도</b>를 떠올리는 사람은
    이미 잘하는 사람입니다. 나머지는 <b>아무것도 안 엽니다</b></p></div>
  <div class="bx"><div class="k">그래서</div><div class="v">기억을 없앱니다</div>
    <p>외워서 찾는 게 아니라 <b>적으면 나오게</b> 합니다. 성장판의 「공부」 축이
    낮아도 오늘 상담은 되게</p></div>
  <div class="bx"><div class="k">덤으로</div><div class="v">순서가 통일됩니다</div>
    <p>사람마다 다른 자료로 나가던 것이 <b>같은 순서</b>가 됩니다 —
    가르치기도, 고치기도 쉬워집니다</p></div>
</div></div>

<div class="sec"><h2>네 칸으로 끝냅니다</h2>
<div class="flow">
  <div class="fs"><div class="n">STEP 1</div><div class="t">적는다</div>
    <p>고객이 한 말을 <b>그대로</b>. 「돈이 안 모여요」<br>
    자주 쓰는 열둘은 <b>눌러서</b>도 됩니다</p></div>
  <div class="fa">→</div>
  <div class="fs"><div class="n">STEP 2</div><div class="t">처방이 나온다</div>
    <p>열 화면 <b>순서대로</b> · 무슨 말로 열지 ·<br>
    보여 줄 것 · <b>끝나면 남길 것</b></p></div>
  <div class="fa">→</div>
  <div class="fs"><div class="n">STEP 3</div><div class="t">따라간다</div>
    <p>누르면 <b>그 화면이 바로</b> 열립니다.<br>
    끝내면 다음 칸으로 넘어갑니다</p></div>
  <div class="fa">→</div>
  <div class="fs"><div class="n">STEP 4</div><div class="t">저절로 남는다</div>
    <p>마지막에 <b>「TA 결과 기록」</b>과<br>
    <b>고객 365일</b>에 그대로 들어갑니다</p></div>
</div>
<p class="note"><b>STEP 4 가 이 기능의 진짜 목적입니다.</b> 추천은 미끼고,
<b>기록이 저절로 남게 하는 것</b>이 노림수입니다. 지금은 상담이 끝나면
기록을 따로 해야 해서 절반이 안 합니다 — 처방을 따라가면 <b>마지막 칸이 기록</b>이라
안 할 수가 없습니다.</p></div>

<div class="sec"><h2>지키는 규칙 넷 — 이걸 어기면 안 쓰게 됩니다</h2>
<div class="row">
  <div class="bx"><div class="v">① 세 칸을 넘지 않습니다</div>
    <p>열 화면은 <b>최대 셋</b>. 넷이 되면 아무도 안 따라갑니다</p></div>
  <div class="bx"><div class="v">② 말을 그대로 줍니다</div>
    <p>「이렇게 하세요」가 아니라 <b>읽을 문장</b>을 줍니다</p></div>
  <div class="bx"><div class="v">③ 모르면 모른다고 합니다</div>
    <p>억지 처방 금지. <b>팩트파인딩으로 되돌립니다</b></p></div>
  <div class="bx"><div class="v">④ 단정하지 않습니다</div>
    <p>금액·인수 가능 여부는 <b>확인해 드리겠습니다</b>로</p></div>
</div></div>

<div class="sec"><h2>만들지 않아도 되는 것 — 재료는 이미 있습니다</h2>
<table>
<thead><tr><th style="width:150px">필요한 것</th><th>어디에 이미 있나</th></tr></thead>
<tbody>
<tr><td><b>여는 말</b></td><td><span class="chip">TA 맞춤 스크립트</span>
  정중·공감·혜택·질문·회소성·소개기반 <b>여섯 가지</b>와 결과별 다음 말</td></tr>
<tr><td><b>상황별 도구</b></td><td><span class="chip">APEX 사용가이드</span>
  업무매뉴얼의 <b>열두 단계</b>에 이미 단계마다 도구 칩이 붙어 있습니다</td></tr>
<tr><td><b>거절 대응</b></td><td><span class="chip">미끼상품&amp;접촉전략</span>
  거절 응대 롤플레이 · <span class="chip">AI 상담 어시스턴트</span></td></tr>
<tr><td><b>남길 자리</b></td><td><span class="chip">TA 결과 기록</span>
  <span class="chip">고객 365일</span> 이미 쓰고 있는 칸 그대로</td></tr>
</tbody></table>
<p class="note"><b>새 표(테이블)를 만들지 않습니다.</b> 처방 열둘은 코드 안 배열 하나면 되고,
저장은 지금 쓰는 자리에 그대로 들어갑니다 — <b>SQL 을 다시 돌릴 일이 없습니다.</b></p></div>

{FOOT}
</div>'''


# ═══════════════════════════════════ 2쪽 — 목업
def steps(scr):
    out = []
    for i, s in enumerate(scr, 1):
        cls = "" if i == 1 else " off"
        out.append(f'<div class="step"><i class="{cls.strip()}">{i}</i>'
                   f'<span class="chip">{s}</span></div>')
    return "".join(out)


D = RX[1]   # 「돈이 안 모여요」 를 본보기로
P2 = f'''<div class="pg">
{head(2)}
<h1>화면은 이렇게 생깁니다</h1>
<p class="sub">고객 앞에서 여는 게 아니라 <b>내가 보는 칸</b>입니다.
전화 끊고 3초, 만나기 전 30초에 봅니다.</p>

<div class="sec"><h2>① 적는 자리 — 오늘의 알림 맨 위에 한 줄</h2>
<div class="mock">
  <div class="mk-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span>
    <span class="mk-ti">오늘의 알림 — 꾸준히 터치하는 시스템</span></div>
  <div class="mk-b">
    <div class="mk-lab">고객이 뭐라고 하셨나요</div>
    <div class="mk-in">돈이 안 모여요<em> │</em></div>
    <div class="mk-q">
      <span>보험 많이 들어 있어요</span><span class="on">돈이 안 모여요</span>
      <span>노후가 막막해요</span><span>사고 났어요</span><span>사업을 합니다</span>
      <span>이 병이 있는데 가입돼요?</span><span>＋ 더 보기</span>
    </div>

    <div class="rx">
      <div class="rx-h">처방 — {D[1]}</div>
      <div class="rx-r"><div class="rx-k">이 순서로 엽니다</div>
        <div class="rx-v">{steps(D[2])}</div></div>
      <div class="rx-r"><div class="rx-k">이렇게 여세요</div>
        <div class="rx-v">{D[3]}</div></div>
      <div class="rx-r"><div class="rx-k">보여 줄 것</div>
        <div class="rx-v">{D[4]}</div></div>
      <div class="rx-r"><div class="rx-k">끝나면 남길 것</div>
        <div class="rx-v"><b>{D[5]}</b></div></div>
    </div>
    <div class="mk-go">첫 화면 열기 — 8통장 진단지도 →</div>
  </div>
</div>
<p class="note">칩 열두 개는 <b>자주 듣는 말</b>입니다. 없으면 직접 적으면 되고,
적은 말은 <b>다음 판 처방을 만드는 재료</b>가 됩니다(아래 4쪽).</p></div>

<div class="sec"><h2>② 따라가는 자리 — 화면 위에 작게 떠 있습니다</h2>
<div class="row">
  <div class="bx"><div class="k">따라가는 중</div>
    <div class="v">1 / 3 · 8통장 진단지도</div>
    <p style="margin-top:9px"><b>「어디로 새는지부터 같이 보시죠.」</b><br>
    <span style="color:#8B95A1">다 하셨으면 → 다음: 재무설계 계산기</span></p></div>
  <div class="bx dark"><div class="k">마지막 칸</div>
    <div class="v">남기고 끝냅니다</div>
    <p>단계 <b>PC</b> 로 옮기고 · 스냅샷 저장 · <b>다음 약속 날짜</b>.
    여기까지 눌러야 처방이 닫힙니다</p></div>
</div>
<p class="note"><b>화면을 덮지 않습니다.</b> 앱에는 이미 화면을 통째로 덮는 칸이 여덟 개
(계산기 · CRM · 상담자료 등) 있어서, 처방까지 덮으면 서로 가립니다.
<b>오른쪽 아래 작은 띠</b>로 띄우고, 접을 수 있게 합니다.</p></div>

<div class="sec"><h2>③ 어디에 붙이나 — 세 자리, 셋 다 같은 칸입니다</h2>
<div class="row">
  <div class="bx"><div class="k">자리 1 · 아침</div><div class="v">오늘의 알림 맨 위</div>
    <p>하루를 여는 화면입니다. <b>여기가 본진</b>이에요</p></div>
  <div class="bx"><div class="k">자리 2 · 통화 직후</div><div class="v">TA 결과 기록 안</div>
    <p>결과를 <b>「상담」</b>으로 고르면 그 밑에 뜹니다.
    <b>메모에 적은 말</b>을 그대로 읽어 처방을 냅니다</p></div>
  <div class="bx"><div class="k">자리 3 · 만나기 전</div><div class="v">고객 365일 카드 위</div>
    <p>그 고객 <b>메모를 읽어</b> 미리 처방을 띄워 둡니다</p></div>
</div>
<p class="note"><b>자리 2 가 제일 영리한 자리입니다.</b> 설계사가 따로 적을 필요가 없어요 —
어차피 <b>메모는 적게 되어 있으니</b>, 그 메모를 읽어 처방을 내면 <b>입력이 0</b> 이 됩니다.
1주차에는 자리 1만 켜고, 익숙해지면 자리 2를 켜시죠.</p></div>

<div class="sec"><h2>④ 안 맞을 때 — 여기가 제일 중요합니다</h2>
<div class="row">
  <div class="bx"><div class="v">「이 처방 안 맞아요」 한 번</div>
    <p>누르면 <b>그 자리에서 접히고</b> 팩트파인딩으로 갑니다.
    이유를 묻지 않습니다 — 물으면 안 누릅니다</p></div>
  <div class="bx"><div class="v">모르는 말이 들어오면</div>
    <p>{FALLBACK[2]}</p></div>
</div></div>

{FOOT}
</div>'''


# ═══════════════════════════════════ 3쪽 — 처방 열둘
rows = "".join(
    f'''<tr><td style="width:132px"><b>{say}</b><br>
    <span style="font-size:11.5px;color:#8B95A1">{want}</span></td>
    <td style="width:238px">{"".join(f'<span class="chip">{i+1}. {s}</span>' for i, s in enumerate(scr))}</td>
    <td>{how}</td>
    <td style="width:150px;font-size:12.5px">{leave}</td></tr>'''
    for say, want, scr, how, show, leave in RX)

P3 = f'''<div class="pg">
{head(3)}
<h1>처방 열두 개</h1>
<p class="sub">자주 듣는 말 열둘부터 시작합니다. <b>여기 없는 말은 억지로 만들지 않습니다.</b>
화면 이름은 전부 <b>지금 앱에 있는 것</b>입니다.</p>

<div class="sec">
<table>
<thead><tr><th>고객이 하는 말</th><th>이 순서로 엽니다</th><th>이렇게 여세요</th>
<th>끝나면 남길 것</th></tr></thead>
<tbody>{rows}</tbody>
</table>
</div>

<div class="sec"><h2>처방을 읽는 법 — 네 칸의 뜻</h2>
<div class="row">
  <div class="bx"><div class="k">1 · 순서</div><div class="v">번호가 곧 순서입니다</div>
    <p>2번을 먼저 열면 안 됩니다. <b>순서가 처방입니다</b></p></div>
  <div class="bx"><div class="k">2 · 여는 말</div><div class="v">그대로 읽어도 됩니다</div>
    <p>내 말로 바꾸셔도 되는데 <b>순서는 지키세요</b></p></div>
  <div class="bx"><div class="k">3 · 보여 줄 것</div><div class="v">화면의 어느 부분인지</div>
    <p>다 보여 주지 않습니다. <b>딱 이것만</b></p></div>
  <div class="bx dark"><div class="k">4 · 남길 것</div><div class="v">여기까지가 상담입니다</div>
    <p>이걸 안 하면 <b>안 한 상담</b>입니다</p></div>
</div></div>

<div class="sec"><h2>공통으로 붙는 것 — 열둘 전부에</h2>
<ul>
<li><b>단정하지 않습니다.</b> 금액 · 환급률 · 인수 가능 여부는
  「확인해 드리겠습니다」로. 처방 문구에 <b>확정 표현을 넣지 않습니다.</b></li>
<li><b>파는 말로 닫지 않습니다.</b> 마지막은 언제나 <b>다음 약속 날짜</b>입니다.</li>
<li><b>고객 앞에서 CRM 을 열지 않습니다.</b> 다른 고객 이름이 같이 보입니다 —
  처방의 마지막 칸은 <b>차에 타서</b> 누릅니다.</li>
<li><b>동의 없는 고객은 문서를 올리지 않습니다.</b> 고객 365일로 넘어가는 처방은
  <b>동의 상태를 먼저</b> 묻습니다.</li>
</ul></div>

{FOOT}
</div>'''


# ═══════════════════════════════════ 4쪽 — 운영 방식
P4 = f'''<div class="pg">
{head(4)}
<h1>운영 방식</h1>
<p class="sub">기능보다 <b>누가 고치고 어떻게 살아 있게 하느냐</b>가 어렵습니다.
그것만 적습니다.</p>

<div class="sec"><h2>누가 만들고 누가 고치나</h2>
<table>
<thead><tr><th style="width:120px">누가</th><th style="width:200px">무엇을</th><th>언제</th></tr></thead>
<tbody>
<tr><td><b>사업단장</b></td><td>처방 열둘의 <b>내용</b> — 순서 · 여는 말 · 남길 것</td>
  <td>처음 한 번 만들고, <b>달에 한 번</b> 손봅니다</td></tr>
<tr><td><b>설계사</b></td><td>「안 맞아요」 누르기 · 없는 말 적기</td>
  <td>쓰다가 그때그때. <b>이유는 안 적어도 됩니다</b></td></tr>
<tr><td><b>화면</b></td><td>안 맞은 횟수와 적힌 말을 <b>모아 두기</b></td>
  <td>자동. 사람이 할 일 없음</td></tr>
</tbody></table>
<p class="note"><b>설계사에게 처방을 만들게 하지 않습니다.</b> 만들라고 하면 아무도 안 만들고,
만들어도 제각각이 됩니다. 설계사는 <b>「안 맞았다」만</b> 눌러 주면 됩니다.</p></div>

<div class="sec"><h2>달에 한 번, 20분이면 됩니다</h2>
<div class="row">
  <div class="bx"><div class="k">① 5분</div><div class="v">안 맞은 처방 보기</div>
    <p>가장 많이 눌린 처방 <b>하나만</b> 고칩니다. 전부 고치려 하면 안 하게 됩니다</p></div>
  <div class="bx"><div class="k">② 10분</div><div class="v">새로 적힌 말 보기</div>
    <p>세 번 이상 적힌 말이 있으면 <b>열세 번째 처방</b>으로 올립니다</p></div>
  <div class="bx"><div class="k">③ 5분</div><div class="v">바뀐 것 알리기</div>
    <p>조회 때 <b>한 줄</b>. 안 알리면 바뀐 줄 모릅니다</p></div>
</div></div>

<div class="sec"><h2>단계별로 켭니다 — 한 번에 다 열지 않습니다</h2>
<table>
<thead><tr><th style="width:96px">시기</th><th style="width:210px">무엇을</th>
<th>이걸 봅니다</th></tr></thead>
<tbody>
<tr><td><b>1주차</b></td><td>내가 혼자 씁니다. 처방 없이 <b>종이에</b></td>
  <td>열둘이 맞는지. <b>말이 실제로 나가는지</b></td></tr>
<tr><td><b>2~4주차</b></td><td>팀 <b>세 명</b>에게만. 칩 열둘만, 직접 적기는 아직</td>
  <td>몇 번 눌렀나 · 끝까지 따라갔나</td></tr>
<tr><td><b>2개월차</b></td><td>본부 전체. <b>직접 적기</b>를 켭니다</td>
  <td>처방 없이 넘어가는 비율</td></tr>
<tr><td><b>3개월차</b></td><td>안 쓰이는 처방을 <b>지웁니다</b></td>
  <td>열둘이 여덟이 되어도 괜찮습니다</td></tr>
</tbody></table>
<p class="note"><b>지우는 단계를 반드시 넣으세요.</b> 처방이 스물이 되는 순간
다시 「못 찾겠다」가 됩니다. <b>늘리는 것보다 지우는 게 어렵습니다.</b></p></div>

<div class="sec"><h2>이걸로 무엇을 알게 되나 — 부수입니다만 큽니다</h2>
<ul>
<li><b>고객이 무엇을 걱정하는지</b>가 숫자로 쌓입니다. 「요즘 노후 이야기가 많다」를
  <b>느낌이 아니라 건수</b>로 알게 됩니다 — 그게 다음 달 콘텐츠 주제입니다.</li>
<li><b>어느 화면이 실제로 쓰이는지</b> 보입니다. 처방에 한 번도 안 들어가는 화면은
  <b>없애도 되는 화면</b>이거나 <b>내가 못 가르친 화면</b>입니다.</li>
<li><b>누가 안 따라가는지</b> 보입니다. 처방을 열고 <b>첫 화면에서 멈추는</b> 사람은
  성장판의 「자료」 축이 낮은 사람과 같습니다 — 코칭 거리가 하나 더 생깁니다.</li>
</ul></div>

<div class="sec"><h2>이게 실패한다면 — 세 가지 길뿐입니다</h2>
<div class="row">
  <div class="bx"><div class="k">실패 1</div><div class="v">처방이 뻔합니다</div>
    <p>「그건 나도 알아요」가 나오면 끝입니다. 막는 법 —
    <b>여는 말과 순서</b>를 넣으세요. 화면 이름만 나열하면 반드시 이렇게 됩니다</p></div>
  <div class="bx"><div class="k">실패 2</div><div class="v">적기가 귀찮습니다</div>
    <p>한 줄도 안 적습니다. 막는 법 — <b>자리 2</b>(TA 결과 기록의 메모를 읽어
    자동으로 처방)를 빨리 켜세요. <b>입력을 0 으로</b></p></div>
  <div class="bx"><div class="k">실패 3</div><div class="v">처방이 스물이 됩니다</div>
    <p>다시 「못 찾겠다」가 됩니다. 막는 법 —
    <b>3개월차에 지우는 단계</b>를 달력에 박아 두세요</p></div>
</div>
<p class="note">셋 다 <b>기능 문제가 아니라 운영 문제</b>입니다. 그래서 이 쪽이 필요합니다.</p></div>

<div class="bx dark close-bx" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:21px;line-height:1.45;margin-top:3px">
  외우게 하지 말고 <b style="color:#60A5FA">적으면 나오게</b> 합니다.<br>
  추천은 미끼이고, 진짜 노림수는 <b style="color:#60A5FA">기록이 저절로 남는 것</b>입니다.</div>
</div>

{FOOT}
</div>'''



# ═══════════════════════════════════ 5쪽 — 말투 카드
# 예문은 전부 앱 주석과 화면에서 그대로 가져온 것이다. 지어낸 문장이 아니다.
PAT = [
 ("A 가 아니라 B", "다시 짚어 준다",
  ["혼잡이 <b>아니라</b> 처음부터 시간 안에 끝날 수 없는 주문이었다",
   "가운데가 비면 그림이 <b>아니라</b> 구멍이다",
   "「부재 6건」이 <b>아니라</b> 「고객12 · 12일째 · 문자 먼저」여야 손이 움직인다"],
  "고객이 쓴 말을 그대로 받지 말고 <b>한 번 바꿔서</b> 돌려줍니다"),

 ("아무도 안 —", "실패를 사람이 아니라 구조 탓으로",
  ["네 군데를 오가면 <b>아무도 안 본다</b>",
   "서른 장을 한 번에 읽으라고 하면 <b>아무도 안 읽는다</b>",
   "여섯 칸을 사람이 채워 넣게 해 두니 정작 <b>아무도 안 채우고</b> 화면만 복잡했다"],
  "「왜 안 했어」가 없습니다. <b>안 하게 만든 구조</b>를 탓합니다"),

 ("하나만", "줄여서 준다",
  ["여기는 「체크판」 <b>하나만</b> 한다",
   "전체화면은 한 번에 <b>하나만</b>",
   "나머지는 이것을 <b>돕는 것뿐</b>이다"],
  "고를 것을 주지 않습니다. <b>다음 하나</b>를 정해 줍니다"),

 ("이랬다 → 그래서", "고백하고 고친다",
  ["전에는 실패해도 「복사되었습니다」라고 말했다 — <b>이제는 확인하고 말한다</b>",
   "타율은 여기 있으니 화면을 오가야 했다 — <b>그래서</b> 한 칸에 모았다",
   "두 번 눌러 찾아 들어가야 하면 안 보게 된다"],
  "자랑으로 시작하지 않습니다. <b>못했던 것</b>부터 적고 고친 것을 붙입니다"),

 ("하지 않는다", "금지를 분명히",
  ["모르는 것을 「유지」로 <b>단정하지 않는다</b>",
   "숫자를 채워 넣으라고 <b>하지 않는다</b>",
   "같은 계산을 두 번 <b>하지 않는다</b>"],
  "할 것보다 <b>안 할 것</b>을 먼저 못박습니다"),

 ("숫자로 못박기", "말 대신 수",
  ["끊고 <b>30초</b> 안에", "가장 낮은 칸 <b>하나만</b>",
   "이 셋만 하면 나머지는 따라옵니다"],
  "「자주」 「빨리」를 안 씁니다. <b>30초 · 다섯 명 · 하나</b>로 적습니다"),
]

NO = [("길게 쓰기", "한 문장에 뜻 하나. 두 개면 자릅니다"),
      ("영어·전문용어", "「온보딩」 「퍼널」 안 씁니다 — <b>처음 켤 때</b> · <b>깔때기</b>"),
      ("「…십시오」", "본문은 <b>…습니다</b>, 시키는 말은 <b>…세요 / …시죠</b>"),
      ("느낌표와 과장", "「최고」 「완벽」 없습니다. 숫자로 대신합니다"),
      ("추상 명사", "「효율화」 대신 <b>「두 번 누를 걸 한 번에」</b>"),
      ("고객에게 단정", "금액·환급률·인수 여부는 <b>「확인해 드리겠습니다」</b>")]

pat_rows = "".join(
    f'''<tr><td style="width:118px"><b>{n}</b><br>
    <span style="font-size:11.5px;color:#8B95A1">{sub}</span></td>
    <td style="width:430px">{"<br>".join("· " + e for e in ex)}</td>
    <td>{why}</td></tr>''' for n, sub, ex, why in PAT)

def no_row(items):
    return "".join(
        f'''<div class="bx"><div class="v" style="color:#E5484D">✕ {n}</div>
        <p>{d}</p></div>''' for n, d in items)

P5 = f'''<div class="pg">
{head(5)}
<h1>말투 — 이렇게 씁니다</h1>
<p class="sub">아래 예문은 <b>지어낸 것이 하나도 없습니다.</b>
전부 앱 주석과 화면에 이미 적혀 있던 문장입니다.
새 글을 쓸 때 <b>이 여섯 꼴 안에서</b> 쓰면 같은 사람이 쓴 것처럼 됩니다.</p>

<div class="sec"><h2>쓰는 꼴 여섯</h2>
<table>
<thead><tr><th>꼴</th><th>이미 쓰고 있는 예</th><th>왜 이렇게 쓰나</th></tr></thead>
<tbody>{pat_rows}</tbody>
</table></div>

<div class="sec"><h2>안 쓰는 것 여섯</h2>
<div class="row" style="margin-bottom:11px">{no_row(NO[:3])}</div>
<div class="row">{no_row(NO[3:])}</div>
</div>

<div class="sec"><h2>한 문장을 고치는 순서 — 30초</h2>
<table>
<thead><tr><th style="width:80px">순서</th><th style="width:250px">이렇게 묻습니다</th>
<th>고치기 전 → 고친 뒤</th></tr></thead>
<tbody>
<tr><td><b>1</b></td><td>뜻이 두 개인가?</td>
  <td>두 개면 자릅니다. <b>한 문장에 하나</b></td></tr>
<tr><td><b>2</b></td><td>바꿔 줄 말이 있나?</td>
  <td>「보험이 많다」 → <b>「많은 게 아니라 겹친 겁니다」</b></td></tr>
<tr><td><b>3</b></td><td>추상 명사가 있나?</td>
  <td>「관리가 필요합니다」 → <b>「90일 넘은 사람이 다섯입니다」</b></td></tr>
<tr><td><b>4</b></td><td>숫자로 바꿀 수 있나?</td>
  <td>「자주 연락하세요」 → <b>「7일 넘기지 마세요」</b></td></tr>
<tr><td><b>5</b></td><td>단정하고 있나?</td>
  <td>「나옵니다」 → <b>「확인해 드리겠습니다」</b></td></tr>
</tbody></table></div>

<div class="bx dark close-bx" style="margin-bottom:18px">
  <div class="k">이 말투의 정체</div>
  <div class="v" style="font-size:20px;line-height:1.5;margin-top:3px">
  <b style="color:#60A5FA">사람을 탓하지 않고 구조를 탓하는 말</b>이고,<br>
  <b style="color:#60A5FA">할 것보다 안 할 것을 먼저 정해 주는 말</b>입니다.<br>
  그래서 듣는 사람이 <b style="color:#60A5FA">기죽지 않고 움직입니다.</b></div>
</div>

{FOOT}
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>고객 처방전 — 설계와 운영</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}{P4}{P5}</body></html>')
open("rx.html", "w", encoding="utf8").write(HTML)
print(f"rx.html {len(HTML.encode())/1024:.0f}KB · 처방 {len(RX)}개")
