/* ══════════════════════════════════════════════════════════════════
   check-toolmap.js — <b>도구를 언제 쓰는가로 묶고, 길잡이를 놓는다.</b>

   사장님 말씀 — 「도구를 「무엇인가」가 아니라 「언제 쓰는가」로 다시 묶고,
   전체 지도와 길잡이를 놓습니다 … ①이 핵심입니다 — <b>하나라도 안 찾히면
   그 화면은 사라진 것입니다</b>」.

   ── 이 자리에서 실제로 났던 일 ───────────────────────────────────
   <b>ak 하나가 두 가지를 답하고 있었습니다.</b> 찾기 낱말이면서 동시에
   <b>등급 열쇠</b>였습니다. 그래서 찾기 낱말을 늘리면 등급 열쇠가 표에서
   빠져 <b>문이 소리 없이 열렸습니다.</b> 실제로 「증권 전달(pdel)」 이
   basic 에서 free 로 떨어져 있었습니다 — 같은 칸의 「계약관리 판단」 은
   basic 인데 말입니다. 이제 <b>tk</b> 가 등급 열쇠입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] ★ <b>옛 메뉴 id 로 전부 찾히는가</b> — 한 바퀴 돌며 확인
     [2] <b>별칭이 두 곳에 적혀 있지 않은가</b> (5번)
     [3] ★ <b>ak 를 늘려 등급이 내려간 화면이 없는가</b>
     [4] 도구가 <b>표 하나</b>에서 오고, 그 분 단계에 따라붙는가
     [5] 🧭 길잡이 — 아홉 줄 · 0 이면 흐리게 · 모르면 0 이라 안 한다
     [6] 🗺️ 지도에 빠진 화면을 <b>빠졌다고</b> 말하는가 (1번)
     [7] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8987;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> (3번) */
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'owner',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.osLoadClients=function(){};window.cmLoadAll=function(cb){if(cb)cb();};
 window.osClient=function(){ return { from:function(){ var a={};
   ['select','order','limit','eq','neq','gte','lte','in','is','not','or','filter','range','single','maybeSingle','match','update','insert','upsert','delete']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(r){return Promise.resolve({data:[],error:null}).then(r);};return a;},
   rpc:function(){return Promise.resolve({data:null,error:null});} }; };
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=[{id:'c1',name_masked:'홍○○',advisor_id:'me',consent_status:'none',created_at:'2026-09-01'},
           {id:'c2',name_masked:'홍○○',advisor_id:'me',consent_status:'none',created_at:'2026-09-02'}];
 CM.loaded=true;CM.meta={};
 AR.loaded=true;AR.busy='';AR.cliRows=[];
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''}];
 try{localStorage.setItem('apex_guide_seen_v2','1');}catch(e){}
`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2300);
  await page.evaluate(SEED);

  console.log('\n[1] ★ <b>옛 메뉴 id 로 전부 찾히는가</b> — 하나라도 안 찾히면 그 화면은 사라진 것이다');
  const F = await page.evaluate(() => {
    const ids = []; TABS.forEach(g => g.items.forEach(it => { if (ids.indexOf(it.id) < 0) ids.push(it.id); }));
    const all = (typeof visibleTabs === 'function') ? visibleTabs() : TABS;
    const miss = ids.filter(id => {
      let hit = false;
      all.forEach(g => g.items.forEach(it => { if (it.id === id && navHit(it, id, false)) hit = true; }));
      return !hit;
    });
    /* <b>이름으로도</b> 찾혀야 한다 — id 만 되면 옛 이름은 못 찾는다 */
    const byName = ids.filter(id => {
      let it0 = null; all.forEach(g => g.items.forEach(it => { if (it.id === id) it0 = it; }));
      return it0 && !navHit(it0, it0.title, false);
    });
    return { n: ids.length, miss, byName };
  });
  is(F.miss.length === 0,
     '  메뉴 ' + F.n + '개가 <b>제 id 로 다 찾힌다</b> — 못 찾는 것 ' + F.miss.length + '개' +
     (F.miss.length ? (' ← ' + F.miss.slice(0, 8).join(' ')) : ''));
  is(F.byName.length === 0,
     '  <b>제 이름으로도</b> 다 찾힌다' + (F.byName.length ? (' ← ' + F.byName.slice(0, 6).join(' ')) : ''));
  /* 사장님이 짚어 주신 별칭 넷 + 덤 */
  const AL = [['연금', 'finance'], ['고지', 'med_disclosure'], ['미청구', 'ref_hidden'],
              ['유병자', 'ref_underwrite'], ['퇴직', 'biz_retire'], ['treatpay', 'treatpay']];
  const A = await page.evaluate((AL) => AL.map(([w, id]) => {
    let ok = false; TABS.forEach(g => g.items.forEach(it => { if (it.id === id && navHit(it, w, false)) ok = true; }));
    return w + '→' + id + (ok ? '' : ' ✗');
  }), AL);
  is(A.every(x => x.indexOf('✗') < 0), '  <b>다르게 부르는 말</b>로도 찾힌다 — ' + A.join(' · '));

  console.log('\n[2] <b>별칭이 두 곳에 적혀 있지 않은가</b> (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(!/var\s+(TALIAS|NAV_ALIAS|ALIAS)\s*=/.test(SRC),
     '  별칭표를 <b>따로 만들지 않았다</b> — 메뉴 한 줄(ak)에만 적는다');
  is((SRC.match(/function navHit\(/g) || []).length === 1,
     '  찾기 판정이 <b>한 곳</b>(navHit)이다 — 두 곳이면 한쪽만 늙는다');
  is(/var hay=\(it\.title\|\|''\)\+' '\+\(it\.ak\|\|''\)\+' '\+\(it\.id\|\|''\)/.test(SRC),
     '  찾기가 <b>이름 · 별칭 · 옛 id</b> 셋을 다 본다');

  console.log('\n[3] ★ <b>ak 를 늘려 등급이 내려간 화면이 없는가</b>');
  const T = await page.evaluate(() => {
    const RK = { free: 0, basic: 1, pro: 2, team: 3, vip: 4 };
    const keys = Object.keys(OS_GROUP_TIER_DEFAULT);
    const drop = [], kept = [];
    TABS.forEach(g => g.items.forEach(it => {
      const got = osItemReqTier(g, it);
      /* ak 가 「등급 열쇠 + 더 적은 말」 이면, 그 열쇠의 등급이 지켜져야 한다 */
      const k = keys.filter(k => (it.ak || '').indexOf(k + ' ') === 0)[0];
      if (!k) return;
      if (RK[got] < RK[OS_GROUP_TIER_DEFAULT[k]]) drop.push(it.id + ':' + got + '<' + OS_GROUP_TIER_DEFAULT[k]);
      else kept.push(it.id);
    }));
    return { drop, kept, tk: TABS.reduce((a, g) => a + g.items.filter(x => x.tk).length, 0),
             pdel: osItemReqTier({ group: '계약·청구' }, TABS.reduce((a, g) => a || g.items.filter(x => x.id === 'pdel')[0], null)) };
  });
  is(T.drop.length === 0,
     '  ★ 낱말을 늘려도 <b>문이 안 움직인다</b> — 떨어진 칸 ' + T.drop.length + '개' +
     (T.drop.length ? (' ← ' + T.drop.join(' ')) : '') + ' (지켜진 칸 ' + T.kept.length + '개)');
  is(T.tk >= 10, '  등급 열쇠(tk)를 <b>못 박아 둔 칸</b>이 ' + T.tk + '개 — 없으면 늘리는 순간 free 로 떨어진다');
  is(T.pdel === 'basic', '  증권 전달이 <b>basic 으로 되돌아왔다</b> — ' + T.pdel + ' (free 로 떨어져 있었다)');
  is(/function osItemKey\(g,it\)\{return \(it&&\(it\.tk\|\|it\.ak\)\)/.test(SRC),
     '  등급 열쇠는 <b>tk 가 먼저</b>다 — 찾기 낱말과 갈라 놓았다');

  console.log('\n[4] 도구가 <b>표 하나</b>에서 오고, 그 분 단계에 따라붙는가');
  const B = await page.evaluate(() => {
    const S = window.APEX_STAGE;
    const box = (S && S.box) || [];
    const byStage = {};
    (S.order || []).forEach(k => { byStage[k] = (S.toolIds ? S.toolIds(k) : []).length; });
    /* 오늘 카드가 그 단계 도구를 들고 있나 */
    go('home');
    return new Promise(r => setTimeout(() => {
      const ap = (typeof tdoTools === 'function') ? tdoTools('AP').map(x => x.id) : [];
      r({ n: box.length, byStage, ap,
          same: JSON.stringify(ap) === JSON.stringify((S.toolIds ? S.toolIds('AP') : []).filter(id => navItemOf(id))) });
    }, 900));
  });
  is(B.n === 10, '  묶음이 <b>열</b>이다 — ' + B.n + '개 (미접촉~투자)');
  is(Object.keys(B.byStage).every(k => B.byStage[k] > 0),
     '  단계마다 <b>도구가 빈 곳이 없다</b> — ' + Object.keys(B.byStage).map(k => k + ':' + B.byStage[k]).join(' '));
  is(B.same && B.ap.length >= 5,
     '  오늘 카드가 <b>같은 표</b>를 본다 — AP ' + B.ap.length + '개 · ' + B.ap.slice(0, 4).join(' '));
  is(!/tools:\[/.test(fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8')),
     '  단계별 도구를 <b>손으로 또 적지 않았다</b> — BOX 에서 뽑는다 (5번)');
  /* 이름표가 메뉴와 <b>글자까지</b> 같은가 — 예전에 한 번 어긋나 두 화면이 다른 이름을 불렀다 */
  const N = await page.evaluate(() => {
    const S = window.APEX_STAGE, bad = [];
    (S.box || []).forEach(g => g.items.forEach(id => {
      const it = navItemOf(id), t = S.tools ? null : null;
      if (!it) { bad.push(id + '(메뉴에 없음)'); return; }
    }));
    /* 이름표 표 자체를 견준다 */
    (S.order || []).forEach(k => (S.tools(k) || []).forEach(x => {
      const it = navItemOf(x.id);
      if (it && it.title !== x.t) bad.push(x.id + ':' + x.t + '≠' + it.title);
    }));
    return bad;
  });
  is(N.length === 0, '  도구 이름표가 <b>메뉴와 글자까지 같다</b>' + (N.length ? (' ← ' + N.slice(0, 5).join(' ')) : ''));

  console.log('\n[5] 🧭 길잡이 — 아홉 줄 · 0 이면 흐리게 · <b>모르면 0 이라 안 한다</b>');
  const H = await page.evaluate(async () => {
    go('helpme'); await new Promise(r => setTimeout(r, 900));
    const pane = document.getElementById('dynPane');
    const rows = [].slice.call(pane.querySelectorAll('.hlp-r'));
    const off = rows.filter(e => e.classList.contains('off'));
    const out = {
      n: rows.length,
      off: off.length,
      offBtn: off.filter(e => e.querySelector('.hlp-b')).length,
      onBtn: rows.filter(e => !e.classList.contains('off')).filter(e => e.querySelector('.hlp-b')).length,
      small: rows.map(e => e.querySelector('.hlp-b')).filter(e => e && e.getBoundingClientRect().height < 44).length,
      txt: pane.innerText.replace(/\s+/g, ' ')
    };
    /* ★ <b>아직 못 읽었을 때</b> — 0 이라고 하면 「오늘은 끝」 이 되어 하루를 통째로 놓친다 */
    /* ★ <b>화면이 실제로 뭐라고 적는지</b> 읽습니다 — 셈을 여기서 다시
       하면 앱이 아니라 제 셈을 재게 됩니다. 실제로 그렇게 만들었다가
       앱을 고쳤는데도 빨간불이 남았습니다 (8번). */
    const keepC = CM.loaded, keepO = OSC.loaded;
    CM.loaded = false; OSC.loaded = false;
    const R2 = hlpRows();
    out.unknownNull = R2.filter(r => r.q.indexOf('아는 게 적은') >= 0 || r.q.indexOf('다음에 할 일') >= 0 ||
                                     r.q.indexOf('자리에 앉아') >= 0 || r.q.indexOf('약속을 지키고') >= 0)
                        .every(r => r.n === null);
    const html2 = renderHelpMe();
    out.notDone = html2.indexOf('오늘은 끝난 것입니다') < 0;
    CM.loaded = keepC; OSC.loaded = keepO;
    /* 다 읽은 뒤 <b>정말 0 이면</b> 그때는 끝났다고 적어야 한다 — 안 그러면
       이 자리는 「영영 안 끝난다」 는 알람이 된다 (8번) */
    const keep = { L: window.hmLeft, R: window.hmRtNear, P: window.hmQPromise, I: window.hmIgIdx, list: OSC.list };
    window.hmLeft = () => 0; window.hmRtNear = () => []; window.hmQPromise = () => []; window.hmIgIdx = () => -1;
    /* 고객 쪽 줄(아는 게 적은 분 · 다음 할 일)도 0 이라야 <b>정말 다 0</b> 이다.
       목록은 <b>읽었는데 비어 있는</b> 것이라 0 이 맞다 — 못 읽은 것과 다르다. */
    OSC.list = [];
    out.saysDone = renderHelpMe().indexOf('오늘은 끝난 것입니다') >= 0;
    OSC.list = keep.list;
    window.hmLeft = keep.L; window.hmRtNear = keep.R; window.hmQPromise = keep.P; window.hmIgIdx = keep.I;
    return out;
  });
  is(H.n === 9, '  <b>아홉 줄</b>이 선다 — ' + H.n + '줄');
  is(H.offBtn === 0, '  0 인 줄에는 <b>단추가 없다</b> — 「지금 볼 것이 아니다」 를 말한다 (' + H.off + '줄 흐림)');
  is(H.onBtn >= 1, '  0 이 아닌 줄에는 <b>누를 것</b>이 있다 — ' + H.onBtn + '개');
  is(H.small === 0, '  단추도 <b>44px 아래가 없다</b>' + (H.small ? (' ← ' + H.small + '개') : ''));
  is(/옛 메뉴 이름으로 찾아도 나옵니다/.test(H.txt), '  <b>옛 이름으로도 찾힌다</b>고 적는다');
  is(H.unknownNull, '  ★ 아직 못 읽었으면 <b>숫자를 안 적는다</b> — 0 은 「없다」 라서 (1번)');
  is(H.notDone, '  ★ 그때 <b>「오늘은 끝」 이라고 안 한다</b> — 못 읽은 것을 끝났다고 하면 하루를 통째로 놓친다');
  is(H.saysDone, '  다 읽었는데 <b>정말 0 이면</b> 그때는 「오늘은 끝난 것」 이라고 적는다 (안 적으면 영영 안 끝난다)');

  console.log('\n[6] 🗺️ 지도에 빠진 화면을 <b>빠졌다고</b> 말하는가 (1번)');
  const M = await page.evaluate(async () => {
    go('apexmap'); await new Promise(r => setTimeout(r, 900));
    const L = amissList().map(x => x.id);
    const btn = document.getElementById('amissBtn');
    const o = { n: L.length, ids: L, hidden: !!(btn && btn.hidden), label: btn ? btn.textContent : '' };
    if (!o.hidden) { amissToggle(); await new Promise(r => setTimeout(r, 200));
      const p = document.getElementById('amissPane');
      o.said = /없어진 것이 아닙니다/.test((p || {}).innerText || '');
      o.opens = (p ? p.querySelectorAll('button').length : 0);
      amissToggle(); }
    go('home'); await new Promise(r => setTimeout(r, 300));
    return o;
  });
  is(M.n === 0 ? M.hidden : !M.hidden,
     M.n === 0 ? '  지도에 다 올라와 있다 — 단추를 안 세운다'
               : ('  지도에 빠진 ' + M.n + '개를 <b>빠졌다고 말한다</b> — ' + M.label));
  if (M.n > 0) {
    is(M.said, '  <b>「없어진 것이 아닙니다」</b> 라고 적는다 — 「전체 지도」 인데 빠지면 사라진 줄 안다');
    is(M.opens === M.n, '  빠진 것을 <b>그 자리에서 연다</b> — ' + M.opens + '개 · ' + M.ids.slice(0, 5).join(' '));
  }

  console.log('\n[7] 조용히 터지지 않았나');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource/i.test(x));
  is(real.length === 0, '  콘솔 오류 없음' + (real.length ? (' ← ' + real[0]) : ''));

  await ctx.close(); await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 도구는 언제 쓰는가로 묶였고, 옛 이름으로도 다 찾히고, 길잡이가 섰습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
