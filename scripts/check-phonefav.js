/* 폰에 담기 · 즐겨찾기 · 메뉴 찾기.

   메뉴가 88칸인데 찾는 길이 「훑어보기」 하나뿐이었다. 분류는 이미 잘 돼
   있다 — 열세 그룹, 가장 큰 그룹도 열 칸. 모자란 것은 분류가 아니라 지름길이다.

   여기서 보는 것
     1. 폰 홈 화면에 담을 채비가 됐는가 (manifest · 아이콘 · 애플 표기)
     2. 아이콘을 눌렀을 때 그 화면부터 열리는가 (?go=crm)
     3. 별표를 누르면 맨 위로 올라오는가 · 다시 누르면 내려가는가
     4. 사람마다 따로 남는가 · 서버로 안 나가는가
     5. 이름·초성으로 찾아지는가                                        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8853;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

(async () => {
  /* ══ [1] 폰에 담을 채비 ═════════════════════════════════════ */
  console.log('\n[1] 폰 홈 화면에 담을 채비');
  const mf = JSON.parse(fs.readFileSync('app/manifest.webmanifest', 'utf8'));
  ok(mf.name && mf.short_name, '이름과 짧은 이름이 있다 — ' + mf.short_name);
  ok(mf.display === 'standalone', '주소창 없이 열린다 (standalone)');
  ok(/^#/.test(mf.theme_color || '') && /^#/.test(mf.background_color || ''), '색이 정해져 있다');
  ok((mf.icons || []).length >= 3, '아이콘이 셋 이상이다 (' + (mf.icons || []).length + ')');
  ok((mf.icons || []).some(i => i.sizes === '192x192'), '192 아이콘이 있다');
  ok((mf.icons || []).some(i => i.sizes === '512x512' && i.purpose === 'any'), '512 아이콘이 있다');
  ok((mf.icons || []).some(i => i.purpose === 'maskable'),
    '안드로이드용 maskable 아이콘이 있다 — 없으면 아이콘이 잘려 나온다');
  (mf.icons || []).forEach(i =>
    ok(fs.existsSync(path.join('app', i.src)), '  파일이 실제로 있다 — ' + i.src));

  console.log('\n[2] DB CRM · TFA 를 따로 담을 수 있다');
  const sc = mf.shortcuts || [];
  ok(sc.length >= 2, '바로가기가 둘 이상이다 (' + sc.length + ')');
  ok(sc.some(x => /crm/.test(x.url)), 'DB 통합 CRM 바로가기가 있다');
  ok(sc.some(x => /airep/.test(x.url)), 'TFA 업무관리 바로가기가 있다');
  sc.forEach(x => ok(/^\.\/\?go=[a-z_]+$/.test(x.url), '  주소 모양이 맞다 — ' + x.url));

  const html = fs.readFileSync('app/index.html', 'utf8').slice(0, 4000);
  ok(/<link rel="manifest" href="manifest\.webmanifest"/.test(html), 'manifest 를 머리말에서 부른다');
  ok(/apple-touch-icon/.test(html), '아이폰용 아이콘 표기가 있다');
  ok(/apple-mobile-web-app-capable/.test(html), '아이폰에서도 앱처럼 열리게 적어 뒀다');
  ok(/name="theme-color"/.test(html), '주소창 색이 정해져 있다');

  /* ══ 앱 안에서 ══════════════════════════════════════════════ */
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  console.log('\n[3] 아이콘을 누르면 그 화면부터 열린다');
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html?go=crm', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  let r = await page.evaluate(() => ({ boot: bootTab(), body: document.body.className }));
  ok(r.boot === 'crm', '?go=crm 으로 들어오면 DB 통합 CRM 부터 연다 — ' + r.boot);

  r = await page.evaluate(() => {
    const q = location.search;
    history.replaceState(null, '', location.pathname + '?go=airep');
    const a = bootTab();
    history.replaceState(null, '', location.pathname + '#clients');
    const b = bootTab();
    history.replaceState(null, '', location.pathname + q);
    return { a, b };
  });
  ok(r.a === 'airep', '?go=airep 은 TFA 업무관리를 연다');
  ok(r.b === 'clients', '예전 방식(#clients)도 그대로 된다 — 없애지 않았다');

  /* ══ [4] 즐겨찾기 ═══════════════════════════════════════════ */
  console.log('\n[4] 별표를 누르면 맨 위로 올라온다');
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'me', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'me' } };
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    try { localStorage.clear(); } catch (e) { }
    renderNav();
  });

  r = await page.evaluate(() => ({
    stars: document.querySelectorAll('#navHost .nav-star').length,
    items: document.querySelectorAll('#navHost .tab-btn').length,
    empty: !!document.querySelector('#navHost .nav-pin.empty'),
    find: !!document.getElementById('navFind')
  }));
  ok(r.find, '메뉴 찾기 칸이 있다');
  ok(r.stars >= 70, '칸마다 별표가 붙는다 (' + r.stars + '개)');
  ok(r.stars === r.items, '별표가 없는 칸은 없다 (' + r.stars + '/' + r.items + ')');
  ok(r.empty, '즐겨찾기가 비면 어떻게 하는지 알려 준다');

  r = await page.evaluate(() => {
    navFavToggle('crm'); navFavToggle('airep');
    const pin = document.querySelector('#navHost .nav-pin:not(.empty):not(.rec)');
    return {
      saved: JSON.parse(localStorage.getItem('apex_nav_fav_me') || '[]'),
      top: pin ? Array.prototype.map.call(pin.querySelectorAll('.tt'), e => e.textContent) : [],
      msg: (window.__toast || []).slice(-1)[0] || ''
    };
  });
  ok(r.saved.length === 2, '별표한 둘이 저장된다');
  ok(r.top.join(',') === 'TFA 업무관리,DB 통합 CRM',
    '나중에 누른 것이 맨 위로 — ' + r.top.join(' · '));
  ok(/즐겨찾기 맨 위/.test(r.msg), '올렸다고 말해 준다');

  r = await page.evaluate(() => {
    navFavToggle('crm');
    const pin = document.querySelector('#navHost .nav-pin:not(.empty):not(.rec)');
    return {
      saved: JSON.parse(localStorage.getItem('apex_nav_fav_me') || '[]'),
      top: pin ? Array.prototype.map.call(pin.querySelectorAll('.tt'), e => e.textContent) : [],
      msg: (window.__toast || []).slice(-1)[0] || ''
    };
  });
  ok(r.saved.length === 1 && r.saved[0] === 'airep', '다시 누르면 내려간다');
  ok(r.top.join(',') === 'TFA 업무관리', '맨 위에서도 빠진다');
  ok(/뺐습니다/.test(r.msg), '뺐다고 말해 준다 — ' + r.msg);

  console.log('\n[5] 사람마다 따로 · 서버로 안 나간다');
  r = await page.evaluate(() => {
    const mine = JSON.parse(localStorage.getItem('apex_nav_fav_me') || '[]');
    OS.profile = { id: 'p2', name: '홍길동', role: 'member' };
    renderNav();
    const other = navFav();
    OS.profile = { id: 'me', name: '점검', role: 'owner', plan: 'vip' };
    renderNav();
    return { mine: mine.length, other: other.length, back: navFav().length,
             keys: Object.keys(localStorage).filter(k => /apex_nav/.test(k)) };
  });
  ok(r.mine === 1 && r.other === 0, '다른 사람에게는 내 즐겨찾기가 안 보인다');
  ok(r.back === 1, '돌아오면 내 것이 그대로 있다');
  ok(r.keys.every(k => /^apex_nav_(fav|rec)_/.test(k)), '이 기기에만 남는다 — ' + r.keys.join(', '));

  console.log('\n[6] 최근 쓴 것');
  r = await page.evaluate(() => {
    navRecAdd('bojang'); navRecAdd('finance'); navRecAdd('home'); navRecAdd('bojang');
    return { rec: navRec() };
  });
  ok(r.rec[0] === 'bojang', '방금 연 것이 맨 앞으로 — ' + r.rec.join(', '));
  ok(r.rec.filter(x => x === 'bojang').length === 1, '같은 것을 두 번 세지 않는다');
  ok(r.rec.indexOf('home') < 0, '홈은 안 넣는다 — 늘 위에 있어서 자리만 먹는다');

  console.log('\n[7] 이름·초성으로 찾는다');
  r = await page.evaluate(() => {
    navFind('고객');
    const a = Array.prototype.map.call(document.querySelectorAll('#navHost .nav-group-items .tt'), e => e.textContent);
    navFind('ㄱㄱ');
    const b = Array.prototype.map.call(document.querySelectorAll('#navHost .nav-group-items .tt'), e => e.textContent);
    navFind('없는메뉴이름xyz');
    const none = !!document.querySelector('#navHost .nav-none');
    const pinGone = !document.querySelector('#navHost .nav-pin');
    navFind('');
    const back = document.querySelectorAll('#navHost .tab-btn').length;
    return { a, b, none, pinGone, back };
  });
  ok(r.a.some(x => /고객 365일/.test(x)), '이름으로 찾힌다 — ' + r.a.slice(0, 3).join(' · '));
  ok(r.a.length < 88, '찾으면 걸린 것만 남는다 (' + r.a.length + '칸)');
  ok(r.b.some(x => /고객 365일/.test(x)), '초성(ㄱㄱ)으로도 찾힌다');
  ok(r.none, '못 찾으면 못 찾았다고 말한다');
  ok(r.pinGone, '찾는 중에는 즐겨찾기를 접어 둔다 — 찾는 것만 보이게');
  ok(r.back >= 80, '지우면 다시 다 보인다 (' + r.back + '칸)');


  console.log('\n[7-2] 오타를 쳐도 찾힌다');
  /* 「메뉴 찾기에서 자꾸 오타가 난다」 — 못 찾던 이유는 셋이었다.
       ① 한/영 키를 안 바꾸고 쳤다 (고객 → rhro)
       ② 치는 중이라 글자가 덜 됐다 (보장 → 보자)
       ③ 한 글자를 틀렸다 (보장분석 → 보징분석)
     자모로 풀어서 견주면 ①②가 한 자리에서 풀리고, ③ 은 아무것도 못
     찾았을 때만 봐 준다 — 처음부터 넓게 잡으면 엉뚱한 메뉴가 올라온다. */
  const typo = await page.evaluate(() => {
    const all = [];
    TABS.forEach(g => g.items.forEach(i => all.push(i)));
    const hit = q => {
      let n = 0;
      all.forEach(i => { if (navHit(i, q, false)) n++; });
      const loose = (n === 0);
      const names = all.filter(i => navHit(i, q, loose)).map(i => i.title);
      return { n: names.length, loose: loose, names: names };
    };
    return {
      n: all.length,
      바르게:   hit('고객'),
      붙여서:   hit('고객365'),
      치는중:   hit('보자'),
      영타고객: hit('rhro'),
      영타보장: hit('qhwkd'),
      오타보장: hit('보징분석'),
      오타미끼: hit('미키'),
      오타재무: hit('재무설게'),
      초성:     hit('ㅁㄲ'),
      없는것:   hit('없는메뉴이름xyz')
    };
  });
  ok(typo.n >= 80, '메뉴가 ' + typo.n + '칸이다');
  ok(/고객 365일/.test(typo.바르게.names.join()), '바르게 치면 찾힌다');
  ok(/고객 365일/.test(typo.붙여서.names.join()), '띄어쓰기 없이 쳐도 찾힌다 — 「고객365」');
  ok(/보장분석/.test(typo.치는중.names.join()) && !typo.치는중.loose,
     '치는 중에도 찾힌다 — 「보자」 로 보장분석이 (넓게 안 가고)');
  ok(/고객 365일/.test(typo.영타고객.names.join()) && !typo.영타고객.loose,
     '한/영 안 바꾸고 쳐도 찾힌다 — 「rhro」 → 고객 365일');
  ok(/보장분석/.test(typo.영타보장.names.join()), '「qhwkd」 → 보장분석');
  /* 한 글자 오타는 <b>아무것도 못 찾았을 때만</b> 봐 준다 */
  ok(typo.오타보장.loose && /보장분석/.test(typo.오타보장.names.join()),
     '한 글자 틀려도 찾힌다 — 「보징분석」 (넓게)');
  ok(/미끼 레이더/.test(typo.오타미끼.names.join()), '「미키」 → 미끼 레이더');
  ok(/재무설계/.test(typo.오타재무.names.join()), '「재무설게」 → 재무설계');
  ok(/미끼 레이더/.test(typo.초성.names.join()), '초성 「ㅁㄲ」 로도 찾힌다');
  /* 넓게 봐 주더라도 <b>아무거나 다</b> 걸리면 안 된다 — 그건 못 찾는 것과 같다 */
  ok(typo.없는것.n === 0, '없는 이름은 넓게 봐 줘도 안 걸린다');
  ok(typo.오타보장.n < typo.n / 3,
     '넓게 봐 줘도 절반이 우르르 걸리지 않는다 — ' + typo.오타보장.n + '/' + typo.n + '칸');

  console.log('\n[8] 폰에 담기 화면');
  r = await page.evaluate(() => {
    go('phone_app');
    const t = (document.getElementById('dynPane') || {}).textContent || '';
    return {
      title: (document.querySelector('.page-title') || {}).textContent || '',
      ios: /홈 화면에 추가/.test(t),
      and: /앱 설치/.test(t),
      apps: document.querySelectorAll('.pwa-app').length,
      urls: Array.prototype.map.call(document.querySelectorAll('.pa-m code'), e => e.textContent),
      inMenu: (function () { let f = null; TABS.forEach(g => g.items.forEach(i => { if (i.id === 'phone_app') f = g.group; })); return f; })()
    };
  });
  ok(/폰에 담기/.test(r.title), '화면이 열린다 — ' + r.title.trim());
  ok(r.inMenu === '시스템', '시스템 칸에 있다');
  ok(r.ios, '아이폰에서 하는 길을 적어 준다');
  ok(r.and, '안드로이드에서 하는 길도 적어 준다');
  ok(r.apps === 3, '따로 담을 화면 셋을 보여 준다');
  ok(r.urls.every(u => /\?go=/.test(u)), '주소가 그 화면으로 바로 간다 — ' + (r.urls[0] || ''));

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? (' — ' + errs[0]) : ''));

  console.log('\n[9] 좁은 화면');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(400);
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(w[0] <= w[1] + 1, '390px 가로 스크롤 없음 (' + w[0] + '/' + w[1] + ')');

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('폰에 담기 · 즐겨찾기 점검 통과 — 88칸에 지름길이 생겼습니다.');
})().catch(e => { console.error(e); process.exit(1); });
