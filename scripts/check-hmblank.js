/* ══ 📝 check-hmblank — 「이분 끝」 뒤에 빈칸 하나만 (판 X288) ══════════════════
   사장님 말씀 (2026-10-31) 「고객 관리를 위해 어떻게 하면 좋을까」 → 고르신 둘째.
   고객 162분 중 생년을 아는 분이 33분(2026-10-13)이라, 만날 때마다 한 칸씩 채웁니다.

   묻는 것
     [1] 「이분 끝」 을 누르면 그 분의 빈칸 <b>하나</b>가 뜨나 · 이름을 가리나 (3번)
     [2] 비운 채 저장은 안 받나(「모름」 을 「없음」 으로 안 바꿈 · 1번) · 해가 이상하면 안 받나
     [3] 저장하면 <b>그 표·그 칸 하나</b>만 바꾸나 · 서버를 한 번만 부르나 (7번)
     [4] 「다음에」 는 서버를 안 부르고 오늘만 안 묻나
     [5] 차례가 표(HM_BLANK) 그대로 — 생년 → 가족 → (배정 DB 는) 계약일
     [6] ★ 배정 DB 분께는 생년을 <b>안 묻나</b>(담을 칸이 없음 · 1번) · 남의 고객이면 안 묻나
     [7] 누르는 자리 44px
     [8] 🏘 배정 DB 분께 <b>사시는 동네</b>를 여쭙나 (판 X367 · 사장님 말씀 2026-11-06 「지역동선으로
         설계사의 상담 효율을 높여」 → 「동네(동) 모으기」) — 통화가 닿은 단계만 · 이미 있으면 안 물음 ·
         동네 칸을 못 읽은 서버면 안 물음(1번) · 「순천」 처럼 동네가 아닌 글은 안 받음 ·
         「순천시 조례동 12-3」 은 <b>조례동만</b> 담음(번지 버림 · 3번) · dbs.dong 하나만 · 서버 한 번
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9053;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 「홍길동」 (3번). 계약완료인데 계약일이 빈 배정 DB 한 분이 오늘의 첫 분입니다.
   서버는 적어 두기만 하는 가짜입니다 (밖으로 안 나감 · 7번). */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1');
        ['apex_hm_blank_skip_v1','apex_hm_fold_v1'].forEach(k => localStorage.removeItem(k)); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const me = arMyId();
  AR.db=[{ id:'d5', who:me, name:'홍길동E', region:'강남구', src:'일반', stage:'계약완료',
           cAt:'', pAt:'', n:2, last:'', res:'상담', appt:'', memo:'', days:20, phone:'' }];
  window.SRV=[];
  window.osClient=function(){ const mk=function(t){ const st={t:t,op:'',row:null,eq:null};
    const a={ insert:function(r){st.op='insert';st.row=r;return a;}, update:function(r){st.op='update';st.row=r;return a;},
      upsert:function(r){st.op='upsert';st.row=r;return a;}, 'delete':function(){st.op='delete';return a;},
      eq:function(k,v){st.eq=[k,v];return a;}, select:function(){return a;},
      limit:function(){return a;}, order:function(){return a;}, range:function(){return a;},
      'in':function(){return a;}, gte:function(){return a;}, lte:function(){return a;},
      is:function(){return a;}, neq:function(){return a;}, not:function(){return a;},
      single:function(){return a;}, maybeSingle:function(){return a;},
      then:function(ok,no){ if(!st.op) return Promise.resolve({data:[],error:null}).then(ok,no);
        /* 이 칸이 쓰는 표(dbs · calls · clients)만 적습니다 — 앱이 켜질 때 따로 도는 출발
           점검(health_checks)이 재는 사이에 끼어 「서버를 두 번 불렀다」 고 헛 빨간불을
           켰습니다(8번 · 재어 보고 알았습니다). 이 칸이 다른 표에 쓰면 그것은 따로 봅니다. */
        if(['dbs','calls','clients'].indexOf(st.t)>=0) SRV.push({t:st.t,op:st.op,row:st.row,eq:st.eq});
        return Promise.resolve({data:[{id:'x'}],error:null}).then(ok,no); } };
    return a; }; return { from:mk, rpc:function(){ return Promise.resolve({data:null,error:null}); } }; };
  try{ osHideLoginGate(); }catch(e){}
  try{ document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove()); }catch(e){}
  HWHO.id=''; go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  /* 🙈 판 X399 — 홈은 이제 <b>실명이 기본</b>이고, 고객 앞에서 「🙈 이름 가리기」 를 누르면 가립니다.
     이 자는 <b>누른 뒤</b>를 봅니다 — 가리는 길이 무너지면 여기서 웁니다. 기본(실명)은 check-hmfullnm. */
  await ctx.addInitScript(() => { try { localStorage.setItem('apex_hm_hidenm', '1'); } catch (e) {} });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await p.waitForTimeout(1200);
  await p.evaluate(SEED); await p.waitForTimeout(1200);

  console.log('\n[1] 「이분 끝」 → 빈칸 하나');
  const A = await p.evaluate(async () => {
    const r = hmNext(), x = r && r.x;
    const out = { 첫분: x ? x.id : '', key: x ? x.key : '' };
    const fin = [...document.querySelectorAll('#dynPane button')].find(e => /이분 끝/.test(e.textContent));
    out.단추 = !!fin;
    if (fin) fin.click();
    await new Promise(r2 => setTimeout(r2, 300));
    const box = document.getElementById('hmBlankBox');
    out.on = !!(box && box.classList.contains('on'));
    out.t = box ? box.innerText.replace(/\s+/g, ' ') : '';
    out.in = box && box.querySelector('#hmBlankIn') ? box.querySelector('#hmBlankIn').type : '';
    out.작은 = box ? [...box.querySelectorAll('button,input')].filter(e => e.getBoundingClientRect().height < 44).length : -1;
    return out;
  });
  is(A.첫분 === 'd5' && A.단추, '  오늘 첫 분이 견본(계약완료 · 계약일 빈칸)이고 「이분 끝」 단추가 있다');
  is(A.on && /계약일/.test(A.t) && A.in === 'date', '  ★ 누르면 <b>계약일 하나</b>를 묻는 칸이 뜬다 — ' + A.t.slice(0, 50));
  is(!/홍길동E/.test(A.t) && /홍\S*E님/.test(A.t), '  ★ 이름을 <b>가린다</b> (3번)');
  is(/마디/.test(A.t), '  왜 묻는지 <b>까닭</b>을 적는다 — 계약 마디가 이 날로 섭니다');
  /* 「계약일가 비어 있습니다」 가 한 번 찍혔습니다 — 받침을 보는 자(hmJo)가 지킵니다 */
  is(/계약일이 비어/.test(A.t) && !/계약일가/.test(A.t), '  ★ 조사가 맞다 — 「계약일<b>이</b> 비어 있습니다」');

  console.log('\n[2] 비운 채 · [3] 저장');
  const B = await p.evaluate(async () => {
    const save = () => [...document.querySelectorAll('#hmBlankBox button')].find(e => /저장/.test(e.textContent));
    SRV.length = 0; TOASTS.length = 0;
    save().click(); await new Promise(r => setTimeout(r, 150));
    const 빈 = { srv: SRV.length, toast: TOASTS.slice(-1)[0] || '', on: document.getElementById('hmBlankBox').classList.contains('on') };
    /* 빈 채로 들어가 버려 칸이 닫혔으면 다시 열어 다음 물음을 잇습니다 — 멈추면 「무엇이」
       틀렸는지 못 적습니다. 빈 채로 들어간 것은 위 빈.srv 가 이미 잡습니다. */
    if (!document.getElementById('hmBlankIn')) {
      const k = HM_BLANK.filter(x => x.k === 'cAt')[0];
      const r = hdbRow('d5'); if (r) r.cAt = '';
      hmBlankShow({ f: k, id: 'd5', nm: (r && r.name) || '' });
    }
    document.getElementById('hmBlankIn').value = '2026-10-02';
    save().click(); await new Promise(r => setTimeout(r, 400));
    return { 빈, srv: SRV.slice(), on: document.getElementById('hmBlankBox').classList.contains('on'),
             cAt: (hdbRow('d5') || {}).cAt, toast: TOASTS.slice(-1)[0] || '' };
  });
  is(B.빈.srv === 0 && B.빈.on && /다음에/.test(B.빈.toast), '  ★ 비운 채 저장은 <b>안 받는다</b> — 모르면 「다음에」 (1번) · 「' + B.빈.toast + '」');
  const up = B.srv.filter(x => x.op === 'update');
  is(B.srv.length === 1 && up.length === 1 && up[0].t === 'dbs' && up[0].eq && up[0].eq[1] === 'd5' &&
     up[0].row.contracted_at === '2026-10-02' &&
     Object.keys(up[0].row).sort().join(',') === 'contracted_at,updated_at',
     '  ★★ <b>dbs 의 contracted_at 하나만</b> 바꾼다(+ updated_at) · 서버 ' + B.srv.length + '번 — ' + JSON.stringify(up[0] || null).slice(0, 110));
  is(!B.on && B.cAt === '2026-10-02', '  칸이 닫히고 손에 든 줄도 바뀐다 — cAt ' + B.cAt);
  is(!/홍길동/.test(B.toast), '  알림에 실명이 안 샌다 — 「' + B.toast + '」');
  is(/계약일을 적었습니다/.test(B.toast), '  ★ 조사가 맞다 — 「계약일<b>을</b> 적었습니다」');

  console.log('\n[5] 차례 — 고객 365일 분은 생년 → 가족 · [6] 묻지 않을 때');
  const C = await p.evaluate(() => {
    const me = arMyId(), 원 = window.hmSteps;
    window.hmSteps = function () { return [{ key: 'c:c1', id: 'c1' }, { key: 'c:c9', id: 'c9' },
                                           { key: 'db:d7', id: 'd7' }]; };
    AR.cliRows = [{ id: 'c1', who: me, by: null, hn: '', name: '홍길동K' },
                  { id: 'c9', who: 'u2', by: null, hn: '', name: '홍길순Z' }];
    AR.db.push({ id: 'd7', who: me, name: '홍길동G', stage: 'AP', cAt: '', days: 3 });
    const 첫 = hmBlankFor('c:c1'); const f1 = 첫 && 첫.f.k;
    AR.cliRows[0].by = 1980; const f2 = (hmBlankFor('c:c1') || { f: {} }).f.k;
    AR.cliRows[0].hn = '배우자'; const f3 = hmBlankFor('c:c1');
    const 남 = hmBlankFor('c:c9');
    const db생년 = hmBlankFor('db:d7');
    window.hmSteps = 원;
    return { f1, f2, f3, 남, db생년, 표: HM_BLANK.map(x => x.k + ':' + x.on).join(' · ') };
  });
  is(C.표 === 'by:cli · hn:cli · cAt:db · dong:db', '  표가 한 곳 — ' + C.표);
  is(C.f1 === 'by' && C.f2 === 'hn' && C.f3 === null, '  ★ 고객 365일 분은 <b>생년 → 가족</b> 차례로 하나씩, 다 차면 안 묻는다 — ' + [C.f1, C.f2, C.f3].join(' → '));
  is(C.db생년 === null, '  ★★ 배정 DB 분께는 <b>생년을 안 묻는다</b> — 담을 칸이 없습니다(지어 담지 않음 · 1번)');
  is(C.남 === null, '  ★ 남의 고객이면 <b>안 묻는다</b> — 서버가 안 받습니다');

  console.log('\n[2-b] 해 · [4] 다음에');
  const D = await p.evaluate(async () => {
    const me = arMyId(), 원 = window.hmSteps;
    window.hmSteps = function () { return [{ key: 'c:c2', id: 'c2' }]; };
    AR.cliRows = [{ id: 'c2', who: me, by: null, hn: '', name: '홍길동L' }];
    hmBlankShow(hmBlankFor('c:c2'));
    SRV.length = 0; TOASTS.length = 0;
    document.getElementById('hmBlankIn').value = '1800';
    [...document.querySelectorAll('#hmBlankBox button')].find(e => /저장/.test(e.textContent)).click();
    await new Promise(r => setTimeout(r, 150));
    const 해 = { srv: SRV.length, toast: TOASTS.slice(-1)[0] || '' };
    [...document.querySelectorAll('#hmBlankBox button')].find(e => /다음에/.test(e.textContent)).click();
    await new Promise(r => setTimeout(r, 150));
    const 다음 = { srv: SRV.length, on: document.getElementById('hmBlankBox').classList.contains('on'),
                  again: hmBlankFor('c:c2') };
    window.hmSteps = 원;
    return { 해, 다음 };
  });
  is(D.해.srv === 0 && /네 자리/.test(D.해.toast), '  이상한 해(1800)는 <b>안 받는다</b> — 「' + D.해.toast + '」');
  is(D.다음.srv === 0 && !D.다음.on && D.다음.again === null, '  ★ 「다음에」 는 서버를 안 부르고, <b>오늘은 다시 안 묻는다</b>');

  console.log('\n[8] 🏘 배정 DB 분께 <b>사시는 동네</b> (판 X367)');
  const E8 = await p.evaluate(async () => {
    const me = arMyId(), 원 = window.hmSteps;
    window.hmSteps = function () { return [{ key: 'db:d8', id: 'd8' }, { key: 'db:d9', id: 'd9' }, { key: 'db:da', id: 'da' }]; };
    AR.cliRows = [];
    AR.db.push({ id: 'd8', who: me, name: '홍길동H', stage: 'TA', cAt: '', dong: '', days: 3 });
    AR.db.push({ id: 'd9', who: me, name: '홍길동I', stage: 'AP', cAt: '', dong: '연향동', days: 3 });
    AR.db.push({ id: 'da', who: me, name: '홍길동J', stage: '미접촉', cAt: '', dong: '', days: 3 });
    const o = {};
    const b8 = hmBlankFor('db:d8'); o.k8 = b8 && b8.f.k;
    o.있음 = hmBlankFor('db:d9'); o.미접촉 = hmBlankFor('db:da');
    AR.noDong = true; o.못읽음 = hmBlankFor('db:d8'); AR.noDong = false;
    hmBlankShow(b8);
    o.글 = document.getElementById('hmBlankBox').innerText.replace(/\s+/g, ' ');
    const save = () => [...document.querySelectorAll('#hmBlankBox button')].find(e => /저장/.test(e.textContent)).click();
    SRV.length = 0; TOASTS.length = 0;
    document.getElementById('hmBlankIn').value = '순천'; save(); await new Promise(r => setTimeout(r, 150));
    o.아님 = { srv: SRV.length, toast: TOASTS.slice(-1)[0] || '' };
    /* 「순천」 이 들어가 버리면 칸이 닫힙니다 — 다시 열어 다음 물음을 잇습니다(멈추면 「무엇이」 틀렸는지 못 적습니다) */
    if (!document.getElementById('hmBlankIn')) { AR.db.forEach(r => { if (r.id === 'd8') r.dong = ''; }); hmBlankShow(b8); }
    SRV.length = 0;
    document.getElementById('hmBlankIn').value = '순천시 조례동 12-3'; save(); await new Promise(r => setTimeout(r, 300));
    o.넣음 = SRV.slice(); o.손 = (hdbRow('d8') || {}).dong; o.toast = TOASTS.slice(-1)[0] || '';
    window.hmSteps = 원;
    return o;
  });
  is(E8.k8 === 'dong' && /사시는 동네/.test(E8.글) && /지역 동선/.test(E8.글), '  ★ TA 분께 <b>사시는 동네</b>를 여쭙는다 · 왜 묻는지 적는다 — ' + E8.글.slice(0, 70));
  is(!/홍길동/.test(E8.글), '  이름을 가린다 (3번)');
  is(E8.있음 === null && E8.미접촉 === null, '  이미 동네가 있으면 · 미접촉이면 <b>안 묻는다</b>');
  is(E8.못읽음 === null, '  ★ 동네 칸을 못 읽은 서버면 <b>안 묻는다</b> — 담을 곳을 모릅니다 (1번)');
  is(E8.아님.srv === 0 && /동·읍·면/.test(E8.아님.toast), '  ★ 「순천」 처럼 동네가 아닌 글은 <b>안 받는다</b> — 「' + E8.아님.toast + '」');
  const up8 = E8.넣음.filter(x => x.t === 'dbs' && x.op === 'update');
  is(up8.length === 1 && up8[0].row.dong === '조례동' && Object.keys(up8[0].row).sort().join(',') === 'dong,updated_at' &&
     up8[0].eq && up8[0].eq[1] === 'd8',
     '  ★★ 「순천시 조례동 12-3」 → <b>dbs.dong = 조례동</b> 하나만(번지 버림) · 서버 ' + E8.넣음.length + '번 — ' + JSON.stringify(up8[0] ? up8[0].row : null).slice(0, 80));
  is(E8.손 === '조례동', '  손에 든 줄도 바뀐다 — ' + E8.손);

  console.log('\n[7] 손가락');
  is(A.작은 === 0, '  누르는 자리가 다 44px 이상 — 작은 것 ' + A.작은 + '개');
  is(errs.length === 0, '  오류 없이 선다' + (errs.length ? (' ← ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 📝 빈칸 하나 — 만날 때마다 한 칸씩 찹니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
