/* 🎓 <b>교육자금 발표덱 — 고객이 한 쪽에 한 가지만 보는가.</b>

   사장님 말씀 (2026-11-05) 「<b>교육자금계산기가 너무 복잡해</b>, 다시 한번
   준비해서 전체적으로 <b>고객을 이해하기 쉽게</b> 각 발표덱을 전부 보기 쉽게
   수정하고, <b>왜 해야되는지 어필</b>하고」 · 「<b>계산기 자체는 그대로 둬</b>,
   교육자금만, 너무 복잡하게 되어있어서, 수정하는거야」.

   ★★ 재어 보니 그 말씀이 그대로 숫자였습니다 (1440×900 · 발표 모드) —
     여섯 쪽 중 <b>네 쪽이 창을 넘었고</b>, 계산 장은 창을 <b>2,969px</b>
     넘었습니다(화면 넷). 고객 앞에서 네 번 스크롤했습니다. 폰에서는
     그 장이 6,585px(화면 여덟)였습니다.
   ★★ 그리고 <b>발표 둘째 쪽이 설계사용 표</b>였습니다 — 1장 안에 「우리 지역
     지원금 취합본」(229개 시·군·구 · 붙여넣기 · 내보내기)이 들어 있었습니다.

   여기서 못 박는 것은 이렇습니다.

     1. 발표 차례(DECK.e)가 <b>한 쪽에 한 가지</b>로 갈라져 있다 — 열넷 이상.
     2. ★★ <b>설계사용 표(erg)는 발표 차례에 없다</b> — 고객 앞에 안 세웁니다.
        화면은 그대로 있어 스크롤로 씁니다 (6번 · 길을 안 지웁니다).
     3. ★ <b>「왜 지금인가」(ewhy)가 표지 바로 뒤</b>에 있다 (사장님 말씀
        「왜 해야되는지 어필하고」).
     4. 발표가 열넷 이상의 쪽으로 선다.
        ★ <b>넘침(몇 px 넘는가)은 여기서 안 셉니다</b> — 판 X338 에서 다섯 갈래를
        다 쪼개면서 <b>scripts/check-deck5.js</b> 한 곳으로 모았습니다 (5번).
     5. ★★ <b>계산기를 안 건드렸다</b> — 셈하는 자가 쓰는 칸 이름
        (eRes · eMonBox · eWhenBox · eSplit · eFee)이 <b>다 그대로</b> 있고,
        값이 그 자리에 <b>실제로 찍힌다.</b> 장만 갈랐습니다.
     6. ★ 차례에 적힌 id 가 <b>다 정말 있는 장</b>이다 — 없는 id 를 적으면
        그 쪽이 <b>조용히 빠집니다</b>(쿠폰 트랙이 두 번 그렇게 사라졌습니다).

   ★ 되돌려 보았습니다 (8번) — 네 가지를 깨뜨려 보고 전부 울었습니다:
     ⓐ 설계사용 표를 발표 차례에 넣기 ⓑ 「왜 지금」 을 빼기
     ⓒ 계산 칸 이름을 바꾸기 ⓓ 쪼갠 장을 다시 하나로 붙이기.               */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const FILE = 'app/상담자료/통합상담_APEX.html';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
               '.css':'text/css; charset=utf-8' };
/* 📰 견본 기사 — <b>바깥을 한 번도 안 부릅니다</b> (8번 · 점검이 사장님 진짜 서버를
   읽지 않는다). 신문사가 잠깐 죽은 날 CI 가 빨간불이면 우리 코드는 멀쩡한데
   헛것입니다. 셋 중 <b>교육 낱말이 든 둘만</b> 걸러져야 맞습니다. */
let NEWS_MODE = 'full';
const NEWS_FEED = { ok: true, news: [
  { title: '사교육비 총액 감소했지만 참여 학생 1인당 지출은 역대 최고', link: 'https://example.test/edu-1',
    source: '이투데이', date: 'Thu, 12 Mar 2026 12:00:00 +0900' },
  { title: '고환율에 유학비 부담 커진다', link: 'https://example.test/edu-2',
    source: '연합뉴스 경제', date: 'Mon, 09 Nov 2026 09:10:00 +0900' },
  { title: '프로야구 개막전 매진', link: 'https://example.test/sports',
    source: '스포츠한국', date: 'Mon, 09 Nov 2026 08:00:00 +0900' } ] };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p === '/api/market') {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify(NEWS_MODE === 'empty' ? { ok: true, news: [] } : NEWS_FEED));
    return;
  }
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* ⚠ 이 수는 이제 <b>안 씁니다</b> — 넘침을 재는 자는 scripts/check-deck5.js 입니다
   (판 X338). 여기 남겨 둔 것은 이 자의 머리글이 아직 2,969px 이야기를 하기
   때문입니다. 선을 고치실 때는 <b>check-deck5 의 넘침선</b>을 고치십시오. */
const 넘침선 = 400;
/* 셈하는 자가 쓰는 칸 — 이름이 바뀌면 값이 어디에도 안 찍힙니다 */
const 계산칸 = ['eRes', 'eMonBox', 'eWhenBox', 'eSplit', 'eFee'];

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  /* 🔌 바깥을 막습니다 (7번) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/' + FILE.split('/').map(encodeURIComponent).join('/') + '?track=e',
                { waitUntil: 'load' });
  await pg.waitForTimeout(2500);

  head('[1] 발표 차례가 <b>한 쪽에 한 가지</b>로 갈라져 있나');
  /* ⚠ 차례(DECK)는 덱 안쪽 덩이라 <b>브라우저에서 못 꺼냅니다</b>(window 에
     안 붙습니다). 그래서 <b>파일에서</b> 읽고, 장이 정말 있는지는 브라우저에
     묻습니다 — 안 보이는 것을 보는 척하지 않습니다 (1번). */
  const SRC = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
  const 줄 = (SRC.match(/\n\s*e:\s*\[([\s\S]*?)\],/) || [])[1] || '';
  const 차례 = (줄.match(/'([a-zA-Z0-9]+)'/g) || []).map(x => x.slice(1, -1));
  const 없는장 = await pg.evaluate(ids => ids.filter(id => !document.getElementById(id)), 차례);
  const D = { 차례: 차례, 없는장: 없는장 };
  is(D.차례.length >= 14, '  발표 차례가 <b>' + D.차례.length + '쪽</b> (고치기 전 6쪽 · 14쪽 아래면 다시 뭉친 것입니다)');
  is(D.없는장.length === 0, D.없는장.length
    ? ('차례에 <b>없는 장</b>이 있다 — ' + D.없는장.join(' ') + ' (그 쪽이 조용히 빠집니다)')
    : '차례에 적힌 장이 <b>다 있다</b> — 쿠폰 트랙이 두 번 조용히 사라진 그 자리입니다');

  head('[2] ★★ <b>설계사용 표는 고객 앞에 안 세운다</b>');
  is(D.차례.indexOf('erg') < 0,
     '발표 차례에 <b>erg(우리 지역 취합 표)가 없다</b> — 229개 시·군·구 표를 고객에게 띄우지 않습니다');
  const 있나 = await pg.evaluate(() => !!document.getElementById('erg'));
  is(있나, '그래도 <b>화면은 그대로 있다</b> — 스크롤로 내려오면 쓰십니다 (6번 · 길을 안 지웁니다)');

  head('[3] ★ <b>「왜 해야 하는지」가 표지 바로 뒤</b> (사장님 말씀 「왜 해야되는지 어필하고」)');
  /* ⚠⚠ <b>자를 고쳤습니다</b> (판 X385). 전에는 「둘째 쪽이 <b>ewhy</b> 여야 한다」 고
     이름을 못 박고 있었는데, 사장님이 「교육자금 <b>실제 뉴스와 문제 이야기</b> 해주고」
     를 더하셔서 표지 뒤에 <b>eprob(문제) · enews(오늘 기사)</b> 가 먼저 섰습니다.
     ★ 자가 지키려던 것은 <b>이름이 아니라 「왜 해야 하는지가 앞에 온다」</b> 입니다.
       그 뜻은 전보다 더 지켜졌습니다 — 이제 세 쪽이 그 말을 합니다.
     ★ 그래서 <b>말씀이 더해지면 자도 같이 바뀝니다</b> (판 X377 에서 색 판정을
       뒤집은 것과 같은 자리). 다만 느슨해지지 않게 <b>셋이 다 앞에 있나</b>를
       봅니다 — 하나라도 뒤로 밀리면 웁니다. */
  const 왜쪽 = ['eprob', 'enews', 'ewhy'];
  const 늦은것 = 왜쪽.filter((id, i) => D.차례.indexOf(id) !== i + 1);
  is(늦은것.length === 0,
     '표지 뒤 세 쪽이 <b>' + 왜쪽.join(' → ') + '</b> 다 — 지금 ' +
     D.차례.slice(1, 4).join(' → ') + (늦은것.length ? ('  ← 어긋남 ' + 늦은것.join(' ')) : ''));
  const 왜 = await pg.evaluate(() => {
    const s = document.getElementById('ewhy');
    if (!s) return { 없음: true };
    return { 칸: s.querySelectorAll('.card').length,
             글: (s.textContent || '').replace(/\s+/g, ' ').trim().length };
  });
  is(!왜.없음 && 왜.칸 >= 3, '  까닭이 <b>세 가지</b>로 선다 — 칸 ' + (왜.칸 || 0) + '개');

  head('[4] ★ 발표에서 창을 넘어도 <b>' + 넘침선 + 'px 안</b> (고치기 전 2,969px)');
  await pg.click('#presStart'); await pg.waitForTimeout(900);
  const n = await pg.evaluate(() => +document.getElementById('pNum').textContent.split('/')[1]);
  let 넘 = [], 제일 = 0;
  for (let i = 0; i < n; i++) {
    const r = await pg.evaluate(() => {
      const de = document.documentElement, s = document.querySelector('.pon');
      return { id: s ? s.id : '?', 넘침: Math.max(0, de.scrollHeight - de.clientHeight) };
    });
    if (r.넘침 > 8) { 넘.push(r.id + ' +' + r.넘침 + 'px'); 제일 = Math.max(제일, r.넘침); }
    await pg.keyboard.press('ArrowRight');
    /* ⚠ 420ms — 쪽이 떠오르는 동안(translateY 14px) 재면 14px 이 더 잡힙니다 (판 X383) */
    await pg.waitForTimeout(420);
  }
  is(n >= 14, '  발표가 <b>' + n + '쪽</b> 선다');
  /* ★ <b>넘침은 여기서 안 묻습니다</b> (판 X338 · CLAUDE.md 5번 「묻는 곳을 하나로」).
     다섯 갈래 전부의 넘침은 <b>scripts/check-deck5.js [1]</b> 이 셉니다. 두 곳에서
     각자 세면 한쪽만 선을 올렸을 때 서로 다른 답을 합니다 — 알람이 둘이면 둘 다
     못 믿게 됩니다. 여기서는 <b>지금 몇 px 인지 적어만</b> 둡니다.          */
  console.log('    (제일 심한 쪽 +' + 제일 + 'px · 창 넘는 쪽 ' + 넘.length + '/' + n +
              ' — 선을 긋는 자는 check-deck5 입니다)');

  head('[5] ★★ <b>계산기를 안 건드렸나</b> — 셈하는 자가 쓰는 칸이 그대로 있고 값이 찍히나');
  const C = await pg.evaluate((칸) => {
    const out = {};
    칸.forEach(id => {
      const e = document.getElementById(id);
      out[id] = { 있나: !!e, 글: e ? (e.textContent || '').replace(/\s+/g, ' ').trim().length : 0 };
    });
    return out;
  }, 계산칸);
  계산칸.forEach(id => {
    is(C[id].있나, '  <b>' + id + '</b> 칸이 있다' + (C[id].있나 ? '' : ' ← 이름이 바뀌면 값이 어디에도 안 찍힙니다'));
  });
  const 빈칸 = 계산칸.filter(id => C[id].있나 && C[id].글 < 4);
  is(빈칸.length === 0, '  칸마다 <b>값이 찍혀 있다</b>' +
     (빈칸.length ? (' ← 빈 칸: ' + 빈칸.join(' ') + ' (장을 가르다 셈을 끊은 것입니다)') : ''));

  head('[7] ★★ <b>조건 입력 폼은 고객 앞에 안 세운다</b> (판 X382)');
  /* ⚠ 재어 보니 발표 <b>5쪽째가 설계사용 입력 폼</b>이었습니다 — 자녀 나이 ·
     출생 순서 · 지역 · 상품 · 이율 시나리오 · 환율 슬라이더. erg(설계사용 표)를
     뺀 것과 <b>같은 종류</b>인데 판 X334 에서 못 본 자리입니다. */
  is(D.차례.indexOf('ecalc') < 0,
     '발표 차례에 <b>ecalc(조건 입력 폼)이 없다</b> — 고객 앞에 입력 폼을 안 세웁니다');
  const 폼있나 = await pg.evaluate(() => {
    const s = document.getElementById('ecalc');
    return { 장: !!s, 칸: ['eFxOut', 'eMon'].filter(i => document.getElementById(i)).length };
  });
  is(폼있나.장, '  그래도 <b>화면은 그대로 있다</b> — 스크롤로 내려오면 쓰십니다 (6번 · 길을 안 지웁니다)');

  head('[8] ★★ 그래도 발표 중 <b>「⚙ 조건」 으로 열린다</b> — 죽은 단추가 아니다');
  /* ⚠⚠ 교육자금은 다섯 갈래 중 <b>혼자 .panel 이 없어</b>, 발표에서 「⚙ 조건」 을
     눌러도 <b>아무 일도 안 일어났습니다</b>. 입력 폼을 쪽에서 빼려면 먼저 이 단추가
     살아 있어야 합니다 — 안 그러면 발표 중에 조건을 바꿀 길이 <b>끊깁니다</b> (6번).
     ★ 보이기만 해서는 모릅니다. <b>값을 바꿔 메아리가 따라오는지</b>까지 봅니다. */
  const 조건 = await pg.evaluate(() => {
    const 보임 = id => { const e = document.getElementById(id);
      if (!e) return 0; const r = e.getBoundingClientRect();
      return (r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden') ? Math.round(r.width) : 0; };
    const out = {};
    presGo(3);                                   /* 계산 장이 아닌 아무 쪽에서나 */
    out.전 = 보임('eFxOut');
    document.getElementById('pPanel').click();
    out.후 = 보임('eFxOut');
    const i = document.getElementById('eFxOut');
    out.메아리전 = (document.getElementById('eFxOutEcho') || {}).textContent || '';
    if (i) { i.value = String(Number(i.value) + 120);
             i.dispatchEvent(new Event('input', { bubbles: true })); }
    out.메아리후 = (document.getElementById('eFxOutEcho') || {}).textContent || '';
    if (i) { i.value = String(Number(i.value) - 120);
             i.dispatchEvent(new Event('input', { bubbles: true })); }
    document.getElementById('pPanel').click();
    out.닫은뒤 = 보임('eFxOut');
    return out;
  });
  is(조건.전 === 0, '  누르기 전에는 <b>안 보인다</b> — 고객은 조건 칸을 안 봅니다');
  is(조건.후 > 0, '  「⚙ 조건」 을 누르면 <b>뜬다</b> — 너비 ' + 조건.후 + 'px' +
     (조건.후 ? '' : ' ← 죽은 단추입니다(교육자금만 .panel 이 없던 자리)'));
  is(!!조건.메아리전 && 조건.메아리후 !== 조건.메아리전,
     '  ★ 떠 있는 칸이 <b>정말 만져진다</b> — 환율을 움직이니 ' +
     (조건.메아리전 || '(빈칸)') + ' → ' + (조건.메아리후 || '(빈칸)'));
  is(조건.닫은뒤 === 0, '  다시 누르면 <b>닫힌다</b>');

  head('[9] ★★ <b>문제 이야기</b>가 표지 바로 뒤에 선다 (판 X385 · 사장님 말씀 「교육자금 <b>실제 뉴스와 문제 이야기</b> 해주고」)');
  /* ⚠ 여태 표지 다음이 바로 「왜 지금인가」(받는 돈 이야기)였습니다 — 고객이
     <b>왜 돈이 모자란지</b>를 먼저 듣지 못했습니다. 문제를 앞에 둡니다.
     ★★ 숫자를 <b>지어내지 않았나</b>를 봅니다 (1번 · 9번) — 출처와 날짜가
       그 쪽에 적혀 있고, 「참여 학생 기준」 과 「전체 학생 기준」 을 섞지 않나. */
  is(D.차례.indexOf('eprob') === 1,
     '차례 둘째가 <b>eprob(문제)</b> 이다 — 지금 ' + (D.차례[1] || '(없음)'));
  is(D.차례.indexOf('enews') === 2,
     '차례 셋째가 <b>enews(오늘 기사)</b> 이다 — 지금 ' + (D.차례[2] || '(없음)'));
  const 문제 = await pg.evaluate(() => {
    const e = document.getElementById('eprob');
    const t = e ? (e.innerText || '').replace(/\s+/g, ' ') : '';
    const a = e ? [...e.querySelectorAll('a[href]')].map(x => x.getAttribute('href')) : [];
    return { t, a };
  });
  is(/60만\s*4천원/.test(문제.t), '  ★ <b>참여 학생 1인당 월평균</b>이 적혀 있다 (60만 4천원)');
  is(/45만\s*8천원/.test(문제.t),
     '  ★★ <b>전체 학생 기준도 같이</b> 적는다 (45만 8천원) — 두 수를 섞으면 45만원이 60만원으로 보입니다 (1번)');
  is(/교육부/.test(문제.t) && /국가데이터처/.test(문제.t) && /2026[.\-]0?3[.\-]12/.test(문제.t),
     '  ★★ <b>출처와 날짜</b>가 그 쪽에 적혀 있다 — 교육부 · 국가데이터처 · 2026-03-12 (9번)');
  is(문제.a.some(h => /^https?:\/\//.test(h)),
     '  ★ <b>기사 원문 링크</b>가 있다 — 사장님이 그 자리에서 열어 보실 수 있습니다');
  is(!/노후\s*파산|거지|망한다/.test(문제.t),
     '  ★ <b>겁주는 말을 보태지 않는다</b> — 숫자만 둡니다');

  head('[10] ★★ <b>오늘 기사</b>를 받아 오나 · 없으면 <b>지어내지 않나</b> (9번)');
  const 뉴스 = await pg.evaluate(async () => {
    eduNewsLoad(true);
    await new Promise(r => setTimeout(r, 900));
    const L = [...document.querySelectorAll('#eduNewsList .ni')];
    return { n: L.length,
             txt: (document.getElementById('eduNewsList').innerText || '').replace(/\s+/g, ' '),
             href: L[0] ? L[0].getAttribute('href') : '' };
  });
  is(뉴스.n === 2, '받아 온 셋 중 <b>교육 낱말이 든 둘만</b> 선다 — ' + 뉴스.n + '개 (야구 기사는 걸러집니다)');
  is(/이투데이/.test(뉴스.txt) || /연합뉴스/.test(뉴스.txt), '  <b>언론사를 그대로</b> 옮긴다');
  is(/2026\.11\.09/.test(뉴스.txt) || /2026\.03\.12/.test(뉴스.txt),
     '  <b>날짜를 기사에 적힌 그대로</b> 옮긴다 — 오늘 날짜를 대신 넣지 않습니다');
  is(/^https?:\/\//.test(뉴스.href), '  <b>링크가 기사 주소</b>다 — ' + (뉴스.href || '(없음)'));
  NEWS_MODE = 'empty';
  const 빈손 = await pg.evaluate(async () => {
    eduNewsLoad(true);
    await new Promise(r => setTimeout(r, 900));
    return (document.getElementById('eduNewsList').innerText || '').replace(/\s+/g, ' ');
  });
  NEWS_MODE = 'full';
  is(/보여 드릴 기사가 없습니다/.test(빈손) && /지어내지 않습니다/.test(빈손),
     '  ★★ 기사가 <b>없으면 없다고</b> 적는다 — 빈칸을 그럴듯한 말로 메우지 않습니다 (1번)');
  is(!/60만|사교육비 총액/.test(빈손), '  ★ 빈손일 때 <b>옛 기사를 남겨 두지 않는다</b>');

  head('[11] ★★ <b>환차익이 따로 선다</b> · 원화가 기준 (판 X385 · 사장님 말씀 「계산기는 <b>원화가 기준</b>이고, 달러로 모았을때 <b>환차익이 부각</b>되게」)');
  /* ⚠ 여태 표의 「낸 돈 대비」 한 칸에 <b>상품이 불린 몫과 환율이 보탠 몫이 섞여</b>
     있었습니다 — 「달러로 모으면 환율이 얼마를 보태 주나」 에 답할 자리가 없었습니다.
     ★★ 좋은 쪽만 보여 주지 않나까지 봅니다 (1번) — 환율을 내리면 <b>환차손</b>으로
       말이 바뀌어야 합니다. */
  is(D.차례.indexOf('ecalc2fx') > 0, '차례에 <b>ecalc2fx(환차익)</b> 가 있다');
  is(D.차례.indexOf('ecalc2fx2') === D.차례.indexOf('ecalc2fx') + 1,
     '  바로 뒤가 <b>ecalc2fx2(환율은 한쪽으로만 가지 않습니다)</b> 다 — 좋은 쪽만 보여 주지 않습니다');
  const 환차 = await pg.evaluate(async () => {
    window.__go('e');
    const 읽 = () => ({ fx: (document.getElementById('eFxGain').innerText || '').replace(/\s+/g, ' '),
                        no: (document.getElementById('eFxNote').innerText || '').replace(/\s+/g, ' '),
                        tb: (document.getElementById('eMonBox2').innerText || '').replace(/\s+/g, ' ') });
    window.__apexE.set({ mon: 100, fxIn: 1484, fxOut: 1484, prod: 'met', age: 0, go: 19 });
    await new Promise(r => setTimeout(r, 260));
    const 같 = 읽();
    window.__apexE.set({ fxOut: 1700 });
    await new Promise(r => setTimeout(r, 260));
    const 올 = 읽();
    window.__apexE.set({ fxOut: 1200 });
    await new Promise(r => setTimeout(r, 260));
    const 내 = 읽();
    window.__apexE.set({ fxOut: 1484 });
    return { 같, 올, 내 };
  });
  /* ⚠⚠ <b>자가 또 옛 글자를 못 박고 있었습니다</b> (판 X386 · 8번).
       판 X385 에서 「원화로 그냥 모으면」 「상품이 불린 몫」 「환율이 보탠 몫」 이라는
       <b>그 글자 그대로</b>를 찾고 있었는데, 사장님이 「상담자료가 어렵다」 하셔서
       「내가 낸 돈」 「상품이 불려 준 돈」 「환율이 더해 준 돈」 으로 쉽게 바꾸자 울었습니다.
     ★ 자가 지키려던 것은 <b>글자가 아니라 뜻</b>입니다 — ⓐ 바닥이 원화로 낸 돈이고
       ⓑ 상품 몫과 환율 몫이 <b>갈라져</b> 있나. 뜻으로 재게 고쳤습니다.
       말이 또 바뀌어도 뜻이 지켜지면 초록이고, 둘을 합치면 그 자리에서 웁니다. */
  is(/낸 돈/.test(환차.같.fx) && /만원/.test(환차.같.fx) && !/^\s*\$/.test(환차.같.fx),
     '  ★★ <b>기준이 원화</b>다 — 「낸 돈 … 만원」 이 바닥에 깔린다');
  is(/상품이 불[린려]/.test(환차.같.fx) && /환율이 (보탠|더해)/.test(환차.같.fx),
     '  ★★ <b>두 몫을 가른다</b> — 상품이 불려 준 돈 · 환율이 더해 준 돈');
  is(/\+0원/.test(환차.같.fx),
     '  ★ 넣을 때와 나올 때 환율이 <b>같으면 환차익이 0</b> 이다 — 셈이 맞는 증거');
  is(/\+1,168만원/.test(환차.올.fx),
     '  ★ 환율 1,700원으로 올리면 <b>+1,168만원</b> 이 따라온다 (54,073 × 216원)');
  is(/환차손/.test(환차.내.no) || /깎은/.test(환차.내.fx),
     '  ★★ 환율을 <b>1,200원으로 내리면 「환차손」</b> 으로 말이 바뀐다 — 좋은 쪽만 보여 주지 않습니다 (1번)');
  is(/-1,536만원/.test(환차.내.fx),
     '  ★ 그때 <b>-1,536만원</b> 이라고 적는다 (54,073 × -284원) — 숨기지 않습니다');
  is(/상품이 불[린려]/.test(환차.같.tb) && /환율이 (보탠|더해)/.test(환차.같.tb),
     '  ★ <b>시점별 표</b>도 두 칸으로 갈라져 있다 — 섞어 두면 물음에 답할 자리가 없습니다');
  is(/1,550원/.test(환차.같.no) && /1,330원/.test(환차.같.no),
     '  ★ 환율이 <b>실제로 양쪽으로 움직인 해</b>를 적는다 (2026년 6월 1,550원 → 9월 1,330원)');
  /* ⚠⚠ 처음에 「예측」 이라는 <b>글자</b>를 금지했다가 <b>두 번</b> 제 꼬리를
     물었습니다 — 쪽에 적힌 면책 문장 「앞날의 환율을 <b>예측한 값이 아닙니다</b>」 가
     그대로 걸렸습니다(헛것 · 8번). 글자로는 「예측한다」 와 「예측이 아니다」 를
     가릴 수 없습니다. 그래서 <b>면책 문장을 먼저 떼고</b> 남은 글에서
     <b>예측하는 말투</b>만 봅니다. */
  const 면책떼기 = t => String(t).replace(/앞날의 환율을 예측한 값이 아닙니다\.?/g, '')
                                 .replace(/환율을 맞히는 이야기가 아닙니다\.?/g, '');
  const 예측말 = /환율이 (오를|내릴|상승할|하락할) (것|전망)|환율을 예측(합니다|했습니다|해)|예상 환율은|전망치는/;
  is(/예측한 값이 아닙니다/.test(환차.같.no),
     '  ★★ <b>「앞날의 환율을 예측한 값이 아니다」</b> 를 그 쪽에 적는다 (1번)');
  is(!예측말.test(면책떼기(환차.같.no)) && !예측말.test(면책떼기(환차.같.fx)),
     '  ★ 면책 문장을 떼고 봐도 <b>환율을 예측하는 말</b>이 없다');

  head('[12] ★★ <b>쉬운 말로 적혔나</b> · 숫자를 반올림해 거짓말하지 않나 (판 X386 · 사장님 말씀 「내가 보았을때 <b>상담자료가 어렵다</b> 확 와닿고 쉽게 설명할수 있도록 해야지」)');
  /* ⚠⚠ 라이브 그림을 <b>눈으로 보고</b> 찾은 것들입니다 — 숫자만 봤으면 못 봤습니다 (8번).
       ① 표 칸(td)에 .mini 를 달아 <b>흰 네모가 글자 위에 겹쳐</b> 찍혔습니다(display:block).
       ② 「환급률 133.74%」 「납입 재원」 「납입완료」 처럼 <b>설계사 말</b>로 적혀 있었습니다.
       ③ <b>제가 반올림해 거짓말을 했습니다</b> — 99.69% 를 「100%만」 이라 적었습니다.
          100 을 못 넘었는데 100 이라 적으면 「원금을 넘었다」 는 뜻이 됩니다 (1번).
     ★ 설계사 말을 <b>지우지는 않습니다</b> — 작은 글씨로 그 자리에 남깁니다 (6번). */
  const 쉬움 = await pg.evaluate(async () => {
    window.__go('e');
    window.__apexE.set({ mon: 100, fxIn: 1484, fxOut: 1700, prod: 'met', age: 0, go: 19 });
    await new Promise(r => setTimeout(r, 320));
    const T = id => { const e = document.getElementById(id); return e ? (e.innerText || '').replace(/\s+/g, ' ') : ''; };
    /* 칸(td·th)에 .mini 가 붙어 있으면 표가 깨집니다 — 계산된 값으로 봅니다 */
    const 깨진칸 = [...document.querySelectorAll('#trackE table.mile td, #trackE table.mile th')]
      .filter(c => getComputedStyle(c).display !== 'table-cell').length;
    return { when: T('eWhenBox'), mon2: T('eMonBox2'), fx: T('eFxGain'), res: T('eRes'), 깨진칸 };
  });
  is(쉬움.깨진칸 === 0,
     '  ★★ 표 칸이 <b>줄 밖으로 안 튀어나온다</b> — 깨진 칸 ' + 쉬움.깨진칸 +
     ' (td 에 .mini 를 달면 display:block 이라 흰 네모가 글자 위에 겹칩니다)');
  is(/99%만/.test(쉬움.when) && !/100%만/.test(쉬움.when),
     '  ★★ <b>반올림해 거짓말하지 않는다</b> — 환급률 99.69% 는 「99%만」 이지 「100%만」 이 아닙니다 (1번)');
  is(/환급률 99\.69%/.test(쉬움.when),
     '  ★ 정확한 값은 <b>그 자리에 그대로</b> 둔다 — 사장님은 제안서와 맞대 보셔야 합니다 (6번)');
  const 고객말 = ['낸 돈의', '그때 손에 쥐는 돈', '달러로는'];
  is(고객말.every(k => 쉬움.when.indexOf(k) >= 0),
     '  ★ 표 머리가 <b>고객 말</b>이다 — ' + 고객말.join(' · '));
  is(/5년하고 하루 더/.test(쉬움.when) && /아이 19살/.test(쉬움.when),
     '  ★ 줄 이름도 고객 말이다 — 「5년 + 하루 ★」 → <b>「5년하고 하루 더」</b> · 「유학 시점(19세)」 → <b>「아이 19살」</b>');
  is(/낸 돈 6,000만원이 아이 19살에/.test(쉬움.fx) || /이 됩니다/.test(쉬움.fx),
     '  ★★ 환차익 쪽이 <b>한 문장 결론</b>으로 시작한다 — 표를 보기 전에 무엇을 보라는 것인지 못 박습니다');
  is(/처음 5년치/.test(쉬움.res),
     '  ★★ 나온 값 쪽이 <b>무엇을 넣은 것인지</b> 먼저 말한다 — 전에는 19년치 지원금과 5년치만 넣은 결과가 나란히 큰 글자로 서서 한 덩어리로 읽혔습니다 (1번)');

  head('[6] 조용한가');
  is(errs.length === 0, errs.length ? ('콘솔 에러 — ' + errs.slice(0, 2).join(' / ')) : '콘솔에 에러가 없다');

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
                  : '교육자금 발표덱 점검 통과 — 한 쪽에 한 가지 · 설계사용 표는 고객 앞에 안 섭니다.');
  await br.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
