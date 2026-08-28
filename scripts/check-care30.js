/* <b>「팀원별 30일 고객관리에서 화질이 좀 깨지고」</b>

   실제로 깨져 있었습니다. 그런데 원인은 글꼴이나 그림이 아니었습니다 —
   그 표(.cc-team)의 <b>옷을 입혀 주는 함수를 이 화면이 안 불렀습니다.</b>

     cmCss()  ← .cc-team 의 모양을 넣어 준다
       고객 365일 화면에서 부른다        ✓
       팩트파인딩 화면에서 부른다        ✓
       <b>TFA 30일 고객관리에서는 안 불렀다</b>  ✗

   그래서 이 화면에서는 <b>옷을 못 입은 표</b>가 그대로 섰습니다. 칸이 안
   갈리고 숫자가 뭉개져 보입니다. CLAUDE.md 5번이 적어 둔 그 자리입니다 —
   「클래스를 넣어 주는 xxxCss() 를 쓰는 화면은 그 화면에서도 부른다」.

   고치면서 표 자체도 손봤습니다 — 칸이 일곱인데 폰에서 옆으로 밀렸습니다.
   좁은 화면에서는 <b>사람별 카드</b>로 접고, 각 줄 앞에 칸 이름을 붙입니다.

   ── 그리고 「DB통합CRM에 입력하면 접촉이 된 분들은 고객365일에 추천」 ──
   CRM 에 전화를 걸어 두고도 고객 365일에 안 올리면 <b>30일 주기에서 통째로
   빠집니다.</b> 상담까지 했는데 다시 연락할 날짜를 아무도 안 챙깁니다.
   그래서 「이분 올릴까요」 를 띄웁니다.

   여기서 지킵니다.
     1. 30일 화면이 <b>제 옷을 스스로 입는다</b> (5번)
     2. 폰에서 표가 <b>안 밀린다</b> — 카드로 접히고 칸 이름이 붙는다
     3. 숫자가 <b>자릿수 맞춰</b> 선다 · 그런데 <b>인쇄에는 안 나간다</b> (4-1)
     4. CRM 에서 <b>접촉한 분만</b> 추천한다 — 안 건 사람을 띄우지 않는다
     5. 이미 고객 365일에 있는 분은 <b>다시 안 띄운다</b>
     6. 없는 정보를 <b>만들지 않는다</b> — CRM 에 적힌 것만 옮긴다 (1번)
     7. 이름은 <b>가린 모양</b>끼리 견준다 (3번)                            */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 견본 사람은 홍길동 계열 (CLAUDE.md 3번) */
const SEED = () => {
  /* 로그인까지 세워야 한다 — 고객 365일은 로그인해야 열리는 화면이라,
     세션이 없으면 go('clients') 가 홈으로 튕긴다. 앱이 맞고 시험이 틀렸다. */
  OS.session = { user: { id: 'u1' } };
  OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
  AR.cliRows = [
    { id: 'c1', who: 'u1', name: '홍길동', man: 120, ever: true, at: '2026-08-01', days: 28 },
    { id: 'c2', who: 'u1', name: '홍길순', man: null, ever: false, at: '', days: 9999 },
    { id: 'c3', who: 'u1', name: '홍판서', man: 40, ever: true, at: '2026-06-01', days: 89 }
  ];
  AR.reco = [
    { dbId: 'd1', who: 'u1', name: '홍대장', mask: '홍○○', region: '서울', n: 3, at: '2026-08-20', res: '상담', appt: true },
    { dbId: 'd2', who: 'u1', name: '홍서방', mask: '홍○○', region: '', n: 1, at: '2026-08-10', res: '부재', appt: false }
  ];
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port + '/app/';
  const browser = await chromium.launch();
  const errs = [];

  console.log('\n[1] 30일 화면이 제 옷을 스스로 입는다 (5번)');
  /* 이것이 「화질이 깨진다」 의 정체였다. <b>화면을 그대로 열어</b> 확인한다 —
     시험에서 cmCss() 를 따로 불러 주면 앱이 안 불러도 통과한다. */
  const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  wide.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await wide.goto(B, { waitUntil: 'domcontentloaded' });
  await wide.waitForTimeout(2200);
  const W = await wide.evaluate((seedSrc) => {
    eval('(' + seedSrc + ')()');
    arCss();                                   /* 앱이 화면을 열 때 부르는 것 */
    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = ccTeamHtml();
    const tb = document.querySelector('.cc-team');
    const td = tb && tb.querySelector('tbody td:first-child');
    const num = tb && tb.querySelector('tbody td:nth-child(2)');
    return {
      table: !!tb,
      dressed: !!tb && getComputedStyle(tb).borderCollapse === 'collapse',
      stick: td ? getComputedStyle(td).position : '',
      num: num ? getComputedStyle(num).fontVariantNumeric : '',
      fs: tb ? parseFloat(getComputedStyle(tb).fontSize) : 0
    };
  }, SEED.toString());
  is(W.table, '  표가 선다');
  is(W.dressed,
     '  <b>옷을 입고 선다</b> — arCss() 가 cmCss() 를 부른다' +
     (W.dressed ? '' : ' ← 옷을 못 입은 표라 칸이 안 갈립니다'));
  is(W.stick === 'sticky',
     '  이름 칸이 <b>왼쪽에 붙어</b> 있다 — 옆으로 밀어도 누구 줄인지 보인다 (' + W.stick + ')');
  is(/tabular/.test(W.num),
     '  숫자가 <b>자릿수 맞춰</b> 선다 — ' + W.num + ' · 안 그러면 열이 어긋나 보인다');
  is(W.fs >= 13, '  글자가 <b>' + W.fs + 'px</b> 이다 — 12px 은 폰에서 뭉개진다');
  /* 부르는 자리가 코드에 정말 있는지도 본다 — 위 화면은 어쩌다 다른 데서
     불렸을 수도 있다 */
  const ARCSS = (CODE.match(/function arCss\([\s\S]*?document\.getElementById\('arCss'\)/) || [''])[0];
  is(/cmCss/.test(ARCSS),
     '  <b>arCss() 안에서</b> 부른다 — 다른 화면을 거쳐야만 옷이 입혀지면 안 된다');

  console.log('\n[2] 폰에서 표가 안 밀린다 — 카드로 접히고 칸 이름이 붙는다');
  const ph = await browser.newPage({ viewport: { width: 390, height: 850 } });
  ph.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await ph.goto(B, { waitUntil: 'domcontentloaded' });
  await ph.waitForTimeout(2200);
  const P = await ph.evaluate((seedSrc) => {
    eval('(' + seedSrc + ')()');
    arCss();
    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = ccTeamHtml();
    const tb = document.querySelector('.cc-team');
    const wrap = tb.parentElement;
    const td = tb.querySelector('tbody td[data-k]');
    return {
      disp: getComputedStyle(tb).display,
      label: getComputedStyle(td, ':before').content,
      over: wrap.scrollWidth - wrap.clientWidth,
      pageOver: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fs: parseFloat(getComputedStyle(tb).fontSize)
    };
  }, SEED.toString());
  is(P.disp === 'block', '  좁은 화면에서는 <b>카드로 접힌다</b> — display:' + P.disp);
  is(/고객/.test(P.label || ''),
     '  각 줄 앞에 <b>칸 이름</b>이 붙는다 — ' + (P.label || '(없음)') +
     ' · 머리글이 접히므로 없으면 숫자만 줄줄이 뜬다');
  is(P.over === 0, '  표가 <b>옆으로 안 밀린다</b> — ' + P.over + 'px');
  is(P.pageOver === 0, '  화면 전체도 <b>가로로 안 밀린다</b> — ' + P.pageOver + 'px');
  is(P.fs >= 13, '  폰에서 글자가 <b>' + P.fs + 'px</b>');

  console.log('\n[3] 자릿수 맞춤은 화면에만 — 인쇄에 켜면 PDF 가 숫자를 잃는다 (4-1)');
  const CSSB = (SRC.match(/'\.cc-team\{[\s\S]{0,1200}/) || [''])[0];
  const tnumLine = (SRC.match(/[^']*font-feature-settings:"tnum"[^']*cc-team[^']*/) || [''])[0] ||
                   (SRC.match(/[^']*cc-team[^']*font-feature-settings:"tnum"[^']*/) || [''])[0];
  is(/@media screen\{[^}]*cc-team[^}]*tnum/.test(SRC.replace(/\s+/g, ' ')) ||
     /@media screen[^']*cc-team[^']*tnum/.test(SRC),
     '  <b>@media screen 안에만</b> 있다 — 종이에는 안 나간다' +
     (tnumLine ? '' : ''));

  console.log('\n[4] CRM 에서 접촉한 분만 추천한다 (4·5·6·7번)');
  const R = await ph.evaluate((seedSrc) => {
    eval('(' + seedSrc + ')()');
    arCss();
    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = ccTeamHtml();
    const O = {};
    O.cards = document.querySelectorAll('.cc-rc').length;
    O.hot = document.querySelectorAll('.cc-rc.hot').length;
    O.txt = (document.querySelector('.cc-reco') || {}).textContent || '';
    /* 추천이 아예 없으면 카드를 안 세운다 — 빈 카드는 화면만 먹는다 */
    AR.reco = [];
    host.innerHTML = ccTeamHtml();
    O.none = document.querySelectorAll('.cc-rc').length;
    O.noneCard = /CRM 에서 만났는데/.test(host.textContent);
    return O;
  }, SEED.toString());
  is(R.cards === 2, '  접촉한 분 <b>' + R.cards + '명</b>이 뜬다');
  is(R.hot === 1, '  <b>상담까지 간 분</b>이 갈려 보인다 — ' + R.hot + '명');
  is(/통화 3번/.test(R.txt) && /2026-08-20/.test(R.txt),
     '  <b>언제 · 몇 번</b> 통화했는지 그대로 적는다 — CRM 에 있는 것만');
  is(R.none === 0 && !R.noneCard, '  추천할 분이 없으면 <b>카드를 안 세운다</b>');

  console.log('\n[5] 안 건 사람 · 이미 있는 사람은 안 띄운다');
  const C = await ph.evaluate(() => {
    const dbs = [
      { id: 'd1', assigned_to: 'u1', customer_name: '홍대장', region: '서울' },
      { id: 'd2', assigned_to: 'u1', customer_name: '홍서방', region: '' },
      { id: 'd3', assigned_to: 'u1', customer_name: '홍참판', region: '' }   /* 한 번도 안 걸었다 */
    ];
    const calls = [
      { db_id: 'd1', created_by: 'u1', call_at: '2026-08-20T10:00:00', result: '상담' },
      { db_id: 'd2', created_by: 'u1', call_at: '2026-08-10T10:00:00', result: '부재' }
    ];
    /* 홍대장은 이미 고객 365일에 있다 — 가린 모양으로 담겨 있다 */
    const clients = [{ id: 'c1', advisor_id: 'u1', name_masked: osMaskName('홍대장') }];
    const out = arRecoCalc(dbs, calls, clients);
    return { names: out.map(x => x.name), n: out.length,
             mask: osMaskName('홍서방'), first: out[0] || null };
  });
  is(C.names.indexOf('홍참판') < 0,
     '  <b>한 번도 안 건 사람</b>은 안 띄운다 — 추천이 아니라 잡음이 된다');
  is(C.names.indexOf('홍대장') < 0,
     '  <b>이미 고객 365일에 있는 분</b>은 안 띄운다 (가린 모양끼리 견줘서)');
  is(C.n === 1 && C.names[0] === '홍서방', '  남는 것은 <b>' + C.names.join(' · ') + '</b> 뿐이다');
  is(/○|O|\*/.test(C.mask || ''), '  이름은 <b>가린 모양</b>으로 견준다 — ' + C.mask + ' (3번)');
  const RC = (CODE.match(/function arRecoCalc\([\s\S]*?\n\}/) || [''])[0];
  is(/osMaskName/.test(RC), '  견줄 때 <b>osMaskName</b> 을 쓴다 — 실명은 서버에 없다');
  is(!/\|\|\s*'미상'|\|\|\s*'없음'|기본값/.test(RC),
     '  <b>없는 칸을 채워 넣지 않는다</b> — 빈 것은 빈 채로 넘긴다 (1번)');

  console.log('\n[6] 올리기를 누르면 CRM 에 적힌 것만 들고 간다 (1번)');
  const G = await ph.evaluate((seedSrc) => {
    eval('(' + seedSrc + ')()');
    arCss();
    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = ccTeamHtml();
    try { localStorage.removeItem('apex_cc_reco'); } catch (e) {}
    let said = ''; const t = window.toast; window.toast = function (m) { said = m; };
    document.querySelector('.cc-rc .go').click();
    window.toast = t;
    let saved = null; try { saved = JSON.parse(localStorage.getItem('apex_cc_reco') || 'null'); } catch (e) {}
    /* currentTab() 은 <b>메뉴 단추</b>에 붙은 표시를 읽는다. 여기서는 메뉴를
       안 그렸으므로 늘 'home' 이 나온다 — 앱이 틀린 게 아니라 시험이
       엉뚱한 데를 봤다. go() 가 실제로 세우는 값(lastTab)을 본다. */
    return { saved, said, tab: (typeof lastTab !== 'undefined') ? lastTab : '' };
  }, SEED.toString());
  is(G.tab === 'clients', '  <b>고객 365일</b>로 넘어간다 — 「' + G.tab + '」');
  is(!!G.saved && G.saved.name === '홍대장',
     '  이름을 <b>그대로</b> 들고 간다 — ' + ((G.saved && G.saved.name) || '(없음)'));
  is(!!G.saved && G.saved.from === 'CRM',
     '  <b>어디서 왔는지</b> 적어 둔다 — 나중에 「이 값이 어디서 왔나」 를 답할 수 있게');
  is(!!G.saved && !('man' in G.saved) && !('bd' in G.saved),
     '  CRM 에 <b>없는 값은 안 만든다</b> — 보험료·생일을 지어내지 않는다 (1번)');
  is(/홍대장/.test(G.said || ''), '  무엇을 들고 갔는지 <b>말해 준다</b>');

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 30일 고객관리가 제대로 안 섭니다')
                  : '✓ 표가 옷을 입고 · 폰에서 안 밀리고 · 만난 분을 빠뜨리지 않습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
