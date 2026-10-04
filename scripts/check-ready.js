/* 출발 점검 — 남은 것을 정말로 짚어 주는가.

   이 화면의 값어치는 "다 됐다" 고 말하지 않는 데 있다.
   SQL 을 안 돌렸는데 됐다고 하면 사장님은 그걸 믿고 팀에 뿌린다.
   그래서 여기서는 일부러 덜 된 서버를 붙여 놓고, 덜 됐다고 말하는지를 본다.   */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8827;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 덜 된 서버 — 지점장도 없고, 팀도 반만 있고, 동의도 반만 받았고, 백업은 오래됐다 */
const STUB = `
window.__profiles=[
 {id:'p1',name:'대표',role:'owner',active:true,workspace:'w1'},
 {id:'p2',name:'가',role:'member',active:true,workspace:'w1'},
 {id:'p3',name:'나',role:'member',active:true,workspace:null},
 {id:'p4',name:'다',role:'member',active:false,workspace:null}
];
window.__clients=[
 {id:'c1',consent_status:'granted'},{id:'c2',consent_status:'none'}
];
window.__backups=[{id:'b1',ref_date:'2020-01-01',created_at:'2020-01-01T00:00:00Z'}];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},neq:function(){return a},
   limit:function(){return a},single:function(){return a},range:function(){return a},eq:function(){return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){
     var out=[];
     if(tbl==='profiles')out=window.__profiles;
     else if(tbl==='clients')out=window.__clients;
     else if(tbl==='backups')out=window.__backups;
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'p1',email:'o@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'p1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1200 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('main: ' + e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'p1', name: '대표', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'p1', email: 'o@t' } };
    OS.cfg = {};                       /* SQL 안 돌린 상태 · 사업자 정보도 비었다 */
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
    window.aiReady = () => false;      /* AI 도 아직 연결 안 됨 */
    try { localStorage.clear(); } catch (e) { }
  });

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };
  const open = async () => { await page.evaluate(() => go('ready')); await page.waitForTimeout(900); };
  const view = () => page.evaluate(() => ({
    txt: (document.getElementById('rdPane') || {}).textContent || '',
    no: document.querySelectorAll('#rdPane .rd-r.no').length,
    warn: document.querySelectorAll('#rdPane .rd-r.warn').length,
    okn: document.querySelectorAll('#rdPane .rd-r.ok').length,
    man: document.querySelectorAll('#rdPane .rd-m').length,
    manOn: document.querySelectorAll('#rdPane .rd-m.on').length,
    pct: (document.querySelector('#rdPane .rd-pb') || {}).style ? document.querySelector('#rdPane .rd-pb').style.width : '',
    keys: Array.prototype.map.call(document.querySelectorAll('#rdPane .rd-h b'), e => e.textContent.trim())
  }));

  /* ── 메뉴 ── */
  const menu = await page.evaluate(() => {
    var t = []; TABS.forEach(g => (g.items || []).forEach(i => t.push(g.group + '|' + i.id + '|' + i.title)));
    return t;
  });
  ok(menu.indexOf('시스템|ready|출발 점검') >= 0, '메뉴 「시스템」 밑에 출발 점검이 있다');

  await open();
  let v = await view();
  ok(v.no + v.warn >= 5, '덜 된 것이 ' + (v.no + v.warn) + '개 잡힌다');
  ok(/서버 준비 SQL/.test(v.txt), 'SQL 안 돌린 것을 짚어 준다');
  ok(/AI 연결/.test(v.txt), 'AI 안 붙은 것을 짚어 준다');
  ok(/사업자 정보/.test(v.txt), '사업자 정보 빈 칸을 짚어 준다');
  ok(/팀 소속/.test(v.txt), '팀 소속 안 잡힌 것을 짚어 준다');
  ok(/고객 동의/.test(v.txt), '고객 동의 상태를 짚어 준다');

  /* 숫자가 실제 서버 값과 맞는가 */
  const num = await page.evaluate(() => {
    const A = rdAuto(), m = {};
    A.forEach(x => m[x.k] = { st: x.st, now: x.now });
    return m;
  });
  ok(num.sql.st === 'no', 'SQL 은 "남음" 으로 잡힌다');
  ok(num.ai.st === 'no', 'AI 는 "남음" 으로 잡힌다');
  ok(num.biz.st === 'no' && /0 \/ 11/.test(num.biz.now), '사업자 정보 0/11 을 정확히 센다 — ' + num.biz.now);
  ok(num.lead.st === 'ok' && /1명/.test(num.lead.now), '대표 한 명은 지점장 역할로 센다 — ' + num.lead.now);
  ok(num.team.st === 'warn' && /2 \/ 3명/.test(num.team.now),
    '쉬는 사람은 빼고 팀 소속을 센다 (2/3) — ' + num.team.now);
  ok(num.consent.st === 'warn' && /1 \/ 2명/.test(num.consent.now), '동의 1/2 을 센다 — ' + num.consent.now);
  ok(num.backup.st === 'warn' && /2020-01-01/.test(num.backup.now), '오래된 백업을 오래됐다고 한다');

  /* ── 사람만 할 수 있는 것 ── */
  ok(v.man === 8, '사장님만 할 수 있는 일 ' + v.man + '가지가 나온다');
  ok(v.manOn === 0, '처음엔 하나도 지워져 있지 않다');
  ok(/유출된 Netlify 토큰 폐기/.test(v.txt), '유출 토큰 폐기가 들어 있다');
  ok(/변호사/.test(v.txt) && /준법감시/.test(v.txt), '법률 확인이 들어 있다');
  ok(/통신판매업/.test(v.txt), '통신판매업 신고가 들어 있다');
  const risk = await page.evaluate(() => document.querySelectorAll('#rdPane .rd-x').length);
  ok(risk === 3, '먼저 해야 할 세 가지에 표시가 붙는다 (' + risk + ')');

  /* 체크하면 지워지고, 새로고침해도 남는가 */
  await page.evaluate(() => rdMark('nf_token'));
  await page.waitForTimeout(200);
  v = await view();
  ok(v.manOn === 1, '누르면 지워진다');
  ok(/\d{4}-\d{2}-\d{2} 완료/.test(v.txt), '언제 끝냈는지 날짜가 남는다');

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'p1', name: '대표', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'p1', email: 'o@t' } };
    OS.cfg = {}; window.aiReady = () => false;
    window.__toast = []; window.toast = m => window.__toast.push('' + m);
  });
  await open();
  v = await view();
  ok(v.manOn === 1, '새로고침해도 지운 것은 지워진 채로 있다');

  /* ── 다 되면 다 됐다고 한다 ── */
  /* ⚠ <b>흉내를 먼저 걸어 둔다.</b> 아래 osReadyAfterRender() 가 부르는 읽기와
     뒤에서 거는 강제 읽기가 <b>겹쳐서</b>, 늦게 끝난 쪽(흉내 없는 쪽)이
     RD.rows 를 덮었다. 3번에 1번 빨간불이 켜졌다 — 깜빡이는 점검은
     안 잡는 점검보다 나쁘다 (8번). */
  const diagOk = { url: 'miakdhxtqofpndtlyzxa.supabase.co', anon: true,
    key: { kind: 'jwt', len: 218, role: 'service_role', ref: 'miakdhxtqofpndtlyzxa', refOk: true },
    live: { status: 200, msg: '' } };
  await page.route('**/functions/push**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(diagOk) }));
  await page.evaluate(() => {
    OS.cfg = { schema_version: String(SETUP_VER) };
    LG_BIZ.forEach(x => OS.cfg[x[0]] = '값');
    window.aiReady = () => true;
    window.claudeReady = () => true;
    window.__profiles.forEach(p => p.workspace = 'w1');
    window.__clients.forEach(c => c.consent_status = 'granted');
    window.__backups = [{ id: 'b1', ref_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() }];
    RD_MAN.forEach(m => { if (!rdDone()[m.k]) rdMark(m.k); });
    /* 폰 알람 — 머리 없는 브라우저는 알림을 늘 막습니다(permission 이 항상
       denied). 사장님 폰에서는 「허용」 을 누르면 켜지는 자리라, 여기서만
       <b>허용하신 폰</b>을 흉내 냅니다. 안 하면 「전부 채워도 100% 가 안 된다」
       가 되어, 다 하신 사장님께 영영 남은 것이 있다고 말하게 됩니다. */
    window.almCan = () => ({ sw: true, notif: true, push: true, ios: false, stand: true, perm: 'granted' });
    /* 🔑 서버 열쇠·💼 직업도 <b>다 하신 상태</b>로 둔다 — 새 줄을 넣고 여기를
       안 고치면 「전부 채워도 100% 가 안 된다」 가 되어, 다 하신 사장님께
       영영 남은 것이 있다고 말하게 된다 (8번 — 헛것을 잡는 점검). */
    window.CM = window.CM || {}; CM.loaded = true;
    CM.meta = { a: { fp: { f_job: '순천시청 공무원' } }, b: { fp: { f_job: '자영업' } } };
    /* <b>사장님이 실제로 하시는 것</b>으로 새로 본다 — 고친 뒤 이 화면을
       다시 여는 것이다. rdLoad() 를 직접 부르면 「화면을 열면 기다리지 않고
       읽는다」 가 깨져도 이 점검은 모른다 (8번). */
    osReadyAfterRender();
  });
  /* <b>시계로 기다리지 않는다</b> — 값이 될 때까지 기다린다. 900ms 로 재던
     것이 느린 판에서 덜 끝나 빨간불이 켜졌다 (8번). */
  await page.evaluate(() => rdDiagLoad());
  await page.waitForFunction(
    () => { const x = rdAuto().filter(r => r.k === 'sbkey')[0]; return !!(x && x.st === 'ok'); },
    null, { timeout: 8000 }).catch(() => {});
  v = await view();
  ok(v.no === 0 && v.warn === 0, '전부 채우면 남은 것이 0개가 된다');
  ok(/앱 쪽은 전부 준비됐습니다/.test(v.txt), '앱 쪽이 끝났다고 말해 준다');
  ok(v.pct === '100%', '진행률이 100% 가 된다 (' + v.pct + ')');

  /* ── 복사 ── */
  const copied = await page.evaluate(() => {
    window.__cp = ''; window.copyText = t => { window.__cp = '' + t; };
    rdCopy(); return window.__cp;
  });
  ok(/출발 점검/.test(copied) && /없음/.test(copied), '다 끝났으면 복사본에도 "없음" 으로 나온다');

  /* ── 대표가 아니면 안 보인다 ── */
  const blocked = await page.evaluate(() => {
    OS.profile = { id: 'p2', name: '가', role: 'member', plan: 'vip' };
    window.__toast = [];
    var allowed = osTabAllowed('ready');
    go('ready');
    return { allowed: allowed, toast: window.__toast.join(' ') };
  });
  ok(!blocked.allowed, '팀원에게는 열리지 않는다');
  ok(/대표만/.test(blocked.toast), '왜 안 열리는지 말해 준다');

  /* ── 🔑 <b>서버 열쇠 줄</b> ─────────────────────────────────────────
     2026-09-22. 사장님 화면에 「401 · Invalid API key」 가 떴는데, 앱은
     그것을 「로그인을 다시 하세요」 로 옮겨 적었습니다. 사장님은 앱을
     껐다 켜기를 되풀이하셨고, <b>막힌 곳은 아무 화면에도 안 보였습니다</b>.
     그 열쇠 하나가 막히면 새벽 5시 AI 작업·밤 작업·브리핑·시세·폰 알람이
     <b>통째로</b> 멈춥니다. 여기서 보이게 하고, <b>사장님 탓을 하지 않는지</b>
     그리고 <b>열쇠 글자가 새지 않는지</b>를 잽니다 (1·8·10번).            */
  /* ★ <b>아직 안 물어봤으면 줄을 안 세운다.</b> 처음엔 이 묻기를 rdLoad
     안에 넣었는데, <b>홈도 rdLoad 를 부릅니다</b> — 홈을 여는 매번 서버를
     한 번 더 부르고 있었습니다 (7번). check-invest 가 콘솔 404 로 잡았습니다
     — 점검이 제 일을 했습니다.                                            */
  const before = await page.evaluate(() => {
    RD.diag = null;
    return { has: !!rdAuto().filter(r => r.k === 'sbkey')[0] };
  });
  ok(!before.has,
     '아직 <b>안 물어봤으면 줄을 안 세운다</b> — 모르는 것을 「남았다」고 안 적는다 (1번)');
  const rdLoadSrc = (fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8')
    .split('function rdLoad(')[1] || '').slice(0, 1400);
  ok(!/functions\/push/.test(rdLoadSrc),
     '  서버 열쇠는 <b>rdLoad 안에서 안 묻는다</b> — 홈도 rdLoad 를 부른다 (7번)');

  const SECRET = 'eyJhbGciOiJIUzI1NiJ9.SECRET_DO_NOT_LEAK.sig';
  /* 흉내를 갈아 끼우고 <b>그 값이 실제로 올 때까지</b> 기다린다 (시계 금지) */
  /* ⚠ <b>「남음」 다음에 또 「남음」 을 기다리면 그 자리에서 통과한다.</b>
     2026-09-28 · 실제로 여기서 <b>붐빌 때만</b> 빨간불이 켜졌습니다. 혼자
     돌리면 세 번 다 초록인데, CI 처럼 서른 가지를 잇달아 돌리면 답이 늦게
     와서 <b>낡은 줄</b>을 읽습니다. st 만 기다렸기 때문입니다 — 앞 줄이
     이미 'no' 라 기다림이 <b>즉시</b> 끝나고, 새 답은 아직 안 왔습니다.
     이제 <b>글까지</b> 기다립니다(re). 때를 못 맞춰 켜지는 빨간불은
     헛것이고, 사람이 점검을 안 믿게 됩니다 (8번).                      */
  const setDiag = async (body, want, re) => {
    await page.unroute('**/functions/push**').catch(() => {});
    await page.route('**/functions/push**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }));
    await page.evaluate(() => { rdLoad(true); rdDiagLoad(); });
    /* ⚠ 기다리다 시간이 넘어도 <b>터지지 않는다</b>. 줄을 통째로 빼 보니
       여기서 예외가 나 점검이 <b>빨간불 대신 죽었고</b>, 뒤의 여덟 줄을
       아예 못 쟀다. 한 곳이 망가지면 나머지가 눈이 먼다 — 아래 ok() 들이
       제 입으로 무엇이 틀렸는지 말하게 둔다 (8번). */
    await page.waitForFunction(
      (o) => { const x = rdAuto().filter(r => r.k === 'sbkey')[0];
               return !!(x && x.st === o.w && (!o.re || new RegExp(o.re).test(x.now || ''))); },
      { w: want, re: re || null }, { timeout: 8000 }).catch(() => {});
  };
  const rowOf = (k) => page.evaluate((kk) => {
    const x = rdAuto().filter(r => r.k === kk)[0] || null;
    return x ? { st: x.st, now: x.now, how: x.how, t: x.t } : null;
  }, k);

  await setDiag({ url: 'miakdhxtqofpndtlyzxa.supabase.co', anon: false,
                  key: { kind: 'jwt', len: 218, role: 'service_role', ref: 'miakdhxtqofpndtlyzxa', refOk: true },
                  live: { status: 401, msg: 'Invalid API key' } }, 'no');
  let K = await rowOf('sbkey');
  ok(!!K, '🔑 <b>서버 열쇠</b> 줄이 출발 점검에 선다 — 여태 아무 화면에도 없었다');
  ok(!!(K && K.st === 'no'), '  열쇠가 거절당하면 <b>「남음」</b> 으로 뜬다 · ' + ((K && K.now) || '(줄이 없음)'));
  ok(!!(K && !/로그인/.test(K.now + ' ' + K.how)),
     '  <b>「로그인을 다시 하세요」 라고 안 한다</b> — 그래 봐야 안 고쳐진다 (1번)');
  ok(!!(K && /SUPABASE_SERVICE_ROLE_KEY/.test(K.how) && /Netlify/.test(K.how)),
     '  <b>어디를 고치는지</b> 그대로 적는다 — Netlify 의 그 한 줄');
  ok(!!(K && /새벽 5시|밤 작업|브리핑/.test(K.how)),
     '  <b>같이 멈추는 것</b>도 말한다 — 알람만의 문제가 아니다');

  await setDiag({ url: 'miakdhxtqofpndtlyzxa.supabase.co', anon: false,
                  key: { kind: 'jwt', len: 218, role: 'service_role', ref: 'someotherproj', refOk: false },
                  live: { status: 401, msg: 'Invalid API key' } }, 'no', '다른 프로젝트');
  K = await rowOf('sbkey');
  ok(!!(K && /다른 프로젝트/.test(K.now)),
     '<b>다른 프로젝트 열쇠</b>를 가려낸다 — 같은 말이 와도 고칠 법이 다르다 · ' + ((K && K.now) || '(줄이 없음)'));

  await setDiag({ url: 'miakdhxtqofpndtlyzxa.supabase.co', anon: true,
                  key: { kind: 'jwt', len: 218, role: 'service_role', ref: 'miakdhxtqofpndtlyzxa', refOk: true },
                  live: { status: 200, msg: '' } }, 'ok');
  K = await rowOf('sbkey');
  ok(!!(K && K.st === 'ok'), '<b>성하면 「됨」</b> 으로 뜬다 — 헛것을 안 잡는다 (8번) · ' + ((K && K.now) || '(줄이 없음)'));

  /* 열쇠 글자가 <b>화면에 새는지</b> — 서버가 실수로 실어 보내도 여기서 걸린다 */
  await setDiag({ url: 'x.supabase.co', anon: false, key_RAW: SECRET,
                  key: { kind: 'jwt', len: 218, role: 'service_role', ref: 'x', refOk: true },
                  live: { status: 401, msg: 'Invalid API key' } }, 'no');
  await page.evaluate(() => go('ready'));
  await page.waitForTimeout(600);
  const leak = await page.evaluate(() => (document.getElementById('rdPane') || {}).textContent || '');
  ok(leak.indexOf('SECRET_DO_NOT_LEAK') < 0,
     '<b>열쇠 글자는 화면에 한 자도 안 뜬다</b> (10번) — 서버가 실어 보내도 여기서 안 그린다');

  /* 💼 <b>직업 한 줄</b> — 소식을 고르는 데 값이 제일 큰 칸이다 */
  await page.evaluate(() => {
    window.CM = window.CM || {}; CM.loaded = true;
    CM.meta = { a: { fp: { f_job: '순천시청 공무원' } }, b: { fp: {} }, c: { fp: { f_job: '' } } };
  });
  const J = await rowOf('job');
  ok(!!J, '💼 <b>고객 직업 한 줄</b> 줄이 선다');
  ok(!!(J && /1 \/ 3/.test(J.now)), '  <b>몇 분이 적혀 있는지</b> 센다 · ' + ((J && J.now) || '(줄이 없음)'));
  ok(!!(J && J.st === 'warn'), '  다 안 적혔으면 <b>「확인」</b> — 0명이면 「남음」');
  ok(!!(J && /짐작/.test(J.how)),
     '  <b>아무 직업이나 읽는 게 아니라고</b> 미리 말한다 — 적어 놓고 안 읽히면 속은 기분이다 (1번)');
  await page.unroute('**/functions/push**').catch(() => {});

  ok(errs.length === 0, '자바스크립트 오류 없음' + (errs.length ? ' — ' + errs.join(' / ') : ''));

  await page.evaluate(() => { OS.profile = { id: 'p1', name: '대표', role: 'owner', plan: 'vip' }; go('ready'); });
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(300);
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  ok(w.s <= w.c + 1, '390px 가로 스크롤 없음 (' + w.s + '/' + w.c + ')');

  await browser.close(); srv.close();
  if (fail.length) { console.log('\n✗ 실패 ' + fail.length + '건'); fail.forEach(f => console.log('   - ' + f)); process.exit(1); }
  console.log('\n출발 점검 통과');
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
