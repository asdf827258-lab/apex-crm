/* ══════════════════════════════════════════════════════════════════
   check-walref.js — <b>빈 통장</b>과 <b>소개해 주신 분</b>을 담을 칸.

   사장님 말씀 — 「빈 통장 · 소개해 주신 분」. 둘 다 <b>담을 자리가
   어디에도 없어서</b> 홈의 신호로도 못 세우고 있던 것들입니다
   (app/index.html 의 「아직 못 세우는 신호」 주석).

   ── 이 자리에서 조심할 것 ────────────────────────────────────────
   ① <b>서버에 이름을 올리면 안 됩니다</b> (3번). 소개자는 <b>사람</b>입니다.
      · 이미 고객이면 <b>번호(ref)</b> 만 — 번호는 이름이 아닙니다.
      · 고객이 아니면 <b>가린 이름(refx · 김○○)</b> 만, 실명은 이 기기에.
      이 점검은 <b>서버로 나가는 몸통을 가로채</b> 실명이 섞였는지 봅니다.
   ② <b>「없다」 와 「아직 안 봤다」 는 다릅니다</b> (1번). 진단을 안 붙인
      분께 「빈 통장 0개」 라고 적으면 <b>다 채워져 있다</b>는 뜻이 되어
      그 자리에서 상담이 끝납니다.
   ③ <b>줄을 세우면 안 됩니다.</b> 두 신호는 고치기 전까지 늘 참이라,
      오늘 줄에 세우면 그분이 <b>영영 매일</b> 서서 큐가 안 줄어듭니다 —
      자녀 나이·보험료 비중에서 이미 겪은 그대로입니다(when:'any').
   ④ <b>문구도 점수도 명세서 그대로</b>입니다 (빈 통장 450 · 소개 490).
      여기서 새로 정하면 명세서와 두 벌이 됩니다 (5번).

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 담는 칸이 <b>표 한 곳</b>에 있다 — 넣기·읽기·저장이 다 안다
     [2] 소개 — <b>서버에 이름이 안 간다</b> · 고객이면 번호로 이어진다
     [3] 거꾸로 — <b>이분이 소개해 주신 분</b>을 센다
     [4] 빈 통장 — <b>「없다」 와 「아직 안 봤다」</b> 를 가른다
     [5] 홈 신호 — 넘어가고, <b>줄은 안 세운다</b>
     [6] 지도 — <b>빈 진단은 안 붙는다</b> · 고객 것을 열면 그것이 뜬다
     [7] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8955;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
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

/* 견본은 <b>홍길동</b> — 실제 고객 이름은 안 씁니다 (3번).
   서버에는 가린 이름만 있는 것처럼 꾸며, 실명은 이 기기(localStorage)에 둡니다. */
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.osLoadClients=function(){};window.cmLoadAll=function(cb){if(cb)cb();};
 window.__T='';window.toast=function(m){window.__T=''+m;};
 /* 서버로 <b>나가는 것을 가로챈다</b> — 실명이 섞이는지 여기서 본다 */
 window.__PUT=[];
 window.osClient=function(){ return { from:function(tbl){ var st={tbl:tbl,op:'',body:null}; var a={};
     ['select','order','limit','eq','neq','gte','lte','in','is','not','or','filter','range','single','maybeSingle','match']
       .forEach(function(k){ a[k]=function(){ return a; }; });
     a.update=function(b){ st.op='update'; st.body=b; return a; };
     a.insert=function(b){ st.op='insert'; st.body=b; return a; };
     a.upsert=function(b){ st.op='upsert'; st.body=b; return a; };
     a['delete']=function(){ st.op='delete'; return a; };
     a.then=function(res){ if(st.op)window.__PUT.push({tbl:st.tbl,op:st.op,body:st.body});
       return Promise.resolve({data:[{id:'r1'}],error:null}).then(res); };
     return a; },
   rpc:function(){ return Promise.resolve({data:null,error:null}); } }; };
 /* 고객 셋 — 서버에는 가린 이름, 실명은 이 기기에 (3번) */
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=[{id:'c1',name_masked:'홍○○',advisor_id:'me',consent_status:'none',created_at:'2026-09-01'},
           {id:'c2',name_masked:'홍○○',advisor_id:'me',consent_status:'none',created_at:'2026-09-02'},
           {id:'c3',name_masked:'홍○○',advisor_id:'me',consent_status:'none',created_at:'2026-09-03'}];
 cmRealSet('c1','홍길동');cmRealSet('c2','홍길순');cmRealSet('c3','홍갑돌');
 CM.loaded=true;CM.meta={};
 AR.loaded=true;AR.busy='';AR.err='';AR.db=[];AR.cliRows=[];
 try{localStorage.setItem('apex_guide_seen_v2','1');localStorage.removeItem('apex_wallets_diag');
     localStorage.removeItem('apex_wallets_meta');}catch(e){}
`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(SEED);

  console.log('\n[1] 담는 칸이 <b>표 한 곳</b>에 있다 — 넣기·읽기·저장이 다 안다');
  const F = await page.evaluate(() => {
    const names = CM_FIELDS.map(x => x[0]);
    const blank = cmBlank();
    /* 표에만 적으면 <b>빈 칸 · 읽기 · 서버 몸통</b>이 저절로 따라와야 한다 */
    const body = cmBody(cmRead({ wal: { at: '2026-09-27', lv: { 2: 'low' } }, ref: 'c2', refx: '' }));
    return { names, hasBlank: ['wal', 'ref', 'refx'].every(k => k in blank),
             body: body, keeps: body.ref === 'c2' && body.wal && body.wal.lv && body.wal.lv['2'] === 'low' };
  });
  ['wal', 'ref', 'refx'].forEach(k => is(F.names.indexOf(k) >= 0, '  CM_FIELDS 에 <b>' + k + '</b> 이 있다'));
  is(F.hasBlank, '  빈 칸 만들기(cmBlank)가 셋을 <b>저절로</b> 안다 — 표가 하나라서 (5번)');
  is(F.keeps, '  서버 몸통(cmBody)에도 <b>빠짐없이</b> 담긴다 — 화면에만 보이고 저장이 빠지던 자리다');

  console.log('\n[2] 소개 — <b>서버에 이름이 안 간다</b> (3번)');
  const R = await page.evaluate(async () => {
    const out = {};
    /* ① 이미 고객인 분을 적는다 — 실명으로 적어도 <b>번호</b>로 이어져야 한다 */
    window.__PUT = [];
    go('clients'); await new Promise(r => setTimeout(r, 300));
    OSC.current = OSC.list[0];
    document.body.insertAdjacentHTML('beforeend', '<div id="cmPanels"></div>');
    document.getElementById('cmPanels').innerHTML = cmPanelsHtml('c1');
    document.getElementById('cmRef').value = '홍길순';
    cmRefSave('c1'); await new Promise(r => setTimeout(r, 400));
    out.ref = cmOf('c1').ref; out.refx = cmOf('c1').refx;
    out.name = cmRefName('c1');
    /* ⚠ <b>고객 칸(client_meta)으로 나간 것만</b> 봅니다. 페이지가 뜨면서
       출발 점검이 health_checks 에 <b>설계사 본인</b> 이름을 적는데, 그것은
       profiles 에 이미 있는 제 이름이라 3번(고객 실명)과 다른 이야기입니다.
       넓게 잡으면 늘 빨간불이라 아무도 안 믿게 됩니다 (8번). */
    out.put1 = JSON.stringify(window.__PUT.filter(x => x.tbl === 'saved_reports'));
    /* ② 고객이 아닌 분 — 서버에는 가린 이름만, 실명은 이 기기에 */
    window.__PUT = [];
    document.getElementById('cmPanels').innerHTML = cmPanelsHtml('c3');
    document.getElementById('cmRef').value = '박철수';
    cmRefSave('c3'); await new Promise(r => setTimeout(r, 400));
    out.x = cmOf('c3').refx; out.xref = cmOf('c3').ref;
    out.xreal = cmRefRealOf('c3'); out.xname = cmRefName('c3');
    out.put2 = JSON.stringify(window.__PUT.filter(x => x.tbl === 'saved_reports'));
    out.mask = osMaskName('박철수');
    out.puts = window.__PUT.filter(x => x.tbl === 'saved_reports').length;
    /* ③ 자기 자신은 안 된다 */
    document.getElementById('cmPanels').innerHTML = cmPanelsHtml('c2');
    document.getElementById('cmRef').value = '홍길순';
    cmRefSave('c2'); await new Promise(r => setTimeout(r, 300));
    out.self = cmOf('c2').ref || ''; out.selfSaid = window.__T;
    return out;
  });
  is(R.ref === 'c2' && !R.refx,
     '  고객을 적으면 <b>번호로 이어진다</b> — ref=' + R.ref + ' (이름이 아니다)');
  is(R.name === '홍길순', '  화면에는 <b>그분 이름</b>으로 보인다 — ' + R.name + ' (실명은 이 기기에서 푼다)');
  is(R.put1.indexOf('홍길순') < 0 && R.put1.indexOf('홍길동') < 0 && R.put1.indexOf('"ref":"c2"') >= 0,
     '  ★ 고객 칸으로 나간 몸통에 <b>실명이 없다</b> — 번호만 간다 (3번)');
  /* 가린 모양을 여기서 다시 만들지 않습니다 — <b>앱에게 묻습니다</b> (5번).
     「박○○」 라고 박아 두었다가, 앱이 「박*수」 로 가리고 있어 틀렸습니다. */
  is(R.puts >= 1 && R.x === R.mask && !R.xref,
     '  고객이 아닌 분은 <b>가린 이름만</b> 서버로 — ' + R.x + ' (앱이 가리는 그대로)');
  is(R.xreal === '박철수' && R.xname === '박철수',
     '  실명은 <b>이 기기에만</b> 있고 화면에는 그대로 보인다 — ' + R.xname);
  is(R.put2.indexOf('박철수') < 0, '  ★ 그때도 서버 몸통에 <b>실명이 없다</b> (3번)');
  is(!R.self && /자기 자신/.test(R.selfSaid || ''),
     '  <b>자기 자신은 소개자가 될 수 없다</b> — ' + (R.selfSaid || '').slice(0, 30));

  console.log('\n[3] 거꾸로 — <b>이분이 소개해 주신 분</b>을 센다');
  const B = await page.evaluate(() => {
    const n = cmRefsOf('c2').map(c => c.id);
    document.getElementById('cmPanels').innerHTML = cmPanelsHtml('c2');
    const t = document.getElementById('cmPanels').innerText.replace(/\s+/g, ' ');
    return { n, t };
  });
  is(B.n.join(',') === 'c1', '  홍길순 님이 소개해 주신 분 — ' + B.n.join(','));
  is(/이분이 소개해 주신 분/.test(B.t) && /1명/.test(B.t), '  카드에 <b>그렇게 적힌다</b>');

  console.log('\n[4] 빈 통장 — <b>「없다」 와 「아직 안 봤다」</b> 를 가른다 (1번)');
  const W = await page.evaluate(async () => {
    const txt = (id) => { document.getElementById('cmPanels').innerHTML = cmPanelsHtml(id);
                          return document.getElementById('cmPanels').innerText.replace(/\s+/g, ' '); };
    const out = { none: txt('c3'), gapsNone: cmWalGaps('c3') };
    /* 진단을 붙인다 — 미흡 둘 */
    cmOf('c1').wal = { at: '2026-09-27', lv: { 2: 'low', 6: 'low', 1: 'ok' } };
    out.low = txt('c1'); out.gapsLow = cmWalGaps('c1'); out.lowN = cmWalLow('c1');
    /* 진단은 했는데 미흡이 <b>없다</b> — 이것은 「없다」 가 맞다 */
    cmOf('c3').wal = { at: '2026-09-27', lv: { 1: 'ok', 2: 'mid' } };
    out.ok = txt('c3'); out.gapsOk = cmWalGaps('c3');
    return out;
  });
  is(/아직 진단을 안 붙였습니다/.test(W.none) && W.gapsNone === '',
     '  안 붙인 분께는 <b>「아직 진단을 안 붙였습니다」</b> — 「0개」 라고 안 적는다 (1번)');
  is(/비어 있는 통장 2개/.test(W.low) && W.gapsLow === '병원비 · 은퇴·연금',
     '  붙인 분께는 <b>어디가 비었는지</b> — ' + W.gapsLow);
  is(W.lowN.length === 2, '  통장 이름은 <b>waShort 한 곳</b>에서 온다 (5번) — ' + W.lowN.join(' · '));
  is(/미흡으로 찍힌 칸이 없습니다/.test(W.ok) && W.gapsOk === '',
     '  진단은 했는데 미흡이 없으면 <b>그렇게</b> 적는다 — 안 본 것과 다르다');

  console.log('\n[5] 홈 신호 — 넘어가고, <b>줄은 안 세운다</b>');
  const S = await page.evaluate(() => {
    const info = hmSigInfo(OSC.list[0]);
    const sig = hmSigOf(OSC.list[0]);
    const by = (k) => sig.filter(x => x.id === k)[0] || null;
    return { gaps: info.gaps, refnm: info.refnm,
             gap: by('gap'), ref: by('ref'),
             day: sig.filter(x => x.when === 'day').map(x => x.id) };
  });
  is(S.gaps === '병원비 · 은퇴·연금' && S.refnm === '홍길순',
     '  <b>풀어서 넘긴다</b> — day-rank.js 는 실명이 든 저장소를 안 본다 (3번)');
  is(!!S.gap && S.gap.sc === 450, '  🗺️ 빈 통장 신호가 선다 — 점수 ' + (S.gap ? S.gap.sc : '(없음)') + ' (명세서 그대로)');
  is(!!S.ref && S.ref.sc === 490, '  🙌 소개 신호가 선다 — 점수 ' + (S.ref ? S.ref.sc : '(없음)') + ' (명세서 그대로)');
  is(!!S.gap && /비어 있습니다/.test(S.gap.why), '  <b>무엇이</b> 비었는지 적는다 — ' + (S.gap ? S.gap.why : ''));
  is(!!S.ref && S.ref.aim.indexOf('홍길순') >= 0, '  <b>누구께</b> 알려 드릴지 적는다 — ' + (S.ref ? S.ref.aim : ''));
  is(!!S.gap && S.gap.when === 'any' && !!S.ref && S.ref.when === 'any' && S.day.length === 0,
     '  ★ 둘 다 <b>줄을 안 세운다</b>(when:any) — 세우면 그분이 영영 매일 선다');

  console.log('\n[6] 지도 — <b>빈 진단은 안 붙는다</b> · 고객 것을 열면 그것이 뜬다');
  const M = await page.evaluate(async () => {
    const out = {};
    WA.diag = {}; WA.cid = ''; WA.cnm = '';
    window.__T = ''; waAttach(); await new Promise(r => setTimeout(r, 200));
    out.emptySaid = window.__T;
    out.picked = !!document.getElementById('osCliPick');
    if (out.picked) { try { document.getElementById('osCliPick').remove(); } catch (e) {} }
    /* 고객 카드에서 열면 <b>그분 진단</b>이 뜬다 */
    waOpenFor('c1'); await new Promise(r => setTimeout(r, 700));
    out.cid = WA.cid; out.lv = JSON.stringify(WA.diag);
    out.who = ((document.querySelector('.wa-who') || {}).innerText || '').replace(/\s+/g, ' ');
    /* 아무에게도 안 붙였으면 <b>그렇게</b> 적는다 */
    waDetach(); await new Promise(r => setTimeout(r, 200));
    out.off = ((document.querySelector('.wa-who') || {}).innerText || '').replace(/\s+/g, ' ');
    out.small = [].slice.call(document.querySelectorAll('.wa-who button'))
                  .filter(e => e.getBoundingClientRect().height < 44).length;
    return out;
  });
  is(/먼저 통장 하나라도/.test(M.emptySaid || '') && !M.picked,
     '  ★ <b>빈 진단은 안 붙는다</b> — 붙이면 「다 채워져 있다」 로 읽힌다 (1번)');
  is(M.cid === 'c1' && /"2":"low"/.test(M.lv),
     '  고객 카드에서 열면 <b>그분 진단</b>이 그대로 뜬다 — ' + M.lv);
  is(/홍길동 님의 진단/.test(M.who), '  지도 머리에 <b>누구 것인지</b> 적힌다 — ' + M.who.slice(0, 40));
  is(/아직 아무에게도 안 붙였습니다/.test(M.off), '  떼면 <b>안 붙었다고</b> 적는다 — 빈칸으로 두지 않는다');
  is(M.small === 0, '  그 줄 단추도 <b>44px 아래가 없다</b>' + (M.small ? (' ← ' + M.small + '개') : ''));
  /* <b>쌍둥이가 아닌가</b> — 「누구 것인가」 를 아는 곳이 하나인가 (5번) */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((SRC.match(/function cmRefName\(/g) || []).length === 1 &&
     (SRC.match(/function cmWalGaps\(/g) || []).length === 1,
     '  이름·빈 통장을 <b>되짚는 곳이 하나씩</b>이다 (5번)');
  is(!/function cmWalLow\([\s\S]{0,400}?['"]병원비['"]/.test(SRC),
     '  통장 이름을 <b>여기 또 적지 않았다</b> — waShort 를 부른다 (5번)');

  console.log('\n[7] 조용히 터지지 않았나');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource/i.test(x));
  is(real.length === 0, '  콘솔 오류 없음' + (real.length ? (' ← ' + real[0]) : ''));

  await ctx.close(); await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 빈 통장 · 소개해 주신 분 — 담을 칸이 생겼고, 서버에 이름은 안 갑니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
