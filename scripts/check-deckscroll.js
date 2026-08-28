/* <b>발표로 넘어가면 아래쪽을 못 보여 드리던 자리.</b>

   사장님이 두 가지를 말씀하셨습니다.

     ① 「재무설계 상담자료 발표자료로 하면 글씨가 작아져서 안 보인다.
         스크롤로 내려서 <b>글씨 크기에 손상없이</b> 내리고 싶다」
     ② 「미끼상품레이더도 발표로 넘어가면 <b>슬라이드로 내릴 수가 없다</b>」

   재 보니 둘 다 사실이었고, 원인이 서로 달랐습니다.

   ① <b>글씨를 절반까지 줄이고 있었다.</b> 장이 길면 한 판에 다 넣으려고
      배율을 <b>0.52배</b>까지 낮췄다. 48장 중 스무 장 넘게 0.9배 아래였다.
      고객 앞 화면에서 글씨가 반이 되면 못 읽으신다 — 자료를 만든 뜻이
      없어진다. 길다고 작게 만드는 것은 답이 아니다.

      그래서 <b>폭에만</b> 맞춘다. 폭은 맞춰야 옆으로 안 잘린다. 높이가
      넘치면 <b>내려서</b> 본다 — 글씨 크기는 그대로다.

   ② <b>넘기는 클릭 자리가 화면의 78%를 덮고 있었다.</b> 그 위에서는 휠도
      손가락도 막혀서, 한 화면을 넘는 장을 <b>0px 도 못 내렸다.</b> 28장 중
      <b>26장</b>이 한 화면을 넘는데 아래쪽을 한 번도 못 보여 드린 셈이다.

      양옆 좁은 띠만 남기고 가운데를 비웠다. 넘기는 길은 띠 · 위쪽 ‹ ›
      단추 · ←→ 키 · 옆으로 밀기, 넷이 남는다.

   두 자리에 같은 규칙을 둡니다 — 한 화면에서 배운 것이 다른 화면에서도
   그대로 통해야 고객 앞에서 손이 안 미끄러집니다.

     · <b>↓ · PageDown</b> — 먼저 내리고, 바닥에 닿으면 다음 장
     · <b>← →</b>          — 장 넘기기 (확실히 넘기는 길 하나는 남긴다)
     · <b>옆으로 밀기</b>   — 장 넘기기 · 위아래는 안 건드린다
     · <b>「↓ 아래로 더 있습니다」</b> — 안 적으면 첫 화면만 보고 넘기신다

   여기서 확인합니다.
     1. 재무설계 — 글씨를 <b>안 줄이는가</b> · 넘치면 스크롤되는가
     2. 재무설계 — ↓ 가 먼저 내리고 바닥에서 넘어가는가 · 말해 주는가
     3. 미끼상품 — 화면 가운데가 <b>비어 있는가</b> (덮여 있으면 못 내린다)
     4. 미끼상품 — ↓ 가 실제로 내려가는가 · 바닥에서 넘어가는가
     5. 둘 다 — ← → 는 <b>그대로</b> 장을 넘기는가 (되돌아갈 길)      */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const key = (page, k) => page.evaluate(k =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), k);

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const errs = [];

  /* ═══════════ 재무설계 상담자료 ═══════════ */
  const p1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p1.on('pageerror', e => errs.push('재무설계: ' + String(e).slice(0, 150)));
  await p1.goto(base + '/app/재무설계/상담자료.html', { waitUntil: 'domcontentloaded' });
  await p1.waitForTimeout(2200);

  console.log('\n[1] 재무설계 — 글씨를 줄이지 않는다');
  const fp = await p1.evaluate(async () => {
    const btn = [...document.querySelectorAll('button')]
      .filter(x => /프레젠테이션/.test(x.textContent))[0];
    if (!btn) return { err: '발표 단추를 못 찾음' };
    btn.click();
    await new Promise(r => setTimeout(r, 500));
    const box = document.getElementById('slides'), show = document.getElementById('show');
    const n = box.children.length;
    let worst = 9, scrolls = 0, hint = 0, tall = -1;
    for (let i = 0; i < n; i++) {
      go(i); await new Promise(r => setTimeout(r, 55));
      const el = box.querySelector('.slide.on'); if (!el) continue;
      worst = Math.min(worst, parseFloat(el.style.zoom || '1') || 1);
      if (box.classList.contains('scrolls')) {
        scrolls++; if (tall < 0) tall = i;
        if (show.classList.contains('hasmore')) hint++;
      }
    }
    return { n, worst: +worst.toFixed(2), scrolls, hint, tall, wide: show.classList.contains('wide') };
  });
  is(!fp.err && fp.wide, '  발표(가로) 모드로 들어간다' + (fp.err ? ' — ' + fp.err : ''));
  is(fp.worst >= 0.95,
     '  제일 작아진 배율이 <b>' + fp.worst + '배</b> — 0.95 아래로 안 줄인다 ' +
     '(고치기 전에는 0.52배 · 글씨가 절반이었다)');
  is(fp.scrolls > 0, '  넘치는 장은 <b>스크롤된다</b> — ' + fp.scrolls + ' / ' + fp.n + '장');
  is(fp.scrolls === fp.hint,
     '  넘치는 장마다 <b>「더 있습니다」</b>를 적는다 — ' + fp.hint + ' / ' + fp.scrolls + '장 ' +
     '(안 적으면 첫 화면만 보고 넘기신다)');

  console.log('\n[2] 재무설계 — ↓ 는 먼저 내리고, 바닥에서 다음 장');
  const fk = await p1.evaluate(async (tall) => {
    const box = document.getElementById('slides'), show = document.getElementById('show');
    go(tall); await new Promise(r => setTimeout(r, 250));
    const el0 = box.querySelector('.slide.on');
    const t0 = box.scrollTop;
    /* 내려갈 수 있는 만큼과 한 번에 내리는 만큼 — 둘 중 작은 것이 정답이다.
       화면·글꼴에 따라 넘치는 양이 달라지므로 픽셀 수를 못 박으면 흔들린다
       (CLAUDE.md 8번: 헛알람은 안 잡는 것보다 나쁘다). */
    const room = box.scrollHeight - box.clientHeight;
    const step = Math.round(box.clientHeight * 0.86);
    const want = Math.min(step, room);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const moved = box.scrollTop - t0, same = box.querySelector('.slide.on') === el0;
    /* <b>내려 둔 채로</b> ← 를 눌러 본다 — 여기서도 장이 넘어가야 한다.
       스크롤이 좌우까지 먹으면 발표 중에 되돌아갈 길이 없어진다. */
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    const leftWhileDown = box.querySelector('.slide.on') !== el0;
    go(tall); await new Promise(r => setTimeout(r, 250));
    box.scrollTop = Math.max(60, moved);
    await new Promise(r => setTimeout(r, 120));
    /* 올라오기도 되는가 */
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const backUp = box.scrollTop < Math.max(60, moved);
    /* 바닥에서는 다음 장으로 */
    box.scrollTop = box.scrollHeight; await new Promise(r => setTimeout(r, 250));
    const hintEnd = show.classList.contains('hasmore');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise(r => setTimeout(r, 350));
    const next = box.querySelector('.slide.on') !== el0;
    /* 새 장은 맨 위부터 */
    const topOnNew = box.scrollTop;
    /* ← → 는 그대로 장 넘기기 */
    const el1 = box.querySelector('.slide.on');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const left = box.querySelector('.slide.on') !== el1;
    return { moved, same, backUp, hintEnd, next, topOnNew, left, leftWhileDown, room, want };
  }, fp.tall);
  is(fk.moved >= fk.want - 2 && fk.moved > 0 && fk.same,
     '  ↓ 를 누르면 <b>' + fk.moved + 'px 내려가고</b> 장은 그대로다 — ' +
     '남은 ' + fk.room + 'px 중 내려야 할 ' + fk.want + 'px ' +
     '(고치기 전에는 이 자리가 아예 안 열렸다)');
  is(fk.backUp, '  ↑ 를 누르면 <b>올라온다</b> — 다시 보실 수 있다');
  is(!fk.hintEnd, '  바닥에 닿으면 <b>「더 있습니다」가 사라진다</b>');
  is(fk.next, '  바닥에서 ↓ 를 누르면 <b>다음 장</b>으로 간다');
  is(fk.topOnNew === 0, '  새 장은 <b>맨 위부터</b> 보인다 — 앞 장에서 내려 둔 자리가 안 남는다');
  is(fk.left && fk.leftWhileDown,
     '  ← 는 <b>내려 둔 채로도</b> 장을 넘긴다 — 발표 중에 되돌아갈 길이 남아 있다');
  await p1.close();

  /* ═══════════ 미끼상품 & 접촉전략 ═══════════ */
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p2.on('pageerror', e => errs.push('미끼상품: ' + String(e).slice(0, 150)));
  await p2.goto(base + '/app/상담자료/미끼상품_접촉전략.html?present=1', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1500);

  console.log('\n[3] 미끼상품 — 화면 가운데가 비어 있다');
  const mp = await p2.evaluate(async () => {
    const P = window.__present; if (!P) return { err: '발표 모드가 없다' };
    const pts = [[720, 300], [720, 500], [720, 760]];
    const covered = pts.filter(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return !!(el && /pvHit/.test(el.id || ''));
    }).length;
    const secs = [...document.querySelectorAll('section.wrap')].filter(s => s.id !== 'toc' && s.id !== 'cover');
    let over = 0, tall = -1;
    for (let i = 0; i < secs.length; i++) {
      P.go(i); await new Promise(r => setTimeout(r, 30));
      if (secs[i].scrollHeight > secs[i].clientHeight + 8) { over++; if (tall < 0) tall = i; }
    }
    /* 넘기는 띠는 <b>남아 있어야</b> 한다 — 없애면 마우스로 못 넘기신다 */
    const L = document.getElementById('pvHitL'), R = document.getElementById('pvHitR');
    const lw = L ? L.getBoundingClientRect().width : 0, rw = R ? R.getBoundingClientRect().width : 0;
    return { covered, over, tall, n: secs.length, lw: Math.round(lw), rw: Math.round(rw) };
  });
  is(!mp.err && mp.covered === 0,
     '  가운데 세 자리가 <b>안 덮여 있다</b> — 덮인 곳 ' + mp.covered + '군데 ' +
     '(덮여 있으면 휠·손가락이 막혀 0px 도 못 내린다)');
  is(mp.lw > 20 && mp.rw > 20 && (mp.lw + mp.rw) < 1440 * 0.35,
     '  넘기는 띠는 <b>양옆에 남아 있다</b> — 왼 ' + mp.lw + 'px · 오른 ' + mp.rw + 'px ' +
     '(마우스로 넘기는 길을 없애지 않는다)');
  is(mp.over > 0, '  한 화면을 넘는 장이 있다 — ' + mp.over + ' / ' + mp.n + '장');

  console.log('\n[4] 미끼상품 — ↓ 로 내려가고, 바닥에서 다음 장');
  const mk = await p2.evaluate(async (tall) => {
    const P = window.__present;
    const secs = [...document.querySelectorAll('section.wrap')].filter(s => s.id !== 'toc' && s.id !== 'cover');
    P.go(tall); await new Promise(r => setTimeout(r, 200));
    const s = secs[tall];
    const hint = document.body.classList.contains('pvmore');
    const t0 = s.scrollTop;
    const room = s.scrollHeight - s.clientHeight;
    const want = Math.min(Math.round(s.clientHeight * 0.86), room);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    const moved = s.scrollTop - t0, same = P.index === tall;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await new Promise(r => setTimeout(r, 600));
    const backUp = s.scrollTop < moved;
    s.scrollTop = s.scrollHeight; await new Promise(r => setTimeout(r, 250));
    const hintEnd = document.body.classList.contains('pvmore');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    const next = P.index !== tall;
    const topOnNew = secs[P.index].scrollTop;
    const at = P.index;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    return { hint, moved, same, backUp, hintEnd, next, topOnNew, left: P.index !== at, room, want };
  }, mp.tall);
  is(mk.hint, '  넘치는 장에 <b>「더 있습니다」</b>가 뜬다');
  is(mk.moved >= mk.want - 2 && mk.moved > 0 && mk.same,
     '  ↓ 를 누르면 <b>' + mk.moved + 'px 내려가고</b> 장은 그대로다 — ' +
     '남은 ' + mk.room + 'px 중 내려야 할 ' + mk.want + 'px ' +
     '(고치기 전에는 0px — 아예 안 내려갔다)');
  is(mk.backUp, '  ↑ 를 누르면 <b>올라온다</b>');
  is(!mk.hintEnd, '  바닥에 닿으면 <b>「더 있습니다」가 사라진다</b>');
  is(mk.next, '  바닥에서 ↓ 를 누르면 <b>다음 장</b>으로 간다');
  is(mk.topOnNew === 0, '  새 장은 <b>맨 위부터</b> 보인다');
  is(mk.left, '  ← 는 <b>그대로 장을 넘긴다</b>');
  await p2.close();

  console.log('\n[5] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 발표에서 아래쪽을 못 보여 드립니다')
                  : '✓ 글씨를 안 줄이고 · 내려서 볼 수 있고 · 아래에 더 있다고 말합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
