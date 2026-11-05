/* 🙋 고객이 같이 고르는 발표 · 💡 장마다 한 줄 결론 · ★ 걱정 1순위 병부터 · 🧾 숨은 · 미청구 보험금 한 장 (판 X347)

   사장님 말씀 2026-11-05 「1, 2, 3번 정리해 / 짧게 보기는, 보고 싶은 것만 고객님이 같이 선택할 수 있도록 하는 칸을 만들어
   그리고 미청구보험금 조회칸도 넣어주고 한 장으로 추가해서 만들어」.

     1. 표지 다음에 「오늘 같이 볼 것」 장이 선다 — 끄면 그 장이 <b>발표 목록에서 빠지고</b>, 다시 켜면 돌아온다.
     2. ★ 가장 걱정되는 병을 고르면 <b>그 병 장이 병 장들 맨 앞</b>으로 온다(나머지 장 순서는 그대로).
     3. 「짧게 보기」 — 꼭 볼 장만 남고, 병 장은 <b>요약 세 쪽</b>(표지 · 합계 · 내 돈)만 넘긴다. 「전부 보기」 로 되돌아온다.
     4. 💡 한 줄 결론 — 무대에서 제목 밑에 서고, 숫자는 그 장이 센 함수 그대로다(월 보험료).
     5. 숨은 · 미청구 보험금 — 만들기 화면에 조회 칸, 발표에 한 장(「맡겨 주시면」 앞). 안 적으면 「아직 조회 전」,
        적으면 적은 값 그대로. 숨은 보험금과 미청구 보험금을 <b>나눠</b> 말하고, 3년(상법 제662조) · 지급은 약관과 심사.
        지급을 장담하는 말이 없다(심의 10대 금지 ⑥).
     6. 「오늘 순서」 목차에는 고르는 장이 안 적힌다 — 목차가 넘치지 않는다.   */
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
  /* ★ 바깥은 끊습니다(check-netblock) — 사장님 Supabase 를 부르지 않게 */
  await pg.route('**://**', r => (r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort()));
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  /* 견본 자료 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; S.slide = 'sSee'; go('show'); });
  await pg.waitForTimeout(600);
  const ids = () => pg.evaluate(() => deckList().map(s => s.id));

  head('[1] 「오늘 같이 볼 것」 — 끄면 빠지고 켜면 돌아온다');
  const all = await ids();
  is(all[0] === 'sHd' && all[1] === 'sSee', '표지 바로 다음에 선다 — ' + all.slice(0, 3).join(' · '));
  is(await pg.evaluate(() => document.querySelectorAll('#sSee .seeb').length >= 10), '고를 단추가 장마다 있다');
  await pg.evaluate(() => baSee('sFam'));
  const off = await ids();
  is(off.indexOf('sFam') < 0 && off.length === all.length - 1, '「가족」 을 끄면 발표에서 빠진다 (' + all.length + ' → ' + off.length + '장)');
  is(await pg.evaluate(() => S.slide === 'sSee'), '고르는 동안 화면은 고르는 장에 머문다');
  await pg.evaluate(() => baSee('sFam'));
  is((await ids()).length === all.length, '다시 켜면 돌아온다');

  head('[2] ★ 가장 걱정되는 병부터');
  const jr = L => L.filter(x => /^r_(cancer|brain|heart|care)$/.test(x));
  is(jr(all)[0] === 'r_cancer', '고르기 전에는 암 → 뇌 → 심장 → 간병 — ' + jr(all).join(' · '));
  await pg.evaluate(() => baWorry('heart'));
  const wh = await ids();
  is(jr(wh).join(' ') === 'r_heart r_cancer r_brain r_care', '심장에 ★ — 심장 장이 병 장들 맨 앞 (' + jr(wh).join(' · ') + ')');
  is(wh.filter(x => !/^r_(cancer|brain|heart|care)$/.test(x)).join(' ') === all.filter(x => !/^r_(cancer|brain|heart|care)$/.test(x)).join(' '),
     '병 장이 아닌 장 순서는 그대로다');

  head('[3] 「짧게 보기」 — 꼭 볼 것만 · 병 장은 요약 세 쪽');
  await pg.evaluate(() => baSeePreset('short'));
  const sh = await ids();
  is(sh.length < all.length - 6, '장 수가 확 준다 — ' + all.length + ' → ' + sh.length + '장');
  is(['s1', 's2', 'sSave', 'sClaim', 'sTrust', 'sClose', 'r_heart'].every(x => sh.indexOf(x) >= 0), '꼭 볼 장(월 보험료 · 낼 돈 · 1원마다 · 숨은 보험금 · 맡겨 주시면 · 클로징)과 ★ 병은 남는다');
  is(jr(sh).join(' ') === 'r_heart', '병 장은 ★ 고른 것 하나만 — ' + jr(sh).join(' · '));
  await pg.evaluate(() => { var L = deckList(); for (var i = 0; i < L.length; i++) if (L[i].id === 'r_heart') { deckJump(i); break; } });
  let pos = null;
  for (let k = 0; k < 20 && !pos; k++) {
    await pg.waitForTimeout(500);
    pos = await pg.evaluate(() => { try { var w = rpWin(document.getElementById('r_heart')); return w && w.REP && w.REP.pos ? w.REP.pos() : null; } catch (e) { return null; } });
  }
  is(pos && pos[1] === 3, '심장 장은 요약 세 쪽만 넘긴다 — ' + JSON.stringify(pos));
  await pg.evaluate(() => baSeePreset('all'));
  is((await ids()).length === all.length && await pg.evaluate(() => !S.brief), '「전부 보기」 로 다 돌아온다');

  head('[4] 💡 한 줄 결론');
  await pg.evaluate(() => { var L = deckList(); for (var i = 0; i < L.length; i++) if (L[i].id === 's1') { deckJump(i); break; } });
  await pg.waitForTimeout(400);
  const G = await pg.evaluate(() => { var g = document.querySelector('#s1.cur>h3 em.gist'); var P = premCalc();
    return { t: g ? g.textContent : '', vis: g ? getComputedStyle(g).display : '', want: fee(P.monA) }; });
  is(G.vis === 'block' && G.t.indexOf(G.want) >= 0, '월 보험료 장 제목 밑에 결론이 선다 — 「' + G.t + '」');

  head('[5] 🧾 숨은 · 미청구 보험금');
  const C0 = await pg.evaluate(() => { var L = deckList().map(x => x.id), s = document.getElementById('sClaim');
    return { at: L.indexOf('sClaim'), tr: L.indexOf('sTrust'), txt: s ? s.textContent : '', n: s ? s.querySelectorAll('.clc').length : 0 }; });
  is(C0.at >= 0 && C0.at === C0.tr - 1, '「맡겨 주시면」 바로 앞에 한 장으로 선다');
  is(C0.n === 3 && /숨은 보험금/.test(C0.txt) && /미청구 보험금/.test(C0.txt), '숨은 보험금 · 미청구 보험금을 <나눠> 말한다');
  is(/아직 조회 전/.test(C0.txt), '안 적었으면 「아직 조회 전」 — 지어내지 않는다');
  is(/상법 제662조/.test(C0.txt) && /약관과 심사/.test(C0.txt), '3년(상법 제662조) · 지급은 약관과 심사에 따른다');
  await pg.evaluate(() => go('edit'));
  await pg.waitForTimeout(300);
  is(await pg.evaluate(() => document.querySelectorAll('input[oninput*="setClaim"]').length === 5), '만들기 화면에 조회 칸(조회한 날 · 숨은 · 미청구 건수 · 금액 · 메모)');
  await pg.evaluate(() => { setClaim('date', '2026-11-05'); setClaim('hidden', '120'); setClaim('unN', '4'); setClaim('unAmt', '85'); S.deck = true; go('show'); });
  await pg.waitForTimeout(400);
  const C1 = await pg.evaluate(() => { var s = document.getElementById('sClaim'); return s ? s.textContent : ''; });
  is(/120만원/.test(C1) && /4건/.test(C1) && /85만원/.test(C1) && /2026-11-05/.test(C1) && !/아직 조회 전/.test(C1), '적은 값이 그대로 선다 (120만원 · 4건 · 85만원)');
  is(!/받아\s*드립니다|100\s*%|무조건|반드시\s*받|보장해\s*드립/.test(C0.txt + C1), '지급을 <장담하는 말>이 없다 (심의 10대 금지 ⑥)');

  head('[6] 목차에는 고르는 장이 안 적힌다');
  const T = await pg.evaluate(() => [].slice.call(document.querySelectorAll('#deckToc a')).map(a => a.getAttribute('href')));
  is(T.length > 0 && T.indexOf('#sSee') < 0, '「오늘 순서」 에 「오늘 같이 볼 것」 이 없다 (' + T.length + '줄)');

  head('[7] 조용한가');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 고객이 같이 고르고, 장마다 결론이 서고, 숨은 · 미청구 보험금 장이 섭니다');
  process.exit(bad ? 1 : 0);
})();
