/* ⚖️ <b>광고심의 색을 다른 데 갖다 쓰지 않는가</b> (S06).

   사장님 말씀 — 「--t-seal / --t-sealk 는 <b>광고심의 규정이 정한 색</b>입니다.
   건드리지 마십시오.」 ui.css 82행에도 규정 근거가 적혀 있습니다 —
   「유의사항을 색상 등을 차별화하여」(가이드라인 p18~21).

   <b>「건드리지 말라」 는 「다른 데 갖다 쓰지도 말라」 는 뜻입니다.</b>
   일반 알림칸(.t-note)이 그 색을 빌려 쓰고 있었습니다. 그대로 두면 심의
   색을 바꿔야 하는 날 <b>상관없는 알림칸 서른일곱 군데</b>가 같이 바뀌고,
   거꾸로 알림칸 색을 손보려다 <b>심의 색을 건드리게</b> 됩니다.

   ★ 고치면서 <b>새 색을 만들지 않았습니다.</b> 목각 .note 의 #8A5A12 는
     이미 --t-warn-d 라는 이름으로 있었습니다(ui.css 79행 · 대비 5.57).
     그때 이 한 자리만 옮겨 붙이기를 빠뜨린 것입니다. 새 이름을 또 세우면
     <b>같은 색이 두 이름</b>이 되어 쌍둥이가 됩니다 (5번) — [4] 가 봅니다.

   여기서 확인합니다.
     1. 심의 색을 쓰는 자리가 <b>심의 자리뿐</b>인가 — 새 차용자가 생기면 빨간불
     2. .t-note 가 <b>심의 색이 아니고</b> --t-warn-d 인가 (브라우저가 잰 값)
     3. .t-seal 은 <b>여전히</b> 심의 색인가 — 고치다 규정 쪽을 망가뜨리지 않았나
     4. 같은 색값을 <b>두 이름</b>이 쓰지 않는가 (5번)
     5. 알림칸 글자가 <b>읽히는가</b> — 바탕과 대비 4.5 이상                */

const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = process.cwd();
const CSS = fs.readFileSync(path.join(ROOT, 'app/ui.css'), 'utf8');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

/* 심의 색을 써도 되는 자리 — <b>심의 유의사항을 그리는 곳뿐</b>입니다.
   늘리려면 그것이 정말 심의 칸인지 먼저 따져 보십시오.            */
const SEAL_OK = [
  [':root',           '토큰을 세우는 자리'],
  ['.t-seal',         '심의 유의사항 상자'],
  ['.t-sl.seal',      '슬라이드의 심의 칸'],
  ['.t-sl.seal .sm',  '슬라이드 심의 칸의 작은 글씨'],
];

/* ★ 주석을 지우고 <b>규칙 단위</b>로 가릅니다 — 「선택자 { 알맹이 }」.
   처음에는 「그 줄 앞 세 줄에 허락된 선택자가 있나」 로 봤습니다.
   되돌려 보니 <b>안 울렸습니다</b> — .t-empty 가 바로 위 .t-seal 을 보고
   그냥 통과했습니다. 새 차용자를 잡는 것이 이 자의 <b>본업</b>인데 그것을
   못 잡았습니다. 「안 울리는 알람은 알람이 아닙니다」 (8번).            */
function rules(css) {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const out = [];
  let m;
  const re = /([^{}]+)\{([^{}]*)\}/g;
  while ((m = re.exec(bare))) {
    const sel = m[1].replace(/[\s\S]*[{}]/, '').trim().replace(/\s+/g, ' ');
    out.push({ sel: sel, body: m[2] });
  }
  return out;
}

(async () => {
  console.log('\n⚖️ 광고심의 색을 다른 데 갖다 쓰지 않는가 (S06)');

  console.log('\n[1] 심의 색을 쓰는 자리가 심의 자리뿐이다');
  const R1 = rules(CSS);
  const 쓰는것 = R1.filter(r => /--t-seal/.test(r.body));
  const 낯선 = 쓰는것.filter(r => SEAL_OK.every(k => k[0] !== r.sel));
  is(낯선.length === 0, '심의 색을 <b>빌려 쓰는 자리 0곳</b> — 쓰는 규칙 ' + 쓰는것.length + '개 전부 심의 자리' +
     (낯선.length ? 낯선.map(r => '\n      ✗ 「' + r.sel + '」 — ' + r.body.replace(/\s+/g, ' ').trim().slice(0, 80) +
        '\n        → 심의 칸이 아니면 <b>--t-warn-d</b> 같은 제 색을 쓰십시오.' +
        '\n          심의 칸이면 check-sealcolor.js 의 SEAL_OK 에 한 줄 적으십시오 (8번)').join('') : ''));
  SEAL_OK.forEach(k => is(쓰는것.some(r => r.sel === k[0]),
     '  ' + k[1] + '(' + k[0] + ') — 그대로 있다'));

  console.log('\n[4] 같은 색값을 두 이름이 쓰지 않는다 (5번)');
  /* 새 --t-warnk 를 또 세우면 여기서 걸립니다 — 색표는 한 곳입니다 */
  const rootSrc = CSS.slice(CSS.indexOf(':root{'), CSS.indexOf('\n}', CSS.indexOf(':root{')));
  const toks = [...rootSrc.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)]
    .map(x => ({ n: x[1], v: x[2].toUpperCase() }));
  const by = {}; toks.forEach(t => { (by[t.v] = by[t.v] || []).push(t.n); });
  const dup = Object.entries(by).filter(([, ns]) => ns.length > 1);
  is(dup.length === 0, '토큰 ' + toks.length + '개 · <b>같은 값을 두 이름이 쓰는 것 0개</b>' +
     (dup.length ? dup.map(([v, ns]) => '\n      ✗ ' + v + ' → ' + ns.join(' · ') +
        ' — 색표는 한 곳입니다. 있는 이름을 쓰십시오').join('') : ''));

  /* ── 브라우저가 실제로 그린 색을 잰다 ─────────────────────────────
     글로 적힌 var(...) 만 보면, 토큰 값이 바뀌었을 때를 못 봅니다.   */
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><head><meta charset="utf-8">' +
    '<style>' + CSS + '</style></head><body>' +
    '<div class="t-note" id="n">알림 <b>굵게</b></div>' +
    '<div class="t-seal" id="s">심의 유의사항</div>' +
    '</body></html>');
  const R = await page.evaluate(() => {
    const cs = (id, p) => getComputedStyle(document.getElementById(id))[p];
    const rv = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
    return { noteFg: cs('n', 'color'), noteBg: cs('n', 'backgroundColor'),
             sealFg: cs('s', 'color'), sealBg: cs('s', 'backgroundColor'),
             sealk: rv('--t-sealk'), warnd: rv('--t-warn-d') };
  });
  await browser.close();

  const rgb = (s) => (s.match(/\d+/g) || []).slice(0, 3).map(Number);
  const hex = (s) => { const c = rgb(s); return '#' + c.map(x => ('0' + x.toString(16)).slice(-2)).join('').toUpperCase(); };
  const lum = (c) => { const a = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; };
  const ratio = (f, b) => { const L1 = lum(rgb(f)), L2 = lum(rgb(b));
    return Math.round(((Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05)) * 100) / 100; };

  console.log('\n[2] 알림칸(.t-note)이 심의 색이 아니다 — 브라우저가 잰 값');
  is(hex(R.noteFg) !== R.sealk.toUpperCase(),
     '  심의 색 ' + R.sealk + ' 이 <b>아니다</b> — 알림칸은 ' + hex(R.noteFg));
  is(hex(R.noteFg) === R.warnd.toUpperCase(),
     '  <b>--t-warn-d</b>(' + R.warnd + ') 를 쓴다 — 새로 만든 색이 아니라 <b>이미 있던 이름</b>이다');

  console.log('\n[3] 심의 칸(.t-seal)은 여전히 규정 색이다 — 고치다 그쪽을 깨지 않았나');
  is(hex(R.sealFg) === R.sealk.toUpperCase(),
     '  글자색이 ' + hex(R.sealFg) + ' — 규정 색 그대로');
  is(rgb(R.sealBg).join() === rgb('rgb(255,249,236)').join(),
     '  바탕도 --t-seal(#FFF9EC) 그대로 — ' + hex(R.sealBg));

  console.log('\n[5] 알림칸 글자가 읽힌다 — 바탕과 대비 4.5 이상');
  const r1 = ratio(R.noteFg, R.noteBg);
  is(r1 >= 4.5, '  ' + hex(R.noteFg) + ' on ' + hex(R.noteBg) + ' — 대비 <b>' + r1 + '</b>' +
     (r1 >= 4.5 ? '' : ' ✗ 작은 글씨가 안 읽힙니다'));
  const r2 = ratio(R.sealFg, R.sealBg);
  is(r2 >= 4.5, '  심의 칸도 — ' + hex(R.sealFg) + ' on ' + hex(R.sealBg) + ' — 대비 <b>' + r2 + '</b>');

  console.log('\n──────────────────────────────');
  if (bad) { console.log('✗ ' + bad + '군데 — 심의 색을 빌려 쓰면, 심의 색을 바꾸는 날 상관없는 칸이 같이 바뀝니다.'); process.exit(1); }
  console.log('✓ 심의 색은 심의 자리에만 있습니다 — 알림칸은 이미 있던 --t-warn-d 를 씁니다 (새 색 0개).');
})().catch(e => { console.error(e); process.exit(1); });
