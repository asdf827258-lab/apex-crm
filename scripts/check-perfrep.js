/* 월간 영업보고서 — 목표·실적이 흐르는가.

   이 앱에는 업적을 담는 자리가 없었다. 통화 습관과 활동 점수는 있는데
   정작 월초보험료가 얼마인지 적을 칸이 없었다.

   여기서 확인한다.

     1. 담을 자리(SQL)가 있고, 열람을 DB 가 막는가
     2. TFA 업무관리에 「내 업적」 칸이 생겼는가
     3. 목표 대비 · 열두 달 흐름이 실제로 그려지는가
     4. 리더의 사업계획서가 팀원 관리 <b>맨 위</b>에 오는가
     5. 「적용」 이 팀원 목표만 건드리고 실적은 안 건드리는가
     6. 영업보고서가 이미지로 구워지고 클립보드로 가는가
     7. DB 통합 CRM 에도 같은 숫자가 뜨는가                        */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8869;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* monthly_perf 를 실제로 흉내 내는 스텁 — 넣은 것이 그대로 나와야 한다 */
const STUB = `
window.__db={monthly_perf:[],team_plans:[]};
window.supabase={createClient:function(){
 var mk=function(tbl){
   var f=[],one=false,pend=null;
   var a={
     select:function(){return a},
     eq:function(k,v){f.push([k,v]);return a},
     gte:function(k,v){f.push(['>='+k,v]);return a},
     lte:function(k,v){f.push(['<='+k,v]);return a},
     is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
     order:function(){return a},limit:function(){return a},range:function(){return a},
     single:function(){one=true;return a},
     insert:function(r){pend=r;return a},
     update:function(r){pend=r;pend.__upd=1;return a},
     upsert:function(r){pend=r;pend.__ups=1;return a},
     then:function(res){
       var T=window.__db[tbl];
       if(T&&pend){
         var rows=[].concat(pend);
         rows.forEach(function(r){
           var key=(tbl==='monthly_perf')?['owner_id','period']:['team_id','period'];
           var hit=null,i;
           if(r.__upd){
             for(i=0;i<T.length;i++){
               var ok=f.every(function(x){return T[i][x[0]]===x[1];});
               if(ok)Object.assign(T[i],r);
             }
           }else{
             for(i=0;i<T.length;i++)if(key.every(function(k){return T[i][k]===r[k];}))hit=T[i];
             if(hit)Object.assign(hit,r); else T.push(Object.assign({},r));
           }
         });
         return Promise.resolve({data:null,error:null}).then(res);
       }
       var out=(T||[]).filter(function(row){
         return f.every(function(x){
           var k=x[0],v=x[1];
           if(k.indexOf('>=')===0)return (''+row[k.slice(2)])>=(''+v);
           if(k.indexOf('<=')===0)return (''+row[k.slice(2)])<=(''+v);
           return row[k]===v;
         });
       });
       return Promise.resolve({data:one?(out[0]||null):out,error:null}).then(res);
     }};
   a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'u1'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'u1'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

(async () => {
  const app = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const crm = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');

  /* ═══ 1. 담을 자리와 열람 규칙 ═══ */
  console.log('\n[1] 업적을 담을 자리가 있고, 열람을 DB 가 막는가');
  const sqlPath = path.join(ROOT, 'migration_40_perf.sql');
  is(fs.existsSync(sqlPath), '마이그레이션 파일이 있다');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  is(/create table if not exists public\.monthly_perf/.test(sql), 'monthly_perf 표를 만든다');
  is(/create table if not exists public\.team_plans/.test(sql), 'team_plans 표를 만든다');
  is(/unique index if not exists monthly_perf_uni/.test(sql), '사람마다 · 달마다 하나만 (중복 방지)');
  is(/enable row level security/.test(sql), '열람을 DB 가 막는다');
  is(/t\.leader_id = auth\.uid\(\)/.test(sql), '리더는 <b>자기가 이끄는 팀</b>만 본다');
  is(/role in \('admin','owner','master','hq','branch_manager'\)/.test(sql), '대표·관리자는 전체를 본다');
  is(/with check \(owner_id = auth\.uid\(\)\)/.test(sql), '남의 이름으로 새 줄을 못 만든다');
  is(!/--/.test(sql), 'SQL 에 -- 주석을 안 쓴다 (붙여넣을 때 깨진다)');

  /* ═══ 2~6. 앱 ═══ */
  console.log('\n[2] TFA 업무관리에 「내 업적」 이 생겼는가');
  is(/\['perf', *'💰'/.test(app), '메뉴에 「내 업적 · 월간보고」 가 있다');
  is(/cat==='perf'/.test(app), '그 칸을 누르면 업적 화면이 나온다');
  ['pfLoad', 'pfSave', 'pfMeHtml', 'pfChartHtml', 'pfSubmit', 'pfAiDraft',
    'pfTeamPlanHtml', 'pfPlanSave', 'pfTeamBoardHtml', 'pfCardHtml', 'pfCardCopy']
    .forEach(k => is(new RegExp('function ' + k + '\\(').test(app), k + ' 가 있다'));

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    window.__toasts = []; window.toast = m => window.__toasts.push(m);
    if (!window.OS.profile) window.OS.profile = { id: 'u1', name: '윤시현', role: 'admin', plan: 'pro' };
    /* 팀 명단을 흉내 낸다 — 리더 화면이 이걸 읽는다 */
    if (typeof GB !== 'undefined') {
      GB.loaded = true; GB.team = 't1'; GB.teamOf = { u1: 't1', u2: 't1', u3: 't1' };
      /* 기존 화면들이 raw·sc 를 읽는다 — 실제 모양대로 채운다 */
      const mkRow = (id, name) => ({
        id: id, name: name, role: 'member', team: 't1',
        raw: { att: 20, run: 12, call: 40, cli: 8, rep: 3, stu: 2 },
        sc: { att: 80, run: 70, call: 75, cli: 60, rep: 50, stu: 40 },
        total: 62, last: '', lastAtt: '', days: 20, any: true
      });
      GB.rows = [mkRow('u1', '윤시현'), mkRow('u2', '홍보험'), mkRow('u3', '김상담')];
      GB.teams = [{ id: 't1', name: '온탑2지점' }];
    }
    window.gbIsLead = () => true;
  });

  console.log('\n[3] 목표와 실적을 넣으면 그래프가 그려지는가');
  const R = await page.evaluate(async () => {
    /* 지난 넉 달 흐름을 미리 심어 둔다 */
    const ym = pfYm(), a = ym.split('-');
    for (let k = 4; k >= 1; k--) {
      const d = new Date(+a[0], +a[1] - 1 - k, 1);
      window.__db.monthly_perf.push({
        owner_id: 'u1', period: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2),
        goal_prem: 300, act_prem: 200 + k * 30, goal_case: 5, act_case: 4
      });
    }
    go('airep'); await new Promise(r => setTimeout(r, 500));
    arGoCat('perf'); await new Promise(r => setTimeout(r, 900));
    /* 이번 달 값을 적고 저장 */
    document.getElementById('pf_goal').value = '500';
    document.getElementById('pf_act').value = '620';
    document.getElementById('pf_gcase').value = '6';
    document.getElementById('pf_acase').value = '8';
    document.getElementById('pf_plan').value = '기존 고객 30명 재점검';
    pfSaveMine();
    await new Promise(r => setTimeout(r, 900));
    const host = document.getElementById('arPane') || document.body;
    return {
      saved: JSON.parse(JSON.stringify(window.__db.monthly_perf.filter(x => x.period === pfYm()))),
      text: (host.innerText || ''),
      svg: host.querySelectorAll('svg').length
    };
  });
  is(R.saved.length === 1 && +R.saved[0].act_prem === 620, '적은 값이 그대로 저장된다 (' + (R.saved[0] || {}).act_prem + '만원)');
  is(/달성률 124%/.test(R.text), '달성률을 스스로 계산한다 — 620/500 = 124%');
  is(/목표를 120만원 넘겼습니다/.test(R.text), '얼마나 넘겼는지 말로도 알려 준다');
  is(R.svg >= 2, '목표 대비 막대와 열두 달 흐름이 그려진다 (svg ' + R.svg + '개)');

  /* 한 판에 다 모였는가 — 결과 → 과정 → 습관 → 총평 */
  const ONE = await page.evaluate(() => {
    const h = document.getElementById('arPane') || document.body;
    const t = h.innerText || '';
    return {
      rate: t.indexOf('월별 타율') >= 0,
      score: t.indexOf('여섯 축') >= 0 || t.indexOf('점수') >= 0,
      full: t.indexOf('내 보고서 한눈에') >= 0,
      order: [t.indexOf('목표 대비'), t.indexOf('월별 타율'), t.indexOf('내 보고서 한눈에')]
    };
  });
  is(ONE.rate, '월별 타율이 같은 판에 붙는다');
  is(ONE.score, '본인 점수판이 같은 판에 붙는다');
  is(ONE.full, '리더가 보는 그 보고서가 내 화면에도 붙는다');
  is(ONE.order[0] < ONE.order[1] && ONE.order[1] < ONE.order[2],
    '결과 → 과정 → 총평 순으로 이어진다');

  console.log('\n[4] 리더의 사업계획서가 팀원 관리 맨 위에 오는가');
  const L = await page.evaluate(async () => {
    arGoCat('team'); await new Promise(r => setTimeout(r, 900));
    const host = document.getElementById('arPane') || document.body;
    const t = host.innerText || '';
    return {
      hasPlan: t.indexOf('사업계획서') >= 0,
      hasBoard: t.indexOf('지점 총괄') >= 0,
      /* 맨 위인가 — 사업계획서가 지점 총괄보다, 총괄이 팀원 목록보다 앞에 */
      order: [t.indexOf('사업계획서'), t.indexOf('지점 총괄')],
      mates: !!document.getElementById('pf_sh_u2') && !!document.getElementById('pf_sh_u3')
    };
  });
  is(L.hasPlan, '사업계획서 칸이 나온다');
  is(L.hasBoard, '지점 총괄이 나온다');
  is(L.order[0] >= 0 && L.order[0] < L.order[1], '사업계획서가 지점 총괄보다 위에 있다');
  is(L.mates, '팀원별로 목표를 나눌 칸이 생긴다');

  console.log('\n[5] 「적용」 이 팀원 목표만 건드리는가');
  const A = await page.evaluate(async () => {
    /* 팀원이 이미 올린 실적이 있다 — 이게 지워지면 안 된다 */
    window.__db.monthly_perf.push({ owner_id: 'u2', period: pfYm(), goal_prem: 100, act_prem: 450, act_case: 3 });
    document.getElementById('pf_tplan').value = '이달은 보장분석 재점검에 집중';
    document.getElementById('pf_tgoal').value = '900';
    document.getElementById('pf_sh_u2').value = '400';
    document.getElementById('pf_sh_u3').value = '500';
    pfPlanSave(1);
    await new Promise(r => setTimeout(r, 1100));
    const u2 = window.__db.monthly_perf.find(x => x.owner_id === 'u2' && x.period === pfYm());
    const u3 = window.__db.monthly_perf.find(x => x.owner_id === 'u3' && x.period === pfYm());
    const plan = window.__db.team_plans[0] || {};
    return { u2: u2 || {}, u3: u3 || {}, plan: plan, toast: (window.__toasts || []).slice(-1)[0] || '' };
  });
  is(+A.u2.goal_prem === 400, '팀원 목표가 내려간다 (u2 = ' + A.u2.goal_prem + ')');
  is(+A.u2.act_prem === 450, '팀원이 올린 <b>실적은 안 건드린다</b> (' + A.u2.act_prem + '만원 그대로)');
  is(A.u2.from_team === true, '내려온 목표임을 표시해 둔다 — 팀원 화면에서 구분된다');
  is(+A.u3.goal_prem === 500, '아직 줄이 없던 팀원에게도 새로 만들어 넣는다');
  is(A.plan.applied_at, '적용한 시각이 남는다');
  is(/내려보냈습니다/.test(A.toast), '몇 명에게 갔는지 알려 준다 — ' + A.toast);

  console.log('\n[6] 영업보고서가 이미지로 나가는가');
  const C = await page.evaluate(async () => {
    arGoCat('perf'); await new Promise(r => setTimeout(r, 700));
    pfCardOpen(); await new Promise(r => setTimeout(r, 400));
    const card = document.getElementById('pfCard');
    const wrap = document.getElementById('pfCardWrap');
    return {
      open: wrap ? getComputedStyle(wrap).display : '-',
      w: card ? Math.round(card.getBoundingClientRect().width) : 0,
      text: card ? card.innerText : '',
      buttons: wrap ? [].slice.call(wrap.querySelectorAll('button')).map(b => b.textContent) : []
    };
  });
  is(C.open === 'flex', '영업보고서가 펼쳐진다');
  is(C.w >= 700, '카톡에 붙일 만한 크기다 (' + C.w + 'px)');
  is(/620/.test(C.text) && /124%/.test(C.text), '보고서에 이달 숫자가 들어간다');
  is(/MONTHLY REPORT/.test(C.text), '한 장짜리 보고서 꼴이다');
  is(C.buttons.some(b => /이미지 복사/.test(b)), '「이미지 복사」 단추가 있다');
  is(/고객 정보는 담겨 있지 않습니다/.test(C.text), '고객 정보가 안 들어간다고 못 박는다');
  is(/ClipboardItem/.test(app) && /image\/png/.test(app), '이미지 자체를 클립보드에 넣는다 (글자만 넣으면 카톡에 안 붙는다)');
  is(/ensureHtml2Canvas/.test(app.slice(app.indexOf('function pfCardCanvas'), app.indexOf('function pfCardCanvas') + 400)),
    '이미 쓰던 그림 굽는 도구를 그대로 쓴다');
  is(/pfCardDown\(\)/.test(app), '복사가 막힌 브라우저에서는 파일로 내려받는다');

  /* ═══ 7. DB 통합 CRM ═══ */
  console.log('\n[7] DB 통합 CRM 에도 같은 숫자가 뜨는가');
  is(/function renderPerf/.test(crm), 'CRM 에 월간 업적을 그리는 자리가 있다');
  is(/from\('monthly_perf'\)/.test(crm), '앱이 넣은 표를 그대로 읽는다');
  is(/perfBody/.test(crm), 'KPI 화면 안에 붙는다');
  is(/migration_40_perf\.sql/.test(crm), 'SQL 을 안 돌렸을 때 무엇을 해야 하는지 알려 준다');
  is(/TFA 업무관리/.test(crm), '값이 없으면 어디서 넣는지 알려 준다');

  /* ═══ 8. 아침 보고 — 크게, 줄마다 제 칸으로 ═══
     전에는 상자가 작았고 단추 하나로 뭉뚱그려 보냈다. 어디로 가는지
     모르면 사람은 안 누른다. */
  console.log('\n[8] 아침 보고가 크고, 눌러서 그 칸으로 가는가');
  const B = await page.evaluate(async () => {
    /* 이달 제출을 지워 「아직 안 냈다」 가 뜨게 한다 */
    const m = window.__db.monthly_perf.find(x => x.owner_id === 'u1' && x.period === pfYm());
    if (m) delete m.submitted_at;
    PF.loaded = false; pfLoad();
    await new Promise(r => setTimeout(r, 700));
    arBriefOpen();
    await new Promise(r => setTimeout(r, 300));
    const ov = document.getElementById('arBriefOvl');
    const box = ov ? ov.firstElementChild : null;
    const btns = ov ? [].slice.call(ov.querySelectorAll('button[onclick^="arBriefGo"]')) : [];
    return {
      open: !!ov,
      width: box ? Math.round(box.getBoundingClientRect().width) : 0,
      rows: btns.length,
      first: btns[0] ? btns[0].innerText.replace(/\n+/g, ' ') : '',
      text: ov ? ov.innerText : '',
      jump: !!(window.AR && AR._brief && AR._brief.length)
    };
  });
  is(B.open, '아침 보고가 뜬다');
  is(/어제 총합/.test(B.text), '어제 총합이 오늘 할 일보다 <b>먼저</b> 나온다');
  is(/통화/.test(B.text) && /상담 전환/.test(B.text), '어제 통화·상담·전환율이 숫자로 뜬다');
  is(B.text.indexOf('어제 총합') < B.text.indexOf('오늘 이것부터'), '어제를 보고 오늘을 시작하는 순서다');
  is(B.width >= 700, '상자가 커졌다 (' + B.width + 'px · 전에는 500px)');
  is(B.rows >= 1, '할 일이 줄마다 눌리는 단추로 나온다 (' + B.rows + '줄)');
  is(/바로 가기/.test(B.text), '줄마다 「바로 가기」 가 붙는다');
  is(/월간보고를 아직 안 냈습니다/.test(B.text), '월간보고를 안 냈으면 맨 위에 세운다');
  is(/밀렸습니다/.test(B.text), '밀린 것이 있으면 제목에서부터 알린다');

  /* 눌렀을 때 정말 그 칸으로 가는가 */
  const J = await page.evaluate(async () => {
    const i = (AR._brief || []).findIndex(x => x.cat === 'perf');
    if (i < 0) return { moved: false, cat: '' };
    arBriefGo(i);
    await new Promise(r => setTimeout(r, 700));
    return { moved: !document.getElementById('arBriefOvl'), cat: AR.cat, tab: (typeof lastTab !== 'undefined' ? lastTab : '') };
  });
  is(J.moved, '누르면 창이 닫힌다');
  is(J.cat === 'perf', '누른 줄의 <b>그 칸</b>으로 간다 (' + J.cat + ')');

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError|html2canvas/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 120) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '월간 영업보고서 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '월간 영업보고서 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
