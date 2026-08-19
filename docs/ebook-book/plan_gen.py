# -*- coding: utf-8 -*-
"""사업계획서 낱장 두 쪽 — A4 세로. 이미지로 따로 뽑아 쓰는 용도.

  숫자는 전부 앱에서 온 것이다. 요금제는 TOSS_PLANS, 손익은 apexSimCalc 와 같은 식.
  자료가 없는 칸(시장 규모·확보 경로 실적)은 지어내지 않고 **빈칸으로 남긴다.**
"""
import math, sys
sys.stdout.reconfigure(encoding="utf8")
jsr = lambda x: math.floor(x + 0.5)
W = lambda n: f"{n:,}"

PLAN = {"basic": 26500, "pro": 49900, "team": 119000}
YEAR = {"basic": 265000, "pro": 499000, "team": 1190000}
AI, FEE, GOAL = 3000, 2.2, 10_000_000
FONTS = open("fonts.css", encoding="utf8").read()


def sim(b, p, t):
    rev = b * PLAN["basic"] + p * PLAN["pro"] + t * PLAN["team"]
    users = b + p + t * 5
    aic, fc = jsr(users * AI), jsr(rev * FEE / 100)
    return dict(b=b, p=p, t=t, rev=rev, users=users, ai=aic, fee=fc,
                net=rev - aic - fc, pct=jsr((rev - aic - fc) / GOAL * 100))


SC = [("① 시작", 20, 30, 3, "혼자 · 첫 여섯 달"),
      ("② 본부 하나", 40, 90, 12, "한 본부가 붙었을 때"),
      ("③ 목표", 60, 150, 25, "월 순이익 1,000만 원")]
S = [(n, d, sim(b, p, t)) for n, b, p, t, d in SC]

CSS = FONTS + """
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Pretendard,-apple-system,sans-serif;background:#fff;color:#191F28;
  -webkit-font-smoothing:antialiased}
.pg{width:1240px;height:1754px;padding:64px 68px;display:flex;flex-direction:column;
  position:relative;background:#fff}
.hd{display:flex;justify-content:space-between;align-items:flex-start;
  border-bottom:3px solid #191F28;padding-bottom:18px;margin-bottom:26px}
.bi{display:flex;align-items:center;gap:11px}
.bi svg{width:30px;height:auto;color:#191F28}
.bw{font-size:22px;font-weight:800;letter-spacing:-.05em}
.bw span{color:#3182F6}
.pt{font-size:13px;font-weight:700;color:#8B95A1;letter-spacing:.04em;text-align:right;line-height:1.6}
h1{font-size:40px;font-weight:800;letter-spacing:-.05em;line-height:1.2;margin-bottom:10px}
.sub{font-size:17px;color:#4E5968;font-weight:500;line-height:1.65;margin-bottom:26px}
.sub b{color:#191F28;font-weight:700}
h2{font-size:13px;font-weight:800;color:#3182F6;letter-spacing:.08em;margin-bottom:11px}
.sec{margin-bottom:24px}
.row{display:flex;gap:12px}
.bx{flex:1;border:1.5px solid #E5E8EB;border-radius:15px;padding:17px 19px}
.bx .k{font-size:12px;font-weight:800;color:#8B95A1;letter-spacing:.03em;margin-bottom:7px}
.bx .v{font-size:16px;font-weight:700;letter-spacing:-.03em;line-height:1.5}
.bx p{font-size:14px;color:#4E5968;line-height:1.65;font-weight:500;margin-top:5px}
.bx p b{color:#191F28;font-weight:700}
.dark{background:#101B29;border-color:#101B29;color:#fff}
.dark .k{color:#7E93AA}.dark .v{color:#fff}.dark p{color:#9FB6CC}.dark p b{color:#fff}
table{width:100%;border-collapse:collapse}
th{font-size:12px;font-weight:800;color:#8B95A1;text-align:left;padding:0 12px 9px;
  border-bottom:1.5px solid #E5E8EB;letter-spacing:.02em}
td{font-size:15px;padding:12px;border-bottom:1px solid #F2F4F6;font-weight:500;color:#333D4B}
td b{font-weight:800;color:#191F28;letter-spacing:-.02em}
.num{text-align:right;font-variant-numeric:tabular-nums}
.hi{background:#EFF6FF}
.hi td{color:#191F28}
.pos{color:#0F9960;font-weight:800}
.neg{color:#E5484D;font-weight:700}
.pill{display:inline-block;font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:7px;
  background:#EFF6FF;color:#1B64DA;margin-left:6px}
.note{font-size:12.5px;color:#8B95A1;line-height:1.7;font-weight:500;margin-top:9px}
.note b{color:#4E5968}
.blank{background:repeating-linear-gradient(135deg,#FAFBFC,#FAFBFC 7px,#F2F4F6 7px,#F2F4F6 14px);
  border:1.5px dashed #C9CFD6}
.blank .v{color:#8B95A1}
.ft{margin-top:auto;border-top:1.5px solid #E5E8EB;padding-top:14px;
  font-size:11.5px;color:#8B95A1;line-height:1.7;font-weight:500}
.ft b{color:#4E5968}
ul{list-style:none}
li{font-size:14.5px;color:#333D4B;line-height:1.7;font-weight:500;
  padding-left:16px;position:relative;margin-bottom:4px}
li:before{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;
  border-radius:50%;background:#3182F6}
li b{color:#191F28;font-weight:700}
.big{font-size:31px;font-weight:800;letter-spacing:-.045em;line-height:1.15}
.unit{font-size:14px;font-weight:700;color:#8B95A1;margin-left:3px}
"""

LOGO = ('<svg viewBox="0 0 240 220" fill="currentColor"><path d="M120 26 212 190 168 190 '
        '120 104 72 190 28 190Z"/><path d="M120 120 176 214 146 214 120 168 94 214 64 214Z"/></svg>')


def head(n):
    return f'''<div class="hd"><div class="bi">{LOGO}
    <div class="bw">APEX <span>YUN PRO</span></div></div>
    <div class="pt">설계사 올인원 워크스페이스<br>사업계획 요약 · {n} / 2</div></div>'''


FOOT = ('<div class="ft"><b>에이플러스에셋 온탑본부 · 윤시현 사업단장</b> &nbsp;|&nbsp; '
        '본 문서의 손익은 <b>가정에 따른 시산</b>이며 수익을 보장하지 않습니다. '
        '요금·원가는 변동될 수 있고, 빗금 친 칸은 <b>확정 자료가 없어 비워 둔 자리</b>입니다.</div>')

# ─────────────────────────────────────────────── 1쪽
P1 = f'''<div class="pg">
{head(1)}
<h1>설계사가 만든, 설계사를 위한 업무 도구</h1>
<p class="sub">보험 설계사 한 사람이 <b>고객을 만나 계약을 맺고 그 뒤를 관리하기까지</b>
필요한 화면을 <b>한 로그인 안에</b> 모았습니다. 도구를 파는 것이 아니라
<b>일하는 순서</b>를 팝니다.</p>

<div class="sec"><h2>지금 설계사가 겪는 것 — 이것을 팔 근거입니다</h2>
<div class="row">
  <div class="bx"><div class="v">① 도구가 흩어져 있습니다</div>
    <p>엑셀 · 카톡 · 수첩 · 보험사 전산을 오갑니다. <b>옮겨 적다 하루가 갑니다</b></p></div>
  <div class="bx"><div class="v">② 상담자료를 매번 새로 만듭니다</div>
    <p>전날 밤에 자료를 고칩니다. <b>사람마다 다른 자료</b>로 나갑니다</p></div>
</div>
<div class="row" style="margin-top:12px">
  <div class="bx"><div class="v">③ 계약 뒤가 비어 있습니다</div>
    <p>증권 전달이 밀리고, <b>작년 고객이 지금 어떤지</b> 모릅니다</p></div>
  <div class="bx"><div class="v">④ 리더가 코칭할 거리가 없습니다</div>
    <p>숫자가 없으니 <b>「더 열심히」</b> 말고 할 말이 없습니다</p></div>
</div>
<p class="note">넷 다 <b>사람이 게을러서 생긴 문제가 아니라 도구가 없어서</b> 생긴 문제입니다.
그래서 정신교육이 아니라 화면으로 풉니다.</p></div>

<div class="sec"><h2>무엇을 파는가</h2>
<div class="row">
  <div class="bx dark"><div class="k">규모</div><div class="v">화면 88개 · 14갈래</div>
    <p>유입 → 전화 → 상담 → 계약 → 관리까지 <b>끊기는 데 없이</b> 이어집니다</p></div>
  <div class="bx"><div class="k">핵심</div><div class="v">완성된 상담자료</div>
    <p>보장분석 <b>16장</b>과 재무설계 자료가 <b>이미 만들어져</b> 있습니다</p></div>
  <div class="bx"><div class="k">고정</div><div class="v">CRM + 고객 365일</div>
    <p>계약 전은 CRM 이, 계약 뒤는 365일이 <b>같은 로그인</b>으로</p></div>
</div></div>

<div class="sec"><h2>왜 다른가 — 네 가지</h2>
<div class="row">
  <div class="bx"><div class="v">① 현업이 만들었습니다</div>
    <p>영업을 하는 사람이 <b>자기가 쓰려고</b> 만든 것입니다. 기능이 아니라 <b>순서</b>가 들어 있습니다</p></div>
  <div class="bx"><div class="v">② 준법이 안에 있습니다</div>
    <p>고객 동의 네 단계, 실명 미저장(마스킹), AI 결과마다 준법 안내</p></div>
</div>
<div class="row" style="margin-top:12px">
  <div class="bx"><div class="v">③ 성장이 숫자로 보입니다</div>
    <p>여섯 축으로 재고 <b>가장 낮은 하나</b>를 짚어 줍니다 — 리더가 코칭할 거리가 생깁니다</p></div>
  <div class="bx"><div class="v">④ 전화 걸 이유를 만들어 줍니다</div>
    <p><b>자동차사고 과실·보상</b>으로 사고 난 고객에게, <b>고객에게 전할 뉴스</b>로
    사장님에게 — <b>보험 말고 그 사람 일</b>로 엽니다</p></div>
</div></div>

<div class="sec"><h2>올해 새로 붙인 것 — 파는 말이 여기서 나옵니다</h2>
<div class="row">
  <div class="bx dark"><div class="k">🚗 새 화면</div><div class="v">자동차사고 과실·보상</div>
    <p>사고 상황을 고르면 <b>과실비율 · 법조문 · 판례 · 보상금 · 청구 서류 · 고객 안내문</b>까지.
    과실은 AI 가 아니라 <b>인정기준 도표</b>가 정합니다</p></div>
  <div class="bx"><div class="k">🎣 새 화면</div><div class="v">미끼상품&amp;접촉전략</div>
    <p>작은 담보로 큰 니즈를 여는 법 <b>27장</b>. 거절 응대 <b>롤플레이와 녹음</b>이 붙어 있습니다</p></div>
  <div class="bx"><div class="k">🌐 새 화면</div><div class="v">고객에게 전할 뉴스</div>
    <p>보험 · <b>정책자금 · 세금 · 부동산 · 지원금</b> 다섯 칸. 달 서랍에 쌓입니다</p></div>
</div>
<p class="note"><b>셋 다 「전화 걸 구실」입니다.</b> SaaS 에서 제일 어려운 것이
<b>깔아 놓고 안 쓰는 것</b>인데, 이 셋은 <b>쓸 이유가 밖에서 생깁니다</b> —
고객이 사고를 내고, 정책자금이 풀리고, 거절을 당하니까요.</p></div>

<div class="sec"><h2>누가 삽니까 — 파는 순서도 이 순서입니다</h2>
<div class="row">
  <div class="bx"><div class="k">먼저</div><div class="v">본부장 · 대표</div>
    <p>팀 요금제를 <b>본인이 결제</b>하고 팀에 깔아 줍니다. <b>한 건이 다섯 좌석</b>이라 여기가 제일 큽니다</p></div>
  <div class="bx"><div class="k">그다음</div><div class="v">경력 설계사</div>
    <p>이미 고객이 있어 <b>관리가 급한</b> 사람. 고객 365일과 청구 사후관리로 설득합니다</p></div>
  <div class="bx"><div class="k">마지막</div><div class="v">신입 설계사</div>
    <p>돈이 없지만 <b>제일 절실합니다.</b> 베이직으로 시작해 자리 잡으면 프로로 올라옵니다</p></div>
</div></div>

<div class="sec"><h2>요금제 — 월 결제 기준, 연 결제는 두 달치를 아낍니다</h2>
<table>
<thead><tr><th>요금제</th><th>누구</th><th class="num">월</th><th class="num">연</th>
<th class="num">연 결제 시 월</th><th>좌석</th></tr></thead>
<tbody>
<tr><td><b>베이직</b></td><td>혼자 시작하는 설계사</td>
  <td class="num"><b>{W(PLAN["basic"])}</b></td><td class="num">{W(YEAR["basic"])}</td>
  <td class="num">{W(jsr(YEAR["basic"]/12))}</td><td>1인</td></tr>
<tr class="hi"><td><b>프로</b><span class="pill">주력</span></td><td>제대로 파는 설계사</td>
  <td class="num"><b>{W(PLAN["pro"])}</b></td><td class="num">{W(YEAR["pro"])}</td>
  <td class="num">{W(jsr(YEAR["pro"]/12))}</td><td>1인</td></tr>
<tr><td><b>팀</b></td><td>조직으로 키우는 대표</td>
  <td class="num"><b>{W(PLAN["team"])}</b></td><td class="num">{W(YEAR["team"])}</td>
  <td class="num">{W(jsr(YEAR["team"]/12))}</td><td><b>5인</b></td></tr>
</tbody></table>
<p class="note">단위 원(₩), 부가세 별도 표기 없음. <b>연 결제는 모든 요금제가 월 요금 ×10개월</b>입니다
— 두 달치를 아끼는 구조라 연 결제를 기본으로 안내합니다.</p></div>

<div class="sec"><h2>한 건이 남기는 돈 — 월 기준</h2>
<div class="row">''' + "".join(
    f'''<div class="bx"><div class="k">{nm} · 좌석 {seat}</div>
    <div class="big">{W(PLAN[k]-jsr(PLAN[k]*FEE/100)-seat*AI)}<span class="unit">원</span></div>
    <p>{W(PLAN[k])} − 카드수수료 {W(jsr(PLAN[k]*FEE/100))} − AI {W(seat*AI)}</p></div>'''
    for k, nm, seat in (("basic", "베이직", 1), ("pro", "프로", 1), ("team", "팀", 5))
) + f'''</div>
<p class="note">카드 수수료 <b>{FEE}%</b> · AI 지출 <b>1인당 월 {W(AI)}원(추정)</b> 가정.
앱의 매출 시뮬레이터와 <b>같은 식</b>입니다. AI 실비는 사용량에 따라 달라지며 월 상한을 걸 수 있습니다.</p></div>

{FOOT}
</div>'''

# ─────────────────────────────────────────────── 2쪽
rows = "".join(
    f'''<tr{' class="hi"' if i == 2 else ''}>
    <td><b>{n}</b><br><span style="font-size:12.5px;color:#8B95A1">{d}</span></td>
    <td class="num">{r["b"]} / {r["p"]} / {r["t"]}</td>
    <td class="num">{r["users"]}명</td>
    <td class="num">{W(r["rev"])}</td>
    <td class="num neg">-{W(r["fee"]+r["ai"])}</td>
    <td class="num"><b class="pos">{W(r["net"])}</b></td>
    <td class="num">{r["pct"]}%</td></tr>''' for i, (n, d, r) in enumerate(S, 1))

P2 = f'''<div class="pg">
{head(2)}
<h1>숫자와 실행</h1>
<p class="sub">아래 손익은 <b>구독 건수를 가정</b>하고 앱의 매출 시뮬레이터와 같은 식으로 계산한 것입니다.
<b>목표는 월 순이익 1,000만 원</b>입니다.</p>

<div class="sec"><h2>세 가지 시나리오 — 월 기준</h2>
<table>
<thead><tr><th>단계</th><th class="num">베이직/프로/팀</th><th class="num">사용자</th>
<th class="num">구독 매출</th><th class="num">− 수수료·AI</th><th class="num">순이익</th>
<th class="num">목표 대비</th></tr></thead>
<tbody>{rows}</tbody></table>
<p class="note"><b>목표에 닿는 다른 길</b> — 프로만으로는 <b>219건</b>,
팀 요금제만으로는 <b>99팀(495좌석)</b>이면 월 순이익 1,000만 원이 됩니다.
<b>팀 하나가 프로 두 건 이상</b>을 남기므로, 개인보다 <b>본부를 붙이는 편이 빠릅니다.</b></p></div>

<div class="sec"><h2>그래서 무엇을 하는가 — 실행 네 가지</h2>
<div class="row">
  <div class="bx"><div class="k">01 · 증명</div><div class="v">내 본부에서 먼저</div>
    <p>내가 쓰는 것을 <b>팀이 쓰게</b> 합니다. 쓰는 사람이 있어야 파는 말이 생깁니다</p></div>
  <div class="bx"><div class="k">02 · 확산</div><div class="v">본부 단위로 제안</div>
    <p>개인 영업이 아니라 <b>대표·본부장</b>에게 팀 요금제로 갑니다</p></div>
</div>
<div class="row" style="margin-top:12px">
  <div class="bx"><div class="k">03 · 정착</div><div class="v">90일 아카데미</div>
    <p>깔아만 두면 안 씁니다. <b>교육이 붙어야</b> 해지가 안 납니다</p></div>
  <div class="bx"><div class="k">04 · 유지</div><div class="v">성장판으로 확인</div>
    <p>안 쓰는 사람이 <b>이름으로</b> 보이니 해지 전에 손을 쓸 수 있습니다</p></div>
</div></div>

<div class="sec"><h2>열두 달 — 이 순서로 갑니다</h2>
<table>
<thead><tr><th style="width:110px">시기</th><th>무엇을</th><th>됐다는 뜻</th></tr></thead>
<tbody>
<tr><td><b>1–3개월</b></td><td><b>내 본부부터 정착.</b> 팀 전원이 매일 쓰는 상태를 만듭니다</td>
  <td>안 쓰는 사람 <b>0명</b> · 해지 사유를 여기서 다 뽑습니다</td></tr>
<tr><td><b>4–6개월</b></td><td><b>첫 외부 본부.</b> 팀 요금제로 3~5팀, 90일 교육을 붙여서</td>
  <td>내 본부 밖에서 <b>돈이 들어옵니다</b></td></tr>
<tr><td><b>7–9개월</b></td><td><b>되풀이 가능하게.</b> 도입 절차를 문서로 만듭니다</td>
  <td><b>내가 안 가도</b> 깔립니다</td></tr>
<tr class="hi"><td><b>10–12개월</b></td><td><b>목표 규모.</b> 팀 25 · 프로 150 · 베이직 60</td>
  <td>월 순이익 <b>1,000만 원</b></td></tr>
</tbody></table>
<p class="note">순서를 바꾸지 않습니다. <b>1–3개월을 건너뛰고 외부에 팔면</b>
쓰는 사람 없이 깔리기만 하고 <b>여섯 달 뒤에 전부 해지</b>됩니다.</p></div>

<div class="sec"><h2>직접 채우실 자리 — 확정 자료가 없어 비워 뒀습니다</h2>
<div class="row">
  <div class="bx blank"><div class="k">시장 규모</div><div class="v">목표 시장 설계사 수</div></div>
  <div class="bx blank"><div class="k">확보 경로</div><div class="v">지금까지의 유입 실적</div></div>
  <div class="bx blank"><div class="k">유지율</div><div class="v">월 해지율 · 평균 구독 개월</div></div>
</div>
<p class="note">이 셋은 <b>추정으로 채우면 안 되는 칸</b>입니다. 실제 숫자가 쌓이면 넣으시고,
그전까지는 <b>비워 둔 채로</b> 보여 주는 편이 신뢰를 얻습니다.</p></div>

<div class="sec"><h2>미리 답을 준비해 둘 것 — 받게 될 질문 넷</h2>
<ul>
<li><b>「AI 비용이 사용량대로 늘면?」</b> — 1인당 월 {W(AI)}원으로 잡았고,
  콘솔에서 <b>월 상한</b>을 걸 수 있습니다. 상한을 넘으면 추가 청구가 아니라 중단입니다.</li>
<li><b>「보험사·GA 가 자체 개발하면?」</b> — 화면 수가 아니라
  <b>현업이 만든 순서</b>가 자산입니다. 같은 기능을 만들어도 순서는 못 베낍니다.</li>
<li><b>「개인정보는?」</b> — 고객 실명을 <b>저장하지 않고</b>(마스킹),
  업로드 원문은 비공개 저장소에 두며, <b>동의 상태</b>를 화면이 관리합니다.</li>
<li><b>「깔아 놓고 안 쓰면?」</b> — 그것이 진짜 위험입니다. 그래서
  <b>성장판</b>이 안 쓰는 사람을 이름으로 세워 주고, 90일 교육을 함께 팝니다.</li>
</ul></div>

<div class="sec"><h2>이 계획이 굴러가려면 — 필요한 것 셋</h2>
<div class="row">
  <div class="bx"><div class="k">01</div><div class="v">도입할 본부 한 곳</div>
    <p>내 본부 밖에서 <b>돈을 내고 쓰는 팀</b>이 하나 있어야 그다음이 열립니다</p></div>
  <div class="bx"><div class="k">02</div><div class="v">교육에 쓸 시간</div>
    <p>90일 아카데미는 <b>사람이 붙어야</b> 굴러갑니다. 여기를 아끼면 해지가 납니다</p></div>
  <div class="bx"><div class="k">03</div><div class="v">고칠 사람</div>
    <p>화면 85개는 <b>계속 고쳐야</b> 삽니다. 멈추는 순간 낡습니다</p></div>
</div></div>

<div class="bx dark" style="margin-bottom:22px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:23px;line-height:1.45;margin-top:4px">
  도구를 파는 것이 아니라 <b style="color:#60A5FA">일하는 순서</b>를 팝니다.<br>
  그래서 개인이 아니라 <b style="color:#60A5FA">본부 단위</b>로 붙고,
  깔고 끝이 아니라 <b style="color:#60A5FA">교육까지</b> 같이 갑니다.</div>
</div>

{FOOT}
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>APEX YUN PRO 사업계획 요약</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}</body></html>')
open("plan.html", "w", encoding="utf8").write(HTML)
print(f"plan.html {len(HTML.encode())/1024:.0f}KB")
for n, d, r in S:
    print(f"  {n}: 순이익 {W(r['net'])}원 ({r['pct']}%)")
