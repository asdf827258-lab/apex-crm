const {chromium}=require('playwright');
(async()=>{
 const SC=__dirname+'/';
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1200,height:1600}});
 await p.goto('file://'+SC+'easy.html',{waitUntil:'load'});
 await p.waitForTimeout(1500);
 await p.pdf({path:SC+'APEX-쉬운사용설명서.pdf',format:'A4',printBackground:true,
   margin:{top:'0mm',bottom:'0mm',left:'0mm',right:'0mm'}});
 // 검증용 이미지
 await p.emulateMedia({media:'screen'});
 for(const i of [0,1,3,7,16,19,21,24]){
   const el=(await p.$$('.p'))[i];
   if(el)await el.screenshot({path:SC+'chk/'+String(i+1).padStart(2,'0')+'.png'});
 }
 await b.close();
 console.log('ok');
})();
