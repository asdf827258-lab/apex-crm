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

   ⚠ 이 자는 <b>브라우저를 안 띄웁니다</b>(fast) — 글만 읽습니다. 실제
     수는 check-homeone 이 잽니다. 둘이 같은 것을 두 번 재지 않습니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), DIR = path.join(ROOT, 'scripts');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const 읽기 = (n) => { try { return fs.readFileSync(path.join(DIR, n), 'utf8'); } catch (e) { return ''; } };
const 걷기 = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* 홈 높이를 재는 자 — <b>넷</b>입니다. 늘면 여기 한 줄을 보태고 그 자도
   못 박으십시오 (check-homeone 의 쪽지가 이 넷을 적어 두고 있습니다).   */
const 홈자 = ['check-homeone.js', 'check-phonefit.js', 'check-msfive.js', 'check-homeshape.js'];

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

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '곳이 어긋났습니다 — 홈 높이 자가 때에 따라 들쭉날쭉합니다')
                : '✓ 홈 높이 자 넷이 한 곳에서 시계를 못 박고, 세 때를 다 잽니다');
process.exit(bad ? 1 : 0);
