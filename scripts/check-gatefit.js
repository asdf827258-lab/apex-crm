/* ══ 🔑 들어가기 전 화면이 읽히나 — 날마다 처음 보는 자리 (판 X236) ═════

   ⚠ <b>이름 이야기를 먼저 적어 둡니다.</b> 이 자를 처음에 check-login.js
     로 만들었다가, <b>이미 있던 check-login 을 덮어썼습니다</b> — 그 자는
     「서버가 거절할 때 로그인 단추가 멈추지 않는가」 를 봅니다. 물음이
     아예 다릅니다. check-cilist 가 「두 번 적힌 점검이 있다」 로 잡아
     주어 되살렸고, 이 자는 이름을 바꿨습니다. CLAUDE.md 8번의 「이미
     있는 파일 이름을 확인하고 만든다」 가 바로 이 자리입니다.

   사장님 말씀 (2026-10-28) — 라이브를 재어 드리다 제가 먼저 보고 여쭈었고
   <b>「응 고쳐줘」</b> 하셨습니다. 로그인 화면에 <b>11px 글씨 둘</b>
   (「오늘 하루」·「넣기」 · ui.css 의 .t-glab)이 있었습니다.

   ── 왜 아무도 못 봤나 ─────────────────────────────────────────────
   ★★ 화면을 재는 자들(check-phonefit · check-read)은 <b>로그인을 건너뛰고</b>
     잽니다 — 씨를 심어 들어간 판으로 102개 화면을 돕니다. 그래서 「13px
     아래 0개」 라고 적으면서도 <b>사장님이 제일 먼저 보는 화면</b>은 한
     번도 안 봤습니다. 「다 봤다」 로 읽히는 초록이 실은 그 화면을 비켜
     가고 있었습니다 (CLAUDE.md 8번 · 0-1번).
   ★ 그래서 이 자는 <b>씨를 안 심습니다.</b> 아무것도 안 하고 열어서, 사장님
     브라우저가 처음 보여 주는 그대로 잽니다.

   ── 이 자가 지키는 것 ─────────────────────────────────────────────
     [1] ★★ <b>13px 아래 글자 0개</b> — 폰(390)·컴퓨터(1280) 둘 다.
         이 앱의 글씨 바닥은 13px 입니다(판 X146 · 사장님 말씀 2026-10-21
         「가독성이 너무 떨어져서 … 전부」).
     [2] <b>들어가는 길이 정말 있나</b> — 「로그인」 이라고 적힌 누를 곳이
         서나. 글씨를 고치다 문을 막으면 앱을 못 엽니다 (6번).
     [3] <b>옆으로 안 새나</b> — 폰에서 글이 화면 밖으로 밀리지 않나.
     [4] <b>누를 곳 수를 적어 둡니다</b> — 44px 아래가 지금 몇인지.
         ⚠ <b>0 이라고 적지 않습니다.</b> 재어 보니 폰 35개 · 컴퓨터 29개
           입니다(서랍 줄들 · 34~42px). 사장님이 시키신 것은 <b>글씨</b>
           였고, 서랍 줄을 다 키우면 서랍 길이가 달라집니다. 안 한 것은
           안 했다고 적고(1번), <b>늘면 울게</b> 둡니다. 줄이면 같이
           내리십시오 (0-1번).
     [5] <b>바깥을 한 번도 안 부릅니다</b> (7번) — 사장님 서버를 안 읽습니다.
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

/* 손가락 바닥 — 판 X146·X147 이 정한 수입니다. 여기서 또 정하지 않습니다. */
const 바닥 = 13;        /* 글씨 */
/* 44px 아래 누를 곳 — <b>잰 값 그대로</b>입니다. 0 을 목표로 적지 않습니다 (1번). */
const 누름선 = { 390: 35, 1280: 29 };

const 재기 = () => {
  const 보임 = (e) => {
    const r = e.getBoundingClientRect(), st = getComputedStyle(e);
    return r.width > 1 && r.height > 1 && st.visibility !== 'hidden'
        && st.display !== 'none' && st.opacity !== '0';
  };
  /* 글자가 <b>직접 달린</b> 칸만 셉니다 — 겉옷까지 세면 같은 글을 여러 번 셉니다 */
  const 작은 = [];
  for (const e of document.querySelectorAll('body *')) {
    if (!e.childNodes.length) continue;
    let 글 = false;
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) 글 = true;
    if (!글 || !보임(e)) continue;
    const fs2 = parseFloat(getComputedStyle(e).fontSize);
    if (fs2 < 13) 작은.push(fs2 + 'px ' + e.tagName.toLowerCase()
      + ('' + e.className ? '.' + ('' + e.className).trim().split(/\s+/)[0] : '')
      + ' 「' + (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18) + '」');
  }
  const 누름 = [...document.querySelectorAll('button, a[href], input, select, textarea')]
    .filter(보임);
  const 들어가는길 = 누름
    .map(e => (e.innerText || e.value || e.title || '').replace(/\s+/g, ' ').trim())
    .filter(t => /로그인|시작하기/.test(t));
  return {
    작은: 작은, 누름수: 누름.length,
    좁은: 누름.filter(e => e.getBoundingClientRect().height < 44).length,
    길: 들어가는길.slice(0, 4),
    폭: Math.round(document.documentElement.scrollWidth),
    창: Math.round(document.documentElement.clientWidth),
    글자수: (document.body.innerText || '').replace(/\s+/g, '').length
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
    /* ★ 씨를 <b>안 심습니다</b> — 사장님이 처음 보는 그대로입니다 */
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html',
                 { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(6000);
    본[W] = await p.evaluate(재기);
    await ctx.close();
  }
  await b.close(); srv.close();

  for (const W of [390, 1280]) {
    const r = 본[W];
    console.log('\n[' + (W === 390 ? '폰 390' : '컴퓨터 1280') + '] 🔑 <b>들어가기 전</b> — 글자 '
      + r.글자수 + '자 · 누를 곳 ' + r.누름수 + '개');
    is(r.글자수 > 50, '  화면이 <b>정말 그려졌다</b> — ' + r.글자수 + '자'
      + ' (빈 화면을 재면 「다 고쳐졌다」 로 보입니다)');
    is(r.작은.length === 0,
       '  ★★ <b>' + 바닥 + 'px 아래 글자가 없다</b> — ' + r.작은.length + '개'
       + (r.작은.length ? ' ← ' + r.작은.slice(0, 4).join(' · ') : '')
       + ' (판 X236 까지는 .t-glab 둘이 11px 이었습니다)');
    is(r.길.length > 0,
       '  <b>들어가는 길</b>이 있다 — 「' + (r.길.join('」 「') || '(없음)') + '」');
    is(r.폭 <= r.창 + 2,
       '  <b>옆으로 안 샌다</b> — 글 폭 ' + r.폭 + 'px / 창 ' + r.창 + 'px');
    is(r.좁은 <= 누름선[W],
       '  누를 곳 중 44px 아래 <b>' + r.좁은 + '개</b> — 선 ' + 누름선[W] + '개'
       + (r.좁은 > 누름선[W] ? ' ← 늘었습니다. 서랍 줄을 더 빽빽하게 하지 마십시오'
          : (r.좁은 < 누름선[W] ? ' (줄었습니다 — 선도 같이 내려 주십시오 · 0-1번)' : '')));
  }

  console.log('\n[조용한가] 콘솔');
  is(터짐.length === 0, '  열기만 해도 <b>안 터진다</b> — ' + 터짐.length + '개'
    + (터짐.length ? ' ← ' + 터짐.slice(0, 2).join(' | ') : ''));

  console.log('\n──────────────────────────────');
  if (bad) {
    console.log('✗ ' + bad + '가지 빨간불 — 사장님이 날마다 처음 보는 화면입니다.');
    process.exit(1);
  }
  console.log('✓ 들어가기 전 화면도 ' + 바닥 + 'px 바닥을 지키고, 들어가는 길이 섭니다.');
})();
