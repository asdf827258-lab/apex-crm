/* ☎️ 「오늘 터치할 사람」 — <b>눌러서 바로 기록</b> 되는가 (판 X123)

   사장님 말씀 (2026-10-18) — 「오늘 터치할 사람도 눌러서 바로 기록 되게 해줘」.

   여태 줄을 누르면 <b>딴 화면으로</b> 갔습니다. 전화를 끊고 적으려면 화면을
   옮겨 그 사람을 다시 찾아야 했습니다. 여기서 확인한다.

     1. 줄을 누르면 <b>그 자리에서</b> 기록 창이 뜨는가 (딴 화면으로 안 감)
     2. 배정 DB 줄은 <b>줄 번호</b>로, 고객 365일 줄은 <b>고객 번호</b>로 여는가
        — 가르는 자리는 TDO 표 하나인가 (5번)
     3. 기록 창을 <b>새로 안 만들었는가</b> — cshOpen 을 부르기만 하는가 (5번)
     4. <b>옛 길이 그대로 있는가</b> — 「→」 로 여태 가던 화면에 간다 (6번)
     5. ★★ 고객 번호가 없는 DB 줄에서 결과를 눌러도
        <b>빈 번호로 서버에 안 쓰는가</b> — client_id 가 빈 줄이 생기면
        안 됩니다. 무엇이 안 남았는지 <b>말하는가</b> (1번)
     6. 폰(390px)에서 「→」 가 <b>첫 줄</b>에 서는가 — 셋째 줄로 떨어지면
        줄이 쑥 길어집니다                                                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  /* 사장님 진짜 서버를 읽지 않는다 */
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

  /* 견본 — 홍길동·이몽룡·성춘향 (3번). db1·db2 는 배정 DB 줄, c1 은 고객 365일. */
  await page.evaluate(() => {
    window.toast = function (t) { (window.__T = window.__T || []).push(String(t)); };
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    const d = n => new Date(Date.now() + 9 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
    OSC.list = [{ id: 'c1', name_masked: '성○향', advisor_id: 'me', created_at: d(300) }];
    CM.meta = { c1: { fp: {}, touch: [{ at: d(80), how: '전화' }] } };
    CC.calls = {}; CC.loaded = true; CM.loaded = true; CM.pick = '';
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    go('airep');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
  });
  /* ★ 화면을 옮기면 <b>예약된 다시 그리기</b>가 1.8·2.4·4.2초에 돕니다.
     그 전에 세워 두면 제 것을 덮어씁니다 — 실제로 그랬습니다. 가라앉은
     뒤에 씨를 뿌리고 그립니다. 서버를 부르려다 막혀 AR.err 도 섭니다. */
  await page.waitForTimeout(5000);
  const 씨 = () => page.evaluate(() => {
    AR.loaded = true; AR.err = ''; AR.busy = ''; AR.cat = 'touch';
    AR.db = [{ id: 'db1', name: '홍○동', who: 'me', stage: '부재', days: 9, src: '네이버', region: '수원' },
             { id: 'db2', name: '이○룡', who: 'me', stage: 'AP', days: 1, src: '메타', region: '용인' }];
    AR.cliRows = arCliRows(OSC.list, CM.meta, {});
    let h = document.getElementById('arPane');
    if (!h) { h = document.createElement('div'); h.id = 'arPane';
              (document.querySelector('.app') || document.body).appendChild(h); }
    h.innerHTML = arTouchHtml();
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
  });
  await 씨();
  await page.waitForTimeout(800);

  console.log('\n[1] 줄을 누르면 그 자리에서 기록 창이 뜬다');
  const diag = await page.evaluate(() => ({
    hold: (typeof holdReadyOr === 'function') ? holdReadyOr(AR) : '?',
    err: AR.err || '', loaded: !!AR.loaded, db: (AR.db || []).length,
    cli: (AR.cliRows || []).length, 터치: (typeof arTouch === 'function') ? arTouch('me').length : -1,
    html: (typeof arTouchHtml === 'function') ? arTouchHtml().length : -1,
    pane: (document.getElementById('arPane') || {}).innerHTML ?
          document.getElementById('arPane').innerHTML.length : -1 }));
  if (!(await page.evaluate(() => document.querySelectorAll('.ar-tk').length)))
    console.log('    진단: ' + JSON.stringify(diag));
  const n = await page.evaluate(() => document.querySelectorAll('.ar-tk').length);
  is(n >= 3, '  터치 줄이 선다 — ' + n + '줄');
  const before = await page.evaluate(() => (typeof curTab === 'function') ? curTab() : (OS.tab || ''));
  await page.click('.ar-tk');
  await page.waitForTimeout(800);
  const sheet = await page.evaluate(() => {
    const sh = document.getElementById('cshSheet');
    return { 떴나: !!sh, 글: sh ? sh.innerText.replace(/\s+/g, ' ').slice(0, 60) : '',
             탭: (typeof curTab === 'function') ? curTab() : (OS.tab || '') };
  });
  is(sheet.떴나, '  기록 창이 <b>그 자리에서</b> 뜬다');
  is(/딴 화면으로 안 보냅니다/.test(sheet.글) || /여기서 바로/.test(sheet.글),
     '  그 창이 「여기서 바로 고칩니다」 창이다 — ' + sheet.글.slice(0, 34));
  is(sheet.탭 === before, '  화면이 <b>안 옮겨졌다</b> — ' + before + ' 그대로');

  console.log('\n[2] DB 줄은 줄 번호로 · 고객 줄은 고객 번호로 (5번)');
  const kind = await page.evaluate(() => {
    const got = [];
    [].slice.call(document.querySelectorAll('.ar-tk')).forEach(e => {
      const m = (e.getAttribute('onclick') || '').match(/arTkRec\('([^']*)',(\d)\)/);
      if (m) got.push({ id: m[1], db: m[2] === '1' });
    });
    return { 줄: got, 표: Object.keys(TDO).map(k => k + ':' + TDO[k].src).join(' ') };
  });
  const dbRows = kind.줄.filter(x => x.db), cliRows = kind.줄.filter(x => !x.db);
  is(dbRows.length >= 2 && dbRows.every(x => /^db/.test(x.id)),
     '  DB 줄은 <b>줄 번호</b>로 연다 — ' + dbRows.map(x => x.id).join(','));
  is(cliRows.length >= 1 && cliRows.every(x => /^c/.test(x.id)),
     '  고객 줄은 <b>고객 번호</b>로 연다 — ' + cliRows.map(x => x.id).join(','));
  const one = await page.evaluate(() =>
    ['AP', '부재', '기고객', '생일'].map(k => k + '=' + (arTkDb(k) ? 'db' : 'cli')).join(' '));
  is(one === 'AP=db 부재=db 기고객=cli 생일=cli',
     '  가르는 자리는 <b>TDO 표 하나</b>다 — ' + one);

  console.log('\n[3] 기록 창을 새로 안 만들었다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const i = SRC.indexOf('function arTkRec(');
  const blk = SRC.slice(i, SRC.indexOf('\nfunction ', i + 10));
  is(/cshOpen\(/.test(blk), '  arTkRec 은 cshOpen 을 부른다');
  is(!/t-sheet|innerHTML|cmSave\(|insert\(/.test(blk), '  제 손으로 창·저장을 안 만든다');

  console.log('\n[4] 옛 길이 그대로 있다 (6번)');
  const go2 = await page.evaluate(() => {
    const b = document.querySelector('.ar-tk .ar-tkgo');
    return { 있나: !!b, 누르면: b ? (b.getAttribute('onclick') || '') : '' };
  });
  is(go2.있나, '  「→」 단추가 줄마다 선다');
  is(/stopPropagation/.test(go2.누르면) && /go\('(crm|clients)'\)/.test(go2.누르면),
     '  누르면 여태 가던 화면으로 간다 — ' + go2.누르면.replace(/event\.stopPropagation\(\);/, ''));

  console.log('\n[5] ★★ 고객 번호 없는 DB 줄에서 빈 번호로 안 쓴다 (1번)');
  const empty = await page.evaluate(() => {
    window.__T = []; window.__W = [];
    const keep = window.cmSave;
    window.cmSave = function (id, patch, then) { window.__W.push({ id: id, k: Object.keys(patch).join() }); if (then) then(); };
    const kh = window.hdbCall; window.hdbCall = function (id, res) { window.__W.push({ hdb: id, res: res }); };
    CM.meta = {};
    CSH.id = ''; CSH.dbid = 'db1';
    cshMark('', 'call');
    window.cmSave = keep; window.hdbCall = kh;
    return { 쓴것: window.__W, 토스트: (window.__T || []).join(' | '),
             빈쪽지: Object.keys(CM.meta) };
  });
  is(!empty.쓴것.some(x => x.id === ''), '  <b>빈 번호로 서버에 안 쓴다</b> — ' +
     JSON.stringify(empty.쓴것));
  is(empty.쓴것.some(x => x.hdb === 'db1'), '  DB 줄 쪽 통화 기록은 그대로 남는다');
  is(empty.빈쪽지.length === 0, '  빈 쪽지(CM.meta[\'\'])도 안 생긴다');
  is(/내 고객이 아니라/.test(empty.토스트),
     '  무엇이 <b>안 남았는지</b> 말한다 (1번)');
  is(!/다음에 무엇을 할지 한 줄만/.test(empty.토스트),
     '  엉뚱한 말(「한 줄만 적어 주세요」)이 안 뜬다');

  console.log('\n[5-2] 창 머리에 <b>아는 이름</b>을 적는다 (1번)');
  /* ★ 고객 번호 없는 DB 줄을 열면 「(이름 없음)님, 어떻게 됐나요?」 라고
     물었습니다 — 그 줄에는 이름이 있습니다. ★★ 그렇다고 고객 줄에서
     못 찾았을 때 DB 줄 이름을 갖다 쓰면 <b>남의 이름</b>이 붙습니다.
     처음에 그렇게 짰다가 되돌렸습니다 — 이름을 틀리는 것은 모르는 것보다
     나쁩니다 (1번). 세 경우를 다 잽니다. */
  const nm = await page.evaluate(() => {
    const keep = { id: CSH.id, db: CSH.dbid };
    CSH.id = ''; CSH.dbid = 'db2'; const a = cshNm('');
    CSH.dbid = ''; const b = cshNm('');
    CSH.dbid = 'db2'; const c = cshNm('c1');
    CSH.id = keep.id; CSH.dbid = keep.db;
    return { DB줄: a, 둘다없음: b, 고객줄: c };
  });
  is(nm.DB줄 === '이○룡', '  DB 줄은 <b>그 줄의 이름</b>을 적는다 — ' + nm.DB줄);
  is(nm.고객줄 === '성○향', '  고객 줄은 <b>그 고객</b>의 이름을 적는다 (남의 이름이 안 붙는다) — ' + nm.고객줄);
  is(nm.둘다없음 === '고객', '  둘 다 모르면 <b>지어내지 않는다</b> — ' + nm.둘다없음);

  console.log('\n[6] 폰에서 「→」 가 첫 줄에 선다');
  await page.evaluate(() => { if (typeof cshClose === 'function') cshClose(); });
  await page.waitForTimeout(400);
  const fit = await page.evaluate(() => {
    const row = document.querySelector('.ar-tk');
    const g = row.querySelector('.ar-tkgo'), nm = row.querySelector('.nm');
    const r = row.getBoundingClientRect(), gr = g.getBoundingClientRect(), nr = nm.getBoundingClientRect();
    return { 같은줄: Math.abs(gr.top - nr.top) < 14, 줄높이: Math.round(r.height),
             오른끝: Math.round(gr.right), 창: innerWidth,
             넘침: [].slice.call(row.querySelectorAll('*')).filter(e => e.getBoundingClientRect().right > innerWidth + 1).length };
  });
  is(fit.같은줄, '  「→」 가 이름과 <b>같은 줄</b>에 있다 (셋째 줄로 안 떨어진다)');
  is(fit.넘침 === 0 && fit.오른끝 <= fit.창, '  폰에서 옆으로 안 샌다 — 오른끝 ' + fit.오른끝 + ' / ' + fit.창);

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? (' — ' + errs[0]) : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ 고칠 자리 ' + bad + '곳') : '✓ 오늘 터치할 사람 — 눌러서 바로 기록됩니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
