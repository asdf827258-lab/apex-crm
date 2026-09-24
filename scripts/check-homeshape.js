/* ══════════════════════════════════════════════════════════════════
   check-homeshape.js — <b>홈이 「오늘 카드」만 남았나.</b>

   사장님 말씀 (2026-09-26) —
     「홈을 <b>「오늘 카드」만</b> 남기고 나머지를 옮깁니다.
      <b>지우는 것이 아닙니다.</b>
      … 명세서(APEX사본.html)의 「오늘」 화면은 <b>덩어리가 셋</b>뿐입니다 —
      카드 스택 · 동선 · (30일 약속 · 활동량).
      지금 홈은 덩어리가 열다섯이고 <b>그중 다섯이 날마다 떴다 사라집니다.</b>
      … 「지웠다」로 읽히면 팀원이 안 씁니다」.

   ── 보는 것 넷 ────────────────────────────────────────────────────
     ① 홈의 <b>덩어리</b>가 넷을 넘지 않는가
     ② <b>상태에 따라 사라지는 칸</b>이 없는가
     ③ 옮긴 화면이 <b>새 자리에서 실제로 열리는가</b>
     ④ <b>옮겼다는 안내</b>가 있는가

   ── ⚠ 「덩어리」 를 어떻게 세는가 ─────────────────────────────────
   <b>높이 120px 을 넘는 최상위 칸</b>을 덩어리로 셉니다. 「칸이 몇 개냐」 로
   세면 한 줄짜리 안내까지 덩어리가 되어, 옮겼다고 적는 자리를 만들 수가
   없습니다 — 그러면 팀원이 「지웠다」 로 읽습니다(사장님 ④).
   거꾸로 「높이 합계」 로만 재면 카드 열 장을 얇게 만들어 빠져나갈 수
   있습니다. 그래서 <b>덩어리 수</b>로 셉니다. 한 줄(≤120px)은 덩어리가
   아니고, 한 줄인지도 여기서 같이 잽니다.
   ★ 홈 <b>길이</b>는 check-homeone 이 따로 잽니다(3.3화면) — 두 자를 한
     곳에 두면 무엇이 틀렸는지 알 수 없습니다.

   ── ⚠ ② 의 <b>하나뿐인 예외</b> ──────────────────────────────────
   <b>준비 SQL(osSetupHome)</b> 은 사장님 ★ 대로 그 자리에 둡니다 —
   「여러 화면이 「홈 맨 위」라고 가리키므로 그 자리에 둡니다(check-setup 이
   잡습니다)」. 한 번 하면 영영 사라지는 것이라, 다 된 뒤에도 「다 되었습니다」
   를 매일 적으면 그것이 자리만 먹습니다. <b>이름으로 빼고 여기 까닭을
   적어 둡니다</b> — 이름 없이 빼면 그것이 구멍입니다.
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8934;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  /* 앱이 부팅할 때 부르는 자리는 <b>배포된 사이트처럼</b> 답해 준다 —
     404 를 주면 이 점검과 무관한 콘솔 오류가 잡힌다 */
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 진짜 기사 세 건. <b>고객 이름이 아니라 기사 제목</b>이라 그대로 쓴다 */
const NEWS = [
  { t: '실손보험 청구 전산화 2단계 시행 — 의원급 확대', s: '연합뉴스', d: '2026-09-21', u: 'https://example.com/a', cats: ['ins'] },
  { t: '기준금리 동결 … 가계대출 관리 강화', s: '한국경제', d: '2026-09-20', u: 'https://example.com/b', cats: ['econ'] },
  { t: '출산지원금 지자체별 확대 개편안 발표', s: '뉴스1', d: '2026-09-19', u: 'https://example.com/c', cats: ['help'] }
];
const SEED = (o) => `
 window.__T='';
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'${o.role || 'master'}',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1',u2:'t1'};
 GB.rows=[{id:'me',name:'홍길동'},{id:'u2',name:'홍길순'}];
 var _e={};window.arRowOf=function(i){var m={me:'홍길동',u2:'홍길순'};return m[i]?{id:i,name:m[i],sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 /* 내 고객을 <b>둘 이상</b> 둔다 — 한 분뿐이면 「다음 분」 이 설 이유가
    없어서, 그 단추를 안 만들어도 점검이 초록이 된다 (8번) */
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'일반',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
        {id:'d3',who:'me',name:'홍길동C',region:'순천',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''},
        {id:'d4',who:'me',name:'홍길동D',region:'순천',src:'일반',stage:'PC',days:6,n:3,res:'상담',cAt:'',pAt:''},
        {id:'d2',who:'u2',name:'홍길순B',region:'천안',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동',u2:'홍길순'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 /* 준비할 것이 <b>있는 판</b>과 <b>없는 판</b>을 갈라 만든다 */
 window.setupShow=function(){return ${o.setup ? 'true' : 'false'};};
 window.setupCanRun=function(){return true;};
 /* 출발 점검이 <b>있는 판</b>과 <b>없는 판</b> — 이것이 매일 떴다 사라지던 것 */
 ${o.ready === false ? 'window.hmReadyRows=function(){return [];};' : ''}
 try{ ${o.news
    ? `localStorage.setItem('apex_newslive',JSON.stringify({at:'2026-09-21',got:3,drop:0,items:${JSON.stringify(NEWS)}}));`
    : `localStorage.removeItem('apex_newslive');`}
      localStorage.removeItem('apex_hm_ig_v1');
      localStorage.removeItem('apex_hm_fold_v1'); }catch(e){}
 if(typeof NLIVE!=='undefined'){NLIVE.items=[];NLIVE.at='';}
 if(typeof nlLoad==='function')nlLoad();
 window.osClient=function(){var mk=function(t){var st={t:t,op:'',id:'',sel:false};var a={
   update:function(){st.op='update';return a;},insert:function(){st.op='insert';return a;},
   upsert:function(){st.op='upsert';return a;},'delete':function(){st.op='delete';return a;},
   select:function(){st.sel=true;return a;},order:function(){return a;},range:function(){return a;},
   limit:function(){return a;},single:function(){return a;},gte:function(){return a;},
   'in':function(){return a;},is:function(){return a;},neq:function(){return a;},not:function(){return a;},
   eq:function(k,v){st.id=v;return a;},
   then:function(o2,n2){if(st.op&&!st.sel)return Promise.resolve({error:null}).then(o2,n2);
     return Promise.resolve({data:st.op?[{id:'x'}]:[],error:null}).then(o2,n2);}};return a;};
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

/* 홈의 <b>뼈대</b> — 칸의 차례. 안에 무엇이 들었는지가 아니라
   「무엇이 어떤 차례로 서 있나」 를 본다. 이것이 달라지면 사장님 눈에
   <b>다른 화면</b>이다. */
/* ⚠ <b>id 만 견주면 안 된다.</b> 빈 칸도 id 는 그대로 있어서, 준비 SQL 을
   도로 홈 본문에 풀어 놓아도 「뼈대가 같다」 가 초록이었다 — 정작 홈은
   2,339px 에서 3,765px 로 부풀었는데도. 사장님이 느끼시는 것은 id 가
   아니라 <b>눈에 보이는 자리</b>다. 그래서 <b>눈에 보이는 칸만</b>(8px 초과)
   세고, 높이가 크게 달라지면 <b>다른 화면</b>으로 친다 (8번).           */
const bones = (p) => p.evaluate(() => {
  const pane = document.querySelector('.tab-pane.on'); if (!pane) return [];
  return [...pane.children].map(e => {
    const r = e.getBoundingClientRect();
    if (r.height <= 8) return null;
    const id = e.id || (e.className.toString().split(/\s+/)[0] || e.tagName.toLowerCase());
    /* 높이는 <b>400px(반 화면) 자리</b>로 뭉뚱그린다. 100px 로 쟀더니
       카드 <b>안</b>에 소식 한 줄(90px)이 늘어난 것까지 「다른 화면」으로
       쳤다 — 그건 칸이 생긴 것이 아니라 <b>안에서 말이 달라진 것</b>이고,
       이 점검이 스스로 그렇게 적어 두었다. 잡으려는 것은 준비 SQL 425px ·
       출발 점검 778px 처럼 <b>화면 한 장 반이 통째로</b> 생겼다 없어지는
       것이다. 헛것을 잡는 점검은 안 잡는 점검보다 나쁘다 (8번).         */
    return id + '~' + Math.round(r.height / 400);
  }).filter(Boolean);
});
const tall = (p) => p.evaluate(() => {
  const pane = document.querySelector('.tab-pane.on'); if (!pane) return 0;
  const L = [...pane.children].map(e => e.getBoundingClientRect());
  return Math.round(Math.max.apply(null, L.map(r => r.bottom + scrollY)));
});


(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
    await p.evaluate(s => { (0, eval)(s); }, SEED(o || {}));
    await p.evaluate(() => { go('home'); });
    await p.waitForTimeout(700);
    return { ctx, p, errs };
  };
  /* 홈 최상위 칸을 <b>보이는 것만</b> 이름과 높이로 */
  const shape = (p) => p.evaluate(() => {
    const pane = document.querySelector('.tab-pane.on'); if (!pane) return [];
    return [...pane.children].map(e => ({
      id: e.id || ('.' + String(e.className || '').split(' ')[0]),
      h: Math.round(e.getBoundingClientRect().height)
    })).filter(x => x.h > 0);
  });

  const A = await open({});

  console.log('\n[1] 홈의 <b>덩어리</b>가 넷을 넘지 않는가');
  const S1 = await shape(A.p);
  const big = S1.filter(x => x.h > 120);
  is(big.length <= 4, '  덩어리(120px 넘는 칸)가 <b>' + big.length + '개</b> — 넷 이하 (' +
     big.map(x => x.id + ' ' + x.h).join(' · ') + ')');
  const small = S1.filter(x => x.h <= 120);
  is(small.length > 0 && small.every(x => x.h <= 120),
     '  나머지는 <b>한 줄</b>이다 — ' + small.map(x => x.id + ' ' + x.h).join(' · '));
  /* 옮긴 다섯이 홈에서 <b>빠졌는가</b> — 접이가 남아 있으면 안 옮긴 것이다 */
  const folds = S1.filter(x => /^hmFold_(cal|cli|tfa|ig|mng)$/.test(x.id));
  is(folds.length === 0, '  옮긴 다섯이 홈에 <b>안 남았다</b>' +
     (folds.length ? (' ← ' + folds.map(x => x.id).join(' ')) : ''));

  console.log('\n[2] <b>상태에 따라 사라지는 칸</b>이 없는가');
  /* 소식도 없고 공지도 없는 판 vs 둘 다 있는 판 — <b>뼈대가 같아야</b> 한다 */
  const S2 = await A.p.evaluate(() => {
    const pane = document.querySelector('.tab-pane.on');
    const now = () => [...pane.children].map(e => (e.id || ('.' + String(e.className || '').split(' ')[0])) +
      ':' + (e.getBoundingClientRect().height > 0 ? 1 : 0)).join('|');
    const before = now();
    /* 공지를 하나 세워 봅니다 — 있으면 자리가 늘어나면 안 됩니다 */
    const host = document.getElementById('osNoticeHome');
    if (host) host.innerHTML = '<div class="notice">📢 <b>공지</b> — 견본</div>';
    const after = now();
    if (host) host.innerHTML = '';
    return { before, after };
  });
  is(S2.before === S2.after,
     '  공지가 있으나 없으나 <b>뼈대가 같다</b> — ' + (S2.before === S2.after ? '같음' : ('\n      전 ' + S2.before + '\n      후 ' + S2.after)));
  const noti = await A.p.evaluate(() => {
    const e = document.getElementById('hmNotiLine');
    return { has: !!e, txt: e ? (e.innerText || '').replace(/\s+/g, ' ').trim() : '', h: e ? Math.round(e.getBoundingClientRect().height) : 0 };
  });
  is(noti.has && noti.h > 0, '  소식 자리가 <b>늘 있다</b> — ' + noti.h + 'px');
  is(/없습니다|공지|알람|알림/.test(noti.txt), '  없으면 <b>없다고 적는다</b> — 「' + noti.txt.slice(0, 40) + '」');
  /* ★ 하나뿐인 예외 — 준비 SQL. <b>이름으로</b> 빼고 까닭은 이 파일 머리에 */
  const setup = await A.p.evaluate(() => !!document.getElementById('osSetupHome'));
  is(setup, '  <b>준비 SQL 은 그 자리(홈 맨 위)에 그대로</b> 있다 — 여러 화면이 거기라고 가리킨다 (사장님 ★)');

  console.log('\n[3] 옮긴 화면이 <b>새 자리에 실제로 있는가</b>');
  /* ⚠ <b>여기서 화면을 열어 보지 않습니다.</b> 처음에 go() 로 하나씩 열어
     봤더니 mycal·clients·teamhub 가 안 열렸는데, <b>앱이 아니라 이 점검의
     견본이 얕아서</b>였습니다(고객·팀을 안 실어 둔 판). 화면이 실제로 열리는지는
     <b>smoke.js 가 96개를 다 열어</b> 이미 봅니다 — 사장님도 ③ 에 「smoke」 라고
     적어 두셨습니다. 같은 일을 두 곳에서 하면 얕은 쪽이 헛것을 잡습니다 (5번·8번).
     여기서 묻는 것은 <b>「그 화면이 메뉴에 있나」</b> 입니다 — 없으면 단추를
     눌러도 안 열리고, 그때는 옮긴 것이 아니라 <b>지운 것</b>입니다.        */
  const opened = await A.p.evaluate(() => HM_MOVED.map(x => ({
    t: x.t, n: x.n, was: x.was,
    ok: (typeof navItemOf === 'function') ? !!navItemOf(x.t) : false
  })));
  const shut = opened.filter(x => !x.ok);
  is(shut.length === 0, '  옮긴 곳이 <b>다 메뉴에 있다</b> — ' + opened.map(x => x.n).join(' · ') +
     (shut.length ? (' ← 메뉴에 없다: ' + shut.map(x => x.t).join(' ')) : '') +
     ' (실제로 열리는지는 smoke 가 96개를 다 엽니다)');
  is(opened.length >= 5, '  옮긴 곳이 <b>' + opened.length + '군데</b> 적혀 있다 — ' +
     opened.map(x => x.was + '→' + x.n).join(' · '));
  /* 안 세우는 단추가 없는가 — hmMovedHtml 이 navItemOf 로 거르는지 글자로 본다 */
  const SRCX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const mvFn = SRCX.slice(SRCX.indexOf('function hmMovedHtml'), SRCX.indexOf('function hmMovedHtml') + 900);
  is(/navItemOf/.test(mvFn),
     '  <b>메뉴에 없는 화면은 단추를 안 세운다</b> — 눌러도 안 열리는 단추는 「지웠다」 보다 나쁘다 (1번)');

  console.log('\n[4] <b>옮겼다는 안내</b>가 있는가 (「지웠다」로 읽히면 팀원이 안 씁니다)');
  await A.p.evaluate(() => { go('home'); });
  await A.p.waitForTimeout(400);
  const mv = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-mv');
    if (!e) return { no: true };
    const bs = [...e.querySelectorAll('button')];
    return { txt: (e.innerText || '').replace(/\s+/g, ' ').trim(), n: bs.length,
      h: Math.round(e.getBoundingClientRect().height),
      tap: Math.min.apply(null, bs.map(x => Math.round(x.getBoundingClientRect().height))) };
  });
  is(!mv.no, '  안내 줄이 <b>있다</b> — 「' + (mv.txt || '(없음)').slice(0, 44) + '」');
  is(!mv.no && /옮겼|여기로|이사/.test(mv.txt),
     '  <b>「옮겼다」 고 적는다</b> — 「지웠다」 로 읽히면 팀원이 안 씁니다');
  is(!mv.no && mv.n >= 5, '  <b>어디로 갔는지</b> 하나하나 적는다 — ' + mv.n + '군데');
  is(!mv.no && mv.tap >= 44, '  눌러서 <b>바로 간다</b> · 손가락 크기 44px — ' + mv.tap + 'px');
  is(!mv.no && mv.h <= 120, '  안내는 <b>한 줄</b>이다 — ' + mv.h + 'px (덩어리가 되면 넷을 넘긴다)');

  console.log('\n[5] 홈을 그리는 동안 <b>터진 곳이 없다</b>');
  is(A.errs.length === 0, '  콘솔 에러 ' + A.errs.length + '건' + (A.errs.length ? (' ← ' + A.errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ 홈 모양 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
  console.log('✓ 홈은 「오늘 카드」만 남았고, 나머지는 옮겼다고 적혀 있습니다.');
})();
