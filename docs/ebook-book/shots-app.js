/* 앱 본체 화면 캡처 — 저장소를 그대로 띄우고 가짜 서버를 물려 찍는다.
   docs/ebook/shots.js 와 같은 방식. 앱 파일은 읽기만 한다. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/user/apex-crm', PORT = 8873;
const OUT = process.argv[2] || '.';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.__ins=[];
var TEAM=[
 {id:'m0',name:'윤시현',role:'branch_manager',active:true,workspace:'w1',status:'active',plan:'vip'},
 {id:'m1',name:'김설계',role:'member',active:true,workspace:'w1',status:'active',plan:'pro'},
 {id:'m2',name:'이상담',role:'member',active:true,workspace:'w1',status:'active',plan:'pro'}
];
window.supabase={createClient:function(){
 var mk=function(tbl){
  var f={},up=null,a={
   select:function(){return a},gte:function(){return a},lte:function(){return a},is:function(){return a},
   in:function(){return a},not:function(){return a},order:function(){return a},neq:function(){return a},
   limit:function(){return a},single:function(){return a},maybeSingle:function(){return a},range:function(){return a},
   eq:function(k,v){f[k]=v;return a},
   insert:function(r){window.__ins.push({t:tbl,r:r});return a},
   update:function(r){up=r;return a},upsert:function(r){window.__ins.push({t:tbl,r:r});return a},
   then:function(res){
     if(up)return Promise.resolve({data:null,error:null}).then(res);
     var out=[];
     if(tbl==='profiles')out=TEAM;
     else if(tbl==='teams')out=[{id:'w1',name:'온탑 1팀',leader_id:'m0'}];
     else if(tbl==='team_members')out=TEAM.map(function(p){return {team_id:'w1',member_id:p.id}});
     else out=[];
     return Promise.resolve({data:out,error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  channel:function(){return {on:function(){return this},subscribe:function(){return this}}},
  removeChannel:function(){},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'m0',email:'demo@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'m0'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1480, height: 1000 }, deviceScaleFactor: 2 });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => { const t = String(e); if (!/Failed to fetch|NetworkError/.test(t)) console.log('  ! ' + t.slice(0, 110)); });
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);

  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide,.os-guide-ovl').forEach(x => x.remove());
    OS.profile = { id: 'm0', name: '윤시현', role: 'branch_manager', plan: 'vip' };
    OS.session = { user: { id: 'm0', email: 'demo@example.com' } };
    OS.cfg = OS.cfg || {};
    OS.cfg.schema_version = '34';
    OS.cfg.biz_name = '에이플러스에셋어드바이저 온탑본부';
    OS.cfg.svc_name = 'APEX YUN PRO';
    window.aiReady = () => true; window.claudeReady = () => true;
    try { localStorage.clear(); } catch (e) { }
    if (typeof renderNav === 'function') renderNav();
    if (typeof navAllSet === 'function') navAllSet(true);   // 칸을 전부 펴 둔다
  });
  await page.waitForTimeout(1400);

  // 아침 보고 · 안내 같은 덮개는 전부 닫는다
  const dismiss = async () => {
    await page.evaluate(() => {
      document.querySelectorAll('button,a').forEach(b => {
        if (/^(나중에|닫기|건너뛰기|확인)$/.test((b.textContent || '').trim())) { try { b.click(); } catch (e) { } }
      });
      [...document.querySelectorAll('body > div,body > section')].forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && +cs.zIndex >= 400 && el.offsetHeight > 300
            && !/mikkiScreen|finScreen|sangdamScreen|crmScreen/.test(el.id)) el.remove();
      });
    });
    await page.waitForTimeout(500);
  };
  await dismiss();

  const info = await page.evaluate(() => {
    const sb = document.getElementById('sidebar');
    return {
      groups: [...document.querySelectorAll('#sidebar')].length,
      hasMikki: !!(sb && /미끼 레이더/.test(sb.textContent)),
      navH: sb ? sb.scrollHeight : -1,
      labels: sb ? [...sb.querySelectorAll('*')].map(e => e.childNodes.length === 1 && e.textContent.trim())
        .filter(t => t && t.length < 12 && /보험전략실|하루 시작|내 고객|시스템|교육 자료/.test(t)) : []
    };
  });
  console.log('사이드바:', JSON.stringify(info));

  // ── 1. 왼쪽 메뉴 전체 — 뷰포트를 키워 한 장에 담는다
  await page.setViewportSize({ width: 1480, height: 2400 });
  await page.waitForTimeout(1200);
  await dismiss();
  const sb = await page.$('#sidebar');
  if (sb) {
    const box = await sb.boundingBox();
    console.log('  · 사이드바 크기', JSON.stringify(box && { w: Math.round(box.width), h: Math.round(box.height) }));
    await sb.screenshot({ path: OUT + '/app-menu.png' });
    console.log('  ✓ app-menu');
  }
  await page.setViewportSize({ width: 1480, height: 1000 });
  await page.waitForTimeout(700);

  // ── 2. 미끼 레이더 (전체화면 iframe)
  await page.evaluate(() => go('mikki'));
  await page.waitForTimeout(4500);
  await dismiss();
  const mk = await page.evaluate(() => ({
    mode: document.body.className,
    src: (document.getElementById('mikkiFrame') || {}).src || ''
  }));
  console.log('미끼:', JSON.stringify(mk));
  await page.screenshot({ path: OUT + '/app-mikki-lock.png' });
  console.log('  ✓ app-mikki-lock (첫 실행 잠금)');

  // ── 3. 잠금을 풀고 안쪽 화면으로
  const mfr = () => page.frames().find(f => /미끼레이더/.test(decodeURIComponent(f.url())));
  try {
    let fr = mfr();
    if (fr) {
      await fr.evaluate(() => {
        const box = [...document.querySelectorAll('input')]
          .find(i => /password|text/.test(i.type) && i.offsetParent);
        if (box) {
          box.value = 'demo1234';
          box.dispatchEvent(new Event('input', { bubbles: true }));
          box.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const b = [...document.querySelectorAll('button')]
          .find(x => /암호 설정하고 시작|시작|확인/.test((x.textContent || '').trim()) && x.offsetParent);
        if (b) b.click();
      });
      await page.waitForTimeout(3400);
      await page.screenshot({ path: OUT + '/app-mikki.png' });
      console.log('  ✓ app-mikki (시작 화면)');

      const tabs = [['radar', '📡 신상품 레이더'], ['judge', '⚖️ 정밀 판정'],
                    ['lib', '📚 상품 서재'], ['concept', '🎭 이달의 컨셉']];
      for (const [key, label] of tabs) {
        fr = mfr(); if (!fr) break;
        const ok = await fr.evaluate((k) => {
          if (typeof go === 'function') { try { go(k); return true; } catch (e) { } }
          const b = [...document.querySelectorAll('[onclick],button,a')]
            .find(x => (x.getAttribute('onclick') || '').includes("'" + k + "'"));
          if (b) { b.click(); return true; }
          return false;
        }, key);
        await page.waitForTimeout(1800);
        if (ok) { await page.screenshot({ path: OUT + '/app-mikki-' + key + '.png' }); console.log('  ✓ app-mikki-' + key); }
        else console.log('  · ' + label + ' 못 열음');
      }
    } else console.log('  · 미끼 프레임 못 찾음');
  } catch (e) { console.log('  · 미끼 안쪽 건너뜀: ' + String(e).slice(0, 80)); }

  // ── 4. 재무설계 상담자료
  await page.evaluate(() => go('fp_deck'));
  await page.waitForTimeout(4200);
  await dismiss();
  await page.screenshot({ path: OUT + '/app-fpdeck.png' });
  console.log('  ✓ app-fpdeck');

  // ── 5. 재무설계 계산기
  await page.evaluate(() => go('finance'));
  await page.waitForTimeout(5200);
  await dismiss();
  await page.screenshot({ path: OUT + '/app-finance.png' });
  console.log('  ✓ app-finance');

  await browser.close(); srv.close();
})();
