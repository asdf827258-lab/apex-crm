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
const BASE = { 묻힌상자: 0, 거의같은색: 165 };
/* ★ 176 → 165 · 2026-10-08 (X08 둘째 판) — 뜻이 맞는 <b>열다섯</b>을 더
   모았습니다(477곳). <b>「가장 가까운 이름」 이 아니라 「뜻이 맞는 이름」</b>
   으로 보냈습니다 — 이 자는 거리만 보므로, 이름 고르기는 사람이 합니다.
     테두리 → --t-line / --t-line-2 / --t-line-b
     바탕   → --t-bg / --t-bg-3 / --t-card / --t-pos-l
   ⚠★★ <b>바로 앞 판에 제가 적은 쪽지를 고칩니다.</b> #E5E9F0(77곳)을
     「모으면 앱이 틀려진다」 고 적었는데, <b>틀린 것은 --t-on 으로 모으는
     것이었지 모으는 것 자체가 아니었습니다.</b> 그 77곳은 전부 테두리이니
     <b>--t-line</b> 으로 가면 맞습니다. 「가까운 이름이 틀렸다」 를
     「모으면 안 된다」 로 적은 것이 제 잘못입니다 (1번).
   ⚠ <b>#FFFBEB(137곳)은 그대로 둡니다</b> — --t-seal 은 광고심의 규정이
     정한 색이고, 그 137곳은 평범한 호박색 뱃지입니다. 뜻이 맞는 이름이
     <b>아직 없습니다</b>. 이름을 새로 세우는 것은 색의 뜻을 정하는 일이라
     사장님께 여쭌 뒤에 합니다.
   ⚠ <b>#0F172A(87곳)도 그대로</b> — 짙은 칸 <b>바탕</b>인데 가까운
     --t-ink 는 <b>글자색</b>입니다. 짙은 바탕에는 이름이 아직 없습니다
     (X69 에서 글자색 사다리만 세웠습니다).
   ★★ <b>var() 를 넣으면 안 되는 자리 셋</b> — 이번에 둘을 실제로 깨뜨렸습니다:
     ① <b>canvas</b>(fillStyle·strokeStyle) — var() 를 못 읽고 <b>틀린 값은
        조용히 무시</b>해 앞 색으로 그립니다. 되돌렸습니다.
     ② <b>SVG 속성</b>(fill="#…") — 속성에는 var() 가 안 먹습니다. 네 곳을
        그대로 두었고, 그래서 그 이름들은 아직 안 사라집니다.
     ③ meta theme-color.                                                  */
/* ⚠★★ 165 → 176 · 2026-10-08 (X08 물결) — <b>나빠진 것이 아니라, 이 자가
     처음으로 제대로 센 것입니다.</b> 아래 TOK 이 <b>색표를 손으로 베낀
     스물다섯</b>이었는데 ui.css 에는 마흔 넘게 있습니다. 그래서 자가 모르는
     이름(--t-teal · --t-neg-d · --t-pur · --t-ind* · --t-warn-d2 · --t-on* ·
     --t-tier* …) 둘레의 손박이 색 <b>열여섯</b>을 「가까운 토큰이 없다」 로
     읽어 <b>안 세고</b> 있었습니다. ui.css 에서 읽게 고치니 <b>181</b>이었고,
     아래 다섯을 모아 <b>176</b>이 되었습니다.
   ⚠★★ <b>#BFD4FB 는 모으려다 CI 에 물려 되돌렸습니다</b> (2026-10-08) —
     --t-line-b 와 <b>차이 13</b> 이라 테두리 18곳의 <b>색이 실제로 변했고</b>,
     그 이름은 check-indigo 가 <b>47군데로 세어 둔 자리</b>라 섞이면 그 자도
     웁니다(41+6=47 → 59+6). <b>「이름을 붙이면서 색이 변하면 안 하느니만
     못합니다」</b> — 그 자가 적어 둔 말 그대로입니다. 차이가 한 자리 수일
     때만 모으십시오.
   ★ 모은 다섯 (뜻이 같은 것만 · 71곳) —
       #E5E7EB(31) → --t-line   · #FEF3F2(18) → --t-neg-l
       #F5F7FA(12) → --t-bg-2   · #F7F8FA(7)  → --t-bg-3
       #8B94A3(3)  → --t-sub2
   ⚠★★ <b>가깝다고 다 모으면 안 됩니다 — 이 자는 「거리」 를 볼 뿐 「뜻」 을
     못 봅니다.</b> 제일 큰 둘은 일부러 안 모았습니다:
       <b>#FFFBEB (137곳)</b> 은 --t-seal 과 차이 3 이지만, seal 은
         <b>광고심의 규정이 정한 색</b>입니다. 모으면 그 색이 평범한 뱃지
         137곳에 퍼집니다. 규정 색은 규정 자리에만 있어야 합니다.
       <b>#E5E9F0 (77곳)</b> 은 --t-on 과 차이 3 이지만, 그 77곳은 전부
         <b>테두리</b>이고 --t-on 은 <b>짙은 칸 글자색</b>입니다. 뜻이 다릅니다.
     이 둘을 모으면 수는 <b>176 → 174</b> 로 떨어지지만 <b>앱이 틀려집니다</b>.
     수를 내리려고 뜻을 덮지 않습니다 (1번).                              */
/* ⚠ 171 → 165 · 2026-10-05 (X02 물결 4). 손으로 박힌 글자색 777곳을 토큰으로
   옮기니 「토큰과 거의 같은 색」 여섯 가지가 <b>사라져서</b> 내렸습니다.
   고친 것이 없는데 내려 적은 것이 아닙니다 — 자가 「165 로 내려 주십시오」
   라고 적어 주었습니다.                                                  */
/* ⚠ 173 → 172 로 내려온 길을 적어 둡니다. --t-warn-d 라는 <b>이름을 만들자마자</b>
   이 자가 <b>#8A5A0B</b>(차이 7)를 찾아냈습니다 — 앱 어딘가에 있던 또 하나의
   진한 호박색입니다. 이름이 없을 때는 아무 토큰과도 안 가까워서 안 보였습니다.
   기준선을 올리지 않고 <b>그 색도 토큰으로 바꿨습니다.</b>                */
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
  /* 2026-09-27 · --t-sub on --t-bg-2(칩 바탕). 홈 상담현황 칩이 생기면서
     이 짝이 처음 화면에 섰습니다. <b>둘 다 목업 토큰</b>이고, 위의
     --t-sub on 판(#F2F4F6) 과 같은 결입니다 — 목업도 거기가 4.19 입니다.
     색을 고치는 것이 아니라 <b>적어 두고 지나갑니다</b>. */
  /* 2026-09-28 · --t-sub on --t-point-l. <b>소식 화면</b>의 날짜 칸(.d)에서
     처음 섰습니다 — 소식은 날마다 내용이 달라지므로 어제까지는 그 칸이
     안 서 있었습니다. <b>판 ⑩ 탓이 아닙니다</b>: 판 ⑨(036847a)로 파일을
     되돌려도 같은 짝이 나옵니다(확인했습니다).
     <b>둘 다 목각 토큰</b>이고, 위의 --t-sub on 판(#F2F4F6)·--t-bg-2 와
     같은 결입니다 — 목각도 거기가 4.19 입니다. 색을 고치는 것이 아니라
     <b>적어 두고 지나갑니다</b>.
     ⚠ 아래 「이제 안 나오는 짝」 은 <b>지우지 않습니다</b>. 이 자는 <b>새</b>
       짝에만 빨간불을 켜므로 남겨 두어도 해가 없고, 소식·미션처럼 날마다
       내용이 바뀌는 화면의 짝은 <b>다른 날 다시 섭니다</b>. 지우면 그날
       까닭 없이 빨개집니다.                                             */
  '#6B7684 on #EBF3FF (4.5)',
  '#6B7684 on #F5F7F9 (4.5)',
  '#6B7684 on #F7F9FA (4.5)',
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
  /* ══ ★★ <b>색표를 app/ui.css 에게 묻습니다</b> (2026-10-08) ══════════
     ⚠ 여기 <b>스물다섯을 손으로 베껴</b> 들고 있었습니다. 그런데 ui.css 에는
       마흔 넘게 있습니다 — <b>「색표는 한 벌」 을 지키는 자가 스스로 색표를
       두 벌로</b> 들고 있었고, 그 사이에 늘어난 이름(--t-teal · --t-neg-d ·
       --t-pur · --t-ind* · --t-warn-d2 · --t-on* · --t-tier* …)을 <b>하나도
       모르고</b> 있었습니다. 모르는 이름 옆에 있는 손박이 색은 「가까운 토큰이
       없다」 로 읽혀 <b>안 세어졌습니다</b> — 기준선이 그만큼 헐거웠습니다 (5번).
     ★ 이제 <b>ui.css 한 곳</b>에서 읽습니다(check-hmexact 와 같은 자리).
       이름을 새로 세우면 그 둘레의 손박이 색이 <b>저절로 드러납니다</b> —
       이 파일 위쪽에 적힌 「--t-warn-d 를 만들자마자 #8A5A0B 가 보였다」 가
       그 일이고, 이제 그것이 <b>저절로</b> 일어납니다.                    */
  const TOK = (() => {
    const css = fs.readFileSync('app/ui.css', 'utf8'), out = [];
    (css.match(/:root[\s\S]*?\}/g) || []).forEach(b =>
      (b.match(/--t-[^\s:;{}]+\s*:\s*[^;}]+/g) || []).forEach(x => {
        const v = x.slice(x.indexOf(':') + 1).trim().toUpperCase();
        if (/^#[0-9A-F]{6}$/.test(v) && out.indexOf(v) < 0) out.push(v);
      }));
    /* ★ 목업이 그린 진한 짝 둘은 ui.css 에 이름이 없어 여기 남깁니다 */
    ['#FFFFFF', '#8A5A12', '#065F46'].forEach(v => { if (out.indexOf(v) < 0) out.push(v); });
    return out;
  })();
  /* ★ <b>주석과 판 안내글은 빼고 셉니다.</b> 처음에는 파일 전체에서 hex 를
     찾았는데, 그러면 <b>색을 지웠다고 적은 글</b>까지 세어집니다 — 실제로
     이번 판 안내에 「지운 색 #B45309 …」 라고 적었더니 수가 도로 늘어
     빨간불이 켜졌습니다. <b>색을 쓰는 것과 색을 글로 적는 것은 다릅니다</b> (8번).
     ⚠ 이것 때문에 그동안의 기준선(173)도 <b>부풀어 있었습니다</b> — 이 파일은
       주석이 많아 거기 적힌 색이 다 세어지고 있었습니다.                 */
  const CODE = SRC
    .replace(/\/\*[\s\S]*?\*\//g, ' ')                 /* 주석 */
    .replace(/var APP_BUILD_NOTE=[\s\S]*?;\n/, ' ');    /* 판 안내글 */
  const toRgb = h => { h = h.replace('#',''); if (h.length === 3) h = h.split('').map(c=>c+c).join('');
    return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); };
  const seen = {};
  (CODE.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).forEach(h => {
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

  console.log('\n[5-1] ★ <b>알람 자리에 손으로 박은 색이 없다</b>');
  /* 사장님 말씀 「알람 색상 … 전부 다 다르다」. 재 보니 알람 한 자리에서
     <b>색이 26가지</b>였습니다 — 연한 크림 넷(#FFF1E2·#FFFBF5·#FFFBEB·
     #FFFDF5) · 진한 호박 넷(#B45309·#A16207·#92400E·#9A3412) · 파랑 셋.
     전부 같은 뜻인데 값만 달랐습니다. 이제 <b>토큰만</b> 씁니다.
     ★ 여기만 따로 보는 까닭 — 앱 전체에는 아직 손으로 박은 색이 172가지
       남아 있어 전체로는 「0 이어야 한다」 고 못 겁니다. 다 치운 자리는
       <b>다시 더러워지지 않게</b> 0 으로 못 박습니다 (8번).            */
  const A0 = SRC.indexOf("'.almk{margin-top:10px;");
  const A1 = SRC.indexOf('document.head.appendChild(st);', A0);
  const ALM = (A0 >= 0 && A1 > A0) ? SRC.slice(A0, A1) : '';
  is(ALM.length > 1500, '  알람 옷 덩어리를 찾았다 — ' + ALM.length + '자');
  const 박은색 = ALM.replace(/\/\*[\s\S]*?\*\//g, ' ')
                    .match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || [];
  is(박은색.length === 0,
     '  ★ 알람 옷에 <b>손으로 박은 색이 한 가지도 없다</b>' +
     (박은색.length ? ('\n      ✗ ' + [...new Set(박은색)].join(' · ') +
       '\n      → 뜻이 있으면 토큰을 쓰십시오(--t-warn-d · --t-pos-d 가 그래서 있습니다)') : ''));
  is(!/\.t-skin\s+\.almk-diag/.test(SRC) && !/\.t-skin\s+\.alm-why/.test(SRC),
     '  ★ 같은 글자가 <b>화면마다 다른 색이 되지 않는다</b> — 옷 입은 화면만 덮는 자리가 없다 (5번)');

  /* ══ [5-2] ★★ <b>뜻은 색이 아니라 글자가 나른다</b> ══════════════════
     2026-10-04 · 사장님 말씀 「네가 판단해서 여섯 가지 다 해줘」 — 그 가운데
     하나가 <b>「기둥의 큰 카드 셋이 서로 다른 색인데 목각은 연파랑 하나다.
     뜻이 있는 색이라 사장님께 여쭙고 정한다」</b> 였습니다.
     ★ <b>재어 보니 그 셋은 이미 무채색이었습니다</b> — 홈에 색이 남은 곳은
       ① 파란 히어로(사장님이 「그대로」 하신 것) ② 단추 파랑 ③ 상태 칩
       하나뿐이고 나머지는 239~249 무채색입니다. 여쭐 것이 없어졌습니다.
     ★ 그래서 <b>제가 정한 것은 규칙</b>입니다 — <b>색만으로 뜻을 나르지
       않습니다.</b> 색약이신 분, 흑백 인쇄, 복사기를 지나면 색은 사라지고
       <b>뜻만 남아야</b> 합니다. 고객 앞에서 종이로 내미는 앱입니다.
     ★ 그래서 묻는 것은 하나입니다 — <b>바탕색이 흰색이 아닌 칸은 글자도
       함께 들고 있나.</b> 색이 사라져도 읽을 수 있어야 합니다.             */
  const IDXP = require('fs').readFileSync(require('path').join(ROOT, 'app/index.html'), 'utf8');
  console.log('\n[5-2] ★★ <b>뜻은 색이 아니라 글자가 나른다</b> — 색이 사라져도 읽힌다');
  {
    /* ⚠ ★★ <b>처음에 이 자가 열어 둔 PC 판(1280)으로 재어 「색 있는 칸
       0곳」 이 나왔습니다</b> — 아무것도 못 찾고 <b>거저 통과</b>하는
       <b>안 울리는 알람</b>이었습니다 (8번). 색 칩이 사는 곳은 <b>폰 폭</b>의
       홈입니다. 그래서 <b>390 으로 따로 엽니다.</b>                      */
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2200);
    await pg.evaluate(SEED);
    await pg.evaluate(() => { try{ go('home'); }catch(e){} });
    await pg.waitForTimeout(1600);
    const R = await pg.evaluate(() => {
      const 밝기 = c => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return m ? Math.round(.299 * +m[1] + .587 * +m[2] + .114 * +m[3]) : null; };
      const pane = document.getElementById('dynPane') || document.body;
      const out = [];
      pane.querySelectorAll('*').forEach(e => {
        /* ⚠ ★★ <b>바닥을 40px 로 두었다가 되돌림이 안 울렸습니다.</b> 칩의
           글자를 지우면 칸이 <b>패딩만큼</b>(14px쯤)으로 줄어 그물에서
           빠집니다 — 그런데 <b>색만 있는 작은 점</b>이 바로 이 자가 잡아야
           하는 것입니다. 바닥을 <b>10px</b> 로 내립니다 (8번).           */
        if (!e.offsetParent || e.offsetWidth < 10 || e.offsetHeight < 6) return;
        const cs = getComputedStyle(e), bg = cs.backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
        const b = 밝기(bg); if (b === null || b >= 250) return;        /* 흰색은 뜻이 아니다 */
        const 제글 = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('').replace(/\s+/g, '');
        const 속글 = (e.textContent || '').replace(/\s+/g, '');
        out.push({ cls: (e.className || '').toString().slice(0, 36), 밝기: b,
                   글있다: !!(제글 || 속글), 글: 속글.slice(0, 20) });
      });
      return out;
    });
    await pg.close();
    const 색만 = R.filter(x => !x.글있다);
    /* ★★ <b>여기서 재는 것과 묻는 것을 갈랐습니다.</b> 그린 칸을 훑어
       「글자가 있나」 를 묻게 두었더니, 글자를 지우는 되돌림이 <b>안 울렸습니다</b> —
       그 칩이 이 자의 견본에서는 <b>안 서기</b> 때문입니다. 안 울리는 알람은
       알람이 아닙니다 (8번). 그래서 —
         ① <b>그린 것은 적어만 둡니다</b>(사람이 눈으로 봅니다).
         ② <b>묻는 것은 표</b>입니다 — 상태를 색으로 가르는 표마다 <b>글자가
            함께 있나</b>. 표는 견본과 무관하게 늘 있으므로 <b>되돌리면
            반드시 울립니다.</b>                                           */
    is(R.length > 0, '  ★ 색 있는 칸을 <b>찾았다</b> — ' + R.length + '곳 (0곳이면 자가 못 찾은 것입니다 · 8번)');
    const BA = (() => { const i = IDXP.indexOf('var HM_BA_TAG={'); if (i < 0) return [];
      const r = IDXP.slice(i, IDXP.indexOf('};', i));
      return [...r.matchAll(/(\w+)\s*:\{\s*c\s*:\s*'([^']*)'\s*,\s*t\s*:\s*'([^']*)'/g)]
        .map(m => ({ k: m[1], c: m[2], t: m[3] })); })();
    const 글없는표 = BA.filter(x => !x.t.replace(/[^\uAC00-\uD7A3A-Za-z0-9]/g, ''));
    is(BA.length >= 4 && 글없는표.length === 0,
      '  ★★ 상태를 <b>색으로 가르는 표</b> ' + BA.length + '줄이 다 <b>글자를 함께</b> 들고 있다 — '
        + BA.map(x => x.c + '=「' + x.t + '」').join(' · ')
        + (글없는표.length ? ('\n      ✗ 색만 있고 글자가 없는 줄: ' + 글없는표.map(x => x.k).join(' · ')) : ''));
    if (색만.length) console.log('  · ⚠ 그린 칸 가운데 글자가 안 잡힌 것: ' + 색만.map(x => x.cls || '(이름 없음)').join(' · '));
    const 어두운 = R.filter(x => x.밝기 < 120).map(x => (x.cls || '(이름 없음)') + '(' + x.밝기 + ')');
    console.log('  · 홈에 색이 남은 칸 ' + R.length + '곳 — 짙은 것 ' + 어두운.length + '곳: ' + (어두운.join(' · ') || '없음'));
    console.log('  · ★ 「연노랑·연파랑·연초록 셋」 은 <b>이미 없습니다</b> — 그 자리를 다시 색으로 가르지 마십시오');
  }

  console.log('\n[6] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 색표가 한 벌이고, 흰 카드가 회색 판 위에 뜹니다.');
  process.exit(bad ? 1 : 0);
})();
