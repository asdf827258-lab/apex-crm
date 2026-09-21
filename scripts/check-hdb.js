/* ══════════════════════════════════════════════════════════════════
   check-hdb.js — <b>홈에서 단계를 옮기고, 고객을 넣고 고치는가.</b>

   사장님 말씀 —
     「DB통합CRM에서 DB관리 들어가면 이렇게 상황에 맞게 하는데, 이걸
      <b>홈에서 바로바로 단계별로</b> 할수 있도록 만들고, <b>통합CRM에도
      반영되도록.</b> 홈 화면 내에서 고객을 <b>입력하고 수정하고 고치는</b>
      것까지 가능하도록」

   ── 여기서 진짜로 보는 것 ─────────────────────────────────────────
   「단추가 섰나」 가 아니라 <b>「어느 표에 무엇을 썼나」</b> 를 봅니다.
   가짜 서버를 끼워 두고 홈에서 단추를 누른 뒤, 실제로 나간 글을 읽습니다.
   화면만 보면 눌렀는데 아무 데도 안 쓰는 판을 통과시킵니다 (8번).

     [1] 단계를 한 칸 올리면 <b>dbs.stage</b> 가 바뀐다 (CRM 이 읽는 그 표)
     [2] 통화 결과는 <b>calls</b> 에 한 줄로 들어간다 — CRM 의 「접촉 n/5」
         가 세는 그 표다. 다른 데 적으면 CRM 숫자가 안 움직인다 (5번)
     [3] <b>계약일·증권 전달일을 지어내지 않는다</b> (1번) — 그 날짜가
         필요한 단계로 올릴 때는 창이 뜨고, 비워 둔 채로는 저장이 안 된다
     [4] 홈에서 <b>새 고객을 넣는다</b> — 담당자와 배정일이 같이 들어간다
     [5] 홈에서 <b>고치고 지운다</b>
     [6] <b>남의 고객은 못 건드린다</b> — 단추도 안 서고, 눌러도 안 나간다
     [7] 단계의 차례를 <b>여기서 정하지 않는다</b> — apex-stage.js 한 곳
         (그 파일을 못 실으면 단추 자체가 안 선다)
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8899;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let f = path.join(ROOT, decodeURIComponent(url.parse(rq.url).pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 홍길동 집안입니다 (3번) */
const SEED = `
 window.__W=[];
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'member',active:true,plan:'vip'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){window.__W.push({t:'arLoad'});};
 window.toast=function(m){window.__T=m;};
 window.osIsOwner=function(){return false;};
 window.confirm=function(){return true;};
 GB.loaded=true;GB.teams=[{id:'t1',name:'1팀'}];GB.teamOf={me:'t1',u3:'t2'};
 GB.rows=[{id:'me',name:'홍길동'},{id:'u3',name:'홍갑돌'}];
 var _e={};
 window.arRowOf=function(id){var m={me:'홍길동',u3:'홍갑돌'};return m[id]?{id:id,name:m[id],sc:_e,raw:_e}:null;};
 AR.rep={};AR.loaded=true;AR.busy='';AR.err='';
 AR.db=[{id:'d1',who:'me',name:'홍길동A',region:'순천',src:'보장분석3DB',stage:'미접촉',days:9,n:0,res:'미진행',cAt:'',pAt:''},
        {id:'d9',who:'me',name:'홍길동Z',region:'대전',src:'일반',stage:'CS',days:2,n:3,res:'상담',cAt:'',pAt:''},
        {id:'d2',who:'u3',name:'홍갑돌B',region:'천안',src:'일반',stage:'TA',days:9,n:1,res:'부재',cAt:'',pAt:''}];
 AR.cliRows=[];AR.calls=[];
 CM.loaded=true;CM.who={me:'홍길동',u3:'홍갑돌'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 window.cmLoadAll=function(cb){if(cb)cb();};
 /* 가짜 서버 — <b>어느 표에 무엇을 썼는지</b> 그대로 적어 둔다 */
 window.osClient=function(){
   var mk=function(tbl){
     var st={tbl:tbl,op:'',pay:null,id:''};
     var api={
       update:function(p){st.op='update';st.pay=p;return api;},
       insert:function(p){st.op='insert';st.pay=p;return api;},
       upsert:function(p){st.op='upsert';st.pay=p;return api;},
       'delete':function(){st.op='delete';return api;},
       select:function(){return api;},order:function(){return api;},range:function(){return api;},
       limit:function(){return api;},single:function(){return api;},gte:function(){return api;},
       'in':function(){return api;},is:function(){return api;},neq:function(){return api;},not:function(){return api;},
       eq:function(k,v){st.id=v;return api;},
       then:function(ok,no){ window.__W.push({t:st.tbl,op:st.op,id:st.id,pay:st.pay});
                             return Promise.resolve({data:[],error:null}).then(ok,no); }
     };
     return api;
   };
   return {from:function(t){return mk(t);},rpc:function(){return Promise.resolve({data:null,error:null});}};
 };
 HWHO.id='';CM.pick='';CM.picked=true;go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 930 } });
  /* CI 에는 바깥으로 나가는 길이 있습니다 — 막아 둡니다 (안 막으면 늦게 온
     응답이 화면을 다시 그려 셈이 흔들립니다 · 실제로 그랬습니다) */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await page.evaluate(SEED);
  await page.waitForTimeout(900);

  const W = () => page.evaluate(() => { const w = window.__W.slice(); window.__W = []; return w; });
  const say = () => page.evaluate(() => window.__T || '');
  await W();

  console.log('\n[7] 단계의 차례를 <b>여기서 정하지 않는다</b> — apex-stage.js 한 곳 (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const blk = (src.split('var HDB=')[1] || '').split('/* ══ <b>「무엇을 할까요?」</b>')[0];
  is(blk.length > 500, '  홈 DB 칸(hdb*)이 있다 — ' + blk.length + '자');
  is(!/'미접촉'\s*:\s*'TA'|ORDER\s*=\s*\[/.test(blk),
     '  단계 차례·다음 단계를 <b>여기 안 적었다</b> — apex-stage.js 에 묻는다');
  is(/APEX_STAGE\.next/.test(blk) && /APEX_STAGE\.needs/.test(blk),
     '  다음 단계도, 날짜가 필요한 단계도 <b>그 파일에 묻는다</b>');
  const strip0 = await page.evaluate(() => {
    const e = document.querySelector('.hdb');
    return e ? { t: e.innerText.replace(/\s+/g, ' ').trim(), n: e.querySelectorAll('.hdb-b').length,
                 small: [...e.querySelectorAll('.hdb-b')].filter(b => b.getBoundingClientRect().height < 44).length } : null;
  });
  is(!!strip0, '  홈 카드 안에 <b>단계 줄이 선다</b>');
  is(!!strip0 && strip0.n >= 4, '  단추가 넷 이상 — ' + (strip0 ? strip0.n : 0) + '개');
  is(!!strip0 && strip0.small === 0, '  단추가 <b>손가락으로 누를 만하다</b> (44px)');

  console.log('\n[1] 단계를 올리면 <b>dbs.stage</b> 가 바뀐다 — CRM 이 읽는 그 표');
  await page.evaluate(() => hdbUp('d1')); await page.waitForTimeout(450);
  const w1 = await W();
  is(w1.length === 1 && w1[0].t === 'dbs' && w1[0].op === 'update' && w1[0].id === 'd1',
     '  <b>dbs</b> 표를 고쳤다 — ' + JSON.stringify(w1.map(x => x.t + '.' + x.op)));
  is(w1.length === 1 && w1[0].pay && w1[0].pay.stage === 'TA',
     '  미접촉 → <b>TA</b> 로 올라갔다 — ' + JSON.stringify(w1[0] && w1[0].pay));
  is((await page.evaluate(() => hdbRow('d1').stage)) === 'TA', '  화면이 든 줄도 같이 바뀐다 (서버를 또 안 부른다 · 7번)');

  console.log('\n[2] 통화 결과는 <b>calls</b> 에 들어간다 — CRM 의 접촉 수가 세는 표');
  await page.evaluate(() => hdbCall('d1', '부재')); await page.waitForTimeout(450);
  const w2 = await W();
  is(w2.length === 1 && w2[0].t === 'calls' && w2[0].op === 'insert',
     '  <b>calls</b> 에 한 줄 넣었다 — ' + JSON.stringify(w2.map(x => x.t + '.' + x.op)));
  is(w2.length === 1 && w2[0].pay && w2[0].pay.db_id === 'd1' && w2[0].pay.result === '부재',
     '  누구의 무슨 결과인지 <b>같이</b> 적었다 — ' + JSON.stringify(w2[0] && w2[0].pay && { db_id: w2[0].pay.db_id, result: w2[0].pay.result }));
  is((await page.evaluate(() => hdbRow('d1').n)) === 1, '  접촉 횟수가 <b>하나 올라간다</b>');

  console.log('\n[3] <b>계약일·증권 전달일을 지어내지 않는다</b> (1번)');
  await page.evaluate(() => hdbUp('d9')); await page.waitForTimeout(450);
  const w3 = await W();
  is(w3.length === 0, '  날짜가 필요한 단계는 <b>그냥 안 올린다</b> — 나간 글 ' + w3.length + '건');
  is(await page.evaluate(() => !!document.querySelector('#hdbSheet.on')), '  대신 <b>창이 뜬다</b>');
  is(await page.evaluate(() => { const d = document.getElementById('hdbDates'); return !!d && !d.hidden; }),
     '  그 창에 <b>계약일 칸</b>이 서 있다');
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(450);
  const w3b = await W();
  is(w3b.length === 0, '  비워 둔 채로는 <b>저장이 안 된다</b> — 나간 글 ' + w3b.length + '건');
  const err3 = await page.evaluate(() => { const e = document.querySelector('.hdb-err'); return e ? e.innerText : ''; });
  is(/계약일/.test(err3) && /지어내지/.test(err3),
     '  <b>왜 안 되는지 그 자리에서</b> 말한다 — 「' + err3.slice(0, 42) + '…」');
  await page.evaluate(() => { document.getElementById('hdbCAt').value = '2026-09-01'; });
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(550);
  const w3c = await W();
  is(w3c.length === 1 && w3c[0].t === 'dbs' && w3c[0].pay && w3c[0].pay.contracted_at === '2026-09-01' &&
     w3c[0].pay.stage === '계약완료',
     '  날짜를 적으면 <b>단계와 날짜가 같이</b> 저장된다');
  is(!(await page.evaluate(() => !!document.querySelector('#hdbSheet.on'))), '  저장하면 창이 <b>닫힌다</b>');

  console.log('\n[4] 홈에서 <b>새 고객을 넣는다</b>');
  await page.evaluate(() => hdbNew()); await page.waitForTimeout(400);
  is(await page.evaluate(() => !!document.querySelector('#hdbSheet.on')), '  홈을 <b>안 벗어나고</b> 창이 뜬다');
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(400);
  is((await W()).length === 0, '  이름을 안 적으면 <b>저장이 안 된다</b>');
  await page.evaluate(() => { document.getElementById('hdbName').value = '홍길동새'; document.getElementById('hdbRegion').value = '순천'; });
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(600);
  const w4 = (await W()).filter(x => x.t === 'dbs');
  is(w4.length === 1 && w4[0].op === 'insert', '  <b>dbs 에 새 줄</b>을 넣었다');
  is(w4.length === 1 && w4[0].pay && w4[0].pay.customer_name === '홍길동새' &&
     w4[0].pay.assigned_to === 'me' && !!w4[0].pay.assigned_date,
     '  담당자와 배정일이 <b>같이</b> 들어간다 — ' +
     JSON.stringify(w4[0] && w4[0].pay && { who: w4[0].pay.assigned_to, got: w4[0].pay.assigned_date }));

  console.log('\n[5] 홈에서 <b>고치고 지운다</b>');
  await page.evaluate(() => hdbOpen('d1', '')); await page.waitForTimeout(350);
  await page.evaluate(() => { document.getElementById('hdbRegion').value = '광주'; });
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(500);
  const w5 = (await W()).filter(x => x.t === 'dbs');
  is(w5.length === 1 && w5[0].op === 'update' && w5[0].pay.region === '광주', '  고친 값이 <b>그 줄에</b> 저장된다');
  is((await page.evaluate(() => hdbRow('d1').region)) === '광주', '  화면이 든 줄도 같이 바뀐다');
  await page.evaluate(() => hdbOpen('d1', '')); await page.waitForTimeout(300);
  const nBefore = await page.evaluate(() => AR.db.length);
  await page.evaluate(() => hdbDel('d1')); await page.waitForTimeout(500);
  const w5b = (await W()).filter(x => x.t === 'dbs');
  is(w5b.length === 1 && w5b[0].op === 'delete' && w5b[0].id === 'd1', '  지우면 <b>dbs 에서 지운다</b>');
  is((await page.evaluate(() => AR.db.length)) === nBefore - 1, '  목록에서도 빠진다');

  console.log('\n[6] <b>남의 고객은 못 건드린다</b>');
  const other = await page.evaluate(() => {
    const r = hdbRow('d2');
    return { can: hdbCan(r), strip: hdbStripHtml({ k: 'db', id: 'd2', t: r.name }) };
  });
  is(other.can === false, '  설계사는 남의 고객을 <b>못 고친다</b>');
  is(/다른 분 고객/.test(other.strip) && !/올리기<\/button>/.test(other.strip),
     '  <b>단추를 아예 안 세운다</b> — 눌러도 안 되는 단추를 세우면 다른 단추도 안 믿게 된다 (8번)');
  await page.evaluate(() => hdbUp('d2')); await page.waitForTimeout(400);
  is((await W()).length === 0, '  불러도 <b>아무것도 안 나간다</b> — ' + (await say()).slice(0, 30));

  console.log('\n[8] <b>어느 단계로든</b> 옮긴다 — DB 통합 CRM 과 같은 열 칸 (5번)');
  /* 여태는 <b>한 칸 앞으로</b>만 갈 수 있었다. 되돌리거나 건너뛰려면
     DB 통합 CRM 까지 가야 했다. 사장님 말씀 — 「홈에서 고객관리가 모두
     이루어져야 된다」. */
  /* ⚠ 어느 줄이 화면에 섰는지는 <b>화면에게 묻는다</b>. 앞 자리에서 d1 을
     지우기까지 하므로, 여기서 이름을 손으로 적으면 엉뚱한 줄을 잡는다. */
  const rid = await page.evaluate(() => {
    const L = (typeof hmSteps === 'function') ? hmSteps() : [];
    for (let i = 0; i < L.length; i++)
      if (L[i].k === 'db') { const r = hdbRow(L[i].id); if (r && hdbCan(r)) return L[i].id; }
    return '';
  });
  is(!!rid, '  홈에 <b>내가 고칠 수 있는 줄</b>이 서 있다 — ' + (rid || '없음'));
  await page.evaluate(() => { HDB.sg = ''; hdbPaint(); }); await page.waitForTimeout(350);
  const b0 = await page.evaluate(() => {
    const e = document.querySelector('.hdb-sgb');
    return e ? { tag: e.tagName, cls: e.className, txt: (e.textContent || '').trim(),
                 h: Math.round(e.getBoundingClientRect().height),
                 open: !!document.querySelector('.hdb-sgs') } : null;
  });
  is(!!b0 && b0.tag === 'BUTTON', '  단계 딱지가 <b>누를 수 있다</b> — 옆에 새 단추를 안 세운다');
  is(!!b0 && b0.h >= 44, '  딱지가 손가락 크기다 — ' + (b0 ? b0.h : 0) + 'px');
  is(!!b0 && b0.open === false, '  고르개는 <b>접힌 채로</b> 시작한다 — 열 칸을 늘 펴면 홈이 길어진다');
  /* 색은 <b>한 곳</b>에서 온다 — 같은 고객이 두 화면에서 다른 색이면 안 된다 */
  is(!!b0 && /sg-(gray|yellow|red|blue|green)/.test(b0.cls),
     '  딱지 색이 <b>CRM 과 같은 다섯 가지</b>다 — ' + (b0 ? b0.cls : ''));
  const ixc = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const cblk = (ixc.split('function hdbColor(st){')[1] || '').split('function hdbNeeds(')[0];
  is(/APEX_STAGE\.color/.test(cblk), '  색을 <b>apex-stage 에게 묻는다</b>');
  const dbc = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');
  is(/APEX_STAGE\.colors/.test(dbc) && !/미접촉:"gray"/.test(dbc),
     '  DB 통합 CRM 도 <b>같은 곳</b>에서 읽는다 — 색표가 두 벌이 아니다 (5번)');

  await page.evaluate(i => hdbSgToggle(i), rid); await page.waitForTimeout(400);
  const chips = await page.evaluate(() => [...document.querySelectorAll('.hdb-sg')]
    .map(x => ({ t: (x.textContent || '').trim(), off: !!x.disabled, h: Math.round(x.getBoundingClientRect().height) })));
  const order = await page.evaluate(() => (window.APEX_STAGE && APEX_STAGE.order) ? APEX_STAGE.order.slice() : []);
  is(chips.length === order.length && chips.every((c, i) => c.t === order[i]),
     '  열 칸이 <b>apex-stage 차례 그대로</b> 선다 — ' + chips.map(c => c.t).join('·'));
  is(chips.every(c => c.h >= 44), '  칸마다 손가락 크기다');
  const cur = await page.evaluate(i => (hdbRow(i) || {}).stage || '', rid);
  is(chips.filter(c => c.off).length === 1 && (chips.find(c => c.off) || {}).t === cur,
     '  <b>지금 그 단계는 다시 못 누른다</b> — 눌러도 아무 일 없는 단추를 안 세운다 (8번) · ' + cur);

  /* ★ 날짜가 <b>안</b> 필요한 단계 — 그 자리에서 dbs 에 쓴다 */
  await W();
  await page.evaluate(i => hdbSgPick(i, '미접촉'), rid); await page.waitForTimeout(600);
  const back = await W();
  const bw = back.filter(x => x.t === 'dbs' && x.op === 'update');
  is(bw.length === 1 && bw[0].id === rid && bw[0].pay && bw[0].pay.stage === '미접촉',
     '  <b>되돌리는 것도 된다</b> — dbs.update {stage:"미접촉"} · ' + JSON.stringify(bw.map(x => x.pay)));
  is(await page.evaluate(() => !document.querySelector('.hdb-sgs')),
     '  고르고 나면 <b>저절로 접힌다</b>');
  /* ⚠ 맨 위 카드는 단계가 바뀌면 <b>다른 분으로 바뀔 수 있다</b>(급한 순서라).
     그러니 화면 맨 위가 아니라 <b>그 줄의 딱지</b>를 본다. */
  const st1 = await page.evaluate(i => ({ row: (hdbRow(i) || {}).stage || '',
    strip: hdbStripHtml({ k: 'db', id: i, t: 'x' }) }), rid);
  is(st1.row === '미접촉', '  손에 든 줄도 <b>바로 그 단계</b>가 된다 — ' + st1.row);
  is(/hdb-sgb[^>]*>미접촉/.test(st1.strip.replace(/\s+/g, ' ')),
     '  그 줄의 딱지도 <b>바로 그 단계</b>로 그려진다');

  /* ★ 날짜가 필요한 단계 — <b>쓰지 않고 묻는다</b> (1번).
     ⚠ 계약일이 <b>이미 적혀 있으면</b> 안 묻는 것이 맞다 — 있는 값을 또
     묻는 것도 성가심이다. 그래서 여기서는 <b>비워 놓고</b> 잰다. */
  await page.evaluate(() => { try { hdbClose(); } catch (e) {} }); await page.waitForTimeout(250);
  await page.evaluate(i => { hdbLocal(i, { cAt: '', pAt: '' }); HDB.sg = i; hdbPaint(); }, rid);
  await page.waitForTimeout(350);
  await W();
  await page.evaluate(i => hdbSgPick(i, '계약완료'), rid); await page.waitForTimeout(700);
  const ask = await W();
  const aw = ask.filter(x => x.t === 'dbs');
  const sheet = await page.evaluate(() => ({
    on: !!(document.getElementById('hdbSheet') || {}).classList &&
        document.getElementById('hdbSheet').classList.contains('on'),
    stage: (document.getElementById('hdbStage') || {}).value || '',
    dates: !(document.getElementById('hdbDates') || { hidden: true }).hidden
  }));
  is(aw.length === 0, '  계약완료로 고르면 <b>아무것도 안 쓴다</b> — 날짜를 지어내지 않는다 (1번)');
  is(sheet.on && sheet.stage === '계약완료' && sheet.dates,
     '  대신 <b>창을 띄워 날짜를 묻는다</b> — 단계 ' + sheet.stage + ' · 날짜칸 ' + (sheet.dates ? '열림' : '닫힘'));
  await page.evaluate(() => hdbClose()); await page.waitForTimeout(300);

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 홈 DB — 고칠 자리 ' + bad + '곳'
    : '✓ 홈 DB — 홈에서 어느 단계로든 옮기고 고객을 넣고 고칩니다. 쓰는 표도 색도 CRM 과 같습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
