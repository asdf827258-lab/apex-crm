/* 함께 점검 상담 — 이해 · 위기 · 같이 점검이 한 흐름으로 서나 (판 X171)

   사장님 말씀 2026-10-22 「응 계산기도 좋지만, 전반적인 이해를 시킬수 있는 상담과 느끼도록 하는
   위기감 그리고 같이 점검할수 있는 시스템」 — 계산기(app/finance.html)의 「🧭 함께 점검 상담」.

   설계사가 고객 앞에서 한 장씩 넘기는 화면이라, 여기서 틀리면 그 자리에서 깨집니다.
     가. 단추로 열리고 <b>맨 위에</b> 서나 — 떠 있는 「트랙 골라 열기」 단추(z 9999)가 「다음」 을
         가려 눌리지 않던 것을 실제로 겪었습니다. 「다음」 한가운데를 누르면 「다음」 이 눌리나
     나. 순서 — 시작 → 이해 → 위기 → 점검(아홉) → 정리
     다. ★★ 숫자가 한 곳에서 오나 — 위기 장의 30일 칸 · 「지금 빈칸」 막대의 「준비」 가
         연금 시뮬레이션 탭의 「지금 준비된 것」 · 결과지와 같은 값인가 (0-1번 · 5번)
     라. ★★ 같이 점검 — 답을 고르고 숫자를 적으면 계산기 칸에 들어가고 「지금 빈칸」 이 그 자리에서
         다시 셈해지나 · 정리의 셈(확인 · 모름/아니요 · 안 물음)이 답과 맞나 ·
         모름·아니요가 「다음 만남 전까지 같이 채울 것」 과 결과지 「함께 점검」 장에 그대로 서나 (1번)
     마. 위기감은 고객 숫자로만 — 바깥 통계·「노후 파산」 같은 말이 장 어디에도 없나 (1번)
     바. 이름은 가린 채 · 답만 이 브라우저에 (3번) · 닫았다 열면 그 장 그대로 · 「처음부터」 는 답만 지우나
     사. 글씨 13px · 누르는 것 44px 바닥 · 페이지 오류 0
     아. 판 X172 (사장님 말씀 「재무설계로써의 배치 그리고 보험은 가족을 지키는 역할 내 연금을 지키는 역할의
         분배 나이대마다 필요한 보험의 분배전략」) — 재무설계의 집 · 보험의 두 역할 · 「가족은 몇 달」 ·
         「아프면 연금을 깨요」 가 <b>칸 값으로 따로 셈한 달 수</b>와 맞나 · 전략 장이 고객 나이대를 켜고
         「APEX 상담 원칙 · 정답이 아님」 을 밝히나 · 결과지 「보장 전략」 장이 같은 달 수를 말하나
     카. 판 X175 (사장님 말씀 「미래 장면에도 본인 대출을 넣어서 다시 셈해줘 · 기존 재무설계계산기를 따와서
         기능들을 가져오되 재해석해서 재구성해」) — 미래 장면의 소득 셈에 본인 대출(그때 0) · 현금흐름 · 대출 ·
         교육비 · 남길 것 · 고칠 순서 장이 서나 · 판정이 계산기 기준(저축률 · DSR · LTV)과 같나 · 결과지 장
     차. 판 X174 (사장님 말씀 「배수는 평균 데이터를 기준으로 하고 직업군을 나누어서 다시 나눠서 해줘」) —
         소득 셈의 배수가 직업군 평균(2025년 가계금융복지조사)에서 오나 · 자영업자를 고르면 빚 배수 1.56 ·
         일해서 버는 몫 82% · 모르면 「전체」 라고 적나 · 출처를 밝히나
     자. 판 X173 (사장님 말씀 「평균 값으로 구하고 소득에 따라 구하고 가족에 따라 구해서 기준값을 만들어」) —
         기준값 = 평균 · 소득 · 가족의 가운데 값 · 무게 = 두 기준값의 크기 · 자가 칸 값으로 따로 셈한 수와 맞나 ·
         평균은 출처(기관·언론사·날짜)를 밝히나 · 못 찾은 평균은 비우나 · 막내 나이를 모르면 가족 셈을 비우나

   되돌려 보기 —
     · .wk-ov 의 z-index 를 9998 로 → 가 가 웁니다
     · wkResult 에서 모름을 할 일로 안 올리면 → 라 가 웁니다
     · wkSlides 의 n.now 를 따로 셈하면(예: ×1.1) → 다 가 웁니다
     · 장 글에 「노후 파산」 을 넣으면 → 마 가 웁니다                                           */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const strip = (h) => h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/src="data:[^"]+"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const nos = (x) => String(x || '').replace(/\s+/g, '');
const SCARE = /노후\s*파산|파산|빈곤층|고독사|하류|\d+(\.\d+)?\s*%\s*의\s*(노인|은퇴자|국민|가구|사람|직장인)|통계청|OECD|평균\s*수명/;

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  let dialogs = 0; pg.on('dialog', (d) => { dialogs++; d.accept(); });
  await pg.goto('file://' + path.join(ROOT, 'app', 'finance.html'));
  await pg.waitForFunction(() => window.APEX_REPORT && window.PENSION && typeof wkOpen === 'function', null, { timeout: 15000 });
  await pg.evaluate(() => {
    try { localStorage.removeItem('wk_v1'); } catch (e) {}
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('s_name', '홍길동'); set('s_age', '42'); set('s_rage', '65'); set('s_gross', '9000'); set('s_target', '400');
  });
  await pg.waitForTimeout(400);

  head('가. 단추로 열리고 맨 위에 서나');
  is(await pg.evaluate(() => !!document.querySelector('button[onclick="wkOpen()"]')), '「🧭 함께 점검 상담」 단추가 있다');
  await pg.evaluate(() => wkOpen());
  await pg.waitForSelector('#wkOv .wk-card');
  const top = await pg.evaluate(() => {
    const n = document.querySelector('#wkOv .wk-next'), r = n.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return at === n || n.contains(at);
  });
  is(top, '「다음」 한가운데를 누르면 「다음」 이 눌린다 — 떠 있는 단추가 가리지 않는다');

  head('나. 순서 — 시작 → 이해 → 위기 → 전략 → 점검 → 정리');
  const S = await pg.evaluate(() => wkSlides().map((x) => x.part));
  const ORD = ['시작', '이해', '위기', '전략', '점검', '정리'];
  is(S.every((p, i) => i === 0 || ORD.indexOf(p) >= ORD.indexOf(S[i - 1])), S.join(' → '));
  is(S.filter((p) => p === '이해').length >= 2 && S.filter((p) => p === '위기').length >= 2, '이해 장 · 위기 장이 둘 이상씩');
  is(S.filter((p) => p === '점검').length === (await pg.evaluate(() => WK_ITEMS.length)), '점검 장 = 물음 표(WK_ITEMS) 하나에서 — ' + S.filter((p) => p === '점검').length + '장');

  head('다. 숫자가 한 곳에서 오나 (0-1번 · 5번)');
  const tabNow = await pg.evaluate(() => {
    const box = [...document.querySelectorAll('#pension-sim div')].find((x) => x.children.length >= 2 && /^지금 준비된 것$/.test((x.children[0].textContent || '').trim()));
    return box ? box.children[1].textContent.replace(/[^\d]/g, '') : null;
  });
  const texts = [];
  for (let i = 0; i < S.length; i++) {
    await pg.evaluate((i) => { WK.i = i; wkPaint(); }, i);
    texts.push(await pg.$eval('#wkOv .wk-body', (e) => e.innerText));
  }
  const crisis = texts[S.indexOf('위기')];
  const ready = (nos(crisis).match(/지금준비된돈\(([\d,]+)만원\)/) || [])[1];
  is(tabNow && ready && ready.replace(/,/g, '') === tabNow, '위기 장의 「지금 준비된 돈」 = 탭의 「지금 준비된 것」 — 탭 ' + tabNow + '만 · 상담 ' + (ready || '없음'));
  const meter = (nos(texts[S.indexOf('점검')]).match(/준비([\d,]+)만원\/목표/) || [])[1];
  is(meter && meter.replace(/,/g, '') === tabNow, '「지금 빈칸」 막대의 준비 = 탭 — ' + (meter || '없음'));
  const n = await pg.evaluate(() => rptData({})._n);
  const days = await pg.evaluate((n) => APEX_REPORT.parts.daysOf(n.now, n.goal), n);
  is(nos(crisis).includes('30일중' + days + '일'), '30일 중 ' + days + '일 — 결과지와 같은 자(daysOf)로');

  head('라. 같이 점검 — 답이 계산기와 결과지로 이어지나');
  const iGoal = S.indexOf('점검');
  await pg.evaluate((i) => { WK.i = i; wkPaint(); }, iGoal);
  const before = await pg.$eval('#wkOv .wk-meter', (e) => e.innerText);
  await pg.click('#wkOv .wk-a[data-s="확인됨"]');
  await pg.fill('#wkIn', '350');
  await pg.waitForTimeout(250);
  const after = await pg.$eval('#wkOv .wk-meter', (e) => e.innerText);
  is((await pg.$eval('#s_target', (e) => e.value)) === '350', '적은 숫자가 계산기 칸(s_target)에 들어간다');
  is(before !== after && /목표 350만 원/.test(after), '「지금 빈칸」 이 그 자리에서 다시 셈해진다 — ' + before.replace(/\s+/g, ' ') + ' → ' + after.replace(/\s+/g, ' '));
  const plan = { rage: '확인됨', nps: '모름', acc: '모름', sev: '아니요', emerg: '확인됨' };
  for (const k of Object.keys(plan)) {
    await pg.evaluate((k) => { WK.i = wkSlides().findIndex((x) => x.item && x.item.k === k); wkPaint(); }, k);
    await pg.click('#wkOv .wk-a[data-s="' + plan[k] + '"]');
  }
  await pg.evaluate(() => { WK.i = wkSlides().length - 1; wkPaint(); });
  const end = await pg.$eval('#wkOv .wk-body', (e) => e.innerText);
  const R = await pg.evaluate(() => wkResult());
  is(R.ok === 3 && R.items.length === 6, '셈이 답과 맞다 — 확인 ' + R.ok + ' · 답한 것 ' + R.items.length);
  is(/확인했어요\s*3\s*가지/.test(end) && /모르거나 아니요\s*3\s*가지/.test(end) && new RegExp('아직 안 물음\\s*' + (S.filter((p) => p === '점검').length - 6) + '\\s*가지').test(end), '정리 장이 확인 3 · 모름/아니요 3 · 안 물음 ' + (S.filter((p) => p === '점검').length - 6) + ' 을 적는다');
  const wantTodo = ['국민연금 공단 조회액', '연금저축·IRP·달러·변액 쌓인 금액', '퇴직금 예상액·근속연수'];
  is(wantTodo.every((t) => end.includes(t)), '모름·아니요가 「다음 만남 전까지 같이 채울 것」 에 선다');
  const [pop] = await Promise.all([ctx.waitForEvent('page'), pg.click('#wkOv .wk-end button:first-child')]);
  await pop.waitForLoadState();
  const rh = await pop.content(), rt = strip(rh);
  is(/함께 점검/.test(rt) && /6가지 중 3가지 확인/.test(rt) && /모름/.test(rt) && /아니요/.test(rt), '결과지에 「함께 점검」 장 — 모름·아니요를 숨기지 않는다');
  is(!/이 질문에 바로 답할 수 있나요/.test(rt), '같이 점검했으면 「스스로 점검」 물음을 다시 싣지 않는다(두 벌 금지)');
  is(wantTodo.some((t) => nos(rt).includes(nos(t))), '확인 못 한 것이 결과지 「같이 할 일」 로 올라간다');
  is(/홍○○/.test(rt) && !/홍길동/.test(rh), '결과지는 가린 이름');
  await pop.close();

  head('아. 보험의 자리 — 배치 · 두 역할 · 몇 달 · 나이대 분배 (판 X172)');
  const T = texts.join('\n');
  ['재무설계는 집이에요', '보험은 두 가지를 지켜요', '가족은 몇 달을 버틸까요', '진단비로 몇 달을 버틸까요', '기준값으로 나눠요'].forEach((k) => is(nos(T).includes(nos(k)), '「' + k + '」 장이 선다'));
  is(S.indexOf('전략') > S.lastIndexOf('위기') && S.indexOf('전략') < S.indexOf('점검'), '전략 장은 위기 다음 · 점검 앞');
  /* 자는 앱의 셈을 빌리지 않고 칸 값으로 따로 셉니다 — 같은 셈을 빌리면 틀려도 같이 틀립니다 */
  await pg.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }; set('ins_life', '30000'); set('s_debt', '25000'); set('ins_cancer_dx', '3000'); });
  const want = await pg.evaluate(() => {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0;
    const living = ['s_housing', 's_loan', 's_food', 's_telecom', 's_transport', 's_insurance', 's_medical', 's_edu', 's_support', 's_dining', 's_shopping', 's_travel', 's_choice_etc'].reduce((a, id) => a + v(id), 0);
    return { fam: Math.floor((v('ins_life') - v('s_debt')) / (living - v('s_loan'))), me: Math.floor(v('ins_cancer_dx') / living), living };
  });
  const insTxt = [];
  for (const k of ['가족은 몇 달', '진단비로<br>몇 달']) {
    await pg.evaluate((k) => { WK.i = wkSlides().findIndex((x) => x.html && x.html.indexOf(k) >= 0); wkPaint(); }, k);
    insTxt.push(await pg.$eval('#wkOv .wk-body', (e) => e.innerText));
  }
  is(nos(insTxt[0]).includes(want.fam + '개월') && nos(insTxt[0]).includes('2억5,000만원'), '가족이 버티는 달 = (사망보험금 − 대출) ÷ 대출 뺀 생활비 = ' + want.fam + '개월');
  is(nos(insTxt[1]).includes(want.me + '개월'), '진단비로 버티는 달 = 암 진단비 ÷ 생활비 = ' + want.me + '개월');
  is(/심사 결과에 따릅니다/.test(insTxt[1]), '내 연금 지키기 장에 「심사 결과에 따릅니다」 (2번)');
  await pg.evaluate(() => { WK.i = wkSlides().findIndex((x) => x.part === '전략'); wkPaint(); });
  /* 판 X173 — 무게는 기준값에서. 자는 앱의 ipBase 를 빌리지 않고 칸 값 · IP_RULE · IP_AVG 로 따로 셉니다 */
  await pg.evaluate(() => { const e = document.getElementById('inh_youngest'); e.value = '10'; e.dispatchEvent(new Event('input', { bubbles: true }));
    const g = document.getElementById('s_jobg'); g.value = 'self'; g.dispatchEvent(new Event('change', { bubbles: true })); });
  /* 판 X174 — 소득 셈의 배수는 직업군 평균(가계금융복지조사)에서. 자는 보도자료 표의 숫자를 따로 들고 셉니다 */
  const SELF = { inc: 8000, debt: 12479, work: 1741, biz: 4833 };
  const exp = await pg.evaluate((J) => {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0, R = IP_RULE;
    const mid = (a) => { a = a.filter((x) => x != null).sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
    const own = v('s_gross') + v('s_self') * 12;
    const living = ['s_housing', 's_loan', 's_food', 's_telecom', 's_transport', 's_insurance', 's_medical', 's_edu', 's_support', 's_dining', 's_shopping', 's_travel', 's_choice_etc'].reduce((a, id) => a + v(id), 0);
    const famL = living - v('s_loan');
    const fam = mid([IP_AVG.fam ? IP_AVG.fam.v : null, own * J.debt / J.inc, v('s_debt') + famL * 12 * Math.max(0, R.indepAge - v('inh_youngest'))]);
    const me = mid([IP_AVG.me ? IP_AVG.me.v : null, own * (J.work + J.biz) / J.inc * R.meMonths / 12, living * R.meMonths]);
    /* 판 X175 — 미래 장면은 소득 셈에도 본인 대출(그때 0)을: 빚 배수 × (그때 대출 ÷ 지금 대출) */
    const later = mid([IP_AVG.fam ? IP_AVG.fam.v : null, v('s_debt') > 0 ? own * J.debt / J.inc * 0 / v('s_debt') : own * J.debt / J.inc, famL * 12 * R.spouseYears]);
    return { fam, me, w: Math.round(fam / (fam + me) * 20) * 5, wLater: Math.round(later / (later + me) * 20) * 5 };
  }, SELF);
  await pg.evaluate(() => { WK.i = wkSlides().findIndex((x) => x.part === '전략'); wkPaint(); });
  const st = await pg.$eval('#wkOv .wk-body', (e) => e.innerText);
  const M = (x) => pg.evaluate((x) => APEX_REPORT.man(x), x);
  is(nos(st).includes(nos('기준값 (가운데) ' + (await M(exp.fam)) + ' ' + (await M(exp.me)))), '기준값 — 가족 ' + (await M(exp.fam)) + ' · 내 연금 ' + (await M(exp.me)) + ' (평균·소득·가족의 가운데 값)');
  is(nos(st).includes('가족지키기' + exp.w + '%') && (exp.wLater === exp.w ? !/옮겨 가요/.test(st) : nos(st).includes(exp.wLater + ':' + (100 - exp.wLater))), '무게 ' + exp.w + ' : ' + (100 - exp.w) + ' → 대출 끝·자녀 독립 후 ' + exp.wLater + ' : ' + (100 - exp.wLater) + ' (기준값의 크기로)');
  is(/생명보험협회/.test(st) && /아주경제 2022\.05\.15/.test(st) && /데이터솜 2022\.01\.19/.test(st), '평균은 출처(기관 · 언론사 · 날짜)를 밝힌다(9번)');
  is(/출처 확인 전/.test(st) && /출처를 확인하지 못해 비웠어요/.test(st), '출처를 못 찾은 평균(진단·치료비)은 비우고 그렇다고 적는다(1번)');
  is(/APEX 원칙\(가정\)/.test(st), '가족 셈의 기간(막내 독립 · 치료 기간)은 「APEX 원칙(가정)」 이라 적는다');
  is(/자영업자 평균으로 셈했어요/.test(st) && /빚 배수 1\.56/.test(st) && /일해서 버는 몫 82%/.test(st), '직업군(자영업자)을 고르면 그 평균의 배수로 — 빚 배수 1.56 · 일해서 버는 몫 82%');
  is(/가계금융복지조사/.test(st) && /2025\.12\.04/.test(st), '배수의 출처(2025년 가계금융복지조사 · 2025.12.04)를 밝힌다(9번)');
  await pg.evaluate(() => { const g = document.getElementById('s_jobg'); g.value = ''; g.dispatchEvent(new Event('change', { bubbles: true })); WK.i = wkSlides().findIndex((x) => x.part === '전략'); wkPaint(); });
  is(/전체 \(직업군 모름\) 평균으로 셈했어요/.test(await pg.$eval('#wkOv .wk-body', (e) => e.innerText)), '직업군을 모르면 「전체」 평균으로 셈하고 그렇다고 적는다(1번)');
  await pg.evaluate(() => { const g = document.getElementById('s_jobg'); g.value = 'self'; g.dispatchEvent(new Event('change', { bubbles: true })); });
  is(await pg.evaluate(() => IP_AGE.every((x) => x.fam == null && x.me == null) && IP_AGE.length === 5), '나이대 표에 근거 없는 비율이 남지 않았다');
  await pg.evaluate(() => { const e = document.getElementById('inh_youngest'); e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); WK.i = wkSlides().findIndex((x) => x.part === '전략'); wkPaint(); });
  is(/막내 나이 필요/.test(await pg.$eval('#wkOv .wk-body', (e) => e.innerText)), '자녀가 있는데 막내 나이를 모르면 가족 셈을 비우고 「막내 나이 필요」');
  await pg.evaluate(() => { const e = document.getElementById('inh_youngest'); e.value = '10'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  const [popI] = await Promise.all([ctx.waitForEvent('page'), pg.evaluate(() => wkReport('open'))]);
  await popI.waitForLoadState();
  const ri = strip(await popI.content());
  is(/보장 전략/.test(ri) && nos(ri).includes('내가없으면가족이버티는기간' + want.fam + '개월'), '결과지 「보장 전략」 장 — 같은 ' + want.fam + '개월');
  is(/기준값/.test(ri) && /APEX 원칙\(가정\)/.test(ri) && /아주경제 2022\.05\.15/.test(ri), '결과지에도 기준값 표 · 출처 · 「APEX 원칙(가정)」');
  await popI.close();

  head('카. 계산기 기능을 상담 말로 재구성 (판 X175)');
  await pg.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('r_mortgage', '20000'); set('r_house_val', '50000'); set('inh_total', '250000'); });
  const fsT = await pg.evaluate(() => wkSlides().filter((x) => x.html).map((x) => x.html.replace(/<[^>]+>/g, ' ')).join('\n'));
  ['어디로 가고 있나요', '노후를 먹나요', '교육비와 노후가', '세금이 들어요', '이 순서로 고쳐요'].forEach((k) => is(nos(fsT).includes(nos(k)), '「' + k + '」 장이 선다'));
  /* 판정은 자가 칸 값으로 따로 셉니다 — 계산기 기준(저축률 · DSR · LTV)을 그대로 */
  const fx = await pg.evaluate(() => {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0;
    const income = Math.round(v('s_gross') / 12) + v('s_self') + v('s_spouse') + v('s_passive') + v('s_other');
    const fixed = ['s_housing', 's_loan', 's_food', 's_telecom', 's_transport', 's_insurance', 's_medical', 's_edu', 's_support'].reduce((a, id) => a + v(id), 0);
    const choice = ['s_dining', 's_shopping', 's_travel', 's_choice_etc'].reduce((a, id) => a + v(id), 0);
    const saving = ['s_emerg', 's_pension', 's_irp', 's_isa', 's_taxfree', 's_general'].reduce((a, id) => a + v(id), 0);
    const surplus = income - fixed - choice - saving, sr = saving / income * 100;
    const r = v('r_mortgage_rate') / 100 / 12, m = v('r_mortgage'), pay = Math.round(m * r * Math.pow(1 + r, 360) / (Math.pow(1 + r, 360) - 1));
    const dsr = pay / income * 100, ltv = m / v('r_house_val') * 100;
    const F = fsPlan(rptData({})._n), get = (k) => (F.order.find((o) => o.k === k) || {}).kind;
    return { cash: surplus >= 0 && sr >= 20 ? 'good' : surplus >= 0 ? 'warn' : 'bad', debt: dsr <= 35 && ltv <= 60 ? 'good' : (dsr <= 45 || ltv <= 70 ? 'warn' : 'bad'), appCash: get('cash'), appDebt: get('debt'), dsr: Math.round(dsr), ltv: Math.round(ltv), appDsr: Math.round(F.debt.dsr) };
  });
  is(fx.cash === fx.appCash, '「고칠 순서」 의 남는 돈 판정 = 계산기 기준 그대로 (' + fx.cash + ')');
  is(fx.debt === fx.appDebt && fx.dsr === fx.appDsr, '대출 판정 · DSR = 계산기 그대로 (DSR ' + fx.dsr + '% · LTV ' + fx.ltv + '% → ' + fx.debt + ')');
  await pg.evaluate(() => { WK.i = wkSlides().findIndex((x) => x.html && x.html.indexOf('이 순서로 고쳐요') >= 0); wkPaint(); });
  const ord = await pg.$eval('#wkOv .wk-body', (e) => e.innerText);
  is(/남는 돈[\s\S]*비상금[\s\S]*가족 지키기[\s\S]*내 연금 지키기[\s\S]*대출[\s\S]*노후 연금/.test(ord), '고칠 순서가 재무설계의 집 순서 — 남는 돈 · 비상금 · 보장 → 대출 → 노후 연금');
  is(/먼저 \S/.test(ord) && /부터 같이 손봐요/.test(ord), '「먼저 ○○부터」 — 판정이 가능이 아닌 첫 칸을 짚는다');
  is(/추정/.test(fsT) && /세무 전문가/.test(fsT), '상속세는 「추정 · 세무 전문가 확인」 (2번)');
  const [popF] = await Promise.all([ctx.waitForEvent('page'), pg.evaluate(() => wkReport('open'))]);
  await popF.waitForLoadState();
  const rf = strip(await popF.content());
  is(/재무 점검/.test(rf) && /대출이 노후를 먹나요/.test(rf) && /고칠 순서/.test(rf), '결과지에 「대출 · 교육비 · 남길 것」 · 「고칠 순서」 장');
  await popF.close();

  head('마. 위기감은 고객 숫자로만 (1번)');
  const all = texts.join('\n') + end;
  is(!SCARE.test(all), '바깥 통계·겁주는 말이 없다' + (SCARE.test(all) ? ' — ' + all.match(SCARE)[0] : ''));
  is(/가정/.test(texts.join('')), '전환계수·물가처럼 가정한 값은 「가정」 이라 적는다');

  head('바. 이름 · 저장 · 다시 열기 (3번)');
  is(/홍○○/.test(texts[0]) && !/홍길동/.test(all), '상담 화면도 가린 이름');
  const saved = await pg.evaluate(() => localStorage.getItem('wk_v1') || '');
  is(saved && !/홍/.test(saved), '이 브라우저에는 답만 — 이름이 없다');
  await pg.evaluate(() => { WK.i = 5; wkPaint(); wkClose(); wkOpen(); });
  is((await pg.evaluate(() => WK.i)) === 5 && (await pg.evaluate(() => wkResult().items.length)) === 6, '닫았다 열면 그 장 · 그 답 그대로');
  await pg.keyboard.press('Escape');
  is(!(await pg.$('#wkOv')), 'Esc 로 닫힌다');
  await pg.evaluate(() => { wkOpen(); WK.i = wkSlides().length - 1; wkPaint(); });
  await pg.click('#wkOv .wk-end .wk-g');
  is(dialogs >= 1 && (await pg.evaluate(() => wkResult().items.length)) === 0 && (await pg.$eval('#s_target', (e) => e.value)) === '350',
    '「처음부터」 는 한 번 더 묻고 답만 지운다 — 계산기에 적은 숫자는 그대로');

  head('사. 글씨 · 누르는 것');
  let tiny = 0, small = 0;
  for (let i = 0; i < S.length; i++) {
    await pg.evaluate((i) => { WK.i = i; wkPaint(); if (wkSlides()[i].item) wkAnswer(wkSlides()[i].item.k, '확인됨'); }, i);
    const r = await pg.evaluate(() => {
      const ov = document.getElementById('wkOv');
      const t = [...ov.querySelectorAll('*')].filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 13 && e.getBoundingClientRect().width > 0);
      const s = [...ov.querySelectorAll('button,input:not([type=checkbox])')].filter((e) => e.getBoundingClientRect().height < 44 && e.getBoundingClientRect().width > 0);
      return { t: t.map((e) => e.textContent.trim().slice(0, 20)), s: s.length };
    });
    tiny += r.t.length; small += r.s;
    if (r.t.length) console.log('      · ' + (i + 1) + '장 13px 밑: ' + r.t.slice(0, 3).join(' / '));
  }
  is(tiny === 0, '13px 밑 글자 0');
  is(small === 0, '44px 밑 단추·칸 0');
  is(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 함께 점검 상담을 고객 앞에 세울 수 없습니다' : '✓ 함께 점검 상담 — 이해 · 위기 · 같이 점검이 한 흐름으로 서고, 숫자는 한 곳에서 옵니다'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
