/* ════════════════════════════════════════════════════════════════
   팀장이 쓴 피드백을 팀원 폰으로 바로 꽂는다

   지금까지 리더가 팀원에게 무엇을 남길 자리가 없었다.

       daily_checks    쓰기 규칙이 member_id = auth.uid()
                       → 리더가 팀원 줄에 못 쓴다
       saved_reports   읽기 규칙이 advisor_id = auth.uid() or is_admin()
                       → 팀원이 리더 줄을 못 읽는다

   그래서 자리를 하나 만든다. 딱 한 가지만 담는다 —
   <b>누가 · 누구에게 · 언제 · 무슨 말을</b> 했는가, 그리고 <b>읽었는가</b>.

   보는 잣대는 이미 있는 can_see_perf 를 그대로 쓴다.
   본인 / 대표·관리자 / 내가 리더로 있는 팀의 팀원.
   새 잣대를 만들지 않으므로 권한이 두 갈래로 갈라지지 않는다.

   앞선 마이그레이션이 안 돌아간 환경에서도 이 파일만으로 동작해야
   하므로 필요한 것을 전부 다시 만든다.
   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── 누가 누구를 볼 수 있는가 (migration_43 과 같은 것) ───────── */
create or replace function public.can_see_perf(target uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    target = auth.uid()
    or exists(
         select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin','owner','master','hq','branch_manager')
       )
    or exists(
         select 1
           from public.teams t
           join public.team_members tm on tm.team_id = t.id
          where t.leader_id = auth.uid()
            and tm.member_id = target
       );
$fn$;
grant execute on function public.can_see_perf(uuid) to authenticated;

/* ── 담을 자리 ────────────────────────────────────────────────
   member_id  받는 사람
   from_id    보낸 리더
   fb_date    어느 날 몫인가 (하루 한 줄)
   msg        그 사람에게 한 말
   team_msg   그날 전체에게 한 말 (같이 보여 준다)
   seen_at    팀원이 읽은 시각 — 리더 화면에 「읽음」 으로 뜬다        */
create table if not exists public.team_feedback(
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null,
  from_id    uuid not null,
  from_name  text default '',
  fb_date    date not null,
  msg        text not null default '',
  team_msg   text default '',
  seen_at    timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists team_feedback_uni
  on public.team_feedback(member_id, fb_date, from_id);
create index if not exists team_feedback_member_idx
  on public.team_feedback(member_id, fb_date desc);

alter table public.team_feedback enable row level security;
grant select, insert, update, delete on public.team_feedback to authenticated;

/* 읽기 — 받는 사람 본인, 그리고 그 사람을 볼 수 있는 리더 */
drop policy if exists team_feedback_read on public.team_feedback;
create policy team_feedback_read on public.team_feedback
  for select to authenticated
  using (member_id = auth.uid() or public.can_see_perf(member_id));

/* 넣기 — 내가 볼 수 있는 사람에게만. 보낸 사람은 반드시 나 */
drop policy if exists team_feedback_insert on public.team_feedback;
create policy team_feedback_insert on public.team_feedback
  for insert to authenticated
  with check (public.can_see_perf(member_id) and from_id = auth.uid());

/* 고치기 — 보낸 리더는 내용을, 받은 팀원은 읽음 표시를 고친다.
   팀원이 남의 줄을 건드릴 수는 없다 (member_id = auth.uid() 로 묶인다) */
drop policy if exists team_feedback_update on public.team_feedback;
create policy team_feedback_update on public.team_feedback
  for update to authenticated
  using (from_id = auth.uid() or member_id = auth.uid())
  with check (from_id = auth.uid() or member_id = auth.uid());

/* 지우기 — 보낸 사람만 */
drop policy if exists team_feedback_delete on public.team_feedback;
create policy team_feedback_delete on public.team_feedback
  for delete to authenticated
  using (from_id = auth.uid());

/* ── 고쳐 쓴 시각을 자동으로 남긴다 ───────────────────────────── */
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists team_feedback_touch on public.team_feedback;
create trigger team_feedback_touch before update on public.team_feedback
  for each row execute function public.touch_updated_at();
