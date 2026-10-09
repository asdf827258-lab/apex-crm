/* 광고 화면이 부르는 표·뷰·칸이 <b>저장소에 적혀 있나</b>.

   2026-10-09 에 재어 보니 광고 체계 열셋(표 일곱 · 뷰 여섯)이 저장소 SQL
   어디에도 없었습니다. 화면(광고성과.html)은 ad_v_board 를 읽고
   ad_inquiries 에 넣고 있었는데, <b>그 표가 어떻게 생겼는지 적힌 곳이
   없었습니다.</b> 그러면 다음 세션은 화면만 보고 짐작하게 되고, 짐작한
   칸 이름으로 insert 를 쓰면 조용히 틀린 줄이 들어갑니다.

   이 자는 그것을 막습니다. 넷을 봅니다.

     1. 화면이 부르는 표·뷰가 전부 migration_*.sql 에 적혀 있나
     2. 화면이 쓰는 <b>한글 칸 이름</b>이 적힌 정의 안에 있나
        — 뷰의 칸 이름이 한글입니다(지출·방문·카톡·문의). 누가 뷰에서
          「지출」 을 spend 로 고치면 화면은 <b>에러도 없이 0</b> 을 찍습니다.
          합계가 0 이면 판정($300·$500)이 「아직 문의가 없습니다」 로
          넘어가 버립니다. 그 자리를 봅니다.
     3. 화면이 문의에 넣는 칸이 전부 적힌 칸인가
        — Supabase 는 없는 칸을 주면 에러를 내지만, 칸 이름을 <b>바꾸면</b>
          그 값만 조용히 빠집니다.
     4. 문의 표에 <b>실명·연락처 칸이 없나</b>(CLAUDE.md 3번)
        — 광고 화면은 「이름·연락처는 넣지 마세요」 라고 적어 두었습니다.
          표에 그 칸이 생기면 그 약속이 깨집니다.

   ★ 넓게 잡지 않습니다(8번). 한글 칸은 <b>칸을 부르는 꼴</b>
     (r["X"] · sum("X") · o.X · {X:0})에서만 거둡니다 — 화면에 찍히는
     한글 글귀는 안 봅니다. 그래서 글을 고쳐도 빨간불이 안 켜집니다. */
const fs = require('fs');

const PAGE = '광고성과.html';
let bad = [], pass = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { bad.push(m); console.log('  ✗ ' + m); } };

if (!fs.existsSync(PAGE)) {
  console.log('✗ ' + PAGE + ' 이 없습니다 — 화면이 사라졌으면 이 자도 고쳐야 합니다.');
  process.exit(1);
}
const page = fs.readFileSync(PAGE, 'utf8');

/* 화면의 자바스크립트만 본다 — 화면에 찍히는 글귀는 칸 이름이 아니다 */
const js = (page.match(/<script>([\s\S]*)<\/script>/) || [])[1] || '';
/* 글 속의 한글은 칸 이름이 아니다. 꼴을 볼 때만 글을 걷어 낸다 */
const noStr = js.replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");

/* ── 저장소 SQL 에서 「무엇이 적혀 있나」 를 읽는다 ─────────────────── */
const sqlFiles = fs.readdirSync('.').filter(f => /^migration_.*\.sql$/.test(f));
const sqlAll = sqlFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

/* 표 하나의 칸 이름 — create table 괄호 속 + 뒤따르는 add column */
function tableCols(name) {
  const cols = new Set();
  const re = new RegExp('create table if not exists public\\.' + name + '\\s*\\(', 'i');
  const m = re.exec(sqlAll);
  if (m) {
    let i = m.index + m[0].length, depth = 1, body = '';
    while (i < sqlAll.length && depth > 0) {
      const c = sqlAll[i];
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (!depth) break; }
      body += c; i++;
    }
    /* 맨 바깥 쉼표로만 쪼갠다 — numeric(10,2) 의 쉼표에 속지 않는다 */
    let d = 0, cur = '';
    const parts = [];
    for (const c of body) {
      if (c === '(') d++;
      if (c === ')') d--;
      if (c === ',' && d === 0) { parts.push(cur); cur = ''; } else cur += c;
    }
    parts.push(cur);
    parts.forEach(p => {
      const t = p.trim();
      if (!t) return;
      if (/^(constraint|primary\s+key|unique|check|foreign\s+key|exclude)\b/i.test(t)) return;
      const id = (t.match(/^([a-z_][a-z0-9_]*)/i) || [])[1];
      if (id) cols.add(id);
    });
  }
  const ar = new RegExp('alter table public\\.' + name + ' add column if not exists\\s+([a-z_][a-z0-9_]*)', 'gi');
  let a; while ((a = ar.exec(sqlAll))) cols.add(a[1].toLowerCase());
  return cols;
}

/* 뷰·표가 내주는 <b>한글</b> 칸 이름 — as "한글" 로만 섭니다 */
function koreanColsOf(name) {
  const out = new Set();
  const re = new RegExp('create (?:or replace )?view public\\.' + name + '\\b[\\s\\S]*?(?:\\n;|;\\s*\\n\\s*(?:\\/\\*|create|grant|alter|set|$))', 'i');
  const m = re.exec(sqlAll);
  const body = m ? m[0] : '';
  let k; const kr = /as\s+"([가-힣0-9a-zA-Z]+)"/g;
  while ((k = kr.exec(body))) out.add(k[1]);
  return out;
}

function declared(name) {
  return new RegExp('create table if not exists public\\.' + name + '\\b', 'i').test(sqlAll) ||
         new RegExp('create (?:or replace )?view public\\.' + name + '\\b', 'i').test(sqlAll);
}

/* ── 1. 화면이 부르는 표·뷰가 적혀 있나 ────────────────────────────── */
console.log('\n[1] 화면이 부르는 표·뷰가 저장소에 적혀 있나');
ok(sqlFiles.length > 0, '저장소에 migration_*.sql 이 ' + sqlFiles.length + '개 있다');

const used = new Set();
let f; const fr = /\.from\(\s*["']([a-z_][a-z0-9_]*)["']\s*\)/g;
while ((f = fr.exec(js))) used.add(f[1]);
ok(used.size > 0, '화면이 부르는 자리를 찾았다 — ' + [...used].join(' · '));

const undeclared = [...used].filter(t => !declared(t));
ok(undeclared.length === 0,
  '부르는 ' + used.size + '자리가 전부 적혀 있다' +
  (undeclared.length ? (' · <b>적힌 곳 없음: ' + undeclared.join(', ') + '</b>') : ''));

/* ── 2. 화면이 쓰는 한글 칸이 적힌 정의 안에 있나 ──────────────────── */
console.log('\n[2] 화면이 쓰는 한글 칸 이름이 적힌 정의 안에 있나');
const want = new Set();
const add = (s) => { if (s) want.add(s); };
let g;
/* r["소재"] · o["돌고있음"] */
const p1 = /\[\s*"([가-힣0-9a-zA-Z]*[가-힣][가-힣0-9a-zA-Z]*)"\s*\]/g;
while ((g = p1.exec(js))) add(g[1]);
/* sum("지출") */
const p2 = /\b(?:sum|reduce)\(\s*"([가-힣0-9a-zA-Z]*[가-힣][가-힣0-9a-zA-Z]*)"\s*\)/g;
while ((g = p2.exec(js))) add(g[1]);
/* ["지출","노출",…] — 한글 글만 든 배열은 칸 목록이다 */
const p3 = /\[\s*"[가-힣]+"\s*(?:,\s*"[가-힣]+"\s*)*\]/g;
while ((g = p3.exec(js))) (g[0].match(/"([가-힣]+)"/g) || []).forEach(x => add(x.slice(1, -1)));
/* { 지출:0, 노출:0 } · o.지출 — 글을 걷어 낸 뒤에만 */
const p4 = /[{,]\s*([가-힣][가-힣0-9a-zA-Z]*)\s*:/g;
while ((g = p4.exec(noStr))) add(g[1]);
const p5 = /\.([가-힣][가-힣0-9a-zA-Z]*)\b/g;
while ((g = p5.exec(noStr))) add(g[1]);

ok(want.size > 0, '화면이 칸으로 부르는 한글 이름을 찾았다 — ' + [...want].sort().join(' · '));

const haveKr = new Set();
used.forEach(t => koreanColsOf(t).forEach(c => haveKr.add(c)));
tableCols('ad_inquiries').forEach(c => haveKr.add(c));
ok(haveKr.size > 0, '적힌 정의가 내주는 한글 칸을 읽었다 — ' + [...haveKr].sort().join(' · '));

const lost = [...want].filter(w => !haveKr.has(w));
ok(lost.length === 0,
  '화면이 부르는 한글 칸 ' + want.size + '개가 전부 적힌 정의에 있다' +
  (lost.length ? (' · <b>없는 칸: ' + lost.join(', ') + '</b> — 화면은 이 자리에 0 을 찍습니다') : ''));

/* ── 3. 문의에 넣는 칸이 전부 적힌 칸인가 ──────────────────────────── */
console.log('\n[3] 화면이 문의에 넣는 칸이 적힌 칸인가');
const INS = 'ad_inquiries';
const insCols = tableCols(INS);
ok(insCols.size > 0, INS + ' 의 칸을 적힌 정의에서 읽었다 (' + insCols.size + '개)');

/* .from("ad_inquiries").insert([row]) → row 의 열쇠를 거둔다 */
function insertKeys() {
  const m = new RegExp('\\.from\\(\\s*["\']' + INS + '["\']\\s*\\)\\s*\\.insert\\(\\s*\\[?\\s*([A-Za-z_$][\\w$]*|\\{)').exec(js);
  if (!m) return null;
  let open;
  if (m[1] === '{') open = js.indexOf('{', m.index);
  else {
    const dm = new RegExp('(?:const|let|var)\\s+' + m[1] + '\\s*=\\s*\\{').exec(js);
    if (!dm) return null;
    open = js.indexOf('{', dm.index);
  }
  let i = open + 1, depth = 1, body = '';
  while (i < js.length && depth > 0) {
    const c = js[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) break; }
    body += c; i++;
  }
  let d = 0, cur = '';
  const parts = [];
  for (const c of body) {
    if ('({['.includes(c)) d++;
    if (')}]'.includes(c)) d--;
    if (c === ',' && d === 0) { parts.push(cur); cur = ''; } else cur += c;
  }
  parts.push(cur);
  return parts.map(p => (p.trim().match(/^["']?([A-Za-z_][\w]*)["']?\s*:/) || [])[1]).filter(Boolean);
}
const keys = insertKeys();
ok(keys !== null,
  '문의를 넣는 자리를 찾았다' + (keys ? (' — ' + keys.join(' · ')) : ' · <b>못 찾았습니다 — 화면이 바뀌었으면 이 자도 고쳐야 합니다</b>'));
if (keys) {
  const noSuch = keys.filter(k => !insCols.has(k.toLowerCase()));
  ok(noSuch.length === 0,
    '넣는 칸 ' + keys.length + '개가 전부 적힌 칸이다' +
    (noSuch.length ? (' · <b>적힌 곳 없음: ' + noSuch.join(', ') + '</b>') : ''));
}

/* ── 4. 문의 표에 실명·연락처 칸이 없나 (3번) ──────────────────────── */
console.log('\n[4] 문의 표에 실명·연락처 칸이 없나 (CLAUDE.md 3번)');
/* alias 는 「김○○」 처럼 <b>가린</b> 이름을 적는 자리라 봐 준다 */
const NAMEY = /(^|_)(name|nm|phone|tel|mobile|hp|contact|email)(_|$)/i;
const leak = [...insCols].filter(c => NAMEY.test(c));
ok(leak.length === 0,
  INS + ' 에 실명·연락처 칸이 없다' +
  (leak.length ? (' · <b>있습니다: ' + leak.join(', ') + '</b> — 실명은 이 브라우저와 CRM 본 화면에만 둡니다') : ''));
const leakKeys = (keys || []).filter(k => NAMEY.test(k));
ok(leakKeys.length === 0,
  '화면도 실명·연락처를 안 보낸다' + (leakKeys.length ? (' · <b>보냅니다: ' + leakKeys.join(', ') + '</b>') : ''));

console.log('\n──────────────────────────────');
if (bad.length) {
  console.log('광고 SQL 점검 실패 — ' + bad.length + '가지 어긋납니다 (통과 ' + pass + ').');
  process.exit(1);
}
console.log('광고 SQL 점검 통과 — 화면이 부르는 자리가 전부 적혀 있습니다 (' + pass + '가지).');
