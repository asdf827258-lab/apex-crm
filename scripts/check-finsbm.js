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
     [7] <b>카테고리 열두 칸</b>도 접힌다 — 입력칸을 접어도 그 위에 카테고리가
         두 칸씩 여섯 줄(282px)로 서서 보고서를 또 밀어냈다. 「위에 카테고리가
         창을 다 잡고 있어서」 는 이 자리를 말씀하신 것이다.
         접힌 동안에도 <b>지금 어느 칸인지</b>는 단추에 적혀 있어야 한다 —
         안 적으면 접힌 것이 아니라 길을 잃은 것이다.
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
    top: bx('.report-topbar'),
    grid: bx('.top-tab-grid'),
    tshut: document.body.classList.contains('tbm-shut'),
    tbn: (function(){ var b=document.getElementById('tbmBtn'); if(!b)return null;
      var c=getComputedStyle(b);
      return { t:(b.textContent||'').trim(), disp:c.display,
        h:Math.round(b.getBoundingClientRect().height),
        /* 글자색과 바탕색을 같이 담는다 — 흰 글자에 흰 바탕이면 안 보인다 */
        fg:c.color, bg:c.backgroundColor }; })(),
    tabs: document.querySelectorAll('.top-tab-grid .report-tab').length,
    now: (function(){ var o=document.querySelector('.top-tab-grid .report-tab.on .rt-title');
      return o?(o.textContent||'').trim():''; })(),
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

  console.log('\n[7] <b>카테고리 열두 칸</b>도 접힌다');
  const g1 = await look(page);
  is(g1.tshut === true && !!g1.grid && g1.grid.disp === 'none',
     '  처음 여시면 카테고리가 <b>접힌 채</b>로 시작한다');
  /* 접힌 동안에도 <b>어디에 서 있는지</b>가 단추에 적혀 있어야 한다 (1번) */
  is(!!g1.tbn && g1.now !== '' && g1.tbn.t.indexOf(g1.now) >= 0,
     '  접혀 있어도 <b>지금 어느 칸인지</b> 단추에 적힌다 — ' + (g1.tbn ? g1.tbn.t : '없음'));
  is(!!g1.tbn && g1.tbn.h >= 44, '  카테고리 단추 ' + (g1.tbn ? g1.tbn.h : 0) + 'px (44px 이상)');
  /* 글자가 <b>눈에 보이는가.</b> 옆 단추를 그대로 베꼈다가 밝은 머리띠 위에
     흰 글자를 올려 안 보인 적이 있다 — 사진을 찍어 보고 알았다.
     글자와 바탕의 <b>밝기 차</b>를 실제로 잰다 (WCAG 대비 3 이상). */
  const con = (a, b) => {
    const lum = (c) => { const m = String(c).match(/[\d.]+/g) || [0, 0, 0];
      const f = m.slice(0, 3).map(v => { v = +v / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const cr = g1.tbn ? con(g1.tbn.fg, g1.tbn.bg) : 0;
  is(cr >= 3, '  카테고리 단추 글자가 <b>눈에 보인다</b> — 밝기 차 ' + cr.toFixed(1) +
     ' (3 이상) · ' + (g1.tbn ? g1.tbn.fg + ' / ' + g1.tbn.bg : ''));
  await page.evaluate(() => { const b = document.getElementById('tbmBtn'); if (b) b.click(); });
  await page.waitForTimeout(420);
  const g2 = await look(page);
  is(g2.tshut === false && !!g2.grid && g2.grid.disp !== 'none' && g2.tabs >= 12,
     '  단추를 누르면 <b>열두 칸이 다 뜬다</b> — ' + g2.tabs + '칸');
  /* 접었을 때 머리띠가 <b>실제로</b> 줄어들어야 한다. 클래스만 붙고 높이가
     그대로면 아무것도 안 접힌 것이다 (8번) */
  is(!!g1.top && !!g2.top && g2.top.h - g1.top.h >= 150,
     '  접으면 머리띠가 <b>그만큼 짧아진다</b> — 접음 ' + (g1.top ? g1.top.h : '?') +
     'px · 폄 ' + (g2.top ? g2.top.h : '?') + 'px');
  /* 하나 고르면 그 보고서로 가고 <b>저절로 다시 접힌다</b> */
  const pick = await page.evaluate(async () => {
    const b = [...document.querySelectorAll('.top-tab-grid .report-tab')]
      .find(x => /교육자금/.test(x.textContent || ''));
    if (!b) return null;
    b.click(); await new Promise(r => setTimeout(r, 800));
    const on = document.querySelector('.tab-pane.on');
    return { id: on ? on.id : '', shut: document.body.classList.contains('tbm-shut'),
             t: ((document.getElementById('tbmBtn') || {}).textContent || '').trim() };
  });
  is(!!pick && pick.id === 'tab-edufund', '  칸을 고르면 <b>그 보고서가 열린다</b> — ' + (pick ? pick.id : 'null'));
  is(!!pick && pick.shut === true, '  고르고 나면 카테고리가 <b>저절로 다시 접힌다</b>');
  is(!!pick && /교육자금/.test(pick.t), '  단추 이름도 <b>고른 칸으로</b> 바뀐다 — ' + (pick ? pick.t : ''));
  /* 칸을 바꾸는 길은 <b>누르는 것 하나가 아니다</b> — 상담 순서가 건너뛰고,
     인쇄 모듈이 제 손으로 켠 칸을 옮긴다. 그 길로 가도 단추가 따라와야
     한다. 안 따라오면 교육자금을 보면서 「종합 대시보드」 라고 적힌다 (1번). */
  const jump = await page.evaluate(async () => {
    const b = [...document.querySelectorAll('.top-tab-grid .report-tab')]
      .find(x => /보험 대시보드/.test(x.textContent || ''));
    document.querySelectorAll('.report-tab').forEach(x => x.classList.remove('on'));
    if (b) b.classList.add('on');                    /* 누르지 않고 켠 칸만 옮긴다 */
    await new Promise(r => setTimeout(r, 500));
    return ((document.getElementById('tbmBtn') || {}).textContent || '').trim();
  });
  is(/보험 대시보드/.test(jump || ''),
     '  안 누르고 칸이 옮겨져도 <b>단추가 따라온다</b> — ' + jump);

  console.log('\n[5] <b>PC 는 하나도 안 바뀐다</b>');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  const pc = await look(page);
  is(pc.sidebar.disp !== 'none' && pc.sidebar.w > 200,
     '  PC 에서 입력칸이 <b>그대로 선다</b> — ' + pc.sidebar.w + 'px (접어 둔 채로 넓혀도)');
  is(pc.btn.disp === 'none', '  PC 에서는 접기 단추가 <b>아예 안 뜬다</b>');
  is(pc.close.disp === 'none', '  PC 에서는 닫기 단추도 <b>안 뜬다</b>');
  is(!!pc.grid && pc.grid.disp !== 'none' && pc.tabs >= 12,
     '  PC 에서 카테고리가 <b>그대로 선다</b> — ' + pc.tabs + '칸 (접어 둔 채로 넓혀도)');
  is(!!pc.tbn && pc.tbn.disp === 'none', '  PC 에서는 카테고리 접기 단추가 <b>아예 안 뜬다</b>');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 폰 계산기 — 고칠 자리 ' + bad + '곳' : '✓ 폰 계산기 — 열자마자 보고서가 서고, 입력칸·카테고리는 한 번 누르면 돌아옵니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
