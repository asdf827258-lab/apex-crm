/* 🧑 담당자 칸이 <b>자료를 따라오나</b> · 지역만 골라도 추천이 뜨나 — 판 X274

   사장님 말씀 (2026-10-31) — 「<b>담당자가 안나오고</b>, 지역만 정해도
   추천해서 알려줘」.

   ── 재어 본 것 ──────────────────────────────────────────────────────
   ⚠ <b>자료가 아니라 때</b> 였습니다. 사장님 서버에는 담당자 <b>37명</b> ·
     고객 <b>1,943명</b> · 통화 <b>2,026건</b> 이 멀쩡히 있습니다(수만 셌습니다 ·
     3번). 그런데 칸을 채우는 fillPickers() 는 <b>창을 열 때 딱 한 번</b>
     돌았습니다 — 1,943명을 다 읽기 전에 열면 담당자 칸이 「담당자 전체」
     하나로 굳고, 자료가 온 뒤에도 <b>영영 안 채워졌습니다.</b>
     손으로 재니 <b>열 때 1개 · 자료 온 뒤에도 1개</b> 였습니다.
     시(市) 고르개도 같은 자리라, 그날은 <b>지역도 못 고릅니다.</b>

   여기서 잽니다 —
     [1] 자료가 다 온 뒤 열면 담당자가 <b>다 나오나</b>
     [2] ★ 자료가 <b>늦게</b> 와도 칸이 <b>채워지나</b> (이 판의 핵심)
     [3] 아직 못 읽었으면 <b>그렇다고 적나</b> — 조용히 빈 칸을 두지 않나 (1번)
     [4] <b>손으로 고른 담당자</b>가 다시 그려도 그대로 있나 — 몰래 안 바뀌나 (1번)
     [5] ★ <b>지역만 골라도</b> 추천(🎯 미션 카드 · 후보 줄)이 서나
     [6] 「담당자 전체」 로 볼 때 <b>누구 고객인지</b> 줄마다 적나 — 남의 고객에게
         걸지 않게 (1번). 한 사람만 볼 때는 되풀이해 안 적나
     [7] 기다림에 <b>끝</b>이 있나 (4-1번 「모든 기다림에는 시간 제한」)

   ★ 견본·날짜는 <b>check-rtplan 에서 읽어</b> 씁니다 — 두 벌 두지 않습니다 (5번).
     팀원 셋을 더해 「담당자가 여럿인 꼴」 을 만듭니다.
   ★ 바깥(카카오·Supabase)은 끊습니다. 견본 이름은 <b>홍길동</b> 집안입니다 (3번).
   ★ <b>사장님 진짜 서버를 안 읽습니다</b>. */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const RTP = fs.readFileSync('scripts/check-rtplan.js', 'utf8');
const DAY = (RTP.match(/const DAY = '([\d-]+)'/) || [])[1] || '';
const STUB = ((RTP.match(/const STUB = `([\s\S]*?)`;\n/) || [])[1] || '')
  .replace(/\$\{DAY\}/g, DAY)
  .replace("var T={profiles:[{id:'u1',name:'홍길동',role:'admin',active:true}],",
           "var T={profiles:[{id:'u1',name:'홍길동',role:'admin',active:true}," +
           "{id:'u2',name:'홍길순',role:'member',active:true}," +
           "{id:'u3',name:'홍갑돌',role:'member',active:true}],");

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

const 담당 = `(()=>{
  const s=document.getElementById('rtOwner');
  return { 수:s?s.options.length:-1,
    목록:s?[...s.options].map(o=>o.text).join(' · '):'(칸 없음)',
    지금:s?s.value:'' };
})()`;

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
  const ctx = await br.newContext(Object.assign({}, CLK.ctxOpt(), { viewport: { width: 390, height: 844 } }));
  await CLK.pin(ctx, 14);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e).slice(0, 140)));
  await ctx.route('**://**', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
    if (/route-km/.test(u)) return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"why":"NOKEY"}' });
    if (/kakao\.com/.test(u)) return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) return r.abort();
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + '/db-crm.html?mig=1&me=u1', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });

  head('[0] 견본을 check-rtplan 에서 읽었다 (5번)');
  is(!!DAY && STUB.length > 1500 && STUB.indexOf('${') < 0,
     '  날짜 ' + DAY + ' · 견본 ' + STUB.length + '자 · 안 바뀐 틀이 없다');
  is(/홍길순/.test(STUB) && /홍갑돌/.test(STUB), '  담당자를 <b>셋</b>으로 늘려 두었다 — 하나면 「여럿이 나오나」 를 못 잰다');

  head('[1] 자료가 다 온 뒤 열면 담당자가 <b>다 나온다</b>');
  await pg.evaluate(() => apexRouteOpen());
  await pg.waitForTimeout(900);
  const A = await pg.evaluate(담당);
  is(A.수 === 4, '  담당자 칸 ' + A.수 + '개 — ' + A.목록);

  head('[2] ★ 자료가 <b>늦게</b> 와도 칸이 채워진다 — 이 판의 핵심');
  /* ⚠ <b>진짜로 일어나는 꼴</b>로 흉내 냅니다 — 고객 1,943명을 다 읽기 전에
     창을 여는 때입니다. 그때 틀은 「아직」 이라고 답합니다(apexCrmReady).
     ★ 처음에 profiles 만 비웠더니 틀은 「다 읽었다」 고 답해서, 기다리는
       자가 깨어날 까닭이 없었습니다 — <b>자가 틀렸던 것</b>입니다. 일어나지
       않는 일을 고발하면 그 자는 헛것입니다 (8번).                      */
  await pg.evaluate(() => { document.getElementById('rtX').click() });
  await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    window.__ready = false;
    window.__realReady = window.apexCrmReady;
    window.apexCrmReady = function () { return !!window.__ready };
    const P = eval('profiles'); window.__keep = P.slice(); P.length = 0;
  });
  await pg.evaluate(() => apexRouteOpen());
  await pg.waitForTimeout(800);
  const B = await pg.evaluate(담당);
  is(B.수 === 1, '  열 때는 비어 있다 — ' + B.수 + '개 (자료가 아직 안 왔으니 맞다)');
  const 쪽지 = await pg.evaluate(() => {
    const t = (document.getElementById('rtSide') || {}).innerText || '';
    return t.replace(/\s+/g, ' ').trim();
  });
  is(/아직 다 못 읽었습니다/.test(쪽지),
     '  [3] 읽는 중이라고 <b>화면이 말한다</b> — 조용히 빈 칸을 두지 않는다 (1번)');
  is(/담당자/.test(쪽지) && /채워집니다/.test(쪽지), '  무엇이 채워지는지도 적는다');
  /* 자료가 도착했습니다 — 틀도 「다 읽었다」 로 바뀝니다 */
  await pg.evaluate(() => {
    const P = eval('profiles');
    (window.__keep || []).forEach(x => P.push(x));
    window.__ready = true;
  });
  await pg.waitForTimeout(1400);          /* waitData 가 <b>스스로</b> 다시 그릴 때까지 */
  const C = await pg.evaluate(담당);
  is(C.수 === 4, '  ★ 자료가 오면 <b>스스로 채워진다</b> — ' + C.수 + '개 · ' + C.목록 +
     ' (손대기 전에는 영영 1개였습니다)');

  head('[4] <b>손으로 고른 담당자</b>가 다시 그려도 그대로 있다 (1번)');
  await pg.evaluate(() => { const o = document.getElementById('rtOwner'); o.value = 'u2'; o.dispatchEvent(new Event('change')) });
  await pg.waitForTimeout(700);
  const D1 = await pg.evaluate(담당);
  await pg.evaluate(() => { const e = document.getElementById('rtRegion'); e.dispatchEvent(new Event('change')) });
  await pg.waitForTimeout(700);
  const D2 = await pg.evaluate(담당);
  is(D1.지금 === 'u2' && D2.지금 === 'u2', '  홍길순을 골랐더니 그대로다 — ' + D1.지금 + ' → ' + D2.지금);
  /* 「담당자 전체」 를 고르면 제 이름으로 안 되돌아가나 — MINE_N 이 0 이 아닌 꼴 */
  await pg.evaluate(() => { const o = document.getElementById('rtOwner'); o.value = ''; o.dispatchEvent(new Event('change')) });
  await pg.waitForTimeout(700);
  await pg.evaluate(() => { const e = document.getElementById('rtRegion'); e.dispatchEvent(new Event('change')) });
  await pg.waitForTimeout(700);
  const D3 = await pg.evaluate(담당);
  is(D3.지금 === '', '  ★ 「담당자 전체」 를 고르면 <b>그대로 전체</b>다 — 몰래 제 이름으로 안 돌아간다');

  head('[5] ★ <b>지역만 골라도</b> 추천이 선다 — 사장님 말씀 그대로');
  await pg.evaluate(d => { const e = document.getElementById('rtDate'); e.value = d; e.dispatchEvent(new Event('change')) }, DAY);
  await pg.waitForTimeout(900);
  await pg.evaluate(() => {
    const s = document.getElementById('rtRegion');
    const o = [...s.options].find(x => x.value && x.value.indexOf('모름') < 0);
    if (o) { s.value = o.value; s.dispatchEvent(new Event('change')) }
  });
  await pg.waitForTimeout(1300);
  const R = await pg.evaluate(() => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    const m = document.querySelector('#rtSide .rt-miss');
    return { 담당: (document.getElementById('rtOwner') || {}).value,
             시: (document.getElementById('rtRegion') || {}).value,
             미션: !!m, 글: m ? T(m.innerText) : '',
             후보: document.querySelectorAll('#rtSide .rt-row').length,
             다음: (m && m.querySelector('[data-mgo]')) ? T(m.querySelector('[data-mgo]').innerText) : '',
             임자: [...document.querySelectorAll('#rtSide .rt-row .rt-own')].map(x => T(x.innerText)),
             팀쪽지: T((document.getElementById('rtSide') || {}).innerText || '').indexOf('팀 전체를 보고 있습니다') >= 0 };
  });
  is(R.담당 === '' && !!R.시, '  담당자는 <b>전체</b>, 시는 「' + R.시 + '」 만 골랐다');
  is(R.미션, '  🎯 미션 카드가 <b>선다</b>');
  is(new RegExp(R.시).test(R.글), '  그 카드가 <b>고른 시 이름</b>을 적는다 — 「' + R.글.slice(0, 40) + '」');
  is(R.후보 >= 1, '  걸 분이 <b>' + R.후보 + '명</b> 선다');
  is(/다음 →/.test(R.다음), '  <b>다음은 누구</b>인지 알려 준다 — ' + R.다음);

  head('[6] 「담당자 전체」 로 볼 때 <b>누구 고객인지</b> 적는다 (1번)');
  is(R.팀쪽지, '  <b>팀 전체를 보고 있다</b>고 적는다');
  is(R.임자.length === R.후보 && R.후보 > 0,
     '  줄마다 담당자가 붙는다 — ' + R.임자.length + '/' + R.후보 + ' · ' + R.임자.join(' · '));
  is(R.임자.every(t => /고객|모름|배정 안 됨/.test(t)),
     '  못 찾으면 <b>모른다고</b> 적는다 — 지어내지 않는다 (1번)');
  /* 한 사람만 볼 때는 되풀이해 안 적는다 */
  await pg.evaluate(() => { const o = document.getElementById('rtOwner'); o.value = 'u1'; o.dispatchEvent(new Event('change')) });
  await pg.waitForTimeout(1100);
  const E1 = await pg.evaluate(() => ({
    임자: document.querySelectorAll('#rtSide .rt-row .rt-own').length,
    후보: document.querySelectorAll('#rtSide .rt-row').length,
    팀쪽지: ((document.getElementById('rtSide') || {}).innerText || '').indexOf('팀 전체를 보고 있습니다') >= 0 }));
  is(E1.임자 === 0, '  한 사람만 볼 때는 <b>안 적는다</b> — ' + E1.임자 + '개 (같은 말을 줄마다 되풀이하면 이름이 묻힙니다)');
  is(!E1.팀쪽지, '  팀 쪽지도 사라진다');

  head('[7] 기다림에 <b>끝</b>이 있다 (4-1번)');
  const SRC = fs.readFileSync('apex-route.js', 'utf8');
  is(/function waitData\(/.test(SRC) && /\+\+n>\d+/.test(SRC),
     '  기다리는 자에 <b>셈이 있다</b> — 영원히 안 돈다');
  is(/classList\.contains\("on"\)/.test(SRC.slice(SRC.indexOf('function waitData('), SRC.indexOf('function stayPut('))),
     '  창이 닫히면 <b>그만둔다</b> — 안 보는 화면을 되풀이해 안 그린다 (7번)');
  is(/function crmReady\(/.test(SRC) && (SRC.match(/function crmReady\(/g) || []).length === 1,
     '  「다 읽었나」 를 묻는 곳이 <b>하나</b>다 (5번)');
  is(/apexCrmReady/.test(SRC), '  틀이 제 입으로 답하게 묻는다 — 여기서 다시 세지 않는다 (5번)');
  is((SRC.match(/function ownName\(/g) || []).length === 1,
     '  담당자 이름을 찾는 곳도 <b>하나</b>다 (5번)');
  is(!errs.length, '  조용히 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));
  const 주민 = await pg.evaluate(() => /\d{6}\s*-\s*\d{7}/.test(document.body.innerText));
  is(!주민, '  주민등록번호 꼴이 한 곳도 없다 (3번)');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 담당자 칸이 자료를 따라오고, 지역만 골라도 추천이 섭니다.');
})();
