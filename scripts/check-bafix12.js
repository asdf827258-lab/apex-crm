/* 🔧 보장 전·후 발표 — 다시 찾은 개선점 열두 가지 (판 X351)

   사장님 말씀 2026-11-05 「다시 한번 개선할점 찾아줘」 → 「한글로 쓰고, 전부 고치고 머지해」.

     1. 📱 폰(390px)에서 무대가 <b>화면 왼쪽 밖</b>(-445px)에 있었다 → 화면 안에 · 밑 빈칸 없이 · 「가로로 돌리면」 한 줄.
     2. 같은 말로 다른 수를 세었다 — 「비는 자리 0건」 과 「비어 있는 담보 37가지」 → 줄어드는/늘어나는 담보 · 아예 없는 담보로 나눔.
        「이제 달라지는 것」 과 「빠진 담보 점검」 의 「아예 없는 담보」 가 같은 수다.
     3. 「오늘 같이 볼 것」 은 장 수가 아니라 고를 것의 수(가지) — 아래 진행 띠(장)와 안 섞인다.
     4. 100% 넘는 준비율(379%)은 「기준의 3.8배」.
     5. 「들 돈」 → 「드는 돈(기준 치료비)」, 풀이에 기준 치료비 · 조정.
     6. 한 줄 결론 「1원마다 41.7원」 이 수익률처럼 읽히던 것 → 「더 내는 ○○으로 목돈 보장이 ○○ 늘어납니다」.
     7. 맺음 말풍선이 넘는 병을 <b>다</b> 말한다(암만 말하던 것).
     8. 출처 · 적어 둘 것은 「한 줄 요약」 앞(셈한 근거) — 숨은 보험금 · 맡겨 주시면 · 달라지는 것이 끊기지 않고 이어지고, 마지막은 클로징.
     9. 「오늘 순서」 에 장 하나뿐인 묶음이 없다.
    10. 요약 그림에 쪽 번호 「1 / 9」 가 안 찍힌다.
    11. 요약 그림 맨 아래 담당(이름 · 연락처) · 다음 점검 달.
    12. 폰에서 그림 판 제목이 꺾이지 않고, 「만드는 중」 안내가 판 위에 남지 않는다.   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port, base = 'http://127.0.0.1:' + port + '/app/ba.html';
  const br = await chromium.launch();
  /* ★ 바깥은 끊습니다(check-netblock) — 사장님 Supabase 를 부르지 않게. 그림 굽는 html2canvas 만 cdnjs 에서 받습니다. */
  const route = pg => pg.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + port) >= 0 || /cdnjs\.cloudflare\.com\/ajax\/libs\/html2canvas\//.test(u)) ? r.continue() : r.abort();
  });
  const errs = [];
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  await route(pg);
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto(base, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  /* 견본 자료 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; go('show'); });
  await pg.waitForTimeout(600);
  const jump = id => pg.evaluate(id => { var L = deckList(); for (var i = 0; i < L.length; i++) if (L[i].id === id) { deckJump(i); return true; } return false; }, id);
  const text = id => pg.evaluate(id => { var s = document.getElementById(id); return s ? s.textContent.replace(/\s+/g, ' ') : ''; }, id);

  head('[1] 📱 폰에서 무대가 화면 안에 선다');
  const ph = await br.newPage({ viewport: { width: 390, height: 844 }, userAgent: PHONE_UA, isMobile: true, hasTouch: true });
  await route(ph);
  ph.on('pageerror', e => errs.push('폰 ' + String(e).slice(0, 160)));
  await ph.goto(base, { waitUntil: 'domcontentloaded' });
  await ph.waitForTimeout(800);
  await ph.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; S.slide = 's1'; go('show'); });
  await ph.waitForTimeout(700);
  const P1 = await ph.evaluate(() => { var s = document.querySelector('.show.deck>section.cur'), w = document.getElementById('deckWrap'), t = document.querySelector('.deckTip');
    var r = s.getBoundingClientRect(), wr = w.getBoundingClientRect();
    return { x: Math.round(r.x), r: Math.round(r.right), h: Math.round(r.height), wh: Math.round(wr.height), tip: t ? getComputedStyle(t).display : 'none' }; });
  is(P1.x >= 0 && P1.r <= 390, '무대가 화면 안 — 왼쪽 ' + P1.x + 'px · 오른쪽 ' + P1.r + 'px (전에는 -445px)');
  is(P1.wh <= P1.h + 12, '무대 밑에 빈칸이 없다 — 자리 ' + P1.wh + 'px · 무대 ' + P1.h + 'px');
  is(P1.tip === 'flex', '세로 폰에는 「가로로 돌리면 크게 보입니다 · 죽 이어서 보기」 한 줄');
  const D1 = await pg.evaluate(() => { var s = document.querySelector('.show.deck>section.cur'), r = s.getBoundingClientRect(), t = document.querySelector('.deckTip');
    return { x: Math.round(r.x), w: Math.round(r.width), tip: t ? getComputedStyle(t).display : 'none' }; });
  is(D1.x > 0 && D1.w > 900 && D1.tip === 'none', '컴퓨터 화면은 그대로 — 무대 ' + D1.w + 'px · 안내 줄 없음');

  head('[2] 같은 이름으로 다른 수를 세지 않는다');
  const s1 = await text('s1');
  is(/줄어드는 담보/.test(s1) && /늘어나는 담보/.test(s1) && !/비는 자리|채우는 자리/.test(s1), '「한눈에」 — 줄어드는 담보 · 늘어나는 담보 (비는 자리 · 채우는 자리 아님)');
  const N = await pg.evaluate(() => {
    var c = document.querySelector('#sClose .czs4'), g = document.getElementById('sGap');
    var m1 = c && c.textContent.match(/아예 없는 담보\s*(\d+)가지\s*→\s*(\d+)가지/), m2 = g && g.textContent.match(/아예 없는 담보\s*(\d+)\s*→\s*(\d+)가지/);
    return { c: m1 ? m1[1] + '→' + m1[2] : '', g: m2 ? m2[1] + '→' + m2[2] : '', old: /비어 있는 담보/.test(document.querySelector('.show').textContent) };
  });
  is(N.c && N.c === N.g, '「이제 달라지는 것」 과 「빠진 담보 점검」 의 아예 없는 담보가 같은 수 — ' + N.c + ' / ' + N.g);
  is(!N.old, '발표 어디에도 「비어 있는 담보」 가 없다(아예 없는 담보로 통일)');

  head('[3] 「오늘 같이 볼 것」 은 가지 수');
  const see = await pg.evaluate(() => document.querySelector('#sSee h3 small').textContent);
  is(/고르신 것 \d+ \/ \d+가지/.test(see) && !/\d+장/.test(see), '「' + see.replace(/.*· /, '') + '」 — 장이 아니라 가지');

  head('[4] 100% 넘는 준비율은 「기준의 ○배」');
  const cl = await text('sClose');
  is(!/\d{3,}%/.test(cl), '「이제 달라지는 것」 에 379% 같은 수가 없다');
  is(/기준의 \d+(\.\d)?배/.test(cl), '넘는 병은 「기준의 ○배」 — ' + (cl.match(/기준의 \d+(\.\d)?배/g) || []).slice(0, 3).join(' · '));

  head('[5] 「들 돈」 → 「드는 돈(기준 치료비)」 · 풀이');
  const all = await pg.evaluate(() => document.querySelector('.show').textContent + document.createRange().createContextualFragment(frHtml()).textContent);
  is(!/들 돈/.test(all), '발표 · 최종 보고서에 「들 돈」 이 없다');
  is(await pg.evaluate(() => ['조정', '기준 치료비'].every(k => BA_TERMS.some(t => t[0] === k))), '풀이 표에 조정 · 기준 치료비');
  is(await pg.evaluate(() => !BA_TERMS.some(t => /배서|납입면제|표적항암/.test(t[2]))), '풀이 안에 또 어려운 말을 쓰지 않는다');

  head('[6] 한 줄 결론이 수익률처럼 읽히지 않는다');
  await jump('sSave'); await pg.waitForTimeout(300);
  const gs = await pg.evaluate(() => { var g = document.querySelector('#sSave>h3 em.gist'); return g ? g.textContent : ''; });
  is(gs && !/1원마다/.test(gs) && /늘어납니다/.test(gs), '「' + gs + '」');

  head('[7] 맺음 말풍선이 넘는 병을 다 말한다');
  const SAY = await pg.evaluate(() => { var C = calc(), ok = []; EVENTS.forEach(function (ev) { var r = evCalc(ev, C); if (r.rateA !== null && r.rateA >= 100) ok.push(ev.t); });
    var s = document.querySelector('#sClose>p.say'); return { ok: ok, say: s ? s.textContent : '' }; });
  is(SAY.ok.length > 1 && SAY.ok.every(t => SAY.say.indexOf(t) >= 0), '넘는 병 ' + SAY.ok.join(' · ') + ' — 「' + SAY.say.slice(0, 60) + '…」');

  head('[8] 출처 · 적어 둘 것은 「한 줄 요약」 앞 — 맺음 셋이 이어지고 마지막은 클로징');
  const L = await pg.evaluate(() => deckList().map(s => s.id));
  const at = k => L.indexOf(k);
  is(at('r_src') >= 0 && at('sEnd') === at('r_src') + 1 && at('s3') === at('sEnd') + 1, '출처 → 적어 둘 것 → 한 줄 요약 (' + L.slice(at('r_src'), at('s3') + 1).join(' → ') + ')');
  is(L.slice(-3).join(' ') === 'sClaim sTrust sClose', '맨 끝 셋이 숨은 보험금 → 맡겨 주시면 → 이제 달라지는 것');

  head('[9] 「오늘 순서」 에 장 하나뿐인 묶음이 없다');
  const G = await pg.evaluate(() => [].map.call(document.querySelectorAll('#deckToc .tgc'), g => g.querySelector('.tgh').childNodes[0].textContent + ':' + g.querySelectorAll('a').length));
  is(G.length > 0 && G.every(x => +x.split(':')[1] > 1), '묶음 ' + G.join(' · '));
  is(!G.some(x => /이 일이 생기면/.test(x)), '「이 일이 생기면」(경제활동기 한 장뿐) 묶음이 없다');

  head('[10 · 11] 요약 그림 — 쪽 번호 없음 · 담당 · 다음 점검');
  await pg.evaluate(() => { localStorage.setItem('ba_agent_v1', JSON.stringify({ nm: '시험담당', tel: '010-0000-0000' })); });
  await pg.evaluate(() => frH2c().then(function (h) { window.__H2C_ORIG = h; window.html2canvas = function (node, o) {
    var b = node.querySelector('.frf b'); window.__IMG_SEEN = { txt: node.innerText, pageNo: b ? getComputedStyle(b).display : 'none' }; return window.__H2C_ORIG(node, o); }; }));
  await pg.evaluate(() => frImage());
  let got = false;
  try { await pg.waitForSelector('#frImgBox img', { timeout: 30000 }); got = true; } catch (e) {}
  is(got, '그림을 구웠다');
  if (got) {
    const I = await pg.evaluate(() => window.__IMG_SEEN || {});
    is(I.pageNo === 'none', '그림에는 쪽 번호(1 / 9)가 안 찍힌다');
    is(/담당\s*시험담당\s*·\s*010-0000-0000/.test(I.txt || ''), '그림 맨 아래 「담당 이름 · 연락처」');
    const nx = new Date(); nx.setFullYear(nx.getFullYear() + 1);
    is(new RegExp('다음 점검\\s*' + nx.getFullYear() + '년 ' + (nx.getMonth() + 1) + '월').test(I.txt || ''), '「다음 점검 ' + nx.getFullYear() + '년 ' + (nx.getMonth() + 1) + '월」 (1년 뒤)');
    is(await pg.evaluate(() => document.querySelectorAll('#frImgBox .fag input').length === 2 && !!document.querySelector('#frImgBox .fag [onclick="frImage()"]')),
       '그림 판에 담당 이름 · 연락처 칸과 「다시 만들기」');
    await pg.evaluate(() => frImgClose());
  }

  head('[12] 폰 그림 판 — 제목이 안 꺾이고 「만드는 중」 이 안 남는다');
  await ph.evaluate(() => frImage());
  let pgot = false;
  try { await ph.waitForSelector('#frImgBox img', { timeout: 30000 }); pgot = true; } catch (e) {}
  if (pgot) {
    const B = await ph.evaluate(() => { var b = document.querySelector('#frImgBox .fih b'), t = document.getElementById('baToast');
      return { lines: Math.round(b.getBoundingClientRect().height / parseFloat(getComputedStyle(b).lineHeight || 20)), h: b.getBoundingClientRect().height, op: t ? t.style.opacity : '0' }; });
    is(B.h < 30, '제목 「💬 요약 한 장」 이 한 줄 — 높이 ' + Math.round(B.h) + 'px');
    is(B.op === '0', '「만드는 중」 안내가 판 위에 남지 않는다');
  } else is(false, '폰에서 그림을 못 구웠다');

  head('[13] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 다시 찾은 열두 가지가 고쳐져 있습니다');
  process.exit(bad ? 1 : 0);
})();
