/* 주요 화면을 실제로 열어 본다.

   문법이 맞아도 화면은 깨질 수 있다. 없는 함수를 부르거나, 이름이 겹치거나,
   데이터가 없을 때 터지거나. 지금까지 그런 것들은 사람이 직접 눌러봐야
   알았다. 여기서 브라우저로 한 번씩 열어 확인한다.

   서버는 가짜로 붙인다. 실제 Supabase 나 AI 를 부르지 않는다.        */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PORT = 8799;

/* 로그인·서버·AI 를 가짜로 세워 둔다 — 화면 그리기만 본다 */
const STUB = `
window.__pageErrors=[];
window.supabase={createClient:function(){
 var mk=function(tbl){var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){var d=(window.__DATA&&window.__DATA[tbl]);
     return Promise.resolve({data:(d&&d.rows)||[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{
   getSession:function(){return Promise.resolve({data:{session:{user:{id:'smoke',email:'smoke@test'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'smoke'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
window.__DATA={profiles:{rows:[{id:'smoke',name:'점검',role:'owner',active:true,workspace:'both',plan:'vip'}]}};
`;

/* 그룹마다 최소 한 곳씩 — 골고루 훑는다 */
const TABS = [
  'home', 'brain', 'manual', 'ckboard', 'academy', 'org', 'yoonsi', 'ai_org', 'report',
  'assistant', 'teamx', 'growth', 'ckteam', 'sangdam', 'clients', 'fact_find',
  'attend', 'interpret', 'wallets', 'contracts', 'endorse', 'treatpay', 'ai_prop',
  'bojang', 'baba', 'compare', 'katalk', 'finance', 'calc', 'biz_diag', 'biz_news',
  'ins_asst', 'cs_assist', 'cs_needs', 'cs_gso', 'claims', 'med_silbi', 'med_checkup',
  'med_disclosure', 'branch_coach', 'hq', 'audit', 'blog', 'threads', 'insta', 'video',
  'simui', 'calendar', 'ref_jeonsan', 'ref_kcd', 'ref_surgery', 'pricing',
  'settings', 'health', 'voice', 'terms', 'mycoach', 'mbti'
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serve() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('nope'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT);
}

(async () => {
  const server = serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  /* 밖으로 나가는 요청은 전부 막는다 — 점검이 인터넷 상태에 좌우되면 안 된다 */
  await ctx.route('**://**', route => {
    const u = route.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });

  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push({ where: 'load', msg: e.message }));
  await page.addInitScript(STUB);

  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const booted = await page.evaluate(() => typeof go === 'function' && typeof TABS !== 'undefined');
  if (!booted) {
    console.log('✗ 앱이 뜨지 않았습니다. 화면을 그릴 준비조차 안 됐습니다.');
    if (errors.length) errors.slice(0, 5).forEach(e => console.log('    ' + e.msg));
    await browser.close(); server.close(); process.exit(1);
  }

  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'smoke', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'smoke', email: 'smoke@test' } };
    OS.cfg = { schema_version: '29' };
    window.toast = function () {};
  });

  let bad = 0, empty = 0;
  for (const tab of TABS) {
    const before = errors.length;
    let out;
    try {
      out = await page.evaluate(t => {
        go(t);
        var d = document.getElementById('dyn') || document.querySelector('.tab-pane.on') || document.body;
        return { len: (d.textContent || '').replace(/\s+/g, '').length };
      }, tab);
      await page.waitForTimeout(160);
    } catch (e) {
      errors.push({ where: tab, msg: e.message });
      out = { len: 0 };
    }
    const fresh = errors.slice(before).filter(e => e.where === 'load' || e.where === tab);
    if (fresh.length) {
      bad++;
      console.log('✗ ' + tab + ' — ' + fresh[0].msg.split('\n')[0].slice(0, 120));
      fresh.forEach(e => { e.where = tab; });
    } else if (out.len < 40) {
      empty++;
      console.log('△ ' + tab + ' — 내용이 거의 없습니다 (' + out.len + '자)');
    }
  }

  /* 가로 스크롤 — 태블릿에서 화면이 옆으로 밀리는 것을 잡는다 */
  await page.setViewportSize({ width: 430, height: 900 });
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(300);
  const over = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  const wide = over.sw > over.cw + 2;
  if (wide) console.log('✗ 홈 — 폭 430px 에서 가로 스크롤이 생깁니다 (' + over.sw + ' > ' + over.cw + ')');

  await browser.close();
  server.close();

  console.log('');
  if (bad || wide) {
    console.log('열리지 않는 화면 ' + bad + '개' + (wide ? ' · 가로 스크롤 있음' : ''));
    process.exit(1);
  }
  console.log('화면 점검 통과 — ' + TABS.length + '개 모두 열림' + (empty ? (' (내용 적은 곳 ' + empty + '개)') : ''));
})().catch(e => { console.error('점검 중 오류:', e.message); process.exit(1); });
