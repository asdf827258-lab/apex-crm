/* <b>「내 소개 그 뒤에 … 우리가 어떻게 도울 수 있는지」</b>

   사장님 말씀 그대로입니다 — 「우리가 어떻게 도울수 있는지, 재무관리를
   어떻게 해주는지도 보여주고, 보험 약관비교부터, 보상에 왜 진심이고,
   손해사정사까지 고용해서 함께 일하는지도 중요해」.

   ── 여기서 제일 조심한 것 ──────────────────────────────────────────
   이 장의 글은 <b>회사가 실제로 하는 일</b>에 대한 말이고, 그대로 고객
   앞에 섭니다. 우리가 지어내면 안 됩니다. 그래서 —

     · 기본 문구는 <b>사장님이 하신 말씀만</b> 옮깁니다
     · <b>숫자·수상·자격은 한 글자도 안 넣습니다</b> (몇 명, 몇 건, 몇 년…)
     · 사장님이 고치시면 그것이 그대로 나갑니다
     · <b>빈 칸은 그 자리를 통째로 안 세웁니다</b> — 빈 상자를 안 보입니다

   <b>보험금비서</b>와 <b>재무설계 홈페이지</b> 자료는 앱 안에서 못 찾았습니다.
   그래서 그 두 칸은 <b>기본값이 없습니다</b> — 우리가 못 본 자료를 우리가
   써 줄 수는 없습니다. 사장님이 붙여 넣으시면 그때 나갑니다 (1번).

   ── 그리고 장을 하나 끼우는 일 자체가 위험합니다 ──────────────────
   상담자료에는 <b>번호로 가리키는 자리</b>가 둘 있었습니다 —
   목차(<code>HAM_SLIDES</code>)의 idx 와 <code>goTo(15)</code>. 장을 하나
   끼우면 그 뒤가 전부 한 칸씩 밀려 <b>목차가 엉뚱한 장으로</b> 갑니다.
   그래서 idx 는 줄 순서로 다시 매기고, goTo 는 <b>이름</b>으로 가게
   바꿨습니다 (CLAUDE.md 5번).

   지키는 것
     1. 소개 <b>바로 뒤</b>에 선다
     2. 앱에서 보낸 글이 <b>그대로</b> 들어간다
     3. <b>빈 칸은 안 세운다</b> · 인용은 붙여 넣으신 것만
     4. 기본 문구에 <b>숫자·수상·자격이 없다</b>
     5. 장을 끼워도 <b>목차와 단추가 안 틀어진다</b>                     */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const DECK = 'app/상담자료/메인 상담자료.html';
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const B = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch();

  /* ── 앱 쪽 ─────────────────────────────────────────────────────── */
  const app = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const aerr = [];
  app.on('pageerror', e => aerr.push(String(e).slice(0, 150)));
  await app.goto(B + 'app/index.html', { waitUntil: 'domcontentloaded' });
  await app.waitForTimeout(2200);

  console.log('\n[1] 앱이 이 장의 글을 들고 있다 — 없는 것은 안 만든다');
  const A = await app.evaluate(() => {
    try { localStorage.removeItem('apex_adv'); } catch (e) {}
    const d = (typeof advWdData === 'function') ? advWdData() : null;
    return {
      has: !!d, keys: d ? Object.keys(d).length : 0,
      kick: d && d.wdKick, title: d && d.wdTitle,
      c1: d && d.wd1t, c2: d && d.wd2t, c3: d && d.wd3t, c4: d && d.wd4t,
      d1: d && d.wd1d, d3: d && d.wd3d, d4: d && d.wd4d,
      ref1: d && d.wdRef1b, ref2: d && d.wdRef2b,
      /* <b>값만</b> 모은다. 칸 이름(wd1t…)에도 숫자가 있어 통째로 재면
         늘 빨간불이다 — 헛알람은 안 잡는 것보다 나쁘다 (8번).
         「Chapter 0」 은 장 딱지라 회사에 대한 주장이 아니다 — 뺀다. */
      claims: d ? ['wdTitle', 'wdLead', 'wd1t', 'wd1d', 'wd2t', 'wd2d',
                   'wd3t', 'wd3d', 'wd4t', 'wd4d'].map(function (k) { return d[k]; }).join(' ') : ''
    };
  });
  is(A.has && A.keys >= 16, '  글을 담는 자리가 있다 — 칸 ' + A.keys + '개');
  is(/약관/.test(A.c1 || ''), '  ① <b>약관 비교</b> — 「' + (A.c1 || '') + '」');
  is(/재무관리/.test(A.c2 || ''), '  ② <b>재무관리</b> — 「' + (A.c2 || '') + '」');
  is(/보상/.test(A.c3 || ''), '  ③ <b>보상에 진심</b> — 「' + (A.c3 || '') + '」');
  is(/손해사정사/.test(A.c4 || ''), '  ④ <b>손해사정사</b> — 「' + (A.c4 || '') + '」');
  is(A.ref1 === '' && A.ref2 === '',
     '  <b>인용 두 칸은 비어 있다</b> — 우리가 못 본 자료를 써 주지 않는다 (1번)');

  console.log('\n[2] 기본 문구에 숫자·수상·자격이 없다');
  /* 숫자를 넣으면 그 순간 <b>확인 안 된 사실</b>이 고객 앞에 선다 */
  const nums = (A.claims.match(/\d/g) || []).length;
  is(nums === 0, '  고객에게 하는 말에 <b>숫자가 한 자도 없다</b> — ' + nums + '자');
  is(!/MDRT|수상|1위|최우수|공인|자격증|명 보유|년 경력/.test(A.claims),
     '  <b>수상·자격을 지어내지 않았다</b>');

  /* ── 상담자료 쪽 ──────────────────────────────────────────────── */
  const deck = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const derr = [];
  deck.on('pageerror', e => derr.push(String(e).slice(0, 150)));
  await deck.goto(B + encodeURI('app/상담자료/메인 상담자료.html'), { waitUntil: 'domcontentloaded' });
  await deck.waitForTimeout(2600);

  console.log('\n[3] 소개 바로 뒤에 선다');
  const C = await deck.evaluate(() => {
    const ss = document.querySelectorAll('.slide');
    let at = -1, i;
    for (i = 0; i < ss.length; i++) if (ss[i].id === 's1b') at = i;
    return { at, first: ss[0] && ss[0].id, next: ss[at + 1] && ss[at + 1].id, total: ss.length };
  });
  is(C.at === 1, '  <b>표지(' + C.first + ') 바로 다음</b>이다 — ' + (C.at + 1) + '번째 장');
  is(C.next === 's2', '  그다음이 <b>Chapter 1</b> 이다 — ' + C.next);

  console.log('\n[4] 앱이 보낸 글이 그대로 들어간다 · 빈 칸은 안 세운다');
  const D = await deck.evaluate((data) => {
    wdApply(data);
    const cards = document.querySelectorAll('#wdCards .wd-card');
    const refs = document.querySelectorAll('#wdRefs .wd-ref');
    return {
      n: cards.length,
      t: document.getElementById('wdTitle').textContent.replace(/\s+/g, ' ').trim(),
      grad: !!document.querySelector('#wdTitle .gradient-text'),
      body: document.getElementById('wdCards').textContent.replace(/\s+/g, ' ').trim(),
      refN: refs.length,
      refT: document.getElementById('wdRefs').textContent.replace(/\s+/g, ' ').trim()
    };
  }, {
    wdKick: 'Chapter 0 · 우리가 하는 일',
    wdTitle: '가입까지가 아니라, 받으실 때까지',
    wdLead: '보험은 파는 순간이 아니라 받는 순간에 값이 정해집니다.',
    wd1t: '약관부터 비교합니다', wd1d: '조항으로 봅니다.',
    wd2t: '재무관리까지 함께 봅니다', wd2d: '함께 정합니다.',
    wd3t: '보상에 진심입니다', wd3d: '옆에 있는 것이 우리가 하는 일입니다.',
    /* ④ 는 <b>일부러 비운다</b> — 빈 칸이 상자로 서면 안 된다 */
    wd4t: '', wd4d: '',
    wdRef1t: '보험금비서', wdRef1b: '사장님이 붙여 넣으신 글',
    wdRef2t: '재무설계 홈페이지', wdRef2b: ''
  });
  is(D.n === 3, '  <b>채운 칸만</b> 선다 — 넷 중 셋 (' + D.n + '개)');
  is(/약관부터 비교합니다/.test(D.body), '  보낸 글이 <b>그대로</b> 들어간다');
  is(/받으실 때까지/.test(D.t) && D.grad,
     '  제목이 <b>두 마디로 갈려</b> 뒷마디가 강조된다 — 「' + D.t + '」');
  is(D.refN === 1, '  인용은 <b>붙여 넣으신 것만</b> 선다 — ' + D.refN + '개');
  is(/보험금비서/.test(D.refT) && !/재무설계 홈페이지/.test(D.refT),
     '  빈 인용은 <b>제목만 남기지 않는다</b> — 통째로 안 세운다');

  console.log('\n[5] 장을 끼워도 목차와 단추가 안 틀어진다');
  const E = await deck.evaluate(() => {
    const ss = document.querySelectorAll('.slide');
    /* 목차 번호가 실제 줄 순서와 같은가 */
    const bad = HAM_SLIDES.filter((s, i) => s.idx !== i).length;
    /* 「리모델링 상담」 단추가 가리키는 곳 */
    const btn = document.querySelector('.ch4-cta-btn');
    const on = btn ? (btn.getAttribute('onclick') || '') : '';
    let target = -1, i;
    for (i = 0; i < ss.length; i++) if (ss[i].id === 's16') target = i;
    return { bad, on, target, ham: HAM_SLIDES.length, slides: ss.length,
             byId: /goToId\('s16'\)/.test(on), hasNum: /goTo\(\d+\)/.test(on) };
  });
  is(E.bad === 0, '  목차 번호가 <b>줄 순서와 같다</b> — 어긋난 줄 ' + E.bad + '개');
  is(E.ham === E.slides, '  목차 줄 수 = 장 수 — ' + E.ham + ' / ' + E.slides);
  is(E.byId && !E.hasNum,
     '  단추가 <b>번호가 아니라 이름</b>으로 간다 — 「' + E.on + '」');
  is(E.target > 0, '  그 이름의 장이 <b>실제로 있다</b> — ' + (E.target + 1) + '번째');

  console.log('\n[6] 이 장이 잘리지 않는다');
  const F2 = await deck.evaluate(() => {
    const c = document.querySelector('#s1b .slide-content');
    if (!c) return { ov: '(칸이 없음)', clipped: '(칸이 없음)' };
    const cs = getComputedStyle(c);
    /* <b>몸통만 봐서는 모자란다.</b> 위쪽 어느 조상이 hidden 이면 거기서
       잘린다 — 실제로 그 자리를 되돌려 보니 이 점검이 안 울렸다 (8번). */
    let n = c.parentElement, clipped = '';
    while (n && n !== document.body) {
      const o = getComputedStyle(n);
      if (o.overflowY === 'hidden' || o.overflow === 'hidden') clipped = n.id || n.className;
      n = n.parentElement;
    }
    return { ov: cs.overflowY, clipped };
  });
  is(F2.ov === 'auto' || F2.ov === 'scroll',
     '  글이 길어도 <b>스스로 스크롤</b>한다 — overflow-y:' + F2.ov);
  is(!F2.clipped, '  <b>위에서 잘라내는 조상이 없다</b>' + (F2.clipped ? ' ← ' + F2.clipped : ''));

  console.log('\n[7] 콘솔이 조용하다');
  const all = aerr.concat(derr);
  is(all.length === 0, '  터진 곳이 없다' + (all.length ? ' — ' + all.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 우리가 안 한 말이 고객 앞에 설 수 있습니다')
                  : '✓ 사장님 말씀만 · 빈 칸은 안 세우고 · 목차가 안 틀어집니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
