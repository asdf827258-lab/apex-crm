#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   환율은 한 곳에서만 · 원화가 먼저

   재무설계 계산기에 1,380 이라는 숫자가 <b>다섯 곳</b>에 따로 박혀
   있었습니다. 한 곳을 고쳐도 나머지 넷은 옛 환율로 계산해서, 같은
   화면 안에서 숫자가 갈렸습니다.

   더 나쁜 것은 그 칸에 <b>「현재 원/달러」</b>라고 적혀 있던 것입니다.
   실제로는 코드에 박아 둔 값이라 오늘 환율이 아닙니다 — 지어낸 값을
   사실처럼 적으면 고객이 그것을 사실로 믿습니다 (1번).

   그리고 금액은 <b>원화가 먼저</b>여야 합니다. 고객은 앞 숫자를 먼저
   읽는데 그것이 달러면 크기를 가늠하는 사이 설명이 지나갑니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(process.cwd(), 'app/finance.html'), 'utf8');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('\n[1] 환율을 아는 곳이 하나인가 (5번)');
['fxNow', 'fxTgt', 'fxSet', 'fxRate', 'fxSync', 'fxNoteHtml'].forEach(f => {
  const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
  is(c === 1, f + '() 가 ' + c + '곳에 있다' + (c === 1 ? '' : ' — 하나여야 합니다'));
});

console.log('\n[2] 1,380 을 다른 데 또 박아 두지 않았나');
/* 자리표는 FX_SEED 한 줄에만 있어야 합니다 */
const hits = SRC.split('\n')
  .map((l, i) => ({ l, i: i + 1 }))
  .filter(x => /\b1380\b/.test(x.l) && !/FX_SEED/.test(x.l));
is(hits.length === 0, hits.length
  ? ('환율 1380 이 아직 ' + hits.length + '곳에 박혀 있습니다 — ' + hits.map(x => x.i + '줄').join(', '))
  : '자리표는 <b>FX_SEED 한 줄</b>에만 있다');
const seed = (SRC.match(/var FX_SEED=/g) || []).length;
is(seed === 1, '자리표를 두는 자리도 하나다');

console.log('\n[3] 박아 둔 값을 「지금 환율」이라고 말하지 않나 (1번)');
is(/아직 안 넣으신 기본값/.test(SRC),
   '안 넣었으면 <b>「아직 안 넣으신 기본값」</b>이라고 적는다');
is(/이 값으로 계산한 환차익은 <b>사실이 아닙니다/.test(SRC),
   '그 값으로 잰 환차익이 <b>사실이 아니라고</b> 못 박는다');
is(/fxWhen\(\)/.test(SRC) && /에 넣으신 값/.test(SRC),
   '<b>언제 넣은 값인지</b> 같이 적는다 — 두 달 전 환율인 줄 모르면 더 위험하다');
is(!/value="1380"/.test(SRC) && !/value="1500"/.test(SRC),
   '입력칸에 <b>박아 둔 기본값을 써 놓지 않는다</b>');

console.log('\n[4] 표기는 원화가 먼저인가');
const m = SRC.match(/function usdKrw\(usdAmt,opt\)\{[\s\S]{0,700}?\n\}/);
is(!!m, 'usdKrw() 를 찾았다');
if (m) {
  const body = m[0];
  const shortLine = (body.match(/if\(opt==='short'\)[^\n]*/) || [''])[0];
  const longLine = (body.match(/\n\s*return icMan[^\n]*/) || [''])[0];
  is(/^\s*if\(opt==='short'\) return man\./.test(shortLine),
     '짧은 표기가 <b>원화로 시작</b>한다 — 「1,656만원 ($120,000)」');
  is(/return icMan\(man\)/.test(longLine),
     '긴 표기도 <b>원화로 시작</b>한다');
  is(/\$'\+u\.toLocaleString/.test(body), '달러는 <b>따로</b> 옆에 적는다 — 빼지는 않는다');
}

console.log('\n[5] 돈을 넣는 칸은 원화(만원)인가');
/* 달러로 넣게 하는 칸이 있으면 여기서 걸립니다 */
const dollarInputs = SRC.split('\n').filter(l =>
  /<label>[^<]*(달러|USD|\$)[^<]*<\/label>/.test(l) &&
  /type="number"/.test(l) &&
  !/원\/달러|예상 환율|지금 환율|현재 환율/.test(l));
is(dollarInputs.length === 0, dollarInputs.length
  ? ('달러로 넣게 하는 칸이 ' + dollarInputs.length + '개 있습니다 — ' + dollarInputs[0].trim().slice(0, 70))
  : '금액은 전부 <b>원화(만원)</b>로 넣는다 — 환율 칸만 예외');
is(/월 납입\(만원\)/.test(SRC), '달러보험도 <b>월 납입(만원)</b>으로 받는다');

console.log('\n[6] 한 곳을 고치면 모든 화면이 같이 바뀌나');
is(/dkNum\('d_rate_now',fxNow\(\)\)/.test(SRC), '상담 덱이 같은 곳을 본다');
is(/usd:fxNow\(\), usdt:fxTgt\(\)/.test(SRC), '비교표가 같은 곳을 본다');
is(/usd:0,usdt:0/.test(SRC), '변액 설정도 박아 두지 않고 <b>fxNow() 가 채운다</b>');
is(/function fxRate\(\)\{ return fxNow\(\); \}/.test(SRC), 'fxRate() 는 fxNow() 로 넘길 뿐이다');
is(/fxSync\(\);\s*\/\* 환율 칸을/.test(SRC), '화면을 그릴 때마다 <b>칸을 지금 값으로</b> 맞춘다');

console.log('\n' + '─'.repeat(30));
if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
console.log('환율 점검 통과 — ' + n + '가지. 한 곳에서 고치면 모든 화면이 같이 바뀝니다.');
