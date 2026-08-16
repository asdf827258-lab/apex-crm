/* 투자 쪽이 고객을 보고 있는가, 그리고 복리·단리 숫자가 맞는가.

   여태 이랬다.
     · 투자 컨설팅은 pay:400, age:38 이 고정값이라 35세 연봉 6,000만 고객도
       38세 월급 400만으로 계산했다. 왼쪽에 다 받아 놓고 안 쓰고 있었다
     · 물가상승률이 접힌 「은퇴 & 연금 설정」 안에 있어 상담 중에 못 찾았고,
       부동산 3% · 발표자료 2.5% 로 각자 따로 놀았다
     · 발표 슬라이드는 40세, 그 위 입력칸은 29세를 보여 줬다 — 슬라이드를
       먼저 만들고 입력칸을 나중에 붙이는데 첫 그리기 때 칸이 아직 없어서
       각자 다른 기본값으로 떨어졌다
     · 앞 고객에게 변액 탭을 열어 두면 다음 고객도 변액부터 봤다

   그래서 여기서 확인한다.
     1. 물가상승률이 눈에 보이는 자리에 하나만 있고, 나머지가 따라오는가
     2. 투자·변액 컨설팅이 고객 자료를 물고 오는가
     3. 투자 탭은 언제나 ETF·주식 포트폴리오부터 열리는가
     4. 발표 입력칸과 슬라이드가 같은 숫자를 쓰는가
     5. 복리·단리가 손으로 푼 답과 같은가 (돈이 걸린 숫자라 전수로 본다) */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8873;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);
const fmt = v => Math.round(v).toLocaleString();
const near = (a, b, tol, m) => is(Math.abs(a - b) <= tol, m + ' — 나온 값 ' + fmt(a) + ', 손으로 푼 답 ' + fmt(b));

/* 손으로 푼 답 — 월말 납입 기준.
   복리 FV = m·((1+i)^n − 1)/i,  단리 FV = m·n + m·i·n(n−1)/2 */
function handComp(m, annual, months) {
  const i = annual / 100 / 12;
  return Math.abs(i) < 1e-12 ? m * months : m * (Math.pow(1 + i, months) - 1) / i;
}
function handSimp(m, annual, months) {
  const i = annual / 100 / 12;
  return m * months + m * i * months * (months - 1) / 2;
}

(async () => {
  const browser = await chromium.launch();
  const errs = [];

  /* ═══ 재무설계 계산기 ═══ */
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  page.on('pageerror', e => errs.push('' + e));
  await page.goto('http://127.0.0.1:' + PORT + '/app/finance.html', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2200);

  console.log('\n[1] 물가상승률 — 눈에 보이는 자리에 하나만');
  const pin = await page.evaluate(() => {
    const box = document.querySelector('.sb-pin');
    const inp = document.querySelector('.sb-pin #s_inf');
    const inScroll = !!(inp && inp.closest('.sb-scroll'));
    const foldedIn = !!(inp && inp.closest('.sb-body'));
    return {
      hasBox: !!box, hasInput: !!inp, count: document.querySelectorAll('#s_inf').length,
      visible: !!(box && box.getBoundingClientRect().height > 0),
      inScroll, foldedIn
    };
  });
  is(pin.hasBox && pin.hasInput, '물가상승률이 사이드바 고정 칸에 있다');
  is(pin.count === 1, '물가상승률 칸이 하나뿐이다 (id 가 겹치지 않는다) — 지금 ' + pin.count + '개');
  is(pin.visible, '접지 않아도 바로 보인다');
  is(!pin.foldedIn, '접히는 칸(.sb-body) 안에 들어 있지 않다');

  await page.fill('.sb-pin #s_inf', '4.5');
  await page.waitForTimeout(500);
  const follow = await page.evaluate(() => ({
    r: (document.getElementById('r_inflation') || {}).value,
    a: (document.getElementById('apexInf') || {}).value
  }));
  is(follow.r === '4.5', '부동산 물가상승률이 같은 숫자를 따라온다 — 지금 ' + follow.r);
  is(follow.a === '4.5', '발표 물가상승률도 따라온다 (설계사가 따로 잡아 둔 게 없을 때) — 지금 ' + follow.a);

  console.log('\n[2] 투자·변액 컨설팅이 고객 자료를 물고 오는가');
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) {
      e.value = v; e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true })); } };
    set('s_age', 29); set('s_rage', 60); set('s_gross', 9600); set('s_itype', '적극투자형');
  });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => ({ pay: IC.pay, age: IC.age }));
  is(before.pay === 400 && before.age === 38, '열기 전에는 아직 고정값이다 (컨설팅을 열 때 채운다)');

  await page.evaluate(() => window.switchTab('invest'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.switchSubTab('balance', document.getElementById('stab-balance')));
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({
    ic: { pay: IC.pay, age: IC.age, years: IC.years, risk: IC.risk },
    vcYears: (typeof VC !== 'undefined') ? VC.years : null,
    banner: (document.querySelector('.ic-seed .t') || {}).textContent || ''
  }));
  is(after.ic.pay === 800, '월 급여를 연 총급여 9,600만에서 가져온다 (÷12 = 800만) — 지금 ' + after.ic.pay);
  is(after.ic.age === 29, '나이를 고객 기본정보에서 가져온다 — 지금 ' + after.ic.age);
  is(after.ic.years === 31, '운용 기간을 은퇴 목표 나이 60에서 뽑는다 (60−29=31년) — 지금 ' + after.ic.years);
  is(after.ic.risk === '공격형', '다섯 단계 성향(적극투자형)을 세 단계(공격형)로 옮긴다 — 지금 ' + after.ic.risk);
  is(after.vcYears === 31, '변액 컨설팅도 같은 기간을 쓴다 — 지금 ' + after.vcYears);
  is(/고객 자료에서 가져왔습니다/.test(after.banner), '어디서 가져왔는지 화면에 적어 준다');

  console.log('\n[3] 투자 탭은 ETF·주식 포트폴리오부터');
  await page.evaluate(() => window.switchTab('pension'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.switchTab('invest'));
  await page.waitForTimeout(600);
  const etf = await page.evaluate(() => ({
    on: document.getElementById('stab-etf').classList.contains('on'),
    shown: document.getElementById('sub-etf').style.display !== 'none',
    balanceHidden: document.getElementById('sub-balance').style.display === 'none'
  }));
  is(etf.on && etf.shown, '앞 고객에게 다른 탭을 열어 뒀어도 ETF·주식으로 돌아온다');
  is(etf.balanceHidden, '투자 컨설팅 탭은 닫혀 있다');

  /* switchTab 은 이 파일 안에서 여러 번 통째로 덮어써진다. 그래서 고치지 않고
     감싼다 — 마커로 겹침을 막고, 로드 중에 덮어써질 것에 대비해 몇 번 다시 붙인다.
     겉에 붙은 마커로 확인하면 안 된다. 뒤에 상담 순서 감싸개가 한 겹 더 얹히면
     __inv 가 안쪽으로 밀려나 겉에서는 안 보인다. 그래서 소스로 확인한다. */
  const fin = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');
  is(/w\.__inv\s*=\s*true/.test(fin), 'switchTab 을 고치지 않고 감쌌다 (겹침 막는 마커가 있다)');
  is(/\[300,\s*900,\s*2000\]\.forEach/.test(fin), '로드 중에 덮어써질 것에 대비해 몇 번 다시 붙인다');
  is(!/function show\([^)]*\)\s*\{[^}]*etfFirst/.test(fin), '원래 switchTab 본문은 건드리지 않았다');

  console.log('\n[4] 발표 입력칸과 슬라이드가 같은 숫자를 쓰는가');
  await page.evaluate(() => window.switchSubTab('deck', null));
  await page.waitForTimeout(800);
  const deck = await page.evaluate(() => {
    const v = id => (document.getElementById(id) || {}).value;
    const body = document.querySelector('.dk-body');
    return { age: v('dk_age'), yrs: v('dk_yrs'), inf: v('dk_inf'),
             text: body ? body.innerText.replace(/\s+/g, ' ') : '' };
  });
  is(deck.age === '29', '발표 입력칸의 고객 나이가 왼쪽과 같다 — 지금 ' + deck.age);
  is(deck.yrs === '31', '발표 입력칸의 기간이 은퇴까지와 같다 — 지금 ' + deck.yrs);
  is(deck.inf === '4.5', '발표 입력칸의 물가가 고정 칸과 같다 — 지금 ' + deck.inf);
  is(deck.text.indexOf('29세') >= 0 && deck.text.indexOf('40세') < 0,
    '슬라이드 본문도 같은 나이를 쓴다 (전에는 위는 29세, 슬라이드는 40세였다)');

  /* ═══ APEX 자산 리포트 · 투자·세금 ═══ */
  console.log('\n[5] 복리와 단리 — 손으로 푼 답과 같은가');
  const rep = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  rep.on('pageerror', e => errs.push('' + e));
  await rep.goto('http://127.0.0.1:' + PORT + '/app/%EC%83%81%EB%8B%B4%EC%9E%90%EB%A3%8C/%ED%86%B5%ED%95%A9%EC%83%81%EB%8B%B4_APEX.html?track=t',
    { waitUntil: 'load', timeout: 90000 });
  await rep.waitForTimeout(1800);
  await rep.evaluate(() => window.__go && window.__go('t'));
  await rep.waitForTimeout(700);

  const shape = await rep.evaluate(() => {
    const g = document.getElementById('tgrow');
    const svg = document.querySelector('#gwChart svg');
    return {
      exists: !!g, inTrackT: !!(g && g.closest('#trackT')),
      paths: svg ? svg.querySelectorAll('path').length : 0,
      inDeck: (typeof DECK !== 'undefined') ? DECK.t.indexOf('tgrow') : -1,
      ageRows: document.querySelectorAll('#gwAgeTbl tbody tr').length,
      retRows: document.querySelectorAll('#gwRetTbl tbody tr').length
    };
  });
  is(shape.exists && shape.inTrackT, '복리·단리 칸이 투자·세금 트랙 안에 있다');
  is(shape.inDeck > 0, '발표 순서에도 들어가 있다 (' + shape.inDeck + '번째)');
  is(shape.paths >= 3, '그래프에 복리·단리·원금 세 줄이 그려진다 — 지금 ' + shape.paths + '개');
  is(shape.ageRows >= 5, '시작 나이 표가 나온다 — ' + shape.ageRows + '줄');
  is(shape.retRows >= 5, '수익률 표가 나온다 — ' + shape.retRows + '줄');

  /* 여러 조합을 돌려 전부 손으로 푼 답과 맞춰 본다 */
  const cases = [];
  for (const pay of [30, 50, 100]) {
    for (const ret of [3, 6, 9]) {
      for (const [age, end] of [[25, 65], [35, 65], [45, 60]]) cases.push({ pay, ret, age, end });
    }
  }
  let bad = 0, checked = 0, worst = 0;
  for (const c of cases) {
    const got = await rep.evaluate(async (c) => {
      const set = (id, v) => { const e = document.getElementById(id); e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true })); };
      set('gwPay', c.pay); set('gwAge', c.age); set('gwEnd', c.end); set('gwRet', c.ret);
      await new Promise(r => setTimeout(r, 30));
      const t = document.getElementById('gwKpi').innerText;
      /* 「1억 8,000만」 같은 표기를 만원 단위 숫자로 되돌린다 */
      const parse = s => { let v = 0;
        const e = s.match(/([\d,]+)억/); if (e) v += parseFloat(e[1].replace(/,/g, '')) * 10000;
        const m = s.match(/(?:억\s*)?([\d,]+)만/); if (m) v += parseFloat(m[1].replace(/,/g, ''));
        return v; };
      const parts = t.split('\n').filter(Boolean);
      return { paid: parse(parts[0]), simp: parse(parts[2]), comp: parse(parts[4]) };
    }, c);
    const months = (c.end - c.age) * 12;
    const wantPaid = c.pay * months;
    const wantSimp = handSimp(c.pay, c.ret, months);
    const wantComp = handComp(c.pay, c.ret, months);
    checked++;
    /* 화면은 만원 단위로 반올림해 보여 준다 — 1만원까지 벌어질 수 있다 */
    const d = Math.max(Math.abs(got.paid - wantPaid), Math.abs(got.simp - wantSimp), Math.abs(got.comp - wantComp));
    worst = Math.max(worst, d);
    if (d > 1.5) { bad++;
      if (bad <= 3) console.log('    · 어긋남 ' + JSON.stringify(c) +
        ' → 화면 ' + fmt(got.comp) + ' / 손 ' + fmt(wantComp)); }
    if (checked === 1) {
      near(got.paid, wantPaid, 1.5, '낸 돈');
      near(got.simp, wantSimp, 1.5, '단리');
      near(got.comp, wantComp, 1.5, '복리');
    }
  }
  is(bad === 0, cases.length + '가지 조합(월납 3 × 수익률 3 × 나이 3)이 전부 맞다' +
    (bad ? ' — ' + bad + '가지 어긋남' : ' · 가장 큰 차이 ' + worst.toFixed(2) + '만원'));

  /* 복리가 단리보다 항상 크고, 늦게 시작할수록 줄어드는가 */
  const sane = await rep.evaluate(async () => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('gwPay', 50); set('gwEnd', 65); set('gwRet', 7);
    const out = [];
    for (const a of [25, 35, 45, 55]) {
      set('gwAge', a);
      await new Promise(r => setTimeout(r, 30));
      const t = document.getElementById('gwKpi').innerText.split('\n').filter(Boolean);
      const parse = s => { let v = 0;
        const e = s.match(/([\d,]+)억/); if (e) v += parseFloat(e[1].replace(/,/g, '')) * 10000;
        const m = s.match(/(?:억\s*)?([\d,]+)만/); if (m) v += parseFloat(m[1].replace(/,/g, ''));
        return v; };
      out.push({ age: a, simp: parse(t[2]), comp: parse(t[4]) });
    }
    return out;
  });
  is(sane.every(r => r.comp > r.simp), '어느 나이에서든 복리가 단리보다 크다');
  is(sane.every((r, i) => i === 0 || r.comp < sane[i - 1].comp),
    '늦게 시작할수록 받는 돈이 줄어든다 — ' + sane.map(r => r.age + '세 ' + fmt(r.comp) + '만').join(' · '));

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 130) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '투자 연동 · 복리 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '투자 연동 · 복리 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
