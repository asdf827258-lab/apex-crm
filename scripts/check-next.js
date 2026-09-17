/* ══════════════════════════════════════════════════════════════════
   check-next.js — <b>끝난 자리에 「다음」이 서는가.</b>

   사장님이 하루에 제일 많이 하시는 세 가지는 <b>끝나는 자리에서 끊겼습니다.</b>

     ① DB 받아 첫 통화   저장 → <b>토스트 한 줄 → 표로 떨어짐.</b>
        다음에 누구를 걸지는 표를 다시 훑어 고르셔야 했습니다. 하루 서른 번.
     ② 보장분석 전·후    저장 → <b>토스트 한 줄.</b> 만들어 놓고 안 보여 드린
        자료가 쌓였습니다. 「발표 시작」은 있는데 토글을 먼저 켜야 나옵니다.
     ③ 증권 전달        인쇄 → <b>끝.</b> 전달은 했는데 CRM 단계가 계약완료에
        그대로 멈춘 고객이 쌓였고, 그러면 소개 자리(소개완료)가 안 열립니다.

   토스는 끝난 자리에서 <b>다음 한 걸음</b>을 줍니다. 메뉴로 돌려보내지
   않습니다. 이 점검은 그 한 걸음이 <b>실제로 서고 · 실제로 가는지</b>만 봅니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     ① 저장한 자리에 <b>다음 한 분</b>이 이름으로 선다
     ② 누를 곳이 <b>하나</b>다 (고르게 하지 않는다)
     ③ <b>어디서 뽑은 다음인지</b> 말한다 — 안 적으면 왜 이 분인지 모른다
     ④ 할 말은 <b>apex-stage.js</b> 에서 온다 — 여기서 또 적지 않는다 (5번)
     ⑤ 더 없으면 <b>없다고</b> 하고, <b>모르면 없다고 하지 않는다</b> (1번)
     ⑥ 단추가 <b>진짜로 간다</b> — 눌렀는데 아무 일도 안 나면 다른 단추도 안 믿는다 (8번)
     ⑦ 손이 닿는다 — 44px 바닥 (2단계)
     ⑧ 조사가 맞는다 — 「상담 로」·「부재 입니다」 가 안 나온다

   ★ 바깥으로 안 나갑니다 — CI 는 인터넷이 되므로 막지 않으면 늦게 온
     응답이 심어 둔 값을 덮어써 <b>CI 에서만</b> 빨간불이 켜집니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8993;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 견본은 <b>홍길동</b> 집안입니다 (3번) */
const SEED = `
  document.getElementById('configScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  window.toast=function(){};
  profile={id:'me',name:'홍길동',role:'admin',active:true};
  profiles=[profile];
  dbSources=['일반','개척'];
  DBL={loaded:true,busy:false,err:''};
  dbs=[{id:'d1',assigned_to:'me',customer_name:'홍길순',stage:'부재',source:'일반',assigned_date:'2026-09-01',region:'순천시'},
       {id:'d2',assigned_to:'me',customer_name:'홍말순',stage:'미접촉',source:'일반',assigned_date:'2026-08-20',region:'여수시'},
       {id:'d3',assigned_to:'me',customer_name:'홍갑돌',stage:'TA',source:'개척',assigned_date:'2026-08-25',region:'광양시'}];
  calls=[{id:'c1',db_id:'d1',created_by:'me',call_at:'2026-09-05T09:00:00Z',result:'부재'}];
  crmTeams=[];crmTeamOf={};cliKeys={};attendance=[];attErr=null;
  fillProfiles();fillSources();fillStages();`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());

  /* ══ ① DB 받아 첫 통화 ══════════════════════════════════════════ */
  const pg = await ctx.newPage();
  const e1 = [];
  pg.on('pageerror', e => e1.push(String(e).slice(0, 150)));
  await pg.goto('http://127.0.0.1:' + PORT + '/db-crm.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(1500);
  await pg.evaluate(SEED);

  const nx = async (page, doneId, res, stg) => await pg.evaluate((a) => {
    try { goPage(a.page); renderAll(); } catch (e) {}
    try { nxShow(a.doneId, a.res, a.stg); } catch (e) { return { boom: String(e).slice(0, 120) }; }
    const m = document.getElementById('nextModal'), bd = document.getElementById('nextBody');
    const btns = [...bd.querySelectorAll('button')];
    return {
      open: m.classList.contains('open'),
      txt: (bd.innerText || '').replace(/\s+/g, ' ').trim(),
      html: bd.innerHTML,
      btns: btns.map(e => (e.innerText || '').trim()),
      /* <b>으뜸 단추가 하나</b>인가 — 둘이면 또 고르셔야 한다 */
      primary: btns.filter(e => /nx-go/.test(e.className)).map(e => (e.innerText || '').trim()),
      small: btns.filter(e => e.getBoundingClientRect().height < 44).length
    };
  }, { page, doneId: doneId, res, stg });

  head('[1] <b>DB 받아 첫 통화</b> — 저장한 자리에 다음 한 분이 선다');
  const T = await nx('touch', 'd1', '부재', '부재');
  is(!T.boom && T.open, '저장하면 <b>다음 창이 뜬다</b>' + (T.boom || ''));
  is(/홍말순/.test(T.txt), '다음 분이 <b>이름으로</b> 선다 — 「목록으로」 가 아니다');
  is(!/홍길순[^—]*다음/.test(T.txt.replace(/^[^다]*/, '')) && T.txt.indexOf('홍말순') > 0,
     '방금 그분(홍길순)은 <b>다음으로 다시 안 세운다</b>');
  is(T.primary.length === 1, '누를 으뜸 자리가 <b>하나</b>다 — ' + (T.primary.join(' / ') || '(없음)'));
  is(/지금 걸기/.test(T.primary.join('')), '그 하나가 <b>지금 걸기</b>다');
  is(/오늘의 알림에서/.test(T.txt), '<b>어디서 뽑았는지</b> 말한다 — 안 적으면 왜 이 분인지 모른다');
  is(/아직 첫 통화 전/.test(T.txt), '<b>왜 이 분인지</b> 말한다');

  /* ── <b>진짜 저장 단추</b>를 눌러 본다 ─────────────────────────────
     처음엔 nxShow 를 직접 불러서 쟀다. 그러면 <b>저장 → 다음</b> 을 잇는 그
     한 줄을 지워도 이 점검이 안 울린다 — 제일 중요한 자리를 안 재는 자였다.
     그래서 서버만 가짜로 두고 <b>saveCall() 을 그대로</b> 부른다 (8번). */
  head('[1-1] <b>저장 단추를 실제로 눌렀을 때</b> 다음이 뜨는가');
  const S1 = await pg.evaluate(async () => {
    /* sb·loadAll 은 <b>let/function</b> 이라 window 에 안 붙는다 —
       window.sb 에 넣으면 갈아끼운 줄 알고 진짜가 그대로 돈다. 바로 대입한다. */
    const chain = { select: () => chain, eq: () => Promise.resolve({ error: null }),
                    insert: () => Promise.resolve({ error: null }),
                    update: () => chain, order: () => chain, range: () => Promise.resolve({ error: null, data: [] }) };
    const realSb = sb, realLoad = loadAll;
    sb = { from: () => chain };
    loadAll = async function () { };                 /* 다시 읽기는 여기서 안 잰다 */
    /* ★ <b>앞 절에서 열어 둔 창을 먼저 닫는다.</b> 안 닫으면 저장이 다음 창을
       안 띄워도 「열려 있다」 가 참이 되어, 저장 고리를 지워도 이 점검이 안
       운다 — 실제로 한 번 안 울렸다 (8번). */
    document.getElementById('nextModal').classList.remove('open');
    document.getElementById('nextBody').innerHTML = '';
    savingCall = false; editCallId = null;
    goPage('touch'); renderAll();
    openCall('d1');
    document.getElementById('callResult').value = '부재';
    document.getElementById('callAt').value = '2026-09-17T10:00';
    document.getElementById('callMemo').value = '';
    await saveCall();
    const r = {
      callClosed: !document.getElementById('callModal').classList.contains('open'),
      nextOpen: document.getElementById('nextModal').classList.contains('open'),
      txt: (document.getElementById('nextBody').innerText || '').replace(/\s+/g, ' ').trim()
    };
    /* 고치는 중일 때는 <b>안 떠야</b> 한다 — 이어서 걸 생각으로 들어오신 것이 아니다 */
    document.getElementById('nextModal').classList.remove('open');
    savingCall = false; editCallId = 'c1';
    openCall('d1');
    document.getElementById('callResult').value = '부재';
    document.getElementById('callAt').value = '2026-09-17T10:00';
    await saveCall();
    r.editQuiet = !document.getElementById('nextModal').classList.contains('open');
    editCallId = null;
    sb = realSb; loadAll = realLoad;
    return r;
  });
  is(S1.callClosed, '저장하면 <b>통화 창이 닫힌다</b>');
  is(S1.nextOpen, '<b>저장 단추를 누르면</b> 다음 창이 뜬다 — 이 한 줄이 끊기면 표로 떨어진다');
  is(/홍말순/.test(S1.txt), '그 창에 <b>다음 분</b>이 이름으로 있다');
  is(S1.editQuiet, '기록을 <b>고치는 중일 때는 안 뜬다</b> — 이어서 걸 생각이 아니시다');

  head('[2] <b>할 말은 apex-stage.js 에서</b> 온다 — 여기서 또 적지 않는다 (5번)');
  const stg = await pg.evaluate(() => {
    const m = window.APEX_STAGE && APEX_STAGE.of('미접촉');
    return m ? { aim: APEX_STAGE.aimText('미접촉'), way: APEX_STAGE.wayText('미접촉'), ch: m.ch } : null;
  });
  is(!!stg, '공용 단계표를 <b>읽었다</b>');
  is(stg && T.txt.indexOf(stg.aim) >= 0, '표의 <b>목표</b>가 그대로 선다 — ' + ((stg && stg.aim) || ''));
  is(stg && T.txt.indexOf(stg.way) >= 0, '표의 <b>방법</b>도 그대로 선다');
  is(stg && T.txt.indexOf(stg.ch) >= 0, '<b>무엇으로</b> 연락할지도 — ' + ((stg && stg.ch) || ''));

  head('[3] <b>DB 목록에서</b> 저장했으면 그 목록의 다음 줄');
  const D = await nx('db', 'd1', '상담', 'AP');
  is(/지금 보시는 목록에서/.test(D.txt), '<b>지금 보시는 목록</b>이라고 말한다 — 오늘의 알림과 안 섞는다');
  is(/홍말순/.test(D.txt), '그 목록의 <b>다음 줄</b>이 선다');

  head('[4] <b>더 없으면 없다고</b> 하고 · <b>모르면 없다고 안 한다</b> (1번)');
  const E = await pg.evaluate(() => {
    dbs = [dbs[0]]; goPage('touch'); renderAll(); nxShow('d1', '부재', '부재');
    const bd = document.getElementById('nextBody');
    return { txt: (bd.innerText || '').replace(/\s+/g, ' ').trim(), html: bd.innerHTML };
  });
  is(/더 없습니다/.test(E.txt), '남은 것이 없으면 <b>없다고 적는다</b>');
  is(/다른 목록에는 남아 있을 수 있습니다/.test(E.txt),
     '<b>이 목록만</b> 봤다고 밝힌다 — 「오늘 할 일이 없다」 로 읽히면 안 된다');
  const F = await pg.evaluate(() => {
    DBL = { loaded: true, busy: false, err: 'Failed to fetch' };
    nxShow('d1', '부재', '부재');
    const bd = document.getElementById('nextBody');
    return { txt: (bd.innerText || '').replace(/\s+/g, ' ').trim(), again: [...bd.querySelectorAll('.hold-go')].length };
  });
  is(!/더 없습니다/.test(F.txt), '못 받았을 때 <b>「더 없습니다」라고 안 한다</b>');
  is(/못 받았습니다/.test(F.txt) && /Failed to fetch/.test(F.txt), '<b>못 받았다</b>고 적고 서버가 준 말을 옮긴다');
  is(F.again > 0, '<b>다시 읽기</b> 자리가 있다');
  const W = await pg.evaluate(() => {
    DBL = { loaded: false, busy: true, err: '' };
    nxShow('d1', '부재', '부재');
    return (document.getElementById('nextBody').innerText || '').replace(/\s+/g, ' ');
  });
  is(!/더 없습니다/.test(W) && /읽는 중/.test(W), '아직일 때도 <b>「더 없습니다」라고 안 한다</b>');

  head('[5] <b>단추가 진짜로 간다</b> — 안 울리는 알람은 알람이 아니다 (8번)');
  const G = await pg.evaluate(() => {
    DBL = { loaded: true, busy: false, err: '' };
    dbs = [{ id: 'd1', assigned_to: 'me', customer_name: '홍길순', stage: '부재', source: '일반', assigned_date: '2026-09-01', region: '순천시' },
           { id: 'd2', assigned_to: 'me', customer_name: '홍말순', stage: '미접촉', source: '일반', assigned_date: '2026-08-20', region: '여수시' }];
    goPage('touch'); renderAll(); nxShow('d1', '부재', '부재');
    const btn = [...document.querySelectorAll('#nextBody button')].filter(e => /지금 걸기/.test(e.innerText))[0];
    if (!btn) return { no: true };
    btn.click();
    return {
      nextClosed: !document.getElementById('nextModal').classList.contains('open'),
      callOpen: document.getElementById('callModal').classList.contains('open'),
      who: (document.getElementById('callSummary').innerText || '').trim(),
      id: document.getElementById('callDbId').value
    };
  });
  is(!G.no, '<b>지금 걸기</b> 단추를 찾을 수 있다');
  is(G.callOpen, '누르면 <b>통화 창이 열린다</b>');
  is(G.id === 'd2' && /홍말순/.test(G.who), '<b>그 다음 분</b>의 창이다 — ' + (G.who || ''));
  is(G.nextClosed, '다음 창은 <b>닫힌다</b> — 창 두 장이 겹치지 않는다');

  head('[6] <b>조사</b>가 맞는가 — 고객 앞에 띄우는 글이다');
  const all = [T.txt, D.txt, E.txt, F.txt, W].join(' ');
  is(!/상담 로|부재 로|AP 로|TA 로/.test(all), '<b>「상담 로」</b> 같은 것이 안 나온다');
  is(!/[가-힣A-Z] 입니다/.test(all), '<b>「부재 입니다」</b> 처럼 띄어 쓰지 않는다');
  is(/부재로 남겼|상담으로 남겼/.test(all), '받침을 보고 <b>로 / 으로</b>를 고른다');

  head('[7] <b>손이 닿는가</b> (2단계)');
  is(T.small === 0 && D.small === 0, '다음 창의 단추가 <b>모두 44px 이상</b>');

  /* ══ ② 보장분석 전·후 만들기 ════════════════════════════════════ */
  head('[8] <b>보장분석 전·후</b> — 저장했으면 보여 드리는 데까지');
  const bp = await ctx.newPage();
  const e2 = [];
  bp.on('pageerror', e => e2.push(String(e).slice(0, 150)));
  await bp.goto('http://127.0.0.1:' + PORT + '/app/ba.html', { waitUntil: 'domcontentloaded' });
  await bp.waitForTimeout(1800);
  /* ★ <b>진짜 길로 들어간다.</b> nxSaved 를 직접 부르면, 바깥이 보낸 소식을
     받는 그 한 줄을 지워도 안 운다 — ① 에서 겪은 것과 같은 구멍이다 (8번). */
  const B = await bp.evaluate(async () => {
    window.toast = function () {};
    window.postMessage({ type: 'apexBaSaved', name: '홍○○' }, '*');
    await new Promise(r => setTimeout(r, 120));
    const box = document.getElementById('nxSaved');
    if (!box) return { boom: '저장 소식을 받고도 다음 칸을 안 세웠다' };
    const btns = [...box.querySelectorAll('button')];
    return {
      on: box.classList.contains('on'),
      txt: (box.innerText || '').replace(/\s+/g, ' ').trim(),
      btns: btns.map(e => (e.innerText || '').trim()),
      primary: btns.filter(e => /nx-go/.test(e.className)).length,
      small: btns.filter(e => e.getBoundingClientRect().height < 44).length
    };
  });
  is(!B.boom && B.on, '저장하면 <b>다음 칸이 뜬다</b> — 사라지는 토스트가 아니다' + (B.boom || ''));
  is(/홍○○/.test(B.txt), '<b>누구 자료인지</b> 적는다');
  is(/고객에게 보여 드리기/.test(B.txt), '다음이 <b>보여 드리기</b>라고 말한다');
  is(B.primary === 1, '누를 으뜸 자리가 <b>하나</b>다');
  is(B.small === 0, '단추가 <b>44px 이상</b>');
  const B2 = await bp.evaluate(() => {
    const btn = [...document.querySelectorAll('#nxSaved button')].filter(e => /보여 드리기/.test(e.innerText))[0];
    if (!btn) return { no: true };
    btn.click();
    return { deck: !!(window.S && S.deck), presenting: document.body.classList.contains('presenting'),
             closed: !document.getElementById('nxSaved').classList.contains('on') };
  });
  is(!B2.no, '<b>지금 보여 드리기</b> 단추를 찾을 수 있다');
  is(B2.deck === true, '누르면 <b>한 장씩 넘기기</b>로 바뀐다 — 토글을 먼저 안 찾아도 된다');
  is(B2.presenting === true, '누르면 <b>발표가 시작된다</b> — 설계사 도구가 치워진다');
  is(B2.closed, '칸은 <b>닫힌다</b> — 고객 화면을 안 덮는다');
  const B3 = await bp.evaluate(async () => {
    /* 발표 중에 또 저장하면 — <b>고객이 보고 계신 화면</b>을 덮으면 안 된다 */
    document.body.classList.add('presenting');
    window.postMessage({ type: 'apexBaSaved', name: '홍○○' }, '*');
    await new Promise(r => setTimeout(r, 120));
    const box = document.getElementById('nxSaved');
    const vis = box && box.offsetParent !== null;
    document.body.classList.remove('presenting');
    return vis;
  });
  is(B3 === false, '<b>발표 중에는 안 뜬다</b> — 고객이 보고 계신 화면이다');

  /* ══ ③ 증권 전달 ════════════════════════════════════════════════ */
  head('[9] <b>증권 전달</b> — 뽑았으면 기록까지');
  const dp = await ctx.newPage();
  const e3 = [];
  dp.on('pageerror', e => e3.push(String(e).slice(0, 150)));
  await dp.goto('http://127.0.0.1:' + PORT + '/app/%EC%A6%9D%EA%B6%8C%EC%A0%84%EB%8B%AC/index.html', { waitUntil: 'domcontentloaded' });
  await dp.waitForTimeout(1500);
  /* ★ 여기도 <b>진짜 길로</b> — 인쇄 창이 닫히는 그 자리를 그대로 울린다 */
  const P = await dp.evaluate(() => {
    window.dispatchEvent(new Event('afterprint'));
    const box = document.getElementById('nxNext');
    if (!box) return { boom: '인쇄 창이 닫혔는데 다음 칸을 안 세웠다' };
    const btns = [...box.querySelectorAll('button')];
    return {
      on: box.classList.contains('on'),
      txt: (box.innerText || '').replace(/\s+/g, ' ').trim(),
      primary: btns.filter(e => /nx-go/.test(e.className)).length,
      small: btns.filter(e => e.getBoundingClientRect().height < 44).length,
      /* afterprint 는 인쇄를 <b>취소해도</b> 울린다 */
      hook: true
    };
  });
  is(!P.boom && P.on, '인쇄 창이 닫히면 <b>다음 칸이 뜬다</b>' + (P.boom || ''));
  is(!/인쇄했습니다|인쇄하셨습니다/.test(P.txt),
     '<b>「인쇄했습니다」라고 안 적는다</b> — 취소해도 울리는 자리다 (1번)');
  is(/증권전달/.test(P.txt) && /DB 통합 CRM/.test(P.txt), '다음이 <b>CRM 에 올리기</b>라고 말한다');
  is(/소개완료/.test(P.txt), '<b>왜 올려야 하는지</b> 말한다 — 소개 자리가 열린다');
  is(P.primary === 1, '누를 으뜸 자리가 <b>하나</b>다');
  is(P.small === 0, '단추가 <b>44px 이상</b>');
  const P2 = await dp.evaluate(() => {
    /* 혼자 열었을 때는 <b>새 탭</b>으로 간다 — 눌렀는데 아무 일도 안 나면 안 된다 */
    let opened = '';
    const real = window.open; window.open = function (u) { opened = u; return null; };
    const btn = [...document.querySelectorAll('#nxNext button')].filter(e => /CRM 열기/.test(e.innerText))[0];
    if (!btn) { window.open = real; return { no: true }; }
    btn.click();
    window.open = real;
    return { opened, closed: !document.getElementById('nxNext').classList.contains('on') };
  });
  is(!P2.no, '<b>DB 통합 CRM 열기</b> 단추를 찾을 수 있다');
  is(/db-crm\.html/.test(P2.opened || ''), '누르면 <b>진짜로 간다</b> — ' + (P2.opened || '(아무 데도 안 감)'));
  is(P2.closed, '칸은 <b>닫힌다</b>');
  const P3 = await dp.evaluate(() => {
    document.body.classList.add('presenting');
    window.dispatchEvent(new Event('afterprint'));
    const box = document.getElementById('nxNext');
    const vis = box && box.classList.contains('on');
    document.body.classList.remove('presenting');
    return vis;
  });
  is(P3 === false, '<b>발표 중에는 안 뜬다</b>');

  head('[10] <b>바깥에서 열었을 때</b>는 워크스페이스에 부탁한다 — 로그인이 둘이 되면 안 된다');
  const src = fs.readFileSync(path.join(ROOT, 'app/증권전달/index.html'), 'utf8');
  is(/apexPdelGo/.test(src), '틀 안이면 <b>바깥에 부탁</b>하는 길이 있다');
  const host = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/apexPdelGo/.test(host), '바깥이 그 부탁을 <b>받는다</b>');
  is(/apexPdelGo[\s\S]{0,400}?e\.source\s*!==\s*fr\.contentWindow/.test(host),
     '<b>우리가 띄운 그 틀에서 온 것만</b> 받는다 — 아무 창이나 화면을 못 바꾼다');

  head('[12] <b>칸 모양은 한 곳</b>에만 — 세 화면에 각각 적으면 한쪽만 고쳐진다 (5번)');
  const files = ['db-crm.html', 'app/ba.html', 'app/증권전달/index.html'];
  const dup = files.filter(f => /\.nx-go\{/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  is(dup.length === 0, '단추 모양을 <b>자기 파일에 또 적은 화면이 없다</b>' + (dup.length ? ' — ' + dup.join(' · ') : ''));
  const shared = fs.readFileSync(path.join(ROOT, 'apex-next.js'), 'utf8');
  is(/\.nx-go\{/.test(shared), '모양은 <b>apex-next.js 한 곳</b>에 있다');
  is(files.every(f => /apex-next\.js/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))),
     '세 화면이 <b>그 파일을 싣는다</b>');
  /* 셋 중 둘에는 :root 계단이 없다 — 대체값이 없으면 단추가 투명하게 선다 */
  is(!/var\(--[a-z0-9-]+\)/.test(shared.replace(/\/\*[\s\S]*?\*\//g, '')),
     '토큰에 <b>대체값</b>이 다 붙어 있다 — :root 가 없는 화면에서도 보인다');

  head('[11] 세 화면을 그리는 동안 <b>터진 곳이 없다</b>');
  is(e1.length === 0, 'DB 통합 CRM 콘솔 에러 ' + e1.length + '건' + (e1.length ? ' — ' + e1.slice(0, 2).join(' / ') : ''));
  is(e2.length === 0, '보장분석 전·후 콘솔 에러 ' + e2.length + '건' + (e2.length ? ' — ' + e2.slice(0, 2).join(' / ') : ''));
  is(e3.length === 0, '증권 전달 콘솔 에러 ' + e3.length + '건' + (e3.length ? ' — ' + e3.slice(0, 2).join(' / ') : ''));

  console.log('\n' + (bad ? ('✗ 흐름 한 줄 — ' + bad + '자리가 끊겼습니다')
                          : '✓ 세 흐름 모두 끝난 자리에서 「다음」 한 걸음으로 이어집니다'));
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
