/* ══════════════════════════════════════════════════════════════════
   check-bband.js — <b>아래 띠가 엄지에 닿고, 어디 있는지 말해 주는가.</b>

   사장님 말씀 — 「아래 <b>다섯 갈래 띠</b>」(모형 docs/토스판_사본.html
   593줄 NAV · 66~71줄 .tabbar).

   ── ⚠ 2026-09-25 · <b>다섯 칸이 바뀌었습니다</b> ──────────────────
   처음에는 <b>매일 누르는 것</b>으로 정하셨습니다 — 오늘·고객·DB·달력·도구.
   그 뒤 사장님 말씀 — 「<b>목업대로 바꾸고 달력은 유지해</b> 매월 매주
   스케줄 볼 수 있게 매주를 기본으로 해서 이번 주에 집중하게 하고」.
   목업은 오늘·고객·도구·<b>콘텐츠</b>·<b>나</b> 인데, 「나」 는 앱에 그대로
   맞는 화면이 없어 <b>그 자리에 달력</b>을 넣었습니다:
     🏠 오늘 · 📇 고객 · 🧰 도구 · 📰 콘텐츠 · 📅 달력
   ★ 빠진 <b>DB(crm)</b> 는 「고객」 칸이 켜 주고, 서랍과 「📦 여기로
     옮겼습니다」 줄에서 열립니다 — 아래에서 그것까지 확인합니다.
   ★ 칸 이름을 <b>여기 손으로 적지 않습니다</b> — 앱의 TB 표에서 읽습니다.
     적어 두면 칸을 바꿀 때마다 이 줄이 낡아 헛것이 됩니다 (8번).

   ── 이 자리에서 실제로 났던 두 가지 ──────────────────────────────
   ① <b>띠가 「지금 어디」 를 말하지 못했습니다.</b> 제 칸 다섯만 알아서,
      화면 96개 중 <b>91개</b>에서는 아무 칸도 안 켜졌습니다. 띠를 보고도
      내가 어디 있는지 알 수 없으면 띠가 아닙니다.
      고친 방법은 <b>새로 세지 않는 것</b>이었습니다 — 「이 화면이 어느
      갈래인가」 를 아는 표(NAV_WHEN, 96칸)가 이미 있었고, 그것을 그대로
      봅니다. 여기서 또 세면 화면을 늘릴 때 한쪽만 늙습니다 (5번).
   ② <b>641~1100px 에 길이 아예 없었습니다.</b> 띠는 640px 아래에서만
      섰고, 왼쪽 기둥은 1100px 아래에서 서랍으로 숨습니다. 그 사이
      (태블릿 · 폴더블 편 것 · 창을 반만 연 노트북)에는 맨 왼쪽 위 ☰
      하나뿐이었습니다 — 애초에 이 띠를 만든 까닭이 그 폭에 그대로
      살아 있었던 것입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] <b>어느 폭에서도 길이 꼭 하나</b> — 1101px 위는 기둥, 아래는 띠
     [2] <b>다섯 칸</b>이 서고, 눌리고, 44px 아래가 없다
     [3] <b>96개 화면 전부</b>에서 한 칸이 켜진다 — 그리고 꼭 하나만
     [4] 띠가 <b>글을 안 덮는다</b> (넓은 폭에서도)
     [5] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8953;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  if (p.indexOf('/.netlify/functions/push') === 0) {
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

/* 견본은 <b>홍길동</b> — 실제 고객 이름은 안 씁니다 (3번) */
const SEED = `
 document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x=>x.remove());
 OS.session={user:{id:'me'}};
 OS.profile={id:'me',name:'홍길동',role:'master',active:true,plan:'vip',team_id:'t1'};
 window.osLoadProfile=function(){};window.osProfileApply=function(){};window.osShowLoginGate=function(){};
 window.arLoad=function(){};window.osLoadClients=function(){};window.cmLoadAll=function(cb){if(cb)cb();};
 OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];
 AR.loaded=true;AR.busy='';AR.err='';AR.db=[];AR.cliRows=[];
 try{localStorage.setItem('apex_guide_seen_v2','1');}catch(e){}
`;

const open = async (b, w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  await p.evaluate(SEED);
  await p.evaluate(() => { try { go('home'); } catch (e) {} });
  await p.waitForTimeout(500);
  return { ctx, p, errs };
};
/* 띠가 섰는가 · 기둥이 섰는가 — <b>한 번에</b> 본다. 둘 다 없거나 둘 다
   있으면 그 폭이 잘못된 것이다. */
const look = (p) => p.evaluate(() => {
  const bar = document.getElementById('tabBar');
  const sb = document.getElementById('sidebar');
  const barOn = !!bar && getComputedStyle(bar).display !== 'none';
  /* 기둥으로 서 있나 — 서랍으로 숨은 것(transform 으로 화면 밖)은 기둥이 아니다 */
  const sbCss = sb ? getComputedStyle(sb) : null;
  const pillar = !!sbCss && sbCss.display !== 'none' && sbCss.position !== 'fixed'
                 && sb.getBoundingClientRect().width > 0;
  return {
    bar: barOn, pillar: pillar,
    h: bar ? Math.round(bar.getBoundingClientRect().height) : 0,
    pad: parseInt(getComputedStyle(document.getElementById('main')).paddingBottom, 10) || 0,
    n: bar ? bar.querySelectorAll('.tb-b').length : 0,
    labels: bar ? [].slice.call(bar.querySelectorAll('.tb-b')).map(e => e.textContent.replace(/\s+/g, ' ').trim()) : [],
    small: bar ? [].slice.call(bar.querySelectorAll('.tb-b')).filter(e => e.getBoundingClientRect().height < 44).length : 0
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();

  console.log('\n[1] 어느 폭에서도 <b>길이 꼭 하나</b> — 1101px 위는 기둥, 아래는 띠');
  /* 390 폰 · 820 태블릿 · 1100 창을 반만 연 노트북 · 1280 넓은 화면 */
  const W = {};
  for (const w of [390, 820, 1100, 1280]) {
    const o = await open(b, w, 900);
    W[w] = await look(o.p);
    W[w].errs = o.errs;
    await o.ctx.close();
  }
  [390, 820, 1100].forEach(w => {
    is(W[w].bar && !W[w].pillar,
       '  ' + w + 'px — <b>아래 띠가 선다</b> (기둥은 서랍으로 숨는다) · 높이 ' + W[w].h + 'px');
  });
  is(W[820].bar,
     '  ★ <b>820px 에 길이 생겼다</b> — 예전에는 띠도 기둥도 없이 맨 왼쪽 위 ☰ 하나뿐이었다');
  is(!W[1280].bar && W[1280].pillar,
     '  1280px — <b>기둥이 서고 띠는 안 선다</b> — 둘 다 세우면 같은 것이 두 곳이 된다 (5번)');

  console.log('\n[2] <b>다섯 칸</b>이 서고 · 눌리고 · 44px 아래가 없다');
  const A = await open(b, 390, 900);
  const T = await look(A.p);
  is(T.n === 5, '  칸이 <b>다섯</b>이다 — ' + T.labels.join(' | '));
  /* 이름은 <b>앱의 표(TB)</b> 에서 읽습니다 — 손으로 적으면 바꿀 때마다 낡습니다 */
  const TBT = await A.p.evaluate(() => TB.map(x => x.t));
  TBT.forEach(t => {
    is(T.labels.some(x => x.indexOf(t) >= 0), '  「' + t + '」 칸이 있다');
  });
  /* 목업 다섯 중 넷은 <b>글자 그대로</b> 같아야 합니다 (달력은 사장님이 남기신 것) */
  ['오늘', '고객', '도구', '콘텐츠'].forEach(t => {
    is(TBT.indexOf(t) >= 0, '  목업의 「' + t + '」 가 그대로 있다');
  });
  is(TBT.indexOf('달력') >= 0, '  <b>달력은 남겼다</b> — 사장님이 「달력은 유지해」 하셨다');
  is(T.small === 0, '  칸도 <b>44px 아래가 없다</b>' + (T.small ? (' ← ' + T.small + '개') : ''));
  /* 네 칸은 <b>그 화면으로</b> 가고, 도구는 <b>원래 있던 서랍</b>을 연다 */
  const went = await A.p.evaluate(async () => {
    const bar = document.getElementById('tabBar');
    const by = t => [].slice.call(bar.querySelectorAll('.tb-b')).filter(e => e.textContent.indexOf(t) >= 0)[0];
    const out = {};
    for (const [t, want] of [['고객', 'clients'], ['콘텐츠', 'news_live'], ['달력', 'mycal'], ['오늘', 'home']]) {
      const el = by(t); if (!el) { out[t] = '(칸 없음)'; continue; }
      el.click(); await new Promise(r => setTimeout(r, 600));
      out[t] = lastTab + (lastTab === want ? '' : ' ← ' + want + ' 이어야 함');
    }
    /* ⚠ 2026-09-26 · 이 칸은 <b>서랍을 여는 단추</b>였습니다. 목업의 「도구」 는
       <b>밝은 화면</b>이라 화면으로 바뀌었고, 그래서 재는 법도 여기서 옮깁니다.
       ★ <b>뜻은 그대로</b>입니다 — 원래 지키려던 「새 메뉴를 또 만들지
         않았다(5번)」 는 check-toolspage 가 소스에서 잽니다. 여기서는 띠 자답게
         <b>그 칸이 무엇을 여나</b>를 재되, 예전보다 <b>하나 더</b> 봅니다 —
         화면이 서고, ★ <b>서랍 길도 그대로 살아 있나</b>. 길이 없어지면
         지운 것과 같습니다 (1번).                                        */
    const d = by('도구');
    if (d) {
      d.click(); await new Promise(r => setTimeout(r, 700));
      out.tools = lastTab;
      const more = document.querySelector('#dynPane .tlp-more');
      out.moreBtn = !!more;
      if (more) { more.click(); await new Promise(r => setTimeout(r, 400));
                  out.drawer = document.getElementById('sidebar').classList.contains('open');
                  try { toggleNav(); } catch (e) {} }
    }
    try { go('home'); } catch (e) {}
    return out;
  });
  ['오늘', '고객', '콘텐츠', '달력'].forEach(t => {
    is((went[t] || '').indexOf('←') < 0, '  「' + t + '」 를 누르면 <b>그 화면으로</b> 간다 — ' + went[t]);
  });
  is(went.tools === 'tools',
     '  「도구」 를 누르면 <b>도구 화면</b>이 선다 — ' + (went.tools || '(안 갔습니다)'));
  is(went.moreBtn === true && went.drawer === true,
     '  ★ 그 화면에서 <b>서랍도 그대로 열린다</b> — 길을 지우지 않았다 (1번)' +
     (went.moreBtn ? '' : ' ← ☰ 메뉴 전체 단추가 없습니다') +
     ((went.moreBtn && went.drawer !== true) ? ' ← 눌러도 서랍이 안 열립니다' : ''));

  console.log('\n[3] <b>96개 화면 전부</b>에서 한 칸이 켜진다 — 그리고 꼭 하나만');
  const L = await A.p.evaluate(() => {
    const ids = [];
    TABS.forEach(g => g.items.forEach(it => { if (ids.indexOf(it.id) < 0) ids.push(it.id); }));
    const dark = ids.filter(id => !tbOnOf(id));
    /* 켜지는 칸이 <b>둘</b>이면 어디 있는지 되레 헷갈린다 */
    const twin = ids.filter(id => {
      const k = tbOnOf(id);
      return TB.filter(x => x.id === k).length !== 1;
    });
    /* 칸마다 <b>제 화면</b>을 켜는가 — pin 이 갈래보다 먼저여야 한다 */
    const own = { home: 'home', clients: 'clients', fact_find: 'clients',
                  crm: 'clients', mycal: 'mycal', airep: 'home',
                  news_live: 'news_live', blog: 'news_live',
    /* ⚠ 2026-09-26 · 이 칸의 id 가 <b>__more → tools</b> 로 바뀌었습니다.
       서랍을 여는 단추가 <b>화면</b>이 되면서 이름도 따라 바뀐 것이고,
       <b>켜지는 칸은 그대로 🧰 도구</b>입니다 — pdel·org 를 실제로 열어
       확인했습니다. 화면이 달라진 것이 아니라 <b>이름이 바뀐 것</b>입니다. */
                  settings: 'tools', finance: 'tools', pdel: 'tools', org: 'tools' };
    const wrong = Object.keys(own).filter(k => tbOnOf(k) !== own[k])
                        .map(k => k + '→' + (tbOnOf(k) || '(없음)') + '(' + own[k] + ' 이어야)');
    return { n: ids.length, dark: dark, twin: twin, wrong: wrong };
  });
  is(L.dark.length === 0,
     '  <b>어두운 화면이 없다</b> — ' + L.n + '개 중 ' + L.dark.length + '개' +
     (L.dark.length ? (' ← ' + L.dark.slice(0, 8).join(' ')) : ''));
  is(L.twin.length === 0,
     '  켜지는 칸이 <b>꼭 하나</b>다' + (L.twin.length ? (' ← ' + L.twin.slice(0, 6).join(' ')) : ''));
  is(L.wrong.length === 0,
     '  <b>제 칸이 있는 화면은 제 칸</b>이 켜진다 (고객 · 콘텐츠 · 달력)' +
     (L.wrong.length ? (' ← ' + L.wrong.join(' · ')) : ''));
  /* 실제로 열어 보고도 켜지는가 — 함수만 맞고 화면이 안 따라가면 소용없다 */
  const live = await A.p.evaluate(async () => {
    const out = [];
    for (const t of ['crm', 'mycal', 'blog', 'settings', 'home']) {
      go(t); await new Promise(r => setTimeout(r, 500));
      const on = [].slice.call(document.querySelectorAll('#tabBar .tb-b.on'))
                   .map(e => e.textContent.replace(/\s+/g, ' ').trim());
      out.push(t + ':' + (on.join(',') || '(없음)'));
    }
    return out;
  });
  is(live.join(' ').indexOf('(없음)') < 0, '  <b>실제로 열어도</b> 그 칸이 켜진다 — ' + live.join(' · '));
  /* ── <b>쌍둥이가 아닌가</b> (5번) ─────────────────────────────────
     갈래를 여기서 또 세면, 화면을 늘릴 때 서랍과 띠가 갈라진다.        */
  const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  is((SRC.match(/function tbOnOf\(/g) || []).length === 1 && /NAV_WHEN\[tab\]/.test(SRC),
     '  갈래를 <b>NAV_WHEN 에서 가져온다</b> — 띠가 제 갈래표를 따로 만들지 않았다 (5번)');
  is((SRC.match(/var NAV_WHEN=\{/g) || []).length === 1,
     '  갈래표가 <b>한 벌</b>이다 (5번)');

  console.log('\n[4] 띠가 <b>글을 안 덮는다</b>');
  [390, 820, 1100].forEach(w => {
    is(W[w].pad >= W[w].h,
       '  ' + w + 'px — 바닥 여백 ' + W[w].pad + 'px / 띠 ' + W[w].h + 'px');
  });
  is(W[1280].pad === 0, '  1280px — 띠가 없으니 <b>바닥 여백도 안 준다</b> — ' + W[1280].pad + 'px');

  console.log('\n[5] 조용히 터지지 않았나');
  /* 바깥으로 나가는 것은 <b>우리가 막았습니다</b>(ctx.route). 그때 나는
     「Failed to load resource」 는 앱 잘못이 아니라 <b>점검이 만든 소리</b>라
     뺍니다 — 안 빼면 늘 빨간불이라 아무도 안 믿게 됩니다 (8번). */
  const allErr = [390, 820, 1100, 1280].reduce((a, w) => a.concat(W[w].errs), []).concat(A.errs)
    .filter(x => !/favicon|net::ERR|Failed to load resource/i.test(x));
  is(allErr.length === 0, '  콘솔 오류 없음' + (allErr.length ? (' ← ' + allErr[0]) : ''));

  await A.ctx.close(); await b.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 아래 띠 — 엄지에 닿고, 어디 있는지 말해 줍니다.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
