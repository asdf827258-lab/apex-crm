/* 🧠 <b>자비스 + 윤시현의 두뇌</b> (판 X371 · X372)

   사장님 말씀 2026-11-06 —
   「자비스 이제 윤시현의 두뇌랑 합쳐서, 어떤 것이든 정말 자세하게 도와주고 쓸수 있도록 업그레이딩 하고 싶은데」
   고르신 것 — 자세한 답은 「늘 같이」 · 두뇌 화면은 「자비스로 흡수」.

   ── 여기서 지키는 것 ──────────────────────────────────────────
     [1] 묻는 길은 <b>하나</b>(본체 brainAnswer) — 두뇌 화면(brainAsk)도 자비스도 그 길로 묻는다 (5번)
     [2] 자비스에 물으면 위에는 앱 안내, 밑에는 <b>두뇌의 자세한 답</b>이 <b>같은 카드</b>에 선다 ·
         두뇌 지식이 지침에 들어간다 · AI 는 <b>한 번만</b>(자비스 따로의 AI 의견 0 · 7번)
     [3] ★★ AI 로 <b>고객 실명 · 전화번호가 안 간다</b> (3번) — 앱이 찾은 보험 자료는 근거로 간다 ·
         앱 안내는 <b>이번 물음에만</b> 붙는다(지난 대화에 쌓이지 않는다)
     [4] 안 붙이는 물음 — 인사 · 「도구」 · 시키신 일 · 고맙다는 말 · 뜻 없는 글자 → AI 0
     [5] AI 가 꺼져 있으면 <b>지어내지 않고</b> 「연결하면 자세히 답한다」 고 한 번만 말한다 (1번)
     [6] 두뇌가 실패하면 그 까닭을 말하고, 앱 안내는 그대로 선다 · 「생각 중」 이 풀린다
     [7] 쓰는 단추 — 복사 · Word · PPT · ⭐ · 발표자료가 본체의 <b>그 함수</b>를 부른다 (5번)
     [8] 📚 두뇌 지식 창 — 본체의 brainKbGet · brainKbSet 하나로 읽고 적는다
     [9] 흡수 — 두뇌는 메뉴에서 숨고(찾기 · 자비스로 연다) · 두뇌 화면엔 묻는 칸 대신 「자비스에게 묻기」 ·
         자비스에서 물은 것도 두뇌의 지난 대화에 선다
     [10] 앱 밖에서 열면 두뇌가 없다 — 두뇌 단추 · 자리를 세우지 않는다 (1번)
     [11] 콘솔 오류 0 · 바깥 주소 0
     [12] 🔎 라이브 AI 로 물어 보고 고친 것 (판 X378 · 「자비스에 두뇌지식 돌려보고 업그레이드해」) —
          ★★ 받은 적 없는 출처(「현장 가이드 기준」)를 지어 붙이지 말라 · 가린 이름을 채우지 말라 · 「오늘 전화 순서」 엔
          우리 DB 숫자(이름 없이)를 다 쥐여 주고, 못 받았으면 못 받았다고 쥐여 준다 (1번 · 3번)
     [13] 🧠 두뇌 창에서 다 한다 — ⭐ 모범 답안 보기 · 지우기 · 켜고 끄기 셋 · 두뇌 도구 여섯(전화 순서 · 컨설팅 ·
          발표자료 · 지난 대화 · 로고 · 다른 AI) — 고치는 곳은 본체의 그 함수 하나 (5번)
   ★ 이름은 「홍길동」 (3번).                                                     */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9371;
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
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const MAP = fs.readFileSync(path.join(ROOT, 'app/apex-map.html'), 'utf8');

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'윤설계',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  CM.loaded=true; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  OSC.list=[{id:'c0',name_masked:'홍○○',advisor_id:'me',stage:'AP',created_at:'2026-08-01',phone:'010-1234-5678'}];
  try{ cmRealSet('c0','홍길동'); }catch(e){}
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};
const MD = '## 결론\n첫 마디는 **질문**으로 엽니다.\n\n| 단계 | 할 말 |\n|---|---|\n| 1 | 요즘 어떠세요 |\n| 2 | 가장 걱정되는 것은 |\n\n> ⚠️ 확정 수익 표현은 쓰지 않습니다.\n\n[이미지: 상담 흐름도]';

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const BASE = 'http://127.0.0.1:' + PORT;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const outside = new Set();
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (u.indexOf(BASE) === 0 && !/\/api\//.test(u)) return rt.continue();
    outside.add(u.split('/').slice(0, 3).join('/')); return rt.abort(); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.evaluate(SEED); await p.waitForTimeout(400);
  /* 가짜 AI — 본체의 callAI 하나만 바꿉니다. 보낸 지침 · 글을 그대로 받아 둡니다 */
  await p.evaluate((MD) => {
    window.__sent = []; window.__fail = false; window.aiReady = function(){ return true; };
    window.callAI = function(sys, user, n, gen){ window.__sent.push({ sys, user, gen });
      return new Promise((res, rej) => setTimeout(() => window.__fail ? rej(new Error('Gemini 한도에 걸렸습니다')) : res(MD), 60)); };
    try { localStorage.removeItem('apex_brain_kb'); } catch(e){}
    brainKbSet('★시험지식★ 첫 마디는 늘 질문으로'); BRAIN.hist = [];
    go('apexmap');
  }, MD);
  await p.waitForTimeout(2500);
  const f = p.frame({ url: /apex-map\.html/ });
  await f.evaluate(() => { ['gproxy','proxy','apikey','gkey','map_engine'].forEach(k => LS.del(k)); TTS.on = false; });
  /* 화면을 여는 동안 받는 글꼴(판 X353)은 세지 않습니다 — <b>물은 뒤에</b> 밖으로 나간 것만 셉니다 (check-jvhud 와 같은 자) */
  outside.clear();
  const askQ = async (q) => f.evaluate(async (q) => {
    while (busy) await new Promise(r => setTimeout(r, 30));
    const n0 = window.parent.__sent.length; let nf = 0; const kf = window.fetch; window.fetch = function(){ nf++; return kf.apply(this, arguments); };
    ask(q); await new Promise(r => setTimeout(r, 120));
    while (busy) await new Promise(r => setTimeout(r, 30));
    await new Promise(r => setTimeout(r, 60)); window.fetch = kf;
    const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(), s = c.querySelector('.j-brain');
    const sent = window.parent.__sent.slice(n0);
    return { q, n: sent.length, nf, gen: sent.map(x => x.gen).join(','), sys: sent.map(x => x.sys).join(' '), user: sent.map(x => x.user).join(' '),
             brain: !!s, off: !!(s && s.classList.contains('off')), txt: s ? s.innerText.replace(/\s+/g, ' ') : '',
             table: !!(s && s.querySelector('.jb-md table')), acts: s ? [].map.call(s.querySelectorAll('[data-bact]'), x => x.getAttribute('data-bact')).join(',') : '',
             kb: !!(s && s.querySelector('[data-bkb]')), ai: !!c.querySelector('.j-ai'),
             way: !!(c.querySelector('.steps, .st-way, .j-find, .j-work') || /[가-힣]/.test((c.querySelector('.bub') || {}).textContent || '')),
             wait: !!(s && s.querySelector('.jb-wait')), busy };
  }, q);

  sec('[1] 묻는 길은 <b>하나</b> — 본체 brainAnswer (5번)');
  const bodyOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? i + 4000 : j); };
  const bAsk = bodyOf(IDX, 'brainAsk'), bAns = bodyOf(IDX, 'brainAnswer');
  is(!!bAns && /callAI\(brainSys\(\)/.test(bAns), '본체에 묻는 길(brainAnswer)이 있고, 지침은 brainSys 하나다');
  is(/brainAnswer\(/.test(bAsk) && !/callAI\(/.test(bAsk), '두뇌 화면(brainAsk)도 그 길로 묻는다 — 따로 AI 를 부르지 않는다');
  is(/P\.brainAnswer\(|BP\.brainAnswer\(/.test(MAP) && !/윤시현 사업단장의 제2의 두뇌/.test(MAP), '자비스는 본체의 길을 부른다 — 두뇌 지침을 따로 짓지 않는다');

  sec('[2] 자비스에 물으면 <b>같은 카드</b>에 앱 안내 + 두뇌의 자세한 답');
  const A = await askQ('홍길동 고객 첫 상담 어떻게 열지?');
  is(A.brain && !A.off && /윤시현의 두뇌 · 자세히/.test(A.txt) && /첫 마디는 질문으로 엽니다/.test(A.txt), '두뇌의 답이 「윤시현의 두뇌 · 자세히」 로 선다');
  is(A.table, '두뇌의 표가 표로 그려진다 — 글자 그대로(| --- |) 찍히지 않는다');
  is(A.way, '위의 앱 안내(어디서 · 무엇을)는 그대로 선다');
  is(A.n === 1 && A.gen === 'brain' && A.nf === 0 && !A.ai, 'AI 는 <b>한 번</b>(두뇌) — 자비스 따로의 AI 의견 0 (부름 ' + A.n + ' · 자비스 fetch ' + A.nf + ')');
  is(/★시험지식★/.test(A.sys), '두뇌 지식(사장님이 넣은 것)이 지침에 들어간다');
  is(!A.wait && !A.busy, '답이 서면 「쓰는 중」 이 풀린다');
  is(/사진 자리 — 상담 흐름도/.test(A.txt), '사진 자리 줄은 이 창에서 못 넣으니 글로 남긴다(눌러도 안 되는 단추 0)');

  sec('[3] ★★ AI 로 고객 실명 · 전화번호 0 (3번) · 근거는 이번 물음에만');
  is(A.user.indexOf('홍길동') < 0 && A.user.indexOf('010-1234-5678') < 0, '보낸 글에 실명 · 전화번호 0');
  is(/\[앱 안내/.test(A.user), '앱 안내(화면 · 가는 길)를 근거로 쥐여 보낸다');
  const A2 = await askQ('그다음엔 뭐라고 말해?');
  is(/\[직전 대화 맥락\]/.test(A2.user) && (A2.user.match(/\[앱 안내/g) || []).length <= 1, '이어 물으면 지난 대화는 붙고, 지난 앱 안내는 <b>쌓이지 않는다</b>');
  const K = await askQ('뇌졸중 화법');
  is(/\[앱 자료/.test(K.user) && /뇌졸중/.test(K.user), '앱이 찾은 보험 자료를 근거로 보낸다 — 앱의 글에서 출발하게');
  const hist = await p.evaluate(() => BRAIN.hist.map(t => ({ q: t.q, from: t.from })));
  is(hist.length === 3 && hist.every(t => t.from === 'jarvis') && hist[0].q.indexOf('홍길동') < 0, '자비스에서 물은 것도 두뇌의 대화(BRAIN.hist)에 — 가린 물음으로 ' + hist.length + '줄');

  sec('[4] 안 붙이는 물음 → AI 0');
  for (const q of ['안녕', '도구', 'asdf', '전화 체크해줘', '고마워']) {
    const r = await askQ(q);
    is(r.n === 0 && !r.brain && r.nf === 0, '「' + q + '」 — 두뇌 0 · AI 0');
  }

  sec('[5] AI 가 꺼져 있으면 지어내지 않는다 (1번)');
  await p.evaluate(() => { window.aiReady = function(){ return false; }; });
  const O1 = await askQ('반론 처리 화법 알려줘'), O2 = await askQ('종신보험 설명 화법');
  is(O1.n === 0 && O1.off && /AI 를 연결하면/.test(O1.txt), '「AI 를 연결하면 두뇌가 자세히 답합니다」 — 한 줄로 밝힌다');
  is(O2.n === 0 && !O2.brain, '그 말은 <b>한 번만</b> — 물을 때마다 되풀이하지 않는다');
  await p.evaluate(() => { window.aiReady = function(){ return true; }; });

  sec('[6] 두뇌가 실패하면');
  await p.evaluate(() => { window.__fail = true; });
  const F = await askQ('보장분석 상담 화법');
  await p.evaluate(() => { window.__fail = false; });
  is(F.brain && /한도에 걸렸습니다/.test(F.txt) && /앱 안내는 그대로/.test(F.txt), '까닭을 말하고 「위의 앱 안내는 그대로 쓰셔도 됩니다」');
  is(F.way && !F.busy, '앱 안내는 그대로 서고 「생각 중」 이 풀린다');

  sec('[7] 쓰는 단추 — 본체의 <b>그 함수</b>를 부른다 (5번)');
  is(A.acts === 'copy,word,ppt,deck,star' && A.kb, '복사 · Word · PPT · 발표자료 · ⭐ · 두뇌 지식 — ' + A.acts);
  const ACT = await f.evaluate(async () => {
    const P = window.parent, got = [], keep = {};
    ['copyText', 'brainExportWord', 'brainExportPpt', 'brainStar', 'bdMake'].forEach(k => { keep[k] = P[k]; P[k] = function(){ got.push(k + ':' + [].slice.call(arguments, 0, 1).join('').slice(0, 20)); }; });
    const s = document.querySelector('#jLog .j-brain [data-bact]').closest('.j-brain');
    ['copy', 'word', 'ppt', 'star', 'deck'].forEach(k => s.querySelector('[data-bact="' + k + '"]').click());
    await new Promise(r => setTimeout(r, 200));
    const tab = P.currentTab();
    Object.keys(keep).forEach(k => { P[k] = keep[k]; });
    return { got, tab };
  });
  is(ACT.got.length === 5 && /^copyText:## 결론/.test(ACT.got[0]) && ACT.got[1] === 'brainExportWord:0' && ACT.got[2] === 'brainExportPpt:0' && ACT.got[3] === 'brainStar:0',
     '복사는 그 답 글을 · Word · PPT · ⭐ 는 그 대화 줄(0번)로 — ' + ACT.got.join(' | '));
  is(/^bdMake:## 결론/.test(ACT.got[4]) && ACT.tab === 'brain', '「발표자료로」 는 그 답으로 장표를 짜고, 장표가 서는 두뇌 화면을 연다');
  await p.evaluate(() => go('apexmap')); await p.waitForTimeout(1500);

  sec('[8] 📚 두뇌 지식 창 — 본체 한 곳에서 읽고 적는다');
  const KB = await f.evaluate(async () => {
    const P = window.parent, btn = document.getElementById('brainBtn');
    jvBrainBox();
    const shown = document.getElementById('bKb').value, open = document.getElementById('brainBox').classList.contains('on');
    document.getElementById('bKb').value = '★바꾼지식★';
    document.getElementById('bSave').click();
    return { vis: !!btn && !btn.hidden, shown, open, saved: P.brainKbGet(), closed: !document.getElementById('brainBox').classList.contains('on') };
  });
  is(KB.vis, '앱 안에서는 「🧠 두뇌 지식」 단추가 선다');
  is(KB.open && /★시험지식★/.test(KB.shown), '창을 열면 두뇌에 넣어 둔 지식이 그대로 보인다');
  is(KB.saved === '★바꾼지식★' && KB.closed, '저장하면 본체(brainKbSet)에 적힌다 — 두뇌 화면과 같은 글');

  sec('[9] 흡수 — 메뉴에서 숨고, 두뇌 화면엔 「자비스에게 묻기」');
  const AB = await p.evaluate(() => {
    let hide = null; TABS.forEach(g => (g.items || []).forEach(t => { if (t.id === 'brain') hide = !!t.hide; }));
    go('brain'); const d = document.getElementById('dynPane');
    const th = (document.getElementById('brainThread') || {}).textContent || '';
    return { hide, noQ: !d.querySelector('#brainQ'), jv: !!d.querySelector('button[onclick*="apexmap"]'), th: /첫 상담 어떻게 열지/.test(th) };
  });
  is(AB.hide === true, '두뇌는 메뉴에서 숨는다(찾기 칸 · 자비스로 연다)');
  is(AB.noQ && AB.jv, '두뇌 화면에 묻는 칸 대신 「🛰 자비스에게 묻기」 — 묻는 곳은 하나');
  is(AB.th, '자비스에서 물은 것이 두뇌의 지난 대화에 선다(Word · PPT · ⭐ 를 거기서도)');

  sec('[12] 🔎 라이브 AI 로 물어 보고 고친 것 (판 X378)');
  const SY = await p.evaluate(() => { const t = brainSys(); return { src: /받은 적 없는 출처를 지어 붙이지 않는다/.test(t), mask: /가린 이름[^\n]*지어내지 않는다/.test(t), gem: !/어디서 나온 숫자인지 괄호로 밝힌다/.test(BX_GEM) && /받은 글에 없는 숫자/.test(BX_GEM) }; });
  is(SY.src, '두뇌 지침 — 받은 적 없는 출처(「현장 가이드 기준」 같은 것)를 지어 붙이지 않는다');
  is(SY.mask, '두뇌 지침 — 가린 이름(홍*동)을 채워 이름을 지어내지 않는다 (라이브에서 「홍길동 고객님」 으로 불렀습니다)');
  is(SY.gem, 'Gemini 규칙 넷째 — 「괄호로 밝힌다」 만 두지 않고 받은 글에 없는 숫자 · 출처를 막는다');
  await p.evaluate(() => { window.__crmKeep = window.brainCrmCtx; window.__crmMode = []; window.brainCrmCtx = function(m){ window.__crmMode.push(m || ''); return ''; }; });
  const D1 = await askQ('오늘 전화 순서 짜줘'), D2 = await askQ('반론 처리 화법 다시');
  const MODES = await p.evaluate(() => window.__crmMode.slice());
  is(D1.n === 1 && MODES[0] === 'full', '「오늘 전화 순서」 는 우리 DB 숫자를 <b>다</b>(full) 달라고 한다 — ' + MODES.join(','));
  is(/\[우리 DB — 이번 물음에는 DB 통합 CRM 숫자를 받지 못했습니다/.test(D1.user), '숫자를 못 받았으면 「못 받았다 · 지어내지 말라」 를 쥐여 보낸다 (라이브에서 시간표를 지어냈습니다)');
  is(MODES[1] === '' && !/\[우리 DB — 이번 물음에는/.test(D2.user), 'DB 와 상관없는 물음엔 그 말을 안 붙인다 (헛것 0 · 8번)');
  await p.evaluate(() => { window.brainCrmCtx = function(){ return '[지금 우리 DB — 시험]\n- 오늘 손댈 사람 3명\n\n'; }; });
  const D3 = await askQ('오늘 전화 순서 다시 짜줘');
  is(/오늘 손댈 사람 3명/.test(D3.user) && !/받지 못했습니다/.test(D3.user), '숫자를 받았으면 그 숫자를 보내고 「못 받았다」 는 안 붙인다');
  await p.evaluate(() => { window.brainCrmCtx = window.__crmKeep; });

  sec('[13] 🧠 두뇌 창에서 다 한다 (판 X378)');
  const BX = await f.evaluate(async () => {
    const P = window.parent, o = {};
    P.bxSet([{ q:'첫 상담 여는 법', a:'질문으로 엽니다', at:'2026-11-06' }, { q:'반론 처리', a:'안 바꾸셔도 되면', at:'2026-11-06' }]);
    ['geminix','know','polish'].forEach(k => P.bxOptSet(k, k === 'geminix'));
    jvBrainBox();
    o.rows = document.querySelectorAll('#bBx .bx-r').length; o.n = (document.getElementById('bBxN') || {}).textContent;
    document.querySelector('#bBx [data-bxdel="0"]').click();
    o.after = P.bxGet().length; o.rows2 = document.querySelectorAll('#bBx .bx-r').length; o.left = (P.bxGet()[0] || {}).q;
    o.opts = [].map.call(document.querySelectorAll('#bOpts [data-bopt]'), b => b.getAttribute('data-bopt')).join(',');
    document.querySelector('#bOpts [data-bopt="polish"]').click();
    o.polish = P.bxOpt('polish', false); o.polishOn = document.querySelector('#bOpts [data-bopt="polish"]').classList.contains('on');
    document.querySelector('#bOpts [data-bopt="polish"]').click(); o.polish2 = P.bxOpt('polish', false);
    o.tools = [].map.call(document.querySelectorAll('#brainBox [data-btool]'), b => b.getAttribute('data-btool')).join(',');
    const cp = []; const kc = P.copyText; P.copyText = function(t){ cp.push(t); };
    document.querySelector('#brainBox [data-btool="gpt"]').click(); P.copyText = kc;
    o.gpt = cp.length === 1 && /윤시현의 두뇌/.test(cp[0]) && !/sk-ant|AIza/.test(cp[0]);
    const n0 = P.__sent.length;
    document.querySelector('#brainBox [data-btool="call"]').click();
    o.closed = !document.getElementById('brainBox').classList.contains('on');
    await new Promise(r => setTimeout(r, 120)); while (busy) await new Promise(r => setTimeout(r, 30));
    o.called = P.__sent.length - n0; o.callQ = /전화 순서/.test((P.__sent[P.__sent.length - 1] || {}).user || '');
    jvBrainBox(); document.querySelector('#brainBox [data-btool="consult"]').click();
    await new Promise(r => setTimeout(r, 700));
    o.tab = P.currentTab(); o.consult = !!P.document.getElementById('dynPane') && /고객 컨설팅/.test(P.document.getElementById('dynPane').textContent);
    o.closed2 = !document.getElementById('brainBox').classList.contains('on');
    return o;
  });
  is(BX.rows === 2 && /2/.test(BX.n), '⭐ 모범 답안이 창에 선다 — ' + BX.rows + '개 (본체 bxGet 그대로)');
  is(BX.after === 1 && BX.rows2 === 1 && BX.left === '반론 처리', '✕ 를 누르면 본체(bxDel)에서 지워지고 창도 따라온다');
  is(BX.opts === 'geminix,know,polish', '켜고 끄기 셋 — 두뇌 화면의 그 셋 그대로 (' + BX.opts + ')');
  is(BX.polish === true && BX.polishOn && BX.polish2 === false, '누르면 본체(bxOptSet)에 켜지고 · 다시 누르면 꺼진다');
  is(BX.tools === 'call,consult,deck,thread,logo,gpt', '두뇌 도구 여섯 — ' + BX.tools);
  is(BX.gpt, '「다른 AI 로 가져가기」 는 본체의 그 지침 글을 복사한다(열쇠 0)');
  is(BX.closed && BX.called === 1 && BX.callQ, '「우리 DB로 오늘 전화 순서」 는 창을 닫고 자비스가 그 물음을 두뇌에게 묻는다');
  is(BX.closed2 && BX.tab === 'brain' && BX.consult, '「고객 컨설팅」 은 그 칸이 있는 두뇌 화면을 연다 — 메뉴에서 숨었어도 길이 있다');
  await p.evaluate(() => go('apexmap')); await p.waitForTimeout(1500);

  sec('[10] 앱 밖에서 열면 두뇌가 없다 (1번)');
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message));
  const OUT1 = [...outside];
  await p2.goto(BASE + '/app/apex-map.html', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1200);
  outside.clear(); OUT1.forEach(u => outside.add(u));
  const SA = await p2.evaluate(async () => { ['gproxy','proxy','apikey','gkey','map_engine'].forEach(k => LS.del(k)); TTS.on = false;
    ask('반론 처리 화법 알려줘'); await new Promise(r => setTimeout(r, 300));
    return { btn: document.getElementById('brainBtn').hidden, slot: !!document.querySelector('#jLog .j-brain'), host: !!jvBrainHost() }; });
  is(SA.btn && !SA.slot && !SA.host, '두뇌 단추 · 자리를 세우지 않는다');

  sec('[11] 콘솔 오류 · 바깥 주소');
  is(errs.length === 0, '콘솔 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' | ') : ''));
  is(outside.size === 0, '바깥 주소 0' + (outside.size ? ' ← ' + [...outside].join(' ') : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '✗ ' + bad + '개 — 자비스와 두뇌가 어긋났습니다' : '✓ 모두 통과');
  process.exit(bad ? 1 : 0);
})();
