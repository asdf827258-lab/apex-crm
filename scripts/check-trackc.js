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

  console.log('\n[1] cp1 에 직접 그린 도해 세 장이 선다');
  const figs = await page.$$eval('#cp1 .cpfig', els => els.map(e => ({
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
  const allTxt = await page.$eval('#cp1', e => e.textContent);
  words.forEach(w => is(allTxt.indexOf(w) >= 0, '  「' + w + '」 를 말한다'));

  console.log('\n[2] 도해마다 근거를 밝힌다 — 지어낸 그림이 아니다');
  is(figs[0].src, '  ① 임대소득 도해에 근거 링크가 있다');
  is(figs[1].src, '  ② 피부양자 도해에 근거 링크가 있다');
  is(/예시/.test(figs[2].cap), '  ③ 공실 도해는 「예시」 라고 밝힌다 — 고객 숫자인 척하지 않는다');
  const hrefs = await page.$$eval('#cp1 .cpfig .src a', a => a.map(x => x.href));
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

  console.log('\n[5] 발표를 누르면 여덟 장이 차례로 선다');
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
  const want = ['coverC', 'cp1', 'cp2', 'cp3', 'cpcalc', 'cp5', 'cp6', 'close'];
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
