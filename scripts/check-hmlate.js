/* ══ 🕗 check-hmlate — 약속이 지난 분을 한 분씩 정리 (판 X281) ═══════════════
   사장님 말씀 (2026-10-31) 「고객 관리를 위해 어떻게 하면 좋을까」 → 서버에 적힌 수
   (AP·PC·CS 188건 중 약속 지난 142건)를 올려 드려 고르신 첫째.

   묻는 것
     [1] 칸이 「지금 할 것」 테두리 안 · 📅 약속 바로 밑에 서나
     [2] 수가 arApptPast 그대로인가 · 오래된 분부터인가 · 이름을 가리나 (3번)
     [3] 📅 다시 잡기 — 지난 날은 안 받나 · 앞날이면 CRM 과 같은 꼴(calls · 상담 ·
         appointment_at)로 한 줄 넣나 · 그 분이 줄에서 빠지고 다음 분이 서나
     [4] ⏭ 오늘은 넘기기 — 서버를 <b>한 번도</b> 안 부르나 · 다음 분이 서나 · 날이 바뀌면 돌아오나
     [5] ✖ 거절로 정리 — 묻고 나서 있는 단계(거절)로만 옮기나 · 「아니오」 면 안 옮기나
     [6] 내 고객이 아니면 바꾸는 단추가 안 서고 까닭을 적나
     [7] 못 읽었으면 수를 안 적나 · 없으면 「없습니다」 로 자리를 지키나 (1번)
     [8] 누르는 자리 44px · 실명이 안 새나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9051;
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

/* 견본 — 이름은 「홍길동」 (3번). 지난 약속 셋(가장 오래된 것이 d4) · 앞날 하나 ·
   남의 고객 하나(지난 약속). 서버는 <b>적어 두기만</b> 하는 가짜입니다(7번 · 밖으로 안 나감). */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_hm_late_skip_v1');
        localStorage.removeItem('apex_hm_fold_v1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  window.ASKS=[]; window.confirm=function(m){ ASKS.push(''+m); return window.SAYYES!==false; };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const t = arToday();
  const ago = n => { const d = new Date(t + 'T09:00:00'); d.setDate(d.getDate() - n); return d.toISOString(); };
  const me = arMyId();
  const row = (id, who, stage, apptAgo, nm, phone) => ({ id:id, who:who, name:nm, region:'강남구',
    src:'일반', stage:stage, cAt:'', pAt:'', n:1, last:'', res:'상담',
    appt: apptAgo === null ? '' : ago(apptAgo), memo:'', days:3, phone:phone||'' });
  AR.db=[ row('d1', me, 'AP', 12, '홍길동A', '010-1234-5678'),
          row('d4', me, 'PC', 60, '홍길동D', ''),
          row('d2', me, 'CS', 30, '홍길동B', '010-2222-3333'),
          row('d3', me, 'AP', -5, '홍길동C', ''),          /* 앞날 — 줄에 안 섭니다 */
          row('d9', 'u2', 'AP', 90, '홍길순Z', '') ];      /* 남의 고객 */
  window.SRV=[];
  window.osClient=function(){ const mk=function(t){ const st={t:t,op:'',row:null,eq:null};
    const a={ insert:function(r){st.op='insert';st.row=r;return a;}, update:function(r){st.op='update';st.row=r;return a;},
      upsert:function(r){st.op='upsert';st.row=r;return a;}, 'delete':function(){st.op='delete';return a;},
      eq:function(k,v){st.eq=[k,v];return a;}, select:function(){st.sel=true;return a;},
      /* 다른 칸이 읽으러 부르는 꼬리들 — 읽기는 빈 손으로 답하고 적어 두지 않습니다 */
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

const LOOK = () => {
  const e = document.getElementById('hmLateHost');
  const st = document.getElementById('hmStack');
  const kids = st ? [...st.children].map(x => x.id || x.className) : [];
  return {
    있나: !!e, 안: !!(e && e.closest('#hmJobWrap')), kids: kids.join(' · '),
    t: e ? e.innerText.replace(/\s+/g, ' ').trim() : '',
    수: (e && e.querySelector('[data-ask="약속지난분"]') || {}).textContent || '',
    단추: e ? [...e.querySelectorAll('button,a')].map(b => b.textContent.trim()) : [],
    작은: e ? [...e.querySelectorAll('button,a,input')].filter(b => b.getBoundingClientRect().height < 44)
               .map(b => (b.textContent || b.tagName).trim()) : [],
    tel: (e && e.querySelector('a[href^="tel:"]')) ? e.querySelector('a[href^="tel:"]').getAttribute('href') : ''
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
  await p.waitForTimeout(1200);
  await p.evaluate(SEED); await p.waitForTimeout(1200);

  console.log('\n[1] 칸이 <b>「지금 할 것」 테두리 안</b> · 📅 약속 바로 밑');
  const A = await p.evaluate(LOOK);
  is(A.있나 && A.안, '  🕗 칸이 테두리(#hmJobWrap) 안에 선다');
  /* 판 X283 부터 🕗 밑에 💬 소개 여쭐 차례가 섭니다 — 🕗 가 📅 <b>바로 밑</b>인지만 봅니다 */
  is(/hmUpHost · hmLateHost · /.test(A.kids), '  차례가 📅 약속 → 🕗 — ' + A.kids);

  console.log('\n[2] 수 · 차례 · 이름');
  const want = await p.evaluate(() => arApptPast(hwhoFor()).length);
  is(A.수 === want + '분' && want === 3, '  「' + A.수 + '」 가 arApptPast 그대로(내 것 지난 셋) — 앞날·남의 고객은 안 셉니다');
  is(/홍\S*D님 · PC · /.test(A.t) && /60일/.test(A.t), '  ★ <b>가장 오래된 분</b>(60일 지난 D)이 먼저 선다 — ' + A.t.slice(0, 60));
  is(!/홍길동[A-Z]|홍길순/.test(A.t), '  ★ 실명이 <b>안 샌다</b> (3번)');
  is(/남은 2분/.test(A.t), '  다음에 몇 분이 남았는지 적는다');
  is(/번호 없음/.test(A.t) && !A.tel, '  번호가 없으면 <b>「번호 없음」</b> 이라 적고 거는 척하지 않는다 (1번)');

  console.log('\n[3] 📅 다시 잡기');
  const R3 = await p.evaluate(async () => {
    const btn = [...document.querySelectorAll('#hmLateHost button')].find(x => /다시 잡기/.test(x.textContent));
    btn.click(); await new Promise(r => setTimeout(r, 150));
    const f = document.getElementById('hmLateAt');
    const out = { 칸: !!f };
    const save = () => [...document.querySelectorAll('#hmLateHost button')].find(x => /저장/.test(x.textContent));
    /* 지난 날 */
    SRV.length = 0; TOASTS.length = 0;
    f.value = '2020-01-01T10:00'; save().click(); await new Promise(r => setTimeout(r, 200));
    out.지난 = { srv: SRV.length, toast: TOASTS.slice(-1)[0] || '' };
    /* 앞날 */
    const d = new Date(Date.now() + 3 * 864e5); d.setHours(14, 0, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    /* 지난 날이 들어가 버리면 칸이 닫힙니다 — 다시 열어 다음 물음을 이어 갑니다(멈추면
       「무엇이」 틀렸는지 못 적습니다). 지난 날이 들어간 것은 위 out.지난 이 이미 잡습니다. */
    if (!document.getElementById('hmLateAt')) {
      const b2 = [...document.querySelectorAll('#hmLateHost button')].find(x => /다시 잡기/.test(x.textContent));
      if (b2) { b2.click(); await new Promise(r => setTimeout(r, 150)); }
    }
    if (!document.getElementById('hmLateAt')) return Object.assign(out, { 넣음: [], 뒤: '', 수: -1, toast: '' });
    document.getElementById('hmLateAt').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T14:00';
    save().click(); await new Promise(r => setTimeout(r, 400));
    out.넣음 = SRV.slice();
    out.뒤 = document.getElementById('hmLateHost').innerText.replace(/\s+/g, ' ');
    out.수 = arApptPast(hwhoFor()).length;
    out.toast = TOASTS.slice(-1)[0] || '';
    return out;
  });
  is(R3.칸, '  누르면 <b>일시 칸</b>이 그 자리에서 펴진다');
  is(R3.지난.srv === 0 && /지난 일시/.test(R3.지난.toast), '  ★ <b>지난 일시</b>는 안 받는다 — 서버 ' + R3.지난.srv + '번 · 「' + R3.지난.toast + '」');
  const ins = R3.넣음.filter(x => x.t === 'calls' && x.op === 'insert');
  is(ins.length === 1 && ins[0].row.db_id === 'd4' && ins[0].row.result === '상담' &&
     /^\d{4}-\d\d-\d\dT/.test(ins[0].row.appointment_at || '') && ins[0].row.created_by === 'me',
     '  ★★ CRM 통화 저장과 <b>같은 꼴</b>로 calls 에 한 줄 — ' + JSON.stringify(ins[0] ? ins[0].row : null).slice(0, 120));
  is(R3.넣음.length === 1, '  서버를 <b>한 번만</b> 부른다 (7번) — ' + R3.넣음.length + '번');
  is(R3.수 === 2 && /홍\S*B님 · CS/.test(R3.뒤), '  ★ 그 분이 줄에서 빠지고 <b>다음 분</b>(30일 지난 B)이 선다 — 남은 ' + R3.수);
  is(!/홍길동/.test(R3.toast), '  알림에도 실명이 안 샌다 — 「' + R3.toast + '」');

  console.log('\n[4] ⏭ 오늘은 넘기기 — 이 기기에서 오늘만');
  const R4 = await p.evaluate(async () => {
    SRV.length = 0;
    [...document.querySelectorAll('#hmLateHost button')].find(x => /넘기기/.test(x.textContent)).click();
    await new Promise(r => setTimeout(r, 200));
    const 뒤 = document.getElementById('hmLateHost').innerText.replace(/\s+/g, ' ');
    const o = JSON.parse(localStorage.getItem('apex_hm_late_skip_v1') || 'null');
    /* 날이 바뀐 척 — 어제 넘긴 것으로 적으면 다시 앞에 서야 합니다 */
    localStorage.setItem('apex_hm_late_skip_v1', JSON.stringify({ d: '2000-01-01', ids: o ? o.ids : [] }));
    hmLatePaint();
    const 이튿날 = document.getElementById('hmLateHost').innerText.replace(/\s+/g, ' ');
    localStorage.setItem('apex_hm_late_skip_v1', JSON.stringify(o)); hmLatePaint();
    return { srv: SRV.length, 뒤, o, 이튿날 };
  });
  is(R4.srv === 0, '  ★ 서버를 <b>한 번도</b> 안 부른다 — 「보류」 단계를 지어내지 않습니다 (1번)');
  is(/홍\S*A님 · AP/.test(R4.뒤) && /오늘 넘긴 1분/.test(R4.뒤), '  다음 분(A)이 서고 「오늘 넘긴 1분」 이라 적는다');
  is(/홍\S*B님/.test(R4.이튿날), '  ★ 날이 바뀌면 넘긴 분이 <b>다시 앞에</b> 선다');

  console.log('\n[5] ✖ 거절로 정리');
  const R5 = await p.evaluate(async () => {
    SRV.length = 0; ASKS.length = 0; window.SAYYES = false;
    const btn = () => [...document.querySelectorAll('#hmLateHost button')].find(x => /거절로/.test(x.textContent));
    btn().click(); await new Promise(r => setTimeout(r, 200));
    const 아니오 = { srv: SRV.length, ask: ASKS.length };
    window.SAYYES = true; btn().click(); await new Promise(r => setTimeout(r, 400));
    return { 아니오, 예: SRV.slice(), ask: ASKS.slice(-1)[0] || '', 수: arApptPast(hwhoFor()).length,
             st: (hdbRow('d1') || {}).stage };
  });
  is(R5.아니오.ask === 1 && R5.아니오.srv === 0, '  ★ 먼저 <b>묻고</b>, 「아니오」 면 안 옮긴다');
  const up = R5.예.filter(x => x.t === 'dbs' && x.op === 'update');
  is(up.length === 1 && up[0].row.stage === '거절' && up[0].eq && up[0].eq[1] === 'd1',
     '  ★ 있는 단계 <b>「거절」</b> 로만 옮긴다(hdbTo) — ' + JSON.stringify(up[0] || null).slice(0, 100));
  /* 지난 셋 중 D 는 다시 잡았고 A 는 거절로 — 남는 것은 <b>오늘 넘겨 둔 B 하나</b>입니다.
     넘기기는 줄에서 지우는 것이 아니라 오늘만 뒤로 미는 것이라 셈에는 남습니다. */
  is(R5.st === '거절' && R5.수 === 1, '  그 분이 줄에서 빠진다 — 남은 ' + R5.수 + ' (오늘 넘겨 둔 B 하나)');
  is(!/홍길동/.test(R5.ask), '  묻는 말에도 실명이 안 샌다');

  console.log('\n[6] 남의 고객이면 · [7] 못 읽었을 때 · 없을 때');
  const R6 = await p.evaluate(() => {
    localStorage.removeItem('apex_hm_late_skip_v1');
    /* 팀원(u2)의 화면을 보는 때 — 「누구 것」 을 정하는 자(hwhoFor)를 그대로 갈아 끼웁니다 */
    const 원 = window.hwhoFor; window.hwhoFor = function () { return 'u2'; }; hmLatePaint();
    const e = document.getElementById('hmLateHost');
    const 남 = { t: e.innerText.replace(/\s+/g, ' '), b: [...e.querySelectorAll('button')].map(x => x.textContent.trim()) };
    window.hwhoFor = 원;
    const keep = AR.db; AR.db = null; const 못 = hmLateHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    AR.db = keep.map(r => Object.assign({}, r, { appt: '' })); const 없 = hmLateHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    AR.db = keep; hmLatePaint();
    return { 남, 못, 없 };
  });
  is(R6.남.b.every(x => !/다시 잡기|거절로/.test(x)) && R6.남.b.some(x => /넘기기/.test(x)),
     '  ★ 남의 고객이면 <b>바꾸는 단추를 안 세운다</b> — ' + R6.남.b.join(' · '));
  is(/다른 분|님|담당/.test(R6.남.t), '  ★ 왜 못 바꾸는지 <b>적는다</b> (hdbWhyNot) — ' + R6.남.t.slice(-60));
  is(/못 읽었습니다/.test(R6.못) && !/\d+분/.test(R6.못), '  ★ 못 읽었으면 <b>수를 안 적는다</b> — 「0분」 이 아닙니다 (1번)');
  is(/없습니다/.test(R6.없), '  ★ 없는 날도 <b>자리를 지키고</b> 「없습니다」 라고 적는다');

  console.log('\n[8] 손가락');
  const B = await p.evaluate(LOOK);
  is(B.작은.length === 0, '  누르는 자리가 다 <b>44px 이상</b> — ' + (B.작은.join(' · ') || '작은 것 없음'));
  is(errs.length === 0, '  오류 없이 선다' + (errs.length ? (' ← ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 🕗 약속이 지난 분 — 한 분씩 정리됩니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
