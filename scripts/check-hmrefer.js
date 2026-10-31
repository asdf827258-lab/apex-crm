/* ══ 💬 check-hmrefer — 소개 여쭐 차례 (판 X283) ═══════════════════════════════
   사장님 말씀 (2026-10-31) 「고객 관리를 위해 어떻게 하면 좋을까」 → 고르신 셋째.

   묻는 것
     [1] 칸이 「지금 할 것」 테두리 안 · 🕗 바로 밑에 서나
     [2] 수가 arStageN 의 증권전달 칸과 <b>같은가</b>(📇 띠와 안 갈리나 · 5번) · 전한 날이
         오래된 분부터 · 날을 모르면 「모름」 이라 적고 맨 뒤 · 이름을 가리나 (3번)
     [3] 💬 여쭙는 말이 <b>PDEL_STEP 넷째 걸음 그대로</b>인가(새로 안 적음) · 실명이 없나
     [4] 🤝 소개 받음 — 묻고 나서 있는 단계 「소개완료」 로만 · 「아니오」 면 안 옮김
     [5] ⏭ 오늘은 넘기기 — 서버를 안 부름 · 🕗 와 같은 자(hmDaySkip)
     [6] 남의 고객이면 바꾸는 단추가 안 서고 까닭 · 못 읽었으면 수를 안 적음 · 없으면 「없습니다」
     [7] 며칠 뒤에 여쭈라는 수를 <b>지어 넣지 않았나</b> (1번) · 44px
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9055;
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
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_hm_refer_skip_v1');
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
  const day = n => { const d = new Date(t + 'T09:00:00'); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  /* 증권전달까지 온 분은 <b>계약일이 늘 있습니다</b> — 계약완료로 옮길 때 날짜 없이는 안 옮겨집니다.
     씨에 계약일을 안 심었더니 hdbTo 가 (옳게) 날을 지어내지 않고 고치기 창을 열어, 이 자가
     「안 옮겼다」 고 울었습니다. 진짜 줄과 같은 꼴로 심고, 날 없는 판은 [4-b] 가 따로 봅니다. */
  const pr = (id, who, pAgo, nm, phone) => Object.assign(row(id, who, '증권전달', null, nm, phone),
    { pAt: pAgo === null ? '' : day(pAgo), cAt: day(60) });
  AR.db=[ pr('p1', me, 5, '홍길동A', '010-1234-5678'),
          pr('p2', me, 40, '홍길동B', ''),
          pr('p3', me, null, '홍길동C', ''),          /* 전한 날 모름 — 맨 뒤 */
          row('d1', me, 'AP', 3, '홍길동D', ''),       /* 증권전달이 아님 */
          row('k1', me, '계약완료', null, '홍길동K', ''), /* 바로 앞 단계 — 섞이면 수가 갈립니다 */
          pr('p9', 'u2', 90, '홍길순Z', '') ];         /* 남의 고객 */
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
  /* 폰에서는 이 칸이 <b>접힌 채</b> 섭니다(판 X281 · 홈 선 안에 들이려고). 속을 재려면 먼저
     폅니다 — 여닫는 자는 앱의 hmFoldSet 하나입니다. 접힌 머리는 아래 [9] 가 따로 봅니다. */
  try{ hmFoldSet('stk_hmReferHost',true); }catch(e){}
  HWHO.id=''; go('home');
};

const LOOK = () => {
  const e = document.getElementById('hmReferHost');
  const st = document.getElementById('hmStack');
  return {
    있나: !!e, 안: !!(e && e.closest('#hmJobWrap')),
    kids: st ? [...st.children].map(x => x.id || x.className).join(' · ') : '',
    t: e ? e.innerText.replace(/\s+/g, ' ').trim() : '',
    수: (e && e.querySelector('[data-ask="소개여쭐분"]') || {}).textContent || '',
    작은: e ? [...e.querySelectorAll('button,a')].filter(b => b.getBoundingClientRect().height < 44)
               .map(b => b.textContent.trim()) : []
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

  console.log('\n[1] 칸이 테두리 안 · 🕗 바로 밑');
  const A = await p.evaluate(LOOK);
  is(A.있나 && A.안, '  💬 칸이 「지금 할 것」 테두리 안에 선다');
  is(/(hmFold_stk_)?hmLateHost · (hmFold_stk_)?hmReferHost · hmActHost/.test(A.kids), '  차례가 🕗 → 💬 → 📊 — ' + A.kids);

  console.log('\n[2] 수 · 차례 · 이름');
  const N = await p.evaluate(() => { const s = arStageN(hwhoFor()); return s ? (s.c['증권전달'] || 0) : -1; });
  is(A.수 === N + '분' && N === 3, '  ★ 「' + A.수 + '」 = arStageN 증권전달 칸(' + N + ') — 📇 띠와 같은 자입니다');
  is(/홍\S*B님 · 증권 전한 지 40일/.test(A.t), '  ★ 전한 날이 <b>오래된 분</b>(40일 B)부터 — ' + A.t.slice(0, 60));
  const 끝 = await p.evaluate(() => hmReferRows(hwhoFor()).map(r => r.id).join(','));
  is(끝 === 'p2,p1,p3', '  날을 모르는 분은 <b>맨 뒤</b> — 모르는 것을 오래됐다고 치지 않습니다 · ' + 끝);
  is(!/홍길동[A-Z]|홍길순/.test(A.t), '  ★ 실명이 안 샌다 (3번)');

  console.log('\n[3] 여쭙는 말');
  const C = await p.evaluate(async () => {
    let got = ''; const 원 = window.copyText; window.copyText = function (t) { got = t; };
    [...document.querySelectorAll('#hmReferHost button')].find(x => /여쭙는 말/.test(x.textContent)).click();
    window.copyText = 원;
    const s4 = (APEX_STAGE.pdel || []).filter(x => x.n === 4)[0];
    return { got, want: s4 ? s4.say : '' };
  });
  is(!!C.want && C.got === C.want, '  ★★ 복사한 말이 <b>증권전달 넷째 걸음 그대로</b>다 — 새로 안 적었습니다 · 「' + C.got.slice(0, 30) + '…」');
  is(!/홍길동|\{이름\}/.test(C.got), '  여쭙는 말에 이름이 없다 — 「고객님」 으로 나갑니다 (3번)');

  console.log('\n[4] 🤝 소개 받음');
  const D = await p.evaluate(async () => {
    SRV.length = 0; ASKS.length = 0; window.SAYYES = false;
    const btn = () => [...document.querySelectorAll('#hmReferHost button')].find(x => /소개 받음/.test(x.textContent));
    btn().click(); await new Promise(r => setTimeout(r, 200));
    const 아니오 = { srv: SRV.length, ask: ASKS.length };
    window.SAYYES = true; btn().click(); await new Promise(r => setTimeout(r, 400));
    return { 아니오, 예: SRV.slice(), st: (hdbRow('p2') || {}).stage, ask: ASKS.slice(-1)[0] || '',
             뒤: document.getElementById('hmReferHost').innerText.replace(/\s+/g, ' ') };
  });
  is(D.아니오.ask === 1 && D.아니오.srv === 0, '  ★ 먼저 <b>묻고</b>, 「아니오」 면 안 옮긴다');
  const up = D.예.filter(x => x.t === 'dbs' && x.op === 'update');
  is(D.예.length === 1 && up.length === 1 && up[0].row.stage === '소개완료' && up[0].eq[1] === 'p2',
     '  ★ 있는 단계 <b>「소개완료」</b> 로만 옮긴다(hdbTo) · 서버 ' + D.예.length + '번');
  is(D.st === '소개완료' && /홍\S*A님/.test(D.뒤), '  그 분이 빠지고 다음 분(A)이 선다');
  is(!/홍길동/.test(D.ask), '  묻는 말에 실명이 안 샌다');

  console.log('\n[4-b] 계약일이 없으면 — 날을 지어내지 않고 고치기 창으로');
  const D2 = await p.evaluate(async () => {
    const r = hdbRow('p1'), 원c = r.cAt, 원o = window.hdbOpen; let 열림 = '';
    r.cAt = ''; window.hdbOpen = function (id, to) { 열림 = id + '→' + to; };
    SRV.length = 0; window.SAYYES = true;
    hmReferGot('p1'); await new Promise(x => setTimeout(x, 200));
    r.cAt = 원c; window.hdbOpen = 원o;
    return { srv: SRV.length, 열림, st: r.stage };
  });
  is(D2.srv === 0 && D2.열림 === 'p1→소개완료' && D2.st === '증권전달',
     '  ★ 계약일이 없으면 <b>서버에 안 쓰고</b> 고치기 창(hdbOpen)으로 — 날을 지어내지 않습니다 (1번) · ' + D2.열림);
  await p.evaluate(() => hmReferPaint());

  console.log('\n[5] ⏭ 오늘은 넘기기');
  const E = await p.evaluate(async () => {
    SRV.length = 0;
    [...document.querySelectorAll('#hmReferHost button')].find(x => /넘기기/.test(x.textContent)).click();
    await new Promise(r => setTimeout(r, 200));
    return { srv: SRV.length, 뒤: document.getElementById('hmReferHost').innerText.replace(/\s+/g, ' '),
             같은자: /hmDaySkip\(HM_REFER_KEY/.test(String(hmReferSkip)) && /hmDaySkip\(HM_LATE_KEY/.test(String(hmLateSkip)) };
  });
  is(E.srv === 0 && /홍\S*C님 · 증권 전한 날 모름/.test(E.뒤) && /오늘 넘긴 1분/.test(E.뒤),
     '  ★ 서버를 안 부르고 다음 분(날 모름 C)이 선다 — 「모름」 이라 적습니다');
  is(E.같은자, '  ★ 🕗 와 <b>같은 자</b>(hmDaySkip)가 넘깁니다 — 두 벌이 아닙니다 (5번)');

  console.log('\n[6] 남의 고객 · 못 읽음 · 없음');
  const F = await p.evaluate(() => {
    localStorage.removeItem('apex_hm_refer_skip_v1');
    const 원 = window.hwhoFor; window.hwhoFor = function () { return 'u2'; }; hmReferPaint();
    const e = document.getElementById('hmReferHost');
    const 남 = { t: e.innerText.replace(/\s+/g, ' '), b: [...e.querySelectorAll('button')].map(x => x.textContent.trim()) };
    window.hwhoFor = 원;
    const keep = AR.db; AR.db = null; const 못 = hmReferHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    AR.db = keep.map(r => Object.assign({}, r, { stage: 'AP' })); const 없 = hmReferHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    AR.db = keep; hmReferPaint();
    return { 남, 못, 없 };
  });
  is(F.남.b.every(x => !/소개 받음/.test(x)) && /고치실 수 있는 분|담당/.test(F.남.t),
     '  ★ 남의 고객이면 <b>바꾸는 단추를 안 세우고</b> 까닭을 적는다 — ' + F.남.b.join(' · '));
  is(/못 읽었습니다/.test(F.못) && !/\d+분/.test(F.못), '  ★ 못 읽었으면 수를 안 적는다 (1번)');
  is(/없습니다/.test(F.없), '  ★ 없는 날도 자리를 지키고 「없습니다」');

  console.log('\n[7] 지어 넣은 수 · 손가락');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const i0 = SRC.indexOf('function hmReferRows('), i1 = SRC.indexOf('\nfunction hmReferSay(');
  const 몸 = SRC.slice(i0, i1).replace(/\/\*[\s\S]*?\*\//g, '');
  is(i0 > 0 && !/days\s*[<>]=?\s*\d|pAt[^;]*[<>]\s*\d{1,3}\b|>=\s*\d+\s*\)/.test(몸),
     '  ★ 「며칠 뒤에 여쭈라」 는 수를 <b>지어 넣지 않았다</b> — 차례는 단계 표가 정합니다 (1번)');
  const B2 = await p.evaluate(LOOK);
  is(B2.작은.length === 0, '  누르는 자리가 다 44px 이상 — ' + (B2.작은.join(' · ') || '작은 것 없음'));
  is(errs.length === 0, '  오류 없이 선다' + (errs.length ? (' ← ' + errs[0]) : ''));

  console.log('\n[9] 폰에서 <b>접힌 머리</b>에 수가 서나 (판 X281 · 접어도 수가 보여야 접기입니다)');
  const H9 = await p.evaluate(async () => {
    hmFoldSet('stk_hmReferHost', false); go('home'); await new Promise(r => setTimeout(r, 300));
    const f = document.getElementById('hmFold_stk_hmReferHost');
    const sp = f ? f.querySelector('.hm-fold-h .t span') : null;
    return { 접힘: !!(f && !f.classList.contains('on')), 머리: sp ? sp.textContent : '',
             ask: sp ? sp.getAttribute('data-ask') : '', 키: f ? Math.round(f.getBoundingClientRect().height) : 0,
             속: (document.querySelector('#hmReferHost [data-ask]') || {}).textContent || '' };
  });
  is(H9.접힘 && /^\d+분$/.test(H9.머리) && H9.ask === '소개여쭐분' && H9.머리 === H9.속,
     '  ★ 접힌 머리에 <b>「' + H9.머리 + '」</b> — 속과 같은 수 · 같은 이름표 · 키 ' + H9.키 + 'px');

  await b.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 💬 소개 여쭐 차례 — 한 분씩, 같은 자가 셉니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
