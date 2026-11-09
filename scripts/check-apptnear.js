/* ══ 🏘 check-apptnear — 약속을 잡을 때 <b>같은 동네로 몰기</b> (판 X384) ══════════════
   사장님 말씀 (2026-11-08) 「약속잡을때도 같은 동네로 몰아줘」.

   통화 기록 창에서 결과를 「상담」 으로 고르면, 이분과 같은 동네에 앞으로 2주 안에
   이미 잡힌 약속이 서고, 누르면 그 약속이 끝나는 시각으로 약속 칸이 채워집니다.

   보는 것
     [1] 「상담」 일 때만 선다 — 부재면 안 선다
     [2] ★★ 같은 동네 · 같은 담당자 · 앞으로 2주 안 약속만 — 다른 동네 · 남의 약속 ·
         지난 약속 · 2주 밖은 안 선다
     [3] ★★ 누르면 약속 칸이 「그 약속 시작 + 상담 한 건(STAY)」 으로 채워진다 · 저장은 안 한다
     [4] ★ 이동 시간을 <b>지어 적지 않는다</b> — 「오가는 시간은 따로」 라고 말한다 (1번)
     [5] 동네를 모르는 분이면 <b>같은 시</b>로 보고 그렇다고 적는다 (짐작 안 함 · 1번)
     [6] 같은 동네에 약속이 없으면 없다고 말한다 · 44px · 터진 곳 0 · 바깥 0
   ⚠ 되돌림 — 동네 거르기를 빼면 [2] 가, 담당자 거르기를 빼면 [2] 가 웁니다.
   ★ 견본 서버는 check-rtteam 의 것을 그 파일에서 읽어 자료만 갈아 끼웁니다 (5번). 이름은 홍길동 집안(3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const RT = fs.readFileSync(path.join(__dirname, 'check-rtteam.js'), 'utf8');
const BASE = (RT.match(/const STUB = `([\s\S]*?)`;/) || [])[1] || '';
const mk = (rows) => BASE.replace(/var DBS=\[[\s\S]*?\];/, 'var DBS=[' + rows + '];');
/* 날짜는 <b>지금에서 셉니다</b>(앞으로 2주를 묻는 자리라 못 박으면 날이 지나 거짓이 됩니다) */
const at = (dd, h) => { const d = new Date(); d.setDate(d.getDate() + dd); d.setHours(h, 0, 0, 0);
  const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(h) + ':00:00'; };
const ROWS = [
  "D('t1','u1','순천','TA',{dong:'조례동'})",                                   /* 약속을 잡을 분 */
  "D('t2','u1','순천','TA')",                                                   /* 동네 모름 */
  "D('a1','u1','순천','AP',{dong:'조례동',next_appt:'" + at(3, 14) + "'})",      /* ✓ 같은 동네 · 내 것 · 3일 뒤 */
  "D('a2','u1','순천','AP',{dong:'연향동',next_appt:'" + at(4, 10) + "'})",      /* ✗ 다른 동네 (시는 같음) */
  "D('a3','u2','순천','AP',{dong:'조례동',next_appt:'" + at(2, 11) + "'})",      /* ✗ 남의 약속 */
  "D('a4','u1','순천','PC',{dong:'조례동',next_appt:'" + at(30, 15) + "'})",     /* ✗ 2주 밖 */
  "D('a5','u1','순천','AP',{dong:'조례동',next_appt:'" + at(-2, 15) + "'})",     /* ✗ 지난 약속 */
  "D('y1','u1','여수','AP',{dong:'학동',next_appt:'" + at(5, 9) + "'})"          /* ✗ 다른 시 */
].join(',');

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
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('apexRouteStayV1', '60'); } catch (e) {} });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e)));
  await ctx.route('**://**', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: mk(ROWS) });
    if (/route-km/.test(u)) return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' });
    if (/dapi\.kakao\.com/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) { if (!/pretendard|fonts\.|jsdelivr\.net\/gh/.test(u)) 바깥.push(u.slice(0, 60)); return r.abort(); }
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=u1', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 && typeof openCall === 'function'; } catch (e) { return false; } }, { timeout: 30000 });
  await pg.waitForTimeout(400);

  const LOOK = () => {
    const b = document.getElementById('apptNear');
    if (!b) return { 있나: false, 보임: false };
    const r = b.getBoundingClientRect();
    return { 있나: true, 보임: !b.classList.contains('hidden') && r.height > 0,
      t: b.innerText.replace(/\s+/g, ' '),
      칩: [...b.querySelectorAll('[data-apn]')].map(x => ({ t: x.innerText.replace(/\s+/g, ' '), v: x.getAttribute('data-apn'), h: Math.round(x.getBoundingClientRect().height) })) };
  };

  console.log('\n[1] 「상담」 일 때만 선다');
  await pg.evaluate(() => { openCall('t1'); document.getElementById('callResult').value = '부재'; toggleAppointment(); });
  const 부재 = await pg.evaluate(LOOK);
  is(!부재.보임, '  부재일 때 — ' + (부재.보임 ? '섰습니다' : '안 섬'));
  await pg.evaluate(() => { document.getElementById('callResult').value = '상담'; toggleAppointment(); });
  const A = await pg.evaluate(LOOK);
  is(A.보임 && /같은 동네\(조례동\)/.test(A.t), '  상담일 때 — 「🏘 같은 동네(조례동)에 잡힌 약속」 이 선다');

  console.log('\n[2] ★★ 같은 동네 · 같은 담당자 · 앞으로 2주 안 약속만');
  is(A.칩.length === 1, '  칩 ' + A.칩.length + '개 — ' + A.칩.map(c => c.t).join(' | '));
  is(A.칩.length === 1 && A.칩[0].v.slice(11, 16) === '15:00' && A.칩[0].v.slice(0, 10) === at(3, 14).slice(0, 10),
     '  그 칩이 3일 뒤 14:00 약속(a1) — 끝나는 시각 15:00 · ' + (A.칩[0] ? A.칩[0].v : ''));

  console.log('\n[3] ★★ 누르면 약속 칸이 채워진다 · 저장은 안 한다');
  const R3 = await pg.evaluate(async () => {
    const w = []; const o = window.saveCall; window.saveCall = function () { w.push(1); return o && o.apply(this, arguments); };
    const b = document.querySelector('#apptNear [data-apn]'); if (b) b.click();
    await new Promise(r => setTimeout(r, 150));
    window.saveCall = o;
    return { v: document.getElementById('appointmentAt').value, 저장: w.length, open: document.getElementById('callModal').classList.contains('open') };
  });
  is(R3.v === (A.칩[0] || {}).v && R3.저장 === 0 && R3.open, '  약속 칸 「' + R3.v + '」 · 저장 ' + R3.저장 + '번 · 창은 그대로');

  console.log('\n[4] ★ 이동 시간을 지어 적지 않는다 (1번)');
  is(/오가는 시간은 따로/.test(A.t) && !/km|차로 \d+분|이동 \d+분/.test(A.t), '  「오가는 시간은 따로 보세요」 · km·이동 몇 분 0');

  console.log('\n[5] 동네를 모르는 분이면 <b>같은 시</b>로');
  await pg.evaluate(() => { openCall('t2'); document.getElementById('callResult').value = '상담'; toggleAppointment(); });
  const B = await pg.evaluate(LOOK);
  is(B.보임 && /같은 시\(순천시\)/.test(B.t) && /동네를 몰라 시로/.test(B.t), '  「같은 시(순천시) · 이분 동네를 몰라 시로 봅니다」');
  is(B.칩.length === 2, '  순천시의 내 앞날 2주 약속 둘(조례동·연향동) — 남의 것 · 여수 · 지난 것 · 2주 밖은 빠짐 · ' + B.칩.length + '개');

  console.log('\n[6] 없으면 없다고 · 손가락 · 조용한가');
  await pg.evaluate(() => { const d = eval('dbs').find(x => x.id === 't1'); d.dong = '왕지동'; openCall('t1'); document.getElementById('callResult').value = '상담'; toggleAppointment(); });
  const C = await pg.evaluate(LOOK);
  is(C.보임 && /잡힌 약속이 없습니다/.test(C.t) && C.칩.length === 0, '  같은 동네에 약속이 없으면 「없습니다」');
  is(A.칩.concat(B.칩).every(c => c.h >= 44), '  칩 44px 이상 — ' + A.칩.concat(B.칩).map(c => c.h).join(' · '));
  is(!errs.length, '  터진 곳 없음' + (errs.length ? ' — ' + errs[0] : ''));
  is(!바깥.length, '  바깥 서버 0');

  await br.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불 — 약속이 동네로 안 몰리면 하루에 길 위에서 보내는 시간이 늡니다') : '✓ 🏘 약속을 잡을 때 같은 동네 약속 옆으로 붙입니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
