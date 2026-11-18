/* ══════════════════════════════════════════════════════════════════
   check-kstday.js — <b>하루를 당겨 적지 않나.</b> (판 X471 · 2026-11-17)

   ── 어떻게 찾았나 ─────────────────────────────────────────────────
   판 X465 를 라이브에서 눈으로 재던 중에, <b>한 화면이 같은 물음에 두
   답</b>을 하고 있었습니다 —
     · 맨 위 띠        「11월 17일 <b>(화)</b>」   ← 맞습니다
     · 🖼 오늘의 뉴스  「11월 17일 <b>(월)</b>」   ← 하루 앞입니다
   점검 464가지가 다 초록인데 아무도 안 봤습니다. 날짜를 적는 자리가
   여럿인데, <b>둘을 나란히 놓고 견주는 자</b>가 없었기 때문입니다.

   ── 병의 꼴 ──────────────────────────────────────────────────────
   한국 시각을 다루는 길이 이 앱에 둘 있습니다. <b>섞으면 하루가 틀립니다.</b>
     ㉠ 「지금」    : new Date(Date.now()+9*3600*1000) → <b>getUTC* / toISOString</b>
     ㉡ 「그 날짜」 : new Date('2026-11-17T00:00:00<b>Z</b>')  → <b>getUTC*</b>
   그런데 날짜글에 <b>+09:00</b> 을 붙여 만들고 그것을 다시 UTC 로 읽으면,
   시각이 <b>9시간 뒤로</b> 밀려 전날이 나옵니다 —
     new Date('2026-11-17T00:00:00+09:00')  =  2026-11-<b>16</b>T15:00Z
       .getUTCDay()        → 월요일 (화요일인데)
       .toISOString()[0:10] → '2026-11-<b>16</b>' (하루 당겨짐)

   잡은 자리 둘 —
     · hmNw1DayT   요일이 하루 앞       (판 X464 에 제가 넣은 자리입니다)
     · cshDayPlus  <b>「다음 연락」 날짜가 늘 하루 당겨짐</b> — 저장도 표시도.
                   사장님이 「3일 뒤」 를 고르시면 이틀 뒤로 적혔습니다.

   ── 무엇을 보나 ──────────────────────────────────────────────────
     [1] 글로 — 날짜글에 +09:00 을 붙여 만든 것을 UTC 로 읽는 줄이 없나
     [2] 셈으로 — 날짜를 적는 함수들을 <b>실제로 불러</b> 날이 맞나
     [3] 한 화면 두 답 — hmNw1DayT 와 calLabel 이 같은 날에 같은 글인가

   ★ 브라우저를 안 띄웁니다 — 글에서 함수를 떼어 내 그대로 돌립니다
     (check-kvall 과 같은 수법). 몇 밀리초면 끝납니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
let 틀림 = 0, 봄 = 0;
const is = (c, m) => { 봄++; if (!c) 틀림++; console.log((c ? '  ✓ ' : '  ✗ ') + m); };

/* ── [1] 글로 — 섞어 쓴 줄이 없나 ───────────────────────────────── */
console.log('[1] 날짜글에 +09:00 을 붙여 만들고 UTC 로 읽는 줄');

/* 긁을 파일 — app/ 아래 전부 + 저장소 뿌리 (뿌리에도 화면이 있습니다) */
const 파일 = [];
(function 걷(d) {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    if (n.name === 'node_modules' || n.name[0] === '.') continue;
    const p = path.join(d, n.name);
    if (n.isDirectory()) 걷(p);
    else if (/\.(html|js)$/.test(n.name)) 파일.push(p);
  }
})(path.join(ROOT, 'app'));
for (const n of fs.readdirSync(ROOT)) {
  if (/\.(html|js)$/.test(n)) 파일.push(path.join(ROOT, n));
}

/* +09:00 / +0900 을 붙여 Date 를 만든 뒤, 같은 줄에서 UTC 로 읽는 것.
   ★ getTime() 만 읽는 것도 잡습니다 — toISOString 으로 흘러가 하루를 잃은
     자리가 실제로 그 꼴이었습니다(cshDayPlus). 빠져나갈 길은 한 줄 적는
     것입니다: 「KST읽기OK」 (8번 — 헛것을 잡는 점검이 더 나쁩니다). */
const 섞임 = /\+09:?00/;
const UTC읽기 = /\.getUTC[A-Za-z]+\s*\(|\.toISOString\s*\(|\.getTime\s*\(/;
const 샌것 = [];
for (const f of 파일) {
  const 줄 = fs.readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < 줄.length; i++) {
    const l = 줄[i];
    if (!섞임.test(l)) continue;
    if (!/new\s+Date\s*\(|Date\.parse\s*\(/.test(l)) continue;
    if (!UTC읽기.test(l)) continue;
    if (l.indexOf('KST읽기OK') >= 0) continue;
    샌것.push(path.relative(ROOT, f) + ':' + (i + 1) + '  ' + l.trim().slice(0, 96));
  }
}
is(샌것.length === 0, '<b>섞어 쓴 줄이 없다</b>' + (샌것.length ? ' — ' + 샌것.length + '곳' : ''));
샌것.forEach(s => console.log('      ' + s));

/* ── 글에서 함수를 떼어 낸다 ─────────────────────────────────────── */
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
function 떼(이름) {
  const 머리 = 'function ' + 이름 + '(';
  const i = SRC.indexOf(머리);
  if (i < 0) throw new Error('함수를 못 찾음: ' + 이름);
  /* 중괄호를 세어 몸을 끊습니다 — 글 안의 { } 는 이 앱 글에서는 안 나왔습니다 */
  let j = SRC.indexOf('{', i), 깊이 = 0, k = j;
  for (; k < SRC.length; k++) {
    if (SRC[k] === '{') 깊이++;
    else if (SRC[k] === '}') { 깊이--; if (!깊이) break; }
  }
  return SRC.slice(i, k + 1);
}

/* ── [2] 셈으로 — 실제로 불러 본다 ──────────────────────────────── */
console.log('\n[2] 날짜를 적는 함수를 실제로 불러 본다');

/* 재는 날 — 요일이 전부 다른 일곱 날 + 달·해가 바뀌는 자리 */
const 날들 = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19',
  '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-30', '2026-12-31', '2027-01-01'];
const W = ['일', '월', '화', '수', '목', '금', '토'];
const 참요일 = (d) => W[new Date(d + 'T00:00:00Z').getUTCDay()];
const 참더하기 = (d, n) => new Date(new Date(d + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);

let 날T = null, 라벨 = null, 더하기 = null;
try {
  const 틀 = [떼('calLabel'), 떼('hmNw1DayT'), 떼('cshDayPlus')].join('\n');
  const 만듦 = new Function('__날', `
    var hmNw1Day = function(){ return __날.d; };
    var cmToday  = function(){ return __날.d; };
    ${틀}
    return { 라벨:calLabel, 날T:hmNw1DayT, 더하기:cshDayPlus };
  `);
  const 통 = { d: '' };
  const api = 만듦(통);
  라벨 = (d) => { 통.d = d; return api.라벨(d); };
  날T = (d) => { 통.d = d; return api.날T(); };
  더하기 = (d, n) => { 통.d = d; return api.더하기(n); };
} catch (e) {
  is(false, '함수를 떼어 내 돌릴 수 있다 — ' + e.message);
}

if (날T) {
  let 요일틀림 = [], 더하기틀림 = [];
  for (const d of 날들) {
    const 받음 = 날T(d), 참 = 참요일(d);
    if (받음.indexOf('(' + 참 + ')') < 0) 요일틀림.push(d + ' → 「' + 받음 + '」 (참: ' + 참 + ')');
    for (const n of [0, 1, 2, 3, 7, 14, 30]) {
      const g = 더하기(d, n), t = 참더하기(d, n);
      if (g !== t) 더하기틀림.push(d + ' +' + n + '일 → ' + g + ' (참: ' + t + ')');
    }
  }
  is(요일틀림.length === 0,
    '★ <b>🖼 오늘의 뉴스 한 장이 요일을 맞게 적는다</b> — hmNw1DayT, ' + 날들.length + '날' +
    (요일틀림.length ? ' · 틀린 날 ' + 요일틀림.length : ''));
  요일틀림.slice(0, 6).forEach(s => console.log('      ' + s));

  is(더하기틀림.length === 0,
    '★★ <b>「다음 연락」 날짜가 당겨지지 않는다</b> — cshDayPlus, ' + (날들.length * 7) + '가지' +
    (더하기틀림.length ? ' · 틀린 것 ' + 더하기틀림.length : ''));
  더하기틀림.slice(0, 6).forEach(s => console.log('      ' + s));

  /* 0일 뒤는 오늘이어야 합니다 — 여기가 제일 많이 쓰이는 자리입니다 */
  const 오늘 = 더하기('2026-11-17', 0);
  is(오늘 === '2026-11-17',
    '  「오늘 다시 연락」 이 <b>오늘</b>로 적힌다 — ' + 오늘);

  /* ── [3] 한 화면 두 답 ──────────────────────────────────────────── */
  console.log('\n[3] 한 화면이 같은 날에 두 답을 하지 않나 (0-1번)');
  const 갈림 = 날들.filter(d => 날T(d) !== 라벨(d));
  is(갈림.length === 0,
    '★ <b>뉴스 한 장과 달력이 같은 글을 적는다</b> — hmNw1DayT = calLabel' +
    (갈림.length ? ' · 갈린 날 ' + 갈림.length : ''));
  갈림.slice(0, 6).forEach(d => console.log('      ' + d + ' : 뉴스「' + 날T(d) + '」 ↔ 달력「' + 라벨(d) + '」'));
}

console.log('\n' + (틀림 ? '✗ check-kstday — ' + 틀림 + '/' + 봄 + ' 틀림' : '✓ check-kstday — ' + 봄 + '가지 전부'));
process.exit(틀림 ? 1 : 0);
