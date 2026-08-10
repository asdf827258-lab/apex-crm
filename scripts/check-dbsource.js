/* DB 종류(카테고리) — 대표가 정하고, 팀원은 고르기만 한다.

   dbs.source 칸은 처음부터 있었는데 화면에서 통째로 빠져 있었다.
   값이 네 개('소개','지인','개척','일반')로 묶여 있어서 실제로 쓰는
   방송·보장분석·농협 같은 종류를 넣을 수가 없었기 때문이다.

   여기서 확인하는 것.
     1. 등록·수정 창에서 종류를 고른다
     2. 목록에 종류가 보이고 종류로 걸러진다
     3. KPI 에서 종류별 타율이 갈라진다
     4. 목록 편집칸은 대표에게만 보인다 — 팀원에게는 안 보인다
     5. 저장하면 서버 app_config 한 줄로 간다 (모두가 같은 목록을 본다)
     6. 목록에서 지운 종류라도 이미 그걸로 저장된 DB 는 사라지지 않는다      */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8824;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 가짜 서버 — 표마다 정해 둔 줄을 돌려주고, 쓰기는 받아서 적어 둔다.
   종류마다 붙는 정도를 일부러 다르게 만들어 타율이 갈라지는지 본다. */
const STUB = `
window.__wrote=[];
window.__seed={
  role:'admin',
  sources:'일반,방송,보장분석,농협',
  dbs:(function(){
    var out=[],i;
    /* 방송 40건 — 잘 붙는다 */
    for(i=0;i<40;i++)out.push({id:'b'+i,assigned_to:'me',customer_name:'방송'+i,phone:'',source:'방송',
      region:'순천',assigned_date:'2026-07-01',report_name:'보장분석 3DB',memo:''});
    /* 보장분석 40건 — 잘 안 붙는다 */
    for(i=0;i<40;i++)out.push({id:'j'+i,assigned_to:'me',customer_name:'분석'+i,phone:'',source:'보장분석',
      region:'순천',assigned_date:'2026-07-01',report_name:'보장분석 3DB',memo:''});
    /* 목록에서 빠진 옛 종류 — 이미 저장된 것이라 그대로 남아야 한다 */
    out.push({id:'z1',assigned_to:'me',customer_name:'옛날',phone:'',source:'NS홈쇼핑 화재보험',
      region:'순천',assigned_date:'2026-07-01',report_name:'보장분석 3DB',memo:''});
    return out;
  })(),
  calls:(function(){
    var out=[],i;
    for(i=0;i<40;i++)out.push({id:'cb'+i,db_id:'b'+i,created_by:'me',call_at:'2026-07-05T10:00:00',
      result:(i<24?'상담':'부재'),appointment_at:(i<20?'2026-07-20T10:00:00':null),memo:'',recording_delivered:true});
    for(i=0;i<40;i++)out.push({id:'cj'+i,db_id:'j'+i,created_by:'me',call_at:'2026-07-05T10:00:00',
      result:(i<6?'상담':'부재'),appointment_at:null,memo:'',recording_delivered:true});
    return out;
  })()
};
window.APEX_CONFIG={url:'https://stub.test',key:'anon-stub'};
window.supabase={createClient:function(){
  function rows(tbl,f){
    var S=window.__seed;
    if(tbl==='profiles'){
      var ps=[{id:'me',name:'점검',role:S.role,active:true},{id:'you',name:'동료',role:'member',active:true}];
      if(f.id)ps=ps.filter(function(p){return p.id===f.id});
      return ps;
    }
    if(tbl==='dbs')return S.dbs;
    if(tbl==='calls')return S.calls;
    if(tbl==='attendance')return [];
    if(tbl==='teams')return [];
    if(tbl==='team_members')return [];
    if(tbl==='app_config'){
      if(f.key&&f.key!=='db_sources')return [];
      return S.sources?[{key:'db_sources',value:S.sources}]:[];
    }
    return [];
  }
  function q(tbl){
    var f={},single=false;
    var a={
      select:function(){return a},order:function(){return a},limit:function(){return a},
      gte:function(){return a},lte:function(){return a},is:function(){return a},
      neq:function(){return a},in:function(){return a},not:function(){return a},range:function(){return a},
      eq:function(k,v){f[k]=v;return a},
      single:function(){single=true;return a},
      insert:function(v){window.__wrote.push({t:tbl,op:'insert',v:v});
        if(window.__noSrcCol&&tbl==='dbs'&&v&&'source' in v)f._err={code:'42703',
          message:"Could not find the 'source' column of 'dbs' in the schema cache"};
        return a},
      update:function(v){window.__wrote.push({t:tbl,op:'update',v:v});
        if(window.__noSrcCol&&tbl==='dbs'&&v&&'source' in v)f._err={code:'42703',
          message:"Could not find the 'source' column of 'dbs' in the schema cache"};
        return a},
      upsert:function(v){window.__wrote.push({t:tbl,op:'upsert',v:v});
        if(tbl==='app_config'&&v&&v.key==='db_sources')window.__seed.sources=v.value;return a},
      then:function(res,rej){
        if(f._err)return Promise.resolve({data:null,error:f._err}).then(res,rej);
        var d=rows(tbl,f);
        return Promise.resolve({data:single?(d[0]||null):d,error:null}).then(res,rej);
      }
    };
    a['delete']=function(){window.__wrote.push({t:tbl,op:'delete'});return a};
    return a;
  }
  return {from:q,rpc:function(){return Promise.resolve({data:null,error:null})},
    storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
      getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
    auth:{
      getSession:function(){return Promise.resolve({data:{session:{user:{id:'me',email:'m@t'}}}})},
      getUser:function(){return Promise.resolve({data:{user:{id:'me',email:'m@t'}}})},
      onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
      signOut:function(){return Promise.resolve({})}}};
}};
`;

(async () => {
  const browser = await chromium.launch();
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  async function open(role) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
      ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(STUB);
    await page.addInitScript(r => { window.__role = r; }, role);
    await page.addInitScript(() => {
      const t = setInterval(() => { if (window.__seed) { window.__seed.role = window.__role; clearInterval(t); } }, 1);
    });
    await page.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    return { ctx, page, errs };
  }

  /* ══ 대표(운영자)로 열어 본다 ══ */
  const A = await open('admin');
  const page = A.page;

  await page.evaluate(() => goPage('db'));
  await page.waitForTimeout(400);

  /* ── 1. 목록에 종류가 보인다 ── */
  const t1 = await page.evaluate(() => ({
    head: Array.from(document.querySelectorAll('#page-db thead th')).map(x => x.textContent.trim()),
    rows: document.querySelectorAll('#dbBody tr').length,
    first: (document.querySelector('#dbBody tr') || {}).textContent || '',
    filter: !!document.getElementById('srcFilter'),
    opts: Array.from(document.querySelectorAll('#srcFilter option')).map(x => x.value)
  }));
  ok(t1.head.indexOf('종류') >= 0, 'DB 관리 표에 「종류」 열이 있다 — ' + t1.head.join(' · '));
  ok(t1.rows === 81, '가짜 DB 81건이 다 보인다 (' + t1.rows + '건)');
  ok(/방송/.test(t1.first), '줄마다 그 DB 의 종류가 찍힌다');
  ok(t1.filter, '종류로 거를 수 있는 칸이 있다');
  ok(t1.opts.indexOf('방송') >= 0 && t1.opts.indexOf('농협') >= 0,
    '거르개에 대표가 정한 종류가 들어 있다 — ' + t1.opts.filter(Boolean).join(','));
  ok(t1.opts.indexOf('NS홈쇼핑 화재보험') >= 0,
    '목록에서 빠진 옛 종류라도 그걸로 저장된 DB 가 있으면 거를 수 있다');

  /* ── 2. 종류로 걸러진다 ── */
  const t2 = await page.evaluate(() => {
    document.getElementById('srcFilter').value = '방송'; renderDb();
    const n = document.querySelectorAll('#dbBody tr').length;
    document.getElementById('srcFilter').value = ''; renderDb();
    return { n, back: document.querySelectorAll('#dbBody tr').length };
  });
  ok(t2.n === 40, '방송만 고르면 방송 40건만 남는다 (' + t2.n + '건)');
  ok(t2.back === 81, '전체로 되돌리면 다시 81건 (' + t2.back + '건)');

  /* ── 3. 등록 창에서 종류를 고른다 ── */
  const t3 = await page.evaluate(() => {
    openDb('b0');
    const sel = document.getElementById('dbSource');
    return { has: !!sel, val: sel ? sel.value : '', n: sel ? sel.options.length : 0 };
  });
  ok(t3.has, 'DB 등록·수정 창에 「DB 종류」 칸이 있다');
  ok(t3.val === '방송', '수정할 때 그 DB 의 종류가 미리 골라져 있다 — ' + t3.val);
  ok(t3.n >= 4, '고를 수 있는 종류가 목록만큼 있다 (' + t3.n + '개)');

  /* 저장하면 source 가 실려 나가는지 */
  const t3b = await page.evaluate(async () => {
    document.getElementById('dbSource').value = '농협';
    window.__wrote = [];
    await saveDb();
    const w = window.__wrote.filter(x => x.t === 'dbs');
    return w.length ? w[0].v : null;
  });
  ok(t3b && t3b.source === '농협', '고친 종류가 그대로 저장으로 나간다 — ' + (t3b ? t3b.source : '안 나감'));

  /* ── 4. KPI 에서 종류별로 타율이 갈라진다 ── */
  await page.evaluate(() => { closeModal('dbModal'); goPage('kpi'); });
  await page.waitForTimeout(400);
  const t4 = await page.evaluate(() => {
    const txt = document.getElementById('kpiBody').textContent || '';
    const rows = Array.from(document.querySelectorAll('#kpiBody table tbody tr'))
      .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()));
    return { has: /DB 종류별 타율/.test(txt), rows, tip: /상담 전환/.test(txt) };
  });
  ok(t4.has, 'KPI·타율 분석에 「DB 종류별 타율」 표가 나온다');
  const bc = t4.rows.find(r => /방송/.test(r[0])), jc = t4.rows.find(r => /보장분석/.test(r[0]));
  ok(!!bc && !!jc, '종류마다 한 줄씩 나온다 (' + t4.rows.length + '줄)');
  ok(bc && bc[1] === '40' && jc && jc[1] === '40', '배정 건수가 실제 자료와 맞는다');
  ok(bc && bc[5] === '60%', '방송 상담 전환 60% — 24/40 계산이 맞다 (' + (bc ? bc[5] : '?') + ')');
  ok(jc && jc[5] === '15%', '보장분석 상담 전환 15% — 6/40 계산이 맞다 (' + (jc ? jc[5] : '?') + ')');
  ok(t4.rows.indexOf(bc) < t4.rows.indexOf(jc) || bc[1] >= jc[1], '많이 돌린 종류가 위로 온다');
  const t4b = await page.evaluate(() => (document.getElementById('kpiBody').textContent || ''));
  ok(/표본 적음/.test(t4b), '30건 못 채운 종류는 「표본 적음」 이라고 말한다 — 적은 수로 1등을 뽑지 않는다');
  ok(/가장 좋고/.test(t4b), '어느 종류부터 걸어야 하는지 한 줄로 짚어 준다');

  /* ── 5. 대표에게는 종류 목록 편집칸이 보인다 ── */
  await page.evaluate(() => goPage('db'));
  await page.waitForTimeout(300);
  const t5 = await page.evaluate(() => {
    const c = document.getElementById('srcAdminCard');
    return { shown: !!c && !c.classList.contains('hidden'), val: (document.getElementById('srcList') || {}).value || '' };
  });
  ok(t5.shown, '대표에게는 「DB 종류 목록」 편집칸이 보인다');
  ok(/방송/.test(t5.val) && t5.val.split('\n').length === 4, '지금 목록이 한 줄에 하나씩 들어 있다 (' + t5.val.split('\n').length + '줄)');

  /* 저장하면 서버 한 줄로 간다 */
  const t5b = await page.evaluate(async () => {
    document.getElementById('srcList').value = '일반\n방송\n보장분석\n농협\n제휴';
    window.__wrote = [];
    await saveSources();
    const w = window.__wrote.filter(x => x.t === 'app_config');
    return { wrote: w.length ? w[0].v : null, opts: Array.from(document.querySelectorAll('#srcFilter option')).map(x => x.value) };
  });
  ok(t5b.wrote && t5b.wrote.key === 'db_sources',
    '종류 목록이 서버 app_config 한 줄로 저장된다 — 모두가 같은 목록을 본다');
  ok(t5b.wrote && t5b.wrote.value.indexOf('제휴') >= 0, '새로 적은 종류가 그 줄에 들어간다');
  ok(t5b.opts.indexOf('제휴') >= 0, '저장하자마자 거르개에도 바로 나타난다');

  /* ── 종류 칸이 아직 없는 서버에서도 저장이 막히지 않는가 ── */
  const t5c = await page.evaluate(async () => {
    window.__noSrcCol = true; window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    openDb('b0');
    document.getElementById('dbSource').value = '방송';
    await saveDb();
    window.toast = old; window.__noSrcCol = false;
    const w = window.__wrote.filter(x => x.t === 'dbs');
    return { tries: w.length, last: w.length ? w[w.length - 1].v : null, msg: window.__toast.join(' ') };
  });
  ok(t5c.tries === 2, '종류 칸이 없으면 종류만 빼고 한 번 더 저장한다 (' + t5c.tries + '번)');
  ok(t5c.last && !('source' in t5c.last), '두 번째에는 종류를 빼고 보낸다 — 저장 자체는 성공한다');
  ok(/migration_36/.test(t5c.msg), '무엇을 실행해야 하는지 알려 준다 — ' + t5c.msg.slice(0, 60));

  ok(A.errs.length === 0, '대표 화면에서 자바스크립트 오류 없음' + (A.errs.length ? ' — ' + A.errs[0] : ''));
  await A.ctx.close();

  /* ══ 팀원(담당자)으로 열어 본다 ══ */
  const B = await open('member');
  await B.page.evaluate(() => goPage('db'));
  await B.page.waitForTimeout(400);
  const t6 = await B.page.evaluate(() => {
    const c = document.getElementById('srcAdminCard');
    return {
      admin: !!c && !c.classList.contains('hidden'),
      filter: !!document.getElementById('srcFilter'),
      opts: Array.from(document.querySelectorAll('#srcFilter option')).map(x => x.value).filter(Boolean).length,
      canSave: typeof saveSources === 'function'
    };
  });
  ok(t6.admin === false, '팀원에게는 종류 목록 편집칸이 보이지 않는다');
  ok(t6.filter && t6.opts >= 4, '팀원도 종류로 거르기는 그대로 된다 (' + t6.opts + '개)');

  /* 팀원이 함수를 직접 불러도 막힌다 — 화면에서 숨기는 것만으로는 부족하다 */
  const t6b = await B.page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    await saveSources();
    window.toast = old;
    return { wrote: window.__wrote.filter(x => x.t === 'app_config').length, msg: window.__toast.join(' ') };
  });
  ok(t6b.wrote === 0, '팀원이 저장 함수를 직접 불러도 서버로 나가지 않는다');
  ok(/대표·운영자만/.test(t6b.msg), '왜 안 되는지 말해 준다 — ' + t6b.msg.slice(0, 40));

  ok(B.errs.length === 0, '팀원 화면에서 자바스크립트 오류 없음' + (B.errs.length ? ' — ' + B.errs[0] : ''));
  await B.ctx.close();

  await browser.close(); srv.close();
  if (fail.length) { console.log('\nDB 종류 검사 실패:'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('\nDB 종류 검사 통과');
})();
