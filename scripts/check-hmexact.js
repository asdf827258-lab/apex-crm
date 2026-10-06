/* ══════════════════════════════════════════════════════════════════
   check-hmexact.js — <b>홈이 목업과 색·둥글기까지 같은가.</b>

   사장님 말씀 — 「목업과 홈화면 <b>토시 하나 디자인 하나 색상 하나</b>
   안 틀리고 맞추고」.

   ── 잰 방법 ──────────────────────────────────────────────────────
   목업(docs/토스판_사본.html)과 앱 홈을 <b>폰 430px 에서 나란히 띄워</b>
   글자색·바탕색·둥글기를 <b>getComputedStyle 로</b> 떠서 견줍니다.
   ★ <b>여기에 hex 를 적지 않습니다.</b> 목업 파일에서 그때그때 읽습니다 —
     적어 두면 사장님이 목업을 고치실 때 이 줄이 낡아 거짓말이 됩니다 (8번).

   ── 여기서 실제로 달랐던 것 ──────────────────────────────────────
     · 글자색   앱 #0D1117 · #374151 · #6B7280  ↔  목업 #191F28 · #6B7684
     · 둥글기   앱 16px                          ↔  목업 20px
   앱은 잉크가 다섯 단계고 목업은 셋이라, 자리마다 고치는 대신
   <b>홈(.hm-toss)에서 토큰을 덮어썼습니다</b> — 고칠 자리가 한 곳입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 홈이 <b>목업의 글자색만</b> 쓴다
     [2] 카드 <b>둥글기</b>가 목업과 같다
     [3] <b>홈에만</b> 걸었다 — 다른 화면은 제 옷 그대로다
     [4] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
/* ══ 🕰 <b>시계를 못 박습니다</b> ═══════════════════════════════════
   ⚠ 2026-09-30 에 이 자가 CI 에서만 빨간불이 됐습니다 — 같은 코드인데
     로컬은 초록, CI 는 「오늘의 AI 비서」 에 목각 밖 색 하나. 재어 보니
     그 화면의 <b>잎이 8개(로컬) 대 18개(CI)</b> 였습니다. 날짜에 따라
     그려지는 칸이 달라지기 때문입니다.
   ★ 같은 날 같은 것을 봐야 자가 자입니다. check-phonefit 와 <b>같은 날</b>로
     못 박습니다. 얼리지 않고 옮깁니다 — 멈추면 기다리는 자리가 안 끝납니다.
   ★ 날짜를 바꾸면 이 자가 보는 화면도 달라집니다.                     */
const 못박은날 = '2026-09-15T09:00:00Z';
const PIN = (iso) => {
  const FIX = new Date(iso).getTime();
  const R = Date;
  const off = FIX - R.now();
  function F(...a){ return a.length ? new R(...a) : new R(R.now() + off); }
  F.now = () => R.now() + off;
  F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8967;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
               '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' }); rs.end('{"key":null,"has":false}'); return;
  }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 견본은 <b>홍길동</b> 집안 (3번) */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {};
  window.setupDone = function () { return true; }; window.setupCanRun = function () { return true; };
  /* ★★ <b>서버를 막습니다 — 안 막으면 자가 「그날 망 사정」 을 잽니다.</b>
     ⚠ 2026-09-30 에 이 자가 CI 에서만 빨간불이었습니다. 「오늘의 AI 비서」 의
       잎이 <b>로컬 8개 · CI 18개</b> 였습니다. 그 화면은 서버에 세어 달라고
       물어서 칸을 그리는데, <b>물음이 빨리 실패하면 칸이 서고 느리면 「집계하는
       중…」 에 머뭅니다.</b> 그래서 같은 코드가 곳에 따라 다른 화면이 됩니다.
     ★ 시계를 못 박아도 이건 안 고쳐집니다 — 날짜가 아니라 <b>망</b>입니다.
       빈 답을 <b>곧바로</b> 돌려주어 어디서 돌리든 같은 화면을 보게 합니다.
       다른 자들(check-cusskin 등)이 이미 이렇게 합니다 (5번).           */
  const chain = v => { const o = { then: function (f) { try { f(v); } catch (e) {} return o; },
                                   catch: function () { return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k] = function () { return o; }; });
    o.single = function () { return chain({ data: null }); };
    o.maybeSingle = function () { return chain({ data: null }); }; return o; };
  window.osClient = function () { return { from: function () { return {
      select: function () { return chain({ data: [], count: 0 }); },
      update: function () { return chain({}); }, insert: function () { return chain({}); },
      upsert: function () { return chain({}); }, delete: function () { return chain({}); } }; } }; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = []; CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id: 'd1', who: 'me', name: '홍길동A', region: '순천', src: '일반', stage: 'AP', days: 3, n: 2, res: '상담', cAt: '', pAt: '' },
           { id: 'd2', who: 'me', name: '홍길순', region: '광주', src: '소개', stage: 'TA', days: 9, n: 1, res: '', cAt: '', pAt: '' }];
  go('home');
};
/* 글자색을 <b>쓰인 대로</b> 모읍니다 — 글이 있는 잎만 셉니다 */
const INKS = (sel) => {
  const out = {};
  document.querySelectorAll(sel + ' *').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (!t) return;
    /* ⚠ <b>이모지만 있는 잎은 안 셉니다.</b> 이모지는 제 색으로 그려지고
       computed color 는 검정으로 나옵니다 — 그것을 「목업에 없는 색」 으로
       세면 헛것입니다 (8번). 글자가 섞여 있으면 그때는 셉니다. */
    if (!/[0-9A-Za-z가-힣]/.test(t)) return;
    const c = getComputedStyle(e).color;
    if (!out[c]) out[c] = { n: 0, t: [] };
    out[c].n++;
    /* ★ <b>글까지 모읍니다</b> (2026-09-30). 여태는 「색 3가지」 만 알려 주고
       <b>왜 다른지는 안 알려 줬습니다</b> — 그래서 곳에 따라 갈리는 것을
       세 번이나 못 찾았습니다. 「갈렸다」 만 알고 <b>무엇이 갈렸는지</b>를
       안 찍었기 때문입니다. 글 몇 개만 있으면 그 화면에 <b>무엇이
       그려졌는지</b> 한눈에 보입니다 (8번).                             */
    if (out[c].t.length < 4) out[c].t.push(t.slice(0, 34));
  });
  return out;
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  /* ══ 🔌 <b>바깥을 막습니다 — 세 번째 흔들림의 뿌리였습니다</b> (2026-09-30) ══
     ⚠ 이 자는 <b>막는 줄이 없었습니다.</b> 그래서 <b>CI 에서는 진짜 서버가
       답했습니다</b> — 사장님의 진짜 공지 일곱 칸(게시 중 셋 · 내려짐 넷)과
       <b>11.9MB 사진</b>까지 그려졌습니다(잎 116개). 제 컨테이너는 그 서버에
       못 닿아 빈 화면이었습니다(34개). <b>같은 코드가 곳에 따라 다른 화면</b>이
       된 까닭이 이것입니다 — 색이 아니라 <b>자료</b>가 달랐습니다.
     ★ 제 씨앗은 사진을 만들지 않습니다. 「11.9MB」 는 <b>진짜 자료</b>라야
       나올 수 있는 값이고, 그것이 움직일 수 없는 증거입니다.
     ★ <b>이것은 값을 못 맞춘 탈이 아니라 자가 밖을 봐서 생긴 탈</b>입니다.
       다른 자들(check-askall · check-airep · check-homeshape …)은 이미 이
       한 줄을 씁니다 (5번 · 「같은 것을 두 곳에 두지 않는다」).
     ★ 덤으로 — 점검이 사장님 자료를 읽으면 <b>그 글이 CI 기록에 찍힙니다.</b>
       공지에 고객 이름이 들어 있으면 그대로 남습니다 (3번). 막아야 할
       까닭이 하나 더 있습니다.                                          */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
                                  ? r.continue() : r.abort());
  await ctx.addInitScript(PIN, 못박은날);      /* 🕰 날짜가 흘러도 같은 화면을 보게 */
  const errs = [];

  /* ── 목업을 먼저 읽습니다 — 자(尺)는 사장님 파일입니다 ── */
  const mp = await ctx.newPage();
  await mp.goto('http://127.0.0.1:' + PORT + '/docs/' + encodeURIComponent('토스판_사본.html'),
                { waitUntil: 'domcontentloaded' });
  await mp.waitForTimeout(2200);
  /* ⚠ <b>목업이 그날 그린 색</b>만 자로 삼지 않습니다. 목업에도 --t-neg
     처럼 <b>그 화면에 안 나온 색</b>이 있고, 그것을 쓰는 것은 어긋남이
     아닙니다 — 「목업에 없는 색」 이라고 적으면 헛것입니다 (8번).
     그래서 자는 <b>목업의 색표(--t- 토큰) 전체</b>입니다.            */
  const MK = await mp.evaluate((f) => {
    const cs = getComputedStyle(document.documentElement);
    const g = (k) => cs.getPropertyValue(k).trim();
    const card = document.querySelector('.t-card');
    /* 색표를 <b>통째로</b> 읽습니다 — 이름을 손으로 안 적습니다 */
    const pal = [];
    for (const sh of document.styleSheets) {
      let rules = []; try { rules = sh.cssRules || []; } catch (e) {}
      for (const r of rules) {
        if (!r.style || !/:root/.test(r.selectorText || '')) continue;
        for (const n of r.style) if (n.indexOf('--t-') === 0) {
          const v = r.style.getPropertyValue(n).trim();
          if (/^#[0-9a-f]{3,8}$/i.test(v)) pal.push(v);
        }
      }
    }
    /* ⚠ 2026-09-26 — <b>여기가 좁았습니다.</b> 위 두 가지는 「목업 색표(:root)」 와
       「목업이 <b>지금 화면에 그린</b> 색」 뿐입니다. 그런데 목업은 .note 처럼
       <b>그 화면에 안 뜨는 규칙</b>에도 색을 적어 둡니다 — .note 의 진한 호박색
       #8A5A12 가 그것입니다. 그 색을 앱이 쓰자 「목업에 없는 색」 이라고
       울렸습니다. <b>목업에 있는데 자가 못 본 것</b>이었습니다 (8번).
       그래서 목업 CSS 의 <b>글자색 선언</b>도 같이 읽습니다 — 이름을 손으로
       적지 않는다는 규칙은 그대로입니다.                                  */
    const inkPal = [];
    for (const sh of document.styleSheets) {
      let rules = []; try { rules = sh.cssRules || []; } catch (e) {}
      for (const r of rules) {
        if (!r.style) continue;
        /* ⚠ 크로미움은 규칙 안의 #8A5A12 를 <b>rgb(138, 90, 18) 로 바꿔</b>
           돌려줍니다. 처음에 # 만 찾다가 한 가지도 못 읽었습니다 — 자가
           <b>아무것도 안 읽고도 조용했으면</b> 더 나빴을 것입니다. 그래서
           읽은 수가 3가지 아래면 그 자체로 빨간불입니다 (8번).          */
        const v = (r.style.getPropertyValue('color') || '').trim();
        if (/^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v)) inkPal.push(v);
      }
    }
    return { ink: g('--t-ink'), sub: g('--t-sub'), sub2: g('--t-sub2'), point: g('--t-point'),
             r: card ? getComputedStyle(card).borderRadius.split(' ')[0] : '',
             pal: [...new Set(pal)], inkPal: [...new Set(inkPal)],
             inks: (new Function('return (' + f + ')("#scr")'))() };
  }, INKS.toString());
  /* ── ⚠★ 2026-10-05 · <b>여기가 또 좁았습니다</b> (물결 5 · 사장님 ⓒ) ──────
     자가 <b>목업의 :root</b> 만 색표로 읽습니다. 그런데 우리 색표(app/ui.css)는
     사장님 허락을 받아 <b>늘어났습니다</b> — 목업 19개 → 우리 35개. 늘린
     열여섯은 저마다 ui.css 에 까닭이 적혀 있습니다(--t-line-2 는 카드 안쪽
     줄이 --t-line 이면 너무 진해서, --t-bg-b 는 같은 연파랑이 다섯 값으로
     갈려 있어서, --t-warn-d 는 --t-warn 이 연한 바탕 위 3.00 이라서…).
     그래서 옷 입은 화면이 <b>우리 색표의 이름</b>을 쓰면 「목업에 없는 색」
     이라고 울렸습니다 — <b>자가 낡은 것</b>입니다.
     실제로 물결 5 에서 다섯 화면(fp_talk · dz_guide · inv_econ · biz_fund ·
     ready)이 --t-line-3 · --t-pos-d · --t-neg-d 때문에 걸렸습니다.

   ★★ <b>넓히면서 이(齒)를 두 개 심습니다 — 느슨해지지 않게.</b>
     그냥 「ui.css 에 있으면 통과」 로 두면 아무나 --t-아무거나:#BADBAD 를
     넣고 지나갈 수 있어 자가 <b>이가 빠집니다</b>. 그래서 아래 [0-1]·[0-2]
     를 같이 세웁니다 —
       [0-1] 우리가 <b>늘린 이름 수</b>가 기준선 안쪽인가 — 새 토큰을 넣으면
             기준선을 올려야 하고, 그것은 <b>눈에 보이는 일</b>이 됩니다
             (check-skinmap · check-onepal 과 같은 방식 · 0-1번).
       [0-2] 목업에도 있는 <b>열아홉 이름의 값이 한 자도 안 어긋났나</b> —
             우리 색표가 목업에서 <b>흘러내리지 않았나</b>. 예전 자는 이것을
             아예 안 봤습니다. <b>통틀어 조여졌습니다.</b>                 */
  const UICSS = fs.readFileSync('app/ui.css', 'utf8');
  const 뜨기 = (t) => { const o = {};
    (t.match(/:root\s*\{[\s\S]*?\}/g) || []).forEach(b =>
      /* ⚠★ 처음에 /--t-[a-z0-9-]+/ 로 적었더니, 되돌림 시험으로 넣어 본
         <b>--t-몰래</b>(한글 이름)를 자가 <b>못 봤습니다.</b> 제 시험이 자에
         안 닿은 것이라 둘 다 고쳤습니다 — 이름은 <b>쉼표·콜론·공백이 아닌
         무엇이든</b> 봅니다. 규약은 영문 소문자지만, 규약을 어긴 이름이야말로
         이 자가 잡아야 하는 것입니다 (8번).                             */
      (b.match(/--t-[^\s:;{}]+\s*:\s*[^;}]+/g) || []).forEach(x => {
        const i = x.indexOf(':'); const n = x.slice(0, i).trim(), v = x.slice(i + 1).trim().toUpperCase();
        if (/^#[0-9A-F]{3,8}$/.test(v)) o[n] = v; }));
    return o; };
  const 우리색 = 뜨기(UICSS);
  const 목업색 = 뜨기(fs.readFileSync('docs/토스판_사본.html', 'utf8'));
  const 늘린이름 = Object.keys(우리색).filter(k => !(k in 목업색));
  const 어긋난이름 = Object.keys(우리색).filter(k => k in 목업색 && 목업색[k] !== 우리색[k]);
  /* 자 = 목업이 <b>그린</b> 색 + 목업 <b>색표</b> + 목업 CSS 가 적어 둔 <b>글자색</b>
         + <b>우리가 까닭을 적고 늘린 이름</b> (아래 두 이가 지킵니다) */
  const mkInks = [...new Set(Object.keys(MK.inks)
    .concat(MK.pal.map(hex2rgb))
    .concat((MK.inkPal || []).map(hex2rgb))
    .concat(Object.values(우리색).map(hex2rgb)))];
  console.log('\n[0] 목업에서 <b>자를 읽습니다</b>');
  is(!!MK.ink && !!MK.r, '  목업의 글자색·둥글기를 읽었다 — 글자 ' + MK.ink + ' · 둥글기 ' + MK.r);
  is(MK.pal.length >= 10, '  목업의 <b>색표</b>를 통째로 읽었다 — ' + MK.pal.length + '가지');
  is((MK.inkPal || []).length >= 3,
     '  목업 CSS 가 <b>적어 둔 글자색</b>도 읽었다 — ' + (MK.inkPal || []).length +
     '가지 (그 화면에 안 떠도 목업의 색입니다)');
  is(mkInks.length >= 3, '  자로 삼을 색 ' + mkInks.length + '가지 (그린 색 + 색표 + 우리가 늘린 이름)');

  console.log('\n[0-1] ★★ 우리 색표가 목업보다 <b>늘린 이름</b>이 기준선 안쪽인가');
  /* ⚠ 16 은 <b>세어서 적은 수</b>입니다 (2026-10-05). 토큰을 하나 세우면 이 자가
     울리고, 기준선을 올리는 것이 <b>그 토큰을 세웠다는 기록</b>이 됩니다 (0-1번).
     ★ 줄이면 같이 내립니다. 늘면 <b>까닭을 ui.css 에 적고</b> 올리십시오.    */
  /* ★ 16 → 17 · 2026-10-06 — <b>--t-teal</b> 을 세웠습니다(물결 7). 떠돌던 청록이
     세 파일에 따로 있고 이름이 --t- 가 아니어서 <b>이 자가 아예 못 봤습니다</b>.
     색표에 제자리를 주니 자가 보게 되었고, 그래서 이 수도 하나 올립니다 —
     <b>토큰을 세웠다는 기록</b>입니다 (0-1번).                              */
  const 늘린기준 = 17;
  is(늘린이름.length <= 늘린기준,
     '  우리가 늘린 이름 <b>' + 늘린이름.length + '개</b> — 기준선 ' + 늘린기준 +
     (늘린이름.length > 늘린기준
       ? ' ← ★ <b>늘었습니다.</b> ' + 늘린이름.slice(-3).join(' · ') +
         ' — ui.css 에 까닭을 적고 이 기준선을 올리십시오 (색표는 한 벌 · 5번)'
       : (늘린이름.length < 늘린기준 ? ' ← 줄었습니다. 기준선을 ' + 늘린이름.length + ' 로 내려 주십시오' : '')));

  console.log('\n[0-2] ★★ 목업에도 있는 이름의 값이 <b>한 자도 안 어긋났나</b> (5번)');
  is(어긋난이름.length === 0,
     '  목업과 겹치는 이름 ' + (Object.keys(우리색).length - 늘린이름.length) +
     '개가 <b>값까지 같다</b>' +
     (어긋난이름.length
       ? ' ← ★ <b>흘러내렸습니다:</b> ' +
         어긋난이름.map(k => k + ' 목업 ' + 목업색[k] + ' / 우리 ' + 우리색[k]).join(' · ')
       : ''));

  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e.message || e).slice(0, 130)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3600);
  await p.evaluate(SEED);
  await p.waitForTimeout(2200);

  /* ⚠ 2026-09-25 — 여기는 <b>홈만</b> 보고 있었습니다. 사장님이 「아래 띠
     네 화면도 목업 옷으로」 하셔서 옷을 입는 화면이 늘었습니다. 늘어난 것을
     여기서 안 보면, 오늘은 맞아도 내일 누가 그 화면에 손으로 색을 적어도
     <b>조용합니다</b> (8번).
     ★ <b>화면 목록을 여기 손으로 안 적습니다</b> — 앱의 T_SKIN 표를 그대로
       읽습니다. 여기 또 적으면 두 벌이 되어, 화면이 늘 때 한쪽만 늘어납니다 (5번). */
  const SKIN = await p.evaluate(() => Object.keys(typeof T_SKIN !== 'undefined' ? T_SKIN : {}));
  is(SKIN.length >= 2, '  앱에서 <b>옷 입는 화면 목록</b>을 읽었다 — ' + SKIN.join(' · '));
  /* ⚠ <b>목록을 앱에서 읽기만 하면, 목록이 줄 때 점검도 같이 줍니다.</b>
     일부러 달력을 빼 봤더니 <b>조용했습니다</b> — 그 화면을 안 돌 뿐이니까요.
     안 울리는 알람은 알람이 아닙니다 (8번). 그래서 <b>다른 자</b>를 댑니다:
     사장님이 시키신 것은 <b>아래 띠</b>였으므로, 아래 띠(TB)에 선 화면은
     「도구」(☰ 서랍을 여는 단추라 화면이 아닙니다)만 빼고 <b>다 옷을 입어야</b>
     합니다. 아래 띠도 앱에서 읽으니 여기에 화면 이름을 손으로 안 적습니다 (5번). */
  const BAND = await p.evaluate(() =>
    (typeof TB !== 'undefined' ? TB : []).map(x => x.id).filter(id => id && id.indexOf('__') !== 0));
  const bandMiss = BAND.filter(id => SKIN.indexOf(id) < 0);
  is(BAND.length >= 4, '  <b>아래 띠</b>도 앱에서 읽었다 — ' + BAND.join(' · '));
  is(bandMiss.length === 0,
     '  아래 띠에 선 화면이 <b>하나도 안 빠졌다</b>' +
     (bandMiss.length ? (' ← 옷을 안 입는 칸: ' + bandMiss.join(' · ')) : ''));

  console.log('\n[1] 옷 입은 화면이 <b>목업의 글자색만</b> 쓴다');
  const AP = await p.evaluate((f) => (new Function('return (' + f + ')(".hm-toss")'))(), INKS.toString());
  /* 목업에 없는 색 — 흰 글자(단추 위)와 <b>약관·공지</b> 줄은 뺍니다.
     그 둘은 <b>목업에 아예 없는 칸</b>이라 견줄 짝이 없습니다 (1번). */
  const SKIP = await p.evaluate(() => {
    const o = {};
    document.querySelectorAll('.hm-toss .notice *,.hm-toss .hm-noti *').forEach(e => {
      if (e.children.length || !(e.textContent || '').trim()) return;
      o[getComputedStyle(e).color] = 1;
    });
    /* ⚠ 2026-09-25 — 여기에 <b>퀘스트 띠(.hm-q) 예외</b>가 있었습니다.
       남색(#0F172A) 바탕이라 목업의 글자색을 올리면 안 읽혀서였습니다.
       그 띠가 <b>밝아졌습니다</b>(--t-bg-3) — 이제 견줄 짝이 있으므로
       예외를 <b>걷어냅니다</b>. 안 울리는 알람은 알람이 아닙니다 (8번).  */
    o['rgb(255, 255, 255)'] = 1;                    /* 단추 위 흰 글자 */
    return Object.keys(o);
  });
  const odd = Object.keys(AP).filter(c => mkInks.indexOf(c) < 0 && SKIP.indexOf(c) < 0);
  is(odd.length === 0,
     '  홈의 글자색이 <b>전부 목업 것</b>이다 — ' + Object.keys(AP).length + '가지' +
     (odd.length ? (' ← 목업에 없는 색 ' + odd.join(' · ')) : ''));
  ['ink', 'sub', 'sub2', 'point'].forEach(k => {
    const hex = MK[k], rgb = hex2rgb(hex);
    is(Object.keys(AP).some(c => c === rgb),
       '  목업의 <b>' + k + '</b>(' + hex + ')가 홈에 <b>실제로</b> 쓰인다');
  });

  console.log('\n[2] 카드 <b>둥글기</b>가 목업과 같다');
  const R = await p.evaluate(() => {
    const o = {};
    document.querySelectorAll('.hm-toss .card,.hm-toss .hm-act,.hm-toss .hm-mv').forEach(e => {
      o[getComputedStyle(e).borderRadius.split(' ')[0]] = (o[getComputedStyle(e).borderRadius.split(' ')[0]] || 0) + 1;
    });
    return o;
  });
  const rs = Object.keys(R);
  is(rs.length === 1 && rs[0] === MK.r,
     '  홈 카드가 <b>' + MK.r + '</b>(목업)이다 — ' + rs.map(k => k + '×' + R[k]).join(' · '));

  /* ── 옷 입은 화면마다 <b>실제로 열어</b> 색을 떠 본다 ────────────────
     선언만 보면 「입혔다」 까지만 압니다. 그 화면에 <b>손으로 적힌 hex</b> 가
     남아 있으면 잉크 표를 갈아끼워도 그대로 나옵니다 — 실제로 콘텐츠 화면이
     그랬고(글자의 85%), 자리를 하나씩 떠서 찾아 고쳤습니다.            */
  console.log('\n[1-2] 옷 입은 화면을 <b>하나씩 열어</b> 떠 본다');
  for (const t of SKIN) {
    if (t === 'dashboard') continue;                 /* 홈이 없을 때의 대타라 따로 안 연다 */
    const R2 = await p.evaluate(async (args) => {
      const [tab, f] = args;
      try { go(tab); } catch (e) {}
      /* ══ ⏳ <b>「1.8초 지났다」 가 아니라 「다 그려졌다」 를 기다립니다</b> ══
         (2026-09-30) 여태는 <b>시간을 셌습니다.</b> 그러면 곳에 따라 빠르고
         느릴 때 <b>다른 순간을 재게</b> 됩니다 — 「1.8초로 모자랐다」 도
         「1.8초는 길었다」 도 다 탈입니다. 잎 수가 <b>두 번 연속 같으면</b>
         그때 잽니다. 최대 6초까지만 기다립니다(안 멎는 화면도 있으니).
         ★ 이 하나로 <b>때의 차이</b>는 통째로 없어집니다. 남는 것이 있으면
           그것은 <b>곳의 차이</b>이고, 아래 쪽지가 그것을 찍습니다.      */
      const cnt = () => document.querySelectorAll('#dynPane *').length;
      let last = -1, same = 0, waited = 0;
      while (waited < 6000) {
        await new Promise(r => setTimeout(r, 200)); waited += 200;
        const c = cnt();
        if (c === last) { same++; if (same >= 2 && waited >= 600) break; } else same = 0;
        last = c;
      }
      const d = document.getElementById('dynPane');
      /* ★ <b>자가 스스로 말하게</b> — 갈렸을 때 「무엇이」 갈렸는지 (8번) */
      let admin = null; try { admin = (typeof osIsAppAdmin === 'function') ? !!osIsAppAdmin() : 'x'; } catch (e) { admin = '터짐'; }
      let ls = 0; try { ls = Object.keys(localStorage).length; } catch (e) {}
      return { on: d.classList.contains('t-skin'),
               inks: (new Function('return (' + f + ')("#dynPane")'))(),
               waited: waited, nodes: last, role: (OS.profile || {}).role, admin: admin, ls: ls,
               top: [...(d.querySelector('.tab-pane') || d).children]
                      .map(e => e.id || String(e.className || '').split(' ')[0]).slice(0, 8) };
    }, [t, INKS.toString()]);
    const cs = Object.keys(R2.inks), n = cs.reduce((a, c) => a + R2.inks[c].n, 0);
    const bad2 = cs.filter(c => mkInks.indexOf(c) < 0 && SKIP.indexOf(c) < 0);
    const badN = bad2.reduce((a, c) => a + R2.inks[c].n, 0);
    is(R2.on, '  [' + t + '] <b>옷을 입는다</b> (#dynPane 에 t-skin)');
    is(n > 0, '  [' + t + '] 글자가 <b>실제로 떠졌다</b> — ' + n + '개');
    is(bad2.length === 0, '  [' + t + '] 글자색이 <b>전부 목업 것</b>이다' +
       (bad2.length ? (' ← 목업에 없는 색 ' + bad2.length + '가지 · 글자 ' + badN + '개') : ''));
    /* ★★ 빨개지면 <b>왜 다른지</b>를 그 자리에서 적습니다. 로컬과 CI 가
       갈렸을 때 <b>로그만 견주어도</b> 원인이 보이게 — 세 번을 못 찾은
       까닭은 「갈렸다」 만 알고 무엇이 갈렸는지 안 찍어서입니다.        */
    if (bad2.length) {
      console.log('      ── 왜 다른가 (이 줄을 CI 와 견주십시오)');
      console.log('         잎 ' + n + '개 · 칸 ' + R2.nodes + '개 · 기다림 ' + R2.waited + 'ms · ' +
                  'role=' + R2.role + ' admin=' + R2.admin + ' ls=' + R2.ls);
      console.log('         위칸 ' + R2.top.join(' · '));
      bad2.slice(0, 6).forEach(c => console.log('         ' + c + ' ×' + R2.inks[c].n +
                  '  ← 「' + R2.inks[c].t.join('」 「') + '」'));
    }
  }

  console.log('\n[3] <b>표에 적힌 화면에만</b> 걸었다 — 나머지는 제 옷 그대로다');
  /* ★ <b>전체화면으로 빠져나가는 화면</b>으로 잽니다. 한 번은 옷 입히는 줄을
     그 화면들 <b>뒤</b>에 두어, DB 통합 CRM 이 앞 화면의 옷을 그대로 입고
     있었습니다. TFA 로 재면 그것을 못 봅니다 — TFA 는 그 줄에 닿거든요.
     일부러 줄을 뒤로 옮겨 보고 <b>여기서 울리는 것</b>을 확인했습니다 (8번). */
  const other = await p.evaluate(async () => {
    go('home'); await new Promise(r => setTimeout(r, 700));      /* 먼저 옷을 입혀 두고 */
    const before = document.getElementById('dynPane').classList.contains('t-skin');
    go('crm'); await new Promise(r => setTimeout(r, 1200));      /* 전체화면으로 빠져나간다 */
    const skin = document.getElementById('dynPane').classList.contains('t-skin');
    /* ★ 2026-10-01 — 여기 <b>airep 이 박혀 있었습니다.</b> 그런데 airep 이
       옷을 입자 이 줄이 울렸습니다. 자가 틀린 것이 아니라 <b>사실이 바뀐</b>
       것입니다. 줄이지 않고 <b>새 사실에 맞춥니다</b> — 다만 이름을 또 박으면
       그 화면이 옷을 입는 날 똑같이 낡습니다. <b>표에 없는 보통 화면을
       코드에서 골라</b> 씁니다 (전체화면으로 빠져나가는 화면은 빼고).     */
    const skinTbl = (typeof T_SKIN === 'object' && T_SKIN) ? T_SKIN : {};
    const 전체화면 = ['finance','crm','apexmap','onecmp','mikki','car_fault',
                      'mikki_talk','sangdam','pdel','bohum','frmake'];
    let 보통 = '';
    try {
      (TABS || []).forEach(g => (g.items || []).forEach(it => {
        if (보통 || !it || !it.id) return;
        if (skinTbl[it.id] || 전체화면.indexOf(it.id) >= 0) return;
        보통 = it.id;
      }));
    } catch (e) {}
    if (보통) { go(보통); await new Promise(r => setTimeout(r, 900)); }
    return { before: before, skin: skin, 보통: 보통,
             skin2: document.getElementById('dynPane').classList.contains('t-skin'),
             ink: getComputedStyle(document.documentElement).getPropertyValue('--ink-1').trim() };
  });
  is(other.before, '  먼저 홈에서 <b>옷을 입혀 두었다</b>');
  is(!other.skin, '  <b>전체화면으로 빠져나가도 옷이 벗겨진다</b> (DB 통합 CRM)' +
     (other.skin ? ' ← 앞 화면의 옷을 그대로 입고 있습니다' : ''));
  is(!!other.보통, '  표에 <b>없는 보통 화면</b>을 코드에서 골랐다 — ' + (other.보통 || '못 골랐습니다'));
  is(!other.skin2, '  그 화면에는 <b>t-skin 이 안 붙는다</b> (' + (other.보통 || '?') + ')'),
  /* ⚠ 2026-09-26 에 <b>이 자를 옮겼습니다.</b> 여기는 「앱의 잉크 표를
     <b>안 건드렸다</b>」 를 재고 있었습니다 — 옷을 여섯 화면에만 입히던
     때는 맞았습니다. 나머지 92개까지 한 번에 바꾸면 무엇이 깨졌는지
     알 길이 없다고 보았기 때문입니다.
     그런데 사장님이 「색상부터 좀 변경해봐 <b>이거 아니잖아</b>」 하셔서
     재 보니, 그 <b>안 건드린 잉크 표</b>가 목업 색표와 나란히 서서
     회색을 두 가지로 만들고 있었습니다. 그래서 뿌리에서 목업 색을
     <b>가리키게</b> 했습니다.
     ★ 「무엇이 깨졌는지 알 길이 없다」 는 걱정은 <b>없애지 않고 옮겼습니다</b> —
       check-onepal 이 화면을 돌며 <b>묻힌 상자와 낮은 대비</b>를 잽니다.
       여기서는 이제 <b>같아졌는지</b>를 봅니다 (1번 · 5번).            */
  is(other.ink === MK.ink,
     '  앱의 잉크 표가 <b>목업 색과 같아졌다</b> — ' + other.ink + ' / 목업 ' + MK.ink +
     '\n      · 깨진 데가 없는지는 check-onepal 이 화면을 돌며 잽니다');

  console.log('\n[4] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 옷 입은 화면이 목업과 같은 색·같은 둥글기입니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();

function hex2rgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec((h || '').trim());
  if (!m) return h;
  const n = parseInt(m[1], 16);
  return 'rgb(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ')';
}
