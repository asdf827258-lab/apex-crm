/* ══ 👓 따로 선 화면 셋이 읽히나 · 손이 닿나 (판 X244) ═══════════════════

   사장님 말씀 (2026-10-29) — <b>「응 초록이면 병합하고 남은셋도 해줘
   그리고 중복되는것들이 너무 많아서 이거 빨리 마무리하고」</b>.

   ── 셋을 한 자로 봅니다 ───────────────────────────────────────────
   🎓 TA 훈련(app/ta-train.html) · ✍️ 블로그(app/blog.html) ·
   🙅 거절 훈련장(app/reject-gym.html).
   ★ 자를 셋으로 나누지 않았습니다 — 같은 것을 묻고(13px · 44px), 고친
     까닭도 하나이기 때문입니다. 사장님께서 「중복되는 것이 많다」 하셔서
     오가는 횟수를 줄였습니다.

   ── 손대기 전 (라이브에서 잰 값) ─────────────────────────────────
     🎓 TA 훈련     13px 밑 16곳 · 44px 밑 3곳
     ✍️ 블로그      13px 밑  3곳 · 44px 밑 12곳 (적는 칸 열둘이 41px)
     🙅 거절 훈련장  13px 밑  5곳 · 44px 밑 2곳
   바닥은 글씨 <b>13px</b>(판 X146 · 사장님 말씀 2026-10-21 「가독성이
   너무 떨어져서 … 전부」)과 손가락 <b>44px</b>(판 X146·X147)입니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] ★★ 13px 아래 글씨 <b>0곳</b> — 세 화면 · 폰(390)·컴퓨터(1280).
     [2] ★★ 44px 아래 누를 곳 <b>0곳</b> — 같은 여섯 자리.
     [3] <b>화면이 정말 그려졌나</b> — 빈 화면을 재면 「다 고쳐졌다」 로
         보입니다. 글자 수와 누를 곳 수를 같이 적습니다.
     [4] <b>옆으로 안 새나</b> · 콘솔이 조용한가.
     [5] ★★ <b>44px 이 글로 못 박혀 있나</b> — px 는 글꼴을 탑니다.
         이 자는 바깥을 막아 웹폰트(Pretendard)를 못 받는데, 라이브는
         받아서 같은 단추가 2~5px 낮게 재집니다. 판 X239(요금 단추
         42px)·판 X243(「부재·거절·상담」 42px)에서 두 번 데인 자리라,
         <b>글자로도</b> 봅니다 — 그쪽은 글꼴을 안 탑니다 (8번).
     [6] ⚠ 바깥을 한 번도 안 부릅니다 (7번).
   ══════════════════════════════════════════════════════════════════ */

const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const MT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
             '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => {
    if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' });
    s.end(d);
  });
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 바닥 — 판 X146·X147 이 정한 수입니다. 여기서 또 정하지 않습니다. */
const 글바닥 = 13, 손바닥 = 44;

/* 세 화면 · 그리고 「글로 못 박혔나」 로 볼 자리 */
const 쪽 = [
  { 이름: '🎓 TA 훈련',    길: '/app/ta-train.html',
    글: [['출처 링크', /\.tt-src a\{[^}]*min-height:44px/]] },
  { 이름: '✍️ 블로그',     길: '/app/blog.html',
    글: [['적는 칸 열둘', /input,textarea\{[^}]*min-height:44px/]] },
  { 이름: '🙅 거절 훈련장', 길: '/app/reject-gym.html',
    글: [['출처 링크', /\.rg-src a\{[^}]*min-height:44px/]] }
];

const 재기 = () => {
  const 보임 = (e) => {
    const r = e.getBoundingClientRect(), st = getComputedStyle(e);
    return r.width > 1 && r.height > 1 && st.visibility !== 'hidden'
        && st.display !== 'none' && st.opacity !== '0';
  };
  const 이름 = (e) => {
    if (e.id) return '#' + e.id;
    const c = ('' + e.className).trim().split(/\s+/).filter(Boolean);
    return e.tagName.toLowerCase() + (c.length ? '.' + c[0] : '');
  };
  const 작은 = [];
  for (const e of document.querySelectorAll('body *')) {
    if (!e.childNodes.length) continue;
    let 글 = false;
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) 글 = true;
    if (!글 || !보임(e)) continue;
    const f = parseFloat(getComputedStyle(e).fontSize);
    if (f < 13) 작은.push(f + 'px ' + 이름(e)
      + ' 「' + (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 14) + '」');
  }
  const 누름 = [...document.querySelectorAll('button, a[href], input, select, textarea')]
    .filter(보임).filter(e => e.type !== 'hidden');
  const 좁은 = 누름.filter(e => e.getBoundingClientRect().height < 44).map(e =>
    Math.round(e.getBoundingClientRect().height) + 'px ' + 이름(e));
  return {
    작은, 좁은, 누름수: 누름.length,
    글자수: (document.body.innerText || '').replace(/\s+/g, '').length,
    폭: Math.round(document.documentElement.scrollWidth),
    창: Math.round(document.documentElement.clientWidth)
  };
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const 터짐 = [];

  for (const 한쪽 of 쪽) {
    const 본 = {};
    for (const W of [390, 1280]) {
      const ctx = await b.newContext({ viewport: { width: W, height: 844 } });
      /* ⚠ 바깥을 <b>다 막습니다</b> — 사장님 서버를 안 읽습니다 (7번) */
      await ctx.route('**://**', r =>
        r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
      const p = await ctx.newPage();
      p.on('pageerror', e => 터짐.push(한쪽.이름 + ': ' + String(e.message).slice(0, 70)));
      await p.goto('http://127.0.0.1:' + PORT + 한쪽.길,
                   { waitUntil: 'domcontentloaded', timeout: 90000 });
      await p.waitForTimeout(6000);
      본[W] = await p.evaluate(재기);
      await ctx.close();
    }
    for (const W of [390, 1280]) {
      const r = 본[W];
      console.log('\n[' + 한쪽.이름 + ' · ' + (W === 390 ? '폰 390' : '컴퓨터 1280') + '] 글 '
        + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개');
      is(r.글자수 > 300 && r.누름수 > 3,
         '  화면이 <b>정말 그려졌다</b> — 글 ' + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개');
      is(r.작은.length === 0,
         '  ★★ <b>' + 글바닥 + 'px 아래 글씨가 없다</b> — ' + r.작은.length + '곳'
         + (r.작은.length ? ' ← ' + r.작은.slice(0, 4).join(' · ') : ''));
      is(r.좁은.length === 0,
         '  ★★ <b>' + 손바닥 + 'px 아래 누를 곳이 없다</b> — ' + r.좁은.length + '곳'
         + (r.좁은.length ? ' ← ' + r.좁은.slice(0, 4).join(' · ') : ''));
      is(r.폭 <= r.창 + 2,
         '  <b>옆으로 안 샌다</b> — 글 폭 ' + r.폭 + 'px / 창 ' + r.창 + 'px');
    }
    /* ── 글로 못 박았나 — 글꼴을 안 타는 쪽 (판 X239·X243 의 교훈) ── */
    const SRC = fs.readFileSync(path.join(ROOT, 한쪽.길.replace(/^\//, '')), 'utf8');
    for (const [무엇, 재] of 한쪽.글) {
      is(재.test(SRC), '  ★★ <b>' + 무엇 + '</b>에 44px 이 <b>글로</b> 적혀 있다'
        + ' — px 는 글꼴을 탑니다(라이브는 웹폰트를 받아 2~5px 낮게 재집니다 · 8번)');
    }
  }
  await b.close(); srv.close();

  console.log('\n[조용한가] 콘솔');
  is(터짐.length === 0, '  열기만 해도 <b>안 터진다</b> — ' + 터짐.length + '개'
    + (터짐.length ? ' ← ' + 터짐.slice(0, 2).join(' | ') : ''));

  console.log('\n──────────────────────────────');
  if (bad) {
    console.log('✗ ' + bad + '가지 빨간불 — 따로 선 세 화면도 고객 앞에서 엽니다.');
    process.exit(1);
  }
  console.log('✓ 🎓 TA 훈련 · ✍️ 블로그 · 🙅 거절 훈련장이 글씨 ' + 글바닥
    + 'px · 손가락 ' + 손바닥 + 'px 바닥을 지킵니다.');
})();
