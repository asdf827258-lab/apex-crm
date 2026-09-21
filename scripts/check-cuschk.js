/* ══════════════════════════════════════════════════════════════════
   check-cuschk.js — <b>고객 체크</b> · 읽은 증권으로 무엇을 터치하나.

   사장님 말씀 (2026-09-21) —
     「TA가 모두 끝난다면 / AP · PC · CS 상황에 맞게 해야되는것들
      <b>「고객 체크」로 따로 관리</b>해줘. <b>고객님의 보험을 읽었다면
      무엇으로 터치할지</b> — 이게 가장 어려울 것 같아」

   어려웠던 까닭은 자료가 없어서가 아니었습니다. 「보장분석 전·후 만들기」는
   <b>이미 고객별로</b> saved_reports(kind='ba_state') 에 남기고 있었는데
   <b>아무도 다시 안 읽었습니다.</b> 여기서 그것이 실제로 읽히는지 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] AP·PC·CS <b>만</b> 선다 — TA·미접촉은 여기 안 온다(겹치지 않게)
     [2] 읽은 기록이 있으면 <b>담보 한 가지</b>를 꺼내 말이 선다
     [3] <b>읽은 기록이 없으면 말을 안 만든다</b> (1번) — 제일 중요한 줄
     [4] <b>못 이은 사람을 비슷한 이름에 붙이지 않는다</b> (1번) —
         다른 분 증권을 이 분 것이라고 말하면 그 자리에서 끝난다
     [5] <b>「못 찾음」 · 「없음」 · 금액</b> 셋을 가른다 (1번) —
         ba.html 의 diff 가 못 읽음과 0 을 뭉개므로 여기서 갈라 적는다
     [6] 말에 <b>숫자·실명이 없다</b> (2·3번)
     [7] <b>서버를 한 번만</b> 부른다 (7번) — 되풀이 타이머가 없고,
         큰 덩이(state)가 아니라 요약(sum)만 받는다
     [8] 말은 <b>apex-stage 한 곳</b>에서 온다 (5번)
     [9] 담보 이름은 <b>ba.html 이 저장할 때</b> 적는다 — 본체가 다시
         계산하지 않는다 (5번). NAME 을 두 곳에 두지 않는다
    [10] 홈 <b>아침 미션 5/5</b> 에서 이 칸으로 가는 길이 있다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8943;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
let hits = 0, cols = '';
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify({ key: null, has: false })); return;
  }
  if (p.indexOf('/api/market') === 0) { rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify({ ok: true, news: [] })); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 점검 자료의 이름은 <b>홍길동</b> (CLAUDE.md 3번). 가린 모양은 cusMask 와 같게 */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.copyText=function(t){window.__C=t;};
 GB.loaded=true;GB.teams=[];GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동가',region:'순천',src:'보장분석',stage:'AP',days:3,n:2,res:'상담',cAt:'',pAt:''},
        {id:'d2',who:'me',name:'홍길동나',region:'광양',src:'소개',stage:'PC',days:6,n:3,res:'상담',cAt:'',pAt:''},
        {id:'d3',who:'me',name:'홍길동다',region:'순천',src:'개척',stage:'CS',days:2,n:4,res:'상담',cAt:'',pAt:''},
        {id:'d4',who:'me',name:'홍길동라',region:'여수',src:'일반',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''},
        {id:'d5',who:'me',name:'홍길동마',region:'여수',src:'일반',stage:'미접촉',days:4,n:0,res:'미진행',cAt:'',pAt:''}];
 /* 가 — 실명이 이 기기에 있고 읽은 기록도 있다 / 나 — 카드는 있는데 못 읽음 /
    다 — 이름이 안 이어진다(옛 가린 모양) */
 AR.cliRows=[{id:'c1',who:'me',nm:'홍**가',name:'홍길동가',plan:'',due:'',bd:'',man:null,ever:true,at:'',days:3,by:null},
             {id:'c2',who:'me',nm:'홍**나',name:'홍길동나',plan:'',due:'',bd:'',man:null,ever:true,at:'',days:6,by:null},
             {id:'c9',who:'me',nm:'홍○○',  name:'',        plan:'',due:'',bd:'',man:null,ever:true,at:'',days:2,by:null}];
 AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 window.osClient=function(){var mk=function(t){var st={t:t,kind:'',cols:''};var a={
   update:function(){return a;},insert:function(){return a;},upsert:function(){return a;},
   'delete':function(){return a;},
   select:function(c){st.cols=c||'';return a;},order:function(){return a;},range:function(){return a;},
   limit:function(){return a;},single:function(){return a;},gte:function(){return a;},
   'in':function(){return a;},is:function(){return a;},neq:function(){return a;},not:function(){return a;},
   eq:function(k,v){if(k==='kind')st.kind=v;return a;},
   then:function(ok,no){
     if(st.t==='saved_reports'&&st.kind==='ba_state'){
       window.__HIT=(window.__HIT||0)+1; window.__COLS=st.cols;
       return Promise.resolve({data:${o.none ? '[]' : `[
         {client_id:'c1',created_at:'2026-09-18T09:00:00Z',
          sum:{name:'홍**가',loss:1,gain:3,cov:24,
               top:{gain:[{k:'cancer',n:'일반암 (최초 1회)',b:0,a:5000}],
                    loss:[{k:'silNB',n:'비급여의료비',b:3000,a:null}]}}}
       ]`},error:null}).then(ok,no);
     }
     return Promise.resolve({data:[],error:null}).then(ok,no);}};return a;};
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 HWHO.id='';CM.pick='';CM.picked=true;go('airep');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 150)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(1400);
    await p.evaluate(() => arGoCat('check')); await p.waitForTimeout(1600);
    return { ctx, p, errs };
  };
  const txt = (p) => p.evaluate(() => { const e = document.getElementById('chkPane'); return e ? e.innerText : ''; });

  const A = await open({});
  is(A.errs.length === 0, '  콘솔 오류가 없다' + (A.errs.length ? ' — ' + A.errs[0] : ''));

  console.log('\n[1] AP · PC · CS <b>만</b> 선다 — TA 와 겹치지 않는다');
  const s1 = await A.p.evaluate(() => chkPeople().map(x => x.stage));
  is(s1.length === 3 && s1.indexOf('TA') < 0 && s1.indexOf('미접촉') < 0,
     '  세 분만 섰다 — ' + s1.join(' · '));
  is(s1.join('|') === 'AP|PC|CS', '  차례가 <b>AP → PC → CS</b> 다');

  console.log('\n[2] 읽은 기록이 있으면 <b>담보 한 가지</b>를 꺼낸다');
  const t = await txt(A.p);
  is(/일반암/.test(t), '  담보 이름이 말 안에 들어간다 — 「일반암 (최초 1회)」');
  is(/2026-09-18 읽음/.test(t), '  <b>언제 읽었는지</b> 적는다');
  is(/채워지는 곳/.test(t), '  AP 는 <b>채워지는 곳</b>을 앞세운다');

  console.log('\n[3] <b>읽은 기록이 없으면 말을 안 만든다</b> (1번)');
  const s3 = await A.p.evaluate(() => {
    const P = chkPeople(), out = [];
    P.forEach(x => { const s = chkSay(x); out.push({ nm: x.nm, why: s.why, cov: !!(s && s.cov) }); });
    return out;
  });
  const pc = s3.filter(x => x.why === 'noread');
  is(pc.length > 0 && pc.every(x => !x.cov), '  못 읽은 분께는 <b>담보를 안 꺼낸다</b> — ' + pc.map(x => x.nm).join(' · '));
  is(/아직 증권을 안 읽었습니다/.test(t), '  <b>안 읽었다고 적는다</b>');
  is(/증권 읽으러 가기/.test(t), '  <b>읽으러 가는 길</b>을 준다');

  console.log('\n[4] 못 이은 사람을 <b>비슷한 이름에 붙이지 않는다</b> (1번)');
  const s4 = s3.filter(x => x.why === 'nocli');
  is(s4.length === 1 && s4[0].nm === '홍길동다',
     '  가린 모양이 다른 분은 <b>안 이어 붙인다</b> — ' + (s4[0] ? s4[0].nm : '(없음)'));
  is(/못 찾았습니다/.test(t) && /비슷한 이름을 골라 붙이지 않습니다/.test(t),
     '  <b>왜 못 찾았는지</b> 적는다');
  /* ⚠ 실명이 있으면 옛 가린 모양이어도 이어져야 한다 — 그 길이 살아 있나 */
  const s4b = await A.p.evaluate(() => {
    const by = chkCliBy();
    return { real: !!chkFind(by, '홍길동가'), none: !!chkFind(by, '홍길동없는사람') };
  });
  is(s4b.real && !s4b.none, '  <b>실명이 있으면</b> 이어지고, 없는 사람은 안 이어진다');

  console.log('\n[5] <b>못 찾음 · 없음 · 금액</b> 셋을 가른다 (1번)');
  const s5 = await A.p.evaluate(() => ({
    nul: chkWon(null), zero: chkWon(0), num: chkWon(5000)
  }));
  is(/못 찾음/.test(s5.nul), '  null 은 <b>못 찾음</b> — ' + s5.nul.replace(/<[^>]*>/g, ''));
  is(/없음/.test(s5.zero), '  0 은 <b>없음</b> — ' + s5.zero.replace(/<[^>]*>/g, ''));
  is(/5,000만원/.test(s5.num), '  숫자는 <b>그대로</b> — ' + s5.num);
  is(/없음 → 5,000만원/.test(t), '  화면에도 <b>갈라서</b> 찍힌다');

  console.log('\n[6] 말에 <b>숫자·실명이 없다</b> (2·3번)');
  const say = await A.p.evaluate(() => {
    const out = [];
    APEX_STAGE.chkList().forEach(c => { out.push(c.had.split('{cov}').join('담보')); out.push(c.none); out.push(c.ask); });
    return out;
  });
  const nums = say.filter(x => /[0-9]/.test(x));
  is(nums.length === 0, '  <b>숫자가 없다</b>' + (nums.length ? ' — ' + nums[0].slice(0, 60) : ''));
  is(say.every(x => !/홍길동/.test(x)), '  <b>고객 이름이 없다</b> — 「고객님」 으로 나간다');

  console.log('\n[7] <b>서버를 한 번만</b> 부른다 · 요약만 받는다 (7번)');
  const s7 = await A.p.evaluate(() => ({ hit: window.__HIT || 0, cols: window.__COLS || '' }));
  is(s7.hit === 1, '  <b>한 번</b> 불렀다 — ' + s7.hit + '번');
  is(/content->sum/.test(s7.cols) && !/,content\b/.test(s7.cols),
     '  <b>요약(sum)만</b> 받는다 — 큰 덩이(state)를 안 받는다 · ' + s7.cols);
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const loops = [];
  const re = /setInterval\(([\s\S]{0,400}?),\s*(\d+)\s*\)/g; let m;
  while ((m = re.exec(SRC))) if (/chkLoad|ba_state/.test(m[1])) loops.push(m[2]);
  is(loops.length === 0, '  <b>되풀이 타이머가 없다</b>');
  /* 다시 그려도 또 안 부른다 — 화면이 여러 번 서는 일은 흔하다 */
  await A.p.evaluate(() => { chkPaint(); chkPaint(); }); await A.p.waitForTimeout(500);
  is((await A.p.evaluate(() => window.__HIT)) === 1, '  <b>다시 그려도</b> 또 안 부른다');

  console.log('\n[8] 말은 <b>apex-stage 한 곳</b>에서 온다 (5번)');
  const stage = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  const marks = ['오늘은 그 한 가지만 짚고', '아직 증권을 <b>안 읽었습니다</b>'];
  is(marks.every(x => stage.indexOf(x) >= 0), '  그 말이 <b>apex-stage.js</b> 에 있다');
  is(marks.every(x => SRC.indexOf(x) < 0), '  본체에 <b>또 안 적었다</b>');

  console.log('\n[9] 담보 이름은 <b>저장할 때</b> 적는다 (5번)');
  const ba = fs.readFileSync(path.join(ROOT, 'app/ba.html'), 'utf8');
  is(/top:baTopCov\(D\)/.test(ba), '  저장할 때 <b>담보 이름</b>을 같이 보낸다');
  is(/NAME\[x\.k\]/.test(ba), '  이름은 <b>NAME</b> 에서 꺼낸다 — 새로 만들지 않는다');
  is(!/function\s+(chk|cus)?CovName/.test(SRC), '  본체에 <b>담보 이름표를 다시 안 만들었다</b>');

  console.log('\n[10] 홈 <b>아침 미션 5/5</b> 에서 이 칸으로 가는 길');
  is(/onclick="hmMsGoChk\(\)"/.test(SRC) && /arGoCat\('check'\)/.test(SRC),
     '  「🩺 고객 체크 열기」 가 <b>이 칸</b>을 연다');

  console.log('\n[11] 한 분도 없으면 <b>사람을 지어내지 않는다</b> (1번)');
  const Z = await open({ none: true });
  const z = await txt(Z.p);
  is(/읽은 기록|안 읽었습니다/.test(z), '  읽은 기록이 하나도 없어도 <b>칸은 선다</b>');
  is(!/일반암/.test(z), '  <b>없는 담보를 만들지 않는다</b>');

  await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 고객 체크 — 읽은 증권으로 터치합니다. 안 읽었으면 그렇다고 적습니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
