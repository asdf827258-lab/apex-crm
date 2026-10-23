/* ══════════════════════════════════════════════════════════════════
   check-cuswin.js — 🪪 <b>고객 창 하나</b> · 다리 하나 (판 X161)

   사장님 말씀 (2026-10-22) — 「내 메인세션에서 고객 365와 DB통합CRM 고객
   등록을 하나로 합칠 수 있는 방법을 연구해 봐 · 그 고객 창 하나로 모든
   것들을 연계하고 싶어」 → 설계(docs/고객한장_설계.md) → 「1판부터 만들어」.

   ── 재어 본 사실 (살아 있는 서버 · 2026-10-22) ────────────────────
   · 「같은 사람인가」 를 <b>네 곳</b>이 저마다 답했습니다 —
       client_meta.db(값 있는 줄 <b>0</b>) · dbs.client_id(<b>39줄</b>) ·
       번호·이름 대조(cusCrmLoad · ccLoadCalls · 마지막 연락) · 가린 이름(db-crm.html).
   · 그래서 이어 둔 39줄이 고객 365일 명단에 <b>두 번</b> 섰고, 빠른 창에서
     단계를 못 바꿨고, 한 분을 보려고 배정 DB 를 <b>통째로</b> 받았습니다(7번).
   · 한 분을 여는 창도 <b>셋</b>이었습니다 — 상세(15칸 긴 스크롤) · 빠른 창 · CRM 카드.

   ── 이 자가 보는 것 ────────────────────────────────────────────────
   [1] 다리는 <b>dbs.client_id 하나</b>다 — olDbOf · olByDb · olRows 가 그것만 보고,
       ★ 옛 다리(client_meta.db)만 있으면 <b>이어진 것이 아니다</b>
   [2] 마지막 연락이 <b>가린 이름</b>이 아니라 client_id 로 붙는다 (arCliRows)
   [3] 상세 카드가 배정 DB 를 <b>그 분 줄만</b> 받는다 (eq client_id · 통째 X)
   [4] 「내 고객으로」 · CRM 「365 로 넘기기」 가 <b>잇는 칸</b>에 적는다
   [5] 어디서 누르든 <b>cusGo 하나</b> — 홈에서 열면 홈으로 돌아간다
   [6] 탭 여섯 — 고른 탭의 칸만 서고, <b>칸은 하나도 안 사라졌다</b>(id 그대로)
   [7] 배정 줄로 부르면 <b>잇는 칸</b>으로 사람을 찾는다 · 안 이어졌으면 빠른 창
   [8] 빠른 창 · CRM 카드에서 <b>같은 창</b>으로 가는 길이 있다
   [9] 인쇄에는 다 나온다 · 조용히 터진 곳이 없다

   ★ 견본 이름은 홍길동 식구만 씁니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const CRM = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');
const body = (src, head) => {
  const i = src.indexOf(head); if (i < 0) return '';
  const j = src.indexOf('\nfunction ', i + head.length), k = src.indexOf('\nasync function ', i + head.length);
  const e = [j, k].filter(x => x > 0).sort((a, b) => a - b)[0] || src.length;
  return src.slice(i, e);
};

const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  ['osLoadProfile', 'osProfileApply', 'osShowLoginGate', 'arLoad', 'osLoadClients', 'chkLoad']
    .forEach(k => { window[k] = function () {}; });
  window.setupDone = () => true; window.setupCanRun = () => true; window.setupShow = () => false;
  window.osTabAllowed = () => true; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.__T = ''; window.toast = function (m) { window.__T = m; };
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', user_id: 'me', name: '홍판서', role: 'owner', user_role: 'owner', team: 'A', active: true };
  /* 서버 흉내 — <b>무엇을 물었는지</b> 적어 둡니다 (eq 로 무엇을 걸었나) */
  window.__Q = [];
  window.osClient = function () {
    const mk = function (t) {
      const q = { t: t, eq: [], sel: '' }, a = {};
      ['order', 'limit', 'in', 'is', 'neq', 'not', 'gte', 'lte', 'insert', 'upsert', 'delete', 'single', 'range', 'or', 'filter']
        .forEach(k => { a[k] = function () { return a; }; });
      a.select = function (c) { q.sel = c || ''; return a; };
      a.update = function (v) { q.up = v; return a; };
      a.eq = function (k, v) { q.eq.push(k + '=' + v); return a; };
      a.then = function (f, g) {
        window.__Q.push(q);
        let d = [];
        if (t === 'dbs' && q.eq.indexOf('client_id=c1') >= 0)
          d = [{ id: 'd1', customer_name: '홍길동', region: '강남구', stage: 'AP', source: '소개',
                 assigned_date: '2026-09-03', assigned_to: 'me', client_id: 'c1', phone: '010-1111-2222' }];
        if (t === 'clients' && q.eq.indexOf('id=c7') >= 0)
          d = [{ id: 'c7', advisor_id: 'me', name_masked: '홍*순', consent_status: 'none', created_at: '2026-09-03' }];
        return Promise.resolve({ data: d, error: null }).then(f, g);
      };
      return a;
    };
    return { from: t => mk(t), rpc: () => Promise.resolve({ data: null, error: null }),
             storage: { from: () => ({ upload: () => Promise.resolve({}), remove: () => Promise.resolve({}) }) } };
  };
  CM.loaded = true; CM.meta = { c1: { touch: [{ at: '2026-10-16', how: '문자', note: '생일 축하' }] },
                                c2: { db: 'd2' } };          /* ★ 옛 다리만 있는 분 */
  OSC.loaded = true;
  OSC.list = [{ id: 'c1', advisor_id: 'me', name_masked: '홍*동', consent_status: 'none', created_at: '2026-09-03' },
              { id: 'c2', advisor_id: 'me', name_masked: '홍*동', consent_status: 'none', created_at: '2026-09-04' }];
  AR.loaded = true; AR.calls = []; AR.noLink = false;
  AR.cliRows = [{ id: 'c1', who: 'me', nm: '홍*동' }, { id: 'c2', who: 'me', nm: '홍*동' }];
  AR.db = [{ id: 'd1', who: 'me', name: '홍길동', stage: 'AP', days: 5, region: '강남구', src: '소개', client_id: 'c1', got: '2026-09-03' },
           { id: 'd2', who: 'me', name: '홍길동', stage: 'TA', days: 9, region: '서초구', src: '배정', got: '2026-09-10' },
           { id: 'd3', who: 'me', name: '홍갑돌', stage: 'TA', days: 2, region: '마포구', src: '배정', got: '2026-09-12' }];
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + port) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  await p.evaluate(SEED);
  await p.waitForTimeout(500);

  console.log('\n🪪 고객 창 하나 · 다리 하나 (판 X161)');

  console.log('\n[1] 다리는 <b>dbs.client_id 하나</b>다');
  const R1 = await p.evaluate(() => ({
    c1: olDbOf('c1'), c2: olDbOf('c2'),
    bd: (function () { const o = olByDb() || {}; return Object.keys(o).map(k => k + '→' + o[k].id); })(),
    rows: olRows(OSC.list).map(x => x.id),
    dbs: (crmDbsOf('c1') || []).map(x => x.id)
  }));
  is(R1.c1 === 'd1', '  이어진 c1 → 배정 줄 d1 — ' + (R1.c1 || '없음'));
  is(R1.c2 === '', '  ★ <b>옛 다리(client_meta.db)만</b> 있는 c2 는 이어진 것이 아니다 — ' + (R1.c2 || '안 이어짐') +
     (R1.c2 ? '\n      ✗ 다리가 둘이 됐습니다 — 한쪽만 고치면 다른 쪽이 답합니다 (5번)' : ''));
  is(R1.bd.join(',') === 'd1→c1', '  olByDb 가 잇는 칸에서 읽는다 — ' + R1.bd.join(' · '));
  is(R1.rows.indexOf('db:d1') < 0 && R1.rows.indexOf('c1') >= 0,
     '  이어진 분은 명단에 <b>한 번만</b> 선다 — ' + R1.rows.join(' · '));
  is(R1.rows.indexOf('db:d2') >= 0, '  안 이어진 d2 는 배정 줄로 그대로 선다');
  is(R1.dbs.join(',') === 'd1', '  거꾸로 묻기(crmDbsOf) — c1 의 배정 줄 ' + R1.dbs.join(','));

  console.log('\n[2] 마지막 연락이 <b>client_id</b> 로 붙는다 — 가린 이름은 겹칩니다');
  const R2 = await p.evaluate(() => {
    const rows = arCliRows([{ id: 'c1', advisor_id: 'me', name_masked: '홍*동' }, { id: 'c2', advisor_id: 'me', name_masked: '홍*동' }],
                           [], { 'id:c1': '2026-10-01', '홍*동': '2026-10-20' });
    const o = {}; rows.forEach(r => { o[r.id] = r.last || r.lt || r.at || ''; });
    return { o: o, raw: JSON.stringify(rows.map(r => [r.id, r.last, r.at, r.days])) };
  });
  is(JSON.stringify(R2.raw).indexOf('2026-10-20') < 0,
     '  가린 이름이 같은 남의 통화(10/20)가 <b>안 붙었다</b> — ' + R2.raw);
  is(JSON.stringify(R2.raw).indexOf('2026-10-01') >= 0, '  c1 에는 <b>제 통화</b>(10/01)가 붙었다');
  const lcSrc = SRC.slice(SRC.indexOf('var lLink='), SRC.indexOf('AR.cliRows=arCliRows('));
  is(/lmk='id:'\+dbs\[lci\]\.client_id/.test(lcSrc), '  arLoad 가 마지막 통화를 <b>id:고객번호</b>로 모은다');
  const cc = body(SRC, 'function ccLoadCalls(');
  is(/byCli/.test(cc) && /crmLinkOf\(dbs\[i\]\)/.test(cc), '  30일 관리(ccLoadCalls)도 잇는 칸으로 붙인다');

  console.log('\n[3] 상세 카드가 배정 DB 를 <b>그 분 줄만</b> 받는다 (7번)');
  await p.evaluate(() => { window.__Q = []; cusGo({ cli: 'c1' }); });
  await p.waitForTimeout(1500);
  const R3 = await p.evaluate(() => ({
    q: window.__Q.filter(q => q.t === 'dbs').map(q => q.eq.join('&')),
    db: CUS.db ? CUS.db.id : null
  }));
  is(R3.q.some(x => x === 'client_id=c1'), '  dbs 를 <b>client_id=c1</b> 로 물었다 — ' + R3.q.join(' | '));
  is(!R3.q.some(x => /assigned_to=/.test(x)), '  담당자 배정 DB 를 <b>통째로</b> 안 받았다');
  is(R3.db === 'd1', '  카드에 선 배정 줄 — ' + R3.db);

  console.log('\n[4] 「내 고객으로」 · 「365 로 넘기기」 가 <b>잇는 칸</b>에 적는다');
  const om = body(SRC, 'function olToMine(');
  is(/crmLinkSet\(dbId,id,/.test(om) && !/cmSave\(id,\{db:/.test(om), '  olToMine — crmLinkSet 하나로 적는다 (client_meta.db 에 안 적는다)');
  const tc = body(CRM, 'async function toClient(');
  is(/update\(\{client_id:cid\}\)/.test(tc), '  CRM toClient — 넘기면서 dbs.client_id 를 적는다');
  is(/if\(d\.client_id\)/.test(tc) && /toClientByName/.test(tc), '  이미 이어진 분은 멈추고 · 칸 없는 옛 서버만 예전 길');
  is(/byP\.length===1/.test(tc) && /가린 이름만 같습니다/.test(tc), '  짝은 <b>하나일 때만</b> 묻고 까닭을 말한다 (번호 · 약한 짝)');
  is(/crmHasLink\(\)\)return !!\(d&&d\.client_id\)/.test(body(CRM, 'function inClients(')),
     '  CRM inClients — 잇는 칸으로 답한다');
  is(/crmHasLink\(\)/.test(body(CRM, 'function cusAppMeta(')) && /crmHasLink\(\)/.test(body(CRM, 'function crm365띠(')),
     '  CRM 카드 · 🗂️ 띠도 잇는 칸으로 본다');

  console.log('\n[5] 어디서 누르든 <b>cusGo 하나</b> — 누르던 자리로 돌아간다');
  const R5 = await p.evaluate(() => ({
    tab: currentTab(), from: CUS_WIN.from, win: !!document.getElementById('cusWin'),
    back: (document.querySelector('.osc-detail-back') || {}).innerText || ''
  }));
  is(R5.tab === 'clients' && R5.win, '  홈에서 열면 고객 창이 선다');
  is(R5.from === 'home' && /돌아가기/.test(R5.back), '  「← 돌아가기」 — 누르던 자리(home)를 안다');
  is(/cusGo\(\{cli:id\}\)/.test(body(SRC, 'function osOpenClient(')), '  명단의 osOpenClient 도 cusGo 를 부른다');
  const R5b = await p.evaluate(() => { osBackToList(); return currentTab(); });
  is(R5b === 'home', '  닫으면 <b>홈으로</b> 돌아갔다 — ' + R5b);
  const R5c = await p.evaluate(() => { go('clients'); OSC.view = 'list'; cusGo({ cli: 'c2' }); const f = CUS_WIN.from; osBackToList(); return { f: f, v: OSC.view, t: currentTab() }; });
  is(R5c.f === '' && R5c.v === 'list' && R5c.t === 'clients', '  명단에서 열면 명단으로 — ' + JSON.stringify(R5c));

  /* ★ 새 판 (2026-10-23 「탭 다섯으로」) — 계약·청구가 <b>보장</b> 한 탭이 됐습니다. 고치는 칸은
     탭이 아니라 <b>시트</b>(data-cus-tab="sh-…")에 섭니다 — 탭 어디에도 안 섭니다. */
  console.log('\n[6] 탭 다섯 — 고른 탭의 칸만 · <b>칸은 하나도 안 사라졌다</b>');
  await p.evaluate(() => cusGo({ cli: 'c1' }));
  await p.waitForTimeout(1200);
  const R6 = await p.evaluate(() => {
    const o = { tabs: [].slice.call(document.querySelectorAll('#cusTabs [data-k]')).map(x => x.getAttribute('data-k')), per: {}, wrong: {} };
    CUS_TABS.forEach(t => {
      cusTab(t[0]);
      const vis = [].slice.call(document.querySelectorAll('#cusWin [data-cus-tab]')).filter(e => e.offsetParent !== null);
      o.per[t[0]] = vis.length;
      o.wrong[t[0]] = vis.filter(e => (' ' + e.getAttribute('data-cus-tab') + ' ').indexOf(' ' + t[0] + ' ') < 0 &&
                                     (' ' + e.getAttribute('data-cus-tab') + ' ').indexOf(' all ') < 0).length;
    });
    o.ids = ['oscTopBar', 'cusCard', 'cmPanels', 'cliPhone', 'cliIncome', 'oscBaHost', 'oscPolHost', 'oscOld', 'oscReps', 'oscDocs', 'cmRrnIn']
      .filter(k => !document.getElementById(k));
    o.loose = [].slice.call(document.querySelectorAll('#cusWin > *')).filter(e =>
      !e.hasAttribute('data-cus-tab') && !e.classList.contains('osc-detail-back') && !e.classList.contains('cus-head') && !e.classList.contains('cuw-shd') && e.id !== 'cmPanels')
      .map(e => e.className || e.tagName);
    /* #cmPanels 안의 칸들도 하나하나 탭에 담겼나 — 안 담긴 칸은 <b>모든 탭</b>에 떠 있습니다 */
    const cp = document.getElementById('cmPanels');
    [].slice.call(cp ? cp.children : []).forEach(e => { if (!e.hasAttribute('data-cus-tab')) o.loose.push('cmPanels>' + (((e.querySelector('.t-lab') || e).textContent || '').trim().slice(0, 12))); });
    cusTab('sum');
    /* 옛 이름으로 불러도 새 탭으로 받는다 — 부르는 쪽을 다 안 고쳐도 됩니다 */
    o.old = ['glance', 'pol', 'clm'].map(k => { cusTab(k); return CUS_WIN.tab; }).join(',');
    /* 시트 칸은 탭 어디에서도 안 보인다 */
    o.shVis = 0;
    CUS_TABS.forEach(t => { cusTab(t[0]); o.shVis += [].slice.call(document.querySelectorAll('#cusWin [data-cus-tab^="sh-"]')).filter(e => e.offsetParent !== null).length; });
    cusTab('sum');
    return o;
  });
  is(R6.tabs.join(',') === 'sum,talk,cov,doc,info', '  탭 다섯 — ' + R6.tabs.join(' · '));
  is(R6.old === 'sum,cov,cov', '  옛 이름(glance · pol · clm)으로 불러도 새 탭이 열린다 — ' + R6.old);
  is(R6.shVis === 0, '  고치는 칸(시트)은 탭 어디에도 안 선다 — 보인 것 ' + R6.shVis);
  Object.keys(R6.per).forEach(k => is(R6.per[k] > 0 && R6.wrong[k] === 0,
     '  ' + k + ' — 칸 ' + R6.per[k] + '개 · 다른 탭 칸 ' + R6.wrong[k]));
  is(!R6.ids.length, '  예전 칸이 <b>다 있다</b>(감췄을 뿐) — 빠진 것 ' + (R6.ids.join(', ') || '없음'));
  is(!R6.loose.length, '  탭 없이 떠도는 칸이 없다 — ' + (R6.loose.join(', ') || '없음'));

  console.log('\n[7] 배정 줄로 부르면 <b>잇는 칸</b>으로 사람을 찾는다');
  const R7 = await p.evaluate(() => {
    let csh = '';
    const real = window.cshOpen; window.cshOpen = function (a, b) { csh = (a || '') + '|' + (b || ''); };
    go('home'); cusGo({ db: 'd1' }); const a = OSC.current ? OSC.current.id : null;
    go('home'); OSC.current = null; cusGo({ db: 'd2' }); const b2 = OSC.current ? OSC.current.id : null;
    window.cshOpen = real;
    return { a: a, b: b2, csh: csh };
  });
  is(R7.a === 'c1', '  d1 → c1 (잇는 칸) — ' + R7.a);
  is(R7.b === null && R7.csh === '|d2', '  안 이어진 d2 는 이름 같은 c2 를 <b>안 열고</b> 빠른 창 — ' + R7.csh);
  const R7b = await p.evaluate(() => new Promise(res => { go('home'); cusGo({ cli: 'c7' });
    setTimeout(() => res(OSC.current ? OSC.current.id : null), 600); }));
  is(R7b === 'c7', '  명단에 아직 없는 분은 <b>그 한 줄만</b> 받아 연다 — ' + R7b);

  console.log('\n[8] 빠른 창 · CRM 카드에서 <b>같은 창</b>으로');
  const R8 = await p.evaluate(() => { CSH.dbid = ''; const a = cshHtml('c1'); CSH.dbid = 'd3'; const b2 = cshHtml(''); return { a: a, b: b2 }; });
  is(/cusGo\(\{cli:'c1',tab:'talk'\}\)/.test(R8.a), '  빠른 창에 「🪪 고객 창 전체 보기」 (연락 탭으로)');
  is(R8.b.indexOf('고객 창 전체 보기') < 0, '  배정 줄만 있는 분에게는 안 선다 — 열 고객 창이 없습니다');
  is(/P\.cusGo\(\{cli:d\.client_id/.test(body(CRM, 'function cusOpen(')), '  CRM 카드 — 이어진 분은 앱의 cusGo 로');

  console.log('\n[8-1] 내려가도 <b>이름 줄이 앱 머리띠 뒤로 안 숨는다</b>');
  /* 찍어 보고 알았습니다 — 머리를 top:0 에 붙였더니 내려갈 때 이름 줄이 topnav(폰 86px)
     뒤로 숨고 탭 띠만 보였습니다. 머리는 topnav 바로 밑에 붙어야 합니다 (cusHeadFit). */
  await p.evaluate(() => { go('home'); cusGo({ cli: 'c1' }); });
  await p.waitForTimeout(800);
  /* ★ <b>실제로 굴리는 칸</b>을 굴립니다 — 폰에서는 main 입니다. 처음에 창(window)을
     굴려 재다가 머리를 86px 더 내려 붙이는 잘못을 놓쳤습니다(맨 위에 빈 틈). */
  const R81 = await p.evaluate(async () => {
    cusTab('info');
    const h = document.querySelector('.cus-head'), n = document.getElementById('topnav'), b2 = document.getElementById('oscTopBar');
    let sc = null; for (let x = h.parentElement; x && x !== document.body; x = x.parentElement) if (/(auto|scroll)/.test(getComputedStyle(x).overflowY)) { sc = x; break; }
    const nb = () => Math.round(n.getBoundingClientRect().bottom), bt = () => Math.round(b2.getBoundingClientRect().top);
    const back = document.querySelector('.osc-detail-back');
    const o = { gap0: bt() - Math.round(back.getBoundingClientRect().bottom) };
    if (sc) sc.scrollTop = 900; else window.scrollTo(0, 900);
    await new Promise(r => setTimeout(r, 300));
    o.y = sc ? sc.scrollTop : window.scrollY; o.nb = nb(); o.bt = bt(); o.who = sc ? (sc.tagName + (sc.id ? '#' + sc.id : '')) : 'window';
    if (sc) sc.scrollTop = 0; else window.scrollTo(0, 0);
    return o;
  });
  is(R81.gap0 >= 0 && R81.gap0 <= 20, '  맨 위에서는 「← 돌아가기」 바로 밑이다 — 틈 ' + R81.gap0 + 'px');
  is(R81.y > 0 && Math.abs(R81.bt - R81.nb) <= 1,
     '  ' + R81.who + ' 를 ' + R81.y + 'px 내린 뒤 이름 줄 위 ' + R81.bt + 'px = 머리띠 아래 ' + R81.nb + 'px (숨지도 · 뜨지도 않음)');

  console.log('\n[10] ✂️ <b>겹친 칸을 걷었나</b> (사장님 말씀 2026-10-23 「고객창에서 중복된 부분 줄이고 자간·높낮이 최소화로」)');
  await p.evaluate(() => { go('home'); cusGo({ cli: 'c1' }); });
  await p.waitForTimeout(900);
  const R10 = await p.evaluate(() => {
    const o = {};
    const card = document.getElementById('cusCard');
    o.secs = card ? [].slice.call(card.querySelectorAll('.cus-st')).map(x => x.textContent.trim().split(' ')[0]) : ['(카드 없음)'];
    o.cqa = [].slice.call(document.querySelectorAll('#cusWin [data-cus-tab]')).filter(e => e.querySelector('#cqaCard')).map(e => e.getAttribute('data-cus-tab'));
    o.note = [].slice.call(document.querySelectorAll('#cusWin [data-cus-tab]')).filter(e => /적어 두기/.test((e.querySelector('.t-lab') || {}).textContent || '')).map(e => e.getAttribute('data-cus-tab'));
    /* 연락 기록은 <b>한 줄기</b>(cuwTl) 한 곳 — 접촉 「생일 축하」 가 창 전체에 한 번만 */
    const w = document.getElementById('cusWin');
    o.bday = ((w ? w.textContent : '').match(/생일 축하/g) || []).length;
    o.tl = !!document.getElementById('cuwTl') && !document.getElementById('cusLogCard');
    const first = k => { cusTab(k); const v = [].slice.call(document.querySelectorAll('#cusWin [data-cus-tab]')).filter(e => e.offsetParent !== null)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]; return v ? ((v.querySelector('.t-lab,.cus-nm') || v).textContent || '').trim().slice(0, 12) : ''; };
    o.f = { glance: first('sum'), info: first('info') };
    cusTab('sum');
    o.names = [].slice.call(document.querySelectorAll('#cusWin .t-h1')).length;
    /* CRM 은 이 한 장이 전부라 <b>그대로</b> 다 서야 합니다 */
    const full = document.createElement('div'); full.innerHTML = cusCardHtml(cusAppView(OSC.current));
    o.full = [].slice.call(full.querySelectorAll('.cus-st')).map(x => x.textContent.trim().split(' ')[0]);
    o.css = (document.getElementById('cusWinCss') || {}).textContent || '';
    return o;
  });
  is(R10.secs.length === 0, '  한눈에 카드에 사람·가족·돈·계약·문서가 <b>또 안 선다</b>(제 탭에 있습니다) — ' + (R10.secs.join(' · ') || '없음'));
  is(R10.cqa.join(',') === 'sum', '  「한 가지만 여쭙니다」 는 <b>요약에만</b> — ' + R10.cqa.join(','));
  is(R10.note.join(',') === 'sh-story', '  📝 이야기 고치는 칸은 <b>시트 한 곳</b>(보기는 요약·정보) — ' + R10.note.join(','));
  is(R10.tl && R10.bday === 1,
     '  연락 기록은 <b>한 줄기</b> 한 곳 — 접촉(생일 축하)이 창 전체에 ' + R10.bday + '번');
  is(/여쭙|한눈에|지금/.test(R10.f.glance) && /사람/.test(R10.f.info),
     '  탭 맨 위 — 요약: 「' + R10.f.glance + '」 · 정보: 「' + R10.f.info + '」');
  is(R10.names === 0, '  큰 이름(t-h1)을 또 안 세운다 — 머리 줄에 있습니다');
  is(R10.full.length >= 6, '  ★ CRM 카드(전부)는 그대로 — ' + R10.full.join(' · '));
  is(/#cusWin \.t-card\{padding:14px/.test(R10.css) && !/font-size:1[0-2](\.\d+)?px/.test(R10.css),
     '  촘촘한 옷은 #cusWin 안에서만 · 글자를 13px 아래로 안 내린다');

  console.log('\n[11] 🪪 새 판 머리 · 지금 할 일 · 고치는 시트 (2026-10-23 「탭 다섯으로 하고 추천대로 새 판 만들어」)');
  await p.evaluate(() => { go('home'); cusGo({ cli: 'c1' }); });
  await p.waitForTimeout(900);
  const R11 = await p.evaluate(() => {
    const o = {}, c = OSC.current;
    const top = document.getElementById('oscTopBar');
    o.stg = document.querySelectorAll('#cusWin .cuw-stg').length;
    o.meta = ((top && top.querySelector('.cuw-meta')) || {}).textContent || '';
    o.tel = !!(top && top.querySelector('a[href^="tel:"]'));
    o.acts = top ? top.textContent : '';
    /* 지금 할 일 — 차례는 오늘 약속 → 기한 지난 할 일 → 물음 하나 */
    const keep = { db: CUS.db, m: CM.meta.c1 };
    const t = cuwToday();
    CUS.db = Object.assign({}, CUS.db || {}, { next_appt: t + 'T14:00:00+09:00' });
    CM.meta.c1 = Object.assign({}, keep.m || {}, { next: { what: '만기 안내', due: '2000-01-01' } });
    o.n1 = cuwNowHtml(c);
    CUS.db = Object.assign({}, CUS.db, { next_appt: '' });
    o.n2 = cuwNowHtml(c);
    CM.meta.c1 = Object.assign({}, keep.m || {}, { next: null, nx: [] });
    o.n3 = cuwNowHtml(c);
    CUS.db = keep.db; CM.meta.c1 = keep.m;
    /* 시트 — 열면 탭 띠가 걷히고 그 칸만, 탭을 누르면 닫힌다 */
    cuwSheet('base');
    const tabs = document.getElementById('cusTabs');
    o.shTabs = tabs ? tabs.offsetParent !== null : null;
    o.shPhone = !!(document.getElementById('cliPhone') && document.getElementById('cliPhone').offsetParent !== null);
    o.shOther = [].slice.call(document.querySelectorAll('#cusWin [data-cus-tab]')).filter(e => e.offsetParent !== null && e.getAttribute('data-cus-tab') !== 'sh-base').length;
    cusTab('talk');
    o.closed = document.getElementById('cusWin').getAttribute('data-sheet') === '';
    cuwSheet('nope');
    o.bad = document.getElementById('cusWin').getAttribute('data-sheet');
    cusTab('sum');
    return o;
  });
  is(R11.stg === 1, '  단계는 머리의 <b>딱지 하나</b> — ' + R11.stg + '곳');
  is(/모름/.test(R11.meta), '  모르는 것은 「모름」 이라 적는다 (1번) — ' + R11.meta.replace(/\s+/g, ' ').slice(0, 60));
  is(!R11.tel && /번호 넣기/.test(R11.acts), '  번호가 없으면 전화 단추 대신 「📞 번호 넣기」 — 빈 tel: 을 안 건다');
  is(/오늘 약속/.test(R11.n1) && R11.n1.indexOf('기한 지남') < 0, '  ① 오늘 약속이 있으면 그것이 먼저');
  is(/기한 지남/.test(R11.n2) && /만기 안내/.test(R11.n2), '  ② 약속이 없으면 기한 지난 할 일');
  is(!/cuw-now/.test(R11.n3), '  ③ 둘 다 없으면 「지금 할 일」 칸을 안 세우고 물음 하나로');
  is(R11.shTabs === false && R11.shPhone && R11.shOther === 0, '  시트를 열면 탭 띠가 걷히고 <b>그 칸만</b> 선다 (번호 칸 보임 · 다른 칸 ' + R11.shOther + ')');
  is(R11.closed, '  탭을 누르면 시트가 닫힌다');
  is(R11.bad === '', '  없는 시트 이름은 안 연다 — 빈 화면이 안 선다');

  console.log('\n[9] 인쇄에는 다 나온다 · 조용히 터진 곳이 없다');
  const css = await p.evaluate(() => (document.getElementById('cusWinCss') || {}).textContent || '');
  is(/@media print\{#cusWin \[data-cus-tab\]\{display:block!important\}/.test(css), '  인쇄에는 탭과 상관없이 다 나온다');
  is(!errs.length, '  터진 곳 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 한 사람을 두 곳이 따로 답하면 고객 앞에서 다른 말을 합니다.'); process.exit(1); }
  console.log('✓ 다리는 하나, 창도 하나입니다.');
})().catch(e => { console.error(e); process.exit(1); });
