# -*- coding: utf-8 -*-
"""「이용 방향」 — 설계사 판 · 매니저 판.

앞 판은 SVG 였다. 잘리지는 않았지만 글자가 고정 크기라 좁은 화면에서
작아져 읽기가 힘들었다. 그래서 **HTML 로 다시 짠다** — 흐르니까 안 잘리고,
글자 크기는 읽는 사람 설정을 따른다.
"""
import sys
sys.stdout.reconfigure(encoding="utf8")

ADV = [
 ("아침", "10분", ["오늘의 알림"],
  "화면이 <b>오늘 걸 사람</b>을 골라 놨습니다. 위에서부터 그대로 겁니다.",
  "목록이 비었다"),
 ("통화 직후", "30초", ["DB 관리 → 접촉", "TA 결과 기록"],
  "결과 · 메모 한 줄 · 약속. 결과가 <b>「상담」</b>이면 약속 칸이 열립니다.",
  "단톡 문구가 만들어졌다"),
 ("만나서", "60분", ["보장분석 상담자료", "재무설계 상담자료"],
  "보험 이야기면 <b>보장분석</b>, 돈 이야기면 <b>재무설계</b>. 탭은 하나만.",
  "다음 약속을 받고 헤어졌다"),
 ("저녁", "5분", ["DB 관리", "고객 365일"],
  "오늘 만난 사람의 <b>단계</b>를 옮기고, 길게 갈 사람은 365일로 넘깁니다.",
  "빨간 글씨가 없다"),
 ("월요일", "5분", ["KPI·타율 분석"],
  "<b>내가 어디서 끊기는지</b>만 봅니다. 가장 낮은 칸 <b>하나만</b> 고칩니다.",
  "이번 주 고칠 것 하나"),
 ("달마다", "20분", ["TFA 업무관리", "내 업적 · 월간보고"],
  "목표와 실적을 적고 제출합니다. <b>본인 점검란</b>으로 내 자리를 확인합니다.",
  "제출했다"),
]

MGR = [
 ("아침", "10분", ["통합 대시보드"],
  "<b>진행률</b>부터. 100%가 아니면 <b>아직 안 건 사람</b>이 남아 있습니다.",
  "진행률 100%"),
 ("매일", "5분", ["담당자·팀 통계"],
  "누가 안 걸었는지 <b>이름으로</b> 보입니다. 혼내려고 보는 게 아닙니다.",
  "막힌 사람에게 말을 걸었다"),
 ("매일", "3분", ["녹음 전달", "부재 이력"],
  "<b>미전달</b>은 그날 닫습니다. <b>3차 이상 부재</b>는 방법을 바꿀 때입니다.",
  "미전달 0건"),
 ("월요일", "10분", ["KPI·타율 분석", "AI 피드백"],
  "<b>팀이 어디서 새는지</b>를 한 칸으로 좁힙니다. 그 칸만 이번 주에 겁니다.",
  "팀에 줄 말 한 줄"),
 ("주마다", "20분", ["TFA 업무관리", "팀원 관리 · 리더 할 일"],
  "코칭 한 줄씩. <b>「더 열심히」는 코칭이 아닙니다</b> — 어느 단계를 어떻게.",
  "전원에게 코칭이 갔다"),
 ("달마다", "30분", ["월간 영업보고서"],
  "팀원 보고를 취합합니다. 안 낸 사람은 화면이 <b>이름으로</b> 세워 줍니다.",
  "안 낸 사람 0명"),
]


def rows(items, tone):
    out = []
    for when, mins, screens, what, done in items:
        chips = "".join(f'<span class="chip">{s}</span>' for s in screens)
        out.append(f'''      <div class="ue-r">
        <div class="ue-w"><b>{when}</b><span>{mins}</span></div>
        <div class="ue-m">
          <div class="ue-sc">{chips}</div>
          <p class="ue-x">{what}</p>
        </div>
        <div class="ue-d"><span>됐다는 뜻</span><b>{done}</b></div>
      </div>''')
    return "\n".join(out)


HTML = f'''<!-- ═══ 맨 앞 · 이용 방향 ═══ -->
<section class="sty" id="s-who">
  <span class="sty-tag">크게 · 둘째</span>
  <h2 class="sty-h">누가 어떻게 쓰는가</h2>
  <p class="sty-d">읽는 사람이 <b>둘</b>입니다.
  <b>설계사</b>는 이 앱을 <b>쓰고</b>, <b>매니저</b>는 이 앱으로 <b>봅니다.</b>
  하루를 어떻게 굴리는지만 여기 적었어요. 화면 쓰는 법은 뒤에서 사진으로 보여 드립니다.</p>

  <div class="ue-p ue-adv">
    <div class="ue-h">
      <span class="ue-who">설계사</span>
      <span class="ue-sub">이 앱을 어떻게 쓰는가</span>
    </div>
{rows(ADV, "adv")}
  </div>

  <div class="rd-note">
    <p class="rd-nh">설계사가 외울 것은 이 한 줄입니다</p>
    <p><b>「오늘의 알림」에서 시작해서 「TA 결과 기록」으로 끝낸다.</b>
    나머지는 이 한 줄을 지키려고 있는 것들이에요.</p>
  </div>

  <div class="ue-p ue-mgr">
    <div class="ue-h">
      <span class="ue-who">매니저</span>
      <span class="ue-sub">이 앱으로 무엇을 보는가</span>
    </div>
{rows(MGR, "mgr")}
  </div>

  <div class="rd-note">
    <p class="rd-nh">매니저가 외울 것도 한 줄입니다</p>
    <p><b>「통합 대시보드」에서 시작해서 「KPI·타율 분석」으로 끝낸다.</b>
    관리는 다그치는 일이 아니라 <b>막힌 자리를 찾는</b> 일이라서,
    매니저가 보는 화면은 전부 <b>사람 이름과 숫자</b>로 되어 있습니다.</p>
  </div>

  <div class="tw-key">
    <a class="tw-k tw-ka" href="#s2"><b>2부 단계</b><span>이 고객이 어느 칸인지</span></a>
    <a class="tw-k tw-ka" href="#s7"><b>7부 상담</b><span>만나서 무슨 말을 하나</span></a>
    <a class="tw-k tw-ka" href="#s8"><b>8부 고객 365일</b><span>계약 뒤를 어떻게 지키나</span></a>
  </div>
</section>
'''
open("frag_use.html", "w", encoding="utf8").write(HTML)
print(f"이용 방향: {len(HTML.encode()):,} bytes")
