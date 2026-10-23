/* 결과지가 통보하지 않고 설명하나 (판 X179)

   사장님 말씀 2026-10-23 「통보하듯이 말하지말고 이해가 될 수 있도록 만들어야지 말투나 내용부터」.
   직접 고객(홍길동 · 44세 회사원)이 되어 함께 점검 상담을 「다음」 으로 넘기며 끝까지 받아 보니,
   말투보다 먼저 <b>내용이 틀린 자리</b>가 있었습니다.
     · 은퇴 나이를 60세로 적자 앞쪽 장 하나가 빠지며 「다음」 이 <b>국민연금 물음을 건너뛰었다</b>
     · 국민연금 칸이 비어 뺀 채로 「64만 원만 들어와요 · 월급이 91% 줄어드는 셈」 이라고 첫 장에 적었다
       (빠졌다는 말은 맨 끝 「꼭 읽어 주세요」 에만)
     · 「비상금 따로 없어요」 라고 답했는데 「잘하고 계신 것: 비상금을 따로 모으고 계세요 · 비상금 — 가능」
     · 「대출이 은퇴 뒤에도 남아요」 라고 답했는데 대출 판정 「가능」
     · 「가족이 버티는 기간 0개월」 옆에 「보장 · 가족 지키기 — 가능 · 기준값을 넘어요」
     · 「1억 8,000만 원이 가족에게 남아요」(남는 건 빚인데 받는 돈으로 읽힘) · 「월 531만 원로」

   여기서 못 박는 것 (실제로 「다음」 을 눌러 가며)
     가. ★★ 장이 늘고 줄어도 물음을 하나도 건너뛰지 않고 · 두 번 묻지 않는다
     나. ★★ 국민연금 칸이 비면 히어로 · 30일 칸 · 막대 · 판정 · 빈칸 카드 · 요약이 「빠졌다」 고 같이 말한다 —
         칸을 채우면 그 말이 사라진다(헛말 0 · 8번)
     다. ★★ 고객의 답이 판정을 이긴다 — 비상금 「아니요」 면 칭찬 0 · 「가능」 0 / 대출 「아니요」 면 대출 「가능」 0
     라. 「0개월」 과 「가족 지키기 — 가능」 이 한 결과지에 같이 서지 않는다
     마. 딱지마다 이유 — 판정 카드가 어떤 자로 붙였는지 말하고, 고칠 순서 줄마다 고객 숫자 + 계산기 기준을 말한다
     바. 선고하던 말이 돌아오지 않았다 — 「…만 들어와요」 · 「월급이 N% 줄어드는 셈」 · 「N% 줄어요」 · 「판정은요」
     사. 빚을 돈처럼 적지 않는다 · 조사 「원로」 0

   되돌려 보기 — wkGo 를 번호로만 넘기게 되돌리면 가 · rptData 의 unknown 을 비우면 나 ·
               fsPlan 에서 fsAns('emerg') 를 빼면 다 · 가족 지키기 0개월 보정을 빼면 라 가 웁니다. */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const SIDE = { s_name: '홍길동', s_age: '44', s_gender: '남성', s_job: '회사원', s_gross: '6800', s_spouse: '150', s_self: '0', s_passive: '0', s_other: '0',
  s_housing: '25', s_loan: '120', s_food: '90', s_telecom: '18', s_transport: '35', s_insurance: '38', s_medical: '10', s_edu: '85', s_support: '20',
  s_dining: '40', s_shopping: '25', s_travel: '15', s_choice_etc: '10', s_emerg: '10', s_pension: '30', s_irp: '0', s_isa: '20', s_taxfree: '0', s_general: '10',
  s_realty: '60000', s_debt: '28000', s_severance: '0', s_pen_now: '0', s_retire_pen: '0', s_nps: '', s_target: '400', s_rage: '65',
  ins_monthly: '38', ins_life: '0', ins_cancer_dx: '2000', ins_brain: '1000', ins_heart: '500', ins_caregiver: '0', ins_homecare: '0' };
const ANS = { goal: ['확인됨', '300'], rage: ['확인됨', '60'], nps: ['모름'], acc: ['확인됨', '1800'], sev: ['모름'], emerg: ['아니요'], care: ['아니요'], spouse: ['모름'],
  loan: ['아니요'], jobg: ['확인됨', 'reg'], kid: ['확인됨', '9'], life: ['확인됨', '10000'], renew: ['모름'], silson: ['모름'] };

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => d.accept());
  await pg.goto('file://' + path.join(ROOT, 'app', 'finance.html'));
  await pg.waitForFunction(() => window.APEX_REPORT && typeof wkOpen === 'function', null, { timeout: 15000 });
  await pg.evaluate((V) => {
    try { localStorage.removeItem('wk_v1'); } catch (e) {}
    const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    Object.keys(V).forEach((k) => set(k, V[k]));
  }, SIDE);
  await pg.waitForTimeout(300);

  /* 칸이 빈 채로 받은 결과지 — 비교용(나) */
  const before = await pg.evaluate(() => APEX_REPORT.html(rptData({})));

  head('가. 「다음」 만 눌러 끝까지 — 물음을 건너뛰지도, 두 번 묻지도 않나');
  await pg.evaluate(() => wkOpen()); await pg.waitForSelector('#wkOv .wk-card');
  const seen = [];
  for (let step = 0; step < 60; step++) {
    const cur = await pg.evaluate(() => { const s = wkSlides()[WK.i]; return { k: s.item ? s.item.k : null, end: !!s.end }; });
    if (cur.k) {
      seen.push(cur.k);
      const [st, val] = ANS[cur.k];
      await pg.click('#wkOv .wk-a[data-s="' + st + '"]');
      if (val) { const tag = await pg.$eval('#wkIn', (e) => e.tagName).catch(() => null); if (tag === 'SELECT') await pg.selectOption('#wkIn', val); else if (tag) await pg.fill('#wkIn', val); }
    }
    if (cur.end) break;
    await pg.click('#wkOv .wk-next');
  }
  const want = await pg.evaluate(() => WK_ITEMS.map((x) => x.k));
  is(seen.join(' ') === want.join(' '), '물음 ' + want.length + '개를 차례대로 한 번씩 — ' + seen.join(' · '));
  is(seen.includes('nps'), '은퇴 나이를 당겨도(장이 하나 빠져도) 국민연금 물음이 선다');

  const html = await pg.evaluate(() => APEX_REPORT.html(rptData({})));
  const txt = (h) => h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const T = txt(html), T0 = txt(before);
  const D = await pg.evaluate(() => { const d = rptData({}); return { one: d.oneLine, lead: d.worryLead, note: d.worryNote, fill: d.fill, sum: d.summary.join('\n'), sec: JSON.stringify(d.sections), good: d.good.join('\n') }; });

  head('나. 국민연금 칸이 비면 빠졌다고 같이 말하나 — 맨 끝 면책에만 두지 않고');
  is(/국민연금/.test(D.one) && /빠져/.test(D.one), '히어로 한 줄에 「국민연금이 빠져 있어요」');
  is(D.lead === '지금 알고 있는 돈으로만' && /국민연금은 넣지 않았어요/.test(D.note || ''), '30일 칸 머리 「지금 알고 있는 돈으로만」 · 쪽지 「국민연금은 넣지 않았어요」');
  is(/여기엔 \*\*국민연금/.test(D.sec), '은퇴 막대 아래 「여기엔 국민연금 … 빠져 있어요」');
  is(/국민연금[^"]*을 빼고 센 판정/.test(D.sec), '판정 카드 「… 빼고 센 판정이라 달라질 수 있어요」');
  is(/이 빈칸은 국민연금[^.]*빼고 센 것이에요/.test(T), '빈칸 카드 「이 빈칸은 국민연금 … 빼고 센 것이에요」');
  is(/빼고 셈\)/.test(D.sum), '요약 첫 줄에 「(국민연금 … 빼고 셈)」');
  /* 칸을 채우면 그 말이 사라져야 합니다 — 늘 붙는 말은 헛말입니다(8번) */
  const filled = await pg.evaluate(() => { const e = document.getElementById('s_nps'); e.value = '140'; e.dispatchEvent(new Event('input', { bubbles: true }));
    const d = rptData({}); const o = { one: d.oneLine, lead: d.worryLead, note: d.worryNote || '' }; e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); return o; });
  is(!/국민연금/.test(filled.one) && !/국민연금은 넣지 않았어요/.test(filled.note), '국민연금 140만 원을 채우면 「빠졌어요」 가 사라진다');

  head('다. 고객의 답이 판정을 이기나');
  is(!/비상금\*\*을 따로 모으고 계세요/.test(D.good), '「비상금 따로 없어요」 라고 답하면 「잘하고 계신 것」 에 비상금 칭찬 0');
  const order = await pg.evaluate(() => { const F = fsPlan(rptData({})._n); const o = {}; F.order.forEach((x) => { o[x.k] = { kind: x.kind, why: x.why }; }); return { o: o, debtSub: F.debt.sub }; });
  is(order.o.emerg.kind !== 'good' && /없다고 하셨어요/.test(order.o.emerg.why), '고칠 순서 「비상금」 이 「가능」 이 아니고 · 고객이 한 말을 그대로 적는다');
  is(order.o.debt.kind !== 'good' && /남는다고 하셨어요/.test(order.o.debt.why), '「대출이 은퇴 뒤에도 남아요」 → 대출 「가능」 0 · 이유에 고객의 말');
  is(!/이하면 가능/.test(order.debtSub), '대출 판정 칸 밑글이 「… 이하면 가능」 으로 딱지(주의)와 엇갈리지 않는다');

  head('라. 「0개월」 과 「가족 지키기 — 가능」 이 같이 서지 않나');
  const fam = await pg.evaluate(() => { const I = ipPlan(); return { months: I.famMonths, left: I.left }; });
  is(fam.months === 0 && fam.left < 0, '이 고객은 사망보험금이 대출보다 적다 (0개월) — 견줄 자리가 선다');
  is(order.o.fam.kind !== 'good' && /0개월/.test(order.o.fam.why), '그러면 「보장 · 가족 지키기」 도 「가능」 이 아니고, 이유에 「0개월」');

  head('마. 딱지마다 이유가 붙나');
  is(/계산기는 목표를 다 채우면 「가능」/.test(D.sec), '판정 카드가 어떤 자로 딱지를 붙였는지 말한다');
  const rule = await pg.evaluate(() => ({ save: FIN_RULE.saveGood, dsr: FIN_RULE.dsrOk }));
  is(order.o.cash.why.includes(rule.save + '%') && /월급의 \d+%/.test(order.o.cash.why), '「남는 돈」 줄 — 고객 저축률과 계산기 기준(' + rule.save + '%)을 같이');
  is(order.o.debt.why.includes(rule.dsr + '%') && /월급 중 대출로 나가는 몫 \d+%/.test(order.o.debt.why), '「대출」 줄 — 고객 숫자(월급 중 대출 몫)와 계산기 기준(' + rule.dsr + '%)을 같이');
  is(/를? ?빼고 남은 돈이에요/.test(D.sec), '「매달 116만 원이 남아요」 가 무엇을 빼고 남은 돈인지 말한다');

  head('바. 선고하던 말이 돌아오지 않았나');
  [[/만 들어와요/, '「…만 들어와요」'], [/월급이 \d+% 줄어드는 셈/, '「월급이 N% 줄어드는 셈」'], [/판정은요/, '「판정은요」'], [/매달 약 [^ ]+ 원을 더 모아야 해요/, '「매달 약 N을 더 모아야 해요」']].forEach(([re, m]) => is(!re.test(T), m + ' 0'));
  const slides = await pg.evaluate(() => wkSlides().filter((s) => s.html).map((s) => s.html).join(' '));
  is(!/\d+%\*?\*? 줄어요\. 줄어든 만큼/.test(slides) && !/연금을 깨게 돼요<\/h2>/.test(slides), '상담 장에도 「N% 줄어요 · 줄어든 만큼 …」 · 「연금을 깨게 돼요」 제목 0');
  is(/조회 전 · 모름/.test(slides), '노후 세 층 — 비운 국민연금을 「비어 있어요」 가 아니라 「조회 전 · 모름」');

  head('사. 빚을 돈처럼 · 조사');
  is(!/(?<!대출 )[\d,억만 ]+원이 가족에게 남아요/.test(T) && /갚지 못한 대출/.test(T), '가족에게 남는 것이 「갚지 못한 대출」 이라고 적는다');
  is(!/원로 /.test(T) && !/원로\./.test(T), '「월 531만 원로」 같은 조사 0');

  is(!/NaN|undefined/.test(T) && !errs.length, 'NaN · undefined 0 · 페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  is(T0.length > 1000, '(비교용 결과지도 섰다)');
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 결과지가 아직 통보합니다' : '✓ 결과지가 이유를 말합니다 — 빠진 것 · 고객의 답 · 기준을 같이'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
