/* ══ 👆 계산기에서 누르는 자리가 44px 인가 ═══════════════════════════════

   사장님 말씀 (2026-10-28) — <b>「올려 이건 다른 페이지니깐」</b>.
   판 X224 를 올리며 재어 보니 종합보고서 메뉴 칸이 <b>열셋 모두 34px</b>
   이었습니다. 「누르는 것은 44px」 은 이 앱의 철칙인데(판 X146·X147 ·
   사장님 손가락 바닥) 계산기만 그 밖에 있었습니다.

   ── 무엇을 세고 무엇을 안 세나 ─────────────────────────────────────
   ★ <b>손이 닿는 자리는 모두</b> 셉니다 — button · a[href] · select ·
     누르는 input, 그리고 <b>글 적는 칸(input · textarea)</b>까지.
   ★ 판 X225 에서는 글 적는 칸을 빼 두었습니다(기둥이 길어진다는 까닭).
     판 X226 에서 사장님께서 <b>「응 그것도 올려」</b> 하셔서 넣었습니다 —
     이제 계산기에서 <b>손이 닿는 자리에 예외가 없습니다.</b>
     기둥은 창 안에서 굴러가므로(900px 창 · 속 2,315 → 2,587px) 길어진
     만큼 더 굴리실 뿐, 화면이 밀리거나 잘리지 않습니다.
   ⚠ 안 보이는 것은 안 셉니다 — 폰에서 메뉴 격자는 「📂 카테고리」 뒤로,
     입력 기둥은 「✏️ 고객정보 입력」 뒤로 접혀 있습니다(재어 보니 높이 0).
   ⚠ 바깥을 한 번도 안 부릅니다.                                       */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    rs.writeHead(404); return rs.end();
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  rs.end(fs.readFileSync(f));
});

let bad = 0;
const is = (ok, msg) => { if (!ok) bad++; console.log('  ' + (ok ? '✓' : '✗') + '   ' + msg); };

/* 손가락 바닥 — 판 X146·X147 이 정한 그 수입니다. 여기서 또 안 정합니다. */
const 바닥 = 44;

const 재기 = () => {
  const 보이나 = (e) => {
    const r = e.getBoundingClientRect();
    const st = getComputedStyle(e);
    return r.width > 4 && r.height > 2 && st.visibility !== 'hidden' && st.display !== 'none';
  };
  /* 손가락이 닿는 것들 — 누르는 것과 <b>글 적는 칸</b> (판 X226) */
  const 누름 = [...document.querySelectorAll(
    'button, a[href], select, input, textarea')].filter(보이나)
    .filter(e => e.type !== 'hidden');
  const 작은 = 누름.map(e => ({
    h: Math.round(e.getBoundingClientRect().height),
    t: (e.innerText || e.value || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 26),
    c: ('' + e.className).split(' ')[0] || e.tagName.toLowerCase()
  })).filter(x => x.h < 44);
  const g = document.querySelector('.top-tab-grid');
  return {
    누름수: 누름.length, 작은: 작은,
    메뉴: [...document.querySelectorAll('.report-tab')]
            .map(e => Math.round(e.getBoundingClientRect().height)),
    격자높이: g ? Math.round(g.getBoundingClientRect().height) : 0,
    /* 왼쪽 입력 기둥 — 길어진 만큼 굴리는 자리이지 밀리는 자리가 아닙니다 */
    기둥속: (function(){ const sb = document.querySelector('.sidebar');
      return sb ? Math.round([...sb.querySelectorAll('*')]
        .reduce((a, e) => Math.max(a, e.scrollHeight), 0)) : 0; })()
  };
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const 본 = {};
  for (const W of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
    await ctx.route('**://**', r =>
      r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:' + PORT + '/app/finance.html',
                 { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(3500);
    본[W] = await p.evaluate(재기);
    await ctx.close();
  }
  await b.close(); srv.close();

  for (const W of [390, 1280]) {
    const r = 본[W];
    console.log('\n[' + (W === 390 ? '폰 390' : 'PC 1280') + '] 누르는 자리 '
      + r.누름수 + '개 · 44px 미만 <b>' + r.작은.length + '개</b>');
    is(r.작은.length === 0, '  ★★ 손가락이 <b>다 닿는다</b> — 44px 미만 '
      + r.작은.length + '개'
      + (r.작은.length ? ' ← ' + r.작은.slice(0, 5).map(x => x.h + 'px ' + (x.t || x.c)).join(' · ') : ''));
  }

  /* ── 메뉴 칸 열셋 ──────────────────────────────────────────────── */
  console.log('\n[메뉴] 📋 <b>종합보고서 메뉴 칸</b> (사장님이 짚으신 그 자리)');
  const 메뉴 = 본[1280].메뉴 || [];
  is(메뉴.length >= 13, '  칸이 <b>' + 메뉴.length + '개</b> 선다');
  is(메뉴.length > 0 && 메뉴.every(h => h >= 바닥),
     '  ★★ <b>열셋이 다 ' + 바닥 + 'px 이상</b>이다 — 지금 '
     + (메뉴.length ? Math.min.apply(null, 메뉴) + '~' + Math.max.apply(null, 메뉴) + 'px' : '(없음)')
     + ' (판 X224 까지는 다 34px 이었습니다)');

  /* ── 폰에서는 안 길어졌나 ─────────────────────────────────────── */
  console.log('\n[폰] 📱 <b>폰에서는 한 픽셀도 안 길어졌다</b>');
  /* ★ 이 격자는 폰에서 「📂 카테고리」 뒤로 접혀 있습니다 — 그래서 칸을
     키워도 폰 화면은 그대로입니다. 접이가 풀리면 이 줄이 웁니다 (8번). */
  is(본[390].격자높이 === 0,
     '  ★ 메뉴 격자가 폰에서 <b>접혀</b> 있다 — ' + 본[390].격자높이 + 'px '
     + '(펴지면 44×7줄 + 틈 = 약 350px 이 첫 화면을 먹습니다)');

  /* ── 안 한 것은 안 했다고 ─────────────────────────────────────── */
  /* ── 왼쪽 입력 기둥 (판 X226) ─────────────────────────────────── */
  console.log('\n[기둥] 📜 <b>왼쪽 입력 기둥은 굴러간다</b> — 길어져도 안 밀린다');
  /* ★ 글 적는 칸 마흔을 44px 로 올리며 기둥 속이 2,315 → 2,587px 이
     되었습니다. 이 기둥은 <b>제 창 안에서 굴러가므로</b> 길어진 만큼 더
     굴리실 뿐 화면이 밀리거나 잘리지 않습니다. 선은 <b>3,200px</b> —
     여기서 더 불면 한 번에 보기 어려워집니다. 줄이면 같이 내리십시오 (0-1번). */
  is(본[1280].기둥속 > 0 && 본[1280].기둥속 <= 3200,
     '  ★ 기둥 속이 <b>' + 본[1280].기둥속 + 'px</b> — 선 3200px'
     + ' (글칸 마흔을 44px 로 올려 2,315 → 2,587px 이 되었습니다)');

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 빨간불 — 계산기에 손가락이 덜 닿는 자리가 있습니다'); process.exit(1); }
  console.log('✓ 계산기에서 누르는 자리가 폰·PC 모두 ' + 바닥 + 'px 이상입니다 (메뉴 칸 열셋 포함).');
})();
