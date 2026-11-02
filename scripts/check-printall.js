/* 🖨 <b>모든 인쇄가 안 깨지고 그대로 나오나</b> — 판 X295

   사장님 말씀 (2026-11-02) — 「모든 인쇄 하는 부분이 <b>안 깨지고 그대로 인쇄</b>
   될 수 있도록 만들어」.

   ── 아무도 안 보던 자리였습니다 ──────────────────────────────────────
   인쇄를 보는 자가 이미 <b>45개</b> 있었습니다. 그런데 저마다 <b>자기 화면만</b>
   봅니다. 「<b>모든</b> 인쇄가 안 깨지나」 를 한 자리에서 묻는 자는 한 곳도
   없었습니다 (CLAUDE.md 0-1번 — 그 자리를 만듭니다).

   ── 무엇이 깨지고 있었나 ────────────────────────────────────────────
   ★★ 크롬 인쇄 창의 <b>「배경 그래픽」 은 기본값이 꺼짐</b>입니다. 그래서
      <code>print-color-adjust:exact</code> 가 없으면 제목 띠·강조 상자·표
      줄무늬가 <b>통째로 백지</b>로 나갑니다. 고객에게 드리는 종이입니다.

   ★ 통제된 시험으로 원리를 확인했습니다 (배경 끔으로 인쇄 → PDF 를 그림으로
     뽑아 픽셀을 읽음) —
       이 줄 없음 : rgb(255,255,255) · rgb(255,255,255) · rgb(255,255,255)
       이 줄 있음 : rgb(26,86,219)   · rgb(14,159,110)   · rgb(220,62,68)
     셋째 칸은 <b>네 겹 안쪽</b>입니다 — 이 속성은 <b>물려 내려갑니다</b>.
     그래서 ui.css 의 @media print 에 <b>html 한 줄</b>이면 끝이고,
     * 규칙이 필요 없습니다.

   ★ 재어 보니 인쇄하는 화면 <b>26개 중 23개</b>가 깨지고 있었습니다. ⚠ 수가 둘입니다 —
     파일 글에 print-color-adjust 글자가 아예 없는 것은 <b>19개</b>이고, 이 자가
     재는 <b>html/body 에서 계산된 값</b>이 exact 가 아닌 것은 <b>23개</b>입니다.
     차이는 넷 — index.html 처럼 <b>안쪽 어느 요소에만</b> 적어 둔 화면입니다.
     종이에 나가는 것은 계산된 값이므로 <b>23</b> 이 맞는 수입니다 (1번).
     처음에 자 글에 19 라고 적었다가 되돌림 ①에서 23 이 나와 고쳤습니다.
     exact 가 되던 셋은 ba.html · finance.html · 증권전달/index.html 입니다. 고친 뒤
     종이의 잉크(흰색 아닌 픽셀)가 이렇게 늘었습니다 —
       상담자료/미끼상품_접촉전략   3.9% → <b>99.4%</b>
       ba-report(보장분석 리포트)   7.1% → <b>79%</b>
       edu-cal                   7.4% → 33.7%
       보험아카데미                21.6% → 36.4%
       ba.html(이미 있던 화면)     16.6% → 16.6%   ← 헛되이 안 건드림

   ── 여기서 재는 것 ──────────────────────────────────────────────────
     [1] ★★ <b>원리가 지금도 참인가</b> — 통제된 시험을 자 안에서 돌립니다.
         크롬이 바뀌어 이 속성이 안 먹게 되면 여기서 먼저 알려 줍니다.
     [2] ★★ 인쇄하는 화면을 <b>저장소에서 찾아</b>(목록을 베끼지 않음) 모두
         <b>인쇄 매체에서 exact</b> 인가 — 브라우저로 잽니다.
     [3] ★  ui.css 의 @media print 에 그 한 줄이 <b>한 곳만</b> 있나 (5번)

   ⚠ <b>헛것을 안 잡습니다</b> (CLAUDE.md 8번) — 처음에 넉넉히 재다 거짓
     고발을 넷이나 했습니다. 적어 둡니다:
     · <b>tnum 은 여기서 안 봅니다.</b> font-variant-numeric:tabular-nums 를
       쓰는 여섯 화면을 의심해 <b>진짜 PDF 를 뽑아 pdftotext 로 다시 읽어</b>
       봤습니다 — 사용자 지정 글자 0곳, 숫자가 멀쩡했습니다(5,000만 · 2026년 ·
       267). Pretendard 가 실제로 실린 것(9얼굴 · CDN 200)까지 확인했습니다.
       고쳤으면 헛일이었습니다. tnum 은 check-pdfread 가 봅니다.
     · <b>A4 폭은 안 봅니다.</b> ba-report 는 @page{size:1280px 720px},
       보험의기준은 {1440px 810px} 로 <b>일부러</b> 16:9 로 인쇄합니다.
       A4 를 전제하면 그 둘을 거짓으로 고발합니다.
     · <b>「글이 사라졌나」 는 안 봅니다.</b> 인쇄에서 접힌 칸이 펴져 글이
       오히려 늘거나, 아직 인쇄할 것이 없는 화면이 있어 가릴 수 없습니다.
     · <b>칸 쪼개짐은 안 봅니다.</b> 322곳에 avoid 를 강제하면 종이에 빈
       자리가 크게 생깁니다 — 사장님이 보실 모양을 제가 정할 자리가 아닙니다.

   ★ ui.css 를 17개 화면에 붙였는데 <b>화면(종이 아님)은 안 바뀌었습니다</b> —
     같은 판에서 두 번 찍어 「스스로 흔들리는 양」 을 먼저 재고 견줬습니다:
       bcd-lecture  전↔후 32,015 · 스스로 82,452
       메인 상담자료   전↔후 525    · 스스로 2,521
       증권전달      전↔후 0      · 스스로 0
     ui.css 의 전역 선택자는 :root(토큰) 하나뿐이고 나머지는 전부 .t- 접두사라
     부딪힐 이름이 없습니다(덮개 파일에 .cqa-hi·.cm-nx* 가 0곳).

   ★ 바깥은 전부 끊습니다 — 글꼴만 빼고(종이 글자를 재려면 글꼴이 있어야
     합니다). 사장님 서버는 한 번도 안 부릅니다.                          */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8989;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json;charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { const g = path.join(ROOT, 'app', p); if (fs.existsSync(g)) f = g; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

/* 인쇄하는 화면을 <b>저장소에서 찾습니다</b> — 목록을 베끼면 새 화면을 놓칩니다 */
function 인쇄화면() {
  const out = [];
  const 걷기 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/node_modules|\.git/.test(p)) 걷기(p); continue; }
      if (!/\.html$/.test(e.name)) continue;
      const s = fs.readFileSync(p, 'utf8');
      if (/window\.print\(\)|@media\s+print/.test(s)) out.push(p);
    }
  };
  걷기(path.join(ROOT, 'app'));
  const r = path.join(ROOT, 'db-crm.html');
  if (fs.existsSync(r) && /window\.print\(\)|@media\s+print/.test(fs.readFileSync(r, 'utf8'))) out.push(r);
  return out.sort();
}

const 글꼴 = (u) => /pretendard|fonts\.(googleapis|gstatic)/i.test(u);

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch({ args: ['--no-sandbox'] });

  /* ── [1] 원리가 지금도 참인가 ───────────────────────────────── */
  head('[1] ★★ <b>원리가 지금도 참인가</b> — 인쇄 매체에서 잽니다 (크롬이 바뀌면 여기서 먼저 울립니다)');
  /* ⚠ 처음에는 여기서 <b>진짜 PDF 를 뽑아 그림으로 바꿔 픽셀을 읽었습니다</b>.
     그 결과가 이 판의 증거입니다 (배경 끔으로 인쇄 →
       그 줄 없음 : 255,255,255 · 255,255,255 · 255,255,255
       그 줄 있음 : 26,86,219   · 14,159,110   · 220,62,68   ← 셋째는 네 겹 안쪽)
     그런데 그림으로 바꾸는 데 <b>pdftoppm</b>(poppler)을 썼고, 그것이
     <b>CI 기계에는 없어</b> 「spawnSync pdftoppm ENOENT」 로 빨간불이 났습니다.
     CLAUDE.md 8번 — 자가 바깥 셈틀에 기대면 안 됩니다(check.yml 도 안 건드립니다).
     그래서 <b>아무것에도 안 기대는 꼴</b>로 바꿨습니다: 인쇄 매체로 바꾼 뒤
     <b>계산된 값</b>을 읽고, <b>네 겹 안쪽</b>까지 물려 내려가는지 봅니다.
     ★ 이 자가 못 잡는 것을 적어 둡니다 (1번) — 크롬이 「값은 exact 인데
       종이에는 안 칠한다」 로 바뀌면 여기서는 안 울립니다. 픽셀 증거는
       한 번 재어 위에 적어 두었고, 그 왕복은 사람이 다시 돌려 봐야 합니다. */
  try {
    const pg = await br.newPage();
    await pg.setContent('<!doctype html><html><head><meta charset="utf-8"><style>' +
      'body{margin:0}.box{height:40px}</style></head><body><div class="box" id="a"></div>' +
      '<div><div><div><div class="box" id="c">깊은 칸</div></div></div></div></body></html>',
      { waitUntil: 'load' });
    const 재 = async (룰) => {
      await pg.addStyleTag({ content: 룰 });
      await pg.emulateMedia({ media: 'print' });
      return pg.evaluate(() => {
        const g = (id) => { const c = getComputedStyle(document.getElementById(id));
          return (c.printColorAdjust || c.webkitPrintColorAdjust || '(없음)'); };
        return { 겉: g('a'), 깊: g('c') };
      });
    };
    const 없 = await 재('/* 아무것도 */');
    const 있 = await 재('html{-webkit-print-color-adjust:exact;print-color-adjust:exact}');
    await pg.close();
    is(!/exact/.test(없.겉) && !/exact/.test(없.깊),
       '  그 줄이 <b>없으면</b> exact 가 아니다 — 겉 ' + 없.겉 + ' · 네 겹 안쪽 ' + 없.깊);
    is(/exact/.test(있.겉) && /exact/.test(있.깊),
       '  ★★ <b>html 한 줄</b>이면 <b>네 겹 안쪽까지</b> exact 다(물려 내려갑니다) — 겉 ' +
       있.겉 + ' · 네 겹 안쪽 ' + 있.깊);
  } catch (e) { is(false, '  통제된 시험을 못 돌렸습니다 — ' + String(e).slice(0, 70)); }

  /* ── [2] 인쇄하는 화면이 모두 exact 인가 ───────────────────── */
  head('[2] ★★ 인쇄하는 화면이 <b>인쇄 매체에서 exact</b> 인가 — 브라우저로 잽니다');
  const 파일 = 인쇄화면();
  is(파일.length >= 20, '  인쇄하는 화면을 저장소에서 <b>' + 파일.length + '개</b> 찾았다 (적어도 20)');
  const 안됨 = [];
  for (const f of 파일) {
    const rel = path.relative(ROOT, f);
    const u = '/' + rel.split(path.sep).map(encodeURIComponent).join('/');
    const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route('**://**', r => (r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 || 글꼴(r.request().url()))
                                     ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    let ca = '?';
    try {
      await pg.goto('http://127.0.0.1:' + PORT + u, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await pg.waitForTimeout(1200);
      await pg.emulateMedia({ media: 'print' });
      await pg.waitForTimeout(400);
      ca = await pg.evaluate(() => {
        const c = getComputedStyle(document.documentElement), b = getComputedStyle(document.body);
        return (c.printColorAdjust || c.webkitPrintColorAdjust || b.printColorAdjust || b.webkitPrintColorAdjust || '(없음)');
      });
    } catch (e) { ca = '못 열었습니다'; }
    await ctx.close();
    if (!/exact/.test(ca)) 안됨.push(rel.replace('app/', '') + ' → ' + ca);
  }
  is(안됨.length === 0,
     '  ★★ 인쇄에서 <b>색이 하얗게 떨어지는 화면 ' + 안됨.length + '개</b>' +
     (안됨.length ? ' ⚠ ' + 안됨.slice(0, 6).join(' · ') : ' / ' + 파일.length + ' — 손대기 전에는 <b>23개</b>였습니다'));

  /* ── [3] 그 한 줄이 한 곳만 ─────────────────────────────────── */
  head('[3] ★ 그 한 줄이 <b>ui.css 한 곳</b>에만 (5번)');
  const UI = fs.readFileSync(path.join(ROOT, 'app', 'ui.css'), 'utf8');
  const 인쇄토막 = (UI.match(/@media\s+print\s*\{/g) || []).length;
  is(인쇄토막 === 1, '  ui.css 의 @media print 토막이 <b>하나</b>다 — ' + 인쇄토막 + '개');
  const pm = UI.slice(UI.indexOf('@media print'), UI.indexOf('@media print') + 1400);
  is(/html\s*\{[^}]*print-color-adjust:\s*exact/.test(pm),
     '  그 토막 안에 <b>html{print-color-adjust:exact}</b> 가 있다');
  is(!/\*\s*,?\s*\*::before/.test(pm),
     '  <b>* 규칙은 안 쓴다</b> — 물려 내려가므로 필요 없습니다(되돌림 ③이 그것을 보여 줍니다)');

  /* ── [4] 새 창으로 인쇄하는 자리도 옷을 싣나 ─────────────── */
  head('[4] ★★ 판 X296 — <b>새 창으로 인쇄하는 자리</b>도 옷을 싣나');
  /* ⚠ 앱에는 window.open('','_blank') 로 <b>빈 창</b>을 열고 글을 써 넣는
     인쇄 길이 여럿 있습니다. 그 창에는 ui.css 가 <b>없습니다</b> — 그러면
     써 넣은 css 의 var(--ink-*)·var(--tN) 이 전부 빈 값이 됩니다.
     통제된 시험으로 재었습니다 (아래 [4-나]).
     printHeadCss() 가 ui.css 를 절대 주소로 싣고 글자 계단도 넘깁니다. */
  const 빈창 = [];
  const APPSRC = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  for (const m of APPSRC.matchAll(/window\.open\(\s*''\s*,\s*'_blank'/g)) {
    const 뒤 = APPSRC.slice(m.index, m.index + 6000);
    const 앞 = APPSRC.slice(Math.max(0, m.index - 3000), m.index);
    const fn = [...앞.matchAll(/function (\w+)\s*\(/g)].map(x => x[1]);
    if (!/printHeadCss/.test(뒤)) 빈창.push(fn.length ? fn[fn.length - 1] : '(이름 모름)');
  }
  is(빈창.length === 0,
     '  ★★ 빈 창을 열어 인쇄하면서 <b>printHeadCss() 를 안 부르는 자리 ' + 빈창.length + '곳</b>' +
     (빈창.length ? ' ⚠ ' + 빈창.join(' · ') : ' — 손대기 전에는 다섯이었습니다(waReportPrint · tpPrint · endoPrint · manPrint · bizPrint)'));
  is(/function printHeadCss\(\)/.test(APPSRC) && /ui\.css/.test(APPSRC.slice(APPSRC.indexOf('function printHeadCss()'), APPSRC.indexOf('function printHeadCss()') + 700)),
     '  printHeadCss 가 <b>ui.css 를 싣는다</b> — 그래서 판 X295 의 한 줄이 그 창에도 닿는다');

  head('[4-나] ★ <b>옷이 없으면 무엇이 빠지나</b> — 통제된 시험 (왜 고쳐야 하는지의 증거)');
  try {
    const pg = await br.newPage();
    const 틀 = (룰) => '<!doctype html><html><head><meta charset="utf-8"><style>' + 룰 +
      'body{margin:0;font-size:16px}.box{border:1px solid var(--ink-7);background:var(--white);' +
      'color:var(--ink-1);font-size:var(--t4);padding:10px}</style></head><body>' +
      '<div class="box" id="x">칸</div></body></html>';
    const 재 = async (룰) => { await pg.setContent(틀(룰), { waitUntil: 'load' });
      return pg.evaluate(() => { const c = getComputedStyle(document.getElementById('x'));
        return { 선: c.borderTopWidth + ' ' + c.borderTopStyle, 바탕: c.backgroundColor, 크기: c.fontSize }; }); };
    const 없 = await 재('');
    const 있 = await 재(':root{--ink-7:#E5E8EB;--white:#FFFFFF;--ink-1:#191F28;--t4:15px}');
    await pg.close();
    is(없.선 === '0px none' && 없.바탕 === 'rgba(0, 0, 0, 0)',
       '  옷이 <b>없으면</b> 표 선이 아예 안 나오고 바탕이 빠진다 — 선 ' + 없.선 + ' · 바탕 ' + 없.바탕 + ' · 크기 ' + 없.크기);
    is(있.선 === '1px solid' && 있.바탕 === 'rgb(255, 255, 255)' && 있.크기 === '15px',
       '  옷이 <b>있으면</b> 선·바탕·크기가 제대로 — 선 ' + 있.선 + ' · 바탕 ' + 있.바탕 + ' · 크기 ' + 있.크기);
  } catch (e) { is(false, '  통제된 시험을 못 돌렸습니다 — ' + String(e).slice(0, 60)); }

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 인쇄하는 화면 ' + 파일.length + '개가 모두 「배경 끔」 에서도 색이 그대로 나옵니다.');
})();
