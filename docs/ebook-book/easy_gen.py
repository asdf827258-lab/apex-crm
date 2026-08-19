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
    <div class="pt">쉽게 만들기 — 설계 묶음<br>{n} / {tot}</div></div>'''


FOOT = ('<div class="ft"><b>에이플러스에셋 온탑본부 · 윤시현 사업단장</b> &nbsp;|&nbsp; '
        '인용한 문장은 모두 <b>앱 코드 주석에 실제로 적혀 있는 것</b>입니다. '
        '화면 목업은 제안이며 실제 화면과 다릅니다.')




# ═══════════════════════════════ 1쪽 — 아침 세 줄 문자 설계
P1 = f'''<div class="pg">
{head(1)}
<h1>아침 세 줄을 문자로</h1>
<p class="sub">대행사도 심사도 없습니다. <b>sms: 링크</b>로 보내는 사람 폰의 문자앱이
번호와 본문까지 채워 열립니다. <b>보내기만 누르면 본인 번호로</b> 나갑니다.
CRM 의 고객 문자와 <b>같은 방법</b>입니다 — 이미 넣어서 돌아가는 것을 확인했습니다.</p>

<div class="sec"><h2>번호는 이미 있습니다 — 만들 것 없음</h2>
<div class="row">
  <div class="bx grn"><div class="k">있는 것</div><div class="v">org_members.phone</div>
    <p><b>조직도</b> 표에 번호 칸이 이미 있습니다. 새 칸도 새 표도 필요 없습니다</p></div>
  <div class="bx"><div class="k">해야 할 것</div><div class="v">조직도에서 번호 채우기</div>
    <p>사람이 한 번 넣으면 끝입니다. <b>비어 있으면 그 사람은 단추가 안 뜹니다</b></p></div>
  <div class="bx"><div class="k">안 하는 것</div><div class="v">자동 발송</div>
    <p>서버가 대신 보내지 않습니다. <b>대표님이 눌러야</b> 나갑니다 —
    그래서 대행사·심사가 없습니다</p></div>
</div></div>

<div class="sec"><h2>어디에 붙나</h2>
<table>
<thead><tr><th style="width:180px">자리</th><th style="width:230px">누가 누구에게</th>
<th>단추</th></tr></thead>
<tbody>
<tr><td><b>아침 보고 모달</b><br><span style="font-size:11.5px;color:#8B95A1">리더로 열었을 때</span></td>
  <td>대표·지점장 → <b>팀원</b></td>
  <td><b>✉ 세 줄 보내기</b> — 팀원마다 한 줄씩. 누르면 그 사람 번호로 문자앱이 열림</td></tr>
<tr><td><b>TFA 업무관리 → 팀원 관리</b></td><td>리더 → 팀원 한 사람</td>
  <td><b>✉ 문자</b> · <b>복사</b> — 아무 때나 한 사람에게</td></tr>
<tr><td><b>성장판 → 놓치고 있는 사람</b></td><td>리더 → 막힌 팀원</td>
  <td><b>✉ 문자</b> — 다그치는 말이 아니라 <b>「뭐가 막혔어요?」</b></td></tr>
</tbody></table>
<p class="note"><b>세 자리 다 「누르면 열린다」까지만</b> 합니다.
보내는 것은 사람입니다. 자동으로 나가는 순간 대행사·발신번호·심사가 전부 따라옵니다.</p></div>

<div class="sec"><h2>문구 — 세 가지뿐입니다</h2>
<table>
<thead><tr><th style="width:150px">언제</th><th>보낼 말</th></tr></thead>
<tbody>
<tr><td><b>아침 세 줄</b></td>
  <td>「○○님, 오늘 셋입니다.<br>
  1. 11:00 홍길동 상담 / 2. 이영희 87일째 / 3. 박민수 녹음<br>
  앱에서 열어 보세요.」</td></tr>
<tr><td><b>이틀 이상 조용</b></td>
  <td>「○○님, 이틀째 기록이 없어서요. <b>막힌 데 있으면 말씀 주세요.</b>
  같이 보겠습니다.」</td></tr>
<tr><td><b>잘한 날</b></td>
  <td>「○○님, 어제 상담 넷 나왔네요. 고생하셨습니다.」</td></tr>
</tbody></table>
<p class="note"><b>셋째 줄을 꼭 넣으세요.</b> 잘한 날 문자가 없으면
<b>문자가 오는 것 자체가 나쁜 신호</b>가 됩니다. 그러면 안 읽습니다.</p></div>

<div class="sec"><h2>기술 — 지켜야 할 넷</h2>
<div class="row">
  <div class="bx"><div class="v">기기를 갈라야 합니다</div>
    <p>iOS 는 <b>sms:번호&amp;body=</b>, 안드로이드는 <b>sms:번호?body=</b></p></div>
  <div class="bx"><div class="v">번호는 숫자만</div>
    <p>하이픈이 있으면 <b>못 알아듣는 기기</b>가 있습니다</p></div>
  <div class="bx"><div class="v">PC 에서는 복사로</div>
    <p>문자앱이 없습니다. <b>조용히 복사</b>로 넘깁니다</p></div>
  <div class="bx"><div class="v">번호 없으면 안 그림</div>
    <p>눌렀는데 안 되는 단추가 <b>제일 나쁩니다</b></p></div>
</div>
<p class="note"><b>카톡은 안 됩니다.</b> 특정인에게 본문을 넣어 여는 길을 카카오가 안 열어 줍니다.
<b>복사까지만</b> 하시고, 붙여넣기는 사람이 합니다.
자동으로 가는 카톡은 <b>알림톡(대행사 + 템플릿 심사)</b>이 유일한 길입니다.</p></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 2쪽 — 찾은 것 (버그 둘)
P2 = f'''<div class="pg">
{head(2)}
<h1>고치면 바로 쉬워지는 것 둘</h1>
<p class="sub">이번에 앱을 훑다가 찾은 것입니다. <b>둘 다 화면에는 있는데 안 돌아갑니다.</b>
새로 만드는 게 아니라 <b>이미 만들어 둔 것을 살리는</b> 일입니다.</p>

<div class="sec"><h2>① 생일 칸이 채워지지 않습니다</h2>
<div class="row">
  <div class="bx red" style="flex:1.3"><div class="k">지금</div>
    <div class="v">🎂 생일은 늘 0명입니다</div>
    <p>「오늘 터치할 사람」에 <b>생일 칸</b>이 있고 <b>「생일 D-3 — 축하 문자 먼저」</b>까지
    만들어져 있습니다. 그런데 판정 함수는 <b>「월-일」(MM-DD)</b> 을 기다리는데,
    고객 정보 화면이 저장하는 것은 <b>출생연도뿐</b>입니다.<br><br>
    <b>넣을 칸이 화면에 없습니다.</b> 그래서 값이 영영 안 들어옵니다.</p></div>
  <div class="bx grn"><div class="k">고치면</div>
    <div class="v">칸 하나면 됩니다</div>
    <p>고객 정보에 <b>「생일(월·일)」</b> 입력칸 하나.
    저장할 때 <b>MM-DD</b> 로 넣으면 됩니다.</p>
    <p style="margin-top:9px"><b>드는 시간</b> 반나절<br>
    <b>효과</b> 가장 확실한 터치 구실이 살아납니다 —
    <b>틀릴 수가 없는</b> 연락 이유입니다</p></div>
</div>
<p class="note"><b>이게 왜 큰가</b> — 「무엇으로 터치할지」가 매번 어렵다고 하셨는데,
생일은 <b>고민이 필요 없는 구실</b>입니다. 이미 만들어 둔 기능이 값이 없어서 자고 있습니다.</p></div>

<div class="sec"><h2>② 목표와 조언이 서로 반대입니다</h2>
<div class="row">
  <div class="bx red" style="flex:1.3"><div class="k">지금</div>
    <div class="v">조언대로 하면 점수가 낮아집니다</div>
    <p><b>실행 체크판</b>은 하루 항목이 <b>열한 개</b>입니다.
    <b>성장판 「실행」 축</b>의 목표는 <b>하루 평균 아홉 개</b>고요.<br><br>
    그런데 같은 축의 조언은 이렇게 되어 있습니다 —<br>
    <b>「열한 개를 다 하려 하지 마세요. 위에서 세 개만 매일 합니다.」</b><br><br>
    <b>조언대로 세 개를 하면 33점입니다.</b> 말을 들으면 점수가 떨어집니다.</p></div>
  <div class="bx grn"><div class="k">고치면</div>
    <div class="v">둘 중 하나로 맞춥니다</div>
    <p><b>가</b> 목표를 <b>3</b> 으로 내립니다 — 조언과 같아집니다.
    세 개가 붙은 사람에게 그때 더 권합니다.</p>
    <p style="margin-top:8px"><b>나</b> 조언을 바꿉니다 — 「아홉 개를 하세요」.
    <b>이건 권하지 않습니다.</b></p>
    <p style="margin-top:9px"><b>드는 시간</b> 10분 (숫자 하나)<br>
    <b>효과</b> 신입이 처음 성장판을 열고 <b>기죽지 않습니다</b></p></div>
</div>
<p class="note">「가」를 권하는 이유는 <b>조언이 맞기 때문</b>입니다.
세 개가 붙으면 나머지는 따라온다는 게 대표님 문장인데,
지금은 <b>화면이 그 문장을 배신하고</b> 있습니다.</p></div>

<div class="sec"><h2>덤 — 처방전이 앱 화면으로 넘어가게</h2>
<div class="row">
  <div class="bx"><div class="k">지금</div><div class="v">위치만 알려 줍니다</div>
    <p>CRM 은 <b>iframe 안</b>이라 부모 앱을 못 움직입니다.
    그래서 <b>「앱 왼쪽 증권 분석」</b>이라고 <b>어디 있는지</b>까지만 적어 줍니다</p></div>
  <div class="bx"><div class="k">고치면</div><div class="v">누르면 그 화면이 열립니다</div>
    <p>앱에 <b>메시지 하나 받는 자리</b>만 만들면 됩니다.
    <b>apex: 통로가 이미 있습니다</b> — 상담자료·계산기가 쓰고 있는 그것입니다.
    받아서 <b>go(화면id)</b> 를 부르면 끝입니다</p></div>
</div>
<p class="note"><b>드는 시간</b> 반나절 · <b>효과</b> 「두 번 눌러 찾아 들어가야 하면 안 보게 된다」 —
대표님 문장 그대로입니다. 지금 처방전이 딱 그 상태입니다.</p></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 3쪽 — 우선순위 · 원칙
ROWS = [
 ("생일 칸 하나", "반나절", "터치 구실이 살아납니다", "높음", "grn"),
 ("성장판 목표 9 → 3", "10분", "신입이 안 기죽습니다", "높음", "grn"),
 ("아침 보고 8줄 → 3줄", "반나절", "하루가 시작됩니다", "높음", "grn"),
 ("「안 띄우기」 → 「끝내면 안 뜸」", "반나절", "끄고 사라지는 사람이 없어집니다", "높음", "grn"),
 ("처방전 → 앱 화면 열기", "반나절", "찾아가지 않아도 됩니다", "중간", ""),
 ("저녁 3초", "하루", "다음 날 아침이 살아납니다", "중간", ""),
 ("아침 세 줄 문자", "하루", "앱을 안 여는 사람에게 닿습니다", "중간", ""),
 ("입문 30일 — 세 화면만", "이삼 일", "신입이 88개를 안 봅니다", "큼", ""),
]
rows = "".join(
    f'''<tr{' style="background:#F2FBF6"' if c else ''}>
    <td><b>{i}</b></td><td><b>{w}</b></td><td>{t}</td><td>{e}</td>
    <td style="text-align:center"><b>{v}</b></td></tr>'''
    for i, (w, t, e, v, c) in enumerate(ROWS, 1))

P3 = f'''<div class="pg">
{head(3)}
<h1>순서 — 싼 것부터</h1>
<p class="sub">여덟 개를 다 하실 필요 없습니다.
<b>위에서 넷</b>이 이틀이면 끝나고, 그 넷이 제일 큽니다.</p>

<div class="sec">
<table>
<thead><tr><th style="width:40px">#</th><th style="width:250px">무엇을</th>
<th style="width:100px">드는 시간</th><th>무엇이 쉬워지나</th>
<th style="width:70px;text-align:center">효과</th></tr></thead>
<tbody>{rows}</tbody>
</table>
<p class="note"><b>초록 넷이 이틀입니다.</b> 이틀 쓰고 2주 지켜보시면
성장판 「실행」 축과 「놓치고 있는 사람」 명단으로 <b>맞았는지 틀렸는지</b> 나옵니다.
안 맞으면 <b>숫자만 되돌리면</b> 됩니다.</p></div>

<div class="sec"><h2>쉽게 만든다는 게 무슨 뜻인가 — 다섯</h2>
<div class="row">
  <div class="bx"><div class="k">01</div><div class="v">고를 것을 줄입니다</div>
    <p>화면을 없애는 게 아니라 <b>「다음 하나」</b>를 정해 줍니다.
    88개는 그대로 두고 <b>오늘 열 것 셋</b>만 보여 주면 됩니다</p></div>
  <div class="bx"><div class="k">02</div><div class="v">외울 것을 없앱니다</div>
    <p>「어느 화면이었더라」가 안 나오게. <b>적으면 나오게</b> 하는 것이
    처방전이 한 일입니다</p></div>
</div>
<div class="row" style="margin-top:11px">
  <div class="bx"><div class="k">03</div><div class="v">끝나는 자리를 만듭니다</div>
    <p><b>0건이 되는 것</b>이 보여야 합니다.
    끝이 없는 목록은 <b>시작도 안 하게</b> 됩니다</p></div>
  <div class="bx"><div class="k">04</div><div class="v">사람을 안 탓합니다</div>
    <p>안 하면 <b>안 하게 만든 화면</b>을 고칩니다.
    「왜 안 했냐」는 회피만 늘립니다</p></div>
</div>
<div class="row" style="margin-top:11px">
  <div class="bx dark"><div class="k">05 · 제일 중요</div>
    <div class="v">되돌릴 수 있게 만듭니다</div>
    <p>되돌릴 수 있어야 <b>시작합니다.</b> 위 여덟 개는 전부
    <b>새 표를 안 만들고</b> 지금 자리에 얹는 것이라,
    안 맞으면 그냥 내리면 됩니다. <b>그래서 해 볼 만합니다</b></p></div>
</div></div>

<div class="sec"><h2>하지 마셔야 할 것 — 쉽게 만들다 오히려 어려워지는 길</h2>
<table>
<thead><tr><th style="width:210px">하고 싶어지는 것</th><th>왜 안 되나</th></tr></thead>
<tbody>
<tr><td><b>화면을 없애기</b></td>
  <td>쓰는 사람이 <b>한 명이라도</b> 있으면 그 사람은 앱을 떠납니다.
  없애지 말고 <b>안 보이게</b> 하세요 — 입문 30일처럼</td></tr>
<tr><td><b>안내 문구 늘리기</b></td>
  <td>설명이 필요한 화면은 <b>설명을 붙일 게 아니라 화면을 고쳐야</b> 합니다.
  「여섯 칸을 사람이 채워 넣게 해 두니 아무도 안 채웠다」 — 대표님 문장입니다</td></tr>
<tr><td><b>튜토리얼 만들기</b></td>
  <td>한 번 보고 끝입니다. <b>일하다 막힌 그 자리</b>에서 알려 줘야 합니다</td></tr>
<tr><td><b>설정으로 빼기</b></td>
  <td>「원하시면 켜세요」는 <b>아무도 안 켭니다.</b>
  기본값으로 정하시고, 싫은 사람만 끄게 하세요</td></tr>
</tbody></table></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:21px;line-height:1.5;margin-top:3px">
  쉽게 만드는 것은 <b style="color:#60A5FA">기능을 빼는 일이 아니라</b><br>
  <b style="color:#60A5FA">오늘 열 것을 정해 주는 일</b>입니다.<br>
  88개는 그대로 두고, <b style="color:#60A5FA">셋만 보여 주면</b> 됩니다.</div>
</div>

{FOOT}</div>
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>쉽게 만들기 — 설계 묶음</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}</body></html>')
open("easy.html", "w", encoding="utf8").write(HTML)
print(f"easy.html {len(HTML.encode())/1024:.0f}KB")
