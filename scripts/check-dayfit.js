/* ══ 📒 하루 한 장이 읽히나 · 손이 닿나 (판 X240) ═══════════════════════

   사장님 말씀 (2026-10-29) — <b>「하루 한장부터 고쳐줘」</b>.

   ── 손대기 전 ─────────────────────────────────────────────────────
   라이브를 재어 보니 이 화면이 제일 심했습니다 — <b>13px 아래 글씨 108곳</b>
   (10 ~ 12.5px) · <b>44px 아래 누를 곳 18곳</b>. 이 앱의 바닥은 글씨
   <b>13px</b>(판 X146 · 사장님 말씀 2026-10-21 「가독성이 너무 떨어져서 …
   전부」)과 손가락 <b>44px</b>(판 X146·X147)입니다.

   ── 왜 아무도 안 보고 있었나 ──────────────────────────────────────
   ★★ 이 화면을 보는 자가 일곱(check-day · check-ttok · check-queue ·
     check-lightmode · check-phonefav · check-cimp · check-nofile)인데
     <b>글씨 크기와 누를 곳을 묻는 자는 하나도 없었습니다.</b> 저마다 제가
     지키려고 만든 것만 봅니다 (0-1번). check-read 는 「따로 선 화면」 을
     보는데 그 목록에 이 화면이 없습니다 — 그래서 108곳이 조용했습니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] ★★ <b>13px 아래 글씨 0곳</b> — 폰(390)·컴퓨터(1280) 둘 다.
     [2] ★★ <b>44px 아래 누를 곳 0곳</b> — 둘 다.
     [3] <b>글이 잘리지 않나</b> — 속이 넘치는 칸 0곳. 글씨를 올리니
         「상담까지 갔는데 고객 365일에 없습니다 — 넘기기」 가 nowrap 에
         31px 잘렸습니다. <b>잘린 글은 안 보이는 글</b>입니다 (판 X229).
     [4] <b>화면이 정말 그려졌나</b> — 빈 화면을 재면 「다 고쳐졌다」 로
         보입니다. 글자 수와 누를 곳 수를 같이 적습니다.
     [5] <b>옆으로 안 새나</b> · 콘솔이 조용한가.
     [6] ⚠ 바깥을 한 번도 안 부릅니다 (7번).

   ⚠ <b>px 로 못 박지 않습니다</b> — 「몇 px 이하」 는 글꼴을 타서 CI 에서만
     웁니다(check-guide 가 723px 로, check-gatefit 가 요금 단추로 데인
     그 자리). 여기서 묻는 것은 <b>「바닥 아래가 몇 곳인가」</b> 뿐이고,
     바닥(13 · 44)은 판 X146·X147 이 정한 수를 그대로 씁니다.
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

const 재기 = () => {
  const 보임 = (e) => {
    const r = e.getBoundingClientRect(), st = getComputedStyle(e);
    return r.width > 1 && r.height > 1 && st.visibility !== 'hidden'
        && st.display !== 'none' && st.opacity !== '0';
  };
  const 이름 = (e) => {
    let s = e.tagName.toLowerCase();
    if (e.id) return '#' + e.id;
    const c = ('' + e.className).trim().split(/\s+/).filter(Boolean);
    return c.length ? s + '.' + c[0] : s;
  };
  /* 글씨 — 글자가 <b>직접 달린</b> 칸만 셉니다(겉옷까지 세면 겹칩니다) */
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
  /* 누를 곳 */
  const 누름 = [...document.querySelectorAll('button, a[href], input, select, textarea')]
    .filter(보임).filter(e => e.type !== 'hidden');
  const 좁은 = 누름.filter(e => e.getBoundingClientRect().height < 44).map(e =>
    Math.round(e.getBoundingClientRect().height) + 'px ' + 이름(e)
    + ' 「' + (e.innerText || e.value || e.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 14) + '」');
  /* 글이 잘리는 칸 — 제 손으로 굴리게 둔 칸(overflow:auto/scroll)은 뺍니다 */
  const 잘림 = [];
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect(); if (r.width <= 1) continue;
    const st = getComputedStyle(e);
    if (st.overflowX === 'auto' || st.overflowX === 'scroll') continue;
    if (e.scrollWidth <= e.clientWidth + 2) continue;
    잘림.push((e.scrollWidth - e.clientWidth) + 'px ' + 이름(e)
      + ' 「' + (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20) + '」');
  }
  return {
    작은, 좁은, 잘림, 누름수: 누름.length,
    글자수: (document.body.innerText || '').replace(/\s+/g, '').length,
    폭: Math.round(document.documentElement.scrollWidth),
    창: Math.round(document.documentElement.clientWidth)
  };
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();
  const 본 = {}; const 터짐 = [];

  for (const W of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 } });
    /* ⚠ 바깥을 <b>다 막습니다</b> — 사장님 서버를 안 읽습니다 (7번) */
    await ctx.route('**://**', r =>
      r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => 터짐.push(String(e.message).slice(0, 90)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/day.html',
                 { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(6500);
    본[W] = await p.evaluate(재기);
    await ctx.close();
  }
  await b.close(); srv.close();

  for (const W of [390, 1280]) {
    const r = 본[W];
    console.log('\n[' + (W === 390 ? '폰 390' : '컴퓨터 1280') + '] 📒 <b>하루 한 장</b> — 글 '
      + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개');
    is(r.글자수 > 300 && r.누름수 > 10,
       '  화면이 <b>정말 그려졌다</b> — 글 ' + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개'
       + ' (빈 화면을 재면 「다 고쳐졌다」 로 보입니다)');
    is(r.작은.length === 0,
       '  ★★ <b>' + 글바닥 + 'px 아래 글씨가 없다</b> — ' + r.작은.length + '곳'
       + (r.작은.length ? ' ← ' + r.작은.slice(0, 5).join(' · ') : '')
       + ' (판 X240 까지는 <b>108곳</b>이었습니다 · 10~12.5px)');
    is(r.좁은.length === 0,
       '  ★★ <b>' + 손바닥 + 'px 아래 누를 곳이 없다</b> — ' + r.좁은.length + '곳'
       + (r.좁은.length ? ' ← ' + r.좁은.slice(0, 5).join(' · ') : '')
       + ' (판 X240 까지는 <b>18곳</b>이었습니다 · 28~42px)');
    is(r.잘림.length === 0,
       '  ★ <b>글이 잘리는 칸이 없다</b> — ' + r.잘림.length + '곳'
       + (r.잘림.length ? ' ← ' + r.잘림.slice(0, 3).join(' · ') : '')
       + ' (잘린 글은 안 보이는 글입니다 · 판 X229)');
    is(r.폭 <= r.창 + 2,
       '  <b>옆으로 안 샌다</b> — 글 폭 ' + r.폭 + 'px / 창 ' + r.창 + 'px');
  }

  console.log('\n[조용한가] 콘솔');
  is(터짐.length === 0, '  열기만 해도 <b>안 터진다</b> — ' + 터짐.length + '개'
    + (터짐.length ? ' ← ' + 터짐.slice(0, 2).join(' | ') : ''));

  console.log('\n──────────────────────────────');
  if (bad) {
    console.log('✗ ' + bad + '가지 빨간불 — 📒 하루 한 장은 고객 앞에서 여는 화면입니다.');
    process.exit(1);
  }
  console.log('✓ 📒 하루 한 장이 글씨 ' + 글바닥 + 'px · 손가락 ' + 손바닥 + 'px 바닥을 지킵니다.');
})();
