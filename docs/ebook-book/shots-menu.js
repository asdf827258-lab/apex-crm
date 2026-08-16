const { chromium } = require('playwright');
const http=require('http'), fs=require('fs'), path=require('path');
const ROOT='/home/user/apex-crm', PORT=8884, OUT=process.argv[2]||'.';
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(PORT);
const STUB=fs.readFileSync('shots-app.js','utf8').match(/const STUB = `([\s\S]*?)`;/)[1];
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1480,height:2000},deviceScaleFactor:2});
 await ctx.route('**://**', r=> r.request().url().includes('127.0.0.1:'+PORT)? r.continue()
   : r.fulfill({status:200,contentType:'text/css',body:''}));
 const page=await ctx.newPage();
 await page.addInitScript(STUB);
 await page.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(3200);
 await page.evaluate(()=>{
   document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
   OS.profile={id:'m0',name:'윤시현',role:'branch_manager',plan:'vip'};
   OS.session={user:{id:'m0',email:'demo@example.com'}};
   try{localStorage.clear()}catch(e){}
   if(typeof renderNav==='function')renderNav();
 });
 await page.waitForTimeout(1200);
 const kill=()=>page.evaluate(()=>{
   document.querySelectorAll('button,a').forEach(x=>{if(/^(나중에|닫기|건너뛰기|확인)$/.test((x.textContent||'').trim())){try{x.click()}catch(e){}}});
   [...document.querySelectorAll('body > div,body > section')].forEach(el=>{const c=getComputedStyle(el);
     if(c.position==='fixed'&&+c.zIndex>=400&&el.offsetHeight>300&&!/sidebar/.test(el.id))el.remove();});
   const sc=document.querySelector('.scrim'); if(sc)sc.remove();
 });
 await kill();
 // 전부 접어서 열네 칸이 한 장에 들어오게
 await page.evaluate(()=>{ if(typeof navAllSet==='function')navAllSet(false); });
 await page.waitForTimeout(900); await kill();
 let sb=await page.$('#sidebar');
 let bx=await sb.boundingBox(); console.log('접힘', JSON.stringify({w:Math.round(bx.width),h:Math.round(bx.height)}));
 const n=await page.evaluate(()=>document.querySelectorAll('#sidebar .nav-g,#sidebar .navg,#sidebar [class*=grp]').length);
 await sb.screenshot({path:OUT+'/app-menu-fold.png'}); console.log('  ✓ app-menu-fold · 후보 그룹요소', n);
 // 보험전략실만 펴 둔 모습
 await page.evaluate(()=>{ if(typeof navReveal==='function')navReveal('mikki'); });
 await page.waitForTimeout(800); await kill();
 sb=await page.$('#sidebar');
 await sb.screenshot({path:OUT+'/app-menu-open.png'}); console.log('  ✓ app-menu-open');
 await b.close(); srv.close();
})();
