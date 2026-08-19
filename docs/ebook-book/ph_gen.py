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
    <div class="pt">핸드폰 한 화면 — 오늘 하나<br>{n} / {tot}</div></div>'''


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


# ═══════════════════════════════ 1쪽 — 겹침 정리 + 알람
P1 = f'''<div class="pg">
{head(1)}
<h1>알람은 우리가 만들지 않습니다</h1>
<p class="sub">폰 캘린더에 넣으면 <b>폰이 알아서 울립니다.</b>
서버도 대행사도 심의도 없습니다. <b>파일 한 줄</b>이면 됩니다.</p>

<div class="sec"><h2>먼저 — 겹치지 않게 선을 긋습니다</h2>
<table>
<thead><tr><th style="width:210px">누가</th><th style="width:300px">무엇을 이미 했나</th>
<th>제가 안 건드립니다</th></tr></thead>
<tbody>
<tr><td><b>main #251</b></td><td>폰 홈 화면 담기 · <b>?go=crm · ?go=airep</b> ·
  즐겨찾기 · 메뉴 찾기 · 최근 쓴 것</td>
  <td>담는 길과 지름길은 <b>이미 됐습니다.</b> 그 위에 얹기만 합니다</td></tr>
<tr><td><b>고객관리 세션</b></td><td><b>3년 관리 규칙</b> — 첫 회 출금 · 암 면책 90일 ·
  13회차 · 3주년. 「제도」 딱지와 기준일 추정 표시까지</td>
  <td><b>규칙은 그쪽 것입니다.</b> 제가 쓰려던 「판단 열 줄」은
  <b>이미 더 잘 만들어져</b> 있어 안 씁니다</td></tr>
<tr><td><b>두뇌↔CRM 세션</b></td><td>윤시현의 두뇌에서 DB 통합 CRM 으로 잇기</td>
  <td>화면 사이 이동은 그쪽입니다</td></tr>
<tr class="" style="background:#EFF6FF"><td><b>이 문서</b></td>
  <td><b>약속 → 폰 캘린더 · 알람</b>과
  <b>TFA+CRM+캘린더를 폰 한 화면으로</b></td>
  <td>지금 <b>아무도 안 하고 있는</b> 두 가지입니다</td></tr>
</tbody></table>
<p class="note"><b>확인한 것</b> — 앱 전체에 <b>VEVENT 가 0건</b>입니다.
「캘린더」라는 이름은 <b>콘텐츠 캘린더</b>(글 올리는 일정)뿐이고,
<b>상담 약속이 폰 캘린더로 나가는 길이 없습니다.</b></p></div>

<div class="sec"><h2>왜 캘린더입니까 — 알람을 직접 만들면 안 되는 이유</h2>
<div class="row">
  <div class="bx red"><div class="k">웹 푸시로 하면</div>
    <div class="v">아이폰에서 잘 안 됩니다</div>
    <p>홈 화면에 <b>담은 사람만</b> 받을 수 있고, 서버·구독키·인증서가 필요합니다.
    게다가 <b>알림을 한 번 끄면</b> 되살릴 방법이 없습니다</p></div>
  <div class="bx grn" style="flex:1.3"><div class="k">캘린더에 넣으면</div>
    <div class="v">폰이 알아서 울립니다</div>
    <p>이미 <b>매일 보는 곳</b>이고, <b>이미 켜 둔 알람</b>입니다.
    아이폰·안드로이드 <b>둘 다</b> 됩니다. 서버가 필요 없습니다.<br><br>
    <b>「1일 전」과 「1시간 전」</b> 두 번 울리게 파일에 적어 두면
    폰이 그대로 지킵니다.</p></div>
</div></div>

<div class="sec"><h2>두 가지 길 — 하나는 오늘, 하나는 나중에</h2>
<table>
<thead><tr><th style="width:150px">길</th><th style="width:250px">어떻게</th>
<th>좋은 점 · 아쉬운 점</th></tr></thead>
<tbody>
<tr><td><b>① 한 건씩 담기</b><br>
  <span style="font-size:11.5px;color:#8B95A1">오늘 됩니다</span></td>
  <td>약속을 잡을 때 <b>「캘린더에 담기」</b> 단추.
  누르면 파일이 열리고 <b>폰이 「추가할까요?」</b>를 묻습니다</td>
  <td><b>서버가 필요 없습니다.</b> 앱 안에서 파일을 만들면 끝<br>
  <span style="color:#C0392B">약속이 바뀌면 다시 담아야 합니다</span></td></tr>
<tr><td><b>② 구독</b><br>
  <span style="font-size:11.5px;color:#8B95A1">나중에</span></td>
  <td>내 약속 전부를 <b>주소 하나</b>로 만들어
  폰 캘린더에 <b>한 번 등록</b>. 그 뒤로는 저절로 맞춰집니다</td>
  <td><b>바뀌면 저절로 따라옵니다</b><br>
  <span style="color:#C0392B">주소를 아는 사람이 볼 수 있어 열쇠를 붙여야 합니다</span></td></tr>
</tbody></table>
<p class="note"><b>①부터 하시죠.</b> 오늘 되고, 되돌리기도 쉽습니다.
쓰는 사람이 늘면 그때 ②로 갑니다 — ②는 <b>고객 이름이 든 일정이 주소로 나가는</b> 것이라
열쇠와 만료를 제대로 붙여야 하고, 그건 서둘 일이 아닙니다.</p></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">같이 보낸 견본 파일</div>
  <div class="v" style="font-size:19px;line-height:1.5;margin-top:3px">
  <b style="color:#60A5FA">APEX-상담약속-견본.ics</b> — 폰에서 열어 보세요.<br>
  일정 둘에 알람 넷(각 <b style="color:#60A5FA">1일 전 · 1시간 전</b>)이 들어 있습니다.<br>
  <span style="font-size:15px;color:#9FB6CC">이게 그대로 나갈 물건입니다.
  열어서 「추가」를 누르면 폰이 울리는지 오늘 확인하실 수 있습니다.</span></div>
</div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 2쪽 — 폰 한 화면
P2 = f'''<div class="pg">
{head(2)}
<h1>폰 한 화면 — 「오늘」 하나</h1>
<p class="sub">지금은 <b>TFA 업무관리 · DB 통합 CRM · 약속</b>이 세 군데에 있습니다.
폰에서 세 군데를 오가는 건 <b>사실상 안 합니다.</b>
셋을 <b>시간순 한 줄</b>로 합칩니다.</p>

<div class="sec"><div class="row" style="align-items:flex-start;gap:22px">
  <div class="ph">
    <div class="ph-top"><span>9:41</span><span>APEX</span></div>
    <div class="ph-b">
      <div style="font-size:17px;font-weight:900;letter-spacing:-.03em">오늘 · 8월 21일</div>
      <div style="font-size:11.5px;color:#8B95A1;font-weight:700;margin-top:2px">
        남은 일 <b style="color:#3182F6">3</b> · 약속 2</div>
      <div class="ph-bar">
        <span class="on">오늘</span><span>고객</span><span>주간</span></div>

      <div class="ph-d">지금</div>
      <div class="ph-c now">
        <div><span class="ph-tag tg-b">11:00 약속</span></div>
        <div class="t" style="margin-top:5px">홍길동 님 · 보장분석</div>
        <div class="s">서울 강남 · 2년차 7개월<br>
          지난번 어머님 수술 말씀하셨음</div>
        <div class="ph-bar" style="margin-top:9px">
          <span class="on">기록 남기기</span><span>전화</span><span>길찾기</span></div>
      </div>

      <div class="ph-d">오늘 할 일 · 3</div>
      <div class="ph-c hot">
        <div class="t">이영희 · 87일째 조용</div>
        <div class="s">「지난번 어머님 수술 어떠세요」</div>
        <div class="ph-bar" style="margin-top:8px">
          <span>✉ 문자</span><span>전화</span><span>미루기</span></div>
      </div>
      <div class="ph-c">
        <div class="t">박민수 · 녹음 미전달</div>
        <div class="s">오늘 안에 닫으세요</div>
      </div>
      <div class="ph-c">
        <div class="t">오세라 · 아직 첫 통화 전</div>
        <div class="s">28일 경과</div>
      </div>

      <div class="ph-d">다음</div>
      <div class="ph-c">
        <div><span class="ph-tag tg-g">15:00 약속</span></div>
        <div class="t" style="margin-top:5px">김철수 님 · 재무설계</div>
        <div class="s">성남 분당 · 계산기 미리 열어 두기</div>
      </div>
    </div>
    <div class="ph-nav">
      <div class="on"><b>☀</b>오늘</div><div><b>🗂</b>고객</div>
      <div><b>🗓</b>달력</div><div><b>📈</b>성장</div>
    </div>
  </div>

  <div style="flex:1">
    <h2>무엇을 합친 것인가</h2>
    <table>
    <tbody>
      <tr><td style="width:118px"><b>지금 · 다음</b></td>
        <td><b>약속</b>(CRM 상담 약속 · TFA 스케줄 관리)을
        <b>시각 순</b>으로. 지나간 것은 밑으로 내려갑니다</td></tr>
      <tr><td><b>오늘 할 일</b></td>
        <td><b>오늘의 알림</b>(CRM)과 <b>해야 할 일</b>(TFA)을 한 줄기로.
        같은 사람이 두 번 나오면 <b>합칩니다</b></td></tr>
      <tr><td><b>맨 아래 넷</b></td>
        <td>오늘 · 고객(365일) · 달력 · 성장(성장판).
        <b>88칸 메뉴는 「고객」 안쪽에</b> 둡니다</td></tr>
    </tbody></table>

    <h2 style="margin-top:20px">폰에서 지키는 것 다섯</h2>
    <ul>
    <li><b>한 화면에 한 손가락.</b> 가로로 미는 표를 두지 않습니다 —
      CRM 의 열세 칸 표는 폰에서 <b>카드로</b> 바뀌어야 합니다</li>
    <li><b>단추는 엄지가 닿는 아래쪽.</b> 위쪽은 보는 곳, 아래쪽은 누르는 곳</li>
    <li><b>기본이 「오늘」.</b> 열면 오늘이 나옵니다. 고르게 하지 않습니다</li>
    <li><b>글자를 줄이지 않습니다.</b> 폰이라고 작게 만들면 안 읽습니다.
      <b>줄 수를 줄이지 글자를 줄이지 않습니다</b></li>
    <li><b>세 탭을 넘기지 않습니다.</b> 오늘·고객·달력이면 충분합니다</li>
    </ul>
  </div>
</div></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 3쪽 — 만드는 법 · 순서
P3 = f'''<div class="pg">
{head(3)}
<h1>어떻게 만드나</h1>
<p class="sub">새 화면 하나와 파일 만드는 함수 하나입니다.
<b>지금 화면은 아무것도 안 없앱니다.</b></p>

<div class="sec"><h2>① 캘린더 담기 — 이게 제일 쉽고 제일 큽니다</h2>
<table>
<thead><tr><th style="width:150px">어디에</th><th style="width:250px">무엇을</th>
<th>드는 시간</th></tr></thead>
<tbody>
<tr><td><b>TA 결과 기록</b></td>
  <td>결과가 <b>「상담」</b>이라 약속 칸이 열리면,
  저장할 때 <b>「캘린더에 담기」</b>를 같이 보여 줍니다</td>
  <td><b>반나절</b> — 약속 시각은 이미 그 자리에 있습니다</td></tr>
<tr><td><b>DB 관리 · 상담 약속</b></td>
  <td>약속이 잡힌 줄마다 <b>🗓</b> 단추</td>
  <td><b>한두 시간</b></td></tr>
<tr><td><b>오늘 화면</b></td>
  <td>맨 위에 <b>「오늘·내일 약속 캘린더에 담기」</b> 한 번에</td>
  <td><b>한두 시간</b></td></tr>
</tbody></table>
<p class="note"><b>서버가 필요 없습니다.</b> 파일은 <b>브라우저 안에서 만들어</b>
바로 내려받게 하면 됩니다. 폰이 그 파일을 열고 <b>「캘린더에 추가할까요?」</b>를 묻습니다.</p></div>

<div class="sec"><h2>알람은 몇 번 울리게 하나</h2>
<div class="row">
  <div class="bx"><div class="k">기본</div><div class="v">두 번</div>
    <p><b>1일 전</b>(자료 준비하라고) · <b>1시간 전</b>(지난 기록 읽으라고).
    이 둘이면 충분합니다</p></div>
  <div class="bx"><div class="k">알람 글에 넣을 것</div><div class="v">할 일까지</div>
    <p>「홍길동 님 상담」이 아니라
    <b>「내일 11시 홍길동 님 — 오늘 저녁에 자료 준비」</b>.
    <b>손이 움직이는 말</b>로</p></div>
  <div class="bx red"><div class="k">하지 말 것</div><div class="v">세 번 이상</div>
    <p>많이 울리면 <b>캘린더 알림 자체를</b> 꺼 버립니다.
    그러면 다른 약속까지 놓칩니다</p></div>
</div></div>

<div class="sec"><h2>② 폰 「오늘」 화면 — 무엇을 새로 만드나</h2>
<table>
<thead><tr><th style="width:120px">부분</th><th style="width:270px">어디서 가져오나</th>
<th>새로 만드나</th></tr></thead>
<tbody>
<tr><td><b>약속</b></td><td>CRM <b>상담 약속</b> + TFA <b>스케줄 관리</b></td>
  <td>합쳐서 시각순 — <b>계산만</b></td></tr>
<tr><td><b>할 일</b></td><td>CRM <b>오늘의 알림</b> + TFA <b>해야 할 일</b></td>
  <td>합치고 <b>같은 사람은 하나로</b></td></tr>
<tr><td><b>문자·처방</b></td><td>이미 만든 것</td><td><b>부르기만</b> 합니다</td></tr>
<tr><td><b>맨 아래 넷</b></td><td>—</td><td><b>새로</b> — 이것만 새 물건입니다</td></tr>
</tbody></table>
<p class="note"><b>CRM 은 iframe 안에 있어서</b> 폰 화면이 그 안의 자료를 바로 못 읽습니다.
두 길 중 하나입니다 — <b>㉮</b> 앱이 서버에서 직접 읽는다(깔끔·하루),
<b>㉯</b> CRM 이 부모에게 넘겨준다(빠름·두세 시간, `apex:` 통로가 이미 있습니다).
<b>㉮를 권합니다</b> — CRM 을 안 열어도 오늘 화면이 뜹니다.</p></div>

<div class="sec"><h2>순서</h2>
<table>
<thead><tr><th style="width:82px">순서</th><th style="width:230px">무엇을</th>
<th style="width:96px">시간</th><th>왜 이 순서인가</th></tr></thead>
<tbody>
<tr style="background:#F2FBF6"><td><b>1</b></td><td><b>캘린더 담기</b> (TA 결과 기록)</td>
  <td>반나절</td><td>제일 싸고, <b>알람이 바로 생깁니다</b></td></tr>
<tr><td><b>2</b></td><td>DB 관리 · 오늘 화면에도 담기 단추</td><td>반나절</td>
  <td>1이 쓸 만하면 넓힙니다</td></tr>
<tr><td><b>3</b></td><td><b>폰 「오늘」 화면</b></td><td>이삼 일</td>
  <td>약속이 캘린더에 있으니 <b>화면은 할 일에 집중</b>합니다</td></tr>
<tr><td><b>4</b></td><td>맨 아래 넷 · 표를 카드로</td><td>이삼 일</td>
  <td>3을 써 보고 <b>정말 필요한 탭만</b> 남깁니다</td></tr>
<tr><td><b>5</b></td><td>구독(webcal)</td><td>이삼 일</td>
  <td><b>열쇠·만료를 붙여야</b> 하므로 맨 마지막</td></tr>
</tbody></table></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:20px;line-height:1.5;margin-top:3px">
  알람은 <b style="color:#60A5FA">폰 캘린더에 맡기고</b>,<br>
  화면은 <b style="color:#60A5FA">「오늘」 하나</b>로 모읍니다.<br>
  <span style="font-size:15px;color:#9FB6CC">둘 다 지금 화면을 안 없애고 얹기만 합니다.</span></div>
</div>

{FOOT}</div>
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>핸드폰 한 화면 — 오늘 하나</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}</body></html>')
open("ph.html", "w", encoding="utf8").write(HTML)
print(f"ph.html {len(HTML.encode())/1024:.0f}KB")
