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
    /* 남의 고객 — 팀원이 이건 못 건드려야 한다 */
    out.push({id:'y1',assigned_to:'you',customer_name:'남의고객',phone:'',source:'방송',
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
  ok(t1.rows === 82, '가짜 DB 82건이 다 보인다 (' + t1.rows + '건)');
  ok(/방송/.test(t1.first), '줄마다 그 DB 의 종류가 찍힌다');
  ok(t1.filter, '종류로 거를 수 있는 칸이 있다');
  ok(t1.opts.indexOf('방송') >= 0 && t1.opts.indexOf('농협') >= 0,
    '거르개에 대표가 정한 종류가 들어 있다 — ' + t1.opts.filter(Boolean).join(','));
  ok(t1.opts.indexOf('NS홈쇼핑 화재보험') >= 0,
    '목록에서 빠진 옛 종류라도 그걸로 저장된 DB 가 있으면 거를 수 있다');

  /* ── 2. 종류로 걸러진다 ── */
  const t2 = await page.evaluate(() => {
    document.getElementById('srcFilter').value = '방송'; renderDb();
    const n = document.querySelectorAll('#dbBody tr').length - 1;   /* 남의 고객 한 건 뺀다 */
    document.getElementById('srcFilter').value = ''; renderDb();
    return { n, back: document.querySelectorAll('#dbBody tr').length };
  });
  ok(t2.n === 40, '방송만 고르면 방송 40건만 남는다 (' + t2.n + '건)');
  ok(t2.back === 82, '전체로 되돌리면 다시 82건 (' + t2.back + '건)');

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
  ok(bc && bc[1] === '41' && jc && jc[1] === '40',
    '배정 건수가 실제 자료와 맞는다 — 방송 41(남의 것 한 건 포함) · 보장분석 40');
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
      opts: Array.from(document.querySelectorAll('#srcFilter option')).map(x => x.value).filter(Boolean).length
    };
  });
  ok(t6.admin === true, '팀원도 종류 목록 편집칸을 본다 — 종류는 각자 만든다');
  ok(t6.filter && t6.opts >= 4, '팀원도 종류로 거르기는 그대로 된다 (' + t6.opts + '개)');

  /* ── 팀원이 자기 고객을 고치고 지운다 ── */
  const t7 = await B.page.evaluate(() => {
    const mine = dbs.find(d => d.assigned_to === 'me');
    const other = dbs.find(d => d.assigned_to === 'you');
    return {
      editMine: canEditDb(mine), editOther: canEditDb(other),
      delMine: canDeleteDb(mine), delOther: canDeleteDb(other),
      scopeMe: inMyScope('me'), scopeOther: inMyScope('you')
    };
  });
  ok(t7.editMine === true, '팀원이 자기 고객을 수정할 수 있다');
  ok(t7.delMine === true, '팀원이 자기 고객을 지울 수 있다');
  ok(t7.editOther === false, '남의 고객은 수정 못 한다');
  ok(t7.delOther === false, '남의 고객은 지우지도 못한다');
  ok(t7.scopeMe === true && t7.scopeOther === false, '배정은 본인에게만 — 남에게 넘기지 못한다');

  /* 화면에도 실제로 단추가 뜨는가 */
  const t7b = await B.page.evaluate(() => {
    const row = Array.from(document.querySelectorAll('#dbBody tr'))
      .find(tr => /남의고객/.test(tr.textContent));
    const mineRow = Array.from(document.querySelectorAll('#dbBody tr'))
      .find(tr => /방송0(?!\d)/.test(tr.textContent));
    const btn = tr => Array.from(tr ? tr.querySelectorAll('button') : []).map(b => b.textContent.trim());
    return { mine: btn(mineRow), other: btn(row) };
  });
  ok(t7b.mine.indexOf('수정') >= 0 && t7b.mine.indexOf('삭제') >= 0,
    '내 고객 줄에 수정·삭제 단추가 보인다 — ' + t7b.mine.join(' · '));
  ok(t7b.other.indexOf('수정') < 0 && t7b.other.indexOf('삭제') < 0,
    '남의 고객 줄에는 안 보인다 — ' + t7b.other.join(' · '));

  /* 함수를 직접 불러도 남의 것은 막힌다 — 화면에서 숨기는 것만으로는 부족하다 */
  const t7c = await B.page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    openDb('y1');
    const opened = document.getElementById('dbModal').classList.contains('open');
    window.toast = old;
    return { opened, msg: window.__toast.join(' ') };
  });
  ok(t7c.opened === false, '남의 고객은 수정 창이 아예 안 열린다');
  ok(/내 고객이 아니면/.test(t7c.msg), '왜 안 되는지 말해 준다 — ' + t7c.msg.slice(0, 40));

  /* ── 팀원이 개척 DB 를 직접 넣는다 ── */
  const t7d = await B.page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    const btn = document.getElementById('newDbBtn');
    openDb();
    const opened = document.getElementById('dbModal').classList.contains('open');
    const who = Array.from(document.getElementById('assignedTo').options).map(o => o.value);
    const pick = document.getElementById('assignedTo').value;
    document.getElementById('customerName').value = '개척고객';
    document.getElementById('phone').value = '010-0000-0000';
    await saveDb();
    window.toast = old;
    const w = window.__wrote.filter(x => x.t === 'dbs');
    return {
      shown: !!btn && !btn.classList.contains('hidden'),
      opened, who, pick, wrote: w.length ? w[0].v : null, msg: window.__toast.join(' ')
    };
  });
  ok(t7d.shown, '팀원 화면에도 「+ DB 등록」 단추가 보인다');
  ok(t7d.opened, '팀원이 새 DB 등록 창을 연다');
  ok(t7d.who.length === 1 && t7d.who[0] === 'me',
    '담당자 칸에는 본인만 뜬다 — 남에게 배정하는 문이 안 열린다 (' + t7d.who.join(',') + ')');
  ok(t7d.pick === 'me', '새로 만들면 본인에게 배정된 채로 열린다');
  ok(t7d.wrote && t7d.wrote.assigned_to === 'me' && t7d.wrote.customer_name === '개척고객',
    '팀원이 넣은 개척 DB 가 본인 앞으로 저장된다');
  ok(!/권한이 없습니다|지점장 이상/.test(t7d.msg), '막혔다는 말이 안 나온다 — ' + (t7d.msg || '조용히 저장됨').slice(0, 40));

  /* 남에게 배정하려 하면 여전히 막힌다 */
  const t7e = await B.page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    openDb();
    const sel = document.getElementById('assignedTo');
    sel.innerHTML = '<option value="you">동료</option>';   /* 화면을 억지로 뜯어고쳐 본다 */
    sel.value = 'you';
    document.getElementById('customerName').value = '남에게넘기기';
    await saveDb();
    window.toast = old;
    return { wrote: window.__wrote.filter(x => x.t === 'dbs').length, msg: window.__toast.join(' ') };
  });
  ok(t7e.wrote === 0, '화면을 뜯어고쳐 남에게 배정해도 저장되지 않는다');
  ok(/맡을 수 없는 담당자/.test(t7e.msg), '왜 안 되는지 말해 준다 — ' + t7e.msg.slice(0, 40));
  await B.page.evaluate(() => { closeModal('dbModal'); fillProfiles(); });

  /* ── 팀원이 종류를 직접 넣는다 ── */
  const t8 = await B.page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    window.prompt = () => '지인소개';
    openDb('b0');
    const sel = document.getElementById('dbSource');
    const hasAdd = Array.from(sel.options).some(o => o.value === '__add__');
    sel.value = '__add__';
    srcPick();
    await new Promise(r => setTimeout(r, 300));
    window.toast = old;
    return {
      hasAdd, val: sel.value,
      opts: Array.from(sel.options).map(o => o.value),
      wrote: window.__wrote.filter(x => x.t === 'app_config').map(x => x.v),
      msg: window.__toast.join(' ')
    };
  });
  ok(t8.hasAdd, '종류 고르는 칸 맨 밑에 「＋ DB 종류 추가」 가 있다');
  ok(t8.wrote.length === 1 && /지인소개/.test(t8.wrote[0].value),
    '팀원이 넣은 종류가 서버로 나간다 — 대표를 안 거친다');
  ok(t8.opts.indexOf('지인소개') >= 0, '넣자마자 목록에 들어간다');
  ok(t8.val === '지인소개', '넣은 종류가 바로 골라져 있다 — 다시 안 찾아도 된다');
  ok(t8.opts[t8.opts.length - 1] === '__add__', '「＋ 추가」 는 항상 맨 밑에 있다');

  /* ── 팀원이 종류를 지운다 ── */
  const t9 = await B.page.evaluate(async () => {
    window.__wrote = []; window.__toast = [];
    const old = window.toast; window.toast = m => { window.__toast.push(m); };
    let asked = '';
    window.confirm = m => { asked = m; return true; };
    document.getElementById('dbSource').value = '지인소개';
    srcDel();
    await new Promise(r => setTimeout(r, 300));
    window.toast = old;
    return {
      asked, wrote: window.__wrote.filter(x => x.t === 'app_config').map(x => x.v),
      opts: Array.from(document.getElementById('dbSource').options).map(o => o.value),
      dbs: dbs.length
    };
  });
  ok(t9.wrote.length === 1 && !/지인소개/.test(t9.wrote[0].value), '팀원이 종류를 지울 수 있다');
  ok(t9.opts.indexOf('지인소개') < 0, '지운 종류가 목록에서 빠진다');
  ok(/모든 팀원 화면에서 같이 사라집니다/.test(t9.asked),
    '지우기 전에 전원 화면이 바뀐다고 먼저 알린다');
  ok(t9.dbs === 82, '종류를 지워도 고객 자료는 한 건도 안 없어진다 (' + t9.dbs + '건)');

  /* 이미 쓰고 있는 종류를 지우려 하면 몇 명이 걸렸는지 먼저 말한다 */
  const t10 = await B.page.evaluate(async () => {
    let asked = ''; window.confirm = m => { asked = m; return false; };
    document.getElementById('dbSource').value = '방송';
    srcDel();
    await new Promise(r => setTimeout(r, 200));
    return { asked, opts: Array.from(document.getElementById('dbSource').options).map(o => o.value) };
  });
  ok(/고객 4\d명은 그대로 남습니다|고객 \d+명은 그대로 남습니다/.test(t10.asked),
    '몇 명이 그 종류로 저장돼 있는지 먼저 말한다 — ' + (t10.asked.split('\n')[2] || '').slice(0, 40));
  ok(t10.opts.indexOf('방송') >= 0, '취소하면 아무것도 안 지운다');

  ok(B.errs.length === 0, '팀원 화면에서 자바스크립트 오류 없음' + (B.errs.length ? ' — ' + B.errs[0] : ''));
  await B.ctx.close();

  await browser.close(); srv.close();
  if (fail.length) { console.log('\nDB 종류 검사 실패:'); fail.forEach(m => console.log('  ✗ ' + m)); process.exit(1); }
  console.log('\nDB 종류 검사 통과');
})();
