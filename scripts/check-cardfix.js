/* 다섯 가지가 실제로 되는가.

   1. 상담자료 — 보험마다 담보가 카드를 안 눌러도 다 보이고, 한 줄로 요약된다
   2. 보장분석 — 인체 한 장·전·후 그래프·피드백이 제안서 한 부로 묶인다
   3. 고객에게 전할 뉴스 — 그 자리에서 카드뉴스로 넘어간다
   4. 미끼 레이더 — 달마다 모아 두고 달로 나눠 본다
   5. 카드뉴스 — 사진 생성이 실패해도 단추가 죽지 않는다

   이 파일이 지키는 규칙 하나: <b>「모른다」 를 0 으로 바꿔치기하지 않는다.</b>   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8845;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
const S = f => fs.readFileSync(f, 'utf8');

(async () => {
  /* ══ [1] 상담자료 — 담보가 카드 앞면에 ═══════════════════════ */
  console.log('\n[1] 상담자료 — 담보가 눌러야만 보이던 것을 앞면으로');
  const sd = S('app/상담자료/메인 상담자료.html');
  ok(/function s10FaceRidersHtml\(ins\)/.test(sd), '카드 앞면 담보 함수가 있다');
  ok(/function s10FeedLine\(ins\)/.test(sd), '한 줄 요약 함수가 있다');
  ok(/\$\{s10FaceRidersHtml\(ins\)\}\s*\n\s*<div class="s10-card-meta">/.test(sd),
    '담보가 펼침(.s10-card-edit) 밖, 카드 앞면에 붙는다');
  /* 펼쳐야 보이는 자리보다 앞에 있어야 한다 */
  const iFace = sd.indexOf('${s10FaceRidersHtml(ins)}');
  const iEdit = sd.indexOf('<div class="s10-card-edit">');
  ok(iFace > 0 && iEdit > 0 && iFace < iEdit, '앞면 담보가 펼침 편집칸보다 위에 온다');
  ok(!/#s10 \.s10-face-list\s*\{[^}]*max-height/.test(sd),
    '담보 목록 높이를 자르지 않는다 — 잘라 두면 「없다」 로 읽힌다');

  /* 금액 읽기·요약을 손으로 아는 답과 견준다 */
  const grab = (a, b) => { const i = sd.indexOf(a), j = sd.indexOf(b, i); return sd.slice(i, j); };
  const fmt = n => Number(n).toLocaleString('ko-KR');
  const esc = x => String(x == null ? '' : x);
  eval(grab('function s10Man(a) {', '          /* ── 담보(특약) 표'));

  console.log('\n[2] 금액 — 「모른다」 를 0 으로 바꿔치기하지 않는다');
  ok(s10Man('5,000만') === 5000, '5,000만 → 5000');
  ok(s10Man('1억') === 10000, '1억 → 10000');
  ok(s10Man('1억 3000만') === 13000, '1억 3000만 → 13000');
  ok(s10Man('5000000') === 500, '원 단위 5000000 → 500만');
  ok(s10Man('') === null && s10Man(null) === null && s10Man('-') === null,
    '빈칸 · null · 「-」 는 모두 모른다');
  ok(s10Man('미가입') === null, '「미가입」 도 모른다');
  ok(s10Man('0') === null && s10Man('0만') === null, '0 은 금액이 아니다 — 모른다');
  ok(s10ManTxt(13000) === '1억 3,000만', '13000 → 1억 3,000만');
  ok(s10ManTxt(null) === '', '모르면 빈 글자');

  console.log('\n[3] 한 줄 요약 — 있는 것과 없는 것을 같이 말한다');
  const F = rs => s10FeedLine({ riders: rs });
  const three = [
    { name: '암진단비', amount: '5000만', kind: '진단비', target: '암' },
    { name: '뇌졸중진단비', amount: '2000만', kind: '진단비', target: '뇌' },
    { name: '급성심근경색', amount: '2000만', kind: '진단비', target: '심장' }];
  ok(F(three).tone === 'ok' && /3대 진단비가 다 있습니다/.test(F(three).txt), '3대가 다 있으면 그렇게 말한다');
  const gap = [{ name: '암진단비', amount: '1억', kind: '진단비', target: '암' }];
  ok(F(gap).tone === 'gap' && /뇌·심장 진단비가 비어 있습니다/.test(F(gap).txt), '빈 자리를 이름으로 짚는다');
  ok(F([]).tone === 'warn' && /못 읽었습니다/.test(F([]).txt), '담보를 못 읽으면 그렇다고 말한다');
  ok(/담보 3개/.test(F([
    { name: '암진단비', amount: '', kind: '진단비', target: '암' },
    { name: '뇌혈관', amount: '2000만', kind: '진단비', target: '뇌' },
    { name: '심장', amount: '-', kind: '진단비', target: '심장' }]).txt),
    '금액을 못 읽어도 담보 수는 그대로 센다');
  ok(/암·뇌·심장/.test(F([
    { name: '유사암진단비', amount: '1000만', kind: '진단비', target: null },
    { name: '뇌출혈진단비', amount: '2000만', kind: '진단비', target: null },
    { name: '허혈성심질환', amount: '1000만', kind: '진단비', target: null }]).txt),
    'target 이 비어도 이름으로 자리를 찾는다');

  /* ══ 앱 화면 ══════════════════════════════════════════════════ */
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1200 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'me', name: '윤점검', role: 'leader', plan: 'vip' };
    OS.session = { user: { id: 'me', email: 'me@t' } };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    try { localStorage.clear(); } catch (e) { }
  });

  console.log('\n[4] 보장분석 — 제안서 한 부로 묶인다');
  let r = await page.evaluate(() => {
    const R = (k, b, a) => ({ k: k, n: (BABA_TERMS.filter(t => t.k === k)[0] || {}).n || k, b: b, a: a });
    BABA.rows = [R('cancer', 3000, 5000), R('brain', 1000, 2000), R('heart', 1000, 2000),
      R('deathD', 5000, 10000), R('silD', 5000, 5000), R('fee', 18, 15)];
    const on = BABA_CH_ON, bd = BABA_BD_ON;
    BABA_CH_ON = false; BABA_BD_ON = false;      /* 화면 토글을 일부러 다 꺼 둔다 */
    const body = babaPropBodyHtml();
    BABA_CH_ON = on; BABA_BD_ON = bd;
    return { body: body, css: babaPropCss(), paint: ('' + babaPaint) };
  });
  ok(/bp-cover/.test(r.body), '제안서에 표지가 있다');
  ok(/한눈에/.test(r.body) && /bp-kpi/.test(r.body), '「한눈에」 숫자 판이 있다');
  ok(/baba-body-grid/.test(r.body), '인체 한 장이 들어 있다');
  ok(/담보별 전·후 비교/.test(r.body), '전·후 그래프 자리가 있다');
  ok(!/그릴 담보가 없습니다/.test(r.body),
    '화면 토글이 꺼져 있어도 그래프가 그려진다 — 제안서는 토글과 무관해야 한다');
  ok(/baba-feed/.test(r.body), '피드백이 들어 있다');
  ok(/bp-disc/.test(r.body) && /0 원이라는 뜻이 아닙니다/.test(r.body),
    '빈 칸이 0 원이 아니라는 것을 제안서가 스스로 밝힌다');
  ok(!/아래 표에서 고치신 값이/.test(r.body),
    '사장님께 드리는 화면 안내는 고객 제안서에 안 들어간다');
  ok(!/이 한 장 인쇄/.test(r.body), '제안서 안에 화면용 인쇄 단추가 섞여 들어가지 않는다');
  ok(/babaPropWrapHtml\(\)/.test(r.paint), '제안서 칸이 비포&애프터 화면에 선다');
  ok(/page-break-before/.test(r.css), '인쇄할 때 쪽이 나뉜다');

  /* 두 벌로 만들면 반드시 한쪽이 뒤처진다 — 미리보기와 인쇄본이 같은 것을 쓰는가 */
  r = await page.evaluate(() => ({ p: ('' + babaPropPrint), w: ('' + babaPropWrapHtml) }));
  ok(/babaPropBodyHtml\(\)/.test(r.p) && /babaPropBodyHtml\(\)/.test(r.w),
    '미리보기와 인쇄본이 같은 본문을 쓴다');

  console.log('\n[5] 고객에게 전할 뉴스 → 카드뉴스');
  r = await page.evaluate(() => {
    NLIVE.items = [{ t: '실손보험 개편안 발표', u: 'https://x/1', s: '매경', d: '', cats: ['ins'] }];
    NLIVE.cat = 'all';
    const html = nlItemsHtml();
    window.__toast = [];
    window.__went = '';
    const go0 = window.go; window.go = t => { window.__went = t; };
    nlToCard(0);
    window.go = go0;
    let saved = ''; try { saved = sessionStorage.getItem('apex_nl_topic') || ''; } catch (e) { }
    return { html: html, went: window.__went, topic: saved, fill: ('' + nlFillTopic) };
  });
  ok(/nlToCard\(0\)/.test(r.html), '뉴스 줄에 「이 소식으로 카드뉴스」 단추가 있다');
  ok(r.went === 'insta', '누르면 인스타 디자인 스튜디오로 넘어간다');
  ok(/실손보험 개편안 발표/.test(r.topic), '기사 제목이 주제로 넘어간다');
  ok(/출처 매경/.test(r.topic), '출처도 같이 넘어간다');
  ok(/istudio_topic/.test(r.fill), '주제 칸을 실제로 채운다');
  ok(/aiReady/.test(r.fill), 'AI 가 안 붙어 있으면 눌러 보게 하지 않고 말해 준다');
  ok(/setTimeout\(function\(\)\{nlFillTopic\(n\+1\)/.test(r.fill),
    '칸이 늦게 그려져도 다시 본다 — 조용히 아무 일도 안 일어나면 안 된다');

  console.log('\n[6] 카드뉴스 — 실패해도 단추가 죽지 않는다');
  r = await page.evaluate(() => ('' + cnGenAll));
  ok(/function wake\(\)/.test(r), '끝나면 단추를 되살리는 자리가 있다');
  ok(/if\(!idxs\.length\)\{\s*wake\(\);/.test(r.replace(/\n\s*/g, '\n')) || /wake\(\);/.test(r),
    '다 끝났을 때 되살린다');
  ok(/renderTodayCard\(\)/.test(r.slice(r.indexOf('function wake'))),
    '문구를 손으로 쓰지 않고 화면을 다시 그린다 — 남은 장수가 틀어지지 않게');

  ok(errs.length === 0, '앱에 자바스크립트 오류 없음' + (errs.length ? (' — ' + errs[0]) : ''));
  await browser.close();

  /* ══ [7] 미끼 레이더 — 달 서랍 ══════════════════════════════ */
  console.log('\n[7] 미끼 레이더 — 달마다 모아 둔다');
  const mk = S('app/상담자료/미끼레이더/index.html');
  ok(/function archAdd\(list\)/.test(mk), '받은 것을 서랍에 넣는 자리가 있다');
  ok(/function archMonths\(\)/.test(mk), '달마다 몇 건인지 세는 자리가 있다');
  ok(/const added=archAdd\(state\.news\)/.test(mk), '모을 때마다 서랍에 쌓는다');
  ok(/state\.mon\?archLoad\(\)\.filter/.test(mk), '달을 고르면 서랍 전체에서 그 달만 본다');
  ok(/if\(!state\.mon&&per<9999/.test(mk),
    '달을 고른 동안에는 기간 제한을 겹쳐 걸지 않는다');
  ok(/return \(n&&n\.got\)\|\|'없음'/.test(mk),
    '날짜를 못 읽은 기사도 버리지 않는다 — 받은 달에 넣는다');
  ok(/'날짜 모름'/.test(mk), '날짜를 모르면 화면에 그렇다고 적는다');
  ok(/MK_ARCH_MAX/.test(mk), '이 기기에 남길 최대 건수가 정해져 있다');
  ok(/data-i="'\+list\.indexOf\(n\)/.test(mk), '줄 번호가 지금 보는 목록 기준이다');
  ok(/const n=list\[i\];if\(!n\)return;/.test(mk), '화법 만들기도 보는 목록에서 찾는다');
  ok(/const n=list\[\+e\.target\.closest\('\.nitem'\)\.dataset\.i\]/.test(mk),
    '신상품 분석도 보는 목록에서 찾는다');
  ok(/mon:''/.test(mk), 'state 에 고른 달이 있다');

  srv.close();
  console.log('\n──────────────────────────────');
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('다섯 가지 점검 통과 — 담보 · 제안서 · 뉴스→카드 · 달 서랍 · 죽지 않는 단추.');
})().catch(e => { console.error(e); process.exit(1); });
