/* <b>DB 종류가 사람이 읽는 차례로 서는가.</b>

   사장님 말씀 — 「DB 종류가 순서가 뒤죽박죽인데, 혹시 DB 종류 순서를
   정렬할 수 있으면 좋을 것 같다. CRM 에서도」.

   종류는 <b>손으로 적는 글자</b>라 새로 만든 차례대로 쌓입니다. 실제로
   이렇게 서 있었습니다 —
     보장분석5DB · 보장분석6DB · 일반 · 보장분석3DB · 소개 · 보장분석7DB …
   건수순으로 세워도 마찬가지입니다. 사람은 <b>1·2·3</b> 을 찾습니다.

   그래서 <b>이름 안의 숫자를 숫자로 읽어</b> 견줍니다(자연 정렬).
   글자 순서로만 견주면 「10」 이 「2」 보다 앞에 섭니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 숫자를 <b>숫자로</b> 읽는다 — 2DB 가 10DB 보다 앞이다
     [2] 띄어쓰기로 갈린 것이 <b>나란히</b> 선다 — 사장님 눈에 보이게
     [3] <b>본체와 CRM 이 한 칸도 안 다르다</b> — 두 파일에 같은 규칙이 있다
     [4] 차례를 바꿔도 <b>새 DB 의 기본 종류가 안 바뀐다</b>
     [5] 화면에서도 <b>정말로</b> 그 차례로 선다

   ※ 두 파일(app/index.html · db-crm.html)은 서로를 싣지 않아 규칙을 한 곳에
     둘 수가 없습니다. 그래서 여기서 <b>실제로 세워 보고 견줍니다</b> —
     한쪽만 고치면 그 자리에서 빨간불이 켜집니다 (5번).                */
const { chromium } = require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const ROOT=process.cwd(),PORT=8905;
const srv=http.createServer((rq,rs)=>{
  let p=decodeURIComponent(url.parse(rq.url).pathname);let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!fs.existsSync(f)){rs.writeHead(404);rs.end('no');return;}
  rs.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(f).pipe(rs);
});
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

/* <b>진짜 배포되는 소스</b>에서 그대로 떼어 낸다 — 베껴 쓰면 베낀 것을 잰다 */
function pull(file,from,to,ret){
  const s=fs.readFileSync(path.join(ROOT,file),'utf8');
  const a=s.indexOf(from);
  if(a<0)return null;
  const b=s.indexOf(to,a);
  if(b<0)return null;
  try{ return new Function(s.slice(a,b)+'\nreturn '+ret+';')(); }catch(e){ return null; }
}

/* 사장님 서버에 실제로 들어 있는 종류들 (2026-09 · 34가지).
   고객 이름이 아니라 <b>종류 이름</b>이라 그대로 쓴다. */
const REAL=['보장분석5DB','보장분석6DB','일반','보장분석3DB','소개','보장분석7DB',
  '보장분석11DB','보장분석10DB','방송','지인','보장분석1DB','보장분석4DB','보장분석12DB',
  '보장분석8DB','홈쇼핑DB+','농협','보장분석15DB','보장분석14DB','보장분석9DB','보장분석17DB',
  '방송DB','보장분석2DB','토스DB','보장분석 4DB','개척','보장분석 15 DB','보장분석 11DB',
  '프로모션DB','보장분석DB','NS홈쇼핑 화재보험','DB 12 인터넷매니저','보장분석',
  '보장분석 10DB','보장분석 17DB'];

(async()=>{
  console.log('\n[1] 숫자를 <b>숫자로</b> 읽는다');
  const A=pull('app/index.html','function arSrcKey(','function arSrcSort(L)',
               '{key:arSrcKey,cmp:arSrcCmp}');
  const C=pull('db-crm.html','function srcKeyOf(','function srcSort(L)',
               '{key:srcKeyOf,cmp:srcCmp}');
  is(!!A, '본체에 차례를 정하는 곳이 있다 — arSrcCmp');
  is(!!C, 'DB 통합 CRM 에도 있다 — srcCmp');
  if(!A||!C){ console.log('\n✗ 차례를 정하는 곳을 못 찾았습니다'); srv.close(); process.exit(1); }

  const a=REAL.slice().sort(A.cmp);
  const at=x=>a.indexOf(x);
  is(at('보장분석2DB')<at('보장분석10DB'),
     '<b>2DB 가 10DB 보다 앞</b>이다 — 글자 순서로 견주면 뒤집힌다');
  is(at('보장분석9DB')<at('보장분석10DB')&&at('보장분석10DB')<at('보장분석17DB'),
     '9 → 10 → 17 로 <b>차례대로</b> 선다');
  const nums=a.filter(x=>/^보장분석\s*\d/.test(x)).map(x=>+(x.match(/\d+/)[0]));
  is(nums.join(',')===nums.slice().sort((x,y)=>x-y).join(','),
     '보장분석 계열이 <b>전부 숫자순</b>이다 — '+nums.join('·'));

  console.log('\n[2] 띄어쓰기로 갈린 것이 <b>나란히</b> 선다');
  const pairs=[['보장분석 4DB','보장분석4DB'],['보장분석 10DB','보장분석10DB'],
               ['보장분석 11DB','보장분석11DB'],['보장분석 15 DB','보장분석15DB'],
               ['보장분석 17DB','보장분석17DB']];
  const far=pairs.filter(p=>Math.abs(at(p[0])-at(p[1]))!==1);
  is(far.length===0,
     '같은 것이 띄어쓰기로 갈려 있어도 <b>바로 옆에</b> 선다'+
     (far.length?(' ← '+far.map(p=>p.join('/')).join(', ')):'')+
     ' (합쳐 주지는 않는다 — 우리가 고쳐 쓰지 않는다 · 1번)');
  is(A.key('보장분석 4DB')===A.key('보장분석4DB'),
     '<b>견줄 때만</b> 띄어쓰기를 지운다 — 저장된 글자는 그대로다');

  console.log('\n[3] 본체와 CRM 이 <b>한 칸도 안 다르다</b> (5번)');
  const c=REAL.slice().sort(C.cmp);
  const diff=a.map((x,i)=>x===c[i]?null:(i+'번째 '+x+' ↔ '+c[i])).filter(Boolean);
  is(diff.length===0, '34가지를 세워 보니 <b>차례가 같다</b>'+
     (diff.length?(' ← '+diff.slice(0,3).join(' / ')):''));
  /* 섞어서 넣어도 같은 답이 나오나 — 우연히 같은 것이 아님을 본다 */
  const shuffled=REAL.slice().sort(()=>Math.random()-0.5);
  is(JSON.stringify(shuffled.slice().sort(A.cmp))===JSON.stringify(shuffled.slice().sort(C.cmp)),
     '<b>섞어서 넣어도</b> 같은 차례가 나온다');

  console.log('\n[4] 차례를 바꿔도 <b>새 DB 의 기본 종류</b>는 안 바뀐다');
  const CRM=fs.readFileSync(path.join(ROOT,'db-crm.html'),'utf8');
  is(!/srcList\(\)\[0\]\s*\|\|\s*"일반"/.test(CRM),
     '목록 <b>첫 번째</b>를 기본값으로 쓰지 않는다 — 차례를 바꾸면 엉뚱한 것이 미리 골라진다');
  is(/indexOf\("일반"\)/.test(CRM), '기본은 <b>「일반」</b> 이다');

  console.log('\n[5] 화면에서도 <b>정말로</b> 그 차례로 선다');
  await new Promise(r=>srv.listen(PORT,r));
  const b=await chromium.launch();
  const page=await b.newPage({viewport:{width:430,height:900}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,120)));
  await page.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2400);
  const V=await page.evaluate(seed=>{
    (0,eval)(seed);
    const L=arSrcSort(['보장분석10DB','보장분석2DB','일반','보장분석 2DB','보장분석1DB']);
    /* TFA 「오늘 손댈 사람」 의 종류 칩이 실제로 그 차례로 서는가 */
    AR.loaded=true; AR.busy=false; AR.cliRows=[];
    AR.db=['보장분석10DB','보장분석2DB','보장분석1DB','일반'].map((sv,i)=>({
      id:'s'+i,who:'me',name:'홍길동',region:'광주',src:sv,stage:'부재',
      appt:'',days:9,n:1,cAt:'',pAt:''}));
    /* TFA 「오늘 손댈 사람」 칸을 <b>실제로</b> 연다 — 거기에 종류 단추가 선다 */
    AR.cat='touch'; AR.tkAll=false; AR.tks=''; AR.tk='all';
    try{ localStorage.setItem('apex_ar_cat','touch'); }catch(e){}
    try{ go('airep'); }catch(e){}
    return {sorted:L};
  },`OS.session={user:{id:'me'}};
     OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip'};
     window.osLoadProfile=function(){};window.osProfileApply=function(){};
     window.osShowLoginGate=function(){};window.toast=function(){};`);
  is(V.sorted.join(' · ')==='보장분석1DB · 보장분석 2DB · 보장분석2DB · 보장분석10DB · 일반',
     '앱 안에서 세워 보니 <b>차례대로</b> — '+V.sorted.join(' · '));
  await page.waitForTimeout(900);
  const chips=await page.evaluate(()=>
    [].slice.call(document.querySelectorAll('#dynPane .ar-fsrc .ar-fc'))
      .map(e=>e.textContent.replace(/\d+$/,'').trim()).filter(x=>x&&!/종류 전체/.test(x)));
  /* <b>칩이 없으면 통과시키지 않는다.</b> 「칩이 없는 판이라 통과」 는
     아무것도 안 재는 것이다 — 안 울리는 알람이다 (8번). */
  is(chips.length>=4, 'TFA 에 <b>종류 단추가 선다</b> — '+chips.length+'개'+
     (chips.length?(' ('+chips.join(' · ')+')'):''));
  is(chips.length>=4&&JSON.stringify(chips)===JSON.stringify(chips.slice().sort(A.cmp)),
     '그 단추들이 <b>차례대로</b> 선다 — '+chips.join(' · '));
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — DB 종류가 아직 뒤죽박죽입니다')
                 :'✓ DB 종류가 본체·CRM 어디서나 사람이 읽는 차례로 섭니다.');
  process.exit(bad?1:0);
})();
