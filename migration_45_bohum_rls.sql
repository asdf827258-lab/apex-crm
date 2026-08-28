/* 보험 마스터 아카데미 — 익명(anon) 에게 열려 있던 문을 닫는다.

   전에는 이랬습니다.

     create policy s_r on public.bohum_scores for select to anon using (true);

   「to anon using (true)」 는 <로그인 안 한 아무나> 라는 뜻입니다. anon 키는
   교재 페이지에 그대로 박혀 있고(공개용이라 그 자체는 정상입니다), 그래서
   RLS 가 유일한 문인데 그 문이 열려 있었습니다.

     읽기   — 인터넷의 누구나 팀원 이름과 시험 점수를 전부
     넣기   — 누구나 아무 점수나
     고치기 — 누구나 남의 진도를

   쓰기가 특히 위험합니다. 무료 한도를 세 배로 넘겨 로그인까지 막힌 적이
   있는 자리입니다(CLAUDE.md 7번).

   ── 이제 to authenticated 로 바꿉니다 — 이 앱에 로그인한 사람만 ──

     읽기   : 로그인한 팀원끼리    (팀 순위표가 그대로 섭니다)
     넣기   : 자기 이름으로만      (owner_id = auth.uid())
     고치기 : 진도는 본인 줄만.  점수는 아예 못 고칩니다 — 쌓기만 합니다.

   고객 정보는 이 두 표에 없습니다. 담기는 것은 팀·팀원 이름·시험 세트·
   점수·틀린 문항·기기ID·시각뿐입니다.

   ── 이미 쌓여 있는 줄에 대하여 ──

   owner_id 를 이번에 새로 답니다. 그 전에 쌓인 줄은 owner_id 가 비어
   있습니다. 그 줄을 아무도 못 고치게 하면 그분들의 진도가 그 자리에서
   멈추므로, <비어 있는 줄은 로그인한 사람이 한 번 쓸 때 그 사람 것이
   됩니다>(아래 bp_u 의 「owner_id is null」). 다만 with check 가 있어
   고치고 나면 반드시 본인 것이 되고, 그 뒤로는 본인만 고칩니다.

   빈틈을 감추지 않고 적어 둡니다 — 이 사이에는 로그인한 팀원이 남의 옛
   줄을 한 번 가져갈 수 있습니다. 바깥 사람은 못 합니다. 옛 줄을 다
   가져간 뒤에는 아래 한 줄을 돌려 그 틈을 닫으십시오.

     alter policy bp_u on public.bohum_progress using (owner_id = auth.uid());
*/

/* 표가 아직 없으면 여기서 만들어집니다 — 처음 켜실 때도 이 파일 하나면 됩니다.
   이미 있으면 건드리지 않고 넘어갑니다. */
create table if not exists public.bohum_scores (
  id bigserial primary key,
  team text default 'APEX',
  name text,
  set_id text,
  set_name text,
  cat text,
  score numeric,
  max_q int,
  pct int,
  wrong jsonb,
  device text,
  created_at timestamptz default now()
);

create table if not exists public.bohum_progress (
  team text default 'APEX',
  name text,
  done jsonb,
  updated_at timestamptz default now(),
  primary key (team, name)
);

alter table public.bohum_scores   add column if not exists owner_id uuid;
alter table public.bohum_progress add column if not exists owner_id uuid;

alter table public.bohum_scores   enable row level security;
alter table public.bohum_progress enable row level security;

drop policy if exists s_r  on public.bohum_scores;
drop policy if exists s_w  on public.bohum_scores;
drop policy if exists bp_r on public.bohum_progress;
drop policy if exists bp_w on public.bohum_progress;
drop policy if exists bp_u on public.bohum_progress;

create policy s_r on public.bohum_scores
  for select to authenticated using (true);

create policy s_w on public.bohum_scores
  for insert to authenticated with check (owner_id = auth.uid());

create policy bp_r on public.bohum_progress
  for select to authenticated using (true);

create policy bp_w on public.bohum_progress
  for insert to authenticated with check (owner_id = auth.uid());

create policy bp_u on public.bohum_progress
  for update to authenticated
  using (owner_id = auth.uid() or owner_id is null)
  with check (owner_id = auth.uid());

/* 돌린 뒤 확인 — 익명(anon) 에 열린 표가 <한 줄도 안 나와야> 정상입니다. */
select c.relname as 익명에_열린_표, p.polname as 정책
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_policy   p on p.polrelid = c.oid
join pg_roles    r on r.oid = any(p.polroles) and r.rolname = 'anon'
where n.nspname = 'public'
order by 1, 2;
