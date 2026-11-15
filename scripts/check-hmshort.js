/* 🗜 <b>홈 짧게 보기</b> — 「한 화면」 과 「첫 화면에 보이게」 를 둘 다 지키는가 (판 X450)

   사장님 말씀 — 「<b>홈이 한 화면에 들게</b>」(X03 · 2026-09-25) ·
   「<b>홈 화면에 들게하는거 해줘</b>」(X312 · 2026-11-04) ·
   2026-11-15 「안 끝낸 10개 뭔지 <b>다하고</b>」.

   ── ⚠⚠ 이 둘은 서로 맞섭니다 ─────────────────────────────────
   재어 보니 홈이 <b>2,915px(3.45화면)</b> 인데, 그 길이는 낭비가 아니라
   사장님이 칸마다 <b>「첫 화면에 보이게」 라고 시키신 결과</b>입니다 —
     🎯 지금 할 것 684 (X187 「맨위로」)      · 다섯 걸음 210 (X285 「이 한칸으로」)
     📇 고객 띠   165 (X158 「칸을 활용」)    · 🚗 동선   280 (X248 「추천 띄우고」)
     📅 약속     192 (X217·X43)            · 📊 기록   129 (X250 「활동 먼저」)
   <b>어느 하나를 접으면 그 말씀을 제가 덮는 것</b>입니다 (0-1번 「눈금을 내리려고
   말씀을 덮지 않습니다」).

   ★★ 그래서 <b>어느 쪽도 안 덮습니다</b> — 기본은 사장님이 정하신 그대로,
     <b>단추 하나</b>로 짧은 홈이 됩니다. 누르면 그대로 돌아옵니다 (6번).

   ── 보는 것 ───────────────────────────────────────────────────
     [1] ★ 기본은 <b>안 바뀐다</b> — 단추를 안 누르면 칸이 하나도 안 사라진다
     [2] ★★ 누르면 <b>짧아진다</b> — 3.45화면 → 선 아래
     [3] ★★ 남는 것은 <b>다섯 걸음 + 「지금 할 것」</b> — 사장님 말씀의 두 축
     [4] ★★ <b>무엇을 감췄는지 이름으로 적는다</b> (1번) — 조용히 사라지지 않게
     [5] ★ 한 번 더 누르면 <b>그대로 돌아온다</b> (6번)
     [6] ★ 고름은 <b>이 기기에만</b> — 보기 취향이라 기기끼리 안 나눈다 (판 X449)
     [7] ★ 옷을 <b>칸 이름으로 안 적는다</b> — 규칙으로 건다(이름으로 적으면 또 낡습니다)  */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

/* 눈금 — <b>짧게 보기를 켠 홈</b>. 2026-11-15 (판 X450) 에 잰 값 1,021px(1.21화면).
   ⚠ <b>1.0 이 아닙니다.</b> 남은 177px 은 다섯 걸음 띠(210)와 「지금 할 것」(684)의
     꼬리이고, 그 둘은 사장님이 「이 한칸으로」·「맨위로」 라고 하신 바로 그것입니다 —
     더 줄이려면 그 말씀을 접어야 하므로 <b>여기서 멈추고 수를 적습니다</b> (1번).
   ★ 기본(안 누른 홈)은 2,915px 입니다. 둘 다 늘면 빨간불입니다. */
const 짧은선 = 1150, 기본선 = 3000;
/* ⚠ 처음에 1,100 으로 적었다가 자가 울었습니다 — <b>안내 줄이 생기기 전</b>에 잰 수였습니다.
   「무엇을 감췄는지」 를 적는 줄도 <b>자리를 먹습니다</b>(갈래로 묶어 147 → 108px).
   재어 본 값 1,129px 에 여유 21px 을 두어 1,150 으로 둡니다 (1번 — 어림한 수를 그대로
   적어 두면 그것이 사실로 읽힙니다). */

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
  try{ NLIVE.items = [{ t:'견본 기사 — 점검용입니다', u:'https://example.com/1', s:'견본통신', d:'2026-11-15' }];
       NLIVE.loaded = true; NLIVE.cat='all'; NLIVE.age='all'; }catch(e){}
  go('home');
};

(async () => {
  await new Promise(r => srv.listen(0, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://**', r => r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof renderHome === 'function', { timeout: 60000 });
  await pg.evaluate(SEED);
  await pg.waitForTimeout(2600);

  const 재기 = () => pg.evaluate(() => {
    const pane = document.querySelector('#dynPane .tab-pane.on') || document.getElementById('dynPane');
    const 보임 = (id) => { const e = document.getElementById(id);
      return !!(e && e.getBoundingClientRect().height > 0); };
    return { px: Math.round(pane.scrollHeight),
             띠: 보임('hmBandHost'), 동선: 보임('hmRtHost'), 약속: 보임('hmUpHost'),
             걸음: 보임('hmTodayHd'), 할것: 보임('hmJobHost'), 곁칸: 보임('hmSideUp'),
             짧은중: document.body.classList.contains('hm-short'),
             글: (pane.innerText || '').replace(/\s+/g, ' ') };
  });

  sec('[1] ★ 기본은 <b>안 바뀐다</b> — 단추를 안 누르면 칸이 하나도 안 사라진다');
  const 기본 = await 재기();
  is(!기본.짧은중, '처음에는 <b>짧게 보기가 꺼져</b> 있다');
  is(기본.띠 && 기본.동선 && 기본.약속 && 기본.걸음 && 기본.할것 && 기본.곁칸,
     '사장님이 「첫 화면에 보이게」 하신 칸이 <b>다 섰다</b> — 📇 띠 · 🚗 동선 · 📅 약속 · 다섯 걸음 · 지금 할 것 · 곁칸');
  is(기본.px <= 기본선, '기본 홈 <b>' + 기본.px + 'px</b>(' + (기본.px / 844).toFixed(2) +
     '화면) / 기준선 ' + 기본선 + ' — 늘면 빨간불입니다');

  sec('[2]·[3] ★★ 누르면 <b>짧아지고</b>, 남는 것은 <b>다섯 걸음 + 「지금 할 것」</b>');
  /* ⚠⚠ 「있다」 가 아니라 <b>「보인다」</b> 를 물어야 합니다 — 처음에 있기만 하고
     display:none 이라 <b>영영 안 보였습니다</b>. 안내 줄은 「맨 위 🗜 다 보기 를 누르시면」
     이라고 하는데 그 단추가 없었습니다. 자가 「있다」 만 물어 못 잡았습니다 (8번). */
  const 단추 = await pg.evaluate(() => {
    const e = document.getElementById('hmShortBtn');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), 보임: getComputedStyle(e).display };
  });
  is(!!단추 && 단추.w > 0 && 단추.h >= 44,
     '맨 위 띠에 <b>🗜 짧게</b> 단추가 <b>보인다</b> — ' +
     (단추 ? (단추.w + '×' + 단추.h + 'px · ' + 단추.보임) : '(없습니다)') + ' · 44px 위');
  await pg.evaluate(() => hmShortToggle());
  await pg.waitForTimeout(700);
  const 짧 = await 재기();
  is(짧.짧은중, '누르면 <b>켜진다</b>');
  is(짧.px <= 짧은선, '★★ 짧은 홈 <b>' + 짧.px + 'px</b>(' + (짧.px / 844).toFixed(2) +
     '화면) / 기준선 ' + 짧은선 + ' — 기본 ' + 기본.px + 'px 에서 <b>' + (기본.px - 짧.px) + 'px</b> 줄었습니다');
  is(짧.걸음 && 짧.할것, '★★ <b>다섯 걸음</b>과 <b>「지금 할 것」</b> 은 남는다 — 사장님 말씀의 두 축');
  is(!짧.띠 && !짧.동선 && !짧.약속 && !짧.곁칸, '  나머지는 감춰진다');

  sec('[4] ★★ <b>무엇을 감췄는지 이름으로 적는다</b> (1번)');
  is(/짧게 보는 중/.test(짧.글), '「짧게 보는 중」 이라고 적는다');
  is(/📇 고객 띠/.test(짧.글) && /🚗 동선/.test(짧.글) && /📅 달력/.test(짧.글),
     '  감춘 것을 <b>이름으로</b> 적는다 — 조용히 사라지면 「어디 갔지」 하십니다');
  is(/다 보기/.test(짧.글), '  돌아가는 길을 적는다 (6번)');

  sec('[5] ★ 한 번 더 누르면 <b>그대로 돌아온다</b> (6번)');
  await pg.evaluate(() => hmShortToggle());
  await pg.waitForTimeout(700);
  const 되돌림 = await 재기();
  is(!되돌림.짧은중 && 되돌림.띠 && 되돌림.동선 && 되돌림.약속 && 되돌림.곁칸,
     '감췄던 칸이 <b>다 돌아왔다</b>');
  is(Math.abs(되돌림.px - 기본.px) <= 30,
     '  길이도 그대로다 — ' + 기본.px + ' → ' + 되돌림.px + 'px');

  sec('[6]·[7] ★ 이 기기에만 · 옷을 <b>칸 이름으로 안 적는다</b>');
  const KV = fs.readFileSync(path.join(ROOT, 'app/apex-kv-sync.js'), 'utf8');
  is(/apex_hm_short_v1/.test(KV), '고름(apex_hm_short_v1)이 <b>안 올리는 목록</b>에 있다 — 보기 취향입니다 (판 X449)');
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const CSS = (SRC.match(/function hmShortCss\(\)\{[\s\S]*?\n\}/) || [''])[0];
  is(/\.tz>\*\{display:none/.test(CSS) && /#hmTossHost~\*\{display:none/.test(CSS),
     '★ 옷을 <b>규칙으로</b> 건다 — 칸 이름을 하나하나 적으면 칸이 늘 때 또 낡습니다 (판 X449 에서 배운 것)');
  is(errs.length === 0, '재는 동안 <b>터진 곳이 없다</b>' + (errs.length ? (' ← ' + errs[0]) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데가 걸렸습니다.'); process.exit(1); }
  console.log('✓ 기본은 사장님이 정하신 그대로이고, 한 번 누르면 홈이 한 화면 가까이 줄어듭니다.');
})().catch(e => { console.error('터짐: ' + e.message); try { srv.close(); } catch (x) {} process.exit(1); });
