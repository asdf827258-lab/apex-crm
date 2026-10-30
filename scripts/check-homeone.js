/* ══════════════════════════════════════════════════════════════════
   check-homeone.js — <b>홈이 늘 같은 모양인가, 그리고 짧은가.</b>

   사장님 말씀 (2026-09-21) —
     「홈 화면이 너무 복잡하고 <b>화면이 자꾸 달라서</b> 힘들다」
     「오늘 해야할일을 홈에서 모두 다 할수 있도록」
     「오늘 인스타 올릴 뉴스도 만들어서」

   재 보니 그 말씀이 맞았습니다. 홈이 <b>3,541px(폰 4.2화면)</b> 에 단추가
   104개였고, 그중 <b>준비 SQL 425px · 출발 점검 778px · 팀 270px</b> 가
   상태에 따라 떴다 사라졌다 했습니다. <b>1,473px</b>, 화면 한 장 반이 매번
   나타났다 없어지니 같은 화면일 수가 없었습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>칸 차례가 늘 같은가</b> — 준비할 것이 있든 없든, 팀이 있든
         없든 홈의 뼈대가 <b>글자 하나 안 달라져야</b> 한다. 이것이
         「화면이 자꾸 다르다」 를 막는 유일한 자(尺)다.
     [2] <b>짧아졌는가</b> — 폰에서 3.3화면을 넘지 않는다
     [3] ⚙️ 관리 — 접혀 있고, <b>머리에 무엇이 남았는지</b> 적히고,
         펴면 셋이 다 있다 (지운 것이 아니다)
     [4] 📸 오늘 올릴 것 — <b>받아 둔 진짜 기사</b>만 · 제목·언론사·날짜·원문
     [5] <b>기사를 지어내지 않는가</b> (9번) — 받아 둔 것이 없으면
         제목을 만들지 않고 「못 받았다」 고 적고 받아 오는 자리로 모신다
     [6] <b>오늘 고른 기사는 다시 열어도 같은가</b> — 열 때마다 다른 것이
         뜨면 그것이 바로 「화면이 자꾸 다르다」 이다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
/* ⏰ 시계를 못 박는 자리는 <b>한 곳</b>입니다 (5번) — scripts/lib-clock.js.
   네 자(여기 · check-phonefit · check-msfive · check-homeshape)가 같이 씁니다. */
const CLK = require('./lib-clock.js');
const ROOT = process.cwd(), PORT = 8897;
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
/* ══ 🏠 <b>홈 길이 선 — 한 곳에서만 정합니다</b> (5번) ════════════════

   ⚠ <b>이 수는 자가 정한 것이 아니라 사장님이 정하신 것</b>입니다.
     「홈이 한 화면에 들게」 (대장 X03 · 2026-09-25).
     그래서 여태 <b>올리지 않고 줄일 때마다 같이 내렸습니다</b> — 4.2 →
     3.95 → 3.9 → 3.6.

   ★★ <b>2026-10-30 · 3.6 → 4.4 · 처음으로 올립니다</b> (판 X248).
     까닭은 하나뿐입니다 — <b>사장님이 선을 푸셨습니다.</b>
       「오늘 화면 부터 재구성하고 지역동선하고 <b>내가 추천 띄우고</b>
        뉴스부터 멘트까지 <b>오늘 한칸에서 다 할 수 있도록</b> 했는데
        안되어있어서」 → 여쭈니 <b>「홈이 길어져도 괜찮다」</b> 를 고르셨습니다.
     ★ 「눈금을 올리지 않는다」(8번)는 <b>그대로</b>입니다. 이 선만이
       예외인 까닭은, 이것이 <b>자의 눈금이 아니라 사장님의 말씀</b>이고
       그 말씀을 사장님이 바꾸셨기 때문입니다. <b>다른 자는 하나도 안
       올렸습니다.</b>
     ★ 잰 값은 <b>3,576~3,580px(4.24화면)</b> 입니다 — 🚗 동선 추천을 펴
       두어 155 → 576px 이 되었습니다(판 X142 가 적어 둔 그 수입니다).
     ★★ <b>왜 4.3 이 아니라 4.4 인가</b> — <b>이 자의 씨가 사장님 서버보다
       가볍습니다.</b> 같은 날 `check-hmpoint` 이 재어 보니, 🎯 접촉포인트 ·
       🤝 독려 칩 <b>세 토막</b>(90px)이 서는 씨에서는 홈이 <b>3,663px ·
       4.34화면</b> 입니다. 이 자의 씨에는 그 칩이 설 자료가 없어 <b>그 90px
       를 아예 못 재고</b> 있었습니다. 전에도 같은 함정을 밟았습니다 —
       `check-pexlate` 쪽지의 「이 자의 씨에는 약속 날짜가 한 줄도 없어」.
       그래서 선은 <b>진짜 홈(4.34)</b> 위에 둡니다. 남은 자리 — 이 씨로는
       <b>138px</b>, 세 토막이 선 씨로는 <b>33px</b>.
     ★ 선을 쓰는 자는 넷입니다 — 이 자 · `check-phonefit`(home.screens) ·
       `check-hmpoint`(선화면) · 그리고 씨가 무거운 둘(`check-pexlate` 5.6 ·
       `check-msfive` 5.5)은 <b>여기에 제 씨 몫을 더해</b> 씁니다. 까닭은
       <b>여기 한 곳</b>에만 적습니다 (5번).
     ★ <b>다음에 또 올리지 마십시오.</b> 줄이면 그때는 같이 내리십시오 (0-1번).

   ⬇ <b>2026-10-30 · 4.4 → 3.8 · 같은 날 도로 내립니다</b> (판 X249).
     사장님께서 라이브를 보시고 <b>「칸을 너무 잡아 먹는거 같아, 오른쪽에
     조그만하게」</b> 하셔서, 🚗 추천을 접이 밖으로 내고 나머지를 접었습니다.
     그리고 「지금 할 것 ｜ 활동」 두 기둥을 「오늘」 카드 안으로 올렸습니다.
     잰 값 — 세 때 모두 <b>3,050~3,054px · 3.61~3.62화면</b>(올리기 전
     3.52 와 거의 같은 자리로 돌아왔습니다).
     ★ <b>줄였으면 눈금도 같이 내립니다</b> (0-1번) — 이것이 규칙이고,
       올린 날 바로 다음에 내리는 것도 같은 규칙입니다.
     ★ 3.62 에 딱 붙이지 않고 <b>3.8</b> 로 둡니다 — 🎯·🤝 칩이 서는 씨
       (check-hmpoint)에서는 세 토막 68px 가 더 붙고, 글자 한 줄만 길어져도
       헛 빨간불이 켜집니다 (8번). 남은 자리 <b>153px</b>.                 */
const HOME_SCR = 3.8;
const HOME_MAX = Math.round(844 * HOME_SCR);

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
 /* ★★ <b>약속 날짜(appt)를 심습니다</b> (2026-10-12 · 판 X90) — 그전에는 한
    줄도 없었습니다. 그래서 「🕗 약속지남」 칸이 <b>안 서는 상태</b>만 재고
    있었는데, <b>사장님 서버에는 142건이 있습니다.</b> 없는 상태를 재어 초록이
    되면 사장님 폰에서만 선을 넘습니다 (8번 · 판 X80·X84 에서 데인 그 자리).
    ★ <b>지난 것 둘 · 앞으로 하나</b>를 섞습니다 — 칸이 서는 판과 그 칸이
      셈을 바르게 하는 판을 한 씨에서 봅니다. 못 박은 날은 2026-10-09 입니다. */
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'일반',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:'',appt:''},
        {id:'d3',who:'me',name:'홍길동C',region:'순천',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:'',appt:'2026-08-20T10:00:00Z'},
        {id:'d4',who:'me',name:'홍길동D',region:'순천',src:'일반',stage:'PC',days:6,n:3,res:'상담',cAt:'',pAt:'',appt:'2026-09-25T10:00:00Z'},
        {id:'d2',who:'u2',name:'홍길순B',region:'천안',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:'',appt:'2026-10-20T10:00:00Z'}];
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
 /* ⚠ 2026-10-02 · <b>이 자가 눈을 감고 있던 자리</b>입니다. 연속 가동(ACT)을
    안 심어 두어 곁기둥 「이번 주」 카드가 늘 <b>「아직 못 읽었습니다」</b> 꼴로
    섰습니다. 그러면 그 카드에 줄을 더해도 <b>이 자가 못 봅니다</b> — 실제로
    전화·만남 두 수를 넣었는데 여기서는 3,534px 그대로였고, 사장님 화면에서만
    17px 길어졌을 것입니다. <b>초록이지만 재지 않은 초록</b>입니다 (8번).
    그래서 <b>다 읽은 판</b>으로 심어 카드가 제 꼴로 서게 합니다.          */
 (function(){ var t=(typeof mcalToday==='function')?mcalToday():'';
   if(t){ ACT.day={}; ACT.day[t]={call:1,cli:0,rep:0,chk:0};
          ACT.from='2000-01-01'; ACT.at=Date.now(); }
   window.actLoad=function(){};                  /* 서버는 안 부릅니다 (7번) */
 })();
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
    /* 🏛 <b>두 기둥은 껍데기다 — 속을 본다</b> (2026-09-30). 홈이 넓은
       화면에서 두 기둥(.hm-2col)이 되었습니다. 껍데기를 그대로 세면
       왼쪽에 큰 카드를 <b>넷을 쌓아도</b> 「덩어리 하나」 가 되어 이 자가
       <b>눈을 감습니다</b>. 자를 약하게 하지 않고 <b>펴서</b> 옛날과
       똑같이 셉니다 (8번). 폰에서는 두 기둥 규칙이 없지만 껍데기 div 는
       그대로라, 폭과 상관없이 폅니다.                                  */
    const TOPS = (h) => { const o = [];
      for (const e of h.children) {
        if (e.classList && e.classList.contains('hm-2col')) {
          for (const col of e.children) for (const c of col.children) o.push(c);
        } else o.push(e);
      } return o; };
  return TOPS(pane).map(e => {
    const r = e.getBoundingClientRect();
    if (r.height <= 8) return null;
    const id = e.id || (e.className.toString().split(/\s+/)[0] || e.tagName.toLowerCase());
    /* 잡으려는 것은 준비 SQL 425px · 출발 점검 778px 처럼 <b>화면 한 장
       반이 통째로</b> 생겼다 없어지는 것이다. 카드 <b>안</b>에 소식 한 줄
       (90px)이 늘어난 것은 칸이 생긴 것이 아니라 <b>안에서 말이 달라진
       것</b>이라 잡지 않는다 — 헛것을 잡는 점검은 안 잡는 점검보다 나쁘다 (8번).

       ⚠ 2026-09-25 · <b>눈금으로 뭉뚱그리지 않는다.</b> 여태 height/400 을
         반올림해 견줬는데, 카드가 그 <b>눈금 경계에 걸리면</b> 90px 차이가
         눈금 하나를 넘어 「다른 화면」 이 됐다 — 실제로 두 번 그렇게 울렸고
         두 번 다 화면은 멀쩡했다. 이제 <b>키를 그대로 들고</b> 나가서
         아래 sameBones 가 <b>차이로</b> 견준다. 뜻은 그대로고 경계만 없앴다. */
    return id + '~' + Math.round(r.height);
  }).filter(Boolean);
});
/* 두 뼈대가 <b>같은 화면</b>인가 — 칸 이름과 차례가 같고, 높이 차이가
   <b>반 화면(400px) 안</b>이면 같은 화면이다. 칸이 통째로 생겼다 없어지면
   이름이 어긋나거나 차이가 그보다 크다.                                */
const BONE_GAP = 400;
const sameBones = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i].split('~'), y = b[i].split('~');
    if (x[0] !== y[0]) return false;
    if (Math.abs((+x[1] || 0) - (+y[1] || 0)) >= BONE_GAP) return false;
  }
  return true;
};
/* 사람이 읽을 수 있게 — 이름만 이어 적는다 (숫자는 매번 달라 눈만 어지럽다) */
const boneNames = (a) => a.map(x => x.split('~')[0]).join(' → ');
const tall = (p) => p.evaluate(() => {
  const pane = document.querySelector('.tab-pane.on'); if (!pane) return 0;
    /* 🏛 <b>두 기둥은 껍데기다 — 속을 본다</b> (2026-09-30). 홈이 넓은
       화면에서 두 기둥(.hm-2col)이 되었습니다. 껍데기를 그대로 세면
       왼쪽에 큰 카드를 <b>넷을 쌓아도</b> 「덩어리 하나」 가 되어 이 자가
       <b>눈을 감습니다</b>. 자를 약하게 하지 않고 <b>펴서</b> 옛날과
       똑같이 셉니다 (8번). 폰에서는 두 기둥 규칙이 없지만 껍데기 div 는
       그대로라, 폭과 상관없이 폅니다.                                  */
    const TOPS = (h) => { const o = [];
      for (const e of h.children) {
        if (e.classList && e.classList.contains('hm-2col')) {
          for (const col of e.children) for (const c of col.children) o.push(c);
        } else o.push(e);
      } return o; };
  const L = TOPS(pane).map(e => e.getBoundingClientRect());
  return Math.round(Math.max.apply(null, L.map(r => r.bottom + scrollY)));
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  /* ★ h 를 안 주면 <b>낮(14시)</b>입니다 — 여태 CI 가 돌던 때라, 위에 적어 둔
     옛 눈금(3,534px 따위)이 <b>그 때의 것</b>이기 때문입니다. 아래 [1-b] 가
     세 때를 따로 돕니다. */
  const open = async (o, h) => {
    const ctx = await b.newContext(CLK.ctxOpt());
    await CLK.pin(ctx, (h === undefined) ? 14 : h);
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 130)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o)); await p.waitForTimeout(2400);
    return { ctx, p, errs };
  };

  console.log('\n[1] <b>매일 보는 칸 차례가 늘 같다</b>');
  /* ⚠ <b>서버 준비 SQL 은 여기서 재지 않습니다.</b> 한 번 접어 봤다가
     check-setup 이 잡았습니다 — 여러 화면이 「홈 맨 위 서버 준비 SQL」 이라고
     가리키고 있어 묻으면 그 안내가 전부 거짓말이 됩니다(1번). 그리고 그것은
     <b>한 번 하면 영영 사라지는</b> 것이라 「자꾸 달라지는」 범인이 아닙니다.
     범인은 <b>매일 떴다 사라지던</b> 출발 점검(778px)·팀(270px) 이었고,
     여기서 재는 것도 그것입니다. 「홈 맨 위에 있나」 는 check-setup 이 봅니다. */
  /* ★ <b>씨를 한 번만 적습니다</b> (5번) — 아래 [1-b] 가 세 때를 돌 때
     <b>같은 씨</b>를 써야 같은 홈을 잽니다. 처음에 빈 씨로 돌렸다가
     3,398px(소식 칸이 없는 홈)을 재고 「4.03화면」 이라고 적었습니다 —
     4.2 선은 <b>이 씨의 홈</b>에 맞춰 둔 것이라 견줄 수 없는 수였습니다. */
  const SEED_A = { setup: false, news: true };
  const A = await open(SEED_A);
  const B = await open({ setup: false, news: true, ready: false });
  const ba = await bones(A.p), bb = await bones(B.p);
  is(ba.length > 0 && sameBones(ba, bb),
     '  <b>출발 점검이 있을 때와 없을 때가 같은 화면</b>이다');
  if (!sameBones(ba, bb)) {
    console.log('     있을 때 · ' + ba.join(' → '));
    console.log('     없을 때 · ' + bb.join(' → '));
  } else console.log('     ' + boneNames(ba));
  const C = await open({ setup: false, news: false });
  const bc = await bones(C.p);
  is(sameBones(bc, ba),
     '  소식을 못 받았을 때도 <b>뼈대가 같다</b> — 칸은 서고 안에서만 말이 달라진다' +
     (sameBones(bc, ba) ? '' : ('\n     받았을 때 · ' + ba.join(' → ') +
                               '\n     못 받았을 때 · ' + bc.join(' → '))));

  console.log('\n[2] <b>짧아졌다</b> — 폰에서 3.3화면 이하');
  /* ── 기준선 · 왜 3.0 인가 ─────────────────────────────────────────
     2026-09-21 · 고치기 전 <b>4.2화면</b>(3,541px). 접고 나서 2.7화면.
     그 뒤에 사장님 말씀대로 카드 안에 <b>오늘 보낼 소식 한 줄</b>(90px)과
     <b>다음 분</b> 줄(70px)을 더해 2.85화면이 됐다. 얻은 것이 분명하고
     둘 다 매일 쓰는 줄이라 그만큼은 치른다.
     이 자는 <b>생각 없이 늘어나는 것</b>을 막으려는 것이다 — 넘기면
     무엇을 얻고 치렀는지 여기에 적고 올려야 한다 (check-phonefit 와 같은 규칙).

     ── 2026-09-21 · <b>3.0 그대로</b> ───────────────────────────────
     사장님 말씀대로 <b>🌅 아침 미션 다섯</b>이 홈에 들어왔지만, 홈의 다른
     큰 칸들과 똑같이 <b>접힌 채로</b> 섭니다. 그래서 여기서 재는 값은 안
     변하고 자도 그대로 3.0 입니다.
     한 번 펴 봤다가 <b>check-phonefit</b> 가 잡았습니다 — 「처음에는 다 접힌
     채로 연다」 는 규칙이 이미 있고, 펴 두면 「오늘 할 일」 이 1,173px 로
     밀려 첫 화면 밖으로 나갑니다. 규칙이 옳았습니다.
     <b>펴 놓았을 때</b>의 자는 <b>check-msfive</b> 가 따로 듭니다 — 미션
     칸은 한 화면(844px) 이하. 이쪽이 이 기능의 진짜 자입니다.

     ── 2026-09-23 · <b>3.0 → 3.3</b> ─────────────────────────────────
     사장님 말씀 — 「APEX YUN PRO 를 토스처럼 바꿉니다」, 그리고 목업을
     보시고 <b>「목업대로 가줘」</b>. 그래서 홈 맨 위에 카드 스택이 섰습니다 —
     인사 한 줄(52px) · <b>파랑 히어로</b>(193px) · <b>지금 할 것</b> 카드
     (172px), 사이 여백까지 <b>438px</b>.

     <b>먼저 줄였습니다 — 201px.</b> 자를 올리기 전에 <b>겹치는 말</b>부터
     걷어냈습니다 (5번).
       · <b>이번 주 한 줄</b>(121px) 을 안 세웁니다. 목업의 그 줄은
         「3명만 더 만나면 <b>연속가동</b> 유지돼요」 인데 우리에게 연속가동
         세는 자리가 없습니다. 지어내면 1번을 어기고, 대신 넣어 본 말은
         「오늘 챙길 것」 머리와 같은 말이라 5번을 어겼습니다. 그래서
         <b>아무 숫자도 만들지 않고</b> 그 줄을 비웠습니다.
       · <b>「오늘 N개예요」 큰 글씨</b>(80px) 를 뺐습니다 — 바로 위 인사가
         이미 같은 말을 합니다. 다만 <b>아직 없을 때·읽는 중</b>일 때는
         그대로 둡니다. 거기서만 「아직 읽는 중」 과 「진짜 없다」 가
         갈리기 때문입니다 (1번).
       2,874px → <b>2,673px</b>.

     <b>남은 것은 카드 스택 자체입니다 — 그것을 시키셨습니다.</b>
     「지금 할 것」 카드가 아래 한 분 카드의 머리와 같은 말을 하는 것은
     맞습니다. 그래도 <b>아래 머리를 지우지는 않았습니다</b> — `.hm-now-m`
     은 홈 말고 <b>다른 화면에도</b> 서고(check-tdo 가 `#dynPane` 에서 봅니다),
     check-homeday · check-hmsheet · check-tdo · 이 점검까지 <b>넷</b>이
     그것을 「그 분이 누구인가」 의 한 자리로 보고 있습니다. 지우면 위가
     없는 화면들이 머리를 잃습니다.

     <b>얻은 것</b> — 홈을 열면 오늘 할 일이 <b>큰 글씨 한 장</b>으로 먼저
     섭니다. <b>치른 것</b> — 0.3화면(2,532 → 2,673px, 141px).
     <b>다음에 줄일 자리</b> — 「지금 할 것」 카드와 한 분 카드 머리를
     <b>한 자리로 합치는 것</b>(172px). 넷이 보고 있어 점검까지 같이
     옮겨야 하므로 이 판에서는 안 했습니다. */
  /* ── 2026-09-27 · <b>3.3 → 3.5</b> (올립니다 — 부끄럽지만 적어 둡니다) ──
     사장님 말씀 X07 「홈 화면에서 고객의 모든걸 컨트롤 할수 있도록
     <b>질문을 띄우고</b> 쉽게해」. 「한 가지만 물어봅니다」 카드가 홈에
     섰습니다 — 물음 한 줄 + 까닭 + 답 칩 넉 장, <b>254px</b>.
     2,654px → <b>2,908px</b>.

     <b>먼저 깎았습니다.</b> 홈에서는 세는 줄(아는 것 N/8)·자·꼬리글을
     안 그립니다(상세에서는 그대로 섭니다). 그러고도 254px 입니다 —
     물음 한 줄과 칩 두 줄은 더 깎을 데가 없습니다. 칩을 줄이면 답할
     길이 줄고, 까닭을 빼면 왜 여쭙는지가 사라집니다.

     <b>더 깎을 수 있었지만 안 한 것</b> — 카드 상자(.t-card)는 흰 카드
     위 흰 상자라 눈에 안 보이면서 56px 을 먹습니다. 빼면 3.44화면이
     되는데, <b>그래도 3.3 을 못 맞춥니다.</b> 보이지도 않는 56px 때문에
     칸 사이 숨 쉴 자리를 없애는 것은 남는 장사가 아닙니다.

     <b>얻은 것</b> — 홈에서 고객의 빈칸을 <b>한 번에 한 가지씩</b> 채웁니다.
     고객 365일로 건너가지 않습니다. <b>치른 것</b> — 0.2화면(254px).
     ★ <b>자를 올린 것은 사실입니다.</b> 홈 높이를 재는 자가 넷인데
       (여기 · check-phonefit · check-msfive · check-homeshape) 그 중 <b>둘</b>을
       올렸습니다. 남은 둘은 안 올렸습니다 — 접은 카드는 1027px 에서
       <b>620px</b> 로 오히려 줄었습니다(접으면 물음도 같이 접힙니다).
     <b>다음에 줄일 자리</b> — 위 두 줄 그대로입니다. 「지금 할 것」 카드와
     한 분 카드 머리를 한 자리로(172px). 넷이 보고 있어 따로 손대야 합니다. */
  /* ── 2026-09-27 · <b>3.5 → 3.8</b> (두 번째로 올립니다 — 적어 둡니다) ──
     사장님 말씀 (목각) 로 「지금 할 것」 카드에 <b>판단</b>(① 가입이 되는
     분인가 ② 어느 통장이 비었나 ③ 무엇을 펴 놓나 · 다음 PC)과 <b>앱이
     이미 아는 것</b>(눌러서 가는 칩 셋)이 섰습니다. 2,975 → <b>3,175px</b>.

     <b>먼저 깎았습니다.</b> 접으면 판단도 <b>같이 접힙니다</b> — 그래서
     접힌 카드는 여전히 한 화면에 듭니다(check-homeshape 초록). 「아는 것」
     줄은 상자(t-note.g)에서 <b>설명 줄(t-sub)</b> 로 낮췄습니다 — 상자는
     자리를 먹고, ui.css 에 박힌 hex 까지 화면에 들입니다.

     <b>더 깎을 수 있었지만 안 한 것</b> — 판단을 「이분 자세히」 뒤로 넣으면
     0px 이 되는데, <b>목각에서는 큰 단추 바로 위에 보입니다</b>. 보여야 할
     것을 숨겨 자를 맞추는 것은 자를 속이는 것입니다 (8번).

     <b>얻은 것</b> — 그 자리에서 <b>무엇을 가릴지</b>와 <b>앱이 무엇을
     아는지</b>가 보입니다. 칩을 누르면 그 화면으로 바로 갑니다.
     <b>치른 것</b> — 0.3화면(200px).
     ★ 판 ②(접기)에서는 <b>하나도 안 올렸습니다</b> — 오히려 2,778 →
       2,662px 로 줄였습니다. 여기서는 올립니다. 정직하게 적어 둡니다.  */
  const hA = await tall(A.p);
  /* 🔍 <b>어디가 길어졌나</b> — HOME_DEBUG=1 로 돌리면 「오늘 챙길 것」 안의
     칸마다 높이를 찍어 줍니다. 홈이 선을 넘었을 때 <b>어느 칸인지</b>를
     손으로 찾느라 두 판을 버려서 넣어 둡니다 (check-read 의 READ_DEBUG 와 같은 결). */
  if(process.env.HOME_DEBUG){
    const B = await A.p.evaluate(() => {
      const pane=document.querySelector('.tab-pane.on'); if(!pane)return [];
      const TOPS=(h)=>{const o=[];for(const e of h.children){
        if(e.classList&&e.classList.contains('hm-2col')){for(const c of e.children)for(const d of c.children)o.push(d);}
        else o.push(e);} return o;};
      const t=document.getElementById('hmToday');
      const o=[];
      if(t){ const walk=(el,d)=>{ [].slice.call(el.children).forEach(c=>{
        const r=c.getBoundingClientRect(); if(r.height<=0)return;
        o.push('  '.repeat(d)+((c.id||(c.className||'').toString().split(' ')[0]||c.tagName))+' h'+Math.round(r.height));
        if(d<2)walk(c,d+1); }); }; walk(t,0); }
      return o;
    });
    console.log('      · 덩어리: '+B.join(' | '));
  }
  /* ── 2026-10-01 · <b>3.8 → 3.9</b> (세 번째로 올립니다 — 적어 둡니다) ──
     「📥 읽어 둔 보장분석」 카드가 섰습니다(사장님 말씀 「읽어 둔 보장분석
     카드 만들어줘」). 3,158 → <b>3,280px</b> · 3.89화면. 늘어난 122px 은
     <b>카드 한 장의 값</b>입니다 — t-card 위아래 여백 40px + 이름표 + 제목
     한 줄 + 설명 한 줄. 더 깎으려면 적을 것을 빼야 하는데, 사장님 말씀대로
     <b>없는 날도 자리를 지켜야</b> 합니다 (2026-09-26).
     ★ <b>자를 없애지 않습니다</b> — 0.1화면만 올립니다. 다음에 또 카드를
       더하면 그때 다시 울립니다.                                        */
  /* ── 2026-10-02 · <b>3.9 → 4.1</b> (네 번째로 올립니다 — 적어 둡니다) ──
     🔔 알람 칩과, 「아직 세는 자리가 없습니다」 에서 <b>센 수</b>로 바뀐 곁기둥
     카드입니다(사장님 말씀 「알람 칩도 세워줘」). 3,280 → <b>3,387px</b> · 4.01화면.
     ★ 4.0 이 아니라 <b>4.1</b> 로 둡니다 — 4.01 은 기준에 너무 붙어, 글자 한 줄만
       길어져도 이 판과 상관없이 빨간불이 켜집니다(헛것 · 8번).
     ★ <b>고치기 전 4.2개</b> 라는 기준은 그대로 둡니다 — 아직 그보다 짧습니다. */
  /* ── 2026-10-02 · <b>4.1 → 4.2</b> · ★★ <b>여기가 끝입니다</b> ────────
     📆 이번 주 격자가 「오늘 챙길 것」 맨 밑에 섰습니다(사장님 말씀).
     3,387 → <b>3,534px</b> · <b>4.19화면</b>.
     ★ <b>4.2 는 아무 수가 아닙니다</b> — 이 자를 만들 때 「고치기 전」 홈이
       4.2화면이었습니다. 그것보다 길어지면 <b>「홈을 한 장으로」 가 거짓</b>이
       됩니다. 그래서 더 올리지 않고 <b>딱 거기</b>에 둡니다.
     ★ 남은 자리가 <b>11px</b> 뿐입니다(844×4.2 = 3,544). 다음에 무엇을
       더하면 그 자리에서 울립니다 — 그때는 <b>올리지 말고 줄이십시오.</b>
       줄일 자리는 사장님께 여쭐 일입니다(무엇을 접을지는 제가 고를 것이
       아닙니다).
     ★ 좁다고 헛것이 아닙니다 — 이 자가 지키는 것이 바로 <b>그 선</b>입니다.
     ⬇ <b>2026-10-26 (판 X199) · 4.2 → 3.95.</b> 사장님 말씀 「ⓒ로 해줘」 로
       맨 위 두 칸이 하나가 되었습니다 — 182px 짜리 칸이 통째로 사라져 세 때
       모두 <b>3,242~3,246px · 3.84~3.85화면</b> 입니다. <b>줄였으면 눈금도
       같이 내립니다</b> (0-1번). 3.85 가 아니라 <b>3.95</b> 로 둡니다 — 딱
       붙여 두면 글자 한 줄만 길어져도 이 판과 상관없이 헛 빨간불이 켜집니다
       (8번). 남은 자리 <b>87px</b>. 다음에도 <b>올리지 말고 줄이십시오.</b>
     ⬇ <b>2026-10-27 (판 X219) · 3.95 → 3.9.</b> 팀원 고르개를 「지금 할 것」
       위로 올리면서(사장님 말씀) 내 화면에서는 설명 줄을 접어, 세 때 모두
       <b>3,193~3,197px · 3.78~3.79화면</b> 이 되었습니다 (전 3,242~3,246px).
       <b>줄였으면 눈금도 같이 내립니다</b> (0-1번). 남은 자리 <b>94px</b>.
     ⛔ <b>같은 판에서 2,878px(3.41화면)까지 갔다가 되돌렸습니다.</b> 곁칸 셋을
       두 열 타일로 접은 것인데, 자 넷(check-hmwk · check-hmrun · check-hmmadi ·
       check-mstans)이 울었습니다 — 한 줄로 접으면 「아직 N건」 · 「계약일 모름
       N분」 · 「오늘은 아직입니다」 처럼 <b>사장님이 읽으시는 수</b>가 사라집니다.
       <b>짧게 하려고 세는 수를 없애지 않습니다</b> (1번).
     ⬇ <b>2026-10-28 (판 X223) · 3.9 → 3.6.</b> 사장님이 「① 곁칸 셋을 접기」 를
       고르셨습니다 — 타일이 아니라 <b>접이</b>라 글이 한 자도 안 없어지고
       누르면 펴집니다. 세 때 모두 <b>2,969~2,973px · 3.52화면</b>
       (전 3,193~3,197px). 줄였으면 눈금도 같이 내립니다 (0-1번).
       남은 자리 <b>66px</b>. 다음에도 올리지 말고 줄이십시오. */
  is(hA > 0 && hA <= HOME_MAX,
     '  홈 높이 <b>' + hA + 'px</b> = 화면 ' + (hA / 844).toFixed(2)
       + '개 — 선은 <b>' + HOME_MAX + 'px</b>(' + HOME_SCR + '화면) 입니다'
       + ' (2026-10-30 사장님이 「홈이 길어져도 괜찮다」 로 선을 푸셨습니다 · 판 X248)');

  /* ── ⏰ 2026-10-10 · <b>세 때를 다 잽니다</b> (판 X78 · 사장님 말씀) ────
     사장님 말씀 — 「홈 높이 자에 <b>시계 못 박는</b> 다음판 해줘」.

     ★★ <b>여기가 세 판을 그냥 통과시켰습니다.</b> 홈은 때에 따라 길이가
       다른데(아침·낮·저녁으로 카드와 글이 갈립니다) 이 자가 <b>그냥
       「지금」 을 쟀습니다.</b> 그래서 —
         아침 3,560px · 4.22  ✗      낮 3,540px · 4.19  ✓      저녁 3,586px · 4.25  ✗
       인데 CI 가 14~15시에 돌아 <b>늘 초록</b>이었고, #548·#549·#550 이
       사장님 선(4.2)을 넘긴 채로 들어갔습니다 (판 X77 에서 재어 알았습니다).
     ★ 이제 <b>시계를 못 박고 세 때를 따로</b> 돕니다. 언제 돌려도 같은
       수가 나오고, <b>한 때라도</b> 넘으면 그 자리에서 빨간불입니다.
     ★ 창은 저마다 <b>새로 열고 닫습니다</b> — 못 박은 시계를 되돌릴 일이
       없고, 앞 때의 창고(localStorage)가 뒤 때에 안 섞입니다.
     ⚠ <b>자 넷이 다 못 박아야</b> 합니다. 하나만 박으면 나머지 셋이 때마다
       들쭉날쭉합니다 — check-clockhome 이 그것을 봅니다 (8번).         */
  /* ══ [1-a2] 🚗📰 <b>오늘 칸이 「한 칸에서 다」 되나</b> (판 X248) ══════

     사장님 말씀 2026-10-30 — 「오늘 화면 부터 재구성하고 <b>지역동선하고
     내가 추천 띄우고 뉴스부터 멘트까지 오늘 한칸에서 다 할 수 있도록</b>
     했는데 <b>안되어있어서</b>」.

     ── 재어 보니 둘 다 <b>만들어져 있는데 안 돌고</b> 있었습니다 ──
       ① 🚗 동선 추천은 <b>접는 칸 안</b>에 있어 한 번 더 눌러야 보였습니다.
          사장님은 <b>두 번</b> 말씀하셨습니다 — 판 X142 「왜 지역동선에
          추천인들이 안떠」.
       ② 📰 오늘 소식을 받아 두는 몸(nlAuto)이 판 X190~X193 에 다 지어져
          있는데 <b>부르는 자리가 한 곳도 없었습니다.</b> 그래서 홈은 늘
          「받아 둔 소식이 없습니다」 였습니다.
     ★ ②는 <b>글로</b> 봅니다 — 이 자는 바깥을 막아 진짜로 받아 오는지는
       못 봅니다. 하지만 <b>부르는 자리가 0곳이면 영영 안 돕니다</b>.    */
  console.log('\n[1-a2] 🚗📰 <b>오늘 칸이 「한 칸에서 다」 되나</b> (판 X248)');
  /* ⬆ <b>2026-10-30 (판 X249) — 묻는 것은 그대로, 보는 자리가 바뀌었습니다.</b>
     판 X248 에서는 「접이를 펴 두었나」 로 물었습니다. 사장님께서 라이브를
     보시고 <b>「칸을 너무 잡아 먹는거 같아, 오른쪽에 조그만하게」</b> 하셔서,
     추천을 <b>접이 밖으로 꺼내고</b> 접이는 도로 접었습니다.
     ★ 그러니 이제 물을 것은 「펴졌나」 가 아니라 <b>「접지 않아도 보이나」</b>
       입니다 — 더 센 물음입니다. 접이가 접힌 채여도 <b>추천 한 줄과 이름
       알약</b>이 눈에 보여야 합니다.
     ★ <b>자를 무르게 한 것이 아닙니다</b> (8번) — 되돌려서 추천 줄을 도로
       접이 안에 넣으면 이 줄이 웁니다.                                   */
  const RT = await A.p.evaluate(() => {
    const 접힘 = (function () {
      try { const f = document.getElementById('hmFold_rt');
            return f ? f.querySelector('.hm-fold-h').getAttribute('aria-expanded') === 'false' : null; }
      catch (e) { return null; }
    })();
    const 보임 = (e) => !!e && e.getBoundingClientRect().height > 0;
    const rec = document.querySelector('.hm-rt .hm-rt-why');
    const pil = document.querySelectorAll('.hm-rt .hm-rt-pills .hm-rt-p');
    return { 접힘: 접힘, 추천: 보임(rec),
      추천글: (rec && rec.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 44),
      알약: pil.length,
      알약보임: pil.length > 0 && Math.round(pil[0].getBoundingClientRect().height),
      기본: (typeof HM_FOLD_DEF !== 'undefined') ? !!HM_FOLD_DEF.rt : null };
  });
  is(RT.추천 === true && /권합니다|같이 돕니다/.test(RT.추천글),
     '  ★★ 🚗 <b>권하는 동네가 접지 않아도 보인다</b> — 「' + RT.추천글 + '」 (판 X142·X249)');
  is(RT.알약 > 0 && RT.알약보임 >= 44,
     '  ★★ <b>걸 분 이름이 알약으로 바로 보인다</b> — ' + RT.알약 + '개 · ' + RT.알약보임 +
     'px (손가락 바닥 44px)');
  is(RT.접힘 === true && RT.기본 === false,
     '  ★ 그래서 접이는 <b>도로 접힌 것이 기본</b>이다 — 안에 든 것(📞 전화·만나야 할 분)만 접힙니다');
  const SRC0 = fs.readFileSync(path.join(ROOT, 'app', 'index.html'), 'utf8');
  /* ⚠ 처음에는 「nlAuto() 라는 글자가 몇 번 나오나」 로 셌다가 <b>안 울었습니다</b> —
       제가 바로 위에 쓴 <b>주석 속 글자</b>까지 세고 있었습니다. 세는 것은
       <b>부르는 줄</b>이어야 합니다 (헛것을 잡는 자는 안 잡는 자보다 나쁩니다 · 8번). */
  const 부른곳 = (SRC0.match(/typeof\s+nlAuto\s*===\s*'function'\s*\)\s*nlAuto\(\)/g) || []).length;
  is(부른곳 >= 1,
     '  ★★ 📰 <b>오늘 소식을 미리 받아 두는 자리가 있다</b> — nlAuto 를 <b>부르는 줄</b> '
     + 부른곳 + '곳 (0곳이면 몸이 있어도 영영 안 돕니다)');
  is(/document\.hidden/.test(SRC0.slice(SRC0.indexOf('function nlAuto'), SRC0.indexOf('function nlAuto') + 900)),
     '  그 자리가 <b>서버를 아껴 쓴다</b> — 다른 탭에 가 있으면 쉽니다 (7번)');

  console.log('\n[1-b] ⏰ <b>세 때를 다 재다</b> — 시계를 못 박고 (' + CLK.TZ + ')');
  for (const w of CLK.WHEN) {
    const C = await open(SEED_A, w.h);
    const h3 = await tall(C.p);
    is(h3 > 0 && h3 <= HOME_MAX,
       '  ' + CLK.label(w) + ' 홈 <b>' + h3 + 'px</b> = 화면 ' + (h3 / 844).toFixed(2) +
       '개 — ' + w.왜);
    await C.ctx.close();
  }

  /* ── ⚠ 2026-09-26 · <b>⚙️ 관리 접이는 없어졌습니다</b> ──────────────
     사장님 말씀 — 「🚦 출발 점검 → 「나 › 설정」 · 👥 팀 → 「나 › 팀」」.
     접이 안에 있던 둘이 <b>제 화면</b>으로 갔으니 접을 것이 없습니다.
     ★ <b>지운 것이 아닙니다.</b> 그래서 여기서 재는 것도 「접혀 있나」 가
       아니라 <b>「가는 길이 있나 · 거기서 실제로 서나」</b> 로 바뀝니다 —
       자리를 없애면 옮긴 것이 아니라 지운 것이 됩니다 (8번).           */
  console.log('\n[3] 🚦 출발 점검 · 👥 팀 — 옮겼고, <b>가는 길</b>이 있다');
  const m1 = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-mv');
    return { 있다: !!e, 머리: ((e || {}).innerText || '').replace(/\s+/g, ' ').trim(),
      높이: e ? Math.round(e.getBoundingClientRect().height) : 0 };
  });
  is(m1.있다, '  <b>옮긴 자리 한 줄</b>이 있다 — ' + m1.높이 + 'px');
  is(/출발 점검/.test(m1.머리) && /팀/.test(m1.머리),
     '  <b>출발 점검 · 팀</b>이 적혀 있다 — 「' + m1.머리.slice(0, 48) + '」');
  const m2 = await A.p.evaluate(async () => {
    const out = {};
    go('ready'); await new Promise(r => setTimeout(r, 700));
    out.ready = !!document.querySelector('.tab-pane.on');
    out.readyTxt = (document.querySelector('.tab-pane.on') || {}).innerText || '';
    go('home'); await new Promise(r => setTimeout(r, 500));
    return out;
  });
  is(m2.ready && m2.readyTxt.length > 50,
     '  <b>출발 점검이 제 화면에서 선다</b> — 지운 것이 아니다 · ' + m2.readyTxt.length + '자');
  is(await A.p.evaluate(() => {
       const st = document.getElementById('osSetupHome'), t = document.getElementById('hmToday');
       return !!(st && t && (st.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));
     }), '  준비 SQL 자리가 <b>오늘 챙길 것보다 위</b>에 있다');

  /* ⚠ 2026-09-26 · 📸 <b>오늘 올릴 것은 「콘텐츠」(news_live)로 갔습니다.</b>
     사장님 말씀 — 「홈에는 「오늘 올릴 것 1건」 <b>한 줄만</b>」.
     ★ 칸(hmIgHtml)을 <b>통째로 그대로</b> 옮겼습니다 — 재는 것도 그대로이고
       <b>보는 자리만</b> 홈 → news_live 로 옮깁니다. 홈에는 칩 한 줄이 남고
       그것도 여기서 같이 봅니다.                                        */
  console.log('\n[4] 📸 오늘 올릴 것 — <b>받아 둔 진짜 기사</b>만 (「콘텐츠」에서)');
  /* 활동량 줄은 <b>기록이 실려 온 뒤</b>에 그려집니다(hmArm 이 1.2초 뒤 다시
     그립니다 — 동선과 같습니다). 여기서는 기다리지 않고 그 자리를 직접
     깨웁니다 — 늦게 그려지는 것이 이 점검이 볼 자리는 아닙니다. */
  await A.p.evaluate(() => { try { hmPaint(); } catch (e) {} });
  await A.p.waitForTimeout(300);
  const igChip = await A.p.evaluate(() => {
    /* ⚠ 2026-10-13 (판 X96) — 칩 줄에 <b>단추가 여럿</b>이 되었습니다
       (🤝 더 · 🎯 접촉포인트 · 📸 올릴 것). 「첫 단추」 로 찾으면 엉뚱한 칩을
       집어 이 자가 울립니다 — 찾는 것은 <b>올릴 것</b> 칩입니다. 자를 약하게
       한 것이 아니라 <b>이름으로</b> 찾습니다 (8번). */
    const bs = [].slice.call(document.querySelectorAll('.hm-act .g button'));
    const e = bs.filter(b => /올릴 것/.test(b.innerText || ''))[0] || null;
    return { txt: e ? (e.innerText || '').replace(/\s+/g, ' ').trim() : '', has: !!e,
             단추수: bs.length };
  });
  is(igChip.has && /올릴 것/.test(igChip.txt),
     '  홈에는 <b>한 줄만</b> 남는다 — 「' + igChip.txt + '」 (칩 줄의 단추 ' + igChip.단추수 + '개 중)');
  await A.p.evaluate(() => go('news_live')); await A.p.waitForTimeout(700);
  const g = await A.p.evaluate(() => ({
    머리: ((document.querySelector('#hmIgHost .hm-ig-h') || {}).innerText || '').replace(/\s+/g, ' ') ||
          ((document.getElementById('hmIgHost') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 60),
    속: (document.getElementById('hmIgHost') || {}).innerText || '',
    링크: (document.querySelector('#hmIgHost a') || {}).href || '',
    단추: [...document.querySelectorAll('#hmIgHost button')].map(x => x.innerText.trim())
  }));
  is(g.속.indexOf(NEWS[0].t) >= 0, '  <b>제목을 그대로</b> 옮긴다');
  is(g.속.indexOf(NEWS[0].s) >= 0 && g.속.indexOf(NEWS[0].d) >= 0,
     '  <b>언론사·날짜</b>도 그대로 — ' + NEWS[0].s + ' · ' + NEWS[0].d);
  is(g.링크 === NEWS[0].u, '  <b>원문 링크</b>가 그 기사로 간다');
  is(g.머리.indexOf(NEWS[0].t.slice(0, 10)) >= 0, '  <b>머리에 제목</b>이 있다 — 무엇인지 바로 압니다');
  /* ⚠ 2026-10-13 · 단추 이름을 박아 두지 않고 <b>앱에 묻습니다</b> — 「카드뉴스」 로
     박아 두었더니 이름이 「캐러셀로 제작하기」 로 바뀌며 거짓 빨간불이 떴습니다 (5번) */
  const CARD_T = await C.p.evaluate(() => (typeof nlCardName === 'function') ? nlCardName() : '');
  /* ⚠ 2026-10-22 (판 X155) — 단추 앞머리 이모지가 <b>선 그림</b>이 되어
     글에 안 들어옵니다. 이름은 앱에 그대로 묻되(nlCardName), 견줄 때는
     <b>앞머리 꾸밈을 벗겨</b> 봅니다 — 약속은 「그 단추가 거기 있나」 입니다 (8번). */
  const bare = (t) => String(t || '').replace(/^[^0-9A-Za-z가-힣]+/, '').trim();
  is(g.단추.some(x => /캡션/.test(x)) && g.단추.some(x => bare(x).indexOf(bare(CARD_T)) >= 0) &&
     g.단추.some(x => /보낼 문구/.test(x)),
     '  <b>만들 자리</b>가 그 자리에 있다 — ' + g.단추.join(' · '));
  /* 만드는 도구를 <b>또 만들지 않았는가</b> (5번) — 이미 있는 것을 부른다 */
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const igBlk = (src.split('function hmIgHtml(')[1] || '').slice(0, 2600);
  is(/nlToCard\(|nlCardBtn\(\s*'nlToCard'/.test(igBlk) && /nlCopy\(/.test(igBlk),
     '  캐러셀·보낼 문구는 <b>이미 있는 것</b>을 부른다 — 두 벌로 안 만든다 (5번)');

  console.log('\n[5] <b>기사를 지어내지 않는다</b> (9번)');
  await C.p.evaluate(() => go('news_live')); await C.p.waitForTimeout(700);
  const z = await C.p.evaluate(() => ({
    속: (document.getElementById('hmIgHost') || {}).innerText || '',
    /* ★ <b>소식 자리만</b> 따로 재다. 같은 칸 안에 📣 SNS 관리가 같이 서서,
       통째로 길이를 재면 <b>소식을 안 지어냈는데도</b> 빨간불이 된다 —
       헛것을 잡는 점검은 안 잡는 점검보다 나쁘다 (8번). */
    소식: ((document.querySelector('#hmIgHost .hm-ig-no') ||
            document.querySelector('#hmIgHost .hm-ig-t') || {}).innerText || ''),
    /* 접이 머리가 없어졌으니 <b>칸 머리</b>를 봅니다 — 같은 말이 적혀야 합니다 */
    머리: ((document.querySelector('#hmIgHost .hm-ig-h') || document.getElementById('hmIgHost') || {}).innerText || '')
            .replace(/\s+/g, ' ').slice(0, 80)
  }));
  /* ⚠ 「안 받았습니다」(아직 안 가져옴)와 「못 받았습니다」(가져오려다 실패)는
     다른 말이다. 앱은 앞엣것을 쓴다 — 여기서 뒤엣것만 찾다가 헛빨간불이
     났다. 둘 다 받아 주되, <b>없다는 말과 안 지어낸다는 말</b>은 반드시
     있어야 한다 (1·9번). */
  is(/(안|못) 받았습니다/.test(z.속) && /지어내지 않습니다/.test(z.속),
     '  소식이 없으면 <b>없다고</b> 적고, <b>안 지어낸다</b>고 밝힌다');
  is(!NEWS.some(x => z.속.indexOf(x.t) >= 0) && z.소식.length < 300,
     '  <b>없는 제목을 만들지 않는다</b> — 소식 자리 ' + z.소식.length + '자');
  is(/받아 오기/.test(z.속), '  <b>어디서 받아 오는지</b> 길을 준다 (1번)');
  is(/안 받았습니다/.test(z.머리), '  머리도 <b>그대로</b> 말한다 — 「' + z.머리.replace(/\n/g,' ').slice(0, 40) + '」');

  console.log('\n[6] <b>오늘 고른 기사는 다시 열어도 같다</b> (「콘텐츠」에서)');
  const head1 = () => A.p.evaluate(() => {
    const e = document.getElementById('hmIgHost');
    return e ? ((e.innerText || '').split('\n')[0] || '') : '';
  });
  await A.p.evaluate(() => { go('news_live'); }); await A.p.waitForTimeout(700);
  const first = await head1();
  await A.p.evaluate(() => { go('clients'); }); await A.p.waitForTimeout(700);
  await A.p.evaluate(() => { go('news_live'); }); await A.p.waitForTimeout(900);
  const again = await head1();
  is(!!first && first === again, '  다시 열어도 <b>같은 기사</b> — 「' + (again || '').slice(0, 30) + '」');
  /* 그런데 <b>일부러 바꾸면</b> 바뀌어야 한다 — 못 바꾸면 그것도 고장이다 */
  await A.p.evaluate(() => hmIgNext()); await A.p.waitForTimeout(600);
  const next = await head1();
  is(!!next && next !== again, '  「다른 기사로」 를 누르면 <b>바뀐다</b> — ' + (next || '').slice(0, 26));

  console.log('\n[7] <b>따라만 하면 된다</b> — 소식 한 줄 · 다음 분');
  /* 사장님 말씀 — 「TA-AP-PC-CS 상황에 맞게 계속 띄우고 <b>따라만 하면
     그대로 관리</b>할수 있도록」, 「상황에 맞게 뉴스 읽어주면서 전달」.
     여태 뉴스는 거절·기고객·증권전달의 도구 목록에만 있어 TA·AP·PC·CS 에는
     <b>연락할 구실</b>이 없었고, 오늘 못 닿는 분이 맨 위에 그대로 서 있으면
     그 다음 분으로 갈 길이 없었다.                                     */
  /* [6] 이 「콘텐츠」에서 끝났으니 <b>홈으로 돌아와서</b> 봅니다 */
  await A.p.evaluate(() => { go('home'); }); await A.p.waitForTimeout(900);
  /* 홈으로 돌아온 <b>바로 그때</b>의 카드는 소식이 실리기 전 것일 수
     있습니다(hmArm 이 1.2초 뒤 다시 그립니다). 여기서 깨워 두고 봅니다. */
  await A.p.evaluate(() => { try { hmPaint(); } catch (e) {} });
  await A.p.waitForTimeout(400);
  const nw = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-nw');
    /* ⚠ <b>어느 기사인지 못 박지 않습니다.</b> 「다른 기사로」 를 누르면
       고른 기사가 바뀌는 것이 맞고(위 [6] 이 그것을 잽니다), 여기서
       NEWS[0] 을 기다리면 그 정상 동작 때문에 빨간불이 켜집니다 (8번).
       묻는 것은 <b>「지금 고른 그 기사를 그대로 쓰나」</b> 입니다 (5번). */
    const i = (typeof hmIgIdx === 'function') ? hmIgIdx() : -1;
    const want = (i >= 0 && NLIVE.items[i]) ? (NLIVE.items[i].t || '') : '';
    return { 있나: !!e, 글: e ? e.innerText.replace(/\s+/g, ' ') : '', 고른것: want,
      복사: !!document.querySelector('.hm-nw [onclick^="nlCopy"]') };
  });
  is(nw.있나 && !!nw.고른것 && nw.글.indexOf(nw.고른것) >= 0,
     '  한 분 카드에 <b>오늘 고른 그 기사</b>가 단계와 상관없이 선다 — 「' +
     nw.고른것.slice(0, 28) + '」');
  is(nw.복사, '  <b>보낼 문구</b>는 뉴스 화면과 같은 것을 부른다 (5번)');
  /* 소식을 못 받았으면 <b>빈 줄을 안 세운다</b> — 「없음」 은 자리만 먹는다 */
  is(await C.p.evaluate(() => !document.querySelector('.hm-nw')),
     '  받아 둔 소식이 없으면 <b>그 줄을 아예 안 세운다</b>');

  const w0 = await A.p.evaluate(() => ((document.querySelector('.hm-now-m .m b') || {}).innerText || '').trim());
  const nx = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-nx-b'); return e ? e.innerText.replace(/\s+/g, ' ') : '';
  });
  is(/다음 분/.test(nx), '  <b>다음 분</b> 단추가 있다 — 「' + nx + '」');
  await A.p.evaluate(() => { const e = document.querySelector('.hm-nx-b'); if (e) e.click(); });
  await A.p.waitForTimeout(800);
  const w1 = await A.p.evaluate(() => ((document.querySelector('.hm-now-m .m b') || {}).innerText || '').trim());
  is(!!w0 && !!w1 && w0 !== w1, '  누르면 <b>다음 분으로 넘어간다</b> — ' + w0 + ' → ' + w1);
  /* ★ 미룬 것을 <b>했다고 적지 않는다</b> (1번) — 기록이 아니라 차례만 바꾼다 */
  is(await A.p.evaluate(() => (window.__W || []).length === 0 && !/했/.test(window.__T || '')),
     '  미루는 것은 <b>기록이 아니다</b> — 안 한 일을 했다고 적지 않는다 (1번)');
  const back = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-nx-u'); return e ? e.innerText.replace(/\s+/g, ' ') : '';
  });
  is(/다시 보기/.test(back), '  <b>되돌릴 길</b>이 있다 — 「' + back + '」');
  await A.p.evaluate(() => { const e = document.querySelector('.hm-nx-u'); if (e) e.click(); });
  await A.p.waitForTimeout(800);
  is((await A.p.evaluate(() => ((document.querySelector('.hm-now-m .m b') || {}).innerText || '').trim())) === w0,
     '  누르면 <b>미뤄 둔 분이 도로</b> 올라온다 — ' + w0);

  is(A.errs.length === 0 && B.errs.length === 0 && C.errs.length === 0,
     '  화면이 터지지 않았다' + (A.errs[0] || B.errs[0] || C.errs[0] || ''));

  await A.ctx.close(); await B.ctx.close(); await C.ctx.close();
  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ 홈 한 장 — 고칠 자리 ' + bad + '곳'
    : '✓ 홈은 늘 같은 모양이고, 짧고, 오늘 올릴 것은 받아 둔 진짜 기사입니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
