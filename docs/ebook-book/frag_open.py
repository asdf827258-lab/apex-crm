# -*- coding: utf-8 -*-
"""맨 앞 장 — 「우리가 하는 일」. APEX 가 설계사의 값을 어떻게 올리는지 한 장으로."""
import sys
sys.stdout.reconfigure(encoding="utf8")

# ── 값이 오르는 여섯 축 (아이콘, 이름, 무엇이 오르나, 어느 화면)
AXES = [
    ("🧠", "기억", "이백 명을 기억하는 사람이 됩니다", "DB 통합 CRM · 고객 365일 · 상담카드"),
    ("📜", "근거", "의견이 아니라 약관 문장으로 말합니다", "미끼 레이더 · AI 보장분석 · 보험 해석"),
    ("🔢", "숫자", "검산한 숫자만 꺼냅니다", "재무설계 계산기 · 실무 계산기 · 8통장 진단"),
    ("⚡", "속도", "모르는 걸 5분 안에 찾아옵니다", "자료 조회 여섯 · 윤시현의 두뇌 · AI 비서"),
    ("🛡️", "끝까지", "계약이 아니라 지급까지 갑니다", "청구·사후관리 · AI 실비계산기 · 계약관리"),
    ("📣", "알려짐", "찾아오게 만듭니다", "블로그 · 스레드 · 메타 광고 · 디지털 명함"),
]

BOX_X, BOX_W, BOX_H, PITCH, TOP = 300, 624, 78, 96, 20
HUB = (16, 208, 240, 176)
VBW, VBH = 940, 596


def value_map():
    hx, hy, hw, hh = HUB
    hcx, hcy = hx + hw / 2, hy + hh / 2
    ys = [TOP + PITCH * i for i in range(6)]
    L = [f'    <svg viewBox="0 0 {VBW} {VBH}" role="img" '
         f'aria-label="APEX 가 설계사의 값을 올리는 여섯 가지 — 기억 근거 숫자 속도 끝까지 알려짐">']
    for y in ys:
        ty = y + BOX_H / 2
        L.append(f'      <path class="mp-ln" d="M{hx+hw} {hcy:.0f} '
                 f'C {hx+hw+56} {hcy:.0f}, {BOX_X-56} {ty:.0f}, {BOX_X} {ty:.0f}"/>')
    L.append(f'      <rect class="mp-hub mp-a" x="{hx}" y="{hy}" width="{hw}" height="{hh}" rx="22"/>')
    L.append(f'      <text class="mp-hi" x="{hcx:.0f}" y="{hcy-34:.0f}" text-anchor="middle">우리가 올리는 것</text>')
    L.append(f'      <text class="mp-hn" x="{hcx:.0f}" y="{hcy+8:.0f}" text-anchor="middle">설계사의 값</text>')
    L.append(f'      <text class="mp-hs" x="{hcx:.0f}" y="{hcy+40:.0f}" text-anchor="middle">상품이 아니라 사람</text>')
    for (ic, name, what, tools), y in zip(AXES, ys):
        L.append(f'      <rect class="mp-box" x="{BOX_X}" y="{y}" width="{BOX_W}" height="{BOX_H}" rx="15"/>')
        L.append(f'      <text x="{BOX_X+20}" y="{y+35}" style="font-size:22px">{ic}</text>')
        L.append(f'      <text class="mp-t" x="{BOX_X+58}" y="{y+34}">{name}</text>')
        L.append(f'      <text class="op-w" x="{BOX_X+118}" y="{y+34}">{what}</text>')
        L.append(f'      <text class="mp-s mp-b-s" x="{BOX_X+58}" y="{y+61}">{tools}</text>')
    L.append('    </svg>')
    return "\n".join(L)


HTML = f'''<!-- ═══ 맨 앞 · 우리가 하는 일 ═══ -->
<section class="sty" id="s-what">
  <span class="sty-tag">우리가 하는 일</span>
  <h2 class="sty-h">설계사의 값을 올립니다</h2>
  <p class="sty-d">이 책이 무엇에 대한 책인지 먼저 말씀드리겠습니다. 기능 설명서가 아닙니다.
  <b>같은 사람이 같은 시간을 쓰고도 더 받는 사람이 되는 방법</b>을 적은 책입니다.</p>

  <div class="sty-e">
    <p class="l">보험은 어디서 들어도 같은 상품입니다.<br>다른 건 파는 사람뿐입니다.</p>
    <p>그래서 우리가 올리는 건 상품이 아니라 <b>사람의 값</b>입니다.
    APEX 는 그 값을 올리려고 만든 도구고, 이 책은 그 도구를 쓰는 순서입니다.</p>
  </div>

  <h3>APEX 가 값을 올리는 여섯 가지</h3>
  <p>
    거창한 얘기가 아닙니다. 고객이 설계사를 다시 부를지 말지는 아래 여섯 가지에서 갈립니다.
    하나하나가 <b>왼쪽 메뉴 어딘가에 화면으로 박혀</b> 있습니다.
  </p>

  <figure class="cyc-fig mp-fig">
{value_map()}
    <figcaption>여섯 가지 중 <b>하나만 확실히 올라도</b> 고객은 알아봅니다.
    전부 하려다 아무것도 안 되는 게 제일 흔한 실패입니다.</figcaption>
  </figure>

  <h3>고객이 실제로 느끼는 차이</h3>
  <p>말로 하면 추상적이니까, 고객 쪽에서 어떻게 보이는지로 적어 보겠습니다.</p>
  <div class="bfa">
    <div class="bfa-hd"><span></span><span>도구 없이</span><span class="bfa-a">APEX 로</span></div>
    <div class="bfa-r"><span class="bfa-t">기억</span>
      <span class="bfa-b">「저번에 뭐라고 하셨죠?」</span>
      <span class="bfa-a">「지난번에 <b>어머님 수술</b> 말씀하셨죠」</span></div>
    <div class="bfa-r"><span class="bfa-t">근거</span>
      <span class="bfa-b">「이 회사가 좋아요」 — 왜인지는 설명이 길어짐</span>
      <span class="bfa-a">「약관 <b>이 문장</b>입니다」 — 원문을 띄워 보여 줌</span></div>
    <div class="bfa-r"><span class="bfa-t">숫자</span>
      <span class="bfa-b">「대충 이 정도 나옵니다」</span>
      <span class="bfa-a">「<b>이렇게 계산됩니다</b>」 — 화면을 같이 보며</span></div>
    <div class="bfa-r"><span class="bfa-t">속도</span>
      <span class="bfa-b">「알아보고 연락드릴게요」 (그리고 잊음)</span>
      <span class="bfa-a">「<b>지금 확인해 드리겠습니다</b>」 — 그 자리에서</span></div>
    <div class="bfa-r"><span class="bfa-t">끝까지</span>
      <span class="bfa-b">계약하고 연락이 끊김</span>
      <span class="bfa-a">「<b>청구까지 제가 합니다</b>」 — 보험금 받은 날 다시 만남</span></div>
    <div class="bfa-r"><span class="bfa-t">알려짐</span>
      <span class="bfa-b">아는 사람이 떨어지면 막힘</span>
      <span class="bfa-a">「<b>글 보고 연락드렸어요</b>」 — 모르는 사람이 먼저 옴</span></div>
  </div>
  <p>
    오른쪽 여섯 줄이 <b>값이 올랐다는 증거</b>입니다.
    한 줄이라도 오른쪽으로 넘어가 있으면 이미 다른 설계사고, 여섯 줄이 다 넘어가면
    <b>고객이 소개를 먼저 꺼냅니다.</b>
  </p>

  <h3>그동안 해 온 것</h3>
  <p>
    이 도구는 기획서에서 나온 게 아닙니다. <b>현장에서 깨진 자리를 하나씩 막다 보니</b> 이만큼 됐습니다.
    아래 숫자는 자랑이 아니라, 이 책에 적힌 순서들이 어디서 나왔는지에 대한 설명입니다.
  </p>
  <div class="stats">
    <div class="stat"><div class="v">80개</div><div class="l">화면 · 열네 칸</div></div>
    <div class="stat"><div class="v">46번</div><div class="l">서버 구조를 고친 횟수</div></div>
    <div class="stat"><div class="v">90번</div><div class="l">최근 열흘 동안 고친 횟수</div></div>
    <div class="stat"><div class="v">5개</div><div class="l">크게 당하고 막은 사고</div></div>
  </div>
  <p>
    화면 하나하나가 <b>「이렇게 하다 크게 당했다」의 결과</b>입니다.
    약속이 사라져서 만든 칸, 나이를 안 보고 계산해서 70만원을 부풀려 말한 뒤에 만든 칸,
    한 컴퓨터를 같이 쓰다 소개가 덮여서 만든 칸 — 바로 다음 장에 그 이야기가 나옵니다.
  </p>
  <p class="ms-tip"><b>그래서 순서를 건너뛰면</b> 그 사고를 다시 겪게 됩니다.
  이 책이 순서를 자꾸 강조하는 이유가 그것뿐입니다.</p>

  <h3>이 책을 어떻게 읽으면 되나</h3>
  <p>
    처음부터 끝까지 읽으실 필요는 없습니다. <b>지금 막힌 자리부터</b> 펴 보시면 됩니다.
  </p>
  <ul class="ck">
    <li><b>뭐부터 해야 할지 모르겠다</b> — <a href="#s1">1부 한 장으로</a>. 가치관과 여덟 단계가 한 장에 있습니다.</li>
    <li><b>고객이 어디서 끊기는지 모르겠다</b> — <a href="#s2">2부 단계</a>. TA · AP · PC · CS · 관리를 단계로 봅니다.</li>
    <li><b>전화가 안 된다 · 기록이 밀린다</b> — <a href="#s6">6부 CRM 설명서</a>. 화면 사진에 번호를 찍어 뒀습니다.</li>
    <li><b>어느 화면을 열어야 할지 모르겠다</b> — <a href="#s10">10부 도구 백과</a>. 이름으로 찾으면 됩니다.</li>
  </ul>
</section>
'''

open("frag_open.html", "w", encoding="utf8").write(HTML)
print(f"우리가 하는 일: {len(HTML.encode()):,} bytes")
