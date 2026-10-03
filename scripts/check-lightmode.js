/* ══════════════════════════════════════════════════════════════════
   check-lightmode.js — <b>화면은 무조건 흰색 고정이다.</b>

   2026-09-30. 사장님이 폰에서 보시고 <b>「핸드폰은 블랙인데」</b>.
   재어 보니 화면 평균 밝기가 <b>242 → 34/255</b> 로 뒤집혀 있었습니다.
   까닭은 이 앱이 <b>제가 밝은 화면이라고 말한 적이 없어서</b>입니다 —
   그러면 폰이 다크일 때 브라우저가 제멋대로 뒤집어 칠합니다.

   ── 2026-10-03 · <b>이 자가 뒤집혔습니다</b> ──────────────────────
   사장님 말씀 <b>「화면은 무조건 흰색 고정으로 가자. 테마가 바뀌면 안 되니까」</b>.
   여태 이 자는 <b>「진짜 다크를 갖춘 문서에는 밝다고 박지 말라」</b> 고
   보았습니다 — 다크를 가진 화면은 다크로 두는 것이 맞다고 제가 판단했기
   때문입니다. <b>사장님이 다르게 정하셨습니다.</b> 이제 묻는 것은
   <b>「어느 화면도 테마가 안 바뀌는가」</b> 입니다.

   ★ <b>다크 CSS 를 지우지 않았습니다.</b> 열 문서가 다크 한 벌을 갖고 있고
     그것은 전부 <b>:root:not([data-theme="light"])</b> 로 가려져 있습니다.
     그래서 <b>&lt;html data-theme="light"&gt;</b> 한 번만 못 박으면 꺼집니다.
     되돌리실 날이 오면 그 한 자리만 떼면 됩니다 (★ 함수를 지우지 않는다).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ HTML <b>전부</b>가 &lt;html data-theme="light"&gt; 를 박았다 —
         <b>면제 없습니다</b>(옛 판에는 다크 문서 면제가 있었습니다)
     [2] ★★ 전부 <b>밝다고 밝혔다</b> — meta 나 CSS 로. 안 밝히면 브라우저가
         제멋대로 뒤집습니다
     [3] ★★ 다크 블록에 <b>가림막</b>이 있다 — :not([data-theme="light"]).
         가림막이 없으면 못 박아도 <b>그 블록만</b> 깔립니다
     [4] 선언이 <b>&lt;head&gt; 안</b>이고, 본체는 <b>meta 와 :root 두 곳</b>이다
     [5] ★★★ <b>폰을 다크로 켜 놓고 재어, 밝은 모드와 같은 색인가</b> —
         이것이 이 판의 핵심입니다. 글자만 맞고 안 먹는 일이 있습니다
     [6] ★★ <b>뽑아내는 문서 27곳</b>도 흰색이다 — 제안서·상담카드·명함처럼
         앱이 <b>제 손으로 세우는</b> 문서. 고객이 받는 종이라 제일 중요합니다

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   <b>크롬의 자동 다크</b>(설정에서 켜는 forceDarkMode)는 color-scheme 을
   <b>아예 무시하는</b> 더 센 스위치라 이 자로 막을 수 없습니다. 그것까지
   꺼졌는지는 <b>사장님 폰에서</b> 확인해야 합니다 — 「자가 초록이니 됐다」
   로 넘기지 마십시오 (1번).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9107;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* HTML 을 <b>하나도 빠짐없이</b> 찾습니다 — 손으로 적으면 새 화면이 샙니다.
   ★ 옛 판은 뿌리와 app 한 겹만 보았습니다. 그러면 app/상담자료/미끼레이더 나
     trading · brief · analyst · docs 가 <b>그물 밖</b>이라, 거기서 테마가
     바뀌어도 아무도 못 봅니다. 전부 봅니다 (8번).                       */
const 문서 = [];
(function 훑기(d) {
  let ls = []; try { ls = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const it of ls) {
    const p = path.join(d, it.name);
    if (it.isDirectory()) { if (it.name !== 'node_modules' && it.name[0] !== '.') 훑기(p); }
    else if (it.name.endsWith('.html')) 문서.push(path.relative(ROOT, p));
  }
})(ROOT);

const 읽기 = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };
/* ★ 2026-10-03 · <b>이 자가 안 울었습니다.</b> 되돌림 시험에서 app/day.html 의
   &lt;html&gt; 에서 못을 뽑았는데도 [1] 이 그대로 초록이었습니다. 까닭은 같은
   파일 34줄 <b>주석</b>에 설명으로 적어 둔 글자 &lt;html data-theme="light"&gt; 를
   이 자가 집어 세었기 때문입니다. <b>글 아무 데서나 찾으면 주석이 알리바이가
   됩니다</b> — 안 울리는 알람은 알람이 아닙니다 (CLAUDE.md 8번).
   이제 <b>문서의 첫 &lt;html&gt; 태그 안</b>에서만 찾습니다.               */
const 뿌리태그 = s => { const m = s.match(/<html(?=[\s>])[^>]*>/i); return m ? m[0] : ''; };
const 못박음 = s => /\sdata-theme\s*=\s*["']light["']/i.test(뿌리태그(s));
/* ★ 「light dark」 를 거릅니다 — 둘 다 지원한다고 말하면 폰이 다크로 뒤집습니다. */
const CSS꼴  = s => /color-scheme\s*:\s*light(?!\s*dark)/i.test(s);
const META꼴 = s => /<meta[^>]*name=["']color-scheme["'][^>]*content=["']\s*light\s*["'][^>]*>/i.test(s)
                 || /<meta[^>]*content=["']\s*light\s*["'][^>]*name=["']color-scheme["'][^>]*>/i.test(s);
const 밝다함  = s => CSS꼴(s) || META꼴(s);
const head    = s => { const m = s.match(/<head[\s\S]*?<\/head>/i); return m ? m[0] : ''; };
/* 다크 블록마다 <b>가림막</b>이 붙었나 — 블록 머리에서 140자를 봅니다.
   선택자가 그 안에 오기 때문입니다(:root:not(…) · html:not(…)).        */
const 가림막없는블록 = s => {
  const re = /@media[^{]*prefers-color-scheme[^{]*dark[^{]*\{[\s\S]{0,160}/gi;
  let m, n = 0;
  while ((m = re.exec(s))) if (!/:not\(\[data-theme=["']light["']\]\)/i.test(m[0])) n++;
  return n;
};

console.log('\n[1] ★★ HTML ' + 문서.length + '개 <b>전부</b>가 data-theme="light" 를 박았다 (면제 없음)');
const 안박음 = 문서.filter(f => !못박음(읽기(f)));
is(안박음.length === 0,
   '  <b>' + (문서.length - 안박음.length) + '개</b>가 못 박혀 있다' +
   (안박음.length ? ('\n      ✗ 안 박은 것 ' + 안박음.length + '개 — 폰 다크에서 테마가 바뀝니다:\n         '
     + 안박음.join('\n         ')) : ''));

console.log('\n[2] ★★ 전부 <b>밝다고 밝혔다</b> — 안 밝히면 브라우저가 제멋대로 뒤집습니다');
const 벌거벗음 = 문서.filter(f => !밝다함(읽기(f)));
is(벌거벗음.length === 0,
   '  <b>' + (문서.length - 벌거벗음.length) + '개</b>가 밝다고 밝혔다' +
   (벌거벗음.length ? ('\n      ✗ 아무 말도 안 한 것 ' + 벌거벗음.length + '개:\n         '
     + 벌거벗음.join('\n         ')) : ''));

console.log('\n[3] ★★ 다크 블록에 <b>가림막</b>이 있다 — 없으면 못 박아도 그 블록만 깔립니다');
const 다크문서 = 문서.filter(f => /prefers-color-scheme/i.test(읽기(f)));
const 샌것 = 다크문서.map(f => [f, 가림막없는블록(읽기(f))]).filter(x => x[1] > 0);
is(샌것.length === 0,
   '  다크 한 벌을 가진 문서 <b>' + 다크문서.length + '개</b>가 다 가려져 있다' +
   (샌것.length ? (' ← ' + 샌것.map(x => x[0] + '(' + x[1] + '곳)').join(' · ')) : ''));
is(다크문서.length > 0,
   '  ★ 다크 CSS 를 <b>지우지 않았다</b> — ' + 다크문서.length + '개에 그대로 있습니다(끄기만 했습니다)');

console.log('\n[4] 선언이 <b>머리에</b> 있고, 본체는 <b>두 곳</b>이다');
/* ⚠ <b>&lt;/head&gt; 를 안 닫은 문서가 넷</b> 있습니다(미끼레이더 둘 · docs 둘).
   그 넷은 &lt;meta&gt; 로 바로 시작하던 조각이라 뼈대를 세워 주었고, 닫는 태그는
   파서가 알아서 넣습니다. 그래서 「&lt;head&gt;…&lt;/head&gt; 안에 있나」 로 보면
   <b>멀쩡한 문서가 울립니다</b> — 처음에 그렇게 울렸습니다 (8번).
   ★ 묻는 것을 <b>「몸이 시작되기 전에 있나」</b> 로 바꿉니다 — 그것이 머리라는
     뜻이고, 브라우저가 실제로 head 에 넣는 조건입니다. 브라우저에 직접
     물어보는 것은 아래 [5] 가 합니다.                                   */
const 머리밖 = 문서.filter(f => { const s = 읽기(f);
  if (!META꼴(s)) return false;
  const i = s.search(/<meta[^>]*color-scheme/i), bodyAt = s.search(/<body[\s>]/i);
  if (i < 0) return true;
  return bodyAt >= 0 && i > bodyAt; });
is(머리밖.length === 0, '  meta 를 쓴 문서가 다 <b>몸 시작 전</b>에 적었다'
   + (머리밖.length ? (' ← ' + 머리밖.join(' · ')) : ''));
const APP = 읽기('app/index.html');
is(META꼴(APP), '  본체에 &lt;meta name="color-scheme" content="light"&gt; 가 있다 — CSS 보다 <b>먼저</b> 읽힙니다');
is(/:root\s*\{[^}]*color-scheme\s*:\s*light/i.test(APP), '  본체 :root 에도 <b>color-scheme:light</b> 가 있다');

/* ══ [6] <b>뽑아내는 문서</b>도 흰색이다 ════════════════════════════
   화면 55개만 못 박아 놓고 끝내면 <b>고객이 받는 종이가 샙니다.</b> 이 앱은
   window.open · document.write · srcdoc · 서버 응답으로 <b>제 손으로 문서를
   세우는 자리가 27곳</b> 있습니다 — 제안서 · 상담카드 · 치료비 지급지도 ·
   배서 안내서 · 사용가이드 · 명함 · 링크 페이지…
   그 문서들은 ui.css 가 없어 가림막이 안 듣고, <b>제 머리에 직접</b>
   「나는 밝다」 를 적어야 합니다.

   ★ <b>주석에 적힌 글자는 뺍니다.</b> 빗금별표 주석 속의 &lt;html …&gt; 은
     설명이지 문서가 아닙니다. 이것을 안 빼서 <b>[1] 이 안 울었습니다</b> —
     app/day.html 주석에 설명으로 적어 둔 글자가 <b>알리바이</b>가 되었습니다.
     뽑는 자리도 같은 함정에 들 수 있어 미리 말해 둡니다.
   ★ <b>scripts/ 는 뺍니다</b> — 점검이 재려고 세우는 견본입니다.
   ★ <b>줄어들면 빨간불</b>입니다(기준선 27). 문서 하나를 주석으로 가려
     그물 밖으로 내보낼 수 없게 막습니다 (8번).                        */
console.log('\n[6] ★★ <b>뽑아내는 문서</b>도 흰색 고정이다 — 고객이 받는 종이입니다');
const 소스 = [];
(function 훑기2(d) {
  let ls = []; try { ls = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const it of ls) {
    const p = path.join(d, it.name);
    if (it.isDirectory()) { if (it.name !== 'node_modules' && it.name !== 'scripts' && it.name[0] !== '.') 훑기2(p); }
    else if (/\.(html|js)$/.test(it.name)) 소스.push(path.relative(ROOT, p));
  }
})(ROOT);
/* ★★ <b>주석 칸을 세어 빼려다 산 문서 하나를 놓쳤습니다.</b> 3.1MB 짜리
   HTML+JS 를 글자로 훑으면 <b>CSS 글 속의 빗금별표</b>가 주석을 여는 것처럼
   보여, 그 안에 든 명함 만들기(app/index.html)가 <b>그물 밖으로 샜습니다</b>.
   기준선 27 이 그것을 잡았습니다 — 그래서 바닥을 둡니다.
   이제 <b>칸을 세지 않고</b>, 설명으로 적어 둔 글자 <b>둘을 이름으로</b>
   빼 줍니다. 새로 글을 적어 빨간불이 켜지면 여기 한 줄을 더하고
   <b>까닭을 함께</b> 적으십시오 (8번: 예외는 코드에 한 줄 적어 빠져나간다). */
const 글자뿐 = [
  ['app/day.html',     '<html data-theme="light">',
   '주석 — 「가림막이 없어 이 한 줄만 어둡게 깔렸다」 를 설명하는 글'],
  ['app/index.html',   '<HTML>',
   '주석 — 프록시가 돌려주는 Inactivity Timeout 쪽을 그대로 옮긴 글'],
];
const 쓴예외 = {};
const 뽑는문서 = [], 주석말 = [];
for (const f of 소스) {
  const s = 읽기(f), ms = [...s.matchAll(/<html(?=[\s>])[^>]*>/gi)];
  for (let i = 0; i < ms.length; i++) {
    if (f.endsWith('.html') && i === 0) continue;        /* 제 뿌리는 [1] 이 봅니다 */
    const m = ms[i], ln = s.slice(0, m.index).split('\n').length, 자리 = f + ':' + ln;
    const 예외 = 글자뿐.filter(x => x[0] === f && x[1] === m[0])[0];
    if (예외) { 주석말.push(자리 + ' (' + 예외[2] + ')'); 쓴예외[예외[0] + ' ' + 예외[1]] = 1; continue; }
    const 머리 = s.slice(m.index, m.index + 600);
    뽑는문서.push({ at: 자리,
      못: /\sdata-theme\s*=\s*["']light["']/i.test(m[0]),
      밝: 밝다함(머리) });
  }
}
const 안못박 = 뽑는문서.filter(x => !x.못), 안밝 = 뽑는문서.filter(x => !x.밝);
is(뽑는문서.length >= 27,
   '  제 손으로 세우는 문서 <b>' + 뽑는문서.length + '곳</b>을 다 찾았다 (기준선 27 — 줄면 그물에서 뺀 것입니다)');
is(안못박.length === 0,
   '  전부 &lt;html data-theme="light"&gt; 를 박았다'
   + (안못박.length ? ('\n      ✗ ' + 안못박.map(x => x.at).join('\n      ✗ ')) : ''));
is(안밝.length === 0,
   '  전부 <b>제 머리에</b> 밝다고 적었다 — 뽑아낸 문서엔 ui.css 가 없어 가림막이 안 따라옵니다'
   + (안밝.length ? ('\n      ✗ ' + 안밝.map(x => x.at).join('\n      ✗ ')) : ''));
/* ★ <b>죽은 예외는 치웁니다</b> — 글이 바뀌어 안 쓰이는 면제가 남으면,
     다음 사람이 「여기는 봐 준다」 고 잘못 읽습니다.                   */
const 죽은예외 = 글자뿐.filter(x => !쓴예외[x[0] + ' ' + x[1]]);
is(죽은예외.length === 0, '  면제 ' + 글자뿐.length + '개가 다 <b>실제로 쓰였다</b> (죽은 면제가 없다)'
   + (죽은예외.length ? (' ← 안 쓰임: ' + 죽은예외.map(x => x[0] + ' ' + x[1]).join(' · ')) : ''));
console.log('  · 설명으로 적어 둔 글자 ' + 주석말.length + '곳은 뺐습니다:');
주석말.forEach(x => console.log('      · ' + x));
console.log('  · ★ [5] 는 브라우저를 기다리므로 <b>맨 아래</b>에 나옵니다');

/* ── 글자만 맞고 안 먹는 일이 있어, 브라우저에 물어봅니다 ───────────── */
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
             '.svg':'image/svg+xml' };
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  let p = path.join(ROOT, u);
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
/* 재는 화면 — <b>다크를 가졌던 것</b>을 다 넣고 본체·목각도 넣습니다 */
const 재는것 = ['app/index.html', 'app/day.html', 'app/team.html',
  'app/상담자료/자동차사고_과실분석.html', 'app/상담자료/미끼레이더/사용안내.html',
  'docs/guide/index.html', 'docs/manual/index.html',
  'trading/index.html', 'trading/bot.html', 'trading/todo.html',
  'brief/index.html', 'analyst/index.html'];
const 밝기 = c => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); if (!m) return null;
  return Math.round(0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]); };

(async () => {
  console.log('\n[5] ★★★ <b>폰을 다크로 켜 놓고 재어, 밝은 모드와 같은 색인가</b>');
  console.log('    (' + 재는것.length + '개 화면 · 다크를 가졌던 것을 다 넣었습니다)');
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const 잰것 = {};
  for (const scheme of ['light', 'dark']) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    for (const f of 재는것) {
      let o = null;
      try {
        await pg.goto('http://127.0.0.1:' + PORT + '/' + f, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await pg.waitForTimeout(f === 'app/index.html' ? 2200 : 450);
        o = await pg.evaluate(() => {
          const cs = getComputedStyle(document.body), hs = getComputedStyle(document.documentElement);
          const pick = v => (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') ? v : '';
          return { bg: pick(cs.backgroundColor) || pick(hs.backgroundColor) || '',
                   ink: cs.color, dm: window.matchMedia('(prefers-color-scheme: dark)').matches,
                   th: document.documentElement.getAttribute('data-theme') || '',
                   cs: hs.colorScheme || '',
                   /* ★ <b>meta 는 계산된 값에 안 나옵니다</b> — 브라우저에게만
                      하는 말입니다. 그래서 <b>정말 head 에 들어갔나</b>를 직접
                      묻습니다. 이것이 「머리에 있나」 의 참된 답입니다. */
                   meta: !!document.head.querySelector(
                     'meta[name="color-scheme"][content="light"]') };
        });
      } catch (e) { o = { err: String(e.message).slice(0, 40) }; }
      (잰것[f] = 잰것[f] || {})[scheme] = o;
    }
    await ctx.close();
  }
  await br.close(); srv.close();

  const 못읽음 = 재는것.filter(f => !잰것[f].light || 잰것[f].light.err || !잰것[f].dark || 잰것[f].dark.err);
  is(못읽음.length === 0, '  ' + 재는것.length + '개를 두 모드로 다 열었다'
    + (못읽음.length ? (' ← ' + 못읽음.join(' · ')) : ''));
  const 다크로봄 = 재는것.filter(f => 잰것[f].dark && 잰것[f].dark.dm).length;
  is(다크로봄 === 재는것.length,
    '  폰이 <b>다크 모드</b>인 상황을 만들었다 — ' + 다크로봄 + '/' + 재는것.length + '개가 그렇게 봅니다');
  /* ★★ <b>두 모드의 색이 같아야</b> 합니다 — 테마가 안 바뀐다는 뜻입니다 */
  const 갈린것 = 재는것.filter(f => { const a = 잰것[f].light, b = 잰것[f].dark;
    if (!a || !b || a.err || b.err) return false;
    return a.bg !== b.bg || a.ink !== b.ink; });
  is(갈린것.length === 0,
    '  ★★★ <b>두 모드의 바탕·글자 색이 똑같다</b> — 테마가 안 바뀝니다'
      + (갈린것.length ? ('\n      ✗ 갈린 것:\n         ' + 갈린것.map(f =>
          f + '  밝은 ' + 잰것[f].light.bg + ' → 다크 ' + 잰것[f].dark.bg).join('\n         ')) : ''));
  /* ★ 그리고 그 색이 <b>밝아야</b> 합니다 — 둘이 같은데 둘 다 어두우면 안 됩니다 */
  const 어두운것 = 재는것.filter(f => { const b = 잰것[f].dark;
    if (!b || b.err || !b.bg) return false;
    const v = 밝기(b.bg); return v !== null && v < 200; });
  is(어두운것.length === 0,
    '  ★★ 그 색이 <b>밝다</b>(바탕 200/255 이상)' +
    (어두운것.length ? (' ← ' + 어두운것.map(f => f + '(' + 밝기(잰것[f].dark.bg) + ')').join(' · '))
                     : ' — ' + 재는것.map(f => 밝기((잰것[f].dark || {}).bg)).filter(v => v !== null).join(' · ')));
  /* ⚠ <b>계산된 color-scheme 만 보면 멀쩡한 문서가 울립니다.</b>
     &lt;meta name="color-scheme"&gt; 는 <b>브라우저에게만</b> 하는 말이라
     getComputedStyle 에 안 나옵니다 — 처음에 열한 문서가 그래서 울렸습니다.
     ★ <b>둘 중 하나면 됩니다</b> — 계산된 값이 light 이거나, meta 가 정말
       head 에 들어가 있거나. 둘 다 없으면 브라우저가 제멋대로 뒤집습니다.
     ★ <b>「light dark」 는 탈입니다</b> — 둘 다 지원한다고 말하면 폰이 다크로
       뒤집습니다. 실제로 한 문서가 그렇게 적혀 있었고 이 줄이 잡았습니다. */
  const 안밝다함 = 재는것.filter(f => { const b = 잰것[f].dark;
    if (!b || b.err) return true;
    if (/dark/.test(b.cs)) return true;
    return !/light/.test(b.cs) && !b.meta; });
  is(안밝다함.length === 0,
    '  ★ 다크 모드에서도 <b>스스로 「나는 밝다」</b> 고 답한다 — 계산된 값 '
      + 재는것.filter(f => /light/.test((((잰것[f] || {}).dark) || {}).cs || '')).length + '개 · meta '
      + 재는것.filter(f => (((잰것[f] || {}).dark) || {}).meta).length + '개'
      + (안밝다함.length ? (' ← ' + 안밝다함.join(' · ')) : ''));
  const 안박힘 = 재는것.filter(f => { const b = 잰것[f].dark; return !b || b.err || b.th !== 'light'; });
  is(안박힘.length === 0, '  ★ 브라우저가 읽은 data-theme 이 <b>light</b> 다'
    + (안박힘.length ? (' ← ' + 안박힘.join(' · ')) : ''));

  console.log('\n' + '─'.repeat(30));
  console.log('⚠ <b>크롬의 자동 다크</b>(설정에서 켜는 것)는 color-scheme 을 아예 무시하는');
  console.log('  더 센 스위치라 이 자로 막을 수 없습니다 — <b>사장님 폰에서</b> 확인해야 합니다.');
  console.log('  「자가 초록이니 됐다」 로 넘기지 마십시오 (1번).');
  console.log(bad ? '✗ ' + bad + '개' : '✓ ' + 문서.length + '개 전부 흰색 고정이고, 폰을 다크로 켜도 색이 한 톨도 안 바뀝니다.');
  process.exit(bad ? 1 : 0);
})();
