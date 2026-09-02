/* 메뉴 — 하루 동선대로 묶고, <b>늘 펴 둔다.</b>

   화면이 예순 개가 넘어서 예전에는 카테고리로 묶어 <b>평소엔 접어</b> 뒀다.
   그런데 접힌 칸은 <b>없어진 것처럼</b> 보인다 — 「메뉴가 안 보인다」 는 말이
   여기서 나왔다. 접혀 있는 줄 모르면 아무리 찾아도 못 찾는다.
   그래서 접기를 <b>통째로</b> 걷어냈다.

   메뉴를 건드리는 것은 위험하다. 잘못하면 화면이 아예 안 보이거나 —
   더 나쁘게는 — 요금제 문이 조용히 따라 움직인다. 그래서 여기서 직접
   눌러 보고 확인한다.

     · 칸이 다 나오는가, 메뉴가 한 개도 안 빠졌는가
     · 메뉴마다 원래 구분(ak)을 달고 다니는가 — 이게 없으면 유료 문이 움직인다
     · <b>모든 칸이 펴져 있는가</b> — 안 보이는 메뉴 단추가 하나도 없는가
     · 접는 장치가 <b>코드에도</b> 안 남아 있는가 (죽은 판이 돌면 안 된다 · 5번)
     · 칸 이름이 <b>눌러도 되는 것처럼</b> 안 보이는가 (단추가 아니라 이름표)
     · 위에서 아래로 색이 한 줄기로 옅어지는가, 글씨가 배경에 안 묻는가
     · 다른 데서 건너뛴 화면도 메뉴에서 바로 보이는가
     · 좁은 화면에서 이름이 안 잘리고 옆으로 안 밀리는가                 */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8829;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={
   select:function(){return a},eq:function(){return a},gte:function(){return a},lte:function(){return a},
   is:function(){return a},neq:function(){return a},in:function(){return a},not:function(){return a},
   order:function(){return a},limit:function(){return a},single:function(){return a},range:function(){return a},
   insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{
   getSession:function(){return Promise.resolve({data:{session:{user:{id:'nav',email:'nav@test'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'nav'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

/* overflow:hidden 으로 잘린 것은 자기 키를 그대로 말한다.
   그래서 "눈에 보이는 만큼" 은 감싼 칸과 겹치는 높이로 잰다. */
/* 눈에 실제로 보이는 높이.
   예전에는 「바로 위 부모」 와 견줬다. 메뉴 한 줄이 별표를 달면서
   .nav-row 로 한 겹 깊어지자, 바로 위 부모는 잘라 내는 쪽이 아니게 됐고
   접혀 있어도 「보인다」 고 답했다. 잘라 내는 조상(overflow)을 찾아 견준다. */
const VIS_H = `(function(b){
  var box=b.parentElement, n=b.parentElement;
  while(n && n!==document.body){
    var ov=getComputedStyle(n).overflow;
    if(ov==='hidden'||ov==='auto'||ov==='scroll'){box=n;break;}
    n=n.parentElement;
  }
  var bb=box.getBoundingClientRect(), r=b.getBoundingClientRect();
  return Math.max(0, Math.min(r.bottom,bb.bottom)-Math.max(r.top,bb.top));
})`;

let pass = 0, fail = 0;
function ok(m) { pass++; console.log('  ✓ ' + m); }
function no(m) { fail++; console.log('  ✗ ' + m); }
function is(cond, m) { cond ? ok(m) : no(m); }

async function boot(page) {
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'nav', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'nav', email: 'nav@test' } };
    window.toast = function () {};
    renderNav();
  });
  await page.waitForTimeout(200);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**://**', route => {
    const u = route.request().url();
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(STUB);
  await boot(page);

  const booted = await page.evaluate(() => typeof renderNav === 'function' && typeof navMark === 'function');
  if (!booted) {
    console.log('✗ 앱이 뜨지 않았습니다.');
    errs.slice(0, 4).forEach(m => console.log('    ' + m));
    await browser.close(); srv.close(); process.exit(1);
  }

  /* ── 1) 칸이 다 나오는가 ── */
  console.log('\n[1] 카테고리가 다 나오는가');
  const groups = await page.evaluate(() => {
    var want = (typeof visibleTabs === 'function' ? visibleTabs() : TABS).filter(function (g) { return !g.hide; });
    var got = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    return {
      /* 눈에서 뺀(hide) 칸은 세지 않는다 — 일부러 안 보이게 한 것이다 */
      want: want.map(function (g) {
        return { name: g.group, n: g.items.filter(function (it) { return !it.hide; }).length };
      }),
      got: got.map(function (el) {
        var t = el.querySelector('.ngl-t'), n = el.querySelector('.ngl-n'), ic = el.querySelector('.ngl-ic');
        return {
          name: t ? t.textContent : '',
          badge: n ? n.textContent : '',
          icon: ic ? ic.textContent : '',
          tint: el.style.getPropertyValue('--gc'),
          items: el.querySelectorAll('.tab-btn').length,
          collapsed: el.classList.contains('collapsed')   /* 이제는 늘 false 여야 한다 */
        };
      })
    };
  });
  is(groups.got.length === groups.want.length,
    '카테고리 ' + groups.got.length + '칸 (기대 ' + groups.want.length + '칸)');
  const nameOk = groups.want.every((w, i) => groups.got[i] && groups.got[i].name === w.name);
  is(nameOk, '칸 이름과 순서가 그대로다');
  if (!nameOk) console.log('    나온 것: ' + groups.got.map(g => g.name).join(' / '));
  is(groups.want.every((w, i) => groups.got[i] && groups.got[i].items === w.n),
    '칸마다 메뉴 개수가 맞는다');
  is(groups.got.every(g => g.badge && +g.badge > 0), '칸마다 개수 표시가 붙는다');
  is(groups.got.every(g => g.icon && g.icon !== '•'), '칸마다 그림 표시가 붙는다');

  /* 메뉴가 하나도 빠지지 않았는가 — 접는 과정에서 통째로 날아가는 것이 가장 무섭다.
     단, hide 를 단 칸은 <b>일부러</b> 눈에서 뺀 것이다. 그건 아래에서 따로 본다. */
  const lost = await page.evaluate(() => {
    var want = (typeof visibleTabs === 'function' ? visibleTabs() : TABS).filter(function (g) { return !g.hide; });
    var ids = {}, miss = [];
    [].slice.call(document.querySelectorAll('#navHost .tab-btn')).forEach(function (b) { ids[b.getAttribute('data-tab')] = 1; });
    want.forEach(function (g) {
      g.items.forEach(function (it) { if (!it.hide && !ids[it.id]) miss.push(g.group + '/' + it.id); });
    });
    return miss;
  });
  is(lost.length === 0, '눈에 보이기로 한 칸은 한 개도 안 빠졌다' + (lost.length ? ' — 빠진 것: ' + lost.slice(0, 6).join(', ') : ''));

  /* 눈에서 뺀 칸 — 지운 게 아니다. 찾기로 치면 나와야 한다.
     안 나오면 그건 숨긴 게 아니라 <b>없앤 것</b>이다. */
  const hid = await page.evaluate(() => {
    var all = (typeof visibleTabs === 'function' ? visibleTabs() : TABS).filter(function (g) { return !g.hide; });
    var want = [];
    all.forEach(function (g) { g.items.forEach(function (it) { if (it.hide) want.push(it); }); });
    NAV_Q = ''; renderNav();
    var shown = {};
    [].slice.call(document.querySelectorAll('#navHost .tab-btn')).forEach(function (b) { shown[b.getAttribute('data-tab')] = 1; });
    var stillSeen = want.filter(function (it) { return shown[it.id]; }).map(function (it) { return it.id; });
    var notFound = [];
    want.forEach(function (it) {
      NAV_Q = it.title; renderNav();
      var ok = !!document.querySelector('#navHost .tab-btn[data-tab="' + it.id + '"]');
      if (!ok) notFound.push(it.id);
    });
    NAV_Q = ''; renderNav();
    return { n: want.length, stillSeen: stillSeen, notFound: notFound };
  });
  /* 여섯이었는데 AI 조직 라이브를 아예 지워 다섯이 됐다.
     숫자를 못 박기보다 「감춘 칸이 있고, 찾으면 나온다」 를 본다. */
  is(hid.n >= 5, '눈에서 뺀 칸이 ' + hid.n + '개 있다');
  is(hid.stillSeen.length === 0, '평소 목록에는 안 보인다' + (hid.stillSeen.length ? ' — 아직 보임: ' + hid.stillSeen.join(', ') : ''));
  is(hid.notFound.length === 0, '이름으로 찾으면 나온다 — 지운 게 아니다' + (hid.notFound.length ? ' — 못 찾음: ' + hid.notFound.join(', ') : ''));

  /* 메뉴를 다른 칸으로 옮길 때 ak 를 안 달고 가면 요금제 문이 조용히 따라 움직인다.
     화면으로는 절대 안 보이는 사고라, 여기서 못을 박아 둔다. */
  const gate = await page.evaluate(() => {
    var known = {}, noAk = [], badAk = [], mixed = [];
    /* 문 열쇠로 쓸 수 있는 이름 = 등급표·직급표에 등록돼 있거나 무료(기본) */
    TABS.forEach(function (g) {
      (g.items || []).forEach(function (it) {
        if (!it.ak) { noAk.push(it.id); return; }
        if (!known[it.ak]) known[it.ak] = [];
        known[it.ak].push(it.id);
      });
    });
    /* 같은 열쇠를 단 것들은 등급 판정이 반드시 같아야 한다 */
    var k;
    for (k in known) {
      if (!known.hasOwnProperty(k)) continue;
      var t = null, i;
      for (i = 0; i < known[k].length; i++) {
        var cur = osNeedTierFor(known[k][i]);
        if (t === null) t = cur; else if (t !== cur) { mixed.push(k); break; }
      }
    }
    /* 설정 표가 그 열쇠들을 하나도 안 빠뜨리고 세우는가 */
    var rows = osAccessKeys().map(function (r) { return r.key; });
    for (k in known) if (known.hasOwnProperty(k) && rows.indexOf(k) < 0) badAk.push(k);
    return { noAk: noAk, badAk: badAk, mixed: mixed, keys: rows.length,
      items: rows.length ? Object.keys(known).length : 0 };
  });
  is(gate.noAk.length === 0,
    '메뉴마다 원래 구분(ak)이 붙어 있다' + (gate.noAk.length ? ' — 없는 것: ' + gate.noAk.slice(0, 6).join(', ') : ''));
  is(gate.mixed.length === 0,
    '같은 구분끼리는 등급 판정이 같다' + (gate.mixed.length ? ' — 어긋남: ' + gate.mixed.join(', ') : ''));
  is(gate.badAk.length === 0,
    '설정 표가 구분을 하나도 안 빠뜨린다 (' + gate.keys + '개)' + (gate.badAk.length ? ' — 빠짐: ' + gate.badAk.join(', ') : ''));

  /* ── 2) 색 ── */
  console.log('\n[2] 위에서 아래로 한 줄기로 흐르는가');
  const tints = groups.got.map(g => (g.tint || '').trim()).filter(Boolean);
  is(tints.length === groups.got.length, '칸마다 색이 들어 있다 (--gc)');
  is(new Set(tints).size === tints.length, groups.got.length + '칸이 다 다른 색이다 (' + new Set(tints).size + '가지)');

  const paint = await page.evaluate(() => {
    var out = [], els = [].slice.call(document.querySelectorAll('#navHost .nav-group-label'));
    els.forEach(function (el) {
      var s = getComputedStyle(el);
      out.push({ bg: s.backgroundColor, fg: s.color, size: parseFloat(s.fontSize), w: s.fontWeight });
    });
    return out;
  });
  is(paint.length > 0 && paint.every(p => p.size >= 13),
    '카테고리 글씨가 커졌다 (' + (paint[0] ? paint[0].size : 0) + 'px)');
  is(paint.every(p => +p.w >= 700), '카테고리 글씨가 굵다');
  is(new Set(paint.map(p => p.bg)).size >= paint.length - 1,
    '배경색이 칸마다 다르다 (' + new Set(paint.map(p => p.bg)).size + '가지)');
  is(new Set(paint.map(p => p.fg)).size >= paint.length - 1,
    '글씨색이 칸마다 다르다 (' + new Set(paint.map(p => p.fg)).size + '가지)');
  /* 투명한 배경이면 파스텔을 입힌 것이 아니다 */
  is(paint.every(p => p.bg && p.bg !== 'rgba(0, 0, 0, 0)' && p.bg !== 'transparent'),
    '배경이 실제로 칠해져 있다');

  /* 색을 입히다 글씨가 배경에 묻으면 가독성을 올린 것이 아니라 내린 것이다.
     눈으로는 알기 어려우니 명암비를 직접 재서 못을 박아 둔다 (WCAG AA 4.5). */
  const contrast = await page.evaluate(() => {
    function px(v) { var m = (v || '').match(/[\d.]+/g) || []; return [+m[0] || 0, +m[1] || 0, +m[2] || 0, m.length > 3 ? +m[3] : 1]; }
    function over(f, b) { var a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; }
    function lum(c) { var r = [0, 1, 2].map(function (i) { var v = c[i] / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
      return .2126 * r[0] + .7152 * r[1] + .0722 * r[2]; }
    function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
    var page = px(getComputedStyle(document.querySelector('.sidebar')).backgroundColor);
    var worstT = 99, worstB = 99, worstName = '', tints = [];
    [].slice.call(document.querySelectorAll('#navHost .nav-group')).forEach(function (g) {
      var lab = g.querySelector('.nav-group-label'), s = getComputedStyle(lab);
      var bg = over(px(s.backgroundColor), page), fg = over(px(s.color), bg);
      var t = ratio(fg, bg);
      if (t < worstT) { worstT = t; worstName = (g.querySelector('.ngl-t') || {}).textContent; }
      var chip = g.querySelector('.ngl-n');
      if (chip) { var cs = getComputedStyle(chip), cbg = over(px(cs.backgroundColor), bg);
        worstB = Math.min(worstB, ratio(over(px(cs.color), cbg), cbg)); }
      tints.push(ratio(bg, page));
    });
    /* 「아래에서 위로 갈수록 진해진다」 — 눈이 아니라 숫자로 확인한다.
       이제 칸은 다 같은 상태(늘 펴짐)라 전부 견줄 수 있다. */
    var depth = [];
    [].slice.call(document.querySelectorAll('#navHost .nav-group')).forEach(function (g) {
      depth.push(lum(over(px(getComputedStyle(g.querySelector('.nav-group-label')).backgroundColor), page)));
    });
    var back = 0, i;
    for (i = 1; i < depth.length; i++) if (depth[i] > depth[i - 1] + 0.0002) back++;
    return { t: +worstT.toFixed(2), badge: +worstB.toFixed(2), name: worstName,
      tintMin: +Math.min.apply(null, tints).toFixed(3),
      back: back, span: depth.length ? +(depth[0] / depth[depth.length - 1]).toFixed(2) : 0,
      steps: depth.length };
  });
  is(contrast.t >= 4.5, '가장 흐린 칸도 글씨가 읽힌다 — 「' + contrast.name + '」 명암비 ' + contrast.t + ' (4.5 이상)');
  is(contrast.badge >= 3, '개수 표시도 읽힌다 (명암비 ' + contrast.badge + ')');
  is(contrast.tintMin >= 1.15, '배경이 사이드바와 구분된다 (차이 ' + contrast.tintMin + ')');
  is(contrast.back === 0,
    '아래로 갈수록 옅어진다 — 거꾸로 간 칸 ' + contrast.back + '개 / ' + contrast.steps + '칸');
  is(contrast.span >= 1.8,
    '맨 위와 맨 아래가 뚜렷이 다르다 (' + contrast.span + '배)');

  /* ── 3) 왼쪽 메뉴는 <b>늘 펴져 있다</b> ────────────────────────────
     예전에는 칸 이름을 눌러 접었다 폈다 했다. 그런데 접힌 칸은 <b>없어진
     것처럼</b> 보인다 — 「메뉴가 안 보인다」 는 말이 여기서 나왔다.
     그래서 접기를 통째로 걷어냈다. 여기서 재는 것은 <b>결과</b>다:
     「지금 이 순간, 메뉴 단추가 눈에 보이는가」. 어떻게 만들든 이 질문에
     답하면 된다 (CLAUDE.md 8번). */
  console.log('\n[3] 왼쪽 메뉴가 늘 펴져 있다 — 접히지 않는다');
  const alwaysOpen = await page.evaluate(new Function(`
    var visH=${VIS_H};
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    var shortest = 1e9, shortName = '', hidden = 0;
    els.forEach(function (g) {
      var box = g.querySelector('.nav-group-items');
      var h = box ? box.getBoundingClientRect().height : -1;
      if (h < shortest) { shortest = h; shortName = (g.querySelector('.ngl-t') || {}).textContent || ''; }
      [].slice.call(g.querySelectorAll('.tab-btn')).forEach(function (b) { if (visH(b) <= 0) hidden++; });
    });
    return { n: els.length, shortest: Math.round(shortest), shortName: shortName, hidden: hidden,
      seen: [].slice.call(document.querySelectorAll('#navHost .nav-group-items .tab-btn'))
              .filter(function (b) { return visH(b) > 0; }).length,
      /* 접는 장치가 <b>코드에도</b> 안 남아 있어야 한다 — 죽은 판이 돌면 안 된다 (5번) */
      hasToggle: typeof window.navToggle === 'function',
      hasAllSet: typeof window.navAllSet === 'function',
      hasReveal: typeof window.navReveal === 'function',
      allBtns: document.querySelectorAll('#navHost .nav-allbtns button').length,
      carets: document.querySelectorAll('#navHost .ngl-caret').length,
      collapsed: document.querySelectorAll('#navHost .nav-group.collapsed').length };
  `));
  is(alwaysOpen.collapsed === 0,
     '접힌 칸이 <b>하나도 없다</b> (' + alwaysOpen.collapsed + '/' + alwaysOpen.n + ')');
  is(alwaysOpen.shortest > 20,
     '가장 짧은 칸도 <b>속이 보인다</b> — 「' + alwaysOpen.shortName + '」 ' + alwaysOpen.shortest + 'px');
  is(alwaysOpen.hidden === 0,
     '눈에 안 보이는 메뉴 단추가 <b>없다</b>' + (alwaysOpen.hidden ? ' ← ' + alwaysOpen.hidden + '개' : ''));
  is(alwaysOpen.seen >= 60, '메뉴가 다 보인다 (' + alwaysOpen.seen + '개)');

  /* ── 4) 접는 장치가 <b>아예 없다</b> ── */
  console.log('\n[4] 접는 장치가 남아 있지 않다');
  is(alwaysOpen.allBtns === 0, '「모두 펴기 / 모두 접기」 단추가 <b>없다</b>');
  is(alwaysOpen.carets === 0, '접힘 화살표(▾)가 <b>없다</b>');
  const alive = [alwaysOpen.hasToggle && 'navToggle', alwaysOpen.hasAllSet && 'navAllSet',
                 alwaysOpen.hasReveal && 'navReveal'].filter(Boolean);
  is(alive.length === 0,
     '접기 함수(navToggle · navAllSet · navReveal)가 <b>안 남아 있다</b>' +
     (alive.length ? ' ← 아직 있습니다: ' + alive.join(', ') : ''));
  /* 칸 이름은 <b>눌러도 아무 일이 없는</b> 이름표다 — 눌러 보고 「고장 났나」 하시면 안 된다 */
  const labelKind = await page.evaluate(() => {
    var L = [].slice.call(document.querySelectorAll('#navHost .nav-group-label'));
    return { n: L.length, btn: L.filter(function (e) { return e.tagName === 'BUTTON'; }).length,
             ptr: L.filter(function (e) { return getComputedStyle(e).cursor === 'pointer'; }).length };
  });
  is(labelKind.btn === 0 && labelKind.ptr === 0,
     '칸 이름은 <b>이름표</b>다 — 누르는 것처럼 안 보인다 (단추 ' + labelKind.btn +
     '개 · 손가락 커서 ' + labelKind.ptr + '개)');
  is(labelKind.n >= 10, '카테고리 이름은 다 보인다 (' + labelKind.n + '칸)');

  /* ── 5) 어느 화면으로 건너뛰어도 그 메뉴가 바로 보인다 ── */
  console.log('\n[5] 다른 데서 건너뛴 화면도 메뉴에서 바로 보인다');
  const jump = await page.evaluate(new Function(`
    var visH=${VIS_H};
    go('bojang');
    var b = document.querySelector('#navHost .tab-btn[data-tab="bojang"]');
    var g = b ? b.parentElement : null;
    while (g && !(g.classList && g.classList.contains('nav-group'))) g = g.parentElement;
    return { marked: !!(b && b.classList.contains('on')), h: b ? visH(b) : 0,
             group: g ? ((g.querySelector('.ngl-t') || {}).textContent || '') : '' };
  `));
  await page.waitForTimeout(350);
  is(jump.marked === true, 'go(\'bojang\') 하면 그 메뉴에 눌린 표시가 붙는다');
  is(jump.h > 10,
     '그 메뉴가 <b>그냥 눈에 보인다</b> — 「' + jump.group + '」 칸 안 (' + Math.round(jump.h) + 'px)');

  /* 눌린 표시는 하나뿐이어야 한다 */
  const onCount = await page.evaluate(() => document.querySelectorAll('#navHost .tab-btn.on').length);
  is(onCount === 1, '눌린 표시는 한 개뿐이다 (' + onCount + '개)');

  /* ── 6) 눌러서 화면이 실제로 바뀌는가 ── */
  console.log('\n[6] 눌러서 화면이 바뀌는가');
  const clicked = await page.evaluate(() => {
    var b = document.querySelector('#navHost .tab-btn[data-tab="clients"]');
    if (!b) return { ok: false, why: '메뉴를 못 찾음' };
    b.click();
    return { ok: true, tab: (typeof lastTab !== 'undefined') ? lastTab : '' };
  });
  await page.waitForTimeout(400);
  is(clicked.ok && clicked.tab === 'clients', '메뉴를 누르면 그 화면으로 간다 (' + clicked.tab + ')');

  /* ── 7) 좁은 화면 ── */
  console.log('\n[7] 좁은 화면');
  await page.setViewportSize({ width: 430, height: 900 });
  await page.waitForTimeout(300);
  const narrow = await page.evaluate(() => {
    var host = document.getElementById('navHost');
    var over = [].slice.call(document.querySelectorAll('#navHost .nav-group-label'))
      .filter(function (e) { return e.scrollWidth > e.clientWidth + 2; }).length;
    return { over: over, sw: host ? host.scrollWidth : 0, cw: host ? host.clientWidth : 0 };
  });
  is(narrow.over === 0, '좁은 화면에서도 카테고리 이름이 안 잘린다');
  is(narrow.sw <= narrow.cw + 2, '메뉴가 옆으로 안 밀린다 (' + narrow.sw + ' / ' + narrow.cw + ')');

  /* ── [8] 눌러도 없는 화면으로 보내는 단추가 없는가 ──────────────────
     메뉴를 24칸에서 12칸으로 줄일 때 화면 이름이 바뀌었는데, 다른 화면에서
     옛 이름으로 부르던 곳이 안 따라왔다. 성장판의 「더 자세히」 다섯 단추 중
     셋(ckteam·teamx·growth)이 눌러도 아무 일이 없었다. 소리 없이 죽는 종류라
     아무도 신고하지 않는다. 여기서 전부 대조한다. */
  console.log('\n[8] 눌러도 없는 화면으로 보내는 단추');
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
  const called = {};
  const reGo = /go\(\\?'([a-z_0-9]{2,24})\\?'\)/g;
  let mg;
  while ((mg = reGo.exec(src))) called[mg[1]] = (called[mg[1]] || 0) + 1;

  const known = await page.evaluate(() => {
    const s = new Set();
    (window.TABS || []).forEach(g => (g.items || []).forEach(i => s.add(i.id)));
    return [...s];
  });
  const K = new Set(known);
  const dead = Object.keys(called).filter(id => !K.has(id)).sort();

  is(known.length > 60, '메뉴에 등록된 화면을 읽었다 (' + known.length + '개)');
  is(Object.keys(called).length > 20,
    '앱 안에서 go() 로 부르는 화면을 모았다 (' + Object.keys(called).length + '종류)');
  is(dead.length === 0, dead.length === 0
    ? '모든 단추가 실제로 있는 화면으로 간다'
    : '없는 화면으로 보내는 단추가 있다 — ' + dead.map(d => d + '(×' + called[d] + ')').join(', '));

  /* ── [9] 접어 둔 화면을 정말 열 수 있는가 ──────────────────────────
     메뉴를 열두 칸으로 줄이면서 화면 넷을 숨김 그룹으로 넣고, 다른 화면 안에
     「칸」으로 접어 넣었다 — 내 코칭과 본인 점검란은 TFA 업무관리(AR_CAT) 안에,
     실행 체크판은 조직 관리에 그대로 있다.

     접는 것 자체는 맞다. 다만 접어 놓고 그 칸까지 지우면 화면이 통째로
     사라진다. go() 로 부르는 곳이 없어도 「칸」으로 살아 있으면 되므로,
     두 가지를 다 인정하고 하나라도 남아 있는지만 본다. */
  console.log('\n[9] 숨겨 둔 화면을 정말 열 수 있는가');
  const hidden = await page.evaluate(() => {
    const out = [];
    (window.TABS || []).forEach(g => {
      if (!g.hide) return;
      (g.items || []).forEach(i => out.push(i.id));
    });
    return out;
  });
  const folded = await page.evaluate(() => ({
    ar: (window.AR_CAT || []).map(c => c[0]),
    th: (window.TH_CAT || []).map(c => c[0])
  }));
  /* 숨은 화면 id → 어느 칸으로 접혔는가 */
  const FOLD = { mycoach: 'coach', academy: 'acad', growboard: null, ckboard: null, voice: null };
  const stranded = hidden.filter(id => {
    if (called[id]) return false;                       /* 어디선가 go() 로 연다 */
    const k = FOLD[id];
    if (k && (folded.ar.indexOf(k) >= 0 || folded.th.indexOf(k) >= 0)) return false;  /* 칸으로 산다 */
    return true;
  });

  is(hidden.length > 0, '숨김 그룹에 있는 화면을 읽었다 (' + hidden.join(', ') + ')');
  is(folded.ar.length > 0, 'TFA 업무관리가 칸 목록을 들고 있다 (' + folded.ar.length + '칸)');
  is(folded.ar.indexOf('coach') >= 0, '「내 코칭」이 TFA 업무관리 안에 칸으로 있다');
  is(folded.ar.indexOf('acad') >= 0, '「본인 점검란」이 TFA 업무관리 안에 칸으로 있다');
  is(stranded.length === 0, stranded.length === 0
    ? '숨은 화면이 전부 어딘가에서 열린다 — go() 로든, 칸으로든'
    : '열 길이 없어진 화면이 있다 — ' + stranded.join(', '));

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 90) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '메뉴 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '메뉴 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
