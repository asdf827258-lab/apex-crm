/* <b>「어플을 매일 사용하면서 숙지할수 있도록」</b>

   설명서를 읽어서는 안 익습니다. 「다 배우고 시작하겠다」 하면 못 씁니다.
   실제로 신입이 무너지는 자리도 여기입니다 — 화면이 아흔 개인데 어디부터
   손대야 할지 몰라 아무것도 안 하게 됩니다.

   사장님 말씀 — 「APEX마스터과정으로 <b>하나하나 자료를 만들어보면서
   따라만 하면서</b> 익숙해지도록 과정도 만들어」.

   그래서 <b>하루에 하나씩 실제로 만들어 봅니다.</b> 열넷이면 끝납니다.
   한 날에 담는 것은 셋뿐입니다 — 어디서 · 무엇을 만드나 · 다 됐는지 아는 법.

   ── 여기서 제일 위험한 것 ─────────────────────────────────────────
   <b>없는 화면으로 보내는 것</b>입니다(CLAUDE.md 1번). 신입이 1일차에서
   막히면 2일차는 없습니다. 그래서 이 점검은 열네 날의 화면 id 를 <b>TABS
   에서 하나하나 찾아</b> 봅니다. 이름도 TABS 에서 읽어야 합니다 — 여기
   다시 적어 두면 메뉴에서 이름을 고쳤을 때 이쪽만 옛 이름으로 남습니다(5번).

   그다음 위험한 것은 <b>「했다고 치는 것」</b>입니다. 그래서 날마다
   「다 됐는지 아는 법」을 눈에 보이는 것으로 적습니다.

   지키는 것
     1. 열네 날이 다 있고, 셋(어디서·만들 것·다 됐는지)이 다 적혀 있다
     2. 화면 id 가 <b>TABS 에 실제로 있다</b> · 등급으로 막혀 있지 않다
     3. 단추 이름을 <b>TABS 에서 읽는다</b> — 두 벌로 적어 두지 않는다
     4. 누르면 <b>그 화면으로 간다</b>
     5. 「다 했습니다」 가 <b>남는다</b> · 다시 누르면 풀린다
     6. <b>오늘 할 것</b>을 짚어 준다 — 열넷을 다 보고 고르라 하지 않는다
     7. 진도를 <b>서버로 보내지 않는다</b> — 남이 보면 체크만 하게 된다
     8. 메뉴와 <b>전체 지도</b>에 다 들어가 있다                            */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SRC = fs.readFileSync('app/index.html', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ');
const MAP = fs.readFileSync('app/apex-map.html', 'utf8');

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  const ct = /\.js$/.test(f) ? 'application/javascript' : 'text/html';
  rs.writeHead(200, { 'Content-Type': ct + '; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  /* 신입은 폰으로 봅니다 */
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  const R = await page.evaluate(() => {
    const O = {};
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    OS.session = { user: { id: 'u1' } };
    OS.profile = { id: 'u1', name: '홍길동', role: 'owner', active: true, plan: 'pro' };
    try { localStorage.removeItem(AM_KEY); } catch (e) {}

    O.n = AM_DAYS.length;
    O.days = AM_DAYS.map(a => a.d);
    O.missing = AM_DAYS.filter(a => !a.go || !a.t || !a.make || !a.done || !a.why).map(a => a.d);
    /* 화면이 TABS 에 정말 있나 · 등급으로 막히지 않았나 */
    const ids = []; TABS.forEach(g => (g.items || []).forEach(i => ids.push(i.id)));
    O.ghost = AM_DAYS.filter(a => ids.indexOf(a.go) < 0).map(a => a.d + '일차→' + a.go);
    O.blocked = AM_DAYS.filter(a => !osTabAllowed(a.go)).map(a => a.d + '일차→' + a.go);
    O.hasTab = ids.indexOf('apexmaster') >= 0;

    const host = document.getElementById('dynPane') || document.getElementById('main');
    host.innerHTML = renderApexMaster();
    O.cards = document.querySelectorAll('.am-d').length;
    O.now = document.querySelectorAll('.am-d.now').length;
    O.nowTx = ((document.querySelector('.am-next') || {}).textContent || '').trim();
    O.btn0 = ((document.querySelectorAll('.am-go')[0] || {}).textContent || '').trim();
    O.mk = document.querySelectorAll('.am-mk').length;
    O.ok = document.querySelectorAll('.am-ok').length;

    /* 눌렀을 때 <b>그 화면 id</b> 로 가는가.
       ⚠ lastTab 으로 보면 안 된다 — crm·bohum·apexmap 같은 iframe 화면은
       일부러 lastTab 을 안 세우고 통째로 덮는다. 앱이 맞고, 그것을 lastTab
       으로 재면 시험이 틀린 것이다. 실제로 그렇게 한 번 틀렸다. */
    const realGo = window.go; let went = [];
    window.go = function (t) { went.push(t); };
    document.querySelectorAll('.am-go').forEach(b => b.click());
    window.go = realGo;
    O.went = went;

    /* 「다 했습니다」 → 남는가 · 다시 누르면 풀리는가 */
    document.querySelectorAll('.am-ck')[0].click();
    O.on1 = document.querySelectorAll('.am-d.on').length;
    let v = {}; try { v = JSON.parse(localStorage.getItem(AM_KEY) || '{}'); } catch (e) {}
    O.saved = Object.keys(v);
    O.nowTx2 = ((document.querySelector('.am-next') || {}).textContent || '').trim();
    document.querySelectorAll('.am-ck')[0].click();
    O.on0 = document.querySelectorAll('.am-d.on').length;

    /* 다 하면 뭐라고 하나 */
    const all = {}; AM_DAYS.forEach(a => { all[a.d] = '2026-08-29'; });
    try { localStorage.setItem(AM_KEY, JSON.stringify(all)); } catch (e) {}
    amPaint();
    O.doneTx = ((document.querySelector('.am-next') || {}).textContent || '').trim();
    O.doneCls = (document.querySelector('.am-next') || {}).className || '';
    try { localStorage.removeItem(AM_KEY); } catch (e) {}
    return O;
  });

  console.log('\n[1] 열네 날이 다 있고, 한 날에 셋이 다 적혀 있다');
  is(R.n === 14, '  <b>' + R.n + '일</b>짜리 과정이다');
  is(R.cards === R.n, '  카드가 <b>날 수만큼</b> 선다 — ' + R.cards + '개');
  is(R.days.join(',') === Array.from({ length: R.n }, (_, i) => i + 1).join(','),
     '  1일차부터 <b>빠짐없이</b> 이어진다');
  is(R.missing.length === 0,
     '  날마다 <b>어디서 · 무엇을 만드나 · 다 됐는지</b> 가 다 적혀 있다' +
     (R.missing.length ? ' ← 빠진 날: ' + R.missing.join(',') : ''));
  is(R.mk === R.n && R.ok === R.n,
     '  화면에도 그 셋이 다 보인다 — 만들 것 ' + R.mk + '개 · 다 됐는지 ' + R.ok + '개');

  console.log('\n[2] 없는 화면으로 보내지 않는다 (1번)');
  is(R.ghost.length === 0,
     '  열네 날의 화면이 <b>TABS 에 다 있다</b>' +
     (R.ghost.length ? ' ← 없는 곳: ' + R.ghost.join(' · ') + ' (1일차에서 막히면 2일차는 없습니다)' : ''));
  is(R.blocked.length === 0,
     '  등급으로 <b>막힌 화면도 없다</b>' + (R.blocked.length ? ' ← ' + R.blocked.join(' · ') : ''));
  is(/막혀|문의/.test(CODE.match(/function amGo\([\s\S]*?\n\}/)?.[0] || ''),
     '  그래도 막혀 있으면 <b>말하고 안 보낸다</b> — 눌렀는데 아무 일도 안 나면 안 된다');

  console.log('\n[3] 이름을 TABS 한 곳에서 읽는다 (5번)');
  is(/navTitleOf/.test(CODE.match(/function amBodyHtml\([\s\S]*?\n\}/)?.[0] || ''),
     '  단추 이름을 <b>navTitleOf()</b> 로 읽는다 — 여기 다시 적어 두지 않는다');
  is(/→ 홈 열기/.test(R.btn0),
     '  실제로 <b>메뉴에 적힌 이름</b>이 나온다 — 「' + R.btn0 + '」');
  const AMD = (CODE.match(/var AM_DAYS=\[[\s\S]*?\n\];/) || [''])[0];
  is(!/title\s*:|name\s*:/.test(AMD),
     '  과정 표에 <b>화면 이름을 안 적어 두었다</b> — id 만 적는다');

  console.log('\n[4] 누르면 그 화면으로 간다');
  const wantGo = R.went.length;
  is(wantGo === R.n, '  단추가 <b>날마다 하나씩</b> 있다 — ' + wantGo + '개');
  is(JSON.stringify(R.went) !== JSON.stringify(new Array(R.n).fill(R.went[0])),
     '  <b>날마다 다른 화면</b>으로 간다 — 전부 같은 데로 보내지 않는다');
  is(R.went[1] === 'crm',
     '  2일차는 <b>DB 통합 CRM</b> 으로 간다 — ' + R.went[1]);
  is(R.went[R.n - 1] === 'apexmap',
     '  마지막 날은 <b>전체 지도</b>로 간다 — 막혔을 때 어디를 보는지가 마지막 수업이다');

  console.log('\n[5] 「다 했습니다」 가 남는다 · 다시 누르면 풀린다');
  is(R.on1 === 1, '  누르면 <b>그 날만</b> 완료로 바뀐다 — ' + R.on1 + '개');
  is(R.saved.length === 1 && R.saved[0] === '1', '  <b>남는다</b> — 담아 둔 날 ' + R.saved.join(','));
  is(R.on0 === 0, '  다시 누르면 <b>풀린다</b> — 잘못 눌러도 되돌릴 수 있다');

  console.log('\n[6] 오늘 할 것을 짚어 준다 — 열넷을 다 보고 고르라 하지 않는다');
  is(R.now === 1, '  <b>오늘 칸 하나</b>만 표시된다 — ' + R.now + '개');
  is(/1일차/.test(R.nowTx), '  처음에는 <b>1일차</b>를 짚는다 — 「' + R.nowTx.slice(0, 26) + '…」');
  is(/2일차/.test(R.nowTx2),
     '  하나 끝내면 <b>다음 날</b>로 넘어간다 — 「' + R.nowTx2.slice(0, 26) + '…」');
  is(/다 하셨습니다|매일 쓰시면/.test(R.doneTx) && /done/.test(R.doneCls),
     '  다 하면 <b>끝났다고 말한다</b> — 「' + R.doneTx.slice(0, 34) + '…」');

  console.log('\n[7] 진도를 서버로 안 보낸다 — 남이 보면 체크만 하게 된다');
  const AMFN = (CODE.match(/function amSet\([\s\S]*?\n\}/) || [''])[0] +
                (CODE.match(/function amDone\([\s\S]*?\n\}/) || [''])[0] +
                (CODE.match(/function amToggle\([\s\S]*?\n\}/) || [''])[0];
  is(!/osClient\(|\.from\(|fetch\(/.test(AMFN),
     '  진도는 <b>이 기기에만</b> 담는다 — 서버를 안 부른다');
  is(/이 기기에만/.test(SRC.match(/function renderApexMaster\([\s\S]*?\n\}/)?.[0] || ''),
     '  화면에도 <b>그렇게 적어 둔다</b> — 취합되는 줄 아시면 안 된다');

  console.log('\n[8] 메뉴와 전체 지도에 다 들어가 있다');
  is(R.hasTab, '  <b>메뉴(TABS)</b>에 있다');
  is(/"id": "apexmaster"/.test(MAP), '  <b>전체 지도의 갈래 나무</b>에 있다');
  is(/"apexmaster":\s*\{[\s\S]{0,200}"n":\s*"APEX 마스터 과정"/.test(MAP),
     '  전체 지도에 <b>무엇을 하는 곳인지</b>도 적혀 있다');

  console.log('\n[9] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 따라만 해서는 못 익힙니다')
                  : '✓ 하루 한 장 · 있는 화면으로만 · 진도는 이 기기에만');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
