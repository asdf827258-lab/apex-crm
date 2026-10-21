/* ══════════════════════════════════════════════════════════════════
   check-icoslot.js — 🖼 <b>그림 자리가 선 그림으로 바뀌었나</b>.

   사장님 말씀 (2026-10-21) — 「이모지 선 그림으로 바꿔줘」 · 「남은 이모지도
   바꿔」. 판 X147 에서 <b>아래 띠 다섯</b>과 <b>서랍 메뉴</b>가 바뀌었고,
   판 X151 에서 <b>카드 머리·접이 머리</b> 같은 그림 자리를 바꿥니다.

   ── 왜 화면에서 바꾸나 (글을 안 고치고) ────────────────────────────
   카드 머리의 그림은 app/index.html 안의 <b>글자 195곳</b>에 박혀 있습니다
   (`<span class="ci">📊</span>`). 손으로 195곳을 고치면 틀릴 자리가 195개
   생기고, 다음에 카드를 하나 더 만들 때 또 이모지로 돌아갑니다. 그래서
   <b>자리(class)를 보고 한 곳에서</b> 바꿔 끼웁니다 (5번).

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>안 바뀐 자리가 늘어나는 것.</b> 기준선을 두고 늘면 빨간불입니다.
      (줄이면 기준선도 같이 내립니다 — 0-1번의 눈금 규칙.)
   ⓑ <b>엉뚱한 그림.</b> 표에 없는 이모지에 아무 그림이나 붙이면 안 됩니다 —
      그대로 두어야 합니다 (1번).
   ⓒ <b>글이 쪼개지는 것.</b> 「🔔 새 소식이 없습니다」 처럼 글과 한 줄인
      자리를 건드리면 수를 세거나 글을 견주는 자리가 조용히 틀립니다.
   ⓓ <b>두 번 돌면 달라지는 것.</b> 지켜보는 자(MutationObserver)가 제 손으로
      고친 것을 다시 보므로, 두 번 돌아도 같아야 멈춥니다.
   ⓔ <b>안 보이는 그림.</b> 선은 <b>글자색을 따라야</b> 합니다 — 색을 박으면
      어두운 칸에서 사라집니다.
   ⓕ <b>옮기는 표가 두 벌이 되는 것</b> (5번) — app/apex-icon.js 하나입니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8906;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ★ <b>바닥</b> — 지금 잰 수 그대로입니다. 늘면 빨간불, 줄이면 같이 내립니다.
     올리지 마십시오 (0-1번).                                            */
const BASE = { 남은자리: 0 };

const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){};
 window.setupDone=function(){return true;};window.setupShow=function(){return false;};
 window.osTabAllowed=function(){return true;};window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.picked=true;
 AR.loaded=true;AR.cliRows=[];AR.calls=[];AR.rep={};
 AR.db=[{id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'}];
 OSC.loaded=true;OSC.list=[];CHKS.busy=false;CHKS.rows=[];CHKS.by={};CHKS.fin={};
 HWHO.id='';go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED); await p.waitForTimeout(2200);

  console.log('[1] 📦 <b>옮기는 자가 하나</b>다 (5번)');
  const ico = fs.readFileSync(path.join(ROOT, 'app/apex-icon.js'), 'utf8');
  const idx = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((ico.match(/var APEX_ICON_OF *=/g) || []).length === 1,
     '  이모지 → 그림 표가 <b>app/apex-icon.js 한 곳</b>에만 있다');
  is(!/APEX_ICON_OF *=/.test(idx.replace(/\/\*[\s\S]*?\*\//g, '')),
     '  본체에는 그 표가 <b>없다</b> — 두 벌이면 한쪽만 늘어납니다');
  is((ico.match(/function icoSlots\(/g) || []).length === 1 &&
     (ico.match(/function icoWatch\(/g) || []).length === 1,
     '  바꿔 끼우는 자도 <b>하나</b>다 (icoSlots · icoWatch)');

  console.log('\n[2] 🖼 <b>화면을 돌며</b> 그림 자리를 센다');
  /* 앱이 가진 화면을 그대로 돕니다 — 목록을 따로 안 적습니다 (5번) */
  const 돌기 = await p.evaluate(async () => {
    const out = { 칸: 0, 그림: 0, 남음: [], 겹침: 0 };
    let tabs = [];
    try { tabs = Object.keys(TABS).reduce((a, g) => a.concat(TABS[g].items.map(x => x.id)), []); }
    catch (e) { try { tabs = ['home']; } catch (e2) {} }
    const SL = (typeof ICO_SLOT === 'string') ? ICO_SLOT : '';
    for (const t of tabs) {
      try { go(t); } catch (e) { continue; }
      await new Promise(r => setTimeout(r, 90));
      const L = [].slice.call(document.querySelectorAll(SL));
      L.forEach(e => {
        out.칸++;
        if (e.querySelector('svg.ico')) { out.그림++; return; }
        const s = (e.textContent || '').replace(/\s/g, '');
        if (!s) return;
        /* 표에 있는데 안 바뀐 자리만 「남음」 입니다 — 표에 없는 것은 그대로 두는 것이 맞습니다 (1번) */
        const k = APEX_ICON_OF[s.replace(/️/g, '')] || APEX_ICON_OF[s];
        if (k && APEX_ICON[k]) out.남음.push(t + ' · ' + s);
      });
    }
    go('home'); await new Promise(r => setTimeout(r, 300));
    return out;
  });
  console.log('      그림 자리 ' + 돌기.칸 + '곳 · 선 그림이 된 것 ' + 돌기.그림 + '곳');
  is(돌기.칸 > 0, '  그림 자리를 찾았다 — ' + 돌기.칸 + '곳');
  is(돌기.그림 > 0, '  <b>선 그림으로 바뀐 자리</b>가 있다 — ' + 돌기.그림 + '곳');
  is(돌기.남음.length <= BASE.남은자리,
     '  표에 있는데 <b>안 바뀐 자리</b> ' + 돌기.남음.length + '곳 — 바닥 ' + BASE.남은자리 +
     (돌기.남음.length ? (' ← ' + 돌기.남음.slice(0, 6).join(' · ')) : ''));

  console.log('\n[3] 🚫 <b>안 건드리는 것</b> — 표에 없는 것 · 글이 섞인 자리');
  const 손 = await p.evaluate(() => {
    const host = document.createElement('div');
    host.innerHTML =
      '<span class="ci">🫠</span>' +                      /* 표에 없는 이모지 */
      '<span class="ci">🔔 새 소식이 없습니다</span>' +      /* 글이 섞인 자리 */
      '<span class="ci"><b>📊</b></span>' +                /* 안에 칸이 있는 자리 */
      '<span class="ci">📊</span>';                        /* 바뀌어야 하는 자리 */
    document.body.appendChild(host);
    const n1 = icoSlots(host);
    const 글 = [].slice.call(host.children).map(e => (e.textContent || '').trim());
    const svg = [].slice.call(host.children).map(e => !!e.querySelector('svg.ico'));
    const n2 = icoSlots(host);                             /* 두 번 돌려도 같나 */
    const 글2 = [].slice.call(host.children).map(e => (e.textContent || '').trim());
    const 색 = (() => { const s = host.querySelector('svg.ico');
      return s ? (s.getAttribute('stroke') || '') : ''; })();
    host.remove();
    return { n1, n2, 글, 글2, svg, 색 };
  });
  is(손.svg[0] === false && 손.글[0] === '🫠',
     '  <b>표에 없는 이모지는 그대로</b> 둔다 — 「' + 손.글[0] + '」 (1번)');
  is(손.svg[1] === false && /새 소식/.test(손.글[1]),
     '  <b>글이 섞인 자리는 안 건드린다</b> — 「' + 손.글[1].slice(0, 18) + '」');
  is(손.svg[2] === false, '  <b>안에 칸이 있으면</b> 안 건드린다');
  is(손.svg[3] === true, '  <b>그림 자리만</b> 바꾼다 — 📊 → 선 그림');
  is(손.n1 === 1 && 손.n2 === 0 && 손.글.join('|') === 손.글2.join('|'),
     '  ★ <b>두 번 돌려도 같다</b> — 첫 판 ' + 손.n1 + '곳 · 두 번째 ' + 손.n2 +
     '곳 (지켜보는 자가 제 손으로 고친 것을 다시 봐도 멈춥니다)');
  is(손.색 === 'currentColor',
     '  ★ 선이 <b>글자색을 따른다</b> — stroke 「' + 손.색 + '」 (색을 박으면 어두운 칸에서 사라집니다)');

  console.log('\n[4] 🔁 <b>늦게 그려도</b> 따라 바뀐다 (지켜보는 자)');
  const 늦 = await p.evaluate(async () => {
    const d = document.createElement('div');
    d.innerHTML = '<span class="ci">📅</span>';
    (document.getElementById('dynPane') || document.body).appendChild(d);
    await new Promise(r => setTimeout(r, 300));
    const ok = !!d.querySelector('svg.ico');
    d.remove();
    return ok;
  });
  is(늦, '  나중에 붙은 칸도 <b>스스로</b> 바뀐다 (icoWatch)');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' ← ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  await b.close(); srv.close();
  if (bad) { console.log('✗ 그림 자리 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 그림 자리 ' + 돌기.그림 + '곳이 선 그림입니다 (그림 ' +
              (ico.match(/^APEX_ICON\.[a-z]+ *=/gm) || []).length + '가지 보탬).');
})();
