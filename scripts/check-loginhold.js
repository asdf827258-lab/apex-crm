/* <b>「로그인이 갑자기 안 되는 분들이 있다」</b>

   2026-08-30, Supabase 가 <b>522</b> 로 스무 초씩 답을 안 주는 일이
   있었습니다(REST·AUTH 둘 다, 여섯 번 재 봐서 여섯 번 다). 서버가 죽은
   것은 앱이 어쩔 수 없습니다. <b>그런데 앱이 그 사실을 말해 주지
   않았습니다.</b>

   로그인 문턱은 이렇게 이어집니다.

     내 정보 읽기 → 승인 확인 → 설정 읽기 → IP 확인 → 문 열기

   앞의 「내 정보 읽기」 에는 시간 제한이 있었는데(2026-08-28 에 배운 것)
   <b>뒤의 둘에는 없었습니다.</b> 서버가 매달리면 그 자리에서 멈췄고
   <code>osHideLoginGate()</code> 가 영영 안 불려 <b>로그인 화면이 그대로
   남았습니다.</b> 붉은 띠도, 안내도, 콘솔 오류도 없었습니다 — 눈에는
   「눌렀는데 아무 일도 안 일어난다」 였습니다.

   그리고 「승인 확인」 은 <b>이미 읽어 온 줄을 한 번 더 읽고</b>
   있었습니다. 서버를 로그인마다 헛되이 한 번 더 부르면서(7번), 그 한 번이
   멈추면 로그인 전체를 잡아 두는 자리였습니다.

   ── 여기서 지키는 것 ─────────────────────────────────────────────
     1. 문턱의 <b>모든 기다림</b>에 시간 제한이 있다 (CLAUDE.md 4-1)
     2. 어느 자리가 멈춰도 <b>반드시 무엇이든 말한다</b> — 침묵 금지
     3. 잠금이 아닌 것(설정·승인 칸 없는 옛 표) 때문에 <b>사람을 막지
        않는다</b> — 서버가 흔들릴 때마다 다 못 쓰게 되면 안 된다
     4. 이미 읽은 줄을 <b>두 번 읽지 않는다</b> (7번)
     5. 로그인 화면에서 <b>본인이</b> 서버 탓인지 비밀번호 탓인지 안다  */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const ROOT = process.cwd();
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('404'); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});

/* 서버가 <b>대답을 안 하는</b> 흉내 — 522 는 이렇게 보인다.
   hang 에 적은 표에서만 영영 매달리고, 나머지는 정상으로 답한다.
   single() 을 쓴 읽기는 객체로, 아닌 것은 배열로 돌려준다 — 앱이 그렇게 읽는다. */
const FAKE = `(function(hang, prof, onRead){
  var never=function(){ return new Promise(function(){}); };
  var mk=function(tbl){
    var one=false,a={};
    ['select','eq','neq','order','limit','insert','update','upsert','delete','in','is','not','or','filter','match','range','gt','gte','lt','lte']
      .forEach(function(k){ a[k]=function(){ return a; }; });
    a.single=function(){ one=true; return a; };
    a.maybeSingle=function(){ one=true; return a; };
    var body=function(){
      if(onRead)onRead(tbl);
      if(tbl==='profiles')return one?prof:[prof];
      return [];
    };
    a.then=function(res,rej){
      if(hang.indexOf(tbl)>=0)return never();
      return Promise.resolve({data:body(),error:null}).then(res,rej);
    };
    a.catch=function(){ return never(); };
    return a;
  };
  return {
    from:mk,
    rpc:function(){ return Promise.resolve({data:null,error:null}); },
    auth:{
      signInWithPassword:function(){ return Promise.resolve({data:{},error:null}); },
      signOut:function(){ return Promise.resolve({}); },
      getSession:function(){ return Promise.resolve({data:{session:null}}); },
      onAuthStateChange:function(){ return {data:{subscription:{unsubscribe:function(){}}}}; }
    }
  };
})`;

/* 견본 사람은 홍길동 (CLAUDE.md 3번) */
const NEW_ROW = { id: 'u1', name: '홍길동', role: 'member', active: true, team_id: null,
                  plan: 'pro', plan_until: null, status: 'approved', workspace: 'both' };
/* 옛 표 — 승인 칸이 아예 없다 */
const OLD_ROW = { id: 'u1', name: '홍길동', role: 'member', active: true, team_id: null };

/* 한 경우마다 <b>새 판</b>을 연다. 앞 경우가 걸어 둔 되시도 타이머(1.8초 뒤
   osLoadProfile 를 한 번 더 부른다)가 다음 경우의 읽기 차례를 밀어 버려,
   고친 것을 되돌려도 초록불이 켜지는 일이 실제로 있었다. */
let browser = null, BASE = '';
const errs = [];
async function freshPage() {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  return p;
}

async function run(page, hang, prof, ms) {
  return page.evaluate(async ({ FAKE_SRC, hang, prof, ms }) => {
    const reads = [];
    const chain = eval(FAKE_SRC)(hang, prof, (t) => reads.push(t));
    window.osClient = function () { return chain; };
    OS.sb = chain;
    OS.session = { user: { id: 'u1', email: 'hong@example.com' } };
    OS.profile = null; OS.cfg = {}; OS_PROF_RETRY = 0;
    OS_DOWN.at = 0; OS_DOWN.what = '';
    try { const b = document.getElementById('osDownBar'); if (b) b.remove(); } catch (e) {}
    let said = '';
    const realToast = window.toast; window.toast = function (m) { said += ' | ' + m; };
    /* <b>문이 열릴 때까지</b> 몇 번 읽었나만 센다. 문이 열린 뒤에 고객목록·
       아침브리핑이 profiles 를 읽는 것은 이 자리와 상관없는 다른 일이다. */
    let gateReads = -1;
    const realOnLogin = window.osOnLogin;
    window.osOnLogin = function () {
      if (gateReads < 0) gateReads = reads.filter(t => t === 'profiles').length;
      return realOnLogin.apply(this, arguments);
    };
    /* 띠는 <b>나으면 내려간다</b>(osServerOk) — 지친 그 순간과 나은 순간이
       몇 밀리초 차이라 눈으로 훔쳐보면 놓친다. 그래서 「지쳤다」고 적는 자리를
       붙잡고, <b>그때 실제로 띠가 서 있었는지</b> 그 자리에서 읽는다. */
    let ever = '';
    const realDown = window.osServerDown;
    window.osServerDown = function () {
      const out = realDown.apply(this, arguments);
      const b = document.getElementById('osDownBar');
      if (b && !ever) ever = b.textContent.replace(/\s+/g, ' ').trim();
      return out;
    };
    osLoadProfile();
    await new Promise(x => setTimeout(x, ms));
    window.toast = realToast; window.osOnLogin = realOnLogin;
    window.osServerDown = realDown;
    const bar = document.getElementById('osDownBar');
    return {
      loggedIn: !!OS.profile,
      bar: bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '',
      ever: ever,
      said: said.replace(/\s+/g, ' ').trim(),
      gateReads: gateReads,
      reads: reads.join(',')
    };
  }, { FAKE_SRC: FAKE, hang, prof, ms });
}

(async () => {
  await new Promise(r => srv.listen(0, r));
  BASE = 'http://127.0.0.1:' + srv.address().port + '/app/index.html';
  browser = await chromium.launch();
  let page = await freshPage();

  const LIMIT = await page.evaluate(() => OS_WAIT_MS);
  const WAIT = LIMIT + 3500;
  console.log('\n  (시간 제한 ' + (LIMIT / 1000) + '초 · ' + (WAIT / 1000) + '초까지 지켜본다)');

  console.log('\n[1] 내 정보 읽기가 매달려도 — 반드시 말한다');
  const A = await run(page, ['profiles'], NEW_ROW, WAIT);
  is(/서버가 응답하지 않습니다/.test(A.ever), '  붉은 띠가 <b>선다</b>');
  is(/비밀번호나 인터넷 문제가 아닐 수 있습니다/.test(A.ever),
     '  <b>비밀번호 탓이 아니라고</b> 말한다 — 「' + A.ever.slice(0, 46) + '…」');
  is(!A.loggedIn, '  내 정보를 못 읽었으니 <b>안 들어간다</b> — 그건 맞다');

  console.log('\n[2] 승인 확인이 매달려도 — 문은 열린다 (옛 표)');
  /* 옛 표에는 승인 칸이 없다. 그 한 번을 못 읽었다고 사람을 막으면 안 된다. */
  await page.close(); page = await freshPage();
  const C = await page.evaluate(async ({ FAKE_SRC, prof, ms }) => {
    /* 내 정보는 되고 <b>두 번째</b> profiles 읽기만 매달리게 한다 */
    let n = 0;
    const never = () => new Promise(() => {});
    const mk = (tbl) => {
      let one = false; const a = {};
      ['select', 'eq', 'neq', 'order', 'limit', 'insert', 'update', 'upsert', 'delete',
       'in', 'is', 'not', 'or', 'filter', 'match', 'range', 'gt', 'gte', 'lt', 'lte']
        .forEach(k => { a[k] = () => a; });
      a.single = () => { one = true; return a; };
      a.maybeSingle = a.single;
      a.then = (res, rej) => {
        /* <b>두 번째</b> profiles 읽기 하나만 매달린다 — 그게 승인 확인이다 */
        if (tbl === 'profiles') { n++; if (n === 2) return never(); }
        return Promise.resolve({ data: tbl === 'profiles' ? (one ? prof : [prof]) : [], error: null }).then(res, rej);
      };
      a.catch = () => never();
      return a;
    };
    const chain = { from: mk, rpc: () => Promise.resolve({ data: null, error: null }),
                    auth: { signOut: () => Promise.resolve({}) } };
    window.osClient = () => chain; OS.sb = chain;
    OS.session = { user: { id: 'u1', email: 'hong@example.com' } };
    OS.profile = null; OS.cfg = {}; OS_PROF_RETRY = 0; OS_DOWN.at = 0;
    try { const b = document.getElementById('osDownBar'); if (b) b.remove(); } catch (e) {}
    let said = '';
    const realToast = window.toast; window.toast = function (m) { said += ' | ' + m; };
    let ever = '';
    const realDown = window.osServerDown;
    window.osServerDown = function () {
      const out = realDown.apply(this, arguments);
      const b = document.getElementById('osDownBar');
      if (b && !ever) ever = b.textContent.replace(/\s+/g, ' ').trim();
      return out;
    };
    osLoadProfile();
    await new Promise(x => setTimeout(x, ms));
    window.toast = realToast; window.osServerDown = realDown;
    const bar = document.getElementById('osDownBar');
    return { loggedIn: !!OS.profile, tries: n, ever: ever,
             bar: bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '',
             said: said.replace(/\s+/g, ' ').trim() };
  }, { FAKE_SRC: FAKE, prof: OLD_ROW, ms: WAIT });
  is(/서버가 응답하지 않습니다/.test(C.ever), '  붉은 띠가 <b>선다</b> — 조용히 안 넘어간다');
  is(C.loggedIn, '  <b>문은 열린다</b> — 승인 칸이 없는 표라 막을 근거가 없다');
  is(!/영영|처리 중/.test(C.said), '  「처리 중」 에서 <b>영영 돌지 않는다</b>');
  is(!C.bar, '  그 뒤 서버가 <b>낫자 띠는 내려간다</b> — 다 나은 뒤에도 겁주지 않는다 (8번)');

  console.log('\n[3] 설정 읽기가 매달려도 — 문은 열린다');
  await page.close(); page = await freshPage();
  const D = await run(page, ['app_config'], NEW_ROW, WAIT);
  is(/서버가 응답하지 않습니다/.test(D.ever), '  붉은 띠가 <b>선다</b>');
  is(/설정 읽기/.test(D.ever), '  <b>어느 자리</b>에서 지쳤는지 이름을 댄다');
  is(D.loggedIn, '  <b>문은 열린다</b> — 설정은 잠금이 아니다');

  console.log('\n[4] 이미 읽은 줄을 두 번 읽지 않는다 (7번)');
  await page.close(); page = await freshPage();
  const E = await run(page, [], NEW_ROW, 1500);
  is(E.loggedIn, '  정상일 때 <b>로그인된다</b>');
  is(E.gateReads === 1,
     '  문이 열릴 때까지 profiles 를 <b>한 번</b>만 읽는다 — '
     + E.gateReads + '번 (여태 두 번이었다)');

  console.log('\n[5] 서버가 정상이면 조용하다 — 헛알람이 없다 (8번)');
  is(!E.ever && !E.bar, '  붉은 띠가 <b>한 번도 안 뜬다</b>');

  console.log('\n[6] 로그인 화면에서 본인이 확인할 수 있다');
  await page.close(); page = await freshPage();
  const F = await page.evaluate(async () => {
    const d = document.createElement('div'); d.innerHTML = osAuthFormHtml(false);
    const hasBtn = !!d.querySelector('#osNetBtn'), hasOut = !!d.querySelector('#osNetOut');
    document.body.appendChild(d);
    const out = () => document.getElementById('osNetOut').textContent.replace(/\s+/g, ' ').trim();
    window.APEX_SB = { url: 'https://x.example', key: 'k' };
    /* ① 서버가 정상 */
    window.fetch = function () { return Promise.resolve({ status: 200 }); };
    osNetTest(); await new Promise(r => setTimeout(r, 250));
    const ok = out();
    /* ② 서버가 오류로 답한다 (522) */
    window.fetch = function () { return Promise.resolve({ status: 522 }); };
    osNetTest(); await new Promise(r => setTimeout(r, 250));
    const err = out();
    /* ③ 아예 대답이 없다 */
    window.fetch = function () { return new Promise(function () {}); };
    osNetTest(); await new Promise(r => setTimeout(r, OS_NET_MS + 700));
    const dead = out();
    const btnBack = document.getElementById('osNetBtn').textContent;
    d.remove();
    return { hasBtn, hasOut, ok, err, dead, btnBack };
  });
  is(F.hasBtn && F.hasOut, '  로그인 화면에 <b>「서버 상태 확인」</b> 이 있다');
  is(/서버는 정상입니다/.test(F.ok) && /비밀번호/.test(F.ok),
     '  정상이면 <b>「그러면 비밀번호 쪽입니다」</b> — 「' + F.ok.slice(0, 40) + '…」');
  is(/522/.test(F.err) && /비밀번호도 문제가 아닙니다/.test(F.err),
     '  오류로 답하면 <b>번호를 그대로</b> 보여 준다 — 「' + F.err.slice(0, 40) + '…」');
  is(/답하지 않습니다/.test(F.dead) && /비밀번호도 문제가 아닙니다/.test(F.dead),
     '  대답이 없으면 <b>기다리다 말한다</b> — 「' + F.dead.slice(0, 40) + '…」');
  is(/서버 상태 확인/.test(F.btnBack), '  단추가 <b>다시 눌리게</b> 돌아온다');

  console.log('\n[6-1] 서버가 죽었을 때 — 무엇을 하면 되는지 그 자리에 적는다');
  /* 2026-08-30 과 09-01, 같은 일이 두 번 났다. 고치는 법을 아는 사람이
     한 명뿐이면 다음에도 그 사람을 불러야 한다. */
  await page.close(); page = await freshPage();
  const N = await page.evaluate(async () => {
    window.APEX_SB = { url: 'https://miakdhxtqofpndtlyzxa.supabase.co', key: 'k' };
    const ref = osSupaRef();
    const fix = osDownFixHtml();
    /* 주소를 여기 또 적지 않고 <b>쓰는 서버에서 뽑는가</b> */
    window.APEX_SB = { url: 'https://otherproj.supabase.co', key: 'k' };
    const fix2 = osDownFixHtml();
    window.APEX_SB = { url: '', key: '' };
    const none = osDownFixHtml();
    window.APEX_SB = { url: 'https://x.example', key: 'k' };
    /* 서버가 오류로 답할 때 실제로 붙는가 */
    const d = document.createElement('div'); d.innerHTML = osAuthFormHtml(false);
    document.body.appendChild(d);
    window.fetch = () => Promise.resolve({ status: 522 });
    osNetTest(); await new Promise(r => setTimeout(r, 300));
    const out = document.getElementById('osNetOut').innerHTML;
    d.remove();
    return { ref, restart: /Restart project/.test(fix),
             link: fix.indexOf('/project/miakdhxtqofpndtlyzxa/settings/general') >= 0,
             other: fix2.indexOf('/project/otherproj/settings/general') >= 0,
    /* 주소를 못 읽었으면 <b>/project// 같은 깨진 링크</b>를 주면 안 된다 —
       「supabase.com/dashboard」 가 들어 있는지만 보면 깨진 것도 통과한다 */
             safe: none.indexOf('supabase.com/dashboard') >= 0 && none.indexOf('/project/') < 0,
             status: fix.indexOf('status.supabase.com') >= 0,
             inErr: /Restart project/.test(out) };
  });
  is(N.ref === 'miakdhxtqofpndtlyzxa' && N.link,
     '  대시보드 주소를 <b>쓰는 서버에서 뽑는다</b> — 여기 또 안 적는다 (5번)');
  is(N.other, '  서버를 옮기면 <b>따라간다</b> — 엉뚱한 곳으로 안 보낸다');
  is(N.safe, '  주소를 못 읽어도 <b>대시보드까지는</b> 보내 준다');
  is(N.restart && N.status, '  <b>Restart project</b> 하는 법과 제공사 장애 확인 자리를 알려 준다');
  is(N.inErr, '  서버가 오류로 답할 때 <b>실제로 그 자리에 붙는다</b>');

  console.log('\n[7] 문턱에 시간 제한 없는 기다림이 안 남아 있다');
  const SRC = fs.readFileSync('app/index.html', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const cfg = (SRC.match(/function osCfgLoad\(cb\)\{[\s\S]*?\n\}/) || [''])[0];
  const apr = (SRC.match(/function osCheckApproval\([\s\S]*?\n\}/) || [''])[0];
  is(/osWait\(/.test(cfg), '  <b>설정 읽기</b>에 시간 제한이 걸려 있다');
  is(/osWait\(/.test(apr), '  <b>승인 확인</b>에 시간 제한이 걸려 있다');
  is(/hasOwnProperty\.call\(have,'status'\)/.test(apr),
     '  이미 읽은 줄이 있으면 <b>다시 안 읽는다</b>');
  is(/osCheckApproval\(sb,uid,function\(gate,extra\)\{[\s\S]*?\},prof\);/.test(SRC),
     '  읽어 온 줄을 <b>실제로 넘겨 준다</b>');

  console.log('\n[8-1] 느린 서버에서 포기하기 전에 더 기다린다');
  /* 서비스 제공사가 죽는 대신 <b>느려지는</b> 장애일 때(2026-08-27 부터),
     12초에서 자르면 14초면 왔을 답을 버리고 사람을 못 들어가게 한다. */
  await page.close(); page = await freshPage();
  const H = await page.evaluate(async () => {
    const waits = [];
    /* osWait 이 받은 <b>기다림 길이</b>를 그대로 적어 둔다 */
    const realWait = window.osWait;
    window.osWait = function (p, what, retry, ms) { waits.push({ what: what, ms: ms }); return realWait.apply(this, arguments); };
    const never = () => new Promise(() => {});
    const mk = () => { const a = {};
      ['select', 'eq', 'neq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'is', 'not',
       'or', 'filter', 'match', 'range', 'gt', 'gte', 'lt', 'lte', 'insert', 'update', 'upsert', 'delete']
        .forEach(k => { a[k] = () => a; });
      a.then = () => never(); a.catch = () => never(); return a; };
    const chain = { from: mk, rpc: () => Promise.resolve({ data: null, error: null }),
                    auth: { signOut: () => Promise.resolve({}) } };
    window.osClient = () => chain; OS.sb = chain;
    OS.session = { user: { id: 'u1', email: 'hong@example.com' } };
    OS.profile = null; OS.cfg = {}; OS_PROF_RETRY = 0; OS_DOWN.at = 0;
    const rt = window.toast; let said = ''; window.toast = (m) => { said += ' | ' + m; };
    osLoadProfile();
    /* 12 + 1.8 + 20 + 1.8 + 30 초를 다 기다리지 않는다 — 늘어나는지만 본다 */
    await new Promise(r => setTimeout(r, 15500));
    window.osWait = realWait; window.toast = rt;
    const mine = waits.filter(w => /내 정보 읽기/.test(w.what));
    return { first: mine[0] && mine[0].ms, second: mine[1] && mine[1].ms,
             tries: mine.length, label: (mine[1] && mine[1].what) || '',
             max: OS_PROF_MAX, said: said.replace(/\s+/g, ' ').trim() };
  });
  is(H.tries >= 2, '  한 번 실패해도 <b>또 해 본다</b> — ' + H.tries + '번째까지 갔다');
  is(H.second > H.first,
     '  다시 할 때 <b>더 오래 기다린다</b> — ' + (H.first / 1000) + '초 → ' + (H.second / 1000) + '초');
  is(/2번째/.test(H.label), '  <b>몇 번째인지</b> 띠에 적는다 — 「' + H.label + '」');
  is(H.max >= 3, '  포기하기 전에 <b>' + H.max + '번</b>까지 해 본다');

  /* 그런데 <b>깨끗이 답한 빈손</b>은 다시 물어도 같은 답이다 — 그 자리에서
     세 번 더 부르면 서버만 축낸다(7번). 실제로 이것 때문에 재무 플랜 점검이
     빨간불이 됐다: 서버가 즉시 「줄 없음」 으로 답하는데도 계속 다시 물었다. */
  await page.close(); page = await freshPage();
  const I = await page.evaluate(async () => {
    let reads = 0;
    const mk = (tbl) => { const a = {};
      ['select', 'eq', 'neq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'is', 'not',
       'or', 'filter', 'match', 'range', 'gt', 'gte', 'lt', 'lte', 'insert', 'update', 'upsert', 'delete']
        .forEach(k => { a[k] = () => a; });
      /* 오류 없이 <b>빈손</b> — 「그런 줄이 없다」 는 깨끗한 대답이다 */
      /* profiles <b>만</b> 센다 — 다른 표까지 세면 앱의 딴 일이 섞여 20번이 넘는다 */
      a.then = (res) => { if (tbl === 'profiles') reads++;
        return Promise.resolve({ data: null, error: null }).then(res); };
      a.catch = () => Promise.resolve(); return a; };
    const chain = { from: mk, rpc: () => Promise.resolve({ data: null, error: null }),
                    auth: { signOut: () => Promise.resolve({}) } };
    window.osClient = () => chain; OS.sb = chain;
    OS.session = { user: { id: 'u1', email: 'hong@example.com' } };
    OS.profile = null; OS.cfg = {}; OS_PROF_RETRY = 0; OS_DOWN.at = 0;
    const rt = window.toast; let said = ''; window.toast = (m) => { said += ' | ' + m; };
    osLoadProfile();
    await new Promise(r => setTimeout(r, 9000));   /* 1.8초 간격이면 세 번은 벌써 다 돌았다 */
    window.toast = rt;
    return { reads: reads, said: said.replace(/\s+/g, ' ').trim() };
  });
  is(I.reads <= 4,
     '  <b>깨끗이 「줄 없음」 이라 답하면</b> 그만 부른다 — ' + I.reads + '번 (7번)');
  is(/못 받았습니다/.test(I.said), '  그리고 <b>못 받았다고 말한다</b> — 조용히 넘어가지 않는다');

  /* 지쳤을 때 <b>정말 세 번</b> 하는지 세어 본다. 실제 기다림(12+20+30초)을
     다 기다리면 한 경우에 65초가 걸리므로, 기다림만 짧게 줄이고 <b>몇 번
     하는가</b>를 본다 — 재는 것은 「얼마나 기다리나」 가 아니라 「몇 번 하나」다.
     (길이가 늘어나는 것은 바로 위에서 따로 쟀다.) */
  await page.close(); page = await freshPage();
  const J = await page.evaluate(async () => {
    OS_PROF_WAITS = [300, 300, 300];
    let hung = 0;
    const never = () => new Promise(() => {});
    const mk = (tbl) => { const a = {};
      ['select', 'eq', 'neq', 'order', 'limit', 'single', 'maybeSingle', 'in', 'is', 'not',
       'or', 'filter', 'match', 'range', 'gt', 'gte', 'lt', 'lte', 'insert', 'update', 'upsert', 'delete']
        .forEach(k => { a[k] = () => a; });
      a.then = (res) => { if (tbl === 'profiles') { hung++; return never(); }
        return Promise.resolve({ data: [], error: null }).then(res); };
      a.catch = () => never(); return a; };
    const chain = { from: mk, rpc: () => Promise.resolve({ data: null, error: null }),
                    auth: { signOut: () => Promise.resolve({}) } };
    window.osClient = () => chain; OS.sb = chain;
    OS.session = { user: { id: 'u1', email: 'hong@example.com' } };
    OS.profile = null; OS.cfg = {}; OS_PROF_RETRY = 0; OS_DOWN.at = 0;
    const rt = window.toast; let said = ''; window.toast = (m) => { said += ' | ' + m; };
    osLoadProfile();
    await new Promise(r => setTimeout(r, 8000));   /* 0.3초 × 3 + 1.8초 간격 두 번이면 넉넉하다 */
    window.toast = rt; OS_PROF_WAITS = [12000, 20000, 30000];
    return { tries: hung, said: said.replace(/\s+/g, ' ').trim() };
  });
  is(J.tries >= 3, '  <b>지쳤을 때는 세 번</b> 해 본다 — ' + J.tries + '번 했다');
  /* 처음 한 번 + 되시도 세 번 = <b>네 번</b>. 말과 실제가 같아야 한다 (1번) */
  is(/4번 해 봤습니다/.test(J.said),
     '  그러고 나서 <b>몇 번 했는지 그대로</b> 말한다 — 「' + J.said.slice(0, 44) + '…」');

  console.log('\n[9] 막힌 분이 있으면 사장님 화면에서 먼저 말한다');
  /* 접속 IP 승인제를 켜면 각자 <b>맨 처음 한 곳만</b> 자동 승인되고 그 뒤에
     바뀐 자리는 「대기」 다. 그래서 <b>어떤 분만</b> 갑자기 못 들어온다. */
  await page.close(); page = await freshPage();
  const G = await page.evaluate(async () => {
    const rows = [
      { member_id: 'u1', ip: '1.2.3.4', status: 'approved', last_seen: '2026-08-30T01:00:00Z' },
      { member_id: 'u2', ip: '5.6.7.8', status: 'pending',  last_seen: '2026-08-30T02:00:00Z' },
      { member_id: 'u3', ip: '9.9.9.9', status: 'pending',  last_seen: '2026-08-30T03:00:00Z' }
    ];
    /* 견본 사람은 홍길동 (CLAUDE.md 3번) */
    const nm = { u1: '홍길동', u2: '홍길순', u3: '홍판서' };
    const out = {};
    OS.cfg = { ip_guard: 'on' };
    out.on = osIpWaitHtml(rows.slice(), nm).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    out.onWait = OS_IP_WAIT.length;
    OS.cfg = { ip_guard: 'off' };
    out.off = osIpWaitHtml(rows.slice(), nm).replace(/\s+/g, ' ').trim();
    /* 목록 그림 — 막힌 줄이 맨 위로 오나 */
    const upd = [];
    const mk = () => { const a = {};
      ['select', 'order', 'update', 'eq', 'neq', 'limit', 'in', 'is', 'not', 'or', 'filter',
       'match', 'range', 'gt', 'gte', 'lt', 'lte', 'insert', 'upsert', 'delete', 'single', 'maybeSingle']
        .forEach(k => { a[k] = (...v) => { if (k === 'update') upd.push(v[0]); return a; }; });
      a.then = (res) => Promise.resolve({ data: [], error: null }).then(res); return a; };
    OS.cfg = { ip_guard: 'on' };
    window.osClient = () => ({ from: (t) => {
      const a = mk();
      a.then = (res) => Promise.resolve({ data: t === 'login_ips' ? rows.slice()
        : [{ id: 'u1', name: '홍길동' }, { id: 'u2', name: '홍길순' }, { id: 'u3', name: '홍판서' }], error: null }).then(res);
      return a; } });
    const host = document.createElement('div'); host.id = 'osIpList'; document.body.appendChild(host);
    osIpLoadList();
    await new Promise(r => setTimeout(r, 400));
    /* 함수가 글을 <b>돌려주는 것</b>과 목록에 <b>실제로 붙는 것</b>은 다르다 —
       붙이는 자리를 빼도 안 울렸다. 그려진 것을 본다. */
    out.inList = /못 들어오고 있습니다/.test(host.textContent);
    /* 차례는 <b>표 안에서만</b> 잰다 — 띠에도 이름이 있어 통째로 세면
       정렬을 빼도 통과해 버린다 */
    const tr = host.querySelectorAll('tbody tr');
    out.firstRow = tr.length ? (tr[0].cells[0].textContent || '').trim() : '';
    /* 모두 승인 — 실제로 서버에 보내나 */
    window.osClient = () => ({ from: () => mk() });
    let said = ''; const rt = window.toast; window.toast = (m) => { said += ' | ' + m; };
    osIpApproveAll();
    await new Promise(r => setTimeout(r, 400));
    window.toast = rt; host.remove();
    out.sent = upd.length; out.said = said.replace(/\s+/g, ' ').trim();
    return out;
  });
  is(/2분/.test(G.on) && /홍길순/.test(G.on) && /홍판서/.test(G.on),
     '  <b>몇 분이 못 들어오는지</b> 이름까지 말한다 — 「' + G.on.slice(0, 42) + '…」');
  is(/승인제/.test(G.on) && /휴대폰 데이터/.test(G.on),
     '  <b>왜 막혔는지</b> 말한다 — 자리가 바뀌면 막힌다');
  is(G.onWait === 2 && !G.off,
     '  승인제가 <b>꺼져 있으면 아무 말도 안 한다</b> — 헛알람 금지 (8번)');
  is(G.inList, '  그 말이 <b>목록에 실제로 붙는다</b> — 함수만 만들고 안 붙이면 소용없다');
  is(G.firstRow === '홍길순',
     '  막힌 분이 <b>표 맨 위</b>로 온다 — 지금 맨 위: 「' + G.firstRow + '」');
  is(G.sent === 2 && /2건 승인했습니다/.test(G.said),
     '  「모두 승인」 이 <b>실제로 2건을 보낸다</b> — ' + G.sent + '건 · 「' + G.said.slice(0, 30) + '…」');

  console.log('\n[10] 콘솔이 조용하다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));

  await browser.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '개 — 서버가 흔들리면 로그인이 말없이 멈춥니다')
                  : '✓ 어느 자리가 멈춰도 반드시 말하고, 잠금이 아닌 것으로 사람을 막지 않습니다');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
