# -*- coding: utf-8 -*-
"""제2부 — 단계. TA · AP · PC · CS · 관리를 한눈에."""
import sys
sys.stdout.reconfigure(encoding="utf8")

# ── 파이프라인 그림 (두 줄 × 넷)
ROW1 = [("미접촉", "아직 한 번도 안 걸었다", "전화를 건다"),
        ("TA", "전화로 만날 약속을 잡는다", "날짜·시간이 잡힌다"),
        ("AP", "만나서 듣는다", "고객이 자기 걱정을 말한다"),
        ("PC", "숫자와 자료로 보여 준다", "「얼마가 비었는지」에 고객이 끄덕인다")]
ROW2 = [("CS", "결정을 여쭙는다", "청약서에 이름을 쓴다"),
        ("계약완료", "청약이 들어갔다", "증권이 나온다"),
        ("증권전달", "증권을 손에 쥐어 드렸다", "단계가 닫힌다"),
        ("관리", "청구까지 해 드린다", "소개가 온다")]

BW, GAP, X0 = 211, 28, 16
Y1, Y2, BH = 74, 288, 150
VBW, VBH = 984, 512


def pipe():
    L = [f'    <svg viewBox="0 0 {VBW} {VBH}" role="img" '
         f'aria-label="고객이 지나가는 단계 — 미접촉 TA AP PC CS 계약완료 증권전달 관리">',
         '      <defs><marker id="stA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
         'markerHeight="6.5" orient="auto-start-reverse"><path class="cyc-head" d="M0 0 L10 5 L0 10 Z"/></marker>',
         '      <marker id="stB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
         'markerHeight="6.5" orient="auto-start-reverse"><path class="cyc-head2" d="M0 0 L10 5 L0 10 Z"/></marker></defs>']

    def row(items, y, hot):
        for i, (nm, what, done) in enumerate(items):
            x = X0 + (BW + GAP) * i
            cls = "cyc-box cyc-hi" if nm == hot else "cyc-box"
            tc, wc, dc = ("cyc-th", "cyc-wh", "cyc-sh") if nm == hot else ("cyc-t", "cyc-w", "cyc-s")
            L.append(f'      <rect class="{cls}" x="{x}" y="{y}" width="{BW}" height="{BH}" rx="17"/>')
            L.append(f'      <text class="{tc}" x="{x+20}" y="{y+40}">{nm}</text>')
            L.append(f'      <text class="{wc}" x="{x+20}" y="{y+72}">{what}</text>')
            L.append(f'      <text class="st-d {dc}" x="{x+20}" y="{y+104}">넘어가는 기준</text>')
            L.append(f'      <text class="{dc}" x="{x+20}" y="{y+126}" style="font-size:13.5px">{done}</text>')
            if i < 3:
                L.append(f'      <line class="cyc-ln" x1="{x+BW+3}" y1="{y+BH/2:.0f}" '
                         f'x2="{x+BW+GAP-5}" y2="{y+BH/2:.0f}" marker-end="url(#stA)"/>')
    row(ROW1, Y1, None)
    row(ROW2, Y2, "관리")
    # PC → CS 로 내려가기 (오른쪽 끝에서 왼쪽 끝으로)
    ex = X0 + (BW + GAP) * 3 + BW / 2
    L.append(f'      <path class="cyc-ln" d="M{ex:.0f} {Y1+BH} C {ex:.0f} {Y1+BH+44}, '
             f'{X0+BW/2:.0f} {Y2-44}, {X0+BW/2:.0f} {Y2}" marker-end="url(#stA)"/>')
    L.append(f'      <text class="st-lb" x="{VBW/2:.0f}" y="{Y1+BH+38}" text-anchor="middle">'
             f'여기서 가장 많이 끊깁니다 — 보여 주고 나서 안 여쭙는 것</text>')
    # 관리 → 미접촉 되돌아오기 — 칸을 피해 바깥으로 돌린다
    rx, ry = VBW - 22, Y1 - 46
    lastR = X0 + (BW + GAP) * 3 + BW
    L.append(f'      <path class="cyc-back" d="M{lastR} {Y2+BH/2:.0f} L{rx} {Y2+BH/2:.0f} '
             f'L{rx} {ry} L{X0+BW/2:.0f} {ry} L{X0+BW/2:.0f} {Y1-6}" marker-end="url(#stB)"/>')
    L.append(f'      <text class="cyc-lb" x="{X0+BW/2+16}" y="{ry-10}" text-anchor="start">'
             f'소개가 오면 여기로 다시 — 한 바퀴가 새로 돕니다</text>')
    L.append('    </svg>')
    return "\n".join(L)


# ── 단계별 카드
def card(no, name, sub, rows, now, sig):
    r = "".join(f'    <div class="br-row"><div class="br-k">{k}</div><div class="br-v">{v}</div></div>\n'
                for k, v in rows)
    return f'''  <div class="br">
    <div class="br-hd"><div class="n">{no}</div><div class="t">{name} — {sub}</div></div>
{r}    <div class="br-foot">
      <div class="now"><span class="lb">먼저 준비할 것</span>{now}</div>
      <div class="sig"><span class="lb">막히면 이걸 의심</span>{sig}</div>
    </div>
  </div>
'''


CARDS = "".join([
 card("단계 1", "TA", "전화로 만날 약속까지",
   [("🎯 끝났다는 뜻", "<b>날짜와 시간이 잡혔습니다.</b> 「관심 있다고 하셨어요」는 끝난 게 아닙니다. "
                      "달력에 안 들어갔으면 아직 TA 입니다."),
    ("🧰 어느 화면", '<span class="chip">DB 통합 CRM</span><span class="chip">TA 맞춤 스크립트</span>'
                    '<span class="chip">오늘의 알림</span><span class="chip">AI 상담 어시스턴트</span>'),
    ("📚 뭘 준비하나", "<b>여는 말 하나를 고릅니다.</b> 여섯 개 중 딱 하나만 골라 입에 붙이세요 — "
                     "정중형·공감형·혜택형·질문형·회소성형·소개기반형. "
                     "그리고 <b>거절 세 개</b>만 미리 답을 만들어 둡니다: 「바빠요」 「보험 많아요」 「생각해 볼게요」."
                     '<span class="sub">거절처리 열일곱 탭에 「이렇게 말하지 말 것」이 같이 있습니다. 그쪽부터 읽는 게 빠릅니다.</span>'),
    ("💬 무슨 말", "15초 안에 셋만 — <b>내가 누구인지 · 왜 걸었는지 · 얼마나 걸리는지.</b> "
                  "「10분만 시간 괜찮으실까요?」로 닫습니다."),
    ("✍️ 뭘 남기나", "결과(상담·부재·거절) · 메모 한 줄 · <b>약속 날짜.</b> 끊고 30초 안에요.")],
   "전화 걸 시간을 <b>요일과 시각으로 박아</b> 두세요. 「시간 날 때」 걸면 안 걸립니다. "
   "하루 다섯 통이면 충분합니다.",
   "부재가 많다 → <b>시간대를 바꾸세요.</b> 같은 시간에 세 번 걸면 세 번 다 부재입니다. "
   "거절이 많다 → 여는 말이 <b>길거나 파는 말</b>일 확률이 높습니다."),

 card("단계 2", "AP", "만나서 듣는 자리",
   [("🎯 끝났다는 뜻", "<b>고객이 자기 걱정을 입으로 말했습니다.</b> 내가 설명을 많이 한 날은 AP 가 안 끝난 겁니다."),
    ("🧰 어느 화면", '<span class="chip">상담카드·팩트파인딩</span><span class="chip">고객 365일</span>'
                    '<span class="chip">재무설계 상담자료</span><span class="chip">니즈 시뮬레이터</span>'),
    ("📚 뭘 준비하나", "<b>물어볼 것 다섯 개</b>를 손에 쥐고 갑니다 — 소득 · 가족 · 지금 든 보장 · 걱정 · 우선순위. "
                     "팩트파인딩 칸이 그대로 그 다섯입니다. "
                     "그리고 <b>고객 얼굴 자료(내 소개)</b>를 한 번만 채워 두면 다음부터 저절로 따라옵니다."
                     '<span class="sub">준비물은 사실 이게 전부입니다. 상품 자료는 오늘 안 꺼냅니다.</span>'),
    ("💬 무슨 말", "「<b>강점부터 말씀드리겠습니다</b>」로 엽니다. 공백부터 말하면 불안을 파는 사람이 됩니다. "
                  "그다음은 <b>듣기만</b> 합니다."),
    ("✍️ 뭘 남기나", "상담카드 저장 · <b>「가장 먼저 듣고 싶은 것」 하나.</b> 이게 다음 만남의 첫 문장이 됩니다.")],
   "화면을 <b>고객 쪽으로 돌려</b> 놓는 연습. 내 화면이 아니라 같이 보는 화면이 되면 대화가 달라집니다.",
   "TA 는 많은데 AP 가 안 늘어난다 → <b>전화에서 만남으로 넘기는 말</b>이 문제입니다. "
   "만나자는 말을 안 하고 있을 확률이 큽니다."),

 card("단계 3", "PC", "숫자와 자료로 보여 주기",
   [("🎯 끝났다는 뜻", "<b>「얼마가 비었는지」에 고객이 끄덕였습니다.</b> 상품 이름을 외우게 한 게 아니라, "
                      "빈 자리를 <b>고객이 먼저 봤는지</b>가 기준입니다."),
    ("🧰 어느 화면", '<span class="chip">AI 보장분석</span><span class="chip">8통장 진단지도</span>'
                    '<span class="chip">재무설계 계산기</span><span class="chip">치료비 지급지도</span>'
                    '<span class="chip">비포&애프터</span>'),
    ("📚 뭘 준비하나", "고객이 말한 걱정 <b>하나에만</b> 자료를 붙입니다. 다섯 개 준비해 가면 하나도 안 남습니다."
                     "<br>· 「병원비가 걱정」 → 치료비 지급지도 · AI 보장분석"
                     "<br>· 「돈이 안 모인다」 → 8통장 진단지도"
                     "<br>· 「노후가 막막하다」 → 계산기 연금 탭"
                     "<br>· 「애들 학비」 → 계산기 교육자금 탭"
                     '<span class="sub">발표는 우하단 ▶ 에서 트랙을 골라 엽니다. 탭을 뒤적이지 않아도 됩니다.</span>'),
    ("💬 무슨 말", "「<b>지금 이대로면 이렇게 됩니다</b>」 옆에 「<b>함께라면 이렇게 됩니다</b>」를 나란히. "
                  "겁주는 게 아니라 <b>차이를 숫자로</b> 보여 주는 겁니다."),
    ("✍️ 뭘 남기나", "단계를 <b>PC</b> 로. 어떤 자료를 보여 줬는지 메모 한 줄.")],
   "고객 만나기 전에 <b>계산기 왼쪽을 먼저 채워</b> 두세요. 빈 화면에서 0 을 보여 주면 그날 상담은 거기서 끝납니다.",
   "PC 는 하는데 CS 가 안 나온다 → <b>보여 주고 나서 안 여쭙는 것</b>입니다. "
   "가장 많은 사람이 여기서 멈춥니다."),

 card("단계 4", "CS", "결정을 여쭙는 자리",
   [("🎯 끝났다는 뜻", "<b>청약서에 이름이 들어갔습니다.</b> 「생각해 볼게요」는 CS 가 아니라 아직 PC 입니다."),
    ("🧰 어느 화면", '<span class="chip">제안서 비교</span><span class="chip">제안서 카톡설명</span>'
                    '<span class="chip">금소법 AI</span><span class="chip">알릴의무 필터</span>'),
    ("📚 뭘 준비하나", "<b>선택지를 두세 개로</b> 줄여 갑니다(A·B·C). 하나만 들고 가면 「예/아니오」가 되고, "
                     "다섯 개를 들고 가면 「생각해 볼게요」가 됩니다."
                     "<br>· 미루는 이유를 <b>질문으로</b> 확인합니다 — 「어떤 부분이 걸리세요?」"
                     "<br>· 알릴의무는 <b>여기서</b> 확인합니다. 나중에 나오면 계약이 흔들립니다."
                     '<span class="sub">금소법 AI 로 설명의무 문구를 한 번 확인하고 들어가세요.</span>'),
    ("💬 무슨 말", "「<b>어느 쪽이 편하실까요</b>」. 「하시겠어요?」보다 결정이 쉽습니다. "
                  "그리고 <b>안 하셔도 된다</b>는 말을 진심으로 합니다 — 압박은 부당권유입니다."),
    ("✍️ 뭘 남기나", "단계를 <b>CS</b> → 청약이 들어가면 <b>계약완료</b>로.")],
   "상담 끝나고 <b>그날 안에</b> 카톡 요약을 보냅니다. 요약이 있으면 가족과 상의하기 쉬워집니다.",
   "CS 에서 자꾸 미뤄진다 → 선택지가 <b>너무 많거나 하나뿐</b>입니다. "
   "그리고 결정을 <b>말로 안 여쭙고</b> 있을 확률이 높습니다."),

 card("단계 5", "관리", "증권 전달부터 소개까지",
   [("🎯 끝났다는 뜻", "끝이 없습니다. 다만 <b>증권을 손에 쥐어 드린 날</b> 단계가 한 번 닫히고, "
                      "<b>보험금을 받아 드린 날</b> 소개가 시작됩니다."),
    ("🧰 어느 화면", '<span class="chip">청구·사후관리</span><span class="chip">AI 실비계산기</span>'
                    '<span class="chip">고객 365일</span><span class="chip">오늘의 알림</span>'
                    '<span class="chip">배서 안내서</span>'),
    ("📚 뭘 준비하나", "<b>청구 한 번을 끝까지 해 보는 것</b>이 최고의 준비입니다. 서류가 뭐가 필요한지, "
                     "부지급이 나오면 뭘 보는지 — 한 번 겪으면 그다음부터 말에 힘이 생깁니다."
                     "<br>· 계약완료에서 멈춰 있으면 목록에 <b>빨간 「증권 미전달」</b>이 남습니다. 주 1회 걸러서 다 닫으세요."
                     '<span class="sub">증권 전달이 밀리면 민원으로 갑니다. 사후관리에서 가장 자주 나는 사고입니다.</span>'),
    ("💬 무슨 말", "「<b>청구 도와드릴게요</b>」. 「소개해 주실 분 없으세요?」가 아닙니다. "
                  "한 번 받아 드리면 <b>부탁하지 않아도</b> 옵니다."),
    ("✍️ 뭘 남기나", "단계를 <b>증권전달</b>로 · 터치 기록 한 줄 · 새로 온 소개는 <b>미접촉으로 다시 등록.</b>")],
   "오늘의 알림을 <b>0건으로 비우는 습관</b>. 하루 세 명이면 충분합니다. 여기가 제일 티 안 나게 벌어집니다.",
   "계약은 되는데 소개가 없다 → <b>증권 전달과 청구</b>에서 멈춰 있습니다. "
   "고객 입장에선 계약 후에 사라진 사람입니다."),
])

HTML = f'''<!-- ═══ 2부 · 단계 ═══ -->
<section class="part" id="s2">
  <span class="part-no">제 2 부</span>
  <h2>단계 — TA · AP · PC · CS · 관리</h2>
  <p class="dek">「몇 개월 차에는 이걸 하세요」는 잊으셔도 됩니다.
  중요한 건 <b>지금 이 고객이 어느 단계에 있는가</b> 하나입니다.</p>

  <div class="card blue"><p class="card-h">먼저 이 얘기부터</p>
  <p style="margin:0">
    입사 3개월 차든 3년 차든, 눈앞의 고객은 <b>여섯 단계 중 어딘가에 있습니다.</b>
    3년 차라도 오늘 새로 받은 DB 는 미접촉이고, 3개월 차라도 증권 전달한 고객은 관리 단계입니다.
    그래서 <b>날짜가 아니라 단계로</b> 보시면 훨씬 쉽습니다.
    날짜 이야기(첫 30일 · 90일)는 뒤쪽 <a href="#s13">13부</a>에 참고로 남겨 뒀습니다.
  </p></div>

  <h3>한눈에 — 고객이 지나가는 길</h3>
  <p>
    CRM 목록의 <b>「단계」 칸</b>이 바로 이겁니다. 손으로 정하는 값이고,
    이 칸 하나만 제대로 찍어 두면 <b>내가 어디서 막히는지가 저절로 보입니다.</b>
  </p>

  <figure class="cyc-fig">
{pipe()}
    <figcaption>여덟 칸이지만 실제로 신경 쓸 건 <b>넷</b>입니다 — TA · AP · PC · CS.
    앞뒤(미접촉 · 관리)는 저절로 붙습니다.</figcaption>
  </figure>

  <h3>어디서 막혔는지 30초에 아는 법</h3>
  <p>
    앱의 AI 부서 보고가 쓰는 판정 기준을 그대로 옮겼습니다.
    <b>CRM 단계 칸의 숫자만 보면</b> 답이 나옵니다.
  </p>
  <div class="scroll"><table>
    <thead><tr><th>이렇게 보이면</th><th>문제는 여기</th><th>이걸 바꾸세요</th></tr></thead>
    <tbody>
      <tr><td class="s">TA 는 많은데 AP 가 적다</td><td>전화에서 <b>만남으로 넘기는 말</b></td>
          <td class="k">만나자는 말을 하고 있는지부터 확인. 「10분만」으로 닫기</td></tr>
      <tr><td class="s">AP 는 있는데 PC 가 없다</td><td>듣기만 하고 <b>자료를 안 꺼냄</b></td>
          <td class="k">고객이 말한 걱정 하나에 자료 하나. 다음 약속을 그 자리에서</td></tr>
      <tr><td class="s">PC 는 있는데 CS 가 없다</td><td><b>제안과 클로징</b></td>
          <td class="k">선택지를 A·B·C 로. 「어느 쪽이 편하실까요」를 입 밖으로</td></tr>
      <tr><td class="s">계약은 되는데 증권이 밀린다</td><td><b>사후관리</b> — 민원으로 갑니다</td>
          <td class="k">빨간 「증권 미전달」을 그 주에 다 닫기</td></tr>
      <tr><td class="s">증권까지 갔는데 소개가 없다</td><td>여쭐 <b>때를 놓친 것</b></td>
          <td class="k">증권 전달한 사람에게 청구 안내부터. 소개는 그다음</td></tr>
      <tr><td class="s">부재가 유난히 많다</td><td><b>거는 시간대</b></td>
          <td class="k">오전 10~11시 ↔ 오후 7~8시로 바꿔서 걸기</td></tr>
    </tbody>
  </table></div>
  <p class="ms-tip"><b>이 표가 코칭의 전부입니다</b> 「더 열심히 하세요」는 도움이 안 됩니다.
  단계 분포를 보고 <b>막힌 칸 하나만</b> 짚어 주는 게 훨씬 빠릅니다.
  리더시라면 팀원 화면을 이 순서로 보시면 됩니다.</p>

  <h3>단계마다 무엇을 하고, 무엇을 준비하나</h3>
  <p>
    다섯 장에 나눠 적었습니다. 각 장은 <b>끝났다는 뜻 · 어느 화면 · 뭘 준비하나 ·
    무슨 말 · 뭘 남기나</b> 순서로 되어 있습니다. 지금 막힌 단계 한 장만 보셔도 됩니다.
  </p>

{CARDS}
  <h3>준비는 이 순서로 공부하면 됩니다</h3>
  <p>
    「뭘 공부해야 하나」도 단계로 정리하면 간단해집니다.
    아래는 앱의 교육 과정에 들어 있는 것을 <b>단계 기준으로 다시 묶은 것</b>입니다.
    한 번에 다 하지 마시고, <b>지금 막힌 단계 줄만</b> 보세요.
  </p>
  <div class="scroll"><table>
    <thead><tr><th>단계</th><th>공부할 것</th><th>연습하는 화면</th></tr></thead>
    <tbody>
      <tr><td class="s">TA</td><td>첫 멘트 · 거절 대응 · 재접촉 타이밍</td>
          <td class="k">TA 맞춤 스크립트 · AI 상담 어시스턴트</td></tr>
      <tr><td class="s">AP</td><td>고객 프로필 · 가족 · 직업 · 관심 · 위험<br>팩트파인딩 다섯 칸</td>
          <td class="k">고객 365일 · 상담카드·팩트파인딩</td></tr>
      <tr><td class="s">PC ①<br>보장</td><td>암·뇌·심 진단/수술/치료/소득공백<br>강점 · 공백 · 중복 · 구조위험<br>실손 · 간병 · 재가 · 운전자 · 화재</td>
          <td class="k">치료비 지급지도 · AI 보장분석 · 질병코드·특약</td></tr>
      <tr><td class="s">PC ②<br>돈</td><td>소득 · 지출 · 비상금 · 부채 · 저축여력<br>단기·중기·장기 목적자금<br>복리 · 세금 · 유동성 · 안전성</td>
          <td class="k">8통장 진단지도 · 재무설계 계산기 · 투자 컨설팅</td></tr>
      <tr><td class="s">PC ③<br>노후</td><td>공적/퇴직/개인연금 · 노후 필요자금<br>사업비 · 환급률 · 통화분산</td>
          <td class="k">연금 시뮬레이션 · 변액·달러 컨설팅</td></tr>
      <tr><td class="s">CS</td><td>문제 재정리 · 미루는 이유 · 결정 요청<br>설명의무 · 부당권유 금지 · 알릴의무</td>
          <td class="k">제안서 비교 · 제안서 카톡설명 · 금소법 AI</td></tr>
      <tr><td class="s">관리</td><td>지급명세서 · 서류 · 부지급 대응<br>배서 · 정기 점검</td>
          <td class="k">청구·사후관리 · AI 실비계산기 · 배서 안내서</td></tr>
      <tr><td class="s">전체</td><td>다섯을 하나로 잇는 풀컨셉<br>보장 → 비상금 → 부채 → 저축 → 연금</td>
          <td class="k">비포&애프터 · 재무설계 실전화법서</td></tr>
    </tbody>
  </table></div>
  <p class="ms-warn"><b>순서를 앞당기지 마세요</b> 보장이 안 끝났는데 연금 이야기를 꺼내면
  좋은 제안도 해지로 돌아옵니다. 고객 삶의 순서는
  <b>보장 → 비상금 → 부채 → 저축 → 연금</b>입니다.</p>

  <h3>오늘 내 고객을 단계에 줄 세우는 법</h3>
  <p>딱 10분이면 됩니다. 이걸 해 두면 내일부터 뭘 할지 고민할 일이 없어집니다.</p>
  <div class="ms-do"><p class="ms-h">10분 안에 끝나는 정리</p><ol>
    <li>CRM <b>DB 관리</b>를 엽니다.</li>
    <li>거르개에서 <b>「단계」</b>를 하나씩 골라 보며, 물음표(<b>?</b>)가 붙은 사람을 찾습니다 —
        아직 손으로 정한 적이 없어 <b>결과에서 짐작한</b> 값입니다.</li>
    <li>한 사람씩 <b>수정</b>을 눌러 지금 진짜 단계로 바꿉니다. 헷갈리면 <b>낮은 쪽</b>으로 찍으세요.</li>
    <li>다 하고 나서 단계별로 <b>몇 명씩인지</b> 세어 봅니다. 그 분포가 위의 진단표와 만나는 자리입니다.</li>
    <li>가장 많이 쌓인 칸 <b>하나</b>를 이번 주 목표로 정합니다.</li>
  </ol></div>
  <div class="card solid">
    <p class="card-h">이 장을 한 줄로</p>
    <p style="margin:0;font-size:17px">
      <b>날짜 말고 단계.</b> 단계 칸만 제대로 찍어 두면
      내가 어디서 막히는지, 뭘 공부해야 하는지가 화면에 저절로 나옵니다.
    </p>
  </div>
</section>
'''

open("frag_stage.html", "w", encoding="utf8").write(HTML)
print(f"제2부 단계: {len(HTML.encode()):,} bytes")
