/* 마지막 장 — <b>갈래마다 다르게 닫는가.</b>

   다섯 갈래가 전부 <b>공무원연금 이야기</b>로 끝나고 있었습니다. 달러 상담을
   한 시간 하고 마지막 장에서 갑자기 공무원 얘기가 나오면 흐름이 거기서
   끊깁니다. 갈래를 삼항으로 이어 쓰면 늘 때 반드시 하나를 빠뜨리므로
   (실제로 쿠폰 갈래만 두 번 빠졌습니다) 내용은 CLOSING 표 한 곳에서 옵니다.

   <b>면책도 같습니다.</b> 마지막 장 아래 .notes 가 일곱 묶음을 통째로 달고
   있어서, 달러 상담에서도 공무원연금 비교 면책이 보이고 교육자금 상담에서도
   쿠폰 면책이 보였습니다. 발표 모드에서는 안 보이지만 <b>인쇄물에는 그대로
   남습니다</b> — 고객 앞에 안 꺼낸 이야기의 면책이 붙어 있으면 「이건
   뭡니까」 를 듣습니다. 공통은 화면에, 갈래 것은 CLOSING 표에서 옵니다.

   전에는 이 검사가 check-cover.js 의 [12] 에 얹혀 있었습니다 — 브라우저를
   한 번 더 안 띄우려고요. 파일 이름이 하는 일보다 좁아져서 떼어 냈습니다.

   여기서 확인합니다.
     1. 다섯 갈래가 마지막 장으로 끝나는가
     2. 물음 · 세 걸음 · 그림 · 한 문장 · 단추가 갈래마다 <b>다른가</b>
     3. 그림에 <b>금액을 적어 약속하지 않는가</b>
     4. 면책이 <b>공통 + 그 갈래 것</b>만 나가는가 — 남의 갈래 것이 안 붙는가
     5. <b>공통 칸에</b> 갈래 면책이 흘러 있지 않은가 — 버그가 살던 자리다 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const PAGE = 'app/상담자료/통합상담_APEX.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p === '/api/market') { rs.writeHead(200, { 'Content-Type': 'application/json' });
                             rs.end(JSON.stringify({ ok: true, news: [] })); return; }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 트랙과 표지를 여기서 다시 세면 트랙이 늘 때 반드시 빠뜨린다.
   <b>DECK 이 한 곳에서 답한다</b> — 화면에서 그대로 읽어 온다. */
const readCovers = page => page.evaluate(() => Object.keys(DECK).map(k => {
  const id = DECK[k][0];
  const s = document.getElementById(id);
  const one = sel => s ? s.querySelector(sel) : null;
  const txt = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  const h = one('h1,h2'), sub = one('.sub,.p');
  const body = DECK[k].slice(1).map(i => (document.getElementById(i) || {}).textContent || '')
                              .join(' ').replace(/\s+/g, ' ');
  return {
    trk: k, id: id, found: !!s,
    tag: h ? h.tagName : '', head: txt(h), sub: txt(sub),
    subBold: s ? s.querySelectorAll('.sub b,.p b').length : 0,
    eyebrow: txt(one('.eyebrow')),
    stats: s ? [].map.call(s.querySelectorAll('.hstats div'),
      d => ({ b: txt(d.querySelector('b')), s: txt(d.querySelector('span')) })) : [],
    art: s ? [].map.call(s.querySelectorAll('.cvart'), a => ({
      svg: a.querySelectorAll('svg').length, img: a.querySelectorAll('img').length,
      vb: (a.querySelector('svg') || { getAttribute: () => '' }).getAttribute('viewBox') || '',
      label: (a.querySelector('svg') || { getAttribute: () => '' }).getAttribute('aria-label') || '',
      shapes: a.querySelectorAll('svg path,svg line,svg circle,svg rect,svg polyline').length,
      texts: a.querySelectorAll('svg text').length })) : [],
    body: body
  };
}));

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto(base + '/' + PAGE.split('/').map(encodeURIComponent).join('/'),
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  const CV = await readCovers(page);
  console.log('\n[1] 마지막 장이 갈래마다 다르게 닫는다');
  /* 다섯 갈래가 전부 <b>공무원연금 이야기</b>로 끝나고 있었습니다. 달러
     상담을 한 시간 하고 마지막 장에서 갑자기 공무원 얘기가 나오면 흐름이
     거기서 끊깁니다. 갈래를 삼항으로 이어 쓰면 늘 때 반드시 하나를
     빠뜨리므로(실제로 쿠폰 갈래만 두 번 빠졌습니다) 표 하나에서 옵니다 —
     여기서는 <b>다섯이 실제로 다른 말을 하는지</b> 봅니다.            */
  const CLZ = [];
  for (const c of CV) {
    CLZ.push(await page.evaluate(id => {
      window.__go(Object.keys(DECK).find(k => DECK[k][0] === id));
      const t = i => { const e = document.getElementById(i);
                       return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
      const cta = document.getElementById('closeCta');
      return { id: id, q: t('closeQ'), lead: t('closeLead'), line: t('closeLine'),
               scene: t('closeScene'),
               way: [].map.call(document.querySelectorAll('#closeWay .st'), e => ({
                 ti: (e.querySelector('.ti') || {}).textContent || '',
                 de: (e.querySelector('.de') || {}).textContent || '' })),
               cta: cta ? cta.textContent.trim() : '',
               href: cta ? (cta.getAttribute('href') || '') : '',
               dest: cta ? !!document.querySelector(cta.getAttribute('href') || '#none') : false,
               last: DECK[Object.keys(DECK).find(k => DECK[k][0] === id)].slice(-1)[0] };
    }, c.id));
  }
  CLZ.forEach(z => {
    is(z.last === 'close', '  ' + z.id + ' 갈래가 마지막 장으로 끝난다 — ' + z.last);
    is(z.q.length >= 10, '  ' + z.id + ' 갈래 마지막 물음이 있다 — ' + z.q.slice(0, 30));
    is(z.lead.length >= 30, '  ' + z.id + ' 갈래 — 여기까지 온 이야기를 받아 준다');
    is(z.way.length === 3, '  ' + z.id + ' 갈래 — 다음에 할 일이 세 걸음이다 (' + z.way.length + ')');
    is(z.way.every(w => w.ti && w.de.length >= 10),
       '  ' + z.id + ' 갈래 — 세 걸음마다 무엇을 하는지 적혀 있다');
    /* 할 일만 적어 놓으면 숙제처럼 읽힙니다. 그 걸음을 밟으면 <b>어떤 날이
       오는지</b>까지 그려 줘야 고객이 그 자리에 자기를 앉혀 보십니다. */
    is(z.scene.length >= 40, '  ' + z.id + ' 갈래 — 그 뒤에 오는 날을 그려 준다');
    /* 다만 그 그림에 <b>금액을 적으면 그건 약속</b>이 되고, 약속은 못 지킵니다.
       미래는 말로만 그립니다 — 숫자는 계산기가 그 사람 조건으로 냅니다. */
    is(!/[0-9][0-9,]*\s*(만원|억원|억|원|%)/.test(z.scene.replace(/(^|[^0-9])0\s*원/g, '$1')),
       '  ' + z.id + ' 갈래 — 그림에 금액을 적어 약속하지 않는다');
    is(/니다|십시오/.test(z.line) && z.line.length >= 12,
       '  ' + z.id + ' 갈래 — 한 문장으로 닫는다: ' + z.line.slice(0, 34));
    is(!!z.cta && z.dest,
       '  ' + z.id + ' 갈래 단추가 실제 장으로 간다 — ' + z.cta + ' → ' + z.href);
  });
  /* 갈래가 늘었는데 표에 안 적으면 조용히 연금 마무리가 나온다 — 그걸 잡는다 */
  [['q', '물음'], ['line', '한 문장'], ['scene', '그림']].forEach(([f, nm]) => {
    const v = CLZ.map(z => z[f]);
    is(new Set(v).size === v.length, '  다섯 갈래의 ' + nm + '이 서로 다르다');
  });
  const ways = CLZ.flatMap(z => z.way.map(w => w.ti));
  is(new Set(ways).size === ways.length, '  세 걸음도 갈래마다 다르다 — ' + ways.length + '걸음');
  is(!CLZ.filter(z => z.id !== 'hero').some(z => /공무원/.test(z.lead + z.line)),
     '  연금 아닌 갈래가 공무원연금 이야기로 끝나지 않는다');

  console.log('\n[2] 면책이 공통 + 그 갈래 것만 나간다');
  /* 법적 문구라 <b>글자는 손대지 않습니다</b> — 어디에 붙느냐만 가릅니다. */
  const NT = [];
  for (const k of await page.evaluate(() => Object.keys(DECK))) {
    NT.push(await page.evaluate(async (kk) => {
      window.__go(kk); await new Promise(r => setTimeout(r, 220));
      const box = document.getElementById('closeNotes');
      const all = document.querySelector('.notes');
      /* 상자 <b>바깥</b> — 갈래가 바뀌어도 그대로 남는 공통 칸이다.
         버그는 늘 여기에 있었으므로 여기를 재지 않으면 못 본다. */
      let outside = '';
      if (all) { const c = all.cloneNode(true);
                 const b = c.querySelector('#closeNotes'); if (b) b.remove();
                 outside = c.textContent.replace(/\s+/g, ' '); }
      return { trk: kk,
        heads: box ? [].map.call(box.querySelectorAll(':scope > b'), b => b.textContent.replace(/\s+/g,' ').trim()) : null,
        txt: box ? box.textContent.replace(/\s+/g, ' ') : '',
        outside: outside,
        common: /반드시 확인해 주십시오/.test(outside),
        items: box ? box.querySelectorAll('li').length : 0 };
    }, k));
  }
  is(NT.every(n => n.common), '  공통 면책은 어느 갈래에서나 그대로 나간다');
  is(NT.every(n => n.heads && n.heads.length >= 1 && n.items >= 3),
     '  갈래마다 자기 면책이 붙는다 — ' + NT.map(n => n.trk + ':' + n.items + '줄').join(' · '));
  /* 남의 갈래 면책이 붙어 있으면 인쇄물에서 「이건 뭡니까」 를 듣는다 */
  const MARK = { w: '갈래 A', d: '갈래 B', t: '갈래 C', e: '갈래 D', c: '갈래 E' };
  NT.forEach(n => {
    const mine = MARK[n.trk];
    const others = Object.keys(MARK).filter(k => k !== n.trk).map(k => MARK[k]);
    is(n.txt.indexOf(mine) >= 0, '  ' + n.trk + ' 갈래 — 자기 면책(' + mine + ')이 있다');
    const stray = others.filter(o => n.txt.indexOf(o) >= 0);
    is(stray.length === 0, '  ' + n.trk + ' 갈래 — 남의 갈래 면책이 안 붙는다'
       + (stray.length ? ' — 붙은 것: ' + stray.join(', ') : ''));
  });
  /* 공무원연금 비교는 연금 갈래에서만 꺼낸 이야기다 */
  const gong = NT.filter(n => /공무원연금 비교/.test(n.txt)).map(n => n.trk);
  is(gong.length === 1 && gong[0] === 'w',
     '  공무원연금 비교 면책은 연금 갈래에만 붙는다 — ' + (gong.join(', ') || '아무 데도 없음'));
  /* <b>버그가 살던 자리.</b> 일곱 묶음이 공통 칸에 통째로 있어서 달러 상담에도
     공무원 면책이 따라 나갔다. 상자 안만 재면 이것이 조용히 되살아난다 —
     되돌려 보고 확인했다. */
  const SPILL = ['갈래 A', '갈래 B', '갈래 C', '갈래 D', '갈래 E', '공무원연금 비교'];
  const spilt = SPILL.filter(w => NT.some(n => n.outside.indexOf(w) >= 0));
  is(spilt.length === 0, '  공통 칸에 갈래 면책이 흘러 있지 않다'
     + (spilt.length ? ' — 흘러 있는 것: ' + spilt.join(', ') : ''));
  /* 갈래가 늘었는데 표에 안 적으면 조용히 빈칸이 나간다 */
  is(!NT.some(n => /아직 없습니다/.test(n.txt)),
     '  면책을 안 적어 둔 갈래가 없다');

  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n마지막 장 점검 통과 — 갈래마다 다르게 닫고, 면책도 갈래 것만 나갑니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
