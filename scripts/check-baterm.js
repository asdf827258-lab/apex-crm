/* 📖 어려운 말은 처음 나오는 자리에 한 줄 풀이 · 💬 최종 보고서 첫 쪽(요약)을 카톡용 그림 한 장으로 (판 X348)

   사장님 말씀 2026-11-05 「어려운 말이 남아 있습니다. 배서 · 납입면제 · 표준 · 목돈 보장 같은 말 — 처음 나오는 자리에
   한 줄 풀이를 붙이면 됩니다」 「상담 뒤 고객 손에 남는 것이 없습니다. 최종 보고서 첫 쪽(요약)만 카톡으로 보낼 수 있게
   이미지 한 장으로 뽑는 단추」.

     1. 발표에서 BA_TERMS 의 말마다 밑줄 · 풀이가 <b>딱 한 번</b> — 발표 순서로 <b>처음</b> 나오는 장에.
     2. 그 장을 끄면 풀이가 <b>다음에 나오는 장</b>으로 옮겨 간다(고객이 고른 순서대로).
     3. 풀이를 달아도 넘치는 장이 없다 — CI 처럼 웹 글꼴을 막고 잰다(꽉 찬 장은 그 장만 본문을 줄인다).
     4. 풀이에 단정하는 말이 없다 — 표준은 「권장」, 유사암은 「회사마다 다름」(심의 10대 금지 ⑥).
     5. 최종 보고서에도 같은 풀이 — 첫 쪽(요약)에 목돈 보장 · 일당.
     6. 💬 요약 한 장 — 1080px 너비 PNG 를 이 컴퓨터 안에서 굽고, 띄운 판에 그림 · 저장 단추가 선다.
        첫 쪽의 「지급은 약관과 심사에 따릅니다」 가 그림에도 남는다. 굽는 틀은 남지 않는다.   */
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

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  /* ★ 바깥은 끊습니다(check-netblock) — 사장님 Supabase 를 부르지 않게. 그림 굽는 html2canvas 만 cdnjs 에서 받습니다:
     이 자가 재는 것이 바로 그 굽기라 막으면 아무것도 못 잽니다. 웹 글꼴도 막습니다 — CI 처럼 다른 글꼴로 넘침을 잽니다. */
  await pg.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + port) >= 0 || /cdnjs\.cloudflare\.com\/ajax\/libs\/html2canvas\//.test(u)) ? r.continue() : r.abort();
  });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  /* 견본 자료 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; go('show'); });
  await pg.waitForTimeout(600);
  const scan = () => pg.evaluate(() => {
    var L = deckList().filter(function (s) { return !/^r_/.test(s.id); }), out = {};
    BA_TERMS.forEach(function (t) {
      var first = '', u = [], g = [];
      L.forEach(function (s) {
        if (!first && s.textContent.indexOf(t[0]) >= 0) first = s.id;
        [].forEach.call(s.querySelectorAll('u.tmw'), function (x) { if (x.textContent === t[0]) u.push(s.id); });
        [].forEach.call(s.querySelectorAll('.tmg b'), function (x) { if (x.textContent === t[1]) g.push(s.id); });
      });
      out[t[0]] = { first: first, u: u, g: g };
    });
    return out;
  });

  head('[1] 처음 나오는 장에 · 딱 한 번');
  const A = await scan();
  const used = Object.keys(A).filter(k => A[k].first);
  is(used.length >= 6, '발표에 나오는 어려운 말 ' + used.length + '가지 — ' + used.join(' · '));
  is(['배서', '표준', '목돈'].every(k => A[k].first), '사장님이 짚으신 배서 · 표준 · 목돈 보장이 발표에 있다');
  const off = used.filter(k => !(A[k].u.length === 1 && A[k].g.length === 1 && A[k].u[0] === A[k].first && A[k].g[0] === A[k].first));
  is(off.length === 0, '말마다 밑줄 하나 · 풀이 하나가 처음 나오는 장에 — ' + used.map(k => k + '→' + A[k].first).join(' · ') + (off.length ? ' ✗ ' + off.join(',') : ''));

  head('[2] 그 장을 끄면 풀이가 다음 장으로 옮겨 간다');
  const k0 = A['배서'].first;
  await pg.evaluate(id => baSee(id), k0);
  await pg.waitForTimeout(300);
  const B = await scan();
  is(B['배서'].first && B['배서'].first !== k0 && B['배서'].g[0] === B['배서'].first, '「' + k0 + '」 를 끄니 배서 풀이가 「' + B['배서'].first + '」 로');
  await pg.evaluate(id => baSee(id), k0);
  await pg.waitForTimeout(300);

  head('[3] 풀이를 달아도 넘치지 않는다 (웹 글꼴 막고)');
  const ov = await pg.evaluate(async () => {
    var L = deckList(), out = [];
    for (var i = 0; i < L.length; i++) {
      if (/^r_/.test(L[i].id)) continue;
      deckJump(i); await new Promise(r => setTimeout(r, 120));
      var s = document.querySelector('.show.deck>section.cur');
      if (s && s.querySelector(':scope>.tmg') && s.scrollHeight > s.clientHeight + 2) out.push(s.id + ' ' + s.scrollHeight + 'px');
    }
    return out;
  });
  is(ov.length === 0, '풀이가 달린 장이 한 장(720) 안에 든다' + (ov.length ? ' — ' + ov.join(' · ') : ''));

  head('[4] 풀이에 단정하는 말이 없다');
  const T = await pg.evaluate(() => BA_TERMS.map(t => t[1] + ' ' + t[2]).join(' / '));
  is(!/무조건|반드시|100\s*%|누구나|전액/.test(T), '단정 · 과장 표현 없음 (심의 10대 금지 ⑥ · ⑧)');
  is(/권장/.test(T) && /회사마다 다름/.test(T), '표준은 「권장」, 유사암은 「회사마다 다름」 으로 밝힌다');

  head('[5] 최종 보고서 첫 쪽에도 같은 풀이');
  const F = await pg.evaluate(() => { var d = document.createElement('div'); d.innerHTML = frHtml(); document.body.appendChild(d);
    frTerms(d); var p = d.querySelector('.frpg'), g = p.querySelector('.tmg'), r = { g: g ? [].map.call(g.querySelectorAll('b'), b => b.textContent) : [], before: g ? g.nextElementSibling && g.nextElementSibling.className : '' };
    d.remove(); return r; });
  is(F.g.indexOf('목돈 보장') >= 0 && F.g.indexOf('일당') >= 0, '요약 쪽 풀이 — ' + F.g.join(' · '));
  is(F.before === 'frf', '풀이는 쪽 맨 아래(쪽 번호 줄 바로 위)');

  head('[6] 💬 요약 한 장 그림');
  is(await pg.evaluate(() => !!document.querySelector('.showctl [onclick="frImage()"]')),'보여주기 화면 밑에 「요약 한 장 이미지」 단추');
  is(await pg.evaluate(() => !!document.querySelector('#barMoreBox [onclick*="frImage"]')), '위 띠 「더보기」 에도 단추');
  await pg.evaluate(() => frImage());
  let got = false;
  try { await pg.waitForSelector('#frImgBox img', { timeout: 30000 }); got = true; } catch (e) {}
  is(got, '그림을 구워 띄웠다' + (got ? '' : ' (html2canvas 를 못 받았으면 인터넷 연결 문제일 수 있음)'));
  if (got) {
    const I = await pg.evaluate(() => ({ w: __FR_IMG.w, h: __FR_IMG.h, n: __FR_IMG.name, sz: __FR_IMG.blob.size,
      host: !!document.getElementById('frImg'), save: !!document.querySelector('#frImgBox [onclick="frImgSave()"]'),
      close: !!document.querySelector('#frImgBox [onclick="frImgClose()"]'), vis: getComputedStyle(document.getElementById('frImgBox')).display }));
    is(I.w === 1080 && I.h > 900 && I.h < 2400, '1080px 너비 · 세로 한 장 — ' + I.w + '×' + I.h);
    is(I.sz > 30000, '빈 그림이 아니다 — ' + Math.round(I.sz / 1024) + 'KB');
    is(/^보험자산운용보고서_요약_홍철호_\d{8}\.png$/.test(I.n), '파일 이름 — ' + I.n);
    is(!I.host, '굽는 틀(#frImg)은 남지 않는다');
    is(I.vis === 'flex' && I.save && I.close, '띄운 판에 저장 · 닫기 단추');
    const P1 = await pg.evaluate(() => { var d = document.createElement('div'); d.innerHTML = frHtml(); return d.querySelector('.frpg').textContent; });
    is(/지급은 약관과 심사에 따릅니다/.test(P1) && /상담용 예시/.test(P1), '그림이 될 첫 쪽에 「상담용 예시 · 지급은 약관과 심사에 따릅니다」');
    await pg.evaluate(() => frImgClose());
    is(await pg.evaluate(() => getComputedStyle(document.getElementById('frImgBox')).display === 'none'), '닫으면 사라진다');
  }

  head('[7] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 어려운 말은 처음 나오는 장에 풀이가 서고, 요약 한 장이 그림으로 나옵니다');
  process.exit(bad ? 1 : 0);
})();
