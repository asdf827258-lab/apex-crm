/* 발표 덱의 <b>앞뒤 두 장</b> — 첫 장이 붙잡고, 마지막 장이 갈래마다 다르게 닫는가.

   (마지막 장 검사는 [12] 에 있습니다. 브라우저를 한 번 더 띄우지 않으려고
    여기 붙였습니다 — 어차피 같은 다섯 갈래를 훑습니다.)

   ── 첫 장 ─────────────────────────────────────────────────────────
   표지 다섯 장 — <b>첫 장이 고객을 붙잡는가.</b>

   상담은 첫 장에서 갈립니다. 설계사가 화면을 돌려 보여 주는 그 3초에
   고객이 「내 얘기네」 하고 앉거나, 「또 보험 얘기구나」 하고 폰을 봅니다.

   트랙 C 표지가 그 자리를 잡아 놓았습니다. 하는 일이 넷입니다.

     ① <b>고객이 실제로 하는 말</b>을 그대로 제목에 건다 —
        「건물 하나 사서 월세 받고 싶다」. 우리 말이 아니라 그분 말이다.
     ② 그 말을 <b>다시 풀어 준다</b> — 「그 말씀의 진짜 뜻은 …」.
        그리고 <b>오늘 무엇을 할지</b>만 적는다. 결론을 미리 말하지 않는다.
     ③ 숫자 셋이 <b>말을 한다</b> — 「공실 0달 / 비어서 0원인 달이 없습니다」.
        이름표(「평균 퇴직 연령」)가 아니라 문장이다.
     ④ 그 숫자가 <b>썩지 않는다</b> — 세입자·공실·수선비는 구조라서
        내년에도 같다. 환율이나 시세는 다음 주면 틀린 말이 된다.

   나머지 네 장이 그만큼 하는지를 여기서 봅니다. 그리고 실제로 이렇게
   어긋나 있던 것들을 다시 어긋나지 못하게 막습니다.

     · coverC 는 <b>배경 규칙이 아예 없어</b> 흰 글씨가 회색 바탕에 얹혔다.
       가장 잘 쓴 표지가 <b>고객 화면에서 안 보였다.</b>
     · 제목이 h1/h2 로 섞여 있어 h2 는 `body.present h2` 가 46px 로 누르고
       h1 은 32px 로 섰다 — 같은 자리인데 화면마다 크기가 달랐다.
     · 강조 색을 표지마다 손으로 붙여 놓아 coverC 만 빠뜨렸고, 그 화면에서만
       <b>기울임체</b>로 섰다.
     · coverT 표지는 「세 가지를 보여드립니다」 라고 약속했는데 마지막 장은
       <b>「다섯 가지」</b>였다. 고객은 세 개만 듣고 끝난 줄 안다.
     · coverD 표지에 <b>「1,523원 · 17년 만의 최고」</b> 가 박혀 있었다.
       환율은 다음 주면 다른 숫자다. 게다가 그 숫자는 달러 트랙 본문에는
       없고 <b>교육자금 트랙 본문</b>에 있었다 — 표지가 자기 덱이 안 하는
       약속을 한 것이다.                                                  */
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

  console.log('\n[1] 트랙마다 표지가 발표 1번 장으로 선다');
  is(CV.length === 5, '  트랙이 다섯이다 — ' + CV.map(c => c.trk + ':' + c.id).join(' '));
  CV.forEach(c => is(c.found, '  ' + c.trk + ' 트랙 표지 ' + c.id + ' 가 있다'));

  console.log('\n[2] 다섯 장이 한 벌이다 — 모양이 화면마다 다르지 않다');
  /* h2 로 쓰면 `body.present h2` 가 46px 로 누르고, h1 은 규칙이 안 걸리면
     32px 로 선다. 같은 자리이므로 <b>태그도 하나</b>여야 한다. */
  CV.forEach(c => {
    is(c.tag === 'H1', '  ' + c.id + ' 제목이 h1 이다 — ' + (c.tag || '없음'));
    is(!!c.eyebrow, '  ' + c.id + ' 에 무슨 리포트인지 적혀 있다 — ' + c.eyebrow);
    is(c.stats.length === 3, '  ' + c.id + ' 숫자 칸이 셋이다 — ' + c.stats.length + '칸');
  });

  console.log('\n[3] 고객이 하는 말로 연다 — 우리 말이 아니라 그분 말');
  CV.forEach(c => {
    is(/[「"“].{4,}[」"”]/.test(c.head),
       '  ' + c.id + ' 제목이 고객의 말이다 — ' + c.head.slice(0, 30));
    is(c.head.length >= 10, '  ' + c.id + ' 제목이 한 마디는 된다 — ' + c.head.length + '자');
  });
  const heads = CV.map(c => c.head);
  is(new Set(heads).size === heads.length, '  다섯 장이 서로 다른 말로 연다');

  console.log('\n[4] 그 말을 다시 풀어 주고, 오늘 할 일만 적는다');
  CV.forEach(c => {
    is(c.sub.length >= 40, '  ' + c.id + ' 받는 문장이 있다 — ' + c.sub.length + '자');
    is(c.subBold >= 2, '  ' + c.id + ' 받는 문장에서 눈이 걸리는 데가 둘 이상이다 — ' + c.subBold + '군데');
  });

  console.log('\n[5] 숫자 셋이 이름표가 아니라 문장이다');
  /* 「평균 퇴직 연령」 은 이름표다. 고객은 이름표를 안 읽는다.
     「구할 사람이 없습니다」 는 말이다 — 그건 읽는다. */
  CV.forEach(c => c.stats.forEach((st, i) => {
    is(/니다|십시오/.test(st.s),
       '  ' + c.id + ' ' + (i + 1) + '번 설명이 문장이다 — ' + st.s.slice(0, 26));
    is(st.b.length > 0 && st.b.length <= 14,
       '  ' + c.id + ' ' + (i + 1) + '번 숫자가 한눈에 들어온다 — 「' + st.b + '」');
  }));

  console.log('\n[6] 표지에 박은 숫자는 그 트랙 본문이 다시 보여 준다');
  /* 표지가 자기 덱이 안 하는 약속을 하면 안 된다. 실제로 표지의 1,523원 은
     달러 트랙 본문에 없고 <b>교육자금 트랙</b>에 있었다.
     0 은 세지 않는다 — 「공실 0달」 은 자료가 아니라 구조라서 본문의 어느
     숫자와도 맞대 볼 것이 없다.                                        */
  const TOK = /[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:%|만원|억|원|배|년|세|번|달|명|칸|개|가지)/g;
  CV.forEach(c => {
    const all = c.head + ' ' + c.sub + ' ' +
                c.stats.map(s => s.b + ' ' + s.s).join(' ');
    const toks = [...new Set((all.match(TOK) || []).map(t => t.replace(/\s+/g, '')))]
                 .filter(t => parseFloat(t.replace(/,/g, '')) !== 0);
    if (!toks.length) { is(true, '  ' + c.id + ' — 맞대 볼 숫자가 없다 (구조만 적었다)'); return; }
    toks.forEach(t => is(c.body.replace(/\s+/g, '').indexOf(t) >= 0,
      '  ' + c.id + ' 의 「' + t + '」 가 본문에 다시 나온다'));
  });

  console.log('\n[7] 다음 주면 틀릴 숫자를 표지에 박지 않는다');
  /* 환율·시세·주가는 <b>내일 다른 숫자</b>다. 표지는 한 번 만들면 몇 달을
     쓰므로, 그 자리에 박으면 언젠가 고객 앞에서 틀린 말이 된다. */
  CV.forEach(c => c.stats.forEach(st => {
    const t = st.b + ' ' + st.s;
    is(!(/환율|시세|주가|코스피|고점|종가/.test(t) && /[0-9]/.test(t)),
       '  ' + c.id + ' — 「' + st.b + '」 가 환율·시세를 박아 두지 않았다');
    is(!/[0-9],[0-9]{3}\s*원(?!화)/.test(st.b),
       '  ' + c.id + ' — 「' + st.b + '」 가 원/달러 환율 꼴이 아니다');
  }));

  console.log('\n[8] 표지가 한 약속을 본문이 지킨다');
  /* 표지는 「세 가지를 보여드립니다」 였고 마지막 장은 「다섯 가지」였다.
     고객은 표지에서 센 개수로 끝을 기다린다.                          */
  /* 「한 가지」 는 개수 약속이 아니라 <b>「여럿 중 하나」</b> 라는 뜻이다 —
     coverC 의 「건물은 그 돈을 만드는 한 가지 방법일 뿐입니다」 가 그렇다.
     이걸 약속으로 세면 <b>헛것을 잡는 점검</b>이 된다. 그래서 뺀다. */
  const CNT = /(두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*가지/g;
  CV.forEach(c => {
    const said = [...new Set((c.head + ' ' + c.sub).match(CNT) || [])].map(x => x.replace(/\s+/g, ''));
    if (!said.length) { is(true, '  ' + c.id + ' — 개수를 약속하지 않았다'); return; }
    said.forEach(w => is(c.body.replace(/\s+/g, '').indexOf(w) >= 0,
      '  ' + c.id + ' 가 약속한 「' + w + '」 를 본문이 지킨다'));
  });

  console.log('\n[9] 표지에서 단정하지 않는다 — 세금도, 수익도');
  /* 표지는 요약이라 조건을 적을 자리가 없다. 그래서 <b>결론을 아예 안 적는</b>
     것이 맞다. 한도·기준액도 마찬가지 — 시행령이 바뀌면 그대로 틀린 말이 된다.
     실제로 「2,000만원 넘으면 피부양자 탈락」 이 박혀 있었다.          */
  CV.forEach(c => {
    const t = c.head + ' ' + c.sub + ' ' + c.stats.map(s => s.b + ' ' + s.s).join(' ');
    is(!/비과세 상품입니다|세금이 없습니다|세금을 안 냅니다/.test(t),
       '  ' + c.id + ' — 비과세를 단정하지 않는다');
    is(!/원금\s*보장|손실이 없습니다|무조건|반드시 오릅니다|확정 수익/.test(t),
       '  ' + c.id + ' — 수익·원금을 단정하지 않는다');
    is(!/[0-9,]+만원\s*(넘으면|이상|초과)/.test(t) && !(/탈락/.test(t) && /[0-9]/.test(t)),
       '  ' + c.id + ' — 세법·건보 기준액을 박아 두지 않는다');
  });

  console.log('\n[10] 표지마다 직접 그린 그림이 한 장 선다');
  /* 표지는 상담의 첫 3초다. 글자만 있으면 「또 보험 얘기」로 읽힌다.
     그렇다고 남의 자료 삽화를 떠 오면 <b>남의 것</b>이고, 사진은 인쇄에서
     뭉개지고 화면 크기마다 달라진다. 그래서 <b>직접 그린 SVG</b> 여야 한다 —
     viewBox 가 있으면 폰에서도 A4 에서도 같은 선으로 선다.              */
  CV.forEach(c => {
    is(c.art.length === 1, '  ' + c.id + ' 에 그림이 한 장 있다 — ' + c.art.length + '장');
    const a = c.art[0]; if (!a) return;
    is(a.svg === 1 && a.img === 0, '  ' + c.id + ' 그림이 사진이 아니라 SVG 다');
    is(!!a.vb, '  ' + c.id + ' 그림에 viewBox 가 있다 — ' + (a.vb || '없음'));
    is(!!a.label && a.label.length >= 10,
       '  ' + c.id + ' 그림에 설명이 붙어 있다 — ' + a.label.slice(0, 30));
    is(a.shapes >= 5, '  ' + c.id + ' 그림을 선으로 그렸다 — 도형 ' + a.shapes + '개');
    is(a.texts >= 2, '  ' + c.id + ' 그림 안에서 글자가 말을 한다 — ' + a.texts + '개');
  });

  console.log('\n[11] 발표를 켜면 다섯 장이 실제로 읽힌다');
  /* coverC 는 배경 규칙이 없어 <b>흰 글씨가 회색 바탕</b>에 얹혀 있었다.
     글자가 있는지만 세면 통과한다 — 그래서 <b>배경과 글자색을 같이</b> 본다. */
  const lum = c => { const m = String(c).match(/[0-9.]+/g) || [0, 0, 0];
    const f = v => { v = v / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(+m[0]) + .7152 * f(+m[1]) + .0722 * f(+m[2]); };
  for (const c of CV) {
    const r = await page.evaluate(id => {
      window.__go(Object.keys(DECK).find(k => DECK[k][0] === id));
      presEnter(); presGo(0);
      const s = document.getElementById(id), h = s.querySelector('h1,h2');
      const em = h.querySelector('em'), cs = getComputedStyle(s), hs = getComputedStyle(h);
      const out = { onOwnBg: cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)/.test(cs.backgroundColor),
                    bgc: cs.backgroundColor, size: parseFloat(hs.fontSize), color: hs.color,
                    acc: cs.getPropertyValue('--acc').trim(),
                    emStyle: em ? getComputedStyle(em).fontStyle : '',
                    emColor: em ? getComputedStyle(em).color : '',
                    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                    h: Math.round(s.getBoundingClientRect().height) };
      presExit();
      return out;
    }, c.id);
    is(r.onOwnBg, '  ' + c.id + ' 가 제 배경을 깔고 선다 — 흰 글씨가 회색 바탕에 얹히지 않는다');
    is(lum(r.color) > .5, '  ' + c.id + ' 글자는 밝은 색이다');
    is(r.size >= 46, '  ' + c.id + ' 제목이 크게 선다 — ' + r.size + 'px');
    is(!!r.acc, '  ' + c.id + ' 에 강조 색(--acc)이 정해져 있다 — ' + (r.acc || '없음'));
    is(r.emStyle === 'normal', '  ' + c.id + ' 강조 낱말이 기울임체로 서지 않는다');
    is(!!r.emColor && r.emColor !== r.color,
       '  ' + c.id + ' 강조 낱말에 색이 들어간다 — ' + r.emColor);
    is(r.h > 400, '  ' + c.id + ' 가 한 장으로 선다 — ' + r.h + 'px');
    is(r.over <= 2, '  ' + c.id + ' 가 1280px 에서 가로로 안 밀린다 — ' + r.over + 'px');
  }

  console.log('\n[12] 마지막 장이 갈래마다 다르게 닫는다');
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
    is(/니다|십시오/.test(z.line) && z.line.length >= 12,
       '  ' + z.id + ' 갈래 — 한 문장으로 닫는다: ' + z.line.slice(0, 34));
    is(!!z.cta && z.dest,
       '  ' + z.id + ' 갈래 단추가 실제 장으로 간다 — ' + z.cta + ' → ' + z.href);
  });
  /* 갈래가 늘었는데 표에 안 적으면 조용히 연금 마무리가 나온다 — 그걸 잡는다 */
  [['q', '물음'], ['line', '한 문장']].forEach(([f, nm]) => {
    const v = CLZ.map(z => z[f]);
    is(new Set(v).size === v.length, '  다섯 갈래의 ' + nm + '이 서로 다르다');
  });
  const ways = CLZ.flatMap(z => z.way.map(w => w.ti));
  is(new Set(ways).size === ways.length, '  세 걸음도 갈래마다 다르다 — ' + ways.length + '걸음');
  is(!CLZ.filter(z => z.id !== 'hero').some(z => /공무원/.test(z.lead + z.line)),
     '  연금 아닌 갈래가 공무원연금 이야기로 끝나지 않는다');

  console.log('\n[13] 폰에서도 다섯 장이 그대로 선다');
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 } });
  ph.on('pageerror', e => errs.push('phone: ' + String(e).slice(0, 120)));
  await ph.goto(base + '/' + PAGE.split('/').map(encodeURIComponent).join('/'),
                { waitUntil: 'domcontentloaded' });
  await ph.waitForTimeout(2200);
  for (const c of CV) {
    const over = await ph.evaluate(id => {
      window.__go(Object.keys(DECK).find(k => DECK[k][0] === id));
      presEnter(); presGo(0);
      const o = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      presExit();
      return o;
    }, c.id);
    is(over <= 2, '  ' + c.id + ' — 390px 에서 가로 밀림 ' + over + 'px');
  }

  console.log('\n[14] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n'
                  : '\n──────────────────────────────\n표지 점검 통과 — 다섯 장이 한 벌로 섭니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
