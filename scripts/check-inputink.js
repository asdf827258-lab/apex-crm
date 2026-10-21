/* ✍️ <b>칸에 적는 글씨가 보이나</b> — 사장님 말씀 2026-10-21
   「검색창 글씨가 검은색 글씨로 쓰게 해줘, <b>글씨가 안보여!</b>」

   ★★ 재어 보니 서랍 찾기 칸(navFind)이 <b>흰 글씨</b>였습니다. 칸 바탕은
     --t-bg(#F2F4F6) 이라 대비가 <b>1.1 : 1</b> — 글자가 아예 안 보입니다.
     칸을 누르면 바탕이 --t-card(#FFFFFF) 로 바뀌어 <b>1.00 : 1</b>,
     흰 종이에 흰 글씨입니다. 사장님은 적으면서도 무엇을 적었는지 못 보셨습니다.

   ★ 왜 그랬나 — 그 칸은 <b>어두운 서랍</b>에 있었습니다. 목각 옷(--t-*)으로
     갈아입으며 바탕만 밝아졌고, 글자색 #fff 는 <b>그대로 남았습니다.</b>
     「옷을 바꾸면 글자색도 같이 본다」 를 지키는 자가 없었습니다.

   ★★ <b>아무도 이것을 안 보고 있었습니다.</b> check-naked 는 「옷이 있나」,
     check-onepal 은 「색이 표에 있나」, check-inkrole 은 「선 색을 글자색으로
     쓰나」 를 봅니다 — <b>사람이 적는 칸의 글자가 보이나</b> 는 빈 자리였습니다.

   여기서 재는 것 (8번 — 결과를 잰다):

     [1] 화면을 다 열어 <b>적는 칸</b>을 모아 글자색 대비를 잰다
     [2] 누른 상태(focus)도 잰다 — 바탕이 바뀌는 칸이 있다
     [3] 안 보이는 칸은 <b>0개</b>여야 한다 (기준선을 두지 않는다)
     [4] 흐린 글씨(placeholder)도 읽을 만한가 — 여기는 기준선이 있다

   ⚠ 안 재는 것 (헛것 금지 · 8번) —
     · 체크칸·단추·숨은 칸·크기가 0인 칸 (글자를 적는 자리가 아닙니다)
     · <b>흐린 글씨는 3.0</b> 으로 봅니다. 목각이 정한 --t-sub2(#8B95A1)가
       흰 바탕에서 2.8 이라, 4.5 로 재면 목각 옷 전체를 고발합니다.
       본문 글자는 <b>4.5</b> 로 봅니다.                                   */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8932;
const MIME = { '.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json' };
const STUB = fs.readFileSync(path.join(ROOT,'scripts/smoke.js'),'utf8').split('const STUB = `')[1].split('`;')[0];
const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]);
  if(p==='/')p='/index.html'; const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end('');return;}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(s); });
let bad = 0;
const is = (ok,m)=>{ console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)bad++; };

/* 읽을 만한가 — 본문은 4.5, 흐린 글씨는 3.0 (위 ⚠ 참고) */
const 본문선 = 4.5, 흐린선 = 3.0;
/* 흐린 글씨는 목각 옷이 정한 값이라 지금 있는 만큼을 바닥으로 둡니다.
   늘면 빨간불이고, 줄이면 이 수도 같이 내립니다 (0-1번).               */
const BASE_흐림 = 1;        /* 재어 본 수 그대로입니다 — 서랍 찾기 칸의
                               흐린 글씨(--t-sub2 #8B95A1 on --t-bg)가 2.8 입니다.
                               목각이 정한 색이라 이 판에서 안 바꿉니다. */

/* ── 브라우저 안에서 쓸 자 ──────────────────────────────────────────
   ⚠⚠ 이 토막을 <b>글자(템플릿 문자열)로 넘기지 않습니다.</b> 처음에 그렇게
     짰다가 정규식의 `\d` 가 템플릿 안에서 `d` 로 삭아 버렸습니다. 그러자
     바탕색을 못 읽어 전부 <b>검정</b>으로 보고 칸 198자리를 거짓으로
     고발했습니다. 함수로 넘기면 그런 삭음이 없습니다 (8번).            */
function 잣대(){
  /* 색 하나의 밝기 (WCAG) */
  window.__lum=function(c){
    var m=(c||'').match(/[\d.]+/g)||[0,0,0];
    var f=function(v){ v=parseFloat(v)/255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); };
    return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]);
  };
  /* 두 색의 대비 */
  window.__cr=function(a,b){
    var x=window.__lum(a),y=window.__lum(b);
    return +(((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)).toFixed(2));
  };
  /* fg(알파) 를 bg 위에 올린 색 */
  window.__mix=function(fg,bg){
    var a=((fg||'').match(/[\d.]+/g)||['0','0','0','1']).map(Number),
        b=((bg||'').match(/[\d.]+/g)||['255','255','255','1']).map(Number),
        t=(a.length>3)?a[3]:1, i, o=[];
    for(i=0;i<3;i++)o.push(Math.round(a[i]*t+b[i]*(1-t)));
    return 'rgb('+o.join(', ')+')';
  };
  /* 글자가 <b>실제로 얹히는 바탕</b> — 비치는 것을 거슬러 올라가 겹칩니다.
     ★★ <b>반쯤 비치는 바탕은 겹쳐서</b> 셉니다. 그냥 색으로 읽으면 요금
       화면의 칸 다섯(rgba(255,255,255,.09) 위의 흰 글씨)을 거짓으로
       고발합니다 — 그 칸은 <b>어두운 카드</b> 위에 얹힌 유리칸이라 사람
       눈에는 잘 보입니다 (8번).                                        */
  window.__bg=function(el){
    var e=el, stack=[], out='rgb(255, 255, 255)', i;
    while(e){
      var c=getComputedStyle(e).backgroundColor||'';
      var m=c.match(/[\d.]+/g), al=(m&&m.length>3)?Number(m[3]):(m?1:0);
      if(al>0)stack.push(c);
      if(al>=1)break;                      /* 더 이상 안 비친다 */
      e=e.parentElement;
    }
    for(i=stack.length-1;i>=0;i--)out=window.__mix(stack[i],out);
    return out;
  };
  window.__SKIP=['checkbox','radio','range','color','file','hidden','submit','button','image','reset'];
  /* 한 화면에서 <b>적는 칸</b>을 모읍니다. 같은 칸을 여러 화면에서 또 세지
     않도록 이름으로 한 번만 담습니다.                                   */
  window.__one=function(el){
    var cs=getComputedStyle(el),bg=window.__bg(el);
    return { id:el.id||'', cls:(''+(el.className||'')).slice(0,30),
      ph:(el.placeholder||'').slice(0,30), color:cs.color, bg:bg,
      cr:window.__cr(cs.color,bg) };
  };
  window.__writable=function(el){
    if(el.tagName==='INPUT'&&window.__SKIP.indexOf((el.type||'text').toLowerCase())>=0)return false;
    var r=el.getBoundingClientRect();
    return !!el.offsetParent && r.width>=8 && r.height>=6;
  };
  window.__inks=function(where,seen){
    var out=[];
    [].slice.call(document.querySelectorAll('input,textarea')).forEach(function(el){
      if(!window.__writable(el))return;
      var key=(el.id||'')+'|'+(el.className||'')+'|'+(el.placeholder||'').slice(0,20);
      if(seen[key])return; seen[key]=1;
      var o=window.__one(el); o.where=where; out.push(o);
    });
    return out;
  };
}

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:900} });
  await ctx.route('**://**', rt=>{ const u=rt.request().url();
    if(u.indexOf('127.0.0.1:'+PORT)>=0)return rt.continue();
    return rt.fulfill({status:200,contentType:'application/javascript',body:''}); });
  const pg = await ctx.newPage();
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,120)));
  await pg.addInitScript(STUB);
  await pg.addInitScript(잣대);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2500);

  const booted = await pg.evaluate(()=>typeof go==='function'&&typeof TABS!=='undefined');
  if(!booted){ console.log('✗ 앱이 뜨지 않았습니다'); await b.close(); srv.close(); process.exit(1); }
  await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'smoke',name:'점검',role:'owner',plan:'vip'};
    OS.session={user:{id:'smoke',email:'smoke@test'}};
    window.toast=function(){};
    window.__seen={};
  });

  console.log('\n[1] 화면을 다 열어 <b>적는 칸</b>의 글자색을 잰다');
  /* 화면 목록을 <b>여기 안 적습니다</b> — 앱의 TABS 를 그대로 읽습니다 (5번) */
  const tabs = await pg.evaluate(()=>{
    const out=[]; TABS.forEach(g=>(g.items||[]).forEach(i=>{ if(i&&i.id)out.push(i.id); })); return out; });
  let rows = await pg.evaluate(()=>__inks('서랍·홈',window.__seen));
  for(const t of tabs){
    let r=[];
    try{ r = await pg.evaluate(tb=>{ go(tb); return __inks(tb,window.__seen); }, t); }catch(e){}
    rows = rows.concat(r);
    await pg.waitForTimeout(60);
  }
  is(rows.length>0, '화면 '+tabs.length+'개에서 적는 칸 <b>'+rows.length+'자리</b>를 찾았다');

  console.log('\n[2] <b>누른 상태</b>도 잰다 — 바탕이 바뀌는 칸이 있다');
  /* ★ navFind 는 누르면 바탕이 --t-bg → --t-card 로 밝아집니다. 안 누른
     상태만 재면 1.1 을 보고 「조금 어둡네」 로 끝날 수 있습니다 — 실제로
     사장님이 보신 것은 <b>1.00</b>, 흰 종이에 흰 글씨입니다.           */
  const foc = await pg.evaluate(()=>{
    go('home');
    var out=[];
    [].slice.call(document.querySelectorAll('input,textarea')).forEach(function(el){
      if(!window.__writable(el))return;
      try{ el.focus(); }catch(e){}
      out.push(window.__one(el));
      try{ el.blur(); }catch(e){}
    });
    return out;
  });
  is(foc.length>0, '눌러 보고도 잰다 — 홈·서랍에서 <b>'+foc.length+'자리</b>');

  console.log('\n[3] <b>안 보이는 칸이 없다</b> — 기준선을 두지 않습니다');
  const 모두 = rows.concat(foc.map(x=>({ ...x, where:'누른 상태' })));
  const 안보임 = 모두.filter(x=>x.cr < 본문선);
  안보임.forEach(x=>console.log('      ✗ ['+x.where+'] '+(x.id||x.cls||'?')+
    ' — 대비 <b>'+x.cr+'</b> (글자 '+x.color+' · 바탕 '+x.bg+')'+
    (x.ph?(' · 「'+x.ph+'」'):'')));
  is(안보임.length===0,
     '읽을 수 없는 칸 '+안보임.length+'자리 — 본문 글자는 '+본문선+' 이상이어야 한다'+
     (안보임.length?' ← 사장님이 보신 그 자리입니다':' (적으면서 무엇을 적는지 보입니다)'));

  console.log('\n[4] <b>흐린 글씨</b>(placeholder)도 읽을 만한가');
  /* ⚠ 여기는 <b>기준선이 있습니다</b> — 흐린 글씨 색은 목각이 정한 값이라
     한 판에 다 바꿀 것이 아닙니다. 늘면 빨간불, 줄이면 바닥도 내립니다. */
  const ph = await pg.evaluate(()=>{
    var out=[],seen={};
    [].slice.call(document.querySelectorAll('input,textarea')).forEach(function(el){
      if(!window.__writable(el)||!el.placeholder)return;
      var k=el.placeholder.slice(0,20); if(seen[k])return; seen[k]=1;
      var c=getComputedStyle(el,'::placeholder').color,bg=window.__bg(el);
      out.push({ ph:k, color:c, bg:bg, cr:window.__cr(c,bg) });
    });
    return out;
  });
  const 흐림나쁨 = ph.filter(x=>x.cr < 흐린선);
  흐림나쁨.forEach(x=>console.log('      · 「'+x.ph+'」 '+x.cr+
    ' (글자 '+x.color+' · 바탕 '+x.bg+')'));
  is(흐림나쁨.length <= BASE_흐림,
     '흐린 글씨가 '+흐린선+' 밑인 칸 '+흐림나쁨.length+'자리 — 바닥 '+BASE_흐림+
     (흐림나쁨.length>BASE_흐림?(' ← '+흐림나쁨.slice(0,3).map(x=>'「'+x.ph+'」'+x.cr).join(' · ')):''));

  console.log('\n[5] 조용한가');
  is(errs.length===0, '터진 곳이 없다'+(errs.length?(' ← '+errs[0]):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad?('✗ '+bad+'개 — 적는 글씨가 안 보이면 사장님이 무엇을 적었는지 모릅니다.')
                 :'✓ 적는 칸의 글씨가 다 보입니다.');
  process.exit(bad?1:0);
})();
