/* ══ 🗓 check-rtcourse — 🗺️ 지역 동선의 「오늘 코스 한 장」 (판 X367) ══════════════
   사장님 말씀 (2026-11-06) 「지역동선으로 설계사의 상담 효율을 높여 !」 → 고르신 둘
   「동네(동) 모으기」 · 「하루 코스 한 장」.

   ⚠ 재어 보니 사장님 고객 94분은 지역이 「순천」 같은 시 이름뿐이고 주소·위치가 0분 —
     시 하나에 79분이 한 덩어리라 「오늘 어디부터」 가 안 섰습니다.

   보는 것
     [1] 약속이 없는 날 — 후보를 <b>동네(dbs.dong)로 묶어</b> 제일 많은 동네가 먼저 선다
         · 그 동네 분만 줄에 선다 · 📞 · 약속 잡기 · 44px
     [2] 다른 동네 칩을 누르면 그 동네로 바뀐다 (고른 자리는 COURSE 하나)
     [3] 동네를 모르는 분은 <b>몇 분인지</b> 적고 어디서 적는지 말한다 — 짐작해 넣지 않는다 (1번)
     [4] ★ 시각·거리를 <b>지어 적지 않는다</b> — 코스 안에 「몇 분」·「km」 가 없다 (1번)
     [5] 동네를 아는 분이 한 분도 없으면 <b>코스를 안 짓고</b> 그렇다고 말한다
     [6] 약속이 있는 날에는 코스를 안 세운다 (그날은 스케줄표가 일을 합니다)
   ⚠ 되돌림 — 동네로 안 묶고 첫 후보 동네를 그대로 쓰면 [1] 이, 시각을 붙이면 [4] 가 웁니다.
   ★ 바깥을 한 번도 안 부릅니다 (7번). 견본 이름은 홍길동 집안 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
/* ⚠ <b>시계를 못 박습니다</b> (lib-clock 한 곳 · 5번). 2026-11-06 15:00Z 에 CI 가
   [6] 에서 빨간불이 됐습니다 — 자는 약속 날짜를 <b>한국 날짜</b>로 지어 넣는데
   창은 못 박히지 않아 <b>CI 가 도는 진짜 시계</b>(UTC)를 봤습니다. 15:00Z 를 넘으면
   두 날짜가 <b>하루 갈려</b> 「오늘 약속」 이 내일 것이 되고, 코스 칸이 서서 웁니다.
   코드는 멀쩡했고 origin/main 에서도 같은 빨간불이었습니다. lib-clock 쪽지가
   미리 적어 둔 바로 그 함정입니다(check-day · check-team 이 겪은 자리).        */
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본 서버 — check-rtteam 의 것을 그 파일에서 읽어 <b>자료만</b> 갈아 끼웁니다 (5번) */
const RT = fs.readFileSync(path.join(__dirname, 'check-rtteam.js'), 'utf8');
const BASE = (RT.match(/const STUB = `([\s\S]*?)`;/) || [])[1] || '';
const mk = (rows) => BASE.replace(/var DBS=\[[\s\S]*?\];/, 'var DBS=[' + rows + '];');
/* 순천: 조례동 3 · 연향동 2 · 동네 모름 2 · 여수 1 */
const ROWS_A = [
  "D('s1','u1','순천','TA',{dong:'연향동'})", "D('s2','u1','순천','TA',{dong:'조례동'})",
  "D('s3','u1','순천','AP',{dong:'조례동'})", "D('s4','u1','순천','미접촉')",
  "D('s5','u1','순천','TA',{dong:'연향동'})", "D('s6','u1','순천','PC',{dong:'조례동'})",
  "D('s7','u1','순천','TA')", "D('y1','u1','여수','TA',{dong:'학동'})"
].join(',');
const ROWS_NONE = ["D('s1','u1','순천','TA')", "D('s2','u1','순천','AP')"].join(',');
const ROWS_APPT = ROWS_A + ",D('s8','u1','순천','AP',{dong:'조례동',next_appt:'" + CLK.kstDay(14) + "T14:00:00',next_appt_place:'순천시청',next_appt_lat:34.95,next_appt_lng:127.48})";

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); } });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const 바깥 = [];
  const open = async (rows) => {
    const ctx = await br.newContext(CLK.ctxOpt());
    await CLK.pin(ctx, 14);          /* 창이 열리기 전에 — 나중에 박으면 늦습니다 */
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e)));
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: mk(rows) });
      if (/route-km/.test(u)) return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' });
      if (/dapi\.kakao\.com/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{"errorType":"AccessDeniedError"}' });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) { if (!/pretendard|fonts\.|jsdelivr\.net\/gh/.test(u)) 바깥.push(u.slice(0, 60)); return r.abort(); }
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=u1', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 && typeof apexRouteOpen === 'function'; } catch (e) { return false; } }, { timeout: 30000 });
    await pg.evaluate(() => apexRouteOpen('', '순천'));
    await pg.waitForTimeout(700);
    return { ctx, pg, errs };
  };
  const LOOK = () => {
    const c = document.querySelector('#rtSide .rt-course');
    if (!c) return { 있나: false };
    const txt = c.innerText.replace(/\s+/g, ' ');
    return { 있나: true, txt,
      head: (c.querySelector('.rt-cs-h') || {}).innerText || '',
      rows: [...c.querySelectorAll('.rt-cs-l li')].map(li => li.innerText.replace(/\s+/g, ' ')),
      chips: [...c.querySelectorAll('[data-course]')].map(b => b.innerText.trim()),
      small: [...c.querySelectorAll('button,a')].filter(b => b.getBoundingClientRect().height < 44).map(b => b.innerText.trim()),
      tel: c.querySelectorAll('a[href^="tel:"]').length, call: c.querySelectorAll('[data-rcall]').length };
  };

  console.log('\n[1] 약속 없는 날 — 동네로 묶어 <b>제일 많은 동네</b>부터');
  const A = await open(ROWS_A);
  const a = await A.pg.evaluate(LOOK);
  is(a.있나, '  🗓 오늘 코스 칸이 선다');
  is(/조례동/.test(a.head) && /3분/.test(a.head), '  ★★ 머리가 「조례동 3분」 — 제일 많은 동네 · ' + a.head);
  is(a.rows.length === 3 && a.rows.every(r => /홍길동/.test(r)), '  그 동네 분만 줄에 선다 — ' + a.rows.length + '줄');
  is(a.tel === 3 && a.call === 3, '  줄마다 📞 전화 · 약속 잡기 — 📞 ' + a.tel + ' · 잡기 ' + a.call);
  is(a.small.length === 0, '  누르는 자리 44px 이상 — ' + (a.small.join(' · ') || '작은 것 없음'));
  is(!/학동/.test(a.txt), '  다른 시(여수) 동네는 안 섞인다');

  console.log('\n[2] 다른 동네 칩을 누르면 그 동네로');
  is(a.chips.length === 2 && /연향동 2분/.test(a.chips.join(' ')), '  칩 — ' + a.chips.join(' · '));
  await A.pg.evaluate(() => { const b = [...document.querySelectorAll('#rtSide [data-course]')].find(x => /연향동/.test(x.textContent)); if (b) b.click(); });
  await A.pg.waitForTimeout(300);
  const a2 = await A.pg.evaluate(LOOK);
  is(/연향동/.test(a2.head) && a2.rows.length === 2, '  ★ 연향동으로 바뀐다 — ' + a2.head + ' · ' + a2.rows.length + '줄');

  console.log('\n[3] 동네를 모르는 분은 <b>몇 분인지</b> 말한다 (1번)');
  is(/동네를 모르는 분 2분/.test(a.txt) && /📍 동네/.test(a.txt), '  「동네를 모르는 분 2분 — 📍 동네 로 적으시면」');

  console.log('\n[4] ★ 시각·거리를 <b>지어 적지 않는다</b> (1번)');
  is(!/\d+\s*km|\d{1,2}:\d{2}|차로 \d+분|\d+분쯤/.test(a.txt), '  코스 안에 km · 시각 · 「몇 분쯤」 0');
  await A.ctx.close();

  console.log('\n[5] 동네를 아는 분이 없으면 <b>코스를 안 짓는다</b>');
  const B = await open(ROWS_NONE);
  const b = await B.pg.evaluate(LOOK);
  is(b.있나 && b.rows.length === 0 && /동네를 아는 분이 아직 없어/.test(b.txt) && /2분/.test(b.txt),
     '  「동네를 아는 분이 아직 없어 코스를 못 짭니다 — 후보 2분 모두 동네 미입력」');
  is(/이분 끝/.test(b.txt), '  어디서 적는지 말한다 — 📍 동네 · 홈 「이분 끝」 뒤 📝');
  await B.ctx.close();

  console.log('\n[6] 약속이 있는 날에는 코스를 안 세운다');
  const C = await open(ROWS_APPT);
  const c = await C.pg.evaluate(LOOK);
  is(!c.있나, '  약속 1건이 있는 날 — 코스 칸 ' + (c.있나 ? '섰습니다 ← 스케줄표와 겹칩니다' : '없음'));
  const 오류 = [].concat(A.errs, B.errs, C.errs);
  await C.ctx.close();

  console.log('\n[7] 조용한가');
  is(!오류.length, '  터진 곳 없음' + (오류.length ? ' — ' + 오류[0] : ''));
  is(!바깥.length, '  바깥 서버 0 — ' + (바깥.slice(0, 2).join(' · ') || '없음'));

  await br.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불 — 오늘 코스가 동네로 안 묶이면 시 하나에 79분이 한 덩어리로 남습니다') : '✓ 🗓 약속 없는 날, 동네별 오늘 코스가 섭니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
