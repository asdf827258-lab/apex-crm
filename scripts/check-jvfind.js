/* 🔎 <b>자비스가 길이 아니라 그 안의 값을 찾아 내놓는가</b> (판 X270)

   사장님 말씀 2026-10-30 — 「apex자비스 모드에서 가야할길을 알려주는게 아니라
   여기에 있는 내용을 찾아서 내보내서 결과 값을 보여줄수 있게 만들어보자」.

   ── 고치기 전에 재어 보니 ─────────────────────────────────────────
     · 「홍길동 연락처 알려줘」 → 「☰ 서랍 › 고객 365일」 길 · 연락처는 0
     · 「I20 이 뭐야」 → 걸음 0 · 「찾지 못했습니다」 (코드 표는 앱에 있는데)
     · 「감액완납이 뭐야」 → 계약관리 화면으로 가는 길 · 뜻은 0

   ── 여기서 지키는 것 ───────────────────────────────────────────
     [1] 고객 이름 · 연락처 뒷자리로 물으면 <b>그 분의 값</b>(연락처 · 마지막 연락 ·
         다음 할 일 · 생일)이 답 맨 위에 선다 · 「이 분 창 열기」 가 그 분 창을 연다
     [2] 질병코드 — 코드로도 이름으로도 · 값은 <b>앱의 kcdFind 와 같은 것</b> ·
         없는 코드는 「지어내지 않습니다」
     [3] 계약관리 — 표(CONTRACT_ACTS)의 글이 <b>그대로</b> · 「감액완납」 에 「감액」 이
         끼지 않는다 · 「약관과 심사 결과에 따릅니다」 를 빼지 않는다 (2번)
     [4] 값을 찾으면 길은 <b>접힌다</b>(지우지 않는다) · 못 찾으면 길은 그대로
     [5] <b>헛것을 안 잡는다</b> — 「어디서 · 어떻게」 물음 스물두 가지에서 찾은 값 0 (8번)
     [6] 고객 목록을 안 읽었으면 <b>「아직 안 읽었다」</b> · 서버를 새로 안 부른다 (1번 · 7번)
     [7] 회사 표와 AI 로 가는 물음에 <b>고객 실명 0</b> (3번)
     [8] 꺾쇠 0 · 콘솔 오류 0
     [9] 📚 (판 X268 · 사장님 말씀 「보험에 모든 내용을 여기안에서 다 해놨는데 여기내에서
         찾아서 결과값을 보여주면 좋겠어」) — 질병 · 담보 · 용어 · 수술 · 지급 사례 ·
         거절 처리를 <b>앱의 표 그대로</b> 내놓나 · 약관·심사 문구 · 금액은 예시라 밝히고
         억·만으로 · 자리표·꼬리표가 안 새나 · 빈 칸 줄 0 · 흔한 말·낱말 하나로 곁가지 0 ·
         AI 에는 보험 자료만(고객 줄 0)
   ★ 이름은 「홍길동」 (3번). 바깥 주소는 부르지 않는다 (7번).                 */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9071;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* check-jvguide 의 물음표와 같은 스물두 가지 — 「어디서 · 어떻게」 를 묻는 말.
   여기서 값이 걸리면 헛것입니다. */
const HOWTO = ['고객 등록은 어디서 해?', '청구 서류 어떻게 받아?', '보장분석 어떻게 해?', '증권 PDF 를 받았어',
  '고객이 보험을 정리하고 싶대', '아침에 뭐부터 해?', '연금 상담 하려면?', '팀원 실적은 어디서 봐?',
  '보험료 비교해달래', '폰에 앱 설치 어떻게 해', '실비 계산 어떻게 해', '교통사고 났대', '법인 대표 상담',
  'DB 배정 받은 거 어디서 봐', '약속 잡힌 고객 일정 넣기', '신상품 나왔는데 뭐 권하지', '질병코드 찾기',
  '재무설계 계산기 어떻게 써?', '인스타 올릴 거 만들기', '거절한 고객 다시 연락하고 싶어', '화면이 이상해',
  '상속 증여 상담', '오늘 챙길 고객 누구야', '영업이 안 돼'];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.__load = 0;
  window.osLoadClients=function(){ window.__load++; }; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'윤설계',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  CM.loaded=true; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  OSC.list=[{id:'c0',name_masked:'홍○○',advisor_id:'me',stage:'AP',created_at:'2026-08-01',phone:'010-1234-5678'},
            {id:'c1',name_masked:'성○○',advisor_id:'me',stage:'AP',created_at:'2026-08-02',phone:'010-9999-0000'}];
  CM.meta={c0:{bd:'11-02',nx:[{k:'nx1',what:'증권 전달',due:'2026-11-03'}],touch:[]}};
  try{ cmRealSet('c0','홍길동'); cmRealSet('c1','성춘향'); }catch(e){}
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};

(async () => {
  console.log('자비스 — 길이 아니라 그 안의 값을 찾아 내놓는가 (판 X270)');
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const outside = [], GOT = {}, PENGOT = [];
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (/pension-engine\.js$|apex-won\.js$/.test(u) && /apex-map/.test(rt.request().headers()['referer'] || '')) PENGOT.push(u.split('/').pop());
    if (/보험아카데미\/(terms|terms2|disease1|disease2|surgery|design|costs)\.js$|실전화법서\.html$/.test(decodeURIComponent(u)) && /apex-map/.test(rt.request().headers()['referer'] || ''))
      GOT[decodeURIComponent(u).split('/').pop()] = (GOT[decodeURIComponent(u).split('/').pop()] || 0) + 1;
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return rt.continue();
    outside.push(u);
    return rt.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(800);
  await p.evaluate(() => go('apexmap'));
  await p.waitForTimeout(2200);
  const f = p.frame({ url: /apex-map\.html/ });
  is(!!f, '자비스 모드가 <b>앱 안에서</b> 열린다');
  if (!f) { await b.close(); srv.close(); process.exit(1); }
  await f.evaluate(() => { ['gproxy','proxy','apikey','gkey'].forEach(k => LS.del(k)); modeLabel(); });
  outside.length = 0;

  /* 물으면 마지막 카드를 읽는다 */
  const askCard = (q) => f.evaluate(async (q) => {
    jLog.innerHTML = ''; ask(q);
    await new Promise(r => setTimeout(r, 300));
    const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    const fd = c && c.querySelector('.j-find'), st = c && c.querySelector('.steps');
    const way = c && c.querySelector('details.j-way');
    const bub = c && c.querySelector('.bub');
    return { html: c ? c.innerHTML : '', find: fd ? fd.textContent : '',
             head: bub ? (bub.firstChild && bub.firstChild.nodeType === 3 ? bub.firstChild.textContent : '') : '',
             findFirst: !!(fd && st ? (fd.compareDocumentPosition(st) & 4) : fd),
             steps: st ? st.querySelectorAll('li').length : 0,
             wayFolded: !!way && !way.open && !!(st && way.contains(st)),
             cli: [].slice.call(c ? c.querySelectorAll('[data-cli]') : []).map(x => x.getAttribute('data-cli')) };
  }, q);

  sec('[1] 🪪 <b>고객</b> — 이름·연락처 뒷자리로 물으면 그 분의 값이 맨 위에');
  const C1 = await askCard('홍길동 연락처 알려줘');
  is(/010-1234-5678/.test(C1.find), '「홍길동 연락처 알려줘」 → <b>연락처</b>가 답 안에 — 「' + C1.find.slice(0, 60) + '…」');
  is(/증권 전달/.test(C1.find) && /2026-11-03/.test(C1.find), '다음 할 일(증권 전달 · 2026-11-03)이 같이 선다');
  is(/생일 11-02/.test(C1.find), '생일이 같이 선다');
  is(/마지막 연락/.test(C1.find), '마지막 연락이 같이 선다 (기록이 없으면 「기록 없음」)');
  is(C1.cli.length === 1 && C1.cli[0] === 'c0', '「이 분 창 열기」 가 <b>그 분</b>을 가리킨다 — ' + C1.cli.join(','));
  is(!/성춘향/.test(C1.find), '묻지 않은 분은 안 선다');
  is(/^앱에서 찾았습니다 — 고객 명단 1명/.test(C1.head), '답의 머리가 <b>찾은 것</b>을 말한다 — 「' + C1.head + '」');
  is(C1.findFirst, '찾은 값이 <b>길보다 먼저</b> 선다');
  const C2 = await askCard('5678 누구야');
  is(/홍길동/.test(C2.find), '연락처 뒷자리 「5678」 로도 찾는다 (고객 365일 찾기 칸과 같은 셈)');
  const C3 = await askCard('홍길동님 다음 할 일');
  is(/증권 전달/.test(C3.find), '「홍길동님」 처럼 <b>님</b>을 붙여도 찾는다');
  /* 누르면 그 분 창 — 본체의 cusGo 하나가 엽니다 */
  await askCard('홍길동 연락처 알려줘');
  await f.evaluate(() => { const x = [].slice.call(document.querySelectorAll('#jLog [data-cli]')).pop(); x.click(); });
  await p.waitForTimeout(600);
  const OPEN = await p.evaluate(() => ({ tab: currentTab(), view: OSC.view, cur: OSC.current && OSC.current.id,
                                         dock: document.body.classList.contains('jv-dock') }));
  is(OPEN.tab === 'clients' && OPEN.view === 'detail' && OPEN.cur === 'c0',
     '「이 분 창 열기」 → 그 분 창이 열렸다 — ' + OPEN.tab + ' · ' + OPEN.view + ' · ' + OPEN.cur);
  is(OPEN.dock, '자비스는 <b>아래 띠</b>로 남는다 (판 X245)');
  await p.evaluate(() => { jvDockEnd(); go('apexmap'); });
  await p.waitForTimeout(500);

  sec('[2] 📕 <b>질병코드</b> — 코드로도 이름으로도 · 앱의 kcdFind 와 같은 값');
  const K1 = await askCard('I20 이 뭐야');
  const kName = await p.evaluate(() => (kcdFind('I20', 8).hits.filter(r => r[0] === 'I20')[0] || [])[1] || '');
  is(!!kName && K1.find.indexOf('I20') >= 0 && K1.find.indexOf(kName) >= 0,
     '「I20 이 뭐야」 → I20 ' + kName + ' (앱의 표와 같은 이름)');
  const K2 = await askCard('협심증 코드 뭐야');
  is(/I20/.test(K2.find), '「협심증 코드 뭐야」 → I20');
  const K3 = await askCard('I63');
  const k3 = await p.evaluate(() => (window.DZ_KCD && DZ_KCD.name('I63')) || '');
  is(!!k3 && K3.find.indexOf(k3) >= 0, '코드만 쳐도 — I63 ' + k3);
  const K4 = await askCard('김치찌개 질병코드');
  is(/지어내지 않습니다/.test(K4.find) && !/[A-Z]\d\d\s/.test(K4.find.replace(/질병코드/g, '')),
     '없는 병은 <b>코드를 지어내지 않는다</b> — 「' + K4.find.slice(0, 50) + '…」');
  is(/약관의 분류표/.test(K1.find), '「어느 담보에 걸리는지는 약관의 분류표가 정한다」 를 빼지 않는다');
  /* 재다가 찾은 것 — 줄 끝 쉼표 하나가 빠져 Z38·C19 가 undefined 하나로 뭉쳤고,
     질병코드 화면의 찾기가 그 자리에서 터지고 있었습니다(판 X171 부터) */
  const KD = await p.evaluate(() => ({ empty: KCD_DATA.filter(x => !x).length,
    z38: KCD_DATA.some(x => x && x[0] === 'Z38'), c19: KCD_DATA.some(x => x && x[0] === 'C19') }));
  is(KD.empty === 0 && KD.z38 && KD.c19, '질병코드 표에 <b>빈 칸 0</b> · Z38 · C19 가 제자리에 있다 (빈 칸 ' + KD.empty + ')');
  const KS = await p.evaluate(() => { go('ref_kcd'); const i = document.getElementById('kcd_q'); if (!i) return 'no-input';
    i.value = '출생아'; try { kcdSearch(); } catch (e) { return 'throw ' + e.message; }
    return (document.getElementById('kcd_res') || {}).textContent || ''; });
  is(/Z38/.test(KS), '질병코드 화면의 찾기 칸이 <b>안 터지고</b> 맨 끝 줄까지 찾는다 — 「출생아」 → ' + KS.slice(0, 30));
  await p.evaluate(() => go('apexmap'));
  await p.waitForTimeout(400);

  sec('[3] ⚖️ <b>계약관리</b> — 표의 글이 그대로');
  const T1 = await askCard('감액완납이 뭐야');
  const ACT = await p.evaluate(() => { const a = CONTRACT_ACTS.filter(x => x.id === 'paidup')[0];
    const r = CONTRACT_ACTS.filter(x => x.id === 'reduce')[0]; return { mean: a.mean, say: a.say, lose: a.lose, rmean: r.mean }; });
  is(T1.find.indexOf(ACT.mean) >= 0 && T1.find.indexOf(ACT.say) >= 0 && T1.find.indexOf(ACT.lose) >= 0,
     '「감액완납이 뭐야」 → 뜻 · 고객께 할 말 · 잃는 것이 <b>표 그대로</b>');
  is(T1.find.indexOf(ACT.rmean) < 0, '「감액완납」 안의 「감액」 으로 <b>감액이 끼지 않는다</b>');
  is(/약관과 심사 결과에 따릅니다/.test(T1.find), '「약관과 심사 결과에 따릅니다」 를 빼지 않는다 (2번)');
  const T2 = await askCard('APL 이 뭐야');
  is(/자동대출납입/.test(T2.find), '괄호 속 다른 이름(APL)으로도 찾는다');

  sec('[4] 📂 값을 찾으면 길은 <b>접힌다</b> — 지우지 않는다 (6번)');
  is(T1.wayFolded || C1.wayFolded, '찾은 값 아래 「이 일을 화면에서 하시려면」 이 <b>접힌 채로</b> 남는다' +
     ' (계약 ' + T1.wayFolded + ' · 고객 ' + C1.wayFolded + ')');
  const G = await askCard('보장분석 어떻게 해?');
  is(!G.find && G.steps > 0 && !G.wayFolded, '못 찾은 물음은 <b>길이 그대로</b> 펴져 있다 — 걸음 ' + G.steps);

  sec('[5] 🙅 <b>헛것을 안 잡는다</b> — 「어디서 · 어떻게」 물음 ' + HOWTO.length + '가지 (8번)');
  /* ★ 판 X269 부터 보험 자료가 넓어져 「법인 대표 상담」 엔 아카데미 「법인 대표」 설계 가이드가 <b>제대로</b> 섭니다.
     그래서 여기서 재는 것은 셋입니다 — ① 고객·코드·계약관리가 안 끼나 ② 「아직 안 읽었다」 가 안 끼나
     ③ <b>「어디서 · 어떻게 써」</b> 물음에 굳은 자료가 서서 길을 접지 않나 */
  const H = await f.evaluate((L) => L.map(q => ({ q, F: jvFind(q).filter(x =>
      (!x.know && (x.rows || []).length) || x.wait || x.waitSay || (JV_USE.test(q) && x.strong && (x.rows || []).length)).map(x => x.k) })), HOWTO);
  const ghost = H.filter(x => x.F.length);
  is(ghost.length === 0, '헛것 0 — ' + (ghost.length ? ghost.map(x => x.q + '→' + x.F.join('/')).join(' · ') : '스물네 가지 모두 길이 앞'));
  const ADV = await f.evaluate(() => jvFind('윤설계 실적').filter(x => x.k === 'cli').length);
  is(ADV === 0, '담당자 이름(윤설계)으로 그 사람 고객을 <b>다 늘어놓지 않는다</b>');

  sec('[6] ⏳ 고객 목록을 안 읽었으면 <b>「아직 안 읽었다」</b> — 서버는 안 부른다');
  const W = await f.evaluate(async () => {
    const P = window.parent, keep = P.OSC.list, kl = P.OSC.loaded;
    P.OSC.list = []; P.OSC.loaded = false; P.__load = 0;
    jLog.innerHTML = ''; ask('홍길동 연락처');
    await new Promise(r => setTimeout(r, 300));
    const t = (document.querySelector('#jLog .j-find') || {}).textContent || '';
    P.OSC.list = keep; P.OSC.loaded = kl;
    return { t, load: P.__load };
  });
  is(/아직 안 읽어서/.test(W.t) && /없다고 하지 않습니다/.test(W.t), '「고객 365일 을 아직 안 읽어서 찾을 수 없습니다」 — 0명이라 하지 않는다');
  is(W.load === 0, '찾으려고 고객 목록을 <b>서버에서 새로 받지 않는다</b> (7번) — 부른 수 ' + W.load);

  sec('[7] 🙈 회사 표 · AI 로 가는 물음에 <b>고객 실명 0</b> (3번)');
  const M = await f.evaluate(async () => {
    const P = window.parent, rows = [], keepC = P.osClient;
    P.osClient = function(){ return { from: function(){ return { insert: function(r){ rows.push(r); return Promise.resolve({}); } }; } }; };
    LS.set('map_engine', 'gemini'); LS.set('gproxy', '/api/gemini');
    const sent = [], keep = window.fetch;
    window.fetch = function(u, o){
      sent.push(o.body);
      const out = JSON.stringify({ answer: '확인했습니다.', steps: [], real: '', next: [] });
      return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: out }] } }] }),
                                          { status: 200, headers: { 'Content-Type': 'application/json' } }));
    };
    jLog.innerHTML = ''; ask('홍길동 연락처 알려줘');
    await new Promise(r => setTimeout(r, 500));
    window.fetch = keep; LS.del('gproxy'); LS.del('map_engine'); P.osClient = keepC;
    const shown = (document.querySelector('#jLog .j-find') || {}).textContent || '';
    return { rows: rows.map(r => r.title), sent: sent.join(' '), n: sent.length, shown, mk: P.osMaskName('홍길동') };
  });
  /* 가리는 꼴은 앱의 osMaskName 한 곳이 정합니다 — 여기서 「홍○○」 이라고 못 박지 않습니다 (5번) */
  is(M.n >= 1 && M.sent.indexOf('홍길동') < 0 && M.sent.indexOf(M.mk) >= 0, 'AI 로 가는 물음은 앱의 가림(' + M.mk + ')으로 가려졌다');
  is(M.sent.indexOf('010-1234-5678') < 0, 'AI 로 연락처가 안 간다');
  is(M.rows.length >= 1 && M.rows.every(t => t.indexOf('홍길동') < 0), '회사 표(jarvis_q)에 적히는 물음도 가려졌다 — ' + M.rows.join(' · '));
  is(/홍길동/.test(M.shown), '이 화면(이 기기)에는 실명이 그대로 선다');

  sec('[9] 📚 <b>보험 자료</b> — 앱에 담아 둔 글을 찾아 그대로 (판 X268 · 사장님 말씀 「보험에 모든 내용을 여기안에서 다 해놨는데 여기내에서 찾아서 결과값을」)');
  /* 견줄 글은 <b>앱의 표에서</b> 꺼냅니다 — 여기 손으로 적으면 표가 고쳐질 때 이 자가 거짓말합니다 (5번) */
  const KN = await f.evaluate(() => {
    const P = window.parent, D = P.DZ_DATA;
    const pick = (L, k, v) => L.filter(x => x[k] === v)[0] || {};
    const sum = ['list','cov','terms','ops','cases'].reduce((n, k) => n + D[k].length, 0) + D.rej.all.length + P.APEX_STAGE.obj.length;
    return { sum, count: jvKnowCount(), hello: jvHello().answer,
             open: jvPlain(pick(D.list, 'id', 'stroke').talk ? pick(D.list, 'id', 'stroke').talk.open : (D.list.filter(x => /뇌졸중/.test(x.name))[0].talk.open)),
             biopsy: jvPlain(D.terms.filter(x => /^조직검사/.test(x.t))[0].d),
             polyp: jvPlain(D.ops.filter(x => /용종절제/.test(x.n))[0].ins) };
  });
  is(KN.count === KN.sum && KN.count > 0, '찾는 보험 자료 수를 <b>표를 세어</b> 말한다 — ' + KN.count + '가지 (질병·담보·용어·수술·사례·거절 처리)');
  is(KN.hello.indexOf(String(KN.count)) >= 0, '첫 인사가 그 수를 말한다 — 「' + KN.hello.split('\n')[2] + '」');
  const Z1 = await askCard('뇌졸중 화법');
  is(/뇌졸중/.test(Z1.find) && Z1.find.indexOf(KN.open) >= 0, '「뇌졸중 화법」 → 질병 보험가이드의 <b>여는 말이 표 그대로</b>');
  is(/약관과 보험사 심사 결과에 따릅니다/.test(Z1.find), '「약관과 보험사 심사 결과에 따릅니다」 를 붙인다 (2번)');
  is(Z1.findFirst && /^앱에서 찾았습니다 — 질병/.test(Z1.head), '찾은 자료가 답 맨 위에 — 「' + Z1.head + '」');
  const Z2 = await askCard('뇌졸증 화법');
  is(Z2.find.indexOf(KN.open) >= 0, '흔히 틀리는 글자(뇌졸<b>증</b>)로 물어도 찾는다');
  const Z3 = await askCard('조직검사가 뭐야');
  is(Z3.find.indexOf(KN.biopsy) >= 0, '「조직검사가 뭐야」 → 용어 풀이가 표 그대로');
  const Z4 = await askCard('용종 제거 수술비 나와?');
  is(/내시경 용종절제술/.test(Z4.find) && Z4.find.indexOf(KN.polyp) >= 0 && /열릴 수 있는 담보/.test(Z4.find),
     '「용종 제거 수술비 나와?」 → 내시경 용종절제술 · 보험에서 다투는 자리 · 열릴 수 있는 담보');
  const Z5 = await askCard('위암 사례');
  is(/3,000만원/.test(Z5.find) && /금액은 예시입니다/.test(Z5.find),
     '「위암 사례」 → 금액을 <b>만원 → 억·만</b>으로(3,000만원) · 「예시」 라고 밝힌다 (1번·4번)');
  const Z6 = await askCard('유사암 진단비');
  is(/유사암진단비/.test(Z6.find), '「유사암 진단비」 → 담보 풀이');
  const Z7 = await askCard('고객이 지금 바빠요 라고 해');
  is(/지금 바빠요/.test(Z7.find) && /첫 마디/.test(Z7.find) && !/\[①\]|\[②\]|\[고객\]|\{kw\}/.test(Z7.find),
     '「지금 바빠요」 → TA 거절 처리 · 자리표([①] · {kw})가 글자로 안 샌다');
  const Z8 = await askCard('보험 많아요 거절');
  is(/보험 많아요/.test(Z8.find) && !/\{병\}/.test(Z8.find), '「보험 많아요 거절」 → 질병 상담 거절 처리 · {병} 자리가 안 샌다');
  const ZZ = [Z1, Z3, Z4, Z5, Z7, Z8];
  is(ZZ.every(z => !/&lt;\/?b&gt;|<\/?b>/.test(z.find)), '표 속 <b> 꼬리표가 글자로 안 찍힌다');
  const empty = await f.evaluate(() => [].slice.call(document.querySelectorAll('#jLog .j-find .jw-s')).filter(e => /(—|:)\s*(「\s*」)?\s*$/.test(e.textContent)).length);
  const E2 = await askCard('뇌졸중 화법');
  const empty2 = await f.evaluate(() => [].slice.call(document.querySelectorAll('#jLog .j-find .jw-s')).filter(e => /(—|:)\s*(「\s*」)?\s*$/.test(e.textContent)).length);
  is(empty === 0 && empty2 === 0, '표의 빈 칸으로 <b>「짚을 것 — 」 만 남은 줄</b>이 안 선다');
  /* 아예 안 나와야 하는 것 · 나와도 「혹시 이것도」(약한 것)로만 서야 하는 것 — 길을 접지 않게 */
  const FP = await f.evaluate(() => {
    const none = ['거절한 고객 다시 연락하고 싶어', '화면이 이상해', '영업이 안 돼', 'DB 배정 받은 거 어디서 봐']
      .map(q => ({ q, n: jvFind(q).filter(x => (x.rows || []).length).length })).filter(x => x.n);
    /* 「교통사고 슬라이드」 — 약하게 맞은 장에 「원하는 답」 표가 점수를 얹어도 굳으면 안 됩니다 (판 X277) */
    const weak = ['보험료 비교해달래', '교통사고 났대', '질병코드 찾기', '교통사고 슬라이드']
      .map(q => ({ q, n: jvFind(q).filter(x => x.strong && (x.rows || []).length).length })).filter(x => x.n);
    return none.concat(weak);
  });
  is(FP.length === 0, '비슷한 낱말 하나로 엉뚱한 자료가 <b>앞에 서지 않는다</b>(「영업이 안 돼」 → 「자영업」 0)' + (FP.length ? ' ← ' + FP.map(x => x.q).join(' · ') : ''));
  const WK = await askCard('교통사고 났대');
  is(/혹시 이것도/.test(WK.find) && !WK.wayFolded && WK.steps > 0, '약하게 맞은 자료는 「혹시 이것도」 로 서고 <b>길은 펴 둔다</b>');
  /* 흔한 말(수술 · 진단비)이 이름 <b>안에</b> 들었다고 무겁게 치면 곁가지가 섭니다 */
  const BR = await f.evaluate(() => {
    const t = q => jvFind(q).map(x => (x.rows || []).map(r => r.t).join(' / ')).join(' ‖ ');
    return { mi: t('심근경색 진단비'), cat: t('백내장 수술') };
  });
  is(/심근경색/.test(BR.mi) && !/일반암진단비/.test(BR.mi), '「심근경색 진단비」 에 <b>암 진단비가 안 낀다</b> — ' + BR.mi.slice(0, 60));
  is(/백내장/.test(BR.cat) && !/보조항암/.test(BR.cat), '「백내장 수술」 에 「보조항암(수술 후)」 가 안 낀다');
  /* AI 에게는 찾은 <b>보험 자료</b>만 — 고객 줄은 안 간다 (3번) */
  const AG = await f.evaluate(async () => {
    LS.set('map_engine', 'gemini'); LS.set('gproxy', '/api/gemini');
    const sent = [], keep = window.fetch;
    window.fetch = function(u, o){ sent.push(o.body);
      const out = JSON.stringify({ answer: '네.', steps: [], real: '', next: [] });
      return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: out }] } }] }),
                                          { status: 200, headers: { 'Content-Type': 'application/json' } })); };
    jLog.innerHTML = ''; ask('뇌졸중 화법'); await new Promise(r => setTimeout(r, 400));
    const a = sent.join(' '); sent.length = 0;
    ask('홍길동 연락처'); await new Promise(r => setTimeout(r, 400));
    const b = sent.join(' ');
    window.fetch = keep; LS.del('gproxy'); LS.del('map_engine');
    return { a: /앱 자료/.test(a) && /뇌졸중/.test(a), b: /앱 자료/.test(b) || /010-1234/.test(b) };
  });
  is(AG.a, 'AI 에게 찾은 보험 자료를 근거로 쥐여 보낸다 — 앱의 글에서 출발하게');
  is(!AG.b, '고객을 찾은 물음에는 <b>고객 줄을 AI 에 안 보낸다</b> (3번)');

  sec('[10] 🎓 <b>보험 마스터 아카데미 · 📕 실전화법서</b>도 찾는다 (판 X269 · 사장님 말씀 「아카데미랑 실전화법서도 찾게 붙여줘」)');
  /* 견줄 글은 <b>파일에서 직접</b> 꺼냅니다 — 자비스가 읽은 것과 견주면 제 말을 제가 믿는 꼴입니다 */
  const AC = {};
  ['terms','terms2','disease1','disease2','surgery','design','costs'].forEach(n =>
    new Function('window', fs.readFileSync(path.join(ROOT, 'app/보험아카데미/' + n + '.js'), 'utf8'))(AC));
  const strip = t => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const FPH = fs.readFileSync(path.join(ROOT, 'app/재무설계/실전화법서.html'), 'utf8');
  const fpAns = strip((/<div class="oq">보험료가 너무 비싸요<\/div>[\s\S]*?<div class="ans">([\s\S]*?)<\/div>/.exec(FPH) || [])[1]);
  const anTip = strip(AC.DISEASE.filter(x => x.name === '협심증')[0].cov.tip);
  const dz20 = AC.DESIGN.filter(x => /사회초년생/.test(x.title))[0];
  const LOAD = await f.evaluate(() => ({ st: JV_EXT.st, why: JV_EXT.why, own: ['TERMS','DISEASE','SURG','DESIGN','COSTS'].filter(k => k in window) }));
  is(LOAD.st === 'ok' && !LOAD.why, '물으시자 아카데미 · 화법서를 읽었다 — ' + LOAD.st + (LOAD.why ? ' ← ' + LOAD.why : ''));
  is(LOAD.own.length === 0, '아카데미 표가 <b>자비스 창의 이름을 더럽히지 않는다</b>(빈 그릇에 읽음 · 5번)' + (LOAD.own.length ? ' ← ' + LOAD.own.join(',') : ''));
  const A1 = await askCard('보험료가 너무 비싸요');
  is(!!fpAns && A1.find.indexOf(fpAns) >= 0, '「보험료가 너무 비싸요」 → 실전화법서 거절 20 의 <b>받는 말이 책 그대로</b>');
  const A2 = await askCard('협심증');
  is(A2.find.indexOf(anTip) >= 0 && /나오는 담보/.test(A2.find) && /안 나오는 담보/.test(A2.find),
     '「협심증」 → 아카데미 질병백과의 나오는/안 나오는 담보 · 짚을 것이 표 그대로');
  const A3 = await askCard('백내장 수술 몇 종');
  is(/1-5종 수술비 — 1종/.test(A3.find), '「백내장 수술 몇 종」 → 1-5종 수술분류 <b>1종</b>(아카데미 표)');
  const A4 = await askCard('20대 사회초년생 설계');
  is(A4.find.indexOf(strip(dz20.sit)) >= 0 && /예산 — /.test(A4.find) && /심사 결과에 따릅니다/.test(A4.find),
     '「20대 사회초년생 설계」 → 설계 가이드 상황·반드시·예산이 표 그대로 + 심사 문구');
  const A5 = await askCard('중입자 치료비 얼마');
  is(/6,005만 4,900원/.test(A5.find) && /영수증 실측 사례/.test(A5.find),
     '「중입자 치료비」 → 영수증 금액(원)을 <b>억·만</b>으로(6,005만 4,900원) · 실측 사례라 밝힌다 (4번)');
  const A6 = await askCard('암 화법');
  is(/📕 암 화법/.test(A6.find) && /내 통장에서/.test(A6.find) && /설계사 — 「/.test(A6.find),
     '「암 화법」 → 실전화법서 장 — 여는 질문 · 대화 스크립트');
  const A7 = await askCard('비과세');
  /* 책에도 「요건」 이 적혀 있어 그 낱말로 재면 우리가 붙인 줄이 빠져도 초록입니다 — 붙인 줄 그대로 봅니다 (8번) */
  is(/비과세/.test(A7.find) && /세금은 요건 충족 시의 이야기입니다 — 판단은 세무 전문가에게 맡기십시오/.test(A7.find),
     '세금 이야기에는 「요건 충족 시 · 판단은 세무 전문가에게」 를 붙인다 (2번)');
  is([A1, A2, A3, A4, A5, A6, A7].every(z => !/&lt;\/?b&gt;|<\/?b>/.test(z.find)), '표 속 꼬리표가 글자로 안 찍힌다');
  /* 읽는 것은 <b>한 번</b> — 열 번 물어도 파일마다 한 번 (7번) */
  for (const q of ['위암', '탈장 수술 몇종', '연금 화법', '신혼부부', '배액술']) await askCard(q);
  const many = Object.keys(GOT).filter(u => GOT[u] > 1);
  is(Object.keys(GOT).length === 8 && many.length === 0, '아카데미 일곱 · 화법서 하나를 <b>한 번씩만</b> 받았다 — ' +
     Object.keys(GOT).length + '개' + (many.length ? ' ← 두 번 이상: ' + many.join(', ') : ''));
  /* 읽는 중에 물으면 「읽는 중」 → 다 읽으면 그 물음에 이어서 */
  const PEND = await f.evaluate(async () => {
    JV_EXT.st = ''; JV_EXT.A = {}; JV_EXT.fp = null; JV_EXT.pend = '';
    jLog.innerHTML = ''; ask('이미 보험 많이 들었어요');
    const w = (document.querySelector('#jLog .j-find') || {}).textContent || '';
    await new Promise(r => setTimeout(r, 3000));
    const cards = [].slice.call(document.querySelectorAll('#jLog .msg.j'));
    const last = cards[cards.length - 1];
    return { w, n: cards.length, last: last ? last.textContent : '' };
  });
  is(/읽는 중입니다/.test(PEND.w), '다 읽기 전에 물으면 <b>「읽는 중」</b> 이라고 한다 — 없다고 하지 않는다 (1번)');
  is(PEND.n === 2 && /다 읽었습니다/.test(PEND.last) && /이미 보험 많이 들었어요/.test(PEND.last),
     '다 읽으면 기다리시던 물음에 <b>이어서</b> 띄운다 — 카드 ' + PEND.n);
  const FAIL = await f.evaluate(async () => {
    const keep = { st: JV_EXT.st, why: JV_EXT.why };
    JV_EXT.st = 'fail'; JV_EXT.why = '실전화법서(HTTP 404)';
    jLog.innerHTML = ''; ask('협심증 화법');
    const t = (document.querySelector('#jLog .j-find') || {}).textContent || '';
    JV_EXT.st = keep.st; JV_EXT.why = keep.why;
    return t;
  });
  is(/못 읽었습니다/.test(FAIL) && /HTTP 404/.test(FAIL) && /없다는 뜻이 아닙니다/.test(FAIL), '못 읽었으면 <b>못 읽었다고</b> · 까닭까지 · 「없다」 고 하지 않는다');

  sec('[11] 🛠 <b>시키면 한다</b> — 지식 말고 일 (판 X271 · 사장님 말씀 「지식말고 다른것도 자비스가 할수 있도록 해」)');
  await p.evaluate(() => { jvDockEnd(); go('apexmap'); });
  await p.waitForTimeout(500);
  /* 카드를 세우고 단추를 누른다 */
  const actAsk = (q) => f.evaluate(async (q) => { jLog.innerHTML = ''; ask(q); await new Promise(r => setTimeout(r, 250));
    const c = document.querySelector('#jLog .j-act'); return c ? c.textContent : ''; }, q);
  const actPress = (sel, val) => f.evaluate(async ([sel, val]) => {
    const c = document.querySelector('#jLog .j-act'); if (!c) return '(카드 없음)';
    if (val != null){ const v = c.querySelector('.ja-v'); if (!v) return '(적는 칸 없음)'; v.value = val; }
    const b = c.querySelector(sel); if (!b) return '(단추 없음 ' + sel + ')';
    b.click(); await new Promise(r => setTimeout(r, 400));
    return (document.querySelector('#jLog .j-act') || {}).textContent || ''; }, [sel, val]);
  const HOWA = await f.evaluate((L) => L.filter(q => jvAct(q)), HOWTO.concat(['뭘 챙겨야 해?', '뇌졸중 화법', '보험료가 너무 비싸요', '홍길동 연락처 알려줘']));
  is(HOWA.length === 0, '묻는 말 · 자료 찾는 말에 <b>일 카드가 안 선다</b>' + (HOWA.length ? ' ← ' + HOWA.join(' · ') : ''));
  /* ① 체크 — 누르기 전엔 안 바뀐다 · 누르면 바뀐다 */
  const CK = await p.evaluate(() => { const it = vaPickOf('전화', CK_ITEMS.day, r => r[1]); const m = ckLoad('day'); if (m[it[0]]) ckToggle('day', it[0]); return it[0]; });
  const c1 = await actAsk('전화 체크해줘');
  const ck0 = await p.evaluate((k) => !!ckLoad('day')[k], CK);
  is(/이대로 할까요/.test(c1) && !ck0, '「전화 체크해줘」 → 확인 카드 · <b>누르기 전엔 아무것도 안 바뀐다</b>');
  const c1b = await actPress('.ja-ok');
  const ck1 = await p.evaluate((k) => !!ckLoad('day')[k], CK);
  is(ck1 && /✅/.test(c1b) && /체크했습니다/.test(c1b), '「✅ 이대로 하기」 → 실행 체크판에 <b>실제로 체크</b> — 「' + c1b.replace(/^🛠[^—]+— [^✅⚠]+/, '').slice(0, 40) + '」');
  await actAsk('전화 체크 풀어줘');
  const c2 = await actPress('.ja-no');
  is(/취소했습니다/.test(c2) && await p.evaluate((k) => !!ckLoad('day')[k], CK), '「취소」 → 아무것도 안 바뀐다');
  /* ② 값이 모자라면 카드 안에서 묻는다 */
  const c3 = await actAsk('체크해줘');
  const c3b = await actPress('.ja-put', '전화');
  is(/어떤 것을 체크할까요/.test(c3) && /전화 — 이대로 할까요/.test(c3b), '「체크해줘」 → 카드 안에서 「어떤 것을?」 → 적으면 확인으로');
  /* ③ 고객 연락 기록 — 못 담으면 못 담았다고 */
  await actAsk('홍길동 통화했어');
  const c4 = await actPress('.ja-ok');
  is(/⚠/.test(c4) && /기록하지 못했습니다/.test(c4) && !/✅/.test(c4), '서버가 없으면 「✅」 가 아니라 <b>「기록하지 못했습니다」</b> (1번)');
  /* 담기는 서버를 흉내 냅니다 — 진짜 서버로는 안 나갑니다 */
  const ROWS = await p.evaluate(() => { window.__ins = []; window.__keepC = window.osClient;
    window.osClient = function(){ return { from: function(t){ return {
      insert: function(r){ window.__ins.push({t:t, r:r}); return Promise.resolve({}); },
      update: function(r){ window.__ins.push({t:t, r:r}); return { eq: function(){ return Promise.resolve({}); } }; } }; } }; };
    return true; });
  const c5a = await actAsk('홍길동 통화했어 다음 주 증권 보기로');
  const HD = await f.evaluate(() => { const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(); const bub = c && c.querySelector('.bub');
    return { head: bub && bub.firstChild ? bub.firstChild.textContent : '', wait: /읽는 중/.test(c ? c.textContent : '') }; });
  is(/^「고객 연락 기록 남기기」/.test(HD.head) && !HD.wait, '답의 머리가 <b>시키신 일</b>을 말한다(찾은 것의 머리가 덮지 않음) · 「읽는 중」 안 섬 — 「' + HD.head + '」');
  const c5 = await actPress('.ja-ok');
  const TC = await p.evaluate(() => (cmOf('c0').touch || [])[0] || {});
  is(/홍길동님/.test(c5a) && /✅/.test(c5) && /전화 기록을 남겼습니다/.test(c5) && TC.how === '전화' && TC.note === '다음 주 증권 보기로',
     '「홍길동 통화했어 다음 주 증권 보기로」 → 확인에 <b>홍길동님</b> · 고객 365일에 전화 기록 · 들은 말까지');
  await actAsk('홍길동님 만나고 왔어');
  await actPress('.ja-ok');
  is((await p.evaluate(() => (cmOf('c0').touch || [])[0].how)) === '만남', '「만나고 왔어」 는 <b>만남</b>으로 적는다');
  /* ④ 다음 할 일 — 날짜까지 */
  const TM = await p.evaluate(() => { const d = new Date(cmToday() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); });
  await actAsk('홍길동 다음 할 일 내일 증권 전달');
  const c6 = await actPress('.ja-ok');
  const NX = await p.evaluate(() => cmNextAll('c0').map(x => x.what + '@' + x.due));
  is(NX.indexOf('증권 전달@' + TM) >= 0 && /✅/.test(c6), '「홍길동 다음 할 일 내일 증권 전달」 → 다음 할 일 <b>증권 전달 · ' + TM + '</b>');
  const DU = await p.evaluate(() => [vaDueOf('증권 전달'), vaDueOf('3일 뒤 전화'), vaDueOf('모레 방문')]);
  is(DU[0].due === '' && DU[0].rest === '증권 전달' && /^\d{4}-\d{2}-\d{2}$/.test(DU[1].due) && DU[1].rest === '전화' && DU[2].rest === '방문',
     '날짜를 말 안 하면 <b>지어 넣지 않는다</b> · 「3일 뒤」 · 「모레」 를 읽는다');
  const c6b = await actAsk('홍길동 다음 할 일 증권 전달');
  const c6c = await actPress('.ja-ok');
  is(/오늘로 잡았습니다/.test(c6c) || /이미 그 날에 잡혀/.test(c6c), '날짜가 없으면 「오늘로 잡았습니다」 라고 <b>밝힌다</b>');
  /* ⑤ 두 분이 걸리면 단추를 안 세우고 되묻는다 */
  await p.evaluate(() => { OSC.list.push({id:'c2', name_masked:'홍○○', advisor_id:'me', created_at:'2026-08-03'}); cmRealSet('c2', '홍길순'); });
  const c7 = await actAsk('홍길 통화했어');
  const okBtn = await f.evaluate(() => !!document.querySelector('#jLog .j-act .ja-ok'));
  const c7b = await actPress('.ja-put', '홍길순');
  is(/2분이 걸립니다/.test(c7) && !okBtn && /홍길순님/.test(c7b), '「홍길」 → 두 분이 걸리면 <b>확인 단추 없이 되묻고</b>, 이름을 적으면 그분으로');
  await p.evaluate(() => { OSC.list = OSC.list.filter(c => c.id !== 'c2'); });
  /* ⑥ 전화 — 걸지 않고 걸 단추만 · 저장 0 */
  /* 저장은 고객 표(saved_reports)만 셉니다 — 물음 기록(suggestions)은 저장이 아닙니다 */
  const n0 = await p.evaluate(() => window.__ins.filter(x => x.t === 'saved_reports').length);
  await actAsk('성춘향한테 전화해줘');
  const TEL = await f.evaluate(() => { const a = document.querySelector('#jLog .j-act a.ja-tel'); return { href: a ? a.getAttribute('href') : '', ok: !!document.querySelector('#jLog .j-act .ja-ok') }; });
  is(TEL.href === 'tel:01099990000' && !TEL.ok && (await p.evaluate(() => window.__ins.filter(x => x.t === 'saved_reports').length)) === n0,
     '「성춘향한테 전화해줘」 → <b>📞 걸기 단추</b>만 (누르는 것은 사람) · 저장 0');
  /* ⑦ 위험한 숫자는 안 담는다 */
  const h0 = await p.evaluate(() => (HELP.list || []).length);
  await actAsk('도와줄 것 01012345678 확인');
  const c8 = await actPress('.ja-ok');
  is(/숫자가 길게/.test(c8) && (await p.evaluate(() => (HELP.list || []).length)) === h0, '전화번호 같은 긴 숫자는 <b>안 담는다</b>(vaRisky 그대로)');
  /* ⑧ 회사 표에 남는 물음도 가린다 */
  const LG = await p.evaluate(() => window.__ins.filter(x => x.t === 'suggestions').map(x => x.r.title));
  is(LG.length > 0 && LG.every(t => t.indexOf('홍길동') < 0 && t.indexOf('성춘향') < 0), '회사 표(jarvis_q)에 남는 물음은 고객 이름을 가린다 — ' + LG.slice(-2).join(' · '));
  await p.evaluate(() => { window.osClient = window.__keepC; });
  /* ⑨ 열어 달라면 연다 — 자비스는 아래 띠로.
     ★ 열린 화면(체크판 · 두뇌)이 <b>제 자료를 읽는 것</b>은 그 화면의 몫이라 [8] 의 「바깥 주소 0」 에서 뺍니다 */
  const OUT0 = outside.length;
  await actAsk('체크판 열어');
  await p.waitForTimeout(500);
  const OP = await p.evaluate(() => ({ tab: currentTab(), dock: document.body.classList.contains('jv-dock') }));
  is(OP.tab === 'ckboard' && OP.dock, '「체크판 열어」 → 실행 체크판이 열리고 자비스는 아래 띠로');
  await p.evaluate(() => { jvDockEnd(); go('apexmap'); });
  await p.waitForTimeout(500);
  /* ⑩ 자료 만들기 — AI 를 쓰므로 누르셔야 */
  await p.evaluate(() => { window.__brain = 0; window.__keepB = window.brainAsk; window.brainAsk = function(){ window.__brain++; }; });
  const c9 = await actAsk('40대 가장 상담 자료 만들어줘');
  const b0 = await p.evaluate(() => window.__brain);
  await actPress('.ja-ok'); await p.waitForTimeout(600);
  const B1 = await p.evaluate(() => ({ n: window.__brain, tab: currentTab(), dock: document.body.classList.contains('jv-dock') }));
  is(/이대로 할까요/.test(c9) && b0 === 0 && B1.n === 1 && B1.tab === 'brain' && B1.dock,
     '「자료 만들어줘」 → 누르기 전엔 AI 0번 · 누르면 두뇌에게 한 번 · 자비스는 띠로 남는다');
  await p.evaluate(() => { window.brainAsk = window.__keepB; jvDockEnd(); go('apexmap'); });
  await p.waitForTimeout(500);
  outside.splice(OUT0);
  /* ⑪ 시킨 일에는 AI 를 안 부른다 · 음성 비서도 새 일을 안다 */
  const NA = await f.evaluate(async () => {
    LS.set('map_engine', 'gemini'); LS.set('gproxy', '/api/gemini');
    let n = 0; const keep = window.fetch; window.fetch = function(){ n++; return keep.apply(this, arguments); };
    jLog.innerHTML = ''; ask('전화 체크해줘'); await new Promise(r => setTimeout(r, 300));
    window.fetch = keep; LS.del('gproxy'); LS.del('map_engine');
    const P = window.parent;
    return { n, voice: ['홍길동 통화했어', '홍길동 전화 걸어줘', '홍길동 다음 할 일 내일 증권 전달'].map(t => (P.vaActHit(t, P.vaNorm(t)) || {a:{}}).a.k) };
  });
  is(NA.n === 0, '시키신 일에는 AI 를 안 부른다 — 앱이 알아들었다');
  const HL = await f.evaluate(() => ({ h: jvHello().answer, n: jvActCount(),
    want: window.parent.VA_ACT.filter(a => JV_ACT_SKIP.indexOf(a.k) < 0).length, fb: !!jvAct('피드백 남겨줘') }));
  is(HL.n > 0 && HL.n === HL.want && HL.h.indexOf('일 ' + HL.n + '가지') >= 0, '첫 인사가 시킬 수 있는 일 수를 <b>사전을 세어</b> 말한다 — ' + HL.n + '가지');
  is(!HL.fb, '「피드백」 은 자비스가 안 한다 (판 X277 · 사장님 말씀 「피드백은 필요없고」) — 음성 비서에는 그대로');
  is(NA.voice.join(',') === '연락기록,전화걸기,고객할일', '🎙️ 음성 비서도 같은 사전으로 새 일을 알아듣는다 — ' + NA.voice.join(','));

  sec('[12] ⭐ <b>가장 쉽게 · 모든 담긴 내용</b> (판 X277 · 사장님 말씀 「여기 안에 있는 모든 담긴 내용을 찾고 바로 사용할수 있도록 … 가장 쉬워야만해」)');
  /* 견줄 수는 <b>파일에서 직접</b> 셉니다 */
  const AX = {};
  ['data1','data2','lesson','analysis','health','cases','cases2','disease1','disease2','source'].forEach(n =>
    new Function('window', fs.readFileSync(path.join(ROOT, 'app/보험아카데미/' + n + '.js'), 'utf8'))(AX));
  let wantTalk = 0;
  AX.CURRICULUM.forEach(c => (c.scripts || []).forEach(x => { if (x.q && x.a) wantTalk++; }));
  AX.LESSONS.forEach(l => { if (l.talk && l.talk.q && l.talk.a) wantTalk++; });
  if (AX.HEALTH && AX.HEALTH.talk && AX.HEALTH.talk.q) wantTalk++;
  AX.CASES.forEach(c => (c.script || []).forEach(x => { if (x.q && x.a) wantTalk++; }));
  AX.DISEASE.forEach(d => { if (d.talk && d.talk.q && d.talk.a) wantTalk++; (d.qna || []).forEach(x => { if (x.q && x.a) wantTalk++; }); });
  const wantLesson = AX.CURRICULUM.length + AX.LESSONS.length + AX.ANALYSIS.length;
  const CNT = await f.evaluate(() => ({ talk: jvTalkRows().length, lesson: jvLessonRows().length, slide: (JV_EXT.A.SOURCE || []).length }));
  is(CNT.talk === wantTalk && CNT.lesson === wantLesson && CNT.slide === AX.SOURCE.length,
     '아카데미를 <b>빠짐없이</b> 찾는다 — 화법 ' + CNT.talk + '/' + wantTalk + ' (커리큘럼·1교시·헬스케어·케이스·질병백과) · 강의 ' + CNT.lesson + '/' + wantLesson + ' · 원본 슬라이드 ' + CNT.slide + '/' + AX.SOURCE.length);
  const silbiA = strip(AX.CURRICULUM.map(c => (c.scripts || []).filter(x => /실비 있어서 괜찮아요/.test(x.q))[0]).filter(Boolean)[0].a);
  /* 바로 쓰는 단추를 누르면 무엇을 부르는지 본다 — 본체 함수를 잠깐 갈아 끼웁니다 */
  await p.evaluate(() => { window.__cp = []; window.__op = []; window.__keepCP = window.copyText;
    window.copyText = function(t){ window.__cp.push(t); };
    window.__keepFT = window.fpTalkOpen; window.fpTalkOpen = function(to){ window.__op.push('fp:' + to); };
    window.__keepDZ = window.dzGuideOpen; window.dzGuideOpen = function(to){ window.__op.push('dz:' + to); }; });
  const best = (q) => f.evaluate(async (q) => { jLog.innerHTML = ''; window.__spk = []; const k = window.speak; window.speak = function(t){ window.__spk.push(t); };
    ask(q); await new Promise(r => setTimeout(r, 300)); window.speak = k;
    const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    const b = c && c.querySelector('.jf-best'), more = c && c.querySelector('details.jf-more');
    const xs = c && c.querySelector('details.j-extra');
    return { best: b ? b.textContent : '', nBest: c ? c.querySelectorAll('.jf-best').length : 0,
             moreClosed: more ? !more.open : null, img: b && b.querySelector('.jf-img img') ? b.querySelector('.jf-img img').getAttribute('src') : '',
             nextOut: c ? [].slice.call(c.querySelectorAll('.j-next, .j-more')).filter(e => !e.closest('details')).length : 0,
             xsClosed: xs ? !xs.open : null }; }, q);
  const press = (sel) => f.evaluate(async (sel) => { const b = document.querySelector('#jLog .jf-best ' + sel); if (!b) return false;
    window.__spk = []; const k = window.speak; window.speak = function(t){ window.__spk.push(t); };
    b.click(); await new Promise(r => setTimeout(r, 200)); window.speak = k; return window.__spk.slice(); }, sel);
  const S1 = await best('고객이 실비 있어서 괜찮대');
  is(S1.nBest === 1 && /실비 있어서 괜찮아요/.test(S1.best) && S1.best.indexOf(silbiA) >= 0,
     '「고객이 실비 있어서 괜찮대」 → <b>받는 말 하나가 크게</b> — 아카데미 커리큘럼의 글 그대로');
  is(S1.nextOut === 0, '찾은 것이 굳으면 길의 곁말(그다음 · 이어서 물을 것)은 <b>「도움말 더 보기」 에 접힌다</b>');
  await press('.jr-copy');
  const CP = await p.evaluate(() => window.__cp.slice());
  is(CP.length === 1 && CP[0] === silbiA, '📋 말 복사 → <b>받는 말만</b> 복사(「이렇게 — 」 꼬리표 없이 · 본체 copyText 로)');
  const SP = await press('.jr-say');
  is(SP && SP.length === 1 && SP[0] === silbiA, '🔊 읽어 주기 → 그 말을 읽는다');
  const S2 = await best('암 화법');
  await press('.jr-open'); await p.waitForTimeout(300);
  const S3 = await best('뇌졸중 화법');
  await press('.jr-open'); await p.waitForTimeout(300);
  const OPN = await p.evaluate(() => ({ op: window.__op.slice(), dock: document.body.classList.contains('jv-dock') }));
  is(OPN.op[0] === 'fp:c11' && /^dz:/.test(OPN.op[1] || '') && OPN.dock,
     '「그 자리 열기」 → 화법서 <b>그 장</b>(c11 · 암 화법) · 질병 가이드 <b>그 병</b>으로 바로 · 자비스는 띠로 — ' + OPN.op.join(' · '));
  await p.evaluate(() => { window.copyText = window.__keepCP; window.fpTalkOpen = window.__keepFT; window.dzGuideOpen = window.__keepDZ; jvDockEnd(); go('apexmap'); });
  await p.waitForTimeout(400);
  const S4 = await best('암 치료 3가지 방법 슬라이드');
  const IMG = await f.evaluate(async () => { const im = document.querySelector('#jLog .jf-best .jf-img img'); if (!im) return 0;
    if (!im.complete) await new Promise(r => { im.onload = r; im.onerror = r; setTimeout(r, 3000); }); return im.naturalWidth; });
  is(/암을 치료하는 3가지 방법/.test(S4.best) && /an_001\.jpg$/.test(S4.img) && IMG > 0, '「암 치료 3가지 방법 슬라이드」 → 원본 슬라이드 <b>그림이 그대로</b> 선다 (' + IMG + 'px)');
  is(S4.moreClosed === true, '나머지는 「더 찾은 것 N개」 에 <b>접혀</b> 있다');
  const S5 = await best('필요액 계산');
  is(/필요액 계산 공식/.test(S5.best), '「필요액 계산」 → 아카데미 분석편 강의');
  const S6 = await best('협심증이 뭐예요');
  is(/아카데미 (용어|질병백과)|용어/.test(S6.best.slice(0, 40)), '「…뭐예요」 면 <b>뜻</b>이 맨 위 — 「' + S6.best.slice(0, 30) + '…」');

  /* ★ 열린 덱이 <b>제 글꼴</b>을 받는 것은 그 덱의 몫이라 [8] 의 「바깥 주소 0」 에서 뺍니다 */
  const OUT1 = outside.length;
  sec('[13] 🎞 <b>상담자료 덱</b> — 그 장을 찾고 그 장을 바로 연다 (판 X273 · 사장님 말씀 「응응」 — 판 X277 에서 남은 덱)');
  /* 견줄 수는 <b>색인을 뽑는 자</b>에게 직접 묻습니다 */
  const DK = require(path.join(ROOT, 'scripts/deck-index.js')).build();
  const DJ = await f.evaluate(() => jvDecks().map(d => ({ k: d.k, n: d.slides.length, t0: d.slides[0].t })));
  is(DJ.length === DK.length && DK.every((d, i) => DJ[i] && DJ[i].n === d.slides.length && DJ[i].t0 === d.slides[0].t),
     '덱 다섯의 장을 <b>빠짐없이</b> 찾는다 — ' + DK.map(d => d.n + ' ' + d.slides.length + '장').join(' · '));
  /* ★ 「말 한마디가 4000만원」 만 치면 같은 이름의 <b>시네마틱 스토리</b>(demo_case4000)도 맞습니다 — 둘 다 맞는 답이라
     여기서는 장 이름을 끝까지 칩니다 */
  const D1 = await best('말 한마디가 4,000만 원을 만듭니다');
  is(/말 한마디가 4,000만 원 을 만듭니다/.test(D1.best), '「말 한마디가 4,000만 원을 만듭니다」 → 보장분석 상담자료의 그 장이 맨 위');
  await f.evaluate(() => document.querySelector('#jLog .jf-best .jr-open').click());
  await p.waitForTimeout(3500);
  const J1 = await p.evaluate(() => { const fr = document.getElementById('sangdamFrame'), w = fr && fr.contentWindow;
    const a = w && w.document.querySelector('.slide.active'); return { act: a ? a.id : '', mark: w ? w.__jvJumped : '', tab: currentTab(), dock: document.body.classList.contains('jv-dock') }; });
  is(J1.act === 's5' && J1.mark === 's5' && J1.tab === 'sangdam' && J1.dock, '「이 장 바로 열기」 → 보장분석 상담자료가 열리고 <b>그 장(s5)이 펼쳐진다</b> · 자비스는 띠로 — ' + J1.act);
  await p.evaluate(() => { jvDockEnd(); go('apexmap'); }); await p.waitForTimeout(500);
  await best('좋은 미끼의 5가지 조건');
  await f.evaluate(() => document.querySelector('#jLog .jf-best .jr-open').click());
  await p.waitForTimeout(3500);
  const J2 = await p.evaluate(() => { const fr = document.getElementById('mkTalkFrame'), w = fr && fr.contentWindow;
    const el = w && w.document.getElementById('c4'); return { mark: w ? w.__jvJumped : '', top: el ? Math.round(el.getBoundingClientRect().top) : 9999, tab: currentTab() }; });
  is(J2.mark === 'c4' && J2.top < 200 && J2.top > -50 && J2.tab === 'mikki_talk', '「좋은 미끼의 5가지 조건」 → 미끼상품 화면이 그 마디(c4)까지 굴러간다 — 위에서 ' + J2.top + 'px');
  await p.evaluate(() => { jvDockEnd(); go('apexmap'); }); await p.waitForTimeout(500);
  /* 새 창으로 여는 덱 — 앱이 원래 그렇게 엽니다 */
  const pop = async (q) => {
    await best(q);
    const [w] = await Promise.all([ctx.waitForEvent('page'), f.evaluate(() => document.querySelector('#jLog .jf-best .jr-open').click())]);
    await w.waitForLoadState('load'); await w.waitForTimeout(3000);
    const r = await w.evaluate(() => ({ url: decodeURIComponent(location.pathname), mark: window.__jvJumped || '',
      off: (document.getElementById('gongmu') || {className: ''}).className }));
    await w.close(); return r;
  };
  const W1 = await pop('보험의 기준 선언');
  is(/보험의기준\.html$/.test(W1.url) && W1.mark === '보험의 기준 선언', '「보험의 기준 선언」 → 보험의 기준 덱이 새 창으로 열리고 <b>그 장으로</b> 간다');
  const W2 = await pop('공무원 연금 발표');
  is(/통합상담_APEX\.html$/.test(W2.url) && W2.mark === 'gongmu' && !/\boff\b/.test(W2.off), '「공무원 연금 발표」 → 통합상담 덱이 새 창으로 열리고 그 장(gongmu)이 보인다' +
     (W2.mark === 'gongmu' ? '' : ' ← ' + JSON.stringify(W2)));
  /* 시네마틱 스토리 — 한 파일이 한 장 */
  await best('실비 월세 이야기');
  const [w4] = await Promise.all([ctx.waitForEvent('page'), f.evaluate(() => document.querySelector('#jLog .jf-best .jr-open').click())]);
  await w4.waitForLoadState('load'); const U4 = decodeURIComponent(new URL(w4.url()).pathname); await w4.close();
  is(/demo_silbi\.html$/.test(U4), '「실비 월세 이야기」 → 상담자료 속 <b>시네마틱 스토리</b>(실비 · 월세)가 열린다');
  /* 트랙 안의 장 — 달러 트랙(trackD)의 첫 장으로 가면 그 트랙이 펴지고 연금 트랙은 접혀야 합니다 */
  const DID = 'c1';
  const [w3] = await Promise.all([ctx.waitForEvent('page'), f.evaluate((id) => jvDeckOpen('tonghap', id), DID)]);
  await w3.waitForLoadState('load'); await w3.waitForTimeout(3000);
  const W3 = await w3.evaluate(() => ({ mark: window.__jvJumped || '', d: document.getElementById('trackD').className, w: document.getElementById('trackW').className }));
  await w3.close();
  is(W3.mark === DID && !/\boff\b/.test(W3.d) && /\boff\b/.test(W3.w), '트랙 안의 장(' + DID + ') → <b>달러 트랙으로 바꾸고</b> 그 장으로 (연금 트랙은 접힘)');
  outside.splice(OUT1);

  sec('[14] 🧮 <b>연금 계산 — 말하면 바로</b> (판 X276 · 사장님 말씀 「연금 계산도 말하면 바로 가능하니」 → 「응 만들어줘」)');
  /* 견줄 숫자는 <b>엔진을 직접</b> 돌려 얻습니다 — 자비스가 낸 숫자를 자비스로 견주지 않습니다 */
  const QEB = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'app/pension-engine.js'), 'utf8'))(QEB);
  new Function('window', fs.readFileSync(path.join(ROOT, 'apex-won.js'), 'utf8'))(QEB);
  const QEW = QEB.APEX_WON.txt;
  const engQ = (inp) => { const ok = [], no = []; QEB.PENSION.products.forEach(p => { const r = QEB.PENSION.calc(p, inp);
    (r && r.eligible && r.hasRate && r.yearly > 0 ? ok : no).push(r); }); ok.sort((a, b) => b.monthlyPay - a.monthlyPay); return { ok, no }; };
  const QPP = await f.evaluate(() => [
    jvPenParse('50세 남자 월 50만원 10년납 65세부터 연금 얼마').v,
    jvPenParse('여자 45살, 매달 30만원씩 20년 동안 넣고 60세에 연금 받으면?').v,
    jvPenParse('55세 남성 월 1,000,000원 5년납 70세 개시').v ]);
  is(JSON.stringify(QPP[0]) === JSON.stringify({sex:'남성', age:50, start:65, pay:10, monthly:500000}) &&
     JSON.stringify(QPP[1]) === JSON.stringify({sex:'여성', age:45, start:60, pay:20, monthly:300000}) &&
     JSON.stringify(QPP[2]) === JSON.stringify({sex:'남성', age:55, start:70, pay:5, monthly:1000000}),
     '말에서 값을 읽는다 — 「50세 남자 월 50만원 10년납 65세부터」 · 「여자 45살 매달 30만원씩 20년 동안 60세에」 · 「월 1,000,000원」(원 그대로)');
  const penQ = (q, wait) => f.evaluate(async ([q, wait]) => { jLog.innerHTML = ''; ask(q); await new Promise(r => setTimeout(r, wait || 1500));
    const c = document.querySelector('#jLog .j-pen'); const card = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    return { t: c ? c.textContent.replace(/\s+/g, ' ') : '', best: c && c.querySelector('.jf-best') ? c.querySelector('.jf-best').textContent.replace(/\s+/g, ' ') : '',
             over: c ? c.scrollWidth - c.clientWidth : -1, ai: !!(card && card.querySelector('.j-ai')) }; }, [q, wait]);
  const QE1 = engQ({sex:'남성', age:50, start:65, pay:10, monthly:500000});
  const topQ = QE1.ok[0];
  const QK1 = await penQ('50세 남자 월 50만원 10년납 65세부터 연금 얼마');
  is(QK1.best.indexOf(topQ.p.name) >= 0 && QK1.best.indexOf('매달 ' + QEW(topQ.monthlyPay)) >= 0 && QK1.best.indexOf(QEW(topQ.principal)) >= 0 &&
     QK1.best.indexOf(QEW(topQ.base)) >= 0 && QK1.best.indexOf(QEW(topQ.total100)) >= 0,
     '셈이 <b>계산기 엔진과 한 원도 다르지 않다</b> — ' + topQ.p.name + ' 매달 ' + QEW(topQ.monthlyPay) + ' · 총 납입 ' + QEW(topQ.principal));
  is(QE1.ok.slice(1).every(r => QK1.t.indexOf(r.p.name) >= 0 && QK1.t.indexOf('매달 ' + QEW(r.monthlyPay)) >= 0) &&
     QE1.no.every(r => QK1.t.indexOf(r.p.name) >= 0 && QK1.t.indexOf(r.reason) >= 0),
     '다른 상품 ' + (QE1.ok.length - 1) + '개 · 안 되는 상품 ' + QE1.no.length + '개(엔진이 말한 <b>까닭 그대로</b>)도 같이 선다');
  is(/최저보증 금액 기준입니다/.test(QK1.t) && /물가상승률은 반영하지 않았습니다/.test(QK1.t) && /약관과 보험사 심사 결과에 따릅니다/.test(QK1.t),
     '계산기와 같은 말을 붙인다 — 최저보증 기준 · 물가 미반영 · 약관과 심사 결과 (2번)');
  is(!/NaN|undefined|Infinity/.test(QK1.t) && !/\d{5,}만원/.test(QK1.t), '부서진 숫자 0 · 「50,000만원」 꼴 0 (억·만으로 · 4번)');
  is(QK1.over <= 0, '폰 폭(390)에서 연금 칸이 <b>옆으로 안 넘친다</b> (' + QK1.over + 'px)');
  is(!QK1.ai, '연금 셈에는 AI 를 안 부른다 — 숫자는 엔진만');
  /* 빈 칸 → 채우고 계산하기 */
  const QK2 = await penQ('연금 계산해줘');
  is(/채우고 「계산하기」 를 누르세요/.test(QK2.t) && !QK2.best, '「연금 계산해줘」 → 숫자를 <b>짐작해 넣지 않고</b> 빈 칸을 묻는다');
  const QK2b = await f.evaluate(async () => { const c = document.querySelector('#jLog .j-pen');
    c.querySelector('[data-sex="여성"]').click(); await new Promise(r => setTimeout(r, 50));
    const c2 = document.querySelector('#jLog .j-pen'), set = (k, v) => { c2.querySelector('input[data-k="' + k + '"]').value = v; };
    set('age', 50); set('start', 65); set('pay', 10); set('monthly', 50);
    c2.querySelector('.jp-go').click(); await new Promise(r => setTimeout(r, 1200));
    const b = document.querySelector('#jLog .j-pen .jf-best'); return b ? b.textContent.replace(/\s+/g, ' ') : ''; });
  const QE2 = engQ({sex:'여성', age:50, start:65, pay:10, monthly:500000});
  is(QK2b.indexOf(QE2.ok[0].p.name) >= 0 && QK2b.indexOf('매달 ' + QEW(QE2.ok[0].monthlyPay)) >= 0, '칸을 채우고 「계산하기」 → 그 값으로 셈한다 — ' + QE2.ok[0].p.name + ' ' + QEW(QE2.ok[0].monthlyPay));
  const QK3 = await penQ('여자 45살, 매달 30만원씩 20년 동안 넣고 60세에 연금 받으면?');
  is(/납입 기간\(20년\)이 연금 시작까지 남은 기간\(15년/.test(QK3.t) && !QK3.best, '안 되는 조합은 <b>왜 안 되는지 숫자로</b> — 납입 20년 · 남은 15년');
  const QK4 = await penQ('월 50 10년 넣으면 연금 얼마 나와 50세 여자 65세부터');
  is(/「월 50」 은 단위가 없어 만원으로 읽었습니다/.test(QK4.t), '「월 50」 처럼 단위가 없으면 만원으로 읽고 <b>그렇게 읽었다고</b> 적는다 (1번)');
  const QK5 = await penQ('50세 남자 월 50만원 10년납 65세부터 스타트로 연금 얼마');
  const stQ = QE1.no.filter(r => r.p.id === 'im_start')[0];
  is(QK5.t.indexOf('「PRO변액연금 스타트」 은 이 조건으로 안 됩니다 — ' + stQ.reason) >= 0, '말씀하신 상품이 안 되면 <b>엔진이 말한 까닭</b>을 적고 되는 상품을 보인다');
  const QNP = await f.evaluate(() => ['연금 화법', '연금 상담 하려면?', '재무설계 계산기 어떻게 써?', '국민연금은 노후의 전부가 될 수 없다', '연금 계산기 어디 있어?'].filter(q => jvPenWant(q)));
  is(QNP.length === 0, '연금 이야기 · 계산기 쓰는 법 물음에는 연금 칸이 <b>안 선다</b>' + (QNP.length ? ' ← ' + QNP.join(' · ') : ''));
  await p.evaluate(() => { window.__cp2 = []; window.__keepCP2 = window.copyText; window.copyText = function(t){ window.__cp2.push(t); }; });
  await penQ('50세 남자 월 50만원 10년납 65세부터 연금 얼마');
  await f.evaluate(async () => { document.querySelector('#jLog .j-pen .jp-copy').click(); await new Promise(r => setTimeout(r, 100)); });
  const QCP2 = await p.evaluate(() => { window.copyText = window.__keepCP2; return window.__cp2.slice(); });
  is(QCP2.length === 1 && QCP2[0].indexOf(topQ.p.name + ' — 65세부터 매달 ' + QEW(topQ.monthlyPay)) >= 0 && /최저보증 금액 기준/.test(QCP2[0]),
     '📋 결과 복사 — 카톡에 붙일 글에도 「최저보증 기준 · 약관과 심사」 가 같이 간다');
  is(/값은 넘어가지 않습니다/.test(QK1.t), '「재무설계 계산기 열기」 는 값이 안 넘어간다고 <b>밝힌다</b>');
  const QPG = PENGOT.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
  is(QPG['pension-engine.js'] === 1 && QPG['apex-won.js'] === 1, '연금 엔진 · 돈 글자는 <b>한 번씩만</b> 받는다 — ' + JSON.stringify(QPG));

  sec('[8] 🧼 꺾쇠 0 · 콘솔 오류 0 · 바깥 주소 0');
  const tags = [C1, K1, T1, Z1, Z4, Z7].filter(x => /&lt;\/?[a-z]/i.test(x.html)).length;
  is(tags === 0, '답에 꺾쇠가 글자로 찍히지 않는다');
  is(errs.length === 0, '콘솔 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));
  is(outside.length === 0, '바깥 주소를 부르지 않았다' + (outside.length ? ' ← ' + outside.slice(0, 2).join(' ') : ''));

  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '곳이 어긋났습니다' : '✓ 자비스가 길이 아니라 값을 찾아 내놓습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
