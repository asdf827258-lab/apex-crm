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
     아. 판 X199 (「성별 기본값도 고쳐주고, 사업자 세금 / 퇴직금 / 국민연금 예상수령 / 주택연금 칸도 넣어줘」)
         · 성별은 비어서 시작하고, 비면 연금 셈은 남성 기준이라고 밝힌다 · 성별을 읽는 자리는 finSex 하나
         · 네 칸의 숫자는 finNpsEst · finSevOut · finHouseOut · finBizTax 그대로 — 칸이 비면 숫자 0 개 · 그 칸으로 가는 단추
         · 상담 「퇴직금」 물음의 근속연수가 계산기 칸(s_sev_years)으로 들어간다
     자. 판 X200 (「경비 칸도 넣어줘, 매출 / 실소득을 구분해서 … 큰 틀로 … 노랑우산공제액도 넣어주고」)
         · 사업자는 셋만 묻는다 — 매출/월 · 경비/월(한 숫자) · 노란우산/월
         · 실소득은 s_self 한 칸 — 매출 · 경비가 둘 다 있을 때만 「매출 − 경비」 로 채우고 잠근다. 경비가 비면 매출을 실소득으로 보지 않는다
         · 근거(매출 · 경비)가 사라지면 채웠던 실소득도 비운다 · 사업자 칸에 「매출 − 경비 = 실소득」 한 줄
         · 노란우산은 「모두 공제 한도 안이면」 이라는 조건으로만 — 한도 숫자를 적지 않는다(2번) · 사업자가 아니면 그 칸이 없다

   되돌려 보기 — 카드 이유를 다른 글로 바꾸면 나 가 · finMissing 막이를 빼면 가 가 · GLC_TAB 의 debt 를 다른 탭으로 바꾸면 라 가 ·
               정리 장의 wk-door-glc 를 빼면 마 가 · 성별에 selected 남성을 되살리면 아 가 · 사업자 세금에서 지방소득세를 빼면 아 가 웁니다. */
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

  head('아. 성별 · 노후 돈 · 세금 네 칸 (판 X199)');
  const fs = require('fs'), src = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');
  const fresh = await ctx.newPage(); const ferrs = []; fresh.on('pageerror', (e) => ferrs.push(e.message)); fresh.on('dialog', (d) => d.accept());
  await fresh.goto('file://' + path.join(ROOT, 'app/finance.html'));
  await fresh.waitForFunction(() => typeof glcMoneyHtml === 'function' && window.APEX_REPORT, null, { timeout: 15000 });
  await fresh.waitForTimeout(300);
  const s0 = await fresh.evaluate(() => ({ g: document.getElementById('s_gender').value, sx: finSex() }));
  is(s0.g === '' && !s0.sx.known && s0.sx.sex === '남성', '성별은 비어서 시작한다(「모름 · 고르세요」) — 비면 연금 셈은 남성 기준');
  const sexReads = (src.match(/s_gender['"]\)[^;\n]{0,80}indexOf\(\s*['"](남|여)/g) || []).length + (src.match(/gtext\(\s*['"]s_gender['"]\s*,\s*['"]남성['"]\)/g) || []).length;
  is(sexReads === 0, '성별을 「남/여」 로 따로 읽는 자리가 finSex 밖에 없다 — 전에는 다섯 곳이 비면 남성 · 여성으로 갈렸습니다' + (sexReads ? ' — ' + sexReads + '곳' : ''));
  is(/opt:\[\['','모름 · 고르세요'\],'남성','여성'\]/.test(src), '입력지(팩트파인딩)의 성별도 「모름」 이 먼저');
  const M = async (setup) => fresh.evaluate((st) => { (new Function(st))(); const box = document.createElement('div'); box.innerHTML = glcMoneyHtml();
    const g = (k) => { const e = box.querySelector('[data-m="' + k + '"]'); return e ? { cls: e.className, chip: (e.querySelector('.glc-chip') || {}).textContent, nb: [...e.querySelectorAll('.glc-mv .nb, .hb-v')].map((x) => x.textContent), t: e.textContent, bars: !!e.querySelector('.hb'), fill: !!e.querySelector('.glc-fill') } : null; };
    return { nps: g('nps'), sev: g('sev'), house: g('house'), biz: g('biz'), sex: !!box.querySelector('.glc-sex'), all: box.textContent,
      ne: finNpsEst(), so: finSevOut(), ho: finHouseOut(), bz: finBizTax(), man: (x) => x }; }, setup.toString().replace(/^[^{]*\{|\}$/g, ''));
  const e0 = await M(() => {});
  is(['nps', 'sev', 'house', 'biz'].every((k) => e0[k] && e0[k].nb.length === 0 && e0[k].fill), '칸이 비면 네 칸 모두 숫자 0 개 · 그 칸으로 가는 단추');
  is(e0.sex && /남성 기준/.test(e0.all), '성별이 비면 「남성 기준이에요 · 성별 고르기」 를 밝힌다');
  const e1 = await M(() => { const set = (o) => { for (const k in o) { const e = document.getElementById(k); e.value = o[k]; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    set({ s_age: '45', s_rage: '60', s_gross: '6000', s_severance: '15000', s_realty: '50000', s_self: '300', s_gender: '여성' }); });
  is(e1.nps.chip === '추정' && e1.nps.nb[0] === String(Math.round(e1.ne.monthly)) && /노후 계산에는 넣지 않았어요/.test(e1.nps.t), '국민연금 칸이 비면 「추정」 — 값은 finNpsEst 그대로(' + e1.nps.nb[0] + ') · 노후 계산에는 안 넣었다고 밝힌다');
  is(e1.sev.chip === '근속연수 모름' && e1.sev.fill && e1.sev.nb.length >= 1 && !e1.sev.bars, '근속연수가 비면 퇴직소득세를 세우지 않고 「근속연수 넣기」');
  is(e1.house.chip === '추정' && e1.house.nb[0] === Number(e1.ho.man).toLocaleString('ko-KR') && /심사 결과에 따릅니다/.test(e1.house.t), '주택연금 = finReady 의 housePension 그대로(' + e1.house.nb[0] + '만) · 심사 결과에 따릅니다');
  const wantBiz = Math.round(await fresh.evaluate(() => APEX_REPORT.calc.incomeTax(3600) * (1 + APEX_REPORT.calc.RULE.localTax) / 12));
  is(e1.biz.nb[0] === String(wantBiz) && /공제를 빼기 전 어림/.test(e1.biz.t) && /합쳐 신고하면/.test(e1.biz.t), '사업자 세금 = 종합소득세 기본세율 × (1 + 지방소득세) ÷ 12 (' + e1.biz.nb[0] + '만 · 공제 전 어림 · 월급과 합치면 늘 수 있다고 밝힘)');
  is(!e1.sex, '성별을 고르면 「남성 기준」 쪽지가 내려간다');
  /* 상담 「퇴직금」 물음에서 근속연수를 적으면 계산기 칸으로 */
  const w = await fresh.evaluate(() => { wkOpenAt('sev'); wkAnswer('sev', '확인됨'); const i = document.getElementById('wkIn2'); i.value = '20'; i.dispatchEvent(new Event('input', { bubbles: true })); const v = document.getElementById('s_sev_years').value; wkClose(); return v; });
  const e2 = await M(() => {});
  const T = await fresh.evaluate(() => { const t = APEX_REPORT.calc.retireTax(15000, 20), m = APEX_REPORT.man; return [m(t.total), m(t.irpEarly), m(t.irpLate)]; });
  is(w === '20' && e2.sev.chip === '세금 추정' && e2.sev.nb.slice(-3).join() === T.join(), '상담에서 근속연수 20년을 적으면 s_sev_years 로 들어가고, 퇴직소득세 셋 = retireTax 그대로 — ' + e2.sev.nb.slice(-3).join(' · '));
  const e3 = await M(() => { const e = document.getElementById('s_rage'); e.value = '50'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  is(e3.house.nb.length === 0 && /아직 가입할 수 있는 나이가 아니에요/.test(e3.house.t), '은퇴 나이가 가입 나이 전이면 주택연금 숫자를 세우지 않는다');
  const e4 = await M(() => { const set = (o) => { for (const k in o) { const e = document.getElementById(k); e.value = o[k]; e.dispatchEvent(new Event('input', { bubbles: true })); } }; set({ s_self: '', s_jobg: 'self', s_nps: '80' }); });
  is(e4.biz.nb.length === 0 && /자영업자로 고르셨는데/.test(e4.biz.t), '자영업자인데 사업 소득이 비면 숫자 없이 「칸이 비었어요」');
  is(e4.nps.chip === '공단 조회액' && e4.nps.nb[0] === '80', '국민연금 조회액을 적으면 「공단 조회액 80」');
  is(!/NaN|undefined|Infinity/.test(e1.all + e2.all + e3.all + e4.all), '네 칸에 NaN · undefined 0');
  await fresh.evaluate(() => { const e = document.getElementById('s_gender'); e.value = ''; e.dispatchEvent(new Event('change', { bubbles: true })); try { switchTab('pension', document.querySelector('.report-tab[onclick*="\'pension\'"]')); } catch (x) {} });
  await fresh.waitForTimeout(300);
  is(await fresh.evaluate(() => !!document.querySelector('#pension-sim .fin-sexnote')), '연금 시뮬레이션 탭도 성별이 비면 「남성 기준으로 셈했어요」 를 밝힌다');
  const fl = await fresh.evaluate(() => { glcOpen(); glcFill('s_sev_years'); return { ov: !!document.getElementById('glcOv'), f: document.activeElement && document.activeElement.id }; });
  is(!fl.ov && fl.f === 's_sev_years', '「근속연수 넣기 ›」 는 한눈에 결과를 닫고 그 칸에 손이 가게 한다');
  is(!ferrs.length, '페이지 오류 0' + (ferrs.length ? ' — ' + ferrs[0] : ''));
  await fresh.close();

  head('자. 매출 · 경비 · 실소득 · 노란우산 (판 X200)');
  const bp = await ctx.newPage(); const berrs = []; bp.on('pageerror', (e) => berrs.push(e.message)); bp.on('dialog', (d) => d.accept());
  await bp.goto('file://' + path.join(ROOT, 'app/finance.html'));
  await bp.waitForFunction(() => typeof finBizSync === 'function' && window.APEX_REPORT, null, { timeout: 15000 });
  await bp.evaluate(() => finSample()); await bp.waitForTimeout(200);
  const B = (v) => bp.evaluate((v) => { for (const k in v) { const e = document.getElementById(k); e.value = v[k]; e.dispatchEvent(new Event('input', { bubbles: true })); }
    const box = document.createElement('div'); box.innerHTML = glcMoneyHtml(); const g = (k) => { const e = box.querySelector('[data-m="' + k + '"]'); return e ? { t: e.textContent, chip: (e.querySelector('.glc-chip') || {}).textContent, nb: [...e.querySelectorAll('.glc-mv .nb')].map((x) => x.textContent), flow: [...e.querySelectorAll('.glc-flow b')].map((x) => x.textContent), fill: (e.querySelector('.glc-fill') || {}).outerHTML || '', tx: [...e.querySelectorAll('.glc-ml, .glc-mn')].map((x) => x.textContent).join(' ') } : null; };
    const self = document.getElementById('s_self'); return { self: self.value, ro: self.readOnly, inc: finCore().income, mg: finCore().monthlyGross, biz: g('biz'), yel: g('yellow') }; }, v);
  is(await bp.evaluate(() => ['s_biz_rev', 's_biz_cost', 's_yellow'].every((id) => !!document.getElementById(id))), '사업자 칸 셋 — 매출/월 · 경비/월 · 노란우산/월');
  const b1 = await B({ s_self: '', s_biz_rev: '1000' });
  is(b1.self === '' && !b1.ro && b1.biz.nb.length === 0 && /경비 넣기/.test(b1.biz.fill), '경비가 비면 매출 1,000을 실소득으로 보지 않는다 — 실소득 칸은 비고 「경비 넣기 ›」');
  is(!b1.yel, '실소득을 모르면 노란우산 칸도 세우지 않는다');
  const b2 = await B({ s_biz_cost: '600' });
  const want = await bp.evaluate(() => { const C = APEX_REPORT.calc, L = 1 + C.RULE.localTax; return { per: Math.round(C.incomeTax(4800) * L / 12) }; });
  is(b2.self === '400' && b2.ro && b2.inc === b2.mg + 400, '매출 1,000 · 경비 600 → 실소득 칸 400 으로 채워 잠그고, 그 400 이 소득 셈(finCore)에 들어간다');
  is(b2.biz.flow.join('|') === '1,000만|600만|400만', '사업자 칸에 「매출 − 경비 = 실소득」 한 줄 — ' + b2.biz.flow.join(' · '));
  is(b2.biz.nb[0] === String(want.per), '매달 떼어 둘 돈 = 실소득 한 해 × 기본세율 × (1 + 지방소득세) ÷ 12 (' + b2.biz.nb[0] + '만)');
  is(b2.yel && b2.yel.chip === '넣고 계신가요' && b2.yel.nb.length === 0 && /s_yellow/.test(b2.yel.fill), '노란우산이 비면 숫자 없이 「노란우산 넣기 ›」');
  const b3 = await B({ s_yellow: '25' });
  const ysave = await bp.evaluate(() => { const C = APEX_REPORT.calc, L = 1 + C.RULE.localTax; return Math.round((C.incomeTax(4800) - C.incomeTax(4500)) * L); });
  is(b3.yel.nb[0] === String(ysave) && b3.yel.chip === '한도 안이면' && /모두 공제 한도 안이면/.test(b3.yel.t), '노란우산 월 25 → 줄어드는 세금 = 세금(4,800) − 세금(4,500) (' + b3.yel.nb[0] + '만) · 「모두 공제 한도 안이면」 조건을 밝힌다');
  is(!/한도[^.·]{0,8}\d/.test(b3.yel.tx) && /요건 충족 시/.test(b3.yel.tx), '노란우산 칸에 공제 한도 숫자를 적지 않는다 · 「요건 충족 시」(2번)');
  const b4 = await B({ s_biz_cost: '' });
  is(b4.self === '' && !b4.ro, '경비를 지우면 「매출 − 경비」 로 채웠던 실소득도 비고 잠금이 풀린다 — 근거 없는 400 이 남지 않는다');
  const b5 = await B({ s_biz_rev: '', s_self: '300' });
  is(b5.self === '300' && !b5.ro && b5.biz.flow.length === 0 && /매출이 아니라 실소득/.test(b5.biz.t), '실소득만 적으면 그대로 쓰고 「세금은 매출이 아니라 실소득에」 를 말한다');
  const b6 = await B({ s_self: '', s_yellow: '', s_jobg: '' });
  is(!b6.yel && /해당 없음/.test(b6.biz.chip), '사업자가 아니면 노란우산 칸이 없고 사업자 세금은 「해당 없음」');
  is(!berrs.length, '페이지 오류 0' + (berrs.length ? ' — ' + berrs[0] : ''));
  await bp.close();

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
