/* 🧭 보장 전·후 — 네 걸음 메뉴 · 판 X506 (app/ba-steps.js)

   사장님 말씀 2026-11-19 「담보 수정하는게 너무 복잡해 더 보기 쉽게해 전체적인 메뉴도」 → 11-20 「응 이제 그 다음거 해」.
   위 띠 누를 것 17개 → ① 고객 ② 지금 보험 ③ 바꿀 것 ④ 보여주기 + 💾 저장 ▾ · 🧰 도구 ▾.

   보는 것
     [1] 위 띠 — 늘 보이는 누를 것 6개(걸음 4 · 저장 · 도구) · ★★ 예전 17가지가 하나도 안 없어졌다(어디에 있는지 하나하나)
     [2] 걸음마다 그 칸만 보인다 · 「한 장으로 다 보기」 는 예전처럼 전부
     [3] ★ 인쇄는 걸음과 상관없이 ①②③ 칸이 다 나온다(④ 단추 칸은 안 나옴)
     [4] 띠가 지금 자리를 말한다 — 보여주기 화면이면 ④ · 요청서면 ③ · 걸음마다 건수(45세 · 4건 · 새 2건)
     [5] 「다음 →」 로 ①→④ 끝까지 · ② 계약 카드의 「담보 고치기로 ▸」 는 ③ 으로 넘어간다
     [6] 저장 ▾ 열고 닫기(바깥 누르기 · Esc) · 도구 ▾ 와 같이 안 열린다
     [7] 폰 390 — 띠 120px 안 · 옆으로 안 밀림 · 걸음 단추 44px · 보내는 요청 0 · 오류 0                            */
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
  const pg = await br.newPage({ viewport: { width: 1360, height: 900 } });
  const errs = [], out = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', q => { if (q.method() !== 'GET') out.push(q.method() + ' ' + q.url()); });
  await pg.route('**://**', r => /^http:\/\/127\.0\.0\.1/.test(r.request().url()) ? r.continue() : r.abort());
  await pg.goto('http://127.0.0.1:' + port + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { localStorage.clear(); window.confirm = () => true; doSample(); go('edit'); });
  await pg.waitForTimeout(200);
  const vis = () => pg.evaluate(() => [].filter.call(document.querySelectorAll('#bsMain .card'), c => c.offsetParent).map(c => (c.querySelector('h2') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim()));

  head('[1] 위 띠 — 늘 보이는 것 · 예전 17가지');
  const bar = await pg.evaluate(() => {
    const b = document.querySelector('.bar'), shown = [].filter.call(b.querySelectorAll('button'), x => x.offsetParent && !x.closest('.moreBox'));
    return { n: shown.length, t: shown.map(x => x.textContent.replace(/\s+/g, ' ').trim()) };
  });
  is(bar.n === 6, '늘 보이는 누를 것 ' + bar.n + '개 — ' + bar.t.join(' / ') + ' (예전 17개)');
  is(/① 고객/.test(bar.t[0]) && /④ 보여주기/.test(bar.t[3]) && /저장/.test(bar.t[4]) && /도구/.test(bar.t[5]), '상담 순서 네 걸음 + 저장 ▾ + 도구 ▾');
  /* 예전 띠의 17가지 — 무엇을 부르는지(onclick)로 찾는다. 위 띠 상자 안이든 걸음 칸 안이든 */
  const OLD = [['✍ 만들기', "bsGo(1)"], ['👤 고객에게 보여주기', "go('show')"], ['📋 가입설계 요청서', "go('req')"],
    ['📋 자동 보장분석', "showPanel('fit')"], ['🧠 윤시현의 두뇌', "showPanel('brain')"], ['💾 고객 365일에 저장', 'baSaveToClient()'],
    ['💾 파일로 저장', 'doSave()'], ['📄 최종 보고서', 'frPrint()'], ['🖨 인쇄 · PDF', 'window.print()'], ['💬 요약 한 장 이미지', 'frImage()'],
    ['📘 사용방법', "showPanel('guide')"], ['🎓 보장분석 기준', "showPanel('study')"], ['👥 연령대별 기준', "showPanel('age')"],
    ['📂 불러오기', "getElementById('loadFile').click()"], ['예시 채우기', 'doSample()'], ['전부 지우기', 'doReset()'], ['⋯ 더보기 (→ 도구 ▾)', 'barMore()']];
  const miss = await pg.evaluate(O => O.filter(o => ![].some.call(document.querySelectorAll('[onclick]'), e => (e.getAttribute('onclick') || '').indexOf(o[1]) >= 0)).map(o => o[0]), OLD);
  is(miss.length === 0, '★★ 예전 17가지가 전부 아직 누를 자리가 있다' + (miss.length ? ' — 빠짐: ' + miss.join(' · ') : ''));

  head('[2] 걸음마다 그 칸만');
  const want = { 1: ['고객 · 가족'], 2: ['기존 보험', '자동 보장분석', '숨은'], 3: ['추가 보험', '담보 고치기', '납입 보험료', '표준 담보표', '치료 기준', '가입설계 요청서'], 4: ['보여주기'] };
  for (const s of [1, 2, 3, 4]) {
    await pg.click('#bsSteps button[data-s="' + s + '"]'); await pg.waitForTimeout(120);
    const v = await vis();
    const ok = want[s].every(w => v.some(t => t.indexOf(w) >= 0)) && v.length === want[s].length;
    is(ok, s + ' 걸음 — ' + v.map(t => t.slice(0, 12)).join(' / '));
    /* 걸음 화면에만 서는 칸(자동 보장분석 · 요청서 · ④ 단추 · 다음 →)은 「한 장으로 다 보기」 로 재는 check-read 가 못 본다 — 여기서 잰다 */
    const tiny = await pg.evaluate(() => [].filter.call(document.querySelectorAll('#bsMain .bs-fit button, #bsMain .bs-sec[data-s="4"] button, .bs-next button'),
      b => b.offsetParent && Math.round(b.getBoundingClientRect().height) < 44).map(b => b.textContent.trim().slice(0, 12)));
    is(tiny.length === 0, '  ' + s + ' 걸음에만 서는 단추 44px 아래 0개' + (tiny.length ? ' — ' + tiny.join(' / ') : ''));
  }
  await pg.evaluate(() => bsAllToggle()); await pg.waitForTimeout(120);
  const all = await vis();
  is(all.length === 8 && !all.some(t => /^4 ?보여주기|자동 보장분석|가입설계 요청서/.test(t)), '「한 장으로 다 보기」 — 예전 칸 ' + all.length + '개 그대로(④ 단추 칸 · 걸음 길잡이 칸 둘은 빼고 — 예전 높이를 안 넘게)');
  is(await pg.evaluate(() => document.getElementById('bsAllBtn').textContent.indexOf('네 걸음') >= 0), '도구 ▾ 단추가 「네 걸음으로 나눠 보기」 로 바뀐다');
  await pg.evaluate(() => bsAllToggle());

  head('[3] 인쇄는 전부');
  await pg.click('#bsSteps button[data-s="1"]');
  await pg.emulateMedia({ media: 'print' });
  const pr = await pg.evaluate(() => [].map.call(document.querySelectorAll('#bsMain .bs-sec'), e => e.getAttribute('data-s') + ':' + getComputedStyle(e).display));
  is(pr.join(',') === '1:block,2:block,3:block,4:none', '① 걸음에서 인쇄해도 ①②③ 다 나옴 · ④ 단추 칸은 안 나옴 — ' + pr.join(' '));
  await pg.emulateMedia({ media: 'screen' });

  head('[4] 띠가 지금 자리를 말한다');
  const lab = await pg.evaluate(() => [].map.call(document.querySelectorAll('#bsSteps button'), b => b.textContent.replace(/\s+/g, ' ').trim()));
  is(/45세/.test(lab[0]) && /4건/.test(lab[1]) && /새 2건/.test(lab[2]), '걸음마다 건수 — ' + lab.join(' / '));
  const on = async () => pg.evaluate(() => { const b = document.querySelector('#bsSteps button.on'); return b ? b.getAttribute('data-s') : '-'; });
  await pg.evaluate(() => go('show')); await pg.waitForTimeout(150);
  is(await on() === '4', '노트북 보여주기 화면이면 ④ 가 켜진다');
  await pg.keyboard.press('Escape').catch(() => {});
  await pg.evaluate(() => go('req')); await pg.waitForTimeout(150);
  is(await on() === '3', '가입설계 요청서면 ③ 이 켜진다');
  await pg.evaluate(() => { showPanel('brain'); go('edit'); }); await pg.waitForTimeout(150);
  is(await on() === '-', '두뇌 같은 판을 열면 아무 걸음도 안 켜진다');
  await pg.evaluate(() => bsGo(1)); await pg.waitForTimeout(100);
  is(await pg.evaluate(() => !S.panel && S.mode === 'edit'), '걸음을 누르면 판이 닫히고 만들기로 돌아온다');

  head('[5] 다음 → 로 끝까지 · 걸음을 건너는 길');
  const seen = [];
  for (let n = 0; n < 4; n++) { seen.push(await on()); const nx = await pg.$('.bs-next .btn:not(.n)'); if (!nx) break; await nx.click(); await pg.waitForTimeout(100); }
  is(seen.join('') === '1234', '「다음 →」 만 눌러 ① → ④ — ' + seen.join('→'));
  is(!(await pg.$('.bs-next .btn:not(.n)')), '④ 에는 「다음」 이 없다');
  await pg.evaluate(() => bsGo(2)); await pg.waitForTimeout(100);
  await pg.evaluate(() => { S.polOpen[S.before[2].id] = true; save(); render(); });
  await pg.click('.pol.open .padshut'); await pg.waitForTimeout(200);
  is(await pg.evaluate(() => bsStep() === 3 && beCur().i === 2 && beCur().sd === 'before'), '② 계약 카드 「담보 고치기로 ▸」 → ③ 으로 넘어가 그 계약이 골라진다');
  await pg.evaluate(() => beOld()); await pg.waitForTimeout(150);
  is(await pg.evaluate(() => bsStep() === 2 && !!document.querySelector('.pol.open .pad, .pol.open .qk')), '「읽어 온 금액 고치기」 → ② 로 돌아가 그 계약 담보판이 펴진다');

  head('[6] 저장 ▾ · 도구 ▾');
  await pg.click('#barSaveBtn');
  is(await pg.evaluate(() => document.getElementById('barSaveBox').classList.contains('on')), '저장 ▾ 를 누르면 열린다');
  await pg.click('#barMoreBtn');
  const both = await pg.evaluate(() => [document.getElementById('barSaveBox').classList.contains('on'), document.getElementById('barMoreBox').classList.contains('on')]);
  is(!both[0] && both[1], '도구 ▾ 를 누르면 저장 ▾ 는 닫힌다(둘이 겹쳐 안 열림)');
  await pg.evaluate(() => barMore(false)); await pg.click('#barSaveBtn'); await pg.keyboard.press('Escape');
  is(!(await pg.evaluate(() => document.getElementById('barSaveBox').classList.contains('on'))), 'Esc 로 닫힌다');
  await pg.click('#barSaveBtn'); await pg.mouse.click(600, 700);
  is(!(await pg.evaluate(() => document.getElementById('barSaveBox').classList.contains('on'))), '바깥을 누르면 닫힌다');

  head('[7] 폰 · 44px · 조용함');
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.evaluate(() => bsGo(2)); await pg.waitForTimeout(200);
  const ph = await pg.evaluate(() => ({ bar: Math.round(document.querySelector('.bar').getBoundingClientRect().height), w: document.documentElement.scrollWidth,
    tap: [].filter.call(document.querySelectorAll('.bar button'), b => b.offsetParent && !b.closest('.moreBox') && Math.round(b.getBoundingClientRect().height) < 44).length }));
  is(ph.bar <= 120, '폰 위 띠 ' + ph.bar + 'px — 120px 안(그대로 두면 201px · 화면 4분의 1)');
  is(ph.w <= 390, '옆으로 안 밀림 — ' + ph.w);
  is(ph.tap === 0, '띠 단추 44px 아래 0개');
  is(out.length === 0, '보내는 요청 0' + (out.length ? ' — ' + out.slice(0, 2).join(' / ') : ''));
  is(errs.length === 0, '오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 빨간불' : '네 걸음 메뉴 점검 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
