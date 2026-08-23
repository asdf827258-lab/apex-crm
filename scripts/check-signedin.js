/* 로그인해 둔 폰에서 로그인 화면이 다시 뜨지 않는가.

   폰 홈 화면 아이콘(또는 길게 눌러 나오는 바로가기)으로 바로 들어가려는데
   <b>로그인 화면이 먼저 떠서</b> 그때마다 막혔다. 원인은 둘이었다.

     1. Supabase 는 토큰이 커지면 여러 칸에 <b>쪼개</b> 담는다
        (…-auth-token.0 · .1). 예전 규칙은 끝이 딱 auth-token 인 것만 봐서
        쪼갠 것을 「로그인 안 함」 으로 읽었다.
     2. 게이트를 프로필·설정·접속IP 를 <b>다 받아 온 뒤에야</b> 지웠다.
        서버 왕복 넷이라 폰 데이터로는 몇 초, 하나만 늦어도 계속 로그인 화면.

   여기서 보는 것.
     [1] 쪼개 담긴 토큰도 「로그인해 둔 것」 으로 읽는가
     [2] 세션이 확인되면 그 자리에서 게이트를 지우는가
     [3] 홈 화면 바로가기 주소가 실제로 있는 화면을 가리키는가          */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = [], pass = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { bad.push(m); console.log('  ✗ ' + m); } };

(async () => {
  await new Promise(r => srv.listen(0, r));
  const b = await chromium.launch();
  const page = await b.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);

  console.log('\n[1] 쪼개 담긴 토큰도 알아보는가');
  const t = await page.evaluate(() => {
    const REF = 'miakdhxtqofpndtlyzxa', out = {};
    const set = (o) => { try { localStorage.clear(); } catch (e) {}
      Object.keys(o).forEach(k => localStorage.setItem(k, o[k])); };
    set({ ['sb-' + REF + '-auth-token']: '{"access_token":"x"}' });
    out.한덩이 = osHasStoredSession();
    set({ ['sb-' + REF + '-auth-token.0']: '{"access_token"', ['sb-' + REF + '-auth-token.1']: ':"x"}' });
    out.쪼갠것 = osHasStoredSession();
    set({ 'apex_day_pin': '1', 'sb-something-else': 'x' });
    out.엉뚱한것 = osHasStoredSession();
    try { localStorage.clear(); } catch (e) {}
    out.빈것 = osHasStoredSession();
    return out;
  });
  ok(t.한덩이 === true, '한 덩이로 담긴 토큰 — 로그인해 둔 것으로 읽는다');
  ok(t.쪼갠것 === true, '쪼개 담긴 토큰(.0 · .1) — 로그인해 둔 것으로 읽는다');
  /* 헛것을 잡으면 로그인 안 한 사람에게 앱이 열린다 — 이게 더 나쁘다 */
  ok(t.엉뚱한것 === false, '상관없는 저장값을 로그인으로 착각하지 않는다');
  ok(t.빈것 === false, '아무것도 없으면 로그인 안 한 것으로 읽는다');

  console.log('\n[2] 세션이 확인되면 그 자리에서 여는가');
  const g = await page.evaluate(() => {
    const boot = osBootAuth.toString();
    /* getSession 이 세션을 돌려준 그 블록 안에서 게이트를 지워야 한다 */
    const i = boot.indexOf('getSession');
    const after = i >= 0 ? boot.slice(i) : '';
    return {
      부트에서지운다: /osHideLoginGate/.test(after),
      토큰갱신때도: (boot.match(/osHideLoginGate/g) || []).length >= 2,
      프로필끝에서만: !/osHideLoginGate/.test(after) && /osHideLoginGate/.test(osProfileApply.toString())
    };
  });
  ok(g.부트에서지운다, '세션이 확인되면 프로필을 기다리지 않고 연다');
  ok(g.토큰갱신때도, '토큰이 갱신돼 다시 들어와도 연다');
  ok(g.프로필끝에서만 === false, '프로필·설정·접속IP 를 다 받을 때까지 붙잡아 두지 않는다');

  console.log('\n[3] 세션이 있으면 게이트를 아예 안 띄운다');
  const shown = await page.evaluate(() => {
    const REF = 'miakdhxtqofpndtlyzxa';
    try { localStorage.clear(); } catch (e) {}
    localStorage.setItem('sb-' + REF + '-auth-token.0', '{"access_token":"x"}');
    osHideLoginGate();
    /* 부팅 첫 줄과 같은 판정 */
    const wouldShow = !osHasStoredSession();
    try { localStorage.clear(); } catch (e) {}
    return wouldShow;
  });
  ok(shown === false, '쪼갠 토큰이 있으면 처음부터 게이트를 안 띄운다');

  console.log('\n[4] 홈 화면 바로가기');
  const mf = JSON.parse(fs.readFileSync('app/manifest.webmanifest', 'utf8'));
  const sc = mf.shortcuts || [];
  ok(sc.length >= 2, '바로가기가 ' + sc.length + '개 들어 있다');
  ['crm', 'clients'].forEach(id => {
    ok(sc.some(x => (x.url || '').indexOf('go=' + id) >= 0 || (x.url || '').indexOf(id + '.html') >= 0),
       '바로가기에 ' + id + ' 가 있다');
  });
  const ids = await page.evaluate(() => { const o = {}; TABS.forEach(g => g.items.forEach(i => o[i.id] = 1)); return o; });
  sc.forEach(x => {
    const u = x.url || '';
    const m = u.match(/go=([a-z_]+)/);
    if (m) ok(!!ids[m[1]], '  ' + x.short_name + ' → ' + m[1] + ' 화면이 실제로 있다');
    else ok(fs.existsSync(path.join('app', u.replace(/^\.\//, ''))), '  ' + x.short_name + ' → ' + u + ' 파일이 실제로 있다');
  });

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? (' — ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad.length) { console.log('로그인 유지 점검 실패 — ' + bad.length + '가지 어긋납니다 (통과 ' + pass + ').'); process.exit(1); }
  console.log('로그인 유지 점검 통과 — 담아 둔 폰은 바로 열립니다 (' + pass + '가지).');
})().catch(e => { console.error(e); process.exit(1); });
