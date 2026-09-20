/* ══════════════════════════════════════════════════════════════════
   check-finwide.js — <b>계산기 열네 칸, 어디를 열어도 폰에서 안 새는가.</b>

   사장님 말씀 — 「재무설계계산기도 핸드폰으로 키니까 안 보인다」.
   메뉴를 접어 첫 화면은 세웠는데, 칸을 <b>옮겨 다니면</b> 화면이 옆으로
   밀렸습니다. 390px 에서 재 본 자리입니다 (2026-09-20) —

     교육자금 642px · 상속·증여 610px · 투자 컨설팅 510px ·
     투자 포트폴리오 510px · 보험 대시보드 497px · 팩트파인딩 491px ·
     연금 시뮬레이션 486px · 팩트체크 431px      (화면은 390px)

   여덟 군데가 <b>따로 깨진 것이 아니었습니다.</b> <code>.app</code> 이
   격자(grid)이고 <code>.main</code> 이 그 칸인데, 격자 칸은
   <b>min-width 가 auto</b> 라서 안에 안 줄어드는 것이 하나만 있어도
   칸이 통째로 그만큼 부풉니다. PC 에서는 <code>.main</code> 에
   <code>overflow-y:auto</code> 가 걸려 막혔는데, 폰에서 그것을
   <code>visible</code> 로 풀어 둬서 막을 것이 없었습니다.

   ★ <b>check-toss 는 이것을 못 봤습니다</b> — 계산기의 <b>첫 화면만</b>
     열고 재서 「옆으로 새는 화면 0개」 로 초록이었습니다. 안 울리는
     알람은 알람이 아닙니다 (8번). 그래서 <b>칸을 하나씩 눌러</b> 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 폰 390px — <b>열네 칸을 하나씩 눌러</b> 가로로 새는 칸이 없는가
     [2] 어디가 넘쳤는지 <b>이름을 대는가</b> — 「어딘가 넘쳤습니다」 는
         고치는 데 아무 쓸모가 없다
     [3] 줄인다고 <b>입력칸을 뭉개지 않았는가</b> — 팩트파인딩 칸이
         제 폭을 갖고 서 있어야 한다 (0px 로 줄여 놓고 「안 샌다」 는
         거짓말이다)
     [4] 폰 430px 에서도 같은가
     [5] <b>PC 는 하나도 안 바뀌는가</b> — 입력칸이 그대로 서고,
         카테고리 열네 칸이 그대로 있고, 역시 안 샌다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8971;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 넘친 칸에서 <b>제일 바깥 범인</b>을 짚어 온다. 「어딘가 넘쳤습니다」 로는
   아무도 못 고친다 — 어느 줄을 봐야 하는지 말해 줘야 점검이 쓸모 있다. */
const blame = (page) => page.evaluate(() => {
  const cw = document.documentElement.clientWidth;
  const pane = document.querySelector('.tab-pane.on');
  if (!pane) return '(열린 칸을 못 찾음)';
  const sel = e => e.tagName.toLowerCase() + (e.id ? ('#' + e.id) : '') +
    (e.className && e.className.toString ? ('.' + e.className.toString().trim().split(/\s+/).slice(0, 2).join('.')) : '');
  let best = null, bestD = 1e9;
  pane.querySelectorAll('*').forEach(e => {
    const b = e.getBoundingClientRect();
    if (b.right <= cw + 2 && e.scrollWidth <= e.clientWidth + 2) return;
    let d = 0, q = e; while (q && q !== pane) { d++; q = q.parentElement; }
    if (d < bestD) { bestD = d; best = sel(e) + ' (' + Math.round(b.width) + 'px)'; }
  });
  return best || '(범인을 못 짚음)';
});

/* 칸을 하나씩 눌러 보고, 새는 칸 이름을 모아 온다 */
async function walk(page) {
  const names = await page.evaluate(() =>
    [...document.querySelectorAll('.top-tab-grid .report-tab .rt-title')].map(x => (x.textContent || '').trim()));
  const leak = [];
  for (let i = 0; i < names.length; i++) {
    await page.evaluate(i => { const b = document.querySelectorAll('.top-tab-grid .report-tab'); if (b[i]) b[i].click(); }, i);
    await sleep(750);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
      main: Math.round((document.querySelector('.main') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width)
    }));
    if (m.sw > m.cw + 2) leak.push({ n: names[i], sw: m.sw, cw: m.cw, main: m.main, why: await blame(page) });
  }
  return { names, leak };
}

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const open = async (w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    /* 바깥을 막는다 — CI 에는 인터넷이 있고 이 컨테이너에는 없다.
       막아 두어야 두 곳에서 같은 결과가 나온다 */
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 130)));
    await page.goto('http://127.0.0.1:' + PORT + '/app/finance.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    return { ctx, page, errs };
  };

  console.log('\n[1] 폰 390px — <b>열네 칸을 하나씩</b> 눌러 본다');
  const a = await open(390, 844);
  const r390 = await walk(a.page);
  is(r390.names.length >= 12, '  카테고리가 ' + r390.names.length + '칸 있다 (12칸 이상)');
  is(r390.leak.length === 0,
     '  <b>어느 칸을 열어도 옆으로 안 샌다</b>' +
     (r390.leak.length ? (' — 새는 칸 ' + r390.leak.length + '개') : ' (' + r390.names.length + '칸)'));

  console.log('\n[2] 넘쳤으면 <b>어디가</b> 넘쳤는지 이름을 댄다');
  if (r390.leak.length) {
    r390.leak.forEach(x => console.log('     · ' + x.n + '  ' + x.sw + '/' + x.cw +
      'px · .main ' + x.main + 'px · 범인 ' + x.why));
    is(false, '  위 ' + r390.leak.length + '칸을 고쳐야 합니다');
  } else {
    is(true, '  샌 칸이 없어 댈 이름도 없습니다');
  }

  console.log('\n[3] 줄인다고 <b>입력칸을 뭉개지 않았다</b>');
  await a.page.evaluate(() => {
    const b = [...document.querySelectorAll('.top-tab-grid .report-tab')].find(x => /팩트파인딩/.test(x.textContent || ''));
    if (b) b.click();
  });
  await sleep(900);
  const ff = await a.page.evaluate(() => {
    const ins = [...document.querySelectorAll('#tab-factfind .ff-f input, #tab-factfind .ff-f select')];
    if (!ins.length) return null;
    const ws = ins.map(e => Math.round(e.getBoundingClientRect().width));
    const box = document.querySelector('#tab-factfind .ff-grid');
    const over = ins.filter(e => {
      const p = e.parentElement; if (!p) return false;
      return e.getBoundingClientRect().right > p.getBoundingClientRect().right + 2;
    }).length;
    return { n: ins.length, min: Math.min.apply(null, ws), max: Math.max.apply(null, ws),
             cols: box ? getComputedStyle(box).gridTemplateColumns : '', over: over };
  });
  is(!!ff && ff.n >= 10, '  팩트파인딩 입력칸이 ' + (ff ? ff.n : 0) + '개 그려진다');
  is(!!ff && ff.min >= 100,
     '  제일 좁은 입력칸도 <b>' + (ff ? ff.min : 0) + 'px</b> — 0 으로 뭉개지 않았다 (100px 이상)');
  is(!!ff && ff.over === 0, '  입력칸이 <b>제 칸 밖으로</b> 안 삐져나온다' + (ff && ff.over ? (' — ' + ff.over + '개') : ''));
  is(a.errs.length === 0, '  화면이 터지지 않았다' + (a.errs.length ? ' — ' + a.errs[0] : ''));
  await a.ctx.close();

  console.log('\n[4] 폰 430px 에서도 같다');
  const b430 = await open(430, 930);
  const r430 = await walk(b430.page);
  is(r430.leak.length === 0,
     '  430px 에서도 <b>안 샌다</b>' + (r430.leak.length ? (' — ' + r430.leak.map(x => x.n + ' ' + x.sw).join(' · ')) : ''));
  await b430.ctx.close();

  console.log('\n[5] <b>PC 는 하나도 안 바뀐다</b>');
  const c = await open(1440, 900);
  const pc = await c.page.evaluate(() => {
    const sb = document.querySelector('.sidebar');
    const r = sb ? sb.getBoundingClientRect() : { width: 0 };
    return { sb: Math.round(r.width), sbDisp: sb ? getComputedStyle(sb).display : 'none',
             tabs: document.querySelectorAll('.top-tab-grid .report-tab').length,
             tbn: (document.getElementById('tbmBtn') ? getComputedStyle(document.getElementById('tbmBtn')).display : 'none') };
  });
  is(pc.sbDisp !== 'none' && pc.sb > 200, '  PC 에서 입력칸이 그대로 선다 — ' + pc.sb + 'px');
  is(pc.tabs >= 12, '  카테고리 ' + pc.tabs + '칸이 그대로 있다');
  is(pc.tbn === 'none', '  PC 에서는 접기 단추가 안 뜬다');
  const rpc = await walk(c.page);
  is(rpc.leak.length === 0, '  PC 에서도 <b>안 샌다</b>' + (rpc.leak.length ? (' — ' + rpc.leak.map(x => x.n).join(' · ')) : ''));
  is(c.errs.length === 0, '  PC 에서도 안 터졌다' + (c.errs.length ? ' — ' + c.errs[0] : ''));
  await c.ctx.close();

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 계산기 폭 — 고칠 자리 ' + bad + '곳'
                          : '✓ 계산기 폭 — 열네 칸 어디를 열어도 폰에서 옆으로 안 샙니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
