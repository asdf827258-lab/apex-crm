/* 접촉 기록을 고칠 수 있는가.

   저장이 오류로 두세 번 들어가는 일이 있고, 결과를 잘못 고른 일도 있다.
   그런데 지금까지 한 번 남긴 기록은 <b>손댈 수 없었다.</b> 그 기록이
   그대로 남으면 타율이 통째로 틀어진다 — 접촉률도 전환율도 다 거짓이 된다.

   여기서 확인한다.

     1. 이력에 고치기·지우기 단추가 붙는가
     2. 중복을 찾아내는가 (같은 결과가 5분 안에 또 들어간 것)
     3. 저장 단추를 두 번 눌러도 두 줄이 안 들어가는가
     4. 남의 기록은 못 건드리는가 — 화면에서도, DB 에서도
     5. 약속 시각이 DB 쪽에도 남는가 (고객으로 넘길 때 잃지 않게)   */
const fs = require('fs'); const path = require('path');
const ROOT = process.cwd();

let pass = 0, fail = 0;
const ok = m => { pass++; console.log('  ✓ ' + m); };
const no = m => { fail++; console.log('  ✗ ' + m); };
const is = (c, m) => c ? ok(m) : no(m);

const crm = fs.readFileSync(path.join(ROOT, 'db-crm.html'), 'utf8');
const sqlPath = path.join(ROOT, 'migration_41_calls.sql');
const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf8') : '';

/* ═══ 1. 화면 ═══ */
console.log('\n[1] 통화 이력을 고치고 지울 수 있는가');
is(/function delCall\(/.test(crm), '지우는 길이 있다');
is(/function editCall\(/.test(crm), '고치는 길이 있다');
is(/function cleanDup\(/.test(crm), '중복을 한 번에 지우는 길이 있다');
is(/✏️ 고치기/.test(crm) && /🗑 지우기/.test(crm), '이력 줄마다 단추가 붙는다');
is(/confirm\(/.test(crm.slice(crm.indexOf('async function delCall'), crm.indexOf('async function delCall') + 700)),
  '지우기 전에 무엇을 지우는지 보여 주고 묻는다');
is(/되돌릴 수 없습니다/.test(crm), '되돌릴 수 없다고 밝힌다');

/* ═══ 2. 중복 찾기 ═══
   같은 결과가 5분(300,000ms) 안에 또 들어갔으면 중복으로 본다.
   여기서 그 규칙을 떼어 내 직접 돌려 본다. */
console.log('\n[2] 중복을 제대로 골라내는가');
const dupSrc = crm.slice(crm.indexOf('function dupCalls('), crm.indexOf('function renderHistory('));
let dupCalls;
try { dupCalls = new Function(dupSrc + '\nreturn dupCalls;')(); } catch (e) { dupCalls = null; }
is(!!dupCalls, '중복 판별 규칙을 떼어 낼 수 있다');
if (dupCalls) {
  const t = '2026-08-13T10:00:00Z';
  const t2 = '2026-08-13T10:02:00Z';   /* 2분 뒤 — 같은 5분 칸 */
  const t3 = '2026-08-13T10:40:00Z';   /* 40분 뒤 — 다른 칸 */
  const mk = (id, r, at) => ({ id: id, result: r, call_at: at });

  const a = dupCalls([mk('a', '부재', t), mk('b', '부재', t2)]);
  is(a.length === 1 && a[0] === 'b', '같은 결과가 5분 안에 두 번 → 뒤엣것만 중복 (' + a.join(',') + ')');

  const b = dupCalls([mk('a', '부재', t), mk('b', '부재', t3)]);
  is(b.length === 0, '40분 떨어져 있으면 중복이 아니다');

  const c = dupCalls([mk('a', '부재', t), mk('b', '상담', t2)]);
  is(c.length === 0, '결과가 다르면 중복이 아니다 — 부재 뒤 상담은 정상');

  const d = dupCalls([mk('a', '부재', t), mk('b', '부재', t2), mk('c', '부재', t2)]);
  is(d.length === 2, '세 번 겹치면 <b>처음 것만 남기고</b> 둘을 지운다 (' + d.length + '건)');
}

/* ═══ 3. 두 번 눌림 ═══ */
console.log('\n[3] 저장을 두 번 눌러도 두 줄이 안 들어가는가');
is(/let savingCall\s*=\s*false/.test(crm), '저장 중인지 기억한다');
const saveSrc = crm.slice(crm.indexOf('async function saveCall'), crm.indexOf('async function saveCall') + 1600);
is(/if\(savingCall\)/.test(saveSrc), '저장 중이면 두 번째 누름을 막는다');
is(/btn\.disabled\s*=\s*true/.test(saveSrc), '단추도 잠근다 — 눈으로도 보이게');
is(/savingCall\s*=\s*false/.test(saveSrc), '끝나면 다시 풀어 준다 (실패해도)');
is(/editCallId/.test(saveSrc) && /\.update\(payload\)/.test(saveSrc),
  '고치는 중이면 새로 만들지 않고 그 줄을 고친다');

/* ═══ 4. 남의 것은 못 건드린다 ═══ */
console.log('\n[4] 남의 기록은 못 건드리는가');
is(/function canEditCall\(/.test(crm), '화면에서 먼저 가린다');
is(/c\.created_by===profile\.id/.test(crm), '본인이 남긴 것인지 본다');
is(/canManage\(\)\|\|isLeader\(\)/.test(crm), '운영자·리더는 팀 것을 손댈 수 있다');
is(/본인이 남긴 기록만/.test(crm), '막혔을 때 왜 막혔는지 말한다');

is(/create or replace function public\.can_edit_call/.test(sql), 'DB 도 같은 규칙으로 막는다');
is(/author = auth\.uid\(\)/.test(sql), 'DB 에서도 본인 것인지 본다');
is(/t\.leader_id = auth\.uid\(\)/.test(sql), '리더는 <b>자기가 이끄는 팀</b>만');
is(/for delete to authenticated/.test(sql), '삭제 규칙이 생긴다');
is(/pg_policies/.test(sql), '이미 있는 규칙은 건드리지 않는다 — 문을 좁히면 안 된다');
is(!/--/.test(sql), 'SQL 에 -- 주석을 안 쓴다 (붙여넣을 때 깨진다)');

/* ═══ 5. 약속 시각 ═══ */
console.log('\n[5] 약속 시각을 잃지 않는가');
is(/add column if not exists next_appt/.test(sql), 'DB 쪽에도 약속 시각 자리를 만든다');
is(/create or replace function public\.sync_db_appt/.test(sql), '통화에 약속이 잡히면 자동으로 옮긴다');
is(/create trigger calls_appt_sync/.test(sql), '넣을 때도 고칠 때도 따라간다');
is(/update public\.dbs d[\s\S]{0,200}max\(appointment_at\)/.test(sql), '이미 쌓인 약속도 한 번 옮긴다');
is(/greatest\(/.test(sql), '가장 늦은 약속을 남긴다 — 옛 약속이 새 약속을 덮지 않는다');

/* ═══ 6. 단계 ═══ */
console.log('\n[6] 계약완료 · 증권전달 자리가 생기는가');
is(/'계약완료','증권전달'/.test(sql), '단계에 계약완료와 증권전달이 들어간다');
is(/'미접촉','TA','AP','PC','CS'/.test(sql), '기존 단계는 그대로 둔다');
is(/contracted_at/.test(sql) && /policy_sent_at/.test(sql), '언제 계약했고 언제 증권을 보냈는지 적을 자리');
is(/policy_no/.test(sql), '증권번호 자리도 만든다');
is(/drop constraint/.test(sql), '옛 제약을 풀고 새로 건다 — 안 풀면 새 단계가 안 들어간다');

console.log('\n──────────────────────────────');
console.log(fail === 0
  ? '접촉 기록 점검 통과 — ' + pass + '가지 다 맞습니다.'
  : '접촉 기록 점검 실패 — ' + fail + '가지 어긋납니다 (통과 ' + pass + ').');
process.exit(fail === 0 ? 0 : 1);
