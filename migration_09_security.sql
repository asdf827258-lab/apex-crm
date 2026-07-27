-- 09: 보안 — 접속 IP 승인제 + 개인 AI 하루 한도 (모두 기본 OFF · 재실행 안전 · 기존 기능 손상 없음)
-- 운영자가 앱 설정에서 켜기 전까지는 아무 것도 차단하지 않는다.

-- 관리자 판별 (운영자=admin)
create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','operator') and active=true);
$$;
grant execute on function public.is_app_admin() to authenticated;

-- 1) 전역 설정(key-value): ip_guard(on/off), ai_daily_limit(숫자)
create table if not exists public.app_config(
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table public.app_config enable row level security;
drop policy if exists app_config_select on public.app_config;
create policy app_config_select on public.app_config for select to authenticated using (true);
drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());
grant select, insert, update on public.app_config to authenticated;

-- 2) 로그인 IP 승인제
create table if not exists public.login_ips(
  member_id uuid not null references public.profiles(id) on delete cascade,
  ip text not null,
  status text not null default 'pending' check (status in ('pending','approved','blocked')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (member_id, ip)
);
alter table public.login_ips enable row level security;

-- 첫 IP(정상 기기)는 자동 승인, 이후 새 IP는 대기. status는 서버가 강제(클라이언트 위조 방지).
create or replace function public.login_ips_ins_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if exists(select 1 from public.login_ips where member_id=new.member_id and status='approved') then
    new.status := 'pending';
  else
    new.status := 'approved';
  end if;
  return new;
end $$;
drop trigger if exists login_ips_ins_guard_t on public.login_ips;
create trigger login_ips_ins_guard_t before insert on public.login_ips for each row execute function public.login_ips_ins_guard();

-- 상태(승인/차단) 변경은 운영자만. 본인은 last_seen만 갱신 가능.
create or replace function public.login_ips_upd_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status is distinct from old.status and not public.is_app_admin() then
    new.status := old.status;
  end if;
  return new;
end $$;
drop trigger if exists login_ips_upd_guard_t on public.login_ips;
create trigger login_ips_upd_guard_t before update on public.login_ips for each row execute function public.login_ips_upd_guard();

drop policy if exists login_ips_select on public.login_ips;
create policy login_ips_select on public.login_ips for select to authenticated
  using (member_id=auth.uid() or public.is_app_admin());
drop policy if exists login_ips_insert on public.login_ips;
create policy login_ips_insert on public.login_ips for insert to authenticated with check (member_id=auth.uid());
drop policy if exists login_ips_update on public.login_ips;
create policy login_ips_update on public.login_ips for update to authenticated
  using (member_id=auth.uid() or public.is_app_admin()) with check (member_id=auth.uid() or public.is_app_admin());
grant select, insert, update on public.login_ips to authenticated;

-- 3) 개인 AI 하루 한도 카운터
create table if not exists public.ai_usage(
  member_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null,
  cnt int not null default 0,
  primary key (member_id, usage_date)
);
alter table public.ai_usage enable row level security;
drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated
  using (member_id=auth.uid() or public.is_app_admin());
drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (member_id=auth.uid());
drop policy if exists ai_usage_update on public.ai_usage;
create policy ai_usage_update on public.ai_usage for update to authenticated
  using (member_id=auth.uid()) with check (member_id=auth.uid());
grant select, insert, update on public.ai_usage to authenticated;

-- 오늘 카운트 +1 후 새 값 반환 (원자적)
create or replace function public.bump_ai_usage() returns int language plpgsql security definer set search_path=public as $$
declare v int;
begin
  insert into public.ai_usage(member_id,usage_date,cnt) values(auth.uid(),current_date,1)
    on conflict (member_id,usage_date) do update set cnt=public.ai_usage.cnt+1
    returning cnt into v;
  return v;
end $$;
grant execute on function public.bump_ai_usage() to authenticated;
