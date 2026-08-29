/* <b>「생애재무리스크지도에서 나이를 못읽고 있어」</b>

   나이를 못 찾으면 앱이 조용히 <b>50</b> 을 썼습니다. 그 50 이

     · 생애 재무 리스크 지도의 「지금」 점선
     · 은퇴까지 남은 해
     · 연금 계산의 기간

   이 되어 <b>고객 앞 화면에 남의 나이가 찍혔습니다.</b> 그리고 그것이
   만들어 낸 숫자라는 것을 화면 어디에도 안 적었습니다 (CLAUDE.md 1번).

   그런데 나이는 <b>이미 앱 안에 있었습니다.</b> 증권에 「홍길동(47세, 남)」
   이라 적혀 있으면 <code>insWho</code> 가 읽어 <code>PR.scan.who.age</code>
   에 담아 둡니다. 고객 카드에는 생년이 있습니다. <b>아무도 안 봤을
   뿐입니다.</b>

   여기서 지키는 것
     1. <b>있는 나이는 읽는다</b> — 증권 · 고객 카드 · 직접 적으신 칸
     2. 어느 것을 먼저 믿는지 <b>순서가 있다</b>
     3. <b>모르면 모른다</b> — 50 을 만들지 않는다 (0 은 「모름」)
     4. 모르면 <b>그림을 안 세운다</b> — 무엇을 채워야 하는지만 말한다
     5. <b>어디서 온 나이인지 밝힌다</b> — 생년으로 계산한 것은 그렇게 (4번)
     6. 「0세~95세」 같은 <b>부서진 숫자</b>가 화면에 안 찍힌다              */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 견본 사람은 홍길동 (CLAUDE.md 3번) */
const PLAN = {
  clientLine: '홍길동님의 보험 현황',
  wallets: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
    no: '①②③④⑤⑥⑦⑧'[n - 1], name: ['생활', '병원비', '치료비', '소득공백',
      '가족보호', '은퇴·연금', '간병', '자산'][n - 1] + ' 통장',
    purpose: '목적', now: '담보 2개', need: '기준 충족', status: '충분', note: ''
  })),
  pension: { needMonthly: '300만원', haveMonthly: '국민 90만 + 퇴직 40만 + 개인 20만', gapMonthly: '150만원', planMonthly: '40만원' },
  wholelife: { purpose: '가족 보호', liquidity: '2억원' },
  slides: [{ kicker: '표지', title: '내 보험', lead: '', rows: [], quote: '', talk: '' }]
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  console.log('\n[1] 있는 나이를 읽는다 — 증권 · 고객 카드 · 직접 적은 칸');
  const A = await page.evaluate((PLAN) => {
    const O = {};
    const clear = () => {
      PR.plan = JSON.parse(JSON.stringify(PLAN)); PR.age = 0; PR.scan = null;
      OSC.current = null; CM_BASE['c1'] = null;
      const f = document.getElementById('prAge'); if (f) f.value = '';
    };
    /* ① 증권에 「홍길동(47세, 남)」 이라 적혀 있었다 */
    clear(); PR.scan = { who: { name: '홍길동', age: 47, sex: '남' } };
    O.scan = prAgeFind();
    /* ② 고객 카드의 생년 */
    clear(); OSC.current = { id: 'c1', name: '홍길동' };
    CM_BASE['c1'] = { by: (new Date()).getFullYear() - 38 };
    O.card = prAgeFind();
    /* ③ 직접 적으신 칸이 증권보다 세다 */
    clear(); PR.scan = { who: { age: 47 } }; PR.age = 61;
    O.mine = prAgeFind();
    /* ④ 문서 한 줄에만 적혀 있는 경우 */
    clear(); PR.plan.clientLine = '홍길동님 (52세 · 남) 의 보험 현황';
    O.line = prAgeFind();
    /* ⑤ 아무 데도 없다 */
    clear();
    O.none = prAgeFind();
    O.now = prAgeNow();
    O.ret = prAgeRet();
    return O;
  }, PLAN);
  is(A.scan && A.scan.age === 47 && /증권/.test(A.scan.src),
     '  <b>증권에서 읽는다</b> — 「홍길동(47세, 남)」 → ' + (A.scan ? A.scan.age + '세 (' + A.scan.src + ')' : '못 읽음'));
  is(A.card && A.card.age === 38 && /생년/.test(A.card.src),
     '  <b>고객 카드의 생년</b>으로도 센다 — ' + (A.card ? A.card.age + '세' : '못 읽음'));
  is(A.card && /생일 전이면 한 살 적습니다/.test(A.card.src),
     '  생년만 알 때는 <b>그렇다고 밝힌다</b> (4번) — 「' + (A.card ? A.card.src : '') + '」');
  is(A.mine && A.mine.age === 61,
     '  <b>직접 적으신 것이 가장 세다</b> — 증권 47세보다 적으신 61세 (' + (A.mine ? A.mine.age : '?') + ')');
  is(A.line && A.line.age === 52, '  문서 한 줄에 적힌 나이도 <b>마지막으로</b> 본다');

  console.log('\n[2] 모르면 모른다 — 50 을 만들지 않는다');
  is(A.none === null, '  아무 데도 없으면 <b>null</b> 을 준다 — 「모름」 이다');
  is(A.now === 0, '  prAgeNow 가 <b>0</b> 을 준다 — 여태 50 이었다 (' + A.now + ')');
  is(A.ret === 0, '  은퇴 나이도 <b>안 만든다</b> — 여태 65 였다 (' + A.ret + ')');

  console.log('\n[3] 모르면 그림을 안 세운다 — 무엇을 채워야 하는지만 말한다');
  const B = await page.evaluate((PLAN) => {
    PR.plan = JSON.parse(JSON.stringify(PLAN)); PR.age = 0; PR.scan = null;
    OSC.current = null; CM_BASE['c1'] = null;
    const f = document.getElementById('prAge'); if (f) f.value = '';
    const d = document.createElement('div');
    d.innerHTML = prWalletHtml();
    const noAge = d.textContent.replace(/\s+/g, ' ').trim();
    const gantt0 = d.querySelectorAll('.viz-wrap').length;
    /* 나이를 적으면 바로 선다 */
    PR.age = 47;
    const d2 = document.createElement('div');
    d2.innerHTML = prWalletHtml();
    const withAge = d2.textContent.replace(/\s+/g, ' ').trim();
    const gantt1 = d2.querySelectorAll('.viz-wrap').length;
    return {
      askShown: /나이를 몰라서/.test(noAge), gantt0, gantt1,
      /* 「생애 재무 리스크 지도」 라는 말은 <b>채워 달라는 칸에도</b> 들어 있다.
         그 말로 재면 늘 초록이다 — 지도 본문에만 있는 줄로 잰다. */
      mapGone: !/검은 점선이 지금 나이/.test(noAge),
      mapBack: /검은 점선이 지금 나이/.test(withAge),
      /* <b>「지금 47세」 로 재면 안 된다</b> — 간트 그림이 「지금」 눈금을 그
         글자로 스스로 그린다. 그래서 밝히기를 지워도 초록이었다. 실제로
         그랬다. <b>출처 이름</b>으로 잰다. */
      src: /직접 적으신 나이/.test(withAge),
      no50: !/50세/.test(noAge)
    };
  }, PLAN);
  is(B.askShown, '  <b>「나이를 몰라서 …를 세우지 않았습니다」</b> 라고 말한다');
  is(B.mapGone, '  나이를 모르면 <b>지도 자체를 안 세운다</b>');
  is(B.no50, '  <b>50세가 화면에 안 찍힌다</b> — 여태 이 자리에 찍혔다');
  is(B.gantt1 > B.gantt0, '  나이를 적으면 <b>바로 선다</b> — 그림 ' + B.gantt0 + '개 → ' + B.gantt1 + '개');
  is(B.mapBack, '  지도가 <b>돌아온다</b>');
  is(B.src, '  <b>지금 47세</b> 라고 어디서 온 나이인지 밝힌다 (4번)');

  console.log('\n[4] 연금·종신 — 지어낸 기간으로 계산하지 않는다');
  const C = await page.evaluate((PLAN) => {
    PR.plan = JSON.parse(JSON.stringify(PLAN)); PR.age = 0; PR.scan = null;
    OSC.current = null; PRC.init = false;
    const f = document.getElementById('prAge'); if (f) f.value = '';
    const d = document.createElement('div'); d.innerHTML = prPlanHtml();
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    PR.age = 47; PRC.init = false;
    const d2 = document.createElement('div'); d2.innerHTML = prPlanHtml();
    const t2 = d2.textContent.replace(/\s+/g, ' ').trim();
    return {
      ask: /나이를 몰라서/.test(t),
      broken: /0세~95세/.test(t) || /0세/.test(t),
      calc0: /연 4%/.test(t), calc1: /연 4%/.test(t2),
      ret: /65세~95세/.test(t2)
    };
  }, PLAN);
  is(C.ask, '  나이를 모르면 <b>연금·종신 계산도</b> 채워 달라고 말한다');
  is(!C.broken, '  <b>「0세~95세」 같은 부서진 숫자</b>가 안 찍힌다');
  is(!C.calc0 && C.calc1, '  나이를 모르면 <b>계산기를 안 세우고</b>, 알면 세운다');
  is(C.ret, '  은퇴는 <b>65세로 가정</b>해 「65세~95세」 로 적는다');

  console.log('\n[5] 8통장 진단지도도 같다 — 조용히 50 으로 안 그린다');
  const D = await page.evaluate(() => {
    WA.age = 0; WA.retire = 0; WA.fin = { income: 400, fixed: 250, retireNeed: 300, pension: 120 };
    WALLETS.forEach(w => { WA.diag[w.n] = 'ok'; });
    PR.plan = null; PR.age = 0; PR.scan = null; OSC.current = null;
    const f = document.getElementById('prAge'); if (f) f.value = '';
    const d = document.createElement('div'); d.innerHTML = waReport();
    const t = d.textContent.replace(/\s+/g, ' ').trim();
    WA.age = 47;
    const d2 = document.createElement('div'); d2.innerHTML = waReport();
    const t2 = d2.textContent.replace(/\s+/g, ' ').trim();
    return {
      say: /나이를 몰라서 이 지도를 세우지 않았습니다/.test(t),
      no50: !/50세/.test(t),
      broken: /0세~95세/.test(t),
      dash: /은퇴 나이를 적으시면 계산합니다/.test(t),
      back: /검은 점선이 현재 나이/.test(t2)
    };
  });
  is(D.say, '  <b>나이를 몰라서 안 세웠다</b>고 말한다');
  is(D.no50, '  <b>50세가 안 찍힌다</b>');
  is(!D.broken, '  <b>「0세~95세」</b> 가 안 찍힌다');
  is(D.dash, '  은퇴 총 부족은 <b>—</b> 로 두고 무엇을 적어야 하는지 말한다');
  is(D.back, '  나이를 적으면 <b>지도가 선다</b>');

  console.log('\n[6] 나이를 찾는 자리는 한 곳뿐이다');
  const SRC = fs.readFileSync('app/index.html', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const finds = (SRC.match(/PR\.scan&&PR\.scan\.who&&PR\.scan\.who\.age/g) || []).length;
  is(finds === 1, '  증권 나이를 읽는 자리가 <b>한 곳</b>이다 — ' + finds + '곳 (prAgeFind)');
  is(!/return 50;/.test(SRC), '  <b>「return 50」 이 안 남아 있다</b>');
  is(/function prAgeFind\(\)/.test(SRC) && /function prAgeNow\(\)\{var a=prAgeFind\(\)/.test(SRC),
     '  prAgeNow 가 <b>prAgeFind 하나</b>를 부른다 — 두 곳에서 각자 찾지 않는다 (5번)');

  console.log('\n[7] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 고객 앞에 남의 나이가 찍힐 수 있습니다')
                  : '✓ 있는 나이는 읽고, 모르면 만들지 않고 채워 달라고 말합니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
