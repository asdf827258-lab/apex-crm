/* 쌍둥이 점검 — <b>같은 것이 두 곳에 있지 않은가.</b>

   이번에 난 버그를 원인별로 세어 보니 가장 많았던 것이 이것이었다.

     · 넘기는 표가 FP_MAP·TOFIN_MAP <b>두 벌</b>이라 한쪽에만 생활비가 있었다
     · 발표 트랙을 삼항 사슬로 나열하다 <b>쿠폰 트랙만 빠뜨렸다</b>
     · 칸 모양 CSS 를 <b>한 화면에서만</b> 입혀 다른 화면이 벌거벗었다
     · className 을 통째로 갈아 끼워 <b>어디에 서 있는지를 잊었다</b>

   전부 「한 곳을 고쳤는데 다른 곳이 남아 있는」 모양이다. 사람이 눈으로
   찾을 수 없다 — app/index.html 한 파일이 4만 5천 줄, 함수가 2,900개다.

   그래서 기계가 본다. 브라우저를 안 띄우고 글자만 읽으므로 몇 초면 끝난다.

   ※ 규칙을 넓게 잡으면 헛것을 잡고, 헛것을 잡으면 사람이 점검을 안 믿는다.
     그래서 <b>확실한 것만</b> 잡는다. 예외는 코드에 한 줄 적어 빠져나간다.  */
const fs = require('fs'), path = require('path');

const FILES = ['app/index.html', 'app/finance.html', 'app/상담자료/통합상담_APEX.html'];
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

function read(f) {
  const p = path.join(process.cwd(), f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

/* ── ① 매핑 표가 두 벌인가 ──────────────────────────────────────
   [['a','b'],['c','d']] 꼴 표에서 <b>첫 칸</b>만 모아 견준다. 두 표가
   키를 대부분 공유하면 같은 일을 하는 표가 둘이라는 뜻이다.          */
function mapTables(src) {
  const out = [];
  const re = /(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\[\s*(\[[\s\S]{20,4000}?)\]\s*;/g;
  let m;
  while ((m = re.exec(src))) {
    const keys = (m[2].match(/\[\s*'([^']{2,40})'/g) || [])
      .map(x => x.replace(/^\[\s*'/, ''));
    if (keys.length >= 5) out.push({ name: m[1], keys: keys, at: lineOf(src, m.index) });
  }
  return out;
}
function overlap(a, b) {
  const S = new Set(b);
  let n = 0;
  a.forEach(k => { if (S.has(k)) n++; });
  return n / Math.max(1, Math.min(a.length, b.length));
}

/* ── ② 탭·트랙을 삼항 사슬로 나열했는가 ────────────────────────
   a==='x'?'1':a==='y'?'2':a==='z'?'3':'0' — 하나가 늘 때마다 여기를
   고쳐야 하고, 그래서 언젠가 하나를 빠뜨린다. 표로 바꾸면 빠뜨릴
   자리가 없어진다.                                                */
function ternChains(src) {
  const out = [];
  const re = /([A-Za-z_$][\w$.]*)\s*===?\s*'[^']{1,24}'\s*\?([^;{}]{0,80}?):\s*\1\s*===?\s*'[^']{1,24}'\s*\?([^;{}]{0,80}?):\s*\1\s*===?\s*'[^']{1,24}'\s*\?/g;
  let m;
  while ((m = re.exec(src))) {
    /* <b>글자 고르기</b>와 <b>일 시키기</b>를 갈라야 한다.
         c==='change'?'계약 변경':…   → 이름표를 고르는 것. 빠뜨려도 글자만 빈다.
         k==='d'?window.__apexD:…     → <b>무엇을 실행할지</b> 고르는 것.
                                        하나 빠뜨리면 그 트랙이 통째로 안 돈다.
       뒤쪽만 잡는다. 앞쪽까지 잡으면 헛것이 열 개씩 나오고, 그러면
       사람이 이 점검을 안 믿게 된다 — 그게 제일 나쁘다.            */
    /* 갈래마다 <b>따옴표로 시작하면</b> 이름표를 고르는 것이다.
       ('양호' · '점검' 같은 것 — 빠뜨려도 글자만 빈다)
       이름이나 호출로 시작하면 <b>무엇을 실행할지</b> 고르는 것이고,
       하나 빠뜨리면 그 트랙이 통째로 안 돈다. 뒤쪽만 잡는다.        */
    const arm = a => String(a || '').trim();
    /* 갈래가 <b>글자나 숫자</b>면 값을 고르는 것이다 ('양호' · 3).
       빠뜨려도 그 칸의 값만 빈다.
       갈래가 <b>이름이나 호출</b>이면 무엇을 실행할지 고르는 것이고,
       하나 빠뜨리면 그 트랙이 통째로 안 돈다 — 뒤쪽만 잡는다.       */
    const isLookup = [m[2], m[3]].every(a => /^(['"]|[0-9])/.test(arm(a)));
    if (isLookup) continue;
    out.push({ v: m[1], at: lineOf(src, m.index), txt: m[0].replace(/\s+/g, ' ').slice(0, 80) });
  }
  return out;
}

/* ── ③ 대소문자만 다른 이름 ────────────────────────────────────
   renderRealestate 와 renderRealEstate — 사람 눈에는 같아 보이는데
   기계에는 남남이다. 「없는 함수」 오류의 절반이 이것이다.          */
function caseTwins(src) {
  const names = new Set(), low = {}, out = [];
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(src))) names.add(m[1]);
  names.forEach(n => {
    /* 한두 글자 이름(p, P, $)은 그때그때 쓰는 지역 도우미라 겹쳐도 사고가
       안 난다. 사고가 나는 건 renderRealestate / renderRealEstate 처럼
       <b>사람 눈에 같아 보이는 긴 이름</b>이다. 거기만 잡는다. */
    if (n.length < 4) return;
    const k = n.toLowerCase();
    (low[k] = low[k] || []).push(n);
  });
  for (const k in low) if (low[k].length > 1) out.push(low[k]);
  return out;
}

/* ── ④ 돈 단위 규약 ────────────────────────────────────────────
   이번에 월 50만원이 <b>50억</b>으로 찍힌 원인이다. 함수는 만원을
   받는데 원 단위 값을 넣었다. 이름이 단위를 말해 주지 않으니 아무도
   모른다. 그래서 규약을 정하고 기계가 지킨다.

     이름이 …Won  으로 끝나면  → <b>만원</b>을 받는다
     이름이 …WonR 로 끝나면    → <b>원</b>을 받는다
     변수 이름에 won/Won 이 들어가면 → 그 변수는 <b>원</b>을 담는다

   그러므로 xxxWon(yyyWon) 은 거의 언제나 만 배 오류다.
   정말 맞는 경우에는 그 줄에 「원단위OK」 라고 적어 빠져나간다.      */
function unitMix(src) {
  const out = [];
  const re = /\b([A-Za-z_$][\w$]*Won)\s*\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
  let m;
  while ((m = re.exec(src))) {
    const fn = m[1], arg = m[2];
    if (/WonR$/.test(fn)) continue;
    if (!/won$/i.test(arg)) continue;
    const line = src.slice(src.lastIndexOf('\n', m.index) + 1,
                           src.indexOf('\n', m.index));
    if (/원단위OK/.test(line)) continue;
    out.push({ at: lineOf(src, m.index), fn: fn, arg: arg, line: line.trim().slice(0, 90) });
  }
  return out;
}

/* ── ⑤ 화면마다 옷을 입혔는가 ──────────────────────────────────
   xxxCss() 가 넣어 주는 클래스를 쓰면서 그 함수를 안 부르면, 그 화면
   에서만 칸이 벌거벗은 채로 선다. 상담카드가 그랬다.                */
function cssMissing(src) {
  const out = [], injectors = [];
  const re = /function\s+([A-Za-z_$][\w$]*Css)\s*\(\)\s*\{([\s\S]{0,6000}?)\n\}/g;
  let m;
  while ((m = re.exec(re.lastIndex !== undefined ? src : src))) {
    const pre = (m[2].match(/'\.([a-z][a-z0-9]*)-/i) || [])[1];
    if (pre) injectors.push({ fn: m[1], pre: pre });
  }
  injectors.forEach(inj => {
    /* 그 접두사를 그리는 함수들 */
    const fr = /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{([\s\S]{0,20000}?)\n\}/g;
    let f;
    while ((f = fr.exec(src))) {
      const body = f[2];
      if (f[1] === inj.fn) continue;
      if (body.indexOf('class="' + inj.pre + '-') < 0) continue;
      /* 그 함수 자신이 부르거나, 그 함수를 부르는 쪽이 부르면 된다 —
         여기서는 <b>같은 파일 어딘가에서 부르는지</b> 만 본다. 안 부르면
         어느 화면에서도 옷이 안 입혀진다는 뜻이라 확실한 고장이다. */
      if (src.indexOf(inj.fn + '()') < 0) out.push({ fn: f[1], css: inj.fn, pre: inj.pre });
      break;
    }
  });
  return out;
}

console.log('\n[1] 같은 일을 하는 표가 두 벌은 아닌가');
FILES.forEach(f => {
  const src = read(f);
  if (!src) return;
  const T = mapTables(src), pairs = [];
  for (let i = 0; i < T.length; i++)
    for (let j = i + 1; j < T.length; j++) {
      const o = overlap(T[i].keys, T[j].keys);
      if (o >= 0.7) pairs.push(T[i].name + '(' + T[i].at + '줄) ≈ ' + T[j].name +
        '(' + T[j].at + '줄) — 키 ' + Math.round(o * 100) + '% 같음');
    }
  is(pairs.length === 0, '  ' + f + ' — 표 ' + T.length + '개' +
    (pairs.length ? '\n      ✗ ' + pairs.join('\n      ✗ ') : ''));
});

console.log('\n[2] 탭·트랙을 삼항 사슬로 나열하지 않았는가');
FILES.forEach(f => {
  const src = read(f);
  if (!src) return;
  const C = ternChains(src);
  is(C.length === 0, '  ' + f +
    (C.length ? ' — ✗ ' + C.length + '곳\n      ' +
      C.slice(0, 3).map(c => c.at + '줄: ' + c.txt).join('\n      ') +
      '\n      → 표(객체) 하나로 바꾸면 트랙이 늘어도 빠뜨릴 자리가 없습니다'
      : ' — 없음'));
});

console.log('\n[3] 대소문자만 다른 이름이 없는가');
FILES.forEach(f => {
  const src = read(f);
  if (!src) return;
  const C = caseTwins(src);
  is(C.length === 0, '  ' + f +
    (C.length ? ' — ✗ ' + C.map(g => g.join(' / ')).join(' · ') : ' — 없음'));
});

console.log('\n[4] 돈 단위 규약 — …Won 은 만원, …WonR 은 원');
FILES.forEach(f => {
  const src = read(f);
  if (!src) return;
  const U = unitMix(src);
  is(U.length === 0, '  ' + f +
    (U.length ? ' — ✗ ' + U.length + '곳\n      ' +
      U.slice(0, 5).map(u => u.at + '줄: ' + u.fn + '(' + u.arg + ') — ' + u.line).join('\n      ') +
      '\n      → 원 단위면 ' + U[0].fn + 'R 을 쓰거나, 맞다면 그 줄에 「원단위OK」 라고 적으십시오'
      : ' — 없음'));
});

console.log('\n[5] 칸 모양 CSS 를 아무도 안 입히는 화면이 없는가');
FILES.forEach(f => {
  const src = read(f);
  if (!src) return;
  const M = cssMissing(src);
  is(M.length === 0, '  ' + f +
    (M.length ? ' — ✗ ' + M.map(x => x.fn + ' 가 .' + x.pre + '-* 를 쓰는데 ' + x.css + '() 를 아무도 안 부름').join(' · ')
      : ' — 없음'));
});

console.log(bad ? '\n✗ ' + bad + '개 어긋남 — 같은 것이 두 곳에 있습니다\n'
                : '\n──────────────────────────────\n쌍둥이 점검 통과 — 고칠 자리가 하나씩입니다.\n');
process.exit(bad ? 1 : 0);
