/* 🔒 <b>계약 · 제안서 · 증권 파일은 담당자 본인만인가</b> — 판 X430

   사장님 말씀 (2026-10-22) 「모두 가능하게 단 <b>본인만 볼 수 있도록</b>」 ·
   「그대로 하고」 · (2026-11-13) 「<b>본인만으로 좁혀</b>」.
   설계 docs/고객한장_설계.md 4장 「보는 사람」 · 말씀대장 X161.

   ── 무엇이 문제였나 ────────────────────────────────────────────
   policies · documents · proposals 와 coverage-docs 통이 모두
   can_see_client() 였습니다. 그 자는 셋을 참으로 봅니다 —
   본인 · 관리자 · <b>팀장</b>. 즉 <b>팀장이 남의 고객 계약과 증권
   파일을 볼 수 있었습니다.</b> 설계는 이 넷을 또렷이 가릅니다:

     사람 기본(clients)      본인 · 관리자 · 팀장
     계약 · 제안서 · 증권    <b>본인만</b>          ← 이 자가 지키는 자리
     청구(claims)            본인 · 관리자         (판 4 에서 팀장을 뺍니다)
     주민번호 · 신분증       본인만 · 관리자도 못 봄 (판 5 금고)

   ── 이 자가 보는 것 ────────────────────────────────────────────
     1. 저장소에 <b>적혀 있나</b> — migration_*.sql 에 is_my_client 가
        서고, 표 셋과 통 넷이 그것을 부르나
     2. ★★ <b>can_see_client 가 그 자리에 남아 있지 않나</b> — 되돌림의
        핵심입니다. 한 곳만 안 고치면 그 표로 다 새어 나갑니다
     3. ★★ <b>묻는 곳이 하나인가</b> (5번) — 조건(advisor_id = auth.uid())을
        규칙마다 베껴 적지 않고 is_my_client() 하나를 부르나
     4. ★★ <b>claims 는 안 건드렸나</b> — 설계가 다르게 가릅니다.
        넓게 잡아 청구까지 좁히면 관리자가 청구를 못 봅니다 (8번)
     5. ★ <b>앱 안 준비 SQL 과 꼴이 같은가</b> — 세 곳(파일 · 앱 · 서버)이
        갈라지면 새 서버는 옛 규칙으로 섭니다. 판 X412 에서 적어 둔 자리입니다
     6. ★ SETUP_VER 과 앱 안 schema_version 이 <b>같은 수</b>인가 —
        다르면 다 돌린 서버가 영원히 「준비 안 됨」 으로 보입니다
     7. ★ SQL 주석에 두 줄표(마이너스 둘)를 안 쓰나 (CLAUDE.md 9번)

   ★ <b>사장님 진짜 서버를 한 번도 안 부릅니다.</b> 서버가 잠깐 느린 날
     CI 가 빨간불이 되면 우리 코드는 멀쩡한데 헛것입니다 (8번).
     서버에 실제로 걸렸는지는 사람이 한 번 걸어 보고 PR 에 적습니다.   */
const fs = require('fs');

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);

/* ── 저장소에 적힌 SQL 을 모읍니다 ───────────────────────────── */
const SQLS = fs.readdirSync('.').filter(f => /^migration_.*\.sql$/.test(f));
const 파일 = SQLS.map(f => ({ 이름: f, 글: fs.readFileSync(f, 'utf8') }));
const 임자 = 파일.filter(f => /is_my_client/.test(f.글));
const APP = fs.readFileSync('app/index.html', 'utf8');

sec('[0] 저장소에 적혀 있나');
is(임자.length >= 1, 'is_my_client 를 적어 둔 migration 파일이 있다 (받음 ' +
   (임자.map(f => f.이름).join(' · ') || '없음') + ')');
if (!임자.length) { console.log('\n✗ 어긋남 ' + (bad || 1) + '곳'); process.exit(1); }
const M = 임자.map(f => f.글).join('\n');

sec('[1] 네 자리가 본인만으로 좁혀져 있나');
[['policies', '계약'], ['documents', '서류(가입제안서 · 증권 파일)'], ['proposals', '제안서 날짜']]
  .forEach(([t, 뜻]) => {
    const re = new RegExp('create policy\\s+' + t + '_mine\\s+on\\s+public\\.' + t +
                          '[\\s\\S]{0,240}?is_my_client', 'i');
    is(re.test(M), 뜻 + ' — ' + t + '_mine 이 is_my_client 를 부른다');
  });
const 통 = (M.match(/create policy\s+coverage_docs_\w+[\s\S]{0,320}?is_my_client/gi) || []).length;
is(통 === 4, '올린 PDF 원문 통(coverage-docs) 네 규칙이 다 is_my_client 다 (받음 ' + 통 + '/4)');

sec('[2] ★★ 옛 규칙이 그 자리에 남아 있지 않나');
/* 되돌림의 핵심 — 한 곳만 can_see_client 로 두면 그 표로 다 샙니다.
   ⚠ 「넓게 잡지 않습니다」(8번) — can_see_client 라는 글자가 저장소에
     있는 것 자체는 괜찮습니다(clients·claims 는 그대로 써야 합니다).
     <b>이 네 자리의 규칙 안에</b> 있는지만 봅니다. */
const 그자리 = (글) => {
  const out = [];
  ['policies', 'documents', 'proposals'].forEach(t => {
    const m = 글.match(new RegExp('create policy\\s+\\w+\\s+on\\s+public\\.' + t +
                                  '\\b[\\s\\S]{0,300}?;', 'gi')) || [];
    m.forEach(x => { if (/can_see_client/.test(x)) out.push(t); });
  });
  const c = 글.match(/create policy\s+coverage_docs_\w+[\s\S]{0,400}?;/gi) || [];
  c.forEach(x => { if (/can_see_client/.test(x)) out.push('coverage-docs'); });
  return out;
};
const 남음 = 그자리(M);
is(남음.length === 0, '네 자리 규칙 안에 can_see_client 가 <b>한 곳도 없다</b>' +
   (남음.length ? ' — 남은 곳: ' + 남음.join(' · ') : ''));

sec('[3] ★★ 묻는 곳이 하나인가 (5번)');
/* 조건을 규칙마다 베껴 적으면 한 곳만 고쳐지는 날이 옵니다.
   is_my_client 의 <b>몸</b> 한 곳에만 advisor_id = auth.uid() 가 있어야 합니다. */
const 몸 = (M.match(/create or replace function public\.is_my_client[\s\S]*?\$fn\$;/i) || [''])[0];
is(/advisor_id\s*=\s*auth\.uid\(\)/.test(몸), 'is_my_client 의 몸이 advisor_id = auth.uid() 를 본다');
const 베낌 = (M.replace(몸, '').match(/advisor_id\s*=\s*auth\.uid\(\)/g) || []).length;
is(베낌 === 0, '규칙 쪽에는 그 조건을 <b>한 번도 베껴 적지 않았다</b> (받음 ' + 베낌 + '곳)');
is(/grant execute on function public\.is_my_client\(uuid\) to authenticated/i.test(M),
   '앱이 그 자를 부를 수 있게 권한을 준다 — 안 주면 규칙이 통째로 거짓이 된다');

sec('[4] ★★ 청구(claims)는 한 자도 안 건드렸나');
/* ⚠ 처음에 「is_my_client 가까이에 claims 가 있나」 로 쟀다가 <b>주석의 글귀</b>를
   잡았습니다 — 「★ claims 는 한 자도 안 건드립니다」 라는 설명 문장이었습니다.
   헛것을 잡는 점검은 안 잡는 점검보다 나쁩니다 (8번). <b>주석을 지우고 SQL 몸만</b>
   봅니다 — 그러면 설명을 아무리 적어도 안 울고, 정말로 건드리면 웁니다. */
const 몸만 = M.replace(/\/\*[\s\S]*?\*\//g, ' ');
is(!/\bclaims\b/i.test(몸만),
   'SQL 몸에 claims 가 <b>한 번도 안 나온다</b> — 설계가 「본인 · 관리자」 로 따로 가릅니다 (판 4)');
is(!/\bon\s+public\.claims\b/i.test(M), 'claims 규칙을 다시 적지 않는다');

sec('[5] ★ 앱 안 준비 SQL 과 꼴이 같은가 (판 X412 에서 적어 둔 자리)');
/* ⚠ 처음에는 「create policy X on Y for all」 <b>머리만</b> 견주었습니다.
   그러자 되돌림 ⑥(앱 쪽 꼬리를 for all2 로 바꾸기)이 <b>안 울었습니다</b> —
   머리가 그대로라 그냥 지나갔습니다. 이제 <b>문장을 통째로</b> 견줍니다 (8번). */
/* ⚠ 앱 안 SQL 은 <b>줄마다 따옴표로 싸인 배열</b>입니다. 따옴표만 지우면
   줄과 줄 사이의 쉼표가 SQL 안으로 섞여 들어와(「public.team_todos,for update」)
   영영 안 맞습니다. 이음매(",\n  ")를 <b>먼저</b> 지웁니다. */
const 씻기 = (t) => t.replace(/"\s*,\s*"/g, ' ').replace(/"/g, ' ')
                     .replace(/\s+/g, ' ').replace(/\s*([(),;])\s*/g, '$1').trim();
/* 준비 SQL 의 문장들 — 세미콜론까지 하나로 */
const 문장 = (글) => (글.match(/create (?:policy|or replace function)[\s\S]*?;/gi) || [])
  .map(씻기)
  /* 이 판이 세우는 여덟만 봅니다 — 「_mine」 으로 넓게 잡으면 다른 판이
     만든 team_todos_update_mine 까지 걸려 헛것이 됩니다 (8번). */
  .filter(x => /(policies|documents|proposals)_mine|coverage_docs_(read|insert|update|delete)|is_my_client\(cid uuid\)/.test(x));
const 자료 = 문장(M), 앱문장 = 문장(APP);
is(자료.length >= 8, '준비 SQL 에 문장이 여덟 이상이다 (받음 ' + 자료.length + ')');
const 빠짐 = 자료.filter(x => 앱문장.indexOf(x) < 0);
is(빠짐.length === 0,
   '준비 SQL 의 문장이 <b>앱 안 SQL 에도 글자 그대로</b> 있다' +
   (빠짐.length ? ' — 다른 곳 ' + 빠짐.length + '개: ' + 빠짐[0].slice(0, 90) + '…' : ''));
const 더함 = 앱문장.filter(x => 자료.indexOf(x) < 0);
is(더함.length === 0,
   '앱 안에만 <b>몰래 더 적힌 문장이 없다</b>' +
   (더함.length ? ' — ' + 더함[0].slice(0, 90) + '…' : ''));

sec('[6] ★ 판 번호가 앱과 준비 SQL 에서 같은가');
const v1 = (APP.match(/var SETUP_VER\s*=\s*(\d+)/) || [])[1];
const v2 = (APP.match(/values\s*\(\s*'schema_version'\s*,\s*'(\d+)'\s*\)/) || [])[1];
is(!!v1 && v1 === v2,
   'SETUP_VER(' + v1 + ') 과 앱 안 schema_version(' + v2 + ') 이 같다 — ' +
   '다르면 다 돌린 서버가 영원히 「준비 안 됨」 으로 보입니다');
is(Number(v1) >= 46, '판 번호가 46 이상이다 — 이 좁히기가 들어간 판 (받음 ' + v1 + ')');

sec('[7] ★ SQL 주석이 /* */ 만인가 (9번)');
const 쌍댓글 = 임자.map(f => ({ 이름: f.이름, n: (f.글.split('\n').filter(l => /^\s*--/.test(l)).length) }))
                  .filter(x => x.n);
/* ⚠⚠ <b>여기에 자를 하나 세웠다가 뺐습니다 — 울 수 없는 알람이었습니다.</b>
   머리 주석 안에 「주석은 슬래시-별 만 씁니다」 라고 그 기호를 그대로 적었더니
   <b>제 자바스크립트 자가</b> 그 자리에서 깨졌습니다(JS 는 주석을 못 겹칩니다).
   그래서 SQL 도 깨진 줄 알고 「여는 수와 닫는 수가 같은가」 를 세웠는데 —
   ① 되돌려 보니 <b>안 울었습니다</b>(기호를 적으면 여는 수도 닫는 수도 같이 늘어납니다)
   ② 서버에 직접 물어보니 <b>Postgres 는 주석을 겹쳐 씁니다</b> — SQL 은 애초에
      안 깨졌습니다. 깨진 것은 제 자 하나뿐이었고, 그쪽은 check-html 이 봅니다.
   <b>헛것을 잡는 점검은 안 잡는 점검보다 나쁩니다</b> (8번). 그래서 안 둡니다 —
   다음 세션이 같은 자를 다시 세우지 않도록 까닭을 여기 남깁니다. */
is(쌍댓글.length === 0, '-- 주석이 없다' +
   (쌍댓글.length ? ' — ' + 쌍댓글.map(x => x.이름 + ' ' + x.n + '줄').join(' · ') : ''));

console.log('\n──────────────────────────────');
console.log(bad ? ('✗ ' + bad + '군데가 걸렸습니다.')
                : '계약 · 제안서 · 증권 파일은 담당자 본인만입니다 — 묻는 곳은 한 곳입니다.');
process.exit(bad ? 1 : 0);
