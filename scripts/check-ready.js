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
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
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

  await page.reload({ waitUntil: 'domcontentloaded' });
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
  await page.evaluate(() => {
    OS.cfg = { schema_version: String(SETUP_VER) };
    LG_BIZ.forEach(x => OS.cfg[x[0]] = '값');
    window.aiReady = () => true;
    window.claudeReady = () => true;
    window.__profiles.forEach(p => p.workspace = 'w1');
    window.__clients.forEach(c => c.consent_status = 'granted');
    window.__backups = [{ id: 'b1', ref_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() }];
    RD_MAN.forEach(m => { if (!rdDone()[m.k]) rdMark(m.k); });
    rdLoad();
  });
  await page.waitForTimeout(900);
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
