/* 상담 흐름 — 상담자료에서 계산기로, 계산기 안에서 종합 재무설계까지

   계산기 탭이 열한 개다. 상담 중에 「다음에 뭘 열지」를 고르는 1초가
   고객에게는 「준비가 안 됐구나」로 보인다. 그래서 세 곳을 이었다.

     ① 상담자료 sec1 → 계산기   적은 것을 들고 넘어간다
        (전에는 계산기→통합상담 21곳이 이어져 있는데 이 길만 0개였다)
     ② 계산기 안 상담 순서       팩트체크 → 대시보드 → 현금흐름 → 아픈 곳 → 종합
     ③ 마지막 자리              고객 365일 저장 · 아픈 곳에 맞는 발표자료

   하나라도 끊기면 상담이 메뉴에서 헤맨다. 여기서 확인한다.           */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8894;

const srv = http.createServer((q, s) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(s);
}).listen(PORT);

let pass = 0, fail = 0;
const is = (c, m) => { c ? (pass++, console.log('  ✓ ' + m)) : (fail++, console.log('  ✗ ' + m)); };
const B = 'http://127.0.0.1:' + PORT;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const errs = [];

  /* ── ① 상담자료 → 계산기 ─────────────────────────────────────── */
  console.log('\n[1] 상담자료 sec1 에서 계산기로 넘어가는 길이 있는가');
  const deck = await ctx.newPage();
  deck.on('pageerror', e => errs.push('상담자료: ' + e.message));
  await deck.goto(B + '/app/재무설계/상담자료.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await deck.waitForTimeout(2500);
  await deck.fill('#f_name', '홍길동');

  is(await deck.locator('#sec1 .tofin').count() === 1, 'sec1 안에 「계산기에서 이어서」 버튼이 있다');
  is(await deck.evaluate(() => typeof window.apexToFin === 'function'), 'apexToFin 이 열려 있다');

  /* 부모 없이 혼자 열었을 때 조용히 안내만 하고 안 죽는가 */
  deck.once('dialog', d => d.accept());
  await deck.click('#sec1 .tofin');
  await deck.waitForTimeout(500);
  is(errs.length === 0, '앱 밖에서 열어도 알림만 뜨고 터지지 않는다');

  const sent = await deck.evaluate(() => {
    let got = null; const real = window.parent;
    Object.defineProperty(window, 'parent', { configurable: true, value: { postMessage: m => { got = m; } } });
    try { window.apexToFin(); } finally { Object.defineProperty(window, 'parent', { configurable: true, value: real }); }
    return got;
  });
  is(sent && sent.t === 'apex:tofin', 'apex:tofin 쪽지를 보낸다');
  is(sent && sent.data && sent.data.f && Object.keys(sent.data.f).length > 20,
    '적은 칸을 통째로 담는다 (' + (sent && sent.data && sent.data.f ? Object.keys(sent.data.f).length : 0) + '칸)');
  is(sent && typeof sent.pain === 'string',
    '「가장 먼저 듣고 싶은 것」을 아픈 곳으로 같이 넘긴다 — ' + (sent && sent.pain));

  /* ── ② 부모 앱이 칸을 옮겨 담는가 ────────────────────────────── */
  console.log('\n[2] 부모 앱이 상담자료 칸을 계산기 칸으로 옮기는가');
  const app = await ctx.newPage();
  app.on('pageerror', e => errs.push('앱: ' + e.message));
  await app.goto(B + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await app.waitForTimeout(6000);

  const mapped = await app.evaluate(f => window.osToFinMap(f), sent.data.f);
  const F = sent.data.f;
  is(mapped.s_name === '홍길동', '고객명이 그대로 간다');
  is(mapped.s_age === String(parseFloat(F.f_age)), '나이가 간다 (' + mapped.s_age + '세)');
  is(mapped.s_gross === String(Math.round(parseFloat(F.f_income) * 12)),
    '월소득 ' + F.f_income + '만 → 연 총급여 ' + mapped.s_gross + '만 (×12 로 바꿔 담는다)');
  is(mapped.s_target === String(parseFloat(F.f_retspend)), '은퇴 희망 생활비가 간다');
  is(mapped.s_nps === String(parseFloat(F.f_np)), '국민연금 예상액이 간다');
  is(mapped.s_realty === String(parseFloat(F.f_home)), '거주 부동산이 간다');
  is(Object.keys(mapped).length >= 15, Object.keys(mapped).length + '칸이 옮겨진다');

  const blank = await app.evaluate(() => window.osToFinMap({ f_name: '', f_age: '40' }));
  is(!('s_name' in blank) && blank.s_age === '40',
    '빈 칸은 안 넘긴다 — 계산기에 이미 있는 값을 지우지 않는다');

  /* ── ③ 계산기가 받아서 상담 순서를 켜는가 ────────────────────── */
  console.log('\n[3] 계산기가 받아서 상담 순서를 켜는가');
  const fin = await ctx.newPage();
  fin.on('pageerror', e => errs.push('계산기: ' + e.message));
  await fin.goto(B + '/app/finance.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await fin.waitForTimeout(3000);

  await fin.evaluate(m => window.postMessage({ type: 'apexFinLoad', inputs: m }, location.origin), mapped);
  await fin.waitForTimeout(1200);
  is(await fin.inputValue('#s_name') === '홍길동', '계산기 고객명 칸에 들어갔다');
  is(await fin.inputValue('#s_gross') === mapped.s_gross, '연 총급여 칸에 들어갔다');
  is(await fin.inputValue('#s_target') === mapped.s_target, '목표 생활비 칸에 들어갔다');

  await fin.evaluate(pain => window.postMessage({ type: 'apexFinFlow', at: 0, pain }, location.origin), sent.pain);
  await fin.waitForTimeout(900);
  const s0 = await fin.evaluate(() => window.apexFlow.state());
  is(s0.on === true && s0.i === 0, '상담 순서가 팩트체크부터 켜진다');
  is(s0.pain === sent.pain, '아픈 곳이 상담자료에서 고른 그대로다 (' + s0.pain + ')');
  is(await fin.isVisible('#tab-factcheck.on'), '팩트체크 탭이 실제로 열렸다');

  /* ── ④ 순서를 끝까지 밟는가 ──────────────────────────────────── */
  console.log('\n[4] 팩트체크부터 종합 재무설계까지 이어지는가');
  is((await fin.textContent('.flw-count')).trim() === '1 / 5', '1 / 5 로 시작한다');
  is(await fin.isDisabled('#flowPrev'), '첫 단계에서 「이전」이 눌리지 않는다');
  const seen = [];
  for (let i = 0; i < 4; i++) {
    await fin.click('#flowNext'); await fin.waitForTimeout(650);
    seen.push((await fin.textContent('.flw-t')).trim());
  }
  is(seen.length === 4, '네 단계가 순서대로 열린다 — ' + seen.join(' → '));
  is((await fin.textContent('.flw-count')).trim() === '5 / 5', '5 / 5 에 도착한다');
  is(await fin.isVisible('#tab-total.on'), '마지막이 종합 재무설계 탭이다');

  console.log('\n[5] 아픈 곳을 바꾸면 그 탭으로 옮기는가');
  await fin.click('#flowPrev'); await fin.waitForTimeout(500);
  is(await fin.isVisible('#flowPain'), '4단계에서 아픈 곳을 고르는 칸이 나온다');
  await fin.selectOption('#flowPain', 'edufund'); await fin.waitForTimeout(800);
  is(await fin.isVisible('#tab-edufund.on'), '교육자금으로 고르니 그 탭이 열린다');
  await fin.selectOption('#flowPain', 'inherit'); await fin.waitForTimeout(800);
  is(await fin.isVisible('#tab-inherit.on'), '상속·증여로 바꾸니 따라 옮긴다');

  console.log('\n[6] 손으로 다른 탭을 눌러도 바가 따라오는가');
  await fin.evaluate(() => window.switchTab('cashflow'));
  await fin.waitForTimeout(600);
  is((await fin.textContent('.flw-count')).trim() === '3 / 5',
    '바가 3 / 5 로 따라온다 — 엉뚱한 자리를 가리키지 않는다');

  console.log('\n[7] 닫히는가 · 기억하는가');
  await fin.click('.flw-x'); await fin.waitForTimeout(400);
  /* × 를 눌렀을 때 그 클릭이 위로 올라가 알약을 다시 열어 버린 적이 있다.
     눌러도 안 닫히는 것처럼 보였다. 그래서 여기서 못 박는다. */
  is(await fin.isVisible('#flowBar.mini'), '× 를 누르면 닫혀서 작은 알약이 된다');
  const s1 = await fin.evaluate(() => window.apexFlow.state());
  is(s1.on === false && s1.i === 2 && s1.pain === 'inherit', '자리와 고른 것을 기억한다');
  await fin.reload({ waitUntil: 'domcontentloaded' }); await fin.waitForTimeout(2500);
  const s2 = await fin.evaluate(() => window.apexFlow.state());
  is(s2.i === 2 && s2.pain === 'inherit', '새로고침해도 기억한다');

  /* ── ⑤ 상담을 닫는 자리 ──────────────────────────────────────── */
  console.log('\n[8] 마지막 자리에서 상담이 닫히는가');
  await fin.evaluate(() => window.apexFlow.start(4));
  await fin.waitForTimeout(900);
  is(await fin.isVisible('#flowSave'), '「고객 365일에 저장」이 있다');
  is(await fin.isVisible('#flowDeck'), '「발표자료로」가 있다');
  is(await fin.isVisible('#flowEnd'), '「상담 끝내기」가 있다');
  is((await fin.textContent('.flw-done')).indexOf('저장하지 않으면') >= 0,
    '저장 안 하면 어떻게 되는지 말해 준다');

  const saved = await fin.evaluate(() => new Promise(res => {
    let got = null; const real = window.parent, oa = window.alert;
    Object.defineProperty(window, 'parent', { configurable: true, value: { postMessage: m => { got = m; } } });
    window.alert = function () {};
    document.getElementById('flowSave').click();
    setTimeout(() => {
      Object.defineProperty(window, 'parent', { configurable: true, value: real });
      window.alert = oa; res(got);
    }, 400);
  }));
  is(saved && saved.type === 'apexFinSave', '저장을 누르면 고객 365일 쪽지를 보낸다');
  is(saved && /종합 재무설계 보고서/.test(saved.title || ''), '제목이 붙는다');
  is(saved && saved.md && saved.md.length > 2000,
    '보고서가 통째로 담긴다 (' + (saved && saved.md ? saved.md.length : 0) + '자)');
  is(saved && saved.inputs && Object.keys(saved.inputs).length > 40,
    '입력한 칸도 같이 담긴다 (' + (saved && saved.inputs ? Object.keys(saved.inputs).length : 0) + '칸)');
  is(saved && /금융소비자 보호에 관한 법률/.test(saved.md || ''), '준법 문구가 보고서 안에 있다');

  console.log('\n[9] 발표자료가 아픈 곳에 맞는 트랙으로 열리는가');
  /* apexPresent 는 탭 이름이 아니라 트랙 글자를 받는다. 종합 재무설계 탭에서
     apexTrack() 을 쓰면 늘 연금으로만 열린다 — 그래서 여기서 확인한다. */
  for (const [pain, track] of [['pension', 'w'], ['invest', 't'], ['edufund', 'e'], ['inherit', 'w']]) {
    const url = await fin.evaluate(pn => new Promise(res => {
      window.postMessage({ type: 'apexFinFlow', at: 4, pain: pn }, location.origin);
      setTimeout(() => {
        let got = null; const om = window.apexOpenModal;
        window.apexOpenModal = u => { got = u; };
        document.getElementById('flowDeck').click();
        window.apexOpenModal = om;
        res(got);
      }, 500);
    }), pain);
    const m = /[?&]track=([a-z])/.exec(url || '');
    is(m && m[1] === track, pain + ' → track=' + (m ? m[1] : '없음') + ' (기대 ' + track + ')');
  }

  /* ── ⑥ 지출 합계 ─────────────────────────────────────────────── */
  console.log('\n[10] 남는 돈이 부풀려지지 않는가');
  const src = fs.readFileSync(path.join(ROOT, 'app/finance.html'), 'utf8');
  is(/expense=gv\('s_housing'\)[^;]*gv\('s_choice_etc'\)/.test(src),
    '「기타/월」이 지출 합계에 들어간다 — 빠져 있으면 남는 돈이 부풀려지고 그 돈으로 보험료를 제안하게 된다');

  is(errs.length === 0, '세 화면 어디서도 콘솔 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '상담 흐름 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '상담 흐름 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
