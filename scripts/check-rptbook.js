/* 결과지 「한 권」 — 계산기를 재무설계의 집 순서로 엮었나 (판 X181)

   사장님 말씀 2026-10-23 「만약 재무설계 계산기 내용과 병합한다면 어떻게 구성할지 목차로 만들어줘」 →
   「전부 펼친 한권」. 계산기 탭(현금흐름 · 팩트체크 · 투자 · 보험 · 연금 · 부동산·대출 · 교육자금 · 상속)을
   지금 → 바닥 → 기둥 → 지붕 → 남길 것 → 오늘의 제안 → 같이 한 것 일곱 부로 엮은 한 권입니다.

   엮다가 찾은 것 — 숫자가 고객 것이 아니었던 자리
     · 부동산·대출 탭에 견본 값(주택 시세 5억 · 주담대 2억)이 미리 들어 있고, 손대지 않아도 계산기가 그것으로
       DSR · LTV 를 셌습니다. 「집 6억 · 빚 2.8억 · 월 120만 상환」 이라고 말한 분 결과지에 「DSR 13% · LTV 40%」 가
       찍혔는데, 둘 다 견본 집의 숫자였습니다.
     · 팩트체크 「생존 개월수」 가 꼭 나가는 돈 ÷ <b>매달 모으는</b> 비상금으로 셈해, 월 10만 원 모으는 분께
       「44개월 · 양호」 라고 적었습니다. 버틸 달은 <b>쌓인</b> 비상금으로만 셀 수 있습니다.

   여기서 못 박는 것 (실제로 결과지를 열어)
     가. 목차가 서고 · 부가 1부부터 차례로 · 목차의 장 번호·제목 = 본문의 장 번호·제목
     나. 숫자가 없는 장은 서지 않는다 — 상속재산이 비면 5부 · 막내가 지원 나이가 아니면 국가 지원금
         (채우면 선다 · 국가 지원금은 출처와 기준월을 단다)
     다. ★★ 견본 값이 고객 숫자로 찍히지 않는다 — 부동산 탭을 안 건드리면 DSR = 매달 원리금 ÷ 월 소득 ·
         LTV = 총부채 ÷ 부동산 · 점수 장과 대출 장이 같은 수 / 탭에 주담대를 적으면 그것으로
     라. ★★ 비상금 — 쌓인 금액을 모르면 「모름」(탭과 결과지 둘 다) · 적으면 쌓인 금액 ÷ 꼭 나가는 돈
     마. 은퇴 뒤 건보료 · 국민연금 장에 금액 숫자 0(제도·요건에 달린 값 · 2번) · 「공단」 으로 확인하라고 말한다
     바. 인쇄에서 부마다 새 쪽 · NaN 0 · 오류 0

   되돌려 보기 — finTouched 를 늘 참으로 하면 다 · 팩트체크를 「꼭 나가는 돈 ÷ 매달 모으는 비상금」 으로
               되돌리면 라 · rptData 의 toc 를 빼면 가 · PLAN 에서 est 를 늘 세우면 나 가 웁니다.          */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const SIDE = { s_name: '홍길동', s_age: '44', s_gross: '6800', s_spouse: '150', s_housing: '25', s_loan: '120', s_food: '90', s_telecom: '18', s_transport: '35',
  s_insurance: '38', s_medical: '10', s_edu: '85', s_support: '20', s_dining: '40', s_shopping: '25', s_travel: '15', s_choice_etc: '10',
  s_emerg: '10', s_emerg_acc: '', s_pension: '30', s_irp: '0', s_isa: '20', s_taxfree: '0', s_general: '10', s_realty: '60000', s_debt: '28000',
  s_nps: '', s_target: '300', s_rage: '60', inh_total: '', inh_children: '2', inh_youngest: '9', ins_life: '10000', ins_cancer_dx: '2000' };

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => d.accept());
  await pg.goto('file://' + path.join(ROOT, 'app', 'finance.html'));
  await pg.waitForFunction(() => window.APEX_REPORT && typeof rptData === 'function', null, { timeout: 15000 });
  await pg.evaluate((V) => { try { localStorage.removeItem('wk_v1'); } catch (e) {} const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    Object.keys(V).forEach((k) => set(k, V[k])); }, SIDE);
  const book = () => pg.evaluate(() => { const h = APEX_REPORT.html(rptData({})); const d = document.createElement('div'); d.innerHTML = h.replace(/<style[\s\S]*?<\/style>/g, '');
    const toc = [...d.querySelectorAll('.toc .tc-l li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim());
    const parts = [...d.querySelectorAll('.part .pk')].map((x) => x.textContent.trim());
    const secs = [...d.querySelectorAll('section.sec')].map((x) => ({ no: (x.querySelector('.sk b') || {}).textContent || '', title: x.querySelector('h2').textContent.replace(/\s+/g, ' ').trim(), text: x.textContent.replace(/\s+/g, ' ') }));
    return { html: h, toc: toc, parts: parts, secs: secs, text: d.textContent.replace(/\s+/g, ' ') }; });
  const sec = (B, re) => B.secs.find((x) => re.test(x.title)) || { text: '' };
  const nos = (x) => String(x || '').replace(/\s+/g, '');

  let B = await book();
  head('가. 목차 · 부 · 장 번호');
  is(B.toc.length >= 15, '목차가 선다 — ' + B.toc.length + '장');
  is(B.parts.join(' ') === ['1부', '2부', '3부', '4부', '6부', '7부'].join(' '), '부가 차례로 — ' + B.parts.join(' · ') + ' (상속재산이 비어 5부는 없음)');
  is(B.toc.join('|') === B.secs.map((x) => x.no + ' ' + x.title).join('|') || B.toc.every((t, i) => t.replace(/\s/g, '') === (B.secs[i].no + B.secs[i].title).replace(/\s/g, '')), '목차의 장 번호·제목 = 본문의 장 번호·제목');
  is(/월급이 어디로/.test(B.secs[0].title) && /여섯 줄로/.test(B.secs[B.secs.length - 1].title), '첫 장은 「월급이 어디로」 · 끝 장은 「한눈에 요약」');

  head('나. 숫자가 없는 장은 서지 않나 · 채우면 서나');
  is(!/남길 때 드는 세금/.test(B.text), '상속재산이 비면 「남길 때 드는 세금」 0');
  is(!/국가 지원금/.test(B.text), '막내 9세 — 국가 지원금 0');
  await pg.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }; set('inh_total', '250000'); set('inh_youngest', '3'); });
  const B2 = await book();
  is(B2.parts.includes('5부') && /남길 때 드는 세금/.test(B2.text), '상속재산을 적으면 5부 「남길 때 드는 세금」 이 선다');
  const gov = sec(B2, /교육비와 노후/).text;
  is(/국가 지원금/.test(gov) && /보건복지부/.test(gov) && /기준/.test(gov), '막내 3세 — 국가 지원금이 출처 · 기준월과 함께 선다');
  await pg.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }; set('inh_total', ''); set('inh_youngest', '9'); });

  head('다. ★★ 견본 값이 고객 숫자로 찍히지 않나');
  const want = await pg.evaluate(() => { const v = (id) => parseFloat(document.getElementById(id).value) || 0; const inc = Math.round(v('s_gross') / 12) + v('s_spouse');
    return { dsr: Math.round(v('s_loan') / inc * 100), ltv: Math.round(v('s_debt') / v('s_realty') * 100), demoLtv: Math.round(v('r_mortgage') / v('r_house_val') * 100) }; });
  const worth = sec(B, /가진 것과 갚을 것/).text, score = sec(B, /재무 건전성 점수/).text;
  is(nos(worth).includes('월급중대출로나가는몫' + want.dsr + '%') && nos(worth).includes('집값대비빚' + want.ltv + '%'), '대출 — 매달 원리금 ÷ 월 소득 ' + want.dsr + '% · 총부채 ÷ 부동산 ' + want.ltv + '% (견본 집 ' + want.demoLtv + '% 아님)');
  is(score.includes('월급 중 대출 몫 ' + want.dsr + '%') && score.includes('집값 대비 빚 ' + want.ltv + '%'), '점수 장의 대출 칸도 같은 수 — 한 권에 두 답 0');
  is(!/주담대 ÷ 주택 시세/.test(worth), '부동산 탭을 안 건드리면 「주담대 ÷ 주택 시세」 라고 적지 않는다');
  await pg.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }; set('r_house_val', '60000'); set('r_mortgage', '28000'); });
  const B3 = await book();
  is(/주담대 ÷ 주택 시세/.test(sec(B3, /가진 것과 갚을 것/).text) && nos(sec(B3, /가진 것과 갚을 것/).text).includes('집값대비빚47%'), '부동산 탭에 적으면 그 값으로 센다 (주담대 2.8억 ÷ 6억 = 47%)');
  await pg.evaluate(() => { ['r_house_val', 'r_mortgage'].forEach((id) => { const e = document.getElementById(id); e.value = e.defaultValue; delete e.dataset.touched; e.dispatchEvent(new Event('change')); delete e.dataset.touched; }); });

  head('라. ★★ 비상금 — 쌓인 금액으로만 버틸 달을 세나');
  const fcTab = async () => pg.evaluate(() => { switchTab('factcheck', document.querySelector('.report-tab')); const t = (document.getElementById('factcheck-full') || {}).innerText || ''; const i = t.indexOf('생존 개월수'); return t.slice(i, i + 160); });
  B = await book();
  const t0 = await fcTab();
  is(/모름/.test(t0) && !/44개월/.test(t0), '팩트체크 탭 — 쌓인 비상금을 모르면 「모름」 (매달 10만 원으로 「44개월」 0)');
  is(/쌓인 비상금을 몰라 셀 수 없어요/.test(sec(B, /세 가지 점검/).text) && nos(sec(B, /비상금 —/).text).includes('버틸수있는기간모름'), '결과지도 「모름」 — 탭과 한 답');
  await pg.evaluate(() => { const e = document.getElementById('s_emerg_acc'); e.value = '1323'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  const t1 = await fcTab(); const B4 = await book();
  is(/3개월/.test(t1) && /= 3개월/.test(sec(B4, /세 가지 점검/).text), '쌓인 비상금 1,323만 원 ÷ 꼭 나가는 돈 441만 원 = 3개월 — 탭과 결과지 같은 수');
  is(/1,323만 원/.test(sec(B4, /가진 것과 갚을 것/).text), '적은 비상금은 「가진 것」 에도 들어간다');
  await pg.evaluate(() => { const e = document.getElementById('s_emerg_acc'); e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });

  head('마. 은퇴 뒤 건보료 · 국민연금 — 지어낸 금액 0');
  const after = sec(B, /건보료와 국민연금/).text;
  is(after.length > 50 && !/\d[\d,]*만 원/.test(after) && !/\d+%/.test(after), '금액 · 비율 숫자 0 (제도·요건에 달린 값 · 2번)');
  is(/국민건강보험공단 모의계산/.test(after) && /공단 조회/.test(after), '어디서 확인하는지 말한다');

  head('바. 인쇄 · 오류');
  is(/\.part\{break-before:page/.test(B.html), '인쇄에서 부마다 새 쪽');
  is(!/NaN|undefined/.test(B.text + B2.text + B3.text + B4.text) && !errs.length, 'NaN · undefined 0 · 페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 한 권이 고객 숫자로 서지 않습니다' : '✓ 한 권 — 일곱 부 · 목차 = 본문 · 견본 값 0 · 모르면 「모름」'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
