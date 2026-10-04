/* ══════════════════════════════════════════════════════════════════
   check-naked.js — 👕 <b>옷을 안 입은 칸이 있나.</b>

   ── 왜 ───────────────────────────────────────────────────────────
   2026-10-04 · 사장님이 홈 화면을 찍어 보내시며 <b>「디자인 꺠진거 여기에
   맞추어서 복원하고, 다른데 칸도 이렇게 꺠진거 전부 복원해」</b> 하셨습니다.
   「✅ 이분 끝」 과 「다음 분 → 오늘은 뒤로」 두 단추가 사이 없이 서로
   붙어 있었습니다.

   까닭은 <b>CLAUDE.md 5번의 그 함정</b>이었습니다 — 「클래스를 넣어 주는
   xxxCss() 를 쓰는 화면은 <b>그 화면에서도 부른다</b>」. 그 두 단추의 옷
   (.hm-nw* · .hm-nx*)이 <b>hmIgCss() 안</b>에 들어 있는데, 그 함수를 부르는
   곳이 📸 오늘 올릴 것 <b>한 곳뿐</b>이었습니다. 그 칸이 안 서는 날이면
   단추가 <b>벌거벗은 채로</b> 섭니다.

   ★ 눈으로는 못 찾습니다. 화면이 99개입니다. 그래서 <b>기계가 묻습니다</b> —
     「이 이름으로 걸리는 규칙이 <b>한 줄이라도</b> 있나?」

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 화면 <b>전부</b>를 열어, 옷을 안 입은 이름이 적어 둔 것뿐인가.
         늘면 빨간불입니다 — 지우라는 뜻이 아니라 <b>옷을 어디서 부르는지</b>
         한 번 보고 여기 적으라는 뜻입니다.
     [2] ★ 사장님이 보신 그 자리 — <b>「지금 할 것」 의 두 단추</b>가 옷을
         입고, 서로 안 붙고, 44px 이상이고, 글자가 바탕에 안 묻히는가.
     [3] <b>「오늘 보낼 소식」</b> 칸도 같은 옷을 입는가 (같은 hmIgCss).

   ★ <b>지어내지 않습니다</b> (1번) — 아래 아홉은 규칙이 <b>앱 어디에도</b>
     없는 이름입니다. 없는 옷을 제가 그려 넣으면 그것은 복원이 아니라
     <b>새 디자인</b>입니다. 그래서 까닭만 적어 두고 그대로 둡니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.cwd(), PORT = 9101;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MIME = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.webmanifest':'application/manifest+json' };
const STUB = fs.readFileSync(path.join(ROOT,'scripts/smoke.js'),'utf8').split('const STUB = `')[1].split('`;')[0];
const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]);
  if(p==='/')p='/index.html'; const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end('');return;}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(s); });

/* ── 적어 둔 이름표 — <b>옷이 아니라 이름</b>인 것들 ─────────────────
   한 줄씩 <b>왜</b>를 답니다. 까닭 없이 적으면 다음 사람이 그냥 늘립니다. */
const 이름표 = [
  { c:'hm-rt',      왜:'「오늘 어디로 가시나」 를 <b>찾는 이름</b>이다 — check-hmroute 가 그것으로 찾는다. 28920줄에 그렇게 적혀 있다. 옷은 .card 가 입는다' },
  { c:'hm-team',    왜:'같은 꼴 — <b>.card 가 옷</b>이고 이 이름은 팀 칸을 찾는 표다' },
  { c:'alm-host',   왜:'<b>칠할 자리</b>만 내어 준 빈 칸이다 (almPaint 가 안을 채운다) · 15590줄' },
  { c:'file-list',  왜:'<b>칠할 자리</b> — fileChips() 가 안을 채운다. 겉에 옷이 없어야 안엣것이 그대로 선다' },
  { c:'notionChk',  왜:'<b>자바스크립트가 집는 이름</b>이다 — 체크칸 자체는 style= 로 칠한다' },
  { c:'endo-inrow',왜:'속을 <b>style= 로 직접</b> 칠한다 (36024줄) — 겉 class 는 이름표다' },
  { c:'hlp',        왜:'<b>.sb-guide 가 옷</b>이고 이것은 덧붙인 표다 (14831줄)' },
  { c:'ar-bt',      왜:'속을 <b>style= 로 직접</b> 칠한다 (10516줄). ⚠ arCss 에 <b>같은 이름의 규칙이 따로</b> 있다(11315줄) — 한 자리를 두 곳이 입히고 있다 (5번). 고치려면 둘을 한 곳으로 모아야 해서, 이번 판에서는 <b>건드리지 않고 적어만</b> 둔다' },
  { c:'g2',         왜:'#nfGuide 안에서만 옷이 있다(18855줄). 밖의 두 자리(32202·32897)는 <b>규칙이 없다</b> — 두 칸을 나란히 세우려던 것인지 알 수 없어, <b>지어내지 않고</b> 그대로 둔다 (1번)' }
];

const 씨 = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.osTabAllowed=function(){return true;};
  window.toast=function(){};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={}; AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const me=(typeof arMyId==='function')?arMyId():'me';
  AR.db=[{id:'d1',who:me,name:'홍길동A',region:'강남구',src:'보장분석10DB',stage:'AP',
          cAt:'',pAt:'',got:'2026-08-01',n:2,last:'2026-09-25',res:'상담',appt:'',memo:'',days:2},
         {id:'d2',who:me,name:'홍길동B',region:'강남구',src:'보장분석10DB',stage:'PC',
          cAt:'',pAt:'',got:'2026-08-02',n:1,last:'2026-09-20',res:'상담',appt:'',memo:'',days:9}];
  try{ NLIVE.items=[{t:'보험사 신상품 안내 — 경제적 안정',u:'https://example.com/a',
        s:'보험신문',d:'2026-10-03',cat:'all'}]; NLIVE.at='2026-10-04'; NLIVE.got=1; }catch(e){}
  try{ osHideLoginGate(); }catch(e){}
  try{ HM_MORE=true; }catch(e){}
  go('home');
};
/* 지금 이 화면에서 <b>걸리는 규칙이 한 줄도 없는</b> 이름을 모은다 */
const 벗은이름 = () => {
  const 규칙 = new Set();
  for (const ss of document.styleSheets) { let rs; try{ rs=ss.cssRules; }catch(e){ continue; }
    const go=(L)=>{ for(const r of L){ if(r.selectorText)
      (r.selectorText.match(/\.[-_a-zA-Z0-9 -￿]+/g)||[]).forEach(c=>규칙.add(c.slice(1)));
      if(r.cssRules) go(r.cssRules); } }; go(rs); }
  const out = new Set();
  document.querySelectorAll('[class]').forEach(el=>{
    const cn = el.className; if(!cn || !cn.split) return;
    cn.split(/\s+/).forEach(c=>{ if(c && !규칙.has(c)) out.add(c); });
  });
  return [...out];
};
/* 두 색의 대비 — 글자가 바탕에 묻히나 */
const 대비식 = `(function(a,b){
  var L=function(s){ var m=s.match(/\\d+/g)||[0,0,0];
    var f=function(v){ v=+v/255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
    return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]); };
  var x=L(a),y=L(b); if(x<y){var t=x;x=y;y=t;} return (x+0.05)/(y+0.05); })`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:1280,height:900} });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:'+PORT)>=0
    ? r.continue() : r.fulfill({status:200,contentType:'application/javascript',body:''}));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(STUB);
  await p.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{ document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
    OS.profile={id:'smoke',name:'점검',role:'owner',plan:'vip'};
    OS.session={user:{id:'smoke',email:'smoke@test'}}; OS.cfg={schema_version:'29'};
    window.toast=function(){}; });
  const tabs = await p.evaluate(()=>{ const out=[];
    TABS.forEach(g=>(g.items||[]).forEach(i=>{ if(i&&i.id)out.push(i.id); })); return out; });

  console.log('\n[1] <b>옷을 안 입은 칸</b>이 적어 둔 것뿐인가 — 화면 ' + tabs.length + '개를 다 연다');
  const 찾음 = new Map();
  for (const t of tabs) {
    try { await p.evaluate(tb=>go(tb), t); } catch(e) { continue; }
    await p.waitForTimeout(260);
    let r = []; try { r = await p.evaluate(벗은이름); } catch(e) { continue; }
    r.forEach(c=>{ if(!찾음.has(c))찾음.set(c,[]); const L=찾음.get(c); if(L.length<3)L.push(t); });
  }
  const 모르는것 = [...찾음.keys()].filter(c => !이름표.some(e => e.c === c)).sort();
  is(모르는것.length === 0,
    '화면 ' + tabs.length + '개에서 옷을 안 입은 이름 ' + 찾음.size + '개 — 전부 적어 둔 이름표다'
    + (모르는것.length ? ('\n      ✗ 처음 보는 이름:\n        '
        + 모르는것.map(c => c + '  (' + 찾음.get(c).join(' · ') + ')').join('\n        ')
        + '\n      → 옷이 <b>어딘가에 있는데 그 화면에서 안 부른</b> 것이면 그 화면에서 부르십시오 (5번).'
        + '\n        옷이 <b>아예 없는 이름표</b>면 check-naked.js 의 「이름표」 에 <b>까닭과 함께</b> 적으십시오.') : ''));
  이름표.forEach(e => is(찾음.has(e.c),
    '  적어 둔 이름표가 <b>살아 있다</b> — ' + e.c + ' · ' + e.왜.replace(/<[^>]+>/g,'')));
  is(찾음.size <= 이름표.length,
    '  바닥 — 벗은 이름이 <b>' + 이름표.length + '개를 안 넘는다</b> (지금 ' + 찾음.size + '개)');

  console.log('\n[2] ★ 사장님이 보신 자리 — <b>「지금 할 것」 의 두 단추</b>');
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errs.push(e.message));
  await p2.addInitScript(STUB);
  await p2.goto('http://127.0.0.1:'+PORT+'/app/index.html',{waitUntil:'domcontentloaded',timeout:90000});
  await p2.evaluate(씨); await p2.waitForTimeout(2600);
  const R = await p2.evaluate((대비) => {
    const 대비계 = eval(대비);
    const g = s => document.querySelector(s);
    const nx = g('.hm-nx'), f = g('.hm-nx-f'), bb = g('.hm-nx-b'), nw = g('.hm-nw'), nwb = g('.hm-nw-b');
    if (!nx || !f) return { 없음: true };
    const cs = getComputedStyle(nx), cf = getComputedStyle(f);
    const rf = f.getBoundingClientRect(), rb = bb ? bb.getBoundingClientRect() : null;
    return { 없음: false,
      줄: cs.display, 사이: cs.columnGap, 윗줄: cs.borderTopStyle,
      f높이: Math.round(rf.height), b높이: rb ? Math.round(rb.height) : 0,
      겹침: rb ? !(rf.right <= rb.left + 0.5 || rb.right <= rf.left + 0.5
                 || rf.bottom <= rb.top + 0.5 || rb.bottom <= rf.top + 0.5) : false,
      틈: rb ? Math.round(rb.left - rf.right) : -1,
      대비: Math.round(대비계(cf.color, cf.backgroundColor) * 100) / 100,
      바탕: cf.backgroundColor, 글자: cf.color,
      소식: nw ? getComputedStyle(nw).backgroundColor : '', 소식줄: nwb ? getComputedStyle(nwb).display : '' };
  }, 대비식);
  is(!R.없음, '  두 단추가 <b>화면에 선다</b>');
  is(!R.없음 && R.줄 === 'flex', '  <b>한 줄로 선다</b> (hmIgCss 가 걸렸다) — display ' + R.줄);
  is(!R.없음 && R.사이 === '7px', '  둘 사이가 <b>떨어져 있다</b> — ' + R.사이);
  is(!R.없음 && R.윗줄 === 'dashed', '  위에 <b>가름줄</b>이 있다 — ' + R.윗줄);
  is(!R.없음 && !R.겹침 && R.틈 >= 5, '  ★ 서로 <b>안 붙는다</b> — 사이 ' + R.틈 + 'px (사장님 화면에서는 붙어 있었습니다)');
  is(!R.없음 && R.f높이 >= 44 && R.b높이 >= 44,
     '  ★ <b>누르는 것이 44px 이상</b> (사장님 말씀) — ' + R.f높이 + 'px · ' + R.b높이 + 'px');
  is(!R.없음 && R.대비 >= 4.5,
     '  ★ <b>글자가 바탕에 안 묻힌다</b> — 대비 ' + R.대비 + ':1 (' + R.글자 + ' on ' + R.바탕 + ')');

  console.log('\n[3] <b>「오늘 보낼 소식」</b> 칸도 같은 옷을 입는가 (같은 hmIgCss)');
  is(!R.없음 && R.소식 !== '' && R.소식 !== 'rgba(0, 0, 0, 0)',
     '  소식 칸에 <b>바탕색</b>이 있다 — ' + (R.소식 || '(없음)'));
  is(!R.없음 && R.소식줄 === 'flex', '  소식 단추가 <b>한 줄로</b> 선다 — ' + R.소식줄);

  console.log('\n[4] 조용한가');
  is(errs.length === 0, '  콘솔 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ ' + bad + '가지 — 옷을 안 입은 칸이 있으면 고객 앞에서 드러납니다.'); process.exit(1); }
  console.log('✓ 화면마다 칸이 옷을 입습니다 — 벗은 이름은 적어 둔 이름표뿐입니다.');
})().catch(e => { console.error('터짐: ' + e.message); process.exit(1); });
