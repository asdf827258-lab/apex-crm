/* 🖥 <b>컴퓨터 화면이 목각과 같은가 — 그리고 폰은 한 픽셀도 안 변했는가.</b>

   사장님 말씀 (2026-09-28) — 「목각하고 디자인이 조금씩 다르다」.

   까닭은 하나였습니다. app/ui.css 는 <b>폰 목각에서 떠 온 값</b>입니다
   (그 파일 머리말에 그렇게 적혀 있습니다). 그 폰 치수를 1440px 화면에도
   그대로 써서 글씨가 0.5~1px 작고 칸이 1~4px 좁습니다. 한 군데씩은 티가
   안 나는데 <b>스물네 자리가 겹쳐</b> 화면이 달라 보입니다.

   여기서 확인합니다.
     1. <b>1440px</b> 에서 목각 치수로 서는가 (카드·동그라미·이름·딱지·알림·줄)
     2. ★★ <b>390px 에서는 한 픽셀도 안 변했는가</b> — 이것이 제일 중요합니다.
        기능을 더하려다 <b>폰을 깨면</b> 설계사가 고객 앞에서 쓰는 화면이 깨집니다.
     3. 넓은 화면에서도 <b>누르는 것은 44px 이상</b>인가 (철칙)
     4. 넓은 화면 덩어리가 <b>새 class 를 안 만들었는가</b> — 있는 이름만 쓰는가
     5. 알림칸 안 <b>굵은 글자</b>가 한 톤 더 진한가 (목각 .note b) · 대비 4.5 이상

   ★ 값은 <b>목각에서 옮긴 것</b>이라 여기에 손으로 적습니다. 그래야 다음에
     누가 바꾸면 이 자가 「목각과 달라졌다」 고 말해 줍니다.
   ★ <b>재는 것이지 짐작하지 않습니다</b> — 두 크기로 실제로 띄워 브라우저가
     계산한 값을 읽습니다. CSS 글만 보면 우선순위에 눌려 <b>안 먹는 줄</b>을
     못 봅니다(실제로 목각 덩어리의 .t-nm·.t-mt 가 그랬습니다).           */

const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const CSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const px = (v) => Math.round(parseFloat(v) * 100) / 100;

/* [이름, 무엇, 폰(390) 값, 컴퓨터(1440) 값] — 값은 목각에서 옮긴 것 */
const WANT = [
  ['card',  '카드 안쪽 위아래',  'paddingTop',   20,   22],
  ['card',  '카드 안쪽 좌우',    'paddingLeft',  20,   24],
  ['av',    '목록 동그라미 너비', 'width',        40,   42],
  ['nm',    '이름 글씨',         'fontSize',     15,   15.5],
  ['mt',    '이름 밑 글씨',      'fontSize',     12.5, 13],
  ['tag',   '딱지 글씨',         'fontSize',     10.5, 11.5],
  ['lab',   '머리 글씨',         'fontSize',     11.5, 12],
  ['note',  '알림칸 글씨',       'fontSize',     12.5, 13.5],
  ['btn',   '큰 단추 높이',      'height',       56,   48],
  ['ev',    '타임라인 사이',     'gap',          11,   14],
];

const HTML = '<!doctype html><html><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' +
  '<div class="t-card" id="card">' +
    '<div class="t-lab" id="lab">머리</div>' +
    '<div class="t-row"><span class="av" id="av">홍</span>' +
      '<span class="m"><span class="nm" id="nm">홍길동</span>' +
      '<span class="mt" id="mt">아래 글씨</span></span>' +
      '<span class="r"><span class="t-tag ok" id="tag">딱지</span>' +
      '<button class="t-chip" id="chip">칩</button></span></div>' +
    '<div class="t-note" id="note">알림 <b id="noteb">굵게</b></div>' +
    '<button class="t-btn" id="btn">큰 단추</button>' +
    '<button class="t-btn sm" id="btnsm">작은 단추</button>' +
    '<div class="t-ev" id="ev"><span class="d">d</span><span class="t">t</span></div>' +
  '</div></body></html>';

const READ = () => {
  const g = (id) => document.getElementById(id);
  const cs = (id) => getComputedStyle(g(id));
  const o = {};
  ['card', 'av', 'nm', 'mt', 'tag', 'lab', 'note', 'btn', 'ev'].forEach(k => {
    const s = cs(k);
    o[k] = { paddingTop: s.paddingTop, paddingLeft: s.paddingLeft, width: s.width,
             fontSize: s.fontSize, height: s.height, gap: s.columnGap };
  });
  o.avR = cs('av').borderTopLeftRadius;
  o.noteFg = cs('note').color; o.notebFg = cs('noteb').color; o.noteBg = cs('note').backgroundColor;
  o.hit = ['chip', 'btnsm', 'btn'].map(k => ({ k: k, h: Math.round(g(k).getBoundingClientRect().height) }));
  return o;
};

(async () => {
  console.log('\n🖥 컴퓨터 화면이 목각과 같은가 — 폰은 안 변했는가');
  const browser = await chromium.launch();
  const wide = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const nar  = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pw = await wide.newPage(), pn = await nar.newPage();
  await pw.setContent(HTML); await pn.setContent(HTML);
  const W = await pw.evaluate(READ), N = await pn.evaluate(READ);
  await browser.close();

  console.log('\n[1] 1440px 에서 목각 치수로 선다');
  WANT.forEach(([k, 이름, prop, , want]) => {
    const got = px(W[k][prop]);
    is(got === want, '  ' + 이름 + ' — ' + got + 'px (목각 ' + want + ')');
  });

  console.log('\n[2] ★★ 390px 에서는 한 픽셀도 안 변했다 — 폰을 깨면 안 됩니다');
  WANT.forEach(([k, 이름, prop, want]) => {
    const got = px(N[k][prop]);
    is(got === want, '  ' + 이름 + ' — ' + got + 'px (전과 같아야 함 ' + want + ')');
  });

  console.log('\n[3] 넓은 화면에서도 누르는 것은 44px 이상이다 (철칙)');
  W.hit.forEach(h => is(h.h >= 44, '  ' + h.k + ' — ' + h.h + 'px'));
  N.hit.forEach(h => is(h.h >= 44, '  폰 ' + h.k + ' — ' + h.h + 'px'));

  console.log('\n[4] 넓은 화면 덩어리가 새 class 를 안 만들었다');
  /* @media (min-width:901px) 안의 선택자가 <b>바깥에도 있는</b> 이름인가.
     새 이름이 여기서만 태어나면 목각에 없는 것을 지어낸 것입니다 (1번·5번). */
  const i0 = CSS.indexOf('@media (min-width:901px){');
  is(i0 >= 0, '  넓은 화면 덩어리가 있다');
  const blk = CSS.slice(i0, CSS.indexOf('\n}', i0));
  const outside = CSS.slice(0, i0);
  const names = [];
  (blk.replace(/\/\*[\s\S]*?\*\//g, ' ').match(/\.t-[a-z0-9-]+/g) || [])
    .forEach(n => { if (names.indexOf(n) < 0) names.push(n); });
  const 새것 = names.filter(n => outside.indexOf(n + '{') < 0 && outside.indexOf(n + ' ') < 0 &&
                                  outside.indexOf(n + ',') < 0 && outside.indexOf(n + ':') < 0);
  is(새것.length === 0, '  쓴 이름 ' + names.length + '개가 <b>전부 바깥에도 있다</b> — ' + names.join(' · ') +
     (새것.length ? '\n      ✗ 여기서만 태어난 이름: ' + 새것.join(' · ') : ''));
  is(blk.indexOf('#') < 0, '  덩어리 안에 <b>hex 를 직접 안 적었다</b> (색표는 한 곳)');

  console.log('\n[5] 알림칸 안 굵은 글자가 한 톤 더 진하다 — 목각 .note b');
  const rgb = (s) => (s.match(/\d+/g) || []).slice(0, 3).map(Number);
  const hex = (s) => '#' + rgb(s).map(x => ('0' + x.toString(16)).slice(-2)).join('').toUpperCase();
  const lum = (c) => { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const ratio = (f, b) => { const L1 = lum(rgb(f)), L2 = lum(rgb(b));
    return Math.round(((Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05)) * 100) / 100; };
  is(hex(W.notebFg) !== hex(W.noteFg),
     '  굵은 글자 ' + hex(W.notebFg) + ' 가 보통 글자 ' + hex(W.noteFg) + ' 와 <b>다르다</b>');
  is(hex(W.notebFg) === '#7A4E0A', '  목각 값 #7A4E0A 이다 — ' + hex(W.notebFg));
  const r = ratio(W.notebFg, W.noteBg);
  is(r >= 4.5, '  읽힌다 — ' + hex(W.notebFg) + ' on ' + hex(W.noteBg) + ' 대비 <b>' + r + '</b>');
  is(hex(N.notebFg) === hex(W.notebFg), '  폰에서도 같은 색이다 — ' + hex(N.notebFg));

  console.log('\n[6] 목록 동그라미 모서리는 두 크기에서 모두 14px (목각)');
  is(px(W.avR) === 14, '  1440px — ' + px(W.avR) + 'px');
  is(px(N.avR) === 14, '  390px — ' + px(N.avR) + 'px');

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 화면이 목각과 다르거나, 폰이 깨졌습니다.'); process.exit(1); }
  console.log('✓ 1440px 은 목각 치수로 서고, 390px 은 한 픽셀도 안 변했습니다.');
})().catch(e => { console.error(e); process.exit(1); });
