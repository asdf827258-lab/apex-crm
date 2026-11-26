/* 🖨 보장분석 전·후 — 인쇄가 <b>안 깨지고</b> 나오나 (판 X578)

   사장님 말씀 2026-11-26 「보장분석 전후 비교자료 인쇄 하면 자꾸 안되고 오류가 생겨,
   최종보고서도 인쇄하게 만들고 테두리를 만들어서 조금 더 있어보이게 만들어 ·
   인쇄 버튼 누르면 보장분석 전후 가로버전으로 인쇄될수 있도록 만들어 ·
   고객에게 보여주기 칸은, 맨 밑에 인쇄버튼 여러가지가 있는데 이름을 직관적으로 바꿔라」

   재어 보니 —
     ■ 위 띠 「🖨 인쇄 · PDF」 는 window.print() 였다. 만들기 화면에서 누르면 <b>입력칸 · 단추</b>가
       Letter 종이 9쪽에 그대로 찍혔다(쪽 크기도 안 정해 612×792). 그게 「오류」 였다.
     ■ 최종 보고서는 견본 고객에서도 8쪽이 넘쳐 <b>머리말 없는 쪽</b>이 하나 더 나왔다(9쪽 → 10쪽).

   여기서 못 박는 것 — 글자를 세지 않고 <b>PDF 를 실제로 뽑아</b> 쪽 수 · 쪽 크기를 잽니다.
     [1] 위 띠 인쇄 단추가 window.print() 가 아니라 <b>가로 인쇄</b>(baPrintLand)다
     [2] <b>만들기 화면에서</b> 눌러도 전·후 발표가 16:9 로 한 쪽에 한 장 · 뽑고 나면 만들기 화면으로 돌아온다
     [3] 최종 보고서 — 쪽마다 <b>테두리 틀</b>(남색 테 · 금색 안쪽 줄)이 있고, 쪽 수 = 틀 수(넘친 빈 쪽 0) ·
         내용이 틀 밖으로 안 나간다(잘려 숨는 글 0)
     [4] 보여주기 맨 밑 단추 이름이 <b>무엇이 · 어떤 종이로</b> 나오는지 말한다 · 가로가 맨 앞 · 한 장씩 보기가 아니어도 선다
   ⚠ 되돌림 둘 — 위 띠를 window.print() 로 되돌리거나 쪽 맞추기(frFit)를 빼면 운다.           */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const BA = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
let OVR = null;   /* 되돌림 시험 때만 ba.html 을 바꿔 내보낸다 */
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
  if (p === '/app/ba.html' && OVR) { rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(OVR); return; }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : /\.css$/.test(f) ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const pdfPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
const pdfBox = (buf) => { const m = buf.toString('latin1').match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/); return m ? { w: +m[3] - +m[1], h: +m[4] - +m[2] } : null; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port + '/app/ba.html';
  const br = await chromium.launch();
  const open = async () => {
    const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
    await pg.route('**://**', r => { const u = r.request().url(); if (/^http:\/\/127\.0\.0\.1/.test(u)) r.continue(); else r.abort(); });
    await pg.goto(base, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(700);
    /* 견본 자료 — 앱이 스스로 넣는 예시 고객이다. 실제 고객이 아니다 */
    await pg.evaluate(() => { localStorage.clear(); doSample(); window.print = function () { window.__pr = (window.__pr || 0) + 1; }; });
    return pg;
  };
  /* 가로 인쇄 한 번 — 만들기 화면에서 위 띠 단추를 누른다 */
  const landOnce = async (pg) => {
    await pg.evaluate(() => { go('edit'); });
    const btn = await pg.evaluate(() => { var b = [].slice.call(document.querySelectorAll('.bar .btn')).filter(function (x) { return /인쇄/.test(x.textContent) && !/보고서/.test(x.textContent); })[0]; if (b) b.click(); return b ? { t: b.textContent.trim(), on: b.getAttribute('onclick') } : null; });
    await pg.waitForTimeout(300);
    /* 브라우저가 인쇄 직전에 하는 일(접힌 것 펴기)을 먼저 해 두고 센다 — check-baland 와 같은 순서 */
    await pg.evaluate(() => { try { removeEventListener('afterprint', baAfterPrint); } catch (e) { } printAllOn(); });
    const st = await pg.evaluate(() => ({ mode: S.mode, land: document.body.classList.contains('printland'), n: document.querySelectorAll('#deckShow>section.cur').length, pr: window.__pr || 0 }));
    const buf = await pg.pdf({ preferCSSPageSize: true, printBackground: true });
    return { btn, st, buf };
  };

  head('[1] 위 띠 인쇄 단추는 <가로 인쇄> 다 — window.print() 가 아니다');
  let pg = await open();
  const top = await pg.evaluate(() => [].slice.call(document.querySelectorAll('.bar .btn')).map(function (b) { return { t: b.textContent.trim(), on: b.getAttribute('onclick') || '' }; }));
  const pr = top.filter(b => /인쇄/.test(b.t) && !/보고서/.test(b.t))[0] || {};
  is(/baPrintLand\(\)/.test(pr.on || ''), '위 띠 「' + (pr.t || '없음') + '」 → ' + (pr.on || '—') + ' (만들기 화면을 그대로 찍던 window.print() 가 아니다)');
  is(/가로/.test(pr.t || ''), '이름에 <가로> 라고 적혀 있다');
  is(!top.some(b => /window\.print\(\)/.test(b.on)), '위 띠에 window.print() 단추가 하나도 없다');

  head('[2] 만들기 화면에서 눌러도 전·후 발표가 가로 16:9 로 한 쪽에 한 장');
  const L1 = await landOnce(pg);
  const bx = pdfBox(L1.buf), np = pdfPages(L1.buf);
  is(L1.st.pr === 1 && L1.st.land && L1.st.mode === 'show', '눌렀더니 보여주기(한 장씩)로 가서 한 번 인쇄한다 — 인쇄 ' + L1.st.pr + '번 · 화면 ' + L1.st.mode);
  is(!!bx && Math.abs(bx.w / bx.h - 16 / 9) < 0.02, '쪽이 16:9 다 — ' + (bx ? Math.round(bx.w) + '×' + Math.round(bx.h) : '?'));
  is(np === L1.st.n && np >= 15, '쪽 수 = 장 수 — ' + np + '쪽 / ' + L1.st.n + '장 (한 장이 두 쪽으로 갈리거나 빈 쪽이 끼지 않는다)');
  await pg.evaluate(() => { dispatchEvent(new Event('afterprint')); baAfterPrint(); });
  await pg.waitForTimeout(250);
  const back = await pg.evaluate(() => ({ mode: S.mode, land: document.body.classList.contains('printland'), css: (document.getElementById('baPageCss') || {}).textContent || '' }));
  is(back.mode === 'edit' && !back.land && !back.css, '뽑고 나면 <만들기 화면>으로 돌아오고 가로 규칙이 화면에 안 남는다 — ' + back.mode);

  head('[3] 최종 보고서 — 쪽마다 테두리 · 쪽 수 = 틀 수 · 틀 밖으로 안 나간다');
  await pg.close(); pg = await open();
  await pg.evaluate(() => { go('edit'); frPrint(); });
  await pg.waitForTimeout(300);
  const FR = await pg.evaluate(() => {
    var W = [].slice.call(document.querySelectorAll('#finalRep .frpw'));
    return { n: W.length, frp: document.body.classList.contains('frpOn'),
      css: (document.getElementById('baPageCss') || {}).textContent || '',
      zoomed: W.filter(function (w) { var p = w.querySelector('.frpg'); return p && p.style.zoom && +p.style.zoom < 1; }).length,
      long: W.filter(function (w) { return w.classList.contains('long'); }).length };
  });
  /* 종이 안쪽 폭(190mm = 718px)으로 인쇄 꼴을 띄워 잰다 — 창 폭 그대로 재면 표·그림이 두 배로 넓어져 헛것이 난다 */
  await pg.setViewportSize({ width: 718, height: 900 });
  await pg.emulateMedia({ media: 'print' });
  const FB = await pg.evaluate(() => [].slice.call(document.querySelectorAll('#finalRep .frpw')).map(function (w, i) {
    var cs = getComputedStyle(w), bf = getComputedStyle(w, '::before'), p = w.querySelector('.frpg'), wr = w.getBoundingClientRect(), pr = p.getBoundingClientRect();
    return { i: i + 1, bw: parseFloat(cs.borderTopWidth), bc: cs.borderTopColor, gold: bf.borderTopColor, gw: parseFloat(bf.borderTopWidth),
      inside: pr.bottom <= wr.bottom + 1 || w.classList.contains('long'), over: Math.round(pr.bottom - wr.bottom) };
  }));
  await pg.evaluate(() => { try { window.removeEventListener('afterprint', baAfterPrint); } catch (e) { } });
  const fbuf = await pg.pdf({ preferCSSPageSize: true, printBackground: true });
  await pg.emulateMedia({ media: 'screen' });
  await pg.setViewportSize({ width: 1400, height: 900 });
  const fp = pdfPages(fbuf), fbx = pdfBox(fbuf);
  is(FR.frp && /A4 portrait/.test(FR.css), '최종 보고서만 서고 A4 세로로 잡힌다');
  is(FR.n >= 8 && FB.every(b => b.bw >= 1 && /15, 26, 44/.test(b.bc)), '쪽마다 남색 테두리 — 틀 ' + FR.n + '개');
  is(FB.every(b => b.gw > 0 && /201, 168, 106/.test(b.gold)), '쪽마다 안쪽 금색 실선');
  is(fp === FR.n, '쪽 수 = 틀 수 — PDF ' + fp + '쪽 / 틀 ' + FR.n + '개 (전에는 넘친 쪽이 머리말 없이 한 장 더 나왔다)');
  is(!!fbx && Math.abs(fbx.w - 595) < 3 && Math.abs(fbx.h - 842) < 3, 'A4 세로 — ' + (fbx ? Math.round(fbx.w) + '×' + Math.round(fbx.h) : '?'));
  is(FB.every(b => b.inside), '내용이 틀 밖으로 안 나간다 — ' + (FB.filter(b => !b.inside).map(b => b.i + '쪽 ' + b.over + 'px').join(', ') || '넘친 쪽 0') + ' · 줄인 쪽 ' + FR.zoomed + ' · 이어진 쪽 ' + FR.long);

  head('[4] 보여주기 맨 밑 단추 — 이름이 「무엇이 · 어떤 종이로」');
  const SC = await pg.evaluate(() => {
    var out = {};
    [true, false].forEach(function (dk) {
      S.deck = dk; go('show');
      out[dk ? 'deck' : 'flow'] = [].slice.call(document.querySelectorAll('.showctl .btn')).map(function (b) { return { t: b.textContent.trim(), on: b.getAttribute('onclick') || '' }; });
    });
    return out;
  });
  const P = SC.deck.filter(b => /print|Print|frImage/i.test(b.on));
  const want = [['baPrintLand', /전·후 비교 — 가로로 인쇄/], ['frPrint', /최종 보고서 인쇄 — A4 책자/], ['frImage', /카톡으로 보낼 요약 그림/],
    ['baAllPrint(1)', /모든 담보 표 — A4 한 장/], ['baAllPrint(2)', /모든 담보 표 — 크게 두 장/], ["baPrint('doc')", /설명글까지 전부 — 세로/]];
  want.forEach(([fn, re]) => { const b = P.filter(x => x.on.indexOf(fn) >= 0)[0]; is(!!b && re.test(b.t), fn + ' → 「' + (b ? b.t : '없음') + '」'); });
  is(P.length && /baPrintLand/.test(P[0].on), '가로 인쇄가 맨 앞이다');
  is(SC.flow.some(b => /baPrintLand/.test(b.on)), '죽 이어서 보기일 때도 가로 인쇄 단추가 선다');
  is(!SC.deck.some(b => /한눈 \(A4|담보 확대|문서로 \(세로/.test(b.t)), '옛 이름(담보 한눈 · 담보 확대 · 문서로)이 안 남았다');
  await pg.close();

  head('[되돌림] 위 띠를 window.print() 로 · 쪽 맞추기를 빼면 운다');
  OVR = BA.replace('onclick="baPrintLand()" title="전·후 비교 발표를', 'onclick="window.print()" title="전·후 비교 발표를');
  pg = await open();
  const r1 = await pg.evaluate(() => [].slice.call(document.querySelectorAll('.bar .btn')).some(function (b) { return /window\.print\(\)/.test(b.getAttribute('onclick') || ''); }));
  is(OVR !== BA && r1, '① 위 띠가 window.print() 면 [1] 이 운다');
  await pg.close();
  OVR = BA.replace('  frFit(box);     /* 판 X578', '  /* frFit 뺌 */     /* 판 X578');
  pg = await open();
  await pg.evaluate(() => { go('edit'); frPrint(); });
  await pg.waitForTimeout(300);
  const n2 = await pg.evaluate(() => document.querySelectorAll('#finalRep .frpw').length);
  await pg.setViewportSize({ width: 718, height: 900 });
  await pg.emulateMedia({ media: 'print' });
  const over2 = await pg.evaluate(() => [].slice.call(document.querySelectorAll('#finalRep .frpw')).filter(function (w) { var p = w.querySelector('.frpg'); return p.getBoundingClientRect().bottom > w.getBoundingClientRect().bottom + 1; }).length);
  is(OVR !== BA && over2 > 0, '② 쪽 맞추기를 빼면 틀 밖으로 넘치는 쪽이 생겨 [3] 이 운다 — ' + over2 + '쪽 / ' + n2);
  await pg.close();

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
  console.log('인쇄 점검 통과 — 가로는 한 쪽에 한 장, 최종 보고서는 테두리 안에 딱 맞게, 단추는 이름대로 나갑니다.');
})().catch(e => { console.error(e); process.exit(1); });
