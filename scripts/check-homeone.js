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
     [2] <b>짧아졌는가</b> — 폰에서 2.8화면을 넘지 않는다
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
  is(ba.length > 0 && ba.join('|') === bb.join('|'),
     '  <b>출발 점검이 있을 때와 없을 때가 같은 화면</b>이다');
  if (ba.join('|') !== bb.join('|')) {
    console.log('     있을 때 · ' + ba.join(' → '));
    console.log('     없을 때 · ' + bb.join(' → '));
  } else console.log('     ' + ba.join(' → '));
  const C = await open({ setup: false, news: false });
  is((await bones(C.p)).join('|') === ba.join('|'),
     '  소식을 못 받았을 때도 <b>뼈대가 같다</b> — 칸은 서고 안에서만 말이 달라진다');

  console.log('\n[2] <b>짧아졌다</b> — 폰에서 3.0화면 이하');
  /* ── 기준선 · 왜 3.0 인가 ─────────────────────────────────────────
     2026-09-21 · 고치기 전 <b>4.2화면</b>(3,541px). 접고 나서 2.7화면.
     그 뒤에 사장님 말씀대로 카드 안에 <b>오늘 보낼 소식 한 줄</b>(90px)과
     <b>다음 분</b> 줄(70px)을 더해 2.85화면이 됐다. 얻은 것이 분명하고
     둘 다 매일 쓰는 줄이라 그만큼은 치른다.
     이 자는 <b>생각 없이 늘어나는 것</b>을 막으려는 것이다 — 3.0 을 넘기면
     무엇을 얻고 치렀는지 여기에 적고 올려야 한다 (check-toss 와 같은 규칙). */
  const hA = await tall(A.p);
  is(hA > 0 && hA <= 844 * 3.0,
     '  홈 높이 <b>' + hA + 'px</b> = 화면 ' + (hA / 844).toFixed(1) + '개 (3.0개 이하 · 고치기 전 4.2개)');

  console.log('\n[3] ⚙️ 관리 — 접혀 있고, 머리가 말해 주고, 펴면 다 있다');
  const m1 = await A.p.evaluate(() => {
    const box = document.getElementById('hmFold_ig');
    const mng = document.getElementById('hmFold_mng');
    return { ig: !!box, mng: !!mng,
      접힘: !!(document.getElementById('hmFoldB_mng') || {}).hidden,
      머리: ((mng || {}).innerText || '').replace(/\s+/g, ' ').trim(),
      높이: mng ? Math.round(mng.getBoundingClientRect().height) : 0 };
  });
  is(m1.mng && m1.접힘, '  접힌 채로 뜬다 — ' + m1.높이 + 'px');
  is(/안 된 것|서버 준비|팀/.test(m1.머리),
     '  머리가 <b>무엇이 남았는지</b> 말한다 — 「' + m1.머리.slice(0, 44) + '」');
  await A.p.evaluate(() => hmFoldToggle('mng')); await A.p.waitForTimeout(500);
  const m2 = await A.p.evaluate(() => {
    const b2 = document.getElementById('hmFoldB_mng');
    return { 펴짐: !b2.hidden, 안에: [...b2.children].map(e => e.id),
      높이: Math.round(b2.getBoundingClientRect().height) };
  });
  is(m2.펴짐 && m2.안에.indexOf('hmReadyHost') >= 0 &&
     m2.안에.indexOf('hmTeamHost') >= 0 && m2.높이 > 300,
     '  펴면 <b>둘이 다 있다</b> — 지운 것이 아니다 · ' + m2.높이 + 'px');
  /* ★ 준비 SQL 은 <b>이 안에 있으면 안 된다</b> — 여러 화면이 「홈 맨 위」
     라고 가리킨다. 한 번 여기 넣었다가 check-setup 이 잡았다 (1번). */
  is(m2.안에.indexOf('osSetupHome') < 0,
     '  <b>준비 SQL 은 여기 없다</b> — 홈 맨 위에 있어야 안내가 거짓이 안 된다');
  is(await A.p.evaluate(() => {
       const st = document.getElementById('osSetupHome'), t = document.getElementById('hmToday');
       return !!(st && t && (st.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));
     }), '  준비 SQL 자리가 <b>오늘 챙길 것보다 위</b>에 있다');

  console.log('\n[4] 📸 오늘 올릴 것 — <b>받아 둔 진짜 기사</b>만');
  await A.p.evaluate(() => hmFoldToggle('ig')); await A.p.waitForTimeout(500);
  const g = await A.p.evaluate(() => ({
    머리: ((document.querySelector('#hmFold_ig .t') || {}).innerText || '').replace(/\s+/g, ' '),
    속: (document.getElementById('hmIgHost') || {}).innerText || '',
    링크: (document.querySelector('#hmIgHost a') || {}).href || '',
    단추: [...document.querySelectorAll('#hmIgHost button')].map(x => x.innerText.trim())
  }));
  is(g.속.indexOf(NEWS[0].t) >= 0, '  <b>제목을 그대로</b> 옮긴다');
  is(g.속.indexOf(NEWS[0].s) >= 0 && g.속.indexOf(NEWS[0].d) >= 0,
     '  <b>언론사·날짜</b>도 그대로 — ' + NEWS[0].s + ' · ' + NEWS[0].d);
  is(g.링크 === NEWS[0].u, '  <b>원문 링크</b>가 그 기사로 간다');
  is(g.머리.indexOf(NEWS[0].t.slice(0, 10)) >= 0, '  펴지 않아도 <b>머리에 제목</b>이 있다');
  is(g.단추.some(x => /캡션/.test(x)) && g.단추.some(x => /카드뉴스/.test(x)) &&
     g.단추.some(x => /보낼 문구/.test(x)),
     '  <b>만들 자리</b>가 그 자리에 있다 — ' + g.단추.join(' · '));
  /* 만드는 도구를 <b>또 만들지 않았는가</b> (5번) — 이미 있는 것을 부른다 */
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const igBlk = (src.split('function hmIgHtml(')[1] || '').slice(0, 2600);
  is(/nlToCard\(/.test(igBlk) && /nlCopy\(/.test(igBlk),
     '  카드뉴스·보낼 문구는 <b>이미 있는 것</b>을 부른다 — 두 벌로 안 만든다 (5번)');

  console.log('\n[5] <b>기사를 지어내지 않는다</b> (9번)');
  await C.p.evaluate(() => hmFoldToggle('ig')); await C.p.waitForTimeout(500);
  const z = await C.p.evaluate(() => ({
    속: (document.getElementById('hmIgHost') || {}).innerText || '',
    머리: ((document.querySelector('#hmFold_ig .t') || {}).innerText || '').replace(/\s+/g, ' ')
  }));
  /* ⚠ 「안 받았습니다」(아직 안 가져옴)와 「못 받았습니다」(가져오려다 실패)는
     다른 말이다. 앱은 앞엣것을 쓴다 — 여기서 뒤엣것만 찾다가 헛빨간불이
     났다. 둘 다 받아 주되, <b>없다는 말과 안 지어낸다는 말</b>은 반드시
     있어야 한다 (1·9번). */
  is(/(안|못) 받았습니다/.test(z.속) && /지어내지 않습니다/.test(z.속),
     '  소식이 없으면 <b>없다고</b> 적고, <b>안 지어낸다</b>고 밝힌다');
  is(!NEWS.some(x => z.속.indexOf(x.t) >= 0) && z.속.length < 300,
     '  <b>없는 제목을 만들지 않는다</b>');
  is(/받아 오기/.test(z.속), '  <b>어디서 받아 오는지</b> 길을 준다 (1번)');
  is(/안 받았습니다/.test(z.머리), '  머리도 <b>그대로</b> 말한다 — 「' + z.머리.replace(/\n/g,' ').slice(0, 40) + '」');

  console.log('\n[6] <b>오늘 고른 기사는 다시 열어도 같다</b>');
  const first = await A.p.evaluate(() => (document.getElementById('hmIgHost') || {}).innerText.split('\n')[0]);
  await A.p.evaluate(() => { go('clients'); }); await A.p.waitForTimeout(700);
  await A.p.evaluate(() => { go('home'); }); await A.p.waitForTimeout(1600);
  await A.p.evaluate(() => { if ((document.getElementById('hmFoldB_ig') || {}).hidden) hmFoldToggle('ig'); });
  await A.p.waitForTimeout(500);
  const again = await A.p.evaluate(() => (document.getElementById('hmIgHost') || {}).innerText.split('\n')[0]);
  is(!!first && first === again, '  다시 열어도 <b>같은 기사</b> — 「' + (again || '').slice(0, 30) + '」');
  /* 그런데 <b>일부러 바꾸면</b> 바뀌어야 한다 — 못 바꾸면 그것도 고장이다 */
  await A.p.evaluate(() => hmIgNext()); await A.p.waitForTimeout(600);
  const next = await A.p.evaluate(() => (document.getElementById('hmIgHost') || {}).innerText.split('\n')[0]);
  is(!!next && next !== again, '  「다른 기사로」 를 누르면 <b>바뀐다</b> — ' + (next || '').slice(0, 26));

  console.log('\n[7] <b>따라만 하면 된다</b> — 소식 한 줄 · 다음 분');
  /* 사장님 말씀 — 「TA-AP-PC-CS 상황에 맞게 계속 띄우고 <b>따라만 하면
     그대로 관리</b>할수 있도록」, 「상황에 맞게 뉴스 읽어주면서 전달」.
     여태 뉴스는 거절·기고객·증권전달의 도구 목록에만 있어 TA·AP·PC·CS 에는
     <b>연락할 구실</b>이 없었고, 오늘 못 닿는 분이 맨 위에 그대로 서 있으면
     그 다음 분으로 갈 길이 없었다.                                     */
  const nw = await A.p.evaluate(() => {
    const e = document.querySelector('.hm-nw');
    return { 있나: !!e, 글: e ? e.innerText.replace(/\s+/g, ' ') : '',
      복사: !!document.querySelector('.hm-nw [onclick^="nlCopy"]') };
  });
  is(nw.있나 && nw.글.indexOf(NEWS[0].t) >= 0,
     '  한 분 카드에 <b>오늘 보낼 소식</b>이 단계와 상관없이 선다');
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
