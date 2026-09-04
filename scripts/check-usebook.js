/* <b>사용 가이드북</b> — 보고 따라만 해도 되는가.

   <b>앱과 따로 관리하는 문서입니다</b> — <code>가이드북/사용가이드북.html</code>.
   앱의 메뉴에 걸지 않습니다.

   ── 이 점검의 핵심 ────────────────────────────────────────────

   매뉴얼이 죽는 방식은 하나입니다. <b>없는 버튼을 설명하는 것.</b>
   화면이 바뀌었는데 책은 그대로라, 신입이 <b>없는 것을 찾아 헤맵니다.</b>
   실제로 그런 일이 있었습니다 — 가이드에 「AI 부서 보고」 단추가 남아
   있었는데 그 화면은 오래전에 사라져 있었습니다.

   그래서 이 책은 「화면에 있는 글자」를 <b>회색 딱지(.ui)</b> 로만 적고,
   여기서 그 딱지를 <b>전부 뽑아 앱 소스와 맞춰 봅니다.</b> 딱지 하나가
   앱에 없으면 빨간불입니다. 책이 스스로 자기 주장을 증명하는 셈입니다.

   딱지에서 앞의 그림글자(📲 · 🖨 · ← 같은 것)는 떼고 <b>글자만</b> 봅니다 —
   앱은 그림글자와 글자를 다른 칸에 나눠 그리기 때문에, 붙여서 찾으면
   멀쩡한 단추도 없다고 웁니다 (헛것을 잡는 점검은 안 잡는 것보다 나쁘다, 8번).

   ── 그 밖에 확인하는 것 ───────────────────────────────────────

     1. <b>혼자 선다</b> — 밖에서 아무것도 안 불러온다.
     2. <b>읽히는가</b> — 굵은 글씨 12% 이하 · 본문 한 줄 45자 이하.
     3. <b>따라 할 수 있는가</b> — 걸음(.step)이 충분히 있고, 걸음마다
        <b>「이러면 맞습니다」(.seen)</b> 가 붙어 있다. 확인하는 줄이 없으면
        따라 하다 어디서 틀렸는지 모릅니다.
     4. <b>딱지가 앱에 실제로 있다</b> (위 핵심)
     5. <b>개수를 손으로 안 적는다</b> — 「갈래 열네 칸」 같은 숫자를 책이
        직접 말하지 않는다. 칸이 늘면 이 책만 옛날 숫자를 말하게 된다.
     6. tnum 을 인쇄에 안 켰다 (4-1) · 그림은 직접 SVG (9번) ·
        견본은 홍길동 (3번)
     7. 준법 문구가 빠지지 않았다
     8. 인쇄에서 안 잘린다 · 콘솔이 조용하다                          */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const BOOK = path.join(ROOT, '가이드북', '사용가이드북.html');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

/* 딱지가 앱 글자가 아닌 것들 — 짝이 되는 책 이름, 키보드 키, 홑기호.
   <b>목록을 늘릴 때는 조심합니다.</b> 여기 적으면 그 딱지는 다시는
   확인받지 않습니다. 진짜 앱 글자를 여기 넣으면 점검이 눈을 감습니다. */
const NOT_APP = ['영업 가이드북', 'Ctrl', 'Enter', 'AIza'];

(async () => {
  console.log('사용 가이드북 — 보고 따라만 해도 되는가');

  const BK = fs.readFileSync(BOOK, 'utf8');
  const BODY = BK.slice(BK.indexOf('<body>'));
  const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

  sec('[1] 혼자 서는가 — 밖에서 아무것도 안 불러오는가');
  const outside = BK.match(/https?:\/\/[^\s"'<)]+/g) || [];
  is(outside.length === 0,
     '바깥 주소를 <b>불러오지 않는다</b> — 옮기거나 메일로 보내도 그대로 열린다' +
     (outside.length ? ' ← ' + outside.slice(0, 3).join(' ') : ''));
  is((BK.match(/<img[^>]*>/g) || []).length === 0, '밖에서 <b>이미지를 끌어오지 않는다</b>');

  sec('[2] 읽히는가');
  const allN = plain(BODY).replace(/\s+/g, '').length;
  const boldN = plain((BODY.match(/<b>[\s\S]*?<\/b>/g) || []).join('')).replace(/\s+/g, '').length;
  const pct = allN ? Math.round(boldN / allN * 1000) / 10 : 0;
  is(pct <= 12, '굵은 글씨가 <b>' + pct + '%</b> — 열두 자에 한 자를 넘지 않는다');
  is(allN > 8000, '글이 실려 있다 — ' + allN + '자');

  sec('[3] 따라 할 수 있는가 — 걸음마다 확인하는 줄이 있는가');
  const steps = (BODY.match(/class="step"/g) || []).length;
  const seens = (BODY.match(/class="seen"/g) || []).length;
  is(steps >= 20, '걸음(.step)이 <b>' + steps + '개</b> 있다');
  is(seens >= 10,
     '<b>「이러면 맞습니다」</b>가 ' + seens + '군데 붙어 있다 — 틀린 자리를 그 자리에서 안다');
  const paths = (BODY.match(/class="path"/g) || []).length;
  is(paths >= 10, '가는 길(→ 로 이어 적은 것)이 ' + paths + '군데 있다');

  sec('[4] 딱지가 앱에 실제로 있는가 — 없는 버튼을 설명하지 않는가');
  /* 앱 글자를 모을 자리 — 화면이 여러 파일에 흩어져 있다 */
  const HAY = ['app/index.html', 'db-crm.html', 'app/ba.html', 'ta-script.html']
    .filter(f => fs.existsSync(path.join(ROOT, f)))
    .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  /* 두 벌로 본다.
       ① 소스 그대로 — 가장 엄하다
       ② 태그와 <b>글 이어붙이기 자국</b>을 걷어낸 글자만
     ②가 필요한 이유 — 앱은 한 문장 가운데를 굵게 하려고 태그를 끼우고,
     소스에서는 그것이 다시 '…' + '…' 로 쪼개져 있다. 실제 화면에는 한
     문장으로 보이는데 소스에서만 갈라져 있어, ①만 보면 <b>멀쩡한 문구를
     없다고 웁니다</b>. 실제로 「[필수] 개인정보 수집·이용과 국외 이전에
     동의합니다」 가 그 자리였습니다 (8번). */
  const hay = HAY.replace(/\s+/g, ' ');
  const hayText = HAY.replace(/<[^>]+>/g, '')
                     .replace(/['"]\s*\+\s*['"]/g, '')
                     .replace(/\s+/g, ' ');

  const chips = [];
  (BODY.match(/<span class="ui[^"]*">([\s\S]*?)<\/span>/g) || []).forEach(m => {
    const t = plain(m).replace(/\s+/g, ' ').trim();
    if (t.length >= 2 && chips.indexOf(t) < 0) chips.push(t);
  });
  /* 한 딱지를 <b>여러 모양으로</b> 찾아 본다. 앱은 그림글자와 글자를 다른
     칸에 나눠 그리므로 붙여서만 찾으면 멀쩡한 단추도 없다고 운다. 그렇다고
     아무 조각이나 맞으면 통과시키면 점검이 눈을 감는다 — 그래서 조각은
     <b>앞을 깎은 것</b>까지만 본다 (뒤는 안 깎는다). */
  const cores = (t) => {
    const out = [t];
    out.push(t.replace(/^[^\p{L}\p{N}\[(]+/u, '').trim());   /* 앞 그림글자만 뗀다 */
    const sp = t.indexOf(' ');
    if (sp > 0) out.push(t.slice(sp + 1).trim());              /* 첫 칸 뒤부터 */
    return out.filter(x => x.length >= 2);
  };
  const miss = chips.filter(t =>
    NOT_APP.indexOf(t) < 0 &&
    !cores(t).some(c => hay.indexOf(c) >= 0 || hayText.indexOf(c) >= 0));
  is(chips.length >= 25, '책이 <b>' + chips.length + '개</b>의 화면 글자를 딱지로 적었다');
  is(miss.length === 0,
     '딱지가 <b>전부 앱에 있는 글자</b>다' +
     (miss.length ? ' ← 앱에 없다: ' + miss.map(x => '「' + x + '」').join(' · ') : ''));

  sec('[5] 개수를 손으로 안 적는가 (5번)');
  const said = plain(BODY).match(/열[한두세네다섯여섯일곱여덟아홉]*\s*칸|\d+\s*개의?\s*갈래/g) || [];
  is(said.length === 0,
     '갈래 수를 <b>책이 직접 말하지 않는다</b> — 칸이 늘어도 안 틀린다' +
     (said.length ? ' ← ' + said.join(' · ') : ''));

  sec('[6] 뽑아 낸 종이 · 그림 · 견본');
  const CSS = BK.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  is((CSS.match(/font-feature-settings/g) || []).length === 0,
     'tnum 을 <b>인쇄에 켜 두지 않았다</b> — 켜면 우리 PDF 를 우리 앱이 못 읽는다 (4-1)');
  is((BK.match(/<svg/g) || []).length >= 1, '그림을 <b>직접 SVG 로</b> 그렸다 (9번)');
  is(/홍길동/.test(BK) && /홍○/.test(BK), '견본 사람이 <b>홍길동</b>이고, 가려진 이름도 보여 준다 (3번)');

  sec('[7] 준법 문구');
  [['심사 결과에 따릅니다', /심사 결과에 따릅니다/],
   ['약관', /약관/],
   ['준법감시', /준법감시/],
   ['고객 실명을 AI 에 넣지 않기', /실명[\s\S]{0,40}넣지 않/]].forEach(([nm, re]) => {
    is(re.test(BK), '  <b>' + nm + '</b>이(가) 적혀 있다');
  });

  /* ═══ 실제로 열어 본다 ═══ */
  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(B + '/' + encodeURIComponent('가이드북') + '/' +
                  encodeURIComponent('사용가이드북.html'),
                  { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);

  sec('[8] 열 장이 다 서는가 · 차례가 있는 자리를 가리키는가');
  const got = await page.evaluate(() => {
    const secs = [].slice.call(document.querySelectorAll('section[id]')).map(s => s.id);
    const links = [].slice.call(document.querySelectorAll('.toc a'))
      .map(a => (a.getAttribute('href') || '').replace('#', ''));
    return { secs, links,
             dead: links.filter(h => !document.getElementById(h)),
             empty: [].slice.call(document.querySelectorAll('section[id]'))
               .filter(s => (s.textContent || '').replace(/\s+/g, '').length < 200).map(s => s.id),
             overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'].forEach(id => {
    is(got.secs.indexOf(id) >= 0, '  ' + id + ' 장이 있다');
  });
  is(got.dead.length === 0, '  차례에 <b>죽은 링크가 없다</b> (' + got.links.length + '개)');
  is(got.empty.length === 0, '  <b>빈 장이 없다</b>');
  is(got.overflow <= 1, '  화면이 <b>가로로 안 넘친다</b>');

  /* 줄 길이는 <b>넓은 화면에서</b> 잰다 — 좁은 창에서 재면 창이 대신 잘라 줘서
     폭 제한을 걷어내도 알람이 안 울린다 (8번). */
  await page.setViewportSize({ width: 1680, height: 950 });
  await page.waitForTimeout(200);
  const line = await page.evaluate(() => {
    const ps = [].slice.call(document.querySelectorAll('section p'))
      .filter(el => !el.classList.contains('sub') && el.textContent.trim().length > 60);
    let worst = 0;
    ps.forEach(el => {
      const w = el.getBoundingClientRect().width;
      const f = parseFloat(getComputedStyle(el).fontSize) || 15;
      worst = Math.max(worst, Math.round(w / f));
    });
    return { worst, n: ps.length };
  });
  is(line.n > 5, '  잰 문단이 ' + line.n + '개 있다');
  is(line.worst <= 45,
     '  본문 한 줄이 <b>' + line.worst + '자</b> — 마흔다섯 자를 안 넘는다 (1680px 화면에서 잼)');
  await page.setViewportSize({ width: 1280, height: 950 });

  sec('[9] 인쇄에서 안 잘리는가');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);
  const pr = await page.evaluate(() => {
    const vis = (el) => !!el && getComputedStyle(el).display !== 'none';
    const fig = document.querySelector('figure');
    return { bar: vis(document.querySelector('.topbar')), toc: vis(document.querySelector('.toc')),
             figKeep: fig ? getComputedStyle(fig).breakInside : '',
             chars: (document.body.textContent || '').replace(/\s+/g, '').length };
  });
  is(pr.bar === false && pr.toc === false, '  위 띠와 차례가 <b>종이에 안 나온다</b>');
  is(pr.figKeep === 'avoid', '  그림이 <b>페이지 사이에서 안 쪼개진다</b>');
  is(pr.chars > 8000, '  인쇄본에도 <b>모든 장이 담긴다</b> — ' + pr.chars + '자');
  await page.emulateMedia({ media: 'screen' });

  sec('[10] 콘솔이 조용한가');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 사용 가이드북에 손볼 곳이 있습니다')
                  : '✓ 사용 가이드북이 성합니다 — 적힌 단추가 전부 앱에 있습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
