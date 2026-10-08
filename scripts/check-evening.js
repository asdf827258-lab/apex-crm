/* ══════════════════════════════════════════════════════════════════
   check-evening.js — <b>하루를 닫아 주는 한 장</b>이 서고, 거기 적힌 수가
   아침 미션이 세는 그 수와 <b>같은가</b>.

   사장님 말씀 (2026-10-09) — 지도의 ㉠ 과 ㉢ 을 고르셨습니다 —
     ㉠ 「아침 미션 체크는 있는데, 하루가 끝났을 때 <b>오늘 몇 분께 ·
        무엇을 · 그래서 무엇이 남았나</b> 를 한 장으로 보여 주는 자리가 없다」
     ㉢ 「⑥ 에서 <b>그 분으로 돌아오는 길</b>이 ① 의 단추 하나뿐이다」

   ── 이 자가 제일 걱정하는 것 ───────────────────────────────────────
   <b>또 하나의 셈판이 되는 것</b>입니다. 저녁 칸이 제 손으로 세기 시작하면,
   아침 미션은 「4걸음」 이라고 적는데 저녁은 「3걸음」 이라고 적는 날이
   옵니다 — 어느 쪽이 맞는지 알 수 없는 숫자는 없느니만 못합니다 (5번).
   그래서 이 자는 <b>칸이 예쁘게 섰나</b>를 보지 않고, <b>같은 수를 말하나</b>를
   봅니다. 그리고 미션을 하나 체크한 <b>뒤에도</b> 다시 봅니다 — 한쪽만
   따라 움직이면 그때 갈립니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 🌙 칸이 홈에 서고 <b>접힌 채</b>다 (홈의 규칙 · check-toss)
         그리고 접어 두셔도 머리에 오늘이 적힌다
     [2] <b>이름표를 단다</b> — 「오늘 N명」 을 적으면서 무엇을 세는지
         말한다 (0-1번 · check-onesay 의 ASK 대장에 먼저 적습니다)
     [3] ★★ <b>아침 미션과 같은 수</b>를 말한다 — 걸음·사람·체크판 셋 다.
         그리고 <b>하나를 체크한 뒤에도</b> 둘이 같이 움직인다
     [4] ★ <b>「모름」 과 「없음」 을 가린다</b> (1번) — 배정 DB 를 아직
         못 읽었으면 「—」 이고 <b>0명이 아니다</b>
     [5] <b>길이 있다</b> — 실행 체크판·내 캘린더로 가는 단추가 정말
         열리는 화면을 가리킨다 (6번 · 죽은 단추 금지)
     [6] 다 하신 날에는 <b>그렇다고 적는다</b> — 남은 것이 없으면
         「다 하셨습니다」. 할 일을 지어내지 않는다
     [7] ㉢ <b>⑥ 에 아침에 고른 분이 한 줄로 선다</b> — 이름·단계와
         그 분 증권 단추. 고른 분이 없으면 <b>아무 말도 안 한다</b> (1번)
     [8] ★ <b>서버를 한 번도 안 부른다</b> (7번) — 저녁 칸을 펴는 동안
         바깥으로 나가는 길이 0건
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8963;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
let 서버부름 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
    서버부름++;
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 점검 데이터의 이름은 <b>홍길동</b> 입니다 (3번) */
const SEED = (o) => `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 window.__T='';window.__OUT=0;
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
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;CM.meta={c1:{db:'d1'}};
 var CLI=[{id:'c1',who:'me',name:'홍길동',nm:'홍길동',name_masked:'홍○○'}];
 var T=new Date(),t=T.getFullYear()+'-'+('0'+(T.getMonth()+1)).slice(-2)+'-'+('0'+T.getDate()).slice(-2);
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 /* ⚠ 「모름」 짝에서는 <b>null</b> 입니다 — 빈 표가 아닙니다 (1번) */
 AR.db=${o.모름 ? 'null' : `[
   {id:'d1',who:'me',name:'홍길동',stage:'TA',   days:5,region:'서울 강남구',src:'DB',last:t},
   {id:'d2',who:'me',name:'홍길순',stage:'미접촉',days:7,region:'서울 서초구',src:'DB'},
   {id:'d4',who:'me',name:'홍만복',stage:'AP',  days:2,region:'서울 강남구',src:'DB'}]`};
 AR.cliRows=${o.모름 ? 'null' : 'CLI'};
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=CLI.map(function(c){return {id:c.id,name:c.name,nm:c.nm,name_masked:c.name_masked,who:'me',owner:'me'};});
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.noSum=false;CHKS.fin={};CHKS.by={};CHKS.at='00:00';
 try{localStorage.removeItem('apex_hm_fold_v1');localStorage.removeItem('apex_ck_day');
     localStorage.removeItem('apex_mrt');}catch(e){}
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
    return { ctx, p, errs };
  };
  const 펴기 = async (p, k) => { await p.evaluate(x => { try{ if(!hmFoldOpen(x))hmFoldToggle(x); }catch(e){} }, k); await p.waitForTimeout(300); };

  const A = await open({});
  서버부름 = 0;

  console.log('[1] 🌙 칸이 홈에 서고 <b>접힌 채</b>다');
  const s1 = await A.p.evaluate(() => {
    const box = document.getElementById('hmFold_night');
    const hd = box ? box.querySelector('.hm-fold-h') : null;
    return { 있나: !!box, 접힘: box ? !box.classList.contains('on') : null,
      머리: hd ? (hd.innerText || '').replace(/\s+/g, ' ').trim() : '',
      /* ⚠ <b>머리의 이름표</b>만 봅니다. 처음에는 칸 전진에서 찾았는데,
         속에도 이름표가 하나 있어(오늘 닿은 분 줄) <b>머리에서 떼어도
         그대로 통과</b>했습니다 — 되돌려 보고 알았습니다. 안 울리는 알람은
         알람이 아닙니다 (8번). 접어 둔 머리만 화면에 보이므로 거기를 잭니다. */
      ask: box && box.querySelector('.hm-fold-h [data-ask]')
             ? box.querySelector('.hm-fold-h [data-ask]').getAttribute('data-ask') : '' };
  });
  is(s1.있나, '  칸이 섰다');
  is(s1.접힘 === true, '  <b>접힌 채</b>로 섰다 — 홈은 처음에 다 접고 엽니다');
  /* ⚠ 처음에는 머리에 「미션 N/N」 도 적게 했다가 <b>뺐습니다</b> — 바로 위
     아침 미션 머리가 「6/6」 이라고 이미 적어, 두 줄이 나란히 서면 같은 수를
     두 번 읽습니다 (5번). 머리는 <b>「오늘 닿은 분」 하나만</b> 적습니다. */
  is(/오늘/.test(s1.머리) && /닿은/.test(s1.머리),
    '  접어 두셔도 머리에 <b>오늘 닿은 분</b>이 적힌다 — 「' + s1.머리.replace(/[▾▴]/g, '').trim() + '」');

  console.log('\n[2] <b>이름표를 단다</b> (0-1번)');
  is(s1.ask === '오늘닿은분', '  이름표가 달려 있다 — 「' + s1.ask + '」');
  /* ★ check-onesay 의 대장에 <b>먼저</b> 적혀 있어야 합니다 */
  const 대장 = fs.readFileSync('scripts/check-onesay.js', 'utf8');
  is(대장.indexOf("'오늘닿은분'") >= 0,
    '  check-onesay 의 <b>ASK 대장</b>에 적혀 있다 — 안 적으면 그 자가 「낯선 이름표」 로 셉니다');

  console.log('\n[3] ★★ <b>아침 미션과 같은 수</b>를 말한다 (5번)');
  await 펴기(A.p, 'night');
  const 재기 = () => A.p.evaluate(() => {
    const host = document.getElementById('hmNightHost');
    const t = host ? (host.innerText || '').replace(/\s+/g, ' ').trim() : '';
    const n = (k) => { const m = t.match(new RegExp('([0-9]+|—)\\\\s*/?\\\\s*([0-9]+)?' + k)); return m ? m[1] : null; };
    let 셈 = null; try { 셈 = hmNightStat(); } catch (e) {}
    let 아침 = null;
    try { 아침 = { 걸음: hmMsCount(), 미션: HM_MS.length, 사람: hmMsCare(),
                   체크: ckCount('day', CK_ITEMS.day), 체크다: CK_ITEMS.day.length }; } catch (e) {}
    return { 글: t, 길이: t.length, 셈, 아침, 걸음글: n('걸음'), 줄글: n('줄') };
  });
  const r3 = await 재기();
  is(r3.길이 > 120, '  펴면 속이 선다 (' + r3.길이 + '자)');
  is(r3.셈 && r3.아침 && r3.셈.걸음 === r3.아침.걸음 && r3.셈.미션 === r3.아침.미션,
    '  <b>걸음</b>이 같다 — 저녁 ' + (r3.셈 || {}).걸음 + '/' + (r3.셈 || {}).미션 +
    ' · 아침 ' + (r3.아침 || {}).걸음 + '/' + (r3.아침 || {}).미션);
  is(r3.셈 && r3.아침 && r3.셈.닿음 === r3.아침.사람.done && r3.셈.사람 === r3.아침.사람.all,
    '  <b>사람</b>이 같다 — 저녁 ' + (r3.셈 || {}).닿음 + '/' + (r3.셈 || {}).사람 +
    ' · hmMsCare ' + (r3.아침 || {}).사람.done + '/' + (r3.아침 || {}).사람.all);
  is(r3.셈 && r3.아침 && r3.셈.체크 === r3.아침.체크 && r3.셈.체크다 === r3.아침.체크다,
    '  <b>체크판</b>이 같다 — 저녁 ' + (r3.셈 || {}).체크 + '/' + (r3.셈 || {}).체크다 +
    ' · ckCount ' + (r3.아침 || {}).체크 + '/' + (r3.아침 || {}).체크다);
  /* ⚠ 여기까지만 보면 <b>거저 통과합니다</b> — 둘이 다 0 이면 저절로 같습니다.
     그래서 <b>하나를 체크해</b> 움직여 놓고 다시 봅니다 (8번). */
  await A.p.evaluate(() => { try { hmMsDid(HM_MS[0].ck); } catch (e) {} });
  await A.p.waitForTimeout(420);
  const r3b = await 재기();
  is(r3b.셈 && r3b.셈.걸음 > (r3.셈 || {}).걸음,
    '  미션 하나를 체크하니 저녁 수가 <b>따라 올라갔다</b> — ' +
    (r3.셈 || {}).걸음 + ' → ' + (r3b.셈 || {}).걸음);
  is(r3b.셈 && r3b.아침 && r3b.셈.걸음 === r3b.아침.걸음 && r3b.셈.체크 === r3b.아침.체크,
    '  체크한 뒤에도 <b>둘이 같다</b> — 저녁 ' + (r3b.셈 || {}).걸음 + '/' + (r3b.셈 || {}).체크 +
    ' · 아침 ' + (r3b.아침 || {}).걸음 + '/' + (r3b.아침 || {}).체크);
  is(/걸음/.test(r3b.글) && /줄/.test(r3b.글),
    '  화면에도 <b>걸음·줄</b>로 적힌다 — 무슨 수인지 말한다');

  console.log('\n[5] <b>길이 있다</b> — 죽은 단추가 없다 (6번)');
  /* ⚠ 처음에는 renderTab(k) 를 불러 봤습니다 — <b>그런 전역이 없습니다.</b>
     화면을 세우는 길이 둘이고(renderTab 이 돌려주는 것 · go() 안의 else if),
     ckboard·mycal 은 <b>뒤쪽</b>입니다. 그래서 「없는 함수가 터졌다」 를
     「죽은 단추다」 로 읽어 <b>헛것을 잡았습니다</b> (8번).
     ★ 이제 <b>실제로 go() 해서</b> 그 화면에 글자가 차는지 봅니다 —
       그것이 「정말 열린다」 의 뜻입니다.                                */
  const r5 = await A.p.evaluate(() => {
    const host = document.getElementById('hmNightHost');
    const bs = host ? [...host.querySelectorAll('button[onclick]')] : [];
    const 갈곳 = bs.map(e => (e.getAttribute('onclick') || '').match(/go\('([a-z_]+)'\)/))
                   .filter(Boolean).map(m => m[1]);
    return { 수: bs.length, 갈곳 };
  });
  is(r5.수 >= 2, '  누를 것이 있다 — ' + r5.수 + '개');
  is(r5.갈곳.length >= 2, '  그 가운데 화면으로 가는 것 — ' + r5.갈곳.join(' · '));
  for (const k of r5.갈곳) {
    const n = await A.p.evaluate(async (t) => {
      try { go(t); } catch (e) { return -1; }
      await new Promise(r => setTimeout(r, 820));
      const d = document.getElementById('dynPane');
      return d ? (d.innerText || '').replace(/\s+/g, ' ').trim().length : 0;
    }, k);
    is(n > 200, '  「' + k + '」 를 눌러 보니 <b>정말 열린다</b> — ' + n + '자');
  }
  await A.p.evaluate(() => { try { go('home'); } catch (e) {} });
  await A.p.waitForTimeout(900);
  await 펴기(A.p, 'night');

  console.log('\n[6] 다 하신 날에는 <b>그렇다고 적는다</b>');
  const r6 = await A.p.evaluate(async () => {
    /* 미션을 다 체크하고, 큐를 비워 「남은 것 0」 을 만듭니다.
       ⚠ 미션 여섯만 체크해서는 <b>안 됩니다</b> — 「오늘 챙길 것」(hmCount)은
         하루치 <b>열한 줄 전부</b>를 세므로 체크판에 남은 줄이 그대로 올라옵니다.
         처음에 여섯만 체크하고 「다 하셨습니다」 를 기다렸다가 빨간불이 떴고,
         재 보니 <b>앱이 맞았습니다</b> — 정말 남아 있었습니다 (1번). */
    try { CK_ITEMS.day.forEach(r => { if (!ckLoad('day')[r[0]]) ckToggle('day', r[0]); }); } catch (e) {}
    /* ⚠ AR.db 만 비워서는 <b>안 됩니다</b> — 고객 365일 줄(AR.cliRows)에서도
       「기고객」 이 올라옵니다(다음에 할 일을 안 적어 두신 분은 날짜와 상관없이
       올라옵니다). 처음에 db 만 비우고 「다 하셨습니다」 를 기다렸다가 빨간불이
       떴고, 재 보니 <b>앱이 맞았습니다</b> — 정말 한 건 남아 있었습니다 (1번).
       「다 하신 날」 은 <b>정말로 아무것도 없는 날</b>입니다.   재 보니 고객 카드(OSC.list) 한 장도 「touch」 줄로 올라왔습니다. */
    try { AR.db = []; AR.cliRows = []; OSC.list = []; } catch (e) {}
    try { hmPaint(); hmNightPaint(); } catch (e) {}
    await new Promise(r => setTimeout(r, 420));
    const host = document.getElementById('hmNightHost');
    let c=null,st=[]; try{ c=hmCount(); st=hmSteps().map(z=>z.k+':'+(z.t||'')); }catch(e){}
    return { t:(host ? (host.innerText || '') : '').replace(/\s+/g, ' '), c, st };
  });
  /* ⚠ AR.db=[] 는 「읽었고 아무도 없다」 이므로 닿음은 0 이고 모름이 아닙니다 */
  is(/다 하셨습니다|남은 것이 없습니다/.test(r6.t),
    '  남은 것이 없으면 <b>그렇다고 적는다</b> — 할 일을 지어내지 않는다');
  is(!/남았습니다/.test(r6.t), '  그러면서 <b>「남았습니다」 를 같이 적지 않는다</b>');

  console.log('\n[8] ★ <b>서버를 한 번도 안 부른다</b> (7번)');
  is(서버부름 === 0, '  저녁 칸을 펴고 세는 동안 바깥으로 나간 길 ' + 서버부름 + '건');

  console.log('\n[4] ★ <b>「모름」 과 「없음」 을 가린다</b> (1번)');
  const B = await open({ 모름: true });
  await 펴기(B.p, 'night');
  const r4 = await B.p.evaluate(() => {
    const host = document.getElementById('hmNightHost');
    const t = (host ? (host.innerText || '') : '').replace(/\s+/g, ' ');
    let 셈 = null; try { 셈 = hmNightStat(); } catch (e) {}
    return { 글: t, 셈 };
  });
  is(r4.셈 && r4.셈.닿음 === null, '  배정 DB 를 못 읽었으면 <b>null</b> 이다 — 0 이 아니다');
  is(/—/.test(r4.글), '  화면에 <b>「—」</b> 로 적힌다');
  is(/안 받아 온 것/.test(r4.글), '  그리고 <b>그것이 무슨 뜻인지</b> 적는다 — 0 이 아니라고 말한다');
  is(!/0명/.test(r4.글), '  <b>「0명」 이라고 적지 않는다</b> — 그러면 「아무도 못 했다」 가 됩니다');

  console.log('\n[7] ㉢ <b>⑥ 에 아침에 고른 분이 선다</b>');
  const C = await open({});
  await 펴기(C.p, 'ms');
  const r7 = await C.p.evaluate(async () => {
    try { hmMsPick(0); HM_MSP.j = 5; hmMsPaint(); } catch (e) {}
    await new Promise(r => setTimeout(r, 520));
    const h = document.getElementById('hmMsHost');
    const bk = h ? h.querySelector('.hm-chk-back') : null;
    let who = ''; try { const w = hmMsWho(); who = w ? (w.nm || w.name || '') : ''; } catch (e) {}
    return { 있나: !!bk, 그분: who,
      글: bk ? (bk.innerText || '').replace(/\s+/g, ' ').trim() : '',
      칸: h ? (h.innerText || '').replace(/\s+/g, ' ').trim() : '',
      누를것: bk ? [...bk.querySelectorAll('button')].map(e => (e.innerText || '').trim().slice(0, 20)) : [] };
  });
  is(r7.있나, '  줄이 섰다');
  is(!!r7.그분 && r7.글.indexOf(r7.그분) >= 0, '  <b>아침에 고른 그 분</b>의 이름이 적힌다 — ' + r7.그분);
  /* ⚠ 처음에는 이 <b>줄 자신</b>이 「AP·PC·CS」 라고 적는지 봤습니다. 그런데
     바로 아래 칸 머리가 이미 「🩺 고객 체크 — AP · PC · CS N명」 이라고 적어,
     두 번 적는 줄이었고 그 한 줄이 38px 여서 ⑥ 칸이 한 화면을 넘겼습니다
     (check-msfive 가 재 주었습니다). 줄에서 떼고 <b>화면이</b> 말해 주는지를
     봅니다 — 그것이 사장님이 보시는 것입니다 (5번·8번). */
  is(/AP|PC|CS/.test(r7.칸), '  ⑥ <b>칸</b>이 다른 분들 자리라고 말해 준다');
  is(r7.누를것.length >= 2, '  그 분으로 <b>돌아가는 단추</b>가 있다 — ' + r7.누를것.join(' · '));
  /* 고른 분이 없으면 <b>아무 말도 안 합니다</b> (1번) */
  const r7b = await C.p.evaluate(async () => {
    try { AR.db = []; hmMsPaint(); } catch (e) {}
    await new Promise(r => setTimeout(r, 380));
    const h = document.getElementById('hmMsHost');
    return !!(h && h.querySelector('.hm-chk-back'));
  });
  is(r7b === false, '  고른 분이 없으면 <b>그 줄을 안 세운다</b> — 사람을 지어내지 않는다 (1번)');

  console.log('');
  const 터짐 = [...A.errs, ...B.errs, ...C.errs];
  is(터짐.length === 0, '하루를 닫는 동안 <b>조용히 터진 곳이 없다</b>' + (터짐.length ? ' — ' + 터짐[0] : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '곳이 어긋났습니다.') : '\n✓ 저녁 한 장이 아침과 같은 수를 말합니다.');
  process.exit(bad ? 1 : 0);
})();
