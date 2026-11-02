/* ══════════════════════════════════════════════════════════════════
   check-bgsame.js — <b>상자가 제 바로 뒤에 묻히지 않았나.</b>

   2026-10-30 (판 X264). 사장님 말씀 「안되는거 다 고쳐줘」.

   ── 왜 이 자가 생겼나 ─────────────────────────────────────────────
   라이브를 재다가 「🗂 소개」·「📍 순천」 칩이 <b>알약 모양 없이 글자만</b>
   떠 있는 것을 봤습니다. 재 보니 칩 바탕 --t-bg-2(#F5F7F9)가 그 칩이 앉은
   칸 --t-bg-3(#F7F9FA)와 <b>차이 5</b> 였습니다.

   ⚠⚠ <b>check-onepal 은 이것을 못 봅니다 — 그 자가 게으른 것이 아닙니다.</b>
     그 자의 「묻힌 상자」 는 <b>바로 위가 판(.main)일 때만</b> 봅니다. 그것이
     그 자가 지키려고 만든 것이고, 적어 둔 그대로 하고 있었습니다.
     없던 것은 <b>「제 바로 뒤와 견주는 눈」</b> 입니다.
   ⚠ 그리고 그 자의 견본에는 <b>고객이 한 분도 없어</b>(OSC.list=[] · AR.db=[])
     「지금 할 것」 칸의 칩이 아예 안 그려집니다. 그래서 거기에 눈을 달아도
     <b>이 자리는 영영 안 울립니다</b> — 되돌려 보고 알았습니다. 그래서 이 자는
     <b>고객을 넣은 견본</b>으로 홈을 채워 놓고 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 홈이 제대로 찼나 — 안 차면 이 자는 아무것도 못 봅니다 (8번)
     [2] ★★ <b>제 바로 뒤에 묻힌 상자가 0가지</b>
         · 테두리·그림자가 있으면 안 셉니다 — 그것으로 모양이 보입니다
         · 그림(그라데이션) 위도 안 셉니다 — 못 재는 자리입니다 (1번)
         · 40×20 보다 작은 것은 안 셉니다 — 글자 한 조각까지 고발하면 헛것입니다
     [3] 조용히 터지지 않았나
   ★ 되돌림 — .hm-q-t 의 바탕을 --t-card 에서 --t-bg-2 로 도로 박으면
     이 자가 <b>울립니다</b>(확인했습니다). 안 울리는 알람은 알람이 아닙니다.
   ⚠ 사장님 진짜 서버를 한 번도 안 부릅니다 (10번) — 견본은 「홍길동」 집안 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9342;
let bad = 0;
const is = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ✓   ' : '  ✗   ') + msg); };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
             '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/json' };
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u.indexOf('/.netlify/functions/') === 0) { s.writeHead(200, {'Content-Type':'application/json'}); s.end('{}'); return; }
  let f = path.join(ROOT, u);
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) {}
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 홈을 <b>채워</b> 둡니다. 빈 홈에서는 볼 것이 없습니다 (8번). */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user:{ id:'me' } };
  OS.profile = { id:'me', user_id:'me', name:'홍길동', role:'owner', active:true, plan:'vip', team:'A', team_id:'t1' };
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','osCliInfoLoad',
   'osRepListLoad','osLoadAnalysis','toast','nlLoad'].forEach(k => { window[k] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded = true; if (cb) cb(); };
  window.osTabAllowed = function(){ return true; };
  window.setupDone = function(){ return true; }; window.setupCanRun = function(){ return true; };
  const chain = v => { const o = { then:function(f){ try{ f(v); }catch(e){} return o; }, catch:function(){ return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter','ilike','like','range','contains','overlaps']
      .forEach(k => { o[k] = function(){ return o; }; });
    o.single = function(){ return chain({data:null}); }; o.maybeSingle = function(){ return chain({data:null}); }; return o; };
  window.osClient = function(){ return { from:function(){ return {
      select:function(){ return chain({data:[],count:0}); }, update:function(){ return chain({}); },
      insert:function(){ return chain({}); }, upsert:function(){ return chain({}); },
      delete:function(){ return chain({}); } }; } }; };
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  const soon = n => new Date(Date.now()+n*864e5).toISOString().slice(0,10);
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.reps = [{id:'me',name:'홍길동'}];
  OSC.list = ['홍길동','홍길순','홍길상'].map((n,i) => ({
    id:'c'+i, name:n, name_masked:n[0]+'○○', advisor_id:'me', stage:['AP','TA','PC'][i],
    created_at:ago(30+i*10), region:'순천', phone:'010-0000-000'+i }));
  CM.loaded = true; CM.meta = {};
  OSC.list.forEach((c,i) => { const m = cmBlank();
    m.touch = [{ at:ago(i*4), how:'전화', note:'통화' }];
    if (i < 2) m.appt = { at:soon(i), kind:['AP','PC'][i], place:'순천' };
    CM.meta[c.id] = m; });
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = ['홍길동','홍길순','홍길상','홍갑돌','홍말순','홍판서'].map((n,i) => ({
    id:'d'+i, who:'me', name:n, region:'순천', src:(i%2?'소개':'일반'),
    stage:['AP','TA','PC'][i%3], days:3+i, n:1+(i%3), res:'', cAt:'', pAt:'',
    next_appt:(i<2?soon(i):'') }));
  try { osHideLoginGate(); } catch(e) {}
  try { renderNav(); } catch(e) {}
  go('home');
};

/* 한 화면을 재는 눈 — <b>제 바로 뒤</b>와 견줍니다 */
const SCAN = tab => {
  const T = s => (s||'').replace(/\s+/g,' ').trim();
  const num = s => ((s||'').match(/[\d.]+/g) || [0,0,0]).slice(0,3).map(Number);
  const solid = c => { const n = (c||'').match(/[\d.]+/g); return !!(n && (n.length < 4 || +n[3] > .5)); };
  const hex = c => '#' + c.slice(0,3).map(x => Math.round(x).toString(16).padStart(2,'0')).join('').toUpperCase();
  const pane = document.querySelector('.tab-pane.on');
  if (!pane) return { 식구:0, 묻힘:[] };
  const 묻힘 = [];
  pane.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el), own = cs.backgroundColor;
    if (!solid(own)) return;
    if ((cs.backgroundImage||'none') !== 'none') return;
    if (parseFloat(cs.borderTopWidth||0) > 0 || parseFloat(cs.borderBottomWidth||0) > 0) return;
    if ((cs.boxShadow||'none') !== 'none') return;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) return;
    let e2 = el.parentElement, 뒤 = null, 그림 = false;
    while (e2) { const s2 = getComputedStyle(e2);
      if ((s2.backgroundImage||'none') !== 'none') { 그림 = true; break; }
      if (solid(s2.backgroundColor)) { 뒤 = num(s2.backgroundColor); break; }
      e2 = e2.parentElement; }
    if (그림 || !뒤) return;
    const c = num(own);
    const d = Math.abs(c[0]-뒤[0]) + Math.abs(c[1]-뒤[1]) + Math.abs(c[2]-뒤[2]);
    if (d > 0 && d <= 10)
      묻힘.push(hex(c) + ' on ' + hex(뒤) + ' (' + d + ') — ' + tab + ' · ' +
                String(el.className||el.tagName).slice(0,26) + ' 「' + T(el.innerText).slice(0,14) + '」');
  });
  return { 식구:pane.querySelectorAll('*').length, 묻힘:[...new Set(묻힘)] };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  let 묻힘 = [], 식구첫 = 0;
  for (const [w, h] of [[390,844], [1280,1000]]) {
    const ctx = await b.newContext({ viewport:{ width:w, height:h } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('' + (e && e.message)));
    await p.route('**://**', r => {
      const u = r.request().url();
      if (/supabase\.co|dapi\.kakao|googleapis|\.netlify\.app/.test(u)) { r.fulfill({ status:200, body:'[]' }); return; }
      r.continue();
    });
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil:'domcontentloaded' });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout:60000 });
    await p.evaluate(SEED);
    await p.waitForTimeout(2600);
    /* 접은 칸 속도 봅니다 — 접힌 동안은 0px 라 안 보입니다 */
    await p.evaluate(() => { document.querySelectorAll('.tab-pane.on .hm-fold:not(.on)>.hm-fold-h').forEach(x => x.click()); });
    await p.waitForTimeout(900);
    const r0 = await p.evaluate(SCAN, '홈 ' + w);
    if (!식구첫) 식구첫 = r0.식구;
    묻힘 = 묻힘.concat(r0.묻힘);
    /* 다른 화면 몇 개도 — 홈만 보면 다른 자리에서 새로 생겨도 모릅니다 */
    for (const t of ['clients','tools','me','settings','report']) {
      await p.evaluate(x => { try { go(x); } catch(e) {} }, t);
      await p.waitForTimeout(450);
      const r1 = await p.evaluate(SCAN, t + ' ' + w);
      묻힘 = 묻힘.concat(r1.묻힘);
    }
    await ctx.close();
  }
  묻힘 = [...new Set(묻힘)];

  console.log('[1] 홈이 제대로 찼나 — 안 차면 이 자는 아무것도 못 봅니다 (8번)');
  is(식구첫 > 120, '  홈에 식구가 <b>' + 식구첫 + '개</b> 섰다 (120 아래면 견본이 홈을 못 채운 것입니다)');

  console.log('\n[2] ★★ <b>제 바로 뒤에 묻힌 상자</b>가 없다');
  is(묻힘.length === 0,
     '  제 바로 뒤와 차이 10 이내인 상자가 <b>' + 묻힘.length + '가지</b> — 0이어야 합니다' +
     (묻힘.length
       ? ('\n      ✗ ' + 묻힘.slice(0,10).join('\n      ✗ ') +
          '\n      → 이 상자는 <b>판이 아니라 제 바로 뒤</b>와 거의 같은 색입니다 — 모양이 안 보이고 글자만 뜹니다.' +
          '\n        <b>--t-card(흰)</b> 로 보내거나 테두리(--t-line)를 주십시오.' +
          '\n      ⚠ check-onepal 의 「판에 묻힌 상자」 와 <b>다른 눈</b>입니다 — 그 자는 바로 위가 판일 때만 봅니다.')
       : ''));

  console.log('\n[3] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' | ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 상자가 저마다 제 뒤에서 떠 보입니다 — 글자만 뜨는 자리가 없습니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
