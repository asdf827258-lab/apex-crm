set search_path = public;

create table if not exists public.legal_consents(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  kind text not null,
  version text not null default '1',
  agreed boolean not null default true,
  agreed_at timestamptz default now(),
  meta jsonb not null default '{}'::jsonb
);

alter table public.legal_consents add column if not exists version text not null default '1';
alter table public.legal_consents add column if not exists agreed boolean not null default true;
alter table public.legal_consents add column if not exists meta jsonb not null default '{}'::jsonb;

create unique index if not exists legal_consents_uniq
  on public.legal_consents(member_id, kind, version);
create index if not exists legal_consents_member_idx on public.legal_consents(member_id);
create index if not exists legal_consents_kind_idx on public.legal_consents(kind, agreed_at desc);

alter table public.legal_consents enable row level security;

drop policy if exists legal_consents_read on public.legal_consents;
create policy legal_consents_read on public.legal_consents
  for select to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists legal_consents_insert on public.legal_consents;
create policy legal_consents_insert on public.legal_consents
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists legal_consents_update on public.legal_consents;
create policy legal_consents_update on public.legal_consents
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

grant select on public.legal_consents to authenticated;
grant insert, update on public.legal_consents to authenticated;

insert into public.app_config(key, value) values
  ('biz_name',      ''),
  ('biz_ceo',       ''),
  ('biz_no',        ''),
  ('biz_addr',      ''),
  ('biz_tel',       ''),
  ('biz_email',     ''),
  ('biz_mailorder', ''),
  ('privacy_officer', '')
on conflict (key) do nothing;

insert into public.app_config(key, value)
values ('schema_version', '32')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  to_regclass('public.legal_consents') is not null as 동의기록표,
  (select count(*) from public.legal_consents where kind = 'terms')     as 약관동의,
  (select count(*) from public.legal_consents where kind = 'privacy')   as 방침동의,
  (select count(*) from public.legal_consents where kind = 'sensitive') as 민감정보동의,
  (select count(*) from public.app_config
    where key like 'biz_%' and coalesce(value, '') <> '')                as 사업자정보_채운칸;
