/* ══════════════════════════════════════════════════════════════════
   check-daychain.js — <b>아침에 고른 그 분이 끝까지 따라오나.</b>

   2026-10-09. 사장님 말씀 —
     「계속 다음판만 되는데, <b>전체적인 활용</b>을 만들고 싶어」

   그래서 설계사처럼 <b>하루를 끝까지</b> 몰아 봤습니다. 아침 미션 ①②③④
   는 한 분을 이름·지역·단계·「1 / 3번째 분」 까지 들고 잘 갔습니다.
   그런데 <b>그 분에게서 나가는 문</b>이 둘 다 끊겨 있었습니다 —

     ❶ <b>「📇 이분 열기」 가 그 분을 안 열었습니다.</b> 고객 목록 전체가
       떴습니다(OSC.current=null). 아침에 고른 분을 <b>다시 손으로</b>
       찾으셔야 했습니다. ③ 의 「📇 번호 보고 걸기」 도 같은 자리라,
       번호를 보시려고 누르는 단추가 목록을 세웠습니다. 열 분이면
       <b>하루에 스무 번</b>입니다.
       까닭 — 보던 것이 x.go 뿐이었고, 배정 DB 에서 온 분은 go 가 'crm'
       입니다. <b>그때는 맞았습니다</b> — 배정 DB id 로는 고객 카드를 열
       수 없었으니까요. 그런데 2026-09-28 에 <b>다리</b>(client_meta.db)가
       놓였습니다. 물어볼 자리가 생긴 것을 이 단추가 몰랐습니다.

     ❷ <b>같은 이름 다른 분의 증권</b>이 올라왔습니다. hmBaOf 가
       chkFind 를 부르면서 <b>세 번째 칸(dbId)을 안 줬습니다.</b> 그러면
       그 자는 다리를 못 보고 <b>이름 글자</b>로만 붙습니다. 바로 그 함수
       위에 「이름으로 붙이면 <b>다른 분의 증권</b>을 그 분 것이라고 말하게
       됩니다 — 고객 앞에서 무너지는 자리입니다」 라고 적혀 있던 그
       자리입니다 (1번·3번). 단추도 「📄 보장분석 열기」 라고 <b>있다고</b>
       적혀 있었습니다.

     ❸ <b>⑥ 이 통째로 빈칸</b>이었습니다. hmChkHtml 은 세울 것이 없으면
       빈 글을 돌려줍니다 — 홈에서는 칸이 안 서면 되지만, 걸음 안에서는
       설명 한 줄과 체크 단추만 남습니다(124자). 고장인지 아무도 없는
       것인지 알 길이 없었습니다 (1번·6번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 아침에 고른 분이 <b>①②③④ 를 따라온다</b> — 이름이 그 칸에 있다
     [2] 「📇 이분 열기」 가 <b>그 분 카드</b>를 연다 (OSC.current.id)
     [3] <b>다리를 먼저</b> 본다 — 같은 이름 두 카드를 두고, 다리가
         가리키는 쪽이 뽑히는지. 이름 순서를 바꿔도 다리가 이긴다
     [4] 다리도 이름도 없으면 <b>지어내지 않는다</b> — 빈 글을 돌려주고
         왜 목록으로 가는지 적는다 (1번·6번)
     [5] ⑥ 이 <b>빈칸이 아니다</b> — 아무도 없을 때도 까닭과 길이 선다.
         그리고 <b>「모름」과 「없음」을 가린다</b> (1번)
     [6] 묻는 자리가 <b>하나</b>다 (5번) — hmCidOf 밖에서 chkFind(hmBaBy()…)
         를 부르는 자리가 없다. 두 벌이 되는 순간 한쪽만 고쳐진다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8961;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* ── [6] 먼저 — 브라우저를 안 띄우고 보는 것 ───────────────────────── */
console.log('[6] <b>묻는 자리가 하나</b>인가 (5번)');
{
  const src = fs.readFileSync('app/index.html', 'utf8');
  /* 「이 줄은 어느 카드인가」 를 묻는 꼴. hmCidOf 안에 <b>한 번만</b> 있어야 한다 */
  const 부르는곳 = (src.match(/chkFind\s*\(\s*hmBaBy\s*\(\s*\)/g) || []).length;
  is(부르는곳 === 1,
    '  chkFind(hmBaBy()…) 를 부르는 자리가 <b>한 곳</b>이다 — 지금 ' + 부르는곳 + '곳');
  const n = (src.match(/function\s+hmCidOf\s*\(/g) || []).length;
  is(n === 1, '  hmCidOf 가 <b>하나</b>다 — 지금 ' + n + '개');
  /* ★ 다리를 <b>정말 넘기나</b>. 칸을 안 주면 이름으로만 붙는다 — ❷ 의 그 자리 */
  const 몸 = (src.match(/function hmCidOf\(x\)\{[\s\S]*?\n\}/) || [''])[0];
  is(/chkFind\(hmBaBy\(\),hmBaName\(x\),/.test(몸),
    '  hmCidOf 가 chkFind 에 <b>세 번째 칸(다리)</b>을 넘긴다');
  is(/src===.cli./.test(몸),
    '  고객 365일에서 온 줄은 <b>id 가 이미 카드 id</b> 라고 가른다 (TDO 한 곳)');
  const o = (src.match(/function hmMsOpen\(\)\{[\s\S]*?\n\}/) || [''])[0];
  is(/hmCidOf\(x\)/.test(o), '  hmMsOpen 이 hmCidOf 에게 묻는다');
  is(/function\s+hmGoCli\s*\(/.test(src), '  hmGoCli — <b>카드를 세우고 확인하는</b> 자리가 있다');
  const g = (src.match(/function hmBaGo\(cid\)\{[\s\S]*?\n\}/) || [''])[0];
  is(/hmGoCli\(cid\)/.test(g) && !/OSC\.current&&OSC\.current\.id===cid/.test(g),
    '  hmBaGo 가 같은 확인을 <b>따로 하지 않는다</b> — hmGoCli 를 부른다 (5번)');
}

/* ── 씨 ────────────────────────────────────────────────────────────
   ★ 점검 데이터의 이름은 <b>홍길동</b> 입니다 (3번).
   ★ 「같은 이름 두 분」 을 일부러 둡니다 — ❷ 는 그 자리에서만 보입니다.
     c9 를 cliRows 에 <b>먼저</b> 두어, 이름으로 붙으면 c9 가 이기게 합니다. */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 window.__T='';
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 /* 🌉 다리 — d1 은 c1 입니다. 사람이 「내 고객으로」 를 눌러 놓은 것입니다 */
 CM.meta=${o.bridge === false ? '{}' : "{c1:{db:'d1'}}"};
 var CLI=${o.twin === false
   ? "[{id:'c1',who:'me',name:'홍길동',nm:'홍길동',name_masked:'홍○○'}]"
   : "[{id:'c9',who:'me',name:'홍길동',nm:'홍길동',name_masked:'홍○○'},"+
     " {id:'c1',who:'me',name:'홍길동',nm:'홍길동',name_masked:'홍○○'}]"};
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.db=${o.hold === 'wait' ? 'null' : `[
   {id:'d1',who:'me',name:'홍길동',stage:'TA',   days:5,region:'서울 강남구',src:'DB'},
   {id:'d2',who:'me',name:'홍길순',stage:'미접촉',days:7,region:'서울 서초구',src:'DB'}${
     o.chk === false ? '' :
   `,{id:'d4',who:'me',name:'홍만복',stage:'AP', days:2,region:'서울 강남구',src:'DB'}`}]`};
 AR.cliRows=${o.nocli ? '[]' : 'CLI'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=${o.nolist ? '[]' : "CLI.map(function(c){return {id:c.id,name:c.name,nm:c.nm,name_masked:c.name_masked,who:'me',owner:'me'};})"};
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.noSum=false;CHKS.fin={};CHKS.at='00:00';
 /* 증권은 <b>c9(남의 카드)</b> 에만 있습니다 — 다리를 안 보면 「열기」 가 뜹니다 */
 CHKS.by={c9:{at:'2026-09-01',sum:{top:{gain:[{n:'암진단비',b:1000,a:9000}],loss:[]}}}};
 try{localStorage.removeItem('apex_hm_fold_v1');localStorage.removeItem('apex_ck_day');}catch(e){}
 HWHO.id='';go('home');`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (o) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED(o || {})); await p.waitForTimeout(2200);
    /* 미션 칸은 <b>접힌 채로</b> 섭니다 — 안 펴고 재면 속이 없습니다 */
    await p.evaluate(() => { try{ if(!hmFoldOpen('ms'))hmFoldToggle('ms'); }catch(e){} });
    await p.waitForTimeout(260);
    return { ctx, p, errs };
  };
  const 걸음 = async (p, i) => { await p.evaluate(j => { HM_MSP.j = j; hmMsPaint(); }, i); await p.waitForTimeout(300); };
  const 글 = (p) => p.evaluate(() => { const e = document.getElementById('hmMsHost'); return e ? (e.innerText || '') : ''; });

  const A = await open({});

  console.log('\n[1] 아침에 고른 분이 <b>①②③④ 를 따라온다</b>');
  const 그분 = await A.p.evaluate(() => { try{ hmMsPick(0); }catch(e){}
    try{ const w = hmMsWho(); return w ? (w.nm || w.name || '') : ''; }catch(e){ return ''; } });
  is(!!그분, '  아침 큐에 한 분이 섰다 — ' + (그분 || '(아무도 없음)'));
  const 이름 = ['① 오늘의 알림','② 어떻게 연락할지','③ 전화','④ 카톡'];
  for (let j = 0; j < 4; j++) {
    await 걸음(A.p, j);
    const t = await 글(A.p);
    is(!!그분 && t.indexOf(그분) >= 0,
      '  ' + 이름[j] + ' 에 <b>그 분</b>이 있다 (' + t.replace(/\s+/g,' ').trim().length + '자)');
  }

  console.log('\n[2] 「📇 이분 열기」 가 <b>그 분 카드</b>를 연다');
  const r2 = await A.p.evaluate(() => {
    const o = {};
    try{ go('home'); hmMsPick(0); OSC.current = null; }catch(e){}
    try{ o.cid = hmCidOf(hmMsWho()); }catch(e){ o.cid = 'X'; }
    try{ hmMsOpen(); }catch(e){ o.터짐 = e.message.slice(0, 60); }
    try{ o.열린카드 = OSC.current ? OSC.current.id : null; }catch(e){}
    o.토스트 = window.__T || '';
    return o;
  });
  is(!r2.터짐, '  눌러도 안 터진다' + (r2.터짐 ? ' — ' + r2.터짐 : ''));
  is(!!r2.열린카드, '  <b>그 분 카드가 열렸다</b> — ' + (r2.열린카드 || '아무것도 안 열림(목록만 떴습니다)'));

  console.log('\n[3] <b>다리를 먼저</b> 본다 — 같은 이름 두 분이 있을 때 (1번·3번)');
  const r3 = await A.p.evaluate(() => {
    const o = {};
    try{ go('home'); hmMsPick(0); const w = hmMsWho();
      o.다리 = hmCidOf(w);
      const bd = (typeof olByDb === 'function') ? olByDb() : null;
      o.다리가가리키는것 = (bd && bd['d1']) ? bd['d1'].id : null;
      o.이름으로 = (function(){ try{ const c = chkFind(hmBaBy(), w.nm); return c ? c.id : null; }catch(e){ return null; } })();
      const ba = hmBaOf(w); o.ba = ba ? ba.cid : null; o.상태 = ba ? ba.s : null;
      o.단추 = hmBaBtn(w).replace(/<[^>]*>/g, '');
    }catch(e){ o.X = e.message.slice(0, 70); }
    return o;
  });
  is(r3.다리가가리키는것 === 'c1' && r3.이름으로 === 'c9',
    '  자가 제대로 섰다 — 다리는 c1, 이름으로는 c9 (지금 ' + r3.다리가가리키는것 + ' / ' + r3.이름으로 + ')');
  is(r3.다리 === 'c1', '  hmCidOf 가 <b>다리</b>를 따른다 — ' + r3.다리);
  is(r3.ba === 'c1',
    '  hmBaOf 도 <b>같은 답</b>이다 — ' + r3.ba + (r3.ba === 'c9' ? ' ⚠ <b>남의 증권</b>입니다' : ''));
  is(r3.상태 === 'none' && r3.단추.indexOf('넣기') >= 0,
    '  그러니 단추가 <b>「넣기」</b> 다 — 이 분 증권은 없습니다 (지금 「' + r3.단추.trim() + '」)');

  console.log('\n[5] ⑥ 이 <b>빈칸이 아니다</b>');
  await 걸음(A.p, 5);
  const t6 = (await 글(A.p)).replace(/\s+/g, ' ').trim();
  is(t6.length > 200, '  사람이 있을 때 ⑥ 이 선다 (' + t6.length + '자)');
  const B = await open({ chk: false });
  await 걸음(B.p, 5);
  const t6b = (await 글(B.p)).replace(/\s+/g, ' ').trim();
  is(t6b.length > 200, '  <b>AP·PC·CS 가 아무도 없을 때도</b> 까닭이 선다 (' + t6b.length + '자)');
  is(t6b.indexOf('지어내지 않습니다') >= 0 || t6b.indexOf('없습니다') >= 0,
    '  「없습니다」 라고 <b>말로</b> 적는다 — 빈칸으로 두지 않는다');
  is(/고객 체크 열기|KB보장분석 넣기/.test(t6b), '  <b>길이 있다</b> — 단추를 감추지 않는다 (6번)');
  const C = await open({ chk: false, hold: 'wait' });
  await 걸음(C.p, 5);
  const t6c = (await 글(C.p)).replace(/\s+/g, ' ').trim();
  is(t6c.indexOf('모름') >= 0 || t6c.indexOf('안 받아') >= 0,
    '  <b>아직 안 받아 온 것</b>은 「모름」 이라고 적는다 — 0명이 아니다 (1번)');

  console.log('\n[4] 다리도 이름도 없으면 <b>지어내지 않는다</b> (1번)');
  const D = await open({ bridge: false, twin: false, nocli: true });
  const r4 = await D.p.evaluate(() => {
    const o = {};
    try{ go('home'); hmMsPick(0); OSC.current = null; window.__T = ''; }catch(e){}
    try{ o.cid = hmCidOf(hmMsWho()); }catch(e){ o.cid = 'X'; }
    try{ hmMsOpen(); }catch(e){ o.터짐 = e.message.slice(0, 60); }
    try{ o.열린카드 = OSC.current ? OSC.current.id : null; }catch(e){}
    /* 「지금 어느 화면인가」 는 currentTab() 한 곳에만 묻습니다 (5번) */
    try{ o.화면 = currentTab(); }catch(e){ o.화면 = '(못 물음)'; }
    o.토스트 = window.__T || '';
    return o;
  });
  is(r4.cid === '', '  카드를 못 찾으면 <b>빈 글</b>이다 — 비슷한 이름을 안 고른다 (지금 「' + r4.cid + '」)');
  is(!r4.열린카드, '  <b>엉뚱한 카드를 안 연다</b>');
  is(/못 찾았습니다/.test(r4.토스트), '  <b>왜 목록인지 적는다</b> — 「' + (r4.토스트 || '(아무 말도 안 함)').slice(0, 56) + '」');
  is(r4.화면 === 'crm' || r4.화면 === 'clients', '  그리고 <b>목록으로 모신다</b> — ' + r4.화면);

  console.log('');
  const 터짐 = [...A.errs, ...B.errs, ...C.errs, ...D.errs];
  is(터짐.length === 0, '하루를 다 걷는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? ' — ' + 터짐[0] : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 끊겼습니다.') : '\n✓ 아침에 고른 그 분이 끝까지 따라옵니다.');
  process.exit(bad ? 1 : 0);
})();
