/* 🔎 <b>자비스가 길이 아니라 그 안의 값을 찾아 내놓는가</b> (판 X266)

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
  console.log('자비스 — 길이 아니라 그 안의 값을 찾아 내놓는가 (판 X266)');
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const outside = [];
  await ctx.route('**://**', rt => { const u = rt.request().url();
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
  const H = await f.evaluate((L) => L.map(q => ({ q, F: jvFind(q).filter(x => (x.rows || []).length || x.wait).map(x => x.k) })), HOWTO);
  const ghost = H.filter(x => x.F.length);
  is(ghost.length === 0, '찾은 값 0 — ' + (ghost.length ? ghost.map(x => x.q + '→' + x.F.join('/')).join(' · ') : '스물네 가지 모두 길로'));
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

  sec('[8] 🧼 꺾쇠 0 · 콘솔 오류 0 · 바깥 주소 0');
  const tags = [C1, K1, T1].filter(x => /&lt;\/?[a-z]/i.test(x.html)).length;
  is(tags === 0, '답에 꺾쇠가 글자로 찍히지 않는다');
  is(errs.length === 0, '콘솔 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));
  is(outside.length === 0, '바깥 주소를 부르지 않았다' + (outside.length ? ' ← ' + outside.slice(0, 2).join(' ') : ''));

  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '곳이 어긋났습니다' : '✓ 자비스가 길이 아니라 값을 찾아 내놓습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
