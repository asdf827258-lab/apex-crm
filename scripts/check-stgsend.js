/* ═══════════════════════════════════════════════════════════════════
   check-stgsend.js — 🎯 <b>메뉴 옆에서 상담 자리로 보내기</b> ·
                      ⭐ 오늘에서 <b>넣고 빼기</b>.   — 판 X350

   사장님 말씀 (2026-11-05) — 「오늘에서, 지금 새로운 메뉴들이 <b>상담
   순서에 맞게 분류</b>되어있는지 다시 한번 체크하고 정리해줘 그리고
   <b>내가 추가하고 오늘에서 물수 있도록</b> 만들어」 → 여쭤었더니
   「<b>그냥 내가 메뉴옆에 ta _cs 로 보내고 싶은곳을 선택하면 보내지도록 해줘</b>」.

   ── 먼저 재어 본 것 ──────────────────────────────────
   메뉴 <b>113칸 중 53칸</b>만 상담 순서 표(apex-stage.js 의 BOX)에 묶여
   있었습니다. 나머지 60칸은 고객 카드에서 <b>한 번도 안 따라옵니다</b>.
   제가 그 60칸을 단계에 배정할 수도 있었지만, 어느 도구를 어느 자리에서
   쓰는지는 <b>설계사가 압니다</b> — 제가 정하면 엉뚱한 때에 따라오고,
   그것은 지어내는 것과 같습니다 (1번). 그래서 <b>고르는 손</b>을 드립니다.

   ── 보는 것 ─────────────────────────────────────────
     [1] 메뉴 칸마다 단추가 선다 · 44px (판 X146·X147)
     [2] 고르개가 <b>상담 순서 그대로</b> — 차례를 <b>여기 또 적지 않고</b>
         APEX_STAGE.order 한 곳에서 가져왔나 (5번)
     [3] ★★ 고르면 <b>그 단계 고객 카드가 바로 쥐나</b> — 새로고침 없이.
         ⚠ <b>여기서 데였습니다.</b> tdoTools 가 켬 때 한 번 베끼 둔 사본
         (TDO[k].tools)만 읽어, 고르셨는데도 고객 카드는 <b>예전 그대로</b>였습니다.
         베낌 사본은 언제나 늘습니다 (5번).
     [4] ★★ <b>원래 있던 도구가 하나도 안 빠진다</b> (6번)
     [5] 빼면 <b>도로 사라진다</b> — 되돌릴 길이 있다 (6번)
     [6] ★★ 「오늘」 의 ⭐ 칸이 <b>즐겨찾기 한 곳</b>(navFav)을 읽는다 (5번) ·
         고르신 것이 없어도 <b>자리를 지킨다</b>
     [7] ★★ 오늘에서 ✕ 로 빼면 <b>위 띠에서도 같이</b> 빠진다 — 두 벌이 아니다
     [8] ＋ 넣기 창이 <b>서랍과 같은 묶음</b>을 보여 준다 (5번) · 44px
     [9] 바깥을 <b>한 번도 안 부른다</b> (7번) · 콘솔 터짐 0

   ★ 되돌려 보았습니다 (8번) — 셋을 깨뜨려 보고 전부 울었습니다:
     ⓐ tdoTools 를 <b>옆 사본 읽기</b>로 되돌리기 → [3] 이 「TA 카드가 안 쥐다」로 움
     ⓑ boxIds 에서 사장님이 보내신 것 빼기 → [3] 의 「단계 표도 안다」가 움
     ⓒ hmPickHtml 이 <b>제 목록</b>을 들게 하기 → [7] 이 「위 띠에서 안 빠진다」로 움
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
const 메뉴선 = 90;
/* 폰에서 ⭐ 칸이 홈을 얼마나 늘려도 되나 — 재어 보니 여덟 칸에 +54px 입니다.
   홈 눈금은 2,870px 이고 지금 2,726px 이라 남은 자리가 144px 뿐입니다. */
const 폰늘선 = 90;   /* 재어 보니 103칸 — 등급에 따라 좀 줄어들 수 있어 낮게 잡습니다 (8번) */
const head = (m) => console.log('\n' + m);
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
  /* ★ <b>셋</b>을 심습니다 (판 X259) — 사장님께서 「펴면 여러 건 목록」 을
     고르셔서, 목록이 서는지 재려면 고를 것이 둘 이상 있어야 합니다.
     한 건만 있으면 앱이 「이 한 건뿐입니다」 라고 적는 것이 맞습니다.    */
  try{ NLIVE.items = [
      { t:'견본 기사 — 홍길동생명이 보험료 조정을 알렸습니다 (점검용 견본입니다)',
        u:'https://example.com/견본1', s:'견본통신', d:'2026-09-15' },
      { t:'견본 기사 둘 — 홍길순님 동네에 요양 등급 신청이 늘었습니다 (점검용 견본)',
        u:'https://example.com/견본2', s:'견본일보', d:'2026-09-14' },
      { t:'견본 기사 셋 — 홍길중님 또래의 노후 준비 설문 (점검용 견본입니다)',
        u:'https://example.com/견본3', s:'견본경제', d:'2026-09-13' }];
       NLIVE.loaded = true; NLIVE.cat = 'all'; NLIVE.age = 'all'; }catch(e){}
  go('home');
};


(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [], 바깥 = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 980 } });
  await ctx.addInitScript(PIN, 못박은날);
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  /* ★ 사장님 <b>진짜 서버</b>를 한 번도 안 읽습니다 (7번 · check-netblock).
     ⚠ 바깥은 <b>전부 끊지만</b>, 세는 것은 <b>글꼴이 아닌 것</b>만입니다 —
       글꼴 CDN 을 「서버를 불렀다」 로 세면 <b>헛것</b>입니다. 헛것을 잡는 점검은
       안 잡는 점검보다 나쁩니다 (8번). 처음에 그렇게 세어 저를 고발했습니다. */
  /* 세는 것은 <b>사장님 서버</b>뿐입니다 — Supabase · Netlify · 우리 api.
     글꼴 CDN 과 라이브러리 CDN 은 <b>화면이 켜질 때</b> 저절로 받는 것이라
     이 기능이 부른 것이 아닙니다. 그것까지 세면 헛것입니다 (8번). */
  const 사장님서버 = (u) => /supabase\.co|supabase\.in|netlify\.app|\.netlify\/functions|\/api\//i.test(u);
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('http://127.0.0.1:' + PORT) === 0 || u.indexOf('http://localhost:' + PORT) === 0)
      return r.continue();
    if (사장님서버(u)) 바깥.push(u.slice(0, 70));
    return r.abort();
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => typeof renderHome === 'function' && typeof stgOpen === 'function',
                          { timeout: 60000 });
  await p.evaluate(SEED);
  await p.waitForTimeout(2600);

  head('[1] ★ 메뉴 칸마다 <b>자리로 보내는 단추</b>가 선다 — 44px');
  const a = await p.evaluate(() => {
    try { ezSet(false); } catch (e) {}
    const bs = [].slice.call(document.querySelectorAll('.nav-stg'))
                 .filter(x => x.getBoundingClientRect().height > 0);
    return { 수: bs.length, 작: bs.filter(x => x.getBoundingClientRect().height < 44).length,
             줄: document.querySelectorAll('.nav-row').length };
  });
  is(a.수 >= 메뉴선, '  🗂 전체에서 <b>' + a.수 + '칸</b>에 단추가 선다 (메뉴 줄 ' + a.줄 + ' · 선 ' + 메뉴선 + ')');
  is(a.작 === 0, '  44px 못 미치는 단추 ' + a.작 + '개 (판 X146·X147)');

  head('[2] ★ 고르개가 <b>상담 순서 그대로</b> 선다 — 차례는 APEX_STAGE.order 한 곳');
  const g = await p.evaluate(() => {
    stgOpen('saybook');
    const ops = [].slice.call(document.querySelectorAll('.stg-op'));
    return { 수: ops.length, 작: ops.filter(x => x.getBoundingClientRect().height < 44).length,
             이름: ops.map(x => (x.querySelector('b') || {}).textContent || ''),
             차례: (typeof APEX_STAGE !== 'undefined' && APEX_STAGE.order) ? APEX_STAGE.order : [] };
  });
  is(g.수 > 0 && g.이름.join('|') === g.차례.join('|'),
     '  고를 자리 ' + g.수 + '개가 <b>차례 그대로</b> — ' + g.이름.join(' → '));
  is(g.작 === 0, '  44px 못 미치는 칸 ' + g.작 + '개');

  head('[3] ★★ 고르면 <b>그 단계 고객 카드가 바로 쥔다</b> — 새로고침 없이 (5번)');
  const t = await p.evaluate(() => {
    const 전카드 = tdoTools('TA').map(x => x.id);
    stgPick('saybook', 'TA');
    return { 전카드: 전카드, 후카드: tdoTools('TA').map(x => x.id),
             후표: APEX_STAGE.toolIds('TA'),
             담김: localStorage.getItem('apex_tool_stage_me') || '' };
  });
  is(t.전카드.indexOf('saybook') < 0, '  보내기 전에는 TA 카드에 <b>없다</b> — ' + t.전카드.join(', '));
  is(t.후카드.indexOf('saybook') >= 0,
     '  보낸 뒤 TA 카드가 <b>쥔다</b> — ' + t.후카드.join(', '));
  /* ★★ 여기가 데인 자리입니다 — 켤 때 베껴 둔 사본을 읽으면 이 줄이 웁니다 */
  is(t.후표.indexOf('saybook') >= 0, '  단계 표(boxIds)도 같이 안다 — ' + t.후표.join(', '));
  is(t.담김.indexOf('saybook') >= 0, '  이 기기에만 담긴다 — ' + t.담김);

  head('[4] ★★ <b>원래 있던 도구가 하나도 안 빠진다</b> (6번)');
  const keep = t.전카드.filter(x => t.후카드.indexOf(x) < 0);
  is(keep.length === 0, '  빠진 도구 ' + keep.length + '개' + (keep.length ? (' ← ' + keep.join(', ')) : ''));

  head('[5] ★ 빼면 <b>도로 사라진다</b> — 되돌릴 길이 있다 (6번)');
  const off = await p.evaluate(() => {
    stgPick('saybook', '');
    return { 카드: tdoTools('TA').map(x => x.id), 담김: localStorage.getItem('apex_tool_stage_me') || '{}' };
  });
  is(off.카드.indexOf('saybook') < 0, '  뺀 뒤 TA 카드 — ' + off.카드.join(', '));
  is(off.담김.indexOf('saybook') < 0, '  담긴 것도 비었다 — ' + off.담김);

  head('[6] ★★ 「오늘」 의 ⭐ 칸이 <b>즐겨찾기 한 곳</b>을 읽는다 (5번)');
  const f = await p.evaluate(() => {
    go('home');
    const 빈 = document.querySelector('.hm-pick');
    const 빈글 = 빈 ? 빈.textContent.replace(/\s+/g, ' ').trim() : '';
    ['calc', 'sangdam'].forEach(id => { try { navFavToggle(id); } catch (e) {} });
    try { hmPickPaint(); } catch (e) {}
    return { 빈자리: !!빈, 빈글: 빈글.slice(0, 60),
             오늘: document.querySelectorAll('.hm-pick-i').length,
             위띠: document.querySelectorAll('#tnFav .tn-fi').length,
             별: navFav().length };
  });
  is(f.빈자리, '  고르신 것이 없어도 <b>자리를 지킨다</b> — 「' + f.빈글 + '」');
  is(f.오늘 === 2 && f.위띠 === 2 && f.별 === 2,
     '  둘을 넣으니 오늘 ' + f.오늘 + '칸 · 위 띠 ' + f.위띠 + '칸 · 목록 ' + f.별 + '칸 — <b>셋이 같은 수</b>');

  head('[7] ★★ 「오늘」 에서 <b>✕ 로 빼면 위 띠에서도 빠진다</b> — 두 벌이 아니다');
  const x = await p.evaluate(() => {
    const el = document.querySelector('.hm-pick-x');
    if (el) el.click();
    return { 오늘: document.querySelectorAll('.hm-pick-i').length,
             위띠: document.querySelectorAll('#tnFav .tn-fi').length, 별: navFav().length };
  });
  is(x.오늘 === 1 && x.위띠 === 1 && x.별 === 1,
     '  하나 빼니 오늘 ' + x.오늘 + ' · 위 띠 ' + x.위띠 + ' · 목록 ' + x.별 + ' — <b>같이 빠진다</b>');

  head('[8] ★ ＋ 넣기 창이 <b>서랍과 같은 묶음</b>을 보여 준다 (5번) · 44px');
  const m = await p.evaluate(() => {
    hmPickAdd();
    const bs = [].slice.call(document.querySelectorAll('.hm-pk-b'));
    const G = (typeof navVisGroups === 'function') ? navVisGroups() : [];
    let n = 0; G.forEach(g => { n += (g.items || []).length; });
    return { 묶음: document.querySelectorAll('.hm-pk-g').length, 칸: bs.length, 서랍칸: n,
             묶음수: G.filter(g => g.items && g.items.length).length,
             작: bs.filter(y => y.getBoundingClientRect().height < 44).length };
  });
  is(m.묶음 === m.묶음수 && m.칸 === m.서랍칸,
     '  묶음 ' + m.묶음 + '/' + m.묶음수 + ' · 칸 ' + m.칸 + '/' + m.서랍칸 + ' — 목록을 따로 안 만든다');
  is(m.작 === 0, '  44px 못 미치는 칸 ' + m.작 + '개');

  head('[10] ★★ 폰에서 <b>여덟 칸을 넣어도 한 줄</b> — 홈이 고른 수에 안 끌려간다');
  {
    /* ⚠⚠ <b>안 울리는 알람이 될 뻔한 자리입니다</b> (8번). 홈 길이를 지키는
       자들(check-homeone · check-msfive)은 <b>빈 저장소</b>로 재므로 ⭐ 칸이
       비어 있습니다. 그런데 사장님 폰에는 고르신 칸이 들어 있습니다 —
       처음에 줄이 겹겹이 쌓이게 두었더니 넷만 넣어도 폰 홈이 <b>+210px</b>,
       눈금(2,870px)을 넘었습니다. 자는 초록인데 <b>진짜 화면은 넘는</b> 꼴입니다.
       그래서 여기서 <b>채워 놓고</b> 잽니다. */
    const ph = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ph.addInitScript(PIN, 못박은날);
    await ph.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    const pp = await ph.newPage();
    await pp.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await pp.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
    await pp.evaluate(SEED);
    await pp.waitForTimeout(2600);
    const r2 = await pp.evaluate(() => {
      const 전 = Math.round(document.querySelector('#dynPane .tab-pane').scrollHeight);
      ['calc','sangdam','frmake','bohum','crm','clients','mycal','settings']
        .forEach(id => { try { navFavToggle(id); } catch (e) {} });
      try { hmPickPaint(); } catch (e) {}
      const el = document.querySelector('.hm-pick');
      const 칸 = [].slice.call(document.querySelectorAll('.hm-pick-i'));
      /* 한 줄인가 — 칩들의 윗선이 다 같은가 (겹겹이 쌓이면 달라집니다) */
      const 윗선 = {}; 칸.forEach(x => { 윗선[Math.round(x.getBoundingClientRect().top)] = 1; });
      return { 전: 전, 후: Math.round(document.querySelector('#dynPane .tab-pane').scrollHeight),
               칸: 칸.length, 줄: Object.keys(윗선).length,
               높이: el ? Math.round(el.getBoundingClientRect().height) : 0 };
    });
    is(r2.칸 === 8, '  여덟 칸을 넣었다 — ' + r2.칸 + '칸');
    is(r2.줄 === 1, '  칩이 <b>한 줄</b>에 선다 (줄 ' + r2.줄 + ' · 겹겹이 쌓이면 홈이 길어집니다)');
    is(r2.후 - r2.전 <= 폰늘선,
       '  여덟 칸을 넣어 홈이 <b>+' + (r2.후 - r2.전) + 'px</b> (선 +' + 폰늘선 +
       'px · ⭐ 칸 ' + r2.높이 + 'px) — 고치기 전에는 넷만 넣어도 +210px 였습니다');
    await ph.close();
  }

  head('[9] <b>사장님 서버를 한 번도 안 부른다</b> (7번) · 콘솔 터짐 0');
  is(바깥.length === 0, '  Supabase · Netlify · api 요청 ' + 바깥.length + '건 (글꼴·라이브러리 CDN 은 안 셉니다 — 8번)' + (바깥.length ? (' ← ' + 바깥[0]) : ''));
  is(errs.length === 0, '  터진 자리 ' + errs.length + (errs.length ? (' ← ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('자리 보내기 점검 — 어긋난 것 ' + bad + '가지')
                  : '자리 보내기 점검 통과 — 고르신 자리가 고객 카드까지 그대로 갑니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐:', e.message); try { srv.close(); } catch (x) {} process.exit(1); });
