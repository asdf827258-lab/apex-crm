/* ══════════════════════════════════════════════════════════════════
   서버확인_빠진셋.sql (판 X189) — 준비 SQL 이 <b>정말</b> 들어갔나

   ★★ 왜 따로 두나.
     사장님이 붙여넣으신 준비 SQL 끝에는 확인 줄이 있는데, 거기 쓰인
     to_regproc() 는 <b>같은 이름의 함수가 둘 이상이면 NULL</b> 을 돌려줍니다.
     admin_delete_account 는 2인자·3인자 <b>둘</b> 이라서, 멀쩡히 서 있는데도
     「안 됨」 이라고 나옵니다. 자가 거짓말을 하면 사람이 그 자를 안 믿게
     됩니다 (CLAUDE.md 1번 · 8번).

   ★ 그래서 여기서는 <b>이름으로 묻지 않고 갯수로 셉니다.</b>
   ★ 읽기만 합니다 — 아무것도 바꾸지 않습니다.
   ★ Supabase → SQL Editor 에 통째로 붙여넣고 돌리십시오.
   ══════════════════════════════════════════════════════════════════ */

select '① 고객 동의 표(client_consents)' as 항목,
       (select count(*) from information_schema.tables
         where table_schema='public' and table_name='client_consents') = 1 as 됨,
       (select count(*)::text||'칸 · 규칙 '||
               (select count(*) from pg_policies
                 where schemaname='public' and tablename='client_consents')::text||'개 · RLS '||
               (select case when c.relrowsecurity then '켜짐' else '꺼짐' end
                  from pg_class c join pg_namespace n on n.oid=c.relnamespace
                 where n.nspname='public' and c.relname='client_consents')
          from information_schema.columns
         where table_schema='public' and table_name='client_consents') as 속

union all
select '② 동의 요약하는 자(client_consents_sum)',
       (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='client_consents_sum') >= 1,
       coalesce((select '방아쇠 '||t.tgname
                   from pg_trigger t join pg_class c on c.oid=t.tgrelid
                        join pg_namespace n on n.oid=c.relnamespace
                  where n.nspname='public' and c.relname='client_consents'
                    and not t.tgisinternal limit 1), '방아쇠가 안 붙었습니다')

union all
/* ★ 여기가 사장님 SQL 이 거짓말하던 자리입니다 — 갯수로 셉니다 */
select '③ 계정 삭제(admin_delete_account)',
       (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='admin_delete_account') >= 1,
       (select string_agg('('||pg_get_function_identity_arguments(p.oid)||')', ' / ' order by p.oid)
          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='admin_delete_account')

union all
select '④ 판 번호 (45 여야 함)',
       (select value from public.app_config where key='schema_version') = '45',
       coalesce((select value from public.app_config where key='schema_version'), '(안 적혀 있음)')

union all
/* ★ 손님(anon)이 계정 삭제를 부를 수 있으면 안 됩니다 (판 X189 에서 거뒀습니다).
     함수 첫 줄의 is_owner() 가 이미 막지만, 잠금은 둘이 낫습니다. */
select '⑤ 손님(anon)은 계정 삭제를 못 부른다',
       not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                   where n.nspname='public'
                     and p.proname in ('admin_delete_account','admin_account_refs')
                     and has_function_privilege('anon', p.oid, 'EXECUTE')),
       coalesce((select string_agg(p.proname||'('||pg_get_function_identity_arguments(p.oid)||')', ' / ')
                   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public'
                    and p.proname in ('admin_delete_account','admin_account_refs')
                    and has_function_privilege('anon', p.oid, 'EXECUTE')),
                '(없습니다 — 이것이 맞습니다)')

union all
select '⑥ 로그인한 사람은 부를 수 있다',
       (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='admin_delete_account'
           and has_function_privilege('authenticated', p.oid, 'EXECUTE'))
       = (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname='admin_delete_account'),
       '화면이 부르는 자리입니다 — 여기까지 막으면 대표님도 못 지우십니다';
