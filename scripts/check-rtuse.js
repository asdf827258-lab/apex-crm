/* 🗺️ 지역 동선을 <b>영업하면서</b> 쓸 수 있나 — 판 X272

   사장님 말씀 (2026-10-31) — 「지역동선 다시 테스트해 <b>이걸 영업하면서 쓸 수가
   없어</b>」. 무엇이 걸리시는지 여쭈니 둘을 고르셨습니다 —
     ㉠ 「<b>지도를 접기 — 목록이 창을 다 쓰게</b>」
     ㉡ 「지도 위에 선을 그리거나, <b>오늘 칸에서 예상 소요시간 정하고</b>,
         내 위치를 누르면 gps로 또는 내가 위치입력할수 있도록해」
   그리고 길에서 제일 많이 누르는 것으로 <b>🧭 내비 · 📋 멘트 · 💬 문자 ·
   📞 전화 넷 다</b> 를 꼽으셨습니다.

   ── 손대기 전에 <b>재어 본 것</b> (390×844 폰) ───────────────────────
     · 창 844px = 도구 띠 <b>149</b> + 지도 <b>334</b> + 목록 <b>361</b>
     · 그 목록 안에 든 글은 <b>4,329px — 열두 화면</b>. 한 사람을 보려고
       손가락을 열두 번 굴려야 했습니다.
     · 44px 아래 누를 곳이 동선 창에 <b>71곳</b> — 📞 전화·💬 문자·📍 동네·
       📋 멘트·약속 잡기가 전부 <b>32px</b>, 「주소 적기」 는 <b>28px</b>.
       db-crm.html 에는 손가락 바닥이 <b>아예 없었습니다</b>(min-height:44px
       가 한 곳뿐 · 본체는 99곳).
     · 📁 DB 관리 <b>167곳</b> · 🔔 오늘의 알림 <b>21곳</b> 도 같은 까닭.

   여기서 잽니다 —
     [1] 📱 폰에서 <b>목록이 창을 다 쓰나</b> · 지도는 접혀 있나 · 「🗺 지도」 가 서나
     [2] 🗺 누르면 <b>지도가 창을 다 쓰나</b> · 다시 누르면 돌아오나 · 기억하나
     [3] 👆 바닥이 덮는 자리(button·.btn·고르개·적는 칸)에 <b>44px 아래가 0</b> 인가
     [4] 👆 줄마다 <b>넷이 서고 다 44px</b> 인가 — 확정 약속 줄에도 📞·💬 가 서나
     [5] ⏱ 상담 분이 <b>그날 칸</b>에 서나 · 고치면 표가 따라오나 · 담기는 자리가 하나인가
     [6] 🖥️ 컴퓨터는 <b>그대로</b> 인가 — 단추는 안 서고, 목록·지도가 나란히
     [7] 🏠 출발지 — <b>GPS</b> 와 <b>직접 적기</b> 두 길이 다 있나 (사장님이 꼽으신 것)
     [8] 🛣 지도에 <b>선을 긋나</b> · 직선을 길이라 <b>안 하나</b> (1번)
     [9] 홈(오늘 칸)의 ⏱ 고르개가 <b>같은 자리</b>에 담나 — 두 곳에서 각자 담지 않나 (5번)

   ★ 견본 서버·날짜는 <b>check-rtplan 의 것을 그 파일에서 읽어</b> 씁니다 —
     두 벌 두지 않습니다 (5번). `${DAY}` 는 같은 날로 바꿔 넣습니다.
   ★ 시계를 <b>못 박습니다</b>(lib-clock) — 「오늘」 이 흐르면 자가 월말에만 웁니다 (8번).
   ★ 바깥(카카오·Supabase)은 끊습니다. 카카오 판이 안 뜨므로 [8] 은 <b>글로</b> 봅니다.
   ★ 견본 이름은 <b>홍길동</b> 집안입니다 (3번).                            */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const RTP = fs.readFileSync('scripts/check-rtplan.js', 'utf8');
const DAY = (RTP.match(/const DAY = '([\d-]+)'/) || [])[1] || '';
const STUB = ((RTP.match(/const STUB = `([\s\S]*?)`;\n/) || [])[1] || '')
  .replace(/\$\{DAY\}/g, DAY);

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 바닥이 <b>덮는 것들</b>만 셉니다 — 그래야 자가 제 할 일만 봅니다 (8번).
   ⚠ 글 속 링크(그냥 <a>)는 <b>일부러 뺍니다</b>: 카카오 저작자 표시처럼
     문장 안에 박힌 20px 글자를 44px 로 늘리면 그 줄이 통째로 벌어집니다.
     판 X266 에서 「원문 ↗」 를 두고 정한 그 선 그대로입니다.
   ⚠ 네모칸(checkbox)·동글이(radio)는 뺍니다 — 키가 아니라 제 크기가
     커져야 하는 것이고, 지금 13 → 20px 입니다(db-crm.html 쪽지).        */
const 바닥 = `(()=>{
  const T=s=>(s||'').replace(/\\s+/g,' ').trim();
  const 다 = [...document.querySelectorAll(
    'button,.btn,select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range])')];
  return 다.filter(e=>{ const q=e.getBoundingClientRect();
      return q.width>0 && q.height>0 && q.height<44 && getComputedStyle(e).display!=='none' })
    .map(e=>T(e.innerText||e.value||'').slice(0,16)+' '+Math.round(e.getBoundingClientRect().height)+'px');
})()`;

const 꼴 = `(()=>{
  const h=e=>e?Math.round(e.getBoundingClientRect().height):0;
  const 보임=e=>!!(e&&e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none');
  const w=document.getElementById('rtWrap'), side=document.getElementById('rtSide');
  return { 켜짐:!!(w&&w.classList.contains('rt-mapon')),
    이름:(document.getElementById('rtMapT')||{}).textContent||'',
    단추보임:보임(document.getElementById('rtMapT')),
    띠:h(document.querySelector('.rt-bar')), 몸:h(document.querySelector('.rt-body')),
    목록:h(side), 목록보임:보임(side), 지도:h(document.querySelector('.rt-mapbox')),
    목록안:side?Math.round(side.scrollHeight):0,
    옆넘침:Math.round(document.documentElement.scrollWidth-window.innerWidth) };
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

  const 열기 = async (W) => {
    const ctx = await br.newContext(Object.assign({}, CLK.ctxOpt(), { viewport: { width: W, height: 844 } }));
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
    /* 🏠 출발지를 심어 둡니다 — 없으면 「몇 시에 나서나」 줄이 안 서서
       스케줄표를 다 못 잽니다. 좌표는 순천입니다(견본과 같은 동네). */
    await pg.evaluate(() => {
      try {
        localStorage.setItem('apexRouteHomeV1', JSON.stringify({ label: '순천 사무실', lat: 34.94, lng: 127.48 }));
        localStorage.setItem('apexRouteStayV1', '60');
        localStorage.removeItem('apexRouteMapOnV1');
      } catch (e) {}
    });
    await pg.reload({ waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => { try { return (eval('dbs') || []).length > 0 } catch (e) { return false } }, { timeout: 30000 });
    await pg.evaluate(() => apexRouteOpen());
    await pg.waitForTimeout(600);
    await pg.evaluate(d => { const e = document.getElementById('rtDate'); if (e) { e.value = d; if (e.onchange) e.onchange() } }, DAY);
    await pg.waitForTimeout(1400);
    return { ctx, pg, errs };
  };

  head('[0] 견본을 check-rtplan 에서 읽었다 — 두 벌 두지 않는다 (5번)');
  is(!!DAY, '  날짜를 못 박았다 — ' + (DAY || '(못 읽음)'));
  is(STUB.length > 1500 && STUB.indexOf('${') < 0,
     '  견본 서버 ' + STUB.length + '자 · 안 바뀐 틀(${…})이 없다');

  head('[1] 📱 폰 — <b>목록이 창을 다 쓴다</b> (손대기 전 361px · 열두 화면)');
  const A = await 열기(390);
  let S = await A.pg.evaluate(꼴);
  is(S.단추보임, '  「🗺 지도」 단추가 폰에서 <b>선다</b> — 「' + S.이름 + '」');
  is(S.이름.indexOf('지도') >= 0, '  이름은 <b>누르면 가는 곳</b>이다 — 「' + S.이름 + '」');
  is(S.지도 === 0, '  지도는 <b>접혀 있다</b> — ' + S.지도 + 'px');
  is(S.목록 >= 600, '  목록이 <b>창을 다 쓴다</b> — ' + S.목록 + 'px (손대기 전 361px)');
  is(S.목록 >= S.몸 - 2, '  몸(' + S.몸 + 'px)을 <b>남기지 않는다</b> — 목록 ' + S.목록 + 'px');
  is(S.띠 <= 160, '  도구 띠 ' + S.띠 + 'px — 160px 안 (상담 분을 그날 칸으로 내려 자리를 받았다)');
  is(S.옆넘침 <= 1, '  가로로 안 넘친다 — ' + S.옆넘침 + 'px');
  is(S.목록안 / Math.max(1, S.목록) < 9,
     '  굴려야 하는 길이가 <b>' + (S.목록안 / Math.max(1, S.목록)).toFixed(1) + '화면</b> — 손대기 전 12.0화면');

  head('[2] 🗺 눌러 지도로 · 📋 눌러 목록으로 · 닫고 열어도 기억한다');
  await A.pg.click('#rtMapT'); await A.pg.waitForTimeout(400);
  S = await A.pg.evaluate(꼴);
  is(S.켜짐 && !S.목록보임, '  목록이 비켜 준다 — 틀에 rt-mapon 이 붙는다');
  is(S.지도 >= 600, '  지도가 <b>창을 다 쓴다</b> — ' + S.지도 + 'px (손대기 전 334px)');
  is(S.이름.indexOf('목록') >= 0, '  단추가 <b>돌아갈 곳</b>을 적는다 — 「' + S.이름 + '」');
  await A.pg.click('#rtMapT'); await A.pg.waitForTimeout(400);
  S = await A.pg.evaluate(꼴);
  is(!S.켜짐 && S.목록 >= 600 && S.지도 === 0,
     '  다시 누르면 <b>목록으로 돌아온다</b> — 목록 ' + S.목록 + 'px · 지도 ' + S.지도 + 'px');
  await A.pg.click('#rtMapT'); await A.pg.waitForTimeout(250);
  await A.pg.evaluate(() => { document.getElementById('rtX').click() });
  await A.pg.waitForTimeout(200);
  await A.pg.evaluate(() => apexRouteOpen());
  await A.pg.waitForTimeout(700);
  S = await A.pg.evaluate(꼴);
  is(S.켜짐, '  닫고 다시 열어도 <b>고르신 쪽</b>이 선다 (이 브라우저에만 남는다 · 7번)');
  await A.pg.evaluate(() => { document.getElementById('rtMapT').click() });
  await A.pg.waitForTimeout(350);

  head('[3] 👆 바닥이 덮는 자리에 <b>44px 아래가 없다</b> (손대기 전 71곳)');
  const L1 = await A.pg.evaluate(바닥);
  is(L1.length === 0, '  동선 창 — ' + L1.length + '곳' + (L1.length ? ' ⚠ ' + L1.slice(0, 6).join(' / ') : ''));

  head('[4] 👆 줄마다 <b>넷</b>이 서고 다 44px — 사장님이 꼽으신 그 넷');
  const B4 = await A.pg.evaluate(() => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    const 긁기 = sel => [...document.querySelectorAll(sel)].map(r =>
      [...r.querySelectorAll('.rt-act>.btn,.rt-act>button')]
        .filter(e => e.getBoundingClientRect().height > 0)
        .map(e => ({ t: T(e.innerText), h: Math.round(e.getBoundingClientRect().height) })));
    return { 후보: 긁기('#rtSide .rt-row'), 확정: 긁기('#rtSide .rt-stop') };
  });
  const 넷 = (rows) => rows.filter(b => b.length &&
    b.some(x => /전화/.test(x.t)) && b.some(x => /문자/.test(x.t)) &&
    b.some(x => /내비|동네/.test(x.t)));
  is(B4.후보.length >= 1, '  <b>가는 김에</b> 후보 줄이 ' + B4.후보.length + '개 선다');
  is(B4.후보.every(b => b.some(x => /멘트/.test(x.t))), '  줄마다 <b>📋 멘트</b>가 있다');
  is(넷(B4.후보).length === B4.후보.length,
     '  줄마다 <b>📞 전화 · 💬 문자 · 🧭 내비(또는 📍 동네)</b> 가 다 있다 — ' +
     넷(B4.후보).length + '/' + B4.후보.length);
  const 모든 = [].concat.apply([], B4.후보.concat(B4.확정));
  is(모든.length > 0 && 모든.every(x => x.h >= 44),
     '  그 단추 ' + 모든.length + '개가 <b>다 44px 이상</b>이다 — ' +
     [...new Set(모든.map(x => x.h))].sort((a, b) => a - b).join(' · ') + 'px (손대기 전 32px)');
  is(B4.확정.length >= 1, '  <b>확정 약속</b> 줄이 ' + B4.확정.length + '개 선다');
  is(넷(B4.확정).length === B4.확정.length,
     '  ★ 확정 약속 줄에도 <b>📞 전화 · 💬 문자</b> 가 선다 — ' + 넷(B4.확정).length + '/' + B4.확정.length +
     ' (길에서 「5분 늦습니다」 를 보내려고 명단 창으로 나가지 않는다)');
  const 문자 = await A.pg.evaluate(() => {
    const a = [...document.querySelectorAll('#rtSide .rt-stop .rt-act a[href^="sms:"]')][0];
    return a ? a.getAttribute('href') : '';
  });
  is(/^sms:\d+\?body=$/.test(문자),
     '  ★ 확정 약속의 문자에는 <b>글을 지어 넣지 않는다</b> (1번) — 「' + 문자 + '」');

  head('[5] ⏱ 상담 분이 <b>그날 칸</b>에 선다 — 사장님 「오늘 칸에서 예상 소요시간 정하고」');
  const C1 = await A.pg.evaluate(() => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    const sel = document.getElementById('rtStay'), box = document.querySelector('.rt-stay');
    const sc = [...document.querySelectorAll('.rt-sc')].map(x => T(x.innerText));
    return { 섰나: !!box, 띠안: !!(sel && sel.closest('.rt-bar')), 값: sel ? sel.value : '',
             키: sel ? Math.round(sel.getBoundingClientRect().height) : 0,
             첫: sc.filter(t => /~/.test(t))[0] || '', 글: box ? T(box.innerText) : '' };
  });
  is(C1.섰나, '  ⏱ 상담 분 칸이 <b>그날 칸</b>에 선다');
  is(!C1.띠안, '  위 도구 띠에는 <b>없다</b> — 옮긴 것이고 두 벌이 아니다 (5번)');
  is(C1.값 === '60' && C1.키 >= 44, '  지금 ' + C1.값 + '분 · ' + C1.키 + 'px');
  is(/상담 끝 시각/.test(C1.글), '  <b>무엇에 쓰는 수</b>인지 그 자리에 적는다');
  is(/10:00 ~ 11:00/.test(C1.첫) && /상담 60분/.test(C1.첫),
     '  표의 첫 상담이 <b>10:00 ~ 11:00 · 상담 60분</b> 이다 — 「' + C1.첫.slice(0, 44) + '」');
  await A.pg.selectOption('#rtStay', '30');
  await A.pg.waitForTimeout(1100);
  const C2 = await A.pg.evaluate(() => {
    const T = s => (s || '').replace(/\s+/g, ' ').trim();
    const sc = [...document.querySelectorAll('.rt-sc')].map(x => T(x.innerText));
    return { 값: (document.getElementById('rtStay') || {}).value,
             첫: sc.filter(t => /~/.test(t))[0] || '',
             담긴: localStorage.getItem('apexRouteStayV1'),
             문: typeof window.apexRouteStay === 'function' ? window.apexRouteStay() : null };
  });
  is(C2.값 === '30', '  30분으로 고르면 칸도 30분으로 남는다');
  is(/10:00 ~ 10:30/.test(C2.첫) && /상담 30분/.test(C2.첫),
     '  표가 <b>따라온다</b> — 「' + C2.첫.slice(0, 44) + '」 (60분이면 11:00 이었다)');
  is(C2.담긴 === '30', '  이 브라우저에 담긴다 — ' + C2.담긴 + ' (서버를 안 부른다 · 7번)');
  is(C2.문 === 30, '  홈이 부르는 문(window.apexRouteStay)이 <b>같은 수</b>를 답한다 — ' + C2.문);
  is(!A.errs.length, '  조용히 터진 곳이 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));
  const 주민 = await A.pg.evaluate(() => /\d{6}\s*-\s*\d{7}/.test(document.body.innerText));
  is(!주민, '  주민등록번호 꼴이 <b>한 곳도 없다</b> (3번)');
  await A.ctx.close();

  head('[6] 🖥️ 컴퓨터는 <b>그대로</b> — 단추는 안 서고, 목록·지도가 나란히');
  const B = await 열기(1280);
  const D = await B.pg.evaluate(꼴);
  is(!D.단추보임, '  「🗺 지도」 단추가 컴퓨터에서는 <b>안 선다</b> — 거기서는 정말 할 일이 없다 (6번)');
  is(D.목록보임 && D.지도 >= 600,
     '  목록과 지도가 <b>나란히</b> 선다 — 목록 ' + D.목록 + 'px · 지도 ' + D.지도 + 'px');
  is(D.띠 <= 70, '  도구 띠 한 줄 — ' + D.띠 + 'px');
  const L2 = await B.pg.evaluate(바닥);
  is(L2.length === 0, '  컴퓨터에서도 44px 아래가 — ' + L2.length + '곳' + (L2.length ? ' ⚠ ' + L2.slice(0, 6).join(' / ') : ''));
  is(!B.errs.length, '  조용히 터진 곳이 없다' + (B.errs.length ? ' — ' + B.errs[0] : ''));
  await B.ctx.close();
  await br.close(); srv.close();

  /* ── 글로 보는 것 — 카카오 판이 CI 에서 안 뜨는 자리입니다 ────────── */
  const RT = fs.readFileSync('apex-route.js', 'utf8');
  const APP = fs.readFileSync('app/index.html', 'utf8');

  head('[7] 🏠 출발지 — <b>GPS</b> 와 <b>직접 적기</b> 두 길이 다 있다');
  is(/navigator\.geolocation/.test(RT) && /getCurrentPosition/.test(RT),
     '  📍 지금 내 자리 — 폰에게 좌표를 묻는 길이 있다');
  is(/rtHomeGps/.test(RT) && /rtHomeAddr/.test(RT),
     '  단추가 <b>둘</b>이다 — 「📍 지금 내 자리로」 · 「✏️ 주소로 적기」');
  is(/err&&err\.code===1/.test(RT) && /err&&err\.code===3/.test(RT),
     '  안 될 때 <b>왜 안 되는지 갈라서</b> 말한다 (허락 안 함 · 너무 오래 걸림) (1번)');
  is(/function homeSave\(/.test(RT) && (RT.match(/localStorage\.setItem\("apexRouteHomeV1"/g) || []).length === 1,
     '  출발지를 <b>쓰는 곳이 하나</b>다 (homeSave) (5번)');

  head('[8] 🛣 지도에 <b>선을 긋는다</b> · 직선을 길이라 안 한다 (1번)');
  is(/new kakao\.maps\.Polyline/.test(RT), '  동선을 <b>선으로</b> 잇는다 (Polyline)');
  is(/rkPath\(/.test(RT), '  구간마다 <b>받아 둔 길 좌표</b>가 있으면 그 길로 긋는다');
  is(/직선\(어림\)|직선/.test(RT) && /rtLineSrc/.test(RT),
     '  길 몇 구간 · 직선 몇 구간인지 <b>화면에 적는다</b> — 직선을 길이라 말하지 않는다');
  is(/LASTB/.test(RT) && /MAP\.relayout\(\)/.test(RT),
     '  접었던 지도를 펴면 <b>그 자리로</b> 돌려놓는다 (relayout · 담아 둔 테두리)');

  head('[9] 홈(오늘 칸)의 ⏱ 고르개가 <b>같은 자리</b>에 담는다 (5번)');
  is(/function hmRtStayHtml\(/.test(APP) && /hmRtStayHtml\(\)\+/.test(APP),
     '  홈 「🚗 오늘 어디로 가시나」 머리줄에 ⏱ 고르개가 선다');
  is((APP.match(/localStorage\.setItem\('apexRouteStayV1'/g) || []).length === 1,
     '  홈이 그 수를 <b>담는 줄이 하나</b>다 (hmRtStaySet)');
  is(/contentWindow\.apexRouteStay/.test(APP),
     '  틀이 떠 있으면 <b>그쪽 문</b>으로 넣는다 — 열려 있던 표가 그 자리에서 다시 짜인다');
  is(!/apexRouteStayV2|hmStayV1|apexStay/.test(APP),
     '  홈이 <b>제 칸을 따로 두지 않았다</b> — 두 곳에서 각자 담으면 하루가 두 벌이 된다');
  is((RT.match(/localStorage\.setItem\("apexRouteStayV1"/g) || []).length === 1 && /function stayPut\(/.test(RT),
     '  동선 창도 <b>담는 문이 하나</b>다 (stayPut)');

  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ 빨간불 ' + bad + '곳 — 지역 동선을 영업 중에 못 씁니다'); process.exit(1); }
  console.log('✓ 폰에서 목록이 창을 다 쓰고, 누르는 자리는 다 44px 이고, 상담 분은 그날 칸에서 고칩니다.');
})();
