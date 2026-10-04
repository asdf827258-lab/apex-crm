/* ══════════════════════════════════════════════════════════════════
   check-phonesame.js — 📱 <b>어느 폰에서나 같게 보이나.</b>

   ── 왜 ───────────────────────────────────────────────────────────
   2026-10-05 · 사장님 말씀 — <b>「폰에서도 잘 돌아가는지 이미지 돌려보고,
   모든 핸드폰에서 똑같은 테마로 보이게 만들자」</b>.

   폰 넷(아이폰SE 375 · 아이폰14프로 390 · 갤럭시S8 360 · 픽셀7 412)을
   띄워 재 보니 <b>세 가지가 폰마다 달랐습니다.</b>

     ① <b>체크칸·날짜칸·막대의 색</b> — accent-color 를 안 적으면 브라우저가
        <b>그 폰의 OS 색</b>으로 칠합니다. 아이폰은 애플 파랑, 삼성·픽셀은
        사장님이 고른 배경화면 색(Material You)까지 따라갑니다.
        체크칸 25 · 날짜칸 22 · 막대 2 · 시각칸 1 이 그랬습니다.
     ② <b>노치 여백이 죽어 있었습니다</b> — 아래 띠가
        padding-bottom:env(safe-area-inset-bottom) 을 쓰는데, 머리글에
        <b>viewport-fit=cover 가 없어 그 값이 늘 0</b> 이었습니다. 쓰는 쪽은
        있는데 <b>켜는 스위치가 없던</b> 자리입니다.
     ③ <b>「?」 단추가 아래 띠의 다섯째 칸(달력)을 덮고</b> 있었습니다 —
        폰 넷 모두에서 46×38px. bottom:18px 를 인라인에 박아 둔 탓입니다.

   ★ <b>글꼴은 여기서 못 잽니다</b> (1번) — 이 컨테이너에 한글 글꼴이 하나도
     없어, 어느 이름을 적어도 폭이 같게 나옵니다. 그래서 「글꼴이 같다」 고
     적지 않고, <b>글꼴을 받아 오는 길이 제대로 깔렸는지</b>만 봅니다
     (preconnect · 스타일시트 한 줄).

   ── 재는 것 ──────────────────────────────────────────────────────
     [1] 폰 넷 × 상태 셋(보통 · 폰 다크 · 대비 높임)에서 <b>색이 한 톨도
         안 다르다</b> · 가로로 안 넘친다
     [2] ★ <b>accent-color 가 앱 색</b>이다 — OS 색이 아니다
     [3] ★ <b>viewport-fit=cover</b> 가 있다 — 없으면 노치 여백이 죽는다
     [4] ★ <b>떠 있는 단추가 아래 띠를 안 덮는다</b> · 서로도 안 겹친다
     [5] 글꼴 길이 깔려 있다 (preconnect · 스타일시트)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.cwd(), PORT = 9135;
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

const 폰 = [{n:'아이폰SE',w:375,h:667},{n:'아이폰14프로',w:390,h:844},
            {n:'갤럭시S8',w:360,h:740},{n:'픽셀7',w:412,h:915}];
const 상태 = [{n:'보통',s:'light',c:'no-preference'},
              {n:'폰 다크',s:'dark',c:'no-preference'},
              {n:'대비 높임',s:'light',c:'more'}];
const 씨 = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
  OS.profile={id:'s',name:'홍길동',role:'owner',plan:'vip'};
  OS.session={user:{id:'s'}}; OS.cfg={schema_version:'29'}; window.toast=function(){};
  try{ go('home'); arBriefClose(); }catch(e){}
};
const 본다 = () => {
  const B = getComputedStyle(document.body);
  const r = (e) => { const x=e.getBoundingClientRect();
    return {l:Math.round(x.left),t:Math.round(x.top),rt:Math.round(x.right),b:Math.round(x.bottom)}; };
  const 탭 = [].slice.call(document.querySelectorAll('.tabbar .tb-b'));
  const 뜬것 = [].slice.call(document.querySelectorAll('#osGuideFab,#osVaFab'))
    .filter(e => { const c=getComputedStyle(e); return c.display!=='none'&&c.visibility!=='hidden'; });
  const 겹침 = [];
  탭.forEach(t => 뜬것.forEach(f => {
    const a=r(t), b=r(f);
    const ow=Math.min(a.rt,b.rt)-Math.max(a.l,b.l), oh=Math.min(a.b,b.b)-Math.max(a.t,b.t);
    if(ow>4&&oh>4) 겹침.push((t.innerText||'').replace(/\s+/g,'')+'←'+f.id+'('+ow+'×'+oh+')');
  }));
  /* 떠 있는 둘끼리도 */
  if(뜬것.length===2){ const a=r(뜬것[0]), b=r(뜬것[1]);
    const ow=Math.min(a.rt,b.rt)-Math.max(a.l,b.l), oh=Math.min(a.b,b.b)-Math.max(a.t,b.t);
    if(ow>4&&oh>4) 겹침.push('떠 있는 둘끼리('+ow+'×'+oh+')'); }
  /* accent-color — 체크칸을 하나 세워 본다 */
  const t=document.createElement('input'); t.type='checkbox';
  t.style.cssText='position:fixed;left:-999px;top:0'; document.body.appendChild(t);
  const ac = getComputedStyle(t).accentColor; t.remove();
  return { 바탕:B.backgroundColor, 글자:B.color,
    테마:document.documentElement.getAttribute('data-theme')||'',
    accent:ac, 탭수:탭.length, 겹침:겹침,
    넘침:Math.round(document.documentElement.scrollWidth - window.innerWidth) };
};
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const 표 = [];
  for (const d of 폰) for (const st of 상태) {
    const ctx = await b.newContext({ viewport:{width:d.w,height:d.h}, deviceScaleFactor:2,
      isMobile:true, hasTouch:true, colorScheme:st.s });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:'+PORT)>=0
      ? r.continue() : r.fulfill({status:200,contentType:'application/javascript',body:''}));
    const p = await ctx.newPage();
    await p.emulateMedia({ colorScheme: st.s, contrast: st.c });
    await p.addInitScript(STUB);
    await p.goto('http://127.0.0.1:'+PORT+'/app/index.html#home',{waitUntil:'domcontentloaded',timeout:90000});
    await p.waitForTimeout(2300);
    await p.evaluate(씨); await p.waitForTimeout(1200);
    표.push({ 폰:d.n, 상태:st.n, ...(await p.evaluate(본다)) });
    await ctx.close();
  }
  await b.close(); srv.close();

  console.log('\n[1] 폰 ' + 폰.length + ' × 상태 ' + 상태.length + ' = ' + 표.length + '판에서 <b>색이 같다</b>');
  const 열쇠 = x => [x.바탕, x.글자, x.테마].join('|');
  const 기준 = 열쇠(표[0]);
  const 다름 = 표.filter(x => 열쇠(x) !== 기준);
  is(다름.length === 0, '  바탕·글자·테마가 <b>' + 표.length + '판 모두 같다</b> — ' + 표[0].바탕 + ' / ' + 표[0].글자
    + (다름.length ? ('\n      ✗ ' + 다름.map(x => x.폰+'/'+x.상태+' '+x.바탕).join(' · ')) : ''));
  const 넘침 = 표.filter(x => x.넘침 > 0);
  is(넘침.length === 0, '  <b>가로로 안 넘친다</b>' + (넘침.length ? (' ← ' + 넘침.map(x=>x.폰+'/'+x.상태).join(' · ')) : ''));

  console.log('\n[2] ★ <b>체크칸·날짜칸 색이 OS 색이 아니다</b> (accent-color)');
  const ac = [...new Set(표.map(x => x.accent))];
  is(ac.length === 1 && ac[0] !== 'auto',
     '  <b>' + 표.length + '판 모두 같은 앱 색</b>이다 — ' + ac.join(' · ')
     + (ac[0] === 'auto' ? ' ← auto 면 그 폰의 OS 색입니다' : ''));

  console.log('\n[3] ★ <b>노치 여백이 살아 있다</b> (viewport-fit=cover)');
  const SRC = fs.readFileSync(path.join(ROOT,'app/index.html'),'utf8');
  const 머리 = (SRC.match(/<meta name="viewport"[^>]*>/) || [''])[0];
  is(/viewport-fit=cover/.test(머리), '  첫 viewport 머리글에 <b>viewport-fit=cover</b> 가 있다 — ' + 머리.slice(0, 90));
  const SRCC = SRC.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  is(/env\(safe-area-inset-bottom/.test(SRCC), '  쓰는 쪽(아래 띠)이 <b>그 여백을 쓴다</b> — 둘이 짝입니다');

  console.log('\n[4] ★ <b>떠 있는 단추가 아래 띠를 안 덮는다</b>');
  const 겹친판 = 표.filter(x => x.겹침.length);
  is(겹친판.length === 0, '  ' + 표.length + '판 모두 <b>겹치는 곳이 없다</b>'
    + (겹친판.length ? ('\n      ✗ ' + 겹친판.map(x => x.폰+'/'+x.상태+' : '+x.겹침.join(' · ')).join('\n        ')) : ''));
  is(표.every(x => x.탭수 === 5), '  아래 띠가 <b>다섯 칸</b>으로 선다 — ' + [...new Set(표.map(x=>x.탭수))].join(' · '));
  /* 자리를 <b>한 곳</b>이 정하나 — 인라인에 박으면 띠가 서는 폭에서 못 비킵니다 */
  /* ⚠ 창을 400자로 좁게 잡았더니 <b>제가 그 사이에 쓴 주석에 밀려</b>
     인라인을 되살려도 안 울렸습니다 — 되돌려 보고 알았습니다 (8번).
     넉넉히 1200자로 봅니다.                                           */
  is(!/osGuideFab[\s\S]{0,1200}?cssText='[^']*bottom:/.test(SRC),
     '  ★ 「?」 단추가 <b>bottom 을 인라인에 안 박는다</b> (5번) — 자리는 vaCss 한 곳이 정합니다');

  console.log('\n[5] 글꼴 길이 깔려 있다');
  is(/preconnect[^>]*cdn\.jsdelivr\.net/.test(SRC), '  글꼴 CDN 에 <b>미리 손을 내민다</b> (preconnect)');
  is(/pretendard@v[\d.]+\/dist\/web\/static\/pretendard\.css/.test(SRC), '  글꼴 <b>스타일시트를 싣는다</b>');
  console.log('  ⚠ <b>글꼴이 폰마다 같은지는 여기서 못 잽니다</b> — 이 컨테이너에 한글 글꼴이 없어'
    + '\n     어느 이름을 적어도 폭이 같게 나옵니다. 길이 깔렸는지만 봤습니다 (1번).');

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '가지 — 폰마다 다르게 보이면 사장님이 고객 앞에서 당황하십니다.'); process.exit(1); }
  console.log('✓ 폰 넷이 어느 상태에서나 같은 테마로 섭니다.');
})().catch(e => { console.error('터짐: ' + e.message); process.exit(1); });
