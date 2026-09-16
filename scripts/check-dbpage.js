/* <b>1,000줄에서 조용히 잘리던 것.</b>

   사장님 말씀 — 「DB통합CRM에서, 대쉬보드에서 DB한도가 1,000으로 끝나」.

   서버(PostgREST)는 <b>한 판에 1,000줄까지만</b> 줍니다. `.limit(4000)` 을
   적어도 그 위에서 잘립니다. 그런데 <b>에러가 안 납니다.</b> 1,000줄을
   받아 들고 「다 받았다」고 믿습니다. 배정은 1,293건인데 대시보드는
   1,000건에서 끝났고, 「오늘 손댈 사람」에서는 <b>사람이 통째로</b>
   빠졌습니다. 숫자가 그럴듯해서 아무도 못 봅니다 (1번).

   고친 방법 — <b>쪽을 나눠 끝까지</b> 읽습니다(range). 덜 온 판이 오면
   끝이고, 꽉 찬 판이면 더 있습니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 쪽 나누는 함수가 <b>정말로</b> 1,000 너머를 읽는다 (본체)
     [2] CRM 것도 똑같이 읽는다 — 파일이 둘이라 각자 잰다
     [3] 부르는 자리가 <b>전부</b> 그 함수를 쓴다 — 한 자리만 빠져도 거기서 샌다
     [4] 쪽을 나눌 때 <b>차례를 못 박는다</b> — 안 그러면 줄이 겹치거나 샌다
     [5] 덜 읽었으면 <b>덜 읽었다고 말한다</b> — 말 없이 자르는 것이 그 버릇이다

   ※ 여기서 쓰는 함수는 <b>배포되는 소스에서 그대로 떼어 냅니다.</b>
     베껴 쓰면 베낀 것을 재게 됩니다.                                   */
const fs=require('fs'),path=require('path');
const ROOT=process.cwd();
let bad=0; const is=(ok,m)=>{console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++;};

const APP=fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
const CRM=fs.readFileSync(path.join(ROOT,'db-crm.html'),'utf8');

/* 소스에서 함수 한 덩이를 떼어 진짜로 돌려 본다 */
function pull(src,from,to,ret){
  const a=src.indexOf(from); if(a<0)return null;
  const b=src.indexOf(to,a); if(b<0)return null;
  try{ return new Function(src.slice(a,b)+'\nreturn '+ret+';')(); }catch(e){ return null; }
}

/* 서버 흉내 — <b>무엇을 달라 하든 1,000줄까지만</b> 준다.
   진짜 서버가 하는 일이 이것이다. 넘는 줄은 에러 없이 안 온다. */
function fakeServer(total){
  let hits=0;
  const rows=[]; for(let i=0;i<total;i++)rows.push({id:'r'+String(i).padStart(6,'0')});
  return {
    hits:()=>hits,
    read:(a,b)=>{ hits++;
      const want=Math.min(b-a+1,1000);          /* ← 서버의 상한 */
      return Promise.resolve({data:rows.slice(a,a+want),error:null});
    }
  };
}

(async()=>{
  console.log('\n[1] 본체 — 쪽 나누는 함수가 <b>1,000 너머</b>를 읽는다');
  const app=pull(APP,'var AR_PAGE=1000;','/* ── 불러오기','{page:arPageAll,size:AR_PAGE}');
  is(!!app, '본체에 쪽 나누는 함수가 있다 — arPageAll');
  if(!app){ console.log('\n✗ arPageAll 을 못 찾았습니다'); process.exit(1); }
  is(app.size===1000, '한 판을 <b>1,000줄</b>로 센다 — 서버 상한과 같다');

  const s1=fakeServer(1293);
  const r1=await app.page(s1.read);
  is(r1.data.length===1293,
     '1,293건을 <b>전부</b> 읽는다 — '+r1.data.length+'건 (예전엔 1,000에서 끝났다)');
  is(new Set(r1.data.map(x=>x.id)).size===r1.data.length,
     '<b>같은 줄이 두 번 안 온다</b> — 겹치면 건수가 부풀어 더 나쁘다');
  is(s1.hits()===2, '판을 <b>필요한 만큼만</b> 부른다 — '+s1.hits()+'번 (7번)');
  is(r1.cut===false, '끝까지 읽었으면 <b>잘랐다고 안 한다</b>');

  /* 딱 떨어지는 수 — 1,000·2,000 에서 한 판 더 부르고 끝나야 한다 */
  const s2=fakeServer(2000);
  const r2=await app.page(s2.read);
  is(r2.data.length===2000,
     '딱 <b>2,000건</b>이어도 하나도 안 빠진다 — '+r2.data.length+'건 (여기서 멈추기 쉽다)');

  const s3=fakeServer(0);
  const r3=await app.page(s3.read);
  is(r3.data.length===0&&s3.hits()===1, '<b>한 건도 없을 때</b> 한 번만 묻고 끝낸다');

  console.log('\n[2] 덜 읽었으면 <b>덜 읽었다고</b> 말한다 (1번)');
  const s4=fakeServer(9000);
  const r4=await app.page(s4.read,4000);
  is(r4.data.length===4000, '정해 둔 만큼에서 <b>멈춘다</b> — '+r4.data.length+'건 (7번)');
  is(r4.cut===true, '멈췄으면 <b>cut 으로 말한다</b> — 이게 없으면 또 조용히 잘린다');
  is(APP.indexOf('AR.callsCut')>0, '본체가 그 말을 <b>받아 둔다</b> — AR.callsCut');

  console.log('\n[3] 서버가 <b>거절</b>하면 성공처럼 말하지 않는다 (1번)');
  const r5=await app.page(()=>Promise.resolve({error:{message:'막힘'}}));
  is(!!r5.error, '거절을 <b>그대로 올린다</b> — 빈 목록을 「없다」로 바꾸지 않는다');

  console.log('\n[4] CRM 것도 <b>똑같이</b> 읽는다 — 파일이 둘이라 각자 잰다');
  const crm=pull(CRM,'const CRM_PAGE=1000;','async function loadAll()','{page:pageAll,size:CRM_PAGE}');
  is(!!crm, 'CRM 에도 쪽 나누는 함수가 있다 — pageAll');
  if(crm){
    const s6=fakeServer(1293);
    const r6=await crm.page(s6.read);
    is(r6.data.length===1293, 'CRM 도 1,293건을 <b>전부</b> 읽는다 — '+r6.data.length+'건');
    is(new Set(r6.data.map(x=>x.id)).size===r6.data.length, 'CRM 도 <b>겹치지 않는다</b>');
    const s7=fakeServer(9000);
    const r7=await crm.page(s7.read,4000);
    is(r7.data.length===4000&&r7.cut===true, 'CRM 도 <b>멈추면 멈췄다고</b> 말한다');
  }

  console.log('\n[5] 부르는 자리가 <b>전부</b> 쪽을 나눈다 — 한 자리만 빠져도 거기서 샌다');
  /* 큰 표를 <b>range 없이</b> 부르는 자리가 남아 있으면 거기서 또 잘린다.
     1,000줄을 넘을 수 있는 표만 본다 — 작은 표까지 잡으면 헛알람이다 (8번). */
  const BIG=['dbs','calls','clients','attendance'];
  function leaks(src,name){
    const out=[];
    /* 한 자리는 <b>다음 sb.from( 전까지</b>다. 예전에는 「;」나 줄 끝을 찾아
       잘랐더니, Promise.all([...]) 안에서 줄 여럿을 <b>한 덩이로 삼켜</b>
       뒤에 있는 자리를 아예 못 봤다 — 안 잡는 점검이 되어 있었다 (8번). */
    const re=new RegExp('from\\(\\s*[\'"]('+BIG.join('|')+')[\'"]\\s*\\)','g');
    let m;
    while((m=re.exec(src))){
      const rest=src.slice(m.index+m[0].length, m.index+m[0].length+400);
      const nxt=rest.indexOf('sb.from(');
      const tail=(nxt>0?rest.slice(0,nxt):rest);
      if(/^\s*\.(update|insert|upsert|delete)\b/.test(tail))continue;   /* 쓰는 것은 안 본다 */
      if(!/\.select\(/.test(tail))continue;
      if(/\.range\(/.test(tail))continue;
      if(/\.eq\([^)]*\)[\s\S]*\.(single|maybeSingle)\(/.test(tail))continue;
      if(/\.limit\(\s*[1-9]\d{0,2}\s*\)/.test(tail))continue;           /* 일부러 몇 줄만 */
      /* 빠져나가는 표시는 <b>줄 위에</b> 적는 것이 자연스럽다 — 앞쪽도 같이 본다 */
      const near=src.slice(Math.max(0,m.index-220),m.index)+tail;
      if(/「쪽나누기OK」/.test(near))continue;                            /* 코드에 적어 빠져나간다 */
      out.push(m[1]+' — '+tail.replace(/\s+/g,' ').slice(0,60));
    }
    return out;
  }
  const la=leaks(APP,'본체'), lc=leaks(CRM,'CRM');
  /* 하나만 적으면 고치고 나서야 다음 것이 나온다 — <b>다 적는다</b> */
  is(la.length===0, '본체에 <b>쪽을 안 나누고</b> 큰 표를 부르는 자리가 없다'+
     (la.length?(' — '+la.length+'곳'):''));
  la.forEach(x=>console.log('      ← '+x));
  is(lc.length===0, 'CRM 에도 없다'+(lc.length?(' — '+lc.length+'곳'):''));
  lc.forEach(x=>console.log('      ← '+x));

  console.log('\n[6] 쪽을 나눌 때 <b>차례를 못 박는다</b>');
  /* 차례가 흔들리면 쪽 사이에서 같은 줄이 두 번 오거나 아예 빠진다.
     .range( 를 쓰는 자리마다 .order( 가 같이 있어야 한다. */
  function unordered(src){
    const out=[];
    const re=/from\(\s*['"](\w+)['"]\s*\)([\s\S]{0,400}?\.range\([^)]*\))/g;
    let m;
    while((m=re.exec(src)))if(!/\.order\(/.test(m[2]))out.push(m[1]);
    return out;
  }
  const ua=unordered(APP), uc=unordered(CRM);
  is(ua.length===0, '본체는 쪽마다 <b>차례를 준다</b>'+(ua.length?(' ← '+ua.join(', ')):''));
  is(uc.length===0, 'CRM 도 준다'+(uc.length?(' ← '+uc.join(', ')):''));
  /* 같은 값이 수두룩한 칸 하나만으로 나누면 여전히 샌다 — 두 칸을 준다 */
  const twoKeys=(CRM.match(/\.order\([^)]*\)\s*\.order\(/g)||[]).length;
  is(twoKeys>=3, 'CRM 은 <b>두 칸으로</b> 못 박는다 — '+twoKeys+'곳 (배정일은 같은 날이 수두룩하다)');

  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 아직 어딘가에서 줄이 잘립니다')
                 :'✓ 1,000줄을 넘겨도 한 줄도 안 잘리고 끝까지 읽습니다.');
  process.exit(bad?1:0);
})();
