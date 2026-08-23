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
     4-1. <b>중복은 받지 않는다 — 철칙이다.</b> 이름을 바꿔도 · 빈칸만
          달라도 · 한 묶음 안에 두 번 있어도 · 지문 없이 예전에 쌓아 둔
          것과 겹쳐도 <b>안 들어간다</b>. 서재가 부풀면 홍보 발췌에 같은
          조항이 두 번 뜨고, 고객 앞에서 어느 것이 최신인지 알 수 없다
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
 /* 잠금은 이제 <b>골라 쓰는 것</b>이다 — 안 걸려 있으면 그냥 열린다.
    걸려 있을 때만 푼다. 없는 것을 기다리면 여기서 20초를 버린다. */
 if (await pg.$('#lockPw')) {
   await pg.fill('#lockPw', 'test1234'); await pg.click('#lockGo');
   await pg.waitForSelector('#lockOv', { state: 'detached', timeout: 10000 });
 }
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

 console.log('\n[5-1] 중복은 받지 않는다 — 철칙');
 const BODY='제3조(보장개시일) 보장개시일 부터 90 일이 지난 날의 다음날부터 지급합니다. '.repeat(9);
 const put=(files)=>pg.evaluate(async fs=>{
   await uploadFiles(fs.map(x=>new File([x.b],x.n,{type:'text/plain'})));
   return {msg:document.querySelector('#upState').textContent,n:(await dbAll()).length};
 },files);
 let base=(await put([{n:'삼성생명_철칙_약관.txt',b:BODY}]));
 is(/새로 1건/.test(base.msg),'  처음 것은 들어간다');
 const n0=base.n;
 let r=await put([{n:'삼성생명_철칙_약관_최종.txt',b:BODY}]);
 is(r.n===n0,'  이름만 바꾼 같은 파일은 안 들어간다');
 is(/이름만 다른 같은 문서/.test(r.msg),'  무엇과 같은지 밝힌다');
 r=await put([{n:'삼성생명_철칙_약관_사본.txt',b:BODY.replace(/ /g,'  ')+'\n\n'}]);
 is(r.n===n0,'  빈칸·줄바꿈만 다른 같은 내용도 안 들어간다');
 r=await put([{n:'현대해상_둘.txt',b:'가입한도 는 3,000 만원. 건강체 할인. '.repeat(9)},
              {n:'현대해상_둘(1).txt',b:'가입한도 는 3,000 만원. 건강체 할인. '.repeat(9)}]);
 is(r.n===n0+1,'  한 묶음 안에 같은 파일이 둘이면 한 번만 들어간다');
 /* 지문을 붙이기 전 방식으로 쌓아 둔 것과 겹쳐도 막혀야 한다 */
 await pg.evaluate(async b=>{ await dbPut({id:'u_old_ch',title:'옛날에넣은_약관',file:'옛날에넣은_약관.txt',
   co:'',kind:'약관',pages:0,chars:b.length,scanned:false,text:b,pdf:null,mtime:'2026-01-01',src:'up'}); },
   '제11조 재진단암 을 보장합니다. 표적항암 약물허가치료 포함. '.repeat(9));
 const nb=await pg.evaluate(async()=>(await dbAll()).length);
 r=await put([{n:'이름만_다른것.txt',b:'제11조 재진단암 을 보장합니다. 표적항암 약물허가치료 포함. '.repeat(9)}]);
 is(r.n===nb,'  지문 없이 쌓여 있던 옛 자료와 겹쳐도 안 들어간다');
 r=await put([{n:'교보생명_진짜다른것.txt',b:'제9조 뇌혈관질환 (I60~I69) 으로 진단확정된 경우. '.repeat(9)}]);
 is(r.n===nb+1,'  진짜 다른 문서는 그대로 들어간다 — 헛것을 막지 않는다');
 /* 지문이 실제로 저장되는가 */
 const hasSha=await pg.evaluate(async()=>{
   const a=await dbAll(); const up=a.filter(x=>x.src==='up'&&x.id!=='u_old_ch');
   return up.length&&up.every(x=>x.sha&&x.tsha);
 });
 is(hasSha,'  새로 넣은 것에는 바이트·글자 지문이 남는다');

 console.log('\n[6] PDF 가 하나도 없는 폴더');
 const st4=await pg.evaluate(async()=>{
   await uploadFiles([new File(['x'],'읽을거리.docx'),new File(['y'],'사진.png')]);
   return document.querySelector('#upState').textContent;
 });
 is(/2개를 봤지만 PDF·TXT 가 없었습니다/.test(st4),'몇 개를 봤는지 말한다 — 조용히 끝나지 않는다');

 console.log('\n[7] 넣은 것이 홍보 발췌로 그대로 이어지는가');
 await pg.evaluate(()=>document.querySelector('.tab[data-t="promo"]').click());
 await pg.waitForTimeout(400);
 /* 서재에 실제로 몇 건 있는지 세어 견준다 — 숫자를 박아 두면
    위에서 한 건 더 넣을 때마다 여기가 깨진다 */
 const inLib=await pg.evaluate(async()=>(await dbAll()).length);
 const rows=await pg.evaluate(()=>document.querySelectorAll('#pmDocs .pmrow').length);
 is(rows===inLib,'서재에 있는 '+inLib+'건이 홍보 발췌 목록에 그대로 보인다 ('+rows+')');
 await pg.evaluate(()=>{document.querySelectorAll('.pmck').forEach(c=>c.click())});
 await pg.click('#pmRun'); await pg.waitForTimeout(1500);
 const out=await pg.evaluate(()=>document.querySelector('#pmOut').innerText);
 is(/3,000/.test(out),'폴더로 넣은 상품설명서에서 보장 금액을 뽑는다');
 is(/제3조/.test(out),'폴더로 넣은 약관에서 조문 출처를 뽑는다');

 console.log('\n[8] 태블릿에서는 폴더 단추를 안 보여준다');
 /* 사장님 주 기기가 갤럭시탭이다. 그런데 <b>안드로이드 크롬은 폴더 고르기를
    지원하지 않는다.</b> 속성 존재로는 못 가른다 — 'webkitdirectory' in input 은
    true 인데도 실제로는 폴더가 안 열린다. 그래서 단추만 멀쩡히 보이고 눌러도
    아무 일이 없었다. 터치 기기에는 끌어다 놓기도 없으니 「폴더째로 끌어다
    놓으세요」 도 할 수 없는 말이다. <b>보이는데 안 되는 것이 제일 나쁘다.</b>

    ※ 파일 고르기 창의 진짜 동작은 여기서 잴 수 없다. 여기서 보는 것은
      「그 기기에서 무엇을 보여 주고 무엇을 감추는가」 뿐이다. */
 const DEV=[
   {n:'컴퓨터(크롬)', dir:true,  touch:false,
    ua:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'},
   {n:'갤럭시탭(안드로이드)', dir:false, touch:true,
    ua:'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36'},
   {n:'아이폰', dir:false, touch:true,
    ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Mobile/15E148 Safari/604.1'},
   {n:'아이패드(스스로 Mac 이라고 함)', dir:false, touch:true,
    ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15'}
 ];
 for(const d of DEV){
   const cx=await br.newContext({userAgent:d.ua,hasTouch:d.touch,viewport:{width:1200,height:900}});
   const p2=await cx.newPage();
   await p2.route('**/api/market**',r=>r.abort());
   await p2.goto(U,{waitUntil:'domcontentloaded',timeout:60000});
   /* 잠금은 이제 <b>골라 쓰는 것</b>이다 — 안 걸려 있으면 그냥 열린다.
      걸려 있을 때만 푼다. 없는 것을 기다리면 여기서 20초를 버린다. */
   if (await p2.$('#lockPw')) {
     await p2.fill('#lockPw', 'test1234'); await p2.click('#lockGo');
     await p2.waitForSelector('#lockOv', { state: 'detached', timeout: 10000 });
   }
   await p2.evaluate(()=>document.querySelector('.tab[data-t="lib"]').click());
   await p2.waitForTimeout(400);
   const r=await p2.evaluate(()=>{
     const b=document.getElementById('btnUpDir');
     const drop=document.getElementById('upDrop');
     const hint=document.getElementById('libHint');
     const inp=document.getElementById('upFiles');
     return {
       can: typeof canPickFolder==='function' ? canPickFolder() : null,
       shown: b ? getComputedStyle(b).display!=='none' : null,
       drag: drop ? /끌어다/.test(drop.innerText) : null,
       many: !!(inp && inp.multiple),
       hintDir: hint ? /폴더를 그대로 끌어다/.test(hint.innerText) : null,
       hintMany: hint ? /한꺼번에/.test(hint.innerText) : null
     };
   });
   is(r.can===d.dir, d.n+' — 폴더 고르기 '+(d.dir?'되는':'안 되는')+' 기기로 본다 ('+r.can+')');
   is(r.shown===d.dir, d.n+' — 「폴더 통째로 넣기」 단추를 '+(d.dir?'보여준다':'감춘다'));
   is(r.drag===d.dir, d.n+' — 「끌어다 놓으세요」 를 '+(d.dir?'적는다':'안 적는다')+' (손가락으로는 못 끈다)');
   is(r.many===true, d.n+' — PDF 를 여러 개 고르는 길은 언제나 열려 있다');
   if(!d.dir) is(r.hintMany===true && r.hintDir===false,
     d.n+' — 안내가 「여러 개 한꺼번에」 로 바뀐다 (폴더 이야기를 안 한다)');
   await cx.close();
 }
 /* 판정이 한 곳에서만 나오는가 — 두 곳이면 한쪽만 고쳐진다 */
 const src=fs.readFileSync(path.join(ROOT,'app/상담자료/미끼레이더/index.html'),'utf8');
 is((src.match(/function canPickFolder\(/g)||[]).length===1,'폴더가 되는지 답하는 곳은 하나다');
 /* 주석에는 「'webkitdirectory' in ... 로 판정하면 안 된다」 고 <b>적어 두어야</b>
    하므로, 주석을 걷어내고 코드만 본다. 넓게 잡으면 헛것을 잡는다. */
 const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
 is(!/'webkitdirectory'\s+in\s+/.test(code),
    '속성이 있는지로 판정하지 않는다 — 안드로이드는 속성이 있어도 폴더를 못 연다');
 /* 칸 목록이 두 벌이면 한쪽만 늘어난다 — 실제로 promo 가 한쪽에만 있었다 */
 is(!/\bconst TABS\s*=/.test(code),'칸 목록은 한 벌뿐이다 (GROUPS · SUBNAME)');
 const subs=(code.match(/subs:\[([^\]]*)\]/g)||[]).join(',');
 is(/'promo'/.test(subs),'홍보 발췌도 그 한 벌에 들어 있다');

 await br.close(); srv.close();
 console.log('\n──────────────────────────────');
 console.log(bad?'서재 폴더 점검 실패 — '+bad+'가지 어긋납니다.':'서재 폴더 점검 통과 — 다 맞습니다.');
 process.exit(bad?1:0);
})();
