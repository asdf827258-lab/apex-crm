/* ══════════════════════════════════════════════════════════════════
   check-hmtwo.js — <b>홈이 두 기둥으로 서는가.</b>

   사장님 말씀 (2026-09-30) — 그림 셋을 나란히 보여 드리고 여쭈었더니
   <b>「가*나 같이 해줘」</b>.
     가 — 두 기둥 + 접이 안에 묻혀 있던 둘을 오른쪽에 <b>꺼내</b> 세우기
     나 — 「오늘 챙길 것」 안의 긴 칸을 <b>접힌 채가 기본</b>으로

   ── 왜 두 기둥인가 ───────────────────────────────────────────────
   목각(docs/mokgak/home-standard.html)은 넓은 화면에서 <b>왼쪽 768 +
   오른쪽 344</b> 입니다. 재어 보니 목각 1,866px · 우리 홈 2,492px 이었고,
   짧은 까닭은 <b>오른쪽 넷이 왼쪽 그늘에 통째로 들어가서</b>였습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 넓은 화면(1440)에서 <b>두 기둥</b>이 나란히 선다 · 오른쪽 344px
     [2] 폰(390)에서는 <b>한 기둥</b>이다 — 목각에 폰 답이 없다 (1번)
     [3] ★★ 꺼낸 둘이 <b>두 벌이 아니다</b> — 접이 안에 안 남았다 (5번)
     [4] ★★ 접이 머리글이 <b>거짓말을 안 한다</b> — 안 든 것을 들었다고
         적지 않는다 (1번)
     [5] ★★ 「또 무엇을 할까요」 가 <b>접힌 채로 열리고, 눌러서 펴지고,
         편 것을 기억한다</b> — 감추기만 하고 길이 없으면 안 된다 (6번)
     [6] ★ <b>위의 넷은 안 움직였다</b> — 인사 · 상담현황 · 소식 · 접이가
         두 기둥 <b>위</b>에 그대로. 「상담현황은 인사 바로 밑」(사장님
         말씀 2026-09-27)과 「준비 SQL 은 홈 맨 위」(화면 다섯 곳이 그렇게
         가리킵니다)가 <b>둘 다 참</b>이어야 한다
     [7] <b>1101px 이 한 곳에서만 온다</b> — 위 띠(.topnav)와 두 기둥이
         같은 수다. 갈리면 기둥도 띠도 없는 폭이 생긴다 (5번)

   ── ⚠ 이 자가 <b>증명하지 못하는 것</b> ────────────────────────────
   「목각과 똑같아졌다」 는 <b>안 잽니다.</b> 목각 오른쪽 넷 중 셋(이번 주 ·
   이번 달 고객 관리 · 알람)은 <b>앱에 세는 자리가 없어</b> 아직 못 세웁니다.
   없는 수를 지어 카드를 세우지 않습니다 (1번). 그것까지 초록이라고 적으면
   이 자가 거짓말을 하는 것입니다 (8번).
   ══════════════════════════════════════════════════════════════════ */
const 못박은날 = '2026-09-15T09:00:00Z';
const PIN = (iso) => {
  const FIX = new Date(iso).getTime(); const R = Date; const off = FIX - R.now();
  function F(...a){ return a.length ? new R(...a) : new R(R.now() + off); }
  F.now = () => R.now() + off; F.parse = R.parse; F.UTC = R.UTC; F.prototype = R.prototype;
  window.Date = F;
};
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8968;
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

/* 견본은 <b>홍길동</b> 집안 (3번). 서버는 <b>빈 답을 곧바로</b> —
   안 막으면 이 자가 「그날 망 사정」 을 잽니다 (check-hmexact 에서 배운 것). */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {}; window.setupDone = function () { return true; };
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
  AR.db = [{ id:'d1', who:'me', name:'홍길동', region:'순천', src:'일반', stage:'AP', days:3, n:2, res:'상담', cAt:'', pAt:'' },
           { id:'d2', who:'me', name:'홍길순', region:'광주', src:'소개', stage:'TA', days:9, n:1, res:'', cAt:'', pAt:'' },
           { id:'d3', who:'me', name:'홍길중', region:'순천', src:'소개', stage:'PC', days:5, n:3, res:'', cAt:'', pAt:'' }];
  /* ══ 📰 <b>오늘 보낼 소식을 씨로 세웁니다</b> (판 X256) ═══════════════
     ★★ <b>여기가 판 X255 에서 제가 데인 자리입니다.</b> 이 자는 서버를 막아
       놓아(7번) 소식을 한 건도 못 받습니다. 그런데 「받아 둔 소식이 없으면
       아무 줄도 안 세웁니다」 가 규칙이라 📰 칸이 <b>아예 안 섰고</b>, 카드가
       라이브보다 <b>147px 짧게</b> 재어졌습니다. 저는 그 차이를 <b>「글꼴을
       못 받아서」</b> 라고 적어 두었는데 <b>틀렸습니다</b> — 재어 보니
       Pretendard 는 <b>여기서도 그대로 그려집니다</b> — 한글만 있는 같은 글이
       두 곳 다 <b>583.7px</b>(바탕 글꼴이면 676px)이고 document.fonts 도
       두 곳 다 「loaded」 입니다. 차이는 통째로 <b>이 소식 칸</b>이었습니다
       (1번 · 8번).
     ★ 그래서 <b>서버를 부르지 않고</b> 씨만 심습니다 — 자가 사장님 서버를
       읽으면 안 됩니다(check-netblock). 글은 <b>견본</b>이라고 밝힙니다:
       지어낸 기사를 진짜처럼 적지 않습니다 (1번 · 9번).
     ★ 두 줄로 접히는 길이로 둡니다 — 라이브의 제목도 두 줄(42px)입니다.  */
  try{ NLIVE.items = [{ t:'견본 기사 — 홍길동생명이 보험료 조정을 알렸습니다 (점검용 견본입니다)',
                        u:'https://example.com/견본', src:'견본통신', cat:'insurance', d:'2026-09-15' }];
       NLIVE.loaded = true; NLIVE.cat = 'all'; NLIVE.age = 'all'; }catch(e){}
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const open = async (w) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.addInitScript(PIN, 못박은날);
    await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForFunction(() => typeof renderHome === 'function' && typeof go === 'function', { timeout: 60000 });
    await p.evaluate(SEED);
    await p.waitForTimeout(2600);
    return p;
  };

  /* ── [1] 넓은 화면 — 두 기둥 ─────────────────────────────────── */
  console.log('\n[1] 넓은 화면(1440)에서 <b>두 기둥</b>이 선다');
  const PC = await open(1440);
  /* ══ 🧭 <b>판 X249 — 두 기둥이 「오늘」 카드(.tz) 안으로 올라왔습니다</b> ══
     사장님 말씀 (2026-10-30) — 「<b>지금할것 왼쪽 오른쪽은 활동</b> 으로
     나누어서 <b>한번에 보이게끔</b> 배치 짜줄수 있어? <b>첫 화면에서 딱</b>
     모든걸 확인하고 관리하고 <b>고객터치 만남까지</b> 가능하게」.
     ★★ <b>재어 보고 자리를 골랐습니다.</b> 「지금 할 것」 위에 있던 것은
       팀 고르개 <b>85px</b> 뿐이라 그 카드는 이미 첫 화면 안이었고, 빈 것은
       <b>오른쪽</b>이었습니다 — 넓은 화면에서 #hmSideUp 이 0px 이고 활동
       다섯이 y1,400 에 있었습니다. (제가 처음에 「위의 둘이 734px」 라고
       <b>틀리게</b> 적어 드렸고 갈라 재어 바로잡았습니다 · 1번.)
     ★ 그래서 <b>DOM 을 안 옮겼습니다</b> — .tz 를 두 기둥으로 만들고 이미
       있던 #hmSideUp 을 오른쪽 기둥으로 씁니다. 폰 차례는 그대로입니다.
     ★ 묻는 것은 <b>그대로</b>입니다 — 나란히 · 어깨 · 344px · 왼쪽이 넓다 ·
       오른쪽이 그늘에 든다. <b>보는 칸만</b> .hm-2col → .tz 입니다 (8번).  */
  const two = await PC.evaluate(() => {
    const c = document.querySelector('.tz'); if (!c) return { no: 1 };
    const L = document.getElementById('hmJobHost');
    const R = document.getElementById('hmSideUp');
    if (!L || !R) return { no: 1 };
    const rl = L.getBoundingClientRect(), rr = R.getBoundingClientRect();
    /* 왼쪽 기둥은 여러 칸이 쌓입니다 — <b>통째 높이</b>는 .tz 에서 오른쪽을
       뺀 것이 아니라, 왼쪽 칸들의 맨 위~맨 아래로 잽니다. */
    const 왼칸 = [...c.children].filter(e => e !== R && e.getBoundingClientRect().height > 0);
    const top = Math.min(...왼칸.map(e => e.getBoundingClientRect().top));
    const bot = Math.max(...왼칸.map(e => e.getBoundingClientRect().bottom));
    return { no: 0, lx: Math.round(rl.left), rx: Math.round(rr.left),
             ly: Math.round(top), ry: Math.round(rr.top),
             lw: Math.round(rl.width), rw: Math.round(rr.width),
             lh: Math.round(bot - top), rh: Math.round(rr.height),
             lk: 왼칸.map(e => e.id || e.className).join(' · '),
             rk: [...R.children].map(e => e.id || e.className).join(' · ') };
  });
  is(!two.no, '  <b>두 기둥 칸(.tz)</b>이 있다');
  is(!two.no && two.rx > two.lx, '  <b>나란히</b> 선다 — 왼쪽 x' + two.lx + ' · 오른쪽 x' + two.rx);
  is(!two.no && Math.abs(two.ly - two.ry) <= 2, '  <b>어깨를 맞춘다</b> — 왼쪽 y' + two.ly + ' · 오른쪽 y' + two.ry);
  is(!two.no && two.rw === 344, '  오른쪽 기둥이 <b>목각과 같은 344px</b> — ' + two.rw + 'px');
  is(!two.no && two.lw > two.rw, '  왼쪽이 <b>넓다</b> — ' + two.lw + ' > ' + two.rw);
  /* ★★ 사장님 말씀 그대로 — <b>왼쪽은 「지금 할 것」</b> 입니다 */
  is(!two.no && /hmJobHost/.test(two.lk) && two.lk.indexOf('hmJobHost') < 20,
     '  ★★ 왼쪽은 <b>「지금 할 것」</b> — ' + two.lk);
  /* ★★ <b>오른쪽은 「활동」</b> 입니다 (판 X249 · 사장님 말씀 「오른쪽은
     활동으로」). 고르신 다섯이 다 거기 섭니다 — 🚗 동선 · 📊 오늘 기록 ·
     💌 이번 달 고객 관리 · 📈 이번 주 · 🔔 알람.
     ⚠ 판 X248 에서 🚗 를 두 기둥 <b>아래</b>로 내렸던 것은 <b>되돌렸습니다</b> —
       사장님께서 「칸을 너무 잡아 먹는거 같아, 오른쪽에 조그만하게」 하셔서
       작게 만들어 오른쪽으로 올렸습니다. #hmRtWide 는 <b>안 지웠고</b>
       빈 채로 둡니다(되돌리실 자리 · 6번).                               */
  is(!two.no && /hmActHost/.test(two.rk) && /hmRtHost/.test(two.rk),
     '  ★★ 오른쪽은 <b>「활동」</b> — ' + two.rk);
  /* ★ 오른쪽이 왼쪽 그늘에 드는가 — 그것이 두 기둥을 세운 까닭이다 */
  is(!two.no && two.rh <= two.lh,
     '  ★ 오른쪽이 <b>왼쪽 그늘에 든다</b> — 오른쪽 ' + two.rh + 'px ≤ 왼쪽 ' + two.lh +
     'px (세로는 긴 쪽이 정합니다)');

  /* ── [1-a] 맨 위 한 장 — <b>둘 다</b> 있다 ───────────────────────── */
  console.log('\n[1-a] ★★ <b>맨 위 한 장이 서고</b>, <b>그 분을 들고 가는 길도 그대로</b> (사장님 말씀 「둘 다」)');
  /* 사장님 말씀 (2026-09-30) — <b>「둘 다 둡니다 — 맨 위에 세우세요」</b>.
     ⚠ 이 자리는 2026-09-23 에 <b>「맨위에 띄우지말고」</b> 로 뺐던 곳입니다.
       빼신 까닭은 맨 위 한 장이 <b>누구의 보장분석인지 모른 채</b> 화면만
       열어서였고, 그 문제는 <b>「오늘 제안하는 분 줄」(hmBaGo)</b> 이 이미
       풀었습니다. 뜻이 다릅니다 — 맨 위는 「아무나」, 줄은 「그 분」.
     ★ 그래서 <b>둘 다</b> 봅니다. 하나만 보면 다른 하나를 잃어도 조용합니다.

     ── ⚠ 2026-10-09 · 판 X81 · <b>맨 위 한 장의 생김새가 바뀌었습니다</b> ──
     사장님 말씀 — 「<b>맨 위에</b> 보장분석을 입력하세요 하면 ai 제안서가
     나오는데 <b>그 칸을 반으로 쪼개서</b> 왼쪽에 DB통합CRM 요약, 오른쪽에
     무엇을 도울까요? 사용설명서」. 고르신 꼴은 <b>「두 칸으로 바꾸고
     보장분석은 바로 아래 한 줄 단추로」</b> 입니다.

     그래서 <b>목각 ⑧ 의 파란 히어로(.tz-hero)는 여기서 걷혔습니다.</b>
     ★★ <b>되살리지 마십시오.</b> 잃은 것이 아니라 <b>사장님이 바꾸신 것</b>입니다.
        옛 글(「KB보장분석 넣어주시면 저희가 관리해드릴게요」)을 그리워해
        다시 세우면 <b>같은 자리에 두 벌</b>이 섭니다 (5번).
     ★ 다만 이 자가 지키던 <b>진짜 약속 셋은 그대로 지킵니다</b> —
       ⓐ 맨 위에 <b>무엇인가 선다</b>(지금은 두 칸)
       ⓑ <b>보장분석으로 가는 길</b>이 거기 있고 손가락 크기다(지금은 📄 한 줄)
       ⓒ 그것이 <b>상담현황보다 위</b>다
       바뀐 것은 <b>글자</b>뿐이고, 약속은 하나도 안 놓았습니다.
     ★ 자리와 수는 <b>check-hmsum</b> 이 따로 깊이 잽니다 — 여기서는
       「맨 위에 있나」 만 봅니다 (두 자가 같은 것을 두 번 세지 않게 · 5번). */
  const hero = await PC.evaluate(() => {
    const host = document.getElementById('hmTossHost');
    const two  = host ? host.querySelector('.hm-two') : null;
    const pdf  = host ? host.querySelector('.hm-pdf') : null;
    const flow = document.getElementById('hmFlowHost');
    return { has: !!two,
      옛히어로: host ? host.querySelectorAll('.tz-hero').length : 0,
      btn: pdf ? (pdf.innerText || '').replace(/\s+/g, ' ').trim() : '',
      tap: pdf ? Math.round(pdf.getBoundingClientRect().height) : 0,
      길: pdf ? (pdf.getAttribute('onclick') || '') : '',
      y: two ? Math.round(two.getBoundingClientRect().top) : 0,
      flowY: flow ? Math.round(flow.getBoundingClientRect().top) : 0,
      /* ★ 「그 분을 들고 가는 길」 이 살아 있나 — 함수와 부르는 자리 둘 다 */
      baGoFn: (typeof hmBaGo === 'function') };
  });
  is(hero.has, '  <b>맨 위 한 장</b>이 선다 — 지금은 두 칸(사장님께서 2026-10-09 에 바꾸셨습니다)');
  is(hero.옛히어로 === 0,
     '  <b>옛 파란 히어로가 안 남았다</b> — .tz-hero ' + hero.옛히어로 + '개 (되살리면 두 벌입니다 · 5번)');
  is(/보장분석/.test(hero.btn) && /go\('bojang'\)/.test(hero.길),
     '  ★★ <b>보장분석으로 가는 길</b>이 거기 있다 — 「' + hero.btn + '」');
  is(!!hero.btn && hero.tap >= 44, '  단추가 <b>손가락 크기</b>다 — 「' + hero.btn + '」 ' + hero.tap + 'px');
  is(hero.has && hero.flowY > hero.y,
     '  <b>상담현황보다 위</b>에 있다 (목각 차례) — 맨 위 한 장 y' + hero.y + ' · 상담현황 y' + hero.flowY);
  /* ★★ 둘 다 — 줄 쪽 길을 잃지 않았나 (5번 · 「함수를 지우지 않는다」) */
  is(hero.baGoFn, '  ★★ <b>「그 분을 들고 들어가는 길」(hmBaGo)도 그대로</b> 있다 — 맨 위는 「아무나」, 줄은 「그 분」');
  const baGoUse = require('fs').readFileSync(require('path').join(ROOT, 'app/index.html'), 'utf8');
  is((baGoUse.match(/hmBaGo\(/g) || []).length >= 2,
     '  그 길을 <b>부르는 자리도</b> 남아 있다 — 함수만 있고 안 부르면 죽은 판입니다 (5번)');

  /* ── [1-b] 곁기둥이 목각 차례대로 · 못 세는 것은 못 센다고 적는다 ─── */
  console.log('\n[1-b] ★★ <b>곁기둥이 목각 차례</b>이고, <b>못 세는 것은 못 센다고 적는다</b> (사장님 말씀)');
  /* 사장님 말씀 (2026-09-30) — <b>「칸은 세우고 「아직 못 셉니다」 라고 적기」</b>.
     목각 오른쪽은 넷입니다: 이번 주 · 오늘 동선 · 이번 달 고객 관리 · 알람.
     그중 셋은 <b>앱에 세는 자리가 없습니다</b>. 지어내지도, 비워 두지도
     않고 <b>화면에 그렇게 적습니다</b> (1번).                            */
  const side = await PC.evaluate(() => {
    const R = document.getElementById('hmSideUp'); if (!R) return { no: 1 };
    const cards = [...R.children].map(e => {
      const t = (e.innerText || '').replace(/\s+/g, ' ').trim();
      return { t: t, h: Math.round(e.getBoundingClientRect().height),
               head: t.split(' ').slice(0, 3).join(' ') };
    });
    return { no: 0, cards: cards, txt: (R.innerText || '').replace(/\s+/g, ' ').trim() };
  });
  /* ══ 🚗 <b>「오늘 어디로」 는 두 기둥 아래로 내려갔습니다</b> (판 X248 · 2026-10-30)

     사장님 말씀 — 「지역동선하고 <b>내가 추천 띄우고</b> … 오늘 한칸에서
     다 할 수 있도록 했는데 안되어있어서」. 추천을 <b>펴 두자</b> 이 자가
     바로 물었습니다 — 곁기둥이 <b>1,209~1,360px</b> 로 주기둥(797px)보다
     길어져 「곁은 본문 그늘에 든다」 가 깨졌습니다.
     ⚠ 제가 사장님께 <b>어림한 수를 드렸습니다</b> — 「이름을 넷만 펴면
       300px 만 늘고 균형도 유지된다」 고 적었는데, 갈라서 재어 보니
       <b>이름 넷은 151px 뿐</b>이고 나머지 <b>425px</b> 는 사장님이 따로
       시키신 글들(판 X142 「만나야 할 분」 · 판 X153 「돌아가기」 · 권하는
       동네)이었습니다. 그 글을 지우면 <b>사장님이 읽으시는 수가 사라집니다</b>.
       재어 보여 드리고 다시 여쭈니 <b>「두 기둥 아래 한 줄로 내리기」</b> 를
       고르셨습니다.
     ★ <b>목각 차례를 사장님이 바꾸신 것</b>입니다 — 자가 느슨해진 것이
       아닙니다. 그래서 묻는 것을 <b>그대로 지키되 자리만</b> 옮깁니다:
       넓을 때 곁기둥은 「이번 주 → 이번 달 고객 관리 → 알람」 이고,
       「오늘 어디로」 는 <b>두 기둥 아래</b>에 있어야 합니다. 없어지면
       빨간불입니다.
     ★ <b>폰은 안 바뀝니다</b> — 거기선 기둥이 위아래로 쌓입니다.        */
  const 있나 = (w) => !side.no && side.cards.some(c => c.t.indexOf(w) >= 0);
  ['이번 주', '이번 달 고객 관리', '알람', '오늘 어디로'].forEach(w =>
    is(있나(w), '  목각의 <b>「' + w + '」</b> 자리가 있다'));
  /* ★★ 🚗 가 <b>작아졌나</b> (판 X249 · 사장님 말씀 「오른쪽에 조그만하게」).
     판 X248 에서 펴 두니 <b>799px</b> 였습니다. 추천 줄과 이름 알약만 밖에
     두고 나머지를 접으니 <b>300px 아래</b>입니다. 전화 줄·만나야 할 분은
     접이 안에 그대로 있습니다 (6번 · 한 글자도 안 없앴습니다).
     ⚠ 선을 <b>400px</b> 로 둡니다 — 글꼴이 다르면 알약 줄이 한 줄 더 접힐
       수 있어 딱 붙여 두면 헛 빨간불이 켜집니다 (8번).                   */
  const rtH = await PC.evaluate(() => {
    const e = document.querySelector('#hmSideUp .hm-rt');
    const f = e && e.querySelector('.hm-fold-h');
    return { h: e ? Math.round(e.getBoundingClientRect().height) : 0,
             rec: !!(e && e.querySelector('.hm-rt-why')),
             pill: e ? e.querySelectorAll('.hm-rt-p').length : 0,
             접힘: f ? f.getAttribute('aria-expanded') === 'false' : null };
  });
  is(rtH.h > 0 && rtH.h <= 400,
     '  ★★ 🚗 가 <b>조그맣다</b> — ' + rtH.h + 'px (판 X248 에서는 799px · 선 400px)');
  is(rtH.rec && rtH.pill > 0 && rtH.접힘 === true,
     '  ★ 그래도 <b>추천과 이름이 보인다</b> — 추천 줄 · 이름 알약 ' + rtH.pill +
     '개 · 접이는 접힌 채(' + rtH.접힘 + ')');
  /* 🚗 를 두 기둥 <b>아래</b>로 내렸던 자리(#hmRtWide)는 판 X249 에서 비웠고
     <b>안 지웠습니다</b> — 되돌리실 자리입니다 (6번). 빈지 봅니다. */
  const 아래 = await PC.evaluate(() => {
    const w = document.getElementById('hmRtWide');
    return { 자리: !!w, 비었나: !!w && !w.innerHTML.trim() };
  });
  is(아래.자리 && 아래.비었나,
     '  ★ 두 기둥 아래 자리(#hmRtWide)는 <b>남아 있고 비었다</b> — 지우지 않고 비웁니다 (6번)');
  /* ★ 차례도 목각대로 — 이번 주 → 이번 달 → 알람 (동선은 아래로) */
  const at = (w) => side.no ? -1 : side.cards.findIndex(c => c.t.indexOf(w) >= 0);
  is(at('이번 주') >= 0 && at('이번 주') < at('오늘 어디로') &&
     at('오늘 어디로') < at('이번 달 고객 관리') &&
     at('이번 달 고객 관리') < at('알람'),
     '  <b>차례가 목각대로</b>다 — 이번 주 → 오늘 어디로 → 이번 달 고객 관리 → 알람');
  /* ★★ 못 세는 셋 — 「아직 세는 자리가 없습니다」 라고 <b>적고</b>,
         <b>아무 숫자도 안 적는다</b>. 이것이 1번을 지키는 모양입니다.   */
  /* ⚠ 2026-10-02 · <b>「알람」 을 이 셋에서 빼냈습니다.</b> 사장님 말씀
     「알람 칩도 세워줘」 로 세어 보니 <b>셀 수 있었습니다</b> — 앱이 자기 알람
     시각을 alm-slots.js 한 표로 알고, 켜고 끈 것은 이 브라우저에 있습니다.
     ★ <b>자를 없앤 것이 아닙니다.</b> 「못 센다고 적는가」 를 묻던 자리를
       「<b>센 수를 적는가</b>」 로 바꾸었습니다(아래 [1-c]). 못 세는 것은
       여전히 둘이고, 그 둘은 그대로 봅니다.
     ★ 눈금이 <b>셋에서 둘로 줄었습니다</b> — 줄면 기준선도 같이 내립니다 (0-1번). */
  /* ⚠ 2026-10-02 (두 번째) · <b>「이번 주」 도 빼냈습니다.</b> 사장님 말씀
     「연속 N일 세는 자리부터 만들어줘」 로 <b>연속 가동을 세게 됐습니다</b> —
     통화·고객 넣기·자료 만들기·하루 체크 넷 중 하나라도 있는 날(출근은 뺌),
     성장판(gbBuild)이 가르는 그 정의 그대로입니다.
     ★ <b>자를 없앤 것이 아닙니다.</b> 그 칸이 「센 수를 적는가」 는
       <b>check-hmrun</b> 이 봅니다(칩과 카드가 같은 수인지까지).
     ★ 못 세는 칸이 <b>셋 → 둘 → 하나</b>로 줄었습니다.
     ⚠ 「이번 주」 가 들던 것은 <b>둘</b>이었습니다(연속가동 · 예상업적).
       <b>예상업적은 아직 못 셉니다</b> — 그 수는 「DB · 업적관리」 에 있습니다.
       그래서 그 카드는 <b>센 것과 못 세는 것을 갈라</b> 적습니다 (1번).    */
  /* ⚠ 2026-10-02 (세 번째) · <b>「이번 달 고객 관리」 도 빼냈습니다 — 이제
     못 세는 칸이 0 입니다.</b> 사장님 말씀 「보낼 말 보기도 만들어줘」 로
     세어 보니 <b>세는 자리가 이미 있었습니다</b> — 계약 마디는 mstDueList 가
     세고, 보낼 말은 MST_STEPS(1·3·6·9·12개월)에 적혀 있었습니다. 홈이 그것을
     안 부르고 있었을 뿐입니다.
     ★ <b>자를 없앤 것이 아닙니다.</b> 「못 센다고 적는가」 를 묻던 자리를
       아래 [1-c] 의 「<b>센 수를 적는가</b>」 로 옮겼고, 그 칸을 통째로 보는
       자는 <b>check-hmmadi</b> 입니다.
     ★ 눈금이 <b>하나 → 0</b> 입니다. 빈 배열이라 아래 forEach 가 한 번도 안
       돌므로, 못 세는 칸이 <b>다시 생기면</b> 여기 이름을 적어야 합니다.
     ⚠ 다만 「이번 달 고객 관리」 도 못 세는 것이 <b>하나</b> 남습니다 —
       마디 말고 <b>보낸 뒤의 답</b>은 안 셉니다. 그것은 아직 적어 두는
       자리가 없습니다.                                                  */
  [].forEach(w => {
    const c = side.no ? null : side.cards.find(x => x.t.indexOf(w) >= 0);
    is(!!c && /아직 세는 자리가 없습니다/.test(c.t),
       '  ★ 「' + w + '」 가 <b>「아직 세는 자리가 없습니다」</b> 라고 적는다 (1번)');
    /* 제목·설명에 든 글자 말고 <b>숫자</b>가 있으면 지어낸 것입니다 */
    is(!!c && !/\d/.test(c.t),
       '  ★★ 「' + w + '」 에 <b>아무 숫자도 안 적는다</b> — 없는 수를 지으면 사실로 믿으십니다' +
       (c && /\d/.test(c.t) ? (' ← 「' + c.t.slice(0, 60) + '」') : ''));
  });
  /* ★★ <b>못 세는 칸이 하나도 없다</b> — 눈금이 0 이라는 것을 자가 직접
     봅니다. 이 줄이 없으면 위 배열을 비워 둔 것이 <b>자를 끈 것</b>인지
     <b>정말 0 인지</b> 알 수 없습니다 (8번).                             */
  {
    const 못세는 = side.no ? [] : side.cards.filter(c => /아직 세는 자리가 없습니다/.test(c.t));
    is(!side.no && 못세는.length === 0,
       '  ★★ 곁기둥에 <b>「아직 세는 자리가 없습니다」 칸이 0개</b>다 — '
         + 못세는.length + '개'
         + (못세는.length ? (' ← ' + 못세는.map(c => '「' + c.t.slice(0, 20) + '」').join(' / ')) : ''));
  }
  /* ★ 비워 두지도 않는다 — 사장님이 「적기」 라고 하셨습니다 */
  is(!side.no && side.cards.every(c => c.h > 0),
     '  <b>빈 칸이 없다</b> — 자리만 잡고 아무 말도 안 하면 고장 난 것으로 보입니다');
  /* ★ 셀 수 있는 것은 <b>진짜 수</b>로 — 「오늘 동선」 은 이미 셉니다. */
  const rt = side.no ? null : side.cards.find(c => c.t.indexOf('오늘 어디로') >= 0);
  is(!!rt && !/아직 세는 자리가 없습니다/.test(rt.t) && /\d/.test(rt.t),
     '  ★ <b>「오늘 동선」 은 진짜 수로</b> 선다 — 셀 수 있는 것을 못 센다고 적지 않는다 (1번)');

  /* ── [6] 위의 넷은 안 움직였다 ─────────────────────────────────── */
  console.log('\n[6] ★ <b>위의 넷은 안 움직였다</b> — 먼저 하신 말씀 둘을 같이 지킨다');
  const head = await PC.evaluate(() => {
    const pane = document.querySelector('.tab-pane.on');
    const top = [...pane.children].map(e => e.id || ('.' + String(e.className || '').split(' ')[0]));
    const i = (id) => top.indexOf(id);
    return { top, greet: i('hmTossHost'), flow: i('hmFlowHost'),
             noti: i('hmNotiLine'), etc: i('hmFold_etc'), cols: top.indexOf('.hm-2col'),
             setup: !!document.getElementById('osSetupHome') };
  });
  is(head.flow === head.greet + 1,
     '  <b>상담현황이 인사 바로 밑</b>이다 (사장님 말씀 2026-09-27) — ' + head.top.join(' → '));
  is(head.cols > head.etc && head.etc > head.noti && head.noti > head.flow,
     '  소식 · 그 밖의 것이 <b>두 기둥 위</b>에 그대로 있다');
  is(head.setup, '  <b>준비 SQL 이 그 자리</b>에 있다 — 화면 다섯 곳이 「홈 맨 위」 라고 가리킨다');

  /* ── [3][4] 두 벌이 아닌가 · 머리글이 거짓말을 안 하나 ──────────── */
  console.log('\n[3] ★★ 꺼낸 둘이 <b>두 벌이 아니다</b> (5번)');
  const dup = await PC.evaluate(() => ({
    rt: document.querySelectorAll('#hmRtHost, [id="hmRtHost"]').length,
    act: document.querySelectorAll('#hmActHost').length,
    inFold: !!(document.getElementById('hmFold_etc') || {}).querySelector &&
            !!document.getElementById('hmFold_etc').querySelector('#hmRtHost')
  }));
  is(dup.rt === 1, '  「오늘 어디로」 자리가 <b>하나</b>다 — ' + dup.rt + '개');
  is(dup.act === 1, '  「오늘 기록」 자리가 <b>하나</b>다 — ' + dup.act + '개');
  is(!dup.inFold, '  ★ 접이 안에 <b>안 남았다</b> — 남으면 뒤엣것만 칠해지고 앞엣것은 영영 빈 칸이다');

  console.log('\n[4] ★★ 접이 머리글이 <b>거짓말을 안 한다</b> (1번)');
  const fold = await PC.evaluate(() => {
    const f = document.getElementById('hmFold_etc'); if (!f) return { no: 1 };
    const h = f.querySelector('.hm-fold-h');
    const t = (h ? h.innerText : '').replace(/\s+/g, ' ').trim();
    if (h) h.click();
    const body = (f.querySelector('.hm-fold-b') || {}).innerText || '';
    return { no: 0, t, body: body.replace(/\s+/g, ' ').trim() };
  });
  is(!fold.no && !/오늘 어디로/.test(fold.t),
     '  머리글에 <b>「오늘 어디로」 가 없다</b> — 안 든 것을 들었다고 안 적는다 · 「' + fold.t + '」');
  is(!fold.no && !/갈 데가 없습니다|지역 동선/.test(fold.body),
     '  펴 봐도 <b>그 안에 없다</b> — 머리글과 속이 같은 말을 한다');
  is(!fold.no && /찾기/.test(fold.t) && /옮긴 자리/.test(fold.t),
     '  <b>든 것은 그대로 적는다</b> — 찾기 · 옮긴 자리');

  /* ── [5] 「이분 자세히」 한 단추 ────────────────────────────────── */
  console.log('\n[5] ★★ 「이분 자세히」 가 <b>접힌 채로 열리고 · 눌러서 펴지고 · 기억한다</b> (6번)');
  /* ⚠ <b>접는 자리는 한 곳</b>입니다 (5번). 한 번은 「또 무엇을 할까요」 에
     속접이를 따로 두었는데, 사장님이 「그 넷도 접어」 하신 뒤에는 그 칸이
     <b>「이분 자세히」 안에 또</b> 들어가 도구에 닿는 데 두 번 눌러야
     했습니다. 두 겹은 접는 것이 아니라 <b>묻는 것</b>입니다.           */
  const pk = await PC.evaluate(() => {
    /* ⚠ 누르면 <b>카드를 다시 그립니다</b>(hmPaint). 붙잡아 둔 카드는 떨어져
       나가 높이가 0px 이 됩니다 — <b>잴 때마다 다시 찾습니다</b>.        */
    /* ★ 판 X199 — 카드가 #hmToday 밖(#hmJobHost)으로 올라갔습니다 */
    const cnt = () => { const c = document.querySelector('#dynPane .hm-now');
      return {
        judge: document.querySelectorAll('#dynPane .hm-now .t-note.b').length,
        cqa:   document.querySelectorAll('#dynPane .cqaCard').length,
        tools: document.querySelectorAll('#dynPane .hm-now .hm-ask-o').length,
        h:     c ? Math.round(c.getBoundingClientRect().height) : 0 }; };
    const b = document.querySelector('#dynPane .hm-more-b');
    if (!b) return { no: 1 };
    const shutTxt = (b.innerText || '').replace(/\s+/g, ' ').trim();
    const shut = cnt();
    const tap = Math.round(b.getBoundingClientRect().height);
    b.click();
    const b2 = document.querySelector('#dynPane .hm-more-b');   /* 판 X199 */
    const openTxt = (b2 ? b2.innerText : '').replace(/\s+/g, ' ').trim();
    const open = cnt();
    let saved = null; try { saved = JSON.parse(localStorage.getItem('apex_hm_fold_v1') || '{}').more; } catch (e) {}
    return { no: 0, shutTxt, openTxt, shut, open, tap, saved };
  });
  is(!pk.no, '  단추(.hm-more-b)가 <b>늘 서 있다</b> — 감추기만 하고 길이 없으면 안 된다 (6번)');
  is(!pk.no && pk.shut.tools === 0 && pk.shut.cqa === 0,
     '  ★ <b>접힌 채로</b> 열린다 (사장님 말씀 「그 넷도 접어」) — 도구 ' +
     (pk.shut ? pk.shut.tools : '?') + '개 · 물음 ' + (pk.shut ? pk.shut.cqa : '?') + '개');
  /* ⚠ 2026-10-25 (판 X195) · 「판단」 → <b>「아는 것」</b>. ⚖️ 판단 줄은 이제
     접히지 않고 카드에 <b>늘</b> 섭니다(사장님 말씀 「지금 할 것에 빈칸이
     많은데 알차게 채워줘」). 접힌 칸 안에 들어 있다고 적으면 그 줄이
     <b>거짓말</b>이 됩니다 — 안에 정말 든 것은 🧭 앱이 아는 것 · 단계 ·
     도구입니다 (1번).                                                   */
  is(!pk.no && /이분 자세히/.test(pk.shutTxt) && /아는 것/.test(pk.shutTxt) && /단계/.test(pk.shutTxt),
     '  ★ 단추가 <b>무엇이 들었는지</b> 말한다 (1번) — 「' + pk.shutTxt + '」');
  is(!pk.no && pk.open.tools > 0 && pk.open.h > pk.shut.h,
     '  ★ <b>눌렀더니 다 펴진다</b> — 카드 ' + pk.shut.h + 'px → ' + pk.open.h +
     'px · 도구 ' + pk.open.tools + '개 (지운 것이 아니다)');
  is(!pk.no && /접기/.test(pk.openTxt), '  펴면 단추가 <b>「접기」</b> 가 된다 — 「' + pk.openTxt + '」');
  is(!pk.no && pk.saved === true,
     '  ★ <b>편 것을 기억한다</b> — 사장님 말씀 「내가 킨 화면이 내가 끄지 않는 이상 처음으로 돌아가지 않도록」');
  is(!pk.no && pk.tap >= 44, '  손가락 크기 <b>44px</b> — ' + pk.tap + 'px');
  /* ★ 두 겹으로 접지 않았나 — 속접이가 생기면 도구까지 두 번 눌러야 한다 */
  const nest = await PC.evaluate(() => !!document.querySelector('#hmToday .hm-more-in .hm-fold'));
  is(!nest, '  ★ <b>속에 또 접이가 없다</b> — 두 겹은 접는 것이 아니라 묻는 것이다 (5번)');

  /* ── [2] 폰에서는 한 기둥 ──────────────────────────────────────── */
  /* ══ 2026-10-04~05 · <b>하루에 두 번 옮겼다가 제자리</b> ═════════════
     ① 사장님이 「오른쪽 넷을 폰에서도 보이게」 하셔서 그 넷을 「읽어 둔
        보장분석」 바로 밑으로 올렸습니다.
     ② 보시고 <b>「지금 할 것 다시 위로 올려줘」</b> 하셔서 되돌렸습니다.
        폰은 다시 <b>DOM 차례 그대로</b>입니다 — 차례를 바꾸는 CSS 가
        app/index.html 에 한 줄도 없습니다.
     ★★ 그때 제가 <b>수를 틀리게 알려 드렸습니다.</b> 「오른쪽 넷이 폰에서
        y3,745」 라고 적었는데, 그것은 잣대가 <b>「이분 자세히」 를 펴 놓고</b>
        잰 수였습니다. 펴면 「지금 할 것」 이 2,541px, <b>접힌 기본은
        1,455px</b> 입니다. 접힌 기본에서 오른쪽 넷은 <b>y2,659</b> 에
        섭니다 — <b>1,086px 부풀려</b> 말씀드렸고, 사장님은 그 수를 보고
        자리를 고르셨습니다. <b>실제로 보시는 상태</b>로 안 재면 수가
        거짓이 됩니다 (1번).
     ★ 그래서 옛 사실로 돌아가되 <b>지키는 자를 둘 답니다</b> —
       「다시 멀어지지 않는지」 와 「펴 놓고 재고 있지 않은지」.         */
  console.log('\n[2] 폰(390)에서는 <b>한 기둥</b>이다 — 차례는 DOM 그대로');
  /* ══ 2026-10-06 · <b>세 번째이자 마지막 자리</b> (사장님 「끌어올려」) ═════
     ①②(위 쪽지) 뒤에 사장님이 <b>「끌어올려」</b> 하셨습니다. 재서 자리를
     골랐습니다 — 폰에서 「지금 할 것」 이 <b>y2,138</b> 에서 끝나므로,
     그것을 위에 두는 한 넷은 <b>그보다 위로 못 갑니다</b>. 그래서 넷은
     <b>오늘 카드 안 · 「지금 할 것」 바로 아래</b>(#hmSideUp)에 섭니다 —
     y2,612 → <b>y2,138</b>, 474px 올랐습니다. 두 말씀이 둘 다 참입니다.
     ★ 컴퓨터(1101px 위)에서는 <b>그대로 오른쪽 기둥</b>입니다.
     ★ 두 자리에 <b>같이</b> 세우면 hmRtHost·hmActHost id 가 겹쳐 앞엣것이
       빈 칸으로 남습니다 — 그래서 <b>한쪽은 반드시 비어 있어야</b> 합니다.  */
  const PH = await open(390);
  const one = await PH.evaluate(() => {
    const c = document.querySelector('.hm-2col'); if (!c) return { no: 1 };
    const [L, R] = c.children;
    const rl = L.getBoundingClientRect(), rr = R.getBoundingClientRect();
    const y = (el) => el ? Math.round(el.getBoundingClientRect().top) : -1;
    const hh = (el) => el ? Math.round(el.getBoundingClientRect().height) : -1;
    const up = document.getElementById('hmSideUp');
    /* 🧷 판 X223 — 곁칸 셋이 <b>접이</b> 안에 섭니다(사장님이 고르신 「① 곁칸
       셋을 접기」). 이름은 접이 머리(.hm-fold-h .t)에, 카드는 제 머리
       (.hm-rt-h b)에 적습니다 — 둘 다 봅니다. */
    const 이름of = (e) => {
      const f = e.querySelector('.hm-fold-h .t');
      if (f) return (f.childNodes[0] ? (f.childNodes[0].textContent || '') : '').trim();
      return (e.querySelector('.hm-rt-h b') || {}).textContent || e.id || e.className;
    };
    const 넷 = up ? [].slice.call(up.children).map(e => ({
      이름: 이름of(e), y: y(e),
      /* 판 X254 — 칸이 <b>통째로</b> 보이는지 재려면 키도 있어야 합니다 */
      h: Math.round(e.getBoundingClientRect().height) })) : [];
    /* 🧷 ★★ <b>접고도 수가 보이나</b> — 접기의 값어치가 여기 있습니다.
       접힌 머리마다 「연속 1일」·「마디 3건」·「남은 1번」 한 줄이 서야
       <b>펴지 않고</b> 오늘을 압니다. 비면 사장님은 세 번 눌러야 합니다 (1번).
       ★ 수는 그 칸이 제 머리에 달아 둔 <b>data-sum</b> 에서 옵니다 —
         여기서 다시 세지 않습니다 (5번). 둘이 갈리면 빨간불입니다. */
    const 접이 = up ? [].slice.call(up.querySelectorAll('.hm-fold[id^="hmFold_side_"]'))
      .map(f => {
        const sp = f.querySelector('.hm-fold-h .t span');
        const rt = f.querySelector('.hm-rt-h');
        return { k: f.id, 머리: sp ? (sp.textContent || '').trim() : '',
                 칸: rt ? (rt.getAttribute('data-sum') || '') : '' };
      }) : [];
    const now = document.querySelector('.hm-now');
    return { 접이, no: 0, lx: Math.round(rl.left), rx: Math.round(rr.left),
             ly: Math.round(rl.top), ry: Math.round(rr.top),
             kb: y(document.getElementById('hmKbHost')),
             td: y(document.getElementById('hmToday')),
             nowEnd: now ? y(now) + hh(now) : -1,
             /* ★ 판 X199 — 카드 밑에 <b>세 칸 · 📄 한 줄</b>이 들어왔습니다.
                곁칸은 그 다음이므로 📄 끝에서 잽니다 (아래 쪽지).        */
             /* ★ 판 X217 — 맨 위 묶음 <b>끝</b>은 이제 📆 이번 주입니다 */
             pdfEnd: (() => { const e = document.getElementById('hmWkHost')
                           || document.querySelector('.hm-pdf');
                return e ? y(e) + hh(e) : -1; })(),
             /* 판 X250 — 「지금 할 것」 이 끝나는 자리 */
             jobEnd: (() => { const e = document.getElementById('hmJobHost');
                return e ? y(e) + hh(e) : -1; })(),
             /* 활동 <b>뒤</b>에 선 것 — 내려간 셋이 그대로 있나 (6번) */
             뒤: (() => { const t = document.querySelector('.tz'); if (!t) return [];
                const L = [].slice.call(t.children),
                      b2 = L.indexOf(document.getElementById('hmSideUp'));
                return b2 < 0 ? [] : L.slice(b2 + 1, b2 + 4)
                  .map(c => (c.id || (c.className || '').split(' ')[0] || c.tagName)); })(),
             사이: (() => { const t = document.querySelector('.tz'); if (!t) return [];
                const L = [].slice.call(t.children), a = L.indexOf(document.getElementById('hmJobHost')),
                      b2 = L.indexOf(document.getElementById('hmSideUp'));
                return (a < 0 || b2 < 0) ? [] : L.slice(a + 1, b2)
                  .map(c => (c.id || (c.className || '').split(' ')[0] || c.tagName)); })(),
             /* ══ 판 X256 — <b>단위를 맞춥니다</b> ═════════════════════════
                ⚠⚠ 판 X255 에서 제가 여기를 <b>또 틀렸습니다</b>. 「칸이 보이는
                  높이」(811 — <b>길이</b>)를 적어 두고 그것을 y() 와 견주었는데,
                  y() 는 <b>창 기준 좌표</b>입니다. 좌표와 길이를 견준 것입니다 —
                  판 X255 에서 고치려던 바로 그 잘못을 꼴만 바꿔 되풀이했습니다.
                ★ 창 기준 좌표끼리 견뎌야 합니다. 그리고 묻는 것은
                  <b>사장님 폰(390×844)</b> 이므로 <b>844</b> 를 바닥으로 둡니다 —
                  이 자는 전체 꼴을 보려고 창을 900 으로 열지만, 위 띠가 먹는
                  <b>89px 은 두 높이에서 같습니다</b>(재어 보았습니다). 그래서
                  이 자의 좌표를 그대로 844 와 견주면 라이브와 맞습니다 —
                  실제로 여기 861 · 라이브 864 로 <b>3px</b> 안입니다.          */
             폰바닥: 844,
             창키: window.innerHeight,
             칸위: (function(){ var pn=document.querySelector('.tab-pane.on');
               return pn ? Math.round(pn.getBoundingClientRect().top) : -1; })(),
             /* 판 X256 — 「지금 할 것」 카드가 <b>다시 커지지 않게</b> (아래 쪽지) */
             카드키: (function(){ var c=document.querySelector('#hmJobHost .hm-now');
               return c ? Math.round(c.getBoundingClientRect().height) : -1; })(),
             소식: (function(){ var n=document.querySelector('.hm-nw');
               return n ? Math.round(n.getBoundingClientRect().height) : -1; })(),
             /* 판 X258 — 📰 소식 접이. <b>보임</b>은 display 까지 봅니다 —
                키만 보면 감춘 것을 「있다」 고 셉니다 (1번).              */
             접소식: (function(){
               var f=document.getElementById('hmFold_nw');
               if(!f) return { 있다:false };
               var hd=f.querySelector('.hm-fold-h'),
                   sb=f.querySelector('.hm-fold-h .t span'),
                   ti=document.querySelector('.hm-nw-ti');
               var 봄=function(e){ if(!e) return false;
                 var r=e.getBoundingClientRect();
                 return r.height>0 && getComputedStyle(e).display!=='none'; };
               return { 있다:true, 접힘:!f.classList.contains('on'),
                 접이키:Math.round(f.getBoundingClientRect().height),
                 머리키:hd?Math.round(hd.getBoundingClientRect().height):-1,
                 꼬리보임:봄(sb), 제목보임:봄(ti),
                 꼬리글:sb?(sb.textContent||''):'', 제목글:ti?(ti.innerText||''):'' };
             })(),
             넷: 넷, 위칸: !!up, 오른빔: !!(R.textContent || '').trim() === false,
             오른글: (R.textContent || '').trim().length,
             rt: document.querySelectorAll('#hmRtHost').length,
             act: document.querySelectorAll('#hmActHost').length,
             머리: document.querySelectorAll('#hmSideUp .hm-rt-h').length,
             펴짐: (typeof HM_MORE !== 'undefined') ? !!HM_MORE : null,
             over: Math.round(document.documentElement.scrollWidth - window.innerWidth) };
  });
  const 첫넷 = (one.no || !one.넷.length) ? -1 : Math.min.apply(null, one.넷.map(x => x.y));
  is(!one.no && one.lx === one.rx, '  <b>같은 줄에서 시작</b>한다 — 왼쪽 x' + one.lx + ' · 오른쪽 x' + one.rx);
  is(!one.no && one.kb > 0 && one.td > one.kb,
     '  <b>읽어 둔 보장분석 다음에 지금 할 것</b>이다 — 보장분석 y' + one.kb + ' · 지금 할 것 y' + one.td);
  /* ── ★★ 넷이 <b>폰에서 「지금 할 것」 바로 아래</b>에 선다 ───────── */
  is(!one.no && one.위칸 && one.넷.length >= 4,
     '  ★★ 폰에서 넷이 <b>오늘 카드 안(#hmSideUp)</b>에 선다 — ' + one.넷.length + '칸' +
     ((one.위칸 && one.넷.length >= 4) ? '' : ' ← 자리를 못 찾았거나 비었습니다'));
  is(!one.no && one.머리 >= 3,
     '  ★ 머리글(.hm-rt-h)이 <b>' + one.머리 + '개</b> 선다 — 목각 차례 그대로');
  /* ── 🔲 ★★ <b>폰에서 활동이 두 칸 타일로</b> 선다 (판 X249) ──────────
     사장님 말씀 (2026-10-30) — 「<b>핸드폰이든, 컴퓨터든</b> … 한번에
     보이게끔」. 여쭈니 <b>「활동을 작은 타일 2열로」</b> 를 고르셨습니다.
     ★ <b>한 줄짜리 접이 둘이 나란히</b> 서는지로 잽니다 — 같은 윗변에 둘.
     ★ 🚗 동선과 📊 오늘 기록은 <b>통줄</b>입니다 — 반 칸에 넣으니 칩이
       한 줄에 하나씩 서서 170px 로 <b>오히려 길어졌습니다</b>(찍어 보고
       알았습니다). 그래서 통줄인지도 함께 봅니다.                       */
  const 타일 = await PH.evaluate(() => {
    const up = document.getElementById('hmSideUp'); if (!up) return { no: 1 };
    const kid = [...up.children].filter(e => e.getBoundingClientRect().height > 0);
    const 줄 = {};
    kid.forEach(e => { const y = Math.round(e.getBoundingClientRect().top);
      줄[y] = (줄[y] || 0) + 1; });
    const 한줄 = Object.keys(줄).reduce((m, k) => Math.max(m, 줄[k]), 0);
    const 통 = (id) => { const e = document.getElementById(id); if (!e) return null;
      return Math.round(e.getBoundingClientRect().width) >= Math.round(up.getBoundingClientRect().width) - 2; };
    return { no: 0, 칸: kid.length, 한줄: 한줄, rt: 통('hmRtHost'), act: 통('hmActHost'),
             높이: Math.round(up.getBoundingClientRect().height) };
  });
  is(!타일.no && 타일.한줄 >= 2,
     '  ★★ 폰에서 활동이 <b>두 칸 타일</b>로 선다 — 칸 ' + 타일.칸 + '개 · 한 줄에 ' +
     타일.한줄 + '개 (판 X249 · 사장님이 고르신 꼴)');
  is(!타일.no && 타일.rt === true && 타일.act === true,
     '  ★ 🚗 동선 · 📊 오늘 기록은 <b>한 줄을 통째로</b> 쓴다 — 반 칸이면 오히려 길어집니다');
  /* ── 🧷 ★★ <b>접고도 수가 보이나</b> (판 X223) ────────────────────────
     사장님 말씀 「지금 할것이 너무 많은 자리를 차지하고 있어」 → 고르신
     「① 곁칸 셋을 접기」. 접기의 <b>값어치가 여기 있습니다</b> — 접어 두고도
     「연속 1일」·「마디 3건」·「남은 1번」 이 머리에 적혀야 <b>펴지 않고</b>
     오늘을 압니다. 비면 사장님은 세 번 눌러야 하고, 그러면 접은 것이
     <b>감춘 것</b>이 됩니다 (1번).
     ★ 수는 그 칸이 제 머리에 달아 둔 <b>data-sum</b> 에서 옵니다 — 여기서
       다시 세지 않습니다 (5번). 머리와 칸이 갈리면 그 자리에서 빨간불.
     ★ 묻는 자리를 <b>여기 하나</b>로 둡니다 — 칸마다 제 자가 물으면 자마다
       씨가 달라 어떤 자는 자료가 들어오기 전에 읽습니다(실제로 그랬습니다).
     ⚠ 수를 못 센 칸은 <b>빈 글이 맞습니다</b>(1번) — 그래서 「다 차 있다」 가
       아니라 「머리와 칸이 같다」 와 「적어도 둘은 수를 적는다」 를 봅니다. */
  const 접 = one.접이 || [];
  is(접.length >= 3, '  ★★ 곁칸 셋이 <b>접힌 채로</b> 선다 — 접이 ' + 접.length + '개'
     + (접.length >= 3 ? '' : ' ← 접기가 사라졌습니다'));
  is(접.length > 0 && 접.every(x => x.머리 === x.칸),
     '  ★★ 접힌 머리의 수가 <b>그 칸이 센 수</b>와 같다 — '
     + (접.map(x => '「' + (x.머리 || '빈 글') + '」').join(' · ') || '없음'));
  is(접.filter(x => x.머리).length >= 2,
     '  ★★ 적어도 <b>둘</b>은 접힌 채로 수를 적는다 — ' + 접.filter(x => x.머리).length + '개');
  /* ★ <b>기준선</b> — 첫 칸이 「지금 할 것」 이 끝나는 자리에서 <b>120px 안</b>.
     전에는 3,000 이었고 실제로 y2,612 였습니다. 이제 바로 붙어 섭니다.    */
  /* ★★ <b>2026-10-26 (판 X199) — 재는 자리를 옮기고 묻는 것을 늘렸습니다.</b>
     사장님 말씀 「ⓒ로 해줘」 로 카드가 맨 위로 올라오면서, 카드와 곁칸 사이에
     <b>세 칸(➕ 고객 추가)과 📄 한 줄</b>이 들어왔습니다 — 둘 다 사장님이
     시키신 것이라 치울 것이 아닙니다(판 X194 · 6번).
     ★ 그래서 <b>틈 120px 은 그대로 두고</b> 재는 자리를 <b>📄 끝</b>으로
       옮깁니다 — 「맨 위 묶음 바로 아래」 가 이제 그 뜻입니다.
     ★ 그리고 <b>사이에 무엇이 섰는지까지</b> 봅니다 — 전에는 px 만 재어
       <b>무엇이 끼어들었는지</b> 못 가렸습니다. 이제 둘(세 칸 · 📄)이
       아니면 그 자리에서 빨간불입니다. <b>느슨해진 데가 없습니다</b> (8번). */
  /* ══ 🔲 <b>2026-10-30 (판 X250) — 사장님이 한 걸음 더 올리셨습니다</b> ══
     말씀 — <b>「응 폰도 활동 먼저 올리고」</b>. 라이브를 재어 보여 드리니
     (컴퓨터 첫 화면에는 활동 다섯이 다 서는데 폰에서는 y1,150 이라 한 번
     내려야 보였습니다) <b>활동을 「지금 할 것」 바로 밑</b>으로 고르셨습니다.
     ★ 재는 자리를 <b>📆 이번 주 끝 → 「지금 할 것」 끝</b>으로 옮기고
       <b>틈 120px 은 그대로</b> 둡니다 — 「바로 아래」 의 뜻은 안 바뀝니다.
     ★ 치르는 값(세 칸·📄·약속이 아래로 내려감)은 아래에서 <b>그대로</b>
       봅니다 — 사라지면 빨간불입니다 (6번).                             */
  is(!one.no && 첫넷 > 0 && one.jobEnd > 0 && 첫넷 >= one.jobEnd - 8 && 첫넷 <= one.jobEnd + 120,
     '  ★★ 첫 칸이 <b>「지금 할 것」 바로 아래</b>다 — 카드 끝 y' + one.jobEnd +
     ' · 첫 칸 y' + 첫넷 + ' (틈 120px 안 · 판 X250 사장님 「활동 먼저 올리고」)');
  /* ══ ★★ <b>폰 첫 화면에 활동이 보이나</b> — 판 X250 의 까닭입니다 ══════
     ⚠⚠ <b>판 X254</b> — 이 줄이 너무 무르게 물었습니다. 「첫 칸의 <b>윗변</b>이
       844 안」 으로 적었는데 타일은 <b>67px</b> 이라 윗변이 841 이면 <b>3px 만</b>
       보입니다 — 그것은 「보인다」 가 아닙니다. 제가 그 수로 사장님께 「첫
       화면에 섭니다」 라고 말씀드렸습니다 (1번).
     ⚠⚠ <b>판 X255</b> — 고치면서 「칸이 보이는 높이(811)」 를 바닥으로 두었는데
       그것은 <b>길이</b>이고 y() 는 <b>창 기준 좌표</b>입니다. 좌표와 길이를
       견주었으니 꼴만 바꿔 같은 잘못을 되풀이했습니다.
     ⚠⚠⚠ <b>판 X256 — 그리고 이 자가 라이브보다 짧은 까닭을 제가 거짓으로
       적어 두었습니다.</b> 「웹폰트(Pretendard)를 못 받아 141px 짧다」 고
       적었는데, 재어 보니 <b>글꼴은 여기서도 그대로 그려집니다</b> — 한글만
       있는 같은 글이 Pretendard 로 <b>두 곳 다 583.7px</b> 입니다. 141px 은
       통째로 <b>📰 오늘 보낼 소식 칸</b>이었습니다 —
       이 자는 서버를 막아 놓아(7번) 소식을 한 건도 못 받고, 「받아 둔 소식이
       없으면 아무 줄도 안 세웁니다」 가 규칙이라 그 칸이 <b>아예 안 섰습니다</b>.
       ★ 그래서 <b>씨에 견본 소식 한 건</b>을 심었습니다(SEED · 서버는 안 부릅니다).
         이제 이 자의 수가 라이브와 맞습니다 — 첫 칸 윗변 <b>여기 861 · 라이브
         864</b> 로 3px 안입니다. 더는 「글꼴 탓」 으로 넘기지 않습니다 (1번·8번). */
  {
    const 첫칸 = one.no ? null : (one.넷 || []).filter(x => x.h > 0)
      .sort((a, b) => a.y - b.y)[0];
    /* ★★ <b>안 된 것은 안 됐다고 적습니다</b> (1번). 통째로 들어가려면 「지금
       할 것」 이 얼마나 줄어야 하는지 <b>CI 가 돌 때마다 찍습니다.</b>
       ★ <b>빨간불로는 안 만듭니다</b> — 그 수를 줄이는 일은 <b>무엇을 접고
         무엇을 뺄지 사장님이 고르실 일</b>입니다(남은 큰 자리가 📰 소식 칸
         하나인데, 그 칸은 사장님이 판 X194 에서 직접 채우라 하신 자리입니다).
         제가 고를 것이 아니라 적어 두어 <b>숨지 못하게</b> 합니다 (0-1번 · 8번).
       ★ 대신 <b>되커지는 것은 빨간불</b>입니다 — 아래 카드 키 줄이 그것입니다. */
    if (첫칸) {
      const 넘침 = 첫칸.y + 첫칸.h - one.폰바닥;
      console.log('  · 폰(390×' + one.폰바닥 + ') 기준 — 첫 칸 윗변 y' + 첫칸.y +
        ' · 아랫변 y' + (첫칸.y + 첫칸.h) + ' (위 띠가 ' + one.칸위 + 'px · 이 자의 창은 ' +
        one.창키 + 'px)');
      console.log('  · ' + (넘침 <= 0
        ? '칸이 <b>통째로</b> 들어갑니다 (여유 ' + (-넘침) + 'px)'
        : (첫칸.y >= one.폰바닥
            ? '칸이 <b>한 톨도 안 보입니다</b> — 윗변부터 ' + (첫칸.y - one.폰바닥) +
              'px 아래입니다. 통째로 보이려면 「지금 할 것」 이 <b>' + 넘침 + 'px</b> 줄어야 합니다'
            : '칸이 <b>' + 넘침 + 'px 넘칩니다</b> — 통째로 보이려면 「지금 할 것」 이 ' +
              넘침 + 'px 줄어야 합니다')));
    }
    /* ══ 📏 <b>「지금 할 것」 카드가 되커지지 않는다</b> (판 X256) ══════════
       사장님이 「64px 줄일 거 추천해봐」 하셔서 판 X255 에서 <b>66px</b> 조였습니다.
       그 자리가 조용히 되커지면 <b>이 판이 없던 일이 됩니다</b>. 그래서 천장을
       둡니다 — 지금 잰 값 <b>697px</b> 에 <b>13px</b> 만 얹었습니다.
       ★ <b>천장은 내려가기만 합니다</b> — 더 조이면 이 수도 같이 내립니다
         (0-1번 「줄이면 기준선도 같이 내린다」). 올리려면 사장님 말씀이 있어야
         합니다. 헛것이 아닙니다 — 소식 칸을 씨로 세우므로 라이브와 같은 꼴입니다. */
    const 카드천장 = 710;
    is(!one.no && one.카드키 > 0 && one.카드키 <= 카드천장,
       '  ★★ 「지금 할 것」 카드가 <b>' + one.카드키 + 'px</b> — 천장 ' + 카드천장 +
       'px 안이다 (판 X255 에서 66px 조인 자리 · 되커지면 빨간불)');
    /* ★ 📰 소식 칸이 <b>정말 섰나</b> — 이것이 서지 않으면 위 수가 통째로
       거짓이 됩니다(판 X255 에서 그렇게 147px 을 놓쳤습니다 · 1번). */
    is(!one.no && one.소식 > 0,
       '  ★ 📰 <b>오늘 보낼 소식 칸이 선다</b> — ' + one.소식 +
       'px (씨로 심은 견본 한 건 · 라이브와 같은 꼴로 잽니다)');
    /* ══ 🧷 <b>판 X258 — 📰 소식이 폰에서 접히나</b> ═══════════════════
       사장님 말씀 「<b>접이로 — 머리만 두고 접기</b>」. 여쭈어 고르신 자리라
       <b>고르신 그대로인지</b> 묻습니다.
       ★ 묻는 것 넷 — ⓐ 접힌 채로 온다 ⓑ 머리가 <b>손가락 바닥 44px</b> 위다
         ⓒ 접힌 채로도 <b>오늘 기사 제목</b>이 보인다(판 X249 에서 배운 것 —
         접었는데 아무것도 안 보이면 접기가 아니라 방해입니다) ⓓ <b>제목이
         두 곳에 안 찍힌다</b>(접히면 안쪽 제목이 숨고, 펴면 꼬리가 숨습니다 ·
         5번). ★ 그리고 <b>눌러서 펴지나</b> — 접기의 값은 펴지는 데 있습니다. */
    if (!one.no) {
      is(one.접소식 && one.접소식.있다 && one.접소식.접힘,
         '  ★★ 📰 소식이 <b>접힌 채로</b> 온다 — ' +
         (one.접소식 && one.접소식.있다 ? ('접이 ' + one.접소식.접이키 + 'px') : '← 접이가 없습니다'));
      is(one.접소식 && one.접소식.머리키 >= 44,
         '  ★ 접힌 머리가 <b>' + (((one.접소식 || {}).머리키 > 0)
            ? ((one.접소식.머리키) + 'px') : '(못 셌습니다)') +
         '</b> — 손가락 바닥 44px 위다 (판 X146·X147)');
      is(one.접소식 && one.접소식.꼬리보임 && one.접소식.꼬리글 &&
         one.접소식.꼬리글.indexOf(one.접소식.제목글.slice(0, 10)) >= 0,
         '  ★★ 접힌 채로도 <b>오늘 기사 제목</b>이 보인다 — 「' +
         (((one.접소식 || {}).꼬리글 || '(없음)').slice(0, 26)) + '…」');
      is(one.접소식 && one.접소식.꼬리보임 && !one.접소식.제목보임,
         '  ★★ 그래도 <b>제목이 두 곳에 안 찍힌다</b> — 접히면 안쪽 제목은 숨는다 (5번)');
    }
    /* ★★ <b>눌러서 펴지나</b> — 접기의 값은 펴지는 데 있습니다 (6번).
       그리고 <b>펴진 때도</b> 제목이 한 곳에만 찍히는지 봅니다 — 접힌 때만
       보면 꼬리를 감추는 줄을 빼도 자가 안 웁니다 (8번 「되돌려 확인」). */
    if (!one.no && one.접소식 && one.접소식.있다) {
      await PH.evaluate(() => {
        var h = document.querySelector('#hmFold_nw>.hm-fold-h'); if (h) h.click();
      });
      await PH.waitForTimeout(450);
      const 폄 = await PH.evaluate(() => {
        const f = document.getElementById('hmFold_nw');
        const sb = f && f.querySelector('.hm-fold-h .t span');
        const ti = document.querySelector('.hm-nw-ti');
        const 봄 = e => { if (!e) return false;
          const r = e.getBoundingClientRect();
          return r.height > 0 && getComputedStyle(e).display !== 'none'; };
        return { 폄: !!(f && f.classList.contains('on')), 꼬리보임: 봄(sb), 제목보임: 봄(ti),
          복사: !!document.querySelector('.hm-nw [onclick^="nlCopy"]'),
          원문: !!document.querySelector('.hm-nw a[href^="http"]'),
          고르개: !!document.querySelector('.hm-nw [onclick^="hmNwPickToggle"]') };
      });
      is(폄.폄 && 폄.제목보임,
         '  ★★ <b>눌러서 펴진다</b> — 안에 제목이 제 줄로 선다 (글은 한 자도 안 없앴습니다 · 6번)');
      is(폄.폄 && !폄.꼬리보임,
         '  ★★ 펴면 <b>머리 꼬리를 감춘다</b> — 같은 제목이 두 곳에 안 찍힌다 (5번)');
      is(폄.복사 && 폄.원문 && 폄.고르개,
         '  ★ 펴면 <b>셋이 다 있다</b> — 💬 보낼 문구 복사 · 원문 ↗ · 🗂 칸·연령대 고르개' +
         ((폄.복사 && 폄.원문 && 폄.고르개) ? '' :
           (' ← 복사 ' + 폄.복사 + ' · 원문 ' + 폄.원문 + ' · 고르개 ' + 폄.고르개)));
      /* 본 대로 되돌려 둡니다 — 뒤에 오는 줄이 접힌 채를 잽니다 */
      await PH.evaluate(() => {
        var h = document.querySelector('#hmFold_nw>.hm-fold-h'); if (h) h.click();
      });
      await PH.waitForTimeout(300);
    }
  }
  /* ══ 2026-10-26 (판 X217) · <b>사장님이 맨 위 묶음을 넷으로 늘리셨습니다</b> ══
     말씀 — 「오늘 약속 <b>캘린더 이번주</b> / 오늘어디로가시나 / 이번달 고객관리
     이거 칸도 <b>다 맨 위로</b> 올려야지」. 그래서 카드 밑에 선 것이 둘에서
     <b>넷</b>이 되었습니다 — 세 칸 · 📄 한 줄 · 📅 오늘 약속 · 📆 이번 주.
     ★ <b>자를 지우지 않습니다. 묻는 것을 옮깁니다</b> — 재는 자리를 📄 끝에서
       <b>📆 이번 주 끝</b>으로 옮기고, 틈 120px 은 <b>그대로</b> 둡니다.
     ★ <b>사이에 무엇이 섰는지</b>는 계속 봅니다 — 넷 말고 다른 것이 끼면
       그 자리에서 빨간불입니다. 느슨해진 데가 없습니다 (8번).          */
  /* ⚠ 📅 약속과 📆 이번 주는 <b>한 자리(#hmUpHost)</b> 안에 함께 섭니다 —
     폰이냐 컴퓨터냐로 자리가 갈리므로 hmSidePlace 가 그 칸만 채웁니다 (5번). */
  /* ⬆ <b>판 X250 — 셋이 활동 「뒤」 로 내려갔습니다</b> (사장님 말씀
     「활동 먼저 올리고」). 그래서 묻는 것이 둘로 갈립니다 —
     ① 카드와 활동 <b>사이에 아무것도 안 낀다</b>(바로 밑이라는 뜻),
     ② 내려간 셋이 활동 <b>바로 뒤에 그대로</b> 있다(지운 것이 아니다 · 6번).
     ★ 하나라도 사라지면 그 자리에서 빨간불입니다 — 느슨해진 데가 없습니다. */
  is(!one.no && (one.사이 || []).length === 0,
     '  ★★ 카드와 활동 <b>사이에 아무것도 안 낀다</b> — ' +
     ((one.사이 || []).join(' · ') || '(없음)'));
  var 와야 = ['hm-two', 'hm-pdf', 'hmUpHost'];
  var 선것 = (one.뒤 || []).join(',');
  is(!one.no && (one.뒤 || []).length === 와야.length &&
     와야.every(function (k) { return 선것.indexOf(k) >= 0; }),
     '  ★ 활동 <b>바로 뒤에 셋이 그대로</b> 있다 — ' +
     ((one.뒤 || []).join(' · ') || '(못 셌습니다)') +
     ' (판 X217 · 세 칸 · 📄 · 📅 약속+📆 이번 주 한 자리)');
  /* ★★ <b>두 자리에 같이 세우지 않는다</b> — id 가 겹치면 앞엣것이 빈 칸이다 */
  is(!one.no && one.오른글 === 0,
     '  ★★ 폰에서 <b>오른쪽 기둥은 비어 있다</b> — 글자 ' + one.오른글 + '자' +
     (one.오른글 ? ' ← 두 벌입니다. id 가 겹쳐 한쪽이 빈 칸으로 남습니다 (5번)' : ''));
  is(!one.no && one.rt === 1 && one.act === 1,
     '  ★ 빈 자리(hmRtHost · hmActHost)가 <b>하나씩</b>이다 — ' + one.rt + ' · ' + one.act);
  /* ★★ <b>재는 상태를 밝힙니다.</b> 「이분 자세히」 를 펴 놓고 재면 위 수가
     1,000px 넘게 달라집니다 — 실제로 그렇게 틀린 수를 사장님께 드렸습니다. */
  is(one.펴짐 !== true,
     '  ★★ <b>사장님이 보시는 상태로 잰다</b> — 「이분 자세히」 가 '
       + (one.펴짐 === true ? '<b>펴진 채</b>입니다(수가 부풀려집니다)' : '접힌 기본입니다'));
  is(!one.no && one.over <= 0, '  <b>옆으로 안 넘친다</b> — ' + one.over + 'px');

  /* ── [7] 1101px 이 한 곳에서만 ─────────────────────────────────── */
  console.log('\n[7] <b>1101px 이 한 곳에서만 온다</b> (5번)');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const bp = [...src.matchAll(/@media\(min-width:(\d+)px\)/g)].map(m => +m[1]);
  const mine = /@media\(min-width:1101px\)\{[\s\S]{0,400}?\.hm-2col\{/.test(src);
  is(mine, '  두 기둥이 <b>1101px</b> 에서 선다 — 위 띠(.topnav)가 한 줄이 되는 그 수');
  const odd = bp.filter(x => x > 900 && x !== 1101);
  is(odd.length === 0, '  넓은 쪽 기준선이 <b>1101 하나</b>다 — ' +
     (odd.length ? ('← ' + odd.join(' · ')) : '갈린 데 없음'));

  console.log('\n[8] 조용한가');
  is(errs.length === 0, '  콘솔 오류가 없다' + (errs.length ? ' — ' + errs[0] : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 홈이 두 기둥으로 섭니다 — 폰은 한 기둥, 꺼낸 둘은 한 벌, 접은 것은 눌러서 펴집니다');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + e.message); process.exit(1); });
