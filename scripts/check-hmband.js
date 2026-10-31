/* ══ 📇 check-hmband — 한 장 띠: 연락부터 관리까지 (판 X275) ══════════════
   사장님 말씀 (2026-10-31) — 「핸드폰이나 컴퓨터로 조금 더 효율성 있게 …
   보험설계사가 <b>이 한 장으로 모든 고객을 연락부터 관리까지</b> 하고 싶다를
   어필하고 싶다」 → 재어 여쭈니 「맨 위 한 장 띠」 + 「고객관리 / 만남관리 /
   연락관리 / 상황별 맞는 메뉴추천 / 설계사에게 질문 또는 권유 하면서 고객을
   터치할 포인트」.

   묻는 것
     [1] 띠가 <b>「지금 할 것」 바로 위</b>에 서나 · 폰 첫 화면 안인가
     [2] 「고객 N분」 이 <b>arStageN 의 수 그대로</b>인가 · 못 읽었으면 수를 안 적나 (1번)
     [3] 단계 칸이 <b>표(HM_FLOW) 그대로</b> · 사람 말(연락·만남…)로 · 누르면 CRM 으로 가나
     [4] 네 문 — 연락관리 · 만남관리 · 고객관리 · 맞는 메뉴 — 이 다 서고 <b>누르면 어딘가로</b> 가나
     [5] 🧭 맞는 메뉴가 <b>tdoTools 의 첫 도구</b>인가 (표를 새로 안 만들었나 · 5번)
     [6] 💡 묻는 한 줄이 서고 <b>이름을 가리나</b> (3번) · 할 말이 없으면 줄을 안 세우나 (1번)
     [7] 같은 수가 <b>한 화면에 두 번</b> 안 서나 — 단계 칩은 띠에만 (5번)
     [8] 손가락 — 누르는 자리가 다 44px 이상인가 · 폰에서 옆으로 안 새나
     [9] 컴퓨터 — 띠가 <b>두 기둥 위 한 줄</b>인가
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9047;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 견본 — 이름은 「홍길동」 (3번). 단계마다 사람을 심고, PC 한 분은 <b>9일째</b>라
   💡 줄이 「막힌 데」 를 집어야 합니다. 미접촉·계약완료도 섞습니다 — 「고객 N분」 은
   <b>길 위</b>가 아니라 <b>맡은 전부</b>라서, 둘이 같으면 그 차이를 못 잽니다 (8번). */
const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); localStorage.removeItem('apex_hm_fold_v1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ CM.loaded=true; if(cb)cb(); };
  window.osCliInfoLoad=function(){}; window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  window.TOASTS=[]; window.toast=function(t){ TOASTS.push(''+t); };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err=''; OSC.reps=[]; OSC.list=[];
  CM.loaded=true; CM.meta={};
  AR.loaded=true; AR.busy=''; AR.cliRows=[];
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  const me = (typeof arMyId==='function') ? arMyId() : 'me';
  const row = (id, stage, days, nm) => ({ id:id, who:me, name:nm, region:'강남구',
    src:'보장분석10DB', stage:stage, cAt:'', pAt:'', got:ago(60), n:1,
    last:ago(days), res:'상담', appt:'', memo:'', days:days });
  AR.db=[ row('d1','TA',2,'홍길동A'), row('d2','AP',1,'홍길동B'), row('d3','AP',3,'홍길동C'),
          row('d4','PC',9,'홍길동D'), row('d5','CS',2,'홍길동E'), row('d6','CS',4,'홍길동F'),
          row('d7','증권전달',5,'홍길동G'), row('d8','계약완료',6,'홍길동H'),
          row('d9','미접촉',30,'홍길동I') ];
  try{ osHideLoginGate(); }catch(e){}
  try{ document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove()); }catch(e){}
  HWHO.id=''; go('home');
};

const BAND = () => {
  const bd = document.querySelector('#dynPane #hmBand');
  if (!bd) return { 없음: true };
  const r = bd.getBoundingClientRect();
  const job = document.querySelector('#dynPane #hmJobHost');
  /* 차례는 <b>DOM 그대로</b> 봅니다 — 팀이 없는 씨에서는 고르개가 빈 칸(0px)이라
     높이로 거르면 고르개가 빠져 「차례가 틀렸다」 는 헛 빨간불이 켜집니다 (8번). */
  const kids = [...document.querySelector('#dynPane .tz').children].map(e => e.id || e.className);
  const 머리 = bd.querySelector('[data-ask="맡은고객몇분"]');
  const 칩 = [...bd.querySelectorAll('.t-chips.hm-flow > .t-chip')];
  const 문 = [...bd.querySelectorAll('.hm-band-d')];
  const 누름 = [...bd.querySelectorAll('button')];
  const ask = bd.querySelector('.hm-band-ask');
  return {
    top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width),
    jobTop: job ? Math.round(job.getBoundingClientRect().top + scrollY) : -1,
    차례: kids.join(' · '),
    머리: 머리 ? 머리.textContent.replace(/\s+/g, ' ').trim() : '',
    tot: (arStageN(hwhoFor()) || {}).tot,
    칩: 칩.map(e => ({ t: e.textContent.replace(/\s+/g, ' ').trim(), tag: e.tagName,
                       on: e.getAttribute('onclick') || '' })),
    표: HM_FLOW.map(x => ({ k: x.k, say: x.say, n: (arStageN(hwhoFor()).c[x.k] || 0) })),
    문: 문.map(e => e.querySelector('.t').textContent.trim()),
    작은: 누름.filter(e => e.getBoundingClientRect().height < 44)
             .map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 14)),
    ask: ask ? ask.textContent.replace(/\s+/g, ' ').trim() : '',
    옆샘: document.documentElement.scrollWidth > innerWidth + 1,
    글: bd.innerText.replace(/\s+/g, ' ')
  };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const open = async (w, h) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
    await p.waitForTimeout(1200);
    await p.evaluate(SEED); await p.waitForTimeout(1200);
    return { ctx, p, errs };
  };

  const P = await open(390, 844);
  const A = await P.p.evaluate(BAND);

  console.log('\n[1] 띠가 <b>「지금 할 것」 바로 위</b>에 서나 (폰 390)');
  is(!A.없음, '  📇 <b>한 장 띠</b>가 홈에 선다 — ' + (A.없음 ? '없습니다' : (A.h + 'px')));
  if (A.없음) { console.log('\n✗ 띠가 없어 더 재지 않습니다'); await b.close(); srv.close(); process.exit(1); }
  /* 판 X278 — 「지금 할 것」 은 이제 한 테두리(#hmJobWrap) 안의 #hmJobHost 입니다 */
  is(/hmWhoHost · hmBandHost · (hmJobHost|hmJobWrap)/.test(A.차례),
     '  차례가 <b>팀원 고르개 → 띠 → 지금 할 것</b> — ' + A.차례.split(' · ').slice(0, 3).join(' → '));
  is(A.top + A.h <= 844, '  띠가 <b>폰 첫 화면 안</b>에 다 든다 — y' + A.top + '~' + (A.top + A.h));
  /* 띠가 부풀면 「지금 할 것」 이 첫 화면 밖으로 밀립니다. 잰 값 238px — 선은 260 */
  is(A.h <= 260, '  띠가 <b>260px 안</b>이다 — ' + A.h + 'px (「지금 할 것」 을 첫 화면 밖으로 밀지 않게)');

  console.log('\n[2] 「고객 N분」 이 <b>arStageN 의 수 그대로</b>인가');
  is(A.머리 === '고객 ' + A.tot + '분', '  머리가 「고객 ' + A.tot + '분」 — ' + (A.머리 || '(없음)'));
  is(A.tot === 9, '  ★ <b>맡은 전부</b>를 센다 — 미접촉·계약완료까지 9분 (길 위 7분이 아닙니다) · ' + A.tot);
  is(/연락부터 관리까지/.test(A.글), '  ★ <b>「연락부터 관리까지 이 한 장에서」</b> 를 적는다');
  const 못읽 = await P.p.evaluate(() => { const d = AR.db; AR.db = null;
    const h = hmBandHtml(); AR.db = d; return h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '); });
  is(/못 읽었습니다/.test(못읽) && !/고객 \d+분|고객 0분/.test(못읽),
     '  ★ 못 읽었으면 <b>수를 안 적는다</b> — 「고객 0분」 이 아닙니다 (1번)');

  console.log('\n[3] 단계 칸이 <b>표 그대로</b> · 사람 말로 · 누르면 CRM');
  const 단계칩 = A.칩.filter(c => !/지남/.test(c.t));
  is(단계칩.length === A.표.length && A.표.every((x, i) => 단계칩[i] &&
       단계칩[i].t === x.n + ' ' + (단계칩[i].t.split(' ')[1]) + ' ' + x.say + ' ' + x.k),
     '  칸이 <b>HM_FLOW 차례 · 수 · 사람 말</b> 그대로 — ' + 단계칩.map(c => c.t).join(' | '));
  is(A.표.every(x => !!x.say), '  표의 단계마다 <b>사람 말(say)</b>이 있다 — ' + A.표.map(x => x.say).join('·'));
  is(단계칩.every(c => c.tag === 'BUTTON' && /go\('crm'\)/.test(c.on)),
     '  ★ 칸이 <b>단추</b>이고 누르면 <b>DB 통합 CRM</b> 으로 간다');
  const went = await P.p.evaluate(() => { const e = document.querySelector('#hmBand .t-chips.hm-flow .t-chip');
    e.click(); const t = (typeof lastTab !== 'undefined') ? lastTab : ''; go('home'); return t; });
  is(went === 'crm', '  눌러 보니 <b>crm</b> 으로 갔다 — ' + went);

  console.log('\n[4] 네 문 — <b>연락 · 만남 · 고객 · 맞는 메뉴</b>');
  is(A.문.join('·') === '연락관리·만남관리·고객관리·맞는 메뉴', '  넷이 다 선다 — ' + A.문.join(' · '));
  const 문간 = await P.p.evaluate(async () => {
    const out = [];
    for (let i = 0; i < HM_BAND_DOOR.length; i++) {
      go('home'); await new Promise(r => setTimeout(r, 250));
      scrollTo(0, 0); await new Promise(r => setTimeout(r, 80));
      const d = HM_BAND_DOOR[i], t0 = lastTab;
      const el = d.to ? document.getElementById(d.to) : null;
      const y0 = el ? Math.round(el.getBoundingClientRect().top) : null;
      document.querySelectorAll('#hmBand .hm-band-d')[i].click();
      await new Promise(r => setTimeout(r, 900));
      /* 홈 안의 칸으로 가는 문은 <b>그 칸이 화면 위쪽으로 올라왔는지</b>를 봅니다 —
         창이 아니라 안쪽 판이 굴러서 scrollY 로는 못 잽니다(재어 보고 알았습니다). */
      const y1 = (el && lastTab === t0) ? Math.round(el.getBoundingClientRect().top) : null;
      out.push({ i, tab: lastTab,
                 moved: lastTab !== t0 || (y0 !== null && y1 !== null && y1 < y0 - 40 && y1 >= -4 && y1 < 300),
                 y: y1 === null ? '' : (y0 + '→' + y1) });
    }
    go('home'); return out;
  });
  is(문간.every(x => x.moved), '  ★ 넷 다 <b>누르면 어딘가로 간다</b> — ' +
     문간.map(x => HM_BAND_DOOR_T(x.i) + '→' + (x.tab === 'home' ? ('y' + x.y) : x.tab)).join(' · '));
  function HM_BAND_DOOR_T(i) { return A.문[i] || i; }

  console.log('\n[5] 🧭 맞는 메뉴가 <b>tdoTools 의 첫 도구</b>인가 (5번)');
  const M = await P.p.evaluate(() => {
    const r = hmNext(), x = r && r.x, k = x ? ((x.k === 'db') ? x.tk : x.k) : '';
    const L = (x && typeof tdoTools === 'function') ? (tdoTools(k) || []) : [];
    const m = hmBandMenu();
    const d = document.querySelectorAll('#hmBand .hm-band-d')[3];
    return { want: L.length ? L[0].id : 'tools', got: m.id, t: m.t,
             aria: d ? d.getAttribute('aria-label') : '' };
  });
  is(M.got === M.want, '  지금 할 것의 상황에 맞는 도구 — ' + M.t + ' (' + M.got + ' · tdoTools 첫 것 ' + M.want + ')');
  is(M.aria.indexOf(M.t) >= 0, '  ★ 무엇으로 가는지 <b>말로 적는다</b> — ' + M.aria);
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const i0 = SRC.indexOf('function hmBandMenu('), i1 = SRC.indexOf('\nfunction ', i0 + 10);
  const 몸 = SRC.slice(i0, i1).replace(/\/\*[\s\S]*?\*\//g, '');
  is(/tdoTools\(/.test(몸) && !/\[\s*\{\s*id\s*:/.test(몸),
     '  ★ 고르는 표를 <b>새로 안 만들었다</b> — tdoTools 를 부른다');

  console.log('\n[6] 💡 <b>묻는 한 줄</b> — 고객을 터치할 자리 하나');
  is(/막힌 데/.test(A.ask) && /9일째/.test(A.ask), '  가장 오래 선 분을 집어 묻는다 — ' + A.ask.slice(0, 50));
  is(/\?|요\?|까요/.test(A.ask), '  ★ <b>묻는 말</b>이다 — 결론이 아니라 여쭙니다');
  is(A.ask.indexOf('홍길동D') < 0 && /[○*]/.test(A.ask), '  ★ 이름을 <b>가린다</b> (3번)');
  const 빈 = await P.p.evaluate(() => { const d = AR.db; AR.db = d.map(r => Object.assign({}, r, { days: 1 }));
    const pt = window.hmPtClause; window.hmPtClause = function () { return ''; };
    const h = hmBandAskHtml(hwhoFor()); AR.db = d; window.hmPtClause = pt; return h; });
  is(빈 === '', '  ★ 할 말이 없으면 <b>줄을 안 세운다</b> — 지어서 채우지 않습니다 (1번)');

  console.log('\n[7] 같은 수가 <b>한 화면에 두 번</b> 안 서나 (5번)');
  const 두번 = await P.p.evaluate(() => document.querySelectorAll('#dynPane .t-chips.hm-flow').length);
  is(두번 === 1, '  단계 칸 줄이 홈에 <b>하나뿐</b>이다 — ' + 두번 + '줄');
  const 카드칩 = await P.p.evaluate(() => { const c = document.querySelector('#dynPane #hmFlow');
    return c ? c.querySelectorAll('.t-chip').length : -1; });
  is(카드칩 === 0, '  📊 상담현황 카드에는 <b>칩이 안 남았다</b> — 띠로 올라갔습니다 · ' + 카드칩);
  const 막힌 = await P.p.evaluate(() => (document.querySelector('#dynPane').innerText.match(/막힌 데/g) || []).length);
  is(막힌 === 1, '  「막힌 데」 도 <b>한 번만</b> 선다 — ' + 막힌 + '번');

  console.log('\n[8] 손가락 · 옆으로 안 새나 (폰)');
  is(A.작은.length === 0, '  누르는 자리가 다 <b>44px 이상</b> — ' + (A.작은.length ? A.작은.join(' · ') : '작은 것 없음'));
  is(!A.옆샘, '  폰에서 <b>옆으로 안 샌다</b>');
  is(P.errs.length === 0, '  오류 없이 선다' + (P.errs.length ? (' ← ' + P.errs[0]) : ''));

  console.log('\n[9] 컴퓨터 1280 — 띠가 <b>두 기둥 위 한 줄</b>인가');
  const C = await open(1280, 900);
  const B = await C.p.evaluate(() => {
    const t = document.querySelector('#dynPane .tz').getBoundingClientRect();
    const bd = document.querySelector('#hmBand').getBoundingClientRect();
    const j = document.querySelector('#hmJobHost').getBoundingClientRect();
    const s = document.querySelector('#hmSideUp').getBoundingClientRect();
    const g = document.querySelector('#hmBand .t-chips.hm-flow');
    const cs = [...g.children].map(e => Math.round(e.getBoundingClientRect().top));
    return { tw: Math.round(t.width), bw: Math.round(bd.width), bb: Math.round(bd.bottom),
             jt: Math.round(j.top), st: Math.round(s.top), 줄: new Set(cs).size,
             s: [...document.querySelectorAll('#hmBand .hm-band-d .s')].map(e => getComputedStyle(e).display) };
  });
  is(Math.abs(B.bw - B.tw) <= 2, '  띠가 <b>두 기둥 폭을 다</b> 쓴다 — ' + B.bw + ' / ' + B.tw + 'px');
  is(B.jt >= B.bb && B.st >= B.bb, '  「지금 할 것」 과 곁칸이 <b>띠 밑에서</b> 나란히 시작한다 — y' + B.jt + ' · y' + B.st);
  is(B.줄 === 1, '  단계 칸이 <b>한 줄</b>로 선다 — ' + B.줄 + '줄');
  is(B.s.every(x => x !== 'none'), '  넓은 화면에서는 문 밑 <b>작은 글</b>(어디로 가는지)도 선다');
  is(C.errs.length === 0, '  오류 없이 선다' + (C.errs.length ? (' ← ' + C.errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n' + (bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 📇 한 장 띠 — 연락부터 관리까지 한 장에 섭니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
