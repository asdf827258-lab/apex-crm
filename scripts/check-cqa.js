/* ══════════════════════════════════════════════════════════════════
   check-cqa.js — <b>한 번에 한 가지만 여쭙나.</b>

   2026-09-26. 사장님 말씀 — 「홈 화면에서 고객의 모든걸 컨트롤 할수
   있도록 <b>질문을 띄우고</b> 쉽게해 · <b>고객 365일 내용이 읽어내서</b>
   불러와야헤」 그리고 「<b>한 번에 한 가지씩</b>」.

   고객 365일에 담을 칸은 여덟인데 화면을 열면 스물 몇 개가 한꺼번에
   펼쳐져, 정작 <b>무엇부터 적어야 하는지</b>가 안 보였습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 카드가 서고 <b>한 가지만</b> 여쭙는다 — 급한 것부터
     [2] ★ 답하면 <b>다음 것</b>을 여쭙는다 · 값이 <b>cmSave 로</b> 간다
     [3] ★ <b>「안 적혀 있다」 와 「아직 안 읽었다」 를 가른다</b> (1번)
     [4] 표가 <b>한 곳</b>이다 — 여쭐 말이 두 벌이 아니다 (5번)
     [5] ★ <b>저장 코드를 새로 안 짰다</b> (사장님 말씀) — 서버를 직접 안 부른다
     [6] ★ 칸 표를 늘렸는데 <b>저장이 안 깨졌다</b> — cmBlank·cmBody 그대로
     [7] ★ <b>아래 칸들이 안 없어졌다</b> (6번) · 「여기에 적기」 가 그 칸으로
     [8] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9025;
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

/* 견본 — 이름은 「홍길동」 (3번).
   ★ 서버는 <b>가짜</b>로 세웁니다. 그래야 <b>진짜 cmSave 를 지나</b> 값이
     어디로 가는지 볼 수 있습니다 — cmSave 를 바꿔치기하면 「불렀다」 만
     보고 <b>무엇을 보냈는지</b>는 못 봅니다 (8번).                     */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.WROTE=[];
  window.TOASTS=[];
  window.toast=function(t){ WROTE&&TOASTS.push(''+t); };
  /* 가짜 서버 — 어느 순서로 이어 붙여도 받아 줍니다. 진짜 Supabase 처럼
     끝에 .then 이 오고, <b>쓰는 것(update·insert)만 적어 둡니다.</b> */
  const chain = v => { const o = {
      then:function(f){ try{ f(v); }catch(e){} return o; }, catch:function(){ return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k]=function(){ return o; }; });
    o.single=function(){ return chain({data:null}); };
    o.maybeSingle=function(){ return chain({data:null}); };
    return o; };
  window.osClient=function(){
    return { from:function(tb){ return {
      select:function(){ return chain({data:[]}); },
      update:function(o){ WROTE.push({op:'update',tb:tb,body:o}); return chain({}); },
      insert:function(o){ WROTE.push({op:'insert',tb:tb,body:o}); return chain({}); },
      upsert:function(o){ WROTE.push({op:'upsert',tb:tb,body:o}); return chain({}); },
      delete:function(){ return chain({}); }
    }; } };
  };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[];
  AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  OSC.list=[{id:'c1',name:'홍길동',name_masked:'홍○○',advisor_id:'me',stage:'AP',created_at:ago(60)}];
  /* 아무것도 안 적힌 분 — 그래도 <b>읽기는 끝났다</b>(loaded) */
  CM.loaded=true; CM.meta={ c1: (function(){ var m=cmBlank(); m._rid='r1'; return m; })() };
  try{ osHideLoginGate(); }catch(e){}
  osOpenClient('c1');
};

const CARD = () => {
  const el = document.getElementById('cqaCard');
  if (!el) return { 없음:true };
  const big = [].slice.call(el.querySelectorAll('.t-big'));
  const chips = [].slice.call(el.querySelectorAll('.t-chip'))
                  .map(x => x.textContent.replace(/\s+/g,' ').trim());
  const h1 = el.querySelector('.t-h1');
  return { t: el.innerText.replace(/\s+/g,' ').trim(), 물음수: big.length,
           물음: big.length ? big[0].innerText.replace(/\s+/g,' ').trim() : '',
           칩: chips, 머리: h1 ? h1.textContent.replace(/\s+/g,' ').trim() : '' };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1400);

  console.log('\n[1] 카드가 서고 <b>한 가지만</b> 여쭙는다 — 급한 것부터');
  const A = await p.evaluate(CARD);
  is(!A.없음, '  「한 가지만 물어봅니다」 카드가 <b>선다</b>');
  is(A.물음수 === 1, '  물음이 <b>딱 하나</b>다 — ' + A.물음수 + '개 (사장님 말씀 「한 번에 한 가지씩」)');
  /* ★ cqaQs 의 답으로 cqaQs 를 재면, 차례 매기기를 지워도 <b>둘이 같이</b>
       바뀌어 알람이 안 웁니다. 그래서 급한 순서를 <b>표에서 따로</b> 셉니다 (8번). */
  const 첫물음 = await p.evaluate(() => {
    const P = [];
    for (let i = 0; i < CM_FIELDS.length; i++)
      if (CM_FIELDS[i][3] && CM_FIELDS[i][3].pri)
        P.push([CM_FIELDS[i][0], CM_FIELDS[i][3].pri, CM_FIELDS[i][3].ask]);
    P.sort((a, b) => a[1] - b[1]);
    return { 표순서: P.map(x => x[0]).join(','), 선순서: cqaQs().map(x => x.k).join(','),
             가장급한말: P.length ? P[0][2] : '' };
  });
  is(첫물음.표순서 === 첫물음.선순서 && !!첫물음.표순서,
     '  차례가 <b>급한 순서(pri) 그대로</b>다 — ' + 첫물음.선순서 +
     (첫물음.표순서 === 첫물음.선순서 ? '' : ('\n      ✗ 표는 ' + 첫물음.표순서)));
  is(!!첫물음.가장급한말 && A.물음.indexOf(첫물음.가장급한말) >= 0,
     '  <b>가장 급한 것</b>을 여쭙는다\n      · 지금 물음: ' + A.물음);
  is(/아는 것/.test(A.머리) && /\/ \d+가지/.test(A.머리),
     '  <b>아는 것 몇 가지</b>인지 위에 적는다 — ' + A.머리);
  /* ★ 칩 바탕이 카드와 <b>같은 색</b>이면 글자만 남아 <b>누를 수 있는 줄
     모릅니다.</b> 서랍에서 「로그인 / 계정」 이 흰 바탕에 흰 글씨였던 것과
     같은 자리입니다 — 눈으로만 보면 못 봅니다. 색을 <b>재서</b> 봅니다. */
  const 칩색 = await p.evaluate(() => {
    const el = document.getElementById('cqaCard');
    const c = el.querySelector('.t-chip');
    if (!c) return null;
    const rgb = s => (s.match(/\d+/g) || [0,0,0]).map(Number);
    const a = rgb(getComputedStyle(c).backgroundColor), b = rgb(getComputedStyle(el).backgroundColor);
    const bd = getComputedStyle(c).borderTopWidth;
    return { 차이: Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]),
             칩: a.join(','), 카드: b.join(','), 테두리: parseFloat(bd) || 0 };
  });
  is(!!칩색 && (칩색.차이 >= 8 || 칩색.테두리 >= 1),
     '  ★ 칩이 <b>카드 위에서 보인다</b> — 칩 rgb(' + (칩색 ? 칩색.칩 : '?') + ') · 카드 rgb(' +
     (칩색 ? 칩색.카드 : '?') + ') · 차이 ' + (칩색 ? 칩색.차이 : '?') +
     '. 같은 색이면 글자만 남아 누를 수 있는 줄 모릅니다');

  console.log('\n[2] ★ 답하면 <b>다음 것</b>을 여쭙는다 · 값이 <b>cmSave 로</b> 간다');
  const B = await p.evaluate(async () => {
    const btn = [].slice.call(document.querySelectorAll('#cqaCard .t-chip'))
                  .filter(x => /내일 전화/.test(x.textContent))[0];
    if (!btn) return { 단추없음:true };
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    const el = document.getElementById('cqaCard');
    const w = (WROTE || []).filter(x => x.tb === 'saved_reports');
    return { 쓴것: w, 담긴것: cmOf('c1').next,
             물음: (el && el.querySelector('.t-big')) ?
                   el.querySelector('.t-big').innerText.replace(/\s+/g,' ').trim() : '',
             머리: (el && el.querySelector('.t-h1')) ? el.querySelector('.t-h1').textContent.replace(/\s+/g,' ').trim() : '' };
  });
  is(!B.단추없음 && B.쓴것.length === 1,
     '  <b>서버로 한 번만</b> 갔다 — ' + (B.쓴것 ? B.쓴것.length : 0) + '번');
  is(!!(B.담긴것 && B.담긴것.what && /^\d{4}-\d{2}-\d{2}$/.test(B.담긴것.due || '')),
     '  다음 할 일이 <b>말과 날짜로</b> 담겼다 — ' +
     (B.담긴것 ? (B.담긴것.what + ' · ' + B.담긴것.due) : '(안 담김)'));
  const 보낸것 = (B.쓴것 && B.쓴것[0] && B.쓴것[0].body && B.쓴것[0].body.content) || {};
  is(!!(보낸것.next && 보낸것.next.what),
     '  ★ <b>cmSave 가 만든 꼴 그대로</b> 서버로 갔다 — content.next 가 있다');
  /* ★ 수를 <b>여기 박지 않습니다</b> — 칸을 하나 더할 때마다 이 줄을 손으로
     고쳐야 하면, 고치는 것을 잊은 날 <b>안 울립니다</b>. 칸 표에서 세어
     견줍니다 (8번). 자가 묻는 것은 그대로입니다 — <b>표만큼 보냈나</b>. */
  const 칸수 = await p.evaluate(() => CM_FIELDS.length);
  is(Object.keys(보낸것).length === 칸수,
     '  ★ 다른 칸이 <b>같이 날아가지 않았다</b> — 보낸 칸 ' + Object.keys(보낸것).length +
     '개 / 표 ' + 칸수 + '개 (하나라도 빠지면 그 칸이 서버에서 지워집니다)');
  is(B.물음 && B.물음 !== A.물음,
     '  ★ <b>다음 것</b>을 여쭙는다 — ' + B.물음);
  is(/아는 것 1/.test(B.머리), '  아는 것이 <b>하나 늘었다</b> — ' + B.머리);

  console.log('\n[3] ★ <b>「안 적혀 있다」 와 「아직 안 읽었다」 를 가른다</b> (1번)');
  const C = await p.evaluate(() => {
    const 담 = CM.loaded;
    CM.loaded = false;
    const h = cqaInner('c1');
    const t = cqaTally('c1');
    CM.loaded = 담;
    return { h: h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(), t: t };
  });
  is(C.t === null, '  못 읽었으면 <b>셈이 null</b> 이다 — 0 이 아니다');
  is(/아직 못 읽었/.test(C.h), '  <b>「아직 못 읽었습니다」</b> 라고 적는다 — ' + C.h.slice(0, 60));
  is(!/아는 것 0/.test(C.h) && !/0가지/.test(C.h.replace('「0가지」','')),
     '  ★ <b>「0가지」 라고 적지 않는다</b> — 다 적어 두신 분께 거짓말이 됩니다');

  console.log('\n[4] 표가 <b>한 곳</b>이다 — 여쭐 말이 두 벌이 아니다 (5번)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((SRC.match(/var CM_FIELDS=/g) || []).length === 1, '  칸 표가 <b>한 벌</b>이다');
  is(!/var CQA_Q\s*=/.test(SRC),
     '  ★ 여쭐 말을 <b>따로 표로 안 만들었다</b> — CM_FIELDS 넷째 칸에서 읽는다');
  is(/function cqaQs\(\)\{[\s\S]{0,260}CM_FIELDS\.length/.test(SRC),
     '  여쭐 것을 <b>CM_FIELDS 에서</b> 읽는다');
  is(/function cqaHows\(\)\{[\s\S]{0,200}CM_HOW/.test(SRC),
     '  연락 방법도 <b>CM_HOW 한 곳</b>에서 온다 — 방법을 더할 때 한쪽만 늘지 않는다');
  /* 팩트파인딩 「네 칸」 이 두 곳에 적혀 있다 — 갈리면 한쪽만 늘어난다 */
  const MIN = await p.evaluate(() => CQA_FF_MIN);
  is(SRC.indexOf('if(n<' + MIN + '){toast(\'팩트파인딩') >= 0,
     '  ★ 팩트파인딩 기준 칸수가 <b>cmFfAsk 와 같다</b> — ' + MIN + '칸');

  console.log('\n[5] ★ <b>저장 코드를 새로 안 짰다</b> (사장님 말씀)');
  const i0 = SRC.indexOf('한 가지만 물어봅니다'), i1 = SRC.indexOf('function cmPanelsHtml(id){');
  const BLK = (i0 >= 0 && i1 > i0) ? SRC.slice(i0, i1) : '';
  is(BLK.length > 2000, '  cqa 묶음을 찾았다 — ' + BLK.length + '자');
  [['.from(', '서버 표를 직접 부르는'], ['.insert(', '직접 넣는'], ['.update(', '직접 고치는'],
   ['fetch(', '직접 받아 오는'], ['localStorage', '따로 담아 두는']].forEach(x =>
    is(BLK.indexOf(x[0]) < 0, '  ★ ' + x[1] + ' 줄이 <b>한 줄도 없다</b> — ' + x[0]));
  is(/cmSave\(id,\{next:/.test(BLK) && /cmSave\(id,\{touch:/.test(BLK),
     '  ★ 쓰는 것은 <b>cmSave 하나</b>로만 한다 — 기존 함수를 부르기만 한다');
  is(BLK.indexOf('classList.add') >= 0 && !/\.className\s*=/.test(BLK),
     '  클래스를 <b>통째로 대입하지 않는다</b> — 다른 곳이 붙여 둔 것을 잃습니다 (5번)');

  console.log('\n[6] ★ 칸 표를 늘렸는데 <b>저장이 안 깨졌다</b>');
  const D = await p.evaluate(() => {
    const b = cmBlank(), body = cmBody(b);
    const T = {}; for (let i = 0; i < CM_FIELDS.length; i++) T[CM_FIELDS[i][0]] = CM_FIELDS[i][1];
    /* 줄 칸이 <b>넘치면 잘리는지</b> — 셋째 자리를 살려 두었는가 */
    const big = cmBlank(); big.touch = []; for (let i = 0; i < 80; i++) big.touch.push({ at:'2026-01-01' });
    big.fams = []; for (let i = 0; i < 40; i++) big.fams.push('x');
    const cut = cmBody(big);
    return { 칸: Object.keys(b).sort().join(','), 보낼칸: Object.keys(body).sort().join(','),
             갈래: T, 접촉잘림: cut.touch.length, 가족잘림: cut.fams.length,
             빈것: { fp: JSON.stringify(b.fp), touch: JSON.stringify(b.touch),
                     next: JSON.stringify(b.next), up: JSON.stringify(b.up), bd: JSON.stringify(b.bd) } };
  });
  /* 같은 까닭 — 이름을 손으로 적어 두면 칸을 더할 때마다 낡습니다.
     <b>칸 표에서 이름을 뽑아</b> 견줍니다 (8번). 2026-09-27 에 「무엇을
     제일 걱정하시나」(worry) 가 들어와 열셋이 됐고, 이 자는 <b>스스로</b>
     따라왔습니다 — 손으로 고칠 곳이 없습니다.                         */
  const 원래 = await p.evaluate(() => CM_FIELDS.map(f => f[0]).sort().join(','));
  is(D.칸 === 원래, '  빈 칸 만들기가 <b>칸 표 그대로</b>다 (' +
     원래.split(',').length + '칸) — ' + D.칸);
  is(D.보낼칸 === 원래, '  서버로 보낼 꼴도 <b>칸 표 그대로</b>다');
  is(D.빈것.fp === '{}' && D.빈것.touch === '[]' && D.빈것.next === 'null' &&
     D.빈것.up === '0' && D.빈것.bd === '""',
     '  빈 값의 <b>갈래가 그대로</b>다 — obj{} · arr[] · any null · num 0 · str ""');
  is(D.접촉잘림 === 60, '  접촉 기록이 <b>60건에서 잘린다</b> — ' + D.접촉잘림 + '건');
  /* ★ 여기가 진짜 알람입니다. cmBody 는 CM_FIELDS[i][2]||60 을 읽으므로
     touch 의 60 을 0 으로 덮어도 <b>60 그대로</b>라 안 웁니다. fams 의 12 는
     0 으로 덮으면 60 이 되어 <b>즉시 웁니다</b> — 칸 표에 넷째 자리를 붙이며
     셋째 자리를 밀어내지 않았는지를 이 한 줄이 봅니다 (8번).            */
  is(D.가족잘림 === 12, '  ★ 가족 줄이 <b>12줄에서 잘린다</b> — ' + D.가족잘림 +
     '줄 (셋째 자리를 밀어냈으면 60줄이 됩니다)');

  console.log('\n[7] ★ <b>아래 칸들이 안 없어졌다</b> (6번) · 「여기에 적기」 가 그 칸으로');
  const E = await p.evaluate(() => {
    const t = (document.getElementById('cmPanels') || {}).innerText || '';
    const one = id => document.querySelectorAll('#' + id).length;
    return { 관계:/관계/.test(t), 가족:/가족으로 묶기/.test(t), 팩트:/팩트파인딩/.test(t),
             통장:/빈 통장/.test(t),
             칸: { cmNextWhat:one('cmNextWhat'), cmBd:one('cmBd'), cmFam:one('cmFam'),
                   cmCd:one('cmCd'), cmRef:one('cmRef'), cmTouchNote:one('cmTouchNote') } };
  });
  is(E.관계 && E.가족 && E.팩트 && E.통장, '  아래 네 칸(관계·빈 통장·가족·팩트파인딩)이 <b>그대로 있다</b>');
  const 둘 = Object.keys(E.칸).filter(k => E.칸[k] !== 1);
  is(둘.length === 0, '  ★ 적는 칸이 <b>하나씩</b>이다 — 두 벌이면 저장이 엉뚱한 칸을 읽는다 (5번)' +
     (둘.length ? ('\n      ✗ ' + 둘.map(k => k + ' ' + E.칸[k] + '개').join(' · ')) : ''));
  const F = await p.evaluate(async () => {
    /* 생일을 여쭐 차례까지 답해 놓고, 「여기에 적기」 가 <b>진짜 그 칸</b>으로 가는지 */
    cmOf('c1').touch = [{ at:'2026-09-01', how:'전화', note:'' }];
    cqaRepaint('c1');
    await new Promise(r => setTimeout(r, 400));
    const el = document.getElementById('cqaCard');
    const btn = [].slice.call(el.querySelectorAll('.t-chip'))
                  .filter(x => /여기에 적기/.test(x.textContent))[0];
    const q = el.querySelector('.t-big');
    if (!btn) return { 단추없음:true, 물음: q ? q.innerText : '' };
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const a = document.activeElement;
    return { 물음: q ? q.innerText.replace(/\s+/g,' ').trim() : '',
             간곳: a ? (a.id || a.tagName) : '', 짚었나: !!(a && a.classList && a.classList.contains('cqa-hi')) };
  });
  is(F.간곳 === 'cmBd',
     '  「여기에 적기」 가 <b>있는 칸으로</b> 데려간다 — ' + F.간곳 + ' (물음: ' + F.물음 + ')');
  is(F.짚었나, '  데려간 칸을 <b>짚어 준다</b> — 데려다 놓고 말을 안 하면 어느 칸인지 모릅니다');

  console.log('\n[8] ★ <b>홈에도 선다</b> — 사장님 말씀 X07');
  /* 대장 X07 「홈 화면에서 고객의 모든걸 컨트롤 할수 있도록 질문을 띄우고
     쉽게해」. 카드는 먼저 고객 365일에 세웠고(#480), 홈은 다른 세션이
     고치는 중이라 한 글자도 안 건드렸습니다. 그쪽이 끝나 이제 붙였습니다.
     ★ <b>카드는 한 곳</b>입니다 — 홈이 cqaHtml 을 그대로 부릅니다 (5번).  */
  const H = await p.evaluate(async () => {
    /* ★ 오늘 줄에 <b>사람 하나</b>가 서야 카드가 뜹니다. 계약일을 <b>정확히
       석 달 전</b>으로 두면 계약 마디가 그 분을 오늘 줄에 올립니다 —
       견본을 안 깔고 재면 「안 뜬다」 를 <b>없는 것</b>으로 착각합니다. */
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    cmOf('c1').cd = d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) +
                    '-' + ('0'+d.getDate()).slice(-2);
    cmOf('c1').next = null;
    go('home');
    await new Promise(r => setTimeout(r, 900));
    const card = document.querySelector('#dynPane #cqaCard');
    const n = document.querySelectorAll('#dynPane #cqaCard').length;
    /* 물음에 따라 단추 이름이 다릅니다 — 「직접 적기」(누르는 물음) ·
       「한 줄 적기」(접촉) · 「여기에 적기」(적는 물음). <b>cqaFld 로 가는
       단추 전부</b>를 봅니다 — 하나만 찾으면 그 물음이 아닐 때 헛것입니다. */
    const fld = card ? [].slice.call(card.querySelectorAll('.t-chip'))
                         .filter(b => /cqaFld\(/.test(b.getAttribute('onclick') || '')) : [];
    return { 있나: !!card, 몇개: n, 칸단추: fld.length,
             물음: card && card.querySelector('.t-big')
                   ? card.querySelector('.t-big').innerText.replace(/\s+/g,' ').trim().slice(0,30) : '',
             데려가나: fld.length > 0 &&
                       fld.every(b => /cqaFld\('[^']*'\s*,\s*'[^']+'\)/.test(b.getAttribute('onclick') || '')) };
  });
  is(H.있나, '  ★ 홈에도 <b>같은 카드</b>가 선다 — ' + (H.물음 || '(물음 없음)'));
  is(H.몇개 === 1, '  카드가 <b>홈에 하나</b>다 (5번) — ' + H.몇개 + '개');
  is(H.데려가나,
     '  ★ 홈에서 <b>적으러 가는 단추</b>가 그 분 번호를 들고 간다 — ' + H.칸단추 + '개\n' +
     '      홈에는 그 칸이 없어서, 번호가 없으면 쪽지만 뜨고 <b>막다른 길</b>이 됩니다 (1번)');

  /* ★ 홈에서는 <b>물음 한 가지만</b> 섭니다 — 세는 줄·자·꼬리글을 안 그립니다.
       접힌 홈이 한 화면(844px)에 들어야 해서입니다(X03 · check-homeshape).
       카드를 그대로 붙였더니 접어도 <b>1027px</b> 이었습니다.
     ★ 그런데 <b>감춘 것이 아님</b>을 같이 재야 합니다 (6번) — 상세에서는
       세는 줄이 그대로 서야 합니다. 둘을 <b>한 자리에서</b> 견줍니다.    */
  const G = await p.evaluate(() => {
    const card = document.querySelector('#dynPane #cqaCard');
    const 홈 = card ? { h1:!!card.querySelector('.t-h1'), bar:!!card.querySelector('.t-bar'),
                        sub:!!card.querySelector('.t-sub'), big:!!card.querySelector('.t-big'),
                        chip:card.querySelectorAll('.t-chip').length,
                        cmp:card.getAttribute('data-cmp') } : null;
    /* 같은 분을 <b>상세 꼴로</b> 그려 봅니다 — 화면을 옮기지 않고 글만 봅니다 */
    const 상세 = cqaInner('c1');
    return { 홈: 홈,
             상세머리: /class="t-h1"/.test(상세), 상세자: /class="t-bar"/.test(상세),
             상세꼬리: /한 번에 한 가지만/.test(상세) };
  });
  is(!!G.홈 && !G.홈.h1 && !G.홈.bar && !G.홈.sub,
     '  ★ 홈에서는 <b>물음 한 가지만</b> 선다 — 세는 줄 ' + (G.홈 && G.홈.h1 ? '있음' : '없음') +
     ' · 자 ' + (G.홈 && G.홈.bar ? '있음' : '없음') + ' · 꼬리글 ' +
     (G.홈 && G.홈.sub ? '있음' : '없음') + ' (접힌 홈이 한 화면에 들어야 합니다)');
  is(!!G.홈 && G.홈.big && G.홈.chip > 0 && G.홈.cmp === '1',
     '  홈 카드가 <b>제 몸에 홈이라 적어 둔다</b> — data-cmp=' + (G.홈 ? G.홈.cmp : '?') +
     ' (다시 그릴 때 또 세지 않습니다 · 5번)');
  is(G.상세머리 && G.상세자 && G.상세꼬리,
     '  ★ <b>감춘 것이 아니다</b> (6번) — 상세에서는 세는 줄·자·꼬리글이 <b>그대로</b> 선다');

  /* ★ 여쭐 것이 없으면 <b>홈에 상자를 안 세웁니다</b> (1번).
     둘 다 봅니다 — <b>못 읽었을 때</b>와 <b>다 알 때</b>. 한쪽만 비우면
     왜 어떤 날은 빈 상자가 뜨는지 아무도 설명할 수 없습니다.           */
  const I = await p.evaluate(() => {
    const 담 = CM.loaded; CM.loaded = false;
    const 못읽음 = { 홈: cqaInner('c1', 1), 상세: cqaInner('c1') };
    CM.loaded = 담;
    return { 못읽음홈: 못읽음.홈, 못읽음상세: /아직 못 읽었/.test(못읽음.상세) };
  });
  is(I.못읽음홈 === '',
     '  ★ 못 읽었으면 홈에 <b>상자를 안 세운다</b> — 「' + I.못읽음홈.slice(0, 30) +
     '」 (값이 없으면 화면을 세우지 않습니다 · 1번)');
  is(I.못읽음상세,
     '  그래도 상세에서는 <b>못 읽었다고 적는다</b> — 홈에서 조용한 것이 「없다」 는 뜻이 아닙니다');

  /* ★ <b>답한 뒤에도 홈 꼴이 유지되나</b> — 여기서 한 번 틀렸습니다.
     다시 그리는 cqaRepaint 가 「홈이냐」 를 모르면, 답하는 순간 세는 줄이
     되살아나 카드가 <b>다시 길어집니다</b>. 그래서 카드 제 몸에 적어 둡니다. */
  const K = await p.evaluate(async () => {
    /* ★ <b>cqaRepaint 를 직접</b> 부릅니다. 칩을 눌러서 재면 홈 전체가 다시
       그려져 cqaRepaint 가 한 일을 덮어 버립니다 — 고장을 넣어도 초록인
       <b>헛 점검</b>이 됩니다. 실제로 그랬습니다 (8번).                  */
    const 전 = document.querySelector('#dynPane #cqaCard');
    const 전h = 전 ? Math.round(전.getBoundingClientRect().height) : 0;
    cmOf('c1').touch = [{ at:'2026-09-02', how:'전화', note:'' }];
    cqaRepaint('c1');
    /* ★ <b>기다리지 않고 바로</b> 봅니다. 홈은 잠시 뒤 스스로 다시 그려서
       cqaRepaint 가 잘못 그린 것을 <b>덮어 버립니다</b> — 300ms 를 기다리고
       재면 고장을 넣어도 초록인 헛 점검이 됩니다. 실제로 그랬습니다 (8번).
       덮이더라도 그 사이 카드가 <b>한 번 껑충 뛰었다 앉습니다.</b>          */
    const c2 = document.querySelector('#dynPane #cqaCard');
    return { 전: 전h, 후: c2 ? Math.round(c2.getBoundingClientRect().height) : 0,
             머리: !!(c2 && c2.querySelector('.t-h1')), 있나: !!c2,
             바뀜: !!(c2 && c2.querySelector('.t-big')) };
  });
  is(K.있나 && !K.머리 && K.바뀜,
     '  ★ <b>다시 그려도 홈 꼴</b>이다 — 세는 줄 ' + (K.머리 ? '되살아남 ✗' : '없음') +
     ' · ' + K.전 + 'px → ' + K.후 + 'px (cqaRepaint 가 카드 제 몸에 물어야 합니다)');

  /* ★ <b>접으면 같이 접힌다</b> — 번호 갈래와 같은 자리입니다.
       접어도 카드가 남으면 check-homeshape 가 빨간불입니다.
     ★ <b>다시 펴면 돌아와야</b> 합니다 — 안 돌아오면 그건 지운 것입니다 (6번). */
  const J = await p.evaluate(async () => {
    const n = () => document.querySelectorAll('#dynPane #cqaCard').length;
    const b = document.querySelector('#dynPane .hm-more-b');
    if (!b) return { 단추없음:true };
    const 펴짐 = n();
    b.click(); await new Promise(r => setTimeout(r, 500));
    const 접힘 = n();
    const b2 = document.querySelector('#dynPane .hm-more-b');
    if (b2) { b2.click(); await new Promise(r => setTimeout(r, 500)); }
    return { 펴짐: 펴짐, 접힘: 접힘, 다시: n() };
  });
  is(!J.단추없음 && J.펴짐 === 1 && J.접힘 === 0 && J.다시 === 1,
     '  ★ <b>접으면 같이 접히고 펴면 돌아온다</b> — 펴짐 ' + J.펴짐 + ' → 접힘 ' + J.접힘 +
     ' → 다시 ' + J.다시 + '개 (접어도 남으면 홈이 한 화면을 넘습니다)');

  /* ══ [9-1] 😟 <b>무엇을 제일 걱정하시나 → 첫 문장에 붙일 것</b> ═══
     사장님 말씀 (2026-09-27 · 목각 사진 2) 「무엇을 제일 걱정하시나 —
     첫 문장에 붙일 말」. 사진 1 의 초록 상자가 <b>이 칸에서</b> 옵니다.
     ★ 여태 이 칸이 없어서 그 상자가 안 섰습니다 — 코드에 「담을 자리가
       없어 지어 넣지 않습니다」 라고 적혀 있었습니다 (1번).
     ★ 이 자가 묻는 것 — <b>적으면 서고, 안 적으면 안 서나.</b> 안 적었는데
       서면 무슨 말을 붙일지 <b>지어내야</b> 합니다.                  */
  console.log('\n[9-1] 😟 <b>걱정 한 줄이 홈 첫 문장이 되나</b>');
  const W = await p.evaluate(async () => {
    const 홈글 = async () => { go('home'); await new Promise(r => setTimeout(r, 800));
      const e = document.querySelector('#dynPane .hm-now');
      return e ? e.innerText.replace(/\s+/g,' ') : ''; };
    cmOf('c1').worry = '';
    const 빈것 = await 홈글();
    cmOf('c1').worry = '아이 교육비가 제일 걱정이라고 하셨습니다';
    const 적은것 = await 홈글();
    /* 상세에도 적는 칸이 <b>하나</b>인가 */
    osOpenClient('c1'); await new Promise(r => setTimeout(r, 700));
    const 칸 = document.querySelectorAll('#cmWorry').length;
    const 표 = CM_FIELDS.filter(f => f[0] === 'worry')[0];
    return { 빈것: 빈것, 적은것: 적은것, 칸: 칸,
             물음: !!(표 && 표[3] && 표[3].ask), 차례: 표 && 표[3] && 표[3].pri };
  });
  is(W.빈것.indexOf('첫 문장에 붙일 것') < 0,
     '  ★ <b>안 적었으면 안 선다</b> (1번) — 없는 말을 지어내지 않습니다');
  is(W.적은것.indexOf('첫 문장에 붙일 것 — 아이 교육비') >= 0,
     '  ★ <b>적으면 홈 카드에 그대로 선다</b> — ' +
     (W.적은것.match(/첫 문장에 붙일 것[^·]{0,34}/) || ['(안 섬)'])[0]);
  is(W.칸 === 1, '  적는 칸이 <b>하나</b>다 (5번) — ' + W.칸 + '개');
  is(W.물음 && W.차례 === 2,
     '  <b>둘째로 여쭙는다</b> — 다음 할 일 다음입니다 (차례 ' + W.차례 + ')');
  /* 쓰는 곳은 cmSave 하나 — 저장 코드를 새로 안 짰습니다 (사장님 말씀) */
  is(/function cmWorrySave\(id\)\{[\s\S]{0,140}cmSave\(id,\{worry:/.test(SRC),
     '  ★ 쓰는 것은 <b>cmSave 하나</b>로만 한다');
  /* ★ <b>적은 것이 서버로 정말 가나.</b> 여기서 한 번 놓쳤습니다 —
     칸 표(CM_FIELDS)에서 worry 를 빼 봤더니 <b>화면은 그대로 돌고
     저장만 조용히 안 됐습니다.</b> 화면이 멀쩡해서 아무도 모릅니다.
     그것이 제일 나쁜 고장이라 <b>보낸 것을 직접</b> 봅니다 (8번). */
  const WS = await p.evaluate(async () => {
    WROTE.length = 0;
    cmSave('c1', { worry: '서버로 가는지 보는 한 줄' });
    await new Promise(r => setTimeout(r, 600));
    const w = WROTE.filter(x => x.tb === 'saved_reports')[0];
    return w ? Object.keys((w.body && w.body.content) || {}) : [];
  });
  is(WS.indexOf('worry') >= 0,
     '  ★ 적은 것이 <b>서버로 간다</b> — 칸 표에서 빠지면 화면은 그대로인데 ' +
     '저장만 조용히 안 됩니다 (보낸 칸 ' + WS.length + '개)');

  console.log('\n[10] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 한 번에 한 가지만 여쭙고, 답은 cmSave 하나로만 갑니다.');
  process.exit(bad ? 1 : 0);
})();
