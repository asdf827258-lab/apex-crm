# -*- coding: utf-8 -*-
"""맨 앞 — 영업프로세스를 APEX 는 어떻게 접근하는가."""
import sys
sys.stdout.reconfigure(encoding="utf8")

# (번호, 이름, 부제, 사람이 하던 것, APEX 가 하는 것[줄], 남는 것)
PH = [
 ("1", "유입", "만나기 전",
  ["아는 사람 명단을", "머리로 떠올린다.", "떨어지면 막힌다"],
  ["콘텐츠·광고로", "찾아오게 만들고,", "들어온 리드는", "그날 CRM 에 올린다"],
  "DB 종류 · 배정일"),
 ("2", "접촉", "TA · 전화",
  ["뭐라고 열지", "매번 새로", "생각한다"],
  ["DB 종류별 대본이", "통화 창에 같이 뜬다.", "거절 열일곱 개는", "답이 미리 있다"],
  "결과 · 메모 · 약속"),
 ("3", "면담", "AP · 만남",
  ["기억으로 묻고,", "끝나면 잊는다.", "다음에 또 묻는다"],
  ["팩트파인딩 다섯 칸을", "고객과 같이 채우고,", "적은 것이 단추 없이", "계산기로 넘어간다"],
  "상담카드 · 아픈 곳"),
 ("4", "설계", "PC · 제안",
  ["「대충 이 정도」", "라고 말한다.", "근거는 기억뿐"],
  ["엑셀과 대조한 엔진이", "계산하고, 근거는", "약관 원문 문장으로", "그 쪽까지 떠서 보여 준다"],
  "보고서 · 비포&애프터"),
 ("5", "체결", "CS · 청약",
  ["분위기 봐서", "여쭙거나,", "못 여쭙고 끝난다"],
  ["A·B·C 선택지와", "설명의무 문구를", "화면이 챙기고,", "알릴의무를 먼저 거른다"],
  "단계 CS → 계약완료"),
 ("6", "관리", "증권 · 청구 · 소개",
  ["계약 뒤", "연락이 끊긴다.", "1년 뒤 남의 고객"],
  ["7일 넘은 고객을", "화면이 매일 골라 주고,", "증권 미전달은", "빨갛게 남는다"],
  "터치 기록 · 새 소개"),
]

GUT, X0, CW, CG = 132, 148, 158, 14
VBW = 1180
Y_PH, H_PH = 62, 116
Y_HU, H_HU = 214, 108
Y_AX, H_AX = 350, 152
Y_LF, H_LF = 528, 74
VBH = 634


def col(i):
    return X0 + (CW + CG) * i


def build():
    P = [f'    <svg viewBox="0 0 {VBW} {VBH}" role="img" '
         f'aria-label="영업프로세스 여섯 단계에서 사람이 하던 일을 APEX 가 화면으로 옮긴 그림">',
         '      <defs><marker id="flA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
         'markerHeight="6" orient="auto-start-reverse"><path class="fl-hd" d="M0 0 L10 5 L0 10 Z"/></marker></defs>']

    for lab, y, h, cls in [("영업프로세스", Y_PH, H_PH, "fl-rl fl-rl1"),
                           ("사람이 하던 것", Y_HU, H_HU, "fl-rl fl-rl2"),
                           ("APEX 가 하는 것", Y_AX, H_AX, "fl-rl fl-rl3"),
                           ("남는 것", Y_LF, H_LF, "fl-rl fl-rl4")]:
        P.append(f'      <text class="{cls}" x="{GUT-14}" y="{y+h/2+6:.0f}" text-anchor="end">{lab}</text>')

    for i, (no, nm, sub, hum, ax, leave) in enumerate(PH):
        x = col(i)
        # 프로세스 칸
        P.append(f'      <rect class="fl-ph" x="{x}" y="{Y_PH}" width="{CW}" height="{H_PH}" rx="15"/>')
        P.append(f'      <text class="fl-no" x="{x+18}" y="{Y_PH+34}">{no}</text>')
        P.append(f'      <text class="fl-nm" x="{x+18}" y="{Y_PH+72}">{nm}</text>')
        P.append(f'      <text class="fl-sb" x="{x+18}" y="{Y_PH+98}">{sub}</text>')
        if i < 5:
            P.append(f'      <line class="fl-ar" x1="{x+CW+2}" y1="{Y_PH+H_PH/2:.0f}" '
                     f'x2="{x+CW+CG-4}" y2="{Y_PH+H_PH/2:.0f}" marker-end="url(#flA)"/>')
        # 사람이 하던 것
        P.append(f'      <rect class="fl-hu" x="{x}" y="{Y_HU}" width="{CW}" height="{H_HU}" rx="14"/>')
        for j, ln in enumerate(hum):
            P.append(f'      <text class="fl-ht" x="{x+16}" y="{Y_HU+32+j*25}">{ln}</text>')
        # 내려가는 화살표
        P.append(f'      <line class="fl-dn" x1="{x+CW/2:.0f}" y1="{Y_HU+H_HU+4}" '
                 f'x2="{x+CW/2:.0f}" y2="{Y_AX-6}" marker-end="url(#flA)"/>')
        # APEX 가 하는 것
        P.append(f'      <rect class="fl-ax" x="{x}" y="{Y_AX}" width="{CW}" height="{H_AX}" rx="14"/>')
        for j, ln in enumerate(ax):
            P.append(f'      <text class="fl-at" x="{x+16}" y="{Y_AX+34+j*27}">{ln}</text>')
        # 남는 것
        P.append(f'      <rect class="fl-lf" x="{x}" y="{Y_LF}" width="{CW}" height="{H_LF}" rx="14"/>')
        P.append(f'      <text class="fl-lt" x="{x+CW/2:.0f}" y="{Y_LF+30}" text-anchor="middle">기록</text>')
        P.append(f'      <text class="fl-lv" x="{x+CW/2:.0f}" y="{Y_LF+56}" text-anchor="middle">{leave}</text>')

    P.append(f'      <text class="fl-cap" x="{VBW/2:.0f}" y="{VBH-12}" text-anchor="middle">'
             f'아래 줄(기록)이 다음 칸의 재료가 됩니다 — 기록이 비면 그 자리에서 프로세스가 끊깁니다</text>')
    P.append('    </svg>')
    return "\n".join(P)


HTML = f'''<!-- ═══ 맨 앞 · 영업프로세스 ═══ -->
<section class="sty" id="s-flow">
  <span class="sty-tag">영업프로세스</span>
  <h2 class="sty-h">APEX 는 어떻게 접근하는가</h2>
  <p class="sty-d">영업프로세스 자체는 어디나 같습니다 — 만나고, 듣고, 보여 주고, 여쭙고, 지킵니다.
  APEX 가 다른 건 딱 하나예요. <b>그 과정에서 사람이 기억하고 판단하던 것을 화면으로 옮겼습니다.</b></p>

  <div class="sty-e">
    <p class="l">잘하는 사람의 방식을<br>화면에 심어 두면, 누구나 그 방식으로 일합니다.</p>
    <p>그래서 APEX 는 「기능이 많은 프로그램」이 아니라 <b>영업프로세스를 그대로 옮겨 놓은 판</b>입니다.
    아래 그림 한 장이 그 전부입니다.</p>
  </div>

  <figure class="brain">
{build()}
    <figcaption><b>가운데 두 줄</b>을 비교해서 보시면 됩니다 —
    위는 도구 없이 사람이 하던 것, 아래는 APEX 가 대신 하는 것.
    맨 아래 <b>기록</b> 줄이 다음 칸으로 넘어가는 재료입니다.</figcaption>
  </figure>

  <h3>여섯 칸을 자세히</h3>
  <p>
    같은 내용을 표로도 두겠습니다. <b>지금 내가 어느 칸에 있는지</b> 찾으신 다음,
    그 줄만 가로로 읽어 보시면 됩니다.
  </p>
  <div class="scroll"><table>
    <thead><tr><th>칸</th><th>이 칸의 목표</th><th>APEX 접근</th><th>쓰는 화면</th><th>넘어가는 기준</th></tr></thead>
    <tbody>
      <tr><td class="s">1 유입</td>
          <td>아는 사람이 떨어져도 <b>안 막히게</b> 만든다</td>
          <td>사람을 찾아다니는 대신 <b>찾아오게</b> 만들고, 들어온 리드는 그날 등록한다.
              신상품·약관 근거로 <b>이달의 컨셉</b>을 하나 정한다</td>
          <td class="k">블로그 · 스레드 · 메타 광고 · 디지털 명함 · 미끼 레이더</td>
          <td class="k">CRM 에 이름이 올라갔다</td></tr>
      <tr><td class="s">2 접촉 TA</td>
          <td>전화로 <b>만날 약속</b>까지 간다</td>
          <td>화법을 외우게 하지 않는다. <b>DB 종류별 대본</b>이 통화 창에 같이 뜨고,
              거절 열일곱 개에는 「이렇게 말하지 말 것」까지 붙어 있다</td>
          <td class="k">DB 통합 CRM · TA 맞춤 스크립트 · 오늘의 알림</td>
          <td class="k">날짜와 시간이 잡혔다</td></tr>
      <tr><td class="s">3 면담 AP</td>
          <td>고객이 <b>자기 걱정을 말하게</b> 한다</td>
          <td>설계사가 설명하는 자리가 아니라 듣는 자리로 만든다.
              화면을 고객 쪽으로 돌려 <b>같이 채우고</b>, 적은 것은 단추 없이 계산기로 넘어간다</td>
          <td class="k">상담카드·팩트파인딩 · 재무설계 상담자료 · 고객 365일</td>
          <td class="k">「가장 먼저 듣고 싶은 것」이 정해졌다</td></tr>
      <tr><td class="s">4 설계 PC</td>
          <td><b>얼마가 비었는지</b>를 고객이 먼저 보게 한다</td>
          <td>「대충 이 정도」를 없앤다. 연금은 254 시나리오를 엑셀과 대조한 엔진이 계산하고,
              보장은 <b>약관 원문 문장</b>으로 근거를 댄다. 못 찾은 칸은 0 이 아니라 빈 칸</td>
          <td class="k">AI 보장분석 · 8통장 진단지도 · 재무설계 계산기 · 비포&애프터</td>
          <td class="k">고객이 「얼마가 비었는지」에 끄덕였다</td></tr>
      <tr><td class="s">5 체결 CS</td>
          <td>미루지 않게 <b>결정을 여쭙는다</b></td>
          <td>선택지를 A·B·C 로 줄이고, 설명의무 문구와 알릴의무를 <b>화면이 먼저 거른다</b>.
              압박하지 않는다 — 부당권유는 계약도 신뢰도 같이 날립니다</td>
          <td class="k">제안서 비교 · 제안서 카톡설명 · 금소법 AI · 알릴의무 필터</td>
          <td class="k">청약서에 이름이 들어갔다</td></tr>
      <tr><td class="s">6 관리</td>
          <td>계약이 아니라 <b>지급까지</b> 간다</td>
          <td>사람이 기억하지 않는다. 7일 넘게 손대지 않은 고객을 <b>화면이 매일 골라</b> 올리고,
              증권 미전달은 목록에 빨갛게 남는다. 청구 한 번이 소개를 만든다</td>
          <td class="k">오늘의 알림 · 고객 365일 · 청구·사후관리 · AI 실비계산기</td>
          <td class="k">증권을 전달했고, 소개가 왔다</td></tr>
    </tbody>
  </table></div>

  <h3>그래서 무엇이 달라지나</h3>
  <p>이 접근이 실제로 바꾸는 건 넷입니다. 화려한 얘기는 없고, 전부 <b>안 새게 만드는</b> 쪽입니다.</p>
  <div class="creed">
    <div><div class="n">하나</div><div class="t">잊어서 잃는 일이 없어집니다</div>
    <div class="d">약속도 통화도 다음 할 일도 <b>화면이 들고 있습니다.</b>
    스무 명까지는 머리로 되지만 이백 명은 아무도 못 하거든요.</div></div>
    <div><div class="n">둘</div><div class="t">사람마다 다르던 말이 같아집니다</div>
    <div class="d">화법과 근거가 화면에 있으니 <b>오늘 입사한 사람도 같은 말</b>을 합니다.
    팀에 기준이 생기는 게 여기서부터예요.</div></div>
    <div><div class="n">셋</div><div class="t">막힌 자리가 숫자로 보입니다</div>
    <div class="d">「더 열심히」가 아니라 <b>「TA 는 많은데 AP 가 없다」</b>로 말할 수 있게 됩니다.
    고칠 것이 하나로 좁혀지면 사람이 안 지칩니다.</div></div>
    <div><div class="n">넷</div><div class="t">계약 뒤가 비지 않습니다</div>
    <div class="d">증권 전달과 청구가 <b>할 일 목록에 남습니다.</b>
    여기가 소개가 나오는 자리이고, 대부분이 놓치는 자리이기도 합니다.</div></div>
  </div>

  <p class="ms-warn"><b>다만 이건 분명히 해 두겠습니다</b> 도구가 계약을 만들어 주지는 않습니다.
  전화는 여전히 사람이 걸고, 결정은 여전히 고객이 합니다.
  APEX 가 하는 건 <b>새어 나가는 것을 막고, 잘하는 사람의 방식을 옮겨 심는 것</b>까지예요.
  그다음은 하시는 분의 몫입니다.</p>

  <p>
    각 칸을 실제로 어떻게 하는지는 <a href="#s2">2부 단계</a>에 단계별 카드로 적어 두었고,
    화면을 눌러 가며 따라 하시려면 <a href="#s6">6부 CRM 설명서</a>에 사진과 번호가 있습니다.
  </p>
</section>
'''

open("frag_flow.html", "w", encoding="utf8").write(HTML)
print(f"영업프로세스: {len(HTML.encode()):,} bytes · viewBox {VBW}×{VBH}")
