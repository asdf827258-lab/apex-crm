#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   계정 삭제 — 눌러서 정말 지워지나

   「계정 삭제」를 눌러도 지워지지 않는 일이 되풀이됐습니다. 화면 탓이
   아니었습니다. profiles 를 가리키는 표가 <b>34개</b>이고 그중 다섯은
   비울 수 없는 필수 칸이라(dbs.assigned_to 에 고객 1,049명), 외래키가
   delete 를 막고 있었습니다. hard=true 는 <b>개수 검사만</b> 건너뛸 뿐
   그 줄들을 손대지 않아 언제나 실패했습니다.

   여기서 지키는 것은 넷입니다.
     ① 지우기 전에 <b>고객을 어디로 보낼지</b> 고르게 하나
     ② 고객 자료를 <b>말없이 지우지</b> 않나
     ③ 「누가 했는가」 기록을 <b>남에게 넘기지</b> 않나
     ④ 표 이름을 손으로 적어 두지 않나 — 적어 두면 표가 늘 때 또 막힌다
   ══════════════════════════════════════════════════════════════════ */
const fs = require('fs'), path = require('path');
const R = process.cwd();
const SRC = fs.readFileSync(path.join(R, 'app/index.html'), 'utf8');
const MIG = path.join(R, 'migration_51_acct_delete.sql');
let bad = 0, n = 0;
const is = (ok, m) => { n++; console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('\n[1] 서버 쪽 준비 SQL');
is(fs.existsSync(MIG), 'migration_51_acct_delete.sql 이 있다');
const S = fs.existsSync(MIG) ? fs.readFileSync(MIG, 'utf8') : '';
is(/create or replace function public\.admin_delete_account\(\s*\n?\s*target uuid, hard boolean default false, heir uuid default null\)/.test(S),
   '삭제 함수가 <b>넘겨받을 사람(heir)</b>을 받는다');
is(/drop function if exists public\.admin_delete_account\(uuid, boolean\)/.test(S),
   '옛 함수를 <b>지우고</b> 만든다 — 두 벌이 남으면 서버가 어느 쪽인지 못 고른다');
is(!/--/.test(S), 'SQL 주석에 <b>-- 를 안 쓴다</b> (9번)');
is(/create or replace/.test(S) && !/create function public\.admin/.test(S),
   '<b>여러 번 돌려도 안전</b>하다 (or replace)');

console.log('\n[2] 표 이름을 손으로 적어 두지 않는다');
is(/from pg_constraint c/.test(S) && /confrelid = 'public\.profiles'::regclass/.test(S),
   '가리키는 칸을 <b>지금 스키마에서 읽는다</b> — 표가 늘어도 안 낡는다');
const listed = (S.match(/\b(dbs|calls|clients|consultations|coaching_records)\.\w+\s*=/g) || []).length;
is(listed === 0, listed ? ('표 이름을 ' + listed + '곳에 박아 뒀습니다') : '표 이름을 <b>update 문에 박아 두지 않았다</b>');

console.log('\n[3] 고객 자료를 말없이 지우지 않는다 (1번)');
is(/if heir is not null then[\s\S]{0,200}?update %s set %I = \$1/.test(S),
   '넘겨받을 사람이 있으면 <b>옮긴다</b> — 안 지운다');
is(/elsif hard then[\s\S]{0,120}?delete from %s/.test(S),
   '통째로 지우기는 <b>따로 골라야만</b> 돈다');
is(/raise exception '이 계정에 매달린 기록이 있습니다/.test(S),
   '둘 다 안 고르면 <b>무엇이 몇 건 걸렸는지</b> 말하고 멈춘다');

console.log('\n[4] 「누가 했는가」는 남에게 안 넘긴다');
is(/set %I = null where %I = \$1/.test(S),
   '비울 수 있는 칸은 <b>비운다</b> — heir 로 안 바꾼다');
is(/거짓이 됩니다|거짓/.test(S), '왜 그러는지 <b>그 자리에 적혀</b> 있다');

console.log('\n[5] 화면 — 지우기 전에 고르게 한다');
is(/rpc\('admin_account_refs_json'/.test(SRC), '무엇이 매달렸는지 <b>표별로</b> 먼저 읽는다');
is(/id="osAcHeir"/.test(SRC), '<b>넘겨받을 사람 고르는 칸</b>이 있다');
is(/id="osAcPurge"/.test(SRC), '<b>통째로 지우기</b>는 따로 체크해야 한다');
is(/heir:heir/.test(SRC), '고른 사람을 서버로 <b>실제로 넘긴다</b>');
is(/hasMust&&!purge&&!heir/.test(SRC),
   '옮길 것이 있는데 <b>아무것도 안 고르면 안 지운다</b>');
is(/고객 자료는 안 없어집니다/.test(SRC), '무슨 일이 일어나는지 <b>화면에 적는다</b>');
is(/되돌릴 수 없음/.test(SRC), '되돌릴 수 없다는 것도 적는다');

console.log('\n[6] 지운 뒤 <b>정말 사라졌는지</b> 확인한다');
is(/목록에서 정말 사라졌는지 확인하는 중/.test(SRC),
   '서버가 「됐다」 해도 <b>목록을 다시 읽어</b> 본다');
is(/서버는 지웠다고 했는데 목록에 그대로 있습니다/.test(SRC),
   '남아 있으면 <b>남아 있다고</b> 말한다 — 실패를 성공처럼 말하지 않는다 (1번)');

console.log('\n[7] 만드는 자리가 하나인가 (5번)');
['osAcDelete', 'osAcDelPanel', 'osAcDelGo', 'osAcDelFail'].forEach(f => {
  const c = (SRC.match(new RegExp('function\\s+' + f + '\\s*\\(', 'g')) || []).length;
  is(c === 1, f + '() 가 ' + c + '곳에 있다');
});

console.log('\n' + '─'.repeat(30));
if (bad) { console.log('✗ ' + bad + '가지 빨간불'); process.exit(1); }
console.log('계정 승계·삭제 점검 통과 — ' + n + '가지. 고객을 잃지 않고 계정만 지웁니다.');
