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
  const A = await open({ setup: false, news: true });
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
     무엇을 얻고 치렀는지 여기에 적고 올려야 한다 (check-toss 와 같은 규칙).

     ── 2026-09-21 · <b>3.0 그대로</b> ───────────────────────────────
     사장님 말씀대로 <b>🌅 아침 미션 다섯</b>이 홈에 들어왔지만, 홈의 다른
     큰 칸들과 똑같이 <b>접힌 채로</b> 섭니다. 그래서 여기서 재는 값은 안
     변하고 자도 그대로 3.0 입니다.
     한 번 펴 봤다가 <b>check-toss</b> 가 잡았습니다 — 「처음에는 다 접힌
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
  const hA = await tall(A.p);
  is(hA > 0 && hA <= 844 * 3.3,
     '  홈 높이 <b>' + hA + 'px</b> = 화면 ' + (hA / 844).toFixed(2) + '개 (3.3개 이하 · 고치기 전 4.2개)');

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
    const e = document.querySelector('.hm-act .g button');
    return { txt: e ? (e.innerText || '').replace(/\s+/g, ' ').trim() : '', has: !!e };
  });
  is(igChip.has && /올릴 것/.test(igChip.txt),
     '  홈에는 <b>한 줄만</b> 남는다 — 「' + igChip.txt + '」');
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
  is(g.단추.some(x => /캡션/.test(x)) && g.단추.some(x => /카드뉴스/.test(x)) &&
     g.단추.some(x => /보낼 문구/.test(x)),
     '  <b>만들 자리</b>가 그 자리에 있다 — ' + g.단추.join(' · '));
  /* 만드는 도구를 <b>또 만들지 않았는가</b> (5번) — 이미 있는 것을 부른다 */
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const igBlk = (src.split('function hmIgHtml(')[1] || '').slice(0, 2600);
  is(/nlToCard\(/.test(igBlk) && /nlCopy\(/.test(igBlk),
     '  카드뉴스·보낼 문구는 <b>이미 있는 것</b>을 부른다 — 두 벌로 안 만든다 (5번)');

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
