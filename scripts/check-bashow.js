/* 「고객에게 보여주기」 를 <b>한 장씩 넘기며</b> 볼 수 있는가.

   고객 앞에서 스크롤을 내리면 고객 눈이 <b>아래 문단으로 먼저 달아난다.</b>
   아직 설명하지 않은 숫자를 고객이 먼저 읽고, 설계사는 이미 늦는다.
   그래서 한 장씩 넘기는 판을 뒀다. 여기서 못 박는 것은 여섯 가지다.

     1. 장은 <b>화면에 실제로 선 것</b>에서 센다. 미리 적어 둔 표로 세면,
        자료가 없어 안 그려진 장(왜 나에게 맞는가·보험료 변화는 빈 글을
        돌려준다)까지 세어 <b>빈 장</b>이 생기고 「4 / 12」 가 거짓말이 된다.
     2. 한 장씩 켜면 <b>한 장만</b> 보인다. 목차에는 지금 장이 표시된다.
     3. ← → · 목차 누르기로 넘어간다. 처음·끝을 넘어가지 않는다.
     4. <b>인쇄하면 전부 나온다.</b> 이것이 제일 중요하다 — 넘겨 보다가
        그대로 뽑으면 한 장만 나오고, 나머지 열한 장은 <b>없는 것</b>이 된다.
        받은 고객은 「이게 다인가 보다」 하고 읽는다. 그건 거짓말이다.
        (같은 이유로 printAllOn 이 접힌 것을 전부 펴서 인쇄한다)
     5. 죽 이어서로 되돌리면 <b>전부</b> 보이고 넘기는 띠는 사라진다.
     6. 발표를 켜면 설계사 도구(만들기·예시 채우기·전부 지우기)가 치워지고,
        끄면 <b>돌아온다.</b> 안 돌아오면 사장님이 앱을 못 쓴다.

   그리고 손은 <b>한 번만</b> 단다. 그릴 때마다 달면 겹겹이 쌓여
   → 를 한 번 눌러도 여러 장이 넘어간다.                             */
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

/* 화면에서 재는 것 — 「보이나」 는 offsetParent 로 묻는다.
   display:none 이면 offsetParent 가 null 이다. */
const SHOWN = `[].slice.call(document.querySelectorAll('#app .show > section'))`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));

  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(600);
  /* 견본 자료 — 앱이 스스로 넣는 홍철호다. 실제 고객 이름이 아니다. */
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.deck = true; S.slide = 'sHd'; go('show'); });
  await pg.waitForTimeout(400);

  const read = () => pg.evaluate(`(function(){
    var all=${SHOWN};
    return {
      ids: all.map(function(s){return s.id;}),
      shown: all.filter(function(s){return s.offsetParent!==null;}).map(function(s){return s.id;}),
      toc: [].slice.call(document.querySelectorAll('#baToc a')).map(function(a){return a.id||a.getAttribute('href');}),
      tocOn: [].slice.call(document.querySelectorAll('#baToc a.on')).map(function(a){return a.getAttribute('href');}),
      barTxt: (document.getElementById('deckBar').textContent||'').replace(/\\s+/g,' '),
      slide: S.slide, deck: !!S.deck
    };
  })()`);

  head('[1] 장은 <화면에 실제로 선 것>에서 센다 — 안 그려진 장을 세지 않는다');
  const full = await read();
  is(full.ids.length >= 10, '견본을 넣으면 장이 ' + full.ids.length + '개 선다');
  is(full.toc.length === full.ids.length,
     '목차 ' + full.toc.length + '칸 = 선 장 ' + full.ids.length + '개 — 남거나 모자라지 않는다');
  is(/\b1 \/ ' + full.ids.length + '\b/.test(full.barTxt) || full.barTxt.indexOf('1 / ' + full.ids.length) >= 0,
     '넘기는 띠도 같은 수를 말한다 — 「' + full.barTxt.replace(/[◀▶✕]/g, '').trim() + '」');

  /* 자료를 지우면 「왜 나에게 맞는가」·「보험료 변화」 는 빈 글을 돌려준다.
     그때 목차·장수가 <b>같이 줄어야</b> 한다. 미리 적어 둔 표로 세면 안 준다. */
  await pg.evaluate(() => { S = blank(); S.deck = true; S.mode = 'show'; save(); render(); });
  await pg.waitForTimeout(300);
  const bare = await read();
  is(bare.ids.length < full.ids.length,
     '자료를 비우면 장이 ' + full.ids.length + '개 → ' + bare.ids.length + '개로 줄어든다');
  is(bare.toc.length === bare.ids.length,
     '목차도 같이 ' + bare.toc.length + '칸으로 줄어든다 — 빈 장이 목차에 안 남는다');
  is(bare.barTxt.indexOf('/ ' + bare.ids.length) >= 0,
     '띠의 「몇 분의 몇」도 줄어든 수를 말한다 — 「' + bare.barTxt.replace(/[◀▶✕]/g, '').trim() + '」');

  /* 다시 견본으로 */
  await pg.evaluate(() => { doSample(); S.deck = true; S.slide = 'sHd'; go('show'); });
  await pg.waitForTimeout(400);

  head('[2] 한 장씩 켜면 한 장만 보인다 · 목차가 지금 장을 가리킨다');
  const one = await read();
  is(one.shown.length === 1, '보이는 장이 ' + one.shown.length + '개다');
  is(one.shown[0] === one.slide, '보이는 장이 지금 장(' + one.slide + ')과 같다');
  is(one.tocOn.length === 1 && one.tocOn[0] === '#' + one.slide,
     '목차에서 지금 장 하나만 켜져 있다 — ' + (one.tocOn[0] || '(없음)'));

  head('[3] ← → 로 넘어간다 · 처음·끝을 넘어가지 않는다');
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(160);
  const r1 = await read();
  is(r1.slide === one.ids[1], '→ 한 번에 한 장 넘어간다 — ' + one.slide + ' → ' + r1.slide);
  is(r1.shown.length === 1 && r1.shown[0] === r1.slide, '넘어간 뒤에도 한 장만 보인다');
  await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(160);
  await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(160);
  const r2 = await read();
  is(r2.slide === one.ids[0], '첫 장에서 ← 를 더 눌러도 안 넘어간다 — ' + r2.slide);
  await pg.evaluate(() => { var L = deckList(); deckJump(L.length - 1); });
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(160);
  const r3 = await read();
  is(r3.slide === one.ids[one.ids.length - 1], '끝 장에서 → 를 더 눌러도 안 넘어간다 — ' + r3.slide);

  head('[4] 목차를 누르면 그 장으로 간다');
  await pg.evaluate(() => { document.querySelectorAll('#baToc a')[4].click(); });
  await pg.waitForTimeout(220);
  const r4 = await read();
  is(r4.slide === one.ids[4], '목차 5번째를 누르니 ' + r4.slide + ' 가 열렸다');
  is(r4.shown.length === 1 && r4.shown[0] === one.ids[4], '그 장 하나만 보인다');

  head('[5] 인쇄하면 <전부> 나온다 — 넘겨 보던 중이라도');
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(250);
  const pr = await pg.evaluate(`(function(){
    var all=${SHOWN};
    return { n: all.length,
      vis: all.filter(function(s){return getComputedStyle(s).display!=='none';}).length,
      bar: getComputedStyle(document.getElementById('deckBar')).display };
  })()`);
  is(pr.vis === pr.n, '장 ' + pr.n + '개가 <전부> 인쇄에 나온다 (' + pr.vis + '개) — 한 장만 나가면 나머지는 없는 것이 된다');
  is(pr.bar === 'none', '넘기는 띠는 인쇄에 안 나온다');
  await pg.emulateMedia({ media: 'screen' });
  await pg.waitForTimeout(200);
  const back = await read();
  is(back.shown.length === 1, '인쇄가 끝나면 다시 한 장만 보인다');

  head('[6] 죽 이어서로 되돌리면 전부 보이고 띠가 사라진다');
  await pg.evaluate(() => setDeck(false));
  await pg.waitForTimeout(300);
  const sc = await read();
  is(sc.shown.length === sc.ids.length, '장 ' + sc.ids.length + '개가 전부 보인다');
  is(sc.barTxt === '', '넘기는 띠가 사라진다');
  is(sc.tocOn.length === 0, '목차에 켜진 칸이 없다 — 「지금 장」 이 없는 판이다');
  await pg.evaluate(() => setDeck(true));
  await pg.waitForTimeout(300);

  head('[7] 발표를 켜면 설계사 도구가 치워지고 <끄면 돌아온다>');
  const ctl = () => pg.evaluate(() => ({
    body: document.body.className,
    ctl: [].slice.call(document.querySelectorAll('.showctl')).filter(x => x.offsetParent !== null).length,
    bar: document.querySelector('.bar') ? getComputedStyle(document.querySelector('.bar')).display : 'none',
    x: !!document.querySelector('#deckBar .dnav.x')
  }));
  const c0 = await ctl();
  await pg.evaluate(() => deckShow(true));
  await pg.waitForTimeout(300);
  const c1 = await ctl();
  is(c1.ctl === 0 && c0.ctl > 0, '발표 중에는 설계사 도구 ' + c0.ctl + '줄이 다 치워진다');
  is(c1.bar === 'none', '위 띠(만들기·예시 채우기·전부 지우기)도 치워진다');
  is(c1.x, '발표를 끝내는 단추가 넘기는 띠에 있다');
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);
  const c2 = await ctl();
  is(c2.ctl === c0.ctl && c2.bar === c0.bar, 'Esc 로 끄면 도구가 그대로 돌아온다 (' + c2.ctl + '줄)');

  head('[8] 넘기는 손은 한 번만 달려 있다');
  /* 여러 번 다시 그린 뒤 → 를 한 번 누른다. 리스너가 쌓였으면 여러 장이 넘어간다. */
  await pg.evaluate(() => { deckJump(0); render(); render(); render(); });
  await pg.waitForTimeout(250);
  const b0 = await read();
  await pg.keyboard.press('ArrowRight');
  await pg.waitForTimeout(220);
  const b1 = await read();
  const moved = b0.ids.indexOf(b1.slide) - b0.ids.indexOf(b0.slide);
  is(moved === 1, '세 번 다시 그린 뒤에도 → 한 번에 <한 장>만 넘어간다 (' + moved + '장)');

  head('[9] 값이 바뀌어 다시 그려도 보던 장을 지킨다');
  /* 「바뀌기 전과 같다」 로만 재면, <b>늘 첫 장으로 되돌아가는</b> 버그를
     못 본다 — 앞뒤가 똑같이 첫 장이 되어 통과해 버린다. 그래서 <b>어디로
     갔는지</b>를 이름으로 못 박는다. */
  const want = (await read()).ids.slice(-3)[0];
  await pg.evaluate((w) => { deckJump(deckList().map(function (s) { return s.id; }).indexOf(w)); }, want);
  await pg.waitForTimeout(200);
  const k0 = await read();
  is(k0.slide === want, '뒤에서 세 번째 장(' + want + ')으로 옮겨 놓았다');
  await pg.evaluate(() => { setView(S.view === 'senior' ? 'full' : 'senior'); });
  await pg.waitForTimeout(350);
  const k1 = await read();
  is(k1.slide === want, '분석 모드를 바꿔도 ' + want + ' 에 그대로 있다 — 지금은 ' + k1.slide);
  is(k1.shown.length === 1 && k1.shown[0] === want, '보이는 장도 ' + want + ' 하나다');
  await pg.evaluate(() => { setView('full'); });

  head('[10] 한 장이 <PPT 한 장>이다 — 16:9 · 720px 안에 들어간다');
  /* 고객 앞에 세우는 것은 세로로 긴 문서가 아니라 <b>가로 한 장</b>이다.
     한 장이 720 을 넘으면 그건 한 장이 아니라 두 장이고, 그 순간
     「발표」가 아니라 「문서 읽기」가 된다. */
  const stage = await pg.evaluate(() => {
    /* <b>줄이기 전</b>의 크기를 잰다 — getBoundingClientRect 는 줄인 뒤 크기라
       나누어 되돌리면 소수점이 흘러 1280 이 안 나온다. offsetWidth 는 원래 크기다. */
    var box = document.querySelector('#app .show');
    var k = 1, m = (box.style.transform || '').match(/scale\(([\d.]+)\)/);
    if (m) k = parseFloat(m[1]);
    return { w: box.offsetWidth, h: box.offsetHeight, k: k,
             wrap: !!document.getElementById('deckWrap') };
  });
  is(stage.w === 1280 && stage.h === 720,
     '무대가 <1280 × 720>(16:9) 이다 — 지금 ' + stage.w + ' × ' + stage.h);
  is(stage.wrap, '화면에 맞게 통째로 줄여 앉히는 자리가 있다 (지금 ' + stage.k.toFixed(2) + '배)');
  const dense = await pg.evaluate(() => {
    return [].slice.call(document.querySelectorAll('#app .show > section')).map(function (s) {
      var was = s.className; s.classList.add('cur');
      var h = s.scrollHeight, tbl = s.querySelectorAll('table').length;
      s.className = was;
      return { id: s.id, h: h, pages: h / 720, tbl: tbl, nm: s.getAttribute('data-nm') || '' };
    });
  });
  const fat = dense.filter(d => d.h > 722);
  is(fat.length === 0, fat.length ? ('한 장에 안 들어가는 장 — ' +
      fat.map(f => f.id + ' ' + f.h + 'px').join(' / ')) :
     '장 ' + dense.length + '개 <전부> 한 장(720px) 안에 들어간다 (제일 긴 장 ' +
       Math.max.apply(null, dense.map(d => d.h)) + 'px)');
  /* 장 높이만 재면 <b>카드 안쪽에서 잘리는 것</b>을 못 본다. 세로 flex 의
     자식은 자리가 모자라면 눌리고, overflow:hidden 이 눌린 만큼을 <b>소리
     없이</b> 잘라 버린다 — 장 높이는 720 그대로다. 실제로 「병이 오면」이
     네 단계 중 두 단계 반을, 「암 치료비」가 열 줄 중 네 줄을 이렇게
     잘라 버리고 있었다. 잘린 담보는 고객에게 <b>없는 담보</b>다. */
  const clip = await pg.evaluate(() => {
    var out = [];
    [].slice.call(document.querySelectorAll('#app .show > section')).forEach(function (sec) {
      var was = sec.className; sec.classList.add('cur');
      [].slice.call(sec.querySelectorAll('*')).forEach(function (el) {
        var cs = getComputedStyle(el);
        if (cs.overflowY !== 'hidden' && cs.overflowX !== 'hidden') return;
        var d = el.scrollHeight - el.clientHeight;
        if (d > 2) out.push(sec.id + '·' + String(el.className || el.tagName).split(' ')[0] + ' ' + d + 'px');
      });
      sec.className = was;
    });
    return out;
  });
  is(clip.length === 0, clip.length ? ('카드 안에서 잘려 안 보이는 것 — ' + clip.join(' / ')) :
     '어느 장도 <카드 안에서 몰래 자르지> 않는다 — 잘린 담보는 없는 담보가 된다');
  /* 그대로 읽는 말이 장마다 있는가 — 「읽어만 줘도 되게」의 알맹이다 */
  const says = await pg.evaluate(() => {
    var out = [];
    [].slice.call(document.querySelectorAll('#app .show > section')).forEach(function (s) {
      var p = s.querySelector(':scope > .say');
      out.push({ id: s.id, has: !!p, len: p ? (p.textContent || '').trim().length : 0 });
    });
    return out;
  });
  const noSay = says.filter(x => !x.has).map(x => x.id);
  is(noSay.length === 0, noSay.length ? ('읽는 말이 없는 장 — ' + noSay.join(' ')) :
     '장 ' + says.length + '개 모두 <그대로 읽는 한 문장>을 달고 있다');
  const longSay = says.filter(x => x.len > 130).map(x => x.id + '(' + x.len + '자)');
  is(longSay.length === 0, longSay.length ? ('읽는 말이 너무 길다 — ' + longSay.join(' ')) :
     '읽는 말이 모두 한 호흡이다 (제일 긴 것 ' + Math.max.apply(null, says.map(x => x.len)) + '자)');
  /* 「표가 몰렸나」 를 개수 문턱으로만 재면, 되돌린 판이 아예 안 그려졌을 때도
     통과한다. 그래서 <b>세어야 할 수</b>를 앱에서 직접 가져와 견준다. */
  const st = await pg.evaluate(() => {
    var C = calc(), rowsWant = 0;
    STD.forEach(function (g) {
      var rows = g.rows.filter(function (r) {
        if (S.view !== 'senior' || S.printAll) return true;
        return C.b[r.k] !== undefined || C.a[r.k] !== undefined;
      });
      rowsWant += rows.length;
    });
    var got = [].slice.call(document.querySelectorAll('#app .show > section'))
      .filter(function (s) { return /^s8_/.test(s.id); });
    /* 장 수가 아니라 <b>담보 줄</b>을 센다. 묶고 나누는 것은 괜찮고,
       빠지는 것은 안 된다. 표가 두 칸이면 머리줄도 두 개다. */
    var rowsGot = 0;
    got.forEach(function (s) {
      rowsGot += s.querySelectorAll('.st table tr').length - s.querySelectorAll('.st table').length;
    });
    /* STD 의 묶음이 <b>STD_DECK 에 꼭 한 번씩</b> 들어 있는가 — 묶음을
       하나 늘리고 여기 안 적으면 그 담보는 화면에서 <b>통째로</b> 사라진다. */
    var seen = {}, dup = [], miss = [];
    STD_DECK.forEach(function (g) { g.of.forEach(function (m) {
      if (seen[m]) dup.push(m); seen[m] = 1; }); });
    STD.forEach(function (g) { if (!seen[g.mid]) miss.push(g.mid); });
    return { deck: STD_DECK.length, got: got.length,
             rowsWant: rowsWant, rowsGot: rowsGot, dup: dup, miss: miss,
             two: got.filter(function (s) { return s.querySelectorAll('.st table').length > 1; }).length,
             tbl: got.map(function (s) { return s.querySelectorAll('.st table').length; }) };
  });
  is(st.miss.length === 0 && st.dup.length === 0,
     (st.miss.length ? ('무대에 안 세운 담보 묶음 — ' + st.miss.join(' · ')) :
      st.dup.length ? ('두 번 세운 묶음 — ' + st.dup.join(' · ')) :
      'STD 의 담보 묶음이 <꼭 한 번씩> 무대에 선다 — ' + st.deck + '장으로 묶었다'));
  is(st.rowsGot === st.rowsWant && st.rowsWant > 0,
     '담보 줄 ' + st.rowsWant + '개가 <한 줄도 안 빠지고> 섰다 (지금 ' + st.rowsGot + '줄) — 묶는 건 되고, 빠지는 건 안 된다');
  is(st.got === st.deck,
     '한 장에 <한 묶음만> 선다 — ' + st.got + '장 (칸을 둘로 나눈 장 ' + st.two + '개)');
  const named = dense.filter(d => !d.nm).map(d => d.id);
  is(named.length === 0, named.length ? ('이름표(data-nm)가 없는 장 — ' + named.join(' ')) :
     '장마다 <스스로> 짧은 이름을 달고 있다 — 늘려도 목차에서 안 빠진다');
  /* 그림은 <어느 장에> 있는지까지 본다 — 총 개수만 세면 한 종류를 걷어내도 안 운다 */
  const pics = await pg.evaluate(() => ({
    cmpb: document.querySelectorAll('#app .cmpb').length,
    st8: [].slice.call(document.querySelectorAll('#app .show > section'))
      .filter(function (s) { return /^s8_/.test(s.id) && s.querySelector('.cmpb'); }).length,
    pbars: document.querySelectorAll('#app .pbars').length,
    nfill: document.querySelectorAll('#app .nfill').length,
    svg: document.querySelectorAll('#app svg').length
  }));
  is(pics.st8 >= 1 && pics.cmpb >= 1, '담보표 장 ' + pics.st8 + '개에 <표준 대비 막대>가 서 있다');
  is(pics.pbars >= 1, '보험료 장에 <길이로 견주는 막대>가 있다');
  /* 막대 옆 금액이 <b>카드 밖으로 밀려나면</b> 「30,731,600원」이
     「30,731,6」 으로 잘려 보인다 — 고객에게는 그 값이 <b>없는 것</b>이 된다.
     여섯 줄이 <b>같은 폭</b>의 막대 자리를 쓰는지도 같이 본다. 줄마다 다르면
     길이를 서로 견줄 수 없어 막대가 <b>거짓말</b>을 한다. */
  const pb = await pg.evaluate(() => {
    var sec = document.getElementById('s2'); if (!sec) return null;
    var w = sec.className; sec.classList.add('cur');
    var card = sec.querySelector('.pbars'), R = card.getBoundingClientRect().right;
    /* 글자가 <b>칸 밖으로 넘쳐도</b> 칸 자체는 안에 있을 수 있다. 칸이 아니라
       <b>글자</b>를 잰다(Range) — 잘려 보이는 것은 글자이지 칸이 아니다. */
    var out = [].slice.call(card.querySelectorAll(':scope > span')).map(function (s) {
      var g = document.createRange(); g.selectNodeContents(s);
      return { t: (s.textContent || '').trim(), over: Math.round(g.getBoundingClientRect().right - R) };
    });
    var tw = [].slice.call(card.querySelectorAll('.pbg')).map(function (g) { return Math.round(g.getBoundingClientRect().width); });
    sec.className = w;
    return { out: out, tw: tw };
  });
  const cut = pb ? pb.out.filter(x => x.over > -2) : [];
  is(pb && cut.length === 0, !pb ? '보험료 장이 없다' : (cut.length ?
     ('금액이 카드 밖으로 밀려났다 — ' + cut.map(x => x.t + '(' + x.over + 'px)').join(' / ')) :
     '막대 옆 금액 ' + pb.out.length + '개가 <전부 카드 안에> 있다 — 잘려 보이면 없는 값이 된다'));
  is(pb && pb.tw.length > 1 && pb.tw.every(w => w === pb.tw[0]),
     pb ? ('막대 자리 ' + pb.tw.length + '줄이 <같은 폭>이다 (' + pb.tw[0] + 'px) — 달라지면 길이를 못 견준다') : '—');
  is(pics.nfill >= 3, '모자란 담보마다 <얼마나 찼는지> 막대가 있다 (' + pics.nfill + '개)');
  is(pics.svg >= 1, '직접 그린 그림(SVG)이 ' + pics.svg + '개 있다');
  /* 치료 경로 — 「암이 오면」을 <b>한 번에 끝나는 일</b>로 듣지 않게, 진단
     → 수술 → 항암 → 통원을 줄로 세우고 <b>지금 보는 자리만</b> 켠다.
     그리고 그림은 <b>직접 그린 것</b>이어야 한다 — 남의 자료 삽화를
     옮기지 않는다 (9번). 사진(<img>)이 한 장이라도 있으면 걸린다. */
  const flow = await pg.evaluate(() => {
    var secs = [].slice.call(document.querySelectorAll('#app .show > section'))
      .filter(function (s) { return /^s4_/.test(s.id) && s.querySelector('.flow'); });
    var bad = [];
    secs.forEach(function (s) {
      var all = s.querySelectorAll('.flow .fl').length;
      var on = s.querySelectorAll('.flow .fl.on').length;
      if (!all || !on || on >= all) bad.push(s.id + ' 단계' + all + '개 중 ' + on + '개 켜짐');
    });
    return { n: secs.length, bad: bad,
             steps: secs.length ? secs[0].querySelectorAll('.flow .fl').length : 0,
             img: document.querySelectorAll('#app img').length };
  });
  is(flow.n > 0 && flow.bad.length === 0,
     flow.bad.length ? ('치료 경로가 어긋난 장 — ' + flow.bad.join(' / ')) :
     '「이 병이 오면」 ' + flow.n + '장에 <치료 경로 ' + flow.steps + '단계>가 서고, 지금 보는 자리만 켜져 있다');
  is(flow.img === 0,
     '그림을 <직접 그렸다> — 남의 자료 사진(<img>)이 ' + flow.img + '장이다 (9번)');
  /* 「더 넣을 것」은 <세어서> 본다 — 옛 문구를 찾으면 문구를 바꾸는 날 알람이 죽는다 */
  const need = await pg.evaluate(() => {
    S.view = 'full'; save(); render();
    var C = calc();
    return { want: needList(C).length, got: document.querySelectorAll('#s6 .nd').length };
  });
  await pg.waitForTimeout(200);
  is(need.got === need.want && need.want > 0,
     '「더 넣을 것」이 ' + need.want + '개 <전부> 서 있다 (지금 ' + need.got + '개) — 잘라 놓으면 나머지는 없는 것이 된다');

  /* ── [11] 테마 「플러스 블루」 ──────────────────────────────────────
     사장님이 주신 발표 자료의 결로 세운다. 여기서 재는 것은 <b>화면에
     실제로 선 모양</b>이지, CSS 에 그렇게 적혀 있는지가 아니다.

     글씨체만은 <b>선언</b>을 본다 — 파일은 CDN 에서 받아 오므로, 못 받은
     자리에서 알람이 울리면 그건 <b>헛것을 잡는 점검</b>이 된다 (8번).
     못 받으면 조용히 Pretendard 로 서는 것이 <b>맞는 동작</b>이다.     */
  /* ── [10-1] 발표 중에 <b>사건을 바꿔도</b> 그 자리에 있는다 ──────────
     장 이름이 s4_cancer_0 → s4_heart_0 으로 바뀌니, 그냥 다시 그리면
     보던 장이 사라져 <b>표지로 튕긴다.</b> 고객 앞에서 탭을 눌렀더니
     표지가 떴다. 화면 가득도 그대로 유지돼야 한다.                  */
  head('[10-1] 화면 가득 발표 중에 사건 탭을 눌러도 <표지로 안 튕긴다>');
  await pg.evaluate(() => { doSample(); S.view = 'full'; S.deck = true; go('show'); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => deckShow(true));
  await pg.waitForTimeout(300);
  const simBefore = await pg.evaluate(() => {
    var L = deckList(), i;
    for (i = 0; i < L.length; i++) if (L[i].id.indexOf('s4_') === 0) { deckJump(i); return L[i].id; }
    return null;
  });
  await pg.waitForTimeout(250);
  is(!!simBefore, '「이 병이 오면」 장으로 옮겨 놓았다 — ' + simBefore);
  const tabN = await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('.simtab button')).filter(b => b.offsetParent !== null).length);
  is(tabN >= 2, '발표 중에도 사건 <탭이 보인다> (' + tabN + '개) — 안 보이면 바꿀 수가 없다');
  await pg.evaluate(() => {
    var b = [].slice.call(document.querySelectorAll('.simtab button')).filter(x => x.offsetParent !== null);
    (b[b.length - 1] || b[0]).click();
  });
  await pg.waitForTimeout(450);
  const simAfter = await pg.evaluate(() => ({
    slide: S.slide, sim: S.sim,
    shown: [].slice.call(document.querySelectorAll('#app .show > section'))
      .filter(s => s.offsetParent !== null).map(s => s.id),
    presenting: document.body.className.indexOf('presenting') >= 0,
    x: !!document.querySelector('#deckBar .dnav.x')
  }));
  is(simAfter.slide.indexOf('s4_' + simAfter.sim) === 0,
     '탭을 누르면 <그 사건의 장>이 열린다 — ' + simBefore + ' → ' + simAfter.slide);
  is(simAfter.shown.length === 1 && simAfter.shown[0] === simAfter.slide,
     '보이는 장도 그 장 하나다 — ' + simAfter.shown.join(' '));
  is(simAfter.presenting && simAfter.x, '<화면 가득>이 그대로 유지된다 — 발표가 안 끊긴다');
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);

  head('[11] 테마 — 파랑 머리띠 · 장 번호 · 오른쪽 알약, 그리고 종이에서는 걷힌다');
  await pg.evaluate(() => { doSample(); S.view = 'full'; S.deck = true; S.slide = 'sHd'; go('show'); });
  await pg.waitForTimeout(400);
  const th = await pg.evaluate(() => {
    var box = document.querySelector('#app .show');
    var L = [].slice.call(document.querySelectorAll('#app .show > section'));
    /* 내용 장 하나를 실제로 세워 잰다 — 안 보이는 장은 크기가 0 이다 */
    /* 파랑 전면은 <b>지금 보이는 장</b>에만 입는다 — 재려면 잠깐 세워야 한다 */
    function cur(el, k) { var w = el.className; el.classList.add('cur');
      var v = getComputedStyle(el)[k]; el.className = w; return v; }
    var body = L.filter(function (s) { return s.querySelector(':scope > h3'); })[0];
    var was = body.className; body.classList.add('cur');
    var h3 = body.querySelector(':scope > h3');
    var st = document.querySelector('#app .show > section.cur .st') ||
             (function () { var t = L.filter(function (s) { return s.querySelector('.st'); })[0]; return t ? t.querySelector('.st') : null; })();
    var stIn = null;
    if (st) { var sec = st.closest('section'), w2 = sec.className; sec.classList.add('cur'); stIn = st.offsetLeft; sec.className = w2; }
    var r = {
      fam: getComputedStyle(box).fontFamily,
      badge: box.getAttribute('data-badge') || '',
      badgeShown: getComputedStyle(box, '::after').content,
      bandBg: getComputedStyle(h3).backgroundColor,
      bandFg: getComputedStyle(h3).color,
      bandPic: getComputedStyle(h3).backgroundImage,
      no: L.map(function (s) { return (s.style.getPropertyValue('--no') || '').trim(); }),
      hdBg: cur(document.getElementById('sHd'), 'backgroundColor'),
      endBg: cur(document.getElementById('sEnd'), 'backgroundColor'),
      stIn: stIn, name: (S.who.name || '')
    };
    body.className = was;
    return r;
  });
  is(/^['"]?GmarketSans/.test(th.fam),
     '무대 글씨체가 <G마켓 산스>로 적혀 있다 — 「' + th.fam.split(',')[0] + '」');
  is(th.bandBg === 'rgb(11, 123, 255)' && th.bandFg === 'rgb(255, 255, 255)',
     '제목이 <파랑 머리띠> 위에 흰 글씨로 선다 — ' + th.bandBg + ' / ' + th.bandFg);
  is(th.bandPic.indexOf('svg') > 0, '머리띠 왼쪽 위에 <직접 그린 「+」> 가 있다 (남의 그림을 안 쓴다)');
  is(th.no[0] === '""' && th.no[1] === '"01."' &&
     th.no[th.no.length - 1] === '"' + String(th.no.length - 1).padStart(2, '0') + '."',
     '제목 앞 번호가 <표지는 없이 01. 부터> 붙는다 — 지금 ' + th.no.slice(0, 3).join(' ') + ' … ' + th.no[th.no.length - 1]);
  is(th.badge.indexOf(th.name) >= 0 && th.badge.indexOf('+') === 0 && th.badgeShown.indexOf(th.name) >= 0,
     '오른쪽 위 알약이 <이 고객의 자료>라고 말한다 — 「' + th.badge + '」');
  is(th.hdBg === 'rgb(11, 123, 255)' && th.endBg === 'rgb(11, 123, 255)',
     '표지와 마무리는 <파랑 전면>이다');
  is(th.stIn !== null && th.stIn >= 30,
     '담보표가 <가장자리로 벌어지지 않는다> — 안쪽 여백 ' + th.stIn + 'px (0 이면 표만 화면 끝까지 벌어진다)');
  /* 「오늘 순서」는 <b>화면에 선 장</b>에서 그린다. 손으로 적어 두면 장을
     하나 늘리는 날 순서가 어긋나고, 고객은 <b>없는 장</b>을 기다린다.
     그래서 <b>줄 수</b>와 <b>번호</b>를 장 자신과 맞대어 본다. */
  const toc2 = await pg.evaluate(() => {
    var L = [].slice.call(document.querySelectorAll('#app .show > section'));
    var a = [].slice.call(document.querySelectorAll('#deckToc a'));
    return {
      n: a.length, want: L.length - 2,
      /* 목차에 적힌 번호가 그 장이 제 이마에 달고 있는 번호와 같은가 */
      same: a.every(function (x, k) {
        var el = document.querySelector(x.getAttribute('href'));
        return el && (el.style.getPropertyValue('--no') || '').trim() ===
          '"' + x.querySelector('b').textContent + '."';
      }),
      first: a.length ? a[0].textContent : ''
    };
  });
  is(toc2.n === toc2.want && toc2.n > 0,
     '「오늘 순서」가 <선 장에서> 그려진다 — ' + toc2.n + '줄 (표지·목차 자신을 뺀 ' + toc2.want + '개)');
  is(toc2.same, '목차의 번호가 <그 장이 달고 있는 번호>와 같다 — 첫 줄 「' + toc2.first + '」');
  /* 종이에서는 <b>테마를 걷는다</b> — 파랑을 그대로 뽑으면 잉크만 먹고
     글씨는 더 안 읽힌다. 사장님이 뽑아 고객에게 드리는 것은 <b>문서</b>다. */
  /* 재는 것은 <b>지금 보이는 장</b>의 머리띠다. 표지에는 제목이 없어,
     제목이 있는 장으로 옮겨 놓고 종이 모드로 바꾼다. */
  await pg.evaluate(() => {
    var L = deckList(), i;
    for (i = 0; i < L.length; i++) if (L[i].querySelector(':scope > h3')) { deckJump(i); return; }
  });
  await pg.waitForTimeout(250);
  await pg.emulateMedia({ media: 'print' });
  await pg.waitForTimeout(250);
  const thP = await pg.evaluate(() => {
    var box = document.querySelector('#app .show');
    var h3 = document.querySelector('#app .show > section.cur > h3');
    return { bandBg: getComputedStyle(h3).backgroundColor, bandFg: getComputedStyle(h3).color,
             badge: getComputedStyle(box, '::after').display,
             endBg: (function(){ var e=document.getElementById('sEnd'),w=e.className;
               e.classList.add('cur'); var v=getComputedStyle(e).backgroundColor; e.className=w; return v; })() };
  });
  await pg.emulateMedia({ media: 'screen' });
  await pg.waitForTimeout(200);
  is(thP.bandBg === 'rgba(0, 0, 0, 0)' && thP.bandFg === 'rgb(25, 31, 40)',
     '인쇄하면 머리띠를 걷고 <검은 글씨>로 돌아온다 — ' + thP.bandBg + ' / ' + thP.bandFg);
  is(thP.badge === 'none' && thP.endBg === 'rgba(0, 0, 0, 0)',
     '인쇄에는 알약도, 파랑 전면도 안 나온다');

  head('[12] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '보여주기 슬라이드 점검 통과 — 한 장씩 넘어가고, 인쇄는 전부 나옵니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
