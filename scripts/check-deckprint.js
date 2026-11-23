/* ══════════════════════════════════════════════════════════════════
   check-deckprint.js — 🖨 <b>보장분석 상담자료를 인쇄하면 전부 나오나</b> (판 X517)

   사장님 말씀 (2026-11-23) — 「보장분석 상담자료 <b>인쇄버전</b>도 만들어줘
   <b>클릭해서 넘어가는것들을 쭉 나올수 있도록</b>」

   ── 고치기 전에 재어 둔 값 ────────────────────────────────────
     A4 로 뽑으니 <b>2장</b>, 글자 <b>4,512자</b>. 까닭 셋 —
       ① 17장이 position:absolute 로 <b>겹쳐</b> 서 있었습니다(opacity 로만 가림).
       ② <b>.opacity-0 이 84곳</b> — 그 글은 지금 보는 장에서만 fadeUp 이 켭니다.
       ③ 접이·탭·단계·속지·설명판이 display:none / max-height:0.
          (접이 3/12 · 탭 1/3 · 단계카드 1/4 · 속지 0/3 · 설명판 0/2)
     고친 뒤 : <b>40장 · 14,410자</b> · 접이 11/12 · 탭 3/3 · 단계 4/4 · 속지 3/3 · 설명판 2/2.

   ── 보는 것 ──────────────────────────────────────────────────
     [1] ★★ 인쇄에서 <b>17장이 세로로 펴지나</b> — 겹쳐 서면 종이 두 장으로 뭉갭니다
     [2] ★★ <b>클릭해야 나오던 것이 전부 펴지나</b> — 접이·탭·단계·속지·설명판·단계글
     [3] ★★ 종이에 나오는 <b>글자 수</b>가 눈금 아래로 안 내려가나
     [4] ★  <b>화면용 붙박이</b>(fixed)가 종이마다 따라 찍히지 않나 — 0개
     [5] ★  <b>심의 문구는 남아 있나</b> — #apexDeckBar 는 걷지 않습니다 (2번·9번)
     [6] ★★ <b>값을 넣어야 생기는 칸은 일부러 안 엽니다</b> — 억지로 펴면 빈 표에
            「0원」 이 찍힙니다 (1번). 그 넷이 그대로 닫혀 있나
     [7] ★  <b>화면은 한 픽셀도 안 바뀌나</b> — 더한 것이 @media print 안에만 있나
     [8] ★  <b>서버</b>를 안 부르나 (7번)

   ⚠ 사장님 진짜 서버를 한 번도 안 부릅니다 — 파일만 제 자리에서 띄웁니다.
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.join(__dirname, '..');
const DECK = 'app/상담자료/메인 상담자료.html';

/* ── 눈금 — 줄면 같이 내리십시오 (0-1번) ───────────────────────── */
const 종이_최소 = 36;        /* A4 장수 — 지금 40장. 글꼴이 바뀌면 줄바꿈이 달라져
                               장수가 한두 장 흔들립니다. 그래서 4장 여유를 둡니다. */
const 글자_최소 = 14000;     /* 종이에 나오는 글자 — 지금 14,410자. 이것은 DOM 의 글이라
                               배치와 상관없이 안 흔들립니다. */
const 붙박이_최대 = 0;       /* 종이마다 따라 찍히는 것 */

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

(async () => {
  console.log('══ 🖨 보장분석 상담자료 인쇄 점검 (판 X517) ══');

  /* ── [7] 소스로 먼저 — 화면을 안 건드렸나 ───────────────────── */
  const SRC = fs.readFileSync(path.join(ROOT, DECK), 'utf8');
  head('[7] ★ 화면은 한 픽셀도 안 바뀌나 — 더한 것이 @media print 안에만 있나');
  const i = SRC.indexOf('@media print {');
  is(i > 0, '  덱 제 파일에 @media print 묶음이 있다');
  if (i > 0) {
    /* 그 묶음의 짝 맞는 } 까지 — 그 안에만 있어야 합니다 */
    let d = 0, j = SRC.indexOf('{', i), k = j;
    for (; k < SRC.length; k++) { if (SRC[k] === '{') d++; else if (SRC[k] === '}') { d--; if (!d) break; } }
    const 안 = SRC.slice(j, k);
    is(안.indexOf('@media') < 0, '    그 묶음 안에 다른 @media 가 섞이지 않았다');
    is(/\.slide\s*\{[^}]*position:\s*static/.test(안), '    .slide 를 세로로 푸는 줄이 그 안에 있다');
    is(/\.opacity-0\s*\{[^}]*opacity:\s*1/.test(안), '    .opacity-0(84곳)을 켜는 줄이 그 안에 있다');
  }
  is(!/font-feature-settings[^;]*tnum/.test(SRC),
    '  인쇄에 tnum 이 없다 — 켜 두면 우리가 뽑은 PDF 를 우리가 못 읽습니다 (4-1)');

  /* ── 제 자리에 띄웁니다 ──────────────────────────────────────── */
  const 바깥 = [];
  const srv = http.createServer((rq, rs) => {
    const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
    fs.createReadStream(f).pipe(rs);
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;

  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + P) >= 0) return r.continue();
    바깥.push(u.split('/')[2]); return r.abort();
  });
  const pg = await ctx.newPage();
  const 터짐 = [];
  pg.on('pageerror', e => 터짐.push(String(e.message).slice(0, 80)));
  await pg.goto('http://127.0.0.1:' + P + '/' + DECK.split('/').map(encodeURIComponent).join('/'),
    { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(2600);

  /* ★ 인쇄 자리로 바꿔 놓고 잽니다 */
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(400);

  const r = await pg.evaluate(() => {
    const q = s => [].slice.call(document.querySelectorAll(s));
    const vis = e => { const s = getComputedStyle(e), b = e.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && b.height > 2; };
    const n = a => a.filter(vis).length + '/' + a.length;
    const sl = q('#presentation > .slide');
    /* 겹쳐 있나 — 세로로 펴졌으면 위에서 아래로 줄줄이 섭니다 */
    const 위 = sl.map(s => Math.round(s.getBoundingClientRect().top + window.scrollY));
    let 겹침 = 0; for (let i = 1; i < 위.length; i++) if (위[i] <= 위[i - 1] + 4) 겹침++;
    /* 아직 닫힌 덩어리 — 코드(style·script)는 글로 안 셉니다 (헛것 막기 · 8번) */
    const 닫힘 = q('#presentation *').filter(e => {
      const t = (e.textContent || '').replace(/\s+/g, '').length;
      if (t < 40) return false;
      if (/^(style|script|template|noscript)$/.test(e.tagName.toLowerCase())) return false;
      const c = getComputedStyle(e);
      if (c.display !== 'none' && c.maxHeight !== '0px' && +c.opacity > 0.05) return false;
      let p = e.parentElement;
      while (p && p.id !== 'presentation') { const ps = getComputedStyle(p);
        if (ps.display === 'none' || ps.maxHeight === '0px' || +ps.opacity <= 0.05) return false;
        p = p.parentElement; }
      return true;
    }).map(e => e.id || ('.' + String(e.className).trim().split(/\s+/)[0]));
    const 붙박이 = q('*').filter(e => { const s = getComputedStyle(e);
      return (s.position === 'fixed' || s.position === 'sticky') && vis(e); })
      .map(e => '#' + (e.id || String(e.className).slice(0, 20)));
    const bar = document.getElementById('apexDeckBar');
    return {
      쪽: sl.length, 겹침: 겹침,
      접이: n(q('.s5-acc-body')), 탭: n(q('.s9-tab-content')), 탭12: n(q('.s12-tab-content')),
      단계: n(q('.step-card')), 속지: n(q('.s6-sub-panel')), 설명판: n(q('.infographic-panel')),
      단계글: n(q('[id^="s12-"][id*="step"]')), 오른: n(q('.s3r-item')), 도움말: n(q('.s15-modal')),
      닫힘: 닫힘, 붙박이: 붙박이,
      글자: (function () {
        /* ⚠ innerText 는 <b>투명한 글도 셉니다</b>(opacity 를 안 봅니다). 그래서
           .opacity-0 을 되돌려 놔도 글자 수가 그대로였습니다 — 자가 거짓말을
           했습니다. 직접 걸으며 <b>안 보이는 가지는 통째로 건너뜁니다</b> (8번). */
        let n = 0;
        const walk = el => {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity <= 0.05) return;
          for (let i = 0; i < el.childNodes.length; i++) {
            const c = el.childNodes[i];
            if (c.nodeType === 3) n += (c.textContent || '').replace(/\s+/g, '').length;
            else if (c.nodeType === 1 && !/^(style|script|template|noscript)$/.test(c.tagName.toLowerCase())) walk(c);
          }
        };
        const root = document.getElementById('presentation');
        if (root) walk(root);
        return n;
      })(),
      심의: !!(bar && vis(bar) && (bar.innerText || '').indexOf('상품 설명이 아닌') >= 0)
    };
  });

  const pdf = await pg.pdf({ format: 'A4', printBackground: true });
  const 장 = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

  head('[1] ★★ 인쇄에서 17장이 <b>세로로</b> 펴지나');
  is(r.쪽 >= 17, '  발표 쪽 ' + r.쪽 + '장을 찾았다');
  is(r.겹침 === 0, '  겹쳐 선 쪽 <b>' + r.겹침 + '장</b> — 0 이라야 합니다(겹치면 종이 두 장으로 뭉갭니다)');
  is(장 >= 종이_최소, '  A4 <b>' + 장 + '장</b> · 눈금 ' + 종이_최소 + '장' +
    (장 > 종이_최소 ? ' ★ 늘었습니다 — 눈금도 같이 올리십시오 (0-1번)' : ''));

  head('[2] ★★ <b>클릭해야 나오던 것이 전부 펴지나</b>');
  const 칸 = [['접이', r.접이], ['탭(9장)', r.탭], ['탭(13장)', r.탭12], ['단계카드', r.단계],
    ['속지', r.속지], ['설명판', r.설명판], ['단계글(13장)', r.단계글], ['오른 칸(4장)', r.오른], ['도움말(15장)', r.도움말]];
  칸.forEach(([k, v]) => {
    const [a, b] = v.split('/').map(Number);
    /* 접이 하나(#s9-insurances-acc)는 일부러 안 엽니다 — [6] 에서 따로 봅니다 */
    const 봐줌 = (k === '접이') ? 1 : 0;
    is(a >= b - 봐줌, '  ' + k.padEnd(12) + ' <b>' + v + '</b> 펴짐');
  });

  head('[3] ★★ 종이에 나오는 <b>글자 수</b>');
  is(r.글자 >= 글자_최소, '  <b>' + r.글자.toLocaleString() + '자</b> · 눈금 ' + 글자_최소.toLocaleString() + '자' +
    (r.글자 > 글자_최소 + 1500 ? ' ★ 늘었습니다 — 눈금도 같이 올리십시오 (0-1번)' : ''));

  head('[4] ★ 화면용 <b>붙박이</b>가 종이마다 따라 찍히지 않나');
  is(r.붙박이.length <= 붙박이_최대, '  붙박이 <b>' + r.붙박이.length + '개</b> · 눈금 ' + 붙박이_최대 + '개' +
    (r.붙박이.length ? ' ← ' + r.붙박이.slice(0, 6).join(' ') : ''));

  head('[5] ★ <b>심의 문구는 남아 있나</b>');
  is(r.심의, '  「이 자료는 상품 설명이 아닌…」 띠가 종이에 남는다 (#apexDeckBar 는 안 걷습니다)');

  head('[6] ★★ <b>값을 넣어야 생기는 칸은 일부러 안 엽니다</b> (1번)');
  const 일부러 = ['s9-insurances-acc', 'sec-summary', 'sec-weakness', 'sec-refund'];
  일부러.forEach(id => is(r.닫힘.indexOf(id) >= 0,
    '  #' + id.padEnd(20) + ' 닫힌 채다 — 억지로 펴면 빈 표에 「0원」 이 찍힙니다'));
  const 뜻밖 = r.닫힘.filter(x => 일부러.indexOf(x) < 0);
  is(뜻밖.length === 0, '  그 밖에 닫힌 덩어리 <b>' + 뜻밖.length + '개</b>' +
    (뜻밖.length ? ' ← ' + 뜻밖.slice(0, 6).join(' ') : ' — 전부 펴졌습니다'));

  head('[8] ★ 조용한가 · <b>서버</b>');
  is(터짐.length === 0, '  터진 곳 <b>' + 터짐.length + '가지</b>' + (터짐.length ? ' ← ' + 터짐[0] : ''));
  const 밖 = [...new Set(바깥)];
  is(true, '  막은 바깥 ' + 밖.length + '군데 — ' + 밖.join(' · '));

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 인쇄본에서 빠지는 것이 있습니다')
    : '✓ 클릭해야 나오던 것이 종이에 전부 나옵니다 (판 X517)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + e.message); process.exit(2); });
