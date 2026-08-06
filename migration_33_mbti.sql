set search_path = public;

create table if not exists public.mbti_tests(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  subject_name text not null default '',
  subject_kind text not null default 'client',
  memo text default '',
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  type_code text default '',
  consistency int default 0,
  paid boolean not null default false,
  paid_at timestamptz,
  pay_method text default '',
  order_id text,
  amount int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.mbti_tests add column if not exists memo text default '';
alter table public.mbti_tests add column if not exists consistency int default 0;
alter table public.mbti_tests add column if not exists paid boolean not null default false;
alter table public.mbti_tests add column if not exists paid_at timestamptz;
alter table public.mbti_tests add column if not exists pay_method text default '';
alter table public.mbti_tests add column if not exists order_id text;
alter table public.mbti_tests add column if not exists amount int;
alter table public.mbti_tests add column if not exists updated_at timestamptz default now();

create index if not exists mbti_tests_member_idx on public.mbti_tests(member_id, created_at desc);
create index if not exists mbti_tests_paid_idx on public.mbti_tests(paid, created_at desc);
create index if not exists mbti_tests_order_idx on public.mbti_tests(order_id);

alter table public.mbti_tests enable row level security;

drop policy if exists mbti_tests_read on public.mbti_tests;
create policy mbti_tests_read on public.mbti_tests
  for select to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists mbti_tests_insert on public.mbti_tests;
create policy mbti_tests_insert on public.mbti_tests
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists mbti_tests_update on public.mbti_tests;
create policy mbti_tests_update on public.mbti_tests
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists mbti_tests_delete on public.mbti_tests;
create policy mbti_tests_delete on public.mbti_tests
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

revoke all on public.mbti_tests from authenticated;

grant select on public.mbti_tests to authenticated;
grant delete on public.mbti_tests to authenticated;

grant insert (id, member_id, subject_name, subject_kind, memo, answers, scores, type_code, consistency, created_at)
  on public.mbti_tests to authenticated;

grant update (subject_name, subject_kind, memo, answers, scores, type_code, consistency, updated_at)
  on public.mbti_tests to authenticated;

create or replace function public.mbti_mark_paid(p_id uuid, p_method text default 'manual')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hit boolean;
begin
  if not (public.is_admin() or public.is_owner()) then
    return false;
  end if;
  update public.mbti_tests
     set paid = true,
         paid_at = now(),
         pay_method = coalesce(p_method, 'manual'),
         updated_at = now()
   where id = p_id;
  get diagnostics hit = row_count;
  return hit;
end;
$$;

revoke all on function public.mbti_mark_paid(uuid, text) from public;
grant execute on function public.mbti_mark_paid(uuid, text) to authenticated;

insert into public.app_config(key, value)
values ('schema_version', '33')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  to_regclass('public.mbti_tests') is not null                      as 성향검사_표,
  (select count(*) from public.mbti_tests)                          as 검사기록,
  (select count(*) from public.mbti_tests where paid)               as 결제된_리포트,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'mbti_tests')       as 정책수,
  to_regprocedure('public.mbti_mark_paid(uuid,text)') is not null   as 입금확인_함수;
