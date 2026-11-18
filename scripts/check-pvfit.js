/* ══════════════════════════════════════════════════════════════════
   check-pvfit.js — <b>발표 쪽을 한 화면에 맞추는 장치가 제대로 도나.</b>
   (판 X484 · 2026-11-18)

   사장님 말씀 2026-11-18 「<b>발표 넘치는 쪽부터 하고, 칸 / 글씨를
   조정해서 맞추어서</b> 해줘」.

   ── 무엇을 보는 자인가 ───────────────────────────────────────────
   <b>넘치는 쪽이 몇인가</b>는 check-pvnote 가 셉니다(PV_OVER_NOTE).
   이 자는 그 수를 또 세지 않습니다 — <b>같은 것을 두 곳에서 묻지
   않습니다</b> (CLAUDE.md 5번). 이 자는 <b>맞추는 장치</b>를 봅니다.
   수만 보면 「전부 쪼그라뜨려」 도 0쪽이 되는데, 그러면 사장님 말씀
   「뒷자리에서 읽히게」(판 X313)가 조용히 깨집니다.

   ── 재다가 찾은 것 둘 (둘 다 이 자가 지킵니다) ───────────────────
   ① <b>바닥을 이기고 있던 자리</b> — 지시문(.dir)이 발표에서도 13px 로
      찍혔습니다. 기본 CSS 의 선택자가 17px 바닥보다 무거웠습니다.
      <b>처음부터 그랬고</b>, 글씨를 조정하다 재어 보고 알았습니다.
   ② <b>전환 중인 길이를 재고 있었습니다</b> — 이 파일은 .check li·.btn·
      .chip 에 transition:.12s 가 있어 글씨가 0.12초에 걸쳐 줄어듭니다.
      그 사이에 재면 <b>아직 긴 길이</b>가 잡혀 필요 이상으로 줄입니다.
      181쪽이 <b>5ms 에 +81px · 60ms 에 0px</b> 이었고, 그래서 바닥
      (×0.78)까지 내려가 있었습니다. 멈추고 재니 <b>×0.85</b> 로 끝났습니다.
      ★ 이것은 <b>check-pvnote 가 18ms 에 재어 빨간불을 켰기에</b> 들켰습니다.
        제 자는 90ms 에 재어 「0쪽」 이라고 적고 있었습니다 — 자를 먼저
        의심했어야 했습니다.

   ── 보는 것 ──────────────────────────────────────────────────────
     [1] ★★ <b>손댄 쪽은 모두 원래 넘쳤다</b> — 이미 드는 쪽을 괜히
            줄이지 않는다 (손잡이를 1 로 되돌려 재어 확인)
     [2] ★★ <b>17px 바닥을 안 뚫는다</b> — 발표 전 쪽에 17px 아래 글자 0개
     [3] ★★ 바닥값은 <b>--pvmin 한 곳</b>에만 · 손잡이가 곱하는 글씨 규칙은
            <b>전부</b> max(var(--pvmin), …) 를 쓴다 (구조적 보장)
     [4] ★★ <b>재는 동안 애니메이션을 멈춘다</b> — 쪽에 들어선 순간의 길이와
            가라앉은 뒤의 길이가 같다 (위 ②를 지키는 자)
     [5] ★ 책(스크롤)·인쇄는 <b>한 글자도 안 바뀐다</b> — 규칙이 전부 body.pv 안
     [6] ★ 재는 칸(.pvmeas)이 <b>화면에 남지 않는다</b>
     [7] ★ 조용한가 · <b>서버 요청 0</b> (7번)
   ⚠ 창은 <b>1600×900</b> — check-pvnote 와 같은 자리에서 잽니다. 창이
     달라지면 쪽이 다시 쪼개져 견줄 수 없습니다.
   ⚠ [1]·[4] 는 <b>손댄 쪽만</b> 다시 잽니다 — 331쪽을 두 번 돌면 자가
     너무 느려집니다. 안 건드린 쪽이 넘치는지는 check-pvnote 가 봅니다.
   ⚠ [4] 를 재는 동안 <b>제 자는 전환을 안 끕니다</b> — 끄면 바로 그 버그를
     못 봅니다. [1] 에서만 <b>자가 제 손으로</b> 끕니다 (앱의 .pvmeas 와
     따로 — 앱 것이 지워져도 자가 흔들리지 않게).
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = process.cwd();
const FILE = 'app/상담자료/미끼상품_접촉전략.html';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const 소스 = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
const CSS = (소스.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('\n');

let bad = 0;
const is = (ok, m) => { if (!ok) bad++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); };
const head = (t) => console.log('\n' + t);

/* ── 규칙을 하나씩 떼어 본다 (평평한 CSS · @media 겉은 저절로 건너뛴다) ── */
function 규칙들() {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(CSS))) out.push({ 고름: m[1].trim(), 속: m[2] });
  return out;
}

const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

(async () => {
  console.log('══ 발표 맞추기 점검 (판 X484) ══');

  /* ────────────────────────────────────────────────────────────────
     [3] 바닥값은 한 곳에만 · 손잡이 글씨 규칙은 전부 바닥을 가진다 (정적)
     ──────────────────────────────────────────────────────────────── */
  head('[3] ★★ 바닥값은 <b>한 곳(--pvmin)</b>에만 · 손잡이 글씨 규칙은 전부 바닥을 가진다');
  const 바닥선언 = CSS.match(/--pvmin\s*:\s*([0-9.]+)px/g) || [];
  is(바닥선언.length === 1,
    '  바닥값이 <b>한 곳</b>에만 적혀 있다 (' + 바닥선언.length + '곳)' +
    (바닥선언.length !== 1 ? ' ← 두 곳에 두면 한쪽만 고쳐지는 날이 옵니다 (5번)' : ''));
  const 바닥값 = 바닥선언.length ? parseFloat(바닥선언[0].replace(/[^0-9.]/g, '')) : 0;
  is(바닥값 >= 17,
    '  바닥이 <b>' + 바닥값 + 'px</b> — 17px 이상 (사장님 말씀 「뒷자리에서 읽히게」 · 판 X313)');

  /* 손잡이를 곱하는 글씨 규칙을 전부 모아, 하나하나 바닥을 가졌나 본다 */
  const 글씨규칙 = (CSS.match(/font-size\s*:[^;}]*var\(--pvfit\)[^;}]*/g) || []);
  const 바닥없는 = 글씨규칙.filter(r => r.indexOf('max(var(--pvmin)') < 0);
  is(글씨규칙.length >= 10,
    '    손잡이가 곱하는 글씨 규칙 <b>' + 글씨규칙.length + '가지</b> (10 아래면 이 자가 덜 보는 것입니다)');
  is(바닥없는.length === 0,
    '  ★★ 그 <b>전부</b>가 max(var(--pvmin), …) 를 쓴다 — 배수를 내려도 구조적으로 바닥 밑으로 못 간다' +
    (바닥없는.length ? ('\n        ← 바닥 없는 것 ' + 바닥없는.length + '가지: ' + 바닥없는.slice(0, 3).join(' / ')) : ''));

  /* ────────────────────────────────────────────────────────────────
     [5] 책(스크롤)·인쇄는 안 바뀐다 — 규칙이 전부 body.pv 안 (정적)
     ──────────────────────────────────────────────────────────────── */
  head('[5] ★ 책(스크롤)·인쇄는 <b>한 글자도 안 바뀐다</b> — 규칙이 전부 body.pv 안');
  const 관련 = 규칙들().filter(r =>
    r.속.indexOf('var(--pvfit)') >= 0 || r.속.indexOf('--pvmin:') >= 0 ||
    r.속.indexOf('--pvfit:') >= 0 ||
    r.고름.indexOf('pvtight') >= 0 || r.고름.indexOf('pvmeas') >= 0);
  const 밖으로 = 관련.filter(r => !/\bbody\.pv\b/.test(r.고름));
  is(관련.length >= 12, '    발표 맞추기 규칙 <b>' + 관련.length + '가지</b>를 찾았다');
  is(밖으로.length === 0,
    '  ★ 그 <b>전부</b>가 body.pv 안에 있다 — 책·인쇄에는 한 톨도 안 닿는다' +
    (밖으로.length ? ('\n        ← 밖에 있는 것: ' + 밖으로.slice(0, 3).map(r => r.고름.slice(0, 60)).join(' / ')) : ''));

  /* ────────────────────────────────────────────────────────────────
     브라우저로 — 실제로 발표를 돌며 잰다
     ──────────────────────────────────────────────────────────────── */
  await new Promise(r => srv.listen(0, r));
  const P = srv.address().port;
  const br = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 1600, height: 900 } });
  const 바깥 = [];
  /* ⚠ 사장님 진짜 서버는 한 번도 안 부릅니다 (7번·8번) — 바깥은 전부 막고,
     무엇이 나가려 했는지 적어 둡니다. 이 덱은 글꼴(Pretendard · jsDelivr)을
     바깥에서 가져오는데 그것은 <b>서버 호출이 아닙니다</b> — 막힌 것을 전부
     빨간불로 치면 헛것을 잡는 자가 됩니다 (8번). 아래에서 <b>서버</b>로
     나가려 한 것만 셉니다. */
  await ctx.route('**://**', r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:' + P) >= 0) return r.continue();
    바깥.push(u); return r.abort();
  });
  const pg = await ctx.newPage();
  const 터짐 = [];
  pg.on('pageerror', e => 터짐.push(String(e).slice(0, 110)));
  await pg.goto('http://127.0.0.1:' + P + '/' + FILE.split('/').map(encodeURIComponent).join('/'), { waitUntil: 'load' });
  await pg.waitForTimeout(2600);
  await pg.keyboard.press('p'); await pg.waitForTimeout(1300);   /* 발표 */
  await pg.keyboard.press('n'); await pg.waitForTimeout(400);    /* 강사 노트 — 사장님이 실제로 발표하는 상태 */

  const n = await pg.evaluate(() => document.querySelectorAll('#pvItems .pv-i').length);

  /* ── 한 바퀴: 쪽마다 상태·제일 작은 글씨를 적는다 ── */
  const 잼 = () => pg.evaluate(() => {
    const s = document.querySelector('section.wrap.pon');
    if (!s) return null;
    let 최소 = 999, 어디 = '', 글 = '';
    const all = s.querySelectorAll('*');
    for (const e of all) {
      let 제글 = '';
      for (const c of e.childNodes) if (c.nodeType === 3) 제글 += c.nodeValue;
      if (제글.trim().length < 2) continue;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
      const b = e.getBoundingClientRect();
      if (b.height < 2 || b.width < 2) continue;
      const f = parseFloat(cs.fontSize);
      if (f > 0 && f < 최소) {
        최소 = f;
        어디 = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + String(e.className).trim().split(/\s+/)[0] : '');
        글 = 제글.trim().slice(0, 20);
      }
    }
    return {
      쪽: ((document.getElementById('pvNum') || {}).innerText || '').split('/')[0].trim(),
      이름: ((document.getElementById('pvTitle') || {}).innerText || '').slice(0, 34),
      넘침: s.scrollHeight - s.clientHeight,
      손잡이: s.style.getPropertyValue('--pvfit') || '',
      조임: s.classList.contains('pvtight'),
      재는중: s.classList.contains('pvmeas'),
      최소: Math.round(최소 * 10) / 10, 어디: 어디, 글: 글
    };
  });

  const 모음 = [];
  for (let i = 0; i < n; i++) {
    await pg.waitForTimeout(16);
    const r = await 잼();
    if (r) { r.i = i; 모음.push(r); }
    await pg.keyboard.press('ArrowRight');
  }

  const 손댐 = 모음.filter(p => p.손잡이 || p.조임);
  const 작은것 = 모음.filter(p => p.최소 < 17);

  head('[2] ★★ <b>17px 바닥을 안 뚫는다</b> — 발표 ' + 모음.length + '쪽 전부');
  is(모음.length >= 300, '    쪽 <b>' + 모음.length + '개</b>를 돌았다 (300 아래면 이 자가 덜 보는 것입니다)');
  is(작은것.length === 0,
    '  ★★ 17px 아래로 찍힌 글자가 <b>0개</b>다' +
    (작은것.length ? ('\n        ← ' + 작은것.slice(0, 4).map(p =>
      p.쪽 + '쪽 ' + p.어디 + ' ' + p.최소 + 'px 「' + p.글 + '」').join('\n        ← ')) : ''));
  const 제일작은 = 모음.reduce((a, p) => p.최소 < a.최소 ? p : a, { 최소: 999, 쪽: '-', 어디: '-' });
  console.log('      제일 작아진 글씨 <b>' + 제일작은.최소 + 'px</b> (' + 제일작은.쪽 + '쪽 ' + 제일작은.어디 + ')');

  head('[6] ★ 재는 칸(.pvmeas)이 <b>화면에 남지 않는다</b>');
  const 남음 = 모음.filter(p => p.재는중);
  is(남음.length === 0,
    '  재는 칸이 남은 쪽 <b>' + 남음.length + '쪽</b> — pvFit 이 끝나면서 벗는다' +
    (남음.length ? (' ← ' + 남음.slice(0, 3).map(p => p.쪽 + '쪽').join(' ')) : ''));

  /* ── 손댄 쪽만 다시: 정말 넘쳤나 · 가라앉은 뒤에도 같은가 ── */
  head('[1] ★★ <b>손댄 쪽은 모두 원래 넘쳤다</b> — 이미 드는 쪽을 괜히 줄이지 않는다');
  console.log('      ' + 모음.length + '쪽 가운데 손댄 쪽 <b>' + 손댐.length + '쪽</b> (' +
    모음.filter(p => p.손잡이).length + '쪽은 글씨까지 · ' +
    모음.filter(p => p.조임 && !p.손잡이).length + '쪽은 칸만) — 나머지 ' +
    (모음.length - 손댐.length) + '쪽은 한 톨도 안 건드렸다');
  is(손댐.length > 0, '    손댄 쪽이 있다 (0이면 장치가 아예 안 도는 것입니다)');

  const 헛손질 = [], 안가라앉음 = [];
  for (const p of 손댐) {
    /* 그 쪽으로 바로 뛴다 */
    await pg.evaluate((i) => {
      const it = document.querySelectorAll('#pvItems .pv-i');
      if (it[i]) it[i].click();
    }, p.i);
    /* [4] 들어선 순간과 가라앉은 뒤가 같은가 — 자는 전환을 안 끈다 */
    const a = await pg.evaluate(() => {
      const s = document.querySelector('section.wrap.pon');
      return { 넘침: s.scrollHeight - s.clientHeight, 쪽: ((document.getElementById('pvNum') || {}).innerText || '').split('/')[0].trim() };
    });
    await pg.waitForTimeout(320);
    const b = await pg.evaluate(() => {
      const s = document.querySelector('section.wrap.pon');
      return { 넘침: s.scrollHeight - s.clientHeight };
    });
    if (Math.abs(a.넘침 - b.넘침) > 2)
      안가라앉음.push(p.쪽 + '쪽 들어선 순간 +' + a.넘침 + 'px → 가라앉아 +' + b.넘침 + 'px');
    /* [1] 손잡이를 1 로 되돌려 원래 길이를 본다 — 자가 제 손으로 전환을 끈다 */
    const 자연 = await pg.evaluate(() => {
      const s = document.querySelector('section.wrap.pon');
      let st = document.getElementById('pvfitChkNofx');
      if (!st) {
        st = document.createElement('style'); st.id = 'pvfitChkNofx';
        st.textContent = '*,*::before,*::after{transition:none !important;animation:none !important}';
        document.head.appendChild(st);
      }
      s.classList.remove('pvtight');
      s.style.setProperty('--pvfit', '1');
      const v = s.scrollHeight - s.clientHeight;
      st.remove();
      return v;
    });
    if (자연 <= 8) 헛손질.push(p.쪽 + '쪽 「' + p.이름 + '」 원래 넘침 ' + 자연 + 'px');
  }
  is(헛손질.length === 0,
    '  ★★ 손댄 ' + 손댐.length + '쪽이 <b>모두 원래 넘쳤다</b> — 괜히 작아진 쪽 0' +
    (헛손질.length ? ('\n        ← ' + 헛손질.slice(0, 4).join('\n        ← ')) : ''));

  head('[4] ★★ <b>재는 동안 애니메이션을 멈춘다</b> — 들어선 순간과 가라앉은 뒤의 길이가 같다');
  is(안가라앉음.length === 0,
    '  길이가 늦게 가라앉는 쪽 <b>' + 안가라앉음.length + '쪽</b> — 전환 중인 길이를 재면 필요 이상으로 줄입니다' +
    (안가라앉음.length ? ('\n        ← ' + 안가라앉음.slice(0, 4).join('\n        ← ')) : ''));

  /* ── 책(스크롤)으로 나와서 — 손잡이가 정말 죽어 있나 ── */
  head('[5-2] ★ 책(스크롤)에서 손잡이가 <b>죽어 있다</b>');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(600);
  const 책 = await pg.evaluate(() => {
    const 손댄 = document.querySelector('section.wrap[style*="--pvfit"]');
    const 안댄 = [].slice.call(document.querySelectorAll('section.wrap'))
      .filter(s => !s.getAttribute('style') || s.getAttribute('style').indexOf('--pvfit') < 0)[0];
    return {
      발표중: document.body.classList.contains('pv'),
      손댄있나: !!손댄,
      손댄글씨: 손댄 ? Math.round(parseFloat(getComputedStyle(손댄).fontSize) * 10) / 10 : 0,
      안댄글씨: 안댄 ? Math.round(parseFloat(getComputedStyle(안댄).fontSize) * 10) / 10 : 0,
      재는칸: document.querySelectorAll('.pvmeas').length,
      조임칸: document.querySelectorAll('section.wrap.pvtight').length
    };
  });
  is(!책.발표중, '  발표에서 나왔다 (ESC)');
  is(책.손댄있나, '    손잡이를 내려 둔 장이 남아 있다 (없으면 이 자가 못 재는 것입니다)');
  is(책.손댄있나 && 책.손댄글씨 === 책.안댄글씨,
    '  ★ 손잡이를 내려 둔 장과 안 내린 장의 글씨가 <b>같다</b> (' +
    책.손댄글씨 + 'px = ' + 책.안댄글씨 + 'px) — 책에서는 손잡이가 안 먹는다');
  is(책.재는칸 === 0, '  재는 칸(.pvmeas)이 책에도 안 남았다 (' + 책.재는칸 + '개)');

  head('[7] ★ 조용한가 · <b>서버</b> 요청 0 (7번)');
  const 터 = [...new Set(터짐)];
  is(터.length === 0, '  터진 곳이 없다' + (터.length ? (' ← ' + 터.slice(0, 2).join(' / ')) : ''));
  const 서버로 = 바깥.filter(u => /supabase|netlify|\/api\/|\/functions\//i.test(u));
  is(서버로.length === 0,
    '  <b>서버</b>로 나가려 한 요청 <b>' + 서버로.length + '건</b> — 사장님 서버를 안 부른다' +
    (서버로.length ? ('\n        ← ' + 서버로.slice(0, 3).join('\n        ← ')) : ''));
  console.log('      (막은 바깥 요청 ' + 바깥.length + '건 — 글꼴입니다: ' +
    [...new Set(바깥.map(u => u.replace(/^https?:\/\//, '').split('/')[0]))].join(' · ') + ')');

  await br.close(); srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad
    ? ('✗ ' + bad + '군데 — 맞추는 장치가 믿을 수 없는 상태입니다')
    : '✓ 넘치는 쪽만, 그 쪽이 필요한 만큼만 줄이고, 17px 바닥은 안 뚫립니다 (판 X484)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('터짐: ' + (e && e.message)); process.exit(2); });
