/* 🤖 <b>자비스가 앱에 있는 것으로 길을 짜는가</b> (판 X220)

   사장님 말씀 2026-10-26 — 「자비스는, 기존에 내게 있는 프로그램 메뉴를
   짜집어서 어떤것을 물어보든 기존 시스템을 활용해서 방법을 자세하게
   알려줄수 있는 것으로 만들고 메뉴는 모두 안보이게 만들고 정확한 안내
   방향성을 만들어주는 것으로 변경하고 시스템의 디테일이 어떤지 다양한
   질문들을 통해 확인해봐」.

   ── 고치기 전에 재어 보니 ─────────────────────────────────────────
     · 「고객 등록은 어디서 해?」 → 상관없는 화면 <b>열 개</b>(펀드관리·주식관리…)
     · 「청구 서류 어떻게 받아?」 → 「지인 8주 성장 프로그램」
     · 「보장분석 어떻게 해?」 → 「화면 안쪽까지는 제가 아직 모릅니다」
     · 가는 길을 TABS 갈래(「증권 분석」 칸)로 말했는데, 서랍 기본이 간편이라
       그 칸이 <b>안 보였습니다</b>.
     · 자비스 모드를 열면 화면 107개를 늘어놓은 <b>지도</b>가 먼저 섰습니다.

   ── 여기서 지키는 것 ───────────────────────────────────────────
     [1] 자비스 모드에 <b>메뉴(지도)가 안 보인다</b> — 지도 칸·지도 단추 0
     [2] 여러 가지 물음이 <b>맞는 화면</b>으로 간다 (물음표는 아래 QA 한 곳)
     [3] 모르는 것은 <b>모른다</b>고 한다 — 걸음 0 · 지어낸 화면 0
     [4] 가는 길이 <b>앱의 지금 자리</b>다 — 🧰 도구의 묶음 이름을 <b>앱에 물어</b> 견준다
     [5] 「자세히」 줄이 <b>사용가이드에 실제로 있는 글</b>이다 (지어내지 않는다)
     [6] 「이 화면 열기」 를 누르면 <b>그 화면으로 간다</b>
     [7] AI 에게도 <b>앱 안내(근거)</b>를 쥐여 보낸다 — 이번 물음에만
     [8] 꺾쇠 0 · 콘솔 오류 0
     [9] 🧑‍🔧 (판 X221 · 사장님 말씀 「뭐 들어가야 된다가 아니라 각자 할일을 시켜서
         답변을 한번에 띄울수 있도록」) — 그 일을 맡은 곳(음성 비서의 명령 사전
         VA_ACT)에 <b>직접 시켜</b> 지금 값을 읽어 오고, 앱 안내 · AI 의견과
         <b>한 카드</b>에 띄우나. 저장하는 일은 시키지 않나 · 안 읽은 자료를
         서버에서 새로 받지 않나(7번) · 「아직 안 읽었다」 고 하나(1번)
   ★ 이름은 「홍길동」 (3번). 서버를 부르지 않는다 (7번) — fetch 는 가로챈다. */

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9048;
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

/* 물음표 — 물음 · 그 답의 걸음에 <b>반드시</b> 들어야 할 화면 (앞 셋 안에).
   ★ 화면 id 만 적습니다. 가는 길 · 이름은 앱에 묻습니다 (5번). */
const QA = [
  ['고객 등록은 어디서 해?',                 ['clients']],
  ['청구 서류 어떻게 받아?',                 ['claims']],
  ['보장분석 어떻게 해?',                     ['bojang']],
  ['증권 PDF 를 받았어',                      ['bojang']],
  ['고객이 보험을 정리하고 싶대',             ['frmake', 'contracts']],
  ['아침에 뭐부터 해?',                       ['home']],
  ['연금 상담 하려면?',                       ['finance']],
  ['팀원 실적은 어디서 봐?',                  ['report']],
  ['보험료 비교해달래',                       ['onecmp']],
  ['폰에 앱 설치 어떻게 해',                  ['phone_app']],
  ['실비 계산 어떻게 해',                     ['med_silbi']],
  ['교통사고 났대',                           ['car_fault']],
  ['법인 대표 상담',                          ['biz_diag']],
  ['DB 배정 받은 거 어디서 봐',               ['crm']],
  ['약속 잡힌 고객 일정 넣기',                ['mycal']],
  ['신상품 나왔는데 뭐 권하지',               ['mikki']],
  ['질병코드 찾기',                           ['ref_kcd']],
  ['재무설계 계산기 어떻게 써?',              ['finance']],
  ['인스타 올릴 거 만들기',                   ['insta']],
  ['거절한 고객 다시 연락하고 싶어',          ['rjnews']],
  ['화면이 이상해',                           ['health']],
  ['상속 증여 상담',                          ['finance']]
];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  CM.loaded=true; CM.meta={}; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  OSC.list=[{id:'c0',name:'홍길동',advisor_id:'me',stage:'AP',created_at:'2026-08-01'}];
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};

(async () => {
  console.log('자비스 — 앱에 있는 것으로 길을 짜는가 (판 X220)');
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  /* 바깥 주소는 부르지 않는다 (7번) */
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return rt.continue();
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
  /* 키 없이 — 사장님이 제일 많이 만나시는 상태. AI 는 [7] 에서 따로 잽니다 */
  await f.evaluate(() => { ['gproxy','proxy','apikey','gkey'].forEach(k => LS.del(k)); modeLabel(); });

  sec('[1] 🙈 <b>메뉴(지도)가 안 보인다</b> — 사장님 말씀 「메뉴는 모두 안보이게」');
  const V = await f.evaluate(() => {
    const vis = el => !!(el && el.offsetParent);
    const cnt = sel => [].slice.call(document.querySelectorAll(sel)).filter(vis).length;
    return { stage: vis(document.getElementById('stage')), leaves: cnt('a.leaf'), cards: cnt('.card'),
             mapBtn: ['bFit','bOpen','bShut','b3d','zIn','zOut'].filter(id => vis(document.getElementById(id))),
             jarvis: vis(document.getElementById('jarvis')), ask: vis(document.getElementById('ask')),
             hello: (document.querySelector('#jLog .msg.j .bub') || {}).textContent || '',
             app: kb().src.app, menuN: Object.keys(MENU).length };
  });
  is(!V.stage && V.leaves === 0 && V.cards === 0,
     '지도 무대 · 화면 칸 · 가지 칸이 <b>하나도 안 보인다</b> — 칸 ' + V.leaves + ' · 가지 ' + V.cards);
  is(V.mapBtn.length === 0, '지도 단추(한눈에 · 다 열기 · 다 닫기 · 입체 · 크게/작게)가 <b>안 보인다</b>' +
     (V.mapBtn.length ? ' ← ' + V.mapBtn.join(', ') : ''));
  is(V.jarvis && V.ask, '대신 <b>묻는 칸과 자비스</b>가 바로 선다');
  is(V.app, '앱 안에서 열리면 <b>앱의 표를 읽었다</b> (사용가이드 · 도구 묶음)');
  is(V.hello.indexOf(String(V.menuN)) >= 0,
     '첫 인사가 아는 화면 수를 <b>세어</b> 말한다 (5번) — 「' + V.hello.slice(0, 40) + '…」');
  const AM = await p.evaluate(() => {
    const L = amissList(), btn = document.getElementById('amissBtn');
    return { n: L.length, shown: !!(btn && btn.offsetParent), ids: L.map(x => x.id) };
  });
  is(AM.n === 0 ? !AM.shown : AM.shown,
     AM.n === 0 ? '자비스가 모르는 화면이 없으면 <b>메뉴 목록 단추도 안 선다</b> (빈 알약도 0)'
                : ('자비스가 모르는 ' + AM.n + '개는 모른다고 말한다 — ' + AM.ids.slice(0, 5).join(' ')));

  sec('[2] 🧭 <b>여러 가지 물음</b>이 맞는 화면으로 간다 — ' + QA.length + '가지');
  const R = await f.evaluate((QA) => QA.map(([q, want]) => {
    const r = offline(q);
    const ids = (r.steps || []).map(s => s.id).filter(Boolean);
    return { q, want, how: r.how, ids, head: ids.slice(0, 3), all: ids,
             txt: [r.answer || ''].concat((r.steps || []).map(s => s.do || ''), r.next || [], r.real || '', r.tip || '').join(' ') };
  }), QA);
  R.forEach(x => {
    const ok = x.want.every(id => x.head.indexOf(id) >= 0 || (x.want.length > 1 && x.all.indexOf(id) >= 0));
    is(ok, '「' + x.q + '」 → ' + (x.head.join(' · ') || '(걸음 없음)') + ' [' + x.how + ']' +
       (ok ? '' : ' ← 들어야 할 것 ' + x.want.join(', ')));
  });
  const ST = await f.evaluate(() => { const r = offline('보장분석 하고 제안서까지 만들고 싶어');
    return { how: r.how, ids: (r.steps || []).map(s => s.id) }; });
  is(ST.how === 'stitch' && ST.ids.indexOf('bojang') >= 0 && ST.ids.indexOf('ai_prop') >= 0 &&
     ST.ids.indexOf('bojang') < ST.ids.indexOf('ai_prop'),
     '두 가지를 한 번에 물으면 <b>이어 붙인다</b> — 보장분석 → 제안서 (' + ST.how + ' · ' + ST.ids.join(' ') + ')');

  sec('[3] 🙅 모르는 것은 <b>모른다</b>고 한다 (1번)');
  const N = await f.evaluate(() => { const r = offline('김치찌개 끓이는 법');
    return { how: r.how, n: (r.steps || []).length, a: r.answer || '' }; });
  is(N.how === 'none' && N.n === 0 && /찾지 못했습니다/.test(N.a),
     '「김치찌개 끓이는 법」 → 걸음 0 · 「찾지 못했습니다」 — 아무 화면이나 늘어놓지 않는다');
  const ghost = await f.evaluate((QA) => {
    const out = [];
    QA.forEach(([q]) => (offline(q).steps || []).forEach(s => { if (s.id && !MENU[s.id]) out.push(s.id); }));
    return out;
  }, QA);
  is(ghost.length === 0, '가리키는 화면은 <b>모두 있는 화면</b>이다 — 없는 것 ' + ghost.length);

  sec('[4] 🗺 가는 길이 <b>앱의 지금 자리</b>다 — 🧰 도구 묶음을 앱에 물어 견준다');
  const W = await f.evaluate(() => {
    const P = window.parent, out = [];
    ['bojang', 'claims', 'mikki', 'org', 'finance', 'crm', 'clients', 'me'].forEach(id => {
      const w = jvWay(id).txt, it = P.navItemOf(id);
      let want = '';
      const tb = (P.TB || []).filter(x => x.id === id)[0] || (id === 'me' ? { e: '🙋', t: '나' } : null);
      if (tb) want = tb.e + ' ' + tb.t;
      else { const g = P.NAV_WHEN_G.filter(x => x.k === P.NAV_WHEN[id])[0]; want = g ? (g.e + ' ' + g.t) : ''; }
      out.push({ id, w, want, title: it ? it.title : '', tabsG: MENU[id].g });
    });
    return out;
  });
  /* 등급에 막힌 화면(navItemOf 가 null)은 「막혔다」 고 해야 맞다 — 견본 계정은 fp 입니다 */
  W.forEach(x => is(x.title ? (!!x.want && x.w.indexOf(x.want) >= 0 && x.w.indexOf(x.title) >= 0) : /등급/.test(x.w),
    x.title ? (x.id + ' — 「' + x.want + '」 › 「' + x.title + '」 를 말한다')
            : (x.id + ' — 이 계정 등급에선 안 열린다 → <b>막혔다고</b> 말한다')));
  /* TABS 갈래 이름은 <b>간편 서랍에서 안 보인다</b> — 그 이름으로 「칸」 을 가리키면 없는 칸이다 */
  const oldG = W.filter(x => x.tabsG && x.w.indexOf('「' + x.tabsG + '」 칸') >= 0 && x.tabsG !== x.want.split(' ').slice(1).join(' '));
  is(oldG.length === 0, '안 보이는 갈래 이름(「증권 분석」 칸 같은)으로 <b>안 보낸다</b>' +
     (oldG.length ? ' ← ' + oldG.map(x => x.id + ':' + x.tabsG).join(', ') : ''));
  const LK = await f.evaluate(() => {
    const P = window.parent, keep = P.navItemOf;
    P.navItemOf = function(id){ return id === 'bojang' ? null : keep(id); };
    const w = jvWay('bojang');
    P.navItemOf = keep;
    return w;
  });
  is(LK.locked && /등급/.test(LK.txt), '등급에 막힌 화면은 <b>막혔다고</b> 말한다 — 「' + LK.txt.slice(0, 30) + '…」');

  sec('[5] 📘 「자세히」 줄이 <b>사용가이드에 실제로 있는 글</b>이다');
  const D = await f.evaluate(() => {
    const P = window.parent, all = [];
    P.manSecs().forEach(s => { try { all.push(kbTxt(s.fn())); } catch (e) {} });
    const big = all.join(' ').replace(/\s+/g, '');
    const out = {};
    ['bojang', 'clients', 'crm', 'org', 'claims', 'contracts'].forEach(id => {
      const L = jvLines(id);
      /* 걸음 상자는 「제목 — 본문」 으로 붙였으니 두 쪽을 따로 찾는다 */
      const fake = L.filter(t => t.split(' — ').some(part => big.indexOf(part.replace(/\s+/g, '')) < 0));
      out[id] = { n: L.length, fake: fake.length, first: L[0] || '' };
    });
    return out;
  });
  Object.keys(D).forEach(id => is(D[id].n >= 3 && D[id].fake === 0,
    id + ' — 자세한 줄 ' + D[id].n + '개 · 사용가이드에 없는 글 ' + D[id].fake + ' (「' + D[id].first.slice(0, 26) + '…」)'));

  sec('[6] 👆 「이 화면 열기」 를 누르면 <b>그 화면으로 간다</b>');
  await f.evaluate(() => { jLog.innerHTML = ''; ask('질병코드 찾기'); });
  await p.waitForTimeout(500);
  const UI = await f.evaluate(() => {
    const last = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    const a = last && last.querySelector('.st-b a[data-id]');
    const way = last && last.querySelector('.st-way');
    const html = last ? last.innerHTML : '';
    return { id: a ? a.getAttribute('data-id') : '', way: way ? way.textContent : '',
             tags: /&lt;\/?[a-z]/i.test(html) };
  });
  is(UI.id === 'ref_kcd' && /가는 길/.test(UI.way), '답에 <b>가는 길</b>과 「이 화면 열기」 가 선다 — ' + UI.id);
  is(!UI.tags, '답에 <b>꺾쇠가 글자로</b> 찍히지 않는다');
  await f.evaluate(() => { const a = [].slice.call(document.querySelectorAll('#jLog .st-b a[data-id]')).pop(); a.click(); });
  await p.waitForTimeout(600);
  const now = await p.evaluate(() => currentTab());
  is(now === 'ref_kcd', '눌렀더니 앱이 <b>그 화면</b>으로 갔다 — ' + now);

  sec('[7] 🤖 AI 에게도 <b>앱 안내(근거)</b>를 쥐여 보낸다 — 이번 물음에만');
  await p.evaluate(() => go('apexmap'));
  await p.waitForTimeout(700);
  const AI = await f.evaluate(async () => {
    LS.set('map_engine', 'gemini'); LS.set('gproxy', '/api/gemini');
    const sent = [], keep = window.fetch;
    window.fetch = function(u, o){
      sent.push(JSON.parse(o.body));
      const out = JSON.stringify({ answer: '보장분석부터 보세요.', steps: [{ id: 'bojang', do: 'PDF 를 올린다' }], real: '', next: [] });
      return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: out }] } }] }),
                                          { status: 200, headers: { 'Content-Type': 'application/json' } }));
    };
    ask('증권 PDF 를 받았어');
    await new Promise(r => setTimeout(r, 400));
    const card = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    const one = { way: !!card.querySelector('.st-way'), ai: ((card.querySelector('.j-ai') || {}).textContent || '') };
    ask('그다음은?');
    await new Promise(r => setTimeout(r, 400));
    window.fetch = keep; LS.del('gproxy'); LS.del('map_engine');
    const c1 = sent[0] ? sent[0].contents : [], c2 = sent[1] ? sent[1].contents : [];
    const t = m => ((m || {}).parts || []).map(x => x.text).join('');
    return { n: sent.length,
             g1: /\[앱 안내/.test(t(c1[c1.length - 1])) && /bojang/.test(t(c1[c1.length - 1])) && /가는 길/.test(t(c1[c1.length - 1])),
             old: c2.length >= 3 ? /\[앱 안내/.test(t(c2[0])) : null,
             log: chatLog.some(m => /\[앱 안내/.test(m.content)), one };
  });
  is(AI.n === 2 && AI.g1, '물음에 <b>앱 안내</b>(상황 · 화면 id · 가는 길)가 붙어 간다');
  is(AI.old === false && !AI.log, '지난 물음에는 안 붙는다 — 대화 기록에 <b>쌓이지 않는다</b> (회사 서버 10초)');
  is(AI.one.way && /AI 의견/.test(AI.one.ai) && /보장분석부터 보세요/.test(AI.one.ai),
     'AI 가 켜져 있어도 앱 안내(가는 길)가 <b>없어지지 않고</b>, AI 의견이 <b>같은 카드</b>에 붙는다 (판 X221)');

  sec('[9] 🧑‍🔧 <b>각자 할 일을 시켜</b> 답을 한 번에 띄우나 (판 X221)');
  await p.evaluate(() => go('apexmap'));
  await p.waitForTimeout(600);
  const WK = await f.evaluate(async () => {
    const P = window.parent, cnt = { w: 0, gb: 0, cal: 0, cli: 0 };
    /* 저장하는 일 · 서버를 부르는 일이 불리면 센다 — 하나라도 불리면 빨간불 */
    const keep = {};
    ['ckToggle', 'hpDone', 'vaHelpAdd'].forEach(k => { keep[k] = P[k]; P[k] = function(){ cnt.w++; }; });
    keep.gbLoad = P.gbLoad; P.gbLoad = function(){ cnt.gb++; };
    keep.calLoad = P.calLoad; P.calLoad = function(){ cnt.cal++; };
    keep.osLoadClients = P.osLoadClients; P.osLoadClients = function(){ cnt.cli++; };
    const gbWas = !!(P.GB && P.GB.loaded);
    if (P.GB) P.GB.loaded = false;
    const run = async (q) => {
      jLog.innerHTML = ''; ask(q); await new Promise(r => setTimeout(r, 300));
      const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
      return { work: ((c && c.querySelector('.j-work')) || {}).textContent || '', all: c ? c.textContent : '' };
    };
    const own = k => { const a = P.vaActOf(k); const r = a.run({}); return typeof r === 'string' ? r : r.say; };
    const left = await run('뭐 남았어'), leftSay = own('할일');
    const bday = await run('고객 생일 챙기기'), bdaySay = own('오늘고객');
    const miss = await run('놓친 팀원 누구야');
    const doIt = await run('전화 체크해줘');
    const doIt2 = await run('홍길동 심사 잊지말고 챙겨야 돼');     /* 「도와줄 것 적어 두기」 의 말버릇 */
    const plain = await run('질병코드 찾기');
    Object.keys(keep).forEach(k => { P[k] = keep[k]; });
    if (P.GB) P.GB.loaded = gbWas;
    return { left, leftSay, bday, bdaySay, miss, doIt, plain, cnt };
  });
  is(WK.left.work.indexOf(WK.leftSay) >= 0,
     '「뭐 남았어」 → 실행 체크판에 <b>시켜서</b> 읽어 온 그대로 — 「' + WK.leftSay.slice(0, 40) + '…」');
  is(WK.bday.work.indexOf(WK.bdaySay) >= 0 && /대신 앱에 시켜서/.test(WK.bday.all),
     '「고객 생일 챙기기」 — 사용가이드엔 없어도 <b>고객 365일에 시켜</b> 지금 값을 띄운다 — 「' + WK.bdaySay.slice(0, 30) + '…」');
  is(/성장판/.test(WK.miss.work) && /0 이라고 하지 않습니다/.test(WK.miss.work),
     '성장판을 아직 안 읽었으면 <b>「아직 안 읽었다」</b> 고 한다 — 0 명이라고 하지 않는다 (1번)');
  is(WK.cnt.gb === 0 && WK.cnt.cal === 0 && WK.cnt.cli === 0,
     '안 읽은 자료를 <b>서버에서 새로 받지 않는다</b> (7번) — 성장판 ' + WK.cnt.gb + ' · 달력 ' + WK.cnt.cal + ' · 고객 ' + WK.cnt.cli);
  is(WK.cnt.w === 0, '「전화 체크해줘」 · 「잊지말고 챙겨야 돼」 같은 <b>저장하는 일은 자비스가 혼자 시키지 않는다</b> — 불린 수 ' + WK.cnt.w);
  is(WK.plain.work === '', '상관없는 물음(질병코드)에는 일꾼이 <b>끼어들지 않는다</b>');

  /* ══ [10] 🪟 여기서 표현하고 바로 본다 (판 X245) ════════════════════

     사장님 말씀 2026-10-29 — 「집어만 주지말고 <b>원하는 내용을 여기서
     표현하고 바로 볼수 있도록</b> 만들자는거야」.

     판 X220·X221 까지는 자비스가 「거기로 가세요」 까지였고, 그 화면을 열면
     <b>자비스가 사라졌습니다.</b> 이제 열어도 아래 띠로 남습니다.
     ★ 「이 화면 열기 ›」 는 <b>그대로 있어야 합니다</b> — 길은 안 지웁니다 (6번).
     ★ 접힌 띠에서 <b>적는 칸이 보여야</b> 합니다 — 처음 지었을 때 머리글이
       넉 줄로 접히며 적는 칸을 띠 밖으로 밀어냈습니다. 그것이 「여기서
       표현하고」 가 막힌 자리입니다.                                      */
  sec('[10] 🪟 <b>여기서 표현하고 바로 본다</b> — 화면을 열어도 자비스가 남나 (판 X245)');
  /* ★★ <b>폰 폭에서 잽니다.</b> 처음에는 컴퓨터 폭(1280)에서만 재다가
       되돌림이 안 울렸습니다 — 머리글이 넉 줄로 접혀 적는 칸을 밀어내는
       것은 <b>폰에서만</b> 생기는 일이기 때문입니다. 자가 안 가 본 자리는
       자가 못 지킵니다 (8번).                                           */
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(600);
  await f.evaluate(() => { try{ jClear(); }catch(e){} ask('고객 등록은 어디서 해?'); });
  await p.waitForTimeout(1800);
  const D0 = await f.evaluate(() => ({
    here: document.querySelectorAll('#jLog .st-here').length,
    open: [].slice.call(document.querySelectorAll('#jLog details.st-more')).filter(d => d.open).length,
    more: document.querySelectorAll('#jLog details.st-more').length,
    link: document.querySelectorAll('#jLog .st-b a').length
  }));
  is(D0.here > 0, '답에 <b>🪟 여기서 보기</b> 가 선다 — ' + D0.here + '개');
  is(D0.link > 0, '「이 화면 열기 ›」 도 <b>그대로 있다</b> — 길은 안 지웁니다 (6번) · ' + D0.link + '개');
  is(D0.more === 0 || D0.open >= 1,
     '첫 걸음의 「이 화면 자세히」 가 <b>펴진 채</b>로 온다 — 접어 두면 한 번 더 눌러야 글이 나옵니다 · 펴짐 '
     + D0.open + ' / ' + D0.more);

  await f.evaluate(() => { const b = document.querySelector('#jLog .st-here'); if (b) b.click(); });
  await p.waitForTimeout(1200);
  const D1 = await p.evaluate(() => {
    const fr = document.getElementById('apexMapFrame');
    const r = fr ? fr.getBoundingClientRect() : null;
    const ap = document.querySelector('.app');
    return { dock: document.body.classList.contains('jv-dock'),
             shut: document.body.classList.contains('jv-shut'),
             full: document.body.classList.contains('apexmap-mode'),
             app: ap ? getComputedStyle(ap).display : 'none',
             top: r ? Math.round(r.top) : -1, h: r ? Math.round(r.height) : -1,
             vh: window.innerHeight, w: window.innerWidth,
             pane: (document.querySelector('.tab-pane.on') || {}).id || '' };
  });
  is(D1.dock && !D1.full, '눌렀더니 자비스가 <b>아래 띠</b>로 내려앉는다 (자비스 모드가 아니다)');
  is(D1.app !== 'none', '그 화면이 <b>실제로 열린다</b> — 앱이 보인다 (' + D1.app + ')');
  is(D1.top + D1.h >= D1.vh - 2 && D1.h > 0 && D1.h < D1.vh / 2,
     '띠가 <b>바닥에 붙어</b> 있고 화면을 안 가린다 — 키 ' + D1.h + 'px / 창 ' + D1.w + '×' + D1.vh);
  const D2 = await f.evaluate(() => {
    const v = e => { if (!e) return null; const r = e.getBoundingClientRect(), st = getComputedStyle(e);
      return (r.width > 1 && r.height > 1 && st.display !== 'none' && st.visibility !== 'hidden')
        ? { h: Math.round(r.height), bottom: Math.round(r.bottom) } : null; };
    return { dock: document.body.classList.contains('dock'),
             say: v(document.getElementById('jSay')), send: v(document.getElementById('jSend')),
             stage: v(document.getElementById('stage')), bar: v(document.querySelector('.bar')),
             vh: window.innerHeight };
  });
  is(!!D2.say && D2.say.bottom <= D2.vh + 2,
     '★★ 접힌 띠에서도 <b>적는 칸이 보인다</b> — 「여기서 표현하고」 가 이 칸입니다 ('
     + (D2.say ? D2.say.h + 'px · 바닥 ' + D2.say.bottom + '/' + D2.vh : '안 보임') + ')');
  is(!!D2.say && D2.say.h >= 44 && !!D2.send && D2.send.h >= 44,
     '그 칸과 보내기가 <b>손가락 바닥 44px</b> — 적는 칸 ' + (D2.say ? D2.say.h : 0)
     + 'px · 보내기 ' + (D2.send ? D2.send.h : 0) + 'px');
  is(!D2.stage && !D2.bar, '띠에서는 지도 무대·머리 띠를 <b>안 띄운다</b>');

  /* ★★ <b>접힌 띠에서 물으면 답이 보여야 합니다.</b>
       접힌 띠는 대화 칸을 감춥니다. 그대로 두면 사장님이 적는 칸에 치고
       보내기를 눌러도 <b>아무 일도 안 일어난 것처럼</b> 보입니다 —
       「여기서 표현하고 <b>바로 볼수 있도록</b>」 이 거기서 막힙니다.
       그래서 물으면 띠가 <b>저절로 펴집니다</b> (판 X245).                */
  await f.evaluate(() => { try{ window.parent.jvDockOpen(false); }catch(e){}
    const t = document.getElementById('jSay'); if (t) t.value = '청구 서류 어떻게 받아?';
    const b = document.getElementById('jSend'); if (b) b.click(); });
  await p.waitForTimeout(1800);
  const DA = await p.evaluate(() => ({ shut: document.body.classList.contains('jv-shut'),
    h: Math.round(document.getElementById('apexMapFrame').getBoundingClientRect().height) }));
  /* ★ 「눈에 들어왔나」 를 <b>굴림 자리로 재지 않습니다</b> — 대화가 길면
       마지막 줄이 아직 안 굴러와 있어 재는 때에 따라 들쭉날쭉합니다.
       버그는 <b>대화 칸이 통째로 감춰지는 것</b>이었으니 그것을 바로 묻습니다
       (헛것을 잡는 자는 안 잡는 자보다 나쁩니다 · 8번).                  */
  const DB2 = await f.evaluate(() => {
    const lg = document.getElementById('jLog');
    const last = document.querySelector('#jLog .msg:last-child');
    return { shown: !!lg && getComputedStyle(lg).display !== 'none',
             h: lg ? Math.round(lg.getBoundingClientRect().height) : 0,
             grown: !!last && last.getBoundingClientRect().height > 1,
             txt: last ? (last.innerText || '').replace(/\s+/g, ' ').slice(0, 34) : '' };
  });
  is(!DA.shut && DB2.shown && DB2.h > 1 && DB2.grown,
     '★★ 접힌 띠에서 물으면 <b>저절로 펴져 답이 선다</b> — 띠 ' + DA.h + 'px · 대화 칸 '
     + DB2.h + 'px · 「' + DB2.txt + '…」 (안 펴지면 보내기를 눌러도 아무 일 없어 보입니다)');

  /* ★★ <b>화면을 통째로 덮는 자리에서도 띠가 보여야 합니다.</b>
       처음에 z-index 를 260 으로 두었더니 계산기(#financeScreen 300) 위에서
       <b>밑에 깔려 사라졌습니다</b> — 사장님께는 「자비스가 꺼졌다」 로
       보입니다. ✕ 로 닫으실 수 있으니, 말없이 사라지는 쪽보다 떠 있는
       쪽이 낫습니다 (1번 · 6번). 모달(덮개 9300)은 위에 있는 것이 맞습니다. */
  await p.evaluate(() => { try{ jvDock('finance'); }catch(e){} });
  await p.waitForTimeout(1500);
  const DF = await p.evaluate(() => {
    const fr = document.getElementById('apexMapFrame');
    const top = document.elementFromPoint(Math.round(window.innerWidth / 2), window.innerHeight - 20);
    return { full: document.body.classList.contains('finance-mode'),
             onTop: !!(top && (top.id === 'apexMapFrame' || (top.closest && top.closest('#apexMapScreen')))),
             what: top ? (top.id || top.className || top.tagName) : '(없음)',
             z: fr ? getComputedStyle(fr.parentElement || fr).zIndex : '-' };
  });
  is(DF.full && DF.onTop,
     '★★ 계산기처럼 <b>화면을 통째로 덮는 자리에서도</b> 띠가 맨 위에 남는다 — 덮은 것 「'
     + String(DF.what).slice(0, 24) + '」');
  await p.evaluate(() => { try{ jvDock('clients'); }catch(e){} });
  await p.waitForTimeout(1200);

  await f.evaluate(() => { const u = document.getElementById('jUp'); if (u) u.click(); });
  await p.waitForTimeout(700);
  const D3 = await p.evaluate(() => {
    const fr = document.getElementById('apexMapFrame');
    return { shut: document.body.classList.contains('jv-shut'),
             h: Math.round(fr.getBoundingClientRect().height) };
  });
  is(!D3.shut && D3.h > D1.h, '⌃ 를 누르면 <b>펴진다</b> — ' + D1.h + 'px → ' + D3.h + 'px');
  await f.evaluate(() => { const x = document.getElementById('jDockX'); if (x) x.click(); });
  await p.waitForTimeout(700);
  const D4 = await p.evaluate(() => ({ dock: document.body.classList.contains('jv-dock'),
    fab: !!(document.getElementById('osVaFab')) }));
  is(!D4.dock, '✕ 를 누르면 <b>띠가 닫힌다</b> — 따라다니지 않는다');

  /* ★ 글로도 못 박혔나 — px 는 글꼴을 탑니다. 이 자는 바깥을 막아
       웹폰트를 못 받는데 라이브는 받아서 2~5px 낮게 재집니다
       (판 X239 · 판 X243 에서 두 번 데인 자리 · 8번).                   */
  const JSRC = fs.readFileSync(path.join(ROOT, 'app', 'apex-map.html'), 'utf8');
  is(/#ask\{[^}]*min-height:44px/.test(JSRC),
     '<b>묻는 칸(#ask)</b>에 44px 이 <b>글로</b> 적혀 있다 — 라이브에서 29px 이던 자리');
  is(/#jSay\{[^}]*min-height:44px/.test(JSRC),
     '<b>이어 묻는 칸(#jSay)</b>에도 44px 이 <b>글로</b> 적혀 있다 — 라이브에서 40px 이던 자리');
  is(/body\.jv-dock[^{]*#osVaFab\{display:none/.test(fs.readFileSync(path.join(ROOT,'app','index.html'),'utf8')),
     '띠가 떠 있는 동안 <b>떠다니는 옛 쪽창은 안 띄운다</b> — 떠다니는 자비스가 둘이 되지 않게 (5번)');

  sec('[8] 🔇 조용히 터지지 않았나');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource/i.test(x));
  is(real.length === 0, '콘솔 오류 없음' + (real.length ? (' ← ' + real[0]) : ''));

  await ctx.close(); await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '개 어긋남') : '\n자비스 길 안내 점검 통과');
  process.exit(bad ? 1 : 0);
})();
