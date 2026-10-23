/* 재무설계 상담자료가 원툴 순서로 엮였나 (판 X181)

   사장님 말씀 2026-10-23 「결과지말고 상담자료부터 내용들을 채워서 만들어줘」.
   app/재무설계/상담자료.html 의 장(46장 + 표지 · 마무리)을 재무설계의 집 순서로 엮었습니다 —
   시작 → 1부 지금 → 2부 바닥 → 3부 기둥 → 4부 지붕 → 5부 남길 것 → 6부 오늘의 제안 → 7부 같이 한 것.
   장 안의 내용은 그대로 두고, buildSlides 끝에서 DECK_PLAN 한 곳의 순서로 엮습니다.
   계산기에만 있던 장 셋(세 가지 점검 · 가진 것과 갚을 것 · 보험료는 알맞나요)을 이 자료의 칸으로 셉니다.

   여기서 못 박는 것 (실제로 자료를 만들어)
     가. 표지가 처음 · 마무리가 끝 · 부 머리 장이 차례로 · 부 안의 장이 DECK_PLAN 순서대로
     나. ★ 한 장도 잃지 않았다 — 같은 장이 두 번 서지도 않는다 (표에 없는 장은 마무리 앞에)
     다. 목차(AGENDA)가 일곱 부를 말한다 · 부 머리 장의 장 목록 = 그 부에 실제로 선 장
     라. ★★ 새 장 셋 — 예적금 칸이 비면 「모름」 · 적으면 예적금 ÷ 매달 꼭 나가는 돈 ·
         대출이 은퇴 뒤까지 가면 「은퇴 뒤 N년」 · 실손은 가입 / 미가입(세대 숫자를 지어내지 않음)
     마. ★ 기준이 계산기와 같다 — DECK_RULE 의 비상금 · 보험료율 · 저축률 · DSR · LTV 가 계산기
         FIN_RULE · IP_RULE 과 같은 값 · 「적정 8~10%」 같은 다른 기준이 글자로 남지 않음(5번)
     바. 「오늘 어디까지 보실까요」 에서 보장을 빼면 새 보험료 장도 같이 빠진다 · 페이지 오류 0

   되돌려 보기 — buildSlides 가 deckOrder 를 안 부르면 가 · 마무리를 마지막 장으로만 찾으면 가 ·
               DECK_RULE.premHi 를 12 로 바꾸면 마 · 새 장이 예적금 빈칸을 0 으로 세면 라 가 웁니다. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DECK = path.join(ROOT, 'app', '재무설계', '상담자료.html');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const SIDE = { f_name: '홍길동', f_age: '44', f_job: '회사원', f_sincome: '150', f_income: '567', f_etc: '0', f_living: '263', f_house: '25', f_edu: '85', f_ins: '38',
  f_loan: '120', f_loanyr: '22', f_home: '60000', f_cash: '', f_inv: '', f_dc: '', f_debt: '28000', f_save: '70', f_ret: '60', f_life: '90', f_retspend: '300',
  f_np: '', f_pp: '30', c_death: '10000', c_cancer: '2000', c_brain: '1000', c_heart: '500', c_care: '0' };

(async () => {
  const src = fs.readFileSync(DECK, 'utf8'), fin = fs.readFileSync(path.join(ROOT, 'app', 'finance.html'), 'utf8');
  head('마. 기준이 계산기와 같은가 (글자)');
  const deckRule = eval('(' + (src.match(/var DECK_RULE=(\{[^}]*\})/) || [])[1] + ')');
  const num = (re) => +((fin.match(re) || [])[1]);
  const want = { emergOk: num(/emergOk:(\d+)/), emergWarn: num(/emergWarn:(\d+)/), premLo: num(/premLo:(\d+)/), premHi: num(/premHi:(\d+)/), saveGood: num(/saveGood:(\d+)/),
    dsrOk: num(/dsrOk:(\d+)/), dsrWarn: num(/dsrWarn:(\d+)/), ltvOk: num(/ltvOk:(\d+)/), ltvWarn: num(/ltvWarn:(\d+)/) };
  Object.keys(want).forEach((k) => is(deckRule[k] === want[k], 'DECK_RULE.' + k + ' ' + deckRule[k] + ' = 계산기 ' + want[k]));
  is(!/적정 8~10%/.test(src), '「적정 8~10%」 가 글자로 남지 않음 — 보험료율은 한 기준(8~15%)');

  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => d.accept());
  await pg.goto('file://' + DECK); await pg.waitForTimeout(600);
  const build = async (V) => {
    await pg.evaluate((V) => { for (const k in V) { const e = document.getElementById(k); if (e) { e.value = V[k]; e.dispatchEvent(new Event('input', { bubbles: true })); } }
      if (!document.querySelector('#kids .kid-row')) { addKid('첫째', 12); addKid('막내', 9); } }, V);
    return pg.evaluate(() => { const r = analyze(collect()); const S = buildSlides(r);
      return { S: S.map((h) => ({ cover: h.indexOf('apex-star') >= 0, eb: deckEb(h), ti: deckTitle(h), txt: h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') })), plan: DECK_PLAN, exp: r.expenseTot }; });
  };
  const A = await build(SIDE);
  const S = A.S;

  head('가. 표지 · 부 · 순서');
  is(!S[0].eb && S[0].cover, '첫 장은 표지(STARRING)');
  is(!S[S.length - 1].eb && /계획은 이제 숫자가 됐습니다/.test(S[S.length - 1].txt), '끝 장은 마무리 「계획은 이제 숫자가 됐습니다」');
  const parts = S.map((x, i) => [x.eb, i]).filter((x) => /^PART \d$/.test(x[0]));
  is(parts.map((x) => x[0]).join(' ') === 'PART 1 PART 2 PART 3 PART 4 PART 5 PART 6 PART 7', '부 머리 장이 1부부터 7부까지 차례로 — ' + parts.map((x) => x[0]).join(' · '));
  let orderOk = true, why = '';
  A.plan.forEach((P, pi) => { const seen = S.map((x) => x.eb).filter((e) => P.e.indexOf(e) >= 0); const exp = P.e.filter((e) => seen.indexOf(e) >= 0);
    if (seen.join('|') !== exp.join('|')) { orderOk = false; why = P.no; }
    if (pi > 0 && seen.length) { const at = S.findIndex((x) => x.eb === 'PART ' + pi), first = S.findIndex((x) => x.eb === seen[0]); if (!(at >= 0 && first === at + 1)) { orderOk = false; why = P.no + ' 머리'; } } });
  is(orderOk, '부마다 장이 DECK_PLAN 순서대로 · 부 머리 바로 뒤에서 시작' + (why ? ' — 어긋난 곳 ' + why : ''));
  is(S.findIndex((x) => x.eb === 'DIAGNOSIS') > S.findIndex((x) => x.eb === 'PART 1'), '「44세의 지금, 진짜 문제는 세 가지」 가 1부에 선다');

  head('나. 한 장도 잃지 않았나 · 두 번 서지 않나');
  const ebs = S.map((x) => x.eb).filter((e) => e && !/^PART \d$/.test(e));
  const dup = ebs.filter((e, i) => ebs.indexOf(e) !== i);
  is(!dup.length, '같은 장이 두 번 서지 않는다' + (dup.length ? ' — ' + dup.join(' · ') : ''));
  const pushed = (src.match(/S\.push\(\s*'(?:<!--nostep-->)?<div class="s-eyebrow">([^<]+)</g) || []).map((x) => x.replace(/.*s-eyebrow">/, '').replace(/<$/, '').replace(/&amp;/g, '&').trim());
  const always = pushed.filter((e) => ['IN THE NEWS'].indexOf(e) < 0);
  const lost = always.filter((e) => ebs.indexOf(e) < 0);
  is(always.length >= 45 && !lost.length, '자료가 만드는 장 ' + always.length + '가지가 다 선다' + (lost.length ? ' — 잃은 장: ' + lost.join(' · ') : ''));

  head('다. 목차 · 부 머리 목록');
  const ag = S.find((x) => x.eb === 'AGENDA');
  is(ag && ['1부', '2부', '3부', '4부', '5부', '6부', '7부'].every((p) => ag.txt.includes(p)), '목차(AGENDA)가 일곱 부를 말한다');
  const p2 = S.findIndex((x) => x.eb === 'PART 2'), p3 = S.findIndex((x) => x.eb === 'PART 3');
  const inP2 = S.slice(p2 + 1, p3).map((x) => x.ti);
  is(inP2.every((t) => S[p2].txt.replace(/\s/g, '').includes(t.replace(/\s/g, ''))), '2부 머리 장의 목록 = 2부에 실제로 선 장 ' + inP2.length + '개');

  head('라. ★★ 새 장 셋 — 칸으로만 · 모르면 「모름」');
  const T = (eb) => (S.find((x) => x.eb === eb) || { txt: '' }).txt;
  is(/모름/.test(T('THREE CHECKS')) && /예적금이 얼마인지 아직 몰라/.test(T('THREE CHECKS')), '예적금 칸이 비면 「모름」 (0개월이라고 하지 않음)');
  is(/은퇴\(60세\) 뒤\s*6년/.test(T('ASSETS & DEBT').replace(/<[^>]+>/g, '')) || /은퇴\(60세\) 뒤 6년/.test(T('ASSETS & DEBT')), '대출 22년 남음 → 66세에 끝나 「은퇴(60세) 뒤 6년」');
  is(/집값 대비 빚\s*47%/.test(T('ASSETS & DEBT')) && /월급 중 대출로 나가는 몫\s*17%/.test(T('ASSETS & DEBT')), '대출 몫 17% · 집값 대비 빚 47% (매달 원리금 ÷ 월 소득 · 대출 잔액 ÷ 부동산)');
  is(/가입/.test(T('PREMIUM CHECK')) && !/\d세대/.test(T('PREMIUM CHECK')), '실손은 가입 / 미가입 — 세대 숫자를 지어내지 않음');
  const B = await build(Object.assign({}, SIDE, { f_cash: '1600' }));
  const months = Math.floor(1600 / B.exp);
  is(new RegExp(months + '개월').test((B.S.find((x) => x.eb === 'THREE CHECKS') || {}).txt || ''), '예적금 1,600만 원을 적으면 1,600 ÷ 꼭 나가는 돈 ' + Math.round(B.exp) + ' = ' + months + '개월');

  head('바. 「어디까지 보실까요」 · 오류');
  await pg.evaluate(() => { document.getElementById('start').click(); });
  await pg.waitForTimeout(500);
  const skip = await pg.evaluate(() => { SKIP.risk = 1; const els = document.getElementById('slides').children; let hit = null;
    for (let i = 0; i < els.length; i++) { const e = els[i].querySelector('.s-eyebrow'); if (e && e.textContent.trim() === 'PREMIUM CHECK') hit = els[i]; }
    const off = hit ? !isActive(hit) : null; SKIP.risk = 0; return off; });
  is(skip === true, '보장을 빼면 새 보험료 장도 같이 빠진다');
  is(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 상담자료가 원툴 순서로 서지 않습니다' : '✓ 상담자료 — 시작 · 1부~7부 순서 · 잃은 장 0 · 새 장은 칸으로만 · 기준은 계산기와 한 값'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
