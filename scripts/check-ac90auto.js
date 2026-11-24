/* 📈 90일 아카데미가 기록으로 도는가 (판 X559)

   사장님 말씀 2026-11-24 「팀원들 스스로가 체크를 안하거든」 → 「메인세션 90일
   로드맵과 연결해서」 → 「응, 1단계부터」 → 「2단계도 같이, 다만 편히 볼수있게
   어려운 단어들을 최대한 쉽게 교육도 매일 알람을 띄어줘 … 5분 공부」.

   app/apex-ac90auto.js 가 정말 그런지 봅니다 —
     [1] 시작일을 안 넣어도 <b>팀에 들어온 날</b>로 DAY·주차가 선다
     [2] 직접 고친 날이 이기고, 지우면 팀 날로 돌아간다
     [3] 팀 기록이 없으면 <b>짐작하지 않는다</b> (1번)
     [4] 이번 주 숫자 — 손 입력 칸 없이 CRM 기록에서 맞게 센다(쉬운 말로)
     [5] 통화를 다 못 읽은 주는 모른다고 [6] 계약일 칸이 없으면 — 로
     [7] 로그인 전에는 숫자를 지어내지 않는다
     [8] 판정 넷 — 기록 없음 · 아직 앞 단계 · 새는 곳 · 잘 가는 중
         ★ 팀 비교 사람이 모자라면 「새는 곳」 을 말하지 않는다 (1번)
     [9] 쉬운 말 — 판정 글에 TD·TA·AP·PC 가 맨몸으로 안 나온다
     [10] 오늘 5분 — 세 걸음 · 「다 했어요」 가 서버(scope study5)에 한 줄 · 🔥 이어가기
     [11] 홈 알림 시트 — 홈에서만 · 하루 한 번 · 이따가/오늘은 쉴게요 · 다 했으면 안 뜸
     [12] 리더 팀 성장표 — 기록 없음부터 · 5분 공부 날 수 · 리더 아니면 안 보임  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9233;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_ac90_v2');
        localStorage.removeItem('apex_ac9_five'); localStorage.removeItem('apex_ac9_nudge'); } catch(e){}
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','gbLoad',
   'osCliInfoLoad','osRepListLoad','acCrmLoad'].forEach(n => { window[n] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded=true; if(cb)cb(); };
  window.setupDone = function(){return true;}; window.setupCanRun = function(){return true;};
  window.osTabAllowed = function(){return true;}; window.toast = function(){};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.list=[]; CM.loaded=true; CM.meta={};
  /* 서버 대신 — team_members 는 window.__tm, 나머지는 빈 답. 쓰기(upsert)는 적어 둔다 */
  window.__tm = []; window.__up = [];
  window.osClient = function(){
    return { from(t){
      const p = new Proxy(function(){}, { get(o, k){
        if (k === 'then') return (ok, no) => Promise.resolve({ data: t === 'team_members' ? window.__tm : [], error: null }).then(ok, no);
        return (...a) => { if (k === 'upsert') window.__up.push({ t, row: a[0] }); return p; }; } });
      return p; }, auth: { getSession(){ return Promise.resolve({ data: {} }); } } };
  };
  window.__ymd = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  window.__ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return window.__ymd(d); };
  window.RESET = (tm) => {
    localStorage.removeItem('apex_ac90_v2');
    AC9.join=''; AC9.tried=false; AC9.busy=false; AC9.none=false; AC9.retry=0;
    window.__tm = tm;
  };
  /* n 명 팀 통화를 만든다 — [who, 건 분, 통화된 분, 약속] */
  window.MKTEAM = (spec) => {
    const calls = [], t = __ago(1);
    spec.forEach(([w, call, talk, meet]) => {
      for (let i = 0; i < call; i++)
        calls.push({ w, d: t, h: 10, b: w + i, r: i < meet ? '상담' : (i < talk ? '거절' : '부재') });
    });
    return calls;
  };
  try{ osHideLoginGate(); }catch(e){}
};

(async () => {
  console.log('📈 90일 아카데미 — 팀원이 안 넣어도 기록으로 (판 X559)');
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  const 정적 = /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|cdnjs\.cloudflare|unpkg\.com/;
  await ctx.route('**://**', r => {
    const u = r.request().url();
    return (u.indexOf('127.0.0.1:' + PORT) >= 0 || 정적.test(u)) ? r.continue() : r.abort();
  });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + PORT + '/app/', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof go === 'function' && typeof AC9 !== 'undefined', { timeout: 60000 });
  await pg.evaluate(SEED);

  sec('[1] 시작일을 안 넣어도 <b>팀에 들어온 날</b>로 선다');
  const A = await pg.evaluate(async () => {
    const d = new Date(); d.setDate(d.getDate() - 32); d.setHours(10, 0, 0, 0);
    RESET([{ joined_at: d.toISOString() }]);
    AR.loaded = false; AR.busy = 'load';   /* 아직 못 읽은 때 — 판정 카드는 「읽는 중」 */
    go('academy'); AC.view = 'dash';
    await new Promise(r => setTimeout(r, 300));
    const b = document.getElementById('acadBody');
    return { start: acStart(), src: acStartSrc(), want: __ago(32), info: acDayInfo(), txt: b ? b.innerText : '' };
  });
  is(A.start === A.want, '시작일 = 팀에 들어온 날 (' + A.start + ' / 기대 ' + A.want + ')');
  is(A.src === 'team', '어디서 왔는지 = team');
  is(A.info.set && A.info.day === 33 && A.info.week === 5, 'DAY 33 · 5주차로 센다 (' + A.info.day + ' · ' + A.info.week + ')');
  is(/팀에 들어온 날/.test(A.txt) && /따로 넣을 것은 없어요/.test(A.txt), '대시보드가 「팀에 들어온 날로 자동」 이라고 말한다');
  is(/기록을 읽는 중/.test(A.txt), 'CRM 을 아직 못 읽었으면 판정 대신 「읽는 중」');

  sec('[2] 직접 고친 날이 이기고, 지우면 팀 날로 돌아간다');
  const B = await pg.evaluate(async () => {
    AR.busy = '';
    acSetStart(__ago(10));
    await new Promise(r => setTimeout(r, 100));
    const mine = acStart(), src = acStartSrc(), txt = document.getElementById('acadBody').innerText;
    acSetStart('');
    await new Promise(r => setTimeout(r, 100));
    return { mine, src, txt, back: acStart(), src2: acStartSrc(), want: __ago(10), team: AC9.join };
  });
  is(B.mine === B.want && B.src === 'mine', '고친 날이 이긴다');
  is(/되돌리기/.test(B.txt), '「팀에 들어온 날로 되돌리기」 단추가 선다');
  is(B.back === B.team && B.src2 === 'team', '지우면 팀 날로 돌아간다');

  sec('[3] 팀 기록이 없으면 <b>짐작하지 않는다</b> (1번)');
  const C = await pg.evaluate(async () => {
    RESET([]);
    go('academy'); acGo('dash');
    await new Promise(r => setTimeout(r, 300));
    return { start: acStart(), info: acDayInfo(), txt: document.getElementById('acadBody').innerText };
  });
  is(C.start === '' && !C.info.set, '시작일 없음 — 오늘이나 아무 날로 메우지 않는다');
  is(/시작일을 정하지 못했어요/.test(C.txt), '「정하지 못했어요」 라고 말한다');

  sec('[4] 이번 주 숫자 — 손 입력 칸 없이 CRM 기록에서 맞게, 쉬운 말로');
  const D = await pg.evaluate(async () => {
    const d = new Date(); d.setDate(d.getDate() - 32); d.setHours(10, 0, 0, 0);
    RESET([{ joined_at: d.toISOString() }]);
    go('academy');
    await new Promise(r => setTimeout(r, 300));
    const t = __ago(0), y = __ago(1), old = __ago(12);
    AR.loaded = true; AR.busy = ''; AR.err = ''; AR.callsCut = false; AR.noStage = false;
    AR.calls = [
      { w:'me', d:t, h:10, r:'부재', b:'db1' },
      { w:'me', d:t, h:11, r:'상담', b:'db1' },
      { w:'me', d:y, h:14, r:'거절', b:'db2' },
      { w:'me', d:y, h:15, r:'부재', b:'db3' },
      { w:'me', d:old, h:9, r:'상담', b:'db9' },
      { w:'you', d:t, h:9, r:'상담', b:'db7' }
    ];
    AR.db = [
      { id:'db1', who:'me', cAt:t, pAt:'', stage:'계약완료' },
      { id:'db2', who:'me', cAt:'', pAt:y, stage:'증권전달' },
      { id:'db9', who:'me', cAt:old, pAt:'', stage:'소개완료' },
      { id:'db7', who:'you', cAt:t, pAt:t, stage:'계약완료' }
    ];
    acGo('run');
    const b = document.getElementById('acadBody');
    const W = ac9Win(acDayInfo().week), F = ac9Fun(W.from, W.to);
    return { F, num: b.querySelectorAll('input[type=number]').length, txt: b.innerText,
             wk: acDayInfo().week, rows: b.querySelectorAll('table tbody tr').length,
             tabs: [...document.querySelectorAll('.acad-tab')].map(x => x.textContent) };
  });
  is(D.num === 0, '숫자 넣는 칸이 하나도 없다 (예전엔 넷)');
  is(D.F.td === 3, '전화 건 분 = 3 (같은 분 두 번은 한 분 · 남의 것·기간 밖 제외) — ' + D.F.td);
  is(D.F.ta === 2, '통화된 분 = 2 (부재만 받은 분 제외) — ' + D.F.ta);
  is(D.F.ap === 1, '만남 약속 = 1 — ' + D.F.ap);
  is(D.F.pc === 1, '계약 = 1 (남의 계약·기간 밖 계약 제외) — ' + D.F.pc);
  is(D.F.rl === 1, '증권 전달 = 1 — ' + D.F.rl);
  is(/자동으로/.test(D.txt) && /따로 적을 것은 없어요/.test(D.txt), '화면이 「CRM 기록에서 자동 · 적을 것 없음」 이라고 말한다');
  is(/받는 비율/.test(D.txt) && /약속 비율/.test(D.txt) && /제일 약한 곳/.test(D.txt), '비율 이름이 쉬운 말이고 제일 약한 곳을 짚는다');
  is(!/TD → TA|병목/.test(D.txt), '「TD → TA」·「병목」 같은 어려운 말이 크게 안 나온다');
  is(D.rows === D.wk, '주차별 표가 1주차부터 지금 주(' + D.wk + ')까지 선다 — ' + D.rows + '줄');
  is(D.tabs.indexOf('이번 주 숫자') >= 0 && D.tabs.indexOf('주간 실행·퍼널') < 0, '탭 이름도 「이번 주 숫자」');
  is(D.tabs.indexOf('⏱ 오늘 5분') >= 0, '「⏱ 오늘 5분」 탭이 있다');

  sec('[5] 통화를 다 못 읽은 주는 <b>모른다고</b> 적는다 (1번)');
  const E = await pg.evaluate(() => {
    const keep = AR.calls;
    AR.callsCut = true;
    AR.calls = AR.calls.filter(c => c.d === __ago(0));
    acGo('run');
    const txt = document.getElementById('acadBody').innerText;
    AR.callsCut = false; AR.calls = keep;
    return txt;
  });
  is(/다 읽지 못했어요/.test(E), '「다 읽지 못했어요」 가 선다');

  sec('[6] 계약일 칸이 없는 서버 — 계약을 0 이 아니라 — 로');
  const G = await pg.evaluate(() => {
    AR.noStage = true; acGo('run');
    const txt = document.getElementById('acadBody').innerText;
    AR.noStage = false;
    return txt;
  });
  is(/계약은 셀 수 없어요/.test(G), '「계약은 셀 수 없어요」 라고 말한다');

  sec('[7] 로그인 전에는 숫자를 지어내지 않는다');
  const H = await pg.evaluate(() => {
    const keep = OS.session; OS.session = null;
    acGo('run'); const txt = document.getElementById('acadBody').innerText;
    OS.session = keep; return txt;
  });
  is(/로그인하면/.test(H) && !/받는 비율/.test(H), '로그인 안내만 서고 숫자는 안 그린다');

  sec('[8] 판정 넷 — 기록만 보고');
  const J = await pg.evaluate(() => {
    /* 약속 비율: 가 60% · 나 50% · 다 40% · 라 10% → 가운데 45% → 라만 새는 곳 */
    AR.calls = MKTEAM([['ga',10,10,6],['na',10,10,5],['da',10,10,4],['ra',10,10,1],
                       ['st',6,4,0]]);            /* st: 통화는 되는데 약속이 0 */
    AR.db = [];
    const mid = ac9Mid();
    const out = {
      mid,
      none: ac9Judge('zz', __ago(20), mid),
      stuck: ac9Judge('st', __ago(20), mid),    /* DAY 21 = 「전화로 만남 잡기」 때 */
      leak: ac9Judge('ra', __ago(40), mid),
      good: ac9Judge('ga', __ago(40), mid)
    };
    const a = __ago(0).split('-'), n = Math.round(new Date(+a[0], +a[1]-1, +a[2]).getTime() / 86400000);
    out.n3 = n % 3; out.tLeak = ac9Topic(out.leak).id; out.tGood = ac9Topic(out.good).id;
    /* 두 사람뿐이면 — 가운데값을 모른다 → 새는 곳이라 하지 않는다 */
    AR.calls = MKTEAM([['ga',10,10,6],['ra',10,10,1]]);
    const mid2 = ac9Mid();
    out.mid2 = mid2; out.small = ac9Judge('ra', __ago(40), mid2);
    return out;
  });
  is(J.mid.meet === 45, '팀 가운데 약속 비율 = 45% — ' + J.mid.meet);
  is(J.none.sig === 'none' && J.none.topic === 'rec', '통화 기록 없음 → 「기록 없음」 · 공부는 「통화 결과 남기기」');
  is(J.stuck.sig === 'stuck' && J.stuck.segName === '전화로 만남 잡기', 'DAY 21 인데 약속 0 → 「아직 앞 단계」 (' + J.stuck.head + ')');
  is(J.leak.sig === 'leak' && J.leak.weak && J.leak.weak.R.k === 'meet', '약속 10% < 가운데 45% → 「새는 곳 · 약속 비율」');
  is(J.good.sig === 'good', '약속 60% → 「잘 가는 중」');
  is(J.mid2.meet === null && J.small.sig !== 'leak', '★ 팀 비교 사람이 셋 미만이면 「새는 곳」 을 말하지 않는다 — ' + J.small.sig);
  is(/다음에 키울 곳/.test(J.small.why), '그때는 「다음에 키울 곳」 으로만 적는다');
  const wantLeak = J.n3 === 0 ? 'w' : (J.n3 === 2 ? 'gym' : 'meet');
  is(wantLeak === 'w' ? /^w/.test(J.tLeak) : J.tLeak === wantLeak,
     '약속에서 새면 오늘 5분도 약속 연습(사흘 중 하루만 이번 주 커리큘럼) — 오늘 ' + J.tLeak);
  is(/^w/.test(J.tGood), '잘 가는 중이면 이번 주 커리큘럼 — ' + J.tGood);

  sec('[9] 쉬운 말 — 판정 글에 교재 낱말이 맨몸으로 안 나온다');
  const P = await pg.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() - 32);
    AR.calls = MKTEAM([['me',10,10,1],['ga',10,10,6],['na',10,10,5],['da',10,10,4]]);
    AR.db = [];
    acGo('dash');
    const card = document.querySelector('#acadBody .a9-card');
    const head = card ? card.querySelector('.a9-head').innerText + ' ' + card.querySelector('.a9-why').innerText : '';
    return { head, plain: ac9Plain('최근 상담 10건에서 TD·TA·AP·PC를 직접 세어 본다'),
             cells: card ? card.querySelectorAll('.a9-cell').length : 0 };
  });
  is(P.cells === 5, '판정 카드에 다섯 칸(전화 건 분 → 소개 받음)');
  is(P.head && !/\b(TD|TA|AP|PC|CS|RL)\b/.test(P.head), '판정 글에 TD·TA·AP·PC 가 없다 — 「' + P.head.slice(0, 40) + '…」');
  is(/전화 걸기\(TD\)/.test(P.plain) && /만나서 듣기\(AP\)/.test(P.plain), '커리큘럼 글은 쉬운 말로 바꾸고 교재 낱말은 괄호로 — 「' + P.plain + '」');

  sec('[10] 오늘 5분 — 세 걸음 · 「다 했어요」 가 리더에게 닿는다');
  const F = await pg.evaluate(async () => {
    localStorage.removeItem('apex_ac9_five'); window.__up = [];
    const L = {}; L[__ago(1)] = 'rec'; L[__ago(2)] = 'rec'; localStorage.setItem('apex_ac9_five', JSON.stringify(L));
    acGo('five');
    const b = document.getElementById('acadBody');
    const before = { steps: b.querySelectorAll('.a9-steps li').length, txt: b.innerText,
                     done: !!b.querySelector('.a9-go') };
    ac9FiveDone('meet');
    await new Promise(r => setTimeout(r, 50));
    return { before, after: document.getElementById('acadBody').innerText, up: window.__up,
             log: JSON.parse(localStorage.getItem('apex_ac9_five') || '{}') };
  });
  is(F.before.steps === 3 && /1분/.test(F.before.txt) && /3분/.test(F.before.txt), '세 걸음 (1분 · 3분 · 1분)');
  is(/5분 시작/.test(F.before.txt) && F.before.done, '「▶ 5분 시작」 과 「✅ 다 했어요」');
  is(/🔥 2일째/.test(F.before.txt), '어제·그제 했으면 🔥 2일째');
  const up = F.up.find(x => x.t === 'daily_checks');
  is(!!up && up.row.scope === 'study5' && up.row.member_id === 'me' && up.row.items.t === 'meet',
     '「다 했어요」 → daily_checks 에 scope study5 한 줄 (리더가 읽음)');
  is(/오늘 5분 끝/.test(F.after) && /🔥 3일째/.test(F.after), '끝낸 뒤 「오늘 5분 끝」 · 🔥 3일째');

  sec('[11] 홈 알림 시트 — 홈에서만, 하루 한 번');
  const N = await pg.evaluate(async () => {
    const keepTab = window.currentTab, out = {};
    window.__a9Force = true;
    const fresh = () => { localStorage.removeItem('apex_ac9_nudge'); localStorage.removeItem('apex_ac9_five'); a9SheetClose(); };
    const has = () => !!document.getElementById('a9Sheet');
    window.currentTab = () => 'crm'; fresh(); ac9Nudge(); out.otherTab = has();
    window.currentTab = () => 'home'; fresh(); ac9Nudge(); out.home = has();
    out.txt = has() ? document.getElementById('a9Sheet').innerText : '';
    a9Later(3); ac9Nudge(); out.later = has();
    fresh(); ac9Nudge(); a9Later(0); ac9Nudge(); out.rest = has();
    fresh(); ac9FiveDone('rec'); ac9Nudge(); out.done = has();
    fresh(); ac9Nudge(); a9Start(); out.start = { sheet: has(), view: AC.view };
    /* 화면을 바꾸면 저절로 — go() 를 감싸지 않고 1초마다 지금 화면만 본다 */
    fresh(); window.currentTab = () => 'crm'; await new Promise(r => setTimeout(r, 1300));
    window.currentTab = () => 'home'; await new Promise(r => setTimeout(r, 3000)); out.watchOn = has();
    window.currentTab = () => 'crm'; await new Promise(r => setTimeout(r, 1300)); out.watchOff = has();
    out.goClean = !/ac9|a9Sheet/.test(String(go));
    fresh(); window.__a9Force = false; ac9Nudge(); out.webdriver = has();
    window.currentTab = keepTab; fresh();
    return out;
  });
  is(!N.otherTab, '홈이 아니면 안 뜬다 (고객 앞 화면에 안 뜸)');
  is(N.home && /오늘 이거 5분만 해 봐요/.test(N.txt) && /지금 5분 하기/.test(N.txt), '홈에서 「오늘 이거 5분만 해 봐요!」 시트가 뜬다');
  is(!N.later, '「이따가 할게요」 → 바로 다시 안 뜬다(3시간 뒤)');
  is(!N.rest, '「오늘은 쉴게요」 → 오늘은 안 뜬다');
  is(!N.done, '오늘 5분을 했으면 안 뜬다');
  is(!N.start.sheet && N.start.view === 'five', '「지금 5분 하기」 → 시트 닫고 오늘 5분 화면으로');
  is(N.watchOn && !N.watchOff, '홈으로 오면 저절로 뜨고, 다른 화면으로 가면 저절로 닫힌다');
  is(N.goClean, '★ go() 를 감싸지 않는다 — check-bamake 가 go 글을 읽는다');
  is(!N.webdriver, '점검 브라우저에서는 저절로 안 뜬다 — 다른 점검을 가리지 않게');

  sec('[12] 리더 팀 성장표');
  const T = await pg.evaluate(async () => {
    const keepLead = window.gbIsLead;
    window.gbIsLead = () => true;
    AR.loaded = true;
    AR.calls = MKTEAM([['ga',10,10,6],['na',10,10,5],['da',10,10,4],['ra',10,10,1]]);
    AR.db = [];
    GB.loaded = true; GB.team = 'T';
    GB.rows = [{ id:'ga', name:'팀원 가', team:'T' }, { id:'ra', name:'팀원 라', team:'T' },
               { id:'zz', name:'팀원 자', team:'T' }, { id:'xx', name:'남의 팀', team:'U' }];
    AC9.team = { join: { ga: __ago(40), ra: __ago(40) }, five: { ga: 3 }, fiveErr: false };
    acGo('team');
    const b = document.getElementById('acadBody');
    const names = [...b.querySelectorAll('.a9-name')].map(x => x.textContent);
    const txt = b.innerText;
    window.gbIsLead = () => false; acGo('team');
    const notLead = document.getElementById('acadBody').innerText;
    const tabs = [...document.querySelectorAll('.acad-tab')].map(x => x.textContent);
    window.gbIsLead = keepLead;
    return { names, txt, notLead, tabs };
  });
  is(T.names.length === 3 && T.names.indexOf('남의 팀') < 0, '내 팀 세 명만 — ' + T.names.join(', '));
  is(T.names[0] === '팀원 자', '기록 없는 사람이 맨 위 — ' + T.names[0]);
  is(/최근 7일 중 3일/.test(T.txt), '5분 공부 날 수가 보인다');
  is(/이번 주 한 가지: 통화 결과, 30초 만에 남기기/.test(T.txt) && /이번 주 한 가지: 거절을 만남 약속으로/.test(T.txt),
     '이번 주 한 가지는 <b>그 팀원</b>의 약한 곳 주제다(리더 주차의 커리큘럼이 아니다)');
  is(/이번 주 한 가지/.test(T.txt) && /주간 회의 5분/.test(T.txt), '「이번 주 한 가지」 와 회의 안내');
  is(/리더만/.test(T.notLead) && T.tabs.indexOf('👥 팀 성장표') < 0, '리더가 아니면 안 보이고 탭도 없다');

  is(errs.length === 0, '페이지 오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남' : '\n✓ 모두 맞음');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
