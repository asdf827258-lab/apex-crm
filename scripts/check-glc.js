/* 📊 한눈에 결과 — 토스처럼 한 장에, 새로 세는 것 없이 (판 X198)

   사장님 말씀 2026-10-24 「토스처럼 결과 보여주고 쉽게 이해하는것들 … 여기서 먼저 만들고 반영할거야」.
   계산기(app/finance.html)의 「📊 한눈에 결과」 를 실제로 열어 봅니다.

     가. 숫자가 모자라면(소득 · 지출) 아무 숫자도 세우지 않고 무엇을 채울지만 말한다(1번)
     나. ★★ 판정 · 이유 · 순서는 fsPlan 한 곳 그대로 — 카드 수 · 딱지 · 이유 글 · 「먼저」 · 위의 세 칸 수가 fsPlan 과 같다.
         월급 막대는 상담 장과 같은 wkCashBars, 「30일 중 N일」 은 daysOf(준비 · 목표) 그대로(5번)
     다. 칸을 고치면 다시 열었을 때 같이 바뀐다(쌓인 비상금 → 비상금 카드)
     라. 「자세히 보기」 는 그 칸을 셈한 탭으로 — 탭 단추도 같이 켜진다
     마. 여는 문 셋 — 왼쪽 아래 · 대시보드 머리 · 함께 점검 상담 정리 장
     바. 목표 생활비가 비면 「30일 중」 을 세우지 않는다 · 견본이면 견본 띠 · 「요건 충족 시」 · 「심사 결과에 따릅니다」
     사. 폰(390)에서 옆으로 넘치지 않고 글자 13px 아래가 없다 · 페이지 오류 0

   되돌려 보기 — 카드 이유를 다른 글로 바꾸면 나 가 · finMissing 막이를 빼면 가 가 · GLC_TAB 의 debt 를 다른 탭으로 바꾸면 라 가 ·
               정리 장의 wk-door-glc 를 빼면 마 가 웁니다. */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => d.accept());
  await pg.goto('file://' + path.join(ROOT, 'app/finance.html'));
  await pg.waitForFunction(() => typeof glcOpen === 'function' && typeof finSample === 'function' && window.APEX_REPORT, null, { timeout: 15000 });
  await pg.waitForTimeout(400);

  head('가. 숫자가 모자라면 세우지 않는다');
  const g0 = await pg.evaluate(() => { glcOpen(); const o = document.getElementById('glcOv'), t = o ? o.innerText : '';
    const r = { open: !!o, t, cards: o ? o.querySelectorAll('.glc-i').length : -1, won: /\d[\d,]*\s*만\s*원/.test(t) }; glcClose(); return r; });
  is(g0.open && /채우면/.test(g0.t) && /소득/.test(g0.t), '빈 계산기 — 「소득 · 지출 칸을 채우면 결과가 섭니다」');
  is(g0.cards === 0 && !g0.won, '빈 계산기에 카드 · 금액이 하나도 안 선다' + (g0.won ? ' — 금액이 찍힘' : ''));

  head('나. 판정 · 이유 · 순서는 fsPlan 한 곳 그대로');
  await pg.evaluate(() => finSample()); await pg.waitForTimeout(300);
  const g1 = await pg.evaluate(() => {
    glcOpen(); const o = document.getElementById('glcOv');
    const n = wkN().n, F = fsPlan(n), LV = FS_LV;
    const cards = [...o.querySelectorAll('.glc-i')].map((x) => ({ k: x.dataset.k, pill: x.querySelector('.wk-pill').textContent, why: x.querySelector('p').textContent, one: !!x.querySelector('.glc-one') }));
    const want = F.order.map((x) => ({ k: x.k, pill: x.kind ? LV[x.kind] : '아직 몰라요', why: x.why, one: !!(F.first && F.first.k === x.k) }));
    const cnt = { good: 0, warn: 0, bad: 0 }; F.order.forEach((x) => { if (x.kind) cnt[x.kind]++; });
    const tiles = [...o.querySelectorAll('.glc-hero .tile .tv .nb')].map((x) => +x.textContent);
    const tmp = document.createElement('div'); tmp.innerHTML = wkCashBars(F.cash);
    const bars = o.querySelector('[data-glc="cash"] .hb'), wkSl = wkSlides().find((s) => /이해 · 현금흐름/.test(s.html || ''));
    const days = APEX_REPORT.parts.daysOf(n.now, n.goal), dEl = o.querySelector('[data-glc="days"] .glc-d');
    const r = { cards, want, cnt, tiles, bars: bars ? bars.outerHTML : '', want_bars: tmp.firstChild.outerHTML, wk: wkSl ? wkSl.html.indexOf(tmp.firstChild.outerHTML) >= 0 : false,
      days, dTxt: dEl ? dEl.textContent : '', head: (o.querySelector('.glc-hero .wk-h') || {}).textContent || '', first: F.first && F.first.t };
    glcClose(); return r; });
  is(g1.cards.length === g1.want.length && g1.cards.length >= 6, '카드 수 = fsPlan 고칠 순서 수 (' + g1.cards.length + ' / ' + g1.want.length + ')');
  const miss = g1.want.filter((w, i) => !g1.cards[i] || g1.cards[i].k !== w.k || g1.cards[i].pill !== w.pill || g1.cards[i].why !== w.why || g1.cards[i].one !== w.one);
  is(!miss.length, '카드마다 순서 · 딱지 · 이유 글 · 「먼저」 가 fsPlan 과 글자 그대로' + (miss.length ? ' — 어긋남: ' + miss.map((x) => x.k).join(', ') : ''));
  is(g1.tiles.join() === [g1.cnt.good, g1.cnt.warn, g1.cnt.bad].join(), '위의 세 칸(괜찮아요 · 주의 · 점검 필요) = fsPlan 판정 수 — ' + g1.tiles.join(' · '));
  is(!!g1.first && g1.head.indexOf(g1.first.replace(/\s*\(.*\)\s*/, '')) >= 0, '머리글이 fsPlan 의 「먼저」 를 말한다 — ' + g1.head);
  is(g1.bars === g1.want_bars && g1.wk, '월급 막대 = wkCashBars — 함께 점검 상담 현금흐름 장과 같은 한 벌');
  is(g1.dTxt === g1.days + '일', '「30일 중 N일」 = daysOf(준비 · 목표) — ' + g1.dTxt);

  head('다. 칸을 고치면 같이 바뀐다');
  /* 폰에서는 입력 칸이 접혀 있습니다 — 설계사처럼 「✏️ 고객정보 입력」 을 눌러 펼치고 손으로 적습니다 */
  const fillOpen = async (sel, v) => {
    await pg.evaluate((s) => { const e = document.querySelector(s), sec = e && e.closest('.sb-section'); if (sec) sec.classList.add('on'); }, sel);
    if (!(await pg.isVisible(sel))) { await pg.evaluate(() => { if (typeof sbmToggle === 'function') sbmToggle(); }); await pg.waitForTimeout(150); }
    await pg.fill(sel, v); };
  await fillOpen('#s_emerg_acc', '3000'); await pg.waitForTimeout(250);
  const g2 = await pg.evaluate(() => { glcOpen(); const e = document.querySelector('#glcOv .glc-i[data-k="emerg"]'), F = fsPlan(wkN().n), o = F.order.find((x) => x.k === 'emerg');
    const r = { why: e ? e.querySelector('p').textContent : '', want: o.why }; glcClose(); return r; });
  is(g2.why === g2.want && /쌓인 비상금 3,000만/.test(g2.why), '쌓인 비상금 3,000만을 적으면 비상금 카드가 같이 바뀐다 — ' + g2.why);

  head('라. 「자세히 보기」 는 그 칸을 셈한 탭으로');
  const TAB = { cash: 'cashflow', emerg: 'factcheck', fam: 'insurance', me: 'insurance', debt: 'realestate', retire: 'pension' };
  const wrong = [];
  for (const k of Object.keys(TAB)) {
    await pg.evaluate(() => glcOpen());
    await pg.click('#glcOv .glc-i[data-k="' + k + '"] .glc-go'); await pg.waitForTimeout(150);
    const r = await pg.evaluate((t) => ({ pane: (document.querySelector('.tab-pane.on') || {}).id, btn: !!document.querySelector('.report-tab.on[onclick*="\'' + t + '\'"]'), ov: !!document.getElementById('glcOv') }), TAB[k]);
    if (r.pane !== 'tab-' + TAB[k] || !r.btn || r.ov) wrong.push(k + '→' + r.pane);
  }
  is(!wrong.length, '여섯 칸 모두 제 탭으로 가고 위 띠 단추도 켜진다' + (wrong.length ? ' — ' + wrong.join(', ') : ''));

  head('마. 여는 문 셋');
  const doors = await pg.evaluate(() => {
    const r = {}; const tryOpen = (el) => { if (!el) return false; el.click(); const ok = !!document.getElementById('glcOv'); glcClose(); return ok; };
    r.side = tryOpen(document.querySelector('.gen-btn.glc-btn'));
    switchTab('dashboard', document.querySelector('.report-tab'));
    r.dash = tryOpen(document.querySelector('#tab-dashboard .glc-btn'));
    wkOpen(); const S = wkSlides(); WK.i = S.length - 1; WK.key = 'end'; WK.ki = WK.i; wkPaint();
    r.wk = tryOpen(document.querySelector('#wkOv .wk-door-glc')); r.wkGone = !document.getElementById('wkOv');
    return r; });
  is(doors.side && doors.dash, '왼쪽 아래 · 대시보드 머리의 「📊 한눈에 결과」 가 연다');
  is(doors.wk && doors.wkGone, '함께 점검 상담 정리 장의 문이 상담을 닫고 한눈에 결과를 연다');

  head('바. 비면 세우지 않는다 · 견본 띠 · 조건부 말');
  await fillOpen('#s_target', ''); await pg.waitForTimeout(200);
  const g3 = await pg.evaluate(() => { glcOpen(); const o = document.getElementById('glcOv'), d = o.querySelector('[data-glc="days"]');
    const r = { d: d ? d.innerText : '', grid: !!(d && d.querySelector('.dg')), t: o.innerText, sample: !!o.querySelector('.glc-sample') }; glcClose(); return r; });
  is(!g3.grid && /목표 생활비 칸이 비어/.test(g3.d), '목표 생활비가 비면 「30일 중」 칸을 세우지 않고 무엇을 채울지 말한다');
  is(/요건 충족 시/.test(g3.t) && /심사 결과에 따릅니다/.test(g3.t), '「요건 충족 시」 · 「심사 결과에 따릅니다」 를 빼지 않는다(2번)');
  is(!g3.sample, '설계사가 칸을 고친 뒤에는 견본 띠가 없다');
  await pg.evaluate(() => finSample()); await pg.waitForTimeout(200);
  is(await pg.evaluate(() => { glcOpen(); const s = !!document.querySelector('#glcOv .glc-sample'); glcClose(); return s; }), '견본(홍길동)으로 보는 동안은 견본 띠가 선다');

  head('사. 폰 폭 · 오류');
  const g4 = await pg.evaluate(() => { glcOpen(); const o = document.getElementById('glcOv'), body = o.querySelector('.wk-body');
    let small = []; o.querySelectorAll('*').forEach((e) => { if (!e.childNodes.length) return; const has = [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()); if (!has) return;
      const f = parseFloat(getComputedStyle(e).fontSize); if (f < 13) small.push(e.className + ':' + f); });
    const r = { over: body.scrollWidth > body.clientWidth + 1, small: small.slice(0, 4) }; glcClose(); return r; });
  is(!g4.over, '폰 폭(390)에서 옆으로 넘치지 않는다');
  is(!g4.small.length, '글자 13px 아래가 없다' + (g4.small.length ? ' — ' + g4.small.join(' ') : ''));
  is(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 한눈에 결과를 고객 앞에 세울 수 없습니다' : '✓ 한눈에 결과 — fsPlan 한 곳 그대로 · 비면 안 세움 · 문 셋 · 폰 폭'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
