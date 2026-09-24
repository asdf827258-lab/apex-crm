/* ══════════════════════════════════════════════════════════════════
   check-mineonly.js — <b>설계사는 자기 것만 보는가.</b> (매니저는 제외)

   고객 실명이 걸린 자리입니다 (CLAUDE.md 3번). 설계사가 남의 고객을 한 줄
   이라도 보면, 그것은 이미 샌 것입니다.

   ── 지금은 <b>서버가</b> 막고 있습니다 ────────────────────────────
   고객 표의 읽기 규칙이
     advisor_id = auth.uid()  or  is_admin()  or  is_my_teammate(advisor_id)
   인데 is_my_teammate 는 <b>부르는 사람의 역할이 'leader' 일 때만</b> 참입니다.
   그래서 설계사(member)에게는 남의 줄이 <b>애초에 안 옵니다.</b>

   ── 그런데 <b>화면에는 거르는 곳이 없었습니다</b> ──────────────────
   재 보니 그랬습니다 (2026-09-19) —
     홈 「오늘 챙길 것」  안 보임 ✓      TFA 업무관리  안 보임 ✓
     <b>홈 찾기          보임 ✗</b>      <b>고객 365일   보임 ✗</b>
   서버 규칙 한 줄이 느슨해지는 날 이 둘로 <b>조용히</b> 새어 나갑니다.
   그래서 받는 자리 한 곳(osMineOnly)에서 거르게 했습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 설계사가 받으면 <b>남의 줄이 안 담긴다</b> — 받는 자리에서 걸러진다
     [2] 홈 찾기에 남의 이름을 쳐도 <b>안 나온다</b>
     [3] 고객 365일에 <b>안 선다</b>
     [4] 홈 「오늘 챙길 것」·TFA 에도 <b>안 선다</b>
     [5] <b>매니저는 그대로 본다</b> — 안 그러면 이 점검은 「빈 화면」에도 통과한다 (8번)
     [6] <b>모르면 안 거른다</b> (1번) — 프로필을 못 읽었을 때 내 것까지 지우면
         「고객이 없습니다」 라는 더 나쁜 거짓말이 된다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8894;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 홍길동 집안입니다 (3번). <b>내 것</b>과 <b>남의 것</b>을 이름으로 가릅니다. */
const MINE = '홍길순', OTHER = '홍갑돌';

/* 역할을 받아 <b>실제 받는 길</b>을 태웁니다 — OSC.list 에 직접 꽂지 않습니다.
   직접 꽂으면 거르는 자리를 <b>건너뛰어</b>, 고쳐 놓고도 통과합니다 (8번). */
const SEED = (role) => `
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'${role}',active:true,plan:'vip'};
  window.osLoadProfile=function(){}; window.osProfileApply=function(){}; window.osShowLoginGate=function(){};
  window.arLoad=function(){}; window.toast=function(){};
  /* 서버가 <b>둘 다</b> 준 척한다 — 규칙이 느슨해진 날을 흉내 낸다 */
  window.arAll=function(sb,tbl){
    if(tbl!=='clients')return Promise.resolve({data:[],error:null});
    return Promise.resolve({data:[
      {id:'c1',advisor_id:'me',name_masked:'${MINE}',consent_status:'',created_at:'2026-09-01',phone:'010-1111-1111'},
      {id:'c2',advisor_id:'u2',name_masked:'${OTHER}',consent_status:'',created_at:'2026-09-02',phone:'010-2222-2222'}
    ],error:null});
  };
  window.cmLoadAll=function(cb){ if(typeof cb==='function')cb(); };
  /* 흉내 서버는 <b>이름을 하나하나 적지 않는다.</b> 앞서 eq·in 만 적어
     두었다가, TFA 가 .neq 를 쓰기 시작한 날 「neq is not a function」 으로
     터졌습니다 — 앱은 멀쩡한데 <b>점검이 헛것을 잡은 것</b>입니다 (8번).
     받는 이름을 늘릴 때마다 여기가 낡으므로, 사슬은 <b>다 받아</b> 넘기고
     실제로 답하는 곳(then)만 우리가 정합니다. */
  window.osClient=function(){ return { from:function(){ var a={};
      ['select','order','limit','eq','neq','gt','gte','lt','lte','in','is','not','or','filter',
       'like','ilike','contains','overlaps','range','single','maybeSingle','match','returns',
       'abortSignal','csv','explain','upsert','insert','update','delete']
        .forEach(function(k){ a[k]=function(){ return a; }; });
      a.then=function(res){ return Promise.resolve({data:[],error:null}).then(res); };
      return a; },
    rpc:function(){ return Promise.resolve({data:null,error:null}); } }; };
  AR.loaded=true; AR.busy=false; AR.cliRows=[]; AR.db=[];
  OSC.loaded=false; OSC.busy=false; OSC.err=''; OSC.list=[];
  osLoadClients();`;

const look = (page) => page.evaluate(() => ({
  listN: (OSC.list || []).length,
  names: (OSC.list || []).map(c => c.name_masked || ''),
  pane: (document.getElementById('dynPane') || {}).innerText || ''
}));

const run = async (browser, role) => {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await page.evaluate(SEED(role));
  await page.waitForTimeout(800);
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(600);
  const home = await look(page);
  /* <b>결과 줄 수</b>로 셉니다 — 못 찾았을 때의 안내에 「'홍갑돌' 로 찾은 고객이
     없습니다」 처럼 <b>찾던 이름이 그대로</b> 적혀 있어, 글자로 찾으면 안 나온 것을
     나온 것으로 읽습니다. 실제로 그랬습니다 (8번). */
  const find = await page.evaluate(async (args) => {
    const [other, mine] = args;
    if (typeof cusFindSet !== 'function') return { ok: false };
    const rows = () => (document.getElementById('cusFindRows') || {})
      .querySelectorAll ? document.getElementById('cusFindRows').querySelectorAll('[onclick*="cusFindOpen"]').length : -1;
    cusFindSet(other); await new Promise(r => setTimeout(r, 350));
    const nOther = rows(), tOther = ((document.getElementById('cusFindRows') || {}).innerText) || '';
    cusFindSet(mine);  await new Promise(r => setTimeout(r, 350));
    const nMine = rows();
    cusFindSet('');
    return { ok: true, nOther: nOther, nMine: nMine, tOther: tOther };
  }, [OTHER, MINE]);
  await page.evaluate(() => go('clients'));
  await page.waitForTimeout(900);
  const cli = await look(page);
  await page.evaluate(() => go('airep'));
  await page.waitForTimeout(1000);
  const air = await look(page);
  await ctx.close();
  return { home, find, cli, air, errs };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();

  const M = await run(browser, 'member');
  console.log('\n[1] 설계사가 받으면 <b>남의 줄이 안 담긴다</b>');
  is(M.home.names.indexOf(MINE) >= 0, '  내 고객은 <b>그대로 담긴다</b> — ' + JSON.stringify(M.home.names));
  is(M.home.names.indexOf(OTHER) < 0, '  남의 고객은 <b>안 담긴다</b> — 받는 자리에서 걸러졌다');
  is(M.home.listN === 1, '  담긴 것이 <b>한 줄</b>이다 — ' + M.home.listN + '줄');

  console.log('\n[2] 홈 찾기에 남의 이름을 쳐도 <b>안 나온다</b>');
  is(M.find.ok && M.find.nOther === 0,
     '  「' + OTHER + '」 를 쳐도 <b>한 줄도 안 나온다</b> — ' + M.find.nOther + '줄');
  is(M.find.ok && M.find.nMine === 1,
     '  <b>내 고객은 찾힌다</b> — ' + M.find.nMine + '줄 (찾기가 죽어서 통과한 것이 아니다)');

  console.log('\n[3] 고객 365일에 <b>안 선다</b>');
  is(M.cli.pane.indexOf(OTHER) < 0, '  목록에 <b>안 보인다</b>');
  is(M.cli.pane.indexOf(MINE) >= 0, '  <b>내 고객은 보인다</b> — 빈 화면이라서 통과한 것이 아니다');

  console.log('\n[4] 홈 · TFA 에도 <b>안 선다</b>');
  is(M.home.pane.indexOf(OTHER) < 0, '  홈에 <b>안 보인다</b>');
  is(M.air.pane.indexOf(OTHER) < 0, '  TFA 업무관리에 <b>안 보인다</b>');

  /* ── 매니저는 그대로 본다 ── */
  const L = await run(browser, 'leader');
  console.log('\n[5] <b>매니저는 그대로 본다</b> — 이 점검이 빈 화면에 속지 않는다 (8번)');
  is(L.home.names.indexOf(OTHER) >= 0,
     '  팀장에게는 <b>담긴다</b> — ' + JSON.stringify(L.home.names) +
     (L.home.names.indexOf(OTHER) < 0 ? '  ← 매니저까지 걸러 버렸다' : ''));
  is(L.home.listN === 2, '  <b>두 줄</b>이 다 담긴다 — ' + L.home.listN + '줄');
  is(L.find.ok && L.find.nOther === 1,
     '  팀장이 홈 찾기로 <b>팀원 고객을 찾는다</b> — ' + L.find.nOther + '줄' +
     '  (고객 365일 목록은 원래 「내 고객부터」 보여 주므로 그것으로 재지 않는다)');

  /* ── 모르면 안 거른다 ── */
  console.log('\n[6] <b>모르면 안 거른다</b> (1번)');
  const U = await page0(browser);
  is(U.n === 2, '  역할을 <b>모를 때</b>는 그대로 둔다 — ' + U.n + '줄 ' +
     '(거르면 내 고객까지 사라져 「고객이 없습니다」 가 된다)');

  console.log('\n[7] 조용히 터지지 않았나');
  const errs = M.errs.concat(L.errs);
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));

  await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '자리' : '✓ 설계사는 자기 것만 — 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });

/* 역할을 모를 때 — <b>프로필이 아직 안 온 자리</b>를 그대로 흉내 낸다 */
async function page0(browser) {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const n = await page.evaluate((args) => {
    const [MINE, OTHER] = args;
    const rows = [
      { id: 'c1', advisor_id: 'me', name_masked: MINE },
      { id: 'c2', advisor_id: 'u2', name_masked: OTHER }];
    OS.profile = null;                       /* 아직 못 읽었다 */
    const a = osMineOnly(rows).length;
    OS.profile = { id: 'me', name: '홍길동', role: '' };   /* 역할이 비었다 */
    const b = osMineOnly(rows).length;
    return Math.min(a, b);
  }, [MINE, OTHER]);
  await ctx.close();
  return { n };
}
