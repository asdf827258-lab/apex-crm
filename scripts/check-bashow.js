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

  head('[10] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') :
    '보여주기 슬라이드 점검 통과 — 한 장씩 넘어가고, 인쇄는 전부 나옵니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
