/* ══════════════════════════════════════════════════════════════════
   check-clockfree.js — 🕐 <b>자가 시계에 매여 있지 않나.</b>

   ── 왜 ───────────────────────────────────────────────────────────
   2026-10-04 · #520 에서 <b>고친 것이 하나도 없는데</b> CI 가 빨개졌습니다.
   `check-push` 의 한 토막이 「지금 이 순간의 한국 시각」으로 서버를 한 판
   돌리고 있었습니다. 그래서

     · CI 가 <b>16시 59분</b>에 끝나면 — 아침 글이 나가 초록
     · CI 가 <b>17시 00분</b>에 끝나면 — 예상업적 글이 나가 빨간불

   이었습니다. 더 나쁜 것은 <b>초록이던 쪽</b>입니다. 17시 글을 지키려고
   만든 자가 <b>하루 23시간은 그 글을 한 번도 안 보고</b> 초록을 주고
   있었습니다. <b>안 울리는 알람은 알람이 아닙니다</b> (8번).

   ★ 이 교훈은 <b>그 파일 170줄에 이미 적혀</b> 있었습니다 — 「고칠 것이
     없는데 빨개지는 점검은 안 잡는 것보다 나쁘다. 그래서 시각을 오전 10시
     반으로 고정하고 잰다.」 한 토막만 그 대접을 못 받았습니다. 그래서
     사람 기억에 맡기지 않고 <b>자로 남깁니다.</b>

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 자들 가운데 <b>시각(hour)을 뽑는 자리</b>가 적어 둔 넷뿐인가.
         늘면 빨간불입니다 — 지우라는 뜻이 아니고, <b>못 박았는지</b>
         한 번 보고 여기 적으라는 뜻입니다.
     [2] <b>지금 시각</b>(Date.now)에서 바로 뽑는 자리는, 그 파일이
         <b>시계를 못 박은</b> 곳에만 있다.
     [3] 못 박은 자는 <b>되돌려 놓는다</b> — 안 돌려놓으면 뒤 토막이
         엉뚱한 때에 돕니다.
     [4] ★ 17시 알람을 재는 그 토막은 <b>두 시각을 못 박고</b> 돈다 —
         아침과 17시. 한 판만 돌면 오늘 일이 그대로 되돌아옵니다.

     [5] ★★ <b>앱</b>에서 「오늘이 며칠인가」 에 UTC 로 답하는 자리가 없다
         (2026-10-05 · 실제로 샌 자리)
         ★★ 2026-10-05 · [5] 의 겨냥을 <b>이름(*Today())에서 파일 전체로</b>
         넓혔습니다 — 이름을 안 지킨 자리가 <b>열넷 더</b> 있었습니다 (X62).
     [6] ★ <b>자</b>가 날짜를 제 손으로 UTC 로 심지 않는다 — [5] 의 나머지
         반쪽입니다. 양쪽이 다 UTC 면 <b>우연히 초록</b>이고, 한쪽만
         고치면 그때 빨개집니다. check-clients 가 그랬습니다.

   ⚠★ <b>제가 여기 적어 둔 전제가 틀렸습니다.</b> 처음에는 이렇게 적었습니다 —
     「날짜(오늘)를 씨로 뿌리는 자리는 보지 않습니다. 씨도 재는 쪽도 같은
     날짜라 스스로 어긋나지 않습니다.」 <b>2026-10-05 에 그 자리가
     어긋났습니다.</b> check-rowskin 이 씨를 <b>ccToday()</b>(한국 날짜)로
     뿌리는데, 앱의 <b>cmToday()</b> 가 <b>toISOString() 으로 UTC 날짜</b>를
     돌려주고 있었습니다. 그래서

       · CI 가 <b>15:00 UTC 전</b>에 돌면 — 두 날짜가 같아 초록
       · CI 가 <b>15:00 UTC 뒤</b>에 돌면 — 하루 밀려 빨간불
         (「오늘 연락」 이 <b>내일</b> 로 읽혀 「❄️ 기록 없음」)

     시험만의 일이 아니었습니다 — <b>사장님 폰에서도 한국 시간 밤 0시~아침
     9시 사이에는 하루가 밀립니다.</b> 전화를 걸고 기록해도 「기록 없음」
     이라고 적혔습니다. 아침에 일하시는 분에게는 <b>늘 그 시각</b>입니다.
     그래서 [5] 를 만들었습니다 — <b>날짜도 한 곳에서</b>.

   ★ <b>헛것을 안 잡습니다</b> (8번) — [1]~[4] 가 보는 것은 <b>자들의
     시각(hour)</b> 하나뿐이고, [5] 가 보는 것은 <b>앱이 날짜를 내는
     함수</b>뿐입니다. 「오늘 했나」 를 묻는 자(almLeftToday 같은)는
     날짜를 내지 않으므로 보지 않습니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), DIR = path.join(ROOT, 'scripts');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 시각을 뽑는 자리 — <b>글 조각으로</b> 적습니다. 줄 번호로 적으면 위에
   한 줄만 넣어도 어긋나고, 그러면 아무도 자를 안 믿습니다.           */
const 적어둔것 = [
  { f: 'check-crmrun.js',     조각: "p(t.getHours())",
    왜: '씨로 뿌리는 <b>시각 글자</b> — 뿌린 t 로 만들고 재는 쪽도 같은 t 다' },
  { f: 'check-toss-relay.js', 조각: "String(d.getUTCHours())",
    왜: '<b>꼬리표 글자</b>를 만든다 — 갈라 재는 데 안 쓴다' },
  { f: 'check-push.js',       조각: "out.fixedKst=new Date(Date.now()+9*3600000).getUTCHours()",
    왜: '<b>못 박은 시계를 되읽는</b> 자리다 — 세 줄 위에서 10시 30분으로 박았다' },
];

/* ★ <b>자기 자신은 안 셉니다.</b> 아래 「적어둔것」 에 적힌 글 조각이 이
   파일 안에 그대로 있어서, 안 빼면 자가 <b>스스로를 처음 보는 자리</b>로
   찾아냅니다. 글자를 찾는 자는 늘 이 함정을 밟습니다 — 설명에 적힌 글이
   알리바이가 되는 자리입니다 (실제로 밟았습니다).                      */
const 나 = path.basename(__filename);
const 자들 = fs.readdirSync(DIR).filter(n => /^check-.*\.js$/.test(n) && n !== 나).sort();
const 찾은것 = [];
자들.forEach(n => {
  const s = fs.readFileSync(path.join(DIR, n), 'utf8').split('\n');
  s.forEach((line, i) => {
    /* 주석 줄은 안 셉니다 — 설명에 적힌 글자가 알리바이가 되면 안 됩니다 */
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
    if (/getUTCHours\(\)|getHours\(\)/.test(line)) 찾은것.push({ f: n, 줄: i + 1, line: line.trim() });
  });
});

console.log('\n[1] 시각(hour)을 뽑는 자리가 <b>적어 둔 것뿐인가</b>');
const 모르는것 = 찾은것.filter(x =>
  !적어둔것.some(e => e.f === x.f && x.line.indexOf(e.조각) >= 0));
is(모르는것.length === 0,
  '자 ' + 자들.length + '개 가운데 시각을 뽑는 자리 ' + 찾은것.length + '곳 — 전부 적어 둔 것이다'
  + (모르는것.length ? ('\n      ✗ 처음 보는 자리:\n        '
      + 모르는것.map(x => x.f + ':' + x.줄 + '  ' + x.line.slice(0, 90)).join('\n        ')
      + '\n      → 시계를 <b>못 박고</b> 재게 고치시거나, 갈라 재는 데 안 쓴다면'
      + '\n        check-clockfree.js 의 「적어둔것」 에 <b>까닭과 함께</b> 한 줄 적으십시오.') : ''));
/* <b>죽은 면제</b> — 고쳐 놓고 적어 둔 것만 남으면 자가 거짓 안심을 줍니다 */
적어둔것.forEach(e => is(찾은것.some(x => x.f === e.f && x.line.indexOf(e.조각) >= 0),
  '  적어 둔 면제가 <b>살아 있다</b> — ' + e.f + ' · ' + e.왜));
/* <b>바닥</b> — 넷보다 줄면 적어 둔 것을 지우고 바닥도 내리십시오 */
is(찾은것.length <= 4, '  바닥 — 시각을 뽑는 자리가 <b>넷을 안 넘는다</b> (지금 ' + 찾은것.length + '곳)');

console.log('\n[2] <b>지금 시각</b>에서 바로 뽑는 자리는 시계를 못 박은 파일에만 있다');
const 바로뽑기 = 찾은것.filter(x => /Date\.now\(\)/.test(x.line));
바로뽑기.forEach(x => {
  const s = fs.readFileSync(path.join(DIR, x.f), 'utf8');
  is(/Date\.now\s*=/.test(s),
    '  <b>' + x.f + '</b> 는 Date.now 를 <b>못 박는다</b> — ' + x.line.slice(0, 70));
});
is(바로뽑기.length >= 1, '  바로 뽑는 자리를 <b>정말로 찾았다</b> — ' + 바로뽑기.length + '곳 (0곳이면 자가 헛돈 것이다)');

console.log('\n[3] 못 박은 자는 <b>되돌려 놓는다</b>');
const 못박은자 = 자들.filter(n => /(?:^|[^\w$.])(?:window\.)?Date\.now\s*=\s*(?!=)/m.test(
  fs.readFileSync(path.join(DIR, n), 'utf8')));
is(못박은자.length >= 1, '  시계를 못 박는 자가 있다 — ' + (못박은자.join(' · ') || '없음'));
못박은자.forEach(n => {
  const s = fs.readFileSync(path.join(DIR, n), 'utf8');
  /* ⚠ 돌려놓는 <b>모양이 여럿</b>입니다. 처음에 이름을 손으로 적었다가
     (realNow|real…) <b>check-crmask 를 헛잡았습니다</b> — 거기는 화면 쪽
     Date 를 통째로 바꾸고 `window.Date = RD` 로 되돌립니다. 헛것을 잡는
     자는 안 잡는 자보다 나쁩니다 (8번). 그래서 이름이 아니라 <b>모양</b>
     으로 봅니다 — <b>받아 둔 것(맨 이름)을 다시 대입하면</b> 되돌린
     것입니다. 함수를 새로 지어 넣는 것(= function…, = () =>…)은 못 박는
     쪽이라 세지 않습니다.                                              */
  /* ⚠ 왼쪽 <b>글자 경계</b>를 빼면 `const RealDate = Date;` 의 <b>꼬리
     「Date」</b> 가 되돌림으로 읽힙니다 — 되돌림을 지웠는데도 초록이었습니다
     (되돌려 보고 알았습니다 · 8번). 앞 글자가 글자·점이면 안 셉니다.     */
  const 되돌림 = /(?:^|[^\w$.])(?:window\.)?Date\s*(?:\.now)?\s*=\s*[A-Za-z_$][\w$]*\s*[;,)]/.test(s);
  is(되돌림, '  <b>' + n + '</b> 가 시계를 <b>되돌려 놓는다</b> — 받아 둔 것을 다시 대입한다');
});

console.log('\n[4] ★ 17시 알람을 재는 토막은 <b>두 시각</b>을 돈다 — 오늘 깨진 자리');
const PUSH = fs.readFileSync(path.join(DIR, 'check-push.js'), 'utf8');
is(/돌려본다\s*=\s*async/.test(PUSH),
  '  한 판을 <b>함수 하나</b>로 돌린다 — 시각만 바꿔 여러 판을 돌릴 수 있다');
is(/돌려본다\(9[,)]/.test(PUSH) && /돌려본다\(17[,)]/.test(PUSH),
  '  ★ <b>아침(9시)과 예상업적(17시)을 다 돈다</b> — 한 판만 돌면 23시간은 아무것도 안 잰다');
is(/kstHour===9/.test(PUSH) && /kstHour===17/.test(PUSH),
  '  ★ 서버가 <b>정말 그 시각으로 돌았는지</b> 서버 대답(kstHour)으로 되짚는다 — 못이 빠지면 그 자리에서 울린다');

console.log('\n[5] ★★ 앱에서 <b>「오늘이 며칠인가」 에 UTC 로 답하는 자리</b>가 없다');
/* 겨냥을 좁게 둡니다 — <b>날짜 글자를 돌려주는</b> 함수만 봅니다.
   「오늘 했나」·「몇 남았나」 를 묻는 자는 날짜를 내지 않아 안 봅니다. */
const APP = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
const 맨UTC = [];
{
  const re = /function\s+([A-Za-z_$][\w$]*Today)\s*\(\s*\)\s*\{/g;
  let m;
  while ((m = re.exec(APP))) {
    /* 몸통을 넉넉히 떠서 — 한 줄짜리든 여러 줄이든 들어옵니다 */
    const 몸 = APP.slice(m.index + m[0].length, m.index + m[0].length + 300);
    /* <b>맨 UTC</b> — 시간대를 안 더하고 toISOString 으로 날짜를 뽑는 꼴 */
    if (/new Date\(\s*\)\s*\.toISOString\(\)|new Date\(\s*Date\.now\(\)\s*\)\s*\.toISOString\(\)/.test(몸))
      맨UTC.push(m[1]);
  }
}
is(맨UTC.length === 0,
  '  ★★ <b>UTC 날짜를 돌려주는 *Today() 함수 ' + 맨UTC.length + '곳</b>' +
  (맨UTC.length ? (' ← ' + 맨UTC.join(' · ') + ' · 한국 날짜 하나(ccToday)를 부르십시오') :
                  ' — 모두 한국 날짜로 답합니다 (cmToday·mstToday 가 여기 걸렸던 자리입니다)'));

/* ★★ 2026-10-05 · <b>겨냥을 파일 전체로 넓혔습니다</b> (X62).
   위까지는 <b>이름이 *Today() 인 함수</b>만 봤습니다. 그래서 고친 바로 뒤에
   넓게 훑어 보니 <b>열넷이 더 남아</b> 있었습니다 — 함수 이름이 안 그랬을
   뿐입니다. 그 중에는
     · rdDays() — cmDays 와 <b>같은 「며칠 됐나」 셈</b>
     · analysisDate — ★ <b>고객이 보는 종이에 찍히는 날짜</b>
     · db-crm 의 today() — ★ <b>배정일·계약일의 기본값</b>(서버에 담김)
   이 있었습니다. <b>이름으로 겨누면 이름을 안 지킨 자리를 놓칩니다.</b>
   이제 네 파일의 <b>글 전체</b>에서 맨 UTC 날짜를 셉니다.
   ★ 예외는 <b>적어 두고</b> 왜인지 밝힙니다 (8번 — 헛것을 안 잡으려고).  */
const 날짜파일 = ['app/index.html', 'db-crm.html', 'apex-care.js', 'app/finance.html'];
const 맨UTC_예외 = [];   /* 지금은 없습니다 — 생기면 왜인지 여기 적습니다 */
{
  const 센것 = [];
  날짜파일.forEach(f => {
    const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
    /* 주석은 코드가 아닙니다 — 쪽지에 적은 글이 <b>알리바이</b>가 되면 안 됩니다 */
    const code = t.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
    const n = (code.match(/new Date\(\s*\)\s*\.toISOString\(\)\s*\.slice\(\s*0\s*,\s*10\s*\)/g) || []).length;
    if (n > 0 && 맨UTC_예외.indexOf(f) < 0) 센것.push(f + ' ' + n + '곳');
  });
  is(센것.length === 0,
    '  ★★ 네 파일 <b>글 전체</b>에서 맨 UTC 날짜 <b>0곳</b>' +
    (센것.length ? (' ← ' + 센것.join(' · ') + ' · 그 파일의 한국 날짜 함수를 부르십시오')
                 : ' — 이름이 *Today() 가 아닌 자리 열넷이 여기 걸렸습니다 (X62)'));
  /* 고친 자리 가운데 <b>가장 아픈 셋</b>은 이름으로 못 박아 둡니다 —
     누가 되돌리면 그 자리에서 알게 */
  const APPX = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  is(/var x=new Date\(a\+'T00:00:00Z'\)\.getTime\(\),y=new Date\(ccToday\(\)\+'T00:00:00Z'\)/.test(APPX),
    '  ★★ rdDays 가 <b>한국 날짜</b>로 센다 — cmDays 와 같은 병이었습니다');
  is(/d\.client\.analysisDate = ccToday\(\)/.test(APPX),
    '  ★★ <b>인쇄물에 찍히는 날짜</b>가 한국 날짜다 — 아침에 어제 날짜가 나갔습니다');
  const DBC = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');
  is(/const today=\(\)=>crmToday\(\);/.test(DBC),
    '  ★★ db-crm 의 <b>배정일·계약일 기본값</b>이 crmToday 하나를 부른다 — 서버에 하루 이른 날짜가 담겼습니다');
  /* ★★ db-crm 의 「오늘」 이 <b>기기 시각이 아니라 한국 날짜</b>인가.
     시계를 못 박아 재어 보니 todayLocal 은 <b>기기 시각</b>이었습니다 —
     본체는 +9 고정이라 기기 시간대가 다르면 두 화면이 어긋납니다.
     배정일·계약일은 한국 회사의 하루여야 합니다 (X62).              */
  is(/function crmToday\(\)\{ return new Date\(Date\.now\(\)\+9\*3600\*1000\)\.toISOString\(\)\.slice\(0,10\); \}/.test(DBC),
    '  ★★ db-crm 의 「오늘」 이 <b>한국 날짜(+9)</b>다 — 기기 시각이면 본체와 어긋납니다');
  is(/function todayLocal\(\)\{ return crmToday\(\); \}/.test(DBC),
    '  ★ 옛 이름 todayLocal 은 <b>가리키기만</b> 한다 — 지우지 않고 한 곳으로 모읍니다 (5번)');
  is(!/todayLocal\(\)/.test(DBC.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/function todayLocal\(\)\{ return crmToday\(\); \}/, ' ')),
    '  ★ todayLocal 을 <b>부르는 자리가 없다</b> — 모두 crmToday 로 모았습니다');
  const CARE = fs.readFileSync(path.join(ROOT, 'apex-care.js'), 'utf8');
  is(/crmToday\(\)/.test(CARE) && !/new Date\(\s*\)\s*\.toISOString\(\)\s*\.slice\(\s*0\s*,\s*10\s*\)/.test(CARE),
    '  ★ apex-care 의 <b>「챙긴 날」</b>도 그 하나를 부른다');
  const FIN = fs.readFileSync(path.join(ROOT, 'app', 'finance.html'), 'utf8');
  is((FIN.match(/function fxToday\(\)/g) || []).length === 1,
    '  ★ 계산기도 <b>하나만</b> 둔다 (fxToday) — 따로 열리는 화면이라 ccToday 를 못 부릅니다');
}
/* 고친 두 자리가 <b>제 손으로 +9 를 또 적지 않았는지</b> — 그러면 셋째 벌 */
is(/function cmToday\(\)\{return ccToday\(\);\}/.test(APP),
  '  ★ cmToday 는 <b>ccToday 를 부른다</b> — +9 를 또 적으면 셋째 벌이 됩니다 (5번)');
is(/function mstToday\(\)\{ return ccToday\(\); \}/.test(APP),
  '  ★ mstToday 도 <b>ccToday 를 부른다</b>');

console.log('\n[6] ★ 자가 <b>날짜를 제 손으로 UTC 로 심지</b> 않는다 (X61 의 나머지 반쪽)');
/* [5] 는 <b>앱</b> 쪽을 봅니다. 이 토막은 <b>자</b> 쪽입니다 —
   2026-10-05 에 check-clients 가 씨를 UTC 로 뿌리고 있었습니다. 앱도 UTC
   였던 동안에는 양쪽이 같아 <b>우연히 초록</b>이었고, 앱을 한국 날짜로
   고치자 <b>3일 전을 4일 전</b>으로 읽어 빨간불이 됐습니다. 자가 날짜를
   제 손으로 만들면 앱과 어긋날 수 있습니다 — <b>앱의 cmToday() 에서
   세어</b> 나가야 합니다.
   ★ [1] 과 같은 모양으로 <b>적어 둔 것만</b> 허락합니다. 늘면 빨간불이고,
     그 뜻은 「지우라」 가 아니라 <b>「견주는 데 쓰는지 한 번 보고 여기
     적으라」</b> 입니다 (8번 — 헛것을 안 잡으려고).                     */
const 날짜심기_적어둔것 = [
  { f: 'check-ready.js',
    왜: '백업 줄의 ref_date <b>이름표</b>로만 쓰고, 앱의 「오늘」 과 견주지 않습니다' },
  /* ★ 이 자는 <b>일부러</b> 맨 UTC 를 읽습니다 — 시계를 못 박은 뒤 「맨 UTC
     로 뽑으면 어제가 나온다」 를 <b>대조군</b>으로 확인하는 자리입니다.
     그 한 줄이 없으면 못이 정말 박혔는지 알 수 없습니다 (X62). */
  { f: 'check-daykst.js',
    왜: '시계를 못 박은 뒤 <b>대조군</b>으로 맨 UTC 를 읽습니다 — 못이 박혔는지 되짚는 자리입니다' }
];
{
  const 심는자 = [];
  fs.readdirSync(DIR).filter(n => /^check-.*\.js$/.test(n) && n !== 나).forEach(n => {
    const t = fs.readFileSync(path.join(DIR, n), 'utf8');
    /* <b>맨 UTC</b> 로 날짜 글자를 뽑는 꼴 — 시간대를 안 더하고 */
    if (/new Date\(\s*\)\s*\.toISOString\(\)\s*\.slice\(\s*[05]\s*,\s*10\s*\)/.test(t))
      심는자.push(n);
  });
  const 적힌 = 날짜심기_적어둔것.map(x => x.f);
  const 새것 = 심는자.filter(n => 적힌.indexOf(n) < 0);
  const 사라진 = 적힌.filter(n => 심는자.indexOf(n) < 0);
  is(새것.length === 0,
    '  ★ UTC 로 날짜를 심는 자가 <b>적어 둔 ' + 적힌.length + '개뿐</b>이다' +
    (새것.length ? (' ← 늘었습니다: ' + 새것.join(' · ') +
                    ' · 앱과 견주는 데 쓰면 cmToday() 에서 세십시오') : ''));
  is(사라진.length === 0,
    '  적어 둔 것이 <b>살아 있다</b>' +
    (사라진.length ? (' ← 이제 없습니다: ' + 사라진.join(' · ') + ' · 이 줄을 지우십시오') : ''));
  /* 고친 그 자가 <b>앱에 묻는지</b> — 되돌리면 울린다 */
  const CLI = fs.readFileSync(path.join(DIR, 'check-clients.js'), 'utf8');
  is((CLI.match(/new Date\(cmToday\(\)\s*\+\s*'T00:00:00Z'\)/g) || []).length >= 3,
    '  ★★ check-clients 가 씨를 <b>앱의 cmToday() 에서</b> 센다 — 세 자리');
  is(/bd:\s*cmToday\(\)\.slice\(5, 10\)/.test(CLI),
    '  ★ 「오늘 생일」 도 <b>앱의 오늘</b>에서 뽑는다 — UTC 로 뽑으면 아침에 어제 생일이 됩니다');
}

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ ' + bad + '개 — 자가 시계에 매여 있으면 초록이 거짓이 됩니다.'); process.exit(1); }
console.log('✓ 자들이 시계에 안 매였습니다 — CI 가 몇 시에 돌아도 같은 것을 잽니다.');
