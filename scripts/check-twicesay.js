/* 🗣️ <b>머리글이 한 말을 바로 밑에서 또 하나</b> — 화면 전부를 열어 센다.

   사장님 말씀 2026-10-21 —
   「아니 다른 것들도 다 봐, <b>윤시현의 두뇌</b>도 그렇고 다 가독성이
    떨어져 <b>보기 쉽게 정리</b>해야되 <b>전부</b>」 (대장 X146)

   ★★ 두뇌를 열어 보니 <b>글씨가 작아서가 아니었습니다.</b> 13px 밑 글씨가
     0곳이고 단추도 다 44px 인데 안 읽혔습니다. 까닭은 <b>같은 말을 두 번</b>
     하기 때문이었습니다 —
       머리글   「윤시현의 두뇌 — 당신의 관점·전략·화법을 담은 제2의 두뇌입니다…」
       바로 밑  「제2의 두뇌 · SECOND BRAIN / 🧠 윤시현의 두뇌 / 상담·세일즈…」
     폰에서 그 되풀이가 <b>첫 화면을 통째로</b> 먹어, 이 화면이 하는 일
     (물어보기)은 다섯 화면 아래에 있었습니다.

   ★ 재어 보니 <b>두뇌만이 아니었습니다</b> — 화면 92개 중 <b>스물</b>이
     그랬습니다. 그래서 자를 세웁니다. 고쳐 주지는 않습니다 —
     <b>숨지 못하게</b> 할 뿐입니다 (0-1번 · 8번).

   ── 재는 법 ──────────────────────────────────────────────────────
     화면마다 머리글(.page-hd 의 제목+설명)과 <b>바로 다음 토막</b>의 글을
     낱말로 갈라 견줍니다. 머리글 낱말의 <b>절반 넘게</b>가 바로 밑에 또
     있으면 「두 번 말했다」 로 셉니다.
   ⚠ <b>두 글자 어간</b>으로 견줍니다 — 「화법을 / 화법으로」 「두뇌 /
     두뇌입니다」 는 같은 말입니다. 어미까지 맞춰 보면 두뇌가 41% 로 빠져
     나갔습니다(실제로 그랬습니다).
   ⚠ <b>한 글자 낱말은 안 셉니다</b> — 조사·토막이 섞여 수가 흔들립니다.
   ⚠ 같은 (제목+바로 밑) 짝이 두 번 나오면 <b>한 번만</b> 셉니다 — 한 화면을
     두 이름으로 여는 자리가 있어(제안서 비교 / 한장 보험료 비교) 그냥 세면
     같은 자리를 두 번 고발합니다 (8번).

   ⚠ 바닥은 <b>지금 잰 수 그대로</b>입니다. 늘면 빨간불이고, 고치면 같이
     내립니다. <b>올리지 마십시오</b> (0-1번).                            */
const { chromium } = require('playwright');
const CLK = require('./lib-clock.js');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8981;
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

/* ── 바닥 — 2026-10-23 (판 X170) 에 잰 수 그대로 ───────────────────
   20 → 17 로 내려서 적습니다. 고친 셋은 —
     · <b>윤시현의 두뇌</b> — 영웅 띠를 빼고, 물어보는 칸을 맨 위로 올렸습니다
       (이 화면이 하는 일입니다). 5.2화면 → 5.0화면.
     · <b>출발 점검</b> — 머리글과 딱 같은 말을 하던 영웅 띠를 뺐습니다.
     · <b>외부글 심의필터</b> — toolDedup 이 지웠습니다(아래).
   ★ 손으로 하나씩 지우지 않고 <b>지우개를 하나</b> 두었습니다 —
     toolDedup(body,title,desc) 가 도구 화면에서 <b>글자가 딱 같은</b>
     카드 머리칸만 지웁니다. 조금이라도 다르면 그 카드가 하려는 다른
     말이므로 그대로 둡니다 (8번). 그래서 「비슷하게 두 번」 하는 자리는
     아직 남아 있습니다 — <b>다음 판의 일</b>이고, 이 자가 지켜봅니다.   */
const BASE = 17;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, timezoneId:CLK.TZ });
  await CLK.pinIso(ctx, '2026-10-21T14:13:00Z');
  await ctx.route('**://**', rt=>{ const u=rt.request().url();
    if(u.indexOf('127.0.0.1:'+PORT)>=0)return rt.continue();
    return rt.fulfill({status:200,contentType:'application/javascript',body:''}); });
  const errs=[];
  const pg = await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e).slice(0,110)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2500);
  const booted = await pg.evaluate(()=>typeof go==='function'&&typeof TABS!=='undefined');
  if(!booted){ console.log('✗ 앱이 뜨지 않았습니다'); await b.close(); srv.close(); process.exit(1); }
  await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'smoke',name:'점검',role:'owner',plan:'vip'};
    OS.session={user:{id:'smoke',email:'smoke@test'}}; window.toast=function(){};
  });
  /* 화면 목록은 앱에게 묻습니다 — 여기 안 적습니다 (5번) */
  const tabs = await pg.evaluate(()=>{ const o=[];
    TABS.forEach(g=>(g.items||[]).forEach(i=>{ if(i&&i.id)o.push({id:i.id,t:i.title}); })); return o; });

  sec('[1] 화면을 다 열어 <b>머리글과 바로 밑</b>을 견준다');
  const rows=[];
  for(const t of tabs){
    let r=null;
    try{ r=await pg.evaluate(id=>{ go(id);
      document.querySelectorAll('#osOvl,#osGuideOvl,#osGuide,#osLoginGate,.toast,#toast')
        .forEach(function(x){x.remove();});
      var d=document.getElementById('dynPane'); if(!d)return null;
      var hd=d.querySelector('.page-hd'); if(!hd)return null;
      var ti=(hd.querySelector('.page-title')||{}).textContent||'';
      var de=(hd.querySelector('.page-desc')||{}).textContent||'';
      var nx=hd.nextElementSibling;
      while(nx&&!(nx.textContent||'').trim())nx=nx.nextElementSibling;
      if(!nx)return null;
      var first=(nx.textContent||'').replace(/\s+/g,' ').trim().slice(0,400);
      /* 두 글자 어간 · 한 글자는 안 셈 (위 ⚠) */
      var w=function(s){ return (s||'').replace(/[^가-힣A-Za-z0-9]+/g,' ').split(' ')
        .filter(function(x){return x.length>1;}).map(function(x){return x.slice(0,2).toLowerCase();}); };
      var hw=w(ti+' '+de), fw=w(first), set={};
      fw.forEach(function(x){set[x]=1;});
      return { ti:ti, first:first.slice(0,46), hw:hw.length,
               hit:hw.filter(function(x){return set[x];}).length };
    },t.id); }catch(e){}
    await pg.waitForTimeout(30);
    if(r)rows.push({...t,...r});
  }
  is(rows.length>50, '머리글이 선 화면 '+rows.length+'개를 열었다');
  const 본={}; rows.forEach(r=>{ const k=r.ti+'|'+r.first; if(본[k])r.dupe=1; 본[k]=1; });
  const 두번 = rows.filter(r=>!r.dupe && r.hw>=4 && r.hit/r.hw>=0.5)
                  .sort((a,b)=>b.hit/b.hw-a.hit/a.hw);
  is(두번.length<=BASE,
     '머리글을 <b>바로 밑에서 또 하는 화면</b> '+두번.length+'개 — 바닥 '+BASE+
     ' (머리글이 선 화면 '+rows.length+'개 중)');
  if(두번.length) console.log('      ' + 두번.slice(0,8).map(r=>
    r.t+' '+Math.round(100*r.hit/r.hw)+'%').join(' · ') + (두번.length>8?' …':''));

  sec('[2] <b>지우개가 한 곳</b>인가 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  is((SRC.match(/function toolDedup\(/g)||[]).length===1,
     'toolDedup 이 <b>한 번만</b> 선언돼 있다');
  is((SRC.match(/toolDedup\(body,meta\.title,meta\.desc\)/g)||[]).length===1,
     '도구 화면이 <b>그 지우개를 부른다</b>');
  /* ★ 되돌려 보는 자리 — 지우개가 「딱 같을 때만」 지우는지 (8번) */
  const 엄함 = await pg.evaluate(()=>{
    if(typeof toolDedup!=='function')return null;
    var one='<div class="card-hd"><div class="card-title"><span class="ci">🛡️</span>같은제목</div>'+
            '<div class="card-desc">같은설명</div></div><div class="card-body">몸</div>';
    return { 같을때: toolDedup(one,'같은제목','같은설명').indexOf('card-hd')<0,
             제목다름: toolDedup(one,'다른제목','같은설명').indexOf('card-hd')>=0,
             설명다름: toolDedup(one,'같은제목','다른설명').indexOf('card-hd')>=0 };
  });
  is(!!엄함 && 엄함.같을때, '딱 같으면 <b>지운다</b>');
  is(!!엄함 && 엄함.제목다름, '제목이 다르면 <b>안 지운다</b> — 헛것이 더 나쁩니다 (8번)');
  is(!!엄함 && 엄함.설명다름, '설명이 다르면 <b>안 지운다</b>');

  sec('[3] 두뇌가 <b>물어보는 칸부터</b> 여는가 (사장님이 이름을 대신 자리)');
  const 두뇌 = await pg.evaluate(()=>{ go('brain');
    var d=document.getElementById('dynPane'); if(!d)return null;
    var hd=d.querySelector('.page-hd'); if(!hd)return null;
    var ta=d.querySelector('#brainQ'); if(!ta)return null;
    return { 위:Math.round(ta.getBoundingClientRect().top - hd.getBoundingClientRect().top),
             길이:Math.round(d.scrollHeight) };
  });
  /* ⚠ 600 으로 두었더니 띄를 도로 넣고도 초로였습니다(되돌림 328px).
     지금 168px 이므로 <b>300</b> 으로 조립니다 — 안 울리는 알람은 알람이 아닙니다 (8번). */
  is(!!두뇌 && 두뇌.위<300,
     '물어보는 칸이 머리글에서 <b>'+((두뇌&&두뇌.위)||'?')+'px</b> 안에 있다 (300 밑)' +
     ' — 전에는 영웅 띠·DB·상담·지식 칸에 밀려 2,900px 아래였습니다');

  sec('[4] 조용한가');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?' ← '+errs.slice(0,2).join(' · '):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad? '✗ '+bad+'개 — 같은 말을 두 번 하는 자리가 늘었습니다.'
                 : '✓ 머리글을 두 번 말하는 자리가 늘지 않았습니다.');
  process.exit(bad?1:0);
})();
