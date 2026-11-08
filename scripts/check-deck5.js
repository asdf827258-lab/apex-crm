/* 🎬 <b>발표덱 다섯 갈래 전부 — 한 쪽에 한 가지인가.</b>

   사장님 말씀 (2026-11-05) 「<b>응 나머지 트랙도 전부 같이 쪼개줘</b>」 — <b>판 X338</b>.
   ⚠ 처음에는 X335 로 적었는데, CI 를 도는 사이 다른 세션들이 먼저 main 에 들어가
     X335·X336 을, 그 다음 X337 까지 가져갔습니다. 먼저 병합한 쪽이 이기므로
     제 번호를 <b>두 번</b> 밀었습니다 — X335 → X337 → X338 (11번 ③).
   앞서 교육자금만 쪼갰더니(판 X334) 나머지 넷이 이랬습니다 — 1440×900 발표 모드:

       ₩ 연금        13장 · 제일 넘치는 쪽 <b>+5,930px</b> (계산 장 하나가 화면 일곱)
       $ 달러        10장 · <b>+3,510px</b>
       📈 투자·세금    9장 · <b>+1,413px</b>
       🏢 일시납·쿠폰  12장 · <b>+1,765px</b>
       🎓 교육자금     15장 · +378px   ← 이미 쪼갠 것

   고객 앞에서 한 장을 일곱 번 긁어내렸다는 뜻입니다.

   여기서 못 박는 것은 이렇습니다.

     1. ★ 다섯 갈래 <b>전부</b> 제일 넘치는 쪽이 <b>400px 안</b>이다 —
        한 번 내리면 끝입니다. 이 수를 묻는 곳은 <b>여기 하나뿐</b>입니다
        (check-edudeck 은 이 수를 안 셉니다 · CLAUDE.md 5번).
     2. ★★ <b>쪽이 진짜로 보인다.</b> 닫기 줄을 잘못 맞춰 장이 다른 장 안에
        들어가면, 발표에서 그 쪽은 <b>안 보이는데</b> 「안 넘친다」 로 읽힙니다.
        실제로 이 판을 만들다 그 함정에 빠질 뻔했습니다 — 그래서 쪽마다
        <b>높이가 120px 이상</b>인지 봅니다. 안 울리는 알람은 알람이 아닙니다 (8번).
     3. 차례(DECK)에 적힌 id 가 <b>다 정말 있는 장</b>이다 — 없는 id 를 적으면
        그 쪽이 <b>조용히 빠집니다</b> (쿠폰 트랙이 두 번 그렇게 사라졌습니다).
     4. ★★ <b>계산기를 안 건드렸다</b> — 네 갈래의 셈하는 칸 이름이 다 그대로
        있고, 값이 그 자리에 <b>실제로 찍힙니다.</b> 장만 갈랐습니다.
     5. 쪼갠 뒤에도 <b>장 수가 전보다 많다</b> — 쪼갠다고 해 놓고 글을 버리면
        장 수가 줄어듭니다.
     6. 콘솔에 <b>터진 자리</b>가 없다.
    13. ★★ <b>노트북 발표가 강렬하다.</b> 사장님 말씀 (2026-11-05)
        「<b>우선 강렬하게 만들어줘</b>」 · 「<b>우선 노트북으로 보이니까,
        노트북 위주면 된다</b>」 — 제목이 <b>46px</b> 이라 문서처럼 읽히고
        한 방이 없었습니다. 1440px 에서 <b>60px</b> 로 올리고, 짧은 쪽은
        <b>세로 가운데</b>로 세웁니다(위로 쏠려 「글이 모자란 문서」 같았습니다).
        ★ 제목에 쓴 자리는 <b>여백에서 되찾아</b> 넘침 눈금(400px)을 안 올렸습니다.
        ★ 내용이 창보다 긴 쪽은 <b>위가 잘리면 안 됩니다</b> — 제목이 사라집니다.
        ★★ <b>제가 더 나쁘게 만든 자리가 있었습니다.</b> 전·후를 나란히 놓고 보니
        제목을 키우자 <b>낱말 가운데서</b> 잘렸습니다 — 「다릅니 / 다.」 「일입니 / 다」.
        고치기 전 1개였던 것이 <b>10개</b>로 늘었습니다. 숫자만 보고 있었으면 못 봤습니다.
        `word-break:keep-all`(한글은 띄어쓰기에서만 자름) + `text-wrap:balance` 로
        <b>0개</b>가 되었습니다 — 고치기 전보다도 적습니다.
        ⚠ 이 수는 <b>글꼴 CDN 을 막은 채</b> 잰 것이라 사장님 화면보다 깁니다.
        진짜 글꼴을 받아 다시 재면 <b>키우기 전 0개 · 키우니 3개</b>(dcalc4 「까?」 ·
        cp2 「니다」 · cpmoney 「집니다」) <b>· 고친 뒤 0개</b> 였습니다. 수는 다르지만
        <b>고객 앞에서 깨지던 것은 진짜</b>였습니다 (1번).
     11. ★★ <b>폰에서 발표 띠가 화면 안에 있고 단추가 44px 이다.</b> 사장님 말씀
        (2026-11-05) 「<b>폰에서도 확인해줘</b>」 — 390px 화면에서 띠가 <b>482px</b>
        였습니다. 왼쪽 「‹」 와 오른쪽 「✕ 종료」 가 잘려 <b>앞으로도 못 가고
        끝낼 수도 없었습니다.</b> 단추도 35px 로 앱이 지키는 44px 에 못 미쳤습니다.
    12. 폰에서 <b>세 화면을 넘는 쪽</b>이 늘지 않는다 — 지금 <b>9장</b>입니다
        (92장 중 88%는 한 번만 내리면 끝). 폰은 세로라 칸이 둘·셋인 격자가
        한 줄로 접혀 2~3배가 됩니다. ★ 이 수는 <b>줄이면 같이 내립니다</b>.
    10. ★★ <b>책(스크롤) 보기에서 고른 갈래의 장만 보인다.</b> 사장님 말씀
        (2026-11-05) 「<b>응 그것도 고쳐줘</b>」 — 달러를 고르셨는데 국민연금·
        공무원연금 장이 그대로 서 있었습니다. 그 아홉 장이 #trackW 가 열리기
        <b>전</b>에 놓여 있어 갈래를 바꿔도 안 숨었습니다(사이에 모두가 쓰는
        「답은 세 갈래」 가 끼어 있어 한 칸으로 못 묶습니다). 이름표(.wonly)를
        달고 go() 한 자리에서 같이 끕니다. ★ [9] 는 <b>어디에 놓였나</b>를,
        이 자는 <b>갈래를 바꾸면 정말 숨나</b>를 묻습니다 — 다른 물음입니다.
     9. ★★ <b>차례의 장이 제 트랙 칸 안에 있다.</b> [7] 은 「트랙 안 장이 차례에
        있나」 만 물었지 그 <b>반대</b>를 안 물었습니다. 쪼개면서 닫기 줄을 하나 더
        두면 <b>트랙 칸이 일찍 닫혀</b> 뒤따르는 장들이 칸 밖으로 밀려납니다 —
        발표는 멀쩡해 보이는데 <b>트랙 글을 통째로 읽는 자</b>(check-coupon 의
        「세무 자문이 아닙니다」)가 그 글을 못 찾습니다. 실제로 이 판에서
        tfund3·cpcalc3 꼬리가 그래서 tsum·tclose·cp5·cp6 을 밖으로 밀어냈고,
        <b>세금 단서가 트랙에서 사라졌습니다.</b> 이 자가 그걸 놓쳐 CI 에서 잡혔습니다.
     8. ★★ <b>발표 중에 인쇄해도 긴 표가 안 잘린다.</b> 표를 쪽 안에서 굴리게
        했더니(.tw-long), 발표 중에 그대로 인쇄하면 522px 만 찍히고 나머지
        1,191px 이 <b>종이에서 사라졌습니다.</b> 화면에서만 굴립니다 (4-1).
     7. ★★ <b>track 안에 있는 장은 차례에 다 있다.</b> 장을 만들어 두고 차례에
        안 적으면 그 쪽은 <b>조용히 안 나옵니다</b> — 되돌려 보니 [1]~[6] 이
        그것을 못 봤습니다(차례에서 calc2~calc8 을 빼도 전부 초록이었습니다).
        일부러 뺀 것은 <b>여기 이름으로</b> 적어 둡니다 — erg(설계사용 지역 표 ·
        판 X334)와 ecalc(설계사용 조건 입력 폼 · 판 X382) 둘입니다.

   ★ 되돌려 보았습니다 (8번) — 넷을 깨뜨려 보고 전부 울었습니다:
     ⓐ 차례에서 calc2~calc8 빼기 → [7] 이 「차례에 없는 장 7」 로 울음
       (처음에는 ⓐ 가 <b>안 울었습니다</b> — 그래서 [7] 을 보탰습니다)
     ⓑ 닫기 줄을 한 줄 지워 장이 장 안에 들어가게 → [2] 가 「안 보이는 쪽」 으로 울음
     ⓒ 차례에 없는 id 적기 → [3] 이 울음
     ⓓ .wonly 이름표를 떼기 → [10] 이 「아직 보이는 것 9」 로 울음 (판 X339)
     ⓔ 폰 띠 규칙을 빼기 → [11] 이 「482px / 창 390px」 로 울음 (판 X342)
     ⓖ keep-all·balance 를 빼기 → [13] 이 「낱말 가운데서 잘린 제목 10/92」 로 울음 (판 X345)
     ⓗ ★★ <b>CI 기계에서만</b> 달러 갈래 switch 가 <b>+411px</b> 였습니다 (판 X354) —
       제 기계에서는 341px 이라 안 보였습니다. CI 의 기본 글꼴이 더 넓어 글 많은 쪽만
       길어집니다(다른 네 갈래는 CI 와 제 기계가 <b>한 픽셀도 안 달랐습니다</b>).
       <b>눈금을 안 올리고</b> 타임라인을 switch1b 로 쪼갰습니다 — 달러 341 → <b>330px</b>,
       폰에서 세 화면 넘는 쪽도 11 → <b>10장</b>.
     ⓕ 노트북 제목·가운데 규칙을 빼기 → [13] 의 <b>셋이 다</b> 울음 (판 X345) —
       「제목 54px」 · 「자리 남는 쪽 6/92」 · 「6쪽 전부 가운데 아님」.
       `margin:auto` 만 떼어도 울립니다 — 떼면 `.wrap` 이 늘어나 남는 자리가 40→5 쪽.
       위만 0 으로 하면 40쪽 중 가운데가 <b>1쪽</b>으로 떨어집니다.  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/상담자료/통합상담_APEX.html';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  /* 📰 <b>뉴스 칸이 부르는 자리</b>에 빈 답을 둡니다 (판 X383).
     ⚠ 이 자는 전에 쪽이 <b>떠오르는 동안</b> 재느라 120ms 만에 다음 쪽으로 넘어갔고,
       그래서 뉴스 칸의 요청이 <b>날아가기 전에</b> 창이 닫혔습니다. 뜸(420ms)을
       기다리게 하자 요청이 실제로 나가 <b>우리 서버 404</b> 가 찍혔습니다 —
       앱이 고장 난 것이 아니라 <b>견본 서버에 그 자리가 없던 것</b>입니다.
     ★ 바깥(진짜 서버)은 <b>한 번도 안 부릅니다</b> (7번 · 10번) — 여기서 빈 목록으로
       답하고 끝냅니다. 기사를 지어내지 않습니다 (1번 · 9번). */
  if (p === '/api/market') {
    rs.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    rs.end(JSON.stringify({ ok: true, items: [] }));
    return;
  }
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 한 번 내리면 끝 — 그 선 */
const 넘침선 = 400;
/* ★★ <b>끝에 수를 한 줄로 남깁니다</b> (판 X345 · 2026-11-05).
   CI 는 자의 <b>마지막 40줄만</b> 로그에 남기는데, 이 자는 60줄이 넘어
   <b>[1] 넘침</b>처럼 앞쪽에서 운 줄이 로그에 안 남았습니다. 실제로 이 판에서
   두 번 울었는데 까닭을 못 봤습니다 — 울리기만 하고 무엇이 울었는지를
   안 알려 주면 반쪽입니다 (8번). run-checks 쪽도 같이 고쳤습니다. */
const 넘침표 = [];
const 끝수 = { 제목: 0, 가운데: 0, 남는쪽: 0, 흩날림: 0, 폰셋: 0 };
/* 쪽이 정말 섰는지 — 이보다 낮으면 「안 보이는 쪽」 으로 봅니다 */
const 보임선 = 120;
/* ★ <b>일부러</b> 고객 발표에서 뺀 장 (판 X334) — 설계사용 229개 시·군·구
   지역 표입니다. 화면에는 그대로 있어 스크롤로 씁니다 (6번 · 길을 안 지웁니다). */
/* ★ <b>고객 앞에 안 세우기로 한 장</b>만 여기 적습니다 — 여기 적지 않으면 [7] 이
   「차례에서 조용히 빠진 장」 으로 웁니다(쿠폰 트랙이 두 번 그렇게 사라졌습니다).
     · erg   설계사용 지역 표 — 229개 시·군·구 (판 X334)
     · ecalc 설계사용 <b>조건 입력 폼</b> — 자녀 나이·지역·상품·환율 슬라이더 (판 X382).
             발표 중에는 「⚙ 조건」 단추로 떠서 열립니다 — check-edudeck [8] 이
             그 단추가 <b>죽은 단추가 아닌지</b>까지 봅니다. */
const 일부러뺀장 = { e: ['erg', 'ecalc'] };
/* ★ <b>트랙 칸 바깥에 있어도 되는 장</b> — 고치기 전부터 그랬던 자리입니다.
   · close 는 다섯 갈래가 같이 쓰는 마지막 장이라 칸 밖에 한 번만 섭니다.
   · 연금의 hero·gap·nps·gongmu·math·time·faq 는 #trackW 가 열리기 <b>전</b>에
     놓여 있습니다. 제가 만든 것이 아니고(main 에서도 같습니다), 책(스크롤)
     보기에서 다른 갈래를 골라도 이 장들이 보이는 까닭이기도 합니다.
     따로 여쭙고 고칠 자리라, 지금은 <b>늘어나지만 않게</b> 못 박아 둡니다. */
/* ★ 갈래를 바꿔도 <b>서 있어도 되는</b> 장 — 모두의 것입니다.
   · hero  : 책 보기의 <b>유일한 제목 카드</b>입니다. 갈래별 표지(.pcover)는
             발표에서만 서므로, 이것까지 숨기면 다른 갈래는 머리가 없어집니다.
   · close : 다섯 갈래가 같이 쓰는 마지막 장입니다(차례마다 들어 있습니다). */
const 갈래넘어서도되는장 = ['hero', 'close'];
/* 폰 — 사장님이 고객 앞에서 꺼내 보이는 크기 */
const 폰 = { width: 390, height: 844 };
/* ★ 폰에서 <b>세 화면을 넘는 쪽</b>의 수. 2026-11-05 에 11장이었습니다.
   늘면 빨간불이고, 줄이면 이 수도 같이 내립니다 (CLAUDE.md 0-1). */
const 폰세화면 = 7;    /* 판 X383 — 교육자금 계산 장 넷을 쪼개 9 → 7. 앞서 판 X382 — 교육자금 조건 입력 폼(ecalc)을 고객 앞에서 빼며 10 → 9.
                          앞서 판 X354 에서 switch 를 쪼개 11 → 10 이었습니다.
                          ★ 줄었으니 눈금도 같이 내립니다 (CLAUDE.md 0-1) */
const 칸밖이어도되는장 = {
  w: ['hero','gap','nps','nps2','gongmu','gongmu2','math','math2','time','faq','close'],
  d: ['close'], t: ['close'], e: ['close'], c: ['close']
};

/* ⚠ 교육자금은 판 X382 에서 <b>14장</b>이 됐습니다 — 조건 입력 폼(ecalc)을
   고객 앞에서 뺐습니다. 넘침도 같이 줄었습니다(+349 → +194px). */
const 갈래 = {
  w: { 이름:'₪ 연금'.replace('₪','₩'), 전장:13, 전넘침:5930,
       칸:['resHero','ladder','accumCard','varCard','deathCard','gmCard'] },
  d: { 이름:'$ 달러',      전장:10, 전넘침:3510,
       칸:['dFxBar','resBox','decompBox','fullTable'] },
  t: { 이름:'📈 투자·세금', 전장:9,  전넘침:1413, 칸:[] },
  /* ★ 교육자금만 <b>제 눈금</b>이 있습니다 (판 X383 · 사장님 말씀 「넘치는 계산 장
     넷도 쪼개서 해줘」). 재어 보니 <b>18쪽 전부가 창 안</b>에 들어옵니다(+0px).
     ⚠ 그렇다고 눈금을 <b>0 으로 두지 않습니다</b> — CI 의 기본 글꼴이 더 넓어
       글 많은 쪽이 제 기계보다 길어집니다(판 X354 에서 달러가 제 기계 341 ·
       CI 411 이었습니다). 0 으로 두면 <b>CI 에서만 빨간불</b>이 납니다.
       <b>120px</b> — 오늘 잰 값(0)에서 넉넉히 떨어뜨리되 공통선(400)보다 훨씬
       낮게 두어, 되돌아가면 그 자리에서 울게 합니다 (0-1번 · 8번). */
  e: { 이름:'🎓 교육자금',  전장:6,  전넘침:2969, 선:120,
       칸:['eRes','eMonBox','eWhenBox','eSplit'] },
  c: { 이름:'🏢 일시납·쿠폰', 전장:12, 전넘침:1765,
       칸:['cpFxBar','cpRes'] }
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });

  /* 사장님 <b>진짜 서버</b>는 한 번도 안 건드립니다 — 우리 자리만 엽니다 */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1:' + PORT) || u.startsWith('http://localhost:' + PORT))
      return r.continue();
    return r.abort();
  });

  const pg = await ctx.newPage();
  const 터짐 = [];
  pg.on('pageerror', e => 터짐.push(e.message.slice(0, 110)));
  /* ★ <b>net::ERR_FAILED 는 우리가 막은 것</b>입니다 — 이 자는 바깥(글꼴 CDN 등)을
     한 번도 안 건드립니다(CLAUDE.md 10번). 그래서 그 하나만 셈에서 뺍니다.
     우리 서버의 404 는 다른 글("status of 404")이라 그대로 잡힙니다.
     ⚠ 그 탓에 <b>글꼴이 기본으로 떨어진 채</b> 재므로, 여기 적힌 넘침은
       사장님 화면(Pretendard 가 실리는)보다 <b>길게</b> 나옵니다 — 안전한 쪽입니다. */
  pg.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/net::ERR_FAILED/.test(t)) return;
    터짐.push(t.slice(0, 110));
  });

  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE.split('/').map(encodeURIComponent).join('/'),
                { waitUntil: 'load' });
  await pg.waitForTimeout(1600);

  /* 차례는 <b>파일에서</b> 읽습니다 — DECK 은 모듈 안 const 라 창 밖에서 못 봅니다 */
  const src = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
  const 차례 = {};
  for (const k of Object.keys(갈래)) {
    const m = src.match(new RegExp('\\n\\s*' + k + ':\\[([^\\]]*)\\]'));
    차례[k] = m ? (m[1].match(/'[^']+'/g) || []).map(s => s.slice(1, -1)) : null;
  }

  head('[1] ★ 다섯 갈래 전부 — 제일 넘치는 쪽이 <b>' + 넘침선 + 'px 안</b>');
  const 잰것 = {};
  for (const k of Object.keys(갈래)) {
    const g = 갈래[k];
    const r = await pg.evaluate(async k => {
      window.__go(k); presEnter();
      const L = presList(), out = [];
      /* ⚠⚠ <b>떠오르는 동안 재면 14px 이 더 잡힙니다</b> (판 X383).
         쪽이 바뀔 때 @keyframes pfade 가 <b>translateY(14px)</b> 에서 시작하는데,
         그 동안은 문서가 그만큼 길어 보입니다. 기다리지 않고 재던 탓에 이 자는
         <b>한 쪽도 안 넘치는 갈래까지 「창 넘는 쪽 14/14」</b> 라고 적고 있었습니다 —
         수가 거짓이면 사람이 자를 안 믿게 됩니다 (8번). 뜸이 끝난 뒤에 잽니다. */
      const 뜸 = () => new Promise(r => setTimeout(r, 420));
      for (let i = 0; i < L.length; i++) {
        presGo(i);
        await 뜸();
        const de = document.documentElement;
        const el = L[i], q = el.getBoundingClientRect();
        out.push({ id: el.id || '?', 넘침: Math.max(0, de.scrollHeight - de.clientHeight),
                   높이: Math.round(q.height),
                   보임: getComputedStyle(el).display !== 'none' });
      }
      if (typeof presExit === 'function') presExit();
      return out;
    }, k);
    잰것[k] = r;
    let 제일 = 0, 누구 = '', 넘 = 0;
    r.forEach(x => { if (x.넘침 > 8) { 넘++; if (x.넘침 > 제일) { 제일 = x.넘침; 누구 = x.id; } } });
    넘침표.push(k + ' ' + 제일 + (누구 ? ('(' + 누구 + ')') : ''));
    const 선 = (g.선 != null) ? g.선 : 넘침선;
    is(제일 <= 선,
       '  ' + g.이름 + ' — ' + r.length + '장 · 창 넘는 쪽 ' + 넘 + '/' + r.length +
       ' · 제일 <b>+' + 제일 + 'px</b>' + (누구 ? (' (' + 누구 + ')') : '') +
       ' — 고치기 전 +' + g.전넘침 + 'px' + (g.선 != null ? (' · 이 갈래 눈금 ' + g.선) : ''));
  }

  head('[2] ★★ 쪽이 <b>진짜로 보인다</b> — 장이 장 안에 들어가면 조용히 사라집니다');
  for (const k of Object.keys(갈래)) {
    const 안보임 = 잰것[k].filter(x => !x.보임 || x.높이 < 보임선);
    is(안보임.length === 0,
       '  ' + 갈래[k].이름 + ' — 안 보이거나 ' + 보임선 + 'px 밑인 쪽 ' + 안보임.length +
       (안보임.length ? (' ← ' + 안보임.slice(0, 4).map(x => x.id + '(' + x.높이 + 'px)').join(' / ')) : ''));
  }

  head('[3] 차례에 적힌 id 가 <b>다 정말 있는 장</b>이다');
  for (const k of Object.keys(갈래)) {
    is(!!차례[k], '  ' + 갈래[k].이름 + ' — 차례(DECK.' + k + ')를 읽었다');
    if (!차례[k]) continue;
    const 없 = await pg.evaluate(ids => ids.filter(i => !document.getElementById(i)), 차례[k]);
    is(없.length === 0,
       '  ' + 갈래[k].이름 + ' — ' + 차례[k].length + '개 중 없는 장 ' + 없.length +
       (없.length ? (' ← ' + 없.join(', ')) : ''));
  }

  head('[4] ★★ <b>계산기를 안 건드렸다</b> — 칸이 그대로 있고 값이 찍힌다');
  for (const k of Object.keys(갈래)) {
    const 칸 = 갈래[k].칸;
    if (!칸.length) { console.log('  ' + 갈래[k].이름 + ' — 셈하는 칸이 없는 갈래입니다'); continue; }
    const r = await pg.evaluate(([k, 칸]) => {
      window.__go(k);
      return 칸.map(id => {
        const e = document.getElementById(id);
        return { id: id, 있나: !!e, 글: e ? (e.textContent || '').replace(/\s+/g, '').length : 0 };
      });
    }, [k, 칸]);
    const 없 = r.filter(x => !x.있나).map(x => x.id);
    const 빈 = r.filter(x => x.있나 && x.글 < 10).map(x => x.id);
    is(없.length === 0, '  ' + 갈래[k].이름 + ' — 칸 ' + 칸.length + '개가 다 있다' +
       (없.length ? (' ← 없음: ' + 없.join(', ')) : ''));
    is(빈.length === 0, '  ' + 갈래[k].이름 + ' — 그 칸에 값이 찍혀 있다' +
       (빈.length ? (' ← 비었음: ' + 빈.join(', ')) : ''));
  }

  head('[5] 쪼갠 뒤 장 수가 <b>전보다 많다</b> — 글을 버리면 줄어듭니다');
  for (const k of Object.keys(갈래)) {
    const g = 갈래[k], n = 잰것[k].length;
    is(n > g.전장, '  ' + g.이름 + ' — ' + g.전장 + '장 → <b>' + n + '장</b>');
  }

  head('[7] ★★ track 안에 있는 장은 <b>차례에 다 있다</b> — 안 적으면 조용히 안 나옵니다');
  for (const k of Object.keys(갈래)) {
    if (!차례[k]) continue;
    const 안 = await pg.evaluate(k => {
      const T = document.getElementById('track' + k.toUpperCase());
      if (!T) return null;
      return [].slice.call(T.querySelectorAll('section[id]')).map(s => s.id);
    }, k);
    if (안 === null) { is(false, '  ' + 갈래[k].이름 + ' — track 칸을 못 찾았습니다'); continue; }
    const 봐줌 = 일부러뺀장[k] || [];
    const 고아 = 안.filter(id => 차례[k].indexOf(id) < 0 && 봐줌.indexOf(id) < 0);
    is(고아.length === 0,
       '  ' + 갈래[k].이름 + ' — track 안 장 ' + 안.length + '개 중 차례에 없는 장 ' + 고아.length +
       (고아.length ? (' ← ' + 고아.join(', ')) : '') +
       (봐줌.length ? ('   (일부러 뺀 것: ' + 봐줌.join(', ') + ')') : ''));
  }

  head('[13] ★★ 노트북(1440) 발표가 <b>강렬하다</b> — 제목 · 세로 가운데 · 위가 안 잘림');
  {
    /* ⚠ 「가운데에 서나」를 재는 법을 두 번 틀렸습니다 — 앱이 아니라 자가 틀렸습니다 (8번).
       ① 처음엔 연금 갈래만 봤는데, 그 갈래엔 「자리 남는 쪽」이 0개라 가운데를
          <b>아무것도 안 재고</b> 초록이었습니다. 안 울리는 알람은 알람이 아닙니다.
          그래서 다섯 갈래를 다 봅니다.
       ② 그 다음엔 `document.scrollHeight <= clientHeight` 로 「한 화면에 드는 쪽」을
          골랐는데, `section.pon{min-height:100vh}` 에 아래 여백이 붙어 문서는
          <b>언제나</b> 창보다 깁니다 — 또 0쪽이라 아무것도 못 쟀습니다.
          문서에 묻지 말고 <b>쪽 자신</b>에게 물어야 합니다: 쪽 안쪽 높이에서 `.wrap`
          을 뺀 「남는 자리」가 있으면 그것이 한 화면에 드는 쪽이고, 그런 쪽은
          `margin:auto` 가 그 자리를 위아래로 반씩 나눠 주어야 가운데에 선 것입니다. */
    const r = await pg.evaluate(갈래들 => {
      let 제목 = 0, 잘림 = 0, 가운데 = 0, 남는쪽 = 0, 수 = 0;
      const 쏠린것 = [], 흩날림 = [];
      for (const k of 갈래들) {
        window.__go(k); presEnter();
        const L = presList(); 수 += L.length;
        for (let i = 0; i < L.length; i++) {
          presGo(i); scrollTo(0, 0);
          const s = L[i], q = s.getBoundingClientRect(), cs = getComputedStyle(s);
          const h = s.querySelector('h2') || s.querySelector('h1');
          if (h) 제목 = Math.max(제목, parseFloat(getComputedStyle(h).fontSize));
          if (q.top < -2 || (h && h.getBoundingClientRect().top < 0)) 잘림++;
          if (h) {
            /* 제목이 <b>낱말 가운데서</b> 잘리면 마지막 줄에 글자 한두 개만 남습니다 —
               「다릅니 / 다.」 「일입니 / 다」. 글자마다 자리를 재어 줄로 묶습니다. */
            const 줄 = [];
            (function walk(n) {
              if (n.nodeType === 3) {
                const t = n.nodeValue;
                for (let j = 0; j < t.length; j++) {
                  if (!t[j].trim()) continue;
                  const rg = document.createRange(); rg.setStart(n, j); rg.setEnd(n, j + 1);
                  const z = rg.getBoundingClientRect(); if (!z.height) continue;
                  const y = Math.round(z.top);
                  let v = 줄.find(x => Math.abs(x.y - y) < 6);
                  if (!v) { v = { y: y, 글: '', l: z.left, r: z.right }; 줄.push(v); }
                  v.글 += t[j]; v.l = Math.min(v.l, z.left); v.r = Math.max(v.r, z.right);
                }
              } else [].forEach.call(n.childNodes, walk);
            })(h);
            줄.sort((x, y) => x.y - y.y);
            if (줄.length >= 2) {
              const 넓 = Math.max.apply(null, 줄.map(z => z.r - z.l));
              const 끝 = 줄[줄.length - 1], 끝폭 = 끝.r - 끝.l;
              if (끝폭 < 넓 * 0.22)
                흩날림.push(k + ':' + s.id + ' 「' + 끝.글 + '」 ' + Math.round(끝폭) +
                            'px / 가장 긴 줄 ' + Math.round(넓) + 'px');
            }
          }
          const w = s.querySelector(':scope > .wrap');
          if (!w) continue;
          const pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
          const r2 = w.getBoundingClientRect();
          const 남 = (q.height - pt - pb) - r2.height;   /* 쪽 안쪽에 남는 자리 */
          if (남 <= 40) continue;                        /* 넘치는 쪽 — 나눠 줄 자리가 없다 */
          남는쪽++;
          const 위 = r2.top - (q.top + pt), 아래 = (q.bottom - pb) - r2.bottom;
          if (위 > 남 * 0.35 && Math.abs(위 - 아래) < 24) 가운데++;
          else 쏠린것.push(k + ':' + s.id + ' 남' + Math.round(남) +
                           ' 위' + Math.round(위) + ' 아래' + Math.round(아래));
        }
        if (typeof presExit === 'function') presExit();
      }
      return { 제목: 제목, 잘림: 잘림, 가운데: 가운데,
               남는쪽: 남는쪽, 수: 수, 쏠린것: 쏠린것, 흩날림: 흩날림 };
    }, Object.keys(갈래));
    끝수.제목 = Math.round(r.제목); 끝수.가운데 = r.가운데;
    끝수.남는쪽 = r.남는쪽; 끝수.흩날림 = r.흩날림.length;
    is(r.제목 >= 56, '  제목이 <b>' + Math.round(r.제목) + 'px</b> 이다 (고치기 전 54px — 쪽 제목 h2 는 46px · 56 이상)');
    is(r.잘림 === 0, '  위가 잘린 쪽 ' + r.잘림 + '/' + r.수 +
       ' — 넘치는 쪽도 제목부터 보인다');
    is(r.남는쪽 >= 20, '  자리가 <b>남는 쪽</b>이 ' + r.남는쪽 + '/' + r.수 +
       '쪽 있다 (0쪽이면 가운데를 못 잽니다)');
    is(r.남는쪽 > 0 && r.가운데 === r.남는쪽,
       '  그 ' + r.남는쪽 + '쪽이 <b>전부</b> 세로 가운데에 선다 (위로 안 쏠림)' +
       (r.쏠린것.length ? ('  ← ' + r.쏠린것.slice(0, 4).join(' · ')) : ''));
    is(r.흩날림.length === 0,
       '  제목이 <b>낱말 가운데서 안 잘린다</b> — 마지막 줄에 글자 한두 개만 남은 제목 ' +
       r.흩날림.length + '/' + r.수 + '개 — 제목을 키우기 전 1개 · 키우니 10개로 늘어 고쳤습니다. ' +
       '⚠ 이 자는 글꼴 CDN 을 막아 재므로 사장님 화면보다 길게 잽니다 — 진짜 글꼴로는 0 → 3 → 0 이었습니다' +
       (r.흩날림.length ? ('  ← ' + r.흩날림.slice(0, 5).join(' · ')) : ''));
  }

  head('[11] ★★ 폰(390×844)에서 <b>발표 띠가 화면 안</b>에 있고 단추가 44px 이다');
  {
    const ph = await br.newContext({ viewport: 폰, isMobile: true, hasTouch: true });
    await ph.route('**://**', r => {
      const u = r.request().url();
      if (u.startsWith('http://127.0.0.1:' + PORT) || u.startsWith('http://localhost:' + PORT))
        return r.continue();
      return r.abort();
    });
    const pp = await ph.newPage();
    await pp.goto('http://127.0.0.1:' + PORT + '/' + FILE.split('/').map(encodeURIComponent).join('/'),
                  { waitUntil: 'load' });
    await pp.waitForTimeout(1600);
    const bar = await pp.evaluate(() => {
      window.__go('d'); presEnter(); presGo(2);
      const b = document.querySelector('.pbar');
      if (!b) return null;
      const q = b.getBoundingClientRect();
      const 칸 = [].slice.call(b.querySelectorAll('button')).map(x => {
        const t = x.getBoundingClientRect();
        return { h: Math.round(t.height), 안: t.left >= -1 && t.right <= window.innerWidth + 1 };
      });
      return { 폭: Math.round(q.width), 창: window.innerWidth,
               밖: 칸.filter(x => !x.안).length, 작: 칸.filter(x => x.h < 44).length,
               수: 칸.length };
    });
    is(!!bar, '  발표 띠가 선다');
    if (bar) {
      is(bar.폭 <= bar.창, '  띠가 화면 안이다 — ' + bar.폭 + 'px / 창 ' + bar.창 + 'px (고치기 전 482px)');
      is(bar.밖 === 0, '  화면 밖으로 나간 단추 ' + bar.밖 + '개 (고치기 전 2개)');
      is(bar.작 === 0, '  44px 못 미치는 단추 ' + bar.작 + '/' + bar.수 + '개 (고치기 전 5개)');
    }

    head('[12] 폰에서 <b>세 화면을 넘는 쪽</b>이 ' + 폰세화면 + '장을 안 넘는다');
    let 셋 = 0; const 긴것 = [];
    for (const k of Object.keys(갈래)) {
      const r = await pp.evaluate(k => {
        window.__go(k); presEnter();
        const L = presList(), out = [];
        for (let i = 0; i < L.length; i++) {
          presGo(i);
          const de = document.documentElement;
          out.push({ id: L[i].id, 화면: de.scrollHeight / de.clientHeight });
        }
        if (typeof presExit === 'function') presExit();
        return out;
      }, k);
      r.forEach(x => { if (x.화면 > 2.05) { 셋++; 긴것.push(x.id + '(' + x.화면.toFixed(1) + ')'); } });
    }
    끝수.폰셋 = 셋;
    is(셋 <= 폰세화면, '  세 화면 넘는 쪽 <b>' + 셋 + '장</b> (선 ' + 폰세화면 + ') ← ' +
       긴것.slice(0, 6).join(' / '));
    await ph.close();
  }

  head('[10] ★★ 책 보기에서 <b>고른 갈래의 장만</b> 보인다 (사장님 말씀 「응 그것도 고쳐줘」)');
  for (const k of Object.keys(갈래)) {
    if (!차례[k]) continue;
    const 남의장 = [];
    for (const j of Object.keys(갈래)) {
      if (j === k || !차례[j]) continue;
      for (const id of 차례[j])
        if (차례[k].indexOf(id) < 0 && 갈래넘어서도되는장.indexOf(id) < 0 && 남의장.indexOf(id) < 0)
          남의장.push(id);
    }
    const 샘 = await pg.evaluate(([k, ids]) => {
      window.__go(k);
      return ids.filter(id => {
        const e = document.getElementById(id);
        return e && e.getBoundingClientRect().height > 40 && getComputedStyle(e).display !== 'none';
      });
    }, [k, 남의장]);
    is(샘.length === 0,
       '  ' + 갈래[k].이름 + ' — 남의 갈래 장 ' + 남의장.length + '개 중 <b>아직 보이는 것 ' +
       샘.length + '</b>' + (샘.length ? (' ← ' + 샘.slice(0, 6).join(', ')) : ''));
  }

  head('[9] ★★ 차례의 장이 <b>제 트랙 칸 안</b>에 있다 — 닫기 줄 하나면 글이 통째로 샙니다');
  for (const k of Object.keys(갈래)) {
    if (!차례[k]) continue;
    const 밖 = await pg.evaluate(([k, ids]) => {
      const T = document.getElementById('track' + k.toUpperCase());
      if (!T) return null;
      return ids.filter(id => { const e = document.getElementById(id); return e && !T.contains(e); });
    }, [k, 차례[k]]);
    if (밖 === null) { is(false, '  ' + 갈래[k].이름 + ' — track 칸을 못 찾았습니다'); continue; }
    const 봐줌 = 칸밖이어도되는장[k] || [];
    const 샌것 = 밖.filter(id => 봐줌.indexOf(id) < 0);
    is(샌것.length === 0,
       '  ' + 갈래[k].이름 + ' — 칸 밖으로 샌 장 ' + 샌것.length +
       (샌것.length ? (' ← ' + 샌것.join(', ')) : '') +
       '   (전부터 밖이던 것 ' + 봐줌.length + '개는 봐줍니다)');
  }

  head('[8] ★★ <b>발표 중에 인쇄해도</b> 긴 표가 안 잘린다 (4-1 · 6번)');
  {
    await pg.evaluate(() => {
      window.__go('d'); presEnter();
      const L = presList();
      for (let i = 0; i < L.length; i++) if (L[i].id === 'dcalc5') { presGo(i); break; }
    });
    await pg.emulateMedia({ media: 'print' });
    const r = await pg.evaluate(() => {
      const e = document.querySelector('.tw-long');
      if (!e) return null;
      return { 발표중: document.body.classList.contains('present'),
               보임: Math.round(e.getBoundingClientRect().height),
               속: e.scrollHeight, 잘림: e.scrollHeight > e.clientHeight + 10 };
    });
    await pg.emulateMedia({ media: 'screen' });
    is(!!r && r.발표중, '  발표 중에 인쇄 상태로 들어갔다');
    is(!!r && !r.잘림, '  긴 표가 종이에 <b>전부</b> 나온다 — 보이는 높이 ' +
       (r ? r.보임 : '?') + 'px · 속 ' + (r ? r.속 : '?') + 'px' +
       (r && r.잘림 ? ('  ← ' + (r.속 - r.보임) + 'px 이 사라집니다') : ''));
  }

  head('[6] 콘솔에 터진 자리가 없다 (우리가 막은 바깥 요청은 뺍니다)');
  is(터짐.length === 0, '  터진 자리 ' + 터짐.length +
     (터짐.length ? (' ← ' + 터짐.slice(0, 3).join(' / ')) : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log('잰 수 — 넘침(눈금 ' + 넘침선 + ') ' + 넘침표.join(' · ') +
              ' · 제목 ' + 끝수.제목 + 'px · 가운데 ' + 끝수.가운데 + '/' + 끝수.남는쪽 +
              ' · 낱말 잘린 제목 ' + 끝수.흩날림 + ' · 폰 세 화면 ' + 끝수.폰셋);
  console.log(bad ? ('발표덱 다섯 갈래 점검 — 어긋난 것 ' + bad + '가지')
                  : '발표덱 다섯 갈래 점검 통과 — 다섯 갈래 전부 한 쪽에 한 가지입니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐:', e.message); srv.close(); process.exit(1); });
