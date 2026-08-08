const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.cwd(),PORT=8841;
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css'};
const srv=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}).listen(PORT);
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 await p.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(2500);
 const d=await p.evaluate(()=>{
  const g=n=>{try{return eval(n);}catch(e){return null;}};
  return {
   TABS:g('TABS'), CK_ITEMS:g('CK_ITEMS'), CK_LDR:g('CK_LDR'),
   RT_STEP:g('RT_STEP'), RT_STUCK:g('RT_STUCK'),
   GB_AX:g('GB_AX'), GB_CUR:g('GB_CUR'), FP_CH:g('FP_CH'), FP_CLOSE:g('FP_CLOSE'),
   VA_ACT:(g('VA_ACT')||[]).map(a=>({k:a.k,n:a.n,ex:a.ex,v:a.v,w:!!a.w,c:!!a.c})),
   VA_HOW:g('VA_HOW'), VA_ALIAS:g('VA_ALIAS'),
   CM_FF:g('CM_FF'), LG_BIZ:g('LG_BIZ'), RD_MAN:(g('RD_MAN')||[]).map(m=>({k:m.k,t:m.t})),
   SETUP_VER:g('SETUP_VER'), TIER:g('OS_GROUP_TIER_DEFAULT'),
   FACT_FIELDS:g('FACT_FIELDS')
  };});
 fs.writeFileSync(process.argv[2],JSON.stringify(d,null,1));
 console.log('메뉴 그룹',d.TABS.length,'· 명령',d.VA_ACT.length,'· 화법',d.FP_CH.length,'· 커리큘럼',d.GB_CUR.length);
 await b.close();srv.close();})();
