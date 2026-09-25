#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   달력에 <b>내가 직접</b> 넣는 일정 — 폰과 같이 보는가

   달력이 여태 <b>앱이 만든 것</b>만 찍었고, 직접 넣은 일정은 <b>이 브라우저</b>
   에만 담겼습니다. 사무실 PC 에서 넣은 것이 폰에서 안 보여서, 결국 폰 달력을
   따로 켜게 됩니다. 두 군데를 보면 한 군데는 반드시 안 보게 됩니다.
   이제 서버(my_plans)에 담아 <b>같은 아이디면 어느 기기에서든</b> 봅니다.

   여기서 못 박는 것은 여덟입니다.

     ① 날짜를 고르면 <b>그 자리에서</b> 적는다 — 다른 화면으로 안 보낸다
     ② 넣으면 <b>기다리지 않고</b> 화면에 서고, <b>서버에도</b> 들어간다
     ③ 서버가 거절하면 <b>도로 뺀다</b> — 실패를 성공처럼 말하지 않는다
     ④ 달력은 <b>한 벌</b>이라 홈에도 그대로 있다 (5번)
     ⑤ <b>서버 자리가 없으면 멈추지 않는다</b> — 이 브라우저로 버티고
        <b>그렇다고 적는다</b> (1번). 자리가 생기면 담겨 있던 것을 올려 보낸다
     ⑥ <b>나만 본다</b> — SQL 정책이 owner_id = auth.uid() 하나로 묶인다
     ⑦ <b>서버를 아껴 부른다</b> (7번) — 화면을 여러 번 열어도 한 번만 읽는다
     ⑧ 빈 줄·엉뚱한 시각·<b>주민번호</b>를 안 받는다

   견본은 <b>홍길동</b> 계열입니다 (3번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8843;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
/* ── my_plans 를 <b>진짜 표처럼</b> 흉내 냅니다 ──────────────────────
   빈 배열만 돌려주는 흉내로는 「넣으면 서버에도 들어가는가」 를 못 잽니다.
   줄을 담아 두고 select 때 돌려줘야 진짜로 오간 것을 볼 수 있습니다. */
const STUB = `
window.__plan={rows:[],sel:0,ins:0,del:0,missing:false};
window.supabase={createClient:function(){
 var q=function(tbl){
  var st={eq:null,lim:0};
  var a={
   select:function(){st.op='select';return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},
   in:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},not:function(){return a},range:function(){return a},
   eq:function(k,v){st.eq=[k,v];return a},
   insert:function(v){st.op='insert';st.val=v;return a},
   update:function(){st.op='update';return a},upsert:function(){st.op='upsert';return a},
   then:function(res,rej){
     var P=window.__plan;
     if(tbl!=='my_plans')return Promise.resolve({data:[],error:null}).then(res,rej);
     if(P.missing)return Promise.resolve({data:null,error:{message:'relation "public.my_plans" does not exist'}}).then(res,rej);
     if(st.op==='select'){P.sel++;return Promise.resolve({data:P.rows.slice(),error:null}).then(res,rej);}
     if(st.op==='insert'){
       P.ins++;
       var L=(st.val&&st.val.push)?st.val:[st.val];
       L.forEach(function(x){P.rows.push({id:'s'+(P.rows.length+1),d:x.d,hm:x.hm||'',t:x.t});});
       return Promise.resolve({data:null,error:null}).then(res,rej);
     }
     if(st.op==='delete'){
       P.del++;
       if(st.eq)P.rows=P.rows.filter(function(x){return String(x[st.eq[0]])!==String(st.eq[1]);});
       return Promise.resolve({data:null,error:null}).then(res,rej);
     }
     return Promise.resolve({data:[],error:null}).then(res,rej);
   }};
  a['delete']=function(){st.op='delete';return a};
  return a};
 return {from:q,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1',email:'u1@example.com'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split('?')[0].split('#')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}
const SEL = '#osLoginGate,#osGuide,[id$="Ovl"],[id$="Pop"]';
const clearOvl = pg => pg.evaluate(sel => {
  const wipe = () => document.querySelectorAll(sel).forEach(x => x.remove());
  wipe();
  if (!window.__ovlWatch) {
    window.__ovlWatch = new MutationObserver(wipe);
    window.__ovlWatch.observe(document.body, { childList: true, subtree: false });
  }
}, SEL);
const open = async (pg) => {
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#mycal', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof mcalMyAdd === 'function' && typeof mcalItems === 'function' &&
                                 typeof go === 'function', { timeout: 60000 });
  await clearOvl(pg);
  await pg.evaluate(() => { OS.profile = { id: 'u1', name: '윤시현', role: 'owner' }; go('mycal'); });
  /* ★ 「900밀리초 기다렸으니 다 읽었겠지」 로 재지 않습니다. 읽기는 서버를
     오가는 일이라 느린 기계에서는 그 사이에 안 끝납니다. 그러면 화면은
     멀쩡한데 점검만 웁니다 (8번). <b>실제로 끝났는지</b>를 기다립니다. */
  await pg.waitForFunction(() => typeof MYP !== 'undefined' && MYP.loaded === true, { timeout: 20000 });
  await pg.evaluate(() => { MCAL.sel = mcalToday(); mcalPaint(); });
  await pg.waitForSelector('.mcal-add', { timeout: 20000 });
  await clearOvl(pg);
};

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.addInitScript(STUB);
  await pg.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });

  /* ─────────────────────────────────────────────────────────── */
  head('[1] 넣는 자리가 <b>한 곳</b>이다 (5번)');
  ['mcalMyAll', 'mcalMyAdd', 'mcalMyDel', 'mcalMyPut', 'mcalMyFormHtml',
   'mcalMyLoad', 'mypWhereTxt', 'mypOn'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  is((SRC.match(/function mcalMyAll\(\)\{[\s\S]{0,200}?mypOn\(\)|MYP\.loaded&&!MYP\.missing/) || []).length > 0,
     '<b>어디에 담기는지</b>를 한 곳(mcalMyAll)만 안다 — 두 곳에서 정하면 화면과 저장이 어긋난다');

  head('[2] <b>나만 본다</b> — 서버 정책 (6번)');
  const sql = (SRC.match(/var OS_PLAN_SQL=\[[\s\S]*?\];/) || [''])[0];
  is(/create table if not exists public\.my_plans/.test(sql), 'my_plans 표를 만든다');
  is(/enable row level security/.test(sql), '<b>행 잠금(RLS)을 켠다</b> — 안 켜면 정책이 있어도 다 보인다');
  ['select', 'insert', 'update', 'delete'].forEach(k =>
    is(new RegExp('my_plans_' + k).test(sql) , '  ' + k + ' 정책이 있다'));
  is((sql.match(/owner_id = auth\.uid\(\)/g) || []).length >= 4,
     '읽기·넣기·고치기·지우기가 <b>모두 본인</b>으로 묶인다');
  is(/owner_id  uuid not null default auth\.uid\(\)/.test(sql),
     'owner_id 를 <b>서버가 채운다</b> — 앱이 보내는 값을 믿으면 남의 이름으로 넣을 수 있다');
  is((SRC.match(/var OS_PLAN_SQL=/g) || []).length === 1 &&
     /concat\(OS_PLAN_SQL\)/.test(SRC), '준비 SQL 에 <b>한 곳</b>에서만 붙는다 (5번)');
  const ver = (SRC.match(/var SETUP_VER=(\d+)/) || [])[1];
  const stamp = (SRC.match(/'schema_version', '(\d+)'/) || [])[1];
  is(ver === stamp, '앱이 기다리는 판 번호와 SQL 이 남기는 번호가 <b>같다</b> — 앱 ' + ver + ' · SQL ' + stamp);

  /* ══ 서버에 자리가 있을 때 ══════════════════════════════════ */
  await open(pg);
  head('[3] 서버에 담기고, <b>그렇다고 말한다</b>');
  const say = await pg.evaluate(() => {
    const d = document.querySelector('.mcal-add');
    return { there: !!d, txt: d ? d.textContent.replace(/\s+/g, ' ') : '', on: mypOn() };
  });
  is(say.there && say.on, '적는 칸이 서고 <b>서버 자리를 찾았다</b>');
  is(/서버에 담깁니다/.test(say.txt) && /폰에서도/.test(say.txt),
     '<b>「폰에서도 그대로 보입니다」</b> 라고 적는다 — 「' + (say.txt.match(/서버에 담깁니다[^.]*\./) || [''])[0] + '」');
  is(/홍○동/.test(say.txt), '고객 이름은 <b>가려 적으라</b>고 그 자리에 말한다 (3번)');

  head('[4] 넣으면 <b>기다리지 않고</b> 서고, 서버에도 들어간다');
  const put = await pg.evaluate(async () => {
    const t = mcalToday();
    MCAL.sel = t; mcalPaint();
    document.getElementById('mcalMyT').value = '지점 회의 — 홍○동 건';
    document.getElementById('mcalMyH').value = '14:00';
    const ins0 = window.__plan.ins;
    mcalMyPut();
    const now = (mcalItems()[t] || []).filter(x => x.k === 'my').length;   /* 곧바로 */
    await new Promise(r => setTimeout(r, 400));
    return { now, ins: window.__plan.ins - ins0, srv: window.__plan.rows.length,
             after: (mcalItems()[t] || []).filter(x => x.k === 'my').length,
             t: window.__plan.rows[0] ? window.__plan.rows[0].t : '',
             hm: window.__plan.rows[0] ? window.__plan.rows[0].hm : '' };
  });
  is(put.now === 1, '<b>누른 그 순간</b> 화면에 선다 — 서버 대답을 안 기다린다');
  is(put.ins === 1 && put.srv === 1, '<b>서버에도 한 줄</b> 들어갔다 — ' + put.srv + '건');
  is(put.t === '지점 회의 — 홍○동 건' && put.hm === '14:00', '적은 그대로 간다 — 「' + put.t + ' ' + put.hm + '」');
  is(put.after === 1, '다시 읽은 뒤에도 <b>한 줄</b>이다 — 두 번 세지 않는다');

  head('[5] 서버가 거절하면 <b>도로 뺀다</b>');
  const fail = await pg.evaluate(async () => {
    const t = mcalToday();
    window.__plan.missing = true;                 /* 넣는 순간만 막는다 */
    const said = []; const rt = window.toast; window.toast = m => said.push(String(m));
    document.getElementById('mcalMyT').value = '들어가면 안 되는 줄';
    mcalMyPut();
    await new Promise(r => setTimeout(r, 400));
    window.__plan.missing = false; window.toast = rt;
    return { n: (mcalItems()[t] || []).filter(x => x.k === 'my').length, said: said.join(' ') };
  });
  is(fail.n === 1, '<b>화면에서 도로 빠진다</b> — 안 들어갔는데 들어간 척하지 않는다 (' + fail.n + '건)');
  is(/넣지 못했습니다/.test(fail.said), '<b>왜 안 됐는지</b> 말한다 — 「' + fail.said.slice(0, 40) + '」');

  head('[6] 달력은 <b>한 벌</b>이다 (5번)');
  /* ⚠ 2026-09-24 · 홈 달력(hmCalHost)은 「달력」 화면으로 옮겼습니다. 그래서
     묻는 말이 뒤집혔습니다 — 예전에는 「홈에도 있나」, 이제는 「홈에 두 벌째가
     안 남았나」 입니다. <b>재는 것은 그대로</b>입니다: 달력을 아는 곳이
     하나인가. 옛 자리가 없어졌다고 이 자리를 지우면, 두 벌이 되는 날 아무도
     못 봅니다 (8번).                                                     */
  const cross = await pg.evaluate(() => {
    go('home');
    return new Promise(r => setTimeout(() => r({
      twin: !!document.getElementById('hmCalHost'),
      n: (mcalItems()[mcalToday()] || []).filter(x => x.k === 'my').length
    }), 900));
  });
  const back = await pg.evaluate(() => {
    go('mycal');
    return new Promise(r => setTimeout(() => {
      const el = document.getElementById('mycalHost');
      r({ host: !!el, seen: ((el || {}).innerText || '').indexOf('지점 회의') >= 0 });
    }, 1200));
  });
  is(!cross.twin, '홈에 <b>두 벌째 달력이 없다</b> — 달력을 아는 곳은 「달력」 하나다');
  is(cross.n === 1, '홈에서 봐도 <b>같은 한 벌</b>이다 — ' + cross.n + '건');
  is(back.host && back.seen,
     '<b>나갔다 돌아와도</b> 넣은 줄이 그대로 있다 — ' + (back.host ? '달력 자리 있음' : '달력 자리 없음'));

  head('[7] 지우면 <b>서버에서도</b> 빠진다');
  const del = await pg.evaluate(async () => {
    const t = mcalToday();
    /* ⚠ 2026-09-25 — 느린 기계(CI)에서는 앞 자리에서 넣은 줄이 <b>아직 안 서
       있을</b> 때가 있습니다. 그때 first.my 를 그냥 읽어 TypeError 로 터졌고,
       <b>화면은 멀쩡한데 빨간불</b>이 켜졌습니다 — 헛것입니다 (8번).
       ★ 줄이 설 때까지 <b>기다렸다가</b> 재고, 끝내 안 서면 <b>터지지 않고</b>
         「안 섰습니다」 라고 적습니다. 기다리는 데에는 반드시 <b>끝이</b>
         있어야 합니다 — 안 그러면 영영 멈춥니다.                          */
    const mine = () => (mcalItems()[t] || []).filter(x => x.k === 'my');
    let first = mine()[0], i = 0;
    while (!first && i++ < 20) { await new Promise(r => setTimeout(r, 100)); first = mine()[0]; }
    if (!first) return { no: true, n: mine().length, srv: window.__plan.rows.length, del: window.__plan.del };
    mcalMyDel(first.my);
    await new Promise(r => setTimeout(r, 400));
    return { n: mine().length, srv: window.__plan.rows.length, del: window.__plan.del };
  });
  is(!del.no && del.n === 0 && del.srv === 0 && del.del === 1,
     '달력에서도 서버에서도 빠진다 — 화면 ' + del.n + ' · 서버 ' + del.srv +
     (del.no ? ' ← 지울 줄이 2초를 기다려도 안 섰습니다' : ''));

  head('[8] <b>서버를 아껴 부른다</b> (7번)');
  const thrift = await pg.evaluate(async () => {
    const s0 = window.__plan.sel;
    go('mycal');   await new Promise(r => setTimeout(r, 350));
    go('home');    await new Promise(r => setTimeout(r, 350));
    go('mycal');   await new Promise(r => setTimeout(r, 350));
    return window.__plan.sel - s0;
  });
  is(thrift === 0, '화면을 세 번 더 열어도 <b>다시 안 읽는다</b> — ' + thrift + '번 (하루에 수십 번 여는 화면이다)');

  head('[9] 빈 줄·엉뚱한 시각·<b>주민번호</b>를 안 받는다');
  const guard = await pg.evaluate(() => {
    const said = []; const rt = window.toast; window.toast = m => said.push(String(m));
    const t = mcalToday();
    const a = mcalMyAdd(t, '', '   ');
    const b = mcalMyAdd(t, '25시', '회의');
    const c = mcalMyAdd('', '', '회의');
    const d = mcalMyAdd(t, '', '홍○동 800101-1234567 확인');
    window.toast = rt;
    return { a, b, c, d, said: said.join(' ') };
  });
  is(!guard.a && /한 줄만/.test(guard.said), '<b>빈 줄은 안 받는다</b>');
  is(!guard.b && /14:00/.test(guard.said), '<b>엉뚱한 시각은 안 받는다</b> — 어떻게 적는지 보여 준다');
  is(!guard.c, '<b>날짜 없이는 안 받는다</b>');
  is(!guard.d && /주민등록번호/.test(guard.said),
     '<b>주민번호는 안 받는다</b> — 서버에 올라가면 안 된다 (10번)');

  /* ══ 서버에 자리가 <b>아직 없을 때</b> ═══════════════════════ */
  head('[10] 자리가 없으면 <b>멈추지 않고 사실대로 말한다</b> (1번)');
  const pg2 = await ctx.newPage();
  pg2.on('pageerror', e => errs.push(String(e.message || e)));
  await pg2.addInitScript(STUB);
  await pg2.addInitScript(() => { try { localStorage.setItem('apex_guide_seen_v2', '1'); } catch (e) {} });
  /* ★ 「자리 없음」 은 <b>앱이 돌기 전에</b> 걸어야 합니다. 첫 화면이 뜨는
     순간 이미 한 번 읽어 버리므로, 뒤늦게 걸면 안 걸립니다. */
  await pg2.addInitScript(() => { window.__plan.missing = true; });
  await open(pg2);
  const off = await pg2.evaluate(async () => {
    const t = mcalToday();
    MCAL.sel = t; mcalPaint();
    const txt = (document.querySelector('.mcal-add') || {}).textContent || '';
    document.getElementById('mcalMyT').value = '자리 없어도 적힙니다';
    mcalMyPut();
    await new Promise(r => setTimeout(r, 300));
    let ls = [];
    try { ls = JSON.parse(localStorage.getItem(mcalMyKey()) || '[]'); } catch (e) {}
    return { on: mypOn(), txt: txt.replace(/\s+/g, ' '),
             n: (mcalItems()[t] || []).filter(x => x.k === 'my').length, ls: ls.length,
             DBG: { host: !!document.getElementById('mycalHost'), tab: (typeof lastTab!=='undefined'?lastTab:'?'),
                    add: !!document.querySelector('.mcal-add'), inp: !!document.getElementById('mcalMyT'),
                    loaded: MYP.loaded, missing: MYP.missing, err: MYP.err } };
  });
  is(!off.on && off.n === 1 && off.ls === 1, '<b>이 브라우저에 담고 화면에 선다</b> — 멈추지 않는다');
  is(/이 브라우저에만/.test(off.txt) && /준비 SQL/.test(off.txt),
     '<b>왜 그런지와 무엇을 하면 되는지</b> 적는다 — 「' + (off.txt.match(/이 브라우저에만[^.]*\./) || [''])[0] + '」');
  is(!/폰에서도 그대로/.test(off.txt), '되지도 않는데 <b>폰에서 보인다고 안 한다</b>');
  /* 자리가 생기면 담겨 있던 것을 <b>올려 보낸다</b> */
  const up = await pg2.evaluate(async () => {
    window.__plan.missing = false;
    MYP.loaded = false; MYP.up = false;
    mcalMyLoad(true);
    for (let i = 0; i < 60 && !(MYP.loaded && !MYP.missing); i++) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 400));
    let ls = [];
    try { ls = JSON.parse(localStorage.getItem(mcalMyKey()) || '[]'); } catch (e) {}
    return { srv: window.__plan.rows.length, ls: ls.length, on: mypOn() };
  });
  is(up.on && up.srv === 1 && up.ls === 0,
     '자리가 생기면 <b>담겨 있던 것을 올려 보내고</b> 브라우저를 비운다 — 서버 ' + up.srv + ' · 남은 것 ' + up.ls);

  head('[11] 폰 달력으로도 <b>같이 나간다</b>');
  const ics = await pg.evaluate(() => {
    mcalMyAdd(mcalToday(), '', '폰에도 나갑니다');
    const evs = mcalTodayEvents();
    return { any: evs.some(e => /폰에도 나갑니다/.test(e.title || '')),
             ics: /폰에도 나갑니다/.test(icsBuild('x', evs)) };
  });
  is(ics.any && ics.ics, '직접 넣은 일정이 <b>폰 달력 글에 실린다</b>');

  head('[12] 이 길을 도는 동안 <b>터진 곳이 없다</b>');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource|ERR_FAILED/i.test(x));
  is(real.length === 0, '콘솔 에러 0건' + (real.length ? ' — ' + real.slice(0, 3).join(' / ') : ''));

  await br.close(); srv.close();
  console.log('\n' + (bad ? '✗ 내 일정 — ' + bad + '/' + n + ' 자리가 막혔습니다'
                          : '✓ 내 일정 — ' + n + '자리 통과'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
