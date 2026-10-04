/* ══════════════════════════════════════════════════════════════════
   check-uiprint.js — <b>새로 여는 인쇄 창에 옷이 실제로 실리나.</b>

   사장님 말씀 — 「토스판 디자인을 <b>파일 하나로</b> 빼고, <b>모든 화면</b>이
   그것을 쓰게 합니다 … 문자열로 뽑는 인쇄 페이지는 그 토큰을 못 씁니다」.

   ── 여기서 실제로 났던 일 ─────────────────────────────────────────
   법인 덱 인쇄(bizDeckPrint)가 <b>var(--t4)·var(--t3)·var(--t5)·var(--t6)</b>
   을 쓰고 있었습니다. 그런데 인쇄는 window.open('','_blank') 로 <b>빈 창</b>을
   열고 document.write 로 써 넣습니다 — 그 창에는 글자 계단이 <b>없습니다</b>.
   값이 없으면 font-size 는 <b>물려받은 크기</b>가 됩니다. 재어 보니
   꼬리말이 13px 이어야 하는데 <b>16px</b> 로 나가고 있었습니다.
   A4 한 장 높이가 고정(209mm)이고 넘치면 <b>잘라 냅니다</b> —
   <b>맨 아래 줄이 종이에서 사라질 수 있습니다.</b> 고객에게 드리는 종이입니다.

   ── 왜 정적 점검으로 안 되나 ──────────────────────────────────────
   check-ttok 은 「printHeadCss() 를 부르나」 까지만 봅니다. 그 함수가
   조용히 빈 글자를 돌려줘도 <b>초록입니다</b>. 여기서는 <b>진짜 창을 열어
   px 를 잽니다</b> — 종이에 찍히는 값이 그것이기 때문입니다.

   ⚠ <b>바깥을 route 로 막지 않습니다.</b> ctx.route 를 걸면 about:blank
     창의 하위 파일이 안 내려와 <b>ui.css 가 안 실린 것처럼</b> 보입니다.
     실제로 그것에 한 번 속았습니다 — 헛것을 잡는 점검은 안 잡는 점검보다
     나쁩니다 (8번). 대신 바깥으로 나가는 것은 <b>없어도 되게</b> 두고
     (Pretendard 는 못 받아도 이 점검이 재는 값과 무관합니다) 기다립니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8761;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안입니다 (3번) */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  window.toast = function () {};
  /* w.print() 이 창을 붙잡아 잴 수가 없습니다 — <b>인쇄만</b> 막습니다 */
  const ro = window.open;
  window.open = function () { const w = ro.apply(window, arguments); try { w.print = function () {}; } catch (e) {} return w; };
  BIZ_DECK.title = '홍길동 주식회사';
  BIZ_DECK.slides = [{ icon: '🏢', kicker: '진단', title: '회사 상태',
                       body: '첫 줄\n둘째 줄', note: '참고 — 심사 결과에 따릅니다' }];
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e.message || e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  await page.evaluate(SEED);

  console.log('\n[1] <b>인쇄 창이 열리고 옷이 실리나</b>');
  const [pop] = await Promise.all([page.waitForEvent('popup'), page.evaluate(() => bizDeckPrint())]);
  await pop.waitForTimeout(2200);
  const M = await pop.evaluate(() => {
    const g = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontSize : ''; };
    const cs = getComputedStyle(document.documentElement);
    return { kick: g('.kick'), foot: g('.pgfoot'), note: g('.bizslide-note'),
             t4: (cs.getPropertyValue('--t4') || '').trim(),
             ink: (cs.getPropertyValue('--t-ink') || '').trim(),
             ui: [...document.styleSheets].some(x => /ui\.css$/.test(x.href || '')) };
  });
  is(!!M.kick, '  인쇄 창이 <b>섰다</b>');
  is(M.ui, '  <b>app/ui.css 가 그 창에 실렸다</b> — about:blank 라 상대 경로로는 안 잡힌다');
  is(M.ink === '#191F28', '  그래서 <b>토큰이 산다</b> — --t-ink ' + (M.ink || '(없음)'));

  console.log('\n[2] <b>글자 계단이 종이에서 살아 있나</b> — 이것이 실제로 깨져 있었다');
  is(M.t4 === '15px', '  <b>--t4 가 그 창에 있다</b> — ' + (M.t4 || '(없음)'));
  /* px 를 여기 못 박지 않습니다 — <b>앱이 정한 계단과 같은가</b>를 봅니다 (8번) */
  const SC = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement), o = {};
    [3, 4, 5, 6].forEach(i => { o['t' + i] = (cs.getPropertyValue('--t' + i) || '').trim(); });
    return o;
  });
  is(M.kick === SC.t4, '  머리말이 <b>앱과 같은 크기</b>다 — ' + M.kick + ' (앱 --t4 ' + SC.t4 + ')');
  is(M.foot === SC.t6, '  꼬리말이 <b>앱과 같은 크기</b>다 — ' + M.foot + ' (앱 --t6 ' + SC.t6 +
     ') · 값이 없을 때는 16px 로 커져 종이 밖으로 밀렸다');
  is(M.note === SC.t6, '  참고 줄도 <b>앱과 같은 크기</b>다 — ' + M.note);

  console.log('\n[3] <b>조용히 터지지 않았나</b>');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 인쇄 창도 같은 옷을 입고, 글자 계단이 종이에서 살아 있습니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
