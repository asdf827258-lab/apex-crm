/* 🪵 <b>자비스 새 판이 그림대로 섰나</b> (판 X360)

   사장님 말씀 2026-11-04 — 「자비스 목각 버전으로 우선 만들자」 → 「응 그림에 그린쪽으로 해서 다 적용해줘」.
   그림(docs/mokgak/자비스.html)에서 고르신 넷 — 묻는 칸은 아래 · 첫 화면은 오늘 챙길 것 + 단계마다 물어볼 말 ·
   읽어 주기는 누를 때만 · AI 의견은 맨 아래 접어서 — 와 그림의 「새 판」 자리들을 앱(app/apex-map.html)에서 잽니다.
   ★ 찾는 두뇌는 check-jvfind · check-jvguide 가 그대로 잽니다. 여기서는 <b>보이는 모양과 단추가 정말 도는지</b>만.

     [1] 묻는 칸이 바닥에 붙어 있다 · 이어 묻는 칸(#jFoot)은 자비스 모드에서 안 선다(칸이 하나) · 위 띠에 「← 업무」
     [2] 첫 화면 — 할 수 있는 것 셋 · 오늘 챙길 것이 본체의 cmTodo 와 같은 분을 말한다 · 단계 칩이 바뀐다
     [3] ★ 칩의 물음은 <b>자비스가 정말 답하는 물음</b> — 자주 묻는 말 · 단계마다 · 못 찾을 때 칩을 하나하나 물어 굳은 답이 서나 (1번)
     [4] 답 하나 = 카드 하나 — 줄을 꼬리표 · 말로 나눠도 <b>글자는 그대로</b> · 같이 찾은 것 칩이 그 줄로 간다
     [5] 읽어 주기는 누를 때만 — 처음엔 저절로 안 읽고, 🔊 는 늘 읽는다
     [6] 할 일 확인 판 — 누구 · 무엇 · 언제 칸 · 「홍길동 고객 …」 에서 이름이 통째로 잡힌다 · 바꾸기 · ↩ 되돌리기가 그 한 줄을 지운다
     [7] 연금 셈에는 셈 카드만 · 조건 한 줄로 접히고 ✏️ 바꾸기로 펴진다
     [8] 못 찾으면 못 찾았다고 먼저 · AI 의견은 접혀 있다
     [9] 컴퓨터에서는 곁 칸(오늘 챙길 것 · 방금 물은 것) · 폰에서는 곁 칸이 없고 옆으로 안 넘친다 · 빈 떠 있는 띠가 없다 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = 9171;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = t => console.log('\n' + t);
const MT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
/* 견본 — 홍길동 한 분 · 기한 지난 할 일 하나 · 서버는 안 부릅니다 */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok', '1'); localStorage.removeItem('map_voice'); } catch (e) {}
  window.osLoadProfile = function(){}; window.osProfileApply = function(){};
  window.osShowLoginGate = function(){}; window.arLoad = function(){};
  window.osLoadClients = function(){}; window.cmLoadAll = function(cb){ if (cb) cb(); };
  window.toast = function(){};
  window.setupDone = function(){ return true; }; window.setupCanRun = function(){ return true; };
  window.osTabAllowed = function(){ return true; };
  OS.profile = { id: 'me', user_id: 'me', name: '윤설계', role: 'fp', team: 'A', active: true };
  OS.session = { user: { id: 'me' } };
  OSC.loaded = true; OSC.busy = false; OSC.err = '';
  CM.loaded = true; AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  OSC.list = [{ id: 'c0', name_masked: '홍○○', advisor_id: 'me', stage: 'AP', created_at: '2026-08-01', phone: '010-1234-5678' }];
  CM.meta = { c0: { nx: [{ k: 'nx1', what: '증권 전달', due: '2026-11-03' }], touch: [] } };
  /* 저장은 이 브라우저에서만 — 서버로 안 보냅니다 */
  window.cmSave = function(id, patch, then){ CM.meta[id] = Object.assign({}, CM.meta[id] || {}, patch); if (then) then(); };
  try { cmRealSet('c0', '홍길동'); } catch (e) {}
  try { osHideLoginGate(); } catch (e) {}
  try { renderNav(); } catch (e) {}
  go('home');
};
async function openJv(b, w, h){
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.route('**://**', rt => rt.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? rt.continue()
    : rt.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED); await p.waitForTimeout(800);
  await p.evaluate(() => go('apexmap')); await p.waitForTimeout(2200);
  const f = p.frame({ url: /apex-map\.html/ });
  await f.evaluate(() => { ['gproxy', 'proxy', 'apikey', 'gkey'].forEach(k => LS.del(k)); modeLabel(); jvExtLoad(); });
  await p.waitForTimeout(3500);
  return { p, f, errs };
}
const ASK = (f, q) => f.evaluate(async (q) => { jLog.innerHTML = ''; ask(q); await new Promise(r => setTimeout(r, 1500));
  return [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(); }, q);

(async () => {
  console.log('🪵 자비스 새 판 — 그림대로 섰나 (판 X360)');
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const { p, f, errs } = await openJv(b, 390, 844);

  sec('[1] 묻는 칸은 바닥 · 칸은 하나 · 위 띠에 「← 업무」');
  const L = await f.evaluate(() => { const r = e => e ? e.getBoundingClientRect() : null, vis = e => !!(e && e.offsetParent !== null && getComputedStyle(e).display !== 'none');
    const a = document.querySelector('.ask'), ra = r(a), bk = document.getElementById('jvBack');
    return { bottom: ra ? Math.round(ra.bottom) : -1, vh: innerHeight, fixed: a ? getComputedStyle(a).position : '', ask: vis(document.getElementById('ask')),
             foot: vis(document.getElementById('jFoot')), back: vis(bk), backT: bk ? bk.textContent : '', mic: !!document.getElementById('askMic') || !document.getElementById('jMic'),
             quick: document.querySelectorAll('#jvQuick [data-tq]').length }; });
  is(L.fixed === 'fixed' && Math.abs(L.bottom - L.vh) <= 2 && L.ask, '묻는 칸이 <b>바닥에 붙어</b> 있다 — 아래 끝 ' + L.bottom + ' / 창 ' + L.vh);
  is(!L.foot, '자비스 모드에서는 이어 묻는 칸(#jFoot)이 <b>안 선다</b> — 묻는 칸이 하나 (아래 띠에서는 그대로 · check-jvguide)');
  is(L.back && /업무/.test(L.backT), '위 띠에 「← 업무」 — 떠 있던 「← 워크스페이스」 띠를 옮겼습니다');
  is(L.mic && L.quick >= 5, '🎤 은 묻는 칸 옆 · 자주 묻는 말 ' + L.quick + '가지');
  const BK = await p.evaluate(() => { const fl = document.querySelector('#apexMapScreen .fin-float');
    return { float: fl ? getComputedStyle(fl).display : 'none', amissHidden: !!(document.getElementById('amissBtn') || {}).hidden }; });
  is(!BK.amissHidden || BK.float === 'none', '빠진 화면 알약이 없으면 떠 있는 띠를 <b>안 세운다</b> (빈 동그라미 0)');

  sec('[2] 첫 화면 — 할 수 있는 것 셋 · 오늘 챙길 것 · 단계마다 물어볼 말');
  const H = await f.evaluate(() => { const c = document.querySelector('#jLog .msg.j.jv-hello');
    const P = window.parent, t = P.cmTodo(P.OSC.list), today = c && c.querySelector('.jv-today');
    const tab = c && c.querySelector('[data-stg="CS"]'); if (tab) tab.click();
    return { hi: !!(c && c.querySelector('.jv-hi')), can: c ? c.querySelectorAll('.jv-can > div').length : 0,
             todayTxt: today ? today.textContent : '', due: t.due.map(x => P.cmName(x)), n: t.n,
             cs: c ? [].slice.call(c.querySelectorAll('.jv-sq [data-tq]')).map(x => x.getAttribute('data-tq')) : [],
             csWant: JV_STAGE_Q.CS, know: !!(c && c.querySelector('details.jv-know')), menuIn: c ? c.textContent.indexOf(String(Object.keys(MENU).length)) >= 0 : false }; });
  /* 섞기(판 X359) — 인사 머리 · 할 수 있는 것 셋은 HUD(원자로 · SYSTEM 판)가 말합니다. 같은 수를 두 번 말하지 않게 카드 머리는 감춥니다 */
  const HUD = await f.evaluate(() => { const hi = document.querySelector('#jLog .jv-hello .jv-hi'), core = document.querySelector('.deck .hud .hud-core');
    return { hud: !!(core && core.offsetParent !== null), cmd: document.querySelectorAll('.pane-r #chips .chip').length, hiHidden: !hi || getComputedStyle(hi).display === 'none' }; });
  is(HUD.hud && HUD.cmd >= 4 && HUD.hiHidden, '첫 화면은 <b>HUD 그대로</b> — 원자로 · COMMAND 상황 단추 ' + HUD.cmd + '개 · 인사 카드 머리는 HUD 와 겹치지 않게 감춤');
  is(H.n > 0 && H.due.every(nm => H.todayTxt.indexOf(nm) >= 0) && /오늘 챙길 것/.test(H.todayTxt),
     '오늘 챙길 것이 <b>본체의 cmTodo 와 같은 분</b>을 말한다 — ' + H.due.join(', ') + ' (새로 세지 않음 · 5번)');
  is(H.cs.join('|') === H.csWant.join('|'), '단계 단추(CS)를 누르면 그 단계의 물을 말로 바뀐다');
  is(H.know && H.menuIn, '예전 인사 글은 「자비스가 아는 것」 에 접혀 있다 — 화면 수를 세어 말하는 글이 그대로');

  sec('[3] ★ 칩의 물음은 자비스가 <b>정말 답하는 물음</b>');
  const QS = await f.evaluate(() => [].concat(JV_QUICK.map(x => x[1]), JV_STAGE_Q.TA, JV_STAGE_Q.AP, JV_STAGE_Q.PC, JV_STAGE_Q.CS, JV_NF_Q.map(x => x[1]))
    .filter((x, i, a) => a.indexOf(x) === i));
  const weak = [];
  for (const q of QS){
    const r = await f.evaluate(async (q) => { jLog.innerHTML = ''; window.__sp = window.speak; window.speak = function(){}; ask(q); await new Promise(r => setTimeout(r, 900)); window.speak = window.__sp;
      const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
      const F = jvFind(q).filter(x => (x.rows || []).length);
      return { strong: F.some(x => x.strong), act: !!(c && c.querySelector('.j-act')), pen: !!(c && c.querySelector('.j-pen .jf-best')), weakTxt: !!(c && /혹시 이것도/.test(c.textContent)) }; }, q);
    if (!((r.strong || r.act || r.pen) && !r.weakTxt)) weak.push(q);
  }
  is(QS.length >= 15 && weak.length === 0, '칩 ' + QS.length + '가지를 하나하나 물었더니 모두 <b>굳은 답</b>(찾은 것 · 할 일 · 연금 셈)이 선다' + (weak.length ? ' ← 약함: ' + weak.join(' · ') : ''));

  sec('[4] 답 하나 = 카드 하나 · 글자는 그대로');
  await ASK(f, '처음 전화 뭐라고 해?');
  const C = await f.evaluate(() => { const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(), best = c.querySelector('.jf-best');
    const r = jvFind('처음 전화 뭐라고 해?').filter(x => (x.rows || []).length)[0].rows[0];
    const lines = [].slice.call(best.querySelectorAll('.jw-s')).map(x => x.textContent);
    const fb = getComputedStyle(c.querySelector('.j-find')), bb = getComputedStyle(c.querySelector('.bub'));
    const ch = c.querySelector('.jf-chip'), dt = c.querySelector('details.jf-more'), before = dt ? dt.open : null;
    if (ch) ch.click();
    return { same: JSON.stringify(lines) === JSON.stringify(r.s), split: best.querySelectorAll('.jw-split .jw-l').length, n: r.s.length,
             flat: fb.borderTopWidth === '0px' && bb.borderTopWidth === '0px', card: getComputedStyle(best).borderRadius,
             chip: !!ch, opened: before === false && dt.open === true }; });
  is(C.same, '줄을 꼬리표 · 말로 나눠 그려도 <b>글자는 한 글자도 안 바뀐다</b>(자가 견주는 글 · 복사 · 읽어 주기 그대로)');
  is(C.split >= 5, '다섯 마디가 꼬리표(언제) · 말(무엇을)로 나뉘어 선다 — ' + C.split + '/' + C.n);
  is(C.flat && parseFloat(C.card) >= 16, '바깥 두 겹(말풍선 · 찾아 온 것 상자)은 걷히고 ⭐ 한 장이 카드 — 둥글기 ' + C.card);
  is(C.chip && C.opened, '「같이 찾은 것」 칩을 누르면 접힌 칸이 펴져 그 줄로 간다');

  sec('[5] 읽어 주기는 누를 때만');
  const T = await f.evaluate(async () => { const said = []; const ss = window.speechSynthesis;
    const fake = { cancel(){}, speak(u){ said.push(u.text); }, getVoices(){ return []; } };
    try { Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true }); } catch (e) {}
    const on0 = TTS.on;
    jLog.innerHTML = ''; ask('지금 바빠요 라고 끊으려 해'); await new Promise(r => setTimeout(r, 900));
    const auto = said.length;
    document.querySelector('#jLog .jf-best .jr-say').click(); await new Promise(r => setTimeout(r, 200));
    try { Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true }); } catch (e) {}
    return { on0, auto, tap: said.length - auto }; });
  is(T.on0 === false && T.auto === 0, '처음 연 기기에서는 답이 서도 <b>저절로 안 읽는다</b>(사장님이 고르신 쪽)');
  is(T.tap === 1, '🔊 읽어 주기를 누르면 <b>그 줄을 읽는다</b> — 저절로 읽기를 꺼 둬도');

  sec('[6] 할 일 확인 판 — 누구 · 무엇 · 언제 · 바꾸기 · 되돌리기');
  const HIT = await p.evaluate(() => { const q = '홍길동 고객 내일 3시 통화 할 일 넣어줘', h = vaActHit(q, vaNorm(q)); return h && h.args ? { who: h.args.who, what: h.args.what } : null; });
  is(!!HIT && HIT.who === '홍길동' && HIT.what === '내일 3시 통화', '「홍길동 고객 내일 3시 통화 할 일 넣어줘」 → 누구 「홍길동」 · 무엇 「내일 3시 통화」 — 이름이 <b>한 글자(홍)로 잡히지 않는다</b> (' + JSON.stringify(HIT) + ')');
  await ASK(f, '홍길동 고객 내일 3시 통화 할 일 넣어줘');
  const A1 = await f.evaluate(() => { const a = document.querySelector('#jLog .j-act');
    return { f: [].slice.call(a.querySelectorAll('.ja-fld')).map(x => x.querySelector('span').textContent + '=' + x.querySelector('b').textContent),
             edit: a.querySelectorAll('.ja-edit').length, ok: !!a.querySelector('.ja-ok') }; });
  is(A1.f.length === 3 && /^누구=홍길동님$/.test(A1.f[0]) && /^무엇=3시 통화$/.test(A1.f[1]) && /^언제=\d+월 \d+일$/.test(A1.f[2]) && A1.edit === 2 && A1.ok,
     '확인 판이 칸마다 — ' + A1.f.join(' · ') + ' · 바꾸기 ' + A1.edit);
  const A2 = await f.evaluate(async () => { document.querySelector('#jLog .j-act .ja-edit[data-k="what"]').click(); await new Promise(r => setTimeout(r, 100));
    const a = document.querySelector('#jLog .j-act'), v = a.querySelector('.ja-v');
    if (v){ v.value = '증권 사진 받기 모레'; a.querySelector('.ja-put').click(); } await new Promise(r => setTimeout(r, 150));
    const b = document.querySelector('#jLog .j-act');
    return { input: !!v, after: [].slice.call(b.querySelectorAll('.ja-fld b')).map(x => x.textContent).join(' · ') }; });
  is(A2.input && /증권 사진 받기/.test(A2.after), '「바꾸기」 → 원래 있던 묻는 칸이 서고, 넣으면 확인 판으로 돌아온다 — ' + A2.after);
  const A3 = await f.evaluate(async () => { const P = window.parent, n0 = P.cmNextAll('c0').length;
    document.querySelector('#jLog .j-act .ja-ok').click(); await new Promise(r => setTimeout(r, 900));
    const n1 = P.cmNextAll('c0').length, u = document.querySelector('#jLog .j-act .ja-undo');
    if (u) u.click(); await new Promise(r => setTimeout(r, 400));
    const a = document.querySelector('#jLog .j-act');
    return { n0, n1, undo: !!u, n2: P.cmNextAll('c0').length, said: a ? a.textContent : '', left: P.cmNextAll('c0').map(x => x.what) }; });
  is(A3.n1 === A3.n0 + 1 && A3.undo, '「✅ 이대로 하기」 로 한 줄이 늘고(' + A3.n0 + ' → ' + A3.n1 + '), 「↩ 되돌리기」 가 선다');
  is(A3.n2 === A3.n0 && /되돌|지웠/.test(A3.said) && A3.left.indexOf('증권 전달') >= 0, '「↩ 되돌리기」 는 <b>방금 그 한 줄만</b> 지운다 — 원래 있던 「증권 전달」 은 그대로 (' + A3.left.join(',') + ')');

  sec('[7] 연금 셈에는 셈 카드만 · 조건 한 줄');
  await ASK(f, '50세 남자 월 50만원 10년납 65세부터 연금 얼마');
  await p.waitForTimeout(1500);
  const PN = await f.evaluate(async () => { const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(), pen = c.querySelector('.j-pen');
    const form = pen.querySelector('.jp-f'), hid = getComputedStyle(form).display === 'none';
    const e = pen.querySelector('.jp-edit'); if (e) e.click(); await new Promise(r => setTimeout(r, 50));
    return { find: c.querySelectorAll('.j-find .jw-row').length, has: pen.classList.contains('jp-has'), hid, shown: getComputedStyle(form).display !== 'none', note: /최저보증/.test(pen.textContent) }; });
  is(PN.find === 0, '연금 셈 밑에 <b>엉뚱한 장이 안 붙는다</b>(「50세」 가 걸린 전립선비대증 장 0)');
  is(PN.has && PN.hid && PN.shown, '셈이 서면 입력 칸은 접히고 조건 한 줄 — 「✏️ 바꾸기」 로 다시 펴진다');
  is(PN.note, '최저보증 문구는 그대로 보인다 (1번 · 2번)');

  sec('[8] 못 찾으면 먼저 말한다 · AI 의견은 접혀 있다');
  const NF = await f.evaluate(async () => { jLog.innerHTML = ''; ask('외계인 보험 있어?'); await new Promise(r => setTimeout(r, 900));
    const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    return { tip: c.querySelectorAll('.jv-nf [data-q]').length, said: /찾지 못했/.test(c.textContent) }; });
  is(NF.said && NF.tip === 4, '「찾지 못했습니다 — 지어서 답하지 않겠습니다」 + 이렇게 물으면 찾는다는 칩 넷');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/apex-map.html'), 'utf8');
  is(/<details class="j-aiw"><summary>🤖 AI 의견 보기 ▾<\/summary><div class="j-ai" data-ai="1">/.test(SRC), 'AI 의견 자리는 맨 아래 <b>접힌 칸</b>(details) 안에 — 펴야 보인다');

  sec('[9] 컴퓨터는 곁 칸 · 폰은 옆으로 안 넘친다');
  const PH = await f.evaluate(() => ({ side: getComputedStyle(document.getElementById('jvSide')).display, ov: document.documentElement.scrollWidth - innerWidth }));
  is(PH.side === 'none' && PH.ov <= 0, '폰(390) — 곁 칸 없음 · 옆으로 넘침 ' + PH.ov + 'px');
  is(errs.length === 0, '스크립트 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 2).join(' | ') : ''));
  /* 섞기 — 곁 칸은 HUD 판 셋이 나란히 설 자리가 남는 넓은 화면(1,500px 부터)에서만. 1,280 에서는 오늘 챙길 것이 첫 답 안에 */
  const MD = await openJv(b, 1280, 860);
  const MS = await MD.f.evaluate(() => ({ side: getComputedStyle(document.getElementById('jvSide')).display,
    hiToday: (() => { const t = document.querySelector('.jv-today-in'); return t ? getComputedStyle(t).display : 'none'; })(),
    cmdRight: (() => { const r = document.querySelector('.deck .pane-r'), c = document.querySelector('.deck .hud'); return r && c ? r.getBoundingClientRect().left > c.getBoundingClientRect().left : false; })() }));
  is(MS.side === 'none' && MS.hiToday !== 'none' && MS.cmdRight, '컴퓨터(1280) — 곁 칸 없이 HUD 판 셋이 나란히(COMMAND 가 오른쪽) · 오늘 챙길 것은 첫 답 안에');
  await MD.p.context().close();
  const PC = await openJv(b, 1680, 950);
  await ASK(PC.f, '처음 전화 뭐라고 해?');
  const PS = await PC.f.evaluate(() => { const sd = document.getElementById('jvSide'), r = sd.getBoundingClientRect(), a = document.querySelector('.ask').getBoundingClientRect();
    return { side: getComputedStyle(sd).display, w: Math.round(r.width), today: /오늘 챙길 것/.test(sd.textContent), asked: /처음 전화 뭐라고 해/.test(sd.textContent),
             chips: sd.querySelectorAll('.jf-chip').length, askRight: Math.round(a.right), left: Math.round(r.left), hiToday: (() => { const t = document.querySelector('.jv-today-in'); return t ? getComputedStyle(t).display : 'none'; })() }; });
  is(PS.side === 'block' && PS.w >= 300 && PS.today && PS.asked, '넓은 화면(1680) — 오른쪽 곁 칸에 오늘 챙길 것 · 방금 물은 것 (' + PS.w + 'px)');
  is(PS.chips >= 1 && PS.askRight <= PS.left + 1, '곁 칸에 마지막 답의 「같이 찾은 것」 · 묻는 칸은 곁 칸을 안 덮는다');
  is(PS.hiToday === 'none', '컴퓨터에서는 오늘 챙길 것이 곁 칸에만 — 한 화면에 <b>두 번 안 선다</b>');
  is(PC.errs.length === 0, '컴퓨터 — 스크립트 오류 0');

  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '곳이 어긋났습니다' : '✓ 자비스 새 판이 그림대로 섰습니다'));
  process.exit(bad ? 1 : 0);
})();
