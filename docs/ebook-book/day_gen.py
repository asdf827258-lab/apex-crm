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
    <div class="pt">하루 한 장 — 아침 세 줄 · 저녁 3초<br>{n} / {tot}</div></div>'''


FOOT = ('<div class="ft"><b>에이플러스에셋 온탑본부 · 윤시현 사업단장</b> &nbsp;|&nbsp; '
        '인용한 문장은 모두 <b>앱 코드 주석에 실제로 적혀 있는 것</b>입니다. '
        '화면 목업은 제안이며 실제 화면과 다릅니다.')


# ═══════════════════════════════ 1쪽 — 대표님이 이미 쓰신 말
QUOTES = [
 ("네 군데를 오가면 <b>아무도 안 본다</b>", "TFA 업무관리를 만들 때"),
 ("열한 개를 다 하려 하지 마세요. <b>위에서 세 개만</b> 매일 합니다.<br>"
  "세 개가 붙으면 나머지는 따라옵니다", "성장판 · 실행 축이 낮을 때"),
 ("「부재 6건」이 아니라 <b>「고객12 · 12일째 · 문자 먼저 남기고 걸기」</b>여야<br>"
  "손이 움직인다", "오늘 터치할 사람을 만들 때"),
 ("두 번 눌러 찾아 들어가야 하면 <b>안 보게 된다</b>", "메뉴를 접을 때"),
 ("여섯 칸을 사람이 채워 넣게 해 두니,<br>"
  "정작 <b>아무도 안 채우고 화면만 복잡했다</b>", "칸을 걷어낼 때"),
]

P1 = f'''<div class="pg">
{head(1)}
<h1>제가 설득할 게 없습니다</h1>
<p class="sub">대표님이 앱 주석에 <b>원칙을 이미 다 써 두셨습니다.</b>
아래는 지어낸 말이 아니라 <b>코드에 적혀 있는 문장</b>입니다.
문제는 <b>아침 보고 화면 한 곳만</b> 이 원칙을 안 따르고 있다는 것입니다.</p>

<div class="sec"><h2>대표님이 이미 쓰신 말</h2>
''' + "".join(f'<div class="q"><div class="t">「{t}」</div>'
              f'<div class="s">— <b>app/index.html</b> · {w}</div></div>' for t, w in QUOTES) + f'''
</div>

<div class="sec"><h2>그런데 아침 보고는 이렇게 되어 있습니다</h2>
<div class="row">
  <div class="bx red"><div class="k">원칙 ①에 어긋남</div><div class="v">여덟 줄입니다</div>
    <p>「위에서 세 개만」이라고 쓰셨는데 아침 보고는 <b>최대 여덟 줄</b>을 세웁니다.
    여덟을 보면 <b>하나도 안 합니다</b></p></div>
  <div class="bx red"><div class="k">원칙 ②에 어긋남</div><div class="v">「아침에 안 띄우기」</div>
    <p>바쁜 날 <b>한 번 끄면 영원히</b> 안 봅니다.
    끄는 순간 이 사람은 <b>목록 밖으로</b> 나갑니다</p></div>
  <div class="bx red"><div class="k">아직 안 이어짐</div><div class="v">닫는 자리가 없습니다</div>
    <p>아침에 목록만 주고 끝납니다.
    <b>다 했는지 아무도 안 봅니다</b> — 본인도요</p></div>
</div></div>

<div class="sec"><h2>그래서 실제로 벌어지는 일 — 사슬입니다</h2>
<table>
<thead><tr><th style="width:118px">단계</th><th>무슨 일이</th><th style="width:250px">그 결과</th></tr></thead>
<tbody>
<tr><td><b>1일차</b></td><td>여덟 줄이 뜹니다. 오늘 바쁩니다</td>
  <td>세 개만 하고 닫습니다 — <b>여기까진 괜찮습니다</b></td></tr>
<tr><td><b>3일차</b></td><td>밀린 것이 붙어 <b>열두 줄</b>이 됩니다</td>
  <td>「오늘 안에 못 하겠다」 — 열지 않고 닫습니다</td></tr>
<tr><td><b>5일차</b></td><td>매일 뜨는 게 부담스럽습니다</td>
  <td><b>「아침에 안 띄우기」를 누릅니다</b></td></tr>
<tr class="" style="background:#FFF5F5"><td><b>그 뒤로</b></td>
  <td>아침 보고가 <b>다시는 안 뜹니다</b></td>
  <td>이 사람은 성장판 「실행」 축이 떨어지고,
    리더에게는 <b>「놓치고 있는 사람」</b>으로만 보입니다</td></tr>
</tbody></table>
<p class="note"><b>여기서 리더가 「왜 안 하냐」고 물으면 끝입니다.</b>
대표님이 리더 할 일에 써 두신 그대로예요 —
<b>「숫자만 보고 다그치기 — 활동이 아니라 회피가 늘어납니다」.</b>
사람이 게을러서가 아니라 <b>여덟 줄이 그렇게 만든 것</b>입니다.</p></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">그래서 제안은 하나입니다</div>
  <div class="v" style="font-size:22px;line-height:1.5;margin-top:3px">
  새 화면을 만들자는 게 아닙니다.<br>
  <b style="color:#60A5FA">이미 있는 아침 보고를 대표님이 쓰신 원칙에 맞추자</b>는 것입니다.<br>
  <b style="color:#60A5FA">여덟 줄 → 세 줄</b>, <b style="color:#60A5FA">끄기 → 끝내기</b>, 그리고 <b style="color:#60A5FA">저녁에 닫기.</b></div>
</div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 2쪽 — 아침: 지금 vs 바꾸면
def line(e, t, sub, go, big=False, late=False):
    cls = (" big" if big else "") + (" late" if late else "")
    return (f'<div class="mk-l{cls}"><span class="e">{e}</span>'
            f'<span class="tx">{t}{f"<em>{sub}</em>" if sub else ""}</span>'
            f'<span class="go">{go} ↗</span></div>')


NOW = (line("📅", "오늘 11:00 홍길동 상담", "", "고객")
       + line("⏰", "김철수 — 제안서 회신 기한", "어제까지", "고객")
       + line("❄️", "이영희 — 87일째", "안부 전화", "고객")
       + line("🎙", "박민수 — 상담 녹음 미전달", "", "CRM")
       + line("📜", "최지은 — 증권 미전달", "", "CRM")
       + line("🚫", "정대호 — 3차 부재", "", "CRM")
       + line("🆕", "미진행 4건", "아직 안 걸었습니다", "CRM")
       + line("🎓", "배워서 터치할 것 — 거절처리", "", "성장판"))

NEW = (line("📅", "오늘 11:00 · 홍길동", "강남 · 보장분석 이어서", "고객 365일", True)
       + line("❄️", "이영희 · 87일째", "「지난번 어머님 수술 어떠세요」", "고객 365일", True, True)
       + line("🎙", "박민수 · 녹음 미전달", "오늘 안에 닫으세요", "녹음 전달", True))

P2 = f'''<div class="pg">
{head(2)}
<h1>아침 — 지금과 바꾼 뒤</h1>
<p class="sub">같은 자료로 같은 화면입니다. <b>줄 수와 문장만</b> 달라집니다.</p>

<div class="sec"><div class="row">
  <div style="flex:1">
    <div class="mk-cap cap-no">✕ 지금 — 여덟 줄</div>
    <div class="mk">
      <div class="mk-k">오늘 아침 보고</div>
      <div class="mk-h">윤시현 님, 오늘 <em>3가지</em>가 밀렸습니다</div>
      <div class="mk-y">
        <div><b>32</b><span>어제 통화</span></div>
        <div><b style="color:#6EE7B7">4</b><span>상담</span></div>
        <div><b style="color:#FCD34D">21</b><span>부재</span></div>
        <div><b style="color:#FCA5A5">7</b><span>거절</span></div>
      </div>
      {NOW}
      <div class="mk-off">
        <span>☑ <b>아침에 안 띄우기</b></span><span>☐ 자동 열기</span>
      </div>
      <div class="mk-btn">오늘 할 일 열기</div>
    </div>
  </div>
  <div style="flex:1">
    <div class="mk-cap cap-ok">✓ 바꾸면 — 세 줄</div>
    <div class="mk">
      <div class="mk-k">오늘 아침 보고</div>
      <div class="mk-h">윤시현 님, 오늘은 <b style="color:#6EE7B7">셋</b>입니다</div>
      <div class="mk-y">
        <div><b>32</b><span>어제 통화</span></div>
        <div><b style="color:#6EE7B7">4</b><span>상담</span></div>
        <div><b style="color:#FCD34D">21</b><span>부재</span></div>
        <div><b style="color:#FCA5A5">7</b><span>거절</span></div>
      </div>
      {NEW}
      <div class="mk-more">＋ 다섯 개 더 있습니다 — 셋을 끝내면 보여 드립니다</div>
      <div class="mk-off">
        <span>셋을 끝내면 <b style="color:#6EE7B7">내일 아침까지 안 뜹니다</b></span>
      </div>
      <div class="mk-btn">첫 줄부터 — 홍길동 열기 →</div>
    </div>
  </div>
</div></div>

<div class="sec"><h2>무엇을 바꿨나 — 넷</h2>
<table>
<thead><tr><th style="width:118px">바꾼 것</th><th style="width:300px">지금 → 바꾼 뒤</th>
<th>왜</th></tr></thead>
<tbody>
<tr><td><b>줄 수</b></td><td>여덟 줄 → <b>세 줄</b> + 「다섯 개 더」</td>
  <td>「위에서 세 개만 매일 합니다」 — <b>대표님 문장 그대로</b></td></tr>
<tr><td><b>문장</b></td><td>「이영희 — 87일째」 →<br>
  <b>「이영희 · 87일째 · 지난번 어머님 수술 어떠세요」</b></td>
  <td>「손이 움직이려면 <b>할 말까지</b> 있어야 한다」 — 이것도 대표님 문장</td></tr>
<tr><td><b>끄기</b></td><td>「아침에 안 띄우기」 →<br>
  <b>「셋을 끝내면 내일까지 안 뜹니다」</b></td>
  <td>같은 「안 보임」인데 <b>조건이 정반대</b>입니다.
    없애는 게 아니라 <b>바꾸는</b> 것입니다</td></tr>
<tr><td><b>완료</b></td><td>체크박스 → <b>기록으로 자동</b></td>
  <td>체크는 거짓말합니다. 통화가 남으면 <b>저절로</b> 사라집니다 —
    CRM 기록을 이미 읽고 있으니 됩니다</td></tr>
</tbody></table></div>

<div class="sec"><h2>고르는 규칙 — 셋을 무엇으로 뽑나</h2>
<div class="row">
  <div class="bx"><div class="k">1순위</div><div class="v">오늘 약속</div>
    <p>「<b>약속을 놓치는 것이 가장 비싼 실수다</b>」 — 이미 그렇게 되어 있습니다</p></div>
  <div class="bx"><div class="k">2순위</div><div class="v">오래 밀린 것 하나</div>
    <p>전부가 아니라 <b>제일 오래된 하나</b>. 나머지는 내일</p></div>
  <div class="bx"><div class="k">3순위</div><div class="v">오늘 닫을 수 있는 것</div>
    <p>녹음·증권처럼 <b>10분이면 끝나는</b> 것. 끝내는 맛이 있어야 내일도 엽니다</p></div>
</div>
<p class="note">셋 다 없는 날이면 <b>「오늘은 없습니다」</b>라고 띄웁니다.
억지로 세 줄을 채우지 않습니다 — 없는 날에 뭘 만들어 주면 <b>다음부터 안 믿습니다.</b></p></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 3쪽 — 저녁 3초 · 카톡 세 줄
P3 = f'''<div class="pg">
{head(3)}
<h1>저녁 3초, 그리고 밖으로</h1>
<p class="sub">아침만 있으면 <b>사흘이면 무너집니다.</b>
닫는 자리가 있어야 다음 날 아침이 살아남습니다.</p>

<div class="sec"><h2>저녁 — 판단도 잔소리도 없이 숫자만</h2>
<div class="row">
  <div style="flex:1">
    <div class="mk-cap cap-ok">✓ 다 한 날</div>
    <div class="mk" style="padding:22px">
      <div class="mk-k">오늘 마감</div>
      <div class="mk-h">셋 다 하셨습니다</div>
      <div style="font-size:13.5px;color:#9FB6CC;line-height:1.75;margin-top:10px">
        홍길동 상담 · 이영희 안부 · 박민수 녹음<br>
        <b style="color:#6EE7B7">이번 주 4일째 연속입니다</b></div>
      <div class="mk-btn" style="background:#152033;color:#93C5FD">닫기</div>
    </div>
  </div>
  <div style="flex:1">
    <div class="mk-cap cap-no">△ 남은 날</div>
    <div class="mk" style="padding:22px">
      <div class="mk-k">오늘 마감</div>
      <div class="mk-h">셋 중 <b style="color:#FCD34D">둘</b> 하셨습니다</div>
      <div style="font-size:13.5px;color:#9FB6CC;line-height:1.75;margin-top:10px">
        남은 하나 — <b style="color:#fff">이영희 · 87일째</b><br>
        내일 아침 <b style="color:#FCA5A5">맨 위</b>에 다시 세워 드립니다</div>
      <div class="mk-btn">지금 3분이면 됩니다 — 열기 →</div>
    </div>
  </div>
</div>
<p class="note"><b>「왜 안 했냐」를 묻지 않습니다.</b> 몇 개 남았는지만 말합니다.
물으면 변명을 만들게 되고, 변명을 만들면 <b>다음부터 저녁을 안 엽니다.</b></p></div>

<div class="sec"><h2>밖으로 — 앱을 안 여는 사람에게</h2>
<div class="row">
  <div style="flex:1.15">
    <div class="kk">
      <div class="kk-n">APEX</div>
      <div class="kk-b"><div class="kk-t">
        <b>윤시현 님, 오늘 셋입니다</b><br><br>
        1. 11:00 홍길동 상담<br>
        2. 이영희 · 87일째 안부<br>
        3. 박민수 녹음 전달<br><br>
        <span style="color:#3182F6">앱에서 열기 ↗</span>
      </div></div>
    </div>
  </div>
  <div class="bx" style="flex:1"><div class="k">보내는 규칙</div>
    <div class="v">밀린 게 없으면 안 보냅니다</div>
    <p>매일 오면 <b>안 읽게 됩니다.</b> 오는 것 자체가 신호가 되게
    <b>있을 때만</b> 보냅니다.</p>
    <p style="margin-top:9px"><b>하루 한 번, 아침 8시.</b>
    저녁 마감은 <b>안 보냅니다</b> — 퇴근하고 받는 업무 알림은
    도움이 아니라 부담입니다.</p></div>
</div></div>

<div class="sec"><h2>이것만은 하지 마시죠 — 제 의견입니다</h2>
<table>
<thead><tr><th style="width:170px">하고 싶어지는 것</th><th style="width:290px">벌어지는 일</th>
<th>대신</th></tr></thead>
<tbody>
<tr><td><b>배지 숫자 늘리기</b></td><td>빨간 동그라미가 <b>두 자리</b>가 되는 순간 안 봅니다</td>
  <td>숫자 대신 <b>점 하나</b>. 있다/없다만</td></tr>
<tr><td><b>하루 여러 번 알림</b></td><td>알림 자체를 <b>꺼 버립니다</b>. 한 번도 못 받게 됩니다</td>
  <td>아침 한 번. <b>그 한 번을 지킵니다</b></td></tr>
<tr><td><b>넷째 줄 넣기</b></td><td>「이것도 중요한데」 하는 순간 <b>세 줄이 무너집니다</b></td>
  <td>넣고 싶으면 <b>하나를 빼야</b> 합니다</td></tr>
<tr><td><b>못 닫게 막기</b></td><td>닫을 수 없으면 <b>앱을 안 엽니다</b></td>
  <td>닫히되 <b>내일 또 옵니다</b></td></tr>
<tr><td><b>리더에게 미완료 보내기</b></td><td>「활동이 아니라 <b>회피가 늘어납니다</b>」 —
  대표님 문장입니다</td>
  <td>리더는 <b>「막힌 사람」</b>으로만 봅니다 — 성장판이 이미 그렇게 합니다</td></tr>
</tbody></table></div>

{FOOT}</div>
</div>'''


# ═══════════════════════════════ 4쪽 — 확인 · 되돌리기 · 순서
P4 = f'''<div class="pg">
{head(4)}
<h1>맞는지 어떻게 압니까</h1>
<p class="sub">제 말이 맞는지는 <b>2주면 압니다.</b>
새 숫자를 만들 필요도 없습니다 — <b>이미 재고 있는 것</b>으로 확인됩니다.</p>

<div class="sec"><h2>이미 재고 있는 것으로 봅니다</h2>
<table>
<thead><tr><th style="width:190px">무엇을</th><th style="width:230px">어디서 이미 재나</th>
<th>이러면 맞은 것</th></tr></thead>
<tbody>
<tr><td><b>아침 보고를 여는 사람</b></td><td>「안 띄우기」를 켠 사람 수</td>
  <td>끄는 사람이 <b>안 늘어납니다</b> — 끌 이유가 없어지니까</td></tr>
<tr><td><b>실제로 하는가</b></td><td>성장판 <b>「실행」 축</b> (하루 평균 개수)</td>
  <td>팀 평균이 <b>오릅니다</b>. 목표 9개 중 지금 몇인지 이미 나옵니다</td></tr>
<tr><td><b>밀린 것이 주는가</b></td><td>「놓치고 있는 사람」 명단 (성장판)</td>
  <td>명단이 <b>짧아집니다</b></td></tr>
<tr><td><b>고객이 안 새는가</b></td><td>오늘의 알림 <b>0건</b> · 미전달 0건</td>
  <td>저녁에 0이 되는 날이 <b>늘어납니다</b></td></tr>
</tbody></table>
<p class="note"><b>새 지표를 만들지 마세요.</b> 이걸 재려고 또 화면을 만들면
그 화면을 아무도 안 봅니다. 위 넷은 <b>지금 이미</b> 나오는 숫자입니다.</p></div>

<div class="sec"><h2>안 되면 되돌리는 법 — 반나절이면 됩니다</h2>
<div class="row">
  <div class="bx grn"><div class="k">되돌리기 ①</div><div class="v">세 줄 → 여덟 줄</div>
    <p>자르는 숫자 <b>하나만</b> 바꾸면 됩니다. 자료는 그대로입니다</p></div>
  <div class="bx grn"><div class="k">되돌리기 ②</div><div class="v">「안 띄우기」 되살리기</div>
    <p>지우지 말고 <b>숨겨</b> 둡니다. 되살리는 데 10분입니다</p></div>
  <div class="bx grn"><div class="k">되돌리기 ③</div><div class="v">저녁 마감 끄기</div>
    <p>새로 만든 것이라 <b>떼어내도</b> 아무것도 안 망가집니다</p></div>
</div>
<p class="note">셋 다 <b>새 표를 안 만들고</b> 지금 쓰는 자리에 얹는 것이라,
안 맞으면 그냥 내리면 됩니다. <b>이게 이 제안의 제일 좋은 점</b>이라고 생각합니다.</p></div>

<div class="sec"><h2>순서 — 한 번에 다 하지 않습니다</h2>
<table>
<thead><tr><th style="width:96px">언제</th><th style="width:220px">무엇을</th>
<th style="width:110px">드는 시간</th><th>이걸 봅니다</th></tr></thead>
<tbody>
<tr><td><b>1주차</b></td><td>「안 띄우기」 → <b>「셋 끝내면 안 뜸」</b></td>
  <td>반나절</td><td>끄는 사람이 안 늘어나는지</td></tr>
<tr><td><b>1주차</b></td><td>여덟 줄 → <b>세 줄</b> + 접기</td>
  <td>반나절</td><td>첫 줄을 눌러 들어가는 사람이 느는지</td></tr>
<tr><td><b>2주차</b></td><td><b>저녁 3초</b></td>
  <td>하루</td><td>다음 날 아침을 여는 사람이 느는지</td></tr>
<tr class="" style="background:#F2FBF6"><td><b>한 달 뒤</b></td>
  <td><b>카톡 세 줄</b></td><td>이삼 일</td>
  <td>앞의 셋이 자리잡은 <b>뒤에만</b> 합니다</td></tr>
</tbody></table>
<p class="note"><b>카톡을 먼저 하고 싶으실 겁니다.</b> 눈에 보이니까요.
그런데 앞의 셋이 안 되어 있으면 <b>밖으로 밀어 봐야 열어서 여덟 줄을 보고 닫습니다.</b>
그러면 카톡까지 같이 무시당합니다 — <b>가장 비싼 카드를 제일 먼저 태우는</b> 셈입니다.</p></div>

<div class="bx dark" style="margin-bottom:18px">
  <div class="k">한 줄로 줄이면</div>
  <div class="v" style="font-size:21px;line-height:1.5;margin-top:3px">
  만들 것은 <b style="color:#60A5FA">거의 없습니다.</b>
  아침 보고는 이미 있고, 자료도 이미 있습니다.<br>
  <b style="color:#60A5FA">여덟을 셋으로 줄이고, 끄기를 끝내기로 바꾸고, 저녁에 닫는 것</b> — 이 셋입니다.<br>
  전부 <b style="color:#60A5FA">대표님이 이미 써 두신 원칙</b>을 한 화면에 마저 적용하는 일입니다.</div>
</div>

{FOOT}</div>
</div>'''

HTML = ('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        f'<title>하루 한 장 — 아침 세 줄 · 저녁 3초</title><style>{CSS}</style></head>'
        f'<body>{P1}{P2}{P3}{P4}</body></html>')
open("day.html", "w", encoding="utf8").write(HTML)
print(f"day.html {len(HTML.encode())/1024:.0f}KB")
