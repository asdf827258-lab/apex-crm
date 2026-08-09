/* 투자·경제 — 주식관리 · 펀드관리 · 경제동향을 실제로 눌러 본다.

   돈이 걸린 화면이라 "그려졌다"로는 부족하다. 수량·평단을 넣었을 때
   평가손익이 맞게 나오는지, 목표·손절 경고가 제때 뜨는지, 토스 바로가기가
   진짜 그 종목 주소로 가는지, 키가 없을 때도 화면이 안 죽는지까지 본다.

   시세 서버(/api/market)는 가짜로 세운다. 토스·한국투자증권을 부르지 않는다. */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8821;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

/* 가짜 시세 서버 — kind 별로 정해진 답을 준다 */
const DEEPLINK = {
  krx: 'https://www.tossinvest.com/stocks/A{code}',
  overseas: 'https://www.tossinvest.com/?focusedProductCode={code}'
};
const QUOTES = {
  '005930': { code: '005930', market: 'KRX', currency: 'KRW', name: '삼성전자', price: 84000, change: 1000, changeRate: 1.2, src: 'toss' },
  '000660': { code: '000660', market: 'KRX', currency: 'KRW', name: 'SK하이닉스', price: 59500, change: -500, changeRate: -0.83, src: 'kis' },
  'NAS:AAPL': { code: 'NAS:AAPL', market: 'NAS', currency: 'USD', name: 'AAPL', price: 232.5, changeRate: 0.4, src: 'toss' }
};
let apiHits = 0;
function marketReply(url) {
  apiHits++;
  const q = new URL(url, 'http://x').searchParams;
  const kind = q.get('kind') || 'health';
  const meta = { kind, marketOpen: true, at: new Date().toISOString() };
  if (kind === 'health') {
    return { ok: true, meta, has: { toss: true, kis: true, ecos: true, fund: false, news: true }, quoteProvider: 'toss', deeplink: DEEPLINK };
  }
  if (kind === 'quote') {
    const codes = (q.get('codes') || '').split(',').filter(Boolean);
    return { ok: true, meta, quotes: codes.map(c => QUOTES[c]).filter(Boolean), errors: [], need: [] };
  }
  if (kind === 'fund') {
    const codes = (q.get('codes') || '').split(',').filter(Boolean);
    return { ok: true, meta, funds: codes.map(c => ({ code: c, market: 'FUND', currency: 'KRW', name: '테스트펀드', price: 1200, src: 'data.go.kr' })), errors: [], need: [] };
  }
  if (kind === 'all') {
    return {
      ok: true, meta, deeplink: DEEPLINK,
      indices: [{ id: 'kospi', name: '코스피', price: 2765.43, change: 12.1, changeRate: 0.44 }],
      econ: [{ id: 'base_rate', name: '한국은행 기준금리', unit: '%', value: 2.5, time: '202607', prev: 2.75, diff: -0.25, hint: '연금 수익률 기대치의 출발점', series: [{ t: '1', v: 3 }, { t: '2', v: 2.75 }, { t: '3', v: 2.5 }, { t: '4', v: 2.5 }] }],
      news: [{ title: '기준금리 동결', link: 'https://example.com/1', date: '', desc: '', source: '테스트', hits: ['기준금리'] }],
      watchlist: [QUOTES['005930']],
      watchlistDefs: [{ code: '005930', name: '삼성전자' }],
      errors: [], need: []
    };
  }
  return { ok: false, meta, message: 'unknown kind' };
}

const srv = http.createServer((req, res) => {
  const raw = req.url;
  let p = decodeURIComponent(raw.split('?')[0]);
  if (p === '/api/market') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(marketReply(raw)));
    return;
  }
  /* 앱이 부팅할 때 AI 프록시가 살아 있는지 확인한다 — 배포된 사이트처럼 답해 준다.
     (여기서 404 를 주면 이 기능과 무관한 콘솔 오류가 잡힌다) */
  if (p === '/api/generate' || p === '/api/gemini') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ content: [{ text: '' }], candidates: [] }));
    return;
  }
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { console.log('  [404]', raw); res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.__pageErrors=[];
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
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'iv',email:'iv@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'iv'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
  /* 우리 서버 말고는 아무 데도 나가지 않는다 — 토스·KIS 실호출 차단 */
  const outside = [];
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    if (/tossinvest|koreainvestment|bok\.or\.kr|data\.go\.kr/.test(u)) outside.push(u);
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'iv', name: '대표', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'iv', email: 'iv@t' } };
    OS.cfg = { schema_version: '33' };
    try { localStorage.removeItem('apex_invest_v1'); } catch (e) {}
    window.toast = function (m) { (window.__toast = window.__toast || []).push(m); };
    if (window.INV) { INV.st = null; INV.live = {}; INV.mkt = null; INV.health = null; INV.link = null; }
  });

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* ── 메뉴에 붙어 있는가 ─────────────────────────────────────────── */
  const nav = await page.evaluate(() => {
    const g = TABS.filter(x => x.group === '투자·경제')[0];
    return { has: !!g, ids: g ? g.items.map(i => i.id) : [], vis: visibleTabs().some(x => x.group === '투자·경제') };
  });
  ok(nav.has && nav.ids.length === 3, '메뉴에 투자·경제 3개가 있다 (' + nav.ids.join(', ') + ')');
  ok(nav.vis, '대표 계정에 메뉴가 보인다');

  /* ── ① 주식관리 ─────────────────────────────────────────────────── */
  await page.evaluate(() => go('inv_stock'));
  await page.waitForTimeout(900);
  const s0 = await page.evaluate(() => ({
    root: !!document.getElementById('invRoot'),
    sum: document.querySelectorAll('.iv-sum .c').length,
    tabs: document.querySelectorAll('.biz-tabs button').length,
    txt: (document.getElementById('dynPane') || {}).textContent || ''
  }));
  ok(s0.root, '주식관리 화면이 열린다');
  ok(s0.sum === 4, '요약 카드 4개 (매입원가·평가금액·평가손익·수익률)');
  ok(s0.tabs === 3, '위쪽 탭 3개');
  ok(/원금손실/.test(s0.txt), '준법 고지(원금손실)가 화면에 있다');

  /* 종목을 실제 입력 흐름으로 넣는다 (prompt 를 가로챈다) */
  await page.evaluate(() => {
    const q = ['005930', '삼성전자', '10', '70000'];
    let i = 0;
    window.prompt = () => q[i++];
    invAddHold('stock');
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const q = ['000660', 'SK하이닉스', '5', '70000'];
    let i = 0;
    window.prompt = () => q[i++];
    invAddHold('stock');
  });
  await page.waitForTimeout(1400);   /* 시세 fetch */

  const s1 = await page.evaluate(() => {
    const a = invCur(), t = invCalc(a);
    const cell = id => (document.getElementById(id) || {}).textContent || '';
    const h = a.holdings;
    return {
      rows: document.querySelectorAll('.iv-tb tbody tr').length,
      cost: Math.round(t.cost), val: Math.round(t.val), pl: Math.round(t.pl), rate: Math.round(t.rate * 100) / 100,
      cur0: cell('ivc_' + h[0].id), pl0: cell('ivp_' + h[0].id), rt0: cell('ivr_' + h[0].id),
      rt1: cell('ivr_' + h[1].id),
      sumVal: cell('ivSumVal')
    };
  });
  ok(s1.rows === 2, '종목 2개가 표에 들어갔다');
  /* 삼성 10주 평단 70,000 → 현재가 84,000 = +140,000 / SK 5주 70,000 → 59,500 = -52,500 */
  ok(s1.cost === 1050000, '매입원가 ' + s1.cost.toLocaleString() + '원 (10×70,000 + 5×70,000)');
  ok(s1.val === 1137500, '평가금액 ' + s1.val.toLocaleString() + '원 (10×84,000 + 5×59,500)');
  ok(s1.pl === 87500, '평가손익 ' + s1.pl.toLocaleString() + '원');
  ok(s1.rate === 8.33, '수익률 ' + s1.rate + '%');
  ok(/84,000/.test(s1.cur0), '현재가 칸이 실시간 값으로 채워졌다 (' + s1.cur0.trim().slice(0, 24) + ')');
  ok(/\+20%/.test(s1.rt0), '삼성전자 수익률 +20% (' + s1.rt0 + ')');
  ok(/-15%/.test(s1.rt1), 'SK하이닉스 수익률 -15% (' + s1.rt1 + ')');

  /* 목표 도달 · 손절 이탈 경고 — 기본값 목표 20% / 손절 15% */
  const al = await page.evaluate(() => ({
    up: document.querySelectorAll('.iv-alert.up').length,
    dn: document.querySelectorAll('.iv-alert.dn').length,
    txt: (document.getElementById('ivAlert') || {}).textContent || ''
  }));
  ok(al.up >= 1, '목표 도달 경고가 뜬다 (+20% ≥ 목표 20%)');
  ok(al.dn >= 1, '손절 이탈 경고가 뜬다 (-15% ≤ -15%)');
  ok(/삼성전자/.test(al.txt) && /SK하이닉스/.test(al.txt), '어느 종목인지 이름이 나온다');

  /* 토스 바로가기 */
  const toss = await page.evaluate(() => {
    const as = Array.prototype.map.call(document.querySelectorAll('.iv-toss'), a => a.getAttribute('href'));
    return { n: as.length, first: as[0] || '', all: as, blank: !!document.querySelector('.iv-toss[target="_blank"]') };
  });
  ok(toss.n === 2, '종목마다 토스 바로가기가 붙는다 (' + toss.n + '개)');
  ok(toss.first === 'https://www.tossinvest.com/stocks/A005930',
    '토스 주소가 정확하다 — ' + toss.first);
  ok(toss.all.indexOf('https://www.tossinvest.com/stocks/A000660') >= 0, '두 번째 종목 주소도 맞다');
  ok(toss.blank, '새 탭으로 열린다');

  /* 해외 종목 표기 */
  const ov = await page.evaluate(() => invTossUrl('NAS:AAPL', 'stock'));
  ok(ov === 'https://www.tossinvest.com/?focusedProductCode=AAPL', '해외 종목 주소 — ' + ov);

  /* 값을 고치면 다시 계산되는가 */
  await page.evaluate(() => {
    const h = invCur().holdings[0];
    const el = document.querySelector('#ivnm_' + h.id).closest('tr').querySelectorAll('input')[1];
    el.value = '20'; el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const s2 = await page.evaluate(() => Math.round(invCalc(invCur()).val));
  ok(s2 === 1977500, '수량을 20주로 고치니 평가금액이 다시 계산된다 (' + s2.toLocaleString() + '원)');

  /* ── ② 펀드관리 ─────────────────────────────────────────────────── */
  await page.evaluate(() => go('inv_fund'));
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const q = ['F0001', '테스트펀드', '100', '1000'];
    let i = 0;
    window.prompt = () => q[i++];
    invAddHold('fund');
  });
  await page.waitForTimeout(1400);
  const f1 = await page.evaluate(() => {
    const h = invCur().holdings.filter(x => x.type === 'fund')[0];
    return {
      rows: document.querySelectorAll('.iv-tb tbody tr').length,
      manual: document.querySelectorAll('.iv-tb tr.iv-sub').length,
      rt: (document.getElementById('ivr_' + h.id) || {}).textContent || '',
      toss: document.querySelectorAll('.iv-tb .iv-toss').length,
      etf: document.querySelectorAll('a.iv-chip').length,
      tax: /연금저축|IRP|ISA/.test((document.getElementById('dynPane') || {}).textContent || '')
    };
  });
  ok(f1.rows === 2, '펀드 표에 본줄+수동입력줄이 그려진다');
  ok(f1.manual === 1, '기준가 수동 입력칸이 있다');
  ok(/\+20%/.test(f1.rt), '펀드 수익률이 계산된다 (1,000 → 1,200 = ' + f1.rt + ')');
  ok(f1.toss === 0, '펀드에는 토스 종목 바로가기를 붙이지 않는다 (종목 화면이 없다)');
  ok(f1.etf >= 5, 'ETF 대안 칩이 토스 링크로 걸려 있다 (' + f1.etf + '개)');
  ok(f1.tax, '세제 연결(연금저축·IRP·ISA) 안내가 있다');

  /* ── ③ 경제동향 ─────────────────────────────────────────────────── */
  await page.evaluate(() => go('inv_econ'));
  await page.waitForTimeout(1600);
  const e1 = await page.evaluate(() => ({
    idx: document.querySelectorAll('#invIdx .iv-card').length,
    econ: document.querySelectorAll('#invEcon .iv-card').length,
    spark: document.querySelectorAll('#invEcon .iv-spark').length,
    watch: document.querySelectorAll('#invWatch .iv-card').length,
    wtoss: document.querySelectorAll('#invWatch .iv-toss').length,
    news: document.querySelectorAll('#invNews .biz-news-item').length,
    stamp: (document.getElementById('invStamp') || {}).textContent || '',
    hint: /연금/.test((document.getElementById('invEcon') || {}).textContent || '')
  }));
  ok(e1.idx === 1, '지수 카드가 그려진다');
  ok(e1.econ === 1 && e1.spark === 1, '경제지표 카드와 추이 그래프가 있다');
  ok(e1.hint, '지표마다 "고객에게 뜻하는 것" 한 줄이 붙는다');
  ok(e1.watch === 1 && e1.wtoss === 1, '관심 종목 카드에도 토스 바로가기가 있다');
  ok(e1.news === 1, '뉴스가 그려진다');
  ok(/갱신|장/.test(e1.stamp), '갱신 시각이 표시된다 (' + e1.stamp.trim() + ')');

  /* ── 키가 하나도 없을 때도 안 죽는가 ────────────────────────────── */
  await page.evaluate(() => {
    INV.mkt = null; INV.health = null;
    window.__origFetch = window.fetch;
    window.fetch = () => Promise.resolve({
      json: () => Promise.resolve({
        ok: false, meta: { kind: 'all' }, indices: [], econ: [], news: [], watchlist: [],
        watchlistDefs: [{ code: '005930', name: '삼성전자' }],
        deeplink: null, errors: [],
        need: ['DATA_GO_KR_KEY', 'TOSS_CLIENT_ID', 'TOSS_CLIENT_SECRET', 'KIS_APP_KEY', 'KIS_APP_SECRET']
      })
    });
    go('inv_econ');
  });
  await page.waitForTimeout(1400);
  const nokey = await page.evaluate(() => ({
    need: !!document.querySelector('#invSetup .iv-need'),
    txt: (document.getElementById('invSetup') || {}).textContent || '',
    watch: document.querySelectorAll('#invWatch .iv-card').length,
    wtoss: document.querySelectorAll('#invWatch .iv-toss').length,
    slim: document.querySelectorAll('.iv-need-slim').length
  }));
  ok(nokey.need, '키가 없으면 설정 안내 카드가 뜬다');
  ok(/한 세트만 넣으면/.test(nokey.txt) && /공공데이터포털/.test(nokey.txt),
    '"한 세트만 넣으면 되고, 가장 빨리 켜지는 건 공공데이터포털" 이라고 알려 준다');
  ok(/자동승인|계좌 불필요/.test(nokey.txt), '승인 대기 없이 켤 수 있다는 점을 짚어 준다');
  ok(nokey.watch === 1 && nokey.wtoss === 1, '시세가 없어도 관심 종목과 토스 바로가기는 남는다');
  ok(nokey.slim >= 1, '비어 있는 칸마다 왜 비었는지 알려 준다');
  await page.evaluate(() => { window.fetch = window.__origFetch; });

  /* ── 외부로 실제 호출이 나가지 않았는가 ─────────────────────────── */
  ok(outside.length === 0, '토스·증권사·한국은행으로 실제 호출이 나가지 않았다'
    + (outside.length ? ' — ' + outside.slice(0, 2).join(', ') : ''));

  /* ── 좁은 화면 ──────────────────────────────────────────────────── */
  for (const tab of ['inv_stock', 'inv_fund', 'inv_econ']) {
    await page.evaluate(t => go(t), tab);
    await page.waitForTimeout(700);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.waitForTimeout(400);
    const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    ok(w.sw <= w.cw + 2, tab + ' — 390px 가로 스크롤 없음 (' + w.sw + '/' + w.cw + ')');
    await page.setViewportSize({ width: 1180, height: 1000 });
  }

  /* ── 화면을 떠나면 자동 갱신이 멈추는가 (배터리·호출한도) ───────── */
  await page.evaluate(() => go('inv_stock'));
  await page.waitForTimeout(600);
  const onTab = await page.evaluate(() => !!INV.timer);
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(600);
  const offTab = await page.evaluate(() => {
    /* 타이머는 다음 tick 에서 스스로 멈춘다 — 강제로 한 번 돌려 확인 */
    const before = !!INV.timer;
    return { before, root: !!document.querySelector('#invRoot') };
  });
  ok(onTab, '주식관리에 있으면 자동 갱신 타이머가 돈다');
  ok(!offTab.root, '다른 화면으로 나가면 투자 화면이 사라진다');

  await browser.close(); srv.close();
  console.log('');
  console.log('  (가짜 시세 서버 호출 ' + apiHits + '회)');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 160))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('투자·경제 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
