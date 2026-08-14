/* ════════════════════════════════════════════════════════════════
   지금 서버가 어디까지 되어 있는지 봅니다

   <b>고치는 것은 하나도 없습니다. 읽기만 합니다.</b>
   몇 번을 돌려도 안전하고, 되돌릴 것도 없습니다.

   Supabase → SQL Editor 에 붙여 넣고 Run 하시면 표가 하나 나옵니다.
   「없음」이 있으면 그 줄에 적힌 파일을 실행하시면 됩니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

with chk as (
  select 1 as n,
         '① 통화 기록을 본인이 고칠 수 있는가' as "무엇",
         (to_regprocedure('public.can_edit_call(uuid)') is not null) as ok,
         'migration_41_calls.sql' as "실행할 파일"
  union all
  select 2, '② DB 목록에 단계 칸 (dbs.stage)',
         exists(select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'dbs'
                   and column_name = 'stage'),
         'migration_41_calls.sql'
  union all
  select 3, '③ 계약일 · 증권전달일 · 증권번호',
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'dbs'
             and column_name in ('contracted_at', 'policy_sent_at', 'policy_no')) = 3,
         'migration_41_calls.sql'
  union all
  select 4, '④ DB 목록에 약속 시각 (dbs.next_appt)',
         exists(select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'dbs'
                   and column_name = 'next_appt'),
         'migration_41_calls.sql'
  union all
  select 5, '⑤ 고객 365일에 약속 시각 (clients.next_appt)',
         exists(select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'clients'
                   and column_name = 'next_appt'),
         'migration_42_appt.sql'
)
select "무엇",
       case when ok then '있음' else '없음' end as "상태",
       case when ok then '' else "실행할 파일" end as "할 일"
  from chk
 order by n;
