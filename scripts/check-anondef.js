/* ══ 🔒 check-anondef — 로그인 안 한 사람이 서버 함수를 부를 수 없나 (판 X575) ═════════════
   보안 점검(get_advisors security · 2026-11-26)에 anon_security_definer_function_executable
   경고 다섯이 남아 있었습니다 — is_my_client · is_my_client_or_admin · mbti_mark_paid ·
   recruits_assign · recruits_purge. 로그인 안 한 사람이 /rest/v1/rpc/... 로 부를 수 있었습니다.

   ⚠ 왜 생겼나 — Supabase 는 새 함수를 만들면 anon 에게 실행권을 <b>따로 직접</b> 줍니다.
     migration_80 이 recruits_* 를 「revoke all … from public」 으로 회수했는데도 남은 까닭입니다.
     「from public, anon」 둘을 같이 적어야 합니다.

   보는 것
     [1] 다섯 함수 모두 — 어느 migration 에 「revoke execute … from public, anon」 이 있다
     [2] 다섯 함수 모두 — authenticated 에게는 실행권을 준다(안 주면 로그인한 화면 · 규칙이 깨집니다)
     [3] ★★ 회수한 <b>뒤</b>(번호가 더 큰 migration)에 anon 에게 도로 주는 줄이 없다
     [4] is_my_client 를 부르는 규칙 일곱이 to authenticated 다 — anon 실행권만 빼면
         로그인 안 한 사람이 그 표를 만질 때 빈 답이 아니라 「함수 권한 없음」 오류가 납니다
         (storage.objects 는 통 전체가 한 표라 다른 통을 쓰는 화면까지 오류가 납니다)
     [5] 이 판부터(86 이상) 새로 만드는 SECURITY DEFINER 함수는 <b>같은 파일에서</b>
         anon 실행권을 회수한다 — 같은 경고가 다시 쌓이지 않게
     [6] 다섯 함수를 rpc 로 부르는 곳이 로그인한 본체 화면(app/index.html)뿐이다 —
         랜딩이 anon 키로 부르면 이 판이 그 화면을 깨뜨립니다
     [7] -- 주석이 없다 (9번)
     [8] ★ 앱 안 준비 SQL(HX_SQL · 판 X586)도 같다 — 새 서버를 「한 번에 전부」 로 세우면
         migration 이 아니라 이 SQL 이 돕니다. 여기서 anon 회수 · 규칙 좁히기가 빠지면
         새 서버에 같은 경고가 다시 생깁니다. mbti_mark_paid 는 준비 SQL 이 안 만들어서 뺍니다.
   ⚠ 되돌림 — migration_86 에서 recruits_purge 회수 줄을 빼면 [1] 이, 규칙 한 줄을 빼면 [4] 가 웁니다.
   ⚠ 이 자는 <b>저장소의 SQL</b> 을 봅니다. 서버에 정말 걸렸는지는 못 봅니다 — 걸린 뒤에는
     get_advisors security 에서 그 경고 다섯이 사라졌는지로 확인합니다(대장에 적음).
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

const FN = [
  ['is_my_client', 'uuid'],
  ['is_my_client_or_admin', 'uuid'],
  ['mbti_mark_paid', 'uuid,\\s*text'],
  ['recruits_assign', 'uuid\\[\\],\\s*uuid'],
  ['recruits_purge', 'int(?:eger)?'],
];
const files = fs.readdirSync(ROOT)
  .filter(f => /^migration_\d+.*\.sql$/.test(f))
  .map(f => ({ f, n: +(f.match(/^migration_(\d+)/) || [0, 0])[1], s: fs.readFileSync(path.join(ROOT, f), 'utf8') }))
  .sort((a, b) => a.n - b.n);
/* 주석을 뺀 몸 — 주석 속 글자에 속지 않게 */
const body = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

sec('[1] 다섯 함수의 anon 실행권을 회수한다');
const revokedAt = {};
FN.forEach(([name, args]) => {
  const re = new RegExp('revoke\\s+(?:execute|all)\\s+on\\s+function\\s+public\\.' + name +
                        '\\s*\\(\\s*' + args + '\\s*\\)\\s+from\\s+[^;]*\\banon\\b', 'i');
  const hit = files.filter(x => re.test(body(x.s)));
  revokedAt[name] = hit.length ? hit[hit.length - 1].n : null;
  is(hit.length > 0, name + ' — anon 에게서 회수 (' + (hit.map(x => x.f).join(' · ') || '없음') + ')');
});

sec('[2] 로그인한 사람에게는 실행권을 준다');
FN.forEach(([name, args]) => {
  const re = new RegExp('grant\\s+execute\\s+on\\s+function\\s+public\\.' + name +
                        '\\s*\\(\\s*' + args + '\\s*\\)\\s+to\\s+[^;]*\\bauthenticated\\b', 'i');
  is(files.some(x => re.test(body(x.s))), name + ' — authenticated 에게 준다');
});

sec('[3] ★★ 회수한 뒤에 anon 에게 도로 주지 않는다');
FN.forEach(([name, args]) => {
  const re = new RegExp('grant\\s+[^;]*on\\s+function\\s+public\\.' + name +
                        '\\s*\\(\\s*' + args + '\\s*\\)\\s+to\\s+[^;]*\\b(anon|public)\\b', 'i');
  const after = files.filter(x => revokedAt[name] !== null && x.n > revokedAt[name] && re.test(body(x.s)));
  is(after.length === 0, name + ' — 회수 뒤 도로 준 곳 ' + after.length +
     (after.length ? ' (' + after.map(x => x.f).join(' · ') + ')' : ''));
});

sec('[4] is_my_client 를 부르는 규칙 일곱이 로그인한 사람에게만 걸린다');
const ALL = files.map(x => body(x.s)).join('\n');
[['policies_mine', 'public\\.policies'], ['documents_mine', 'public\\.documents'],
 ['proposals_mine', 'public\\.proposals'], ['coverage_docs_read', 'storage\\.objects'],
 ['coverage_docs_insert', 'storage\\.objects'], ['coverage_docs_update', 'storage\\.objects'],
 ['coverage_docs_delete', 'storage\\.objects']].forEach(([p, t]) => {
  const alt = new RegExp('alter\\s+policy\\s+' + p + '\\s+on\\s+' + t + '\\s+to\\s+authenticated', 'i');
  const crt = new RegExp('create\\s+policy\\s+' + p + '\\s+on\\s+' + t + '[^;]*?\\bto\\s+authenticated', 'i');
  is(alt.test(ALL) || crt.test(ALL), p + ' — to authenticated');
});

sec('[5] 이 판부터 새 SECURITY DEFINER 함수는 같은 파일에서 anon 을 회수한다');
const 새것 = files.filter(x => x.n >= 86);
let 센것 = 0;
새것.forEach(x => {
  const b = body(x.s);
  const re = /create\s+or\s+replace\s+function\s+public\.(\w+)\s*\(([\s\S]*?)\)\s*returns[\s\S]*?\$(\w*)\$[\s\S]*?\$\3\$/gi;
  let m;
  while ((m = re.exec(b))) {
    if (!/security\s+definer/i.test(m[0])) continue;
    센것++;
    const rv = new RegExp('revoke\\s+(?:execute|all)\\s+on\\s+function\\s+public\\.' + m[1] + '\\b[^;]*from\\s+[^;]*\\banon\\b', 'i');
    is(rv.test(b), x.f + ' · ' + m[1] + ' — 같은 파일에서 anon 회수');
  }
});
console.log('    · 86 이상 migration ' + 새것.length + '개 · SECURITY DEFINER 함수 ' + 센것 + '개를 봤습니다');

sec('[6] 다섯 함수를 rpc 로 부르는 곳이 로그인한 본체 화면뿐이다');
const 허락 = ['app/index.html'];
const 걷기 = (d, out) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return;
    const p = path.join(d, e.name);
    if (e.isDirectory()) 걷기(p, out);
    else if (/\.(html|js|mjs|ts)$/.test(e.name)) out.push(p);
  });
  return out;
};
const 부름 = new RegExp("rpc\\s*\\(\\s*['\"](" + FN.map(x => x[0]).join('|') + ")['\"]|/rpc/(" +
                        FN.map(x => x[0]).join('|') + ")\\b");
const 밖 = [];
걷기(ROOT, []).forEach(p => {
  const rel = path.relative(ROOT, p).split(path.sep).join('/');
  if (rel.startsWith('scripts/')) return;
  if (부름.test(fs.readFileSync(p, 'utf8')) && 허락.indexOf(rel) < 0) 밖.push(rel);
});
is(밖.length === 0, '본체 밖에서 부르는 곳 ' + 밖.length + (밖.length ? ' (' + 밖.join(' · ') + ')' : ''));

sec('[7] -- 주석이 없다 (9번)');
const m86 = files.filter(x => /revoke\s+execute\s+on\s+function\s+public\.recruits_purge/i.test(x.s));
m86.forEach(x => is(!x.s.split('\n').some(l => /^\s*--/.test(l)), x.f + ' — -- 주석 0'));

sec('[8] ★ 앱 안 준비 SQL 도 anon 을 회수하고 규칙을 좁힌다 (판 X586)');
const APP = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
/* 준비 SQL 은 "…", 줄의 배열이라 따옴표 · 쉼표를 걷어 한 글로 봅니다 */
const 준비 = body(APP.slice(APP.indexOf('var HX_SQL={'), APP.indexOf('var SETUP_VER='))
  .replace(/"\s*,\s*"/g, ' '));
is(준비.length > 1000, '준비 SQL 을 찾았다 (' + 준비.length + '자)');
FN.filter(x => x[0] !== 'mbti_mark_paid').forEach(([name, args]) => {
  const mk = new RegExp('create\\s+or\\s+replace\\s+function\\s+public\\.' + name + '\\s*\\(', 'i');
  const rv = new RegExp('revoke\\s+(?:execute|all)\\s+on\\s+function\\s+public\\.' + name +
                        '\\s*\\(\\s*' + args + '\\s*\\)\\s+from\\s+[^;]*\\banon\\b', 'i');
  const ga = new RegExp('grant\\s+[^;]*on\\s+function\\s+public\\.' + name +
                        '\\s*\\([^)]*\\)\\s+to\\s+[^;]*\\b(anon|public)\\b', 'i');
  is(mk.test(준비) && rv.test(준비) && !ga.test(준비),
     name + ' — 준비 SQL 이 만들고 · anon 회수 · anon 에게 주는 줄 없음');
});
['policies_mine', 'documents_mine', 'proposals_mine', 'coverage_docs_read', 'coverage_docs_insert',
 'coverage_docs_update', 'coverage_docs_delete'].forEach(p => {
  const mk = 준비.search(new RegExp('create\\s+policy\\s+' + p + '\\b', 'i'));
  const at = 준비.search(new RegExp('alter\\s+policy\\s+' + p + '\\s+on\\s+\\S+\\s+to\\s+authenticated', 'i'));
  is(mk >= 0 && at > mk, p + ' — 준비 SQL 에서 만든 뒤 to authenticated 로 좁힌다');
});

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                : '로그인 안 한 사람은 다섯 함수를 못 부릅니다 — 로그인한 화면은 그대로입니다.');
process.exit(bad ? 1 : 0);
