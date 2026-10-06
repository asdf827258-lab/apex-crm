/* 🎨 <b>색표 밖에 남아 있던 색을 색표 안으로</b>
   (판 ⑨ 남색 · 판 ⑩ 파란 선 · 판 ⑪ 파란 바탕 + 이미 있던 값).
   ★ 파일 이름은 indigo 로 시작하지만 <b>남색만 보지 않습니다</b> —
     판 ⑩ 에서 파르스름한 테두리(--t-line-b)까지 같이 봅니다. 재는 것이
     똑같아서(「색표 밖 hex 0 · 화면 색 그대로」) 자를 둘로 나누지
     않았습니다 (5번). 이름을 바꾸면 checks.tsv 와 git 내력이 끊깁니다.

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
  ['--t-ind',    '#4F46E5', 'rgb(79, 70, 229)'],
  ['--t-ind-l',  '#EEF2FF', 'rgb(238, 242, 255)'],
  ['--t-ind-d',  '#3730A3', 'rgb(55, 48, 163)'],
  /* 판 ⑩ — 파르스름한 테두리. 46군데가 <b>전부 테두리</b>였고 글자색으로
     쓰는 자리는 한 군데도 없어 <b>선 계열</b>에 세웠습니다.            */
  ['--t-line-b', '#C7D2FE', 'rgb(199, 210, 254)'],
  /* 판 ⑪ — 파르스름한 알림칸 바탕. 다섯 값을 <b>가장 많이 쓰는 이 값</b>으로
     모았습니다. 앞의 판들과 달리 <b>여기만 화면이 아주 조금 움직입니다</b>
     (54군데가 최대 5/255) — 알고 한 것입니다.                          */
  ['--t-bg-b',   '#F5F9FF', 'rgb(245, 249, 255)']
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
  /* 같은 색에 이름이 둘이면 고칠 자리가 둘이 됩니다.
     ★ <b>글이 아니라 「그 값을 든 이름이 몇인가」</b> 를 셉니다 — 색표
       주석에 까닭을 적어 두면 날글 세기로는 헛것을 잡습니다. 이 자가
       세 번 데인 자리입니다 (check-uid · 판 ⑧ · 판 ⑩).              */
  WAS.forEach(([n, hex]) => {
    const c = (UICSS.match(new RegExp('--t-[a-z0-9-]+\\s*:\\s*' + hex, 'gi')) || []).length;
    is(c === 1, '  ' + hex + ' 를 든 이름이 <b>하나뿐</b>이다 — ' + c + '개 (둘이면 쌍둥이)');
  });

  console.log('\n[2] ★★ <b>색이 그대로다</b> — 이 판의 본업');
  const got = await p.evaluate((names) => {
    const out = { raw: {} };
    names.forEach(n => {
      /* color 로 재면 어떤 색 이름이든 같은 자로 잴 수 있습니다 */
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:-9999px;color:var(' + n + ')';
      document.body.appendChild(el);
      out[n] = getComputedStyle(el).color;
      el.remove();
      /* 이름이 안 풀리면 브라우저가 <b>기본값</b>을 씁니다 — 그것도 잡습니다 */
      out.raw[n] = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    });
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
  /* 0 이 목표지만 <b>못 옮긴 것은 그 수를 적습니다</b> (1번).
     못 옮긴 자리는 전부 <b>JS 가 만드는 색</b>입니다 — 그래프에 넘기는
     문자열 · SVG 의 fill · canvas 의 fillStyle · 삼항으로 고르는 색.
     거기에 var() 를 넣으면 <b>색이 통째로 안 나옵니다.</b>             */
  const WANT = { '#3730A3': 0, '#EEF2FF': 0, '#4F46E5': 1, '#C7D2FE': 0,
                 '#F5F9FF': 7, '#F8FAFF': 1, '#F7FAFF': 1, '#F5F8FF': 0, '#F0F7FF': 0 };
  Object.keys(WANT).filter(h => !WAS.some(w => w[1] === h)).forEach(hex => {
    const c = (SRC.match(new RegExp(hex, 'gi')) || []).length;
    is(c === WANT[hex], '  ' + hex + ' 가 <b>' + c + '군데</b> 있다 (JS 가 만드는 자리 ' + WANT[hex] + '군데)');
  });
  WAS.forEach(([n, hex]) => {
    const c = (SRC.match(new RegExp(hex, 'gi')) || []).length;
    const w = WANT[hex];
    /* 왜 남아도 되는지는 <b>hex 마다 다릅니다</b> — 759행은 설명 글이고,
       파란 바탕 일곱은 JS 가 만드는 색입니다. 뭉뚱그리면 거짓이 됩니다. */
    const why = w === 0 ? '군데' : (hex.toUpperCase() === '#4F46E5'
      ? '군데 — 759행 설명 글' : '군데 — JS 가 만드는 색');
    is(c === w, '  ' + hex + ' 가 app/index.html 에 <b>' + c + '군데</b> 있다 (있어도 되는 것 ' + w + why + ')');
  });
  const note = (SRC.match(/\/\* #4F46E5 \*\//g) || []).length;
  is(note === 1,
     '  그 한 군데가 <b>설명 글</b>이다 — 「목각은 이 색이었다」 고 적어 둔 글이지 CSS 가 아니다');
  const uses = (SRC.match(/var\(--t-ind(-l|-d)?\)/g) || []).length;
  /* ★ 41 → 42 · 2026-10-06 (물결 7) — <b>담보 「고액암」 이 --t-ind-d 로 왔습니다.</b>
     지급사례 칩의 색을 표 하나(CLM_TAGCOL)로 모을 때, 고액암에 쓰던 #4338CA 를
     <b>색표의 남색 진한 짝</b>으로 보냈습니다 — 흰 위 대비 7.90 → <b>9.93</b> 으로
     올라갑니다. <b>일부러 늘린 하나</b>이고, 그래서 이 수도 하나 올립니다.
   ★ <b>== 로 못 박아 둔 것은 그대로 둡니다</b> — 「이보다 작아도 된다」 로 풀면
     누가 남색을 걷어내도 조용합니다. 늘리든 줄이든 <b>눈에 보이게</b> 합니다 (0-1번). */
  is(uses === 42, '  대신 남색 이름으로 <b>' + uses + '군데</b>가 선다 — 옮긴 수 그대로다 (42)');
  const lb = (SRC.match(/var\(--t-line-b\)/g) || []).length;
  const ib = (SRC.match(/var\(--t-ind-b\)/g) || []).length;
  is(lb + ib === 46, '  파란 선 <b>' + lb + '</b> + 남색 테두리 별칭 <b>' + ib +
     '</b> = 46군데 — 판 ⑩ 에서 옮긴 수 그대로다');
  const bgb = (SRC.match(/var\(--t-bg-b\)/g) || []).length;
  is(bgb === 110, '  파란 바탕 이름으로 <b>' + bgb + '군데</b>가 선다 — 옮긴 수 그대로다 (110)');
  const pt = (SRC.match(/var\(--t-point\)/g) || []).length;
  const raw1a = (SRC.match(/#1A56DB/gi) || []).length;
  is(pt >= 339 && raw1a === 61,
     '  --t-point 로 <b>' + pt + '군데</b>가 서고, 생 hex 는 <b>' + raw1a +
     '군데</b> 남았다 — 그 61군데는 JS 가 만드는 색이라 var() 가 안 풀린다');

  console.log('\n[4] <b>대비</b>가 4.5 위다');
  const c1 = ratio('#3730A3', '#EEF2FF'), c2 = ratio('#4F46E5', '#EEF2FF');
  is(c1 >= 4.5, '  진한 글씨를 연한 바탕에 — <b>' + c1 + '</b>');
  is(c2 >= 4.5, '  기본 남색을 연한 바탕에 — <b>' + c2 + '</b>');

  console.log('\n[5] ⚠ <b>파란 선을 남색이라 안 부른다</b> (1번) · 선 계열에 세웠다');
  /* 판 ⑨ 에서 「테두리도 남색 식구로 넣자」 는 이야기가 있었는데, 46군데 중
     남색과 같은 줄은 <b>여섯</b>뿐이고 나머지는 다른 바탕 위의 테두리였습니다.
     남색 이름을 붙이면 거짓이 됩니다. 판 ⑩ 에서 <b>선 계열</b>로 세웠습니다. */
  /* ⚠ <b>글이 아니라 「이름이 정의됐나」 를 봅니다.</b> 처음에 「--t-ind-b
     라는 글자가 파일에 있나」 로 재다가, 색표 주석에 「그때 --t-ind-b 로
     넣자는 이야기가 있었는데」 라고 적어 둔 <b>제 설명 글이 제 자를
     울렸습니다.</b> 판 ⑧ 에서도(「빈 통장 8칸」), check-uid 에서도 같은
     자리에 데었습니다 — 자는 <b>정의</b>를 보아야 하고, 그래야 글로
     내력을 남길 수 있습니다.                                          */
  /* ★ 판 ⑪ 에서 <b>뒤집혔습니다</b>. 판 ⑨·⑩ 에서는 「--t-ind-b 를 만들지
     않았나」 를 봤는데, 사장님이 「별칭으로 해 줘」 로 정하셔서 이제
     <b>있는 것이 맞습니다.</b> 자를 줄이지 않고 <b>「별칭인가」</b> 로
     바꿉니다 — 값을 따로 적으면(#C7D2FE) 같은 색에 이름이 둘이 되어
     고칠 자리가 둘이 됩니다 (5번). 그것이 여기서 막아야 할 것입니다. */
  const alias = /--t-ind-b\s*:\s*var\(--t-line-b\)/.test(UICSS);
  is(alias && !/--t-ind-b\s*:\s*#/i.test(UICSS),
     '  --t-ind-b 가 <b>별칭</b>이다 — 값을 따로 안 적고 파란 선을 가리킨다');
  const ibLines = SRC.split('\n').filter(l => /var\(--t-ind-b\)/.test(l));
  is(ibLines.length === 6 && ibLines.every(l => /--t-ind-l/.test(l)),
     '  그 이름이 <b>남색 바탕과 한 쌍인 여섯</b>에만 붙었다 — ' + ibLines.length + '줄' +
     (ibLines.every(l => /--t-ind-l/.test(l)) ? '' : ' ← 남색이 아닌 줄이 섞였습니다'));
  is(/--t-line-b\s*:\s*#C7D2FE/i.test(UICSS),
     '  <b>선 계열(--t-line-b)</b>에 세웠다 — 46군데가 전부 테두리였다');
  /* 선 계열 이웃과 <b>같은 색이 아닌가</b> — 같으면 쌍둥이입니다 (5번) */
  const sib = (UICSS.match(/--t-line[a-z0-9-]*\s*:\s*#[0-9A-Fa-f]{6}/g) || []);
  const vals = sib.map(x => x.split(':')[1].trim().toLowerCase());
  is(sib.length >= 4 && new Set(vals).size === vals.length,
     '  선 계열 ' + sib.length + '개가 <b>서로 다른 색</b>이다 — ' + vals.join(' · '));

  console.log('\n[6] 심의색은 <b>안 건드렸다</b> (S06)');
  is(/--t-seal\s*:/.test(UICSS) && /--t-sealk\s*:/.test(UICSS) &&
     !/--t-seal[a-z]*\s*:\s*(#4F46E5|#3730A3|#EEF2FF)/i.test(UICSS),
     '  --t-seal · --t-sealk 가 그대로다 — 규정이 정한 색이다');
  is(errs.length === 0, '  조용히 터진 곳이 없다' + (errs.length ? (' ← ' + errs[0]) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 이름을 붙이면서 색이 변하면 이 판은 안 하느니만 못합니다.')
                  : '✓ 남색·파란 선·파란 바탕이 색표 안으로 들어왔고, 같은 값에 이름이 둘인 곳이 없습니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
