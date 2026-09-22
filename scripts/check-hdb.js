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
 /* 서버에 있는 <b>온전한 줄</b> — 목록(AR.db)은 이 중 몇 칸만 읽어 온다.
    고치기 창은 <b>여기서 다시 받아</b> 세워야 한다 — 목록에 없는 칸을 빈칸으로
    세우고 저장하면 <b>연락처가 지워진다</b>. 실제로 그러고 있었다. */
 window.__DBROW={
  d1:{id:'d1',assigned_to:'me',assigned_date:'2026-09-01',customer_name:'홍길동A',
      phone:'010-1111-2222',region:'순천',source:'보장분석3DB',report_name:'보장분석 3DB',
      memo:'첫 통화 전',stage:'미접촉',contracted_at:null,policy_sent_at:null,
      policy_no:null,touch_count:null},
  d9:{id:'d9',assigned_to:'me',assigned_date:'2026-09-05',customer_name:'홍길동Z',
      phone:'010-3333-4444',region:'대전',source:'일반',report_name:'보장분석 3DB',
      memo:'',stage:'CS',contracted_at:null,policy_sent_at:null,policy_no:null,touch_count:3},
  d2:{id:'d2',assigned_to:'u3',assigned_date:'2026-09-02',customer_name:'홍갑돌이',
      phone:'010-5555-6666',region:'천안',source:'일반',report_name:'보장분석 3DB',
      memo:'',stage:'TA',contracted_at:null,policy_sent_at:null,policy_no:null,touch_count:null}};
 window.__RD=[];        /* 읽기를 몇 번 했나 (7번) */
 window.__NOCOL='';     /* 서버에 아직 없는 칸을 틀어지는 자리 */
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
       select:function(c){st.sel=true;st.cols=c||'';return api;},order:function(){return api;},range:function(){return api;},
       limit:function(){return api;},single:function(){return api;},gte:function(){return api;},
       'in':function(){return api;},is:function(){return api;},neq:function(){return api;},not:function(){return api;},
       eq:function(k,v){st.id=v;return api;},
       then:function(ok,no){
         /* ★ <b>읽기는 「나간 글」이 아니다.</b> 예전엔 읽기도 __W 에 쌓았는데,
            그러면 「날짜가 필요한 단계는 그냥 안 올린다」 같은 줄이 고치기 창이
            줄을 한 번 읽었다는 이유로 빨간불이 된다. 쓰기만 센다. */
         if(!st.op){
           window.__RD.push({t:st.tbl,id:st.id,c:st.cols||''});
           var one=[];
           if(st.tbl==='dbs'&&st.id&&window.__DBROW&&window.__DBROW[st.id]){
             /* 서버에 <b>아직 없는 칸</b>을 물으면 PostgREST 는 통째로 거절한다 */
             if(window.__NOCOL&&(''+(st.cols||'')).indexOf(window.__NOCOL)>=0)
               return Promise.resolve({data:null,error:{message:'column dbs.'+window.__NOCOL+' does not exist'}}).then(ok,no);
             var src=window.__DBROW[st.id],cp={},kk;
             for(kk in src)if(src.hasOwnProperty(kk))cp[kk]=src[kk];
             one=[cp];
           }
           return Promise.resolve({data:one,error:null}).then(ok,no);
         }
         window.__W.push({t:st.tbl,op:st.op,id:st.id,pay:st.pay});
         /* ★ 진짜 서버처럼 <b>몇 줄을 바꿨는지</b> 돌려준다.
            Supabase 는 RLS 로 막힌 UPDATE·DELETE 를 <b>에러가 아니라 0줄</b>로
            돌려준다 — 여태 이 가짜 서버가 늘 빈 배열만 줘서, 앱이 「0줄인데
            됐다고 말하는」 병을 <b>한 번도 못 봤다</b>(2026-09-21).
            window.__RLS 를 켜면 그 자리를 그대로 만든다. */
         /* ★ <b>.select() 를 부른 쪽에만</b> 줄을 돌려준다 — 진짜 PostgREST
            가 그렇다. 안 부르면 data 가 없고, 그러면 「0줄」인지 「안 알려
            줌」인지 <b>구분할 수 없다</b>(1번). 여기서 늘 돌려주면 앱이
            .select() 를 빠뜨려도 점검이 초록이라 그대로 나간다 (8번). */
         if(st.op&&!st.sel)return Promise.resolve({error:null}).then(ok,no);
         var rows=(!st.op)?[]:(window.__RLS?[]:[{id:st.id||'new-1'}]);
         return Promise.resolve({data:rows,error:null}).then(ok,no);
       }
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
  is(!/올리기<\/button>/.test(other.strip) && !/hdbSgToggle/.test(other.strip),
     '  <b>단추를 아예 안 세운다</b> — 눌러도 안 되는 단추를 세우면 다른 단추도 안 믿게 된다 (8번)');
  /* 「못 고칩니다」 만 적으면 고장으로 보인다 — <b>누구 것이고 누가 고칠 수
     있는지</b>까지 적어야 다음에 무엇을 할지 아신다 (1번) */
  is(/못 바꿉니다|못 고칩니다/.test(other.strip) && /담당 설계사/.test(other.strip) && /대표/.test(other.strip),
     '  <b>왜 안 되는지·누가 할 수 있는지</b> 적는다 — ' +
     ((other.strip.replace(/<[^>]*>/g,'').match(/이분은[^.]*\./)||[''])[0]||'(못 읽음)').slice(0,56));
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

  console.log('\n[9] <b>서버가 안 받으면 「됐습니다」라고 하지 않는다</b>');
  /* ══ 이 저장소에서 제일 비싸게 배운 자리 (2026-09-21) ══════════════
     사장님 말씀 — 「홈화면에서 다 되게하자 했는데 안된다」.
     진짜 DB 에 대표 계정으로 눌러 보고 알았습니다. Supabase 는 RLS 로 막힌
     <b>UPDATE·DELETE 를 에러가 아니라 「0줄 바뀜」</b>으로 돌려줍니다.
     우리는 res.error 만 보고 성공으로 쳐서, 화면을 바꾸고 「홍길동 님 ·
     TA → AP」 토스트까지 띄웠습니다. <b>새로고침하면 원래대로.</b>
     재 본 값 — 대표(master)가 팀원 고객을 바꾸면 0줄, 지우면 0줄.

     점검이 이걸 못 본 까닭은 <b>가짜 서버가 늘 빈 배열만</b> 줬기 때문입니다.
     빈 배열은 「0줄」인데 우리는 그것을 성공으로 읽고 있었으니, 점검은
     <b>거짓말하는 판을 그대로 통과</b>시켰습니다 (8번).
     이제 가짜 서버가 <b>몇 줄을 바꿨는지</b> 말하고, __RLS 로 막힌 자리를
     그대로 만들어 봅니다.                                             */
  /* 앞 칸들이 d1 을 지웠으므로 <b>여기서 쓸 줄을 새로 심는다</b> —
     남은 것에 기대면 앞 칸을 고칠 때마다 여기가 같이 깨진다 */
  const rid9 = await page.evaluate(() => {
    AR.db.push({ id: 'z9', who: 'me', name: '홍길동Z9', region: '순천', src: '일반',
                 stage: 'TA', days: 4, n: 1, res: '부재', cAt: '', pAt: '' });
    hdbPaint(); return 'z9';
  });
  await page.waitForTimeout(300);
  is((await page.evaluate(i => !!hdbRow(i), rid9)) === true, '  잴 줄을 심었다 — ' + rid9);
  const st9 = await page.evaluate(i => hdbRow(i).stage, rid9);
  const n9  = await page.evaluate(i => hdbRow(i).n || 0, rid9);
  const len9 = await page.evaluate(() => AR.db.length);
  await page.evaluate(() => { window.__RLS = true; window.__T = ''; });

  await page.evaluate(i => hdbTo(i, 'AP'), rid9); await page.waitForTimeout(600);
  const r9a = await page.evaluate(i => ({ stage: hdbRow(i).stage, t: window.__T || '', err: HDB.err }), rid9);
  is(r9a.stage === st9,
     '  0줄이면 <b>손에 든 값도 안 고친다</b> — ' + st9 + ' 그대로 (화면만 바뀌면 거짓말이 된다)');
  is(!/→/.test(r9a.t) && /받지 않았습니다|권한/.test(r9a.t + r9a.err),
     '  <b>「됐습니다」라고 안 한다</b> — 「' + (r9a.t || r9a.err || '아무 말 없음').slice(0, 46) + '」');
  is(/담당 설계사|대표/.test(r9a.t + r9a.err),
     '  <b>누가 고칠 수 있는지</b>까지 말한다 (1번)');

  await page.evaluate(() => { window.__T = ''; });
  await page.evaluate(i => hdbCall(i, '부재'), rid9); await page.waitForTimeout(600);
  is((await page.evaluate(i => hdbRow(i).n || 0, rid9)) === n9,
     '  통화 기록도 <b>0줄이면 접촉 횟수를 안 올린다</b> — ' + n9 + '회 그대로');

  await page.evaluate(() => { window.__T = ''; HDB.id = ''; });
  await page.evaluate(i => hdbDel(i), rid9); await page.waitForTimeout(700);
  is((await page.evaluate(() => AR.db.length)) === len9,
     '  <b>0줄이면 목록에서도 안 지운다</b> — ' + len9 + '줄 그대로');

  /* ★ 막힌 것만 잡고 <b>되는 것은 그대로</b> 되어야 한다 — 늘 빨간불인
     점검은 안 울리는 알람만큼 나쁘다 (8번) */
  await page.evaluate(() => { window.__RLS = false; window.__T = ''; });
  await page.evaluate(i => hdbTo(i, 'AP'), rid9); await page.waitForTimeout(600);
  const r9b = await page.evaluate(i => ({ stage: hdbRow(i).stage, t: window.__T || '' }), rid9);
  is(r9b.stage === 'AP' && /→/.test(r9b.t),
     '  <b>서버가 받으면 그대로 된다</b> — ' + (r9b.t || '(말 없음)').slice(0, 40));

  console.log('\n[10] <b>고칠 수 있는 사람 명단이 서버와 같다</b>');
  /* 서버(public.is_editor_all): admin·owner·master·hq·branch_manager.
     앱이 더 넓으면 <b>단추는 뜨는데 0줄</b>이 되고, 더 좁으면 할 수 있는
     일을 못 하게 막는다. 2026-09-21 사장님 결정 — 대표·본부장까지,
     지점장(leader)은 보기만. */
  const ROLE9 = await page.evaluate(() => {
    const out = {}, real = OS.profile.role;
    ['member', 'leader', 'manager', 'education_manager', 'branch_manager', 'master', 'admin', 'owner']
      .forEach(function (rr) { OS.profile.role = rr; out[rr] = hdbCan(hdbRow('d2')); });
    OS.profile.role = real;
    return out;
  });
  is(ROLE9.master === true && ROLE9.branch_manager === true &&
     ROLE9.admin === true && ROLE9.owner === true,
     '  대표·본부장·관리자는 <b>팀원 고객을 고칠 수 있다</b>');
  is(ROLE9.leader === false && ROLE9.member === false &&
     ROLE9.manager === false && ROLE9.education_manager === false,
     '  지점장·교육담당·설계사는 <b>남의 고객에 단추가 안 뜬다</b> — 서버가 안 받는 자리다');
  const src9 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const m9 = src9.match(/HDB_EDIT_ROLES\s*=\s*\[([^\]]*)\]/);
  is(!!m9 && /master/.test(m9[1]) && /branch_manager/.test(m9[1]) && !/leader/.test(m9[1]),
     '  명단이 <b>한 곳</b>에 적혀 있다 (HDB_EDIT_ROLES) — ' + (m9 ? m9[1].replace(/['"\s]/g, '') : '못 읽음'));


  /* ══════════════════════════════════════════════════════════════════
     사장님 말씀 ④ (2026-09-22) —
       「DB통합CRM 페이지를 홈에서 <b>모두 수정</b> [절대 데이터가 깨지지
        않아야 됨]」

     깨지고 있었습니다. 목록(AR.db)은 서버에서 <b>연락처를 안 읽어 옵니다</b>.
     그런데 고치기 창에는 연락처 칸이 있었습니다 — 언제나 빈칸이었고, 그대로
     저장하면 서버의 전화번호가 <b>지워졌습니다.</b> 여기가 그것을 잡는 자리.
     ══════════════════════════════════════════════════════════════════ */
  console.log('\n[11] <b>목록에 없는 칸을 빈칸으로 저장하지 않는다</b> (사장님 말씀 ④)');
  /* 앞에서 d1 을 지웠으니 재는 줄을 하나 심습니다 — 목록에는 <b>몇 칸만</b>,
     서버에는 <b>온전히</b>. 그 차이가 이 절이 재려는 것입니다. */
  await page.evaluate(() => {
    AR.db.push({id:'d7',who:'me',name:'홍길동C',region:'순천',src:'보장분석3DB',
      stage:'미접촉',days:4,n:0,res:'미진행',cAt:'',pAt:''});
    window.__DBROW.d7={id:'d7',assigned_to:'me',assigned_date:'2026-09-01',customer_name:'홍길동C',
      phone:'010-1111-2222',region:'순천',source:'보장분석3DB',report_name:'보장분석 3DB',
      memo:'첫 통화 전',stage:'미접촉',contracted_at:null,policy_sent_at:null,
      policy_no:null,touch_count:null};
    window.__RD = []; hdbOpen('d7', '');
  });
  await page.waitForTimeout(500);
  const F11 = await page.evaluate(() => {
    const g = i => { const e = document.getElementById(i); return e ? e.value : null; };
    return { phone: g('hdbPhone'), memo: g('hdbMemo'), rep: g('hdbRep'),
      got: g('hdbGot'), name: g('hdbName'), region: g('hdbRegion'),
      touch: g('hdbTouch'), reads: window.__RD.filter(x => x.t === 'dbs').length,
      listPhone: (hdbRow('d7') || {}).phone };
  });
  /* ★ 목록에는 연락처가 <b>없습니다</b>. 그래서 창은 서버에서 그 한 줄을
     다시 받아야만 연락처를 알 수 있습니다 (7번 — 필요할 때 그 한 줄만). */
  is(F11.listPhone === undefined || F11.listPhone === null || F11.listPhone === '',
     '  목록(AR.db)에는 <b>연락처가 없다</b> — 그래서 목록으로 칸을 채우면 안 된다');
  is(F11.reads === 1, '  창을 열 때 <b>그 한 줄만</b> 다시 받는다 — dbs 읽기 ' + F11.reads + '번 (7번)');
  is(F11.phone === '010-1111-2222',
     '  연락처 칸에 <b>서버의 값</b>이 들어 있다 — 「' + F11.phone + '」');
  is(F11.memo === '첫 통화 전', '  <b>비고</b>도 서버의 값이다 — 「' + F11.memo + '」');
  is(F11.rep === '보장분석 3DB', '  <b>보고서 이름</b> 칸이 섰다 — 「' + F11.rep + '」');
  is(F11.got === '2026-09-01', '  <b>배정일</b>도 고칠 수 있다 — 「' + F11.got + '」');
  is(F11.touch === '', '  터치 횟수는 <b>안 적힌 채로</b> 온다 — 0 으로 깔지 않는다 (1번)');

  await W();   /* 앞 절이 남긴 글을 비운다 — 안 비우면 옵 절의 글을 집는다 */
  await page.evaluate(() => { document.getElementById('hdbRegion').value = '광양'; });
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(550);
  const w11 = (await W()).filter(x => x.t === 'dbs');
  const p11 = (w11[w11.length - 1] || {}).pay || {};
  /* ★ 여기가 <b>사장님이 못 박으신 자리</b>입니다. 지역만 고쳤는데 연락처가
     null 로 나가면, 저장하는 순간 전화번호가 사라집니다. */
  is(p11.phone === '010-1111-2222',
     '  지역만 고쳤는데 <b>연락처가 그대로 나간다</b> — ' + JSON.stringify(p11.phone));
  is(p11.memo === '첫 통화 전', '  <b>비고도 그대로</b> 나간다 — ' + JSON.stringify(p11.memo));
  is(p11.report_name === '보장분석 3DB', '  <b>보고서 이름도 그대로</b> 나간다');
  is(p11.assigned_date === '2026-09-01', '  <b>배정일도 그대로</b> 나간다');
  is(p11.region === '광양', '  고친 것은 <b>고친 대로</b> 나간다');
  is(p11.touch_count === null, '  터치 횟수는 <b>null(모름)</b> 로 나간다 — 0 이 아니다 (1번)');

  console.log('\n[12] <b>DB 통합 CRM 이 고치는 칸을 홈도 다 고친다</b> (5번)');
  /* 글에서 뽑아 견줍니다 — 손으로 베껴 적으면 저쪽이 늘어도 여기는 모릅니다 */
  const crm = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');
  const sv = crm.split('async function saveDb()')[1] || '';
  const body = sv.split('const put=')[0];
  const want = {};
  (body.match(/payload\s*=\s*\{([^}]*)\}/) || ['', ''])[1]
    .split(',').forEach(x => { const k = (x.split(':')[0] || '').trim(); if (/^[a-z_]+$/.test(k)) want[k] = 1; });
  (body.match(/payload\.[a-z_]+\s*=/g) || []).forEach(x => { want[x.replace(/payload\.|\s*=/g, '')] = 1; });
  /* created_by 는 <b>새로 넣을 때만</b> 쓰는 칸이라 고치기에서는 안 봅니다 */
  delete want.created_by;
  const need = Object.keys(want).sort();
  const miss = need.filter(k => !(k in p11));
  is(need.length >= 12, '  CRM 이 고치는 칸을 <b>글에서 뽑았다</b> — ' + need.length + '칸 · ' + need.join(','));
  /* 담당자(assigned_to)는 <b>대표·본부장만</b> 바꿉니다 — 바로 밑에서 잽니다 */
  is(miss.length === 0 || (miss.length === 1 && miss[0] === 'assigned_to'),
     '  홈이 보낸 글에 <b>그 칸이 다 있다</b>' + (miss.length ? ' — 빠진 것 ' + miss.join(',') : ''));

  console.log('\n[13] <b>담당자는 대표·본부장만</b> 바꾼다 — 못 할 분께 고르개를 안 낸다 (8번)');
  const W13 = await page.evaluate(() => {
    const out = {};
    const r0 = OS.profile.role;
    ['member', 'leader', 'master'].forEach(role => {
      OS.profile.role = role;
      out[role] = hdbWhoList().length;
    });
    OS.profile.role = r0;
    return out;
  });
  is(W13.member === 0 && W13.leader === 0, '  설계사·지점장에게는 <b>고르개가 안 뜬다</b> — 서버가 안 받는 자리다');
  is(W13.master >= 2, '  대표는 <b>팀원 중에서 고른다</b> — ' + W13.master + '명');
  await page.evaluate(() => { OS.profile.role = 'master'; hdbOpen('d7', ''); });
  await page.waitForTimeout(500);
  is(await page.evaluate(() => !!document.getElementById('hdbWho')), '  대표가 열면 <b>담당자 고르개</b>가 선다');
  await W();
  await page.evaluate(() => { document.getElementById('hdbWho').value = 'u3'; });
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(550);
  const W13b = (await W()).filter(x => x.t === 'dbs');
  const p13 = (W13b[W13b.length - 1] || {}).pay || {};
  is(p13.assigned_to === 'u3', '  고른 담당자가 <b>그대로 나간다</b> — ' + JSON.stringify(p13.assigned_to));
  is(p13.phone === '010-1111-2222', '  담당자를 바꿔도 <b>연락처는 그대로</b>다');
  /* 담당자를 바꿨 덩에 그 줄은 <b>남의 것</b>이 되었다 — 다음 절을 위해 되돌린다 */
  await page.evaluate(() => {
    OS.profile.role = 'member';
    const r = hdbRow('d7'); if (r) r.who = 'me';
    window.__DBROW.d7.assigned_to = 'me';
  });

  console.log('\n[14] <b>못 읽었으면 고치는 칸을 안 연다</b> (1번)');
  await page.evaluate(() => { const b = window.__DBROW.d9; window.__DBROW.d9 = null; hdbOpen('d9', ''); window.__d9 = b; });
  await page.waitForTimeout(500);
  const F14 = await page.evaluate(() => ({
    open: !!document.querySelector('#hdbSheet.on'),
    name: !!document.getElementById('hdbName'),
    save: !!document.querySelector('.hdb-save[onclick*="hdbSave"]'),
    err: (document.querySelector('.hdb-err') || {}).innerText || ''
  }));
  is(F14.open === true, '  창은 뜬다 — 눌렀는데 아무 일도 안 나면 고장으로 보인다');
  is(F14.name === false, '  <b>고칠 칸을 안 세운다</b> — 빈칸으로 저장하면 값이 지워진다');
  is(F14.save === false, '  <b>저장 단추도 안 세운다</b>');
  is(/못 읽었|서버에 없/.test(F14.err), '  <b>왜인지 말한다</b> — 「' + F14.err.slice(0, 40) + '…」');
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(400);
  is((await W()).filter(x => x.t === 'dbs').length === 0, '  불러도 <b>아무것도 안 나간다</b>');
  await page.evaluate(() => { window.__DBROW.d9 = window.__d9; hdbClose(); });

  console.log('\n[15] <b>옛 서버에서도 일이 안 막힌다</b> — 칸이 없으면 그것만 빼고 연다');
  await page.evaluate(() => { window.__NOCOL = 'touch_count'; window.__RD = []; hdbOpen('d7', ''); });
  await page.waitForTimeout(600);
  const F15 = await page.evaluate(() => ({
    name: (document.getElementById('hdbName') || {}).value,
    phone: (document.getElementById('hdbPhone') || {}).value,
    touch: !!document.getElementById('hdbTouch'),
    reads: window.__RD.filter(x => x.t === 'dbs').length
  }));
  is(F15.reads === 2, '  한 번 거절당하면 <b>그 칸만 빼고 다시</b> 묻는다 — 읽기 ' + F15.reads + '번');
  is(F15.name === '홍길동C' && F15.phone === '010-1111-2222', '  나머지 칸은 <b>그대로 열린다</b> — 일이 안 막힌다');
  is(F15.touch === false, '  <b>없는 칸은 안 세운다</b> — 세워 두면 빈칸으로 저장된다');
  await W();
  await page.evaluate(() => hdbSave()); await page.waitForTimeout(550);
  const W15 = (await W()).filter(x => x.t === 'dbs');
  const p15 = (W15[W15.length - 1] || {}).pay || {};
  is(!('touch_count' in p15) && !('policy_no' in p15),
     '  <b>안 읽은 칸은 안 보낸다</b> — ' + JSON.stringify(Object.keys(p15).filter(k => /touch|policy_no/.test(k))));
  is(p15.phone === '010-1111-2222', '  옛 서버에서도 <b>연락처는 안 지워진다</b>');
  await page.evaluate(() => { window.__NOCOL = ''; });
  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 홈 DB — 고칠 자리 ' + bad + '곳'
    : '✓ 홈 DB — 홈에서 어느 단계로든 옮기고 고객을 넣고 고칩니다. 쓰는 표도 색도 CRM 과 같습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
