/* 🧍 <b>명단 줄이 목각 옷을 입었나</b> (판 ⑧).

   판 ③ 때 배정 DB 줄을 본체 명단에 세우면서 <b>옛 옷(.cm-row)을 그대로</b>
   썼습니다. 그 판단은 맞았습니다 — 새 줄만 갈아입히면 한 화면에 옷이 두
   벌이 되니까요. 대장 X29 에 「통째로 갈아입히는 것은 <b>따로 한 판</b>」
   이라고 적어 두었고, 이것이 그 판입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 두 종류 줄이 <b>다 .t-row</b> 인가 · 명단에 .cm-row 가 0인가
     [2] ★★ <b>390px 에서 이름이 안 사라지나</b> — 여기서 실제로 데었습니다.
         목각 .rt 는 가로 한 줄인데 본체 줄은 오른쪽에 <b>다섯</b>이 섭니다.
         그대로 옮기니 오른쪽이 줄보다 35px 넘치고 .m 이 <b>폭 0</b> 으로
         찌부러져 이름이 통째로 사라졌습니다(줄 높이 434px).
     [3] ★ <b>챙길 분만 붉게</b> (사장님 2026-09-29) — 아바타는 한 색이
         기본이고 석 달 넘게 못 뵌 분만 붉다. 온도 <b>네 색</b>이 아니다.
         그리고 <b>온도는 글자로 그대로</b> 남는다 (「🔥 3일 전」)
     [4] ★ <b>약속 넘김 바탕</b> (사장님 2026-09-29) — 색표의 토큰이지
         생 hex 가 아니다. 그리고 <b>안 사라졌다</b>
     [5] ★ <b>이름 옆 셋</b>이 안 사라지고 <b>한 줄에 나란히</b> 선다 —
         담당자 딱지 · 👑 VIP · 가려 둔 이름. 가린 이름은 작은 회색이다
     [6] <b>새 CSS 0줄</b> — 줄에 쓴 이름이 전부 이미 있는 것
     [7] 누르는 것이 <b>44px 이상</b>
     [8] 줄을 누르면 <b>그 분 한 장</b>이 열리고 📞 가 창을 연다 —
         갈아입히다 잃기 쉬운 자리
     [9] 조용히 터진 곳이 없다

   ★ 견본 이름은 <b>홍길동</b> 집안입니다 (3번).                        */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8971;
const UICSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const q = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (q.indexOf('/.netlify/functions/push') === 0) {
    rs.writeHead(200, { 'Content-Type': 'application/json' });
    rs.end(JSON.stringify({ key: null, why: '없음', from: 'env', has: false })); return;
  }
  const f = path.join(ROOT, q);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

const SEED = () => {
  try { localStorage.setItem('apex_login_ok', '1'); } catch (e) {}
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function (m) { window.__T = m; };
  window.setupDone = function () { return true; }; window.setupCanRun = function () { return true; };
  window.osTabAllowed = function () { return true; };
  OS.profile = { id: 'me', user_id: 'me', name: '홍길동', role: 'fp', team: 'A', active: true };
  OS.session = { user: { id: 'me' } };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.q = ''; OSC.view = 'list';
  CM.loaded = true; CM.meta = {}; CM.pick = null; CM.picked = true; CM.byWho = false;
  CM.who = { me: '홍길동', u2: '홍길순' };
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  const t = ccToday();
  const ago = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  /* 👑 VIP 는 실적에서 나오는데 견본에 실적을 심으면 다른 자와 얽힙니다 —
     <b>그 한 가지만</b> 눌러 둡니다. 여기서 재는 것은 「VIP 딱지가 줄에
     서는가」 이지 「누가 VIP 인가」 가 아닙니다.                        */
  window.ccIsVip = function (id) { return id === 'c3'; };
  OSC.list = [
    /* 오늘 연락한 분 — 아바타는 한 색 */
    { id: 'c0', name: '홍길동', advisor_id: 'me', stage: 'AP', created_at: ago(200) },
    /* 석 달 넘게 못 뵌 분 — 아바타가 붉다 · 약속도 넘겼다 */
    { id: 'c1', name: '홍길순', advisor_id: 'me', stage: 'PC', created_at: ago(200) },
    /* 남이 맡은 분 — 담당자 딱지가 붙는다 */
    { id: 'c2', name: '홍길상', advisor_id: 'u2', stage: 'TA', created_at: ago(200) },
    /* 👑 VIP + 실명을 적어 둔 분 */
    { id: 'c3', name: '홍기동', advisor_id: 'me', stage: 'CS', created_at: ago(200) }];
  CM.meta.c0 = { touch: [{ at: t, how: '전화', note: '오늘', cc: 1 }] };
  CM.meta.c1 = { touch: [{ at: ago(120), how: '전화', note: '오래됨', cc: 1 }] };
  CM.meta.c2 = { touch: [{ at: t, how: '전화', note: '오늘', cc: 1 }] };
  CM.meta.c3 = { touch: [{ at: t, how: '전화', note: '오늘', cc: 1 }] };
  try { osHideLoginGate(); } catch (e) {}
  try { renderNav(); } catch (e) {}
  go('clients');
  try { cmRealSet('c3', '홍기동'); } catch (e) {}
  try { osRenderList(); } catch (e) {}
};

/* 한 판 열어 재는 자리 — 두 크기에서 똑같이 돌립니다 */
const look = () => ({
  rows: document.querySelectorAll('#oscList .t-row').length,
  old: document.querySelectorAll('#oscList .cm-row').length,
  /* 오른쪽이 줄 밖으로 나가나 · 이름 칸이 찌부러지나 */
  fit: Array.prototype.map.call(document.querySelectorAll('#oscList .t-row'), function (r) {
    const rb = r.getBoundingClientRect();
    const rt = r.querySelector('.rt'), m = r.querySelector('.m');
    return { over: rt ? Math.round(rt.getBoundingClientRect().right - rb.right) : 0,
             mw: m ? Math.round(m.getBoundingClientRect().width) : 0,
             h: Math.round(rb.height) };
  }),
  /* 누르는 것 */
  small: Array.prototype.filter.call(document.querySelectorAll('#oscList .t-row button'),
    function (b) { return b.getBoundingClientRect().height < 44; }).length,
  taps: document.querySelectorAll('#oscList .t-row button').length,
  /* 아바타 */
  av: Array.prototype.map.call(document.querySelectorAll('#oscList .t-row .av'),
    function (a) { return { c: a.className, bg: getComputedStyle(a).backgroundColor }; }),
  /* 약속 넘김 */
  over: Array.prototype.map.call(document.querySelectorAll('#oscList .t-row.cc-over'),
    function (r) { return getComputedStyle(r).backgroundColor; }),
  /* 온도가 글자로도 남아 있나 */
  mt: Array.prototype.map.call(document.querySelectorAll('#oscList .t-row .mt'),
    function (e) { return (e.innerText || '').slice(0, 24); }),
  /* 이름 옆 셋 */
  nm: Array.prototype.map.call(document.querySelectorAll('#oscList .t-row .nm'), function (n) {
    const kids = Array.prototype.map.call(n.children, function (e) {
      const b = e.getBoundingClientRect();
      return { c: e.className || e.tagName, top: Math.round(b.top), bot: Math.round(b.bottom),
               h: Math.round(b.height), disp: getComputedStyle(e).display,
               fs: getComputedStyle(e).fontSize, st: getComputedStyle(e).fontStyle };
    });
    /* ⚠ <b>윗변만 견주면 틀립니다</b> — 키가 다른 것이 같은 줄에 서면
       밑줄에 맞춰 서서 윗변이 어긋납니다. <b>세로로 겹치는가</b> 를 봅니다. */
    const line1 = kids.length ? kids.reduce(function (m, k) { return Math.min(m, k.bot); }, 1e9) : 0;
    return { t: (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30), kids: kids,
             sameLine: kids.length < 2 || kids.every(function (k) { return k.top < line1; }),
             /* .m 안에서 block 이 되면 한 줄을 통째로 먹습니다 */
             blocky: kids.filter(function (k) { return k.disp === 'block'; }).map(function (k) { return k.c; }) };
  }),
  /* 쓴 이름 */
  cls: Array.prototype.map.call(document.querySelectorAll('#oscList .t-row, #oscList .t-row *'),
    function (e) { return e.className || ''; }).join(' ')
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const errs = [];
  const open = async (W) => {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
    await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(W + 'px · ' + String(e).slice(0, 140)));
    await p.goto('http://127.0.0.1:' + PORT + '/app/index.html');
    await p.waitForTimeout(2600);
    await p.evaluate(SEED); await p.waitForTimeout(1400);
    return { ctx, p };
  };

  const A = await open(390), B = await open(1440);
  const a = await A.p.evaluate(look), z = await B.p.evaluate(look);

  console.log('\n[1] 두 종류 줄이 <b>다 목각 옷</b>이다');
  is(a.rows >= 4 && a.old === 0,
     '  명단이 <b>.t-row ' + a.rows + '줄</b> · 옛 .cm-row <b>' + a.old + '줄</b>');
  is(/class="t-row/.test(SRC) && !/class="cm-row/.test(SRC),
     '  줄을 그리는 두 곳이 <b>글에서도</b> .t-row 다 — 배정 DB 줄과 고객 줄');
  is(/\.cm-row\{/.test(SRC),
     '  옛 .cm-row 규칙은 <b>안 지웠다</b> (S07) — 안 쓰게 했을 뿐이다');

  console.log('\n[2] ★★ <b>390px 에서 이름이 안 사라진다</b> — 여기서 데었다');
  const bad390 = a.fit.filter(f => f.over > 0), thin = a.fit.filter(f => f.mw < 90);
  is(bad390.length === 0,
     '  오른쪽이 <b>줄 밖으로 안 나간다</b> (390px) — 넘친 줄 ' + bad390.length + '개' +
     (bad390.length ? (' ← ' + bad390.map(f => f.over + 'px').join(' ')) : ''));
  is(thin.length === 0,
     '  이름 칸이 <b>안 찌부러진다</b> (390px · 90px 이상) — ' +
     a.fit.map(f => f.mw).join(' · ') + 'px');
  is(z.fit.every(f => f.over <= 0 && f.mw >= 200),
     '  넓은 화면(1440px)도 그대로 — 이름 칸 ' + z.fit.map(f => f.mw).join(' · ') + 'px');

  console.log('\n[3] ★ <b>챙길 분만 붉게</b> · 온도는 글자로 남는다 (사장님 2026-09-29)');
  const n = a.av.filter(x => /\bn\b/.test(x.c));
  is(a.av.length >= 4 && n.length === 1,
     '  <b>한 색이 기본</b>이고 석 달 넘게 못 뵌 분만 붉다 — 붉은 줄 ' + n.length + '/' + a.av.length);
  is(n.length === 1 && n[0].bg === 'rgb(254, 242, 242)',
     '  그 색이 <b>색표의 --t-neg-l</b> 이다 — ' + ((n[0] || {}).bg || '없음'));
  is(!/\bhot\b|\bwarm\b|\bcool\b|\bcold\b/.test(a.cls),
     '  온도 <b>네 색</b>이 줄에서 사라졌다 — hot · warm · cool · cold');
  is(a.mt.some(t => /일 전|기록 없음/.test(t)),
     '  그래도 <b>온도는 글자로</b> 남는다 — 「' + (a.mt.find(t => /일 전|기록 없음/.test(t)) || '') + '」');

  console.log('\n[4] ★ <b>약속 넘김</b>이 안 사라지고, 생 hex 가 아니다');
  is(a.over.length >= 1,
     '  약속 넘긴 줄이 <b>여전히 도드라진다</b> — ' + a.over.length + '줄');
  is(a.over.length >= 1 && a.over[0] === 'rgb(255, 247, 237)',
     '  바탕이 <b>색표의 --t-warn-l</b> 이다 — ' + (a.over[0] || '없음'));
  is(!/\.t-row\.cc-over\{background:#/.test(SRC) && /\.t-row\.cc-over\{background:var\(--t-warn-l\)\}/.test(SRC),
     '  글에서도 <b>생 hex 가 아니다</b>');

  console.log('\n[5] ★ <b>이름 옆 셋</b>이 서고 한 줄에 나란하다');
  const wt = a.nm.filter(x => x.kids.some(k => /cm-wt/.test(k.c)));
  const vip = a.nm.filter(x => x.kids.some(k => /cc-vip/.test(k.c)));
  const em = a.nm.filter(x => x.kids.some(k => k.c === 'EM'));
  is(wt.length === 1, '  남이 맡은 분에 <b>담당자 딱지</b>가 붙는다 — ' + wt.length + '줄');
  is(vip.length === 1, '  <b>👑 VIP</b> 가 붙는다 — ' + vip.length + '줄');
  is(em.length === 1, '  실명을 적어 두신 분에 <b>가려 둔 이름</b>이 붙는다 — ' + em.length + '줄');
  /* ★ 좁은 화면에서는 글이 넘쳐 <b>줄바꿈되는 것이 맞습니다</b> — 잘리는
     것보다 낫습니다. 자리가 넉넉한 1440px 에서 <b>한 줄에 서는가</b> 를
     봅니다. 그것이 「inline 인가 block 인가」 를 가르는 자리입니다.      */
  const bk = [].concat.apply([], z.nm.map(x => x.blocky));
  is(bk.length === 0,
     '  이름 옆 딱지가 <b>줄을 통째로 안 먹는다</b> — ui.css 의 「.t-row :where(.m) b」 가 ' +
     '<b>를 물어 block 으로 만들던 자리다' + (bk.length ? (' ← ' + bk.join(' · ')) : ''));
  is(z.nm.every(x => x.sameLine),
     '  자리가 넉넉하면(1440px) 셋이 <b>한 줄에 나란히</b> 선다' +
     (z.nm.every(x => x.sameLine) ? '' : (' ← ' + JSON.stringify(z.nm.filter(x => !x.sameLine)[0]))));
  is(a.nm.every(x => x.kids.every(k => k.h > 0)),
     '  좁은 화면(390px)에서도 <b>하나도 안 사라진다</b> — 넘치면 줄바꿈되는 것이 맞다');
  const wtk = (wt[0] || { kids: [] }).kids.filter(k => /cm-wt/.test(k.c))[0];
  is(!!wtk && wtk.st === 'normal' && parseFloat(wtk.fs) < 14,
     '  담당자 딱지가 <b>안 기울고 작다</b> — ' + (wtk ? (wtk.fs + ' · ' + wtk.st) : '없음') +
     ' (.cm-nm .cm-wt 가 해 주던 일을 .cm-wt 자신이 하게 했습니다)');
  const vk = (vip[0] || { kids: [] }).kids.filter(k => /cc-vip/.test(k.c))[0];
  is(!!vk && vk.st === 'normal' && parseFloat(vk.fs) < 14,
     '  👑 VIP 도 <b>안 기울고 작다</b> — ' + (vk ? (vk.fs + ' · ' + vk.st) : '없음'));
  const emk = (em[0] || { kids: [] }).kids.filter(k => k.c === 'EM')[0];
  is(!!emk && emk.st === 'normal' && parseFloat(emk.fs) < 14,
     '  가려 둔 이름은 <b>안 기울고 작다</b> — ' + (emk ? (emk.fs + ' · ' + emk.st) : '없음') +
     ' (.cm-nm em 규칙에 선택자를 붙였습니다)');

  console.log('\n[6] <b>새 CSS 0줄</b> · [7] 누르는 것 44px');
  const used = [...new Set((a.cls.match(/[a-z][a-z0-9-]*/g) || []))];
  const miss = used.filter(c => UICSS.indexOf('.' + c) < 0 && SRC.indexOf('.' + c) < 0);
  is(miss.length === 0, '  쓴 이름 ' + used.length + '개가 <b>전부 이미 있는 것</b>이다' +
     (miss.length ? (' ← 없는 것 ' + miss.join(' · ')) : ''));
  is(a.taps > 0 && a.small === 0,
     '  누르는 것 ' + a.taps + '개가 <b>44px 이상</b>이다 — 작은 것 ' + a.small + '개');

  console.log('\n[8] 줄을 누르면 <b>그 분 한 장</b>이 열리고 📞 가 창을 연다');
  const C = await A.p.evaluate(() => {
    const out = {};
    const r = document.querySelector('#oscList .t-row');
    out.hasTap = !!(r && r.getAttribute('onclick'));
    let opened = '';
    const real = window.osOpenClient;
    window.osOpenClient = function (id) { opened = id; };
    if (r) r.click();
    window.osOpenClient = real;
    out.opened = opened;
    let sheet = '';
    const rs = window.cshOpen;
    window.cshOpen = function (id, dbid) { sheet = 'cshOpen(' + id + ',' + (dbid || '') + ')'; };
    const btn = Array.prototype.filter.call(document.querySelectorAll('#oscList .t-row button'),
      b => /전화/.test(b.textContent))[0];
    if (btn) btn.click();
    window.cshOpen = rs;
    out.sheet = sheet;
    return out;
  });
  is(C.hasTap && !!C.opened, '  줄을 누르면 <b>그 분 한 장</b>이 열린다 — ' + (C.opened || '안 열림'));
  is(/cshOpen\(/.test(C.sheet), '  📞 가 <b>전화 기록 창</b>을 연다 — ' + (C.sheet || '안 열림'));

  console.log('\n[9] 조용히 터진 곳이 없다');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs[0]) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '군데 — 옷만 갈아입히다 이름이 사라지면 명단이 아닙니다.')
                  : '✓ 명단 두 줄이 목각 옷을 입었고, 폰에서 이름이 안 사라지고, 셋이 안 사라졌습니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
