/* ═══════════════════════════════════════════════════════════════
   check-hmonelist.js — ☎️ <b>홈에서 「연락할 분」 을 한 곳에서만 세나</b> (판 X499)

   사장님 말씀 (2026-11-19) — 「메인세션 … 토스처럼 단순하게」 → 단순화 차례
   ②「홈 한 목록」. 라이브 폰 홈에 「오늘 볼 분 3분」 · 「☎️ 연락할 분 2」 ·
   「오늘 안에 연락해야 할 분이 1명」 이 <b>같은 분들을 두고</b> 서로 다른 수로
   섰습니다. 넘긴 분은 이미 「오늘 볼 분」 에 ☎️ 줄로 섭니다.

   ── 보는 것 (브라우저 없이) ──────────────────────────────────────
     [1] ★★ 오늘 목록(hmSteps)에 이미 선 분은 「오늘 안에 연락해야 할 분」 에서 빠진다
     [2] ★★ 오늘 목록 밖에 남은 분만 그 수로 센다
     [3] ★  오늘 목록을 아직 못 세웠으면(빈 목록·오류) <b>예전처럼 다</b> 센다 — 모르는데 0 이라 안 한다 (1번)
     [4] ★  「곧 때가 되는 분」 은 다른 물음이라 그대로 남는다
     [5] ★  이름이 아니라 고객 id 로만 맞춘다 — 같은 이름의 다른 분을 빼지 않는다 (1번·3번)
     [6] ★  hmPaint 가 그 줄을 다시 센다 — 오늘 목록이 늦게 서도 두 곳에 안 남는다 (5번)
   ── 판 X500 「맨 밑 갈래 줄 걷기」(사장님 고르심 2026-11-20) ──
     [7] ★★ 「오늘」 카드가 갈래별 줄(☎️ 연락할 분 N · 📇 DB 고객 N)을 안 세운다 — 오늘 볼 분과 같은 분들을 또 센 것
     [8] ★  세는 자(hmCount · HM_ORD)는 그대로 — 인사 「오늘 N개예요」 · 빈 날 가리기가 계속 쓴다
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const IX = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

function fnSrc(name) {
  const a = IX.indexOf('function ' + name + '(');
  if (a < 0) throw new Error(name + ' 를 못 찾음');
  let i = IX.indexOf('{', a), d = 0;
  for (; i < IX.length; i++) { const c = IX[i]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return IX.slice(a, i + 1);
}

/* 손으로 셀 수 있게 작게 깝니다 — 이름은 가짜 식구만 */
const C = {
  a: { id: 'a', advisor_id: 'me', name: '홍길동' },
  b: { id: 'b', advisor_id: 'me', name: '홍길순' },
  c: { id: 'c', advisor_id: 'me', name: '홍길동' },     /* 같은 이름의 다른 분 */
  s: { id: 's', advisor_id: 'me', name: '홍갑돌' }
};
function run(steps, over, soon) {
  const el = { innerHTML: '' };
  const box = {
    document: { getElementById: id => (id === 'ccHomeLine' ? el : null) },
    OSC: { list: Object.values(C) }, OS: { profile: { id: 'me' } },
    ccOverList: () => over.map(k => C[k]), ccSoonList: () => soon.map(k => C[k]),
    hmNotiCss: () => {}, String
  };
  if (steps !== null) box.hmSteps = typeof steps === 'function' ? steps : () => steps;
  vm.createContext(box);
  vm.runInContext(fnSrc('ccMyList') + '\n' + fnSrc('ccNotToday') + '\n' + fnSrc('ccHomePaint'), box);
  vm.runInContext('ccHomePaint()', box);
  return el.innerHTML.replace(/<[^>]+>/g, '');
}

console.log('\n[1][2] 오늘 목록에 선 분은 안 센다');
let t = run([{ k: 'touch', id: 'a' }, { k: 'db', id: 'db-9' }], ['a', 'b'], []);
is(/오늘 안에 연락해야 할 분이 1명/.test(t), '넘긴 2명 중 오늘 목록에 선 1명을 빼고 1명 — ' + (t || '(줄 없음)'));
t = run([{ k: 'touch', id: 'a' }, { k: 'touch', id: 'b' }], ['a', 'b'], []);
is(t === '', '넘긴 분이 모두 오늘 목록에 있으면 줄이 안 선다 — ' + (t || '(줄 없음)'));

console.log('\n[3] 오늘 목록을 모르면 예전처럼');
t = run([], ['a', 'b'], []);
is(/오늘 안에 연락해야 할 분이 2명/.test(t), '빈 목록(읽는 중)이면 2명 그대로 — ' + t);
t = run(() => { throw new Error('x'); }, ['a', 'b'], []);
is(/오늘 안에 연락해야 할 분이 2명/.test(t), 'hmSteps 가 터져도 2명 그대로 — ' + t);
t = run(null, ['a', 'b'], []);
is(/오늘 안에 연락해야 할 분이 2명/.test(t), 'hmSteps 가 없어도 2명 그대로 — ' + t);

console.log('\n[4] 곧 때가 되는 분은 그대로');
t = run([{ k: 'touch', id: 'a' }], ['a'], ['s']);
is(/곧 연락할 때가 되는 분이 1명/.test(t) && !/오늘 안에/.test(t), '오늘 분은 빠지고 「곧」 1명만 — ' + t);

console.log('\n[5] id 로만 맞춘다');
t = run([{ k: 'touch', id: 'a', t: '홍길동' }], ['a', 'c'], []);
is(/오늘 안에 연락해야 할 분이 1명/.test(t), '같은 이름(홍길동)의 다른 분 c 는 남는다 — ' + t);

console.log('\n[6] hmPaint 가 다시 센다');
const hp = fnSrc('hmPaint');
is(/ccHomePaint\(\)/.test(hp), 'hmPaint 안에서 ccHomePaint 를 부른다');

console.log('\n[7][8] 「오늘」 카드 갈래 줄 (판 X500)');
const td = fnSrc('hmTodayHtml').replace(/\/\*[\s\S]*?\*\//g, '');
is(!/class="hm-row"/.test(td) && !/hm-rows/.test(td), '「오늘」 카드가 갈래별 줄을 안 세운다');
is(/hmCount\(\)/.test(td) && /c\.total/.test(td), '세는 자 hmCount 는 그대로 부르고 빈 날을 c.total 로 가린다');
is(/var HM_ORD=\[/.test(IX) && /function hmCount\(/.test(IX), 'HM_ORD 표와 hmCount 는 남아 있다');

console.log(bad ? ('\n✗ ' + bad + '건 어긋남') : '\n✓ 홈 「연락할 분」 은 한 곳에서만 셉니다');
process.exit(bad ? 1 : 0);
