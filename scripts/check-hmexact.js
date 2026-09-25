/* ══════════════════════════════════════════════════════════════════
   check-hmexact.js — <b>홈이 목업과 색·둥글기까지 같은가.</b>

   사장님 말씀 — 「목업과 홈화면 <b>토시 하나 디자인 하나 색상 하나</b>
   안 틀리고 맞추고」.

   ── 잰 방법 ──────────────────────────────────────────────────────
   목업(docs/토스판_사본.html)과 앱 홈을 <b>폰 430px 에서 나란히 띄워</b>
   글자색·바탕색·둥글기를 <b>getComputedStyle 로</b> 떠서 견줍니다.
   ★ <b>여기에 hex 를 적지 않습니다.</b> 목업 파일에서 그때그때 읽습니다 —
     적어 두면 사장님이 목업을 고치실 때 이 줄이 낡아 거짓말이 됩니다 (8번).

   ── 여기서 실제로 달랐던 것 ──────────────────────────────────────
     · 글자색   앱 #0D1117 · #374151 · #6B7280  ↔  목업 #191F28 · #6B7684
     · 둥글기   앱 16px                          ↔  목업 20px
   앱은 잉크가 다섯 단계고 목업은 셋이라, 자리마다 고치는 대신
   <b>홈(.hm-toss)에서 토큰을 덮어썼습니다</b> — 고칠 자리가 한 곳입니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 홈이 <b>목업의 글자색만</b> 쓴다
     [2] 카드 <b>둥글기</b>가 목업과 같다
     [3] <b>홈에만</b> 걸었다 — 다른 화면은 제 옷 그대로다
     [4] 조용히 터지지 않았나
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd(), PORT = 8967;
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

/* 견본은 <b>홍길동</b> 집안 (3번) */
const SEED = () => {
  document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
  OS.session = { user: { id: 'me' } };
  OS.profile = { id: 'me', name: '윤시현', role: 'owner', active: true, plan: 'vip', team_id: 't1' };
  window.osLoadProfile = function () {}; window.osProfileApply = function () {};
  window.osShowLoginGate = function () {}; window.arLoad = function () {};
  window.osLoadClients = function () {}; window.cmLoadAll = function (cb) { if (cb) cb(); };
  window.toast = function () {};
  window.setupDone = function () { return true; }; window.setupCanRun = function () { return true; };
  OSC.loaded = true; OSC.busy = false; OSC.err = ''; OSC.list = []; CM.loaded = true; CM.meta = {};
  AR.loaded = true; AR.busy = ''; AR.cliRows = [];
  AR.db = [{ id: 'd1', who: 'me', name: '홍길동A', region: '순천', src: '일반', stage: 'AP', days: 3, n: 2, res: '상담', cAt: '', pAt: '' },
           { id: 'd2', who: 'me', name: '홍길순', region: '광주', src: '소개', stage: 'TA', days: 9, n: 1, res: '', cAt: '', pAt: '' }];
  go('home');
};
/* 글자색을 <b>쓰인 대로</b> 모읍니다 — 글이 있는 잎만 셉니다 */
const INKS = (sel) => {
  const out = {};
  document.querySelectorAll(sel + ' *').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (!t) return;
    /* ⚠ <b>이모지만 있는 잎은 안 셉니다.</b> 이모지는 제 색으로 그려지고
       computed color 는 검정으로 나옵니다 — 그것을 「목업에 없는 색」 으로
       세면 헛것입니다 (8번). 글자가 섞여 있으면 그때는 셉니다. */
    if (!/[0-9A-Za-z가-힣]/.test(t)) return;
    const c = getComputedStyle(e).color;
    out[c] = (out[c] || 0) + 1;
  });
  return out;
};

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  const errs = [];

  /* ── 목업을 먼저 읽습니다 — 자(尺)는 사장님 파일입니다 ── */
  const mp = await ctx.newPage();
  await mp.goto('http://127.0.0.1:' + PORT + '/docs/' + encodeURIComponent('토스판_사본.html'),
                { waitUntil: 'domcontentloaded' });
  await mp.waitForTimeout(2200);
  /* ⚠ <b>목업이 그날 그린 색</b>만 자로 삼지 않습니다. 목업에도 --t-neg
     처럼 <b>그 화면에 안 나온 색</b>이 있고, 그것을 쓰는 것은 어긋남이
     아닙니다 — 「목업에 없는 색」 이라고 적으면 헛것입니다 (8번).
     그래서 자는 <b>목업의 색표(--t- 토큰) 전체</b>입니다.            */
  const MK = await mp.evaluate((f) => {
    const cs = getComputedStyle(document.documentElement);
    const g = (k) => cs.getPropertyValue(k).trim();
    const card = document.querySelector('.t-card');
    /* 색표를 <b>통째로</b> 읽습니다 — 이름을 손으로 안 적습니다 */
    const pal = [];
    for (const sh of document.styleSheets) {
      let rules = []; try { rules = sh.cssRules || []; } catch (e) {}
      for (const r of rules) {
        if (!r.style || !/:root/.test(r.selectorText || '')) continue;
        for (const n of r.style) if (n.indexOf('--t-') === 0) {
          const v = r.style.getPropertyValue(n).trim();
          if (/^#[0-9a-f]{3,8}$/i.test(v)) pal.push(v);
        }
      }
    }
    return { ink: g('--t-ink'), sub: g('--t-sub'), sub2: g('--t-sub2'), point: g('--t-point'),
             r: card ? getComputedStyle(card).borderRadius.split(' ')[0] : '',
             pal: [...new Set(pal)],
             inks: (new Function('return (' + f + ')("#scr")'))() };
  }, INKS.toString());
  /* 자 = 목업이 그린 색 + 목업 색표 전체 */
  const mkInks = [...new Set(Object.keys(MK.inks).concat(MK.pal.map(hex2rgb)))];
  console.log('\n[0] 목업에서 <b>자를 읽습니다</b>');
  is(!!MK.ink && !!MK.r, '  목업의 글자색·둥글기를 읽었다 — 글자 ' + MK.ink + ' · 둥글기 ' + MK.r);
  is(MK.pal.length >= 10, '  목업의 <b>색표</b>를 통째로 읽었다 — ' + MK.pal.length + '가지');
  is(mkInks.length >= 3, '  자로 삼을 색 ' + mkInks.length + '가지 (그린 색 + 색표)');

  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e.message || e).slice(0, 130)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3600);
  await p.evaluate(SEED);
  await p.waitForTimeout(2200);

  console.log('\n[1] 홈이 <b>목업의 글자색만</b> 쓴다');
  const AP = await p.evaluate((f) => (new Function('return (' + f + ')(".hm-toss")'))(), INKS.toString());
  /* 목업에 없는 색 — 흰 글자(단추 위)와 <b>약관·공지</b> 줄은 뺍니다.
     그 둘은 <b>목업에 아예 없는 칸</b>이라 견줄 짝이 없습니다 (1번). */
  const SKIP = await p.evaluate(() => {
    const o = {};
    document.querySelectorAll('.hm-toss .notice *,.hm-toss .hm-noti *').forEach(e => {
      if (e.children.length || !(e.textContent || '').trim()) return;
      o[getComputedStyle(e).color] = 1;
    });
    /* ⚠ 2026-09-25 — 여기에 <b>퀘스트 띠(.hm-q) 예외</b>가 있었습니다.
       남색(#0F172A) 바탕이라 목업의 글자색을 올리면 안 읽혀서였습니다.
       그 띠가 <b>밝아졌습니다</b>(--t-bg-3) — 이제 견줄 짝이 있으므로
       예외를 <b>걷어냅니다</b>. 안 울리는 알람은 알람이 아닙니다 (8번).  */
    o['rgb(255, 255, 255)'] = 1;                    /* 단추 위 흰 글자 */
    return Object.keys(o);
  });
  const odd = Object.keys(AP).filter(c => mkInks.indexOf(c) < 0 && SKIP.indexOf(c) < 0);
  is(odd.length === 0,
     '  홈의 글자색이 <b>전부 목업 것</b>이다 — ' + Object.keys(AP).length + '가지' +
     (odd.length ? (' ← 목업에 없는 색 ' + odd.join(' · ')) : ''));
  ['ink', 'sub', 'sub2', 'point'].forEach(k => {
    const hex = MK[k], rgb = hex2rgb(hex);
    is(Object.keys(AP).some(c => c === rgb),
       '  목업의 <b>' + k + '</b>(' + hex + ')가 홈에 <b>실제로</b> 쓰인다');
  });

  console.log('\n[2] 카드 <b>둥글기</b>가 목업과 같다');
  const R = await p.evaluate(() => {
    const o = {};
    document.querySelectorAll('.hm-toss .card,.hm-toss .hm-act,.hm-toss .hm-mv').forEach(e => {
      o[getComputedStyle(e).borderRadius.split(' ')[0]] = (o[getComputedStyle(e).borderRadius.split(' ')[0]] || 0) + 1;
    });
    return o;
  });
  const rs = Object.keys(R);
  is(rs.length === 1 && rs[0] === MK.r,
     '  홈 카드가 <b>' + MK.r + '</b>(목업)이다 — ' + rs.map(k => k + '×' + R[k]).join(' · '));

  console.log('\n[3] <b>홈에만</b> 걸었다 — 다른 화면은 제 옷 그대로다');
  const other = await p.evaluate(async () => {
    go('clients'); await new Promise(r => setTimeout(r, 700));
    const e = document.querySelector('.tab-pane.on');
    return { toss: !!(e && e.classList.contains('hm-toss')),
             ink: getComputedStyle(document.documentElement).getPropertyValue('--ink-1').trim() };
  });
  is(!other.toss, '  다른 화면에는 <b>hm-toss 가 안 붙는다</b>');
  is(other.ink && other.ink !== MK.ink,
     '  앱의 잉크 표는 <b>안 건드렸다</b> — ' + other.ink + ' (홈에서만 덮어씁니다)');

  console.log('\n[4] 조용히 터지지 않았나');
  is(errs.length === 0, '  콘솔 오류 없음' + (errs.length ? (' ← ' + errs.slice(0, 2).join(' | ')) : ''));

  console.log('\n──────────────────────────────');
  console.log(bad ? ('✗ ' + bad + '가지 빨간불') : '✓ 홈이 목업과 같은 색·같은 둥글기입니다.');
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();

function hex2rgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec((h || '').trim());
  if (!m) return h;
  const n = parseInt(m[1], 16);
  return 'rgb(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ')';
}
