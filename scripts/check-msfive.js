/* ══════════════════════════════════════════════════════════════════
   check-msfive.js — <b>아침 미션 다섯을 홈에서 다 하는가.</b>

   사장님 말씀 (2026-09-21) —
     「매일 미션이 있는데 <b>홈에서 이것들을 다 하게끔</b> 만들고 싶어.
      ① 오늘의 알림 확인 ② 5명 어떻게 연락하면 좋을지, <b>뉴스 + 연락
      멘트</b>까지 정리 ③ 전화 5통 TA — 스크립트 <b>밝은 모습으로</b>
      연락드릴수 있도록 <b>정형화</b>, <b>나이대에 맞게</b> ④ 카톡 5건 —
      뉴스 및 안부 전달 ⑤ 오늘 올릴 <b>SNS 캐러셀</b> 만들기.
      … 이걸 완료한다면 <b>TA가 모두 끝났으니 → AP/PC/CS 고객 체크</b>」

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 홈에 미션 칸이 서고 <b>다섯 칸(①~⑤)</b>이 차례대로 선다
     [2] <b>체크는 한 통에만</b> 담긴다 (5번) — 미션에서 누르면 실행
         체크판(CK_ITEMS.day)의 그 줄이 켜지고, 다시 누르면 꺼진다.
         따로 통을 파면 「여기서는 했는데 저기서는 안 했다」 가 된다
     [3] <b>다섯 분을 여기서 또 고르지 않는다</b> (5번) — arTouch 가
         세운 차례에서 위에서부터 뽑는다. 여기서 다시 고르면 「오늘
         챙길 것」 과 다른 사람이 나온다
     [4] ②④ 에 <b>진짜 기사</b>가 실린다 — 제목과 링크가 받아 둔 그대로
     [5] <b>나이를 지어내지 않는다</b> (1번) — 배정 DB 에는 출생년도 칸이
         없다. 그 분은 나이대가 안 골라지고 「나이를 몰라 기본 화법」 이라고
         적힌다. 고객 365일에 적힌 분은 그 값으로 골라지고, 손으로 고르면
         「고르신 것」 이라고 밝힌다
     [6] 할 말에 <b>숫자·실명이 없다</b> (2·3번) — 보험료·한도·나이 숫자도,
         고객 이름도 안 들어간다. 「고객님」 으로 나간다
     [7] <b>소식을 못 받았으면 지어내지 않는다</b> (1·9번) — 제목을 만들지
         않고 못 받았다고 적고 받아 오는 자리로 모신다
     [8] 다 하면 <b>고객 체크로 넘긴다</b> — 「TA가 모두 끝났으니」 와
         AP·PC·CS, 그리고 오늘 챙길 것으로 가는 길
     [9] <b>칸이 한 화면을 안 넘는다</b> · 펴 놓아도 홈이 3.8화면 이하.
         ── 기준선 · 왜 3.8 인가 ────────────────────────────────────
         2026-09-21 · 미션을 넣기 전 홈은 <b>2.81화면</b>(2,371px)이었다.
         미션 칸이 제일 길 때가 ③ 전화(767px)라 3.7화면이 된다.
         <b>얻은 것</b> — 아침에 홈만 보고 알림·다섯 분·전화·카톡·SNS 를
         다 한다. DB 통합 CRM 으로 건너가지 않는다.
         <b>치른 것</b> — 0.9화면. 그래서 <b>접을 수 있게</b> 했고(머리에
         「2/5 · ③ 전화 다섯 통」 이 적혀 접어 두셔도 어디까지 왔는지
         보인다), 다섯 마디 틀은 기본으로 접었다.
         <b>아직 남은 것</b> — 「오늘 챙길 것」 의 한 분 카드(1,232px)가
         TA 자리에서는 미션 ②③ 와 겹친다. 둘을 넘기는 일은 이 판에서
         안 했다 — 여러 점검이 그 카드를 보고 있어 따로 손대야 한다.
    [10] <b>말은 apex-stage 한 곳에서</b> 온다 (5번) — 본체에 첫 마디를
         또 적지 않았다. 적으면 DB 통합 CRM 과 다른 말을 하게 된다
    [11] 뽑힌 분이 없으면 <b>사람을 지어내지 않는다</b> (1번)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8935;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
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

/* <b>진짜 기사</b> 두 건. 고객 이름이 아니라 기사 제목이라 그대로 쓴다 */
const NEWS = [
  { t: '실손보험 청구 전산화 2단계 시행 — 의원급 확대', s: '연합뉴스', d: '2026-09-21', u: 'https://example.com/a', cats: ['ins'] },
  { t: '기준금리 동결 … 가계대출 관리 강화', s: '한국경제', d: '2026-09-20', u: 'https://example.com/b', cats: ['econ'] }
];
/* 점검 데이터의 이름은 <b>홍길동</b> 이다 (CLAUDE.md 3번) */
const SEED = (o) => `
 window.__T='';
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1'};GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=${o.none ? '[]' : `[
   {id:'d1',who:'me',name:'홍길동A',region:'순천',src:'보장분석',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
   {id:'d2',who:'me',name:'홍길동B',region:'순천',src:'소개',stage:'미접촉',days:5,n:0,res:'미진행',cAt:'',pAt:''},
   {id:'d5',who:'me',name:'홍길동E',region:'광양',src:'개척',stage:'거절',days:20,n:2,res:'거절',cAt:'',pAt:''},
   {id:'d3',who:'me',name:'홍길동C',region:'순천',src:'일반',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''},
   {id:'d4',who:'me',name:'홍길동D',region:'순천',src:'일반',stage:'PC',days:6,n:3,res:'상담',cAt:'',pAt:''}]`};
 /* 고객 365일에서 온 분 — <b>여기에만</b> 출생년도가 있다 */
 AR.cliRows=${o.none ? '[]' : `[{id:'c1',who:'me',name:'홍길동F',plan:'',due:'',bd:'',man:null,
                                 ever:true,at:'2026-08-01',days:51,by:1985}]`};
 AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 try{ ${o.news === false
    ? `localStorage.removeItem('apex_newslive');`
    : `localStorage.setItem('apex_newslive',JSON.stringify({at:'2026-09-21',got:2,drop:0,items:${JSON.stringify(NEWS)}}));`}
      localStorage.removeItem('apex_hm_ig_v1');
      localStorage.removeItem('apex_hm_fold_v1');
      localStorage.removeItem('apex_ck_day'); }catch(e){}
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

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2400);
    return { ctx, p, errs };
  };
  const jump = async (p, i) => { await p.evaluate(j => hmMsJump(j), i); await p.waitForTimeout(260); };
  const txt = (p) => p.evaluate(() => { const e = document.getElementById('hmMsHost'); return e ? e.innerText : ''; });

  const A = await open({});
  is(A.errs.length === 0, '  홈을 여는 동안 콘솔 오류가 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));

  console.log('\n[1] 홈에 <b>🌅 아침 미션</b> 칸이 서고 다섯 칸이 차례대로');
  const s1 = await A.p.evaluate(() => {
    const box = document.getElementById('hmFold_ms');
    const host = document.getElementById('hmMsHost');
    const sts = [...document.querySelectorAll('.hm-ms-st')].map(e => e.textContent.trim());
    const head = box ? box.querySelector('.hm-fold-h') : null;
    const today = document.getElementById('hmToday');
    return {
      has: !!box, open: box ? box.classList.contains('on') : false,
      sts, head: head ? head.innerText.replace(/\s+/g, ' ') : '',
      /* <b>오늘 챙길 것 바로 위</b>인가 — 아침에 이것부터 하고 내려간다 */
      above: (box && today) ? (box.getBoundingClientRect().top < today.getBoundingClientRect().top) : false,
      hostH: host ? Math.round(host.getBoundingClientRect().height) : 0
    };
  });
  is(s1.has && s1.open, '  미션 칸이 서고 <b>처음에는 펴져</b> 있다');
  is(s1.sts.length === 5, '  다섯 칸이다 — ' + s1.sts.join(' '));
  is(s1.above, '  자리가 <b>「오늘 챙길 것」 바로 위</b>다');
  is(/0\/5/.test(s1.head) && /①/.test(s1.head), '  머리가 <b>어디까지 왔는지</b> 말한다 — ' + s1.head);

  console.log('\n[2] <b>체크는 실행 체크판 한 통에만</b> 담긴다 (5번)');
  const ckBefore = await A.p.evaluate(() => ckLoad('day'));
  await A.p.evaluate(() => hmMsDid('d2')); await A.p.waitForTimeout(300);
  const ckAfter = await A.p.evaluate(() => ckLoad('day'));
  is(!ckBefore.d2 && !!ckAfter.d2, '  미션 ① 을 누르면 체크판의 <b>d2</b> 가 켜진다');
  const s2 = await A.p.evaluate(() => {
    const box = document.getElementById('hmFold_ms');
    return { head: box ? box.querySelector('.hm-fold-h').innerText.replace(/\s+/g, ' ') : '',
             ok: document.querySelectorAll('.hm-ms-st.ok').length };
  });
  is(s2.ok === 1 && /1\/5/.test(s2.head), '  칸에 ✓ 가 켜지고 머리가 <b>1/5</b> 로 바뀐다');
  await A.p.evaluate(() => hmMsJump(0)); await A.p.waitForTimeout(300);  /* ✓ 칸을 누르면 되돌린다 */
  is(!(await A.p.evaluate(() => ckLoad('day'))).d2, '  ✓ 칸을 다시 누르면 <b>되돌아간다</b>');
  /* 다섯 미션이 <b>다섯 줄</b>에 하나씩 이어져 있다 — 새 통이 아니다 */
  const link = await A.p.evaluate(() => {
    const ids = HM_MS.map(m => m.ck);
    const day = CK_ITEMS.day.map(r => r[0]);
    return { ids, all: ids.every(i => day.indexOf(i) >= 0), uniq: new Set(ids).size };
  });
  is(link.all && link.uniq === 5, '  다섯 미션이 체크판의 <b>실제 줄</b>을 가리킨다 — ' + link.ids.join(' · '));

  console.log('\n[3] <b>다섯 분을 여기서 또 고르지 않는다</b> (5번)');
  const s3 = await A.p.evaluate(() => {
    const mine = hmMsPeople().map(x => x.nm);
    const all = arTouch(hwhoFor()).filter(x => !!HM_MS_POOL[x.k]).slice(0, 5).map(x => x.nm);
    return { mine, all, n: hmMsPeople().length };
  });
  is(s3.mine.join('|') === s3.all.join('|') && s3.n > 0,
     '  arTouch 가 세운 차례 그대로다 — ' + s3.mine.join(' · '));
  /* 계약 뒤(AP·PC) 는 아침 미션이 아니다 — 그건 「고객 체크」 몫이다 */
  is(s3.mine.indexOf('홍길동C') < 0 && s3.mine.indexOf('홍길동D') < 0,
     '  AP·PC 는 <b>안 뽑는다</b> — 다 하고 나서 볼 분들이다');

  console.log('\n[4] ②④ 에 <b>받아 둔 진짜 기사</b>가 실린다');
  await jump(A.p, 1);
  const t2 = await txt(A.p);
  is(t2.indexOf(NEWS[0].t) >= 0, '  ② 에 오늘 보낼 소식 제목이 그대로 — ' + NEWS[0].t.slice(0, 22) + '…');
  is(t2.indexOf(NEWS[0].s) >= 0, '  <b>언론사</b>까지 적는다 (9번)');
  await jump(A.p, 3);
  const t4 = await txt(A.p);
  is(t4.indexOf(NEWS[0].t) >= 0 && t4.indexOf(NEWS[0].u) >= 0,
     '  ④ 카톡 글에 <b>제목과 링크</b>가 그대로 들어간다');
  is(/전화 드려도 될까요/.test(t4),
     '  카톡이 <b>다음 전화</b>로 이어진다 — 사장님 말씀 「추후 TA 전화로 넘어가기 위함」');

  console.log('\n[5] <b>나이를 지어내지 않는다</b> (1번)');
  await jump(A.p, 2);
  const g5 = await A.p.evaluate(() => {
    const out = [];
    for (let k = 0; k < hmMsPeople().length; k++) {
      const x = hmMsWho();
      out.push({ nm: x.nm, by: x.by == null ? null : x.by, age: hmMsAge(x) });
      hmMsNextWho();
    }
    return out;
  });
  const dbOnes = g5.filter(r => r.by == null), cliOnes = g5.filter(r => r.by != null);
  is(dbOnes.length > 0 && dbOnes.every(r => r.age === ''),
     '  배정 DB 에서 온 분은 나이대를 <b>안 고른다</b> — ' + dbOnes.map(r => r.nm).join(' · '));
  is(cliOnes.length > 0 && cliOnes.every(r => r.age === '4050'),
     '  고객 365일에 <b>출생년도가 적힌 분</b>만 골라진다 — ' + cliOnes.map(r => r.nm + '(' + r.by + ')').join(' · '));
  await A.p.evaluate(() => { HM_MSP.i = 0; hmMsPaint(); }); await A.p.waitForTimeout(250);
  const t5 = await txt(A.p);
  is(/나이를 몰라 기본 화법/.test(t5), '  모르면 <b>모른다고 적는다</b> — 화면에 그대로');
  /* 손으로 고르면 <b>고르신 것</b>이라고 밝힌다 */
  await A.p.evaluate(() => { const x = hmMsWho(); hmMsAgeSet(x.id || x.nm, '60'); });
  await A.p.waitForTimeout(260);
  const t5b = await txt(A.p);
  is(/고르신/.test(t5b), '  손으로 고르면 <b>「고르신」</b> 이라고 밝힌다 — 앱이 정한 것이 아니다');
  is(/종이로 정리해서/.test(t5b), '  고른 나이대의 한마디가 <b>말 끝에</b> 붙는다');
  /* 코칭(이렇게 · 이 말은 안 합니다)은 <b>틀 안</b>에 있다 — 자리를 아끼려고
     접어 두었을 뿐 없앤 것이 아니다. 안 재면 다음에 조용히 사라진다 (8번). */
  await A.p.evaluate(() => { if (!hmMsFrOpen()) hmMsFrToggle(); }); await A.p.waitForTimeout(260);
  const t5c = await txt(A.p);
  is(/천천히, 또박또박/.test(t5c) && /이 말은 안 합니다/.test(t5c),
     '  틀을 펴면 <b>나이대 주의</b>가 같이 나온다 — 접은 것이지 없앤 것이 아니다');
  await A.p.evaluate(() => { if (hmMsFrOpen()) hmMsFrToggle(); }); await A.p.waitForTimeout(220);
  await A.p.evaluate(() => { const x = hmMsWho(); hmMsAgeSet(x.id || x.nm, '60'); }); await A.p.waitForTimeout(220);

  console.log('\n[6] 할 말에 <b>숫자·실명이 없다</b> (2·3번)');
  const say = await A.p.evaluate(() => {
    const out = [];
    for (let k = 0; k < hmMsPeople().length; k++) {
      const x = hmMsWho(), S = hmMsSay(x);
      if (S) out.push(S.say);
      out.push(hmMsKt(x));
      hmMsNextWho();
    }
    /* 나이대 세 가지도 모두 — 붙는 한마디에 숫자가 섞이면 안 된다 */
    APEX_STAGE.taAge.forEach(a => out.push(a.add));
    APEX_STAGE.taFrame.forEach(f => out.push(f.s));
    return out;
  });
  /* 링크(https://example.com/a)와 기사 제목은 <b>원문 그대로</b>라 건너뛴다 (9번) */
  const nums = say.map(t => (t || '').split('\n')
    .filter(l => !/^https?:\/\//.test(l.trim()) && !/^\[/.test(l.trim()))
    .join('\n')).filter(t => /[0-9]/.test(t));
  is(nums.length === 0, '  말 안에 <b>숫자가 없다</b>' + (nums.length ? ' — ' + nums[0].slice(0, 70) : ''));
  const named = say.filter(t => /홍길동/.test(t || ''));
  is(named.length === 0, '  <b>고객 이름이 안 들어간다</b> — 「고객님」 으로 나간다');

  console.log('\n[7] <b>소식을 못 받았으면 지어내지 않는다</b> (1·9번)');
  const N = await open({ news: false });
  await jump(N.p, 1);
  const n2 = await txt(N.p);
  is(/지어내지 않습니다/.test(n2), '  ② 가 <b>지어내지 않는다</b>고 적는다');
  is(/뉴스 받아 오기/.test(n2), '  <b>받아 오는 자리</b>로 모신다');
  await jump(N.p, 4);
  const n5 = await txt(N.p);
  is(/지어내지 않습니다/.test(n5) && !/캐러셀 만들기/.test(n5),
     '  ⑤ 도 제목을 만들지 않고 <b>못 받았다</b>고 적는다');
  await jump(N.p, 3);
  const n4 = await txt(N.p);
  is(!/\[/.test(n4) || !/https?:/.test(n4), '  ④ 카톡 글에 <b>없는 기사</b>를 넣지 않는다');
  is(/전화 드려도 될까요/.test(n4), '  그래도 <b>안부 글은 선다</b> — 칸을 안 비운다');

  console.log('\n[8] 다 하면 <b>고객 체크</b>로 넘긴다 — 「TA가 모두 끝났으니」');
  await A.p.evaluate(() => { HM_MS.forEach(m => { if (!ckLoad('day')[m.ck]) ckToggle('day', m.ck); }); HM_MSP.j = null; hmMsPaint(); });
  await A.p.waitForTimeout(350);
  const fin = await A.p.evaluate(() => {
    const e = document.getElementById('hmMsHost'), box = document.getElementById('hmFold_ms');
    const n = e.querySelector('.hm-ms-fin-n');
    return { x: e.innerText, h: Math.round(e.getBoundingClientRect().height),
             head: box.querySelector('.hm-fold-h').innerText.replace(/\s+/g, ' '),
             cnt: n ? n.innerText.replace(/\s+/g, ' ').trim() : '',
             go: !!e.querySelector('button[onclick*="hmMsGoCheck"]') };
  });
  is(/TA 가 끝났으니|TA가 끝났으니/.test(fin.x), '  <b>TA 가 끝났다</b>고 적는다');
  is(/AP/.test(fin.x) && /PC/.test(fin.x) && /CS/.test(fin.x), '  다음이 <b>AP · PC · CS</b> 임을 말한다');
  /* ⚠ <b>진짜로 세는지</b> 본다. 씨앗에 AP 한 분·PC 한 분을 두었으므로
     「AP 1명 · PC 1명」 이 나와야 하고, CS 는 없으니 <b>안 적혀야</b> 한다 —
     0 을 적으면 「다 했다」 로 읽힌다 (1번). 앞서 이 줄을 「AP 라는 글자가
     있으면 통과」 로 두었더니 세지 않아도 초록이었다 — 안 울리는 알람이다 (8번). */
  is(fin.cnt === 'AP 1명 · PC 1명',
     '  남은 분을 <b>세어서</b> 적는다 — 「' + fin.cnt + '」 (CS 0명은 안 적는다)');
  is(fin.go, '  <b>오늘 챙길 것</b>으로 가는 단추가 있다');
  is(/5\/5/.test(fin.head), '  접어 두셔도 머리가 <b>5/5</b> 라고 말한다 — ' + fin.head);

  console.log('\n[9] <b>칸이 한 화면을 안 넘는다</b> · 홈은 3.8화면 이하');
  const B = await open({});
  /* ⚠ <b>미션만 돌리면 제일 긴 경우를 못 잰다.</b> 처음에 그렇게 재서
     ③ 전화가 702px 로 나왔는데, 나이를 <b>아는</b> 분 차례가 되면 까닭
     두 줄이 더 붙어 900px 이 됐다 — 점검은 초록인데 화면은 넘쳤다.
     그래서 <b>미션 × 사람</b>을 다 돌려 제일 긴 짝을 찾는다 (8번). */
  let worst = 0, worstAt = '', worstHome = 0;
  const nP = await B.p.evaluate(() => hmMsPeople().length);
  for (let i = 0; i < 5; i++) {
    await jump(B.p, i);
    for (let j = 0; j < Math.max(1, nP); j++) {
      const m = await B.p.evaluate((k) => {
        HM_MSP.i = k; hmMsPaint();
        const e = document.getElementById('hmMsHost'), pane = document.querySelector('.tab-pane.on');
        const x = hmMsWho();
        return { h: Math.round(e.getBoundingClientRect().height),
                 nm: x ? x.nm : '', age: x ? hmMsAge(x) : '',
                 tot: Math.round(Math.max.apply(null, [...pane.children].map(y => y.getBoundingClientRect().bottom + scrollY))) };
      }, j);
      if (m.h > worst) { worst = m.h; worstHome = m.tot; worstAt = (i + 1) + '·' + m.nm + (m.age ? ('(' + m.age + ')') : '(나이 모름)'); }
    }
  }
  is(worst > 0 && worst <= 844, '  제일 긴 짝(' + worstAt + ') 이 <b>' + worst + 'px</b> — 한 화면(844) 이하');
  is(worstHome > 0 && worstHome <= 844 * 3.8,
     '  그때 홈이 <b>' + worstHome + 'px</b> = 화면 ' + (worstHome / 844).toFixed(2) + '개 (3.8 이하)');
  /* 다섯 마디 틀은 <b>기본으로 접혀</b> 있다 — 매일 같은 줄이 200px 을 먹지 않게 */
  const fr = await B.p.evaluate(() => { hmMsJump(2); return { open: hmMsFrOpen(), head: !!document.querySelector('.hm-ms-fr-h') }; });
  is(fr.head && !fr.open, '  다섯 마디 틀은 <b>접혀</b> 있고 머리는 보인다 — 정형화가 숨지는 않는다');

  console.log('\n[10] <b>말은 apex-stage 한 곳에서</b> 온다 (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const stage = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  const marks = ['신청해 주신 보장분석 때문에', '소개를 받고 연락드렸습니다', '전화 받아 주셔서 감사합니다'];
  const leaked = marks.filter(m => src.indexOf(m) >= 0);
  is(leaked.length === 0, '  본체에 첫 마디를 <b>또 안 적었다</b>' + (leaked.length ? ' — ' + leaked[0] : ''));
  is(marks.every(m => stage.indexOf(m) >= 0), '  그 말은 <b>apex-stage.js</b> 에 있다');
  is(/APEX_STAGE\.script\(/.test(src.slice(src.indexOf('function hmMsSay'), src.indexOf('function hmMsSay') + 400)),
     '  미션도 <b>APEX_STAGE.script</b> 를 부른다 — DB 통합 CRM 과 같은 말');

  console.log('\n[11] 뽑힌 분이 없으면 <b>사람을 지어내지 않는다</b> (1번)');
  const Z = await open({ none: true });
  const z = await txt(Z.p);
  is(/지어내지 않습니다/.test(z), '  <b>지어내지 않는다</b>고 적는다');
  is(!/홍길동[A-F]/.test(z), '  없는 이름을 <b>만들지 않는다</b>');
  is(/고객 넣기|DB 통합 CRM/.test(z), '  <b>무엇을 하면 되는지</b> 말한다');

  await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 아침 미션 다섯 — 홈에서 다 됩니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
