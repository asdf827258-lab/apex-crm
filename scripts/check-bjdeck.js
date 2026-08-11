/* 보장분석 심층 리포트 — 어떠한 일이 있어도 결과가 나오는가.

   여태 보장분석은 AI 가 쓴 글을 그대로 화면에 뿌렸다. 그래서 어떤 날은
   잘 나오고 어떤 날은 초라했다. 같은 프롬프트를 줘도 AI 는 매번 다른
   모양으로 쓰기 때문이다.

   이제 AI 는 JSON 만 만들고, 그림은 고정 템플릿이 그린다.
   그러면 디자인이 매번 같아지고 퀄리티가 아래로 내려가지 않는다.

   대신 새로운 위험이 생긴다 — AI 가 JSON 을 어기면 화면이 텅 빈다.
   그래서 여기서 일부러 망가뜨려 보고, 그래도 결과가 나오는지 확인한다.

     1. 제대로 된 JSON → 19장이 전부 그려지는가, 13가지 슬라이드가 다 되는가
     2. 코드펜스로 감싸 오면 → 벗겨서 읽는가
     3. 꼬리 쉼표가 있으면 → 고쳐서 읽는가
     4. 뒤가 잘려 오면 → 온전한 슬라이드만이라도 건지는가
     5. 아예 딴소리를 하면 → 한 번 더 시키고, 그래도 안 되면 자료로 만드는가
     6. AI 가 연결 안 됐으면 → 그래도 리포트가 나오는가
     7. AI 가 터지면 → 그래도 리포트가 나오는가
     8. 모델이 넣은 <script> 가 화면에서 살아나지 않는가
     9. 좁은 화면에서 옆으로 안 밀리는가                                   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8833;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{
   getSession:function(){return Promise.resolve({data:{session:{user:{id:'bj',email:'bj@test'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'bj'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

/* 열세 가지 슬라이드를 다 쓰는, 제대로 된 답 */
const GOOD = {
  client: { name: '김○○', age: 42, gender: '남', retireAge: 60, analysisDate: '2026-08-11' },
  advisor: { brand: '에이플러스에셋', name: '윤시현', phone: '010-0000-0000' },
  slides: [
    { type: 'cover', kicker: '보장분석', title: '지금 충분한 보장이<br><em>60세에 사라집니다</em>', lead: '새로 넣을 돈 없이 다시 배치합니다.', meta: '2026-08-11 · 42세' },
    { type: 'agenda', eyebrow: 'AGENDA', title: '오늘 볼 것', sub: '세 가지', parts: [
      { tone: 'blue', label: 'PART 1', title: '남은 시간', text: '경제활동기와 은퇴기' },
      { tone: '', label: 'PART 2', title: '보험 현황', text: '지금 무엇이 있는가' },
      { tone: 'amber', label: 'PART 3', title: '처방', text: '무엇부터 채우나' }],
      note: { tone: 'amber', title: '새로 넣을 돈은 없습니다', text: '지금 내는 보험료 안에서 다시 배치합니다.' } },
    { type: 'divider', eyebrow: 'PART 1', title: '남은 시간부터 봅니다', lead: '보험은 시간의 문제입니다.' },
    { type: 'lifespan', eyebrow: 'PART 1', title: '경제활동기 18년, 은퇴기 40년',
      active: { years: 18, from: 42, pct: 31 }, retire: { years: 40, from: 60, to: 100, pct: 69 },
      scenarios: [{ label: '생활비', value: '7억 2천', tone: 'c-blue' }, { label: '의료비', value: '1억 5천', tone: 'c-red' },
        { label: '간병비', value: '9천만', tone: 'c-amber' }],
      scenarioNote: '30년 기준 · 물가상승 제외', foot: '통계청 생명표 기준 개산' },
    { type: 'layers', eyebrow: 'PART 1', title: '3층 연금 진단', layers: [
      { state: 'on', no: '1층', name: '국민연금', desc: '가입 중' },
      { state: 'thin', no: '2층', name: '퇴직연금', desc: '적립 부족' },
      { state: 'off', no: '3층', name: '개인연금', desc: '없음' }],
      boxes: [{ tone: 'red', title: '3층이 비었습니다', text: '은퇴 후 소득이 국민연금 하나에 걸려 있습니다.' }] },
    { type: 'twobox', eyebrow: 'PART 1', title: '고객 고유 리스크',
      left: { title: '강점', text: '실손 <b>2세대</b> 유지 중' }, right: { tone: 'red', title: '공백', text: '간병·치매 <b>전무</b>' },
      cards: [{ label: '가족력', title: '뇌혈관', text: '부친 뇌경색' }, { label: '직업', title: '자영업', text: '소득 중단에 취약' },
        { label: '자녀', title: '2명', text: '독립까지 12년' }] },
    { type: 'divider', eyebrow: 'PART 2', title: '보험 현황을 봅니다', lead: '' },
    { type: 'breakdown', eyebrow: 'PART 2', title: '보험료 성격 분해', sub: '월 263.7만',
      items: [{ name: '순수보장성', value: '75.7만', pct: 28.7, color: '#3182F6' },
        { name: '자산성', value: '112.0만', pct: 42.5, color: '#8B95A1' },
        { name: '연금', value: '48.0만', pct: 18.2, color: '#C4CCD4' },
        { name: '납입완료임박', value: '28.0만', pct: 10.6, color: '#00B26B' }] },
    { type: 'table', eyebrow: 'PART 2', title: '자산성 계약 총납입 vs 보험금',
      head: ['계약', '월', '납입', '총납입', '사망보험금'],
      rows: [{ cells: ['A 종신 7년납', '52만', '7년', '4,368만', '1억'] },
        { cells: ['B 종신 10년납', '60만', '10년', '7,200만', '1억 2천'], tone: 'hi' },
        { cells: ['합계', '112만', '—', '1억 1,568만', '2억 2천'], tone: 'ok' }],
      foot: '※ 해지환급금 미반영 개산' },
    { type: 'divider', tone: 'red', eyebrow: 'PART 2', title: '충분합니다 — <em>60세까지만</em>', lead: '' },
    { type: 'cliff', eyebrow: 'PART 2 · 보험 현황', eyebrowWarn: true, title: '60세 절벽', afterLabel: '60세 이후',
      items: [
        { name: '일반암', drop: '77% 감소', now: '2억 6,000만', after: '6,000만', afterPct: 23 },
        { name: '뇌혈관질환', drop: '전액 소멸', now: '3,000만', after: '0', afterPct: 0 },
        { name: '허혈성심장질환', drop: '전액 소멸', now: '3,000만', after: '0', afterPct: 0 },
        { name: '수술비', drop: '60% 감소', now: '500만', after: '200만', afterPct: 40 },
        { name: '실손(2세대)', now: '유지', after: '유지', afterPct: 100, keep: true },
        { name: '입원일당', drop: '전액 소멸', now: '5만/일', after: '0', afterPct: 0 }],
      foot: '각 증권의 보장만기 기준 · 갱신형은 갱신 실패 시 더 빨리 소멸' },
    { type: 'twobox', eyebrow: 'PART 2', title: '왜 하필 그때인가',
      left: { title: '보험이 끝나는 때', text: '60세' }, right: { tone: 'red', title: '병이 오는 때', text: '암 발생의 <b>62%</b>가 60세 이후' } },
    { type: 'table', eyebrow: 'PART 2 · 보험 현황', eyebrowWarn: true,
      title: '진단비는 충분한데, 치료비가 비어 있습니다',
      sub: '담보명이 아니라 실제 지급 조건으로 다시 봤습니다',
      head: ['담보', '가입금액', '실제 지급 조건', '급여/비급여', '판정'],
      rows: [
        { cells: ['표적항암약물허가치료비', '2,000만', '허가된 표적항암제 투여 시', '비급여', '57세 소멸'], tone: 'hi' },
        { cells: ['암 전액본인부담 특정치료비', '1,000만', '종합병원 · 100분의100 본인부담', '전액본인부담', '유지'] },
        { cells: ['중입자방사선 치료비', '5,000만', '중입자 치료 시설 이용', '비급여', '시설 제한'] },
        { cells: ['뇌혈관질환수술비', '1,000만', '수술분류표상 수술', '급여', '시술 제외 가능'], tone: 'hi' },
        { cells: ['혈전용해 · 혈전제거 치료비', '0', '-', '-', '미가입'], tone: 'hi' }],
      boxes: [{ tone: 'red', title: '가장 흔한 시나리오가 안 잡힙니다',
        text: '뇌경색으로 <b>혈전용해제만 투여</b>받고 회복하면 수술비는 지급되지 않습니다.' },
        { tone: '', title: '진단비와 치료비는 다른 층입니다', text: '진단 확정으로 받는 돈과 실제 치료 행위로 받는 돈은 별개입니다.' }],
      foot: '※ 신정원에서 "기타 인보험(정액)담보"로 표기된 항목은 증권 확인 후 확정합니다.' },
    { type: 'timeline', eyebrow: 'PART 2', title: '만기 타임라인',
      left: [{ year: '2038년 · 54세', hot: true, text: '표적항암 소멸' }, { year: '2040년 · 56세', text: '입원일당 소멸' },
        { year: '2042년 · 58세', text: '수술비 감액' }, { year: '2044년 · 60세', hot: true, text: '뇌·심장 전액 소멸' }],
      right: [{ year: '2046년 · 62세', text: '일반암 감액' }, { year: '2050년 · 66세', text: '갱신 보험료 급등' },
        { year: '2054년 · 70세', text: '간병 필요 구간 진입' }, { year: '2064년 · 80세', hot: true, text: '남는 보장 없음' }] },
    { type: 'list', eyebrow: 'PART 3', title: '지켜야 할 계약',
      left: [{ ic: 'g', mark: '✓', title: '실손 2세대', text: '어떤 경우에도 유지' }, { ic: 'g', mark: '✓', title: '납입완료 종신', text: '자산으로 재분류' }],
      right: [{ ic: 'r', mark: '!', title: '갱신형 특약', text: '갱신 시 보험료 급등 확인' }, { ic: 'a', mark: '?', title: '무해지 계약', text: '유지 가능성 먼저 판단' }] },
    { type: 'twobox', eyebrow: 'PART 3', title: '경제활동기와 은퇴기를 나눕니다',
      left: { tone: 'blue', title: '경제활동기', text: '소득 중단 대비 — 사망·후유장해' },
      right: { tone: 'green', title: '은퇴기', text: '치료비·간병비 — 평생 남는 담보' } },
    { type: 'cards', eyebrow: 'PART 3', title: '노후 4축', cols: 4,
      cards: [{ tone: 'red', label: '1순위', title: '뇌·심장 치료비', text: '혈전용해·제거 포함' },
        { tone: 'amber', label: '2순위', title: '간병', text: '간병인사용일당' },
        { tone: 'blue', label: '3순위', title: '비급여 항암', text: '표적·면역 대응' },
        { tone: 'green', label: '4순위', title: '장기요양·치매', text: '60대 이후 핵심' }] },
    { type: 'plans', eyebrow: 'PART 3', title: 'A · B · C 세 가지 길', plans: [
      { name: 'A안 · 보수적', text: '지금 것을 그대로 두고 부족분만 최소로 채웁니다.', amount: '월 30~40만 확보', gray: true },
      { name: 'B안 · 균형', badge: '추천', pick: true, text: '자산성 일부를 재배치해 치료비 층을 세웁니다.', amount: '월 60~70만 확보' },
      { name: 'C안 · 적극', text: '자산성을 크게 정리해 평생 보장으로 옮깁니다.', amount: '월 100만 확보' }] },
    { type: 'table', eyebrow: 'PART 3', title: '시뮬레이션', head: ['항목', '지금', 'B안 적용 후'],
      rows: [{ cells: ['월 보험료', '263.7만', '263.7만'] }, { cells: ['60세 이후 암', '6,000만', '1억'], tone: 'ok' },
        { cells: ['60세 이후 뇌·심장', '0', '각 3,000만'], tone: 'ok' }] },
    { type: 'list', eyebrow: 'PART 3', title: '실행 순서',
      left: [{ ic: 'b', mark: '1', title: '증권 원본 확인', text: '신정원과 대조 — 특약 누락이 자주 있습니다' },
        { ic: 'b', mark: '2', title: '건강 고지 점검', text: '인수 가능성 먼저 확인' }],
      right: [{ ic: 'b', mark: '3', title: '신규 청약', text: '승낙까지 기다립니다' },
        { ic: 'r', mark: '4', title: '신규 승낙 확인 후 기존 정리', text: '승낙 전에는 절대 해지하지 않습니다' }] },
    { type: 'cover', kicker: '마무리', title: '새로 넣을 돈 없이<br><em>평생 남는 보장</em>으로', lead: '오늘 정한 순서대로 하나씩 하겠습니다.' }
  ]
};

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

async function boot(page) {
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#bojang', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'bj', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'bj', email: 'bj@test' } };
    window.toast = function () {};
    go('bojang');
  });
  await page.waitForTimeout(400);
}

/* 답 한 줄을 주고 화면에 세운다 — runPdf 를 통째로 돌리지 않고 표시 경로만 본다 */
async function show(page, raw, opt) {
  return page.evaluate(a => {
    var host = document.getElementById('pres_bojang');
    if (!host) { host = document.createElement('div'); host.id = 'pres_bojang'; document.body.appendChild(host); }
    host._parts = a.parts || [{ name: 'x.pdf', text: a.text || '' }];
    host._opts = {};
    host._spec = a.spec ? { system: 's', user: 'u', max: 100 } : null;
    bjCssMount();
    var r = bjShow('bojang', a.raw, { deck: true }, host._spec, host._parts, host._opts, a.retried === true);
    return (r && r.then) ? r.then(function () { return 1; }) : 1;
  }, Object.assign({ raw }, opt || {}));
}

async function seen(page) {
  return page.evaluate(() => {
    var host = document.getElementById('pres_bojang');
    var deck = host.querySelector('.bj-deck');
    var kinds = {};
    [].slice.call(host.querySelectorAll('.bj-s')).forEach(function (s) {
      (s.className.match(/bjt-([a-z]+)/) || []).slice(1).forEach(function (k) { kinds[k] = (kinds[k] || 0) + 1; });
    });
    return {
      slides: host.querySelectorAll('.bj-s').length,
      kinds: kinds,
      text: (deck ? deck.textContent : '').replace(/\s+/g, ' '),
      warn: (host.querySelector('.bj-warn') || {}).textContent || '',
      buttons: host.querySelectorAll('.rpt-actions button').length,
      scripts: host.querySelectorAll('script').length,
      /* 이스케이프된 글자가 아니라 「진짜 속성으로 붙었는가」 를 본다 */
      handlers: (function () {
        var n = 0;
        [].slice.call(host.querySelectorAll('.bj-deck *')).forEach(function (e) {
          for (var i = 0; i < e.attributes.length; i++) if (/^on/i.test(e.attributes[i].name)) n++;
        });
        return n;
      })(),
      tags: host.querySelectorAll('.bj-deck img,.bj-deck iframe,.bj-deck a,.bj-deck object').length
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await boot(page);

  const ready = await page.evaluate(() => typeof bjShow === 'function' && typeof bjDeckHtml === 'function' && typeof bjLocalDeck === 'function');
  if (!ready) {
    console.log('✗ 보장분석 템플릿이 실려 있지 않습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ── 1 ── */
  console.log('\n[1] 제대로 된 답이 오면');
  await show(page, JSON.stringify(GOOD));
  let v = await seen(page);
  is(v.slides === GOOD.slides.length, GOOD.slides.length + '장이 전부 그려진다 (' + v.slides + '장)');
  const want = ['cover', 'agenda', 'divider', 'lifespan', 'layers', 'twobox', 'breakdown', 'table', 'cliff', 'timeline', 'list', 'cards', 'plans'];
  const missing = want.filter(k => !v.kinds[k]);
  is(missing.length === 0, '열세 가지 슬라이드가 다 그려진다' + (missing.length ? ' — 빠짐: ' + missing.join(', ') : ''));
  is(v.warn === '', '경고 없이 깨끗하게 나온다');
  is(/60세 절벽/.test(v.text), '절벽 슬라이드의 제목이 보인다');
  is(/혈전용해/.test(v.text), '치료비 정밀 진단이 보인다');
  is(/뇌혈관질환/.test(v.text) && /전액 소멸/.test(v.text), '전액 소멸 담보가 표시된다');
  is(/금융소비자 보호에 관한 법률/.test(v.text), '준법 고지가 항상 붙는다');
  is(/신규 계약 승낙을 확인한 뒤/.test(v.text), '승낙 전 해지 금지가 고지에 있다');
  is(v.buttons >= 5, '인쇄·저장·복사 버튼이 붙는다 (' + v.buttons + '개)');

  /* 막대 길이가 실제 값을 따르는가 — 숫자를 그림으로 옮기는 곳이라 틀리면 거짓말이 된다 */
  const bars = await page.evaluate(() => {
    var out = [];
    [].slice.call(document.querySelectorAll('#pres_bojang .bj-ci')).forEach(function (c) {
      var aft = c.querySelector('.bj-cibar.aft i');
      out.push({ name: (c.querySelector('.bj-cin') || {}).textContent || '', w: aft ? aft.style.width : '' });
    });
    return out;
  });
  const cliffOk = bars.length === 6 &&
    /^23%$/.test(bars[0].w) && /^0%$/.test(bars[1].w) && /^100%$/.test(bars[4].w);
  is(cliffOk, '막대 길이가 실제 afterPct 를 따른다 (' + bars.map(b => b.w).join(' / ') + ')');

  /* ── 2 ── */
  console.log('\n[2] AI 가 형식을 어겼을 때');
  await show(page, '```json\n' + JSON.stringify(GOOD) + '\n```');
  v = await seen(page);
  is(v.slides === GOOD.slides.length && v.warn === '', '코드펜스로 감싸 와도 벗겨서 읽는다');

  await show(page, '네, 만들었습니다!\n' + JSON.stringify(GOOD) + '\n필요하시면 말씀해 주세요.');
  v = await seen(page);
  is(v.slides === GOOD.slides.length && v.warn === '', '앞뒤에 인사말이 붙어 와도 읽는다');

  const comma = JSON.stringify(GOOD).replace(/\}\]\}$/, '},]}');
  await show(page, comma);
  v = await seen(page);
  is(v.slides === GOOD.slides.length, '꼬리 쉼표가 있어도 고쳐서 읽는다 (' + v.slides + '장)');

  /* 뒤가 잘려 온 경우 — 온전한 슬라이드만이라도 건진다 */
  const cut = JSON.stringify(GOOD).slice(0, Math.floor(JSON.stringify(GOOD).length * 0.62));
  await show(page, cut);
  v = await seen(page);
  is(v.slides >= 6, '뒤가 잘려 와도 온전한 슬라이드를 건진다 (' + v.slides + '장)');
  is(/살렸습니다|읽어 낸 것만으로/.test(v.warn),
    '몇 장만 건졌는지 숨기지 않는다 — ' + v.warn.replace(/\s+/g, ' ').slice(0, 44));

  /* ── 3 ── */
  console.log('\n[3] 두 번 어기면 자료로 만든다');
  await page.evaluate(() => {
    window.__aiCalls = 0;
    window.callAI = function () { window.__aiCalls++; return Promise.resolve('여전히 JSON 이 아닙니다'); };
  });
  await show(page, '죄송합니다, JSON 을 만들 수 없습니다.', {
    spec: true, text: '일반암 진단비 5,000만원\n뇌혈관질환 3,000만원\n실손의료비 가입\n간병인사용일당 없음'
  });
  await page.waitForTimeout(500);
  v = await seen(page);
  const calls = await page.evaluate(() => window.__aiCalls);
  is(calls === 1, '한 번 더, 더 엄하게 시킨다 (' + calls + '번)');
  is(v.slides >= 4, '그래도 안 되면 자료에서 읽어 낸 것으로 만든다 (' + v.slides + '장)');
  is(/읽어 낸 것만으로/.test(v.warn), '왜 이렇게 됐는지 말해 준다');
  is(/일반암|5,000만/.test(v.text), '자료에서 읽은 담보가 실제로 들어간다');
  is(/신규 승낙 전 기존 해지 금지|신규 계약 승낙을 확인한 뒤/.test(v.text), '이때도 준법 고지가 붙는다');

  /* ── 4 ── */
  console.log('\n[4] AI 가 아예 없을 때');
  const local = await page.evaluate(() => {
    var d = bjLocalDeck([{ name: 'a.pdf', text: '일반암 진단비 5,000만원\n허혈성심장질환 3,000만원\n간병인사용일당 확인필요' }], {}, 'AI 미연결');
    document.getElementById('pres_bojang').innerHTML = bjDeckHtml(d);
    return { n: (d.slides || []).length, txt: document.getElementById('pres_bojang').textContent.replace(/\s+/g, ' ') };
  });
  is(local.n >= 4, 'AI 없이도 리포트가 나온다 (' + local.n + '장)');
  is(/일반암/.test(local.txt), '자료에서 담보를 찾아 넣는다');
  is(/증권 원본/.test(local.txt) && /신규 승낙 전 기존 해지 금지/.test(local.txt),
    '사람이 확인할 것을 빠짐없이 적는다');
  is(!/충분|부족합니다/.test(local.txt), '지어내지 않는다 — 판정을 하지 않는다');

  /* 텍스트가 하나도 없는 스캔본이어도 빈 화면을 주지 않는다 */
  const empty = await page.evaluate(() => {
    var d = bjLocalDeck([{ name: 'scan.pdf', text: '' }], {}, '텍스트 없음');
    return { n: (d.slides || []).length, html: bjDeckHtml(d).length };
  });
  is(empty.n >= 4 && empty.html > 500, '읽을 것이 하나도 없어도 화면이 비지 않는다 (' + empty.n + '장)');

  /* ── 5 ── */
  console.log('\n[5] 모델이 이상한 것을 넣어도');
  const evil = {
    slides: [
      { type: 'cover', title: '<script>window.__pwned=1;<\/script>안녕', lead: '<img src=x onerror="window.__pwned=2">' },
      { type: 'table', head: ['<b>굵게</b>', 'B'], rows: [{ cells: ['<em>기울임</em>', '<script>window.__pwned=3;<\/script>'] }] },
      { type: 'cliff', items: [{ name: 'X', now: '1억', after: '0', afterPct: 9999 }, { name: 'Y', now: '1억', after: '0', afterPct: -50 }] },
      { type: '알수없는종류', title: '모르는 슬라이드', sub: '그래도 버리지 않는다', foo: '이 글자는 살아야 한다' },
      { type: 'breakdown', items: [{ name: 'A', value: '1만', pct: 'abc', color: 'javascript:alert(1)' }] }
    ]
  };
  await show(page, JSON.stringify(evil));
  v = await seen(page);
  const pwned = await page.evaluate(() => window.__pwned || 0);
  is(pwned === 0, '<script> 가 실행되지 않는다');
  is(v.scripts === 0, '<script> 태그가 화면에 안 남는다 (' + v.scripts + '개)');
  is(v.handlers === 0, 'onerror 같은 실행 속성이 하나도 안 붙는다 (' + v.handlers + '개)');
  is(v.tags === 0, 'img · a · iframe 이 만들어지지 않는다 (' + v.tags + '개)');
  is(/안녕/.test(v.text), '위험한 것만 빼고 글자는 살린다');
  is(/굵게/.test(v.text) && /기울임/.test(v.text), '허용한 태그(b·em)는 살아난다');
  const clamp = await page.evaluate(() => {
    var b = [].slice.call(document.querySelectorAll('#pres_bojang .bj-cibar.aft i'));
    return b.map(function (x) { return x.style.width; });
  });
  is(clamp[0] === '100%' && clamp[1] === '0%', '말도 안 되는 숫자는 0~100 으로 잘린다 (' + clamp.join(' / ') + ')');
  is(/모르는 슬라이드/.test(v.text) && /이 글자는 살아야 한다/.test(v.text),
    '모르는 종류가 와도 내용을 버리지 않는다');
  const badcol = await page.evaluate(() =>
    document.getElementById('pres_bojang').innerHTML.indexOf('javascript:') < 0);
  is(badcol, '이상한 색 값이 스타일로 안 들어간다');

  /* ── 6 ── */
  console.log('\n[6] 저장·인쇄');
  const md = await page.evaluate(g => {
    var m = bjMd(g);
    return { len: m.length, hasTable: m.indexOf('| 담보 |') >= 0, hasCliff: /일반암/.test(m), law: /금융소비자보호법/.test(m) };
  }, GOOD);
  is(md.len > 800, '고객 365일에 저장할 글로도 바뀐다 (' + md.len + '자)');
  is(md.hasTable, '표가 글에서도 표로 남는다');
  is(md.hasCliff && md.law, '절벽 내용과 준법 고지가 글에도 들어간다');

  await show(page, JSON.stringify(GOOD));
  const css = await page.evaluate(() => {
    var s = document.getElementById('bjDeckCss');
    return { mounted: !!s, len: s ? s.textContent.length : 0, print: s ? s.textContent.indexOf('@media print') >= 0 : false };
  });
  is(css.mounted && css.len > 2000, '리포트 전용 스타일이 한 번만 심긴다');
  is(css.print, '인쇄할 때 슬라이드가 잘리지 않게 되어 있다');

  /* ── 7 ── */
  console.log('\n[7] 좁은 화면');
  await page.setViewportSize({ width: 430, height: 900 });
  await page.waitForTimeout(350);
  const narrow = await page.evaluate(() => {
    var d = document.querySelector('#pres_bojang .bj-deck');
    var over = [].slice.call(document.querySelectorAll('#pres_bojang .bj-s'))
      .filter(function (s) { return s.scrollWidth > s.clientWidth + 2; }).length;
    return { over: over, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, has: !!d };
  });
  is(narrow.has, '좁은 화면에서도 리포트가 있다');
  is(narrow.over === 0, '슬라이드가 옆으로 안 넘친다 (' + narrow.over + '장 넘침)');
  is(narrow.sw <= narrow.cw + 2, '페이지가 가로로 안 밀린다 (' + narrow.sw + ' / ' + narrow.cw + ')');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 100) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '보장분석 리포트 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '보장분석 리포트 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
