/* ═══════════════════════════════════════════════════════════════
   check-homev2.js — ✨ <b>새 「오늘」 화면이 옛 홈을 안 깨나</b> (판 X502)

   사장님 말씀 (2026-11-20) — 「새 홈을 만들어서 … 부작용이나 파일이 깨지는 경우를
   예측하고 시행해줘 그리고, 언제든 빽업할수 있도록 준비해줘」.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 기본은 <b>꺼짐</b> — 켠 기기(localStorage)에서만 새 화면, 끄면 apply 가 아무것도 안 한다
     [2] ★★ 모두에게 끄는 한 줄(ALLOWED=false)이 있고, 그러면 단추도 새 화면도 안 선다
     [3] ★★ 옛 홈(index.html)은 <b>세 자리만</b> — 싣기 1 · 그린 뒤 부르기 1 · 인사 단추 1, 셋 다 try 안
     [4] ★★ 새 화면이 보이게 하는 칸(KEEP)과 펴는 겉칸(FLAT)이 옛 홈에 <b>정말 있다</b> — 이름이 어긋나면 빈 화면
     [5] ★  서버를 안 부르고(fetch·supabase 없음) 저장은 이 기기 켜짐 표시 하나뿐
     [6] ★  바꿔 끼우다 터지면 <b>예전 화면</b>으로 되돌리는 길이 있다(catch 에서 class 를 뗌)
     [7] ★  「지금 할 것」 카드가 없으면 새 화면을 안 씀 · 주소 ?home=v2/old 로 켜고 끔
     [8] ★  칸을 지우지 않는다 — 접는 규칙은 「다른 칸 펼쳐 보기」(hm-v2-all) 때 통째로 빠진다
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const SRC = fs.readFileSync(path.join(ROOT, 'app/home-v2.js'), 'utf8');
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const 걷기 = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

function box(store, search, allowed) {
  const ls = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  const els = {}, made = [];
  const pane = { classList: new Set(), appendChild: e => made.push(e), querySelector: () => null };
  pane.classList.toggle = function (c, v) { if (v === undefined) v = !this.has(c); if (v) this.add(c); else this.delete(c); };
  pane.classList.remove = function () { for (const c of arguments) this.delete(c); };
  const doc = {
    head: { appendChild: e => { els[e.id] = e; } },
    getElementById: id => els[id] || (id === 'hmJobHost' && box.job ? {} : null),
    createElement: () => ({ style: {}, classList: new Set() }),
    querySelector: s => (s === '.tab-pane.hm-toss' ? pane : null)
  };
  const g = { localStorage: ls, location: { search: search || '' }, document: doc, toast: () => {}, go: () => {} };
  g.window = g;
  let src = SRC;
  if (allowed === false) src = src.replace('var ALLOWED = true;', 'var ALLOWED = false;');
  vm.createContext(g);
  vm.runInContext(src, g);
  return { g, pane, made, store };
}

console.log('\n[1] 기본은 꺼짐');
box.job = true;
let B = box({}, '');
is(B.g.HOME_V2.on() === false, '처음 기기에서는 꺼져 있다');
is(B.g.HOME_V2.apply({ querySelector: () => B.pane }) === false && !B.pane.classList.has('hm-v2'),
  '꺼져 있으면 apply 가 아무것도 안 한다(옛 홈 그대로)');
is(/새 화면/.test(B.g.HOME_V2.chip()), '꺼져 있을 때 인사 줄 단추는 「✨ 새 화면」');
B = box({ apex_home_v2: '1' }, '');
is(B.g.HOME_V2.apply({ querySelector: () => B.pane }) === true && B.pane.classList.has('hm-v2'),
  '켠 기기에서는 판에 hm-v2 가 붙는다');
is(B.made.length === 1 && B.made[0].id === 'hmV2More', '「☰ 다른 칸 펼쳐 보기」 단추가 하나 선다');
is(/예전 화면/.test(B.g.HOME_V2.chip()), '켜져 있을 때 인사 줄 단추는 「↩ 예전 화면」');

console.log('\n[2] 모두에게 끄기');
B = box({ apex_home_v2: '1' }, '', false);
is(B.g.HOME_V2.on() === false && B.g.HOME_V2.chip() === '' &&
   B.g.HOME_V2.apply({ querySelector: () => B.pane }) === false,
  'ALLOWED=false 면 켜 둔 기기도 예전 화면이고 단추도 안 선다');
is(/var ALLOWED = true;/.test(SRC), '끄는 한 줄(var ALLOWED = true;)이 한 곳에 있다');

console.log('\n[3] 옛 홈은 세 자리만');
const ixc = 걷기(IX);
is((IX.match(/<script src="home-v2\.js"><\/script>/g) || []).length === 1, 'index.html 이 home-v2.js 를 한 번 싣는다');
is(IX.indexOf('<script src="home-v2.js">') > IX.indexOf('<script src="hm-tamsg.js">'), 'hm-tamsg.js 뒤에 싣는다');
is((ixc.match(/HOME_V2\.apply\(/g) || []).length === 1 && /try\{ if\(window\.HOME_V2\)HOME_V2\.apply\(dyn\); \}catch/.test(ixc),
  '홈을 그린 바로 뒤 한 곳에서만 try 안에서 부른다');
is((ixc.match(/HOME_V2\.chip\(/g) || []).length === 1 && /try\{ v2=\(window\.HOME_V2&&HOME_V2\.chip\)\?HOME_V2\.chip\(\):''; \}catch/.test(ixc),
  '인사 줄 단추도 한 곳 · try 안 (없어도 빈 글)');
is((ixc.match(/HOME_V2/g) || []).length <= 6, 'index.html 안 HOME_V2 는 그 세 자리뿐 — ' + (ixc.match(/HOME_V2/g) || []).length + '번');

console.log('\n[4] 칸 이름이 옛 홈에 있다');
const KEEP = B.g.HOME_V2.KEEP, FLAT = B.g.HOME_V2.FLAT;
KEEP.forEach(k => {
  const id = k[0].slice(1);
  is(IX.indexOf('id="' + id + '"') >= 0 || IX.indexOf("id=\\'" + id + "\\'") >= 0 || IX.indexOf("'" + id + "'") >= 0,
    '보이는 칸 ' + k[0] + ' 이 옛 홈에 있다');
});
is(IX.indexOf('id="hmJobHost"') >= 0, '「지금 할 것」(#hmJobHost) 자리가 있다');
FLAT.filter(s => s[0] === '#').forEach(s => is(IX.indexOf('id="' + s.slice(1) + '"') >= 0, '펴는 겉칸 ' + s + ' 이 있다'));
is(/class="tz"/.test(IX) && /class="hm-2col"/.test(IX), '펴는 겉칸 .tz · .hm-2col 이 있다');

console.log('\n[5] 서버 · 저장');
const sc = 걷기(SRC);
is(!/fetch\(|osClient|supabase|\.from\(/.test(sc), '서버를 부르지 않는다');
is((sc.match(/setItem\(/g) || []).length === 1 && /setItem\(KEY, '1'\)/.test(sc), '저장은 이 기기 켜짐 표시(KEY) 하나뿐');

console.log('\n[6][7] 터지면 예전 화면 · 지금 할 것 없으면 안 씀 · 주소');
is(/catch \(e\) \{[\s\S]{0,200}classList\.remove\('hm-v2', 'hm-v2-all'\)/.test(sc), '터지면 hm-v2 를 떼어 예전 화면으로');
box.job = false;
B = box({ apex_home_v2: '1' }, '');
is(B.g.HOME_V2.apply({ querySelector: () => B.pane }) === false, '「지금 할 것」 카드가 없으면 새 화면을 안 쓴다');
box.job = true;
B = box({}, '?go=home&home=v2');
is(B.g.HOME_V2.apply({ querySelector: () => B.pane }) === true && B.store.apex_home_v2 === '1', '?home=v2 로 켠다');
B = box({ apex_home_v2: '1' }, '?home=old');
is(B.g.HOME_V2.apply({ querySelector: () => B.pane }) === false && !('apex_home_v2' in B.store), '?home=old 로 끈다');

console.log('\n[8] 지우지 않는다');
is(/:not\(\.hm-v2-all\)/.test(sc) && !/\.remove\(\)/.test(sc.replace(/m\.remove\(\)/g, '')),
  '접는 규칙은 펴면(hm-v2-all) 빠지고, 옛 칸을 지우는 코드가 없다(제 단추만 뗌)');
is(!/innerHTML\s*=/.test(sc.replace(/b\.innerHTML = moreLab\(p\)/g, '')), '옛 칸의 속을 갈아 끼우지 않는다(제 단추 글만)');

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 새 오늘 화면은 옛 홈을 안 깹니다');
process.exit(bad ? 1 : 0);
