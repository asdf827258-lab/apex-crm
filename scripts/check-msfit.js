/* ══════════════════════════════════════════════════════════════════
   check-msfit.js — <b>메인 상담자료 덱의 쪽이 한 화면에 드나.</b>
   (판 X485 · 2026-11-18)

   사장님 말씀 2026-11-18 「<b>발표 넘치는 쪽부터 하고, 칸 / 글씨를
   조정해서 맞추어서</b> 해줘」.

   ── 어떻게 찾았나 ─────────────────────────────────────────────────
   미끼상품 발표를 맞춘 뒤(판 X484) <b>다른 덱도 그런가</b> 재어 봤습니다.
   apex-deck 파일 15개 가운데 <b>진짜 슬라이드 덱은 이것 하나</b>입니다
   (window.goTo 가 있고 .slide.active 로 한 쪽씩 보여 줍니다). 나머지는
   .slide 가 스크롤 구역이라 길어도 정상입니다 — 처음에 「134쪽」 을 다
   센 것은 <b>제 자가 틀린 것</b>이었습니다.
   그 하나에서 장 표지 두 쪽(s11·s14)이 걸렸습니다 —
     · 1920×1080  둘 다 <b>듭니다</b>
     · 1600×900   s11 <b>+159px</b> · s14 <b>+74px</b>
     · 1366×768   s11 <b>+291px</b> · s14 <b>+206px</b>
   내용이 879px·794px 인데 위아래 여백이 180px 이라, 창이 900px 이면
   쪽이 1,059px 이 되어 <b>쪽 안에서 스크롤</b>됐습니다. 앞서는
   overflow-y:auto 로 「스크롤되게 두자」 로 막아 두었는데, 그러면
   <b>고객 앞에서 아랫부분을 못 보여 드립니다</b> (1번).

   ── 재면서 세 번 속았습니다 (셋 다 이 자가 지킵니다) ─────────────
   ① <b>칸을 줄여도 0px 도 안 줄었습니다.</b> .slide 에 transition:all .5s
      가 걸려 있어 <b>전환 중인 여백</b>을 읽고 있었습니다 — 인라인
      !important 는 들어가 있었는데 computed 만 아직 80px 이었습니다.
   ② <b>애니메이션을 끄고 재니 값은 맞았지만</b>, 다시 켤 때 들어오는
      움직임이 처음부터 다시 돌아 <b>표지(s1)까지 건드렸습니다</b>.
   ③ <b>글칸 높이만 보면 모자랍니다</b> — 글칸 밖으로 비어져 나온 것을
      놓칩니다. 재는 값은 scrollHeight − clientHeight 하나입니다 (5번).
   ★ 그래서 <b>재는 때</b>를 바꿨습니다 — 들어올 때가 아니라 <b>열 때·창
     크기가 바뀔 때 모든 쪽을 한 번</b>. 들어오는 움직임은 <b>켜진 쪽에만</b>
     걸리므로(.slide.active .animate-up) 꺼진 쪽을 재면 흔들리지 않고,
     발표 중에는 <b>다시 안 움직입니다.</b>

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ 창 다섯 크기에서 <b>넘치는 쪽 0</b>
     [2] ★★ <b>이미 드는 쪽은 한 톨도 안 건드린다</b> — 1920×1080 은 17쪽 전부
            그대로 · 다른 창에서도 손댄 쪽은 <b>원래 넘쳤던 쪽만</b>
     [3] ★★ <b>칸을 먼저</b> — 1600×900·1440×900 에서는 칸만으로 끝나고
            <b>글씨가 한 톨도 안 바뀐다</b>
     [4] ★★ 배수 <b>바닥 0.85</b> 를 안 뚫는다
     [5] ★ 발표 중에 <b>다시 안 움직인다</b> — 쪽을 넘겨도 값이 그대로다
     [6] ★ <b>창 크기가 바뀌면 다시 맞춘다</b> — 한 번 재어 박아 두지 않는다
     [7] ★ 조용한가 · <b>서버</b> 요청 0 (7번)
   ⚠ 이 덱에는 <b>17px 바닥 약속이 없습니다</b> — 라벨이 원래 9~15px 입니다
     (s5 가 9px · s16 이 10px). 미끼상품 덱의 17px(판 X313)을 들고 오지
     않았고, 대신 <b>15% 까지만</b> 줄입니다. 모르는 것은 모른다고 적습니다 (1번).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const FILE = 'app/상담자료/메인 상담자료.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const 소스 = fs.readFileSync(path.join(ROOT, FILE), 'utf8');

const 창들 = [[1920, 1080], [1600, 900], [1512, 982], [1440, 900], [1366, 768], [1280, 800]];

let bad = 0;
const is = (ok, m) => { if (!ok) bad++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); };
const head = (t) => console.log('\n' + t);

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

/* 쪽마다 — 손댔나 · 얼마나 · 찍히는 제일 작은 글씨 · 넘치나 */
const 잼 = `(() => {
  const out = [];
  document.querySelectorAll('#presentation .slide').forEach(s => {
    const box = s.querySelector('.slide-content');
    const k = (box && box.style.zoom) ? parseFloat(box.style.zoom) : 1;
    const p = s.style.getPropertyValue('--msfit');
    let mn = 999;
    [].slice.call(s.querySelectorAll('*')).forEach(e => {
      let g = ''; for (const c of e.childNodes) if (c.nodeType === 3) g += c.nodeValue;
      if (g.trim().length < 2) return;
      const cs = getComputedStyle(e);
      if (cs.display === 'none') return;
      const b = e.getBoundingClientRect(); if (b.height < 2 || b.width < 2) return;
      const f = parseFloat(cs.fontSize) * k; if (f > 0 && f < mn) mn = f;
    });
    out.push({ id: s.id, 칸: (p === '' ? 1 : parseFloat(p)), 배수: k,
      글: Math.round(mn * 10) / 10, 넘침: s.scrollHeight - s.clientHeight,
      손: (p !== '') || k < 1 });
  });
  return out;
})()`;

(async () => {
  console.log('══ 메인 상담자료 덱 맞추기 점검 (판 X485) ══');
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const 바깥 = [], 터짐 = [];
  const 열기 = async (w, h) => {
    const ctx = await br.newContext({ viewport: { width: w, height: h } });
    /* ⚠ 사장님 진짜 서버를 한 번도 안 부릅니다 (7번·8번) */
    await ctx.route('**://**', r => {
      const u = r.request().url();
      if (u.indexOf('127.0.0.1:' + P) >= 0) return r.continue();
      바깥.push(u); return r.abort();
    });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => 터짐.push(String(e).slice(0, 100)));
    await pg.goto('http://127.0.0.1:' + P + '/' + FILE.split('/').map(encodeURIComponent).join('/'), { waitUntil: 'load' });
    await pg.waitForTimeout(2200);
    return { ctx, pg };
  };

  const 창별 = {};
  for (const [w, h] of 창들) {
    const { ctx, pg } = await 열기(w, h);
    창별[w + 'x' + h] = await pg.evaluate(잼);
    await ctx.close();
  }

  head('[1] ★★ 창 다섯 크기에서 <b>넘치는 쪽 0</b>');
  for (const [w, h] of 창들) {
    const r = 창별[w + 'x' + h];
    const 넘 = r.filter(x => x.넘침 > 8);
    is(넘.length === 0, '  ' + w + '×' + h + ' — 넘치는 쪽 <b>' + 넘.length + '쪽</b> / ' + r.length +
      (넘.length ? (' ← ' + 넘.map(x => x.id + ' +' + x.넘침 + 'px').join(' · ')) : ''));
  }

  head('[2] ★★ <b>이미 드는 쪽은 한 톨도 안 건드린다</b>');
  const 큰창 = 창별['1920x1080'];
  const 큰창손 = 큰창.filter(x => x.손);
  is(큰창.length >= 15, '    쪽 <b>' + 큰창.length + '개</b>를 봤다 (15 아래면 이 자가 덜 보는 것입니다)');
  is(큰창손.length === 0,
    '  ★★ 1920×1080 에서는 <b>' + 큰창.length + '쪽 전부 그대로</b>다 — 손댄 쪽 ' + 큰창손.length +
    (큰창손.length ? (' ← ' + 큰창손.map(x => x.id).join(' ')) : ''));
  /* 다른 창에서 손댄 쪽은 s11·s14 뿐이어야 한다 — 원래 넘쳤던 쪽만 */
  const 손댄이름 = new Set();
  for (const k in 창별) 창별[k].filter(x => x.손).forEach(x => 손댄이름.add(x.id));
  const 뜻밖 = [...손댄이름].filter(id => id !== 's11' && id !== 's14');
  is(뜻밖.length === 0,
    '  ★★ 손댄 쪽이 <b>s11·s14 뿐</b>이다 — 원래 넘쳤던 그 둘 (' + [...손댄이름].sort().join(' · ') + ')' +
    (뜻밖.length ? ('\n        ← 엉뚱한 쪽: ' + 뜻밖.join(' ')) : ''));

  head('[3] ★★ <b>칸을 먼저</b> — 큰 창에서는 글씨가 한 톨도 안 바뀐다');
  for (const w of ['1600x900', '1440x900', '1512x982']) {
    const r = 창별[w];
    const 글줄인것 = r.filter(x => x.배수 < 1);
    is(글줄인것.length === 0,
      '  ' + w.replace('x', '×') + ' — 글씨를 내린 쪽 <b>' + 글줄인것.length + '쪽</b> (칸만으로 끝났다)' +
      (글줄인것.length ? (' ← ' + 글줄인것.map(x => x.id + ' ×' + x.배수).join(' · ')) : ''));
  }
  const s11_1600 = 창별['1600x900'].find(x => x.id === 's11');
  const s14_1600 = 창별['1600x900'].find(x => x.id === 's14');
  is(!!s11_1600 && !!s14_1600 && s11_1600.칸 < 1 && s14_1600.칸 < 1,
    '    1600×900 에서 그 두 쪽의 <b>칸은 실제로 줄었다</b> (s11 ×' +
    (s11_1600 ? s11_1600.칸 : '?') + ' · s14 ×' + (s14_1600 ? s14_1600.칸 : '?') +
    ') — 0 이면 장치가 아예 안 도는 것입니다');

  head('[4] ★★ 배수 <b>바닥 0.85</b> 를 안 뚫는다');
  let 제일낮은 = 1, 어디 = '';
  for (const k in 창별) 창별[k].forEach(x => { if (x.배수 < 제일낮은) { 제일낮은 = x.배수; 어디 = k + ' ' + x.id; } });
  is(제일낮은 >= 0.85 - 1e-9,
    '  제일 많이 줄인 배수 <b>×' + 제일낮은.toFixed(2) + '</b> (' + (어디 || '없음') + ') — 바닥 0.85 이상');
  const 바닥선언 = (소스.match(/MSFIT_MIN\s*=\s*([0-9.]+)/) || [])[1];
  is(바닥선언 && parseFloat(바닥선언) >= 0.85,
    '    바닥값이 <b>한 곳(MSFIT_MIN)</b>에 ' + 바닥선언 + ' 로 적혀 있다');
  let 제일작은글 = 999, 글어디 = '';
  for (const k in 창별) 창별[k].forEach(x => { if (x.손 && x.글 < 제일작은글) { 제일작은글 = x.글; 글어디 = k + ' ' + x.id; } });
  console.log('      손댄 쪽에서 찍히는 제일 작은 글씨 <b>' + (제일작은글 === 999 ? '-' : 제일작은글) + 'px</b> (' + 글어디 + ')');
  console.log('      — 이 덱은 라벨이 원래 9~15px 입니다 (바닥 약속이 없습니다 · 1번)');

  head('[5] ★ 발표 중에 <b>다시 안 움직인다</b> — 쪽을 넘겨도 값이 그대로');
  {
    const { ctx, pg } = await 열기(1600, 900);
    const 전 = await pg.evaluate(() => {
      const s = document.getElementById('s11'), b = s.querySelector('.slide-content');
      return (s.style.getPropertyValue('--msfit') || '1') + '/' + (b.style.zoom || '1');
    });
    /* s11 로 들어가 보고, 지나쳐 가 보고, 돌아와 본다 */
    for (const id of ['s11', 's12', 's14', 's11']) {
      await pg.evaluate((id) => { if (typeof window.goToId === 'function') window.goToId(id); }, id);
      await pg.waitForTimeout(260);
    }
    await pg.waitForTimeout(600);
    const 후 = await pg.evaluate(() => {
      const s = document.getElementById('s11'), b = s.querySelector('.slide-content');
      return (s.style.getPropertyValue('--msfit') || '1') + '/' + (b.style.zoom || '1');
    });
    const 넘 = await pg.evaluate(() => {
      const s = document.querySelector('.slide.active'); return s.id + ' +' + (s.scrollHeight - s.clientHeight);
    });
    is(전 === 후, '  쪽을 네 번 넘겨도 s11 의 값이 <b>그대로</b>다 — ' + 전 + ' → ' + 후 +
      (전 === 후 ? '' : ' ← 들어올 때 다시 재면 움직이는 중인 길이를 읽습니다'));
    is(/\+([0-8])$/.test(넘), '  넘겨 온 쪽이 <b>여전히 든다</b> — ' + 넘 + 'px');
    await ctx.close();
  }

  head('[6] ★ <b>창 크기가 바뀌면 다시 맞춘다</b>');
  {
    const { ctx, pg } = await 열기(1920, 1080);
    const 전 = await pg.evaluate(() => {
      const s = document.getElementById('s11');
      return { 손: s.style.getPropertyValue('--msfit') !== '', 넘침: s.scrollHeight - s.clientHeight };
    });
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.waitForTimeout(900);
    const 후 = await pg.evaluate(() => {
      const s = document.getElementById('s11'), b = s.querySelector('.slide-content');
      return { 손: s.style.getPropertyValue('--msfit') !== '' || !!b.style.zoom, 넘침: s.scrollHeight - s.clientHeight };
    });
    is(!전.손 && 전.넘침 <= 8, '    1920×1080 에서는 s11 을 안 건드렸고 들었다 (넘침 ' + 전.넘침 + 'px)');
    is(후.손 && 후.넘침 <= 8,
      '  ★ 창을 1366×768 로 줄이자 <b>다시 맞췄다</b> — 넘침 ' + 후.넘침 + 'px' +
      (후.손 ? '' : ' ← 창이 바뀌었는데 안 다시 쟀습니다'));
    is(/addEventListener\(\s*['"]resize['"]/.test(소스) && /msFitAll/.test(소스),
      '    창 크기를 듣는 자리가 소스에 있다 (resize → msFitAll)');
    await ctx.close();
  }

  head('[7] ★ 조용한가 · <b>서버</b> 요청 0 (7번)');
  const 터 = [...new Set(터짐)];
  is(터.length === 0, '  터진 곳이 없다' + (터.length ? (' ← ' + 터.slice(0, 2).join(' / ')) : ''));
  const 서버로 = 바깥.filter(u => /supabase|netlify|\/api\/|\/functions\//i.test(u));
  is(서버로.length === 0, '  <b>서버</b>로 나가려 한 요청 <b>' + 서버로.length + '건</b>' +
    (서버로.length ? ('\n        ← ' + 서버로.slice(0, 3).join('\n        ← ')) : ''));
  if (바깥.length) console.log('      (막은 바깥 요청 ' + 바깥.length + '건 — ' +
    [...new Set(바깥.map(u => u.replace(/^https?:\/\//, '').split('/')[0]))].slice(0, 4).join(' · ') + ')');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad
    ? ('✗ ' + bad + '군데 — 고객 앞에서 쪽 아랫부분이 잘립니다')
    : '✓ 장 표지가 어느 창에서도 한 화면에 들고, 드는 쪽은 안 건드립니다 (판 X485)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.message)); process.exit(2); });
