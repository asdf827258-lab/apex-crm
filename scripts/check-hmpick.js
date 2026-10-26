/* ══════════════════════════════════════════════════════════════════
   check-hmpick.js (판 X193) — 🎯 <b>「오늘」 칸에서 바로 고르나</b>.
   🗂️ 상황(칸) · 🎂 나이대를 그 자리에서 고르고, 고른 대로 기사가 바뀌나.

   사장님 말씀 (2026-10-25) — 「<b>오늘 칸에서도</b> 그 뉴스들을 같이 맞춰서
   <b>나이대와 상황에 맞추어서 뉴스 선택</b>할 수 있도록 띄워 줄거지?」

   ── 이 자가 걱정하는 것 ────────────────────────────────────────────
   ⓐ <b>자리를 먹는 것.</b> 홈은 4.2화면 선에 남은 자리가 <b>11px</b> 뿐입니다
      (check-homeone). 그래서 고르개는 <b>접힌 채로 0px</b> 여야 합니다.
      실제로 「🎯 골라 보기」 단추를 단추 줄에 세웠다가 셋이 한 줄에 안 들어
      3,529 → <b>3,579px</b>(4.24화면)가 되는 것을 재어 보고 뺐습니다.
      ⚠ 홈 <b>총</b> 높이는 여기서 안 잽니다 — check-homeone 하나가 봅니다 (5번).
        여기서는 <b>이 칸이 접힌 채로 0px 인가</b>만 봅니다.
   ⓑ <b>열 길이 없는 것.</b> 접어 두고 여는 자리를 안 만들면 그냥 없는 것과
      같습니다. 「다 됐다」 로 보이는 상태에서 고칠 단추를 감추지 않습니다 (6번).
   ⓒ <b>둘 중 하나만 되는 것.</b> 사장님은 <b>나이대와 상황</b> 둘을 말씀하셨습니다.
      칸만 되고 연령대가 없으면 반만 한 것입니다.
   ⓓ <b>골라도 안 바뀌는 것.</b> 「저축」 을 골랐는데 보험 기사가 그대로 서
      있으면, 고르신 것이 안 먹은 줄 아십니다 (1번).
   ⓔ <b>두 화면이 다른 말을 하는 것.</b> 홈에서 고른 것이 뉴스 화면과
      달라지면 어느 것이 맞는지 알 수 없습니다 (5번). 상태는 NLIVE 하나입니다.
   ⓕ <b>짝퉁 표.</b> 홈이 제 칸 이름·제 연령대 이름을 따로 가지면, 뉴스 화면이
      바뀌어도 홈은 옛 이름을 말합니다. 이름은 apex-newsfit.js 한 곳입니다 (5번).
   ⓖ <b>이유를 안 적는 것.</b> 사장님 말씀 「연령대에 맞게 <b>추천이유까지</b>」
      (2026-10-24). 고르는 자리에 까닭이 같이 서야 고를 수 있습니다.
   ⓗ <b>손가락.</b> 글 속의 토막이라도 눌러야 하니 <b>44px</b> 는 되어야 합니다 —
      다만 <b>줄 높이를 늘리지 않고</b>(안쪽 여백은 줄 상자를 안 키웁니다).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8938;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript',
               '.css':'text/css', '.json':'application/json' };
/* ★ <b>글꼴·라이브러리 CDN 은 「바깥」 이 아닙니다.</b> 걱정하는 것은
   <b>사장님 서버</b>(Supabase·넷리파이 함수)를 점검이 읽는 것입니다.
   페이지가 제 글꼴을 받아 오는 것까지 세면 <b>헛것</b>이 됩니다 (8번) —
   check-hmpoint·check-conthub 가 쓰는 그 규약을 그대로 씁니다.         */
const 정적 = /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr\.net|cdnjs\.cloudflare|unpkg\.com/;
let 바깥 = 0;
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);

/* 씨 — 기사 다섯. 칸도 연령대도 <b>갈리게</b> 둡니다.
   ★ 고객 이름이 아니라 <b>기사 제목</b>이라 그대로 씁니다 (3번).
   ★ 연령대는 기사가 <b>제 입으로</b> 말한 낱말로 걸립니다 — 제목에 그
     낱말이 있어야 합니다(「청년」·「출산」·「기초연금」). 나이로 짐작하지
     않습니다 (1번 · nlWhyHtml 위 쪽지).                                 */
const NEWS = [
  { t: '실손보험 청구 전산화 2단계 시행 — 의원급 확대', s: '연합뉴스', d: '2026-10-21', u: 'https://example.com/a', cats: ['ins'] },
  { t: '기준금리 동결 … 가계대출 관리 강화',             s: '한국경제', d: '2026-10-20', u: 'https://example.com/b', cats: ['econ'] },
  { t: '청년도약계좌 만기 앞두고 갈아타기 문의 늘어',     s: '뉴시스',   d: '2026-10-19', u: 'https://example.com/c', cats: ['save'] },
  { t: '기초연금 수급자 연금저축 활용 늘어',             s: '연합뉴스', d: '2026-10-18', u: 'https://example.com/d', cats: ['save'] },
  { t: '출산지원금 지자체별 확대 개편안 발표',           s: '뉴스1',   d: '2026-10-17', u: 'https://example.com/e', cats: ['help'] }
];
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients',
  'osCliInfoLoad','osRepListLoad','chkLoad'].forEach(function(k){window[k]=function(){};});
 window.toast=function(m){window.__T=m;};
 window.setupDone=function(){return true;};window.setupCanRun=function(){return true;};
 window.setupShow=function(){return false;};window.osTabAllowed=function(){return true;};
 window.cmLoadAll=function(cb){if(cb)cb();};
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',user_id:'me',name:'홍길동',role:'owner',user_role:'owner',team:'A',active:true,plan:'pro'};
 window.osClient=function(){var mk=function(){var a={};
   ['select','order','limit','in','is','eq','neq','not','gte','lte','update','insert','upsert','delete','single','range','or','filter']
     .forEach(function(k){a[k]=function(){return a;};});
   a.then=function(f){return Promise.resolve({data:[],error:null}).then(f);};return a;};
   return {from:function(){return mk();},rpc:function(){return Promise.resolve({data:null,error:null});}};};
 CM.loaded=true;CM.who={me:'홍길동'};CM.pick='';CM.picked=true;
 AR.loaded=true;AR.busy='';AR.calls=[];AR.rep={};
 AR.cliRows=[{id:'c1',name:'홍길동가',nm:'홍길동가'}];
 AR.db=[{id:'d1',who:'me',name:'홍길동가',stage:'AP',days:2,region:'서울',src:'일반'},
        {id:'d2',who:'me',name:'홍길동나',stage:'PC',days:3,region:'서울',src:'일반'}];
 OSC.loaded=true;OSC.busy=false;OSC.err='';
 OSC.list=[{id:'c1',name:'홍길동가',phone:'010'}];
 CHKS.busy=false;CHKS.err='';CHKS.rows=[];CHKS.fin={};CHKS.by={};
 HWHO.id='';
 try{ localStorage.setItem('apex_newslive',JSON.stringify(
        {at:'2026-10-25 09:00',got:${NEWS.length},drop:0,items:${JSON.stringify(NEWS)}}));
      localStorage.removeItem('apex_hm_ig_v1');
      localStorage.removeItem('apex_hm_fold_v1');
      localStorage.removeItem('apex_newspick'); }catch(e){}
 if(typeof nlLoad==='function')nlLoad();
 go('home');`;

/* 화면에서 꺼내 오는 것 — <b>생김새가 아니라 사람이 보는 것</b>으로 */
const 본 = async (p) => await p.evaluate(() => {
  const el  = (q) => document.querySelector(q);
  const hgt = (e) => e ? Math.round(e.getBoundingClientRect().height) : -1;
  const nw  = el('.hm-nw');
  const pk  = el('#hmNwPick');
  const op  = el('.hm-nw-t .hm-nw-o');
  return {
    소식칸: !!nw,
    소식키: hgt(nw),
    /* ★ 판 X199 — 기사 제목이 <b>제 줄(.hm-nw-ti)</b>로 내려갔습니다. 칸을
       고르실 때 줄이 하나 늘었다 줄었다 하던 것을 막은 자리입니다(check-nlpick).
       <b>머리줄과 제목 줄을 함께</b> 읽습니다 — 글은 한 자도 안 바뀌었습니다. */
    제목: (((el('.hm-nw-t') || {}).innerText || '') + ' ' +
           ((el('.hm-nw-ti') || {}).innerText || '')).trim(),
    /* 여는 토막 */
    여는토막: !!op,
    여는글: op ? (op.innerText || '').trim() : '',
    여는태: op ? op.tagName : '',
    여는폈나: op ? op.getAttribute('aria-expanded') : '',
    여는키: hgt(op),
    /* 누르는 넓이 — 글 상자가 아니라 <b>실제로 눌리는</b> 넓이 */
    누를키: op ? Math.round(Math.max.apply(null,
              [].map.call(op.getClientRects(), r => r.height).concat([0]))) : -1,
    /* 고르개 칸 */
    고르개: !!pk,
    고르개숨: pk ? !!pk.hidden : null,
    고르개키: pk ? Math.round(pk.getBoundingClientRect().height) : -1,
    고르개봄: pk ? (pk.offsetParent !== null) : null,
    칸칩: [].map.call(document.querySelectorAll('#hmNwPick .hm-nw-g .nl-chip'),
                      b => (b.innerText || '').replace(/\s+/g, ' ').trim()),
    나이칩: [].map.call(document.querySelectorAll('#hmNwPick .nl-age .nl-chip'),
                        b => (b.innerText || '').replace(/\s+/g, ' ').trim()),
    이유: [].map.call(document.querySelectorAll('#hmNwPick .nl-why'),
                      d => (d.innerText || '').replace(/\s+/g, ' ').trim()),
    작은칩: (() => { let n = 0; document.querySelectorAll('#hmNwPick .nl-chip')
              .forEach(b => { if (Math.round(b.getBoundingClientRect().height) < 30) n++; }); return n; })(),
    작은글: (() => { let n = 0; if (!pk) return -1;
              [pk, ...pk.querySelectorAll('*')].forEach(e => {
                if (!(e.textContent || '').trim()) return;
                const px = parseFloat(getComputedStyle(e).fontSize || '0');
                if (px > 0 && px < 13) n++; }); return n; })(),
    cat: (typeof NLIVE !== 'undefined') ? NLIVE.cat : '?',
    age: (typeof NLIVE !== 'undefined') ? NLIVE.age : '?'
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return r.continue();
    if (!정적.test(u)) { 바깥++; try{ (global.__U = global.__U || []).push(u.slice(0, 100)); }catch(e){} }
    return r.abort();
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
  await p.waitForTimeout(2600);
  await p.evaluate(SEED); await p.waitForTimeout(2400);

  console.log('🎯 「오늘」 칸에서 바로 고르나 — 🗂️ 상황 · 🎂 나이대 (판 X193)');

  /* ── [1] 접힌 채로 0px ─────────────────────────────────────────── */
  head('[1] 📏 <b>접힌 채로는 자리를 안 먹는다</b> — 홈에 남은 자리는 11px 뿐이다');
  const a = await 본(p);
  is(a.소식칸, '  📰 <b>오늘 보낼 소식</b> 줄이 선다');
  is(a.고르개, '  🎯 고르개 칸이 <b>있다</b> — 접혀 있을 뿐이다');
  is(a.고르개숨 === true, '  처음에는 <b>접혀</b> 있다 (홈 규칙 — 처음에는 다 접힌 채로)');
  is(a.고르개봄 === false,
     '  접혔으면 <b>안 보인다</b> — .hm-nw-pk 는 display 를 또렷이 적으므로 [hidden] 도 짝으로 있어야 한다');
  is(a.고르개키 === 0, '  접힌 고르개의 키 <b>' + a.고르개키 + 'px</b> — 0 이어야 한다');

  /* ── [2] 열 길이 있나 ──────────────────────────────────────────── */
  head('[2] 🔓 <b>열 길이 있다</b> — 접어 두고 여는 자리를 안 만들면 없는 것과 같다 (6번)');
  is(a.여는토막, '  제목 줄에 <b>누를 수 있는 토막</b>이 있다');
  is(a.여는태 === 'SPAN',
     '  그 토막은 <b>&lt;' + (a.여는태 || '?').toLowerCase() + '&gt;</b> 다 — 단추로 바꾸면 글 속에서 안 쪼개져 줄이 는다');
  is(/▾/.test(a.여는글), '  접혔을 때 <b>▾</b> 를 보여 준다 — 「' + a.여는글 + '」');
  is(a.여는폈나 === 'false', '  aria-expanded 가 <b>false</b> 다 — 읽어 주는 기기도 접힌 줄 안다');
  /* ★★ <b>40 이 아니라 44 입니다.</b> 2026-10-25 에 12px 여백으로 올렸더니
     제 기계에서는 41px 인데 <b>CI 에서는 39px</b> 였습니다 — 글꼴이 달라 줄이
     2px 낮았습니다. 누르는 넓이가 글꼴에 매여 아슬아슬하면 그 자는 기계마다
     다른 말을 합니다. 여백을 올려 <b>사장님 손가락 바닥(44px)</b> 을 그대로
     묻습니다 — 자를 무르게 하지 않고 또렷하게 합니다 (8번 · 판 X146·X147).  */
  is(a.누를키 >= 44,
     '  누르는 넓이 <b>' + a.누를키 + 'px</b> — 손가락이 닿는다 (44px 이상 · 판 X146·X147 의 바닥)');
  /* ★★ <b>여기서 「토막의 키」 를 재면 헛것입니다.</b> 글 속 토막은 안쪽
     여백이 <b>줄 상자 밖으로 넘치</b>므로 토막의 키(41px)는 커지는 것이
     맞습니다. 물어야 할 것은 <b>그 줄이 커졌나</b> 입니다 — 그래서
     <b>여백을 뗐다 붙였다 하며</b> 소식 칸의 키를 견줍니다 (8번).      */
  const 여백 = await p.evaluate(() => {
    const nw = document.querySelector('.hm-nw');
    const L = document.querySelectorAll('.hm-nw-t .hm-nw-k');
    const h0 = Math.round(nw.getBoundingClientRect().height);
    const 옛 = [];
    L.forEach(e => { 옛.push(e.style.padding); e.style.padding = '0'; });
    const h1 = Math.round(nw.getBoundingClientRect().height);
    L.forEach((e, i) => { e.style.padding = 옛[i]; });
    return { 붙인키: h0, 뗀키: h1 };
  });
  is(여백.붙인키 === 여백.뗀키,
     '  그 여백이 <b>줄 상자를 안 키운다</b> — 붙여도 ' + 여백.붙인키 +
     'px, 떼도 ' + 여백.뗀키 + 'px (inline 의 위아래 여백은 줄 밖으로 넘칩니다)');

  /* ── [3] 펴면 셋이 다 선다 ─────────────────────────────────────── */
  head('[3] 🗂️🎂 <b>펴면 상황과 나이대가 같이 선다</b> — 사장님이 말씀하신 둘');
  const 접힌키 = a.소식키;
  await p.evaluate(() => hmNwPickToggle());
  await p.waitForTimeout(400);
  const o = await 본(p);
  is(o.고르개숨 === false && o.고르개봄 === true, '  눌렀더니 <b>펴진다</b>');
  is(o.소식키 > 접힌키,
     '  소식 줄이 ' + 접힌키 + ' → <b>' + o.소식키 + 'px</b> — 접었을 때 정말 0px 였다는 뜻이다');
  is(o.칸칩.length >= 5,
     '  🗂️ <b>상황 칸이 ' + o.칸칩.length + '개</b> — 전체 + 앞줄 넷 (' + o.칸칩.join(' · ') + ')');
  is(o.나이칩.length >= 4,
     '  🎂 <b>나이대가 ' + o.나이칩.length + '개</b> (' + o.나이칩.join(' · ') + ')');
  is(o.이유.length >= 1,
     '  🎂 <b>왜 그 나이대인지</b>도 같이 선다 — 「' + (o.이유[0] || '').slice(0, 46) + '…」');
  is(o.작은칩 === 0, '  칩이 <b>작지 않다</b> — 30px 미만 ' + o.작은칩 + '개');
  is(o.작은글 === 0, '  <b>13px 미만 글씨가 없다</b> — ' + o.작은글 + '곳 (판 X146·X147 의 바닥)');
  is(/▴/.test(o.여는글) && o.여는폈나 === 'true',
     '  펴면 토막도 <b>▴</b> 로 바뀐다 — 「' + o.여는글 + '」');

  /* ── [4] 고른 대로 기사가 바뀐다 ───────────────────────────────── */
  head('[4] 🔁 <b>고른 대로 기사가 바뀐다</b> — 안 바뀌면 안 먹은 줄 아신다 (1번)');
  const 처음제목 = o.제목;
  await p.evaluate(() => nlSetCat('save'));
  await p.waitForTimeout(500);
  const s1 = await 본(p);
  is(s1.cat === 'save', '  🗂️ <b>저축</b>을 골랐다 — NLIVE.cat = ' + s1.cat);
  is(/청년도약계좌|기초연금/.test(s1.제목),
     '  소식 줄이 <b>저축 기사</b>로 바뀐다 — 「' + s1.제목.replace(/\s+/g, ' ').slice(0, 52) + '」');
  is(s1.제목 !== 처음제목, '  처음과 <b>다른 기사</b>다');
  is(s1.고르개숨 === false,
     '  고르고 나서도 <b>펴 둔 채</b>다 — 다시 그리면서 접히면 한 번에 하나밖에 못 고르신다');
  is(/💰|저축/.test(s1.제목), '  제목 줄에 <b>고르신 칸</b>이 적힌다 — 무엇을 보고 계신지 압니다');

  await p.evaluate(() => nlSetAge('60'));
  await p.waitForTimeout(500);
  const s2 = await 본(p);
  is(s2.age === '60', '  🎂 <b>60대 이상</b>을 겹쳤다 — NLIVE.age = ' + s2.age);
  is(/기초연금/.test(s2.제목),
     '  저축 × 60대 → <b>기초연금 기사</b>로 좁혀진다 — 「' + s2.제목.replace(/\s+/g, ' ').slice(0, 52) + '」');
  is(/기초연금/.test((s2.이유 || []).join(' ')),
     '  까닭도 <b>그 기사의 낱말</b>로 바뀐다 — 「' + ((s2.이유 || [])[0] || '').slice(0, 46) + '…」');

  /* ── [5] 두 화면이 같은 말을 한다 ──────────────────────────────── */
  head('[5] 🔗 <b>홈과 뉴스 화면이 같은 말을 한다</b> — 상태는 NLIVE 하나 (5번)');
  await p.evaluate(() => go('news_live'));
  await p.waitForTimeout(700);
  const two = await p.evaluate(() => {
    const on = (q) => [].filter.call(document.querySelectorAll(q), b => b.classList.contains('on'))
                        .map(b => (b.innerText || '').replace(/\s+/g, ' ').trim());
    return { 뉴스칸: on('#nlChips .nl-chips:not(.nl-age) .nl-chip'),
             뉴스나이: on('#nlChips .nl-age .nl-chip'),
             칩수: document.querySelectorAll('#nlChips .nl-chip').length,
             cat: NLIVE.cat, age: NLIVE.age };
  });
  is(two.칩수 > 0, '  뉴스 화면에 칸이 <b>' + two.칩수 + '개</b> 서 있다 — 0 이면 아래 둘은 헛것이다 (8번)');
  is(two.cat === 'save' && two.age === '60',
     '  뉴스 화면도 <b>저축 × 60대 이상</b>이다 — 홈에서 고른 그대로');
  is(/저축/.test(two.뉴스칸.join(' ')),
     '  뉴스 화면의 <b>켜진 칸</b>이 저축이다 — 「' + two.뉴스칸.join(' · ') + '」');
  is(/60/.test(two.뉴스나이.join(' ')),
     '  뉴스 화면의 <b>켜진 나이대</b>가 60대다 — 「' + two.뉴스나이.join(' · ') + '」');

  /* ── [6] 짝퉁 표가 없다 ────────────────────────────────────────── */
  head('[6] 🧬 <b>이름을 홈이 따로 안 적는다</b> — 한 곳이 안다 (5번)');
  const 앱 = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const 칸 = 앱.slice(앱.indexOf('function hmNwPanelHtml'), 앱.indexOf('function hmNwPickToggle'));
  is(칸.indexOf('hmNwPickHtml') > 0 && 칸.indexOf('nlAgeChipsHtml') > 0 && 칸.indexOf('nlWhyHtml') > 0,
     '  고르개 칸은 <b>이미 있는 자 셋</b>을 부르기만 한다 (hmNwPickHtml · nlAgeChipsHtml · nlWhyHtml)');
  is(!/['"](보험|경제|저축|정책|20·30대|40·50대|60대)['"]/.test(칸),
     '  그 안에 <b>제 이름표가 없다</b> — 있으면 뉴스 화면이 바뀔 때 홈만 옛말을 한다');
  is(/APEX_FIT\.(main|ageKeys)/.test(앱.slice(앱.indexOf('function hmNwPickHtml'), 앱.indexOf('function hmNwPanelHtml')))
     || /APEX_FIT\.main/.test(앱),
     '  앞줄 넷은 <b>APEX_FIT.main</b> 이 안다 — 칸이 늘면 홈도 저절로 는다');

  /* ── [7] 터진 자리 · 바깥 ──────────────────────────────────────── */
  head('[7] 🧯 <b>조용히 터진 자리가 없다</b>');
  is(errs.length === 0, '  화면이 터진 자리 <b>' + errs.length + '곳</b>' + (errs[0] ? (' — ' + errs[0]) : ''));
  is(바깥 === 0, '  <b>바깥을 안 부른다</b> — ' + 바깥 + '번 (사장님 서버를 점검이 읽지 않습니다)'
     + (바깥 ? (' — ' + (global.__U || []).slice(0, 3).join(' · ')) : ''));

  await b.close(); srv.close();
  console.log(bad ? ('\n✗ 「오늘」 고르개 — 고칠 자리 ' + bad + '곳')
                  : '\n✓ 「오늘」 고르개 통과 — 접힌 채로 0px, 펴면 상황·나이대·까닭이 같이 섭니다');
  process.exit(bad ? 1 : 0);
})();
