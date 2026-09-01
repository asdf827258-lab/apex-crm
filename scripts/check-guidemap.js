/* <b>사용가이드와 전체지도가 앱을 따라오는가.</b>

   화면을 하나 만들면 그 화면은 <b>세 곳</b>에 실려야 합니다 —
   앱의 메뉴표(TABS) · 사용가이드의 「메뉴 지도」 · APEX 전체지도.
   그런데 새 화면을 만들 때 챙기는 것은 보통 <b>앱 하나뿐</b>입니다.

   실제로 그랬습니다. 앱에는 93칸이 있는데 전체지도는 <b>90칸</b>만 알고
   있었습니다 — 「보장분석 전&후 만들기」 · 「한장 보험료 비교」 ·
   「보험 마스터 아카데미」 셋이 지도에서 빠져 있었습니다. 지도로 길을
   찾으시는 분에게 그 셋은 <b>없는 화면</b>이었습니다.

   그리고 가이드는 <b>없어진 화면을 설명</b>하고 있었습니다. 위 띠의 갈래
   딱지를 걷어내고 ⭐ 즐겨찾기만 남겼는데, 가이드는 여전히 옛 띠 기준이라
   사장님이 <b>없는 것을 찾으시게</b> 됩니다.

   ── 여기서 지키는 것 ───────────────────────────────────────────

     1. 전체지도가 아는 화면 = 앱이 가진 화면 — <b>한 칸도 안 다르다</b>
     2. 지도가 <b>없는 화면</b>을 들고 있지 않다 (지운 화면이 남지 않는다)
     3. 가이드의 「메뉴 지도」가 <b>지금 메뉴가 어디 있는지</b>를 말한다
        — ☰ 서랍 · ⭐ 상시 고정 띠 · 「☰ 메뉴 전체」
     4. 가이드가 <b>없어진 갈래 띠</b>를 아직 설명하고 있지 않다
     5. 갈래 수를 <b>손으로 안 적는다</b> — 한 곳에서 세어 말한다 (5번)
     6. 가이드의 갈래 표에 적힌 칸이 <b>실제로 있는 화면</b>이다
     7. 홈의 <b>✅ 팀 할 일</b>을 가이드가 안다                          */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('사용가이드 · 전체지도 — 앱을 따라오는가');
  const MAP = fs.readFileSync('app/apex-map.html', 'utf8');
  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1] 전체지도가 아는 화면 = 앱이 가진 화면');
  /* 지도의 메뉴 사전을 <b>실제로 읽어</b> 본다 — 글자만 찾으면 형식이 깨져도 통과한다 */
  const i = MAP.indexOf('var DATA = {'), j = MAP.indexOf('\nvar MENU');
  let DATA = null;
  try { DATA = eval('(' + MAP.slice(i + 11, j).replace(/;\s*$/, '').trim() + ')'); } catch (e) {}
  is(!!(DATA && DATA.menu), '지도의 메뉴 사전을 <b>읽을 수 있다</b>' + (DATA ? '' : ' ← 형식이 깨졌습니다'));

  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port + '/app/';
  const browser = await chromium.launch();
  const errs = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(B, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  /* 앱이 가진 화면은 <b>앱에게 묻는다</b> — 정규식으로 소스를 긁으면
     주석에 적힌 id 까지 세어 헛수가 나온다 (8번) */
  const APP = await page.evaluate(() => {
    const out = {};
    TABS.forEach(g => (g.items || []).forEach(x => { out[x.id] = { g: g.group, t: x.title }; }));
    return out;
  });
  const appIds = Object.keys(APP);
  const mapIds = Object.keys((DATA && DATA.menu) || {});
  const onlyApp = appIds.filter(x => mapIds.indexOf(x) < 0);
  const onlyMap = mapIds.filter(x => appIds.indexOf(x) < 0);
  is(appIds.length > 80, '앱이 가진 화면을 읽었다 — ' + appIds.length + '개');
  is(onlyApp.length === 0,
     '지도가 <b>모르는 화면이 없다</b>' +
     (onlyApp.length ? ' ← ' + onlyApp.map(x => x + '(' + APP[x].t + ')').slice(0, 6).join(', ') : ''));
  is(onlyMap.length === 0,
     '지도에 <b>없는 화면이 남아 있지 않다</b>' + (onlyMap.length ? ' ← ' + onlyMap.slice(0, 6).join(', ') : ''));
  /* 이름이 비어 있으면 지도에서 <b>빈 칸</b>으로 보인다 */
  const blank = mapIds.filter(x => !((DATA.menu[x] || {}).n || '').trim());
  is(blank.length === 0, '지도의 칸마다 <b>이름이 있다</b>' + (blank.length ? ' ← ' + blank.join(', ') : ''));

  sec('[2] 가이드가 「메뉴가 어디 있는지」를 지금 화면대로 말한다');
  const G = await page.evaluate(() => {
    const html = manMap();
    const d = document.createElement('div'); d.innerHTML = html;
    const txt = d.textContent.replace(/\s+/g, ' ');
    return { txt,
             catN: (typeof manCatN === 'function') ? manCatN() : -1,
             word: (typeof manCatWord === 'function') ? manCatWord() : '',
             rows: (typeof MAN_MAP !== 'undefined') ? MAN_MAP.length : -1,
             ids: (typeof MAN_MAP !== 'undefined')
               ? MAN_MAP.reduce((a, r) => a.concat((r.chips || []).map(c => c[0])), []) : [] };
  });
  /* <b>붙어 있는 두 글자</b>로 본다. 「☰」 와 「서랍」 을 따로 찾으면
     저 아래 다른 문장의 ☰ 가 걸려, 서랍 안내를 지워도 안 울린다 (8번). */
  is(/☰\s*서랍/.test(G.txt), '  <b>☰ 서랍</b>에 갈래 전부가 있다고 말한다');
  is(/☆/.test(G.txt) && /(늘|상시)/.test(G.txt), '  위 띠는 <b>☆ 로 고른 칸이 늘</b> 떠 있다고 말한다');
  is(/메뉴 전체/.test(G.txt), '  <b>「☰ 메뉴 전체」</b> 로도 열린다고 알려 준다');
  is(/찾기/.test(G.txt), '  <b>메뉴 찾기</b>가 어디 있는지 말한다');
  /* 없어진 것을 아직 설명하고 있으면 안 된다 — 사장님이 없는 것을 찾으신다 */
  is(!/갈래를 누르면|눌러서 펴|펼침칸/.test(G.txt),
     '  <b>없어진 갈래 띠를 설명하지 않는다</b> — 옛 화면 안내가 안 남았다');

  sec('[3] 갈래 수를 손으로 안 적는다 — 한 곳에서 센다 (5번)');
  is(G.catN === G.rows && G.rows > 5, '  갈래 표(MAN_MAP)에서 <b>세어</b> 답한다 — ' + G.catN + '칸');
  is(G.word.indexOf('칸') >= 0, '  글로도 적는다 — 「' + G.word + '」');
  /* <b>실제로 화면에 나가는 글</b>을 그려서 본다. 소스를 정규식으로 긁으면
     사이에 <b> 하나만 끼어도 못 찾는다 — 실제로 그래서 안 울렸다 (8번).
     가이드 전체를 그린 뒤, 「열X 칸」 이라 적힌 것이 <b>센 값과 다르면</b>
     그 자리가 손으로 적어 둔 숫자다. */
  const NUM = await page.evaluate(() => {
    /* <b>모든 칸을 펴서</b> 본다 — 접힌 칸은 manBody() 에 안 실려, 거기
       적어 둔 숫자가 그냥 빠져나간다 */
    const d = document.createElement('div');
    d.innerHTML = manBody() + manSecs().map(function (s) { return s.fn(); }).join('');
    const txt = d.textContent.replace(/\s+/g, ' ');
    return { said: txt.match(/열[한두세네다섯여섯일곱여덟아홉]*\s*칸/g) || [],
             word: manCatWord() };
  });
  const wrong = NUM.said.filter(x => x.replace(/\s+/g, '') !== NUM.word.replace(/\s+/g, ''));
  is(NUM.said.length > 0, '  가이드가 갈래 수를 <b>글로 말한다</b> — ' + NUM.said.length + '군데');
  is(wrong.length === 0,
     '  적힌 것이 <b>센 값과 다르지 않다</b> (센 값 「' + NUM.word + '」)' +
     (wrong.length ? ' ← 손으로 적어 둔 자리: ' + wrong.slice(0, 3).join(' · ') : ''));

  sec('[4] 가이드의 갈래 표에 적힌 칸이 실제로 있는 화면이다');
  const ghost = G.ids.filter(x => appIds.indexOf(x) < 0);
  is(G.ids.length > 40, '  가이드가 ' + G.ids.length + '칸을 적어 두었다');
  is(ghost.length === 0,
     '  <b>없는 화면을 가리키는 단추가 없다</b>' + (ghost.length ? ' ← ' + ghost.slice(0, 6).join(', ') : ''));
  /* 지도에 있는데 가이드가 아예 모르는 큰 칸이 있으면 그것도 길을 잃는 자리다.
     가이드는 <b>고른 것</b>만 싣는 문서라 전부일 필요는 없지만, 새로 만든
     화면이 통째로 빠지는 것은 막는다 — 최근에 그렇게 빠졌다. */
  ['frmake', 'onecmp', 'bohum'].forEach(id => {
    is(G.ids.indexOf(id) >= 0,
       '  새로 만든 「' + ((APP[id] || {}).t || id) + '」 가 가이드에도 있다');
  });

  sec('[5] 홈의 ✅ 팀 할 일을 가이드가 안다');
  is(/팀 할 일/.test(G.txt), '  가이드가 <b>팀 할 일</b>을 말한다');
  is(/담당자/.test(G.txt), '  <b>확인은 담당자만</b>이라는 것도 적는다');

  sec('[6] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 가이드·지도가 앱을 못 따라옵니다')
                  : '✓ 가이드와 전체지도가 앱과 한 칸도 다르지 않습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
