/* 보장 전·후 「고객에게 보여주기」 — 설계사가 <b>따라만 가도</b> 되나 (판 X146).

   사장님 말씀 2026-10-21 「보장분석 전 후 자료에서 그 안에 내용만 전부 다듬고
   토스 테마와 아이콘, 그리고 따라만가도 할수 있을정도로 만들어」 — 따라 할
   사람은 <b>설계사</b>(사장님이 고르셨습니다).

   손대기 전 폰(390px)으로 찍어 보니 고객 화면이 무너져 있었습니다.
     · 「오늘 순서」 다섯 칸이 폰 폭에 그대로 서서 장 이름이 한 자씩 세로로
     · 「이 돈이 무엇이 되는가」·「가족에게 남는 것」 세 칸이 나란히 서서
       「159,60 / 0원」 처럼 숫자가 줄에서 끊김
     · 「담보 하나하나」 표 두 개가 나란히 서서 칸마다 한 글자씩
   그리고 장 제목에 아이콘이 없어 어느 장이나 똑같아 보였고, 장마다 「무엇을
   짚고 무엇을 읽나」 는 사용방법 한쪽(GUIDE_SELL · 여섯 장)에만 있었습니다 —
   실제 장은 스물둘이고 순서도 달랐습니다.

   여기서 못 박는 것 —
     1. 장마다 길잡이가 서나 — 「① 짚기 ② 읽기」, 물을 말이 있으면 「③ 물으면」
     2. 길잡이 표는 <b>BA_WALK 한 곳</b>인가 — GUIDE_SELL 이 되살아나지 않나 (5번)
        사용방법 「상담 자리에서」 가 같은 표를 읽나
     3. 표의 이름(nm)이 장의 이름(data-nm · 묶음 장은 data-grp)과 같나
     4. 장 제목마다 아이콘(data-ic)이 붙나
     5. 길잡이가 <b>장 밖</b>에 서나 — 카톡 복사 글 · 장 수 세기에 안 섞이나
     6. 인쇄에는 안 나가나 · 끄면 사라지나 · 끈 것이 남나
     7. 한 장씩 넘기기 — 지금 장의 길잡이 한 장만 뜨고, 장을 넘기면 따라 바뀌나
        만들기로 돌아가면 사라지나
     8. 폰(390px) — 세 칸 · 두 표가 한 줄로 서나 · 오늘 순서는 두 칸 이하인가
     9. 「③ 물으면」 답에 금액 · 세금 결론을 적지 않나 (1번 · 2번)            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

head('2. 날글 — 길잡이 표가 한 곳인가');
const SRC = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
is(/var BA_WALK=\[/.test(SRC), 'BA_WALK 표가 있다');
is(!/var GUIDE_SELL\s*=/.test(SRC) && !/GUIDE_SELL\.map/.test(SRC), 'GUIDE_SELL(여섯 장짜리 옛 순서)이 되살아나지 않았다');
is(/BA_WALK\.map\(/.test(SRC.slice(SRC.indexOf('function guideHtml'), SRC.indexOf('function guideHtml') + 6000)),
   '사용방법 「상담 자리에서」 가 BA_WALK 를 읽는다');

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  /* 바깥은 막는다 — 진짜 서버를 읽으면 CI 와 손이 다른 화면을 잽니다 (check-netblock) */
  await ctx.route('**://**', r => (r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort()));
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(600);
  /* 견본 자료 — 앱이 스스로 넣는 견본이다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.who.name = '홍길동'; S.deck = false; delete S.walk; save(); go('show'); });
  await pg.waitForTimeout(500);

  head('1 · 3 · 4 · 5. 죽 이어서 — 장마다 길잡이 · 아이콘 · 이름');
  const R = await pg.evaluate(() => {
    const L = deckList(), out = [];
    L.forEach(sec => {
      const w = baWalkOf(sec.id), prev = sec.previousElementSibling, h3 = sec.querySelector(':scope > h3');
      out.push({ id: sec.id, nm: sec.getAttribute('data-nm') || '', grp: sec.getAttribute('data-grp') || '',
        h3: h3 ? h3.textContent : '', hasH3: !!h3, ic: h3 ? (h3.getAttribute('data-ic') || '') : '',
        w: w ? { nm: w.nm, q: w.q || '', a: w.a || '' } : null,
        walk: prev && prev.classList.contains('bawalk') && prev.getAttribute('data-for') === sec.id ? prev.innerText : '',
        inner: sec.innerText.indexOf('설계사 길잡이') >= 0,
        say: !!sec.querySelector('.say') });
    });
    return { rows: out, n: L.length, kk: baKakaoText(document.getElementById('s1')) };
  });
  is(R.n >= 15, '견본 고객 장 ' + R.n + '개');
  const noW = R.rows.filter(r => !r.w).map(r => r.id);
  is(noW.length === 0, '표에 없는 장이 없다' + (noW.length ? ' — 빠짐: ' + noW.join(', ') : ''));
  const noWalk = R.rows.filter(r => r.w && !/① 짚기/.test(r.walk)).map(r => r.id);
  is(noWalk.length === 0, '장마다 바로 앞에 「① 짚기」 길잡이가 선다' + (noWalk.length ? ' — 없음: ' + noWalk.join(', ') : ''));
  const noRead = R.rows.filter(r => r.walk && !/② 읽기/.test(r.walk)).map(r => r.id);
  is(noRead.length === 0, '「② 읽기」 가 빠진 길잡이가 없다');
  const sayRef = R.rows.filter(r => r.say && r.walk && !/따옴표 한 줄/.test(r.walk)).map(r => r.id);
  is(sayRef.length === 0, '따옴표 줄이 있는 장은 「② 읽기」 가 그 줄을 가리킨다');
  const qRows = R.rows.filter(r => r.w && r.w.q);
  is(qRows.length >= 8 && qRows.every(r => /③ 물으면/.test(r.walk)), '물을 말이 있는 장 ' + qRows.length + '곳에 「③ 물으면」 이 선다');
  const badNm = R.rows.filter(r => {
    if (!r.w) return false;
    const pre = /_$/.test(BAK(r.id));
    return pre ? !(r.grp === r.w.nm || r.h3.indexOf(r.w.nm) >= 0) : r.nm !== r.w.nm;
  }).map(r => r.id + '(' + r.w.nm + ' ≠ ' + (r.nm || r.grp) + ')');
  function BAK(id) { return /^s4_|^s8_/.test(id) ? 'x_' : 'x'; }
  is(badNm.length === 0, '표 이름이 장 이름과 같다' + (badNm.length ? ' — ' + badNm.slice(0, 3).join(' · ') : ''));
  const noIc = R.rows.filter(r => r.hasH3 && !r.ic).map(r => r.id);
  is(noIc.length === 0, '제목이 있는 장마다 아이콘이 붙는다 (' + R.rows.filter(r => r.hasH3).length + '장)' + (noIc.length ? ' — 없음: ' + noIc.join(', ') : ''));
  is(R.rows.every(r => !r.inner), '길잡이가 장 <b>밖</b>에 선다 — 장 글자에 안 섞인다');
  is(R.kk && R.kk.indexOf('길잡이') < 0 && R.kk.indexOf('짚기') < 0, '카톡으로 복사한 글에 길잡이가 안 섞인다');

  head('9. 「③ 물으면」 답에 금액 · 세금 결론이 없나');
  const money = qRows.filter(r => /\d[\d,]*\s*(만원|원|억)/.test(r.w.a) || /비과세|세액공제|면세/.test(r.w.a)).map(r => r.id);
  is(money.length === 0, '답에 금액 · 세금 결론이 없다' + (money.length ? ' — ' + money.join(', ') : ''));

  head('6. 인쇄 · 끄기');
  await pg.emulateMedia({ media: 'print' });
  const pr = await pg.evaluate(() => [].slice.call(document.querySelectorAll('.bawalk')).filter(x => getComputedStyle(x).display !== 'none').length);
  is(pr === 0, '인쇄에는 길잡이가 안 나간다 (보이는 것 ' + pr + '개)');
  await pg.emulateMedia({ media: 'screen' });
  await pg.evaluate(() => baWalkSet(false));
  const off = await pg.evaluate(() => ({ n: document.querySelectorAll('#app .show > .bawalk').length, keep: JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /ba|전|state/i.test(k)) || 'null') || 'null') }));
  is(off.n === 0, '끄면 길잡이가 사라진다');
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(600);
  await pg.evaluate(() => go('show')); await pg.waitForTimeout(400);
  const off2 = await pg.evaluate(() => document.querySelectorAll('#app .show > .bawalk').length);
  is(off2 === 0, '끈 것이 다시 열어도 남는다');
  await pg.evaluate(() => baWalkSet(true));

  head('8. 폰 390px — 줄이 무너지지 않나');
  const ph = await pg.evaluate(() => {
    const cols = sel => { const e = document.querySelector('#app .show ' + sel); return e ? getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean).length : -1; };
    return { svg2: cols('.svg2'), famg: cols('.famg'), two: cols('.stwrap.two'), tocs: cols('.tocs'), w: innerWidth };
  });
  is(ph.svg2 === 1, '「이 돈이 무엇이 되는가」 세 칸이 한 줄로 (' + ph.svg2 + '칸)');
  is(ph.famg === 1, '「가족에게 남는 것」 세 칸이 한 줄로 (' + ph.famg + '칸)');
  is(ph.two === 1 || ph.two === -1, '「담보 하나하나」 표 두 개가 위아래로 (' + ph.two + '칸)');
  is(ph.tocs > 0 && ph.tocs <= 2, '「오늘 순서」 는 두 칸 이하 (' + ph.tocs + '칸)');

  head('7. 한 장씩 넘기기 — 지금 장의 길잡이만');
  await pg.setViewportSize({ width: 1280, height: 800 });
  const dk = await pg.evaluate(() => {
    setDeck(true);
    const L = deckList(); let i1 = -1, i2 = -1;
    L.forEach((s, i) => { if (s.id === 's1') i1 = i; if (s.id === 's2') i2 = i; });
    deckJump(i1); const a = (document.getElementById('baWalk') || {}).innerText || '';
    deckJump(i2); const b = (document.getElementById('baWalk') || {}).innerText || '';
    const inl = [].slice.call(document.querySelectorAll('#app .show > .bawalk')).filter(x => getComputedStyle(x).display !== 'none').length;
    go('edit'); const c = (document.getElementById('baWalk') || {}).innerText || '';
    return { a, b, inl, c };
  });
  is(/한눈에/.test(dk.a) && /① 짚기/.test(dk.a), '「한눈에」 장에서 그 장의 길잡이가 뜬다');
  is(/보험료 변화/.test(dk.b) && dk.b !== dk.a, '장을 넘기면 길잡이도 따라 바뀐다');
  is(dk.inl === 0, '한 장씩 볼 때는 장 사이 길잡이가 숨는다 (무대만 보인다)');
  is(dk.c.trim() === '', '만들기로 돌아가면 떠 있던 길잡이가 사라진다');

  head('사용방법 — 같은 표를 읽나');
  const gd = await pg.evaluate(() => { showPanel('guide'); go('edit'); const t = document.body.innerText; return { has: /상담 자리에서/.test(t), one: t.indexOf('이 병이 오면') >= 0 && t.indexOf('가족에게 남는 것') >= 0, n: (BA_WALK || []).length }; });
  is(gd.has && gd.one, '사용방법 「상담 자리에서」 에 장 ' + gd.n + '가지가 BA_WALK 그대로 선다');

  head('그리다 터지지 않았나');
  is(errs.length === 0, '페이지 에러 ' + errs.length + '건' + (errs.length ? ' — ' + errs[0] : ''));

  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '곳이 어긋납니다' : '\n✓ 설계사가 장마다 따라 갈 길이 섭니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
