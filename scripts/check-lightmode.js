/* ══════════════════════════════════════════════════════════════════
   check-lightmode.js — <b>「나는 밝은 화면이다」 라고 말했나.</b>

   2026-09-30. 사장님이 폰에서 보시고 <b>「핸드폰은 블랙인데」</b>.
   재어 보니 화면 평균 밝기가 <b>242 → 34/255</b> 로 뒤집혀 있었습니다.

   까닭은 이 앱이 <b>제가 밝은 화면이라고 말한 적이 없어서</b>입니다.
   그러면 폰이 다크 모드일 때 <b>브라우저가 제멋대로 뒤집어</b> 칠합니다
   (안드로이드 크롬의 자동 다크). 목각은 밝은 화면이니 <b>다크를 만드는
   것이 아니라 밝다고 밝히는 것</b>이 맞습니다 — 색은 한 톨도 안 바뀝니다.

   ★★ <b>정직하게 적습니다 — 이 자는 「안 뒤집힌다」 를 증명하지 못합니다.</b>
     크롬의 자동 다크는 <b>브라우저 쪽</b>에서 걸리는 것이라 헤드리스로는
     재현이 안 됩니다. --blink-settings=forceDarkModeEnabled 로 켜 보면
     그것은 <b>color-scheme 을 아예 무시하는</b> 더 센 스위치라, 고친
     뒤에도 똑같이 어둡게 나옵니다. 그걸로 「안 고쳐졌다」 고 읽으면
     틀립니다. 그래서 이 자는 <b>선언이 제자리에 있는지</b>만 봅니다.
     실제로 밝게 뜨는지는 <b>사장님 폰에서</b> 확인해야 합니다 (1번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 사람이 여는 HTML 마다 <b>밝다고 밝혔거나 · 진짜 다크가 있거나</b>
         둘 중 하나다 (목록을 손으로 안 적고 <b>파일에서 찾습니다</b>)
     [2] ★ <b>진짜 다크를 갖춘 문서에는 밝다고 박지 않았다</b> —
         박으면 그 화면의 다크가 망가집니다
     [3] 본체는 <b>&lt;meta&gt; 와 :root 두 곳</b>에 있다 — meta 는 CSS 보다
         먼저 읽혀 <b>첫 그림부터</b> 막습니다
     [4] 그 선언이 <b>&lt;head&gt; 안</b>에 있다 (밖에 있으면 안 읽힙니다)
     [5] 브라우저에서 <b>정말 먹었나</b> — 글자만 맞고 안 먹는 일이 있습니다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9107;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 사람이 여는 HTML 을 <b>파일에서 찾습니다</b> — 손으로 적으면 새 화면이 샙니다 */
const 문서 = [];
const 훑기 = (d, depth) => {
  let ls = []; try { ls = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const it of ls) {
    const p = path.join(d, it.name);
    if (it.isDirectory()) { if (depth > 0 && it.name !== 'node_modules' && it.name[0] !== '.') 훑기(p, depth - 1); }
    else if (it.name.endsWith('.html')) 문서.push(path.relative(ROOT, p));
  }
};
훑기(ROOT, 0);                       /* 뿌리 */
훑기(path.join(ROOT, 'app'), 1);     /* app 과 그 아래 한 겹 */

const 읽기 = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };
const 다크있음 = s => /prefers-color-scheme/.test(s);
/* ⚠ 처음에 이 그물이 <b>CSS 꼴만</b> 찾았습니다 — color-scheme:light.
   그런데 문서 서른 곳에 넣은 것은 <b>meta 꼴</b>입니다:
     &lt;meta name="color-scheme" content="light"&gt;
   그래서 다 넣어 놓고도 [1] 이 「아무 말도 안 했다」 고 울렸습니다.
   ★ 파일이 아니라 <b>자가 틀린 것</b>이었습니다. 두 꼴을 다 봅니다.   */
const CSS꼴  = s => /color-scheme\s*:\s*light/i.test(s);
const META꼴 = s => /<meta[^>]*name=["']color-scheme["'][^>]*content=["']\s*light\s*["'][^>]*>/i.test(s)
                 || /<meta[^>]*content=["']\s*light\s*["'][^>]*name=["']color-scheme["'][^>]*>/i.test(s);
const 밝다함  = s => CSS꼴(s) || META꼴(s);
const head    = s => { const m = s.match(/<head[\s\S]*?<\/head>/i); return m ? m[0] : ''; };

console.log('\n[1] 사람이 여는 HTML ' + 문서.length + '개 — <b>밝다고 밝혔거나 · 진짜 다크가 있거나</b>');
const 벌거벗음 = [], 다크 = [], 밝음 = [];
문서.forEach(f => { const s = 읽기(f);
  if (다크있음(s)) 다크.push(f); else if (밝다함(s)) 밝음.push(f); else 벌거벗음.push(f); });
is(벌거벗음.length === 0,
   '  밝다고 밝힌 문서 <b>' + 밝음.length + '개</b> · 진짜 다크를 갖춘 문서 <b>' + 다크.length + '개</b>' +
   (벌거벗음.length ? '\n      ✗ 아무 말도 안 한 문서 ' + 벌거벗음.length + '개 — 폰에서 뒤집힙니다:\n         ' +
     벌거벗음.join('\n         ') : ''));

console.log('\n[2] ★ <b>진짜 다크를 갖춘 문서에는 밝다고 박지 않았다</b>');
console.log('    (박으면 그 화면이 다크에서 망가집니다 — 넣는 것만큼 <b>안 넣는 것</b>도 지켜야 합니다)');
const 잘못박음 = 다크.filter(f => /<meta[^>]*name=["']color-scheme["'][^>]*content=["']\s*light\s*["']/i.test(읽기(f)));
is(잘못박음.length === 0,
   '  다크 문서 ' + 다크.length + '개(' + 다크.map(f => path.basename(f)).join(' · ') + ')에 <b>안 박았다</b>' +
   (잘못박음.length ? ' ← ' + 잘못박음.join(' · ') + ' 에 박혀 있습니다' : ''));

console.log('\n[3] 본체(app/index.html)는 <b>두 곳</b>에 적었다');
const APP = 읽기('app/index.html');
is(/<meta[^>]*name=["']color-scheme["'][^>]*content=["']\s*light\s*["'][^>]*>/i.test(APP),
   '  &lt;meta name="color-scheme" content="light"&gt; 가 있다 — CSS 보다 <b>먼저</b> 읽힙니다');
is(/:root\s*\{[^}]*color-scheme\s*:\s*light/i.test(APP),
   '  :root 에도 <b>color-scheme:light</b> 가 있다 — CSS 만 보는 자리를 위해');

console.log('\n[4] 그 선언이 <b>&lt;head&gt; 안</b>에 있다 (밖에 있으면 안 읽힙니다)');
const 밖에있음 = 밝음.filter(f => { const s = 읽기(f);
  if (!META꼴(s)) return false;               /* CSS 로만 적은 문서는 &lt;head&gt; 와 무관합니다 */
  const h = head(s);
  if (!h) return true;                        /* &lt;head&gt; 가 아예 없으면 그것도 탈입니다 */
  return !META꼴(h); });
is(밖에있음.length === 0,
   '  ' + 밝음.length + '개가 다 &lt;head&gt; 안에 있다' +
   (밖에있음.length ? ' ← ' + 밖에있음.join(' · ') + ' 는 밖에 있습니다' : ''));

/* ── 글자만 맞고 안 먹는 일이 있어, 브라우저에 물어봅니다 ───────────── */
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  let p = path.join(ROOT, u);
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

(async () => {
  console.log('\n[5] 브라우저에서 <b>정말 먹었나</b> — 폰이 다크 모드인 채로 물어봅니다');
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  /* 폰이 다크인 상황을 흉내 냅니다. 선언이 먹으면 <b>그래도 light</b> 여야 합니다 */
  const pg = await br.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(2200);
  const R = await pg.evaluate(() => ({
    쓴것: getComputedStyle(document.documentElement).colorScheme,
    폰이다크: window.matchMedia('(prefers-color-scheme: dark)').matches,
    몸바탕: getComputedStyle(document.body).backgroundColor,
  }));
  is(R.폰이다크, '  폰이 <b>다크 모드</b>인 상황을 만들었다');
  is(/light/.test(R.쓴것) && !/dark/.test(R.쓴것),
     '  그래도 이 화면은 <b>밝다</b>고 답한다 — color-scheme = ' + R.쓴것);
  is(R.몸바탕 === 'rgb(242, 244, 246)',
     '  바탕이 <b>목각 색 그대로</b>다 — ' + R.몸바탕 + ' (색은 한 톨도 안 바뀝니다)');
  await br.close(); srv.close();

  console.log('\n' + '─'.repeat(30));
  console.log('★ 이 자는 <b>선언이 제자리에 있는지</b>까지만 봅니다. 크롬의 자동 다크는');
  console.log('  브라우저 쪽에서 걸려 헤드리스로 재현이 안 됩니다 — <b>실제로 밝게 뜨는지는</b>');
  console.log('  사장님 폰에서 확인해야 합니다. 「자가 초록이니 됐다」 로 넘기지 마십시오 (1번).');
  console.log(bad ? '✗ ' + bad + '개' : '✓ 여는 문서가 모두 제 밝기를 밝히고 있습니다.');
  process.exit(bad ? 1 : 0);
})();
