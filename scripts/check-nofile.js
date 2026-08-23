/* 「그 파일을 여세요」 라고 말하지 않는다.

   대표님께 파일 이름을 알려 주면, 그 파일을 <b>찾아서 여는 일</b>이 남는다.
   그러면 안 하신다 — 실제로 아무도 안 했고, 그래서 기능이 꺼진 채로 몇 달이
   지났다. 필요한 SQL 은 전부 앱 안에 있다(HX_SQL). 그러니 화면은
   <b>무엇이 없는지</b>만 말하고 <b>누를 자리</b>를 같이 줘야 한다.

   여기서 보는 것은 셋.
     1. 화면에 보이는 글 어디에도 migration_*.sql 파일 이름이 없다
     2. 저장소의 마이그레이션 파일이 앱 안 SQL 칸으로 다 들어와 있다
     3. 그 칸을 여는 단추(sqlGo)와 알림 상자(sqlNeedHtml)가 실제로 있다

   주석은 봐 준다 — 고치는 사람이 출처를 알아야 하고, 그건 화면에 안 뜬다. */
const fs = require('fs'), path = require('path');
let bad = [], pass = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { bad.push(m); console.log('  ✗ ' + m); } };

/* 주석을 걷어 낸다. 화면에 뜨는 것은 주석이 아닌 글이다. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')      /* 여러 줄 주석 */
    .replace(/^[ \t]*\/\/.*$/gm, ' ');      /* 줄 주석 */
}

console.log('\n[1] 화면 글에 파일 이름이 없다');
['app/index.html', 'app/day.html', 'app/team.html'].forEach(f => {
  const src = stripComments(fs.readFileSync(f, 'utf8'));
  const hits = [];
  src.split('\n').forEach((l, i) => {
    /* HX_SQL 안의 SQL 문자열도 화면에 보인다(복사해서 붙여넣는 글이다) */
    const m = l.match(/migration_[A-Za-z0-9_]*\.sql/);
    if (m) hits.push((i + 1) + '행 — ' + m[0]);
  });
  ok(hits.length === 0, f + ' — 파일 이름을 알리지 않는다' + (hits.length ? ('\n      ' + hits.slice(0, 6).join('\n      ')) : ''));
});

console.log('\n[2] 저장소의 SQL 이 앱 안으로 들어와 있는가');
const app = fs.readFileSync('app/index.html', 'utf8');
/* HX_SQL 덩이가 만드는 표를 전부 모은다 */
const inApp = new Set();
(app.match(/create table if not exists public\.[a-z_]+/g) || [])
  .forEach(x => inApp.add(x.replace(/.*public\./, '')));
/* 저장소 파일이 만드는 표 가운데, 앱이 화면에서 쓰는 것 */
const files = fs.readdirSync('.').filter(f => /^migration_.*\.sql$/.test(f));
ok(files.length > 0, '저장소에 마이그레이션 파일이 ' + files.length + '개 있다');
const missing = [];
files.forEach(f => {
  const sql = fs.readFileSync(f, 'utf8');
  (sql.match(/create table if not exists public\.[a-z_]+/g) || []).forEach(x => {
    const t = x.replace(/.*public\./, '');
    /* 앱이 실제로 부르는 표만 본다 — 안 쓰는 옛 표까지 들고 있을 필요는 없다 */
    if (!inApp.has(t) && new RegExp("from\\('" + t + "'\\)").test(app)) missing.push(t + ' (' + f + ')');
  });
});
ok(missing.length === 0,
  '앱이 부르는 표는 전부 앱 안 SQL 로 만들 수 있다' + (missing.length ? (' · 빠짐: ' + [...new Set(missing)].join(', ')) : ''));

console.log('\n[3] 누를 자리가 실제로 있는가');
ok(/function sqlGo\(k\)/.test(app), 'sqlGo — 복사하고 Supabase 를 연다');
ok(/function sqlNeedHtml\(k,what\)/.test(app), 'sqlNeedHtml — 화면 안에 알림 상자를 세운다');
ok(/function sqlNeedText\(what\)/.test(app), 'sqlNeedText — toast 한 줄');
ok(/onclick="sqlGo\(/.test(app) || /sqlGo\(\\'/.test(app), '단추가 실제로 sqlGo 를 부른다');
const listed = (app.match(/var ks=\[([^\]]*)\]/) || [])[1] || '';
const keys = (app.match(/^ '([0-9A-Za-z_]+)':\{label:/gm) || []).map(x => x.replace(/^ '|':\{label:$/g, ''));
const notListed = keys.filter(k => listed.indexOf("'" + k + "'") < 0);
ok(notListed.length === 0,
  'SQL 칸 ' + keys.length + '개가 시스템 점검에 다 서 있다' + (notListed.length ? (' · 빠짐: ' + notListed.join(', ')) : ''));

console.log('\n──────────────────────────────');
if (bad.length) { console.log('파일 이름 점검 실패 — ' + bad.length + '가지 어긋납니다 (통과 ' + pass + ').'); process.exit(1); }
console.log('파일 이름 점검 통과 — 누를 자리만 알려 줍니다 (' + pass + '가지).');
