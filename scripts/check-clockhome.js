/* ══════════════════════════════════════════════════════════════════
   check-clockhome.js — <b>홈 높이를 재는 자는 시계를 못 박는다.</b>

   사장님 말씀 (2026-10-09) — 「홈 높이 자에 <b>시계 못 박는</b> 다음판 해줘」.

   ── 왜 이 자가 있나 ───────────────────────────────────────────────
   홈은 때에 따라 길이가 다릅니다(아침·낮·저녁으로 카드와 글이 갈립니다).
   그런데 홈 높이를 재는 자 넷 가운데 <b>셋</b>이 시계를 안 보고 그냥
   「지금」 을 쟀습니다. 그래서 —
     아침 4.22  ✗      낮 4.19  ✓      저녁 4.25  ✗
   인데 CI 가 14~15시(UTC)에 돌아 <b>늘 초록</b>이었고, #548·#549·#550
   세 판이 사장님 선(4.2)을 넘긴 채로 들어갔습니다.
   ★ check-phonefit <b>하나는 이미 박고 있었습니다</b>(2026-09-15 09:00Z).
     그 자만 멀쩡했던 것이고, 「넷 다 안 봤다」 는 제 말은 틀렸습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 박는 자리가 <b>한 곳</b>인가 (5번) — lib-clock 말고 홈 자들이
         제 손으로 Date 를 바꾸지 않는가
     [2] 네 자가 모두 <b>그 한 곳을 부르고 박는가</b>
     [3] 창을 <b>ctxOpt</b> 로 여는가 — 시간대를 빠뜨리면 못 박은 절대
         시각과 「getHours」 가 어긋나 「저녁」 이라 적고 아침을 잽니다
     [4] check-homeone 이 <b>세 때를 다 도는가</b> · <b>같은 씨</b>로
     [5] 못 박은 때가 <b>지금</b>에 안 매였는가 — 날짜로 지었는가
     [6] 껍데기가 <b>네 가지</b>를 다 덮는가 (now·parse·UTC·prototype)
         — 하나만 빠지면 앱이 조용히 터집니다
     [7] <b>흐르는</b> 시계인가 — 굳히면 「몇 초 지났나」 가 영원히 0 이라
         기다림이 안 끝납니다

   ── 판 X83 에서 <b>넓혔습니다</b> ────────────────────────────────
   사장님 말씀 (2026-10-10) — 「②번 <b>시계 자 14개</b> 해줘」.
   홈 자 넷 말고도 <b>자 열넷</b>에 시계를 박았습니다. 그러면서 세 가지를
   배웠고, 그 셋을 여기 [8]~[10] 으로 적었습니다 —

     [8] ★ lib-clock 을 부르는 자는 <b>창(쪽)마다</b> 박는다.
         ⚠ 실제로 틀렸습니다 — <b>check-bohumrls 는 쪽을 셋</b> 여는데
         제가 <b>하나만</b> 박았습니다. 「하나만 박으면 그 창만 같아집니다」
         라고 커밋 글에 적어 두고 제가 어겼습니다. 사람 눈으로는 못 셉니다.
     [9] ★ 박는 <b>길이 두 벌</b>이 아니다 — playwright 의 clock 을 따로
         쓰지 않는다. ⚠ 실제로 터졌습니다 — <b>check-daykst</b> 가
         `pg.clock.setFixedTime` 으로 제 날짜를 박고 있었는데 거기에
         lib-clock 을 덧박아, 두 벌이 <b>서로 덮어</b> 그 자가 헛
         빨간불을 켰습니다(「2026-10-09 ← 한국 날짜가 아닙니다」).
    [10] ★ 자가 <b>Node 에서 「오늘」 을 또 셈하지 않는다.</b>
         ⚠ 실제로 틀렸습니다 — <b>check-day·check-team</b> 이 Node 에서
         「오늘」 을 세어 <b>못 박은 창과 하루 갈렸습니다</b>(day 의 어긋남
         38,389초). 창은 못 박은 날이고 Node 는 CI 가 도는 진짜 날입니다.
         lib-clock 의 <b>kstDay</b> 로 모았습니다.

   ★ 이름은 <b>홈에서 시작한 자</b>라 그대로 둡니다 — 말씀 대장 X78 이 이
     이름으로 적혀 있어, 바꾸면 그 줄이 가리키는 자가 사라집니다.

   ⚠ 이 자는 <b>브라우저를 안 띄웁니다</b>(fast) — 글만 읽습니다. 실제
     수는 check-homeone 이 잽니다. 둘이 같은 것을 두 번 재지 않습니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), DIR = path.join(ROOT, 'scripts');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const 읽기 = (n) => { try { return fs.readFileSync(path.join(DIR, n), 'utf8'); } catch (e) { return ''; } };
const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/* ★ 주석을 <b>줄 수를 지키며</b> 지웁니다. 위 걷기 는 여러 줄 주석을 통째로
   없애 <b>줄 번호가 밀립니다</b> — 「어디가 어긋났다」 고 적을 자리에서는
   줄이 안 밀려야 합니다. 그리고 주석에 적힌 글자가 <b>알리바이</b>가 되지
   않게, 찾는 것은 늘 걷어 낸 글에서 찾습니다 (check-clockfree 의 교훈).  */
const 걷기줄 = (s) => {
  const out = []; let 안에 = false;
  s.split('\n').forEach(line => {
    let t = line;
    if (안에) {
      if (t.indexOf('*/') >= 0) { t = t.slice(t.indexOf('*/') + 2); 안에 = false; }
      else t = '';
    }
    t = t.replace(/\/\*[\s\S]*?\*\//g, '');
    if (t.indexOf('/*') >= 0) { t = t.slice(0, t.indexOf('/*')); 안에 = true; }
    t = t.replace(/\/\/.*$/, '');
    out.push(t);
  });
  return out;
};

/* 홈 높이를 재는 자 — <b>넷</b>입니다. 늘면 여기 한 줄을 보태고 그 자도
   못 박으십시오 (check-homeone 의 쪽지가 이 넷을 적어 두고 있습니다).   */
const 홈자 = ['check-homeone.js', 'check-phonefit.js', 'check-msfive.js', 'check-homeshape.js'];

/* ★ <b>자기 자신은 안 셉니다.</b> 아래 [10] 의 「창안쪽」 에 적은 글 조각이
   이 파일 안에 <b>코드로</b> 들어 있어서, 안 빼면 자가 스스로를 처음 보는
   자리로 찾아냅니다. 글자를 찾는 자는 늘 이 함정을 밟습니다 —
   check-clockfree 가 실제로 밟아 그 쪽지에 적어 두었습니다 (8번).      */
const 나 = path.basename(__filename);
const 자들 = fs.readdirSync(DIR).filter(n => /^check-.*\.js$/.test(n) && n !== 나).sort();
const 부르는자 = 자들.filter(n => /require\(['"]\.\/lib-clock\.js['"]\)/.test(걷기(읽기(n))));

console.log('[1] 📌 박는 자리가 <b>한 곳</b>인가 (5번)');
{
  const L = 읽기('lib-clock.js');
  is(!!L, '  scripts/lib-clock.js 가 있다');
  /* ⚠ 다른 자(check-crmask · check-push)도 시계를 박습니다 — 그쪽은 홈이
     아니라 <b>통화 칸·알람</b>을 재는 자라 여기서 안 셉니다 (헛것 금지 · 8번).
     여기서 보는 것은 <b>홈 높이 자 넷</b>이 제 손으로 박지 않는가입니다. */
  const 제손 = 홈자.filter(n => /window\.Date\s*=/.test(걷기(읽기(n))));
  is(제손.length === 0,
    '  홈 자 넷이 <b>제 손으로 Date 를 안 바꾼다</b>' + (제손.length ? (' ← ' + 제손.join(' ')) : ''));
  is(/window\.Date\s*=/.test(L), '  박는 줄은 <b>lib-clock 안</b>에 있다');
}

console.log('\n[2] ⏰ 네 자가 모두 <b>그 한 곳을 부르고 박는다</b>');
홈자.forEach(n => {
  const s = 걷기(읽기(n));
  const 부름 = /require\(['"]\.\/lib-clock\.js['"]\)/.test(s);
  const 박음 = /CLK\.pin(At|Iso)?\s*\(/.test(s);
  is(부름 && 박음, '  ' + n.replace(/^check-|\.js$/g, '') + ' — 부르고(' + (부름 ? 'O' : 'X') +
     ') 박는다(' + (박음 ? 'O' : 'X') + ')');
});

console.log('\n[3] 🪟 창을 <b>ctxOpt</b> 로 연다 — 시간대를 빠뜨리지 않게');
홈자.forEach(n => {
  const s = 걷기(읽기(n));
  const 손으로 = (s.match(/newContext\(\s*\{/g) || []).length;
  is(손으로 === 0, '  ' + n.replace(/^check-|\.js$/g, '') + ' — 손으로 연 창 ' + 손으로 + '곳');
});

console.log('\n[4] 🌅🌞🌙 check-homeone 이 <b>세 때를 다 돈다</b>');
{
  const H = 걷기(읽기('check-homeone.js'));
  is(/for\s*\(\s*const\s+w\s+of\s+CLK\.WHEN\s*\)/.test(H), '  때 목록(CLK.WHEN)을 <b>돌면서</b> 잰다');
  is(/open\(\s*SEED_A\s*,\s*w\.h\s*\)/.test(H),
    '  <b>같은 씨</b>로 잰다 — 씨가 다르면 4.2 선과 견줄 수 없는 수가 나옵니다');
  const n = (H.match(/844 \* 4\.2/g) || []).length;
  is(n >= 2, '  <b>그 선(4.2)</b>과 견주는 자리가 ' + n + '곳 — 한 판(hA)과 세 때');
  const L = 읽기('lib-clock.js');
  /* ⚠ 띄어쓰기를 <b>하나로 못 박지 않습니다</b> — 처음에 `, h:` 라고 적었다가
     표가 칸을 맞춰 `,   h:` 로 둔 「낮」 한 줄을 못 보고 「때가 둘」 이라고
     울렸습니다. 글자를 찾는 자는 늘 이 함정을 밟습니다 (8번).           */
  const 때 = (L.match(/\{\s*k:\s*'[^']+',\s*h:\s*(\d+)/g) || []).map(x => +x.replace(/\D/g, ''));
  is(때.length === 3, '  때가 <b>셋</b>이다 — ' + 때.join('시 · ') + '시');
  is(new Set(때).size === 3, '  세 때가 <b>서로 다른 시각</b>이다');
  /* 앱이 하루를 가르는 자리와 같은 토막인가 — 11시 전 아침 · 17시 전 낮 · 그 뒤 저녁 */
  is(때[0] < 11 && 때[1] >= 11 && 때[1] < 17 && 때[2] >= 17,
    '  앱이 하루를 가르는 <b>그 세 토막</b>에 들어 있다 (osBriefKind: 11 · 17)');
}

console.log('\n[5] 📅 못 박은 때가 <b>지금</b>에 안 매였다');
{
  const L = 걷기(읽기('lib-clock.js'));
  is(/Date\.UTC\(/.test(L), '  <b>날짜로</b> 절대 시각을 짓는다 — Date.UTC');
  /* ★ 지금 시각을 물으면 CI 가 도는 때에 다시 매입니다. 흐름을 더하는
     자리(RD.now())는 <b>창 안쪽</b>이라 여기 셈에서 뺍니다.            */
  const 밖 = L.split('addInitScript')[0];
  is(!/Date\.now\(\)/.test(밖), '  때를 정할 때 <b>지금을 묻지 않는다</b>');
  is(/const DAY = \{ y: \d{4}, m: \d{1,2}, d: \d{1,2} \}/.test(L), '  못 박은 <b>날</b>이 적혀 있다');
}

console.log('\n[6] 🧩 껍데기가 <b>네 가지</b>를 다 덮는다');
{
  const L = 읽기('lib-clock.js');
  ['now', 'parse', 'UTC', 'prototype'].forEach(k => {
    is(new RegExp('D\\.' + k + '\\s*=').test(L),
      '  D.' + k + ' 를 덮는다' + (k === 'prototype' ? ' — 빠지면 instanceof 가 깨집니다' : ''));
  });
}

console.log('\n[7] 🏃 <b>흐르는</b> 시계인가');
{
  const L = 읽기('lib-clock.js');
  is(/RD\.now\(\)\s*-\s*t0/.test(L),
    '  못 박은 자리에서 <b>같이 흐른다</b> — 굳히면 「몇 초 지났나」 가 영원히 0 입니다');
}

console.log('\n[8] 🪟 lib-clock 을 부르는 자는 <b>창(쪽)마다 박는다</b> (판 X83)');
{
  /* <b>바닥</b> — 줄면 시계를 안 보는 자가 다시 생긴 것입니다. 늘면(좋은
     일입니다) 이 수를 올리십시오. 지금 <b>19개</b>입니다 — 이 자는 자기를
     안 세므로, 손으로 센 20 에서 하나 적습니다(세어 보고 알았습니다).   */
  is(부르는자.length >= 19,
    '  부르는 자가 <b>' + 부르는자.length + '개</b> — 바닥 19개');
  /* ★ <b>세는 것</b> : 창(newContext) + 띄운이에게서 바로 연 쪽
     (browser.newPage). 못 박은 <b>창 안에서</b> 연 쪽은 안 셉니다 — 창에
     박으면 그 뒤에 열리는 쪽이 다 물려받습니다. 그래서 5쪽을 여는 자도
     창 하나만 박으면 됩니다. 헛것을 안 잡으려고 이렇게 가릅니다 (8번).  */
  const 모자란자 = [];
  부르는자.forEach(n => {
    const s2 = 걷기(읽기(n));
    /* ★ 빠져나가는 길은 <b>날글</b>에서 봅니다. 이 저장소의 꼴은 「원단위OK」
       처럼 <b>주석에</b> 적는 것인데, 걷어 낸 글에서 찾으면 그 주석이 이미
       사라져 <b>빠져나가는 길이 안 먹힙니다</b> — 되돌려 보고 알았습니다
       (판 X83 · 되돌림 ⑦ 이 안 울렸습니다 · 8번).                        */
    if (/시계안박음OK/.test(읽기(n))) return;         /* 까닭을 적어 빠져나간 자 */
    const 띄운이 = (s2.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+chromium\.launch\s*\(/) || [])[1];
    const 창 = (s2.match(/\.newContext\s*\(/g) || []).length
      + (띄운이 ? (s2.match(new RegExp('\\b' + 띄운이 + '\\.newPage\\s*\\(', 'g')) || []).length : 0);
    const 박음 = (s2.match(/CLK\.pin(?:At|Iso)?\s*\(/g) || []).length;
    if (창 > 박음) 모자란자.push(n + ' — 창·쪽 ' + 창 + '곳인데 박은 것은 ' + 박음 + '곳');
  });
  is(모자란자.length === 0,
    '  <b>창·쪽을 여는 수만큼 박는다</b>' + (모자란자.length
      ? ('\n      ✗ 박지 않고 연 자리:\n        ' + 모자란자.join('\n        ')
         + '\n      → 그 줄 다음에 <b>await CLK.pin(창, 박는때);</b> 를 넣으십시오.'
         + '\n        정말 안 박아야 하는 자리면 그 파일에 <b>시계안박음OK</b> 를 까닭과 함께 적으십시오.')
      : ' — ' + 부르는자.length + '개 모두'));
}

console.log('\n[9] 📌 박는 <b>길이 두 벌</b>이 아니다 (5번 · 판 X83)');
{
  /* playwright 에도 시계가 있습니다(page.clock). 쓰면 안 되는 것이 아니라,
     <b>lib-clock 과 두 벌이 되면 한쪽만 늙습니다.</b> 판 X83 에서 두 벌이
     서로 덮어 check-daykst 가 헛 빨간불을 켰습니다. 정말 필요하면 그 줄에
     <b>시계두벌OK</b> 를 적어 빠져나가십시오.                            */
  const 두벌 = [];
  자들.forEach(n => {
    const 날 = 읽기(n);
    if (/시계두벌OK/.test(날)) return;               /* 까닭을 적어 빠져나간 자 */
    걷기줄(날).forEach((line, i) => {
      if (/\.clock\.(setFixedTime|install|setSystemTime)\s*\(/.test(line))
        두벌.push(n + ':' + (i + 1) + '  ' + line.trim().slice(0, 70));
    });
  });
  is(두벌.length === 0,
    '  playwright 의 clock 을 따로 쓰는 자가 <b>0개</b>' + (두벌.length
      ? ('\n      ✗ ' + 두벌.join('\n      ✗ ')
         + '\n      → lib-clock 의 pinAt·pin·pinIso 로 모으십시오.') : ''));
}

console.log('\n[10] 🗓 자가 <b>Node 에서 「오늘」 을 또 셈하지 않는다</b> (판 X83)');
{
  /* 창 안쪽(evaluate·addInitScript)에서 세는 것은 <b>창의 못 박은 시계</b>로
     세는 것이라 맞습니다. 밖(Node)에서 세면 CI 가 도는 진짜 날이라
     <b>하루 갈립니다.</b> 안쪽·바깥을 글자만 보고 가르면 틀리므로,
     check-clockfree 가 쓰는 꼴을 그대로 씁니다 — <b>찾은 자리가 적어 둔
     것뿐인가</b>, 그리고 <b>적어 둔 것이 살아 있는가</b>.               */
  const 창안쪽 = [
    { f: 'check-day.js',
      조각: "window.dApD(new Date(Date.now() + 9 * 3600000 + 86400000)",
      왜: '<b>page.evaluate 안</b>이다 — 창의 시계로 「내일」 을 센다' },
    { f: 'check-day.js',
      조각: "const d = new Date(Date.now() + 9 * 3600000 + 86400000).toISOString().slice(0, 10);",
      왜: '<b>pz.evaluate 안</b>이다 — 뉴욕 시간대 창에서 「내일」 을 센다' },
    /* ⚠ 이 조각은 <b>일부러 짧습니다.</b> 뒤에 붙는 「.getUTCHours()」 까지
       적었더니, 이 줄이 <b>check-clockfree 에게 처음 보는 자리</b>로 잡혀
       그 자가 빨간불 셋을 켰습니다 — 그쪽은 「시각(hour)을 뽑는 자리」 를
       글자로 찾고 <b>자기만</b> 빼고 봅니다. clockfree 의 쪽지에 적힌
       「설명에 적은 글이 알리바이가 된다」 는 함정인데, 이번에는 <b>다른
       파일</b>에서 밟혔습니다. 자가 자를 울린 자리입니다 (8번).         */
    { f: 'check-push.js',
      조각: "out.fixedKst=new Date(Date.now()+9*3600000)",
      왜: '<b>못 박은 시계를 되읽는</b> 자리다 (check-clockfree 에도 적혀 있다)' }
  ];
  const 찾음 = [];
  부르는자.forEach(n => {
    걷기줄(읽기(n)).forEach((line, i) => {
      if (/Date\.now\(\)\s*\+\s*9\s*\*\s*3600000/.test(line)) 찾음.push({ f: n, 줄: i + 1, line: line.trim() });
    });
  });
  const 처음본것 = 찾음.filter(x => !창안쪽.some(e => e.f === x.f && x.line.indexOf(e.조각) >= 0));
  is(처음본것.length === 0,
    '  한국 날짜를 손으로 세는 자리 ' + 찾음.length + '곳 — 전부 <b>창 안쪽</b>이다'
    + (처음본것.length ? ('\n      ✗ 처음 보는 자리:\n        '
        + 처음본것.map(x => x.f + ':' + x.줄 + '  ' + x.line.slice(0, 90)).join('\n        ')
        + '\n      → 창 안쪽(evaluate)이면 여기 까닭과 함께 한 줄 적으십시오.'
        + '\n        Node 쪽이면 <b>CLK.kstDay(박는때)</b> 로 바꾸십시오 — 안 바꾸면 하루 갈립니다.') : ''));
  /* <b>죽은 면제</b> — 고쳐 놓고 적어 둔 것만 남으면 자가 거짓 안심을 줍니다 */
  창안쪽.forEach(e => is(찾음.some(x => x.f === e.f && x.line.indexOf(e.조각) >= 0),
    '  적어 둔 면제가 <b>살아 있다</b> — ' + e.f + ' · ' + e.왜));
  /* ★ Node 쪽에서 묻는 길이 <b>있는가</b> — 없으면 [10] 이 헛돈 것입니다 */
  const L = 읽기('lib-clock.js');
  is(/function kstDay\(/.test(L), '  ★ Node 쪽에서 <b>같은 시계에 묻는 길</b>이 있다 — lib-clock 의 kstDay');
  const 쓰는자 = 부르는자.filter(n => /CLK\.kstDay\s*\(/.test(걷기(읽기(n))));
  is(쓰는자.length >= 2, '  ★ 그 길을 <b>정말 쓴다</b> — ' + (쓰는자.map(n => n.replace(/^check-|\.js$/g, '')).join(' · ') || '아무도 안 씀'));
}

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '곳이 어긋났습니다 — 자가 때에 따라 들쭉날쭉합니다')
                : '✓ 자 ' + 부르는자.length + '개가 한 곳에서 시계를 못 박고, 창마다 박고, Node 에서 또 안 셉니다');
process.exit(bad ? 1 : 0);
