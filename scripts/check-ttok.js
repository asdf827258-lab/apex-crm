/* ══════════════════════════════════════════════════════════════════
   check-ttok.js — <b>토스판 토큰이 한 곳에만 있나.</b>

   사장님 말씀 (2026-09-23) — 「APEX YUN PRO 를 토스처럼 바꿉니다.
   이 세션은 그중 첫 조각인 <b>디자인 토큰 + 홈 화면</b>만 맡습니다」
   「토큰과 클래스는 <b>반드시 한 곳에만</b> 두십시오」
   「홈에 <b>저장 코드를 새로 짜지 마십시오</b>. 기존 화면·기존 함수를
    부르기만 하십시오. 두 벌이 되는 순간 데이터가 깨집니다」

   ── 이름을 왜 check-ttok 으로 했나 ────────────────────────────────
   지시는 <b>check-toss.js</b> 였는데 그 이름은 <b>이미 있습니다</b> —
   「폰에서 읽히나 · 손이 닿나 · 옆으로 안 새나」 를 재는 34KB 짜리 자(尺)
   입니다. 덮어쓰면 그것이 통째로 사라집니다. CLAUDE.md 8번이 적어 둔
   사고(check-tofin.js 를 덮어써 기존 점검을 지웠다) 그대로입니다.
   그래서 <b>새 이름</b>으로 두고 둘 다 돌립니다.

   ── 보는 것 ───────────────────────────────────────────────────────
   (넓게 잡지 않습니다 — 헛것을 잡는 점검은 안 잡는 점검보다 나쁩니다 · 8번)
     ⓪ <b>다섯 화면이 app/ui.css 를 부르나</b>
     ① --t- 토큰이 <b>두 파일을 통틀어 한 번만</b> 적혀 있나
     ② .t- · .tz- 규칙 안에 <b>하드코딩 hex</b> 가 섞였나
     ③ 홈 코드에 <b>새 저장 호출</b>(.insert/.update/.upsert/.delete)이 생겼나

   ── ⚠ 2026-09-24 · <b>보는 파일이 둘이 되었습니다</b> ──────────────
   여태 app/index.html 한 파일만 읽었습니다. 그런데 토큰과 .t- 클래스는
   <b>app/ui.css</b> 로 옮겼습니다(#439 로 그 파일이 들어온 지 세 판이
   지나도록 아무도 안 불러 두 벌인 채였습니다).
   ★ <b>느슨해진 것이 아니라 조여졌습니다.</b> 예전에는 「index.html 안에
     두 번 적혔나」 만 봤는데, 이제 <b>두 파일을 통틀어</b> 봅니다 —
     ui.css 에 있는데 index.html 에 또 적으면 그 자리에서 걸립니다.
   ★ <b>.tz- 다섯</b>은 index.html 에 남습니다. 홈 카드 스택 전용이고
     var(--shadow-blue)·var(--t2) 처럼 그 파일의 변수를 쓰기 때문입니다.
     ui.css 로 옮기면 ui.css 가 제 힘으로 못 섭니다. 그래서 <b>.t- 는
     ui.css 에서, .tz- 는 index.html 에서</b> 찾습니다.                  */
const fs = require('fs');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync('app/index.html', 'utf8');
const CSS = fs.readFileSync('app/ui.css', 'utf8');
const BOTH = SRC + '\n' + CSS;

console.log('\n[0] <b>다섯 화면이 app/ui.css 를 부르나</b>');
/* 옷을 파일로 빼 놓고 아무도 안 부르면, 그 파일은 <b>있으나 마나</b>입니다.
   실제로 #439 로 들어온 뒤 세 판 동안 다섯 파일 모두 0 이었습니다.       */
const PAGES = [['app/index.html', 'ui.css'], ['app/day.html', 'ui.css'],
               ['app/finance.html', 'ui.css'], ['app/ba.html', 'ui.css'],
               ['db-crm.html', 'app/ui.css']];
const noLink = PAGES.filter(([f, href]) =>
  !new RegExp('<link[^>]+href=["\']' + href.replace('.', '\\.') + '["\']').test(fs.readFileSync(f, 'utf8')));
is(noLink.length === 0, '  다섯 화면이 <b>모두</b> ui.css 를 부른다' +
   (noLink.length ? (' ← 안 부른다: ' + noLink.map(x => x[0]).join(' ')) : ''));

/* 토큰 열둘 — 사장님이 주신 그대로. <b>여기 적어 두는 것이 자(尺)</b>입니다 */
const TOKENS = ['--t-ink', '--t-sub', '--t-sub2', '--t-line', '--t-bg', '--t-card',
                '--t-point', '--t-point-l', '--t-pos', '--t-warn', '--t-neg',
                '--t-r', '--t-r-btn', '--t-r-sm'];
/* ⚠ <b>.tz- 를 빠뜨렸다가 되돌리기에서 걸렸습니다.</b> 홈 카드 스택의
   옷은 .tz- 라, 여기 안 적으면 거기에 hex 를 적어도 조용했습니다 —
   안 울리는 알람은 알람이 아닙니다 (8번).                             */
const CLASSES = ['t-card', 't-btn', 't-h1', 't-sub', 't-row', 't-chip', 't-sheet', 't-pad',
                 'tz', 'tz-greet', 'tz-hero', 'tz-hc', 'tz-done'];

console.log('\n[1] --t- 토큰이 <b>한 곳에만</b> 있나 (5번)');
/* <b>정의</b>만 셉니다 — 「--t-ink:」 처럼 뒤에 콜론이 오는 자리.
   var(--t-ink) 처럼 <b>쓰는</b> 자리는 여러 곳이어야 정상입니다. */
const defs = {};
TOKENS.forEach(t => {
  const re = new RegExp(t.replace(/-/g, '\\-') + '\\s*:', 'g');
  defs[t] = (BOTH.match(re) || []).length;      /* 두 파일을 <b>통틀어</b> 센다 */
});
const missing = TOKENS.filter(t => defs[t] === 0);
const twice = TOKENS.filter(t => defs[t] > 1);
is(missing.length === 0, '  토큰 <b>' + TOKENS.length + '개</b>가 다 있다' +
   (missing.length ? (' ← 없다: ' + missing.join(' ')) : ''));
is(twice.length === 0, '  <b>두 번 적힌 토큰이 없다</b>' +
   (twice.length ? (' ← ' + twice.map(t => t + '(' + defs[t] + '번)').join(' ')) : '') +
   ' — 두 곳에 있으면 한쪽만 고쳐져 화면마다 다른 파랑이 된다');
/* 블록 자체가 하나인가 — :root 가 여럿이어도 --t- 를 담은 것은 하나여야 한다 */
const roots = (BOTH.match(/:root\s*\{[^}]*--t-ink\s*:/g) || []).length;
is(roots === 1, '  --t- 를 담은 <b>:root 블록이 하나</b>다 — ' + roots + '개');

console.log('\n[2] .t- 클래스 안에 <b>하드코딩 hex</b> 가 섞였나');
/* ⚠ <b>좁게 잡습니다</b> (8번). 파일 전체에서 hex 를 세면 45,000줄에
   수백 개가 나옵니다 — 그건 이 점검이 볼 자리가 아닙니다. <b>.t- 로
   시작하는 규칙 안</b>만 봅니다. 그림자의 rgba 는 색 토큰이 아니라
   <b>그림자</b>라 셈에서 뺍니다 — 토큰에 그림자가 없습니다.         */
/* .t- 는 <b>ui.css</b> 에서, .tz- 는 <b>index.html</b> 에서 찾습니다 */
const rules = [];
CLASSES.forEach(c => {
  const where = /^tz/.test(c) ? SRC : CSS;
  const re = new RegExp('^\\.' + c + '(?![a-z0-9-])[^{]*\\{([^}]*)\\}', 'gm');
  let m;
  while ((m = re.exec(where)) !== null) rules.push({ c: c, body: m[1] });
});
is(rules.length >= CLASSES.length,
   '  여덟 클래스 규칙을 <b>' + rules.length + '개</b> 찾았다');
const dirty = rules.filter(r => /#[0-9A-Fa-f]{3,8}\b/.test(r.body));
is(dirty.length === 0, '  <b>hex 를 직접 적은 자리가 없다</b>' +
   (dirty.length ? (' ← .' + dirty[0].c + ' : ' + (dirty[0].body.match(/#[0-9A-Fa-f]{3,8}/) || [''])[0]) : '') +
   ' — 적으면 토큰을 고쳐도 그 자리만 옛 색으로 남는다');
/* ⚠ 처음엔 <b>「토큰 쓰는 규칙이 여섯 개 이상」</b> 이라고 썼는데, 규칙이
   스무 개라 <b>하나를 걷어내도 안 울렸습니다</b> — 되돌려 보고 알았습니다 (8번).
   그래서 <b>색을 다루는 자리마다</b> 봅니다: color · background · border
   값은 토큰이거나, 색이 아닌 말(none·transparent·inherit·0·solid…)이어야
   합니다. hex 만 보면 <code>color:black</code> 이 그대로 지나갑니다.
   ★ <b>그림자(box-shadow)는 뺍니다</b> — 토큰에 그림자가 없어, 넣으면
     못 지킬 것을 재는 것이 됩니다. 헛것은 안 잡는 것보다 나쁩니다 (8번). */
const SAFE = /^(none|transparent|inherit|initial|currentcolor|unset|0|auto|50%)$/i;
const colorBad = [];
rules.forEach(r => {
  r.body.split(';').forEach(d => {
    const i = d.indexOf(':'); if (i < 0) return;
    const prop = d.slice(0, i).trim().toLowerCase();
    if (!/^(color|background|background-color|border|border-color|border-top|border-bottom)$/.test(prop)) return;
    const val = d.slice(i + 1).trim();
    if (/var\(--/.test(val)) return;                 /* 토큰을 쓴다 — 좋다 */
    const words = val.split(/\s+/).filter(w => !/^(1px|2px|3px|4px|solid|dashed|dotted)$/i.test(w));
    if (words.every(w => SAFE.test(w))) return;      /* 색이 아닌 말뿐이다 */
    colorBad.push('.' + r.c + ' { ' + prop + ':' + val + ' }');
  });
});
is(colorBad.length === 0,
   '  <b>색을 다루는 자리는 모두 토큰</b>이다' + (colorBad.length ? (' ← ' + colorBad[0]) : '') +
   ' — 토큰을 안 쓰면 그 자리만 옛 색으로 남는다');

console.log('\n[3] 홈에 <b>새 저장 호출</b>이 생겼나');
/* 사장님 말씀 — 「홈에 저장 코드를 새로 짜지 마십시오. 기존 화면·기존
   함수를 부르기만 하십시오. <b>두 벌이 되는 순간 데이터가 깨집니다</b>」.
   ★ <b>renderHome 안</b>만 봅니다. 홈에서 부르는 기존 함수(hdbSave 등)는
     제 자리에 그대로 있어야 하고, 그것까지 잡으면 헛것입니다 (8번). */
/* ⚠ <b>renderHome 만 보다가 되돌리기에서 걸렸습니다.</b> 홈 카드를
   hmToss* 함수로 빼는 순간 거기 넣은 저장 호출이 <b>조용히 지나갔습니다</b>.
   홈을 그리는 함수는 <b>renderHome 하나가 아닙니다</b> — 이름으로 모읍니다 (8번). */
const HOME_FN = ['renderHome'];
(SRC.match(/function\s+(hmToss[A-Za-z0-9_]*)\s*\(/g) || [])
  .forEach(m => HOME_FN.push(m.replace(/function\s+/, '').replace(/\s*\($/, '')));
const cut = (name) => {
  const i = SRC.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const rest = SRC.slice(i), e = rest.search(/\n\}/);
  return e > 0 ? rest.slice(0, e) : rest;
};
const i0 = SRC.indexOf('function renderHome(');
is(i0 >= 0 && HOME_FN.length >= 5,
   '  홈을 그리는 함수 <b>' + HOME_FN.length + '개</b>를 다 본다 — ' + HOME_FN.join(' '));
let home = HOME_FN.map(cut).join('\n');
const SAVE = /\.(insert|update|upsert|delete)\s*\(/g;
const hits = home.match(SAVE) || [];
is(hits.length === 0, '  홈이 <b>스스로 저장하지 않는다</b>' +
   (hits.length ? (' ← ' + hits.join(' ')) : '') +
   ' — 저장은 원래 함수에 맡긴다 (5번)');
is(!/osClient\s*\(\s*\)\s*\./.test(home),
   '  홈이 <b>서버를 직접 잡지 않는다</b> — 잡는 순간 저장 자리가 두 벌이 된다');

/* ══════════════════════════════════════════════════════════════════
   [4] <b>새로 여는 인쇄 창도 같은 옷을 입나</b>
   ──────────────────────────────────────────────────────────────────
   인쇄는 window.open('','_blank') 로 <b>빈 창</b>을 열고 document.write
   로 글을 써 넣습니다. 그 창의 주소는 <b>about:blank</b> 라, 상대 경로
   href="ui.css" 가 <b>안 잡힙니다</b>.

   ⚠ <b>여기서 실제로 났던 일</b> — 법인 덱 인쇄(bizDeckPrint)가
     var(--t4)·var(--t3)·var(--t5)·var(--t6) 을 쓰고 있었는데, 그 창에는
     글자 계단이 <b>없습니다</b>(app/index.html 의 :root 에만 있습니다).
     값이 없으면 font-size 는 <b>물려받은 크기</b>가 됩니다 — 재어 보니
     꼬리말이 13px 이어야 하는데 <b>16px</b> 로 나갔습니다. A4 한 장
     높이가 고정(209mm)이고 넘치면 잘라 내므로, <b>맨 아래 줄이 종이에서
     사라질 수 있습니다.</b> 고객에게 드리는 종이입니다.
   ★ 그래서 인쇄 창은 모두 <b>printHeadCss()</b> 한 곳을 지납니다.       */
console.log('\n[4] <b>새로 여는 인쇄 창도 같은 옷을 입나</b>');
const OPENS = (SRC.match(/window\.open\(''\s*,\s*'_blank'\)/g) || []).length;
is(OPENS >= 5, '  빈 창을 여는 자리를 <b>' + OPENS + '군데</b> 찾았다');
/* 창을 여는 자리마다, 그 뒤 document.write 까지 사이에 printHeadCss 가 있나 */
const miss = [];
let at = 0;
for (;;) {
  const i = SRC.indexOf("window.open('','_blank')", at);
  if (i < 0) break;
  at = i + 10;
  const seg = SRC.slice(i, i + 4000);
  const w = seg.indexOf('document.write');
  if (w < 0) continue;                       /* 글을 안 쓰는 창은 옷도 필요 없다 */
  const head = seg.slice(0, seg.indexOf('</head>') > 0 ? seg.indexOf('</head>') : w + 3000);
  if (head.indexOf('printHeadCss()') < 0) {
    /* 어느 함수인지 이름으로 말한다 — 줄 번호는 금방 낡는다 */
    const before = SRC.slice(0, i), m = before.match(/function\s+(\w+)\s*\([^)]*\)\s*\{(?![\s\S]*function\s+\w+\s*\()/);
    miss.push((m ? m[1] : ('줄 ' + (before.split('\n').length))));
  }
}
is(miss.length === 0, '  글을 써 넣는 창이 <b>모두 printHeadCss() 를 지난다</b>' +
   (miss.length ? (' ← 안 지나감: ' + miss.join(' ')) : ''));
is((SRC.match(/function\s+printHeadCss\s*\(/g) || []).length === 1,
   '  그 옷을 입히는 곳이 <b>한 곳</b>이다 — 두 곳이면 한쪽만 고쳐진다 (5번)');
/* 계단 값을 <b>숫자로 적어 두지 않았나</b> — 적으면 계단을 고칠 때 여기만 늙는다 */
const ph = (SRC.split('function printHeadCss(')[1] || '').slice(0, 900);
is(/getPropertyValue\('--t'/.test(ph),
   '  계단을 <b>살아 있는 값에서 읽는다</b> — 숫자를 적어 두면 이 창만 옛 값으로 남는다 (5번)');
is(!/--t[1-6]\s*:\s*\d/.test(ph),
   '  계단 숫자를 <b>여기 적어 두지 않았다</b>');

/* ══════════════════════════════════════════════════════════════════
   [5] <b>누르는 것이 44px 이상인가</b> (철칙)
   ──────────────────────────────────────────────────────────────────
   사장님은 폰에서 쓰십니다. 44px 아래는 손가락이 빗나갑니다.
   ★ 넓게 잡지 않습니다 — <b>실제로 누르는 클래스만</b> 셉니다. 글자
     조각(.t-row .av 같은 것)까지 세면 헛것이 됩니다 (8번).            */
console.log('\n[5] <b>누르는 것이 44px 이상인가</b> (철칙)');
const TAP = ['t-btn', 't-gb', 't-chip', 't-row', 't-tabbar'];
const small = [];
TAP.forEach(c => {
  /* 그 클래스로 <b>시작하는</b> 규칙만 본다 — 안쪽 조각은 누르는 것이 아니다 */
  /* 규칙은 줄 <b>맨 앞</b>에서 시작합니다. 앞 규칙의 } 만 찾으면 주석
     뒤에 오는 규칙을 통째로 놓칩니다 — 실제로 다섯 중 넷을 놓쳤습니다. */
  const re = new RegExp('^\\.' + c + '(\\.[a-z-]+)?\\s*\\{([^}]*)\\}', 'gm');
  let m, seen = false;
  while ((m = re.exec(CSS))) {
    const body = m[2], h = /(?:^|;|\s)(?:min-)?height\s*:\s*(\d+(?:\.\d+)?)px/.exec(body);
    if (!h) continue;
    seen = true;
    if (parseFloat(h[1]) < 44) small.push('.' + c + (m[1] || '') + ' ' + h[1] + 'px');
  }
  if (!seen) small.push('.' + c + ' (높이를 안 정했다)');
});
is(small.length === 0, '  누르는 <b>' + TAP.length + '가지</b>가 모두 44px 이상이다' +
   (small.length ? (' ← ' + small.join(' · ')) : ''));

/* ══ [6] 폰 껍데기 — <b>화면 밖의 색도 토큰과 같아야 한다</b> ═══════════
   2026-09-25 · 사장님이 폰에서 「디자인이 다른데 색상도」 하셨습니다.
   제 자(430px 헤드리스)로는 홈이 목업과 95% 맞는데도요.

   <b>화면 밖이었습니다.</b> 폰은 CSS 말고도 색을 세 군데서 읽습니다 —

     ① `<meta name="theme-color">`  안드로이드가 <b>주소창·상태바</b>를 칠한다
     ② webmanifest `theme_color`     아이콘으로 열었을 때 같은 자리
     ③ webmanifest `background_color` 앱이 뜨기 <b>전</b> 첫 판(splash)

   띠를 밝게 바꾼 뒤에도 ①②에 <b>옛 파랑 #1b64da</b> 가 남아 있었습니다 —
   #455 에서 33군데를 토큰으로 모으며 걷어낸 그 파랑입니다. CSS 가 아니라
   못 보고 지나갔습니다. ③은 <b>#0D1117</b>(거의 검정)이라, 아이콘을 누르면
   까만 판이 한 번 번쩍이고 밝은 앱이 떴습니다.

   ★ 여기는 <b>hex 를 적을 수밖에 없는 자리</b>입니다 — meta 와 JSON 은
     var(--t-card) 를 못 읽습니다. 그래서 <b>두 벌이 되는 것을 막는 대신,
     두 벌이 어긋나는 것을 잡습니다</b>: ui.css 의 토큰에서 값을 읽어 와
     견줍니다. 토큰을 바꾸면 여기가 울립니다 (5번).
   ★ <b>아이폰 상태바</b>도 같이 봅니다. black-translucent 는 화면이 상태바
     밑까지 올라가고 시계·배터리가 <b>흰 글씨</b>로 뜹니다 — 흰 띠 위에서는
     시계가 안 보입니다.                                                  */
console.log('\n[6] <b>폰 껍데기</b>(주소창 · splash · 상태바)가 화면과 같은 색인가');
const tok = (n) => { const m = new RegExp('--' + n + '\\s*:\\s*([#A-Za-z0-9]+)').exec(CSS); return m ? m[1].toUpperCase() : ''; };
const CARD = tok('t-card'), BG = tok('t-bg');
const MF = JSON.parse(fs.readFileSync('app/manifest.webmanifest', 'utf8'));
const meta = (n) => { const m = new RegExp('<meta name="' + n + '" content="([^"]*)"').exec(SRC); return m ? m[1] : ''; };
const themeMeta = (meta('theme-color') || '').toUpperCase();
const themeMf = (MF.theme_color || '').toUpperCase();
const bgMf = (MF.background_color || '').toUpperCase();
const bar = meta('apple-mobile-web-app-status-bar-style');
is(!!CARD && !!BG, '  ui.css 에서 자를 읽었다 — 카드 ' + CARD + ' · 바탕 ' + BG);
is(themeMeta === CARD,
   '  <b>주소창 색</b>(meta theme-color)이 맨 위 띠와 같다 — ' + themeMeta + ' = ' + CARD +
   (themeMeta === CARD ? '' : ' ← 폰에서 띠 위에 다른 색 줄이 하나 더 생깁니다'));
is(themeMf === CARD,
   '  <b>아이콘으로 열 때</b>도 같은 색이다 (webmanifest theme_color) — ' + themeMf +
   (themeMf === CARD ? '' : ' ← manifest 만 옛 색으로 남기 쉽습니다'));
is(bgMf === BG,
   '  <b>뜨기 전 첫 판</b>(splash)이 앱 바탕과 같다 — ' + bgMf + ' = ' + BG +
   (bgMf === BG ? '' : ' ← 어두우면 아이콘을 누를 때마다 까만 판이 번쩍입니다'));
is(bar !== 'black-translucent',
   '  <b>아이폰 상태바</b>가 흰 글씨로 안 뜬다 — 「' + bar + '」' +
   (bar === 'black-translucent' ? ' ← 흰 띠 위에 흰 시계라 안 보입니다' : ''));
/* 걷어낸 파랑이 <b>어디에도</b> 안 남았는가 — CSS 가 아닌 파일까지.
   ⚠ <b>주석은 빼고 봅니다.</b> 안 그러면 「옛 파랑 #1b64da 를 걷어냈다」 고
     적어 둔 <b>그 글</b>을 제가 잡습니다 — 실제로 그렇게 울렸습니다.
     점검은 글이 아니라 <b>사는 코드</b>를 봐야 합니다 (8번).            */
/* 주석과 <b>APP_BUILD_NOTE</b>(사장님께 보여 드리는 쪽지)를 뺍니다 — 둘 다
   <b>글</b>이지 색을 정하는 자리가 아닙니다. 쪽지에 「걷어낸 파랑」 을
   설명하려고 그 값을 적으면 여기가 울렸습니다. */
const noCmt = (t) => t.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ')
                      .replace(/^var APP_BUILD_NOTE=.*$/m, ' ');
const oldBlue = ['app/index.html', 'app/manifest.webmanifest', 'app/day.webmanifest', 'app/team.webmanifest']
  .filter(f => { try { return /#1b64da/i.test(noCmt(fs.readFileSync(f, 'utf8'))); } catch (e) { return false; } });
is(oldBlue.length === 0, '  걷어낸 파랑 <b>#1B64DA</b> 가 한 자리도 안 남았다' +
   (oldBlue.length ? ' ← ' + oldBlue.join(' · ') : ''));

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 토큰은 한 곳에 · 색은 토큰으로 · 인쇄 창도 같은 옷 · 손가락은 44px · 폰 껍데기도 같은 색.');
process.exit(bad ? 1 : 0);
