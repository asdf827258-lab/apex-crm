/* ══════════════════════════════════════════════════════════════════
   check-navgrp.js — <b>메뉴 묶음을 접을 수 있는가. 접어도 없어 보이지 않는가.</b>

   사장님 말씀 — 「메인 메뉴 카테고리도 숨길수 있도록하고 다 펼쳐져있어서
   어지러워」. 폰(390×844)에서 재 보니 서랍이 <b>4,125px</b>, 화면 다섯 개
   였습니다. 열네 묶음이 전부 펴져 있어서입니다. 다 접으면 863px — 한 화면.

   ── 이 점검이 있는 진짜 이유 ─────────────────────────────────────
   접기는 <b>예전에 한 번 걷어냈던 장치</b>입니다. 그때 접힌 칸을 「없어진
   것」 으로 보셔서 <b>「메뉴가 안 보인다」</b> 는 말이 나왔습니다. 그래서
   여기서 보는 것은 「접히나」 가 아니라 <b>「접혀도 없어 보이지 않나」</b>
   입니다 — 그게 지난번에 깨진 자리이기 때문입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 묶음 이름을 누르면 <b>그 묶음만</b> 접힌다 · 다시 누르면 펴진다
     [2] 접혀도 <b>칸 수가 그대로 남는다</b> (「상담 도구 13」) —
         숫자가 보여야 「거기 열셋이 있다」 로 읽힌다
     [3] 접어 둔 것이 있으면 <b>글자로 적힌다</b> (「접어 둔 묶음 n개」) ·
         <b>「다 펴기」 단추</b>가 같이 선다 — 되돌아올 길이 늘 보인다
     [4] <b>찾는 중에는 언제나 다 펴진다</b> — 접혀 있어서 못 찾으면
         없는 것과 같다 (CLAUDE.md 1번)
     [5] <b>지금 열려 있는 화면이 든 묶음은 저절로 펴진다</b> — 내 자리가
         접혀 있으면 길을 잃는다
     [6] 접힌 것은 <b>지워진 것이 아니다</b> — 접은 채로도 그 칸이 열린다
     [7] 폰에서 <b>실제로 짧아진다</b> — 안 짧아지면 고친 뜻이 없다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8897;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname);
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(rs);
});
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 서랍을 <b>실제로</b> 세웁니다 — 권한에 따라 묶음이 줄면 셀 것이 없어져
   「접혔다」 를 못 가립니다. 그래서 전체 메뉴로 놓고 봅니다. */
const SEED = `
  OS.session={user:{id:'me'}};
  OS.profile={id:'me',name:'홍길동',role:'admin',active:true,plan:'vip'};
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){}; window.toast=function(){};
  try{ localStorage.setItem('apex_nav_easy_v1','0'); }catch(e){}
  try{ localStorage.removeItem('apex_nav_grp_shut_v1'); }catch(e){}
  renderNav();`;

const look = (page) => page.evaluate(() => {
  const body = document.getElementById('navBody');
  const gs = [...document.querySelectorAll('#navBody .nav-group')].map(e => ({
    t: ((e.querySelector('.ngl-t') || {}).textContent || '').trim(),
    n: ((e.querySelector('.ngl-n') || {}).textContent || '').trim(),
    shut: e.classList.contains('shut'),
    nShown: !!(e.querySelector('.ngl-n') && e.querySelector('.ngl-n').getClientRects().length),
    items: e.querySelectorAll('.nav-group-items .tab-btn').length,
    itemsSeen: [...e.querySelectorAll('.nav-group-items .tab-btn')].filter(b => b.getClientRects().length).length
  }));
  const bar = document.querySelector('.nav-grp-bar');
  return {
    h: body ? body.scrollHeight : 0,
    groups: gs,
    bar: bar ? bar.textContent.replace(/\s+/g, ' ').trim() : '',
    barBtn: bar ? ((bar.querySelector('button') || {}).textContent || '').trim() : ''
  };
});

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  /* CI 에는 바깥으로 나가는 길이 있습니다 — 막아 둡니다. 안 막으면 늦게 온
     응답이 화면을 다시 그려 셈이 흔들립니다 (실제로 그랬습니다). */
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.evaluate(() => document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()));
  await page.evaluate(SEED);
  await page.waitForTimeout(700);

  const open = await look(page);
  const total = open.groups.length;

  console.log('\n[1] 묶음 이름을 누르면 <b>그 묶음만</b> 접힌다');
  is(total >= 3, '  묶음이 서 있다 — ' + total + '개');
  const target = (open.groups.find(g => g.items >= 2) || open.groups[0] || {}).t || '';
  is(!!target, '  견본으로 쓸 묶음 — 「' + target + '」');
  const click = async (name) => {
    await page.evaluate((n) => {
      const b = [...document.querySelectorAll('.nav-group-label')].find(x => x.getAttribute('data-g') === n);
      if (b) b.click();
    }, name);
    await page.waitForTimeout(350);
    return look(page);
  };
  const one = await click(target);
  const oneG = one.groups.find(g => g.t === target) || {};
  is(oneG.shut === true, '  누른 묶음이 <b>접혔다</b>');
  is(one.groups.filter(g => g.shut).length === 1, '  접힌 것은 <b>그 하나뿐</b> — 옆 묶음은 그대로다');
  is(oneG.itemsSeen === 0 && oneG.items >= 1, '  접힌 묶음의 칸은 <b>눈에서만</b> 빠졌다 — 판에는 ' + oneG.items + '개 그대로');
  const back = await click(target);
  is((back.groups.find(g => g.t === target) || {}).shut === false, '  다시 누르면 <b>펴진다</b>');

  console.log('\n[2] 접혀도 <b>칸 수가 그대로 남는다</b> — 「없어졌다」 를 막는 첫째 장치');
  const two = await click(target);
  const twoG = two.groups.find(g => g.t === target) || {};
  is(twoG.nShown === true, '  접힌 줄에도 칸 수가 <b>눈에 보인다</b>');
  is(twoG.n === String(twoG.items), '  적힌 수와 실제 칸 수가 <b>같다</b> — 「' + twoG.n + '」 / ' + twoG.items + '개');

  console.log('\n[3] 접어 둔 것이 있으면 <b>글자로 적히고</b> 「다 펴기」 가 선다');
  is(/접어 둔 묶음/.test(two.bar), '  「접어 둔 묶음」 이라고 <b>적혀 있다</b> — ' + JSON.stringify(two.bar.slice(0, 46)));
  is(/없어진 것이 아닙니다/.test(two.bar), '  「없어진 것이 아닙니다」 를 <b>같이</b> 적는다');
  is(/다 펴기/.test(two.barBtn), '  <b>되돌아올 단추</b>가 같이 선다 — 「' + two.barBtn + '」');
  const allShut = await page.evaluate(() => { navGrpAll(true); return null; }).then(() => page.waitForTimeout(350)).then(() => look(page));
  is(allShut.groups.filter(g => g.shut).length === total, '  「다 접기」 는 <b>전부</b> 접는다 — ' + allShut.groups.filter(g => g.shut).length + '/' + total);
  is(new RegExp('접어 둔 묶음 <?b?>?' + total).test(allShut.bar.replace(/<[^>]*>/g, '')) || allShut.bar.indexOf(total + '개') >= 0,
     '  접힌 수를 <b>세어서</b> 적는다 — ' + JSON.stringify(allShut.bar.slice(0, 40)));

  console.log('\n[7] 폰에서 <b>실제로 짧아진다</b>');
  is(allShut.h < open.h * 0.4,
     '  ' + open.h + 'px → <b>' + allShut.h + 'px</b> (' + Math.round(allShut.h / open.h * 100) + '%) — 한 화면(844px)에 선다');
  is(allShut.h <= 900, '  다 접으면 <b>844px 한 화면</b>에 거의 다 담긴다 — ' + allShut.h + 'px');

  console.log('\n[4] <b>찾는 중에는 언제나 다 펴진다</b> (1번)');
  /* 찾을 말은 <b>실제로 서 있는 칸 이름</b>에서 가져옵니다 — 지어낸 말로
     찾으면 「하나도 안 나온다」 가 되어 이 점검이 헛돕니다 (8번). */
  const q = await page.evaluate(() => {
    const b = document.querySelector('#navBody .nav-group .tab-btn .tt');
    return b ? (b.textContent || '').trim().slice(0, 2) : '';
  });
  await page.evaluate((v) => navFind(v), q);
  await page.waitForTimeout(400);
  const find = await look(page);
  is(!!q && find.groups.length >= 1, '  「' + q + '」 로 찾으니 묶음이 선다 — ' + find.groups.length + '개');
  is(find.groups.filter(g => g.shut).length === 0, '  찾는 중에는 <b>접힌 묶음이 하나도 없다</b> — 다 접어 둔 채로 찾아도');
  is(find.bar === '', '  찾는 중에는 접기 안내줄을 <b>안 세운다</b> — 찾은 것만 보이게');
  await page.evaluate(() => navFind(''));
  await page.waitForTimeout(400);
  const backQ = await look(page);
  is(backQ.groups.filter(g => g.shut).length === total, '  찾기를 지우면 <b>접어 둔 대로</b> 돌아온다 — 기억이 안 날아간다');

  console.log('\n[5] <b>지금 열려 있는 화면이 든 묶음은 저절로 펴진다</b>');
  const cur = await page.evaluate(async () => {
    /* 다 접어 둔 채로 화면을 하나 열고 서랍을 다시 그린다 */
    navGrpAll(true);
    let hit = '', tab = '';
    const vis = navVisGroups();
    for (let i = 0; i < vis.length && !hit; i++)
      for (let j = 0; j < vis[i].items.length; j++)
        if (vis[i].items[j].id && vis[i].items[j].id !== 'home') { hit = vis[i].group; tab = vis[i].items[j].id; break; }
    window.currentTab = function () { return tab; };
    renderNav();
    await new Promise(r => setTimeout(r, 300));
    const e = [...document.querySelectorAll('#navBody .nav-group')]
      .find(x => ((x.querySelector('.ngl-t') || {}).textContent || '').trim() === hit);
    return { hit: hit, tab: tab, shut: e ? e.classList.contains('shut') : null };
  });
  is(cur.shut === false, '  「' + cur.hit + '」 안의 ' + cur.tab + ' 를 열어 두면 그 묶음이 <b>펴져 있다</b>');

  console.log('\n[6] 접힌 것은 <b>지워진 것이 아니다</b>');
  const alive = await page.evaluate(() => {
    navGrpAll(true); renderNav();
    /* 접은 채로도 판에는 그대로 있다 — 셈과 여는 길이 살아 있는가 */
    const n = [...document.querySelectorAll('#navBody .nav-group .tab-btn')].length;
    const byFind = (typeof navItemOf === 'function' && navItemOf('crm')) ? 'crm' : '';
    return { n: n, byFind: byFind };
  });
  is(alive.n > 0, '  다 접어도 칸은 <b>판에 그대로</b> — ' + alive.n + '개');
  is(alive.byFind === 'crm', '  접은 채로도 <b>이름으로 찾으면 그 칸이 나온다</b> (navItemOf)');

  is(errs.length === 0, '  화면이 터지지 않았다' + (errs.length ? ' — ' + errs[0] : ''));

  await ctx.close(); await browser.close(); srv.close();
  console.log('\n' + (bad ? '✗ 메뉴 묶음 접기 — 고칠 자리 ' + bad + '곳' : '✓ 메뉴 묶음 접기 — 접히고, 접혀도 없어 보이지 않습니다'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
