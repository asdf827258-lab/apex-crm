#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   check-screens.js — <b>화면 목록이 두 벌이 되지 않는가.</b>

   사장님 말씀 (2026-09-23) — 「APEX 쉬운판 하고 본 세션이 <b>안 맞아,
   계속</b>」.

   재 보니 밖에 세워 둔 「APEX 쉬운 판」 의 화면 목록이 본 앱 `TABS` 와
   <b>여섯 군데</b> 어긋나 있었습니다. 화면 둘이 빠지고, 이름 하나가
   옛것이고, 셋이 <b>본 앱에 없는 갈래</b>에 서 있었습니다.

   까닭은 하나입니다 — <b>같은 표를 두 곳에서 손으로 고치고 있었습니다.</b>
   git 은 이것을 <b>충돌 없이</b> 지나갑니다. 아무도 못 봅니다.
   CLAUDE.md 5번이 말하는 바로 그 자리입니다.

   그래서 본 앱에서 <b>뽑아</b> 둔 `docs/화면목록.json` 을 한 벌로 삼고,
   밖에 세우는 것은 그것을 베낍니다. 이 점검은 <b>뽑아 둔 것이 낡지
   않았는지</b>만 봅니다.

   ── 보는 것 셋 ────────────────────────────────────────────────────
     [1] `docs/화면목록.json` 이 지금 `TABS` <b>그대로</b>인가
         — 메뉴를 고치고 다시 안 뽑으면 여기서 걸립니다
     [2] 화면 <b>id 가 겹치지 않는가</b> — 같은 화면이 두 줄에 서면
         「지금 어느 화면인가」 를 묻는 자리가 엉뚱한 답을 합니다 (5번)
     [3] 파일이 <b>스스로 적은 수</b>가 실제와 같은가 — 「94개」 처럼
         글자로 박힌 수는 하나 늘 때 <b>거짓말</b>이 됩니다 (1번)

   고치는 법은 한 줄입니다 — `node scripts/mkscreens.js --write`
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const mk = require('./mkscreens.js');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('\n[1] <b>뽑아 둔 목록이 본 앱 그대로인가</b>');
const now = mk.build();
/* ⚠ <b>판 번호(뽑은판)는 빼고 견줍니다.</b> 처음엔 파일을 통째로 견줬는데,
   APP_BUILD 는 <b>PR 마다</b> 바뀌는 줄이라(CLAUDE.md 6번) 메뉴를 한 글자도
   안 건드린 판에서도 빨간불이 켜졌습니다. 그건 <b>헛것</b>입니다 — 헛것을
   잡는 점검은 안 잡는 점검보다 나쁩니다 (8번).
   여기서 잡으려는 것은 <b>화면이 늘고 줄고 이름이 바뀌는 것</b>입니다.
   판 번호는 「언제 뽑았나」 를 적어 두는 쪽지라 낡아도 거짓이 아닙니다.  */
const drop = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.뽑은판; return c; };
const want = mk.TEXT(drop(now));
const raw = fs.existsSync(mk.OUT) ? fs.readFileSync(mk.OUT, 'utf8') : '';
let have = '';
try { have = raw ? mk.TEXT(drop(JSON.parse(raw))) : ''; } catch (e) { have = raw; }
is(!!raw, '  `docs/화면목록.json` 이 있다');
if (have && have !== want) {
  /* <b>어디가 다른지 그대로 적습니다.</b> 「다릅니다」 만 적으면 사람이
     파일을 통째로 열어 96줄을 눈으로 견줘야 합니다 (8번).            */
  const flat = (o) => { const m = new Map();
    o.갈래.forEach(g => g.items.forEach(it => m.set(it.id, { g: g.group, t: it.title, ic: it.icon, h: it.hide }))); return m; };
  let old = null; try { old = JSON.parse(have); } catch (e) { old = null; }
  if (old && old.갈래) {
    const A = flat(now), B = flat(old);
    [...A.keys()].filter(k => !B.has(k)).forEach(k => console.log('     + 본 앱에 새로 생긴 화면 · ' + k + ' ' + A.get(k).ic + ' ' + A.get(k).t));
    [...B.keys()].filter(k => !A.has(k)).forEach(k => console.log('     - 본 앱에서 없어진 화면 · ' + k + ' ' + B.get(k).ic + ' ' + B.get(k).t));
    [...A.keys()].filter(k => B.has(k)).forEach(k => { const a = A.get(k), b = B.get(k);
      if (a.t !== b.t) console.log('     ! 이름 · ' + k + ' 「' + b.t + '」 → 「' + a.t + '」');
      if (a.g !== b.g) console.log('     ! 갈래 · ' + k + ' [' + b.g + '] → [' + a.g + ']');
      if (a.ic !== b.ic) console.log('     ! 그림 · ' + k + ' ' + b.ic + ' → ' + a.ic);
      if (a.h !== b.h) console.log('     ! 메뉴에 서나 · ' + k + ' ' + (b.h ? '숨김' : '보임') + ' → ' + (a.h ? '숨김' : '보임')); });
  }
}
is(have === want,
   '  <b>한 글자도 안 다르다</b> — 다르면 `node scripts/mkscreens.js --write`');

console.log('\n[2] <b>화면 id 가 겹치지 않는가</b> (5번)');
const seen = new Map(), dup = [];
now.갈래.forEach(g => g.items.forEach(it => {
  if (seen.has(it.id)) dup.push(it.id + ' — [' + seen.get(it.id) + '] · [' + g.group + ']');
  else seen.set(it.id, g.group);
}));
is(dup.length === 0, '  겹치는 id 가 없다 — ' + (dup.length ? dup.join(' / ') : now.화면수 + '개 모두 하나씩'));

console.log('\n[3] <b>파일이 스스로 적은 수가 맞는가</b> (1번)');
const realG = now.갈래.length;
const realN = now.갈래.reduce((s, g) => s + g.items.length, 0);
const realS = now.갈래.reduce((s, g) => s + g.items.filter(x => !x.hide).length, 0);
is(now.갈래수 === realG, '  갈래 수 — 적힌 ' + now.갈래수 + ' · 실제 ' + realG);
is(now.화면수 === realN, '  화면 수 — 적힌 ' + now.화면수 + ' · 실제 ' + realN);
is(now.메뉴에서는수 === realS, '  메뉴에 서는 수 — 적힌 ' + now.메뉴에서는수 + ' · 실제 ' + realS +
   ' (숨긴 것 ' + (realN - realS) + '개는 찾기·주소로 열립니다)');

console.log('\n──────────────────────────────');
if (bad) { console.log('✗ 화면 목록 — 고칠 자리 ' + bad + '곳'); process.exit(1); }
console.log('✓ 화면 목록은 한 벌입니다 — ' + now.화면수 + '개 · ' + now.갈래수 + '갈래 (메뉴에 서는 것 ' + now.메뉴에서는수 + ')');
