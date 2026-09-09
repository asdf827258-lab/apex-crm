#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   메뉴 접기 — 늘 서 있되, 접을 수 있고, 갇히지 않는다

   메뉴를 숨겨 뒀더니 있는 화면을 못 찾으셨습니다. 그래서 <b>늘 서 있는
   것이 원칙</b>입니다. 다만 자료를 넓게 볼 때가 있어 접을 수 있게 두되,
   접었을 때 <b>돌아올 길이 반드시 보여야</b> 합니다. 안 보이면 그것은
   접힌 것이 아니라 없어진 것입니다.

   여기서 지키는 것은 넷입니다.
     ① 처음 여는 사람에게는 <b>펼쳐진 채로</b> 선다
     ② 접으면 정말 접힌다 — 그리고 <b>☰ 가 되살아난다</b>
     ③ ☰ 를 누르면 <b>다시 펴진다</b>
     ④ 접어 둔 것이 새로고침해도 남는다 · 좁은 화면으로 새면 안 된다
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 8821;
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = t => console.log('\n' + t);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
               '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const STUB = `
window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},order:function(){return a},
  limit:function(){return a},single:function(){return a},in:function(){return a},gte:function(){return a},
  lte:function(){return a},is:function(){return a},neq:function(){return a},not:function(){return a},
  range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
  then:function(r){return Promise.resolve({data:[],error:null}).then(r)}};a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({})},getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'t',email:'t@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'t'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;
function serve() {
  return http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0].split('#')[0]);
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PORT);
}

/* 화면에 실제로 보이나 — 폭이 0 이면 접힌 것이다 */
const seen = pg => pg.evaluate(() => {
  const s = document.getElementById('sidebar'), b = document.querySelector('.tn-burger');
  const m = document.querySelector('.main');
  const r = s.getBoundingClientRect(), br = b ? b.getBoundingClientRect() : null;
  return {
    w: Math.round(r.width),
    /* 기둥이 0 이어도 <b>그 자리가 빈칸으로 남으면</b> 접은 뜻이 없다.
       접기는 「본문을 넓게 쓰는 것」이라, 본문 폭을 같이 잰다. */
    main: m ? Math.round(m.getBoundingClientRect().width) : 0,
    mainLeft: m ? Math.round(m.getBoundingClientRect().left) : 0,
    vis: getComputedStyle(s).visibility,
    burger: !!(br && br.width > 0 && getComputedStyle(b).display !== 'none'),
    folded: document.body.classList.contains('nav-fold'),
    saved: (function () { try { return localStorage.getItem('apex_nav_fold') } catch (e) { return null } })()
  };
});

(async () => {
  const srv = serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0 ? r.continue() : r.abort());
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.message || e)));
  await pg.addInitScript(STUB);
  await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForFunction(() => typeof navFoldToggle === 'function' && typeof go === 'function', { timeout: 60000 });
  await pg.evaluate(() => { document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove()); });

  head('[1] 처음 여는 사람에게는 <b>펼쳐진 채로</b> 선다');
  let S = await seen(pg);
  is(S.w > 200, '기둥이 서 있다 — 폭 ' + S.w + 'px');
  const openMain = S.main, openLeft = S.mainLeft;
  is(openLeft > 200, '본문이 기둥 <b>오른쪽에서</b> 시작한다 — ' + openLeft + 'px');
  is(!S.folded, '접힘이 <b>기본이 아니다</b> — 고른 적 없으면 늘 보인다');
  is(!S.burger, '펼쳐져 있을 때는 <b>☰ 가 안 뜬다</b> — 눌러도 할 일이 없는 단추');
  is(await pg.evaluate(() => !!document.getElementById('navFoldBtn')), '<b>접는 단추</b>가 기둥 안에 있다');

  head('[2] 접으면 정말 접히고 — <b>☰ 가 되살아난다</b>');
  await pg.evaluate(() => navFoldToggle());
  await pg.waitForTimeout(350);
  S = await seen(pg);
  is(S.w === 0, '기둥이 <b>0px</b> 로 접혔다 — ' + S.w + 'px');
  /* ★ 여기서 안 재면, 기둥만 0 이고 <b>빈칸이 그대로 남는</b> 판이 통과한다 */
  is(S.mainLeft < 8, '본문이 <b>왼쪽 끝까지</b> 온다 — ' + S.mainLeft + 'px (접기 전 ' + openLeft + 'px)');
  is(S.main >= openMain + 200, '본문이 <b>기둥 폭만큼 넓어졌다</b> — ' +
     openMain + 'px → ' + S.main + 'px');
  is(S.vis === 'hidden', '접힌 기둥은 <b>탭으로도 안 걸린다</b>');
  is(S.burger, '<b>☰ 가 되살아났다</b> — 돌아올 길이 안 보이면 없어진 것이다');
  is(S.saved === '1', '접은 것을 <b>기억한다</b>');
  const lbl = await pg.evaluate(() => {
    const b = document.getElementById('navFoldBtn');
    return { a: b.getAttribute('aria-expanded'), t: b.getAttribute('aria-label') };
  });
  is(lbl.a === 'false' && /펴기/.test(lbl.t), '단추가 <b>「펴기」로</b> 바뀐다 — ' + lbl.t);

  head('[3] ☰ 를 누르면 <b>다시 펴진다</b>');
  await pg.evaluate(() => document.querySelector('.tn-burger').click());
  await pg.waitForTimeout(350);
  S = await seen(pg);
  is(S.w > 200, '기둥이 <b>돌아왔다</b> — ' + S.w + 'px');
  is(S.mainLeft > 200, '본문도 <b>제자리로</b> 밀렸다 — ' + S.mainLeft + 'px');
  is(!S.folded && S.saved === '0', '펼친 것도 <b>기억한다</b>');

  head('[4] 접어 둔 것이 <b>새로고침해도</b> 남는다');
  await pg.evaluate(() => navFoldToggle());
  await pg.waitForTimeout(200);
  await pg.reload({ waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => typeof navFoldToggle === 'function', { timeout: 60000 });
  await pg.waitForTimeout(400);
  S = await seen(pg);
  is(S.w === 0 && S.folded, '다시 열어도 <b>접힌 채로</b> 선다');
  is(S.burger, '그때도 <b>☰ 로 펼 수 있다</b>');

  head('[5] 좁은 화면으로 <b>새지 않는다</b>');
  /* 기둥이 아니라 서랍인 폭에서 접힘이 남으면, 서랍이 안 열리는 것처럼 보인다 */
  await pg.setViewportSize({ width: 900, height: 900 });
  await pg.waitForTimeout(350);
  const narrow = await pg.evaluate(() => ({
    folded: document.body.classList.contains('nav-fold'),
    open: document.getElementById('sidebar').classList.contains('open')
  }));
  is(!narrow.folded, '좁은 화면에서는 <b>접힘을 안 씌운다</b> — 거기선 서랍이다');
  await pg.evaluate(() => toggleNav());
  await pg.waitForTimeout(350);
  is(await pg.evaluate(() => document.getElementById('sidebar').classList.contains('open')),
     '좁은 화면에서 ☰ 는 <b>서랍을 연다</b>');
  await pg.evaluate(() => navFoldToggle());
  await pg.waitForTimeout(250);
  is(!(await pg.evaluate(() => document.getElementById('sidebar').classList.contains('open'))),
     '좁은 화면에서 「접기」는 <b>서랍을 닫는다</b>');

  head('[6] 만드는 자리가 하나인가 (5번)');
  ['navWide', 'navFolded', 'navFoldApply', 'navFoldSet', 'navFoldToggle', 'toggleNav'].forEach(f => {
    const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
    is(c === 1, f + '() 가 ' + c + '곳에 있다');
  });
  is((SRC.match(/matchMedia\('\(min-width:1101px\)'\)/g) || []).length >= 1 &&
     !/innerWidth\s*>\s*1100[\s\S]{0,40}nav-fold/.test(SRC),
     '「지금 넓은 화면인가」를 <b>navWide() 하나</b>가 답한다');

  is(errs.length === 0, errs.length ? ('콘솔 에러 ' + errs.length + '건 — ' + errs[0]) : '끝까지 콘솔 에러 <0건>');

  await ctx.close(); await br.close(); srv.close();
  console.log('\n' + '─'.repeat(30));
  if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
  console.log('메뉴 접기 점검 통과 — ' + n + '가지. 늘 서 있고, 접어도 갇히지 않습니다.');
})().catch(e => { console.error(e); process.exit(1); });
