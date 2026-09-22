/* DB · 업적관리 — <b>고객 이름 옆 예상업적</b> · 월간목표와 고객명당목표를
   가르기 · 팀별 접기와 전체 한눈에.

   사장님 말씀 (2026-09-21) —
     「DB업적관리는 <b>고객 이름 옆에 [예상업적] 을 표기</b>해서 꾸준히
      터치하도록 남겨줘. <b>[월간목표] [고객명당목표]를 따로 관리</b>하기
      위함이야. <b>정확히 분리해</b>」
     「팀원관리에서 목표 이건 DB업적관리에 넣어버리고, <b>팀 별로 따로
      보고, 전체적으로 따로 볼 수 있도록</b> 하고, <b>접어두기 칸</b>을
      만들어서 한번에 관리하자」

   이 화면은 edu-pipeline.html 한 장이고 서버(supabase-js)에 바로 붙습니다.
   그래서 <b>진짜로 띄우고</b> 서버만 견본으로 갈아 끼웁니다. 견본 고객
   이름은 언제나 「홍길동」입니다 (3번).

   못 박는 것 —
     ① 이름 밑에 예상업적이 선다. <b>안 적은 것을 0 으로 적지 않는다</b> (1번)
     ② 오른쪽 예상업적 칸과 <b>같은 값</b>을 말한다. 고치면 같이 바뀐다 (5번)
     ③ 적는 것은 <b>월간목표·목표 건수 둘</b>. 고객명당목표는 나오는 값이라
        <b>적는 칸이 없다</b> — 셋을 다 적게 하면 서로 안 맞는 날이 온다 (5번)
     ④ 건수를 안 적으면 <b>고객명당목표를 안 적는다</b> (1번)
     ⑤ 건수를 담을 때 <b>금액도 같이</b> 보낸다 — 새 줄이 생기며 목표가
        0 으로 깔리면 적어 두신 목표가 사라진다
     ⑥ 담기는 자리는 monthly_perf.goal_case — 「내 업적 · 월간보고」가 쓰는
        그 줄이다. 새 표를 만들지 않는다 (5번)
     ⑦ 팀을 접으면 <b>줄은 남고 안만</b> 접힌다. 접은 것을 기억한다
     ⑧ 전체 표가 아래 판과 <b>같은 셈</b>을 말한다 (5번)
     ⑨ 목표를 안 적은 팀은 <b>달성률을 안 적는다</b> (1번)                */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const PAGE = '/edu-pipeline.html';

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

/* ── 견본 서버 ──────────────────────────────────────────────────────
   팀 둘 · 팀원 셋 · 배정 DB 여섯.
     t1 세빈TEAM  — m1(목표 500만·10건) · m2(목표 300만·건수 없음)
     t2 상빈TEAM  — m3(목표 없음)
   m1 에게 예상업적을 적은 줄과 <b>안 적은 줄</b>을 같이 둡니다 — 「안 적음」을
   0 으로 적지 않는지 보려면 둘 다 있어야 합니다.                        */
const STUB = `(function(){
function D(id,mid,name,st,ex,cont){
  return {id:id,assigned_to:mid,assigned_date:'2026-09-01',source:'일반',region:'순천',
    customer_name:name,next_appt:null,stage:st,memo:'',
    expect_premium:ex,contract_premium:cont||null,family_intro:'미요청',intro_count:null,
    closed_reason:null,contracted_at:(st==='계약완료'||st==='증권전달')?'2026-09-10T00:00:00Z':null};
}
var T={
 profiles:[{id:'m1',name:'홍길동',role:'admin',active:true,team_id:null,workspace:'apex'},
           {id:'m2',name:'홍길순',role:'member',active:true,team_id:null,workspace:'apex'},
           {id:'m3',name:'홍길중',role:'member',active:true,team_id:null,workspace:'apex'}],
 teams:[{id:'t1',name:'세빈TEAM',leader_id:'m1'},{id:'t2',name:'상빈TEAM',leader_id:'m3'}],
 team_members:[{team_id:'t1',member_id:'m1'},{team_id:'t1',member_id:'m2'},{team_id:'t2',member_id:'m3'}],
 org_members:[],
 dbs:[D('d1','m1','홍길동',  'AP', 300000),
      D('d2','m1','홍길동2', 'PC', null),      /* 예상업적을 안 적은 줄 */
      D('d3','m1','홍길동3', 'PC', 800000),
      D('d4','m1','홍길동4', '계약완료', 400000, 450000),
      D('d5','m2','홍길동5', 'AP', 200000),
      D('d6','m3','홍길동6', 'TA', null)],
 monthly_perf:[{owner_id:'m1',period:'2026-09',goal_prem:500,goal_case:10},
               {owner_id:'m2',period:'2026-09',goal_prem:300,goal_case:null}]
};
window.__CALLS__=[];   /* 무엇을 몇 번 불렀나 — 7번을 재는 자리 */
window.__WROTE__=[];   /* 무엇을 담았나 */
function B(tbl){
  var rows=(T[tbl]||[]).slice(), one=false, op='', pay=null;
  var b={};
  b.select=function(){ window.__CALLS__.push('select:'+tbl); return b };
  ['eq','neq','in','gte','lte','gt','lt','is','order','limit','range']
    .forEach(function(k){ b[k]=function(f,v){
      if(k==='eq'&&f&&rows.length&&f in rows[0])rows=rows.filter(function(r){return r[f]===v});
      return b } });
  b.single=b.maybeSingle=function(){ one=true; return b };
  ['insert','update','upsert','delete'].forEach(function(k){ b[k]=function(p){ op=k;pay=p;return b } });
  b.then=function(res,rej){
    if((op==='upsert'||op==='insert')&&pay&&!Array.isArray(pay)){
      window.__WROTE__.push({tbl:tbl,op:op,pay:JSON.parse(JSON.stringify(pay))});
      var all=T[tbl]||(T[tbl]=[]),hit=null;
      all.forEach(function(r){ if(r.owner_id===pay.owner_id&&r.period===pay.period)hit=r });
      if(hit){ for(var k in pay)hit[k]=pay[k] } else all.push(pay);
    }
    return Promise.resolve({data:one?(rows[0]||null):rows,error:null}).then(res,rej) };
  b.catch=function(f){ return b.then(function(x){return x},f) };
  return b;
}
var U={id:'m1',email:'hong@example.com'}, S={user:U,access_token:'stub'};
window.supabase={createClient:function(){ return {
  from:function(t){ return B(t) },
  rpc:function(name,args){
    window.__CALLS__.push('rpc:'+name);
    if(name==='pipeline_goals')
      return Promise.resolve({data:(T.monthly_perf||[])
        .filter(function(m){return m.period===(args&&args.p_period)})
        .map(function(m){return {owner_id:m.owner_id,goal_prem:m.goal_prem}}),error:null});
    if(name==='pipeline_goal_set'){
      window.__WROTE__.push({tbl:'rpc',op:'goal_set',pay:args});
      var hit=null;(T.monthly_perf||[]).forEach(function(m){
        if(m.owner_id===args.p_owner&&m.period===args.p_period)hit=m });
      if(hit)hit.goal_prem=args.p_goal; else T.monthly_perf.push(
        {owner_id:args.p_owner,period:args.p_period,goal_prem:args.p_goal,goal_case:null});
      return Promise.resolve({data:null,error:null});
    }
    return Promise.resolve({data:null,error:null});
  },
  auth:{ getSession:function(){ return Promise.resolve({data:{session:S},error:null}) },
    onAuthStateChange:function(){ return {data:{subscription:{unsubscribe:function(){}}}} } }
}}};
})();`;

(async () => {
  const srv = http.createServer((q, s) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    fs.readFile(f, (e, b) => {
      if (e) { s.writeHead(404); s.end(''); }
      else { s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(b); }
    });
  });
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch();
  const ctx = await br.newContext(), pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.route('**/*', async r => {
    const u = r.request().url();
    if (/supabase-js@2/.test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB });
    if (/pretendard/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
    if (u.startsWith('http://localhost:' + P)) return r.continue();
    if (/^https?:/.test(u)) return r.fulfill({ status: 204, body: '' });
    return r.continue();
  });
  await pg.goto('http://localhost:' + P + PAGE, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => document.querySelector('#app') &&
    document.querySelector('#app').style.display !== 'none', null, { timeout: 15000 });
  /* 이 화면은 그 달(FILTER.month)로 목표를 봅니다 — 견본이 2026-09 이므로 맞춰 둡니다 */
  await pg.evaluate(async () => { FILTER.month = '2026-09'; FILTER.stage = ''; await loadGoals(); renderBoard(); });
  await pg.waitForTimeout(300);

  head('[1] 고객 이름 <b>밑</b>에 예상업적이 선다 (사장님 말씀)');
  const pex = await pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('#board tr.r').forEach(tr => {
      const nm = tr.querySelector('[data-f="client"]'), px = tr.querySelector('.pex'),
        ex = tr.querySelector('[data-f="expect"]');
      out.push({ name: nm ? nm.value : '', pex: px ? px.textContent.trim() : null,
        col: ex ? ex.value : '', id: tr.dataset.id });
    });
    return out;
  });
  is(pex.length > 0 && pex.every(x => x.pex !== null),
    '줄마다 이름 밑에 한 줄이 붙는다 — ' + pex.length + '줄');
  const none = pex.filter(x => !x.col)[0];
  /* ★ <b>글자가 아니라 뜻을 재다.</b> 안 적은 것을 <b>0 으로 적지
     않는다</b>는 것이 지킬 일입니다 (1번). 그러면서 사장님 말씀대로
     <b>그 자리에서 바로 넣는 길</b>이 있어야 합니다 (2026-09-22).    */
  is(!!none && !/(^|[^\d])0([^\d]|$)/.test(none.pex),
    '<b>안 적으신 것을 0 으로 적지 않는다</b> (1번) — ' + (none ? none.pex : '(없음)'));
  is(!!none && /예상업적 넣기/.test(none.pex),
    '  <b>그 자리에서 바로 넣는 길</b>이 있다 — 표의 예상 칸은 열세째라 폰에서 안 보인다');
  const some = pex.filter(x => x.col && !/계약/.test(x.pex))[0];
  is(!!some && /만/.test(some.pex),
    '적으신 것은 <b>만원으로 접어</b> 적는다 — ' + (some ? some.pex : '(없음)'));
  is(pex.every(x => !x.name || /홍길동/.test(x.name)), '견본 이름은 <b>홍길동</b>이다 (3번)');

  head('[2] 오른쪽 칸과 <b>같은 값</b>을 말한다 — 고치면 같이 바뀐다 (5번)');
  const sync = await pg.evaluate(async () => {
    const tr = [...document.querySelectorAll('#board tr.r')]
      .find(x => x.querySelector('[data-f="expect"]').value);
    const ex = tr.querySelector('[data-f="expect"]');
    const before = tr.querySelector('.pex').textContent.trim();
    ex.value = '1,000,000';
    ex.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    return { before, after: tr.querySelector('.pex').textContent.trim() };
  });
  is(sync.before !== sync.after && /100만/.test(sync.after),
    '예상업적을 고치면 <b>이름 밑 글도 같이</b> 바뀐다 — ' + sync.before + ' → ' + sync.after);

  head('[2-2] ✍️ <b>그 자리에서 바로 넣어진다</b> (사장님 말씀 · 2026-09-22)');
  /* 「DB업적관리에서 <b>고객별로 예상 업적 바로 입력</b>할 수 있도록 해.
     <b>예상업적 안 적음 칸에 입력</b>하도록 해 줘」
     눌러 보고, 쳐 보고, <b>표의 예상 칸까지 따라 바뀌는지</b> 봅니다.   */
  const add1 = await pg.evaluate(async () => {
    const tr = [...document.querySelectorAll('#board tr.r')]
      .find(x => !x.querySelector('[data-f="expect"]').value);
    if (!tr) return { skip: true };
    const b = tr.querySelector('[data-pexadd]');
    if (!b) return { noBtn: true };
    b.click();
    await new Promise(r => setTimeout(r, 60));
    const inp = tr.querySelector('[data-pexv]');
    if (!inp) return { noInput: true };
    inp.value = '50';
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise(r => setTimeout(r, 140));
    /* ★ <b>판을 다시 세워 본다.</b> 화면만 고쳐 놓고 줄에는 안 담았으면
       여기서 값이 사라진다 — 밖에서 잴 수 있는 방법이 이것이다.
       (window.ROWS 로 재려 했는데 밖에서 안 보인다. 안 보이는 것을
        재는 척하면 그 줄은 <b>언제나 참</b>이 된다 · 8번)           */
    const id = tr.dataset.id;
    const pex = tr.querySelector('.pex').textContent.trim();
    const col = tr.querySelector('[data-f="expect"]').value;
    renderBoard();
    await new Promise(r => setTimeout(r, 80));
    const again = document.querySelector(`tr[data-id="${id}"] [data-f="expect"]`);
    return { pex, col, kept: again ? again.value : '' };
  });
  is(!add1.skip && !add1.noBtn, '「✍️ 예상업적 넣기」 를 <b>누를 수 있다</b>');
  is(!add1.noInput, '  누르면 <b>그 자리에 칸이 열린다</b> — 다른 화면으로 안 보낸다');
  is(/50만/.test(add1.pex || ''),
     '  <b>「50」 이라고 치면 50만원</b>이 된다 — ' + (add1.pex || '(안 바뀜)'));
  is((add1.col || '').replace(/[^\d]/g, '') === '500000',
     '  <b>표의 예상 칸도 같이</b> 바뀐다 (5번) — ' + (add1.col || '(빔)'));
  is((add1.kept || '').replace(/[^\d]/g, '') === '500000',
     '  <b>판을 다시 세워도 남는다</b> — 화면만 고치고 줄에는 안 담으면 여기서 사라진다 · ' +
     (add1.kept || '(사라짐)'));
  /* ★ <b>안 치고 나가면 0 으로 안 적는다</b> — 안 적은 것이지 0 이 아니다 (1번) */
  const add0 = await pg.evaluate(async () => {
    const tr = [...document.querySelectorAll('#board tr.r')]
      .find(x => !x.querySelector('[data-f="expect"]').value);
    if (!tr) return { skip: true };
    tr.querySelector('[data-pexadd]').click();
    await new Promise(r => setTimeout(r, 60));
    const inp = tr.querySelector('[data-pexv]');
    inp.value = '';
    inp.dispatchEvent(new Event('focusout', { bubbles: true }));
    await new Promise(r => setTimeout(r, 140));
    return { pex: tr.querySelector('.pex').textContent.trim(),
             col: tr.querySelector('[data-f="expect"]').value };
  });
  is(!add0.skip && !/0/.test(add0.col || '') && /넣기/.test(add0.pex || ''),
     '  <b>안 치고 나가면 0 으로 안 적는다</b> — 넣기 단추로 돌아온다 (1번)');

  head('[3] <b>월간목표 · 목표 건수 · 고객명당목표</b> — 정확히 분리 (사장님 말씀)');
  const g = await pg.evaluate(() => {
    const mb = [...document.querySelectorAll('#board tr.mb')];
    const one = mb[0];
    return {
      n: mb.length,
      txt: one ? one.textContent.replace(/\s+/g, ' ').trim() : '',
      goalIn: !!one.querySelector('[data-goal]'),
      caseIn: !!one.querySelector('[data-case]'),
      perIn: !!one.querySelector('[data-per] input'),
      per: (one.querySelector('[data-per]') || {}).textContent || ''
    };
  });
  is(g.goalIn && g.caseIn, '<b>적는 칸은 둘</b> — 월간목표(금액) · 목표 건수(건)');
  is(!g.perIn, '<b>고객명당목표는 적는 칸이 아니다</b> — 나오는 값이다 (셋을 다 적게 하면 어긋난다 · 5번)');
  is(/월간목표/.test(g.txt) && /목표 건수/.test(g.txt) && /고객명당목표/.test(g.txt),
    '셋이 <b>이름을 달고</b> 나란히 선다 — ' + g.txt.slice(0, 70));
  /* m1: 500만 ÷ 10건 = 50만원 */
  const per1 = await pg.evaluate(() => (document.querySelector('[data-per="m1"]') || {}).textContent || '');
  is(/500,000원/.test(per1), '월간목표 ÷ 목표 건수 로 <b>실제로 나온다</b> — ' + per1.replace(/\s+/g, ' ').trim());
  /* m2: 건수가 없다 */
  const per2 = await pg.evaluate(() => (document.querySelector('[data-per="m2"]') || {}).textContent || '');
  is(/적으시면/.test(per2) && !/0원/.test(per2),
    '건수를 안 적으면 <b>고객명당목표를 안 적는다</b> (1번) — ' + per2.replace(/\s+/g, ' ').trim());

  head('[4] 이름 밑 글은 <b>있는 목표하고만</b> 견준다 (1번)');
  const cmp = await pg.evaluate(() => {
    const row = id => [...document.querySelectorAll('#board tr.r')].find(x => x.dataset.id === id);
    return { m1: (row('d3').querySelector('.pex') || {}).textContent || '',   /* 80만 vs 50만 */
             m2: (row('d5').querySelector('.pex') || {}).textContent || '' }; /* 목표가 없다 */
  });
  is(/\+30만/.test(cmp.m1), '고객명당목표가 있으면 <b>모자라거나 넘는 만큼</b>을 적는다 — ' + cmp.m1.trim());
  is(!/[+−]/.test(cmp.m2), '목표가 없으면 <b>모자란다는 말을 안 한다</b> — ' + cmp.m2.trim());

  head('[5] 목표 건수를 담을 때 <b>금액도 같이</b> 보낸다');
  const wrote = await pg.evaluate(async () => {
    window.__WROTE__.length = 0;
    const el = document.querySelector('[data-case="m3"]');   /* 아직 줄이 없는 사람 */
    el.value = '4';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 1100));
    return window.__WROTE__.slice();
  });
  const w = wrote.filter(x => x.tbl === 'monthly_perf')[0];
  is(!!w, '목표 건수를 <b>서버에 담는다</b>');
  is(!!w && w.pay && w.pay.goal_case === 4, '  담긴 것이 <b>goal_case</b> 다 — 「내 업적·월간보고」가 쓰는 그 칸 (5번)');
  is(!!w && w.pay && 'goal_prem' in w.pay,
    '  <b>금액도 같이</b> 보낸다 — 새 줄이 생기며 목표가 0 으로 깔리지 않는다');
  is(!!w && w.tbl === 'monthly_perf', '  새 표를 만들지 않는다 — monthly_perf 그대로 (5번)');

  head('[6] 팀을 접으면 <b>줄은 남고 안만</b> 접힌다');
  const fold = await pg.evaluate(() => {
    const cnt = () => ({ tm: document.querySelectorAll('#board tr.tm').length,
      r: document.querySelectorAll('#board tr.r').length,
      mb: document.querySelectorAll('#board tr.mb').length });
    const before = cnt();
    document.querySelector('#board [data-tfold="t1"]').click();
    const after = cnt();
    const txt = (document.querySelector('#board tr.tm') || {}).textContent || '';
    return { before, after, txt: txt.replace(/\s+/g, ' ').trim(), shut: !!document.querySelector('#board tr.tm.shut') };
  });
  is(fold.after.tm === fold.before.tm, '접어도 <b>팀 줄은 그대로</b> 남는다 — ' + fold.after.tm + '줄');
  is(fold.after.r < fold.before.r && fold.after.mb < fold.before.mb,
    '안은 접힌다 — 줄 ' + fold.before.r + ' → ' + fold.after.r);
  is(fold.shut, '접힌 표가 붙는다 (tr.tm.shut)');
  is(/목표|건|명/.test(fold.txt), '접은 채로도 <b>그 팀 숫자가 보인다</b> — ' + fold.txt.slice(0, 60));
  const kept = await pg.evaluate(() => { renderBoard(); return !!document.querySelector('#board tr.tm.shut'); });
  is(kept, '다시 그려도 <b>접은 채로</b> 있다 — 기억한다');

  head('[7] <b>전체 팀 한눈에</b> — 팀별 한 줄 · 전체 한 줄');
  const all = await pg.evaluate(() => ({
    rows: document.querySelectorAll('#allteams tbody tr[data-goteam]').length,
    sum: !!document.querySelector('#allteams tr.sum'),
    teams: (typeof TEAMS !== 'undefined') ? TEAMS.filter(t => memsOf(t.id).length).length : -1,
    txt: (document.querySelector('#allteams tr.sum') || {}).textContent || '',
    t2: (document.querySelector('[data-goteam="t2"]') || {}).textContent || ''
  }));
  is(all.rows === all.teams && all.rows > 0, '팀마다 한 줄 — ' + all.rows + ' / ' + all.teams + '팀');
  is(all.sum && /전체/.test(all.txt), '<b>전체</b> 한 줄이 맨 아래 선다');
  is(/목표 안 적음/.test(all.t2), '목표를 안 적은 팀은 <b>달성률을 안 적는다</b> (1번) — ' + all.t2.replace(/\s+/g, ' ').trim());
  /* ★ <b>아무도 예상업적을 안 적은 팀</b>에 「0원」 이라고 적으면 「이 팀은
     기대할 게 없다」 가 된다. 못 적은 것과 0 은 다르다 (1번).
     t2 는 진행 한 건인데 예상업적이 비어 있는 팀이다. */
  /* ⚠ 줄 전체 글을 보면 안 된다 — 그 줄에는 「<b>목표</b> 안 적음」 이 이미
     있어서, 「진행 예상」 을 0 으로 되돌려 놔도 초록이 뜬다. 실제로 그렇게
     한 번 뚫렸다. <b>그 칸 하나</b>를 집어서 본다 (8번). */
  const expCell = await pg.evaluate(() => {
    const tr = document.querySelector('[data-goteam="t2"]');
    const td = tr ? tr.querySelectorAll('td')[7] : null;   /* 진행 예상 칸 */
    const tr1 = document.querySelector('[data-goteam="t1"]');
    const td1 = tr1 ? tr1.querySelectorAll('td')[7] : null;
    return { head: [...document.querySelectorAll('#allteams th')].map(x => x.textContent.trim())[7],
      none: td ? td.textContent.trim() : '', some: td1 ? td1.textContent.trim() : '' };
  });
  is(expCell.head === '진행 예상', '  재는 칸이 <b>진행 예상</b> 이 맞다 — ' + expCell.head);
  is(expCell.none === '안 적음',
    '아무도 안 적은 <b>진행 예상</b>을 0 으로 적지 않는다 (1번) — ' + (expCell.none || '(빈칸)'));
  is(/\d/.test(expCell.some),
    '  적은 팀은 <b>숫자로</b> 적는다 — ' + expCell.some);
  const expOk = await pg.evaluate(() => {
    const s1 = teamStat('t1'), s2 = teamStat('t2');
    return { a: s1.expN, b: s2.expN };
  });
  is(expOk.a > 0 && expOk.b === 0, '  적은 사람이 몇인지 <b>세어서</b> 가른다 — t1 ' + expOk.a + '명 · t2 ' + expOk.b + '명');

  head('[8] 전체 표와 아래 판이 <b>같은 셈</b>을 말한다 (5번)');
  const same = await pg.evaluate(() => {
    const s = teamStat('t1');
    const ids = memsOf('t1').map(m => m.id);
    const L = ROWS.filter(r => ids.includes(r.mid));
    return { a: s.live, b: L.filter(isLive).length, ga: s.goal,
      gb: memsOf('t1').reduce((x, m) => x + (GOALS[m.id] || 0), 0) * 10000 };
  });
  is(same.a === same.b && same.ga === same.gb,
    '진행 건수와 목표가 두 곳에서 같다 — ' + same.a + '/' + same.b + ' · ' + same.ga + '/' + same.gb);

  head('[9] <b>모두 접기 · 모두 펴기</b>');
  const allfold = await pg.evaluate(() => {
    const n = () => document.querySelectorAll('#board tr.tm.shut').length;
    document.querySelector('#b-foldall').click();
    const a = n();
    document.querySelector('#b-foldall').click();
    return { a, b: n(), teams: TEAMS.filter(t => memsOf(t.id).length).length };
  });
  is(allfold.a === allfold.teams, '모두 접으면 <b>다 접힌다</b> — ' + allfold.a + '팀');
  is(allfold.b === 0, '한 번 더 누르면 <b>다 펴진다</b>');

  head('[10] 서버를 아껴 쓴다 (7번)');
  const calls = await pg.evaluate(() => window.__CALLS__.filter(x => /monthly_perf/.test(x)).length);
  is(calls <= 2, '목표를 <b>되풀이해 안 부른다</b> — monthly_perf ' + calls + '번');
  is(errs.length === 0, '터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await ctx.close(); await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ DB · 업적관리 — 고칠 자리 ' + bad + '곳')
    : '✓ 이름 옆에 예상업적이 서고, 목표가 갈라지고, 팀이 접힙니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
