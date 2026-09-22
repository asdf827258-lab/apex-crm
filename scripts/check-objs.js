/* 🚫 <b>거절처리</b> — 오늘 챙길 것에서 바로 (사장님 말씀 ⑧)

   「TA멘트 전문가 수준으로 <b>거절처리부터 길게</b> 만들고, 그걸 <b>오늘
    챙길것에 띄우고 관리</b>하게」 (2026-09-22)

   못 박는 것 —
     ① 「🚫 거절」 을 누르면 <b>바로 안 적고</b> 무엇을 말할지 먼저 보여 준다.
        거절은 한 번 적히면 그 고객께 다시 전화를 안 건다
     ② 고객이 한 말을 고르면 <b>그대로 읽을 말</b>이 선다
     ③ <b>금지 표현</b>과 <b>종료 기준</b>을 같이 적는다 — 「무엇을 말할까」만
        적고 그 둘을 빠뜨리면 붙잡다 그 고객을 영영 잃는다
     ④ 정말 끝이면 <b>그 자리에서 기록</b>된다 — 기록하는 곳은 hdbCall 한 곳 (5번)
     ⑤ 말은 <b>apex-stage.js 한 곳</b>에서 온다. 본체에 또 적지 않았다 (5번).
        ta-script.html 도 <b>같은 표</b>를 읽는다 — 두 화면이 다른 말을 하면 안 된다
     ⑥ <b>지어내지 않는다</b> (1번) — 설계사 이름을 모르면 적힌 그대로(OOO) 둔다
     ⑦ 글에 <b>숫자·한도·나이</b>가 안 섞인다 (2번)                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8961;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end(JSON.stringify({ key: null, has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});

const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.toast=function(m){window.__T=m;};window.osIsOwner=function(){return false;};
 window.osLoadClients=function(){};window.copyText=function(t){window.__C=t;};
 window.confirm=function(){return true;};window.mountCrm=function(){};
 GB.loaded=true;GB.teams=[];GB.rows=[{id:'me',name:'홍길동'}];
 var _e={};window.arRowOf=function(i){return i==='me'?{id:'me',name:'홍길동',sc:_e,raw:_e}:null;};
 window.setupShow=function(){return false;};window.setupCanRun=function(){return true;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동가',region:'순천',src:'보장분석3DB',stage:'TA',days:3,n:1,res:'미진행',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];CM.loaded=true;CM.who={me:'홍길동'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 window.__W=[];
 window.osClient=function(){var mk=function(t){var st={t:t,op:'',pay:null};var a={};
   ['select','order','range','limit','single','gte','in','is','neq','not','eq']
     .forEach(function(k){a[k]=function(){return a;};});
   ['update','insert','upsert','delete'].forEach(function(k){a[k]=function(p){st.op=k;st.pay=p;return a;};});
   a.then=function(ok){ if(st.op)window.__W.push({t:st.t,op:st.op,pay:st.pay});
     return Promise.resolve({data:st.op?[{id:'x'}]:[],error:null}).then(ok);};
   return a;};
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(700);

  console.log('\n[1] 「🚫 거절」 은 <b>바로 안 적는다</b> — 먼저 무엇을 말할지 보여 준다');
  const strip = await p.evaluate(() => hdbStripHtml({ k: 'db', id: 'd1', t: '홍길동가' }));
  is(/objOpen\('d1'\)/.test(strip), '  단추가 <b>거절처리 창</b>을 연다 — 바로 기록하지 않는다');
  is(!/hdbCall\('d1','거절'\)/.test(strip), '  <b>곧바로 적는 길이 없다</b> — 그 자리에서만 적힌다');
  await p.evaluate(() => { window.__W = []; objOpen('d1'); }); await p.waitForTimeout(300);
  const S = await p.evaluate(() => {
    const e = document.getElementById('objSheet');
    return { on: !!(e && e.classList.contains('on')),
      t: e ? (e.innerText || '').replace(/\s+/g, ' ') : '',
      tabs: e ? [...e.querySelectorAll('.obj-t')].length : 0,
      wrote: window.__W.length };
  });
  is(S.on, '  창이 <b>뜬다</b>');
  is(S.wrote === 0, '  열기만 해서는 <b>아무것도 안 적힌다</b> — 나간 글 ' + S.wrote + '건');
  is(/홍길동가/.test(S.t), '  <b>누구 이야기인지</b> 적는다');

  console.log('\n[2] 고객이 한 말을 고르면 <b>그대로 읽을 말</b>이 선다');
  is(S.tabs >= 10, '  고를 말이 <b>여럿</b>이다 — ' + S.tabs + '가지 (거절처리부터 길게)');
  is(/바로 말할 멘트/.test(S.t), '  <b>바로 말할 멘트</b>가 있다');
  is(/다음 한마디/.test(S.t), '  <b>다음 한마디</b>가 있다');

  console.log('\n[3] <b>금지 표현</b>과 <b>종료 기준</b>을 같이 적는다');
  is(/하지 않습니다/.test(S.t), '  <b>이 말은 하지 않습니다</b>');
  is(/여기서 끝냅니다/.test(S.t), '  <b>여기서 끝냅니다</b> — 언제 그만두는지');
  /* 열일곱 가지 <b>모두</b> 그 둘을 들고 있나 — 하나라도 빠지면 그 자리에서 붙잡게 된다 */
  const all = await p.evaluate(() => objList().map(o => ({ t: o.title, a: !!o.avoid, s: !!o.stop, x: !!o.text, f: !!o.follow })));
  is(all.length >= 10 && all.every(o => o.a && o.s && o.x && o.f),
     '  <b>모든 가지</b>가 넷을 다 들고 있다 — ' + all.length + '가지 · 빠진 것 ' +
     (all.filter(o => !(o.a && o.s)).map(o => o.t).join(',') || '없음'));

  console.log('\n[4] 정말 끝이면 <b>그 자리에서</b> 기록된다 (5번)');
  await p.evaluate(() => { window.__W = []; objDone(); }); await p.waitForTimeout(400);
  const W = await p.evaluate(() => window.__W.slice());
  is(W.length === 1 && W[0].t === 'calls' && W[0].pay && W[0].pay.result === '거절',
     '  <b>calls 에 거절</b>로 들어간다 — ' + JSON.stringify(W.map(x => x.t + '.' + x.op)));
  is(!(await p.evaluate(() => !!document.querySelector('#objSheet.on'))), '  적고 나면 창이 <b>닫힌다</b>');

  console.log('\n[5] 말은 <b>한 곳</b>에서 온다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const ST = fs.readFileSync(path.join(ROOT, 'apex-stage.js'), 'utf8');
  const TA = fs.readFileSync(path.join(ROOT, 'ta-script.html'), 'utf8');
  is(/var OBJ\s*=\s*\[/.test(ST), '  거절처리 표가 <b>apex-stage.js</b> 에 있다');
  is(!/title:\s*'사은품만 신청했어요'/.test(SRC), '  <b>본체에는 없다</b> — 또 적지 않았다');
  is(!/title:\s*'사은품만 신청했어요'/.test(TA) && /APEX_STAGE\.objList/.test(TA),
     '  <b>ta-script 도 같은 표</b>를 읽는다 — 두 화면이 다른 말을 하면 안 된다');

  console.log('\n[6] <b>지어내지 않는다</b> (1번) · <b>숫자를 안 적는다</b> (2번)');
  const fill = await p.evaluate(() => ({
    none: APEX_STAGE.objFill('저는 OOO이고 “유입 경로” 건입니다', '', ''),
    both: APEX_STAGE.objFill('저는 OOO이고 “유입 경로” 건입니다', '홍길동', '보장분석3DB')
  }));
  is(/OOO/.test(fill.none) && /유입 경로/.test(fill.none),
     '  모르면 <b>적힌 그대로</b> 둔다 — 「' + fill.none + '」');
  is(/홍길동/.test(fill.both) && /보장분석3DB/.test(fill.both) && !/OOO/.test(fill.both),
     '  알면 <b>끼워 넣는다</b> — 「' + fill.both + '」');
  /* 2번 — <b>한도·나이·개월 수</b> 같은 숫자를 멘트에 적으면, 시행령이
     개정되는 날 고객 앞에서 무너집니다.
     ★ <b>빼는 것을 여기 적어 둡니다</b> (8번 — 헛것을 잡는 점검은 안 잡는
       점검보다 나쁘다). 「10초」·「3분」 은 <b>통화 길이</b>고, 「최근 1년 안에」
       는 <b>언제 점검받으셨나</b>를 묻는 말입니다 — 둘 다 보험 조건이 아니라
       개정돼도 안 바뀝니다. 잡는 것은 <b>돈·나이·개월 수·비율</b> 입니다. */
  const nums = await p.evaluate(() => {
    const bad = [];
    objList().forEach(o => {
      [o.text, o.follow].forEach(t => {
        (String(t).match(/\d+\s*(만원|원|세|개월|%|배|억)/g) || []).forEach(m => bad.push(o.title + ':' + m));
      });
    });
    return bad;
  });
  is(nums.length === 0, '  멘트에 <b>돈·나이·개월 수·비율이 없다</b> (2번) — ' + (nums.join(',') || '없음'));

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 거절처리 — 고칠 자리 ' + bad + '곳'
    : '✓ 거절처리 — 오늘 챙길 것에서 바로 열리고, 금지 표현과 종료 기준까지 같이 섭니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
