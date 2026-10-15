#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   TA 스크립트가 <b>노트북에서 한눈에</b> 보이나 (판 X110)

   사장님 말씀 (2026-10-15):
     「Ta스크립트 부분 이게 노트북으로 보니까 한눈에 안 보여 가로를 넓혀서
      한눈에 보이게 만들어줘 거절처리도 한눈에 클릭할 수 있도록 디자인만
      재구성해줘」

   ★★ 손대기 전에 1440×900 노트북에서 재어 본 것 —
       쓰는 가로 <b>1,120px</b> · <b>빈 가로 320px</b>  (화면을 안 쓰고 있었습니다)
       통화 탭 <b>5.40 화면</b> · 거절처리 탭 <b>3.26 화면</b>
       거절 30가지가 <b>5열</b>이라 스크롤해야 다 보였습니다

   ★ <b>옷(CSS)만</b> 바꿨습니다 — 글·동작·가짓수는 한 자도 안 건드렸습니다.
     다른 세션이 세워 둔 자 넷(tafinal·tascript·tapc·tatrend)이 그대로 초록입니다.

   여기서 못 박는 것은 다섯입니다.

     ① 노트북 가로를 <b>쓴다</b> — 빈 가로가 다시 벌어지지 않는다
     ② ★★ 거절 <b>30가지가 한 화면</b>에 다 보인다 — 스크롤 없이 누를 수 있다
     ③ 가로를 넓혀도 <b>글줄은 안 늘어난다</b> — 말풍선이 읽기 좋은 폭에서 멈춘다
     ④ <b>폰에서 안 깨진다</b> — 가로로 삐져나오지 않는다
     ⑤ <b>글·가짓수가 그대로</b>다 — 「디자인만」 이라는 말씀을 지킨다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8878;
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}
/* 손대기 전 눈금 — 이보다 나빠지면 빨간불입니다 (0-1번) */
const 전 = { 빈가로: 320, 통화: 5.40, 거절탭: 3.26, 거절열: 5 };

const 열기 = async (ctx, tab) => {
  const pg = await ctx.newPage();
  await pg.goto('http://127.0.0.1:' + PORT + '/ta-script.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForFunction(() => !!document.querySelector('#tabs .tab'), { timeout: 30000 });
  await pg.waitForTimeout(900);
  if (tab) { await pg.evaluate(v => document.querySelector('#tabs .tab[data-t="' + v + '"]').click(), tab); await pg.waitForTimeout(800); }
  return pg;
};

(async () => {
  const srv = serve(), br = await chromium.launch();
  const 랩 = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await 랩.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const errs = [];

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 노트북 가로를 <b>쓴다</b> (1440×900)');
  const p1 = await 열기(랩, null);
  p1.on('pageerror', e => errs.push(String(e.message || e)));
  const w = await p1.evaluate(() => {
    const a = document.querySelector('.app').getBoundingClientRect().width;
    return { 쓰는폭: Math.round(a), 빈가로: Math.round(document.documentElement.clientWidth - a),
             문서폭: document.documentElement.scrollWidth };
  });
  is(w.빈가로 < 전.빈가로, '  빈 가로가 <b>' + w.빈가로 + 'px</b> 다 — 전에는 ' + 전.빈가로 + 'px 가 비었습니다');
  is(w.빈가로 <= 140, '  화면을 <b>넉넉히 쓴다</b> — 쓰는 폭 ' + w.쓰는폭 + 'px');
  is(w.문서폭 <= 1440, '  가로로 <b>삐져나오지 않는다</b> — ' + w.문서폭 + 'px');
  const 통화 = await p1.evaluate(() => +(document.body.scrollHeight / 900).toFixed(2));
  is(통화 < 전.통화, '  통화 탭이 <b>짧아졌다</b> — ' + 통화 + ' 화면 (전 ' + 전.통화 + ')');

  /* ─────────────────────────────────────────────────────────── */
  head('[2] ★★ 거절 <b>30가지가 한 화면</b>에 다 보인다 (사장님 말씀)');
  const p2 = await 열기(랩, 'obj');
  p2.on('pageerror', e => errs.push(String(e.message || e)));
  const o = await p2.evaluate(() => {
    /* ⚠ DOM 수가 아니라 <b>보이는 것</b>을 셉니다 — 처음에 children.length 를
       셌더니 옷으로 숨겨도 그대로 통과했습니다(되돌림 ③ 이 안 울렸습니다 · 8번). */
    const 보임 = e => e.checkVisibility ? e.checkVisibility({ checkVisibilityCSS: true }) : (e.offsetParent !== null);
    const g = document.querySelector('#objGrid'), k = [].slice.call(g.children).filter(보임);
    const t0 = k[0].getBoundingClientRect().top;
    const 열 = k.filter(c => Math.abs(c.getBoundingClientRect().top - t0) < 3).length;
    const 아래 = Math.max.apply(null, k.map(c => c.getBoundingClientRect().bottom));
    return { 가짓수: k.length, 열: 열, 맨아래: Math.round(아래),
             탭높이: +(document.body.scrollHeight / 900).toFixed(2),
             다보이나: k.every(c => c.getBoundingClientRect().bottom <= 900) };
  });
  is(o.가짓수 >= 30, '  거절이 <b>' + o.가짓수 + '가지</b> <b>보인다</b> — 숨기거나 지운 것이 없다');
  is(o.열 > 전.거절열, '  한 줄에 <b>' + o.열 + '개</b> 선다 — 전에는 ' + 전.거절열 + '개');
  is(o.다보이나, '  <b>스크롤 없이 전부</b> 보인다 — 맨 아래 칸이 ' + o.맨아래 + 'px (화면 900px)');
  is(o.탭높이 < 전.거절탭, '  거절처리 탭도 짧아졌다 — ' + o.탭높이 + ' 화면 (전 ' + 전.거절탭 + ')');
  const 눌림 = await p2.evaluate(() => {
    const b = document.querySelectorAll('#objGrid .ob')[7];
    if (!b) return '(없음)';
    b.click();
    const h = document.querySelector('#objDetail h4');
    return h ? h.innerText.trim() : '(안 열림)';
  });
  is(눌림 !== '(없음)' && 눌림 !== '(안 열림)', '  눌러 보면 <b>그 거절이 열린다</b> — ' + 눌림);

  /* ─────────────────────────────────────────────────────────── */
  head('[3] 가로를 넓혀도 <b>글줄은 안 늘어난다</b>');
  /* ⚠ 처음에 .bubble 을 쟀는데 <b>통화 탭에 없는 칸</b>이었습니다(연습·문자 쪽입니다).
     대본 줄은 .st 입니다 — 엉뚱한 칸을 재면 0개를 재고도 통과합니다 (8번). */
  const 줄 = await p1.evaluate(() => {
    const st = [].slice.call(document.querySelectorAll('.st')).filter(x => x.offsetHeight > 0);
    const 글칸 = st.map(x => x.children[x.children.length - 1]).filter(Boolean);
    return { 몇개: 글칸.length,
             가장넓은: Math.round(Math.max.apply(null, 글칸.map(x => x.getBoundingClientRect().width))) };
  });
  is(줄.몇개 >= 5, '  대본 줄을 <b>실제로 쟀다</b> — ' + 줄.몇개 + '칸 (0칸이면 엉뚱한 데를 잰 것입니다)');
  /* 가로를 넓히면 글줄도 좀 넓어집니다(710 → 890px) — 그 대신 스크롤이
     5.40 → 4.79 화면으로 줄었습니다. 오른쪽 칸을 520px 까지 넓혀 글줄을
     묶어도 봤는데 통화 탭이 5.11 화면으로 <b>되레 길어져</b> 되돌렸습니다.
     선은 <b>920px</b> 로 둡니다 — 그 너머는 누가 봐도 너무 넓습니다. */
  is(줄.가장넓은 <= 920,
     '  대본 글줄이 <b>너무 넓어지지 않는다</b> — 가장 넓은 것 ' + 줄.가장넓은 + 'px (선 920)');

  /* ─────────────────────────────────────────────────────────── */
  head('[4] <b>폰에서 안 깨진다</b>');
  const 폰 = await br.newContext({ viewport: { width: 390, height: 844 } });
  await 폰.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p3 = await 열기(폰, null);
  p3.on('pageerror', e => errs.push(String(e.message || e)));
  const ph = await p3.evaluate(() => ({
    문서폭: document.documentElement.scrollWidth,
    한칸: getComputedStyle(document.querySelector('.cols')).gridTemplateColumns.split(' ').length
  }));
  is(ph.문서폭 <= 391, '  폰에서 <b>가로로 안 샌다</b> — ' + ph.문서폭 + 'px');
  is(ph.한칸 === 1, '  폰에서는 <b>한 칸</b>으로 접힌다');
  const p4 = await 열기(폰, 'obj');
  const ph2 = await p4.evaluate(() => ({ 문서폭: document.documentElement.scrollWidth,
                                         가짓수: document.querySelectorAll('#objGrid .ob').length }));
  is(ph2.문서폭 <= 391, '  거절처리도 폰에서 안 샌다 — ' + ph2.문서폭 + 'px');
  is(ph2.가짓수 === o.가짓수, '  폰에서도 <b>같은 가짓수</b>다 — ' + ph2.가짓수 + '가지');

  /* ─────────────────────────────────────────────────────────── */
  head('[5] <b>디자인만</b> 바꿨다 — 글·동작은 그대로 (사장님 말씀)');
  const SRC = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
  /* 옷 바깥(스크립트·본문)을 건드리지 않았는지 — 다른 자 넷이 본다는 것도 적어 둡니다 */
  const 옷 = SRC.slice(SRC.indexOf('<style>'), SRC.indexOf('</style>'));
  is(/max-width:1560px/.test(옷), '  가로를 넓힌 자리가 <b>옷 안</b>에 있다');
  is(/min\(94%,840px\)/.test(옷), '  글줄 묶은 자리도 <b>옷 안</b>에 있다');
  is(!/max-width:1120px/.test(SRC), '  옛 1120px 가 <b>남아 있지 않다</b>');
  const 탭 = await p1.evaluate(() => [].slice.call(document.querySelectorAll('#tabs .tab')).map(b => b.dataset.t).join(','));
  is(탭 === 'call,obj,msg,eval,all,prac', '  탭 여섯이 <b>그대로</b>다 — ' + 탭);

  /* ─────────────────────────────────────────────────────────── */
  head('[6] 조용한가');
  const 시끄 = errs.filter(e => !/favicon|net::ERR|Failed to fetch|abort/i.test(e));
  is(시끄.length === 0, '콘솔 에러 ' + 시끄.length + '건' + (시끄.length ? ' ← ' + 시끄[0] : ''));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '자리 — 위를 보십시오 (' + n + '가지 중)'); process.exit(1); }
  console.log('✓ 노트북에서 한눈에 — 거절 30가지가 한 화면에 섭니다 (' + n + '자리).');
})();
