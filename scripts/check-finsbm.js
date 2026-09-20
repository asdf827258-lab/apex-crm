/* ══════════════════════════════════════════════════════════════════
   check-finsbm.js — <b>폰에서 계산기가 첫 화면에 서는가.</b>

   사장님 말씀 — 「재무설계계산기도 핸드폰으로 키니까, 안보인다. 왼쪽
   메뉴 위에 카테고리가 창을 다 잡고 있어서」.

   390×844 폰에서 재 본 자리입니다 (2026-09-20) —
     왼쪽 입력칸(.sidebar)   2,258px   ← 화면 2.7 개
     보고서가 시작되는 자리   2,712px   ← <b>3.2 화면</b>을 내려야 나온다
     문서 전체              4,744px    그중 <b>절반 넘게</b>가 입력칸
   폰으로 계산기를 열면 계산기가 아니라 <b>입력칸 목록이 세 화면</b> 섰습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 폰에서 <b>열자마자 보고서가 선다</b> — 한 화면 안에서 시작한다
     [2] 입력칸은 <b>가려졌을 뿐</b> 판에 그대로다 — 값이 계속 읽힌다
         (display:none 이라 계산이 안 멈춘다. 지우면 계산이 멈춘다)
     [3] <b>되돌아올 길이 늘 보인다</b> — 머리띠 단추로 열고, 입력칸 맨 위
         단추로 닫는다. 길이 안 보이면 접힌 것이 아니라 없어진 것이다
     [4] 단추는 <b>손가락으로 눌리는 크기</b>다 (44px)
     [5] <b>PC 는 하나도 안 바뀐다</b> — 981px 이상에서는 입력칸이 그대로 서고
         접기 단추는 아예 안 뜬다. 안 그러면 상담 중에 화면이 달라진다
     [6] 접은 채로도 <b>탭을 옮겨 다닐 수 있다</b> — 계산기가 살아 있다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8898;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const look = (page) => page.evaluate(() => {
  const bx = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + scrollY), disp: getComputedStyle(e).display }; };
  const btn = document.getElementById('sbmBtn');
  const cls = document.querySelector('.sbm-close');
  return {
    sidebar: bx('.sidebar'), pane: bx('.tab-pane.on'), docH: document.documentElement.scrollHeight,
    btn: btn ? { t: (btn.textContent || '').trim(), disp: getComputedStyle(btn).display, h: Math.round(btn.getBoundingClientRect().height) } : null,
    close: cls ? { disp: getComputedStyle(cls).display, h: Math.round(cls.getBoundingClientRect().height) } : null,
    shut: document.body.classList.contains('sbm-shut'),
    /* 가려도 값이 읽히는가 — 계산이 이 값들 위에 선다 */
    reads: (function () { const e = document.getElementById('s_inf'); return e ? e.value : null; })(),
    age: (function () { const e = document.getElementById('s_age'); return e ? e.value : null; })()
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/finance.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  const shut = await look(page);
  console.log('\n[1] 폰에서 <b>열자마자 보고서가 선다</b>');
  is(shut.shut === true, '  처음 여시면 입력칸은 <b>접힌 채</b>로 시작한다');
  is(!!shut.pane && shut.pane.top < 844,
     '  보고서가 <b>첫 화면 안</b>에서 시작한다 — ' + (shut.pane ? shut.pane.top : '?') + 'px (화면 844px)');
  is(!!shut.sidebar && shut.sidebar.disp === 'none', '  입력칸이 화면을 <b>안 잡고 있다</b>');

  console.log('\n[2] 입력칸은 <b>가려졌을 뿐</b> — 값이 계속 읽힌다');
  is(shut.reads !== null && shut.reads !== '', '  물가상승률이 <b>그대로 읽힌다</b> — ' + shut.reads + '%');
  is(shut.age !== null, '  고객 나이 칸도 <b>판에 있다</b> — ' + shut.age + '세');
  /* 가린 채로 값을 바꾸고 <b>앱이 제 길로</b> 다시 그리게 합니다.
     읽는 함수 이름을 직접 부르면 그 함수가 바뀔 날 헛것을 잡습니다 (8번).
     보고서 글자가 <b>바뀐다면</b> 가린 칸을 읽은 것입니다. */
  const calc = await page.evaluate(async () => {
    const e = document.getElementById('s_inf'); if (!e) return { ok: false };
    const pane = () => { const x = document.querySelector('.tab-pane.on'); return x ? (x.innerText || '') : ''; };
    const was = e.value;
    const before = pane();
    e.value = '9';
    if (typeof infSync === 'function') infSync(); else if (typeof render === 'function') render();
    await new Promise(r => setTimeout(r, 700));
    const after = pane();
    e.value = was;
    if (typeof infSync === 'function') infSync(); else if (typeof render === 'function') render();
    await new Promise(r => setTimeout(r, 400));
    return { ok: true, changed: before !== after, len: before.length };
  });
  is(calc.ok && calc.changed,
     '  가린 채로 물가상승률을 고쳐도 <b>보고서 숫자가 따라 바뀐다</b> — 계산이 안 멈췄다');

  /* 단추는 <b>판에서</b> 누릅니다 — page.click 은 안 보이면 기다리다 터져서
     「무엇이 틀렸는지」 대신 에러 글을 남깁니다. 보이는지는 바로 위에서
     따로 재서 — 안 보이면 그 줄이 빨간불입니다 (8번). */
  console.log('\n[3] <b>되돌아올 길이 늘 보인다</b>');
  is(!!shut.btn && shut.btn.disp !== 'none', '  머리띠에 <b>여는 단추</b>가 서 있다 — 「' + (shut.btn ? shut.btn.t : '') + '」');
  await page.evaluate(() => { const b = document.getElementById('sbmBtn'); if (b) b.click(); }); await page.waitForTimeout(450);
  const open = await look(page);
  is(open.shut === false && open.sidebar.disp !== 'none', '  누르면 입력칸이 <b>펴진다</b>');
  is(!!open.close && open.close.disp !== 'none', '  입력칸 맨 위에 <b>닫는 단추</b>가 선다');
  is(/닫/.test(open.btn.t), '  머리띠 단추가 <b>닫기로 바뀐다</b> — 「' + open.btn.t + '」');
  await page.evaluate(() => { const b = document.querySelector('.sbm-close'); if (b) b.click(); }); await page.waitForTimeout(450);
  const again = await look(page);
  is(again.shut === true && again.sidebar.disp === 'none', '  닫는 단추로 <b>다시 접힌다</b>');
  is(again.pane.top < 844, '  닫으면 보고서가 <b>다시 첫 화면</b>에 선다 — ' + again.pane.top + 'px');

  console.log('\n[4] 단추는 <b>손가락으로 눌리는 크기</b>다');
  is(again.btn.h >= 44, '  여는 단추 ' + again.btn.h + 'px (44px 이상)');
  await page.evaluate(() => { const b = document.getElementById('sbmBtn'); if (b) b.click(); }); await page.waitForTimeout(400);
  const o2 = await look(page);
  is(o2.close.h >= 44, '  닫는 단추 ' + o2.close.h + 'px (44px 이상)');

  console.log('\n[6] 접은 채로도 <b>탭을 옮겨 다닐 수 있다</b>');
  await page.evaluate(() => { const b = document.querySelector('.sbm-close'); if (b) b.click(); }); await page.waitForTimeout(350);
  const tab = await page.evaluate(async () => {
    const b = [...document.querySelectorAll('.report-tab')].find(x => /보험 대시보드/.test(x.textContent || ''));
    if (!b) return null;
    b.click(); await new Promise(r => setTimeout(r, 700));
    const on = document.querySelector('.tab-pane.on');
    return { id: on ? on.id : '', h: on ? Math.round(on.getBoundingClientRect().height) : 0,
             shut: document.body.classList.contains('sbm-shut') };
  });
  is(!!tab && tab.id === 'tab-insurance', '  접은 채로 다른 탭이 <b>열린다</b> — ' + (tab ? tab.id : 'null'));
  is(!!tab && tab.h > 200, '  그 탭에 <b>내용이 그려진다</b> — ' + (tab ? tab.h : 0) + 'px');
  is(!!tab && tab.shut === true, '  탭을 옮겨도 <b>접힌 채로</b> 있다');

  console.log('\n[5] <b>PC 는 하나도 안 바뀐다</b>');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  const pc = await look(page);
  is(pc.sidebar.disp !== 'none' && pc.sidebar.w > 200,
     '  PC 에서 입력칸이 <b>그대로 선다</b> — ' + pc.sidebar.w + 'px (접어 둔 채로 넓혀도)');
  is(pc.btn.disp === 'none', '  PC 에서는 접기 단추가 <b>아예 안 뜬다</b>');
  is(pc.close.disp === 'none', '  PC 에서는 닫기 단추도 <b>안 뜬다</b>');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 폰 계산기 — 고칠 자리 ' + bad + '곳' : '✓ 폰 계산기 — 열자마자 보고서가 서고, 입력칸은 한 번 누르면 돌아옵니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
