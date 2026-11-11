/* 🖼 <b>자비스 — 자료를 찾으면 그림 · 상담자료 장도 같이 뜨나</b> (판 X417)

   사장님 말씀 2026-11-11 — 「아니 내 crm내에서 자료를 찾으면 자료 찾아주고 이미지 띄어주는거까지 체크해줘」.

   라이브에서 재어 보니 앱에는 뇌졸중 · 간병 · 실손 · 치료비 통장의 <b>원본 그림 슬라이드</b>와 덱의 장이
   있는데, 답에는 여섯 물음 중 둘만 그림이 섰고 덱 「이 장 열기」 는 하나도 안 섰습니다.
     ① 찾기(jvFind)가 갈래를 넷까지만 세우는데 글 자료(질병 · 담보 · 사례 · 용어)가 자리를 다 차지했고
     ② 「간병보험 그림」 의 「그림」 · 「암 진단비 슬라이드」 의 「슬라이드」 가 화제 낱말로 세어졌고
     ③ 「실손보험 가입시기별 …」 처럼 이름 <b>안에</b> 든 두 글자(「실손」)는 문턱 아래였습니다.
   그래서 그림 · 덱 장을 <b>따로 한 띠</b>(🖼 관련 그림 · 상담자료 장)로 세웁니다.

   이 자가 보는 것
   [1] 띠는 그 갈래의 표 · 그리는 법을 그대로 쓴다 — 두 벌 안 둔다 (5번)
   [2] 자료를 물으면 그림이 <b>실제로 뜬다</b>(깨진 그림 0) · 그 화제의 그림이다
   [3] 헛것을 안 세운다 — 「비용」 하나로 「법인계약과 비용 인정」 · 화법 물음에 「본인부담상한제」 ·
       고객 · 일정 · 앱 쓰는 법에 그림 0 · 없는 자료(8통장)에 그림을 지어 붙이지 않는다 (1번 · 8번)
   [4] ⭐ 크게 선 그림을 띠에 또 세우지 않는다
   [5] 「이 장 열기」 를 실제로 눌러 그 덱의 <b>그 장</b>이 열린다
   [6] 폰 폭에서 띠가 옆으로 안 넘친다 · 서버 호출 0

   돌리기:  node scripts/check-jvvis.js                                                         */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9372;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
             '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
             '.webp':'image/webp', '.svg':'image/svg+xml', '.gif':'image/gif' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p).toLowerCase()] || 'application/octet-stream' }); s.end(d); });
});
const MAP = fs.readFileSync(path.join(ROOT, 'app/apex-map.html'), 'utf8');
const bodyOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? i + 4000 : j); };

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

(async () => {
  sec('[1] 띠는 그 갈래의 표 · 그리는 법을 그대로 쓴다 — 두 벌 안 둔다 (5번)');
  const src = bodyOf(MAP, 'jvKnowSrc'), pick = bodyOf(MAP, 'jvVisPick'), vis = bodyOf(MAP, 'jvVisual'), html = bodyOf(MAP, 'jvVisualHtml');
  is(/list:list, f:f, row:row/.test(src), 'jvKnowSrc 가 표(list) · 셈(f) · 그리는 법(row)을 밖에 내놓는다');
  is(/s\.list\(P\)/.test(pick) && /s\.f\.t\(/.test(pick) && /s\.row\(/.test(pick) && !/보험아카데미\/img/.test(pick + vis), '띠는 그것을 부른다 — 그림 주소 · 표를 따로 짓지 않는다');
  is(/JV_FIND\.forEach/.test(vis) && /'aslide'/.test(vis) && /'deck'/.test(vis), '띠가 보는 갈래는 JV_FIND 의 원본 슬라이드 · 상담자료 덱 그대로');
  is(!!html && !/\+ r\.t \+|\+ t \+ '/.test(html.replace(/esc\([^)]*\)/g, '')), '띠의 글은 모두 esc 를 지난다');
  is(/r0\.vis = jvVisual\(q, found\)/.test(MAP) && /!act && !pen && r0\.how !== 'hello'/.test(MAP), '시키신 일 · 연금 셈 · 인사에는 띠를 안 붙인다');

  await new Promise(r => srv.listen(PORT, r));
  const BASE = 'http://127.0.0.1:' + PORT;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const outside = new Set(), broken = [];
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (u.indexOf(BASE) === 0 && !/\/api\/|\.netlify\/functions/.test(u)) return rt.continue();
    outside.add(u.split('/').slice(0, 3).join('/')); return rt.abort(); });
  const pops = [];
  ctx.on('page', async pg => { pops.push(pg); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('response', r => { if (/\/img\//.test(r.url()) && r.status() >= 400) broken.push(r.status() + ' ' + decodeURIComponent(r.url()).slice(-50)); });
  await p.goto(BASE + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.evaluate(SEED); await p.waitForTimeout(400);
  await p.evaluate(() => { try { BRAIN.hist = []; } catch(e){} window.aiReady = function(){ return false; }; go('apexmap'); });
  await p.waitForTimeout(2500);
  const f = p.frame({ url: /apex-map\.html/ });
  await f.evaluate(async () => {
    ['gproxy','proxy','apikey','gkey','map_engine'].forEach(k => LS.del(k)); TTS.on = false;
    jvExtLoad(); const t = Date.now();
    while (JV_EXT.st !== 'ok' && JV_EXT.st !== 'fail' && Date.now() - t < 30000) await new Promise(r => setTimeout(r, 200));
  });
  const ext = await f.evaluate(() => ({ st: JV_EXT.st, why: JV_EXT.why, src: (jvA('SOURCE') || []).length, decks: jvDecks().length }));
  is(ext.st === 'ok' && ext.src > 100 && ext.decks >= 4, '아카데미 원본 슬라이드 · 덱 색인을 읽었다 (슬라이드 ' + ext.src + ' · 덱 ' + ext.decks + (ext.why ? ' · ' + ext.why : '') + ')');
  /* 화면을 여는 동안 받는 글꼴은 세지 않습니다 — <b>물은 뒤에</b> 밖으로 나간 것만 셉니다 */
  outside.clear();

  const askQ = async (q) => f.evaluate(async (q) => {
    while (busy) await new Promise(r => setTimeout(r, 30));
    jLog.innerHTML = ''; ask(q); await new Promise(r => setTimeout(r, 150));
    const t = Date.now(); while (busy && Date.now() - t < 20000) await new Promise(r => setTimeout(r, 50));
    const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    const v = c && c.querySelector('.j-vis');
    const ims = v ? [].slice.call(v.querySelectorAll('.jv-th img')) : [];
    for (const im of ims){ im.loading = 'eager'; im.scrollIntoView(); }
    const t2 = Date.now(); while (ims.some(im => !im.complete) && Date.now() - t2 < 8000) await new Promise(r => setTimeout(r, 100));
    const best = c && c.querySelector('.jf-best .jf-img img');
    return { q, vis: !!v,
      imgs: v ? [].map.call(v.querySelectorAll('.jv-th span'), x => x.textContent) : [],
      srcs: ims.map(im => im.getAttribute('src')), ok: ims.filter(im => im.complete && im.naturalWidth > 0).length,
      decks: v ? [].map.call(v.querySelectorAll('.jr-open'), x => x.textContent) : [],
      best: best ? best.getAttribute('src') : '',
      over: v ? v.scrollWidth - v.clientWidth : 0, docOver: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  }, q);

  sec('[2] 자료를 물으면 그림이 <b>실제로 뜬다</b> · 그 화제의 그림이다');
  const NO = await askQ('뇌졸중 설명 자료');
  is(NO.imgs.length >= 2 && NO.imgs.every(t => /뇌/.test(t)), '「뇌졸중 설명 자료」 — 뇌졸중 그림 슬라이드가 띠에 선다 (' + NO.imgs.length + '장 · ' + NO.imgs.map(t => t.slice(0, 14)).join(' / ') + ')');
  is(NO.ok === NO.imgs.length && NO.ok > 0, '그 그림이 정말 뜬다 — 깨진 그림 0 (' + NO.ok + '/' + NO.imgs.length + ')');
  const SI = await askQ('실손 보험 자료');
  is(SI.imgs.length >= 2 && SI.imgs.every(t => /실손/.test(t)), '「실손 보험 자료」 — 이름 안에 든 「실손」(실손보험 가입시기별 …)도 선다 (' + SI.imgs.length + '장)');
  is(SI.decks.some(t => /실비/.test(t) && /이 장 열기/.test(t)), '같은 물음에 덱의 실비 장 「이 장 열기」 가 선다 (' + SI.decks.map(t => t.slice(0, 18)).join(' / ') + ')');
  is(SI.ok === SI.imgs.length, '실손 그림도 깨진 것 0');
  const GB = await askQ('간병보험 그림 보여줘');
  is(GB.imgs.length >= 2 && /간병보험/.test(GB.imgs[0] || ''), '「간병보험 그림 보여줘」 — 「그림 · 보여줘」 를 화제로 안 세고, 이름 앞쪽에 「간병보험」 이 든 장이 먼저 (' + (GB.imgs[0] || '').slice(0, 20) + ')');
  const CT = await askQ('치료비 통장 자료');
  is(CT.imgs.length >= 2, '「치료비 통장 자료」 — 그 자료(치료비 통장 — 개념 설립)의 그림이 선다 (' + CT.imgs.length + '장)');

  sec('[3] 헛것을 안 세운다 (1번 · 8번)');
  const GI = await askQ('간병인 비용 자료 보여줘');
  is(GI.imgs.length >= 1 && GI.imgs.every(t => /간병/.test(t)) && !GI.imgs.some(t => /법인/.test(t)), '「간병인 비용」 — 「비용」 하나로 「법인계약과 비용 인정」 장이 안 선다 (' + GI.imgs.map(t => t.slice(0, 14)).join(' / ') + ')');
  const BU = await askQ('보험료가 부담돼요');
  is(!BU.vis, '「보험료가 부담돼요」(거절 처리를 찾은 물음) — 「본인부담상한제」 장이 안 붙는다');
  const E8 = await askQ('8통장 그림');
  is(!E8.vis, '「8통장 그림」 — 앱에 그 그림이 없으면 띠를 안 세운다(지어 붙이지 않는다)');
  for (const q of ['홍길동 연락처', '내일 일정', '고객 등록 어떻게 해']){
    const R = await askQ(q);
    is(!R.vis, '「' + q + '」 — 고객 · 일정 · 앱 쓰는 법에는 그림 띠 0');
  }

  sec('[4] ⭐ 크게 선 그림을 띠에 또 세우지 않는다');
  const AM = await askQ('암 진단비 슬라이드');
  is(!!AM.best && AM.srcs.indexOf(AM.best) < 0, '「암 진단비 슬라이드」 — ⭐ 의 그림(' + decodeURIComponent(AM.best).split('/').pop() + ')이 띠에 또 안 선다');
  is(AM.decks.length >= 1, '그 대신 덱의 암 장 「이 장 열기」 가 선다 (' + AM.decks.map(t => t.slice(0, 14)).join(' / ') + ')');

  /* 덱을 열면 덱이 제 글꼴 · 그림 틀을 받습니다 — 자비스가 부른 것이 아니니 그 <b>앞</b>까지만 셉니다 */
  const outAsk = [...outside];
  sec('[5] 「이 장 열기」 를 실제로 눌러 <b>그 장</b>이 열린다');
  for (const [q, want] of [['실손 보험 자료', /기준 1 · 실비/], ['간병보험 그림 보여줘', /간병인 보험/]]){
    await askQ(q);
    pops.length = 0;
    const lab = await f.evaluate((w) => { const re = new RegExp(w);
      const bt = [].slice.call(document.querySelectorAll('#jLog .j-vis .jr-open')).filter(x => re.test(x.textContent))[0];
      if (!bt) return ''; bt.click(); return bt.textContent; }, want.source);
    let jumped = '', url = '';
    for (let i = 0; i < 40 && !jumped; i++){
      await p.waitForTimeout(300);
      for (const pg of pops){ try { const j = await pg.evaluate(() => window.__jvJumped || ''); if (j){ jumped = String(j); url = decodeURIComponent(pg.url()).split('/').pop(); } } catch(e){} }
    }
    is(!!lab && !!jumped, '「' + lab.slice(0, 26) + '」 → 덱이 열리고 그 장으로 갔다 (' + url + ' · ' + jumped + ')');
    for (const pg of pops){ try { await pg.close(); } catch(e){} }
  }

  sec('[7] 같은 장을 두 번 안 세운다 — 「더 찾은 것」 에 접힌 장과 띠 (판 X420 · 5번)');
  /* 라이브에서 「영수증 보는 법 자료」 를 물으니 「영수증 어느 칸」 · 「영수증 읽기」 장이 접힌 칸에도, 띠에도 섰습니다 */
  for (const q of ['영수증 보는 법 자료', '치료비 통장 자료']){
    const D = await f.evaluate(async (q) => {
      while (busy) await new Promise(r => setTimeout(r, 30));
      jLog.innerHTML = ''; ask(q); await new Promise(r => setTimeout(r, 150));
      const t = Date.now(); while (busy && Date.now() - t < 20000) await new Promise(r => setTimeout(r, 50));
      const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
      const keyOf = (el) => { const r = JV_ROWS[el.getAttribute('data-r')]; return r ? jvVisKey(r) : ''; };
      const fold = [].map.call(c.querySelectorAll('.jf-more .jr-open'), keyOf).concat([].map.call(c.querySelectorAll('.jf-more .jf-img img'), x => 'i:' + x.getAttribute('src')));
      const vis = [].map.call(c.querySelectorAll('.j-vis .jr-open'), keyOf).concat([].map.call(c.querySelectorAll('.j-vis .jv-th img'), x => 'i:' + x.getAttribute('src')));
      const sum = (c.querySelector('.jf-more > summary') || {}).textContent || '';
      const n = c.querySelectorAll('.jf-more .jw-row').length;
      return { vis: vis.filter(Boolean), dup: vis.filter(k => k && fold.indexOf(k) >= 0), sum, n };
    }, q);
    is(D.vis.length > 0 && D.dup.length === 0, '「' + q + '」 — 띠에 선 장(' + D.vis.length + ')이 「더 찾은 것」 에 또 안 접힌다 (겹침 ' + D.dup.length + ')');
    is(!D.sum || D.sum.indexOf('더 찾은 것 ' + D.n + '개') >= 0, '「더 찾은 것 N개」 의 N 이 실제 접힌 줄 수와 같다 (' + D.sum.trim() + ' · 줄 ' + D.n + ')');
  }

  sec('[6] 폰 폭에서 안 넘친다 · 서버 호출 0');
  is(SI.over <= 0 && SI.docOver <= 0, '390px 폭 — 띠가 옆으로 안 넘친다 (띠 ' + SI.over + ' · 문서 ' + SI.docOver + ')');
  is(outAsk.length === 0, '물은 뒤 밖으로 나간 부름 0 — 그림 띠는 앱 안의 파일만 씁니다 (' + outAsk.join(' ') + ')');
  is(broken.length === 0, '깨진 그림 주소 0 (' + broken.slice(0, 2).join(' | ') + ')');
  is(errs.length === 0, '화면 오류 0 (' + errs.slice(0, 2).join(' | ') + ')');

  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남' : '✓ 모두 맞음'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
