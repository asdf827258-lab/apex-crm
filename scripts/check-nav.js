/* 메뉴 — 하루 동선대로 열두 칸, 접어 두고 눌러서 편다.

   화면이 예순 개가 넘는다. 다 펼쳐 두면 스크롤만 한참 내리다 길을 잃는다.
   그래서 카테고리로 크게 묶어 평소엔 접어 두기로 했다.

   접는 것도, 다시 묶는 것도 위험한 변경이다. 잘못하면 화면이 아예 안
   보이거나 — 더 나쁘게는 — 요금제 문이 조용히 따라 움직인다.
   그래서 여기서 직접 눌러 보고 확인한다.

     · 칸이 다 나오는가, 메뉴가 한 개도 안 빠졌는가
     · 메뉴마다 원래 구분(ak)을 달고 다니는가 — 이게 없으면 유료 문이 움직인다
     · 접힌 칸의 메뉴는 정말 안 보이는가
     · 눌러서 펴면 보이는가, 다시 누르면 접히는가
     · 새로고침해도 펴 둔 칸이 그대로인가
     · 위에서 아래로 색이 한 줄기로 옅어지는가, 글씨가 배경에 안 묻는가
     · 접힌 칸 안에 있는 화면으로 건너뛰면 그 칸이 자동으로 펴지는가
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
const VIS_H = `(function(b){
  var box=b.parentElement.getBoundingClientRect(), r=b.getBoundingClientRect();
  return Math.max(0, Math.min(r.bottom,box.bottom)-Math.max(r.top,box.top));
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

  const booted = await page.evaluate(() => typeof renderNav === 'function' && typeof navToggle === 'function');
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
      want: want.map(function (g) { return { name: g.group, n: g.items.length }; }),
      got: got.map(function (el) {
        var t = el.querySelector('.ngl-t'), n = el.querySelector('.ngl-n'), ic = el.querySelector('.ngl-ic');
        return {
          name: t ? t.textContent : '',
          badge: n ? n.textContent : '',
          icon: ic ? ic.textContent : '',
          tint: el.style.getPropertyValue('--gc'),
          items: el.querySelectorAll('.tab-btn').length,
          collapsed: el.classList.contains('collapsed')
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

  /* 메뉴가 하나도 빠지지 않았는가 — 접는 과정에서 통째로 날아가는 것이 가장 무섭다 */
  const lost = await page.evaluate(() => {
    var want = (typeof visibleTabs === 'function' ? visibleTabs() : TABS).filter(function (g) { return !g.hide; });
    var ids = {}, miss = [];
    [].slice.call(document.querySelectorAll('#navHost .tab-btn')).forEach(function (b) { ids[b.getAttribute('data-tab')] = 1; });
    want.forEach(function (g) { g.items.forEach(function (it) { if (!ids[it.id]) miss.push(g.group + '/' + it.id); }); });
    return miss;
  });
  is(lost.length === 0, '메뉴가 한 개도 안 빠졌다' + (lost.length ? ' — 빠진 것: ' + lost.slice(0, 6).join(', ') : ''));

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
       펼쳐 둔 칸은 일부러 한 톤 더 진하니 흐름 판정에서 뺀다. */
    var depth = [];
    [].slice.call(document.querySelectorAll('#navHost .nav-group')).forEach(function (g) {
      if (!g.classList.contains('collapsed')) return;
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

  /* ── 3) 접힌 칸은 정말 안 보이는가 ── */
  console.log('\n[3] 접고 펴기');
  const shut = groups.got.filter(g => g.collapsed).length;
  is(shut >= groups.got.length - 1, '평소엔 접혀 있다 (' + shut + '/' + groups.got.length + '칸)');

  const target = groups.got.find(g => g.collapsed);
  const hiddenH = await page.evaluate(new Function('name', `
    var visH=${VIS_H};
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    for (var i = 0; i < els.length; i++) {
      var t = els[i].querySelector('.ngl-t');
      if (t && t.textContent === name) {
        var box = els[i].querySelector('.nav-group-items');
        var b = els[i].querySelector('.tab-btn');
        return { h: box ? box.getBoundingClientRect().height : -1, btnH: b ? visH(b) : -1 };
      }
    }
    return { h: -1, btnH: -1 };
  `), target ? target.name : '');
  is(hiddenH.h === 0, '접힌 칸의 메뉴는 높이가 0 이다 (' + hiddenH.h + 'px)');
  is(hiddenH.btnH === 0, '접힌 칸의 메뉴 버튼은 눈에 안 보인다');

  /* 눌러서 편다 — 진짜 클릭으로 */
  await page.evaluate(name => {
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    for (var i = 0; i < els.length; i++) {
      var t = els[i].querySelector('.ngl-t');
      if (t && t.textContent === name) { els[i].querySelector('.nav-group-label').click(); return; }
    }
  }, target ? target.name : '');
  await page.waitForTimeout(450);
  const openedH = await page.evaluate(name => {
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    for (var i = 0; i < els.length; i++) {
      var t = els[i].querySelector('.ngl-t');
      if (t && t.textContent === name) {
        var box = els[i].querySelector('.nav-group-items');
        return { h: box ? box.getBoundingClientRect().height : -1, cls: els[i].classList.contains('collapsed') };
      }
    }
    return { h: -1, cls: true };
  }, target ? target.name : '');
  is(openedH.h > 20, '눌렀더니 「' + (target ? target.name : '') + '」 칸이 펼쳐졌다 (' + Math.round(openedH.h) + 'px)');
  is(openedH.cls === false, '펼친 칸에는 접힘 표시가 없다');

  /* 새로고침해도 그대로인가 */
  await boot(page);
  const kept = await page.evaluate(name => {
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    for (var i = 0; i < els.length; i++) {
      var t = els[i].querySelector('.ngl-t');
      if (t && t.textContent === name) return !els[i].classList.contains('collapsed');
    }
    return false;
  }, target ? target.name : '');
  is(kept === true, '새로고침해도 펴 둔 칸이 그대로다');

  /* 다시 눌러 접는다 */
  await page.evaluate(name => {
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    for (var i = 0; i < els.length; i++) {
      var t = els[i].querySelector('.ngl-t');
      if (t && t.textContent === name) { els[i].querySelector('.nav-group-label').click(); return; }
    }
  }, target ? target.name : '');
  await page.waitForTimeout(400);
  const reshut = await page.evaluate(name => {
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    for (var i = 0; i < els.length; i++) {
      var t = els[i].querySelector('.ngl-t');
      if (t && t.textContent === name) return els[i].classList.contains('collapsed');
    }
    return false;
  }, target ? target.name : '');
  is(reshut === true, '다시 누르면 접힌다');

  /* ── 4) 모두 펴기 · 모두 접기 ── */
  console.log('\n[4] 모두 펴기 · 모두 접기');
  const allBtns = await page.evaluate(() => document.querySelectorAll('#navHost .nav-allbtns button').length);
  is(allBtns === 2, '「모두 펴기」「모두 접기」 두 개가 있다');
  await page.evaluate(() => navAllSet(true));
  await page.waitForTimeout(420);
  const allOpen = await page.evaluate(() => {
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    return { n: els.length, shut: els.filter(function (e) { return e.classList.contains('collapsed'); }).length,
      seen: [].slice.call(document.querySelectorAll('#navHost .tab-btn')).filter(function (b) { return b.getBoundingClientRect().height > 0; }).length };
  });
  is(allOpen.shut === 0, '모두 펴기 — 접힌 칸이 없다');
  is(allOpen.seen >= 60, '모두 펴기 — 메뉴가 다 보인다 (' + allOpen.seen + '개)');

  await page.evaluate(() => navAllSet(false));
  await page.waitForTimeout(420);
  const allShut = await page.evaluate(new Function(`
    var visH=${VIS_H};
    var els = [].slice.call(document.querySelectorAll('#navHost .nav-group'));
    return { shut: els.filter(function (e) { return e.classList.contains('collapsed'); }).length, n: els.length,
      seen: [].slice.call(document.querySelectorAll('#navHost .tab-btn')).filter(function (b) { return visH(b) > 0; }).length };
  `));
  is(allShut.shut === allShut.n, '모두 접기 — 다 접혔다 (' + allShut.shut + '/' + allShut.n + ')');
  is(allShut.seen === 0, '모두 접기 — 메뉴가 하나도 안 보인다');
  /* 접어도 카테고리 자체는 남아 있어야 길을 잃지 않는다 */
  const stillThere = await page.evaluate(() =>
    [].slice.call(document.querySelectorAll('#navHost .nav-group-label')).filter(function (e) { return e.getBoundingClientRect().height > 0; }).length);
  is(stillThere === allShut.n, '접어도 카테고리 이름은 다 보인다 (' + stillThere + '칸)');

  /* ── 5) 접힌 칸 안으로 건너뛰면 ── */
  console.log('\n[5] 접힌 칸 안의 화면으로 건너뛸 때');
  const jump = await page.evaluate(() => {
    go('bojang');
    var b = document.querySelector('#navHost .tab-btn[data-tab="bojang"]');
    var g = b ? b.parentElement : null;
    while (g && !(g.classList && g.classList.contains('nav-group'))) g = g.parentElement;
    return {
      marked: !!(b && b.classList.contains('on')),
      opened: !!(g && !g.classList.contains('collapsed')),
      group: g ? (g.querySelector('.ngl-t') || {}).textContent : ''
    };
  });
  await page.waitForTimeout(350);
  is(jump.marked === true, 'go(\'bojang\') 하면 그 메뉴에 눌린 표시가 붙는다');
  is(jump.opened === true, '그 메뉴가 든 「' + jump.group + '」 칸이 자동으로 펴진다');
  const seenNow = await page.evaluate(() => {
    var b = document.querySelector('#navHost .tab-btn[data-tab="bojang"]');
    return b ? b.getBoundingClientRect().height : 0;
  });
  is(seenNow > 10, '펴진 뒤 그 메뉴가 눈에 보인다 (' + Math.round(seenNow) + 'px)');

  /* 눌린 표시는 하나뿐이어야 한다 */
  const onCount = await page.evaluate(() => document.querySelectorAll('#navHost .tab-btn.on').length);
  is(onCount === 1, '눌린 표시는 한 개뿐이다 (' + onCount + '개)');

  /* ── 6) 눌러서 화면이 실제로 바뀌는가 ── */
  console.log('\n[6] 눌러서 화면이 바뀌는가');
  await page.evaluate(() => navAllSet(true));
  await page.waitForTimeout(400);
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

  const hard = errs.filter(m => !/ResizeObserver|Failed to fetch|NetworkError/i.test(m));
  is(hard.length === 0, '중간에 터진 곳이 없다' + (hard.length ? ' — ' + hard[0].slice(0, 90) : ''));

  console.log('\n──────────────────────────────');
  console.log(fail === 0
    ? '메뉴 점검 통과 — ' + pass + '가지 다 맞습니다.'
    : '메뉴 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
  await browser.close(); srv.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('✗ 점검 자체가 터졌습니다: ' + e.message); srv.close(); process.exit(1); });
