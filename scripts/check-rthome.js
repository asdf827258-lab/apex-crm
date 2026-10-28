/* ══ 🏠 출발지를 잡으면 그 자리에서 동선을 다시 짜나 ═══════════════════

   사장님 말씀 (2026-10-28) — <b>「현재 위치를 입력할수 있도록 해, 출발지
   입력하면, 재구성해서 알려줄수 있도록해」</b>.

   ── 손대기 전 ──────────────────────────────────────────────────────
   「🏠 출발지」 는 <b>prompt 로 주소를 치는 길 하나</b>뿐이었습니다. 길에서
   폰으로 쓰는 화면인데 <b>「지금 내 자리」 가 없었습니다.</b>
   다시 짜는 셈(tour)은 이미 HOME 에서 출발하도록 되어 있었습니다 — 그래서
   <b>새로 만들지 않고</b> 들어가는 길만 넓혔습니다 (5번).

   ── 여기서 보는 것 ─────────────────────────────────────────────────
     [1] 「🏠 출발지」 를 누르면 <b>고르는 칸</b>이 서고 길이 둘이다
         (📍 지금 내 자리 · ✏️ 주소로 적기) · 손가락이 닿는다(44px)
     [2] 📍 를 누르면 <b>폰이 알려 준 좌표</b>가 그대로 담긴다
         · 좌표는 <b>이 브라우저에만</b> (3번 · 7번 — 서버로 안 보냅니다)
         · 이름을 <b>지어 붙이지 않는다</b> — 주소를 모르니 「지금 내 자리」
           와 좌표만 적는다 (1번)
     [3] ★★ 담기면 <b>그 자리에서 다시 짠다</b>
         · 「출발」 시각이 선다(몇 시에 나서야 하는지)
         · 첫 줄이 「출발지에서 N km」 로 바뀐다
         · 「시간을 다시 잡을 수 있다면」 이 <b>출발지에서 출발하는</b> 순서다
     [4] ★★ 위치를 <b>못 받으면 못 받았다고</b> 말하고 <b>아무것도 안 바꾼다</b>
         · 허락 안 하심 · 너무 오래 걸림 — 까닭을 갈라 말한다 (1번)
         · 지난 출발지를 그대로 둔다 — 지어낸 자리를 넣지 않는다

   ⚠ 바깥(카카오·Supabase)은 다 끊습니다. 견본 이름은 홍길동 집안(3번).
   ⚠ 지도 그림은 여기서 안 봅니다 — 카카오를 막았으니 안 뜨는 것이 맞습니다.
     이 자가 보는 것은 <b>순서·시각·거리</b>이고 그것은 지도 없이도 섭니다.  */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };

let bad = 0;
const is = (ok, m) => { console.log('  ' + (ok ? '✓' : '✗') + '   ' + m); if (!ok) bad++; };

/* 순천 시내 다섯 — 오늘 약속이 다 잡힌 날 */
const P5 = [
  { id: 'a1', nm: '홍길동', rg: '전남 순천시 연향동', lat: 34.9480, lng: 127.5250, ap: 'T10:00:00' },
  { id: 'a2', nm: '홍길순', rg: '전남 순천시 조례동', lat: 34.9520, lng: 127.5190, ap: 'T11:30:00' },
  { id: 'a3', nm: '홍갑돌', rg: '전남 순천시 풍덕동', lat: 34.9410, lng: 127.4960, ap: 'T13:30:00' },
  { id: 'a4', nm: '홍말순', rg: '전남 순천시 해룡면', lat: 34.9105, lng: 127.5570, ap: 'T15:00:00' },
  { id: 'a5', nm: '홍판서', rg: '전남 순천시 왕조동', lat: 34.9600, lng: 127.5110, ap: 'T16:30:00' }
];
/* ★ 날짜는 <b>그날</b>로 맞춥니다 — 약속이 오늘이어야 동선이 섭니다 */
const DAY = (() => { const d = new Date(); const z = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); })();

const STUB = `(function(){
function D(p){ return {id:p.id,customer_name:p.nm,phone:'010-0000-'+p.id.slice(1),
  region:p.rg,stage:'AP',assigned_to:'u1',created_by:'u1',assigned_date:'2026-07-01',
  created_at:'2026-07-01T00:00:00Z',next_appt:'${DAY}'+p.ap,memo:'',
  addr:p.rg,lat:p.lat,lng:p.lng,next_appt_place:p.rg,next_appt_lat:p.lat,next_appt_lng:p.lng,
  region_code:null,sido:'전라남도',sigungu:'순천시',dong:null,followup:null}; }
var DBS=${JSON.stringify(P5)}.map(D);
var T={profiles:[{id:'u1',name:'홍길동 (나)',role:'fp',active:true}],
  dbs:DBS,calls:[],attendance:[],teams:[],team_members:[],
  app_config:[{key:'kakao_js_key',value:'00000000000000000000000000000000'}],clients:[]};
function Q(t){var o={_t:t};
  ['select','eq','neq','gte','lte','order','limit','in','is','maybeSingle','not','or','ilike','range']
    .forEach(function(m){o[m]=function(){return o}});
  o.single=function(){o._s=1;return o};
  ['insert','upsert','update','delete'].forEach(function(m){o[m]=function(){return o}});
  o.then=function(res){var d=T[t]||[];return Promise.resolve(res({data:o._s?(d[0]||null):d,error:null}))};
  return o;}
window.supabase={createClient:function(){return{
  from:Q, auth:{getUser:function(){return Promise.resolve({data:{user:{id:'u1',email:'me@x'}}})},
  getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1'}}}})},
  onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}}},
  rpc:function(){return Promise.resolve({data:null,error:null})},
  channel:function(){return{on:function(){return this},subscribe:function(){return this}}}}}};
})();`;

const srv = http.createServer((rq, rs) => {
  const u = rq.url.split('?')[0];
  const f = path.join(ROOT, decodeURIComponent(u));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    rs.writeHead(404); return rs.end();
  }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  rs.end(fs.readFileSync(f));
});

/* 동선 창을 연 쪽을 돌려줍니다 — 자리 셋이 다 같은 길입니다 (5번) */
async function 열기(b, PORT, opt) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 430, height: 1000 } }, opt || {}));
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('localhost:' + PORT) >= 0 || u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    if (/supabase-js/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    return r.abort();
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 130)));
  await p.goto('http://localhost:' + PORT + '/db-crm.html?mig=1&me=u1',
               { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 60; i++) {
    const ok = await p.evaluate(() => { try { return !!(window.apexCrmReady && apexCrmReady()); } catch (e) { return false; } });
    if (ok) break; await p.waitForTimeout(500);
  }
  await p.evaluate(() => { try { apexRouteOpen(); } catch (e) {} });
  await p.waitForTimeout(2500);
  return { ctx, p, errs };
}
const 글 = (p) => p.evaluate(() => {
  const w = document.getElementById('rtWrap');
  return w ? (w.innerText || '').replace(/\s+/g, ' ') : '';
});

(async () => {
  await new Promise(r => srv.listen(0, r));
  const PORT = srv.address().port;
  const b = await chromium.launch();

  /* ── [1] 고르는 칸이 서고 길이 둘 ─────────────────────────────── */
  console.log('\n[1] 🏠 <b>누르면 고르는 칸</b>이 서고 길이 둘이다');
  const A = await 열기(b, PORT, { permissions: ['geolocation'],
                                  geolocation: { latitude: 34.9506, longitude: 127.4872 } });
  const 전 = await 글(A.p);
  is(/확정 약속 5건/.test(전), '  오늘 약속 <b>다섯</b>이 선다 — 동선을 잴 수 있는 날이다');
  await A.p.click('#rtHome'); await A.p.waitForTimeout(500);
  const S = await A.p.evaluate(() => {
    const w = document.getElementById('rtHomeSheet'); if (!w) return null;
    return { 글: (w.innerText || '').replace(/\s+/g, ' '),
             키: [].slice.call(w.querySelectorAll('button'))
                   .map(e => Math.round(e.getBoundingClientRect().height)),
             gps: !!w.querySelector('#rtHomeGps'), addr: !!w.querySelector('#rtHomeAddr') };
  });
  is(!!S, '  <b>고르는 칸</b>이 선다');
  is(!!S && S.gps && S.addr,
     '  ★★ 길이 <b>둘</b>이다 — 📍 지금 내 자리 · ✏️ 주소로 적기'
     + (S ? '' : ' ← 못 찾았습니다'));
  is(!!S && S.키.length > 0 && S.키.every(h => h >= 44),
     '  ★ 손가락이 닿는다 — ' + (S ? S.키.join(' · ') + 'px' : '?') + ' (44px 이상)');
  is(!!S && /다시 셉니다|다시 짭/.test(S.글),
     '  <b>무엇이 달라지는지</b> 미리 말한다 — 「' + (S ? S.글.slice(0, 54) : '') + '…」');

  /* ── [2]·[3] 📍 를 누르면 담기고 그 자리에서 다시 짠다 ────────── */
  console.log('\n[2] 📍 <b>지금 내 자리</b> — 좌표가 그대로 담긴다 (서버로 안 보냅니다)');
  await A.p.click('#rtHomeGps'); await A.p.waitForTimeout(2200);
  const H = await A.p.evaluate(() => {
    let h = null; try { h = JSON.parse(localStorage.getItem('apexRouteHomeV1') || 'null'); } catch (e) {}
    return h;
  });
  is(!!H && Math.abs(H.lat - 34.9506) < 0.001 && Math.abs(H.lng - 127.4872) < 0.001,
     '  ★★ <b>폰이 알려 준 좌표</b>가 담겼다 — ' + (H ? H.lat + ', ' + H.lng : '없습니다'));
  is(!!H && /지금 내 자리/.test(H.label) && !/동$|읍$|면$|로\d/.test(H.label),
     '  ★ 이름을 <b>지어 붙이지 않는다</b> — 「' + (H ? H.label : '') + '」'
     + ' (주소를 모르니 그렇게만 적습니다 · 1번)');
  is(!(await A.p.evaluate(() => !!document.getElementById('rtHomeSheet'))),
     '  고른 뒤 <b>칸이 닫힌다</b>');

  console.log('\n[3] ★★ <b>그 자리에서 다시 짠다</b> (사장님 말씀 「재구성해서 알려줄수 있도록」)');
  const 후 = await 글(A.p);
  is(/출발\s*\d{1,2}:\d{2}/.test(후),
     '  ★★ <b>몇 시에 나서야 하는지</b>가 선다 — 「'
     + ((후.match(/출발\s*\d{1,2}:\d{2}/) || ['없습니다'])[0]) + '」');
  /* ⚠ <b>찾는 글과 찍는 글이 달라 「없습니다」 라고 적으면서 통과</b>했습니다 —
     초록인데 글이 거짓말하는 자리입니다. 같은 것으로 맞췄습니다 (1번). */
  const 첫줄 = (후.match(/출발지에서\s*[\d.]+\s*km[^가-힣]*·[^가-힣]*\d+\s*분쯤/) ||
                후.match(/출발지에서\s*[\d.]+\s*km/) || [''])[0];
  is(!!첫줄,
     '  ★★ 첫 줄이 <b>「출발지에서 N km」</b> 로 바뀐다 — 「' + (첫줄 || '없습니다') + '」');
  is(/에서 나섭니다/.test(후), '  하루 스케줄표 <b>맨 윗줄</b>이 출발지가 된다');
  is(/시간을 다시 잡을 수 있다면/.test(후) && /줄어듭니다/.test(후),
     '  ★★ <b>더 가까운 순서</b>를 알려 준다 — 「'
     + ((후.match(/이동이 [^)]*\)/) || ['없습니다'])[0]) + '」');
  /* ★ 출발지가 <b>셈에 들어갔나</b> — 안 들어갔으면 총 이동이 그대로입니다 */
  const km전 = +((전.match(/총 이동 (\d+)km/) || [0, 0])[1]);
  const km후 = +((후.match(/총 이동 (\d+)km/) || [0, 0])[1]);
  is(km후 > km전,
     '  ★★ 출발지가 <b>셈에 들어갔다</b> — 총 이동 ' + km전 + ' → ' + km후 + 'km'
     + (km후 > km전 ? ' (출발지에서 첫 약속까지가 더해졌습니다)' : ' ← 그대로입니다'));
  is(A.errs.length === 0, '  재는 동안 <b>터진 곳이 없다</b> — ' + (A.errs.join(' | ') || '0건'));
  await A.ctx.close();

  /* ── [4] 못 받으면 못 받았다고 ────────────────────────────────── */
  console.log('\n[4] ★★ <b>위치를 못 받으면 못 받았다고</b> 말하고 아무것도 안 바꾼다 (1번)');
  /* 허락을 안 준 창 — getCurrentPosition 이 code 1 로 떨어집니다 */
  const B = await 열기(b, PORT, {});
  const 먼저 = await B.p.evaluate(() => {
    /* 지난 출발지가 있는 상태에서 실패해 보아야, 「그대로 두나」 를 묻습니다 */
    const h = { lat: 35.1, lng: 126.9, label: '사무실' };
    localStorage.setItem('apexRouteHomeV1', JSON.stringify(h));
    return h.label;
  });
  await B.p.evaluate(() => { try { apexRouteOpen(); } catch (e) {} });
  await B.p.waitForTimeout(1200);
  await B.p.click('#rtHome'); await B.p.waitForTimeout(400);
  await B.p.click('#rtHomeGps'); await B.p.waitForTimeout(2500);
  const R = await B.p.evaluate(() => {
    let h = null; try { h = JSON.parse(localStorage.getItem('apexRouteHomeV1') || 'null'); } catch (e) {}
    const t = (document.body.innerText || '').replace(/\s+/g, ' ');
    /* ⚠ 온 화면 글에서 긁으면 엉뚱한 줄이 딸려 옵니다 — <b>쪽지(toast)</b>만
       봅니다. 처음에 출근관리 글까지 같이 찍혔습니다 (1번). */
    const tip = [].slice.call(document.querySelectorAll(
      '.toast,#toast,[class*="toast"],[id*="toast"]'))
      .map(e => (e.innerText || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean).join(' / ');
    const 어디 = tip || t;
    return { h: h, 말: /허락|못 받|시간이 너무/.test(어디),
             글: (어디.match(/[^.]*(허락|못 받|시간이 너무)[^.]*/) || [''])[0].slice(0, 72) };
  });
  is(R.말, '  ★★ <b>못 받았다고 말한다</b> — 「' + (R.글 || '아무 말이 없습니다') + '」');
  is(!!R.h && R.h.label === 먼저,
     '  ★★ <b>지난 출발지를 그대로</b> 둔다 — 「' + (R.h ? R.h.label : '사라졌습니다') + '」'
     + ' (지어낸 자리를 넣지 않습니다 · 1번)');
  is(B.errs.length === 0, '  그때도 <b>안 터진다</b> — ' + (B.errs.join(' | ') || '0건'));
  await B.ctx.close();

  /* ── [5] 길을 안 지웠다 (6번) ─────────────────────────────────── */
  console.log('\n[5] 🚪 <b>예전 길도 그대로</b> 있다 (6번 · 길은 안 지운다)');
  const src = fs.readFileSync(path.join(ROOT, 'apex-route.js'), 'utf8');
  is(/function setHome\(/.test(src), '  <b>setHome</b> 이 그대로 있다 — 부르던 자리가 안 끊긴다');
  is(/function homeAddr\(/.test(src) && /prompt\(/.test(src),
     '  <b>주소로 적는 길</b>도 그대로 있다');
  is(/tour\(pts,\s*HOME\s*\|\|/.test(src),
     '  ★ 다시 짜는 셈이 <b>HOME 에서 출발</b>한다 — 여기 또 안 만들었다 (5번)');

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 빨간불 — 출발지가 제 구실을 못 합니다'); process.exit(1); }
  console.log('✓ 출발지를 두 길로 잡고, 잡으면 그 자리에서 동선을 다시 짭니다.');
})();
