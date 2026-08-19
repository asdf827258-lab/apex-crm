const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1240,height:1754},deviceScaleFactor:2});
  await p.goto('file://'+process.cwd()+'/one.html',{waitUntil:'load'});
  await p.waitForTimeout(2000);
  const pgs=await p.locator('.pg').all();
  for(let i=0;i<pgs.length;i++){
    await pgs[i].screenshot({path:`APEX-고객한장-${i+1}쪽.png`});
    console.log(`APEX-고객한장-${i+1}쪽.png`);
  }
  await p.pdf({path:'APEX-고객한장.pdf',format:'A4',printBackground:true,
               margin:{top:0,bottom:0,left:0,right:0}});
  console.log('APEX-고객한장.pdf');
  await b.close();
})();
