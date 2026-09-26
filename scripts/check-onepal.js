/* ══════════════════════════════════════════════════════════════════
   check-onepal.js — <b>색표가 한 벌인가.</b>

   2026-09-26. 사장님 말씀 「색상부터 좀 변경해봐 <b>이거 아니잖아</b>」.

   재 보니 앱이 <b>색표를 두 벌 겹쳐 입고</b> 있었습니다. 목업의 --t-*
   와, 그 전부터 있던 --ink-* · --primary · --pos … 가 <b>저마다 제 hex</b>
   를 들고 있어서, 나란히 서면 회색이 두 가지 남색이 두 가지로 보였습니다 —
     --ink-1 #0D1117 ↔ --t-ink  #191F28    --ink-4 #6B7280 ↔ --t-sub  #6B7684
     --ink-5 #9CA3AF ↔ --t-sub2 #8B95A1    --ink-7 #E9EAEC ↔ --t-line #E5E8EB
   사람 눈에는 <b>「어딘가 안 맞는다」</b> 로만 보이고 어디인지는 안 보입니다.

   그리고 <b>판(.main)이 거의 흰색</b>(#F9FAFB)이었습니다. 목업은 회색
   판(#F2F4F6) 위에 흰 카드가 뜨는 것이 전부인데, 그 대비가 통째로
   없어서 <b>카드가 판에서 안 떠 보였습니다.</b>

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 옛 이름들이 <b>제 hex 를 안 들고</b> 목업 토큰을 가리킨다 (5번)
     [2] <b>판이 목업의 회색</b>이고, 카드가 그 위에 뜬다
     [3] ★ <b>판에 묻힌 상자가 없다</b> — 제 바탕을 칠했는데 판과 같은 색
     [4] ★ <b>글자 대비가 나빠지지 않았다</b> — 기준선을 넘으면 빨간불
     [5] ★ 손으로 박아 둔 <b>「토큰과 거의 같은 색」 이 늘지 않았다</b>
     [6] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9026;
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

/* ── 기준선 ────────────────────────────────────────────────────────
   ★ 이 수들은 <b>재서 적은 것</b>입니다. 줄이면 같이 내리고, 늘면
     빨간불입니다 — check-skinmap 과 같은 방식입니다 (0-1번).
   ⚠ 대비가 모자란 <b>색 짝</b>이 아직 스물 몇 가지 있습니다.
     <b>목업이 그렇습니다</b> — 목업도 회색 판 위 작은 글씨에 #6B7684(4.19)를
     씁니다. 그래서 「0 으로 만들라」 가 아니라 <b>「늘리지 말라」</b> 로 겁니다.
     진짜 고칠 길은 그 글을 <b>카드 안으로</b> 넣는 것이고(목업은 전부 카드
     안입니다), 그것은 화면 92개가 목업 옷을 못 입은 것과 같은 일입니다 —
     대장 X02. 지어서 덮지 않습니다 (1번).
   ⚠ ★ <b>글자 수로 세지 않습니다.</b> 처음에 그렇게 만들었다가 제 컨테이너
     189 · CI 194 로 갈렸습니다 — 공지 줄이 몇 개 떠 있느냐에 따라 움직여서
     고친 것이 없는데도 빨간불이 켜집니다. <b>색이 문제이니 색 짝으로</b>
     셉니다 (8번).                                                        */
const BASE = { 묻힌상자: 0, 거의같은색: 173 };
/* ── 대비가 모자란 <b>색 짝</b> — 이름으로 적어 둡니다 ──────────────
   ★ <b>수로 세지 않습니다.</b> 처음에 수로 셌더니 제 컨테이너 189 · CI 194
     로 갈렸습니다 — 공지 줄이 몇 개 떠 있느냐 같은 <b>자료 양</b>에 따라
     움직이기 때문입니다. 그러면 고친 것이 없는데도 빨간불이 켜져
     <b>헛것을 잡는 점검</b>이 됩니다 (8번).
   ★ 그래서 <b>색 짝을 이름으로</b> 적습니다. 새 짝이 생기면 그 짝이 화면에
     찍히므로, 늘었는지뿐 아니라 <b>무엇이 늘었는지</b>가 바로 보입니다.
   ⚠ 아래 열일곱은 <b>전부 목업 자신의 색</b>입니다 — 흐린 회색(--t-sub ·
     --t-sub2)과 뜻있는 색(--t-warn · --t-pos · --t-neg)이 제 연한 바탕
     위에 앉은 자리들입니다. 목업이 그렇게 그렸으니 <b>지어 덮지 않고</b>
     적어 둡니다 (1번). 진짜 고칠 길은 그 글을 카드 안으로 넣는 것이고,
     그것은 화면 92개가 목업 옷을 못 입은 것과 같은 일입니다 — 대장 X02.
   ⚠ #9CA3AF 하나는 목업 색이 아닙니다 — 아직 손으로 박혀 있는 옛 회색
     입니다. 줄이면 이 줄을 지웁니다.                                   */
const 봐주는색짝 = [
  '#059669 on #ECFDF5 (4.5)',   /* --t-pos  on --t-pos-l */
  '#6B7684 on #F2F4F6 (4.5)',   /* --t-sub  on 판 — 목업도 여기가 4.19 */
  '#6B7684 on #F5F3FF (4.5)',
  '#6B7684 on #F7F9FA (4.5)',
  '#6B7684 on #FFFBF5 (4.5)',
  '#8B95A1 on #F2F4F6 (3)',     /* --t-sub2 큰 글씨 — 목업 .h1 span */
  '#8B95A1 on #F2F4F6 (4.5)',
  '#8B95A1 on #F5F7F9 (4.5)',
  '#8B95A1 on #F7F9FA (4.5)',
  '#8B95A1 on #FFFFFF (4.5)',
  '#9CA3AF on #FFFFFF (4.5)',   /* ⚠ 목업 색이 아님 — 아직 손으로 박힌 옛 회색 */
  '#D97706 on #F0F9FF (4.5)',   /* --t-warn on 연한 바탕들 */
  '#D97706 on #F0FDF4 (4.5)',
  '#D97706 on #F7F9FA (4.5)',
  '#D97706 on #FFF7ED (4.5)',
  '#D97706 on #FFFBEB (4.5)',
  '#DC2626 on #F2F4F6 (4.5)'    /* --t-neg on 판 */
];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','osCliInfoLoad',
   'osRepListLoad','osLoadAnalysis','toast','nlLoad'].forEach(k => { window[k] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded = true; if (cb) cb(); };
  window.osTabAllowed = function(){ return true; };
  window.setupDone = function(){ return true; }; window.setupCanRun = function(){ return true; };
  window.osClient = function(){ return null; };
  OS.profile = {id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session = {user:{id:'me'}};
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.reps = [];
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  const ago = n => new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  OSC.list = ['홍길동','홍길순','홍길상'].map((n,i) =>
    ({id:'c'+i,name:n,name_masked:n[0]+'○○',advisor_id:'me',stage:['AP','TA','PC'][i],created_at:ago(30+i*20)}));
  CM.loaded = true; CM.meta = {};
  OSC.list.forEach((c,i) => { const m = cmBlank();
    m.touch = [{at:ago(i*7),how:'전화',note:'통화'}]; CM.meta[c.id] = m; });
  /* ★ 공지도 <b>떠 있는 채로</b> 잽니다. 처음에는 안 띄우고 쟀는데, CI 에서는
     떠서 글자 다섯 줄이 더 잡혔습니다 — <b>제 컨테이너에서 안 보이는 색은
     못 잽니다.</b> 견본은 「홍길동」 (3번).                              */
  try{
    OS_NTC.loaded = true; OS_NTC.busy = false; OS_NTC.err = ''; OS_NTC.at = Date.now();
    /* on 이 꺼져 있으면 osNtcShown 이 걸러 버립니다 — 처음에 이걸 빠뜨려
       띄운 줄 알고 넘어갈 뻔했습니다. 띄웠는지 <b>확인하고</b> 적습니다. */
    OS_NTC.list = [
      { id:'n1', on:true, body:'이번 주 마감은 금요일입니다.', author:'홍길동', created_at:'2026-08-03' },
      { id:'n2', on:true, body:'교육 자료를 올렸습니다.',      author:'홍길동', created_at:'2026-08-03' },
      { id:'n3', on:true, body:'다음 주 회의는 화요일입니다.', author:'홍길동', created_at:'2026-08-02' }
    ];
  }catch(e){}
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  try{ osNtcPaint(); }catch(e){}
};

/* 한 화면을 재는 자 — 대비 낮은 글자 · 판에 묻힌 상자 */
const SCAN = ([tab, page]) => {
  const num = s => ((s||'').match(/[\d.]+/g) || [0,0,0]).slice(0,3).map(Number);
  const lum = c => { const f = x => { x/=255; return x<=.03928 ? x/12.92 : Math.pow((x+.055)/1.055,2.4); };
    return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2]); };
  const cr = (a,b) => { const L=lum(a), M=lum(b); return (Math.max(L,M)+.05)/(Math.min(L,M)+.05); };
  const solid = c => { const n=(c||'').match(/[\d.]+/g); return !!(n && (n.length<4 || +n[3]>.5)); };
  /* ★ <b>그라데이션·사진을 깔아 둔 자리는 못 잽니다.</b> backgroundColor 는
     투명으로 나오므로, 그냥 위로 거슬러 올라가면 <b>그 뒤의 흰 카드</b>를
     바탕으로 잘못 짚습니다. 실제로 홈 공지 머리글(짙은 남색 그라데이션 위
     흰 글씨 — 잘 보입니다)을 「흰 글씨에 흰 바탕」 이라고 잡을 뻔했습니다.
     <b>모르면 모른다고 하고 건너뜁니다</b> (1번 · 8번) — 헛것을 잡는 점검은
     안 잡는 점검보다 나쁩니다.                                          */
  const bgOf = el => { let e=el; while(e){ const cs=getComputedStyle(e);
    if ((cs.backgroundImage||'none') !== 'none') return null;    /* 못 잰다 */
    if (solid(cs.backgroundColor)) return num(cs.backgroundColor); e=e.parentElement; }
    return [255,255,255]; };
  const hex = c => '#'+c.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('').toUpperCase();
  const low = [], buried = [];
  document.querySelectorAll('#dynPane *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
    /* ▣ 판에 묻힌 상자 — 제 바탕을 칠했는데 <b>바로 위가 판</b>이고 색이 같다 */
    const own = getComputedStyle(el).backgroundColor;
    if (solid(own) && r.width > 60 && r.height > 24) {
      const c = num(own), d = Math.abs(c[0]-page[0])+Math.abs(c[1]-page[1])+Math.abs(c[2]-page[2]);
      const pe = el.parentElement;
      const pc = pe ? bgOf(pe) : null;
      if (pc) {
        const onPage = Math.abs(pc[0]-page[0])+Math.abs(pc[1]-page[1])+Math.abs(pc[2]-page[2]) <= 6;
        if (d > 0 && d <= 10 && onPage)
          buried.push(tab+' · '+String(el.className||el.tagName).slice(0,30)+' '+hex(c)+' (판 '+hex(page)+')');
      }
    }
    /* 글자 대비 — <b>이모지·기호만인 칸은 뺍니다</b>(제 색을 가집니다) */
    const txt = [].slice.call(el.childNodes).filter(x => x.nodeType === 3)
                  .map(x => x.textContent).join('').trim();
    if (!txt || txt.length < 2) return;
    if (!/[가-힣A-Za-z0-9]/.test(txt)) return;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize) || 14, bold = (parseInt(cs.fontWeight,10)||400) >= 700;
    const need = (fs >= 24 || (fs >= 18.66 && bold)) ? 3 : 4.5;
    const bg = bgOf(el);
    if (!bg) return;                    /* 그라데이션 위 — 못 재므로 안 잡는다 */
    const fg = num(cs.color), v = cr(fg, bg);
    /* ★ <b>글자 수를 세지 않습니다.</b> 처음에 수로 셌더니 제 컨테이너 189 ·
       CI 194 로 갈렸습니다 — 공지 줄이 몇 개 떠 있느냐 같은 <b>자료 양</b>에
       따라 움직이기 때문입니다. 그러면 고친 것이 없는데도 빨간불이 켜져
       <b>헛것을 잡는 점검</b>이 됩니다 (8번).
       색이 문제이므로 <b>색 짝</b>(글자색·바탕색·필요 대비)으로 셉니다 —
       같은 짝이 열 군데 나와도 <b>한 가지</b>입니다.                       */
    if (v < need) low.push(hex(fg)+' on '+hex(bg)+' ('+need+')');
  });
  return { low: [...new Set(low)], buried: [...new Set(buried)] };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.evaluate(() => { try{ go('home'); }catch(e){} });
  await p.waitForTimeout(1400);

  console.log('\n[1] 옛 이름들이 <b>목업 토큰을 가리킨다</b> (5번)');
  const A = await p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue(n).trim().toUpperCase();
    const pair = [['--ink-1','--t-ink'],['--ink-2','--t-ink'],['--ink-3','--t-ink-2'],
                  ['--ink-4','--t-sub'],['--ink-5','--t-sub2'],['--ink-6','--t-line-3'],
                  ['--ink-7','--t-line'],['--ink-8','--t-line-2'],['--ink-9','--t-bg-3'],
                  ['--white','--t-card'],['--primary','--t-point'],['--primary-light','--t-point-l'],
                  ['--pos','--t-pos'],['--pos-l','--t-pos-l'],['--warn','--t-warn'],['--warn-l','--t-warn-l'],
                  ['--neg','--t-neg'],['--neg-l','--t-neg-l'],['--pur','--t-pur'],['--pur-l','--t-pur-l']];
    return pair.map(([a,t]) => ({ a:a, t:t, av:g(a), tv:g(t) }));
  });
  const 어긋남 = A.filter(x => x.av !== x.tv);
  is(어긋남.length === 0,
     '  옛 이름 ' + A.length + '가지가 <b>목업 색과 똑같이</b> 나온다' +
     (어긋남.length ? ('\n      ✗ ' + 어긋남.map(x => x.a+' '+x.av+' ≠ '+x.t+' '+x.tv).join('\n      ✗ ')) : ''));
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is(/--ink-1:\s*var\(--t-ink\)/.test(SRC) && /--primary:\s*var\(--t-point\)/.test(SRC),
     '  ★ 값을 <b>옮겨 적지 않고 가리킨다</b> — 옮겨 적으면 목업 색을 바꿀 때 여기만 옛 색으로 남는다 (5번)');
  is(!/--ink-1:\s*#/.test(SRC), '  옛 이름이 <b>제 hex 를 안 들고</b> 있다');

  console.log('\n[2] <b>판이 목업의 회색</b>이고 카드가 그 위에 뜬다');
  const B = await p.evaluate(() => {
    const hex = s => { const n=(s||'').match(/\d+/g); return n?('#'+n.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('').toUpperCase()):s; };
    const cs = getComputedStyle(document.documentElement);
    const main = document.getElementById('main') || document.querySelector('.main');
    const card = document.querySelector('#dynPane .card') || document.querySelector('#dynPane .osc-panel');
    return { 판: hex(getComputedStyle(main).backgroundColor),
             몸: hex(getComputedStyle(document.body).backgroundColor),
             카드: card ? hex(getComputedStyle(card).backgroundColor) : '(없음)',
             목업판: cs.getPropertyValue('--t-bg').trim().toUpperCase(),
             목업카드: cs.getPropertyValue('--t-card').trim().toUpperCase() };
  });
  is(B.판 === B.목업판, '  판(.main)이 <b>' + B.목업판 + '</b> 이다 — 지금 ' + B.판);
  is(B.몸 === B.목업판, '  body 도 같은 판 색이다 — ' + B.몸);
  is(B.카드 === B.목업카드,
     '  카드는 <b>흰색</b>이라 판 위에 뜬다 — 카드 ' + B.카드 + ' / 판 ' + B.판);

  console.log('\n[3][4] 화면을 돌며 — 묻힌 상자 · 글자 대비');
  const tabs = await p.evaluate(() => [...new Set(TB.map(x=>x.id).concat(['tools','me','settings','report','news_live']))]);
  const page = await p.evaluate(() => {
    const n = (getComputedStyle(document.getElementById('main')||document.querySelector('.main')).backgroundColor.match(/\d+/g)||[242,244,246]);
    return n.slice(0,3).map(Number);
  });
  let low = [], buried = [];
  for (const t of tabs) {
    await p.evaluate(x => { try{ go(x); }catch(e){} }, t);
    await p.waitForTimeout(650);
    const r = await p.evaluate(SCAN, [t, page]);
    low = low.concat(r.low); buried = buried.concat(r.buried);
  }
  is(buried.length <= BASE.묻힌상자,
     '  ★ <b>판에 묻힌 상자</b>가 ' + buried.length + '가지 — 기준선 ' + BASE.묻힌상자 +
     (buried.length ? ('\n      ✗ ' + buried.slice(0,6).join('\n      ✗ ') +
        '\n      → 판 위에 놓을 상자는 판과 다른 색이어야 합니다. --t-card(흰) 이나 --t-bg-3 을 쓰십시오.') : ''));
  const 짝 = [...new Set(low)].sort();
  const 새것 = 짝.filter(x => 봐주는색짝.indexOf(x) < 0);
  is(새것.length === 0,
     '  ★ <b>새로 생긴 색 짝</b>이 없다 — 지금 ' + 짝.length + '가지 (적어 둔 것 ' + 봐주는색짝.length + '가지)' +
     (새것.length ? ('\n      ✗ ' + 새것.join('\n      ✗ ') +
       '\n      → 목업 색이면 위 봐주는색짝 에 <b>까닭과 함께</b> 적고, 아니면 색을 고치십시오') : ''));
  const 사라진것 = 봐주는색짝.filter(x => 짝.indexOf(x) < 0);
  if (사라진것.length)
    console.log('      · 이제 안 나오는 짝 ' + 사라진것.length + '가지 — 목록에서 지워 주십시오: ' + 사라진것.join(' | '));

  console.log('\n[5] ★ 손으로 박아 둔 <b>「토큰과 거의 같은 색」</b>이 늘지 않았다');
  const TOK = ['#191F28','#6B7684','#8B95A1','#E5E8EB','#F2F4F6','#FFFFFF','#1A56DB','#EBF3FF',
               '#123A96','#059669','#D97706','#DC2626','#F1F3F5','#F5F7F9','#F7F9FA','#B0B8C1',
               '#D7DCE2','#ECFDF5','#FFF7ED','#FEF2F2','#7C3AED','#F5F3FF','#4E5968'];
  const toRgb = h => { h = h.replace('#',''); if (h.length === 3) h = h.split('').map(c=>c+c).join('');
    return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); };
  const seen = {};
  (SRC.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).forEach(h => {
    h = h.toUpperCase(); seen[h] = (seen[h]||0) + 1;
  });
  const near = Object.keys(seen).filter(h => TOK.indexOf(h) < 0 && h !== '#FFF' && h !== '#000' &&
    Math.min.apply(null, TOK.map(t => {
      const a = toRgb(h), b2 = toRgb(t);
      return Math.abs(a[0]-b2[0]) + Math.abs(a[1]-b2[1]) + Math.abs(a[2]-b2[2]);
    })) <= 20);
  is(near.length <= BASE.거의같은색,
     '  <b>토큰과 차이 20 이내</b>인 손으로 적은 색이 ' + near.length + '가지 — 기준선 ' +
     BASE.거의같은색 + '. 늘면 색표가 다시 두 벌이 됩니다 (5번)');
  if (near.length < BASE.거의같은색)
    console.log('      · 기준선보다 ' + (BASE.거의같은색 - near.length) + '가지 적습니다 — BASE 를 ' + near.length + ' 로 내려 주십시오');

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 색표가 한 벌이고, 흰 카드가 회색 판 위에 뜹니다.');
  process.exit(bad ? 1 : 0);
})();
