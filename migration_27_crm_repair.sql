set search_path = public;

do $blk$
declare
  t text;
  rls boolean;
  n_write integer;
begin
  foreach t in array array['dbs','calls'] loop
    if to_regclass('public.'||t) is null then
      continue;
    end if;

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    select relrowsecurity into rls from pg_class where oid = ('public.'||t)::regclass;
    if not rls then
      continue;
    end if;

    select count(*) into n_write
      from pg_policies
     where schemaname = 'public' and tablename = t
       and cmd in ('INSERT','UPDATE','DELETE','ALL');

    if n_write = 0 then
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t||'_app_write', t);
      raise notice 'restored write access on public.% (no write policy existed)', t;
    end if;

    if not exists(
      select 1 from pg_policies
       where schemaname = 'public' and tablename = t and policyname = t||'_team_read'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_team_viewer())',
        t||'_team_read', t);
    end if;
  end loop;
end
$blk$;

notify pgrst, 'reload schema';

select
  c.relname                                as 표,
  c.relrowsecurity                         as 접근제한_켜짐,
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename=c.relname
      and p.cmd in ('INSERT','UPDATE','DELETE','ALL')) as 쓰기정책,
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename=c.relname
      and p.cmd in ('SELECT','ALL'))                   as 읽기정책
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('dbs','calls')
order by c.relname;
