/* 함께 점검 상담 — 이해 · 위기 · 같이 점검이 한 흐름으로 서나 (판 X164)

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
     아. 판 X165 (사장님 말씀 「재무설계로써의 배치 그리고 보험은 가족을 지키는 역할 내 연금을 지키는 역할의
         분배 나이대마다 필요한 보험의 분배전략」) — 재무설계의 집 · 보험의 두 역할 · 「가족은 몇 달」 ·
         「아프면 연금을 깨요」 가 <b>칸 값으로 따로 셈한 달 수</b>와 맞나 · 전략 장이 고객 나이대를 켜고
         「APEX 상담 원칙 · 정답이 아님」 을 밝히나 · 결과지 「보장 전략」 장이 같은 달 수를 말하나

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

  head('아. 보험의 자리 — 배치 · 두 역할 · 몇 달 · 나이대 분배 (판 X165)');
  const T = texts.join('\n');
  ['재무설계는 집이에요', '보험은 두 가지를 지켜요', '가족은 몇 달을 버틸까요', '연금을 깨게 돼요', '보험의 무게는'].forEach((k) => is(nos(T).includes(nos(k)), '「' + k + '」 장이 선다'));
  is(S.indexOf('전략') > S.lastIndexOf('위기') && S.indexOf('전략') < S.indexOf('점검'), '전략 장은 위기 다음 · 점검 앞');
  /* 자는 앱의 셈을 빌리지 않고 칸 값으로 따로 셉니다 — 같은 셈을 빌리면 틀려도 같이 틀립니다 */
  await pg.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }; set('ins_life', '30000'); set('s_debt', '25000'); set('ins_cancer_dx', '3000'); });
  const want = await pg.evaluate(() => {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0;
    const living = ['s_housing', 's_loan', 's_food', 's_telecom', 's_transport', 's_insurance', 's_medical', 's_edu', 's_support', 's_dining', 's_shopping', 's_travel', 's_choice_etc'].reduce((a, id) => a + v(id), 0);
    return { fam: Math.floor((v('ins_life') - v('s_debt')) / (living - v('s_loan'))), me: Math.floor(v('ins_cancer_dx') / living), living };
  });
  const insTxt = [];
  for (const k of ['가족은 몇 달', '연금을 깨게']) {
    await pg.evaluate((k) => { WK.i = wkSlides().findIndex((x) => x.html && x.html.indexOf(k) >= 0); wkPaint(); }, k);
    insTxt.push(await pg.$eval('#wkOv .wk-body', (e) => e.innerText));
  }
  is(nos(insTxt[0]).includes(want.fam + '개월') && nos(insTxt[0]).includes('2억5,000만원'), '가족이 버티는 달 = (사망보험금 − 대출) ÷ 대출 뺀 생활비 = ' + want.fam + '개월');
  is(nos(insTxt[1]).includes(want.me + '개월'), '진단비로 버티는 달 = 암 진단비 ÷ 생활비 = ' + want.me + '개월');
  is(/심사 결과에 따릅니다/.test(insTxt[1]), '내 연금 지키기 장에 「심사 결과에 따릅니다」 (2번)');
  await pg.evaluate(() => { WK.i = wkSlides().findIndex((x) => x.part === '전략'); wkPaint(); });
  const st = await pg.evaluate(() => ({ on: (document.querySelector('#wkOv .wk-ages .on b') || {}).textContent, txt: document.querySelector('#wkOv .wk-body').innerText, band: ipBand(42).band }));
  is(st.on === '40대' && st.band === '40대', '42세 → 40대 줄이 켜진다');
  is(/APEX 상담 원칙/.test(st.txt) && /정답이 아니라/.test(st.txt), '분배 비율은 「APEX 상담 원칙 · 정답이 아니라 출발점」 이라 밝힌다(1번)');
  is(await pg.evaluate(() => IP_AGE.every((x) => x.fam + x.me === 100) && IP_AGE.length === 5), '나이대 표 다섯 줄 — 가족 + 내 연금 = 100');
  const [popI] = await Promise.all([ctx.waitForEvent('page'), pg.evaluate(() => wkReport('open'))]);
  await popI.waitForLoadState();
  const ri = strip(await popI.content());
  is(/보장 전략/.test(ri) && nos(ri).includes('내가없으면가족이버티는기간' + want.fam + '개월'), '결과지 「보장 전략」 장 — 같은 ' + want.fam + '개월');
  is(/APEX 상담 원칙/.test(ri), '결과지에도 「APEX 상담 원칙」');
  await popI.close();

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
