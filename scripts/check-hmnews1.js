/* 🖼 <b>오늘의 뉴스 한 장</b> (판 X464 · 2026-11-17)

   사장님 말씀 (2026-11-17) —
     「<b>오늘의 뉴스를 한장으로 매일 만들어줘 그리고 오늘에 띄워줘</b>
      오늘의 뉴스 해서 <b>이미지로 한장으로</b> 만들어서」

   ── 이 자가 보는 것 ────────────────────────────────────────────
     [1] 🖼 단추가 <b>오늘 화면에 눈에 보이게</b> 선다 — 접힌 칸 안이 아니다
     [2] 홈을 <b>한 톨도 안 늘린다</b> — 띠는 가로로 미는 자리다
     [3] 누르면 <b>한 장이 뜬다</b> · 날짜가 찍힌다
     [4] ★★ 기사가 <b>홈의 소식 줄과 같은 것</b>이다 (hmIgPool 하나 · 5번)
     [5] ★★ 제목·언론사·날짜가 <b>받아 온 그대로</b>다 — 지어내지 않는다 (1번·9번)
     [6] ★★ 받아 둔 소식이 없으면 <b>없다고 적는다</b> — 빈 장을 채우지 않는다
     [7] ★ <b>고객 실명이 한 자도 안 들어간다</b> (3번)
     [8] ★ 굽는 자가 <b>ensureHtml2Canvas 하나</b>다 (5번) · <b>tnum 을 안 켠다</b> (4-1번)

   ★ 사장님 진짜 서버도, 바깥도 한 번도 안 부릅니다 (7번·8번).            */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

/* 견본 기사 — 제목·언론사·날짜가 <b>그대로 나오는지</b> 견주려고 또렷한 글을 씁니다.
   ⚠ 사람 이름은 <b>홍길동</b>만 씁니다 (3번). */
const 뉴스 = [
  { t: '금감원, 보험 비교·추천 서비스 2단계 확대 추진', u: 'https://example.com/1', s: '연합뉴스', d: '2026-11-17 08:10', cats: ['ins'] },
  { t: '청년도약계좌 가입 요건 완화…내년 1월 시행',       u: 'https://example.com/2', s: '한국경제', d: '2026-11-17 07:40', cats: ['sav'] },
  { t: '기준금리 동결…예·적금 금리 당분간 유지 전망',     u: 'https://example.com/3', s: '매일경제', d: '2026-11-17 06:55', cats: ['eco'] },
  { t: '정부, 출산가구 주택 특별공급 물량 확대',          u: 'https://example.com/4', s: '서울경제', d: '2026-11-16 18:20', cats: ['pol'] },
  /* 언론사·날짜가 <b>없는</b> 줄 — 없는 것을 지어내는지 봅니다 (1번) */
  { t: '언론사도 날짜도 없는 기사 한 줄',                 u: '',                      s: '',       d: '',                  cats: ['eco'] },
  /* ⚠ <b>한 장에 담는 수(6)보다 많아야 합니다.</b> 처음에 다섯만 두었더니,
     「여기서 또 고르면 운다」 를 되돌려 볼 때 차례만 뒤집혀도 <b>묶음이 같아</b>
     그 줄이 안 울었습니다 — 안 울리는 알람은 알람이 아닙니다 (8번).         */
  { t: '실손보험 청구 전산화 2차 의료기관까지 확대',      u: 'https://example.com/6', s: '뉴시스',   d: '2026-11-16 15:02', cats: ['ins'] },
  { t: '퇴직연금 실물이전 시행 한 달…이동 규모는',        u: 'https://example.com/7', s: '아시아경제', d: '2026-11-16 11:30', cats: ['sav'] },
  { t: '연말정산 간소화 서비스 내년 1월 개통',            u: 'https://example.com/8', s: '조선비즈', d: '2026-11-15 09:15', cats: ['pol'] }
];

const SEED = (뉴스) => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  OS.cfg = OS.cfg || {}; OS.cfg.schema_version = '47';
  ['osLoadProfile', 'osProfileApply', 'osShowLoginGate', 'arLoad', 'osLoadClients', 'nlAuto']
    .forEach(k => { window[k] = function () {}; });
  window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function (m) { window.__toast = String(m || ''); };
  window.setupDone = () => true;
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range']
      .forEach(k => { o[k] = function () { return o; }; });
    o.single = () => chain({ data: null }); o.maybeSingle = () => chain({ data: null }); return o; };
  window.osClient = function () { return { from: function () { return {
      select: () => chain({ data: [], count: 0 }), update: () => chain({}), insert: () => chain({}),
      upsert: () => chain({}), delete: () => chain({}) }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = [];
  CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id: 'd0', who: 'me', name: '홍길동', region: '순천', src: '일반', stage: 'TA', days: 3, n: 1, res: '' }];
  NLIVE.items = 뉴스; NLIVE.got = 뉴스.length; NLIVE.drop = 0;
  NLIVE.busy = false; NLIVE.err = ''; NLIVE.at = '2026-11-17 08:20';
  NLIVE.cat = 'all'; NLIVE.age = 'all';
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  /* 바깥은 한 자도 안 부릅니다 — html2canvas CDN 도 막습니다.
     그래서 <b>굽기 자체</b>는 안 재고, <b>굽는 길이 이어져 있나</b>만 묻습니다 (8번). */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
  await pg.evaluate(SEED, 뉴스);
  await pg.waitForTimeout(2600);

  const SRC = fs.readFileSync('app/index.html', 'utf8');

  sec('[1]·[2] 🖼 단추가 <b>오늘 화면에 눈에 보이게</b> 서고, 홈을 안 늘린다');
  const B = await pg.evaluate(() => {
    const b = document.getElementById('hmNw1Btn');
    if (!b) return { 없음: true };
    const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
    const pane = document.getElementById('dynPane');
    return { 키: Math.round(r.height), 윗변: Math.round(r.top),
             보임: cs.display !== 'none' && r.height > 0 && r.width > 0,
             홈안: !!(pane && pane.contains(b)),
             홈키: pane ? Math.round(pane.scrollHeight) : -1,
             글: (b.innerText || '').replace(/\s+/g, ' ').trim() };
  });
  is(!B.없음, '🖼 단추(#hmNw1Btn)가 선다');
  is(!B.없음 && B.보임, '  ★★ <b>눈에 보인다</b> — 키 ' + B.키 + 'px · y' + B.윗변 +
     ' (접힌 칸 안에 두면 키가 0 입니다 — 판 X462·X463 에서 두 번 데인 자리)');
  is(!B.없음 && B.키 >= 40, '  ★ 손가락이 닿는다 — ' + B.키 + 'px');
  is(!B.없음 && !B.홈안,
     '  ★★ 띠에 선다(홈 칸 <b>바깥</b>) — 홈이 한 톨도 안 길어집니다 · 홈 ' + B.홈키 + 'px');
  is(/오늘 뉴스/.test(B.글 || ''), '  단추가 <b>무엇인지 말한다</b> — 「' + (B.글 || '') + '」');

  /* 다른 화면에서는 안 섭니다 — 띠는 모든 화면에 떠 있습니다 (🙈·🗜 와 같은 규칙) */
  const 딴데 = await pg.evaluate(async () => {
    try { go('crm'); } catch (e) {}
    await new Promise(r => setTimeout(r, 900));
    const b = document.getElementById('hmNw1Btn');
    const v = b ? (getComputedStyle(b).display !== 'none') : false;
    try { go('home'); } catch (e) {}
    await new Promise(r => setTimeout(r, 1100));
    return v;
  });
  is(!딴데, '  ★ <b>오늘 화면에서만</b> 선다 — 다른 화면에서는 숨습니다');

  sec('[3]·[4] 누르면 <b>한 장이 뜨고</b>, 기사가 <b>홈과 같은 것</b>이다 (5번)');
  const C = await pg.evaluate(async () => {
    const b = document.getElementById('hmNw1Btn');
    if (!b) return { 없음: true };
    b.click();
    await new Promise(r => setTimeout(r, 700));
    const w = document.getElementById('hmNw1Wrap'), c = document.getElementById('hmNw1Card');
    if (!c) return { 안뜸: true };
    /* 홈이 고른 그 기사들 — <b>묻는 곳은 hmIgPool 하나</b>입니다 */
    let 풀 = []; try { 풀 = (hmIgPool() || []).slice(0, HMNW1_MAX); } catch (e) {}
    const 홈기사 = 풀.map(n => (NLIVE.items[n] || {}).t).filter(Boolean);
    const 장글 = (c.innerText || '');
    return { 뜸: !!(w && getComputedStyle(w).display !== 'none'),
             폭: Math.round(c.getBoundingClientRect().width),
             홈기사, 장글, 줄: 홈기사.filter(t => 장글.indexOf(t) >= 0).length };
  });
  is(!C.없음 && !C.안뜸 && C.뜸, '  ★★ 누르면 <b>한 장이 뜬다</b>');
  is(C.폭 >= 1000, '  한 장이 <b>1,080px 로 선다</b> — ' + C.폭 + 'px (작게 구우면 글씨가 뭉갭니다)');
  is(C.홈기사 && C.홈기사.length > 0 && C.줄 === C.홈기사.length,
     '  ★★ 기사가 <b>홈의 소식 줄과 같다</b> — ' + C.줄 + ' / ' + ((C.홈기사 || []).length) +
     '건 (두 곳이 다른 기사를 말하면 안 됩니다 · 5번)');
  is(/\d+월\s*\d+일/.test(C.장글 || ''), '  ★ <b>날짜가 찍힌다</b> — 어제 것을 오늘 것으로 보내지 않게 (1번)');

  sec('[5] 제목·언론사·날짜가 <b>받아 온 그대로</b>다 (1번·9번)');
  const G = C.장글 || '';
  is(G.indexOf('연합뉴스 · 2026-11-17 08:10') >= 0,
     '  ★★ 언론사·날짜를 <b>그대로</b> 옮긴다 — 「연합뉴스 · 2026-11-17 08:10」');
  is(G.indexOf('금감원, 보험 비교·추천 서비스 2단계 확대 추진') >= 0,
     '  ★ 제목을 <b>한 글자도 안 고친다</b>');
  /* 언론사·날짜가 없는 줄 — 그 자리를 <b>비우는지</b> 봅니다. 지어내면 빨간불입니다 */
  const 빈줄 = await pg.evaluate(() => {
    const c = document.getElementById('hmNw1Card'); if (!c) return null;
    const rows = [...c.querySelectorAll('div')].filter(e =>
      (e.innerText || '').indexOf('언론사도 날짜도 없는 기사 한 줄') === 0);
    if (!rows.length) return { 없음: true };
    return { 글: (rows[0].innerText || '').replace(/\s+/g, ' ').trim() };
  });
  is(빈줄 && !빈줄.없음, '  언론사·날짜가 없는 기사도 <b>제목은 선다</b>');
  is(!!(빈줄 && !빈줄.없음 && 빈줄.글 === '언론사도 날짜도 없는 기사 한 줄'),
     '  ★★ 없는 언론사·날짜를 <b>지어내지 않는다</b> — 「' + ((빈줄 && 빈줄.글) || '') + '」');

  sec('[6] 받아 둔 소식이 없으면 <b>없다고 적는다</b> (1번)');
  const E = await pg.evaluate(async () => {
    hmNw1Close();
    NLIVE.items = [];
    hmNw1Open();
    await new Promise(r => setTimeout(r, 400));
    const c = document.getElementById('hmNw1Card');
    return c ? (c.innerText || '').replace(/\s+/g, ' ').trim() : '';
  });
  is(/소식이 없습니다/.test(E), '  ★★ <b>「오늘 받아 둔 소식이 없습니다」</b> 라고 적는다');
  is(!/^\s*$/.test(E) && !/[1-9]\s*건/.test(E.replace(/\d+월 \d+일/g, '')),
     '  ★ 없는 날에 <b>수를 만들지 않는다</b>');

  sec('[7] 🔒 <b>고객 실명이 한 자도 안 들어간다</b> (3번)');
  const N = await pg.evaluate(async () => {
    hmNw1Close();
    NLIVE.items = [{ t: '보험 비교 서비스 확대', u: '', s: '연합뉴스', d: '2026-11-17 08:10', cats: ['ins'] }];
    hmNw1Open();
    await new Promise(r => setTimeout(r, 400));
    const c = document.getElementById('hmNw1Card');
    const g = c ? (c.innerText || '') : '';
    const 이름 = (typeof AR !== 'undefined' && AR.db) ? AR.db.map(x => x.name) : [];
    return { 샘: 이름.filter(n => n && g.indexOf(n) >= 0), 글: g.slice(0, 60) };
  });
  is(N.샘.length === 0, '  고객 이름이 <b>0곳</b>' + (N.샘.length ? (' ← ' + N.샘.join(',')) : ''));

  sec('[8] 🔧 짓는 법 — 굽는 자 하나 · tnum 안 켬');
  const 토막 = SRC.slice(SRC.indexOf('function hmNw1Rows()'), SRC.indexOf('function hmNwPickHtml()'));
  is(토막.length > 500, '  한 장을 짓는 토막을 찾았다 — ' + 토막.length + '자');
  is(/ensureHtml2Canvas\(\)/.test(토막),
     '  ★★ 굽는 자가 <b>ensureHtml2Canvas 하나</b>다 (5번 — 라이브러리를 또 안 불러옵니다)');
  is(!/cdnjs|html2canvas\.min\.js/.test(토막),
     '  ★ 여기서 <b>라이브러리를 직접 안 부른다</b>');
  is(!/font-feature-settings/.test(토막),
     '  ★ <b>tnum 을 안 켠다</b> (4-1번 — 같은 꼴을 인쇄로 돌리는 날 숫자가 유니코드를 잃습니다)');
  is(/hmIgPool/.test(토막),
     '  ★★ 기사를 고르는 곳이 <b>hmIgPool 하나</b>다 — 여기서 또 안 고릅니다 (5번)');
  is(/osEsc/.test(토막), '  ★ 받아 온 글을 <b>osEsc 로 씌운다</b> — 날글을 그대로 안 찍습니다');

  is(errs.length === 0, '  오류 없이 돈다' + (errs.length ? (' ← ' + errs[0]) : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불')
                          : '✓ 🖼 오늘의 뉴스 한 장 — 오늘에 떠 있고, 지어내지 않습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
