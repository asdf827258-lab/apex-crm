/* 함께 점검 상담을 중심으로 — 결과지는 빼고, 답은 고객마다, 숫자는 한 곳에서 (판 X189)

   사장님 말씀 2026-10-24 「결과지 빼고 … 이걸 토대로 만들거야」 · 「응 시작해봐」.
   계산기(app/finance.html)를 「함께 점검 상담」 중심으로 고친 것을 실제로 열어 봅니다.

     가. 결과지는 뺐다 — 「고객 결과지」 단추 · 정리 장의 「결과지 열기 · HTML 저장」 이 없다.
         엔진은 남아 「함께 점검 상담」 이 그대로 열린다(테마가 안 깨진다)
     나. ★★ 점검 답은 고객마다 — 전에는 이 기기 브라우저에 한 칸(wk_v1)뿐이라
           · 다음 고객을 불러와도 앞 고객의 답이 그대로 떴고
           · 고객 365일에 저장할 때 답이 빠졌고
           · 새로고침하면 칸은 처음 값으로 가는데 「확인됨」 만 남아 「확인했어요 400만 원」 이 섰습니다
         이제 답은 고객 칸 한 벌(숨은 칸 wk_state)에 — 저장 · 불러오기에 같이 실리고, 다른 고객이 들어오면 비고,
         같은 고객의 상담자료가 다시 넘어와도 안 지워진다
     다. ★★ 비상금은 한 곳에서 — 쌓인 비상금 ÷ 꼭 나가는 돈. 전에는 대시보드 · 팩트체크가 「꼭 나가는 돈 ÷ 매달 모으는
         비상금」 을 개월로 적어 「18개월 · 충분」, 종합 재무설계는 같은 고객에 「2,460만 부족」 이었습니다.
         칸이 비면 세 곳 모두 「모름」(0 이 아님 · 1번), 1,800만을 적으면 세 곳 모두 같은 5개월
     라. 모자라는 돈을 0 으로 자르지 않는다 — 현금흐름 그림의 「잉여금 0만」 → 「모자라는 돈 −99만」
     마. 저장할 때 계산기가 센 부족액(목표 − 받게 될 연금)을 같이 보낸다 — 본체가 「목표 − 연금저축 납입액」 으로 따로 세던 자리
     바. 「함께 점검 상담」 31장이 다 서고 페이지 오류 0

   되돌려 보기 — wkState 를 localStorage('wk_v1') 로 되돌리면 나 가 · finEmerg 의 acc/fixed 를 fixed/s_emerg 로 바꾸면 다 가 ·
               현금흐름 항목을 Math.max(surplus,0) 로 되돌리면 라 가 · apexFinSave 에서 fin 을 빼면 마 가 웁니다. */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => d.accept());
  await pg.goto('file://' + path.join(ROOT, 'app', 'finance.html'));
  await pg.waitForFunction(() => typeof wkOpen === 'function' && typeof finCore === 'function' && window.APEX_REPORT, null, { timeout: 15000 });
  const set = (id, v) => pg.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);

  head('가. 결과지는 뺐다 · 함께 점검 상담은 그대로');
  const btns = await pg.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.textContent.trim()));
  is(!btns.some((t) => /결과지/.test(t)), '「고객 결과지」 단추가 없다');
  is(await pg.evaluate(() => typeof rptPanel === 'undefined' && typeof wkReport === 'undefined'), '결과지를 여는 함수(rptPanel · wkReport)도 없다');
  await set('s_name', '홍길동');
  await pg.evaluate(() => { wkOpen(); WK.i = wkSlides().length - 1; wkPaint(); });
  const endBtns = await pg.$$eval('#wkOv .wk-end button', (bs) => bs.map((x) => x.textContent.trim()));
  is(endBtns.length === 1 && /답 지우기/.test(endBtns[0]), '정리 장에는 「처음부터 · 답 지우기」 만 — ' + JSON.stringify(endBtns));
  const nSl = await pg.evaluate(() => wkSlides().length);
  is(nSl >= 30 && (await pg.$('#wkOv .wk-top .wk-parts')), '함께 점검 상담이 엔진 테마로 열린다 — ' + nSl + '장');
  await pg.evaluate(() => wkClose());

  head('나. ★★ 점검 답은 고객마다');
  await pg.evaluate(() => { wkSave({ ans: {}, vals: {} }); wkAnswer('goal', '확인됨'); wkSet('s_target', '350'); });
  const snap = await pg.evaluate(() => { const o = {}; document.querySelectorAll('input[id],select[id],textarea[id]').forEach((e) => { if (e.type !== 'file') o[e.id] = e.value; }); return o; });
  is(/확인됨/.test(snap.wk_state || '') && !/홍/.test(snap.wk_state || ''), '저장하는 칸에 점검 답이 실린다(이름은 없음) — 고객 365일 저장 = 칸 전부');
  is(!(await pg.evaluate(() => localStorage.getItem('wk_v1'))), '브라우저 한 칸(wk_v1)은 쓰지 않는다');
  await pg.evaluate(() => window.postMessage({ type: 'apexFinLoad', inputs: { s_name: '김○○', s_age: '55', s_target: '250' } }, '*'));
  await pg.waitForTimeout(400);
  is(await pg.evaluate(() => Object.keys(wkState().ans).length === 0), '다른 고객을 불러오면 앞 고객의 답이 사라진다');
  await pg.evaluate(() => { wkAnswer('rage', '확인됨'); window.postMessage({ type: 'apexFinLoad', inputs: { s_name: '김○○', s_rage: '62' } }, '*'); });
  await pg.waitForTimeout(400);
  is(await pg.evaluate(() => wkState().ans.rage === '확인됨'), '같은 고객의 상담자료가 다시 넘어와도 답은 그대로');
  await pg.evaluate((saved) => window.postMessage({ type: 'apexFinLoad', inputs: saved }, '*'), snap);
  await pg.waitForTimeout(500);
  const back = await pg.evaluate(() => wkResult().items.map((x) => x.status + ' ' + x.value).join(','));
  is(back === '확인됨 350만 원', '저장본을 불러오면 그 고객의 답과 숫자가 같이 돌아온다 — ' + back);
  await pg.reload(); await pg.waitForFunction(() => typeof wkState === 'function', null, { timeout: 15000 });
  const rl = await pg.evaluate(() => ({ n: Object.keys(wkState().ans).length, t: document.getElementById('s_target').value }));
  is(rl.n === 0, '새로고침하면 칸과 답이 같이 처음으로 — 「확인됨」 만 남아 처음 값(' + rl.t + ')을 확인된 것으로 세우지 않는다');

  head('다. ★★ 비상금은 한 곳에서 — 쌓인 비상금 ÷ 꼭 나가는 돈');
  const em = async () => pg.evaluate(() => {
    switchTab('dashboard', document.querySelector('.report-tab'));
    const d = (document.getElementById('dash-factcheck') || {}).innerText || '';
    switchTab('factcheck', document.querySelector('.report-tab'));
    const f = (document.getElementById('factcheck-full') || {}).innerText || '';
    switchTab('total', document.querySelector('.report-tab'));
    const t = (document.getElementById('tab-total') || {}).innerText || '';
    const E = finEmerg();
    return { d: (d.match(/생존 개월수\s*([^\n]+)/) || [])[1] || '', f: (f.match(/생존 개월수 점검[\s\S]{0,12}?\n?\s*\S+\s*\n?\s*(\d+개월|모름)/) || [])[1] || '', t: ((t.match(/지금 쌓인 비상금[\s\S]{0,60}/) || [])[0] || '').replace(/\s+/g, ' '), all: d + f + t, E: E };
  });
  await set('s_emerg_acc', '');
  const e0 = await em();
  is(e0.E.known === false && /모름/.test(e0.d) && /모름/.test(e0.f) && /모름/.test(e0.t), '칸이 비면 대시보드 · 팩트체크 · 종합 재무설계 모두 「모름」 — ' + [e0.d, e0.f, e0.t].join(' / '));
  is(!/18개월|비상자금 충분/.test(e0.all), '「18개월 · 비상자금 충분」 을 짓지 않는다');
  const fixed = e0.E.fixed, want = Math.floor(1800 / fixed);
  await set('s_emerg_acc', '1800');
  const e1 = await em();
  is(e1.E.months === want && new RegExp(want + '개월').test(e1.d) && new RegExp(want + '개월').test(e1.f) && /1,800만/.test(e1.t),
    '1,800만을 적으면 세 곳 모두 1,800 ÷ 꼭 나가는 돈 ' + fixed + ' = ' + want + '개월 — ' + [e1.d, e1.f, e1.t].join(' / '));
  await set('s_emerg_acc', '');

  head('라. 모자라는 돈을 0 으로 자르지 않는다');
  const cf = await pg.evaluate(() => { switchTab('cashflow', document.querySelector('.report-tab')); return { t: (document.getElementById('income-expense-chart') || {}).innerText || '', s: finCore().surplus }; });
  is(cf.s < 0 ? (/모자라는 돈\s*−\s*[\d,]+만/.test(cf.t) && !/잉여금\s*0만/.test(cf.t)) : /잉여금/.test(cf.t), '현금흐름 그림 — 남는 돈 ' + cf.s + ' 을 ' + (cf.s < 0 ? '「모자라는 돈 −' + (-cf.s) + '만」' : '잉여금') + ' 으로');

  head('마. 저장할 때 계산기가 센 부족액을 같이 보낸다');
  const out = await pg.evaluate(() => new Promise((ok) => { const h = (e) => { if (e.data && e.data.type === 'apexFinSave') { window.removeEventListener('message', h); ok(e.data); } };
    window.addEventListener('message', h); const C = finCore(); window.__want = Math.max(0, Math.round(C.target - C.totalPension));
    window.postMessage({ type: 'apexFinCollect' }, '*'); setTimeout(() => ok(null), 1500); }));
  const wantGap = await pg.evaluate(() => window.__want);
  is(out && out.fin && out.fin.gap === wantGap, '저장 쪽지의 부족액 = 목표 − 받게 될 연금 (' + (out && out.fin ? out.fin.gap : '없음') + ' = ' + wantGap + ')');

  head('바. 오류');
  is(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 함께 점검 상담을 고객 앞에 세울 수 없습니다' : '✓ 함께 점검 상담 중심 — 결과지 없음 · 답은 고객마다 · 비상금 · 모자라는 돈 · 부족액이 한 곳에서'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
