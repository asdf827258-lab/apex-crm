/* 회사가 정리해 준 자료 폴더를 통째로 서재에 넣을 수 있는가.

   설계사는 약관을 한 장씩 모으지 않는다 — 회사가 회사별·상품별로
   나눠 준 폴더를 받는다. 그런데 여태 이 화면은 <b>파일만</b> 받았다.
   폴더를 떨어뜨리면 안이 안 보여 「PDF 를 넣어주세요」만 뜨고
   아무 일도 안 났다.

   그리고 매달이 문제였다. 같은 폴더를 다시 넣으면 200쪽짜리 약관
   글자 뽑기를 처음부터 전부 되풀이한다 — 몇 십 분이 그냥 간다.

   여기서 확인한다.

     1. 폴더를 받을 채비가 돼 있는가
     2. 떨어뜨리면 <b>안쪽 폴더까지</b> 훑는가
     3. 넣으면 회사·종류로 나뉘는가
     4. 같은 폴더를 또 넣으면 <b>건너뛰는가</b> — 매달 하는 일
     5. 새 파일 한 개만 늘었을 때 그 한 개만 읽는가
     6. PDF 가 없으면 조용히 끝내지 않고 말하는가
     7. 넣은 것이 홍보 발췌로 그대로 이어지는가

   ※ 브라우저의 진짜 폴더 읽기(webkitGetAsEntry)는 사람이 끄는
     드래그로만 생긴다. Playwright 가 폴더로 넘긴 파일은 크기 0 에
     읽기 권한이 없어 그대로는 못 쓴다. 그래서 <b>재귀가 도는지</b>는
     같은 모양의 대역을 세워 재고, <b>넣는 일</b>은 진짜 File 로 잰다. */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const ROOT=process.cwd(),PORT=8825;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json'};
function serve(){return http.createServer((q,r)=>{
  let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/index.html';
  const f=path.join(ROOT,u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end('no');return}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(r)}).listen(PORT)}
let bad=0; const is=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)bad++};
const U='http://127.0.0.1:'+PORT+'/app/%EC%83%81%EB%8B%B4%EC%9E%90%EB%A3%8C/%EB%AF%B8%EB%81%BC%EB%A0%88%EC%9D%B4%EB%8D%94/index.html';

(async()=>{
 const srv=serve(); const br=await chromium.launch(); const pg=await br.newPage();
 await pg.route('**/api/market**',r=>r.abort());
 await pg.goto(U,{waitUntil:'domcontentloaded',timeout:60000});
 await pg.waitForSelector('#lockPw',{timeout:20000});
 await pg.fill('#lockPw','test1234'); await pg.click('#lockGo');
 await pg.waitForSelector('#lockOv',{state:'detached',timeout:10000});
 await pg.evaluate(()=>document.querySelector('.tab[data-t="lib"]').click());
 await pg.waitForTimeout(300);

 console.log('\n[1] 폴더를 받아 낼 채비가 돼 있는가');
 is(await pg.evaluate(()=>{const e=document.querySelector('#upDir');
   return !!e && e.hasAttribute('webkitdirectory')}),'폴더 고르기 칸이 폴더를 받는다');
 is(await pg.$('#btnUpDir')!==null,'「폴더 통째로 넣기」 단추가 있다');

 console.log('\n[2] 폴더를 떨어뜨리면 안쪽까지 훑는가 (회사별 하위 폴더)');
 /* 브라우저의 폴더 읽기(webkitGetAsEntry)는 진짜 드래그로만 생긴다.
    그래서 그 자리에 같은 모양의 대역을 세워 <b>재귀가 도는지</b>를 본다. */
 const got=await pg.evaluate(async()=>{
   const mkFile=(name,body)=>({isFile:true,isDirectory:false,
     file:cb=>cb(new File([body],name,{type:'text/plain'}))});
   const mkDir=(name,kids)=>({isFile:false,isDirectory:true,
     createReader:()=>{let done=false;return{readEntries:(cb)=>{if(done)return cb([]);done=true;cb(kids)}}}});
   const tree=mkDir('회사자료',[
     mkDir('삼성생명',[mkFile('삼성생명_든든암보험_상품설명서.txt','가입한도'),
                        mkDir('구판',[mkFile('삼성생명_구판_약관.txt','제3조')])]),
     mkDir('현대해상',[mkFile('현대해상_안심보험_약관.txt','제5조')]),
     mkFile('읽을거리.docx','문서')]);
   const dt={items:[{webkitGetAsEntry:()=>tree}],files:[]};
   const fsx=await filesFromDrop(dt);
   return fsx.map(f=>f.name);
 });
 console.log('    '+JSON.stringify(got));
 is(got.length===4,'하위 폴더 · 그 안의 폴더까지 전부 꺼낸다 ('+got.length+'개)');
 is(got.includes('삼성생명_구판_약관.txt'),'두 단계 아래 파일도 꺼낸다');
 is(got.includes('읽을거리.docx'),'거르는 일은 uploadFiles 가 한다 — 여기선 다 꺼낸다');

 console.log('\n[3] 넣으면 회사·종류로 나뉘는가');
 const st1=await pg.evaluate(async()=>{
   const mk=(n,b)=>new File([b],n,{type:'text/plain'});
   await uploadFiles([
     mk('삼성생명_든든암보험_상품설명서.txt','주요 보장 : 암 진단비 3,000 만원. 가입한도 는 5,000 만원. '.repeat(8)),
     mk('삼성생명_든든암보험_약관.txt','제3조(보장개시일) 보장개시일 부터 90 일이 지난 날. '.repeat(9)),
     mk('현대해상_안심보험_상품설명서.txt','납입 기간 은 20년납. 만기 환급금 이 없는 순수보장형. '.repeat(9)),
     mk('읽을거리.docx','아님')]);
   return document.querySelector('#upState').textContent;
 });
 console.log('    '+st1.trim());
 is(/새로 3건/.test(st1),'PDF·TXT 3건만 들어갔다 (docx 는 걸렀다)');
 let n=await pg.evaluate(async()=>(await dbAll()).length);
 is(n===3,'서재에 3건 쌓였다 ('+n+')');
 const kinds=await pg.evaluate(async()=>(await dbAll()).map(x=>x.kind).sort());
 is(JSON.stringify(kinds)===JSON.stringify(['상품설명서','상품설명서','약관']),'종류를 알아서 나눈다 — '+kinds.join(','));
 const cos=await pg.evaluate(async()=>[...new Set((await dbAll()).map(x=>x.co))].filter(Boolean).sort());
 is(cos.length===2&&cos.includes('삼성생명')&&cos.includes('현대해상'),'회사도 알아서 나눈다 — '+cos.join(','));

 console.log('\n[4] 같은 폴더를 또 넣으면 건너뛰는가 — 매달 하는 일');
 const st2=await pg.evaluate(async()=>{
   const mk=(n,b)=>new File([b],n,{type:'text/plain'});
   await uploadFiles([
     mk('삼성생명_든든암보험_상품설명서.txt','주요 보장 : 암 진단비 3,000 만원. 가입한도 는 5,000 만원. '.repeat(8)),
     mk('삼성생명_든든암보험_약관.txt','제3조(보장개시일) 보장개시일 부터 90 일이 지난 날. '.repeat(9)),
     mk('현대해상_안심보험_상품설명서.txt','납입 기간 은 20년납. 만기 환급금 이 없는 순수보장형. '.repeat(9))]);
   return document.querySelector('#upState').textContent;
 });
 console.log('    '+st2.trim());
 is(/새로 0건/.test(st2),'새로 들어간 것이 없다');
 is(/건너뜀 3건/.test(st2),'건너뛴 것을 따로 센다 — 「넣었다」 에 섞지 않는다');
 n=await pg.evaluate(async()=>(await dbAll()).length);
 is(n===3,'겹쳐 쌓이지 않았다 ('+n+'건 그대로)');

 console.log('\n[5] 새 파일 한 개만 늘었을 때');
 const st3=await pg.evaluate(async()=>{
   const mk=(n,b)=>new File([b],n,{type:'text/plain'});
   await uploadFiles([
     mk('삼성생명_든든암보험_상품설명서.txt','주요 보장 : 암 진단비 3,000 만원. 가입한도 는 5,000 만원. '.repeat(8)),
     mk('삼성생명_신상품_약관.txt','제5조 재진단 암. 표적항암 약물허가치료 를 받은 경우. '.repeat(9))]);
   return document.querySelector('#upState').textContent;
 });
 console.log('    '+st3.trim());
 is(/새로 1건/.test(st3)&&/건너뜀 1건/.test(st3),'새 것 1건만 읽고 나머지는 건너뛴다');
 n=await pg.evaluate(async()=>(await dbAll()).length);
 is(n===4,'서재가 4건이 됐다 ('+n+')');

 console.log('\n[6] PDF 가 하나도 없는 폴더');
 const st4=await pg.evaluate(async()=>{
   await uploadFiles([new File(['x'],'읽을거리.docx'),new File(['y'],'사진.png')]);
   return document.querySelector('#upState').textContent;
 });
 is(/2개를 봤지만 PDF·TXT 가 없었습니다/.test(st4),'몇 개를 봤는지 말한다 — 조용히 끝나지 않는다');

 console.log('\n[7] 넣은 것이 홍보 발췌로 그대로 이어지는가');
 await pg.evaluate(()=>document.querySelector('.tab[data-t="promo"]').click());
 await pg.waitForTimeout(400);
 const rows=await pg.evaluate(()=>document.querySelectorAll('#pmDocs .pmrow').length);
 is(rows===4,'서재 4건이 홍보 발췌 목록에 그대로 보인다 ('+rows+')');
 await pg.evaluate(()=>{document.querySelectorAll('.pmck').forEach(c=>c.click())});
 await pg.click('#pmRun'); await pg.waitForTimeout(1500);
 const out=await pg.evaluate(()=>document.querySelector('#pmOut').innerText);
 is(/3,000/.test(out),'폴더로 넣은 상품설명서에서 보장 금액을 뽑는다');
 is(/제3조/.test(out),'폴더로 넣은 약관에서 조문 출처를 뽑는다');

 await br.close(); srv.close();
 console.log('\n──────────────────────────────');
 console.log(bad?'서재 폴더 점검 실패 — '+bad+'가지 어긋납니다.':'서재 폴더 점검 통과 — 다 맞습니다.');
 process.exit(bad?1:0);
})();
