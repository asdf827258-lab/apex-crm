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
const { execFileSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url'), os = require('os');
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
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'printall-'));

  /* ── [1] 원리가 지금도 참인가 ───────────────────────────────── */
  head('[1] ★★ <b>원리가 지금도 참인가</b> — 통제된 시험 (크롬이 바뀌면 여기서 먼저 울립니다)');
  let 원리 = null;
  try {
    const 틀 = (룰) => '<!doctype html><html><head><meta charset="utf-8"><style>' + 룰 +
      'body{margin:0}.box{height:110px;color:#fff;padding:16px;box-sizing:border-box}' +
      '.a{background:#1A56DB}.b{background:#0E9F6E}.c{background:#DC3E44}</style></head><body>' +
      '<div class="box a">①</div><div class="box b">②</div>' +
      '<div><div><div><div class="box c">③ 네 겹 안쪽</div></div></div></div></body></html>';
    const pg = await br.newPage();
    const 재기 = async (이름, 룰) => {
      await pg.setContent(틀(룰), { waitUntil: 'load' });
      const f = path.join(TMP, 이름 + '.pdf');
      fs.writeFileSync(f, await pg.pdf({ format: 'A4', printBackground: false, margin: { top: 0, bottom: 0, left: 0, right: 0 } }));
      execFileSync('pdftoppm', ['-png', '-r', '96', '-f', '1', '-l', '1', f, path.join(TMP, 이름)]);
      const g = fs.readdirSync(TMP).filter(x => x.startsWith(이름) && x.endsWith('.png'))[0];
      const b64 = fs.readFileSync(path.join(TMP, g)).toString('base64');
      return pg.evaluate(async (b64) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g2 = c.getContext('2d'); g2.drawImage(img, 0, 0);
        const 읽 = (y) => { const d = g2.getImageData(Math.round(img.width * 0.3), y, 1, 1).data; return d[0] + ',' + d[1] + ',' + d[2]; };
        return { 칸1: 읽(55), 칸2: 읽(165), 칸3: 읽(275) };
      }, b64);
    };
    const 없 = await 재기('none', '');
    const 있 = await 재기('html', 'html{-webkit-print-color-adjust:exact;print-color-adjust:exact}');
    원리 = { 없, 있 };
    await pg.close();
  } catch (e) { is(false, '  통제된 시험을 못 돌렸습니다 — ' + String(e).slice(0, 70)); }
  if (원리) {
    const 흰 = (v) => v === '255,255,255';
    is(흰(원리.없.칸1) && 흰(원리.없.칸2) && 흰(원리.없.칸3),
       '  그 줄이 <b>없으면</b> 「배경 끔」 인쇄에서 하얗게 떨어진다 — ' +
       원리.없.칸1 + ' / ' + 원리.없.칸2 + ' / ' + 원리.없.칸3);
    is(원리.있.칸1 === '26,86,219' && 원리.있.칸2 === '14,159,110' && 원리.있.칸3 === '220,62,68',
       '  ★★ <b>html 한 줄</b>이면 네 겹 안쪽까지 색이 남는다(물려 내려갑니다) — ' +
       원리.있.칸1 + ' / ' + 원리.있.칸2 + ' / ' + 원리.있.칸3);
  }

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

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 인쇄하는 화면 ' + 파일.length + '개가 모두 「배경 끔」 에서도 색이 그대로 나옵니다.');
})();
