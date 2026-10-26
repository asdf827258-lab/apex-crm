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
    ask('그다음은?');
    await new Promise(r => setTimeout(r, 400));
    window.fetch = keep; LS.del('gproxy'); LS.del('map_engine');
    const c1 = sent[0] ? sent[0].contents : [], c2 = sent[1] ? sent[1].contents : [];
    const t = m => ((m || {}).parts || []).map(x => x.text).join('');
    return { n: sent.length,
             g1: /\[앱 안내/.test(t(c1[c1.length - 1])) && /bojang/.test(t(c1[c1.length - 1])) && /가는 길/.test(t(c1[c1.length - 1])),
             old: c2.length >= 3 ? /\[앱 안내/.test(t(c2[0])) : null,
             log: chatLog.some(m => /\[앱 안내/.test(m.content)) };
  });
  is(AI.n === 2 && AI.g1, '물음에 <b>앱 안내</b>(상황 · 화면 id · 가는 길)가 붙어 간다');
  is(AI.old === false && !AI.log, '지난 물음에는 안 붙는다 — 대화 기록에 <b>쌓이지 않는다</b> (회사 서버 10초)');

  sec('[8] 🔇 조용히 터지지 않았나');
  const real = errs.filter(x => !/favicon|net::ERR|Failed to load resource/i.test(x));
  is(real.length === 0, '콘솔 오류 없음' + (real.length ? (' ← ' + real[0]) : ''));

  await ctx.close(); await b.close(); srv.close();
  console.log(bad ? ('\n✗ ' + bad + '개 어긋남') : '\n자비스 길 안내 점검 통과');
  process.exit(bad ? 1 : 0);
})();
