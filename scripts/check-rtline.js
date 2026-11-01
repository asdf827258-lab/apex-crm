/* 🛣️ 지역 동선의 <b>길 선</b>이 진짜로 그려지나 — <b>담당자마다 제 고객으로</b> · 판 X282

   사장님 말씀 (2026-11-01) — 「<b>카카오 동선 선은, 모두 각자 고객에게
   되도록 만들어줘</b>」.

   ── 왜 이 자가 필요한가 ──────────────────────────────────────────────
   ⚠⚠ <b>선을 실제로 그려 보는 자가 한 곳도 없었습니다.</b> check-rtuse 는
     「코드에 Polyline 이라는 글자가 있나」 만 봤고(글자 점검), 지도 자들은
     모두 카카오를 <b>401 로 막아</b> 지도가 아예 안 떴습니다. 그래서
     「되나 안 되나」 를 아무도 모른 채 판이 셋 지나갔습니다 (8번).
   ★ 여기서는 <b>카카오를 흉내 낸 가짜 SDK</b>를 내려 주고 지도를 실제로
     그립니다. 그린 선의 <b>좌표 수</b>까지 셉니다.
   ★ 바깥으로는 한 글자도 안 나갑니다 — 카카오도 사장님 서버도 가짜입니다.

   ── 여기서 재는 것 ──────────────────────────────────────────────────
     [1] 지도가 서고 <b>선이 그려지나</b>
     [2] ★ 길을 받으면 <b>그 길대로</b> 긋나 — 직선이 아니라
     [3] ★ 길을 못 받으면 <b>직선으로 긋고 그렇다고 말하나</b> (1번)
     [4] ★★ <b>담당자를 바꾸면 그 사람 고객으로</b> 다시 긋나 (사장님 말씀)
     [5] ★ 키를 <b>서버에서</b> 받나 — 담당자마다 따로 안 넣어도 되나
     [6] 좌표 없는 분은 <b>안 찍나</b> — 시청 좌표로 지어 찍지 않나 (1번)   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본 서버·날짜는 <b>check-rtplan 의 것</b>을 그 파일에서 읽어 씁니다 —
   두 벌 두지 않습니다 (5번). */
const RP = fs.readFileSync(path.join(ROOT, 'scripts', 'check-rtplan.js'), 'utf8');
const DAY = (RP.match(/const DAY = '([\d-]+)'/) || [, ''])[1];
const STUB = RP.slice(RP.indexOf('const STUB = `') + 'const STUB = `'.length,
                      RP.indexOf('`;', RP.indexOf('const STUB = `')));

/* ── 가짜 카카오 지도 SDK ────────────────────────────────────────────
   그린 것을 <b>세어 둡니다</b> — 선 하나하나의 좌표 수까지. 덮개는
   #rtMap 안에 진짜로 붙입니다(점을 세려면 떠 있어야 합니다).        */
const KAKAO = `
window.__LINES=[]; window.__PLN=0;
window.kakao={maps:{
  load:function(cb){ try{cb()}catch(e){} },
  LatLng:function(a,b){ this.getLat=function(){return a}; this.getLng=function(){return b}; },
  LatLngBounds:function(){ this.extend=function(){}; },
  Map:function(el,o){ this.setBounds=function(){}; this.relayout=function(){};
                      this.setCenter=function(){}; this.setLevel=function(){}; this.getLevel=function(){return 6}; },
  CustomOverlay:function(o){ var el=o&&o.content;
    this.setMap=function(m){ var box=document.getElementById('rtMap'); if(!el)return;
      if(m&&box){ if(el.parentNode!==box)box.appendChild(el) }
      else if(el.parentNode)el.parentNode.removeChild(el); }; },
  /* ⚠ 지운 선은 <b>진짜로 지웁니다</b> — 처음에 다른 꾸러미를 담아 두어
     걷어낼 때 짝이 안 맞았고, 지금 떠 있는 선이 <b>둘</b> 이라고 거짓으로
     셌습니다(지도를 두 번 그리면 앞 선은 지워집니다) (1번·8번). */
  Polyline:function(o){ var self=this; window.__PLN++; this.__n=(o&&o.path||[]).length;
    this.setMap=function(m){
      if(m){ if(window.__LINES.indexOf(self)<0)window.__LINES.push(self) }
      else window.__LINES=window.__LINES.filter(function(x){return x!==self}); }; },
  services:{ Status:{OK:'OK',ZERO_RESULT:'ZERO'},
    Geocoder:function(){ this.addressSearch=function(k,cb){cb([], 'ZERO')};
                         this.coord2RegionCode=function(a,b,cb){cb([], 'ZERO')}; },
    Places:function(){ this.keywordSearch=function(k,cb){cb([], 'ZERO')}; } }
}};
`;
/* 길 좌표를 주는 가짜 길찾기 — 한 구간에 점 다섯 */
const 길답 = (n) => {
  const legs = []; for (let i = 0; i < n; i++)
    legs.push({ km: 3 + i, min: 8 + i,
      path: [[127.48, 34.94], [127.49, 34.95], [127.50, 34.95], [127.51, 34.96], [127.52, 34.96]] });
  return JSON.stringify({ ok: true, legs: legs });
};

(async () => {
  const srv = http.createServer((q, s) => {
    const fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { s.writeHead(404); s.end('no'); return; }
    s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
    s.end(fs.readFileSync(fp));
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();

  const 열기 = async (길줄까) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
    const sdk = { 왔나: false, 키: '' };
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 140)));
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
      /* ★ 카카오 지도 SDK — <b>가짜를 내려 줍니다</b>. 여태 자들은 여기를
         401 로 막아 지도가 아예 안 떴습니다 (이 판의 핵심). */
      if (/dapi\.kakao\.com\/v2\/maps\/sdk\.js/.test(u)) {
        sdk.왔나 = true; sdk.키 = (u.match(/appkey=([^&]+)/) || [, ''])[1];
        return r.fulfill({ contentType: 'text/javascript', body: KAKAO });
      }
      if (/route-km/.test(u)) return r.fulfill({ contentType: 'application/json',
        body: 길줄까 ? 길답(6) : '{"ok":false,"why":"NOKEY"}' });
      if (/kakao\.com/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      if (u.startsWith('http://localhost:' + P)) return r.continue();
      if (/^https?:/.test(u)) return r.abort();
      return r.continue();
    });
    await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=u1', { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
    await pg.evaluate(() => {
      try {
        localStorage.setItem('apexRouteHomeV1', JSON.stringify({ label: '순천 사무실', lat: 34.94, lng: 127.48 }));
        localStorage.setItem('apexRouteStayV1', '60');
        /* ★ 기기에는 키를 <b>안 넣습니다</b> — 서버에서 받아야 「모두」 가 됩니다 */
        localStorage.removeItem('apexKakaoKeyV1');
      } catch (e) {}
    });
    await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
    await pg.evaluate(() => apexRouteOpen());
    await pg.waitForTimeout(700);
    await pg.evaluate(d => { const e = document.getElementById('rtDate'); if (e) { e.value = d; if (e.onchange) e.onchange() } }, DAY);
    await pg.waitForTimeout(2200);
    return { ctx, pg, errs, sdk };
  };

  const 본다 = `(()=>{
    const L=window.__LINES||[];
    return { 선:L.length, 점:L.reduce((a,x)=>a+x.__n,0),
      딱지:(document.getElementById('rtLineSrc')||{}).textContent||'',
      만든선:window.__PLN||0,
      핀:document.querySelectorAll('#rtMap .rt-pin').length,
      핀꼴:[...document.querySelectorAll('#rtMap .rt-pin')].map(e=>e.className+':'+(e.textContent||'').slice(0,4)).join(' | '),
      점표:document.querySelectorAll('#rtMap .rt-dot').length,
      담당:(document.getElementById('rtOwner')||{}).value||'',
      날:(document.getElementById('rtDate')||{}).value||'',
      목록:((document.getElementById('rtSide')||{}).innerText||'').replace(/\s+/g,' ').slice(0,260),
      키:(typeof KEY!=='undefined')?(KEY?'있음':'없음'):'모름',
      팀키:(typeof KEY_TEAM!=='undefined')?!!KEY_TEAM:null };
  })()`;

  /* 그 날 <b>약속</b>을 심습니다 — 견본(check-rtplan)은 다른 날을 보고 있어
     이 날에는 확정 약속이 0건입니다. 선은 <b>들를 자리를 이어</b> 긋는 것이라
     약속이 없으면 그을 것이 없습니다. 이름은 홍길동 집안입니다 (3번). */
  const 심기 = async (pg, who, 몇) => await pg.evaluate(async (o) => {
    try { if (!profiles.some(p => p.id === o.who))
      profiles.push({ id: o.who, name: '홍판서', role: 'advisor', active: true }); } catch (e) {}
    for (let i = 0; i < o.몇; i++) dbs.push({
      id: o.who + '-z' + i, customer_name: '홍말순', phone: '010-0000-000' + i, region: '순천시',
      stage: 'AP', assigned_to: o.who, created_by: o.who, assigned_date: '2026-07-01',
      lat: 34.95 + i * 0.01, lng: 127.49 + i * 0.01, addr: '순천시 조례동',
      next_appt: o.d + 'T1' + i + ':00:00', next_appt_lat: 34.95 + i * 0.01,
      next_appt_lng: 127.49 + i * 0.01, next_appt_place: '순천시 조례동'
    });
    const sel = document.getElementById('rtOwner');
    if (sel) {
      if (![...sel.options].some(x => x.value === o.who)) {
        const op = document.createElement('option'); op.value = o.who; op.textContent = '홍판서'; sel.appendChild(op);
      }
      sel.value = o.who; if (sel.onchange) sel.onchange();
    }
    await new Promise(r => setTimeout(r, 2400));
  }, { who: who, 몇: 몇, d: DAY });

  head('[1] 지도가 서고 <b>선이 그려진다</b> — 길을 받았을 때');
  const A = await 열기(true);
  await 심기(A.pg, 'u1', 3);
  await A.pg.evaluate(() => { const b = document.getElementById('rtMapT'); if (b) b.click(); });
  await A.pg.waitForTimeout(2000);
  const a = await A.pg.evaluate(본다);
  is(a.선 >= 1, '  선이 <b>' + a.선 + '개</b> 그려졌다 — 좌표 ' + a.점 + '개 · 만든 선 ' + a.만든선 + '개 · 핀[' + a.핀꼴 + ']');
  is(a.점 >= 5, '  [2] ★ <b>길 좌표대로</b> 긋는다 — 구간마다 점이 여럿(' + a.점 + '개)이면 직선이 아닙니다');
  is(/실제 길/.test(a.딱지), '  무엇으로 그었는지 적는다 — 「' + a.딱지 + '」');
  console.log('      [들여다보기] 날 ' + a.날 + ' · 담당 「' + a.담당 + '」\n      목록: ' + a.목록);
  is(a.핀 >= 1, '  들를 자리 핀 ' + a.핀 + '개 · 둘레 점 ' + a.점표 + '개');
  head('[5] ★ 키를 <b>서버에서</b> 받는다 — 담당자마다 따로 안 넣어도 된다');
  is(A.sdk.왔나 && A.sdk.키.length >= 8,
     '  이 기기에 키를 안 넣었는데 <b>서버 키로 지도를 받으러 갔다</b> — 키 ' +
     (A.sdk.키 ? (A.sdk.키.slice(0, 4) + '…(' + A.sdk.키.length + '자)') : '(없음)') +
     '   (담당자마다 따로 안 넣어도 됩니다)');
  is(!A.errs.length, '  조용히 터진 곳이 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));

  head('[4] ★★ <b>담당자를 바꾸면 그 사람 고객으로</b> 다시 긋는다');
  const B = await A.pg.evaluate(async (d) => {
    /* 다른 담당자(u2)와 그 사람 고객을 심습니다 — 좌표는 순천 둘레 */
    try { profiles.push({ id: 'u2', name: '홍판서', role: 'advisor', active: true }); } catch (e) {}
    const 새 = [];
    for (let i = 0; i < 3; i++) 새.push({
      id: 'z' + i, customer_name: '홍말순', phone: '010-0000-000' + i, region: '순천시',
      stage: 'AP', assigned_to: 'u2', created_by: 'u2', assigned_date: '2026-07-01',
      lat: 34.95 + i * 0.01, lng: 127.49 + i * 0.01, addr: '순천시 조례동',
      next_appt: d + 'T1' + i + ':00:00', next_appt_lat: 34.95 + i * 0.01,
      next_appt_lng: 127.49 + i * 0.01, next_appt_place: '순천시 조례동'
    });
    새.forEach(x => dbs.push(x));
    const sel = document.getElementById('rtOwner');
    if (sel) {
      if (![...sel.options].some(o => o.value === 'u2')) {
        const o = document.createElement('option'); o.value = 'u2'; o.textContent = '홍판서'; sel.appendChild(o);
      }
      sel.value = 'u2'; if (sel.onchange) sel.onchange();
    }
    await new Promise(r => setTimeout(r, 2200));
    const L = window.__LINES || [];
    const 이름 = [...document.querySelectorAll('#rtMap .rt-dot')].map(e => e.title || '');
    /* ★ 들를 자리는 <b>번호가 적힌 핀</b>입니다 — 🏠 출발지와 후보(c)는 뺍니다.
       「선이 그려졌나」 만 보면 <b>남의 고객까지 이어도 초록</b>입니다 (8번). */
    const 들를곳 = [...document.querySelectorAll('#rtMap .rt-pin')]
      .filter(e => /^\d+$/.test((e.textContent || '').trim())).length;
    return { 선: L.length, 점: L.reduce((x, y) => x + y.__n, 0), 담당: sel ? sel.value : '',
             둘레: 이름.length, 들를곳: 들를곳,
             핀: document.querySelectorAll('#rtMap .rt-pin').length };
  }, DAY);
  is(B.담당 === 'u2', '  담당자를 <b>홍판서(u2)</b> 로 바꿨다');
  is(B.선 >= 1 && B.점 >= 2,
     '  ★★ 그 사람 고객으로 <b>선이 다시 그려진다</b> — 선 ' + B.선 + '개 · 좌표 ' + B.점 + '개');
  /* ★★ <b>그 사람 것만</b> 이어야 합니다 — 홍판서(u2)에게 심은 약속은 셋입니다.
     남의 약속까지 이으면 여기가 넷 이상이 됩니다 (3번·1번). */
  is(B.들를곳 === 3,
     '  ★★ 이은 자리가 <b>그 사람 약속 셋뿐</b>이다 — 들를 자리 ' + B.들를곳 +
     '곳 (남의 고객이 섞이면 늘어납니다)');
  await A.ctx.close();

  head('[3] ★ 길을 <b>못 받으면</b> 직선으로 긋고 그렇다고 말한다 (1번)');
  const C = await 열기(false);
  await 심기(C.pg, 'u1', 3);
  await C.pg.evaluate(() => { const b = document.getElementById('rtMapT'); if (b) b.click(); });
  await C.pg.waitForTimeout(2000);
  const c = await C.pg.evaluate(본다);
  is(c.선 >= 1, '  길이 없어도 <b>선은 긋는다</b> — ' + c.선 + '개 · 좌표 ' + c.점 + '개');
  is(/직선|어림/.test(c.딱지) || !c.딱지,
     '  <b>직선을 길이라 말하지 않는다</b> — 「' + (c.딱지 || '(빈칸)') + '」');
  is(!/실제 길/.test(c.딱지), '  「실제 길」 이라고 적지 않는다');
  await C.ctx.close();

  await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 길 선이 실제로 그려지고, 담당자를 바꾸면 그 사람 고객으로 다시 그립니다.');
})();
