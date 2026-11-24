/* 📈 90일 아카데미가 기록으로 도는가 (판 X552)

   사장님 말씀 2026-11-24 「팀원들 스스로가 체크를 안하거든」 → 「메인세션 90일
   로드맵과 연결해서」 → 「응, 1단계부터」.

   app/apex-ac90auto.js 가 index.html 의 90일 아카데미에서 두 가지를 기록으로
   바꿨습니다. 그것이 정말 그런지 봅니다 —
     [1] 시작일을 안 넣어도 <b>팀에 들어온 날</b>로 DAY·주차가 선다
     [2] 직접 고친 날이 이기고, 지우면 팀 날로 돌아간다
     [3] 팀 기록이 없으면 <b>짐작하지 않는다</b> (1번)
     [4] 주간 퍼널은 손 입력 칸이 없고, CRM 통화·계약 기록에서 맞게 센다
         (남의 통화·기간 밖 통화는 안 센다, 같은 분을 여러 번 걸어도 한 분)
     [5] 통화를 다 못 읽은 주는 <b>모른다고</b> 적는다
     [6] 계약일 칸이 없는 서버는 계약을 0 이 아니라 — 로 적는다          */
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
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_ac90_v2'); } catch(e){}
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
   'osCliInfoLoad','osRepListLoad','acCrmLoad'].forEach(n => { window[n] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded=true; if(cb)cb(); };
  window.setupDone = function(){return true;}; window.setupCanRun = function(){return true;};
  window.osTabAllowed = function(){return true;}; window.toast = function(){};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.list=[]; CM.loaded=true; CM.meta={};
  /* 서버 대신 — team_members 만 window.__tm 을 돌려주고 나머지는 빈 답 */
  window.__tm = [];
  window.osClient = function(){
    return { from(t){
      const p = new Proxy(function(){}, { get(o, k){
        if (k === 'then') return (ok, no) => Promise.resolve({ data: t === 'team_members' ? window.__tm : [], error: null }).then(ok, no);
        return () => p; } });
      return p; }, auth: { getSession(){ return Promise.resolve({ data: {} }); } } };
  };
  window.__ymd = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  window.__ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return window.__ymd(d); };
  /* 다시 처음부터 — 팀 날을 다시 찾게 */
  window.RESET = (tm) => {
    localStorage.removeItem('apex_ac90_v2');
    AC9.join=''; AC9.tried=false; AC9.busy=false; AC9.none=false; AC9.retry=0;
    window.__tm = tm;
  };
  try{ osHideLoginGate(); }catch(e){}
};


(async () => {
  console.log('📈 90일 아카데미 — 팀원이 안 넣어도 기록으로 (판 X552)');
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
    /* 서른두 날 전에 팀에 들어왔다 → DAY 33 · 5주차 */
    const d = new Date(); d.setDate(d.getDate() - 32); d.setHours(10, 0, 0, 0);
    RESET([{ joined_at: d.toISOString() }]);
    go('academy'); AC.view = 'dash';
    await new Promise(r => setTimeout(r, 300));
    const b = document.getElementById('acadBody');
    return { start: acStart(), src: acStartSrc(), want: __ago(32), info: acDayInfo(),
             txt: b ? b.innerText : '' };
  });
  is(A.start === A.want, '시작일 = 팀에 들어온 날 (' + A.start + ' / 기대 ' + A.want + ')');
  is(A.src === 'team', '어디서 왔는지 = team');
  is(A.info.set && A.info.day === 33 && A.info.week === 5, 'DAY 33 · 5주차로 센다 (' + A.info.day + ' · ' + A.info.week + ')');
  is(/팀에 들어온 날/.test(A.txt) && /따로 넣을 것은 없어요/.test(A.txt), '대시보드가 「팀에 들어온 날로 자동」 이라고 말한다');

  sec('[2] 직접 고친 날이 이기고, 지우면 팀 날로 돌아간다');
  const B = await pg.evaluate(async () => {
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
    go('academy'); AC.view = 'dash'; acGo('dash');
    await new Promise(r => setTimeout(r, 300));
    return { start: acStart(), info: acDayInfo(), txt: document.getElementById('acadBody').innerText };
  });
  is(C.start === '' && !C.info.set, '시작일 없음 — 오늘이나 아무 날로 메우지 않는다');
  is(/시작일을 정하지 못했어요/.test(C.txt), '「정하지 못했어요」 라고 말한다');

  sec('[4] 주간 퍼널 — 손 입력 칸 없이 CRM 기록에서 맞게 센다');
  const D = await pg.evaluate(async () => {
    const d = new Date(); d.setDate(d.getDate() - 32); d.setHours(10, 0, 0, 0);
    RESET([{ joined_at: d.toISOString() }]);
    go('academy');
    await new Promise(r => setTimeout(r, 300));
    const t = __ago(0), y = __ago(1), old = __ago(12);
    AR.loaded = true; AR.busy = ''; AR.err = ''; AR.callsCut = false; AR.noStage = false;
    AR.calls = [
      { w:'me', d:t, h:10, r:'부재', b:'db1' },
      { w:'me', d:t, h:11, r:'상담', b:'db1' },   /* 같은 분 두 번 → 한 분 */
      { w:'me', d:y, h:14, r:'거절', b:'db2' },
      { w:'me', d:y, h:15, r:'부재', b:'db3' },
      { w:'me', d:old, h:9, r:'상담', b:'db9' },  /* 기간 밖 */
      { w:'you', d:t, h:9, r:'상담', b:'db7' }    /* 남의 통화 */
    ];
    AR.db = [
      { id:'db1', who:'me', cAt:t, pAt:'' },
      { id:'db2', who:'me', cAt:'', pAt:y },
      { id:'db9', who:'me', cAt:old, pAt:'' },    /* 기간 밖 계약 */
      { id:'db7', who:'you', cAt:t, pAt:t }       /* 남의 계약 */
    ];
    acGo('run');
    const b = document.getElementById('acadBody');
    const W = ac9Win(acDayInfo().week), F = ac9Fun(W.from, W.to);
    return { F, num: b.querySelectorAll('input[type=number]').length, txt: b.innerText,
             wk: acDayInfo().week, rows: b.querySelectorAll('table tbody tr').length };
  });
  is(D.num === 0, '숫자 넣는 칸이 하나도 없다 (예전엔 넷)');
  is(D.F.td === 3, 'TD 전화 건 분 = 3 (같은 분 두 번은 한 분 · 남의 것·기간 밖 제외) — ' + D.F.td);
  is(D.F.ta === 2, 'TA 통화된 분 = 2 (부재만 받은 분 제외) — ' + D.F.ta);
  is(D.F.ap === 1, 'AP 상담 약속 = 1 — ' + D.F.ap);
  is(D.F.pc === 1, 'PC 계약 = 1 (남의 계약·기간 밖 계약 제외) — ' + D.F.pc);
  is(D.F.rl === 1, 'RL 증권전달 = 1 — ' + D.F.rl);
  is(/자동으로/.test(D.txt) && /따로 적을 것은 없어요/.test(D.txt), '화면이 「CRM 기록에서 자동 · 적을 것 없음」 이라고 말한다');
  is(/TD → TA/.test(D.txt) && /병목/.test(D.txt), '병목을 짚는다');
  is(D.rows === D.wk, '주차별 표가 1주차부터 지금 주(' + D.wk + ')까지 선다 — ' + D.rows + '줄');

  sec('[5] 통화를 다 못 읽은 주는 <b>모른다고</b> 적는다 (1번)');
  const E = await pg.evaluate(() => {
    AR.callsCut = true;
    AR.calls = AR.calls.filter(c => c.d === __ago(0));   /* 읽은 것 중 제일 옛날 = 오늘 */
    acGo('run');
    const txt = document.getElementById('acadBody').innerText;
    AR.callsCut = false;
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
  is(/로그인하면/.test(H) && !/TD → TA/.test(H), '로그인 안내만 서고 퍼널은 안 그린다');

  is(errs.length === 0, '페이지 오류 없음' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  await br.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개 어긋남' : '\n✓ 모두 맞음');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
