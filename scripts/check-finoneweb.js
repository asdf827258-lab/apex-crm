/* 계산기 화면들이 같은 숫자를 말하나 — 실제로 열어 견줍니다 (판 X176)

   사장님 말씀 2026-10-22 「전부 손대고 막아봐 우선」. 글자로 보는 check-finone 의 짝입니다 —
   글자가 깨끗해도 화면이 다른 숫자를 찍으면 소용없으니, 한 고객을 넣고 화면 여덟 곳을 실제로 엽니다.

     가. 대시보드 — 월 총 소득 · 월 잉여금(적자면 「적자」) · 재무 건전성 점수 가 finCore 와 같나
     나. 최종 탭(종합 가이드맵) — 월 소득 · 월 잉여금 · 종합점수 가 같나 · 탭을 열 때 그 칸에 한 번만 그리나
         (그리자마자 덮이던 죽은 판 셋을 지웠습니다 · 5번)
     다. 종합 재무설계 — trCalc().rest · trGrade 점수 가 같나
     라. 고객 결과지 — 「남는 돈」 · 「목표의 N%」 가 같나 · 「320 비어요」 와 「230 더 필요해요」 가 나란히
         설 때 뒤엣것이 제안(가정)을 더한 뒤라고 밝히나 (0-1번 · 한 물음에 두 답 금지)
     마. 연금 시뮬레이션 — 「지금 준비된 것」 = finCore().totalPension (준비된 연금은 finReady 한 곳)
     바. ★★ 보험 대시보드 — 암 진단비 · 간병·재가 가 적은 칸 그대로인가. 손대기 전에는 없는 칸
         (ins_cancer_diag · ins_care)을 읽어 늘 0 이었고, 그래서 늘 「부족」 이었습니다.
     사. 상속·증여 탭의 「예상 상속세」 = finCore().inheritTax (상속세 셈은 finInherit 한 곳)
     아. ★★ 움직여 보기 — 임대·배당·이자 소득 50 · 기타 지출 30 을 넣으면 <b>모든 화면</b>의 남는 돈이
         똑같이 +20 움직이나. 손대기 전에는 두 덱이 이 두 칸을 빠뜨려 따로 놀았습니다.
     자. 페이지 오류 0 · NaN · undefined 0

   되돌려 보기 — finCore 의 care 를 ins_care 로 되돌리면 바 가 · trCalc 의 rest 를 inc-out-20 으로 바꾸면 다·아 가 ·
               renderFinalMap 의 잉여금을 +1 하거나
               지운 renderFinal 을 show() 에 되살리면 나 가 웁니다.                                  */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
/* 「1억 2,345만원」 · 「-74만원」 · 「550 만」 → 만 원 수 */
const man = (s) => {
  if (s == null) return null;
  const t = String(s).replace(/\s+/g, '').replace(/−/g, '-');
  const m = t.match(/(-)?(?:(\d[\d,]*)억)?(?:(\d[\d,]*)만?)?/);
  if (!m || (!m[2] && !m[3])) return null;
  const v = (m[2] ? +m[2].replace(/,/g, '') * 10000 : 0) + (m[3] ? +m[3].replace(/,/g, '') : 0);
  return m[1] ? -v : v;
};

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥은 막습니다(check-netblock · 7번) */
  await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('dialog', (d) => d.accept());
  /* 최종 칸에 그리는 횟수를 셉니다 */
  await pg.addInitScript(() => { const D = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'); Object.defineProperty(Element.prototype, 'innerHTML', { set(v) { if (this.id === 'final-report-content') window.__fw = (window.__fw || 0) + 1; return D.set.call(this, v); }, get() { return D.get.call(this); }, configurable: true }); });
  await pg.goto('file://' + path.join(ROOT, 'app', 'finance.html'));
  await pg.waitForFunction(() => typeof finCore === 'function' && typeof switchTab === 'function' && typeof rptData === 'function', null, { timeout: 15000 });

  const read = (extra) => pg.evaluate((extra) => {
    const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('s_name', '홍길동'); set('s_age', '42'); set('s_rage', '65'); set('s_target', '400');
    set('ins_cancer_dx', '3000'); set('ins_caregiver', '100'); set('ins_homecare', '50'); set('inh_total', '300000');
    Object.keys(extra).forEach((k) => set(k, extra[k]));
    const C = finCore(); const o = { C: { income: C.income, surplus: C.surplus, tp: C.totalPension, target: C.target, cancer: C.cancer, care: C.care, inheritTax: C.inheritTax, score: finScore(C).total } };
    const tab = (t) => { switchTab(t, document.querySelector('.report-tab')); return (document.getElementById('tab-' + t) || {}).innerText || ''; };
    const after = (txt, label) => { const m = txt.match(new RegExp(label + '\\s*\\n?\\s*([-−]?[\\d,]+(?:억\\s*[\\d,]*)?\\s*만?)')); return m ? m[1] : null; };
    const dash = tab('dashboard'); o.dash = { income: after(dash, '월 총 소득'), surplus: after(dash, '월 잉여금'), red: /월 잉여금[\s\S]{0,40}적자/.test(dash), score: ((document.getElementById('health-svg') || {}).textContent || '').replace(/\D/g, '') };
    /* 최종 탭은 종합 가이드맵 한 장 — 이 칸을 그리는 덧칠이 넷이었고 셋은 그리자마자 덮였습니다(판 X176).
       탭을 한 번 열 때 이 칸에 몇 번 그리나도 셉니다 — 죽은 판이 돌아오면 2 이상이 됩니다. */
    window.__fw = 0;
    const map = tab('final');
    o.map = { income: after(map, '월 소득'), surplus: after(map, '월 잉여금'), score: (map.match(/종합점수\s*(\d+)\s*\/\s*100/) || [])[1], writes: window.__fw };
    const T = trCalc(); o.tr = { rest: T.rest, score: trGrade(T).score };
    const d = rptData(); const sm = d.summary.join('\n');
    o.rpt = { surplus: (sm.match(/남는 돈 \*\*([^*]+)\*\*/) || [])[1], pct: (sm.match(/목표(?: 생활비)?의 \*\*(\d+)%\*\*/) || [])[1], sm: sm };
    tab('pension');
    const box = [...document.querySelectorAll('#pension-sim div')].find((x) => x.children.length >= 2 && /^지금 준비된 것$/.test((x.children[0].textContent || '').trim()));
    o.pen = box ? box.children[1].textContent : null;
    const ins = tab('insurance'); o.ins = { cancer: after(ins, '암 진단비'), care: after(ins, '간병·재가') };
    const inh = tab('inherit'); o.inh = after(inh, '예상 상속세');
    o.all = dash + map + ins + inh;
    return o;
  }, extra);

  const A = await read({ s_passive: '0', s_choice_etc: '0' });
  const B = await read({ s_passive: '50', s_choice_etc: '30' });
  const C = A.C;

  head('가. 대시보드');
  is(man(A.dash.income) === C.income, '월 총 소득 ' + A.dash.income + ' = finCore ' + C.income);
  is(man(A.dash.surplus) === Math.abs(C.surplus) && A.dash.red === (C.surplus < 0), '월 잉여금 ' + A.dash.surplus + (A.dash.red ? '(적자)' : '') + ' = finCore ' + C.surplus);
  is(+A.dash.score === C.score, '재무 건전성 점수 ' + A.dash.score + ' = finScore ' + C.score);

  head('나. 최종 탭 — 종합 가이드맵');
  is(man(A.map.income) === C.income, '월 소득 ' + A.map.income);
  is(man(A.map.surplus) === C.surplus, '월 잉여금 ' + A.map.surplus);
  is(+A.map.score === C.score, '종합점수 ' + A.map.score + ' = finScore');
  is(A.map.writes === 1, '탭을 열 때 칸에 한 번만 그린다 (' + A.map.writes + '번) — 그리자마자 덮이는 죽은 판 0');

  head('다. 종합 재무설계');
  is(A.tr.rest === C.surplus, 'trCalc 남는 돈 ' + A.tr.rest);
  is(A.tr.score === C.score, 'trGrade 점수 ' + A.tr.score + ' = finScore');

  head('라. 고객 결과지');
  is(man(A.rpt.surplus) === C.surplus, '「남는 돈」 ' + A.rpt.surplus);
  is(A.rpt.pct != null && +A.rpt.pct === Math.round(C.tp / C.target * 100), '「목표의 ' + A.rpt.pct + '%」 = 준비 ' + C.tp + ' ÷ 목표 ' + C.target);
  is(/최저보증 기준/.test(A.rpt.sm) && /더 필요해요/.test(A.rpt.sm) && /가정\)까지 더해도 목표 생활비까지/.test(A.rpt.sm), '「더 필요해요」 가 제안(가정)을 더한 뒤인지 밝힌다 — 「비어요」 와 두 답이 되지 않게');

  head('마. 연금 시뮬레이션');
  is(man(A.pen) === C.tp, '「지금 준비된 것」 ' + A.pen + ' = finCore().totalPension ' + C.tp);

  head('바. ★★ 보험 대시보드 — 적은 칸 그대로');
  is(man(A.ins.cancer) === 3000 && C.cancer === 3000, '암 진단비 ' + A.ins.cancer + ' (적은 값 3,000)');
  is(man(A.ins.care) === 150 && C.care === 150, '간병·재가 ' + A.ins.care + ' (간병 100 + 재가 50)');

  head('사. 상속·증여');
  is(man(A.inh) === C.inheritTax && C.inheritTax > 0, '예상 상속세 ' + A.inh + ' = finCore().inheritTax ' + C.inheritTax);

  head('아. ★★ 움직여 보기 — 임대소득 50 · 기타 지출 30 → 모든 화면 +20');
  const dS = B.C.surplus - A.C.surplus;
  is(dS === 20, 'finCore 남는 돈 ' + A.C.surplus + ' → ' + B.C.surplus);
  is(man(B.map.surplus) - man(A.map.surplus) === dS, '최종 탭도 같이');
  is(B.tr.rest - A.tr.rest === dS, '종합 재무설계도 같이');
  is(man(B.rpt.surplus) - man(A.rpt.surplus) === dS, '고객 결과지도 같이');
  is(B.C.income - A.C.income === 50 && man(B.dash.income) === B.C.income, '대시보드 소득에 임대·배당·이자가 들어간다');

  head('자. 오류');
  is(!/NaN|undefined/.test(A.all + B.all), 'NaN · undefined 0');
  is(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));

  await b.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 화면마다 다른 숫자를 말합니다' : '✓ 여덟 화면이 한 숫자 — 대시보드 · 최종보고서 · 종합 재무설계 · 결과지 · 연금 · 보험 · 상속'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
