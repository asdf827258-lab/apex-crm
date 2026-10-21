/* 👓 <b>읽히나</b> — 화면 전부를 열어 글씨·대비·누르는 것·문단을 잰다.

   사장님 말씀 2026-10-21 —
   「보장분석 전후 비교자료를 … 가독성이 너무 떨어져서 가독성을 올리는
    디자인으로 다시 짜줘」 · 「아니 다른 것들도 다 봐, <b>윤시현의 두뇌</b>도
    그렇고 다 가독성이 떨어져 보기 쉽게 정리해야되 <b>전부</b>」

   ★★ 재어 보니 <b>둘은 아픈 데가 달랐습니다.</b>
     · 따로 선 쪽(ba·블로그·전체지도·카톡보내기·계산기) — <b>글씨가 작다</b>
       1,084곳이 13px 밑이고, 누르는 것 204개 중 <b>131개</b>가 44px 밑입니다.
       보장 전·후는 글자 자리의 <b>93%</b>가 11~12px 이고 유지·배서·해지가
       <b>45×26px</b> 입니다 — 사장님이 제일 많이 누르시는 그 셋입니다.
     · 본체 안 — 글씨는 지켜지는데(13px 바닥) <b>흐리고 문단이 깁니다.</b>
       대비 4.5 밑이 1,550곳이고, 한 문단이 <b>1,644자</b>인 자리가 있습니다.

   ★★ <b>두뇌는 글씨가 아니라 덩어리였습니다.</b> 13px 밑 0곳 · 단추 32개 전부
     44px 인데도 안 읽히는 까닭은, 화면을 열면 같은 말을 두 번 하고(위 제목 +
     바로 밑 큰 카드) 문단이 101개 화면 중 <b>제일 길기</b> 때문입니다.
     「글씨를 키우면 된다」 로 끝낼 자리가 아니었습니다 (8번).

   여기서 재는 것 — <b>고쳐 주지 않습니다. 숨지 못하게 할 뿐입니다.</b>

     [1] 글씨가 <b>13px 밑</b>인 자리          (ba.html 이 스스로 적어 둔 바닥)
     [2] 글자 대비가 <b>4.5 밑</b>인 자리
     [3] 누르는 것이 <b>44px 밑</b>인 것        (이 저장소의 철칙)
     [4] 한 문단이 <b>80자</b>를 넘는 자리
     [5] 한 화면에 섞인 <b>이모지 가짓수</b>

   ⚠ 바닥(BASE)은 <b>지금 잰 수 그대로</b>입니다. 늘면 빨간불이고, 고치면
     이 수도 같이 내립니다 (0-1번). <b>올리지 마십시오</b> — 올리는 것만으로
     조용히 느슨해집니다.
   ⚠ 반쯤 비치는 바탕은 <b>겹쳐서</b> 셉니다 — 그냥 색으로 읽으면 어두운 카드
     위 흰 글씨를 거짓으로 고발합니다 (check-inputink 에서 데인 자리 · 8번).
   ⚠ 자를 브라우저에 <b>글자로 넘기지 않습니다</b> — 템플릿 문자열 안에서
     정규식의 \d 가 d 로 삭습니다 (같은 자리에서 또 데였습니다).            */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8943;
const MIME = { '.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json' };
const STUB = fs.readFileSync(path.join(ROOT,'scripts/smoke.js'),'utf8').split('const STUB = `')[1].split('`;')[0];
const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(url.parse(q.url).pathname.split('?')[0]);
  if(p==='/')p='/index.html'; let f=path.join(ROOT,p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){s.writeHead(404);s.end('');return;}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(s); });
let bad = 0;
const is = (ok,m)=>{ console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++; };
const sec = (t)=>console.log('\n'+t);

/* ── 바닥 — <b>2026-10-21 에 잰 수 그대로</b>입니다 ─────────────────── */
/* ★★ 2026-10-21 · 판 X147 에서 <b>다섯 쪽을 고치고 바닥을 내렸습니다</b>.
   괄호 안이 고치기 전 수입니다 — 올린 것이 아니라 <b>내린</b> 것입니다 (0-1번).
     13px 밑 글씨   1,084 → 3
     대비 4.5 밑      521 → 56
     44px 밑 단추     131 → 1                                           */
const BASE_SOLO = {
  'app/ba.html':      { small:0,  low:1,  tap:0, nm:'보장 전·후' },          /* 716 · 396 · 67 */
  'app/finance.html': { small:0,  low:17, tap:0, nm:'재무설계 계산기' },      /*   0 ·  52 ·  3 */
  'app/apex-map.html':{ small:0,  low:23, tap:0, nm:'APEX 전체 지도' },      /* 255 ·  25 · 33 */
  'edu-pipeline.html':{ small:0,  low:15, tap:1, nm:'카톡보내기·DB 업적관리' },/*  25 ·  48 ·  8 */
  'app/blog.html':    { small:3,  low:0,  tap:0, nm:'블로그' }               /* 100 ·   0 · 25 */
};
/* ⚠ 본체의 단추 바닥을 16 → 2 로 내린 것은 <b>고쳐서가 아니라 자를 날카롭게
   해서</b>입니다 — 누를 수 있는 줄 <b>안</b>에 든 글자(상품명 등)를 따로 세지
   않게 바꿨습니다. 손가락이 겨누는 것은 줄이지 그 안 글자가 아닙니다.
   <b>고친 것과 자를 고친 것을 섞어 적지 않습니다</b> (1번).              */
/* ★ 2026-10-21 · 1,550 → 1,462 — .page-tag · .page-desc <b>두 줄</b>을 한 칸씩
   진하게 했더니 93곳이 한 번에 읽혔습니다. 화면마다 서는 머리글이라 그렇습니다. */
const BASE_MAIN = { small:2, low:1462, tap:2, long:91 };
/* ★ 「제일 긴 문단」 을 <b>화면 전부에서</b> 재면 설정(settings)이 23,221자로
   맨 위에 섭니다 — 거기는 약관·개인정보를 그대로 싣는 자리라 긴 것이 맞습니다.
   그래서 <b>두뇌 하나</b>를 지목해 잽니다. 사장님이 「안 읽힌다」 하신 자리이고,
   거기 1,644자는 <b>읽으라고 쓴 안내문</b>이지 약관이 아닙니다.           */
const BASE_BRAIN_LONGEST = 1644;

function 잣대(){
  window.__lum=function(c){ var m=(c||'').match(/[\d.]+/g)||[0,0,0];
    var f=function(v){ v=parseFloat(v)/255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); };
    return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]); };
  window.__cr=function(a,b){ var x=window.__lum(a),y=window.__lum(b);
    return +(((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)).toFixed(2)); };
  window.__mix=function(fg,bg){
    var a=((fg||'').match(/[\d.]+/g)||['0','0','0','1']).map(Number),
        b=((bg||'').match(/[\d.]+/g)||['255','255','255','1']).map(Number),
        t=(a.length>3)?a[3]:1,i,o=[];
    for(i=0;i<3;i++)o.push(Math.round(a[i]*t+b[i]*(1-t)));
    return 'rgb('+o.join(', ')+')'; };
  window.__bg=function(el){ var e=el,st=[],out='rgb(255, 255, 255)',i;
    while(e){ var c=getComputedStyle(e).backgroundColor||'';
      var m=c.match(/[\d.]+/g),al=(m&&m.length>3)?Number(m[3]):(m?1:0);
      if(al>0)st.push(c); if(al>=1)break; e=e.parentElement; }
    for(i=st.length-1;i>=0;i--)out=window.__mix(st[i],out); return out; };
  window.__read=function(root){
    var R={n:0,small:0,minpx:99,tap:0,tapN:0,low:0,long:0,longest:0,emoji:{},worst:[]};
    var host=root||document;
    var all=[].slice.call(host.querySelectorAll('*'));
    all.forEach(function(e){
      if(!e.offsetParent&&e.tagName!=='BODY')return;
      var t=[].slice.call(e.childNodes).filter(function(n){return n.nodeType===3;})
              .map(function(n){return n.nodeValue.trim();}).join('');
      if(!t)return;
      var cs=getComputedStyle(e),px=Math.round(parseFloat(cs.fontSize));
      R.n++; if(px<R.minpx)R.minpx=px; if(px<13)R.small++;
      var c=window.__cr(cs.color,window.__bg(e));
      if(c<4.5){ R.low++; if(R.worst.length<3)R.worst.push({cr:c,px:px,t:t.slice(0,14)}); }
      var m=t.match(/[\u{1F300}-\u{1FAFF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}]/gu);
      if(m)m.forEach(function(x){R.emoji[x]=1;});
    });
    all.forEach(function(e){
      if(e.children.length)return;
      var t=(e.textContent||'').replace(/\s+/g,' ').trim();
      if(t.length>80){ R.long++; if(t.length>R.longest)R.longest=t.length; }
    });
    [].slice.call(host.querySelectorAll('button,a[role=button],.btn,[onclick]')).forEach(function(b){
      if(!b.offsetParent)return;
      if(b.querySelector('button'))return;          /* 담는 칸은 안 센다 */
      /* ★ <b>손가락이 겨누는 것</b>만 셉니다. 누를 수 있는 줄 <b>안에</b> 들어
         있는 글자(상품명 <b> 에 onclick 이 붙은 것)는 그 자체가 과녁이
         아니라 줄의 일부입니다 — 따로 세면 「22px 짜리 단추」 라고 거짓으로
         고발합니다. 줄은 이미 44px 입니다 (8번).                        */
      if(b.parentElement&&b.parentElement.closest('button,[onclick],a[role=button],.btn'))return;
      var r=b.getBoundingClientRect(); if(r.width<4||r.height<2)return;
      /* ⚠ <b>반올림해서</b> 셉니다 — 43.6px 는 화면에서 44px 입니다. 날값으로
         재면 글꼴이 늦게 실릴 때마다 수가 하나씩 흔들려, 같은 코드에 빨간불이
         왔다 갔다 합니다. 실제로 17 ↔ 16 으로 흔들렸습니다 (8번).        */
      R.tapN++; if(Math.round(r.height)<44)R.tap++;
    });
    R.emojiN=Object.keys(R.emoji).length; delete R.emoji;
    return R;
  };
}

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, timezoneId:CLK.TZ });
  /* ★ <b>시계를 박습니다</b> (판 X148 에서 보탬) — 팀 허브·데일리·체크판은
     「오늘」 에 따라 글자 자리가 바뀝니다. 안 박았더니 같은 코드가 한국
     23:13 에는 1462 로 초록, 자정을 넘긴 00:15 에는 1463 으로 빨간불이었습니다
     (#628 · 손으로 두 때에 박아 재어 알았습니다). 바닥 1462 는 main 이
     초록이던 그 때(2026-10-21 14:13Z)에 잰 수라 그 때를 박습니다 (8번).  */
  await CLK.pinIso(ctx, '2026-10-21T14:13:00Z');
  await ctx.route('**://**', rt=>{ const u=rt.request().url();
    if(u.indexOf('127.0.0.1:'+PORT)>=0)return rt.continue();
    return rt.fulfill({status:200,contentType:'application/javascript',body:''}); });
  const errs=[];
  const pg = await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e).slice(0,110)));
  await pg.addInitScript(STUB); await pg.addInitScript(잣대);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2500);
  /* 글꼴이 다 실린 뒤에 잽니다 — 안 그러면 글자 너비가 달라져 단추 높이가
     한두 개씩 바뀝니다 (위 ⚠ 와 같은 까닭).                            */
  try{ await pg.evaluate(()=>document.fonts&&document.fonts.ready); }catch(e){}
  const booted = await pg.evaluate(()=>typeof go==='function'&&typeof TABS!=='undefined');
  if(!booted){ console.log('✗ 앱이 뜨지 않았습니다'); await b.close(); srv.close(); process.exit(1); }
  await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'smoke',name:'점검',role:'owner',plan:'vip'};
    OS.session={user:{id:'smoke',email:'smoke@test'}}; window.toast=function(){};
  });
  /* 화면 목록은 <b>앱에게 묻습니다</b> — 여기 안 적습니다 (5번) */
  const tabs = await pg.evaluate(()=>{ const o=[];
    TABS.forEach(g=>(g.items||[]).forEach(i=>{ if(i&&i.id)o.push({id:i.id,t:i.title}); })); return o; });

  sec('[1] <b>본체</b> 화면을 다 열어 잰다');
  const M = { small:0, low:0, tap:0, tapN:0, long:0, longest:0, n:0 }, rows=[];
  for(const t of tabs){
    let r=null;
    try{ r = await pg.evaluate(id=>{ go(id);
      /* ⚠ 덮개·토스트가 떠 있으면 그 안 단추까지 세어 <b>한 판에 하나씩</b>
         수가 흔들립니다. CI 에서만 빨간불이 나는 그 꼴입니다 (8번).      */
      document.querySelectorAll('#osOvl,#osGuideOvl,#osGuide,#osLoginGate,.toast,#toast')
        .forEach(function(x){x.remove();});
      var d=document.getElementById('dynPane')||document.querySelector('.tab-pane.on')||document.body;
      return window.__read(d); }, t.id); }catch(e){}
    await pg.waitForTimeout(40);
    if(!r)continue;
    rows.push({ ...t, ...r });
    if(process.env.READ_DEBUG && r.longest>1000) console.log('      · 긴 문단 '+r.longest+'자 ← '+t.t+' ('+t.id+')');
    if(process.env.READ_DEBUG && r.tap) console.log('      · 작은 단추 '+r.tap+'개 ← '+t.t+' ('+t.id+')');
    ['small','low','tap','tapN','long','n'].forEach(k=>{ M[k]+=r[k]; });
    if(r.longest>M.longest)M.longest=r.longest;
  }
  is(rows.length>50, '앱이 가진 화면 '+rows.length+'개를 열었다 — 글자 자리 '+M.n+'곳');
  is(M.small<=BASE_MAIN.small,
     '본체에 <b>13px 밑 글씨</b> '+M.small+'곳 — 바닥 '+BASE_MAIN.small);
  is(M.low<=BASE_MAIN.low,
     '본체에 <b>대비 4.5 밑</b> '+M.low+'곳 — 바닥 '+BASE_MAIN.low+
     ' (전체 '+M.n+'곳 중 '+Math.round(100*M.low/Math.max(1,M.n))+'%)');
  is(M.tap<=BASE_MAIN.tap,
     '본체에 <b>44px 밑 단추</b> '+M.tap+'개 — 바닥 '+BASE_MAIN.tap+' (전부 '+M.tapN+'개)');
  is(M.long<=BASE_MAIN.long,
     '본체에 <b>80자 넘는 문단</b> '+M.long+'곳 — 바닥 '+BASE_MAIN.long);
  const 두뇌 = rows.filter(r=>r.id==='brain')[0];
  is(!!두뇌 && 두뇌.longest<=BASE_BRAIN_LONGEST,
     '<b>윤시현의 두뇌</b>의 제일 긴 문단 '+((두뇌&&두뇌.longest)||'?')+'자 — 바닥 '+
     BASE_BRAIN_LONGEST+' (사장님이 「안 읽힌다」 하신 그 자리 · 글씨는 다 13px 위인데 덩어리가 큽니다)');
  const 긴곳 = rows.slice().sort((a,b)=>b.longest-a.longest).slice(0,3);
  console.log('      문단이 긴 곳 — ' + 긴곳.map(r=>r.t.slice(0,12)+' '+r.longest+'자').join(' · ') +
              '   ⚠ 설정은 약관을 그대로 싣는 자리라 긴 것이 맞습니다');
  const 흐린곳 = rows.slice().sort((a,b)=>b.low-a.low).slice(0,5);
  console.log('      흐린 글씨가 많은 곳 — ' +
    흐린곳.map(r=>r.t.slice(0,12)+' '+r.low).join(' · '));
  await pg.close();

  sec('[2] <b>따로 선 쪽</b> — 글씨가 작은 자리들');
  for(const f of Object.keys(BASE_SOLO)){
    const B = BASE_SOLO[f];
    if(!fs.existsSync(path.join(ROOT,f))){ is(false,B.nm+' — 파일이 없습니다 ('+f+')'); continue; }
    const p2 = await ctx.newPage();
    p2.on('pageerror',e=>errs.push(B.nm+': '+String(e).slice(0,90)));
    await p2.addInitScript(STUB); await p2.addInitScript(잣대);
    let r = null;
    try{
      await p2.goto('http://127.0.0.1:'+PORT+'/'+f,{waitUntil:'domcontentloaded',timeout:45000});
      /* ⚠ 블로그는 글을 <b>늦게</b> 그립니다 — 1.6초에 재면 쟀다 말았다 해서
         같은 코드에 수가 달라집니다(88 ↔ 100). 헛 빨간불이 제일 나쁩니다(8번).
         넉넉히 기다리고, 그래도 흔들리면 바닥을 느슨하게가 아니라 <b>자를</b>
         고칩니다.                                                        */
      await p2.waitForTimeout(f==='app/blog.html'?3200:1800);
      try{ await p2.evaluate(()=>document.fonts&&document.fonts.ready); }catch(e){}
      /* 보장 전·후는 <b>견본을 넣어야</b> 계약 줄이 섭니다 — 빈 화면을 재면
         「다 고쳐졌다」 로 보입니다 (8번). 견본 이름은 홍철호입니다 (3번). */
      if(f==='app/ba.html'){ try{ await p2.evaluate(()=>{ localStorage.clear(); doSample(); go('edit'); });
        await p2.waitForTimeout(800); }catch(e){} }
      r = await p2.evaluate(()=>window.__read(document.body));
    }catch(e){}
    await p2.close();
    if(!r){ is(false,B.nm+' — 열지 못했습니다'); continue; }
    const ok = r.small<=B.small && r.low<=B.low && r.tap<=B.tap;
    is(ok, B.nm+' — 13px밑 <b>'+r.small+'</b>/'+B.small+
           ' · 대비밑 <b>'+r.low+'</b>/'+B.low+
           ' · 44px밑 <b>'+r.tap+'</b>/'+B.tap+
           '  (글자 '+r.n+'곳 · 제일 작은 글씨 '+r.minpx+'px · 이모지 '+r.emojiN+'가지)');
  }

  sec('[3] 조용한가');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 화면이 전보다 안 읽히게 됐습니다.')
                 :'✓ 전보다 안 읽히게 된 자리가 없습니다.');
  process.exit(bad?1:0);
})();
