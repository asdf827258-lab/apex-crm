/* ══════════════════════════════════════════════════════════════════
   check-rtmaphide.js — <b>지도를 숨겨 두었으면 그 자리에서 말하나.</b>
   (판 X481 · 2026-11-18)

   사장님 말씀 2026-11-17 「<b>지역동선도 꼭 뜨게 하고</b>」 ·
               2026-11-18 「<b>크롬으로 켰어 너가 해줘봐</b>」.

   ── 어떻게 찾았나 ─────────────────────────────────────────────────
   「지도가 안 뜬다」 를 끝까지 재어 봤습니다. 밖은 전부 멀쩡했습니다 —
     · 카카오 열쇠가 서버에 <b>들어 있습니다</b>(32자 · 꼴도 맞음)
     · 라이브 주소로 SDK 를 물으니 <b>HTTP 200</b> 으로 내려옵니다
     · 브라우저로 지도를 그려 보니 <b>타일 10장 · Geocoder 정상</b>
   그런데 보기 고름을 바꿔 재어 보니 —
     · 기본(both)          .rt-mapbox 430×<b>260px</b>  지도 보임
     · <b>「목록만」(list)</b>    .rt-mapbox 430×<b>0px</b>    지도 <b>통째로 사라짐</b>
     · <b>옛 열쇠 apexRouteMapOnV1='0'</b> 이 남아 있으면 역시 <b>0px</b>
   띠가 0px 이 되면 그 안에 든 <b>열쇠 안내까지 같이</b> 숨습니다. 그래서
   <b>왜 지도가 없는지 화면이 한 자도 말하지 않았습니다</b> — 사장님 눈에는
   「고장났다」 입니다 (1번).
   ⚠ 되돌아갈 길은 있었습니다(도구 띠의 「🔀 지도+목록」). 그런데 그것은
     일곱 칸 중 하나이고, <b>지도가 왜 없는지는 아무 데도 안 적혀</b> 있었습니다.

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ 기본으로는 <b>지도가 보인다</b> (260px)
     [2] ★★ 「목록만」 이면 지도 띠가 0px 이고, <b>그 자리에 왜 없는지 적힌다</b>
     [3] ★★ <b>옛 열쇠('0')가 남아 있어도</b> 같이 적힌다 — 이것이 사장님 자리
     [4] ★★ <b>그 줄에서 바로 되돌아간다</b> — 한 번 눌러 지도가 260px 로 섬
     [5] ★ 되돌리는 자는 <b>도구 띠의 그 단추와 같은 자</b>다 (5번 · mapToggle)
     [6] ★ 지도가 보일 때는 그 줄이 <b>안 뜬다</b> — 헛말을 안 합니다 (8번)
     [7] ★ 누르는 것이 <b>44px</b> · 새 색을 안 만들었나
   ⚠ 사장님 진짜 서버·진짜 카카오는 한 번도 안 부릅니다 (8번).
   ⚠ 가짜 서버 묶음은 check-rtplan 것을 떼어 씁니다 (5번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const RT = fs.readFileSync(path.join(ROOT, 'scripts/check-rtplan.js'), 'utf8');
const STUB = (function () {
  const i = RT.indexOf('const STUB = `');
  if (i < 0) throw new Error('check-rtplan 의 STUB 을 못 찾았습니다');
  const s = RT.indexOf('`', i) + 1, e = RT.indexOf('`;', s);
  return RT.slice(s, e);
})();
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

(async () => {
  const srv = http.createServer((q, s) => {
    const fp = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { s.writeHead(404); s.end('no'); return; }
    s.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
    s.end(fs.readFileSync(fp));
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });

  /* 한 경우를 열어 재는 자 — 보기 고름을 심고 동선 창을 엽니다 */
  const 열어재기 = async (뷰, 옛) => {
    const ctx = await br.newContext({ viewport: { width: 430, height: 900 } });
    await ctx.route('**://**', async r => {
      const u = r.request().url();
      if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
      if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
      /* 진짜 카카오는 한 번도 안 부릅니다 — 지도가 안 그려져도 이 자가 보는 것은
         「띠가 몇 px 인가 · 왜 없는지 적혔나」 라 괜찮습니다 (8번). */
      if (/kakao\.com|kakaocdn|route-km/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      if (u.indexOf('http://127.0.0.1:' + P) === 0) return r.continue();
      if (/^https?:/.test(u)) return r.abort();
      return r.continue();
    });
    await ctx.addInitScript(({ 뷰, 옛 }) => {
      try {
        localStorage.removeItem('apexRouteViewV1');
        localStorage.removeItem('apexRouteMapOnV1');
        if (뷰) localStorage.setItem('apexRouteViewV1', 뷰);
        if (옛) localStorage.setItem('apexRouteMapOnV1', 옛);
      } catch (e) {}
    }, { 뷰, 옛 });
    const pg = await ctx.newPage();
    const 터짐 = [];
    pg.on('pageerror', e => 터짐.push(String(e.message || e).slice(0, 110)));
    await pg.goto('http://127.0.0.1:' + P + '/db-crm.html?me=u1', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await pg.waitForTimeout(4500);
    await pg.evaluate(() => { try { apexRouteOpen(); } catch (e) {} });
    await pg.waitForTimeout(2000);
    return { ctx, pg, 터짐 };
  };
  const 재기 = (pg) => pg.evaluate(() => {
    const box = document.querySelector('.rt-mapbox');
    const off = document.getElementById('rtMapOff');
    const t = document.getElementById('rtMapT');
    const br2 = box ? box.getBoundingClientRect() : null;
    const or2 = off ? off.getBoundingClientRect() : null;
    const btn = off ? off.querySelector('button') : null;
    const brr = btn ? btn.getBoundingClientRect() : null;
    return {
      띠키: box ? Math.round(br2.height) : -1,
      줄있나: !!off, 줄숨김: off ? !!off.hidden : null,
      줄키: or2 ? Math.round(or2.height) : 0,
      줄글: off ? (off.innerText || '').replace(/\s+/g, ' ').trim() : '',
      단추키: brr ? Math.round(brr.height) : 0,
      띠단추: t ? (t.textContent || '').trim() : ''
    };
  });

  console.log('[1] ★★ 기본으로는 지도가 보인다');
  let A = await 열어재기(null, null);
  let a = await 재기(A.pg);
  is(a.띠키 >= 200, '  지도 띠가 <b>' + a.띠키 + 'px</b> (260px 쯤)');
  is(a.줄있나 && a.줄숨김 === true, '  ★ 숨김 안내는 <b>안 뜬다</b> — 헛말을 안 합니다 (8번)');
  await A.ctx.close();

  console.log('\n[2] ★★ 「목록만」 이면 그 자리에 왜 없는지 적힌다');
  let B = await 열어재기('list', null);
  let b2 = await 재기(B.pg);
  is(b2.띠키 <= 20, '  지도 띠가 <b>' + b2.띠키 + 'px</b> — 숨겨져 있습니다');
  is(b2.줄있나 && b2.줄숨김 === false && b2.줄키 >= 30,
    '  ★★ <b>왜 없는지 적힌다</b> — ' + b2.줄키 + 'px · 「' + b2.줄글 + '」');
  is(/지도/.test(b2.줄글) && /숨/.test(b2.줄글),
    '  ★ 글이 <b>지도를 숨겨 두었다</b>고 말한다');

  console.log('\n[3] ★★ 옛 열쇠(apexRouteMapOnV1=0)가 남아 있어도 같이 적힌다');
  let C = await 열어재기(null, '0');
  let c = await 재기(C.pg);
  is(c.띠키 <= 20, '  지도 띠가 <b>' + c.띠키 + 'px</b> — 옛 고름이 아직 지도를 끕니다');
  is(c.줄있나 && c.줄숨김 === false,
    '  ★★ <b>그때도 말한다</b> — 「' + c.줄글 + '」 (여기가 사장님 자리입니다)');
  await C.ctx.close();

  console.log('\n[4] ★★ 그 줄에서 바로 되돌아간다');
  const 되돌림 = await B.pg.evaluate(async () => {
    const off = document.getElementById('rtMapOff');
    const btn = off ? off.querySelector('button') : null;
    if (!btn) return { no: '되돌리는 단추가 없습니다' };
    btn.click();
    await new Promise(r => setTimeout(r, 700));
    const box = document.querySelector('.rt-mapbox');
    const o2 = document.getElementById('rtMapOff');
    return { 띠키: box ? Math.round(box.getBoundingClientRect().height) : -1,
             줄숨김: o2 ? !!o2.hidden : null,
             담은것: (function () { try { return localStorage.getItem('apexRouteViewV1'); } catch (e) { return '?'; } })() };
  });
  is(!되돌림.no && 되돌림.띠키 >= 200,
    '  ★★ <b>한 번 눌러 지도가 돌아온다</b> — ' + 되돌림.띠키 + 'px');
  is(되돌림.줄숨김 === true, '  ★ 돌아오면 그 줄은 <b>스스로 사라진다</b>');
  is(되돌림.담은것 === 'both', '  ★ 고름이 <b>담긴다</b> — 다시 열어도 지도가 섭니다 · ' + 되돌림.담은것);

  console.log('\n[5] ★ 되돌리는 자가 도구 띠의 그 단추와 같은 자다 (5번)');
  const 소스 = fs.readFileSync(path.join(ROOT, 'apex-route.js'), 'utf8');
  is(/q\("rtMapOffGo"\)\.onclick\s*=\s*mapToggle/.test(소스),
    '  ★ <b>mapToggle 하나</b>를 부른다 — 차례(RT_NEXT)를 여기서 또 적지 않았습니다');
  is(!/rtMapOffGo[\s\S]{0,200}RTVIEW\s*=/.test(소스),
    '  ★ 이 줄이 <b>제 손으로 고름을 바꾸지 않는다</b>');

  console.log('\n[6] ★ 누르는 것이 44px · 새 색을 안 만들었나');
  is(b2.단추키 >= 44, '  되돌리는 단추 <b>' + b2.단추키 + 'px</b> (44px 이상)');
  const 옷 = (소스.match(/"\.rt-mapoff[^"]*"/g) || []).join(' ');
  const 날색 = (옷.match(/#[0-9a-fA-F]{3,6}/g) || []);
  is(날색.length === 0, '  ★ <b>손으로 박은 색 0가지</b> — 이 파일이 이미 쓰는 이름만' +
    (날색.length ? (' ← ' + 날색.join(' ')) : ''));

  console.log('\n[7] ★ 조용한가');
  const 터 = [...new Set([].concat(B.터짐, C.터짐))];
  is(터.length === 0, '  터진 곳이 없다' + (터.length ? (' ← ' + 터.slice(0, 2).join(' / ')) : ''));

  await B.ctx.close();
  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 지도가 왜 없는지 화면이 말하지 않습니다')
                  : '✓ 지도를 숨겨 두면 그 자리에서 말하고, 한 번 눌러 돌아옵니다 (판 X481)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.message)); process.exit(2); });
