/* ══════════════════════════════════════════════════════════════════
   check-kijun.js — <b>「보험의 기준 · 셀프 점검」 — 각자 내 플로우를 만들되
   기준은 한 벌인가</b> (판 X180)

   사장님 말씀 2026-10-24 —
     「각자 수정하고 본인만의 플로우를 만들수 있도록 하면 어떨까」
     → 「메인세션에 적용 되어 있는거 아니야 ?」 → 「응 pr 올리고 내 플로우 까지」

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★★ 한 벌인가(5번) — 셀프 점검 문항·판정은 selfcheck-core.js 에만 있고
         본체·덱·고객 쪽은 그것을 부르기만 한다 · 덱은 상담자료/보험의기준.html 하나
     [2] 메뉴(상담 도구 · 보장분석 상담자료 바로 뒤) · 간편 분류 · 옷 · go()
     [3] ★★ 내 링크 — 「내 소개」 이름이 보내는 사람으로 서고, 문항을 빼고 순서를
         바꾸면 링크가 그대로 따라가며, 그 링크를 열면 고객 화면이 그 순서로 선다
     [4] ★★ 결론 낱말이 든 첫인사는 경고가 서고 링크에 안 담긴다 (1번·2번)
     [5] ★ QR 이 지금 링크를 그린 것이다 · 다시 열어도 내 플로우가 남는다
     [6] ★★ 덱 「내 코스」 — 숨긴 장은 지우지 않고 발표에서만 건너뛴다 ·
         이름 붙여 저장하면 다시 열 때 그대로 · 코스 파일로 내보내고 들여온다 ·
         인쇄에서도 빠진다 · 「모두 보이기」 로 본판 차례로 돌아온다
     [7] 앱에서 덱을 열면 1장 소개에 「내 소개」 이름이 선다(앱에 묻는다)
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path'), http = require('http'), url = require('url');
const { chromium } = require('playwright');
const ROOT = process.cwd(), PORT = 9241;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const IDX = rd('app/index.html'), CORE = rd('app/selfcheck-core.js'), PAGE = rd('app/selfcheck.html');
const DECK = rd('app/상담자료/보험의기준.html');

console.log('\n[1] 한 벌인가 (5번)');
is(/var ALLQ=\[/.test(CORE) && (CORE.match(/\{k:'silson'/g) || []).length === 1, '  문항 표는 selfcheck-core.js 에 한 벌');
for (const [n, s] of [['본체', IDX], ['고객 쪽', PAGE], ['덱', DECK]])
  is(!/\{k:'silson',n:/.test(s), '  ' + n + '에 문항 표를 또 박지 않았다');
is(/<script src="\.\.\/selfcheck-core\.js"><\/script>/.test(DECK), '  덱은 ../selfcheck-core.js 를 부른다');
is(/kjLoad\('selfcheck-core\.js'/.test(IDX), '  본체는 쓸 때만 selfcheck-core.js 를 부른다 (첫 화면 무게 0)');
is(/<html data-theme="light"/.test(DECK) && /name="color-scheme" content="light"/.test(DECK), '  덱도 흰색 고정');
const kj = IDX.slice(IDX.indexOf("var KJ_KEY='kjFlow'"), IDX.indexOf('function kjOpenDeck(){'));
is(kj.length > 1000 && !/fetch\(|XMLHttpRequest|sbFetch|supabase/i.test(kj), '  내 링크 칸은 서버를 부르지 않는다 (7번)');

console.log('\n[2] 메뉴 · 분류 · 옷 · go()');
is(/\{id:'sangdam',[^\n]*\n\s*\{id:'kijun',tk:'고객',icon:'📏',title:'보험의 기준 · 셀프 점검'/.test(IDX), '  상담 도구 · 「보장분석 상담자료」 바로 뒤');
is(/ kijun:'meet',/.test(IDX), '  간편 분류 — 고객 만나기(meet)');
is(/jiin_grow:1,kijun:1\}/.test(IDX), '  목업 옷(T_SKIN)을 입는다');
is(/else if\(tab==='kijun'\)\{dyn\.innerHTML=renderKijunPage\(\);kjAfter\(\);\}/.test(IDX), '  go() 가 그린다');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webmanifest': 'application/json' };
const srv = http.createServer((q, s) => {
  const p = decodeURIComponent(url.parse(q.url).pathname);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end('no'); return; }
  s.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); fs.createReadStream(f).pipe(s);
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1240, height: 1000 }, acceptDownloads: true });
  /* 바깥은 막는다 — 진짜 서버를 읽지 않는다 (check-netblock) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const errs = [];
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('app: ' + e.message));
  const O = 'http://127.0.0.1:' + PORT;
  await p.goto(O + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(2600);
  const boot = async () => {
    await p.evaluate(() => {
      document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
      OS.profile = { id: 'me', name: '홍길동', role: 'owner', plan: 'vip' };
      OS.session = { user: { id: 'me', email: 'me@t' } };
      window.toast = () => { };
      try { localStorage.removeItem(advKey()); } catch (e) { }
      if (typeof renderNav === 'function') renderNav();
      go('kijun');
    });
    await p.waitForFunction(() => window.APXSelf && window.qrMini && document.querySelectorAll('.kj-q').length > 0, null, { timeout: 15000 });
  };
  await p.evaluate(() => { try { localStorage.removeItem('kjFlow'); } catch (e) { } });
  await boot();

  console.log('\n[3] 내 링크');
  is(await p.inputValue('#kjBy') === '홍길동', '  보내는 사람에 「내 소개」 이름이 먼저 선다');
  is(await p.locator('.kj-q').count() === 13, '  문항 13개가 다 선다');
  let L = await p.inputValue('#kjLink');
  is(/\/app\/selfcheck\.html#by=/.test(L) && !/q=/.test(L), '  처음엔 열셋 그대로라 q= 를 안 적는다 (' + L.replace(O, '') + ')');
  await p.click('.kj-q[data-kjq="silson"] .kj-ck');
  await p.click('.kj-q[data-kjq="dup"] .kj-ck');
  await p.click('.kj-q[data-kjq="claim"] .kj-mv[aria-label="위로"]');
  L = await p.inputValue('#kjLink');
  const want = 'q=cancer.brain.heart.similar.surg.ctreat.nonpay.end.pay.claim.renew';
  is(L.indexOf(want) >= 0, '  두 문항을 빼고 「안 한 청구」 를 한 칸 올리면 링크가 그대로 따라간다');
  await p.fill('#kjHi', '무조건 나오는 비과세 상품이에요');
  is(await p.isVisible('#kjHiW.bad') && /비과세/.test(await p.textContent('#kjHiW')), '  ★★ 「무조건 · 비과세」 첫인사에 경고가 선다');
  is(!/hi=/.test(await p.inputValue('#kjLink')), '  ★★ 그 첫인사는 링크에 안 담긴다');
  await p.fill('#kjHi', '오늘 이야기 들어 주셔서 고마워요');
  L = await p.inputValue('#kjLink');
  is(/hi=/.test(L) && !(await p.isVisible('#kjHiW.bad')), '  고운 첫인사는 담긴다');

  console.log('\n[5] QR · 다시 열기');
  const same = await p.evaluate(() => { const s = document.querySelector('.kj-qr svg path'); const t = document.createElement('div'); t.innerHTML = window.qrMini.svg(document.getElementById('kjLink').value); const r = t.querySelector('path'); return !!s && !!r && s.getAttribute('d') === r.getAttribute('d') && s.getAttribute('d').length > 500; });
  is(same, '  QR 이 지금 링크를 그린 것이다');
  await p.evaluate(() => go('home'));
  await p.evaluate(() => go('kijun'));
  await p.waitForFunction(() => document.querySelectorAll('.kj-q').length === 13, null, { timeout: 8000 });
  is(await p.inputValue('#kjLink') === L, '  다른 화면에 갔다 와도 내 플로우가 그대로 (이 기기)');

  console.log('\n[3] 그 링크를 고객이 열면');
  const c = await ctx.newPage();
  c.on('pageerror', e => errs.push('customer: ' + e.message));
  await c.goto(L, { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(400);
  const order = await c.$$eval('.sc-q', a => a.map(e => e.getAttribute('data-scq')).join('.'));
  is('q=' + order === want, '  고객 화면이 그 문항·그 순서로 선다');
  is(/홍길동/.test(await c.textContent('[data-sc="by"]')) && /고마워요/.test(await c.textContent('[data-sc="hi"]')), '  「홍길동 설계사가 보낸 점검」 · 첫인사가 선다');
  await c.close();

  console.log('\n[7] 앱에서 덱을 열면 1장에 「내 소개」');
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.evaluate(() => kjOpenDeck())]);
  pop.on('pageerror', e => errs.push('deck: ' + e.message));
  await pop.waitForLoadState('domcontentloaded'); await pop.waitForTimeout(1500);
  is(/홍길동/.test(await pop.evaluate(() => (document.querySelector('.ax-me .ci-name') || {}).textContent || '')), '  1장 이름이 앱의 「내 소개」 (홍길동)');
  await pop.close();

  console.log('\n[6] 덱 「내 코스」');
  const d = await ctx.newPage();
  d.on('pageerror', e => errs.push('deck: ' + e.message));
  await d.goto(O + '/app/' + encodeURIComponent('상담자료') + '/' + encodeURIComponent('보험의기준.html'), { waitUntil: 'domcontentloaded' });
  await d.evaluate(() => { localStorage.removeItem('apxCourses'); localStorage.removeItem('apxCourseCur'); });
  await d.reload({ waitUntil: 'domcontentloaded' }); await d.waitForTimeout(1200);
  const titles = await d.$$eval('#deck > .item .slide', a => a.map(s => s.dataset.title));
  is(titles.length >= 80, '  덱이 선다 (' + titles.length + '장)');
  is(await d.locator('.frame .sc-q').count() === 13, '  덱의 셀프 점검도 같은 13문항 (../selfcheck-core.js)');
  await d.click('#bCourse');
  is(await d.isVisible('#kcPanel'), '  🧭 내 코스 판이 열린다');
  await d.click('.kc-r:nth-child(2) .kc-ck');      /* 2장 「보장분석 지치셨죠」 숨기기 */
  await d.click('.kc-r:nth-child(3) .kc-ck');      /* 3장 표지 숨기기 */
  is(await d.locator('#deck > .item.kc-off').count() === 2, '  두 장을 숨긴다');
  is((await d.$$eval('#deck > .item .slide', a => a.length)) === titles.length, '  ★★ 숨겨도 지우지 않는다 — 장 수 그대로');
  await d.click('[data-kc="close"]');
  await d.evaluate(() => { window.scrollTo(0, 0); });
  await d.click('#bPresent'); await d.waitForTimeout(300);
  const cur = () => d.evaluate(() => { const f = document.querySelector('.frame.cur'); return f ? f.firstElementChild.dataset.title : ''; });
  is(await cur() === titles[0], '  발표는 1장에서 시작');
  await d.keyboard.press('Shift+ArrowRight'); await d.waitForTimeout(200);
  is(await cur() === titles[3], '  ★★ 다음 장은 숨긴 두 장을 건너뛰어 「' + titles[3] + '」');
  await d.keyboard.press('Shift+ArrowLeft'); await d.waitForTimeout(200);
  is(await cur() === titles[0], '  뒤로 가도 숨긴 장을 건너뛴다');
  await d.keyboard.press('Escape'); await d.evaluate(() => document.getElementById('pExit').click()).catch(() => { });
  await d.click('#bCourse');
  await d.fill('#kcName', '30분 코스');
  await d.click('[data-kc="save"]');
  await d.reload({ waitUntil: 'domcontentloaded' }); await d.waitForTimeout(1000);
  is(await d.locator('#deck > .item.kc-off').count() === 2 && /30분 코스/.test(await d.textContent('#bCourse')), '  ★ 다시 열면 「30분 코스」 가 그대로 선다');
  await d.emulateMedia({ media: 'print' });
  is(await d.$eval('#deck > .item.kc-off', e => getComputedStyle(e).display) === 'none', '  인쇄에서도 숨긴 장이 빠진다');
  await d.emulateMedia({ media: 'screen' });
  await d.click('#bCourse');
  const [dl] = await Promise.all([d.waitForEvent('download'), d.click('[data-kc="out"]')]);
  const fp = await dl.path(); const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
  is(j.course === '30분 코스' && j.off.length === 2 && j.order.length === titles.length, '  코스 파일로 내보낸다 (차례 ' + j.order.length + ' · 숨김 ' + j.off.length + ')');
  is(!/data:image|"photo"|010-|@/.test(JSON.stringify(j)), '  코스 파일에는 차례·숨김만 — 사진·연락처가 안 섞인다 (3번)');
  await d.click('[data-kc="all"]');
  is(await d.locator('#deck > .item.kc-off').count() === 0, '  「모두 보이기」 로 본판 차례로 돌아온다');
  const fileIn = d.locator('input[data-kc="in"]');
  fs.writeFileSync(fp + '.json', JSON.stringify(Object.assign({}, j, { course: '팀장님 코스' })));
  await fileIn.setInputFiles(fp + '.json'); await d.waitForTimeout(300);
  is(await d.locator('#deck > .item.kc-off').count() === 2 && /팀장님 코스/.test(await d.textContent('#bCourse')), '  ★ 받은 코스 파일을 들이면 그 차례·숨김이 선다');
  await d.close();

  is(errs.length === 0, '  자바스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' · ') : ''));
  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 내 코스 · 내 링크는 각자, 기준과 문구는 한 벌입니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
