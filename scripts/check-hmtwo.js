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
  const two = await PC.evaluate(() => {
    const c = document.querySelector('.hm-2col'); if (!c) return { no: 1 };
    const [L, R] = c.children;
    const rl = L.getBoundingClientRect(), rr = R.getBoundingClientRect();
    return { no: 0, lx: Math.round(rl.left), rx: Math.round(rr.left),
             ly: Math.round(rl.top), ry: Math.round(rr.top),
             lw: Math.round(rl.width), rw: Math.round(rr.width),
             lh: Math.round(rl.height), rh: Math.round(rr.height),
             lk: [...L.children].map(e => e.id || e.className).join(' · '),
             rk: [...R.children].map(e => e.id || e.className).join(' · ') };
  });
  is(!two.no, '  <b>두 기둥 칸(.hm-2col)</b>이 있다');
  is(!two.no && two.rx > two.lx, '  <b>나란히</b> 선다 — 왼쪽 x' + two.lx + ' · 오른쪽 x' + two.rx);
  is(!two.no && Math.abs(two.ly - two.ry) <= 2, '  <b>어깨를 맞춘다</b> — 왼쪽 y' + two.ly + ' · 오른쪽 y' + two.ry);
  is(!two.no && two.rw === 344, '  오른쪽 기둥이 <b>목각과 같은 344px</b> — ' + two.rw + 'px');
  is(!two.no && two.lw > two.rw, '  왼쪽이 <b>넓다</b> — ' + two.lw + ' > ' + two.rw);
  is(!two.no && /hmToday/.test(two.lk), '  왼쪽은 <b>오늘 하는 일</b> — ' + two.lk);
  is(!two.no && /hmRtHost/.test(two.rk) && /hmActHost/.test(two.rk),
     '  오른쪽은 <b>곁에서 보는 것</b> — ' + two.rk);
  /* ★ 오른쪽이 왼쪽 그늘에 드는가 — 그것이 두 기둥을 세운 까닭이다 */
  is(!two.no && two.rh <= two.lh,
     '  ★ 오른쪽이 <b>왼쪽 그늘에 든다</b> — 오른쪽 ' + two.rh + 'px ≤ 왼쪽 ' + two.lh +
     'px (세로는 긴 쪽이 정합니다)');

  /* ── [1-a] 파란 히어로 — <b>둘 다</b> 있다 ───────────────────────── */
  console.log('\n[1-a] ★★ <b>파란 히어로가 맨 위에</b> 서고, <b>그 분을 들고 가는 길도 그대로</b> (사장님 말씀 「둘 다」)');
  /* 사장님 말씀 (2026-09-30) — <b>「둘 다 둡니다 — 맨 위에 세우세요」</b>.
     ⚠ 이 자리는 2026-09-23 에 <b>「맨위에 띄우지말고」</b> 로 뺐던 곳입니다.
       빼신 까닭은 맨 위 한 장이 <b>누구의 보장분석인지 모른 채</b> 화면만
       열어서였고, 그 문제는 <b>「오늘 제안하는 분 줄」(hmBaGo)</b> 이 이미
       풀었습니다. 뜻이 다릅니다 — 맨 위는 「아무나」, 줄은 「그 분」.
     ★ 그래서 <b>둘 다</b> 봅니다. 하나만 보면 다른 하나를 잃어도 조용합니다. */
  const hero = await PC.evaluate(() => {
    const h = document.querySelector('#hmTossHost .tz-hero');
    const pane = document.querySelector('.tab-pane.on');
    const flow = document.getElementById('hmFlowHost');
    const b = h ? h.querySelector('.b') : null;
    return { has: !!h,
      q: h ? (h.querySelector('.q') || {}).innerText || '' : '',
      btn: b ? (b.innerText || '').trim() : '',
      tap: b ? Math.round(b.getBoundingClientRect().height) : 0,
      y: h ? Math.round(h.getBoundingClientRect().top) : 0,
      flowY: flow ? Math.round(flow.getBoundingClientRect().top) : 0,
      /* ★ 「그 분을 들고 가는 길」 이 살아 있나 — 함수와 부르는 자리 둘 다 */
      baGoFn: (typeof hmBaGo === 'function') };
  });
  is(hero.has, '  <b>맨 위 히어로</b>가 선다 (목각 ⑧)');
  is(/KB보장분석/.test(hero.q), '  목업 <b>글자 그대로</b>다 — 「' + hero.q.replace(/\s+/g, ' ').slice(0, 40) + '」');
  is(!!hero.btn && hero.tap >= 44, '  단추가 <b>손가락 크기</b>다 — 「' + hero.btn + '」 ' + hero.tap + 'px');
  is(hero.has && hero.flowY > hero.y,
     '  <b>상담현황보다 위</b>에 있다 (목각 차례) — 히어로 y' + hero.y + ' · 상담현황 y' + hero.flowY);
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
    const c = document.querySelector('.hm-2col'); if (!c) return { no: 1 };
    const R = c.children[1];
    const cards = [...R.children].map(e => {
      const t = (e.innerText || '').replace(/\s+/g, ' ').trim();
      return { t: t, h: Math.round(e.getBoundingClientRect().height),
               head: t.split(' ').slice(0, 3).join(' ') };
    });
    return { no: 0, cards: cards, txt: (R.innerText || '').replace(/\s+/g, ' ').trim() };
  });
  const 있나 = (w) => !side.no && side.cards.some(c => c.t.indexOf(w) >= 0);
  ['이번 주', '오늘 어디로', '이번 달 고객 관리', '알람'].forEach(w =>
    is(있나(w), '  목각의 <b>「' + w + '」</b> 자리가 있다'));
  /* ★ 차례도 목각대로 — 이번 주 → 오늘 동선 → 이번 달 → 알람 */
  const at = (w) => side.no ? -1 : side.cards.findIndex(c => c.t.indexOf(w) >= 0);
  is(at('이번 주') >= 0 && at('이번 주') < at('오늘 어디로') &&
     at('오늘 어디로') < at('이번 달 고객 관리') && at('이번 달 고객 관리') < at('알람'),
     '  <b>차례가 목각대로</b>다 — 이번 주 → 오늘 동선 → 이번 달 고객 관리 → 알람');
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
  /* ★ 셀 수 있는 것은 <b>진짜 수</b>로 — 「오늘 동선」 은 이미 셉니다 */
  const rt = side.no ? null : side.cards.find(c => c.t.indexOf('오늘 어디로') >= 0);
  is(!!rt && !/아직 세는 자리가 없습니다/.test(rt.t),
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
    const cnt = () => { const c = document.querySelector('#hmToday .hm-now');
      return {
        judge: document.querySelectorAll('#hmToday .hm-now .t-note.b').length,
        cqa:   document.querySelectorAll('#hmToday .cqaCard').length,
        tools: document.querySelectorAll('#hmToday .hm-now .hm-ask-o').length,
        h:     c ? Math.round(c.getBoundingClientRect().height) : 0 }; };
    const b = document.querySelector('#hmToday .hm-more-b');
    if (!b) return { no: 1 };
    const shutTxt = (b.innerText || '').replace(/\s+/g, ' ').trim();
    const shut = cnt();
    const tap = Math.round(b.getBoundingClientRect().height);
    b.click();
    const b2 = document.querySelector('#hmToday .hm-more-b');
    const openTxt = (b2 ? b2.innerText : '').replace(/\s+/g, ' ').trim();
    const open = cnt();
    let saved = null; try { saved = JSON.parse(localStorage.getItem('apex_hm_fold_v1') || '{}').more; } catch (e) {}
    return { no: 0, shutTxt, openTxt, shut, open, tap, saved };
  });
  is(!pk.no, '  단추(.hm-more-b)가 <b>늘 서 있다</b> — 감추기만 하고 길이 없으면 안 된다 (6번)');
  is(!pk.no && pk.shut.tools === 0 && pk.shut.cqa === 0,
     '  ★ <b>접힌 채로</b> 열린다 (사장님 말씀 「그 넷도 접어」) — 도구 ' +
     (pk.shut ? pk.shut.tools : '?') + '개 · 물음 ' + (pk.shut ? pk.shut.cqa : '?') + '개');
  is(!pk.no && /이분 자세히/.test(pk.shutTxt) && /판단/.test(pk.shutTxt) && /단계/.test(pk.shutTxt),
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
    const 넷 = up ? [].slice.call(up.children).map(e => ({
      이름: (e.querySelector('.hm-rt-h b') || {}).textContent || e.id || e.className,
      y: y(e) })) : [];
    const now = document.querySelector('.hm-now');
    return { no: 0, lx: Math.round(rl.left), rx: Math.round(rr.left),
             ly: Math.round(rl.top), ry: Math.round(rr.top),
             kb: y(document.getElementById('hmKbHost')),
             td: y(document.getElementById('hmToday')),
             nowEnd: now ? y(now) + hh(now) : -1,
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
  /* ★ <b>기준선</b> — 첫 칸이 「지금 할 것」 이 끝나는 자리에서 <b>120px 안</b>.
     전에는 3,000 이었고 실제로 y2,612 였습니다. 이제 바로 붙어 섭니다.    */
  is(!one.no && 첫넷 > 0 && one.nowEnd > 0 && 첫넷 >= one.nowEnd - 8 && 첫넷 <= one.nowEnd + 120,
     '  ★★ 첫 칸이 <b>「지금 할 것」 바로 아래</b>다 — 지금 할 것 끝 y' + one.nowEnd +
     ' · 첫 칸 y' + 첫넷 + ' (틈 120px 안 · 2026-10-06 사장님 「끌어올려」)');
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
