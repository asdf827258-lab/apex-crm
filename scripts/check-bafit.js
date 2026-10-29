/* ══ 📋 보장 전·후 만들기 — 손이 닿나 (판 X241) ═════════════════════════

   사장님 말씀 (2026-10-29) — <b>「응 초록이면 병합하고 보장 전후도 올려」</b>
   (📒 하루 한 장을 고친 다음 자리입니다).

   ── 손대기 전 ─────────────────────────────────────────────────────
   라이브를 재어 보니 <b>44px 아래 누를 곳이 136곳</b>이었습니다 —
   담보 금액을 적는 칸 <b>130개</b>(.st input · 30px) + 이름·나이 칸 다섯과
   성별 고르개 하나(38px). 글씨는 이미 13px 바닥을 지키고 있었습니다.
   사장님이 날마다 고객 앞에서 여는 화면인데, 금액을 적는 칸이 30px 이라
   손가락이 빗나갔습니다 (바닥 44px · 판 X146·X147).

   ── ★★ 길이를 먼저 재어 보고 고쳤습니다 ──────────────────────────
   이 파일에 앞사람이 적어 둔 쪽지가 있었습니다 — 「21px 씩 늘어 만들기
   화면이 <b>8,000px 선</b>을 넘습니다(check-baedit [10]). 눈금을 올리는
   대신 자리를 옮겼습니다」. 그래서 <b>고치기 전에 미리 재었습니다</b> —
   견본 6건을 넣고 .st input 을 44px 로 올려 보니 <b>+6px</b>(8,665 →
   8,671px · 선 8,800px)이었습니다. 줄이 이미 44px 보다 높아서(담보
   이름이 자리를 차지합니다) 칸만 채워질 뿐이었습니다.
   ⚠ 처음에 <b>빈 화면</b>으로 재어 「+0px」 이라고 적었는데, 그 자가 재는
     것은 <b>견본을 넣은 만들기 화면</b>이었습니다. 자가 재는 자리와 같은
     자리에서 재야 합니다 (8번).

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] ★★ <b>44px 아래 누를 곳 0곳</b> — 폰(390)·컴퓨터(1280) 둘 다.
     [2] <b>13px 아래 글씨 0곳</b> — 지금도 0 입니다. 늘면 웁니다.
     [3] <b>글이 잘리지 않나</b> — 속이 넘치는 칸 0곳.
     [4] <b>화면이 정말 그려졌나</b> — 빈 화면을 재면 「다 고쳐졌다」 로
         보입니다. 글자 수와 누를 곳 수를 같이 적습니다.
     [5] <b>옆으로 안 새나</b> · 콘솔이 조용한가.
     [6] ⚠ 바깥을 한 번도 안 부릅니다 (7번).
   ★ <b>길이는 이 자가 안 묻습니다</b> — 그 임자는 check-baedit [10]
     입니다(8,800px). 한 물음에 한 답 (5번).
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
/* 폰에서 담보 표가 옆으로 넘치는 칸 수 — <b>잰 값 그대로</b>입니다 (1번).
   판 X241 에 재어 폰 11곳 · 컴퓨터 0곳. 제 고침 전에도 같았습니다. */
const 잘림선 = { 390: 11, 1280: 0 };

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
    await p.goto('http://127.0.0.1:' + PORT + '/app/ba.html',
                 { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(6500);
    본[W] = await p.evaluate(재기);
    await ctx.close();
  }
  await b.close(); srv.close();

  for (const W of [390, 1280]) {
    const r = 본[W];
    console.log('\n[' + (W === 390 ? '폰 390' : '컴퓨터 1280') + '] 📋 <b>보장 전·후 만들기</b> — 글 '
      + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개');
    is(r.글자수 > 1000 && r.누름수 > 50,
       '  화면이 <b>정말 그려졌다</b> — 글 ' + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개'
       + ' (빈 화면을 재면 「다 고쳐졌다」 로 보입니다)');
    is(r.작은.length === 0,
       '  ★★ <b>' + 글바닥 + 'px 아래 글씨가 없다</b> — ' + r.작은.length + '곳'
       + (r.작은.length ? ' ← ' + r.작은.slice(0, 5).join(' · ') : '')
       + ' (지금도 0 입니다 — 늘면 웁니다)');
    is(r.좁은.length === 0,
       '  ★★ <b>' + 손바닥 + 'px 아래 누를 곳이 없다</b> — ' + r.좁은.length + '곳'
       + (r.좁은.length ? ' ← ' + r.좁은.slice(0, 5).join(' · ') : '')
       + ' (판 X241 까지는 <b>136곳</b>이었습니다 — 담보 금액 칸 130개가 30px, 이름·나이·성별 여섯이 38px)');
    /* ⚠ <b>잰 값 그대로</b>입니다 — 0 을 목표로 적지 않습니다 (1번).
       폰에서 담보 표(div.st) 열하나가 <b>112~115px 옆으로 넘칩니다.</b>
       ★★ <b>제 고침과 무관합니다</b> — main 그대로일 때도 11곳이고, 제가
         올린 것은 세로(min-height)뿐입니다. 되돌려 재어 확인했습니다.
       ★ <b>안 고쳤습니다</b> — 시키신 것은 누를 곳이었고, 담보 표를 폰
         폭에 맞추는 일은 표 꼴을 바꾸는 큰 일입니다. 안 한 것은 안 했다고
         적고(1번) <b>늘면 울게</b> 둡니다. 줄이면 선도 같이 내리십시오. */
    is(r.잘림.length <= 잘림선[W],
       '  ★ <b>옆으로 잘리는 칸</b> ' + r.잘림.length + '곳 — 선 ' + 잘림선[W] + '곳'
       + (r.잘림.length > 잘림선[W]
           ? ' ← 늘었습니다: ' + r.잘림.slice(0, 3).join(' · ')
           : (r.잘림.length < 잘림선[W] ? ' (줄었습니다 — 선도 같이 내려 주십시오 · 0-1번)' : ''))
       + ' (잘린 글은 안 보이는 글입니다 · 판 X229)');
    is(r.폭 <= r.창 + 2,
       '  <b>옆으로 안 샌다</b> — 글 폭 ' + r.폭 + 'px / 창 ' + r.창 + 'px');
  }

  console.log('\n[조용한가] 콘솔');
  is(터짐.length === 0, '  열기만 해도 <b>안 터진다</b> — ' + 터짐.length + '개'
    + (터짐.length ? ' ← ' + 터짐.slice(0, 2).join(' | ') : ''));

  console.log('\n──────────────────────────────');
  if (bad) {
    console.log('✗ ' + bad + '가지 빨간불 — 📋 보장 전·후는 고객 앞에서 여는 화면입니다.');
    process.exit(1);
  }
  console.log('✓ 📋 보장 전·후 만들기가 글씨 ' + 글바닥 + 'px · 손가락 ' + 손바닥 + 'px 바닥을 지킵니다.');
})();
