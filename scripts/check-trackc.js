/* 트랙 C(일시납·쿠폰) — <b>부동산 이야기</b>와 <b>세금 이야기</b>가 맞는가.

   이 트랙은 상담에서 가장 위험한 두 가지를 다룬다. 부동산과 세금이다.
   둘 다 <b>틀리면 그 자리에서 무너지는</b> 주제다.

     · 부동산: 「임대소득이 종합과세된다」 「피부양자에서 빠진다」 는
       말로만 하면 흘려듣는다. 그림이 있어야 고객이 스스로 센다.
       그림은 <b>직접 그린 SVG</b> 여야 한다 — 남의 삽화를 떠 오면
       인쇄에서 뭉개지고, 무엇보다 남의 것이다.
     · 세금 뉴스: 어제 것이 오늘 틀린다. 그래서 <b>내가 문장을 만들지
       않는다.</b> 신문 RSS 에서 받아 제목·언론사·날짜·링크를 옮기고,
       못 받아 오면 <b>못 받았다고 적는다.</b>
     · 비과세: 「비과세 상품입니다」 는 결론이다. 결론을 말하면 요건
       하나가 어긋났을 때 고객 앞에서 무너진다. <b>요건</b>만 보여 준다.

   여기서 확인한다.

     1. cp1 에 <b>직접 그린 도해 세 장</b>이 서는가 — 사진이 아닌가
     2. 도해마다 <b>근거</b>가 붙어 있는가
     3. 기사를 못 받아 오면 <b>지어내지 않고</b> 그렇다고 적는가
     4. 받아 왔으면 <b>제목·언론사·날짜·링크</b>를 그대로 보여 주는가
     5. 세금·부동산이 아닌 기사는 걸러지는가
     6. cp5 가 <b>요건</b>을 세 갈래로 보여 주고 단정하지 않는가
     7. 트랙 C 일곱 장이 다 서는가                                     */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

/* 가짜 신문 — 세금 기사 둘, 상관없는 기사 하나. 견본이라 고객 이름은 안 쓴다. */
const NEWS_OK = { ok: true, news: [
  { title: '주택임대소득 신고 대상 늘어난다… 기준시가 12억 초과 2주택도 간주임대료 과세',
    link: 'https://example.test/tax-1', source: '연합뉴스 경제', date: 'Wed, 19 Aug 2026 09:12:00 +0900' },
  { title: '건강보험 피부양자 탈락 기준 손질… 소득 요건 재검토',
    link: 'https://example.test/tax-2', source: '한국경제 경제', date: 'Tue, 18 Aug 2026 15:40:00 +0900' },
  { title: '코스피 사흘째 상승 마감', link: 'https://example.test/etc-1',
    source: '연합뉴스 증권', date: 'Wed, 19 Aug 2026 11:00:00 +0900' }
]};
let NEWS_MODE = 'ok';   /* ok | empty | down */

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p === '/api/market') {
    if (NEWS_MODE === 'down') { rs.writeHead(500); rs.end('nope'); return; }
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify(NEWS_MODE === 'empty' ? { ok: true, news: [] } : NEWS_OK));
    return;
  }
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto(base + '/app/상담자료/통합상담_APEX.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => { if (window.__go) window.__go('c'); });
  await page.waitForTimeout(500);

  /* 1장은 넷으로 갈려 있다 — 전에는 한 장에 다 있어 키가 3,093px 이었고,
     발표 한 장이 네 화면이라 <b>도해를 아무도 못 찾았다.</b> */
  const CP1 = '#cp1,#cp1a,#cp1b,#cp1c';
  const FIG = CP1.split(',').map(s => s + ' .cpfig').join(',');

  console.log('\n[1] 1장 묶음에 직접 그린 도해 세 장이 선다');
  const figs = await page.$$eval(FIG, els => els.map(e => ({
    svg: e.querySelectorAll('svg').length,
    img: e.querySelectorAll('img').length,
    label: (e.querySelector('svg') || {}).getAttribute ? e.querySelector('svg').getAttribute('aria-label') : '',
    vb: (e.querySelector('svg') || {}).getAttribute ? e.querySelector('svg').getAttribute('viewBox') : '',
    texts: e.querySelectorAll('svg text').length,
    src: !!e.querySelector('.src a'),
    cap: (e.querySelector('figcaption') || {}).textContent || ''
  })));
  is(figs.length === 3, '  도해가 셋이다 — ' + figs.length + '장');
  figs.forEach((f, i) => {
    is(f.svg === 1 && f.img === 0, '  ' + (i + 1) + '번은 사진이 아니라 SVG 다');
    is(!!f.vb, '  ' + (i + 1) + '번에 viewBox 가 있다 — 폰에서도 A4 에서도 같은 비율로 선다');
    is(!!f.label, '  ' + (i + 1) + '번에 그림 설명(aria-label)이 있다');
    is(f.texts >= 5, '  ' + (i + 1) + '번 글자가 그림 안에 살아 있다 — ' + f.texts + '개');
  });
  const words = ['임대소득', '피부양자', '지역가입자', '공실', '중개보수'];
  const allTxt = await page.$$eval(CP1, els => els.map(e => e.textContent).join(' '));
  words.forEach(w => is(allTxt.indexOf(w) >= 0, '  「' + w + '」 를 말한다'));

  console.log('\n[2] 도해마다 근거를 밝힌다 — 지어낸 그림이 아니다');
  is(figs[0].src, '  ① 임대소득 도해에 근거 링크가 있다');
  is(figs[1].src, '  ② 피부양자 도해에 근거 링크가 있다');
  is(/예시/.test(figs[2].cap), '  ③ 공실 도해는 「예시」 라고 밝힌다 — 고객 숫자인 척하지 않는다');
  const SRC = CP1.split(',').map(s => s + ' .cpfig .src a').join(',');
  const hrefs = await page.$$eval(SRC, a => a.map(x => x.href));
  is(hrefs.length >= 3, '  근거 링크가 셋 이상이다 — ' + hrefs.length + '개');
  is(hrefs.every(h => /^https:/.test(h)), '  모두 https 다');
  is(hrefs.some(h => /nts\.go\.kr/.test(h)), '  국세청 안내로 이어진다');
  is(hrefs.some(h => /nhis\.or\.kr/.test(h)), '  건강보험공단 모의계산으로 이어진다');

  console.log('\n[3] 받아 온 기사는 그대로, 못 받으면 지어내지 않는다');
  const shot = async () => page.evaluate(() => ({
    n: document.querySelectorAll('#cpNewsList .ni').length,
    txt: (document.getElementById('cpNewsList') || {}).textContent || ''
  }));
  await page.evaluate(() => cpnLoad(true));
  await page.waitForTimeout(700);
  let r = await shot();
  is(r.n === 2, '  세금 기사 둘만 세운다 — ' + r.n + '건');
  is(/주택임대소득 신고 대상 늘어난다/.test(r.txt), '  제목을 그대로 옮긴다');
  is(/연합뉴스 경제/.test(r.txt), '  언론사를 그대로 옮긴다');
  is(/2026\.08\.19/.test(r.txt), '  날짜를 그대로 옮긴다');
  is(!/코스피/.test(r.txt), '  세금·부동산이 아닌 기사는 안 세운다');
  const link = await page.$eval('#cpNewsList .ni', a => a.getAttribute('href'));
  is(link === 'https://example.test/tax-1', '  링크는 기사 주소 그대로다 — ' + link);

  NEWS_MODE = 'empty';
  await page.evaluate(() => cpnLoad(true));
  await page.waitForTimeout(700);
  r = await shot();
  is(r.n === 0, '  받아 온 기사가 없으면 한 건도 안 세운다');
  is(/지어내지 않습니다/.test(r.txt), '  「지어내지 않습니다」 라고 적는다 — ' + r.txt.slice(0, 40).replace(/\s+/g, ' '));

  NEWS_MODE = 'down';
  await page.evaluate(() => cpnLoad(true));
  await page.waitForTimeout(700);
  r = await shot();
  is(r.n === 0, '  서버가 죽어도 없는 기사를 만들지 않는다');
  is(/보여 드릴 기사가 없습니다/.test(r.txt), '  없다고 말해 준다');

  console.log('\n[4] cp5 — 결론이 아니라 요건을 보여 준다');
  const cp5 = await page.evaluate(() => {
    const s = document.getElementById('cp5');
    const t = s ? s.textContent.replace(/\s+/g, ' ') : '';
    const tb = s ? s.querySelector('table.cmp.wrapcell') : null;
    return { txt: t,
             heads: tb ? [].map.call(tb.querySelectorAll('thead th'), x => x.textContent.trim()) : [],
             rows: tb ? tb.querySelectorAll('tbody tr').length : 0,
             wide: tb ? (tb.scrollWidth > (tb.parentNode.clientWidth + 2)) : true };
  });
  is(cp5.heads.length === 4, '  표에 칸이 넷이다 — ' + cp5.heads.join(' · '));
  ['일시납', '월적립식', '종신형'].forEach(k =>
    is(cp5.heads.some(h => h.indexOf(k) >= 0), '  「' + k + '」 갈래가 있다'));
  is(cp5.rows >= 7, '  요건 줄이 일곱 이상이다 — ' + cp5.rows + '줄');
  is(!cp5.wide, '  표가 화면 밖으로 밀리지 않는다 — 옆으로 끌지 않아도 다 보인다');
  is(/요건을 충족할 때|요건 충족 시|충족할 때/.test(cp5.txt), '  「요건 충족 시」 라고 조건을 붙인다');
  is(/단정하지 않습니다|단정하지 않겠습니다/.test(cp5.txt), '  단정하지 않겠다고 밝힌다');
  is(/세무 전문가와 확인/.test(cp5.txt), '  세무 전문가와 확인하라고 적는다');
  is(!/비과세 상품입니다」?\s*$/.test(cp5.txt), '  「비과세 상품입니다」 로 끝내지 않는다');
  is(/원화환산납입서비스/.test(cp5.txt), '  요건이 깨질 수 있는 경우를 먼저 말한다');


  console.log('\n[4b] 도해가 제 장 앞쪽에 선다 — 카드 밑에 묻히지 않는다');
  /* 전에는 cp1 한 장에 카드 넷 + 도해 셋이 다 들어가 키가 3,093px 이었다.
     발표 한 장이 네 화면이면 아래는 아무도 안 본다 — 실제로 도해를 못
     찾으셨다. 그래서 <b>도해가 제 장 위쪽에 오는지</b>를 잰다.        */
  const figTop = await page.evaluate(() => ['cp1a','cp1b','cp1c'].map(id => {
    const s = document.getElementById(id);
    const f = s && s.querySelector('.cpfig');
    if (!s || !f) return { id, top: -1 };
    return { id, top: Math.round(f.getBoundingClientRect().top - s.getBoundingClientRect().top) };
  }));
  figTop.forEach(t => is(t.top >= 0 && t.top < 700,
    '  ' + t.id + ' — 도해가 장 시작에서 ' + t.top + 'px 자리에 있다'));

  console.log('\n[4c] 1장 — 건물과 금융상품을 나란히 놓고, 한쪽 편만 들지 않는다');
  const rvs = await page.evaluate(() => {
    const t = document.querySelector('#cp1 .rvs');
    if (!t) return null;
    const rows = [].map.call(t.querySelectorAll('.rw'), r => ({
      k: (r.querySelector('.k') || {}).textContent || '',
      re: r.classList.contains('o')   /* o = 기회 · 부동산이 이기는 자리 */
    }));
    return { rows, txt: document.getElementById('cp1').textContent.replace(/\s+/g, ' ') };
  });
  is(!!rvs, '  대조표가 선다');
  if (rvs) {
    is(rvs.rows.length >= 10, '  맞대 놓은 줄이 열 이상이다 — ' + rvs.rows.length + '줄');
    ['비는 달', '고치는 돈', '세금', '건강보험료', '급히 현금'].forEach(k =>
      is(rvs.rows.some(r => r.k.indexOf(k) >= 0), '  「' + k + '」 줄이 있다'));
    /* 부동산이 이기는 자리를 감추면 고객이 먼저 알아본다.
       시세 상승과 레버리지는 <b>부동산 쪽에만 있는 것</b>이라 그대로 적는다. */
    is(rvs.rows.filter(r => r.re).length >= 2,
       '  부동산이 이기는 자리를 따로 표시한다 — ' + rvs.rows.filter(r => r.re).length + '줄');
    is(/값이 오르는 것/.test(rvs.txt) && /대출로 키우기/.test(rvs.txt),
       '  시세 상승·레버리지를 숨기지 않는다');
    is(/요건을 충족할 때|요건 충족 시/.test(rvs.txt), '  세금은 조건부로만 말한다');
    is(!/비과세 상품입니다/.test(rvs.txt), '  「비과세 상품입니다」 라고 단정하지 않는다');
  }

  console.log('\n[4d] 4장 — 얼마 넣고 어떻게 굴리냐가 한 장에 보인다');
  const cpm = await page.evaluate(() => {
    const g = document.getElementById('cpmGrid');
    if (!g) return null;
    const cards = [].map.call(g.querySelectorAll('.cpm'), c => ({
      head: (c.querySelector('.cpm-h b') || {}).textContent || '',
      rows: [].map.call(c.querySelectorAll('.cpm-r .e'), e => e.textContent.replace(/\s+/g, ' ').trim())
    }));
    const s = document.getElementById('cpmoney');
    return { cards, txt: s ? s.textContent.replace(/\s+/g, ' ') : '' };
  });
  is(!!cpm, '  금액 장이 선다');
  if (cpm) {
    is(cpm.cards.length === 3, '  금액이 셋이다 — ' + cpm.cards.map(c => c.head).join(' · '));
    is(cpm.cards.every(c => c.rows.length === 4),
       '  금액마다 굴리는 방법이 넷이다 — ' + (cpm.cards[0] || {}).rows);
    is(cpm.cards.every(c => c.rows.every(r => /만원|억/.test(r) && !/NaN|undefined|Infinity/.test(r))),
       '  칸마다 원화 금액이 제대로 찍힌다');
    /* 짧게 많이 받는 것과 길게 더 많이 받는 것 — 이 차이가 이 장의 전부다.
       숫자가 뒤집히면(5년형 누계가 20년형보다 크면) 표를 잘못 읽은 것이다. */
    const man = t => Number(String(t).replace(/[^0-9]/g, ''));
    const c1 = cpm.cards[0] || { rows: [] };
    is(man(c1.rows[0]) > man(c1.rows[2]), '  한 번에 받는 돈은 5년형이 크다');
    is(/받는 총액은 20년형이 큽니다/.test(cpm.txt), '  받는 총액은 20년형이 크다고 적는다');
    is(/비례 환산한 참고치/.test(cpm.txt), '  「비례 환산한 참고치」 라고 밝힌다 — 없는 표를 만들지 않는다');
    is(/제안서를 다시 뽑아/.test(cpm.txt), '  확정 금액은 제안서로 확인하라고 적는다');
  }

  console.log('\n[4e] 달러를 적은 자리에는 언제나 원화가 붙는다');
  /* 고객은 $71,000 이 얼마인지 환산하는 사이 설명을 놓친다. 그런데 자리마다
     손으로 적으면 <b>반드시 빠뜨린다</b> — 실제로 열두 자리 중 여덟 곳만
     적혀 있었다. 그래서 data-usd 만 적으면 채워지게 만들었고, 여기서 지킨다. */
  const kw = await page.evaluate(() => {
    const ns = [].slice.call(document.querySelectorAll('[data-usd]'));
    return { n: ns.length,
             filled: ns.filter(e => { const k = e.querySelector('.kw');
               return k && /[0-9].*원/.test(k.textContent); }).length,
             one: (ns[0] || {}).textContent || '' };
  });
  is(kw.n >= 8, '  달러 자리에 원화 자리표가 붙어 있다 — ' + kw.n + '곳');
  is(kw.filled === kw.n, '  그 자리가 전부 채워졌다 — ' + kw.filled + '/' + kw.n);
  const fxBefore = await page.$eval('[data-usd="71000"]', e => e.textContent);
  await page.evaluate(() => { const i = document.getElementById('cpFxIn');
    i.value = '1300'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(300);
  const fxAfter = await page.$eval('[data-usd="71000"]', e => e.textContent);
  is(fxBefore !== fxAfter, '  환율을 바꾸면 원화도 같이 따라간다 — ' +
     fxBefore.replace(/\s+/g, ' ') + ' → ' + fxAfter.replace(/\s+/g, ' '));
  await page.evaluate(() => { const i = document.getElementById('cpFxIn');
    i.value = '1484'; i.dispatchEvent(new Event('input', { bubbles: true })); });

  /* 화면만 보면 새로 적은 달러를 놓친다. 원본을 훑어 <b>자리표 없는 달러</b>가
     남아 있는지 본다. 코드와 주석은 고객이 안 보므로 걷어내고 센다.        */
  const raw = fs.readFileSync(path.join(ROOT, 'app/상담자료/통합상담_APEX.html'), 'utf8');
  const body = raw.replace(/<script[\s\S]*?<\/script>/g, '')
                  .replace(/<style[\s\S]*?<\/style>/g, '')
                  .replace(/<!--[\s\S]*?-->/g, '');
  const loose = body.replace(/<(\w+)[^>]*data-usd="[^"]*"[^>]*>[\s\S]*?<\/\1>/g, '')
                    .match(/\$[0-9][0-9,]{2,}(\.[0-9]+)?/g) || [];
  is(loose.length === 0, '  원화 없이 남은 달러가 없다' + (loose.length ? ' — ' + loose.join(' ') : ''));

  /* 표지 다섯 장은 <b>check-cover.js</b> 가 본다 — 여기서도 보면 두 곳이
     되고, 표지를 고칠 때 한쪽만 고쳐 놓게 된다. 트랙 C 표지도 그쪽이 본다. */

  console.log('\n[4g] 장 번호가 겹치거나 건너뛰지 않는다');
  /* 금액 장을 4장으로 끼워 넣었더니 계산기도 4장이라 <b>「4장」이 둘</b>이
     되었다. 고객 앞에서 「4장 보세요」 라고 하면 어느 쪽인지 모른다.
     장이 늘 때마다 손으로 다시 세면 반드시 틀리므로 여기서 센다.      */
  const chs = await page.evaluate(() => [].map.call(
    document.querySelectorAll('#trackC .ch.c'),
    e => (e.querySelector('b') || {}).textContent || ''));
  const nums = chs.map(t => parseInt(String(t).replace(/[^0-9]/g, ''), 10))
                  .filter(v => !isNaN(v));
  const uniq = [...new Set(nums)];
  is(nums.length === chs.length, '  장마다 번호가 붙어 있다 — ' + chs.join(' '));
  is(uniq.length === Math.max(...uniq),
     '  1장부터 ' + Math.max(...uniq) + '장까지 건너뛴 번호가 없다 — ' + uniq.join(','));
  /* 같은 번호가 둘 이상이어도 되는 것은 <b>1장의 ①②③</b> 뿐이다 */
  const dup = uniq.filter(v => nums.filter(x => x === v).length > 1);
  is(dup.every(v => v === 1), '  겹친 번호가 1장(①②③) 말고는 없다' +
     (dup.length ? ' — ' + dup.join(',') + '장' : ''));

  console.log('\n[5] 발표를 누르면 열두 장이 차례로 선다');
  /* 표지(.pcover)는 발표 모드에서만 보인다 — 그냥 높이를 재면 0 이다.
     그러니 <b>실제로 발표를 켜서</b> 한 장씩 넘겨 본다. 쿠폰 발표가 달러로
     새던 것도, 계산기 장에서 엉뚱한 차트를 그리던 것도 여기서 잡힌다. */
  const deck = await page.evaluate(() => {
    presEnter();
    const out = [];
    for (let i = 0; i < PRES.list.length; i++) {
      presGo(i);
      const s = PRES.list[i];
      out.push({ id: s.id, on: s.classList.contains('pon'),
                 h: Math.round(s.getBoundingClientRect().height),
                 num: (document.getElementById('pNum') || {}).textContent || '' });
    }
    presExit();
    return out;
  });
  const want = ['coverC', 'cp1', 'cp1a', 'cp1b', 'cp1c', 'cp2', 'cp3',
                'cpmoney', 'cpcalc', 'cp5', 'cp6', 'close'];
  is(deck.length === want.length,
     '  ' + want.length + '장이다 — ' + deck.length + '장 (' + deck.map(d => d.id).join(' ') + ')');
  want.forEach((id, i) => {
    const d = deck[i] || {};
    is(d.id === id && d.on && d.h > 100,
       '  ' + (i + 1) + '장 ' + id + ' — ' + (d.id === id ? (d.h + 'px') : ('엉뚱한 ' + d.id)));
  });
  is(!deck.some(d => /^(c1|c2|dcalc|e1|t1)$/.test(d.id)),
     '  달러·교육자금 장이 섞여 들어오지 않는다');

  console.log('\n[6] 폰에서 가로로 밀리지 않는다');
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 } });
  ph.on('pageerror', e => errs.push('phone: ' + String(e).slice(0, 120)));
  await ph.goto(base + '/app/상담자료/통합상담_APEX.html', { waitUntil: 'domcontentloaded' });
  await ph.waitForTimeout(2200);
  await ph.evaluate(() => { if (window.__go) window.__go('c'); });
  await ph.waitForTimeout(500);
  const over = await ph.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  is(over <= 2, '  390px 에서 가로 밀림 ' + over + 'px');

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));

  await browser.close();
  srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남\n' : '\n──────────────────────────────\n트랙 C 점검 통과 — 다 맞습니다.\n');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
