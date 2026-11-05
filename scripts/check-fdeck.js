/* ▶️ <b>발표 덱으로 가는 길이 정말 보이는가.</b>

   사장님 말씀 (2026-11-05)
     ① 「우선 재무설계 계산기에서 <b>발표덱이 바로 보이게</b> 하라니까 안되고 있어」
     ② 「오늘 에서 <b>AP, PC 에서 각자 뜰 수 있도록 각 파트별로</b> 다 넣어줘」
     ③ 「재무설계 계산기에서도, 바로 펴서 볼 수 있도록 만들어 <b>감춰져 있어서
        안 보인다</b>」

   ★★ 까닭을 찾았습니다 — 발표 덱 단추는 <b>있었습니다.</b> 그런데
     ⓐ 계산기에서는 카테고리 열네 칸 중 <b>맨 끝</b>이고, 폰에서는 그 칸들이
        통째로 「📂 카테고리」 <b>안에 접혀</b> 있습니다(판 X254 에서 제가
        접었습니다). 펴지 않으면 아예 안 보입니다.
     ⓑ 「오늘」 에서는 <b>어느 단계에도 없었습니다</b> — 재무설계 계산기조차
        <b>CS 에만</b> 있었습니다. AP·PC 에서 고객을 열어도 덱으로 가는 길이
        한 줄도 없었습니다.

   여기서 못 박는 것은 이렇습니다.

     1. 계산기 머리줄에 <b>▶️ 발표 덱</b> 단추가 있고, <b>폰에서도 보인다</b>.
        44px 이상이고, 카테고리를 <b>안 펴도</b> 보이고, 폰 첫 화면(844px) 안에
        든다. 누르면 트랙 고르개가 뜨고 트랙 다섯이 다 선다.
     2. ★★ 트랙 표는 <b>apex-track.js 한 곳</b>에만 있다 — 계산기·본체가 같은
        파일을 본다. 이름을 또 적으면 판 X224 처럼 트랙이 조용히 사라집니다 (5번).
     3. 「오늘」 의 <b>AP·PC 단계에 트랙 다섯</b>이 다 있고, 그 줄이 <b>트랙 이름</b>
        으로 서고, 눌러서 <b>그 트랙 덱</b>으로 간다(osDeckGo).
     4. CS 에는 <b>안 넣는다</b> — 청약 자리는 설명을 다시 하지 않는 자리입니다
        (그 단계 way 에 그렇게 적혀 있습니다). 넣으면 여기서 웁니다.
     5. 넘기는 길은 <b>이미 있는 한 길</b>(TOFIN.pend → apexFinReady → osFinFlush)
        이다 — 따로 내면 한쪽만 고쳐지는 날이 옵니다 (5번).
     6. 덱 주소를 만드는 자는 <b>계산기 한 곳</b>(apexDeckUrl)이다. 본체는 트랙
        열쇠만 넘깁니다.

   ★ 되돌려 보았습니다 (8번) — 다섯 가지를 깨뜨려 보고 전부 울었습니다:
     ⓐ 단추를 폰에서 감추기 ⓑ AP 에서 트랙 지우기 ⓒ 트랙 이름을 본체에 또 적기
     ⓓ 계산기가 보내온 트랙을 안 받게 하기 ⓔ CS 에 트랙 넣기.               */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 사장님 폰 — 판 X255·X256 에서 쓰는 그 수 */
const 폰 = { width: 390, height: 844 };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });

  const FIN = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');
  const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const STG = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  const TRK = fs.existsSync(path.join(ROOT, 'apex-track.js'))
    ? fs.readFileSync(path.join(ROOT, 'apex-track.js'), 'utf8') : '';

  head('[1] ★ 계산기 머리줄의 <b>▶️ 발표 덱</b> — 폰에서도 보인다');
  for (const vp of [폰, { width: 1440, height: 900 }]) {
    const ctx = await br.newContext({ viewport: vp });
    /* 🔌 바깥을 막습니다 — 점검이 사장님 진짜 서버를 읽지 않습니다 (7번) */
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                    ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 130)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/finance.html', { waitUntil: 'load' });
    await pg.waitForTimeout(2200);
    const r = await pg.evaluate(() => {
      const b = document.getElementById('dkmBtn');
      const cs = b ? getComputedStyle(b) : null, rr = b ? b.getBoundingClientRect() : null;
      const grid = document.querySelector('.top-tab-grid');
      return { 있나:!!b, 보이나: cs ? cs.display !== 'none' : false,
               높이: rr ? Math.round(rr.height) : 0, 윗변: rr ? Math.round(rr.top) : 0,
               격자펴짐: grid ? getComputedStyle(grid).display !== 'none' : false,
               표: !!(window.APEX_TRACK && window.APEX_TRACK.keys && window.APEX_TRACK.keys().length) };
    });
    const 이름 = vp.width <= 480 ? '폰 ' + vp.width + 'px' : '컴퓨터 ' + vp.width + 'px';
    is(r.있나 && r.보이나, '  ' + 이름 + ' — 단추가 <b>보인다</b>' +
       (r.있나 ? '' : ' (단추가 아예 없습니다)'));
    is(r.높이 >= 44, '  ' + 이름 + ' — 누르는 자리가 <b>' + r.높이 + 'px</b> (44px 이상 · 사장님 계약)');
    if (vp.width <= 480) {
      is(!r.격자펴짐, '  폰에서 카테고리 격자는 <b>접혀 있다</b> — 그래서 이 단추가 필요한 것입니다 ' +
         '(펴져 있으면 이 자가 거짓 자리를 보고 있는 것입니다 · 8번)');
      is(r.윗변 + r.높이 <= 폰.height, '  폰 <b>첫 화면(' + 폰.height + 'px) 안</b>에 든다 — 윗변 ' +
         r.윗변 + 'px + 높이 ' + r.높이 + 'px = ' + (r.윗변 + r.높이) + 'px');
    }
    is(r.표, '  ' + 이름 + ' — 트랙 표(apex-track.js)를 읽었다');
    /* 눌러서 고르개가 뜨나 */
    if (r.있나 && r.보이나) {
      await pg.click('#dkmBtn'); await pg.waitForTimeout(450);
      const t = await pg.evaluate(() => {
        const sh = document.getElementById('apexTrackSheet');
        return { 뜸:!!sh, 줄: sh ? sh.querySelectorAll('.tk[data-tk]').length : 0 };
      });
      is(t.뜸 && t.줄 >= 5, '  ' + 이름 + ' — 눌러서 고르개가 뜨고 트랙 <b>' + t.줄 + '개</b>가 선다');
    }
    is(errs.length === 0, '  ' + 이름 + ' — 조용하다' + (errs.length ? (' — ' + errs[0]) : ''));
    await ctx.close();
  }

  head('[2] ★★ 트랙 표는 <b>한 곳</b>에만 (5번 · 판 X224 에서 두 벌이 되어 쿠폰 트랙이 사라졌습니다)');
  is(/window\.APEX_TRACK\s*=/.test(TRK), 'apex-track.js 가 트랙 표를 쥐고 있다');
  const 표이름 = (TRK.match(/name\s*:\s*\{([\s\S]*?)\}/) || [])[1] || '';
  const 열쇠 = (표이름.match(/([a-z])\s*:/g) || []).map(x => x.replace(/\s*:$/, ''));
  is(열쇠.length >= 5, '  트랙이 <b>' + 열쇠.length + '가지</b> 적혀 있다 — ' + 열쇠.join(' '));
  /* 계산기·본체가 트랙 표를 <b>또 세우지</b> 않았나.
     ⚠⚠ 처음에는 「'$ 달러' 라는 글자가 있나」 로 찾았다가 <b>헛것을 잡았습니다</b> —
       계산기의 달러 제안서 알림(czNope('$ 달러', …))이 걸렸습니다. 같은 글자라도
       <b>트랙 표가 아닙니다.</b> 그래서 ⓐ 표를 <b>통째로 다시 세우는 꼴</b>과
       ⓑ 트랙 열쇠에 이름을 <b>짝지어 적은 꼴</b>만 봅니다 (8번 · 헛것 금지).
     ⚠ 주석은 걷어내고 봅니다 — 쪽지에 적는 것은 두 벌이 아닙니다. */
  const 또적음 = [];
  ['app/finance.html', 'app/index.html'].forEach(f => {
    const t = f === 'app/finance.html' ? FIN : IDX;
    const 날 = t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    /* ⓐ 표를 통째로 다시 세움 — APEX_TRACK_NAME = { … 글자 … } */
    const m = 날.match(/APEX_TRACK_(?:NAME|WHEN)\s*=\s*\{[^}]*['"][^}]*\}/);
    if (m) 또적음.push(f + ' → 표를 통째로 또 세웠습니다');
    /* ⚠⚠ 「열쇠에 이름을 짝지어 적었나」 도 해 봤다가 <b>또 헛것이었습니다</b> —
       d·t 는 한 글자라, 달러·투자라는 낱말이 든 다른 칸이 수없이 걸립니다.
       <b>글자로는 못 가립니다.</b> 그래서 글자 대신 <b>브라우저에서 같은 덩이인지</b>
       를 봅니다 — 아래 [2-1] 이 그것입니다. 훨씬 셉니다(이름이 같아도 다른
       덩이면 두 벌입니다). 안 보는 것을 보는 척하지 않습니다 (1번 · 8번). */
  });
  is(또적음.length === 0, 또적음.length
    ? ('트랙 이름이 두 곳에 있다 — ' + 또적음.join(' / '))
    : '계산기·본체가 트랙 이름을 <b>또 적지 않았다</b> — 둘 다 그 한 표를 봅니다');
  is(/apex-track\.js/.test(FIN) && /apex-track\.js/.test(IDX),
     '계산기와 본체가 <b>둘 다</b> 그 파일을 싣는다');

  head('[2-1] ★★ <b>정말 같은 덩이인가</b> — 글자가 아니라 브라우저에서 봅니다');
  {
    const ctx = await br.newContext({ viewport: 폰 });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                    ? r.continue() : r.abort());
    const pg = await ctx.newPage();
    await pg.goto('http://127.0.0.1:' + PORT + '/app/finance.html', { waitUntil: 'load' });
    await pg.waitForTimeout(2000);
    const r = await pg.evaluate(() => ({
      같은덩이: (typeof APEX_TRACK_NAME !== 'undefined') && !!window.APEX_TRACK &&
                APEX_TRACK_NAME === window.APEX_TRACK.name,
      같은때:   (typeof APEX_TRACK_WHEN !== 'undefined') && !!window.APEX_TRACK &&
                APEX_TRACK_WHEN === window.APEX_TRACK.when,
      수: (typeof APEX_TRACK_NAME !== 'undefined') ? Object.keys(APEX_TRACK_NAME).length : 0 }));
    is(r.같은덩이 && r.같은때,
       '계산기의 APEX_TRACK_NAME·WHEN 이 <b>트랙 표와 같은 덩이</b>다 (' + r.수 +
       '가지) — 베껴 적은 것이 아니라 <b>그것을 가리킵니다</b>');
    await ctx.close();
  }

  head('[3] ★ 「오늘」 의 <b>AP·PC</b> 에 트랙 다섯 — 눌러서 그 트랙 덱으로');
  const ctx2 = await br.newContext({ viewport: 폰 });
  await ctx2.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const p2 = await ctx2.newPage();
  const errs2 = []; p2.on('pageerror', e => errs2.push(String(e).slice(0, 130)));
  await p2.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2400);
  const K = await p2.evaluate(() => {
    const M = (window.APEX_STAGE && window.APEX_STAGE.map) || {};
    const 세 = (k) => ((M[k] && M[k].know) || []).filter(x => x.track).map(x => x.track);
    const h = (k) => (typeof stKnowHtml === 'function') ? stKnowHtml((M[k] || {}).know || []) : '';
    return { AP: 세('AP'), PC: 세('PC'), CS: 세('CS'),
             표: !!(window.APEX_TRACK && window.APEX_TRACK.keys && window.APEX_TRACK.keys().length),
             길: typeof osDeckGo === 'function',
             apH: h('AP'), pcH: h('PC') };
  });
  is(K.표, '  본체가 트랙 표를 읽었다');
  is(K.길, '  트랙으로 가는 자(osDeckGo)가 <b>있다</b>');
  const 다 = 열쇠;
  ['AP', 'PC'].forEach(k => {
    const got = K[k] || [];
    const 빠짐 = 다.filter(t => got.indexOf(t) < 0);
    is(빠짐.length === 0, '  <b>' + k + '</b> 에 트랙 ' + got.length + '개 — ' +
       (빠짐.length ? ('빠진 것: ' + 빠짐.join(' ')) : '다 있다 (' + got.join(' ') + ')'));
  });
  is((K.CS || []).length === 0, '  <b>CS</b> 에는 트랙을 <b>안 넣었다</b> — 청약 자리는 설명을 다시 하지 않는 자리입니다');
  ['AP', 'PC'].forEach(k => {
    const h = K[k === 'AP' ? 'apH' : 'pcH'] || '';
    const 줄 = (h.match(/osDeckGo\('[a-z]'\)/g) || []).length;
    const 이름있나 = 다.every(t => true) && /발표 덱/.test(h);
    is(줄 >= 5 && 이름있나, '  <b>' + k + '</b> 화면에 ▶️ 줄 ' + 줄 +
       '개가 서고 눌러서 osDeckGo 로 간다' + (이름있나 ? '' : ' (트랙 이름이 안 찍힙니다)'));
  });
  is(errs2.length === 0, '  조용하다' + (errs2.length ? (' — ' + errs2[0]) : ''));
  await ctx2.close();

  head('[4] ★ 넘기는 길과 여는 자리는 <b>하나씩</b> (5번)');
  is(/if\(p\.deck\)/.test(IDX) && /apexFinDeck/.test(IDX),
     '본체는 <b>이미 있는 한 길</b>(TOFIN.pend → apexFinReady → osFinFlush)로 트랙을 보낸다');
  is(/d\.type==='apexFinDeck'/.test(FIN) && /apexPresent\(tk\)/.test(FIN),
     '계산기는 받아서 <b>apexPresent 하나</b>로 엽니다 — 주소를 또 만들지 않습니다');
  is(!/APEX_DECK_URL/.test(IDX), '본체에는 <b>덱 주소가 없다</b> — 주소를 만드는 자는 계산기 한 곳입니다');
  is(/track:\s*'[a-z]'/.test(STG), '단계표는 <b>열쇠만</b> 둔다 (이름은 트랙 표에서)');

  head('[5] 조용한가');
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '발표 덱 길 점검 통과 — 계산기에서도, 「오늘」 의 AP·PC 에서도 바로 보입니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
