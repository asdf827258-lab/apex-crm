/* 📄 <b>읽어 둔 보장분석을 오늘로</b> — 판 X131

   사장님 말씀 (2026-10-19) — 「보장분석PDF넣기 누르면 AI보장분석 뜨는데,
   이게 어떻게 적용되서 고객의 보험내용을 저장하고 <b>알람 뜰것들</b>을
   만들건지」 → 고르신 것: 「새로운 담보 점검 / 보험금찾기 /
   전-후에 입력되신 분, 만들어두고 안 보여드린분」.

   ── 재어 보니 ───────────────────────────────────────────────────
   증권을 읽어 그 분께 붙이는 것까지는 <b>이미 됐습니다</b>(ba_state).
   거기에 납입 만기(sum.end.pay.ym)·보장 만기(sum.end.cov.y)·담보 이름이
   담겨 있는데 <b>날짜로 챙기는 자리가 한 곳도</b> 없었습니다.
   「🩺 고객 체크」 는 배정 DB 의 <b>AP·PC·CS 인 분만</b> 봅니다 —
   계약을 끝내신 분도, 고객 365일에만 있는 분도 안 섰습니다.

   여기서 확인합니다.

     1. 네 갈래가 저마다 서는가 — 안 보여드림 · 납입 만기 · 보장 만기 · 청구 0건
     2. ★ <b>기한이 먼 것은 안 세우는가</b> — 10년 뒤 만기로 오늘 전화하지 않는다
     3. ★ <b>지난 것도 안 세우는가</b> — 이미 끝난 만기로 울리지 않는다
     4. ★ 보여 드린 뒤에는 <b>빠지는가</b> — 접촉을 남기면 그 줄이 사라진다
     5. ★ 못 읽었으면 <b>null</b> 인가 — 0 으로 적지 않는다 (1번)
     6. ★ 적힌 수가 <b>줄 수와 같은가</b> — 두 곳에서 각자 세지 않는다 (5번)
     7. ★ <b>빈 쪽지를 안 만드는가</b> (판 X126·X130 에서 데인 자리)
     8. ★★ <b>「보험금 받으실 수 있습니다」 라고 안 적는가</b> (1번) —
        청구가 되는지는 병원 기록이 있어야 아는 일이고 앱에 없습니다
     9. ★★ <b>갱신일을 지어내지 않는가</b> (1번) — 보장분석이 그 칸을 안
        들고 있습니다. 못 한다고 <b>화면에 적는가</b>
    10. ★★ 알람 글에 <b>이름도 금액도 한 자도</b> 안 들어가는가 (3번)
    11. ★ 알람 칸이 <b>기본으로 꺼져 있는가</b> — 사장님 말씀은 「하루 네 번」
        이었습니다. 켜져 있는 넷을 다섯으로 늘리지 않습니다 (6번)
    12. 그려진 화면에 실제로 서는가

   ★ 사장님 진짜 서버는 읽지 않습니다. 견본 이름은 홍길동 집안입니다 (3번). */
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  await ctx.route('**://**', r =>
    r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html',
                  { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2700);

  /* 오늘을 못 박습니다 — 「몇 달 남았나」 가 도는 날에 따라 갈리면 안 됩니다 */
  const T = '2026-10-19';
  const F = await page.evaluate((t) => {
    window.toast = function () {};
    window.ccToday = function () { return t; };
    OS.profile = { id: 'me', name: '윤시현', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    OSC.list = [
      { id: 'c1', name_masked: '홍○동', advisor_id: 'me', created_at: '2026-01-01' },
      { id: 'c2', name_masked: '홍○순', advisor_id: 'me', created_at: '2026-01-01' },
      { id: 'c3', name_masked: '홍○돌', advisor_id: 'me', created_at: '2026-01-01' },
      { id: 'c4', name_masked: '홍○복', advisor_id: 'me', created_at: '2026-01-01' },
      { id: 'c5', name_masked: '홍○순2', advisor_id: 'me', created_at: '2026-01-01' }
    ];
    OSC.loaded = true; CC.calls = {}; CC.loaded = true; CM.loaded = true;
    /* 청구 기록 — c2 만 있습니다 */
    try { localStorage.setItem('apex_cli_clm_' + (typeof cmWho === 'function' ? cmWho() : 'me'),
                               JSON.stringify({ c2: [{ at: '2026-09-01', what: '통원' }] })); } catch (e) {}
    /* 접촉 기록 — c2 는 만든 뒤에 보여 드렸습니다 */
    CM.meta = { c2: { touch: [{ at: '2026-10-15' }] } };
    CHKS.rows = []; CHKS.at = '방금';
    CHKS.by = {
      /* ① 만들어 두고 안 보여드림 */
      c1: { at: '2026-10-10', sum: { name: '홍○동', top: {}, end: null } },
      /* ② 보여 드렸음 + 청구 기록 있음 → 한 줄도 안 서야 합니다 */
      c2: { at: '2026-10-10', sum: { name: '홍○순', top: {}, end: null } },
      /* ③ 납입 만기 3달 뒤 */
      c3: { at: '2026-10-10', sum: { name: '홍○돌', top: {},
            end: { pay: { ym: '2027-01', nm: 'KB 종신' }, cov: null } } },
      /* ④ 보장 만기 1해 뒤 */
      c4: { at: '2026-10-10', sum: { name: '홍○복', top: {},
            end: { pay: null, cov: { y: 2027, age: 80, nm: '실손' } } } },
      /* ⑤ 먼 것·지난 것 — 한 줄도 안 서야 합니다 */
      c5: { at: '2026-10-10', sum: { name: '홍○순2', top: {},
            end: { pay: { ym: '2035-05', nm: '먼 것' }, cov: { y: 2019, age: 60, nm: '지난 것' } } } }
    };
    const before = Object.keys(CM.meta).sort().join(',');
    const rows = baxRows(), cnt = baxCount();
    return { rows: rows.map(x => ({ k: x.k, cid: x.cid, nm: x.nm, s: x.s })), cnt: cnt,
             before: before, after: Object.keys(CM.meta).sort().join(',') };
  }, T);
  const byK = {}; F.rows.forEach(r => (byK[r.k] = byK[r.k] || []).push(r.cid));

  console.log('\n[1] 네 갈래가 저마다 선다');
  is((byK.show || []).join(',') === 'c1,c3,c4,c5',
     '만들어 두고 안 보여드린 분 — c1·c3·c4·c5 (받음 ' + (byK.show || []).join(',') + ')');
  is((byK.pay || []).join(',') === 'c3', '납입 만기 — c3 만 (받음 ' + (byK.pay || []).join(',') + ')');
  is((byK.cov || []).join(',') === 'c4', '보장 만기 — c4 만 (받음 ' + (byK.cov || []).join(',') + ')');
  is((byK.clm || []).join(',') === 'c1,c3,c4,c5',
     '청구 기록 0건 — c2 만 빠진다 (받음 ' + (byK.clm || []).join(',') + ')');

  console.log('\n[2]·[3] 먼 것과 지난 것은 안 세운다');
  is(!(byK.pay || []).includes('c5'), '9년 뒤 납입 만기로는 오늘 안 울린다');
  is(!(byK.cov || []).includes('c5'), '이미 지난 보장 만기로는 안 울린다');

  console.log('\n[4] 보여 드린 뒤에는 빠진다');
  is(!(byK.show || []).includes('c2'), 'c2 는 만든 뒤 접촉을 남겨 「안 보여드림」 에서 빠진다');

  console.log('\n[6] 적힌 수가 줄 수와 같다');
  is(F.cnt && F.cnt.all === F.rows.length,
     '「N건」 이 줄 수와 같다 (' + (F.cnt && F.cnt.all) + ' vs ' + F.rows.length + ')');

  console.log('\n[7] 빈 쪽지를 안 만든다');
  is(F.after === F.before, '내 기기 쪽지가 안 늘어난다 (전 ' + F.before + ' → 후 ' + F.after + ')');

  console.log('\n[5] 못 읽었으면 null — 0 으로 적지 않는다');
  const unk = await page.evaluate(() => {
    const k = CHKS.rows; CHKS.rows = null;
    const o = { rows: baxRows(), cnt: baxCount(), html: baxHtml() };
    CHKS.rows = k; return o;
  });
  is(unk.rows === null && unk.cnt === null, '목록도 셈도 null 이다 — 빈 목록이 아니다');
  is(unk.html === '', '못 읽었으면 칸을 아예 안 세운다 — 「0건」 을 안 적는다');

  console.log('\n[8]·[9] 지어내지 않는다');
  const say = await page.evaluate(() => { BAX.open = true; return baxHtml(); });
  is(!/받으실 수 있습니다|받을 수 있습니다|청구 가능/.test(say),
     '「보험금 받으실 수 있습니다」 라고 안 적는다 (1번)');
  is(/한 번도 여쭤 본 적이 없다/.test(say), '적을 수 있는 데까지만 적는다 — 「여쭤 본 적이 없다」');
  is(/갱신일<\/b>은[\s\S]{0,40}못 셉니다/.test(say) || /갱신일[\s\S]{0,60}못 셉니다/.test(say),
     '갱신일은 <b>못 한다고 화면에 적는다</b> (1번)');
  is(!/보장이 모자|부족합니다/.test(say), '「보장이 모자랍니다」 같은 결론을 안 적는다 (2번)');

  console.log('\n[10]·[11] 알람');
  const alm = await page.evaluate(() => {
    const s = (typeof almSlotOf === 'function') ? almSlotOf('bax') : null;
    const L = (typeof almLineFor === 'function') ? almLineFor('bax') : null;
    return { slot: s ? { on: s.on, h: s.h, cnt: s.cnt, body: s.body } : null, line: L,
             onN: (typeof ALM_SLOTS !== 'undefined')
                  ? ALM_SLOTS.filter(x => x.on).length : -1 };
  });
  is(!!alm.slot, '알람 칸이 표에 있다');
  is(alm.slot && alm.slot.on === false, '<b>기본은 꺼져 있다</b> — 켜져 있는 알람을 안 늘린다');
  is(alm.onN === 3, '켜져 있는 알람 수가 그대로다 — ' + alm.onN + '개');
  is(!!alm.line && alm.line.n > 0, '켜면 건수를 적는다 (받음 ' + (alm.line && alm.line.n) + '건)');
  const NAMES = ['홍○동', '홍○순', '홍○돌', '홍○복', '홍길동'];
  const txt = alm.line ? ((alm.line.title || '') + ' ' + (alm.line.body || '')) : '';
  is(!NAMES.some(n => txt.indexOf(n) >= 0), '알람 글에 이름이 한 자도 없다 (3번) — 「' + txt + '」');
  is(!/\d[\d,]*\s*(원|만원|억)/.test(txt), '알람 글에 금액이 없다 (3번)');

  console.log('\n[12] 그려진 화면에 선다');
  await page.evaluate(() => {
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    AR.cat = 'check'; go('airep');
    if (typeof osHideLoginGate === 'function') osHideLoginGate();
    BAX.open = true; if (typeof chkPaint === 'function') chkPaint();
  });
  await page.waitForTimeout(700);
  const dom = await page.evaluate(() => ({
    box: document.querySelectorAll('.bax').length,
    rows: document.querySelectorAll('.bax-r').length,
    groups: document.querySelectorAll('.bax-g').length
  }));
  is(dom.box === 1, '칸이 하나 선다 (받음 ' + dom.box + ')');
  is(dom.rows > 0, '줄이 그려진다 (받음 ' + dom.rows + ')');
  is(dom.groups >= 3, '갈래 머리가 선다 (받음 ' + dom.groups + ')');

  console.log('\n[13] 화면이 안 터진다');
  is(errs.length === 0, '터진 것 없음' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close(); srv.close();
  console.log(bad ? ('\n✗ 어긋남 ' + bad + '곳') : '\n✓ 다 맞습니다');
  process.exit(bad ? 1 : 0);
})();
