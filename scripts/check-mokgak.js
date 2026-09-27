/* ══════════════════════════════════════════════════════════════════
   check-mokgak.js — <b>목각을 자로 삼습니다.</b>

   2026-09-27. 사장님이 다른 세션에서 만드신 기준을 저장소에 넣어
   주셨습니다 — docs/APEX_목각.html (PC) · docs/APEX_목각_폰.html.

   ⚠ 그 전까지 저는 <b>docs/토스판_사본.html (9월 24일)</b> 을 자로 쓰고
     있었습니다. 사장님이 「목각」 이라 하신 것은 <b>이 새 파일</b>이고
     다른 것입니다. 자가 틀리면 어긋난 것을 계속 <b>맞다고 보고</b>합니다.

   ★ 색<b>값</b>은 둘이 같습니다(이름만 --ink / --t-ink). 다른 것은
     <b>어디에 어떻게 쓰느냐</b> 입니다. 그래서 값이 아니라 <b>화면에
     실제로 칠해진 색</b>을 견줍니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 목각에서 <b>자를 읽는다</b> — 판 · 카드 · 쓰는 색 전부
     [2] 앱의 <b>판과 카드</b>가 목각과 같다
     [3] ★ 앱이 <b>목각에 없는 색</b>을 쓰는 가짓수가 늘지 않았다
     [4] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9027;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
const 목각 = '/docs/' + encodeURIComponent('APEX_목각.html');

/* ── 기준선 ────────────────────────────────────────────────────────
   ★ 2026-09-27 에 재서 적었습니다. <b>줄이면 같이 내리고, 늘면 빨간불</b>
     입니다 (0-1번).
   ⚠ 지금 앱이 목각에 없이 쓰는 색 여섯 가운데 <b>다섯은 서랍 갈래색</b>
     입니다(#8231EB · #1D64BB · #197355 · #337221 · #6D6728 — navRamp 가
     계산해 냅니다). 목각 서랍에는 갈래색이 <b>아예 없습니다.</b> 지울지는
     사장님이 정하실 일이라(X01 에서 사장님이 고르신 옷입니다) 여기서는
     <b>늘지만 않게</b> 잡아 둡니다. 지어서 지우지 않습니다 (1번).      */
/* ── 앱이 목각 밖에서 쓰는 색 — <b>이름으로</b> 적어 둡니다 ──────────
   ★ <b>수로 세지 않습니다.</b> 처음에 수로 셌더니 제 컨테이너 30 · CI 31 로
     갈렸습니다 — CI 에서만 뜨는 오류 상태의 붉은색(#991B1B) 하나 때문입니다.
     <b>화면에 무엇이 떠 있느냐</b>에 따라 움직이는 자라, 고친 것이 없는데도
     빨간불이 켜집니다. check-onepal 에서 이미 겪은 그 자리입니다 (8번).
   ★ 이름으로 적으면 새 색이 생겼을 때 <b>그 색이 화면에 찍힙니다.</b>
     늘었는지뿐 아니라 <b>무엇이 늘었는지</b>가 바로 보입니다.
   ⚠ 이것이 사장님 말씀 「색상 … 전부 다 다르다」 의 <b>목록</b>입니다.
     줄이면 이 줄들을 지웁니다.                                         */
const 목각밖의색 = [
  /* ⚠ 2026-09-27 — <b>서랍 갈래색 아홉을 여기서 지웠습니다.</b>
     사장님 말씀 「목각처럼 색 싹 빼」 로 navRamp 이 무채색만 돌려주게
     됐습니다. 빠진 것 — 서랍 묶음 다섯(#8231EB · #1D64BB · #197355 ·
     #337221 · #6D6728)과 위 즐겨찾기 띠가 쓰던 같은 줄기 넷(#167172 ·
     #1D7338 · #275AE0 · #417022). 목각 밖의 색 31 → <b>22</b>. */
  /* 우리 색표엔 있으나 목각엔 없는 둘 */
  '#123A96',   /* --t-point-d — 목각에는 진한 파랑이 없습니다 */
  '#F1F3F5',   /* --t-line-2  — 목각에는 카드 안쪽 줄 색이 없습니다 */
  /* 옛 Tailwind 계열 — 화면마다 재면서 줄여야 합니다.
     한 번에 바꾸면 무엇이 깨졌는지 알 길이 없습니다. */
  '#000000', '#0369A1', '#075985', '#0F172A', '#0F766E',
  '#34D399', '#42506A', '#475569',
  '#5B21B6', '#64748B', '#7C2D12', '#92400E', '#9CA3AF', '#B45309',
  '#E8F2FF', '#F0F9FF', '#F6F8FB', '#FAFBFC', '#FFFBEB',
  /* ⚠ 이 하나는 <b>제 컨테이너에서는 안 뜹니다</b> — CI 에서만 뜨는 오류
     상태의 붉은색입니다. 못 본다고 없는 것이 아닙니다 (1번).          */
  '#991B1B'
];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  ['osLoadProfile','osProfileApply','osShowLoginGate','arLoad','osLoadClients','osCliInfoLoad',
   'osRepListLoad','osLoadAnalysis','toast','nlLoad'].forEach(k => { window[k] = function(){}; });
  window.cmLoadAll = function(cb){ CM.loaded = true; if (cb) cb(); };
  window.osTabAllowed = function(){ return true; };
  window.setupDone = function(){ return true; }; window.setupCanRun = function(){ return true; };
  window.osClient = function(){ return null; };
  OS.profile = {id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session = {user:{id:'me'}};
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.reps = []; OSC.list = [];
  AR.loaded = true; AR.busy = ''; AR.cliRows = []; AR.db = [];
  CM.loaded = true; CM.meta = {};
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};

/* 화면에 <b>실제로 칠해진</b> 색만 모읍니다 — 안 보이는 규칙은 안 셉니다 */
const PAINT = () => {
  const hex = s => { const n = (s||'').match(/[\d.]+/g);
    return n ? ('#' + n.slice(0,3).map(x => (+x).toString(16).padStart(2,'0')).join('').toUpperCase()) : s; };
  const solid = c => { const n = (c||'').match(/[\d.]+/g); return !!(n && (n.length<4 || +n[3]>.5)); };
  const bgOf = el => { let e = el; while (e) { const cs = getComputedStyle(e);
    if ((cs.backgroundImage||'none') !== 'none') return null;
    if (solid(cs.backgroundColor)) return hex(cs.backgroundColor); e = e.parentElement; } return '#FFFFFF'; };
  const used = {};
  document.querySelectorAll('*').forEach(e => {
    const cs = getComputedStyle(e);
    if (!e.offsetParent && cs.position !== 'fixed') return;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    [cs.color, cs.backgroundColor].forEach(v => { if (solid(v)) { const h = hex(v); used[h] = (used[h]||0)+1; } });
  });
  /* 흰 카드 하나와 그 뒤 판 */
  const cards = [].slice.call(document.querySelectorAll('div')).filter(e => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return solid(cs.backgroundColor) && hex(cs.backgroundColor) === '#FFFFFF' &&
           r.width > 300 && r.height > 100 && parseFloat(cs.borderRadius) >= 8;
  });
  const c = cards[0];
  return { used: used,
           카드둥글기: c ? getComputedStyle(c).borderRadius.split(' ')[0] : '',
           카드수: cards.length,
           판: c ? bgOf(c.parentElement) : '' };
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();

  console.log('\n[1] 목각에서 <b>자를 읽는다</b>');
  const m = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const merr = []; m.on('pageerror', e => merr.push('' + (e && e.message)));
  await m.goto('http://127.0.0.1:' + PORT + 목각, { waitUntil: 'domcontentloaded' });
  await m.waitForTimeout(1800);
  const MG = await m.evaluate(PAINT);
  /* ★ <b>칠한 색만 보면 좁습니다.</b> 목각 색표에 있는데 그 화면에 안 뜬
     색(예 #DC2626 · #E5E8EB · #123A96)까지 「목각에 없는 색」 이라고
     잡으면 <b>헛것을 잡습니다</b> (8번). 색표도 같이 읽습니다. */
  const 목각표 = await m.evaluate(() => {
    const out = [];
    for (const sh of document.styleSheets) {
      let rules = []; try { rules = sh.cssRules || []; } catch (e) {}
      for (const r of rules) {
        if (!r.style || !/:root/.test(r.selectorText || '')) continue;
        for (const n of r.style) {
          const v = r.style.getPropertyValue(n).trim();
          if (/^#[0-9a-f]{3,8}$/i.test(v)) {
            let h = v.replace('#','');
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            out.push('#' + h.toUpperCase());
          }
        }
      }
    }
    return [...new Set(out)];
  });
  const 목각색 = [...new Set(Object.keys(MG.used).concat(목각표))];
  is(Object.keys(MG.used).length >= 15,
     '  목각이 <b>실제로 칠한 색</b>을 읽었다 — ' + Object.keys(MG.used).length + '가지');
  is(목각표.length >= 10,
     '  목각의 <b>색표</b>도 읽었다 — ' + 목각표.length + '가지 (그 화면에 안 떠도 목각의 색입니다)');
  is(!!MG.판 && MG.카드수 >= 3,
     '  목각의 판과 카드를 잡았다 — 판 <b>' + MG.판 + '</b> · 흰 카드 ' + MG.카드수 +
     '개 · 둥글기 ' + MG.카드둥글기);
  is(merr.length === 0, '  목각이 조용히 터지지 않았다' +
     (merr.length ? (' ← ' + merr.slice(0,2).join(' | ')) : ''));
  await m.close();

  console.log('\n[2] 앱의 <b>판과 카드</b>가 목각과 같다');
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(1600);
  const AP = await p.evaluate(PAINT);
  is(AP.판 === MG.판, '  판이 목각과 같다 — 앱 ' + AP.판 + ' / 목각 ' + MG.판);
  is(AP.카드둥글기 === MG.카드둥글기,
     '  카드 둥글기가 목각과 같다 — 앱 ' + AP.카드둥글기 + ' / 목각 ' + MG.카드둥글기);

  console.log('\n[3] ★ 앱이 <b>목각에 없는 색</b>을 쓰는 가짓수');
  /* ★ <b>홈만 보면 안 됩니다.</b> 처음에 홈만 재고 되돌림 시험을 했더니,
     다른 화면에 이상한 색을 넣어도 <b>안 울었습니다</b> — 그 화면을 안 열어
     색이 칠해지지도 않았기 때문입니다. 안 우는 알람입니다 (8번).
     그래서 아래 띠 화면을 <b>다 돌면서</b> 모읍니다.                   */
  const tabs = await p.evaluate(() =>
    [...new Set(TB.map(x => x.id).concat(['tools','me','settings','report','news_live']))]);
  const 모은색 = Object.assign({}, AP.used);
  for (const t of tabs) {
    await p.evaluate(x => { try{ go(x); }catch(e){} }, t);
    await p.waitForTimeout(650);
    const r = await p.evaluate(PAINT);
    Object.keys(r.used).forEach(h => { 모은색[h] = (모은색[h]||0) + r.used[h]; });
  }
  console.log('      · 돌아본 화면 ' + tabs.length + '개 — ' + tabs.join(' · '));
  const 없는색 = Object.keys(모은색).filter(h => 목각색.indexOf(h) < 0).sort();
  const 새것 = 없는색.filter(h => 목각밖의색.indexOf(h) < 0);
  is(새것.length === 0,
     '  ★ <b>목각 밖의 새 색</b>이 없다 — 지금 ' + 없는색.length + '가지 (적어 둔 것 ' +
     목각밖의색.length + '가지)' +
     (새것.length ? ('\n      ✗ ' + 새것.join(' · ') +
       '\n      → 목각에 있는 색으로 바꾸거나, 뜻이 있으면 위 목각밖의색 에 <b>까닭과 함께</b> 적으십시오') : ''));
  const 사라진것 = 목각밖의색.filter(h => 없는색.indexOf(h) < 0);
  if (사라진것.length)
    console.log('      · 이제 안 나오는 색 ' + 사라진것.length + '가지 — 목록에서 지워 주십시오: ' +
                사라진것.join(' · '));

  console.log('\n[4] 조용히 터지지 않았나');
  is(errs.length === 0, '  터진 곳이 없다' + (errs.length ? (' ← ' + errs.slice(0,2).join(' | ')) : ''));

  await b.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불')
    : '✓ 앱이 목각과 같은 판·카드를 쓰고, 목각 밖의 색이 안 늘었습니다.');
  process.exit(bad ? 1 : 0);
})();
