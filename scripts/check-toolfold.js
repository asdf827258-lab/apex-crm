/* 📦 <b>🧰 도구 화면이 접히나</b> — 그리고 <b>찾을 때는 펴지나</b>.

   판 X181 · 사장님 말씀 2026-10-24 —
   ⚠ 처음에 <b>X180</b> 으로 적었다가 밀었습니다 — 같은 날 다른 세션이 PR #647 로
     X180 을 먼저 적어 main 에 들어갔습니다(11번 ③). 이번 달 두 번째입니다.
   「카테고리에서 <b>비슷한 메뉴가 너무 많아서</b> 어떻게 줄여서 효과적으로
    관리할지 이 부분도 해결하고 싶어」 · (그림을 보시고) 「응 그렇게 해줘
    <b>접기부터</b> 넣어줘」

   ★★ <b>재어 보고 알았습니다 — 분류는 이미 맞았고 접히지가 않았습니다.</b>
     손대기 전 이 화면이 폰(390×844)에서 <b>6,892px · 8.2화면</b>이고, 칸
     여섯이 다 펴진 채로 줄 <b>107개</b>가 이어졌습니다. 접는 칸은 <b>0개</b>.
     「카테고리를 줄인다」 가 아니라 <b>접는다</b> 가 답이었습니다.
   ★★ 사장님은 이것을 <b>2026-09-24 에도</b> 말씀하셨습니다 — 「메뉴가 너무
     많아서 … <b>토스 어플처럼 쉽게</b>」. 그때 「언제 쓰는지」 여섯 묶음은
     만들었는데 <b>칸으로 접는 것은 사용가이드에만</b> 들어갔습니다
     (판 X159·X160). 이 화면이 그대로 남아 있었습니다 — <b>같은 말씀을 두 번
     하시게 한 자리</b>라, 이 자를 세워 다시는 안 새게 합니다 (8번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 처음 열면 <b>여섯 칸이 다 접혀</b> 있고 한 화면 안에 선다
     [2] 칸마다 <b>몇 개인지</b> 적혀 있다 (접어 두고 안 적으면 깜깜합니다)
     [3] 누르면 <b>그 칸만</b> 펴지고, 다른 칸을 누르면 앞의 것이 접힌다
     [4] ★★ <b>찾으면 저절로 펴진다</b> — 접어 두고 안 펴면 찾기가 죽습니다
     [5] 줄은 <b>하나도 안 없어졌다</b> — 펴면 그대로 다 있다 (1번)
     [6] 조용한가
   ⚠ 글씨·대비·44px 은 <b>check-read</b> 가 셉니다 — 여기서 또 안 셉니다 (5번). */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8961;
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

/* ⚠ 폰 한 화면은 844px 입니다. 접은 채로 그 안에 서야 「한눈에」 입니다.
   ★ 1,100px 로 둡니다 — 머리글·찾기 칸·꼬리말이 같이 서기 때문입니다.
     접기 전이 6,892px 이었으니 이 선은 넉넉하면서도 「안 접힘」 은 못 지납니다.
   ⚠ 기계마다 글꼴이 달라 제목 접히는 자리가 바뀝니다 — 못 박은 px 로 재면
     제 기계에서만 초록입니다(check-guide 에서 데인 자리). 그래서 <b>접기
     전후를 같은 브라우저 안에서</b> 견줍니다 (8번).                     */
const 접은바닥 = 1100;

(async()=>{
  await new Promise(r=>srv.listen(PORT,r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  await ctx.route('**://**', rt=>rt.request().url().indexOf('127.0.0.1:'+PORT)>=0
    ? rt.continue() : rt.fulfill({status:200,contentType:'text/css',body:''}));
  const errs = [];
  const pg = await ctx.newPage();
  pg.on('pageerror',e=>errs.push(String(e).slice(0,90)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await pg.waitForTimeout(2600);
  await pg.evaluate(()=>{
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'t',name:'점검',role:'branch_manager',plan:'vip'};
    OS.session={user:{id:'t',email:'t@test'}}; window.toast=function(){};
    go('tools');
  });
  await pg.waitForTimeout(900);
  const 잰다 = ()=>pg.evaluate(()=>({
    칸:document.querySelectorAll('#dynPane .tlp-c .tlp-head').length,
    편칸:document.querySelectorAll('#dynPane .tlp-c.on').length,
    줄:[].slice.call(document.querySelectorAll('#dynPane .tlp-row')).filter(x=>x.offsetParent).length,
    높이:document.getElementById('dynPane').scrollHeight,
    개수:[].slice.call(document.querySelectorAll('#dynPane .tlp-head .t b')).map(x=>x.textContent.trim()),
    토글:[].slice.call(document.querySelectorAll('#dynPane .tlp-head'))
          .filter(x=>/tlpToggle/.test(x.getAttribute('onclick')||'')).length
  }));

  sec('[1] 처음 열면 <b>다 접혀</b> 있나');
  const 처음 = await 잰다();
  is(처음.칸 >= 6, '접는 칸이 <b>'+처음.칸+'개</b> 선다 (여섯 갈래)');
  is(처음.편칸 === 0, '처음에는 <b>한 칸도 안 펴져</b> 있다 — 편 칸 '+처음.편칸);
  is(처음.줄 === 0, '줄이 <b>한 줄도 안 보인다</b> — 보이는 줄 '+처음.줄);
  is(처음.높이 <= 접은바닥,
     '접은 채로 <b>'+처음.높이+'px</b> ('+(처음.높이/844).toFixed(1)+'화면) ≤ '+접은바닥+'px'+
     (처음.높이>접은바닥?' ← 안 접혔습니다. 손대기 전이 6,892px(8.2화면) 이었습니다':''));
  is(처음.토글 === 처음.칸,
     '칸 머리가 <b>전부 tlpToggle</b> 을 부른다 — '+처음.토글+'/'+처음.칸+
     ' (자가 이것으로 이 줄을 찾습니다)');

  sec('[2] 칸마다 <b>몇 개인지</b> 적혀 있나 (접어 두고 안 적으면 깜깜합니다)');
  const 수있나 = 처음.개수.filter(x=>/^\d+개$/.test(x)).length;
  is(수있나 === 처음.칸,
     '여섯 칸이 다 「N개」 를 적는다 — '+(처음.개수.join(' · ')||'(없음)'));

  sec('[3] 누르면 <b>그 칸만</b> 펴지나');
  await pg.evaluate(()=>document.querySelectorAll('#dynPane .tlp-head')[1].click());
  await pg.waitForTimeout(380);
  const 둘째 = await 잰다();
  is(둘째.편칸 === 1 && 둘째.줄 > 0,
     '둘째 칸을 누르니 <b>한 칸만</b> 펴지고 줄 '+둘째.줄+'개가 선다 ('+둘째.높이+'px)');
  await pg.evaluate(()=>document.querySelectorAll('#dynPane .tlp-head')[3].click());
  await pg.waitForTimeout(380);
  const 넷째 = await 잰다();
  is(넷째.편칸 === 1 && 넷째.줄 !== 둘째.줄,
     '넷째를 누르니 <b>앞의 것이 접힌다</b> — 편 칸 '+넷째.편칸+' · 줄 '+둘째.줄+' → '+넷째.줄);
  /* 접었다 폈다가 <b>제자리로</b> — 같은 칸을 또 누르면 접힌다 */
  await pg.evaluate(()=>document.querySelectorAll('#dynPane .tlp-head')[3].click());
  await pg.waitForTimeout(380);
  const 도로 = await 잰다();
  is(도로.편칸 === 0 && 도로.높이 <= 접은바닥,
     '같은 칸을 또 누르면 <b>도로 접힌다</b> — '+도로.높이+'px');

  sec('[4] ★★ <b>찾으면 저절로 펴지나</b> — 안 펴면 찾기가 죽습니다 (1번)');
  /* 이름을 손으로 안 적습니다 — 앱이 가진 화면에서 <b>골라</b> 칩니다 (5번) */
  const 낱말 = await pg.evaluate(()=>{
    var out=[],seen={},id;
    for(id in NAV_WHEN){
      if(!Object.prototype.hasOwnProperty.call(NAV_WHEN,id))continue;
      var it=(typeof navItemOf==='function')?navItemOf(id):null;
      if(!it||!it.title)continue;
      /* ⚠ <b>글자를 빼서 붙이면 안 됩니다.</b> 처음에 제목에서 공백·숫자를
         통째로 지우고 앞 세 글자를 떴더니 「고객 365일」 이 <b>「고객일」</b> 이
         되었습니다 — 제목에 없는 글자라 찾기가 당연히 0개이고, 자는 앱을
         거짓으로 고발했습니다. <b>제목에 그대로 있는 토막</b>을 떠야 합니다.
         이어진 한글 덩어리에서만 떠냅니다 (8번).                        */
      var run=String(it.title).match(/[가-힣]{2,}/g)||[];
      var w=run.length?run[0].slice(0,3):'';
      if(w.length>=2&&!seen[w]){seen[w]=1;out.push(w);}
      if(out.length>=5)break;
    }
    return out;
  });
  is(낱말.length >= 3, '칠 낱말을 앱에서 골랐다 — '+낱말.join(' · '));
  for(const q of 낱말){
    await pg.evaluate(v=>tlpSetQ(v), q);
    await pg.waitForTimeout(340);
    const r = await 잰다();
    is(r.칸 > 0 && r.편칸 === r.칸 && r.줄 > 0,
       '「'+q+'」 → 고른 칸 '+r.칸+'개가 <b>전부 펴지고</b> 줄 '+r.줄+'개가 보인다');
  }
  await pg.evaluate(()=>tlpSetQ('ㅄㅄ없는낱말ㅄㅄ'));
  await pg.waitForTimeout(340);
  const 헛 = await 잰다();
  is(헛.칸 === 0 && 헛.줄 === 0, '없는 말에는 <b>칸이 안 선다</b> — 지어내지 않습니다 (1번)');

  sec('[5] 줄이 <b>하나도 안 없어졌나</b> (1번)');
  await pg.evaluate(()=>tlpSetQ(''));
  await pg.waitForTimeout(340);
  const 합 = await pg.evaluate(()=>{
    /* 칸을 하나씩 다 펴서 줄을 센다 — 접힌 것은 숨긴 것이지 버린 것이 아닙니다 */
    var hs=[].slice.call(document.querySelectorAll('#dynPane .tlp-head')), n=0, i;
    for(i=0;i<hs.length;i++){
      hs[i].click();
      n+=[].slice.call(document.querySelectorAll('#dynPane .tlp-row')).filter(x=>x.offsetParent).length;
      hs=[].slice.call(document.querySelectorAll('#dynPane .tlp-head'));
    }
    return { 센줄:n, 적힌수:[].slice.call(document.querySelectorAll('#dynPane .tlp-head .t b'))
             .reduce(function(a,e){return a+(parseInt(e.textContent,10)||0);},0),
             앱이아는수:(typeof tlpCount==='function')?tlpCount():-1 };
  });
  is(합.센줄 === 합.적힌수,
     '하나씩 펴서 센 줄 <b>'+합.센줄+'개</b> = 칸에 적힌 수의 합 '+합.적힌수+'개');
  is(합.센줄 === 합.앱이아는수,
     '그 수가 <b>앱이 아는 수(tlpCount)</b> 와 같다 — '+합.앱이아는수+
     '개 (세는 곳이 둘이 아닙니다 · 5번)');

  sec('[7] 🖼 <b>그림 자리가 비지 않았나</b> (판 X185)');
  /* ⚠ 2026-10-24 · 이 화면만 선 그림으로 해 봤다가(판 X184) 사장님이 라이브를
     보시고 <b>「이모지는 전으로 돌려 이상해」</b> 하셔서 되돌렸습니다.
     ★ 「이모지 그대로」 는 <b>이모지가 선다</b>는 뜻이지 아무것도 없다는 뜻이
       아닙니다 — 빈 칸이 생기면 되돌리다 지운 것입니다 (1번).
     ★ 다시 선 그림으로 켜지지 않았는지도 여기서 봅니다 (check-icoslot 과
       묻는 각도가 다릅니다 — 그쪽은 본체 전부, 여기는 접힌 이 화면). */
  await pg.evaluate(()=>{ tlpSetQ(''); });
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>document.querySelectorAll('#dynPane .tlp-head')[1].click());
  await pg.waitForTimeout(420);
  const 그림 = await pg.evaluate(()=>{
    var d=document.getElementById('dynPane'), 빈=0;
    [].slice.call(d.querySelectorAll('.tlp-head .e,.tlp-row .e')).forEach(function(e){
      if(!(e.textContent||'').trim() && !e.querySelector('svg')) 빈++;
    });
    return { 줄:d.querySelectorAll('.tlp-row .e').length,
             줄그림:d.querySelectorAll('.tlp-row .e svg.ico').length,
             빈:빈 };
  });
  is(그림.빈 === 0, '그림 자리에 <b>빈 칸이 없다</b> — ' + 그림.빈 + '곳');
  is(그림.줄 > 0 && 그림.줄그림 === 0,
     '칸 머리도 줄도 <b>이모지 그대로</b>다 — 선 그림 ' + 그림.줄그림 + '/' + 그림.줄 +
     ' (판 X185 · 사장님 말씀 「이모지는 전으로 돌려」)');

  sec('[8] 조용한가');
  is(errs.length === 0, '터진 곳이 없다'+(errs.length?(' ← '+errs.slice(0,2).join(' · ')):''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad? '✗ '+bad+'개 — 도구 화면이 접히지 않거나 찾기가 죽었습니다.'
                 : '✓ 여섯 칸이 접혀 한 화면에 서고, 찾으면 저절로 펴집니다.');
  process.exit(bad?1:0);
})();
