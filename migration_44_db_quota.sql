/* ════════════════════════════════════════════════════════════════
   DB 한도 — 한 사람이 한 달에 몇 개까지 받는가

   지금까지 배정에는 한도가 없었다. 그래서 종이(「8월 DB 신청」)에
   16명 × 20칸을 그려 두고 손으로 세고 있었다. 종이가 못 하는 것이
   두 가지 있었다.

     ① 칸에 날짜가 없어 「오늘 전체 몇 개 나갔나」를 못 구한다
        → dbs.assigned_date 가 이미 있으므로 서버에서는 이미 풀린 문제다
     ② 칸이 20개뿐이라 변액 보유자의 50개를 적을 자리가 없다
        → 이 파일이 그 자리를 만든다

   정한 규칙:
     - 기본 한도는 한 달 20개
     - 변액 보유자는 30개를 더해 50개
     - 변액 여부는 고정 명단이 아니라 대표가 화면에서 체크한다
       (이번 달에 열렸다가 다음 달에 닫히는 사람이 있다)
     - 한도를 채우면 더 못 받는다. 대표가 따로 배정해 줄 때만 넘는다

   한도 숫자를 코드에 박지 않는다. 20이 25가 되는 날이 오는데,
   그때 화면을 고치면 지난달 배정률이 소급해서 틀어진다. app_config
   한 줄로 두면 바꾼 시점부터만 달라진다.

   <b>고객 자료(dbs)는 한 줄도 건드리지 않는다.</b> 읽기만 한다.

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   몇 번을 다시 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 한도 숫자는 한 곳에만 둔다 ────────────────────────────────
   app_config 는 09번에서 만들어 두었지만, 이 파일만 따로 돌리는
   서버가 있을 수 있으니 없으면 만든다. */
create table if not exists public.app_config(
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

/* 이미 값이 있으면 건드리지 않는다 — 대표가 고쳐 둔 것을 되돌리면 안 된다.
   on conflict 를 쓰지 않는다. 고유 제약이 어떤 이름으로 걸려 있든 돈다. */
insert into public.app_config(key, value)
select 'db_quota_base', '20'
where not exists (select 1 from public.app_config where key = 'db_quota_base');

insert into public.app_config(key, value)
select 'db_quota_variable_extra', '30'
where not exists (select 1 from public.app_config where key = 'db_quota_variable_extra');

/* ── ② 변액 보유 여부 ────────────────────────────────────────────
   profiles 에 칸을 더하지 않고 표를 따로 둔다. profiles 는 로그인·권한이
   걸린 표라 칸 하나를 더할 때마다 정책을 다시 봐야 한다. 여기 있는 것은
   「이 사람이 이번에 변액을 들고 있나」 하나뿐이다.

   quota_override 는 사람마다 특별히 정해 준 한도다. 비어 있으면 규칙대로
   계산하고, 값이 있으면 그 값이 이긴다. 대표가 「저 사람은 이번 달만 70」
   이라고 정하는 자리가 없으면 결국 화면 밖에서 따로 세게 된다. */
create table if not exists public.db_quota_flags(
  member_id      uuid primary key,
  has_variable   boolean not null default false,
  quota_override int,
  updated_at     timestamptz not null default now(),
  updated_by     uuid
);

alter table public.db_quota_flags add column if not exists quota_override int;
alter table public.db_quota_flags add column if not exists updated_at timestamptz not null default now();
alter table public.db_quota_flags add column if not exists updated_by uuid;

/* 음수 한도는 화면에서 나눗셈을 터뜨린다. 아예 못 들어오게 막는다. */
alter table public.db_quota_flags drop constraint if exists db_quota_flags_override_chk;
alter table public.db_quota_flags add constraint db_quota_flags_override_chk
  check (quota_override is null or quota_override >= 0);

alter table public.db_quota_flags enable row level security;

grant select on public.db_quota_flags to authenticated;
grant insert, update, delete on public.db_quota_flags to authenticated;

/* 읽기는 모두에게. 팀원이 자기 배정률을 보려면 자기 한도를 알아야 하고,
   남의 한도가 보이는 것은 어차피 종이 시절에도 벽에 붙어 있었다. */
drop policy if exists db_quota_flags_read on public.db_quota_flags;
create policy db_quota_flags_read on public.db_quota_flags
  for select to authenticated using (true);

/* 쓰기는 대표·운영자만. 변액 체크가 곧 한도 30개라서, 본인이 켤 수 있으면
   한도가 한도가 아니게 된다. */
drop policy if exists db_quota_flags_write on public.db_quota_flags;
create policy db_quota_flags_write on public.db_quota_flags
  for all to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());

/* ── ③ 한도를 답하는 곳은 하나뿐이다 ─────────────────────────────
   화면에서도 세고 서버에서도 세면 두 숫자가 갈라진다. 갈라지면 팀원은
   자기한테 유리한 쪽을 믿는다. 그래서 답하는 자리를 하나로 둔다.

   app_config 값은 사람이 손으로 고치는 칸이라 「20 」 이나 「스무개」가
   들어올 수 있다. 숫자꼴일 때만 쓰고, 아니면 기본값으로 물러난다.
   여기서 터지면 배정 화면 전체가 안 뜬다. */
create or replace function public.db_quota_num(k text, fallback int)
returns int language sql stable security definer set search_path = public as $fn$
  select coalesce(
    (select btrim(value)::int
       from public.app_config
      where key = k and btrim(coalesce(value,'')) ~ '^[0-9]+$'),
    fallback
  );
$fn$;
grant execute on function public.db_quota_num(text, int) to authenticated;

create or replace function public.db_quota_of(member uuid)
returns int language sql stable security definer set search_path = public as $fn$
  select coalesce(
    (select f.quota_override from public.db_quota_flags f where f.member_id = member),
    public.db_quota_num('db_quota_base', 20)
    + case
        when coalesce((select f.has_variable from public.db_quota_flags f
                        where f.member_id = member), false)
        then public.db_quota_num('db_quota_variable_extra', 30)
        else 0
      end
  );
$fn$;
grant execute on function public.db_quota_of(uuid) to authenticated;


/* ── ④ 화면은 한도를 스스로 계산하지 않는다 ──────────────────────
   ③ 이 한도를 답하는데 화면에서 또 「20 더하기 30」 을 하면 답하는 자리가
   둘이 된다. 둘이 되면 한도를 25로 바꾼 날 한쪽만 바뀌고, 팀원은 자기한테
   유리한 쪽을 믿는다. 그래서 계산은 여기서만 하고 화면은 <b>받아 쓰기만</b> 한다.

   사람마다 한 줄씩 선다. db_quota_flags 에 아직 줄이 없는 사람도
   기본 한도로 나온다 — 체크를 한 번도 안 한 사람이 화면에서 빠지면
   「저 사람은 왜 없냐」가 된다. */
create or replace view public.db_quota_list as
select
  p.id                                as member_id,
  coalesce(f.has_variable, false)     as has_variable,
  f.quota_override                    as quota_override,
  public.db_quota_of(p.id)            as quota
from public.profiles p
left join public.db_quota_flags f on f.member_id = p.id;

grant select on public.db_quota_list to authenticated;

/* 뷰는 만든 사람 권한으로 도는 것이 기본이라, 그대로 두면 profiles 의 RLS 를
   비켜 간다. 보는 사람 권한으로 돌게 바꾼다. 옛 서버(PG 14 이하)에는 이
   설정이 없으므로 없으면 조용히 지나간다 — 여기서 멈추면 위의 것까지
   안 들어간다. */
do $mig$
begin
  execute 'alter view public.db_quota_list set (security_invoker = on)';
exception when others then
  raise notice 'security_invoker 를 걸지 못했습니다(옛 서버). 뷰 권한을 직접 확인하십시오.';
end
$mig$;

notify pgrst, 'reload schema';

/* ── ⑤ 지금 어떻게 되어 있는지 보여 준다 ─────────────────────────
   실행하면 아래 표가 뜬다. 한도 두 줄과 정책 두 줄이 보이면 끝난 것이다. */
select 'config' as what, key as name, value as detail
  from public.app_config
 where key in ('db_quota_base', 'db_quota_variable_extra')
union all
select 'policy', policyname, cmd::text
  from pg_policies
 where tablename = 'db_quota_flags'
union all
select 'check', '기본 한도', public.db_quota_num('db_quota_base', 20)::text
union all
select 'check', '변액 포함 한도',
       (public.db_quota_num('db_quota_base', 20)
        + public.db_quota_num('db_quota_variable_extra', 30))::text
order by what, name;
