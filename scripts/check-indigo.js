/* 🎨 <b>색표 밖에 남은 남색을 색표 안으로</b> (판 ⑨).

   #483 에서 「앱이 색표 밖의 색을 서른 가지 쓰고 있다」 고 잡은 것의
   남은 자리입니다. app/index.html 안에서만 <b>41군데</b>가 생 hex 로
   흩어져 있었습니다 — .cc-vip · .cm-wt · .cc-pill.vip · .cm-sb.me ·
   .hwho-c.me · .hm-nw 등. 색표(app/ui.css)에는 <b>한 군데도</b> 없었습니다.

   ★★ <b>이 판은 「이름을 붙이는 판」 이지 「색을 고르는 판」 이 아닙니다.</b>
     값을 한 톨도 안 바꿉니다. 그래서 이 자의 <b>본업</b>은 「생 hex 가
     사라졌나」 가 아니라 <b>「화면 색이 그대로인가」</b> 입니다 — 이름을
     붙이면서 값을 슬쩍 바꾸면 여기서 울어야 합니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 새 이름 셋이 :root 에 <b>한 번씩만</b> 있다 (같은 색에 이름
         둘이 아니다 · 5번)
     [2] ★★ <b>색이 그대로다</b> — 이름이 가리키는 값이 옮기기 전
         그 색과 <b>한 글자도</b> 안 다르다. 화면에서도 그 색이 난다
     [3] 생 hex 셋이 app/index.html 에 <b>몇 군데 남았나</b> — 0 이
         목표다. 못 옮긴 것이 있으면 <b>그 수를 적는다</b> (0 이라고
         우기지 않는다 · 1번). ★ 설명 글(주석)은 코드가 아니다
     [4] 대비가 <b>4.5 위</b>다
     [5] ⚠ <b>#C7D2FE 를 남색이라 부르지 않았나</b> (1번) — 46군데를
         열어 보니 남색 셋과 같은 줄에 있는 것은 7군데뿐이고 나머지는
         다른 바탕 위의 <b>일반 연파랑 테두리</b>였다. 남색 이름을
         붙이면 거짓이 된다. 몇 군데인지만 적어 둔다
     [6] 심의색(--t-seal · --t-sealk)은 <b>안 건드렸다</b> (S06)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8983;
const UICSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const q = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (q.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, q);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 옮기기 <b>전</b> 그 자리에 있던 색 — 이 표가 이 자의 기준점입니다.
   값을 바꾸면 여기와 어긋나 웁니다.                                   */
const WAS = [
  ['--t-ind',   '#4F46E5', 'rgb(79, 70, 229)'],
  ['--t-ind-l', '#EEF2FF', 'rgb(238, 242, 255)'],
  ['--t-ind-d', '#3730A3', 'rgb(55, 48, 163)']
];

/* ⚠ <b>주석을 잘라내려고 하지 않습니다.</b> 한 번 해 봤다가 데었습니다 —
   이 파일은 HTML·JS·CSS 가 섞여 있어서 JS 문자열 안의 '/*' 를 주석
   시작으로 읽고 <b>진짜 코드를 천 줄 넘게</b> 지워 버렸습니다. 그러면
   지워진 자리에 생 hex 가 남아 있어도 「0군데」 라고 초록이 납니다 —
   자가 거짓말을 하는 것입니다. check-uid 에서도 같은 자리에 데었습니다.
   그래서 <b>날글 그대로 세고, 몇 개여야 하는지를 못 박습니다.</b>
   설명 글에 일부러 남겨 둔 한 자리(759행의 #4F46E5 주석)만 예외로 적어 둡니다. */
function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(h) { h = h.replace('#', ''); return 0.2126 * lin(parseInt(h.slice(0, 2), 16)) + 0.7152 * lin(parseInt(h.slice(2, 4), 16)) + 0.0722 * lin(parseInt(h.slice(4, 6), 16)); }
function ratio(a, b) { const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100; }

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 900, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);

  console.log('\n🎨 색표 밖에 남은 남색을 색표 안으로');

  console.log('\n[1] 새 이름 셋이 <b>:root 에 한 번씩만</b> 있다 (5번)');
  WAS.forEach(([n]) => {
    /* --t-ind 는 --t-ind-l 의 앞머리이기도 합니다. 뒤에 바로 ':' 가 와야 그 이름입니다 */
    const c = (UICSS.match(new RegExp(n + '\\s*:', 'g')) || []).length;
    is(c === 1, '  <b>' + n + '</b> 이 한 번만 서 있다 — ' + c + '번');
  });
  /* 같은 색에 이름이 둘이면 고칠 자리가 둘이 됩니다 */
  WAS.forEach(([n, hex]) => {
    const c = (UICSS.match(new RegExp(hex, 'gi')) || []).length;
    is(c === 1, '  ' + hex + ' 가 색표에 <b>한 번만</b> 적혀 있다 — ' + c + '번 (이름 둘이면 쌍둥이)');
  });

  console.log('\n[2] ★★ <b>색이 그대로다</b> — 이 판의 본업');
  const got = await p.evaluate((names) => {
    const el = document.createElement('div');
    el.id = 'indProbe';
    el.style.cssText = 'position:fixed;left:-9999px;color:var(--t-ind-d);' +
                       'background:var(--t-ind-l);border:1px solid var(--t-ind)';
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const out = { '--t-ind-d': cs.color, '--t-ind-l': cs.backgroundColor, '--t-ind': cs.borderTopColor };
    /* 이름이 안 풀리면 브라우저가 <b>기본값</b>을 씁니다 — 그것도 잡습니다 */
    out.raw = {};
    names.forEach(n => { out.raw[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); });
    el.remove();
    return out;
  }, WAS.map(w => w[0]));
  WAS.forEach(([n, hex, rgb]) => {
    is(got[n] === rgb,
       '  <b>' + n + '</b> 이 화면에서 옮기기 전 그 색으로 난다 — ' + got[n] + ' (전 ' + hex + ')');
    is((got.raw[n] || '').toLowerCase() === hex.toLowerCase(),
       '    색표에 적힌 값도 그대로다 — ' + (got.raw[n] || '없음'));
  });

  console.log('\n[3] 생 hex 가 <b>몇 군데 남았나</b> (1번 — 0 이라고 우기지 않는다)');
  /* 날글 그대로 셉니다. 남아도 되는 자리는 <b>설명 글 한 곳뿐</b>이고,
     그것까지 수로 못 박습니다 — 「주석은 안 세니까」 로 넘어가면 진짜
     남은 것과 구별이 안 됩니다.                                        */
  const WANT = { '#3730A3': 0, '#EEF2FF': 0, '#4F46E5': 1 };
  WAS.forEach(([n, hex]) => {
    const c = (SRC.match(new RegExp(hex, 'gi')) || []).length;
    const w = WANT[hex];
    is(c === w, '  ' + hex + ' 가 app/index.html 에 <b>' + c + '군데</b> 있다 (있어도 되는 것 ' + w +
       (w ? '군데 — 759행 설명 글' : '군데') + ')');
  });
  const note = (SRC.match(/\/\* #4F46E5 \*\//g) || []).length;
  is(note === 1,
     '  그 한 군데가 <b>설명 글</b>이다 — 「목각은 이 색이었다」 고 적어 둔 글이지 CSS 가 아니다');
  const uses = (SRC.match(/var\(--t-ind(-l|-d)?\)/g) || []).length;
  is(uses === 41, '  대신 이름으로 <b>' + uses + '군데</b>가 선다 — 옮긴 수 그대로다 (41)');

  console.log('\n[4] <b>대비</b>가 4.5 위다');
  const c1 = ratio('#3730A3', '#EEF2FF'), c2 = ratio('#4F46E5', '#EEF2FF');
  is(c1 >= 4.5, '  진한 글씨를 연한 바탕에 — <b>' + c1 + '</b>');
  is(c2 >= 4.5, '  기본 남색을 연한 바탕에 — <b>' + c2 + '</b>');

  console.log('\n[5] ⚠ <b>#C7D2FE 를 남색이라 안 부른다</b> (1번)');
  const cn = (SRC.match(/#C7D2FE/gi) || []).length;
  const near = SRC.split('\n').filter(l => /#C7D2FE/i.test(l) &&
    /(--t-ind|#3730A3|#EEF2FF|#4F46E5)/i.test(l)).length;
  is(!/--t-ind-b/.test(UICSS) && !/--t-ind[a-z-]*\s*:\s*#C7D2FE/i.test(UICSS),
     '  색표에 <b>#C7D2FE 를 남색으로 세우지 않았다</b> — ' + cn + '군데 중 남색과 같은 줄은 ' +
     near + '군데뿐이고 나머지는 다른 바탕 위의 연파랑 테두리다');
  is(cn > 0, '  그것은 <b>' + cn + '군데</b>로 그대로 있다 — 없는 척하지 않는다 (다음 판)');

  console.log('\n[6] 심의색은 <b>안 건드렸다</b> (S06)');
  is(/--t-seal\s*:/.test(UICSS) && /--t-sealk\s*:/.test(UICSS) &&
     !/--t-seal[a-z]*\s*:\s*(#4F46E5|#3730A3|#EEF2FF)/i.test(UICSS),
     '  --t-seal · --t-sealk 가 그대로다 — 규정이 정한 색이다');
  is(errs.length === 0, '  조용히 터진 곳이 없다' + (errs.length ? (' ← ' + errs[0]) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 이름을 붙이면서 색이 변하면 이 판은 안 하느니만 못합니다.')
                  : '✓ 남색이 색표 안으로 들어왔고, 화면 색은 한 톨도 안 변했습니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
