/* ══ 🧭 check-hmway — 하루 다섯 걸음 (판 X285) ══════════════════════════════════
   사장님 말씀 (2026-11-01) 「처음부터 끝까지 이 한칸으로 모든 방향성을 잡을수 있도록」 →
   세 꼴 가운데 「하루 다섯 걸음」.

   묻는 것
     [1] 머리(인사 · 다섯 걸음 띠 · 진행 막대)가 「지금 할 것」 테두리 <b>맨 위</b>인가
     [2] 띠의 다섯 칸이 표(HM_WAY) 차례이고, 칸마다 수가 <b>그 칸을 세는 자</b>와 같은가
         (새로 세지 않음 · 5번) · 못 세면 「—」 (1번) · ① 은 진행 막대 「몇 / 몇」 과 같은가
     [3] 「지금 걸음」 이 할 것이 남은 첫 걸음인가 · 띠와 칸 이름표가 같은 걸음을 가리키나
         · 「이분 끝」 을 다 누르면 다음 걸음으로 넘어가나
     [4] 걸음 이름표가 칸 윗금에 <b>위에서부터 ①→⑤</b> 로 서나
     [5] 띠를 누르면 그 걸음으로 가고, 접혀 있으면 펴나
     [6] 손가락 44px · 글 14px 바닥 · 폰에서 다섯 칸이 <b>한 줄</b>(밀어 보는 줄 아님 · 판 X227)
     [8] 🎨 걸음마다 제 색(판 X286) — 다섯 가지 · 띠 칸·이름표·칸 왼쪽 띠가 같은 색 · 글 4.5:1
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9057;
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
  /* 폰에서는 이 칸이 <b>접힌 채</b> 섭니다(판 X287 · 홈 선 안에 들이려고). 속을 재려면 먼저
     폅니다 — 여닫는 자는 앱의 hmFoldSet 하나입니다. 접힌 머리는 아래 [9] 가 따로 봅니다. */
  HWHO.id=''; go('home');
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

  console.log('\n[1] 머리가 테두리 맨 위');
  const A = await p.evaluate(() => {
    const w = document.getElementById('hmJobWrap'), hd = document.getElementById('hmTodayHd');
    return { kids: w ? [...w.children].map(x => x.id).join(' · ') : '',
             greet: !!(hd && hd.querySelector('.tz-greet')), rail: hd ? hd.querySelectorAll('.hm-way-c').length : 0,
             bar: !!(hd && hd.querySelector('.tz-pbar')), psub: (hd && hd.querySelector('.tz-psub') || {}).textContent || '' };
  });
  is(A.kids === 'hmTodayHd · hmJobHost · hmStack', '  테두리 안 차례가 <b>머리 → ① 지금 할 것 → 넷</b> — ' + A.kids);
  is(A.greet && A.rail === 5 && A.bar, '  머리에 인사 · 다섯 걸음 띠(' + A.rail + '칸) · 진행 막대가 선다');

  console.log('\n[2] 띠의 수가 그 칸을 세는 자와 같다');
  const B = await p.evaluate(() => {
    const c = [...document.querySelectorAll('#hmTodayHd .hm-way-c')].map(e => ({
      t: e.querySelector('.t').textContent.trim(), v: e.querySelector('.v').textContent.trim() }));
    const r = hmNext(), w = hwhoFor();
    let ap = null; try { const L = mcalDay(mcalItems(), mcalToday()); ap = L ? L.filter(x => x && x.k === 'appt').length : null; } catch (e) {}
    const late = arApptPast(w), ref = hmReferRows(w), act = hmActOf(); let md = null; try { md = mstDueList(); } catch (e) {}
    return { c, 표: HM_WAY.map(x => x.no + ' ' + x.t),
             want: [ r && r.n ? ((r.i || 0) + ' / ' + r.n) : '—',
                     ap === null ? '—' : ('약속 ' + ap),
                     (late && ref) ? (late.length + ' · ' + ref.length) : '—',
                     act ? ('☎' + act.call + ' 🤝' + act.meet) : '—',
                     md ? ('마디 ' + md.monLeft) : '—' ],
             psub: (document.querySelector('#hmTodayHd .tz-psub') || {}).textContent || '' };
  });
  is(B.c.map(x => x.t).join(',') === B.표.join(','), '  다섯 칸이 <b>표(HM_WAY) 차례</b> — ' + B.c.map(x => x.t).join(' → '));
  B.c.forEach((x, i) => is(x.v === B.want[i], '  ' + x.t + ' 「' + x.v + '」 = 세는 자 「' + B.want[i] + '」'));
  is(B.psub.indexOf(B.c[0].v) === 0, '  ★ ① 이 <b>진행 막대 「몇 / 몇」 과 같은 수</b> — 「' + B.c[0].v + '」 · 「' + B.psub.slice(0, 8) + '」');
  const 못 = await p.evaluate(() => { const keep = AR.db; AR.db = null; const h = hmWayRail(); AR.db = keep;
    const d = document.createElement('div'); d.innerHTML = h; return [...d.querySelectorAll('.v')].map(x => x.textContent)[2]; });
  is(못 === '—', '  ★ 못 읽었으면 수 대신 <b>「—」</b> — 「0」 이라 적지 않습니다 (1번) · ③ 「' + 못 + '」');

  console.log('\n[3] 지금 걸음');
  const C = await p.evaluate(async () => {
    const on = () => ({ rail: [...document.querySelectorAll('#hmTodayHd .hm-way-c')].findIndex(e => e.classList.contains('on')),
                        tag: (document.querySelector('#hmJobWrap .hm-way-on') || { getAttribute: () => '' }).getAttribute('data-way') });
    const 처음 = on();
    /* 오늘 줄을 다 끝냅니다 — 앱의 「이분 끝」 자리(hmQdoneSet)로만 */
    hmSteps().forEach(x => hmQdoneSet(x.key)); hmPaint(); await new Promise(r => setTimeout(r, 300));
    const 뒤 = on(), now = hmWayNow(), 표 = HM_WAY.map(x => x.no + ' ' + x.t);
    return { 처음, 뒤, now, 표 };
  });
  is(C.처음.rail === 0 && C.처음.tag === C.표[0], '  오늘 볼 분이 남았으면 <b>① 연락</b>이 지금 걸음 — 띠·이름표가 같은 걸음');
  is(C.뒤.rail === C.now && C.뒤.rail > 0 && C.뒤.tag === C.표[C.now],
     '  ★ 「이분 끝」 을 다 누르면 <b>다음 걸음</b>으로 — ' + C.뒤.tag + ' (띠 ' + C.뒤.rail + ')');
  is(C.now === 2, '  그 다음은 할 것이 남은 첫 걸음 — 약속 지난 분이 있으니 <b>③ 정리</b> · ' + C.now);

  console.log('\n[4] 이름표 차례');
  const D = await p.evaluate(() => [...document.querySelectorAll('#hmJobWrap [data-way]')]
    .map(e => ({ t: e.getAttribute('data-way'), y: Math.round(e.getBoundingClientRect().top) })));
  is(D.length === 5 && D.every((x, i) => i === 0 || x.y > D[i - 1].y) &&
     D.map(x => x.t.split(' ')[0]).join('') === '①②③④⑤', '  이름표 다섯이 <b>위에서부터 ①→⑤</b> — ' + D.map(x => x.t).join(' · '));

  console.log('\n[5] 띠를 누르면');
  const E = await p.evaluate(async () => {
    const f = document.getElementById('hmFold_stk_hmLateHost'); if (f && f.classList.contains('on')) hmFoldToggle('stk_hmLateHost');
    const 전 = !!(document.getElementById('hmFold_stk_hmLateHost') || {}).classList && document.getElementById('hmFold_stk_hmLateHost').classList.contains('on');
    document.querySelectorAll('#hmTodayHd .hm-way-c')[2].click();
    await new Promise(r => setTimeout(r, 900));
    const g = document.getElementById('hmFold_stk_hmLateHost');
    return { 전, 펴짐: !!(g && g.classList.contains('on')), top: g ? Math.round(g.getBoundingClientRect().top) : -1 };
  });
  is(!E.전 && E.펴짐, '  ★ ③ 을 누르면 접혀 있던 🕗 칸이 <b>펴진다</b>');
  is(E.top >= -4 && E.top < 300, '  그 칸이 화면 위쪽으로 온다 — y' + E.top);

  console.log('\n[6] 손가락 · 글 · 한 줄');
  const F = await p.evaluate(() => {
    const c = [...document.querySelectorAll('#hmTodayHd .hm-way-c')];
    const fs = [...document.querySelectorAll('#hmTodayHd .hm-way-c span')].map(e => parseFloat(getComputedStyle(e).fontSize));
    return { 작은: c.filter(e => e.getBoundingClientRect().height < 44).length,
             윗변: new Set(c.map(e => Math.round(e.getBoundingClientRect().top))).size,
             글: Math.min.apply(null, fs), 넘침: c.filter(e => e.scrollWidth > e.clientWidth + 1).length,
             옆샘: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  is(F.작은 === 0, '  다섯 칸이 다 <b>44px 이상</b>');
  is(F.윗변 === 1, '  ★ 폰(390)에서 다섯 칸이 <b>한 줄</b>이다 — 밀어 보는 줄이 아닙니다 (판 X227)');
  is(F.글 >= 14, '  글이 <b>14px 바닥</b> 위 — ' + F.글 + 'px');
  is(!F.옆샘, '  옆으로 안 샌다');
  is(errs.length === 0, '  오류 없이 선다' + (errs.length ? (' ← ' + errs[0]) : ''));

  console.log('\n[8] 🎨 걸음마다 제 색 (판 X286 · 사장님 말씀 「각자 역할이 다르다는것을」)');
  const G = await p.evaluate(() => {
    const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(v => v / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const chips = [...document.querySelectorAll('#hmTodayHd .hm-way-c')];
    const 띠색 = chips.map(e => { const d = document.createElement('i'); d.setAttribute('data-wc', e.getAttribute('data-wc'));
      d.style.color = 'var(--wc)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    const on = chips.filter(e => e.classList.contains('on'))[0];
    const onCr = on ? cr(getComputedStyle(on).backgroundColor, getComputedStyle(on.querySelector('.t')).color) : 0;
    const idleCr = Math.min.apply(null, chips.filter(e => !e.classList.contains('on'))
      .map(e => cr(getComputedStyle(e).backgroundColor, getComputedStyle(e.querySelector('.t')).color)));
    const st = document.getElementById('hmStack');
    const 칸 = st ? [...st.children].filter(e => e.getBoundingClientRect().height > 0) : [];
    const 띠없음 = 칸.filter(e => !e.getAttribute('data-wc')).map(e => e.id || e.className);
    /* 칸 왼쪽 세로 띠의 색이 <b>그 걸음 띠 칸의 색</b>과 같은가 */
    /* 걸음의 <b>본 색</b>(--wc)을 그대로 떠 옵니다 — 지금 걸음 칸은 글이 읽히게 짙은 짝으로 칠하므로
       칸 테두리로 견주면 지금 걸음만 늘 어긋납니다(재어 보고 알았습니다) */
    const 짝 = {}; chips.forEach(e => { const k = e.getAttribute('data-wc'), d = document.createElement('i');
      d.setAttribute('data-wc', k); d.style.color = 'var(--wc)'; document.getElementById('hmJobWrap').appendChild(d);
      짝[k] = getComputedStyle(d).color; d.remove(); });
    const 어긋 = 칸.filter(e => e.getAttribute('data-wc') && getComputedStyle(e, '::after').backgroundColor !== 짝[e.getAttribute('data-wc')])
      .map(e => (e.id || e.className) + ':' + e.getAttribute('data-wc'));
    const job = document.getElementById('hmJobHost');
    return { 띠색, 다름: new Set(띠색).size, onCr, idleCr, 띠없음, 어긋, n: 칸.length,
             jobOk: !!job && job.getAttribute('data-wc') === 'call' && getComputedStyle(job, '::after').backgroundColor === 짝.call,
             표: HM_WAY.map(w => w.k).join(','), 칩: chips.map(e => e.getAttribute('data-wc')).join(',') };
  });
  is(G.칩 === G.표, '  띠 칸마다 <b>제 걸음 이름</b>(data-wc)이 달렸다 — ' + G.칩);
  is(G.다름 === 5, '  ★★ 다섯 걸음이 <b>다섯 가지 색</b>이다 — ' + G.다름 + '가지');
  is(G.jobOk, '  ① 지금 할 것 카드 왼쪽 띠가 <b>① 연락 색</b>이다');
  is(G.띠없음.length === 0 && G.n >= 5, '  ★ 넷의 <b>모든 칸</b>이 어느 걸음 색 띠를 단다 — ' + (G.띠없음.join(' · ') || G.n + '칸 다'));
  is(G.어긋.length === 0, '  ★ 칸 띠 색이 <b>그 걸음 띠 칸 색과 같다</b> — 세 자리 같은 색' + (G.어긋.length ? (' ← ' + G.어긋.join(' · ')) : ''));
  is(G.onCr >= 4.5 && G.idleCr >= 4.5, '  ★ 글이 읽힌다 — 지금 걸음 ' + G.onCr.toFixed(2) + ':1 · 나머지 가장 낮은 ' + G.idleCr.toFixed(2) + ':1 (4.5 바닥)');

  console.log('\n[7] 새로 세지 않는다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const 몸 = (n) => { const i = SRC.indexOf('function ' + n + '('); return i < 0 ? '' : SRC.slice(i, SRC.indexOf('\n', SRC.indexOf('{', i) + 1) + 400).split('\nfunction ')[0]; };
  is(/hmNext\(/.test(몸('hmWayCall')) && /mcalDay\(/.test(몸('hmWayMeetN')) && /arApptPast\(/.test(몸('hmWayTidyN')) &&
     /hmReferRows\(/.test(몸('hmWayTidyN')) && /hmActOf\(/.test(몸('hmWayRec')) && /mstDueList\(/.test(몸('hmWayCare')),
     '  ★ 칸마다 <b>그 칸이 이미 쓰는 자</b>를 부른다 — hmNext · mcalDay · arApptPast·hmReferRows · hmActOf · mstDueList');
  is(!/a\[0\]\s*\+\s*a\[1\]/.test(몸('hmWayTidy')), '  ③ 은 두 수를 <b>더하지 않고</b> 나란히 적는다 — 새 수를 만들지 않습니다');

  await b.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 🧭 하루 다섯 걸음 — 한 칸이 오늘의 길을 말합니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
