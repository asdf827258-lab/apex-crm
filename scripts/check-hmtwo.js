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

  /* ── [5] 「또 무엇을 할까요」 접이 ─────────────────────────────── */
  console.log('\n[5] ★★ 「또 무엇을 할까요」 가 <b>접힌 채로 열리고 · 눌러서 펴지고 · 기억한다</b> (6번)');
  const pk = await PC.evaluate(() => {
    const f = document.getElementById('hmFold_picks'); if (!f) return { no: 1 };
    const h = f.querySelector('.hm-fold-h');
    const opened = f.classList.contains('on');
    const head = (h ? h.innerText : '').replace(/\s+/g, ' ').trim();
    const shut = Math.round((f.querySelector('.hm-fold-b') || f).getBoundingClientRect().height);
    if (h) h.click();
    const open = Math.round((f.querySelector('.hm-fold-b') || f).getBoundingClientRect().height);
    const tools = f.querySelectorAll('.hm-ask-o').length;
    let saved = null; try { saved = JSON.parse(localStorage.getItem('apex_hm_fold_v1') || '{}').picks; } catch (e) {}
    return { no: 0, opened, head, shut, open, tools, saved,
             tap: h ? Math.round(h.getBoundingClientRect().height) : 0 };
  });
  is(!pk.no, '  접이(#hmFold_picks)가 <b>있다</b>');
  is(!pk.no && !pk.opened, '  ★ <b>접힌 채로</b> 열린다 — 홈의 규칙 그대로');
  is(!pk.no && /또 무엇을 할까요/.test(pk.head) && /\d+가지/.test(pk.head),
     '  ★ 머리에 <b>몇 가지인지</b> 적는다 — 접힌 채로도 무엇이 든지 안다 (1번) · 「' + pk.head + '」');
  is(!pk.no && pk.open > pk.shut && pk.tools > 0,
     '  ★ <b>눌렀더니 펴진다</b> — ' + pk.shut + 'px → ' + pk.open + 'px · 도구 ' + pk.tools + '개 (지운 것이 아니다)');
  is(!pk.no && pk.saved === true, '  ★ <b>편 것을 기억한다</b> — 다음 분으로 넘어가도 그대로');
  is(!pk.no && pk.tap >= 44, '  손가락 크기 <b>44px</b> — ' + pk.tap + 'px');

  /* ── [2] 폰에서는 한 기둥 ──────────────────────────────────────── */
  console.log('\n[2] 폰(390)에서는 <b>한 기둥</b>이다 — 목각에 폰 답이 없다 (1번)');
  const PH = await open(390);
  const one = await PH.evaluate(() => {
    const c = document.querySelector('.hm-2col'); if (!c) return { no: 1 };
    const [L, R] = c.children;
    const rl = L.getBoundingClientRect(), rr = R.getBoundingClientRect();
    return { no: 0, lx: Math.round(rl.left), rx: Math.round(rr.left),
             ly: Math.round(rl.top), ry: Math.round(rr.top),
             over: Math.round(document.documentElement.scrollWidth - window.innerWidth) };
  });
  is(!one.no && one.lx === one.rx, '  <b>같은 줄에서 시작</b>한다 — 왼쪽 x' + one.lx + ' · 오른쪽 x' + one.rx);
  is(!one.no && one.ry > one.ly, '  <b>위아래로</b> 쌓인다 — 왼쪽 y' + one.ly + ' · 오른쪽 y' + one.ry);
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
