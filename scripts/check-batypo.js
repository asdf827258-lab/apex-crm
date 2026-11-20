/* 🔤 고객에게 보여 주는 보장 분석 보고서 — 글씨만 다듬었나 (판 X505)
   사장님 말씀 2026-11-19 「고객에게 보여주는 프레젠테이션도 글씨 디자인만 다듬어봐」.

   내용 · 배치 · 숫자는 그대로 두고 글씨만 바꿨다. 그래서 여기서 못 박는 것:
     1. 낱말 중간에서 줄이 끊기지 않는다(word-break: keep-all) — 「관상동 / 맥」, 「받습니 / 다.」 가 없어야
     2. 설명 글은 한 단계 크고(16.5px↑) 한 단계 가볍다(500) — 굵은 낱말이 먼저 보이게
     3. 숫자 같은 폭(tnum)은 <b>화면에서만</b> — 종이 · PDF 에 켜면 숫자가 글자로 안 읽힌다(메모 pdf-print-tnum)
     4. 49장 어디에서도 글자가 칸 밖으로 넘치거나 잘리지 않는다 — 견본 그대로 · 계약 셋을 넣은 고객 자료 두 번
        (치료 단계 장은 칸이 꽉 차 있어 크기는 판 X319 그대로 — 키우면 담보 다섯 줄째가 잘린다)
     5. 페이지 오류 없음                                                                       */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 장 하나를 띄워 「칸 밖으로 나간 글」 · 「잘린 글」 을 센다 */
function scan(k) {
  const S = document.querySelectorAll('section.sl');
  S.forEach((s, j) => s.classList.toggle('on', j === k));
  const sl = S[k], R = sl.getBoundingClientRect(), out = [];
  const txt = el => [].some.call(el.childNodes, c => c.nodeType === 3 && c.textContent.trim());
  sl.querySelectorAll('*').forEach(el => {
    if (el.closest('svg') || el.tagName === 'IMG') return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (!txt(el)) return;
    const clip = /hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY);
    if (clip && cs.textOverflow !== 'ellipsis' && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2))
      out.push('잘림 「' + el.textContent.trim().slice(0, 20) + '」');
    const e = el.getBoundingClientRect();
    if (e.width && (e.bottom > R.bottom + 1 || e.right > R.right + 1)) out.push('장 밖 「' + el.textContent.trim().slice(0, 20) + '」');
  });
  sl.querySelectorAll('*').forEach(el => {
    if (!/hidden|clip/.test(getComputedStyle(el).overflow)) return;
    const E = el.getBoundingClientRect(); if (!E.height) return;
    el.querySelectorAll('*').forEach(c => {
      if (c.closest('svg') || c.tagName === 'IMG' || !txt(c)) return;
      const C = c.getBoundingClientRect(); if (!C.height) return;
      if (C.top < E.bottom - 1 && C.bottom > E.bottom + 2) out.push('칸에 걸림 「' + c.textContent.trim().slice(0, 20) + '」');
    });
  });
  return out.length ? (k + 1) + '쪽 ' + Array.from(new Set(out)).slice(0, 3).join(' · ') : '';
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  const base = 'http://127.0.0.1:' + port + '/app/ba-report.html';
  async function open(h) {
    await pg.goto('about:blank');
    await pg.goto(base + (h || ''), { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => document.querySelectorAll('section.sl').length > 10, null, { timeout: 30000 });
    await pg.waitForTimeout(2000);
  }

  console.log('\n[1~2] 글씨');
  await open();
  const T = await pg.evaluate(() => {
    const S = document.querySelectorAll('section.sl');
    const px = [].find.call(S, s => /협심증은 이렇게 옵니다/.test(s.innerText));
    S.forEach(s => s.classList.toggle('on', s === px));
    const p = px.querySelector('.pxc p'), cs = getComputedStyle(p);
    return { wb: getComputedStyle(px).wordBreak, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight,
      bw: +getComputedStyle(p.querySelector('b') || p).fontWeight };
  });
  is(T.wb === 'keep-all', '낱말 중간에서 안 끊김 — word-break ' + T.wb);
  is(T.fs >= 16.5 && T.fw === 500 && T.bw >= 800, '설명 글 ' + T.fs + 'px · 굵기 ' + T.fw + ' — 굵은 낱말 ' + T.bw);

  console.log('\n[3] 숫자 같은 폭은 화면에서만');
  const src = fs.readFileSync(path.join(ROOT, 'app/ba-report.html'), 'utf8').replace(/\r/g, '');
  const blk = src.slice(src.indexOf('판 X505 글씨 다듬기'), src.indexOf('/* 인쇄 — 한 장에 한 쪽 */'));
  const tn = blk.split('\n').filter(l => /tabular-nums/.test(l));
  is(blk.length > 100 && tn.length > 0 && tn.every(l => /^@media screen\{/.test(l)), 'tnum 줄 ' + tn.length + '개 — 전부 @media screen 안');

  console.log('\n[4] 49장 — 넘치거나 잘린 글자');
  const n = await pg.evaluate(() => document.querySelectorAll('section.sl').length);
  let hit = [];
  for (let i = 0; i < n; i++) { const r = await pg.evaluate(scan, i); if (r) hit.push(r); }
  is(!hit.length, '견본 ' + n + '장 — ' + (hit.length ? hit.join(' / ') : '넘침 0'));

  const P = [{ c: '가손보', n: '건강', s: 'keep', b: { cancer: 3000, mi: 2000, inpD: 3 }, a: { cancer: 3000, mi: 2000, inpD: 3 } },
             { c: '나생명', n: '종합', s: 'endo', b: { stroke: 1000 }, a: { brain: 2000, heart: 2000 } },
             { c: '다화재', n: '신규 종합', s: 'new', b: {}, a: { cancer: 2000, cancer2: 500, heartOp: 2000, surgN: 500, nurUD: 10 } }];
  const d = { n: '김가나다라', age: 58, sex: '여', b: { cancer: 3000, mi: 2000, inpD: 3, stroke: 1000 },
    a: { cancer: 5000, cancer2: 500, brain: 2000, heart: 2000, mi: 2000, heartOp: 2000, surgN: 500, nurUD: 10, inpD: 3 }, embed: 0, p: P };
  await open('#d=' + encodeURIComponent(JSON.stringify(d)));
  const n2 = await pg.evaluate(() => document.querySelectorAll('section.sl').length);
  hit = [];
  for (let i = 0; i < n2; i++) { const r = await pg.evaluate(scan, i); if (r) hit.push(r); }
  is(!hit.length, '고객 자료(계약 셋) ' + n2 + '장 — ' + (hit.length ? hit.join(' / ') : '넘침 0'));

  is(!errs.length, '페이지 오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 실패' : '\n✓ 전부 통과');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
