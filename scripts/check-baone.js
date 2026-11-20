/* ✏️ 보장 전·후 — 담보 고치기 한 곳 · 판 X502 (app/ba-edit.js)

   사장님 말씀 2026-11-19 「담보 수정하는게 너무 복잡해 더 보기 쉽게해」 →
   2026-11-20 「응 바꿔도 된다. 하지만 바꾸기전 너가 1달차 설계사라면 어떻게 해야 더 쉽겠니」 → 「오우 너무 좋다」.

   보는 것
     [1] 칸이 선다 · 순서 띠(계약마다 정하기 → 빈 곳 → 보험료·말할 것) · 「지금 할 일」 단추로 계약을 차례로 연다
     [2] [−] [+] 가 자주 쓰는 금액 사다리로 오르내리고, 그 값이 calc() 「바꾸면」 에 바로 들어간다
     [3] ★★ 기준 금액은 <b>모든 계약을 합친 금액</b>과 견준다 — 견본의 암 진단은 이 계약 2,000 뿐이지만 새 제안 3,000 과
         합쳐 기준을 채웠으니 「모자라요」 가 뜨면 안 된다(뜨면 1달차가 눌러 중복 가입)
     [4] 「채우기」 는 모자란 만큼만 더한다 · 기준은 ③ 제안 순위와 같은 rankTarget
     [5] 새 보험이 없을 때 빈 곳을 누르면 새 제안이 생겨 들어가고, 월 보험료를 적어야 3단계가 끝난다
     [6] 정리(해지)를 고르면 심의 문구 ①② 그대로 + 「설명했어요」 체크 전에는 안 끝난다
     [7] ↶ 되돌리기 · 「처음으로」 · 직접 적기(「3천」 → 3,000만)
     [8] 찾기 칸은 글자를 쳐도 다시 안 그린다(한글 조합) · 약관 이름으로도 찾는다
     [9] ⑤ 표준표는 읽기만 — 입력칸 0 · 계약 카드의 「담보 고치기로 ▸」 는 이 칸으로 온다
     [10] 누르는 자리 44px · 폰 390 에서 옆으로 안 밀림 · 바깥 요청 0 · 오류 0                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [], out = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', q => { if (q.method() !== 'GET') out.push(q.method() + ' ' + q.url()); });   /* 보내는 요청만 — 글꼴 GET 은 막혀 있고 무엇도 안 실어 보냄 */
  await pg.route('**://**', r => /^http:\/\/127\.0\.0\.1/.test(r.request().url()) ? r.continue() : r.abort());
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { localStorage.clear(); window.confirm = () => true; doSample(); });
  await pg.waitForTimeout(300);
  const guide = () => pg.evaluate(() => (document.getElementById('beGuide') || {}).innerText.replace(/\s+/g, ' '));
  const toast = () => pg.evaluate(() => (document.getElementById('beToast') || {}).textContent || '');

  head('[1] 칸 · 순서 띠 · 지금 할 일');
  const c1 = await pg.evaluate(() => ({ card: !!document.getElementById('beCard'), eps: document.querySelectorAll('#beCard .ep').length,
    order: [].map.call(document.querySelectorAll('#app .card > h2'), h => h.textContent.trim().slice(0, 8)) }));
  is(c1.card, '✏️ 담보 고치기 칸이 선다');
  is(c1.eps === 6, '계약 6건(기존 4 · 새 2)이 왼쪽에 다 선다 — ' + c1.eps);
  const iBe = c1.order.findIndex(t => /담보 고치기/.test(t)), iAf = c1.order.findIndex(t => /추가 보험/.test(t));
  is(iBe === iAf + 1, '③ 추가 보험 바로 다음 자리다 — ' + c1.order.join(' / '));
  let g = await guide();
  is(/계약마다 정하기 1\/4/.test(g) || /계약마다 정하기 0\/4/.test(g), '처음엔 계약 보기가 0~1/4 — ' + g.slice(0, 40));
  for (let n = 0; n < 6; n++) { if (!/이 계약 열기/.test(await guide())) break; await pg.click('#beGuide .gnow .btn'); await pg.waitForTimeout(80); }
  g = await guide();
  is(/계약마다 정하기 4\/4/.test(g), '「이 계약 열기」 만 따라 눌러 넷 다 봤다');
  const nh = +((g.match(/빈 곳 채우기 · 남은 (\d+)개/) || [])[1] || 0), nAll = await pg.evaluate(() => beHoles(true).length);
  is(nh >= 1 && nh <= 6, '★ 빈 곳은 묶음 셋 × 정해진 앞 둘 — ' + nh + '개 (묶음 안을 다 내놓으면 ' + nAll + '개라 1달차가 질림)');
  is(nAll > nh, '나머지 ' + (nAll - nh) + '개는 숨기지 않고 찾기 칸 아래 「더 보기」 에 있다');

  head('[2] [−] [+] 사다리 → 바꾸면');
  await pg.click('#beCard .ep:has-text("참편한키다리")');
  const s0 = await pg.evaluate(() => ({ v: S.before[1].cov2.surgA, a: calc().a.surgA }));
  await pg.click('#beCard .er:has-text("다쳐서 수술") .stp > button:last-child');
  const s1 = await pg.evaluate(() => ({ v: S.before[1].cov2.surgA, a: calc().a.surgA }));
  is(s0.v === '80' && s1.v === '100', '다쳐서 수술 80 → [+] → 100 (사다리 다음 칸) — ' + s0.v + ' → ' + s1.v);
  is(s1.a - s0.a === 20, '「바꾸면」 합계도 20만 늘었다 — ' + s0.a + ' → ' + s1.a);
  await pg.click('#beCard .er:has-text("다쳐서 수술") .stp > button:first-child');
  is(await pg.evaluate(() => S.before[1].cov2.surgA) === '80', '[−] 로 다시 80');

  head('[3] ★★ 기준은 모든 계약을 합친 금액과');
  const chip = await pg.evaluate(() => { const r = [].find.call(document.querySelectorAll('#beCard .er'), e => /암 진단 — 한 번에/.test(e.innerText));
    return { v: S.before[1].cov2.cancer, txt: r.querySelector('.std').innerText, lo: r.querySelector('.std').classList.contains('lo'), tg: rankTarget('cancer'), all: calc().a.cancer }; });
  is(chip.v === '2000' && chip.all >= chip.tg, '이 계약 2,000 · 모두 합쳐 ' + chip.all + ' · 기준 ' + chip.tg);
  is(!chip.lo && /모두 합쳐/.test(chip.txt) && /채움/.test(chip.txt), '★★ 「모자라요」 가 아니라 「모두 합쳐 … 채움」 — ' + chip.txt);

  head('[4] 채우기는 모자란 만큼만');
  await pg.evaluate(() => { S.after = []; save(); render(); });
  await pg.click('#beCard .ep:has-text("참편한키다리")');
  const f0 = await pg.evaluate(() => ({ tg: rankTarget('cancer'), have: rankHave('cancer', calc().a), v: +S.before[1].cov2.cancer,
    txt: [].find.call(document.querySelectorAll('#beCard .er'), e => /암 진단 — 한 번에/.test(e.innerText)).querySelector('.std').innerText }));
  is(f0.have < f0.tg && /모자라요/.test(f0.txt), '새 제안을 빼니 모자라요 — ' + f0.txt);
  await pg.click('#beCard .er:has-text("암 진단 — 한 번에") .std.lo');
  const f1 = await pg.evaluate(() => ({ v: +S.before[1].cov2.cancer, have: rankHave('cancer', calc().a) }));
  is(f1.v === f0.v + (f0.tg - f0.have) && f1.have === f0.tg, '모자란 ' + (f0.tg - f0.have) + ' 만 더해 ' + f1.v + ' — 기준 ' + f0.tg + ' 딱 맞음');
  is(/모자란/.test(await toast()), '알림 — ' + await toast());

  head('[5] 빈 곳 → 새 제안 · 보험료 칸');
  await pg.evaluate(() => { localStorage.clear(); doSample(); S.after = []; S.before.forEach(p => { p.act = 'keep'; }); S.be = { seen: {}, told: {} };
    S.before.forEach(p => S.be.seen[p.id] = 1); save(); render(); });
  g = await guide();
  is(/빈 곳 채우기 · 남은/.test(g) && /넣기/.test(g), '2단계 — ' + g.slice(0, 70));
  await pg.click('#beGuide .gnow .btn');
  const h1 = await pg.evaluate(() => ({ n: S.after.length, k: Object.keys(S.after[0] ? S.after[0].cov : {}), sel: beCur().sd }));
  is(h1.n === 1 && h1.k.length === 1 && h1.sel === 'after', '새 제안이 하나 생겨 그 담보가 들어가고 그 제안이 골라진다 — ' + h1.k.join(','));
  const want = await pg.evaluate(() => { var k = Object.keys(S.after[0].cov)[0]; return { v: +S.after[0].cov[k], tg: rankTarget(k) }; });
  is(want.v === want.tg, '들어간 금액 = 기준 금액(rankTarget) — ' + want.v);
  for (let n = 0; n < 8; n++) { if (!/넣기/.test(await guide())) break; await pg.click('#beGuide .gnow .btn'); await pg.waitForTimeout(60); }
  g = await guide();
  is(/월 보험료를 아직 안 적었어요/.test(g), '빈 곳을 다 채워도 보험료가 비면 안 끝난다 — ' + g.slice(-60));
  await pg.click('#beGuide .gnow .btn'); await pg.waitForTimeout(100);
  is(await pg.evaluate(() => document.activeElement && document.activeElement.id) === 'beP_premMan', '「적으러 가기」 가 보험료 칸에 커서를 둔다');
  await pg.fill('#beP_premMan', '42,300'); await pg.waitForTimeout(80);
  is(await pg.evaluate(() => S.after[0].premMan) === '4.23', '42,300원 → 4.23만원으로 담긴다');
  g = await guide();
  is(/다 됐어요/.test(g), '다 됐어요 — ' + g.slice(-70));

  head('[6] 정리 — 심의 문구 그대로 · 설명했어요');
  await pg.click('#beCard .ep:has-text("참좋은운전자") .seg button.cancel'); await pg.waitForTimeout(80);
  const w = await pg.evaluate(() => (document.querySelector('#beCard .note.told') || {}).innerText || '');
  is(w.includes('① 질병이력, 연령증가 등으로 가입이 거절되거나 보험료가 인상될 수 있습니다.') &&
     w.includes('② 가입 상품에 따라 새로운 면책기간 적용 및 보장 제한 등 기타 불이익이 발생할 수 있습니다.'), '해지 불이익 ①② 가 심의 문구 그대로');
  is(/확인하러 가기|정리해요/.test(await guide()), '체크 전에는 3단계가 안 끝난다');
  await pg.check('#beCard .note.told input'); await pg.waitForTimeout(80);
  is(/다 됐어요/.test(await guide()), '「고객에게 설명했어요」 체크하니 끝');

  head('[7] 되돌리기 · 처음으로 · 직접 적기');
  const u0 = await pg.evaluate(() => S.before.find(p => /참좋은운전자/.test(p.nm)).act);
  await pg.click('#beGuide .gundo'); await pg.waitForTimeout(80);
  const u1 = await pg.evaluate(() => S.before.find(p => /참좋은운전자/.test(p.nm)).act);
  is(u0 === 'cancel' && u1 === 'keep', '↶ 되돌리기 — 정리 → 그대로 (' + u0 + ' → ' + u1 + ')');
  await pg.click('#beCard .ep:has-text("참편한키다리") .seg button.endo'); await pg.waitForTimeout(60);
  await pg.click('#beCard .er:has-text("뇌출혈") .x'); await pg.waitForTimeout(60);
  is(await pg.evaluate(() => S.before[1].cov2.stroke === undefined), '✕ 로 뺐다');
  is(await pg.evaluate(() => !!document.querySelector('#beCard .hdr .mini')), '고쳤으니 「처음으로」 가 선다');
  await pg.click('#beCard .hdr .mini'); await pg.waitForTimeout(60);
  /* 견본을 불러올 때 이 계약은 「일부 바꾸기」 로 처음 그려졌다 — 그 상태(뇌출혈 2,000 포함)로 돌아와야 한다 */
  is(await pg.evaluate(() => S.before[1].act === 'endo' && S.before[1].cov2.stroke === '2000'), '「처음으로」 — 처음 본 상태로(뺀 뇌출혈이 돌아옴)');
  await pg.evaluate(() => { var i = S.after.length - 1; beSel('after', i); });
  const k0 = await pg.evaluate(() => [].map.call(document.querySelectorAll('#beCard .er'), e => e)[0] && Object.keys(S.after[S.after.length - 1].cov)[0]);
  await pg.click('#beCard .er >> nth=0 >> .stp .v'); await pg.fill('#beIn', '3천'); await pg.press('#beIn', 'Enter'); await pg.waitForTimeout(80);
  const typed = await pg.evaluate(k => S.after[S.after.length - 1].cov[k], k0);
  is(typed === '3000', '숫자를 눌러 「3천」 → 3000(만원) — ' + typed);

  head('[8] 찾기 — 한글 조합 · 약관 이름');
  const el0 = await pg.evaluate(() => { window.__beQ = document.getElementById('beQ'); return !!window.__beQ; });
  await pg.type('#beQ', '골절', { delay: 30 });
  const q = await pg.evaluate(() => ({ same: document.getElementById('beQ') === window.__beQ, chips: [].map.call(document.querySelectorAll('#beRes button'), b => b.textContent) }));
  is(el0 && q.same, '글자를 쳐도 찾기 칸이 다시 안 그려진다(한글 조합이 안 끊김)');
  is(q.chips.some(t => /뼈가 부러지면/.test(t)), '「골절」 → 「뼈가 부러지면 (진단)」 — ' + q.chips.slice(0, 3).join(' · '));
  await pg.fill('#beQ', '허혈성'); await pg.waitForTimeout(60);
  const q2 = await pg.evaluate(() => [].map.call(document.querySelectorAll('#beRes button'), b => b.textContent));
  is(q2.some(t => /심장 혈관 병 전체/.test(t)) || await pg.evaluate(() => !!S.after[S.after.length - 1].cov.heart), '약관 이름 「허혈성」 으로도 찾는다(이미 들었으면 통과) — ' + q2.slice(0, 2).join(' · '));

  head('[9] ⑤ 표준표 읽기만 · 계약 카드에서 이 칸으로');
  await pg.evaluate(() => { S.man.a.cancer = '9000'; save(); render(); });
  const st = await pg.evaluate(() => ({ inp: document.querySelectorAll('#stBox input').length, hand: document.querySelectorAll('#stBox .stv.hand').length, rst: document.querySelectorAll('#stBox .rst').length,
    note: (document.querySelector('#stBox') || {}).parentNode.querySelector('p').innerText }));
  is(st.inp === 0, '표준표에 입력칸 0 — 고치는 곳은 한 곳');
  is(st.hand === 1 && st.rst === 1, '예전에 손으로 고친 칸은 「손」 으로 남고 ↺ 로 되돌린다');
  is(/읽기만/.test(st.note), '안내 글 — ' + st.note.slice(0, 40));
  await pg.evaluate(() => { resetMan('a', 'cancer'); S.polOpen = {}; save(); render(); });
  await pg.evaluate(() => { S.polOpen[S.before[2].id] = true; save(); render(); });
  const shut = await pg.$('.pol.open .padshut');
  is(!!shut && /담보 고치기로/.test(await shut.innerText()), '계약 카드의 닫힌 줄이 「✏️ 담보 고치기로 ▸」');
  await shut.click(); await pg.waitForTimeout(150);
  is(await pg.evaluate(() => beCur().i === 2 && beCur().sd === 'before'), '누르면 이 칸에서 그 계약이 골라진다');

  head('[10] 44px · 폰 · 바깥 요청 · 오류');
  const tiny = await pg.evaluate(() => [].filter.call(document.querySelectorAll('#beCard button, #beCard input'), e => {
    const r = e.getBoundingClientRect(); if (!r.width) return false; if (e.type === 'checkbox') return false;
    if (e.classList.contains('q') || e.classList.contains('std')) return false;   /* 이름 옆 ? 와 기준 칩은 글 속 표시 — 아래 셈 */
    return r.height < 44; }).map(e => e.className + ':' + e.textContent.trim().slice(0, 10) + ':' + Math.round(e.getBoundingClientRect().height)));
  is(tiny.length === 0, '누르는 자리 44px 아래 0개' + (tiny.length ? ' — ' + tiny.slice(0, 4).join(' / ') : ''));
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(200);
  const ph = await pg.evaluate(() => { const c = document.getElementById('beCard').getBoundingClientRect(); return { w: document.documentElement.scrollWidth, r: Math.round(c.right) }; });
  is(ph.w <= 390 && ph.r <= 390, '폰 390 — 옆으로 안 밀림 (' + ph.w + ' · 칸 오른끝 ' + ph.r + ')');
  is(out.length === 0, '보내는 요청 0(고객 자료가 어디로도 안 감)' + (out.length ? ' — ' + out.slice(0, 2).join(' / ') : ''));
  is(errs.length === 0, '오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 빨간불' : '담보 고치기 한 곳 점검 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
