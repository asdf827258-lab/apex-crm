/* 📥 <b>마스터 아카데미 「자료 넣기」 — 넣으면 팀이 보고 자비스가 찾나</b> (판 X427)

   사장님 말씀 2026-11-12 — 「앞으로 자료를 또는 이미지를 마스터아카데미에 다 넣으면 자동으로 검색이
   될 수 있니 그리고 마스터아카데미에 넣는 칸을 만들어줘 어디서든 공유 되도록」
   → 넣는 사람 「팀원 누구나」 · 그림 설명 「AI 가 읽고 자동 설명」.

   이 자가 보는 것 (서버는 가짜를 세웁니다 — 진짜 Supabase 를 부르지 않습니다)
   [1] 서버 꼴이 한 벌인가 — migration_75 와 앱 안 복구 SQL(OS_REPAIR_SQL)이 같은 문장 · 보관함은 비공개 ·
       academy_ 이름 안 씀 · 같은 파일 유일 색인
   [2] 그림을 넣으면 — 보관함에 「내 폴더/지문」 으로 올라가고, AI 가 단 제목 · 설명 · 찾기 말로 표에 적힌다
   [3] 막는다 — 같은 파일(무엇과 겹쳤는지 말함) · 원수사 약관(이름 · 글) · 이 기기의 고객 이름 · 휴대폰 번호 ·
       AI 가 본 개인정보. 막으면 <b>보관함에도 안 올린다</b> (1번 · 3번 · 5-1번 · 9번)
   [4] AI 가 없으면 — 파일 이름으로 넣고 「AI 설명 없이」 라고 말한다(지어내지 않는다)
   [5] 서버를 아낀다 — 두 번 불러도 받기는 한 번 · 다음 세션은 이 기기에 둔 목록 + <b>새 줄만</b>(gt) (7번)
   [6] 자비스가 찾는다 — 「팀이 넣은 자료」 갈래에 서고, 🖼 띠에 그 그림이 뜨고, 누르면 그 자료가 열린다
   [7] 칸 — 아카데미 띠에 「📥 자료 넣기」 · 남이 넣은 것엔 지우기 단추 없음 · 폰 폭에서 안 넘침 · 화면 오류 0

   돌리기:  node scripts/check-alib.js                                                                 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9373;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
             '.json':'application/json; charset=utf-8', '.jpg':'image/jpeg', '.png':'image/png' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p).toLowerCase()] || 'application/octet-stream' }); s.end(d); });
});
const IDX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const MIG = fs.readFileSync(path.join(ROOT, 'migration_75_bohum_lib.sql'), 'utf8');

/* 가짜 서버 — 표 bohum_lib · 보관함 bohum-lib. 부른 것을 적어 둡니다 */
const SEED = (IMG) => {
  try { localStorage.setItem('apex_login_ok', '1'); localStorage.removeItem('apex_alib_v1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(m){ (window.__TOAST = window.__TOAST || []).push(m); };
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.osIsOwner=function(){ return false; };
  OS.profile={id:'u1',user_id:'u1',name:'윤설계',role:'fp',team:'A',active:true};
  OS.session={user:{id:'u1'}};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  CM.loaded=true; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  OSC.list=[{id:'c0',name_masked:'홍○○',advisor_id:'u1',stage:'AP',created_at:'2026-08-01',phone:'010-1234-5678'}];
  try{ cmRealSet('c0','홍길동'); }catch(e){}
  window.__DB = { bohum_lib: [] }; window.__OBJ = {}; window.__CALLS = []; window.__N = 0;
  const mk = t => { const st = { op:'select', pay:null, eq:{}, gt:null }; const a = {
    select: () => a, order: () => a, limit: () => a,
    gt: (k, v) => { st.gt = [k, v]; return a; }, eq: (k, v) => { st.eq[k] = v; return a; },
    insert: r => { st.op = 'insert'; st.pay = r; return a; }, upsert: r => { st.op = 'upsert'; st.pay = r; return a; }, update: r => { st.op = 'update'; st.pay = r; return a; },
    'delete': () => { st.op = 'delete'; return a; },
    then: (o, n) => {
      window.__CALLS.push(st.op + ' ' + t + (st.gt ? ' gt' : ''));
      const T = window.__DB[t] || (window.__DB[t] = []);
      if (st.op === 'select'){ let L = T.slice(); if (st.gt) L = L.filter(x => x[st.gt[0]] > st.gt[1]);
        L.sort((x, y) => x.created_at < y.created_at ? 1 : -1); return Promise.resolve({ data: L.map(x => Object.assign({}, x)), error: null }).then(o, n); }
      if (st.op === 'insert'){
        const r = Object.assign({}, st.pay);
        if (T.some(x => x.sha === r.sha)) return Promise.resolve({ data: null, error: { message: 'duplicate key value violates unique constraint "bohum_lib_sha"', code: '23505' } }).then(o, n);
        r.id = 'id' + (++window.__N); r.uploader = 'u1'; r.created_at = '2026-11-12T0' + window.__N + ':00:00Z'; T.push(r);
        return Promise.resolve({ data: [Object.assign({}, r)], error: null }).then(o, n); }
      if (st.op === 'update'){ T.forEach(x => { if (x.id === st.eq.id) Object.assign(x, st.pay); }); return Promise.resolve({ data: [], error: null }).then(o, n); }
      if (st.op === 'upsert') return Promise.resolve({ data: [], error: null }).then(o, n);
      if (st.op === 'delete'){ window.__DB[t] = T.filter(x => x.id !== st.eq.id); return Promise.resolve({ data: [], error: null }).then(o, n); }
    } }; return a; };
  const store = b => ({
    upload: (p, f, opt) => { window.__CALLS.push('upload ' + b); window.__OBJ[p] = { size: f.size, type: opt && opt.contentType }; return Promise.resolve({ data: { path: p }, error: null }); },
    remove: ps => { window.__CALLS.push('remove ' + b); ps.forEach(p => delete window.__OBJ[p]); return Promise.resolve({ data: [], error: null }); },
    createSignedUrls: (ps) => { window.__CALLS.push('sign ' + b); return Promise.resolve({ data: ps.map(p => ({ path: p, signedUrl: IMG + '?p=' + encodeURIComponent(p) })), error: null }); },
    createSignedUrl: (p) => { window.__CALLS.push('sign1 ' + b); return Promise.resolve({ data: { signedUrl: IMG + '?one=' + encodeURIComponent(p) }, error: null }); }
  });
  window.osClient = function(){ return { from: t => mk(t), storage: { from: b => store(b) }, rpc: () => Promise.resolve({ data: null, error: null }) }; };
  /* 가짜 AI — 마지막에 정한 답을 돌려줍니다 */
  window.__AI = { on: true, out: '' , n: 0 };
  window.aiReady = function(){ return window.__AI.on; };
  window.callAIVision = function(sys, user, imgs){ window.__AI.n++; window.__AI.sys = sys; window.__AI.img = imgs && imgs[0] && imgs[0].mime; return Promise.resolve(window.__AI.out); };
  try { osHideLoginGate(); } catch(e){}
  go('home');
};

(async () => {
  sec('[1] 서버 꼴이 한 벌인가 — migration_75 · 앱 안 복구 SQL (5번)');
  const norm = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const migStmts = norm(MIG).split(';').map(x => x.trim()).filter(Boolean);
  const i0 = IDX.indexOf("'create table if not exists public.bohum_lib ("), i1 = IDX.indexOf("\n '',", IDX.indexOf("'comment on table public.bohum_lib is", i0));
  const repair = i0 > 0 ? IDX.slice(i0, i1).split('\n').map(l => { const m = l.match(/^\s*'(.*)',\s*$/); return m ? m[1].replace(/\\'/g, "'") : ''; }).join('\n') : '';
  const repStmts = norm(repair).split(';').map(x => x.trim()).filter(Boolean);
  is(migStmts.length >= 10 && JSON.stringify(migStmts) === JSON.stringify(repStmts), '파일과 앱 안 SQL 이 문장 하나 안 다르다 (' + migStmts.length + ' · ' + repStmts.length + '문장)');
  is(/values \('bohum-lib', 'bohum-lib', false/.test(norm(MIG)), '보관함은 비공개(public false) — 주소를 아는 사람이 아니라 로그인한 팀원만');
  is(/create unique index if not exists bohum_lib_sha on public\.bohum_lib\(sha\)/.test(norm(MIG)), '같은 파일은 서버도 막는다 — 지문(sha) 유일 색인 (5-1번)');
  is(!/academy_/.test(norm(MIG)), 'academy_ 이름을 안 쓴다(CRM 표와 부딪힌 적이 있다)');
  is(/with check \(uploader = auth\.uid\(\)\)/.test(norm(MIG)) && /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/.test(norm(MIG)), '넣기는 제 이름 · 제 폴더로만 — 남의 이름으로 못 넣는다');

  await new Promise(r => srv.listen(PORT, r));
  const BASE = 'http://127.0.0.1:' + PORT, IMG = BASE + '/app/보험아카데미/img/bk/bk_059.jpg';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const outside = new Set();
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (u.indexOf(BASE) === 0 && !/\/api\/|\.netlify\/functions/.test(u)) return rt.continue();
    outside.add(u.split('/').slice(0, 3).join('/')); return rt.abort(); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
  await p.goto(BASE + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.evaluate(SEED, IMG); await p.waitForTimeout(300);
  outside.clear();

  /* 파일 만들기 — 그림은 캔버스로(색이 다르면 지문도 다름), PDF 는 글 뽑기를 대역으로 */
  const put = (spec) => p.evaluate(async (spec) => {
    let f;
    if (spec.kind === 'img'){
      const c = document.createElement('canvas'); c.width = 64; c.height = 48; const g = c.getContext('2d');
      g.fillStyle = spec.color || '#3182F6'; g.fillRect(0, 0, 64, 48);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      f = new File([blob], spec.name, { type: 'image/png' });
    } else {
      window.extractPdfText = function(){ return Promise.resolve(spec.text || ''); };
      f = new File(['%PDF-1.4 ' + (spec.salt || '')], spec.name, { type: 'application/pdf' });
    }
    window.__AI.out = spec.ai || ''; window.__AI.on = spec.aiOn !== false;
    const c0 = window.__CALLS.length, a0 = window.__AI.n;
    const o = await alibPut(f);
    return { o, calls: window.__CALLS.slice(c0), ai: window.__AI.n - a0, aiImg: window.__AI.img, rows: window.__DB.bohum_lib.length };
  }, spec);
  const AI = (title, descr, tags, pii) => JSON.stringify({ title, descr, tags, pii: !!pii });

  sec('[2] 그림을 넣으면 — 보관함에 올라가고 AI 가 단 제목 · 설명으로 적힌다');
  const A = await put({ kind:'img', name:'IMG_2031.png', ai:'```json\n' + AI('간병보험의 필요성', '간병비 한달 400~500만원. 가족 간병의 부담.', '간병, 간병비, 간병보험, 간병인') + '\n```' });
  const r1 = await p.evaluate(() => window.__DB.bohum_lib[0] || {});
  is(A.o.ok && A.calls.indexOf('upload bohum-lib') >= 0 && A.calls.indexOf('insert bohum_lib') >= 0, '그림 하나 → 보관함에 올리고 표에 적었다 (' + A.o.msg + ')');
  is(/^u1\/[0-9a-f]{64}\.png$/.test(r1.path || ''), '보관함 자리는 「내 폴더/지문.png」 — 서버 규칙(제 폴더만)과 같다 (' + r1.path + ')');
  is(r1.title === '간병보험의 필요성' && /400~500/.test(r1.descr) && /간병비/.test(r1.tags) && r1.ai === true, 'AI 가 단 제목 · 설명 · 찾기 말이 그대로 적혔다 — 코드 울타리(```)를 걷고 읽음');
  is(A.ai === 1 && A.aiImg === 'image/jpeg', 'AI 는 한 번 — 그림은 줄인 JPEG 로 보냄');
  is(r1.uploader_name === '윤설계', '넣은 사람 이름이 적힌다(팀원 이름 · 고객 이름 아님)');

  sec('[3] 막는다 — 막으면 보관함에도 안 올린다 (1번 · 3번 · 5-1번 · 9번)');
  const D = await put({ kind:'img', name:'다른이름.png', ai: AI('x', 'y', 'z') });
  is(!D.o.ok && /이미 있는 자료/.test(D.o.msg) && /간병보험의 필요성/.test(D.o.msg) && D.calls.indexOf('upload bohum-lib') < 0 && D.ai === 0, '같은 그림을 이름만 바꿔 넣어도 안 받는다 — 무엇과 겹쳤는지 말한다 (' + D.o.msg.slice(0, 40) + '…)');
  const Y1 = await put({ kind:'pdf', name:'OO생명 보통약관.pdf', text:'' });
  is(!Y1.o.ok && /약관/.test(Y1.o.msg) && Y1.calls.indexOf('upload bohum-lib') < 0, '이름에 「약관」 — 안 받고 미끼 레이더 서재로 안내 (9번)');
  const Y2 = await put({ kind:'pdf', name:'상품자료.pdf', salt:'y2', text:'무배당 건강보험 보통약관\n제1조(목적) 이 계약은 …'.repeat(20) });
  is(!Y2.o.ok && /약관/.test(Y2.o.msg) && Y2.calls.indexOf('upload bohum-lib') < 0, '글에 「보통약관 · 제1조」 — 이름을 바꿔도 안 받는다');
  const N1 = await put({ kind:'img', name:'상담.png', color:'#00AA55', ai: AI('상담 메모', '홍길동 고객 상담 내용', '상담') });
  is(!N1.o.ok && /고객 이름/.test(N1.o.msg) && !/홍길동/.test(N1.o.msg) && N1.calls.indexOf('upload bohum-lib') < 0, 'AI 설명에 이 기기의 고객 이름 — 안 받는다 · 쪽지에도 이름은 가려 적는다 (3번)');
  const N2 = await put({ kind:'img', name:'연락처.png', color:'#AA0055', ai: AI('명함', '010-1234-5678 로 연락', '명함') });
  is(!N2.o.ok && /휴대폰/.test(N2.o.msg), '휴대폰 번호 — 안 받는다');
  const N3 = await put({ kind:'img', name:'증권.png', color:'#5500AA', ai: AI('증권 표지', '보험 증권', '증권', true) });
  is(!N3.o.ok && /개인정보/.test(N3.o.msg) && N3.calls.indexOf('upload bohum-lib') < 0, 'AI 가 개인정보를 봤다고 하면 — 안 받는다');
  const P1 = await put({ kind:'pdf', name:'치료비 통장 교육.pdf', salt:'p1', text:'치료비 통장은 진단비와 치료비를 나누어 준비하는 방법입니다. '.repeat(12), ai:'' });
  const P2 = await put({ kind:'pdf', name:'치료비 통장 교육(복사본).pdf', salt:'p2', text:'치료비 통장은 진단비와 치료비를  나누어 준비하는 방법입니다.\n'.repeat(12) });
  is(P1.o.ok && P1.ai === 0, '글이 있는 PDF — 글로 찾게 넣고 AI 는 안 부른다');
  is(!P2.o.ok && /글이 똑같은 자료/.test(P2.o.msg) && P2.calls.indexOf('upload bohum-lib') < 0, '바이트가 달라도 글이 같으면(빈칸만 다름) 안 받는다 — 글자 지문 (5-1번)');

  sec('[4] AI 가 없으면 — 지어내지 않고 그렇다고 말한다 (1번)');
  const Z = await put({ kind:'img', name:'8통장_구조도.png', color:'#123456', aiOn:false });
  const rz = await p.evaluate(() => window.__DB.bohum_lib.filter(x => /8통장/.test(x.title))[0] || {});
  is(Z.o.ok && rz.title === '8통장 구조도' && !rz.ai && !rz.descr && /AI 설명 없이/.test(Z.o.msg) && /✏️/.test(Z.o.msg), '파일 이름이 제목 · 설명은 빈칸 · 「AI 설명 없이 … ✏️ 로」 (' + Z.o.msg.slice(0, 30) + '…)');

  sec('[5] 서버를 아낀다 — 한 번만 · 다음엔 새 줄만 (7번)');
  const L = await p.evaluate(async () => {
    ALIB.loaded = false; ALIB.list = []; try { localStorage.removeItem('apex_alib_v1'); } catch(e){}
    const c0 = window.__CALLS.length;
    await Promise.all([alibLoad(), alibLoad()]); await alibLoad();
    const first = window.__CALLS.slice(c0).filter(x => /^select bohum_lib/.test(x));
    /* 다음 세션 — 메모리는 비고 이 기기 목록만 남음 */
    ALIB.loaded = false; ALIB.list = []; ALIB.url = {};
    const c1 = window.__CALLS.length;
    await alibLoad();
    return { first, next: window.__CALLS.slice(c1).filter(x => /^select bohum_lib/.test(x)), n: ALIB.list.length };
  });
  is(L.first.length === 1 && L.first[0] === 'select bohum_lib', '두 번 · 세 번 불러도 받기는 한 번 (' + L.first.join(',') + ')');
  is(L.next.length === 1 && L.next[0] === 'select bohum_lib gt' && L.n === 3, '다음 세션은 이 기기 목록 + 새로 넣은 줄만(gt) — 목록 ' + L.n + '개 그대로');

  sec('[6] 자비스가 찾는다 — 갈래 · 🖼 띠 · 누르면 그 자료');
  const outPut = [...outside];
  await p.evaluate(() => { try { BRAIN.hist = []; } catch(e){} go('apexmap'); });
  await p.waitForTimeout(2500);
  /* 자비스 화면은 제 글꼴을 받습니다 — 화면을 연 <b>뒤</b>부터 셉니다(check-jvvis 와 같은 자) */
  outside.clear();
  const f = p.frame({ url: /apex-map\.html/ });
  await f.evaluate(() => { ['gproxy','proxy','apikey','gkey','map_engine'].forEach(k => LS.del(k)); TTS.on = false; });
  const J = await f.evaluate(async () => {
    window.parent.aiReady = function(){ return false; };
    while (busy) await new Promise(r => setTimeout(r, 30));
    jLog.innerHTML = ''; ask('간병보험 그림 보여줘'); await new Promise(r => setTimeout(r, 150));
    const t = Date.now(); while (busy && Date.now() - t < 20000) await new Promise(r => setTimeout(r, 50));
    const c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop();
    const ths = [].slice.call(c.querySelectorAll('.j-vis .jv-th img'));
    for (const im of ths){ im.loading = 'eager'; }
    const t2 = Date.now(); while (ths.some(im => !im.complete) && Date.now() - t2 < 6000) await new Promise(r => setTimeout(r, 100));
    const srcs = [].slice.call(c.querySelectorAll('.jf-from, .jf-src')).map(x => x.textContent);
    const mine = ths.filter(im => /[?&]p=u1%2F/.test(im.getAttribute('src')));
    return { srcs, team: /간병보험의 필요성/.test(c.textContent), mine: mine.length, ok: mine.filter(im => im.naturalWidth > 0).length,
             cap: mine.map(im => im.alt).join(' / '), txt: c.textContent.replace(/\s+/g, ' ').slice(0, 2000) };
  });
  is(J.team, '「간병보험 그림 보여줘」 — 팀이 넣은 「간병보험의 필요성」 이 답에 선다');
  is(J.mine >= 1 && J.ok === J.mine && /간병보험의 필요성/.test(J.cap), '🖼 띠에 팀이 넣은 그림이 뜬다 — 서명한 주소로 실제로 그려짐 (' + J.cap + ')');
  const O = await f.evaluate(async () => {
    const P = window.parent; let opened = '', docked = 0;
    const ko = P.alibOpenItem, kd = P.jvDock;
    P.alibOpenItem = function(id){ opened = id; }; P.jvDock = function(){ docked++; };
    jLog.innerHTML = ''; ask('치료비 통장 교육'); await new Promise(r => setTimeout(r, 150));
    const t = Date.now(); while (busy && Date.now() - t < 20000) await new Promise(r => setTimeout(r, 50));
    const bt = [].slice.call(document.querySelectorAll('#jLog .jr-open')).filter(x => /이 자료 열기/.test(x.textContent))[0];
    if (bt) bt.click();
    await new Promise(r => setTimeout(r, 200));
    P.alibOpenItem = ko; P.jvDock = kd;
    const row = P.ALIB.list.filter(x => x.kind === 'pdf')[0];
    return { btn: !!bt, opened, want: row && row.id, docked };
  });
  is(O.btn && O.opened && O.opened === O.want, '「치료비 통장 교육」 — PDF 가 서고 「📄 이 자료 열기」 를 누르면 그 자료가 열린다');
  is(O.docked === 0, '새 창으로 여는 것이라 자비스를 띠로 접지 않는다');

  /* 아카데미 교재는 제 글꼴 · 그림 틀을 받습니다 — 이 칸이 부른 것이 아니니 그 <b>앞</b>까지만 셉니다 */
  const outBefore = [...outside];
  sec('[7] 칸 — 아카데미 띠의 단추 · 남의 것 · 폰 폭');
  await p.evaluate(() => go('bohum')); await p.waitForTimeout(600);
  const U = await p.evaluate(async () => {
    const btn = [].slice.call(document.querySelectorAll('#bohumScreen .fin-float button')).filter(x => /자료 넣기/.test(x.textContent))[0];
    window.__DB.bohum_lib.push({ id:'other', kind:'img', title:'남이 넣은 그림', descr:'', tags:'', path:'u2/aaa.png', sha:'aaa', uploader:'u2', uploader_name:'김팀원', created_at:'2026-11-12T09:00:00Z' });
    ALIB.loaded = false; try { localStorage.removeItem('apex_alib_v1'); } catch(e){}
    if (btn) btn.click();
    await new Promise(r => setTimeout(r, 400));
    const o = document.getElementById('alibOvl'), items = [].slice.call(o.querySelectorAll('.alib-item'));
    const other = items.filter(x => /남이 넣은 그림/.test(x.textContent))[0], mine = items.filter(x => /간병보험의 필요성/.test(x.textContent))[0];
    const box = o.querySelector('.alib-box');
    return { btn: !!btn, on: o.classList.contains('on'), n: items.length, drop: !!o.querySelector('#alibInp'),
             otherDel: other ? /지우기/.test(other.textContent) : null, mineDel: mine ? /지우기/.test(mine.textContent) : null,
             warn: /원수사 약관/.test(o.textContent) && /고객 이름/.test(o.textContent),
             over: box.scrollWidth - box.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  is(U.btn && U.on && U.drop, '아카데미 띠의 「📥 자료 넣기」 → 넣는 칸이 열린다(파일 고르기 · 끌어 놓기)');
  is(U.n === 4, '팀 자료 넷이 다 보인다 (' + U.n + ')');
  is(U.mineDel === true && U.otherDel === false, '내가 넣은 것엔 지우기 · 남이 넣은 것엔 없음(서버도 넣은 사람 · 대표만)');
  is(U.warn, '넣기 전에 「원수사 약관 · 고객 이름은 안 받습니다」 를 먼저 말한다');
  is(U.over <= 0 && U.doc <= 0, '390px 폭에서 옆으로 안 넘친다 (칸 ' + U.over + ' · 문서 ' + U.doc + ')');
  is(outPut.length === 0 && outBefore.length === 0, '넣기 · 자비스 찾기에서 밖으로 나간 부름 0 — 진짜 서버 · AI 를 안 불렀다 (' + outPut.concat(outBefore).join(' ') + ')');
  is(errs.length === 0, '화면 오류 0 (' + errs.slice(0, 2).join(' | ') + ')');

  await b.close(); srv.close();
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남' : '✓ 모두 맞음'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
