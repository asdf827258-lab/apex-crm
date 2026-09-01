/* <b>「고객 365일 들어가면 달력에 이번 달 할 일 · 매일 미션이 있어야 하는데
   지금은 설정에 있다」</b>

   달력과 「오늘 챙길 분」 은 <b>고객 관리</b> 이야기인데, 「내 캘린더」 라는
   이름으로 <b>시스템 메뉴</b>(설정·요금제·약관 옆)에 서 있었다. 고객을 보러
   들어온 자리에 없으면 없는 것과 같다.

   여기서 지키는 것
     1. 고객 365일을 열면 <b>오늘의 미션</b>과 <b>이번 달 달력</b>이 맨 위에 선다
     2. 미션은 30일 고객관리가 쓰는 <b>ccBand 그대로</b> 센다 — 따로 세지 않는다
     3. <b>못 세면 아무 말도 안 한다</b> — 「0명」 과 「모름」 은 다르다 (1번)
     4. 달력은 <b>한 벌</b>이다 — 세 곳에서 같은 것을 부른다 (5번)
     5. 날짜를 누르면 <b>실제로 바뀐다</b> — 서 있는 자리를 다시 그린다      */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 견본 사람은 홍길동 (CLAUDE.md 3번) */
const SEED = `
  OS.profile = { id: 'me', role: 'member', name: '윤시현' };
  OSC.view = 'list'; CM.pick = 'me'; CM.picked = true; CM.loaded = true;
  CM.who = { me: '윤시현' };
  const t = mcalToday();
  const ago = (n) => { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - n);
                       return d.toISOString().slice(0, 10); };
  OSC.list = [
    { id: 'k1', advisor_id: 'me', name_masked: '홍○동', created_at: ago(400) + 'T00:00:00Z' },
    { id: 'k2', advisor_id: 'me', name_masked: '홍○순', created_at: ago(400) + 'T00:00:00Z' },
    { id: 'k3', advisor_id: 'me', name_masked: '홍○보', created_at: ago(400) + 'T00:00:00Z' },
    { id: 'k4', advisor_id: 'me', name_masked: '홍○자', created_at: ago(400) + 'T00:00:00Z' }
  ];
  CM.meta = {};
  CC.calls = { k1: ago(90), k2: ago(80), k3: t, k4: ago(1) };
`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  console.log('\n[1] 고객이 아직 안 읽혔으면 — 아무 숫자도 안 만든다');
  const A = await page.evaluate(() => {
    OS.profile = { id: 'me', role: 'member' };
    OSC.view = 'list'; OSC.list = [];
    return { m: cliMission(), html: cliMissionHtml() };
  });
  is(A.m === null && !A.html, '  <b>「0명」 이라고 하지 않는다</b> — 칸 자체를 안 세운다 (1번)');

  console.log('\n[2] 오늘의 미션이 이름으로 뜬다');
  const B = await page.evaluate(new Function(SEED + `
    const m = cliMission(), html = cliMissionHtml();
    return { due: m.due.map(x => x.c.name_masked), done: m.done, total: m.total,
             first: m.due[0] ? m.due[0].c.name_masked : '',
             says: /오늘 챙길 분 2명/.test(html),
             name: html.indexOf('홍○동') >= 0 && html.indexOf('홍○순') >= 0,
             opens: html.indexOf("osOpenClient('k1')") >= 0,
             doneSaid: /오늘 연락한 분 <b>1명<\\/b>/.test(html) };
  `));
  is(B.due.length === 2, '  주기가 지난 분만 미션에 든다 — ' + B.due.join(' · '));
  is(B.first === '홍○동', '  <b>오래 묵은 분이 맨 위</b>로 — 지금 맨 위: ' + B.first);
  is(B.done === 1 && B.doneSaid, '  오늘 이미 연락한 분은 <b>미션에서 빠지고 따로 센다</b>');
  is(B.says && B.name && B.opens, '  화면에 이름이 뜨고 <b>누르면 그 고객 카드</b>가 열린다');

  console.log('\n[3] 다 돌았으면 그렇게 말한다 — 겁주지 않는다 (8번)');
  const C = await page.evaluate(new Function(SEED + `
    CC.calls = { k1: t, k2: t, k3: t, k4: t };
    const m = cliMission(), html = cliMissionHtml();
    return { due: m.due.length, ok: /오늘 챙길 분이 없습니다/.test(html) };
  `));
  is(C.due === 0 && C.ok, '  「오늘 챙길 분이 없습니다」 라고 말한다');

  console.log('\n[4] 이번 달 달력이 고객 365일 맨 위에 선다 — 그리고 한 벌이다');
  const D = await page.evaluate(new Function(SEED + `
    const html = renderClientsPage();
    return { top: html.indexOf('cli365Top') >= 0,
             cal: (html.match(/mcal-hd/g) || []).length,
             mission: html.indexOf('오늘의 미션') >= 0,
             order: html.indexOf('오늘의 미션') < html.indexOf('이번 달 고객 관리'),
             beforeList: html.indexOf('cli365Top') < html.indexOf('oscList'),
             phone: html.indexOf('폰 기본 달력에 넣기') >= 0 };
  `));
  is(D.top && D.cal === 1, '  달력이 <b>한 벌</b> 선다');
  is(D.mission && D.order && D.beforeList, '  미션 → 달력 → 목록 차례로, <b>목록보다 위</b>에');
  is(!D.phone, '  폰 내보내기 칸은 <b>여기 또 안 붙인다</b> — 설정 → 내 캘린더 자리다');

  console.log('\n[5] 날짜를 누르면 실제로 바뀐다');
  const E = await page.evaluate(new Function(SEED + `
    const host = document.createElement('div'); host.id = 'cli365Top';
    document.body.appendChild(host);
    cli365TopPaint();
    const before = host.innerHTML.length;
    /* MCAL.ym 은 비어 있을 수 있다 — 달을 계산해 주는 것은 mcalYm() 이다 */
    const other = mcalYm() + '-15';
    MCAL.sel = ''; mcalPick(other);
    const sel = MCAL.sel;
    const after = host.innerHTML;
    const shows = after.indexOf('15일') >= 0;
    MCAL.sel = ''; host.remove();
    return { sel, shows, before, len: after.length };
  `));
  is(E.sel, '  누른 날이 <b>골라진다</b>');
  is(E.shows, '  그리고 <b>그 자리가 다시 그려진다</b> — 그날 것이 아래에 뜬다');

  console.log('\n[6] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 어긋납니다')
                  : '✓ 고객 365일을 열면 오늘 할 일부터 보입니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
