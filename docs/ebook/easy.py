# -*- coding: utf-8 -*-
""" 쉬운 판 — 한 쪽에 한 가지. 표 없음. 큰 글씨. 그림에 번호. """
import io,os,base64,datetime

SC=os.path.dirname(os.path.abspath(__file__))+'/'
def img64(n):
    f=SC+'shots/'+n+'.png'
    if not os.path.exists(f):return u''
    return u'data:image/png;base64,'+base64.b64encode(io.open(f,'rb').read()).decode('ascii')

CSS=u"""
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#E8EDF4;color:#111827;
 font-family:"Pretendard",-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;
 word-break:keep-all;-webkit-font-smoothing:antialiased}
.p{width:210mm;height:297mm;margin:0 auto 8mm;background:#fff;position:relative;
 padding:20mm 18mm;display:flex;flex-direction:column;overflow:hidden;
 box-shadow:0 4px 20px rgba(15,23,42,.12)}
.p .no{position:absolute;right:16mm;bottom:11mm;font-size:11pt;font-weight:900;color:#CBD5E1}
.p .kk{position:absolute;left:18mm;top:11mm;font-size:9.5pt;font-weight:800;letter-spacing:.16em;color:#94A3B8}

/* 표지 */
.cv{background:linear-gradient(160deg,#0B1220 0%,#16305F 50%,#1A56DB 100%);color:#fff;
 justify-content:center;padding:24mm 20mm}
.cv h1{font-size:44pt;font-weight:900;line-height:1.14;letter-spacing:-.04em}
.cv .s{font-size:16pt;color:#9FC6F2;margin-top:8mm;line-height:1.6;font-weight:600}
.cv .r{width:44mm;height:5px;background:#38BDF8;margin:10mm 0;border-radius:3px}
.cv .b{position:absolute;left:20mm;bottom:22mm;font-size:12pt;color:#A9C6E8;line-height:1.9}
.cv .b b{color:#fff;font-weight:800}
.cv .no,.cv .kk{display:none}

/* 큰 제목 쪽 */
.t1{font-size:30pt;font-weight:900;letter-spacing:-.04em;line-height:1.25;color:#0F172A}
.t2{font-size:15pt;font-weight:700;color:#475569;margin-top:6mm;line-height:1.75}
.big{font-size:19pt;font-weight:800;line-height:1.7;color:#1E293B}
.mid{font-size:14pt;line-height:1.85;color:#334155;font-weight:500}
.mid b{font-weight:900;color:#0F172A}
.hi{background:linear-gradient(transparent 56%,#BFDBFE 56%);font-weight:900;color:#0F172A}

/* 그림 + 번호 */
.shot{position:relative;border:1px solid #DBE3EC;border-radius:4mm;overflow:hidden;
 box-shadow:0 3px 14px rgba(15,23,42,.10);background:#fff}
.shot img{display:block;width:100%}
.bd{position:absolute;width:11mm;height:11mm;border-radius:50%;background:#DC2626;color:#fff;
 font-size:14pt;font-weight:900;display:flex;align-items:center;justify-content:center;
 box-shadow:0 2px 8px rgba(0,0,0,.35);border:2.5px solid #fff}
.pts{margin-top:7mm;display:flex;flex-direction:column;gap:4mm}
.pt{display:flex;gap:5mm;align-items:flex-start}
.pt .n{flex:none;width:9mm;height:9mm;border-radius:50%;background:#DC2626;color:#fff;
 font-size:11.5pt;font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:1mm}
.pt .x{font-size:13.5pt;line-height:1.7;color:#334155;font-weight:500}
.pt .x b{font-weight:900;color:#0F172A}

/* 카드 */
.cards{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:8mm}
.cd{border:2px solid #E2E8F0;border-radius:4mm;padding:7mm 7mm 8mm}
.cd .e{font-size:26pt;line-height:1}
.cd .h{font-size:16pt;font-weight:900;margin-top:4mm;color:#0F172A;letter-spacing:-.02em}
.cd .d{font-size:12.5pt;color:#475569;margin-top:3mm;line-height:1.7;font-weight:500}
.cd.on{border-color:#1A56DB;background:#F5F9FF}

/* 단계 */
.steps{margin-top:8mm;display:flex;flex-direction:column;gap:6mm}
.st{display:flex;gap:6mm;align-items:flex-start}
.st .n{flex:none;width:13mm;height:13mm;border-radius:4mm;background:#1A56DB;color:#fff;
 font-size:17pt;font-weight:900;display:flex;align-items:center;justify-content:center}
.st .h{font-size:16pt;font-weight:900;color:#0F172A;letter-spacing:-.02em}
.st .d{font-size:13pt;color:#475569;margin-top:2mm;line-height:1.7;font-weight:500}

/* 강조 상자 */
.box{border-radius:4mm;padding:7mm 8mm;margin-top:8mm;font-size:14pt;line-height:1.8;font-weight:600}
.box b{font-weight:900}
.box.b{background:#EFF6FF;color:#1E40AF}
.box.r{background:#FEF2F2;color:#991B1B}
.box.g{background:#F0FDF5;color:#065F46}
.box.y{background:#FFFBEB;color:#92400E}

/* 말풍선 */
.say{background:#0F172A;color:#fff;border-radius:5mm;padding:7mm 8mm;margin-top:6mm;
 font-size:15pt;line-height:1.8;font-weight:700}
.say .l{font-size:10pt;color:#7DD3FC;letter-spacing:.12em;font-weight:900;display:block;margin-bottom:3mm}

/* 체크리스트 */
.ck{margin-top:6mm}
.ck .r{display:flex;gap:5mm;align-items:center;padding:3.4mm 0;border-bottom:1px solid #EDF1F6}
.ck .b{flex:none;width:6.5mm;height:6.5mm;border:2px solid #94A3B8;border-radius:1.5mm}
.ck .t{font-size:13pt;font-weight:700;color:#1E293B}
.ck .s{font-size:11pt;color:#94A3B8;margin-left:auto;font-weight:600}
.ck .hd{font-size:10.5pt;font-weight:900;color:#1A56DB;letter-spacing:.1em;
 padding:5mm 0 2mm;border:0}

/* 목차 */
.toc{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:9mm}
.tc{border:2px solid #E2E8F0;border-radius:4mm;padding:6mm;display:flex;gap:4mm;align-items:center}
.tc .e{font-size:22pt}
.tc .m{flex:1}
.tc .h{font-size:14pt;font-weight:900;color:#0F172A}
.tc .d{font-size:11pt;color:#64748B;margin-top:1mm;font-weight:600}
.tc .n{font-size:14pt;font-weight:900;color:#CBD5E1}

.tools{position:fixed;right:14px;bottom:14px;z-index:9}
.tools button{border:0;border-radius:12px;padding:13px 20px;font-size:14px;font-weight:900;
 background:#0F172A;color:#fff;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);font-family:inherit}
@media print{body{background:#fff}
 .p{margin:0;box-shadow:none;page-break-after:always;break-after:page;width:auto;height:auto;min-height:0;padding:0}
 .p .no,.p .kk{position:fixed}
 .tools{display:none}}
@page{size:A4;margin:16mm 15mm 16mm}
"""

P=[]
def page(inner,kk=u'',cls=u''):
    P.append(u'<div class="p%s"><span class="kk">%s</span>%s<span class="no">%d</span></div>'%(
        (u' '+cls) if cls else u'', kk, inner, len(P)+1))

def shot(name,badges):
    """badges = [(위치%, 좌우%, 번호)]"""
    b=u''.join(u'<span class="bd" style="top:%s%%;left:%s%%">%s</span>'%(t,l,n) for t,l,n in badges)
    return u'<div class="shot"><img src="'+img64(name)+u'">'+b+u'</div>'

def pts(items):
    return u'<div class="pts">'+u''.join(
        u'<div class="pt"><span class="n">%d</span><span class="x">%s</span></div>'%(i+1,t)
        for i,t in enumerate(items))+u'</div>'

TODAY=datetime.date.today()

# ══════ 표지 ══════
page(u'<h1>이 앱, 이렇게<br>쓰시면 됩니다</h1><div class="r"></div>'
 u'<div class="s">화면 사진 보고 따라만 하세요.<br>외울 것 없습니다.</div>'
 u'<div class="b">에이플러스에셋 <b>온탑본부</b><br>%d년 %d월</div>'%(TODAY.year,TODAY.month),
 u'',u'cv')

# ══════ 목차 ══════
TOC=[(u'🏠',u'매일 여는 곳',u'다섯 개만 외우면 됩니다',3),
 (u'📋',u'하루 열한 칸',u'순서대로 누르면 끝',5),
 (u'🧑‍🏫',u'지점장 화면',u'팀이 한 칸에 보입니다',8),
 (u'📈',u'성장판',u'누가 새는지 보입니다',11),
 (u'👥',u'고객 관리',u'다음에 뭘 할지 적어 둡니다',13),
 (u'🧠',u'두뇌에게 묻기',u'답이 그대로 PPT가 됩니다',17),
 (u'🎙',u'말로 · 글로 시키기',u'화면 이름 몰라도 됩니다',20),
 (u'🚦',u'처음 켜는 날',u'남은 것만 보여 줍니다',22),
 (u'✂️',u'뽑아 쓰는 종이',u'책상에 두고 쓰세요',24)]
page(u'<div class="t1">무엇이 들어 있나</div>'
 u'<div class="t2">필요한 쪽만 펴서 보세요.</div>'
 u'<div class="toc">'+u''.join(
   u'<div class="tc"><span class="e">%s</span><div class="m"><div class="h">%s</div>'
   u'<div class="d">%s</div></div><span class="n">%d</span></div>'%(e,h,d,n)
   for e,h,d,n in TOC)+u'</div>',u'차 례')

# ══════ 1. 매일 여는 곳 ══════
page(u'<div class="t1">매일 여는 곳<br>다섯 개</div>'
 u'<div class="t2">화면이 많지만 <span class="hi">이 다섯 개</span>만 몸에 붙이면 됩니다.<br>'
 u'나머지는 필요할 때 찾으면 됩니다.</div>'
 u'<div class="cards">'
 u'<div class="cd on"><div class="e">📋</div><div class="h">실행 체크판</div>'
 u'<div class="d">오늘 할 열한 가지.<br>아침에 열고 저녁에 닫습니다.</div></div>'
 u'<div class="cd on"><div class="e">🗄️</div><div class="h">DB 통합 CRM</div>'
 u'<div class="d">오늘 전화 걸 사람이<br>여기 나옵니다.</div></div>'
 u'<div class="cd on"><div class="e">👥</div><div class="h">고객 365일</div>'
 u'<div class="d">만난 사람을 여기에.<br>다음에 뭘 할지 적어 둡니다.</div></div>'
 u'<div class="cd on"><div class="e">🧠</div><div class="h">윤시현의 두뇌</div>'
 u'<div class="d">막히면 물어봅니다.<br>답이 그대로 PPT가 됩니다.</div></div>'
 u'</div>'
 u'<div class="box b">지점장은 여기에 <b>성장판</b> 하나 더. 팀이 어떻게 돌아가는지 보입니다.</div>',
 u'1 · 매일 여는 곳')

page(u'<div class="t1">홈 화면</div>'
 u'<div class="t2">로그인하면 이 화면이 나옵니다.</div>'
 +shot(u'01-home',[(14,26,1),(46,26,2),(74,26,3)])
 +pts([u'<b>왼쪽이 메뉴</b>입니다. 위에서부터 자주 쓰는 순서로 놓았습니다.',
       u'<b>오늘 할 일</b>이 먼저 보입니다. 여기서 바로 눌러 들어갑니다.',
       u'<b>자주 쓰는 도구</b>가 아래에 모여 있습니다.']),
 u'1 · 매일 여는 곳')

# ══════ 2. 하루 열한 칸 ══════
page(u'<div class="t1">하루 열한 칸</div>'
 u'<div class="t2">아침에 열고 <span class="hi">위에서부터</span> 누르면 됩니다.<br>순서에 이유가 있습니다.</div>'
 +shot(u'03-ck-my',[(20,10,1),(20,58,2),(60,58,3)])
 +pts([u'왼쪽이 <b>오늘 할 열한 가지</b>. 좌우로 나눠 놔서 한눈에 들어옵니다.',
       u'오른쪽 위가 <b>이번 주</b> 다섯 가지.',
       u'그 아래가 <b>내 성장</b>. 여섯 개 막대가 짧으면 그게 부족한 것입니다.']),
 u'2 · 하루 열한 칸')

page(u'<div class="t1">왜 이 순서인가</div>'
 u'<div class="t2">앞이 비면 뒤가 전부 빕니다.</div>'
 u'<div class="steps">'
 u'<div class="st"><span class="n">1~6</span><div><div class="h">사람을 만드는 일</div>'
 u'<div class="d">출근 → 알림 확인 → 컨셉 → 전화 5통 → 카톡 5건 → 결과 입력<br>'
 u'<b>여기가 비면 그날은 아무 일도 안 한 것입니다.</b></div></div></div>'
 u'<div class="st"><span class="n">7~9</span><div><div class="h">만난 사람을 남기는 일</div>'
 u'<div class="d">고객 카드 → 팩트파인딩 → 내일 자료 준비<br>'
 u'<b>여기가 비면 만난 사람이 다음 달에 사라집니다.</b></div></div></div>'
 u'<div class="st"><span class="n">10~11</span><div><div class="h">내일을 만드는 일</div>'
 u'<div class="d">SNS 1건 → 공부 30분<br>'
 u'<b>여기가 비면 석 달 뒤에 만날 사람이 없습니다.</b></div></div></div>'
 u'</div>'
 u'<div class="box y">못 한 날은 <b>그냥 넘어갑니다.</b> 다음 날 두 배로 하지 마세요. '
 u'몰아서 하다가 그만두는 경우가 제일 많습니다.</div>',
 u'2 · 하루 열한 칸')

page(u'<div class="t1">어디서 하는지<br>모를 때</div>'
 u'<div class="t2">「업무 루트」 를 열면 <span class="hi">상황별로</span> 어느 화면인지 나옵니다.</div>'
 +shot(u'12-route',[(30,8,1),(30,72,2)])
 +pts([u'왼쪽이 <b>이런 상황</b>. "첫 마디를 뭐라고 할지 모르겠습니다" 같은 말 그대로입니다.',
       u'오른쪽이 <b>그때 여는 화면</b>. 누르면 바로 갑니다.']),
 u'2 · 하루 열한 칸')

# ══════ 3. 지점장 화면 ══════
page(u'<div class="t1">지점장은<br>이 화면 하나</div>'
 u'<div class="t2">체크판에서 <span class="hi">「지점장 · 팀 관리」</span> 를 누르면 됩니다.</div>'
 +shot(u'04-ck-leader',[(23,8,1),(29,42,2),(62,8,3)])
 +pts([u'맨 위 <b>「우리 팀 오늘」</b>. 점수 낮은 사람이 위로 옵니다.',
       u'<b>왜 놓치고 있는지 이유</b>가 붙습니다. "출근은 하는데 활동 기록이 없습니다" 처럼.',
       u'아래 <b>달력</b>. 빨간 날이 아무것도 안 찍은 날입니다.']),
 u'3 · 지점장 화면')

page(u'<div class="t1">하루 네 번만<br>보시면 됩니다</div>'
 u'<div class="t2">같은 일이라도 <span class="hi">늦으면 소용없습니다.</span></div>'
 u'<div class="steps">'
 u'<div class="st"><span class="n">☀</span><div><div class="h">아침 9시</div>'
 u'<div class="d">오늘 일정이 <b>빈 사람</b>이 누구인가?<br>늦으면 그 사람 하루가 통째로 날아갑니다.</div></div></div>'
 u'<div class="st"><span class="n">👤</span><div><div class="h">오전 11시</div>'
 u'<div class="d">오늘 나가는 사람이 <b>준비가 됐는가?</b><br>준비 없이 나간 상담은 두 번 만나야 합니다.</div></div></div>'
 u'<div class="st"><span class="n">🖥</span><div><div class="h">오후 4시</div>'
 u'<div class="d">오늘 한 일이 <b>기록으로 남았는가?</b><br>안 남으면 내일 아침 명단이 틀립니다.</div></div></div>'
 u'<div class="st"><span class="n">🌙</span><div><div class="h">퇴근 전</div>'
 u'<div class="d">오늘 <b>아무 기록도 없는 사람</b>이 있는가?<br>내일 아침이면 이미 이틀째입니다.</div></div></div>'
 u'</div>',u'3 · 지점장 화면')

page(u'<div class="t1">놓친 사람에게<br>이렇게 여세요</div>'
 u'<div class="say"><span class="l">이렇게</span>'
 u'"어제 기록이 안 보이던데, 무슨 일 있었어요?"<br>'
 u'"제가 뭘 도와드리면 오늘 세 명은 걸 수 있을까요?"<br>'
 u'"명단 없으면 제가 뽑아 드릴게요. 지금 같이 볼까요?"</div>'
 u'<div class="box r"><b>이렇게 열지 마세요</b><br>'
 u'"왜 이번 달 계약이 없어요?"<br>"다들 하는데 왜 못 해요?"<br><br>'
 u'결과를 묻는 말은 사람을 <b>방어하게</b> 만듭니다. '
 u'방어하는 사람은 도움을 요청하지 않습니다. 그러면 지점장이 할 수 있는 게 없습니다.</div>',
 u'3 · 지점장 화면')

# ══════ 4. 성장판 ══════
page(u'<div class="t1">성장판 —<br>여섯 개 막대</div>'
 u'<div class="t2">사람 한 명을 <span class="hi">여섯 가지</span>로 나눠 봅니다.<br>'
 u'점수가 낮은 게 문제가 아니라 <b>어디가 낮은지</b>가 답을 정합니다.</div>'
 +shot(u'05-grow',[(26,10,1),(48,10,2)])
 +pts([u'출근 · 실행 · 활동 · 고객 · 자료 · 공부 <b>여섯 축</b>.',
       u'옆에 <b>잘하는 사람들 평균</b>이 같이 나옵니다. 얼마나 벌어졌는지 보입니다.']),
 u'4 · 성장판')

page(u'<div class="t1">막대를 보고<br>이렇게 말하세요</div>'
 u'<div class="cards" style="grid-template-columns:1fr">'
 u'<div class="cd"><div class="h">출근만 높고 나머지가 낮다</div>'
 u'<div class="d">나와 있지만 일을 안 하는 것입니다. <b>가장 먼저 봐야 할 사람.</b><br>'
 u'→ "오늘 세 명만 걸어 봅시다. 제가 명단 뽑아 드릴게요."</div></div>'
 u'<div class="cd"><div class="h">활동은 높은데 고객이 낮다</div>'
 u'<div class="d">전화는 많은데 약속이 안 잡힙니다.<br>'
 u'→ "첫 마디를 같이 봅시다." 화법서 5장을 같이 읽습니다.</div></div>'
 u'<div class="cd"><div class="h">고객은 높은데 자료가 낮다</div>'
 u'<div class="d">만나고 나서 남는 게 없습니다.<br>'
 u'→ "팩트파인딩 24칸을 채워 봅시다."</div></div>'
 u'<div class="cd"><div class="h">공부만 높고 활동이 낮다</div>'
 u'<div class="d">준비만 하고 안 씁니다.<br>'
 u'→ "배운 걸 오늘 한 명한테 써 보세요. 누구한테 쓸지 같이 고릅시다."</div></div>'
 u'</div>',u'4 · 성장판')

# ══════ 5. 고객 관리 ══════
page(u'<div class="t1">고객 목록</div>'
 u'<div class="t2">맨 위 <span class="hi">세 줄</span>이 오늘 챙길 사람입니다.<br>그것만 보셔도 됩니다.</div>'
 +shot(u'06-clients',[(9,8,1),(30,10,2),(35,32,3)])
 +pts([u'<b>오늘 챙길 고객</b> — 기한 된 일 / 이번 주 생일 / 60일 넘게 연락 없음.',
       u'이름 옆 그림이 <b>온도</b>. 🔥 최근 · 🌤 좀 됨 · ❄️ 끊김.',
       u'<b>붉은 줄</b>은 기한이 지난 일입니다. 지울 때까지 계속 붉습니다.']),
 u'5 · 고객 관리')

page(u'<div class="t1">이름으로<br>바로 찾기</div>'
 u'<div class="t2">서버에는 <b>김○○</b> 로 저장됩니다. 개인정보라서요.<br>'
 u'대신 <span class="hi">실명을 한 번만 적어 두면</span> 그 이름으로 찾힙니다.</div>'
 u'<div class="cards">'
 u'<div class="cd on"><div class="e">🔤</div><div class="h">김철수</div>'
 u'<div class="d">실명 그대로</div></div>'
 u'<div class="cd on"><div class="e">🔡</div><div class="h">ㄱㅊㅅ</div>'
 u'<div class="d">초성만 쳐도</div></div>'
 u'<div class="cd on"><div class="e">📞</div><div class="h">5678</div>'
 u'<div class="d">전화 뒷자리로</div></div>'
 u'<div class="cd on"><div class="e">👨‍👩‍👧</div><div class="h">김철수 가족</div>'
 u'<div class="d">가족 이름으로</div></div>'
 u'</div>'
 u'<div class="box y">실명은 <b>이 컴퓨터 안에만</b> 저장됩니다. '
 u'폰이나 다른 컴퓨터에서는 한 번 더 적어 주셔야 합니다.</div>',
 u'5 · 고객 관리')

page(u'<div class="t1">고객 한 사람</div>'
 u'<div class="t2">이 화면 하나에 <span class="hi">그 사람의 전부</span>가 있습니다.</div>'
 +shot(u'07-client-one',[(8,8,1),(30,8,2),(60,8,3)])
 +pts([u'<b>관계</b> — 마지막으로 언제 만났고, 다음에 뭘 하기로 했는지.',
       u'<b>가족</b> — 같은 가족 바로가기. 실명도 여기서 적습니다.',
       u'<b>팩트파인딩 24칸</b> — 계산기·상담자료와 똑같은 칸입니다.']),
 u'5 · 고객 관리')

page(u'<div class="t1">이 두 가지가<br>고객관리 전부입니다</div>'
 u'<div class="steps">'
 u'<div class="st"><span class="n">1</span><div><div class="h">다음에 할 일 한 줄</div>'
 u'<div class="d">"증권 받아서 보장분석 돌리기 / 8월 10일"<br>'
 u'날짜가 지나면 목록에서 <b>붉게</b> 뜹니다. 지울 때까지 계속.</div></div></div>'
 u'<div class="st"><span class="n">2</span><div><div class="h">만나고 나서 한 줄</div>'
 u'<div class="d">전화 · 카톡 · 만남 중에 고르고 한 줄 적습니다.<br>'
 u'"아이가 내년에 중학교 간다" — <b>이 한 줄이 다음 전화의 첫 마디</b>가 됩니다.</div></div></div>'
 u'</div>'
 u'<div class="box g">「끝냈습니다」 를 누르면 그 일이 <b>기록으로 자동으로 넘어갑니다.</b> '
 u'따로 적을 필요 없습니다.</div>',
 u'5 · 고객 관리')

# ══════ 6 · 두뇌에게 묻기 ══════
page(u'<div class="t1">모르면<br>두뇌에게 묻습니다</div>'
 u'<div class="t2">인터넷 검색이 아닙니다. <span class="hi">우리 회사 사정을 아는 사람</span>에게 묻는 겁니다.</div>'
 +shot(u'08-brain',[(9,7,1),(9,72,2),(78,7,3)])
 +pts([u'<b>물어볼 칸</b> — 평소 말하듯 적으면 됩니다. "40대 자영업자 종신 어떻게 풀까"',
       u'<b>⭐ 이렇게</b> — 마음에 드는 답에 별을 답니다. 다음부터 그 말투로 답합니다.',
       u'<b>📊 PPT</b> — 방금 그 답이 그대로 발표자료가 됩니다. 다시 칠 필요 없습니다.']),
 u'6 · 두뇌')

page(u'<div class="t1">별을 달수록<br>똑똑해집니다</div>'
 u'<div class="t2">답이 마음에 들면 <b>⭐ 이렇게</b> 를 누르세요. 다섯 개까지 기억합니다.</div>'
 u'<div class="steps">'
 u'<div class="st"><span class="n">1</span><div><div class="h">마음에 드는 답에 별을 답니다</div>'
 u'<div class="d">"이런 식으로 답해라" 를 예시로 가르치는 것과 같습니다.</div></div></div>'
 u'<div class="st"><span class="n">2</span><div><div class="h">다음 질문부터 그 말투로 나옵니다</div>'
 u'<div class="d">길이 · 순서 · 단어 고르는 법까지 따라 합니다.</div></div></div>'
 u'<div class="st"><span class="n">3</span><div><div class="h">마음에 안 들면 별을 뗍니다</div>'
 u'<div class="d">X 를 누르면 바로 지워집니다. 언제든 바꿀 수 있습니다.</div></div></div>'
 u'</div>'
 u'<div class="box b">설정 → <b>두뇌 키우기</b> 에서 세 가지를 더 켤 수 있습니다.<br>'
 u'<b>회사 지식</b> 넣기 · <b>제미나이 지시문</b> · <b>두 번 다듬기</b>.</div>',
 u'6 · 두뇌')

page(u'<div class="t1">답이 그대로<br>발표자료가 됩니다</div>'
 u'<div class="t2"><b>📊 PPT</b> 한 번이면 끝입니다. 글을 다시 칠 필요가 없습니다.</div>'
 +u'<div class="shot"><img src="'+img64(u'14-ppt-bar')+u'"></div>'
 +u'<div class="box g">표지 · 목차 · 요약 · 그래프 · 표 · 맺음말까지 <b>한 번에</b> 만들어집니다.<br>'
 u'다운로드된 파일은 파워포인트에서 바로 열리고, <b>글자도 고칠 수 있습니다.</b></div>'
 u'<div class="box y">숫자가 들어간 자료는 <b>내보내기 전에 한 번 확인</b>해 주세요. '
 u'보험 관련 문구에는 금융소비자보호법에 따른 안내 문구가 자동으로 붙습니다.</div>',
 u'6 · 두뇌')

# ══════ 7 · 말로 · 글로 시키기 ══════
page(u'<div class="t1">화면 이름을<br>몰라도 됩니다</div>'
 u'<div class="t2">그냥 <span class="hi">시키면 찾아서 합니다.</span> 말해도 되고, 글로 써도 됩니다.</div>'
 +shot(u'09-voice',[(12,8,1),(12,74,2),(84,8,3)])
 +pts([u'<b>🎙 누르고 말하기</b> — 누르고 말하면 알아듣습니다.',
       u'<b>⌨ 글로 쓰기</b> — 조용한 곳에서는 아래 칸에 적으면 됩니다.',
       u'<b>한 일은 화면에 남습니다</b> — 했다고 말만 하고 안 하는 일은 없습니다.']),
 u'7 · 말로 · 글로')

CMD=[(u'🏠',u'"홈 열어"',u'화면 이동'),(u'📋',u'"오늘 체크"',u'하루 체크판'),
 (u'👥',u'"고객 열어"',u'고객 목록'),(u'🧠',u'"두뇌"',u'물어보는 칸'),
 (u'✅',u'"전화 5건 했어"',u'그 칸에 체크'),(u'📝',u'"김철수 증권받기 적어"',u'할 일 저장'),
 (u'🔍',u'"김철수 찾아"',u'그 고객 열기'),(u'📊',u'"이번주 어때"',u'내 점수 읽기'),
 (u'🙋',u'"도와줄 거 뭐 있어"',u'남은 일 읽기')]
page(u'<div class="t1">이렇게 시키면<br>됩니다</div>'
 u'<div class="t2">외우지 마세요. <b>말이 되면 알아듣습니다.</b></div>'
 u'<div class="cards" style="grid-template-columns:1fr 1fr 1fr;gap:5mm">'+u''.join(
   u'<div class="cd on" style="padding:5mm"><div class="e" style="font-size:20pt">%s</div>'
   u'<div class="h" style="font-size:13pt;margin-top:3mm">%s</div>'
   u'<div class="d" style="font-size:11pt;margin-top:2mm">%s</div></div>'%(e,q,d)
   for e,q,d in CMD)+u'</div>'
 u'<div class="box r">지울 일이나 보낼 일은 <b>"네" 라고 대답해야</b> 실행됩니다. '
 u'실수로 지워지지 않습니다.</div>'
 u'<div class="box y">고객 <b>이름 · 전화번호 · 병력</b>은 소리 내어 말하지 마세요. '
 u'음성인식은 인터넷 회사 서버를 거칩니다. 숫자 8자리 이상은 앱이 자동으로 막습니다.</div>',
 u'7 · 말로 · 글로')

# ══════ 8 · 처음 켜는 날 ══════
page(u'<div class="t1">뭐가 남았는지<br>앱이 알려 줍니다</div>'
 u'<div class="t2">홈 → <b>🚦 출발 점검</b>. 사장님만 보입니다.</div>'
 +shot(u'02-ready',[(11,7,1),(38,7,2),(70,7,3)])
 +pts([u'<b>초록</b> — 끝난 것. 손댈 것 없습니다.',
       u'<b>노랑</b> — 앱이 대신 못 하는 것. 사장님이 직접 하셔야 합니다.',
       u'<b>빨강</b> — 지금 바로 하셔야 하는 것. 미루면 위험합니다.']),
 u'8 · 처음 켜는 날')

page(u'<div class="t1">사람이 직접<br>해야 하는 것</div>'
 u'<div class="t2">앱이 대신 못 합니다. 하나씩 지워 나가시면 됩니다.</div>'
 u'<div class="ck">'
 u'<div class="r hd">지금 바로</div>'
 u'<div class="r"><span class="b"></span><span class="t">채팅에 한 번 붙였던 배포 열쇠 폐기</span><span class="s">Netlify</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">약관 · 개인정보 문서 변호사 확인</span><span class="s">준법</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">통신판매업 신고</span><span class="s">구청</span></div>'
 u'<div class="r hd">이번 주에</div>'
 u'<div class="r"><span class="b"></span><span class="t">서버 준비 SQL 한 번 실행</span><span class="s">Supabase</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">사업자 정보 11칸 채우기</span><span class="s">설정</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">지점장 지정 · 팀 소속 넣기</span><span class="s">설정</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">AI 열쇠 넣기</span><span class="s">Netlify</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">자동 백업 켜기</span><span class="s">Supabase</span></div>'
 u'<div class="r hd">시작 전에</div>'
 u'<div class="r"><span class="b"></span><span class="t">결제 계약 · 열쇠 넣기</span><span class="s">토스</span></div>'
 u'<div class="r"><span class="b"></span><span class="t">팀 안내 · 고객 동의 받는 법 교육</span><span class="s">사람</span></div>'
 u'</div>'
 u'<div class="box r"><b>열쇠는 채팅창에 적지 마세요.</b> '
 u'Netlify 설정 화면에 사장님이 직접 넣으셔야 합니다.</div>',
 u'8 · 처음 켜는 날')

# ══════ 9 · 뽑아 쓰는 종이 ══════
def ckpage(t1,t2,rows,kk):
    h=u''.join(
      (u'<div class="r hd">%s</div>'%r[1]) if r[0]=='h' else
      (u'<div class="r"><span class="b"></span><span class="t">%s</span><span class="s">%s</span></div>'%(r[1],r[2]))
      for r in rows)
    page(u'<div class="t1">%s</div><div class="t2">%s</div><div class="ck">%s</div>'%(t1,t2,h),kk)

ckpage(u'하루 체크 종이',u'책상에 붙여 두고 <b>하나씩 지우세요.</b> 열한 칸입니다.',
 [('h',u'아침'),('r',u'어제 못한 것 먼저 지우기',u''),('r',u'오늘 만날 사람 확인',u''),
  ('r',u'붉은 줄 고객부터 전화',u''),
  ('h',u'낮'),('r',u'신규 전화',u''),('r',u'약속 잡기',u''),('r',u'상담',u''),
  ('r',u'증권 · 보장분석',u''),('r',u'소개 부탁',u''),
  ('h',u'저녁'),('r',u'만난 사람 한 줄씩 기록',u''),('r',u'다음에 할 일 적기',u''),
  ('r',u'내일 만날 사람 확인',u''),('r',u'체크판 저장',u'')],
 u'9 · 뽑아 쓰는 종이')

ckpage(u'지점장 체크 종이',u'하루 <b>네 번</b>만 보시면 됩니다.',
 [('h',u'아침 9시'),('r',u'어제 안 찍은 사람 확인',u''),('r',u'붉은 사람 한 명 골라 전화',u''),
  ('h',u'점심 1시'),('r',u'오전에 움직인 사람 칭찬 한 줄',u''),
  ('h',u'저녁 6시'),('r',u'오늘 0건인 사람 확인',u''),('r',u'막힌 사람에게 이유 묻기',u''),
  ('h',u'밤 9시'),('r',u'내일 같이 뛸 사람 정하기',u''),('r',u'주간 점수 확인',u''),
  ('h',u'주 1회'),('r',u'성장판 여섯 축 보고 가장 낮은 축 하나만 정하기',u''),
  ('r',u'그 축을 다음 주 팀 목표로 말하기',u'')],
 u'9 · 뽑아 쓰는 종이')

page(u'<div class="t1">막혔을 때<br>여기를 보세요</div>'
 u'<div class="t2">거의 다 이 넷 중 하나입니다.</div>'
 u'<div class="steps">'
 u'<div class="st"><span class="n">1</span><div><div class="h">화면이 안 바뀐다</div>'
 u'<div class="d">새로고침 한 번. 그래도 안 되면 로그아웃 후 다시 로그인.</div></div></div>'
 u'<div class="st"><span class="n">2</span><div><div class="h">고객 이름이 김○○ 로만 보인다</div>'
 u'<div class="d">정상입니다. 고객 화면에서 실명을 한 번 적어 두시면 이 기기에서는 그대로 보입니다.</div></div></div>'
 u'<div class="st"><span class="n">3</span><div><div class="h">두뇌가 답을 안 한다</div>'
 u'<div class="d">AI 열쇠가 아직 안 들어갔습니다. 홈 → 🚦 출발 점검 에서 확인하세요.</div></div></div>'
 u'<div class="st"><span class="n">4</span><div><div class="h">팀원 화면이 안 보인다</div>'
 u'<div class="d">그 사람의 역할이 아직 「설계사」입니다. 설정 → 팀원 권한 관리 에서 팀을 넣어 주세요.</div></div></div>'
 u'</div>'
 u'<div class="box b">그래도 안 되면 <b>🎙 음성비서</b> 에게 <b>"도와줄 거 뭐 있어"</b> 라고 물어보세요.<br>'
 u'지금 남은 일을 읽어 줍니다.</div>',
 u'9 · 뽑아 쓰는 종이')

page(u'<div class="t1">외울 것은<br>이 다섯 줄뿐입니다</div>'
 u'<div class="steps" style="gap:7mm">'
 u'<div class="st"><span class="n">1</span><div><div class="h">아침에 📋 체크판을 연다</div></div></div>'
 u'<div class="st"><span class="n">2</span><div><div class="h">움직일 때마다 그 칸을 누른다</div></div></div>'
 u'<div class="st"><span class="n">3</span><div><div class="h">만나고 나면 👥 고객에 한 줄 적는다</div></div></div>'
 u'<div class="st"><span class="n">4</span><div><div class="h">막히면 🧠 두뇌에게 묻는다</div></div></div>'
 u'<div class="st"><span class="n">5</span><div><div class="h">저녁에 저장을 누른다</div></div></div>'
 u'</div>'
 u'<div class="say"><span class="l">기억할 것</span>'
 u'하루에 <b>다섯 번</b> 손대면 됩니다.<br>나머지는 앱이 알아서 모아 둡니다.</div>'
 u'<div class="box g" style="text-align:center;font-size:16pt">'
 u'에이플러스에셋 <b>온탑본부</b></div>',
 u'')

# ══════ 목차 쪽 번호 다시 매기기 ══════
import re
first={}
for i,h in enumerate(P):
    m=re.search(u'class="kk">([^<]*)<',h)
    if m and m.group(1) and m.group(1) not in first:first[m.group(1)]=i+1
def pgof(name):
    for k in first:
        if k.endswith(name):return first[k]
    return 0
toc=u'<div class="toc">'+u''.join(
   u'<div class="tc"><span class="e">%s</span><div class="m"><div class="h">%s</div>'
   u'<div class="d">%s</div></div><span class="n">%d</span></div>'%(e,h,d,pgof(h) or n)
   for e,h,d,n in TOC)+u'</div>'
P[1]=re.sub(u'<div class="toc">.*?</div></div></div></div>',toc,P[1],flags=re.S)

HTML=(u'<!doctype html><html lang="ko"><head><meta charset="utf-8">'
 u'<title>이 앱, 이렇게 쓰시면 됩니다</title><style>'+CSS+u'</style></head><body>'
 +u''.join(P)+
 u'<div class="tools"><button onclick="window.print()">인쇄 / PDF 저장</button></div>'
 u'</body></html>')
io.open(SC+'easy.html','w',encoding='utf-8').write(HTML)
print('pages=%d bytes=%d'%(len(P),len(HTML)))
print(sorted(first.items(),key=lambda x:x[1]))
