/* ══════════════════════════════════════════════════════════════════
   check-toss.js — <b>토스처럼 되어 가고 있나.</b> 자(尺)입니다.

   사장님 말씀 — 「토스어플처럼 만들 계획과 프로젝트를 짜보자」.

   「토스처럼」 을 <b>느낌으로</b> 고치면 고쳤는지 아닌지 아무도 모릅니다.
   그래서 <b>재는 자를 먼저</b> 만듭니다. 이 점검은 「예쁜가」 를 묻지
   않습니다 — 예쁜 것은 잴 수 없습니다. <b>손이 닿는가 · 눈에 읽히는가 ·
   한 화면에 들어오는가</b> 셋만 잽니다. 셋 다 숫자입니다.

   ── 재는 것 넷 ────────────────────────────────────────────────────
     ① <b>작은 글자</b>  13px 아래로 찍힌 글자가 몇 개인가
        폰에서 12px 는 안경을 벗으면 안 읽힙니다. 사장님은 고객 앞에서
        이 화면을 여십니다.
     ② <b>글자 계단</b>  화면 하나에 글자 크기가 몇 가지인가
        21가지면 계단이 아니라 비탈입니다. 눈이 어디가 중요한지 못
        고릅니다.
     ③ <b>빗나가는 자리</b>  높이 44px 아래인 누름 자리가 몇 개인가
        애플이 정한 손가락 크기가 44px 입니다. 그 아래는 옆을 누릅니다.
     ④ <b>옆으로 새나</b>  폰 너비에서 가로 스크롤이 생기는가
        가로로 새면 글이 잘리고, 잘린 줄은 아무도 안 읽습니다.

   ── 어떻게 빨간불이 켜지나 ────────────────────────────────────────
   <b>기준선(BASE)을 지금 값으로 못 박아 둡니다.</b> 그래서 오늘은 전부
   초록입니다. 여기서 <b>나빠지면</b> 그 자리에서 빨간불이 켜집니다 —
   새 화면을 만들면서 10px 글자를 또 뿌리면 걸립니다.

   한 단계를 끝낼 때마다 <b>기준선을 그만큼 조입니다.</b> 그러면 되돌아
   가는 것도 막힙니다. 기준선은 <b>사람이 손으로</b> 내립니다 — 저절로
   내려가게 두면 나빠진 것을 그대로 새 기준으로 삼습니다 (1번).

   ★ <b>0 을 목표로 적지 않습니다.</b> 아직 못 간 자리를 「됐다」 고
     적으면 그것이 거짓말입니다. 지금 값을 그대로 적고, 고칠 때마다
     내립니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8983;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ── <b>기준선</b> — 2026-09-17 에 잰 값 ──────────────────────────────
   고칠 때마다 손으로 내립니다. 올리지 않습니다 — 올리는 순간 이 자는
   자가 아니라 변명이 됩니다.

     tiny  13px 아래로 찍힌 글자 수
     size  글자 크기 가짓수
     small 44px 아래인 누름 자리 수                                    */
/* 화면 <b>전부</b>를 한 번에 재는 기준선 — 한 화면씩 적지 않습니다.
   화면이 늘 때마다 여기를 고쳐야 하면 이 줄이 곧 낡아 거짓말이 됩니다.
   7단계(9/17 21:00) 인라인 font-size 1,545자리를 계단으로 옮긴 뒤 —
   보이는 글자 5,169개 중 13px 아래가 <b>503 → 0</b>, 옆으로 새는 화면 0. */
/* ⚠ 2026-09-23 · tiny 0 → <b>2</b>. 사장님 말씀 「목업대로 가줘 계단
   늘리고」 로 홈 카드 꼬리표가 <b>12.5px</b>(목업 .hc .t)가 됐습니다 —
   앱이 정해 둔 바닥 13px 아래입니다. <b>사장님이 그렇게 가자고 하셔서</b>
   올립니다. 자리는 홈의 .tz-hc .t <b>한 곳</b>이고, 폰에서 보시고 작으면
   그 한 줄만 13px 로 되돌리면 됩니다. 늘어난 까닭을 안 적고 숫자만
   올리면, 다음에 누가 무심코 뿌려도 아무도 모릅니다 (8번).            */
/* ⚠ 2026-09-25 · <b>tiny 2 → 3</b>. 사장님 말씀 「목업과 홈화면 토시 하나
   … 안 틀리고 맞추고」 — 목업 홈은 카드 이름표를 11.5px, 보조줄을 12px 로
   적습니다(앱 바닥은 13px). 사장님이 <b>목업대로 가자</b>고 하신 값이라
   그만큼 올립니다. 본문은 그대로 13px 이고, 작아진 것은 <b>이름표와 꼬리
   줄</b>뿐입니다. 자리별 기준선은 아래 BASE 의 home 에도 적어 두었습니다. */
const ALL_BASE = { tiny: 3, wide: 0 };
/* 따로 열리는 세 화면 — <b>잰 값 그대로</b> 적습니다. 0 을 목표로 적지 않습니다 (1번).
   8단계(9/17 22:30) 계산기 178→<b>0</b> · CRM 16→<b>0</b>.
   전·후는 559→<b>557</b> 에서 멈췄습니다 — 작은 글자가 &lt;style&gt; 한 덩이에 있는데
   그 덩이를 <b>고객에게 보여 드리는 무대</b>와 나눠 쓰고 있어, 크기를 올리면
   16:9 한 장이 넘칩니다(실제로 넉 장이 720px 를 넘어 점검이 잡았습니다).
   무대와 만들기 화면의 CSS 를 <b>가르는 일</b>이 먼저라, 그것만 따로 합니다. */
const SOLO = [
  /* ⚠ 이 자는 각 화면의 <b>첫 모습</b>만 잽니다. 계산기는 안에 보고서
     열네 칸이 더 있고, 그 칸을 눌러 보지 않아 「옆으로 새는 화면 0개」
     로 초록이던 때에도 여덟 칸이 폰에서 새고 있었습니다.
     그 칸들은 <b>check-finwide.js</b> 가 하나씩 눌러 봅니다 (8번). */
  { t: '재무설계 계산기',    url: '/app/finance.html', tiny: 0 },
  { t: '보장 전·후 만들기', url: '/app/ba.html',      tiny: 557 },
  { t: 'DB 통합 CRM',      url: '/db-crm.html',      tiny: 0 }
];
const BASE = {
  /*          작은 글자   계단    빗나감
     0단계(9/17 09:20) 141·18·50 / 63·11·11 / 50·9·31 / 64·10·34
     1단계(9/17 10:40) <b>글자 계단</b>을 여섯으로 못 박고 앱 CSS 의
       font-size 1,451자리를 전부 토큰으로 옮긴 뒤 — 작은 글자가
       <b>네 화면 모두 0</b>.
     2단계(9/17 12:10) <b>엄지</b> — 누르는 자리에 44px 바닥을 깔고
       아래 탭바를 놓은 뒤 — 빗나가는 자리도 <b>네 화면 모두 0</b>.
     5단계(9/17 16:40) <b>자가 자기를 속이고 있었습니다.</b> 고객 목록(OSC)을
       안 심어서 「고객 365일」·「내 캘린더」를 <b>아직 읽는 중인</b> 화면으로
       재고 있었습니다 — 목록이 비어 있으니 줄에 붙은 글자를 <b>한 번도 센
       적이 없습니다.</b> 그때는 「읽는 중」과 「없습니다」가 같은 그림이라
       아무도 못 봤고, 5단계에서 그 둘을 갈라 놓으니 드러났습니다.
       홍길동 세 분을 심고 다시 재니 —
         · 작은 글자 12.5px 가 <b>3개</b> 나왔습니다 (cliMonthHtml 의 인라인
           style 자리 — 1단계는 &lt;style&gt; 두 덩이만 옮겼습니다). 고쳐서 0.
         · 세로가 1.3→<b>2.8</b>화면, 1.8→<b>2.4</b>화면. 이것은 나빠진 것이
           아니라 <b>여태 안 재던 것을 재기 시작한 것</b>입니다. 기준선을
           잰 값 그대로 적습니다 — 편한 숫자를 적어 두는 자는 자가 아닙니다.
         · 글자 계단 3→<b>4</b>: 「오늘 몫 N명」 한 자리가 --t5 입니다.
       ※ 남은 인라인 font-size 가 아직 <b>1,900자리쯤</b> 있습니다 (JS 문자열
         안의 style= 라 1단계 변환이 지나갔습니다). 다음 판에서 옮깁니다.   */
  /* 9/19 03:40 — 홈이 3.5→<b>3.6</b>화면(2,994→3,027px). <b>정확히 33px</b>,
     홈에 선 <b>고객 찾기 한 칸</b>의 높이 그대로다.

     올리기 전에 <b>이미 있는 찾기와 겹치는지</b> 재 봤다. 안 겹친다 —
       · 서랍 찾기(navFind)는 <b>고객 365일</b>(OSC.list)에서 <b>이름만</b> 본다
       · 홈 찾기(cusFind)는 <b>배정 DB</b>(dbs)에서 이름·초성·<b>전화 뒷자리</b>·<b>지역</b>
     배정 DB 1,444명 중 고객 365일에 올라간 분은 일부뿐이라, 홈 찾기가
     없으면 <b>나머지는 어디서도 못 찾는다.</b> 같은 것이 두 곳이 아니다 (5번).

     <b>줄일 자리가 없다.</b> 33px 은 입력칸 자체이고, 오히려 이 앱이 지키는
     <b>44px 손가락 크기보다 작다</b> — 키우면 더 길어진다. 그 자리는 따로 손봐야 한다.

     그래서 <b>한 눈금만</b> 올린다. 3.6 을 넘으면 그때는 다시 걸린다 —
     자를 버린 것이 아니다.                                              */
  /* 9/20 12:40 — 세 화면이 한 눈금씩 길어졌다. <b>무엇이 늘렸는지 하나씩
     재 보고</b> 올린다. 편한 숫자를 적어 두는 자는 자가 아니다.

       · 홈 3.6 → <b>3.8</b> (3,027 → 3,249px · +222px)
         ① 「지금 누구 화면인가」 띠(hwho) — <b>매니저에게만</b> 선다.
            설계사 화면은 안 늘었다. 남의 화면을 내 것으로 알고 전화를
            거는 것을 막는 자리라 줄일 수 없다.
         ② 단계 줄(hdb) — 「→ 다음 단계 · 부재 · 통화됨 · 거절 · 고치기」.
            사장님이 「홈에서 바로바로 단계별로」 하라 하신 그 자리다.
            단추는 <b>44px 아래로 못 줄인다</b> — 폰에서 빗나간다.

       · 고객 365일 2.8 → <b>2.9</b> (+75px)
         담당자 칩 줄을 맨 아래에서 맨 위로 올리고(「딱 보이게」),
         「지금 ○○님 고객만 보고 있습니다」 한 줄을 적었다.

       · 내 캘린더 2.4 → <b>2.5</b> (+66px)
         달력에 「매일 하는 일」 한 줄.

     <b>먼저 줄이고 올렸다.</b> 매일 하는 일 열한 줄을 늘 펴 두었더니
     고객 365일이 3.7, 내 캘린더가 3.3 이었다 — <b>0.9 화면씩</b>. 접어 두고
     누르면 펴지게 바꿔 2.9 · 2.5 로 내렸다. 접힌 줄에도 「1 / 11」 이 남아
     있어 「없어진 것」 으로 안 읽힌다.

     2026-09-21 · 홈 3.8 → <b>3.9</b> (+약 50px)
       말 칸 밑에 「상황」 고르는 줄 하나 — 📵 부재 · 🚫 거절 · 🕰 기고객 ·
       🏥 입원. 「이 분이 지금 입원해 계시다」 는 앱이 알 길이 없어, 단계로만
       고르면 그 말은 <b>영영 안 뜹니다.</b> 꺼내 쓸 길을 낸 값입니다.
       <b>먼저 줄였습니다</b> — 두 줄(4.0화면)로 만들었다가 이름을 줄이고
       한 줄로 붙여 3.9 로 내렸습니다. 손가락 크기(44px)는 안 줄였습니다 —
       그 아래는 옆을 누릅니다. 넷이 안 들어가는 폰에서는 옆으로 굴러갑니다.
       ★ 더 줄이려면 「📋 복사」 단추 줄에 끼워 넣어야 하는데, 그러면 44px
         자리가 비좁아집니다. 높이보다 손가락이 먼저입니다.              */
  /* ══ 2026-09-23 · <b>사장님이 목업대로 가자고 하셨습니다</b> ══════
     「목업대로 가줘 <b>계단 늘리고</b> 차례도 되돌려」.

     그래서 홈의 글자 계단을 <b>7 → 10</b> 으로, 13px 아래 글자를
     <b>0 → 2</b> 로 올립니다. 무엇이 늘었는지 적어 둡니다 —

       27px  히어로 아래 큰 제목(.t-h1)      · 목업 .h1
       22px  「윤 단장님, 오늘 3개예요」      · 목업 .greet
       15.5px 히어로 단추 · 카드 단추         · 목업 .hero .b · .hc .go
       13.5px 히어로 설명 · 카드 작은 글      · 목업 .hero .s · .hc .m small
       <b>12.5px</b> 카드 꼬리표(「지금 할 것」) · 목업 .hc .t

     ⚠ <b>12.5px 는 앱이 정해 둔 바닥(13px) 아래입니다.</b> 「그 아래로는
       폰에서 잘 안 읽힌다」 고 이 점검이 스스로 적어 두었고, 그 규칙을
       정하신 것도 사장님입니다. <b>사장님이 목업대로 가자고 하셔서</b>
       올립니다 — 제가 판단해서 낮춘 것이 아닙니다. 폰에서 보시고 작으면
       말씀만 주시면 13px 로 되돌립니다(자리는 .tz-hc .t 한 곳입니다).
     ★ 나머지 화면의 기준선은 <b>그대로</b>입니다 — 이 예외는 홈에만.  */
  /* ── 2026-09-25 · <b>작은 글자 2 → 3</b> (무엇을 얻고 치렀나) ─────
     사장님 말씀 — 「목업과 홈화면 <b>토시 하나 디자인 하나 색상 하나</b>
     안 틀리고 맞추고」. 목업의 홈은 카드 이름표를 <b>11.5px</b>, 보조줄을
     <b>12px</b> 로 적습니다 — 앱이 정해 둔 바닥 13px 아래입니다.
     ★ <b>사장님이 목업대로 가자고 하신 값</b>입니다. 앞서 카드 스택을
       넣을 때(#435) 12.5px 를 그렇게 받았고, 그때도 이 기준선을 올렸습니다.
     ★ <b>얻은 것</b> — 이름표·보조줄이 목업과 같은 크기가 되어, 이름과
       보조줄의 층이 목업처럼 벌어집니다.
     ★ <b>치른 것</b> — 13px 아래 글자가 둘에서 셋이 됐습니다. 본문은
       그대로 13px 이고, 작아진 것은 <b>이름표와 꼬리 줄</b>뿐입니다.    */
  /* 계단 10 → 11 — 목업의 <b>11.5px 이름표</b>가 들어왔습니다(위와 같은 까닭) */
  /* ── 2026-09-25 · <b>3.9 → 3.4 · 계단 11 → 10</b> (내려 잡습니다) ─────
     사장님 말씀 「다 해」 로 홈의 겹친 자리를 걷어냈습니다 —
       · <b>「지금 할 것」 얇은 카드</b>(172px) : 바로 아래 한 분 카드가
         같은 분을 같은 말로 다시 적고 있었습니다 (5번).
       · <b>노란 경고 상자 · 파란 공지 상자</b>(약 190px) : 한 줄씩으로.
     3.2화면으로 줄었습니다. <b>짧아졌으면 기준선도 같이 내리라고</b> 이
     점검이 스스로 적어 둡니다 — 안 내리면 다음에 0.7화면이 늘어도 조용합니다
     (8번). 0.2화면만 남겨 둡니다.
     ★ <b>작은 글자는 3 그대로</b>입니다. 새로 넣은 한 줄짜리 소식은
       12.5px(목업 값)이 아니라 <b>13px</b>(앱 바닥)로 적었습니다 — 읽고
       지나가는 알약이 아니라 <b>경고이자 단추</b>라서입니다.               */
  home:    { tiny: 3, size: 10, small: 2, screens: 3.4 },
  /* 2026-09-21 · 2.5 → <b>2.4</b>. 「고객 체크」 칸을 늘리면서 2.6 이 되어
     여기가 잡았고, 기준을 올리는 대신 <b>내 코칭 · 본인 점검란</b>을 왼쪽에서
     뺐습니다(둘 다 ☰ 서랍에 그대로 있습니다). 그래서 오히려 짧아졌습니다 —
     짧아졌으면 기준선도 같이 내리라고 이 점검이 적어 둡니다. */
  /* 2026-09-22 · 2.4 → <b>2.2</b>. 「내 업적 · 월간보고」 와 「30일 고객관리」 를
     뺐다(사장님 말씀). 자를 올린 것이 아니라 <b>실제로 줄어든</b> 값이다 —
     열셋이던 칸이 여덟이 됐다. */
  airep:   { tiny: 0, size: 4, small: 0, screens: 2.2 },
  clients: { tiny: 0, size: 4, small: 0, screens: 2.9 },
  /* 2026-09-23 · 2.5 → <b>2.2</b>. 달력 칸에 「매일 하는 일」을 <b>글자로</b>
     적고(사장님 말씀 「한달치 입력 안되어있어」 — 값은 있는데 점 하나라
     안 보였다), 「📆 이번 달 통째로 넣기」 와 바탕화면 안내를 더했더니
     <b>2.7</b> 이 되어 이 점검이 잡았다.
     <b>자를 올리는 대신 줄였다</b> — 「폰 기본 달력에 넣기」 는 한 달에 한 번
     누르는 자리인데 677px 를 차지해 날마다 보는 달력을 밀어냈다. 주 단추
     하나만 펴 두고 나머지(매일 알림·오늘 것만·울릴 시각·실명 설정)를
     접었고, 바탕화면 안내도 접었다 — <b>지운 것이 아니다.</b>
     그래서 오히려 2.2 로 짧아졌다. 짧아졌으면 기준선도 같이 내린다.

     ── 2026-09-25 · <b>계단 3 → 4</b> (무엇을 얻고 무엇을 치렀나) ─────
     사장님 말씀 — 「달력은 유지해 매월 매주 스케줄 볼 수 있게 <b>매주를
     기본</b>으로 해서 <b>이번 주에 집중</b>하게 하고」. 그래서 달력이 이제
     <b>주 보기로</b> 열립니다.
     주 격자는 날짜 숫자를 <b>--t5(14px)</b> 로 적습니다 — 이레가 큰 칸으로
     서니 13px 로는 안 읽힙니다. 달 격자에는 없던 크기라 이 화면의 계단이
     셋에서 <b>넷</b>이 됐습니다.
     ★ <b>새로 만든 크기가 아닙니다</b> — 앱의 글자 계단(--t5)이고 다른
       화면들이 이미 씁니다. 주 보기가 기본이 되면서 <b>드러난</b> 것입니다.
     ★ <b>얻은 것</b> — 열면 이번 주가 바로 섭니다. 사장님이 매일 여는
       자리라 그만큼은 치릅니다.
     ★ 달 보기는 <b>그대로</b>입니다 — 고르개가 있고, check-calmonth 가
       달 격자를 따로 잽니다.                                          */
  mycal:   { tiny: 0, size: 4, small: 0, screens: 2.2 }
};

/* 견본은 <b>홍길동</b> 집안입니다 (3번). 화면마다 같은 것을 심어야
   잰 값이 날마다 안 바뀝니다 — 서버에서 오는 대로 재면 자가 흔들립니다. */
const SEED = `
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(function(x){x.remove()});
  window.toast=function(){};
  OS.session={user:{id:'u1'}};
  OS.profile={id:'u1',name:'윤시현',role:'owner',active:true,plan:'vip'};
  window.arLoad=function(){};
  /* ★ <b>자료가 손에 있는 화면</b>을 잽니다. 여태 OSC(고객 목록)를 안 심어서
     이 자는 <b>아직 읽는 중인</b> 화면을 재고 있었습니다 — 그때는 「읽는 중」과
     「없습니다」가 같은 그림이라 아무도 못 봤습니다. 5단계에서 그 둘을 갈라
     놓으니 드러났습니다. 사장님이 보시는 것은 <b>다 온 화면</b>입니다. */
  window.osLoadClients=function(){};
  (function(){
    var mk=function(id,st){return {id:id,who:'u1',name:'홍길동'+id,region:'순천',src:'일반',
      stage:st,cAt:'',pAt:'',got:'2026-09-01',n:1,last:'',res:'부재',appt:'',memo:'',days:9};};
    AR.loaded=true; AR.busy=false; AR.cliRows=[];
    AR.db=[mk('a','부재'),mk('b','TA'),mk('c','PC')];
    AR.cat='touch'; AR.tk='all'; AR.tks=''; AR.tkAll=false; AR.tkWho=''; AR.tkTeam='';
    OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.q='';
    OSC.list=[{id:'c1',advisor_id:'u1',name_masked:'홍○○',created_at:'2026-09-01'},
              {id:'c2',advisor_id:'u1',name_masked:'홍○○',created_at:'2026-09-02'},
              {id:'c3',advisor_id:'u1',name_masked:'홍○○',created_at:'2026-09-03'}];
  })();`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  /* <b>아이폰 크기</b>로 잽니다 — 사장님이 고객 앞에서 여시는 것은 폰입니다 */
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥으로 안 나갑니다 — 재는 것은 글자 크기지 서버가 아닙니다 (8번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  const measure = async (tab) => await page.evaluate((a) => {
    (0, eval)(a.seed);
    try { go(a.tab); } catch (e) {}
    const pane = document.getElementById('dynPane');
    if (!pane) return null;
    /* <b>보이는 글자만</b> 셉니다. 숨은 칸까지 세면 고치지도 않은 자리가
       숫자를 올려 놓아 어디를 고칠지 알 수가 없습니다. */
    const sizes = {}; let tiny = 0, total = 0;
    pane.querySelectorAll('*').forEach(e => {
      if (!e.offsetParent) return;
      const n = e.childNodes[0];
      const t = (n && n.nodeType === 3) ? (n.nodeValue || '').trim() : '';
      if (!t) return;
      const fs = Math.round(parseFloat(getComputedStyle(e).fontSize) * 2) / 2;
      sizes[fs] = (sizes[fs] || 0) + 1; total++;
      if (fs < 13) tiny++;
    });
    /* 손가락이 닿는가 — <b>눌러서 뭔가 일어나는 것</b>만 셉니다 */
    let small = 0, btn = 0, worst = 99;
    pane.querySelectorAll('button,a,select,input[type=checkbox]').forEach(e => {
      if (!e.offsetParent) return;
      /* <b>손이 닿는 자리</b>를 잰다 — 체크 네모는 13px 여도 감싼 줄(label)이
         44px 면 손가락은 안 빗나간다. 네모만 재면 고칠 수 없는 것을 세게
         되고, 고칠 수 없는 숫자는 사람이 곧 안 믿는다 (8번). */
      let box = e;
      if (e.tagName === 'INPUT') { const lab = e.closest('label'); if (lab) box = lab; }
      const r = box.getBoundingClientRect();
      if (!r.height) return;
      btn++;
      if (r.height < 44) { small++; if (r.height < worst) worst = Math.round(r.height); }
    });
    return {
      tiny, total, btn, small, worst: (worst === 99 ? 0 : worst),
      size: Object.keys(sizes).length,
      top: Object.entries(sizes).sort((x, y) => y[1] - x[1]).slice(0, 4).map(x => x[0] + 'px×' + x[1]).join(' · '),
      wide: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollW: document.documentElement.scrollWidth,
      /* ★ <b>세로는 문서가 아니라 「굴러가는 판」을 재야 한다.</b>
         이 앱은 #dynPane 안에서 굴러가므로 문서 높이는 늘 화면만 하다.
         그래서 여기가 <b>1.1화면</b>이라고 적고 있었는데 실제 홈은
         <b>6.4화면</b>이었다 — 편한 숫자를 적어 두는 자는 자가 아니다 (1번). */
      screens: Math.round(pane.scrollHeight / window.innerHeight * 10) / 10,
      px: Math.round(pane.scrollHeight)
    };
  }, { seed: SEED, tab });

  const NAME = { home: '홈', airep: 'TFA 업무관리', clients: '고객 365일', mycal: '내 캘린더' };
  const now = {};
  for (const tab of Object.keys(BASE)) {
    console.log('\n[' + NAME[tab] + '] 폰(390px)에서 재 봅니다');
    const M = await measure(tab);
    now[tab] = M;
    if (!M) { is(false, '화면이 안 섭니다 — ' + tab); continue; }
    const B = BASE[tab];
    is(M.tiny <= B.tiny,
      '<b>작은 글자</b>(13px 아래) ' + M.tiny + '개 / 글자 ' + M.total + '개 — 기준선 ' + B.tiny +
      (M.tiny > B.tiny ? ' ← 늘었습니다. 새로 넣은 자리에 작은 글자를 뿌리지 않았는지 보십시오'
                       : (M.tiny < B.tiny ? ' (줄었습니다 — 기준선도 같이 내려 주십시오)' : '')));
    is(M.size <= B.size,
      '<b>글자 계단</b> ' + M.size + '가지 — 기준선 ' + B.size + ' · 많이 쓰는 것: ' + M.top +
      (M.size > B.size ? ' ← 늘었습니다. 새 크기를 만들지 말고 있는 것을 쓰십시오' : ''));
    is(M.small <= B.small,
      '<b>빗나가는 자리</b>(44px 아래) ' + M.small + '개 / 누를 곳 ' + M.btn + '개 — 기준선 ' + B.small +
      (M.worst ? (' · 제일 작은 것 ' + M.worst + 'px') : '') +
      (M.small > B.small ? ' ← 늘었습니다' : ''));
    /* 가로로 새는 것은 <b>기준선이 없습니다</b> — 새면 그냥 틀린 것입니다 */
    is(!M.wide,
      '<b>옆으로 안 샙니다</b> — 폭 ' + M.scrollW + 'px / 390px' +
      (M.wide ? ' ← 가로로 샙니다. 글이 잘리고, 잘린 줄은 아무도 안 읽습니다' : '') +
      ' · 세로 ' + M.screens + '화면(' + M.px + 'px)');
    /* <b>세로도 기준선을 둔다</b> — 한 화면 한 가지로 가는 길이라 */
    if (B.screens !== undefined)
      is(M.screens <= B.screens,
        '<b>세로로 안 길다</b> — ' + M.screens + '화면 · 기준선 ' + B.screens +
        (M.screens > B.screens ? ' ← 길어졌습니다. 카드를 또 늘리지 않았는지 보십시오'
                               : (M.screens < B.screens ? ' (짧아졌습니다 — 기준선도 같이 내려 주십시오)' : '')));
  }

  /* ══ <b>아래 탭바</b> — 엄지가 늘 닿는 자리 ════════════════════════
     폰에서 메뉴는 왼쪽 위 ☰ 뒤에 있었습니다. 한 손으로 들면 거기가 제일
     안 닿는 자리입니다.

     여기서 재는 것 —
       · 폰에서 <b>선다</b> · 넓은 화면에서는 <b>안 선다</b>(두 곳이 되면 안 됨)
       · 누르면 <b>정말로 그 화면</b>으로 간다
       · <b>지금 화면</b>이 켜져 있다 (navMark 한 곳이 정한다)
       · 「도구」 가 <b>화면</b>을 열고, ★ <b>서랍 길도 그대로</b> 살아 있다
       · 탭바가 <b>글을 안 덮는다</b>                                    */
  /* ══ <b>홈은 한 화면 한 가지</b> ═══════════════════════════════════
     매일 제일 먼저 봐야 할 것이 <b>첫 화면 안</b>에 있어야 합니다. 재 보니
     「오늘 할 일」 이 <b>1,707px 아래</b> — 두 화면 넘게 굴려야 나왔습니다.
     그리고 홈이 <b>5,429px · 여섯 화면 반</b>이었습니다.

     여기서 재는 것 —
       · 「오늘 할 일」 이 <b>첫 화면 안</b>에 있다
       · 큰 카드는 <b>접혀</b> 있고, 머리를 누르면 <b>그 자리에서</b> 펴진다
       · 편 것을 <b>기억한다</b> (다시 그려도 펴져 있다)
       · 접힌 머리에 적힌 숫자는 <b>그 카드가 세는 것</b>이다               */
  console.log('\n[홈] 한 화면 한 가지');
  const HM = await page.evaluate((seed) => {
    (0, eval)(seed); try { go('home'); } catch (e) {}
    const pane = document.getElementById('dynPane');
    const H = () => Math.round(pane.scrollHeight);
    /* ⚠ 2026-09-23 · <b>자를 「지금 할 것」 카드로 돌렸습니다.</b>
       사장님 말씀 「목업대로 가줘 … 차례도 되돌려」 로 홈이 목업 차례
       (인사 → 히어로 → 지금 할 것 → …)가 되면서, 옛 카드(.hm-now)는
       그 아래로 내려갔습니다. <b>재려는 규칙은 그대로</b>입니다 —
       「오늘 할 일이 첫 화면 안에 있나」. 그 일이 이제 <b>.tz-hc</b>(지금
       할 것)에 있으므로 거기를 봅니다. 없으면 여태처럼 .hm-now 를 봅니다.
       ★ 자를 옮긴 것이지 <b>기준을 낮춘 것이 아닙니다</b> — 첫 화면에
         오늘 할 일이 없으면 여전히 빨간불입니다.                      */
    const now = document.querySelector('.tz-hc') || document.querySelector('.hm-now');
    const out = { closed: H(), nowTop: now ? Math.round(now.getBoundingClientRect().top) : -1,
                  vh: window.innerHeight };
    const folds = [].slice.call(document.querySelectorAll('.hm-fold'));
    /* ★ <b>최상위 접이만</b> 셉니다. 「오늘 챙길 것」 안의 🌅 아침 미션은
       그 칸의 일부라 그대로 있고, 그것까지 세면 옮기고도 빨간불입니다 (8번). */
    const hmPane = document.querySelector('.tab-pane.on');
    out.n = hmPane ? hmPane.querySelectorAll(':scope > .hm-fold').length : folds.length;
    out.heads = folds.map(f => (f.querySelector('.hm-fold-h') || {}).textContent
      ? f.querySelector('.hm-fold-h').textContent.replace(/\s+/g, ' ').trim() : '');
    out.allClosed = folds.every(f => (f.querySelector('.hm-fold-b') || {}).hidden === true);
    /* ⚠ 2026-09-26 · <b>홈의 큰 접이는 없어졌습니다.</b> 사장님 말씀대로
       달력·내 고객·TFA·SNS·관리를 <b>제 화면</b>으로 옮겼습니다. 접을 것이
       없으니 「접혀 있나」 를 여기서 재면 헛것입니다 (8번).
       ★ <b>지운 것이 아닙니다</b> — 대신 「📦 여기로 옮겼습니다」 한 줄이
         있고, 눌러서 가지는지·손가락에 닿는지를 여기서 봅니다.
         「거기서 실제로 서나」 는 check-homeshape 와 smoke 가 봅니다. */
    const mv = document.querySelector('.hm-mv');
    out.mv = !!mv;
    out.mvH = mv ? Math.round(mv.getBoundingClientRect().height) : 0;
    const bs = mv ? [].slice.call(mv.querySelectorAll('button')) : [];
    out.mvN = bs.length;
    out.mvSmall = bs.filter(e => e.getBoundingClientRect().height < 44).length;
    if (bs.length) {
      bs[0].click();
      out.mvWent = (typeof lastTab !== 'undefined') ? lastTab : '';
      try { go('home'); } catch (e) {}
    }
    return out;
  }, SEED);
  is(HM.nowTop >= 0 && HM.nowTop < HM.vh,
    '<b>「오늘 할 일」 이 첫 화면 안</b>에 있다 — 위에서 ' + HM.nowTop + 'px (화면 ' + HM.vh + 'px)');
  is(HM.n === 0, '홈에 <b>접을 큰 카드가 없다</b> — ' + HM.n + '개 (제 화면으로 옮겼습니다)');
  is(HM.mv === true, '<b>「여기로 옮겼습니다」 한 줄</b>이 있다 — ' + HM.mvH + 'px');
  is(HM.mvN >= 5, '<b>어디로 갔는지</b> 하나하나 적는다 — ' + HM.mvN + '군데');
  is(HM.mvSmall === 0, '옮긴 자리 단추도 <b>44px 아래가 없다</b>' + (HM.mvSmall ? (' ← ' + HM.mvSmall + '개') : ''));
  is(!!HM.mvWent && HM.mvWent !== 'home', '누르면 <b>그 화면으로 간다</b> — ' + HM.mvWent);
  is(HM.mvH <= 120, '안내는 <b>한 줄</b>이다 — ' + HM.mvH + 'px');
  is((HM.heads || []).every(h => !/NaN|undefined|null/.test(h)),
    '접힌 머리에 <b>부서진 숫자가 없다</b> — ' + (HM.heads || []).join(' / '));

  console.log('\n[아래 탭바] 엄지가 늘 닿는 자리');
  const TBR = await page.evaluate((seed) => {
    (0, eval)(seed); try { go('home'); } catch (e) {}
    const bar = document.getElementById('tabBar');
    const out = { has: !!bar };
    if (!bar) return out;
    out.shown = getComputedStyle(bar).display !== 'none';
    const btns = [].slice.call(bar.querySelectorAll('.tb-b'));
    out.n = btns.length;
    out.labels = btns.map(e => e.textContent.replace(/\s+/g, ' ').trim());
    out.h = Math.round(bar.getBoundingClientRect().height);
    out.small = btns.filter(e => e.getBoundingClientRect().height < 44).length;
    out.onHome = btns.filter(e => e.classList.contains('on')).map(e => e.textContent.trim());
    const by = t => btns.filter(e => e.textContent.indexOf(t) >= 0)[0];
    if (by('고객')) { by('고객').click(); out.went = lastTab; out.onCli = btns.filter(e => e.classList.contains('on')).length; }
    /* ⚠ 2026-09-24 · 「더보기 ☰」 가 <b>「도구 🧰」</b> 로 바뀌었습니다(명세서 이름).
       ⚠ 2026-09-26 · 그리고 이제 <b>서랍이 아니라 화면</b>을 엽니다 — 목업의
          「도구」 는 밝은 화면입니다. ★ <b>서랍 길은 안 지웠습니다</b> — 그 화면
          맨 아래 「☰ 메뉴 전체」 로 그대로 엽니다. 그래서 여기서는 둘을 같이
          봅니다 — 화면이 서는가, 그리고 <b>길이 살아 있는가</b> (1번).      */
    if (by('도구')) {
      by('도구').click();
      out.tools = lastTab;
      out.moreBtn = !!document.querySelector('#dynPane .tlp-more');
    }
    try { go('home'); } catch (e) {}
    out.pad = parseInt(getComputedStyle(document.getElementById('main')).paddingBottom, 10) || 0;
    return out;
  }, SEED);
  is(TBR.has && TBR.shown, '폰에서 <b>아래 탭바가 선다</b>' + (TBR.h ? (' — 높이 ' + TBR.h + 'px') : ''));
  is(TBR.n >= 4, '칸이 <b>넷 이상</b> 있다 — ' + (TBR.labels || []).join(' | '));
  is(TBR.small === 0, '탭바 칸도 <b>44px 아래가 없다</b>' + (TBR.small ? (' ← ' + TBR.small + '개') : ''));
  is((TBR.onHome || []).length === 1 && /오늘/.test((TBR.onHome || [''])[0]),
    '<b>지금 화면</b>이 켜져 있다 — ' + (TBR.onHome || []).join(','));
  is(TBR.went === 'clients' && TBR.onCli === 1,
    '누르면 <b>그 화면으로</b> 가고 켜진 칸도 따라온다 — ' + TBR.went);
  is(TBR.tools === 'tools' && TBR.moreBtn === true,
    '「도구」 가 <b>밝은 화면</b>을 열고 ★ <b>서랍 길도 그대로</b>다 (1번) — ' +
    (TBR.tools || '(안 갔습니다)') +
    (TBR.moreBtn ? ' · ☰ 메뉴 전체 있음' : ' ← ☰ 메뉴 전체가 없습니다'));
  is(TBR.pad >= TBR.h, '탭바가 <b>글을 안 덮는다</b> — 바닥 여백 ' + TBR.pad + 'px / 탭바 ' + TBR.h + 'px');
  /* 넓은 화면에서는 <b>안 선다</b> — 왼쪽 기둥이 그대로 있어 두 곳이 된다 */
  const wide = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await wide.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const wp = await wide.newPage();
  await wp.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await wp.waitForTimeout(2000);
  const WIDE = await wp.evaluate(() => {
    const bar = document.getElementById('tabBar');
    return { shown: !!bar && getComputedStyle(bar).display !== 'none',
             pad: parseInt(getComputedStyle(document.getElementById('main')).paddingBottom, 10) || 0 };
  });
  is(!WIDE.shown, '<b>넓은 화면에서는 안 선다</b> — 왼쪽 기둥이 있는데 아래에 또 세우면 같은 것이 두 곳이 된다 (5번)');
  is(WIDE.pad === 0, '넓은 화면에서는 <b>바닥 여백도 안 준다</b> — ' + WIDE.pad + 'px');
  await wide.close();

  /* ── <b>네 화면만 재는 자는 네 화면만 지킨다</b> ──────────────────
     1단계에서 「작은 글자 0」 이라고 적었습니다. 그것은 <b>여기 네 화면에
     보이던 글자</b>에 대해서만 참이었습니다. 앱에는 화면이 <b>여든여덟</b>
     개고, 나머지 여든넷에는 알람이 없었습니다 — 5단계에서 자를 고쳐 목록에
     자료를 심자마자 12.5px 가 셋 튀어나온 것이 그 증거입니다.
     그래서 <b>모든 화면</b>을 한 번 훑습니다. 한 화면씩 기준선을 두지
     않습니다 — 화면이 늘 때마다 여기를 고쳐야 해서 곧 낡습니다. <b>전체
     합계</b> 하나만 못 박습니다. */
  console.log('\n[전부] <b>모든 화면</b>에 작은 글자가 없는가 — 네 화면만 지키지 않는다');
  const ALL = await page.evaluate((seed) => {
    (0, eval)(seed);
    const ids = [];
    try { (TABS || []).forEach(g => (g.items || []).forEach(x => { if (x.id && !x.hide) ids.push(x.id); })); } catch (e) {}
    let tiny = 0, total = 0, wide = 0, seen = 0;
    const worst = [];
    for (const t of ids) {
      try { go(t); } catch (e) { continue; }
      const pane = document.getElementById('dynPane');
      if (!pane) continue;
      seen++;
      let n = 0;
      pane.querySelectorAll('*').forEach(e => {
        if (!e.offsetParent) return;
        const c = e.childNodes[0];
        const tx = (c && c.nodeType === 3) ? (c.nodeValue || '').trim() : '';
        if (!tx) return;
        total++;
        if (parseFloat(getComputedStyle(e).fontSize) < 13) { tiny++; n++; }
      });
      if (document.documentElement.scrollWidth > window.innerWidth + 1) wide++;
      if (n) worst.push(t + ':' + n);
    }
    return { tiny, total, wide, seen, worst: worst.slice(0, 6).join(' · ') };
  }, SEED);
  is(ALL.seen >= 80, '화면 <b>' + ALL.seen + '개</b>를 열어 봤다 — 메뉴에서 그대로 뽑는다(손으로 안 적는다)');
  is(ALL.tiny <= ALL_BASE.tiny,
     '<b>13px 아래 글자</b> ' + ALL.tiny + '개 / 보이는 글자 ' + ALL.total + '개 — 기준선 ' + ALL_BASE.tiny +
     (ALL.tiny > ALL_BASE.tiny ? (' ← 늘었습니다: ' + ALL.worst) : ''));
  is(ALL.wide <= ALL_BASE.wide,
     '<b>옆으로 새는 화면</b> ' + ALL.wide + '개 — 기준선 ' + ALL_BASE.wide +
     (ALL.wide > ALL_BASE.wide ? ' ← 늘었습니다' : ''));

  /* ── <b>따로 열리는 세 화면</b> ────────────────────────────────────
     본체(app/index.html) 안의 88개 화면만 재고 있었습니다. 그런데 사장님이
     고객 앞에서 제일 오래 펴 두시는 것은 <b>따로 열리는 화면</b>입니다 —
     재무설계 계산기 · 보장 전·후 만들기 · DB 통합 CRM. 이 셋에는 자가
     <b>한 번도 닿은 적이 없습니다.</b> 처음 재 보니 —
       계산기 226자 중 <b>178</b> · 전·후 589자 중 <b>559</b> · CRM 63자 중 <b>16</b>
     이 13px 아래였습니다. 본체보다 훨씬 나빴습니다.                      */
  console.log('\n[따로] <b>따로 열리는 세 화면</b>도 읽히는가');
  for (const F of SOLO) {
    const sp = await ctx.newPage();
    await sp.goto('http://127.0.0.1:' + PORT + F.url, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await sp.waitForTimeout(1800);
    const r = await sp.evaluate(() => {
      /* DB 통합 CRM 은 설정 화면이 먼저 선다 — 본 화면을 열어야 잴 수 있다 */
      try { const g = document.getElementById('configScreen');
            if (g) { g.classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); } } catch (e) {}
      let tiny = 0, total = 0;
      document.body.querySelectorAll('*').forEach(e => {
        if (!e.offsetParent) return;
        const c = e.childNodes[0];
        const tx = (c && c.nodeType === 3) ? (c.nodeValue || '').trim() : '';
        if (!tx) return;
        total++;
        if (parseFloat(getComputedStyle(e).fontSize) < 13) tiny++;
      });
      return { tiny, total, wide: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
    });
    await sp.close();
    is(r.tiny <= F.tiny,
       '<b>' + F.t + '</b> — 13px 아래 ' + r.tiny + '개 / 보이는 글자 ' + r.total +
       ' · 기준선 ' + F.tiny + (r.tiny > F.tiny ? ' ← 늘었습니다' : ''));
    /* 9단계 — 이 셋은 폰에서 <b>옆으로 샜습니다</b>(519px · 1108px). 격자 칸의
       바닥을 0 으로 내리고 표를 카드로 접어 셋 다 섰습니다. 되돌아가면 여기서 걸립니다. */
    is(!r.wide, '<b>' + F.t + '</b> — 폰에서 <b>옆으로 안 샌다</b>' + (r.wide ? ' ← 샙니다' : ''));
  }

  console.log('\n[전체] 규약을 쓰고 있나 — CSS 를 글자로 본다');
  const APP = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const BL = APP.match(/<style[\s\S]*?<\/style>/g) || [];
  /* ★ <b>앱의 붙박이 CSS 두 블록만</b> 셉니다. 나머지 <style> 은 제안서·
     보고서처럼 <b>새 창에 띄우는 문서</b>라 :root 가 없습니다 — 거기에
     토큰을 넣으면 값이 통째로 사라집니다. 손댈 수 없는 것을 세면
     숫자가 안 내려가고, 안 내려가는 숫자는 사람이 곧 안 믿습니다 (8번). */
  const css = (BL[0] || '') + (BL[1] || '');
  /* <b>직접 적은</b> 것만 셉니다 — var(…) 는 이미 계단을 쓰는 것입니다.
     none · inset · 「0 0 0 Npx」(눌렀을 때 생기는 <b>테두리 고리</b>)는
     그림자가 아니라 테두리라 계단 밖입니다. */
  const rawShadow = new Set((css.match(/box-shadow:\s*[^;}"']+/g) || [])
    .map(x => x.split(/:(.+)/)[1].trim())
    .filter(v => !/^var\(|^none$|^inset|^0 0 0 /.test(v)));
  const rawRadius = new Set((css.match(/border-radius:\s*[0-9.]+px[^;}"']*/g) || [])
    .map(x => x.split(/:(.+)/)[1].trim()));
  /* 여러 값짜리(「22px 22px 0 0」 · 「4px 16px 16px 16px」)는 <b>모양이 뜻</b>입니다 —
     바텀시트 윗모서리 · 말풍선 꼬리. 토큰 하나로 못 적습니다. */
  const multi = [...rawRadius].filter(v => /\s/.test(v));
  const single = [...rawRadius].filter(v => !/\s/.test(v));
  const SHADOW_BASE = 0, RADIUS_BASE = 0;   /* 4단계에서 0 으로 내렸습니다 */
  is(rawShadow.size <= SHADOW_BASE,
    '<b>직접 적은 그림자</b>가 ' + rawShadow.size + '가지 — 기준선 ' + SHADOW_BASE +
    ' (계단: --shadow-xs·sm·기본·md·lg·blue)' +
    (rawShadow.size ? (' ← ' + [...rawShadow][0].slice(0, 46)) : ''));
  is(single.length <= RADIUS_BASE,
    '<b>직접 적은 둥글기</b>가 ' + single.length + '가지 — 기준선 ' + RADIUS_BASE +
    ' (계단: --r-xs·sm·기본·md·lg·pill)' + (single.length ? (' ← ' + single.join(' ')) : ''));
  is(multi.length <= 2,
    '여러 값짜리는 <b>' + multi.length + '가지</b>만 남았다 — ' + multi.join(' / ') +
    ' (바텀시트 윗모서리 · 말풍선 꼬리 — 모양이 뜻이라 토큰으로 못 적는다)');
  /* 토큰이 <b>있기는 한가</b> — 없으면 위 두 줄이 무슨 말인지 알 수 없다 */
  is(/--r-xs:/.test(css) && /--shadow-xs:/.test(css) && /--primary:/.test(css),
    '색·둥글기·그림자 <b>토큰이 한 곳</b>에 있다 (:root)');

  is(errs.length === 0, '재는 동안 터진 곳이 없다' + (errs.length ? (' ← ' + errs[0]) : ''));

  await ctx.close(); await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad
    ? ('✗ ' + bad + '개 — 폰에서 전보다 나빠진 자리가 있습니다')
    : '✓ 폰에서 읽히고 · 손이 닿고 · 옆으로 안 샙니다 (기준선 안쪽)');
  console.log('  기준선은 scripts/check-toss.js 의 BASE 입니다 — 좋아지면 손으로 내려 주십시오.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
