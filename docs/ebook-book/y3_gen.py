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


def head(n, tot=3):
    return f'''<div class="hd"><div class="bi">{LOGO}
    <div class="bw">APEX <span>YUN PRO</span></div></div>
    <div class="pt">3년 — 고객이 남게 하는 법<br>{n} / {tot}</div></div>'''


FOOT = ('<div class="ft"><b>에이플러스에셋 온탑본부 · 윤시현 사업단장</b> &nbsp;|&nbsp; '
        '인용한 문장은 모두 <b>앱 코드 주석에 실제로 적혀 있는 것</b>입니다. '
        '화면 목업은 제안이며 실제 화면과 다릅니다.')






# ═══════════════════════════════ 1쪽 — 진단과 그릇
P1 = f'''<div class="pg">
{head(1)}
<h1>3년을 담을 그릇이 없습니다</h1>
<p class="sub">앱을 세어 보니 <b>가장 긴 관리 주기가 30일</b>이었습니다.
오늘(오늘의 알림) → 30일(고객관리) → <b>그다음이 없습니다.</b>
「고객 365일」은 이름이 365일이지 안에 <b>일 년짜리 주기가 없습니다.</b></p>

<div class="sec"><h2>지금 시간 그릇</h2>
<div class="flow">
  <div class="fs"><div class="n">있음</div><div class="t">오늘</div>
    <p>오늘의 알림 · 아침 보고</p></div>
  <div class="fa">→</div>
  <div class="fs"><div class="n">있음</div><div class="t">30일</div>
    <p>30일 고객관리 · 성장판</p></div>
  <div class="fa">→</div>
  <div class="fs" style="border-color:#F5C2C7;background:#FFF5F5">
    <div class="n" style="color:#C0392B">없음</div><div class="t">1년</div>
    <p>해마다 무엇을 하는지 <b>정해진 게 없습니다</b></p></div>
  <div class="fa">→</div>
  <div class="fs" style="border-color:#F5C2C7;background:#FFF5F5">
    <div class="n" style="color:#C0392B">없음</div><div class="t">3년</div>
    <p><b>계약 3년차와 3개월차가<br>같은 목록에</b> 있습니다</p></div>
</div>
<p class="note">「계약일」이라는 낱말이 앱 전체에 <b>한 번</b> 나옵니다.
계약한 지 얼마나 됐는지가 <b>화면 어디에도 안 보인다</b>는 뜻입니다.</p></div>

<div class="sec"><h2>3년이 왜 다른 문제인가</h2>
<div class="row">
  <div class="bx"><div class="k">하루·30일은</div><div class="v">할 일을 놓치지 않는 것</div>
    <p>안 걸린 사람, 안 닫힌 것. <b>내가 게을러서</b> 생기는 문제입니다</p></div>
  <div class="bx dark"><div class="k">3년은</div><div class="v">고객이 변하는 것</div>
    <p>나이도 자녀도 소득도 보험도 변합니다.
    <b>부지런해도 모릅니다</b> — 기억이 안 나니까요.
    이건 <b>앱이 대신 알아야</b> 하는 문제입니다</p></div>
</div>
<p class="note"><b>그래서 3년 관리는 「더 자주 연락하기」가 아닙니다.</b>
연락을 늘리는 게 아니라 <b>연락할 이유가 생겼을 때</b> 알려 주는 일입니다.</p></div>

<div class="sec"><h2>3년 동안 고객에게 실제로 벌어지는 일</h2>
<table>
<thead><tr><th style="width:170px">무엇이 변하나</th><th style="width:220px">앱이 알 수 있나</th>
<th>그래서 무슨 말을 걸 수 있나</th></tr></thead>
<tbody>
<tr><td><b>나이가 세 살</b></td><td><b>압니다</b> — 출생연도로 계산</td>
  <td>「내년이면 보험료가 오르는 나이입니다」</td></tr>
<tr><td><b>자녀가 세 살</b></td><td>메모에 자녀 나이가 있으면 <b>압니다</b></td>
  <td>「올해 첫째가 중학교 가죠?」</td></tr>
<tr><td><b>갱신이 옵니다</b></td><td>계약일 + 갱신 주기로 <b>계산됩니다</b></td>
  <td>「내년에 갱신입니다. 미리 보시죠」</td></tr>
<tr><td><b>만기가 다가옵니다</b></td><td>증권에서 <b>이미 읽고 있습니다</b></td>
  <td>「3년 뒤 만기인데 그 뒤 계획을 같이 보시죠」</td></tr>
<tr><td><b>가족이 늘거나 줄어듭니다</b></td><td><b>모릅니다</b> — 물어야 압니다</td>
  <td>이건 <b>사람이 적어야</b> 하는 것입니다</td></tr>
<tr><td><b>집·직장·사업이 바뀝니다</b></td><td><b>모릅니다</b> — 물어야 압니다</td>
  <td>이것도 <b>사람 몫</b>입니다</td></tr>
</tbody></table>
<p class="note"><b>넷은 앱이 알고 둘은 사람이 알아야 합니다.</b>
앱이 아는 넷만 알려 줘도 <b>3년에 열두 번</b> 연락할 구실이 생깁니다 —
「무엇으로 터치할지」가 매번 어렵다고 하신 그 문제가 여기서 풀립니다.</p></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 2쪽 — 연차와 분기
YEARS = [
 ("1년차", "믿음", "#3182F6", "파는 이야기를 안 합니다",
  ["증권을 <b>제때</b> 전달했다", "첫 청구를 <b>대신 해 줬다</b>",
   "생일·계약 기념일에 <b>연락했다</b>", "「고객 365일」에 <b>가족이 적혔다</b>"],
  "청구를 대신 받아 준 고객은 <b>해지하지 않습니다.</b> 1년차는 이것 하나면 됩니다."),
 ("2년차", "확장", "#7C5CE6", "가족으로 넓힙니다",
  ["배우자 보장을 <b>같이 봤다</b>", "자녀 보장을 <b>같이 봤다</b>",
   "부모님 이야기를 <b>들었다</b>", "계약이 <b>1건에서 2건</b>이 됐다"],
  "새 고객을 찾는 것보다 <b>있는 고객의 가족</b>이 훨씬 쉽습니다. 이미 믿으니까요."),
 ("3년차", "재점검과 소개", "#0F9960", "이제 부탁할 자격이 생깁니다",
  ["보장을 <b>처음부터 다시</b> 봤다", "갱신·만기를 <b>미리</b> 알려 줬다",
   "<b>소개를 받았다</b>", "다음 3년 계획을 <b>같이 적었다</b>"],
  "3년을 지킨 사람만 소개를 부탁할 수 있습니다. <b>1년차에 부탁하면 관계가 끝납니다.</b>"),
]
ycards = "".join(
    f'''<div class="bx" style="border-top:4px solid {c}">
    <div class="k">{y} · {n}</div><div class="v">{h}</div>
    <ul style="margin-top:9px">{"".join(f"<li>{x}</li>" for x in items)}</ul>
    <p style="margin-top:10px;padding-top:9px;border-top:1px dashed #D6DBE0">{note}</p></div>'''
    for y, n, c, h, items, note in YEARS)

P2 = f'''<div class="pg">
{head(2)}
<h1>연차마다 할 일이 다릅니다</h1>
<p class="sub">지금은 계약 <b>3개월차</b>와 <b>3년차</b> 고객이 같은 목록에 있습니다.
할 일이 완전히 다른데요.</p>

<div class="sec"><h2>세 해, 세 가지 일</h2>
<div class="row">{ycards}</div>
<p class="note"><b>순서를 건너뛰면 안 됩니다.</b> 1년차에 가족 이야기를 꺼내면
「또 팔려고 하네」가 되고, 2년차에 소개를 부탁하면 그 뒤로 전화를 안 받습니다.
<b>믿음 → 확장 → 소개</b>. 이 순서가 3년입니다.</p></div>

<div class="sec"><h2>3년을 어떻게 나누나 — 분기 열두 번</h2>
<div class="row">
  <div class="bx dark" style="flex:1.2"><div class="k">단위</div>
    <div class="v">한 분기에 한 번이면 됩니다</div>
    <p>3년 = <b>12분기</b>. 고객 한 사람에게 <b>열두 번</b> 손대면 3년이 채워집니다.
    매달도 아니고 <b>석 달에 한 번</b>입니다 — 이건 지킬 수 있습니다.</p>
    <p style="margin-top:9px">고객이 200명이어도 <b>한 분기에 200명</b>이 아닙니다.
    <b>일주일에 열다섯 명</b>씩이면 한 분기에 다 돕니다.</p></div>
  <div class="bx"><div class="k">화면</div><div class="v">분기 판 하나</div>
    <p><b>「이번 분기에 아직 안 만난 고객」</b> 목록 하나면 됩니다.
    12칸이 채워지는 것이 보이면 <b>끝나는 자리</b>가 생깁니다.</p>
    <p style="margin-top:9px">지금 「30일 고객관리」가 하는 일을
    <b>기간만 바꿔</b> 그대로 쓰면 됩니다 — 이미 있는 화면입니다.</p></div>
</div></div>

<div class="sec"><h2>그래서 화면에 필요한 것 — 넷</h2>
<table>
<thead><tr><th style="width:180px">무엇을</th><th style="width:210px">어디에</th><th>드는 시간</th></tr></thead>
<tbody>
<tr><td><b>① 계약 연차 딱지</b><br>
  <span style="font-size:11.5px;color:#8B95A1">「2년차 · 7개월」</span></td>
  <td>고객 365일 목록 · 카드 위</td>
  <td><b>반나절</b> — 계약일에서 계산만 하면 됩니다</td></tr>
<tr><td><b>② 올해 변한 고객</b><br>
  <span style="font-size:11.5px;color:#8B95A1">나이·자녀·갱신·만기</span></td>
  <td>고객 365일 · 분기마다</td>
  <td><b>이삼 일</b> — 넷 다 이미 아는 값입니다</td></tr>
<tr><td><b>③ 분기 판</b><br>
  <span style="font-size:11.5px;color:#8B95A1">이번 분기 안 만난 사람</span></td>
  <td>30일 고객관리 옆에</td>
  <td><b>하루</b> — 기간만 30일 → 분기</td></tr>
<tr><td><b>④ 인수인계 한 장</b><br>
  <span style="font-size:11.5px;color:#8B95A1">다음 쪽에서 자세히</span></td>
  <td>고객 365일 · 고객마다</td>
  <td><b>이삼 일</b></td></tr>
</tbody></table></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 3쪽 — 진짜 목적 · 재는 법
P3 = f'''<div class="pg">
{head(3)}
<h1>3년의 진짜 목적</h1>
<p class="sub">계약을 더 따는 게 아닙니다.
<b>담당자가 바뀌어도 고객이 남는 것</b>입니다.</p>

<div class="sec"><h2>3년이면 담당자가 한 번은 바뀝니다</h2>
<div class="row">
  <div class="bx red" style="flex:1.2"><div class="k">기록이 없으면</div>
    <div class="v">고객은 「누구세요」가 됩니다</div>
    <p>새 담당자가 전화를 겁니다. 고객은 <b>지난 3년을 다시 설명해야</b> 합니다.
    두 번째 전화부터 안 받습니다.<br><br>
    <b>그동안 쌓은 3년이 그 순간 0이 됩니다.</b></p></div>
  <div class="bx grn" style="flex:1.2"><div class="k">기록이 있으면</div>
    <div class="v">「어머님은 좀 어떠세요」로 시작합니다</div>
    <p>새 담당자가 <b>지난 상담을 읽고</b> 전화합니다.
    고객은 <b>회사가 바뀌지 않았다</b>고 느낍니다.<br><br>
    <b>3년이 조직에 남습니다.</b></p></div>
</div>
<p class="note"><b>이것이 「고객 365일」의 진짜 이유라고 생각합니다.</b>
지금은 <b>쌓이는</b> 수준입니다 — <b>넘길 수 있는</b> 수준까지 가야 3년이 자산이 됩니다.</p></div>

<div class="sec"><h2>인수인계 한 장 — 이 고객이 누구인가</h2>
<div class="mock" style="background:#F8FAFC;color:#191F28;border:1.5px solid #D6DBE0">
  <div style="font-size:12px;font-weight:900;color:#3182F6;letter-spacing:.5px">인수인계</div>
  <div style="font-size:21px;font-weight:900;margin:4px 0 12px;letter-spacing:-.03em">
    홍*동 님 · <span style="color:#3182F6">2년차 7개월</span></div>
  <table style="font-size:13.5px">
    <tbody>
      <tr><td style="width:130px;color:#8B95A1;font-weight:800">사람</td>
        <td>48세 · 배우자와 자녀 둘(중2 · 초5) · 부모님 두 분 생존</td></tr>
      <tr><td style="color:#8B95A1;font-weight:800">계약</td>
        <td>2건 — 본인 종합(2024-03) · 배우자 실손(2025-01)</td></tr>
      <tr><td style="color:#8B95A1;font-weight:800">지난 이야기</td>
        <td>어머님 수술(2025-06) · 첫째 중학교 진학 걱정 · 대출 잔액 부담</td></tr>
      <tr><td style="color:#8B95A1;font-weight:800">해 준 것</td>
        <td>실손 청구 3건 대행 · 보장분석 2회 · 증권 전달 완료</td></tr>
      <tr><td style="color:#8B95A1;font-weight:800">다음에 할 것</td>
        <td><b>부모님 간병 이야기</b> — 지난 상담에서 먼저 물어보심</td></tr>
      <tr><td style="color:#8B95A1;font-weight:800">주의</td>
        <td>전화는 <b>저녁 8시 이후</b>. 낮에는 못 받으심</td></tr>
    </tbody>
  </table>
</div>
<p class="note"><b>새로 적을 것이 없습니다.</b> 여섯 줄 전부
<b>고객 365일에 이미 쌓이는 것</b>입니다 — 정보·메모·상담 자료·통화 이력.
<b>한 장으로 모아서 보여 주기만</b> 하면 됩니다.
그리고 이건 <b>인수인계용만이 아닙니다</b> — 오랜만에 전화 걸기 전에 30초 읽는 자리이기도 합니다.</p></div>

<div class="sec"><h2>3년은 이렇게 재야 합니다</h2>
<table>
<thead><tr><th style="width:210px">이걸로 재면 안 됩니다</th><th>이걸로 재야 합니다</th></tr></thead>
<tbody>
<tr><td>계약 건수</td><td><b>고객 한 명당 계약 건수</b> — 1건이 가족 3건이 되는가</td></tr>
<tr><td>신규 고객 수</td><td><b>3년 유지율</b> — 3년 전 고객 중 지금 남은 비율</td></tr>
<tr><td>통화 건수</td><td><b>분기 접점률</b> — 12분기 중 몇 분기에 손댔나</td></tr>
<tr><td>소개 건수</td><td><b>계약 1건당 소개</b> — 누적으로 봐야 3년이 보입니다</td></tr>
</tbody></table>
<p class="note">왼쪽은 <b>한 달이면 나오는 숫자</b>고 오른쪽은 <b>3년이 지나야 나오는 숫자</b>입니다.
지금 앱이 재는 것은 전부 왼쪽입니다. <b>오른쪽을 재기 시작해야 3년을 관리하는 것</b>입니다.</p></div>

<div class="sec"><h2>하지 마셔야 할 것 셋</h2>
<div class="row">
  <div class="bx"><div class="v">✕ 3년 계획표 만들기</div>
    <p>「1년차엔 이것, 2년차엔 저것」을 표로 만들어 주면 <b>아무도 안 봅니다.</b>
    <b>이번 분기에 할 것</b>만 보여 주세요</p></div>
  <div class="bx"><div class="v">✕ 해마다 같은 안부</div>
    <p>「작년에도 똑같은 문자 받았는데」가 되면 <b>안 하느니만 못합니다.</b>
    <b>변한 것</b>으로 걸어야 합니다</p></div>
  <div class="bx"><div class="v">✕ 자동 축하 문자</div>
    <p>생일 문자가 <b>자동인 걸 고객이 압니다.</b>
    앱은 <b>알려만</b> 주고 <b>보내는 건 사람</b>이 하세요</p></div>
</div></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:21px;line-height:1.5;margin-top:3px">
  3년은 <b style="color:#60A5FA">더 자주 연락하는 일이 아니라</b><br>
  <b style="color:#60A5FA">변한 것을 놓치지 않는 일</b>이고,<br>
  그 끝에 남는 것은 <b style="color:#60A5FA">넘겨줄 수 있는 고객</b>입니다.</div>
</div>

{FOOT}</div>
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>3년 — 고객이 남게 하는 법</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}</body></html>')
open("y3.html", "w", encoding="utf8").write(HTML)
print(f"y3.html {len(HTML.encode())/1024:.0f}KB")
